/* Live-Fenster-Probe: Der Scanner holt 60m mit range=1mo (~151 Kerzen, depot.js 1998/2311).
 * Studie/Edge-Wächter rechnen auf dem 730d-Archiv. Gleiches Signal? */
var fs = require('fs');
var D = require('./rsi2seit.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var SYMS = ['AAPL', 'NVDA', 'JPM', 'MSFT', 'AMD'];
var W = 151;   // gemessen: 60m-Kerzen in 30 Kalendertagen (AAPL-Archiv)
var tot = { archivSig: 0, liveSig: 0, beide: 0, nurArchiv: 0, nurLive: 0, call: 0, put: 0 };
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_60m_' + sym + '.json', 'utf8')).series.filter(function (b) { return b[0] % 60000 === 0; });
  var r = { archivSig: 0, liveSig: 0, beide: 0, nurArchiv: 0, nurLive: 0 };
  for (var i = 300; i < bars.length; i++) {
    var a = D.rsi2seit(bars, i);
    var l = D.rsi2seit(bars.slice(i - W + 1, i + 1), W - 1);
    if (a) { r.archivSig++; if (a.dir > 0) tot.call++; else tot.put++; }
    if (l) r.liveSig++;
    if (a && l) r.beide++; else if (a) r.nurArchiv++; else if (l) r.nurLive++;
  }
  Object.keys(r).forEach(function (k) { tot[k] += r[k]; });
  console.log(sym, JSON.stringify(r));
});
console.log('GESAMT', JSON.stringify(tot), 'Übereinstimmung der Signale (beide/(Vereinigung)) =', (tot.beide / (tot.archivSig + tot.nurLive)).toFixed(3));
