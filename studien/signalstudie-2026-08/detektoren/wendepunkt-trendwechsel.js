/* Detektor 'wendepunkt-trendwechsel' (Felix #33/#35) als reine Funktion fuer das
 * Messgeschirr der Signalstudie 2026-08.
 *
 * Quelle der Logik: quant.js trendwechsel() (Zeile 2357-2389), wendepunkte() (2111),
 * kanalUeber() (2134). Q.trendwechsel urteilt immer an der LETZTEN Kerze der
 * uebergebenen Reihe - fuer die Studie wird deshalb der Aufruf auf bars[0..ci]
 * abgebildet.
 *
 * Zwei Varianten, beide ohne versteckten Zustand:
 *   signalPraefix(bars, ci, p)  - Referenz: Q.trendwechsel(bars.slice(0, ci+1)).
 *                                 Langsam (Wendepunkte je Aufruf neu), aber
 *                                 per Konstruktion walk-forward.
 *   signal(bars, ci, p)         - schnell: Wendepunkte einmal auf der ganzen
 *                                 Reihe, je ci nur die bestaetigten (i+F <= ci)
 *                                 verwendet. Die Praefix-Probe prueft, dass
 *                                 beide identisch sind.
 *
 * Rueckgabe: { dir: +1 | -1 } oder null.  (+1 = call/long, -1 = put/short)
 *
 * Hinweis zur Haeufigkeit: Q.trendwechsel ist ein Zustands-Schnappschuss und
 * meldet an JEDER Kerze, an der die Bedingung steht - also Cluster von
 * Folgekerzen. Die Studie #33 (hauptstudie.js detect()) feuerte dagegen einmal
 * je Abschnitt (sectionDone) plus Cooldown 60. Mit p.ersteImAbschnitt = true
 * liefert signal() nur die ERSTE Kerze je Abschnitt (Abschnitt = letzter
 * bestaetigter Wendepunkt); das ist weiterhin rein, weil nur bars[0..ci]
 * angesehen wird.
 */
'use strict';
var Q = require('../../../quant.js');

var LIVE = { S: 1.0, F: 5 };   // depot.js 1091-1093 / index.html 924-938: 1m, Schwelle 1,0, Bestaetigung 5

function wnk(k) { return k.steigung * k.n / k.breite; }

/* Referenzvariante: exakt der App-Aufruf auf dem Praefix. */
function signalPraefix(bars, ci, p) {
  p = p || LIVE;
  var w = Q.trendwechsel(bars.slice(0, ci + 1), { schwelle: p.S, bestaetigung: p.F });
  if (!w || !w.signal) return null;
  return { dir: w.signal.dir === 'call' ? 1 : -1 };
}

/* Kern: Urteil an Kerze ci mit einer vorab berechneten, sortierten Liste aller
 * Wendepunkt-Indizes der ganzen Reihe. Walk-forward, weil ein Wendepunkt bei i
 * nur bars[i-F..i+F] ansieht und erst ab ci >= i+F verwendet wird. */
function urteil(bars, ci, p, alleWp) {
  var F = p.F || 5, S = p.S != null ? p.S : 1.0, MIN_JUNG = 10;
  if (ci + 1 < 40) return null;
  var C = [];
  for (var q = 0; q < alleWp.length; q++) { if (alleWp[q] + F <= ci) C.push(alleWp[q]); else break; }
  if (C.length < 2) return null;
  var wLetzt = C[C.length - 1], wVor = C[C.length - 2];
  var kAlt = Q.kanalUeber(bars, wVor, wLetzt);
  var winkelAlt = (kAlt && kAlt.breite > 0) ? wnk(kAlt) : 0;
  if (ci - wLetzt < MIN_JUNG) return null;
  var kNeu = Q.kanalUeber(bars, wLetzt, ci);
  if (!kNeu || !(kNeu.breite > 0)) return null;
  var wn = wnk(kNeu);
  if (Math.abs(winkelAlt) >= 0.5 && Math.abs(wn) >= S && Math.sign(wn) !== Math.sign(winkelAlt)) {
    return { dir: wn > 0 ? 1 : -1, wLetzt: wLetzt };
  }
  return null;
}

function wendepunktListe(bars, F) {
  var wp = Q.wendepunkte(bars, F);
  return wp.hoch.concat(wp.tief).map(function (w) { return w.i; }).sort(function (a, b) { return a - b; });
}

/* Schnelle Variante. Optional p.ersteImAbschnitt: nur die erste Signalkerze je
 * Abschnitt (wie die Studie #33), sonst jede Kerze mit stehender Bedingung. */
function signal(bars, ci, p) {
  p = p || LIVE;
  var alle = (p._wp && p._wp.bars === bars && p._wp.F === (p.F || 5)) ? p._wp.liste : wendepunktListe(bars, p.F || 5);
  var u = urteil(bars, ci, p, alle);
  if (!u) return null;
  if (p.ersteImAbschnitt) {
    // Stand die Bedingung schon an einer frueheren Kerze desselben Abschnitts
    // (gleicher letzter Wendepunkt)? Dann hat die Studie dort gefeuert und den
    // Abschnitt geschlossen (sectionDone). Nur bars[0..ci-1] werden angesehen.
    for (var j = u.wLetzt + 10; j < ci; j++) {
      var v = urteil(bars, j, p, alle);
      if (v && v.wLetzt === u.wLetzt) return null;
    }
  }
  return { dir: u.dir };
}

/* Wendepunkte einmal vorbereiten (Caching OHNE Zustand im Detektor: der Aufrufer
 * haelt das Objekt und gibt es als p._wp mit). */
function vorbereiten(bars, p) {
  p = p || LIVE;
  return { bars: bars, F: p.F || 5, liste: wendepunktListe(bars, p.F || 5) };
}

module.exports = { signal: signal, signalPraefix: signalPraefix, vorbereiten: vorbereiten, LIVE: LIVE };
