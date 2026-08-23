/* Vollscan: jeder Index der Reihe, Signal auf ganzer Reihe vs. Praefix an ALLEN Signalstellen
 * (beide Richtungen: jedes Signal des Vollaufs muss im Praefix stehen und umgekehrt wird an
 * jeder Stelle verglichen). Dazu Signalzahl/Richtung und Kanal-Gueltigkeitsquote. */
var fs = require('fs');
var det = require('./kanaltrend.js');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m';
var SYMS = (process.argv[3] || 'AAPL,MSFT,NVDA').split(',');
var P = Object.assign({}, det.DEFAULT, process.argv[4] ? JSON.parse(process.argv[4]) : {});

SYMS.forEach(function (sym) {
  var b = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  b = b.slice(0, b.length - 1);
  var n = b.length, sig = 0, call = 0, put = 0, ab = 0, gueltig = 0, trendig = 0, gepr = 0;
  var t0 = Date.now();
  for (var i = 300; i < n; i++) {
    var v = det.signal(b, i, P);
    var p = det.signal(b.slice(0, i + 1), i, P);
    gepr++;
    if (JSON.stringify(v) !== JSON.stringify(p)) ab++;
    if (v) { sig++; if (v.dir > 0) call++; else put++; }
    if (i % 10 === 0) {
      var win = b.slice(Math.max(0, i - 260), i + 1);
      var ch = Q.trendChannel(Q.degapBarArray(win));
      if (ch && ch.gueltig) { gueltig++; if (ch.trend !== 'flat' && !ch.ausbruch) trendig++; }
    }
  }
  console.log(sym, IV, 'n=' + n, 'geprueft=' + gepr, 'Signale=' + sig, 'call=' + call, 'put=' + put,
    'Abweichungen=' + ab, 'Kanal gueltig (je 10. Bar): ' + gueltig + '/' + Math.floor((n - 300) / 10),
    'davon trendig ohne Ausbruch: ' + trendig, (Date.now() - t0) + ' ms');
});
