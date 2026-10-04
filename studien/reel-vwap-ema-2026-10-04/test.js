'use strict';
/* Auftrag Nr. 89, Paragraph 3: Pruefungen an Kunsttagen. Liest keine Archivdatei.
 * Aufruf: node studien/reel-vwap-ema-2026-10-04/test.js */
var D = require('./daten');
var K = require('./kern');

var gruen = 0, rot = 0;
function pruefe(name, ok) {
  if (ok) { gruen++; if (process.argv.indexOf('--alle') >= 0) console.log('gruen: ' + name); } else { rot++; console.log('ROT: ' + name); }
}
function nahe(a, b, tol) { return Math.abs(a - b) <= (tol == null ? 1e-9 : tol); }
function zufall(saat) {            // mulberry32 - fester Zufall, damit die Pruefung wiederholbar ist
  var a = saat >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function normal(z) { return Math.sqrt(-2 * Math.log(1 - z())) * Math.cos(2 * Math.PI * z()); }
function kerze(m, o, h, l, c, v) { return { m: m, o: o, h: h, l: l, c: c, v: v }; }
/** Tag aus Schlusskursen; Eroeffnungen wahlweise vorgegeben, sonst Vorschluss. */
function tagAus(datum, schluss, eroeffnung, ersteMinute) {
  var ks = [];
  for (var i = 0; i < schluss.length; i++) {
    var o = eroeffnung ? eroeffnung[i] : (i ? schluss[i - 1] : schluss[0]);
    ks.push(kerze((ersteMinute || 570) + i, o, Math.max(o, schluss[i]), Math.min(o, schluss[i]), schluss[i], 100));
  }
  return { datum: datum, kerzen: ks };
}
var NULLKOSTEN = { art: 'bp', c: 0 };

/* ---------- 1. VWAP von Hand, auch mit einer fehlenden Minute ---------- */
(function () {
  var R = D.ausTagen([
    { datum: '2020-01-02', kerzen: [kerze(570, 9, 10, 8, 9, 100), kerze(571, 9, 12, 10, 11, 300), kerze(573, 11, 11, 9, 10, 100)] },
    { datum: '2020-01-03', kerzen: [kerze(570, 20, 22, 18, 20, 50), kerze(571, 20, 26, 22, 24, 150)] }
  ]);
  var vw = K.vwapReihe(R);
  pruefe('VWAP Kerze 1 = HLC', nahe(vw[0], 9));
  pruefe('VWAP Kerze 2 = (900+3300)/400', nahe(vw[1], 10.5));
  pruefe('VWAP nach fehlender Minute = (4200+1000)/500', nahe(vw[2], 10.4));
  pruefe('VWAP beginnt am zweiten Tag neu', nahe(vw[3], 20));
  pruefe('VWAP zweiter Tag Kerze 2 = (1000+3600)/200', nahe(vw[4], 23));
  var R0 = D.ausTagen([{ datum: '2020-01-02', kerzen: [kerze(570, 9, 10, 8, 9, 0), kerze(571, 9, 12, 10, 11, 300)] }]);
  var vw0 = K.vwapReihe(R0);
  pruefe('VWAP ohne Umsatz ist nicht definiert', vw0[0] !== vw0[0] && nahe(vw0[1], 11));
  pruefe('nicht definierter VWAP gilt als gleich', K.seite(9, NaN) === 0);
  pruefe('Seite: gleich bis auf Rechengenauigkeit', K.seite(0.1 + 0.2, 0.3) === 0 && K.seite(100.01, 100) === 1 && K.seite(99.99, 100) === -1);
})();

/* ---------- 2. Positionslogik R1, Fassung P gegen N von Hand ---------- */
var TAG_X = { c: [10, 10, 11, 10.5, 9, 9, 12], vw: [10, 10, 10, 10.5, 10, 9, 10], o: [10, 10, 10.2, 11.1, 10.4, 9.2, 9.1] };
(function () {
  var R = D.ausTagen([tagAus('2020-01-02', TAG_X.c, TAG_X.o)]);
  var s = K.zustandR1(R, Float64Array.from(TAG_X.vw));
  pruefe('R1 Zustaende: erste Kerze gleich, Gleichstand haelt, Wechsel auf Schluss', Array.from(s).join(',') === '0,0,1,1,-1,-1,1');
  pruefe('R1 zaehlt die Gleichstaende', s.gleichstaende === 4);
  /* Hoch ueber dem VWAP, Schluss darunter: kein Wechsel innerhalb der Kerze */
  var Rh = D.ausTagen([{ datum: '2020-01-02', kerzen: [kerze(570, 9, 9, 9, 9, 100), kerze(571, 9, 15, 8, 8.5, 100), kerze(572, 8.5, 8.5, 8, 8, 100)] }]);
  var sh = K.zustandR1(Rh, Float64Array.from([10, 10, 10]));
  pruefe('R1 wechselt nur auf Schlusskurse', Array.from(sh).join(',') === '-1,-1,-1');

  var prot = [], P = K.simuliere(R, s, 0, 1, 'P', NULLKOSTEN, prot);
  pruefe('P: drei Handelsvorgaenge (Einstieg, Wechsel, Glattstellen)', prot.length === 3 && prot[0].i === 2 && prot[1].i === 4 && prot[2].i === 6);
  pruefe('P: Preise sind die Schlusskurse der Signalkerzen', prot[0].preis === 11 && prot[1].preis === 9 && prot[2].preis === 12);
  pruefe('P: letzte Kerze loest keinen Wechsel aus, nur Glattstellen', prot[2].von === -1 && prot[2].nach === 0);
  pruefe('P: Endstand von Hand', nahe(P.tagEnde[0], 100000 * (9 / 11) * (2 - 12 / 9), 1e-6));
  pruefe('P: zwei Trades, kein Gewinner', P.trades === 2 && P.gewinner === 0);
  pruefe('P: Brutto-Summe von Hand', nahe(P.summeBrutto, (9 / 11 - 1) + (1 - 12 / 9)));
  pruefe('P: Tagesumsatz von Hand', nahe(P.tagUmsatz[0], (100000 + 2 * 100000 * 9 / 11 + 100000 * 9 / 11 * 12 / 9) / 100000, 1e-9));
  var protN = [], N = K.simuliere(R, s, 0, 1, 'N', NULLKOSTEN, protN);
  pruefe('N: Preise sind die naechsten Eroeffnungen, abends der Schluss', protN.length === 3 && protN[0].preis === 11.1 && protN[1].preis === 9.2 && protN[2].preis === 12);
  pruefe('N: Endstand von Hand', nahe(N.tagEnde[0], 100000 * (9.2 / 11.1) * (2 - 12 / 9.2), 1e-6));
  pruefe('Summe der Eimer = log des Tagesertrags (P und N)',
    nahe(P.eimer[0] + P.eimer[1] + P.eimer[2], Math.log(P.tagEnde[0] / 100000), 1e-12) && nahe(N.eimer[0] + N.eimer[1] + N.eimer[2], Math.log(N.tagEnde[0] / 100000), 1e-12));

  /* erste Kerze ueber VWAP: sofort long; zwei Tage: abends glatt, morgens ohne Position */
  var R2 = D.ausTagen([tagAus('2020-01-02', [10, 11, 12]), tagAus('2020-01-03', [20, 19, 18])]);
  var s2 = K.zustandR1(R2, Float64Array.from([9, 9, 9, 21, 21, 21]));
  var p2 = [], S2 = K.simuliere(R2, s2, 0, 2, 'P', NULLKOSTEN, p2);
  pruefe('erste Kerze: Einstieg zum Schluss der ersten Kerze', p2[0].i === 0 && p2[0].preis === 10 && p2[0].nach === 1);
  pruefe('abends glatt, am naechsten Morgen aus der Null', p2[1].i === 2 && p2[1].nach === 0 && p2[2].i === 3 && p2[2].von === 0 && p2[2].nach === -1 && p2[3].i === 5);
  pruefe('zwei Tage: Ertraege von Hand', nahe(S2.tagErtrag[0], 0.2) && nahe(S2.tagErtrag[1], 0.1) && nahe(S2.tagEnde[1], 132000, 1e-6));
  var p2n = [];
  K.simuliere(R2, s2, 0, 2, 'N', NULLKOSTEN, p2n);
  pruefe('N erste Kerze: Einstieg zur Eroeffnung der zweiten Kerze', p2n[0].i === 0 && p2n[0].preis === R2.o[1]);

  /* verkuerzter Tag (210 Kerzen bis 12:59) und ganzer Tag: Glattstellen zur letzten Kerze, Eimer nach Sitzungsende */
  function tagMitSprung(datum, n) {
    var c = [];
    for (var i = 0; i < n; i++) c.push(570 + i >= 730 ? 101 : 100);
    return tagAus(datum, c);
  }
  var Rk = D.ausTagen([tagMitSprung('2020-11-27', 210), tagMitSprung('2020-11-30', 390)]);
  var sk = new Int8Array(Rk.n).fill(1), pk = [], Sk = K.simuliere(Rk, sk, 0, 1, 'P', NULLKOSTEN, pk);
  pruefe('verkuerzter Tag: Glattstellen zum Schluss der Kerze 12:59', pk.length === 2 && Rk.min[pk[1].i] === 779 && pk[1].nach === 0);
  pruefe('verkuerzter Tag: Sprung um 12:10 faellt in die letzte Stunde', nahe(Sk.eimer[2], Math.log(1.01)) && nahe(Sk.eimer[1], 0) && nahe(Sk.eimer[0], 0));
  var Sg = K.simuliere(Rk, sk, 1, 2, 'P', NULLKOSTEN);
  pruefe('ganzer Tag: derselbe Sprung faellt in die Mitte', nahe(Sg.eimer[1], Math.log(1.01)) && nahe(Sg.eimer[2], 0));
  var R1k = D.ausTagen([tagAus('2020-01-02', [10])]);
  var S1k = K.simuliere(R1k, new Int8Array([1]), 0, 1, 'N', NULLKOSTEN);
  pruefe('Tag mit einer einzigen Kerze: kein Handel', S1k.trades === 0 && S1k.tagErtrag[0] === 0);
})();

/* ---------- 3. R2: EMA von Hand, drei Zustaende, 250 Kerzen ohne Signal ---------- */
(function () {
  var e = K.ema(Float64Array.from([10, 11, 12]), 9);
  pruefe('EMA9 von Hand', nahe(e[0], 10) && nahe(e[1], 10.2) && nahe(e[2], 10.56));
  var e21 = K.ema(Float64Array.from([10, 11, 12]), 21), e50 = K.ema(Float64Array.from([10, 11, 12]), 50);
  pruefe('EMA21 von Hand', nahe(e21[1], 10 + 1 / 11) && nahe(e21[2], 12 / 11 + (10 / 11) * (10 + 1 / 11)));
  pruefe('EMA50 von Hand', nahe(e50[1], 10 + 2 / 51) && nahe(e50[2], 24 / 51 + (49 / 51) * (10 + 2 / 51)));
  /* drei Tage je 200 Kerzen: zwei steigend, einer fallend */
  var tage = [], kurs = 100;
  ['2020-01-02', '2020-01-03', '2020-01-06'].forEach(function (datum, d) {
    var c = [];
    for (var i = 0; i < 200; i++) { kurs += d < 2 ? 0.01 : -0.03; c.push(kurs); }
    tage.push(tagAus(datum, c));
  });
  var R = D.ausTagen(tage), vw = K.vwapReihe(R), s = K.zustandR2(R, vw);
  /* unabhaengige zweite Rechnung: EMA als gewichtete Summe, VWAP als direkte Summe */
  function emaDirekt(n, i) {
    var a = 2 / (n + 1), x = Math.pow(1 - a, i) * R.c[0];
    for (var k = 1; k <= i; k++) x += a * Math.pow(1 - a, i - k) * R.c[k];
    return x;
  }
  function vwapDirekt(i) {
    var d = i < 200 ? 0 : (i < 400 ? 1 : 2), pv = 0, vv = 0;
    for (var k = d * 200; k <= i; k++) { pv += (R.h[k] + R.l[k] + R.c[k]) / 3 * R.v[k]; vv += R.v[k]; }
    return pv / vv;
  }
  function soll(i) {
    if (i < 250) return 0;
    var a = emaDirekt(9, i), b = emaDirekt(21, i), c = emaDirekt(50, i), w = vwapDirekt(i), tol = 1e-9 * R.c[i];
    if (a > b && b > c && R.c[i] - w > tol) return 1;      // "ueber" heisst: um mehr als die Rechengenauigkeit (L2)
    if (a < b && b < c && w - R.c[i] > tol) return -1;
    return 0;
  }
  /* Kerze 400 (erste des dritten Tages, H = L = C): (C+C+C)/3 liegt rechnerisch ein Bit neben C - das ist "gleich", kein Signal */
  pruefe('Rundungsrest am Tagesanfang ist kein Signal (L2)', R.c[400] !== vw[400] && Math.abs(R.c[400] - vw[400]) < 1e-12 && K.seite(R.c[400], vw[400]) === 0 && s[400] === 0);
  var gleich = true, zahl = { '1': 0, '0': 0, '-1': 0 };
  for (var i = 0; i < R.n; i++) { if (s[i] !== soll(i)) gleich = false; if (i >= 250) zahl[String(s[i])]++; }
  pruefe('R2 stimmt mit der unabhaengigen zweiten Rechnung ueberein', gleich);
  pruefe('R2: alle drei Zustaende kommen nach der Sperre vor', zahl['1'] > 0 && zahl['0'] > 0 && zahl['-1'] > 0);
  var bedingung100 = emaDirekt(9, 100) > emaDirekt(21, 100) && emaDirekt(21, 100) > emaDirekt(50, 100) && R.c[100] > vwapDirekt(100);
  pruefe('R2: die ersten 250 Kerzen erzeugen kein Signal, obwohl die Bedingung erfuellt ist', bedingung100 && s[100] === 0 && s[249] === 0 && s[250] === 1);
  /* gestapelte EMA, aber Schluss unter VWAP: ohne Position */
  var vwHoch = Float64Array.from(vw);
  vwHoch[300] = R.c[300] + 1;
  pruefe('R2: EMA gestapelt, Schluss unter VWAP -> ohne Position', K.zustandR2(R, vwHoch)[300] === 0 && s[300] === 1);
  pruefe('EMA laeuft ueber die Tagesgrenze weiter (kein Neustart)', nahe(K.ema(R.c, 9)[200], 0.2 * R.c[200] + 0.8 * K.ema(R.c, 9)[199]));
})();

/* ---------- 4. Kosten: ein Wechsel long -> short kostet 2 x c ---------- */
(function () {
  var c = [];
  for (var i = 0; i < 6; i++) c.push(100);
  var R = D.ausTagen([tagAus('2020-01-02', c)]), cs = 1 / 10000, k = { art: 'bp', c: 1 };
  var ohneWechsel = K.simuliere(R, Int8Array.from([1, 1, 1, 1, 1, 0]), 0, 1, 'P', k);
  var mitWechsel = K.simuliere(R, Int8Array.from([1, 1, -1, -1, -1, 0]), 0, 1, 'P', k);
  pruefe('Einstieg plus Ausstieg kosten 2 x c (genau: (1-c)/(1+c))', nahe(ohneWechsel.tagEnde[0] / 100000, (1 - cs) / (1 + cs), 1e-12));
  pruefe('mit einem Wechsel: 4 x c (genau: ((1-c)/(1+c))^2)', nahe(mitWechsel.tagEnde[0] / 100000, Math.pow((1 - cs) / (1 + cs), 2), 1e-12));
  pruefe('der Wechsel allein kostet 2 x c', nahe(ohneWechsel.tagErtrag[0] - mitWechsel.tagErtrag[0], 2 * cs, 1e-7));
  pruefe('der Wechsel allein setzt das Zweifache des Vermoegens um', nahe(mitWechsel.tagUmsatz[0] - ohneWechsel.tagUmsatz[0], 2, 1e-3));
  pruefe('Trefferquote nach Kosten: bei flachem Kurs kein Gewinner', mitWechsel.trades === 2 && mitWechsel.gewinner === 0);
  var papier = K.simuliere(R, Int8Array.from([1, 1, 1, 1, 1, 0]), 0, 1, 'P', { art: 'aktie', f: 0.0005 });
  pruefe('Papier-Kosten: 0,0005 $ je Aktie bei Einstieg und Ausstieg', nahe(papier.tagEnde[0], 100000 / 100.0005 * 99.9995, 1e-6));
  /* short von Hand mit Kosten: Einstieg 100, Ausstieg 90, c = 10 Basispunkte */
  var Rs = D.ausTagen([tagAus('2020-01-02', [100, 95, 90])]);
  var sh = K.simuliere(Rs, Int8Array.from([-1, -1, 0]), 0, 1, 'P', { art: 'bp', c: 10 });
  var q = 100000 / (100 * 1.001);
  pruefe('short mit Kosten von Hand', nahe(sh.tagEnde[0], q * (200 - 90 - 0.09), 1e-6) && sh.gewinner === 1);
  /* Korrektur 1: ein Trade mit Ertrag genau null ist kein Gewinner - auch wenn das Vermoegen krumm ist */
  var tage = [], gewinnTage = 0;
  for (var d = 0; d < 600; d++) {
    var monat = 1 + Math.floor((d % 336) / 28), tagNr = 1 + d % 28;
    var a = 300.07 + 0.13 * d, datum = (2020 + Math.floor(d / 336)) + '-' + (monat < 10 ? '0' : '') + monat + '-' + (tagNr < 10 ? '0' : '') + tagNr;
    if (d % 3 === 0) { tage.push(tagAus(datum, [10, 10.37 + 0.01 * d, 10.5])); gewinnTage++; } else tage.push(tagAus(datum, [a, a + 0.11, a, a + 0.05]));
  }
  var Rn = D.ausTagen(tage), sn = new Int8Array(Rn.n);
  for (var t = 0; t < Rn.tagA.length; t++) { sn[Rn.tagA[t]] = 1; if (Rn.tagE[t] - Rn.tagA[t] === 4) sn[Rn.tagA[t] + 1] = 1; }
  var null0 = K.simuliere(Rn, sn, 0, Rn.tagA.length, 'P', { art: 'bp', c: 0 });
  pruefe('Ertrag genau null ist kein Gewinner (600 Tage, krummes Vermoegen)', null0.trades === 600 && null0.gewinner === gewinnTage);
  /* der Kunstfall muss den alten Fehler enthalten: nach dem alten Vergleich am Vermoegen waere mindestens ein Nulltrade Gewinner */
  var altFalsch = 0;
  for (t = 0; t < Rn.tagA.length; t++) {
    if (Rn.tagE[t] - Rn.tagA[t] !== 4) continue;
    var vor = t ? null0.tagEnde[t - 1] : K.START, kursA = Rn.c[Rn.tagA[t]];
    if ((vor / kursA) * kursA > vor) altFalsch++;
  }
  pruefe('der Kunstfall enthaelt den alten Rundungsfehler (' + altFalsch + ' von 400 Nulltrades waeren Gewinner gewesen)', altFalsch > 0);
  function einTrade(ein, aus, richtung, kosten) {
    var Rt = D.ausTagen([tagAus('2020-03-02', [ein, aus, aus])]);
    return K.simuliere(Rt, Int8Array.from([richtung, 0, 0]), 0, 1, 'P', kosten).gewinner;
  }
  var pap = { art: 'aktie', f: 0.0005 };
  pruefe('Papier-Kosten: Kursgewinn genau 0,001 $ ist kein Gewinner, 0,0011 $ schon',
    einTrade(300, 300.001, 1, pap) === 0 && einTrade(300, 300.0011, 1, pap) === 1 && einTrade(300.001, 300, -1, pap) === 0 && einTrade(300.0011, 300, -1, pap) === 1);
  pruefe('Kostenleiter wie im Auftrag', K.KOSTEN.map(function (x) { return x.name; }).join(' ') === '0 Papier 0,1 0,25 0,5 1,0 1,5');
})();

/* ---------- 5. Kein Blick voraus ---------- */
(function () {
  var z = zufall(89), ks = [], kurs = 100;
  for (var i = 0; i < 120; i++) {
    var o = kurs * (1 + 0.0002 * normal(z)), c = o * (1 + 0.001 * normal(z));
    ks.push(kerze(570 + i, o, Math.max(o, c) * 1.0002, Math.min(o, c) * 0.9998, c, 50 + Math.floor(500 * z())));
    kurs = c;
  }
  function lauf(aenderung, fassung, regel) {
    var kopie = ks.map(function (k) { return kerze(k.m, k.o, k.h, k.l, k.c, k.v); });
    if (aenderung) aenderung(kopie);
    var vorlauf = [];                 // 300 ruhige Kerzen davor, damit R2 hinter der Sperre liegt
    for (var j = 0; j < 300; j++) vorlauf.push(kerze(570 + j, 100, 100.01, 99.99, 100 + 0.001 * j, 100));
    var R = D.ausTagen([{ datum: '2020-01-02', kerzen: vorlauf }, { datum: '2020-01-03', kerzen: kopie }]);
    var vw = K.vwapReihe(R), s = regel === 'R2' ? K.zustandR2(R, vw) : K.zustandR1(R, vw), prot = [];
    K.simuliere(R, s, 1, 2, fassung, NULLKOSTEN, prot);
    return { s: Array.from(s.subarray(300)), prot: prot.map(function (p) { return { i: p.i - 300, preis: p.preis, nach: p.nach }; }) };
  }
  var gut = true, gutN = true, gutNOffen = true, wechselGesehen = 0;
  ['R1', 'R2'].forEach(function (regel) {
    for (var t = 5; t < 110; t += 7) {
      var basisP = lauf(null, 'P', regel), basisN = lauf(null, 'N', regel);
      var alles = function (k) { k[t + 1] = kerze(k[t + 1].m, 55, 60, 50, 58, 99999); };
      var ohneEroeffnung = function (k) { k[t + 1] = kerze(k[t + 1].m, k[t + 1].o, 160, 50, 158, 99999); };
      var nurEroeffnung = function (k) { k[t + 1] = kerze(k[t + 1].m, k[t + 1].o * 1.01, k[t + 1].h * 1.02, k[t + 1].l, k[t + 1].c, k[t + 1].v); };
      var aP = lauf(alles, 'P', regel), aN = lauf(ohneEroeffnung, 'N', regel), aNo = lauf(nurEroeffnung, 'N', regel);
      var bis = function (x, grenze) { return JSON.stringify(x.prot.filter(function (p) { return p.i <= grenze; })); };
      if (aP.s.slice(0, t + 1).join() !== basisP.s.slice(0, t + 1).join() || bis(aP, t) !== bis(basisP, t)) gut = false;
      if (aN.s.slice(0, t + 1).join() !== basisN.s.slice(0, t + 1).join() || bis(aN, t) !== bis(basisN, t)) gutN = false;
      /* nur die Eroeffnung von t+1 geaendert: Signale bis t gleich, Handel aus Signalen vor t gleich, Handel aus Signal t nur im Preis anders */
      if (aNo.s.slice(0, t + 1).join() !== basisN.s.slice(0, t + 1).join() || bis(aNo, t - 1) !== bis(basisN, t - 1)) gutNOffen = false;
      var hb = basisN.prot.filter(function (p) { return p.i === t; }), ha = aNo.prot.filter(function (p) { return p.i === t; });
      if (hb.length !== ha.length) gutNOffen = false;
      if (hb.length) { wechselGesehen++; if (!nahe(ha[0].preis, hb[0].preis * 1.01, 1e-9) || ha[0].nach !== hb[0].nach) gutNOffen = false; }
    }
  });
  pruefe('P: Aenderung der Kerze t+1 aendert Signal und Handelspreis bis t nicht', gut);
  pruefe('N: Aenderung von Hoch, Tief, Schluss, Umsatz der Kerze t+1 aendert Signal und Handelspreis bis t nicht', gutN);
  pruefe('N: die Eroeffnung von t+1 wirkt nur als Handelspreis des Signals t', gutNOffen && wechselGesehen > 0);
})();

/* ---------- 6. Ereignis-Sicht samt Kontrolle von Hand ---------- */
(function () {
  var o1 = [100, 101, 102, 103, 104, 105, 106, 107, 110, 109], o2 = [50, 50, 50, 50, 50, 50, 50, 50, 51, 50];
  var o3 = [10, 10, 10, 10, 10, 10, 10, 10, 10.5, 10];
  function tagO(datum, o, ohneMinute) {
    var ks = [];
    o.forEach(function (x, i) { if (570 + i !== ohneMinute) ks.push(kerze(570 + i, x, x, x, x, 100)); });
    return { datum: datum, kerzen: ks };
  }
  var R = D.ausTagen([tagO('2020-01-02', o1), tagO('2020-01-03', o2), tagO('2021-01-04', o3)]);
  var vor5 = K.vorwaerts(R, 5), ktr = K.kontrolle(R, vor5);
  pruefe('Vorwaertsertrag: Eroeffnung 09:33 bis Eroeffnung 09:38', nahe(vor5[3], 110 / 103 - 1));
  pruefe('Vorwaertsertrag entfaellt, wenn der Tag nicht reicht', vor5[5] !== vor5[5] && vor5[4] === vor5[4]);
  pruefe('Kontrolle = Mittel derselben Minute im selben Kalenderjahr', nahe(ktr(2020, 573), ((110 / 103 - 1) + (51 / 50 - 1)) / 2));
  pruefe('Kontrolle trennt die Kalenderjahre', nahe(ktr(2021, 573), 0.05));
  pruefe('Vorwaertsertrag H=15 entfaellt am kurzen Kunsttag', K.vorwaerts(R, 15)[0] !== K.vorwaerts(R, 15)[0]);
  /* R1-Ereignis: Seitenwechsel an Kerze 2 des ersten Tages (short), an Kerze 1 und 2 des zweiten Tages */
  var s = Int8Array.from([1, 1, -1, -1, -1, -1, -1, -1, -1, -1, /* Tag 2 */ 0, -1, 1, 1, 1, 1, 1, 1, 1, 1, /* Tag 3 */ 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
  var ev = K.ereignisse(R, s, false, 0, 3);
  pruefe('R1-Ereignisse: nur Seitenwechsel, nicht die erste Seite des Tages', ev.length === 2 && ev[0].i === 2 && ev[0].richtung === -1 && ev[1].i === 12 && ev[1].richtung === 1);
  var evR2 = K.ereignisse(R, s, true, 0, 3);
  pruefe('R2-Ereignisse: jeder Eintritt, der Tag beginnt ohne Position', evR2.length === 5 && evR2[0].i === 0 && evR2[2].i === 11 && evR2[4].i === 20);
  var sicht = K.ereignisSicht(R, ev, vor5, ktr);
  var k573 = ((110 / 103 - 1) + (51 / 50 - 1)) / 2, x1 = -1 * ((110 / 103 - 1) - k573), x2 = 1 * ((51 / 50 - 1) - k573);
  pruefe('Ereignis-Sicht: Mittel von Hand (Ertrag minus Kontrolle, in Signalrichtung)', sicht.n === 2 && nahe(sicht.mittelBp, (x1 + x2) / 2 * 10000, 1e-6));
  pruefe('Ereignis-Sicht: Rohertrag von Hand', nahe(sicht.rohBp, (-(110 / 103 - 1) + (51 / 50 - 1)) / 2 * 10000, 1e-6));
  /* Standardfehler ueber Tage gebuendelt: zwei Ereignisse am selben Tag zaehlen als ein Buendel */
  var Rb = D.ausTagen([tagO('2020-01-02', o1), tagO('2020-01-03', o2), tagO('2020-01-06', o3)]);
  var vb = K.vorwaerts(Rb, 5), kb = K.kontrolle(Rb, vb);
  var liste = [{ i: 0, tag: 0, richtung: 1 }, { i: 2, tag: 0, richtung: 1 }, { i: 12, tag: 1, richtung: 1 }];
  var sb = K.ereignisSicht(Rb, liste, vb, kb);
  var a1 = vb[1] - kb(2020, 571), a2 = vb[3] - kb(2020, 573), a3 = vb[13] - kb(2020, 573), m = (a1 + a2 + a3) / 3;
  var seHand = Math.sqrt(2 / 1 * (Math.pow(a1 + a2 - 2 * m, 2) + Math.pow(a3 - m, 2))) / 3;
  pruefe('Ereignis-Sicht: Standardfehler ueber Tage gebuendelt, von Hand', sb.n === 3 && sb.tage === 2 && nahe(sb.seBp, seHand * 10000, 1e-6) && nahe(sb.t, m / seHand, 1e-6));
  /* fehlende Minute: erste vorhandene Kerze mit Stempel >= Einstieg + H */
  var Rl = D.ausTagen([tagO('2020-01-02', o1, 578)]);
  pruefe('fehlende Zielminute: naechste vorhandene Kerze desselben Tages', nahe(K.vorwaerts(Rl, 5)[3], 109 / 103 - 1));
  var letzte = K.ereignisse(R, Int8Array.from([1, 1, 1, 1, 1, 1, 1, 1, 1, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]), false, 0, 3);
  pruefe('Signal der letzten Kerze des Tages ist kein Ereignis', letzte.length === 0);
})();

/* ---------- 7. Kennzahlen von Hand ---------- */
(function () {
  var nw = K.neweyWest([1, -1, 1, -1], 5);
  pruefe('Newey-West von Hand', nahe(nw.mittel, 0) && nahe(nw.se, Math.sqrt((1 + 2 * (-0.75 * 5 / 6 + 0.5 * 4 / 6 - 0.25 * 3 / 6)) / 4)));
  var nw0 = K.neweyWest([1, 2, 3, 4], 0);
  pruefe('Newey-West ohne Verzoegerung = einfacher Standardfehler', nahe(nw0.se, Math.sqrt(1.25 / 4)) && nahe(nw0.t, 2.5 / Math.sqrt(1.25 / 4)));
  var sim = { tagErtrag: Float64Array.from([0.1, -0.2, 0.05]), tagEnde: Float64Array.from([110000, 88000, 92400]), tagUmsatz: Float64Array.from([2, 4, 6]), trades: 4, gewinner: 1, summeBrutto: 0.02, eimer: [0.01, 0.02, 0.01] };
  var kz = K.kennzahlen(sim, [2020, 2020, 2021]);
  pruefe('Gesamtertrag und groesster Rueckschlag von Hand', nahe(kz.gesamt, -0.076) && nahe(kz.rueckschlag, 0.2));
  pruefe('Ertrag p. a. geometrisch ueber 252 Tage', nahe(kz.pa, Math.pow(0.924, 84) - 1));
  var mm = (0.1 - 0.2 + 0.05) / 3, sd = Math.sqrt((Math.pow(0.1 - mm, 2) + Math.pow(-0.2 - mm, 2) + Math.pow(0.05 - mm, 2)) / 2);
  pruefe('Schwankung und Sharpe von Hand', nahe(kz.vol, sd * Math.sqrt(252)) && nahe(kz.sharpe, mm / sd * Math.sqrt(252)));
  pruefe('Trades, Trefferquote, Brutto je Trade, Tagesumsatz', kz.tradesJeTag === 4 / 3 && kz.trefferquote === 0.25 && nahe(kz.bruttoJeTradeBp, 50) && nahe(kz.tagesumsatz, 4));
  pruefe('Kalenderjahre', nahe(kz.jahre[2020], 1.1 * 0.8 - 1) && nahe(kz.jahre[2021], 0.05));
  pruefe('Anteile der Tageszeiten', nahe(kz.anteil.ersteStunde, 0.25) && nahe(kz.anteil.mitte, 0.5) && nahe(kz.anteil.letzteStunde, 0.25));
  pruefe('Rueckschlag: der Start zaehlt als erster Gipfel', nahe(K.kennzahlen({ tagErtrag: Float64Array.from([-0.1]), tagEnde: Float64Array.from([90000]), tagUmsatz: Float64Array.from([1]), trades: 0, gewinner: 0, summeBrutto: 0, eimer: [0, 0, 0] }, [2020]).rueckschlag, 0.1));
  pruefe('Kostengrenze = mittlerer Brutto-Tagesertrag / mittlerer Tagesumsatz', nahe(K.kostengrenze(sim), mm / 4 * 10000));
  var R = D.ausTagen([tagAus('2017-12-29', [10, 11]), tagAus('2018-01-02', [20, 22]), tagAus('2023-09-28', [30, 33]), tagAus('2023-09-29', [40, 44])]);
  pruefe('Fenstergrenzen einschliesslich', K.fensterTage(R, K.FENSTER[0]).join() === '0,1' && K.fensterTage(R, K.FENSTER[1]).join() === '1,3' && K.fensterTage(R, K.FENSTER[2]).join() === '3,4');
  var kh = K.kaufenHalten(R, 1, 3);
  pruefe('Kaufen-und-Halten: erste Eroeffnung bis letzter Schluss', nahe(kh.gesamt, 33 / 20 - 1) && nahe(kh.pa, Math.pow(33 / 20, 126) - 1, 1e-3 * Math.pow(33 / 20, 126)));
  pruefe('Fenster wie im Auftrag', K.FENSTER.map(function (f) { return f.von + '/' + f.bis; }).join(' ') === '2016-01-04/2017-12-29 2018-01-02/2023-09-28 2023-09-29/2026-09-30');
  pruefe('Satz: Schwellen', K.satz(1, 2.5, 1, 2) === 'hält auch nach Kosten' && K.satz(1, 2, 1, 1.99) === 'hält nur ohne Kosten' &&
    K.satz(1, 1.99, 1, 1.9) === 'hält nicht' && K.satz(-1, -3, -1, -3) === 'hält nicht' && K.satz(1, 3, -1, -3) === 'hält nur ohne Kosten');
})();

/* ---------- 8. Die beiden Kunstfaelle fuer die Saetze und die Zufalls-Regel ---------- */
(function () {
  function kunstreihe(saat, tage, driftBp) {
    var z = zufall(saat), liste = [], kurs = 300;
    for (var d = 0; d < tage; d++) {
      var richtung = z() < 0.5 ? -1 : 1, ks = [];
      for (var i = 0; i < 390; i++) {
        var o = kurs, c = o * (1 + (richtung * driftBp + 1.5 * normal(z)) / 10000);
        ks.push(kerze(570 + i, o, Math.max(o, c), Math.min(o, c), c, 100 + Math.floor(900 * z())));
        kurs = c;
      }
      kurs = 300;
      var monat = 1 + Math.floor(d / 25), tagImMonat = 1 + d % 25;
      liste.push({ datum: '2021-' + (monat < 10 ? '0' : '') + monat + '-' + (tagImMonat < 10 ? '0' : '') + tagImMonat, kerzen: ks });
    }
    return D.ausTagen(liste);
  }
  function urteil(R, s) {
    var n = R.tagDatum.length;
    var k0 = K.kennzahlen(K.simuliere(R, s, 0, n, 'N', { art: 'bp', c: 0 }), R.tagJahr);
    var k25 = K.kennzahlen(K.simuliere(R, s, 0, n, 'N', { art: 'bp', c: 0.25 }), R.tagJahr);
    return { satz: K.satz(k0.mittelTagBp, k0.t, k25.mittelTagBp, k25.t), k0: k0, k25: k25 };
  }
  var trend = kunstreihe(8901, 250, 0.3), ut = urteil(trend, K.zustandR1(trend, K.vwapReihe(trend)));
  pruefe('Kunstreihe mit eingepflanztem Trend: haelt auch nach Kosten (Satz: ' + ut.satz + ', t ' + ut.k25.t.toFixed(1) + ')', ut.satz === 'hält auch nach Kosten');
  var irr = kunstreihe(8902, 250, 0), ui = urteil(irr, K.zustandR1(irr, K.vwapReihe(irr)));
  pruefe('Zufallsreihe: haelt nicht (Satz: ' + ui.satz + ', t ' + ui.k0.t.toFixed(1) + ')', ui.satz === 'hält nicht');
  var ui2 = urteil(irr, K.zustandR2(irr, K.vwapReihe(irr)));
  pruefe('Zufallsreihe, R2: haelt nicht (Satz: ' + ui2.satz + ', t ' + ui2.k0.t.toFixed(1) + ')', ui2.satz === 'hält nicht');
  /* Zufalls-Regel mit zufaelligem Vorzeichen: verliert genau ihre Kosten */
  var z = zufall(8903), s = new Int8Array(trend.n), jetzt = 0;
  for (var i = 0; i < trend.n; i++) { if (z() < 0.03) jetzt = Math.floor(3 * z()) - 1; s[i] = jetzt; }
  var n = trend.tagDatum.length;
  ['P', 'N'].forEach(function (fassung) {
    var brutto = K.simuliere(trend, s, 0, n, fassung, { art: 'bp', c: 0 }), netto = K.simuliere(trend, s, 0, n, fassung, { art: 'bp', c: 1 });
    var kb = K.kennzahlen(brutto, trend.tagJahr), kn = K.kennzahlen(netto, trend.tagJahr);
    var kostenSoll = 1 * kb.tagesumsatz;      // Basispunkte je Tag
    pruefe('Zufalls-Regel ' + fassung + ': brutto nicht von null verschieden (t ' + kb.t.toFixed(2) + ')', Math.abs(kb.t) < 3);
    pruefe('Zufalls-Regel ' + fassung + ': verliert genau ihre Kosten (' + (kb.mittelTagBp - kn.mittelTagBp).toFixed(3) + ' gegen ' + kostenSoll.toFixed(3) + ' Basispunkte je Tag)',
      Math.abs((kb.mittelTagBp - kn.mittelTagBp) / kostenSoll - 1) < 0.01);
    pruefe('Zufalls-Regel ' + fassung + ': Kostengrenze nahe null (' + K.kostengrenze(brutto).toFixed(3) + ' Basispunkte)', Math.abs(K.kostengrenze(brutto)) < 3 * kb.seTagBp / kb.tagesumsatz);
  });
  /* an der Kostengrenze wird der mittlere Tagesertrag null */
  var st = K.zustandR1(trend, K.vwapReihe(trend)), b0 = K.simuliere(trend, st, 0, n, 'N', { art: 'bp', c: 0 }), cStern = K.kostengrenze(b0);
  var anGrenze = K.kennzahlen(K.simuliere(trend, st, 0, n, 'N', { art: 'bp', c: cStern }), trend.tagJahr);
  pruefe('an der Kostengrenze ist der mittlere Tagesertrag null (Rest ' + anGrenze.mittelTagBp.toFixed(3) + ' von ' + ut.k0.mittelTagBp.toFixed(1) + ' Basispunkten)',
    cStern > 0 && Math.abs(anGrenze.mittelTagBp) < 0.02 * ut.k0.mittelTagBp);
  /* Ereignis-Sicht an beiden Kunstfaellen: Trend zeigt Ueberschuss, Zufall keinen */
  function sichtR1(R) {
    var s1 = K.zustandR1(R, K.vwapReihe(R)), vor = K.vorwaerts(R, 30);
    return K.ereignisSicht(R, K.ereignisse(R, s1, false, 0, R.tagDatum.length), vor, K.kontrolle(R, vor));
  }
  var et = sichtR1(trend), ei = sichtR1(irr);
  pruefe('Ereignis-Sicht: eingepflanzter Trend wird gesehen (t ' + et.t.toFixed(1) + ')', et.t > 3);
  pruefe('Ereignis-Sicht: Zufallsreihe bleibt unauffaellig (t ' + ei.t.toFixed(1) + ')', Math.abs(ei.t) < 3);
})();

/* ---------- 9. Der ganze Lauf an einer Kunstreihe: 36 Laeufe und 72 Ereignis-Zellen, Bericht entsteht ---------- */
(function () {
  var L = require('./lauf');
  function reihe(saat) {
    var z = zufall(saat), liste = [], kurs = 200;
    ['2016-01-04', '2016-01-05', '2017-12-29', '2018-01-02', '2020-06-01', '2023-09-28', '2023-09-29', '2024-07-03', '2025-03-03', '2026-09-30'].forEach(function (datum) {
      var ks = [], n = datum === '2024-07-03' ? 210 : 390;
      for (var i = 0; i < n; i++) {
        var o = kurs * (1 + 0.5 * normal(z) / 10000), c = o * (1 + 2 * normal(z) / 10000);
        ks.push(kerze(570 + i, o, Math.max(o, c), Math.min(o, c), c, 100 + Math.floor(900 * z())));
        kurs = c;
      }
      liste.push({ datum: datum, kerzen: ks });
    });
    return D.ausTagen(liste);
  }
  var E = { siegel: { commit: 'kunst' }, eichung: { imRahmen: true, ergebnis: { gesamt: 6, trades: 21000, trefferquote: 0.17, rueckschlag: 0.1, sharpe: 2, tage: 1445 } }, daten: {}, laeufe: [], ereignisse: [], datenluecken: 'keine.' };
  D.WERTE.forEach(function (sym, k) { L.rechneWert(E, sym, reihe(100 + k)); });
  pruefe('ganzer Lauf: 2 Regeln x 3 Werte x 2 Fassungen x 3 Fenster = 36 Laeufe', E.laeufe.length === 36);
  pruefe('ganzer Lauf: jede Kostenstufe der Leiter gerechnet', E.laeufe.every(function (l) { return Object.keys(l.kosten).length === 7 && l.cStern === l.cStern; }));
  pruefe('ganzer Lauf: 2 Regeln x 3 Werte x 3 Fenster x 4 H = 72 Ereignis-Zellen', E.ereignisse.length === 72);
  pruefe('ganzer Lauf: Fenster haben 3, 3 und 4 Tage', E.laeufe.filter(function (l) { return l.fenster === 'W-Nach'; }).every(function (l) { return l.tage === 4; }) &&
    E.laeufe.filter(function (l) { return l.fenster === 'W-Papier'; }).every(function (l) { return l.tage === 3; }));
  pruefe('ganzer Lauf: ein Satz genau fuer die sechs Laeufe W-Nach, Fassung N', E.laeufe.filter(function (l) { return l.satz; }).length === 6 &&
    E.laeufe.filter(function (l) { return l.satz; }).every(function (l) { return l.fenster === 'W-Nach' && l.fassung === 'N'; }));
  pruefe('ganzer Lauf: jedes Fenster beginnt mit 100.000 (Kosten druecken nur)', E.laeufe.every(function (l) { return l.kosten['1,5'].gesamt < l.kosten['0'].gesamt; }));
  pruefe('ganzer Lauf: Kosten aendern die Zahl der Trades nicht', E.laeufe.every(function (l) { return l.kosten['1,5'].trades === l.kosten['0'].trades && l.kosten.Papier.trades === l.kosten['0'].trades; }));
  var text = L.bericht(E);
  pruefe('Bericht: erste Zeile nennt den Hauptlauf, Tabelle hat sechs Zeilen', text.indexOf('**Hauptlauf (R1') > 0 && (text.match(/^\| R[12] /gm) || []).length === 6);
  pruefe('Bericht: keines der verbotenen Woerter', !/belegt|bestätigt/.test(text));
  if (process.argv.indexOf('--zeigen') >= 0) console.log(text);     // Bericht der KUNSTREIHE, nur zur Ansicht der Form
})();

console.log('Pruefungen: ' + gruen + ' gruen, ' + rot + ' rot');
if (rot) process.exit(1);
