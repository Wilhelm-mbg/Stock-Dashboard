'use strict';
/* UEBERLAPPEN DIE BEOBACHTUNGEN? - der Einwand, der das Momentum-Ergebnis kippen kann.
 *
 * Die Messung vom 24.08.2026 ergab fuer die staerksten 10 % einen Ueberschuss von
 * +0,897 Pp bei t = 4,74. Die Maschine clustert ueber HANDELSTAGE und behandelt sie
 * als unabhaengige Wiederholungen. Bei 63 Tagen Haltedauer und einem Signal an jedem
 * Tag teilen aufeinanderfolgende Tage aber 62 von 63 Tagen ihres Ergebnisfensters.
 *
 * Im Extremfall - perfekte Ueberlappung - waere die Zahl unabhaengiger Beobachtungen
 * um Faktor 63 kleiner und der t-Wert um Wurzel(63) = 7,9 zu gross. Aus 4,74 wuerde
 * 0,6. Das ist der Unterschied zwischen einem Befund und nichts.
 *
 * DREI RECHNUNGEN, die das entscheiden:
 *   1. NEWEY-WEST mit 63 Verzoegerungen: der Standardfehler wird um die gemessene
 *      Autokorrelation der Tagesmittel korrigiert. Das ist die uebliche Antwort auf
 *      ueberlappende Renditen.
 *   2. NICHT UEBERLAPPENDE BLOECKE: nur jeder 63. Tag zaehlt. Weniger Beobachtungen,
 *      dafuer garantiert unabhaengige Fenster - und dieselbe Rechnung ueber alle 63
 *      moeglichen Startlagen, damit die Antwort nicht an einer Rasterlage haengt (B9).
 *   3. Die gemessene Autokorrelation selbst - sie sagt, wie schlimm es wirklich ist.
 *
 * Aufruf: node --max-old-space-size=8192 studien/messmaschine/momentum-ueberlappung.js [archiv]
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var M = require('./messmaschine.js');
var S = require('./strategien/momentum.js');
var WP = require('./strategien/wertpapierart.js');

var ARCHIV = process.argv[2] || 'E:/Markt-Dashboard-Archiv/archiv1d';
var H = S.haltedauerKerzen, VOR = 261, FENSTER = S.leseFensterKerzen;
var ANTEIL = 0.10;                     // die Live-Einstellung

console.log('UEBERLAPPUNG - haelt der Momentum-Befund?');
console.log('='.repeat(72));

/* --- Universum laden --- */
var U = {};
fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_1d_') === 0; }).forEach(function (f) {
  var sym = f.slice(8, -5);
  if (!WP.istAktie(sym)) return;
  try { var j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); if (j.series && j.series.length) U[sym] = j.series; } catch (e) { }
});
console.log('\n' + Object.keys(U).length + ' Werte geladen.');

/* --- Dieselbe Rangfolge und derselbe Schnitt wie in der Messung --- */
var QS = M._intern.baueQuerschnitt(U, S.querschnitt.merkmal, VOR, S.querschnitt.mindestWerte);
var alleTage = {};
Object.keys(U).forEach(function (s) { U[s].forEach(function (b) { alleTage[new Date(b[0]).toISOString().slice(0, 10)] = 1; }); });
var tage = Object.keys(alleTage).sort();
var schnitt = tage[Math.floor(tage.length * 0.5)];
var K = M._intern.baueKontrolle(U, H, schnitt, VOR, null, {});

/* --- Ueberschuesse je Tag der Bestaetigungshaelfte sammeln --- */
var proTag = {};
Object.keys(U).forEach(function (sym) {
  var b = U[sym];
  for (var i = VOR; i < b.length - H; i++) {
    var r = QS.rang(sym, b[i][0]);
    if (!r || r.perzentil < 1 - ANTEIL) continue;
    var s0 = b[i][1], sH = b[i + H][1];
    if (!(s0 > 0) || !(sH > 0)) continue;
    var tag = new Date(b[i][0]).toISOString().slice(0, 10);
    if (tag < schnitt) continue;                       // nur die Bestaetigungshaelfte
    var erw = K.erwartung(sym, new Date(b[i][0]).getUTCHours(), 'bestaetigung', i - FENSTER, i + H - 1);
    if (erw == null) continue;
    (proTag[tag] = proTag[tag] || []).push((sH / s0 - 1) - erw);
  }
});
var tageSort = Object.keys(proTag).sort();
var mittel = tageSort.map(function (t) {
  var a = proTag[t];
  return a.reduce(function (x, y) { return x + y; }, 0) / a.length;
});
var n = mittel.length;
var mu = mittel.reduce(function (a, b) { return a + b; }, 0) / n;
console.log(n + ' Bestaetigungstage, Tagesmittel des Ueberschusses ' + (mu * 100).toFixed(4) + ' Pp\n');

/* --- 1) Der naive Standardfehler, so wie die Maschine ihn rechnet --- */
var va = mittel.reduce(function (a, b) { return a + (b - mu) * (b - mu); }, 0) / (n - 1);
var seNaiv = Math.sqrt(va / n);
console.log('1) NAIV (Tage als unabhaengig)');
console.log('   t = ' + (mu / seNaiv).toFixed(2) + '   Standardfehler ' + (seNaiv * 100).toFixed(4) + ' Pp');

/* --- 2) Autokorrelation: wie schlimm ist es wirklich? --- */
function autokorr(k) {
  var s = 0, c = 0;
  for (var i = 0; i + k < n; i++) { s += (mittel[i] - mu) * (mittel[i + k] - mu); c++; }
  return c ? (s / c) / va : 0;
}
console.log('\n2) AUTOKORRELATION DER TAGESMITTEL');
[1, 5, 21, 63, 126].forEach(function (k) {
  console.log('   Verzoegerung ' + String(k).padStart(3) + ': ' + autokorr(k).toFixed(3));
});
console.log('   (bei unabhaengigen Tagen laege alles nahe 0; bei perfekter Ueberlappung');
console.log('    faellt sie erst nach ' + H + ' Tagen ab)');

/* --- 3) Newey-West --- */
var L = H;
var langfrist = va;
for (var k = 1; k <= L; k++) {
  var gew = 1 - k / (L + 1);
  var s = 0, c = 0;
  for (var i = 0; i + k < n; i++) { s += (mittel[i] - mu) * (mittel[i + k] - mu); c++; }
  langfrist += 2 * gew * (s / c);
}
var seNW = Math.sqrt(Math.max(langfrist, va * 0.01) / n);
console.log('\n3) NEWEY-WEST (' + L + ' Verzoegerungen)');
console.log('   t = ' + (mu / seNW).toFixed(2) + '   Standardfehler ' + (seNW * 100).toFixed(4) +
  ' Pp   (Faktor ' + (seNW / seNaiv).toFixed(2) + ' gegenueber naiv)');

/* --- 4) Nicht ueberlappende Bloecke, ueber ALLE Startlagen --- */
console.log('\n4) NICHT UEBERLAPPENDE BLOECKE - jede der ' + H + ' moeglichen Startlagen');
var tWerte = [];
for (var lage = 0; lage < H; lage++) {
  var aus = [];
  for (var i = lage; i < n; i += H) aus.push(mittel[i]);
  if (aus.length < 8) continue;
  var m2 = aus.reduce(function (a, b) { return a + b; }, 0) / aus.length;
  var v2 = aus.reduce(function (a, b) { return a + (b - m2) * (b - m2); }, 0) / (aus.length - 1);
  tWerte.push(m2 / Math.sqrt(v2 / aus.length));
}
tWerte.sort(function (a, b) { return a - b; });
if (tWerte.length) {
  var med = tWerte[tWerte.length >> 1];
  console.log('   ' + tWerte.length + ' Lagen, je rund ' + Math.floor(n / H) + ' unabhaengige Bloecke');
  console.log('   t: kleinster ' + tWerte[0].toFixed(2) + '  Median ' + med.toFixed(2) +
    '  groesster ' + tWerte[tWerte.length - 1].toFixed(2));
  console.log('   ueber 2,50 (Schwelle bei 4 Tests): ' +
    tWerte.filter(function (x) { return x > 2.50; }).length + ' von ' + tWerte.length + ' Lagen');
  console.log('\n   DAS ist die Zahl, die zaehlt: Wie viele Rasterlagen tragen, wenn man');
  console.log('   nur garantiert unabhaengige Fenster zulaesst.');
}
console.log('\n' + '='.repeat(72));
