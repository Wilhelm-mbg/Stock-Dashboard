'use strict';
/* Schneidet aus einem _lauf.log nur den LETZTEN Lauf heraus (ab der letzten START-Zeile).
 * Ein Log waechst ueber mehrere Laeufe hinweg an; wer es ungeschnitten hochrechnet, zaehlt Dateien doppelt.
 *
 *   node protokoll-schneiden.js <ziel-ordner> <quelle-lauf.log> [weitere ...]
 */
var fs = require('fs');
var path = require('path');
var ziel = process.argv[2];
if (!ziel || process.argv.length < 4) { console.error('Aufruf: node protokoll-schneiden.js <ziel-ordner> <lauf.log> [...]'); process.exit(2); }
fs.mkdirSync(ziel, { recursive: true });
process.argv.slice(3).forEach(function (q) {
  var zeilen = fs.readFileSync(q, 'utf8').split(/\r?\n/);
  var start = 0;
  zeilen.forEach(function (z, i) { if (/\sSTART\s/.test(z)) start = i; });
  var name = path.basename(path.dirname(q)) + '.log';
  fs.writeFileSync(path.join(ziel, name), zeilen.slice(start).join('\n'));
  console.log(name + ': Zeilen ' + (zeilen.length - start) + ' von ' + zeilen.length + ' (ab letztem START)');
});
