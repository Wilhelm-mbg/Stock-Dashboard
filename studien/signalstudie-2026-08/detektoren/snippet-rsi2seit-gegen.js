var Q = require('../../../quant.js');
var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0, MINQ: 0, CHAN: false, MTF: false, TREND: false };
function signal(bars, i, params) {
  if (i < 260 || i >= bars.length) return null;            // volles Fenster (261 Kerzen, Kanal 201) wie live mit genug Historie
  var s = Q.einstiegSignal(bars, i, Object.assign({}, P, params || {}));
  return s && s.dir ? { dir: s.dir === 'call' ? 1 : -1 } : null;
}
// Test
var fs = require('fs'), STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
['AAPL', 'MSFT'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_60m_' + sym + '.json', 'utf8')).series.filter(function (b) { return b[0] % 60000 === 0; });
  var L = 0, S = 0, first = null;
  for (var i = 0; i < bars.length; i++) { var s = signal(bars, i); if (s) { if (s.dir > 0) L++; else S++; if (!first) first = [i, new Date(bars[i][0]).toISOString(), s.dir]; } }
  console.log(sym, 'long=' + L, 'short=' + S, 'erstes=' + JSON.stringify(first), 'i=259:', signal(bars, 259), 'i=n:', signal(bars, bars.length));
});
