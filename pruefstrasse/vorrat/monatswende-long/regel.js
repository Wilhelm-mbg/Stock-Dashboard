'use strict';
/* Monatswende (Turn of the Month, McConnell & Xu 2008; Etula et al. 2020), long - Form `tag` (FORM.md §3). REGEL.md nennt jeden Parameter
 * mit Fundstelle. Die Regel liest NUR ueber die Sicht: sicht.datum(i) (brauchtDatum, Nr. 117), weder Kurse noch Hoch/Tief noch den Kalender
 * der Tafel hinter i. Fenster der Quelle: letzter Handelstag des Monats (-1) bis dritter Handelstag des Folgemonats (+3). Die Pruefstrasse
 * steigt zur Eroeffnung des Tages NACH dem Signal ein; damit der Einstieg am letzten Handelstag (-1) liegt, muss das Signal am vorletzten (-2)
 * stehen. Ob der Folgetag der letzte Handelstag ist, weiss die Sicht am Tag i noch nicht (istLetzterHandelstagImMonat(i) = null, Blick-nach-
 * vorn-Regel) - die Regel rechnet es deshalb aus dem DATUM: der Tag i ist der vorletzte WERKTAG (Mo-Fr) seines Monats. Boersenfeiertage am
 * Monatsende (Karfreitag 30.03.2018, Memorial Day 31.05.2021) verschieben den Einstieg um einen Tag auf +1, ein Feiertag am vorletzten
 * Werktag (Thanksgiving 28.11.2019) laesst den Monat aus - beides in REGEL.md gezaehlt. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var TAG_MS = 86400000;
function utc(d) { return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)); }
function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
/** Naechster Werktag (Mo-Fr) nach dem Datum d - aus dem Datum gerechnet, nicht aus dem Kalender der Tafel. */
function naechsterWerktag(d) {
  var ms = utc(d) + TAG_MS;
  for (;;) { var w = new Date(ms).getUTCDay(); if (w !== 0 && w !== 6) return iso(ms); ms += TAG_MS; }
}
/** Ist d (JJJJ-MM-TT) der vorletzte Werktag seines Monats? Der naechste Werktag liegt noch im Monat, der uebernaechste nicht mehr. */
function istVorletzterWerktagImMonat(d) {
  if (typeof d !== 'string' || d.length !== 10) return false;
  var w1 = naechsterWerktag(d), w2 = naechsterWerktag(w1), m = d.slice(0, 7);
  return w1.slice(0, 7) === m && w2.slice(0, 7) !== m;
}

module.exports = {
  brauchtHochTief: false,
  brauchtRoh: false,
  brauchtMarkt: false,
  brauchtDatum: true,                           /* sicht.datum(i) (FORM.md §3, Nr. 117) - Panel und trendkanal-tage haben den Kalender */
  /** Signal am Tag i: +1, wenn datum(i) der vorletzte Werktag seines Monats ist (Einstieg zur Eroeffnung des letzten Handelstags, -1). */
  signal: function (sicht, i) {
    var d = sicht.datum(i);
    if (typeof d !== 'string') return null;
    return istVorletzterWerktagImMonat(d) ? { dir: 1, datum: d } : null;
  },
  naechsterWerktag: naechsterWerktag, istVorletzterWerktagImMonat: istVorletzterWerktagImMonat,
};
