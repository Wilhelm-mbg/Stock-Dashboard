/* Gegenpruefung Technik-Score (Skeptiker).
 * (1) Exakter Messgeschirr-Aufruf (Fenster min(i+1,300), Sitzungskerzen wie messgeschirr.js:75) als Praefix vs. ganze Reihe,
 *     zufaellige Indizes PLUS die letzten 30 Indizes (Ende der Reihe).
 * (2) Snippet des Pruefers auf der Tagesserie (hist_<SYM>.json) als Praefix vs. ganze Reihe, inkl. Ende.
 * (3) Aufrufreihenfolge: Ergebnis bei Wiederholung / nach Aufruf auf anderem Symbol identisch? (versteckter Zustand)
 * (4) Vorgeschlagene Reparatur (Tagesserie aus 60m-Segmenten, Vortagsindex) als Praefix vs. ganz.
 * Aufruf: node gegen-technical-score.js [iv]   (Standard 5m) */
'use strict';
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = process.env.APPDATA + '/markt-dashboard/store/';
var iv = process.argv[2] || '5m';
var SYMS = ['AAPL', 'MSFT', 'NVDA'];
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(424242);
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function usDst(ms) { var d = new Date(ms), y = d.getUTCFullYear(); var so = function (m, n) { var d1 = new Date(Date.UTC(y, m, 1)); var off = (7 - d1.getUTCDay()) % 7; return Date.UTC(y, m, 1 + off + 7 * (n - 1)); }; return ms >= so(2, 2) + 7 * 3600000 && ms < so(10, 1) + 6 * 3600000; }
function istSitzung(ms) { var d = new Date(ms), tag = d.getUTCDay(); if (tag === 0 || tag === 6) return false; var m = d.getUTCHours() * 60 + d.getUTCMinutes() - ((usDst(ms) ? 13 : 14) * 60 + 30); return m >= 0 && m < 390; }

// exakt messgeschirr.js:173-175
function messScore(bars, i) { var fenster = Math.min(i + 1, 300); var pts = bars.slice(i + 1 - fenster, i + 1); return Q.technical(pts, pts.length - 1).score; }
// Snippet des Pruefers
function signal(bars, i, p) {
  if (i < 55) return null;
  var s = Q.technical(bars.slice(0, i + 1), i).score;
  var thr = p && p.schwelle != null ? p.schwelle : 0.35;
  if (Math.abs(s) < thr) return null;
  return { dir: s > 0 ? 1 : -1, score: s };
}
function gleich(a, b) { return (a === null && b === null) || (a && b && a.dir === b.dir && a.score === b.score); }

var out = { iv: iv, mess: { gepr: 0, abw: 0, endeGepr: 0, endeAbw: 0 }, tages: { gepr: 0, abw: 0, endeGepr: 0, endeAbw: 0, signale: {} }, zustand: { gepr: 0, abw: 0 }, reparatur: { gepr: 0, abw: 0, endeGepr: 0, endeAbw: 0, nTage: {} } };
var vorherige = null;
SYMS.forEach(function (sym) {
  var raw = JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + sym + '.json', 'utf8'));
  var bars = raw.series.filter(function (b) { return istSitzung(b[0]) && b[1] > 0; });
  var idx = [], i, e, k;
  for (var k = 0; k < 200; k++) idx.push(56 + Math.floor(rnd() * (bars.length - 56)));
  for (var e = bars.length - 30; e < bars.length; e++) idx.push(e);
  idx.forEach(function (i, n) {
    var sP = messScore(bars.slice(0, i + 1), i), sF = messScore(bars, i);
    out.mess.gepr++; if (sP !== sF) out.mess.abw++;
    if (n >= 200) { out.mess.endeGepr++; if (sP !== sF) out.mess.endeAbw++; }
    // Zustand: zweiter Aufruf identisch? (nach Aufrufen auf anderen Symbolen)
    var again = messScore(bars, i); out.zustand.gepr++; if (again !== sF) out.zustand.abw++;
  });
  // (2) Tagesserie hist_<SYM>.json
  var hist = null; try { hist = JSON.parse(fs.readFileSync(STORE + 'hist_' + sym + '.json', 'utf8')); } catch (err) { }
  var daily = hist ? (hist.series || hist) : null;
  if (daily && daily.length > 100) {
    var di = []; for (k = 0; k < 150; k++) di.push(56 + Math.floor(rnd() * (daily.length - 56)));
    for (e = daily.length - 30; e < daily.length; e++) di.push(e);
    var cnt = { long: 0, short: 0, null: 0 };
    di.forEach(function (i, n) {
      var a = signal(daily.slice(0, i + 1), i, {}), b = signal(daily, i, {});
      out.tages.gepr++; if (!gleich(a, b)) out.tages.abw++;
      if (n >= 150) { out.tages.endeGepr++; if (!gleich(a, b)) out.tages.endeAbw++; }
      cnt[b === null ? 'null' : (b.dir > 0 ? 'long' : 'short')]++;
    });
    out.tages.signale[sym] = { nTage: daily.length, letzter: tagVon(daily[daily.length - 1][0]), stichprobe: cnt, letzterScore: Math.round(Q.technical(daily).score * 1000) / 1000 };
  }
  // (4) Reparatur: Tagesserie aus Segmenten (Schluss = letzte Sitzungskerze), Bedingung = technical(dailySeg, Vortagsindex)
  var days = [], dayOfBar = [];
  for (i = 0; i < bars.length; i++) { var d = tagVon(bars[i][0]); if (!days.length || days[days.length - 1].k !== d) days.push({ k: d, t: bars[i][0], c: bars[i][1] }); else days[days.length - 1].c = bars[i][1]; dayOfBar.push(days.length - 1); }
  var dseg = days.map(function (x) { return [x.t, x.c]; });
  out.reparatur.nTage[sym] = dseg.length;
  function repScore(barsPrefix, i) {
    // Tagesserie NUR aus den Kerzen 0..i bilden, Vortag = letzter vollstaendiger Tag vor dem Tag von i
    var dd = [], last = null; for (var j = 0; j <= i; j++) { var kk = tagVon(barsPrefix[j][0]); if (kk !== last) { dd.push([barsPrefix[j][0], barsPrefix[j][1]]); last = kk; } else dd[dd.length - 1][1] = barsPrefix[j][1]; }
    var vi = dd.length - 2; if (vi < 55) return null; return Q.technical(dd, vi).score;
  }
  idx.forEach(function (i, n) {
    var a = repScore(bars.slice(0, i + 1), i), b = (dayOfBar[i] - 1 >= 55) ? Q.technical(dseg, dayOfBar[i] - 1).score : null;
    out.reparatur.gepr++; if (a !== b) out.reparatur.abw++;
    if (n >= 200) { out.reparatur.endeGepr++; if (a !== b) out.reparatur.endeAbw++; }
  });
});
console.log(JSON.stringify(out));
