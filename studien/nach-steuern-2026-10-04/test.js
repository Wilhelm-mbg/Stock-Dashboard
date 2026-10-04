'use strict';
/* Pruefungen zu Auftrag Nr. 82 (§2). Aufruf aus der Repo-Wurzel:
 *   node --max-old-space-size=6144 studien/nach-steuern-2026-10-04/test.js
 * Teil I:   Aktien-Verlusttopf und Zaehler von Hand.
 * Teil II:  Kunstpanel (dasselbe wie in Nr. 78 / Nr. 74): mit Steuersatz 0 Tag fuer Tag gleich dem Rechner aus Nr. 78; die Steuer von Hand.
 * Teil III: Indexfonds an Kunstreihen von Hand (Vorabpauschale, Zwoelftel, Faelligkeit, Endverkauf, Wiederanlage, Kosten).
 * Teil IV:  Trockenlauf des ganzen Berichts am Kunstpanel, Selbstpruefung der Selbstpruefung.
 * Teil V:   echtes Panel - NUR mit Steuersatz 0 (Selbstpruefung gegen Nr. 78 und Nr. 74) und der Fonds ohne Steuer und Kosten gegen den
 *           Massstab. Vor dem Siegel entsteht hier kein Ergebnis nach Steuern.
 * Die Sollwerte der Kunstfaelle sind von Hand gerechnet (Rechenweg in den Kommentaren). */
var path = require('path');
var St = require('./steuer.js');
var REPO = path.resolve(__dirname, '..', '..');
var R = require(path.join(REPO, 'studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js'));
var KB = require(path.join(REPO, 'studien', 'momentum-korb-2026-10-04', 'korb.js'));
var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 1e-6 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function wirft(name, f) { var w = false; try { f(); } catch (e) { w = true; } ok(name, w); }
var SATZ = 0.26375;

/* ================= Teil I: Aktien-Verlusttopf von Hand ================= */
ok('Modell: Steuersatz 26,375 %, Teilfreistellung 30 %, Wiederanlage 85 %, Kosten 0,07 %', St.MODELL.steuersatz === SATZ && St.MODELL.teilfreistellung === 0.3 &&
  St.MODELL.wiederanlage === 0.85 && St.MODELL.kostenPa === 0.0007 && St.MODELL.basisertragAnteil === 0.7 && Math.abs(0.25 * 1.055 - SATZ) < 1e-15);
ok('Modell: Basiszins 2017 bis 2026 wie im Auftrag', JSON.stringify(St.MODELL.basiszins) ===
  JSON.stringify({ 2017: 0.0059, 2018: 0.0087, 2019: 0.0052, 2020: 0.0007, 2021: -0.0045, 2022: -0.0005, 2023: 0.0255, 2024: 0.0229, 2025: 0.0253, 2026: 0.032 }));
ok('genau vier Laeufe: A-187, B-187, A-breit, B-breit, alle mit der Mechanik der App', St.LAEUFE.map(function (l) { return l.name + '/' + l.fenster + '/' + l.korb + '/' + l.mechanik; }).join(' ') ===
  'A-187/A/187/app B-187/B/187/app A-breit/A/null/app B-breit/B/null/app');
/* 1. ein Gewinnverkauf: 1000 x 26,375 % = 263,75 */
var t1 = St.topfNeu(SATZ); St.topfJahr(t1, 2020); St.topfBuche(t1, 1000);
nah('Topf: Gewinn 1000 -> Steuer 263,75', St.topfAbrechnen(t1), 263.75, 1e-9);
/* 2. Verlust nach Gewinn im selben Jahr: -400 -> Topf 600 -> Jahressteuer 158,25 -> Erstattung 105,50;
 *    -5000 -> Topf -4400 -> Jahressteuer 0 -> Erstattung 158,25 = der Rest des Gezahlten (nicht 5000 x 26,375 % = 1318,75) */
St.topfBuche(t1, -400);
nah('Topf: Verlust 400 nach Gewinn -> Erstattung 105,50', St.topfAbrechnen(t1), -105.5, 1e-9);
St.topfBuche(t1, -5000);
nah('Topf: Verlust 5000 -> Erstattung nur 158,25 (hoechstens das im Jahr Gezahlte)', St.topfAbrechnen(t1), -158.25, 1e-9);
ok('Topf: im Jahr netto 0 gezahlt, belastet 263,75 = erstattet 263,75', t1.gezahlt === 0 && Math.abs(t1.akt.belastet - 263.75) < 1e-9 && Math.abs(t1.akt.erstattet - 263.75) < 1e-9 && t1.akt.aktiensteuer === 0);
/* 4. Jahresgrenze: Topf -4400 wird vorgetragen, keine Erstattung; 2021: +3000 -> -1400 -> keine Steuer; +2400 -> +1000 -> 263,75 */
St.topfJahr(t1, 2021);
ok('Topf: Vortrag -4400 ueber die Jahresgrenze, nichts erstattet', t1.vortrag === -4400 && t1.gezahlt === 0 && t1.jahre[0].vortragEnde === -4400 && t1.jahre[0].topfEnde === -4400 && t1.jahre[1].vortragAnfang === -4400);
St.topfBuche(t1, 3000);
nah('Topf: Gewinn 3000 im Folgejahr wird mit dem Vortrag verrechnet -> keine Steuer', St.topfAbrechnen(t1), 0, 1e-12);
St.topfBuche(t1, 2400);
nah('Topf: weiterer Gewinn 2400 -> Topf +1000 -> Steuer 263,75', St.topfAbrechnen(t1), 263.75, 1e-9);
/* ein positiver Topf wird nicht vorgetragen; ein Verlust im naechsten Jahr holt die Steuer des Vorjahres nicht zurueck */
St.topfJahr(t1, 2022); St.topfBuche(t1, -100);
ok('Topf: positiver Topf nicht vorgetragen', t1.vortrag === 0 && t1.jahre[1].vortragEnde === 0 && t1.jahre[1].topfEnde === 1000);
nah('Topf: Verlust im neuen Jahr -> keine Erstattung ueber die Jahresgrenze', St.topfAbrechnen(t1), 0, 1e-12);
/* 3. Verlust vor Gewinn: -1000, dann +400 -> Topf -600 -> 0; dann +1000 -> Topf +400 -> 105,50 */
var t3 = St.topfNeu(SATZ); St.topfJahr(t3, 2020); St.topfBuche(t3, -1000);
nah('Topf: Verlust zuerst -> nichts zu erstatten', St.topfAbrechnen(t3), 0, 1e-12);
St.topfBuche(t3, 400);
nah('Topf: Gewinn 400 nach Verlust 1000 -> verrechnet, keine Steuer', St.topfAbrechnen(t3), 0, 1e-12);
St.topfBuche(t3, 1000);
nah('Topf: Gewinn 1000 -> Topf +400 -> Steuer 105,50', St.topfAbrechnen(t3), 105.5, 1e-9);
var t0 = St.topfNeu(0); St.topfJahr(t0, 2020); St.topfBuche(t0, 5000);
ok('Topf: Steuersatz 0 -> Belastung genau 0', St.topfAbrechnen(t0) === 0);
/* Zaehler: vier getrennte Faecher; Budget 10000, Kurs 100 -> 5 % = 500 $ = 5 Stueck */
var zz = St.zaehlerNeu();
St.zaehle(zz, 100, 100, 100, 10000); St.zaehle(zz, 100, 98, 100, 10000); St.zaehle(zz, 100, 5, 100, 10000); St.zaehle(zz, 100, 4.9999, 100, 10000); St.zaehle(zz, 100, 0, 100, 10000);
ok('Zaehler: voll 1, verkleinert 2 (98 und genau 5 %), unter 5 % 1, ausgefallen 1', zz.geplant === 5 && zz.voll === 1 && zz.verkleinert === 2 && zz.unter5 === 1 && zz.ausgefallen === 1);

/* ================= Teil II: Kunstpanel (Kopie des Aufbaus aus Nr. 78 test.js) ================= */
function kunstTafel(tage, reihen) {
  var rows = [];
  reihen.forEach(function (r, s) { r.zeilen.forEach(function (z) { rows.push([z[0], s, z[1], z[2], z[3], z[4]]); }); });
  rows.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  var n = rows.length, g = { n: n, tag: new Int32Array(n), sym: new Uint16Array(n), rohSchluss: new Float64Array(n), bSchluss: new Float64Array(n),
    bEroeffnung: new Float64Array(n), umsatz: new Float64Array(n) };
  rows.forEach(function (r, i) { g.tag[i] = r[0]; g.sym[i] = r[1]; g.rohSchluss[i] = r[2]; g.bSchluss[i] = r[3]; g.bEroeffnung[i] = r[4]; g.umsatz[i] = r[5]; });
  var nTage = tage.length, nSym = reihen.length, i;
  var tagVon = new Int32Array(nTage).fill(-1), tagBis = new Int32Array(nTage).fill(-1);
  for (i = 0; i < n; i++) { var t = g.tag[i]; if (tagVon[t] < 0) tagVon[t] = i; tagBis[t] = i + 1; }
  var zaehl = new Int32Array(nSym + 1);
  for (i = 0; i < n; i++) zaehl[g.sym[i] + 1]++;
  for (var s = 0; s < nSym; s++) zaehl[s + 1] += zaehl[s];
  var symStart = Int32Array.from(zaehl), symZeilen = new Int32Array(n), fuell = Int32Array.from(zaehl);
  for (i = 0; i < n; i++) symZeilen[fuell[g.sym[i]]++] = i;
  function zeileVon(sym, tag) {
    if (tag < 0 || tag >= nTage) return -1;
    var a = tagVon[tag], b = tagBis[tag];
    if (a < 0) return -1;
    while (a < b) { var m = (a + b) >> 1; if (g.sym[m] < sym) a = m + 1; else b = m; }
    return (a < tagBis[tag] && g.sym[a] === sym) ? a : -1;
  }
  var symName = reihen.map(function (r) { return r.reihe; }), symIdx = {};
  symName.forEach(function (nm, j) { symIdx[nm] = j; });
  return { g: g, kal: { tage: tage }, maxTag: nTage - 1, nTage: nTage, nSym: nSym, tagVon: tagVon, tagBis: tagBis, symStart: symStart, symZeilen: symZeilen,
    zeileVon: zeileVon, symName: symName, symIdx: symIdx, endeGrund: reihen.map(function (r) { return r.ende_grund || null; }),
    stand: { kennung: 'kunst', symbole: reihen.map(function (r) { return { reihe: r.reihe, ordner: r.reihe, lebend: r.ende_grund ? 0 : 1, referenz: !!r.referenz, ende_grund: r.ende_grund || null }; }) },
    letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; } };
}
function wochentage(n) {
  var aus = [], d = new Date(Date.UTC(2020, 0, 1));
  while (aus.length < n) { var w = d.getUTCDay(); if (w !== 0 && w !== 6) aus.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
  return aus;
}
var NT = 327, TAGE = wochentage(NT);          /* Tage 0..326; Stichtag 252, Ausfuehrung 253 (21.12.2020) und 316 (2021), Ende 326 */
function pad(j) { return 'S' + ('00' + j).slice(-3); }
function kurs(j, t, opt) {
  var c, o;
  if (t < 200) c = 100;
  else if (t <= 252) c = 200 - j;
  else if (j <= 9) c = t <= 314 ? (j === 9 ? opt.s9 : 105) : t === 315 ? 110 : t <= 325 ? 115 : opt.ende;
  else if (j === 10) c = t <= 315 ? 104 : t <= 325 ? 105 : 110;
  else c = 50;
  o = c;
  if (t === 253 && j <= 10) o = 100;
  if (t === 316) { if (j <= 9) o = 110; if (j === 10) o = 100; }
  return [c, o];
}
function spyKurs(t) {
  var c = t < 200 ? 300 : t <= 252 ? 3000 : t <= 314 ? 420 : t === 315 ? 440 : t <= 325 ? 460 : 484;
  return [c, t === 253 ? 400 : t === 316 ? 440 : c];
}
function kunst(opt) {
  opt = opt || {};
  var o2 = { s9: opt.s9 || 95, ende: opt.ende || 121 }, reihen = [], nA = opt.nAktien || 102;
  for (var j = 0; j < nA; j++) {
    var name = pad(j), letzte = opt.enden && opt.enden[name] ? opt.enden[name][0] : NT - 1, zeilen = [], f = (opt.rohFaktor && opt.rohFaktor[name]) || 1;
    for (var t = 0; t <= letzte; t++) { var k = kurs(j, t, o2); zeilen.push([t, k[0] * f, k[0], k[1], 2e8]); }
    reihen.push({ reihe: name, zeilen: zeilen, ende_grund: opt.enden && opt.enden[name] ? opt.enden[name][1] : null });
  }
  var sz = [];
  for (var t2 = 0; t2 < NT; t2++) { var ks = spyKurs(t2); sz.push([t2, ks[0], ks[0], ks[1], 2e8]); }
  reihen.push({ reihe: 'SPY', zeilen: sz, referenz: true });
  var T = kunstTafel(TAGE, reihen), Q = R.vorbereiten(T);
  return { T: T, Q: Q, M: KB.Massnahmen(T, Q, opt.leser || function () { return null; }, {}, null) };
}
var HAUPT = K.EMPFINDLICHKEIT[0].totalverlust;
function basis(extra) { var o = { startTag: 253, endTag: NT - 1, totalverlust: HAUPT }; Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; }); return o; }
function lauf(P, extra) { return St.simuliere(P.T, P.Q, P.M, basis(extra)); }
function lauf78(P, extra) { return KB.simuliere(P.T, P.Q, P.M, basis(extra)); }
function pos(L, name) { return L.buch.positionen.filter(function (p) { return p.sym === name; })[0]; }
function am(L, tag) { return L.tage.filter(function (x) { return x.tag === tag; })[0]; }
function jahr(L, j) { return L.steuer.jahre.filter(function (x) { return x.jahr === j; })[0]; }
function tageGleich(A, B) {
  return A.tage.length === B.tage.length && A.tage.every(function (x, i) { var y = B.tage[i]; return x.tag === y.tag && x.buch === y.buch && x.spy === y.spy && x.bar === y.bar; });
}
ok('Kunstkalender: Tag 253 = 21.12.2020, Tag 256 = 24.12.2020, Tag 261 = 31.12.2020, Tag 271 und 316 liegen in 2021', TAGE[253] === '2020-12-21' && TAGE[256] === '2020-12-24' &&
  TAGE[261] === '2020-12-31' && TAGE[271].slice(0, 4) === '2021' && TAGE[316].slice(0, 4) === '2021' && TAGE[326].slice(0, 4) === '2021');

/* ===== 5. Mit Steuersatz 0 ist der Ablauf woertlich der aus Nr. 78: jeder Tageswert (Buch, SPY, Bargeld) gleich ===== */
var saetze = {
  S000: [{ _art: 'cash_dividends', ex_date: TAGE[260], rate: 2.10 }, { _art: 'cash_dividends', ex_date: TAGE[253], rate: 5 }],
  S009: [{ _art: 'cash_dividends', ex_date: TAGE[316], rate: 1.10 }],
  SPY: [{ _art: 'cash_dividends', ex_date: TAGE[300], rate: 4.20 }, { _art: 'cash_dividends', ex_date: TAGE[253], rate: 7 }],
};
var leser = function (n) { return saetze[n] || null; };
var G = kunst(), D = kunst({ rohFaktor: { S000: 2 }, leser: leser }), E1 = kunst({ enden: { S001: [270, 'insolvenz'], S002: [280, 'uebernahme'] } });
[['Grundfall', G], ['Ausschuettungen', D], ['Reihenenden', E1]].forEach(function (x) {
  ['app', 'gleich'].forEach(function (mech) {
    var A = lauf(x[1], { steuersatz: 0, mechanik: mech }), B = lauf78(x[1], { mechanik: mech });
    ok('Steuersatz 0 = Nr. 78, ' + x[0] + ', Mechanik ' + mech + ': alle ' + B.tage.length + ' Tageswerte gleich', tageGleich(A, B) && A.endBuch === B.endBuch && A.endSpy === B.endSpy);
    ok('Steuersatz 0 = Nr. 78, ' + x[0] + ', Mechanik ' + mech + ': Kosten, Kaeufe, Verkaeufe, Reihenenden gleich; keine Steuer', A.zaehler.kosten === B.zaehler.kosten && A.zaehler.kaeufe === B.zaehler.kaeufe &&
      A.zaehler.verkaeufe === B.zaehler.verkaeufe && A.reihenenden.length === B.reihenenden.length && A.steuer.gesamtB === 0 && A.steuer.laufend === 0);
  });
});
nah('Grundfall vor Steuern: Endwert wie in Nr. 78 (120711,14)', lauf(G, { steuersatz: 0 }).endBuch, 120711.14, 1e-9);

/* ===== 6. Grundfall mit Steuer: ein Gewinnverkauf; die Steuer steht zwischen Verkaeufen und Kaeufen =====
 * Tag 253 (2020): Kauf S000..S008 je 100 Stueck zu 100 (Einstand 100,2), S009 98,0039 Stueck; Bargeld 0,00922. Kein Verkauf -> keine Steuer.
 * Tag 316 (2021): Verkauf S009: Erloes 98,0039 x 110 x 0,998 = 10758,868142; Einstand 98,0039 x 100,2 = 9819,99078; Gewinn 938,877362.
 *   Steuer = 938,877362 x 0,26375 = 247,6289042275. Bargeld 0,00922 + 10758,868142 - 247,6289042275 = 10511,2484577725.
 *   Kauf S010 zu 100: floor(10511,2484577725 / 100,2 x 10000) / 10000 = 104,9026 Stueck (ohne Steuer 107,3740 - der Kauf schrumpft um
 *   2,4714 Stueck x 100,2 = 247,63, den Steuerbetrag); Kosten 10511,24052 -> Bargeld 0,0079377725.
 * Ende (a): 900 x 121 + 104,9026 x 110 + 0,0079377725 = 120439,2939 -> 120439,29.
 * Ende (b): S000..S008: Erloes 900 x 121 x 0,998 = 108682,2, Gewinn 108682,2 - 90180 = 18502,2; S010: Erloes 104,9026 x 110 x 0,998 = 11516,207428,
 *   Gewinn 11516,207428 - 10511,24052 = 1004,966908. Topf 2021 = 938,877362 + 18502,2 + 1004,966908 = 20446,04427; Jahressteuer x 0,26375 =
 *   5392,6441762125; schon gezahlt 247,6289042275 -> Belastung 5145,015271985. Ende (b) = 0,0079377725 + 108682,2 + 11516,207428 - 5145,015271985
 *   = 115053,4000937875. */
var LG = lauf(G), LG0 = lauf(G, { steuersatz: 0 });
nah('Gewinnverkauf: Steuer am Tag 316 = Gewinn x 26,375 % = 247,6289042275', LG.umschichtungen[1].steuer, 247.6289042275, 1e-9);
ok('keine Steuer am Tag 253 (nur Kaeufe)', LG.umschichtungen[0].steuer === 0 && jahr(LG, 2020).aktiensteuer === 0);
ok('die Steuer steht zwischen Verkaeufen und Kaeufen: S010 104,9026 Stueck statt 107,3740', pos(LG, 'S010').stueck === 104.9026 && pos(LG0, 'S010').stueck === 107.374);
nah('der letzte Kauf schrumpft um den Steuerbetrag (2,4714 Stueck x 100,2 = 247,63)', (pos(LG0, 'S010').stueck - pos(LG, 'S010').stueck) * 100.2, 247.6289042275, 0.011);
nah('Bargeld nach dem Tag 316', am(LG, 316).bar, 0.0079377725, 1e-9);
nah('Kosten der zweiten Umschichtung ohne die Steuer: 20 Bp auf Verkauf und Kauf', LG.umschichtungen[1].kosten, 98.0039 * 110 * 0.002 + 104.9026 * 100 * 0.002, 1e-9);
nah('Endwert (a) bleibt stehen', LG.endBuch, 120439.29, 1e-9);
nah('Endwert (b) alles verkauft', LG.endBuchVerkauft, 115053.4000937875, 1e-7);
nah('Endverkauf: Gewinn 19507,166908, Belastung 5145,015271985', LG.steuer.endverkauf.gewinn, 19507.166908, 1e-7);
nah('Endverkauf: Steuer', LG.steuer.endverkauf.steuer, 5145.015271985, 1e-7);
nah('gezahlte Steuer (a) 247,63 / (b) 5392,64', LG.steuer.gesamtA + LG.steuer.gesamtB, 247.6289042275 + 5392.6441762125, 1e-7);
ok('Jahr 2021: Gewinne 938,877362, belastet 247,63, nichts erstattet', Math.abs(jahr(LG, 2021).gewinne - 938.877362) < 1e-9 && Math.abs(jahr(LG, 2021).belastet - 247.6289042275) < 1e-9 && jahr(LG, 2021).erstattet === 0);
ok('Zaehler vor und nach Steuern: 11 geplant, 9 voll, 2 verkleinert', JSON.stringify(LG0.kaeufe) === JSON.stringify({ geplant: 11, voll: 9, verkleinert: 2, unter5: 0, ausgefallen: 0 }) &&
  JSON.stringify(LG.kaeufe) === JSON.stringify(LG0.kaeufe));
nah('vor Steuern "alles verkauft" (nachrichtlich): Buchwert abzueglich 20 Bp auf die Positionen', LG0.endBuchVerkauft, 0.002562 + (900 * 121 + 107.374 * 110) * 0.998, 1e-7);

/* ===== 7. Ausschuettung: netto 73,625 %, kein Einfluss auf den Aktien-Verlusttopf =====
 * S000 (roh = 2 x bereinigt): Ex-Tag 260 (30.12.2020), rate 2,10 / rohSchluss 210 = 1 % -> brutto 100 x 105 x 0,01 = 105,00; netto 77,30625; Steuer 27,69375.
 * Bargeld Tag 260: 0,00922 + 77,30625 = 77,31547. Mit einem Verlust davor (S001 insolvent, ausgebucht am Tag 256: -10020 im Topf) bleibt die
 * Ausschuettung genauso besteuert. */
var LD = lauf(D);
nah('Ausschuettung netto 73,625 % am Ex-Tag 260', am(LD, 260).bar, 77.31547, 1e-9);
nah('Tag 259 noch ohne', am(LD, 259).bar, 0.00922, 1e-9);
ok('Ausschuettung 2020: brutto 105, Steuer 27,69375, Topf unberuehrt', Math.abs(jahr(LD, 2020).ausschuettungBrutto - 105) < 1e-9 && Math.abs(jahr(LD, 2020).ausschuettungSteuer - 27.69375) < 1e-9 &&
  jahr(LD, 2020).gewinne === 0 && jahr(LD, 2020).verluste === 0 && jahr(LD, 2020).aktiensteuer === 0 && jahr(LD, 2020).topfEnde === 0);
var DV = kunst({ rohFaktor: { S000: 2 }, leser: leser, enden: { S001: [255, 'insolvenz'] } }), LDV = lauf(DV);
nah('Ausschuettung nach einem Aktienverlust: trotzdem netto 73,625 % (keine Verrechnung)', am(LDV, 260).bar, 77.31547, 1e-9);
ok('der Verlust steht im Topf (10020), die Ausschuettungssteuer bleibt 27,69375, nichts erstattet', Math.abs(jahr(LDV, 2020).verluste - 10020) < 1e-9 &&
  Math.abs(jahr(LDV, 2020).ausschuettungSteuer - 27.69375) < 1e-9 && jahr(LDV, 2020).erstattet === 0 && Math.abs(jahr(LDV, 2020).topfEnde + 10020) < 1e-9);

/* ===== 8. Reihenende =====
 * (i) Gewinn, dann Verlust im selben Jahr: S002 Uebernahme (letzte Zeile 270, ausgebucht 271, 2021): 100 x 105 = 10500, Gewinn 480 -> Steuer 126,60;
 *     Bargeld 0,00922 + 10500 - 126,6 = 10373,40922. S009 Uebernahme (letzte Zeile 280): 98,0039 x 95 = 9310,3705, Einstand 9819,99078 -> Verlust 509,62028;
 *     Topf -29,62028 -> Jahressteuer 0 -> Erstattung 126,60 (das Gezahlte, nicht 509,62 x 26,375 % = 134,41). Bargeld 10373,40922 + 9310,3705 + 126,6 = 19810,37972. */
var Li = lauf(kunst({ enden: { S002: [270, 'uebernahme'], S009: [280, 'uebernahme'] } }));
nah('Reihenende mit Gewinn: Steuer 126,60 am selben Tag', am(Li, 271).bar, 10373.40922, 1e-9);
nah('Reihenende mit Verlust nach Gewinn: Erstattung hoechstens das Gezahlte', am(Li, 281).bar, 19810.37972, 1e-9);
ok('Reihenende mit Verlust: -509,62028 im Topf, Jahr 2021 netto 0', Math.abs(Li.reihenenden[1].gewinn + 509.62028) < 1e-9 && Math.abs(jahr(Li, 2021).erstattet - 126.6) < 1e-9 && Math.abs(jahr(Li, 2021).belastet - 126.6) < 1e-9);
/* (ii) Verlust vor Gewinn im selben Jahr: S001 insolvent (ausgebucht 271: -10020), S002 Uebernahme (ausgebucht 281: +480) -> Topf -9540 -> keine Steuer. */
var Lii = lauf(E1);
nah('Totalverlust: nichts zu erstatten', am(Lii, 271).bar, 0.00922, 1e-9);
nah('Verlust vor Gewinn: verrechnet, Bargeld 10500,00922 wie vor Steuern', am(Lii, 281).bar, 10500.00922, 1e-9);
/* Gegenstueck ohne den Verlust davor: derselbe Gewinn kostet 126,60 */
nah('Gegenprobe: derselbe Gewinn ohne Verlust davor kostet 126,60', am(lauf(kunst({ enden: { S002: [280, 'uebernahme'] } })), 281).bar, 10373.40922, 1e-9);
/* (iii) Verlustvortrag: S001 insolvent in 2020 (ausgebucht am Tag 256), Gewinn 480 in 2021 -> Topf 2021 = -10020 + 480 -> keine Steuer. */
var Liii = lauf(kunst({ enden: { S001: [255, 'insolvenz'], S002: [280, 'uebernahme'] } }));
ok('Verlustvortrag: 2020 endet mit -10020, 2021 beginnt damit', Math.abs(jahr(Liii, 2020).vortragEnde + 10020) < 1e-9 && Math.abs(jahr(Liii, 2021).vortragAnfang + 10020) < 1e-9 && jahr(Liii, 2020).erstattet === 0);
nah('Verlustvortrag: Gewinn im Folgejahr wird verrechnet', am(Liii, 281).bar, 10500.00922, 1e-9);
/* (iv) keine Erstattung ueber die Jahresgrenze: Gewinn 480 in 2020 (Steuer 126,60), Verlust 10020 in 2021 -> das Bargeld bleibt. */
var Liv = lauf(kunst({ enden: { S002: [255, 'uebernahme'], S001: [270, 'insolvenz'] } }));
nah('Gewinn in 2020 versteuert', am(Liv, 256).bar, 10373.40922, 1e-9);
nah('Verlust in 2021: keine Erstattung der Steuer aus 2020', am(Liv, 271).bar, 10373.40922, 1e-9);
ok('2020: Aktiensteuer 126,60, kein Vortrag; 2021: nichts erstattet', Math.abs(jahr(Liv, 2020).aktiensteuer - 126.6) < 1e-9 && jahr(Liv, 2020).vortragEnde === 0 && jahr(Liv, 2021).erstattet === 0);
/* Zaehler "ausgefallen": S001 insolvent (Tag 271) -> am Tag 316 ist S009 wieder Ziel, nichts wird verkauft, fuer S010 bleiben 0,00922 -> 0 Stueck */
var Lz = lauf(kunst({ enden: { S001: [270, 'insolvenz'] } }));
ok('Zaehler: ein geplanter Kauf faellt aus (0,00922 Bargeld)', JSON.stringify(Lz.kaeufe) === JSON.stringify({ geplant: 11, voll: 9, verkleinert: 1, unter5: 0, ausgefallen: 1 }) && !pos(Lz, 'S010'));

/* ===== 9. Endverkauf (b) mit verfallendem Verlusttopf: Schluss der gehaltenen am letzten Tag 90 =====
 * Bis Tag 316 wie der Grundfall (Steuer 247,6289042275 gezahlt, S010 104,9026 Stueck, Bargeld 0,0079377725).
 * (a): 900 x 90 + 104,9026 x 110 + 0,0079377725 = 92539,2939 -> 92539,29.
 * (b): S000..S008: Erloes 900 x 90 x 0,998 = 80838, Verlust 80838 - 90180 = -9342; S010: Erloes 11516,207428, Gewinn 1004,966908.
 *   Topf = 938,877362 - 9342 + 1004,966908 = -7398,15573 -> Jahressteuer 0 -> Erstattung 247,6289042275; der Rest (7398,15573) verfaellt.
 *   Ende (b) = 0,0079377725 + 80838 + 11516,207428 + 247,6289042275 = 92601,84427. */
var LV = lauf(kunst({ ende: 90 }));
nah('Endverkauf mit Verlust: (a) 92539,29', LV.endBuch, 92539.29, 1e-9);
nah('Endverkauf mit Verlust: (b) 92601,84427 (Erstattung des im Jahr Gezahlten)', LV.endBuchVerkauft, 92601.84427, 1e-7);
nah('Endverkauf mit Verlust: Erstattung 247,6289042275', LV.steuer.endverkauf.steuer, -247.6289042275, 1e-9);
nah('Endverkauf mit Verlust: der verbleibende Verlusttopf 7398,15573 verfaellt', LV.steuer.endverkauf.verfallen, 7398.15573, 1e-7);
nah('Endverkauf mit Verlust: gezahlte Steuer (b) insgesamt 0', LV.steuer.gesamtB, 0, 1e-9);

/* ===== 10. Mechanik Gleichgewicht mit Steuer (Schalter, kein Lauf dieses Auftrags): Teilverkaeufe gehen in den Topf =====
 * Tag 316: Depotwert 0,00922 + 900 x 110 + 98,0039 x 110 = 109780,43822, Budget 10978,043822. S009 ganz: Gewinn 938,877362.
 * S000..S008 je round4((11000 - 10978,043822) / 110) = 0,1996 Stueck: Erloes 0,1996 x 110 x 0,998 = 21,912088, Gewinn 21,912088 - 0,1996 x 100,2 = 1,912168; neunmal 17,209512.
 * Steuer = (938,877362 + 17,209512) x 0,26375 = 252,1679130175. Bargeld 0,00922 + 10758,868142 + 197,208792 - 252,1679130175 = 10703,9182409825.
 * S010: floor(10703,9182409825 / 100,2 x 10000) / 10000 = 106,8255 Stueck. */
var LGl = lauf(G, { mechanik: 'gleich' });
nah('Gleichgewicht: Steuer am Tag 316 aus Verkauf und neun Teilverkaeufen', LGl.umschichtungen[1].steuer, 252.1679130175, 1e-9);
ok('Gleichgewicht: S010 106,8255 Stueck nach der Steuer', pos(LGl, 'S010').stueck === 106.8255);

/* ================= Teil III: der Indexfonds von Hand ================= */
/* Rechenprobe des PM (§5.1): Wert 50.000, Basiszins 3,20 % -> Basisertrag und Vorabpauschale 1.120,00 -> steuerbar 784,00 -> Steuer 206,78 */
var vp = St.vorabpauschale(50000, St.MODELL.basiszins[2026], 1e9);
nah('Rechenprobe §5.1: Basisertrag 1.120,00', vp.basisertrag, 1120, 1e-9);
nah('Rechenprobe §5.1: Vorabpauschale 1.120,00', vp.vorabpauschale, 1120, 1e-9);
nah('Rechenprobe §5.1: steuerbar 784,00', vp.steuerbar, 784, 1e-9);
nah('Rechenprobe §5.1: Steuer 206,78', vp.steuer, 206.78, 1e-9);
nah('Vorabpauschale: Deckel beim Wertzuwachs', St.vorabpauschale(50000, 0.032, 300).vorabpauschale, 300, 1e-12);
ok('Vorabpauschale: Verlustjahr -> 0, negativer Basiszins -> 0, Basiszins 0 -> 0', St.vorabpauschale(50000, 0.032, -1).steuer === 0 && St.vorabpauschale(50000, -0.0045, 1e9).steuer === 0 &&
  St.vorabpauschale(50000, -0.0045, 1e9).basisertrag === 0 && St.vorabpauschale(50000, 0, 1e9).vorabpauschale === 0);
function tag(datum, eroeffnung, schluss, aus) { return { datum: datum, eroeffnung: eroeffnung, schluss: schluss, aus: aus || [] }; }
var P0 = St.mit(St.MODELL, { kostenPa: 0 });           /* ohne laufende Kosten, damit die Handrechnung glatt bleibt */
/* Reihe A: Kauf 03.01.2023 zu 100 -> 1000 Anteile. 2023 (Basiszins 2,55 %, Kauf im Januar = 12/12): Basisertrag 100000 x 0,0255 x 0,7 = 1785,00;
 *   Zuwachs 10000 -> Vorabpauschale 1785,00; steuerbar 1249,50; Steuer 329,555625, faellig 02.01.2024, Verkauf 329,555625 / 110 = 2,9959602273 Anteile.
 * 2024 (2,29 %): Wert am Jahresanfang 997,0040397727 x 110 = 109670,444375; Basisertrag x 0,0229 x 0,7 = 1758,0172233313; Zuwachs 997,0040397727 x 1
 *   = 997,0040397727 -> Deckel: Vorabpauschale 997,0040397727; steuerbar 697,9028278409; Steuer 184,0718708430, Verkauf / 111 = 1,6583051427 Anteile.
 * 2025: Ende 30.06.2025 - die Vorabpauschale 2025 waere erst 2026 faellig und faellt weg. Anteile 995,3457346300; Ende (a) x 120 = 119441,4881556.
 * (b): Kaufwert 99534,573463; Vorabpauschalen je Anteil 1,785 + 1 = 2,785 -> anteilig 2772,0378709445; Gewinn 17134,8768216554; steuerbar 11994,4137751588;
 *   Steuer 3163,5266331981; Ende (b) 116277,9615224015. */
var RA = [tag('2023-01-03', 100, 100), tag('2023-12-29', 110, 110), tag('2024-01-02', 110, 110), tag('2024-12-31', 111, 111), tag('2025-01-02', 111, 111), tag('2025-06-30', 120, 120)];
var FA = St.fonds(RA, 100000, P0);
ok('Fonds A: zwei Jahre mit Vorabpauschale (2023, 2024), 2025 faellt weg', FA.jahre.length === 2 && FA.jahre[0].jahr === 2023 && FA.jahre[1].jahr === 2024 && FA.letztesJahrOhneVorabpauschale === 2025 &&
  FA.jahre[0].faellig === '2024-01-02' && FA.jahre[1].faellig === '2025-01-02');
nah('Fonds A 2023: positiver Basiszins, groesserer Zuwachs -> Vorabpauschale = Basisertrag 1785,00', FA.jahre[0].vorabpauschale, 1785, 1e-9);
nah('Fonds A 2023: Steuer 329,555625', FA.jahre[0].steuer, 329.555625, 1e-9);
nah('Fonds A 2023: bezahlt durch Verkauf von 2,9959602273 Anteilen zur Eroeffnung', FA.jahre[0].anteileVerkauft, 2.9959602273, 1e-9);
nah('Fonds A 2024: Wert am Jahresanfang 109670,444375 (nach dem Steuerverkauf)', FA.jahre[1].wertAnfang, 109670.444375, 1e-7);
nah('Fonds A 2024: Basisertrag 1758,0172233313', FA.jahre[1].basisertrag, 1758.0172233313, 1e-7);
nah('Fonds A 2024: kleinerer Zuwachs -> Deckel 997,0040397727', FA.jahre[1].vorabpauschale, 997.0040397727, 1e-7);
nah('Fonds A 2024: Steuer 184,0718708430', FA.jahre[1].steuer, 184.071870843, 1e-7);
nah('Fonds A: Anteile am Ende 995,34573463', FA.anteile, 995.34573463, 1e-8);
nah('Fonds A: Ende (a) 119441,4881556', FA.endA, 119441.4881556, 1e-6);
nah('Fonds A: Endverkauf - Vorabpauschalen anteilig 2772,0378709445', FA.endverkauf.vorabpauschalenAnteilig, 2772.0378709445, 1e-6);
nah('Fonds A: Endverkauf - Gewinn 17134,8768216554', FA.endverkauf.gewinn, 17134.8768216554, 1e-6);
nah('Fonds A: Endverkauf - Steuer 3163,5266331981', FA.endverkauf.steuer, 3163.5266331981, 1e-6);
nah('Fonds A: Ende (b) 116277,9615224015', FA.endB, 116277.9615224015, 1e-6);
nah('Fonds A: gezahlte Steuer = Vorabpauschalen + Endverkauf', FA.gesamtB, 329.555625 + 184.071870843 + 3163.5266331981, 1e-6);
/* Reihe B: Verlustjahr 2023 (100 -> 95): keine Vorabpauschale; Endverkauf mit Verlust: nichts erstattet -> (b) = (a) = 95000. */
var FB = St.fonds([tag('2023-01-03', 100, 100), tag('2023-12-29', 95, 95), tag('2024-01-02', 95, 95), tag('2024-06-28', 95, 95)], 100000, P0);
ok('Fonds B: Verlustjahr -> Vorabpauschale 0, kein Anteil verkauft', FB.jahre.length === 1 && FB.jahre[0].vorabpauschale === 0 && FB.jahre[0].steuer === 0 && FB.jahre[0].basisertrag > 0 && FB.anteile === 1000);
ok('Fonds B: Verlust beim Endverkauf wird nicht erstattet', FB.endA === 95000 && FB.endB === 95000 && FB.endverkauf.gewinn === -5000 && FB.endverkauf.steuer === 0);
/* Reihe C: negativer Basiszins 2021 und 2022 trotz grossem Zuwachs: keine Vorabpauschale. Endverkauf: Gewinn 50000 x 0,7 x 0,26375 = 9231,25. */
var FC = St.fonds([tag('2021-01-04', 100, 100), tag('2021-12-31', 130, 130), tag('2022-01-03', 130, 130), tag('2022-12-30', 150, 150), tag('2023-01-03', 150, 150), tag('2023-03-31', 150, 150)], 100000, P0);
ok('Fonds C: negativer Basiszins (2021, 2022) -> keine Vorabpauschale', FC.jahre.length === 2 && FC.jahre[0].vorabpauschale === 0 && FC.jahre[1].vorabpauschale === 0 && FC.vorabSteuer === 0 && FC.anteile === 1000);
nah('Fonds C: Endverkauf ohne Vorabpauschalen: Steuer 9231,25, Ende (b) 140768,75', FC.endB, 140768.75, 1e-7);
/* Reihe D: Zwoelftel-Regel, Kauf im September 2023 = 4/12: Basisertrag 100000 x 0,0255 x 0,7 x 4/12 = 595,00; steuerbar 416,50; Steuer 109,851875.
 *   Anteile 1000 - 109,851875 / 110 = 999,0013465909; (a) = 110000 - 109,851875 = 109890,148125.
 *   (b): Kaufwert 99900,1346590909; anteilig 0,595 x 999,0013465909 = 594,4058012216; Gewinn 9395,6076646875; Steuer x 0,7 x 0,26375 = 1734,6640650929. */
var FD = St.fonds([tag('2023-09-15', 100, 100), tag('2023-12-29', 110, 110), tag('2024-01-02', 110, 110), tag('2024-03-28', 110, 110)], 100000, P0);
nah('Fonds D: Zwoelftel im Kaufjahr - Kauf im September = 4/12', FD.jahre[0].zwoelftel, 4 / 12, 1e-15);
nah('Fonds D: Basisertrag 595,00', FD.jahre[0].basisertrag, 595, 1e-9);
nah('Fonds D: Steuer 109,851875', FD.jahre[0].steuer, 109.851875, 1e-9);
nah('Fonds D: Ende (a) 109890,148125', FD.endA, 109890.148125, 1e-7);
nah('Fonds D: Ende (b) 108155,4840599071', FD.endB, 108155.4840599071, 1e-6);
ok('Zwoelftel: Januar 12/12, Dezember 1/12', St.fonds([tag('2023-01-03', 100, 100), tag('2024-01-02', 100, 100)], 100000, P0).jahre[0].zwoelftel === 1 &&
  Math.abs(St.fonds([tag('2023-12-01', 100, 100), tag('2024-01-02', 100, 100)], 100000, P0).jahre[0].zwoelftel - 1 / 12) < 1e-15);
/* Reihe E: Faelligkeit nach dem Fensterende - die Reihe endet am 29.12.2023: keine Vorabpauschale in der Rechnung. Endverkauf: 10000 x 0,7 x 0,26375 = 1846,25. */
var FE = St.fonds([tag('2023-01-03', 100, 100), tag('2023-12-29', 110, 110)], 100000, P0);
ok('Fonds E: Faelligkeit nach dem Fensterende faellt weg', FE.jahre.length === 0 && FE.vorabSteuer === 0 && FE.anteile === 1000 && FE.endA === 110000);
nah('Fonds E: Endverkauf 1846,25 -> Ende (b) 108153,75', FE.endB, 108153.75, 1e-7);
/* Reihe F: Wiederanlage zu 85 % am Ex-Tag zum Schluss; die Ausschuettung am Kauftag zaehlt nicht. 2 $ je Stueck bei Schluss 100 -> Faktor 1,017. */
var RF = [tag('2024-01-02', 100, 100, [5]), tag('2024-01-03', 100, 100, [2]), tag('2024-01-04', 100, 100)];
nah('Fonds F: Wiederanlage zu 85 % -> 101700', St.fonds(RF, 100000, P0).endA, 101700, 1e-7);
nah('Fonds F: mit 100 % Wiederanlage waeren es 102000 (der Massstab aus Nr. 78)', St.fonds(RF, 100000, St.mit(P0, { wiederanlage: 1 })).endA, 102000, 1e-7);
nah('Fonds F: laufende Kosten je Handelstag, drei Tage: 101700 x 0,9993^(3/252)', St.fonds(RF, 100000, St.MODELL).endA, 101700 * Math.pow(0.9993, 3 / 252), 1e-7);
/* 252 Handelstage in einem Jahr, Kurs glatt 100: genau 0,07 % Kosten -> 99930,00 */
var R252 = [], dd = new Date(Date.UTC(2024, 0, 2));
while (R252.length < 252) { var wd = dd.getUTCDay(); if (wd !== 0 && wd !== 6) R252.push(tag(dd.toISOString().slice(0, 10), 100, 100)); dd = new Date(dd.getTime() + 86400000); }
ok('Kunstreihe: 252 Handelstage in 2024', R252.length === 252 && R252[251].datum.slice(0, 4) === '2024');
nah('Fonds: nach 252 Handelstagen genau 0,07 % laufende Kosten -> 99930,00', St.fonds(R252, 100000, St.MODELL).endA, 99930, 1e-6);
wirft('Fonds: fehlender Basiszins wirft', function () { St.fonds([tag('2030-01-02', 100, 100), tag('2031-01-02', 100, 100)], 100000, P0); });
/* Der Fonds mit 100 % Wiederanlage, ohne Kosten und ohne Steuer ist der Massstab aus Nr. 78 (Kunstpanel: 122210) */
var OHNE = St.mit(St.MODELL, { wiederanlage: 1, kostenPa: 0, steuersatz: 0 });
var FM = St.fonds(St.spyReihe(D.T, D.Q, D.M, 253, NT - 1), 100000, OHNE);
nah('Fonds ohne Abzuege = Massstab aus Nr. 78 am Kunstpanel (122210)', FM.endA, 122210, 1e-6);
nah('ebenso: gleich dem SPY-Endwert des Nachlaufs', FM.endA, LD.endSpy, 1e-6);
ok('ohne Steuersatz bleibt (b) = (a), kein Anteil verkauft', FM.endB === FM.endA && FM.anteile === FM.anteileKauf);

/* ================= Teil IV: Trockenlauf des Berichts am Kunstpanel, Selbstpruefung der Selbstpruefung ================= */
var defK = { name: 'Kunst', fenster: 'A', korb: null, mechanik: 'app', rolle: 'Trockenlauf' }, FK = { von: 253, bis: NT - 1 };
var SP78 = KB.startphasen(D.T, D.Q, D.M, 253, NT - 1, 63, { totalverlust: HAUPT, korb: null, mechanik: 'app' }), L78 = lauf78(D);
var sollK = { buchEnde: L78.endBuch, spyEnde: L78.endSpy, phasen: SP78.phasen, quelle: 'Kunstpanel' };
var lk = St.einLauf(D.T, D.Q, D.M, defK, FK, HAUPT, sollK);
ok('Trockenlauf: 63 Phasen, alle vor Steuern auf den Cent und bitgleich mit dem Rechner aus Nr. 78', lk.phasen.length === 63 && lk.selbstpruefung.k0AufCent === true && lk.selbstpruefung.phasenAufCent === 63 && lk.selbstpruefung.phasenBitgleich === 63);
ok('Trockenlauf: Abstand vor Steuern je Phase gleich dem aus Nr. 78', lk.phasen.every(function (p, i) { return p.vor.abstandPa === SP78.phasen[i].abstandPa && p.vor.vorn === SP78.phasen[i].schlaegt; }) &&
  lk.zusammenfassung.vor.median === SP78.median && lk.zusammenfassung.vor.vorn === SP78.vorDemMarkt);
ok('Trockenlauf: k = 0 in drei Lesarten = Phase 0; (a) ist der Buchwert, (b) der Verkauf', lk.k0.vor.buchEnde === L78.endBuch && lk.k0.a.buchEnde === LD.endBuch && lk.k0.b.buchEnde === LD.endBuchVerkauft &&
  JSON.stringify(lk.phasen[0].b) === JSON.stringify(lk.k0.b));
nah('Trockenlauf: Bremse = p. a. vor Steuern minus p. a. nach Steuern (b)', lk.k0.bremse.buchPp, lk.k0.vor.buchPa - lk.k0.b.buchPa, 1e-12);
ok('Trockenlauf: Steuer je Jahr steht da (2020, 2021), Summen passen', lk.k0.steuerBuch.jahre.length === 2 && Math.abs(lk.k0.steuerBuch.gesamtB - lk.k0.steuerBuch.laufend - lk.k0.steuerBuch.endverkauf.steuer) < 1e-9 &&
  lk.k0.steuerFonds.jahre.length === 1 && lk.k0.steuerFonds.jahre[0].jahr === 2020 && Math.abs(lk.k0.steuerFonds.jahre[0].zwoelftel - 1 / 12) < 1e-15);
var sollFalsch = { buchEnde: sollK.buchEnde, spyEnde: sollK.spyEnde, quelle: 'falsch', phasen: SP78.phasen.map(function (p, i) { return i === 7 ? St.mit(p, { buchGesamt: p.buchGesamt + 0.001 }) : p; }) };
wirft('Selbstpruefung wirft, wenn eine Phase um einen Dollar abweicht', function () { St.einLauf(D.T, D.Q, D.M, defK, FK, HAUPT, sollFalsch); });
wirft('Selbstpruefung wirft, wenn k = 0 abweicht', function () { St.einLauf(D.T, D.Q, D.M, defK, FK, HAUPT, St.mit(sollK, { buchEnde: sollK.buchEnde + 0.01 })); });
var EK = { kennung: St.KENNUNG, panelKennung: 'kunst', laeufe: {}, selbstpruefung: {}, korrekturen: [] };
St.LAEUFE.forEach(function (def) {
  var l = St.mit(lk, { name: def.name, rolle: def.rolle }); l.satz = St.satz(l);
  EK.laeufe[def.name] = l; EK.selbstpruefung[def.name] = { buchEnde: l.k0.vor.buchEnde, spyEnde: l.k0.vor.fondsEnde, bestanden: true };
});
var text = St.ergebnisText(EK), zeilen = text.split('\n');
ok('Bericht: vier Saetze nach §1.5', (text.match(/Nach Steuern, alles verkauft: Buch [+−][\d,]+ % p\. a\. gegen Indexfonds [+−][\d,]+ % p\. a\., Abstand [+−][\d,]+ Pp p\. a\. \(vor Steuern [+−][\d,]+ Pp p\. a\.\); in \d+ von 63 Startphasen liegt das Buch vorn \(Median des Abstands [+−][\d,]+ Pp p\. a\., vor Steuern [+−][\d,]+\)\./g) || []).length === 4);
ok('Bericht: eine Tabelle mit zwoelf Zeilen (vier Laeufe x drei Lesarten)', zeilen.filter(function (z) { return /^\| .*Steuern.* \| [+−]/.test(z); }).length === 12);
ok('Bericht: kein NaN, kein undefined, der Pflichtsatz steht da', !/NaN|undefined|Infinity/.test(text) && text.indexOf('Rechenmodell mit Annahmen, keine Steuerberatung') >= 0);
ok('Bericht: keine verbotenen Woerter', !/belegt|bestätigt|Empfehlung|lohnt sich/.test(text));
ok('Bericht: hoechstens eine Seite (unter 45 Zeilen)', zeilen.length < 45);

/* ================= Teil V: echtes Panel - nur Steuersatz 0 ================= */
var PR = require(path.join(R.PRUEFSTAND, 'pruefstand.js'));
var T = PR.Tafel(R.PANEL_ORDNER), Q = R.vorbereiten(T);
Q.korbVorab = [KB.KORB_N];
var M = KB.Massnahmen(T, Q, KB.dateiLeser(null), KB.ERGAENZUNGEN, null), F = KB.fensterTage(T, Q), soll = St.sollLesen();
ok('Soll B-breit aus Nr. 78 / Nr. 74: 165.209,66 $ gegen 181.193,87 $', Math.round(soll['B-breit'].buchEnde * 100) === 16520966 && Math.round(soll['B-breit'].spyEnde * 100) === 18119387);
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var zufall = mulberry32(82);                      /* fester Startwert: die Auftragsnummer */
function dreiPhasen() { var aus = []; while (aus.length < 3) { var k = 1 + Math.floor(zufall() * 62); if (aus.indexOf(k) < 0) aus.push(k); } return aus; }
function null0(def, k) {
  return { startTag: Q.ptage[Q.ord[F[def.fenster].von] + k], endTag: F[def.fenster].bis, totalverlust: HAUPT, korb: def.korb, mechanik: def.mechanik, steuersatz: 0 };
}
St.LAEUFE.forEach(function (def) {
  var s = soll[def.name], L0 = St.simuliere(T, Q, M, null0(def, 0));
  ok('Selbstpruefung ' + def.name + ' k = 0: Buch ' + s.buchEnde.toFixed(2) + ' $', St.gleichCent(L0.endBuch, s.buchEnde));
  ok('Selbstpruefung ' + def.name + ' k = 0: SPY ' + s.spyEnde.toFixed(2) + ' $', St.gleichCent(L0.endSpy, s.spyEnde));
  var o78 = null0(def, 0); delete o78.steuersatz;
  ok('Selbstpruefung ' + def.name + ' k = 0: jeder Tageswert (Buch, SPY, Bargeld) gleich dem Rechner aus Nr. 78', tageGleich(L0, KB.simuliere(T, Q, M, o78)));
  ok('Selbstpruefung ' + def.name + ' k = 0: mit Steuersatz 0 keine Steuer', L0.steuer.gesamtB === 0);
  var ks = dreiPhasen();
  ks.forEach(function (k) {
    var Lk = St.simuliere(T, Q, M, null0(def, k)), p = s.phasen[k];
    ok('Selbstpruefung ' + def.name + ' Phase k = ' + k + ' (' + p.start + '): Buch und SPY wie in ' + (def.name === 'B-breit' ? 'Nr. 74' : 'Nr. 78'), p.k === k && p.start === String(T.kal.tage[Lk.startTag]) &&
      p.buchGesamt === (Lk.endBuch / R.START - 1) * 100 && p.spyGesamt === (Lk.endSpy / R.START - 1) * 100 && St.gleichCent(Lk.endBuch, R.START * (1 + p.buchGesamt / 100)));
  });
  console.log('   ' + def.name + ': gezogene Phasen ' + ks.join(', '));
});
/* der Schalter "gleich" bei Steuersatz 0 gegen Nr. 78 (kein Lauf dieses Auftrags, nur der Nachweis, dass der Schalter traegt) */
[['A-187-gleich', 'A'], ['B-187-gleich', 'B']].forEach(function (x) {
  var Lg = St.simuliere(T, Q, M, null0({ fenster: x[1], korb: KB.KORB_N, mechanik: 'gleich' }, 0));
  ok('Schalter Gleichgewicht, Steuersatz 0: ' + x[0] + ' wie in Nr. 78', St.gleichCent(Lg.endBuch, soll[x[0]].buchEnde) && St.gleichCent(Lg.endSpy, soll[x[0]].spyEnde));
});
/* der Fonds ohne Steuer, ohne Kosten, mit voller Wiederanlage = der Massstab aus Nr. 78 (prueft die SPY-Reihe und den Fonds-Rechner am echten Panel) */
['A', 'B'].forEach(function (f) {
  var reihe = St.spyReihe(T, Q, M, F[f].von, F[f].bis), Fo = St.fonds(reihe, R.START, OHNE), s = soll[f === 'A' ? 'A-187' : 'B-187'];
  ok('SPY-Reihe Fenster ' + f + ': ' + KB.FENSTER[f].handelstage + ' Handelstage, ' + KB.FENSTER[f].spyAusschuettungen + ' Ausschuettungen nach dem Kauftag', reihe.length === KB.FENSTER[f].handelstage &&
    reihe.slice(1).reduce(function (a, x) { return a + x.aus.length; }, 0) === KB.FENSTER[f].spyAusschuettungen);
  nah('Fonds ohne Abzuege = SPY aus Nr. 78, Fenster ' + f, Fo.endA, s.spyEnde, 1e-5);
  ok('Fonds Fenster ' + f + ': Kalenderjahre mit Faelligkeit im Fenster = ' + (f === 'A' ? '2017 bis 2020' : '2021 bis 2025'), Fo.jahre.map(function (j) { return j.jahr; }).join(',') ===
    (f === 'A' ? '2017,2018,2019,2020' : '2021,2022,2023,2024,2025') && Fo.vorabSteuer === 0);
});

console.log(gut + ' Pruefungen gruen, ' + schlecht + ' rot');
process.exit(schlecht ? 1 : 0);
