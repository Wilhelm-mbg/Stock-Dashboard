var fs = require('fs'); var v2 = require('./snippet-signalCross-v2.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/'; var P = { lineType: 'ema', period: 20, confirmBps: 15, lookback: 3 };
['60m','15m','5m'].forEach(function (IV) { ['AAPL','NVDA','MSFT'].forEach(function (sym) {
  var roh = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var sauber = roh.filter(function (b) { return b[0] % 60000 === 0; });
  var sigRoh = {}, sigSauber = {};
  for (var i = 30; i < roh.length; i++) { var s = v2(roh, i, P); if (s) sigRoh[roh[i][0]] = s.dir; }
  for (var i = 30; i < sauber.length; i++) { var s = v2(sauber, i, P); if (s) sigSauber[sauber[i][0]] = s.dir; }
  var nurRoh = Object.keys(sigRoh).filter(function (t) { return sigSauber[t] !== sigRoh[t]; }), nurSauber = Object.keys(sigSauber).filter(function (t) { return sigRoh[t] !== sigSauber[t]; });
  console.log(IV, sym, JSON.stringify({ stempel: roh.length - sauber.length, signaleRoh: Object.keys(sigRoh).length, signaleSauber: Object.keys(sigSauber).length, nurMitStempel: nurRoh.length, nurOhneStempel: nurSauber.length, beispiele: nurRoh.slice(0, 3).map(function (t) { return new Date(+t).toISOString(); }) }));
}); });
