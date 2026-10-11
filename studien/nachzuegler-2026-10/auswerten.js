'use strict';
/* AUSWERTEN - aus den Tageszellen je Konfiguration die Tagesreihe, Hansen-Hodrick-se, Tor 1 (Z16), Placebo-Verstoesse (Z17),
 * Kandidaten (Z18), Pruefung mit Holm ueber 384 (Z19), Jahres- und Klassentafeln (Z20). Simulation, keine Anlageberatung.
 */
var path = require('path');
var KN = require('./konfig.js');
var ST = require(path.join(KN.PRUEFSTAND, 'statistik.js'));

/* ---------- Normalverteilung ---------- */
function phi(z) {                                             /* Verteilungsfunktion, erfc nach Numerical Recipes (Fehler < 1,2e-7) */
  var x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.5 * x);
  var y = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 +
    t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  return z >= 0 ? 1 - 0.5 * y : 0.5 * y;
}
function quantil(p) {                                         /* Umkehrung von phi durch Halbierung (genau genug fuer Schwellen) */
  var lo = -10, hi = 10; for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (phi(m) < p) lo = m; else hi = m; } return (lo + hi) / 2;
}

/* ---------- Groessen je Tag ---------- */
var GROESSEN = {
  netto: function (Z, i) { return Z.n[i] > 0 ? (Z.sb[i] - Z.sk[i] - KN.LEIHE_SATZ * Z.sl[i]) / Z.n[i] : NaN; },
  brutto: function (Z, i) { return Z.n[i] > 0 ? Z.sb[i] / Z.n[i] : NaN; },
  kassa: function (Z, i) { return Z.n[i] > 0 ? (Z.sb[i] - Z.skk[i] - KN.LEIHE_SATZ * Z.sl[i]) / Z.n[i] : NaN; },
  leihe0: function (Z, i) { return Z.n[i] > 0 ? (Z.sb[i] - Z.sk[i] - KN.LEIHE_EMPFINDLICH[0] * Z.sl[i]) / Z.n[i] : NaN; },
  leihe3: function (Z, i) { return Z.n[i] > 0 ? (Z.sb[i] - Z.sk[i] - KN.LEIHE_EMPFINDLICH[1] * Z.sl[i]) / Z.n[i] : NaN; },
  plA: function (Z, i) { return Z.an[i] > 0 ? Z.asb[i] / Z.an[i] : NaN; },
  plB: function (Z, i) { return Z.bn[i] > 0 ? Z.bsb[i] / Z.bn[i] : NaN; },
  plC: function (Z, i) { return Z.cn[i] > 0 ? Z.csb[i] / Z.cn[i] : NaN; },
  spaetBrutto: function (Z, i) { return Z.ln[i] > 0 ? Z.lsb[i] / Z.ln[i] : NaN; },
  spaetNetto: function (Z, i) { return Z.ln[i] > 0 ? (Z.lsb[i] - Z.lsk[i] - KN.LEIHE_SATZ * Z.lsl[i]) / Z.ln[i] : NaN; },
};
function paare(Z, k, zr, feld, filter) {
  var f = GROESSEN[feld], aus = [], nT = Z.nTage;
  for (var e = zr.eMin; e <= zr.exitMax; e++) { var x = f(Z, k * nT + e); if (x === x && (!filter || filter(e))) aus.push({ t: e, x: x }); }
  return aus;
}
function kurz(m) { return { n: m.n, mittel: m.mittel, se: m.se, t: m.t, seNaiv: m.seNaiv, hh0: m.hh0 }; }

/** Handelstage des Kalenders in [von, bis] (Indizes). */
function tageZwischen(tage, vonText, bisIdx) { var n = 0; for (var i = 0; i <= bisIdx; i++) if (tage[i] >= vonText) n++; return n; }

/**
 * Entdeckung: alle 384 Konfigurationen. Z = Zellen, zr = Zeitraum, T = Tafel (nur Kalender und Stand).
 * Rueckgabe { konf: [...], kandidaten: [...], zahlen }.
 */
function entdeckung(Z, zr, T) {
  var tage = T.kal.tage, letzter = T.stand.letzterVollTagIdx, ab = tage.findIndex(function (t) { return t >= KN.PRUEFUNG_AB; });
  var konf = [];
  for (var k = 0; k < KN.KONFIGURATIONEN; k++) {
    var K0 = KN.konfAus(k), h = KN.HALTEDAUERN[K0.hi], L = h + 1, c = K0.c, huerde = KN.HUERDE[c];
    var st = {}, nObs = 0;
    for (var e = zr.eMin; e <= zr.exitMax; e++) nObs += Z.n[k * Z.nTage + e];
    ['netto', 'brutto', 'kassa', 'leihe0', 'leihe3', 'plA', 'plB', 'plC', 'spaetBrutto', 'spaetNetto'].forEach(function (f) { st[f] = kurz(ST.momente(paare(Z, k, zr, f), L)); });
    var jahre = {};
    for (var j = 2016; j <= 2022; j++) {
      var jt = String(j), m = ST.momente(paare(Z, k, zr, 'netto', function (e2) { return tage[e2].slice(0, 4) === jt; }), L);
      if (m.n) jahre[jt] = kurz(m);
    }
    var ohne2020 = kurz(ST.momente(paare(Z, k, zr, 'netto', function (e2) { return tage[e2].slice(0, 4) !== '2020'; }), L));
    var ohne2022 = kurz(ST.momente(paare(Z, k, zr, 'netto', function (e2) { return tage[e2].slice(0, 4) !== '2022'; }), L));
    var TE = tageZwischen(tage, KN.T_E_VON, zr.exitMax - h), TB = Math.max(1, (letzter - h) - ab + 1);
    var seB = st.netto.se != null ? st.netto.se * Math.sqrt(TE / TB) : null, mdeB = seB != null ? KN.MDE_FAKTOR * seB : null;
    var tor1 = st.netto.mittel != null && mdeB != null && st.netto.mittel > 0 && st.netto.mittel >= KN.TOR1_FAKTOR * mdeB;
    var verstoss = {};
    ['plA', 'plB', 'plC'].forEach(function (p) { var m2 = st[p]; verstoss[p] = m2.t != null && Math.abs(m2.t) >= KN.PLACEBO_T && Math.abs(m2.mittel) >= KN.PLACEBO_ANTEIL_HUERDE * huerde; });
    var gruende = [];
    if (!(st.netto.n >= KN.MIN_TAGE)) gruende.push('< ' + KN.MIN_TAGE + ' Einstiegstage');
    if (!(st.netto.mittel > 0)) gruende.push('netto <= 0');
    if (!(st.netto.t >= KN.KANDIDAT_T)) gruende.push('t < 2');
    if (!tor1) gruende.push('Tor 1');
    ['plA', 'plB', 'plC'].forEach(function (p) { if (verstoss[p]) gruende.push('Placebo ' + p.slice(2)); });
    var ab3 = []; for (var gI = 0; gI < 3; gI++) ab3.push({ n: Z.abn[k * 3 + gI], mittel: Z.abn[k * 3 + gI] ? Z.abs[k * 3 + gI] / Z.abn[k * 3 + gI] : null });
    konf.push({ k: k, name: K0.name, a: K0.a, r: K0.r, v: K0.v, hy: K0.hy, h: h, c: c, huerde: huerde, nObs: nObs, st: st, jahre: jahre,
      ohne2020: ohne2020, ohne2022: ohne2022, TE: TE, TB: TB, seBproj: seB, mdeBproj: mdeB, tor1: tor1, tor1Schwelle: mdeB != null ? KN.TOR1_FAKTOR * mdeB : null,
      delta80: seB != null ? (KN.HOLM_Z1 + 0.8416) * seB : null, verstoss: verstoss,
      ausschluss: { eigene202: { n: Z.ex1n[k], mittel: Z.ex1n[k] ? Z.ex1s[k] / Z.ex1n[k] : null }, eigenerAusloeser: { n: Z.ex2n[k], mittel: Z.ex2n[k] ? Z.ex2s[k] / Z.ex2n[k] : null } },
      abgang: { uebernahme: ab3[0], insolvenz: ab3[1], sonstige: ab3[2], insolvenzTotal: Z.abn[k * 3 + 1] ? Z.abs100[k] / Z.abn[k * 3 + 1] : null },
      aAbgang: Z.aAbgang[k], plBohnePartner: Z.plBohne[k], kandidat: gruende.length === 0, gruende: gruende });
  }
  var kandidaten = konf.filter(function (x) { return x.kandidat; });
  var zahlen = { konfigurationen: konf.length, mitDaten: konf.filter(function (x) { return x.st.netto.n > 0; }).length,
    pruefbar: konf.filter(function (x) { return x.st.netto.n >= KN.MIN_TAGE; }).length,
    t2: konf.filter(function (x) { return x.st.netto.n >= KN.MIN_TAGE && x.st.netto.mittel > 0 && x.st.netto.t >= KN.KANDIDAT_T; }).length,
    t2NegativSpiegel: konf.filter(function (x) { return x.st.netto.n >= KN.MIN_TAGE && x.st.netto.t <= -KN.KANDIDAT_T; }).length,
    tor1: konf.filter(function (x) { return x.tor1; }).length,
    placeboVerstoesse: { plA: konf.filter(function (x) { return x.verstoss.plA; }).length, plB: konf.filter(function (x) { return x.verstoss.plB; }).length, plC: konf.filter(function (x) { return x.verstoss.plC; }).length },
    kandidaten: kandidaten.length, zufallErwartetT2: KN.KONFIGURATIONEN * (1 - phi(KN.KANDIDAT_T)) };
  return { konf: konf, kandidaten: kandidaten, zahlen: zahlen };
}

/** Holm ueber m = 384 (Z19): p aufsteigend, die k-te gegen alpha/(m - k + 1); Abbruch beim ersten Verfehlen. */
function holm(pListe, m, alpha) {
  var o = pListe.map(function (p, i) { return { p: p, i: i }; }).sort(function (a, b) { return a.p - b.p; }), aus = pListe.map(function () { return false; }), schwelle = [];
  for (var k = 0; k < o.length; k++) {
    var s = alpha / (m - k); schwelle[o[k].i] = s;
    if (o[k].p <= s) aus[o[k].i] = true; else { for (var r = k + 1; r < o.length; r++) schwelle[o[r].i] = alpha / (m - r); break; }
  }
  return { bestanden: aus, schwelle: schwelle };
}

/** Pruefung der gesiegelten Kandidaten: Tagesreihe der Pruefzeit, t_B, p einseitig, Holm. */
function pruefung(Z, zr, kandidatenK) {
  var zeilen = kandidatenK.map(function (k) {
    var K0 = KN.konfAus(k), h = KN.HALTEDAUERN[K0.hi], L = h + 1, st = {};
    ['netto', 'brutto', 'kassa', 'leihe0', 'leihe3', 'plA', 'plB', 'plC'].forEach(function (f) { st[f] = kurz(ST.momente(paare(Z, k, zr, f), L)); });
    var p = st.netto.t != null ? 1 - phi(st.netto.t) : 1;
    return { k: k, name: K0.name, st: st, p: p, mdeB: st.netto.se != null ? KN.MDE_FAKTOR * st.netto.se : null };
  });
  var H0 = holm(zeilen.map(function (z) { return z.p; }), KN.KONFIGURATIONEN, KN.HOLM_ALPHA);
  zeilen.forEach(function (z, i) { z.holmSchwelle = H0.schwelle[i]; z.holm = H0.bestanden[i]; z.belegt = z.holm && z.st.netto.mittel > 0; });
  return { zeilen: zeilen, belegt: zeilen.filter(function (z) { return z.belegt; }).length };
}

module.exports = { phi: phi, quantil: quantil, GROESSEN: GROESSEN, paare: paare, entdeckung: entdeckung, holm: holm, pruefung: pruefung, tageZwischen: tageZwischen };
