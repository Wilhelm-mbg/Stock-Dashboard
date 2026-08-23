// Praefix-Probe signalCross: Signal auf bars.slice(0,i+1) == Signal der ganzen Reihe an Stelle i?
// Zusaetzlich: Fenster-Abhaengigkeit (Backtest-Fenster 261 Kerzen vs. volle Vorgeschichte).
var fs = require('fs');
var Q = require('../../../quant.js');
var D = require('./signalCross.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m';
var SYMS = (process.argv[3] || 'AAPL,NVDA,MSFT').split(',');
var N_PRO_SYM = parseInt(process.argv[4] || '300', 10);

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);   // EIN Generator, ausserhalb aller Schleifen

// "Ganze Reihe an Stelle i": EMA ueber die komplette Reihe, crossCore-Logik auf Index i
// nachgebaut (quant.js:754-772), damit nichts hinter i einfliessen KANN, ausser die Funktion tut es.
function ganzeReiheAn(bars, i, P) {
  var closes = bars.map(function (b) { return b[1]; });
  var line = Q.emaSeries(closes, P.period);
  var n = i + 1, minIdx = P.period;
  if (n < minIdx + 3) return null;
  var price = closes[i], ma = line[i], conf = P.confirmBps / 10000, K = P.lookback + 3;
  var wasAbove = false, wasBelow = false;
  for (var j = n - 2; j >= Math.max(minIdx, n - 1 - K); j--) { if (closes[j] >= line[j]) wasAbove = true; if (closes[j] <= line[j]) wasBelow = true; }
  if (price > ma * (1 + conf) && wasBelow) return { dir: 1 };
  if (price < ma * (1 - conf) && wasAbove) return { dir: -1 };
  return null;
}
function eq(a, b) { return (a ? a.dir : 0) === (b ? b.dir : 0); }

var gesamt = 0, abw = 0, abwFenster = 0, sigs = 0, beispiele = [];
SYMS.forEach(function (sym) {
  var f = STORE + 'bars_' + IV + '_' + sym + '.json';
  if (!fs.existsSync(f)) { console.log('fehlt:', f); return; }
  var bars = JSON.parse(fs.readFileSync(f, 'utf8')).series;
  var nb = bars.length, lo = 30, hi = nb - 2;
  for (var k = 0; k < N_PRO_SYM; k++) {
    var i = lo + Math.floor(rnd() * (hi - lo + 1));
    var praefix = D.signalCross(bars.slice(0, i + 1), i, { window: 'full' });  // nur Vergangenheit, volle Historie
    var voll = ganzeReiheAn(bars, i, D.LIVE);                                   // ganze Reihe, Stelle i
    var fenster = D.signalCross(bars, i);                                       // Backtest-Fenster (261 Kerzen), ganze Reihe uebergeben
    gesamt++;
    if (praefix) sigs++;
    if (!eq(praefix, voll)) { abw++; if (beispiele.length < 5) beispiele.push({ sym: sym, i: i, praefix: praefix, voll: voll }); }
    if (!eq(praefix, fenster)) abwFenster++;
  }
  console.log(sym, IV, 'Kerzen:', nb);
});
console.log(JSON.stringify({ zeitrahmen: IV, symbole: SYMS, geprueft: gesamt, signale: sigs, abweichungen_praefix_vs_ganz: abw, abweichungen_fenster261_vs_voll: abwFenster, beispiele: beispiele }));
