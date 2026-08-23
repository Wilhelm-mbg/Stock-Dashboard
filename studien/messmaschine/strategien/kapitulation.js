'use strict';
/* KAPITULATIONS-DIP - die einzige Kante, die das Depot handelt und die mit dieser
 * Maschine nie gemessen wurde. Vorregistriert in
 * VORREGISTRIERUNG-2026-08-24-kapitulation.md vor der ersten Messung.
 *
 * D1 (Gemessenes = Implementiertes): Der Auslöser kommt aus quant.js selbst, nicht
 * aus einer Nachbildung. Die Parameter sind EXAKT die des Live-Aufrufs in
 * depot.js:3550 mit dem gespeicherten Zustand:
 *
 *   ENTRY 'kapitulation', LINE 'ema', period 20, confirmBps 15
 *   ZTHR = zOf(15) = 2.0      <- NICHT 1.5. Fuer kapitulation entscheidend, weil
 *                                reversionSignal() den Wert benutzt; bei rsi2seit
 *                                geht ZTHR gar nicht in den Ausloeser ein.
 *   Haltedauer 26 Kerzen      <- depot.js:3835 maxHoldMin 1560 bei 60m-Kerzen,
 *                                gezaehlt in FERTIGEN Kerzen (depot.js:3397-3407),
 *                                nicht in Wanduhrzeit.
 *   Vorlauf 261 Kerzen        <- depot.js:3355, identisch zur Maschine.
 *
 * Die beiden Tore (Liquiditaet, Regime) sind KEINE Signale, sondern Bedingungen des
 * Live-Pfads. Sie stehen als Varianten drin, damit sichtbar wird, was sie beitragen.
 */
var fs = require('fs');
var path = require('path');
var Q = require('../../../quant.js');

/* Exakt der Live-Aufruf. */
var P = { ENTRY: 'kapitulation', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };

/* ---------- Liquiditaet: nachlaufend, nicht ueber das ganze Fenster ----------
 * Live rechnet dollarVolDay ueber die GANZE geholte Reihe (depot.js:3157). Fuer ein
 * historisches Signal waere das ein Blick nach vorn. Hier: Durchschnitt der letzten
 * 20 Handelstage VOR der Signalkerze. Die Messung ist damit strenger als die App. */
var VOL_SPEICHER = new WeakMap();
function dollarVolNachlaufend(bars, i, tage) {
  var c = VOL_SPEICHER.get(bars);
  if (!c) {
    /* Tagesumsatz je Handelstag einmal aufbauen, plus fuer jede Kerze die Nummer
     * ihres Tages - damit die Abfrage O(1) bleibt. */
    var tagVon = [], tagSumme = [], tagIdx = new Int32Array(bars.length);
    var letzter = null, nr = -1;
    for (var k = 0; k < bars.length; k++) {
      var d = new Date(bars[k][0]);
      var tg = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
      if (tg !== letzter) { letzter = tg; nr++; tagVon.push(tg); tagSumme.push(0); }
      tagIdx[k] = nr;
      tagSumme[nr] += (bars[k][1] || 0) * (bars[k][2] || 0);
    }
    c = { tagIdx: tagIdx, tagSumme: tagSumme };
    VOL_SPEICHER.set(bars, c);
  }
  var n = c.tagIdx[i];
  if (n < tage) return null;
  var s = 0;
  for (var q = n - tage; q < n; q++) s += c.tagSumme[q];   // der eigene Tag zaehlt nicht mit
  return s / tage;
}

/* ---------- Regime: NACHBILDUNG, ausdruecklich ----------
 * Live: SPY 60m gegen EMA200 der Stundenkerzen (depot.js: spyTrendAuf). SPY liegt
 * nicht im 60m-Archiv. Nachgebildet ueber die Tages-Marktreihe des Drift-Moduls mit
 * EMA29 - 200 Stundenkerzen sind rund 28,6 Handelstage. Das trifft die Live-
 * Bedingung NICHT exakt und steht deshalb als Nachbildung im Protokoll. */
var MARKT = null;
function marktLadeEinmal() {
  if (MARKT !== null) return MARKT;
  MARKT = false;
  try {
    var p = path.join(process.env.APPDATA || '', 'Markt-Dashboard', 'store', 'drift_markt.json');
    var r = JSON.parse(fs.readFileSync(p, 'utf8')).reihe;
    if (!Array.isArray(r) || r.length < 300) return MARKT;
    var k = 2 / (29 + 1), ema = r[0][1], tage = [], ueber = [];
    for (var q = 0; q < r.length; q++) {
      ema = r[q][1] * k + ema * (1 - k);
      tage.push(r[q][0]);
      ueber.push(r[q][1] > ema);      // true = Markt UEBER der Linie -> Kapitulation pausiert
    }
    MARKT = { tage: tage, ueber: ueber };
  } catch (e) { MARKT = false; }
  return MARKT;
}
function marktUeberLinie(ms) {
  var M = marktLadeEinmal();
  if (!M) return null;                 // ohne Anker laesst die Regel durch (Live-Verhalten)
  var lo = 0, hi = M.tage.length;      // letzter Tag STRENG vor dem Signal
  while (lo < hi) { var m = (lo + hi) >> 1; if (M.tage[m] < ms) lo = m + 1; else hi = m; }
  return lo > 0 ? M.ueber[lo - 1] : null;
}

module.exports = {
  key: 'kapitulation',
  testfamilie: {
    name: 'kapitulation-2026-08-24',
    testsGesamt: 3,
    begruendung: 'Drei Tests, vorregistriert in VORREGISTRIERUNG-2026-08-24-kapitulation.md ' +
                 'vor der ersten Messung: Ausloeser allein, plus Liquiditaet, plus Regime-Tor.',
  },
  grund: 'Ueberdehnung UNTER die Leitlinie IM Abwaertskanal, mit Volumenbestaetigung. Wer nach einem ' +
         'Abverkauf im fallenden Kanal noch verkauft, verkauft meist nicht wegen einer Nachricht, ' +
         'sondern weil er MUSS - Nachschussforderungen, Risikolimits, Stop-Kaskaden treffen zusammen. ' +
         'Die Volumenbestaetigung trennt den erzwungenen Verkauf vom stillen Abrutschen: Zwang erzeugt ' +
         'Umsatz. Wer die Gegenseite nimmt, stellt Kapital bereit, wenn es sonst niemand stellt, und ' +
         'haelt lange genug, dass die Erholung Zeit hat.',
  zeitrahmen: '60m',
  /* A7: quant.js liest fuer diesen Ausloeser bis zu 261 Kerzen zurueck (Kanal 200,
   * EMA20 im 260er-Fenster, Umsatzmittel ueber 50). Die Kontrolle laesst sie aus. */
  leseFensterKerzen: 261,
  haltedauerKerzen: 26,
  richtung: 'long',
  universum: 'aktien',
  kosten: { spanneBp: 5 },
  varianten: [
    { liquiditaet: false, regime: false },
    { liquiditaet: true, regime: false },
    { liquiditaet: true, regime: true },
  ],
  signal: function (bars, i, params) {
    if (params.liquiditaet) {
      var dv = dollarVolNachlaufend(bars, i, 20);
      if (dv == null || dv < 50e6) return null;
    }
    if (params.regime && marktUeberLinie(bars[i][0]) === true) return null;
    var s = null;
    try { s = Q.einstiegSignal(bars, i, P); } catch (e) { return null; }
    return s && s.dir === 'call' ? { dir: 1 } : null;
  },
};
