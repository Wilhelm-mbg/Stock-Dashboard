/* Präfix-Probe rsi2seit: Signal auf bars.slice(0,i+1) an Stelle i === Signal auf ganzer Reihe an Stelle i.
 * 3 Symbole x 60m, >= 200 zufällige Indizes je Symbol, mulberry32 AUSSERHALB der Schleife. */
var fs = require('fs');
var D = require('./rsi2seit.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(20260822);
var SYMS = ['AAPL', 'NVDA', 'JPM'];
var gepr = 0, abw = 0, sig = 0, N_PER = 250;
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_60m_' + sym + '.json', 'utf8')).series
    .filter(function (b) { return b[0] % 60000 === 0; });   // Quote-Stempel (krumme Sekunden) raus
  var n = bars.length, lo = 300, a = 0, s = 0;
  // Hälfte rein zufällig, Hälfte gezielt auf Kerzen, an denen die Vollreihe feuert (sonst testet man fast nur null===null)
  var idx = [];
  for (var k = 0; k < N_PER / 2; k++) idx.push(lo + Math.floor(rnd() * (n - lo)));
  var feuert = [];
  for (var i = lo; i < n; i++) if (D.rsi2seit(bars, i)) feuert.push(i);
  for (k = 0; k < N_PER / 2 && feuert.length; k++) idx.push(feuert[Math.floor(rnd() * feuert.length)]);
  idx.forEach(function (i) {
    var voll = D.rsi2seit(bars, i);
    var pre = D.rsi2seit(bars.slice(0, i + 1), i);
    var gleich = (voll === null && pre === null) || (voll && pre && voll.dir === pre.dir);
    gepr++; if (voll) s++;
    if (!gleich) { a++; console.log('ABWEICHUNG', sym, i, new Date(bars[i][0]).toISOString(), JSON.stringify(voll), JSON.stringify(pre)); }
  });
  abw += a; sig += s;
  console.log(sym, 'n=' + n, 'feuert gesamt=' + feuert.length, 'geprüft=' + idx.length, 'davon Signal=' + s, 'Abweichungen=' + a);
});
console.log('GESAMT geprüft=' + gepr + ' mit Signal=' + sig + ' Abweichungen=' + abw + ' -> ' + (abw ? 'ZUKUNFTSBLICK' : 'walk-forward'));
