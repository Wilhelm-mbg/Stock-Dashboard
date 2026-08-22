// MTF-Ausrichtung: einstiegSignal buendelt win (381 Bars, letzter 5m-Block = 1 Bar) vs Live ganze Serie (390 Bars)
var fs = require('fs'); var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var c = { sig: 0, mtfStudie: 0, mtfLive: 0, ungleich: 0 };
['AAPL','MSFT','NVDA'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_1m_' + sym + '.json', 'utf8')).series;
  for (var i = 400; i < bars.length; i++) {
    var v = Q.einstiegSignal(bars, i, { ENTRY: 'wave', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2, MINQ: 60, CHAN: false, MTF: false, TREND: true });
    if (!v) continue;
    c.sig++;
    var a = Q.mtfAgrees(bars.slice(i - 380, i + 1), v.dir, 5);   // wie einstiegSignal (CHAN=true -> 381 Bars)
    var b = Q.mtfAgrees(bars.slice(i - 389, i + 1), v.dir, 5);   // wie Live (sigBars = ganze 1d-Serie ~390)
    if (a) c.mtfStudie++; if (b) c.mtfLive++; if (a !== b) c.ungleich++;
  }
});
console.log('1m wave (CHAN aus, TREND an) Signale', JSON.stringify(c));
