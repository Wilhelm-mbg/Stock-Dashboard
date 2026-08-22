var Q = require('../../../quant.js');
function rsi2(bars, i, params) {
  var p = params || {};
  var win = bars.slice(Math.max(0, i - (p.window || 260)), i + 1);   // 261 Kerzen wie einstiegSignal (quant.js:1601)
  var s = Q.rsiExtremSignal(win, p.kaufSchwelle || 10, p.verkaufSchwelle || 90);
  if (s.signal && p.mtf && !Q.mtfAgrees(win, s.signal, 5)) return null;  // nur 1m: 5-Min-Bestaetigung wie Live/Backtest
  return s.signal ? { dir: s.signal === 'call' ? 1 : -1 } : null;
}
var fs = require('fs'); var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
['NVDA','MU'].forEach(function (sym) { ['1m','60m'].forEach(function (iv) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + sym + '.json', 'utf8')).series;
  var c = 0, pu = 0, cm = 0, pm = 0, live = 0, gleich = 0;
  for (var i = 300; i < bars.length; i++) {
    var r = rsi2(bars, i); if (r) { if (r.dir > 0) c++; else pu++; }
    var rm = rsi2(bars, i, { mtf: iv === '1m' }); if (rm) { if (rm.dir > 0) cm++; else pm++; }
    // Live-Pfad: Q.rsiExtremSignal(fertigeBars(ganze bekannte Reihe))
    var sb = Q.fertigeBars(bars.slice(0, i + 1), iv === '1m' ? 1 : 60, bars[i][0] + (iv === '1m' ? 1 : 60) * 60000);
    var l = Q.rsiExtremSignal(sb).signal; var ld = l === 'call' ? 1 : l === 'put' ? -1 : 0;
    if (ld) live++; if (ld === (r ? r.dir : 0)) gleich++;
  }
  console.log(sym, iv, 'Kerzen=' + (bars.length - 300), 'Snippet call/put=' + c + '/' + pu, '| mit MTF=' + cm + '/' + pm, '| Live-Signale=' + live, 'gleich=' + gleich + '/' + (bars.length - 300));
}); });
