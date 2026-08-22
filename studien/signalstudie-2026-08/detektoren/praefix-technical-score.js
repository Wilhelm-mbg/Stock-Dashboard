/* Praefix-Probe Technik-Score: Signal auf bars.slice(0, i+1) == Signal auf ganzer Reihe an Stelle i?
 * Aufruf: node praefix-technical-score.js [iv]   (Standard 5m) */
'use strict';
var fs = require('fs');
var Q = require('../../../quant.js');
var det = require('./technical-score.js');
var STORE = process.env.APPDATA + '/markt-dashboard/store/';
var iv = process.argv[2] || '5m';
var SYMS = ['AAPL', 'MSFT', 'NVDA'];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);  // EIN Generator, ausserhalb aller Schleifen

var gepr = 0, abw = 0, abwRoh = 0, maxDiffFenster = 0, nFenster = 0;
SYMS.forEach(function (sym) {
  var raw = JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + sym + '.json', 'utf8'));
  var bars = raw.series.filter(function (b) { return b[1] > 0; });
  for (var k = 0; k < 200; k++) {
    var i = 60 + Math.floor(rnd() * (bars.length - 60));
    // (a) Studien-Aufruf (Fenster 300): Praefix vs. ganze Reihe
    var sP = det.signal(bars.slice(0, i + 1), i, {}), sF = det.signal(bars, i, {});
    var eq = (sP === null && sF === null) || (sP && sF && sP.dir === sF.dir && sP.score === sF.score);
    gepr++; if (!eq) abw++;
    // (b) Rohfunktion ohne Fenster: technical(praefix) vs technical(ganz, endI=i)
    var rP = Q.technical(bars.slice(0, i + 1)).score, rF = Q.technical(bars, i).score;
    if (rP !== rF) abwRoh++;
    // (c) Fensterabhaengigkeit (kein Zukunftsblick, nur Konvention): Fenster 300 vs. voller Praefix
    var s300 = det.score(bars, i, {}), sAll = det.score(bars, i, { fenster: 0 });
    if (s300 !== null && sAll !== null) { nFenster++; maxDiffFenster = Math.max(maxDiffFenster, Math.abs(s300 - sAll)); }
  }
});
console.log(JSON.stringify({ iv: iv, symbole: SYMS, geprueft: gepr, abweichungen: abw, abweichungenRohfunktion: abwRoh,
  fensterKonvention: { n: nFenster, maxAbsDiff300vsVoll: Math.round(maxDiffFenster * 1000) / 1000 } }));
