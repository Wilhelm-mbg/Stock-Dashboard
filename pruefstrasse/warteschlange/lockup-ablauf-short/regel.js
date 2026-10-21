'use strict';
/* Ablauf der Lock-up-Frist nach dem Boersengang, short - Form `tag` (FORM.md §3). REGEL.md nennt jeden Parameter mit Fundstelle.
 * Quelle: "US IPO lockup expirations, 2007-2025, built from the point-in-time IPO calendar" (What Works in Trading, vorregistriert):
 * Ablauf = Preisfeststellung + 180 Kalendertage, naechster Handelstag = Tag 0; short zum Schluss von Tag -10, Deckung zum Schluss von
 * Tag +1; marktbereinigte CAR -1,97 % (t -4,47, 1.123 Ablaeufe). Klassiker: Field & Hanka (2001).
 * Der Boersengangstag steht nicht in der Sicht. Ersatz: das Datum der ERSTEN Zeile der Reihe, datum(0) - es liegt hinter der Schranke
 * (0 <= i), ist also kein Blick nach vorn. Reihen, die am Panelanfang schon notieren, sind keine Neuemissionen (params.ersteZeileAb).
 * Preisfeststellung = Vortag der ersten Notierung (US-Brauch), Ablauf E = datum(0) - 1 + 180 Kalendertage. Signal am ersten Handelstag
 * der Reihe mit datum >= E - 14 Kalendertage (= zehn Werktage vor E) und datum < E; Einstieg Eroeffnung des Folgetags (~ Tag -9),
 * Haltedauer 11 Handelstage (Ausstieg ~ Eroeffnung Tag +2 ~ Schluss Tag +1). Die Regel rechnet aus Datumsangaben bis i; einen Kalender
 * nach vorn liest sie nicht. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var TAG_MS = 86400000;
function utc(d) { return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)); }
function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
function istDatum(d) { return typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d); }

/** Ablauftag E (JJJJ-MM-TT) zur ersten Notierung d0: Preisfeststellung d0 - 1, plus params.sperrTage Kalendertage. */
function ablauf(d0, params) { return iso(utc(d0) + (params.sperrTage - params.preisVorNotierung) * TAG_MS); }
/** Erster Tag des Signalfensters: E minus params.vorlaufKalendertage. */
function fensterAb(E, params) { return iso(utc(E) - params.vorlaufKalendertage * TAG_MS); }

module.exports = {
  brauchtHochTief: false,
  brauchtRoh: false,
  brauchtMarkt: false,
  brauchtDatum: true,                           /* sicht.datum(j) (FORM.md §3, Nr. 117) */
  /** Signal am Tag i: -1 (short), wenn i der erste Handelstag der Reihe im Fenster [E - 14 Kalendertage, E) ist. */
  signal: function (sicht, i, params) {
    if (!params || !(params.sperrTage > 0) || !(params.vorlaufKalendertage > 0) || !istDatum(params.ersteZeileAb)) return null;
    if (!(i >= 1)) return null;
    var d0 = sicht.datum(0), di = sicht.datum(i), dv = sicht.datum(i - 1);
    if (!istDatum(d0) || !istDatum(di) || !istDatum(dv)) return null;
    if (d0 < params.ersteZeileAb) return null;      /* notiert schon am Panelanfang: keine Neuemission */
    var E = ablauf(d0, params), ab = fensterAb(E, params);
    if (!(di >= ab && di < E && dv < ab)) return null;
    return { dir: -1, ersteZeile: d0, ablauf: E, datum: di };
  },
  ablauf: ablauf, fensterAb: fensterAb,
};
