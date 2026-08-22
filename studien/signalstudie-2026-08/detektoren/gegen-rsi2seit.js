/* Gegenpruefung rsi2seit: (a) Praefix-Probe mit Schwerpunkt am ENDE der Reihe (letzte 80 Kerzen
 * jedes Symbols, dort zeigt sich Zukunftsblick), (b) 6 Symbole, (c) ungefilterte Reihe (mit
 * Quote-Stempeln) ebenfalls auf Praefix-Gleichheit, (d) Snippet-Lauf auf 2 Symbolen,
 * (e) Vergleich Snippet gegen den Live-Aufruf aus depot.js:2683 (Parameter zOf(15)=2.0). */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(4711);
// Snippet des Vorpruefers, woertlich
var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 0, CHAN: false, MTF: false, TREND: false };
function signal(bars, i, params) {
  var s = Q.einstiegSignal(bars, i, Object.assign({}, P, params || {}));
  return s && s.dir ? { dir: s.dir === 'call' ? 1 : -1 } : null;
}
// Live-Aufruf depot.js:2683 nachgebaut (cfg-Defaults depot.js:27)
function liveCall(sigBars) {
  var cfg = { lineType: 'ema', period: 20, confirmBps: 15 };
  function zOf(c) { return c <= 5 ? 1.5 : c <= 15 ? 2.0 : 2.5; }
  var v = Q.einstiegSignal(sigBars, sigBars.length - 1, { ENTRY: 'rsi2seit', LINE: cfg.lineType || 'ema', period: cfg.period || 20,
    confirmBps: cfg.confirmBps, ZTHR: zOf(cfg.confirmBps), MINQ: 0, CHAN: false, MTF: false, TREND: false });
  return v && v.dir === 'call' ? 'call' : (v && v.dir === 'put' ? 'put(verworfen)' : null);
}
function gleich(a, b) { return (a === null && b === null) || (a && b && a.dir === b.dir); }
var SYMS = ['AAPL', 'NVDA', 'JPM', 'MSFT', 'TSLA', 'XOM'];
var tot = { gepr: 0, abw: 0, sig: 0, ende: 0, endeAbw: 0, roh: 0, rohAbw: 0 };
SYMS.forEach(function (sym) {
  var roh = JSON.parse(fs.readFileSync(STORE + 'bars_60m_' + sym + '.json', 'utf8')).series;
  var bars = roh.filter(function (b) { return b[0] % 60000 === 0; });
  var n = bars.length, a = 0, s = 0, g = 0, eA = 0, eG = 0;
  var idx = [];
  for (var k = 0; k < 150; k++) idx.push(300 + Math.floor(rnd() * (n - 300)));
  for (var i = n - 80; i < n; i++) idx.push(i);            // Schwerpunkt Ende
  var feuert = []; for (var j = 300; j < n; j++) if (signal(bars, j)) feuert.push(j);
  for (k = 0; k < 60 && feuert.length; k++) idx.push(feuert[Math.floor(rnd() * feuert.length)]);
  idx.forEach(function (i) {
    var voll = signal(bars, i), pre = signal(bars.slice(0, i + 1), i);
    g++; if (voll) s++;
    if (!gleich(voll, pre)) { a++; console.log('ABW', sym, i, new Date(bars[i][0]).toISOString(), JSON.stringify(voll), JSON.stringify(pre)); }
    if (i >= n - 80) { eG++; if (!gleich(voll, pre)) eA++; }
  });
  // ungefilterte Reihe: Praefix-Gleichheit (Stempel sind fuer Zukunftsblick irrelevant, aber wir pruefen es)
  var rA = 0, rG = 0;
  for (var i2 = roh.length - 40; i2 < roh.length; i2++) { rG++; if (!gleich(signal(roh, i2), signal(roh.slice(0, i2 + 1), i2))) rA++; }
  // Live-Aufruf vs Snippet an den letzten 300 Kerzen (volle Reihe als "sigBars")
  var lv = 0, lvAbw = 0;
  for (var i3 = n - 300; i3 < n; i3++) {
    var sb = bars.slice(0, i3 + 1);
    var l = liveCall(sb), sn = signal(bars, i3);
    var lDir = l === 'call' ? 1 : l === 'put(verworfen)' ? -1 : null, sDir = sn ? sn.dir : null;
    lv++; if (lDir !== sDir) lvAbw++;
  }
  console.log(sym, 'n=' + n, 'roh=' + roh.length, 'feuert=' + feuert.length, 'geprueft=' + g, 'Signal=' + s, 'Abw=' + a,
    '| Ende(80):', eG, 'Abw=' + eA, '| roh(40): Abw=' + rA, '| Live-vs-Snippet(300): Abw=' + lvAbw,
    '| letzte Kerze', new Date(bars[n - 1][0]).toISOString(), 'live=' + liveCall(bars));
  tot.gepr += g; tot.abw += a; tot.sig += s; tot.ende += eG; tot.endeAbw += eA; tot.roh += rG; tot.rohAbw += rA;
});
console.log('GESAMT', JSON.stringify(tot), tot.abw + tot.rohAbw ? 'ZUKUNFTSBLICK' : 'walk-forward');
// Snippet-Lauf auf 2 Symbolen: Zaehlung long/short, erstes Signal
['AAPL', 'MSFT'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_60m_' + sym + '.json', 'utf8')).series.filter(function (b) { return b[0] % 60000 === 0; });
  var L = 0, S = 0, first = null;
  for (var i = 0; i < bars.length; i++) { var s = signal(bars, i); if (s) { if (s.dir > 0) L++; else S++; if (!first) first = [i, new Date(bars[i][0]).toISOString(), s.dir]; } }
  console.log('SNIPPET', sym, 'long=' + L, 'short=' + S, 'erstes=' + JSON.stringify(first), 'i=0..5:', [0, 1, 2, 3, 4, 5].map(function (i) { return signal(bars, i); }).join(','));
});
