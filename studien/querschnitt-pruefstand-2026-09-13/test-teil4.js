'use strict';
/* PRUEFUNGEN zu TEIL 4 (VORREGISTRIERUNG-TEIL4.md §T4.10), zusaetzlich zu 47 (Teil 1) + 20 (Teil 2) + 15 (Teil 3).
 *
 * Aufruf:  node --max-old-space-size=6144 test-teil4.js [--ergebnis teil4-ergebnis.json] [--tafel <fundamentaltafel>]
 *                                                       [--aus voll --maschine]
 *
 * Kunstfaelle (T4-P0..P8) laufen immer. --ergebnis fuer T4-P10/P12 (Urteil aus den eigenen Zahlen nachgerechnet),
 * --tafel (Vorgabe: Ordner des Lesers) fuer T4-P9, --maschine mit --aus startet test.js, test-teil2.js, test-teil3.js
 * als Kindprozesse (T4-P11). Ohne die Daten: "uebersprungen". Rot ist rot.
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var K = require('./konfig.js');
var PR = require('./pruefstand.js');
var ST = require('./statistik.js');
var T4 = require('./teil4.js');

var gruen = 0, rot = 0, uebersprungen = 0, zeilen = [];
function pruef(name, fn) {
  try {
    var r = fn();
    if (r === 'skip') { uebersprungen++; zeilen.push('  -  ' + name + ' (uebersprungen)'); return; }
    gruen++; zeilen.push(' OK  ' + name + (r ? ' - ' + r : ''));
  } catch (e) { rot++; zeilen.push('ROT  ' + name + ' - ' + e.message); }
}
function gleich(a, b, eps, was) { if (!(Math.abs(a - b) <= eps)) throw new Error((was || '') + ' ' + a + ' != ' + b + ' (eps ' + eps + ')'); }
function wahr(c, was) { if (!c) throw new Error(was || 'Bedingung verletzt'); }
var argv = process.argv.slice(2), opt = {};
for (var ai = 0; ai < argv.length; ai++) {
  if (argv[ai] === '--ergebnis') opt.ergebnis = argv[++ai]; else if (argv[ai] === '--tafel') opt.tafel = argv[++ai];
  else if (argv[ai] === '--aus') opt.aus = argv[++ai]; else if (argv[ai] === '--maschine') opt.maschine = true;
}

/* ---------- Kunst-Tafel: genau die Felder, die Sicht, halte, umschlagKosten und die Auswahl anfassen ---------- */
function kunstTafel(spec) {
  var rows = [];
  spec.reihen.forEach(function (r, s) {
    var tage = Object.keys(r.zeilen).map(Number).sort(function (a, b) { return a - b; }), prev = null;
    tage.forEach(function (d) {
      var z = r.zeilen[d], cc = prev === null ? NaN : 100 * (z.c / prev - 1), oc = 100 * (z.c / z.o - 1);
      rows.push({ tag: d, sym: s, c: z.c, o: z.o, cc: cc, oc: oc, klasse: r.klasse }); prev = z.c;
    });
  });
  rows.sort(function (a, b) { return a.tag - b.tag || a.sym - b.sym; });
  var n = rows.length, g = { n: n, tag: new Int32Array(n), sym: new Uint16Array(n), klasse: new Int8Array(n), rendite: new Float64Array(n), renditeOC: new Float64Array(n), bSchluss: new Float64Array(n), bEroeffnung: new Float64Array(n) };
  var key = {}, letzte = {}, pos = new Int32Array(n), zaehl = {}, jeSym = {};
  rows.forEach(function (r, i) { g.tag[i] = r.tag; g.sym[i] = r.sym; g.klasse[i] = r.klasse; g.rendite[i] = r.cc; g.renditeOC[i] = r.oc; g.bSchluss[i] = r.c; g.bEroeffnung[i] = r.o; key[r.sym + '@' + r.tag] = i; letzte[r.sym] = i; pos[i] = (zaehl[r.sym] = (zaehl[r.sym] || 0) + 1) - 1; (jeSym[r.sym] = jeSym[r.sym] || []).push(i); });
  var nT = spec.tage.length, tagVon = new Int32Array(nT).fill(-1), tagBis = new Int32Array(nT).fill(-1);
  rows.forEach(function (r, i) { if (tagVon[r.tag] < 0) tagVon[r.tag] = i; tagBis[r.tag] = i + 1; });
  var idx = {}; spec.tage.forEach(function (t, i) { idx[t] = i; });
  var symName = spec.reihen.map(function (r) { return r.name; }), symIdx = {}; symName.forEach(function (nm, i) { symIdx[nm] = i; });
  return { g: g, kal: { tage: spec.tage, idx: idx }, maxTag: nT - 1, nTage: nT, nSym: spec.reihen.length, tagVon: tagVon, tagBis: tagBis, posInReihe: pos,
    zeileVon: function (s, t) { var k = key[s + '@' + t]; return k === undefined ? -1 : k; },
    zurueck: function (z, k) { var s = g.sym[z], p = pos[z] - k; return p < 0 ? -1 : jeSym[s][p]; },
    letzteZeile: function (s) { return letzte[s] === undefined ? -1 : letzte[s]; },
    endeGrund: spec.reihen.map(function (r) { return r.ende_grund || null; }), symName: symName, symIdx: symIdx,
    stand: { symbole: spec.reihen.map(function (r) { return { reihe: r.name, referenz: r.name === 'SPY' }; }) } };
}
function isoTage(n, start) { var out = [], ms = Date.parse((start || '2019-01-02') + 'T12:00:00Z'); while (out.length < n) { var d = new Date(ms); var wt = d.getUTCDay(); if (wt !== 0 && wt !== 6) out.push(d.toISOString().slice(0, 10)); ms += 86400000; } return out; }
/** Lineare Reihe ueber `rows` Zeilen: Schluss c0 an Zeile dBase, genau cT an Zeile dZiel (exakte Endpunkte, auch in
 *  Gleitkomma), linear fortgesetzt; Eroeffnung = Schluss des Vortags. */
function reiheLinear(rows, c0, cT, dBase, dZiel) { var z = {}, prev = null; for (var d = 0; d < rows; d++) { var c = c0 + (cT - c0) * (d - dBase) / (dZiel - dBase); z[d] = { c: c, o: prev === null ? c : prev }; prev = c; } return z; }
function kunstLeser(rows) { return { fundamentalAm: function (name, iso) { var r = rows[name]; if (!r) return null; return (r.filed < iso) ? r : null; }, sektorVonSic: function (sic) { return sic == null ? null : 'Kunst'; }, meta: { reihen: {} } }; }

/* ================= T4-P0: z_Bonf(2) und MDE-Faktoren ================= */
pruef('T4-P0 z_Bonf(2) = 2,2414, MDE-Faktoren 2,8016 und 3,0830 ueber eine eigene erf-Naeherung', function () {
  function erf(x) { var s = x < 0 ? -1 : 1; x = Math.abs(x); var t = 1 / (1 + 0.3275911 * x); var y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x); return s * y; }
  function Phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function PhiInv(p) { var lo = -8, hi = 8; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (Phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
  var z2 = PhiInv(1 - 0.05 / (2 * K.TEIL4_TESTZAHL)), z80 = PhiInv(0.80), z975 = PhiInv(0.975), z4 = PhiInv(1 - 0.05 / 8);
  gleich(z2, K.TEIL4_BONFERRONI_T, 6e-4, 'z_Bonf(2)'); gleich(z975 + z80, K.MDE_FAKTOR, 6e-4, 'MDE-Faktor');
  gleich(z2 + z80, K.TEIL4_MDE_FAKTOR_BONF, 6e-4, 'MDE-Faktor Bonf'); gleich(z4 + z80, K.TEIL4_VORPRUEFUNG.mdeFaktorPM, 6e-4, 'Faktor des PM (4 Tests)');
  wahr(K.TEIL4_HORIZONTE[0].lag === Math.ceil(120 / 21) && K.TEIL4_HORIZONTE[1].lag === Math.ceil(250 / 21), 'HH-Lag = ceil(H/21)');
  return 'z ' + z2.toFixed(4) + ', Faktoren ' + (z975 + z80).toFixed(4) + ' / ' + (z2 + z80).toFixed(4) + ' / PM ' + (z4 + z80).toFixed(4);
});

/* ================= T4-P1: Periodenende zaehlt Panel-Handelstage, Luecken werden uebersprungen ================= */
pruef('T4-P1 aEnde ist der H-te Panel-Handelstag nach a, auch ueber leere Tage; reicht die Tafel nicht: null', function () {
  var tage = isoTage(12);
  var z = {}; [0, 1, 2, 4, 5, 6, 7, 9, 10, 11].forEach(function (d) { z[d] = { c: 100, o: 100 }; });   /* Tage 3 und 8 leer */
  var T = kunstTafel({ tage: tage, reihen: [{ name: 'X', klasse: 3, zeilen: z }] });
  wahr(T4.periodenEnde(T, 1, 3) === 5, 'H=3 ab a=1 muss 5 sein (2,4,5)');
  wahr(T4.periodenEnde(T, 2, 4) === 7, 'H=4 ab a=2 muss 7 sein (4,5,6,7)');
  wahr(T4.periodenEnde(T, 6, 3) === 10, 'H=3 ab a=6 muss 10 sein (7,9,10)');
  wahr(T4.periodenEnde(T, 6, 5) === null, 'H=5 ab a=6 reicht nicht');
  return 'Luecken uebersprungen, Ende der Tafel = null';
});

/* ---------- gemeinsame Kunst-Tafel fuer P2/P3/P6/P7/P8: Signaltag = Zeile 251, Basis = 250 Zeilen davor = Zeile 1 ---------- */
var N = K.TEIL4_A_ZEILEN + 2, TG = isoTage(N + 130), tSig = N - 1, ROWS = N + 130;
var SPEC = { tage: TG, reihen: [
  { name: 'SPY', klasse: 3, zeilen: reiheLinear(ROWS, 100, 106, 1, tSig) },   /* +6 % von Zeile 1 bis Zeile 251 */
  { name: 'X', klasse: 1, zeilen: reiheLinear(ROWS, 50, 47.5, 1, tSig) },     /* -5 % gegen +6 % => A, faellt weiter */
  { name: 'Y', klasse: 3, zeilen: reiheLinear(ROWS, 80, 80, 1, tSig) },       /* 0 % => nicht A, bleibt flach */
  { name: 'Z', klasse: 2, zeilen: reiheLinear(ROWS, 100, 96, 1, tSig) },      /* -4 % gegen +6 % = genau -10 Pp => A */
  { name: 'W', klasse: 3, zeilen: reiheLinear(ROWS, 60, 60, 1, tSig) },       /* flach, Leser liefert null (filed = t) */
  { name: 'V', klasse: 2, zeilen: reiheLinear(ROWS, 100, 120, 1, tSig) } ] }; /* +20 % => nicht A, steigt weiter */
function kunstT() { return kunstTafel(SPEC); }
function liste(T, t) { var out = []; [1, 2, 3, 4, 5].forEach(function (s) { var z = T.zeileVon(s, t); out.push({ sym: s, zeile: z, klasse: T.g.klasse[z], naechste: T.zeileVon(s, t + 1), naechsterTag: t + 1 }); }); return out; }
var LESER = kunstLeser({ X: { filed: TG[tSig - 10], abgeleitet: { fm: 0.01 }, sic: 2834, sektor: 'Verarbeitendes Gewerbe' }, Y: { filed: TG[tSig - 10], abgeleitet: { fm: -0.02 }, sic: 6021 },
  Z: { filed: TG[tSig - 10], abgeleitet: { fm: null }, sic: 4911 }, W: { filed: TG[tSig], abgeleitet: { fm: 0.5 }, sic: 7370 },   /* W: filed = t => Leser liefert null */
  V: { filed: TG[tSig - 40], abgeleitet: { fm: 0.3 }, sic: 5012 } });

pruef('T4-P2 A auf der Kunst-Tafel: -5 % gegen SPY +6 % => A; 0 % => nicht A; genau -10 Pp => A (Grenze eingeschlossen)', function () {
  var T = kunstT(), sicht = PR.Sicht(T, tSig, {}), sel = T4.auswahl(sicht, liste(T, tSig), T, LESER, {});
  wahr(sel.ok, 'Auswahl ok'); gleich(sel.rSpy, 6, 1e-9, 'r_SPY');
  var by = {}; sel.liste.forEach(function (e) { by[T.symName[e.sym]] = e; });
  gleich(by.X.r, -5, 1e-9, 'r_X'); gleich(by.Z.r - sel.rSpy, -10, 1e-9, 'Z genau -10 Pp'); gleich(by.V.r, 20, 1e-9, 'r_V');
  wahr(by.Z.r - sel.rSpy <= K.TEIL4_A_SCHWELLE_PP, 'Grenzfall liegt in Gleitkomma auf oder unter der Schwelle: ' + (by.Z.r - sel.rSpy));
  wahr(by.X.istA === true && by.Y.istA === false && by.Z.istA === true && by.W.istA === false && by.V.istA === false, 'A-Zuordnung');
  wahr(sicht.verstoesse() === 0, 'keine Verstoesse');
  return 'X A, Y nicht A, Z A (Grenze ' + (by.Z.r - sel.rSpy) + '), W nicht A, V nicht A';
});
pruef('T4-P3 B mit Kunst-Leser: fm > 0 => B, fm <= 0 => nicht B, fm null => ohne Fundament, filed = t => ohne Fundament (nie nicht-B)', function () {
  var T = kunstT(), sicht = PR.Sicht(T, tSig, {}), sel = T4.auswahl(sicht, liste(T, tSig), T, LESER, {});
  var by = {}; sel.liste.forEach(function (e) { by[T.symName[e.sym]] = e; });
  wahr(by.X.b === 1 && by.Y.b === 0 && by.Z.b === null && by.W.b === null && by.V.b === 1, 'B-Zuordnung ' + JSON.stringify([by.X.b, by.Y.b, by.Z.b, by.W.b, by.V.b]));
  wahr(by.X.sektor === 'Verarbeitendes Gewerbe' && by.Y.sektor === 'Kunst' && by.Z.sektor === null, 'Sektor aus Zeile, sonst sektorVonSic, ohne Fundament null');
  wahr(sel.zaehler.ohneFundament === 2 && sel.zaehler.b === 2 && sel.zaehler.nichtB === 1, 'Zaehler');
  var L0 = kunstLeser({ X: { filed: TG[0], abgeleitet: { fm: 0 }, sic: 1 } }), s0 = T4.auswahl(PR.Sicht(T, tSig, {}), liste(T, tSig), T, L0, {});
  wahr(s0.liste[0].b === 0, 'fm = 0 ist nicht B');
  return 'B / nicht B / ohne / ohne; fm = 0 => nicht B';
});

/* ================= T4-P4: HH-se auf einer Handreihe nimmt genau die Lags 1..L-1 ================= */
pruef('T4-P4 HH-se (Lag 6 => Autokovarianzen 1..5) gegen eine unabhaengige Rechnung, 1e-9; t und MDE folgen', function () {
  /* glatte, positiv autokorrelierte Reihe (ueberlappende Fenster sehen so aus); bei negativer Autokorrelation kann die
   * Rechteck-Langfristvarianz <= 0 werden - dann faellt die Maschine registriert auf die Block-se zurueck (hh0). */
  var e = [0.03, -0.02, 0.05, -0.04, 0.01, 0.02, -0.05, 0.04, -0.01, 0.03, -0.03, 0.02, 0.05, -0.02, -0.04, 0.01, 0.03, -0.05, 0.02, 0.04];
  var x = e.map(function (v, i) { return 0.1 * i + v; });   /* Trend + Rauschen: Autokovarianzen bis Lag 6 positiv */
  var P = x.map(function (v, i) { return { mIdx: 100 + i, x: v }; });
  var r = T4.reihe(P, 'x', 6), n = x.length, m = 0; x.forEach(function (v) { m += v; }); m /= n;
  var c = x.map(function (v) { return v - m; }), g0 = 0; c.forEach(function (v) { g0 += v * v; }); g0 /= n;
  function gam(k) { var s = 0; for (var i = 0; i + k < n; i++) s += c[i] * c[i + k]; return s / n; }
  var lrv5 = g0, lrv6 = g0; for (var k = 1; k <= 5; k++) lrv5 += 2 * gam(k); for (k = 1; k <= 6; k++) lrv6 += 2 * gam(k);
  wahr(lrv5 > 0 && lrv6 > 0, 'Langfristvarianz der Handreihe positiv'); wahr(!r.hh0 && r.se === r.seHH, 'se = HH, kein Block-Rueckfall');
  gleich(r.mittel, m, 1e-12, 'Mittel'); gleich(r.seHH, Math.sqrt(lrv5 / n), 1e-9, 'se HH (Lags 1..5)');
  wahr(Math.abs(r.seHH - Math.sqrt(lrv6 / n)) > 1e-6, 'Lag 6 darf nicht enthalten sein');
  gleich(r.t, m / Math.sqrt(lrv5 / n), 1e-9, 't'); gleich(r.mde, K.MDE_FAKTOR * r.seHH, 1e-12, 'MDE'); gleich(r.mdeBonf, K.TEIL4_MDE_FAKTOR_BONF * r.seHH, 1e-12, 'MDE Bonf');
  var sd = Math.sqrt(g0 * n / (n - 1)); gleich(r.seNaiv, sd / Math.sqrt(n), 1e-9, 'se naiv');
  return 'se HH ' + r.seHH.toFixed(4) + ', se naiv ' + r.seNaiv.toFixed(4) + ', t ' + r.t.toFixed(3);
});

/* ================= T4-P5: Placebo erhaelt die Zahl der B, ist deterministisch je Saat ================= */
pruef('T4-P5 Placebo: |AB| und |AnB| je Monat bleiben, gleiche Saat gleiche Seiten, andere Saat andere', function () {
  var A = []; for (var i = 0; i < 40; i++) A.push({ sym: i, b: i < 15 ? 1 : (i < 34 ? 0 : null) });
  var s1 = T4.placeboSeiten(A, 'saat-a'), s2 = T4.placeboSeiten(A, 'saat-a'), s3 = T4.placeboSeiten(A, 'saat-b');
  wahr(s1.ab.length === 15 && s1.anb.length === 19 && s3.ab.length === 15 && s3.anb.length === 19, 'Zahlen bleiben (ohne Fundament bleibt draussen)');
  wahr(s1.ab.map(function (e) { return e.sym; }).join() === s2.ab.map(function (e) { return e.sym; }).join(), 'deterministisch');
  wahr(s1.ab.map(function (e) { return e.sym; }).join() !== s3.ab.map(function (e) { return e.sym; }).join(), 'andere Saat andere Seiten');
  var orig = A.filter(function (e) { return e.b === 1; }).map(function (e) { return e.sym; }).join();
  wahr(s1.ab.map(function (e) { return e.sym; }).sort(function (a, b) { return a - b; }).join() !== orig, 'permutiert, nicht die Originalmarken');
  return '15/19 erhalten, deterministisch, permutiert';
});

/* ================= T4-P6: Orakel und Korb auf der Kunst-Tafel von Hand ================= */
pruef('T4-P6 Orakel: Gewinner/Verlierer nach Eroeffnung(a)->Eroeffnung(aEnde); Korb eines Mitglieds = o(aEnde)/o(a)-1, Korb aus zweien taeglich gleichgewichtet', function () {
  var T = kunstT(), a = tSig + 1, aE = T4.periodenEnde(T, a, 120), tv = { insolvenz: true };
  var sichtO = PR.Sicht(T, tSig, { orakel: true });
  var A = liste(T, tSig).map(function (e) { return { sym: e.sym, zeile: e.zeile, klasse: e.klasse, naechste: e.naechste, naechsterTag: e.naechsterTag }; });
  var s = T4.orakelSeiten(T, sichtO, A, a, aE);
  var namesG = s.ab.map(function (e) { return T.symName[e.sym]; }).sort().join(), namesV = s.anb.map(function (e) { return T.symName[e.sym]; }).sort().join();
  wahr(namesG === 'V' && namesV === 'W,X,Y,Z', 'V steigt (Gewinner); X, Z fallen, Y, W genau 0 (Verlierer): ' + namesG + ' / ' + namesV);
  wahr(s.ohne === 0, 'alle mit Rendite');
  var kX = T4.korb(T, [A[0]], tSig, a, aE, tv), g = T.g;
  var erwartet = 100 * (g.bEroeffnung[T.zeileVon(1, aE)] / g.bEroeffnung[T.zeileVon(1, a)] - 1);
  gleich(kX.brutto, erwartet, 1e-6, 'Einzelkorb = o(aEnde)/o(a)-1');
  var k2 = T4.korb(T, [A[0], A[2]], tSig, a, aE, tv), f = 1;
  for (var d = a; d <= aE; d++) { var z1 = T.zeileVon(1, d), z3 = T.zeileVon(3, d), r1, r3;
    if (d === a) { r1 = g.renditeOC[z1]; r3 = g.renditeOC[z3]; } else if (d === aE) { r1 = 100 * ((1 + g.rendite[z1] / 100) / (1 + g.renditeOC[z1] / 100) - 1); r3 = 100 * ((1 + g.rendite[z3] / 100) / (1 + g.renditeOC[z3] / 100) - 1); } else { r1 = g.rendite[z1]; r3 = g.rendite[z3]; }
    f *= 1 + (r1 + r3) / 200; }
  gleich(k2.brutto, 100 * (f - 1), 1e-9, 'Zweierkorb taeglich gleichgewichtet');
  wahr(sichtO.verstoesse() === 0, 'mit Schluessel keine Verstoesse');
  return 'Einzelkorb ' + kX.brutto.toFixed(3) + ' %, Zweierkorb ' + k2.brutto.toFixed(3) + ' %';
});

/* ================= T4-P7: Kosten je Seite = mittlere Huerde der Klassen am Signaltag ================= */
pruef('T4-P7 Kosten je Seite = Summe w_i x Huerde(Klasse am Signaltag) = 2 x umschlagKosten aus dem Nichts', function () {
  var T = kunstT(), a = tSig + 1, aE = T4.periodenEnde(T, a, 120), L = liste(T, tSig);
  var k = T4.korb(T, [L[0], L[1]], tSig, a, aE, {});                      /* Klassen 1 und 3 */
  gleich(k.kosten, (K.KLASSEN[1].huerde + K.KLASSEN[3].huerde) / 2, 1e-12, 'Kosten');
  var w = {}; w[L[0].sym] = 0.5; w[L[1].sym] = 0.5;
  gleich(k.kosten, 2 * PR.umschlagKosten(T, {}, w, tSig).kosten, 1e-12, '= 2 x umschlagKosten');
  gleich(k.netto, k.brutto - k.kosten, 1e-12, 'netto');
  return 'Kosten ' + k.kosten.toFixed(5) + ' Pp = (' + K.KLASSEN[1].huerde + ' + ' + K.KLASSEN[3].huerde + ') / 2';
});

/* ================= T4-P8: Sperrklinke des Pruefstands an der eigenen Auswahl ================= */
pruef('T4-P8 Auswahl unter Sicht ohne Schluessel: sauber 0 Verstoesse, praeparierte Fassung (t+1) > 0 und ungueltig', function () {
  var T = kunstT(), s1 = PR.Sicht(T, tSig, {}), s2 = PR.Sicht(T, tSig, {});
  T4.auswahl(s1, liste(T, tSig), T, LESER, {}); T4.auswahl(s2, liste(T, tSig), T, LESER, { leck: true });
  wahr(s1.verstoesse() === 0, 'sauber 0'); wahr(s2.verstoesse() === 5, 'praepariert 5 (je Mitglied einer): ' + s2.verstoesse());
  wahr(s2.beispiele().length > 0, 'Beispiele');
  return 'sauber 0, praepariert ' + s2.verstoesse();
});

/* ================= T4-P9: Leser-Klinke mit praepariertem Filing (echter Leser, nur mit Tafel auf der Platte) ================= */
pruef('T4-P9 Leser: klinke(sym, tag, {filed: tag}) wirft, {filed: tag-1} liefert; fundamentalAm am Einreichungstag null, am Folgetag Zeile', function () {
  var FL = require(K.FUNDAMENTAL_LESER), ordner = opt.tafel || path.join(path.dirname(K.FUNDAMENTAL_LESER), 'fundamentaltafel');
  if (!fs.existsSync(path.join(ordner, '_reihen.json'))) return 'skip';
  var F = FL.oeffne(ordner, { maxAlterTage: K.TEIL4_FUNDAMENT_MAX_ALTER_TAGE });
  var geworfen = false; try { F.klinke('AAPL', '2024-05-06', { filed: '2024-05-06', adsh: 'probe' }); } catch (e) { geworfen = /Leck/.test(e.message); }
  wahr(geworfen, 'filed = tag muss werfen');
  var r = F.klinke('AAPL', '2024-05-06', { filed: '2024-05-05', adsh: 'probe' }); wahr(r && r.filed === '2024-05-05', 'filed = tag-1 liefert');
  var alle = F.alleFilings('AAPL'); wahr(alle.length > 10, 'AAPL hat Filings');
  var z = alle[Math.floor(alle.length / 2)];
  var amTag = F.fundamentalAm('AAPL', z.filed), naechster = new Date(Date.parse(z.filed + 'T12:00:00Z') + 86400000).toISOString().slice(0, 10), danach = F.fundamentalAm('AAPL', naechster);
  wahr(!amTag || amTag.filed < z.filed, 'am Einreichungstag nicht das Filing selbst');
  wahr(danach && danach.filed === z.filed, 'am Folgetag genau dieses Filing');
  var v = 0; F.protokoll().forEach(function (p) { if (p.filed != null && !(p.filed < p.tag)) v++; });
  wahr(v === 1, 'genau der eine praeparierte Verstoss im Protokoll: ' + v);
  return F.kennung + ', ' + F.zeilen + ' Zeilen; ' + z.adsh + ' filed ' + z.filed + ' erst am ' + naechster;
});

/* ================= T4-P10 / P12: Ergebnisdatei ================= */
function ergebnis() { if (!opt.ergebnis || !fs.existsSync(opt.ergebnis)) return null; return JSON.parse(fs.readFileSync(opt.ergebnis, 'utf8')); }
pruef('T4-P10 Ergebnis: Urteil folgt der Regel §T4.6 aus den eigenen Zahlen; MDE = Faktor x se; n konsistent; Kontrollen mit Schranken', function () {
  var E = ergebnis(); if (!E) return 'skip';
  var H = E.test1.h120, r = H.netto, u = E.urteil;
  wahr(H.n === E.monate.filter(function (m) { return m.h120.test1; }).length && r.n === H.n, 'n Test 1');
  gleich(r.mde, K.MDE_FAKTOR * r.se, 1e-9, 'MDE'); gleich(r.mdeBonf, K.TEIL4_MDE_FAKTOR_BONF * r.se, 1e-9, 'MDE Bonf');
  var P = H.monate.map(function (m) { return { mIdx: m.mIdx, x: m.dNetto }; }), rr = T4.reihe(P, 'x', 6);
  gleich(rr.mittel, r.mittel, 1e-9, 'Mittel nachgerechnet'); gleich(rr.se, r.se, 1e-9, 'se nachgerechnet');
  var s = 0; E.monate.forEach(function (m) { if (m.h120.test1) s += m.h120.test1.ab.netto - m.h120.test1.anb.netto; }); gleich(s / H.n, r.mittel, 1e-9, 'Mittel = Mittel der Monatsdifferenzen');
  var tore = E.leck.bestanden && E.klinkePruefstand.bestanden && E.leser.bestanden && E.kontrollen.placebo.bestanden && E.kontrollen.orakel.bestanden && E.vorpruefung.bestanden;
  wahr(u.toreMaschine === tore, 'Tore');
  var belegt = tore && r.mittel >= r.mde && r.t >= K.TEIL4_BONFERRONI_T && H.aktuell.n > 0 && H.aktuell.mittel >= 0;
  wahr(u.test1.belegt === belegt, 'belegt-Regel'); wahr(/belegt/.test(u.satz) && (belegt || /nichts oberhalb von/.test(u.satz)), 'Satz');
  wahr(fs.existsSync(path.join(__dirname, 'kandidaten-teil4')) === belegt, 'Kandidatenordner genau dann, wenn belegt');
  var pl = E.kontrollen.placebo, plOk = Math.abs(pl.mittelBrutto) < pl.schrankePp && Math.abs(pl.mittelNetto) < pl.schrankePp && pl.fehlerEinzelnT <= pl.maxFehler;
  wahr(pl.bestanden === plOk && pl.einzeln.length === K.TEIL4_PLACEBO.ziehungen, 'Placebo-Regel');
  var o = E.kontrollen.orakel, oOk = o.brutto.mittel >= K.TEIL4_ORAKEL.minPp && o.brutto.mittelDurchSd >= K.TEIL4_ORAKEL.minSd && o.brutto.t >= K.TEIL4_ORAKEL.tBoden;
  wahr(o.bestanden === oOk, 'Orakel-Regel'); wahr(!E.leser.bestanden || E.leser.verstoesse === 0, 'Leser 0 Verstoesse');
  var vp = E.vorpruefung, vOk = true; Object.keys(vp.faktoren).forEach(function (k) { var f = vp.faktoren[k]; if (!(f != null && f <= 1.5 && f >= 1 / 1.5)) vOk = false; });
  wahr(vp.bestanden === vOk, 'Vorpruefung-Regel');
  return 'n ' + H.n + ', Delta ' + r.mittel.toFixed(3) + ', MDE ' + r.mde.toFixed(3) + ', belegt ' + belegt;
});
pruef('T4-P11 test.js (67: 47 + 20 der Panel-Reparatur v2), test-teil2.js (20), test-teil3.js (15) laufen nach dem Konfig-Block gruen', function () {
  if (!opt.maschine || !opt.aus) return 'skip';
  var ref = 'C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/referenz/F-F_Momentum_Factor.csv';
  var r1 = cp.spawnSync(process.execPath, ['--max-old-space-size=6144', path.join(__dirname, 'test.js'), '--aus', opt.aus, '--kunst', 'kunst'], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 });
  var m1 = /(\d+) Pruefungen, (\d+) rot/.exec(r1.stdout || '');
  /* 67 seit der Panel-Reparatur v2 (18.09.2026): Abschnitte 14-16 (Faktor-Roundtrip, Kuerzelwechsel, echtes Panel). */
  if (!m1 || +m1[2] !== 0 || +m1[1] !== 67) throw new Error('test.js: ' + (m1 ? m1[0] : 'keine Summenzeile') + (r1.stderr ? ' / ' + r1.stderr.slice(0, 200) : ''));
  var r2 = cp.spawnSync(process.execPath, [path.join(__dirname, 'test-teil2.js'), '--referenz', ref, '--kandidaten', path.join(opt.aus, 'kandidaten-voll.json'), '--momentum', path.join(__dirname, 'momentum-perioden.json')], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 });
  var m2 = /gruen (\d+), rot (\d+)/.exec(r2.stdout || '');
  if (!m2 || +m2[2] !== 0 || +m2[1] !== 20) throw new Error('test-teil2.js: ' + (m2 ? m2[0] : 'keine Summenzeile'));
  var r3 = cp.spawnSync(process.execPath, ['--max-old-space-size=6144', path.join(__dirname, 'test-teil3.js'), '--aus', opt.aus, '--ergebnis', path.join(__dirname, 'teil3-ergebnis.json'), '--zielportfolio', path.join(__dirname, 'zielportfolio', 'momentum-v0')], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 });
  /* test-teil3 ohne --maschine: 14 Kunst-/Datenpruefungen gruen, T3-P11 (startet selbst test.js/test-teil2) uebersprungen -
   * die beiden laufen hier ohnehin direkt. */
  var m3 = /gruen (\d+), rot (\d+)/.exec(r3.stdout || '');
  if (!m3 || +m3[2] !== 0 || +m3[1] < 14) throw new Error('test-teil3.js: ' + (m3 ? m3[0] : 'keine Summenzeile'));
  return 'test.js 47/0, test-teil2.js 20/0, test-teil3.js ' + m3[1] + '/0 rot (T3-P11 dort uebersprungen)';
});
pruef('T4-P12 Sektorname jedes Sektor-Eintrags liegt in den SIC-Divisionen oder ist "unbekannt"', function () {
  var E = ergebnis(); if (!E) return 'skip';
  var Z = require(path.join(path.dirname(K.FUNDAMENTAL_LESER), 'zuordnung.js')), namen = {}; Z.SIC_DIVISIONEN.forEach(function (d) { namen[d.name] = true; }); namen.unbekannt = true;
  var fremd = []; ['h120', 'h250'].forEach(function (h) { Object.keys(E.test1[h].sektoren).forEach(function (n) { if (!namen[n]) fremd.push(n); }); });
  E.monate.forEach(function (m) { Object.keys(m.sektorenA).forEach(function (n) { if (!namen[n]) fremd.push(n); }); });
  wahr(fremd.length === 0, 'fremde Sektoren: ' + fremd.slice(0, 5).join(', '));
  return Object.keys(E.test1.h120.sektoren).length + ' Sektoren im Hauptfenster';
});

process.stdout.write(zeilen.join('\n') + '\n\n');
process.stdout.write('gruen ' + gruen + ', rot ' + rot + ', uebersprungen ' + uebersprungen + '\n');
var lauf = { stand: new Date().toISOString(), ergebnis: opt.ergebnis || null, gruen: gruen, rot: rot, uebersprungen: uebersprungen, zeilen: zeilen };
fs.writeFileSync(path.join(__dirname, 'test-lauf-teil4.json'), JSON.stringify(lauf, null, 1));
process.exit(rot ? 1 : 0);
