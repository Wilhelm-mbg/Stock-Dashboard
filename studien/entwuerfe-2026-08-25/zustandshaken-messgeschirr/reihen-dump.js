'use strict';
/* Legt die TAGESREIHEN des Ueberschusses ab - einmal fuer das Live-Universum,
 * einmal fuer das ganze Archiv. Danach ist jede weitere Auswertung in Sekunden. */
var fs = require('fs');
var path = require('path');
var Q = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/quant.js');
var MM = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/messmaschine/messmaschine.js');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv60m';
var SIM = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
var LIVE = SIM.universum;
var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };
var H = 8, VORLAUF = 261, LESE = 261;

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function sitzungsPosition(bars) {
  var p = new Int16Array(bars.length), letzter = null, k = 0;
  for (var i = 0; i < bars.length; i++) {
    var d = new Date(bars[i][0]);
    var tag = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    if (tag !== letzter) { letzter = tag; k = 0; } else { k++; }
    p[i] = k;
  }
  return p;
}
function reiheKaputt(bars) {
  for (var i = 1; i < bars.length; i++) {
    var a = bars[i - 1][1], b = bars[i][1];
    if (!(a > 0) || !(b > 0)) return true;
    if (b / a > 4 || b / a < 0.25) return true;
  }
  return false;
}

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_60m_') === 0; });
var U = {};
dateien.forEach(function (f) {
  var sym = f.slice('bars_60m_'.length, -5);
  if (sym.indexOf('-USD') !== -1) return;
  try {
    var j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8'));
    if (j && Array.isArray(j.series) && j.series.length > VORLAUF + H + 30 && !reiheKaputt(j.series)) U[sym] = j.series;
  } catch (e) { }
});
var syms = Object.keys(U);
var alleTage = {};
syms.forEach(function (s) { U[s].forEach(function (b) { alleTage[tagVon(b[0])] = 1; }); });
var tage = Object.keys(alleTage).sort();
var schnittTag = tage[Math.floor(tage.length * 0.5)];
console.log(syms.length + ' Reihen, ' + tage.length + ' Tage, Schnitt ' + schnittTag);

var K = MM._intern.baueKontrolle(U, H, schnittTag, VORLAUF, null, P);
var istLive = {}; LIVE.forEach(function (s) { istLive[s] = 1; });

var tagAlle = {}, tagLive = {};
syms.forEach(function (sym) {
  var b = U[sym], POS = sitzungsPosition(b), live = !!istLive[sym];
  for (var i = VORLAUF; i < b.length - H; i++) {
    var s = null;
    try { s = Q.einstiegSignal(b, i, P); } catch (e) { }
    if (!s || s.dir !== 'call') continue;
    var s0 = b[i][1], sH = b[i + H][1];
    if (!(s0 > 0) || !(sH > 0)) continue;
    var tag = tagVon(b[i][0]), hf = tag < schnittTag ? 'entdeckung' : 'bestaetigung';
    var e1 = K.erwartung(sym, POS[i], hf, i - LESE - H, i + H - 1);
    if (e1 == null) continue;
    var u = (sH / s0 - 1) - e1;
    (tagAlle[tag] = tagAlle[tag] || []).push(u);
    if (live) (tagLive[tag] = tagLive[tag] || []).push(u);
  }
});
function verdichte(m) {
  var t = Object.keys(m).sort();
  return { tage: t, mittel: t.map(function (k) { return m[k].reduce(function (a, b) { return a + b; }, 0) / m[k].length; }),
           n: t.map(function (k) { return m[k].length; }) };
}
fs.writeFileSync(process.argv[3] || 'reihen.json', JSON.stringify({
  schnittTag: schnittTag, handelstage: tage,
  alle: verdichte(tagAlle), live: verdichte(tagLive),
  universumAlle: syms.length, universumLive: LIVE.length
}));
console.log('geschrieben. Tage mit Signal: alle ' + Object.keys(tagAlle).length + ', live ' + Object.keys(tagLive).length);
