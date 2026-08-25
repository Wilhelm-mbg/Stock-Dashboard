'use strict';
/* QUARTALSSCHUB NACH DEM BETRAG DER UEBERRASCHUNG - Neubau vom 25.08.2026.
 *
 * Vorregistriert in studien/vorregistrierung-2026-08-25/VORREGISTRIERUNG-B-NEUBAU.md.
 * Der Quelltext der urspruenglichen Fassung ist verloren; diese Datei ist aus der
 * ueberlieferten Beschreibung neu gebaut, und JEDE Wahl darin steht dort schriftlich,
 * bevor gemessen wurde.
 *
 * Diese Fassung braucht KEINE Symbol-Bruecke mehr. Die alte musste sich aus dem ersten
 * Zeitstempel und zehn fruehen Schlusskursen einen Fingerabdruck je Reihe bauen und das
 * Archiv ein zweites Mal einlesen - weil signal() das Symbol nicht bekam. Seit heute
 * bekommt es das (messmaschine.js, fuenftes Argument). Genau in jener Bruecke ist der
 * alte Quelltext abgebrochen. */
var fs = require('fs'), path = require('path'), os = require('os');

/* Universum: dieselbe Population wie Kandidat A - CS = Stammaktie, ADRC = Hinterlegungsschein. */
var ARTEN = (function () {
  var p = process.env.MD_ARTEN || path.join(os.homedir(), 'Downloads',
    'Markt-Dashboard-Daten', 'massive', 'wertpapierarten.json');
  try { return (JSON.parse(fs.readFileSync(p, 'utf8')) || {}).arten || {}; }
  catch (e) { return {}; }
})();

/* Ertragstermine aus dem Store der App. Zeilen: [Datum, Schaetzung, Ist, Ueberraschung %].
 * Die Spaltenbedeutung stammt aus dem SCHREIBENDEN Code (driftui.js), nicht aus einem
 * Blick auf die Werte - dort steht woertlich
 *   [r.aktuell.termin, r.aktuell.schaetzung, r.aktuell.ist, r.aktuell.ueberraschung]
 * Sie zu erraten waere hier besonders teuer gewesen: Schaetzung und Ist stehen
 * nebeneinander und sehen gleich aus. */
var TERMINE = (function () {
  var p = process.env.MD_TERMINE || path.join(process.env.APPDATA ||
    path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store', 'drift_termine.json');
  try { var j = JSON.parse(fs.readFileSync(p, 'utf8')); return (j && j.sym) || {}; }
  catch (e) { return {}; }
})();

var VERFALL_KERZEN = 63;      // drei Monate; der ueberlieferte leseFenster 80 = 63 + Rand

/* Je Symbol EINMAL: die Terminzeitpunkte mit brauchbarer Ueberraschung, aufsteigend.
 * Die Maschine ruft signal() fuer jede Kerze jeder Reihe - hier darf nichts je Aufruf
 * neu gerechnet werden. */
var GEDAECHTNIS = {};
function termineVon(sym) {
  if (GEDAECHTNIS[sym] !== undefined) return GEDAECHTNIS[sym];
  var roh = TERMINE[sym];
  if (!roh || !roh.length) return (GEDAECHTNIS[sym] = null);
  var liste = [];
  for (var k = 0; k < roh.length; k++) {
    var ms = Date.parse(roh[k][0]), ue = roh[k][3];
    if (!isFinite(ms) || ue == null || !isFinite(ue)) continue;
    liste.push([ms, ue]);
  }
  liste.sort(function (a, b) { return a[0] - b[0]; });
  return (GEDAECHTNIS[sym] = liste.length ? liste : null);
}

module.exports = {
  key: 'quartalsschub-betrag',
  grund: 'Ein Wert, der drei Monate lang gefallen ist, traegt vor seinem Quartalstermin eine '
       + 'aufgestaute Ergebnisunsicherheit. Wer sein Risikobudget daran gebunden hat - der '
       + 'Fondsmanager, der die Position vor dem Termin gedeckelt hat, das Risikobuch, das die '
       + 'Ereignisvolatilitaet limitiert, der Verwalter, der vor seinem Ausschuss keine ungeloeste '
       + 'Lage halten darf -, gibt dieses Budget erst wieder frei, wenn die Zahl da ist UND gross '
       + 'genug war, um die Unsicherheit aufzuloesen. Eine Meldung nahe der Schaetzung loest nichts '
       + 'auf und zahlt nachweislich nichts (+0,095 Pp, t 0,47 auf der Entdeckungshaelfte). Wirksam '
       + 'ist der BETRAG der Ueberraschung, nicht ihr Vorzeichen: nach demselben Kursverfall zahlt '
       + '-5 % mehr als +5 % (+1,619 gegen +0,870 Pp). Das Freigeben des Budgets ist ein '
       + 'Verwaltungsvorgang mit Vorlauf, kein Kursurteil, und es laeuft ueber Tage.',
  zeitrahmen: '1d',
  haltedauerKerzen: 5,
  richtung: 'long',
  leseFensterKerzen: 80,
  kosten: { spanneBp: 5 },
  testfamilie: { name: 'quartalsschub-neubau-2026-08-25', testsGesamt: 2,
                 begruendung: 'zwei Varianten; Schwelle bleibt bei 2,50 statt 2,24, weil die These '
                            + 'nicht frisch ist - im Zweifel die strengere Latte' },
  universum: function (sym) {
    var a = ARTEN[sym];
    return (a === 'CS' || a === 'ADRC') && !!TERMINE[sym];
  },
  varianten: [ { verfall: -0.02 }, { verfall: -0.05 } ],

  /* Signal auf der ERSTEN Kerze nach einem Termin.
   *
   * Kein Vorgriff: Kerze i feuert nur, wenn zwischen dem Schluss von i-1 und dem Schluss
   * von i ein Termin lag. Damit ist die Meldung beim Einstieg oeffentlich - Zahlen
   * erscheinen ueblicherweise nach Boersenschluss. Der Ankuendigungssprung ist dadurch
   * NICHT enthalten; die These handelt vom Nachlauf ueber Tage, nicht vom Sprung.
   *
   * Der Verfall wird bis zur letzten Kerze VOR dem Termin gemessen (i-1), damit die
   * Terminbewegung selbst nicht in den Filter geraet. */
  signal: function (bars, i, params, rang, sym) {
    if (i < VERFALL_KERZEN + 1) return null;
    var liste = termineVon(sym);
    if (!liste) return null;

    var vor = bars[i - 1][0], jetzt = bars[i][0];
    /* Genau ein Termin im Fenster (vor, jetzt] - mehr als einer waere ein Datenfehler,
     * der erste zaehlt. Lineare Suche waere je Kerze zu teuer; die Liste ist sortiert. */
    var lo = 0, hi = liste.length;
    while (lo < hi) { var m = (lo + hi) >> 1; if (liste[m][0] <= vor) lo = m + 1; else hi = m; }
    if (lo >= liste.length || liste[lo][0] > jetzt) return null;

    var ue = liste[lo][1];
    if (!(Math.abs(ue) >= 5)) return null;              // der BETRAG loest die Unsicherheit auf

    var a = bars[i - 1 - VERFALL_KERZEN][1], b = bars[i - 1][1];
    if (!(a > 0) || !(b > 0)) return null;
    if (!((b / a - 1) <= params.verfall)) return null;  // drei Monate gefallen

    return { dir: 1 };
  },
};
