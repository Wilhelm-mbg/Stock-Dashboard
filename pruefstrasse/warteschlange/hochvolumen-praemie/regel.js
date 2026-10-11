'use strict';
/* High-Volume Return Premium (Gervais, Kaniel & Mingelgrin 2001), long - Form `tag` (FORM.md §3). REGEL.md nennt jeden
 * Parameter mit Fundstelle. Die Regel liest NUR ueber die Sicht (Zeilen <= i), braucht weder Hoch noch Tief (laeuft auf dem Panel).
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */

/** Dollarumsatz am Tag j: Schluss x Stueck (GKM Fn. 9: Stueckzahl x letzter Kurs). NaN, wenn ein Wert fehlt. */
function dollarUmsatz(sicht, j) {
  var c = sicht.c(j), v = sicht.v(j);
  if (!(c > 0) || !(v >= 0)) return NaN;
  return c * v;
}

/** Rang des Dollarumsatzes von Tag i im Fenster i-(F-1) .. i (1 = kleinster, F = groesster); null bei Luecke oder Kurs < Mindestkurs. */
function rang(sicht, i, params) {
  var F = (params && params.fenster) || 50, minK = (params && params.mindestKurs != null) ? params.mindestKurs : 5;
  if (i - (F - 1) < 0) return null;
  var heute = dollarUmsatz(sicht, i);
  if (heute !== heute) return null;
  var r = 1;
  for (var j = i - (F - 1); j < i; j++) {
    var d = dollarUmsatz(sicht, j);
    if (d !== d) return null;                 /* fehlender Tag im Fenster: Reihe faellt fuer dieses Fenster weg (GKM Fn. 7) */
    if (!(sicht.c(j) >= minK)) return null;   /* Kurs im Referenzzeitraum je unter 5 $ (GKM S. 4) */
    if (d < heute) r++;
  }
  return r;
}

module.exports = {
  brauchtHochTief: false,
  /** Signal am Tag i: +1, wenn der Dollarumsatz von Tag i im 50-Tage-Fenster Rang >= 46 hat (oberste 10 %), sonst null. */
  signal: function (sicht, i, params) {
    var rMin = (params && params.rangMin) || 46;
    var r = rang(sicht, i, params);
    if (r === null || r < rMin) return null;
    return { dir: 1, rang: r };
  },
  dollarUmsatz: dollarUmsatz, rang: rang,
};
