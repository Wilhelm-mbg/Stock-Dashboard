/* Reproduziert die vorgeschlagene Reparatur den Live-Score? Tagesserie aus 60m-Sitzungskerzen vs. Yahoo-1d-Serie (hist_<SYM>.json),
 * Technik-Score an gemeinsamen Tagen (walk-forward, endI = Tagesindex). */
'use strict';
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = process.env.APPDATA + '/markt-dashboard/store/';
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function usDst(ms) { var d = new Date(ms), y = d.getUTCFullYear(); var so = function (m, n) { var d1 = new Date(Date.UTC(y, m, 1)); var off = (7 - d1.getUTCDay()) % 7; return Date.UTC(y, m, 1 + off + 7 * (n - 1)); }; return ms >= so(2, 2) + 7 * 3600000 && ms < so(10, 1) + 6 * 3600000; }
function istSitzung(ms) { var d = new Date(ms), tag = d.getUTCDay(); if (tag === 0 || tag === 6) return false; var m = d.getUTCHours() * 60 + d.getUTCMinutes() - ((usDst(ms) ? 13 : 14) * 60 + 30); return m >= 0 && m < 390; }
var res = {};
['AAPL', 'MSFT', 'NVDA'].forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_60m_' + sym + '.json', 'utf8')).series.filter(function (b) { return istSitzung(b[0]) && b[1] > 0; });
  var h = JSON.parse(fs.readFileSync(STORE + 'hist_' + sym + '.json', 'utf8')); var daily1d = h.series || h;
  var days = []; for (var i = 0; i < bars.length; i++) { var d = tagVon(bars[i][0]); if (!days.length || days[days.length - 1][2] !== d) days.push([bars[i][0], bars[i][1], d]); else days[days.length - 1][1] = bars[i][1]; }
  var idx1d = {}; daily1d.forEach(function (p, k) { idx1d[tagVon(p[0])] = k; });
  var n = 0, maxD = 0, sumD = 0, maxClose = 0, terzGleich = 0, scoresA = [], scoresB = [];
  for (var k = 60; k < days.length; k++) {
    var k1 = idx1d[days[k][2]]; if (k1 === undefined || k1 < 60) continue;
    var a = Q.technical(days.map(function (x) { return [x[0], x[1]]; }), k).score, b = Q.technical(daily1d, k1).score;
    n++; var dd = Math.abs(a - b); sumD += dd; maxD = Math.max(maxD, dd); maxClose = Math.max(maxClose, Math.abs(days[k][1] / daily1d[k1][1] - 1));
    scoresA.push(a); scoresB.push(b);
  }
  function terz(x) { var s = x.slice().sort(function (p, q) { return p - q; }); return [s[Math.floor(s.length / 3)], s[Math.floor(s.length * 2 / 3)]]; }
  var ta = terz(scoresA), tb = terz(scoresB), kl = function (v, t) { return v > t[1] ? 2 : (v < t[0] ? 0 : 1); };
  for (k = 0; k < scoresA.length; k++) if (kl(scoresA[k], ta) === kl(scoresB[k], tb)) terzGleich++;
  res[sym] = { gemeinsameTage: n, mittlAbwScore: Math.round(sumD / n * 1000) / 1000, maxAbwScore: Math.round(maxD * 1000) / 1000, maxAbwSchlussPct: Math.round(maxClose * 10000) / 100, terzilGleich: Math.round(terzGleich / n * 100) / 100 };
});
console.log(JSON.stringify(res));
