'use strict';
/* AUSWERTEN - aus den Zellen eines Messlaufs die Tagesreihen, Hansen-Hodrick-Standardfehler, Tore, Bonferroni, delta80,
 * Placebo-Baender, Topf-Drift, Ueberlebens-Differenz, Delisting-Tabelle, Regime-Diagnose und -Variante, Cent-Boden und
 * Obergrenzen rechnen (VORREGISTRIERUNG §6-§12, Nachtraege 1-2) und den Bericht schreiben.
 *
 *   node auswerten.js --aus <ordner> [--aus <ordner2> ...]
 *   --aus   Ordner eines Messlaufs (relativ zu diesem Ordner) mit _fortschritt.json und _zellen.bin. Mehrere Ordner
 *           werden durch Summieren der Felder zusammengelegt (gleiche Kennung Pflicht). Der Bericht landet im ERSTEN.
 *
 * DER DATEINAME SAGT DIE HERKUNFT (fehlerformen.md, "Ein Trockenlauf, der aussieht wie ein Befund"): traegt ein Lauf
 * pilot=true oder ist er nicht 'vollstaendig' beendet, heisst die Ausgabe PILOT-ERGEBNIS.md / pilot-ergebnis.json,
 * sonst ERGEBNIS.md / ergebnis.json.
 *
 * ENTSCHEIDE DIESER DATEI, wo die Vorregistrierung Spielraum laesst:
 *   - Alle Momente ueber Tagesmittel (ungewichtet je Einstiegstag); se primaer Hansen-Hodrick (Rechteck, Lag H-1),
 *     Newey-West (Bartlett, Lag H), Block (Blocklaenge H) und naiv stehen daneben. Kanalbruch: Lag/Block 60.
 *   - Faellt Hansen-Hodrick <= 0 aus, gilt der Block-Wert und die Zeile traegt die Marke HH<0.
 *   - Der Topf wird je (Tag, Dauer, Klasse, lebend) genommen, auch in der Sicht alle (§6).
 *   - Herabstufungen in der Reihenfolge Nullpunkt (Placebo) > Marktzeit (SPY-bereinigt <= 0).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var M = require('./messen.js');

var URTEILE = ['0 Signale', 'kein Kandidat', 'nicht entscheidbar', 'widerlegt als Groesse', 'belegt', 'belegt-aber-nullpunkt-verschoben', 'belegt, aber Marktzeit'];

function argumente(argv) { var a = { aus: [] }; for (var i = 0; i < argv.length; i++) if (argv[i] === '--aus' && argv[i + 1]) a.aus.push(argv[++i]); return a; }

/* ---------- Normalquantil (Acklam) und Bonferroni ---------- */
function normalQuantil(p) {
  var a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  var b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  var c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  var d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  if (!(p > 0 && p < 1)) return NaN;
  var q, r;
  if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= 1 - 0.02425) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
function zBonf(k) { return normalQuantil(1 - 0.025 / Math.max(1, k || 1)); }
function selbsttestQuantil() {
  [[1, 1.960], [5, 2.576], [10, 2.807], [20, 3.023]].forEach(function (s) { if (Math.abs(zBonf(s[0]) - s[1]) > 0.002) throw new Error('Normalquantil verrechnet: z_Bonf(' + s[0] + ') = ' + zBonf(s[0]) + ', soll ' + s[1]); });
}

/* ---------- Laden ---------- */
function ladeLaeufe(ordner, kal) {
  var sp = null, F = null, herkunft = [];
  ordner.forEach(function (o) {
    var Fi = JSON.parse(fs.readFileSync(path.join(o, '_fortschritt.json'), 'utf8'));
    if (Fi.kennung !== K.KONFIG_KENNUNG) throw new Error(o + ': Kennung ' + Fi.kennung + ' != ' + K.KONFIG_KENNUNG);
    if (Fi.nTage !== kal.tage.length) throw new Error(o + ': nTage ' + Fi.nTage + ' != Kalender ' + kal.tage.length);
    var spi = M.Speicher.lade(path.join(o, '_zellen.bin'), kal.tage.length, Fi.zellenStand);
    herkunft.push({ ordner: o, reihen: Fi.reihen, dateien: Fi.dateien, pilot: !!Fi.pilot, beendet: Fi.beendet, schluss: Fi.schluss, kennung: Fi.kennung });
    if (!sp) { sp = spi; F = Fi; }
    else { var fa = sp.felder(), fb = spi.felder(); fa.forEach(function (a, q) { for (var i = 0; i < a.length; i++) a[i] += fb[q][i]; }); F.reihen += Fi.reihen; F.dateien += Fi.dateien; Object.keys(Fi.signale).forEach(function (r) { F.signale[r] = Fi.signale[r]; }); }
  });
  return { sp: sp, F: F, herkunft: herkunft, pilot: herkunft.some(function (h) { return h.pilot || h.beendet !== 'vollstaendig'; }) };
}

/* ---------- Tagesreihen ---------- */
/** Tagesreihe einer Zellenzeile (art, konf, Richtung, Ausstieg) je Einstiegstag mit n > 0; sicht 'alle' | 'lebend'; nurKlasse optional.
 *  Je Tag: n, su (Summe dir*(rLong-Topf)), sr (Summe dir*r), ss (Summe dir*(rLong-rSPY)), dn/ds (Delisting), sd (Summe Dauer),
 *  nK je Klasse, nh (Summe Huerden), nhF (Summe Eroeffnungsfenster-Huerden); daraus uBrutto, uNetto, roh, rohNetto, spyNetto, nF. */
function tagesreihe(sp, art, konf, dirIdx, a, sicht, nurKlasse) {
  var nTage = sp.nTage, aus = [], lVon = sicht === 'lebend' ? 1 : 0, f = sp.f;
  var kVon = nurKlasse == null ? 0 : nurKlasse, kBis = nurKlasse == null ? K.N_K - 1 : nurKlasse;
  var basis = (((art * K.N_KONF + konf) * 2 + dirIdx) * K.N_A + a) * nTage;
  for (var t = 0; t < nTage; t++) {
    var b = (basis + t) * K.N_K * 2, z = { t: t, n: 0, su: 0, sr: 0, ss: 0, dn: 0, ds: 0, sd: 0, nK: [0, 0, 0, 0], nh: 0, nhF: 0 };
    for (var k = kVon; k <= kBis; k++) for (var l = lVon; l <= 1; l++) {
      var i = b + k * 2 + l, n = f.n[i];
      if (!(n > 0)) continue;
      z.n += n; z.su += f.su[i]; z.sr += f.sr[i]; z.ss += f.ss[i]; z.dn += f.dn[i]; z.ds += f.ds[i]; z.sd += f.sd[i]; z.nK[k] += n;
      z.nh += n * K.KLASSEN[k].huerde; z.nhF += n * K.KLASSEN[k].huerdeEroeffnung;
    }
    if (!(z.n > 0)) continue;
    z.uBrutto = z.su / z.n; z.uNetto = (z.su - z.nh) / z.n; z.roh = z.sr / z.n; z.rohNetto = (z.sr - z.nh) / z.n; z.spyNetto = (z.ss - z.nh) / z.n; z.nF = (z.sr - z.nhF) / z.n;
    aus.push(z);
  }
  return aus;
}
/** Tagweise poolen (Summen addieren) - fuer Placebo A ueber Linien und Richtungen. */
function poole(listen) {
  var je = {};
  listen.forEach(function (zl) { zl.forEach(function (z) {
    var p = je[z.t] || (je[z.t] = { t: z.t, n: 0, su: 0, sr: 0, ss: 0, dn: 0, ds: 0, sd: 0, nK: [0, 0, 0, 0], nh: 0, nhF: 0 });
    p.n += z.n; p.su += z.su; p.sr += z.sr; p.ss += z.ss; p.dn += z.dn; p.ds += z.ds; p.sd += z.sd; p.nh += z.nh; p.nhF += z.nhF; for (var k = 0; k < K.N_K; k++) p.nK[k] += z.nK[k];
  }); });
  return Object.keys(je).map(Number).sort(function (a, b) { return a - b; }).map(function (t) {
    var p = je[t]; p.uBrutto = p.su / p.n; p.uNetto = (p.su - p.nh) / p.n; p.roh = p.sr / p.n; p.rohNetto = (p.sr - p.nh) / p.n; p.spyNetto = (p.ss - p.nh) / p.n; p.nF = (p.sr - p.nhF) / p.n; return p;
  });
}

/* ---------- Standardfehler fuer ueberlappende Fenster (§7) ---------- */
/** Momente einer Tagesreihe (Werte x_t an Kalendertagen t): Mittel, sd, naiv se, Hansen-Hodrick (Rechteck bis Lag L-1),
 *  Newey-West (Bartlett bis Lag L), Block (Blocklaenge L ueber den Kalenderindex), n_eff = n/L. se = HH, sonst Block (Marke hh0). */
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
  /* Autokovarianzen nach Kalenderabstand k = 1..L (gamma_0 = q/n) */
  var g0 = q / n, gamma = new Float64Array(L + 1);
  for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { var k = paare[j].t - paare[i].t; if (k > L) break; if (k >= 1) gamma[k] += x[i] * x[j]; }
  var lrvHH = g0, lrvNW = g0;
  for (var k2 = 1; k2 <= L; k2++) { var gk = gamma[k2] / n; if (k2 <= L - 1) lrvHH += 2 * gk; lrvNW += 2 * (1 - k2 / (L + 1)) * gk; }
  m.seHH = lrvHH > 0 ? Math.sqrt(lrvHH / n) : null;
  m.seNW = lrvNW > 0 ? Math.sqrt(lrvNW / n) : null;
  /* Bloecke der Laenge L ueber den Kalenderindex: Mittel je Block, se = sd/sqrt(nBloecke) */
  var bl = {}; for (i = 0; i < n; i++) { var bId = Math.floor(paare[i].t / L); var e = bl[bId] || (bl[bId] = { s: 0, n: 0 }); e.s += paare[i].x; e.n++; }
  var bm = Object.keys(bl).map(function (kk) { return bl[kk].s / bl[kk].n; }); m.nBloecke = bm.length;
  if (bm.length >= 2) { var mb = 0; bm.forEach(function (v) { mb += v; }); mb /= bm.length; var qb = 0; bm.forEach(function (v) { qb += (v - mb) * (v - mb); }); m.seBlock = Math.sqrt(qb / (bm.length - 1)) / Math.sqrt(bm.length); }
  m.nEff = n / L;
  /* Wirksame Zahl aus dem Schaetzer selbst: n x (se_naiv / se_HH)^2 - bei verschiedenen Reihen je Tag ist die Ueberlappungs-
   * Korrelation der Topf-relativen Groesse klein und die Zahl liegt nahe n; nTage/H ist die konservative Schranke (§7). */
  m.nEffHH = m.seHH > 0 ? n * (m.seNaiv / m.seHH) * (m.seNaiv / m.seHH) : null;
  if (m.seHH != null) m.se = m.seHH; else if (m.seBlock != null) { m.se = m.seBlock; m.hh0 = true; } else m.se = m.seNaiv;
  if (m.sd === 0) { m.se = 0; m.seHH = 0; m.seNW = 0; m.seBlock = 0; }
  m.mde = 2 * m.se; m.obere = m.mittel + 1.96 * m.se; m.untere = m.mittel - 1.96 * m.se;
  m.t = m.se > 0 ? m.mittel / m.se : (m.mittel === 0 ? 0 : null);
  return m;
}
function paare(zeilen, feld) { return zeilen.filter(function (z) { return z[feld] === z[feld]; }).map(function (z) { return { t: z.t, x: z[feld] }; }); }
/** Statistik einer Tagesmenge fuer alle Groessen; L = Lag/Blocklaenge des Ausstiegs. */
function statistik(zeilen, L) {
  var N = 0, SU = 0, SR = 0, SS = 0, NH = 0, NHF = 0, DN = 0, DS = 0, SD = 0, nK = [0, 0, 0, 0];
  zeilen.forEach(function (z) { N += z.n; SU += z.su; SR += z.sr; SS += z.ss; NH += z.nh; NHF += z.nhF; DN += z.dn; DS += z.ds; SD += z.sd; for (var k = 0; k < K.N_K; k++) nK[k] += z.nK[k]; });
  var st = { nTage: zeilen.length, nSig: N, nK: nK, kKand: N > 0 ? NH / N : null, delistN: DN, delistMittel: DN > 0 ? DS / DN : null, dauerMittel: N > 0 ? SD / N : null,
    uBrutto: momente(paare(zeilen, 'uBrutto'), L), uNetto: momente(paare(zeilen, 'uNetto'), L), roh: momente(paare(zeilen, 'roh'), L), rohNetto: momente(paare(zeilen, 'rohNetto'), L),
    spyNetto: momente(paare(zeilen, 'spyNetto'), L), nF: momente(paare(zeilen, 'nF'), L) };
  st.uBrutto.jeSignal = N > 0 ? SU / N : null; st.uNetto.jeSignal = N > 0 ? (SU - NH) / N : null; st.roh.jeSignal = N > 0 ? SR / N : null; st.rohNetto.jeSignal = N > 0 ? (SR - NH) / N : null;
  st.uNetto.b2 = st.uNetto.mittel != null && st.uNetto.jeSignal != null && Math.sign(st.uNetto.mittel) !== Math.sign(st.uNetto.jeSignal);
  st.sigJeTag = zeilen.length ? N / zeilen.length : null;
  return st;
}
function lagVon(a) { var A = K.AUSSTIEGE[a]; return A.h != null ? A.h : A.max; }
function nurEnt(ctx) { return function (z) { return z.t < ctx.iBes; }; }
function nurBes(ctx) { return function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg; }; }
function imBand(m, mitAbsolut) { if (m.mittel == null || m.t == null) return false; return Math.abs(m.t) < K.BAND_T && (!mitAbsolut || Math.abs(m.mittel) < K.BAND_PP); }

/* ---------- Eine Konfiguration ---------- */
function rechneSicht(sp, ctx, konf, dirIdx, a, sicht) {
  var L = lagVon(a), reihe = tagesreihe(sp, 0, konf, dirIdx, a, sicht, null);
  var plB = tagesreihe(sp, 3, konf, dirIdx, a, sicht, null), jeTagB = {}; plB.forEach(function (z) { jeTagB[z.t] = z.roh; });
  var paarB = reihe.filter(function (z) { return jeTagB[z.t] !== undefined; }).map(function (z) { return { t: z.t, x: z.roh - jeTagB[z.t] }; });
  return {
    ent: statistik(reihe.filter(nurEnt(ctx)), L), bes: statistik(reihe.filter(nurBes(ctx)), L),
    entBis2020: statistik(reihe.filter(function (z) { return z.t < ctx.iBes && z.t < ctx.iReg; }), L),
    entAb2021: statistik(reihe.filter(function (z) { return z.t < ctx.iBes && z.t >= ctx.iReg; }), L),
    placeboB: { nSig: plB.reduce(function (s, z) { return s + z.n; }, 0), nTage: plB.length, alle: momente(paarB, L), bes: momente(paarB.filter(function (p) { return p.t >= ctx.iBes && p.t >= ctx.iReg; }), L) },
    placeboAZeilen: tagesreihe(sp, 2, konf, dirIdx, a, sicht, null),
    regime: sicht === 'alle' ? (function () { var rr = tagesreihe(sp, 1, konf, dirIdx, a, 'alle', null); return { ent: statistik(rr.filter(nurEnt(ctx)), L), bes: statistik(rr.filter(nurBes(ctx)), L) }; })() : null,
  };
}
function klassenDifferenz(sp, ctx, konf, dirIdx, a) {
  var L = lagVon(a), aus = [];
  for (var k = 0; k < K.N_K; k++) {
    var al = statistik(tagesreihe(sp, 0, konf, dirIdx, a, 'alle', k).filter(nurBes(ctx)), L).uBrutto.mittel;
    var le = statistik(tagesreihe(sp, 0, konf, dirIdx, a, 'lebend', k).filter(nurBes(ctx)), L).uBrutto.mittel;
    aus.push(al != null && le != null ? al - le : null);
  }
  return aus;
}
/** Topf-Drift je Ausstieg: Tagesmittel des Long-Ertrags aller zulaessigen Wert-Tage bei Dauer H (Kanalbruch: 20 als Anker), alle Klassen. */
function drift(sp, ctx, a) {
  var A = K.AUSSTIEGE[a], d = A.h != null ? A.h : 20, nTage = sp.nTage, zl = [];
  for (var t = 0; t < nTage; t++) { var n = 0, s = 0; for (var k = 0; k < K.N_K; k++) for (var l = 0; l <= 1; l++) { var i = K.topfZelle(nTage, t, d, k, l); n += sp.tn[i]; s += sp.ts[i]; } if (n > 0) zl.push({ t: t, x: s / n, n: n }); }
  var alle = momente(zl, lagVon(a)), bes = momente(zl.filter(function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg; }), lagVon(a));
  return { dauer: d, nTage: alle.n, mittel: alle.mittel, se: alle.se, t: alle.t, wertTage: zl.reduce(function (s, z) { return s + z.n; }, 0), nTageB: bes.n, mittelB: bes.mittel, seB: bes.se, tB: bes.t };
}

/* ---------- Die ganze Auswertung ---------- */
function auswerte(sp, F, kal) {
  var ctx = { iBes: kal.idx[K.BESTAETIGUNG_AB], iReg: kal.idx[K.REGIME_AB] };
  if (ctx.iBes == null) throw new Error('BESTAETIGUNG_AB ist kein Kalendertag.');
  if (ctx.iReg == null) { ctx.iReg = kal.tage.findIndex(function (t) { return t >= K.REGIME_AB; }); if (ctx.iReg < 0) throw new Error('REGIME_AB liegt hinter dem Kalender.'); }
  var konf = [], plEigen = {}, plPool = {};
  for (var li = 0; li < K.N_L; li++) for (var ei = 0; ei < K.N_E; ei++) for (var dirIdx = 0; dirIdx < 2; dirIdx++) for (var a = 0; a < K.N_A; a++) {
    var kf = K.konfIndex(li, ei), alle = rechneSicht(sp, ctx, kf, dirIdx, a, 'alle'), lebend = rechneSicht(sp, ctx, kf, dirIdx, a, 'lebend');
    var sE = kf + '/' + dirIdx + '/' + a, sP = ei + '/' + a;
    plEigen[sE] = [alle.placeboAZeilen]; (plPool[sP] = plPool[sP] || []).push(alle.placeboAZeilen);
    delete alle.placeboAZeilen; delete lebend.placeboAZeilen;
    konf.push({ linie: K.LINIEN[li].key, einstieg: K.EINSTIEGE[ei].key, richtung: K.RICHTUNGEN[dirIdx].key, ausstieg: K.AUSSTIEGE[a].key, li: li, ei: ei, kf: kf, dirIdx: dirIdx, a: a, haupt: K.HAUPT_AUSSTIEGE.indexOf(K.AUSSTIEGE[a].key) !== -1,
      alle: alle, lebend: { ent: lebend.ent, bes: lebend.bes },
      differenzLebend: alle.bes.uBrutto.mittel != null && lebend.bes.uBrutto.mittel != null ? alle.bes.uBrutto.mittel - lebend.bes.uBrutto.mittel : null,
      differenzLebendKlasse: klassenDifferenz(sp, ctx, kf, dirIdx, a) });
  }
  /* Kontrollen: Placebo A gepoolt je (Einstieg, Ausstieg), eigen je Konfiguration, Topf-Drift */
  var kontrollen = [], poolOk = {}, eigenOk = {}, eigen = {};
  for (var e2 = 0; e2 < K.N_E; e2++) for (var a2 = 0; a2 < K.N_A; a2++) {
    var sP2 = e2 + '/' + a2, L = lagVon(a2), pz = poole(plPool[sP2] || []), pst = statistik(pz, L);
    var p = { nTage: pst.nTage, nSig: pst.nSig, mittel: pst.uBrutto.mittel, se: pst.uBrutto.se, t: pst.uBrutto.t, roh: pst.roh.mittel };
    poolOk[sP2] = imBand(p, true);
    var gefallen = 0, geprueft = 0;
    konf.filter(function (c) { return c.ei === e2 && c.a === a2; }).forEach(function (c) {
      var sE2 = c.kf + '/' + c.dirIdx + '/' + c.a, est = statistik(poole(plEigen[sE2]), L), e = { nTage: est.nTage, nSig: est.nSig, mittel: est.uBrutto.mittel, se: est.uBrutto.se, t: est.uBrutto.t };
      var eB = statistik(poole(plEigen[sE2]).filter(nurBes(ctx)), L); e.bes = { nTage: eB.nTage, nSig: eB.nSig, seB: eB.uBrutto.se };
      eigen[sE2] = e; eigenOk[sE2] = imBand(e, false);
      if (e.nTage > 0) { geprueft++; if (!eigenOk[sE2]) gefallen++; }
    });
    kontrollen.push({ einstieg: K.EINSTIEGE[e2].key, ausstieg: K.AUSSTIEGE[a2].key, placebo: p, imBand: poolOk[sP2], eigenGeprueft: geprueft, eigenGefallen: gefallen, drift: drift(sp, ctx, a2) });
  }
  /* Tore (§10): Tor 1 auf allen 64 -> k1; Tor 2 mit z_Bonf(k1) -> k2; Urteil mit z_Bonf(k2). */
  konf.forEach(function (c) {
    var e = c.alle.ent, b = c.alle.bes;
    c.mdeB = b.uNetto.mde; c.seB = b.uNetto.se; c.kKand = b.kKand; c.nEffB = b.uNetto.nEff;
    c.tor1 = e.uNetto.mittel != null && c.mdeB != null && e.uNetto.mittel > 0 && e.uNetto.mittel >= K.TOR1_FAKTOR * c.mdeB;
    c.placeboA = eigen[c.kf + '/' + c.dirIdx + '/' + c.a];
  });
  var k1 = konf.filter(function (c) { return c.tor1; }).length, z1 = zBonf(Math.max(k1, 1));
  konf.forEach(function (c) { c.delta80 = c.seB != null ? (z1 + K.Z_POWER80) * c.seB : null; c.tor2 = c.tor1 && c.delta80 != null && c.kKand != null && c.delta80 < c.kKand; });
  var k2 = konf.filter(function (c) { return c.tor2; }).length, z2 = zBonf(Math.max(k2, 1));
  konf.forEach(function (c) { urteil(c, z2, poolOk[c.ei + '/' + c.a], eigenOk[c.kf + '/' + c.dirIdx + '/' + c.a]); });
  var zahlen = { konfigurationen: konf.length, k1: k1, k2: k2, zBonfK1: z1, zBonfK2: z2, urteile: {}, groesse: { 'in seiner Klasse zu': 0, 'in jeder Klasse zu': 0, 'offen': 0, 'ohne (< 30 Bes-Tage)': 0 }, bandUeberNull: 0 };
  URTEILE.forEach(function (u) { zahlen.urteile[u] = konf.filter(function (c) { return c.urteil === u; }).length; });
  zahlen.handelbar = konf.filter(function (c) { return c.handelbar; }).length;
  konf.forEach(function (c) { zahlen.groesse[c.groesse]++; if (c.bandUeberNull) zahlen.bandUeberNull++; });
  zahlen.placeboEigenGefallen = kontrollen.reduce(function (s, k) { return s + k.eigenGefallen; }, 0);
  zahlen.placeboPoolGefallen = kontrollen.filter(function (k) { return !k.imBand && k.placebo.nTage > 0; }).length;
  zahlen.hh0 = konf.filter(function (c) { return c.alle.bes.uNetto.hh0; }).length;
  return { ctx: ctx, konf: konf, kontrollen: kontrollen, zahlen: zahlen, delisting: delistingTabelle(konf), signalanteil: signalanteil(F), centBoden: centBoden(sp, kal), seBPlan: seBGegenPlan(konf, z1), klassenmix: klassenmix(F) };
}
/** Urteil nach §10: Groessenaussage fuer alle mit >= 30 Bes-Tagen; Wort, Herabstufungen, handelbar; Band ueber null nachrichtlich. */
function urteil(c, z2, poolOk, eigenOk) {
  var e = c.alle.ent, b = c.alle.bes;
  c.groesse = 'ohne (< 30 Bes-Tage)'; c.bandUeberNull = false;
  if (b.nTage >= K.MIN_BES_TAGE && b.uBrutto.obere != null && c.kKand != null) {
    if (b.uBrutto.obere < K.JEDE_KLASSE_ZU) c.groesse = 'in jeder Klasse zu';
    else if (b.uBrutto.obere < c.kKand) c.groesse = 'in seiner Klasse zu';
    else c.groesse = 'offen';
    c.bandUeberNull = b.uNetto.untere != null && b.uNetto.untere > 0;
  }
  c.handelbar = false; c.herabstufungen = []; c.leiheUngemessen = c.richtung === 'short';
  if (e.nSig === 0 && b.nSig === 0) { c.urteil = '0 Signale'; c.handelbarGrund = 'nein'; return; }
  if (c.mdeB == null || e.nTage === 0) { c.urteil = 'nicht entscheidbar'; c.grund = 'Tor 1 nicht pruefbar (se_B oder Entdeckung fehlt)'; c.handelbarGrund = 'nein'; return; }
  if (!c.tor1) { c.urteil = 'kein Kandidat'; c.handelbarGrund = 'nein'; return; }
  if (!c.tor2) { c.urteil = 'nicht entscheidbar'; c.grund = 'Tor 2: delta80 >= K_kand'; c.handelbarGrund = 'nein'; return; }
  if (b.nTage < K.MIN_BES_TAGE || !(c.nEffB >= K.MIN_N_EFF)) { c.urteil = 'nicht entscheidbar'; c.grund = 'Bestaetigung < ' + K.MIN_BES_TAGE + ' Signaltage oder n_eff < ' + K.MIN_N_EFF; c.handelbarGrund = 'nein'; return; }
  var kern = b.uNetto.mittel != null && b.uNetto.mittel > 0 && b.uNetto.t != null && b.uNetto.t >= z2 && Math.sign(b.uNetto.mittel) === Math.sign(e.uNetto.mittel);
  if (!kern) {
    if (c.groesse === 'in seiner Klasse zu' || c.groesse === 'in jeder Klasse zu') { c.urteil = 'widerlegt als Groesse'; c.grund = c.groesse; }
    else { c.urteil = 'nicht entscheidbar'; c.grund = b.uNetto.t != null && b.uNetto.t < z2 ? 't_B < z_Bonf(k2) oder Band schliesst K_kand ein' : 'Bestaetigung netto nicht > 0'; }
    c.handelbarGrund = 'nein'; return;
  }
  if (!poolOk) c.herabstufungen.push('Placebo gepoolt (Einstieg, H) gefallen');
  if (!eigenOk) c.herabstufungen.push('Placebo eigen gefallen');
  if (!(b.spyNetto.mittel > 0)) c.herabstufungen.push('SPY-bereinigt_B <= 0');
  if (!poolOk || !eigenOk) c.urteil = 'belegt-aber-nullpunkt-verschoben';
  else if (!(b.spyNetto.mittel > 0)) c.urteil = 'belegt, aber Marktzeit';
  else c.urteil = 'belegt';
  /* handelbar (§6, §10): belegt, Long, roher Netto-Ertrag_B > 0, delta80 <= K_kand */
  if (c.urteil === 'belegt') {
    if (c.leiheUngemessen) c.handelbarGrund = 'nein (Leihe)';
    else if (!(b.rohNetto.mittel > 0)) c.handelbarGrund = 'nein (roh netto_B <= 0)';
    else if (!(c.delta80 <= c.kKand)) c.handelbarGrund = 'nein (delta80 > K_kand)';
    else { c.handelbar = true; c.handelbarGrund = 'ja'; }
  } else c.handelbarGrund = 'nein';
}
/** Delisting-Tabelle (§5): je Konfiguration Zahl und Mittel der Trades mit Ausstieg zum letzten Schluss (Sicht alle, alle Tage). */
function delistingTabelle(konf) {
  return konf.map(function (c) { var e = c.alle.ent, b = c.alle.bes, n = e.nSig + b.nSig, dn = e.delistN + b.delistN;
    var ds = (e.delistN * (e.delistMittel || 0)) + (b.delistN * (b.delistMittel || 0));
    return { linie: c.linie, einstieg: c.einstieg, richtung: c.richtung, ausstieg: c.ausstieg, nTrades: n, nDelist: dn, anteil: n > 0 ? dn / n : null, mittelDelist: dn > 0 ? ds / dn : null, mittelAlle: n > 0 ? ((e.nSig * (e.roh.jeSignal || 0)) + (b.nSig * (b.roh.jeSignal || 0))) / n : null, delistB: b.delistN, mittelDelistB: b.delistMittel }; });
}
/** Signalanteil (§4 "vorab zaehlen"): je (Konfiguration, Richtung) Reihen mit Signal, Anteil Verschwundener, die zehn dichtesten Reihen. */
function signalanteil(F) {
  var aus = [], sig = F.signale || {};
  for (var kf = 0; kf < K.N_KONF; kf++) for (var d = 0; d < 2; d++) {
    var idx = kf * 2 + d, reihen = 0, verschwunden = 0, gesamt = 0, liste = [];
    Object.keys(sig).forEach(function (r) { var s = sig[r], n = (s.sig || [])[idx] || 0; if (!n) return; reihen++; gesamt += n; if (!s.lebend) verschwunden += n; liste.push([r, n]); });
    liste.sort(function (a, b) { return b[1] - a[1]; });
    aus.push({ linie: K.LINIEN[Math.floor(kf / K.N_E)].key, einstieg: K.EINSTIEGE[kf % K.N_E].key, richtung: K.RICHTUNGEN[d].key, signale: gesamt, reihen: reihen, anteilVerschwunden: gesamt ? verschwunden / gesamt : null, top: liste.slice(0, 10) });
  }
  return aus;
}
/** Cent-Boden (§11d): je (Linie, Einstieg, Richtung) und Klasse mittlerer roher Einstiegskurs und Anteil ueber dem Boden. */
function centBoden(sp, kal) {
  var nTage = kal.tage.length, aus = [];
  for (var kf = 0; kf < K.N_KONF; kf++) for (var d = 0; d < 2; d++) {
    var z = { linie: K.LINIEN[Math.floor(kf / K.N_E)].key, einstieg: K.EINSTIEGE[kf % K.N_E].key, richtung: K.RICHTUNGEN[d].key, klassen: [] };
    for (var k = 0; k < K.N_K; k++) { var n = 0, s = 0, cb = 0; for (var t = 0; t < nTage; t++) for (var l = 0; l <= 1; l++) { var i = K.kursZelle(nTage, kf, d, t, k, l); n += sp.kn[i]; s += sp.ks[i]; cb += sp.kcb[i]; } z.klassen.push({ klasse: K.KLASSEN[k].name, n: n, kursMittel: n ? s / n : null, anteilUeber: n ? cb / n : null }); }
    aus.push(z);
  }
  return aus;
}
/** Realisierte se_B gegen die Planzahlen aus §12 je (Einstieg, Ausstieg): dichteste Konfiguration und Median. */
function seBGegenPlan(konf, z1) {
  var aus = [];
  for (var ei = 0; ei < K.N_E; ei++) for (var a = 0; a < K.N_A; a++) {
    var cs = konf.filter(function (c) { return c.ei === ei && c.a === a && c.seB != null; });
    if (!cs.length) { aus.push({ einstieg: K.EINSTIEGE[ei].key, ausstieg: K.AUSSTIEGE[a].key, nKonf: 0 }); continue; }
    var dicht = cs.slice().sort(function (x, y) { return y.alle.bes.nSig - x.alle.bes.nSig; })[0];
    var seS = cs.map(function (c) { return c.seB; }).sort(function (x, y) { return x - y; }), med = seS[seS.length >> 1];
    aus.push({ einstieg: K.EINSTIEGE[ei].key, ausstieg: K.AUSSTIEGE[a].key, nKonf: cs.length, plan: K.PLAN[K.AUSSTIEGE[a].key] || null,
      dicht: { linie: dicht.linie, richtung: dicht.richtung, nSigB: dicht.alle.bes.nSig, nTageB: dicht.alle.bes.nTage, sigJeTag: dicht.alle.bes.sigJeTag, nEff: dicht.nEffB, seB: dicht.seB, seNaiv: dicht.alle.bes.uNetto.seNaiv, seNW: dicht.alle.bes.uNetto.seNW, seBlock: dicht.alle.bes.uNetto.seBlock, mdeB: dicht.mdeB, delta80: dicht.delta80 },
      median: { seB: med, mdeB: 2 * med, delta80: (z1 + K.Z_POWER80) * med } });
  }
  return aus;
}
function klassenmix(F) { var Z = F.zaehler || {}; return { reihenTageZulaessig: Z.reihenTageZulaessig, tageGewertetKlasse: Z.tageGewertetKlasse, ohneKlasse: Z.reihenTageOhneKlasse, massnahmen: Z.reihenTageMassnahmen }; }

/* ---------- Ausgabe ---------- */
function pp(x) { return x == null || x !== x ? '–' : x.toFixed(4).replace('.', ','); }
function tw(x) { return x == null || x !== x ? '–' : x.toFixed(2).replace('.', ','); }
function pz(x) { return x == null || x !== x ? '–' : (100 * x).toFixed(1).replace('.', ',') + ' %'; }
function ganz(x) { if (x == null || x !== x) return '–'; var s = String(Math.round(x)), aus = ''; while (s.replace('-', '').length > 3) { aus = '.' + s.slice(-3) + aus; s = s.slice(0, -3); } return s + aus; }
function jn(b) { return b ? 'ja' : 'nein'; }
function tabelle(kopf, zeilen) { var o = ['| ' + kopf.join(' | ') + ' |', '|' + kopf.map(function () { return '---'; }).join('|') + '|']; zeilen.forEach(function (z) { o.push('| ' + z.join(' | ') + ' |'); }); return o.join('\n') + '\n'; }

function markdown(E, F, herkunft, kal, pilot) {
  var z = E.zahlen, o = [];
  o.push('# ' + (pilot ? 'PILOT-ERGEBNIS' : 'ERGEBNIS') + ': Trendkanal auf Tagesbasis (VORREGISTRIERUNG.md, 08.09.2026)\n');
  if (pilot) o.push('> **PILOT- ODER TEILLAUF.** Zahlen aus ' + ganz(F.reihen) + ' Reihen. Nichts hier ist ein Befund ueber den Markt; die Datei heisst deshalb nicht ERGEBNIS.md.\n');
  o.push('Erzeugt ' + new Date().toISOString() + ' von auswerten.js. Kennung `' + K.KONFIG_KENNUNG + '`, Schluss-Kandidat `' + F.schluss + '`. Alles Simulation, keine Anlageberatung.\n');
  o.push('## 0. Herkunft und Zaehler\n');
  o.push(tabelle(['Ordner', 'Reihen', 'Tagesdateien', 'pilot', 'beendet', 'Schluss'], herkunft.map(function (h) { return [h.ordner, ganz(h.reihen), ganz(h.dateien), jn(h.pilot), h.beendet, h.schluss]; })));
  var Z = F.zaehler || {};
  o.push(tabelle(['Zaehler', 'Wert'], [['Reihen / Tagesdateien', ganz(F.reihen) + ' / ' + ganz(F.dateien)], ['Kalender: Tage / Bestaetigung ab / Regime ab', ganz(F.nTage) + ' / ' + K.BESTAETIGUNG_AB + ' / ' + K.REGIME_AB],
    ['zulaessige Reihen-Tage (Klasse, kein Massnahmenfenster)', ganz(Z.reihenTageZulaessig)], ['davon je Klasse 5-50 / 50-250 / 250-1000 / ab1000', (Z.tageGewertetKlasse || []).map(ganz).join(' / ')], ['Reihen-Tage ohne Klasse / im Massnahmenfenster', ganz(Z.reihenTageOhneKlasse) + ' / ' + ganz(Z.reihenTageMassnahmen)],
    ['davon ohne 16:00-Kerze (Schluss = 15:59-Rueckfall) je Klasse', Z.c16fehltKlasse ? Z.c16fehltKlasse.map(function (v, k) { return ganz(v) + ' (' + pz(Z.tageGewertetKlasse[k] ? v / Z.tageGewertetKlasse[k] : NaN) + ')'; }).join(' / ') : 'nicht gezaehlt (Lauf vor dem Zaehler)'],
    ['davon ohne 09:30-Kerze (Eroeffnung = erste Kerze) je Klasse', Z.oSpaetKlasse ? Z.oSpaetKlasse.map(function (v, k) { return ganz(v) + ' (' + pz(Z.tageGewertetKlasse[k] ? v / Z.tageGewertetKlasse[k] : NaN) + ')'; }).join(' / ') : 'nicht gezaehlt'],
    ['K1: Aufrufe / Linien / ausgebaut', ganz(Z.k1Aufrufe) + ' / ' + ganz(Z.k1Linien) + ' / ' + ganz(Z.k1Ausgebaut)], ['K2 ausgebaut (Reihen-Tage)', ganz(Z.k2Ausgebaut)],
    ['E1 Kandidaten / ohne Bestaetigungstag / abgelehnt', ganz(Z.e1Kandidaten) + ' / ' + ganz(Z.e1OhneBestaetigungstag) + ' / ' + ganz(Z.e1Abgelehnt)], ['E2 Kandidaten', ganz(Z.e2Kandidaten)], ['Cooldown / ohne Einstieg / Einstieg im Massnahmenfenster', ganz(Z.cooldown) + ' / ' + ganz(Z.ohneEinstieg) + ' / ' + ganz(Z.einstiegMassnahmen)],
    ['Signale (Trades) gesamt', ganz(Z.signale)], ['davon Regime ueber / unbekannt', ganz(Z.regimeUeber) + ' / ' + ganz(Z.regimeUnbekannt)], ['ohne Horizont je Ausstieg (H5/H10/H20/bruch)', (Z.ohneHorizont || []).map(ganz).join(' / ')], ['davon zensiert (lebend, Fenster endet)', (Z.zensiert || []).map(ganz).join(' / ')],
    ['Delisting-Ausstiege je Ausstieg', (Z.delist || []).map(ganz).join(' / ')], ['Kanalbruch: gebrochen / gekappt (60 Tage)', ganz(Z.gebrochen) + ' / ' + ganz(Z.gekappt)], ['Placebo A gezogen / ohne Partner', ganz(Z.placeboAGezogen) + ' / ' + ganz(Z.placeboAOhnePartner)], ['Placebo B gezogen / ohne Partner', ganz(Z.placeboBGezogen) + ' / ' + ganz(Z.placeboBOhnePartner)],
    ['Topf fehlt / SPY fehlt (Trades)', ganz(Z.topfFehlt) + ' / ' + ganz(Z.spyFehlt)], ['Regime-Tage ueber / unter / unbekannt', F.regimeTage ? ganz(F.regimeTage.ueber) + ' / ' + ganz(F.regimeTage.unter) + ' / ' + ganz(F.regimeTage.unbekannt) : '–'], ['ms laden / Topf / messen', F.ms ? ganz(F.ms.laden) + ' / ' + ganz(F.ms.topf) + ' / ' + ganz(F.ms.messen) : '–']]));
  o.push('Fehlende Jahresdateien sind in `alpaca1m/_luecken.json` erfasst (PM 07.09.2026: 340 Reihen, alle erfasst) - "Datei fehlt" ist ein Befund ueber den Handel, kein Loch der Sammlung.\n');

  o.push('## 1. Kontrollen zuerst (§11)\n');
  o.push('Placebo A gepoolt je (Einstieg, Ausstieg) ueber alle vier Linien und beide Richtungen, Mass je Trade dir_p · (rLong_p − Topf seiner Zelle), se Hansen-Hodrick. Band: |t| < ' + K.BAND_T + ' und |Mittel| < ' + pp(K.BAND_PP) + ' Pp. Eigen je Konfiguration nur |t| < 3. Drift = Topf-Tagesmittel (Long-Ertrag aller zulaessigen Wert-Tage bei Dauer H; Kanalbruch: 20 Tage als Anker).\n');
  o.push(tabelle(['Einstieg', 'Ausstieg', 'Placebo nTage', 'nTrades', 'Mittel−Topf (Pp)', 'se', 't', 'im Band', 'eigen geprueft', 'eigen gefallen', 'Drift Dauer', 'Drift nTage', 'Drift Mittel (Pp)', 'Drift se', 'Drift t', 'Drift Bes Mittel', 'Wert-Tage'],
    E.kontrollen.map(function (k) { var p = k.placebo, d = k.drift; return [k.einstieg, k.ausstieg, ganz(p.nTage), ganz(p.nSig), pp(p.mittel), pp(p.se), tw(p.t), jn(k.imBand), ganz(k.eigenGeprueft), ganz(k.eigenGefallen), ganz(d.dauer), ganz(d.nTage), pp(d.mittel), pp(d.se), tw(d.t), pp(d.mittelB), ganz(d.wertTage)]; })));
  o.push('Gepoolte Placebo-Baender gefallen: **' + z.placeboPoolGefallen + '** von ' + E.kontrollen.length + '. Einzel-Placebos gefallen: **' + z.placeboEigenGefallen + '**. Konfigurationen mit HH ≤ 0 (Block-se ersatzweise): ' + z.hh0 + '.\n');

  o.push('## 2. Urteile in Zahlen (§10)\n');
  o.push('> **Belegt ist nicht handelbar.** Ueber belegt / widerlegt als Groesse / nicht entscheidbar entscheidet die Hauptgroesse `u` = Ueberschuss gegen den Topf minus Kassa-Huerde (Tagesmittel, se Hansen-Hodrick). **handelbar** verlangt zusaetzlich Long, rohen Netto-Ertrag_B > 0 und delta80 ≤ K_kand. Short ist nie handelbar (Leihe nicht gemessen). H = 20 und Kanalbruch sind nach §12 nur Obergrenzen.\n');
  var uz = [['Konfigurationen', ganz(z.konfigurationen)], ['k1 (Tor 1 bestanden)', ganz(z.k1)], ['z_Bonf(max(k1,1)) fuer delta80', tw(z.zBonfK1)], ['k2 (beide Tore)', ganz(z.k2)], ['z_Bonf(max(k2,1)) = Schwelle fuer t_B', tw(z.zBonfK2)]];
  URTEILE.forEach(function (u) { uz.push(['Urteil: ' + u, ganz(z.urteile[u])]); });
  uz.push(['handelbar', ganz(z.handelbar)]);
  Object.keys(z.groesse).forEach(function (g) { uz.push(['Groessenaussage (≥ 30 Bes-Tage): ' + g, ganz(z.groesse[g])]); });
  uz.push(['nachrichtlich: untere Grenze u_netto_B ueber null', ganz(z.bandUeberNull)]);
  o.push(tabelle(['Groesse', 'Wert'], uz));

  o.push('## 3. Kandidatentafel - alle 64 Konfigurationen, sortiert nach Entdeckungs-t (u netto) absteigend\n');
  o.push('Ent/Bes = Entdeckung / Bestaetigung (ab 2021). u = Ueberschuss gegen den Topf (brutto / netto), roh = Ertrag des Kontos (netto), SPY = SPY-bereinigt netto, nF = netto mit Eroeffnungsfenster-Huerde. se = Hansen-Hodrick; naiv/NW/Block daneben. n_eff = nTage/H. Δlebend = alle − lebend (u brutto Bes). Kand−PlB = gepaarte Differenz roh. Regime = Variante nur SPY > EMA200 (Bes, u netto, nachrichtlich).\n');
  var sortiert = E.konf.slice().sort(function (a, b) { return (b.alle.ent.uNetto.t == null ? -1e9 : b.alle.ent.uNetto.t) - (a.alle.ent.uNetto.t == null ? -1e9 : a.alle.ent.uNetto.t); });
  o.push(tabelle(['Linie', 'Einstieg', 'Richtung', 'Ausstieg', 'Ent nTage', 'Ent nTr', 'Ent u brutto', 'Ent u netto', 'Ent t', 'MDE_B', 'Tor1', 'K_kand', 'delta80', 'Tor2', 'Bes nTage', 'Bes nTr', 'Tr/Tag', 'n_eff', 'n_eff HH', 'Bes u brutto', 'Bes u netto', 'Bes t', 'se HH', 'se naiv', 'se NW', 'se Block', 'obere', 'untere', 'Bes roh netto', 'Bes SPY', 'Bes nF', 'Δlebend', 'Kand−PlB', 'PlB t', 'PlA t', 'Regime u netto', 'Regime t', 'Delist Bes', 'Dauer', 'B2', 'Urteil', 'handelbar', 'Groesse'],
    sortiert.map(function (c) { var e = c.alle.ent, b = c.alle.bes, r = c.alle.regime ? c.alle.regime.bes : null;
      return [c.linie, c.einstieg, c.richtung, c.ausstieg, ganz(e.nTage), ganz(e.nSig), pp(e.uBrutto.mittel), pp(e.uNetto.mittel), tw(e.uNetto.t), pp(c.mdeB), jn(c.tor1), pp(c.kKand), pp(c.delta80), jn(c.tor2),
        ganz(b.nTage), ganz(b.nSig), tw(b.sigJeTag), tw(c.nEffB), tw(b.uNetto.nEffHH), pp(b.uBrutto.mittel), pp(b.uNetto.mittel), tw(b.uNetto.t), pp(b.uNetto.seHH) + (b.uNetto.hh0 ? ' HH<0' : ''), pp(b.uNetto.seNaiv), pp(b.uNetto.seNW), pp(b.uNetto.seBlock), pp(b.uNetto.obere), pp(b.uNetto.untere),
        pp(b.rohNetto.mittel), pp(b.spyNetto.mittel), pp(b.nF.mittel), pp(c.differenzLebend), pp(c.alle.placeboB.bes.mittel), tw(c.alle.placeboB.bes.t), c.placeboA ? tw(c.placeboA.t) : '–', r ? pp(r.uNetto.mittel) : '–', r ? tw(r.uNetto.t) : '–', ganz(b.delistN), tw(b.dauerMittel), b.uNetto.b2 ? 'B2' : '',
        c.urteil + (c.herabstufungen && c.herabstufungen.length ? ' [' + c.herabstufungen.join('; ') + ']' : '') + (c.bandUeberNull ? ' (Band > 0)' : ''), c.handelbarGrund, c.groesse]; })));

  o.push('## 4. Ueberlebensverzerrung (§11c): Bestaetigung u brutto, Sicht alle − Sicht lebend, je Klasse\n');
  o.push(tabelle(['Linie', 'Einstieg', 'Richtung', 'Ausstieg', 'Δ alle−lebend', '5-50', '50-250', '250-1000', 'ab1000', 'Bes nTage alle', 'Bes nTage lebend'],
    E.konf.map(function (c) { return [c.linie, c.einstieg, c.richtung, c.ausstieg, pp(c.differenzLebend)].concat(c.differenzLebendKlasse.map(pp)).concat([ganz(c.alle.bes.nTage), ganz(c.lebend.bes.nTage)]); })));
  o.push('## 4b. Delisting-Ausstiege (§5): Trades, die mit dem letzten Schluss der Reihe endeten\n');
  o.push(tabelle(['Linie', 'Einstieg', 'Richtung', 'Ausstieg', 'Trades', 'Delisting', 'Anteil', 'Mittel roh Delisting (Pp)', 'Mittel roh alle (Pp)', 'Delisting Bes', 'Mittel Delisting Bes'],
    E.delisting.map(function (d) { return [d.linie, d.einstieg, d.richtung, d.ausstieg, ganz(d.nTrades), ganz(d.nDelist), pz(d.anteil), pp(d.mittelDelist), pp(d.mittelAlle), ganz(d.delistB), pp(d.mittelDelistB)]; })));

  o.push('## 5. Regimeschnitt der Entdeckung (§8, Diagnose, kein Filter): ≤ 2020 gegen ≥ 2021 (u netto)\n');
  o.push(tabelle(['Linie', 'Einstieg', 'Richtung', 'Ausstieg', '≤2020 nTage', '≤2020 Mittel', '≤2020 t', '≥2021 nTage', '≥2021 Mittel', '≥2021 t', 'Bes Mittel', 'Bes t'],
    E.konf.map(function (c) { var a = c.alle.entBis2020, b = c.alle.entAb2021, s = c.alle.bes; return [c.linie, c.einstieg, c.richtung, c.ausstieg, ganz(a.nTage), pp(a.uNetto.mittel), tw(a.uNetto.t), ganz(b.nTage), pp(b.uNetto.mittel), tw(b.uNetto.t), pp(s.uNetto.mittel), tw(s.uNetto.t)]; })));

  o.push('## 5b. Cent-Boden (§11d): mittlerer roher Einstiegskurs und Anteil der Trades mit Boden ueber der Klassenhuerde\n');
  o.push(tabelle(['Linie', 'Einstieg', 'Richtung'].concat(K.KLASSEN.map(function (k) { return k.name + ' n / Kurs $ / ueber Boden'; })),
    E.centBoden.map(function (c) { return [c.linie, c.einstieg, c.richtung].concat(c.klassen.map(function (k) { return ganz(k.n) + ' / ' + (k.kursMittel == null ? '–' : k.kursMittel.toFixed(2)) + ' / ' + pz(k.anteilUeber); })); })));

  o.push('## 6. Signalanteil (§4): Reihen mit Signal, Anteil der Verschwundenen, dichteste Reihen\n');
  o.push(tabelle(['Linie', 'Einstieg', 'Richtung', 'Signale', 'Reihen', 'Anteil verschwunden', 'Top 10 Reihen'],
    E.signalanteil.map(function (s) { return [s.linie, s.einstieg, s.richtung, ganz(s.signale), ganz(s.reihen), pz(s.anteilVerschwunden), s.top.map(function (t) { return t[0] + ' ' + t[1]; }).join(', ')]; })));

  o.push('## 7. Realisierte se_B gegen den Plan (§12) - ZUGEWINN, nicht vorregistriert\n');
  o.push('Plan: delta80 bei k1 = 1 fuer k = 20 / 60 / 200 Trades je Tag (sigma_idio 2,5 Pp). Realisiert: se_B (Hansen-Hodrick) der u-netto-Tagesreihe der Bestaetigung; "dicht" = Konfiguration mit den meisten Bestaetigungs-Trades; delta80 mit z_Bonf(max(k1,1)) = ' + tw(z.zBonfK1) + '.\n');
  o.push(tabelle(['Einstieg', 'Ausstieg', 'Konf.', 'dicht: Linie', 'dicht nTr_B', 'dicht nTage_B', 'Tr/Tag', 'n_eff', 'se HH', 'se naiv', 'se NW', 'se Block', 'MDE_B', 'delta80', 'Median se_B', 'Median delta80', 'Plan delta80 k20 / k60 / k200'],
    E.seBPlan.map(function (s) { var d = s.dicht || {}; return [s.einstieg, s.ausstieg, ganz(s.nKonf), d.linie ? d.linie + ' ' + d.richtung : '–', ganz(d.nSigB), ganz(d.nTageB), tw(d.sigJeTag), tw(d.nEff), pp(d.seB), pp(d.seNaiv), pp(d.seNW), pp(d.seBlock), pp(d.mdeB), pp(d.delta80), s.median ? pp(s.median.seB) : '–', s.median ? pp(s.median.delta80) : '–', s.plan ? pp(s.plan.k20) + ' / ' + pp(s.plan.k60) + ' / ' + pp(s.plan.k200) : '–']; })));

  o.push('## 8. Was diese Zahlen nicht sagen (VORREGISTRIERUNG §15)\n');
  o.push('- Nichts ueber **andere Kanal-Definitionen, Parameter oder Filter**.\n- Nichts ueber **Intraday, CFD, Scheine, Yahoo als Messbasis, die Zeit vor 2016**.\n- Nicht die **effektiven** Kosten der Auktionen: die notierte Spanne des fortlaufenden Handels ist ein Stellvertreter.\n- Kein **Ja** aus der Entdeckung, aus SPY-bereinigt, aus Placebo B oder aus der Regime-Variante.\n- **Fuer H = 20 und Kanalbruch kein Nein** - nur Obergrenzen; "nicht entscheidbar" ist der Befund.\n- Short: eine Groesse, nie eine Regel (Leihe nicht gemessen).\n' + (pilot ? '- **Dies ist ein Pilot- oder Teillauf.** Nichts hier ist ein Befund ueber den Markt.\n' : ''));
  return o.join('\n');
}

/* ---------- Hauptlauf ---------- */
function lauf(a) {
  if (!a.aus.length) { console.error('Pflichtargument --aus <ordner> fehlt.'); process.exit(2); }
  selbsttestQuantil();
  var kal = K.kalender(), ordner = a.aus.map(function (o) { return path.resolve(K.HIER, o); });
  var L = ladeLaeufe(ordner, kal), E = auswerte(L.sp, L.F, kal);
  var pilot = L.pilot, name = pilot ? 'PILOT-ERGEBNIS' : 'ERGEBNIS';
  var md = markdown(E, L.F, L.herkunft, kal, pilot);
  fs.writeFileSync(path.join(ordner[0], name + '.md'), md);
  var json = { kennung: K.KONFIG_KENNUNG, pilot: pilot, stand: new Date().toISOString(), herkunft: L.herkunft, zahlen: E.zahlen, kontrollen: E.kontrollen, seBPlan: E.seBPlan, delisting: E.delisting,
    konf: E.konf.map(function (c) { var k = {}; Object.keys(c).forEach(function (f) { if (f !== 'placeboA') k[f] = c[f]; }); k.placeboA = c.placeboA ? { mittel: c.placeboA.mittel, t: c.placeboA.t, nTage: c.placeboA.nTage } : null; return k; }),
    konstanten: { zPower80: K.Z_POWER80, minBesTage: K.MIN_BES_TAGE, minNEff: K.MIN_N_EFF, tor1Faktor: K.TOR1_FAKTOR, bandT: K.BAND_T, bandPp: K.BAND_PP, jedeKlasseZu: K.JEDE_KLASSE_ZU, plan: K.PLAN } };
  fs.writeFileSync(path.join(ordner[0], name.toLowerCase() + '.json'), JSON.stringify(json));
  console.log(name + '.md geschrieben nach ' + ordner[0] + ' | Konfigurationen ' + E.zahlen.konfigurationen + ' | k1 ' + E.zahlen.k1 + ' | k2 ' + E.zahlen.k2 + ' | handelbar ' + E.zahlen.handelbar + ' | Placebo gepoolt gefallen ' + E.zahlen.placeboPoolGefallen + ' | ' + JSON.stringify(E.zahlen.urteile));
  return E;
}

module.exports = { lauf: lauf, argumente: argumente, normalQuantil: normalQuantil, zBonf: zBonf, selbsttestQuantil: selbsttestQuantil, ladeLaeufe: ladeLaeufe, tagesreihe: tagesreihe, poole: poole, momente: momente, statistik: statistik,
  auswerte: auswerte, urteil: urteil, markdown: markdown, lagVon: lagVon, URTEILE: URTEILE };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
