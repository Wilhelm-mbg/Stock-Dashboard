'use strict';
/* Wie viel filtert die Kompressionsbedingung wirklich? Vergleich: Signal mit Filter
   (Original) vs. reiner 2-Sigma-Bandausbruch ohne Enge-Bedingung (gleiche Band-Rechnung). */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m';
function sma(v, n, i) { var s = 0; for (var k = i - n + 1; k <= i; k++) s += v[k]; return s / n; }
function sd(v) { var m = v.reduce(function (a, b) { return a + b; }, 0) / v.length; var s = 0; v.forEach(function (x) { s += (x - m) * (x - m); }); return Math.sqrt(s / (v.length - 1)); }
['AAPL', 'MSFT', 'NVDA'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var closes = bars.map(function (p) { return p[1]; });
  var n = bars.length, mit = 0, ohne = 0, beide = 0, erste = 0, sig60 = 0;
  for (var i = 120; i < n; i++) {
    var s = Q.squeezeSignal(bars.slice(Math.max(0, i - 260), i + 1), 20);
    var e = i - 1, m = sma(closes, 20, e), st = sd(closes.slice(e - 19, e + 1));
    var roh = closes[i] > m + 2 * st ? 'call' : closes[i] < m - 2 * st ? 'put' : null;
    if (s.signal) { mit++; var mi = Q.minutenSeitOeffnung(bars[i][0]); if (mi < 60) erste++; }
    if (roh) ohne++;
    if (s.signal && roh) beide++;
  }
  console.log(IV, sym, 'mit_Enge=' + mit, 'ohne_Enge=' + ohne, 'Anteil_der_Rohausbrueche_die_durchkommen=' + (beide / ohne * 100).toFixed(1) + '%', 'Signale_in_erster_Stunde=' + (erste / mit * 100).toFixed(1) + '%');
});
