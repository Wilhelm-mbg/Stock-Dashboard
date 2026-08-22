'use strict';
/* Reine Signalfunktion fuer die Signalstudie: Bollinger-Squeeze-Ausbruch.
   Huelle um Q.squeezeSignal (quant.js:845). (bars, ci, params) -> {dir:+1|-1} | null
   Live-Parameter (depot.js:2708): period = cfg.period || 20, kSigma nie uebergeben -> 2. */
var Q = require('../../../quant.js');
var STD = { period: 20, kSigma: 2 };
function squeeze(bars, ci, params) {
  var P = params || STD;
  var s = Q.squeezeSignal(bars.slice(0, ci + 1), P.period || 20, P.kSigma || 2);
  if (!s.signal) return null;
  return { dir: s.signal === 'call' ? 1 : -1, enge: s.enge };
}
module.exports = { squeeze: squeeze, STD: STD };
