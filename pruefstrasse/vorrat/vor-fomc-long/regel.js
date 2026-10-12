'use strict';
/* Vor-FOMC-Drift (Lucca & Moench 2015; Kurov, Wolfe & Gilbert 2021), long - Form `tag` (FORM.md §3). REGEL.md nennt jeden Parameter mit
 * Fundstelle. Die Regel liest NUR ueber die Sicht: sicht.datum(i) (brauchtDatum, Nr. 117) und vergleicht es mit der Liste der planmaessigen
 * FOMC-Bekanntgabetage (params.fomcTage, federalreserve.gov) - die Liste steht in der Wirklichkeit ein Jahr im Voraus fest und ist darum
 * kein Blick nach vorn. Fenster der Quelle: 14:00 des Vortags bis 14:00 des Bekanntgabetags. Die Pruefstrasse steigt zur Eroeffnung des Tages
 * NACH dem Signal ein; damit der Einstieg am Vortag der Bekanntgabe (A-1) liegt, steht das Signal am Tag davor (A-2). Ob der Folgetag A-1 ist,
 * weiss die Sicht am Tag i nicht aus dem Kalender der Tafel (Blick-nach-vorn-Regel) - die Regel rechnet aus dem DATUM: der uebernaechste
 * Werktag (Mo-Fr) nach datum(i) ist ein Listentag. Sitzungen am Donnerstag (Wahlwochen 2018, 2020, 2024) und am Dienstag/Montag folgen
 * derselben Rechnung. Ein Boersenfeiertag am Tag A-1 verschoebe den Einstieg auf A (in REGEL.md gezaehlt: 2016-2022 keiner).
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var TAG_MS = 86400000;
function utc(d) { return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)); }
function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
/** Naechster Werktag (Mo-Fr) nach dem Datum d - aus dem Datum gerechnet, nicht aus dem Kalender der Tafel. */
function naechsterWerktag(d) {
  var ms = utc(d) + TAG_MS;
  for (;;) { var w = new Date(ms).getUTCDay(); if (w !== 0 && w !== 6) return iso(ms); ms += TAG_MS; }
}
var cacheListe = null, cacheMenge = null;
function menge(params) {
  var liste = params && params.fomcTage;
  if (!Array.isArray(liste) || !liste.length) return null;
  if (liste !== cacheListe) { cacheListe = liste; cacheMenge = {}; liste.forEach(function (d) { cacheMenge[d] = true; }); }
  return cacheMenge;
}
/** Der Bekanntgabetag, fuer den d (JJJJ-MM-TT) der Tag A-2 ist: der uebernaechste Werktag, wenn er in der Liste steht; sonst null. */
function bekanntgabeNach(d, params) {
  var M = menge(params);
  if (!M || typeof d !== 'string' || d.length !== 10) return null;
  var w2 = naechsterWerktag(naechsterWerktag(d));
  return M[w2] ? w2 : null;
}

module.exports = {
  brauchtHochTief: false,
  brauchtRoh: false,
  brauchtMarkt: false,
  brauchtDatum: true,                           /* sicht.datum(i) (FORM.md §3, Nr. 117) */
  /** Signal am Tag i: +1, wenn der uebernaechste Werktag nach datum(i) ein planmaessiger FOMC-Bekanntgabetag ist (Einstieg = Eroeffnung A-1). */
  signal: function (sicht, i, params) {
    var d = sicht.datum(i);
    if (typeof d !== 'string') return null;
    var A = bekanntgabeNach(d, params);
    return A ? { dir: 1, datum: d, bekanntgabe: A } : null;
  },
  naechsterWerktag: naechsterWerktag, bekanntgabeNach: bekanntgabeNach,
};
