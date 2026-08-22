// Reine Signalfunktion rsi2 (Connors RSI(2)-Extrem mit EMA100-Trendfilter).
// Kapselt Q.rsiExtremSignal aus quant.js. Fenster wie im Backtest (einstiegSignal): 261 Kerzen.
var Q = require('../../../quant.js');
function rsi2Signal(bars, i, params) {
  params = params || {};
  var W = params.window || 260;                      // einstiegSignal: max(period*4, 260) -> 261 Kerzen
  var win = bars.slice(Math.max(0, i - W), i + 1);
  var s = Q.rsiExtremSignal(win, params.kaufSchwelle || 10, params.verkaufSchwelle || 90);
  return s.signal ? { dir: s.signal === 'call' ? 1 : -1, wert: s.wert } : null;
}
module.exports = { rsi2Signal: rsi2Signal };
