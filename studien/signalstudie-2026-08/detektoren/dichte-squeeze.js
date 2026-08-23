'use strict';
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m';
['AAPL', 'MSFT', 'NVDA'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length, sig = 0, eng = 0, tot = 0, runs = 0, runLen = 0, runSum = 0, prev = null, sessOut = 0;
  var cnt = 0, sigInRow = 0;
  for (var i = 120; i < n; i++) {
    var s = Q.squeezeSignal(bars.slice(Math.max(0, i - 260), i + 1), 20);
    tot++;
    if (s.enge != null && s.enge <= 0.55) eng++;
    if (s.signal) {
      sig++;
      if (prev === s.signal && i > 120) runLen++; else { if (runLen) { runs++; runSum += runLen; } runLen = 1; }
      var m = Q.minutenSeitOeffnung(bars[i][0]);
      if (m < 0 || m >= 390) sessOut++;
    } else { if (runLen) { runs++; runSum += runLen; } runLen = 0; }
    prev = s.signal;
  }
  console.log(IV, sym, 'bars=' + tot, 'kompression=' + (eng / tot * 100).toFixed(1) + '%', 'signale=' + sig + ' (' + (sig / tot * 100).toFixed(1) + '%)', 'laeufe=' + runs, 'mittlere_lauflaenge=' + (runs ? (runSum / runs).toFixed(2) : '-'), 'ausserhalb_sitzung=' + sessOut);
});
