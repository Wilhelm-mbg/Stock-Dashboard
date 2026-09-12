'use strict';
/* AUSWERTEN - Trendwende II: aus den Zellen eines oder mehrerer Messlaeufe die Tagesreihen, Tore (1, 2, Aktualitaet),
 * Bonferroni, delta80, Placebo-Baender je Skala, Topf-Nullpunkt, Schein-Zeilen, Jahresscheiben, Trend ueber die Jahre,
 * Regime-Sicht, Ueberlebens-Differenz, Vorwaertstest-Kandidaten und Obergrenzen rechnen und den Bericht schreiben
 * (VORREGISTRIERUNG §4-§11).
 *
 * HERKUNFT: Kopie von studien/vorregistrierung-2026-09-06-signale-minuten/auswerten.js (v4, 07.09.2026), geaendert:
 *   - Hauptgroesse u = dir·(rLong − Topf) − K (Vorrangregel der Kanalstudie, §5); n = r − K entscheidet "handelbar";
 *   - se ueber momente() der Kanalstudie (studien/vorregistrierung-2026-09-08-trendkanal-tage/auswerten.js, per require):
 *     intraday L = 1 (naiv), Uebernacht Hansen-Hodrick Rechteck bis Lag 1 (L = 2);
 *   - Schein-Zeilen (zwei Produkte), "handelbar mit Schein"; Aktualitaets-Tor; Kandidaten fuer den Vorwaertstest;
 *   - Jahresscheiben je Konfiguration (Kalenderjahr, letzte 250 Handelstage), Trendzeile, Regime SPY ueber/unter EMA200;
 *   - NACHTRAG 3 (12.09.2026): Einstiegsluecke aus den Kurszellen (luecke_B, netto_B lueckenbereinigt), verschaerftes
 *     Tor fuer `belegt`/`handelbar`, Vermerk "Extrem-Einstieg", Schein-Flagge heisst bei Short "handelbar mit Put".
 *   - NACHTRAG 4 (12.09.2026): Luecken-Tor sitzt auf u_B statt netto_B; Haltezeit von Kandidat und Topf aus den neuen
 *     Zellen, `uhrzeit_versatz` und das Tor darauf fuer "schluss"/"naechste"; Spiegel-Spalten als reine Diagnose.
 *
 * Aufruf (von hier):  node auswerten.js --aus <ordner> [--aus <ordner2> ...]
 *   Der Bericht landet im ERSTEN Ordner: PILOT-ERGEBNIS.md / pilot-ergebnis.json, wenn irgendein Lauf pilot=true oder
 *   nicht 'vollstaendig' beendet ist, sonst ERGEBNIS.md / ergebnis.json.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var M = require('./messen.js');
var L = require(path.join(K.MINUTEN, 'lesen.js'));
var KA = require(path.join(K.KANAL, 'auswerten.js'));          // momente(paare, L): Hansen-Hodrick, Newey-West, Block

var URTEILE = ['0 Signale', 'kein Kandidat', 'nicht entscheidbar', 'widerlegt als Groesse', 'nicht belegt: Aktualitaets-Tor', 'nicht belegt: Einstiegsluecke', 'nicht belegt: Uhrzeit-Versatz', 'belegt', 'belegt-aber-nullpunkt-verschoben', 'belegt, aber Eroeffnungskosten'];
function istZahl(x) { return typeof x === 'number' && x === x; }
var KLASSE_ZAEHL_H = 3;                                          // Klassenmix aus der Haltedauer 'schluss'

/* ---------- Argumente ---------- */
function argumente(argv) { var a = { aus: [] }; for (var i = 0; i < argv.length; i++) if (argv[i] === '--aus' && argv[i + 1]) a.aus.push(argv[++i]); return a; }

/* ---------- Normalquantil (Acklam) und Bonferroni ---------- */
function normalQuantil(p) {
  var a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  var b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  var c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  var d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  var pl = 0.02425, q, r;
  if (p < pl) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= 1 - pl) { q = p - 0.5; r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
function zBonf(k) { return normalQuantil(1 - 0.025 / Math.max(1, k || 1)); }
function selbsttestQuantil() {
  [[1, 1.960], [5, 2.576], [10, 2.807], [20, 3.023]].forEach(function (s) { if (Math.abs(zBonf(s[0]) - s[1]) > 0.002) throw new Error('Normalquantil verrechnet: z_Bonf(' + s[0] + ') = ' + zBonf(s[0]) + ', soll ' + s[1]); });
}

/* ---------- Laden und Zusammenlegen ---------- */
function ladeLaeufe(ordner, kal) {
  var sp = null, F = null, herkunft = [], erledigtWo = {}, zeitrahmen = new Set();
  ordner.forEach(function (o) {
    var fp = path.join(o, '_fortschritt.json'), zp = path.join(o, '_zellen.bin');
    if (!fs.existsSync(fp) || !fs.existsSync(zp)) throw new Error('Ordner ohne _fortschritt.json/_zellen.bin: ' + o);
    var Fi = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (Fi.kennung !== K.KONFIG_KENNUNG) throw new Error('Kennung ' + Fi.kennung + ' in ' + o + ' ist nicht ' + K.KONFIG_KENNUNG);
    if (Fi.nTage !== kal.tage.length) throw new Error('nTage ' + Fi.nTage + ' in ' + o + ' != Kalender ' + kal.tage.length);
    var spi = M.Speicher.lade(zp, kal.tage.length, Fi.zellenStand);
    herkunft.push({ ordner: o, dateien: Fi.dateien, reihen: Object.keys(Fi.signale || {}).length, bytes: Fi.bytes, pilot: !!Fi.pilot, beendet: Fi.beendet || 'laeuft/abgebrochen', teil: Fi.teil, reihenArg: Fi.reihenArg, zellenStand: Fi.zellenStand, kennung: Fi.kennung, zeitrahmen: Fi.zeitrahmen });
    (Fi.zeitrahmen || []).forEach(function (z) { zeitrahmen.add(z); });
    Object.keys(Fi.erledigt || {}).forEach(function (k) { erledigtWo[k] = (erledigtWo[k] || 0) + 1; });
    if (!sp) { sp = spi; F = Fi; F.pilotIrgendwo = !!Fi.pilot; F.unvollstaendig = Fi.beendet !== 'vollstaendig'; return; }
    var fa = sp.felder(), fb = spi.felder(); fa.forEach(function (a, q) { var b = fb[q]; for (var i = 0; i < a.length; i++) a[i] += b[i]; });
    F.dateien += Fi.dateien; F.bytes += Fi.bytes; F.kerzenRegulaer += Fi.kerzenRegulaer; F.ms.lesen += Fi.ms.lesen; F.ms.rechnen += Fi.ms.rechnen;
    F.ausgelassen = (F.ausgelassen || []).concat(Fi.ausgelassen || []);
    M.zaehlerAddieren(F.zaehler, Fi.zaehler || {});
    Object.keys(Fi.signale || {}).forEach(function (r) {
      var s = Fi.signale[r], t = F.signale[r]; if (!t) { F.signale[r] = s; return; }
      t.tage += s.tage;
      Object.keys(s.tageGewertet || {}).forEach(function (k) { t.tageGewertet[k] = (t.tageGewertet[k] || 0) + s.tageGewertet[k]; });
      Object.keys(s.tageGewertetKlasse || {}).forEach(function (k) { t.tageGewertetKlasse[k] = (t.tageGewertetKlasse[k] || 0) + s.tageGewertetKlasse[k]; });
      Object.keys(s.det || {}).forEach(function (dk) { var z = t.det[dk] || (t.det[dk] = [0, 0, 0]); for (var q = 0; q < 3; q++) z[q] += s.det[dk][q]; });
    });
    Object.keys(Fi.erledigt || {}).forEach(function (k) { F.erledigt[k] = 1; });
    F.pilotIrgendwo = F.pilotIrgendwo || !!Fi.pilot; F.unvollstaendig = F.unvollstaendig || Fi.beendet !== 'vollstaendig';
  });
  F.doppeltErledigt = Object.keys(erledigtWo).filter(function (k) { return erledigtWo[k] > 1; }).length;
  F.zeitrahmenFehlend = K.ZEITRAHMEN.map(function (z) { return z.key; }).filter(function (z) { return !zeitrahmen.has(z); });
  return { sp: sp, F: F, herkunft: herkunft };
}

/* ---------- Tagesreihen und Statistik (§5, §6) ---------- */
/** Tagesreihe einer Zellenzeile je Signaltag: n, s (Σ dir·r), nh (Σ Huerden), h2, nK, mN/mS/nhM/h2M (nur Zellen mit Topf),
 *  roh, netto (= n der Registrierung), nettoF, uBrutto = dir·(rLong − Topf), u = uBrutto − K, uF = uBrutto − h2. */
function tagesreihe(sp, r, dirIdx, h, zrIdx, sicht, nurKlasse) {
  var nTage = sp.nTage, dir = dirIdx === 0 ? 1 : -1, aus = [], ohneTopf = 0;
  var lVon = sicht === 'lebend' ? 1 : 0;
  var kVon = nurKlasse == null ? 0 : nurKlasse, kBis = nurKlasse == null ? K.N_K - 1 : nurKlasse;
  var basisZ = ((r * 2 + dirIdx) * K.N_H + h) * nTage, basisT = (zrIdx * K.N_H + h) * nTage;
  for (var t = 0; t < nTage; t++) {
    var bz = (basisZ + t) * K.N_K * 2, bt = (basisT + t) * K.N_K * 2;
    var n = 0, s = 0, nh = 0, h2 = 0, mN = 0, mS = 0, nhM = 0, h2M = 0, nK = [0, 0, 0, 0];
    for (var k = kVon; k <= kBis; k++) for (var l = lVon; l <= 1; l++) {
      var i = bz + k * 2 + l, nz = sp.n[i];
      if (!(nz > 0)) continue;
      n += nz; s += sp.s[i]; nh += nz * K.KLASSEN[k].huerde; h2 += sp.h2[i]; nK[k] += nz;
      var it = bt + k * 2 + l;
      if (sp.tn[it] > 0) { mN += nz; mS += sp.s[i] - dir * nz * sp.ts[it] / sp.tn[it]; nhM += nz * K.KLASSEN[k].huerde; h2M += sp.h2[i]; } else ohneTopf++;
    }
    if (!(n > 0)) continue;
    aus.push({ t: t, n: n, s: s, nh: nh, h2: h2, nK: nK, mN: mN, mS: mS, nhM: nhM, h2M: h2M, roh: s / n, netto: (s - nh) / n, nettoF: (s - h2) / n,
      uBrutto: mN > 0 ? mS / mN : NaN, u: mN > 0 ? (mS - nhM) / mN : NaN, uF: mN > 0 ? (mS - h2M) / mN : NaN });
  }
  aus.ohneTopf = ohneTopf;
  return aus;
}
function poole(listen) {
  var je = {};
  listen.forEach(function (zl) { zl.forEach(function (z) {
    var p = je[z.t] || (je[z.t] = { t: z.t, n: 0, s: 0, nh: 0, h2: 0, nK: [0, 0, 0, 0], mN: 0, mS: 0, nhM: 0, h2M: 0 });
    p.n += z.n; p.s += z.s; p.nh += z.nh; p.h2 += z.h2; p.mN += z.mN; p.mS += z.mS; p.nhM += z.nhM; p.h2M += z.h2M; for (var k = 0; k < K.N_K; k++) p.nK[k] += z.nK[k];
  }); });
  return Object.keys(je).map(Number).sort(function (a, b) { return a - b; }).map(function (t) {
    var p = je[t]; p.roh = p.s / p.n; p.netto = (p.s - p.nh) / p.n; p.nettoF = (p.s - p.h2) / p.n;
    p.uBrutto = p.mN > 0 ? p.mS / p.mN : NaN; p.u = p.mN > 0 ? (p.mS - p.nhM) / p.mN : NaN; p.uF = p.mN > 0 ? (p.mS - p.h2M) / p.mN : NaN; return p;
  });
}
/** Momente einer Reihe von Paaren {t, x} ueber momente() der Kanalstudie. L = 2: Hansen-Hodrick Rechteck bis Lag 1 (§6).
 *  L = 1: die NAIVE se sd/sqrt(n) mit (n-1) im Nenner, wie in der Minutenstudie registriert - momente() selbst setzt bei
 *  L = 1 se = sqrt(gamma_0/n) mit gamma_0 = q/n (Populationsvarianz, Faktor sqrt((n-1)/n) kleiner); der Unterschied ist bei
 *  894 Tagen 0,06 %, aber "= naive se" (§6) soll genau das heissen. */
function momente(paare, Lag) {
  var m = KA.momente(paare, Lag);
  if (Lag === 1 && m.n >= 2 && m.sd != null) {
    m.se = m.sd === 0 ? 0 : m.seNaiv; m.hh0 = false;
    m.mde = 2 * m.se; m.obere = m.mittel + 1.96 * m.se; m.untere = m.mittel - 1.96 * m.se;
    m.t = m.se > 0 ? m.mittel / m.se : (m.mittel === 0 ? 0 : null);
  }
  return m;
}
/** Momente eines Feldes einer Tagesmenge. */
function momenteVon(zeilen, feld, Lag) {
  return momente(zeilen.filter(function (z) { return z[feld] === z[feld]; }).map(function (z) { return { t: z.t, x: z[feld] }; }), Lag);
}
function statistik(zeilen, Lag) {
  var N = 0, S = 0, NH = 0, MN = 0, MS = 0, NHM = 0, nK = [0, 0, 0, 0];
  zeilen.forEach(function (z) { N += z.n; S += z.s; NH += z.nh; MN += z.mN; MS += z.mS; NHM += z.nhM; for (var k = 0; k < K.N_K; k++) nK[k] += z.nK[k]; });
  var st = { nTage: zeilen.length, nSig: N, nK: nK, brutto: momenteVon(zeilen, 'roh', Lag), netto: momenteVon(zeilen, 'netto', Lag), nettoF: momenteVon(zeilen, 'nettoF', Lag),
    uBrutto: momenteVon(zeilen, 'uBrutto', Lag), u: momenteVon(zeilen, 'u', Lag), uF: momenteVon(zeilen, 'uF', Lag), kKand: N > 0 ? NH / N : null };
  st.brutto.jeSignal = N > 0 ? S / N : null; st.netto.jeSignal = N > 0 ? (S - NH) / N : null; st.u.jeSignal = MN > 0 ? (MS - NHM) / MN : null;
  st.u.b2 = st.u.mittel != null && st.u.jeSignal != null && Math.sign(st.u.mittel) !== Math.sign(st.u.jeSignal);
  return st;
}
/** Schein-Zeile (§4): Brutto-Tagesmittel minus Schein-Huerde der Haltedauer; t und obere Grenze mit derselben se. */
function scheinWerte(st, produkt, hKey) {
  var hu = K.scheinHuerde(produkt, hKey), b = st.brutto;
  return { huerde: hu, mittel: b.mittel != null ? b.mittel - hu : null, t: b.se > 0 && b.mittel != null ? (b.mittel - hu) / b.se : null, obere: b.obere != null ? b.obere - hu : null };
}
function nurEnt(ctx) { return function (z) { return z.t < ctx.iBes; }; }
function nurBes(ctx) { return function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg; }; }
/** Placebo-Band je Skala (§8): |t| < 3; gepoolt zusaetzlich |Mittel| < 0,045 Pp intraday bzw. < 3·se_erwartet Uebernacht. */
function imBand(m, h, mitAbsolut) {
  if (m.mittel == null || m.t == null) return false;
  if (Math.abs(m.t) >= K.BAND_T) return false;
  if (!mitAbsolut) return true;
  if (K.HALTEDAUERN[h].uebernacht) return K.SE_ERWARTET_NAECHSTE == null ? true : Math.abs(m.mittel) < 3 * K.SE_ERWARTET_NAECHSTE;
  return Math.abs(m.mittel) < K.BAND_PP;
}

/* ---------- Eine Konfiguration in einer Sicht ---------- */
function rechneSicht(sp, ctx, dI, zi, dirIdx, h, sicht, Lag) {
  var kand = K.kandIndex(dI, zi);
  var reihe = tagesreihe(sp, K.reiheIndex(kand, 0), dirIdx, h, zi, sicht, null);
  var plA = tagesreihe(sp, K.reiheIndex(kand, 1), dirIdx, h, zi, sicht, null);
  var plB = tagesreihe(sp, K.reiheIndex(kand, 2), dirIdx, h, zi, sicht, null);
  var jeTagB = {}; plB.forEach(function (z) { jeTagB[z.t] = z.roh; });
  var paare = reihe.filter(function (z) { return jeTagB[z.t] !== undefined; }).map(function (z) { return { t: z.t, x: z.roh - jeTagB[z.t] }; });
  return {
    ent: statistik(reihe.filter(nurEnt(ctx)), Lag),
    bes: statistik(reihe.filter(nurBes(ctx)), Lag),
    entBis2020: statistik(reihe.filter(function (z) { return z.t < ctx.iBes && z.t < ctx.iReg; }), Lag),
    entAb2021: statistik(reihe.filter(function (z) { return z.t < ctx.iBes && z.t >= ctx.iReg; }), Lag),
    placeboB: { nSig: plB.reduce(function (a, z) { return a + z.n; }, 0), nTage: plB.length, alle: momente(paare, Lag), bes: momente(paare.filter(nurBes(ctx)), Lag) },
    ohneTopf: reihe.ohneTopf, placeboAZeilen: plA, reihe: reihe,
  };
}
/* ---------- Einstiegsluecke (NACHTRAG 3, 12.09.2026) ----------
 * Kurszellen tragen seit Kennung v2 Σ dir·(Eroeffnung i+1 − Schluss i)/Schluss i·100 je (Kandidat, Richtung, Tag,
 * Klasse, lebend) - ohne Haltedauer, die Luecke haengt nur am EINSTIEG. Alle fuenf Haltedauern einer (Detektor, ZR,
 * Richtung) teilen deshalb dieselbe Luecke. */
function lueckeReihe(sp, kand, dirIdx, sicht) {
  var nTage = sp.nTage, lVon = sicht === 'lebend' ? 1 : 0, aus = [], basis = (kand * 2 + dirIdx) * nTage;
  if (!sp.kl) return aus;
  for (var t = 0; t < nTage; t++) {
    var b = (basis + t) * K.N_K * 2, n = 0, s = 0;
    for (var k = 0; k < K.N_K; k++) for (var l = lVon; l <= 1; l++) { var i = b + k * 2 + l; n += sp.kn[i]; s += sp.kl[i]; }
    if (n > 0) aus.push({ t: t, n: n, mittel: s / n });
  }
  return aus;
}
/** Luecke in der Bestaetigung und das lueckenbereinigte Netto je Signaltag: netto_t − luecke_t (gleiche Skala, sonst
 *  gibt es kein t); daneben das vom PM verlangte Mittel je Signal. */
function luecken(sp, ctx, kand, dirIdx, reihe, Lag) {
  var zl = lueckeReihe(sp, kand, dirIdx, 'alle'), jeTag = {}, N = 0, S = 0;
  zl.forEach(function (z) { jeTag[z.t] = z.mittel; });
  var besZ = zl.filter(nurBes(ctx));
  besZ.forEach(function (z) { N += z.n; S += z.n * z.mittel; });
  var paare = [], paareU = [], ohneKurs = 0, ohneU = 0;
  reihe.filter(nurBes(ctx)).forEach(function (z) {
    if (jeTag[z.t] === undefined) { ohneKurs++; ohneU++; return; }
    if (istZahl(z.netto)) paare.push({ t: z.t, x: z.netto - jeTag[z.t] }); else ohneKurs++;
    /* NACHTRAG 4.1: dasselbe auf der HAUPTGROESSE u - darauf sitzt das Tor. Tage ohne Topf haben kein u. */
    if (istZahl(z.u)) paareU.push({ t: z.t, x: z.u - jeTag[z.t] }); else ohneU++;
  });
  return { jeSignal: N > 0 ? S / N : null, nSig: N, nTage: besZ.length, ohneKurs: ohneKurs, ohneU: ohneU,
    tagesmittel: momente(besZ.map(function (z) { return { t: z.t, x: z.mittel }; }), Lag), bereinigt: momente(paare, Lag), bereinigtU: momente(paareU, Lag) };
}

/* ---------- Haltezeit und Uhrzeit-Versatz (NACHTRAG 4, 12.09.2026, §19.2/§19.3) ----------
 * Haltezeitzellen tragen (Zahl, Σ Haltezeit in Sitzungsminuten) je (Kandidat, Richtung, HALTEDAUER, Tag, Klasse,
 * lebend); der Topf traegt Σ Haltezeit als viertes Feld. Der Topf wird auf GENAU DIE Zellen eingeschraenkt, in denen
 * der Kandidat an diesem Tag Signale hat - sonst misst der Versatz den Tagesmix (Halbtage, Jahre) statt der Uhrzeit. */
function haltezeitWerte(sp, ctx, kand, dirIdx, zi, h, sicht) {
  var nTage = sp.nTage, lVon = sicht === 'lebend' ? 1 : 0;
  var aus = { nTage: 0, nKand: 0, nTopf: 0, kand: null, topf: null, versatz: null };
  if (!sp.hzn || !sp.thz) return aus;
  var sK = 0, sT = 0, basisH = ((kand * 2 + dirIdx) * K.N_H + h) * nTage, basisT = (zi * K.N_H + h) * nTage;
  for (var t = 0; t < nTage; t++) {
    if (!(t >= ctx.iBes && t >= ctx.iReg)) continue;
    var bh = (basisH + t) * K.N_K * 2, bt = (basisT + t) * K.N_K * 2, mit = false;
    for (var k = 0; k < K.N_K; k++) for (var l = lVon; l <= 1; l++) {
      var i = bh + k * 2 + l, n = sp.hzn[i];
      if (!(n > 0)) continue;
      mit = true; aus.nKand += n; sK += sp.hzs[i];
      var it = bt + k * 2 + l; aus.nTopf += sp.tn[it]; sT += sp.thz[it];
    }
    if (mit) aus.nTage++;
  }
  aus.kand = aus.nKand > 0 ? sK / aus.nKand : null;
  aus.topf = aus.nTopf > 0 ? sT / aus.nTopf : null;
  aus.versatz = (aus.kand != null && aus.topf > 0) ? aus.kand / aus.topf - 1 : null;
  return aus;
}
/** Spiegel-Spalten (NACHTRAG 4.4): Werte der Gegenrichtung und das Tagesmittel von (u_long,t + u_short,t) ueber die
 *  Tage, an denen BEIDE Richtungen ein Signal haben. REINE DIAGNOSE - daraus folgt kein Urteil. Verbraucht `uBesTag`
 *  (die Tagesreihe von u in der Bestaetigung) und raeumt sie danach weg, damit die JSON-Ausgabe nicht aufblaeht. */
function spiegelSpalten(konf) {
  var jeSchluessel = {};
  konf.forEach(function (c) { jeSchluessel[c.det + '|' + c.zr + '|' + c.h + '|' + c.richtung] = c; });
  konf.forEach(function (c) {
    var g = jeSchluessel[c.det + '|' + c.zr + '|' + c.h + '|' + (c.richtung === 'long' ? 'short' : 'long')];
    if (!g) { c.spiegel = { vorhanden: false, u: null, t: null, nTage: 0, summe: { mittel: null, se: null, t: null } }; return; }
    var jeTag = {}; (g.uBesTag || []).forEach(function (p) { jeTag[p.t] = p.x; });
    var paare = (c.uBesTag || []).filter(function (p) { return jeTag[p.t] !== undefined; }).map(function (p) { return { t: p.t, x: p.x + jeTag[p.t] }; });
    var m = momente(paare, K.lagVon(c.hi));
    c.spiegel = { vorhanden: true, u: g.alle.bes.u.mittel, t: g.alle.bes.u.t, nTage: paare.length, summe: { mittel: m.mittel, se: m.se, t: m.t } };
  });
  konf.forEach(function (c) { delete c.uBesTag; });
  return konf;
}
function klassenDifferenz(sp, ctx, r, dirIdx, h, zi, Lag) {
  var aus = [];
  for (var k = 0; k < K.N_K; k++) {
    var a = statistik(tagesreihe(sp, r, dirIdx, h, zi, 'alle', k).filter(nurBes(ctx)), Lag).brutto.mittel;
    var l = statistik(tagesreihe(sp, r, dirIdx, h, zi, 'lebend', k).filter(nurBes(ctx)), Lag).brutto.mittel;
    aus.push(a != null && l != null ? a - l : null);
  }
  return aus;
}

/* ---------- Kontrollen: Placebo A gegen den Topf, Topf-Drift ---------- */
function placeboMomente(listen, Lag) {
  var z = poole(listen), st = statistik(z, Lag);
  return { nTage: st.nTage, nSig: st.nSig, roh: st.brutto.mittel, mittel: st.uBrutto.mittel, gegenTopf: st.uBrutto.mittel, se: st.uBrutto.se, t: st.uBrutto.t, ohneTopf: st.nTage - st.uBrutto.n };
}
function topfReihe(sp, zi, h, sicht) {
  var nTage = sp.nTage, basis = (zi * K.N_H + h) * nTage, aus = [], lVon = sicht === 'lebend' ? 1 : 0;
  for (var t = 0; t < nTage; t++) {
    var b = (basis + t) * K.N_K * 2, n = 0, s = 0;
    for (var k = 0; k < K.N_K; k++) for (var l = lVon; l <= 1; l++) { n += sp.tn[b + k * 2 + l]; s += sp.ts[b + k * 2 + l]; }
    if (n > 0) aus.push({ t: t, n: n, mittel: s / n });
  }
  return aus;
}
function drift(sp, ctx, zi, h) {
  var tr = topfReihe(sp, zi, h, 'alle'), Lag = K.lagVon(h), w = function (zl) { return zl.map(function (x) { return { t: x.t, x: x.mittel }; }); };
  var alle = momente(w(tr), Lag), bes = momente(w(tr.filter(nurBes(ctx))), Lag);
  return { nTage: alle.n, mittel: alle.mittel, sd: alle.sd, se: alle.se, t: alle.t, kerzen: tr.reduce(function (a, x) { return a + x.n; }, 0), nTageB: bes.n, mittelB: bes.mittel, sdB: bes.sd, seB: bes.se, tB: bes.t };
}

/* ---------- Regime (§9c): SPY ueber/unter EMA200 auf Tagesbasis, aus dem Archiv (nur lesen) ---------- */
/** regime[Kalenderindex] = 1 (SPY-Schluss > EMA200 einschliesslich des Tages), 0 (<=), -1 (Vorlauf/kein SPY-Tag). */
function spyRegime(kal, laden) {
  var m = L.meta(), e = m.lebenszeit.SPY;
  if (!e) return null;
  var R = { reihe: 'SPY', ordner: L.ordnerFuer('SPY'), lebend: 1, jahre: (e.jahre || []).slice().sort(), gruppe: 'etf', art: 'ETF', schnittMs: null, abMs: null };
  var schluss = {}, dateien = 0;
  R.jahre.forEach(function (j) {
    if (j < +K.FENSTER.von.slice(0, 4) || j > +K.FENSTER.bis.slice(0, 4)) return;
    var g = (laden || L.ladeJahr)(R, j); if (!g.ok) return; dateien++;
    L.tageAus(g.kerzen).forEach(function (d) { schluss[d.tag] = g.kerzen[d.bis][1]; });
  });
  return regimeAusSchluessen(kal, schluss, dateien);
}
function regimeAusSchluessen(kal, schluss, dateien) {
  var reg = new Int8Array(kal.tage.length).fill(-1), N = K.EMA_N, alpha = 2 / (N + 1), ema = NaN, summe = 0, zahl = 0, ueber = 0, unter = 0;
  kal.tage.forEach(function (tag, i) {
    var c = schluss[tag]; if (!(c > 0)) return;
    zahl++;
    if (zahl <= N) { summe += c; if (zahl === N) ema = summe / N; return; }
    ema = c * alpha + ema * (1 - alpha);
    reg[i] = c > ema ? 1 : 0; if (reg[i]) ueber++; else unter++;
  });
  return { regime: reg, spyTage: zahl, ueber: ueber, unter: unter, unbekannt: kal.tage.length - ueber - unter, dateien: dateien || 0 };
}

/* ---------- Jahresscheiben und Trend (§9a/b) ---------- */
function scheibe(z, Lag, name, hKey) {
  var st = statistik(z, Lag), duenn = st.nTage < K.JAHR_MIN_TAGE;
  return { jahr: name, nTage: st.nTage, nSig: st.nSig, u: st.u.mittel, se: st.u.se, t: duenn ? null : st.u.t, duenn: duenn, brutto: st.brutto.mittel, netto: st.netto.mittel,
    schein1: st.brutto.mittel != null ? st.brutto.mittel - K.scheinHuerde('bv1', hKey) : null, hh0: !!st.u.hh0 };
}
function jahresscheiben(reihe, Lag, ctx, hKey) {
  var aus = K.JAHRE.map(function (j) { return scheibe(reihe.filter(function (x) { return ctx.jahr[x.t] === j; }), Lag, String(j), hKey); });
  aus.push(scheibe(reihe.filter(function (x) { return x.t >= ctx.nTage - K.AKTUELL_TAGE; }), Lag, 'letzte ' + K.AKTUELL_TAGE, hKey));
  return aus;
}
/** OLS-Steigung des Jahresmittels u ueber die Jahresnummer (2016 = 0), nur Jahre mit >= TREND_MIN_TAGE Signaltagen. */
function trend(jahre) {
  var p = jahre.filter(function (j) { return /^\d{4}$/.test(j.jahr) && j.nTage >= K.TREND_MIN_TAGE && j.u === j.u && j.u != null; }).map(function (j) { return { x: +j.jahr - K.JAHRE[0], y: j.u }; });
  var n = p.length; if (n < K.TREND_MIN_JAHRE) return { n: n, steigung: null, se: null, t: null };
  var sx = 0, sy = 0; p.forEach(function (q) { sx += q.x; sy += q.y; }); var mx = sx / n, my = sy / n, sxx = 0, sxy = 0;
  p.forEach(function (q) { sxx += (q.x - mx) * (q.x - mx); sxy += (q.x - mx) * (q.y - my); });
  if (!(sxx > 0)) return { n: n, steigung: null, se: null, t: null };
  var b = sxy / sxx, a = my - b * mx, ss = 0; p.forEach(function (q) { var r = q.y - a - b * q.x; ss += r * r; });
  var se = n > 2 ? Math.sqrt(ss / (n - 2) / sxx) : null;
  return { n: n, steigung: b, se: se, t: se > 0 ? b / se : null };
}

/* ---------- Die ganze Auswertung ---------- */
function centBoden(sp, kal) {
  if (!sp.kn) return [];
  var nT = kal.tage.length, aus = [];
  K.ZEITRAHMEN.forEach(function (zr, zi) {
    K.KLASSEN.forEach(function (kl, ki) {
      var n = 0, s = 0, cb = 0, lu = 0;
      for (var di = 0; di < K.N_DET; di++) for (var dir = 0; dir < 2; dir++) for (var t = 0; t < nT; t++) for (var le = 0; le < 2; le++) {
        var idx = K.kursZelle(nT, K.kandIndex(di, zi), dir, t, ki, le);
        n += sp.kn[idx]; s += sp.ks[idx]; cb += sp.kcb[idx]; lu += sp.kl ? sp.kl[idx] : 0;
      }
      if (n > 0) aus.push({ zr: zr.key, klasse: kl.name, n: n, mittelKurs: s / n, bodenBeimMittel: K.centBodenPp(s / n), huerde: kl.huerde, anteilUeber: cb / n, luecke: lu / n });
    });
  });
  return aus;
}
function auswerte(sp, F, kal, regimeInfo) {
  var ctx = { iBes: kal.idx[K.BESTAETIGUNG_AB], iReg: kal.idx[K.REGIME_AB], nTage: kal.tage.length, jahr: new Int16Array(kal.tage.length), regime: regimeInfo ? regimeInfo.regime : null };
  if (ctx.iBes == null) throw new Error('BESTAETIGUNG_AB ' + K.BESTAETIGUNG_AB + ' ist kein Kalendertag.');
  if (ctx.iReg == null) { ctx.iReg = kal.tage.findIndex(function (t) { return t >= K.REGIME_AB; }); if (ctx.iReg < 0) throw new Error('REGIME_AB liegt hinter dem Kalender.'); }
  kal.tage.forEach(function (t, i) { ctx.jahr[i] = +t.slice(0, 4); });
  ctx.aktuellAb = kal.tage[Math.max(0, ctx.nTage - K.AKTUELL_TAGE)];
  var dets = K.DETEKTOR_KEYS, konf = [], plEigen = {}, plPool = {};
  for (var dI = 0; dI < dets.length; dI++) for (var zi = 0; zi < K.N_ZR; zi++) for (var dirIdx = 0; dirIdx < 2; dirIdx++) for (var h = 0; h < K.N_H; h++) {
    if (K.NUR_LONG[dets[dI]] && dirIdx === 1) continue;
    var Lag = K.lagVon(h), hKey = K.HALTEDAUERN[h].key;
    var alle = rechneSicht(sp, ctx, dI, zi, dirIdx, h, 'alle', Lag), lebend = rechneSicht(sp, ctx, dI, zi, dirIdx, h, 'lebend', Lag);
    var sE = dI + '/' + zi + '/' + h, sP = zi + '/' + h;
    (plEigen[sE] = plEigen[sE] || []).push(alle.placeboAZeilen); (plPool[sP] = plPool[sP] || []).push(alle.placeboAZeilen);
    var reihe = alle.reihe;
    var akt = statistik(reihe.filter(function (z) { return z.t >= ctx.nTage - K.AKTUELL_TAGE; }), Lag);
    var reg = ctx.regime ? {
      ueber: statistik(reihe.filter(function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg && ctx.regime[z.t] === 1; }), Lag),
      unter: statistik(reihe.filter(function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg && ctx.regime[z.t] === 0; }), Lag) } : null;
    var jahre = jahresscheiben(reihe, Lag, ctx, hKey);
    var lue = luecken(sp, ctx, K.kandIndex(dI, zi), dirIdx, reihe, Lag);
    var hzW = haltezeitWerte(sp, ctx, K.kandIndex(dI, zi), dirIdx, zi, h, 'alle');
    var uBesTag = reihe.filter(nurBes(ctx)).filter(function (z) { return istZahl(z.u); }).map(function (z) { return { t: z.t, x: z.u }; });
    delete alle.placeboAZeilen; delete alle.reihe; delete lebend.placeboAZeilen; delete lebend.reihe;
    konf.push({ det: dets[dI], zr: K.ZEITRAHMEN[zi].key, richtung: K.RICHTUNGEN[dirIdx].key, h: hKey, dI: dI, zi: zi, dirIdx: dirIdx, hi: h, lag: Lag,
      luecke: { jeSignal: lue.jeSignal, nSig: lue.nSig, nTage: lue.nTage, ohneKurs: lue.ohneKurs, ohneU: lue.ohneU, tagesmittel: lue.tagesmittel }, nettoBereinigt: lue.bereinigt, uBereinigt: lue.bereinigtU,
      haltezeit: hzW, uBesTag: uBesTag,
      alle: alle, lebend: { ent: lebend.ent, bes: lebend.bes, placeboB: lebend.placeboB },
      differenzLebend: alle.bes.brutto.mittel != null && lebend.bes.brutto.mittel != null ? alle.bes.brutto.mittel - lebend.bes.brutto.mittel : null,
      differenzLebendKlasse: klassenDifferenz(sp, ctx, K.reiheIndex(K.kandIndex(dI, zi), 0), dirIdx, h, zi, Lag),
      aktuell: { nTage: akt.nTage, nSig: akt.nSig, u: akt.u, brutto: akt.brutto, netto: akt.netto },
      regime: reg, jahre: jahre, trend: trend(jahre),
      schein: { bv1: scheinWerte(alle.bes, 'bv1', hKey), standard: scheinWerte(alle.bes, 'standard', hKey), ent: { bv1: scheinWerte(alle.ent, 'bv1', hKey), standard: scheinWerte(alle.ent, 'standard', hKey) } } });
  }
  spiegelSpalten(konf);
  /* Kontrollen zuerst: Placebo A gepoolt je (ZR, H), eigen je (Detektor, ZR, H), Topf-Drift. */
  var kontrollen = [], poolOk = {}, eigenOk = {}, eigen = {};
  for (var z2 = 0; z2 < K.N_ZR; z2++) for (var h2 = 0; h2 < K.N_H; h2++) {
    var sP2 = z2 + '/' + h2, Lag2 = K.lagVon(h2), p = placeboMomente(plPool[sP2] || [], Lag2);
    poolOk[sP2] = imBand(p, h2, true);
    var gefallen = 0, geprueft = 0;
    for (var d2 = 0; d2 < dets.length; d2++) {
      var sE2 = d2 + '/' + z2 + '/' + h2, e = placeboMomente(plEigen[sE2] || [], Lag2);
      var eB = statistik(poole(plEigen[sE2] || []).filter(nurBes(ctx)), Lag2);
      e.bes = { nTage: eB.nTage, nSig: eB.nSig, seB: eB.brutto.se };
      eigen[sE2] = e; eigenOk[sE2] = imBand(e, h2, false);
      if (e.nTage > 0) { geprueft++; if (!eigenOk[sE2]) gefallen++; }
    }
    kontrollen.push({ zr: K.ZEITRAHMEN[z2].key, h: K.HALTEDAUERN[h2].key, uebernacht: !!K.HALTEDAUERN[h2].uebernacht, placebo: p, imBand: poolOk[sP2], eigenGeprueft: geprueft, eigenGefallen: gefallen, drift: drift(sp, ctx, z2, h2),
      schranke: K.HALTEDAUERN[h2].uebernacht ? (K.SE_ERWARTET_NAECHSTE == null ? 'nur |t| < 3 (se_erwartet noch nicht notiert)' : '|t| < 3 und |Mittel| < ' + (3 * K.SE_ERWARTET_NAECHSTE).toFixed(4)) : '|t| < 3 und |Mittel| < ' + K.BAND_PP });
  }
  /* Tore: Tor 1 auf u -> k1; Tor 2 mit z_Bonf(k1) -> k2; Aktualitaets-Tor; Urteil mit z_Bonf(k2). */
  konf.forEach(function (c) {
    var e = c.alle.ent, b = c.alle.bes, a = c.aktuell;
    c.mdeB = b.u.mde; c.kKand = b.kKand;
    c.tor1 = e.u.mittel != null && c.mdeB != null && e.u.mittel > 0 && e.u.mittel >= K.TOR1_FAKTOR * c.mdeB;
    c.torAkt = a.nTage >= K.AKTUELL_MIN_TAGE && a.u.mittel != null && a.u.mittel > 0 && a.u.t != null && a.u.t > K.AKTUELL_T_MIN;
    c.placeboA = eigen[c.dI + '/' + c.zi + '/' + c.hi];
    c.seVerhaeltnis = seVerhaeltnis(c.placeboA.bes, b);
  });
  var k1 = konf.filter(function (c) { return c.tor1; }).length, z1 = zBonf(Math.max(k1, 1));
  konf.forEach(function (c) {
    c.delta80 = c.alle.bes.u.se != null ? (z1 + K.Z_POWER80) * c.alle.bes.u.se : null;
    c.tor2 = c.tor1 && c.delta80 != null && c.kKand != null && c.delta80 < c.kKand;
  });
  var k2 = konf.filter(function (c) { return c.tor2; }).length, z2u = zBonf(Math.max(k2, 1));
  konf.forEach(function (c) { urteil(c, z2u, poolOk[c.zi + '/' + c.hi], eigenOk[c.dI + '/' + c.zi + '/' + c.hi]); });
  var zahlen = { konfigurationen: konf.length, k1: k1, k2: k2, zBonfK1: z1, zBonfK2: z2u, urteile: {}, aktuellAb: ctx.aktuellAb };
  URTEILE.forEach(function (u) { zahlen.urteile[u] = konf.filter(function (c) { return c.urteil === u; }).length; });
  zahlen.handelbar = konf.filter(function (c) { return c.handelbar; }).length;
  zahlen.handelbarSchein = { bv1: konf.filter(function (c) { return c.handelbarSchein.bv1; }).length, standard: konf.filter(function (c) { return c.handelbarSchein.standard; }).length };
  zahlen.torAktBestanden = konf.filter(function (c) { return c.torAkt; }).length;
  zahlen.torLueckeBestanden = konf.filter(function (c) { return c.torLuecke; }).length;
  zahlen.extremEinstieg = konf.filter(function (c) { return c.extremEinstieg; }).length;
  zahlen.lueckeOhneKursTage = konf.reduce(function (a, c) { return a + (c.luecke ? c.luecke.ohneKurs : 0); }, 0);
  zahlen.uhrzeitTorGilt = konf.filter(function (c) { return K.uhrzeitTorGilt(c.h); }).length;
  zahlen.uhrzeitTorGefallen = konf.filter(function (c) { return !c.torUhrzeit; }).length;
  zahlen.versatzOhneWert = konf.filter(function (c) { return !c.haltezeit || c.haltezeit.versatz == null; }).length;
  var vFest = konf.filter(function (c) { return !K.uhrzeitTorGilt(c.h) && c.haltezeit && c.haltezeit.versatz != null; }).map(function (c) { return Math.abs(c.haltezeit.versatz); }).sort(function (a, b) { return a - b; });
  zahlen.versatzFestMax = vFest.length ? vFest[vFest.length - 1] : null;
  zahlen.versatzFestMedian = vFest.length ? vFest[vFest.length >> 1] : null;
  zahlen.handelbarPut = konf.filter(function (c) { return c.richtung === 'short' && (c.handelbarSchein.bv1 || c.handelbarSchein.standard); }).length;
  zahlen.vorwaerts = konf.filter(function (c) { return c.vorwaerts; }).length;
  zahlen.groesse = { 'in seiner Klasse zu': 0, 'in jeder Klasse zu': 0, 'offen': 0, 'ohne (< 30 Bes-Tage)': 0 };
  zahlen.scheinGroesse = { 'fuer jeden Schein zu': 0, 'fuer den Standard-Schein zu': 0, 'offen': 0, 'ohne (< 30 Bes-Tage)': 0 };
  konf.forEach(function (c) { zahlen.groesse[c.groesse]++; zahlen.scheinGroesse[c.scheinGroesse]++; });
  zahlen.ohneTopf = konf.reduce(function (a, c) { return a + c.alle.ohneTopf; }, 0);
  zahlen.placeboEigenGefallen = kontrollen.reduce(function (a, k) { return a + k.eigenGefallen; }, 0);
  zahlen.placeboPoolGefallen = kontrollen.filter(function (k) { return !k.imBand && k.placebo.nTage > 0; }).length;
  zahlen.hh0 = konf.filter(function (c) { return c.alle.bes.u.hh0; }).length;
  zahlen.trendPositivT2 = konf.filter(function (c) { return c.trend.t != null && c.trend.t >= 2; }).length;
  zahlen.trendNegativT2 = konf.filter(function (c) { return c.trend.t != null && c.trend.t <= -2; }).length;
  return { ctx: { iBes: ctx.iBes, iReg: ctx.iReg, nTage: ctx.nTage, aktuellAb: ctx.aktuellAb }, konf: konf, kontrollen: kontrollen, zahlen: zahlen, ueberleben: ueberleben(konf, F), signalanteil: signalanteil(F), klassenmix: klassenmix(sp, ctx),
    seB: seBGegenPlan(konf, z1), centBoden: centBoden(sp, kal), jahresKurz: jahresKurz(konf), regimeInfo: regimeInfo ? { spyTage: regimeInfo.spyTage, ueber: regimeInfo.ueber, unter: regimeInfo.unter, unbekannt: regimeInfo.unbekannt, dateien: regimeInfo.dateien } : null };
}
/** Urteil (§7): Groessenaussagen fuer alle mit >= 30 Bes-Tagen; Wort; Herabstufungen; handelbar; handelbar mit Schein; Vorwaertstest. */
function urteil(c, z2, poolOk, eigenOk) {
  var e = c.alle.ent, b = c.alle.bes;
  c.groesse = 'ohne (< 30 Bes-Tage)'; c.scheinGroesse = 'ohne (< 30 Bes-Tage)';
  if (b.nTage >= K.MIN_BES_TAGE && b.brutto.obere != null && c.kKand != null) {
    if (b.brutto.obere < K.JEDE_KLASSE_ZU) c.groesse = 'in jeder Klasse zu';
    else if (b.brutto.obere < c.kKand) c.groesse = 'in seiner Klasse zu';
    else c.groesse = 'offen';
    if (c.schein.bv1.obere < 0) c.scheinGroesse = 'fuer jeden Schein zu';
    else if (c.schein.standard.obere < 0) c.scheinGroesse = 'fuer den Standard-Schein zu';
    else c.scheinGroesse = 'offen';
  }
  c.handelbar = false; c.handelbarSchein = { bv1: false, standard: false }; c.herabstufungen = []; c.vorwaerts = false;
  c.leiheUngemessen = c.richtung === 'short';                   // Minutenstudie Nachtrag 2.4: Short als Aktie nie handelbar
  c.flagge = c.richtung === 'short' ? 'handelbar mit Put' : 'handelbar mit Schein';   // Nachtrag 3.3: Name der Schein-Flagge
  c.grund = '';
  /* NACHTRAG 3.1: Einstiegsluecke. `belegt` (und damit jedes `handelbar`) verlangt zusaetzlich, dass das um die
   * Luecke bereinigte Netto positiv und selbst signifikant ist - sonst steckt die Groesse im Einstieg am Extrem
   * (Bid-Ask-Bounce), nicht in einer Wende. Vermerk "Extrem-Einstieg", wo die Luecke mehr als die Haelfte des Brutto ist. */
  var lb = c.luecke || {}, nb = c.nettoBereinigt || {}, ub = c.uBereinigt || {}, lm = lb.tagesmittel || {};
  /* NACHTRAG 4.1 (Entscheid PM): das Tor sitzt auf u_B, nicht auf netto_B - `belegt` faellt ueber u, und ein Tor auf
   * einer Groesse mit drei- bis sechsfacher se waere ein zweiter, schwaecherer Test unter falschem Namen. Die
   * netto-Spalten bleiben im Bericht, entscheiden aber nichts. */
  c.torLuecke = ub.mittel != null && ub.mittel > 0 && ub.t != null && ub.t >= z2;
  c.extremEinstieg = b.brutto.mittel != null && b.brutto.mittel > 0 && lm.mittel != null && lm.mittel > 0.5 * b.brutto.mittel;
  /* NACHTRAG 4.3: Tor "Uhrzeit-Versatz" - nur fuer die Haltedauern, deren Haltezeit an der Uhrzeit haengt. */
  var hzv = c.haltezeit ? c.haltezeit.versatz : null;
  c.torUhrzeit = !(K.uhrzeitTorGilt(c.h) && hzv != null && Math.abs(hzv) > K.UHRZEIT_VERSATZ_MAX);
  if (e.nSig === 0 && b.nSig === 0) c.urteil = '0 Signale';
  else if (c.mdeB == null || e.nTage === 0) { c.urteil = 'nicht entscheidbar'; c.grund = 'Tor 1 nicht pruefbar (se_B oder Entdeckung fehlt)'; }
  else if (!c.tor1) c.urteil = 'kein Kandidat';
  else if (!c.tor2) { c.urteil = 'nicht entscheidbar'; c.grund = 'Tor 2: delta80 >= K_kand'; }
  else if (b.nTage < K.MIN_BES_TAGE) { c.urteil = 'nicht entscheidbar'; c.grund = 'Bestaetigung < ' + K.MIN_BES_TAGE + ' Signaltage'; }
  else {
    var kern = b.u.mittel != null && b.u.mittel > 0 && b.u.t != null && b.u.t >= z2 && Math.sign(b.u.mittel) === Math.sign(e.u.mittel);
    if (!kern) {
      if (c.groesse === 'in seiner Klasse zu' || c.groesse === 'in jeder Klasse zu') { c.urteil = 'widerlegt als Groesse'; c.grund = c.groesse; }
      else { c.urteil = 'nicht entscheidbar'; c.grund = b.u.t != null && b.u.t < z2 ? 't_B < z_Bonf(k2) oder Band schliesst K_kand ein' : 'Bestaetigung u nicht > 0'; }
    } else if (!c.torAkt) {
      c.urteil = 'nicht belegt: Aktualitaets-Tor';
      c.grund = c.aktuell.nTage < K.AKTUELL_MIN_TAGE ? 'letzte ' + K.AKTUELL_TAGE + ' Tage: < ' + K.AKTUELL_MIN_TAGE + ' Signaltage' : 'letzte ' + K.AKTUELL_TAGE + ' Tage: u ' + (c.aktuell.u.mittel != null ? c.aktuell.u.mittel.toFixed(4) : '–') + ', t ' + (c.aktuell.u.t != null ? c.aktuell.u.t.toFixed(2) : '–');
    } else if (!c.torLuecke) {
      c.urteil = 'nicht belegt: Einstiegsluecke';
      c.grund = 'u_B lueckenbereinigt ' + (ub.mittel != null ? ub.mittel.toFixed(4) : '–') + ' (t ' + (ub.t != null ? ub.t.toFixed(2) : '–') + ' < z_Bonf ' + z2.toFixed(2) + '), Luecke ' + (lm.mittel != null ? lm.mittel.toFixed(4) : '–') + (c.extremEinstieg ? ', Extrem-Einstieg' : '');
    } else if (!c.torUhrzeit) {
      c.urteil = 'nicht belegt: Uhrzeit-Versatz';
      c.grund = 'haltezeit_kand ' + c.haltezeit.kand.toFixed(1) + ' min gegen Topf ' + c.haltezeit.topf.toFixed(1) + ' min: Versatz ' + hzv.toFixed(3) + ', Betrag > ' + K.UHRZEIT_VERSATZ_MAX + ' bei H = ' + c.h;
    } else {
      if (!poolOk) c.herabstufungen.push('Placebo gepoolt (ZR, H) gefallen');
      if (!eigenOk) c.herabstufungen.push('Placebo eigen gefallen');
      if (!(b.uF.mittel > 0)) c.herabstufungen.push('uFenster_B <= 0');
      if (!poolOk || !eigenOk) c.urteil = 'belegt-aber-nullpunkt-verschoben';
      else if (!(b.uF.mittel > 0)) c.urteil = 'belegt, aber Eroeffnungskosten';
      else {
        c.urteil = 'belegt';
        var aufloesung = c.delta80 <= c.kKand;
        c.handelbar = !c.leiheUngemessen && aufloesung && b.netto.mittel > 0;
        c.handelbarSchein.bv1 = aufloesung && c.schein.bv1.mittel > 0;
        c.handelbarSchein.standard = aufloesung && c.schein.standard.mittel > 0;
      }
    }
  }
  var a = c.aktuell;
  c.vorwaerts = c.urteil !== 'belegt' && a.nTage >= K.VORWAERTS_MIN_TAGE && a.u.mittel != null && a.u.mittel > 0 && a.u.t != null && a.u.t >= K.VORWAERTS_T;
  if (c.urteil === 'nicht belegt: Einstiegsluecke') c.handelbarGrund = 'nein (Einstiegsluecke' + (c.extremEinstieg ? ', Extrem-Einstieg' : '') + ')';
  else if (c.urteil === 'nicht belegt: Uhrzeit-Versatz') c.handelbarGrund = 'nein (Uhrzeit-Versatz)';
  else if (c.leiheUngemessen) c.handelbarGrund = 'nein (Leihe)';
  else if (c.urteil === 'belegt' && !c.handelbar) c.handelbarGrund = c.delta80 <= c.kKand ? 'nein (netto roh <= 0)' : 'nein (delta80 > K_kand)';
  else c.handelbarGrund = c.handelbar ? 'ja' : 'nein';
}
function seVerhaeltnis(plBes, kandBes) {
  var aus = { plSeB: plBes ? plBes.seB : null, kandSeB: kandBes.brutto.se, nSigP: plBes ? plBes.nSig : 0, nSigK: kandBes.nSig, roh: null, bereinigt: null, auffaellig: false };
  if (!(aus.plSeB > 0) || !(aus.kandSeB > 0) || !(aus.nSigP > 0) || !(aus.nSigK > 0)) return aus;
  aus.roh = aus.plSeB / aus.kandSeB; aus.bereinigt = aus.roh * Math.sqrt(aus.nSigP / aus.nSigK); aus.auffaellig = aus.bereinigt < 0.5 || aus.bereinigt > 2;
  return aus;
}
function familie(det) { return Object.keys(K.FAMILIEN).filter(function (f) { return K.FAMILIEN[f].indexOf(det) !== -1; })[0] || 'unbekannt'; }
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
function signalanteil(F) {
  var reihen = Object.keys(F.signale || {}), aus = [];
  var median = function (w) { return w.length ? w.slice().sort(function (a, b) { return a - b; })[w.length >> 1] : null; };
  K.DETEKTOR_KEYS.forEach(function (dk) { K.ZEITRAHMEN.forEach(function (zr, zi) {
    var alle = reihen.map(function (r) { var d = F.signale[r].det && F.signale[r].det[dk]; return d ? d[zi] || 0 : 0; }), mit = alle.filter(function (v) { return v > 0; });
    aus.push({ det: dk, zr: zr.key, reihenGesamt: reihen.length, reihenMitSignal: mit.length, summe: mit.reduce(function (a, b) { return a + b; }, 0), medianJeReihe: median(alle), medianJeReiheMitSignal: median(mit) });
  }); });
  return aus;
}
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
function seBGegenPlan(konf, z1) {
  var aus = [];
  K.ZEITRAHMEN.forEach(function (zr) { K.HALTEDAUERN.forEach(function (H) {
    var feld = konf.filter(function (c) { return c.zr === zr.key && c.h === H.key && c.alle.bes.u.se != null; });
    var se = feld.map(function (c) { return c.alle.bes.u.se; }).sort(function (a, b) { return a - b; });
    var dicht = feld.slice().sort(function (a, b) { return b.alle.bes.nSig - a.alle.bes.nSig; })[0];
    var med = se.length ? se[se.length >> 1] : null;
    aus.push({ zr: zr.key, h: H.key, nKonf: feld.length,
      dicht: dicht ? { det: dicht.det, richtung: dicht.richtung, nSigB: dicht.alle.bes.nSig, nTageB: dicht.alle.bes.nTage, seB: dicht.alle.bes.u.se, mdeB: dicht.mdeB, delta80: dicht.delta80 } : null,
      median: { seB: med, mdeB: med != null ? 2 * med : null, delta80: med != null ? (z1 + K.Z_POWER80) * med : null }, plan: K.PLAN[H.key] });
  }); });
  return aus;
}
/** Kurztafel Jahr x Familie (nachrichtlich): Mittel von u ueber die Konfigurationen der Familie mit >= JAHR_MIN_TAGE Signaltagen im Jahr. */
function jahresKurz(konf) {
  var aus = [], namen = K.JAHRE.map(String).concat(['letzte ' + K.AKTUELL_TAGE]);
  namen.forEach(function (j) { Object.keys(K.FAMILIEN).forEach(function (f) {
    var w = []; konf.forEach(function (c) { if (familie(c.det) !== f) return; var s = c.jahre.filter(function (x) { return x.jahr === j; })[0]; if (s && !s.duenn && s.u === s.u && s.u != null) w.push(s.u); });
    aus.push({ jahr: j, familie: f, nKonf: w.length, mittelU: w.length ? w.reduce(function (a, b) { return a + b; }, 0) / w.length : null, anteilPositiv: w.length ? w.filter(function (x) { return x > 0; }).length / w.length : null });
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
function markdown(E, F, herkunft, kal, pilot) {
  var Z = F.zaehler || {}, wachhund = (F.ausgelassen || []).filter(function (a) { return /^Wachhund/.test(a.grund || ''); }).length, z = E.zahlen, o = [];
  o.push('# ' + (pilot ? 'PILOT-ERGEBNIS' : 'ERGEBNIS') + ': Trendwende II (' + K.KONFIG_KENNUNG + ')\n');
  o.push('Erzeugt ' + new Date().toISOString() + ' von `auswerten.js`. ' + (pilot ? '**PILOT / UNVOLLSTAENDIG - diese Zahlen sind kein Befund ueber den Markt.** ' : '') + 'Alles Simulation mit virtuellem Kapital, keine Anlageberatung. Pp = Prozentpunkte, Tagesmittel ungewichtet ueber Signaltage; Bericht rundet auf 4 Nachkommastellen, verglichen wurde ungerundet. Hauptgroesse u = dir·(rLong − Topf) − K_mitte (VORREGISTRIERUNG §5); Uebernacht-se Hansen-Hodrick Lag 1 (§6).\n');
  if (F.zeitrahmenFehlend && F.zeitrahmenFehlend.length) o.push('> **⚠ UNVOLLSTAENDIG NACH ZEITRAHMEN:** kein Teillauf hat ' + F.zeitrahmenFehlend.join(', ') + ' gemessen - dort steht "0 Signale" fuer **nicht gemessen**.\n');
  o.push('## 0. Herkunft und Zaehler\n');
  o.push(tabelle(['Ordner', 'Dateien', 'Reihen', 'GB', 'pilot', 'beendet', 'Teil', 'Reihen-Argument', 'Zellenstand', 'Kennung'],
    herkunft.map(function (h) { return [h.ordner, ganz(h.dateien), ganz(h.reihen), tw((h.bytes || 0) / 1e9), jn(h.pilot), h.beendet, h.teil ? h.teil.k + '/' + h.teil.n : '–', h.reihenArg ? h.reihenArg.join(' ') : '–', ganz(h.zellenStand), h.kennung]; })));
  o.push(tabelle(['Groesse', 'Wert'], [['Dateien gesamt', ganz(F.dateien)], ['GB gesamt', tw((F.bytes || 0) / 1e9)], ['regulaere Kerzen', ganz(F.kerzenRegulaer)], ['Reihen mit Eintrag (F.signale)', ganz(Object.keys(F.signale || {}).length)],
    ['davon lebend / nicht lebend', ganz(E.ueberleben.reihen.lebend) + ' / ' + ganz(E.ueberleben.reihen.nichtLebend)], ['doppelt erledigte Dateien ueber die Teile', ganz(F.doppeltErledigt)], ['ausgelassen (Dateien)', ganz((F.ausgelassen || []).length)], ['davon Wachhund', ganz(wachhund)],
    ['ms lesen / rechnen', ganz(F.ms && F.ms.lesen) + ' / ' + ganz(F.ms && F.ms.rechnen)], ['Kalender: Tage / Entdeckung / Bestaetigung ab / Regime ab / letzte ' + K.AKTUELL_TAGE + ' ab', ganz(kal.tage.length) + ' / ' + ganz(E.ctx.iBes) + ' / ' + K.BESTAETIGUNG_AB + ' / ' + K.REGIME_AB + ' / ' + E.ctx.aktuellAb],
    ['Uebernacht: offen / verbucht / verfallen / ohne Folgetag / Dateien nach Fortsetzung ohne Uebergabe', ganz(Z.uebernachtOffen) + ' / ' + ganz(Z.uebernachtVerbucht) + ' / ' + ganz(Z.uebernachtVerfallen) + ' / ' + ganz(Z.ohneNaechsterTag) + ' / ' + ganz(Z.fortsetzungOhneUebernacht)],
    ['Regime (SPY EMA' + K.EMA_N + '): SPY-Tage / ueber / unter / unbekannt', E.regimeInfo ? ganz(E.regimeInfo.spyTage) + ' / ' + ganz(E.regimeInfo.ueber) + ' / ' + ganz(E.regimeInfo.unter) + ' / ' + ganz(E.regimeInfo.unbekannt) : 'SPY nicht lesbar - Regime-Sicht entfaellt']]));
  o.push('F.zaehler vollstaendig:\n'); o.push(tabelle(['Zaehler', 'Wert'], flach(Z)));
  o.push('Reihen ausgeschlossen nach Wertpapierart:\n'); o.push(tabelle(['Art', 'Reihen'], flach(F.reihenAusgeschlossen || {})));
  if ((F.ausgelassen || []).length) { o.push(tabelle(['Ausgelassen', 'Grund'], F.ausgelassen.map(function (a) { return [a.datei, a.grund]; }))); o.push('> „Datei fehlt" ist kein Sammelfehler (Minutenstudie Nachtrag 3, Frage 5: alle 340 Reihen mit Jahren ohne Datei stehen in `_luecken.json`).\n'); }
  o.push('## 1. Kontrollen zuerst (§8)\n\nPlacebo A gepoolt je (Zeitrahmen, Haltedauer) ueber alle acht Detektoren und beide Richtungen, Mass je Signal dir_p · (rohLong_p − Topf). Schranke intraday |t| < 3 und |Mittel| < ' + K.BAND_PP + ' Pp; Uebernacht |t| < 3 und |Mittel| < 3·se_erwartet' + (K.SE_ERWARTET_NAECHSTE == null ? ' (**se_erwartet noch nicht notiert - nur das t-Kriterium wirkt**)' : ' (se_erwartet ' + pp(K.SE_ERWARTET_NAECHSTE) + ')') + '. Faellt das gepoolte Band, wird in diesem (ZR, H) nichts „belegt". Eigen = je (Detektor, ZR, H) nur |t| < 3. Drift = Topf-Tagesmittel.\n');
  o.push(tabelle(['ZR', 'H', 'Schranke', 'Placebo nTage', 'nSig', 'Mittel−Topf (Pp)', 'se', 't', 'im Band', 'eigen geprueft', 'eigen gefallen', 'Drift nTage', 'Drift Tagesmittel', 'Drift sd', 'Drift t', 'Drift Bes Mittel', 'Topf Kerzen'],
    E.kontrollen.map(function (k) { var p = k.placebo, d = k.drift; return [k.zr, k.h, k.schranke, ganz(p.nTage), ganz(p.nSig), pp(p.gegenTopf), pp(p.se), tw(p.t), jn(k.imBand), ganz(k.eigenGeprueft), ganz(k.eigenGefallen), ganz(d.nTage), pp(d.mittel), pp(d.sd), tw(d.t), pp(d.mittelB), ganz(d.kerzen)]; })));
  o.push('Gepoolte Placebo-Baender gefallen: **' + ganz(z.placeboPoolGefallen) + '** von ' + ganz(E.kontrollen.length) + '. Einzel-Placebos gefallen: **' + ganz(z.placeboEigenGefallen) + '**. Signalzellen ohne Topfzelle: ' + ganz(z.ohneTopf) + '. Uebernacht-Zeilen mit HH ≤ 0 (Block-se, Marke HH<0): ' + ganz(z.hh0) + '.\n');
  o.push('## 2. Urteile in Zahlen (§7)\n');
  o.push('> **Einstiegsluecke (Nachtrag 3, vor dem Vollauf registriert):** `luecke_B` ist die mittlere Luecke zwischen dem Schluss der Signalkerze und der Eroeffnung der Einstiegskerze, in Handelsrichtung und in Pp - gemessen je Kurszelle, also je (Detektor, ZR, Richtung) fuer alle Haltedauern dieselbe. `u_B lueckenbereinigt` = u_B − luecke_B je Signaltag. **NACHTRAG 4.1: `belegt` verlangt zusaetzlich `u_B lueckenbereinigt` > 0 mit t ≥ z_Bonf(k2)** - das Tor sitzt auf der Hauptgroesse u, nicht mehr auf netto (dessen se ist drei- bis sechsmal groesser; ein Tor darauf waere ein zweiter, schwaecherer Test unter falschem Namen). Die netto-Spalten bleiben im Bericht und entscheiden nichts. Sonst steht „nicht belegt: Einstiegsluecke". Der Vermerk **Extrem-Einstieg** steht, wo die Luecke mehr als die Haelfte des Brutto ausmacht.\n');
  o.push('> **Uhrzeit-Versatz (Nachtrag 4, vor der ersten Zelle der Kennung v3 registriert):** `haltezeit_kand` und `haltezeit_topf` sind die mittleren Haltezeiten in **Sitzungsminuten** (Einstieg bis Ausstieg) von Kandidat und Topf, gemessen ueber **dieselben Signaltage und Zellen**; `uhrzeit_versatz` = haltezeit_kand / haltezeit_topf − 1. Fuer die festen Haltedauern ist er konstruktionsgemaess 0. Fuer **' + K.UHRZEIT_TOR_H.join(' und ') + '** haengt die Haltezeit an der UHRZEIT des Signals: ein Detektor, der frueher am Tag feuert als sein Topf, traegt mehr Tagesdrift - in beiden Richtungen. **Eine Zeile mit |uhrzeit_versatz| > ' + K.UHRZEIT_VERSATZ_MAX + ' kann fuer diese beiden Haltedauern nicht `belegt` werden** („nicht belegt: Uhrzeit-Versatz"). Fuer „naechste Eroeffnung" zaehlt die Nachtpause null Sitzungsminuten - sie ist fuer jeden Einstieg desselben Tages gleich lang und kann keinen Versatz erzeugen.\n');
  o.push('> **Spiegel-Spalten sind DIAGNOSE, kein Tor (Nachtrag 4.4):** `u_spiegel` / `t_spiegel` sind u_B und t_B derselben (Detektor, ZR, Haltedauer) in der Gegenrichtung, `u_summe` das Tagesmittel von (u_long + u_short) ueber die Tage, an denen beide Richtungen feuern. **Daraus folgt kein Urteil** - long und short feuern zu verschiedenen Zeitpunkten; beide positiv ist fuer sich genommen weder Widerspruch noch Beweis.\n');
  o.push('> **Belegt ist nicht handelbar.** Ueber belegt / widerlegt / nicht entscheidbar entscheidet u (Ueberschuss gegen den Topf minus Kassa-Huerde). `handelbar` (Aktie) verlangt zusaetzlich Aufloesung (delta80 ≤ K_kand), rohes Netto > 0 und Einstiegsfenster-Huerde; Short als Aktie nie (Leihe). **`handelbar mit Schein`** verlangt belegt, Aufloesung, Einstiegsfenster und netto_schein_B > 0 - ohne Leihe-Veto (ein Put braucht keine Leihe). Das **Aktualitaets-Tor** (letzte ' + K.AKTUELL_TAGE + ' Handelstage ab ' + E.ctx.aktuellAb + ': u > 0 und t > ' + K.AKTUELL_T_MIN + ') ist Voraussetzung fuer belegt.\n');
  var uz = [['Konfigurationen', ganz(z.konfigurationen)], ['k1 (Tor 1 bestanden)', ganz(z.k1)], ['z_Bonf(max(k1,1)) fuer delta80', tw(z.zBonfK1)], ['k2 (beide Tore)', ganz(z.k2)], ['z_Bonf(max(k2,1)) = Schwelle fuer t_B', tw(z.zBonfK2)], ['Aktualitaets-Tor bestanden (alle Konfigurationen)', ganz(z.torAktBestanden)]];
  URTEILE.forEach(function (u) { uz.push(['Urteil: ' + u, ganz(z.urteile[u])]); });
  uz.push(['Luecken-Tor bestanden (u_B lueckenbereinigt > 0 und t ≥ z_Bonf, alle Konfigurationen)', ganz(z.torLueckeBestanden)]);
  uz.push(['Vermerk „Extrem-Einstieg" (luecke_B > halbes Brutto_B)', ganz(z.extremEinstieg)]);
  uz.push(['Uhrzeit-Tor: Zeilen, fuer die es ueberhaupt gilt (H = ' + K.UHRZEIT_TOR_H.join(' / ') + ')', ganz(z.uhrzeitTorGilt)]);
  uz.push(['Uhrzeit-Tor gefallen (|uhrzeit_versatz| > ' + K.UHRZEIT_VERSATZ_MAX + ')', ganz(z.uhrzeitTorGefallen)]);
  uz.push(['|uhrzeit_versatz| bei den FESTEN Haltedauern: Median / Maximum (Soll ≈ 0, Pruefschranke ' + K.VERSATZ_TOLERANZ + ')', pp(z.versatzFestMedian) + ' / ' + pp(z.versatzFestMax)]);
  uz.push(['Zeilen ohne Versatz-Wert (Tor greift dort nicht)', ganz(z.versatzOhneWert)]);
  uz.push(['Bestaetigungs-Signaltage ohne Kurszelle (aus der Lueckenrechnung gefallen, Summe ueber alle Konfigurationen)', ganz(z.lueckeOhneKursTage)]);
  uz.push(['handelbar (Aktie)', ganz(z.handelbar)]); uz.push(['handelbar mit Schein BV 1,0', ganz(z.handelbarSchein.bv1)]); uz.push(['handelbar mit Standard-Schein', ganz(z.handelbarSchein.standard)]);
  uz.push(['davon Short: Flagge „handelbar mit Put" (Kassa-Short bleibt nie handelbar)', ganz(z.handelbarPut)]);
  uz.push(['Kandidaten fuer den Vorwaertstest (nicht belegt, letzte ' + K.AKTUELL_TAGE + ': ≥ ' + K.VORWAERTS_MIN_TAGE + ' Tage, u > 0, t ≥ ' + K.VORWAERTS_T + ')', ganz(z.vorwaerts)]);
  Object.keys(z.groesse).forEach(function (g) { uz.push(['Groessenaussage Kassa: ' + g, ganz(z.groesse[g])]); });
  Object.keys(z.scheinGroesse).forEach(function (g) { uz.push(['Groessenaussage Schein: ' + g, ganz(z.scheinGroesse[g])]); });
  uz.push(['Trend ueber die Jahre: Steigung t ≥ 2 / t ≤ −2', ganz(z.trendPositivT2) + ' / ' + ganz(z.trendNegativT2)]);
  o.push(tabelle(['Groesse', 'Wert'], uz));
  var sortiert = E.konf.slice().sort(function (a, b) { var ta = a.alle.ent.u.t, tb = b.alle.ent.u.t; if (ta == null && tb == null) return 0; if (ta == null) return 1; if (tb == null) return -1; return tb - ta; });
  o.push('## 3. Kandidatentafel - alle ' + z.konfigurationen + ' Konfigurationen, sortiert nach Entdeckungs-t (u) absteigend\n\nEnt = Entdeckung, Bes = Bestaetigung (≥ ' + K.BESTAETIGUNG_AB + '). u = dir·(rLong − Topf) − K; netto = r − K (roh); uF = mit Einstiegsfenster-Huerde. Schein = Brutto − Schein-Huerde der Haltedauer (BV 1,0 / Standard). Akt = letzte ' + K.AKTUELL_TAGE + ' Handelstage. HH = Uebernacht-se mit Block-Rueckfall.\n');
  o.push(tabelle(['Detektor', 'ZR', 'Richtung', 'H', 'Ent nTage', 'Ent nSig', 'Ent brutto', 'Ent u', 'Ent t', 'MDE_B', 'Tor1', 'K_kand', 'delta80', 'Tor2', 'Bes nTage', 'Bes nSig', 'Bes brutto', 'Bes netto', 'Bes u', 'Bes uF', 'Bes t', 'obere Grenze brutto', 'luecke_B (je Signal)', 'luecke_B (Tagesmittel)', 'u_B lueckenbereinigt', 't u-bereinigt', 'netto_B lueckenbereinigt', 't netto-bereinigt', 'TorLuecke', 'Extrem-Einstieg', 'haltezeit_kand (min)', 'haltezeit_topf (min)', 'uhrzeit_versatz', 'TorUhrzeit', 'u_spiegel', 't_spiegel', 'u_summe', 'se_summe', 't_summe', 'Schein BV1 netto', 'Schein BV1 t', 'Schein Std netto', 'Akt nTage', 'Akt u', 'Akt t', 'TorAkt', 'PlA Mittel', 'PlA t', 'Kand−PlB', 'B2', 'Urteil', 'handelbar', 'Schein-Flagge', 'Flagge BV1', 'Flagge Std', 'Groesse', 'Schein-Groesse', 'Vorwaerts'],
    sortiert.map(function (c) { var e = c.alle.ent, b = c.alle.bes, p = c.placeboA, q = c.alle.placeboB.bes, a = c.aktuell, lu = c.luecke || {}, lm = lu.tagesmittel || {}, nb = c.nettoBereinigt || {}, ub = c.uBereinigt || {}, hz = c.haltezeit || {}, sp2 = c.spiegel || { summe: {} };
      return [c.det, c.zr, c.richtung, c.h, ganz(e.nTage), ganz(e.nSig), pp(e.brutto.mittel), pp(e.u.mittel), tw(e.u.t), pp(c.mdeB), jn(c.tor1), pp(c.kKand), pp(c.delta80), jn(c.tor2),
        ganz(b.nTage), ganz(b.nSig), pp(b.brutto.mittel), pp(b.netto.mittel), pp(b.u.mittel), pp(b.uF.mittel), tw(b.u.t) + (b.u.hh0 ? ' HH<0' : ''), pp(b.brutto.obere),
        pp(lu.jeSignal), pp(lm.mittel), pp(ub.mittel), tw(ub.t), pp(nb.mittel), tw(nb.t), jn(c.torLuecke), c.extremEinstieg ? 'Extrem-Einstieg' : '',
        tw(hz.kand), tw(hz.topf), hz.versatz == null ? '–' : tw(hz.versatz), K.uhrzeitTorGilt(c.h) ? jn(c.torUhrzeit) : 'gilt nicht',
        pp(sp2.u), tw(sp2.t), pp(sp2.summe.mittel), pp(sp2.summe.se), tw(sp2.summe.t),
        pp(c.schein.bv1.mittel), tw(c.schein.bv1.t), pp(c.schein.standard.mittel),
        ganz(a.nTage), pp(a.u.mittel), tw(a.u.t), jn(c.torAkt), pp(p.gegenTopf), tw(p.t), pp(q.mittel), (e.u.b2 || b.u.b2) ? 'B2' : '', c.urteil + (c.herabstufungen.length ? ' [' + c.herabstufungen.join('; ') + ']' : '') + (c.grund ? ' (' + c.grund + ')' : ''), c.handelbarGrund, c.flagge, jn(c.handelbarSchein.bv1), jn(c.handelbarSchein.standard), c.groesse, c.scheinGroesse, jn(c.vorwaerts)]; })));
  o.push('## 3b. Kandidaten fuer den Vorwaertstest (§7) - Rangliste, kein Befund\n\nNicht belegt, aber in den letzten ' + K.AKTUELL_TAGE + ' Handelstagen ≥ ' + K.VORWAERTS_MIN_TAGE + ' Signaltage, u > 0 und t ≥ ' + K.VORWAERTS_T + '. Bei ' + z.konfigurationen + ' Konfigurationen sind ≈ ' + Math.round(0.023 * z.konfigurationen) + ' solche Zeilen durch Zufall zu erwarten. Geprueft werden sie an den Daten ab 2026-09-01 (eigener Auftrag).\n');
  var vw = E.konf.filter(function (c) { return c.vorwaerts; }).sort(function (a, b) { return b.aktuell.u.t - a.aktuell.u.t; });
  o.push(vw.length ? tabelle(['Detektor', 'ZR', 'Richtung', 'H', 'Akt nTage', 'Akt nSig', 'Akt u', 'Akt se', 'Akt t', 'Akt brutto', 'Schein BV1 (Akt)', 'Schein Std (Akt)', 'Bes u', 'Bes t', 'luecke_B', 'netto_B lueckenbereinigt', 'Extrem-Einstieg', 'Urteil'],
    vw.map(function (c) { var a = c.aktuell, lm = (c.luecke || {}).tagesmittel || {}, nb = c.nettoBereinigt || {}; return [c.det, c.zr, c.richtung, c.h, ganz(a.nTage), ganz(a.nSig), pp(a.u.mittel), pp(a.u.se), tw(a.u.t), pp(a.brutto.mittel), pp(a.brutto.mittel != null ? a.brutto.mittel - K.scheinHuerde('bv1', c.h) : null), pp(a.brutto.mittel != null ? a.brutto.mittel - K.scheinHuerde('standard', c.h) : null), pp(c.alle.bes.u.mittel), tw(c.alle.bes.u.t), pp(lm.mittel), pp(nb.mittel), c.extremEinstieg ? 'Extrem-Einstieg' : '', c.urteil]; })) : 'Keine Konfiguration erfuellt die Kriterien.\n');
  /* NACHTRAG 4 (§19.0): die Probe auf die Hypothese des PM - beidseitig positive Zellen mit ihren Haltezeiten. */
  o.push('### 3c. Beidseitig positive Zellen (u_B > 0 und t ≥ 2 in BEIDEN Richtungen) mit Haltezeit und Uhrzeit-Versatz\n\nDas ist die Probe auf die Hypothese aus Nachtrag 4: feuert ein Detektor systematisch frueher am Tag als sein Topf, traegt er mehr Tagesdrift - und zwar in beiden Richtungen. Erwartet war ein deutlich positiver Versatz bei „bis Schluss" und „naechste Eroeffnung". Kein Urteil aus dieser Tafel, sie zeigt nur die Zahlen nebeneinander.\n');
  var beide = [];
  E.konf.forEach(function (c) {
    if (c.richtung !== 'long') return;
    var g = E.konf.filter(function (x) { return x.det === c.det && x.zr === c.zr && x.h === c.h && x.richtung === 'short'; })[0];
    if (!g) return;
    var a = c.alle.bes.u, b2 = g.alle.bes.u;
    if (!(a.mittel > 0 && a.t >= 2 && b2.mittel > 0 && b2.t >= 2)) return;
    [c, g].forEach(function (x) { var hz = x.haltezeit || {}; beide.push([x.det, x.zr, x.richtung, x.h, pp(x.alle.bes.u.mittel), tw(x.alle.bes.u.t), tw(hz.kand), tw(hz.topf), hz.versatz == null ? '–' : tw(hz.versatz), K.uhrzeitTorGilt(x.h) ? jn(x.torUhrzeit) : 'gilt nicht', x.urteil]); });
  });
  o.push(beide.length ? tabelle(['Detektor', 'ZR', 'Richtung', 'H', 'u_B', 't_B', 'haltezeit_kand (min)', 'haltezeit_topf (min)', 'uhrzeit_versatz', 'TorUhrzeit', 'Urteil'], beide) : 'Keine Zelle ist in beiden Richtungen positiv mit t ≥ 2.\n');
  o.push('## 4. Jahresscheiben (§9a) - Pflichttabelle: u je Kalenderjahr und letzte ' + K.AKTUELL_TAGE + ' Handelstage, je Konfiguration\n\nSicht alle, Klassen gepoolt, aus den Zellen je ET-Tag. t nur ab ' + K.JAHR_MIN_TAGE + ' Signaltagen im Jahr („zu duenn" sonst). Uebernacht-se Hansen-Hodrick Lag 1. Kein Urteil aus dieser Tabelle.\n');
  var jz = [];
  E.konf.forEach(function (c) { c.jahre.forEach(function (j) { jz.push([c.det, c.zr, c.richtung, c.h, j.jahr, ganz(j.nTage), ganz(j.nSig), pp(j.u), pp(j.se), j.duenn ? 'zu duenn' : tw(j.t) + (j.hh0 ? ' HH<0' : ''), pp(j.brutto), pp(j.netto), pp(j.schein1)]); }); });
  o.push(tabelle(['Detektor', 'ZR', 'Richtung', 'H', 'Jahr', 'nTage', 'nSig', 'u', 'se', 't', 'brutto', 'netto', 'Schein BV1'], jz));
  o.push('### 4b. Trend ueber die Jahre (§9b, nachrichtlich): OLS-Steigung des Jahresmittels u je Jahr (Pp/Jahr), nur Jahre mit ≥ ' + K.TREND_MIN_TAGE + ' Signaltagen, ab ' + K.TREND_MIN_JAHRE + ' Jahren\n');
  o.push(tabelle(['Detektor', 'ZR', 'Richtung', 'H', 'Jahre', 'Steigung (Pp/Jahr)', 'se', 't'], E.konf.map(function (c) { return [c.det, c.zr, c.richtung, c.h, ganz(c.trend.n), pp(c.trend.steigung), pp(c.trend.se), tw(c.trend.t)]; })));
  o.push('### 4c. Kurztafel Jahr × Familie (nachrichtlich): Mittel von u ueber die Konfigurationen der Familie, Anteil positiv\n');
  o.push(tabelle(['Jahr', 'Familie', 'Konfigurationen', 'Mittel u (Pp)', 'Anteil u > 0'], E.jahresKurz.map(function (k) { return [k.jahr, k.familie, ganz(k.nKonf), pp(k.mittelU), k.anteilPositiv == null ? '–' : tw(100 * k.anteilPositiv) + ' %']; })));
  o.push('## 5. Regime-Sicht (§9c, nachrichtlich): Bestaetigung getrennt nach SPY ueber / unter EMA' + K.EMA_N + '\n');
  if (E.regimeInfo) o.push(tabelle(['Detektor', 'ZR', 'Richtung', 'H', 'ueber nTage', 'ueber nSig', 'ueber u', 'ueber se', 'ueber t', 'unter nTage', 'unter nSig', 'unter u', 'unter se', 'unter t'],
    E.konf.map(function (c) { var r = c.regime; return [c.det, c.zr, c.richtung, c.h, ganz(r.ueber.nTage), ganz(r.ueber.nSig), pp(r.ueber.u.mittel), pp(r.ueber.u.se), tw(r.ueber.u.t), ganz(r.unter.nTage), ganz(r.unter.nSig), pp(r.unter.u.mittel), pp(r.unter.u.se), tw(r.unter.u.t)]; })));
  else o.push('SPY nicht lesbar - keine Regime-Sicht.\n');
  o.push('## 6. Ueberlebensverzerrung: Bestaetigungs-Brutto-Tagesmittel Sicht alle − Sicht lebend, je Familie\n');
  o.push(tabelle(['Familie', 'ZR', 'H', 'Konfigurationen', 'Differenz (Pp)'], E.ueberleben.jeZrH.map(function (u) { return [u.familie, u.zr, u.h, ganz(u.nKonf), pp(u.differenz)]; })));
  o.push(tabelle(['Familie', 'Umsatzklasse', 'Konfigurationen', 'Differenz (Pp)'], E.ueberleben.jeKlasse.map(function (u) { return [u.familie, u.klasse, ganz(u.nKonf), pp(u.differenz)]; })));
  var R = E.ueberleben.reihen;
  o.push('Reihen: lebend ' + ganz(R.lebend) + ', nicht lebend ' + ganz(R.nichtLebend) + '. Ende-Arten: ' + Object.keys(R.ende).map(function (k) { return k + ' ' + ganz(R.ende[k]); }).join(', ') + '.\n');
  o.push('## 7. Daten: 80-%-Regel je Zeitrahmen × Klasse, Cent-Boden, Signalanteil, Klassenmix\n');
  var zk = [];
  K.ZEITRAHMEN.forEach(function (zr) { K.KLASSEN.forEach(function (kl) { var schl = zr.key + '|' + kl.name, tage = (Z.tageGewertetKlasse || {})[schl] || 0; var reihen = Object.keys(F.signale || {}).filter(function (r) { return ((F.signale[r].tageGewertetKlasse || {})[schl] || 0) > 0; }); zk.push([zr.key, kl.name, ganz(reihen.length), ganz(tage), tage === 0 ? 'nicht gemessen' : (tage < 1000 ? 'duenn - kein Nullbefund' : '')]); }); });
  o.push(tabelle(['ZR', 'Klasse (Mio $)', 'Reihen mit gewerteten Tagen', 'gewertete Reihen-Tage', 'Hinweis'], zk));
  o.push(E.centBoden.length ? tabelle(['ZR', 'Klasse', 'Signale mit Einstieg', 'mittlerer Einstiegskurs (roh)', 'Cent-Boden beim Mittelkurs', 'Huerde', 'Anteil ueber dem Boden', 'mittlere Einstiegsluecke (Pp, alle Detektoren)'], E.centBoden.map(function (c) { return [c.zr, c.klasse, ganz(c.n), tw(c.mittelKurs) + ' $', pp(c.bodenBeimMittel), pp(c.huerde), tw(100 * c.anteilUeber) + ' %', pp(c.luecke)]; })) : 'Kurszellen leer.\n');
  o.push(tabelle(['Detektor', 'ZR', 'Reihen gesamt', 'Reihen mit Signal', 'Signale', 'Median je Reihe', 'Median je Reihe mit Signal'], E.signalanteil.map(function (s) { return [s.det, s.zr, ganz(s.reihenGesamt), ganz(s.reihenMitSignal), ganz(s.summe), ganz(s.medianJeReihe), ganz(s.medianJeReiheMitSignal)]; })));
  o.push('Klassenmix der Signale je Zeitrahmen (Kandidaten, Haltedauer schluss), Klassen ' + K.KLASSEN.map(function (k) { return k.name; }).join(' / ') + ':\n');
  o.push(tabelle(['ZR', 'gesamt', 'Bestaetigung', 'lebend'], E.klassenmix.map(function (m) { return [m.zr, m.gesamt.map(ganz).join(' / '), m.bestaetigung.map(ganz).join(' / '), m.lebend.map(ganz).join(' / ')]; })));
  o.push('## 8. Realisierte se_B (u) gegen den Plan (§11) - Zugewinn, nicht vorregistriert\n');
  o.push(tabelle(['ZR', 'H', 'Konf.', 'dicht: Detektor', 'dicht nSig_B', 'dicht nTage_B', 'dicht se_B', 'dicht delta80', 'Median se_B', 'Median MDE_B', 'Median delta80', 'Plan sd / MDE / delta80'],
    E.seB.map(function (s) { var d = s.dicht || {}; return [s.zr, s.h, ganz(s.nKonf), d.det ? d.det + ' ' + d.richtung : '–', ganz(d.nSigB), ganz(d.nTageB), pp(d.seB), pp(d.delta80), pp(s.median.seB), pp(s.median.mdeB), pp(s.median.delta80), s.plan ? pp(s.plan.sd) + ' / ' + pp(s.plan.mde) + ' / ' + pp(s.plan.delta80) : '–']; })));
  o.push('## 9. Was diese Zahlen nicht sagen (VORREGISTRIERUNG §15)\n');
  o.push('- Nichts ueber Parameter-Varianten der Detektoren; nicht die effektiven Kosten; Schein-Huerden sind Tabellenwerte.\n- Die Einstiegsluecke ist **kein Kostenmodell**: sie misst, wie weit der Einstieg vom Extrem entfernt liegt, an dem die Regel feuert. Eine kleine Luecke beweist keine Kante, eine grosse beweist keinen Fehler - sie verhindert nur, dass ein Bounce als Wende durchgeht (Nachtrag 3.1).\n- Kein Ja aus der Entdeckung, aus Jahresscheiben, aus der Regime-Sicht oder aus der Vorwaertstest-Liste.\n- Nichts ueber Haltedauern ueber eine Nacht hinaus, CFD, 60m, die Zeit vor 2016.\n- Fuer blinde Zellen (§11) kein Nein - nur Obergrenzen; „nicht entscheidbar" ist der Befund, kein Nein.\n' + (pilot ? '- **Dies ist ein Pilot- oder Teillauf.** Nichts hier ist ein Befund ueber den Markt.\n' : ''));
  return o.join('\n');
}

/* ---------- Hauptlauf ---------- */
function lauf(a) {
  if (!a.aus.length) { console.error('Pflichtargument --aus <ordner> fehlt.'); process.exit(2); }
  selbsttestQuantil();
  var kal = K.kalender();
  if (kal.bestaetigungAb !== K.BESTAETIGUNG_AB) { console.error('Kalender-Split ' + kal.bestaetigungAb + ' != registriert ' + K.BESTAETIGUNG_AB + ' - Abbruch.'); process.exit(3); }
  var ordner = a.aus.map(function (o) { return path.resolve(K.HIER, o); });
  var t0 = Date.now(), G;
  try { G = ladeLaeufe(ordner, kal); } catch (e) { console.error('ABBRUCH: ' + e.message); process.exit(4); }
  var pilot = G.F.pilotIrgendwo || G.F.unvollstaendig;
  var regime = null; try { regime = spyRegime(kal); } catch (e) { console.error('Regime (SPY) nicht lesbar: ' + e.message); }
  var E = auswerte(G.sp, G.F, kal, regime);
  var mdName = pilot ? 'PILOT-ERGEBNIS.md' : 'ERGEBNIS.md', jsonName = pilot ? 'pilot-ergebnis.json' : 'ergebnis.json';
  var json = { erzeugt: new Date().toISOString(), kennung: K.KONFIG_KENNUNG, pilot: pilot, herkunft: G.herkunft,
    zaehler: G.F.zaehler, dateien: G.F.dateien, bytes: G.F.bytes, kerzenRegulaer: G.F.kerzenRegulaer, ausgelassen: G.F.ausgelassen, reihenAusgeschlossen: G.F.reihenAusgeschlossen, doppeltErledigt: G.F.doppeltErledigt,
    kalender: { nTage: kal.tage.length, bestaetigungAb: K.BESTAETIGUNG_AB, regimeAb: K.REGIME_AB, iBes: E.ctx.iBes, iReg: E.ctx.iReg, aktuellAb: E.ctx.aktuellAb },
    konstanten: { zPower80: K.Z_POWER80, minBesTage: K.MIN_BES_TAGE, tor1Faktor: K.TOR1_FAKTOR, bandT: K.BAND_T, bandPp: K.BAND_PP, seErwartetNaechste: K.SE_ERWARTET_NAECHSTE, jedeKlasseZu: K.JEDE_KLASSE_ZU, aktuell: [K.AKTUELL_TAGE, K.AKTUELL_MIN_TAGE, K.AKTUELL_T_MIN], vorwaerts: [K.VORWAERTS_MIN_TAGE, K.VORWAERTS_T], uhrzeitVersatzMax: K.UHRZEIT_VERSATZ_MAX, uhrzeitTorH: K.UHRZEIT_TOR_H, versatzToleranz: K.VERSATZ_TOLERANZ, scheine: K.SCHEINE.map(function (s) { return { key: s.key, kurz: s.kurz, tag: s.tag }; }), plan: K.PLAN },
    zahlen: E.zahlen, kontrollen: E.kontrollen, konfigurationen: E.konf, ueberleben: E.ueberleben, signalanteil: E.signalanteil, klassenmix: E.klassenmix, seB: E.seB, centBoden: E.centBoden, jahresKurz: E.jahresKurz, regime: E.regimeInfo };
  fs.writeFileSync(path.join(ordner[0], jsonName), JSON.stringify(json, null, 1));
  fs.writeFileSync(path.join(ordner[0], mdName), markdown(E, G.F, G.herkunft, kal, pilot));
  console.log((pilot ? 'PILOT ' : '') + 'geschrieben: ' + path.join(ordner[0], mdName) + ' und ' + jsonName + ' | ' + G.F.dateien + ' Dateien | k1=' + E.zahlen.k1 + ' k2=' + E.zahlen.k2 + ' | belegt ' + E.zahlen.urteile.belegt + ' | Vorwaerts ' + E.zahlen.vorwaerts + ' | ' + Math.round((Date.now() - t0) / 1000) + ' s');
  return json;
}

module.exports = { lauf: lauf, argumente: argumente, normalQuantil: normalQuantil, zBonf: zBonf, selbsttestQuantil: selbsttestQuantil, ladeLaeufe: ladeLaeufe, haltezeitWerte: haltezeitWerte,
  tagesreihe: tagesreihe, poole: poole, momente: momente, momenteVon: momenteVon, statistik: statistik, scheinWerte: scheinWerte, imBand: imBand, auswerte: auswerte, urteil: urteil, markdown: markdown,
  lueckeReihe: lueckeReihe, luecken: luecken, centBoden: centBoden, spiegelSpalten: spiegelSpalten,
  spyRegime: spyRegime, regimeAusSchluessen: regimeAusSchluessen, jahresscheiben: jahresscheiben, scheibe: scheibe, trend: trend, familie: familie, URTEILE: URTEILE };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
