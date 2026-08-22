// Gegenpruefung wave: (A) Praefix-Probe mit Schwerpunkt REIHENENDE, (B) Live-Pfad-Nachbau
// (depot.js 2633-2661 + 2825-2840) gegen das Snippet, (C) Snippet-Lauf auf 2 Symbolen.
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '5m';
var LIVE_N = { '1m': 390, '5m': 390, '15m': 130, '60m': 154 }[IV];
var SYMS = ['AAPL', 'MSFT', 'NVDA'];

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rnd = mulberry32(4711);   // ausserhalb aller Schleifen

// Snippet des Pruefers (1:1)
function wave(bars, i, params) {
  var P = Object.assign({ ENTRY: 'wave', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 60, CHAN: true, MTF: false, TREND: true }, params || {});
  if (i < 2 || i >= bars.length) return null;
  var v = Q.einstiegSignal(bars, i, P);
  return v && v.dir ? { dir: v.dir === 'call' ? 1 : -1 } : null;
}

// Live-Pfad-Nachbau: sigBars = die letzten LIVE_N fertigen Bars (Yahoo range), Logik wie Scanner
function liveWave(sigBars, opt) {
  var useChan = opt.CHAN !== false, mtf = !!opt.MTF;
  var wq = Q.waveQuality(sigBars, 'ema', 20, 2.0);
  if (!(wq.signal && wq.score >= 60)) return null;
  var dir = wq.signal, chE = null;
  if (useChan) {
    chE = Q.trendChannel(Q.degapBarArray(sigBars));
    if (!chE || !chE.gueltig) return null;
    if (chE.ausbruch) return null;                          // depot.js:2650 - in einstiegSignal NICHT geprueft
    if (dir === 'call' && chE.pos > 0.30) return null;
    if (dir === 'put' && chE.pos < 0.70) return null;
    if (dir === 'call' && chE.trend === 'down') return null;
    if (dir === 'put' && chE.trend === 'up') return null;
  }
  if (mtf && !Q.mtfAgrees(sigBars, dir, 5)) return null;   // depot.js:2796, auf GANZER Live-Serie
  if (chE) {
    if (dir === 'call' && chE.trend === 'down') return null;
    if (dir === 'put' && chE.trend === 'up') return null;
  }
  var tc = sigBars.slice(-240).map(function (b) { return b[1]; });
  if (tc.length >= 100) {
    var e100 = Q.emaSeries(tc, 100);
    var rising = e100[e100.length - 1] > e100[Math.max(0, e100.length - 9)];
    if ((dir === 'call' && !rising) || (dir === 'put' && rising)) return null;
  }
  return { dir: dir === 'call' ? 1 : -1 };
}

var varianten = [
  { name: 'LIVE CHAN+TREND', p: {} },
  { name: 'CHAN aus, TREND an', p: { CHAN: false } },
  { name: 'CHAN aus, TREND aus', p: { CHAN: false, TREND: false } }
];
if (IV === '1m') varianten.push({ name: 'applySetup 1m: CHAN+TREND+MTF', p: { MTF: true } });

var sum = { gepr: 0, abw: 0, sig: 0, ende: 0 };
var live = { n: 0, beide: 0, nurSnippet: 0, nurLive: 0, bsp: [] };
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length;
  var idx = [];
  for (var k = 0; k < 300; k++) idx.push(300 + Math.floor(rnd() * (n - 300)));   // bis n-1 einschliesslich
  for (var e = Math.max(300, n - 60); e < n; e++) idx.push(e);                   // Reihenende komplett
  varianten.forEach(function (V) {
    var a = 0, s = 0;
    idx.forEach(function (i) {
      var voll = wave(bars, i, V.p), pre = wave(bars.slice(0, i + 1), i, V.p);
      var vd = voll ? voll.dir : 0, pd = pre ? pre.dir : 0;
      sum.gepr++; if (vd) { s++; sum.sig++; }
      if (i >= n - 60) sum.ende++;
      if (vd !== pd) { a++; sum.abw++; console.log('ABWEICHUNG', sym, V.name, i, new Date(bars[i][0]).toISOString(), vd, pd); }
    });
    console.log(IV, sym, V.name, 'geprueft', idx.length, 'Signale', s, 'Abweichungen', a);
  });
  // (B) Live-Pfad vs Snippet, Live-Konfig; bei 1m zusaetzlich MTF wie applySetup
  var mtf = IV === '1m';
  for (var i = Math.max(400, LIVE_N); i < n; i++) {
    var sn = wave(bars, i, { MTF: mtf });
    var lv = liveWave(bars.slice(i - LIVE_N + 1, i + 1), { CHAN: true, MTF: mtf });
    live.n++;
    if (sn && lv) live.beide++;
    else if (sn) { live.nurSnippet++; if (live.bsp.length < 6) live.bsp.push(sym + ' ' + new Date(bars[i][0]).toISOString() + ' nurSnippet'); }
    else if (lv) { live.nurLive++; if (live.bsp.length < 6) live.bsp.push(sym + ' ' + new Date(bars[i][0]).toISOString() + ' nurLive'); }
  }
});
console.log('PRAEFIX', IV, JSON.stringify(sum));
console.log('LIVE-PFAD vs SNIPPET', IV, 'Live-Fenster', LIVE_N, 'MTF', IV === '1m', JSON.stringify(live));

// (C) Snippet auf 2 Symbolen, Live-Konfig und ohne Kanal
['MSFT', 'NVDA'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var c = { live: 0, ohneKanal: 0, call: 0, put: 0 }, ex = [];
  for (var i = 0; i < bars.length; i++) {
    var s = wave(bars, i); if (s) { c.live++; if (ex.length < 3) ex.push(new Date(bars[i][0]).toISOString() + ':' + s.dir); }
    var s2 = wave(bars, i, { CHAN: false }); if (s2) { c.ohneKanal++; if (s2.dir > 0) c.call++; else c.put++; }
  }
  console.log('SNIPPET', IV, sym, JSON.stringify(c), ex.join(' '));
});
