'use strict';
/* AUSWERTEN - aus den Zellen eines oder mehrerer Messlaeufe die Tagesreihen, Tore, Bonferroni, delta80,
 * Placebo-Baender, Topf-Nullpunkt, Ueberlebens-Differenz, Regimeschnitt und Obergrenzen rechnen
 * (VORREGISTRIERUNG §4-§7, §9, §11 und NACHTRAG 1, Punkte 1-7, 12, 20, 21) und den Bericht schreiben.
 *
 * Aufruf (von hier):  node auswerten.js --aus <ordner> [--aus <ordner2> ...]
 *   --aus   Ordner eines Messlaufs (relativ zu diesem Ordner) mit _fortschritt.json und _zellen.bin.
 *           Mehrere Ordner (Teil-Laeufe --teil k/n) werden durch Summieren der Felder zusammengelegt.
 *           Jede Kennung muss K.KONFIG_KENNUNG sein, sonst Abbruch. Der Bericht landet im ERSTEN Ordner.
 *
 * DER DATEINAME SAGT DIE HERKUNFT (fehlerformen.md, "Ein Trockenlauf, der aussieht wie ein Befund"):
 * ist irgendein Lauf pilot=true oder nicht 'vollstaendig' beendet, heisst die Ausgabe PILOT-ERGEBNIS.md /
 * pilot-ergebnis.json, sonst ERGEBNIS.md / ergebnis.json.
 *
 * ENTSCHEIDE DIESER DATEI, wo die Vorregistrierung Spielraum laesst:
 *   - Placebo-Baender (eigen |t| < 3; gepoolt |t| < 3 und |Mittel| < 0,01 Pp) werden ueber ALLE Tage des
 *     Fensters gerechnet, Sicht alle - sie pruefen die Maschine, nicht den Markt.
 *   - se_B, MDE_B, t_B kommen aus der NETTO-Tagesreihe der Bestaetigung (das Urteil faellt ueber u).
 *   - Eine Konfiguration ohne ein einziges Signal heisst '0 Signale' (§1), nicht 'kein Kandidat'.
 *   - Ist se_B nicht definiert (< 2 Bestaetigungstage), ist Tor 1 nicht pruefbar: 'nicht entscheidbar'.
 *   - Der Topf wird je (Klasse, lebend)-Zelle genommen, auch in der Sicht alle (§3: "derselben ... lebend-Flag").
 *   - Herabstufungen in der Reihenfolge Nullpunkt > Marktzeit > Eroeffnungskosten; alle treffenden stehen daneben.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var M = require('./messen.js');

var Z_POWER80 = 0.8416;                       // Phi^-1(0,8): Messmaschine S2 zPower80
var MIN_BES_TAGE = 30;                        // §6: Bestaetigung ab 2021 mit >= 30 Signaltagen
var TOR1_FAKTOR = 4;                          // §6.1: Entdeckung netto >= 4 x MDE_B
var BAND_T = 3, BAND_PP = 0.01;               // §7a / Nachtrag 3: Placebo-Baender
var JEDE_KLASSE_ZU = K.KLASSEN[K.KLASSEN.length - 1].huerde;   // 0,0449: obere Grenze darunter => in jeder Klasse zu
var KLASSE_ZAEHL_H = K.N_H - 1;               // Klassenmix aus der Haltedauer 'schluss' (immer beobachtet, wenn ein Einstieg da ist)
/* Planzahlen aus §9 in der Fassung von Nachtrag 1 (MDE_B / delta80 in Pp, 894 Bestaetigungstage, k = 5) - nur zum Danebenstellen. */
var PLAN_A = { '1m': { mde: 0.023, delta80: 0.039 }, '5m': { mde: 0.034, delta80: 0.058 }, '15m': { mde: 0.047, delta80: 0.081 } };
var PLAN_B = { '1h': { mde: 0.023, delta80: 0.040 }, '3h': { mde: 0.040, delta80: 0.069 }, 'schluss': { mde: 0.047, delta80: 0.080 } };
var URTEILE = ['0 Signale', 'kein Kandidat', 'nicht entscheidbar', 'widerlegt als Groesse', 'belegt', 'belegt-aber-nullpunkt-verschoben', 'belegt, aber Marktzeit', 'belegt, aber Eroeffnungskosten'];

/* ---------- Argumente ---------- */
/** Liest die --aus-Ordner (mehrfach erlaubt). */
function argumente(argv) {
  var a = { aus: [] };
  for (var i = 0; i < argv.length; i++) if (argv[i] === '--aus' && argv[i + 1]) a.aus.push(argv[++i]);
  return a;
}

/* ---------- Normalquantil (Acklam) und Bonferroni ---------- */
/** Phi^-1(p) nach Acklams rationaler Naeherung (relativer Fehler < 1,2e-9). */
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
/** z_Bonf(k) = Phi^-1(1 - 0,025/k), zweiseitig alpha = 0,05; k < 1 zaehlt als 1. */
function zBonf(k) { return normalQuantil(1 - 0.025 / Math.max(1, k || 1)); }
/** Sperrklinke (Nachtrag 1.1): die vier Zahlen muessen auf 0,002 herauskommen, sonst wird nichts gerechnet. */
function selbsttestQuantil() {
  [[1, 1.960], [5, 2.576], [10, 2.807], [20, 3.023]].forEach(function (s) {
    if (Math.abs(zBonf(s[0]) - s[1]) > 0.002) throw new Error('Normalquantil verrechnet: z_Bonf(' + s[0] + ') = ' + zBonf(s[0]) + ', soll ' + s[1]);
  });
}

/* ---------- Laden und Zusammenlegen ---------- */
/** Feldweise Addition zweier Speicher (Teil-Laeufe), alle sieben Felder. */
function addiere(sp, s2) {
  ['n', 's', 's2', 'h2', 'tn', 'ts', 'ts2'].forEach(function (f) { var a = sp[f], b = s2[f]; for (var i = 0; i < a.length; i++) a[i] += b[i]; });
}
/** Rekursive Summe zweier Fortschritts-Teile: Zahlen addieren, Felder elementweise, Objekte je Schluessel, Rest bleibt (erster gewinnt). */
function summiere(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (Array.isArray(a) && Array.isArray(b)) { var m = Math.max(a.length, b.length), aus = []; for (var i = 0; i < m; i++) aus.push(summiere(a[i], b[i])); return aus; }
  if (a && b && typeof a === 'object' && typeof b === 'object') { var o = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { if (!(k in o)) o[k] = summiere(a[k], b[k]); }); return o; }
  return a === undefined ? b : a;
}
/** Liest alle --aus-Ordner, prueft Kennung und Kalenderlaenge, summiert Zellen und Zaehler; zaehlt doppelt erledigte Dateien. */
function ladeLaeufe(ordner, kal) {
  var sp = null, F = null, herkunft = [], erledigt = {}, doppelt = 0;
  ordner.forEach(function (o) {
    var fp = path.join(o, '_fortschritt.json'), zp = path.join(o, '_zellen.bin');
    if (!fs.existsSync(fp) || !fs.existsSync(zp)) throw new Error('In ' + o + ' fehlt _fortschritt.json oder _zellen.bin.');
    var f = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (f.kennung !== K.KONFIG_KENNUNG) throw new Error('Kennung in ' + o + ' ist "' + f.kennung + '", diese Auswertung erwartet "' + K.KONFIG_KENNUNG + '" - anderer Stand der Studie, Abbruch.');
    if (f.nTage !== kal.tage.length) throw new Error('nTage ' + f.nTage + ' in ' + o + ' passt nicht zum Kalender (' + kal.tage.length + ') - Abbruch.');
    if (f.bestaetigungAb && f.bestaetigungAb !== K.BESTAETIGUNG_AB) throw new Error('Split ' + f.bestaetigungAb + ' in ' + o + ' != registriert ' + K.BESTAETIGUNG_AB + ' - Abbruch.');
    var s = M.Speicher.lade(zp, f.nTage);
    if (!sp) sp = s; else { addiere(sp, s); s = null; }
    Object.keys(f.erledigt || {}).forEach(function (k) { if (erledigt[k]) doppelt++; erledigt[k] = 1; });
    herkunft.push({ ordner: o, dateien: f.dateien, bytes: f.bytes, reihen: Object.keys(f.signale || {}).length, pilot: !!f.pilot, beendet: f.beendet || 'offen',
      teil: f.teil || null, reihenArg: f.reihenArg || null, zellenStand: f.zellenStand, kennung: f.kennung, begonnen: f.begonnen, stand: f.stand });
    F = F ? summiere(F, f) : f;
  });
  F.nTage = kal.tage.length; F.doppeltErledigt = doppelt;
  F.pilotIrgendwo = herkunft.some(function (h) { return h.pilot; });
  F.unvollstaendig = herkunft.some(function (h) { return h.beendet !== 'vollstaendig'; });
  return { sp: sp, F: F, herkunft: herkunft };
}

/* ---------- Tagesreihen und Statistik (§4, Nachtrag 2, 7, 12) ---------- */
/** Tagesreihe einer Zellenzeile (Reihe r, Richtung, Haltedauer) je Signaltag (n > 0): n, s, nh (Summe Huerden), h2
 *  (Summe Einstiegsfenster-Huerden), nK je Klasse, mN/mS (Zaehler und gerichtete Marktbereinigung nur ueber Zellen
 *  mit Topf), roh, netto, nettoF, markt. sicht 'alle' = lebend 0+1, 'lebend' = nur 1; nurKlasse = eine Umsatzklasse. */
function tagesreihe(sp, r, dirIdx, h, zrIdx, sicht, nurKlasse) {
  var nTage = sp.nTage, dir = dirIdx === 0 ? 1 : -1, aus = [], ohneTopf = 0;
  var lVon = sicht === 'lebend' ? 1 : 0;
  var kVon = nurKlasse == null ? 0 : nurKlasse, kBis = nurKlasse == null ? K.N_K - 1 : nurKlasse;
  var basisZ = ((r * 2 + dirIdx) * K.N_H + h) * nTage, basisT = (zrIdx * K.N_H + h) * nTage;
  for (var t = 0; t < nTage; t++) {
    var bz = (basisZ + t) * K.N_K * 2, bt = (basisT + t) * K.N_K * 2;
    var n = 0, s = 0, nh = 0, h2 = 0, mN = 0, mS = 0, nK = [0, 0, 0, 0];
    for (var k = kVon; k <= kBis; k++) for (var l = lVon; l <= 1; l++) {
      var i = bz + k * 2 + l, nz = sp.n[i];
      if (!(nz > 0)) continue;
      n += nz; s += sp.s[i]; nh += nz * K.KLASSEN[k].huerde; h2 += sp.h2[i]; nK[k] += nz;
      var it = bt + k * 2 + l;
      if (sp.tn[it] > 0) { mN += nz; mS += sp.s[i] - dir * nz * sp.ts[it] / sp.tn[it]; } else ohneTopf++;
    }
    if (!(n > 0)) continue;
    aus.push({ t: t, n: n, s: s, nh: nh, h2: h2, nK: nK, mN: mN, mS: mS, roh: s / n, netto: (s - nh) / n, nettoF: (s - h2) / n, markt: mN > 0 ? mS / mN : NaN });
  }
  aus.ohneTopf = ohneTopf;
  return aus;
}
/** Poolt Tagesreihen mehrerer Zeilen tagweise (Summen addieren, Mittel neu); fuer Placebo A ueber beide Richtungen und ueber Detektoren. */
function poole(listen) {
  var je = {};
  listen.forEach(function (zl) { zl.forEach(function (z) {
    var p = je[z.t] || (je[z.t] = { t: z.t, n: 0, s: 0, nh: 0, h2: 0, nK: [0, 0, 0, 0], mN: 0, mS: 0 });
    p.n += z.n; p.s += z.s; p.nh += z.nh; p.h2 += z.h2; p.mN += z.mN; p.mS += z.mS; for (var k = 0; k < K.N_K; k++) p.nK[k] += z.nK[k];
  }); });
  return Object.keys(je).map(Number).sort(function (a, b) { return a - b; }).map(function (t) {
    var p = je[t]; p.roh = p.s / p.n; p.netto = (p.s - p.nh) / p.n; p.nettoF = (p.s - p.h2) / p.n; p.markt = p.mN > 0 ? p.mS / p.mN : NaN; return p;
  });
}
/** Momente einer Menge von Tageswerten: Mittel (ungewichtet), sd (n-1), se, t, MDE = 2 se, 95-%-Grenzen. */
function momente(werte) {
  var n = werte.length, m = { n: n, mittel: null, sd: null, se: null, t: null, mde: null, obere: null, untere: null };
  if (!n) return m;
  var su = 0; for (var i = 0; i < n; i++) su += werte[i];
  m.mittel = su / n;
  if (n < 2) return m;
  var q = 0; for (var j = 0; j < n; j++) q += (werte[j] - m.mittel) * (werte[j] - m.mittel);
  m.sd = Math.sqrt(q / (n - 1));
  if (m.sd <= 1e-12 * Math.max(1, Math.abs(m.mittel))) m.sd = 0;           // konstante Reihe: Gleitkomma-Rest ist keine Streuung (t waere 1e16)
  m.se = m.sd / Math.sqrt(n); m.mde = 2 * m.se;
  m.obere = m.mittel + 1.96 * m.se; m.untere = m.mittel - 1.96 * m.se;
  m.t = m.se > 0 ? m.mittel / m.se : (m.mittel === 0 ? 0 : null);
  return m;
}
/** Statistik einer Tagesmenge: brutto/netto/nettoF/markt-Momente, signalgewichtet jeSignal, K_kand (= nh/n), Klassenmix, B2-Warnung. */
function statistik(zeilen) {
  var N = 0, S = 0, NH = 0, H2 = 0, nK = [0, 0, 0, 0];
  zeilen.forEach(function (z) { N += z.n; S += z.s; NH += z.nh; H2 += z.h2; for (var k = 0; k < K.N_K; k++) nK[k] += z.nK[k]; });
  var werte = function (f) { return zeilen.filter(function (z) { return z[f] === z[f]; }).map(function (z) { return z[f]; }); };
  var st = { nTage: zeilen.length, nSig: N, nK: nK, brutto: momente(werte('roh')), netto: momente(werte('netto')), nettoF: momente(werte('nettoF')), markt: momente(werte('markt')),
    kKand: N > 0 ? NH / N : null };
  st.brutto.jeSignal = N > 0 ? S / N : null;
  st.netto.jeSignal = N > 0 ? (S - NH) / N : null;
  st.nettoF.jeSignal = N > 0 ? (S - H2) / N : null;
  st.netto.b2 = st.netto.mittel != null && st.netto.jeSignal != null && Math.sign(st.netto.mittel) !== Math.sign(st.netto.jeSignal);
  return st;
}
function nurEnt(ctx) { return function (z) { return z.t < ctx.iBes; }; }
function nurBes(ctx) { return function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg; }; }
/** Band-Pruefung eines Placebo-Momente-Objekts: |t| < 3, optional |Mittel| < 0,01 Pp; nicht pruefbar (kein t) = nicht bestanden. */
function imBand(m, mitAbsolut) {
  if (m.mittel == null || m.t == null) return false;
  return Math.abs(m.t) < BAND_T && (!mitAbsolut || Math.abs(m.mittel) < BAND_PP);
}

/* ---------- Eine Konfiguration (Detektor x Zeitrahmen x Richtung x Haltedauer) in einer Sicht ---------- */
/** Entdeckung, Bestaetigung (ab 2021), Diagnose <=2020 / >=2021 der Entdeckung, Placebo B gepaart, Placebo-A-Zeilen zum Poolen. */
function rechneSicht(sp, ctx, dI, zi, dirIdx, h, sicht) {
  var kand = K.kandIndex(dI, zi);
  var reihe = tagesreihe(sp, K.reiheIndex(kand, 0), dirIdx, h, zi, sicht, null);
  var plA = tagesreihe(sp, K.reiheIndex(kand, 1), dirIdx, h, zi, sicht, null);
  var plB = tagesreihe(sp, K.reiheIndex(kand, 2), dirIdx, h, zi, sicht, null);
  var jeTagB = {}; plB.forEach(function (z) { jeTagB[z.t] = z.roh; });
  var paare = reihe.filter(function (z) { return jeTagB[z.t] !== undefined; }).map(function (z) { return { t: z.t, d: z.roh - jeTagB[z.t] }; });
  var pbAlle = momente(paare.map(function (p) { return p.d; })), pbBes = momente(paare.filter(nurBes(ctx)).map(function (p) { return p.d; }));
  return {
    ent: statistik(reihe.filter(nurEnt(ctx))),
    bes: statistik(reihe.filter(nurBes(ctx))),
    entBis2020: statistik(reihe.filter(function (z) { return z.t < ctx.iBes && z.t < ctx.iReg; })),
    entAb2021: statistik(reihe.filter(function (z) { return z.t < ctx.iBes && z.t >= ctx.iReg; })),
    placeboB: { nSig: plB.reduce(function (a, z) { return a + z.n; }, 0), nTage: plB.length, alle: pbAlle, bes: pbBes },
    ohneTopf: reihe.ohneTopf, placeboAZeilen: plA,
  };
}
/** Ueberlebens-Differenz je Umsatzklasse: Bestaetigungs-Brutto-Tagesmittel alle minus lebend, [k0..k3]. */
function klassenDifferenz(sp, ctx, r, dirIdx, h, zi) {
  var aus = [];
  for (var k = 0; k < K.N_K; k++) {
    var a = statistik(tagesreihe(sp, r, dirIdx, h, zi, 'alle', k).filter(nurBes(ctx))).brutto.mittel;
    var l = statistik(tagesreihe(sp, r, dirIdx, h, zi, 'lebend', k).filter(nurBes(ctx))).brutto.mittel;
    aus.push(a != null && l != null ? a - l : null);
  }
  return aus;
}

/* ---------- Kontrollen (§7, Nachtrag 2-3): Placebo A eigen und gepoolt, Intraday-Drift aus dem Topf ---------- */
/** Placebo-A-Momente einer Menge von Zeilenlisten: Mass = dir_p * (rohLong_p - Topf), tagweise gepoolt. */
function placeboMomente(listen) {
  var z = poole(listen), st = statistik(z);
  /* `mittel` ist das Bandmass (fuer imBand), `gegenTopf` derselbe Wert unter seinem sprechenden Namen fuer den Bericht. */
  return { nTage: st.nTage, nSig: st.nSig, roh: st.brutto.mittel, mittel: st.markt.mittel, gegenTopf: st.markt.mittel, se: st.markt.se, t: st.markt.t, ohneTopf: st.nTage - st.markt.n };
}
/** Topf-Tagesreihe (Long-Ertrag aller zulaessigen Kerzen) je Tag, Sicht alle oder lebend, ueber alle Klassen. */
function topfReihe(sp, zi, h, sicht) {
  var nTage = sp.nTage, basis = (zi * K.N_H + h) * nTage, aus = [], lVon = sicht === 'lebend' ? 1 : 0;
  for (var t = 0; t < nTage; t++) {
    var b = (basis + t) * K.N_K * 2, n = 0, s = 0;
    for (var k = 0; k < K.N_K; k++) for (var l = lVon; l <= 1; l++) { n += sp.tn[b + k * 2 + l]; s += sp.ts[b + k * 2 + l]; }
    if (n > 0) aus.push({ t: t, n: n, mittel: s / n });
  }
  return aus;
}
/** Intraday-Drift je (Zeitrahmen, Haltedauer): Momente des Topf-Tagesmittels, alle Tage und Bestaetigung. */
function drift(sp, ctx, zi, h) {
  var tr = topfReihe(sp, zi, h, 'alle'), w = function (zl) { return zl.map(function (x) { return x.mittel; }); };
  var alle = momente(w(tr)), bes = momente(w(tr.filter(nurBes(ctx))));
  return { nTage: alle.n, mittel: alle.mittel, sd: alle.sd, se: alle.se, t: alle.t, kerzen: tr.reduce(function (a, x) { return a + x.n; }, 0),
    nTageB: bes.n, mittelB: bes.mittel, sdB: bes.sd, seB: bes.se, tB: bes.t };
}

/* ---------- Die ganze Auswertung ---------- */
/** Rechnet alle 234 Konfigurationen in beiden Sichten, Kontrollen, Tore, Urteile, Differenzen, Signalanteil, se_B gegen Plan. */
function auswerte(sp, F, kal) {
  var ctx = { iBes: kal.idx[K.BESTAETIGUNG_AB], iReg: kal.idx[K.REGIME_AB] };
  if (ctx.iBes == null) throw new Error('BESTAETIGUNG_AB ' + K.BESTAETIGUNG_AB + ' ist kein Kalendertag.');
  if (ctx.iReg == null) { ctx.iReg = kal.tage.findIndex(function (t) { return t >= K.REGIME_AB; }); if (ctx.iReg < 0) throw new Error('REGIME_AB liegt hinter dem Kalender.'); }
  var dets = K.DETEKTOR_KEYS, konf = [], plEigen = {}, plPool = {};
  for (var dI = 0; dI < dets.length; dI++) for (var zi = 0; zi < K.N_ZR; zi++) for (var dirIdx = 0; dirIdx < 2; dirIdx++) for (var h = 0; h < K.N_H; h++) {
    var alle = rechneSicht(sp, ctx, dI, zi, dirIdx, h, 'alle'), lebend = rechneSicht(sp, ctx, dI, zi, dirIdx, h, 'lebend');
    var sE = dI + '/' + zi + '/' + h, sP = zi + '/' + h;
    (plEigen[sE] = plEigen[sE] || []).push(alle.placeboAZeilen); (plPool[sP] = plPool[sP] || []).push(alle.placeboAZeilen);
    delete alle.placeboAZeilen; delete lebend.placeboAZeilen;
    konf.push({ det: dets[dI], zr: K.ZEITRAHMEN[zi].key, richtung: K.RICHTUNGEN[dirIdx].key, h: K.HALTEDAUERN[h].key, dI: dI, zi: zi, dirIdx: dirIdx, hi: h,
      alle: alle, lebend: { ent: lebend.ent, bes: lebend.bes, placeboB: lebend.placeboB },
      differenzLebend: alle.bes.brutto.mittel != null && lebend.bes.brutto.mittel != null ? alle.bes.brutto.mittel - lebend.bes.brutto.mittel : null,
      differenzLebendKlasse: klassenDifferenz(sp, ctx, K.reiheIndex(K.kandIndex(dI, zi), 0), dirIdx, h, zi) });
  }
  /* Kontrollen zuerst: Placebo A gepoolt je (ZR, H), eigen je (Detektor, ZR, H), Intraday-Drift aus dem Topf. */
  var kontrollen = [], poolOk = {}, eigenOk = {}, eigen = {};
  for (var z2 = 0; z2 < K.N_ZR; z2++) for (var h2 = 0; h2 < K.N_H; h2++) {
    var sP2 = z2 + '/' + h2, p = placeboMomente(plPool[sP2]);
    poolOk[sP2] = imBand(p, true);
    var gefallen = 0, geprueft = 0;
    for (var d2 = 0; d2 < dets.length; d2++) {
      var sE2 = d2 + '/' + z2 + '/' + h2, e = placeboMomente(plEigen[sE2]);
      /* Nachtrag 1b.2 (Rauschboden): se_B der rohen Placebo-A-Tagesreihe (beide Richtungen) in der Bestaetigung, zum Vergleich mit dem Kandidaten. */
      var eB = statistik(poole(plEigen[sE2]).filter(nurBes(ctx)));
      e.bes = { nTage: eB.nTage, nSig: eB.nSig, seB: eB.brutto.se };
      eigen[sE2] = e; eigenOk[sE2] = imBand(e, false);
      if (e.nTage > 0) { geprueft++; if (!eigenOk[sE2]) gefallen++; }
    }
    kontrollen.push({ zr: K.ZEITRAHMEN[z2].key, h: K.HALTEDAUERN[h2].key, placebo: p, imBand: poolOk[sP2], eigenGeprueft: geprueft, eigenGefallen: gefallen, drift: drift(sp, ctx, z2, h2) });
  }
  /* Tore (§6, Nachtrag 5-6): Tor 1 auf allen -> k1; Tor 2 mit z_Bonf(k1) -> k2; Urteil mit z_Bonf(k2). */
  konf.forEach(function (c) {
    var e = c.alle.ent, b = c.alle.bes;
    c.mdeB = b.netto.mde; c.kKand = b.kKand;
    c.tor1 = e.netto.mittel != null && c.mdeB != null && e.netto.mittel > 0 && e.netto.mittel >= TOR1_FAKTOR * c.mdeB;
    c.placeboA = eigen[c.dI + '/' + c.zi + '/' + c.hi];
    c.seVerhaeltnis = seVerhaeltnis(c.placeboA.bes, b);
  });
  var k1 = konf.filter(function (c) { return c.tor1; }).length, z1 = zBonf(Math.max(k1, 1));
  konf.forEach(function (c) {
    c.delta80 = c.alle.bes.netto.se != null ? (z1 + Z_POWER80) * c.alle.bes.netto.se : null;
    c.tor2 = c.tor1 && c.delta80 != null && c.kKand != null && c.delta80 < c.kKand;
  });
  var k2 = konf.filter(function (c) { return c.tor2; }).length, z2u = zBonf(Math.max(k2, 1));
  konf.forEach(function (c) { urteil(c, z2u, poolOk[c.zi + '/' + c.hi], eigenOk[c.dI + '/' + c.zi + '/' + c.hi]); });
  var zahlen = { konfigurationen: konf.length, k1: k1, k2: k2, zBonfK1: z1, zBonfK2: z2u, urteile: {} };
  URTEILE.forEach(function (u) { zahlen.urteile[u] = konf.filter(function (c) { return c.urteil === u; }).length; });
  zahlen.handelbar = konf.filter(function (c) { return c.handelbar; }).length;
  zahlen.groesse = { 'in seiner Klasse zu': 0, 'in jeder Klasse zu': 0, 'offen': 0, 'ohne (< 30 Bes-Tage)': 0 };
  konf.forEach(function (c) { zahlen.groesse[c.groesse]++; });
  zahlen.ohneTopf = konf.reduce(function (a, c) { return a + c.alle.ohneTopf; }, 0);
  zahlen.placeboEigenGefallen = kontrollen.reduce(function (a, k) { return a + k.eigenGefallen; }, 0);
  zahlen.placeboPoolGefallen = kontrollen.filter(function (k) { return !k.imBand && k.placebo.nTage > 0; }).length;
  zahlen.seVerhaeltnisGeprueft = konf.filter(function (c) { return c.seVerhaeltnis.bereinigt != null; }).length;
  zahlen.seVerhaeltnisAuffaellig = konf.filter(function (c) { return c.seVerhaeltnis.auffaellig; }).length;
  return { ctx: ctx, konf: konf, kontrollen: kontrollen, zahlen: zahlen, ueberleben: ueberleben(konf, F), signalanteil: signalanteil(F), klassenmix: klassenmix(sp, ctx), seB: seBGegenPlan(konf, z1) };
}
/** Urteil nach §6 und Nachtrag (5, 6, 12, 20): Groessenaussage fuer alle mit >= 30 Bes-Tagen; Wort, Herabstufungen, handelbar. */
function urteil(c, z2, poolOk, eigenOk) {
  var e = c.alle.ent, b = c.alle.bes;
  c.groesse = 'ohne (< 30 Bes-Tage)';
  if (b.nTage >= MIN_BES_TAGE && b.brutto.obere != null && c.kKand != null) {
    if (b.brutto.obere < JEDE_KLASSE_ZU) c.groesse = 'in jeder Klasse zu';
    else if (b.brutto.obere < c.kKand) c.groesse = 'in seiner Klasse zu';
    else c.groesse = 'offen';
  }
  c.handelbar = false; c.herabstufungen = [];
  if (e.nSig === 0 && b.nSig === 0) { c.urteil = '0 Signale'; return; }
  if (c.mdeB == null || e.nTage === 0) { c.urteil = 'nicht entscheidbar'; c.grund = 'Tor 1 nicht pruefbar (se_B oder Entdeckung fehlt)'; return; }
  if (!c.tor1) { c.urteil = 'kein Kandidat'; return; }
  if (!c.tor2) { c.urteil = 'nicht entscheidbar'; c.grund = 'Tor 2: delta80 >= K_kand'; return; }
  if (b.nTage < MIN_BES_TAGE) { c.urteil = 'nicht entscheidbar'; c.grund = 'Bestaetigung < ' + MIN_BES_TAGE + ' Signaltage'; return; }
  var kern = b.netto.mittel != null && b.netto.mittel > 0 && b.netto.t != null && b.netto.t >= z2 && Math.sign(b.netto.mittel) === Math.sign(e.netto.mittel);
  if (!kern) {
    if (c.groesse === 'in seiner Klasse zu' || c.groesse === 'in jeder Klasse zu') { c.urteil = 'widerlegt als Groesse'; c.grund = c.groesse; }
    else { c.urteil = 'nicht entscheidbar'; c.grund = b.netto.t != null && b.netto.t < z2 ? 't_B < z_Bonf(k2) oder Band schliesst K_kand ein' : 'Bestaetigung netto nicht > 0'; }
    return;
  }
  if (!poolOk) c.herabstufungen.push('Placebo gepoolt (ZR, H) gefallen');
  if (!eigenOk) c.herabstufungen.push('Placebo eigen gefallen');
  if (!(b.markt.mittel > 0)) c.herabstufungen.push('markt_B <= 0');
  if (!(b.nettoF.mittel > 0)) c.herabstufungen.push('nettoFenster_B <= 0');
  if (!poolOk || !eigenOk) c.urteil = 'belegt-aber-nullpunkt-verschoben';
  else if (!(b.markt.mittel > 0)) c.urteil = 'belegt, aber Marktzeit';
  else if (!(b.nettoF.mittel > 0)) c.urteil = 'belegt, aber Eroeffnungskosten';
  else { c.urteil = 'belegt'; c.handelbar = c.delta80 <= c.kKand; }
}
/** Rauschboden (Nachtrag 1b.2, nachrichtlich): se_B Placebo A / se_B Kandidat (brutto); bereinigt um die Signalzahl
 *  (se ~ 1/sqrt(Signale je Tag): x sqrt(nSig_P / nSig_K)), Erwartung ~ 1; auffaellig ausserhalb [0,5; 2]. Kein Urteil. */
function seVerhaeltnis(plBes, kandBes) {
  var aus = { plSeB: plBes ? plBes.seB : null, kandSeB: kandBes.brutto.se, nSigP: plBes ? plBes.nSig : 0, nSigK: kandBes.nSig, roh: null, bereinigt: null, auffaellig: false };
  if (!(aus.plSeB > 0) || !(aus.kandSeB > 0) || !(aus.nSigP > 0) || !(aus.nSigK > 0)) return aus;
  aus.roh = aus.plSeB / aus.kandSeB;
  aus.bereinigt = aus.roh * Math.sqrt(aus.nSigP / aus.nSigK);
  aus.auffaellig = aus.bereinigt < 0.5 || aus.bereinigt > 2;
  return aus;
}
/** Familie eines Detektors nach K.FAMILIEN. */
function familie(det) { return Object.keys(K.FAMILIEN).filter(function (f) { return K.FAMILIEN[f].indexOf(det) !== -1; })[0] || 'unbekannt'; }
/** Ueberlebensverzerrung (§7c): Differenz alle - lebend je Familie x ZR x H und je Familie x Klasse; Reihen- und Ende-Zahlen aus F.signale. */
function ueberleben(konf, F) {
  function mittelVon(w) { var v = w.filter(function (x) { return x != null; }); return { n: v.length, mittel: v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null }; }
  var jeZrH = [], jeKlasse = [];
  Object.keys(K.FAMILIEN).forEach(function (f) {
    K.ZEITRAHMEN.forEach(function (zr) { K.HALTEDAUERN.forEach(function (H) {
      var m = mittelVon(konf.filter(function (c) { return familie(c.det) === f && c.zr === zr.key && c.h === H.key; }).map(function (c) { return c.differenzLebend; }));
      jeZrH.push({ familie: f, zr: zr.key, h: H.key, nKonf: m.n, differenz: m.mittel });
    }); });
    K.KLASSEN.forEach(function (kl, k) {
      var m = mittelVon(konf.filter(function (c) { return familie(c.det) === f; }).map(function (c) { return c.differenzLebendKlasse[k]; }));
      jeKlasse.push({ familie: f, klasse: kl.name, nKonf: m.n, differenz: m.mittel });
    });
  });
  var reihen = { lebend: 0, nichtLebend: 0, ende: {}, gruppe: {} };
  Object.keys(F.signale || {}).forEach(function (r) {
    var s = F.signale[r]; if (s.lebend) reihen.lebend++; else reihen.nichtLebend++;
    var art = s.ende && s.ende.art ? s.ende.art : 'keine'; reihen.ende[art] = (reihen.ende[art] || 0) + 1;
    var g = (s.gruppe || 'unbekannt') + (s.lebend ? ' lebend' : ' nicht lebend'); reihen.gruppe[g] = (reihen.gruppe[g] || 0) + 1;
  });
  return { jeZrH: jeZrH, jeKlasse: jeKlasse, reihen: reihen };
}
/** Signalanteil (§4): je Detektor x ZR Summe, Reihen mit Signal, Median je Reihe (ueber alle Reihen und ueber Reihen mit Signal). */
function signalanteil(F) {
  var reihen = Object.keys(F.signale || {}), aus = [];
  var median = function (w) { return w.length ? w.slice().sort(function (a, b) { return a - b; })[w.length >> 1] : null; };
  K.DETEKTOR_KEYS.forEach(function (dk) { K.ZEITRAHMEN.forEach(function (zr, zi) {
    var alle = reihen.map(function (r) { var d = F.signale[r].det && F.signale[r].det[dk]; return d ? d[zi] || 0 : 0; }), mit = alle.filter(function (v) { return v > 0; });
    aus.push({ det: dk, zr: zr.key, reihenGesamt: reihen.length, reihenMitSignal: mit.length, summe: mit.reduce(function (a, b) { return a + b; }, 0), medianJeReihe: median(alle), medianJeReiheMitSignal: median(mit) });
  }); });
  return aus;
}
/** Klassenmix der Signale je ZR (Kandidaten-Zellen, beide Richtungen, Haltedauer 'schluss'): n je Klasse gesamt und in der Bestaetigung. */
function klassenmix(sp, ctx) {
  var aus = [];
  K.ZEITRAHMEN.forEach(function (zr, zi) {
    var ges = [0, 0, 0, 0], bes = [0, 0, 0, 0], leb = [0, 0, 0, 0];
    for (var dI = 0; dI < K.N_DET; dI++) for (var dirIdx = 0; dirIdx < 2; dirIdx++) {
      var basis = ((K.reiheIndex(K.kandIndex(dI, zi), 0) * 2 + dirIdx) * K.N_H + KLASSE_ZAEHL_H) * sp.nTage;
      for (var t = 0; t < sp.nTage; t++) for (var k = 0; k < K.N_K; k++) for (var l = 0; l < 2; l++) {
        var v = sp.n[((basis + t) * K.N_K + k) * 2 + l]; if (!(v > 0)) continue;
        ges[k] += v; if (t >= ctx.iBes && t >= ctx.iReg) bes[k] += v; if (l) leb[k] += v;
      }
    }
    aus.push({ zr: zr.key, gesamt: ges, bestaetigung: bes, lebend: leb });
  });
  return aus;
}
/** Realisierte se_B je ZR x H (dichtester Detektor nach Bes-Signalen und Median ueber Konfigurationen) gegen Plan A/B - Zugewinn, nicht vorregistriert. */
function seBGegenPlan(konf, z1) {
  var aus = [];
  K.ZEITRAHMEN.forEach(function (zr) { K.HALTEDAUERN.forEach(function (H) {
    var feld = konf.filter(function (c) { return c.zr === zr.key && c.h === H.key && c.alle.bes.netto.se != null; });
    var se = feld.map(function (c) { return c.alle.bes.netto.se; }).sort(function (a, b) { return a - b; });
    var dicht = feld.slice().sort(function (a, b) { return b.alle.bes.nSig - a.alle.bes.nSig; })[0];
    var med = se.length ? se[se.length >> 1] : null;
    aus.push({ zr: zr.key, h: H.key, nKonf: feld.length,
      dicht: dicht ? { det: dicht.det, richtung: dicht.richtung, nSigB: dicht.alle.bes.nSig, nTageB: dicht.alle.bes.nTage, seB: dicht.alle.bes.netto.se, mdeB: dicht.mdeB, delta80: dicht.delta80 } : null,
      median: { seB: med, mdeB: med != null ? 2 * med : null, delta80: med != null ? (z1 + Z_POWER80) * med : null },
      planA: PLAN_A[zr.key], planB: PLAN_B[H.key] });
  }); });
  return aus;
}

/* ---------- Ausgabe ---------- */
function pp(x) { return x == null || x !== x ? '–' : x.toFixed(4).replace('.', ','); }
function tw(x) { return x == null || x !== x ? '–' : x.toFixed(2).replace('.', ','); }
function ganz(x) { if (x == null || x !== x) return '–'; var s = String(Math.round(x)), aus = ''; while (s.replace('-', '').length > 3) { aus = '.' + s.slice(-3) + aus; s = s.slice(0, -3); } return s + aus; }
function jn(b) { return b ? 'ja' : 'nein'; }
function tabelle(kopf, zeilen) {
  var aus = ['| ' + kopf.join(' | ') + ' |', '|' + kopf.map(function () { return '---'; }).join('|') + '|'];
  zeilen.forEach(function (z) { aus.push('| ' + z.join(' | ') + ' |'); });
  return aus.join('\n') + '\n';
}
/** Flacht ein Zaehler-Objekt zu [Pfad, Wert]-Zeilen (Zahlen, Felder als a / b / c, Objekte rekursiv). */
function flach(obj, praefix) {
  var aus = [];
  Object.keys(obj || {}).forEach(function (k) {
    var v = obj[k], p = praefix ? praefix + '.' + k : k;
    if (typeof v === 'number') aus.push([p, ganz(v)]);
    else if (Array.isArray(v)) aus.push([p, v.map(function (x) { return typeof x === 'number' ? ganz(x) : String(x); }).join(' / ')]);
    else if (v && typeof v === 'object') { var u = flach(v, p); if (!u.length) aus.push([p, '{}']); else aus = aus.concat(u); }
    else aus.push([p, String(v)]);
  });
  return aus;
}
/** Die Markdown-Datei in der Reihenfolge des Auftrags: Herkunft, KONTROLLEN ZUERST, Zahlen, Tafel, Ueberleben, Regime, Signalanteil, se_B, Grenzen. */
function markdown(E, F, herkunft, kal, pilot) {
  var Z = F.zaehler || {}, wachhund = (F.ausgelassen || []).filter(function (a) { return /^Wachhund/.test(a.grund || ''); }).length, z = E.zahlen, o = [];
  o.push('# ' + (pilot ? 'PILOT-ERGEBNIS' : 'ERGEBNIS') + ': Signalstudie Minuten (' + K.KONFIG_KENNUNG + ')\n');
  o.push('Erzeugt ' + new Date().toISOString() + ' von `auswerten.js`. ' + (pilot ? '**PILOT / UNVOLLSTAENDIG - diese Zahlen sind kein Befund ueber den Markt.** ' : '') + 'Alles Simulation mit virtuellem Kapital, keine Anlageberatung. Pp = Prozentpunkte, Tagesmittel ungewichtet ueber Signaltage; Bericht rundet auf 4 Nachkommastellen, verglichen wurde ungerundet.\n');
  o.push('## 0. Herkunft und Zaehler\n');
  o.push(tabelle(['Ordner', 'Dateien', 'Reihen', 'GB', 'pilot', 'beendet', 'Teil', 'Reihen-Argument', 'Zellenstand', 'Kennung'],
    herkunft.map(function (h) { return [h.ordner, ganz(h.dateien), ganz(h.reihen), tw((h.bytes || 0) / 1e9), jn(h.pilot), h.beendet, h.teil ? h.teil.k + '/' + h.teil.n : '–', h.reihenArg ? h.reihenArg.join(' ') : '–', ganz(h.zellenStand), h.kennung]; })));
  var kopf = [['Dateien gesamt', ganz(F.dateien)], ['GB gesamt', tw((F.bytes || 0) / 1e9)], ['regulaere Kerzen', ganz(F.kerzenRegulaer)], ['Reihen mit Eintrag (F.signale)', ganz(Object.keys(F.signale || {}).length)],
    ['davon lebend / nicht lebend', ganz(E.ueberleben.reihen.lebend) + ' / ' + ganz(E.ueberleben.reihen.nichtLebend)], ['doppelt erledigte Dateien ueber die Teile', ganz(F.doppeltErledigt)],
    ['ausgelassen (Dateien)', ganz((F.ausgelassen || []).length)], ['davon Wachhund', ganz(wachhund)], ['ms lesen / rechnen', ganz(F.ms && F.ms.lesen) + ' / ' + ganz(F.ms && F.ms.rechnen)],
    ['Kalender: Tage / Entdeckung / Bestaetigung ab / Regime ab', ganz(kal.tage.length) + ' / ' + ganz(E.ctx.iBes) + ' / ' + K.BESTAETIGUNG_AB + ' / ' + K.REGIME_AB]];
  o.push(tabelle(['Groesse', 'Wert'], kopf));
  o.push('F.zaehler vollstaendig:\n');
  o.push(tabelle(['Zaehler', 'Wert'], flach(Z)));
  o.push('Reihen ausgeschlossen nach Wertpapierart (F.reihenAusgeschlossen):\n');
  o.push(tabelle(['Art', 'Reihen'], flach(F.reihenAusgeschlossen || {})));
  if ((F.ausgelassen || []).length) o.push(tabelle(['Ausgelassen', 'Grund'], F.ausgelassen.map(function (a) { return [a.datei, a.grund]; })));
  o.push('## 1. Kontrollen zuerst (§7, Nachtrag 2-3)\n\nPlacebo A gepoolt je (Zeitrahmen, Haltedauer) ueber alle 13 Detektoren und beide Richtungen, Mass je Signal dir_p · (rohLong_p − Topf); Band |t| < 3 und |Mittel| < 0,01 Pp, ueber alle Tage des Fensters. Faellt das gepoolte Band, wird in diesem (ZR, H) nichts „belegt" (nur „belegt-aber-nullpunkt-verschoben"). Eigen = je (Detektor, ZR, H) nur |t| < 3, faellt nur dieser Kandidat. Intraday-Drift = Topf-Tagesmittel (Long-Ertrag aller zulaessigen Kerzen), Placebo A misst per Zufallsrichtung keine Drift.\n');
  o.push(tabelle(['ZR', 'H', 'Placebo nTage', 'nSig', 'Mittel−Topf (Pp)', 'se', 't', 'im Band', 'eigen geprueft', 'eigen gefallen', 'Drift nTage', 'Drift Tagesmittel (Pp)', 'Drift sd', 'Drift t', 'Drift Bes nTage', 'Drift Bes Mittel', 'Topf Kerzen'],
    E.kontrollen.map(function (k) { var p = k.placebo, d = k.drift; return [k.zr, k.h, ganz(p.nTage), ganz(p.nSig), pp(p.gegenTopf), pp(p.se), tw(p.t), jn(k.imBand), ganz(k.eigenGeprueft), ganz(k.eigenGefallen), ganz(d.nTage), pp(d.mittel), pp(d.sd), tw(d.t), ganz(d.nTageB), pp(d.mittelB), ganz(d.kerzen)]; })));
  o.push('Gepoolte Placebo-Baender gefallen: **' + ganz(z.placeboPoolGefallen) + '** von ' + ganz(E.kontrollen.length) + '. Einzel-Placebos gefallen: **' + ganz(z.placeboEigenGefallen) + '**. Signalzellen ohne Topfzelle (aus der Marktgewichtung gefallen): ' + ganz(z.ohneTopf) + '.\n');
  o.push('Rauschboden (Nachtrag 1b.2, nachrichtlich): se_B(Placebo A, beide Richtungen, brutto) / se_B(Kandidat, brutto), bereinigt um die Signalzahl (× √(nSig_P/nSig_K), Erwartung ≈ 1); auffaellig ausserhalb [0,5; 2]: **' + ganz(z.seVerhaeltnisAuffaellig) + '** von ' + ganz(z.seVerhaeltnisGeprueft) + ' geprueften Konfigurationen - kein Urteilskriterium, Spalte „se PlA/Kand" in der Tafel.\n');
  o.push('## 2. Urteile in Zahlen (§6, Nachtrag 5-6, 20)\n');
  var uz = [['Konfigurationen', ganz(z.konfigurationen)], ['k1 (Tor 1 bestanden, Sicht alle)', ganz(z.k1)], ['z_Bonf(max(k1,1)) fuer delta80', tw(z.zBonfK1)], ['k2 (beide Tore)', ganz(z.k2)], ['z_Bonf(max(k2,1)) = Schwelle fuer t_B', tw(z.zBonfK2)]];
  URTEILE.forEach(function (u) { uz.push(['Urteil: ' + u, ganz(z.urteile[u])]); });
  uz.push(['handelbar (belegt und delta80 ≤ K_kand)', ganz(z.handelbar)]);
  Object.keys(z.groesse).forEach(function (g) { uz.push(['Groessenaussage (alle mit ≥ 30 Bes-Tagen): ' + g, ganz(z.groesse[g])]); });
  o.push(tabelle(['Groesse', 'Wert'], uz));
  o.push('## 3. Kandidatentafel - alle ' + z.konfigurationen + ' Konfigurationen, sortiert nach Entdeckungs-t (netto) absteigend\n\nEnt = Entdeckung (Tage < ' + K.BESTAETIGUNG_AB + '), Bes = Bestaetigung (Tage ≥ ' + K.BESTAETIGUNG_AB + ' und ≥ ' + K.REGIME_AB + '). netto = brutto − K_mitte der Klasse je Signal; nettoF = brutto − Einstiegsfenster-Huerde (Nachtrag 12); markt = brutto − dir·Topf (Nachtrag 2). K_kand aus den Signalzahlen je Klasse der Bestaetigung. Placebo A eigen ueber alle Tage; Kand−PlaceboB gepaart je Tag in der Bestaetigung (nachrichtlich). B2 = Vorzeichen Tagesmittel vs. signalgewichtet weichen ab. Short braucht Leihe, die Huerde ist dort eine Untergrenze.\n');
  var sortiert = E.konf.slice().sort(function (a, b) { var ta = a.alle.ent.netto.t, tb = b.alle.ent.netto.t; if (ta == null && tb == null) return 0; if (ta == null) return 1; if (tb == null) return -1; return tb - ta; });
  o.push(tabelle(['Detektor', 'ZR', 'Richtung', 'H', 'Ent nTage', 'Ent nSig', 'Ent brutto', 'Ent netto', 'Ent t', 'MDE_B', 'Tor1', 'K_kand', 'delta80', 'Tor2', 'Bes nTage', 'Bes nSig', 'Bes brutto', 'Bes netto', 'Bes nettoF', 'Bes markt', 'Bes t', 'obere Grenze', 'PlA Mittel', 'PlA t', 'se PlA/Kand', 'Kand−PlB', 'Kand−PlB t', 'B2', 'Urteil', 'Groesse'],
    sortiert.map(function (c) { var e = c.alle.ent, b = c.alle.bes, p = c.placeboA, q = c.alle.placeboB.bes, v = c.seVerhaeltnis;
      return [c.det, c.zr, c.richtung, c.h, ganz(e.nTage), ganz(e.nSig), pp(e.brutto.mittel), pp(e.netto.mittel), tw(e.netto.t), pp(c.mdeB), jn(c.tor1), pp(c.kKand), pp(c.delta80), jn(c.tor2),
        ganz(b.nTage), ganz(b.nSig), pp(b.brutto.mittel), pp(b.netto.mittel), pp(b.nettoF.mittel), pp(b.markt.mittel), tw(b.netto.t), pp(b.brutto.obere), pp(p.gegenTopf), tw(p.t), tw(v.bereinigt) + (v.auffaellig ? ' !' : ''), pp(q.mittel), tw(q.t),
        (e.netto.b2 || b.netto.b2) ? 'B2' : '', c.urteil + (c.handelbar ? ', handelbar' : '') + (c.herabstufungen.length ? ' [' + c.herabstufungen.join('; ') + ']' : ''), c.groesse]; })));
  o.push('## 4. Ueberlebensverzerrung (§7c): Bestaetigungs-Brutto-Tagesmittel Sicht alle − Sicht lebend\n\nNegativ = ein Archiv nur aus Lebenden haette die Familie beschoenigt (August-Anker Dip −3,78 Pp je Signaltag, Yahoo). Die Verschwundenen sind eine andere Grundgesamtheit (kleiner, billiger) - deshalb zusaetzlich je Umsatzklasse (Tagesreihen je Klasse). Mittel ueber die Konfigurationen der Familie mit beiden Sichten.\n');
  o.push(tabelle(['Familie', 'ZR', 'H', 'Konfigurationen', 'Differenz (Pp)'], E.ueberleben.jeZrH.map(function (u) { return [u.familie, u.zr, u.h, ganz(u.nKonf), pp(u.differenz)]; })));
  o.push(tabelle(['Familie', 'Umsatzklasse', 'Konfigurationen', 'Differenz (Pp)'], E.ueberleben.jeKlasse.map(function (u) { return [u.familie, u.klasse, ganz(u.nKonf), pp(u.differenz)]; })));
  var R = E.ueberleben.reihen;
  o.push('Reihen (F.signale): lebend ' + ganz(R.lebend) + ', nicht lebend ' + ganz(R.nichtLebend) + '. Ende-Arten (juengste Massnahme je Reihe): ' + Object.keys(R.ende).map(function (k) { return k + ' ' + ganz(R.ende[k]); }).join(', ') + '. Gruppen: ' + Object.keys(R.gruppe).map(function (k) { return k + ' ' + ganz(R.gruppe[k]); }).join(', ') + '.\n');
  o.push('## 5. Regimeschnitt der Entdeckung (§5, Diagnose, kein Filter): ≤ 2020 gegen ≥ 2021\n');
  o.push(tabelle(['Detektor', 'ZR', 'Richtung', 'H', '≤2020 nTage', '≤2020 brutto', '≤2020 netto', '≤2020 t', '≥2021 nTage', '≥2021 brutto', '≥2021 netto', '≥2021 t'],
    sortiert.filter(function (c) { return c.alle.ent.nSig > 0; }).map(function (c) { var a = c.alle.entBis2020, b = c.alle.entAb2021; return [c.det, c.zr, c.richtung, c.h, ganz(a.nTage), pp(a.brutto.mittel), pp(a.netto.mittel), tw(a.netto.t), ganz(b.nTage), pp(b.brutto.mittel), pp(b.netto.mittel), tw(b.netto.t)]; })));
  o.push('## 6. Signalanteil und Klassenmix (§4, vorab gezaehlt)\n');
  o.push(tabelle(['Detektor', 'ZR', 'Reihen gesamt', 'Reihen mit Signal', 'Signale', 'Median je Reihe', 'Median je Reihe mit Signal'], E.signalanteil.map(function (s) { return [s.det, s.zr, ganz(s.reihenGesamt), ganz(s.reihenMitSignal), ganz(s.summe), ganz(s.medianJeReihe), ganz(s.medianJeReiheMitSignal)]; })));
  o.push('Klassenmix der gewerteten Signale je Zeitrahmen (Kandidaten-Zellen, Haltedauer schluss), Klassen ' + K.KLASSEN.map(function (k) { return k.name; }).join(' / ') + ':\n');
  o.push(tabelle(['ZR', 'gesamt', 'Bestaetigung', 'lebend'], E.klassenmix.map(function (m) { return [m.zr, m.gesamt.map(ganz).join(' / '), m.bestaetigung.map(ganz).join(' / '), m.lebend.map(ganz).join(' / ')]; })));
  o.push('## 7. Realisierte se_B gegen den Plan (§9, Nachtrag 1 und 21) - ZUGEWINN, nicht vorregistriert\n\nPlan A je Zeitrahmen, Plan B je Haltedauer (beide 894 Tage, k = 5). Realisiert: se_B der Netto-Tagesreihe; „dicht" = Konfiguration mit den meisten Bestaetigungssignalen im Feld, Median ueber die Konfigurationen mit se_B; delta80 mit z_Bonf(max(k1,1)) = ' + tw(z.zBonfK1) + '.\n');
  o.push(tabelle(['ZR', 'H', 'Konf.', 'dicht: Detektor', 'dicht nSig_B', 'dicht nTage_B', 'dicht se_B', 'dicht MDE_B', 'dicht delta80', 'Median se_B', 'Median MDE_B', 'Median delta80', 'Plan A MDE / delta80', 'Plan B MDE / delta80'],
    E.seB.map(function (s) { var d = s.dicht || {}; return [s.zr, s.h, ganz(s.nKonf), d.det ? d.det + ' ' + d.richtung : '–', ganz(d.nSigB), ganz(d.nTageB), pp(d.seB), pp(d.mdeB), pp(d.delta80), pp(s.median.seB), pp(s.median.mdeB), pp(s.median.delta80), pp(s.planA.mde) + ' / ' + pp(s.planA.delta80), pp(s.planB.mde) + ' / ' + pp(s.planB.delta80)]; })));
  o.push('## 8. Was diese Zahlen nicht sagen (VORREGISTRIERUNG §12)\n');
  o.push('- Nichts ueber **neue Detektoren oder andere Parameter** - gemessen wird, was in der App steht.\n- Nichts ueber **Uebernacht**, **CFD**, **Scheine**, **Yahoo-Daten**, **60m**.\n- Nicht die **effektiven** Kosten (Schlupf, Tiefe, Teilfuellung): die notierte Spanne ist eine Untergrenze.\n- Kein **Ja** aus der Entdeckung, aus der marktbereinigten Nebengroesse, aus Placebo B oder aus einem Placebo-Abstand.\n- **Fuer blinde Zellen (§9) kein Nein** - nur Obergrenzen; „nicht entscheidbar" ist der Befund, kein Nein.\n- Nichts ueber die Zeit **vor 2016** und nichts ueber Werte, die auch Alpaca nicht fuehrt.\n' + (pilot ? '- **Dies ist ein Pilot- oder Teillauf.** Nichts hier ist ein Befund ueber den Markt.\n' : ''));
  return o.join('\n');
}

/* ---------- Hauptlauf ---------- */
/** Laedt, rechnet, schreibt Bericht und JSON in den ersten --aus-Ordner; Name nach Herkunft. */
function lauf(a) {
  if (!a.aus.length) { console.error('Pflichtargument --aus <ordner> fehlt (ein oder mehrere Messlauf-Ordner, relativ zu ' + K.HIER + ').'); process.exit(2); }
  selbsttestQuantil();
  var kal = K.kalender();
  if (kal.bestaetigungAb !== K.BESTAETIGUNG_AB) { console.error('Kalender-Split ' + kal.bestaetigungAb + ' != registriert ' + K.BESTAETIGUNG_AB + ' - Abbruch.'); process.exit(3); }
  var ordner = a.aus.map(function (o) { return path.resolve(K.HIER, o); });
  var t0 = Date.now(), G;
  try { G = ladeLaeufe(ordner, kal); } catch (e) { console.error('ABBRUCH: ' + e.message); process.exit(4); }
  var pilot = G.F.pilotIrgendwo || G.F.unvollstaendig;
  var E = auswerte(G.sp, G.F, kal);
  var mdName = pilot ? 'PILOT-ERGEBNIS.md' : 'ERGEBNIS.md', jsonName = pilot ? 'pilot-ergebnis.json' : 'ergebnis.json';
  var json = { erzeugt: new Date().toISOString(), kennung: K.KONFIG_KENNUNG, pilot: pilot, herkunft: G.herkunft,
    zaehler: G.F.zaehler, dateien: G.F.dateien, bytes: G.F.bytes, kerzenRegulaer: G.F.kerzenRegulaer, ausgelassen: G.F.ausgelassen, reihenAusgeschlossen: G.F.reihenAusgeschlossen, doppeltErledigt: G.F.doppeltErledigt,
    kalender: { nTage: kal.tage.length, bestaetigungAb: K.BESTAETIGUNG_AB, regimeAb: K.REGIME_AB, iBes: E.ctx.iBes, iReg: E.ctx.iReg, nEnt: kal.nEnt, nBes: kal.nBes },
    konstanten: { zPower80: Z_POWER80, minBesTage: MIN_BES_TAGE, tor1Faktor: TOR1_FAKTOR, bandT: BAND_T, bandPp: BAND_PP, jedeKlasseZu: JEDE_KLASSE_ZU, planA: PLAN_A, planB: PLAN_B },
    zahlen: E.zahlen, kontrollen: E.kontrollen, konfigurationen: E.konf, ueberleben: E.ueberleben, signalanteil: E.signalanteil, klassenmix: E.klassenmix, seB: E.seB };
  fs.writeFileSync(path.join(ordner[0], jsonName), JSON.stringify(json, null, 1));
  fs.writeFileSync(path.join(ordner[0], mdName), markdown(E, G.F, G.herkunft, kal, pilot));
  console.log((pilot ? 'PILOT ' : '') + 'geschrieben: ' + path.join(ordner[0], mdName) + ' und ' + jsonName + ' | ' + G.F.dateien + ' Dateien | k1=' + E.zahlen.k1 + ' k2=' + E.zahlen.k2 + ' | belegt ' + E.zahlen.urteile.belegt + ' | ' + Math.round((Date.now() - t0) / 1000) + ' s');
  return json;
}

module.exports = { lauf: lauf, argumente: argumente, normalQuantil: normalQuantil, zBonf: zBonf, selbsttestQuantil: selbsttestQuantil,
  ladeLaeufe: ladeLaeufe, summiere: summiere, tagesreihe: tagesreihe, poole: poole, momente: momente, statistik: statistik, auswerte: auswerte, urteil: urteil, markdown: markdown,
  URTEILE: URTEILE, MIN_BES_TAGE: MIN_BES_TAGE, Z_POWER80: Z_POWER80 };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
