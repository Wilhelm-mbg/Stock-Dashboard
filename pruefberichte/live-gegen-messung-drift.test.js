'use strict';
/* Pruefbericht "Live gegen Messung" - Ergebnis-Drift-Buch (Oktober 2026): die Kleinsttests.
 *
 * Frage: handelt das Drift-Buch der App so, wie die Messung Nr. 88 gerechnet hat
 * (studien/vorregistrierung-2026-10-04-ergebnis-drift/, Regel VORREGISTRIERUNG.md Teil A/C,
 * Rechner buch.js/zehntel.js, Ergebnis ERGEBNIS.md)? Bericht: pruefberichte/2026-10-live-gegen-messung-drift.md.
 * Stand der Durchsicht: main 61dca2c. Aufbau nach dem Vorbild pruefberichte/live-gegen-messung-momentum.test.js.
 *
 * Die Tests stehen in drei Teilen unter pruefberichte/live-gegen-messung-drift/ (je Teilgebiet ein Teil):
 *   teil-1-ereignis-signal.tests.js   E…  Ereignis-Quelle, Zeitpunkt, Zehntel/Rang, Universum
 *   teil-2-buchfuehrung.tests.js      K…  Plaetze, Einstieg, Haltedauer, Kosten, Short, Ausschuettungen, Reihenende, Takte
 *   teil-3-anzeige.tests.js           T…  Zahlen und Texte der App gegen ergebnis.json
 * Jeder Test druckt GENAU EINE Zeile: "ZEIGT ABWEICHUNG: ..." oder "kein Unterschied: ...".
 * Soll ist immer die gemessene Regel; wo moeglich laufen dieselben Kunstdaten durch den Rechner der
 * Messung und durch die Funktion der App. Feste Uhr, kein Netz, keine Schluessel, kein Electron.
 * Nicht in `npm test` eingehaengt (die Abweichungen sind auf dem heutigen Code Absicht der Durchsicht).
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/live-gegen-messung-drift.test.js          alle Tests
 *   node pruefberichte/live-gegen-messung-drift.test.js K3       nur Test K3 (auch mehrere: E1 T2)
 *   PRUEF_WURZEL=<Ordner> node ...                               Module eines anderen Stands pruefen
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var path = require('path');

var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..');
var ZAEHLER = { abweichung: 0, gleich: 0, defekt: 0 };
var Z = {
  WURZEL: WURZEL,
  zeile: function (abweichung, text) {
    if (abweichung) ZAEHLER.abweichung++; else ZAEHLER.gleich++;
    console.log((abweichung ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + text);
  }
};
var TEILE = ['teil-1-ereignis-signal.tests.js', 'teil-2-buchfuehrung.tests.js', 'teil-3-anzeige.tests.js'];

(async function () {
  var alle = [];
  TEILE.forEach(function (f) { alle = alle.concat(require(path.join(__dirname, 'live-gegen-messung-drift', f))(Z)); });
  var nur = process.argv.slice(2);
  var lauf = nur.length ? alle.filter(function (t) { return nur.indexOf(t.nr) !== -1; }) : alle;
  if (nur.length && lauf.length !== nur.length) {
    console.log('Unbekannte Kennung. Vorhanden: ' + alle.map(function (t) { return t.nr; }).join(' '));
    process.exitCode = 2;
  }
  for (var i = 0; i < lauf.length; i++) {
    process.stdout.write('[' + lauf[i].nr + '] ');
    try { await lauf[i].lauf(); } catch (e) { ZAEHLER.defekt++; console.log('TEST DEFEKT: ' + (e && e.stack || e)); process.exitCode = 1; }
  }
  console.log('-- ' + lauf.length + ' Tests: ' + ZAEHLER.abweichung + ' zeigen eine Abweichung, ' + ZAEHLER.gleich + ' keinen Unterschied, ' +
    ZAEHLER.defekt + ' defekt.');
})();
