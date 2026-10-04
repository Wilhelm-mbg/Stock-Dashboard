'use strict';
/* Pruefbericht "Live gegen Messung" - Intraday-Depot (Oktober 2026): die Kleinsttests.
 *
 * Regel im Depot: "RSI(2) im Seitwaertskanal" (rsi2seit), nur Long, 60-Minuten-Kerzen,
 * Ausstieg nach 8 Handelsstunden, Not-Stopp. Soll ist die GEMESSENE Regel
 * (studien/messmaschine/strategien/rsi2seit.js, messen.js, Protokolle rsi2seit-*.json,
 * wiki/belegstand.md), nie der Live-Code.
 *
 * Die Tests liegen nach Frage getrennt in pruefberichte/live-gegen-messung-intraday/:
 *   frage1-regel.test.js   (1) handelt das Depot die gemessene Regel?
 *   frage2-anzeige.test.js (2) stimmt jede angezeigte Zahl mit dem Belegstand?
 *   frage3-daten.test.js   (3) handelt das Depot, obwohl Daten fehlen oder veraltet sind?
 * Jede Teildatei exportiert [{ name, lauf }]; lauf() liefert { abweichung, text }.
 * Jeder Test druckt GENAU EINE Zeile: "ZEIGT ABWEICHUNG: ..." oder "kein Unterschied: ...".
 * Reines Node, kein Netz, keine Schluessel, kein Electron, feste Uhr, Kunstdaten.
 * Nicht in `npm test` eingehaengt (die Abweichungen sind der Befund, nicht ein Fehler der Suite).
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/live-gegen-messung-intraday.test.js          alle Tests
 *   node pruefberichte/live-gegen-messung-intraday.test.js F1-03    nur Tests, deren Name so beginnt
 *   PRUEF_WURZEL=<Ordner> ...                                       gegen einen anderen Stand
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var path = require('path');

var TEILE = ['frage1-regel.test.js', 'frage2-anzeige.test.js', 'frage3-daten.test.js'];

async function main() {
  var filter = process.argv[2] || '';
  var n = 0, ab = 0, fehler = 0;
  for (var i = 0; i < TEILE.length; i++) {
    var tests = require(path.join(__dirname, 'live-gegen-messung-intraday', TEILE[i]));
    for (var j = 0; j < tests.length; j++) {
      var t = tests[j];
      if (filter && t.name.slice(0, filter.length) !== filter) continue;
      n++;
      try {
        var r = await t.lauf();
        if (r.abweichung) ab++;
        console.log((r.abweichung ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + t.name + ' — ' + r.text);
      } catch (e) {
        fehler++;
        console.log('TEST KAPUTT: ' + t.name + ' — ' + (e && e.message));
      }
    }
  }
  console.log('\n' + n + ' Tests, ' + ab + ' zeigen eine Abweichung' + (fehler ? ', ' + fehler + ' kaputt' : '') + '.');
  if (fehler) process.exitCode = 1;
}
main();
