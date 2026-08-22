'use strict';
/* Praefix-Probe fuer vwap-Abstand / vwap-Kreuz.
   Die App-Signalfunktionen (signalCross, reversionSignal) kennen nur "Ende des Arrays =
   jetzt" und lesen closes[j]/line[j] nur fuer j <= n-1 (quant.js:757-771, 934-950).
   Die einzige kumulative, ueber die ganze Reihe laufende Komponente ist die Linie
   Q.vwapLine. Deshalb wird hier geprueft:
   1) LINIE: vwapLine(bars.slice(0,i+1))[i] === vwapLine(bars)[i]   (Zukunftsblick?)
   2) SIGNAL: Signal aus Praefix bars[0..i] === Signal, wenn man die Signalfunktion mit
      einer Reihe fuettert, deren Linie aus der GANZEN Reihe stammt. Umgesetzt ueber
      eine Kopie der App-Logik (crossCore / reversion) auf (closes, lineVoll, i).
   3) FENSTER: Signal aus Praefix vs. Signal aus dem 120-Bar-Fenster wie in
      backtestIntraday (quant.js:2563) - Fensterabhaengigkeit der VWAP-Verankerung. */
var fs = require('fs');
var Q = require('../../../quant.js');
var V = require('./vwap.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '5m', N = +(process.argv[3] || 250);
var SYMS = ['AAPL', 'MSFT', 'NVDA'];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);

function stdev(a) { var m = a.reduce(function (x, y) { return x + y; }, 0) / a.length; return Math.sqrt(a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / (a.length - 1)); }
// Kopie der App-Logik, aber mit der VOLLEN Linie an Stelle i ausgewertet
function kreuzVoll(closes, line, i, confirmBps, period) {
  var n = i + 1; if (n < period + 3) return 0;
  var price = closes[i], ma = line[i], conf = confirmBps / 10000, K = 6, wasAbove = false, wasBelow = false;
  for (var j = n - 2; j >= Math.max(period, n - 1 - K); j--) { if (closes[j] >= line[j]) wasAbove = true; if (closes[j] <= line[j]) wasBelow = true; }
  return price > ma * (1 + conf) && wasBelow ? 1 : price < ma * (1 - conf) && wasAbove ? -1 : 0;
}
function abstandVoll(closes, line, i, period, zThr) {
  var n = i + 1; if (n < Math.max(period, 60) + 5) return 0;
  var d = []; for (var j = Math.max(period, n - 80); j < n; j++) d.push((closes[j] - line[j]) / line[j]);
  if (d.length < 30) return 0; var sd = stdev(d); if (sd <= 1e-8) return 0;
  var m = d.reduce(function (a, b) { return a + b; }, 0) / d.length, z = (d[d.length - 1] - m) / sd;
  var s = z <= -zThr ? 1 : z >= zThr ? -1 : 0;
  if (s > 0 && !(closes[i] > closes[i - 1])) s = 0; if (s < 0 && !(closes[i] < closes[i - 1])) s = 0;
  return s;
}

var gesamt = 0, abwSig = 0, abwLinie = 0, abwFenster = 0, sig = { p: 0, m: 0 };
SYMS.forEach(function (sym) {
  var f = STORE + 'bars_' + IV + '_' + sym + '.json';
  if (!fs.existsSync(f)) { console.log(sym, 'fehlt'); return; }
  var bars = JSON.parse(fs.readFileSync(f, 'utf8')).series;
  var closes = bars.map(function (b) { return b[1]; });
  var lineVoll = Q.vwapLine(bars), n = bars.length;
  for (var k = 0; k < N; k++) {
    var i = 200 + Math.floor(rnd() * (n - 200));
    var praefix = bars.slice(0, i + 1);
    if (Math.abs(Q.vwapLine(praefix)[i] - lineVoll[i]) > 1e-9) abwLinie++;
    ['abstand', 'kreuz'].forEach(function (va) {
      gesamt++;
      var a = V.vwapSignal(praefix, i, { variante: va }); var ad = a ? a.dir : 0;
      var vd = va === 'kreuz' ? kreuzVoll(closes, lineVoll, i, 15, 20) : abstandVoll(closes, lineVoll, i, 20, 2.0);
      if (ad !== vd) abwSig++;
      if (ad > 0) sig.p++; else if (ad < 0) sig.m++;
      var win = bars.slice(Math.max(0, i - 120), i + 1);
      var c = va === 'kreuz' ? Q.signalCross(win, 'vwap', 20, 15) : Q.reversionSignal(win, 'vwap', 20, 2.0);
      var cd = va === 'kreuz' ? (c.crossed === 'up' ? 1 : c.crossed === 'down' ? -1 : 0) : (c.signal === 'call' ? 1 : c.signal === 'put' ? -1 : 0);
      if (cd !== ad) abwFenster++;
    });
  }
  console.log(sym, IV, 'n=' + n);
});
console.log('Zeitrahmen', IV, '| Proben', gesamt, '(je', N, 'Indizes x 3 Symbole x 2 Varianten)');
console.log('Abweichungen Linie (Praefix vs. voll):', abwLinie, '/', gesamt / 2, '| Signal (Praefix vs. voll-Linie):', abwSig, '/', gesamt, '| Signale +:', sig.p, '-:', sig.m);
console.log('Fensterabhaengigkeit (120-Bar-Fenster wie backtestIntraday vs. Praefix):', abwFenster, '/', gesamt);
