'use strict';
/* Setzt TROCKENLAUF.md zusammen: der geschriebene Text (teile/00-text.md) und dahinter die von den Zaehlskripten
 * erzeugten Trefferlisten (teile/t1.md ... t6.md) in der Reihenfolge des Auftrags. Rechnet nichts.
 * Aufruf:  node bericht.js
 */
var fs = require('fs');
var path = require('path');

var TEILE = path.join(__dirname, 'teile');
var FOLGE = ['00-text.md', 't1.md', 't3.md', 't2.md', 't6.md', 't5.md', 't4.md'];
var aus = FOLGE.map(function (f) {
  var p = path.join(TEILE, f);
  if (!fs.existsSync(p)) throw new Error('Teil fehlt: ' + f + ' - erst das zugehoerige Zaehlskript laufen lassen');
  return fs.readFileSync(p, 'utf8').replace(/\s+$/, '');
}).join('\n\n');
fs.writeFileSync(path.join(__dirname, 'TROCKENLAUF.md'), aus + '\n');
console.log('TROCKENLAUF.md: ' + aus.split('\n').length + ' Zeilen aus ' + FOLGE.length + ' Teilen');
