var Q = require('../../../quant.js');
function roh(bars, i, P) { var w = bars.slice(Math.max(0, i - Math.max(P.period * 4, 260)), i + 1); var c = Q.signalCross(w, P.lineType, P.period, P.confirmBps, P.lookback).crossed; return c ? (c === 'up' ? 1 : -1) : 0; }
function signalCross(bars, i, P) {   // P = {lineType:'ema', period:20, confirmBps:15, lookback:3}
  var d = roh(bars, i, P);
  if (!d || (i > 0 && roh(bars, i - 1, P) === d)) return null;   // nur die ERSTE Kerze einer Kreuzung (sonst bis 6 Wiederholungen)
  return { dir: d };
}
module.exports = signalCross;
