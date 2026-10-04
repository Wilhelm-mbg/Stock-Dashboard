'use strict';
/* Korrektur 1: vergleicht jedes Zahlen- und Textfeld von ergebnis.json mit dem ersten Lauf (ergebnis-vor-korrektur-1.json).
 * Ausgenommen sind nur Stempel und Herkunft (erstellt, siegel, dauerSekunden, korrekturen). Ausgabe nach stdout (vergleich-korrektur.log). */
var path = require('path');
var neu = require(path.join(__dirname, 'ergebnis.json')), alt = require(path.join(__dirname, 'ergebnis-vor-korrektur-1.json'));
var AUS = { erstellt: 1, siegel: 1, dauerSekunden: 1, korrekturen: 1 };
var felder = 0, abweichend = [];
function lauf(a, b, pfad) {
  if (a !== null && typeof a === 'object') {
    var schluessel = Object.keys(a).concat(Object.keys(b || {})).filter(function (k, i, s) { return s.indexOf(k) === i && !AUS[k]; });
    schluessel.forEach(function (k) { lauf(a[k], b ? b[k] : undefined, pfad + '.' + k); });
    return;
  }
  felder++;
  var gleich = a === b || (a !== a && b !== b);
  if (!gleich) abweichend.push(pfad + ': ' + JSON.stringify(b) + ' -> ' + JSON.stringify(a));
}
lauf(neu, alt, 'E');
console.log('Felder verglichen: ' + felder + ', abweichend: ' + abweichend.length);
abweichend.slice(0, 20).forEach(function (z) { console.log(z); });
