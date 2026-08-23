'use strict';
/* 1m: Live-Fenster (range '1d', depot.js INTERVAL_CFG) vs Snippet auf dem Archiv. */
var fs = require('fs'); var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(7), tag = function (t) { return new Date(t).toISOString().slice(0, 10); };
var tot = 0, abw = 0, abwFrueh = 0, sigS = 0, sigL = 0;
['AAPL', 'MSFT', 'NVDA'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_1m_' + sym + '.json', 'utf8')).series, n = bars.length;
  for (var k = 0; k < 400; k++) {
    var i = 400 + Math.floor(rnd() * (n - 400));
    var s = Q.reversionSignal(bars.slice(0, i + 1), 'vwap', 20, 2.0).signal;
    var j = i; while (j > 0 && tag(bars[j - 1][0]) === tag(bars[i][0])) j--;
    var fenster = Q.fertigeBars(bars.slice(j, i + 1), 1, bars[i][0] + 60000);
    var l = Q.reversionSignal(fenster, 'vwap', 20, 2.0).signal;
    tot++; if (s) sigS++; if (l) sigL++;
    if ((s || null) !== (l || null)) { abw++; if (fenster.length < 100) abwFrueh++; }
  }
});
console.log('1m Live-Fenster 1d vs Snippet:', tot, 'Proben | abweichend', abw, '(davon bei <100 Tagesbars:', abwFrueh + ') | Signale Snippet', sigS, 'Live', sigL);
