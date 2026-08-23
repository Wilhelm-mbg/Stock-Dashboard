var fs = require('fs'); var Q = require('../../../quant.js');
var v1 = require('./snippet-signalCross.js'), v2 = require('./snippet-signalCross-v2.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/'; var IV = process.argv[2] || '60m';
var P = { lineType: 'ema', period: 20, confirmBps: 15, lookback: 3 };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(99);
['AAPL','NVDA','MSFT'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series, nb = bars.length;
  var n1 = 0, n2 = 0, l2 = 0, s2 = 0, abw = 0, gepr = 0, beispiel = null;
  for (var i = 30; i < nb; i++) { var a = v1(bars, i, P), b = v2(bars, i, P); if (a) n1++; if (b) { n2++; if (b.dir > 0) l2++; else s2++; if (!beispiel) beispiel = [i, new Date(bars[i][0]).toISOString(), b.dir]; } }
  var idx = []; for (var k = 0; k < 200; k++) idx.push(30 + Math.floor(rnd() * (nb - 31))); for (var j = nb - 30; j < nb; j++) idx.push(j);
  idx.forEach(function (i) { gepr++; var a = v2(bars.slice(0, i + 1), i, P), b = v2(bars, i, P); if ((a ? a.dir : 0) !== (b ? b.dir : 0)) abw++; });
  console.log(sym, IV, JSON.stringify({ kerzen: nb, v1_ersteKerze: n1, v2_jeKreuzung: n2, long: l2, short: s2, praefix_geprueft: gepr, praefix_abw: abw, erstes: beispiel }));
});
