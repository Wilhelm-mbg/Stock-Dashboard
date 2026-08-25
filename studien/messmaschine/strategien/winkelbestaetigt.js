'use strict';
/* DER WINKEL AM BESTAETIGTEN KANAL - Felix' Regel aus #36, zweiter Anlauf.
 * Vorregistriert in VORREGISTRIERUNG-2026-08-25-winkelbestaetigt.md, VOR dem Lauf.
 *
 * WARUM ES DIESE ZWEITE DATEI GIBT. Der erste Anlauf (winkelgrad.js) hat Felix' Regel
 * NICHT gemessen. Dort stand als Begruendung, kanalUeber verlange "Beruehrungen an
 * beiden Raendern und ein Varianzverhaeltnis, das einen Zufallspfad ausschliesst".
 * Das war falsch, und zwar in zwei Stufen:
 *
 *   1. kanalUeber PRUEFT nichts davon. Es gibt guete, r2 und Beruehrungen als FELDER
 *      zurueck; verworfen wird nur bei zu wenigen Kerzen, fehlendem Kurs oder Nenner 0.
 *      Gemessen: in 20.000 Zufallspfaeden kam KEIN EINZIGES MAL null zurueck.
 *   2. Selbst mit Gatter waeren diese Felder leer. Die Kanten SIND das 92.- und das
 *      8.-Perzentil genau der Abweichungen, an denen sie danach geprueft werden -
 *      "Beruehrung an beiden Kanten" kann strukturell nicht scheitern (Minimum ueber
 *      8.000 Rauschlaeufe: 4 Beruehrungen bei Soll 2). Reines Rauschen bekommt Guete 75
 *      im Median, nie unter 50, und heisst in 35 % der Faelle "trend: auf".
 *
 * Die Folge: winkelgrad.js feuerte auf rund der Haelfte aller Kerzen (5,5 Mio Signale).
 * Gemessen wurde "ueber 40 Kerzen laesst sich eine Gerade legen" - nicht Felix' Satz.
 *
 * WAS HIER ANDERS IST. Eine Bestaetigung, die aus denselben Kerzen kommt, aus denen der
 * Kanal gerechnet wurde, ist keine. Sie muss AUSSERHALB liegen. Also: Der Kanal wird
 * ueber die Kerzen i-40 bis i-8 gerechnet und danach an den acht Kerzen geprueft, die
 * er nie gesehen hat. Nur wenn der Kurs den fortgeschriebenen Kanal dort eingehalten
 * hat, gilt der Trend als bestaetigt.
 *
 * Vorab am Rauschen gemessen, BEVOR registriert wurde: 11,5 % der Zufallspfade halten
 * den Kanal, mit Winkel >= 0,5 noch 3,6 %. Ein selektives Ereignis - im Gegensatz zu
 * den 100 % des ersten Anlaufs. Genau dieser Schritt fehlte beim ersten Mal.
 */
var Q = require('../../../quant.js');
var WP = require('./wertpapierart.js');

var FIT = 33;    /* Kerzen, aus denen der Kanal gerechnet wird */
var AUS = 8;     /* Kerzen danach, an denen er sich bewaehren muss - ungesehen */
var FENSTER = FIT + AUS;

/* Der normierte Winkel - dieselbe Definition wie im ersten Anlauf und in der
 * Winkel-Studie zu #33, damit die Zahlen vergleichbar bleiben. Die Normierung auf die
 * Kanalbreite gibt einem 300-Dollar-Wert und einem 20-Dollar-Wert denselben Massstab. */
function winkelVon(k) {
  if (!k || !(k.breite > 0) || !(k.n > 0)) return null;
  return k.steigung * k.n / k.breite;
}

/* Hat der Kurs den fortgeschriebenen Kanal in den ungesehenen Kerzen eingehalten?
 * Ohne Toleranz - die Toleranzstufen +0,25 und +0,5 Breite wurden am Rauschen mit
 * 29,9 % und 48,5 % gemessen und dort verworfen, weil sie zu wenig aussortieren. */
function haeltKanal(bars, k, vonIdx, bisIdx) {
  for (var j = vonIdx; j <= bisIdx; j++) {
    var c = bars[j][1];
    if (c == null) return false;
    var linie = k.achse + k.steigung * (j - k.von);
    var d = c - linie;
    if (d > k.breite * 0.5 || d < -k.breite * 0.5) return false;
  }
  return true;
}

module.exports = {
  key: 'winkelbestaetigt',
  name: 'Winkel am bestaetigten Kanal (Felix, #33/#36, zweiter Anlauf)',
  these: 'Ein Kanal, der sich an acht ungesehenen Kerzen bewaehrt hat, traegt umso mehr, ' +
         'je steiler er ist. Fuenf Stufen: der Ueberschuss muss mit der Schwelle STEIGEN, ' +
         'sonst ist die These widerlegt. Fuenf Tests, Bonferroni-Schwelle t = 2,58.',
  grund: 'Wer einen Aufwaertskanal sieht, der ueber acht weitere Kerzen gehalten hat, sieht ' +
         'eine Nachfrage, die sich durchsetzt und dabei nicht ausfranst - Kaeufer, die zu ' +
         'steigenden Kursen nachkaufen MUESSEN, weil ihre Zuteilung noch nicht voll ist ' +
         '(Index-Nachbildung, zuflussgetriebene Fonds). Je steiler der Kanal, desto groesser ' +
         'der Rueckstand, den diese Kaeufer aufholen. Der Unterschied zum ersten Anlauf ist ' +
         'nicht die Begruendung, sondern dass "bestaetigt" jetzt ueberhaupt etwas bedeutet.',
  zeitrahmen: '60m',
  /* Gelesen werden i-FENSTER bis i, also FENSTER+1 Kerzen. Der erste Anlauf meldete hier
   * 40, las aber 41 - die Kontrolle liess eine Kerze zu wenig aus (A7). Hier stimmt es. */
  leseFensterKerzen: FENSTER + 1,
  haltedauerKerzen: 8,
  richtung: 'long',
  universum: function (sym) { return WP.istAktie(sym); },
  kosten: { spanneBp: 5 },

  /* Die fuenf Stufen SIND die Tests. S0 ist der Nullpunkt: jeder bestaetigte Kanal ohne
   * Winkelbedingung. Ohne ihn liesse sich nicht sagen, ob der Winkel etwas beitraegt
   * oder ob schon die Bestaetigung der ganze Effekt ist. */
  varianten: [
    { name: 'S0', schwelle: 0.0 },
    { name: 'S05', schwelle: 0.5 },
    { name: 'S10', schwelle: 1.0 },
    { name: 'S15', schwelle: 1.5 },
    { name: 'S20', schwelle: 2.0 }
  ],

  signal: function (bars, i, params) {
    if (i < FENSTER) return null;
    var vonFit = i - FENSTER, bisFit = vonFit + FIT - 1;
    var k = null;
    try { k = Q.kanalUeber(bars, vonFit, bisFit); } catch (e) { return null; }
    if (!k) return null;
    /* DIE BESTAETIGUNG: acht Kerzen, die der Kanal nicht kennt, muessen ihn eingehalten
     * haben. Das ist die einzige Aussage hier, die nicht aus den eigenen Daten stammt. */
    if (!haeltKanal(bars, k, bisFit + 1, i)) return null;
    var w = winkelVon(k);
    if (w == null) return null;
    return w >= params.schwelle ? { dir: 1 } : null;
  },

  /* fuer den Test in test-v6.js - damit "bestaetigt" pruefbar bleibt, statt behauptet */
  _intern: { FIT: FIT, AUS: AUS, winkelVon: winkelVon, haeltKanal: haeltKanal }
};
