'use strict';
/* Der Rechenkern wird geprueft, BEVOR eine These auf ihm gemessen wird.
 * Ein Fehler hier waere in allen drei Ergebnissen und in keinem sichtbar. */
var fs = require('fs');
var path = require('path');
var T = require('./tageshilfen.js');

var STORE = process.env.MD_STORE || path.join(process.env.APPDATA || '', 'Markt-Dashboard', 'store');
var fehler = 0;
function ok(b, text, wert) {
  console.log((b ? '  ✅ ' : '  ❌ ') + text + (wert !== undefined ? '  [' + wert + ']' : ''));
  if (!b) fehler++;
}

var syms = fs.readdirSync(STORE).filter(function (f) { return f.indexOf('bars_60m_') === 0; })
  .map(function (f) { return f.slice(9, -5); }).filter(function (s) { return s.indexOf('-USD') === -1; });
console.log('Rechenkern-Pruefung auf ' + syms.length + ' Werten.\n');

/* --- 1) Sitzungsschluss: gegen die Wahrheit, die den naechsten Tag SIEHT --- */
console.log('1) Sitzungsschluss ohne Blick nach vorn');
var trefferGes = 0, falschPositiv = 0, verpasst = 0, echteGes = 0;
syms.forEach(function (sym) {
  var b = JSON.parse(fs.readFileSync(path.join(STORE, 'bars_60m_' + sym + '.json'), 'utf8')).series;
  var c = T.X(b);
  for (var i = 0; i < b.length - 1; i++) {
    /* Wahrheit mit Zukunftsblick - nur im Test erlaubt. */
    var echt = new Date(b[i][0]).getUTCDate() !== new Date(b[i + 1][0]).getUTCDate();
    if (echt) echteGes++;
    if (c.ende[i] && echt) trefferGes++;
    else if (c.ende[i] && !echt) falschPositiv++;
    else if (!c.ende[i] && echt) verpasst++;
  }
});
ok(falschPositiv === 0,
   'Kein falscher Sitzungsschluss - der Kalenderweg erfindet nie einen Schluss', falschPositiv);
ok(trefferGes / echteGes > 0.98,
   'Mindestens 98 % der echten Sitzungsschluesse werden erkannt',
   (100 * trefferGes / echteGes).toFixed(2) + ' %, verpasst: ' + verpasst);

/* --- 2) Kein Zugriff jenseits von i --- */
console.log('\n2) Vorgriff-Sperre');
(function () {
  var b = JSON.parse(fs.readFileSync(path.join(STORE, 'bars_60m_AAPL.json'), 'utf8')).series;
  /* Eine Kopie, bei der ALLES ab Index i unbrauchbar gemacht wird. Wer nur bars[0..i]
   * liest, bekommt dasselbe Ergebnis wie auf der vollen Reihe. */
  var i = 3000;
  var gestutzt = b.slice(0, i + 1);
  var cVoll = T.X(b), cKurz = T.X(gestutzt);
  var dVoll = T.stundenDrift(cVoll, b, i, 60);
  var dKurz = T.stundenDrift(cKurz, gestutzt, i, 60);
  ok(dVoll && dKurz && Math.abs(dVoll.mittel - dKurz.mittel) < 1e-12,
     'stundenDrift liefert auf der gestutzten Reihe dasselbe wie auf der vollen',
     dVoll && dKurz ? dVoll.mittel.toExponential(4) + ' vs ' + dKurz.mittel.toExponential(4) : 'null');

  /* Dasselbe fuer die Tagesstreuung an einer Schlusskerze. */
  var j = -1, si = -1;
  for (var k = i; k > 2000; k--) if (cVoll.ende[k]) { si = k; j = cVoll.tagNr[k]; break; }
  var gz = b.slice(0, si + 1);
  var cG = T.X(gz);
  ok(Math.abs(T.tagesSd(cVoll, j, 60) - T.tagesSd(cG, cG.tagNr[si], 60)) < 1e-15,
     'tagesSd liefert auf der gestutzten Reihe dasselbe wie auf der vollen');
})();

/* --- 3) Der Stunden-Ertrag ist die Groesse, die die Maschine abrechnet --- */
console.log('\n3) Gemessene Groesse = abgerechnete Groesse');
(function () {
  var b = JSON.parse(fs.readFileSync(path.join(STORE, 'bars_60m_MSFT.json'), 'utf8')).series;
  var c = T.X(b);
  var i = 2500;
  /* Die Maschine steigt zu b[i][1] ein und bei H=1 zu b[i+1][1] aus. */
  var abgerechnet = b[i + 1][1] / b[i][1] - 1;
  ok(Math.abs(c.folgeRet[i] - abgerechnet) < 1e-15,
     'folgeRet[i] ist genau die Rendite, die die Maschine bei H=1 abrechnet',
     c.folgeRet[i].toExponential(4));
  /* Und die Drift mittelt genau diese Groesse ueber vergangene Vorkommen. */
  var d = T.stundenDrift(c, b, i, 60);
  ok(d && d.n >= 48, 'stundenDrift stuetzt sich auf mindestens 48 vergangene Vorkommen', d && d.n);
})();

/* --- 4) Umsatz-Median: derselbe Stundenkorb, nie die eigene Kerze --- */
console.log('\n4) Umsatz-Median');
(function () {
  var b = JSON.parse(fs.readFileSync(path.join(STORE, 'bars_60m_NVDA.json'), 'utf8')).series;
  var c = T.X(b);
  var i = 3000, h = c.stunde[i], L = c.stdListe[h], q = c.stdPos[i];
  var eigene = [];
  for (var z = q - 60; z < q; z++) eigene.push(b[L[z]][2] || 0);
  eigene.sort(function (x, y) { return x - y; });
  var soll = (eigene[29] + eigene[30]) / 2;
  ok(Math.abs(c.volMed[i] - soll) < 1e-9, 'volMed[i] ist der Median der 60 vorigen Vorkommen derselben Stunde');
  ok(L.slice(q - 60, q).indexOf(i) === -1, 'Die eigene Kerze steckt nicht im Korb');
  var alleGleicheStunde = L.slice(q - 60, q).every(function (idx) { return c.stunde[idx] === h; });
  ok(alleGleicheStunde, 'Alle Korb-Kerzen haben dieselbe UTC-Stunde');
})();

console.log(fehler ? '\n' + fehler + ' FEHLER' : '\nRECHENKERN IN ORDNUNG');
process.exit(fehler ? 1 : 0);
