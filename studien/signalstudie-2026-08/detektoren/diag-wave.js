var fs = require('fs'); var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = '5m', c = { sig: 0, kanalGueltig: 0, posOk: 0, trendOk: 0, anyGueltig: 0, n: 0, ausbruch: 0 };
['AAPL','MSFT','NVDA'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  for (var i = 400; i < bars.length; i += 1) {
    var win = bars.slice(i - 380, i + 1);
    var wq = Q.waveQuality(win, 'ema', 20, 2.0);
    if (i % 10 === 0) { c.n++; var chA = Q.trendChannel(Q.degapBarArray(win)); if (chA && chA.gueltig) c.anyGueltig++; }
    if (!wq.signal || wq.score < 60) continue;
    c.sig++;
    var ch = Q.trendChannel(Q.degapBarArray(win));
    if (ch && ch.gueltig) {
      c.kanalGueltig++;
      if (ch.ausbruch) c.ausbruch++;
      var posOk = wq.signal === 'call' ? ch.pos <= 0.30 : ch.pos >= 0.70;
      var trOk = wq.signal === 'call' ? ch.trend !== 'down' : ch.trend !== 'up';
      if (posOk) c.posOk++;
      if (posOk && trOk) c.trendOk++;
      console.log(sym, new Date(bars[i][0]).toISOString(), wq.signal, 'z', wq.z, 'pos', ch.pos, 'trend', ch.trend, 'ausbruch', ch.ausbruch);
    }
  }
});
console.log(JSON.stringify(c), 'Kanal-gueltig-Quote an Zufallsstellen', (c.anyGueltig / c.n * 100).toFixed(1) + '%');
