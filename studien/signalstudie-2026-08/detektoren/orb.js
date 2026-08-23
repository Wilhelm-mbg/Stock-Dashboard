/* Opening-Range-Breakout (ORB) als REINE Funktion.
 * Extrahiert aus depot.js:2612-2631 (Live-Scanner) und quant.js:2549-2561 / 2653-2661
 * (Backtest). Beide bilden die Range aus den SCHLUSSKURSEN (b[1]) der ersten orbMin
 * Minuten des UTC-Tages, nicht aus Hoch/Tief. Signal, sobald ein fertiger Schlusskurs
 * die Range um confirmBps ueberschreitet. Live/Backtest verbrauchen die Tageschance je
 * Richtung nach dem Kauf (D.orb.traded / orbState.traded) - hier ersetzt durch
 * 'nurErster': nur der ERSTE Ausbruch des Tages je Richtung gilt als Signal.
 *
 * bars: [[t, close, vol, high, low], ...]   ci: Index der zu pruefenden (fertigen) Kerze
 * params: { orbMin: 30, confirmBps: 15, minRangeBars: 3, nurErster: true }
 * Rueckgabe: { dir: +1|-1, hi, lo, t0 } | null
 */
'use strict';
var Q = null;
try { Q = require('../../../quant.js'); } catch (e) { /* quant.js ist ein Browser-Modul; wird hier nicht gebraucht */ }

function tagVon(t) { return new Date(t).toISOString().slice(0, 10); }   // UTC-Tag wie depot.js:2427/2614 und quant.js:2501

function orbSignal(bars, ci, params) {
  params = params || {};
  var orbMs = (params.orbMin || 30) * 60000;
  var conf = (params.confirmBps == null ? 15 : params.confirmBps) / 10000;
  var minRangeBars = params.minRangeBars == null ? 3 : params.minRangeBars;  // depot.js:2615/2618 verlangt >= 3
  var nurErster = params.nurErster !== false;
  if (!bars || ci < 0 || ci >= bars.length) return null;
  var tag = tagVon(bars[ci][0]);
  var j0 = ci;
  while (j0 > 0 && tagVon(bars[j0 - 1][0]) === tag) j0--;
  var t0 = bars[j0][0];
  if (bars[ci][0] - t0 < orbMs) return null;                      // Range noch nicht fertig
  var hi = -Infinity, lo = Infinity, nR = 0;
  for (var j = j0; j <= ci && bars[j][0] - t0 < orbMs; j++) {
    if (bars[j][1] > hi) hi = bars[j][1];
    if (bars[j][1] < lo) lo = bars[j][1];
    nR++;
  }
  if (nR < minRangeBars) return null;
  var oben = hi * (1 + conf), unten = lo * (1 - conf);
  var c = bars[ci][1];
  var dir = c > oben ? 1 : (c < unten ? -1 : 0);
  if (!dir) return null;
  if (nurErster) {
    for (var k = j0; k < ci; k++) {
      if (bars[k][0] - t0 < orbMs) continue;
      if (dir === 1 && bars[k][1] > oben) return null;
      if (dir === -1 && bars[k][1] < unten) return null;
    }
  }
  return { dir: dir, hi: hi, lo: lo, t0: t0 };
}

module.exports = { orbSignal: orbSignal, tagVon: tagVon };
