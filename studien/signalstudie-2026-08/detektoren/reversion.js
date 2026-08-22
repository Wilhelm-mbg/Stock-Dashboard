'use strict';
/* Reiner Wrapper um Q.reversionSignal (quant.js:929) fuer das Messgeschirr.
   (bars, ci, params) -> {dir:+1|-1, z} | null
   Standard: Fenster exakt wie einstiegSignal (quant.js:1601): max(period*4, 260)+1 Kerzen bis ci.
   [Gegenpruefung] tagesreihe:true (fuer 1m): Live holt Yahoo range=1d (depot.js:1995, 2310), der Scanner
   sieht also nur den laufenden Tag; erst ab 31 Kerzen liefert der Fetch ueberhaupt (depot.js:2335),
   und reversionSignal braucht n >= 65. Ohne diese Option misst die Studie auf 1m 40 % Signale
   (338/857 in den ersten 65 Min), die Live nie entstehen koennen. */
var Q = require('../../../quant.js');
var LIVE = { lineType: 'ema', period: 20, zThr: 2.0, tagesreihe: false };   // depot.js: D.intraday.period=20, confirmBps=15 -> zOf=2.0, lineType 'ema'

function reversion(bars, ci, params) {
  var p = Object.assign({}, LIVE, params || {});
  var j0 = Math.max(0, ci - Math.max(p.period * 4, 260)), tag = function (k) { return new Date(bars[k][0]).toISOString().slice(0, 10); };
  if (p.tagesreihe) { j0 = ci; while (j0 > 0 && tag(j0 - 1) === tag(ci)) j0--; }
  var win = bars.slice(j0, ci + 1); if (p.tagesreihe && win.length <= 30) return null;
  var r = Q.reversionSignal(win, p.lineType, p.period, p.zThr);
  if (!r.signal) return null;
  return { dir: r.signal === 'call' ? 1 : -1, z: r.z };
}
module.exports = { reversion: reversion, LIVE: LIVE };
