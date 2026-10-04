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
var nur = Object.keys(anders).every(function (k) { return k === 'trefferquote'; });
console.log(nur ? 'ERGEBNIS: nur trefferquote weicht ab - alle anderen Felder bit-gleich.' : 'ERGEBNIS: AUCH ANDERE FELDER WEICHEN AB.');
if (!nur) process.exit(1);
