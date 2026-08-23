var Q = require('../../../quant.js');
function roh(bars, i, P) { var w = bars.slice(Math.max(0, i - Math.max(P.period * 4, 260)), i + 1); var c = Q.signalCross(w, P.lineType, P.period, P.confirmBps, P.lookback).crossed; return c ? (c === 'up' ? 1 : -1) : 0; }
function signalCross(bars, i, P) {   // P = {lineType:'ema', period:20, confirmBps:15, lookback:3}; eine Kreuzung = ein Signal
  var d = roh(bars, i, P); if (!d) return null;
  var w = bars.slice(Math.max(0, i - Math.max(P.period * 4, 260)), i + 1), c = w.map(function (b) { return b[1]; }), e = Q.emaSeries(c, P.period);
  for (var j = w.length - 2; j >= 0 && (d > 0 ? c[j] > e[j] : c[j] < e[j]); j--) if (roh(bars, i - (w.length - 1 - j), P) === d) return null;   // seit dem letzten Seitenwechsel schon gefeuert
  return { dir: d };
}
module.exports = signalCross;
