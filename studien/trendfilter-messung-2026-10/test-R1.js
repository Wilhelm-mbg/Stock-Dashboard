'use strict';
/* Tests der Regel R1 "Faber 10 Monate" (regel-R1.js, REGEL.md §4.1). Aufruf aus der Repo-Wurzel:
 *   node studien/trendfilter-messung-2026-10/test-R1.js [--daten <ordner>]
 * Ausgabe "N gruen, M rot", Rueckgabewert 1 bei rot.
 *
 * Teil 1: Kunstdaten ueber K.baueDaten, Sollwerte VON HAND gerechnet (Rechenweg je Fall im Kommentar).
 * Teil 2: echte Daten (daten/SPY.json). Ein ZWEITER, eigener Weg - eigener Gesamtertragsindex direkt aus laden.lies, eigene
 *         Monatsenden, eigenes Mittel - muss an jedem Monatsende 1993-2026 dasselbe Ziel liefern wie regel-R1.js; dazu der
 *         Abgleich von signale-R1.json mit dem zweiten Weg. Nur Signal, keine Ertraege (kein simuliere/auswerten auf echten Daten).
 */
var fs = require('fs');
var path = require('path');
var K = require('./kern.js');
var L = require('./laden.js');
var R1 = require('./regel-R1.js');

var gruen = 0, rot = 0;
function ok(name, bedingung, info) {
  if (bedingung) { gruen++; return; }
  rot++;
  console.log('ROT: ' + name + (info !== undefined ? '  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : ''));
}
/** Ein Fall, der mit einer Ausnahme abbricht, zaehlt als rot (statt den ganzen Lauf abzubrechen). */
function fall(name, fn) {
  try { fn(); } catch (e) { ok(name + ': lief ohne Ausnahme durch', false, String(e && e.message || e)); }
}
function nah(a, b, tol) { return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= (tol || 1e-12) * Math.max(1, Math.abs(b)); }
function gleich(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* ======================= Teil 1: Kunstdaten ======================= */

/* Kalender der Kunstdaten: Monat k = 0 ist 2000-01; Handelstage am 05., 15. und 25. jedes Monats, der 25. ist also das Monatsende.
 * Am Schluss ein einzelner Tag am 05. des Folgemonats, damit der 25. des letzten Monats ein Monatsende ist (der letzte Datentag ist
 * nach kern.js L5 nie eins). BIL und SHY stehen fest auf 100 (nur fuer das Buch noetig). */
function monatTag(k, tag) {
  var y = 2000 + Math.floor(k / 12), m = k % 12 + 1;
  return y + '-' + (m < 10 ? '0' : '') + m + '-' + tag;
}
function monatVon(tag) { return (+tag.slice(0, 4) - 2000) * 12 + (+tag.slice(5, 7) - 1); }
function kunst(monate, spy, div, weg) {
  var tage = [];
  for (var k = 0; k < monate; k++) ['05', '15', '25'].forEach(function (t) { tage.push(monatTag(k, t)); });
  tage.push(monatTag(monate, '05'));
  if (weg) tage = tage.filter(function (t) { return weg.indexOf(t) < 0; });
  var roh = { SPY: { zeilen: [], div: div || [] }, BIL: { zeilen: [], div: [] }, SHY: { zeilen: [], div: [] } };
  tage.forEach(function (t) {
    var c = spy(t);
    roh.SPY.zeilen.push({ tag: t, o: c, c: c });
    roh.BIL.zeilen.push({ tag: t, o: 100, c: 100 });
    roh.SHY.zeilen.push({ tag: t, o: 100, c: 100 });
  });
  return K.baueDaten(roh, '2099-12-31');
}
function detVon(det, tag) { for (var q = 0; q < det.length; q++) if (det[q].tag === tag) return det[q]; return undefined; }
var BIL = { geld: 'BIL', intl: 'ACWX', anleihen: 'AGG' };
var SHY = { geld: 'SHY', intl: 'EFA', anleihen: 'AGG' };

/* ---- Fall A: Grundfall (16 Monate 2000-01 .. 2001-04, Schlusstag 2001-05-05) ----
 * SPY-Schluss: erste Zeile 2000-01-05 = 64, jeder andere 05. = 500, jeder 15. = 7 (wilde Zwischenwerte: die Regel darf nur die
 * Monatsenden sehen), am 25. (Monatsende k) c_k aus ME_A. Ohne Ausschuettungen ist TR = Schluss / 64, also TR(k) = c_k / 64
 * (exakt darstellbar); Vergleiche von TR sind Vergleiche von c_k. Monatsenden k = 0..15:
 *   k:   0    1    2..9   10   11   12   13   14   15
 *   c_k: 300  10   100    95   105  100  100  100  120
 * k = 0..8 (2000-01 .. 2000-09): weniger als zehn Monatsenden -> null (am neunten, k = 8, noch null).
 * k = 9  (2000-10-25, das zehnte): Fenster k0..k9: 300 + 10 + 8*100 = 1110 -> SMA 111;  P 100  < 111   -> BIL; P/SMA = 100/111.
 * k = 10 (2000-11-25): Fenster k1..k10: 10 + 8*100 + 95 = 905 -> SMA 90,5;            P 95   > 90,5  -> SPY; P/SMA = 95/90,5.
 *        "M zaehlt mit" und "genau zehn": jedes falsche Fenster kippt das Ergebnis nach Geld -
 *        ohne M (k0..k9): 1110/10 = 111 > 95; elf Werte (k0..k10): 1205/11 = 109,5 > 95; neun Werte (k2..k10): 895/9 = 99,4 > 95.
 * k = 11 (2000-12-25): Fenster k2..k11: 8*100 + 95 + 105 = 1000 -> SMA 100;            P 105  > 100   -> SPY; P/SMA = 1,05.
 * k = 12 (2001-01-25): Fenster k3..k12: 7*100 + 95 + 105 + 100 = 1000 -> SMA 100;      P 100 = 100    -> Gleichstand -> BIL; P/SMA = 1.
 *        (exakt: alle TR sind Vielfache von 1/64, Summe 15,625, /10 = 1,5625 = P - keine Rundung.)
 * k = 13 (2001-02-25): Fenster k4..k13: 6*100 + 95 + 105 + 2*100 = 1000 -> 100;        P 100 = 100    -> BIL; P/SMA = 1.
 * k = 14 (2001-03-25): Fenster k5..k14: 5*100 + 95 + 105 + 3*100 = 1000 -> 100;        P 100 = 100    -> BIL; P/SMA = 1.
 * k = 15 (2001-04-25): Fenster k6..k15: 4*100 + 95 + 105 + 3*100 + 120 = 1020 -> 102;  P 120  > 102   -> SPY; P/SMA = 120/102.
 * Ziel-Feld: jeder Tag eines Monats haelt das Signal des Monatsendes des VORMONATS (Ausfuehrung am Tag nach dem Monatsende):
 *   2000-01 .. 2000-10: null (auch 2000-10-25 selbst), 2000-11: BIL, 2000-12: SPY, 2001-01: SPY, 2001-02: BIL, 2001-03: BIL,
 *   2001-04: BIL, 2001-05 (05.): SPY. */
var ME_A = [300, 10, 100, 100, 100, 100, 100, 100, 100, 100, 95, 105, 100, 100, 100, 120];
function spyA(t) {
  if (t === '2000-01-05') return 64;
  if (t.slice(8) === '05') return 500;
  if (t.slice(8) === '15') return 7;
  return ME_A[monatVon(t)];
}
var ZIEL_A = { '2000-11': 'G', '2000-12': 'SPY', '2001-01': 'SPY', '2001-02': 'G', '2001-03': 'G', '2001-04': 'G', '2001-05': 'SPY' };
var DET_A = [ // [Monatsende, Ziel, P/SMA10] fuer k = 9..15, von Hand (oben)
  ['2000-10-25', 'G', 100 / 111], ['2000-11-25', 'SPY', 95 / 90.5], ['2000-12-25', 'SPY', 1.05], ['2001-01-25', 'G', 1],
  ['2001-02-25', 'G', 1], ['2001-03-25', 'G', 1], ['2001-04-25', 'SPY', 120 / 102]
];
function sollZielA(tag, geld) { var z = ZIEL_A[tag.slice(0, 7)]; return z === undefined ? null : (z === 'G' ? geld : z); }

fall('A', function () {
  var D = kunst(16, spyA);
  ok('A: Kalender 49 Tage, 16 Monatsenden', D.n === 49 && D.tage.filter(function (t, i) { return D.monatsende[i]; }).length === 16);
  ok('A: TR am Monatsende = c/64 exakt (Kunstdaten richtig gebaut)', D.reihen.SPY.tr[D.idx['2000-11-25']] === 95 / 64 && D.reihen.SPY.tr[D.idx['2000-01-25']] === 300 / 64);
  [['BIL', BIL], ['SHY', SHY]].forEach(function (g) {
    var geld = g[0], opt = g[1];
    var ziel = R1.signal(D, opt);
    ok('A/' + geld + ': Laenge D.n', ziel.length === D.n);
    var falsch = [];
    for (var i = 0; i < D.n; i++) if (ziel[i] !== sollZielA(D.tage[i], geld)) falsch.push(D.tage[i] + ' ist ' + ziel[i] + ' soll ' + sollZielA(D.tage[i], geld));
    ok('A/' + geld + ': Ziel-Feld an allen 49 Tagen wie von Hand', falsch.length === 0, falsch);
    var det = R1.details(D, opt);
    ok('A/' + geld + ': details hat 16 Monatsenden', det.length === 16);
    ok('A/' + geld + ': am neunten Monatsende (2000-09-25) null, ebenso davor',
      det.slice(0, 9).every(function (x) { return x.ziel === null && x.verhaeltnis === null; }) && det[8].tag === '2000-09-25');
    DET_A.forEach(function (s) {
      var x = detVon(det, s[0]);
      var soll = s[1] === 'G' ? geld : s[1];
      ok('A/' + geld + ': ' + s[0] + ' Ziel ' + soll + ', P/SMA10 ' + s[2], x && x.ziel === soll && nah(x.verhaeltnis, s[2]), x);
    });
  });
  var det = R1.details(D, BIL);
  ok('A: zehntes Monatsende 2000-10-25 berechenbar (BIL)', det[9].tag === '2000-10-25' && det[9].ziel === 'BIL');
  ok('A: M zaehlt mit, genau zehn Werte (2000-11-25 -> SPY; jedes andere Fenster gaebe Geld)', detVon(det, '2000-11-25').ziel === 'SPY');
  ok('A: Gleichstand P = SMA10 exakt (Verhaeltnis === 1) -> Geld', [12, 13, 14].every(function (k) { return det[k].verhaeltnis === 1 && det[k].ziel === 'BIL'; }));
  var ziel = R1.signal(D, BIL);
  ok('A: Ausfuehrung erst am Tag NACH dem Monatsende: 2000-11-25 noch BIL, 2000-12-05 SPY',
    ziel[D.idx['2000-11-25']] === 'BIL' && ziel[D.idx['2000-12-05']] === 'SPY');
  ok('A: Ausfuehrung am Tag nach dem Monatsende: 2001-01-25 noch SPY, 2001-02-05 BIL',
    ziel[D.idx['2001-01-25']] === 'SPY' && ziel[D.idx['2001-02-05']] === 'BIL');
  ok('A: zehntes Monatsende selbst (2000-10-25) traegt noch null, Tag danach BIL',
    ziel[D.idx['2000-10-25']] === null && ziel[D.idx['2000-11-05']] === 'BIL');

  /* Buch auf Kunstdaten (K.simuliere): Erstkauf und Wechseltage folgen dem Ziel-Feld. */
  function buch(z, s) {
    var l = K.simuliere(D, z, D.idx[s], D.n - 1, {});
    return { erst: [l.erstkauf.tag, l.erstkauf.reihe], wechsel: l.wechsel.map(function (w) { return [w.tag, w.von, w.nach]; }) };
  }
  var b1 = buch(ziel, '2000-11-05');
  ok('A: Buch ab 2000-11-05: Erstkauf BIL, Wechsel 2000-12-05 BIL->SPY, 2001-02-05 SPY->BIL, 2001-05-05 BIL->SPY (je zur Eroeffnung nach dem Monatsende)',
    gleich(b1, { erst: ['2000-11-05', 'BIL'], wechsel: [['2000-12-05', 'BIL', 'SPY'], ['2001-02-05', 'SPY', 'BIL'], ['2001-05-05', 'BIL', 'SPY']] }), b1);
  /* Starttag mitten im Monat: haelt das Signal des letzten Monatsendes vor s (REGEL §4.4). */
  var b2 = buch(ziel, '2001-01-15');
  ok('A: Starttag 2001-01-15 (Monatsmitte) haelt das Signal von 2000-12-25: Erstkauf SPY, dann 2001-02-05 ->BIL, 2001-05-05 ->SPY',
    ziel[D.idx['2001-01-15']] === 'SPY' && gleich(b2, { erst: ['2001-01-15', 'SPY'], wechsel: [['2001-02-05', 'SPY', 'BIL'], ['2001-05-05', 'BIL', 'SPY']] }), b2);
  var b3 = buch(ziel, '2001-03-15');
  ok('A: Starttag 2001-03-15 haelt das Signal von 2001-02-25: Erstkauf BIL, dann 2001-05-05 ->SPY',
    gleich(b3, { erst: ['2001-03-15', 'BIL'], wechsel: [['2001-05-05', 'BIL', 'SPY']] }), b3);
  var b4 = buch(R1.signal(D, SHY), '2000-11-05');
  ok('A: opt.geld = SHY wirkt im Buch: Erstkauf SHY, Wechsel SHY->SPY->SHY->SPY an denselben Tagen',
    gleich(b4, { erst: ['2000-11-05', 'SHY'], wechsel: [['2000-12-05', 'SHY', 'SPY'], ['2001-02-05', 'SPY', 'SHY'], ['2001-05-05', 'SHY', 'SPY']] }), b4);
  var ohneGeld = false, spyAlsGeld = false;
  try { R1.signal(D, {}); } catch (e) { ohneGeld = /opt\.geld/.test(e.message); }
  try { R1.signal(D, { geld: 'SPY' }); } catch (e) { spyAlsGeld = /opt\.geld/.test(e.message); }
  ok('A: fehlendes oder unsinniges opt.geld bricht laut ab', ohneGeld && spyAlsGeld);
  ok('A: Kennung der Regel', R1.name === 'R1' && R1.titel === 'Faber 10 Monate' && R1.art === 'monatlich');
});

/* ---- Fall A2: Gleichstand-Gegenprobe. Wie A, aber c_12 = 101 statt 100.
 * k = 12: Fenster k3..k12: 7*100 + 95 + 105 + 101 = 1001 -> SMA 100,1; P 101 > 100,1 -> SPY; P/SMA = 101/100,1.
 * Damit ist gezeigt, dass das Geld bei k = 12 in Fall A am Gleichstand haengt, nicht an etwas anderem. */
fall('A2', function () {
  var D = kunst(16, function (t) { return t === '2001-01-25' ? 101 : spyA(t); });
  var x = detVon(R1.details(D, BIL), '2001-01-25');
  ok('A2: knapp ueber dem Mittel (101 > 100,1) -> SPY, P/SMA10 = 101/100,1', x.ziel === 'SPY' && nah(x.verhaeltnis, 101 / 100.1), x);
});

/* ---- Fall A3: kein Blick voraus. Wie A, aber JEDER SPY-Kurs nach dem Monatsende 2000-11-25 (k = 10) wird 1 (auch Eroeffnung und
 * Schluss am Ausfuehrungstag 2000-12-05), dazu eine Ausschuettung 3 mit Ex-Tag 2000-12-15.
 * Soll: details k = 0..10 bitgleich wie in A; Ziel-Feld bis einschliesslich 2000-12-25 (haelt noch das Signal von 2000-11-25)
 * gleich. Gegenprobe, dass die Aenderung wirkt: k = 11: TR(2000-12-25) = 95/64 * 1/95 * (1 + 3)/1 * 1/1 = 4/64, Mittel k2..k11 =
 * (8*100 + 95 + 4)/640 = 899/640 -> P weit darunter -> BIL, also ab 2001-01-05 BIL statt SPY. */
fall('A3', function () {
  var DA = kunst(16, spyA);
  var D = kunst(16, function (t) { return t > '2000-11-25' ? 1 : spyA(t); }, [{ tag: '2000-12-15', betrag: 3 }]);
  var detA = R1.details(DA, BIL), det = R1.details(D, BIL);
  ok('A3: Signale bis 2000-11-25 unveraendert (bitgleich), obwohl alle spaeteren Kurse anders sind', gleich(det.slice(0, 11), detA.slice(0, 11)));
  var zA = R1.signal(DA, BIL), z = R1.signal(D, BIL);
  var bis = D.idx['2000-12-25'];
  ok('A3: Ziel-Feld bis einschliesslich 2000-12-25 unveraendert', gleich(z.slice(0, bis + 1), zA.slice(0, bis + 1)));
  ok('A3: Gegenprobe: die geaenderten Kurse wirken ab dem naechsten Monatsende (2001-01-05 BIL statt SPY)',
    zA[D.idx['2001-01-05']] === 'SPY' && z[D.idx['2001-01-05']] === 'BIL');
});

/* ---- Fall B: Ausschuettung wirkt ueber den Gesamtertragsindex (10 Monate 2000-01 .. 2000-10, Schlusstag 2000-11-05).
 * SPY-Schluss 100 an jedem Tag, ausser 2000-10-15 = 96 (Ex-Tag einer Ausschuettung von 5) und 2000-10-25 = 99, 2000-11-05 = 99.
 * TR an den Monatsenden k = 0..8: 1 (Kurs flach, keine Ausschuettung).
 * TR(2000-10-15) = 1 * (96 + 5) / 100 = 1,01;  TR(2000-10-25) = 1,01 * 99 / 96 = 99,99 / 96 = 1,0415625.
 * SMA10 = (9 * 1 + 1,0415625) / 10 = 1,00415625;  P = 1,0415625 > SMA10 -> SPY;  P/SMA10 = 1,0415625 / 1,00415625 = 1,03725...
 * Reiner Kurs dagegen: 99 < (9 * 100 + 99) / 10 = 99,9 -> nach dem Kurs waere es Geld.
 * Fall B0, gleiche Kurse OHNE Ausschuettung: TR(2000-10-25) = 0,96 * 99 / 96 = 0,99; SMA10 = (9 + 0,99) / 10 = 0,999;
 * P < SMA10 -> BIL; P/SMA10 = 0,99 / 0,999 = 0,99099... */
function spyB(t) { return t === '2000-10-15' ? 96 : (t >= '2000-10-25' ? 99 : 100); }
fall('B', function () {
  var D = kunst(10, spyB, [{ tag: '2000-10-15', betrag: 5 }]);
  var D0 = kunst(10, spyB);
  var c = D.reihen.SPY.c, summeKurs = 0;
  for (var i = 0; i < D.n; i++) if (D.monatsende[i]) summeKurs += c[i];
  ok('B: Fall richtig gebaut - reiner Kurs am Monatsende (99) unter seinem 10-Monats-Mittel (99,9)', c[D.idx['2000-10-25']] === 99 && nah(summeKurs / 10, 99.9));
  ok('B: TR(2000-10-25) = 1,0415625', nah(D.reihen.SPY.tr[D.idx['2000-10-25']], 1.0415625));
  var x = detVon(R1.details(D, BIL), '2000-10-25'), x0 = detVon(R1.details(D0, BIL), '2000-10-25');
  ok('B: mit Ausschuettung: Gesamtertrag ueber dem Mittel -> SPY, P/SMA10 = 1,0415625/1,00415625', x.ziel === 'SPY' && nah(x.verhaeltnis, 1.0415625 / 1.00415625), x);
  ok('B0: dieselben Kurse ohne Ausschuettung -> BIL, P/SMA10 = 0,99/0,999', x0.ziel === 'BIL' && nah(x0.verhaeltnis, 0.99 / 0.999), x0);
  ok('B: Ziel-Feld am Tag nach dem Monatsende (2000-11-05) SPY, ohne Ausschuettung BIL',
    R1.signal(D, BIL)[D.idx['2000-11-05']] === 'SPY' && R1.signal(D0, BIL)[D0.idx['2000-11-05']] === 'BIL');
});

/* ---- Fall C: erste Zeile ist selbst ein Monatsende (Kalender beginnt 2000-01-25, wie SPY am 29.01.1993). Kurs 100, nur
 * 2000-10-25 und 2000-11-05 = 110. TR(k) = 1 fuer k = 0..8, TR(k9) = 1,1. Das erste Monatsende zaehlt mit (TR dort definiert = 1),
 * also ist 2000-10-25 das zehnte: SMA10 = (9 + 1,1) / 10 = 1,01; 1,1 > 1,01 -> SPY; P/SMA10 = 1,1/1,01. 2000-09-25 (neuntes): null. */
fall('C', function () {
  var D = kunst(10, function (t) { return t >= '2000-10-25' ? 110 : 100; }, [], ['2000-01-05', '2000-01-15']);
  var det = R1.details(D, BIL);
  ok('C: Kalender beginnt am Monatsende 2000-01-25', D.tage[0] === '2000-01-25' && D.monatsende[0] === 1);
  ok('C: zehntes Monatsende (2000-10-25) berechenbar: SPY, P/SMA10 = 1,1/1,01; neuntes null',
    det.length === 10 && det[9].ziel === 'SPY' && nah(det[9].verhaeltnis, 1.1 / 1.01) && det[8].ziel === null, det.slice(8));
});

/* ---- Fall D: Kalenderluecke (ein ganzer Monat 2000-06 ohne Handelstag; sonst wie A). M-k zaehlt Kalendermonate: jedes Monatsende,
 * dessen Fenster 2000-06 enthaelt (2000-10 .. 2001-03), ist nicht berechenbar (null); 2001-04-25 (Fenster 2000-07 .. 2001-04) wieder
 * berechenbar: 4*100 + 95 + 105 + 3*100 + 120 = 1020 -> 102 < 120 -> SPY. Ein Buch ueber eine solche Stelle bricht laut ab
 * (kern: "kein Ziel"), statt still ueber einen Monat weniger zu mitteln. Auf dem echten Kalender gibt es keine Luecke (Teil 2). */
fall('D', function () {
  var D = kunst(16, spyA, [], ['2000-06-05', '2000-06-15', '2000-06-25']);
  var det = R1.details(D, BIL);
  ok('D: 15 Monatsenden; 2000-10-25 .. 2001-03-25 null; 2001-04-25 SPY',
    det.length === 15 && det.slice(8, 14).every(function (x) { return x.ziel === null; }) && det[14].tag === '2001-04-25' && det[14].ziel === 'SPY', det.slice(8));
  var geworfen = false;
  try { K.simuliere(D, R1.signal(D, BIL), D.idx['2000-12-05'], D.n - 1, {}); } catch (e) { geworfen = /kein Ziel/.test(e.message); }
  ok('D: Buch ueber die Luecke bricht laut ab', geworfen);
});

/* ======================= Teil 2: echte Daten, zweiter Weg ======================= */

function argWert(name, vorgabe) { var i = process.argv.indexOf(name); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe; }
var ORDNER = path.resolve(argWert('--daten', path.join(__dirname, 'daten')));

/** Zweiter Weg: liest SPY.json selbst (laden.lies), baut den Gesamtertragsindex als fortlaufendes Produkt, Monatsende = letzte Zeile
 *  jedes Kalendermonats (der abgeschnittene Monat des letzten Datentags faellt weg), Mittel der zehn Monatsenden aelteste zuerst. */
function zweiterWeg(geld) {
  var l = L.lies(fs.readFileSync(path.join(ORDNER, 'SPY.json'), 'utf8'));
  var rows = l.zeilen.filter(function (z) { return z.tag <= L.ENDE && typeof z.c === 'number' && z.c > 0; });
  var aus = {}, ohneZeile = 0, vorErster = 0;
  l.div.forEach(function (d) {
    if (d.tag > L.ENDE || !(d.betrag > 0)) return;
    var k = 0;
    while (k < rows.length && rows[k].tag < d.tag) k++;
    if (k === 0 || k >= rows.length) { vorErster++; return; } // am oder vor dem ersten Tag: wirkt nicht auf TR (TR = 1 dort)
    if (rows[k].tag !== d.tag) ohneZeile++;
    aus[rows[k].tag] = (aus[rows[k].tag] || 0) + d.betrag;
  });
  var tr = [1];
  for (var k = 1; k < rows.length; k++) tr.push(tr[k - 1] * ((rows[k].c + (aus[rows[k].tag] || 0)) / rows[k - 1].c));
  var letzteJeMonat = {};
  rows.forEach(function (z, q) { letzteJeMonat[z.tag.slice(0, 7)] = q; });
  var monate = Object.keys(letzteJeMonat).sort();
  var abgeschnitten = monate.pop();
  var me = monate.map(function (mo) { var q = letzteJeMonat[mo]; return { monat: mo, tag: rows[q].tag, zeile: q, tr: tr[q], naechster: rows[q + 1].tag }; });
  function nr(mo) { return +mo.slice(0, 4) * 12 + (+mo.slice(5, 7)); }
  me.forEach(function (x, q) {
    x.ziel = null; x.verhaeltnis = null;
    if (q < 9 || nr(me[q].monat) - nr(me[q - 9].monat) !== 9) return;
    var s = 0;
    for (var j = q - 9; j <= q; j++) s += me[j].tr;
    var sma = s / 10;
    x.verhaeltnis = x.tr / sma;
    x.ziel = x.tr > sma ? 'SPY' : geld;
  });
  return { me: me, abgeschnitten: abgeschnitten, ohneZeile: ohneZeile, vorErster: vorErster, zeilen: rows.length };
}
/** Wechsel-Monatsenden im Bereich [von, bis] nach dem zweiten Weg. */
function wechselZweit(me, von, bis) {
  var aus = [];
  for (var q = 1; q < me.length; q++) {
    if (me[q].monat < von || me[q].monat > bis) continue;
    if (me[q].ziel !== me[q - 1].ziel) aus.push({ monatsende: me[q].tag, ausfuehrung: me[q].naechster, von: me[q - 1].ziel, nach: me[q].ziel, verhaeltnis: me[q].verhaeltnis });
  }
  return aus;
}
/** Wechsel im Fenster nach dem zweiten Weg: Ausfuehrungstag x (Tag nach dem Monatsende) mit start < x <= ende. */
function fensterZweit(me, start, ende) {
  var aus = [];
  for (var q = 1; q < me.length; q++) {
    var x = me[q].naechster;
    if (x > start && x <= ende && me[q].ziel !== me[q - 1].ziel) aus.push(x);
  }
  return aus;
}

fall('echt', function () {
  if (!fs.existsSync(path.join(ORDNER, 'SPY.json'))) { console.log('  (Rohdaten fehlen in ' + ORDNER + ': Teil 2 uebersprungen - erst laden.js laufen lassen)'); return; }
  var D = K.ladeDaten(ORDNER);
  var zH = R1.signal(D, K.HAUPT), zE = R1.signal(D, K.ERSATZ);
  var detH = R1.details(D, K.HAUPT), detE = R1.details(D, K.ERSATZ);
  var w2 = zweiterWeg('BIL'), w2E = zweiterWeg('SHY');

  /* Kalender: jeder Kalendermonat 1993-01 .. 2026-08 hat genau ein Monatsende, 2026-09 (bei 15.09. abgeschnitten) keins. */
  var monate = detH.map(function (x) { return x.tag.slice(0, 7); });
  var luecke = [];
  for (var q = 1; q < monate.length; q++) if (K.plusMonat(monate[q - 1] + '-01').slice(0, 7) !== monate[q]) luecke.push(monate[q - 1] + ' -> ' + monate[q]);
  ok('echt: 404 Monatsenden 1993-01 .. 2026-08 ohne Kalenderluecke, 2026-09 keins', detH.length === 404 && monate[0] === '1993-01' && monate[403] === '2026-08' && luecke.length === 0, luecke);
  ok('echt: zweiter Weg sieht denselben Kalender (404 Monatsenden, abgeschnittener Monat 2026-09, ' + w2.zeilen + ' Zeilen = D.n)',
    w2.me.length === 404 && w2.abgeschnitten === '2026-09' && w2.zeilen === D.n);
  ok('echt: Ziel-Felder haben Laenge D.n', zH.length === D.n && zE.length === D.n);

  /* null nur am Anfang, bis einschliesslich zum zehnten Monatsende 1993-10-29; danach nur SPY oder Geld. */
  var erstes = -1;
  for (var i = 0; i < D.n; i++) if (zH[i] !== null) { erstes = i; break; }
  var unsauber = [];
  for (i = erstes; i < D.n; i++) {
    if (zH[i] !== 'SPY' && zH[i] !== 'BIL') unsauber.push(D.tage[i] + ' H ' + zH[i]);
    if (zE[i] !== (zH[i] === 'BIL' ? 'SHY' : zH[i])) unsauber.push(D.tage[i] + ' E ' + zE[i]);
  }
  ok('echt: erstes Ziel am 1993-11-01 (Tag nach dem zehnten Monatsende 1993-10-29)', D.tage[erstes] === '1993-11-01' && D.tage[erstes - 1] === '1993-10-29');
  ok('echt: danach nur SPY/BIL bzw. SPY/SHY, Ersatz zeitgleich mit Hauptlesart', unsauber.length === 0, unsauber.slice(0, 5));

  /* Beide Wege an jedem Monatsende: dasselbe Ziel (details und Ziel-Feld am Tag danach), Verhaeltnis bis auf Rundung gleich. */
  var abw = [], maxRel = 0, knappst = null, verglichen = 0, ab1994 = 0;
  [[detH, zH, w2, 'BIL'], [detE, zE, w2E, 'SHY']].forEach(function (satz) {
    var det = satz[0], z = satz[1], me = satz[2].me;
    for (var q = 0; q < me.length; q++) {
      var a = det[q], b = me[q];
      var zielTagDanach = z[D.idx[a.tag] + 1];
      if (a.tag !== b.tag || a.ziel !== b.ziel || zielTagDanach !== b.ziel || b.naechster !== D.tage[D.idx[a.tag] + 1]) {
        abw.push({ geld: satz[3], tag: a.tag, regel: a.ziel, feld: zielTagDanach, zweit: b.ziel, zweitTag: b.tag });
        continue;
      }
      if (b.verhaeltnis !== null) {
        var rel = Math.abs(a.verhaeltnis / b.verhaeltnis - 1);
        if (rel > maxRel) maxRel = rel;
        if (!knappst || Math.abs(b.verhaeltnis - 1) < Math.abs(knappst.verhaeltnis - 1)) knappst = b;
      } else if (a.verhaeltnis !== null) abw.push({ tag: a.tag, verhaeltnis: a.verhaeltnis });
      verglichen++;
      if (a.tag >= '1994') ab1994++;
    }
  });
  ok('echt: beide Wege liefern an allen 2 x 404 Monatsenden dasselbe Ziel (1994-2026: ' + ab1994 / 2 + ' je Lesart)', abw.length === 0 && verglichen === 808 && ab1994 === 784, abw.slice(0, 5));
  ok('echt: Verhaeltnis P/SMA10 beider Wege gleich bis auf Rundung (max. rel. Abweichung ' + maxRel.toExponential(2) + ' < 1e-12)', maxRel < 1e-12);
  ok('echt: knappste Entscheidung weit weg von Rundungsrauschen (|P/SMA10 - 1| = ' + Math.abs(knappst.verhaeltnis - 1).toExponential(3) + ' am ' + knappst.tag + ')',
    Math.abs(knappst.verhaeltnis - 1) > 1e-9);
  ok('echt: Ex-Tage ohne Zeile (Soll 0), Ausschuettung am/vor dem ersten Tag (Soll 0)', w2.ohneZeile === 0 && w2.vorErster === 0, { ohneZeile: w2.ohneZeile, vorErster: w2.vorErster });

  /* signale-R1.json gegen den zweiten Weg. */
  var datei = path.join(__dirname, 'signale-R1.json');
  if (!fs.existsSync(datei)) { ok('signale-R1.json vorhanden (node studien/trendfilter-messung-2026-10/regel-R1.js)', false); return; }
  var sj = JSON.parse(fs.readFileSync(datei, 'utf8'));
  function vergleicheListe(name, ist, soll) {
    var gut = ist.length === soll.length && ist.every(function (x, q) {
      var y = soll[q];
      return x.monatsende === y.monatsende && x.ausfuehrung === y.ausfuehrung && x.von === y.von && x.nach === y.nach && nah(x.verhaeltnis, y.verhaeltnis, 1e-12);
    });
    ok('signale-R1.json ' + name + ': ' + ist.length + ' Wechsel-Monatsenden wie der zweite Weg', gut, { ist: ist.length, soll: soll.length });
  }
  vergleicheListe('Hauptlesart 2016-01..2026-08', sj.hauptlesart.wechsel, wechselZweit(w2.me, '2016-01', '2026-08'));
  vergleicheListe('Ersatz 2003-01..2016-12', sj.ersatz.wechsel, wechselZweit(w2E.me, '2003-01', '2016-12'));
  var vorH = w2.me.filter(function (x) { return x.monat === '2015-12'; })[0], vorE = w2E.me.filter(function (x) { return x.monat === '2002-12'; })[0];
  ok('signale-R1.json: Zustand vor den Listen (2015-12, 2002-12) wie der zweite Weg',
    sj.hauptlesart.zustandDavor.ziel === vorH.ziel && sj.hauptlesart.zustandDavor.monatsende === vorH.tag &&
    sj.ersatz.zustandDavor.ziel === vorE.ziel && sj.ersatz.zustandDavor.monatsende === vorE.tag);
  ['A', 'B'].forEach(function (fn) {
    var f = K.FENSTER[fn];
    var soll = fensterZweit(w2.me, f.start, f.ende);
    var ist = sj.fenster[fn];
    var startZiel = w2.me.filter(function (x) { return x.tag < f.start; }).pop().ziel;
    ok('signale-R1.json Fenster ' + fn + ': ' + ist.wechsel + ' Wechsel, Tage und Startreihe wie der zweite Weg (' + soll.length + ')',
      ist.wechsel === soll.length && gleich(ist.tage.map(function (x) { return x.ausfuehrung; }), soll) && ist.zielAmStart === startZiel && ist.start === f.start,
      { ist: ist.tage.map(function (x) { return x.ausfuehrung; }), soll: soll });
    ok('signale-R1.json Fenster ' + fn + ': Ersatz zaehlt gleich viele Wechsel', sj.fensterErsatz[fn] === soll.length);
  });
});

console.log(gruen + ' grün, ' + rot + ' rot');
process.exitCode = rot ? 1 : 0;
