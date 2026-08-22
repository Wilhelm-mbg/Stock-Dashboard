'use strict';
/* Vollscan vwap-Abstand auf 60m und 5m (3 Symbole): Signale je Tageszeit-Lage.
   'letzte' = letzte Kerze des Tages (60m: 19:30-Halbkerze; live nie fertig vor Boersenschluss).
   'spaet'  = Kerze endet ab Sitzungsminute 375 (nearClose-Sperre depot.js:2395/2768). */
var fs = require('fs'); var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '60m', BM = parseInt(IV);
var tag = function (t) { return new Date(t).toISOString().slice(0, 10); };
var st = { n: 0, sig: 0, letzte: 0, sigLetzte: 0, spaet: 0, sigSpaet: 0, abschluss2000: 0, sigAbschluss: 0 };
['AAPL', 'MSFT', 'NVDA'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series, n = bars.length;
  var closes = bars.map(function (b) { return b[1]; });
  for (var i = 100; i < n; i++) {
    var s = Q.reversionSignal(bars.slice(0, i + 1), 'vwap', 20, 2.0).signal;
    st.n++; if (s) st.sig++;
    var letzte = i === n - 1 || tag(bars[i + 1][0]) !== tag(bars[i][0]);
    var ende = Q.minutenSeitOeffnung(bars[i][0]) + BM;            // Kerzenende in Sitzungsminuten
    if (letzte) { st.letzte++; if (s) st.sigLetzte++; }
    if (ende >= 375) { st.spaet++; if (s) st.sigSpaet++; }
    if (new Date(bars[i][0]).toISOString().slice(11, 19) === '20:00:00') { st.abschluss2000++; if (s) st.sigAbschluss++; }
  }
});
console.log(IV, JSON.stringify(st), '| Anteil Signale auf letzter Kerze', (100 * st.sigLetzte / st.sig).toFixed(1) + ' %', '| Kerzenende >= Min 375:', (100 * st.sigSpaet / st.sig).toFixed(1) + ' %');
