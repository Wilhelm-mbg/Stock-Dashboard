'use strict';
/* AUSWERTUNG DER QUERSCHNITTS-EICHUNG.
 *
 * Liest die Protokolle und wertet die vorregistrierten Endpunkte aus. Rechnet NICHTS neu,
 * was schon gemessen ist - die se-Werte beider Kontrollen stehen als Entscheidung
 * "QS Querschnitts-Kontrolle" in jedem Protokoll.
 *
 * ABWEICHUNG VON DER VORREGISTRIERUNG, hier deklariert statt verschwiegen:
 * Vorregistriert war ein "Block-Bootstrap ueber Kalenderjahre". Der braucht se-Werte je
 * Jahr, und die gibt die Maschine nicht aus - ihn nachzuruesten hiesse, das Messgeschirr
 * mitten in der Studie zu aendern. Stattdessen laeuft ein CLUSTER-BOOTSTRAP UEBER
 * STRATEGIEN: gezogen werden ganze Strategien (mit allen ihren Varianten), nicht einzelne
 * Varianten - Varianten derselben Strategie sind nicht unabhaengig.
 * Das beantwortet dieselbe Frage ("wie sicher ist der Median-Faktor?") und ist gegenueber
 * dem Jahres-Bootstrap eher konservativer, weil die Zahl der Cluster (9) kleiner ist als
 * die Zahl der Jahre (40). Die Entscheidungsschwellen bleiben unveraendert.
 *
 * Aufruf: node studien/vorregistrierung-2026-08-25-querschnitt/auswerten.js
 */
var fs = require('fs'), path = require('path');

var WURZEL = path.resolve(__dirname, '..', '..');
var DIR = path.join(WURZEL, 'studien', 'messmaschine', 'protokolle');

/* Einteilung, VOR dem Lauf in EINTEILUNG.md festgeschrieben. */
var AUSWAHL_PRIMAER = { 'momentum': 1, 'quartalsschub-betrag': 1 };
var AUSWAHL_STRENG = { 'quartalsschub-betrag': 1 };
var MACHTLOS = { 'monatswende-breit': 1, 'monatsende-kauf': 1, 't3-stundendrift': 1 };

/* Nur der juengste Lauf je Strategie - aeltere stammen von vor der Querschnitts-Kontrolle. */
var jeKey = {};
fs.readdirSync(DIR).filter(function (f) { return /\.json$/.test(f); }).forEach(function (f) {
  var p; try { p = JSON.parse(fs.readFileSync(path.join(DIR, f), 'utf8')); } catch (e) { return; }
  var k = p.strategie && p.strategie.key; if (!k) return;
  var hatQS = (p.entscheidungen || []).some(function (e) { return e.regel.indexOf('QS ') === 0; });
  if (!hatQS) return;
  var st = fs.statSync(path.join(DIR, f)).mtimeMs;
  if (!jeKey[k] || jeKey[k].st < st) jeKey[k] = { st: st, p: p, datei: f };
});

var strategien = Object.keys(jeKey).sort();
if (!strategien.length) { console.error('Kein Protokoll mit Querschnitts-Kontrolle gefunden.'); process.exit(2); }

var zeilen = [];
strategien.forEach(function (k) {
  var p = jeKey[k].p;
  (p.entscheidungen || []).filter(function (e) { return e.regel.indexOf('QS ') === 0; })
    .forEach(function (e) {
      if (e.ergebnis.faktor == null) return;
      zeilen.push({
        key: k, v: e.eingabe.variante,
        seA: e.ergebnis.seA7Pp, seQ: e.ergebnis.seQuerschnittPp, f: e.ergebnis.faktor,
        uA: e.ergebnis.ueberschussA7Pp, uQ: e.ergebnis.ueberschussQuerschnittPp,
        ohne: e.eingabe.ohneErwartung,
        klasse: MACHTLOS[k] ? 'machtlos' : (AUSWAHL_PRIMAER[k] ? 'AUSWAHL' : 'TIMING')
      });
    });
});

function median(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; }

console.log('QUERSCHNITTS-EICHUNG — ' + zeilen.length + ' Varianten aus ' + strategien.length + ' Strategien\n');
console.log('Strategie'.padEnd(24) + 'V  ' + 'se A7'.padStart(8) + 'se QS'.padStart(8) + 'Faktor'.padStart(8) +
            '   Ueber A7'.padStart(11) + 'Ueber QS'.padStart(10) + '  Klasse');
zeilen.slice().sort(function (a, b) { return b.f - a.f; }).forEach(function (r) {
  console.log(r.key.slice(0, 23).padEnd(24) + r.v + '  ' +
    r.seA.toFixed(4).padStart(8) + r.seQ.toFixed(4).padStart(8) + r.f.toFixed(3).padStart(8) +
    r.uA.toFixed(4).padStart(11) + r.uQ.toFixed(4).padStart(10) + '  ' + r.klasse);
});

var alleF = zeilen.map(function (r) { return r.f; });
console.log('\nPRIMAERER ENDPUNKT  f = se(A7) / se(Querschnitt)');
console.log('  Median ueber alle ' + alleF.length + ' Varianten: ' + median(alleF).toFixed(3));
console.log('  Spanne: ' + Math.min.apply(null, alleF).toFixed(3) + ' bis ' + Math.max.apply(null, alleF).toFixed(3));

/* Cluster-Bootstrap ueber Strategien, deterministisch (mulberry32, fester Keim). */
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var jeStrategie = {};
zeilen.forEach(function (r) { (jeStrategie[r.key] = jeStrategie[r.key] || []).push(r.f); });
var cluster = Object.keys(jeStrategie);
var rnd = mulberry32(20260825), mediane = [];
for (var b = 0; b < 5000; b++) {
  var zieh = [];
  for (var c = 0; c < cluster.length; c++) {
    var k = cluster[Math.floor(rnd() * cluster.length)];
    zieh = zieh.concat(jeStrategie[k]);
  }
  mediane.push(median(zieh));
}
mediane.sort(function (a, b) { return a - b; });
var lo = mediane[Math.floor(0.025 * mediane.length)], hi = mediane[Math.floor(0.975 * mediane.length)];
console.log('  Cluster-Bootstrap ueber ' + cluster.length + ' Strategien, 5.000 Ziehungen:');
console.log('    95-%-Band des Medians: ' + lo.toFixed(3) + ' bis ' + hi.toFixed(3));

console.log('\n  ENTSCHEIDUNGSREGEL (vorregistriert):');
var medF = median(alleF);
var ja = medF >= 1.5 && lo > 1.2;
var nein = hi < 1.3;
console.log('    JA   verlangt Median >= 1,5 UND unteres Ende > 1,2   ->  ' +
  medF.toFixed(3) + ' / ' + lo.toFixed(3) + '  =  ' + (ja ? 'ERFUELLT' : 'nicht erfuellt'));
console.log('    NEIN verlangt oberes Ende < 1,3                      ->  ' +
  hi.toFixed(3) + '  =  ' + (nein ? 'ERFUELLT' : 'nicht erfuellt'));
console.log('    URTEIL: ' + (ja ? 'JA - die Querschnitts-Kontrolle wird Pflichtangabe'
  : nein ? 'NEIN - die Wand ist hart' : 'UNENTSCHIEDEN - kein Eintrag in beide Richtungen'));

/* Wie viele Varianten kommen dadurch unter die Kostenhuerde? */
console.log('\n  WAS DAS AN AUFLOESUNG BRINGT (delta80, Schwelle 2,50 angenommen):');
var Z80 = 0.8416212, SCHW = 2.5;
[['A7', 'seA'], ['Querschnitt', 'seQ']].forEach(function (paar) {
  var unter = zeilen.filter(function (r) { return (SCHW + Z80) * r[paar[1]] <= 0.10; }).length;
  var med = median(zeilen.map(function (r) { return (SCHW + Z80) * r[paar[1]]; }));
  console.log('    ' + paar[0].padEnd(12) + 'Median delta80 ' + med.toFixed(3) + ' Pp,  ' +
    unter + ' von ' + zeilen.length + ' Varianten unter der CFD-Huerde (0,10 Pp)');
});

/* Sekundaerer Endpunkt: D = Ueberschuss(A7) - Ueberschuss(Querschnitt) auf AUSWAHL. */
console.log('\nSEKUNDAERER ENDPUNKT  D = Ueberschuss(A7) - Ueberschuss(Querschnitt)');
[['AUSWAHL-primaer', AUSWAHL_PRIMAER], ['AUSWAHL-streng', AUSWAHL_STRENG]].forEach(function (m) {
  var teil = zeilen.filter(function (r) { return m[1][r.key]; });
  if (!teil.length) { console.log('  ' + m[0] + ': keine Varianten'); return; }
  var D = teil.map(function (r) { return r.uA - r.uQ; });
  console.log('  ' + m[0].padEnd(18) + teil.length + ' Varianten, D = ' +
    D.map(function (x) { return (x >= 0 ? '+' : '') + x.toFixed(4); }).join(', ') +
    '   Median ' + median(D).toFixed(4) + ' Pp');
});
console.log('\n  Zur Probe - dort, wo die Kontrolle per Konstruktion machtlos ist:');
zeilen.filter(function (r) { return r.klasse === 'machtlos'; }).forEach(function (r) {
  console.log('    ' + r.key + ' V' + r.v + ': Ueberschuss A7 ' + r.uA.toFixed(4) +
    ' -> Querschnitt ' + r.uQ.toFixed(4) + ' Pp');
});
console.log('  Geht er dort NICHT gegen null, ist die Implementierung falsch.');
