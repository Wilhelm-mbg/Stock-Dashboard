'use strict';
/* nachtstoss-umkehr, ZWEIG N (Nachtbein, primaer) - Vorregistrierung 2026-08-26.
 * studien/vorregistrierung-2026-08-26-nachtstoss-umkehr/VORREGISTRIERUNG.md
 *
 * Kennzahl: O(t) = Eroeffnung(t)/Schluss(t-1) - 1; z1(i) = O(i) / sd(O ueber die 59
 * Tage i-59..i-1). Das laufende O(i) gehoert NICHT in den Nenner. Auswahl: z1 im
 * untersten Quintil des zugelassenen Querschnitts. Einstieg Schluss(i), Ausstieg
 * Eroeffnung(i+1), H = 1, long.
 *
 * Gatter 5 (kein Vorgriff, der strukturelle Kern): z1 liest ausschliesslich
 * Eroeffnungen bis Tag i und Schluesse bis Tag i-1 - niemals Schluss(i), Hoch(i)
 * oder Tief(i). Die ZULASSUNG liest Umsatz(i) = Schluss(i) x Stueck(i), wie in
 * Abschnitt 3.1 der Vorregistrierung woertlich festgelegt; der Testfall
 * (test-kennzahl-vorgriff.js im Vorregistrierungs-Ordner) prueft die KENNZAHL.
 *
 * Testzahl: JA-Familie 6 (ANMELDUNG 27.08.), z_krit 2,6383. */
var WP = require('./wertpapierart.js');

var UMSATZ_MIN = 5e6;

/* Zulassung woertlich aus Abschnitt 3.1; #85 (Gatter 3): letzte Kerze des Abrufs
 * gilt als nicht vorhanden, auch als Ausstiegskerze nicht (i+2 < bars.length). */
function zugelassen(bars, i) {
  var b = bars[i], v0 = bars[i - 1];
  if (!b || !v0) return false;
  var c = b[1], v = b[2] || 0, h = b[3], l = b[4];
  if (!(c > 0) || !(c * v >= UMSATZ_MIN)) return false;
  if (!(h > l) || !(l > 0)) return false;
  if (!(b.length > 5 && b[5] > 0)) return false;            // Eroeffnung(i) > 0
  if (!(v0[1] > 0)) return false;                           // Schluss(i-1) > 0
  var n = bars[i + 1];
  if (!n || n.length <= 5 || !(n[5] > 0)) return false;     // Eroeffnung(i+1) vorhanden
  if (i + 2 >= bars.length) return false;                   // #85
  return true;
}

/* Die Kennzahl selbst - liest NUR bars[j][5] (Eroeffnungen, j <= i) und
 * bars[j-1][1] (Vortags-Schluesse, j-1 <= i-1). Fenster 60 Kerzen einschliesslich
 * des Signaltages, 59 im Nenner. Ein unvollstaendiges Fenster liefert keinen Wert -
 * eine stumme Naeherung waere ein anderes Signal. */
function nachtstossZ1(bars, i) {
  if (i < 60) return null;
  var s = 0, s2 = 0;
  for (var j = i - 59; j < i; j++) {
    var bj = bars[j], vj = bars[j - 1];
    var o = (bj && bj.length > 5) ? bj[5] : null;
    var cv = vj ? vj[1] : null;
    if (!(o > 0) || !(cv > 0)) return null;
    var r = o / cv - 1;
    s += r; s2 += r * r;
  }
  var m = s / 59, va = (s2 - 59 * m * m) / 58;
  if (!(va > 0)) return null;
  var oi = bars[i][5], ci1 = bars[i - 1][1];
  if (!(oi > 0) || !(ci1 > 0)) return null;
  return (oi / ci1 - 1) / Math.sqrt(va);
}

function merkmal(bars, i) {
  if (!zugelassen(bars, i)) return null;
  return nachtstossZ1(bars, i);
}

module.exports = {
  key: 'nachtstoss-umkehr-n',
  testfamilie: {
    name: 'uebernacht-2026-08',
    testsGesamt: 6,
    begruendung: 'Drei Uebernacht-Entwuerfe x zwei Zweige auf demselben Korpus und Fenster. ' +
      'JA-Familie 6 laut ANMELDUNG.md (27.08., PM-Entscheid) - der gepaarte Endpunkt kann ' +
      'kein JA erzeugen und zaehlt fuer die JA-Seite nicht.',
  },
  grund: 'Die Eroeffnungsauktion ist das Fenster mit der duennsten Beteiligung und dem meisten ' +
    'terminfixen Fluss zugleich (MOO, Nachtauftraege, Nachbildung). Ein Teil des ' +
    'Eroeffnungskurses ist deshalb Druck, kein Wert, und wird zurueckgezahlt. Sitzt die ' +
    'Rueckzahlung im Nachtbein, ist sie eine Praemie fuer unbewirtschaftetes Halten ueber die ' +
    'Sitzungsgrenze (Lou/Polk/Skouras 2019; Boyarchenko et al. 2023 - Richtungssaeule 2 von ' +
    'den Autoren fuer 2021 ff. zurueckgenommen, siehe Nachtrag 27.08. und Regimeschnitt).',
  zeitrahmen: '1d',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: function (sym) { return WP.istAktie(sym); },
  einstiegsZeitpunkt: 'schlusskerze',                       // Einstieg Schluss(i)
  ausstiegsZeitpunkt: 'folgeEroeffnung',                    // Ausstieg Eroeffnung(i+1)
  leseFensterKerzen: 61,
  kosten: { spanneBp: 5 },
  querschnitt: { merkmal: merkmal, mindestWerte: 20 },
  params: {},
  signal: function (bars, i, params, rang) {
    if (!rang || rang.perzentil > 0.2) return null;         // unterstes Quintil
    return { dir: 1 };
  },
  _zugelassen: zugelassen,
  _merkmal: merkmal,
  _kennzahl: nachtstossZ1,
};
