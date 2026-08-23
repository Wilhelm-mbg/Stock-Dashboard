// Reiner Wellental-Detektor ('wave') - duenne Huelle um Q.einstiegSignal (quant.js:1598),
// das intern Q.waveQuality (quant.js:958) + Kanal + EMA100-Trendfilter rechnet.
// Rueckgabe: {dir:+1|-1} | null. Keine Zustaende, nur bars[0..ci].
var Q = require('../../../quant.js');

// Live-Parameter der App (depot.js: zOf(15)=2.0, MINQ 60 hart in Z.2635, TREND bei wave Pflicht Z.2808)
var LIVE = { ENTRY: 'wave', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 60, CHAN: true, MTF: false, TREND: true };

function waveSignal(bars, ci, params) {
  var P = Object.assign({}, LIVE, params || {});
  if (ci < 2 || ci >= bars.length) return null;
  var v = Q.einstiegSignal(bars, ci, P);
  if (!v || !v.dir) return null;
  return { dir: v.dir === 'call' ? 1 : -1 };
}
module.exports = { waveSignal: waveSignal, LIVE: LIVE };
