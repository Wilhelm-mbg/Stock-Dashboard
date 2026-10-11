'use strict';
/* Nachzuegler-Studie (Nr. 109) - feste Zahlen der Regel (REGEL.md, Abschnitt 1 wortlich, Abschnitt 2 Ergaenzungen Z1-Z22a).
 * Jede Zahl steht hier GENAU EINMAL; test.js haelt sie gegen REGEL.md. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var path = require('path');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');
var PRUEFSTAND = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');

var AUSLOESER = [{ key: 'E1', fenster: 20 }, { key: 'E2', fenster: 55 }, { key: 'E3', fenster: null }];
var RICHTUNGEN = [{ key: 'auf', dir: 1 }, { key: 'ab', dir: -1 }];
var VERKNUEPFUNGEN = [{ key: 'V1' }, { key: 'V2' }];
var HYPOTHESEN = [{ key: 'H1' }, { key: 'H2' }];
var HALTEDAUERN = [0, 1, 5, 20];
var KLASSEN_B = [0, 1, 2, 3];
var KLASSEN_NAMEN = ['5-50', '50-250', '250-1000', 'ab1000'];

/* Konfigurationsindex: Ausloeser x Richtung x Verknuepfung x Hypothese x Haltedauer x Klasse von B = 3 x 2 x 2 x 2 x 4 x 4 */
var N_A = 3, N_R = 2, N_V = 2, N_HY = 2, N_H = 4, N_C = 4;
var KONFIGURATIONEN = N_A * N_R * N_V * N_HY * N_H * N_C;
function konfIndex(a, r, v, hy, hi, c) { return ((((a * N_R + r) * N_V + v) * N_HY + hy) * N_H + hi) * N_C + c; }
function konfAus(i) {
  var c = i % N_C; i = (i - c) / N_C; var hi = i % N_H; i = (i - hi) / N_H; var hy = i % N_HY; i = (i - hy) / N_HY;
  var v = i % N_V; i = (i - v) / N_V; var r = i % N_R; var a = (i - r) / N_R;
  return { a: a, r: r, v: v, hy: hy, hi: hi, c: c,
    name: AUSLOESER[a].key + '/' + RICHTUNGEN[r].key + '/' + VERKNUEPFUNGEN[v].key + '/' + HYPOTHESEN[hy].key + '/h' + HALTEDAUERN[hi] + '/' + KLASSEN_NAMEN[c] };
}

module.exports = {
  KENNUNG: 'nachzuegler-2026-10/v1',
  REPO: REPO, HIER: HIER, PRUEFSTAND: PRUEFSTAND,
  ORDNER_REL: 'studien/nachzuegler-2026-10',
  SIEGEL_DATEI: 'KANDIDATEN.json',

  /* Daten (Regel "Daten", Z1, Z2) */
  EDGAR_CIK: 'E:/Markt-Dashboard-Archiv/edgar-submissions/cik',
  REIHEN_TAFEL: path.join(REPO, 'studien', 'fundamental-machbarkeit-2026-09-16', 'fundamentaltafel', '_reihen.json'),
  GRUENDE_V21: path.join(REPO, 'studien', 'datenfundament-2026-10-04', 'tafel-v2', 'verschwundene-gruende-v21.json'),
  ZEITPRUEFUNG: path.join(REPO, 'studien', 'ergebnis-drift-ereignis-2026-10-04', 'zeitpruefung.json'),

  /* Zeitraeume (Regel "Zeitraeume", Z6, Z16, Z22) */
  SPERRE_AB: '2023-01-01', ENTDECKUNG_BIS: '2022-12-30', PRUEFUNG_AB: '2023-01-03', T_E_VON: '2017-01-03',

  /* Ausloeser (Regel, Z7, Z8) */
  AUSLOESER: AUSLOESER, RICHTUNGEN: RICHTUNGEN, SPERRFRIST: 20,
  E3_SD_TAGE: 60, E3_SD_MIN: 50, E3_FAKTOR: 2, ITEM: '2.02', FORM: '8-K',

  /* Verknuepfung (Regel, Z9) */
  VERKNUEPFUNGEN: VERKNUEPFUNGEN, V2_TOP: 5, V2_FENSTER: 250, V2_MIN: 200,

  /* Hypothesen, Haltedauern, Klassen (Regel, Z12) */
  HYPOTHESEN: HYPOTHESEN, H2_KLASSEN_A: [2, 3], HALTEDAUERN: HALTEDAUERN, KLASSEN_B: KLASSEN_B, KLASSEN_NAMEN: KLASSEN_NAMEN,

  /* Kosten in Pp je Umlauf, Index = Klasse (Nachtrag 1 (1)); Kassa-Huerde nur Vergleichszeile; Leihe (Regel, Z13) */
  HUERDE: [0.221, 0.102, 0.074, 0.055],
  HUERDE_KASSA: [0.157, 0.085, 0.065, 0.045],
  LEIHE_SATZ: 0.01, LEIHE_EMPFINDLICH: [0, 0.03], LEIHE_TAGE_JAHR: 252,

  /* Placebos (Regel, Z17) */
  VERSATZ_C: 20, PLACEBO_T: 2, PLACEBO_ANTEIL_HUERDE: 0.25, PLACEBO_ZUEGE: 50,

  /* Kandidat, Tor 1, Pruefung (Regel, Nachtrag 1 (5), Z14, Z16, Z18, Z19) */
  KANDIDAT_T: 2, TOR1_FAKTOR: 4, MDE_FAKTOR: 2, MIN_TAGE: 30,
  HOLM_ALPHA: 0.05, HOLM_Z1: 3.65,
  N_A: N_A, N_R: N_R, N_V: N_V, N_HY: N_HY, N_H: N_H, N_C: N_C,
  KONFIGURATIONEN: KONFIGURATIONEN, konfIndex: konfIndex, konfAus: konfAus,
  ZUFALL_ERWARTET_T2: 8.7,

  /* Pilot (Z21) */
  PILOT_JE_KLASSE: 50,

  /* Abgangsgruppen (Z15) */
  ABGANG_GRUPPEN: { uebernahme: 'uebernahme', 'fusion-aktientausch': 'uebernahme', 'spac-ende': 'uebernahme',
    insolvenz: 'insolvenz', 'zwangs-delisting': 'insolvenz' },
};
