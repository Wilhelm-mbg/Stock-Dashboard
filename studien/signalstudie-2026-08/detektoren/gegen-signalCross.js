// Gegenpruefung signalCross: (a) Praefix-Probe inkl. Reihen-Ende mit dem Snippet selbst,
// (b) Live-Fenster (range-Laenge) vs. Studien-Fenster 261, (c) Re-Feuern derselben Kreuzung
// nach Dedup, (d) Stempel-Kerzen im Archiv.
var fs = require('fs');
var Q = require('../../../quant.js');
var snip = require('./snippet-signalCross.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m';
var SYMS = (process.argv[3] || 'AAPL,NVDA,MSFT').split(',');
var LIVEWIN = { '60m': 154, '15m': 130, '5m': 390, '1m': 390 }[IV];   // range 1mo / 5d / 5d / 1d
var P = { lineType: 'ema', period: 20, confirmBps: 15, lookback: 3 };
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(4711);
function dirOf(s) { return s ? s.dir : 0; }
function liveRoh(bars, i) { var c = Q.signalCross(bars.slice(Math.max(0, i - LIVEWIN + 1), i + 1), P.lineType, P.period, P.confirmBps).crossed; return c ? (c === 'up' ? 1 : -1) : 0; }
function studRoh(bars, i) { var c = Q.signalCross(bars.slice(Math.max(0, i - Math.max(P.period * 4, 260)), i + 1), P.lineType, P.period, P.confirmBps, P.lookback).crossed; return c ? (c === 'up' ? 1 : -1) : 0; }

var out = {};
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var nb = bars.length;
  // (d) Stempel-Kerzen
  var stempel = bars.filter(function (b) { return b[0] % 60000 !== 0; }).map(function (b) { return new Date(b[0]).toISOString() + ' vol=' + b[2]; });
  // (a) Praefix-Probe: 200 zufaellige + die letzten 30 Indizes, Snippet auf Praefix vs. Snippet auf ganzer Reihe
  var idx = []; for (var k = 0; k < 200; k++) idx.push(30 + Math.floor(rnd() * (nb - 31))); for (var j = nb - 30; j < nb; j++) idx.push(j);
  var abw = 0, sig = 0;
  idx.forEach(function (i) { var a = snip(bars.slice(0, i + 1), i, P), b = snip(bars, i, P); if (dirOf(a) !== dirOf(b)) abw++; if (b) sig++; });
  // (b) Live-Fenster vs. Studien-Fenster ueber ALLE Indizes
  var abwLive = 0, nLive = 0, rohSig = 0, dedup = 0, refeuer = 0, lastSide = 0;
  var closes = bars.map(function (b) { return b[1]; });
  for (var i = 30; i < nb; i++) {
    nLive++;
    var r = studRoh(bars, i); if (r) rohSig++;
    if (r !== liveRoh(bars, i)) abwLive++;
  }
  // (c) Re-Feuern: Dedup-Signal gleicher Richtung ohne echten Seitenwechsel dazwischen
  var ema = Q.emaSeries(closes, P.period), lastDir = 0, seitenwechsel = true;
  for (var i = 30; i < nb; i++) {
    var s = snip(bars, i, P);
    if (s) {
      dedup++;
      if (s.dir === lastDir && !seitenwechsel) refeuer++;
      lastDir = s.dir; seitenwechsel = false;
    }
    // Seitenwechsel = Kurs auf der Gegenseite der Linie (fuer lastDir)
    if (lastDir === 1 && closes[i] <= ema[i]) seitenwechsel = true;
    if (lastDir === -1 && closes[i] >= ema[i]) seitenwechsel = true;
  }
  out[sym] = { kerzen: nb, praefix_geprueft: idx.length, praefix_abw: abw, praefix_signale: sig, liveFenster: LIVEWIN, liveVsStudie_geprueft: nLive, liveVsStudie_abw: abwLive, rohSignalKerzen: rohSig, dedupSignale: dedup, refeuerOhneSeitenwechsel: refeuer, stempelKerzen: stempel.length, stempelBeispiele: stempel.slice(0, 6) };
});
console.log(IV, JSON.stringify(out, null, 1));
