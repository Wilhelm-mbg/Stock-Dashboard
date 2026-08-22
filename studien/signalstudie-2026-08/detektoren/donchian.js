'use strict';
/* Reine Signalfunktion Donchian-Ausbruch fuer das Messgeschirr.
 * Huelle um Q.donchianSignal (quant.js:821). (bars, ci, params) -> {dir:+1|-1} | null
 * Live-Parameter (depot.js): period = D.intraday.period (Default 20),
 * confirmBps = 15 (applySetup setzt idC '15', depot.js:7450; D.intraday Default 15). */
var Q = require('../../../quant.js');

var LIVE = { period: 20, confirmBps: 15 };

function donchian(bars, ci, params) {
  var p = params || LIVE;
  var N = p.period || 20;
  var win = bars.slice(Math.max(0, ci - (N + 10) + 1), ci + 1);
  var s = Q.donchianSignal(win, N, p.confirmBps === undefined ? 15 : p.confirmBps);
  return s.signal === 'call' ? { dir: 1 } : s.signal === 'put' ? { dir: -1 } : null;
}

module.exports = { donchian: donchian, LIVE: LIVE };
