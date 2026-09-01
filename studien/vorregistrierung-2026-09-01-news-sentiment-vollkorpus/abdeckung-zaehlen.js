'use strict';
/* ABDECKUNG JE MONAT - der Befund, der den Fensterstart bestimmt.
 *
 * ANLASS: Die News-WAND liegt bei 2017-04-10 (GRATIS-PRUEFUNG.md, binaer gesucht,
 * HTTP 200). Eine Wand sagt aber nur, wo die AELTESTE Meldung liegt - nicht, ob
 * dahinter genug steht. AAPL, der meistbeschriebene Wert der Welt, hat 2017 GENAU
 * EINE Meldung und 2021 dann 4.296. Wer die 2.367 Handelstage ab 2017 als
 * Beobachtungsfenster nimmt, zaehlt Jahre mit, in denen nichts zu messen ist.
 *
 * Genau diese Luecke war in GRATIS-PRUEFUNG.md als offen markiert:
 * "Abdeckungsdichte ueber die Jahre. Ob 2017 so dicht berichtet ist wie 2026, ist
 * ungezaehlt. Muss vorab je Jahr gezaehlt werden." Hier wird sie gezaehlt.
 *
 * REGEL FUER DEN FENSTERSTART, festgelegt BEVOR irgendein Ertrag gegen einen Score
 * gehalten wurde: Der Start ist der erste Monat, ab dem die Abdeckung (Anteil der
 * Symbol-Tage mit mindestens einer Meldung) >= 50 % liegt UND danach nicht wieder
 * dauerhaft darunter faellt. 50 %, weil die Machbarkeitsrechnung der
 * Vorregistrierung mit 56,2 % Dichte gerechnet hat - unter der Haelfte traegt das
 * Fenster seine eigene Annahme nicht mehr.
 *
 * Diese Datei sieht KEINE Ertraege. Sie zaehlt Meldungen. */
var fs = require('fs');
var path = require('path');
var Q = require('../../quant.js');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv1d';
var START = '2017-04-10', ENDE = '2026-08-28';
function sommer(ms) { return Q.usSommerzeit(new Date(ms)); }
function tagVon(ms) { return new Date(ms - (sommer(ms) ? 4 : 5) * 3600000).toISOString().slice(0, 10); }
function schlussMs(tg) {
  var p = tg.split('-'), probe = Date.UTC(+p[0], +p[1] - 1, +p[2], 16);
  return Date.UTC(+p[0], +p[1] - 1, +p[2], sommer(probe) ? 20 : 21, 0, 0);
}

var uni = JSON.parse(fs.readFileSync(path.join(__dirname, 'universum.json'), 'utf8')).universum
  .map(function (u) { return u.sym; });
var news = {}, fehlt = [];
uni.forEach(function (s) {
  var p = path.join(__dirname, 'korpus', s + '.json');
  if (!fs.existsSync(p)) { fehlt.push(s); return; }
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!j.erschoepft) { fehlt.push(s + '(abgebrochen)'); return; }
  news[s] = j.items.map(function (a) { return { t: a[0], title: a[1] }; }).sort(function (a, b) { return a.t - b.t; });
});
if (fehlt.length) { console.error('Korpus unvollstaendig: ' + fehlt.join(', ')); process.exit(3); }
var da = Object.keys(news);
console.log('Korpus: ' + da.length + ' Werte, ' + da.reduce(function (a, s) { return a + news[s].length; }, 0) + ' Meldungen');

/* Handelstage aus archiv1d (nur Zeitstempel) */
var ser = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + da[0] + '.json'), 'utf8')).series;
var TAGE = [];
for (var i = 0; i < ser.length; i++) { var d = tagVon(ser[i][0]); if (d >= START && d <= ENDE) TAGE.push(d); }

var jeMonat = {};
var zeiger = {}; da.forEach(function (s) { zeiger[s] = 0; });
TAGE.forEach(function (tg) {
  var cut = schlussMs(tg), mon = tg.slice(0, 7);
  var m = jeMonat[mon] || (jeMonat[mon] = { tage: 0, mit: 0, score: 0, n: 0 });
  m.tage++;
  da.forEach(function (s) {
    var liste = news[s], z = zeiger[s];
    while (z < liste.length && liste[z].t <= cut) z++;
    zeiger[s] = z;
    var f = liste.slice(Math.max(0, z - 12), z);
    m.n++;
    if (!f.length) return;
    /* Nur Meldungen der letzten 48 h zaehlen als "abgedeckt" - aeltere haetten im
     * Live-Fenster das Gewicht 0,15 und stuenden nur da, weil nichts Neues kam. */
    if (cut - f[f.length - 1].t > 48 * 3600000) return;
    m.mit++;
    if (Q.sentiment(f, cut).score !== 0) m.score++;
  });
});

console.log('\nMonat    Symbol-Tage  mit Meldung(<=48h)   Score != 0');
var monate = Object.keys(jeMonat).sort(), erster = null, jahre = {};
monate.forEach(function (mo) {
  var m = jeMonat[mo], aM = m.mit / m.n, aS = m.score / m.n;
  var j = mo.slice(0, 4);
  (jahre[j] = jahre[j] || { n: 0, mit: 0, score: 0 });
  jahre[j].n += m.n; jahre[j].mit += m.mit; jahre[j].score += m.score;
  if (aM >= 0.50 && erster === null) erster = mo;
  if (aM < 0.50) erster = null;                     // muss ab da HALTEN
});
Object.keys(jahre).sort().forEach(function (j) {
  var y = jahre[j];
  console.log('  ' + j + '   ' + String(y.n).padStart(6) + '   ' +
    (100 * y.mit / y.n).toFixed(1).padStart(5) + ' %   ' + (100 * y.score / y.n).toFixed(1).padStart(5) + ' %');
});
console.log('\nErster Monat mit dauerhaft >= 50 % Abdeckung: ' + erster);
/* Monatsdetail um den Uebergang */
if (erster) {
  var idx = monate.indexOf(erster);
  console.log('Uebergang (6 Monate davor bis 3 danach):');
  monate.slice(Math.max(0, idx - 6), idx + 4).forEach(function (mo) {
    var m = jeMonat[mo];
    console.log('  ' + mo + '  ' + (100 * m.mit / m.n).toFixed(1).padStart(5) + ' % mit Meldung   ' +
      (100 * m.score / m.n).toFixed(1).padStart(5) + ' % Score != 0');
  });
}
var ab = monate.filter(function (mo) { return mo >= erster; });
var nGes = ab.reduce(function (a, mo) { return a + jeMonat[mo].n; }, 0);
var sGes = ab.reduce(function (a, mo) { return a + jeMonat[mo].score; }, 0);
var tGes = ab.reduce(function (a, mo) { return a + jeMonat[mo].tage; }, 0);
console.log('\nAb ' + erster + ': ' + tGes + ' Handelstage, ' + nGes + ' Symbol-Tage, ' +
  sGes + ' mit Score != 0 = ' + (100 * sGes / nGes).toFixed(1) + ' %');
fs.writeFileSync(path.join(__dirname, 'abdeckung.json'), JSON.stringify({
  regel: 'erster Monat mit dauerhaft >= 50 % Abdeckung (Meldung <= 48 h vor Schluss)',
  fensterstartNeu: erster, jeMonat: jeMonat, jeJahr: jahre,
  abStart: { handelstage: tGes, symbolTage: nGes, mitScore: sGes, dichte: sGes / nGes }
}, null, 1));
console.log('abdeckung.json geschrieben.');
