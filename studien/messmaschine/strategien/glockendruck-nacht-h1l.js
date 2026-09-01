'use strict';
/* glockendruck-nacht, LIQUIDER SCHNITT, H=1 - Nachtrag 2026-09-01 zur
 * Vorregistrierung glockendruck-haltedauer (Zusatzendpunkt 3).
 *
 * Zulassung wie glockendruck-nacht-n.js PLUS liquide(i): Median des Tagesumsatzes
 * ueber die 120 Handelstage i-119..i >= 1 Mrd $ - je Tag gerechnet, rueckschaufrei
 * (keine heutige Symbolliste auf die Historie). Das Quintil wird im liquiden
 * Teiluniversum gebildet (handelbare Fassung). Familie 7 Tests (3 breit + 4 liquide). */
var N = require('./glockendruck-nacht-n.js');

var LIQUIDE_MIN = 1e9, FENSTER = 120;

function liquide(bars, i) {
  if (i < FENSTER) return false;
  var w = [];
  for (var j = i - FENSTER + 1; j <= i; j++) {
    var b = bars[j];
    var u = b ? (b[1] > 0 ? b[1] * (b[2] || 0) : 0) : 0;
    w.push(u);
  }
  w.sort(function (a, b) { return a - b; });
  var med = (w[FENSTER / 2 - 1] + w[FENSTER / 2]) / 2;
  return med >= LIQUIDE_MIN;
}

function merkmalLiquide(bars, i) {
  var s = N._merkmal(bars, i);              // Zulassung + Schlussdruck, kein Nachbau
  if (s == null) return null;
  if (!liquide(bars, i)) return null;
  return s;
}

var TESTFAMILIE = {
  name: 'glockendruck-haltedauer-2026-09',
  testsGesamt: 7,
  begruendung: 'Drei Haltedauern breit (H=2,3,5) + vier liquide Laeufe (H=1,2,3,5, ' +
    'Median-Tagesumsatz 120d >= 1 Mrd $) - Nachtrag vom 01.09. VOR jedem Ertragsblick.',
};

module.exports = {
  key: 'glockendruck-nacht-h1l',
  testfamilie: TESTFAMILIE,
  grund: N.grund + ' LIQUIDER SCHNITT: nur Werte, deren 120-Tage-Median-Umsatz ueber ' +
    '1 Mrd $ liegt - die Klasse, in der die Kosten real gemessen sind. Ueberlebt der ' +
    'Effekt dort, wo er handelbar waere?',
  zeitrahmen: '1d',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: N.universum,
  einstiegsZeitpunkt: 'schlusskerze',
  ausstiegsZeitpunkt: 'folgeEroeffnung',
  leseFensterKerzen: 61,
  kosten: { spanneBp: 5 },
  querschnitt: { merkmal: merkmalLiquide, mindestWerte: 20 },
  params: {},
  signal: function (bars, i, params, rang) {
    if (!rang || rang.perzentil > 0.2) return null;         // unterstes Quintil der Liquiden
    return { dir: 1 };
  },
  _merkmalLiquide: merkmalLiquide,
  _testfamilie: TESTFAMILIE,
};
