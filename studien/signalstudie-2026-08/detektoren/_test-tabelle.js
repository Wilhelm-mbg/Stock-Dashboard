'use strict';
/* Test der Aufruftabelle: jeden Eintrag auf 1 Symbol x 200 Zufallsindizes je Zeitrahmen aufrufen,
 * Signale zaehlen, Fehler zaehlen, Praefix-Probe (bars.slice(0,i+1)) an denselben Stellen. */
var fs = require('fs');
var path = require('path');
var TAB = require(path.join(__dirname, '_tabelle.js'));
var MG = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/signalstudie-2026-08/messgeschirr.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var SYM = process.argv[2] || 'NVDA', N = parseInt(process.argv[3], 10) || 200;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(424242);   // einmal, ausserhalb aller Schleifen

var CACHE = {};
function lade(iv) {
  if (CACHE[iv]) return CACHE[iv];
  var bars;
  if (iv === '1d') {
    var roh = {}; for (var t = 0; t < 8; t++) Object.assign(roh, JSON.parse(fs.readFileSync(STORE + 'mf_tagesdaten_teil_' + t + '.json', 'utf8')).roh);
    bars = roh[SYM];
  } else {
    var raw = JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + SYM + '.json', 'utf8')).series;
    bars = raw.filter(function (b) { return MG.istSitzung(b[0]) && b[1] > 0 && b[0] % 60000 === 0; });   // wie ladeUniversum
  }
  CACHE[iv] = bars; return bars;
}

var zeilen = [];
TAB.forEach(function (D) {
  D.zeitrahmen.forEach(function (iv) {
    var bars = lade(iv);
    var n = bars.length, lo = Math.min(300, n - 1);
    var idx = []; for (var k = 0; k < N; k++) idx.push(lo + Math.floor(rnd() * (n - lo)));
    var sig = 0, lng = 0, sht = 0, fehler = 0, praefixAbw = 0, t0 = Date.now(), ersteFehler = null;
    idx.forEach(function (i) {
      var s = null;
      try { s = D.signal(bars, i, D.params); } catch (e) { fehler++; if (!ersteFehler) ersteFehler = e.message; return; }
      if (s && s.dir) { sig++; if (s.dir > 0) lng++; else sht++; }
      var p = null;
      try { p = D.signal(bars.slice(0, i + 1), i, D.params); } catch (e) { fehler++; return; }
      var a = s ? s.dir : 0, b = p ? p.dir : 0;
      if (a !== b) praefixAbw++;
    });
    zeilen.push({ key: D.key, iv: iv, n: n, geprueft: idx.length, signale: sig, long: lng, short: sht, fehler: fehler, praefixAbw: praefixAbw, ms: Date.now() - t0, freigabe: D.freigabe, err: ersteFehler });
  });
});
// Vollscan fuer die seltenen Querschnitts-Detektoren (60m)
['momentum', 'drift'].forEach(function (key) {
  var D = TAB.filter(function (d) { return d.key === key; })[0]; var bars = lade('60m'); var c = { l: 0, s: 0 };
  for (var i = 1; i < bars.length; i++) { var s = D.signal(bars, i, D.params); if (s) { if (s.dir > 0) c.l++; else c.s++; } }
  zeilen.push({ key: key + ' (Vollscan)', iv: '60m', n: bars.length, geprueft: bars.length - 1, signale: c.l + c.s, long: c.l, short: c.s, fehler: 0, praefixAbw: '-', ms: 0, freigabe: D.freigabe });
});
// Fingerabdruck-Erkennung ohne sym
var b60 = lade('60m'); console.log('symVon ohne params.sym:', TAB.helfer.symVon(b60, 1000, {}), '(erwartet ' + SYM + ')');
console.log('key'.padEnd(26) + 'iv'.padEnd(5) + 'n'.padStart(6) + 'gepr'.padStart(6) + 'sig'.padStart(5) + 'long'.padStart(5) + 'short'.padStart(6) + 'fehl'.padStart(5) + 'prfx'.padStart(5) + '  ms  freigabe');
zeilen.forEach(function (z) { console.log(z.key.padEnd(26) + z.iv.padEnd(5) + String(z.n).padStart(6) + String(z.geprueft).padStart(6) + String(z.signale).padStart(5) + String(z.long).padStart(5) + String(z.short).padStart(6) + String(z.fehler).padStart(5) + String(z.praefixAbw).padStart(5) + '  ' + String(z.ms).padStart(5) + '  ' + z.freigabe + (z.err ? '  ERR: ' + z.err : '')); });
