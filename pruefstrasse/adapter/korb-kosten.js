'use strict';
/* Korb-Form, Nr. 121-2b (A.4, B.3): Kostenregel je Handel und Massstab Nasdaq-100 nach Steuer als PARAMETER des Korb-Adapters, Vorgabe = heutiges
 * Verhalten (20 Bp je Seite, SPY) - die gesiegelten Laeufe A-187/B-187 (Nr. 96) rechnen mit der Vorgabe unveraendert.
 * Nr. 125a (26.10.2026, Live = Messung, Zweitleser 7): die Handelshuelle ruft jetzt das ORIGINAL mfhandel.js fuehreAus mit opts.kostenRegel (Nr. 126) -
 * dieselbe Funktion, mit der das App-Buch handelt. Die Kopie fuehreAusK steht nur noch als Referenz fuer die Bindungstests da (App-Test
 * test-momentum-umstellung.js A.3 und pruefstrasse/test-125a.js K-1 binden Original und Kopie bitgleich); der Lauf ruft sie nicht mehr.
 * HERKUNFT (kopiert, nicht neu erfunden; die Studien bleiben unveraendert):
 *   kontext, fuehreAusK, huelle      <- studien/momentum-wiedervorlage-2026-10-23/rechnen.js (Nr. 122: Kopie von mfhandel.js fuehreAus und kleinst.js
 *                                       fuehreHuelle mit k je Handel; dort mit 20 Bp bitgleich auf das Siegel geprueft)
 *   nachSteuer                       <- studien/momentum-wiedervorlage-2026-10-23/massstab.js Teil 2 (Buch: Steuerrechner Nr. 82 simuliere mit dem
 *                                       EFFEKTIVEN Satz je Seite; Fonds-Seite seit Nr. 125a aus dem App-Modul steuer.js, Kopie Nr. 82 bitgleich, Nr. 126 Test B.1)
 *   nachSteuerVorwaerts (Nr. 125a)   <- App massstab.js Massstab.nachSteuer (Schatten-Steuer wie das App-Buch, steuer.js) - Live = Messung
 * Die Kosten je Handel kommen aus pruefstrasse/kosten.js seite() (Klasse 1-5: Klasse 5 = Median-Umsatz der 20 Zeilen >= KLASSE5_UMSATZ).
 * Simulation mit virtuellem Kapital, keine Anlage- und keine Steuerberatung. */
var path = require('path');
var K = require('../konfig.js');
var KO = require('../kosten.js');

var VORGABE = { kostenBpJeSeite: null, massstab: 'SPY' };
var MASSSTAEBE = ['SPY', 'nasdaq100-steuer'];
var STEUER = path.join(K.REPO, 'studien', 'nach-steuern-2026-10-04', 'steuer.js');
var STEUER_APP = path.join(K.REPO, 'steuer.js'), MASSSTAB_APP = path.join(K.REPO, 'massstab.js');
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

/* KF.regel: die Kostenregel des laufenden mitKosten (Signatur von mfhandel.js fuehreAus opts.kostenRegel); KF.statistik: Zaehler je Klasse;
 * KF.sammler (Nr. 125a, Vorwaerts nach Steuer): Trades und Einstaende je Ausfuehrung, bevor korb.js simuliere buch.trades leert. */
var KF = { fn: null, regel: null, letzte: null, statistik: null, sammler: null };
/** Nr. 125a: die Kostenregel als opts.kostenRegel fuer mfhandel.js fuehreAus - ({ sym, seite, stueck, kurs, nowMs }) -> { spanne, gebuehr, klasse }.
 *  Kostenregel (Eroeffnung + IBKR Fixed, Klasse 1-5) mit dem echten Handelswert. opt.kapitalUsd (Entscheid PM 19, Kandidatenlaeufe 10.000): das
 *  Rechenbuch laeuft mit R.START (100.000 $); die Gebuehr wird fuer die auf kapitalUsd skalierte Order gerechnet (Stueck und Wert x kapitalUsd / START) -
 *  die Spanne ist ein Anteil und haengt nicht am Kapital. Ohne kapitalUsd (oder = START): spanne + gebuehr ziffergleich zu anteilSeite. */
function regelFunktion(C, opt) {
  opt = opt || {};
  var skala = opt.kapitalUsd > 0 && opt.start > 0 ? opt.kapitalUsd / opt.start : 1;
  return function (o) {
    if (!C) throw new Error('KLINKE: Kostenkontext fehlt');
    var d = C.tagVonMs.get(o.nowMs), sym = C.T.symIdx[o.sym];
    if (d == null || sym == null) throw new Error('KLINKE: Kostenkontext fehlt fuer ' + o.sym);
    var kl = C.klasse(sym, d), wert = o.stueck * o.kurs, kursRoh = C.roh(sym, d, o.kurs);
    var s = KO.seite(kl.index, K.KOSTEN.ausfuehrungTag, o.seite, skala === 1 ? wert : wert * skala, kursRoh, K.KOSTEN.modell);
    KF.letzte = { klasse: kl.index, unter5: kl.unter5 };
    return { spanne: s.spanne, gebuehr: s.gebuehr, klasse: kl.index };
  };
}
/** Kostenfunktion k(name, seite, stueck, kurs, nowMs) je Seite als Bruch (alte Signatur, fuer fuehreAusK und Tests). art null = Vorgabe 20 Bp
 *  (wie mfhandel.js), 'regel' = Kostenregel = spanne + gebuehr der regelFunktion. */
function kostenFunktion(art, C, opt) {
  if (!art) { var k0 = K.KORB.kostenBp / 10000; return function () { KF.letzte = null; return k0; }; }
  if (art !== 'regel') throw new Error('korb-kosten: kostenBpJeSeite muss null (20 Bp) | regel sein, nicht ' + JSON.stringify(art));
  var r = regelFunktion(C, opt);
  return function (name, seite, stueck, kurs, nowMs) { var x = r({ sym: name, seite: seite, stueck: stueck, kurs: kurs, nowMs: nowMs }); return x.spanne + x.gebuehr; };
}

/* ---------- fuehreAusK: NUR REFERENZ FUER TEST A.3, NICHT IM LAUF BENUTZT ----------
 * Kopie von rechnen.js fuehreAusK (Nr. 122; dort Kopie von mfhandel.js fuehreAus mit k je Handel). Der Korb-Lauf ruft das Original mfhandel.js fuehreAus mit
 * opts.kostenRegel (huelle unten; test-125a.js K-1 Quelle + Bitgleichheit, K-4 Laufzeit-Spion). Die Kopie bleibt nur, weil der App-Test
 * test-momentum-umstellung.js A.3 Original und Kopie bitgleich bindet. */
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

/* ---------- Huelle (Kopie rechnen.js fuehreHuelleK, Zaehler und Klinken wie dort) - seit Nr. 125a mit dem ORIGINAL fuehreAus ---------- */
function huelle(KS) {
  var H = KS.H, ANTEIL = KS.ANTEIL, VOLL_AB = KS.VOLL_AB;
  if (typeof KS.ECHT.fuehreAus !== 'function') throw new Error('KLINKE: kleinst.js ECHT.fuehreAus fehlt');
  return function fuehreHuelleK(buch, plan, nowMs) {
    if (!H.opts) throw new Error('KLINKE: Huelle ohne Schalter gerufen (H.opts fehlt)');
    if (typeof KF.regel !== 'function') throw new Error('KLINKE: Huelle ohne Kostenregel gerufen');
    var o = H.offen;
    if (!o || o.plan !== plan) throw new Error('KLINKE: Ausfuehrung ohne den Plan aus der Huelle');
    H.offen = null; H.aufrufe.fuehre++;
    var an = H.opts.kleinstAnteil > 0, bar0 = buch.cash, nV0 = 0;
    plan.verkaufen.forEach(function (v) { if (buch.positionen.some(function (x) { return x.sym === v.sym; })) nV0++; });
    var geplant = plan.kaufen.map(function (x) { return x.stueck; }), log = [];
    /* Nr. 125a: das Original (mfhandel.js fuehreAus, Weiche opts.kostenRegel -> fuehreAusRegel), kostenBp wird dort nicht gelesen */
    var n = KS.ECHT.fuehreAus(buch, plan, nowMs, K.KORB.kostenBp, { kostenRegel: KF.regel, kleinstAnteil: H.opts.kleinstAnteil, protokoll: log });
    if (KF.sammler) {
      (buch.trades || []).forEach(function (t) { if (t.t === nowMs) KF.sammler.trades.push(t); });
      buch.positionen.forEach(function (p) { if (p.seit === nowMs) KF.sammler.einstand[p.sym] = { stueck: p.stueck, einstand: p.einstand }; });
    }
    var bar = bar0, volV = 0, volK = 0, kostenSumme = 0, nV = 0, gekauft = 0, abweichung = false, arten = [];
    log.forEach(function (x) {
      if (x.art === 'verkauf') { bar += x.wert * (1 - x.k); volV += x.wert; nV++; } else { bar -= x.wert * (1 + x.k); volK += x.wert; gekauft++; }
      kostenSumme += x.wert * x.k;
      var st = KF.statistik; if (st && x.klasse != null) { st.n++; st.jeKlasse[x.klasse]++; }
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

/** Kostenregel fuer die Dauer von fn einschalten (MH.fuehreAus = Huelle mit dem Original und opts.kostenRegel), danach die alte Huelle zurueck.
 *  art null -> fn ohne Umbau. opt = { kapitalUsd (Nr. 125a), sammler: { trades: [], einstand: {} } (Nr. 125a, Vorwaerts nach Steuer) }. */
function mitKosten(KS, V, art, fn, opt) {
  if (!art) return fn();
  if (art !== 'regel' && art !== 'brutto') throw new Error('korb-kosten: kostenBpJeSeite muss null (20 Bp) | regel | brutto sein, nicht ' + JSON.stringify(art));
  opt = opt || {};
  var MH = KS.MH, alt = MH.fuehreAus, altR = KF.regel, altS = KF.sammler;
  /* brutto (QS F5, nur nachrichtlich: Rang vor Kosten): dieselbe Huelle mit Kosten 0 */
  KF.regel = art === 'brutto' ? function () { return { spanne: 0, gebuehr: 0, klasse: null }; } : regelFunktion(kontext(V, KS.R), { kapitalUsd: opt.kapitalUsd, start: KS.R.START }); KF.statistik = { n: 0, jeKlasse: [0, 0, 0, 0, 0] };
  KF.sammler = opt.sammler || null;
  MH.fuehreAus = huelle(KS);
  try { return fn(); } finally { MH.fuehreAus = alt; KF.regel = altR; KF.sammler = altS; }
}

/* ---------- Halte-Band (Nr. 125a B2, Schnittstelle fuer Nr. 125b) ----------
 * kand.params.halteBand / konfigurationen[0].anzahl: die Zielfunktion liefert die RANGLISTE (zukunftsfrei, ohne Bestand - korb.js speichert die Ziele je
 * Stichtag fuer alle 63 Startphasen und Buecher), mfhandel.js zielMitBand(rangliste, buch, { anzahl, halteBand }) waehlt mit dem Bestand des Buchs: gehalten
 * bleibt, wer in der Rangliste auf Platz <= halteBand steht, aufgefuellt wird in Rangfolge bis anzahl. zielMitBand ist eine ADDITIVE Funktion in mfhandel.js
 * (Patch B2, erst nach Freigabe durch den PM); fehlt sie, bricht ein Kandidat mit halteBand laut ab - nie still ohne Band. Ohne halteBand kein Umbau (bitgleich). */
var BAND = { opts: null };
function bandOpts(kand) {
  var konf = (kand && kand.konfigurationen && kand.konfigurationen[0]) || {}, hb = kand && kand.params && kand.params.halteBand;
  if (hb == null) return null;
  if (!(hb >= 1) || Math.floor(hb) !== hb) throw new Error('korb: params.halteBand muss eine ganze Zahl >= 1 sein, nicht ' + JSON.stringify(hb));
  if (!(konf.anzahl >= 1)) throw new Error('korb: params.halteBand braucht konfigurationen[0].anzahl (Zielzahl) - sonst waere die ganze Rangliste das Ziel');
  return { anzahl: konf.anzahl || null, halteBand: hb };
}
function mitBand(MH, opts, fn) {
  if (!opts) return fn();
  if (typeof MH.zielMitBand !== 'function') throw new Error('B2 NICHT FREIGEGEBEN: mfhandel.js kennt zielMitBand (anzahl/halteBand) noch nicht - der Patch mfhandel-b2.patch wartet auf die Freigabe des PM; kein Lauf ohne Band');
  var alt = MH.planeUmschichtung, altB = BAND.opts;
  BAND.opts = opts;
  MH.planeUmschichtung = function (ziel, buch, preise) { return alt(MH.zielMitBand(ziel, buch, opts), buch, preise); };
  try { return fn(); } finally { MH.planeUmschichtung = alt; BAND.opts = altB; }
}

/**
 * Nach Steuer (Kopie massstab.js Teil 2): Buch mit dem effektiven Satz je Seite bpEff im Steuerrechner Nr. 82 gegen den Nasdaq-ETF (QQQ-Reihe aus
 * pruefstrasse/daten/qqq-tage.json, Fonds mit dem Modell Nr. 82, TER-Aufschlag ETF - QQQ = 0) und nachrichtlich gegen den S&P-500-ETF. phasen = Liste
 * der Starttage (Panel-Tage), F = { von, bis, bisText }. Liefert je Phase buchB/nasdaqB/spyB (p. a. nach Steuer, alles verkauft) und die Mediane.
 * Nr. 125a: fonds, pa, mit, MODELL aus dem App-Modul steuer.js (Kopie Nr. 82, bitgleich - Klinke unten); simuliere/jahreVon/spyReihe (das Buch mit Steuer
 * aus dem Bargeld) gibt es nur in der Studie Nr. 82 und bleiben dort.
 */
function nachSteuer(KS, V, F, korb, bpEff, qqq, nPhasen) {
  var R = KS.R, MH = KS.MH, bp0 = R.KOSTEN_BP, altP = MH.planeUmschichtung, altF = MH.fuehreAus;
  delete require.cache[require.resolve(STEUER)];
  R.KOSTEN_BP = bpEff;
  var ST = require(STEUER), SA = require(STEUER_APP);
  R.KOSTEN_BP = bp0;
  if (JSON.stringify(SA.MODELL) !== JSON.stringify(ST.MODELL) || SA.START !== R.START) throw new Error('KLINKE: App-steuer.js weicht vom Steuerrechner Nr. 82 ab (MODELL oder START)');
  var band = BAND.opts;
  MH.planeUmschichtung = function (z, b, p) { return KS.ECHT.planeUmschichtung(band ? MH.zielMitBand(z, b, band) : z, b, p, { kleinstAnteil: KS.ANTEIL }); };
  MH.fuehreAus = function (b, plan, ms, bp) { return KS.ECHT.fuehreAus(b, plan, ms, bp, { kleinstAnteil: KS.ANTEIL }); };
  try {
    var parQ = SA.mit(SA.MODELL, { kostenPa: ETF.ter - TER_QQQ }), parS = SA.MODELL, aus = [];
    var reihe = qqq.tage.map(function (x) { return { datum: x.d, eroeffnung: x.o, schluss: x.c, aus: x.aus || [] }; });
    for (var k = 0; k < (nPhasen || 1); k++) {
      var st = V.Q.ptage[V.Q.ord[F.von] + k], start = String(V.T.kal.tage[st]);
      var L1 = ST.simuliere(V.T, V.Q, V.M, { startTag: st, endTag: F.bis, totalverlust: V.haupt, korb: korb, mechanik: 'app', steuersatz: ST.MODELL.steuersatz });
      var j = ST.jahreVon(V.Q, st, F.bis), rq = reihe.filter(function (x) { return x.datum >= start && x.datum <= F.bisText; });
      if (!rq.length || rq[0].datum !== start || rq[rq.length - 1].datum !== F.bisText) throw new Error('KLINKE: QQQ-Reihe ohne Tag ' + start + ' / ' + F.bisText + ' (qqq-tage.json bis ' + qqq.bis + ')');
      var fq = SA.fonds(rq, R.START, parQ), fs0 = SA.fonds(ST.spyReihe(V.T, V.Q, V.M, st, F.bis), R.START, parS);
      aus.push({ k: k, start: start, buchB: ST.pa(L1.endBuchVerkauft, j), nasdaqB: SA.pa(fq.endB, j), spyB: SA.pa(fs0.endB, j) });
    }
    var med = function (f) { return R.median(aus.map(f)); };
    return { bpJeSeite: bpEff, modell: 'Nr. 82 steuer.js MODELL (unveraendert; Fonds-Seite ueber die App-Kopie steuer.js)', etf: ETF, k0: aus[0], phasen: aus.length,
      median: { buchB: med(function (x) { return x.buchB; }), nasdaqB: med(function (x) { return x.nasdaqB; }), abstandNasdaqB: med(function (x) { return x.buchB - x.nasdaqB; }), abstandSpyB: med(function (x) { return x.buchB - x.spyB; }) },
      vornGegenNasdaqB: aus.filter(function (x) { return x.buchB > x.nasdaqB; }).length, je: aus };
  } finally { MH.planeUmschichtung = altP; MH.fuehreAus = altF; }
}

/**
 * Nr. 125a B.3 (Vorwaerts nach Steuer, Live = Messung): das Vorwaertsbuch (ein Start am Stichtag, Kostenregel, gesammelte Trades) durch DIESELBE Rechnung wie das
 * App-Buch - massstab.js Massstab.nachSteuer (Aktien-Verlusttopf je Umschichtung, Ausschuettungen netto, Endverkauf mit dem mittleren Kostensatz, QQQ-Fonds
 * Modell Nr. 82 ab dem ersten QQQ-Tag >= Start). L = korb.js simuliere, sammler aus mitKosten, F = { von, bis } (Panel-Tage), qqq = qqq-tage.json.
 * Reihenenden gehen als Trades 'reihenende' mit pnl = Gutschrift - Stueck x Einstand in den Topf (wie das App-Buch, Nr. 93).
 */
function nachSteuerVorwaerts(KS, V, F, L, sammler, qqq) {
  var MS = require(MASSSTAB_APP), T = V.T, Q = V.Q, g = T.g, R = KS.R;
  var trades = sammler.trades.slice();
  L.reihenenden.forEach(function (r) {
    var e = sammler.einstand[r.reihe], d = T.kal.idx[r.tag];
    if (!e || d == null) throw new Error('KLINKE: Reihenende ohne Einstand oder Tag: ' + r.reihe + ' ' + r.tag);
    trades.push({ t: Q.ms[d], sym: r.reihe, art: 'reihenende', stueck: e.stueck, kurs: e.stueck > 0 ? r.gutschrift / e.stueck : 0, pnl: Math.round((r.gutschrift - e.stueck * e.einstand) * 100) / 100 });
  });
  trades.sort(function (a, b) { return a.t - b.t; });
  var preise = {};
  L.buch.positionen.forEach(function (p) { var s = T.symIdx[p.sym], e = R.endeBis(T, s, F.bis); if (e > T.symStart[s]) preise[p.sym] = g.bSchluss[T.symZeilen[e - 1]]; });
  var b = { start: R.START, cash: L.buch.cash, positionen: L.buch.positionen, trades: trades, massnahmen: [{ art: 'div', t: Q.ms[F.von], summe: L.zaehler.ausschuettungSumme }] };
  /* Bezug des Abschnitts (App QS F1, massstab.js abschnittBezug, Commit 3f5504c): das Vorwaertsbuch beginnt am Stichtag mit Bargeld = Startsumme, ohne Positionen.
   * Nur noch diese Signatur (Entscheid PM 26.10.); fehlt abschnittBezug, ist die App aelter als die Messung - Abbruch statt stiller Ersatzrechnung. */
  if (typeof MS.abschnittBezug !== 'function') throw new Error('MESSGERAET: massstab.js ohne abschnittBezug (Nr. 126 QS F1) - Vorwaerts nach Steuer nicht rechenbar');
  var bezug = MS.abschnittBezug({ cash: R.START, positionen: [] }, {}, Q.ms[F.von], F.vonText);
  var r = MS.nachSteuer({ buch: b, abschnitt: bezug, endeMs: Q.ms[F.bis], preise: preise, qqq: qqq.tage });
  var wert = b.cash; b.positionen.forEach(function (p) { wert += p.stueck * preise[p.sym]; });
  if (Math.abs(wert - L.endBuch) > 1e-6 * Math.max(1, L.endBuch)) throw new Error('KLINKE: Buchwert fuer die Steuer (' + wert + ') ist nicht der Endwert des Laufs (' + L.endBuch + ')');
  r.rechnung = 'App massstab.js Massstab.nachSteuer (steuer.js, Kopie Nr. 82) auf dem Vorwaertsbuch';
  return r;
}

module.exports = { VORGABE: VORGABE, MASSSTAEBE: MASSSTAEBE, anteilSeite: anteilSeite, klasseVonUmsatz: klasseVonUmsatz, kontext: kontext, kostenFunktion: kostenFunktion,
  regelFunktion: regelFunktion, fuehreAusK: fuehreAusK, huelle: huelle, mitKosten: mitKosten, nachSteuer: nachSteuer, nachSteuerVorwaerts: nachSteuerVorwaerts,
  bandOpts: bandOpts, mitBand: mitBand, BAND: BAND, KF: KF, ETF: ETF, STEUER_APP: STEUER_APP };
