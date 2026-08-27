'use strict';
/* Analytiker 27.08.2026, Teil 2 des Nachzaehl-Auftrags: Ist die stehengebliebene
 * 20:00Z-Kerze des 25.08. der AMTLICHE TAGESSCHLUSS (dann korrekt, nur Umsatz 0)
 * oder ein eingefrorener Quote-Stempel (dann falscher Kurs)?
 * Schiedsrichter: der 1d-Tagesbalken desselben Werts am 25.08.
 * Kerzenformat: [zeit, schluss, umsatz, hoch, tief, eroeffnung]. Nur lesen. */
var fs = require('fs'), path = require('path');
var A60 = 'E:/Markt-Dashboard-Archiv/archiv60m', A1D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var T0 = Date.parse('2026-08-25T00:00:00Z'), T1 = Date.parse('2026-08-26T00:00:00Z');
var TS2000 = Date.parse('2026-08-25T20:00:00Z'), TS1930 = Date.parse('2026-08-25T19:30:00Z');
var T26_0 = Date.parse('2026-08-26T00:00:00Z'), T26_1 = Date.parse('2026-08-27T00:00:00Z');

function lade(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')).series || null; } catch (e) { return null; } }
function symAus(f) { return f.replace(/^bars_(60m|1d)_/, '').replace(/\.json$/, ''); }
function dateien(A, prefix) {
  var out = {};
  fs.readdirSync(A).forEach(function (f) { if (f.indexOf(prefix) === 0) out[symAus(f)] = path.join(A, f); });
  var etf = path.join(A, 'etf');
  if (fs.existsSync(etf)) fs.readdirSync(etf).forEach(function (f) { if (f.indexOf(prefix) === 0) out[symAus(f)] = path.join(etf, f); });
  return out;
}
var d60 = dateien(A60, 'bars_60m_'), d1d = dateien(A1D, 'bars_1d_');

var LEITER = [0, 1e-6, 1e-5, 1e-4, 1e-3];
var zael = { beide: 0, ohne1dTag: 0, mit2000: 0 };
var passt2000 = LEITER.map(function () { return 0; });
var passt1930 = LEITER.map(function () { return 0; });
var naeher = { k2000: 0, k1930: 0, gleich: 0 };
var phantomAlt = 0;   // 20:00-Schluss == 19:30-Schluss (der alte Einfrier-Befund)
var abw = [];
var hat2000am26 = 0, mit26 = 0;

Object.keys(d60).forEach(function (sym) {
  var s60 = lade(d60[sym]); if (!s60) return;
  var tag = s60.filter(function (k) { return k[0] >= T0 && k[0] < T1; });
  var k2000 = null, k1930 = null;
  tag.forEach(function (k) { if (k[0] === TS2000) k2000 = k; if (k[0] === TS1930) k1930 = k; });
  var t26 = s60.filter(function (k) { return k[0] >= T26_0 && k[0] < T26_1; });
  if (t26.length) { mit26++; if (t26.some(function (k) { return new Date(k[0]).toISOString().slice(11, 16) === '20:00'; })) hat2000am26++; }
  if (!k2000) return;
  zael.mit2000++;
  if (k1930 && k2000[1] === k1930[1]) phantomAlt++;
  if (!d1d[sym]) { zael.ohne1dTag++; return; }
  var s1d = lade(d1d[sym]); if (!s1d) { zael.ohne1dTag++; return; }
  var kTag = s1d.filter(function (k) { return k[0] >= T0 && k[0] < T1; })[0];
  if (!kTag) { zael.ohne1dTag++; return; }
  zael.beide++;
  var c1d = kTag[1];
  var r2000 = Math.abs(k2000[1] - c1d) / c1d;
  var r1930 = k1930 ? Math.abs(k1930[1] - c1d) / c1d : Infinity;
  LEITER.forEach(function (tol, i) {
    if (tol === 0 ? k2000[1] === c1d : r2000 <= tol) passt2000[i]++;
    if (tol === 0 ? (k1930 && k1930[1] === c1d) : r1930 <= tol) passt1930[i]++;
  });
  if (r2000 < r1930) naeher.k2000++; else if (r1930 < r2000) naeher.k1930++; else naeher.gleich++;
  abw.push({ sym: sym, r2000: r2000, r1930: r1930 });
});

function pct(x, n) { return (100 * x / n).toFixed(2) + ' %'; }
console.log('Reihen mit 20:00Z am 25.08.: ' + zael.mit2000 + '   davon mit 1d-Tagesbalken 25.08.: ' + zael.beide + '   ohne: ' + zael.ohne1dTag);
console.log('20:00-Schluss == 19:30-Schluss (alter Einfrier-Befund): ' + phantomAlt);
console.log('\nToleranz-Leiter (Anteil an ' + zael.beide + ' Tagen mit beiden Archiven):');
console.log('  Toleranz    20:00==1d-Schluss    19:30==1d-Schluss');
LEITER.forEach(function (tol, i) {
  console.log('  ' + String(tol === 0 ? 'exakt' : tol).padEnd(10) + '  ' + pct(passt2000[i], zael.beide).padStart(9) + '          ' + pct(passt1930[i], zael.beide).padStart(9));
});
console.log('\nWer liegt naeher am 1d-Schluss?  20:00: ' + naeher.k2000 + '   19:30: ' + naeher.k1930 + '   gleich: ' + naeher.gleich);
abw.sort(function (a, b) { return b.r2000 - a.r2000; });
console.log('\nGroesste 20:00-Abweichungen vom 1d-Schluss:');
abw.slice(0, 8).forEach(function (a) { console.log('  ' + a.sym.padEnd(8) + ' 20:00-Abw ' + (a.r2000 * 100).toFixed(4) + ' %   19:30-Abw ' + (a.r1930 * 100).toFixed(4) + ' %'); });
var med = abw.map(function (a) { return a.r2000; }).sort(function (a, b) { return a - b; });
console.log('\n20:00-Abweichung p50 ' + (med[Math.floor(med.length / 2)] * 100).toFixed(4) + ' %   p90 ' + (med[Math.floor(med.length * 0.9)] * 100).toFixed(4) + ' %   max ' + (med[med.length - 1] * 100).toFixed(4) + ' %');
console.log('\n26.08.: Reihen mit Kerzen ' + mit26 + ', davon mit 20:00Z-Kerze ' + hat2000am26);
