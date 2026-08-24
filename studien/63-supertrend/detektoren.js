'use strict';
/* Detektortabelle zu Issue #63 (Supertrend-Regelwerk von Felix).
 * Aufrufform wie studien/signalstudie-2026-08/detektoren/_tabelle.js:
 *   module.exports = [ { key, zeitrahmen, params, signal(bars, i, params) -> {dir:+1|-1}|null } ]
 * Kerzenformat wie im Messgeschirr: [t, close, vol, hoch, tief].
 * Jede Funktion sieht ausschliesslich bars[0..i] - Praefix-Probe in praefix-probe.js.
 */

var WARMUP = 260;          // Vorlauf fuer die rekursiven Baender (ATR 10 / EMA 50 laengst eingeschwungen)
var ATR_N = 10, ATR_F = 2, EMA_N = 50, RSI_N = 14;
var RSI_LONG_MAX = 65, RSI_SHORT_MIN = 35;
var STEIL_N = 20, STEIL_ATR = 1.0;      // Flach-Ausschluss: |EMA50-Aenderung ueber 20 Kerzen| >= 1 x ATR(10)

/* ---------- Bausteine ---------- */

/* Wilder-ATR ueber ein Fenster. Gibt die Reihe zurueck (Index parallel zum Fenster). */
function atrReihe(w, n) {
  var out = new Array(w.length), tr, rma = null, i;
  for (i = 0; i < w.length; i++) {
    if (i === 0) { tr = w[0][3] - w[0][4]; }
    else {
      var pc = w[i - 1][1];
      tr = Math.max(w[i][3] - w[i][4], Math.abs(w[i][3] - pc), Math.abs(w[i][4] - pc));
    }
    if (!(tr >= 0)) tr = 0;
    rma = (rma === null) ? tr : (rma * (n - 1) + tr) / n;
    out[i] = rma;
  }
  return out;
}

/* Supertrend nach der ueblichen Definition (finale Baender mit Gedaechtnis).
 * Liefert je Fensterindex 1 (gruen) oder -1 (rot). */
function supertrendReihe(w, n, f) {
  var atr = atrReihe(w, n);
  var trend = new Array(w.length), fu = null, fl = null, i;
  for (i = 0; i < w.length; i++) {
    var mid = (w[i][3] + w[i][4]) / 2;
    var bu = mid + f * atr[i], bl = mid - f * atr[i];
    if (i === 0) { fu = bu; fl = bl; trend[0] = 1; continue; }
    var pc = w[i - 1][1];
    fu = (bu < fu || pc > fu) ? bu : fu;
    fl = (bl > fl || pc < fl) ? bl : fl;
    var c = w[i][1];
    if (trend[i - 1] === 1) trend[i] = (c < fl) ? -1 : 1;
    else trend[i] = (c > fu) ? 1 : -1;
  }
  return trend;
}

/* Wilder-RSI am Fensterende (wie in Chartprogrammen, nicht der SMA-RSI aus quant.js). */
function rsiWilder(w, n) {
  if (w.length < n + 1) return null;
  var g = 0, l = 0, i, d;
  for (i = 1; i <= n; i++) { d = w[i][1] - w[i - 1][1]; if (d > 0) g += d; else l -= d; }
  g /= n; l /= n;
  for (i = n + 1; i < w.length; i++) {
    d = w[i][1] - w[i - 1][1];
    g = (g * (n - 1) + (d > 0 ? d : 0)) / n;
    l = (l * (n - 1) + (d < 0 ? -d : 0)) / n;
  }
  if (g + l === 0) return 50;
  if (l === 0) return 100;
  return 100 - 100 / (1 + g / l);
}

/* EMA-Reihe ueber die Schlusskurse eines Fensters. */
function emaReihe(w, n) {
  var k = 2 / (n + 1), out = new Array(w.length), prev = w[0][1], i;
  for (i = 0; i < w.length; i++) { prev = i ? w[i][1] * k + prev * (1 - k) : w[0][1]; out[i] = prev; }
  return out;
}

/* ---------- Gemeinsame Auswertung der vier Stufen ---------- */
/* stufe: 'roh' | 'ema' | 'voll' | 'steil' */
function pruefe(bars, i, stufe) {
  if (i < WARMUP) return null;
  if (i >= bars.length) return null;
  var w = bars.slice(i - WARMUP, i + 1);          // nur Vergangenheit bis einschliesslich i
  var e = w.length - 1;

  // Schritt 2: Farbwechsel genau auf der Kerze i
  var tr = supertrendReihe(w, ATR_N, ATR_F);
  if (tr[e] === tr[e - 1]) return null;
  var dir = tr[e];                                 // +1 = rot->gruen, -1 = gruen->rot
  if (stufe === 'roh') return { dir: dir };

  // Schritt 1: Richtungs-Filter EMA 50
  var ema = emaReihe(w, EMA_N);
  var c = w[e][1];
  if (dir > 0 && !(c > ema[e])) return null;
  if (dir < 0 && !(c < ema[e])) return null;
  if (stufe === 'ema') return { dir: dir };

  // Schritt 3: Ueberhitzungs-Schutz RSI 14
  var r = rsiWilder(w, RSI_N);
  if (r === null) return null;
  if (dir > 0 && !(r < RSI_LONG_MAX)) return null;
  if (dir < 0 && !(r > RSI_SHORT_MIN)) return null;
  if (stufe === 'voll') return { dir: dir };

  /* Zusatz-Ausschluss "Seitwaerts-Saege": der EMA 50 muss sich ueber 20 Kerzen um
   * mindestens eine ATR bewegt haben - und zwar in Signalrichtung. ATR-relativ, damit
   * die Schwelle fuer teure wie billige Werte und fuer 5m wie 15m dasselbe bedeutet. */
  var vor = ema[e - STEIL_N];
  if (!(vor > 0)) return null;
  var atrJetzt = atrReihe(w, ATR_N)[e];
  if (!(atrJetzt > 0)) return null;
  var hub = (ema[e] - vor) / atrJetzt;
  if (dir > 0 && !(hub >= STEIL_ATR)) return null;
  if (dir < 0 && !(hub <= -STEIL_ATR)) return null;
  return { dir: dir };
}

module.exports = [
  { key: 'st_roh',   zeitrahmen: ['5m', '15m'], params: {}, signal: function (b, i) { return pruefe(b, i, 'roh'); } },
  { key: 'st_ema',   zeitrahmen: ['5m', '15m'], params: {}, signal: function (b, i) { return pruefe(b, i, 'ema'); } },
  { key: 'st_voll',  zeitrahmen: ['5m', '15m'], params: {}, signal: function (b, i) { return pruefe(b, i, 'voll'); } },
  { key: 'st_steil', zeitrahmen: ['5m', '15m'], params: {}, signal: function (b, i) { return pruefe(b, i, 'steil'); } },
];
module.exports.bausteine = { atrReihe: atrReihe, supertrendReihe: supertrendReihe, rsiWilder: rsiWilder, emaReihe: emaReihe, WARMUP: WARMUP };
