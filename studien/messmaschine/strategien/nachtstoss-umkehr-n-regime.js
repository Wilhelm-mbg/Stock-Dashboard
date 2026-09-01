'use strict';
/* nachtstoss-umkehr, ZWEIG N, REGIMESCHNITT - Nachtrag vom 27.08.2026 zur
 * Vorregistrierung (Boyarchenko/Larsen/Whelan nehmen ihren Beleg fuer 2021 ff.
 * zurueck; Schnittpunkt 01.01.2021 stammt aus der Quelle, nicht aus unseren Daten).
 *
 * NUR BERICHTSPFLICHT, KEIN URTEIL: aus diesem Lauf wird weder JA noch NEIN
 * abgeleitet. Das Gesamturteil haengt am ungeteilten Lauf (nachtstoss-umkehr-n.js).
 * Variante 0 = A (bis 31.12.2020), Variante 1 = B (ab 01.01.2021). Signal und
 * Auswahl kommen unveraendert aus der Hauptdatei - nur das Datum schneidet. */
var N = require('./nachtstoss-umkehr-n.js');

module.exports = {
  key: 'nachtstoss-umkehr-n-regime',
  testfamilie: N.testfamilie,
  grund: N.grund + ' REGIMESCHNITT (Berichtspflicht, kein Urteil): getrennt vor/ab 2021, ' +
    'weil die Autoren der Richtungssaeule ihren Beleg fuer 2021 ff. selbst zurueckgenommen haben.',
  zeitrahmen: '1d',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: N.universum,
  einstiegsZeitpunkt: 'schlusskerze',
  ausstiegsZeitpunkt: 'folgeEroeffnung',
  leseFensterKerzen: 61,
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
