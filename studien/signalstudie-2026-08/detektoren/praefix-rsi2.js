// Praefix-Probe fuer rsi2: Signal auf bars.slice(0,i+1) === Signal auf der ganzen Reihe an Stelle i.
// Zusatz: Fensterabhaengigkeit (EMA100-Warmlauf) - Backtest-Fenster 261 vs. Explorer 301 vs. volle Historie.
var fs = require('fs');
var Q = require('../../../quant.js');
var D = require('./rsi2.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '1m';
var SYMS = (process.argv[3] || 'NVDA,MU,GOOGL').split(',');
var N = parseInt(process.argv[4] || '300', 10);

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);   // EIN Generator, ausserhalb der Schleife

function sigOf(r) { return r ? r.dir : 0; }
var gesamt = 0, abw = 0, sigAnz = 0, fensterAbw = 0, fensterN = 0, explAbw = 0, sessAbw = 0, sessN = 0;
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length;
  var sigs = 0, lokal = 0, lokalAbw = 0;
  for (var k = 0; k < N; k++) {
    var i = 130 + Math.floor(rnd() * (n - 130));
    // (a) Praefix: nur Kerzen 0..i bekannt
    var a = D.rsi2Signal(bars.slice(0, i + 1), i, {});
    // (b) ganze Reihe, Stelle i (Zukunft liegt im Array, darf nicht benutzt werden)
    var b = D.rsi2Signal(bars, i, {});
    // (c) Gegenprobe: Zukunft manipuliert -> Ergebnis muss gleich bleiben
    var mani = bars.slice(); for (var j = i + 1; j < n; j++) mani[j] = [bars[j][0], bars[j][1] * (1 + (rnd() - 0.5) * 0.2), bars[j][2], bars[j][3], bars[j][4]];
    var c = D.rsi2Signal(mani, i, {});
    gesamt++; lokal++;
    if (sigOf(a) !== sigOf(b) || sigOf(a) !== sigOf(c)) { abw++; lokalAbw++; }
    if (sigOf(a)) { sigs++; sigAnz++; }
    // Fensterabhaengigkeit: Backtest 261 Kerzen vs. volle Historie vs. Explorer 301
    var full = Q.rsiExtremSignal(bars.slice(0, i + 1)).signal || 0;
    var w261 = Q.rsiExtremSignal(bars.slice(Math.max(0, i - 260), i + 1)).signal || 0;
    var w301 = Q.rsiExtremSignal(bars.slice(Math.max(0, i - 300), i + 1)).signal || 0;
    fensterN++;
    if (full !== w261) fensterAbw++;
    if (w261 !== w301) explAbw++;
    // Live-Nachbildung 1m: Yahoo range=1d -> nur Kerzen des aktuellen Tages
    if (IV === '1m') {
      var tag = new Date(bars[i][0]).toISOString().slice(0, 10);
      var s0 = i; while (s0 > 0 && new Date(bars[s0 - 1][0]).toISOString().slice(0, 10) === tag) s0--;
      var live = Q.rsiExtremSignal(bars.slice(s0, i + 1)).signal || 0;
      sessN++; if (live !== w261) sessAbw++;
    }
  }
  console.log(sym, IV, 'Kerzen=' + n, 'geprueft=' + lokal, 'Abweichungen=' + lokalAbw, 'Signale=' + sigs);
});
console.log('GESAMT geprueft=' + gesamt + ' Abweichungen=' + abw + ' Signale=' + sigAnz + ' Trefferquote=' + ((gesamt - abw) / gesamt * 100).toFixed(1) + '%');
console.log('Fenster: volle Historie vs. 261 Kerzen abweichend: ' + fensterAbw + '/' + fensterN + ' | 261 vs. 301 (Explorer): ' + explAbw + '/' + fensterN);
if (sessN) console.log('Live-1m-Nachbildung (nur Tageskerzen, range=1d) vs. 261-Fenster abweichend: ' + sessAbw + '/' + sessN);
