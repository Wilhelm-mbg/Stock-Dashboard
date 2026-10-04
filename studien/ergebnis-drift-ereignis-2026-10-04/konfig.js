'use strict';
/* Ergebnis-Drift tagesgenau - MACHBARKEIT (Auftrag Nr. 80, 04.10.2026). Pfade und feste Zahlen.
 *
 * Diese Studie MISST NICHTS. Sie holt Meldezeiten (8-K Punkt 2.02) von der SEC, zaehlt blind und bestimmt die Aufloesung.
 * Kein Ertrag wird nach Vorzeichen, Groesse oder Zehntel der Ueberraschung gebildet (Auftrag §2, §5.7).
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var path = require('path');

var REPO = path.resolve(__dirname, '..', '..');
var PRUEFSTAND = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
var FUNDAMENTAL = path.join(REPO, 'studien', 'fundamental-machbarkeit-2026-09-16');
var ALTER_LADER = path.join(REPO, 'studien', 'verschwundene-gruende-2026-09-12', 'edgar-lauf.js');
var SUE_FELD = path.join(REPO, 'studien', 'mehrfaktor-2026-09-22', 'felder', 'sue', 'feld.js');

/* Der EINE neue Ordner auf E: (Auftrag §5.1). Sonst wird auf E: nur gelesen. */
var CACHE = 'E:/Markt-Dashboard-Archiv/edgar-submissions';

module.exports = {
  REPO: REPO, PRUEFSTAND: PRUEFSTAND, FUNDAMENTAL: FUNDAMENTAL, ALTER_LADER: ALTER_LADER, SUE_FELD: SUE_FELD,
  CACHE: CACHE,
  CACHE_CIK: CACHE + '/cik',                 /* je CIK der Auszug (alle 8-K-Zeilen ab 2016 mit Annahmezeit) */
  CACHE_PROBE: CACHE + '/roh-probe',         /* rohe Antworten NUR der 20 Probe-Firmen (Beleg fuer die Feldnamen) */
  CACHE_KOPF: CACHE + '/kopf',               /* Koepfe/Anfaenge einzelner Einreichungen (Zeitpruefung, Handprobe) */
  PANEL_AUS: path.join(PRUEFSTAND, 'voll-v22'),
  TAFEL: path.join(FUNDAMENTAL, 'fundamentaltafel'),

  VON: '2016-01-01', BIS: '2026-12-31',      /* Fenster der Meldungen (filingDate) */
  TAKT_MS: 250,                              /* §5.1: hoechstens 4 Anfragen je Sekunde, eine Spur */
  SPERRE_WARTEN_MS: 10 * 60 * 1000,          /* §5.1: bei 429/403 zehn Minuten warten, dann halber Takt */

  HANDELSBEGINN_SEK: 9 * 3600 + 30 * 60,     /* 09:30:00 New York */
  HORIZONTE: [1, 5, 20, 60],                 /* Handelstage, Eroeffnung -> Eroeffnung */
  KLASSEN_ALLE: [0, 1, 2, 3],                /* 5-50, 50-250, 250-1000, ab1000 (Namen: Pruefstand K.KLASSEN) */
  KLASSEN_HAUPT: [1, 2, 3],                  /* "Klasse 1, 2 oder 3" des Auftrags = erweitertes Universum Teil 3 */
  ZUFALL_LAEUFE: 200, ZUFALL_START: 20261004, /* §5.7 (b): 200 Zufalls-Zuteilungen, fester Startwert */
  MDE_FAKTOR: 2.8,                           /* 80 % Macht bei zweiseitig 5 %: 1,96 + 0,84 */

  /* M3: Zuordnung Meldung -> Tafelzeile. Die Meldung liegt im Fenster [period + 1 Tag, filed] der Zeile
   * (Annahmedatum New York); die Zeile mit dem naechstliegenden `filed` gewinnt. */
  ZUORDNUNG_MAX_TAGE_NACH_PERIODE: 200,      /* Meldung hoechstens so viele Kalendertage nach dem Stichtag der Zeile */
};
