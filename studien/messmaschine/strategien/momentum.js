'use strict';
/* MOMENTUM - die Strategie, die das Mittelfrist-Depot wirklich handelt, erstmals
 * mit der Messmaschine geprueft. Vorregistriert in
 * VORREGISTRIERUNG-2026-08-24-momentum.md vor der ersten Messung.
 *
 * WARUM ERST JETZT. Die Maschine reichte ihrem Signal genau EINEN Wert. Momentum
 * stellt Werte aber GEGENEINANDER (mittelfrist.js: M.rangfolge, staerkste 10 %).
 * Der querschnitt-Hook schliesst diese Luecke: Die Maschine bildet je Handelstag
 * die Rangfolge aller Werte nach dem Merkmal und reicht dem Signal den
 * Perzentilrang durch.
 *
 * LIVE-PARAMETER, nachgelesen (mittelfrist.js): Rueckblick 231 Handelstage,
 * Luecke 21, Halten 63, staerkste 10 %.
 *
 * KEIN UMSCHICHTUNGSRASTER (Fehlertyp B9). Das Depot schichtet alle 63 Tage um;
 * welcher Tag der erste ist, ist eine willkuerliche Wahl unter 63 gleichberechtigten.
 * Die Kontroll-Pruefung mass, dass von 63 Lagen KEINE ein t >= 1,96 erreicht - die
 * gewaehlte sass am guenstigen Rand. Hier wird an JEDEM Tag geprueft, an dem die
 * Bedingung gilt. Das misst die These, nicht die Rasterlage. Traegt die These, ist
 * die Rasterlage der naechste Test; traegt sie nicht, eruebrigt er sich.
 */
var WP = require('./wertpapierart.js');

var RUECKBLICK = 231;   // Handelstage
var LUECKE = 21;        // der letzte Monat bleibt aussen vor (kurzfristige Umkehr)

module.exports = {
  key: 'momentum',
  testfamilie: {
    name: 'momentum-2026-08-24',
    testsGesamt: 4,
    begruendung: 'Vier Strenge-Stufen der Auswahl, vorregistriert in ' +
                 'VORREGISTRIERUNG-2026-08-24-momentum.md vor der ersten Messung. ' +
                 'Rueckblick, Luecke und Haltedauer werden NICHT variiert.',
  },
  grund: 'Wer muss handeln: Institutionelle Anleger duerfen und wollen nicht gegen ihre eigene ' +
         'Berichtslage kaufen. Ein Wert, der ueber Monate gestiegen ist, wird von Fonds nachgekauft, ' +
         'von Indexnachbildern beim Aufstieg mitgenommen und von Beratern empfohlen - alles Zufluesse ' +
         'mit Verzoegerung, nicht mit Preisurteil. Der letzte Monat bleibt bewusst aussen vor, weil ' +
         'dort die kurzfristige Umkehr wirkt: Wer gerade eben gestiegen ist, faellt oft zurueck, bevor ' +
         'die traegen Zufluesse einsetzen.',
  zeitrahmen: '1d',
  /* A7: Das Merkmal liest bis 231 Handelstage zurueck, plus die Luecke von 21.
   * Die Kontrolle laesst diese Kerzen aus. */
  leseFensterKerzen: 260,
  haltedauerKerzen: 63,
  richtung: 'long',
  /* Unternehmensaktien und Hinterlegungsscheine - keine ETFs, keine gehebelten
   * Produkte, kein Testsymbol. Ein Indexfonds hat kein Momentum im gemeinten Sinn,
   * er ist der Durchschnitt. */
  universum: function (sym) { return WP.istAktie(sym); },
  kosten: { spanneBp: 5 },
  /* Das Merkmal, nach dem die Werte gegeneinander sortiert werden: die Rendite von
   * t-231 bis t-21. Nur Vergangenheit, und die Luecke bleibt frei. */
  querschnitt: {
    mindestWerte: 100,
    merkmal: function (bars, i) {
      var von = i - RUECKBLICK, bis = i - LUECKE;
      if (von < 0) return null;
      var a = bars[von][1], b = bars[bis][1];
      if (!(a > 0) || !(b > 0)) return null;
      return b / a - 1;
    },
  },
  varianten: [
    { anteil: 0.10 },   // die Live-Einstellung
    { anteil: 0.20 },
    { anteil: 0.05 },
    { anteil: 0.33 },
  ],
  signal: function (bars, i, params, rang) {
    if (!rang) return null;
    /* perzentil 1,0 = staerkster Wert des Tages. Die staerksten X % sind alle
     * ueber 1 - X. */
    return rang.perzentil >= 1 - params.anteil ? { dir: 1 } : null;
  },
};
