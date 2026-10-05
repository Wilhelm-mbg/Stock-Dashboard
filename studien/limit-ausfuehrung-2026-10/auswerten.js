'use strict';
/* AUSWERTEN - Limit statt Marktorder (REGEL.md §7, Siegel 9cb14c7).
 *
 * Aufruf (von hier):
 *   node auswerten.js --aus <ordner> [--aus <ordner2> ...] [--abgleich <ordner> ...] [--abgleich-fortschritt <ordner>]
 *     --aus        Laeufe von lauf.js (Teile werden summiert; verschiedene Zeitrahmen-Saetze werden nebeneinander gefuehrt).
 *     --abgleich   Zellen der MINUTENSTUDIE (Ordner mit _zellen.bin/_fortschritt.json oder zellen-teil-k.bin), gegen die
 *                  die Zeilenart Signal-Markt bitgleich sein muss (REGEL §6.2). Relativ zum Ordner der Minutenstudie.
 *     --abgleich-fortschritt  Ort der fortschritt-teil-k.json, wenn die Minutenzellen getrennt gesichert liegen (E:).
 *
 * DER DATEINAME SAGT DIE HERKUNFT: ist ein Lauf pilot=true oder nicht vollstaendig, heisst die Ausgabe PILOT.md /
 * pilot.json und zeigt Renditen NUR AUS DER ENTDECKUNG (REGEL §8.2 - die Bestaetigungstage der Pilotreihen gehoeren
 * zum Holdout des Vollaufs). Sonst ERGEBNIS.md / ergebnis.json mit Toren, Bonferroni und Urteilen nach REGEL §7.
 * Ausgabe in den ersten --aus-Ordner, ausser --bericht <ordner> ist gesetzt.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var LA = require('./lauf.js');
var K = require(path.join(LA.MIN_ORDNER, 'konfig.js'));
var MA = require(path.join(LA.MIN_ORDNER, 'auswerten.js'));
var MM = require(path.join(LA.MIN_ORDNER, 'messen.js'));

var TOR1_FAKTOR = 4, MIN_BES_TAGE = MA.MIN_BES_TAGE, Z_POWER80 = MA.Z_POWER80;
var KOSTEN = [1, 0.5, 0.5, 1, 0.5, 0.5];                     // Anteil von K je Zeilenart: Markt K, Limit K/2 (REGEL §5)
var JEDE_KLASSE_ZU = K.KLASSEN[K.KLASSEN.length - 1].huerde / 2;   // 0,02245: mit Limit in jeder Klasse zu
var URTEILE = ['0 Signale', 'kein Kandidat', 'nicht entscheidbar', 'schlaegt Placebo, nicht nach Kosten', 'traegt'];

function argumente(argv) {
  var a = { aus: [], abgleich: [], abgleichFortschritt: null, bericht: null };
  for (var i = 0; i < argv.length; i++) {
    if (argv[i] === '--aus' && argv[i + 1]) a.aus.push(argv[++i]);
    else if (argv[i] === '--abgleich' && argv[i + 1]) a.abgleich.push(argv[++i]);
    else if (argv[i] === '--abgleich-fortschritt' && argv[i + 1]) a.abgleichFortschritt = argv[++i];
    else if (argv[i] === '--bericht' && argv[i + 1]) a.bericht = argv[++i];
    else if (argv[i] === '--hochrechnung') a.hochrechnung = true;
    else if (argv[i] === '--probe1m' && argv[i + 2]) a.probe1m = [argv[++i], argv[++i]];
  }
  return a;
}

/* ---------- Laden ---------- */
/** Liest die Laeufe, prueft Kennung/Kalender/Split, summiert je Zeitrahmen-Satz. Rueckgabe { gruppen:{satz:{zrSel,sp}}, F, herkunft }. */
function lade(ordner, kal) {
  var gruppen = {}, F = null, herkunft = [], erledigt = {}, doppelt = 0;
  ordner.forEach(function (o) {
    var fp = path.join(o, '_fortschritt.json'), zp = path.join(o, '_zellen.bin');
    if (!fs.existsSync(fp) || !fs.existsSync(zp)) throw new Error('In ' + o + ' fehlt _fortschritt.json oder _zellen.bin.');
    var f = JSON.parse(fs.readFileSync(fp, 'utf8')), zrSel = LA.zrAuswahl(f.zeitrahmen);
    if (f.kennung !== LA.kennung(zrSel)) throw new Error('Kennung in ' + o + ' ist "' + f.kennung + '", erwartet "' + LA.kennung(zrSel) + '" - Abbruch.');
    if (f.nTage !== kal.tage.length) throw new Error('nTage ' + f.nTage + ' in ' + o + ' passt nicht zum Kalender - Abbruch.');
    if (f.bestaetigungAb !== K.BESTAETIGUNG_AB) throw new Error('Split ' + f.bestaetigungAb + ' in ' + o + ' != ' + K.BESTAETIGUNG_AB + ' - Abbruch.');
    var sp = LA.Speicher.lade(zp, f.nTage, zrSel.length, f.zellenStand), satz = zrSel.join('+');
    if (!gruppen[satz]) gruppen[satz] = { zrSel: zrSel, sp: sp }; else gruppen[satz].sp.addiere(sp);
    Object.keys(f.erledigt || {}).forEach(function (k) { var kk = satz + ':' + k; if (erledigt[kk]) doppelt++; erledigt[kk] = 1; });
    herkunft.push({ ordner: o, dateien: f.dateien, pilot: !!f.pilot, beendet: f.beendet || 'offen', teil: f.teil || null, zeitrahmen: zrSel, reihenArg: f.reihenArg || null,
      begonnen: f.begonnen, stand: f.stand, ms: f.ms, msJeZr: f.zaehler && f.zaehler.msJeZr, ausgelassen: (f.ausgelassen || []).length });
    F = F ? MA.summiere(F, f) : f;
  });
  F.doppeltErledigt = doppelt;
  F.pilotIrgendwo = herkunft.some(function (h) { return h.pilot; });
  F.unvollstaendig = herkunft.some(function (h) { return h.beendet !== 'vollstaendig'; });
  F.zeitrahmenGedeckt = K.ZEITRAHMEN.map(function (z) { return z.key; }).filter(function (z) { return Object.keys(gruppen).some(function (s) { return gruppen[s].zrSel.indexOf(z) !== -1; }); });
  return { gruppen: gruppen, F: F, herkunft: herkunft };
}
function ort(gruppen, zrKey) {
  var aus = null;
  Object.keys(gruppen).forEach(function (s) { var zs = gruppen[s].zrSel.indexOf(zrKey); if (zs !== -1 && !aus) aus = { sp: gruppen[s].sp, zs: zs, nZs: gruppen[s].zrSel.length }; });
  return aus;
}

/* ---------- Tagesreihen ---------- */
/** Tagesreihe einer Zeilenart: je Tag mit n > 0 { t, n, s, nh (Summe n*K), roh, netto } mit netto = (s - Anteil*nh)/n. */
function tagesreihe(G, art, dI, zrKey, dirIdx, h, sicht) {
  var o = ort(G, zrKey), aus = [];
  if (!o) return aus;
  var sp = o.sp, nTage = sp.nTage, lVon = sicht === 'lebend' ? 1 : 0, anteil = KOSTEN[art];
  for (var t = 0; t < nTage; t++) {
    var n = 0, s = 0, nh = 0;
    for (var k = 0; k < K.N_K; k++) for (var l = lVon; l <= 1; l++) {
      var i = LA.zelle(nTage, o.nZs, art, dI, o.zs, dirIdx, h, t, k, l), nz = sp.n[i];
      if (!(nz > 0)) continue;
      n += nz; s += sp.s[i]; nh += nz * K.KLASSEN[k].huerde;
    }
    if (n > 0) aus.push({ t: t, n: n, s: s, nh: nh, roh: s / n, netto: (s - anteil * nh) / n });
  }
  return aus;
}
/** Tagweise gepaarte Differenz zweier Tagesreihen (Feld f): nur Tage, an denen beide Seiten Beobachtungen haben. */
function paare(a, b, f) {
  var jb = {}; b.forEach(function (z) { jb[z.t] = z; });
  var aus = [], nurA = 0;
  a.forEach(function (z) { var y = jb[z.t]; if (!y) { nurA++; return; } aus.push({ t: z.t, d: z[f] - y[f], nA: z.n, nB: y.n }); });
  aus.nurA = nurA; aus.nurB = b.length - aus.length;
  return aus;
}
function filterZeit(ctx, teil) {
  if (teil === 'ent') return function (z) { return z.t < ctx.iBes; };
  if (teil === 'bes') return function (z) { return z.t >= ctx.iBes && z.t >= ctx.iReg; };
  return function () { return true; };
}
/* ---------- Schaetzer (REGEL Nachtrag 1, Punkt 2) ----------
 * Endpunkt ist das HANDELSGEWICHTETE Mittel (Summe der Ertraege / Zahl der Handel) mit einem nach Handelstagen
 * geclusterten Standardfehler (Verhaeltnisschaetzer, Delta-Methode): u_t = (S_t - m N_t) / N, var = n/(n-1) Sum u_t^2.
 * Das Mittel der Tagesmittel ist verzerrt, sobald die Zahl der Handel eines Tages vom Kursweg NACH einem Handel abhaengt
 * (Gewicht 1/k_t): auf einem reinen Martingal -0,02 bis -0,29 Pp mit t bis -4,8 (test.js 8d) - es bleibt nachrichtlich
 * daneben ('tm'). Fuer eine Differenz A - B: u_t = (S_A,t - m_A N_A,t)/N_A - (S_B,t - m_B N_B,t)/N_B ueber die Vereinigung
 * der Tage. */
function cluster(a, b, feld) {
  function summen(z) { var N = 0, S = 0, je = {}; z.forEach(function (x) { var s = x[feld] * x.n; N += x.n; S += s; je[x.t] = [x.n, s]; }); return { N: N, S: S, je: je, m: N ? S / N : null }; }
  var A = summen(a), B = b ? summen(b) : null;
  var out = { n: a.length, nHandelA: A.N, nHandelB: B ? B.N : null, mittel: null, se: null, t: null, mde: null, obere: null, untere: null };
  if (!A.N || (B && !B.N)) return out;
  out.mittel = A.m - (B ? B.m : 0);
  var tage = {}; Object.keys(A.je).forEach(function (t) { tage[t] = 1; }); if (B) Object.keys(B.je).forEach(function (t) { tage[t] = 1; });
  var nT = Object.keys(tage).length, v = 0;
  Object.keys(tage).forEach(function (t) {
    var x = A.je[t] || [0, 0], u = (x[1] - A.m * x[0]) / A.N;
    if (B) { var y = B.je[t] || [0, 0]; u -= (y[1] - B.m * y[0]) / B.N; }
    v += u * u;
  });
  if (nT < 2) return out;
  v *= nT / (nT - 1);
  out.se = Math.sqrt(v); out.mde = 2 * out.se; out.obere = out.mittel + 1.96 * out.se; out.untere = out.mittel - 1.96 * out.se;
  out.t = out.se > 0 ? out.mittel / out.se : null;
  return out;
}
/** Summen einer Tagesreihe in einem Zeitteil: Handel, Tage, je Handel brutto/netto (geclustert) und nachrichtlich die Tagesmittel. */
function zusammen(reihe, ctx, teil) {
  var z = reihe.filter(filterZeit(ctx, teil)), N = 0, S = 0, NH = 0;
  z.forEach(function (x) { N += x.n; S += x.s; NH += x.nh; });
  return { nTage: z.length, nHandel: N, bruttoJeHandel: N ? S / N : null, kJeHandel: N ? NH / N : null,
    netto: cluster(z, null, 'netto'), brutto: cluster(z, null, 'roh'),
    tm: { netto: MA.momente(z.map(function (x) { return x.netto; })), brutto: MA.momente(z.map(function (x) { return x.roh; })) } };
}
/** Differenz A - B in einem Zeitteil: geclustert (Endpunkt) und nachrichtlich als Mittel der tagweise gepaarten Tagesmittel. */
function differenz(a, b, ctx, teil, feld) {
  var f = filterZeit(ctx, teil), za = a.filter(f), zb = b.filter(f);
  var m = cluster(za, zb, feld), p = paare(za, zb, feld);
  m.n = za.length;                                                  // Signaltage = Tage mit Handel der Seite A
  m.tm = MA.momente(p.map(function (x) { return x.d; })); m.tageNurA = p.nurA; m.tageNurB = p.nurB;
  return m;
}

/* ---------- Eine Konfiguration ---------- */
function konfiguration(G, ctx, dI, zrKey, dirIdx, h, teile, sicht) {
  var r = {};
  LA.ARTEN.forEach(function (name, art) { r[name] = tagesreihe(G, art, dI, zrKey, dirIdx, h, sicht); });
  var c = { arten: {}, D: {}, Dgross: {}, gegenauslese: {}, limitGegenMarkt: {} };
  teile.forEach(function (teil) {
    c.arten[teil] = {}; LA.ARTEN.forEach(function (name) { c.arten[teil][name] = zusammen(r[name], ctx, teil); });
    c.D[teil] = differenz(r.sigStreng, r.plaStreng, ctx, teil, 'netto');
    c.Dgross[teil] = differenz(r.sigGross, r.plaGross, ctx, teil, 'netto');
    c.gegenauslese[teil] = differenz(r.plaStreng, r.plaMarkt, ctx, teil, 'roh');
    c.limitGegenMarkt[teil] = differenz(r.sigStreng, r.sigMarkt, ctx, teil, 'netto');
  });
  return c;
}

/* ---------- Urteil (REGEL §7) ---------- */
function urteile(konf) {
  konf.forEach(function (c) {
    var De = c.D.ent, Db = c.D.bes, sb = c.arten.bes.sigStreng;
    c.mdeB = Db.mde; c.seB = Db.se;
    c.kKand = sb.kJeHandel;                                         // signalgewichtete Klassenhuerde, streng gefuellt, Bestaetigung
    c.tor1 = De.mittel != null && c.mdeB != null && De.mittel > 0 && De.mittel >= TOR1_FAKTOR * c.mdeB;
  });
  var k1 = konf.filter(function (c) { return c.tor1; }).length, z1 = MA.zBonf(Math.max(k1, 1));
  konf.forEach(function (c) {
    c.delta80 = c.seB != null ? (z1 + Z_POWER80) * c.seB : null;
    c.tor2 = c.tor1 && c.delta80 != null && c.kKand != null && c.delta80 < c.kKand / 2;
  });
  var k2 = konf.filter(function (c) { return c.tor2; }).length, z2 = MA.zBonf(Math.max(k2, 1));
  konf.forEach(function (c) {
    var Db = c.D.bes, De = c.D.ent, nb = c.arten.bes.sigStreng.netto, bb = c.arten.bes.sigStreng.brutto;
    c.groesse = 'ohne (< 30 Bes-Tage)';
    if (c.arten.bes.sigStreng.nTage >= MIN_BES_TAGE && bb.obere != null && c.kKand != null) {
      c.groesse = bb.obere < JEDE_KLASSE_ZU ? 'mit Limit in jeder Klasse zu' : (bb.obere < c.kKand / 2 ? 'mit Limit in seiner Klasse zu' : 'offen');
    }
    c.handelbar = false;
    var signale = c.arten.ent.sigMarkt.nHandel + c.arten.bes.sigMarkt.nHandel;
    if (!signale) { c.urteil = '0 Signale'; return; }
    if (c.mdeB == null || De.n === 0) { c.urteil = 'nicht entscheidbar'; c.grund = 'Tor 1 nicht pruefbar (se_B oder Entdeckung fehlt)'; return; }
    if (!c.tor1) { c.urteil = 'kein Kandidat'; return; }
    if (!c.tor2) { c.urteil = 'nicht entscheidbar'; c.grund = 'Tor 2: delta80 >= K_Kand/2'; return; }
    if (Db.n < MIN_BES_TAGE) { c.urteil = 'nicht entscheidbar'; c.grund = 'Bestaetigung < 30 Signaltage'; return; }
    var schlaegt = Db.mittel > 0 && Db.t != null && Db.t >= z2 && Math.sign(Db.mittel) === Math.sign(De.mittel);
    if (!schlaegt) { c.urteil = 'nicht entscheidbar'; c.grund = 'D_B nicht > 0 mit t >= z_Bonf(k2)'; return; }
    var nachKosten = nb.mittel != null && nb.mittel > 0 && nb.t != null && nb.t >= z2;
    if (!nachKosten) { c.urteil = 'schlaegt Placebo, nicht nach Kosten'; return; }
    c.urteil = 'traegt';
    c.handelbar = c.richtung === 'long' && c.delta80 <= c.kKand / 2;
    c.handelbarGrund = c.richtung === 'short' ? 'nein (Leihe)' : (c.handelbar ? 'ja' : 'nein (delta80 > K_Kand/2)');
  });
  var zahlen = { konfigurationen: konf.length, k1: k1, k2: k2, zBonfK1: z1, zBonfK2: z2, urteile: {}, groesse: {} };
  URTEILE.forEach(function (u) { zahlen.urteile[u] = konf.filter(function (c) { return c.urteil === u; }).length; });
  konf.forEach(function (c) { zahlen.groesse[c.groesse] = (zahlen.groesse[c.groesse] || 0) + 1; });
  zahlen.handelbar = konf.filter(function (c) { return c.handelbar; }).length;
  return zahlen;
}

/* ---------- Gepoolte Uebersicht je (Zeitrahmen, Haltedauer) ueber Detektoren und Richtungen ---------- */
function uebersicht(konf, teil) {
  var aus = [];
  K.ZEITRAHMEN.forEach(function (zr) {
    K.HALTEDAUERN.forEach(function (H) {
      var cs = konf.filter(function (c) { return c.zr === zr.key && c.h === H.key; });
      if (!cs.length) return;
      var sum = {}; LA.ARTEN.forEach(function (a) { sum[a] = { n: 0, s: 0, nh: 0 }; });
      cs.forEach(function (c) { LA.ARTEN.forEach(function (a) { var z = c.arten[teil][a]; if (!z.nHandel) return; sum[a].n += z.nHandel; sum[a].s += z.bruttoJeHandel * z.nHandel; sum[a].nh += z.kJeHandel * z.nHandel; }); });
      var je = function (a) { return sum[a].n ? sum[a].s / sum[a].n : null; };
      var netto = function (a, anteil) { return sum[a].n ? (sum[a].s - anteil * sum[a].nh) / sum[a].n : null; };
      aus.push({ zr: zr.key, h: H.key, signale: sum.sigMarkt.n, fuellStreng: sum.sigMarkt.n ? sum.sigStreng.n / sum.sigMarkt.n : null, fuellGross: sum.sigMarkt.n ? sum.sigGross.n / sum.sigMarkt.n : null,
        placeboFuellStreng: sum.plaMarkt.n ? sum.plaStreng.n / sum.plaMarkt.n : null,
        bruttoMarkt: je('sigMarkt'), bruttoStreng: je('sigStreng'), bruttoGross: je('sigGross'), placeboMarkt: je('plaMarkt'), placeboStreng: je('plaStreng'), placeboGross: je('plaGross'),
        gegenauslese: (je('plaStreng') != null && je('plaMarkt') != null) ? je('plaStreng') - je('plaMarkt') : null,
        nettoStreng: netto('sigStreng', 0.5), nettoGross: netto('sigGross', 0.5), nettoMarkt: netto('sigMarkt', 1),
        signalMinusPlaceboStreng: (je('sigStreng') != null && je('plaStreng') != null) ? je('sigStreng') - je('plaStreng') : null });
    });
  });
  return aus;
}

/* ---------- Kontrolle 2: Signal-Markt gegen die Kandidatenzellen der Minutenstudie, bitgleich ---------- */
function abgleich(G, minOrdner, fortschrittOrdner, kal) {
  var liste = minOrdner.map(function (o) { return path.isAbsolute(o) ? o : path.join(LA.MIN_ORDNER, o); });
  var mz = MA.ladeLaeufe(liste, kal, fortschrittOrdner || null).sp, nT = kal.tage.length;
  var aus = { ordner: liste, zellenVerglichen: 0, zellenMitDaten: 0, abweichungen: 0, beispiele: [], nurMinute: 0, nurLimit: 0, jeZr: {} };
  Object.keys(G).forEach(function (satz) {
    var g = G[satz];
    g.zrSel.forEach(function (zrKey, zs) {
      var zi = K.ZEITRAHMEN.map(function (z) { return z.key; }).indexOf(zrKey), jz = aus.jeZr[zrKey] = { mitDaten: 0, abweichungen: 0, nSumme: 0 };
      for (var dI = 0; dI < K.N_DET; dI++) for (var dir = 0; dir < 2; dir++) for (var h = 0; h < K.N_H; h++) for (var t = 0; t < nT; t++) for (var k = 0; k < K.N_K; k++) for (var l = 0; l < 2; l++) {
        var a = LA.zelle(nT, g.zrSel.length, LA.A.sigMarkt, dI, zs, dir, h, t, k, l), b = K.zelle(nT, K.reiheIndex(K.kandIndex(dI, zi), 0), dir, h, t, k, l);
        aus.zellenVerglichen++;
        var na = g.sp.n[a], nb = mz.n[b];
        if (!na && !nb) continue;
        aus.zellenMitDaten++; jz.mitDaten++; jz.nSumme += na;
        if (na === nb && g.sp.s[a] === mz.s[b] && g.sp.s2[a] === mz.s2[b]) continue;
        aus.abweichungen++; jz.abweichungen++;
        if (!na) aus.nurMinute++; else if (!nb) aus.nurLimit++;
        if (aus.beispiele.length < 20) aus.beispiele.push({ det: K.DETEKTOR_KEYS[dI], zr: zrKey, dir: dir, h: K.HALTEDAUERN[h].key, tag: kal.tage[t], klasse: K.KLASSEN[k].name, lebend: l, limit: [na, g.sp.s[a], g.sp.s2[a]], minute: [nb, mz.s[b], mz.s2[b]] });
      }
    });
  });
  aus.bitgleich = aus.abweichungen === 0 && aus.zellenMitDaten > 0;
  return aus;
}

/* ---------- Jahresscheiben von D (streng), nachrichtlich ---------- */
function jahresscheiben(G, ctx, konf, kal) {
  var jahre = {}, letzte250 = kal.tage.length - 250;
  konf.forEach(function (c) {
    var p = paare(tagesreihe(G, LA.A.sigStreng, c.dI, c.zr, c.dirIdx, c.hi, 'alle'), tagesreihe(G, LA.A.plaStreng, c.dI, c.zr, c.dirIdx, c.hi, 'alle'), 'netto');
    var je = {};
    p.forEach(function (x) { var j = kal.tage[x.t].slice(0, 4); (je[j] = je[j] || []).push(x.d); if (x.t >= letzte250) (je.letzte250 = je.letzte250 || []).push(x.d); });
    Object.keys(je).forEach(function (j) { var m = MA.momente(je[j]); (jahre[j] = jahre[j] || { positiv: 0, konf: 0, summe: 0 }); jahre[j].konf++; jahre[j].summe += m.mittel; if (m.mittel > 0) jahre[j].positiv++; });
  });
  return Object.keys(jahre).sort().map(function (j) { return { jahr: j, konf: jahre[j].konf, mittelD: jahre[j].summe / jahre[j].konf, anteilPositiv: jahre[j].positiv / jahre[j].konf }; });
}

/* ---------- Die ganze Auswertung ---------- */
function auswerte(G, F, kal, pilot) {
  var ctx = { iBes: kal.idx[K.BESTAETIGUNG_AB], iReg: kal.tage.findIndex(function (t) { return t >= K.REGIME_AB; }) };
  var teile = pilot ? ['ent'] : ['ent', 'bes'];
  var konf = [];
  F.zeitrahmenGedeckt.forEach(function (zrKey) {
    var zi = K.ZEITRAHMEN.map(function (z) { return z.key; }).indexOf(zrKey);
    for (var dI = 0; dI < K.N_DET; dI++) for (var dirIdx = 0; dirIdx < 2; dirIdx++) for (var h = 0; h < K.N_H; h++) {
      var c = konfiguration(G, ctx, dI, zrKey, dirIdx, h, teile, 'alle');
      c.det = K.DETEKTOR_KEYS[dI]; c.zr = zrKey; c.zi = zi; c.richtung = K.RICHTUNGEN[dirIdx].key; c.h = K.HALTEDAUERN[h].key; c.dI = dI; c.dirIdx = dirIdx; c.hi = h;
      if (!pilot) { var lb = konfiguration(G, ctx, dI, zrKey, dirIdx, h, ['bes'], 'lebend'); c.lebendDB = lb.D.bes.mittel; }
      konf.push(c);
    }
  });
  var aus = { ctx: ctx, pilot: pilot, konf: konf, uebersichtEnt: uebersicht(konf, 'ent') };
  if (!pilot) { aus.uebersichtBes = uebersicht(konf, 'bes'); aus.zahlen = urteile(konf); aus.jahre = jahresscheiben(G, ctx, konf, kal); }
  /* Bestaetigungstage im Pilot nur zaehlen (REGEL §8.2) */
  if (pilot) {
    aus.besGezaehlt = {};
    konf.forEach(function (c) {
      var k = c.zr; var z = aus.besGezaehlt[k] || (aus.besGezaehlt[k] = { signale: 0 });
      if (c.hi === K.N_H - 1) z.signale += tagesreihe(G, LA.A.sigMarkt, c.dI, c.zr, c.dirIdx, c.hi, 'alle').filter(filterZeit(ctx, 'bes')).reduce(function (a, x) { return a + x.n; }, 0);
    });
  }
  return aus;
}

/* ---------- Bericht ---------- */
function f4(x) { return x == null || x !== x ? '–' : (+x).toFixed(4).replace('.', ','); }
function f2(x) { return x == null || x !== x ? '–' : (+x).toFixed(2).replace('.', ','); }
function pz(x) { return x == null || x !== x ? '–' : (100 * x).toFixed(1).replace('.', ',') + ' %'; }
function ganz(x) { return x == null ? '–' : Math.round(x).toLocaleString('de-DE'); }
function uebersichtTabelle(ue) {
  var z = ['| ZR | H | Signale | Füllquote streng / großz. | Placebo-Füllquote streng | Brutto Markt | Brutto Limit streng | Placebo Markt | Placebo streng | Gegenauslese (Pl. streng − Pl. Markt) | Signal − Placebo (streng, brutto) | Netto Limit streng (−K/2) | Netto Markt (−K) |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  ue.forEach(function (u) {
    z.push('| ' + u.zr + ' | ' + u.h + ' | ' + ganz(u.signale) + ' | ' + pz(u.fuellStreng) + ' / ' + pz(u.fuellGross) + ' | ' + pz(u.placeboFuellStreng) + ' | ' + f4(u.bruttoMarkt) + ' | ' + f4(u.bruttoStreng) + ' | ' + f4(u.placeboMarkt) + ' | ' + f4(u.placeboStreng) + ' | ' + f4(u.gegenauslese) + ' | ' + f4(u.signalMinusPlaceboStreng) + ' | ' + f4(u.nettoStreng) + ' | ' + f4(u.nettoMarkt) + ' |');
  });
  return z.join('\n');
}
function fuellTabelle(F) {
  var z = ['| Zeitrahmen | Signale | mit Einstieg | gefüllt streng | gefüllt großz. | Placebo-Ziehungen | Placebo streng | Placebo großz. |', '|---|---|---|---|---|---|---|---|'];
  K.ZEITRAHMEN.forEach(function (zr) {
    var s = [0, 0, 0, 0], p = [0, 0, 0, 0];
    Object.keys(F.zaehler.fuellSignal || {}).forEach(function (k) { if (k.split('|')[1] === zr.key) for (var q = 0; q < 4; q++) s[q] += F.zaehler.fuellSignal[k][q]; });
    Object.keys(F.zaehler.fuellPlacebo || {}).forEach(function (k) { if (k.split('|')[1] === zr.key) for (var q = 0; q < 4; q++) p[q] += F.zaehler.fuellPlacebo[k][q]; });
    if (!s[0]) return;
    z.push('| ' + zr.key + ' | ' + ganz(s[0]) + ' | ' + ganz(s[1]) + ' | ' + ganz(s[2]) + ' (' + pz(s[2] / s[1]) + ') | ' + ganz(s[3]) + ' (' + pz(s[3] / s[1]) + ') | ' + ganz(p[1]) + ' | ' + ganz(p[2]) + ' (' + pz(p[2] / p[1]) + ') | ' + ganz(p[3]) + ' (' + pz(p[3] / p[1]) + ') |');
  });
  return z.join('\n');
}
function konfTabelle(konf, teil) {
  var z = ['| Detektor | ZR | Richtung | H | Signale | Füllq. streng | D streng (je Handel, Tage geclustert) | t | Tage | D als Tagesmittel (nachr.) | Netto Limit streng | Netto Markt | Gegenauslese | D großz. |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|'];
  konf.forEach(function (c) {
    var a = c.arten[teil], n = a.sigMarkt.nHandel;
    if (!n) return;
    z.push('| ' + c.det + ' | ' + c.zr + ' | ' + c.richtung + ' | ' + c.h + ' | ' + ganz(n) + ' | ' + pz(a.sigStreng.nHandel / n) + ' | ' + f4(c.D[teil].mittel) + ' | ' + f2(c.D[teil].t) + ' | ' + ganz(c.D[teil].n) + ' | ' + f4(c.D[teil].tm.mittel) + ' | ' + f4(a.sigStreng.netto.mittel) + ' | ' + f4(a.sigMarkt.netto.mittel) + ' | ' + f4(c.gegenauslese[teil].mittel) + ' | ' + f4(c.Dgross[teil].mittel) + ' |');
  });
  return z.join('\n');
}
function markdown(E, F, herkunft, abg, laufzeit) {
  var L = [];
  if (E.pilot) {
    L.push('# PILOT — Limit statt Marktorder (kein Befund)', '');
    L.push('**Das ist ein Probelauf, kein Ergebnis.** ' + (F.reihenArg ? F.reihenArg.length + ' Pilotreihen' : 'Teillauf') + ', Zeitrahmen ' + F.zeitrahmenGedeckt.join(' / ') + '. Renditen stehen hier **nur aus der Entdeckung** (Tage vor ' + K.BESTAETIGUNG_AB + '); die Bestätigungstage gehören zum Holdout des Vollaufs (REGEL §8.2) und werden nur gezählt. Regel: `REGEL.md`, Siegel `9cb14c7`. Alles Simulation, keine Anlageberatung.', '');
  } else {
    L.push('# ERGEBNIS — Limit statt Marktorder', '');
    L.push('Regel `REGEL.md`, Siegel `9cb14c7`. Alles Simulation, keine Anlageberatung.', '');
    L.push('## Urteil', '');
    L.push('k₁ = ' + E.zahlen.k1 + ', k₂ = ' + E.zahlen.k2 + ', z_Bonf(k₂) = ' + f2(E.zahlen.zBonfK2) + '. Urteile: ' + JSON.stringify(E.zahlen.urteile) + '. Handelbar: ' + E.zahlen.handelbar + '. Größe: ' + JSON.stringify(E.zahlen.groesse) + '.', '');
  }
  L.push('## Läufe', '');
  herkunft.forEach(function (h) { L.push('- `' + path.basename(h.ordner) + '`: ' + h.dateien + ' Dateien, ' + h.beendet + ', Teil ' + (h.teil ? h.teil.k + '/' + h.teil.n : '–') + ', Zeitrahmen ' + h.zeitrahmen.join('+') + ', Rechenzeit ' + Math.round((h.ms ? h.ms.rechnen : 0) / 1000) + ' s, ausgelassen ' + h.ausgelassen); });
  L.push('- Doppelt erledigte Dateien: ' + F.doppeltErledigt + '; Detektorfehler ' + JSON.stringify(F.zaehler.fehler) + '; Ausstieg vor Füllung ' + F.zaehler.ausstiegVorFuellung + ' (Soll 0); Kerzen ohne Tief/Hoch im Füllfenster ' + F.zaehler.ohneHochTief + '; Lückenfüllungen streng: Signal ' + F.zaehler.lueckeStreng.signal + ', Placebo ' + F.zaehler.lueckeStreng.placebo + '; Placebo-Ziehungen ' + F.zaehler.placeboGezogen + ' (weniger Kerzen als Signale: ' + F.zaehler.placeboWenigerKerzen + ').', '');
  if (laufzeit) { L.push('## Laufzeit und Hochrechnung', ''); laufzeit.forEach(function (z) { L.push(z); }); L.push(''); }
  L.push('## Kontrolle 2 — Signal-Markt gegen die Minutenstudie', '');
  if (abg) {
    L.push('Verglichen mit ' + abg.ordner.map(function (o) { return '`' + path.basename(o) + '`'; }).join(', ') + ': ' + ganz(abg.zellenMitDaten) + ' Zellen mit Daten, **' + ganz(abg.abweichungen) + ' Abweichungen** (nur Minute ' + abg.nurMinute + ', nur Limit ' + abg.nurLimit + ') — ' + (abg.bitgleich ? '**bitgleich (n, Σr, Σr²)**.' : '**NICHT bitgleich**, Beispiele in der JSON-Datei.'));
    Object.keys(abg.jeZr).forEach(function (z) { L.push('- ' + z + ': ' + ganz(abg.jeZr[z].mitDaten) + ' Zellen, ' + ganz(abg.jeZr[z].nSumme) + ' Beobachtungen, ' + abg.jeZr[z].abweichungen + ' Abweichungen'); });
  } else L.push('(kein Abgleich verlangt)');
  L.push('', '## Füllquoten (Zählung über alle Tage, keine Rendite)', '', fuellTabelle(F), '');
  if (E.pilot && E.besGezaehlt) L.push('Bestätigungstage im Pilot nur gezählt: ' + Object.keys(E.besGezaehlt).map(function (z) { return z + ' ' + ganz(E.besGezaehlt[z].signale) + ' Signale'; }).join(', ') + '.', '');
  L.push('## Übersicht je Zeitrahmen und Haltedauer — Entdeckung (je Handel, Pp, über Detektoren und Richtungen gepoolt)', '', uebersichtTabelle(E.uebersichtEnt), '');
  L.push('Lesart: *Gegenauslese* = was die Limit-Mechanik an Zufallszeitpunkten gegenüber der Marktorder kostet oder bringt (Placebo streng − Placebo Markt, brutto). *Signal − Placebo* ist die Größe, über die geurteilt wird (dort tagweise gepaart, netto).', '');
  if (!E.pilot) L.push('## Übersicht — Bestätigung ab ' + K.BESTAETIGUNG_AB, '', uebersichtTabelle(E.uebersichtBes), '');
  L.push('## Je Konfiguration — Entdeckung', '', konfTabelle(E.konf, 'ent'), '');
  if (!E.pilot) {
    L.push('## Je Konfiguration — Bestätigung und Urteil', '');
    L.push('| Detektor | ZR | Richtung | H | D_E | MDE_B | D_B | t_B | Tage_B | delta80 | K_Kand/2 | Netto_B streng | t | Urteil | Größe | handelbar |', '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
    E.konf.forEach(function (c) {
      if (c.urteil === '0 Signale') return;
      L.push('| ' + c.det + ' | ' + c.zr + ' | ' + c.richtung + ' | ' + c.h + ' | ' + f4(c.D.ent.mittel) + ' | ' + f4(c.mdeB) + ' | ' + f4(c.D.bes.mittel) + ' | ' + f2(c.D.bes.t) + ' | ' + ganz(c.D.bes.n) + ' | ' + f4(c.delta80) + ' | ' + f4(c.kKand != null ? c.kKand / 2 : null) + ' | ' + f4(c.arten.bes.sigStreng.netto.mittel) + ' | ' + f2(c.arten.bes.sigStreng.netto.t) + ' | ' + c.urteil + ' | ' + c.groesse + ' | ' + (c.handelbarGrund || 'nein') + ' |');
    });
    L.push('', '## Jahresscheiben von D (streng), nachrichtlich', '', '| Jahr | Konfigurationen | mittleres D | Anteil D > 0 |', '|---|---|---|---|');
    E.jahre.forEach(function (j) { L.push('| ' + j.jahr + ' | ' + j.konf + ' | ' + f4(j.mittelD) + ' | ' + pz(j.anteilPositiv) + ' |'); });
  }
  L.push('', '*Erzeugt von `auswerten.js` am ' + new Date().toISOString() + '.*');
  return L.join('\n') + '\n';
}

/** Hochrechnung (hochrechnung.js) als Berichtszeilen. */
function hochrechnungZeilen(h) {
  var z = [];
  z.push('| Zeitrahmen | Rechenzeit Limit-Pilot | Rechenzeit Minuten-Pilot | Faktor |', '|---|---|---|---|');
  Object.keys(h.je).forEach(function (k) { z.push('| ' + k + ' | ' + Math.round(h.je[k].limitPilotS) + ' s | ' + Math.round(h.je[k].minutePilotS) + ' s | ' + f2(h.je[k].faktor) + ' |'); });
  if (h.probe1m) z.push('| 1m (Probe, ' + h.probe1m.dateien + ' Datei) | ' + Math.round(h.probe1m.limitS) + ' s | ' + Math.round(h.probe1m.minuteS) + ' s | ' + f2(h.probe1m.faktor) + ' |');
  z.push('', 'Minuten-Vollauf (acht Teile nebeneinander): laengster Teil 5m/15m ' + f2(h.minuteVoll.wand5m15mH) + ' h, 1m ' + f2(h.minuteVoll.wand1mH) + ' h. **Hochgerechnet fuer diese Studie: 5m/15m ' + f2(h.limitVoll.wand5m15mH) + ' h, 1m ' + f2(h.limitVoll.wand1mH) + ' h, zusammen ' + f2(h.limitVoll.summeH) + ' h** (acht Prozesse, ohne Unterbrechungen).' + (h.ueber6h ? ' Ueber 6 Stunden: nach dem Pilot aufgehoert (REGEL §8.3).' : ''));
  return z;
}
function lauf(a, laufzeit) {
  MA.selbsttestQuantil();
  if (!laufzeit && a.hochrechnung) laufzeit = hochrechnungZeilen(require('./hochrechnung.js').rechne({ pilot: a.aus, probe1m: a.probe1m || null }));
  var kal = K.kalender();
  var liste = a.aus.map(function (o) { return path.isAbsolute(o) ? o : path.join(__dirname, o); });
  var geladen = lade(liste, kal), F = geladen.F, pilot = F.pilotIrgendwo || F.unvollstaendig;
  var E = auswerte(geladen.gruppen, F, kal, pilot);
  var abg = a.abgleich.length ? abgleich(geladen.gruppen, a.abgleich, a.abgleichFortschritt, kal) : null;
  var ziel = a.bericht ? (path.isAbsolute(a.bericht) ? a.bericht : path.join(__dirname, a.bericht)) : liste[0];
  fs.mkdirSync(ziel, { recursive: true });
  var md = markdown(E, F, geladen.herkunft, abg, laufzeit);
  var name = pilot ? 'PILOT' : 'ERGEBNIS';
  fs.writeFileSync(path.join(ziel, name + '.md'), md);
  var json = { regel: 'REGEL.md', siegel: '9cb14c7', pilot: pilot, herkunft: geladen.herkunft, zaehler: F.zaehler, zeitrahmen: F.zeitrahmenGedeckt, abgleich: abg, uebersichtEnt: E.uebersichtEnt,
    uebersichtBes: E.uebersichtBes || null, zahlen: E.zahlen || null, jahre: E.jahre || null, besGezaehlt: E.besGezaehlt || null,
    konf: E.konf.map(function (c) { var o = Object.assign({}, c); return o; }) };
  fs.writeFileSync(path.join(ziel, pilot ? 'pilot.json' : 'ergebnis.json'), JSON.stringify(json, null, 1));
  console.log((pilot ? 'PILOT' : 'ERGEBNIS') + ' geschrieben: ' + path.join(ziel, name + '.md') + (abg ? ' | Abgleich: ' + abg.abweichungen + ' Abweichungen bei ' + abg.zellenMitDaten + ' Zellen' : ''));
  return { E: E, F: F, abg: abg, ziel: ziel, pilot: pilot };
}

module.exports = { argumente: argumente, lade: lade, tagesreihe: tagesreihe, paare: paare, cluster: cluster, differenz: differenz, zusammen: zusammen, konfiguration: konfiguration, urteile: urteile, uebersicht: uebersicht,
  abgleich: abgleich, auswerte: auswerte, markdown: markdown, lauf: lauf, KOSTEN: KOSTEN, URTEILE: URTEILE, JEDE_KLASSE_ZU: JEDE_KLASSE_ZU, MM: MM };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
