'use strict';
/* T3 aus der Vorregistrierung 2026-08-23 ("Eigenbau"), 2 von 7 Tests.
 *
 * Diese These ist ein MESSGERAET, kein Handelsvorschlag - und sie hat als einzige
 * bewusst KEINE Zwangsgeschichte.
 *
 * Der Anlass: Am 23.08.2026 ergab die Nachpruefung aller vier als "belegt" gefuehrten
 * Kanten, dass rund zwei Drittel des Rohvorteils schlichtes HALTEN sind, nicht das
 * Signal. Wenn Halten den Ertrag traegt, ist die entscheidende Frage nicht "welches
 * Signal", sondern "welches Halten".
 *
 * WARUM DAS NICHT TAUTOLOGISCH IST: Die Kontrolle der Maschine ist der Mittelwert
 * des Symbols zu dieser Stunde ueber die GANZE Haelfte. Das Signal benutzt ein
 * ROLLENDES Fenster der letzten 60 Vorkommen. Ist die Drift konstant, heben sich
 * beide auf und der Ueberschuss ist null. Nur wenn die Drift zeitlich schwankt UND
 * fortbesteht, entsteht ein Ueberschuss. Gemessen wird also nicht "gibt es Drift",
 * sondern "laesst sich Drift vorhersagen".
 *
 * Erwartet wird ein Nein. Das ist das nuetzlichere der beiden Ergebnisse: Es hiesse,
 * dass der Basisertrag Rauschen um einen Marktmittelwert ist und jeder Versuch,
 * ihn per Auswahl zu heben, vergeblich bleibt.
 */
var T = require('./tageshilfen.js');

module.exports = {
  key: 't3-stundendrift',
  testfamilie: {
    name: 'eigenbau-2026-08-23',
    testsGesamt: 7,
    begruendung: 'Drei Thesen mit Zwangsgeschichte, vorregistriert in ' +
                 'VORREGISTRIERUNG-2026-08-23-eigenbau.md vor der ersten Messung.',
  },
  grund: 'Zwei Drittel des Rohvorteils aller bisher geprueften Kanten sind schlichtes Halten, nicht ' +
         'das Signal. Wenn Halten den Ertrag traegt, ist die Frage nicht "welches Signal", sondern ' +
         '"welches Halten". Geprueft wird, ob die stundenspezifische Drift eines Werts fortbesteht: ' +
         'Das Signal schaetzt sie aus einem rollenden Fenster, die Kontrolle mittelt dieselbe Groesse ' +
         'ueber die ganze Haelfte. Ist die Drift konstant, heben sich beide auf. Ein Ueberschuss ' +
         'entstuende nur, wenn sie schwankt UND vorhersagbar ist.',
  /* A7: 60 Vorkommen derselben Stunde (x7) fuer Mittel und Standardfehler.
   * Die Kontrolle laesst diese Kerzen aus, damit sie nichts enthaelt, was das
   * Signal gelesen hat - sonst entsteht die Nullpunktverschiebung A6. */
  leseFensterKerzen: 430,
  zeitrahmen: '60m',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: 'aktien',
  kosten: { spanneBp: 5 },
  varianten: [{ k: 1.0 }, { k: 2.0 }],
  signal: function (bars, i, params) {
    var c = T.X(bars);
    var d = T.stundenDrift(c, bars, i, 60);
    if (!d) return null;
    return d.mittel >= params.k * d.se ? { dir: 1 } : null;
  },
};
