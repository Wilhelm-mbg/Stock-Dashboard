/* Gegenpruefung 'wendepunkt-trendwechsel' (Skeptiker).
 * 1) Praefix-Probe mit anderem Seed + ALLE Indizes nahe am Reihenende, 1m und 5m.
 * 2) Snippet des Pruefers woertlich ausfuehren, gegen Modul (ersteImAbschnitt) und Studien-detect.
 * 3) Archiv: Wochentag/Stunden, Hoch/Tief-Belegung nach Datum, Doppel-Wendepunkte.
 * 4) Live-Fenster-Simulation: Live 1m holt range=1d (depot.js:1995, btMode=false in wendePruefen
 *    depot.js:1099) - der Detektor sieht live nur den laufenden Tag. Vergleich Tages-Praefix
 *    gegen Archiv-Lauf (fortlaufende Reihe). */
'use strict';
var fs = require('fs');
var Q = require('../../../quant.js');
var D = require('./wendepunkt-trendwechsel.js');
var STORE = (process.env.APPDATA || require('os').homedir() + '/AppData/Roaming') + '/markt-dashboard/store/';
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(4711);
var s = function (x) { return x ? (x.dir > 0 ? '+1' : '-1') : 'null'; };
var P = { S: 1.0, F: 5 };
function lade(iv, sym) { return JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + sym + '.json', 'utf8')).series; }

/* ---------- Snippet des Pruefers, woertlich ---------- */
function snippet(bars, i, params) {
  var o = { schwelle: params.S, bestaetigung: params.F };
  var w = Q.trendwechsel(bars.slice(0, i + 1), o);
  if (!w || !w.signal) return null;
  for (var j = w.bild.wpLetzt + 15; j < i; j++) {
    var v = Q.trendwechsel(bars.slice(0, j + 1), o);
    if (v && v.signal && v.bild.wpLetzt === w.bild.wpLetzt) return null;
  }
  return { dir: w.signal.dir === 'call' ? 1 : -1 };
}
/* Studien-detect ohne Cooldown/MinRest (hauptstudie.js 63-93) */
function detectStudie(bars, S, F) {
  var wnk = function (k) { return k.steigung * k.n / k.breite; };
  var wp = Q.wendepunkte(bars, F);
  var all = wp.hoch.concat(wp.tief).map(function (w) { return w.i; }).sort(function (a, b) { return a - b; });
  var sigs = [], p = 0, C = [], sectionDone = true, winkelAlt = 0;
  for (var i = 0; i < bars.length; i++) {
    while (p < all.length && all[p] + F <= i) {
      C.push(all[p]); p++; sectionDone = false; winkelAlt = 0;
      if (C.length >= 2) { var kAlt = Q.kanalUeber(bars, C[C.length - 2], C[C.length - 1]); if (kAlt && kAlt.breite > 0) winkelAlt = wnk(kAlt); }
      if (Math.abs(winkelAlt) < 0.5) sectionDone = true;
    }
    if (sectionDone) continue;
    var w = C[C.length - 1];
    if (i - w < 10) continue;
    var kNeu = Q.kanalUeber(bars, w, i);
    if (!kNeu || !(kNeu.breite > 0)) continue;
    var wn = wnk(kNeu);
    if (Math.abs(wn) < S) continue;
    if (Math.sign(wn) === Math.sign(winkelAlt)) continue;
    sectionDone = true;
    sigs.push({ i: i, dir: wn > 0 ? 1 : -1 });
  }
  return sigs;
}

/* ---------- 1) Praefix-Probe ---------- */
console.log('== 1) Praefix-Probe (Seed 4711, plus alle Indizes der letzten 80 Kerzen) ==');
var gesamt = 0, abw = 0;
[['1m', ['AAPL', 'NVDA', 'MSFT'], 300], ['5m', ['AAPL', 'NVDA', 'MSFT'], 200]].forEach(function (cfg) {
  var iv = cfg[0];
  cfg[1].forEach(function (sym) {
    var bars = lade(iv, sym), n = bars.length;
    var pFast = { S: P.S, F: P.F, _wp: D.vorbereiten(bars, P) };
    var idx = [];
    for (var k = 0; k < cfg[2]; k++) idx.push(40 + Math.floor(rnd() * (n - 40)));
    for (var e = n - 80; e < n; e++) idx.push(e);            // nahe am Ende, lueckenlos
    var lokal = 0, sig = 0;
    idx.forEach(function (i) {
      var a = D.signalPraefix(bars, i, P), b = D.signal(bars, i, pFast);
      gesamt++; if (a) sig++;
      if (s(a) !== s(b)) { lokal++; abw++; if (lokal <= 3) console.log('  ABWEICHUNG', iv, sym, 'i=' + i, s(a), s(b)); }
    });
    console.log('  ' + iv + ' ' + sym + ': n=' + n + ', geprueft ' + idx.length + ', Signale ' + sig + ', Abweichungen ' + lokal);
  });
});
console.log('  GESAMT geprueft ' + gesamt + ', Abweichungen ' + abw);

/* ---------- 2) Snippet woertlich ---------- */
console.log('== 2) Snippet woertlich, 1m, AAPL + NVDA (ganze Reihe) ==');
['AAPL', 'NVDA'].forEach(function (sym) {
  var bars = lade('1m', sym), n = bars.length, t0 = Date.now();
  var sn = [];
  for (var i = 40; i < n; i++) { var r = snippet(bars, i, P); if (r) sn.push(i + ':' + r.dir); }
  var t1 = Date.now();
  var pE = { S: P.S, F: P.F, _wp: D.vorbereiten(bars, P), ersteImAbschnitt: true };
  var mod = [];
  for (var j = 40; j < n; j++) { var m = D.signal(bars, j, pE); if (m) mod.push(j + ':' + m.dir); }
  var st = detectStudie(bars, P.S, P.F).map(function (x) { return x.i + ':' + x.dir; });
  var eq = function (a, b) { return a.length === b.length && a.every(function (x, k) { return x === b[k]; }); };
  var long = sn.filter(function (x) { return x.slice(-2) === ':1'; }).length;
  console.log('  ' + sym + ': Snippet ' + sn.length + ' Signale (' + long + ' long / ' + (sn.length - long) + ' short), ' + ((t1 - t0) / 1000).toFixed(1) + ' s' +
    ' | Modul ersteImAbschnitt ' + mod.length + ' | Studien-detect ' + st.length +
    ' | Snippet==Modul ' + eq(sn, mod) + ' | Snippet==Studie ' + eq(sn, st));
  console.log('    erste 5: ' + sn.slice(0, 5).join(' ') + '   letzte 3: ' + sn.slice(-3).join(' '));
});

/* ---------- 3) Archiv ---------- */
console.log('== 3) Archiv 1m: Wochentag / UTC-Stunden / Hoch-Tief-Belegung / Doppel-Wendepunkte ==');
['AAPL', 'NVDA', 'MSFT'].forEach(function (sym) {
  var bars = lade('1m', sym);
  var wd = {}, hrs = {}, ohneHL = 0, ohneHLTage = {}, mitHLTage = {}, nichtMonoton = 0;
  bars.forEach(function (b, k) {
    var d = new Date(b[0]);
    wd[d.getUTCDay()] = (wd[d.getUTCDay()] || 0) + 1;
    var h = d.getUTCHours(); hrs[h] = (hrs[h] || 0) + 1;
    var tag = d.toISOString().slice(0, 10);
    if (b.length < 5 || b[3] == null || b[4] == null) { ohneHL++; ohneHLTage[tag] = 1; } else mitHLTage[tag] = 1;
    if (k > 0 && b[0] <= bars[k - 1][0]) nichtMonoton++;
  });
  var wp = Q.wendepunkte(bars, 5);
  var hi = {}; wp.hoch.forEach(function (w) { hi[w.i] = 1; });
  var doppel = wp.tief.filter(function (w) { return hi[w.i]; }).length;
  var tageOhne = Object.keys(ohneHLTage).sort();
  console.log('  ' + sym + ': Wochentage ' + JSON.stringify(wd) + ' | UTC-Stunden ' + JSON.stringify(hrs) +
    ' | Kerzen ohne Hoch/Tief ' + ohneHL + (tageOhne.length ? ' (' + tageOhne[0] + ' .. ' + tageOhne[tageOhne.length - 1] + ', ' + tageOhne.length + ' Tage)' : '') +
    ' | Tage mit Hoch/Tief ' + Object.keys(mitHLTage).length + ' | nicht monoton ' + nichtMonoton +
    ' | Wendepunkte hoch ' + wp.hoch.length + ' tief ' + wp.tief.length + ', Hoch=Tief gleicher Index ' + doppel);
});

/* ---------- 4) Live-Fenster-Simulation (range=1d) ---------- */
console.log('== 4) Live-Fenster 1m: Detektor nur auf Tages-Praefix (wie range=1d) vs. Archiv-Lauf ==');
function tage(bars) {
  var segs = [], st = 0;
  for (var i = 1; i <= bars.length; i++) {
    if (i === bars.length || Math.floor(bars[i][0] / 86400000) !== Math.floor(bars[st][0] / 86400000)) { segs.push([st, i - 1]); st = i; }
  }
  return segs;
}
var sumArch = 0, sumLive = 0, sumNurArch = 0, sumNurLive = 0, sumBeide = 0;
['AAPL', 'NVDA', 'MSFT'].forEach(function (sym) {
  var bars = lade('1m', sym), n = bars.length;
  var pE = { S: P.S, F: P.F, _wp: D.vorbereiten(bars, P), ersteImAbschnitt: true };
  var arch = {};
  for (var j = 40; j < n; j++) { var m = D.signal(bars, j, pE); if (m) arch[j] = m.dir; }
  var live = {};
  tage(bars).forEach(function (sg) {
    var tb = bars.slice(sg[0], sg[1] + 1);
    var pT = { S: P.S, F: P.F, _wp: D.vorbereiten(tb, P), ersteImAbschnitt: true };
    for (var c = 0; c < tb.length; c++) {
      if (c + 1 < 59) continue;                       // depot.js:1102: series.length < 60 -> 'keine Daten' (vor fertigeBars)
      var r = D.signal(tb, c, pT);
      if (r) live[sg[0] + c] = r.dir;
    }
  });
  var nA = Object.keys(arch).length, nL = Object.keys(live).length, beide = 0, nurA = 0, nurL = 0;
  Object.keys(arch).forEach(function (k) { if (live[k] === arch[k]) beide++; else nurA++; });
  Object.keys(live).forEach(function (k) { if (arch[k] !== live[k]) nurL++; });
  sumArch += nA; sumLive += nL; sumBeide += beide; sumNurArch += nurA; sumNurLive += nurL;
  console.log('  ' + sym + ': Archiv-Lauf ' + nA + ' | Live-Fenster ' + nL + ' | identisch ' + beide + ' | nur Archiv ' + nurA + ' | nur Live ' + nurL);
});
console.log('  SUMME: Archiv ' + sumArch + ', Live ' + sumLive + ', identisch ' + sumBeide + ', nur Archiv ' + sumNurArch + ' (' + (100 * sumNurArch / sumArch).toFixed(0) + ' %), nur Live ' + sumNurLive);
