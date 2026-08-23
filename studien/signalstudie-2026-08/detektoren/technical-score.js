/* Technik-Score als reine Funktion fuer die Signalstudie.
 * Quelle: quant.js:220 technical(pts, endI) -> {score, parts}. Keine Eingabe ausser Schlusskursen.
 * Live (depot.js:1908): Q.technical(hist) auf der Tagesserie (getHistory '2y', ~500 Kerzen), endI = letzte.
 * Messgeschirr (messgeschirr.js:173-175): Fenster min(i+1, 300) Kerzen des Symbol-Intervalls, endI = letzte. */
'use strict';
var Q = require('../../../quant.js');

var DEFAULTS = { fenster: 300, schwelle: 0.35 };   // schwelle = OPEN_THR depot.js:8 (nur-Technik-Gewicht)

/** Roh-Score in [-1, 1] oder null (unter 56 Kerzen). Nur bars[0..i]. */
function score(bars, i, params) {
  var p = Object.assign({}, DEFAULTS, params || {});
  var von = p.fenster ? Math.max(0, i + 1 - p.fenster) : 0;
  if (i - von < 55) return null;
  var pts = bars.slice(von, i + 1);
  return Q.technical(pts, pts.length - 1).score;
}

/** Richtungssignal wie die Stunden-Strategie mit 100 % Technik: |score| >= schwelle. */
function signal(bars, i, params) {
  var p = Object.assign({}, DEFAULTS, params || {});
  var s = score(bars, i, p);
  if (s === null || Math.abs(s) < p.schwelle) return null;
  return { dir: s > 0 ? 1 : -1, score: s };
}

module.exports = { score: score, signal: signal, DEFAULTS: DEFAULTS };
