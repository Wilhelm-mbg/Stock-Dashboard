'use strict';
/* Auftrag Nr. 89R-2, Paragraph 3: Pruefungen an Kunsttagen. Liest keine Archivdatei.
 * Aufruf: node studien/reel-ausloeser-struktur-2026-10-04/test.js   (--alle zeigt auch die gruenen, --zeigen den Kunstbericht) */
var D = require('../reel-vwap-ema-2026-10-04/daten');
var K1 = require('../reel-vwap-ema-2026-10-04/kern');
var K = require('./kern');

var gruen = 0, rot = 0;
function pruefe(name, ok) {
  if (ok) { gruen++; if (process.argv.indexOf('--alle') >= 0) console.log('gruen: ' + name); } else { rot++; console.log('ROT: ' + name); }
}
function nahe(a, b, tol) { return Math.abs(a - b) <= (tol == null ? 1e-9 : tol); }
function normal(z) { return Math.sqrt(-2 * Math.log(1 - z())) * Math.cos(2 * Math.PI * z()); }
function kerze(m, o, h, l, c, v) { return { m: m, o: o, h: h, l: l, c: c, v: v == null ? 100 : v }; }
/** flacher Tag: Kerzen von 09:30 bis zur Minute ende (ausschliesslich), alle bei kurs. */
function flachTag(datum, kurs, ende) {
  var ks = [];
  for (var m = 570; m < (ende || 960); m++) ks.push(kerze(m, kurs, kurs, kurs, kurs));
  return { datum: datum, kerzen: ks };
}
function setze(tag, m, o, h, l, c) {
  var k = tag.kerzen.filter(function (x) { return x.m === m; })[0];
  k.o = o; k.h = h; k.l = l; k.c = c;
}
function ohne(tag, m) { tag.kerzen = tag.kerzen.filter(function (x) { return x.m !== m; }); }
function index(R, d, m) {
  for (var i = R.tagA[d]; i < R.tagE[d]; i++) if (R.min[i] === m) return i;
  return -1;
}
/** Richtungsreihe mit Ausloesern an (Tag, Minute). */
function signale(R, liste) {
  var s = new Int8Array(R.n);
  liste.forEach(function (x) { s[index(R, x[0], x[1])] = x[2]; });
  return s;
}
var R_STOPP = (-K.STOPP - K.KOSTEN) / K.STOPP;      // -1,0588 R

/* ---------- 1. Konstanten aus 2.6 und 2.7 ---------- */
(function () {
  pruefe('Stopp 0,1666 %, scharf 0,0588 %, Kosten 0,0098 % in Kursbewegung', nahe(K.STOPP, 0.001666, 1e-15) && nahe(K.SCHARF, 0.000588, 1e-15) && nahe(K.KOSTEN, 0.000098, 1e-15));
  pruefe('1 R = 17 % der Praemie: 20 Optionen x 100 x 3,69 $ x 17 % rund 1.250 $', nahe(20 * 100 * 3.69 * 0.17, 1254.6, 1e-9) && nahe(0.0049 * 751, 3.68, 0.01));
  pruefe('Tagesbremse 1.800 $ / 1.250 $ = 1,44 R; Ruckfall 60 %; Pause 5 Minuten; letzter Einstieg 15:44', nahe(1800 / 1250, K.BREMSE_R) && K.RUECKFALL === 0.6 && K.ABKUEHLUNG === 5 && K.MIN_LETZTER_EINSTIEG === 944);
  pruefe('H wie im Auftrag, fuenf Ausloeser, 200 Wiederholungen, Bloecke zu 23', K.H_LISTE.join() === '1,2,3,5,10,15' && K.AUSLOESER.join() === 'A1,A1f,A2,A3,Alle' && K.WIEDERHOLUNGEN === 200 && K.BLOCK === 23);
})();

/* ---------- 2. ATR von Hand, auch ueber die Nacht ---------- */
(function () {
  var a = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7], ks = [];
  a.forEach(function (x, i) { ks.push(kerze(570 + i, 10, 10 + x, 10 - x, 10)); });       // wahre Spanne 2x (Vorschluss 10 liegt innen)
  var R = D.ausTagen([{ datum: '2020-01-02', kerzen: ks }, { datum: '2020-01-03', kerzen: [kerze(570, 20, 20.5, 19.5, 20), kerze(571, 20, 20.2, 19.9, 20)] }]);
  var atr = K.atrReihe(R), tr = a.map(function (x) { return 2 * x; });
  var summe = function (v) { return v.reduce(function (s, x) { return s + x; }, 0); };
  pruefe('ATR vor der 14. Kerze nicht definiert', atr[12] !== atr[12] && atr[13] === atr[13]);
  pruefe('ATR an der 14. Kerze = Mittel der 14 wahren Spannen', nahe(atr[13], summe(tr) / 14, 1e-12));
  /* erste Kerze des zweiten Tages: Vorschluss 10 (ueber Nacht), Hoch 20,5 -> wahre Spanne 10,5 */
  pruefe('ATR ueber die Nacht: wahre Spanne aus dem Vorschluss des Vortags', nahe(atr[14], (summe(tr) - tr[0] + 10.5) / 14, 1e-12));
  pruefe('ATR naechste Kerze: Vorschluss 20 liegt innen, Spanne 0,3', nahe(atr[15], (summe(tr) - tr[0] - tr[1] + 10.5 + 0.3) / 14, 1e-12));
  /* die drei Faelle der wahren Spanne: 12 flache Kerzen (Spanne 0), dann Hoch-Tief, Luecke nach oben, Bereich, Luecke nach unten */
  var ks2 = [];
  for (var i = 0; i < 12; i++) ks2.push(kerze(570 + i, 10, 10, 10, 10));
  ks2.push(kerze(582, 10, 10.5, 9.5, 10));      // 1,0 = Hoch - Tief
  ks2.push(kerze(583, 12, 12.2, 11.9, 12));     // 2,2 = |Hoch - Vorschluss 10|
  ks2.push(kerze(584, 12, 12.1, 9, 9.5));       // 3,1 = Hoch - Tief (|Tief - 12| = 3)
  ks2.push(kerze(585, 5, 5.5, 4.8, 5));         // 4,7 = |Tief - Vorschluss 9,5|
  var at2 = K.atrReihe(D.ausTagen([{ datum: '2020-01-02', kerzen: ks2 }]));
  pruefe('wahre Spanne: groesster der drei Werte (Hoch - Tief, Luecke nach oben, Luecke nach unten)',
    nahe(at2[13], 3.2 / 14, 1e-12) && nahe(at2[14], 6.3 / 14, 1e-12) && nahe(at2[15], 11 / 14, 1e-12));
})();

/* ---------- 3. Die Ausloeser an Kunsttagen von Hand ---------- */
var VORLAUF = 300;      // ein ruhiger Vortag mit 300 Kerzen, damit die Testkerzen hinter der Sperre von 250 liegen
function vorlauf(kurs, steigung, spanne) {
  var ks = [];
  for (var i = 0; i < VORLAUF; i++) { var c = kurs + steigung * i; ks.push(kerze(570 + i, c - steigung, c + spanne, c - spanne, c)); }
  return { datum: '2024-01-02', kerzen: ks };
}
(function () {
  /* A1 mit Gleichheit: der VWAP wird vorgegeben (die Funktion nimmt ihn als Eingang) */
  var tag = { datum: '2024-01-03', kerzen: [] }, c = [10, 10, 11, 11, 10.5, 9, 9, 12, 12], vwT = [10, 10, 10, 10, 10.5, 10, 10, 10, 10];
  c.forEach(function (x, i) { tag.kerzen.push(kerze(570 + i, x, x, x, x)); });
  var R = D.ausTagen([vorlauf(10, 0, 0.01), tag]), vw = new Float64Array(R.n);
  for (var i = 0; i < VORLAUF; i++) vw[i] = 10;
  vwT.forEach(function (x, k) { vw[VORLAUF + k] = x; });
  var A = K.ausloeser(R, vw), a1 = Array.from(A.A1.subarray(VORLAUF));
  pruefe('A1: Gleichstand haelt die Seite, Wechsel nur auf Schluss, erste Seite des Tages kein Ereignis', a1.join() === '0,0,0,0,0,-1,0,1,0');
  var ref = K1.ereignisse(R, K1.zustandR1(R, vw), false, 0, 2), idx = [];
  for (i = 0; i < R.n; i++) if (A.A1[i]) idx.push(i + ':' + A.A1[i]);
  pruefe('A1 ist genau das Ereignis R1 aus Teil 1', idx.join() === ref.map(function (e) { return e.i + ':' + e.richtung; }).join());
  /* letzte Kerze: ein Wechsel dort loest nichts aus */
  var tagL = { datum: '2024-01-03', kerzen: [kerze(570, 11, 11, 11, 11), kerze(571, 11, 11, 11, 11), kerze(572, 9, 9, 9, 9)] };
  var RL = D.ausTagen([tagL]), AL = K.ausloeser(RL, Float64Array.from([10, 10, 10]));
  pruefe('A1: Wechsel an der letzten Kerze des Tages loest nichts aus', AL.A1.join() === '0,0,0');
})();
(function () {
  /* A1f, Filter an: flacher Kurs -> EMA 9 = EMA 21, ATR 0,02 > 0 -> zusammengedrueckt, A1 bleibt, A1f faellt */
  var tag = { datum: '2024-01-03', kerzen: [] };
  for (var k = 0; k < 10; k++) tag.kerzen.push(kerze(570 + k, 100, 100.01, 99.99, 100));
  var R = D.ausTagen([vorlauf(100, 0, 0.01), tag]), vw = new Float64Array(R.n).fill(100);
  vw[VORLAUF + 1] = 99; vw[VORLAUF + 2] = 99; vw[VORLAUF + 3] = 101; vw[VORLAUF + 4] = 101;   // Schluss 100: ueber, ueber, unter, unter
  var A = K.ausloeser(R, vw);
  pruefe('A1f Filter an: A1 meldet das Kreuz, A1f nicht (EMA 9 = EMA 21)', A.A1[VORLAUF + 3] === -1 && A.A1f[VORLAUF + 3] === 0 && A.zaehlung.A1gefiltert === 1);
  /* A1f, Filter aus: steter Anstieg 0,05 je Kerze -> EMA 9 - EMA 21 = 6 x 0,05 = 0,30, ATR = 0,06 -> 0,30 > 0,03 */
  var tag2 = { datum: '2024-01-03', kerzen: [] }, basis = 100 + 0.05 * (VORLAUF - 1);
  for (k = 0; k < 10; k++) { var c = basis + 0.05 * (k + 1); tag2.kerzen.push(kerze(570 + k, c - 0.05, c + 0.01, c - 0.01, c)); }
  var R2 = D.ausTagen([vorlauf(100, 0.05, 0.01), tag2]), vw2 = new Float64Array(R2.n);
  for (k = 0; k < R2.n; k++) vw2[k] = R2.c[k] - 1;                // Schluss ueber dem VWAP ...
  vw2[VORLAUF + 4] = R2.c[VORLAUF + 4] + 1;                         // ... an Kerze 4 darunter, an Kerze 5 wieder darueber
  var A2 = K.ausloeser(R2, vw2), e9 = K1.ema(R2.c, 9), e21 = K1.ema(R2.c, 21), atr = K.atrReihe(R2), j = VORLAUF + 4;
  pruefe('A1f Filter aus: Abstand der EMA (' + Math.abs(e9[j] - e21[j]).toFixed(3) + ') ueber 0,5 x ATR (' + (0.5 * atr[j]).toFixed(3) + '), A1f = A1',
    nahe(Math.abs(e9[j] - e21[j]), 0.3, 1e-6) && nahe(atr[j], 0.06, 1e-9) && A2.A1[j] === -1 && A2.A1f[j] === -1 && A2.A1[j + 1] === 1 && A2.A1f[j + 1] === 1);
  /* Grenze genau: Abstand = 0,5 x ATR ist nicht zusammengedrueckt; knapp darunter schon */
  pruefe('A1f Grenze: Abstand genau 0,5 x ATR -> nicht zusammengedrueckt (auch mit Rundungsrest)',
    !K.zusammengedrueckt(100.1, 100, 0.2, 100) && !K.zusammengedrueckt(100, 100.1, 0.2, 100) && K.zusammengedrueckt(100.1, 100, 0.2001, 100) && !K.zusammengedrueckt(100.1, 100, 0.1999, 100));
  pruefe('A1f Grenze: ATR null -> nie zusammengedrueckt; Abstand null bei ATR > 0 -> zusammengedrueckt', !K.zusammengedrueckt(100, 100, 0, 100) && K.zusammengedrueckt(100, 100, 0.01, 100));
  /* Sperre: ein A1 in den ersten 250 Kerzen des Archivs ist kein A1f */
  var vw3 = new Float64Array(R2.n);
  for (k = 0; k < R2.n; k++) vw3[k] = R2.c[k] - 1;
  vw3[100] = R2.c[100] + 1;
  var A3 = K.ausloeser(R2, vw3);
  pruefe('Sperre: A1 an Kerze 101 des Archivs, A1f dort nicht', A3.A1[100] === -1 && A3.A1f[100] === 0 && A3.zaehlung.A1inSperre === 2);
})();
(function () {
  /* A2: Vorlauf konstant 100 (Seite gleich, also noch keine Seite) */
  var t1 = { datum: '2024-01-03', kerzen: [] }, cs = [100, 101, 101, 99, 99, 100.5];
  cs.forEach(function (x, k) { t1.kerzen.push(kerze(570 + k, x, x, x, x)); });
  var t2 = { datum: '2024-01-04', kerzen: [kerze(570, 104, 104, 104, 104), kerze(571, 104, 104, 104, 104), kerze(572, 90, 90, 90, 90)] };
  var R = D.ausTagen([vorlauf(100, 0, 0), t1, t2]), vw = new Float64Array(R.n).fill(NaN);
  /* Tag 1 endet mit 100,5 ueber der EMA 50; Tag 2 der letzten Kerze: 90 darunter (letzte Kerze - kein Ausloeser) */
  var A = K.ausloeser(R, vw), a2 = Array.from(A.A2.subarray(VORLAUF));
  /* 100: gleich (keine Seite); 101: erste Seite (+1, kein Wechsel); 101; 99: unter EMA ~100,08 -> -1; 99; 100,5 -> +1 (letzte Kerze des Tages: kein Ausloeser!) */
  pruefe('A2: erste Seite kein Wechsel, Kreuz nach unten -> Put, Kreuz an der letzten Kerze -> nichts', a2.slice(0, 6).join() === '0,0,0,-1,0,0');
  /* Tag 2: die Seite war schon am Vorabend +1 geworden (an der letzten Kerze), also kein Ausloeser an der ersten Kerze; 90 an der letzten Kerze: nichts */
  pruefe('A2: der an der letzten Kerze verpasste Wechsel wird am Morgen nicht nachgeholt', a2.slice(6).join() === '0,0,0');
  /* Eroeffnungsluecke ueber die EMA: Tag 1 endet unter der EMA, Tag 2 beginnt weit darueber -> Call an der ersten Kerze */
  var u1 = { datum: '2024-01-03', kerzen: [kerze(570, 101, 101, 101, 101), kerze(571, 101, 101, 101, 101), kerze(572, 98, 98, 98, 98), kerze(573, 98, 98, 98, 98)] };
  var u2 = { datum: '2024-01-04', kerzen: [kerze(570, 105, 105, 105, 105), kerze(571, 105, 105, 105, 105)] };
  var Ru = D.ausTagen([vorlauf(100, 0, 0), u1, u2]), Au = K.ausloeser(Ru, new Float64Array(Ru.n).fill(NaN));
  pruefe('A2: Eroeffnungsluecke ueber die EMA 50 loest an der ersten Kerze des Tages aus (Call)', Array.from(Au.A2.subarray(VORLAUF)).join() === '0,0,-1,0,1,0');
  /* Gleichstand haelt die Seite: Schluss = EMA 50 der Vorkerze -> EMA bleibt, Schluss gleich EMA */
  var e50 = K1.ema(Ru.c, 50), g1 = { datum: '2024-01-03', kerzen: [kerze(570, 101, 101, 101, 101), kerze(571, 101, 101, 101, 101)] };
  var Rg0 = D.ausTagen([vorlauf(100, 0, 0), g1]), e = K1.ema(Rg0.c, 50)[Rg0.n - 1];
  g1.kerzen.push(kerze(572, e, e, e, e), kerze(573, 102, 102, 102, 102), kerze(574, 102, 102, 102, 102));
  var Rg = D.ausTagen([vorlauf(100, 0, 0), g1]), Ag = K.ausloeser(Rg, new Float64Array(Rg.n).fill(NaN));
  pruefe('A2: Gleichstand mit der EMA 50 haelt die Seite (kein Ausloeser, auch danach nicht)', K1.seite(Rg.c[VORLAUF + 2], K1.ema(Rg.c, 50)[VORLAUF + 2]) === 0 &&
    Array.from(Ag.A2.subarray(VORLAUF)).join() === '0,0,0,0,0' && e50.length === Ru.n);
  /* Sperre: Wechsel in den ersten 250 Kerzen loest nicht aus */
  var sp = [];
  for (var k = 0; k < 280; k++) sp.push(kerze(570 + k, 0, 0, 0, k < 100 ? 100 : (k < 150 ? 102 : (k < 200 ? 98 : (k < 260 ? 103 : 96)))));
  sp.forEach(function (x) { x.o = x.h = x.l = x.c; });
  var Rs = D.ausTagen([{ datum: '2024-01-02', kerzen: sp }]), As = K.ausloeser(Rs, new Float64Array(Rs.n).fill(NaN)), vorher = 0;
  for (k = 0; k < 250; k++) if (As.A2[k]) vorher++;
  pruefe('A2: in den ersten 250 Kerzen kein Ausloeser, danach schon (Kerze 261: Put)', vorher === 0 && As.A2[260] === -1);
})();
(function () {
  /* A3: Spanne 09:30 bis 09:44, die Minute 09:37 fehlt (ihr Hoch 105 zaehlt also nicht) */
  var tag = flachTag('2024-01-03', 100, 620);
  setze(tag, 573, 100, 100.2, 99, 100);      // 09:33 Tief 99
  setze(tag, 577, 100, 105, 100, 100);       // 09:37 - wird entfernt
  setze(tag, 580, 100, 101, 100, 100.5);     // 09:40 Hoch 101
  setze(tag, 584, 100.5, 101.5, 100.5, 101.4); // 09:44: Schluss ueber 101, gehoert aber zur Spanne (Hoch 101,5)
  ohne(tag, 577);
  setze(tag, 585, 101.4, 101.5, 101.4, 101.5);   // Schluss genau gleich dem Hoch 101,5: kein Ausbruch
  setze(tag, 586, 101.5, 101.7, 101.5, 101.6);   // erster Schluss darueber -> Call
  setze(tag, 590, 101.6, 102, 101.6, 101.9);     // noch einmal darueber -> nichts
  setze(tag, 595, 99.5, 99.5, 98.8, 98.9);       // erster Schluss unter 99 -> Put
  setze(tag, 600, 98.9, 98.9, 98, 98.5);         // noch einmal darunter -> nichts
  var R = D.ausTagen([tag]), A = K.ausloeser(R, new Float64Array(R.n).fill(NaN)), treffer = [];
  for (var i = 0; i < R.n; i++) if (A.A3[i]) treffer.push(R.min[i] + ':' + A.A3[i]);
  pruefe('A3: erster Ausbruch je Seite, Gleichheit mit dem Hoch zaehlt nicht, fehlende Minute zaehlt nicht zur Spanne (' + treffer.join(' ') + ')', treffer.join() === '586:1,595:-1');
  /* dieselbe Spanne mit der Kerze 09:37 (Hoch 105): dann kein Call */
  var tag2 = flachTag('2024-01-03', 100, 620);
  setze(tag2, 573, 100, 100.2, 99, 100); setze(tag2, 577, 100, 105, 100, 100); setze(tag2, 586, 101.5, 101.7, 101.5, 101.6); setze(tag2, 595, 99.5, 99.5, 98.8, 98.9);
  var R2 = D.ausTagen([tag2]), A2 = K.ausloeser(R2, new Float64Array(R2.n).fill(NaN)), t2 = [];
  for (i = 0; i < R2.n; i++) if (A2.A3[i]) t2.push(R2.min[i] + ':' + A2.A3[i]);
  pruefe('A3: Spanne ueber die Tagesminute bestimmt (mit 09:37 kein Call)', t2.join() === '595:-1');
  /* Tag ohne Kerze zwischen 09:30 und 09:44: kein A3 */
  var tag3 = flachTag('2024-01-03', 100, 620);
  tag3.kerzen = tag3.kerzen.filter(function (x) { return x.m >= 585; });
  setze(tag3, 590, 100, 103, 100, 103);
  var A3 = K.ausloeser(D.ausTagen([tag3]), new Float64Array(tag3.kerzen.length).fill(NaN));
  pruefe('A3: ohne Kerze in den ersten 15 Minuten kein Ausloeser', A3.zaehlung.A3 === 0 && A3.zaehlung.tageOhneSpanne === 1);
  /* Ausbruch an der letzten Kerze des Tages: nichts */
  var tag4 = flachTag('2024-01-03', 100, 600);
  setze(tag4, 599, 100, 103, 100, 103);
  var A4 = K.ausloeser(D.ausTagen([tag4]), new Float64Array(30).fill(NaN));
  pruefe('A3: Ausbruch an der letzten Kerze loest nichts aus', A4.zaehlung.A3 === 0);
})();
(function () {
  /* "Alle": doppelt zaehlt einmal, Widerspruch entfaellt */
  var A1f = Int8Array.from([1, 1, 0, -1, 0, 1, 0]), A2 = Int8Array.from([1, 0, -1, -1, 0, -1, 0]), A3 = Int8Array.from([0, 0, 1, -1, -1, 1, 0]);
  var Alle = new Int8Array(7).fill(5), z = { Alle: 0, doppelt: 0, widerspruch: 0 };
  K.kombiniere(A1f, A2, A3, Alle, z);
  pruefe('Alle: doppelt einmal, dreifach einmal, Widerspruch entfaellt (' + Array.from(Alle).join() + ')', Array.from(Alle).join() === '1,1,0,-1,-1,0,0' && z.Alle === 4 && z.doppelt === 2 && z.widerspruch === 2);
})();

/* ---------- 4. Ereignis-Sicht gegen die Funktion aus Teil 1 ---------- */
function zufallsTage(saat, tage, ersteDatum, mu, docht) {
  var z = K.zufall(saat), liste = [], kurs = 400, regime = 1;
  for (var d = 0; d < tage; d++) {
    var ks = [];
    for (var i = 0; i < 390; i++) {
      if (z() < 1 / 30) regime = -regime;
      var o = kurs, p = o, hi = o, lo = o, schritte = docht === true ? 4 : (docht || 1);   // Teilschritte je Minute (Kursweg in der Kerze)
      for (var s = 0; s < schritte; s++) {
        p = p * (1 + (regime * (mu || 0) / schritte + 2 * normal(z) / Math.sqrt(schritte)) / 10000);
        if (p > hi) hi = p;
        if (p < lo) lo = p;
      }
      ks.push(kerze(570 + i, o, hi, lo, p, 100 + Math.floor(900 * z())));
      kurs = p;
    }
    var monat = 1 + Math.floor(d / 25), tagNr = 1 + d % 25;
    liste.push({ datum: ersteDatum.slice(0, 5) + (monat < 10 ? '0' : '') + monat + '-' + (tagNr < 10 ? '0' : '') + tagNr, kerzen: ks });
  }
  return D.ausTagen(liste);
}
(function () {
  var R = zufallsTage(8921, 20, '2024-01-01', 0, true), vw = K1.vwapReihe(R), A = K.ausloeser(R, vw), nT = R.tagA.length;
  var ref = K1.ereignisse(R, K1.zustandR1(R, vw), false, 0, nT), eig = K.liste(R, A.A1, 0, nT);
  pruefe('Ereignis-Sicht: A1 trifft Ereignis R1 aus Teil 1 (' + eig.length + ' Ereignisse)', eig.length === ref.length && eig.length > 100 && JSON.stringify(eig) === JSON.stringify(ref));
  [5, 15].forEach(function (H) {
    var vor = K1.vorwaerts(R, H), ktr = K1.kontrolle(R, vor), a = K1.ereignisSicht(R, eig, vor, ktr), b = K1.ereignisSicht(R, ref, vor, ktr);
    pruefe('Ereignis-Sicht H = ' + H + ': gleiche Zahl und gleiches Mittel wie Teil 1', a.n === b.n && a.mittelBp === b.mittelBp && a.seBp === b.seBp);
  });
  var v1 = K1.vorwaerts(R, 1);
  pruefe('H = 1: Eroeffnung der naechsten Kerze bis Eroeffnung der uebernaechsten', nahe(v1[10], R.o[11] / R.o[10] - 1, 1e-15) && v1[389] !== v1[389]);
  var A2 = K.ausloeser(R, vw), lis = K.liste(R, A2.Alle, 3, 7);
  pruefe('Ereignisliste: nur Tage des Fensters, Richtung und Tag stimmen', lis.length > 0 && lis.every(function (e) { return e.tag >= 3 && e.tag < 7 && R.tagA[e.tag] <= e.i && e.i < R.tagE[e.tag] && e.richtung === A2.Alle[e.i]; }));
})();

/* ---------- 5. Struktur: der Bot an Kunsttagen von Hand ---------- */
function einBot(tag, sigListe, opt) {
  var R = D.ausTagen([tag]), prot = [];
  opt = opt || {};
  opt.protokoll = prot;
  var S = K.bot(R, signale(R, sigListe.map(function (x) { return [0, x[0], x[1]]; })), 0, 1, opt);
  return { R: R, S: S, prot: prot };
}
(function () {
  var r = function (g) { return (g - K.KOSTEN) / K.STOPP; };
  /* Stopp in der Einstiegskerze */
  var t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.02, 99.8, 99.9);
  var b = einBot(t, [[600, 1]]);
  pruefe('Stopp: Ausstieg zum Stoppkurs, -1 R vor Kosten (' + b.prot[0].r.toFixed(4) + ' R)', b.prot.length === 1 && b.prot[0].art === 'stopp' && nahe(b.prot[0].r, R_STOPP, 1e-12) && b.R.min[b.prot[0].iEin] === 601 && b.R.min[b.prot[0].iAus] === 601);
  pruefe('Stopp: Einstieg zur Eroeffnung der naechsten Kerze nach dem Ausloeser', b.prot[0].preis === 100 && b.S.einstiege === 1 && b.S.ausloeser === 1);
  /* Stopp: Eroeffnung schon dahinter -> zur Eroeffnung */
  t = flachTag('2024-03-01', 100); setze(t, 602, 99.7, 99.75, 99.6, 99.7);
  b = einBot(t, [[600, 1]]);
  pruefe('Stopp mit Luecke: Ausstieg zur Eroeffnung', b.prot[0].art === 'stopp' && nahe(b.prot[0].g, -0.003, 1e-12) && nahe(b.prot[0].r, r(-0.003), 1e-9));
  /* Grenze genau am Stopp */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100, 99.8334, 100);
  b = einBot(t, [[600, 1]]);
  var t2 = flachTag('2024-03-01', 100); setze(t2, 601, 100, 100, 99.8335, 100);
  var b2 = einBot(t2, [[600, 1]]);
  pruefe('Stopp genau an der Marke ("bei oder unter") greift, knapp davor nicht', b.prot[0].art === 'stopp' && nahe(b.prot[0].r, R_STOPP, 1e-9) && b2.prot[0].art === 'tagesende' && nahe(b2.prot[0].r, r(0), 1e-12));
  /* Put: Stopp am Hoch */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.2, 99.9, 100.1);
  b = einBot(t, [[600, -1]]);
  pruefe('Put: Stopp am Hoch', b.prot[0].art === 'stopp' && b.prot[0].richtung === -1 && nahe(b.prot[0].r, R_STOPP, 1e-12));
  /* Gewinnsicherung: scharf in Kerze 601, Rueckfall in Kerze 602 */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.10, 99.99, 100.08); setze(t, 602, 100.07, 100.07, 100.05, 100.06);
  b = einBot(t, [[600, 1]]);
  pruefe('Sicherung: scharf, Rueckfall in einer spaeteren Kerze, Ausstieg zur Marke 0,6 x M', b.prot[0].art === 'sicherung' && b.R.min[b.prot[0].iAus] === 602 && nahe(b.prot[0].g, 0.0006, 1e-12) && nahe(b.prot[0].r, r(0.0006), 1e-9));
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.10, 99.99, 100.08); setze(t, 602, 100.03, 100.04, 100.02, 100.03);
  b = einBot(t, [[600, 1]]);
  pruefe('Sicherung: Eroeffnung schon unter der Marke -> zur Eroeffnung', b.prot[0].art === 'sicherung' && nahe(b.prot[0].g, 0.0003, 1e-12));
  /* Hoechststand steigt weiter */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.10, 99.99, 100.08); setze(t, 602, 100.08, 100.20, 100.15, 100.18); setze(t, 603, 100.18, 100.18, 100.11, 100.12);
  b = einBot(t, [[600, 1]]);
  pruefe('Sicherung: Hoechststand steigt mit (Marke 0,6 x 0,2 % = 0,12 %)', b.prot[0].art === 'sicherung' && b.R.min[b.prot[0].iAus] === 603 && nahe(b.prot[0].g, 0.0012, 1e-12));
  /* Rueckfall in derselben Kerze (Einstiegskerze) */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.10, 99.99, 100.05);
  b = einBot(t, [[600, 1]]);
  pruefe('Sicherung: Rueckfall in derselben Kerze, die den Hoechststand setzt', b.prot[0].art === 'sicherung' && b.R.min[b.prot[0].iAus] === 601 && nahe(b.prot[0].g, 0.0006, 1e-12));
  /* nicht scharf: Hoch +0,05 % < 0,0588 % */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.05, 99.99, 100.01);
  b = einBot(t, [[600, 1]]);
  pruefe('Sicherung nicht scharf unter +0,0588 %: kein Ausstieg, Tagesende zum Schluss', b.prot[0].art === 'tagesende' && b.R.min[b.prot[0].iAus] === 959 && nahe(b.prot[0].g, 0, 1e-15));
  /* scharf genau an der Schwelle */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.0588, 99.99, 100.03);
  b = einBot(t, [[600, 1]]);
  t2 = flachTag('2024-03-01', 100); setze(t2, 601, 100, 100.0587, 99.99, 100.03);
  b2 = einBot(t2, [[600, 1]]);
  pruefe('Sicherung scharf genau bei +0,0588 %, knapp darunter nicht', b.prot[0].art === 'sicherung' && nahe(b.prot[0].g, 0.6 * 0.000588, 1e-12) && b2.prot[0].art === 'tagesende');
  /* Rueckfall genau auf 0,6 x M (Schluss) */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.10, 99.99, 100.06);
  b = einBot(t, [[600, 1]]);
  pruefe('Sicherung: Schluss genau auf 0,6 x M ("bei oder unter") greift', b.prot[0].art === 'sicherung' && b.R.min[b.prot[0].iAus] === 601);
  /* ungunstiger Fall zuerst: Kerze erreicht Stopp und neuen Hoechststand / Marke */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.10, 99.99, 100.08); setze(t, 602, 100.08, 100.30, 99.80, 100.10);
  b = einBot(t, [[600, 1]]);
  t2 = flachTag('2024-03-01', 100); setze(t2, 601, 100, 100.30, 99.80, 100.2);
  b2 = einBot(t2, [[600, 1]]);
  pruefe('ungunstiger Fall zuerst: Stopp vor Sicherung, auch wenn die Kerze vorher hoch lief', b.prot[0].art === 'stopp' && nahe(b.prot[0].r, R_STOPP, 1e-12) && b2.prot[0].art === 'stopp');
  /* Tagesende */
  t = flachTag('2024-03-01', 100); setze(t, 959, 100, 100.04, 100, 100.04);
  b = einBot(t, [[600, 1]]);
  pruefe('Tagesende: Ausstieg zum Schluss der letzten Kerze', b.prot[0].art === 'tagesende' && nahe(b.prot[0].g, 0.0004, 1e-12) && b.R.min[b.prot[0].iAus] === 959);
  /* Abkuehlzeit: Ausstieg in Kerze 601; Einstieg 605 (4 Minuten) verfaellt, 606 (5 Minuten) gilt */
  t = flachTag('2024-03-01', 100); setze(t, 601, 100, 100.02, 99.8, 99.9);
  b = einBot(t, [[600, 1], [604, 1]]);
  b2 = einBot(t, [[600, 1], [605, 1]]);
  pruefe('Abkuehlzeit: 4 Minuten nach dem Ausstieg verfaellt der Ausloeser, nach 5 Minuten nicht',
    b.S.einstiege === 1 && b.S.verfallen.abkuehlung === 1 && b2.S.einstiege === 2 && b2.R.min[b2.prot[1].iEin] === 606);
  /* Abkuehlzeit nach Kerzenbeginn gemessen, mit fehlender Minute: Einstieg zur naechsten vorhandenen Kerze */
  t = flachTag('2024-03-01', 99.9); setze(t, 601, 100, 100.02, 99.8, 99.9); ohne(t, 606);
  t.kerzen.forEach(function (k) { if (k.m < 601) { k.o = k.h = k.l = k.c = 100; } });
  b = einBot(t, [[600, 1], [605, 1]]);
  pruefe('fehlende Minute: Einstieg zur Eroeffnung der naechsten vorhandenen Kerze (06 fehlt -> 07)', b.S.einstiege === 2 && b.R.min[b.prot[1].iEin] === 607);
  /* offene Position: Ausloeser verfaellt */
  t = flachTag('2024-03-01', 100);
  b = einBot(t, [[600, 1], [610, -1], [620, 1]]);
  pruefe('offene Position: weitere Ausloeser verfallen (eine Position je Bot)', b.S.einstiege === 1 && b.S.verfallen.offen === 2 && b.prot.length === 1);
  /* kein Einstieg nach 15:44 */
  t = flachTag('2024-03-01', 100);
  b = einBot(t, [[943, 1]]);
  b2 = einBot(t, [[944, 1]]);
  pruefe('Einstiegskerze 15:44 gilt, 15:45 verfaellt', b.S.einstiege === 1 && b.R.min[b.prot[0].iEin] === 944 && b2.S.einstiege === 0 && b2.S.verfallen.spaet === 1);
  /* letzte Kerze loest nichts aus; verkuerzter Tag: Einstieg in die letzte Kerze, glatt zu ihrem Schluss */
  b = einBot(flachTag('2024-03-01', 100), [[959, 1]]);
  var kurz = flachTag('2024-11-29', 100, 780); setze(kurz, 779, 100, 100.03, 100, 100.02);
  b2 = einBot(kurz, [[778, 1]]);
  pruefe('letzte Kerze loest nichts aus; verkuerzter Tag: Einstieg 12:59, glatt zum Schluss derselben Kerze',
    b.S.ausloeser === 0 && b.S.einstiege === 0 && b2.prot.length === 1 && b2.prot[0].art === 'tagesende' && b2.prot[0].iEin === b2.prot[0].iAus && nahe(b2.prot[0].g, 0.0002, 1e-12));
  /* Tagesbremse: realisiert >= 1,44 R -> kein neuer Einstieg */
  function bremsTag(M) {
    var tg = flachTag('2024-03-01', 100), hoch = 100 * (1 + M);
    setze(tg, 601, 100, hoch, 100, 100 + 100 * 0.9 * M);         // Hoechststand M, Schluss darueber -> laeuft
    setze(tg, 602, 100 + 100 * 0.9 * M, 100 + 100 * 0.9 * M, 100 + 100 * 0.3 * M, 100 + 100 * 0.3 * M);   // Rueckfall -> Ausstieg zur Marke 0,6 x M
    return einBot(tg, [[600, 1], [620, 1]]);
  }
  var genau = (K.BREMSE_R * K.STOPP + K.KOSTEN) / K.RUECKFALL;    // realisiert genau 1,44 R
  b = bremsTag(genau); b2 = bremsTag(genau - 1e-6);
  var b3 = bremsTag(0.005);
  pruefe('Tagesbremse: genau 1,44 R realisiert -> gezogen (' + b.prot[0].r.toFixed(6) + ' R)', nahe(b.prot[0].r, 1.44, 1e-9) && b.S.einstiege === 1 && b.S.verfallen.bremse === 1);
  pruefe('Tagesbremse: knapp darunter (' + b2.prot[0].r.toFixed(4) + ' R) -> nicht gezogen', b2.S.einstiege === 2 && b2.S.verfallen.bremse === 0);
  pruefe('Tagesbremse: ueber 1,44 R gezogen; keine Verlustbremse', b3.S.verfallen.bremse === 1 && b3.prot[0].r > 1.44);
  /* keine Verlustbremse: drei Stopps hintereinander, jeder folgende Ausloeser darf */
  t = flachTag('2024-03-01', 100);
  [601, 611, 621].forEach(function (m) { setze(t, m, 100, 100, 99.8, 100); });
  b = einBot(t, [[600, 1], [610, 1], [620, 1]]);
  pruefe('keine Verlustbremse: nach -3,2 R weitere Einstiege', b.S.einstiege === 3 && b.prot.every(function (p) { return p.art === 'stopp'; }));
  /* Bremse gilt je Tag: am naechsten Tag wieder frei */
  var tA = flachTag('2024-03-01', 100), tB = flachTag('2024-03-04', 100);
  setze(tA, 601, 100, 100.5, 100, 100.45); setze(tA, 602, 100.45, 100.45, 100.2, 100.25);
  var R2 = D.ausTagen([tA, tB]), S2 = K.bot(R2, signale(R2, [[0, 600, 1], [0, 620, 1], [1, 600, 1]]), 0, 2);
  pruefe('Tagesbremse und Abkuehlzeit gelten je Tag', S2.einstiege === 2 && S2.verfallen.bremse === 1 && S2.tagTrades[0] === 1 && S2.tagTrades[1] === 1);
  /* Gewinner und gruener Tag an der Grenze null: Brutto = Kosten -> Netto null -> kein Gewinner */
  t = flachTag('2024-03-01', 100); setze(t, 959, 100, 100.0098, 100, 100.0098);
  b = einBot(t, [[600, 1]]);
  t2 = flachTag('2024-03-01', 100); setze(t2, 959, 100, 100.0099, 100, 100.0099);
  b2 = einBot(t2, [[600, 1]]);
  var kzN = K.kennzahlen(b.S, [2024]), kzP = K.kennzahlen(b2.S, [2024]);
  pruefe('Grenze null: Netto genau null ist kein Gewinner und kein gruener Tag', b.S.gewinner === 0 && b.S.verlierer === 1 && kzN.anteilGruen === 0 && b2.S.gewinner === 1 && kzP.anteilGruen === 1);
  /* Z1: Richtung je Einstieg gewuerfelt */
  var viele = [], tz = flachTag('2024-03-01', 100);
  for (var m = 600; m < 940; m += 10) { viele.push([m, 1]); setze(tz, m + 1, 100, 100.3, 99.7, 100); }   // jede Einstiegskerze stoppt beide Richtungen
  var bz = einBot(tz, viele, { zufall: K.zufall(5) });
  var bf = einBot(tz, viele);
  pruefe('Z1: gleiche Zeitpunkte, Richtung gewuerfelt (Calls ' + bz.S.calls + ' von ' + bz.S.einstiege + ')',
    bf.S.calls === bf.S.einstiege && bz.S.calls > 0 && bz.S.calls < bz.S.einstiege && bz.S.ausloeser === bf.S.ausloeser);
})();

/* ---------- 6. Kennzahlen von Hand ---------- */
(function () {
  var st = K.STOPP;
  var S = {
    tagSumme: Float64Array.from([2 * st, 0, -1 * st, 0.5 * st, 0]), tagTrades: Int32Array.from([1, 0, 2, 1, 2]), trades: 6, gewinner: 3, summeGewinnR: 4,
    verlierer: 3, summeVerlustR: -2.5, summeR: 1.5, rueckschlagR: 1.2, calls: 4, arten: {}, ausloeser: 10, einstiege: 6, verfallen: {}
  };
  var kz = K.kennzahlen(S, [2024, 2024, 2025, 2025, 2025]);
  pruefe('Kennzahlen: Trades je Tag ueber alle Tage, Trefferquote, mittlerer Gewinn und Verlust', kz.tage === 5 && kz.tageMitTrade === 4 && nahe(kz.tradesJeTag, 1.2) &&
    kz.trefferquote === 0.5 && nahe(kz.mittlererGewinnR, 4 / 3) && nahe(kz.mittlererVerlustR, -2.5 / 3));
  pruefe('Kennzahlen: R je Trade, R je Tag, Summe', nahe(kz.rJeTrade, 0.25) && nahe(kz.rJeTag, 0.3) && nahe(kz.summeR, 1.5));
  var se = Math.sqrt(4 / 3 * (1.75 * 1.75 + 1.5 * 1.5 + 0.25 * 0.25 + 0.5 * 0.5)) / 6;
  pruefe('Kennzahlen: Standardfehler ueber Tage gebuendelt, von Hand', nahe(kz.seR, se, 1e-9) && nahe(kz.t, 0.25 / se, 1e-9));
  pruefe('Kennzahlen: gruene Tage nur unter Tagen mit Trade, Tag mit Summe genau null ist nicht gruen', nahe(kz.anteilGruen, 0.5) && kz.laengsteSerie === 1);
  pruefe('Kennzahlen: schlechtester und bester Tag', nahe(kz.schlechtesterTagR, -1) && nahe(kz.besterTagR, 2));
  pruefe('Kennzahlen: Kalenderjahre', nahe(kz.jahre[2024].summeR, 2) && kz.jahre[2024].trades === 1 && nahe(kz.jahre[2025].summeR, -0.5) && kz.jahre[2025].tageMitTrade === 3 && kz.jahre[2025].gruen === 1);
  /* Serie und 23er-Bloecke: 23 gruen, Tag ohne Trade, 10 gruen, 1 rot, 16 gruen */
  var summe = [], trades = [];
  function tg(g, n) { summe.push(g); trades.push(n); }
  var k;
  for (k = 0; k < 23; k++) tg(st, 1);
  tg(0, 0);
  for (k = 0; k < 10; k++) tg(st, 2);
  tg(-st, 1);
  for (k = 0; k < 16; k++) tg(st, 1);
  var S2 = { tagSumme: Float64Array.from(summe), tagTrades: Int32Array.from(trades), trades: 0, gewinner: 0, summeGewinnR: 0, verlierer: 0, summeVerlustR: 0, summeR: 0, rueckschlagR: 0, calls: 0, arten: {}, ausloeser: 0, einstiege: 0, verfallen: {} };
  var jahre = summe.map(function () { return 2024; }), kz2 = K.kennzahlen(S2, jahre);
  pruefe('Serie: ein Tag ohne Trade unterbricht nichts (laengste Serie 33)', kz2.laengsteSerie === 33 && kz2.tageMitTrade === 50);
  pruefe('23er-Bloecke: zwei ganze Bloecke, einer ganz gruen, der Rest von 4 Tagen entfaellt', kz2.bloecke === 2 && kz2.bloeckeAlleGruen === 1 && kz2.anteilBloeckeGruen === 0.5);
  /* Quantile und Verteilung */
  pruefe('Quantil linear: Median 3, 2,5 % = 1,1, 97,5 % = 4,9 bei 1..5', nahe(K.quantil([1, 2, 3, 4, 5], 0.5), 3) && nahe(K.quantil([1, 2, 3, 4, 5], 0.025), 1.1) && nahe(K.quantil([1, 2, 3, 4, 5], 0.975), 4.9));
  var v = K.verteilung([kz, kz2, kz]);
  pruefe('Verteilung: Median ueber Wiederholungen, NaN ausgelassen', v.wiederholungen === 3 && nahe(v.median.rJeTrade, 0.25) && v.median.laengsteSerie === 1);
  /* Rueckschlag der R-Kurve gegen eine zweite Rechnung aus dem Protokoll */
  var R = zufallsTage(8931, 30, '2024-01-01', 0, true), A = K.ausloeser(R, K1.vwapReihe(R)), prot = [];
  var Sb = K.bot(R, A.Alle, 0, 30, { protokoll: prot }), kurve = 0, gipfel = 0, dd = 0, sum = 0;
  prot.forEach(function (p) { kurve += p.r; sum += p.r; if (kurve > gipfel) gipfel = kurve; if (gipfel - kurve > dd) dd = gipfel - kurve; });
  pruefe('Rueckschlag der R-Kurve (nach jedem Trade, Start 0 als Gipfel) = zweite Rechnung (' + dd.toFixed(2) + ' R, ' + prot.length + ' Trades)',
    prot.length > 50 && nahe(Sb.rueckschlagR, dd, 1e-9) && nahe(Sb.summeR, sum, 1e-9));
  var tagZahl = new Int32Array(30), tagSum = new Float64Array(30);
  prot.forEach(function (p) { tagZahl[p.tag]++; tagSum[p.tag] += p.netto; });
  pruefe('Tagessummen und Tradezahlen = zweite Rechnung aus dem Protokoll', Array.from(tagZahl).join() === Array.from(Sb.tagTrades).join() &&
    Array.from(tagSum).every(function (x, i) { return nahe(x, Sb.tagSumme[i], 1e-15); }));
  pruefe('jeder Trade beginnt nach seinem Ausloeser, Abkuehlzeit und 15:44 eingehalten', prot.every(function (p, i) {
    var vor = i ? prot[i - 1] : null;
    return R.min[p.iEin] <= 944 && A.Alle[p.iEin - 1] !== 0 && p.iAus >= p.iEin && (!vor || vor.tag !== p.tag || R.min[p.iEin] - R.min[vor.iAus] >= 5);
  }));
})();

/* ---------- 7. Saetze und Bonferroni an der Grenze ---------- */
(function () {
  pruefe('Satz Ereignis: Mittel genau 1,0 und t genau 2 -> ueber der Huerde', K.satzEreignis(1.0, 2.0) === 'Richtungsvorteil über der geschätzten Hürde');
  pruefe('Satz Ereignis: Mittel 0,999 bei t 2 -> unter der Huerde', K.satzEreignis(0.999, 2) === 'Richtungsvorteil vorhanden, aber unter der geschätzten Hürde');
  pruefe('Satz Ereignis: t 1,999 -> kein; Mittel genau 0 -> kein; negativ -> kein; NaN -> kein',
    K.satzEreignis(1.5, 1.999) === 'kein Richtungsvorteil' && K.satzEreignis(0, 2.5) === 'kein Richtungsvorteil' && K.satzEreignis(-1, -3) === 'kein Richtungsvorteil' && K.satzEreignis(NaN, NaN) === 'kein Richtungsvorteil');
  pruefe('Satz Struktur: genau auf der 97,5-%-Stelle -> nichts bei; darueber -> etwas bei',
    K.satzStruktur(0.1, 0.1) === 'Die Auslöser tragen gegenüber gewürfelter Richtung nichts bei' && K.satzStruktur(0.1000001, 0.1) === 'Die Auslöser tragen etwas bei' &&
    K.satzStruktur(NaN, 0.1) === 'Die Auslöser tragen gegenüber gewürfelter Richtung nichts bei');
  pruefe('Normalquantil: 0,975 -> 1,95996; 0,5 -> 0; symmetrisch', nahe(K.normalQuantil(0.975), 1.959964, 1e-6) && nahe(K.normalQuantil(0.5), 0, 1e-12) && nahe(K.normalQuantil(0.01), -K.normalQuantil(0.99), 1e-9));
  /* zweite Rechnung: Flaeche der Normaldichte oberhalb der Schwelle per Simpson-Regel = 0,025 / 90 */
  var zb = K.bonferroni(90), n = 20000, hs = (12 - zb) / n, fl = 0;
  var phi = function (x) { return Math.exp(-x * x / 2) / Math.sqrt(2 * Math.PI); };
  for (var k = 0; k <= n; k++) fl += (k === 0 || k === n ? 1 : (k % 2 ? 4 : 2)) * phi(zb + k * hs);
  fl *= hs / 3;
  pruefe('Bonferroni: 1 Zelle 1,96; 90 Zellen ' + zb.toFixed(3) + ' (Flaeche darueber ' + fl.toExponential(4) + ' = 0,025/90)', nahe(K.bonferroni(1), 1.959964, 1e-6) && nahe(fl / (0.025 / 90), 1, 1e-6));
})();

/* ---------- 8. Kein Blick voraus ---------- */
(function () {
  var basis = zufallsTage(8941, 3, '2024-01-01', 0, true);
  var tage = [];
  for (var d = 0; d < 3; d++) {
    var ks = [];
    for (var i = basis.tagA[d]; i < basis.tagE[d]; i++) ks.push(kerze(basis.min[i], basis.o[i], basis.h[i], basis.l[i], basis.c[i], basis.v[i]));
    tage.push({ datum: basis.tagDatum[d], kerzen: ks });
  }
  function lauf(aendernAb) {
    var kopie = tage.map(function (tg) { return { datum: tg.datum, kerzen: tg.kerzen.map(function (k) { return kerze(k.m, k.o, k.h, k.l, k.c, k.v); }) }; });
    if (aendernAb != null) {
      var n = 0, z = K.zufall(aendernAb);
      kopie.forEach(function (tg) {
        tg.kerzen.forEach(function (k) {
          if (n > aendernAb) {
            var f = 1 + 0.003 * (z() - 0.5), c = k.c * f;
            if (n > aendernAb + 1) k.o = k.o * f;               // die Eroeffnung von t+1 bleibt (sie ist der Einstiegskurs)
            k.c = c; k.h = Math.max(k.o, c) * (1 + 0.001 * z()); k.l = Math.min(k.o, c) * (1 - 0.001 * z()); k.v = 50 + Math.floor(5000 * z());
          }
          n++;
        });
      });
    }
    var R = D.ausTagen(kopie), A = K.ausloeser(R, K1.vwapReihe(R)), prot = [];
    K.bot(R, A.Alle, 0, 3, { protokoll: prot });
    return { A: A, prot: prot };
  }
  var ref = lauf(null), gut = true, geprueft = 0, mitEinstieg = 0;
  for (var t = 420; t < 1160; t += 37) {
    var x = lauf(t);
    ['A1', 'A1f', 'A2', 'A3', 'Alle'].forEach(function (a) { if (Array.from(x.A[a].subarray(0, t + 1)).join() !== Array.from(ref.A[a].subarray(0, t + 1)).join()) gut = false; });
    var fertig = function (p) { return p.prot.filter(function (q) { return q.iAus <= t; }).map(function (q) { return JSON.stringify(q); }).join(); };
    var ein = function (p) { return p.prot.filter(function (q) { return q.iEin <= t + 1; }).map(function (q) { return q.iEin + ':' + q.richtung + ':' + q.preis; }).join(); };
    if (fertig(x) !== fertig(ref) || ein(x) !== ein(ref)) gut = false;
    if (ref.prot.some(function (q) { return q.iEin === t + 1; }) || ref.prot.some(function (q) { return q.iEin <= t + 1 && q.iAus > t; })) mitEinstieg++;
    geprueft++;
  }
  pruefe('kein Blick voraus: Aenderung ab Kerze t+1 aendert keine Ausloeser bis t, keinen bis t beendeten Trade, keinen bis t+1 begonnenen Einstieg (' + geprueft + ' Schnitte, ' + mitEinstieg + ' mit offener Position)', gut && mitEinstieg > 3);
})();

/* ---------- 9. Kunstfaelle der Saetze und die Probe gegen erfundenen Ertrag ---------- */
var L = require('./lauf');
function ganzerLauf(saat, mu) {
  var E = { siegel: { commit: 'kunst' }, eichung: { zellen: { h5: { teil2: { n: 1, mittelBp: 0 } }, h15: { teil2: { n: 1, mittelBp: 0 } } } }, daten: {}, ereignisse: [], struktur: [], korrekturen: [] };
  D.WERTE.forEach(function (sym, k) { L.rechneWert(E, sym, zufallsTage(saat + k, 250, '2024-01-01', mu, true), k); });
  return E;
}
(function () {
  var Ep = ganzerLauf(89500, 2);
  var hz = Ep.ereignisse.filter(function (x) { return x.wert === 'QQQ' && x.ausloeser === 'Alle' && x.H === 5 && x.fenster === 'W-Nach'; })[0];
  var sp = Ep.struktur.filter(function (x) { return x.wert === 'QQQ' && x.fenster === 'W-Nach'; })[0];
  pruefe('Kunstreihe mit eingepflanztem Richtungsvorteil: Satz Ereignis-Sicht ueber der Huerde (Mittel ' + hz.mittelBp.toFixed(2) + ' Bp, t ' + hz.t.toFixed(1) + ')',
    K.satzEreignis(hz.mittelBp, hz.t) === 'Richtungsvorteil über der geschätzten Hürde');
  pruefe('Kunstreihe mit eingepflanztem Richtungsvorteil: Die Ausloeser tragen etwas bei (Bot ' + sp.bot.rJeTrade.toFixed(3) + ' R gegen Z1 97,5 % ' + sp.z1.q975.rJeTrade.toFixed(3) + ' R)',
    sp.satz === 'Die Auslöser tragen etwas bei');
  /* eingepflanzter Effekt in der Groessenordnung der Huerde (Fehlerform 03.10.2026: das Tor muss am erwarteten Fall erreichbar sein) */
  var Em = ganzerLauf(89550, 0.5);
  var hm = Em.ereignisse.filter(function (x) { return x.wert === 'QQQ' && x.ausloeser === 'Alle' && x.H === 5 && x.fenster === 'W-Nach'; })[0];
  var sm = Em.struktur.filter(function (x) { return x.wert === 'QQQ' && x.fenster === 'W-Nach'; })[0];
  pruefe('kleiner eingepflanzter Effekt unter der Huerde: Satz "vorhanden, aber unter der Huerde" (Mittel ' + hm.mittelBp.toFixed(2) + ' Bp, Standardfehler ' + hm.seBp.toFixed(2) + ', t ' + hm.t.toFixed(1) + ')',
    hm.mittelBp < 1 && K.satzEreignis(hm.mittelBp, hm.t) === 'Richtungsvorteil vorhanden, aber unter der geschätzten Hürde');
  var Eh = ganzerLauf(89560, 1.2);
  var hh = Eh.ereignisse.filter(function (x) { return x.wert === 'QQQ' && x.ausloeser === 'Alle' && x.H === 5 && x.fenster === 'W-Nach'; })[0];
  pruefe('eingepflanzter Effekt knapp ueber der Huerde: Satz "ueber der geschaetzten Huerde" erreichbar (Mittel ' + hh.mittelBp.toFixed(2) + ' Bp, Standardfehler ' + hh.seBp.toFixed(2) + ', t ' + hh.t.toFixed(1) + ')',
    hh.mittelBp < 3 && K.satzEreignis(hh.mittelBp, hh.t) === 'Richtungsvorteil über der geschätzten Hürde');
  pruefe('kleiner eingepflanzter Effekt: Struktur-Satz erreichbar (Bot ' + sm.bot.rJeTrade.toFixed(3) + ' R gegen Z1 97,5 % ' + sm.z1.q975.rJeTrade.toFixed(3) + ' R, Median ' + sm.z1.median.rJeTrade.toFixed(3) + ')',
    sm.satz === 'Die Auslöser tragen etwas bei');
  var Ez = ganzerLauf(89600, 0);
  var hz0 = Ez.ereignisse.filter(function (x) { return x.wert === 'QQQ' && x.ausloeser === 'Alle' && x.H === 5 && x.fenster === 'W-Nach'; })[0];
  var sz = Ez.struktur.filter(function (x) { return x.wert === 'QQQ' && x.fenster === 'W-Nach'; })[0];
  pruefe('Zufallsreihe: kein Richtungsvorteil (Mittel ' + hz0.mittelBp.toFixed(2) + ' Bp, t ' + hz0.t.toFixed(1) + ')', K.satzEreignis(hz0.mittelBp, hz0.t) === 'kein Richtungsvorteil');
  pruefe('Zufallsreihe: Die Ausloeser tragen nichts bei (Bot ' + sz.bot.rJeTrade.toFixed(3) + ' R gegen Z1 97,5 % ' + sz.z1.q975.rJeTrade.toFixed(3) + ' R)',
    sz.satz === 'Die Auslöser tragen gegenüber gewürfelter Richtung nichts bei');
  pruefe('Z2: im Mittel so viele Ausloeser je Tag wie "Alle" (' + sz.z2.mittlereAusloeserJeTag.toFixed(2) + ' gegen ' + sz.alleJeTag.toFixed(2) + ')', nahe(sz.z2.mittlereAusloeserJeTag / sz.alleJeTag, 1, 0.02));
  pruefe('Z1: die Kontrolle hat die Ausloeser-Zeitpunkte des Bots', sz.z1.median.ausloeser === sz.bot.ausloeser && sz.z1.q025.ausloeser === sz.bot.ausloeser);
  pruefe('Zufallsreihe mit Kosten: Bot und Kontrollen verlieren (Bot ' + sz.bot.rJeTrade.toFixed(3) + ', Z1 ' + sz.z1.median.rJeTrade.toFixed(3) + ', Z2 ' + sz.z2.median.rJeTrade.toFixed(3) + ' R)',
    sz.z1.median.rJeTrade < 0 && sz.z2.median.rJeTrade < 0);
  /* Probe: die Ausstiegslogik erfindet keinen Ertrag. Zufallsreihe mit feinem Kursweg in der Kerze (60 Teilschritte je Minute, wie Ticks):
   * ohne Kosten nicht von null zu unterscheiden. Dazu die bekannte Eigenschaft der Fuellung genau an der Marke (Befund vor dem Siegel,
   * REGEL.md Teil C): bei dochtlosen Kerzen (der Kurs springt in der Minute gerade von der Eroeffnung zum Schluss) gewinnt sie den
   * Ueberschuss ueber die Marke - das ist das falsche Nullmodell, die Pruefung haelt nur fest, dass die Eigenschaft besteht. */
  var Rf = zufallsTage(89700, 250, '2024-01-01', 0, 60), Af = K.ausloeser(Rf, K1.vwapReihe(Rf));
  var kf = K.kennzahlen(K.bot(Rf, Af.Alle, 0, 250, { kosten: 0 }), Rf.tagJahr);
  var kfz = K.kennzahlen(K.bot(Rf, Af.Alle, 0, 250, { kosten: 0, zufall: K.zufall(3) }), Rf.tagJahr);
  pruefe('Zufallsreihe mit feinem Kursweg (60 Teilschritte), ohne Kosten: R je Trade nicht von null verschieden (' + kf.rJeTrade.toFixed(4) + ' R, t ' + kf.t.toFixed(2) +
    '; gewuerfelt ' + kfz.rJeTrade.toFixed(4) + ' R, t ' + kfz.t.toFixed(2) + '; ' + kf.trades + ' Trades)', Math.abs(kf.t) < 2 && Math.abs(kfz.t) < 2);
  var R1 = zufallsTage(89700, 250, '2024-01-01', 0, 1), A1 = K.ausloeser(R1, K1.vwapReihe(R1));
  var k1 = K.kennzahlen(K.bot(R1, A1.Alle, 0, 250, { kosten: 0 }), R1.tagJahr);
  pruefe('bekannte Eigenschaft: dochtlose Kerzen -> Fuellung an der Marke nimmt den Ueberschuss mit (' + k1.rJeTrade.toFixed(4) + ' R, t ' + k1.t.toFixed(2) + ')', k1.rJeTrade > 0 && k1.t > 2);
  /* der ganze Lauf: Zellen und Bericht */
  pruefe('ganzer Lauf: 3 Werte x 5 Ausloeser x 6 H = 90 Zellen im Urteilsfenster, 3 Struktur-Zeilen', Ez.ereignisse.filter(function (x) { return x.fenster === 'W-Nach'; }).length === 90 && Ez.struktur.length === 3);
  var text = L.bericht(Ez), zeilen = text.split('\n');
  pruefe('Bericht: erste Zeile Satz der Ereignis-Sicht, zweite (nach Leerzeile) Satz der Struktur-Sicht mit drei beschreibenden Zeilen',
    zeilen[0].indexOf('**Ereignis-Sicht: kein Richtungsvorteil**') === 0 && zeilen[2].indexOf('**Struktur-Sicht: Die Auslöser tragen') === 0 &&
    zeilen[2].indexOf('Bot: ') > 0 && zeilen[2].indexOf('Zufallsrichtung: ') > 0 && zeilen[2].indexOf('Zufallszeit: ') > 0 && zeilen[2].indexOf('23 grüne Tage in Folge in ') > 0);
  pruefe('Bericht: zwei Tabellen (5 Ausloeser-Zeilen, 9 Struktur-Zeilen)', (text.match(/^\| A[123f]* |^\| Alle /gm) || []).length === 5 && (text.match(/^\| (QQQ|SPY|IWM) \| /gm) || []).length === 9);
  pruefe('Bericht: keines der verbotenen Woerter', !/belegt|bestätigt/i.test(text));
  if (process.argv.indexOf('--zeigen') >= 0) console.log(text);     // Bericht der ZUFALLS-KUNSTREIHE, nur zur Ansicht der Form
})();

console.log('Pruefungen: ' + gruen + ' gruen, ' + rot + ' rot');
process.exit(rot ? 1 : 0);
