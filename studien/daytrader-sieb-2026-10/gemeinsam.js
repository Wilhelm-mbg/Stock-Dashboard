'use strict';
/* GEMEINSAM - alle Zahlen der REGEL.md genau einmal (Nr. 107, Daytrader-Sieb).
 * Wer hier eine Zahl aendert, aendert die Studie; test.js haelt sie gegen REGEL.md.
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. */

var N_WERTE = 50;
var N_TAGE = 20;
var SUCHE = { von: '2023-01-01', bis: '2024-12-31' };
var BESTAETIGUNG = { von: '2025-01-01', bis: '2026-08-31' };
var SEED_SUCHE = 20261005;
var SEED_BESTAETIGUNG = 20261006;
var STICHTAG = '2022-12-30';
var UMSATZ_MIN = 250e6;
var KLASSE_FENSTER = 20;          // Klasse des Wert-Tages: Median ueber d-20..d-1 (Minutenstudie §3)
var KLASSE_MIN_TAGE = 15;         // davon mindestens so viele mit Kerzen
var PLACEBO_ZUEGE = 50;           // Placebo als Erwartung: Mittel ueber 50 Zufallsminuten je Handel
var SIEB = { tMin: 2, minTage: 5 };

/* Sektor (REGEL §1): Faltung SEC-SIC -> Sektor aus stammdaten.js (die App-Tabelle), einzige Abweichung:
 * SIC 6798 (Real Estate Investment Trusts) -> Immobilien, weil GICS REITs unter Real Estate fuehrt. */
var GICS = {
  Technologie: 'Information Technology', Gesundheit: 'Health Care', Finanzen: 'Financials', Immobilien: 'Real Estate',
  Energie: 'Energy', Rohstoffe: 'Materials', Industrie: 'Industrials', Versorger: 'Utilities',
  Telekommunikation: 'Communication Services', 'Zyklischer Konsum': 'Consumer Discretionary', Basiskonsum: 'Consumer Staples',
};
function sektor(w) {
  if (!w) return null;
  if (+w.sic === 6798) return 'Immobilien';
  return GICS[w.sektor] ? w.sektor : null;
}

/* mulberry32 - geseedeter Zufall */
function zufall(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** n Elemente ohne Zuruecklegen (Fisher-Yates mit Seed). */
function ziehe(liste, n, seed) {
  var a = liste.slice(), z = zufall(seed);
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(z() * (i + 1)); var h = a[i]; a[i] = a[j]; a[j] = h; }
  return a.slice(0, n);
}
/** Median wie liquide.js: sortiert[n >> 1]. */
function median(xs) { var s = xs.slice().sort(function (a, b) { return a - b; }); return s.length ? s[s.length >> 1] : NaN; }
function sollMinuten(e) {
  e = e || {};
  var c = (e.close || '16:00').split(':').map(Number), o = (e.open || '09:30').split(':').map(Number);
  return (c[0] * 60 + c[1]) - (o[0] * 60 + o[1]);
}
/** Kleiner Hash fuer Placebo-Seeds je (Wert, Tag, Setup). */
function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

module.exports = {
  N_WERTE: N_WERTE, N_TAGE: N_TAGE, SUCHE: SUCHE, BESTAETIGUNG: BESTAETIGUNG, SEED_SUCHE: SEED_SUCHE, SEED_BESTAETIGUNG: SEED_BESTAETIGUNG,
  STICHTAG: STICHTAG, UMSATZ_MIN: UMSATZ_MIN, KLASSE_FENSTER: KLASSE_FENSTER, KLASSE_MIN_TAGE: KLASSE_MIN_TAGE,
  PLACEBO_ZUEGE: PLACEBO_ZUEGE, SIEB: SIEB, GICS: GICS,
  sektor: sektor, zufall: zufall, ziehe: ziehe, median: median, sollMinuten: sollMinuten, hash: hash,
};
