'use strict';
/* Umkehr nach einer Folge von Minustagen, long (Kudryavtsev 2017, European Financial and Accounting Journal 12(4) 83-96) - Form `tag`
 * (FORM.md §3). REGEL.md nennt jeden Parameter mit Fundstelle. Die Folge wird auf den Tagesrenditen der Aktie selbst gebildet
 * (Quelle §5.1: "raw daily stock returns" auf bereinigten Yahoo-Kursen, §4) - die Regel braucht weder Hoch/Tief noch den rohen
 * Schluss noch die Marktreihe (das Marktmodell der Quelle ist ihre Bewertung, nicht das Signal). Liest NUR ueber die Sicht (Zeilen <= i).
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */

/** Laenge der laufenden Minus-Folge, die am Tag i endet: zurueck von i, solange die Tagesrendite <= 0 ist; Nulltage verlaengern eine
 *  Folge, eroeffnen aber keine (Quelle §5.1: "I append the zero-return days to the sequences") - fuehrende Nulltage am Anfang der Folge
 *  zaehlen deshalb nicht. Grenze ist ein Plustag, ein fehlender Wert oder der Reihenanfang. 0, wenn Tag i nicht zur Folge gehoert. */
function folgenLaenge(sicht, i, max) {
  var laenge = 0, ersteEchte = 0;                        /* ersteEchte = Laenge bis einschliesslich des fruehesten echten Minustags */
  for (var j = i; j >= 1 && laenge < max; j--) {
    var c0 = sicht.c(j), c1 = sicht.c(j - 1);
    if (!(c0 > 0) || !(c1 > 0)) break;                    /* fehlender Wert: Folge endet hier (unbekannter Anfang zaehlt nicht mit) */
    if (c0 > c1) break;                                   /* Plustag beendet die Folge */
    laenge++;
    if (c0 < c1) ersteEchte = laenge;
  }
  return ersteEchte;
}

module.exports = {
  brauchtHochTief: false,
  brauchtRoh: false,
  brauchtMarkt: false,
  /** Signal am Tag i: +1, wenn die am Tag i laufende Folge von Tagen ohne Anstieg (mindestens ein echter Minustag am Anfang) mindestens
   *  folgeMin (5, Tabelle 1 Spalte "5 days") Tage lang ist. Der Schluss von Tag i muss da sein. Sonst null. */
  signal: function (sicht, i, params) {
    var n = (params && params.folgeMin) || 5;
    if (!(sicht.c(i) > 0)) return null;
    var L = folgenLaenge(sicht, i, n + 60);
    if (L < n) return null;
    return { dir: 1, folge: L };
  },
  folgenLaenge: folgenLaenge,
};
