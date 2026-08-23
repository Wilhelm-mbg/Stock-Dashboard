// Wie oft feuert signalCross auf AUFEINANDERFOLGENDEN Kerzen fuer dieselbe Kreuzung?
var fs = require('fs'); var Q = require('../../../quant.js'); var D = require('./signalCross.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m';
['AAPL','NVDA','MSFT'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = 0, sig = 0, erste = 0, runs = {}, prev = 0, run = 0, ausserhalb = 0, wochenende = 0;
  for (var i = 30; i < bars.length; i++) {
    var s = D.signalCross(bars, i); var d = s ? s.dir : 0; n++;
    var m = Q.minutenSeitOeffnung(bars[i][0]); var wd = new Date(bars[i][0]).getUTCDay();
    if (m < 0 || m >= 390) ausserhalb++; if (wd === 0 || wd === 6) wochenende++;
    if (d) { sig++; if (d === prev) run++; else { if (run) runs[run] = (runs[run] || 0) + 1; run = 1; erste++; } }
    else { if (run) runs[run] = (runs[run] || 0) + 1; run = 0; }
    prev = d;
  }
  console.log(sym, IV, JSON.stringify({ kerzen: n, signalKerzen: sig, quote: (sig / n * 100).toFixed(1) + ' %', eigenstaendigeKreuzungen: erste, kerzenJeKreuzung: (sig / erste).toFixed(2), laufLaengen: runs, barsAusserhalbSitzung: ausserhalb, barsAmWochenende: wochenende }));
});
