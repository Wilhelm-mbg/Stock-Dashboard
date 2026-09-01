'use strict';
/* glockendruck-nacht, LIQUIDER SCHNITT, H=2 - siehe glockendruck-nacht-h1l.js. */
var L = require('./glockendruck-nacht-h1l.js');
var H = 2;

module.exports = {
  key: 'glockendruck-nacht-h' + H + 'l',
  testfamilie: L._testfamilie,
  grund: L.grund + ' Haltedauer ' + H + ' Naechte, eine Runde.',
  zeitrahmen: '1d',
  haltedauerKerzen: H,
  richtung: 'long',
  universum: L.universum,
  einstiegsZeitpunkt: 'schlusskerze',
  ausstiegsZeitpunkt: 'folgeEroeffnung',
  leseFensterKerzen: 61,
  kosten: { spanneBp: 5 },
  querschnitt: L.querschnitt,
  params: {},
  signal: function (bars, i, params, rang, sym) {
    if (i + H + 1 >= bars.length) return null;              // #85 fuer die Ausstiegskerze
    return L.signal(bars, i, params, rang, sym);
  },
};
