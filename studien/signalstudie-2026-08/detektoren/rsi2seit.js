/* rsi2seit als reine Funktion (bars, ci, params) -> {dir:+1|-1} | null
 * Dünner Mantel um Q.einstiegSignal(ENTRY:'rsi2seit') aus quant.js (Zeile ~1638).
 * Live-Parameter (depot.js 2684): LINE 'ema', period 20, confirmBps 15, ZTHR 2.0 - von
 * denen benutzt der rsi2seit-Zweig nur `period` (Fenster = max(period*4, 260)) und CHAN=false. */
var Q = require('../../../quant.js');
var LIVE = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 0, CHAN: false, MTF: false, TREND: false };
function rsi2seit(bars, ci, params) {
  var P = Object.assign({}, LIVE, params || {});
  var s = Q.einstiegSignal(bars, ci, P);
  if (!s || !s.dir) return null;
  return { dir: s.dir === 'call' ? 1 : -1 };
}
module.exports = { rsi2seit: rsi2seit, LIVE: LIVE };
