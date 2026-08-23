'use strict';
/* Test des korrigierten Snippets: (a) tagesreihe:true auf 1m == Live-Simulation (Yahoo range=1d),
   (b) tagesreihe:false auf 5m == Live-Simulation mit 5-Tage-Reihe (Yahoo range=5d), (c) Praefix-Probe des Snippets. */
var fs = require('fs');
var Q = require('../../../quant.js');
function reversionSig(bars, i, params) {
  var p = Object.assign({ lineType: 'ema', period: 20, zThr: 2.0, tagesreihe: false }, params || {});
  var j0 = Math.max(0, i - Math.max(p.period * 4, 260)), tag = function (k) { return new Date(bars[k][0]).toISOString().slice(0, 10); };
  if (p.tagesreihe) { j0 = i; while (j0 > 0 && tag(j0 - 1) === tag(i)) j0--; }   // Live 1m: Yahoo range=1d -> nur der laufende Tag
  var win = bars.slice(j0, i + 1); if (p.tagesreihe && win.length <= 30) return null; // Fetch liefert erst ab 31 Kerzen
  var r = Q.reversionSignal(win, p.lineType, p.period, p.zThr); return r.signal ? { dir: r.signal === 'call' ? 1 : -1 } : null;
}
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '1m', TR = IV === '1m';
var SYMS = ['AAPL', 'NVDA', 'MSFT'];
function dayKey(t) { return new Date(t).toISOString().slice(0, 10); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(99);
var T = { idx: 0, abw: 0, sig: 0, praefix: 0, praefixAbw: 0 };
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length, days = [], dk = '';
  for (var k = 0; k < n; k++) { var d = dayKey(bars[k][0]); if (d !== dk) { dk = d; days.push(k); } }
  for (var i = 300; i < n; i++) {
    // Live-Reihe: 1m = laufender Tag; 5m/15m = letzte 5 Handelstage
    var di = 0; while (di + 1 < days.length && days[di + 1] <= i) di++;
    var start = TR ? days[di] : days[Math.max(0, di - 4)];
    var ser = bars.slice(start, i + 1);
    var live = ser.length > 30 ? (Q.reversionSignal(ser, 'ema', 20, 2.0).signal || null) : null;
    var s = reversionSig(bars, i, { tagesreihe: TR }); s = s ? (s.dir > 0 ? 'call' : 'put') : null;
    T.idx++; if (s) T.sig++; if (s !== live) T.abw++;
  }
  for (var q = 0; q < 300; q++) {
    var j = Math.floor(rnd() * n);
    var a = reversionSig(bars, j, { tagesreihe: TR }), b = reversionSig(bars.slice(0, j + 1), j, { tagesreihe: TR });
    T.praefix++; if ((a ? a.dir : 0) !== (b ? b.dir : 0)) T.praefixAbw++;
  }
});
console.log(IV, 'tagesreihe=' + TR, JSON.stringify(T));
