'use strict';
/* Tests v6: ORB, Auto-Stop, Risiko-Sizing, Resampling/MTF */
var Q = require('./quant.js');
var fails = 0;
function ok(cond, name, extra) {
  console.log((cond ? '  ✅ ' : '  ❌ ') + name + (extra !== undefined ? '  [' + extra + ']' : ''));
  if (!cond) fails++;
}
function lcg(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 - 0.5; }; }

console.log('1) resampleBars & mtfAgrees');
var bars1 = [];
var t0 = Date.UTC(2026, 5, 1, 13, 30);
for (var i = 0; i < 200; i++) bars1.push([t0 + i * 60000, 100 + i * 0.05, 1000]);
var b5 = Q.resampleBars(bars1, 5);
ok(b5.length === 40, '1m→5m: 200 Bars → 40', b5.length);
ok(b5[0][2] === 5000, 'Volumen wird summiert', b5[0][2]);
ok(b5[39][1] === bars1[199][1], 'Schlusskurs = letzter Bar des Bündels');
ok(Q.mtfAgrees(bars1, 'call', 5) === true, 'steigender 5m-Chart bestätigt Call');
ok(Q.mtfAgrees(bars1, 'put', 5) === false, 'steigender 5m-Chart blockt Put');

console.log('2) autoStop (atmender Not-SL)');
var quiet = [], wild = [];
var r1 = lcg(1), r2 = lcg(2);
for (var k = 0; k < 200; k++) { quiet.push(100 + r1() * 0.1); wild.push(100 + r2() * 3); }
var slQ = Q.autoStop(quiet, 15, 12), slW = Q.autoStop(wild, 15, 12);
ok(slQ < 0 && slW < 0, 'Stops negativ', slQ.toFixed(3) + ' / ' + slW.toFixed(3));
ok(Math.abs(slW) > Math.abs(slQ), 'wilder Markt → weiterer Stop', slQ.toFixed(3) + ' vs ' + slW.toFixed(3));
ok(Math.abs(slQ) >= 0.10 && Math.abs(slW) <= 0.45, 'Grenzen 10–45 % eingehalten');

console.log('3) ORB-Backtest (Gap-and-Go-Tag)');
// 3 Tage: enge 30-Min-Range, danach klarer Trend nach oben → ORB-Call muss zünden
var barsO = [];
var rndO = lcg(9);
for (var d = 0; d < 3; d++) {
  var ds = t0 + d * 86400000, base = 100 + d * 2;
  for (var b = 0; b < 390; b++) {
    var p;
    if (b < 30) p = base + rndO() * 0.3;                     // enge Eröffnungs-Range
    else p = base + 0.4 + (b - 30) * 0.012 + rndO() * 0.25;  // Ausbruch + Trend
    barsO.push([ds + b * 60000, p, 900000]);
  }
}
var rO = Q.backtestIntraday({ TEST: barsO }, {
  capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1,
  entryMode: 'orb', orbMin: 30, confirmBps: 15,
  sl: -0.25, tp: null, trailPct: 0.15, maxHoldMin: 0, cooldownMin: 10, maxPerDay: 10, minEdge: 0
});
ok(!rO.error, 'ORB-Backtest läuft', rO.error);
ok(rO.trades.length >= 2 && rO.trades.length <= 6, '~1 Trade je Tag (1 je Richtung max.)', rO.trades.length);
ok(rO.trades.every(function (t) { return t.dir === 'call'; }), 'Gap-and-Go: nur Calls');
ok(rO.summary.retPct > 0, 'Trendtage → ORB im Plus', rO.summary.retPct + ' %');

console.log('4) Risiko-Sizing');
var rFix = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'orb', orbMin: 30, sl: -0.25, tp: null, trailPct: 0.15, cooldownMin: 10, maxPerDay: 10, minEdge: 0 });
var rRisk = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'orb', orbMin: 30, sl: -0.25, tp: null, trailPct: 0.15, cooldownMin: 10, maxPerDay: 10, minEdge: 0, riskPct: 0.5 });
ok(!rRisk.error && rRisk.trades.length > 0, 'Risiko-Sizing läuft', rRisk.trades.length);
// SL −25 %, Risiko 0,5 % von 10000 = 50 $ → Positionswert ≈ 200 $ (vs. fix 300 $)
var pos0 = rFix.trades[0].entry * rFix.trades[0].qty;
var pos1 = rRisk.trades[0].entry * rRisk.trades[0].qty;
ok(Math.abs(pos1 - 200) < 40, 'Positionswert ≈ Risiko/SL (≈200 $)', Math.round(pos1) + ' $ (fix: ' + Math.round(pos0) + ' $)');

console.log('5) sl:"auto" im Backtest');
var rAuto = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'orb', orbMin: 30, sl: 'auto', tp: null, trailPct: 0.15, cooldownMin: 10, maxPerDay: 10, minEdge: 0, maxHoldMin: 60 });
ok(!rAuto.error && rAuto.trades.length > 0, 'auto-SL-Backtest läuft', rAuto.error || rAuto.trades.length);

console.log('6) MTF im Backtest blockt Gegen-Signale');
var rMtf = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'cross', mtf: true, sl: -0.25, tp: 0.35, cooldownMin: 5, maxPerDay: 40, minEdge: 0 });
var rNo = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'cross', mtf: false, sl: -0.25, tp: 0.35, cooldownMin: 5, maxPerDay: 40, minEdge: 0 });
ok(!rMtf.error && !rNo.error, 'beide laufen');
ok(rMtf.trades.length <= rNo.trades.length, 'MTF filtert (nicht mehr Trades)', rMtf.trades.length + ' vs ' + rNo.trades.length);

console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' TEST(S) FEHLGESCHLAGEN');
process.exit(fails ? 1 : 0);
