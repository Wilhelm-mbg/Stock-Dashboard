'use strict';
/* Gegenpruefung: Praefix-Probe fuer 'kapitulation' mit (a) Zufallsindizes ab 260,
 * (b) ALLEN letzten 50 Indizes je Symbol (Reihenende), (c) allen Signalstellen,
 * (d) Vergleich mit dem Live-Aufruf (depot.js: bars.slice(-800), ci = length-1). */
var fs = require('fs');
var Q = require('../../../quant.js');
var det = require('./kapitulation.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var SYMS = (process.argv[2] || 'AAPL,NVDA,TSLA').split(',');
var IV = process.argv[3] || '60m';
var N = parseInt(process.argv[4] || '300', 10);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(4711);
var P = det.LIVE;
function liveAufruf(bars, i) {            // exakt wie depot.js:2713-2719 auf archS.slice(-800)
  var sb = bars.slice(Math.max(0, i - 799), i + 1);
  var s = Q.einstiegSignal(sb, sb.length - 1, { ENTRY: 'kapitulation', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 0, CHAN: false, MTF: false, TREND: false });
  return s && s.dir === 'call' ? { dir: +1 } : null;
}
var gesamt = 0, abw = 0, abwLive = 0, sig = 0, endeGeprueft = 0, bsp = [];
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series
    .filter(function (b) { return b[0] % 60000 === 0; });
  var minI = 260, idx = {};
  for (var k = 0; k < N; k++) idx[minI + Math.floor(rnd() * (bars.length - minI))] = 1;
  for (var e = bars.length - 50; e < bars.length; e++) idx[e] = 1;          // Reihenende
  var sigIdx = [];
  for (var i = minI; i < bars.length; i++) if (det.kapitulation(bars, i)) { idx[i] = 1; sigIdx.push(i); }
  Object.keys(idx).map(Number).sort(function (a, b) { return a - b; }).forEach(function (i) {
    var voll = det.kapitulation(bars, i);
    var pref = det.kapitulation(bars.slice(0, i + 1), i);
    var live = liveAufruf(bars, i);
    gesamt++; if (i >= bars.length - 50) endeGeprueft++; if (voll) sig++;
    if (JSON.stringify(voll) !== JSON.stringify(pref)) { abw++; if (bsp.length < 5) bsp.push(sym + '@' + i + ' voll=' + JSON.stringify(voll) + ' praefix=' + JSON.stringify(pref)); }
    if (JSON.stringify(voll) !== JSON.stringify(live)) { abwLive++; if (bsp.length < 5) bsp.push(sym + '@' + i + ' voll=' + JSON.stringify(voll) + ' live800=' + JSON.stringify(live)); }
  });
  console.log(sym, IV, 'bars', bars.length, 'signale', sigIdx.length, 'letzte Signale', sigIdx.slice(-3).map(function (i) { return new Date(bars[i][0]).toISOString().slice(0, 16); }).join(' '));
});
console.log('geprueft', gesamt, 'davon Reihenende(letzte 50)', endeGeprueft, 'signale', sig, 'abweichungen praefix', abw, 'abweichungen live800', abwLive);
if (bsp.length) console.log('Beispiele:', bsp);
console.log(abw === 0 ? 'URTEIL: walk-forward' : 'URTEIL: ZUKUNFTSBLICK');
