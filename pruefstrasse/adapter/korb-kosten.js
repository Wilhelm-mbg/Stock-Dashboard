'use strict';
/* Korb-Form, Nr. 121-2b (A.4, B.3): Kostenregel je Handel und Massstab Nasdaq-100 nach Steuer als PARAMETER des Korb-Adapters, Vorgabe = heutiges
 * Verhalten (20 Bp je Seite, SPY) - die gesiegelten Laeufe A-187/B-187 (Nr. 96) rechnen mit der Vorgabe unveraendert.
 * HERKUNFT (kopiert, nicht neu erfunden; die Studien bleiben unveraendert):
 *   kontext, fuehreAusK, fuehreHuelleK  <- studien/momentum-wiedervorlage-2026-10-23/rechnen.js (Nr. 122: Kopie von mfhandel.js fuehreAus und kleinst.js
 *                                          fuehreHuelle mit k je Handel; dort mit 20 Bp bitgleich auf das Siegel geprueft)
 *   nachSteuer                          <- studien/momentum-wiedervorlage-2026-10-23/massstab.js Teil 2 (Steuerrechner Nr. 82 steuer.js, nur geladen;
 *                                          Buch mit dem EFFEKTIVEN Satz je Seite, Nasdaq-ETF = QQQ-Kurs, Modell Nr. 82 unveraendert)
 * Die Kosten je Handel kommen aus pruefstrasse/kosten.js (Klasse 1-5: Klasse 5 = Median-Umsatz der 20 Zeilen >= KLASSE5_UMSATZ).
 * Simulation mit virtuellem Kapital, keine Anlage- und keine Steuerberatung. */
var path = require('path');
var K = require('../konfig.js');
var KO = require('../kosten.js');

var VORGABE = { kostenBpJeSeite: null, massstab: 'SPY' };
var MASSSTAEBE = ['SPY', 'nasdaq100-steuer'];
var STEUER = path.join(K.REPO, 'studien', 'nach-steuern-2026-10-04', 'steuer.js');
var TER_QQQ = 0.0020, ETF = { name: 'Xtrackers Nasdaq 100 UCITS ETF 1C', isin: 'IE00BMFKG444', ter: 0.0020 };   /* Nr. 122 massstab.js / quellen.md (Vorschlag, Entscheid Wilhelm) */

/** Kostenanteil einer Seite (Bruch des Handelswerts): halbe Spanne der Kostenklasse + IBKR-Gebuehr der Seite / Wert (echter Handelswert, roher Kurs). */
function anteilSeite(klasse, lage, seite, wertUsd, kursRoh, modell) {
  var k = KO.klasseObj(klasse), sp = (lage === 'kassa' ? k.kassa : k.eroeffnung) / 100 / 2;
  if (!(wertUsd > 0) || !(kursRoh > 0)) return sp;
  return sp + KO.ibkrGebuehr(modell || K.KOSTEN.modell, seite, wertUsd / kursRoh, kursRoh) / wertUsd;
}
/** Panel-Klasse 0..3 aus dem Median-Dollarumsatz (wie Nr. 122 kosten.js klasseVon; unter 5 Mio $ die Klasse 5-50), dann Klasse 5 zur Laufzeit. */
function klasseVonUmsatz(med) {
  var k = 0; for (var i = 3; i >= 0; i--) if (med >= KO.KLASSEN[i].von) { k = i; break; }
  return KO.klasseZurLaufzeit(k, med);
}

/** Kontext je Lauf (Kopie Nr. 122 rechnen.js kontext): Tag aus nowMs, Umsatzklasse (Median g.umsatz der 20 Zeilen bis d-1), roher Kurs. */
function kontext(V, R) {
  var T = V.T, Q = V.Q, g = T.g, tagVonMs = new Map(), klCache = new Map();
  for (var t = 0; t < T.nTage; t++) tagVonMs.set(Q.ms[t], t);
  function klasse(sym, d) {
    var key = sym * 100000 + d;
    if (klCache.has(key)) return klCache.get(key);
    var e = R.endeBis(T, sym, d - 1), a = Math.max(T.symStart[sym], e - K.UMSATZ_FENSTER), w = [];
    for (var q = a; q < e; q++) w.push(g.umsatz[T.symZeilen[q]]);
    var med = w.length ? R.median(w) : 0, k = { median: med, index: klasseVonUmsatz(med), unter5: med < 5e6 };
    klCache.set(key, k);
    return k;
  }
  function roh(sym, d, kurs) {
    var z = T.zeileVon(sym, d);
    return z >= 0 && g.bSchluss[z] > 0 && g.rohSchluss[z] > 0 ? kurs * g.rohSchluss[z] / g.bSchluss[z] : kurs;
  }
  return { T: T, tagVonMs: tagVonMs, klasse: klasse, roh: roh };
}

var KF = { fn: null, letzte: null, statistik: null };
/** Kostenfunktion k(name, seite, stueck, kurs, nowMs) je Seite als Bruch. art null = Vorgabe 20 Bp (wie mfhandel.js), 'regel' = Kostenregel (Eroeffnung
 *  + IBKR Fixed, Klasse 1-5) mit dem echten Handelswert (Startsumme R.START = 100.000 $, Skalierung 1). */
function kostenFunktion(art, C) {
  if (!art) { var k0 = K.KORB.kostenBp / 10000; return function () { KF.letzte = null; return k0; }; }
  if (art !== 'regel') throw new Error('korb-kosten: kostenBpJeSeite muss null (20 Bp) | regel sein, nicht ' + JSON.stringify(art));
  return function (name, seite, stueck, kurs, nowMs) {
    if (!C) throw new Error('KLINKE: Kostenkontext fehlt');
    var d = C.tagVonMs.get(nowMs), sym = C.T.symIdx[name];
    if (d == null || sym == null) throw new Error('KLINKE: Kostenkontext fehlt fuer ' + name);
    var kl = C.klasse(sym, d), wert = stueck * kurs, kursRoh = C.roh(sym, d, kurs);
    var a = anteilSeite(kl.index, K.KOSTEN.ausfuehrungTag, seite, wert, kursRoh, K.KOSTEN.modell);
    KF.letzte = { klasse: kl.index, unter5: kl.unter5 };
    return a;
  };
}

/* ---------- Kopie von rechnen.js fuehreAusK (Nr. 122; dort Kopie von mfhandel.js fuehreAus mit k je Handel) ---------- */
function fuehreAusK(buch, plan, nowMs, kf, opts, log) {
  var kl = opts && opts.kleinstAnteil > 0 ? opts.kleinstAnteil : 0;
  var n = 0;
  if (!buch.trades) buch.trades = [];
  plan.verkaufen.forEach(function (o) {
    var idx = buch.positionen.findIndex(function (p) { return p.sym === o.sym; });
    if (idx < 0) return;
    var p = buch.positionen[idx];
    var k = kf(o.sym, 'verkauf', p.stueck, o.kurs, nowMs);
    var erloes = p.stueck * o.kurs * (1 - k);
    buch.cash += erloes;
    log.push({ art: 'verkauf', wert: p.stueck * o.kurs, k: k, info: KF.letzte });
    buch.trades.push({ t: nowMs, sym: o.sym, art: 'verkauf', stueck: p.stueck, kurs: o.kurs, pnl: Math.round((erloes - p.stueck * p.einstand) * 100) / 100 });
    buch.positionen.splice(idx, 1);
    n++;
  });
  plan.kaufen.forEach(function (o) {
    var k = kf(o.sym, 'kauf', o.stueck, o.kurs, nowMs);
    var kosten = o.stueck * o.kurs * (1 + k);
    if (!(o.stueck > 0) || kosten > buch.cash) {
      o.stueck = Math.max(0, Math.floor(buch.cash / (o.kurs * (1 + k)) * 10000) / 10000);
      var k2 = o.stueck > 0 ? kf(o.sym, 'kauf', o.stueck, o.kurs, nowMs) : k, schleife = 0, variabel = k2 !== k;
      while (k2 !== k && o.stueck > 0 && o.stueck * o.kurs * (1 + k2) > buch.cash && schleife < 50) {
        k = k2; o.stueck = Math.max(0, Math.floor(buch.cash / (o.kurs * (1 + k)) * 10000) / 10000);
        k2 = o.stueck > 0 ? kf(o.sym, 'kauf', o.stueck, o.kurs, nowMs) : k; schleife++;
      }
      k = k2;
      kosten = o.stueck * o.kurs * (1 + k);
      if (!(o.stueck > 0)) return;
      if (variabel && kosten > buch.cash) { o.stueck = 0; return; }
    }
    if (kl > 0 && o.budget > 0 && o.stueck * o.kurs < kl * o.budget) { o.stueck = 0; return; }   // K1: kein Kleinstkauf
    buch.cash -= kosten;
    log.push({ art: 'kauf', wert: o.stueck * o.kurs, k: k, info: KF.letzte });
    buch.positionen.push({ sym: o.sym, stueck: o.stueck, einstand: o.kurs * (1 + k), seit: nowMs });
    buch.trades.push({ t: nowMs, sym: o.sym, art: 'kauf', stueck: o.stueck, kurs: o.kurs });
    n++;
  });
  if (buch.trades.length > 400) buch.trades = buch.trades.slice(-400);
  return n;
}

/* ---------- Kopie von rechnen.js fuehreHuelleK (Nr. 122; dort Kopie von kleinst.js fuehreHuelle mit k je Handel, Zaehler und Klinken wie dort) ---------- */
function huelle(KS) {
  var H = KS.H, ANTEIL = KS.ANTEIL, VOLL_AB = KS.VOLL_AB;
  return function fuehreHuelleK(buch, plan, nowMs) {
    if (!H.opts) throw new Error('KLINKE: Huelle ohne Schalter gerufen (H.opts fehlt)');
    var o = H.offen;
    if (!o || o.plan !== plan) throw new Error('KLINKE: Ausfuehrung ohne den Plan aus der Huelle');
    H.offen = null; H.aufrufe.fuehre++;
    var an = H.opts.kleinstAnteil > 0, bar0 = buch.cash, nV0 = 0;
    plan.verkaufen.forEach(function (v) { if (buch.positionen.some(function (x) { return x.sym === v.sym; })) nV0++; });
    var geplant = plan.kaufen.map(function (x) { return x.stueck; }), log = [];
    var n = fuehreAusK(buch, plan, nowMs, KF.fn, H.opts, log);
    var bar = bar0, volV = 0, volK = 0, kostenSumme = 0, nV = 0, gekauft = 0, abweichung = false, arten = [];
    log.forEach(function (x) {
      if (x.art === 'verkauf') { bar += x.wert * (1 - x.k); volV += x.wert; nV++; } else { bar -= x.wert * (1 + x.k); volK += x.wert; gekauft++; }
      kostenSumme += x.wert * x.k;
      var st = KF.statistik; if (st && x.info) { st.n++; st.jeKlasse[x.info.klasse]++; }
    });
    if (Math.abs(bar - buch.cash) > 1e-6) throw new Error('KLINKE: das mitgerechnete Bargeld weicht vom Buch ab (' + bar + ' / ' + buch.cash + ')');
    if (nV !== nV0 || n !== nV + gekauft) throw new Error('KLINKE: Zahl der Ausfuehrungen passt nicht zu Verkaeufen und Kaeufen');
    plan.kaufen.forEach(function (x, i) {
      var art;
      if (x.stueck > 0) { var w = x.stueck * x.kurs; art = w < ANTEIL * x.budget ? 'kleinstkauf' : w < VOLL_AB * x.budget ? 'verkleinert' : 'voll'; }
      else art = an ? 'ausgefallenK1oderBargeld' : 'ausgefallenBargeld';
      if (x.stueck !== geplant[i]) abweichung = true;
      arten.push(art);
    });
    if (an && arten.indexOf('kleinstkauf') >= 0) throw new Error('KLINKE: mit Regel K ist ein Kauf unter ' + (ANTEIL * 100) + ' % des Platzwerts entstanden');
    var Z = H.zaehler;
    if (Z) {
      Z.umschichtungen++; Z.kaeufeGeplant += plan.kaufen.length; Z.verkaeufe += nV;
      if (abweichung) Z.mitZuWenigBargeld++;
      arten.forEach(function (art) { if (art.indexOf('ausgefallen') === 0) Z.ausgefallen++; else Z[art]++; });
      var np = buch.positionen.length;
      if (Z.positionenDanachMin === null || np < Z.positionenDanachMin) Z.positionenDanachMin = np;
      if (Z.positionenDanachMax === null || np > Z.positionenDanachMax) Z.positionenDanachMax = np;
      Z.volumen += volV + volK; Z.kosten += kostenSumme;
    }
    return n;
  };
}

/** Kostenregel fuer die Dauer von fn einschalten (MH.fuehreAus = Huelle mit k je Handel), danach die alte Huelle zurueck. art null -> fn ohne Umbau. */
function mitKosten(KS, V, art, fn) {
  if (!art) return fn();
  var MH = KS.MH, alt = MH.fuehreAus, altFn = KF.fn;
  KF.fn = kostenFunktion(art, kontext(V, KS.R)); KF.statistik = { n: 0, jeKlasse: [0, 0, 0, 0, 0] };
  MH.fuehreAus = huelle(KS);
  try { return fn(); } finally { MH.fuehreAus = alt; KF.fn = altFn; }
}

/**
 * Nach Steuer (Kopie massstab.js Teil 2): Buch mit dem effektiven Satz je Seite bpEff im Steuerrechner Nr. 82 gegen den Nasdaq-ETF (QQQ-Reihe aus
 * pruefstrasse/daten/qqq-tage.json, Fonds mit dem Modell Nr. 82, TER-Aufschlag ETF - QQQ = 0) und nachrichtlich gegen den S&P-500-ETF. phasen = Liste
 * der Starttage (Panel-Tage), F = { von, bis, bisText }. Liefert je Phase buchB/nasdaqB/spyB (p. a. nach Steuer, alles verkauft) und die Mediane.
 */
function nachSteuer(KS, V, F, korb, bpEff, qqq, nPhasen) {
  var R = KS.R, MH = KS.MH, bp0 = R.KOSTEN_BP, altP = MH.planeUmschichtung, altF = MH.fuehreAus;
  delete require.cache[require.resolve(STEUER)];
  R.KOSTEN_BP = bpEff;
  var ST = require(STEUER);
  R.KOSTEN_BP = bp0;
  MH.planeUmschichtung = function (z, b, p) { return KS.ECHT.planeUmschichtung(z, b, p, { kleinstAnteil: KS.ANTEIL }); };
  MH.fuehreAus = function (b, plan, ms, bp) { return KS.ECHT.fuehreAus(b, plan, ms, bp, { kleinstAnteil: KS.ANTEIL }); };
  try {
    var parQ = ST.mit(ST.MODELL, { kostenPa: ETF.ter - TER_QQQ }), parS = ST.MODELL, aus = [];
    var reihe = qqq.tage.map(function (x) { return { datum: x.d, eroeffnung: x.o, schluss: x.c, aus: x.aus || [] }; });
    for (var k = 0; k < (nPhasen || 1); k++) {
      var st = V.Q.ptage[V.Q.ord[F.von] + k], start = String(V.T.kal.tage[st]);
      var L1 = ST.simuliere(V.T, V.Q, V.M, { startTag: st, endTag: F.bis, totalverlust: V.haupt, korb: korb, mechanik: 'app', steuersatz: ST.MODELL.steuersatz });
      var j = ST.jahreVon(V.Q, st, F.bis), rq = reihe.filter(function (x) { return x.datum >= start && x.datum <= F.bisText; });
      if (!rq.length || rq[0].datum !== start || rq[rq.length - 1].datum !== F.bisText) throw new Error('KLINKE: QQQ-Reihe ohne Tag ' + start + ' / ' + F.bisText + ' (qqq-tage.json bis ' + qqq.bis + ')');
      var fq = ST.fonds(rq, R.START, parQ), fs0 = ST.fonds(ST.spyReihe(V.T, V.Q, V.M, st, F.bis), R.START, parS);
      aus.push({ k: k, start: start, buchB: ST.pa(L1.endBuchVerkauft, j), nasdaqB: ST.pa(fq.endB, j), spyB: ST.pa(fs0.endB, j) });
    }
    var med = function (f) { return R.median(aus.map(f)); };
    return { bpJeSeite: bpEff, modell: 'Nr. 82 steuer.js MODELL (unveraendert)', etf: ETF, k0: aus[0], phasen: aus.length,
      median: { buchB: med(function (x) { return x.buchB; }), nasdaqB: med(function (x) { return x.nasdaqB; }), abstandNasdaqB: med(function (x) { return x.buchB - x.nasdaqB; }), abstandSpyB: med(function (x) { return x.buchB - x.spyB; }) },
      vornGegenNasdaqB: aus.filter(function (x) { return x.buchB > x.nasdaqB; }).length, je: aus };
  } finally { MH.planeUmschichtung = altP; MH.fuehreAus = altF; }
}

module.exports = { VORGABE: VORGABE, MASSSTAEBE: MASSSTAEBE, anteilSeite: anteilSeite, klasseVonUmsatz: klasseVonUmsatz, kontext: kontext, kostenFunktion: kostenFunktion,
  fuehreAusK: fuehreAusK, huelle: huelle, mitKosten: mitKosten, nachSteuer: nachSteuer, KF: KF, ETF: ETF };
