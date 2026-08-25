'use strict';
/* Dieselbe Rechnung wie aufloesung.js, aber auf dem GANZEN 60m-Archiv statt auf
 * dem Live-Universum. Beantwortet: waere die Frage "was kostet der Waechter"
 * ueberhaupt entscheidbar, wenn der Haken ein breites Universum gaten wuerde?
 * Zusaetzlich: was macht das VERBREITERTE A7-Lesefenster (1097 statt 261 Kerzen)
 * mit Schaetzer und Fallzahl? */
var fs = require('fs');
var path = require('path');
var Q = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/quant.js');
var MM = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/messmaschine/messmaschine.js');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv60m';
var SIM = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
var pauseTag = {};
SIM.protokoll.forEach(function (p) { if (p.pauseAktiv) pauseTag[p.tag] = 1; });

var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };
var H = 8, VORLAUF = 261, LESE_ENG = 261, LESE_BREIT = 1097;

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

var t0 = Date.now();
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
console.log('geladen: ' + syms.length + ' Reihen in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');

var alleTage = {};
syms.forEach(function (s) { U[s].forEach(function (b) { alleTage[tagVon(b[0])] = 1; }); });
var tage = Object.keys(alleTage).sort();
var schnittTag = tage[Math.floor(tage.length * 0.5)];
console.log('Handelstage ' + tage.length + ', Schnitt ' + schnittTag);

var t1 = Date.now();
var K = MM._intern.baueKontrolle(U, H, schnittTag, VORLAUF, null, P);
console.log('Kontrolle gebaut in ' + ((Date.now() - t1) / 1000).toFixed(1) + ' s');

var t2 = Date.now();
var eng = [], breit = [], ohneEng = 0, ohneBreit = 0, nSig = 0;
syms.forEach(function (sym) {
  var b = U[sym], POS = sitzungsPosition(b);
  for (var i = VORLAUF; i < b.length - H; i++) {
    var s = null;
    try { s = Q.einstiegSignal(b, i, P); } catch (e) { }
    if (!s || s.dir !== 'call') continue;
    var s0 = b[i][1], sH = b[i + H][1];
    if (!(s0 > 0) || !(sH > 0)) continue;
    nSig++;
    var tag = tagVon(b[i][0]), hf = tag < schnittTag ? 'entdeckung' : 'bestaetigung';
    var r = sH / s0 - 1;
    var e1 = K.erwartung(sym, POS[i], hf, i - LESE_ENG - H, i + H - 1);
    var e2 = K.erwartung(sym, POS[i], hf, i - LESE_BREIT - H, i + H - 1);
    if (e1 == null) ohneEng++; else eng.push({ tag: tag, hf: hf, wert: r - e1 });
    if (e2 == null) ohneBreit++; else breit.push({ tag: tag, hf: hf, wert: r - e2 });
  }
});
console.log('Signale ' + nSig + ' in ' + ((Date.now() - t2) / 1000).toFixed(1) + ' s | ohne Kontrolle eng ' +
  ohneEng + ' (' + (ohneEng / nSig * 100).toFixed(2) + ' %), breit ' + ohneBreit + ' (' + (ohneBreit / nSig * 100).toFixed(2) + ' %)');

function tagesMittel(e) {
  var m = {};
  e.forEach(function (x) { (m[x.tag] = m[x.tag] || []).push(x.wert); });
  var t = Object.keys(m).sort();
  return { tage: t, mittel: t.map(function (k) { return m[k].reduce(function (a, b) { return a + b; }, 0) / m[k].length; }) };
}
var schwelle = MM._intern.bonferroniSchwelle(1);
function zeile(name, werte, extra) {
  var st = MM._intern.statistik(werte, H - 1);
  var d80 = st.se > 0 ? (schwelle + MM.VERFAHREN.zPower80) * st.se : null;
  console.log('  ' + name + ': Tage ' + st.n + ' | Mittel ' + (st.mittel * 100).toFixed(4) +
    ' Pp | se ' + (st.se * 100).toFixed(4) + ' | MDE ' + (st.mde * 100).toFixed(4) +
    ' | delta80 ' + (d80 * 100).toFixed(4) + ' | t ' + (st.t != null ? st.t.toFixed(2) : '-') +
    ' | sd ' + (st.sd * 100).toFixed(4) + (extra || ''));
  return st;
}

[['A7 eng (261)', eng], ['A7 breit (1097)', breit]].forEach(function (paar) {
  var name = paar[0], E = paar[1];
  var B = E.filter(function (x) { return x.hf === 'bestaetigung'; });
  console.log('\n===== ' + name + ' | Bestaetigung: ' + B.length + ' Signale =====');
  var tmB = tagesMittel(B);
  zeile('UNGATED', tmB.mittel);
  var Bg = B.filter(function (x) { return !pauseTag[x.tag]; });
  var tmG = tagesMittel(Bg);
  zeile('GATED  ', tmG.mittel);
  var diff = tmB.tage.map(function (t, idx) { return pauseTag[t] ? -tmB.mittel[idx] : 0; });
  var nnz = diff.filter(function (x) { return x !== 0; }).length;
  zeile('DIFFERENZ', diff, '  (' + nnz + ' Tage von null verschieden)');
  var aufP = B.filter(function (x) { return pauseTag[x.tag]; });
  if (aufP.length) zeile('NUR Pausentage', tagesMittel(aufP).mittel, '  (' + aufP.length + ' Signale)');
});
