'use strict';
/* ================= Die 31 gegen die CFD-Huerde geschlossenen Varianten =================
 *
 * Woertlich aus studien/wiedervorlage-2026-09-02/BERICHT.md Paragraph 1.2 abgeschrieben,
 * damit auswerten.js sie gegen die GEMESSENE Kassa-Huerde halten kann. Keine Zahl wird hier
 * gerechnet - jede steht so im Bericht, und der Bericht rechnet sie aus den Protokollen in
 * studien/messmaschine/protokolle/.
 *
 * `obereGrenze` = tagesmittel + 1,96 x se, in Pp je Umlauf. "Wieder offen" heisst spaeter:
 * obereGrenze > Kassa-Huerde der Klasse. Das ist eine GROESSENAUSSAGE, kein Ertragsbeleg.
 *
 * KLASSE DES UNIVERSUMS. Die Protokolle fuehren die Liquiditaet des Universums NICHT
 * (geprueft an glockendruck-nacht-n-2026-09-01.json: `universum` traegt Werte, Handelstage
 * und Herkunft, keine Umsatzverteilung). Deshalb steht hier nur, was der Bericht ausdruecklich
 * belegt, und sonst null - und null heisst in der Auswertung: gegen ALLE VIER Huerden
 * ausweisen und das Universum als unbekannt markieren. Es wird nicht geraten, und es wird
 * NICHT die guenstigste Klasse gewaehlt (Registrierung Paragraph 8, Zuordnungsregel).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

/* Belegte Klassenzuordnungen, mit Fundstelle:
 *   glockendruck breit  -> Universum-Median 69 Mio $ (BERICHT Paragraph 2.1, Zeile
 *                          "Universum-Median 69 Mio $") -> Klasse 50-250
 *   *l-Varianten        -> ausdruecklich "liquide >= 1 Mrd $" -> Klasse ab1000            */
var K_BREIT_GLOCK = '50-250';
var K_LIQUIDE = 'ab1000';

var GESCHLOSSEN_CFD = [
  { strategie: 'winkelbestaetigt', v: '4 (S20)', rahmen: '60m/8', tage: 360, punkt: -0.128, jeSignal: -0.124, obereGrenze: -0.010, klasse: null },
  { strategie: 'nachtstoss-umkehr-n-regime', v: '0 (bis 2020)', rahmen: '1d/1', tage: 3620, punkt: -0.034, jeSignal: -0.029, obereGrenze: -0.006, klasse: null },
  { strategie: 'nachtstoss-umkehr-n', v: '0', rahmen: '1d/1', tage: 5039, punkt: -0.023, jeSignal: -0.015, obereGrenze: 0.000, klasse: null },
  { strategie: 'winkelbestaetigt', v: '3 (S15)', rahmen: '60m/8', tage: 361, punkt: -0.088, jeSignal: -0.088, obereGrenze: 0.020, klasse: null },
  { strategie: 't3-stundendrift', v: '0 (k=1)', rahmen: '60m/1', tage: 365, punkt: 0.001, jeSignal: -0.001, obereGrenze: 0.021, klasse: null },
  { strategie: 'winkelbestaetigt', v: '2 (S10)', rahmen: '60m/8', tage: 362, punkt: -0.087, jeSignal: -0.079, obereGrenze: 0.023, klasse: null },
  { strategie: 'abgabedruck-nacht-t', v: '0', rahmen: '1d/1', tage: 5039, punkt: -0.005, jeSignal: -0.001, obereGrenze: 0.027, klasse: null },
  { strategie: 'abgabedruck-nacht-n', v: '0', rahmen: '1d/1', tage: 5039, punkt: 0.004, jeSignal: 0.001, obereGrenze: 0.027, klasse: null },
  { strategie: 'glockendruck-nacht-t', v: '0', rahmen: '1d/1', tage: 5039, punkt: -0.003, jeSignal: -0.006, obereGrenze: 0.032, klasse: K_BREIT_GLOCK },
  { strategie: 't3-stundendrift', v: '1 (k=2)', rahmen: '60m/1', tage: 365, punkt: 0.008, jeSignal: 0.005, obereGrenze: 0.033, klasse: null },
  { strategie: 'abgabedruck-nacht-n-regime', v: '0 (bis 2020)', rahmen: '1d/1', tage: 3620, punkt: 0.006, jeSignal: 0.002, obereGrenze: 0.034, klasse: null },
  { strategie: 'abgabedruck-nacht-n-regime', v: '1 (ab 2021)', rahmen: '1d/1', tage: 1419, punkt: -0.000, jeSignal: -0.001, obereGrenze: 0.039, klasse: null },
  { strategie: 'winkelgrad', v: '4 (S20)', rahmen: '60m/8', tage: 364, punkt: -0.071, jeSignal: -0.044, obereGrenze: 0.044, klasse: null },
  { strategie: 'nachtstoss-umkehr-n-regime', v: '1 (ab 2021)', rahmen: '1d/1', tage: 1419, punkt: 0.004, jeSignal: 0.005, obereGrenze: 0.045, klasse: null },
  { strategie: 'winkelgrad', v: '3 (S15)', rahmen: '60m/8', tage: 364, punkt: -0.063, jeSignal: -0.037, obereGrenze: 0.049, klasse: null },
  { strategie: 'winkelgrad', v: '2 (S10)', rahmen: '60m/8', tage: 364, punkt: -0.056, jeSignal: -0.026, obereGrenze: 0.058, klasse: null },
  { strategie: 'winkelbestaetigt', v: '1 (S05)', rahmen: '60m/8', tage: 364, punkt: -0.126, jeSignal: -0.075, obereGrenze: 0.058, klasse: null },
  /* Die Tabelle des Berichts zeigt gerundet 0,060, nennt in der Spalte "auch unter 0,06?"
   * aber ausdruecklich 0,0599 - und genau daran haengt, ob diese Variante zu den 18 gegen
   * die Kassa-Annahme geschlossenen gehoert. Hier steht der ungerundete Wert. */
  { strategie: 'nachtstoss-umkehr-t', v: '0', rahmen: '1d/1', tage: 5039, punkt: 0.028, jeSignal: 0.021, obereGrenze: 0.0599, klasse: null },
  { strategie: 'winkelbestaetigt', v: '0 (S0)', rahmen: '60m/8', tage: 364, punkt: -0.063, jeSignal: -0.070, obereGrenze: 0.063, klasse: null },
  { strategie: 'winkelgrad', v: '1 (S05)', rahmen: '60m/8', tage: 364, punkt: -0.046, jeSignal: -0.021, obereGrenze: 0.067, klasse: null },
  { strategie: 'glockendruck-nacht-n', v: '0', rahmen: '1d/1', tage: 5039, punkt: 0.044, jeSignal: 0.042, obereGrenze: 0.068, klasse: K_BREIT_GLOCK, bemerkung: 'real (untere Grenze 0,021 > 0, t 3,71) und nach oben gedeckelt' },
  { strategie: 'winkelgrad', v: '0 (S0)', rahmen: '60m/8', tage: 364, punkt: -0.038, jeSignal: -0.014, obereGrenze: 0.077, klasse: null },
  { strategie: 'rsi2seit-mcp', v: '0 (MCP 90 %)', rahmen: '60m/8', tage: 364, punkt: 0.039, jeSignal: 0.041, obereGrenze: 0.083, klasse: null },
  { strategie: 'rsi2seit-mcp', v: '1 (MCP 75 %)', rahmen: '60m/8', tage: 364, punkt: 0.039, jeSignal: 0.041, obereGrenze: 0.084, klasse: null },
  { strategie: 'glockendruck-nacht-h1l', v: '0 (liquide)', rahmen: '1d/1', tage: 1975, punkt: 0.023, jeSignal: 0.037, obereGrenze: 0.091, klasse: K_LIQUIDE },
  { strategie: 'rsi2seit-mcp', v: '2 (MCP 50 %)', rahmen: '60m/8', tage: 364, punkt: 0.048, jeSignal: 0.046, obereGrenze: 0.097, klasse: null },
  { strategie: 'rsi2seit-mcp', v: '3 (MCP 25 %)', rahmen: '60m/8', tage: 364, punkt: 0.055, jeSignal: 0.053, obereGrenze: 0.110, klasse: null },
  { strategie: 't1-zwangsglattstellung', v: '0 (k=1,5)', rahmen: '60m/1', tage: 361, punkt: -0.005, jeSignal: -0.172, obereGrenze: 0.110, klasse: null },
  { strategie: 'glockendruck-nacht-h2', v: '0', rahmen: '1d/2', tage: 5038, punkt: 0.060, jeSignal: 0.054, obereGrenze: 0.114, klasse: K_BREIT_GLOCK },
  { strategie: 'rsi2seit-mcp', v: '4 (MCP 10 %)', rahmen: '60m/8', tage: 364, punkt: 0.059, jeSignal: 0.053, obereGrenze: 0.118, klasse: null },
  { strategie: 't1-zwangsglattstellung', v: '1 (k=2)', rahmen: '60m/1', tage: 361, punkt: -0.010, jeSignal: -0.345, obereGrenze: 0.122, klasse: null }
];

/* Die Huerden, gegen die bisher gerechnet wurde (wiki/kosten.md). */
var HUERDEN = { kassaAnnahme: 0.06, cfdRunde: 0.10, cfdEineNacht: 0.1247, schein: 0.23 };

module.exports = { GESCHLOSSEN_CFD: GESCHLOSSEN_CFD, HUERDEN: HUERDEN };
