'use strict';
/* ZWILLING v2 - Regel B1 des PM fuer die Gruende-Tafel v2 und das Panel v2.3 (Auftrag Nr. 92, Schritt 2, 04.10.2026).
 *
 * Baut auf ../zaehllauf4/zwilling.js auf (per require, unveraendert): Bedingung (a) mit Toleranz 1e-9 beim Verhaeltnis
 * Eroeffnung/Schluss, (c) fuenf Panel-Zeilen Nachlauf. NEU ist nur der Zusatz zu (b):
 *
 *   (b) zaehlt einen Tag des 60-Tage-Fensters auch dann als gleich, wenn das Verhaeltnis der rohen Schluesse beider Reihen
 *       ueber das ganze Fenster gleich bleibt (relative Abweichung hoechstens 1e-6) - dann liegt nur ein Split dazwischen.
 *
 * LESART (in TAFEL-V2-PANEL-V23.md festgehalten): betrachtet werden die Tage des Fensters, an denen C eine Zeile hat. Tage mit
 * genau gleichem rohem Schluss zaehlen wie bisher. Die uebrigen Tage ("ungleich") zaehlen zusaetzlich, wenn das Verhaeltnis
 * C.roh / D.roh an ALLEN ungleichen Tagen des Fensters dasselbe ist: (max - min) <= 1e-6 * max. Gleiche und ungleiche Tage
 * zusammen sind dann zwei Stuecke mit je festem Verhaeltnis (1 und k) - genau das Bild eines Splits zwischen beiden Reihen.
 * Ob die ungleichen Tage ein zusammenhaengendes Stueck VOR den gleichen bilden, wird nur ausgewiesen (`vorStueck`).
 *
 * Reine Funktionen, kein Panel, keine Platte. Eine Reihe ist { tage: [Tagesindex aufsteigend], roh: [...], verh: [...] }.
 */
var ZW = require('../zaehllauf4/zwilling.js');

var B1_TOL = 1e-6;   // relative Abweichung des Verhaeltnisses der rohen Schluesse ueber das Fenster

/** Zusatz B1 fuer ein Paar: Zahl der ungleichen Fenstertage und ob ihr Verhaeltnis fest ist. */
function zusatzB1(D, C) {
  var n = D.tage.length, von = Math.max(0, n - ZW.B_FENSTER);
  var lo = Infinity, hi = -Infinity, ungleich = 0, ersterGleich = -1, letzterUngleich = -1, kaputt = false;
  for (var q = von; q < n; q++) {
    var i = ZW.finde(C.tage, D.tage[q]);
    if (i < 0) continue;
    if (C.roh[i] === D.roh[q]) { if (ersterGleich < 0) ersterGleich = q; continue; }
    ungleich++; letzterUngleich = q;
    var r = C.roh[i] / D.roh[q];
    if (!(r > 0) || !isFinite(r)) { kaputt = true; continue; }
    if (r < lo) lo = r;
    if (r > hi) hi = r;
  }
  var abw = ungleich && !kaputt ? (hi - lo) / hi : null;
  return { ungleich: ungleich, verhaeltnis: ungleich && !kaputt ? hi : null, abweichung: abw,
    fest: ungleich > 0 && !kaputt && abw <= B1_TOL,
    vorStueck: ungleich > 0 && (ersterGleich < 0 || letzterUngleich < ersterGleich) };
}

/** Wie ZW.pruefe, dazu B1: bGleichB1, bB1, okB1 und der Zusatz. Mit b1 = false ist das Ergebnis das von ZW.pruefe. */
function pruefe(D, C, b1) {
  var p = ZW.pruefe(D, C);
  if (p.zuKurz) { p.bGleichB1 = 0; p.bB1 = false; p.okB1 = false; p.b1 = null; return p; }
  var z = zusatzB1(D, C);
  p.b1 = z;
  p.bGleichB1 = p.bGleich + (z.fest ? z.ungleich : 0);
  p.bB1 = p.bGleichB1 >= p.bNoetig;
  p.okB1 = p.a && p.bB1 && p.c;
  if (b1 === false) { p.bB1 = p.b; p.okB1 = p.ok; p.bGleichB1 = p.bGleich; }
  return p;
}

/** Wahl unter mehreren Kandidaten ({ name, p }) wie ZW.waehle (Lesart 2 des vierten Laufs), mit B1: alle drei Bedingungen
 *  (b nach B1), dann die meisten gleichen Tage nach B1, dann der laengste Nachlauf, dann der Name. Mit b1 = false = ZW.waehle. */
function waehle(kand, b1) {
  if (b1 === false) return ZW.waehle(kand);
  var ok = kand.filter(function (k) { return k.p.okB1; });
  ok.sort(function (x, y) { return (y.p.bGleichB1 - x.p.bGleichB1) || (y.p.cTage - x.p.cTage) || (x.name < y.name ? -1 : x.name > y.name ? 1 : 0); });
  return ok[0] || null;
}

module.exports = { B1_TOL: B1_TOL, zusatzB1: zusatzB1, pruefe: pruefe, waehle: waehle, ZW: ZW };
