/* Misst: Technik-Score auf Intraday-Fenster (Messgeschirr-Konvention, 300 Kerzen) vs. Technik-Score
 * auf der Tagesserie (Vortagsschluss, walk-forward) fuer dieselben Zeitpunkte. Korrelation + Terzil-Uebereinstimmung. */
'use strict';
var fs = require('fs');
var Q = require('../../../quant.js');
var det = require('./technical-score.js');
var STORE = process.env.APPDATA + '/markt-dashboard/store/';
var iv = process.argv[2] || '60m';
var SYMS = ['AAPL', 'MSFT', 'NVDA'];
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(7);
var xs = [], ys = [];
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + sym + '.json', 'utf8')).series.filter(function (b) { return b[1] > 0; });
  // Tagesserie aus Tagesschluessen (letzte Kerze je Tag)
  var days = [], dayOfBar = [];
  for (var i = 0; i < bars.length; i++) {
    var d = tagVon(bars[i][0]);
    if (!days.length || days[days.length - 1].k !== d) days.push({ k: d, t: bars[i][0], c: bars[i][1] });
    else { days[days.length - 1].c = bars[i][1]; }
    dayOfBar.push(days.length - 1);
  }
  var daily = days.map(function (x) { return [x.t, x.c]; });
  for (var k = 0; k < 400; k++) {
    var i = 300 + Math.floor(rnd() * (bars.length - 300));
    var di = dayOfBar[i] - 1;             // Vortag (abgeschlossen)
    if (di < 55) continue;
    var sIntra = det.score(bars, i, {});
    var sTag = Q.technical(daily, di).score;
    if (sIntra === null) continue;
    xs.push(sIntra); ys.push(sTag);
  }
});
function mean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
var mx = mean(xs), my = mean(ys), sxy = 0, sxx = 0, syy = 0;
for (var j = 0; j < xs.length; j++) { sxy += (xs[j] - mx) * (ys[j] - my); sxx += (xs[j] - mx) * (xs[j] - mx); syy += (ys[j] - my) * (ys[j] - my); }
var r = sxy / Math.sqrt(sxx * syy);
function terz(a) { var s = a.slice().sort(function (p, q) { return p - q; }); return [s[Math.floor(s.length / 3)], s[Math.floor(s.length * 2 / 3)]]; }
var tx = terz(xs), ty = terz(ys), gleich = 0;
function klasse(v, t) { return v > t[1] ? 2 : (v < t[0] ? 0 : 1); }
for (j = 0; j < xs.length; j++) if (klasse(xs[j], tx) === klasse(ys[j], ty)) gleich++;
console.log(JSON.stringify({ iv: iv, n: xs.length, korrelation: Math.round(r * 100) / 100, terzilGleich: Math.round(gleich / xs.length * 100) / 100, zufallErwartung: 0.33,
  sdIntra: Math.round(Math.sqrt(sxx / xs.length) * 100) / 100, sdTag: Math.round(Math.sqrt(syy / ys.length) * 100) / 100 }));
