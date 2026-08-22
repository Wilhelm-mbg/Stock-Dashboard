var fs = require('fs'); var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '1m';
['NVDA','MU','GOOGL'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length, sig = 0, extrem = 0, tot = 0, liveKurz = 0, liveEma = 0, liveN = 0;
  for (var i = 300; i < n; i += 7) {
    var w = bars.slice(i - 260, i + 1); var r = Q.rsiExtremSignal(w); tot++;
    if (r.signal) { sig++; if (r.wert === 0 || r.wert === 100) extrem++; }
    if (IV === '1m') {
      var tag = new Date(bars[i][0]).toISOString().slice(0, 10);
      var s0 = i; while (s0 > 0 && new Date(bars[s0 - 1][0]).toISOString().slice(0, 10) === tag) s0--;
      var lw = bars.slice(s0, i + 1); var lr = Q.rsiExtremSignal(lw); liveN++;
      if ((lr.signal || 0) !== (r.signal || 0)) { if (lw.length < 120) liveKurz++; else liveEma++; }
    }
  }
  console.log(sym, IV, 'Kerzen geprueft=' + tot, 'Signalquote=' + (sig / tot * 100).toFixed(1) + '%', 'davon RSI exakt 0/100: ' + (extrem / Math.max(1, sig) * 100).toFixed(0) + '%',
    IV === '1m' ? '| Live-1m-Abweichung: n<120 -> ' + liveKurz + ', EMA-Warmlauf -> ' + liveEma + ' von ' + liveN : '');
});
