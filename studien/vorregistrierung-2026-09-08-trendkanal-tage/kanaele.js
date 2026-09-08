'use strict';
/* KANAELE - die drei Kanal-Definitionen, zwei Einstiege und vier Ausstiege als REINE Funktionen auf Tagesarrays
 * (VORREGISTRIERUNG §3-§5, Nachtrag 1).
 *
 * Tagesarray je Reihe (aufsteigend, nur Tage, an denen die Reihe gehandelt wurde):
 *   S = { n, tag: Int32Array (Index in den Kalender der Quelle), o, h, l, c, v: Float64Array,
 *         bars: [[t, c, v, h, l, o], ...]  (App-Format fuer quant.js; wird bei Bedarf gebaut),
 *         nextPos: Int32Array(nTage + POT_MAX_DAUER + 1): erste Balkenposition mit tag >= Kalendertag, -1 wenn keine }
 *
 * Kein Feld eines spaeteren Tages geht in eine Linie am Tag i ein: K1 sieht bars[i-249..i], K2 c[i-39..i],
 * K3 h/l[i-N..i-1]. Einstieg und Ausstieg liegen ausschliesslich auf Eroeffnungen SPAETERER Tage.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var path = require('path');
var K = require('./konfig.js');
var Q = require(path.join(K.REPO, 'quant.js'));

/* ---------- Tagesarray aus Spalten bauen ---------- */
/** Aus Spalten (Zahlenfelder) ein S mit typisierten Feldern und nextPos. tageKalender = Kalenderlaenge (nTage). */
function reiheAus(spalten, nTage) {
  var n = spalten.tag.length, S = { n: n, tag: Int32Array.from(spalten.tag), o: Float64Array.from(spalten.o), h: Float64Array.from(spalten.h),
    l: Float64Array.from(spalten.l), c: Float64Array.from(spalten.c), v: Float64Array.from(spalten.v), bars: null };
  S.nextPos = new Int32Array(nTage + K.POT_MAX_DAUER + 2).fill(-1);
  for (var p = n - 1; p >= 0; p--) { var t = S.tag[p]; if (t >= 0 && t < S.nextPos.length) S.nextPos[t] = p; }
  /* Luecken auffuellen: nextPos[t] = erste Position mit tag >= t */
  var naechste = -1;
  for (var t2 = S.nextPos.length - 1; t2 >= 0; t2--) { if (S.nextPos[t2] >= 0) naechste = S.nextPos[t2]; else S.nextPos[t2] = naechste; }
  return S;
}
/** App-Format [t, c, v, h, l, o] je Tag (t = Kalenderindex als Zahl; kanalSegmente braucht nur die Reihenfolge). */
function barsVon(S, stempel) {
  if (S.bars) return S.bars;
  var b = new Array(S.n);
  for (var i = 0; i < S.n; i++) b[i] = [stempel ? stempel[S.tag[i]] : S.tag[i], S.c[i], S.v[i], S.h[i], S.l[i], S.o[i]];
  S.bars = b;
  return b;
}

/* ---------- K1: der Abschnittskanal der App ---------- */
/** Linie am Tag i: der letzte Abschnitt von Q.kanalSegmente auf den letzten K1.fenster Tageskerzen. */
function k1Am(S, i) {
  var F = K.K1.fenster;
  if (i < F - 1) return null;
  var bars = barsVon(S), win = bars.slice(i - F + 1, i + 1);
  var seg = Q.kanalSegmente(win);
  if (!seg || !seg.length) return null;
  var s = seg[seg.length - 1];
  if (s.bis !== win.length - 1) return null;                           // der Abschnitt muss am rechten Rand enden
  var bO = s.beruehrungenOben, bU = s.beruehrungenUnten;
  return { art: 'K1', oben: s.oben, unten: s.unten, steigung: s.steigung, richtung: s.trend, breite: s.oben - s.unten,
    ausgebaut: s.guete >= K.K1.minGuete && s.n >= K.K1.minTage && Math.min(bO, bU) >= K.K1.minBeruehrungen,
    n: s.n, guete: s.guete, bO: bO, bU: bU, von: i - F + 1 + s.von };
}

/* ---------- K2: Regressionskanal 40 Tage, Linien +-2 sd (Nachtrag 1) ---------- */
/** Regression ueber c[i-N+1..i]: Steigung b, Achse a, sd der Residuen (N-2), R2, t der Steigung. */
function regression(c, i, N) {
  if (i < N - 1) return null;
  var x0 = i - N + 1, sx = 0, sy = 0, sxx = 0, sxy = 0, j, y;
  for (j = 0; j < N; j++) { y = c[x0 + j]; sx += j; sy += y; sxx += j * j; sxy += j * y; }
  var den = N * sxx - sx * sx;
  if (!den) return null;
  var b = (N * sxy - sx * sy) / den, a = (sy - b * sx) / N, mean = sy / N, ssRes = 0, ssTot = 0;
  for (j = 0; j < N; j++) { var r = c[x0 + j] - (a + b * j); ssRes += r * r; var dm = c[x0 + j] - mean; ssTot += dm * dm; }
  var sd = Math.sqrt(ssRes / Math.max(1, N - 2));
  var r2 = ssTot > 1e-12 ? Math.max(0, 1 - ssRes / ssTot) : 0;
  var sxxC = sxx - sx * sx / N, seB = Math.sqrt((ssRes / Math.max(1, N - 2)) / Math.max(1e-12, sxxC));
  var t = seB > 0 ? b / seB : 0;
  return { a: a, b: b, sd: sd, r2: r2, t: t, mid: a + b * (N - 1), N: N };
}
function k2Am(S, i) {
  var g = regression(S.c, i, K.K2.N);
  if (!g || !(g.mid > 0) || !(g.sd > 0)) return null;
  var oben = g.mid + K.K2.sdFaktor * g.sd, unten = g.mid - K.K2.sdFaktor * g.sd;
  return { art: 'K2', oben: oben, unten: unten, steigung: g.b, richtung: g.b > 0 ? 'auf' : g.b < 0 ? 'ab' : 'seit', breite: oben - unten,
    ausgebaut: g.r2 >= K.K2.r2Min && Math.abs(g.t) >= K.K2.tMin, r2: g.r2, t: g.t, sd: g.sd };
}

/* ---------- K3: Donchian N (nachlaufend) ---------- */
/** oben/unten fuer alle Tage: max h / min l ueber i-N..i-1 (ohne den aktuellen Tag), NaN wo der Vorlauf fehlt. */
function k3Reihe(S, N) {
  var n = S.n, oben = new Float64Array(n).fill(NaN), unten = new Float64Array(n).fill(NaN);
  for (var i = N; i < n; i++) {
    var mx = -Infinity, mn = Infinity;
    for (var j = i - N; j < i; j++) { if (S.h[j] > mx) mx = S.h[j]; if (S.l[j] < mn) mn = S.l[j]; }
    oben[i] = mx; unten[i] = mn;
  }
  return { N: N, oben: oben, unten: unten, halb: Math.ceil(N / 2) };
}
function k3Am(S, i, D) {
  var N = D.N, halb = D.halb;
  if (i < N + halb) return null;                                          // Mindestvorlauf N + ceil(N/2) (§3)
  var oben = D.oben[i], unten = D.unten[i], obenAlt = D.oben[i - halb], untenAlt = D.unten[i - halb];
  if (!(oben > 0) || !(unten > 0) || !(obenAlt > 0) || !(untenAlt > 0)) return null;
  var richtung = (oben > obenAlt && unten > untenAlt) ? 'auf' : (oben < obenAlt && unten < untenAlt) ? 'ab' : 'seit';
  return { art: 'K3', oben: oben, unten: unten, steigung: null, richtung: richtung, breite: oben - unten, ausgebaut: true, N: N };
}

/** Linie einer Definition am Tag i. D = Vorrechnung der Reihe (k3Reihe fuer K3, sonst null). */
function linieAm(S, i, LIN, D) {
  if (LIN.art === 'K1') return k1Am(S, i);
  if (LIN.art === 'K2') return k2Am(S, i);
  return k3Am(S, i, D);
}
/** Linienlage am Tag j > i, fortgeschrieben (§3): K1/K2 linear je Balken, K3 nachlaufend aus D. */
function linieSpaeter(lin, i, j, D) {
  if (lin.art === 'K3') return { oben: D.oben[j], unten: D.unten[j] };
  return { oben: lin.oben + lin.steigung * (j - i), unten: lin.unten + lin.steigung * (j - i) };
}

/* ---------- Einstiege (§4) ---------- */
/** E1 Ausbruch am Tag i: +1 Long (Kanal auf/seit, C > oben), -1 Short (Kanal ab/seit, C < unten), 0 sonst. */
function e1Signal(lin, ci) {
  if (!lin || !lin.ausgebaut) return 0;
  var conf = lin.art === 'K3' ? K.K3.confirmBps / 10000 : 0;
  if (lin.richtung !== 'ab' && ci > lin.oben * (1 + conf)) return 1;
  if (lin.richtung !== 'auf' && ci < lin.unten * (1 - conf)) return -1;
  return 0;
}
/** E1 Bestaetigung am Tag i+1 gegen die fortgeschriebene Linie des Signaltags (K3: dieselbe Linie). */
function e1Bestaetigt(lin, i, cNext, dir, D) {
  var L2 = lin.art === 'K3' ? { oben: lin.oben, unten: lin.unten } : linieSpaeter(lin, i, i + 1, D);
  return dir > 0 ? cNext > L2.oben : cNext < L2.unten;
}
/** E2 Ruecklauf am Tag i: +1 im Aufwaertskanal (C beruehrt unten im Band 0,15*breite, ohne Durchbruch), -1 spiegelbildlich. */
function e2Signal(lin, ci) {
  if (!lin || !lin.ausgebaut || !(lin.breite > 0)) return 0;
  var tol = K.TOUCH * lin.breite;
  if (lin.richtung === 'auf' && ci <= lin.unten + tol && ci > lin.unten - tol) return 1;
  if (lin.richtung === 'ab' && ci >= lin.oben - tol && ci < lin.oben + tol) return -1;
  return 0;
}

/* ---------- Ausstiege (§5) ---------- */
/** Position des Ausstiegs bei fester Haltedauer h: erster Balken mit Kalendertag >= tag[ePos] + h; -1 wenn die Reihe vorher endet. */
function festAusstieg(S, ePos, h) {
  var ziel = S.tag[ePos] + h;
  if (ziel >= S.nextPos.length) return -1;
  return S.nextPos[ziel];
}
/** Kanalbruch (Long: C_j < unten_j; Short: C_j > oben_j) ab ePos, Ausstieg am Folgetag, Kappung bei max Tagen.
 *  Rueckgabe { pos, gebrochen, bruchPos } mit pos = -1, wenn die Reihe vor dem Ausstieg endet (Delisting/Zensur beim Aufrufer). */
function bruchAusstieg(S, i, ePos, dir, lin, D, maxTage) {
  var kappTag = S.tag[ePos] + maxTage;
  for (var j = ePos; j < S.n; j++) {
    if (S.tag[j] >= kappTag) return { pos: j, gebrochen: false, bruchPos: -1 };
    var L2 = linieSpaeter(lin, i, j, D);
    var bruch = dir > 0 ? (L2.unten === L2.unten && S.c[j] < L2.unten) : (L2.oben === L2.oben && S.c[j] > L2.oben);
    if (bruch) return { pos: j + 1 < S.n ? j + 1 : -1, gebrochen: true, bruchPos: j };
  }
  return { pos: -1, gebrochen: false, bruchPos: -1 };
}

/* ---------- Ertrag mit Delisting-/Zensur-Regel (§5) ---------- */
/** Ertrag eines Long-Trades O[ePos] -> O[ausPos]; ausPos = -1: Reihe endet vorher -> nicht lebend: letzter Schluss
 *  (delist = true), lebend: keine Beobachtung (NaN). Rueckgabe { r (Long, Pp), dauer (Kalender-Handelstage), delist, ausPos }. */
function ertragLong(S, ePos, ausPos, lebend) {
  var ein = S.o[ePos];
  if (!(ein > 0)) return null;
  if (ausPos >= 0) {
    var aus = S.o[ausPos];
    if (!(aus > 0)) return null;
    return { r: (aus - ein) / ein * 100, dauer: S.tag[ausPos] - S.tag[ePos], delist: false, ausPos: ausPos };
  }
  if (lebend) return null;                                                // rechtszensiert: die Reihe lebt, das Fenster endet
  var letzt = S.n - 1, cl = S.c[letzt];
  if (!(cl > 0) || letzt < ePos) return null;
  return { r: (cl - ein) / ein * 100, dauer: Math.max(0, S.tag[letzt] - S.tag[ePos]), delist: true, ausPos: letzt };
}

module.exports = { reiheAus: reiheAus, barsVon: barsVon, k1Am: k1Am, k2Am: k2Am, regression: regression, k3Reihe: k3Reihe, k3Am: k3Am,
  linieAm: linieAm, linieSpaeter: linieSpaeter, e1Signal: e1Signal, e1Bestaetigt: e1Bestaetigt, e2Signal: e2Signal,
  festAusstieg: festAusstieg, bruchAusstieg: bruchAusstieg, ertragLong: ertragLong };
