/* Praefix-Probe Pullback: Signal auf bars.slice(0,i+1) === Signal auf der ganzen Reihe an Stelle i.
 * Gerechnet ueber Q.einstiegSignal (Backtest-Pfad, quant.js:1598/1622) UND ueber die
 * extrahierte reine Funktion. Zusaetzlich: Fensterabhaengigkeit 260 (Backtest) vs 390 (Live 5m/5d) vs ganze Vorgeschichte. */
var fs = require('fs');
var Q = require('../../../quant.js');
var pb = require('./pullback.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var SYMS = ['AAPL', 'NVDA', 'MSFT'], IV = '5m', N = 300;
var P = { ENTRY: 'pullback', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2, MINQ: 0, CHAN: false, MTF: false, TREND: false };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);
function sigOf(r) { return r ? r.dir : null; }
var tot = 0, abwA = 0, abwB = 0, abw260v390 = 0, abw260vAll = 0, sigN = 0;
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  // Nur Sitzungskerzen (Mo-Fr, 0-390 Min), Stempel-Kerzen (20:00Z) fallen damit raus
  bars = bars.filter(function (b) { var d = new Date(b[0]); var wt = d.getUTCDay(); var m = Q.minutenSeitOeffnung(b[0]); return wt >= 1 && wt <= 5 && m >= 0 && m < 390; });
  var n = bars.length, dA = 0, dB = 0, d1 = 0, d2 = 0, s = 0;
  for (var k = 0; k < N; k++) {
    var i = 400 + Math.floor(rnd() * (n - 400));
    // A) Backtest-Pfad: ganze Reihe an Stelle i vs. Praefix
    var full = sigOf(Q.einstiegSignal(bars, i, P));
    var pre = sigOf(Q.einstiegSignal(bars.slice(0, i + 1), i, P));
    if (full !== pre) dA++;
    // B) reine Funktion: ganze Reihe (Fenster 260 endet bei i) vs. Praefix
    var fullB = sigOf(pb(bars, i, { win: 260 }));
    var preB = sigOf(pb(bars.slice(0, i + 1), i, { win: 260 }));
    if (fullB !== preB) dB++;
    if (fullB != null) s++;
    // Fensterabhaengigkeit (kein Zukunftsblick, aber Live != Backtest)
    var w390 = sigOf(pb(bars, i, { win: 390 }));
    var wAll = sigOf(pb(bars, i, { win: 0 }));
    if (fullB !== w390) d1++;
    if (fullB !== wAll) d2++;
    tot++;
  }
  abwA += dA; abwB += dB; abw260v390 += d1; abw260vAll += d2; sigN += s;
  console.log(sym, 'Bars(Sitzung)=' + n, 'geprueft=' + N, 'Abw(einstiegSignal)=' + dA, 'Abw(rein)=' + dB, 'Signale=' + s, 'Fenster260vs390=' + d1, 'Fenster260vsAlles=' + d2);
});
console.log('GESAMT geprueft=' + tot, 'Abweichungen Praefix (Backtest-Pfad)=' + abwA, 'Abweichungen Praefix (reine Fn)=' + abwB, 'Signale an Stichproben=' + sigN);
console.log('Fensterabhaengigkeit: 260 vs 390 Bars: ' + abw260v390 + '/' + tot + ', 260 vs ganze Vorgeschichte: ' + abw260vAll + '/' + tot);
