'use strict';
/* Gegenpruefung vwap-Abstand (Skeptiker).
   A) Zukunftsblick per STOERUNG: alle Bars NACH i werden verfaelscht (Kurs x zufall, Volumen zufall).
      Linie an i und Signal an i muessen unveraendert bleiben. Aufrufreihenfolge gemischt (Cache-Falle).
      Indizes: N zufaellig (mulberry32) + die letzten 60 der Reihe.
   B) Live-Pfad-Gleichheit: Snippet auf dem Archiv vs. Q.reversionSignal(Q.fertigeBars(Yahoo-Fenster))
      so wie depot.js:2520/2657 es rechnet (Fenster = range '5d' bzw. '1mo', now = Bar-Ende).
   C) Stempel-Kerzen: Signale auf off-grid/vol0-Bars; Snippet auf Rohdaten vs. Archiv.ohneStempel.
   D) Signalrate je Variante und Tageszeit (erste/letzte Kerze des Tages). */
var fs = require('fs');
var Q = require('../../../quant.js');
var A = require('../../../archiv.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '5m', N = +(process.argv[3] || 300);
var BARMIN = { '1m': 1, '5m': 5, '15m': 15, '60m': 60 }[IV];
var RANGE_TAGE = { '1m': 1, '5m': 5, '15m': 5, '60m': 22 }[IV];   // INTERVAL_CFG.range depot.js:1995
var SYMS = ['AAPL', 'MSFT', 'NVDA'];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(424242);

// SNIPPET des Pruefers (unveraendert)
function vwapAbstand(bars, i, params) {
  var p = Object.assign({ period: 20, zThr: 2.0 }, params || {});
  var b = bars.slice(0, i + 1);
  if (b.length < 65 || b[0].length < 3) return null;
  var s = Q.reversionSignal(b, 'vwap', p.period, p.zThr);
  return s.signal === 'call' ? { dir: +1 } : s.signal === 'put' ? { dir: -1 } : null;
}
function d(sig) { return sig ? sig.dir : 0; }
function tag(t) { return new Date(t).toISOString().slice(0, 10); }
function onGrid(b) { var dt = new Date(b[0]); var m = dt.getUTCMinutes(); return dt.getUTCSeconds() === 0 && (BARMIN === 60 ? (m === 0 || m === 30) : m % BARMIN === 0); }

var tot = 0, abwLinie = 0, abwSig = 0, totB = 0, abwB = 0, sigB = 0, stempelSig = 0, stempelN = 0, totC = 0, abwC = 0;
var rate = { sig: 0, n: 0, ersteKerze: 0, letzteKerze: 0, sigErste: 0, sigLetzte: 0 };
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length, lineVoll = Q.vwapLine(bars);
  var idx = [];
  for (var k = 0; k < N; k++) idx.push(100 + Math.floor(rnd() * (n - 100)));
  for (var e = n - 60; e < n; e++) idx.push(e);           // nahe am Ende
  idx.forEach(function (i) {
    tot++;
    // A) Stoerung der Zukunft
    var stoer = bars.map(function (b, j) { return j <= i ? b : [b[0], b[1] * (0.9 + 0.2 * rnd()), Math.floor(rnd() * 1e7), b[3], b[4]]; });
    var erst = (rnd() < 0.5);
    var sA = erst ? vwapAbstand(bars, i) : vwapAbstand(stoer, i);
    var sB = erst ? vwapAbstand(stoer, i) : vwapAbstand(bars, i);
    if (Math.abs(Q.vwapLine(stoer)[i] - lineVoll[i]) > 1e-9) abwLinie++;
    if (d(sA) !== d(sB)) abwSig++;
    // B) Live-Pfad: Yahoo-Fenster (letzte RANGE_TAGE Handelstage bis Tag i), fertigeBars, reversionSignal
    var tage = {}; for (var j = 0; j <= i; j++) tage[tag(bars[j][0])] = 1;
    var tl = Object.keys(tage).sort(); var von = tl[Math.max(0, tl.length - RANGE_TAGE)];
    var fenster = bars.slice(0, i + 1).filter(function (b) { return tag(b[0]) >= von; });
    // "jetzt" = Ende der Kerze i; die Kerze i ist damit gerade fertig, spaetere gibt es nicht
    var sigBars = Q.fertigeBars(fenster, BARMIN, bars[i][0] + BARMIN * 60000);
    var live = Q.reversionSignal(sigBars, 'vwap', 20, 2.0);
    var ld = live.signal === 'call' ? 1 : live.signal === 'put' ? -1 : 0;
    totB++; if (ld !== d(sA)) abwB++; if (ld) sigB++;
    // D) Raten
    rate.n++; if (d(sA)) rate.sig++;
    var erste = i === 0 || tag(bars[i - 1][0]) !== tag(bars[i][0]);
    var letzte = i === n - 1 || tag(bars[i + 1][0]) !== tag(bars[i][0]);
    if (erste) { rate.ersteKerze++; if (d(sA)) rate.sigErste++; }
    if (letzte) { rate.letzteKerze++; if (d(sA)) rate.sigLetzte++; }
  });
  // C) Stempel: alle Bars der Tage 18.-21.08.
  var sauber = A.ohneStempel(bars, BARMIN);
  var byT = {}; sauber.forEach(function (b, j) { byT[b[0]] = j; });
  for (var i2 = 0; i2 < n; i2++) {
    var tg = tag(bars[i2][0]); if (tg < '2026-08-18') continue;
    if (!onGrid(bars[i2])) { stempelN++; if (d(vwapAbstand(bars, i2))) stempelSig++; continue; }
    if (byT[bars[i2][0]] === undefined) continue;
    totC++; if (d(vwapAbstand(bars, i2)) !== d(vwapAbstand(sauber, byT[bars[i2][0]]))) abwC++;
  }
  console.log(sym, IV, 'n=' + n, 'sauber=' + sauber.length);
});
console.log('A) Stoerung der Zukunft:', tot, 'Proben | Linie abweichend', abwLinie, '| Signal abweichend', abwSig);
console.log('B) Live-Pfad (Yahoo-Fenster ' + RANGE_TAGE + ' Tage + fertigeBars) vs Snippet:', totB, 'Proben | abweichend', abwB, '| Live-Signale', sigB);
console.log('C) Stempel-Kerzen ab 18.08.: off-grid Bars', stempelN, '| davon mit Signal', stempelSig, '| on-grid Bars roh vs ohneStempel:', totC, 'abweichend', abwC);
console.log('D) Signalrate abstand:', rate.sig + '/' + rate.n, '(' + (100 * rate.sig / rate.n).toFixed(1) + ' %) | erste Kerze des Tages', rate.sigErste + '/' + rate.ersteKerze, '| letzte Kerze', rate.sigLetzte + '/' + rate.letzteKerze);
