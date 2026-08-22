// Praefix-Probe fuer den Wellental-Detektor: Signal auf bars.slice(0,i+1) an Stelle i
// muss dem Signal auf der ganzen Reihe an Stelle i entsprechen (sonst Zukunftsblick).
var fs = require('fs');
var W = require('./wave.js');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '5m';
var SYMS = ['AAPL', 'MSFT', 'NVDA'];
var N_PRO_SYM = 200;

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rnd = mulberry32(20260822);   // EIN Generator, ausserhalb aller Schleifen

var varianten = [
  { name: 'LIVE (CHAN+TREND)', p: {} },
  { name: 'ohne Kanal/Trend', p: { CHAN: false, TREND: false } }
];
var gesamt = 0, abw = 0, sigs = 0, wochenende = 0;
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  bars.forEach(function (b) { var d = new Date(b[0]).getUTCDay(); if (d === 0 || d === 6) wochenende++; });
  var n = bars.length;
  var idx = [];
  for (var k = 0; k < N_PRO_SYM; k++) idx.push(400 + Math.floor(rnd() * (n - 401)));
  // Zusaetzlich: alle Indizes, an denen die ganze Reihe ein Signal liefert (Signale sind selten;
  // ein reiner Zufallsindex traefe kaum eines, und genau dort muss die Probe hart sein).
  varianten.forEach(function (V) {
    var treffer = [];
    for (var i = 400; i < n; i++) { var s = W.waveSignal(bars, i, V.p); if (s) treffer.push(i); }
    var alle = idx.concat(treffer);
    var a = 0;
    alle.forEach(function (i) {
      var voll = W.waveSignal(bars, i, V.p);
      var pre = W.waveSignal(bars.slice(0, i + 1), i, V.p);
      var vd = voll ? voll.dir : 0, pd = pre ? pre.dir : 0;
      gesamt++; if (vd) sigs++;
      if (vd !== pd) { a++; abw++; console.log('ABWEICHUNG', sym, V.name, i, new Date(bars[i][0]).toISOString(), 'voll', vd, 'praefix', pd); }
    });
    console.log(IV, sym, V.name, 'geprueft', alle.length, '(davon Signale', treffer.length + ')', 'Abweichungen', a);
  });
});
console.log('SUMME', IV, 'geprueft', gesamt, 'Signale', sigs, 'Abweichungen', abw, 'Wochenend-Bars im Archiv', wochenende);
