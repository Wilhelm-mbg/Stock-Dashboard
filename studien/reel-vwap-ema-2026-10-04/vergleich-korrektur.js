'use strict';
/* Vergleicht den ersten Lauf (vor Korrektur 1) Feld fuer Feld mit dem wiederholten Lauf.
 * Erwartet: Unterschiede nur im Feld trefferquote (und in erstellt, siegel, korrekturen). */
var path = require('path');
var alt = require(path.join(__dirname, 'ergebnis-vor-korrektur-1.json'));
var neu = require(path.join(__dirname, 'ergebnis.json'));
var anders = {}, groessteTreffer = 0, felder = 0;
function lauf(a, b, pfad, feld) {
  if (a && typeof a === 'object' && b && typeof b === 'object') {
    var ks = {};
    Object.keys(a).forEach(function (k) { ks[k] = 1; });
    Object.keys(b).forEach(function (k) { ks[k] = 1; });
    Object.keys(ks).forEach(function (k) { lauf(a[k], b[k], pfad + '/' + k, k); });
    return;
  }
  felder++;
  if (a !== b && !(a !== a && b !== b)) {
    anders[feld] = (anders[feld] || 0) + 1;
    if (feld === 'trefferquote') groessteTreffer = Math.max(groessteTreffer, Math.abs(a - b));
  }
}
['laeufe', 'ereignisse', 'daten', 'fenster', 'kostenleiter', 'hauptlauf', 'start', 'datenluecken'].forEach(function (k) { lauf(alt[k], neu[k], k, k); });
lauf(alt.eichung.ergebnis, neu.eichung.ergebnis, 'eichung', 'eichung');
console.log('verglichene Felder: ' + felder);
console.log('abweichende Felder nach Name: ' + JSON.stringify(anders));
console.log('groesste Aenderung einer Trefferquote: ' + (groessteTreffer * 100).toFixed(4) + ' Prozentpunkte');
/* in Trades: je Lauf und Kostenstufe die Zahl der Gewinner vorher und nachher */
var liste = [];
alt.laeufe.forEach(function (l, i) {
  Object.keys(l.kosten).forEach(function (c) {
    var a = l.kosten[c], b = neu.laeufe[i].kosten[c], dg = Math.round(a.trefferquote * a.trades) - Math.round(b.trefferquote * b.trades);
    if (dg !== 0) liste.push({ lauf: [l.regel, l.wert, l.fenster, l.fassung, 'c=' + c].join(' '), trades: a.trades, gewinnerWeniger: dg });
  });
});
liste.sort(function (x, y) { return y.gewinnerWeniger - x.gewinnerWeniger; });
var jeStufe = {};
liste.forEach(function (x) { var c = x.lauf.split('c=')[1]; jeStufe[c] = (jeStufe[c] || 0) + 1; });
console.log('betroffene Laeufe je Kostenstufe: ' + JSON.stringify(jeStufe) + ' (von je 36)');
console.log('groesste Aenderungen in Trades: ' + liste.slice(0, 4).map(function (x) { return x.lauf + ': ' + x.gewinnerWeniger + ' Gewinner weniger von ' + x.trades + ' Trades'; }).join(' | '));
console.log('kleinste: ' + liste.slice(-2).map(function (x) { return x.lauf + ': ' + x.gewinnerWeniger; }).join(' | '));
var nur = Object.keys(anders).every(function (k) { return k === 'trefferquote'; });
console.log(nur ? 'ERGEBNIS: nur trefferquote weicht ab - alle anderen Felder bit-gleich.' : 'ERGEBNIS: AUCH ANDERE FELDER WEICHEN AB.');
if (!nur) process.exit(1);
