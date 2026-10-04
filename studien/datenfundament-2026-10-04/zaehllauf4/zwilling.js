'use strict';
/* ZWILLING - V9 des vierten Zaehllaufs (Auftrag Nr. 92): hat eine abgegangene Reihe im Tages-Panel einen Zwilling?
 *
 * Reine Funktionen, kein Panel, keine Platte (z4-panel.js laedt das Panel und ruft sie auf; test.js prueft sie an
 * Kunstreihen). Eine Reihe ist { tage: [Tagesindex aufsteigend], roh: [roher Schluss], verh: [Eroeffnung / Schluss] }.
 *
 * Eine abgegangene Reihe D hat einen Zwilling, wenn eine ANDERE Reihe C
 *   (a) an den drei letzten Tagen von D genau denselben rohen Schluss und dasselbe Verhaeltnis Eroeffnung zu Schluss hat,
 *   (b) an mindestens 45 der letzten 60 Tage von D (D kuerzer als 60 Tage: an mindestens 75 % ihrer Tage) denselben
 *       rohen Schluss hat und
 *   (c) danach noch mindestens fuenf Handelstage weiterlaeuft (fuenf Panel-Zeilen von C nach dem letzten Tag von D).
 * Zwei Reihen, die (a) erfuellen, aber am selben Tag enden, sind kein Fall (sie scheitern an c; gesondert gezaehlt).
 */
var A_TAGE = 3, B_FENSTER = 60, B_MIN = 45, B_ANTEIL = 0.75, C_MIN = 5;
var VERH_TOL = 1e-9;   // Lesart: das Verhaeltnis wird aus bereinigten Kursen gebildet - gleich bis auf Rundung im 9. Stellenwert

/** Index von t in der aufsteigenden Liste tage, sonst -1. */
function finde(tage, t) {
  var a = 0, b = tage.length;
  while (a < b) { var m = (a + b) >> 1; if (tage[m] < t) a = m + 1; else b = m; }
  return a < tage.length && tage[a] === t ? a : -1;
}
/** Zahl der Eintraege in tage, die groesser als t sind. */
function danach(tage, t) {
  var a = 0, b = tage.length;
  while (a < b) { var m = (a + b) >> 1; if (tage[m] <= t) a = m + 1; else b = m; }
  return tage.length - a;
}
function gleichesVerh(x, y) {
  if (x === y) return true;
  if (!(x > 0) || !(y > 0)) return false;
  return Math.abs(x - y) <= VERH_TOL * Math.max(x, y);
}
/** Noetige Zahl gleicher Tage fuer (b) bei einer Reihe mit n Tagen. */
function bNoetig(n) { return n >= B_FENSTER ? B_MIN : Math.ceil(B_ANTEIL * n - 1e-9); }

/** Prueft C als Zwilling von D. Rueckgabe: { a, aExakt, b, bGleich, bTage, bNoetig, c, cTage, gleichesEnde, ok, zuKurz } */
function pruefe(D, C) {
  var n = D.tage.length, aus = { a: false, aExakt: false, b: false, bGleich: 0, bTage: 0, bNoetig: 0, c: false, cTage: 0, gleichesEnde: false, ok: false, zuKurz: 0 };
  if (n < A_TAGE) { aus.zuKurz = 1; return aus; }
  var a = true, exakt = true;
  for (var k = n - A_TAGE; k < n; k++) {
    var j = finde(C.tage, D.tage[k]);
    if (j < 0 || C.roh[j] !== D.roh[k] || !gleichesVerh(C.verh[j], D.verh[k])) { a = false; break; }
    if (C.verh[j] !== D.verh[k]) exakt = false;
  }
  aus.a = a; aus.aExakt = a && exakt;
  var von = Math.max(0, n - B_FENSTER);
  aus.bTage = n - von; aus.bNoetig = bNoetig(n);
  for (var q = von; q < n; q++) { var i = finde(C.tage, D.tage[q]); if (i >= 0 && C.roh[i] === D.roh[q]) aus.bGleich++; }
  aus.b = aus.bGleich >= aus.bNoetig;
  var ende = D.tage[n - 1];
  aus.cTage = danach(C.tage, ende); aus.c = aus.cTage >= C_MIN;
  aus.gleichesEnde = C.tage.length > 0 && C.tage[C.tage.length - 1] === ende;
  aus.ok = aus.a && aus.b && aus.c;
  return aus;
}
/** Doppelte Zeilen: Tage von D, an denen C denselben rohen Schluss hat (ueber die ganze Reihe D). */
function doppelte(D, C) {
  var z = 0;
  for (var k = 0; k < D.tage.length; k++) { var j = finde(C.tage, D.tage[k]); if (j >= 0 && C.roh[j] === D.roh[k]) z++; }
  return z;
}
/** Von mehreren Kandidaten (je { name, p: pruefe(...) }) der Zwilling: alle drei Bedingungen, dann die meisten gleichen
 *  Tage unter (b), dann der laengste Nachlauf, dann der Name. Sonst null. (Lesart 2 in REGEL-ZAEHLLAUF4.md) */
function waehle(kand) {
  var ok = kand.filter(function (k) { return k.p.ok; });
  ok.sort(function (x, y) { return (y.p.bGleich - x.p.bGleich) || (y.p.cTage - x.p.cTage) || (x.name < y.name ? -1 : x.name > y.name ? 1 : 0); });
  return ok[0] || null;
}

module.exports = { A_TAGE: A_TAGE, B_FENSTER: B_FENSTER, B_MIN: B_MIN, B_ANTEIL: B_ANTEIL, C_MIN: C_MIN, VERH_TOL: VERH_TOL,
  finde: finde, danach: danach, gleichesVerh: gleichesVerh, bNoetig: bNoetig, pruefe: pruefe, doppelte: doppelte, waehle: waehle };
