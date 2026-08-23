'use strict';
/* T2 aus der Vorregistrierung 2026-08-23 ("Eigenbau"), 2 von 7 Tests.
 *
 * These: Praemie fuer Sofortigkeit, wenn der Verkaeufer fertig ist.
 *
 * Der heikle Punkt und seine Loesung: Ein Umsatzausschlag mit Kursrueckgang sieht
 * bei einer echten Nachricht genauso aus wie bei reinem Liquiditaetsbedarf. Ohne
 * Nachrichtenquelle braucht es ein anderes Unterscheidungsmerkmal - und es gibt
 * eines, das keine zusaetzlichen Daten kostet: Bei einer Nachricht laeuft der Kurs
 * weiter, bei einem Verkaeufer hoert er auf zu fallen, sobald der fertig ist.
 *
 * Deshalb wird NICHT in den Rueckgang hinein gekauft. Die Ausschlagskerze ist i-1;
 * eingestiegen wird erst in Kerze i, und nur, wenn die nicht weiter verloren hat.
 * Beide Kerzen liegen in der Vergangenheit - kein Vorgriff, sondern schlicht ein
 * spaeterer Einstieg, der auch im Handel so moeglich waere.
 */
var T = require('./tageshilfen.js');

module.exports = {
  key: 't2-umsatzschock',
  testfamilie: {
    name: 'eigenbau-2026-08-23',
    testsGesamt: 7,
    begruendung: 'Drei Thesen mit Zwangsgeschichte, vorregistriert in ' +
                 'VORREGISTRIERUNG-2026-08-23-eigenbau.md vor der ersten Messung.',
  },
  grund: 'Ein Verkaeufer, dessen Position groesser ist als der uebliche Stundenumsatz, MUSS fuer ' +
         'Sofortigkeit zahlen - warten wuerde den Kurs gegen ihn bewegen. Die Signatur ist ein ' +
         'Umsatzausschlag zusammen mit einem Kursrueckgang. Wer die Gegenseite nimmt, kassiert die ' +
         'Praemie fuer Sofortigkeit. Von einer echten Nachricht unterscheidet sich der Fall dadurch, ' +
         'dass der Kurs aufhoert zu fallen, sobald der Verkaeufer fertig ist - deshalb wird erst in ' +
         'der Folgekerze eingestiegen und nur dann, wenn diese nicht weiter verloren hat.',
  zeitrahmen: '60m',
  haltedauerKerzen: 8,
  richtung: 'long',
  universum: 'aktien',
  kosten: { spanneBp: 5 },
  varianten: [{ k: 3 }, { k: 5 }],
  signal: function (bars, i, params) {
    if (i < 2) return null;
    var c = T.X(bars);
    var a = i - 1;                                    // die Ausschlagskerze
    var med = c.volMed[a], sd = c.retSd[a];
    if (!(med > 0) || !(sd > 0)) return null;
    if (!((bars[a][2] || 0) >= params.k * med)) return null;
    var pv = bars[a - 1][1], pa = bars[a][1], pi = bars[i][1];
    if (!(pv > 0) || !(pa > 0) || !(pi > 0)) return null;
    if (!((pa / pv - 1) <= -sd)) return null;         // der Ausschlag ging nach unten
    return (pi / pa - 1) >= 0 ? { dir: 1 } : null;    // und hat aufgehoert
  },
};
