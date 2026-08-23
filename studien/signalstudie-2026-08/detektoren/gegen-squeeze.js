'use strict';
/* Gegenpruefung squeeze: (1) ERSCHOEPFENDE Praefix-Probe ueber ALLE Indizes inkl. n-1,
   (2) explizit die letzten 30 Indizes, (3) Snippet auf 2 Symbolen, (4) Stempel-Kerzen am Ende. */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
function squeeze(bars, i, params) {
  var P = params || { period: 20, kSigma: 2 };
  var s = Q.squeezeSignal(bars.slice(Math.max(0, i - 260), i + 1), P.period || 20, P.kSigma || 2);
  return s.signal ? { dir: s.signal === 'call' ? 1 : -1 } : null;
}
var IV = process.argv[2] || '60m';
(process.argv[3] || 'AAPL,MSFT,NVDA').split(',').forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length, gepr = 0, abw = 0, long = 0, short = 0, endeAbw = 0, endeGepr = 0;
  // Zukunfts-Reihe: alles nach i verdreifacht - wird je i neu gebaut (teuer, daher nur letzte 400 + jeder 10.)
  for (var i = 0; i < n; i++) {
    var a = Q.squeezeSignal(bars.slice(0, i + 1), 20).signal;          // Praefix (volle Vergangenheit)
    var s = squeeze(bars, i);                                            // Snippet auf ganzer Reihe
    var sS = s ? (s.dir > 0 ? 'call' : 'put') : null;
    var liveS = Q.squeezeSignal(Q.fertigeBars(bars.slice(0, i + 1), IV === '60m' ? 60 : parseInt(IV, 10), bars[i][0] + (IV === '60m' ? 60 : parseInt(IV, 10)) * 60000), 20).signal; // Live-Pfad direkt nach Kerzenschluss
    gepr++;
    if (sS === 'call') long++; if (sS === 'put') short++;
    var d = null;
    if (i >= n - 400 || i % 10 === 0) {
      var mani = bars.slice(0, i + 1).concat(bars.slice(i + 1).map(function (p) { return [p[0], p[1] * 3, p[2], p[3] * 3, p[4] * 3]; }));
      d = squeeze(mani, i); d = d ? (d.dir > 0 ? 'call' : 'put') : null;
    } else d = sS;
    if (a !== sS || a !== d || a !== liveS) { abw++; if (abw <= 5) console.log('  ABW', sym, i, a, sS, d, liveS); }
    if (i >= n - 30) { endeGepr++; if (a !== sS || a !== d || a !== liveS) endeAbw++; }
  }
  // Stempel-Kerzen: Sekunden != 0 oder Minute nicht auf Raster
  var stempel = [];
  for (var k = 0; k < n; k++) { var dt = new Date(bars[k][0]); if (dt.getUTCSeconds() !== 0) stempel.push(k); }
  console.log(IV, sym, 'n=' + n, 'alle_indizes=' + gepr, 'abweichungen=' + abw, 'letzte30_gepr=' + endeGepr, 'letzte30_abw=' + endeAbw,
    'snippet long=' + long + ' short=' + short, 'stempel_idx=' + JSON.stringify(stempel.slice(-6)), 'stempel_gesamt=' + stempel.length);
  // Signale an den Stempel-Indizes vs. nach Filterung
  if (stempel.length) {
    var rein = bars.filter(function (b) { return new Date(b[0]).getUTCSeconds() === 0; });
    var sigStempel = stempel.map(function (k) { return Q.squeezeSignal(bars.slice(0, k + 1), 20).signal; });
    var sigRein = Q.squeezeSignal(rein, 20);
    console.log('   Signale AN Stempel-Indizes:', JSON.stringify(sigStempel), '| letzte Enge roh=' + Q.squeezeSignal(bars, 20).enge + ' gefiltert=' + sigRein.enge);
  }
});
