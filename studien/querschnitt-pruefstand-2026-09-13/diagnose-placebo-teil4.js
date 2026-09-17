'use strict';
/* DIAGNOSE zum Placebo von Teil 4 (nachrichtlich, kein Ersatz der 12 registrierten Ziehungen):
 * 11 von 12 Ziehungen negativ bei Mittel -0,24 Pp - Bias oder Schiefe? Erwartungswert einer Permutation ist null;
 * Extremwerte (eine Aktie mit +1.000 % in 120 Tagen) landen mit Wahrscheinlichkeit |AnB|/|A| auf der groesseren Seite
 * und machen die typische Ziehung negativ, den Mittelwert aber nicht. Prueft: (1) 60 weitere Ziehungen mit anderer
 * Saatfamilie - Mittel, Median, Anteil negativ; (2) die groessten Einzelrenditen je Monat unter den A-Mitgliedern.
 * Aufruf: node --max-old-space-size=6144 diagnose-placebo-teil4.js --aus voll   -> diagnose-placebo-teil4.json */
var fs = require('fs'), path = require('path');
var K = require('./konfig.js'), PR = require('./pruefstand.js'), ST = require('./statistik.js'), T4 = require('./teil4.js');
var aus = process.argv[process.argv.indexOf('--aus') + 1] || 'voll', ZIEH = 60, SAAT = 'teil4-placebo-diagnose-2026-09-18';
var T = PR.Tafel(aus), F = require(K.FUNDAMENTAL_LESER).oeffne(undefined, { maxAlterTage: K.TEIL4_FUNDAMENT_MAX_ALTER_TAGE });
var KL = K.UNIVERSUM_KLASSEN_TEIL3, H0 = K.TEIL4_HORIZONTE[0], tv = {}; K.EMPFINDLICHKEIT[0].totalverlust.forEach(function (g) { tv[g] = true; });
var S = [];
PR.signaltage(T, 'monat').forEach(function (t) {
  var U = PR.universum(T, t, { klassen: KL }); if (!U.liste.length || U.aTag === null) return;
  var sel = T4.auswahl(PR.Sicht(T, t, {}), U.liste, T, F, {}); if (!sel.ok) return;
  var aE = T4.periodenEnde(T, U.aTag, H0.tage); if (aE === null) return;
  S.push({ t: t, iso: T.kal.tage[t], a: U.aTag, aE: aE, mIdx: T4.monatsIndex(T.kal.tage[U.aTag]), A: sel.liste.filter(function (e) { return e.istA; }) });
});
/* (2) groesste Einzelrendite je Monat unter A (Eroeffnung a -> Eroeffnung aEnde, letzte Zeile bei Ende) */
var g = T.g, extreme = [];
S.forEach(function (s) {
  var best = null;
  s.A.forEach(function (e) {
    var z1 = T.zeileVon(e.sym, s.a), z2 = T.zeileVon(e.sym, s.aE);
    if (z2 < 0) { var l = T.letzteZeile(e.sym); if (l >= 0 && g.tag[l] > s.a && g.tag[l] < s.aE) z2 = l; }
    if (z1 < 0 || z2 < 0 || !(g.bEroeffnung[z1] > 0)) return;
    var r = 100 * (g.bEroeffnung[z2] / g.bEroeffnung[z1] - 1);
    if (best === null || r > best.r) best = { kuerzel: T.symName[e.sym], r: r, b: e.b };
  });
  if (best) extreme.push({ monat: T.kal.tage[s.a].slice(0, 7), nA: s.A.length, nAF: s.A.filter(function (e) { return e.b !== null; }).length, kuerzel: best.kuerzel, rendite: best.r, b: best.b,
    beitragWennAB: best.r / Math.max(1, s.A.filter(function (e) { return e.b === 1; }).length), beitragWennAnB: -best.r / Math.max(1, s.A.filter(function (e) { return e.b === 0; }).length) });
});
extreme.sort(function (x, y) { return y.rendite - x.rendite; });
/* (1) 60 Ziehungen */
var mittelwerte = [];
for (var k = 0; k < ZIEH; k++) {
  var P = [];
  S.forEach(function (s) {
    var sides = T4.placeboSeiten(s.A, SAAT + '#' + k + '|' + s.iso);
    if (sides.ab.length < K.TEIL4_MIN_JE_SEITE || sides.anb.length < K.TEIL4_MIN_JE_SEITE) return;
    var c1 = T4.korb(T, sides.ab, s.t, s.a, s.aE, tv), c2 = T4.korb(T, sides.anb, s.t, s.a, s.aE, tv);
    P.push({ mIdx: s.mIdx, dNetto: c1.netto - c2.netto });
  });
  var r = T4.reihe(P, 'dNetto', H0.lag); mittelwerte.push(r.mittel);
  if (k % 10 === 9) process.stdout.write('  Ziehung ' + (k + 1) + '/' + ZIEH + '\n');
}
var m = ST.periodenMomente(mittelwerte), sortiert = mittelwerte.slice().sort(function (a, b) { return a - b; });
var out = { kennung: K.KONFIG_KENNUNG_TEIL4 + '/diagnose-placebo', stand: new Date().toISOString(), ziehungen: ZIEH, saat: SAAT, monate: S.length,
  mittel: m.mittel, seDesMittels: m.seNaiv, tGegenNull: m.t, sdDerZiehungen: m.sd, median: sortiert[ZIEH >> 1], anteilNegativ: mittelwerte.filter(function (x) { return x < 0; }).length / ZIEH,
  min: sortiert[0], max: sortiert[ZIEH - 1], mittelwerte: mittelwerte, extremeTop15: extreme.slice(0, 15),
  lesart: 'Erwartungswert der Permutation ist null; bei Schiefe liegt der Median unter null und der Anteil negativer Ziehungen ueber 50 %, das Mittel aber innerhalb von 2 se um null.' };
fs.writeFileSync(path.join(__dirname, 'diagnose-placebo-teil4.json'), JSON.stringify(out, null, 1));
process.stdout.write('Placebo-Diagnose (' + ZIEH + '): Mittel ' + m.mittel.toFixed(4) + ' Pp (se ' + m.seNaiv.toFixed(4) + ', t ' + m.t.toFixed(2) + '), Median ' + out.median.toFixed(4) + ', negativ ' + (100 * out.anteilNegativ).toFixed(0) + ' %, min/max ' + out.min.toFixed(3) + ' / ' + out.max.toFixed(3) + '\n');
extreme.slice(0, 8).forEach(function (e) { process.stdout.write('  ' + e.monat + ' ' + e.kuerzel + ' +' + e.rendite.toFixed(0) + ' % (B ' + e.b + '); Beitrag zur Monatsdifferenz wenn AB +' + e.beitragWennAB.toFixed(1) + ' / wenn AnB ' + e.beitragWennAnB.toFixed(1) + ' Pp\n'); });
