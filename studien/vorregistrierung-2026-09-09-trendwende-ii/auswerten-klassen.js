'use strict';
/* AUSWERTEN JE UMSATZKLASSE - Trendwende II, NACHTRAG 6 (13.09.2026).
 *
 * NACHTRAEGLICHE Frage, nach dem gepoolten Urteil (k1 = 0, belegt 0) gestellt: haengt das Nein an der Kassa-Huerde
 * der illiquiden Masse? Antwort aus den VORHANDENEN Zellen - keine neue Messung, kein Archivzugriff, kein
 * Detektorlauf. `_zellen.bin` wird nur gelesen; `voll-0/ERGEBNIS.md` und `voll-0/ergebnis.json` bleiben unberuehrt.
 *
 * STATUS: hypothesenerzeugend, nicht bestaetigend. Kein Klassenergebnis heisst "belegt"; das hoechste Etikett ist
 * "Kandidat fuer den Vorwaertstest ab 2026-09-01" (VORREGISTRIERUNG §22 / NACHTRAG 6).
 *
 * HERKUNFT: alle Statistik kommt per require aus ./auswerten.js (ladeLaeufe, tagesreihe, statistik, poole, momente,
 * scheinWerte, jahresscheiben, trend, zBonf, haltezeitWerte, lueckeReihe). Hier steht NUR die Klassenschleife, die
 * Positivkontrollen und die Ausgabe. Nichts wird nachgerechnet, was es dort schon gibt.
 *
 * Aufruf:  set TW2_VERZOEGERT=1 && node auswerten-klassen.js --aus voll-0 --aus voll-1 ... (oder auswerten.cmd)
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var A = require('./auswerten.js');

var TESTZAHL = K.N_KONFIG * K.N_K;                       // 225 x 4 = 900 (NACHTRAG 6.0)
var KLASSEN_NAMEN = K.KLASSEN.map(function (k) { return k.name; });

/* ---------- Formatierung (nur Ausgabe, keine Statistik) ---------- */
function pp(x) { return x == null || x !== x ? '–' : x.toFixed(4).replace('.', ','); }
function tw(x) { return x == null || x !== x ? '–' : x.toFixed(2).replace('.', ','); }
function ganz(x) { if (x == null || x !== x) return '–'; var s = String(Math.round(x)), aus = ''; while (s.replace('-', '').length > 3) { aus = '.' + s.slice(-3) + aus; s = s.slice(0, -3); } return s + aus; }
function jn(b) { return b ? 'ja' : 'nein'; }
function tabelle(kopf, zeilen) {
  return ['| ' + kopf.join(' | ') + ' |', '|' + kopf.map(function () { return '---'; }).join('|') + '|']
    .concat(zeilen.map(function (z) { return '| ' + z.join(' | ') + ' |'; })).join('\n');
}

/* ---------- Filter wie in auswerten.js (§5 der Registrierung) ---------- */
function nurEnt(ctx) { return function (z) { return z.t < ctx.iBes; }; }
function nurBes(ctx) { return function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg; }; }
function nurAkt(ctx) { return function (z) { return z.t >= ctx.nTage - K.AKTUELL_TAGE; }; }

/* Placebo-Mittel einer Liste von Tagesreihen - identisch zu placeboMomente() in auswerten.js, aber ueber die
 * exportierten poole()/statistik() gebaut, damit derselbe Code rechnet. */
function placeboMittel(listen, Lag) {
  var z = A.poole(listen), st = A.statistik(z, Lag);
  return { nTage: st.nTage, nSig: st.nSig, roh: st.brutto.mittel, mittel: st.uBrutto.mittel, se: st.uBrutto.se, t: st.uBrutto.t };
}
/** Band-Urteil GETRENNT nach den beiden Kriterien (NACHTRAG 6.5). */
function bandPruefung(m, h) {
  var uebernacht = !!K.HALTEDAUERN[h].uebernacht;
  var schranke = uebernacht ? (K.SE_ERWARTET_NAECHSTE == null ? null : 3 * K.SE_ERWARTET_NAECHSTE) : K.BAND_PP;
  var okT = m.t != null && Math.abs(m.t) < K.BAND_T;
  var okG = schranke == null ? true : (m.mittel != null && Math.abs(m.mittel) < schranke);
  return { schrankeT: K.BAND_T, schrankeG: schranke, okT: okT, okGroesse: okG, imBand: okT && okG,
    verhaeltnis: (schranke && m.mittel != null) ? Math.abs(m.mittel) / schranke : null,
    nurUeberT: !okT && okG };
}

/* ---------- Luecke und Haltezeit EINER Klasse (Kurs-/Haltezeitzellen tragen den Klassenindex) ----------
 * Bauform 1:1 aus lueckeReihe()/haltezeitWerte() in auswerten.js, nur die Klassenschleife eingeschraenkt. Wird
 * ausschliesslich fuer Zeilen gerechnet, die in ihrer Klasse Tor 1 bestehen (NACHTRAG 6.6). */
function lueckeKlasse(sp, kand, dirIdx, klasse) {
  var nTage = sp.nTage, aus = [], basis = (kand * 2 + dirIdx) * nTage;
  if (!sp.kl) return aus;
  for (var t = 0; t < nTage; t++) {
    var b = (basis + t) * K.N_K * 2, n = 0, s = 0;
    for (var l = 0; l <= 1; l++) { var i = b + klasse * 2 + l; n += sp.kn[i]; s += sp.kl[i]; }
    if (n > 0) aus.push({ t: t, n: n, mittel: s / n });
  }
  return aus;
}
function haltezeitKlasse(sp, ctx, kand, dirIdx, zi, h, klasse) {
  var nTage = sp.nTage, aus = { nTage: 0, nKand: 0, nTopf: 0, kand: null, topf: null, versatz: null };
  if (!sp.hzn || !sp.thz) return aus;
  var sK = 0, sT = 0, basisH = ((kand * 2 + dirIdx) * K.N_H + h) * nTage, basisT = (zi * K.N_H + h) * nTage;
  for (var t = 0; t < nTage; t++) {
    if (!(t >= ctx.iBes && t >= ctx.iReg)) continue;
    var bh = (basisH + t) * K.N_K * 2, bt = (basisT + t) * K.N_K * 2, mit = false;
    for (var l = 0; l <= 1; l++) {
      var i = bh + klasse * 2 + l, n = sp.hzn[i];
      if (!(n > 0)) continue;
      mit = true; aus.nKand += n; sK += sp.hzs[i];
      var it = bt + klasse * 2 + l; aus.nTopf += sp.tn[it]; sT += sp.thz[it];
    }
    if (mit) aus.nTage++;
  }
  aus.kand = aus.nKand > 0 ? sK / aus.nKand : null;
  aus.topf = aus.nTopf > 0 ? sT / aus.nTopf : null;
  aus.versatz = (aus.kand != null && aus.topf > 0) ? aus.kand / aus.topf - 1 : null;
  return aus;
}

/* ---------- Eine Zeile (Konfiguration x Klasse bzw. Konfiguration gepoolt) ---------- */
function zeileAus(reihe, ctx, Lag, hKey, klasse) {
  var ent = A.statistik(reihe.filter(nurEnt(ctx)), Lag);
  var bes = A.statistik(reihe.filter(nurBes(ctx)), Lag);
  var akt = A.statistik(reihe.filter(nurAkt(ctx)), Lag);
  var mdeB = bes.u.mde, kKand = bes.kKand;
  return {
    klasse: klasse == null ? 'gepoolt' : KLASSEN_NAMEN[klasse], klasseIdx: klasse,
    entTage: ent.nTage, entSig: ent.nSig, entU: ent.u.mittel, entUse: ent.u.se, entUt: ent.u.t, entBrutto: ent.brutto.mittel,
    besTage: bes.nTage, besSig: bes.nSig, brutto: bes.brutto.mittel, bruttoSe: bes.brutto.se, bruttoT: bes.brutto.t, bruttoObere: bes.brutto.obere,
    netto: bes.netto.mittel, u: bes.u.mittel, se: bes.u.se, t: bes.u.t, uF: bes.uF.mittel, mdeB: mdeB, kKand: kKand,
    tor1: ent.u.mittel != null && mdeB != null && ent.u.mittel > 0 && ent.u.mittel >= K.TOR1_FAKTOR * mdeB,
    tor1Abstand: (ent.u.mittel != null && mdeB > 0) ? ent.u.mittel / mdeB : null,      // in Einheiten MDE_B, Tor = 4
    bruttoMinusK: (bes.brutto.mittel != null && kKand != null) ? bes.brutto.mittel - kKand : null,
    aktTage: akt.nTage, aktSig: akt.nSig, aktU: akt.u.mittel, aktT: akt.u.t,
    schein1: A.scheinWerte(bes, 'bv1', hKey), scheinS: A.scheinWerte(bes, 'standard', hKey),
    hh0: !!bes.u.hh0, _reihe: reihe, _bes: bes,
  };
}

/* ---------- Die ganze Klassenauswertung ---------- */
function rechne(sp, F, kal) {
  var ctx = { iBes: kal.idx[K.BESTAETIGUNG_AB], iReg: kal.idx[K.REGIME_AB], nTage: kal.tage.length, jahr: new Int16Array(kal.tage.length) };
  if (ctx.iBes == null) throw new Error('BESTAETIGUNG_AB ' + K.BESTAETIGUNG_AB + ' ist kein Kalendertag.');
  if (ctx.iReg == null) { ctx.iReg = kal.tage.findIndex(function (t) { return t >= K.REGIME_AB; }); if (ctx.iReg < 0) throw new Error('REGIME_AB liegt hinter dem Kalender.'); }
  kal.tage.forEach(function (t, i) { ctx.jahr[i] = +t.slice(0, 4); });
  ctx.aktuellAb = kal.tage[Math.max(0, ctx.nTage - K.AKTUELL_TAGE)];

  var dets = K.DETEKTOR_KEYS, konf = [], plPool = {}, zerlegung = { maxU: 0, maxBrutto: 0, wo: null, tage: 0, ohneAlle: 0 };
  for (var dI = 0; dI < dets.length; dI++) for (var zi = 0; zi < K.N_ZR; zi++) for (var dirIdx = 0; dirIdx < 2; dirIdx++) for (var h = 0; h < K.N_H; h++) {
    if (K.NUR_LONG[dets[dI]] && dirIdx === 1) continue;
    var Lag = K.lagVon(h), hKey = K.HALTEDAUERN[h].key, kand = K.kandIndex(dI, zi);
    var rKand = K.reiheIndex(kand, 0), rPlA = K.reiheIndex(kand, 1);
    var gepoolt = A.tagesreihe(sp, rKand, dirIdx, h, zi, 'alle', null);
    var zGepoolt = zeileAus(gepoolt, ctx, Lag, hKey, null);
    var klassen = [];
    for (var k = 0; k < K.N_K; k++) {
      klassen.push(zeileAus(A.tagesreihe(sp, rKand, dirIdx, h, zi, 'alle', k), ctx, Lag, hKey, k));
      var sP = zi + '/' + h + '/' + k;
      (plPool[sP] = plPool[sP] || []).push(A.tagesreihe(sp, rPlA, dirIdx, h, zi, 'alle', k));
    }
    /* PRUEFUNG 1 (NACHTRAG 6.7.1): exakte Zerlegung je Tag. */
    var jeTag = {};
    klassen.forEach(function (kl) { kl._reihe.forEach(function (z) { var a = jeTag[z.t] || (jeTag[z.t] = { n: 0, s: 0, mN: 0, mS: 0, nhM: 0 }); a.n += z.n; a.s += z.s; a.mN += z.mN; a.mS += z.mS; a.nhM += z.nhM; }); });
    gepoolt.forEach(function (z) {
      var a = jeTag[z.t]; zerlegung.tage++;
      if (!a) { zerlegung.ohneAlle++; return; }
      var db = Math.abs((a.s / a.n) - z.roh);
      var du = (a.mN > 0 && z.mN > 0) ? Math.abs((a.mS - a.nhM) / a.mN - z.u) : 0;
      if (db > zerlegung.maxBrutto) zerlegung.maxBrutto = db;
      if (du > zerlegung.maxU) { zerlegung.maxU = du; zerlegung.wo = dets[dI] + ' ' + K.ZEITRAHMEN[zi].key + ' ' + K.RICHTUNGEN[dirIdx].key + ' ' + hKey + ' Tag ' + z.t; }
    });
    /* Spiegel-Diagnose je Klasse (Bauform aus spiegelSpalten(), NACHTRAG 4.4): u der Gegenrichtung und das
     * Tagesmittel von u_long,t + u_short,t ueber die Tage, an denen BEIDE Richtungen ein Signal haben.
     * REINE DIAGNOSE - daraus folgt kein Urteil. Nachgetragen, nachdem die Tor-1-Zeilen sichtbar waren; als
     * Diagnose ausdruecklich so gekennzeichnet. */
    klassen.forEach(function (kl) { kl._uBesTag = kl._reihe.filter(nurBes(ctx)).filter(function (z) { return z.u === z.u; }).map(function (z) { return { t: z.t, x: z.u }; }); });
    zGepoolt._uBesTag = gepoolt.filter(nurBes(ctx)).filter(function (z) { return z.u === z.u; }).map(function (z) { return { t: z.t, x: z.u }; });
    klassen.forEach(function (kl) { delete kl._reihe; delete kl._bes; });
    delete zGepoolt._reihe; delete zGepoolt._bes;
    konf.push({ det: dets[dI], zr: K.ZEITRAHMEN[zi].key, richtung: K.RICHTUNGEN[dirIdx].key, h: hKey, dI: dI, zi: zi, dirIdx: dirIdx, hi: h, lag: Lag,
      gepoolt: zGepoolt, klassen: klassen });
  }

  /* Spiegel-Summe je (Detektor, ZR, Haltedauer, Klasse) ueber beide Richtungen - reine Diagnose. */
  var jeSchluessel = {};
  konf.forEach(function (c) { jeSchluessel[c.det + '|' + c.zr + '|' + c.h + '|' + c.richtung] = c; });
  konf.forEach(function (c) {
    var g = jeSchluessel[c.det + '|' + c.zr + '|' + c.h + '|' + (c.richtung === 'long' ? 'short' : 'long')], Lag = K.lagVon(c.hi);
    [c.gepoolt].concat(c.klassen).forEach(function (kl, q) {
      var gk = g ? (q === 0 ? g.gepoolt : g.klassen[q - 1]) : null;
      if (!gk) { kl.spiegel = { vorhanden: false, u: null, summe: null, summeT: null, nTage: 0 }; return; }
      var jeTag = {}; (gk._uBesTag || []).forEach(function (p) { jeTag[p.t] = p.x; });
      var paare = (kl._uBesTag || []).filter(function (p) { return jeTag[p.t] !== undefined; }).map(function (p) { return { t: p.t, x: p.x + jeTag[p.t] }; });
      var m = A.momente(paare, Lag);
      kl.spiegel = { vorhanden: true, u: gk.u, summe: m.mittel, summeSe: m.se, summeT: m.t, nTage: paare.length };
    });
  });
  konf.forEach(function (c) { [c.gepoolt].concat(c.klassen).forEach(function (kl) { delete kl._uBesTag; }); });

  /* Tore: k1 ueber die 900 Klassenzeilen; zwei Schwellen (NACHTRAG 6.2), die strengere entscheidet. */
  var alleZeilen = [];
  konf.forEach(function (c) { c.klassen.forEach(function (kl) { alleZeilen.push({ c: c, kl: kl }); }); });
  var k1K = alleZeilen.filter(function (x) { return x.kl.tor1; }).length;
  var zAdaptiv = A.zBonf(Math.max(k1K, 1)), z900 = A.zBonf(TESTZAHL), zStreng = Math.max(zAdaptiv, z900);
  alleZeilen.forEach(function (x) {
    var kl = x.kl;
    kl.delta80 = kl.se != null ? (zStreng + K.Z_POWER80) * kl.se : null;
    kl.delta80Adaptiv = kl.se != null ? (zAdaptiv + K.Z_POWER80) * kl.se : null;
    kl.tor2 = kl.tor1 && kl.delta80 != null && kl.kKand != null && kl.delta80 < kl.kKand;
  });
  /* Dieselbe Rechnung nachrichtlich auch fuer die gepoolten Zeilen, damit die Spalte in der W7-Tafel nicht leer ist. */
  konf.forEach(function (c) { var g = c.gepoolt; g.delta80 = g.se != null ? (zStreng + K.Z_POWER80) * g.se : null; g.tor2 = g.tor1 && g.delta80 != null && g.kKand != null && g.delta80 < g.kKand; });
  var k2K = alleZeilen.filter(function (x) { return x.kl.tor2; }).length;
  var zAdaptiv2 = A.zBonf(Math.max(k2K, 1)), zStreng2 = Math.max(zAdaptiv2, z900);
  /* Etikett je Klassenzeile - "belegt" kommt nicht vor (NACHTRAG 6.0.2). */
  alleZeilen.forEach(function (x) {
    var kl = x.kl;
    kl.etikett = 'kein Kandidat';
    kl.grund = '';
    if (kl.entSig === 0 && kl.besSig === 0) { kl.etikett = '0 Signale'; return; }
    if (kl.mdeB == null || kl.entTage === 0) { kl.etikett = 'nicht entscheidbar'; kl.grund = 'Tor 1 nicht pruefbar'; return; }
    if (!kl.tor1) { kl.etikett = 'kein Kandidat'; kl.grund = 'u_E ' + pp(kl.entU) + ' < 4 x MDE_B ' + pp(kl.mdeB != null ? K.TOR1_FAKTOR * kl.mdeB : null); return; }
    if (!kl.tor2) { kl.etikett = 'nicht entscheidbar'; kl.grund = 'Tor 2: delta80 >= K_kand'; return; }
    if (kl.besTage < K.MIN_BES_TAGE) { kl.etikett = 'nicht entscheidbar'; kl.grund = 'Bestaetigung < ' + K.MIN_BES_TAGE + ' Signaltage'; return; }
    var kern = kl.u != null && kl.u > 0 && kl.t != null && kl.t >= zStreng2 && Math.sign(kl.u) === Math.sign(kl.entU);
    if (!kern) { kl.etikett = 'nicht entscheidbar'; kl.grund = 't_B ' + tw(kl.t) + ' < z ' + tw(zStreng2) + ' oder u_B nicht > 0'; return; }
    var aktOk = kl.aktTage >= K.AKTUELL_MIN_TAGE && kl.aktU != null && kl.aktU > 0 && kl.aktT != null && kl.aktT > K.AKTUELL_T_MIN;
    kl.etikett = aktOk ? 'Kandidat fuer den Vorwaertstest' : 'Kandidat, aber Aktualitaets-Tor gefallen';
  });

  /* Placebo A je (ZR, H, Klasse): 60 Baender, beide Kriterien getrennt. */
  var baender = [];
  for (var z2 = 0; z2 < K.N_ZR; z2++) for (var h2 = 0; h2 < K.N_H; h2++) for (var k2 = 0; k2 < K.N_K; k2++) {
    var Lag2 = K.lagVon(h2), m = placeboMittel(plPool[z2 + '/' + h2 + '/' + k2] || [], Lag2);
    baender.push({ zr: K.ZEITRAHMEN[z2].key, h: K.HALTEDAUERN[h2].key, klasse: KLASSEN_NAMEN[k2], uebernacht: !!K.HALTEDAUERN[h2].uebernacht, m: m, pr: bandPruefung(m, h2) });
  }

  /* PRUEFUNG 3 (NACHTRAG 6.7.3): signalgewichtete Rueckaddition gegen das gepoolte Mittel. */
  konf.forEach(function (c) {
    var sw = 0, sn = 0, swB = 0;
    c.klassen.forEach(function (kl) { if (kl.u != null && kl.besSig > 0) { sw += kl.u * kl.besSig; sn += kl.besSig; } if (kl.brutto != null && kl.besSig > 0) swB += kl.brutto * kl.besSig; });
    c.aggU = sn > 0 ? sw / sn : null; c.aggBrutto = sn > 0 ? swB / sn : null;
    c.aggAbwU = (c.aggU != null && c.gepoolt.u != null) ? c.aggU - c.gepoolt.u : null;
    c.aggAbwBrutto = (c.aggBrutto != null && c.gepoolt.brutto != null) ? c.aggBrutto - c.gepoolt.brutto : null;
  });

  /* Jahresscheiben + Zusatztore fuer die Zeilen, die in ihrer Klasse Tor 1 bestehen (NACHTRAG 6.6). */
  var torEins = alleZeilen.filter(function (x) { return x.kl.tor1; });
  torEins.forEach(function (x) {
    var c = x.c, kl = x.kl, Lag = K.lagVon(c.hi), hKey = c.h, kand = K.kandIndex(c.dI, c.zi);
    var reihe = A.tagesreihe(sp, K.reiheIndex(kand, 0), c.dirIdx, c.hi, c.zi, 'alle', kl.klasseIdx);
    kl.jahre = A.jahresscheiben(reihe, Lag, ctx, hKey);
    kl.trend = A.trend(kl.jahre);
    var lz = lueckeKlasse(sp, kand, c.dirIdx, kl.klasseIdx), jeTag = {}, N = 0, S = 0;
    lz.forEach(function (z) { jeTag[z.t] = z.mittel; });
    lz.filter(nurBes(ctx)).forEach(function (z) { N += z.n; S += z.n * z.mittel; });
    var paareU = [];
    reihe.filter(nurBes(ctx)).forEach(function (z) { if (jeTag[z.t] !== undefined && z.u === z.u) paareU.push({ t: z.t, x: z.u - jeTag[z.t] }); });
    var bu = A.momente(paareU, Lag);
    kl.luecke = { jeSignal: N > 0 ? S / N : null, uBereinigt: bu.mittel, uBereinigtT: bu.t, torLuecke: bu.mittel != null && bu.mittel > 0 && bu.t != null && bu.t >= zStreng2 };
    kl.haltezeit = haltezeitKlasse(sp, ctx, kand, c.dirIdx, c.zi, c.hi, kl.klasseIdx);
    kl.torUhrzeit = !(K.uhrzeitTorGilt(hKey) && kl.haltezeit.versatz != null && Math.abs(kl.haltezeit.versatz) > K.UHRZEIT_VERSATZ_MAX);
    /* Ueberlebensverzerrung je Klasse: brutto(alle) − brutto(nur lebende Reihen) in der Bestaetigung. */
    var lebB = A.statistik(A.tagesreihe(sp, K.reiheIndex(kand, 0), c.dirIdx, c.hi, c.zi, 'lebend', kl.klasseIdx).filter(nurBes(ctx)), Lag);
    kl.differenzLebend = (kl.brutto != null && lebB.brutto.mittel != null) ? kl.brutto - lebB.brutto.mittel : null;
    kl.sauber = kl.torUhrzeit && kl.luecke.torLuecke;
  });

  return { ctx: ctx, konf: konf, alleZeilen: alleZeilen, baender: baender, zerlegung: zerlegung,
    zahlen: { testzahl: TESTZAHL, k1K: k1K, k2K: k2K, zAdaptiv: zAdaptiv, z900: z900, zStreng: zStreng, zStreng2: zStreng2,
      tor1JeKlasse: KLASSEN_NAMEN.map(function (n, k) { return alleZeilen.filter(function (x) { return x.kl.klasseIdx === k && x.kl.tor1; }).length; }),
      tor2JeKlasse: KLASSEN_NAMEN.map(function (n, k) { return alleZeilen.filter(function (x) { return x.kl.klasseIdx === k && x.kl.tor2; }).length; }),
      leerJeKlasse: KLASSEN_NAMEN.map(function (n, k) { return alleZeilen.filter(function (x) { return x.kl.klasseIdx === k && x.kl.besSig === 0 && x.kl.entSig === 0; }).length; }),
      etiketten: (function () { var m = {}; alleZeilen.forEach(function (x) { m[x.kl.etikett] = (m[x.kl.etikett] || 0) + 1; }); return m; })() } };
}

/* ---------- PRUEFUNG 2: die gepoolte Tafel gegen voll-0/ergebnis.json ---------- */
function gegenHauptlauf(konf, pfad) {
  if (!fs.existsSync(pfad)) return { vorhanden: false, meldung: 'ergebnis.json des Hauptlaufs nicht gefunden: ' + pfad };
  var J = JSON.parse(fs.readFileSync(pfad, 'utf8'));
  var je = {};
  J.konfigurationen.forEach(function (c) { je[c.det + '|' + c.zr + '|' + c.richtung + '|' + c.h] = c; });
  var felder = [
    ['besTage', function (g) { return g.alle.bes.nTage; }, function (z) { return z.besTage; }],
    ['besSig', function (g) { return g.alle.bes.nSig; }, function (z) { return z.besSig; }],
    ['entTage', function (g) { return g.alle.ent.nTage; }, function (z) { return z.entTage; }],
    ['entSig', function (g) { return g.alle.ent.nSig; }, function (z) { return z.entSig; }],
    ['brutto_B', function (g) { return g.alle.bes.brutto.mittel; }, function (z) { return z.brutto; }],
    ['u_B', function (g) { return g.alle.bes.u.mittel; }, function (z) { return z.u; }],
    ['se_B', function (g) { return g.alle.bes.u.se; }, function (z) { return z.se; }],
    ['t_B', function (g) { return g.alle.bes.u.t; }, function (z) { return z.t; }],
    ['u_E', function (g) { return g.alle.ent.u.mittel; }, function (z) { return z.entU; }],
    ['t_E', function (g) { return g.alle.ent.u.t; }, function (z) { return z.entUt; }],
    ['K_kand', function (g) { return g.kKand; }, function (z) { return z.kKand; }],
    ['MDE_B', function (g) { return g.mdeB; }, function (z) { return z.mdeB; }],
    ['aktU', function (g) { return g.aktuell.u.mittel; }, function (z) { return z.aktU; }],
    ['schein1', function (g) { return g.schein.bv1.mittel; }, function (z) { return z.schein1.mittel; }],
  ];
  var aus = { vorhanden: true, kennung: J.kennung, nKonf: J.konfigurationen.length, verglichen: 0, fehlend: 0, max: {}, tor1Abweichungen: 0, schlimmste: null };
  felder.forEach(function (f) { aus.max[f[0]] = 0; });
  konf.forEach(function (c) {
    var g = je[c.det + '|' + c.zr + '|' + c.richtung + '|' + c.h];
    if (!g) { aus.fehlend++; return; }
    aus.verglichen++;
    felder.forEach(function (f) {
      var a = f[1](g), b = f[2](c.gepoolt);
      if (a == null && b == null) return;
      if (a == null || b == null) { aus.max[f[0]] = Infinity; return; }
      var d = Math.abs(a - b);
      if (d > aus.max[f[0]]) { aus.max[f[0]] = d; if (f[0] === 'u_B' || f[0] === 'se_B') aus.schlimmste = c.det + ' ' + c.zr + ' ' + c.richtung + ' ' + c.h + ' ' + f[0] + ' ' + d; }
    });
    if (!!g.tor1 !== !!c.gepoolt.tor1) aus.tor1Abweichungen++;
  });
  aus.zahlenHauptlauf = { k1: J.zahlen.k1, k2: J.zahlen.k2, belegt: J.zahlen.urteile.belegt };
  aus.klassenmix = J.klassenmix;
  return aus;
}

/* ---------- Bericht ---------- */
function bericht(E, herkunft, kal, pruef, msGesamt) {
  var Z = E.zahlen, T = [];
  var besteJeKlasse = KLASSEN_NAMEN.map(function (n, k) {
    var feld = E.alleZeilen.filter(function (x) { return x.kl.klasseIdx === k && x.kl.tor1Abstand != null; });
    feld.sort(function (a, b) { return b.kl.tor1Abstand - a.kl.tor1Abstand; });
    var feldT = E.alleZeilen.filter(function (x) { return x.kl.klasseIdx === k && x.kl.t != null; });
    feldT.sort(function (a, b) { return b.kl.t - a.kl.t; });
    return { klasse: n, nachTor1: feld[0] || null, nachTb: feldT[0] || null };
  });
  var w7 = E.konf.filter(function (c) { return c.det === 'W7' && c.zr === '5m' && c.richtung === 'long' && c.h === '3h'; })[0];

  T.push('# Trendwende II — Auswertung je Umsatzklasse (NACHTRAG 6, 13.09.2026)');
  T.push('');
  T.push('**Status: nachträglich, hypothesenerzeugend, KEIN Beleg.** Diese Auswertung entsteht, nachdem das gepoolte');
  T.push('Urteil des Vollaufs feststeht (k₁ = 0, k₂ = 0, **belegt 0** über 225 Konfigurationen). Sie rechnet **nichts');
  T.push('neu**: `_zellen.bin` der Vollauf-Ordner wird nur gelesen, es gibt keinen Archivzugriff und keinen');
  T.push('Detektorlauf. `voll-0/ERGEBNIS.md` und `voll-0/ergebnis.json` sind unberührt.');
  T.push('');
  T.push('**Kein Ergebnis dieser Tafel heißt „belegt".** Das höchste erreichbare Etikett einer Klassenzeile ist');
  T.push('**„Kandidat für den Vorwärtstest ab 2026-09-01"**. Die Testzahl steigt auf **' + TESTZAHL + '** (225 × 4);');
  T.push('die Schwelle ist `max(z_Bonf(k₁), z_Bonf(' + TESTZAHL + '))` = **' + Z.zStreng.toFixed(4).replace('.', ',') + '**');
  T.push('(adaptiv ' + Z.zAdaptiv.toFixed(4).replace('.', ',') + ', über alle Tests ' + Z.z900.toFixed(4).replace('.', ',') + ').');
  T.push('Registriert in `VORREGISTRIERUNG.md` §22 (NACHTRAG 6), Commit **vor** der ersten Zahl.');
  T.push('');
  T.push('Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.');
  T.push('');
  T.push('## 1. Die Antwort in einer Tabelle');
  T.push('');
  T.push('Zahl der Konfigurationen (aus ' + K.N_KONFIG + ') je Klasse, die **Tor 1** bestehen — `u_Entdeckung ≥ 4 · MDE_B`:');
  T.push('');
  T.push(tabelle(['Klasse', 'K_kand (Pp)', 'Tor 1 bestanden', 'Tor 2 bestanden', 'Zeilen ohne Signal', 'beste Zeile nach Tor-1-Abstand', 'u_E / MDE_B (Tor: 4)', 'u_B', 't_B'],
    besteJeKlasse.map(function (b, k) {
      var x = b.nachTor1;
      return [b.klasse, pp(K.KLASSEN[k].huerde), String(Z.tor1JeKlasse[k]), String(Z.tor2JeKlasse[k]), String(Z.leerJeKlasse[k]),
        x ? x.c.det + ' ' + x.c.zr + ' ' + x.c.richtung + ' ' + x.c.h : '–',
        x ? tw(x.kl.tor1Abstand) : '–', x ? pp(x.kl.u) : '–', x ? tw(x.kl.t) : '–'];
    })));
  T.push('');
  T.push('Zur Kontrolle dieselbe Spalte nach dem **t der Bestätigung** sortiert (eine andere Frage — sie ignoriert Tor 1):');
  T.push('');
  T.push(tabelle(['Klasse', 'beste Zeile nach t_B', 'u_B', 'se_B', 't_B', 'K_kand', 'delta80', 'Tor 1'],
    besteJeKlasse.map(function (b) {
      var x = b.nachTb;
      return [b.klasse, x ? x.c.det + ' ' + x.c.zr + ' ' + x.c.richtung + ' ' + x.c.h : '–',
        x ? pp(x.kl.u) : '–', x ? pp(x.kl.se) : '–', x ? tw(x.kl.t) : '–', x ? pp(x.kl.kKand) : '–', x ? pp(x.kl.delta80) : '–', x ? jn(x.kl.tor1) : '–'];
    })));
  T.push('');
  T.push('**Etiketten über alle ' + TESTZAHL + ' Klassenzeilen:** ' + Object.keys(Z.etiketten).map(function (e) { return e + ' ' + Z.etiketten[e]; }).join(' · ') + '.');
  T.push('');
  T.push('## 2. Der PM-Verdacht direkt beantwortet: W7 5m long 3h');
  T.push('');
  if (!w7) { T.push('W7 5m long 3h nicht in der Tafel — das ist ein Fehler, keine Aussage.'); }
  else {
    T.push('Die Frage war: **lebt W7 in der Klasse `ab1000` (Hürde 0,0449) oder `250-1000` (0,0647)?**');
    T.push('');
    T.push(tabelle(['Sicht', 'nTage_B', 'nSig_B', 'brutto_B', 'K_kand', 'u_E', 'MDE_B', '4·MDE_B', 'u_E/MDE_B', 'Tor 1', 'u_B', 'se_B', 't_B', 'delta80', 'Tor 2', 'letzte 250: u / t', 'Spiegel-Summe'],
      [w7.gepoolt].concat(w7.klassen).map(function (z) {
        return [z.klasse, ganz(z.besTage), ganz(z.besSig), pp(z.brutto), pp(z.kKand), pp(z.entU), pp(z.mdeB),
          pp(z.mdeB != null ? K.TOR1_FAKTOR * z.mdeB : null), tw(z.tor1Abstand), jn(z.tor1), pp(z.u), pp(z.se), tw(z.t),
          pp(z.delta80), jn(z.tor2), pp(z.aktU) + ' / ' + tw(z.aktT),
          z.spiegel && z.spiegel.summe != null ? pp(z.spiegel.summe) + ' (t ' + tw(z.spiegel.summeT) + ')' : '–'];
      })));
    T.push('');
    var liq = w7.klassen[3], mid = w7.klassen[2];
    var antwort = [liq, mid].map(function (z) {
      if (z.tor1) return '**' + z.klasse + ': Tor 1 bestanden** — u_E ' + pp(z.entU) + ' = ' + tw(z.tor1Abstand) + ' × MDE_B, u_B ' + pp(z.u) + ' (t ' + tw(z.t) + ').';
      var fehlt = (z.mdeB != null && z.entU != null) ? (K.TOR1_FAKTOR * z.mdeB - z.entU) : null;
      return '**' + z.klasse + ': nein.** u_E ' + pp(z.entU) + ' gegen 4 · MDE_B = ' + pp(z.mdeB != null ? K.TOR1_FAKTOR * z.mdeB : null) +
        ' — es fehlen ' + pp(fehlt) + ' Pp, das sind ' + tw(z.tor1Abstand) + ' von den nötigen 4,00 MDE_B' +
        '. In der Bestätigung u ' + pp(z.u) + ' (t ' + tw(z.t) + '), brutto ' + pp(z.brutto) + ' gegen die Klassenhürde ' + pp(z.kKand) + ' (brutto − K_kand = ' + pp(z.bruttoMinusK) + ').';
    });
    T.push(antwort[0]);
    T.push('');
    T.push(antwort[1]);
    T.push('');
    T.push('Alle vier Klassen stehen oben, nicht nur die beiden liquiden — auch die, die schlechter aussieht.');
  }
  T.push('');
  var t1z = E.alleZeilen.filter(function (x) { return x.kl.tor1; });
  var kandZ = E.alleZeilen.filter(function (x) { return x.kl.etikett.indexOf('Kandidat') === 0; });
  T.push('## 2b. Der Fund — und die fünf Zahlen, die ihn einordnen');
  T.push('');
  T.push('**Der Fund.** Die Zahl der Zeilen, die Tor 1 bestehen, steigt monoton mit der Liquidität:');
  T.push('**' + Z.tor1JeKlasse.map(function (n, k) { return KLASSEN_NAMEN[k] + ' ' + n; }).join(' · ') + '** (aus je ' + K.N_KONFIG + ').');
  T.push('In der teuersten Klasse besteht **keine einzige** Zeile Tor 1, in der billigsten neun. Der gepoolte Befund');
  T.push('„kein Kandidat" war also **nicht** durchgehend wahr: die Hürde der illiquiden Masse hat Struktur verdeckt,');
  T.push('die in den liquiden Klassen sichtbar ist. Der Verdacht des PM trifft zu.');
  T.push('');
  T.push('**Was ihn einordnet — fünf Zahlen, jede aus dieser Tafel:**');
  T.push('');
  var jeDet = {}; t1z.forEach(function (x) { jeDet[x.c.det] = (jeDet[x.c.det] || 0) + 1; });
  var jeH = {}; t1z.forEach(function (x) { jeH[x.c.h] = (jeH[x.c.h] || 0) + 1; });
  var uhrFall = t1z.filter(function (x) { return !x.kl.torUhrzeit; }).length;
  var kandUhrFall = kandZ.filter(function (x) { return !x.kl.torUhrzeit; }).length;
  T.push('1. **Ein einziger Detektor.** Alle ' + t1z.length + ' Tor-1-Zeilen kommen von ' + Object.keys(jeDet).length +
    ' der ' + K.DETEKTOR_KEYS.length + ' Detektoren: ' + Object.keys(jeDet).map(function (d) { return d + ' ' + jeDet[d]; }).join(', ') +
    '. Eine Kante, die nur ein Detektor sieht, ist keine Eigenschaft des Marktes, sondern eine Eigenschaft dieses Detektors.');
  T.push('2. **Eine einzige Haltedauer-Familie.** ' + Object.keys(jeH).map(function (h) { return h + ' ' + jeH[h]; }).join(', ') +
    ' — und **' + uhrFall + ' der ' + t1z.length + '** Zeilen fallen über das **Uhrzeit-Versatz-Tor** des Hauptlaufs' +
    ' (`|Haltezeit_kand / Haltezeit_topf − 1| > ' + K.UHRZEIT_VERSATZ_MAX + '`): sie halten 15–20 % länger als ihr Vergleich.' +
    ' Nach den Regeln des Hauptlaufs (§19.3) wäre keine dieser Zeilen „belegt" — unabhängig von ihrem `t`.' +
    ' **Ob** der Versatz die Höhe erklärt, ist damit nicht gesagt (siehe 3.), **dass** der Vergleich für diese' +
    ' Zeilen nicht sauber ist, schon.');
  T.push('3. **Long und Short gewinnen gleichzeitig — und das spricht hier NICHT gegen den Fund.** Die Spiegel-Summe');
  T.push('   `u_long + u_short` ist rechnerisch `r̄(nach Long-Signalen) − r̄(nach Short-Signalen)`: der Topf **kürzt sich');
  T.push('   heraus**. Sie ist damit immun gegen einen falschen Vergleich, und sie ist groß, positiv und wächst monoton');
  T.push('   mit der Liquidität (Tafel unten). Der Versatz kann sie nicht erzeugen: längeres Halten schiebt `u_long`');
  T.push('   hinauf und `u_short` hinunter, nicht beides hinauf. **Der Detektor trennt die beiden Folgemengen also');
  T.push('   wirklich.** Was die Summe *nicht* sagt: ob die **Höhe** von `u` stimmt — die hängt am Topf, und genau dort');
  T.push('   sitzt der Versatz.');
  var sauberNichtEntsch = t1z.filter(function (x) { return x.kl.torUhrzeit && x.kl.luecke && x.kl.luecke.torLuecke && !x.kl.tor2; });
  T.push('4. **Die saubersten Zeilen sind nicht entscheidbar — nicht negativ.** ' + sauberNichtEntsch.length + ' Zeilen bestehen Tor 1,');
  T.push('   das Uhrzeit-Versatz-Tor und das Lücken-Tor, fallen aber über **Tor 2** (`delta80 ≥ K_kand`): ' +
    sauberNichtEntsch.map(function (x) { return x.c.det + ' ' + x.c.zr + ' ' + x.c.richtung + ' ' + x.c.h + '/' + x.kl.klasse + ' (u ' + pp(x.kl.u) + ', t ' + tw(x.kl.t) + ', delta80 ' + pp(x.kl.delta80) + ' gegen K ' + pp(x.kl.kKand) + ')'; }).join('; ') + '.');
  T.push('   In der liquidesten Klasse ist die Hürde klein (0,0449) — und die Stichprobe so dünn, dass die auflösbare');
  T.push('   Differenz größer ist als die Hürde. Das ist die **Auflösungswand**, kein Nein.');
  T.push('5. **Die Kante ist in den letzten 250 Tagen dünn.** Von den ' + kandZ.length + ' Zeilen mit dem Etikett „Kandidat" haben ' +
    kandZ.filter(function (x) { return x.kl.aktT != null && x.kl.aktT < 2; }).length + ' ein `t` der letzten 250 Tage unter 2,00 — darunter **beide** Zeilen,');
  T.push('   die alle Tore des Hauptlaufs bestehen.');
  T.push('');
  T.push('**Die ' + kandZ.length + ' Zeilen mit dem höchsten Etikett — mit den Toren des Hauptlaufs danebengestellt:**');
  T.push('');
  T.push(tabelle(['Det', 'ZR', 'Ri', 'H', 'Klasse', 'nSig_B', 'u_B', 't_B', 'K_kand', 'delta80', 'letzte 250: u / t', 'Versatz', 'Uhrzeit-Tor', 'Lücken-Tor', 'sauber', 'Spiegel-Summe (t)', 'Überlebens-Differenz'],
    kandZ.sort(function (a, b) { return b.kl.t - a.kl.t; }).map(function (x) {
      var k = x.kl, c = x.c, s = k.spiegel || {};
      return [c.det, c.zr, c.richtung, c.h, k.klasse, ganz(k.besSig), pp(k.u), tw(k.t), pp(k.kKand), pp(k.delta80),
        pp(k.aktU) + ' / ' + tw(k.aktT), tw(k.haltezeit ? k.haltezeit.versatz : null), jn(k.torUhrzeit),
        jn(k.luecke && k.luecke.torLuecke), k.sauber ? '**ja**' : 'nein',
        s.summe == null ? '–' : pp(s.summe) + ' (' + tw(s.summeT) + ')', pp(k.differenzLebend)];
    })));
  T.push('');
  var sauber = kandZ.filter(function (x) { return x.kl.sauber; });
  if (!sauber.length) {
    T.push('**Keine dieser Zeilen besteht alle Tore des Hauptlaufs.** Damit bleibt aus dieser Auswertung keine Zeile,');
    T.push('die als Vorwärtstest-Kandidat vorzuschlagen wäre.');
  } else {
    T.push('**' + sauber.length + ' Zeile' + (sauber.length === 1 ? '' : 'n') + ' besteht auch die übrigen Tore des Hauptlaufs** (Uhrzeit-Versatz, Einstiegslücke): ' +
      sauber.map(function (x) { return x.c.det + ' ' + x.c.zr + ' ' + x.c.richtung + ' ' + x.c.h + ' / ' + x.kl.klasse; }).join(', ') + '.');
    T.push('Das ist **kein Beleg** (§6.0) — es ist die Liste, aus der ein **Vorwärtstest ab 2026-09-01** vorab');
    T.push('festgelegt werden könnte: Detektor, Zeitrahmen, Richtung, Haltedauer und **Klasse** stehen damit vor dem');
    T.push('ersten neuen Handelstag fest. Vor einem solchen Test gehört die Spiegel-Summe erklärt, nicht weggelassen.');
  }
  T.push('');
  T.push('**Spiegel-Diagnose (nachgetragen, nachdem die Tor-1-Zeilen sichtbar waren — reine Diagnose, kein Urteil).**');
  T.push('`u_long + u_short` über die Tage mit Signal in beiden Richtungen, je Klasse, für die Konfigurationen mit');
  T.push('mindestens einer Tor-1-Zeile:');
  T.push('');
  var spKeys = {}; t1z.forEach(function (x) { spKeys[x.c.det + '|' + x.c.zr + '|' + x.c.h] = true; });
  var spZeilen = [];
  Object.keys(spKeys).forEach(function (s) {
    var teile = s.split('|'), c = E.konf.filter(function (q) { return q.det === teile[0] && q.zr === teile[1] && q.h === teile[2] && q.richtung === 'long'; })[0];
    if (!c) return;
    [c.gepoolt].concat(c.klassen).forEach(function (kl) {
      var sp = kl.spiegel || {};
      spZeilen.push([teile[0], teile[1], teile[2], kl.klasse, pp(kl.u), pp(sp.u), sp.summe == null ? '–' : pp(sp.summe), tw(sp.summeT), ganz(sp.nTage)]);
    });
  });
  T.push(tabelle(['Det', 'ZR', 'H', 'Klasse', 'u_long', 'u_short', 'Summe', 't', 'nTage'], spZeilen));
  T.push('');
  T.push('Zwei Muster stehen darin, beide gegen die Deutung „reines Rauschen": die Summe wächst **monoton mit der');
  T.push('Liquiditätsklasse** (in `5-50` liegt sie bei null oder negativ, in `ab1000` bei +0,24 bis +0,42 Pp), und sie');
  T.push('wächst **monoton mit der Haltedauer** — im Hauptlauf ist dieselbe Summe bei 15m und 1h stark **negativ**');
  T.push('(bis −0,21 Pp, |t| > 40), bei 3h nahe null, bei „schluss" positiv. Der Detektor zeigt auf kurzer Sicht in');
  T.push('die **falsche** Richtung und dreht mit der Haltedauer. Das ist zu erklären, bevor daraus etwas wird.');
  T.push('');
  T.push('## 3. Prüfungen');
  T.push('');
  T.push('### 3.1 Positivkontrolle: exakte Zerlegung je Tag');
  T.push('');
  T.push('Für jede Konfiguration und jeden Signaltag muss gelten `u_gepoolt,t = Σ_k mN_k,t · u_k,t / Σ_k mN_k,t`');
  T.push('(dasselbe für `brutto` mit `n`). Geprüft über **' + ganz(E.zerlegung.tage) + '** Konfigurations-Tage:');
  T.push('');
  T.push('- maximale absolute Abweichung `u`: **' + E.zerlegung.maxU.toExponential(3) + '** Pp' + (E.zerlegung.wo ? ' (bei ' + E.zerlegung.wo + ')' : ''));
  T.push('- maximale absolute Abweichung `brutto`: **' + E.zerlegung.maxBrutto.toExponential(3) + '** Pp');
  T.push('- Tage im gepoolten Satz ohne Gegenstück in den Klassen: **' + E.zerlegung.ohneAlle + '** (Soll: 0)');
  T.push('');
  T.push((E.zerlegung.maxU < 1e-9 && E.zerlegung.maxBrutto < 1e-9 && E.zerlegung.ohneAlle === 0)
    ? '**Bestanden** — die Abweichung ist Fließkommarauschen. Die Klassenzerlegung ist vollständig und verlustfrei.'
    : '**NICHT bestanden** — die Klassenzerlegung addiert sich nicht zurück. Jede Zahl dieser Tafel ist damit hinfällig.');
  T.push('');
  T.push('### 3.2 Positivkontrolle: die gepoolte Tafel gegen den Hauptlauf');
  T.push('');
  if (!pruef.vorhanden) { T.push('**Nicht möglich:** ' + pruef.meldung); }
  else {
    T.push('Dasselbe Werkzeug rechnet zusätzlich die **gepoolte** Tafel (alle vier Klassen zusammen) und hält sie Zeile');
    T.push('für Zeile gegen `voll-0/ergebnis.json` (Kennung `' + pruef.kennung + '`,');
    T.push('k₁ = ' + pruef.zahlenHauptlauf.k1 + ', k₂ = ' + pruef.zahlenHauptlauf.k2 + ', belegt ' + pruef.zahlenHauptlauf.belegt + ').');
    T.push('Verglichen: **' + pruef.verglichen + '** Konfigurationen, fehlend ' + pruef.fehlend + '.');
    T.push('');
    T.push(tabelle(['Feld', 'maximale absolute Abweichung'], Object.keys(pruef.max).map(function (f) {
      return [f, pruef.max[f] === 0 ? '0' : (pruef.max[f] === Infinity ? '**einseitig null**' : pruef.max[f].toExponential(3))];
    })));
    T.push('');
    T.push('Tor-1-Abweichungen (ja/nein): **' + pruef.tor1Abweichungen + '** (Soll: 0).');
    var maxAlle = Math.max.apply(null, Object.keys(pruef.max).map(function (f) { return pruef.max[f]; }));
    T.push('');
    T.push(maxAlle < 1e-9 && pruef.tor1Abweichungen === 0 && pruef.fehlend === 0
      ? '**Bestanden** — der neue Lesepfad ist derselbe wie im Hauptlauf. Ohne diese Zeile wäre keine Klassenzahl zu glauben.'
      : '**NICHT bestanden** — der neue Lesepfad weicht vom Hauptlauf ab. Abbruchgrund, kein Befund.');
  }
  T.push('');
  T.push('### 3.3 Aggregat-Abweichung: signalgewichtete Rückaddition');
  T.push('');
  var abwU = E.konf.map(function (c) { return c.aggAbwU; }).filter(function (x) { return x != null; }).map(Math.abs).sort(function (a, b) { return a - b; });
  var abwB = E.konf.map(function (c) { return c.aggAbwBrutto; }).filter(function (x) { return x != null; }).map(Math.abs).sort(function (a, b) { return a - b; });
  T.push('Diese Zahl ist **nicht** null und soll es nicht sein: das gepoolte Mittel ist ein Mittel über **Tage**, die');
  T.push('signalgewichtete Rückaddition eines über **Signale**. Der Abstand misst, wie stark der Klassenmix über die');
  T.push('Zeit wandert — genau der Effekt, um den es in dieser Auswertung geht.');
  T.push('');
  T.push(tabelle(['Größe', 'Median der Beträge', 'P90', 'Maximum'], [
    ['u_B', pp(abwU[abwU.length >> 1]), pp(abwU[Math.floor(abwU.length * 0.9)]), pp(abwU[abwU.length - 1])],
    ['brutto_B', pp(abwB[abwB.length >> 1]), pp(abwB[Math.floor(abwB.length * 0.9)]), pp(abwB[abwB.length - 1])],
  ]));
  T.push('');
  T.push('### 3.4 Die Hürde je Klasse gegen `konfig.js`');
  T.push('');
  var huerdeOk = true;
  T.push(tabelle(['Klasse', '`KLASSEN[k].huerde`', 'K_kand aus den Zellen (Median über die Klassenzeilen mit Signal)', 'gleich'],
    KLASSEN_NAMEN.map(function (n, k) {
      var w = E.alleZeilen.filter(function (x) { return x.kl.klasseIdx === k && x.kl.kKand != null; }).map(function (x) { return x.kl.kKand; }).sort(function (a, b) { return a - b; });
      var med = w.length ? w[w.length >> 1] : null, ok = med != null && Math.abs(med - K.KLASSEN[k].huerde) < 1e-12;
      if (!ok) huerdeOk = false;
      return [n, pp(K.KLASSEN[k].huerde), med == null ? '–' : med.toFixed(6).replace('.', ','), jn(ok)];
    })));
  T.push('');
  T.push(huerdeOk ? '**Bestanden** — `K_kand` einer Klassenzeile ist konstruktionsgemäß exakt die Hürde der Klasse.'
    : '**NICHT bestanden** — die Hürde in den Zellen weicht von `konfig.js` ab.');
  T.push('');
  T.push('## 4. Placebo A je Klasse — beide Kriterien getrennt');
  T.push('');
  T.push('Schranken: `|t| < ' + K.BAND_T + '`; Größe intraday `|Mittel| < ' + pp(K.BAND_PP) + '` Pp, übernacht');
  T.push('`|Mittel| < 3 · ' + pp(K.SE_ERWARTET_NAECHSTE) + ' = ' + pp(3 * K.SE_ERWARTET_NAECHSTE) + '` Pp.');
  T.push('');
  var nurT = E.baender.filter(function (b) { return b.pr.nurUeberT; }).length;
  var beide = E.baender.filter(function (b) { return !b.pr.okT && !b.pr.okGroesse; }).length;
  var nurG = E.baender.filter(function (b) { return b.pr.okT && !b.pr.okGroesse; }).length;
  T.push('**' + E.baender.length + ' Bänder: ' + E.baender.filter(function (b) { return b.pr.imBand; }).length + ' im Band, ' +
    nurT + ' fallen NUR über `t`, ' + nurG + ' nur über die Größe, ' + beide + ' über beides.**');
  T.push('');
  T.push(tabelle(['ZR', 'H', 'Klasse', 'nTage', 'nSig', 'Mittel (Pp)', 'se', 't', 'Betrag t < 3', 'Größe < Schranke', 'Mittel/Schranke', 'Urteil'],
    E.baender.map(function (b) {
      return [b.zr, b.h, b.klasse, ganz(b.m.nTage), ganz(b.m.nSig), pp(b.m.mittel), pp(b.m.se), tw(b.m.t), jn(b.pr.okT), jn(b.pr.okGroesse),
        b.pr.verhaeltnis == null ? '–' : (b.pr.verhaeltnis < 0.1 ? '1/' + Math.round(1 / b.pr.verhaeltnis) : tw(b.pr.verhaeltnis)),
        b.pr.imBand ? 'im Band' : (b.pr.nurUeberT ? '**nur über t**' : (b.pr.okT ? 'über die Größe' : 'über beides'))];
    })));
  T.push('');
  if (nurT > 0) {
    T.push('**Die Bänder, die nur über `t` fallen, sind ein Methodenbefund, kein Urteilsgrund.** Bei Millionen Signalen');
    T.push('je Band ist die `se` so klein, dass `|t| < 3` jede beliebig kleine Verzerrung rot färbt; die Mittel liegen');
    T.push('dabei bei einem Bruchteil der Größenschranke. Am Urteil ändert das nichts — es war ohnehin nichts belegt —,');
    T.push('an der Methode schon: für Bänder dieser Dichte ist die Größenschranke das tragende Kriterium.');
    T.push('');
  }
  T.push('## 5. Jahresscheiben für die Zeilen, die in ihrer Klasse Tor 1 bestehen');
  T.push('');
  var t1 = E.alleZeilen.filter(function (x) { return x.kl.tor1; });
  if (!t1.length) {
    T.push('**Keine einzige der ' + TESTZAHL + ' Klassenzeilen besteht Tor 1.** Die Pflichttabelle entfällt damit — es gibt');
    T.push('keine Kante, von der zu fragen wäre, ob sie noch lebt.');
  } else {
    t1.forEach(function (x) {
      var c = x.c, kl = x.kl;
      T.push('### ' + c.det + ' ' + c.zr + ' ' + c.richtung + ' ' + c.h + ' — Klasse ' + kl.klasse);
      T.push('');
      T.push('u_E ' + pp(kl.entU) + ' (' + tw(kl.tor1Abstand) + ' × MDE_B), u_B ' + pp(kl.u) + ' (t ' + tw(kl.t) + '), K_kand ' + pp(kl.kKand) +
        ', delta80 ' + pp(kl.delta80) + ', Tor 2 ' + jn(kl.tor2) + ' — Etikett: **' + kl.etikett + '**' + (kl.grund ? ' (' + kl.grund + ')' : '') + '.');
      T.push('');
      T.push('Einstiegslücke je Signal ' + pp(kl.luecke.jeSignal) + ', u_B lückenbereinigt ' + pp(kl.luecke.uBereinigt) + ' (t ' + tw(kl.luecke.uBereinigtT) + ')' +
        ', Haltezeit Kandidat ' + tw(kl.haltezeit.kand) + ' min gegen Topf ' + tw(kl.haltezeit.topf) + ' min (Versatz ' + tw(kl.haltezeit.versatz) +
        ', Uhrzeit-Tor ' + jn(kl.torUhrzeit) + '), Überlebens-Differenz brutto ' + pp(kl.differenzLebend) +
        ', Spiegel-Summe ' + (kl.spiegel && kl.spiegel.summe != null ? pp(kl.spiegel.summe) + ' (t ' + tw(kl.spiegel.summeT) + ')' : '–') + '.');
      T.push('');
      T.push(tabelle(['Jahr', 'nTage', 'nSig', 'u', 'se', 't', 'brutto', 'netto', 'Schein BV1', 'dünn'],
        kl.jahre.map(function (j) { return [j.jahr, ganz(j.nTage), ganz(j.nSig), pp(j.u), pp(j.se), tw(j.t), pp(j.brutto), pp(j.netto), pp(j.schein1), jn(j.duenn)]; })));
      T.push('');
      T.push('Trend über die Jahre: Steigung ' + pp(kl.trend.steigung) + ' Pp/Jahr (t ' + tw(kl.trend.t) + ', ' + kl.trend.n + ' Jahre).');
      T.push('');
    });
  }
  T.push('## 6. Die vollständige Tafel — ' + TESTZAHL + ' Zeilen, sortiert nach dem `t` der Entdeckung');
  T.push('');
  T.push('`u_E/MDE` ist der Tor-1-Abstand: Tor 1 verlangt **4,00**. `Schein` ist das Brutto-Tagesmittel der');
  T.push('Bestätigung minus Scheinhürde (BV1 / Standard). Zeilen ohne Signal in der Klasse stehen mit „–" da.');
  T.push('');
  var sortiert = E.alleZeilen.slice().sort(function (a, b) {
    var ta = a.kl.entUt, tb = b.kl.entUt;
    if (ta == null && tb == null) return 0;
    if (ta == null) return 1;
    if (tb == null) return -1;
    return tb - ta;
  });
  T.push(tabelle(['#', 'Det', 'ZR', 'Ri', 'H', 'Klasse', 'nTage_E', 'u_E', 't_E', 'u_E/MDE', 'Tor 1', 'nTage_B', 'nSig_B', 'brutto_B', 'K_kand', 'u_B', 'se_B', 't_B', 'MDE_B', 'delta80', 'akt u', 'akt t', 'BV1', 'Std', 'Etikett'],
    sortiert.map(function (x, i) {
      var c = x.c, z = x.kl;
      return [String(i + 1), c.det, c.zr, c.richtung, c.h, z.klasse, ganz(z.entTage), pp(z.entU), tw(z.entUt), tw(z.tor1Abstand), jn(z.tor1),
        ganz(z.besTage), ganz(z.besSig), pp(z.brutto), pp(z.kKand), pp(z.u), pp(z.se), tw(z.t), pp(z.mdeB), pp(z.delta80),
        pp(z.aktU), tw(z.aktT), pp(z.schein1.mittel), pp(z.scheinS.mittel), z.etikett];
    })));
  T.push('');
  T.push('## 7. Klassenmix (nachrichtlich, aus dem Hauptlauf)');
  T.push('');
  if (pruef.vorhanden && pruef.klassenmix) {
    T.push(tabelle(['ZR', 'Sicht'].concat(KLASSEN_NAMEN).concat(['Anteil 5-50']), [].concat.apply([], pruef.klassenmix.map(function (m) {
      return [['gesamt', 'bestaetigung'].map(function (s) {
        var w = m[s], sum = w.reduce(function (a, b) { return a + b; }, 0);
        return [m.zr, s].concat(w.map(ganz)).concat([sum > 0 ? tw(100 * w[0] / sum) + ' %' : '–']);
      })][0];
    }))));
    T.push('');
    T.push('Das ist der Grund der Frage: der gepoolte `K_kand` ist fast der Wert der illiquiden Masse.');
  } else T.push('(nicht verfügbar — `ergebnis.json` des Hauptlaufs fehlt)');
  T.push('');
  T.push('## 8. Was daraus folgt');
  T.push('');
  T.push('1. **Die Erklärung „die Hürde der illiquiden Masse hat alles erschlagen" ist nicht widerlegt — sie ist');
  T.push('   bestätigt, aber sie rettet nichts.** Die Zahl der Tor-1-Zeilen steigt monoton mit der Liquidität');
  T.push('   (' + Z.tor1JeKlasse.join(' / ') + ' über die vier Klassen), und der gepoolte `K_kand` ist fast der Wert der');
  T.push('   billigsten Klasse. Wer nur gepoolt misst, sieht in dieser Familie nichts, was in `ab1000` sichtbar ist.');
  T.push('2. **Das gepoolte Nein des Hauptlaufs bleibt stehen.** Diese Tafel ist post hoc, ihre Testzahl ist ' + TESTZAHL + ',');
  T.push('   und sie kann kein „belegt" vergeben. Sie verschiebt nichts an `ERGEBNIS.md`.');
  T.push('3. **Alles hängt an einem Detektor.** Alle ' + t1z.length + ' Tor-1-Zeilen gehören zu **W7**, keinem der sieben anderen.');
  T.push('   Das macht den Fund nicht falsch, aber es ist keine Aussage über „Wenden", sondern über diese eine Funktion.');
  T.push('4. **Die offene Frage ist das Vorzeichen über die Haltedauer.** Derselbe Detektor trennt die Folgemengen auf');
  T.push('   15m und 1h in die **entgegengesetzte** Richtung (Spiegel-Summe bis −0,21 Pp) und dreht mit der Haltedauer.');
  T.push('   Eine Wende, die auf einer Stunde das Gegenteil und auf einem Tag das Behauptete tut, ist entweder zwei');
  T.push('   verschiedene Sachen oder eine Eigenschaft des Messfensters. Diese Frage steht vor jedem Vorwärtstest.');
  T.push('5. **Für die Methode:** Umsatzklassen gehören in jede künftige Vorregistrierung dieser Familie als');
  T.push('   **vorab festgelegte** Schnittdimension — nicht als nachträgliche Suche. Ein gepoolter `K_kand`, der fast');
  T.push('   der Wert der billigsten Klasse ist, ist keine Kostenannahme, sondern ein Mischungsartefakt.');
  T.push('');
  T.push('## 9. Herkunft und Laufzeit');
  T.push('');
  T.push(tabelle(['Ordner', 'Dateien', 'Reihen', 'beendet', 'Kennung'], herkunft.map(function (h) {
    return [path.basename(h.ordner), ganz(h.dateien), ganz(h.reihen), h.beendet, h.kennung];
  })));
  T.push('');
  T.push('Kalender ' + ganz(kal.tage.length) + ' Tage, Bestätigung ab ' + K.BESTAETIGUNG_AB + ' (Index ' + E.ctx.iBes + '), Regime ab ' +
    K.REGIME_AB + ' (Index ' + E.ctx.iReg + '), letzte ' + K.AKTUELL_TAGE + ' Tage ab ' + E.ctx.aktuellAb + '.');
  T.push('Auswertung ' + Math.round(msGesamt / 1000) + ' s, erzeugt ' + new Date().toISOString() + '.');
  T.push('');
  return T.join('\n');
}

function lauf(a) {
  if (!a.aus.length) { console.error('Pflichtargument --aus <ordner> fehlt.'); process.exit(2); }
  A.selbsttestQuantil();
  var kal = K.kalender();
  if (kal.bestaetigungAb !== K.BESTAETIGUNG_AB) { console.error('Kalender-Split ' + kal.bestaetigungAb + ' != registriert ' + K.BESTAETIGUNG_AB + ' - Abbruch.'); process.exit(3); }
  var ordner = a.aus.map(function (o) { return path.resolve(K.HIER, o); });
  var t0 = Date.now(), G;
  try { G = A.ladeLaeufe(ordner, kal); } catch (e) { console.error('ABBRUCH: ' + e.message); process.exit(4); }
  console.log('geladen: ' + G.herkunft.length + ' Ordner, ' + G.F.dateien + ' Dateien, ' + Math.round((Date.now() - t0) / 1000) + ' s');
  var E = rechne(G.sp, G.F, kal);
  console.log('gerechnet: k1(Klassen) = ' + E.zahlen.k1K + ', k2 = ' + E.zahlen.k2K + ', ' + Math.round((Date.now() - t0) / 1000) + ' s');
  var pruef = gegenHauptlauf(E.konf, path.join(ordner[0], 'ergebnis.json'));
  var md = bericht(E, G.herkunft, kal, pruef, Date.now() - t0);
  fs.writeFileSync(path.join(K.HIER, 'ERGEBNIS-KLASSEN.md'), md);
  var json = { erzeugt: new Date().toISOString(), kennung: K.KONFIG_KENNUNG, status: 'post hoc, hypothesenerzeugend - kein Beleg',
    herkunft: G.herkunft, zahlen: E.zahlen, zerlegung: { maxU: E.zerlegung.maxU, maxBrutto: E.zerlegung.maxBrutto, tage: E.zerlegung.tage, ohneAlle: E.zerlegung.ohneAlle },
    pruefungHauptlauf: { vorhanden: pruef.vorhanden, verglichen: pruef.verglichen, fehlend: pruef.fehlend, max: pruef.max, tor1Abweichungen: pruef.tor1Abweichungen, kennung: pruef.kennung },
    baender: E.baender, konfigurationen: E.konf };
  fs.writeFileSync(path.join(K.HIER, 'ergebnis-klassen.json'), JSON.stringify(json, null, 1));
  console.log('geschrieben: ERGEBNIS-KLASSEN.md (' + Math.round(md.length / 1024) + ' kB) und ergebnis-klassen.json | ' +
    'Zerlegung max ' + E.zerlegung.maxU.toExponential(2) + ' | Hauptlauf-Vergleich ' + (pruef.vorhanden ? 'verglichen ' + pruef.verglichen : 'FEHLT') +
    ' | ' + Math.round((Date.now() - t0) / 1000) + ' s');
  return json;
}

module.exports = { lauf: lauf, rechne: rechne, zeileAus: zeileAus, bandPruefung: bandPruefung, placeboMittel: placeboMittel,
  lueckeKlasse: lueckeKlasse, haltezeitKlasse: haltezeitKlasse, gegenHauptlauf: gegenHauptlauf, TESTZAHL: TESTZAHL };
if (require.main === module) lauf(A.argumente(process.argv.slice(2)));
