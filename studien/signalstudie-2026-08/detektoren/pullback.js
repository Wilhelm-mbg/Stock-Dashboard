/* Reine Signalfunktion fuer den Trend-Ruecksetzer (Pullback).
 * Quelle: Q.pullbackSignal (quant.js:884) - unveraendert, nur in die Form
 * (bars, ci, params) -> {dir:+1|-1} | null gebracht.
 * params: {lineType:'ema'|'vwap', period, confirmBps, win}
 *   win = Fensterlaenge in Bars (Backtest: einstiegSignal nimmt max(period*4, 260) -> 260;
 *         Live: gesamte geholte Reihe, bei 5m/5d ~390 Bars; win=0 -> ganze Vorgeschichte). */
var Q = require('../../../quant.js');
function pullback(bars, ci, p) {
  p = p || {};
  var w = p.win === undefined ? 260 : p.win;
  var from = w > 0 ? Math.max(0, ci - w) : 0;
  var s = Q.pullbackSignal(bars.slice(from, ci + 1), p.lineType || 'ema', p.period || 20, p.confirmBps === undefined ? 15 : p.confirmBps);
  return s.signal === 'call' ? { dir: +1 } : s.signal === 'put' ? { dir: -1 } : null;
}
module.exports = pullback;
