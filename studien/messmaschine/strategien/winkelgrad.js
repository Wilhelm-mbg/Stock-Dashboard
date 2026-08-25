'use strict';
/* DER WINKEL ALS GEWICHT - Felix' Regel aus #36, die Antwort auf die offene Frage
 * aus #33. Vorregistriert in VORREGISTRIERUNG-2026-08-25-winkelgrad.md, VOR dem
 * ersten Lauf.
 *
 * Felix, 22.08.2026: "Jeder bestätigte Trend, über einem 'Gewinnwinkel' des Kurses zur
 * Horizontalen, sollte ein Kaufsignal auslösen. Flacher Winkel, kein Kauf ... Stärker
 * Winkel: kleiner Kauf, starker Winkel: starker Kauf."
 *
 * WIE DARAUS EINE MESSBARE FRAGE WIRD. Die Positionsgroesse ist bewusst NICHT gebaut:
 * sie veraendert nicht, OB eine Kante existiert, sondern nur, wie stark man auf sie
 * setzt - und macht das Ergebnis von einer zweiten, ungemessenen Entscheidung
 * abhaengig. Gemessen wird stattdessen in STUFEN. Traegt Felix' Idee, muss der
 * Ueberschuss mit der Stufe STEIGEN. Genau das ist seine Behauptung, und genau so ist
 * sie pruefbar - nicht als "irgendeine Stufe sieht gut aus", was der beste von fuenf
 * waere und damit nichts wert.
 *
 * WAS HIER NICHT GEPRUEFT WIRD: Felix' zweite Regel (je steiler der Winkel, desto mehr
 * Signale fuer den Ausstieg). Das ist ein eigener Gedanke und braucht eine eigene
 * Registrierung. Zwei Dinge gleichzeitig zu aendern hiesse, hinterher nicht zu wissen,
 * welches gewirkt hat.
 */
var Q = require('../../../quant.js');
var WP = require('./wertpapierart.js');

/* Fenster, ueber dem der Kanal gerechnet wird. 40 Kerzen sind gut drei Handelstage auf
 * 60m - lang genug fuer einen Trend, kurz genug, dass er noch der aktuelle ist. */
var FENSTER = 40;

/* Der normierte Winkel - dieselbe Definition wie in der Winkel-Studie zu #33, damit
 * die Ergebnisse vergleichbar bleiben. Die Normierung auf die Kanalbreite ist der
 * Grund, warum ein 300-Dollar-Wert und ein 20-Dollar-Wert denselben Massstab haben:
 * die nackte Steigung waere bei teuren Werten immer groesser. */
function winkelVon(k) {
  if (!k || !(k.breite > 0) || !(k.n > 0)) return null;
  return k.steigung * k.n / k.breite;
}

module.exports = {
  key: 'winkelgrad',
  name: 'Winkel als Gewicht (Felix, #33/#36)',
  these: 'Ein bestaetigter Trend traegt umso mehr, je steiler er ist. Gemessen in fuenf ' +
         'Stufen: der Ueberschuss muss mit der Schwelle STEIGEN, sonst ist die These ' +
         'widerlegt. Fuenf Tests, Bonferroni-Schwelle t = 2,58.',
  grund: 'Wer einen bestaetigten Aufwaertskanal sieht, sieht eine Nachfrage, die sich ueber ' +
         'Tage durchsetzt und dabei nicht ausfranst - Kaeufer, die zu steigenden Kursen ' +
         'nachkaufen MUESSEN, weil ihre Zuteilung noch nicht voll ist (Index-Nachbildung, ' +
         'Zuflussgetriebene Fonds). Je steiler der Kanal, desto groesser der Rueckstand, den ' +
         'diese Kaeufer aufholen. Das ist die Begruendung, aus der Felix\' Behauptung folgt - ' +
         'und wenn sie stimmt, muss der Ueberschuss mit dem Winkel steigen, nicht nur ' +
         'irgendwo positiv sein.',
  zeitrahmen: '60m',
  /* Der Kanal liest FENSTER Kerzen zurueck, der Vorlauf der Maschine ist groesser -
   * die Kontrolle laesst genau dieses Fenster aus (A7). */
  leseFensterKerzen: FENSTER,
  haltedauerKerzen: 8,
  richtung: 'long',
  universum: function (sym) { return WP.istAktie(sym); },
  kosten: { spanneBp: 5 },

  /* Die fuenf Stufen SIND die Tests. S0 ist der Nullpunkt: jeder bestaetigte Trend,
   * ohne Winkelbedingung. Ohne ihn liesse sich nicht sagen, ob der Winkel etwas
   * beitraegt oder ob schon "Kanal vorhanden" der ganze Effekt ist. */
  varianten: [
    { name: 'S0', schwelle: 0.0 },
    { name: 'S05', schwelle: 0.5 },
    { name: 'S10', schwelle: 1.0 },
    { name: 'S15', schwelle: 1.5 },
    { name: 'S20', schwelle: 2.0 }
  ],

  signal: function (bars, i, params) {
    if (i < FENSTER) return null;
    var k = null;
    try { k = Q.kanalUeber(bars, i - FENSTER, i); } catch (e) { return null; }
    /* ACHTUNG, HIER STAND EINE FALSCHE BEGRUENDUNG (aufgedeckt 25.08.2026, Nachtrag in
     * der Vorregistrierung). Behauptet war, kanalUeber verlange Beruehrungen an beiden
     * Raendern und ein Varianzverhaeltnis, das einen Zufallspfad ausschliesst. Es
     * verlangt nichts davon: drei return null, alle technisch. In 20.000 Zufallspfaden
     * kam KEIN EINZIGES null. Diese Zeile filtert also praktisch nie - der Detektor
     * feuert auf rund der Haelfte aller Kerzen.
     *
     * Die Regel wird trotzdem NICHT geaendert: sie ist vorregistriert und gemessen, und
     * eine vorregistrierte Regel hinterher zurechtzubiegen waere genau der Fehler, gegen
     * den die Vorregistrierung geschrieben ist. Was dieser Lauf gemessen hat, ist "ueber
     * 40 Kerzen laesst sich eine Gerade legen" - eine gueltige Frage, aber nicht Felix'.
     * Felix' Frage misst winkelbestaetigt.js, mit Bestaetigung ausserhalb des Fensters. */
    if (!k) return null;
    var w = winkelVon(k);
    if (w == null) return null;
    return w >= params.schwelle ? { dir: 1 } : null;
  }
};
