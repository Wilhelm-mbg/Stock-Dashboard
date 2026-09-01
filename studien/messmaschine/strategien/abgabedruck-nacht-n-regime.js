'use strict';
/* abgabedruck-nacht, ZWEIG N, REGIMESCHNITT - Abschnitt 6 der Vorregistrierung
 * (vorab registriert: getrennter Bericht A bis 31.12.2020 / B ab 01.01.2021, weil
 * Boyarchenko/Larsen/Whelan am 01.07.2026 den Eingang des Mechanismus seit 2021
 * als kollabiert gemessen haben; Schnittpunkt aus der Quelle, wird nicht verschoben).
 *
 * NUR BERICHTSPFLICHT, KEIN URTEIL: das Urteil haengt am ungeteilten Lauf
 * (abgabedruck-nacht-n.js). Variante 0 = A, Variante 1 = B. */
var N = require('./abgabedruck-nacht-n.js');

module.exports = {
  key: 'abgabedruck-nacht-n-regime',
  testfamilie: N.testfamilie,
  grund: N.grund + ' REGIMESCHNITT (Berichtspflicht, kein Urteil): getrennt vor/ab 2021, ' +
    'weil der Eingang des Mechanismus (Schluss-Ungleichgewichte) seit 2021 komprimiert ist.',
  zeitrahmen: '1d',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: N.universum,
  einstiegsZeitpunkt: 'schlusskerze',
  ausstiegsZeitpunkt: 'folgeEroeffnung',
  leseFensterKerzen: 62,
  kosten: { spanneBp: 5 },
  querschnitt: N.querschnitt,
  varianten: [{ regime: 'A', bis: '2020-12-31' }, { regime: 'B', von: '2021-01-01' }],
  signal: function (bars, i, params, rang, sym) {
    var s = N.signal(bars, i, params, rang, sym);
    if (!s) return null;
    var tag = new Date(bars[i][0]).toISOString().slice(0, 10);
    if (params.bis && tag > params.bis) return null;
    if (params.von && tag < params.von) return null;
    return s;
  },
};
