'use strict';
/* Ertragstermin-Drift als reine Signalfunktion (bars, i, P) -> {dir} | null
 *
 * Quelle der Logik: C:\Users\Wilhe\Downloads\Stock-Dashboard\drift.js
 *   ereignisse()  Reaktionstag = erster Handelstag, dessen Schluss nach der Meldung liegt
 *                 (Meldung ab 20:00 UTC -> Folgetag)
 *   zuordnen()    Richtung +1, wenn die Ueberraschung im obersten Fuenftel der
 *                 Ueberraschungen des ganzen Universums der letzten 120 Handelstage liegt
 *                 (mind. 40 Vergleichstermine), -1 im untersten Fuenftel
 * Die Rangbildung ist ein Querschnitt ueber das Universum und haengt am Handelstag-Index
 * des Marktes (SPY). Deshalb zwei Stufen:
 *   1. signalTabelle(kursMap, termineMap, markt, opts) -> { SYM: { 'YYYY-MM-DD': +1|-1 } }
 *      (einmal je Universum; benutzt NUR Daten bis zum jeweiligen Reaktionstag)
 *   2. signal(bars, i, P) mit P.signale = tabelle[SYM]: feuert auf der SCHLUSSKERZE des
 *      Reaktionstags (Tageskerze: die Kerze des Tages; Intraday: erste Kerze ab 15:00 ET).
 */
var Dr = require('../../../drift.js');

var STANDARD = Object.assign({}, Dr.STANDARD);   // fenster 120, anteil 0.20, halten 60, minVergleich 40

function signalTabelle(kursMap, termineMap, markt, opts) {
  var O = Object.assign({}, STANDARD, opts || {}, { zukunftNoetig: false });
  var pos = Dr.zuordnen(Dr.ereignisse(kursMap, termineMap, markt, O), O);
  var tab = {};
  pos.forEach(function (p) {
    var d = new Date(p.e.t).toISOString().slice(0, 10);
    (tab[p.e.sym] = tab[p.e.sym] || {})[d] = p.richtung;
  });
  return tab;
}

/* US-Sommerzeit: zweiter Sonntag im Maerz bis erster Sonntag im November */
function etMinuten(ms) {
  var d = new Date(ms), y = d.getUTCFullYear();
  var mar = new Date(Date.UTC(y, 2, 1)).getUTCDay(), nov = new Date(Date.UTC(y, 10, 1)).getUTCDay();
  var dstStart = Date.UTC(y, 2, 8 + ((7 - mar) % 7), 7);    // 2. Sonntag Maerz, 2:00 EST = 7:00 UTC
  var dstEnde = Date.UTC(y, 10, 1 + ((7 - nov) % 7), 6);    // 1. Sonntag November, 2:00 EDT = 6:00 UTC
  var off = (ms >= dstStart && ms < dstEnde) ? -4 : -5;
  var lokal = ms + off * 3600000;
  return Math.floor((lokal % 86400000) / 60000);
}

/* [Gegenpruefung 22.08.] Tagesreihe erkennen ueber den KLEINSTEN Abstand der ersten Kerzen,
 * nicht ueber den Abstand zur Vorkerze: Die erste 60m-Kerze nach Wochenende/Feiertag liegt
 * 66-90 h hinter der Vorkerze und galt so als Tageskerze -> Signal um 9:30 ET statt 15:30,
 * und der Tag feuerte doppelt (9 von 280 Signalkerzen auf 99 Tier-B-Werten). */
function istTagesreihe(bars, P) {
  if (P && P.tages != null) return !!P.tages;
  var min = Infinity;
  for (var k = 1; k < Math.min(bars.length, 40); k++) { var d = bars[k][0] - bars[k - 1][0]; if (d > 0 && d < min) min = d; }
  return min >= 20 * 3600000;
}

/** bars: [[t, kurs, ...]], i: Index, P: { signale: {'YYYY-MM-DD': +1|-1}, schlussAbMin?: 900, tages?: bool } */
function signal(bars, i, P) {
  var t = bars[i][0], dir = P.signale[new Date(t).toISOString().slice(0, 10)];
  if (!dir) return null;
  if (!istTagesreihe(bars, P) && etMinuten(t) < (P.schlussAbMin || 900)) return null;   // 15:00 ET
  return { dir: dir };
}

module.exports = { STANDARD: STANDARD, signalTabelle: signalTabelle, signal: signal, istTagesreihe: istTagesreihe, etMinuten: etMinuten, Dr: Dr };
