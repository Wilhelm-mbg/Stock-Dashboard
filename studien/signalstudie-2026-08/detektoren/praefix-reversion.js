'use strict';
/* Praefix-Probe fuer reversionSignal: Signal auf bars.slice(0,i+1) === Signal auf ganzer Reihe an Stelle i.
   Drei Pruefungen je Index:
   A) Fensterlauf (wie einstiegSignal, quant.js:1601): Praefix vs. ganze Reihe  -> Zukunftsblick?
   B) Rohfunktion auf dem GANZEN Praefix (kein Fenster) vs. Fensterlauf          -> Fenster-/EMA-Warmlauf-Empfindlichkeit
   C) wie A, aber lineType 'vwap'                                                  -> Zukunftsblick bei VWAP-Leitlinie? */
var fs = require('fs');
var Q = require('../../../quant.js');
var det = require('./reversion.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '1m';
var SYMS = ['AAPL', 'NVDA', 'MSFT'];
var N = 300;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);   // EIN Generator, ausserhalb aller Schleifen

function sigRaw(bars, lineType) { var r = Q.reversionSignal(bars, lineType, 20, 2.0); return r.signal || null; }
function sigWin(bars, ci, lineType) { var r = det.reversion(bars, ci, { lineType: lineType }); return r ? (r.dir > 0 ? 'call' : 'put') : null; }

var tot = { A: [0, 0], B: [0, 0], C: [0, 0] }, sigCount = 0, sigCountV = 0;
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length, a = 0, b = 0, c = 0, s = 0, sv = 0;
  for (var k = 0; k < N; k++) {
    var i = 300 + Math.floor(rnd() * (n - 300));
    var pre = bars.slice(0, i + 1);
    // A: Fensterlauf Praefix vs. ganze Reihe
    var full = sigWin(bars, i, 'ema'), part = sigWin(pre, i, 'ema');
    if (full !== part) a++;
    if (full) s++;
    // B: Rohfunktion auf ganzem Praefix (so ruft depot.js sie live: ganze Fetch-Reihe) vs. Fensterlauf
    var raw = sigRaw(pre, 'ema');
    if (raw !== full) b++;
    // C: VWAP-Leitlinie
    var fullV = sigWin(bars, i, 'vwap'), partV = sigWin(pre, i, 'vwap');
    if (fullV !== partV) c++;
    if (fullV) sv++;
  }
  console.log(sym, IV, 'n=' + n, 'geprueft=' + N, 'A(Praefix ema) Abw=' + a, 'B(Fenster vs. ganzes Praefix) Abw=' + b, 'C(Praefix vwap) Abw=' + c, 'Signale ema=' + s, 'vwap=' + sv);
  tot.A[0] += N; tot.A[1] += a; tot.B[0] += N; tot.B[1] += b; tot.C[0] += N; tot.C[1] += c; sigCount += s; sigCountV += sv;
});
console.log('SUMME', IV, 'A: ' + tot.A[1] + '/' + tot.A[0], 'B: ' + tot.B[1] + '/' + tot.B[0], 'C: ' + tot.C[1] + '/' + tot.C[0], 'Signale ema=' + sigCount + ' vwap=' + sigCountV);

// Zusatz: gezielt Indizes MIT Signal pruefen (zufaellige Indizes treffen selten ein Signal)
var hits = 0, abw = 0, abwB = 0;
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length;
  for (var i = 300; i < n && hits < 400; i += 1 + Math.floor(rnd() * 3)) {
    var full = sigWin(bars, i, 'ema');
    if (!full) continue;
    hits++;
    var pre = bars.slice(0, i + 1);
    if (sigWin(pre, i, 'ema') !== full) abw++;
    if (sigRaw(pre, 'ema') !== full) abwB++;
  }
});
console.log('SIGNAL-INDIZES', IV, 'gefunden=' + hits, 'Praefix-Abw=' + abw, 'Fenster-vs-ganzesPraefix-Abw=' + abwB);
