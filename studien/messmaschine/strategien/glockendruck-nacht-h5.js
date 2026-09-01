'use strict';
/* glockendruck-nacht, Haltedauer-Erweiterung H=5 - siehe glockendruck-nacht-h2.js
 * und die Vorregistrierung 2026-09-01-glockendruck-haltedauer. Vorab-Befund dort:
 * voraussichtlich strukturell blind fuer die Zielgroesse - der echte delta80
 * dieses Laufs entscheidet und ist selbst der Befund. */
var N = require('./glockendruck-nacht-n.js');
var H = 5;

module.exports = {
  key: 'glockendruck-nacht-h' + H,
  testfamilie: {
    name: 'glockendruck-haltedauer-2026-09',
    testsGesamt: 7,
    begruendung: 'Drei Haltedauern breit (H=2,3,5) + vier liquide Laeufe (H=1,2,3,5) - ' +
      'Nachtrag vom 01.09. (Liquiditaets-Zusatzendpunkt) hebt die Familie von 3 auf 7, ' +
      'VOR jedem Ertragsblick.',
  },
  grund: N.grund + ' HALTEDAUER-FASSUNG: dieselbe Auswahl ueber ' + H + ' Naechte gehalten - ' +
    'Ein- und Ausstieg bleiben EINE Runde, die Kante je Runde darf wachsen.',
  zeitrahmen: '1d',
  haltedauerKerzen: H,
  richtung: 'long',
  universum: N.universum,
  einstiegsZeitpunkt: 'schlusskerze',
  ausstiegsZeitpunkt: 'folgeEroeffnung',
  leseFensterKerzen: 61,
  kosten: { spanneBp: 5 },
  querschnitt: N.querschnitt,
  params: {},
  signal: function (bars, i, params, rang, sym) {
    if (i + H + 1 >= bars.length) return null;              // #85 fuer die Ausstiegskerze
    return N.signal(bars, i, params, rang, sym);
  },
};
