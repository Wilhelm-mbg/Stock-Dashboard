'use strict';
/* STATISTIK - Momente einer Zeitreihe mit naiver, Hansen-Hodrick-, Newey-West- und Block-se.
 *
 * HERKUNFT: `momente(paare, L)` ist die WORTGLEICHE Funktion aus
 * studien/vorregistrierung-2026-09-08-trendkanal-tage/auswerten.js (dort mit der Studie abgenommen,
 * Ueberlappungs-Beweis in deren test.js Abschnitt 4). Sie wird hier kopiert statt required, weil jene Datei
 * ein Auswerteskript mit eigenem Hauptlauf ist und der fremde Studienordner nicht angefasst wird.
 * test.js dieser Studie rechnet sie an einem Satz mit BEKANNTER Autokorrelation gegen eine unabhaengige
 * Rechnung nach - eine Kopie ohne eigene Pruefung waere eine Behauptung.
 *
 * paare: [{t, x}] - t ist der KALENDERINDEX (fuer die Autokovarianzen nach Abstand), x der Wert.
 * L: Lag/Blocklaenge. Bei nicht ueberlappenden Reihen L = 1 (dann ist HH = naiv).
 */

function momente(paare, L) {
  var n = paare.length, m = { n: n, mittel: null, sd: null, se: null, seNaiv: null, seHH: null, seNW: null, seBlock: null, nBloecke: 0, nEff: null, hh0: false, t: null, mde: null, obere: null, untere: null };
  if (!n) return m;
  var su = 0, i, j; for (i = 0; i < n; i++) su += paare[i].x;
  m.mittel = su / n;
  if (n < 2) return m;
  var x = new Float64Array(n), q = 0; for (i = 0; i < n; i++) { x[i] = paare[i].x - m.mittel; q += x[i] * x[i]; }
  m.sd = Math.sqrt(q / (n - 1));
  if (m.sd <= 1e-12 * Math.max(1, Math.abs(m.mittel))) m.sd = 0;
  m.seNaiv = m.sd / Math.sqrt(n);
  L = Math.max(1, L || 1);
  var g0 = q / n, gamma = new Float64Array(L + 1);
  for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { var k = paare[j].t - paare[i].t; if (k > L) break; if (k >= 1) gamma[k] += x[i] * x[j]; }
  var lrvHH = g0, lrvNW = g0;
  for (var k2 = 1; k2 <= L; k2++) { var gk = gamma[k2] / n; if (k2 <= L - 1) lrvHH += 2 * gk; lrvNW += 2 * (1 - k2 / (L + 1)) * gk; }
  m.seHH = lrvHH > 0 ? Math.sqrt(lrvHH / n) : null;
  m.seNW = lrvNW > 0 ? Math.sqrt(lrvNW / n) : null;
  var bl = {}; for (i = 0; i < n; i++) { var bId = Math.floor(paare[i].t / L); var e = bl[bId] || (bl[bId] = { s: 0, n: 0 }); e.s += paare[i].x; e.n++; }
  var bm = Object.keys(bl).map(function (kk) { return bl[kk].s / bl[kk].n; }); m.nBloecke = bm.length;
  if (bm.length >= 2) { var mb = 0; bm.forEach(function (v) { mb += v; }); mb /= bm.length; var qb = 0; bm.forEach(function (v) { qb += (v - mb) * (v - mb); }); m.seBlock = Math.sqrt(qb / (bm.length - 1)) / Math.sqrt(bm.length); }
  m.nEff = n / L;
  m.nEffHH = m.seHH > 0 ? n * (m.seNaiv / m.seHH) * (m.seNaiv / m.seHH) : null;
  if (m.seHH != null) m.se = m.seHH; else if (m.seBlock != null) { m.se = m.seBlock; m.hh0 = true; } else m.se = m.seNaiv;
  if (m.sd === 0) { m.se = 0; m.seHH = 0; m.seNW = 0; m.seBlock = 0; }
  m.mde = 2 * m.se; m.obere = m.mittel + 1.96 * m.se; m.untere = m.mittel - 1.96 * m.se;
  m.t = m.se > 0 ? m.mittel / m.se : (m.mittel === 0 ? 0 : null);
  return m;
}

/** Momente einer NICHT ueberlappenden Reihe (Perioden): L = 1, se = naiv, t daneben. */
function periodenMomente(werte) {
  return momente(werte.map(function (x, i) { return { t: i, x: x }; }), 1);
}

/* ---------- Zufall: fest, reproduzierbar (dieselben Funktionen wie in der Minutenstudie) ---------- */
function fnv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

module.exports = { momente: momente, periodenMomente: periodenMomente, fnv: fnv, mulberry32: mulberry32 };
