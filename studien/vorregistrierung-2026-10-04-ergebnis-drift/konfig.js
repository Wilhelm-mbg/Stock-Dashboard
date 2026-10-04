'use strict';
/* Ergebnis-Drift tagesgenau - VORREGISTRIERTE MESSUNG (Auftrag Nr. 88, 04.10.2026). Feste Zahlen der Regel.
 *
 * Alles hier steht in VORREGISTRIERUNG.md und ist vom PM festgelegt (Auftrag §1 und §5). Nichts davon wird nach dem Siegel
 * geaendert: kein anderes Fenster, keine andere Haltedauer, keine andere Platzzahl, kein anderer Schaetzer.
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var path = require('path');

var REPO = path.resolve(__dirname, '..', '..');
var MACHBARKEIT = path.join(REPO, 'studien', 'ergebnis-drift-ereignis-2026-10-04');
var RUECKBLICK = path.join(REPO, 'studien', 'massstab-rueckblick-2026-10-04');

module.exports = {
  KENNUNG: 'vorregistrierung-2026-10-04-ergebnis-drift/v1',
  REPO: REPO, MACHBARKEIT: MACHBARKEIT, RUECKBLICK: RUECKBLICK,
  ORDNER_REL: 'studien/vorregistrierung-2026-10-04-ergebnis-drift',

  /* Eingefrorene Daten (Kennungen; die Pruefsummen stehen in blind.json und in VORREGISTRIERUNG.md) */
  PANEL_KENNUNG: 'querschnitt-pruefstand-2026-09-13/panel/v2.2',
  TAFEL_KENNUNG: 'fundamentaltafel-2026-09-16/v1.1',
  EREIGNISSE_ERWARTET: 25298,                 /* Machbarkeit M5, Hauptklassen 2017 bis 15.09.2026 */
  EREIGNISSE_TOLERANZ: 0.01,                  /* Abbruchregel 3: mehr als 1 % Abweichung */

  /* Fenster (Auftrag §1.2) */
  FENSTER_VON: '2021-09-16', FENSTER_BIS: '2026-09-15',
  VERSCHLOSSEN_VON: '2017-01-03', VERSCHLOSSEN_BIS: '2021-09-15',

  /* Signal (Entwurf §3): Zehntel punkt-in-zeit */
  VERGLEICH_TAGE: 63, VERGLEICH_MINDESTENS: 200, ANTEIL: 0.1,
  KLASSEN_HAUPT: [1, 2, 3],                   /* 50-250, 250-1000, ab1000 */

  /* Haltedauer (Auftrag §1.1): Hauptgroesse 60, zweite Groesse 20 */
  H_HAUPT: 60, H_ZWEIT: 20, HORIZONTE: [20, 60],

  /* Kosten je Umlauf in Pp, Index = Klasse (Auftrag §1.1); Klasse 0 (5-50) ist nicht Teil der Messung */
  KOSTEN_UMLAUF_PP: [NaN, 0.210, 0.134, 0.081],
  SPY_KOSTEN_BP: 0.5,                         /* Annahme des PM (Auftrag §1.4): je SPY-Handel, der einen Kauf bezahlt oder einen Erloes anlegt */

  /* Stufe 1 */
  TOR_T: 2.5,                                 /* t >= 2,5 bei H = 60 fuer A UND fuer B netto */
  MDE_FAKTOR: 2.8,                            /* 80 % Macht bei zweiseitig 5 % */
  SCHRANKE_Z: 1.96,                           /* obere 95-%-Schranke = Wert + 1,96 x Fehler (wiki/belegstand.md) */
  SCHRANKE_NICHT_BELEGT_PP: 1.0,              /* Entwurf §10 */
  PLACEBO_SOLL: 2, PLACEBO_ABBRUCH: 3,        /* in eigenen Standardfehlern */
  POSITIV_MINDESTENS: 0.65, POSITIV_T: 2,
  ZUFALL_LAEUFE: 200, ZUFALL_START: 20261004, /* fester Startwert; Lauf r nimmt ZUFALL_START + r */

  /* Stufe 2: das Buch (Auftrag §1.4, §5) */
  START: 100000, PLAETZE: 40, HALTEN: 60,
  MASSSTAB: 'SPY', MASSSTAB_SOLL: 181193.87,  /* Endwert des Massstabs aus Nr. 74 (Selbstpruefung) */
  VORWAERTSTEST_HOECHSTENS: 10,               /* hoechstens 10 der 200 Zufallsbuecher ueber dem Buch */
};
