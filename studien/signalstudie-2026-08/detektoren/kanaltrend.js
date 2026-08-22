/* Reiner Detektor 'kanaltrend' fuer die Signalstudie.
 * Quelle: quant.js einstiegSignal(bars, ci, P), Zweig P.ENTRY === 'kanaltrend' (Z. 1699-1737).
 * Keine eigene Logik - nur Adapter auf {dir:+1|-1}|null. */
var Q = require('../../../quant.js');

/* Parameter:
 *  - LINE/period/confirmBps: App-Defaults D.intraday (depot.js:27): ema / 20 / 15
 *  - MINQ: Backtest-Default 60 (quant.js:2469); der Unit-Test nimmt 40 (test-v6.js:1169).
 *    Live gibt es keinen Wert, weil der Scanner den Modus nie ueber einstiegSignal rechnet. */
var DEFAULT = { ENTRY: 'kanaltrend', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5, MINQ: 60, CHAN: false, MTF: false, TREND: false };

function signal(bars, ci, params) {
  var P = Object.assign({}, DEFAULT, params || {}, { ENTRY: 'kanaltrend' });
  var s = Q.einstiegSignal(bars, ci, P);
  if (!s || !s.dir) return null;
  return { dir: s.dir === 'call' ? 1 : -1 };
}

module.exports = { signal: signal, DEFAULT: DEFAULT };
