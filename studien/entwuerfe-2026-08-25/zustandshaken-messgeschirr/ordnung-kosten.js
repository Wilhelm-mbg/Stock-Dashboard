'use strict';
/* Was kostet es, die Signalschleife von SYMBOL-Reihenfolge auf ZEIT-Reihenfolge
 * umzustellen? Gemessen, nicht geschaetzt. Gleiche Arbeit, gleiche Aufrufzahl,
 * nur die Reihenfolge unterscheidet sich. */
var fs = require('fs');
var path = require('path');
var ARCHIV = process.argv[2] || 'E:/Markt-Dashboard-Archiv/archiv60m';
var IV = process.argv[3] || '60m';
var MAX = parseInt(process.argv[4] || '99999', 10);
var VORLAUF = 261, H = 8;

var t0 = Date.now();
var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_' + IV + '_') === 0; }).slice(0, MAX);
var U = {};
dateien.forEach(function (f) {
  try {
    var j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8'));
    if (j && Array.isArray(j.series) && j.series.length > VORLAUF + H + 5) U[f.slice(('bars_' + IV + '_').length, -5)] = j.series;
  } catch (e) { }
});
var syms = Object.keys(U);
var kerzen = 0;
syms.forEach(function (s) { kerzen += U[s].length; });
console.log('Laden: ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s | ' + syms.length + ' Reihen, ' + kerzen.toLocaleString('de-DE') + ' Kerzen');

/* Ein billiges, aber echtes "Signal": EMA20-Abstand. Es geht nicht um die Regel,
 * sondern darum, dass in beiden Ordnungen GLEICH VIEL gerechnet wird. */
function pseudoSignal(b, i) {
  var s = 0;
  for (var k = i - 19; k <= i; k++) s += b[k][1];
  return b[i][1] / (s / 20) - 1 > 0.01 ? 1 : 0;
}

/* ---- A) SYMBOL-Reihenfolge (wie die Messmaschine heute) ---- */
var t1 = Date.now(), trefferA = 0, aufrufeA = 0;
syms.forEach(function (sym) {
  var b = U[sym];
  for (var i = VORLAUF; i < b.length - H; i++) { aufrufeA++; trefferA += pseudoSignal(b, i); }
});
var dauerA = Date.now() - t1;
console.log('A) Symbol-Reihenfolge: ' + (dauerA / 1000).toFixed(2) + ' s  (' + aufrufeA.toLocaleString('de-DE') + ' Aufrufe, ' + trefferA + ' Treffer)');

/* ---- Zeitachse bauen (wie baueQuerschnitt es schon tut) ---- */
var t2 = Date.now();
var zeitSatz = new Set();
syms.forEach(function (s) { var b = U[s]; for (var i = VORLAUF; i < b.length - H; i++) zeitSatz.add(b[i][0]); });
var zeit = Array.from(zeitSatz); zeit.sort(function (a, b) { return a - b; });
var dauerAchse = Date.now() - t2;
console.log('   Zeitachse bauen: ' + (dauerAchse / 1000).toFixed(2) + ' s  (' + zeit.length.toLocaleString('de-DE') + ' verschiedene Zeitstempel)');

/* ---- B) ZEIT-Reihenfolge, Zeigerlauf wie baueQuerschnitt ---- */
var t3 = Date.now(), trefferB = 0, aufrufeB = 0, leerlauf = 0;
var N = syms.length;
var zeiger = new Int32Array(N); for (var q = 0; q < N; q++) zeiger[q] = VORLAUF;
var reihen = syms.map(function (s) { return U[s]; });
var grenze = reihen.map(function (b) { return b.length - H; });
for (var ti = 0; ti < zeit.length; ti++) {
  var ms = zeit[ti];
  for (var si = 0; si < N; si++) {
    var b = reihen[si], p = zeiger[si], g = grenze[si];
    while (p < g && b[p][0] < ms) p++;
    zeiger[si] = p;
    if (p >= g) { leerlauf++; continue; }
    if (b[p][0] !== ms) { leerlauf++; continue; }
    aufrufeB++; trefferB += pseudoSignal(b, p);
  }
}
var dauerB = Date.now() - t3;
console.log('B) Zeit-Reihenfolge:   ' + (dauerB / 1000).toFixed(2) + ' s  (' + aufrufeB.toLocaleString('de-DE') + ' Aufrufe, ' + trefferB + ' Treffer, ' + leerlauf.toLocaleString('de-DE') + ' Leerlauf-Pruefungen)');
console.log('Faktor B/A (nur Schleife): ' + (dauerB / dauerA).toFixed(2) + 'x');
console.log('Faktor B+Achse / A:        ' + ((dauerB + dauerAchse) / dauerA).toFixed(2) + 'x');
console.log('Gleiche Trefferzahl? ' + (trefferA === trefferB ? 'JA' : 'NEIN (' + trefferA + ' vs ' + trefferB + ')'));
