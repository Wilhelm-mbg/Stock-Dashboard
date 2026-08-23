'use strict';
/* Die bisher als "belegt" gefuehrte Intraday-Kante - als erste Strategie durch die
 * Messmaschine, damit sich pruefen laesst, ob die Maschine dasselbe sagt wie die
 * Messungen vom 23.08.2026 (je Signal +0,0115 Pp, t 0,14 - nicht entscheidbar). */
var Q = require('../../../quant.js');
var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };
module.exports = {
  key: 'rsi2seit',
  grund: 'RSI(2) kauft kurzfristige Uebertreibung und braucht die Rueckkehr zur Mitte. Die gibt es nur, ' +
         'wo eine Mitte existiert - im Seitwaertskanal. Der Kanal liefert die Erlaubnis, nicht die Richtung.',
  /* A7: EMA100 und Kanal 200 in quant.js - der Vorlauf der Maschine.
   * Die Kontrolle laesst diese Kerzen aus, damit sie nichts enthaelt, was das
   * Signal gelesen hat - sonst entsteht die Nullpunktverschiebung A6. */
  leseFensterKerzen: 261,
  zeitrahmen: '60m',
  haltedauerKerzen: 8,
  richtung: 'long',
  universum: 'aktien',
  kosten: { spanneBp: 5 },
  params: P,
  signal: function (bars, i, params) {
    var s = Q.einstiegSignal(bars, i, params || P);
    return s && s.dir === 'call' ? { dir: 1 } : null;
  },
};
