'use strict';
/* Wirkung der Stempel-Kerzen: Signal an SAUBEREN Bars, einmal auf der rohen Reihe, einmal auf der gefilterten Reihe (gleicher Stempel). */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '5m';
(process.argv[3] || 'MSFT,NVDA,AAPL').split(',').forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var rein = bars.filter(function (b) { return new Date(b[0]).getUTCSeconds() === 0; });
  var idxRein = {}; rein.forEach(function (b, k) { idxRein[b[0]] = k; });
  var diff = 0, gepr = 0, sigRoh = 0, sigRein = 0, bsp = [];
  for (var i = 120; i < bars.length; i++) {
    var k = idxRein[bars[i][0]]; if (k === undefined) continue;
    var a = Q.squeezeSignal(bars.slice(Math.max(0, i - 260), i + 1), 20).signal;
    var b = Q.squeezeSignal(rein.slice(Math.max(0, k - 260), k + 1), 20).signal;
    gepr++; if (a) sigRoh++; if (b) sigRein++;
    if (a !== b) { diff++; if (bsp.length < 4) bsp.push(new Date(bars[i][0]).toISOString().slice(0, 16) + ' roh=' + a + ' rein=' + b); }
  }
  console.log(IV, sym, 'stempel=' + (bars.length - rein.length), 'saubere_bars=' + gepr, 'signale_roh=' + sigRoh, 'signale_rein=' + sigRein, 'abweichende_bars=' + diff, bsp.join(' | '));
});
