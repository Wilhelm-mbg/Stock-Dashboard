'use strict';
/* Donchian-20-Ausbruch nach oben, bestaetigt, long - Form `tag` (FORM.md §3). REGEL.md nennt jeden Parameter mit Fundstelle.
 * Die Regel liest NUR ueber die Sicht (Zeilen <= i); Hoch und Tief sind noetig (brauchtHochTief). Spiegelbild der Trendkanal-
 * Funktionen k3Reihe/k3Am/e1Signal/e1Bestaetigt (kanaele.js), nur ohne Vorrechnung ueber die ganze Reihe - die waere ein Blick
 * nach vorn. Simulation mit virtuellem Kapital, keine Anlageberatung. */

/** Obere/untere Linie am Tag i: max Hoch / min Tief ueber i-N..i-1 (Vergleich mit NaN ist falsch - wie k3Reihe). */
function linie(sicht, i, N) {
  if (i - N < 0) return null;
  var mx = -Infinity, mn = Infinity;
  for (var j = i - N; j < i; j++) { var h = sicht.h(j), l = sicht.l(j); if (h > mx) mx = h; if (l < mn) mn = l; }
  return { oben: mx, unten: mn };
}
/** Kanal am Tag i mit Richtung aus dem Vergleich mit dem Stand vor ceil(N/2) Tagen (k3Am). */
function kanal(sicht, i, N) {
  var halb = Math.ceil(N / 2);
  if (i < N + halb) return null;
  var L = linie(sicht, i, N), A = linie(sicht, i - halb, N);
  if (!L || !A || !(L.oben > 0) || !(L.unten > 0) || !(A.oben > 0) || !(A.unten > 0)) return null;
  var richtung = (L.oben > A.oben && L.unten > A.unten) ? 'auf' : (L.oben < A.oben && L.unten < A.unten) ? 'ab' : 'seit';
  return { oben: L.oben, unten: L.unten, richtung: richtung };
}

module.exports = {
  brauchtHochTief: true,
  /** Signal am Tag i: +1 Ausbruch nach oben (Kanal nicht 'ab', Schluss > oben x (1 + confirmBps)), -1 spiegelbildlich, sonst null. */
  signal: function (sicht, i, params) {
    var N = (params && params.N) || 20, conf = ((params && params.confirmBps) != null ? params.confirmBps : 15) / 10000;
    var k = kanal(sicht, i, N);
    if (!k) return null;
    var ci = sicht.c(i);
    if (k.richtung !== 'ab' && ci > k.oben * (1 + conf)) return { dir: 1, oben: k.oben, unten: k.unten };
    if (k.richtung !== 'auf' && ci < k.unten * (1 - conf)) return { dir: -1, oben: k.oben, unten: k.unten };
    return null;
  },
  /** Bestaetigung am Folgetag gegen DIESELBE Linie (Donchian laeuft nach, e1Bestaetigt fuer K3). */
  bestaetigt: function (sicht, i1, params, sig) {
    var c1 = sicht.c(i1);
    return sig.dir > 0 ? c1 > sig.oben : c1 < sig.unten;
  },
  linie: linie, kanal: kanal,
};
