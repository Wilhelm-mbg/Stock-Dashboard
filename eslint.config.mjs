/* Linter fuer das Markt-Dashboard.
 *
 * Warum es ihn gibt: Am 23.08.2026 stand `stcRunning` in depot.js nur noch in der
 * Benutzung, die Deklaration war bei einem Umbau mitgeloescht worden. Unter
 * 'use strict' warf der Knopf "Chart laden" seitdem bei jedem Klick - und keine der
 * 990 Zusicherungen konnte das sehen, weil die Oberflaechen-Dateien nicht ladbar sind
 * und nur als Text geprueft werden. Ein Lauf mit `no-undef` findet genau diese Klasse.
 *
 * Bewusst schmal gehalten: nur Regeln, die auf echte Fehler zeigen, keine Stilfragen.
 * Der Bestand soll damit ohne Umschreiben gruen sein, sonst wird der Linter ignoriert.
 */

import globals from 'globals';

/* Die Oberflaeche verdrahtet sich ueber window-Globals statt ueber Module. Das ist
 * eine bewusste Entscheidung des Projekts; damit `no-undef` trotzdem etwas taugt,
 * stehen die vergebenen Namen hier. Wer ein neues Modul anlegt, traegt es hier ein -
 * genau das ist der Zweck: die Liste macht die unsichtbare Verdrahtung sichtbar. */
const fensterGlobals = {
  U: 'readonly', Quant: 'readonly', Q: 'readonly',
  Vormarkt: 'readonly', Archiv: 'readonly', CapAPI: 'readonly', AlpAPI: 'readonly', Explorer: 'readonly',
  Drift: 'readonly', MF: 'readonly', MH: 'readonly', Momentum: 'readonly', Liquide: 'readonly',
  Bugs: 'readonly', Diagnose: 'readonly', WKN: 'readonly', Scoreboard: 'readonly',
  Scheinfinder: 'readonly', MFHandel: 'readonly', MFDepot: 'readonly',
  Mittelfrist: 'readonly', DriftUI: 'readonly', Kalender: 'readonly',
  /* Reiter Markt (Stufe 5, 04.09.2026): die Rechnung (MarktUebersicht) und die
     Leseauskunft der Marktkarte (Marktwerte), ueber die der Ueberblick dieselbe
     Grundmenge und dieselben Kurse benutzt wie die Karte. */
  MarktUebersicht: 'readonly', Marktwerte: 'readonly',
  /* Die Dialog-Ordnung (QS-Fund B1, 04.09.2026): die Rechnung steht in
     dialogstapel.js, damit test-v6 sie ohne Fenster durchspielen kann; app-shell.js
     holt sie sich hierueber. */
  Dialogstapel: 'readonly',
  openModal: 'readonly', getSettings: 'readonly', saveSettings: 'readonly'
};

const echteFehler = {
  'no-undef': 'error',
  'no-dupe-keys': 'error',
  'no-dupe-args': 'error',
  'no-duplicate-case': 'error',
  'no-unreachable': 'error',
  'no-func-assign': 'error',
  'no-redeclare': 'error',
  'no-self-assign': 'error',
  'no-self-compare': 'error',
  'no-sparse-arrays': 'error',
  'no-unsafe-negation': 'error',
  'no-async-promise-executor': 'error',
  'no-loss-of-precision': 'error',
  /* skipRegExps: fuenf Dateien tragen die BOM-Kennung bzw. ein geschuetztes Leerzeichen
   * in einem Muster, in dem das Zeichen woertlich stehen MUSS - depot.js, scoreboard.js,
   * tools/massive.js, tools/stammdaten-holen.js, tools/wertpapierarten-holen.js.
   * Ausserhalb von Mustern bleibt es ein Fehler. */
  'no-irregular-whitespace': ['error', { skipRegExps: true }],
  'use-isnan': 'error',
  'valid-typeof': 'error',
  'no-constant-condition': 'error'
};

export default [
  /* wiki/.obsidian/** ist Obsidians eigener Ordner - Plugins wie dataview liefern dort
   * gebuendeltes Fremd-JavaScript mit TypeScript-Regelverweisen, die diese Konfiguration
   * gar nicht kennt. Ohne diesen Ausschluss faellt `npm test` an einem Plugin, das jemand
   * gerade im Wiki installiert hat, und nicht an unserem Code (03.09.2026). */
  { ignores: ['node_modules/**', 'dist/**', 'wiki/.obsidian/**'] },

  /* Oberflaeche: laeuft im Renderer, kein Node.
     markt/*.js steht mit in der Liste, weil `files: ['*.js']` NUR die Wurzel trifft.
     Ohne diese Zeile liefe markt/uebersicht.js an jeder Regel vorbei und waere mit
     null Regeln geprueft - genau der blinde Fleck, den die Linter-Konfiguration bei
     sich selbst schon einmal hatte (Issue #76, Punkt 4). Die Datei ist ein
     UMD-Modul: sie laeuft im Renderer UND wird von main.js per require geholt,
     deshalb stehen module und require hier ebenfalls zur Verfuegung. */
  {
    files: ['*.js', 'markt/*.js'],
    ignores: ['main.js', 'preload.js', 'kerzenquelle.js', 'sammelplan.js', 'test-*.js', 'bt-worker.js'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'script',
      globals: { ...globals.browser, ...fensterGlobals, module: 'writable', require: 'readonly' }
    },
    rules: echteFehler
  },

  // Hauptprozess, Bruecke und das geteilte Kerzenmodul: Node.
  // kerzenquelle.js liegt in der Wurzel, weil tools/ nicht ausgeliefert wird - sie ist
  // aber ein Node-Modul und kein Oberflaechenskript.
  {
    files: ['main.js', 'preload.js', 'kerzenquelle.js', 'sammelplan.js'],
    languageOptions: { ecmaVersion: 2022, sourceType: 'script', globals: { ...globals.node } },
    rules: echteFehler
  },

  // Web-Worker fuer den Backtest
  {
    files: ['bt-worker.js'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'script',
      globals: { ...globals.worker, ...fensterGlobals }
    },
    rules: echteFehler
  },

  /* Tests, Werkzeuge und Studien: Node, teils mit UMD-Weiche auf window.
   * Hier gilt derselbe Kern, aber zwei Regeln sind bewusst gelockert:
   *   no-redeclare   - Studienskripte benutzen `var i` in benachbarten Schleifen erneut.
   *                    Im ausgelieferten Programm bleibt die Regel scharf: dort hat sie
   *                    ein doppeltes `steigt` in explorer.js gefunden.
   *   no-self-compare - test-v6.js vergleicht zwei AUFRUFE mit gleichen Argumenten,
   *                    um Determinismus zuzusichern. Das ist der Sinn, kein Versehen. */
  {
    files: ['test-*.js', 'tools/**/*.js', 'studien/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'script',
      globals: { ...globals.node, ...globals.browser, ...fensterGlobals }
    },
    rules: { ...echteFehler, 'no-redeclare': 'off', 'no-self-compare': 'off' }
  },

  /* Die Konfiguration des Linters lief als EINZIGE Quelldatei des Repos an ihm vorbei:
   * kein files-Muster traf auf .mjs zu, sie wurde also mit null Regeln geprueft
   * (Issue #76, Punkt 4). Ein Linter, der sich selbst nicht prueft, ist genau die
   * Sorte blinder Fleck, gegen die er gebaut wurde.
   * sourceType MUSS 'module' sein - mit 'script' waere schon `export default` ein
   * Parserfehler und der Lauf braeche ab, statt zu pruefen. */
  {
    files: ['*.mjs'],
    languageOptions: {
      ecmaVersion: 2022, sourceType: 'module',
      globals: { ...globals.node }
    },
    rules: { ...echteFehler }
  }
];
