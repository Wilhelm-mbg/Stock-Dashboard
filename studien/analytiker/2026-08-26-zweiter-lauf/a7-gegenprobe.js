'use strict';
/* ANALYTIKER-GEGENPROBE (Nacht auf 26.08.2026, zweiter Lauf): Kontrollgruppen-
 * Konstruktion / A7-Lesefenster, als externer Gutachter und UNABHAENGIG von
 * test-messmaschine.js gebaut.
 *
 * Teil 1: Die Ausschnitt-Arithmetik von erwartung() gegen eine Brute-Force-
 *         Rechnung auf einem kleinen Kunstuniversum.
 * Teil 2: Ende-zu-Ende: ein Signal, das auf die eigene Vergangenheit selektiert
 *         (Ruecksetzer-Koeder), auf einem Zufallspfad ohne jeden echten Effekt.
 *         Wahrer Ueberschuss = 0. Mit A7-Fenster muss die Maschine ~0 messen;
 *         ohne Angabe des Fensters muss die A6-Verschiebung sichtbar werden
 *         (und die Maschine muss davor warnen).
 *
 * Der Zufall ist ein eigener LCG (mulberry32) mit festem Startwert - derselbe
 * Aufruf ergibt dasselbe. Kein Math.random.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var M = require('../../messmaschine/messmaschine.js');

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/* Box-Muller aus zwei Gleichverteilten */
function gauss(rnd) {
  var u = 0, v = 0;
  while (u === 0) u = rnd();
  while (v === 0) v = rnd();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/* ---------- Kunstarchiv: N Symbole, T Kerzen, 7 Kerzen je Handelstag, iid-Schritte ---------- */
var N = 20, T = 3200, JE_TAG = 7, SD = 0.005;
var START_MS = Date.UTC(2018, 0, 1, 14, 0, 0);
function baueArchiv(dir, seed) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  for (var s = 0; s < N; s++) {
    var rnd = mulberry32(seed + s * 7919);
    var series = [];
    var kurs = 100;
    for (var i = 0; i < T; i++) {
      var tag = Math.floor(i / JE_TAG), pos = i % JE_TAG;
      var ms = START_MS + tag * 86400000 + pos * 3600000;
      var open = kurs;
      kurs = kurs * (1 + SD * gauss(rnd));
      var hi = Math.max(open, kurs) * (1 + 0.001 * rnd());
      var lo = Math.min(open, kurs) * (1 - 0.001 * rnd());
      series.push([ms, kurs, 0, hi, lo, open]);
    }
    fs.writeFileSync(path.join(dir, 'bars_60m_SYM' + s + '.json'), JSON.stringify({ series: series }));
  }
}

var ARCHIV = path.join(os.tmpdir(), 'analytiker-a7-gegenprobe');
baueArchiv(ARCHIV, 20260826);

var fehler = 0;
function pruefe(name, ok, detail) {
  console.log((ok ? '  OK  ' : '  FEHLER ') + name + (detail ? '  [' + detail + ']' : ''));
  if (!ok) fehler++;
}

/* ================= Teil 1: erwartung()-Arithmetik gegen Brute-Force ================= */
console.log('\nTeil 1: Ausschnitt-Arithmetik von erwartung()');
(function () {
  /* Miniuniversum direkt im Speicher: 1 Symbol, bekannte Werte. */
  var b = [];
  var rnd = mulberry32(42);
  var kurs = 100;
  for (var i = 0; i < 700; i++) {
    var tag = Math.floor(i / JE_TAG), pos = i % JE_TAG;
    var ms = START_MS + tag * 86400000 + pos * 3600000;
    var open = kurs;
    kurs = kurs * (1 + SD * gauss(rnd));
    b.push([ms, kurs, 0, kurs, kurs, open]);
  }
  var U = { X: b };
  var H = 3, vorlauf = 261;
  /* Schnitt-Tag so, dass beide Haelften gefuellt sind */
  var tage = {};
  b.forEach(function (k) { tage[new Date(k[0]).toISOString().slice(0, 10)] = 1; });
  var alle = Object.keys(tage).sort();
  var schnittTag = alle[Math.floor(alle.length / 2)];

  var K = M._intern.baueKontrolle(U, H, schnittTag, vorlauf, null, {}, 'schlusskerze');

  /* Brute-Force: denselben Topf selbst bauen (Werte NACH der 1-%-Stutzung sind in
   * erwartung() verrechnet; bei Topfgroesse < 50 stutzt die Maschine nicht - das
   * Miniuniversum haelt die Toepfe klein genug, um exakt vergleichen zu koennen). */
  function schicht(i) {
    var pos = i % JE_TAG;
    var grenze = (i + 1 >= b.length) || ((i + 1) % JE_TAG === 0);
    return pos + (grenze ? 'G' : 'I');
  }
  function halb(i) { return new Date(b[i][0]).toISOString().slice(0, 10) < schnittTag ? 'entdeckung' : 'bestaetigung'; }
  function bruteErwartung(stunde, hf, von, bis) {
    var s = 0, n = 0;
    for (var j = vorlauf; j < b.length - H; j++) {
      if (schicht(j) !== stunde || halb(j) !== hf) continue;
      if (von != null && j >= von && j <= bis) continue;
      s += b[j + H][1] / b[j][1] - 1; n++;
    }
    return n >= 20 ? s / n : null;
  }

  var faelle = 0, maxAbw = 0, randOk = true;
  for (var i = 300; i < 640; i += 17) {
    var st = schicht(i), hf = halb(i);
    var lese = 30;
    var von = i - lese - H, bis = i + H - 1;
    var a = K.erwartung('X', st, hf, von, bis);
    var c = bruteErwartung(st, hf, von, bis);
    if (a == null && c == null) { faelle++; continue; }
    if ((a == null) !== (c == null)) { randOk = false; continue; }
    maxAbw = Math.max(maxAbw, Math.abs(a - c));
    faelle++;
  }
  pruefe('Ausschnitt [i-lese-H, i+H-1] stimmt mit Brute-Force ueberein', randOk && maxAbw < 1e-12,
    faelle + ' Faelle, groesste Abweichung ' + maxAbw.toExponential(2));

  /* Grenzfall: Fenster so gross, dass unter 20 Kerzen bleiben -> null, kein Rest-Mittel */
  var g = K.erwartung('X', schicht(310), halb(310), 0, b.length);
  pruefe('Unter 20 Restkerzen liefert erwartung() null (kein stilles Duennmittel)', g === null);
})();

/* ================= Teil 2: A6/A7 Ende-zu-Ende auf dem Kunstarchiv ================= */
console.log('\nTeil 2: Selektions-Signal auf Zufallspfad (wahrer Ueberschuss 0)');
var LESE = 30;
function koederStrategie(mitFenster) {
  return {
    key: 'a7-koeder' + (mitFenster ? '-mit' : '-ohne'),
    grund: 'Analytiker-Gegenprobe: Ruecksetzer-Koeder auf iid-Zufallspfad. Der wahre Ueberschuss ist exakt null; gemessen wird die Maschine, nicht der Markt.',
    zeitrahmen: '60m',
    haltedauerKerzen: 3,
    richtung: 'long',
    universum: function () { return true; },
    leseFensterKerzen: mitFenster ? LESE : undefined,
    kosten: { spanneBp: 0 },
    signal: function (bars, i) {
      if (i < LESE) return null;
      var r = bars[i][1] / bars[i - LESE][1] - 1;
      return r < -0.02 ? { dir: 1 } : null;   // selektiert hart auf die eigene Vergangenheit
    },
  };
}

var mit = M.messe(koederStrategie(true), ARCHIV);
var ohne = M.messe(koederStrategie(false), ARCHIV);

function kurz(e) {
  var u = e.ergebnisse[0].bestaetigung.ueberschuss;
  return { tm: u.tagesmittel, mde: u.mde, t: u.t, tage: u.tage, signale: u.signale };
}
var km = kurz(mit), ko = kurz(ohne);
console.log('  mit A7-Fenster : ' + (km.tm * 100).toFixed(4) + ' Pp, MDE ' + (km.mde * 100).toFixed(4) +
  ' Pp, t ' + km.t.toFixed(2) + ', ' + km.signale + ' Signale / ' + km.tage + ' Tage');
console.log('  ohne Fenster   : ' + (ko.tm * 100).toFixed(4) + ' Pp, MDE ' + (ko.mde * 100).toFixed(4) +
  ' Pp, t ' + ko.t.toFixed(2) + ', ' + ko.signale + ' Signale / ' + ko.tage + ' Tage');

pruefe('Mit A7-Fenster liegt der Nullpunkt im Rahmen (|tm| < MDE)', Math.abs(km.tm) < km.mde);
pruefe('Ohne Fensterangabe warnt die Maschine (A7)', ohne.warnungen.some(function (w) { return w.kennung === 'A7'; }));
pruefe('Urteil mit Fenster ist kein "bestaetigt"', mit.urteile[0] !== 'bestaetigt', mit.urteile[0]);
console.log('  (A6-Verschiebung ohne Fenster: ' + ((ko.tm - km.tm) * 100).toFixed(4) + ' Pp - zur Kenntnis, kein Pruefkriterium: bei iid-Schritten und grossen Toepfen ist sie klein)');

/* Placebo der Maschine auf dem Kunstarchiv - der Nullpunkt, den sie selbst berichtet */
if (mit.placebo) {
  console.log('  Maschinen-Placebo (Bestaetigung): ' + (mit.placebo.tagesmittel * 100).toFixed(4) +
    ' Pp, t ' + mit.placebo.t.toFixed(2) + ', MDE ' + (mit.placebo.mde * 100).toFixed(4) + ' Pp');
  pruefe('Maschinen-Placebo auf Kunstarchiv im Rahmen', Math.abs(mit.placebo.tagesmittel) <= mit.placebo.mde);
}

/* ================= Teil 3: Beleg fuer den Aussicht-Defekt ================= */
console.log('\nTeil 3: "aussicht" (Tage bis t=2)');
var urteilEintraege = mit.entscheidungen.filter(function (e) { return e.regel.indexOf('Urteil') === 0; })
  .concat(ohne.entscheidungen.filter(function (e) { return e.regel.indexOf('Urteil') === 0; }));
var positive = urteilEintraege.filter(function (e) { return e.eingabe.ueberschussTagesmittelPp > 0; });
var mitAussicht = positive.filter(function (e) { return e.ergebnis.aussicht != null; });
console.log('  Urteile mit positivem Punktschaetzer: ' + positive.length + ', davon mit aussicht: ' + mitAussicht.length);

console.log('\n' + (fehler ? 'GEGENPROBE MIT ' + fehler + ' FEHLERN' : 'GEGENPROBE OHNE BEFUND IN TEIL 1/2'));
process.exit(fehler ? 1 : 0);
