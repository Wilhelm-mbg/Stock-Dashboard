/* Gegenpruefung ORB: (1) Praefix-Probe mit Schwerpunkt REIHENENDE (letzte 80 Indizes je Symbol voll,
 * plus 300 Zufallsindizes, mulberry32 ausserhalb der Schleife), echte Praefixe bars.slice(0,i+1);
 * (2) Snippet des Pruefers wortgetreu ausfuehren und Signalzahl gegen den Live-Block-Nachbau halten;
 * (3) Reihenfolge-Unabhaengigkeit: Signale rueckwaerts abgefragt muessen gleich sein (kein Zustand). */
'use strict';
var fs = require('fs');
var ST = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '5m';
var SYMS = (process.argv[3] || 'AAPL,NVDA').split(',');
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(4711);

// ---- Snippet des Pruefers (wortgetreu) ----
var O = require('C:/Users/Wilhe/AppData/Local/Temp/claude/C--Users-Wilhe-AppData-Local-Programs-markt-dashboard/5d59645f-0547-4aec-912b-09c638f04c24/scratchpad/detektoren/orb.js');
function orbSig(bars, i, params) {
  var r = O.orbSignal(bars, i, Object.assign({ orbMin: 30, confirmBps: 15, minRangeBars: 3, nurErster: true }, params || {}));
  return r ? { dir: r.dir } : null;
}
// ---- Ende Snippet ----

var tot = { gepr: 0, abw: 0, sig: 0, tailGepr: 0, tailAbw: 0, tailSig: 0 };
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(ST + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length;
  // (2) Snippet vorwaerts
  var vor = new Array(n), cnt = { '1': 0, '-1': 0 }, erst = null, tage = {};
  for (var i = 0; i < n; i++) { var s = orbSig(bars, i); vor[i] = s ? s.dir : null; if (s) { cnt[s.dir]++; if (!erst) erst = new Date(bars[i][0]).toISOString() + ' dir=' + s.dir; var tg = new Date(bars[i][0]).toISOString().slice(0, 10); tage[tg] = (tage[tg] || 0) + 1; } }
  var maxProTag = Math.max.apply(null, Object.keys(tage).map(function (k) { return tage[k]; }));
  // (3) rueckwaerts
  var rueckAbw = 0;
  for (var i = n - 1; i >= 0; i--) { var s2 = orbSig(bars, i); if ((s2 ? s2.dir : null) !== vor[i]) rueckAbw++; }
  // (1) Praefix: Reihenende
  var tA = 0, tS = 0;
  for (var i = Math.max(0, n - 80); i < n; i++) { var p = orbSig(bars.slice(0, i + 1), i); var pd = p ? p.dir : null; if (pd !== vor[i]) tA++; if (pd) tS++; tot.tailGepr++; }
  // (1) Praefix: Zufall
  var zA = 0, zS = 0;
  for (var k = 0; k < 300; k++) { var i = Math.floor(rnd() * n); var p2 = orbSig(bars.slice(0, i + 1), i); var pd2 = p2 ? p2.dir : null; if (pd2 !== vor[i]) zA++; if (pd2) zS++; tot.gepr++; }
  // (1b) Praefix: ALLE Signal-Indizes (dort zeigt sich Zukunftsblick am ehesten) + je ein Nachbar
  var sA = 0, sN = 0;
  for (var i = 0; i < n; i++) { if (!vor[i] && !(i > 0 && vor[i - 1])) continue; var p3 = orbSig(bars.slice(0, i + 1), i); if ((p3 ? p3.dir : null) !== vor[i]) sA++; sN++; }
  tot.abw += zA; tot.sig += zS; tot.tailAbw += tA; tot.tailSig += tS;
  console.log(sym, IV, 'Bars', n, '| Snippet: Signale long', cnt['1'], 'short', cnt['-1'], 'erstes', erst, 'max/Tag', maxProTag, 'Tage mit Signal', Object.keys(tage).length,
    '| rueckwaerts Abw.', rueckAbw, '| Praefix Ende(80):', tA, 'Abw.,', tS, 'Signale | Praefix Zufall(300):', zA, 'Abw.,', zS, 'Signale | Praefix an allen Signalstellen+Nachbar:', sN, 'geprueft', sA, 'Abw.');
});
console.log('SUMME Zufall', tot.gepr, 'geprueft', tot.abw, 'Abw.', tot.sig, 'Signale; Reihenende', tot.tailGepr, 'geprueft', tot.tailAbw, 'Abw.', tot.tailSig, 'Signale');
