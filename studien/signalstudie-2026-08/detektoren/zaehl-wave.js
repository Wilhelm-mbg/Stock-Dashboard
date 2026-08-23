var fs = require('fs'); var W = require('./wave.js'); var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
['5m','15m'].forEach(function (IV) {
  ['AAPL','MSFT','NVDA'].forEach(function (sym) {
    var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
    var c = { roh: 0, q60: 0, chan: 0, trend: 0, live: 0, call: 0, put: 0 };
    for (var i = 400; i < bars.length; i++) {
      var win = bars.slice(Math.max(0, i - 380), i + 1);
      var wq = Q.waveQuality(win, 'ema', 20, 2.0);
      if (wq.signal) c.roh++;
      if (wq.signal && wq.score >= 60) c.q60++;
      if (W.waveSignal(bars, i, { CHAN: true, TREND: false })) c.chan++;
      if (W.waveSignal(bars, i, { CHAN: false, TREND: true })) c.trend++;
      var s = W.waveSignal(bars, i, {}); if (s) { c.live++; if (s.dir > 0) c.call++; else c.put++; }
    }
    console.log(IV, sym, 'Bars', bars.length - 400, JSON.stringify(c));
  });
});
