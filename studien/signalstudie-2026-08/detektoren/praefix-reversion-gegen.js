'use strict';
/* Gegenpruefung reversion: (1) Praefix-Probe exhaustiv in den LETZTEN 300 Kerzen jeder Reihe
   (dort zeigt sich Zukunftsblick), (2) Zufallsindizes ueber die GANZE Reihe inkl. i<300 (Laengen-Guard),
   (3) Live-Pfad (Rohfunktion auf ganzer Reihe bis i, wie depot.js:2657) vs. Snippet-Fenster,
   auch fuer vwap, (4) Aufrufreihenfolge: Signal an i nach vorherigem Aufruf an j != i unveraendert,
   (5) Sitzungsverteilung der Signale (Minuten seit Oeffnung, Wochentag). */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '1m';
var SYMS = ['AAPL', 'NVDA', 'MSFT'];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(4711);

// Snippet exakt wie vom Pruefer gemeldet
function reversionSig(bars, i, params) {
  var p = Object.assign({ lineType: 'ema', period: 20, zThr: 2.0 }, params || {});
  var win = bars.slice(Math.max(0, i - Math.max(p.period * 4, 260)), i + 1);
  var r = Q.reversionSignal(win, p.lineType, p.period, p.zThr);
  return r.signal ? { dir: r.signal === 'call' ? 1 : -1 } : null;
}
function d(x) { return x ? x.dir : 0; }
// Live-Pfad: Rohfunktion auf der ganzen Reihe bis i (depot.js:2657 bekommt sigBars komplett)
function liveSig(bars, i, lineType) { var r = Q.reversionSignal(bars.slice(0, i + 1), lineType, 20, 2.0); return r.signal === 'call' ? 1 : r.signal === 'put' ? -1 : 0; }

var T = { ende: [0, 0], zuf: [0, 0], live: [0, 0], liveV: [0, 0], ord: [0, 0], sig: 0, sigEnde: 0 };
var bucket = { open30: 0, open60: 0, mitte: 0, schluss60: 0, ausserhalb: 0, wochenende: 0 };
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length;
  // (1) letzte 300 Kerzen exhaustiv
  for (var i = n - 300; i < n; i++) {
    var full = d(reversionSig(bars, i)), part = d(reversionSig(bars.slice(0, i + 1), i));
    T.ende[0]++; if (full !== part) T.ende[1]++;
    if (full) T.sigEnde++;
  }
  // (2) Zufall ueber die ganze Reihe inkl. kleiner i
  for (var k = 0; k < 300; k++) {
    var j = Math.floor(rnd() * n);
    var f2 = d(reversionSig(bars, j)), p2 = d(reversionSig(bars.slice(0, j + 1), j));
    T.zuf[0]++; if (f2 !== p2) T.zuf[1]++;
  }
  // (3) Live-Pfad vs. Snippet-Fenster: jeder 7. Index ab 300 (ema) / ab 400 (vwap), plus Verteilung
  for (var m = 300; m < n; m += 7) {
    var s = d(reversionSig(bars, m));
    T.live[0]++; if (liveSig(bars, m, 'ema') !== s) T.live[1]++;
    var sv = d(reversionSig(bars, m, { lineType: 'vwap' }));
    T.liveV[0]++; if (liveSig(bars, m, 'vwap') !== sv) T.liveV[1]++;
    if (s) {
      T.sig++;
      var dt = new Date(bars[m][0]), wd = dt.getUTCDay(), mo = Q.minutenSeitOeffnung(bars[m][0]);
      if (wd === 0 || wd === 6) bucket.wochenende++;
      else if (mo < 0 || mo >= 390) bucket.ausserhalb++;
      else if (mo < 30) bucket.open30++;
      else if (mo < 60) bucket.open60++;
      else if (mo >= 330) bucket.schluss60++;
      else bucket.mitte++;
    }
  }
  // (4) Aufrufreihenfolge
  for (var q = 0; q < 200; q++) {
    var a = 300 + Math.floor(rnd() * (n - 300)), b = 300 + Math.floor(rnd() * (n - 300));
    var first = d(reversionSig(bars, a)); reversionSig(bars, b); var again = d(reversionSig(bars, a));
    T.ord[0]++; if (first !== again) T.ord[1]++;
  }
  console.log(sym, IV, 'n=' + n, 'letzte Kerze', new Date(bars[n - 1][0]).toISOString());
});
console.log('SUMME', IV, JSON.stringify(T));
console.log('Signal-Verteilung (ema, Live-Params):', JSON.stringify(bucket));
