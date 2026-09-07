'use strict';
/* AUSWERTEN - aus den Zellen eines oder mehrerer Messlaeufe die Tagesreihen, Tore, Bonferroni,
 * delta80, Placebo-Band, Topf-Nullpunkt, Ueberlebens-Differenz, Regimeschnitt und Obergrenzen
 * rechnen (VORREGISTRIERUNG §4-§7, §9, §11) und ERGEBNIS.md + ergebnis.json schreiben.
 *
 * Aufruf (von hier):  node auswerten.js --aus <ordner> [--aus <ordner2> ...]
 *   --aus   Ordner eines Messlaufs (relativ zu diesem Ordner) mit _fortschritt.json und _zellen.bin.
 *           Mehrere Ordner (Teil-Laeufe --teil k/n) werden durch Summieren der Zellen zusammengelegt.
 *           Die Kennung muss K.KONFIG_KENNUNG sein, sonst Abbruch. Ergebnis landet im ERSTEN Ordner.
 *
 * Getrennt vom Messen, damit die Auswertung ohne zweiten Archivlauf wiederholbar ist. Das Archiv wird
 * hier nur fuer den Kalender (_kalender.json) angefasst.
 *
 * DATEINAME SAGT DIE HERKUNFT (fehlerformen.md): ist irgendein Lauf pilot=true oder nicht 'vollstaendig'
 * beendet, heisst die Ausgabe PILOT-ERGEBNIS.md / pilot-ergebnis.json, sonst ERGEBNIS.md / ergebnis.json.
 *
 * ENTSCHEIDE DIESER DATEI (wo die Vorregistrierung Spielraum laesst, hier festgehalten):
 *   - Das Placebo-Band (§7a) gilt je (Zeitrahmen, Haltedauer) fuer das GEPOOLTE Placebo aller Kandidaten
 *     und beider Richtungen (Placebo - Richtung*Topf); das Placebo des einzelnen Kandidaten steht daneben
 *     in seiner Zeile, entscheidet aber nicht (ein duennes Placebo faellt am 0,01-Pp-Kriterium zufaellig).
 *   - se_B, MDE_B und t_B kommen aus der NETTO-Tagesreihe der Bestaetigung (das Urteil faellt ueber u).
 *   - Konfigurationen ohne ein einziges Signal heissen 'keine Signale' (§1: "0 Signale", kein Nein).
 *   - Fuer die Sicht 'alle' wird der Topf je (Klasse, lebend)-Zelle genommen, nicht ueber lebend gepoolt.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var M = require('./messen.js');

var Z_POWER80 = 0.8416;                       // Phi^-1(0,8): Messmaschine S2 zPower80
var MIN_BES_TAGE = 30;                        // §6: Bestaetigung ab 2021 mit >= 30 Signaltagen
var BAND_T = 3, BAND_PP = 0.01;               // §7a Placebo-Band
var JEDE_KLASSE_ZU = K.KLASSEN[K.KLASSEN.length - 1].huerde;   // 0,0449: obere Grenze darunter => in jeder Klasse zu
/* §9 Planzahlen (Tagesstreuung in Pp) - Rechnung A je Zeitrahmen, Rechnung B je Haltedauer, geplant 894 Tage. */
var PLAN_A_SD = { '1m': 0.338, '5m': 0.509, '15m': 0.706 };
var PLAN_B_SD = { '1h': 0.35, '3h': 0.60, 'schluss': 0.70 };
var PLAN_B_SD_DUENN = { '1h': 0.57, '3h': 0.80, 'schluss': 0.90 };
var PLAN_N_BES = 894;

/* ---------- Argumente ---------- */
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
/** Sperrklinke fuer das Quantil: die drei Zahlen aus §6 muessen herauskommen, sonst wird nichts gerechnet. */
function selbsttestQuantil() {
  var soll = [[1, 1.95996], [5, 2.80703], [20, 3.29053]];
  soll.forEach(function (s) { if (Math.abs(zBonf(s[0]) - s[1]) > 0.0005) throw new Error('Normalquantil verrechnet: z_Bonf(' + s[0] + ') = ' + zBonf(s[0]) + ', soll ' + s[1]); });
}

/* ---------- Laden und Zusammenlegen ---------- */
/** Feldweise Addition zweier Speicher (Teil-Laeufe). */
function addiere(sp, s2) {
  ['n', 's', 's2', 'tn', 'ts', 'ts2'].forEach(function (f) { var a = sp[f], b = s2[f]; for (var i = 0; i < a.length; i++) a[i] += b[i]; });
}
/** Rekursive Summe zweier Fortschritts-Teile: Zahlen addieren, Felder elementweise, Objekte je Schluessel, Rest bleibt. */
function summiere(a, b) {
  if (typeof a === 'number' && typeof b === 'number') return a + b;
  if (Array.isArray(a) && Array.isArray(b)) { var m = Math.max(a.length, b.length), aus = []; for (var i = 0; i < m; i++) aus.push(summiere(a[i], b[i])); return aus; }
  if (a && b && typeof a === 'object' && typeof b === 'object') { var o = {}; Object.keys(a).concat(Object.keys(b)).forEach(function (k) { if (!(k in o)) o[k] = summiere(a[k], b[k]); }); return o; }
  return a === undefined ? b : a;
}
/** Liest alle --aus-Ordner, prueft Kennung und Kalenderlaenge, summiert Zellen und Zaehler. */
function ladeLaeufe(ordner, kal) {
  var sp = null, F = null, herkunft = [];
  ordner.forEach(function (o) {
    var fp = path.join(o, '_fortschritt.json'), zp = path.join(o, '_zellen.bin');
    if (!fs.existsSync(fp) || !fs.existsSync(zp)) throw new Error('In ' + o + ' fehlt _fortschritt.json oder _zellen.bin.');
    var f = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (f.kennung !== K.KONFIG_KENNUNG) throw new Error('Kennung in ' + o + ' ist "' + f.kennung + '", diese Auswertung erwartet "' + K.KONFIG_KENNUNG + '" - anderer Stand der Studie, Abbruch.');
    if (f.nTage !== kal.tage.length) throw new Error('nTage ' + f.nTage + ' in ' + o + ' passt nicht zum Kalender (' + kal.tage.length + ') - Abbruch.');
    var s = M.Speicher.lade(zp, f.nTage);
    if (!sp) sp = s; else addiere(sp, s);
    herkunft.push({ ordner: o, dateien: f.dateien, bytes: f.bytes, reihen: Object.keys(f.signale || {}).length, pilot: !!f.pilot, beendet: f.beendet || 'offen', teil: f.teil || null, zellenStand: f.zellenStand });
    F = F ? summiere(F, f) : f;
  });
  F.pilotIrgendwo = herkunft.some(function (h) { return h.pilot; });
  F.unvollstaendig = herkunft.some(function (h) { return h.beendet !== 'vollstaendig'; });
  return { sp: sp, F: F, herkunft: herkunft };
}

/* ---------- Tagesreihen und Statistik (§4) ---------- */
/** Tagesreihe einer Zellenzeile (Reihe, Richtung, Haltedauer): je Tag mit Signalen n, s, nh (Summe Huerden),
 *  roh, netto, markt (roh - dir*Topf, nur ueber Zellen mit Topf; mN/mS sind deren Zaehler fuer das Poolen).
 *  sicht 'alle' = lebend 0+1, 'lebend' = nur 1; nurKlasse beschraenkt auf eine Umsatzklasse. */
function tagesreihe(sp, r, dirIdx, h, zrIdx, sicht, nurKlasse) {
  var nTage = sp.nTage, dir = dirIdx === 0 ? 1 : -1, aus = [], ohneTopf = 0;
  var lVon = sicht === 'lebend' ? 1 : 0;
  var kVon = nurKlasse == null ? 0 : nurKlasse, kBis = nurKlasse == null ? K.N_K - 1 : nurKlasse;
  var basisZ = ((r * 2 + dirIdx) * K.N_H + h) * nTage, basisT = (zrIdx * K.N_H + h) * nTage;
  for (var t = 0; t < nTage; t++) {
    var bz = (basisZ + t) * K.N_K * 2, bt = (basisT + t) * K.N_K * 2;
    var n = 0, s = 0, nh = 0, mN = 0, mS = 0;
    for (var k = kVon; k <= kBis; k++) for (var l = lVon; l <= 1; l++) {
      var i = bz + k * 2 + l, nz = sp.n[i];
      if (!(nz > 0)) continue;
      n += nz; s += sp.s[i]; nh += nz * K.KLASSEN[k].huerde;
      var it = bt + k * 2 + l;
      if (sp.tn[it] > 0) { mN += nz; mS += sp.s[i] - dir * nz * sp.ts[it] / sp.tn[it]; } else ohneTopf++;
    }
    if (!(n > 0)) continue;
    aus.push({ t: t, n: n, s: s, nh: nh, mN: mN, mS: mS, roh: s / n, netto: (s - nh) / n, markt: mN > 0 ? mS / mN : NaN });
  }
  aus.ohneTopf = ohneTopf;
  return aus;
}
/** Momente einer Menge von Tageswerten: Mittel (ungewichtet), sd, se, t, MDE = 2 se, 95-%-Grenzen. */
function momente(werte) {
  var n = werte.length, m = { n: n, mittel: null, sd: null, se: null, t: null, mde: null, obere: null, untere: null };
  if (!n) return m;
  var su = 0; for (var i = 0; i < n; i++) su += werte[i];
  m.mittel = su / n;
  if (n < 2) return m;
  var q = 0; for (var j = 0; j < n; j++) q += (werte[j] - m.mittel) * (werte[j] - m.mittel);
  m.sd = Math.sqrt(q / (n - 1)); m.se = m.sd / Math.sqrt(n); m.mde = 2 * m.se;
  m.obere = m.mittel + 1.96 * m.se; m.untere = m.mittel - 1.96 * m.se;
  m.t = m.se > 0 ? m.mittel / m.se : (m.mittel === 0 ? 0 : null);
  return m;
}
/** Statistik einer Tagesmenge: brutto/netto/markt-Momente, signalgewichtet jeSignal, K_kand, B2-Warnung. */
function statistik(zeilen) {
  var N = 0, S = 0, NH = 0;
  zeilen.forEach(function (z) { N += z.n; S += z.s; NH += z.nh; });
  var st = { nTage: zeilen.length, nSig: N,
    brutto: momente(zeilen.map(function (z) { return z.roh; })),
    netto: momente(zeilen.map(function (z) { return z.netto; })),
    markt: momente(zeilen.filter(function (z) { return z.markt === z.markt; }).map(function (z) { return z.markt; })),
    kKand: N > 0 ? NH / N : null };
  st.brutto.jeSignal = N > 0 ? S / N : null;
  st.netto.jeSignal = N > 0 ? (S - NH) / N : null;
  st.netto.b2 = st.netto.mittel != null && st.netto.jeSignal != null && Math.sign(st.netto.mittel) !== Math.sign(st.netto.jeSignal);
  return st;
}
function nurEnt(ctx) { return function (z) { return z.t < ctx.iBes; }; }
function nurBes(ctx) { return function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg; }; }

/* ---------- Eine Konfiguration (Detektor x Zeitrahmen x Richtung x Haltedauer) in einer Sicht ---------- */
/** Entdeckung, Bestaetigung (ab 2021), Diagnose <=2020 / >=2021 der Entdeckung, Placebo derselben Zeile. */
function rechneSicht(sp, ctx, dI, zi, dirIdx, h, sicht) {
  var kand = K.kandIndex(dI, zi);
  var reihe = tagesreihe(sp, K.reiheIndex(kand, false), dirIdx, h, zi, sicht, null);
  var pl = tagesreihe(sp, K.reiheIndex(kand, true), dirIdx, h, zi, sicht, null);
  var plSt = statistik(pl);
  return {
    ent: statistik(reihe.filter(nurEnt(ctx))),
    bes: statistik(reihe.filter(nurBes(ctx))),
    entBis2020: statistik(reihe.filter(function (z) { return z.t < ctx.iBes && z.t < ctx.iReg; })),
    entAb2021: statistik(reihe.filter(function (z) { return z.t < ctx.iBes && z.t >= ctx.iReg; })),
    placebo: { nTage: plSt.nTage, nSig: plSt.nSig, roh: plSt.brutto.mittel, gegenTopf: plSt.markt.mittel, t: plSt.markt.t,
      imBand: plSt.markt.mittel != null && plSt.markt.t != null && Math.abs(plSt.markt.t) < BAND_T && Math.abs(plSt.markt.mittel) < BAND_PP },
    ohneTopf: reihe.ohneTopf, placeboZeilen: pl,
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

/* ---------- Kontrollen (§7): Placebo-Band gepoolt und Topf-Drift je (Zeitrahmen, Haltedauer) ---------- */
/** Poolt Placebo-Tagesreihen mehrerer Zeilen tagweise; Rueckgabe Statistik (markt = Placebo - dir*Topf, roh = Placebo). */
function poolePlacebo(listen) {
  var je = {};
  listen.forEach(function (zl) { zl.forEach(function (z) {
    var p = je[z.t] || (je[z.t] = { t: z.t, n: 0, s: 0, nh: 0, mN: 0, mS: 0 });
    p.n += z.n; p.s += z.s; p.mN += z.mN; p.mS += z.mS;
  }); });
  var zeilen = Object.keys(je).map(function (t) { var p = je[t]; p.roh = p.s / p.n; p.netto = p.roh; p.markt = p.mN > 0 ? p.mS / p.mN : NaN; return p; });
  return statistik(zeilen);
}
/** Topf-Tagesmittel (Long-Ertrag aller zulaessigen Kerzen) je Tag, Sicht alle, ueber alle Klassen. */
function topfReihe(sp, zi, h) {
  var nTage = sp.nTage, basis = (zi * K.N_H + h) * nTage, aus = [];
  for (var t = 0; t < nTage; t++) {
    var b = (basis + t) * K.N_K * 2, n = 0, s = 0;
    for (var q = 0; q < K.N_K * 2; q++) { n += sp.tn[b + q]; s += sp.ts[b + q]; }
    if (n > 0) aus.push({ t: t, n: n, mittel: s / n });
  }
  return aus;
}

/* ---------- Die ganze Auswertung ---------- */
/** Rechnet alle 234 Konfigurationen in beiden Sichten, Tore, Urteile, Kontrollen, Differenzen, Signalanteil. */
function auswerte(sp, F, kal) {
  var ctx = { iBes: kal.idx[K.BESTAETIGUNG_AB], iReg: kal.idx[K.REGIME_AB] };
  if (ctx.iBes == null) throw new Error('BESTAETIGUNG_AB ' + K.BESTAETIGUNG_AB + ' ist kein Kalendertag.');
  if (ctx.iReg == null) { ctx.iReg = kal.tage.findIndex(function (t) { return t >= K.REGIME_AB; }); if (ctx.iReg < 0) throw new Error('REGIME_AB liegt hinter dem Kalender.'); }
  var dets = K.DETEKTOR_KEYS, konf = [], placeboJe = {};
  for (var dI = 0; dI < dets.length; dI++) for (var zi = 0; zi < K.N_ZR; zi++) for (var dirIdx = 0; dirIdx < 2; dirIdx++) for (var h = 0; h < K.N_H; h++) {
    var alle = rechneSicht(sp, ctx, dI, zi, dirIdx, h, 'alle'), lebend = rechneSicht(sp, ctx, dI, zi, dirIdx, h, 'lebend');
    var schl = zi + '/' + h; (placeboJe[schl] = placeboJe[schl] || { alle: [], long: [] }).alle.push(alle.placeboZeilen);
    if (dirIdx === 0) placeboJe[schl].long.push(alle.placeboZeilen);
    delete alle.placeboZeilen; delete lebend.placeboZeilen;
    konf.push({ det: dets[dI], zr: K.ZEITRAHMEN[zi].key, richtung: K.RICHTUNGEN[dirIdx].key, h: K.HALTEDAUERN[h].key, dI: dI, zi: zi, dirIdx: dirIdx, hi: h,
      alle: alle, lebend: { ent: lebend.ent, bes: lebend.bes, placebo: lebend.placebo },
      differenzLebend: alle.bes.brutto.mittel != null && lebend.bes.brutto.mittel != null ? alle.bes.brutto.mittel - lebend.bes.brutto.mittel : null,
      differenzLebendKlasse: klassenDifferenz(sp, ctx, K.reiheIndex(K.kandIndex(dI, zi), false), dirIdx, h, zi) });
  }
  /* Kontrollen zuerst: gepooltes Placebo-Band und Topf-Drift je (Zeitrahmen, Haltedauer). */
  var kontrollen = [], bandOk = {};
  for (var z2 = 0; z2 < K.N_ZR; z2++) for (var h2 = 0; h2 < K.N_H; h2++) {
    var s2 = z2 + '/' + h2, p = poolePlacebo(placeboJe[s2].alle), pl = poolePlacebo(placeboJe[s2].long);
    var ok = p.markt.mittel != null && p.markt.t != null && Math.abs(p.markt.t) < BAND_T && Math.abs(p.markt.mittel) < BAND_PP;
    bandOk[s2] = ok;
    var tr = topfReihe(sp, z2, h2), tm = momente(tr.map(function (x) { return x.mittel; }));
    var tmB = momente(tr.filter(function (x) { return x.t >= ctx.iBes && x.t >= ctx.iReg; }).map(function (x) { return x.mittel; }));
    kontrollen.push({ zr: K.ZEITRAHMEN[z2].key, h: K.HALTEDAUERN[h2].key, placebo: { nTage: p.nTage, nSig: p.nSig, gegenTopf: p.markt.mittel, se: p.markt.se, t: p.markt.t, imBand: ok, driftLong: pl.brutto.mittel, nTageLong: pl.nTage },
      topf: { nTage: tm.n, mittel: tm.mittel, sd: tm.sd, t: tm.t, kerzen: tr.reduce(function (a, x) { return a + x.n; }, 0), nTageB: tmB.n, sdB: tmB.sd, seB: tmB.se } });
  }
  /* Tore (§6): Tor 1 auf allen, k1; Tor 2 mit z_Bonf(k1), k2; Urteil mit z_Bonf(k2). */
  konf.forEach(function (c) {
    var e = c.alle.ent, b = c.alle.bes;
    c.mdeB = b.netto.mde; c.kKand = e.kKand;
    c.tor1 = e.netto.mittel != null && c.mdeB != null && e.netto.mittel > 0 && e.netto.mittel >= 4 * c.mdeB;
  });
  var k1 = konf.filter(function (c) { return c.tor1; }).length, z1 = zBonf(k1);
  konf.forEach(function (c) {
    c.delta80 = c.alle.bes.netto.se != null ? (z1 + Z_POWER80) * c.alle.bes.netto.se : null;
    c.tor2 = c.tor1 && c.delta80 != null && c.kKand != null && c.delta80 < c.kKand;
  });
  var k2 = konf.filter(function (c) { return c.tor2; }).length, z2u = zBonf(k2);
  konf.forEach(function (c) { urteil(c, z2u, bandOk[c.zi + '/' + c.hi]); });
  var zahlen = { k1: k1, k2: k2, zBonfK1: z1, zBonfK2: z2u, konfigurationen: konf.length };
  ['keine Signale', 'kein Kandidat', 'nicht entscheidbar', 'belegt', 'belegt, aber Marktzeit', 'belegt-aber-nullpunkt-verschoben'].forEach(function (u) { zahlen[u] = konf.filter(function (c) { return c.urteil === u; }).length; });
  zahlen.handelbar = konf.filter(function (c) { return c.handelbar; }).length;
  zahlen.widerlegtKlasse = konf.filter(function (c) { return c.groesse === 'in seiner Klasse zu'; }).length;
  zahlen.widerlegtJede = konf.filter(function (c) { return c.groesse === 'in jeder Klasse zu'; }).length;
  zahlen.groesseOffen = konf.filter(function (c) { return c.groesse === 'offen'; }).length;
  return { ctx: ctx, konf: konf, kontrollen: kontrollen, bandOk: bandOk, zahlen: zahlen,
    ueberleben: ueberleben(konf), signalanteil: signalanteil(F), seB: seBGegenPlan(konf, kontrollen) };
}
/** Urteil nach §6, woertlich: kein Kandidat / nicht entscheidbar / belegt (+Marktzeit, +Nullpunkt) und die Groessenaussage. */
function urteil(c, z2, bandOk) {
  var e = c.alle.ent, b = c.alle.bes;
  c.groesse = '-';
  if (b.nTage >= MIN_BES_TAGE && b.brutto.obere != null && c.kKand != null) {
    if (b.brutto.obere < JEDE_KLASSE_ZU) c.groesse = 'in jeder Klasse zu';
    else if (b.brutto.obere < c.kKand) c.groesse = 'in seiner Klasse zu';
    else c.groesse = 'offen';
  }
  c.handelbar = false;
  if (e.nSig === 0 && b.nSig === 0) { c.urteil = 'keine Signale'; return; }
  if (!c.tor1) { c.urteil = 'kein Kandidat'; return; }
  if (!c.tor2 || b.nTage < MIN_BES_TAGE) { c.urteil = 'nicht entscheidbar'; return; }
  var bestanden = b.netto.mittel != null && b.netto.mittel > 0 && b.netto.t != null && b.netto.t >= z2 && Math.sign(b.netto.mittel) === Math.sign(e.netto.mittel);
  if (bestanden) {
    if (!bandOk) c.urteil = 'belegt-aber-nullpunkt-verschoben';
    else if (!(b.markt.mittel > 0)) c.urteil = 'belegt, aber Marktzeit';
    else { c.urteil = 'belegt'; c.handelbar = c.delta80 <= c.kKand; }
    return;
  }
  c.urteil = 'nicht entscheidbar';                 // Band schliesst K_kand ein oder t_B zu klein; die Groessenaussage steht daneben
}
/** Ueberlebensverzerrung (§7c): Differenz alle - lebend je Familie x Zeitrahmen x Haltedauer und je Familie x Klasse. */
function ueberleben(konf) {
  function fam(det) { return Object.keys(K.FAMILIEN).filter(function (f) { return K.FAMILIEN[f].indexOf(det) !== -1; })[0] || 'unbekannt'; }
  function mittelVon(w) { var v = w.filter(function (x) { return x != null; }); return { n: v.length, mittel: v.length ? v.reduce(function (a, b) { return a + b; }, 0) / v.length : null }; }
  var jeZrH = [], jeKlasse = [];
  Object.keys(K.FAMILIEN).forEach(function (f) {
    K.ZEITRAHMEN.forEach(function (zr) { K.HALTEDAUERN.forEach(function (H) {
      var w = konf.filter(function (c) { return fam(c.det) === f && c.zr === zr.key && c.h === H.key; }).map(function (c) { return c.differenzLebend; });
      var m = mittelVon(w); jeZrH.push({ familie: f, zr: zr.key, h: H.key, nKonf: m.n, differenz: m.mittel });
    }); });
    K.KLASSEN.forEach(function (kl, k) {
      var w = konf.filter(function (c) { return fam(c.det) === f; }).map(function (c) { return c.differenzLebendKlasse[k]; });
      var m = mittelVon(w); jeKlasse.push({ familie: f, klasse: kl.name, nKonf: m.n, differenz: m.mittel });
    });
  });
  return { jeZrH: jeZrH, jeKlasse: jeKlasse };
}
/** Signalanteil (§4): aus F.signale je Detektor x Zeitrahmen Summe, Reihen mit Signal, Median je Reihe mit Signal. */
function signalanteil(F) {
  var reihen = Object.keys(F.signale || {}), aus = [];
  K.DETEKTOR_KEYS.forEach(function (dk) { K.ZEITRAHMEN.forEach(function (zr, zi) {
    var w = [];
    reihen.forEach(function (r) { var d = F.signale[r].det && F.signale[r].det[dk]; var v = d ? d[zi] || 0 : 0; if (v > 0) w.push(v); });
    w.sort(function (a, b) { return a - b; });
    aus.push({ det: dk, zr: zr.key, reihenGesamt: reihen.length, reihenMitSignal: w.length, summe: w.reduce(function (a, b) { return a + b; }, 0), medianJeReihe: w.length ? w[w.length >> 1] : null });
  }); });
  return aus;
}
/** Realisierte se_B (Median/min/max ueber die 26 Konfigurationen je Zeitrahmen x Haltedauer) gegen §9 Plan A/B - Zugewinn. */
function seBGegenPlan(konf, kontrollen) {
  var aus = [];
  K.ZEITRAHMEN.forEach(function (zr) { K.HALTEDAUERN.forEach(function (H) {
    var w = konf.filter(function (c) { return c.zr === zr.key && c.h === H.key && c.alle.bes.netto.se != null; }).map(function (c) { return c.alle.bes.netto.se; }).sort(function (a, b) { return a - b; });
    var nT = konf.filter(function (c) { return c.zr === zr.key && c.h === H.key; }).map(function (c) { return c.alle.bes.nTage; }).sort(function (a, b) { return a - b; });
    var ko = kontrollen.filter(function (k) { return k.zr === zr.key && k.h === H.key; })[0];
    aus.push({ zr: zr.key, h: H.key, nKonf: w.length, seMedian: w.length ? w[w.length >> 1] : null, seMin: w.length ? w[0] : null, seMax: w.length ? w[w.length - 1] : null,
      nTageBMedian: nT.length ? nT[nT.length >> 1] : null,
      planA: { sd: PLAN_A_SD[zr.key], se: PLAN_A_SD[zr.key] / Math.sqrt(PLAN_N_BES) }, planB: { sd: PLAN_B_SD[H.key], se: PLAN_B_SD[H.key] / Math.sqrt(PLAN_N_BES), sdDuenn: PLAN_B_SD_DUENN[H.key] },
      topfSdB: ko ? ko.topf.sdB : null, topfSeB: ko ? ko.topf.seB : null, topfNTageB: ko ? ko.topf.nTageB : null });
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
/** Die Markdown-Datei in der Reihenfolge des Auftrags: Herkunft, Kontrollen ZUERST, Zahlen, Tafel, Rest. */
function markdown(E, F, herkunft, kal, pilot) {
  var Z = F.zaehler || {}, wachhund = (F.ausgelassen || []).filter(function (a) { return /^Wachhund/.test(a.grund || ''); }).length;
  var o = [];
  o.push('# ' + (pilot ? 'PILOT-ERGEBNIS' : 'ERGEBNIS') + ': Signalstudie Minuten (' + K.KONFIG_KENNUNG + ')\n');
  o.push('Erzeugt ' + new Date().toISOString() + ' von `auswerten.js`. ' + (pilot ? '**PILOT / UNVOLLSTAENDIG - diese Zahlen sind kein Befund.** ' : '') + 'Alles Simulation mit virtuellem Kapital, keine Anlageberatung.\n');
  o.push('## 0. Herkunft und Zaehler\n');
  o.push(tabelle(['Ordner', 'Dateien', 'GB', 'Reihen', 'pilot', 'beendet', 'Teil', 'Zellenstand'], herkunft.map(function (h) { return [h.ordner, ganz(h.dateien), tw((h.bytes || 0) / 1e9), ganz(h.reihen), jn(h.pilot), h.beendet, h.teil ? h.teil.k + '/' + h.teil.n : '–', ganz(h.zellenStand)]; })));
  o.push(tabelle(['Groesse', 'Wert'], [
    ['Dateien gesamt', ganz(F.dateien)], ['GB gesamt', tw((F.bytes || 0) / 1e9)], ['regulaere Kerzen', ganz(F.kerzenRegulaer)], ['Reihen mit Eintrag', ganz(Object.keys(F.signale || {}).length)],
    ['ausgelassen (Dateien)', ganz((F.ausgelassen || []).length)], ['davon Wachhund', ganz(wachhund)], ['Tage ohne Klasse (< 20 Vortage oder < 5 Mio $)', ganz(Z.tageOhneKlasse)], ['Tage Massnahmen-Sperre', ganz(Z.tageMassnahmen)],
    ['Tage ohne Kalender', ganz(Z.tageOhneKalender)], ['ohne Horizont (1h / 3h / Schluss)', (Z.ohneHorizont || []).map(ganz).join(' / ')], ['ohne Einstieg', ganz(Z.ohneEinstieg)], ['Placebo gezogen', ganz(Z.placeboGezogen)],
    ['Kalender: Tage / Entdeckung / Bestaetigung ab / Regime ab', ganz(kal.tage.length) + ' / ' + ganz(E.ctx.iBes) + ' / ' + K.BESTAETIGUNG_AB + ' / ' + K.REGIME_AB]]));
  o.push('## 1. Kontrollen zuerst (§7)\n\nPlacebo gepoolt je (Zeitrahmen, Haltedauer), Mass: Tagesmittel von Placebo − Richtung·Topf; Band |t| < 3 und |Mittel| < 0,01 Pp. Faellt das Band, wird in diesem (Zeitrahmen, Haltedauer) nichts „belegt". Intraday-Drift = rohes Placebo-Tagesmittel (long) und Topf-Tagesmittel (Long-Ertrag aller zulaessigen Kerzen).\n');
  o.push(tabelle(['ZR', 'H', 'Placebo nTage', 'nSig', 'Mittel−Topf (Pp)', 'se', 't', 'im Band', 'Drift Placebo long (Pp)', 'Topf nTage', 'Topf Tagesmittel (Pp)', 'Topf sd', 'Topf Kerzen'],
    E.kontrollen.map(function (k) { return [k.zr, k.h, ganz(k.placebo.nTage), ganz(k.placebo.nSig), pp(k.placebo.gegenTopf), pp(k.placebo.se), tw(k.placebo.t), jn(k.placebo.imBand), pp(k.placebo.driftLong), ganz(k.topf.nTage), pp(k.topf.mittel), pp(k.topf.sd), ganz(k.topf.kerzen)]; })));
  var z = E.zahlen;
  o.push('## 2. Urteile in Zahlen (§6)\n');
  o.push(tabelle(['Groesse', 'Wert'], [['Konfigurationen', ganz(z.konfigurationen)], ['keine Signale', ganz(z['keine Signale'])], ['kein Kandidat (Tor 1)', ganz(z['kein Kandidat'])], ['nicht entscheidbar', ganz(z['nicht entscheidbar'])],
    ['belegt', ganz(z.belegt)], ['belegt, aber Marktzeit', ganz(z['belegt, aber Marktzeit'])], ['belegt-aber-nullpunkt-verschoben', ganz(z['belegt-aber-nullpunkt-verschoben'])], ['handelbar (belegt und delta80 ≤ K_kand)', ganz(z.handelbar)],
    ['widerlegt als Groesse: in seiner Klasse zu', ganz(z.widerlegtKlasse)], ['widerlegt als Groesse: in jeder Klasse zu (< 0,0449)', ganz(z.widerlegtJede)], ['Groesse offen (≥ 30 Bes-Tage, obere Grenze ≥ K_kand)', ganz(z.groesseOffen)],
    ['k1 (Tor 1 bestanden)', ganz(z.k1)], ['z_Bonf(k1)', tw(z.zBonfK1)], ['k2 (beide Tore)', ganz(z.k2)], ['z_Bonf(max(k2,1)) = Schwelle fuer t_B', tw(z.zBonfK2)]]));
  o.push('## 3. Kandidatentafel - alle ' + z.konfigurationen + ' Konfigurationen, sortiert nach Entdeckungs-t (netto) absteigend\n\nEnt = Entdeckung (Tage < ' + K.BESTAETIGUNG_AB + '), Bes = Bestaetigung (Tage ≥ ' + K.BESTAETIGUNG_AB + ' und ≥ ' + K.REGIME_AB + '). Pp-Werte sind Tagesmittel (ungewichtet ueber Signaltage). B2 = Vorzeichen von Tagesmittel und signalgewichtetem Mittel weichen ab. Short braucht Leihe; die Huerde ist dort eine Untergrenze. Groesse = Aussage ueber die obere 95-%-Grenze des Brutto-Tagesmittels_B, fuer alle mit ≥ 30 Bestaetigungstagen.\n');
  var sortiert = E.konf.slice().sort(function (a, b) { var ta = a.alle.ent.netto.t, tb = b.alle.ent.netto.t; if (ta == null && tb == null) return 0; if (ta == null) return 1; if (tb == null) return -1; return tb - ta; });
  o.push(tabelle(['Detektor', 'ZR', 'Richtung', 'H', 'Ent nTage', 'Ent nSig', 'Ent brutto', 'Ent netto', 'Ent t', 'MDE_B', 'Tor1', 'K_kand', 'delta80', 'Tor2', 'Bes nTage', 'Bes nSig', 'Bes brutto', 'Bes netto', 'Bes t', 'obere Grenze', 'markt_B', 'Bes brutto lebend', 'Placebo Mittel−Topf', 'Placebo t', 'B2', 'Urteil', 'Groesse'],
    sortiert.map(function (c) { var e = c.alle.ent, b = c.alle.bes, p = c.alle.placebo; return [c.det, c.zr, c.richtung, c.h, ganz(e.nTage), ganz(e.nSig), pp(e.brutto.mittel), pp(e.netto.mittel), tw(e.netto.t), pp(c.mdeB), jn(c.tor1), pp(c.kKand), pp(c.delta80), jn(c.tor2),
      ganz(b.nTage), ganz(b.nSig), pp(b.brutto.mittel), pp(b.netto.mittel), tw(b.netto.t), pp(b.brutto.obere), pp(b.markt.mittel), pp(c.lebend.bes.brutto.mittel), pp(p.gegenTopf), tw(p.t), (e.netto.b2 || b.netto.b2) ? 'B2' : '', c.urteil + (c.handelbar ? ', handelbar' : ''), c.groesse]; })));
  o.push('## 4. Ueberlebensverzerrung (§7c): Bestaetigungs-Brutto-Tagesmittel alle − lebend\n\nPositiv = das Archiv der Lebenden wuerde die Kante beschoenigen... nein: positiv heisst, ALLE Reihen liegen hoeher als die Lebenden; negativ heisst, ein Nur-Lebende-Archiv haette die Familie beschoenigt (August-Anker Dip −3,78 Pp je Signaltag, Yahoo). Die Verschwundenen sind eine andere Grundgesamtheit (kleiner, billiger); deshalb zusaetzlich je Umsatzklasse.\n');
  o.push(tabelle(['Familie', 'ZR', 'H', 'Konfigurationen mit beiden Sichten', 'Differenz (Pp)'], E.ueberleben.jeZrH.map(function (u) { return [u.familie, u.zr, u.h, ganz(u.nKonf), pp(u.differenz)]; })));
  o.push(tabelle(['Familie', 'Umsatzklasse', 'Konfigurationen', 'Differenz (Pp)'], E.ueberleben.jeKlasse.map(function (u) { return [u.familie, u.klasse, ganz(u.nKonf), pp(u.differenz)]; })));
  o.push('## 5. Regimeschnitt der Entdeckung (§5, Diagnose, kein Filter)\n');
  o.push(tabelle(['Detektor', 'ZR', 'Richtung', 'H', '≤2020 nTage', '≤2020 netto', '≤2020 t', '≥2021 nTage', '≥2021 netto', '≥2021 t'],
    sortiert.map(function (c) { var a = c.alle.entBis2020, b = c.alle.entAb2021; return [c.det, c.zr, c.richtung, c.h, ganz(a.nTage), pp(a.netto.mittel), tw(a.netto.t), ganz(b.nTage), pp(b.netto.mittel), tw(b.netto.t)]; })));
  o.push('## 6. Signalanteil je Detektor x Zeitrahmen (§4, vorab gezaehlt)\n');
  o.push(tabelle(['Detektor', 'ZR', 'Reihen gesamt', 'Reihen mit Signal', 'Signale', 'Median je Reihe mit Signal'], E.signalanteil.map(function (s) { return [s.det, s.zr, ganz(s.reihenGesamt), ganz(s.reihenMitSignal), ganz(s.summe), ganz(s.medianJeReihe)]; })));
  o.push('## 7. Realisierte se_B gegen den Plan (§9) - ZUGEWINN, nicht vorregistriert\n\nPlan A (je Zeitrahmen) und Plan B (je Haltedauer) rechnen mit 894 Bestaetigungstagen. Realisiert: Median/min/max der se_B (netto) ueber die Konfigurationen des Feldes; Topf sd_B = Streuung des Topf-Tagesmittels in der Bestaetigung (der Marktboden aus Rechnung B).\n');
  o.push(tabelle(['ZR', 'H', 'Konf. mit se_B', 'Bes nTage Median', 'se_B Median', 'se_B min', 'se_B max', 'Plan A sd / se', 'Plan B sd / se (dicht)', 'Plan B sd duenn', 'Topf sd_B', 'Topf se_B', 'Topf nTage_B'],
    E.seB.map(function (s) { return [s.zr, s.h, ganz(s.nKonf), ganz(s.nTageBMedian), pp(s.seMedian), pp(s.seMin), pp(s.seMax), pp(s.planA.sd) + ' / ' + pp(s.planA.se), pp(s.planB.sd) + ' / ' + pp(s.planB.se), pp(s.planB.sdDuenn), pp(s.topfSdB), pp(s.topfSeB), ganz(s.topfNTageB)]; })));
  o.push('## 8. Was diese Zahlen nicht sagen (VORREGISTRIERUNG §12)\n');
  o.push('- Nichts ueber **neue Detektoren oder andere Parameter** - gemessen wird, was in der App steht.\n- Nichts ueber **Uebernacht**, **CFD**, **Scheine**, **Yahoo-Daten**, **60m**.\n- Nicht die **effektiven** Kosten (Schlupf, Tiefe, Teilfuellung): die notierte Spanne ist eine Untergrenze.\n- Kein **Ja** aus der Entdeckung, aus der marktbereinigten Nebengroesse oder aus einem Placebo-Abstand.\n- **Fuer blinde Zellen (§9) kein Nein** - nur Obergrenzen.\n- Nichts ueber die Zeit **vor 2016** und nichts ueber Werte, die auch Alpaca nicht fuehrt.\n' + (pilot ? '- **Dies ist ein Pilot- oder Teillauf.** Nichts hier ist ein Befund ueber den Markt.\n' : ''));
  return o.join('\n');
}

/* ---------- Hauptlauf ---------- */
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
    zaehler: G.F.zaehler, dateien: G.F.dateien, bytes: G.F.bytes, kerzenRegulaer: G.F.kerzenRegulaer, ausgelassen: G.F.ausgelassen,
    kalender: { nTage: kal.tage.length, bestaetigungAb: K.BESTAETIGUNG_AB, regimeAb: K.REGIME_AB, iBes: E.ctx.iBes, iReg: E.ctx.iReg, nEnt: kal.nEnt, nBes: kal.nBes },
    konstanten: { zPower80: Z_POWER80, minBesTage: MIN_BES_TAGE, bandT: BAND_T, bandPp: BAND_PP, jedeKlasseZu: JEDE_KLASSE_ZU },
    zahlen: E.zahlen, kontrollen: E.kontrollen, bandOk: E.bandOk, konfigurationen: E.konf, ueberleben: E.ueberleben, signalanteil: E.signalanteil, seB: E.seB };
  fs.writeFileSync(path.join(ordner[0], jsonName), JSON.stringify(json, null, 1));
  fs.writeFileSync(path.join(ordner[0], mdName), markdown(E, G.F, G.herkunft, kal, pilot));
  console.log((pilot ? 'PILOT ' : '') + 'geschrieben: ' + path.join(ordner[0], mdName) + ' und ' + jsonName + ' | ' + G.F.dateien + ' Dateien | k1=' + E.zahlen.k1 + ' k2=' + E.zahlen.k2 + ' | belegt ' + E.zahlen.belegt + ' | ' + Math.round((Date.now() - t0) / 1000) + ' s');
  return json;
}

module.exports = { lauf: lauf, argumente: argumente, normalQuantil: normalQuantil, zBonf: zBonf, selbsttestQuantil: selbsttestQuantil,
  ladeLaeufe: ladeLaeufe, summiere: summiere, tagesreihe: tagesreihe, momente: momente, statistik: statistik, auswerte: auswerte, urteil: urteil, markdown: markdown };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
