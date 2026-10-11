'use strict';
/* MERKMALE je Zeile und je Tag: Ertragsfenster (Z5), Rohausloeser E1/E2 (Z7), 2.02-Reaktionstage und E3 (Z7), Zulaessigkeit (Z4).
 * Alles rechnet je Reihe nur mit Zeilen bis zum betrachteten Tag (Blick nach vorn: nur der Eroeffnungskurs des Einstiegstags,
 * und den prueft der Universumsfilter). Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var KN = require('./konfig.js');
var ED = require('./edgar.js');
var LS = require('./lesen.js');

/* Bits je Zeile */
var B_E1AUF = 1, B_E1AB = 2, B_E2AUF = 4, B_E2AB = 8, B_E3AUF = 16, B_E3AB = 32, B_202 = 64;
/** Bit des Rohausloesers fuer Ausloeser a (0 E1, 1 E2, 2 E3) und Richtung r (0 auf, 1 ab). */
function bit(a, r) { return [[B_E1AUF, B_E1AB], [B_E2AUF, B_E2AB], [B_E3AUF, B_E3AB]][a][r]; }

/** Kumulierte Log-Renditen je Reihe (L) und Zaehler nicht endlicher Renditen (NN), damit jedes Fenster O(1) kostet. */
function kumuliert(T) {
  var g = T.g, L = new Float64Array(g.n), NN = new Int32Array(g.n);
  for (var s = 0; s < T.nSym; s++) {
    var l = 0, nn = 0;
    for (var q = T.symStart[s]; q < T.symStart[s + 1]; q++) {
      var z = T.symZeilen[q], r = g.rendite[z];
      if (r === r && r > -100) l += Math.log(1 + r / 100); else nn++;
      L[z] = l; NN[z] = nn;
    }
  }
  return { L: L, NN: NN };
}

/** Ertrag in Pp von der Eroeffnung der Zeile re bis zum Schluss der Zeile rx (rx >= re, dieselbe Reihe); NaN, wenn ungueltig. */
function ertrag(T, M, re, rx) {
  var oc = T.g.renditeOC[re];
  if (!(oc === oc) || M.NN[rx] - M.NN[re] > 0) return NaN;
  return 100 * ((1 + oc / 100) * Math.exp(M.L[rx] - M.L[re]) - 1);
}

/** Rohausloeser E1/E2 je Zeile (Z7): Schluss echt ueber dem Maximum / echt unter dem Minimum der n vorigen Schluesse. nur: Teilmenge. */
function rohAusloeser(T, bits, nur) {
  var g = T.g;
  for (var s = 0; s < T.nSym; s++) {
    if (nur && !nur[s]) continue;
    var a = T.symStart[s], b = T.symStart[s + 1];
    for (var q = a; q < b; q++) {
      var z = T.symZeilen[q], c = g.bSchluss[z];
      if (!(c > 0)) continue;
      [[20, B_E1AUF, B_E1AB], [55, B_E2AUF, B_E2AB]].forEach(function (f) {
        var n = f[0]; if (q - a < n) return;
        var mx = -Infinity, mn = Infinity, gut = true;
        for (var k = 1; k <= n; k++) { var v = g.bSchluss[T.symZeilen[q - k]]; if (!(v > 0)) { gut = false; break; } if (v > mx) mx = v; if (v < mn) mn = v; }
        if (!gut) return;
        if (c > mx) bits[z] |= f[1]; else if (c < mn) bits[z] |= f[2];
      });
    }
  }
}

/** 2.02-Reaktionstage und E3 (Z7). cik je Reihe, firmen aus ED.ladeFirmen. Setzt B_202 an jeder Zeile eines Reaktionstags und
 *  B_E3AUF/B_E3AB, wo die Reaktion die Schwelle erreicht. Rueckgabe: Zaehler. */
function e3(T, M, bits, cik, firmen, schluss, nur) {
  var g = T.g, spy = T.symIdx.SPY, z = { meldungen: 0, ohneReaktionstag: 0, reihenMitCik: 0, tageJeReihe: 0, ohneZeile: 0,
    ohneVortag: 0, spyFehlt: 0, sdZuKurz: 0, unterSchwelle: 0, auf: 0, ab: 0 };
  if (spy === undefined) throw new Error('SPY fehlt - E3 braucht die Marktrendite');
  var reihenJeCik = new Map();
  for (var s = 0; s < T.nSym; s++) if (cik[s] && (!nur || nur[s])) { var l = reihenJeCik.get(cik[s]) || []; l.push(s); reihenJeCik.set(cik[s], l); }
  reihenJeCik.forEach(function (reihen, c) {
    var f = firmen.get(c); if (!f || !f.annahmen.length) return;
    var tage = {};
    f.annahmen.forEach(function (t) { z.meldungen++; var R = ED.reaktionstag(t, T.kal.tage, schluss); if (R < 0) z.ohneReaktionstag++; else tage[R] = 1; });
    var Rs = Object.keys(tage).map(Number);
    reihen.forEach(function (s) {
      z.reihenMitCik++;
      Rs.forEach(function (R) {
        z.tageJeReihe++;
        var row = T.zeileVon(s, R);
        if (row < 0) { z.ohneZeile++; return; }
        bits[row] |= B_202;
        var prev = T.zurueck(row, 1);
        var rA = g.rendite[row];
        if (prev < 0 || !(rA === rA)) { z.ohneVortag++; return; }
        var s0 = T.zeileVon(spy, g.tag[prev]), s1 = T.zeileVon(spy, R);
        if (s0 < 0 || s1 < 0 || M.NN[s1] - M.NN[s0] > 0) { z.spyFehlt++; return; }
        var rS = 100 * (Math.exp(M.L[s1] - M.L[s0]) - 1);
        var n = 0, su = 0, sq = 0;
        for (var k = 1; k <= KN.E3_SD_TAGE; k++) { var w = T.zurueck(row, k); if (w < 0) break; var x = g.rendite[w]; if (x === x) { n++; su += x; sq += x * x; } }
        if (n < KN.E3_SD_MIN) { z.sdZuKurz++; return; }
        var sd = Math.sqrt(Math.max(0, (sq - su * su / n) / (n - 1))), re = rA - rS;
        if (!(Math.abs(re) >= KN.E3_FAKTOR * sd) || re === 0) { z.unterSchwelle++; return; }
        if (re > 0) { bits[row] |= B_E3AUF; z.auf++; } else { bits[row] |= B_E3AB; z.ab++; }
      });
    });
  });
  return z;
}

/** Zulaessigkeit je (Tag D, Reihe) nach Z4: Klasse am Einstiegstag + 1 (0 = nicht zulaessig), Zeile am Einstiegstag, Einstiegstag je D.
 *  nur: optionale Teilmenge der Reihen (Uint8Array, 1 = drin) fuer den Piloten. */
function zulaessig(T, nur) {
  var nT = T.nTage, nS = T.nSym, kl = new Uint8Array(nT * nS), eRow = new Int32Array(nT * nS).fill(-1), aTag = new Int32Array(nT).fill(-1);
  var z = { tage: 0, zulaessig: 0, klasseEinstiegFehlt: 0 };
  for (var D = 0; D < T.maxTag; D++) {
    if (T.tagVon[D] < 0) continue;
    var U = LS.universum(T, D, { klassen: [0, 1, 2, 3] });
    if (U.aTag === null || !U.liste.length) continue;
    aTag[D] = U.aTag; z.tage++;
    for (var i = 0; i < U.liste.length; i++) {
      var e = U.liste[i]; if (nur && !nur[e.sym]) continue;
      var c = T.g.klasse[e.naechste];
      if (!(c >= 0 && c <= 3)) { z.klasseEinstiegFehlt++; continue; }
      kl[D * nS + e.sym] = c + 1; eRow[D * nS + e.sym] = e.naechste; z.zulaessig++;
    }
  }
  return { kl: kl, eRow: eRow, aTag: aTag, zaehler: z };
}

module.exports = { B_E1AUF: B_E1AUF, B_E1AB: B_E1AB, B_E2AUF: B_E2AUF, B_E2AB: B_E2AB, B_E3AUF: B_E3AUF, B_E3AB: B_E3AB, B_202: B_202,
  bit: bit, kumuliert: kumuliert, ertrag: ertrag, rohAusloeser: rohAusloeser, e3: e3, zulaessig: zulaessig };
