'use strict';
/* glockendruck-nacht, ZWEIG N (Nachtbein) - Vorregistrierung 2026-08-26.
 * studien/vorregistrierung-2026-08-26-glockendruck-nacht/VORREGISTRIERUNG.md
 *
 * Einstieg Schluss(i), Ausstieg Eroeffnung(i+1), H = 1, long. Auswahl: Schlussdruck
 * S = (Schluss - Tief) / (Hoch - Tief) im UNTERSTEN Quintil des an diesem Tag
 * zugelassenen Querschnitts (Umsatz >= 5 Mio $, Hoch > Tief, Eroeffnung(i+1) > 0).
 * Genau ein Quintil - keine Dezil-, Terzil- oder Schwellenvariante.
 *
 * Testzahl: die JA-Familie der drei Uebernacht-Entwuerfe hat 6 Tests (ANMELDUNG
 * vom 27.08. in vorregistrierung-2026-08-27-querschnitt-uebernacht/), z_krit 2,6383.
 *
 * C8-Vorgriff, offen ausgewiesen (Gatter 3 der Vorregistrierung): S liest Schluss(i)
 * und fuellt zu Schluss(i). Die gemessene Zahl ist eine OBERE SCHRANKE der
 * handelbaren Kante. Ein NEIN bleibt gueltig, ein JA ist vorlaeufig.
 * Spannen-Rueckprall (Nachtraege 26./27.08., Nagel 2012): S teilt Schluss(i) mit der
 * Zielgroesse und sortiert nach der Bandlage - ein Teil eines Ueberschusses kann
 * Rueckprall sein, auch bei 0,10 Pp. Gehoert in jeden Bericht dieses Entwurfs. */
var WP = require('./wertpapierart.js');

var UMSATZ_MIN = 5e6;

/* Zulassung je Symbol-Tag, woertlich aus Abschnitt 3 der Vorregistrierung.
 * #85 (Gatter 2): die letzte Kerze jedes Abrufs gilt als nicht vorhanden - auch als
 * Ausstiegskerze nicht. Die Bedingung i+2 < bars.length setzt genau das um. */
function zugelassen(bars, i) {
  var b = bars[i];
  if (!b) return false;
  var c = b[1], v = b[2] || 0, h = b[3], l = b[4];
  if (!(c > 0) || !(c * v >= UMSATZ_MIN)) return false;
  if (!(h > l)) return false;
  var n = bars[i + 1];
  if (!n || n.length <= 5 || !(n[5] > 0)) return false;   // Eroeffnung(i+1) vorhanden
  if (i + 2 >= bars.length) return false;                 // #85
  return true;
}

function schlussdruck(bars, i) {
  if (!zugelassen(bars, i)) return null;
  var b = bars[i];
  return (b[1] - b[4]) / (b[3] - b[4]);
}

module.exports = {
  key: 'glockendruck-nacht-n',
  testfamilie: {
    name: 'uebernacht-2026-08',
    testsGesamt: 6,
    begruendung: 'Drei Uebernacht-Entwuerfe x zwei Zweige auf demselben Korpus und Fenster. ' +
      'JA-Familie 6 laut ANMELDUNG.md (27.08., PM-Entscheid) - der gepaarte Endpunkt kann ' +
      'kein JA erzeugen und zaehlt fuer die JA-Seite nicht.',
  },
  grund: 'Um 16:00 ET wechselt der Grenzhalter: Hebelkonten muessen flach sein, MOC-Fluss fragt ' +
    'nach dem Zeitpunkt statt dem Preis. Ein Schluss am Tagestief heisst, dass der letzte ' +
    'Grenzhaendler des Tages noch verkaufte, als die Glocke ging. Wer das Lager ueber Nacht ' +
    'nimmt, schreibt eine Lueckenoption und verlangt eine Praemie - eine Risikopraemie, kein ' +
    'Marktfehler, deshalb nicht wegarbitriert, wenn es sie gibt.',
  zeitrahmen: '1d',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: function (sym) { return WP.istAktie(sym); },   // CS + ADRC, keine Namensliste
  einstiegsZeitpunkt: 'schlusskerze',                       // Einstieg Schluss(i)
  ausstiegsZeitpunkt: 'folgeEroeffnung',                    // Ausstieg Eroeffnung(i+1)
  leseFensterKerzen: 61,
  kosten: { spanneBp: 5 },
  querschnitt: { merkmal: schlussdruck, mindestWerte: 20 },
  params: {},
  signal: function (bars, i, params, rang) {
    /* rang != null heisst: das Merkmal war berechenbar, die Zulassung bestanden. */
    if (!rang || rang.perzentil > 0.2) return null;         // unterstes Quintil
    return { dir: 1 };
  },
  /* Fuer das gepaarte Querschnitts-Werkzeug (ANMELDUNG 27.08.) - dieselbe Zulassung
   * und dasselbe Merkmal, kein Nachbau. Die Messmaschine liest diese Felder nicht. */
  _zugelassen: zugelassen,
  _merkmal: schlussdruck,
};
