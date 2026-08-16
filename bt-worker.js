'use strict';
/* Backtest-Worker: rechnet Backtests in eigenem Thread, damit die Oberfläche flüssig bleibt. */
importScripts('quant.js');
self.onmessage = function (e) {
  var m = e.data;
  try {
    var Q = self.Quant;
    var res = m.fn === 'daily' ? Q.backtest(m.histMap, m.opts) : Q.backtestIntraday(m.histMap, m.opts);
    self.postMessage({ id: m.id, ok: true, res: res });
  } catch (err) {
    self.postMessage({ id: m.id, ok: false, msg: String((err && err.message) || err) });
  }
};
