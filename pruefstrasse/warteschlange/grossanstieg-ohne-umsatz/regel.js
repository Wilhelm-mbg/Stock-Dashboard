'use strict';
/* Grosser Tagesanstieg bei unauffaelligem Umsatz, long (Kudryavtsev 2019, Economic Annals 64(220) 85-116) - Form `tag` (FORM.md §3).
 * REGEL.md nennt jeden Parameter mit Fundstelle. Die Regel liest NUR ueber die Sicht (Zeilen <= i), braucht weder Hoch/Tief noch den
 * rohen Schluss noch die Marktreihe (Proxy A der Quelle: rohe Tagesrendite, kein Marktmodell im Ereignis) - laeuft auf dem Panel.
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */

/** Ereignis-Tagesrendite (log, Quelle Fn. 3) und abnormaler Umsatz ATV0 = (Vol0 - Mittel(250)) / Stdabw(250) (Quelle Gl. 3).
 *  null, wenn das Fenster nicht voll ist oder ein Wert fehlt. */
function kennzahlen(sicht, i, params) {
  var F = (params && params.fenster) || 250;
  if (i - F < 0) return null;                                   /* 250 Handelstage vor dem Ereignis (Quelle §4, Filter i) */
  var c0 = sicht.c(i), c1 = sicht.c(i - 1), v0 = sicht.v(i);
  if (!(c0 > 0) || !(c1 > 0) || !(v0 >= 0)) return null;
  var s = 0, s2 = 0;
  for (var j = i - F; j < i; j++) {
    var v = sicht.v(j), c = sicht.c(j);
    if (!(v >= 0) || !(c > 0)) return null;                     /* Luecke im Schaetzfenster: kein Ereignis */
    s += v; s2 += v * v;
  }
  var mittel = s / F, varianz = (s2 - F * mittel * mittel) / (F - 1);
  if (!(varianz > 0)) return null;
  return { r: Math.log(c0 / c1), atv: (v0 - mittel) / Math.sqrt(varianz) };
}

module.exports = {
  brauchtHochTief: false,
  brauchtRoh: false,
  brauchtMarkt: false,
  /** Signal am Tag i: +1, wenn ln(c_i / c_{i-1}) > 0,08 (und <= 0,5) und ATV0 <= 1,52 (unterstes Quintil der Quelle), sonst null. */
  signal: function (sicht, i, params) {
    var p = params || {}, schwelle = p.schwelleLog != null ? p.schwelleLog : 0.08, kappe = p.kappeLog != null ? p.kappeLog : 0.5,
      atvMax = p.atvMax != null ? p.atvMax : 1.52;
    var k = kennzahlen(sicht, i, p);
    if (k === null || !(k.r > schwelle) || k.r > kappe || !(k.atv <= atvMax)) return null;
    return { dir: 1, r: k.r, atv: k.atv };
  },
  kennzahlen: kennzahlen,
};
