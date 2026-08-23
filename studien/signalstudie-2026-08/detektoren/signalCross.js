// Reine Signalfunktion fuer die Studie: MA-Kreuzung (Q.signalCross / crossCore, quant.js:754-794).
// (bars, ci, params) -> {dir:+1|-1} | null.  Keine Zustaende, nur bars[0..ci].
// Fenster wie im Backtest (quant.js:1601): die letzten max(period*4, 260) Kerzen bis ci.
var Q = require('../../../quant.js');
var LIVE = { lineType: 'ema', period: 20, confirmBps: 15, lookback: 3 };   // depot.json intraday + quant.js:793 Defaults
function signalCross(bars, ci, params) {
  var P = Object.assign({}, LIVE, params || {});
  var von = P.window === 'full' ? 0 : Math.max(0, ci - Math.max(P.period * 4, 260));
  var win = bars.slice(von, ci + 1);
  var s = Q.signalCross(win, P.lineType, P.period, P.confirmBps, P.lookback);
  return s.crossed ? { dir: s.crossed === 'up' ? 1 : -1 } : null;
}
module.exports = { signalCross: signalCross, LIVE: LIVE };
