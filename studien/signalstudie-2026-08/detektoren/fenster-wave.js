// Live-Fenster (Yahoo range=5d bzw. 1mo) vs. Messfenster (einstiegSignal: 381 Bars bei CHAN)
var fs = require('fs'); var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
[['5m', 390], ['15m', 130], ['60m', 154]].forEach(function (cfg) {
  var IV = cfg[0], LIVE_N = cfg[1];
  var c = { n: 0, sigMess: 0, sigLive: 0, beide: 0, scoreDiffSum: 0 };
  ['AAPL', 'MSFT', 'NVDA'].forEach(function (sym) {
    var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
    for (var i = 400; i < bars.length; i++) {
      var wM = Q.waveQuality(bars.slice(i - 380, i + 1), 'ema', 20, 2.0);
      var wL = Q.waveQuality(bars.slice(i - LIVE_N + 1, i + 1), 'ema', 20, 2.0);
      c.n++;
      var sM = !!(wM.signal && wM.score >= 60), sL = !!(wL.signal && wL.score >= 60);
      if (sM) c.sigMess++; if (sL) c.sigLive++; if (sM && sL) c.beide++;
      if (wM.signal) c.scoreDiffSum += Math.abs(wM.score - wL.score);
    }
  });
  console.log(IV, 'Live-Fenster', LIVE_N, 'Bars:', JSON.stringify(c), 'mittl. |Score-Differenz| an Roh-Signalen', (c.scoreDiffSum / Math.max(1, c.sigMess)).toFixed(1));
});
