'use strict';
/* Reiner Detektor 'kapitulation' - Wrapper um Q.einstiegSignal (quant.js:1671-1697).
 * Live-Parameter aus depot.json (22.08.2026): mode rsi2seit + kapiZusatz true,
 * interval 60m, period 20, confirmBps 15, lineType ema -> ZTHR = zOf(15) = 2.0 (depot.js:2131). */
var Q = require('../../../quant.js');
var LIVE = { ENTRY: 'kapitulation', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 0, CHAN: false, MTF: false, TREND: false };
function kapitulation(bars, ci, params) {
  var P = Object.assign({}, LIVE, params || {});
  var s = Q.einstiegSignal(bars, ci, P);
  return s && s.dir === 'call' ? { dir: +1 } : null;
}
module.exports = { kapitulation: kapitulation, LIVE: LIVE };
