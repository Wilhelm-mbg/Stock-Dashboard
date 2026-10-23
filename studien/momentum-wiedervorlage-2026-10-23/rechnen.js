'use strict';
/* Auftrag Nr. 122 (23.10.2026): der gesiegelte Momentum-Rueckblick (studien/momentum-korb-v23-2026-10-04/, Panel v2.3, Regel K) mit
 * neuem Kostenmodell. Gerufen wird derselbe Rechner (kleinst.js -> korb.js -> rueckblick.js -> mfhandel.js, alle NUR geladen, nie geaendert).
 * Ersetzt wird zur Laufzeit nur MH.fuehreAus (die Huelle aus kleinst.js): an ihre Stelle tritt hier eine KOPIE von fuehreHuelle (kleinst.js)
 * und fuehreAus (mfhandel.js), in der der feste Satz k = kostenBp / 10000 durch k je Handel ersetzt ist (Spanne der Umsatzklasse + IBKR).
 * Vorher Pflicht: mit k = 20 / 10000 fuer jeden Handel trifft die Kopie die gesiegelten Zahlen (ergebnis.json von Nr. 96) auf das Bit -
 * Endwert, alle 63 Abstaende, alle vier Laeufe. Erst dann wird umgeschaltet.
 *   node --max-old-space-size=6144 studien/momentum-wiedervorlage-2026-10-23/rechnen.js */
process.env.RUECKBLICK_PANEL = 'v2.3';
var fs = require('fs');
var path = require('path');
var REPO = path.resolve(__dirname, '..', '..');
var KS = require(path.join(REPO, 'studien', 'momentum-korb-kleinst-2026-10-04', 'kleinst.js'));
var R = KS.R, S = KS.S, MH = KS.MH, H = KS.H;
var KO = require(path.join(__dirname, 'kosten.js'));
var SIEGEL = path.join(REPO, 'studien', 'momentum-korb-v23-2026-10-04', 'ergebnis.json');
var ANTEIL = KS.ANTEIL, VOLL_AB = KS.VOLL_AB;

/* ---------- Kostenfunktion je Handel ---------- */
var KF = { fn: null, ctx: null, statistik: null, letzte: null };
/** Kontext: Tag aus nowMs, Umsatzklasse (Median g.umsatz der 20 Zeilen bis zum Stichtag d-1), roher Kurs (bEroeffnung x rohSchluss / bSchluss). */
function kontext(V) {
  var T = V.T, Q = V.Q, g = T.g, tagVonMs = new Map(), klCache = new Map();
  for (var t = 0; t < T.nTage; t++) tagVonMs.set(Q.ms[t], t);
  function klasse(sym, d) {
    var key = sym * 100000 + d;
    if (klCache.has(key)) return klCache.get(key);
    var e = R.endeBis(T, sym, d - 1), a = Math.max(T.symStart[sym], e - 20), w = [];
    for (var q = a; q < e; q++) w.push(g.umsatz[T.symZeilen[q]]);
    var med = w.length ? R.median(w) : 0, k = { median: med, index: KO.klasseVon(med), unter5: med < 5e6 };
    klCache.set(key, k);
    return k;
  }
  function roh(sym, d, kurs) {
    var z = T.zeileVon(sym, d);
    return z >= 0 && g.bSchluss[z] > 0 && g.rohSchluss[z] > 0 ? kurs * g.rohSchluss[z] / g.bSchluss[z] : kurs;
  }
  return { T: T, tagVonMs: tagVonMs, klasse: klasse, roh: roh };
}
/** Szenario -> k(symName, seite, stueck, kurs, nowMs). alt: 20 / 10000 fuer jeden Handel (wie mfhandel.js). */
function kostenFn(sz, C) {
  if (sz.alt) { var k0 = 20 / 10000; return function () { KF.letzte = null; return k0; }; }
  var s = sz.kapitalUsd / R.START;
  return function (name, seite, stueck, kurs, nowMs) {
    var d = C.tagVonMs.get(nowMs), sym = C.T.symIdx[name];
    if (d == null || sym == null) throw new Error('KLINKE: Kostenkontext fehlt fuer ' + name);
    var kl = C.klasse(sym, d), wert = stueck * kurs;
    if (!(wert > 0)) return KO.anteilSeite(kl.index, sz.lage, null, seite, 1, 1).summe;
    var kursRoh = C.roh(sym, d, kurs), stueckReal = wert * s / kursRoh;
    var gebSim = KO.ibkrGebuehr(sz.modell, seite, stueckReal, kursRoh) / s;
    var sp = (sz.lage === 'eroeffnung' ? KO.KLASSEN[kl.index].eroeffnung : KO.KLASSEN[kl.index].kassa) / 100 / 2;
    KF.letzte = { klasse: kl.index, unter5: kl.unter5, spanne: sp, gebuehr: gebSim };
    return sp + gebSim / wert;
  };
}

/* ---------- Kopie von mfhandel.js fuehreAus mit k je Handel (sonst dieselben Ausdruecke in derselben Reihenfolge) ---------- */
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
      /* Neu gegenueber der App (nur wirksam, wenn k von der Stueckzahl abhaengt - Mindestgebuehr): nachrechnen, bis es passt */
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

/* ---------- Kopie von kleinst.js fuehreHuelle mit k je Handel (Zaehler und Klinken wie dort) ---------- */
function fuehreHuelleK(buch, plan, nowMs) {
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
    var st = KF.statistik;
    if (st && x.info) { st.n++; st.jeKlasse[x.info.klasse].n++; st.jeKlasse[x.info.klasse].volumen += x.wert; st.spanne += x.wert * x.info.spanne; st.gebuehr += x.info.gebuehr;
      if (x.info.unter5) st.unter5++; if (x.info.gebuehr / x.wert > st.maxGebuehrAnteil) st.maxGebuehrAnteil = x.info.gebuehr / x.wert; }
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
}

/* ---------- Szenarien ---------- */
var SZENARIEN = [
  { name: 'alt-20bp', alt: true, text: 'alt: 20 Bp je Seite (0,40 Pp je Rundlauf)' },
  { name: 'eroeffnung-fixed-100k', lage: 'eroeffnung', modell: 'fixed', kapitalUsd: 100000, text: 'Spanne Eroeffnung + IBKR Fixed, 100.000 $' },
  { name: 'kassa-fixed-100k', lage: 'kassa', modell: 'fixed', kapitalUsd: 100000, text: 'Spanne Kassa (mitte) + IBKR Fixed, 100.000 $' },
  { name: 'eroeffnung-tiered-100k', lage: 'eroeffnung', modell: 'tiered', kapitalUsd: 100000, text: 'Spanne Eroeffnung + IBKR Tiered, 100.000 $' },
  { name: 'kassa-tiered-100k', lage: 'kassa', modell: 'tiered', kapitalUsd: 100000, text: 'Spanne Kassa + IBKR Tiered, 100.000 $' },
  { name: 'eroeffnung-fixed-50kEUR', lage: 'eroeffnung', modell: 'fixed', kapitalUsd: 50000 * KO.EURUSD, text: 'Spanne Eroeffnung + IBKR Fixed, 50.000 €' },
  { name: 'kassa-fixed-50kEUR', lage: 'kassa', modell: 'fixed', kapitalUsd: 50000 * KO.EURUSD, text: 'Spanne Kassa + IBKR Fixed, 50.000 €' },
  { name: 'eroeffnung-fixed-10kEUR', lage: 'eroeffnung', modell: 'fixed', kapitalUsd: 10000 * KO.EURUSD, text: 'Spanne Eroeffnung + IBKR Fixed, 10.000 €' },
  { name: 'kassa-fixed-10kEUR', lage: 'kassa', modell: 'fixed', kapitalUsd: 10000 * KO.EURUSD, text: 'Spanne Kassa + IBKR Fixed, 10.000 €' },
];

function statistikNeu() { return { n: 0, unter5: 0, spanne: 0, gebuehr: 0, maxGebuehrAnteil: 0, jeKlasse: KO.KLASSEN.map(function (k) { return { klasse: k.name, n: 0, volumen: 0 }; }) }; }

/** Kalenderjahre: Umschichtungen, gezahlte Kosten in $ und in Pp des mittleren Buchwerts des Jahres (k = 0). */
function jahre(T, L) {
  var aus = {};
  L.tage.forEach(function (x) { var j = String(T.kal.tage[x.tag]).slice(0, 4); var a = aus[j] = aus[j] || { jahr: j, tage: 0, summeBuch: 0, umschichtungen: 0, kosten: 0 }; a.tage++; a.summeBuch += x.buch; });
  L.umschichtungen.forEach(function (u) { var a = aus[u.ausfuehrungstag.slice(0, 4)]; a.umschichtungen++; a.kosten += u.kosten; });
  return Object.keys(aus).sort().map(function (j) { var a = aus[j]; return { jahr: j, tage: a.tage, umschichtungen: a.umschichtungen, kosten: a.kosten, kostenPp: a.kosten / (a.summeBuch / a.tage) * 100 }; });
}

function einSzenario(V, C, sz, def) {
  KF.fn = kostenFn(sz, C);
  KF.statistik = statistikNeu();
  var e = KS.k0(V, def, ANTEIL), L = e.L, kz = e.kz, st = KF.statistik;
  KF.statistik = null;
  var vol = e.zaehler.volumen, j = jahre(V.T, L);
  var spjahre = kz.jahre;
  var v = KS.variante(V, def, ANTEIL);
  return {
    lauf: def.name, szenario: sz.name,
    k0: { buchEnde: kz.buchEnde, spyEnde: kz.spyEnde, buchPa: kz.buchPa, spyPa: kz.spyPa, abstandPa: kz.abstandPa, buchGesamt: kz.buchGesamt,
      rueckschlagBuch: R.maxRueckschlag(L.tage.map(function (x) { return x.buch; })), umschichtungen: L.zaehler.umschichtungen,
      umschichtungenJeJahr: L.zaehler.umschichtungen / spjahre, kostenGezahlt: L.zaehler.kosten, volumen: vol,
      kostenJeRundlaufPp: vol > 0 ? 2 * L.zaehler.kosten / vol * 100 : 0, bpJeSeiteEffektiv: vol > 0 ? L.zaehler.kosten / vol * 10000 : 0,
      kostenPpJeJahr: j.reduce(function (a, x) { return a + x.kostenPp; }, 0) / j.length, jahre: j, ausgefallen: e.zaehler.ausgefallen,
      statistik: st.n ? { handel: st.n, unter5: st.unter5, spanneUsd: st.spanne, gebuehrUsd: st.gebuehr, maxGebuehrAnteilPp: st.maxGebuehrAnteil * 100,
        volumenAnteilJeKlasse: st.jeKlasse.map(function (k) { return { klasse: k.klasse, handel: k.n, anteil: k.volumen / vol }; }) } : null },
    startphasen: { median: v.startphasen.median, minimum: v.startphasen.minimum, maximum: v.startphasen.maximum, vorDemMarkt: v.startphasen.vorDemMarkt,
      anzahl: v.startphasen.anzahl, abstaende: v.startphasen.abstaende, kosten63Mittel: v.zaehler63.kosten / v.startphasen.anzahl },
    k0Variante: { buchEnde: v.k0.buchEnde, abstandPa: v.k0.abstandPa },
  };
}

function lauf() {
  var t0 = Date.now(), siegel = JSON.parse(fs.readFileSync(SIEGEL, 'utf8'));
  var V = KS.vorbereitung(), C = kontext(V);
  console.log('Panel ' + V.T.stand.kennung + ' Bau ' + V.T.stand.bau);
  MH.fuehreAus = fuehreHuelleK;                                      /* ab hier rechnet korb.js mit der Kopie */
  var E = { kennung: 'momentum-wiedervorlage-2026-10-23/rechnen/v1', erzeugt: new Date().toISOString(), siegel: path.relative(REPO, SIEGEL).split(path.sep).join('/'),
    siegelKennung: siegel.kennung, panel: V.T.stand.kennung + ' Bau ' + V.T.stand.bau, szenarien: SZENARIEN, bitgleich: null, ergebnisse: {}, laufzeitSekunden: 0 };
  var datei = path.join(__dirname, 'ergebnis.json');
  SZENARIEN.forEach(function (sz) {
    E.ergebnisse[sz.name] = {};
    KS.LAEUFE.forEach(function (def) {
      var t1 = Date.now(), x = einSzenario(V, C, sz, def);
      E.ergebnisse[sz.name][def.name] = x;
      console.log(sz.name + ' ' + def.name + ': Endwert ' + x.k0.buchEnde.toFixed(2) + ', Abstand ' + x.k0.abstandPa.toFixed(2) + ', Median ' + x.startphasen.median.toFixed(2) +
        ', vorn ' + x.startphasen.vorDemMarkt + ', Rundlauf ' + x.k0.kostenJeRundlaufPp.toFixed(3) + ' Pp (' + ((Date.now() - t1) / 1000).toFixed(1) + ' s)');
    });
    if (sz.alt) {
      /* Pflicht: bitgleich auf den gesiegelten Stand, sonst Abbruch */
      var b = { bestanden: true, laeufe: {} };
      KS.LAEUFE.forEach(function (def) {
        var n = E.ergebnisse[sz.name][def.name], a = siegel.laeufe[def.name].mit, gleich = 0;
        n.startphasen.abstaende.forEach(function (x, i) { if (x === a.startphasen.abstaende[i]) gleich++; });
        var ok = n.k0.buchEnde === a.k0.buchEnde && n.k0.spyEnde === a.k0.spyEnde && gleich === 63 && n.startphasen.median === a.startphasen.median &&
          Math.abs(n.k0.kostenGezahlt - a.k0.kostenGezahlt) < 1e-6;
        b.laeufe[def.name] = { buchEnde: n.k0.buchEnde, siegelBuchEnde: a.k0.buchEnde, abstaende63Bitgleich: gleich, median: n.startphasen.median, siegelMedian: a.startphasen.median,
          kosten: n.k0.kostenGezahlt, siegelKosten: a.k0.kostenGezahlt, bestanden: ok };
        if (!ok) b.bestanden = false;
      });
      E.bitgleich = b;
      fs.writeFileSync(datei, JSON.stringify(E, null, 1));
      console.log('Bitgleich auf den Siegelstand: ' + (b.bestanden ? 'JA' : 'NEIN'), JSON.stringify(b.laeufe));
      if (!b.bestanden) throw new Error('KLINKE: Kopie mit 20 Bp trifft den gesiegelten Stand nicht auf das Bit - kein Umschalten');
    }
    E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
    fs.writeFileSync(datei, JSON.stringify(E, null, 1));
  });
  E.vollstaendig = true;
  E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
  fs.writeFileSync(datei, JSON.stringify(E, null, 1));
  console.log('fertig, Laufzeit s', E.laufzeitSekunden);
}

module.exports = { SZENARIEN: SZENARIEN, kostenFn: kostenFn, fuehreAusK: fuehreAusK, fuehreHuelleK: fuehreHuelleK, kontext: kontext };
if (require.main === module) lauf();
