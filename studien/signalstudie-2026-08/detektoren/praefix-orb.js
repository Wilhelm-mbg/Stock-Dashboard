/* Praefix-Probe ORB: Signal auf bars.slice(0, i+1) an Stelle i  ===  Signal auf ganzer Reihe an i.
 * Zusaetzlich: Gleichheit der reinen Funktion mit (a) dem Live-Block depot.js:2612-2631
 * (wortgetreu nachgebaut, D.orb.traded = "nach erstem Signal verbraucht") und (b) der
 * Backtest-Zustandsmaschine quant.js:2549-2561 + 2653-2661 (orbState, ohne ci<period+2-Sperre). */
'use strict';
var fs = require('fs');
var O = require('./orb.js');
var Q = require('../../../quant.js');
var ST = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '5m';
var SYMS = (process.argv[3] || 'AAPL,NVDA,TSLA').split(',');
var N = 300;
var P = { orbMin: 30, confirmBps: 15, minRangeBars: 3, nurErster: true };
var BARMIN = parseInt(IV, 10);

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);   // AUSSERHALB der Schleife

/* (a) Live-Block nachgebaut: sigBars = bars[0..ci], today = UTC-Tag von bars[ci], sigSpot = bars[ci][1] */
function liveBlock(sigBars, traded) {
  var today = O.tagVon(sigBars[sigBars.length - 1][0]);
  var sigSpot = sigBars[sigBars.length - 1][1];
  var dir = null;
  var tb = sigBars.filter(function (b) { return O.tagVon(b[0]) === today; });
  if (tb.length >= 3) {
    var t0b = tb[0][0];
    var rb = tb.filter(function (b) { return b[0] - t0b < 30 * 60000; });
    if (rb.length >= 3 && tb[tb.length - 1][0] - t0b >= 30 * 60000) {
      var orbHi = -Infinity, orbLo = Infinity;
      rb.forEach(function (b) { if (b[1] > orbHi) orbHi = b[1]; if (b[1] < orbLo) orbLo = b[1]; });
      var confO = (15 || 15) / 10000;
      if (traded.day !== today) { traded.day = today; traded.call = false; traded.put = false; }
      if (sigSpot > orbHi * (1 + confO) && !traded.call) dir = 'call';
      else if (sigSpot < orbLo * (1 - confO) && !traded.put) dir = 'put';
    }
  }
  if (dir) traded[dir] = true;   // depot.js:3029 - nach dem Kauf verbraucht
  return dir === 'call' ? 1 : dir === 'put' ? -1 : null;
}

/* (b) Backtest-Zustandsmaschine nachgebaut (quant.js:2549-2561, 2653-2661) */
function backtestLauf(bars) {
  var out = new Array(bars.length).fill(null), os = null;
  function dayKey(t) { var d = new Date(t); return d.getUTCFullYear() + '-' + d.getUTCMonth() + '-' + d.getUTCDate(); }
  for (var ci = 0; ci < bars.length; ci++) {
    var t = bars[ci][0], spot = bars[ci][1], dk = dayKey(t);
    if (!os || os.day !== dk) os = { day: dk, start: t, high: spot, low: spot, done: false, traded: {} };
    if (t - os.start < 30 * 60000) { if (spot > os.high) os.high = spot; if (spot < os.low) os.low = spot; }
    else os.done = true;
    if (!os.done) continue;
    var confO = 15 / 10000, dir = null;
    if (spot > os.high * (1 + confO) && !os.traded.call) dir = 'call';
    else if (spot < os.low * (1 - confO) && !os.traded.put) dir = 'put';
    if (dir) { os.traded[dir] = true; out[ci] = dir === 'call' ? 1 : -1; }
  }
  return out;
}

var gesamt = 0, abw = 0, sigN = 0, liveAbw = 0, btAbw = 0, liveN = 0, btN = 0;
SYMS.forEach(function (sym) {
  var j = JSON.parse(fs.readFileSync(ST + 'bars_' + IV + '_' + sym + '.json', 'utf8'));
  var bars = j.series;
  // Praefix-Probe
  var lokalAbw = 0;
  for (var k = 0; k < N; k++) {
    var i = Math.floor(rnd() * bars.length);
    var a = O.orbSignal(bars, i, P), b = O.orbSignal(bars.slice(0, i + 1), i, P);
    var ad = a ? a.dir : null, bd = b ? b.dir : null;
    if (ad !== bd) lokalAbw++;
    if (ad) sigN++;
    gesamt++;
  }
  abw += lokalAbw;
  // Vollstaendiger Gleichheitstest ueber ALLE Bars: rein vs. Live-Block vs. Backtest
  var bt = backtestLauf(bars), traded = { day: null };
  var tagStart = new Array(bars.length); var ts0 = 0, tsTag = null;
  for (var q = 0; q < bars.length; q++) { var tq = O.tagVon(bars[q][0]); if (tq !== tsTag) { tsTag = tq; ts0 = q; } tagStart[q] = ts0; }
  var la = 0, ba = 0, ln = 0, bn = 0, beisp = [];
  for (var ci = 0; ci < bars.length; ci++) {
    var r = O.orbSignal(bars, ci, P); var rd = r ? r.dir : null;
    // Praefix bars[0..ci]; der Live-Block filtert selbst auf den UTC-Tag, daher genuegt
    // (semantisch identisch, nur schneller) der Praefix ab Tagesbeginn.
    var lv = liveBlock(bars.slice(tagStart[ci], ci + 1), traded);
    if (lv) ln++;
    if (bt[ci]) bn++;
    if (rd !== lv) { la++; if (beisp.length < 3) beisp.push('live@' + new Date(bars[ci][0]).toISOString() + ' rein=' + rd + ' live=' + lv); }
    if (rd !== bt[ci]) { ba++; if (beisp.length < 6) beisp.push('bt@' + new Date(bars[ci][0]).toISOString() + ' rein=' + rd + ' bt=' + bt[ci]); }
  }
  liveAbw += la; btAbw += ba; liveN += ln; btN += bn;
  console.log(sym, IV, 'Bars', bars.length, '| Praefix: geprueft', N, 'Abweichungen', lokalAbw,
    '| Live-Block: Signale', ln, 'Abw.', la, '| Backtest-Maschine: Signale', bn, 'Abw.', ba, beisp.length ? '\n   ' + beisp.join('\n   ') : '');
});
console.log('\nSUMME Praefix-Probe:', gesamt, 'geprueft,', abw, 'Abweichungen,', sigN, 'davon mit Signal');
console.log('SUMME Gleichheit rein vs Live-Block:', liveAbw, 'Abweichungen bei', liveN, 'Live-Signalen');
console.log('SUMME Gleichheit rein vs Backtest-Maschine:', btAbw, 'Abweichungen bei', btN, 'Backtest-Signalen');
