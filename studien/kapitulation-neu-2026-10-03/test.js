'use strict';
/* PRUEFUNGEN der Zaehlung (Auftrag Nr. 65) - jede mit Gegenprobe, die rot wird, wenn die Logik bricht.
 * Aufruf: node studien/kapitulation-neu-2026-10-03/test.js   (liest nur Kopfdateien des Archivs: Kalender, Symboltafel)
 */
var Z = require('./zaehlen.js');
var gut = 0, rot = 0;
function ok(b, was) { if (b) gut++; else { rot++; console.log('ROT: ' + was); } }

/* 1. 60m-Gitter: 390 Minuten ab Sitzungsbeginn -> 7 Kerzen, die letzte 30 Minuten; Stempel = Eimeranfang; Schluss = letzter Kurs. */
var auf = Date.UTC(2024, 0, 3, 14, 30), k1 = [];
for (var m = 0; m < 390; m++) k1.push([auf + m * 60000, 100 + m, 10]);
var bars = [], vol = Z.verdichte60(k1, { von: 0, bis: 389, auf: auf }, bars);
ok(bars.length === 7, '7 Stundenkerzen je vollem Tag');
ok(bars[0][0] === auf && bars[6][0] === auf + 6 * 3600000, 'Stempel = Eimeranfang');
ok(bars[0][1] === 159 && bars[6][1] === 489, 'Schluss = letzte Minute des Eimers');
ok(bars[0][2] === 600 && bars[6][2] === 300 && vol === 3900, 'Stueckzahlen summiert, letzte Kerze 30 Minuten');
var halb = []; Z.verdichte60(k1, { von: 0, bis: 209, auf: auf }, halb);
ok(halb.length === 4, 'Gegenprobe Halbtag: 210 Minuten -> 4 Kerzen, nicht 7');

/* 2. Regime: Urteil der letzten SPY-Kerze STRENG vor dem Signalstempel; vor 200 Kerzen kein Urteil = Tor offen. */
var spy = [];
for (var q = 0; q < 400; q++) spy.push([q * 3600000, q < 300 ? 100 + q : 400 - 3 * (q - 300), 1]);
var R = Z.regimeAus(spy);
ok(R.offen(spy[100][0]) === true, 'ohne Urteil (unter 200 Kerzen) laesst das Tor durch');
ok(R.offen(spy[299][0]) === false, 'steigender Markt: Tor zu');
ok(R.ueber[399] === false && R.offen(spy[399][0] + 1) === true, 'gefallener Markt: Tor offen');
var kipp = -1; for (q = 201; q < 400; q++) if (R.ueber[q] === false && R.ueber[q - 1] === true) { kipp = q; break; }
ok(kipp > 0 && R.offen(spy[kipp][0]) === false && R.offen(spy[kipp][0] + 1) === true, 'Gegenprobe: zeitgleiche SPY-Kerze zaehlt NICHT (streng davor)');

/* 3. Stichprobe: feste Saat, Schichtung im Verhaeltnis des Archivs. */
var alle = []; for (q = 0; q < 7299; q++) alle.push({ reihe: 'R' + String(q).padStart(4, '0'), lebend: q < 2306 ? 1 : 0 });
var s1 = Z.stichprobe(alle, 400), s2 = Z.stichprobe(alle, 400);
ok(s1.length === 400 && s1.filter(function (r) { return r.lebend; }).length === 126, '400 Reihen, davon 126 lebend (2.306 von 7.299)');
ok(s1.map(function (r) { return r.reihe; }).join() === s2.map(function (r) { return r.reihe; }).join(), 'dieselbe Saat zieht dieselben Reihen');
ok(new Set(s1.map(function (r) { return r.reihe; })).size === 400, 'Gegenprobe: keine Reihe doppelt');

console.log(gut + ' gruen, ' + rot + ' rot');
process.exit(rot ? 1 : 0);
