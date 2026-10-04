'use strict';
/* M4 - die Ueberraschung je zugeordneter Tafelzeile (Auftrag §5.4).
 *
 *   SUE = (netto D0 - netto D4) / sd(netto D0 ... D7),   sd = Stichproben-sd mit n-1 = 7
 *
 * HERKUNFT: die Rechenzeilen der Funktion `sue` sind aus studien/mehrfaktor-2026-09-22/felder/sue/feld.js uebernommen
 * (dort Zeilen 38-47; die Funktion ist dort nicht exportiert). test.js haelt beide an Kunstfaellen gegeneinander (ueber
 * feld.werte mit einer Kunst-Sicht).
 *
 * ABWEICHUNG VOM FELD, AUSDRUECKLICH GEWOLLT (§5.4): das Feld nimmt das juengste Filing mit `filed` strikt vor dem Signaltag;
 * hier wird die in M3 der Meldung zugeordnete Zeile genommen, auch wenn ihr 10-Q/10-K erst NACH der Meldung eingereicht
 * wurde - die Zahl stand am Meldetag in der Pressemitteilung. Das ist die Annahme dieser Studie, kein Befund.
 *
 * Dieses Modul kennt keine Kurse und keine Ertraege.
 */

function sue(q) {                                             /* q = acht endliche Zahlen; Rueckgabe Zahl oder null (sd = 0) */
  var s = 0, i;
  for (i = 0; i < 8; i++) s += q[i];
  var m = s / 8, ss = 0;
  for (i = 0; i < 8; i++) ss += (q[i] - m) * (q[i] - m);
  var sd = Math.sqrt(ss / 7);                                 /* Stichproben-sd, n-1 = 7 */
  if (!(sd > 0)) return null;
  var w = (q[0] - q[4]) / sd;
  return (typeof w === 'number' && isFinite(w)) ? w : null;
}

/** Tafelzeile -> {wert, grund}: wert = SUE oder null; grund = 'ok' | 'quartalFehlt' | 'sdNull'. Dieselben null-Regeln wie im Feld. */
function ausZeile(zeile) {
  var q = zeile && zeile.quartale && zeile.quartale.netto;
  if (!q || q.length < 8) return { wert: null, grund: 'quartalFehlt' };
  for (var i = 0; i < 8; i++) if (typeof q[i] !== 'number' || !isFinite(q[i])) return { wert: null, grund: 'quartalFehlt' };
  var w = sue(q);
  return w === null ? { wert: null, grund: 'sdNull' } : { wert: w, grund: 'ok' };
}

module.exports = { sue: sue, ausZeile: ausZeile };
