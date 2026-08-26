'use strict';
/* ANALYTIKER-PLACEBO, dritter Lauf 26.08.2026 - Pruefung B.
 * Identisch zum Placebo des ersten Laufs (jede 41. Kerze, kein Kursbezug),
 * damit die Zahlen vergleichbar sind. Neu ist die Umgebung, nicht das Signal:
 * Archiv nach #85 gereinigt (2.841 Teilkerzen entfernt), Maschine 1.1.0
 * (#86/#87/#88). Richtige Antwort weiterhin: Ueberschuss ~ null. */
module.exports = {
  key: 'analytiker-placebo',
  grund: 'Pruefsignal ohne Kursbezug. Erwartung: Ueberschuss nahe null, keine Signifikanz.',
  zeitrahmen: '60m',
  leseFensterKerzen: 261,
  haltedauerKerzen: 8,
  richtung: 'long',
  universum: 'aktien',
  kosten: { spanneBp: 5 },
  signal: function (bars, i) {
    return (i % 41 === 0) ? { dir: 1 } : null;
  },
};
