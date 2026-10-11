'use strict';
/* VERKNUEPFUNG - V1 gleiche SIC-Gruppe auf drei Stellen, V2 die 5 hoechsten Residuen-Korrelationen ueber 250 Handelstage am letzten
 * Handelstag des Vormonats (Regel "Verknuepfung", Z3, Z9). Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var KN = require('./konfig.js');

/** V1: SIC3 je Reihe (null = keine) und Gruppen (sic3 -> Int32Array der Reihen). */
function v1(T, cik, firmen) {
  var sic3 = new Array(T.nSym).fill(null), gruppen = new Map(), id = new Int32Array(T.nSym).fill(-1), namen = [];
  for (var s = 0; s < T.nSym; s++) {
    if (!cik[s]) continue;
    var f = firmen.get(cik[s]); if (!f || !f.sic3) continue;
    sic3[s] = f.sic3;
    var l = gruppen.get(f.sic3); if (!l) { l = []; gruppen.set(f.sic3, l); namen.push(f.sic3); }
    l.push(s);
  }
  var gr = new Map(); gruppen.forEach(function (l, k) { gr.set(k, Int32Array.from(l)); });
  namen.sort(); var gIdx = {}; namen.forEach(function (k, i) { gIdx[k] = i; });
  for (var s2 = 0; s2 < T.nSym; s2++) if (sic3[s2]) id[s2] = gIdx[sic3[s2]];
  return { sic3: sic3, gruppen: gr, gruppeId: id, gruppenNamen: namen };
}

/** Stichtag c je Tag D (Z9): letzter Handelstag des Kalenders VOR dem Monat von D; -1, wenn keiner. */
function stichtag(tage, D) {
  var m = tage[D].slice(0, 7);
  for (var i = D; i >= 0; i--) if (tage[i].slice(0, 7) !== m) return i;
  return -1;
}

/**
 * V2 fuer einen Stichtag c: Int32Array(nSym * 5) der Partner (-1 = frei), nach Korrelation absteigend.
 * cik je Reihe (gleiche CIK nie Partner, Z3). nur: optionale Teilmenge. Rueckgabe { top, korr, zaehler }.
 */
function v2(T, c, cik, nur) {
  var g = T.g, W = KN.V2_FENSTER, MIN = KN.V2_MIN, TOP = KN.V2_TOP, nS = T.nSym, spy = T.symIdx.SPY;
  var von = c - W + 1, z = { reihen: 0, kandidaten: 0, vollstaendig: 0, paare: 0 };
  var top = new Int32Array(nS * TOP).fill(-1), korr = new Float64Array(nS * TOP).fill(-Infinity);
  if (von < 0) return { top: top, korr: korr, zaehler: z };
  var rs = new Float64Array(W).fill(NaN);
  for (var w = 0; w < W; w++) { var zs = T.zeileVon(spy, von + w); if (zs >= 0) rs[w] = g.rendite[zs]; }
  var liste = [], X = [], Mk = [], voll = [], istKand = [];
  var x = new Float64Array(W), m = new Uint8Array(W);
  for (var s = 0; s < nS; s++) {
    if (s === spy || (nur && !nur[s]) || T.stand.symbole[s].referenz) continue;
    var a = T.symStart[s], b = T.symStart[s + 1]; if (a === b) continue;
    /* letzte Zeile mit Tag <= c (binaer) */
    var lo = a, hi = b; while (lo < hi) { var mid = (lo + hi) >> 1; if (g.tag[T.symZeilen[mid]] <= c) lo = mid + 1; else hi = mid; }
    if (lo === a) continue;
    x.fill(0); m.fill(0);
    var n = 0, sr = 0, ss = 0, srr = 0, srs = 0, sss = 0, rowC = -1;
    for (var q = lo - 1; q >= a; q--) {
      var zr = T.symZeilen[q], t = g.tag[zr]; if (t < von) break;
      if (t === c) rowC = zr;
      var r = g.rendite[zr], sp = rs[t - von];
      if (!(r === r) || !(sp === sp)) continue;
      x[t - von] = r; m[t - von] = 1; n++; sr += r; ss += sp; srr += r * r; srs += r * sp; sss += sp * sp;
    }
    if (n < MIN) continue;
    var vs = sss - ss * ss / n, beta = vs > 0 ? (srs - sr * ss / n) / vs : 0;
    var xr = new Float64Array(W), mm = new Uint8Array(W), su = 0, sq = 0;
    for (var w2 = 0; w2 < W; w2++) if (m[w2]) { var e = x[w2] - beta * rs[w2]; xr[w2] = e; mm[w2] = 1; su += e; sq += e * e; }
    var kand = rowC >= 0 && g.klasse[rowC] >= 0 && g.klasse[rowC] <= 3;
    z.reihen++; if (kand) z.kandidaten++;
    if (n === W) {
      /* vollstaendig: standardisiert, Korrelation = Skalarprodukt */
      var mu = su / n, nq = Math.sqrt(Math.max(0, sq - su * su / n));
      if (nq > 0) for (var w3 = 0; w3 < W; w3++) xr[w3] = (xr[w3] - mu) / nq;
      z.vollstaendig++;
      voll.push(nq > 0);
    } else voll.push(false);
    liste.push(s); X.push(xr); Mk.push(n === W ? null : mm); istKand.push(kand);
  }
  var N = liste.length;
  function eintragen(i, j, r) {
    var b0 = liste[i] * TOP;
    if (!(r > korr[b0 + TOP - 1])) return;
    var p = TOP - 1; while (p > 0 && r > korr[b0 + p - 1]) { korr[b0 + p] = korr[b0 + p - 1]; top[b0 + p] = top[b0 + p - 1]; p--; }
    korr[b0 + p] = r; top[b0 + p] = liste[j];
  }
  for (var i = 0; i < N; i++) {
    var xi = X[i], mi = Mk[i], ci = cik[liste[i]];
    for (var j = i + 1; j < N; j++) {
      if (!istKand[i] && !istKand[j]) continue;
      var cj = cik[liste[j]]; if (ci && cj && ci === cj) continue;
      var xj = X[j], mj = Mk[j], r2;
      if (!mi && !mj) {
        if (!voll[i] || !voll[j]) continue;
        var d = 0; for (var t2 = 0; t2 < W; t2++) d += xi[t2] * xj[t2];
        r2 = d;
      } else {
        /* mindestens eine unvollstaendig: genau ueber die gemeinsamen Tage (die Standardisierung der vollstaendigen ist affin, die Korrelation bleibt gleich) */
        var ai = mi ? xi : null, aj = mj ? xj : null;
        var nn = 0, sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0;
        for (var t3 = 0; t3 < W; t3++) {
          if ((mi && !mi[t3]) || (mj && !mj[t3])) continue;
          var u = ai ? ai[t3] : xi[t3], v = aj ? aj[t3] : xj[t3];
          nn++; sx += u; sy += v; sxx += u * u; syy += v * v; sxy += u * v;
        }
        if (nn < MIN) continue;
        var den = (sxx - sx * sx / nn) * (syy - sy * sy / nn);
        if (!(den > 0)) continue;
        r2 = (sxy - sx * sy / nn) / Math.sqrt(den);
      }
      z.paare++;
      if (istKand[j]) eintragen(i, j, r2);
      if (istKand[i]) eintragen(j, i, r2);
    }
  }
  return { top: top, korr: korr, zaehler: z };
}

module.exports = { v1: v1, stichtag: stichtag, v2: v2 };
