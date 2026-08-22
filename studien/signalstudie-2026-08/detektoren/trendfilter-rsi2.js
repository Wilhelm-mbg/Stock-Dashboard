// Wirkung des optionalen Trendfilters (cfg.trendFilter, Default false) auf rsi2: depot.js:2800-2816 / quant.js:1744-1757 (up100 = spot > EMA100)
var fs = require('fs'); var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '5m';
['NVDA','MU','GOOGL'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var sig = 0, block = 0;
  for (var i = 300; i < bars.length; i += 3) {
    var win = bars.slice(i - 260, i + 1); var r = Q.rsiExtremSignal(win); if (!r.signal) continue; sig++;
    var tc = bars.slice(Math.max(0, i - 240), i + 1).map(function (b) { return b[1]; });
    var e = Q.emaSeries(tc, 100); var up = bars[i][1] > e[e.length - 1];
    if ((r.signal === 'call' && !up) || (r.signal === 'put' && up)) block++;
  }
  console.log(sym, IV, 'Signale=' + sig, 'vom Trendfilter geblockt=' + block, '(' + (block / sig * 100).toFixed(0) + '%)');
});
