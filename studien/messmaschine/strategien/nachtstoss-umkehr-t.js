'use strict';
/* nachtstoss-umkehr, ZWEIG T (Tagbein, Trennschaerfe) - Vorregistrierung 2026-08-26.
 * Einstieg Eroeffnung(i+1), Ausstieg Schluss(i+1), H = 1, long. Auswahl identisch
 * Zweig N (nachtstoss-umkehr-n.js - dieselben Funktionen, kein Nachbau). */
var N = require('./nachtstoss-umkehr-n.js');

module.exports = {
  key: 'nachtstoss-umkehr-t',
  testfamilie: N.testfamilie,
  grund: N.grund + ' ZWEIG T: dieselbe Auswahl im Folgetag-Fenster - die Trennschaerfe, ' +
    'ob der Ueberschuss wirklich an der Sitzungsgrenze sitzt.',
  zeitrahmen: '1d',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: N.universum,
  einstiegsZeitpunkt: 'folgeEroeffnung',                    // Einstieg Eroeffnung(i+1)
  ausstiegsZeitpunkt: 'schluss',                            // Ausstieg Schluss(i+1)
  leseFensterKerzen: 61,
  kosten: { spanneBp: 5 },
  querschnitt: N.querschnitt,
  params: {},
  signal: N.signal,
};
