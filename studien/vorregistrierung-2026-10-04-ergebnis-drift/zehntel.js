'use strict';
/* Zehntel PUNKT-IN-ZEIT (Entwurf §3, Auftrag §1.1).
 *
 * Vergleichsmenge eines Ereignisses mit Einstiegstag E: die Werte ALLER Ereignisse mit Einstiegstag in den `fenster` (63) Handelstagen
 * VOR E, also E-63 ... E-1 (Kalenderindex). Ereignisse desselben Tags und spaeterer Tage gehoeren nie dazu. Sind es weniger als
 * `mindestens` (200), gibt es kein Signal. Oberstes Zehntel: Wert >= 90. Perzentil der Vergleichsmenge; unterstes: Wert <= 10. Perzentil.
 * Perzentil mit linearer Interpolation zwischen den Rangplaetzen (Stelle p x (n-1) der aufsteigend sortierten Menge). Nichts gekappt.
 *
 * Das Modul kennt nur Tage und Werte - ob der Wert die Ueberraschung, eine Zufallszahl oder ein Placebo ist, weiss es nicht.
 * Es kennt keine Kurse und keine Ertraege.
 */
var OBEN = 1, UNTEN = -1, MITTE = 0, KEIN_SIGNAL = -2, VOR_FENSTER = -3;

function perzentil(sortiert, p) {
  var n = sortiert.length, st = p * (n - 1), lo = Math.floor(st), hi = Math.ceil(st);
  return sortiert[lo] + (sortiert[hi] - sortiert[lo]) * (st - lo);
}

/** Reihenfolge der Ereignisse nach Tag (einmal je Ereignismenge; fuer alle Laeufe wiederverwendbar). */
function ordnung(tag) {
  var n = tag.length, ord = new Int32Array(n);
  for (var i = 0; i < n; i++) ord[i] = i;
  ord.sort(function (a, b) { return tag[a] - tag[b] || a - b; });
  return ord;
}

/**
 * tag:  Int32Array - Einstiegstag je Ereignis (Kalenderindex)
 * wert: Float64Array - Signalwert je Ereignis (endlich)
 * opt:  { abTag: erster Tag, fuer den ein Signal gebildet wird, fenster: 63, mindestens: 200, anteil: 0.1, ord: ordnung(tag), grenzen: optional {} }
 * Rueckgabe Int8Array je Ereignis: OBEN, UNTEN, MITTE, KEIN_SIGNAL (Vergleichsmenge zu klein), VOR_FENSTER (Tag < abTag).
 */
function zuteilen(tag, wert, opt) {
  var n = tag.length, ord = opt.ord || ordnung(tag), aus = new Int8Array(n);
  var fenster = opt.fenster, mindestens = opt.mindestens, anteil = opt.anteil, abTag = opt.abTag;
  var lo = 0, hi = 0, pos = 0, puffer = new Float64Array(n);
  while (pos < n) {
    var E = tag[ord[pos]], ende = pos;
    while (ende < n && tag[ord[ende]] === E) ende++;
    if (E < abTag) { for (var q = pos; q < ende; q++) aus[ord[q]] = VOR_FENSTER; pos = ende; continue; }
    while (lo < n && tag[ord[lo]] < E - fenster) lo++;          /* erster Eintrag mit Tag >= E - fenster */
    if (hi < lo) hi = lo;
    while (hi < n && tag[ord[hi]] < E) hi++;                    /* hinter dem letzten Eintrag mit Tag <= E - 1 */
    var m = hi - lo, code = KEIN_SIGNAL, p10 = NaN, p90 = NaN;
    if (m >= mindestens) {
      for (var j = 0; j < m; j++) { var w = wert[ord[lo + j]]; if (!isFinite(w)) throw new Error('Signalwert nicht endlich'); puffer[j] = w; }
      var sicht = puffer.subarray(0, m); sicht.sort();
      p10 = perzentil(sicht, anteil); p90 = perzentil(sicht, 1 - anteil); code = MITTE;
    }
    if (opt.grenzen) opt.grenzen[E] = { n: m, p10: p10, p90: p90, vonTag: m ? tag[ord[lo]] : null, bisTag: m ? tag[ord[hi - 1]] : null };
    for (var r = pos; r < ende; r++) {
      var i = ord[r];
      aus[i] = code === KEIN_SIGNAL ? KEIN_SIGNAL : (wert[i] >= p90 ? OBEN : (wert[i] <= p10 ? UNTEN : MITTE));
    }
    pos = ende;
  }
  return aus;
}

module.exports = { zuteilen: zuteilen, ordnung: ordnung, perzentil: perzentil, OBEN: OBEN, UNTEN: UNTEN, MITTE: MITTE, KEIN_SIGNAL: KEIN_SIGNAL, VOR_FENSTER: VOR_FENSTER };
