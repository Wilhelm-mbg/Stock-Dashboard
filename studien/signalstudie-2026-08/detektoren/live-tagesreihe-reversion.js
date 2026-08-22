'use strict';
/* Live-Simulation 1m: Yahoo liefert im Scan range=1d (depot.js:1995, 2310) -> sigBars = nur der
   laufende Tag. Vergleich: Rohfunktion auf der Tagesreihe bis i (Live) vs. Snippet-Fenster ueber
   die mehrtaegige Archivreihe (Messung). */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '1m';
var SYMS = ['AAPL', 'NVDA', 'MSFT'];
function snip(bars, i) { var win = bars.slice(Math.max(0, i - 260), i + 1); var r = Q.reversionSignal(win, 'ema', 20, 2.0); return r.signal || null; }
function dayKey(t) { return new Date(t).toISOString().slice(0, 10); }
var T = { idx: 0, gleich: 0, nurMessung: 0, nurLive: 0, richtungAnders: 0, sigMess: 0, sigLive: 0, nurMessungOpen65: 0 };
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length, dayStart = 0;
  for (var i = 300; i < n; i++) {
    if (dayKey(bars[i][0]) !== dayKey(bars[i - 1][0])) dayStart = i;
    var tag = bars.slice(dayStart, i + 1);
    var live = tag.length > 30 ? (Q.reversionSignal(tag, 'ema', 20, 2.0).signal || null) : null;  // <=30 Bars: Fetch liefert null (depot.js:2335)
    var mess = snip(bars, i);
    T.idx++;
    if (mess) T.sigMess++;
    if (live) T.sigLive++;
    if (mess === live) T.gleich++;
    else if (mess && !live) { T.nurMessung++; if (Q.minutenSeitOeffnung(bars[i][0]) < 65) T.nurMessungOpen65++; }
    else if (!mess && live) T.nurLive++;
    else T.richtungAnders++;
  }
});
console.log(IV, JSON.stringify(T));
