'use strict';
/* abgabedruck-nacht, ZWEIG N (Nachtbein, die These) - Vorregistrierung 2026-08-27.
 * studien/vorregistrierung-2026-08-27-abgabedruck-nacht/VORREGISTRIERUNG.md
 *
 * Signalregel (Abschnitt 3), je Symbol und Handelstag i:
 *   U(i)      = v(i) / Median(v(i-60) .. v(i-1))            KURSFREI
 *   abflauend = v(i) < v(i-1)                               KURSFREI
 *   rVor      = Schluss(i-1) / Eroeffnung(i-1) - 1          Kurse des VORTAGES
 *   Gatter:   abflauend UND rVor < 0
 *   Auswahl:  hoechste U(i) unter den Zugelassenen, gedeckelt auf ein Fuenftel des
 *             zugelassenen Querschnitts des Tages
 * Einstieg Schluss(i), Ausstieg Eroeffnung(i+1), H = 1, long.
 *
 * Zulassung: Aktien (CS/ADRC), Tagesumsatz > 5 Mio $. Ausgelegt wie bei den
 * Schwesterstudien als Umsatz(i) = Schluss(i) x Stueck(i) - die Kurs-Disjunktheit
 * aus Abschnitt 3 betrifft Gatter und Rang, nicht die Zulassung; die Auslegung
 * steht im ERGEBNIS.md ausgewiesen.
 *
 * Umsetzung der Deckelung in der Rangfolge der Maschine: alle Zugelassenen bekommen
 * ein Merkmal (Gatter-Faelle ihr U(i) > 0, alle anderen -1). Das Quintil zaehlt damit
 * ueber den ZUGELASSENEN Querschnitt; ausgewaehlt wird nur, wer im obersten Fuenftel
 * liegt UND selbst das Gatter besteht - die -1-Faelle koennen bei duennem Gatter zwar
 * hohe Raenge erben, fallen aber an der zweiten Bedingung.
 *
 * C8-Vorgriff, offen ausgewiesen (Einschraenkung 5): das konsolidierte Tagesvolumen
 * steht zum Schlusszeitpunkt noch nicht fest. Die gemessene Zahl ist eine OBERE
 * SCHRANKE; ein NEIN bleibt gueltig, ein JA ist vorlaeufig.
 *
 * Testzahl: JA-Familie 6 (ANMELDUNG 27.08.), z_krit 2,6383. */
var WP = require('./wertpapierart.js');

var UMSATZ_MIN = 5e6;

/* #85: letzte Kerze des Abrufs gilt als nicht vorhanden (projektweiter Datenbefund
 * vom 26.08., betrifft auch das Tagesarchiv). o(i+1) > 0 wird verlangt, damit beide
 * Zweige dieselbe Kohorte messen - die Maschine wuerfe N-Signale ohne Eroeffnung
 * ohnehin aus, Zweig T fiele sonst still auf den Vorkerzen-Schluss zurueck (C7). */
function zugelassen(bars, i) {
  var b = bars[i];
  if (!b) return false;
  var c = b[1], v = b[2] || 0;
  if (!(c > 0) || !(c * v > UMSATZ_MIN)) return false;
  var n = bars[i + 1];
  if (!n || n.length <= 5 || !(n[5] > 0)) return false;
  if (i + 2 >= bars.length) return false;                   // #85
  return true;
}

function merkmal(bars, i) {
  if (!zugelassen(bars, i)) return null;
  if (i < 61) return -1;
  var v = bars[i][2], b1 = bars[i - 1];
  var v1 = b1 ? b1[2] : null;
  if (!(v > 0) || !(v1 > 0)) return -1;
  if (!(v < v1)) return -1;                                 // abflauend
  var o1 = (b1.length > 5) ? b1[5] : null, c1 = b1[1];
  if (!(o1 > 0) || !(c1 > 0)) return -1;
  if (!(c1 / o1 - 1 < 0)) return -1;                        // rVor < 0
  var w = [];
  for (var j = i - 60; j < i; j++) {
    var vj = bars[j] ? bars[j][2] : null;
    if (vj == null || !(vj >= 0)) return -1;
    w.push(vj);
  }
  w.sort(function (a, b) { return a - b; });
  var med = (w[29] + w[30]) / 2;
  if (!(med > 0)) return -1;
  return v / med;                                           // U(i), immer > 0
}

module.exports = {
  key: 'abgabedruck-nacht-n',
  testfamilie: {
    name: 'uebernacht-2026-08',
    testsGesamt: 6,
    begruendung: 'Drei Uebernacht-Entwuerfe x zwei Zweige auf demselben Korpus und Fenster. ' +
      'JA-Familie 6 laut ANMELDUNG.md (27.08., PM-Entscheid) - der gepaarte Endpunkt kann ' +
      'kein JA erzeugen und zaehlt fuer die JA-Seite nicht.',
  },
  grund: 'Intermediaere nehmen das Orderungleichgewicht zum Boersenschluss auf und werden ueber ' +
    'die Uebernachtrendite entschaedigt (Boyarchenko/Larsen/Whelan 2023); Ausverkaeufe zeigen ' +
    'die robuste Seite, deshalb nur long. Die Halbwertszeit des Haendlerbestands liegt fuer ' +
    'grosse Werte bei etwa einem halben Tag - H = 1 ist das vom Mechanismus verlangte Fenster. ' +
    'Das Vorzeichen des Vortages ist ein Stellvertreter fuer die Richtung des heutigen ' +
    'Ungleichgewichts (Auftrags-Zerlegen; nicht im Volltext geprueft - ein NEIN traegt schwaecher).',
  zeitrahmen: '1d',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: function (sym) { return WP.istAktie(sym); },
  einstiegsZeitpunkt: 'schlusskerze',                       // Einstieg Schluss(i)
  ausstiegsZeitpunkt: 'folgeEroeffnung',                    // Ausstieg Eroeffnung(i+1)
  leseFensterKerzen: 62,                                    // 60 Umsaetze + i-1 + i
  kosten: { spanneBp: 5 },
  querschnitt: { merkmal: merkmal, mindestWerte: 20 },
  params: {},
  signal: function (bars, i, params, rang) {
    if (!rang || rang.perzentil < 0.8) return null;         // oberstes Fuenftel der Zugelassenen
    if (!(merkmal(bars, i) > 0)) return null;               // und selbst Gatter-Fall
    return { dir: 1 };
  },
  _zugelassen: zugelassen,
  _merkmal: merkmal,
};
