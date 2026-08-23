'use strict';
/* Praefix-Probe fuer 'kapitulation': Signal auf bars.slice(0,i+1) an Stelle i
 * muss dem Signal auf der ganzen Reihe an Stelle i gleichen. 3 Symbole x 60m. */
var fs = require('fs');
var det = require('./kapitulation.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var SYMS = (process.argv[2] || 'AAPL,NVDA,TSLA').split(',');
var IV = process.argv[3] || '60m';
var N = parseInt(process.argv[4] || '250', 10);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);   // EIN Generator, ausserhalb aller Schleifen
var gesamt = 0, abw = 0, sigVoll = 0, sigPref = 0, bsp = [];
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  // Nur Kerzen mit sauberem Stempel (Stempel-Kerzen mit Sekundenanteil raus)
  bars = bars.filter(function (b) { return b[0] % 60000 === 0; });
  var minI = 400;   // genug Vorlauf fuer Fenster (bis 380) + Kanal (200)
  // Zufallsindizes + zusaetzlich alle Signalstellen der vollen Reihe (sonst prueft man fast nur Nullen)
  var idx = [];
  for (var k = 0; k < N; k++) idx.push(minI + Math.floor(rnd() * (bars.length - minI)));
  var voll = {};
  for (var i = minI; i < bars.length; i++) { var s = det.kapitulation(bars, i); if (s) { voll[i] = s; idx.push(i); } }
  var seen = {};
  idx.forEach(function (i) {
    if (seen[i]) return; seen[i] = 1;
    var a = det.kapitulation(bars, i);                 // ganze Reihe, Stelle i
    var b = det.kapitulation(bars.slice(0, i + 1), i); // Praefix
    gesamt++;
    if (a) sigVoll++; if (b) sigPref++;
    var ja = JSON.stringify(a), jb = JSON.stringify(b);
    if (ja !== jb) { abw++; if (bsp.length < 5) bsp.push(sym + '@' + i + ' voll=' + ja + ' praefix=' + jb); }
  });
  console.log(sym, IV, 'bars', bars.length, 'signale voll', Object.keys(voll).length);
});
console.log('geprueft', gesamt, 'abweichungen', abw, 'signale(voll)', sigVoll, 'signale(praefix)', sigPref);
if (bsp.length) console.log('Beispiele:', bsp);
console.log(abw === 0 ? 'URTEIL: walk-forward' : 'URTEIL: ZUKUNFTSBLICK');
