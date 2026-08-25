'use strict';
/* ANALYTIKER-PLACEBO 26.08.2026 - Pruefung B des naechtlichen Prüfkatalogs.
 *
 * Ein Signal OHNE JEDEN KURSBEZUG: es feuert auf jeder 41. Kerze der Reihe,
 * unabhaengig davon, was der Kurs tut. Die richtige Antwort der Maschine ist
 * null: kein Ueberschuss gegen die Kontrolle, keine Signifikanz. Alles andere
 * waere ein Maschinenfehler (Nullpunktverschiebung wie A6).
 *
 * Der Lauf geht NICHT ueber messen.js, damit das Protokoll nie in den
 * Datenordner der App kopiert wird - der Analytiker schreibt nur nach
 * studien/analytiker/. Unabhaengig vom eingebauten Placebo der Maschine
 * (das je Messung mitlaeuft): hier wird die Maschine selbst von aussen
 * gegen einen bekannten Nullfall gehalten.
 *
 * leseFensterKerzen 261 wie bei rsi2seit/kapitulation, damit die Kontrolle
 * dieselbe A7-Aussparung benutzt wie bei den echten Messungen. */
module.exports = {
  key: 'analytiker-placebo',
  grund: 'Pruefsignal ohne Kursbezug. Erwartung: Urteil nicht-entscheidbar/nicht-messbar mit Ueberschuss nahe null.',
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
