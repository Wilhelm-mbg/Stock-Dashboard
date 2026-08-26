'use strict';
/* ANALYTIKER-PLACEBO mit Einstiegskonvention folgeEroeffnung - Gegenprobe zu #88.
 * Vor der Reparatur (ade84ec) haette der eingebaute Placebo der Maschine hier die
 * mittlere Uebernachtluecke als Schein-Ueberschuss gemessen; nach der Reparatur
 * muss auch dieser Pfad nahe null liegen. Das externe Signal (jede 41. Kerze)
 * prueft denselben Nullpunkt von aussen. */
module.exports = {
  key: 'analytiker-placebo-folgeeroeffnung',
  grund: 'Pruefsignal ohne Kursbezug, Einstieg zur Folgeeroeffnung. Erwartung: Ueberschuss nahe null.',
  zeitrahmen: '60m',
  leseFensterKerzen: 261,
  haltedauerKerzen: 8,
  richtung: 'long',
  universum: 'aktien',
  einstiegsZeitpunkt: 'folgeEroeffnung',
  kosten: { spanneBp: 5 },
  signal: function (bars, i) {
    return (i % 41 === 0) ? { dir: 1 } : null;
  },
};
