'use strict';
/* PRUEFUNGEN zu TEIL 3 (VORREGISTRIERUNG-TEIL3.md §T3.9), zusaetzlich zu 47 (Teil 1) + 20 (Teil 2).
 *
 * Aufruf:  node --max-old-space-size=6144 test-teil3.js [--aus voll] [--ergebnis teil3-ergebnis.json]
 *                                                       [--zielportfolio zielportfolio/momentum-v0] [--maschine]
 *
 * Kunstfaelle (T3-P0, P2..P6, P9) laufen immer. --aus laedt die Tafel fuer T3-P1/P8/P12 (unabhaengig vom
 * Laeufer nachgerechnet), --ergebnis fuer T3-P7, --zielportfolio fuer T3-P10, --maschine startet test.js und
 * test-teil2.js als Kindprozesse (T3-P11). Ohne die Daten: "uebersprungen". Rot ist rot.
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var K = require('./konfig.js');
var PR = require('./pruefstand.js');
var RF = require('./rangfunktionen.js');
var VA = require('./varianten.js');

var gruen = 0, rot = 0, uebersprungen = 0, zeilen = [];
function pruef(name, fn) {
  try {
    var r = fn();
    if (r === 'skip') { uebersprungen++; zeilen.push('  -  ' + name + ' (uebersprungen)'); return; }
    gruen++; zeilen.push(' OK  ' + name + (r ? ' - ' + r : ''));
  } catch (e) { rot++; zeilen.push('ROT  ' + name + ' - ' + e.message); }
}
function gleich(a, b, eps, was) { if (!(Math.abs(a - b) <= eps)) throw new Error((was || '') + ' ' + a + ' != ' + b + ' (eps ' + eps + ')'); }
var argv = process.argv.slice(2), opt = {};
for (var ai = 0; ai < argv.length; ai++) {
  if (argv[ai] === '--aus') opt.aus = argv[++ai]; else if (argv[ai] === '--ergebnis') opt.ergebnis = argv[++ai];
  else if (argv[ai] === '--zielportfolio') opt.zielportfolio = argv[++ai]; else if (argv[ai] === '--maschine') opt.maschine = true;
}

/* ---------- Kunst-Tafel: genau so viel, wie die Ueberlagerung anfasst ---------- */
function kunstTafel(spec) {
  var rows = [];
  spec.reihen.forEach(function (r, s) { Object.keys(r.zeilen).map(Number).sort(function (a, b) { return a - b; }).forEach(function (d) { rows.push({ tag: d, sym: s, cc: r.zeilen[d].cc, oc: r.zeilen[d].oc, klasse: r.klasse }); }); });
  rows.sort(function (a, b) { return a.tag - b.tag || a.sym - b.sym; });
  var n = rows.length, g = { n: n, tag: new Int32Array(n), sym: new Uint16Array(n), klasse: new Int8Array(n), rendite: new Float32Array(n), renditeOC: new Float32Array(n), bSchluss: new Float64Array(n), bEroeffnung: new Float64Array(n) };
  var key = {}, letzte = {};
  rows.forEach(function (r, i) { g.tag[i] = r.tag; g.sym[i] = r.sym; g.klasse[i] = r.klasse; g.rendite[i] = r.cc; g.renditeOC[i] = r.oc; g.bSchluss[i] = 100; g.bEroeffnung[i] = 100; key[r.sym + '@' + r.tag] = i; letzte[r.sym] = i; });
  var idx = {}; spec.tage.forEach(function (t, i) { idx[t] = i; });
  var symIdx = {}; spec.reihen.forEach(function (r, s) { symIdx[r.name] = s; });
  return { g: g, kal: { tage: spec.tage, idx: idx }, maxTag: spec.tage.length - 1,
    zeileVon: function (s, t) { var k = key[s + '@' + t]; return k === undefined ? -1 : k; },
    letzteZeile: function (s) { return letzte[s] === undefined ? -1 : letzte[s]; },
    endeGrund: spec.reihen.map(function (r) { return r.grund || null; }), symName: spec.reihen.map(function (r) { return r.name; }), symIdx: symIdx };
}
function tage10() { var t = []; for (var i = 0; i < 10; i++) t.push('2020-01-' + String(i + 1).padStart(2, '0')); return t; }
function zeilenAlle(n, cc, oc) { var z = {}; for (var i = 0; i < n; i++) z[i] = { cc: cc, oc: oc }; return z; }
function periode(t, a, aEnde, tage, N, mitglieder) {
  var eg = {}; mitglieder.forEach(function (s) { eg[s] = 1 / N; });
  return { t: t, a: a, aEnde: aEnde, k: N, nUni: N, long: { N: N, mitglieder: mitglieder, endGewichte: eg, tage: tage, periode: null }, kosten: {}, uni: {} };
}
var H3 = K.KLASSEN[3].huerde, H1 = K.KLASSEN[1].huerde;

/* ================= T3-P0: MDE-Faktor unabhaengig ================= */
pruef('T3-P0 MDE-Faktor 2.8016 = z(0.975) + z(0.80), unabhaengig ueber erf-Naeherung und Bisektion', function () {
  function erf(x) { var s = x < 0 ? -1 : 1; x = Math.abs(x); var t = 1 / (1 + 0.3275911 * x); return s * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x)); }
  function phi(z) { return 0.5 * (1 + erf(z / Math.SQRT2)); }
  function quantil(p) { var lo = -10, hi = 10; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2; }
  var z1 = quantil(0.975), z2 = quantil(0.80);
  gleich(z1 + z2, K.MDE_FAKTOR, 2e-4, 'z-Summe');
  return 'z(0.975) ' + z1.toFixed(5) + ' + z(0.80) ' + z2.toFixed(5) + ' = ' + (z1 + z2).toFixed(5);
});

/* ================= T3-P2 / T3-P4a: Kunstfall V1 mit Regimewechsel mitten in der Periode ================= */
function kunstV1() {
  var T = kunstTafel({ tage: tage10(), reihen: [{ name: 'X', klasse: 3, zeilen: zeilenAlle(10, 1.0, 0.5) }] });
  var L = { empfindlichkeit: 'haupt', perioden: [
    periode(0, 1, 4, [{ tag: 1, r: 1.0 }, { tag: 2, r: 2.0 }, { tag: 3, r: -1.0 }, { tag: 4, r: 0.5 }], 1, [0]),
    periode(3, 4, 7, [{ tag: 4, r: 0.0 }, { tag: 5, r: 1.0 }, { tag: 6, r: 1.0 }, { tag: 7, r: 0.0 }], 1, [0]),
    periode(6, 7, 9, [{ tag: 7, r: 1.0 }, { tag: 8, r: 1.0 }, { tag: 9, r: 0.0 }], 1, [0]) ] };
  var regime = { 0: 1, 1: 1, 2: 1, 3: 1, 4: 0, 5: 0, 6: 1, 7: 1, 8: 1, 9: 1 };
  return { T: T, L: L, regime: regime };
}
pruef('T3-P2 Kunstfall V1: Wechsel zum Schluss von Tag 4 -> Nacht 4/5 alt, Tag 5 neu; Kosten und Umschlag von Hand', function () {
  var k = kunstV1(), R = VA.fahre(k.T, k.L, { variante: 'v1', regime: k.regime });
  if (R.verstoesse !== 0 || R.ungueltig) throw new Error('sauberer Lauf meldet Verstoesse');
  var co = 100 * ((1 + 1.0 / 100) / (1 + 0.5 / 100) - 1);                      /* Nacht aus cc 1.0 und oc 0.5 */
  var kost = 0.5 * 1 * H3;                                                      /* Vollkauf/-verkauf eines Papiers der Klasse ab1000 */
  var erwartet = { 1: [1.0, kost], 2: [2.0, 0], 3: [-1.0, 0], 4: [0.5, 0], 5: [co, kost], 6: [0, 0], 7: [1.0, kost], 8: [1.0, 0], 9: [0, 0] };
  if (R.tage.length !== 9) throw new Error('9 Tage erwartet, ' + R.tage.length);
  R.tage.forEach(function (x) { var e = erwartet[x.tag]; gleich(x.brutto, e[0], 1e-9, 'brutto Tag ' + x.tag); gleich(x.kosten, e[1], 1e-12, 'kosten Tag ' + x.tag); gleich(x.netto, e[0] - e[1], 1e-9, 'netto Tag ' + x.tag); });
  var e5 = R.tage.filter(function (x) { return x.tag === 5; })[0], e4 = R.tage.filter(function (x) { return x.tag === 4; })[0];
  if (e4.einsatz !== 1 || e5.einsatz !== 0) throw new Error('Einsatz am Wechseltag: Tag 4 ' + e4.einsatz + ', Tag 5 ' + e5.einsatz);
  var B = R.perioden[1];
  gleich(B.brutto, co, 1e-9, 'Periode B brutto'); gleich(B.kostenGesamt, kost, 1e-12, 'Periode B Kosten'); gleich(B.umschlagGesamt, 0.5, 1e-12, 'Periode B Umschlag');
  if (B.schaltungen !== 1 || B.einsatz !== 1 || B.einsatzEnde !== 0) throw new Error('Periode B: Schaltungen ' + B.schaltungen + ', Einsatz ' + B.einsatz + ' -> ' + B.einsatzEnde);
  var A = R.perioden[0]; gleich(A.brutto, 100 * (1.01 * 1.02 * 0.99 * 1.005 - 1), 1e-9, 'Periode A brutto'); gleich(A.umschlagGesamt, 0.5, 1e-12, 'A Umschlag');
  /* Periode C hat drei Tage (oc 1.0, cc 1.0, co 0): (1.01 * 1.01 - 1) - die erste Fassung dieser Zeile erwartete 1.0
   * und war damit selbst falsch (Handrechnung), nicht die Ueberlagerung; die Tageswerte darueber waren gruen. */
  var C = R.perioden[2]; gleich(C.brutto, 100 * (1.01 * 1.01 - 1), 1e-9, 'Periode C brutto'); gleich(C.kostenGesamt, kost, 1e-12, 'C Kosten (Wiedereinstieg)');
  if (R.schaltungen.length !== 1 || R.schaltungen[0].entscheidTag !== 4 || R.schaltungen[0].wirkTag !== 5) throw new Error('Schaltung falsch datiert');
  gleich(R.grenztagAbweichungMax, 0, 1e-9, 'Grenztag-Kontrolle');
  return 'Nacht ' + co.toFixed(6) + ' Pp alt, Tag 0.5 x 0 neu; Kosten 3 x ' + kost.toFixed(5) + ' Pp; Umschlag 0.5/0.5/0.5';
});
pruef('T3-P2b derselbe Kunstfall als V0 ist ungeschaltet: Tag 5 = 1.0, keine Schaltung, Periode B kostenfrei', function () {
  var k = kunstV1(), R = VA.fahre(k.T, k.L, { variante: 'v0', regime: k.regime });
  var t5 = R.tage.filter(function (x) { return x.tag === 5; })[0];
  gleich(t5.brutto, 1.0, 1e-9, 'Tag 5'); gleich(R.perioden[1].kostenGesamt, 0, 1e-12, 'B Kosten'); gleich(R.perioden[1].umschlagGesamt, 0, 1e-12, 'B Umschlag');
  if (R.schaltungen.length) throw new Error('V0 hat geschaltet');
  return 'V0 unveraendert';
});

/* ================= T3-P3 / T3-P4b: Kunstfall V2 ================= */
function kunstV2(tSignal) {
  var tage = []; for (var i = 0; i < 64; i++) tage.push('2020-03-' + String(i + 1).padStart(2, '0'));
  var T = kunstTafel({ tage: tage, reihen: [{ name: 'X', klasse: 3, zeilen: zeilenAlle(64, 0, 0) }] });
  var L = { empfindlichkeit: 'haupt', perioden: [periode(tSignal, tSignal + 1, tSignal + 3, [{ tag: tSignal + 1, r: 0 }, { tag: tSignal + 2, r: 0 }, { tag: tSignal + 3, r: 0 }], 1, [0])] };
  var v0 = []; for (var d = 0; d <= 61; d++) v0.push({ tag: d, brutto: d === 61 ? 50 : (d % 2 ? -1 : 1), netto: 0, kosten: 0, einsatz: 1 });
  return { T: T, L: L, v0: v0 };
}
pruef('T3-P3 Kunstfall V2: 60 Tage +-1 bis t => sigma sqrt(60/59)*sqrt(252) = 16.0085 %, e = 0.93700; Tag t+1 (+50) bleibt draussen', function () {
  var k = kunstV2(60), R = VA.fahre(k.T, k.L, { variante: 'v2', regime: {}, v0Tage: k.v0 });
  var sigma = Math.sqrt(60 / 59) * Math.sqrt(252), e = 15 / sigma;
  gleich(R.perioden[0].sigma, sigma, 1e-9, 'sigma'); gleich(R.perioden[0].einsatz, e, 1e-12, 'e');
  if (R.verstoesse !== 0 || R.anlauf !== 0) throw new Error('Verstoesse ' + R.verstoesse + ', Anlauf ' + R.anlauf);
  gleich(R.perioden[0].kostenGesamt, 0.5 * e * H3, 1e-12, 'Kosten des Teileinstiegs');
  return 'sigma ' + sigma.toFixed(4) + ', e ' + e.toFixed(5) + ', Kosten 0.5 x e x h';
});
pruef('T3-P3b Anlaufregel: weniger als 60 V0-Tage => e = 1 und Anlauf gezaehlt', function () {
  var k = kunstV2(30), R = VA.fahre(k.T, k.L, { variante: 'v2', regime: {}, v0Tage: k.v0 });
  if (R.perioden[0].einsatz !== 1 || R.anlauf !== 1 || !R.perioden[0].anlauf) throw new Error('e ' + R.perioden[0].einsatz + ', Anlauf ' + R.anlauf);
  return 'e = 1, Anlauf 1';
});
pruef('T3-P4 Sperrklinke der Ueberlagerung: praeparierte V1- und V2-Faelle melden Verstoesse und ungueltig, saubere Laeufe 0', function () {
  var k1 = kunstV1(), P1 = VA.fahre(k1.T, k1.L, { variante: 'v1', regime: k1.regime, leckRegime: true });
  var k2 = kunstV2(60), P2 = VA.fahre(k2.T, k2.L, { variante: 'v2', regime: {}, v0Tage: k2.v0, leckVol: true });
  if (!(P1.verstoesse > 0) || !P1.ungueltig) throw new Error('V1 praepariert: ' + P1.verstoesse + ' Verstoesse, ungueltig ' + P1.ungueltig);
  if (!(P2.verstoesse > 0) || !P2.ungueltig) throw new Error('V2 praepariert: ' + P2.verstoesse + ' Verstoesse, ungueltig ' + P2.ungueltig);
  if (P2.perioden[0].sigma !== null) throw new Error('V2 praepariert hat trotz Verweigerung ein sigma gerechnet');
  var S1 = VA.fahre(k1.T, k1.L, { variante: 'v3', regime: k1.regime, v0Tage: k2.v0 });
  if (S1.verstoesse !== 0 || S1.ungueltig) throw new Error('sauberer V3-Lauf meldet ' + S1.verstoesse);
  return 'V1 praepariert ' + P1.verstoesse + ' Verstoesse (' + P1.beispiele[0] + '), V2 praepariert ' + P2.verstoesse + ', sauber 0';
});

/* ================= T3-P5: Rueckgang, Fenster, Sharpe ================= */
pruef('T3-P5 Max. Rueckgang 100->120->90->130 = 25 %; schlechtestes 12er-Fenster; Sharpe von Hand', function () {
  var tage = [{ tag: 1, netto: 20 }, { tag: 2, netto: -25 }, { tag: 3, netto: 130 / 90 * 100 - 100 }];
  var m = VA.maxRueckgang(tage, 'netto'); gleich(m.mdd, 25, 1e-9, 'MDD'); if (m.spitzeTag !== 1 || m.talTag !== 2) throw new Error('Spitze/Tal falsch');
  var w = [1]; for (var i = 0; i < 12; i++) w.push(-1); w.push(1);
  var f = VA.schlechtestesFenster(w, 12); gleich(f.wert, 100 * (Math.pow(0.99, 12) - 1), 1e-9, 'Fenster'); if (f.von !== 1) throw new Error('Fensterbeginn ' + f.von);
  var r = []; for (var j = 0; j < 24; j++) r.push(j % 2 ? 3 : 1);
  var sd = Math.sqrt(24 / 23), erwartet = (2 * 12) / (sd * Math.sqrt(12));
  gleich(VA.sharpe(r), erwartet, 1e-9, 'Sharpe');
  return 'MDD 25 %, Fenster ' + f.wert.toFixed(4) + ' %, Sharpe ' + erwartet.toFixed(4);
});

/* ================= T3-P6: Kosten skalierter Gewichte ================= */
pruef('T3-P6 Vollliquidation kostet 0.5 * sum(w_i h_i); Einsatz 1 -> 0.6 genau 0.4 davon', function () {
  var T = kunstTafel({ tage: tage10(), reihen: [{ name: 'A', klasse: 1, zeilen: zeilenAlle(10, 0, 0) }, { name: 'B', klasse: 3, zeilen: zeilenAlle(10, 0, 0) }] });
  var w = { 0: 0.5, 1: 0.5 }, voll = 0.5 * (0.5 * H1 + 0.5 * H3);
  var k1 = PR.umschlagKosten(T, VA.skaliere(w, 1), VA.skaliere(w, 0), 3);
  gleich(k1.kosten, voll, 1e-12, 'voll'); gleich(k1.umschlag, 0.5, 1e-12, 'Umschlag voll');
  var k2 = PR.umschlagKosten(T, VA.skaliere(w, 1), VA.skaliere(w, 0.6), 3);
  gleich(k2.kosten, 0.4 * voll, 1e-12, 'teil'); gleich(k2.umschlag, 0.2, 1e-12, 'Umschlag teil');
  return 'voll ' + voll.toFixed(6) + ' Pp, 1 -> 0.6: ' + (0.4 * voll).toFixed(6) + ' Pp';
});

/* ================= T3-P9: Krisenfenster ================= */
pruef('T3-P9 Krisenfenster enthalten 3 / 3 / 8 / 10 Kalendermonate', function () {
  function monate(von, bis) { var n = 0, m = von; while (m <= bis) { n++; var p = m.split('-'); var j = +p[0], mm = +p[1]; mm++; if (mm > 12) { mm = 1; j++; } m = j + '-' + String(mm).padStart(2, '0'); } return n; }
  var soll = [3, 3, 8, 10];
  K.KRISEN.forEach(function (kr, i) { if (monate(kr.von, kr.bis) !== soll[i] || kr.monate !== soll[i]) throw new Error(kr.key + ': ' + monate(kr.von, kr.bis) + ' Monate'); });
  return K.KRISEN.map(function (kr) { return kr.key + ' ' + kr.monate; }).join(', ');
});

/* ================= Mit Tafel: T3-P1, T3-P8, T3-P12 ================= */
var TAFEL = null, L0 = null;
function tafel() {
  if (!opt.aus) return null;
  if (!TAFEL) { TAFEL = PR.Tafel(opt.aus); L0 = PR.lauf(TAFEL, RF.momentum12_1, { freq: 'monat', empfindlichkeit: 'haupt', klassen: K.UNIVERSUM_KLASSEN_TEIL3 }); }
  return TAFEL;
}
pruef('T3-P1 V0 als Ueberlagerung (e = 1) reproduziert die Tagesreihe der Maschine (brutto/netto 1e-9), Perioden brutto (1e-9), Kosten (1e-12)', function () {
  var T = tafel(); if (!T) return 'skip';
  var B0 = PR.bewerte(TAFEL, L0, { regime: PR.spyRegime(TAFEL) });
  var R = VA.fahre(TAFEL, L0, { variante: 'v0', regime: {} });
  var idx = {}; B0.tagesreihen.long.forEach(function (x) { idx[x.tag] = x; });
  if (R.tage.length !== B0.tagesreihen.long.length) throw new Error('Tage ' + R.tage.length + ' != ' + B0.tagesreihen.long.length);
  var mb = 0, mn = 0, mk = 0;
  R.tage.forEach(function (x) { var m = idx[x.tag]; if (!m) throw new Error('Tag fehlt ' + x.tag); mb = Math.max(mb, Math.abs(x.brutto - m.brutto)); mn = Math.max(mn, Math.abs(x.netto - m.netto)); mk = Math.max(mk, Math.abs(x.kosten - m.kosten)); });
  if (mb > 1e-9 || mn > 1e-9 || mk > 1e-12) throw new Error('Abweichung brutto ' + mb + ', netto ' + mn + ', Kosten ' + mk);
  var mp = 0, mpk = 0;
  L0.perioden.forEach(function (p, j) { mp = Math.max(mp, Math.abs(p.long.periode - R.perioden[j].brutto)); mpk = Math.max(mpk, Math.abs(p.kosten.long.kosten - R.perioden[j].kosten)); });
  if (mp > 1e-9 || mpk > 1e-12) throw new Error('Perioden: brutto ' + mp + ', Kosten ' + mpk);
  return R.tage.length + ' Tage, ' + R.perioden.length + ' Perioden, max |Abw| ' + mb.toExponential(1) + ' / ' + mn.toExponential(1) + ' / ' + mp.toExponential(1);
});
pruef('T3-P8 jedes Dezilmitglied hat Klasse 1/2/3, SPY nie darunter; K.UNIVERSUM_KLASSEN unveraendert [2, 3]', function () {
  if (JSON.stringify(K.UNIVERSUM_KLASSEN) !== '[2,3]') throw new Error('UNIVERSUM_KLASSEN ist ' + JSON.stringify(K.UNIVERSUM_KLASSEN));
  if (JSON.stringify(K.UNIVERSUM_KLASSEN_TEIL3) !== '[1,2,3]') throw new Error('UNIVERSUM_KLASSEN_TEIL3 ist ' + JSON.stringify(K.UNIVERSUM_KLASSEN_TEIL3));
  var T = tafel(); if (!T) return 'skip';
  var spy = TAFEL.symIdx['SPY'], n = 0, z = { 1: 0, 2: 0, 3: 0 };
  L0.perioden.forEach(function (p) { p.long.mitglieder.forEach(function (s) { n++; if (s === spy) throw new Error('SPY im Dezil'); var zl = TAFEL.zeileVon(s, p.t); var kl = zl >= 0 ? TAFEL.g.klasse[zl] : -1; if (z[kl] === undefined) throw new Error('Klasse ' + kl + ' im Dezil'); z[kl]++; }); });
  return n + ' Mitgliedschaften, Klassen 50-250/250-1000/ab1000: ' + z[1] + '/' + z[2] + '/' + z[3];
});
pruef('T3-P12 momentum12_1/monat mit klassen [2, 3] liefert die Teil-2-Zahl des Panels (K.REGRESSION23_ERWARTET je Kennung, v1 +1.609984 Pp, 1e-9)', function () {
  var T = tafel(); if (!T) return 'skip';
  var L = PR.lauf(TAFEL, RF.momentum12_1, { freq: 'monat', empfindlichkeit: 'haupt', klassen: [2, 3] });
  var B = PR.bewerte(TAFEL, L, { regime: PR.spyRegime(TAFEL) });
  var n = PR.kennzahlen(B.haupt.perioden, null, 21, 'netto').mittel;
  var erw = K.REGRESSION23_ERWARTET[TAFEL.stand.kennung];
  if (erw == null) throw new Error('keine Teil-2-Erwartung fuer Panel ' + TAFEL.stand.kennung + ' (K.REGRESSION23_ERWARTET)');
  gleich(n, erw, 1e-9, 'netto');
  var L2 = PR.lauf(TAFEL, RF.momentum12_1, { freq: 'monat', empfindlichkeit: 'haupt' });
  var n2 = PR.kennzahlen(PR.bewerte(TAFEL, L2, { regime: PR.spyRegime(TAFEL) }).haupt.perioden, null, 21, 'netto').mittel;
  gleich(n2, n, 0, 'Vorgabe = [2,3]');
  return 'netto ' + n.toFixed(9) + ' Pp, mit und ohne opt.klassen identisch';
});

/* ================= Mit Ergebnisdatei: T3-P7 ================= */
pruef('T3-P7 gepaarte Differenzreihe: gleiche n und Monate wie V0; Mittel der Differenzen = Differenz der Mittel', function () {
  if (!opt.ergebnis || !fs.existsSync(opt.ergebnis)) return 'skip';
  var E = JSON.parse(fs.readFileSync(opt.ergebnis, 'utf8')), aus = [];
  ['v1', 'v2', 'v3'].forEach(function (v) {
    var m0 = E.varianten.v0.monate, mv = E.varianten[v].monate, p = E.paare[v];
    if (mv.length !== m0.length || p.n !== m0.length) throw new Error(v + ': n ' + mv.length + '/' + p.n + ' != ' + m0.length);
    var s = 0; mv.forEach(function (m, i) { if (m.monat !== m0[i].monat) throw new Error(v + ': Monat ' + m.monat + ' != ' + m0[i].monat); s += m.netto - m0[i].netto; });
    gleich(s / mv.length, p.monatsdifferenz.mittel, 1e-9, v + ' Mittel');
    gleich(s / mv.length, E.varianten[v].kennzahlen.netto.mittel - E.varianten.v0.kennzahlen.netto.mittel, 1e-9, v + ' Differenz der Mittel');
    aus.push(v + ' ' + (s / mv.length).toFixed(4));
  });
  return aus.join(', ') + ' Pp je Monat ueber ' + E.varianten.v0.monate.length + ' Monate';
});

/* ================= Mit Zielportfolio: T3-P10 ================= */
pruef('T3-P10 Zielportfolio-Dateien: Gewichte summieren zum Einsatz, N = Dezilgroesse, Klassen 50-250/250-1000/ab1000, Daten aus dem Lauf', function () {
  if (!opt.zielportfolio || !fs.existsSync(opt.zielportfolio) || !opt.ergebnis) return 'skip';
  var E = JSON.parse(fs.readFileSync(opt.ergebnis, 'utf8'));
  var dateien = fs.readdirSync(opt.zielportfolio).filter(function (f) { return /\.json$/.test(f); });
  if (!dateien.length) throw new Error('keine Dateien');
  var v = E.zielportfolio.variante, tage = {}; E.perioden.forEach(function (p) { tage[p.ausfuehrungstag] = p; });
  var schalt = {}; E.varianten[v].schaltungen.forEach(function (s) { schalt[s.wirkTag] = s; });
  var erlaubt = { '50-250': 1, '250-1000': 1, 'ab1000': 1 }, nU = 0, nS = 0;
  dateien.forEach(function (f) {
    var d = JSON.parse(fs.readFileSync(path.join(opt.zielportfolio, f), 'utf8'));
    if (d.datum + '.json' !== f) throw new Error(f + ': Datum ' + d.datum);
    var s = 0; d.positionen.forEach(function (p) { s += p.gewicht; if (!erlaubt[p.klasse]) throw new Error(f + ': Klasse ' + p.klasse); });
    gleich(s, d.einsatzquote, 1e-9, f + ' Gewichtssumme');
    if (d.positionen.length !== d.n) throw new Error(f + ': ' + d.positionen.length + ' Positionen, n ' + d.n);
    if (d.anlass === 'umschichtung') { var p = tage[d.datum]; if (!p || p.N !== d.n || p.signaltag !== d.signaltag) throw new Error(f + ': passt zu keiner Umschichtung'); nU++; }
    else if (d.anlass === 'regimewechsel') { var sc = schalt[d.datum]; if (!sc || Math.abs(sc.nach - d.einsatzquote) > 1e-12) throw new Error(f + ': passt zu keiner Schaltung'); nS++; }
    else throw new Error(f + ': Anlass ' + d.anlass);
  });
  if (nU !== E.perioden.length) throw new Error('Umschichtungen ' + nU + ' != ' + E.perioden.length);
  if (nS !== E.varianten[v].schaltungen.length) throw new Error('Regimewechsel ' + nS + ' != ' + E.varianten[v].schaltungen.length);
  return dateien.length + ' Dateien (' + nU + ' Umschichtungen, ' + nS + ' Regimewechsel), Variante ' + v;
});

/* ================= T3-P11: die Maschinenpruefungen bleiben gruen ================= */
pruef('T3-P11 test.js (67: 47 + 20 der Panel-Reparatur v2) und test-teil2.js (20) laufen nach den Ergaenzungen gruen', function () {
  if (!opt.maschine || !opt.aus) return 'skip';
  var ref = 'C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten/referenz/F-F_Momentum_Factor.csv';
  var r1 = cp.spawnSync(process.execPath, ['--max-old-space-size=6144', path.join(__dirname, 'test.js'), '--aus', opt.aus, '--kunst', 'kunst'], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 });
  var m1 = /(\d+) Pruefungen, (\d+) rot/.exec(r1.stdout || '');
  /* 67 seit der Panel-Reparatur v2 (18.09.2026): Abschnitte 14-16 (Faktor-Roundtrip, Kuerzelwechsel, echtes Panel). */
  /* 82 seit Panel v2.2 (03.10.2026, Auftrag Nr. 67): Abschnitt 17 (Luecken-Trennung, 11 Pruefungen) kam zu den 71 dazu. */
  if (!m1 || +m1[2] !== 0 || +m1[1] !== 82) throw new Error('test.js: ' + (m1 ? m1[0] : 'keine Summenzeile') + (r1.stderr ? ' / ' + r1.stderr.slice(0, 200) : ''));
  var r2 = cp.spawnSync(process.execPath, [path.join(__dirname, 'test-teil2.js'), '--referenz', ref, '--kandidaten', path.join(opt.aus, 'kandidaten-voll.json'), '--momentum', path.join(__dirname, 'momentum-perioden.json')], { cwd: __dirname, encoding: 'utf8', maxBuffer: 1 << 26 });
  var m2 = /gruen (\d+), rot (\d+)/.exec(r2.stdout || '');
  if (!m2 || +m2[2] !== 0 || +m2[1] !== 20) throw new Error('test-teil2.js: ' + (m2 ? m2[0] : 'keine Summenzeile'));
  return 'test.js 47/0 rot, test-teil2.js 20/0 rot';
});

process.stdout.write(zeilen.join('\n') + '\n\n');
process.stdout.write('gruen ' + gruen + ', rot ' + rot + ', uebersprungen ' + uebersprungen + '\n');
var lauf = { stand: new Date().toISOString(), aus: opt.aus || null, gruen: gruen, rot: rot, uebersprungen: uebersprungen, zeilen: zeilen };
fs.writeFileSync(path.join(__dirname, 'test-lauf-teil3.json'), JSON.stringify(lauf, null, 1));
process.exit(rot ? 1 : 0);
