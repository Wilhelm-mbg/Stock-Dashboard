'use strict';
/* rsi2seit mit MCP-Stop statt Zeit-Ausstieg.
 *
 * Der MCP-Stop stammt aus dem TradingView-Skript "MCP Stop Strategy [JARUTIR]"
 * (geprueft am 23.08.2026 auf Wilhelms Bitte). Die Regel:
 *     Stop = Kaufkurs + (Hoechstkurs - Kaufkurs) x MCP%
 * Also ein nachziehender Stop, der einen festen ANTEIL DES BISHERIGEN GEWINNS sichert.
 *
 * Das Skript selbst nennt keine Einstiegsregel und keine Ergebniszahlen - beides
 * ehrlich. Es ist damit kein Gegner fuer eine Strategie, sondern eine Alternative
 * zum bestehenden Zeit-Ausstieg. Genau so wird es hier gemessen: dieselben Signale,
 * dieselben Kerzen, nur ein anderer Ausstieg.
 *
 * Vorregistriert: fuenf MCP-Stufen (90/75/50/25/10 %). Jede zaehlt als eigener Test,
 * die Schwelle steigt entsprechend. Erwartung vor der Messung: Der Stop kappt den
 * rechten Schwanz - und bei den Regeln dieses Projekts sitzt der Ertrag genau dort
 * (Kapitulations-Dip: ohne die besten 5 % faellt das Mittel unter die Basislinie).
 * Die Erwartung ist also NEGATIV, und sie wird trotzdem gemessen.
 */
var Q = require('../../../quant.js');
var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };

module.exports = {
  key: 'rsi2seit-mcp',
  grund: 'Gewinne absichern, statt sie zurueckzugeben: Ein nachziehender Stop sichert einen festen Anteil ' +
         'des bisherigen Gewinns. Der Grund ist verhaltensbasiert - nach einem schnellen Anstieg nehmen ' +
         'Marktteilnehmer Gewinne mit, ein Teil des Anstiegs faellt also regelmaessig zurueck.',
  zeitrahmen: '60m',
  haltedauerKerzen: 8,
  richtung: 'long',
  universum: 'aktien',
  kosten: { spanneBp: 5 },
  varianten: [{ mcp: 0.9 }, { mcp: 0.75 }, { mcp: 0.5 }, { mcp: 0.25 }, { mcp: 0.1 }],
  signal: function (bars, i) {
    var s = Q.einstiegSignal(bars, i, P);
    return s && s.dir === 'call' ? { dir: 1 } : null;
  },
  /* Nur das Stop-NIVEAU, berechnet aus abgeschlossenen Kerzen. Die Maschine wendet es
   * auf die naechste Kerze an und bestimmt den Fuellpreis - die Regel kann also weder
   * in die laufende Kerze sehen noch sich einen Wunschkurs geben. */
  stopNiveau: function (abgeschlossen, einKurs, params) {
    var hoch = einKurs;
    for (var k = 0; k < abgeschlossen.length; k++) if (abgeschlossen[k].hoch > hoch) hoch = abgeschlossen[k].hoch;
    if (!(hoch > einKurs)) return null;        // ohne Gewinn kein Stop - sonst loest jeder Ruecksetzer aus
    return einKurs + (hoch - einKurs) * params.mcp;
  },
};
