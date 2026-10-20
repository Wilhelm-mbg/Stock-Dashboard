'use strict';
/* FOMC-Zyklus, gerade Wochen (Cieslak, Morse & Vissing-Jorgensen, JF 74(5) 2019), long - Form `tag` (FORM.md §3), Bewertung `zeit`.
 * REGEL.md nennt jeden Parameter mit Fundstelle. Zykluszeit der Quelle: Tag 0 = planmaessiger Bekanntgabetag, gezaehlt in Handelstagen;
 * Woche 0 = Tage -1..3, Woche 2 = 9..13, Woche 4 = 19..23, Woche 6 = 29..33; ein 5-Tage-Fenster, das naeher als Tag -6 an der naechsten
 * Sitzung beginnt, zaehlt die Quelle nicht (Woche -1 der naechsten Sitzung). Die Pruefstrasse steigt zur Eroeffnung des Tages NACH dem
 * Signal ein, also steht das Signal am Tag vor Fensterbeginn: Woche 0 am Tag -2 (aus dem DATUM gerechnet wie vor-fomc-long, weil die Tafel
 * hinter i nicht lesbar ist), Woche 2/4/6 am Tag 8/18/28 (gezaehlt in Zeilen der Reihe seit der Zeile des Bekanntgabetags - nur Zeilen <= i).
 * Die naechste Sitzung steht in der Terminliste (in der Wirklichkeit ein Jahr im Voraus bekannt); ihr Abstand wird in Werktagen (Mo-Fr)
 * gerechnet, nicht im Kalender der Tafel. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var TAG_MS = 86400000;
function utc(d) { return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)); }
function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
function istWerktag(ms) { var w = new Date(ms).getUTCDay(); return w !== 0 && w !== 6; }
/** Naechster Werktag (Mo-Fr) nach dem Datum d. */
function naechsterWerktag(d) {
  var ms = utc(d) + TAG_MS;
  while (!istWerktag(ms)) ms += TAG_MS;
  return iso(ms);
}
/** Werktage (Mo-Fr) im Intervall (a, b] - Abstand in Werktagen von a nach b. */
function werktageZwischen(a, b) {
  var n = 0, ms = utc(a) + TAG_MS, ende = utc(b);
  for (; ms <= ende; ms += TAG_MS) if (istWerktag(ms)) n++;
  return n;
}
function liste(params) {
  var L = params && params.fomcTage;
  return Array.isArray(L) && L.length ? L : null;
}
/** Letzter Listentag <= d und erster Listentag > d (die Liste ist sortiert; JJJJ-MM-TT vergleicht lexikographisch). */
function umgebung(d, L) {
  var vor = null, nach = null;
  for (var q = 0; q < L.length; q++) { if (L[q] <= d) vor = L[q]; else { nach = L[q]; break; } }
  return { vor: vor, nach: nach };
}
var WOCHE_AB_TAG = { 8: 2, 18: 4, 28: 6 };      /* Signaltag (Handelstage seit Tag 0) -> Woche; Einstieg am Folgetag = 9, 19, 29 */
var MIN_ABSTAND = 7;                            /* Einstieg spaetestens Tag -7 vor der naechsten Bekanntgabe (Quelle: ab Tag -6 nicht gezaehlt) */
var MAX_RUECK = 40;                             /* Woche 6 braucht 28 Zeilen; Woche 7+ laesst die Quelle weg */

module.exports = {
  brauchtHochTief: false,
  brauchtRoh: false,
  brauchtMarkt: false,
  brauchtDatum: true,
  /** Signal am Tag i: +1, wenn der Folgetag der erste Tag einer geraden Woche (0, 2, 4, 6) der FOMC-Zykluszeit ist. */
  signal: function (sicht, i, params) {
    var L = liste(params), d = sicht.datum(i);
    if (!L || typeof d !== 'string' || d.length !== 10) return null;
    /* Woche 0: der uebernaechste Werktag nach d ist ein Bekanntgabetag (Einstieg = Eroeffnung Tag -1) */
    var A0 = naechsterWerktag(naechsterWerktag(d));
    if (L.indexOf(A0) !== -1) return { dir: 1, woche: 0, bekanntgabe: A0 };
    /* Woche 2/4/6: Handelstage seit der letzten Bekanntgabe, in Zeilen der Reihe (nur j <= i) */
    var u = umgebung(d, L);
    if (!u.vor || !u.nach) return null;
    var k = -1;
    for (var j = i; j >= 0 && i - j <= MAX_RUECK; j--) {
      var dj = sicht.datum(j);
      if (typeof dj !== 'string') return null;
      if (dj === u.vor) { k = i - j; break; }
      if (dj < u.vor) return null;                /* Zeile des Bekanntgabetags fehlt in der Reihe: Zykluszeit unbekannt */
    }
    var woche = WOCHE_AB_TAG[k];
    if (!woche) return null;
    var E = naechsterWerktag(d);
    if (werktageZwischen(E, u.nach) < MIN_ABSTAND) return null;
    return { dir: 1, woche: woche, bekanntgabe: u.vor, tagImZyklus: k + 1 };
  },
  naechsterWerktag: naechsterWerktag, werktageZwischen: werktageZwischen, umgebung: umgebung,
};
