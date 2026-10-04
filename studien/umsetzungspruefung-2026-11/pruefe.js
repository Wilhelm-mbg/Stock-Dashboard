'use strict';
/* Umsetzungspruefung des Momentum-Buchs (Auftrag Nr. 97) - Kriterien: KRITERIEN.md (gesiegelt).
 *
 *   node studien/umsetzungspruefung-2026-11/pruefe.js [<depot.json oder Store-Ordner>] [--aus <datei.json>]
 *
 * Vorgabe Store: %APPDATA%\markt-dashboard\store\depot.json - NUR LESEND in den Speicher geladen
 * (fs.readFileSync); dort wird nie geschrieben, nichts gesperrt, nichts angelegt. Archiv auf E: nur lesen.
 * Kein Abruf bei irgendeiner Quelle. Ergebnis: Tabelle je Umschichtung auf stdout, JSON nach
 * ~/Downloads/Markt-Dashboard-Daten/umsetzungspruefung/<datum>.json.
 *
 * Aufbau: pruefe(d, q) ist rein - alle Daten kommen ueber das Quellen-Objekt q (test.js setzt Kunstdaten ein):
 *   q.universum            [sym]                         (UNIVERSUM aus mittelfrist.js)
 *   q.archivTag(sym)       [[t, schluss, umsatz, ...]]   (archiv1d) oder null
 *   q.eroeffnung(sym, tag) Zahl (erste Minute ab 09:30 NY, Feld eroeffnung) oder null
 *   q.handelstage()        ['JJJJ-MM-TT', ...] aufsteigend (SPY-Sitzungen)
 *   q.massnahmen(sym)      [Satz] oder null (keine Datei)
 */
const fs = require('fs'), path = require('path');
const MH = require('../../mfhandel.js');

const BESTANDEN = 'bestanden', VERFEHLT = 'verfehlt', NP = 'nicht prüfbar';
const SCHWELLE = { p1Namen: 2, p1Oben: 5, p2Median: 10, p2Max: 50, p3Tol: 0.5, p3Soll: 20, hochPp: 1, p4Pct: 1,
  p6Anteil: 0.05, p6Leer: 1, p7Pp: 0.05, halten: 63, ab: [9, 35], bis: [16, 0], reihenendeTage: 5, umschJahr: 4 };
const SPLIT_ARTEN = ['forward_splits', 'reverse_splits', 'unit_splits'];
const ANDERE_ARTEN = ['cash_mergers', 'stock_mergers', 'stock_and_cash_mergers', 'name_changes', 'spin_offs',
  'worthless_removals', 'redemptions', 'stock_dividends', 'rights_distributions'];

/** Urteil aus Faellen: verfehlt schlaegt alles, dann nicht pruefbar, sonst bestanden (nie bestanden ohne Fall). */
function urteil(verfehlt, fehlt, faelle) {
  if (verfehlt) return VERFEHLT;
  if (fehlt || !faelle) return NP;
  return BESTANDEN;
}
function median(xs) { const s = xs.slice().sort((a, b) => a - b); const n = s.length; return n ? (n % 2 ? s[n >> 1] : (s[n / 2 - 1] + s[n / 2]) / 2) : null; }
function r2(x) { return x == null || !isFinite(x) ? null : Math.round(x * 100) / 100; }
function utcTag(ms) { return new Date(ms).toISOString().slice(0, 10); }

/** Splitfaktor eines Satzes (neue Stuecke je alte). */
function splitFaktor(s) { return s.new_rate > 0 && s.old_rate > 0 ? s.new_rate / s.old_rate : null; }

/** Replay der Trades: Umschichtungen (je NY-Tag) und Halte-Intervalle. */
function zerlege(buch) {
  const trades = (buch.trades || []).filter(t => t && t.t > 0);
  const gruppen = [], iv = [], offen = {};
  trades.forEach(function (t, idx) {
    const tag = MH.nyTag(t.t);
    if (t.art === 'kauf' || t.art === 'verkauf') {
      let g = gruppen.length ? gruppen[gruppen.length - 1] : null;
      if (!g || g.tag !== tag) { g = { tag: tag, trades: [], vorher: Object.keys(offen).map(s => Object.assign({}, offen[s])) }; gruppen.push(g); }
      g.trades.push(Object.assign({ idx: idx }, t));
    }
    if (t.art === 'kauf') { offen[t.sym] = { sym: t.sym, stueck: t.stueck, kurs: t.kurs, kaufT: t.t, kaufTag: tag, endeTag: null, endeT: null }; iv.push(offen[t.sym]); }
    else if ((t.art === 'verkauf' || t.art === 'reihenende') && offen[t.sym]) {
      offen[t.sym].endeTag = tag; offen[t.sym].endeT = t.t; offen[t.sym].endeArt = t.art; offen[t.sym].endePnl = t.pnl;
      offen[t.sym].endeKurs = t.kurs; offen[t.sym].endeStueck = t.stueck; delete offen[t.sym];
    }
  });
  gruppen.forEach(function (g) {
    const bestand = {}; g.vorher.forEach(p => { bestand[p.sym] = p; });
    g.trades.forEach(t => { if (t.art === 'verkauf') delete bestand[t.sym]; else bestand[t.sym] = { sym: t.sym, stueck: t.stueck, kurs: t.kurs, kaufT: t.t }; });
    g.nachher = Object.keys(bestand).map(s => bestand[s]);
    g.kaufReihe = g.trades.filter(t => t.art === 'kauf').map(t => t.sym);
    g.t0 = g.trades[0].t;
  });
  return { gruppen: gruppen, intervalle: iv, gekappt: (buch.trades || []).length >= 400 };
}

/** Splitfaktor eines Werts zwischen zwei Tagen (ex_date > von und <= bis), aus der Quelle. */
function faktorZwischen(saetze, vonTag, bisTag) {
  let f = 1;
  (saetze || []).forEach(s => { if (SPLIT_ARTEN.indexOf(s._art) >= 0 && s.ex_date > vonTag && s.ex_date <= bisTag && splitFaktor(s)) f *= splitFaktor(s); });
  return f;
}

function pruefeP1(g, q, ht) {
  const r = { zahl: null, schwelle: '≤ ' + SCHWELLE.p1Namen + ' Namen; obere ' + SCHWELLE.p1Oben + ' in Kaufreihenfolge', urteil: NP };
  const i = ht.indexOf(g.tag);
  const stichtag = i > 0 ? ht[i - 1] : ht.filter(x => x < g.tag).pop();
  r.stichtag = stichtag || null;
  if (!stichtag) { r.grund = 'kein Handelstag vor dem Ausführungstag im Kalender'; return r; }
  const grenze = MH.nyZeit(MH.tagPlus(stichtag, 1), 0, 0), roh = {}, fehlen = [];
  let stichT = null, archivBis = null;
  q.universum.forEach(function (s) {
    const ser = q.archivTag(s);
    if (!ser || !ser.length) { fehlen.push(s); return; }
    const zeilen = ser.filter(b => b[0] < grenze).map(b => [b[0], b[1], b[2]]);
    if (!zeilen.length) { fehlen.push(s); return; }
    roh[s] = zeilen.slice(-300);
    const lt = zeilen[zeilen.length - 1][0];
    if (MH.nyTag(lt) === stichtag && (stichT == null || lt > stichT)) stichT = lt;
    if (archivBis == null || ser[ser.length - 1][0] > archivBis) archivBis = ser[ser.length - 1][0];
  });
  if (stichT == null) { r.grund = 'Archiv reicht nicht bis zum Stichtag ' + stichtag; return r; }
  const z = MH.momentumZiel(roh, { nowMs: stichT });
  if (z.zuWenig) { r.grund = 'Neuberechnung: zu wenig zulässige Werte (' + z.korb.zulaessig + ')'; return r; }
  const buchZiel = g.nachher.map(p => p.sym);
  const neu = z.ziel, inNeu = {}; neu.forEach(s => { inNeu[s] = true; });
  const nurBuch = buchZiel.filter(s => !inNeu[s]), nurNeu = neu.filter(s => buchZiel.indexOf(s) < 0);
  const ohneArchiv = nurBuch.filter(s => fehlen.indexOf(s) >= 0);
  const verschieden = Math.max(nurBuch.length, nurNeu.length);
  const oben = neu.slice(0, SCHWELLE.p1Oben).filter(s => g.kaufReihe.indexOf(s) >= 0);
  const kaufOrdnung = g.kaufReihe.filter(s => oben.indexOf(s) >= 0);
  const reihenfolgeOk = oben.join() === kaufOrdnung.join();
  r.zahl = verschieden; r.zielzahlBuch = buchZiel.length; r.zielzahlNeu = neu.length; r.zulaessigNeu = z.korb.zulaessig;
  r.nurBuch = nurBuch; r.nurNeu = nurNeu; r.ohneArchiv = ohneArchiv; r.fehlenImArchiv = fehlen;
  r.obenNeu = neu.slice(0, SCHWELLE.p1Oben); r.obenGekauftReihe = kaufOrdnung; r.reihenfolgeOk = reihenfolgeOk;
  r.zielNeu = neu;
  const verfehlt = !reihenfolgeOk || (verschieden - ohneArchiv.length) > SCHWELLE.p1Namen;
  r.urteil = urteil(verfehlt, ohneArchiv.length > 0 && verschieden > SCHWELLE.p1Namen, 1);
  return r;
}

function pruefeP2(g, q) {
  const faelle = [];
  let fehlt = 0;
  g.trades.forEach(function (t) {
    const o = q.eroeffnung(t.sym, g.tag);
    if (!(o > 0)) { fehlt++; faelle.push({ sym: t.sym, art: t.art, kurs: t.kurs, eroeffnung: null }); return; }
    let ref = o, splitVerdacht = null;
    const saetze = q.massnahmen(t.sym) || [];
    saetze.forEach(function (s) {
      const f = SPLIT_ARTEN.indexOf(s._art) >= 0 ? splitFaktor(s) : null;
      if (!f || s.ex_date === g.tag) return;
      [f, 1 / f].forEach(function (ff) { if (Math.abs(t.kurs / (o * ff) - 1) < 0.01 && Math.abs(t.kurs / o - 1) >= 0.01) { ref = o * ff; splitVerdacht = s.ex_date; } });
    });
    const abw = (t.kurs / ref - 1) * 10000;
    faelle.push({ sym: t.sym, art: t.art, kurs: t.kurs, eroeffnung: ref, bp: r2(Math.abs(abw)),
      nachteilBp: r2(t.art === 'kauf' ? abw : -abw), splitVerdacht: splitVerdacht, wert: t.stueck * t.kurs });
  });
  const bp = faelle.filter(f => f.bp != null).map(f => f.bp);
  const med = median(bp), max = bp.length ? Math.max.apply(null, bp) : null;
  /* Ein Fall ueber 50 Bp ist nachgewiesen; der Median nur, wenn kein Fall fehlt. */
  const verfehlt = bp.length > 0 && (max > SCHWELLE.p2Max || (fehlt === 0 && med > SCHWELLE.p2Median));
  return { zahl: { medianBp: r2(med), maxBp: r2(max), faelle: faelle.length, ohneKurs: fehlt },
    schwelle: 'Median ≤ ' + SCHWELLE.p2Median + ' Bp, Max ≤ ' + SCHWELLE.p2Max + ' Bp',
    urteil: urteil(verfehlt, fehlt > 0, faelle.length), faelle: faelle };
}

function pruefeP3(g, d, q, zer) {
  const buch = d.mfBuch, faelle = [];
  let fehlt = 0;
  const splitsStore = (buch.massnahmen || []).filter(m => m.art === 'split');
  g.trades.forEach(function (t) {
    if (t.art === 'kauf') {
      const pos = (buch.positionen || []).find(p => p.sym === t.sym && p.seit === t.t);
      const sp = splitsStore.filter(m => m.sym === t.sym && m.t > t.t).sort((a, b) => a.t - b.t)[0];
      const einstand = sp ? sp.einstandAlt : (pos ? pos.einstand : null);
      if (einstand > 0) faelle.push({ sym: t.sym, art: 'kauf', bp: r2((einstand / t.kurs - 1) * 10000) });
      else {
        const iv = zer.intervalle.find(x => x.sym === t.sym && x.kaufT === t.t);
        if (iv && iv.endeArt === 'verkauf') faelle.push({ sym: t.sym, art: 'kauf', bp: null, hinweis: 'im Verkauf enthalten' });
        else { fehlt++; faelle.push({ sym: t.sym, art: 'kauf', bp: null }); }
      }
    } else {
      const iv = zer.intervalle.find(x => x.sym === t.sym && x.endeT === t.t);
      if (!iv) { fehlt++; faelle.push({ sym: t.sym, art: 'verkauf', bp: null, grund: 'Kauf nicht in den Trades' }); return; }
      const f = faktorZwischen(q.massnahmen(t.sym), iv.kaufTag, g.tag);
      const einstand = iv.kurs * (1 + SCHWELLE.p3Soll / 10000) / f;   // Annahme: Kauf mit 20 Bp gebucht
      const k = 1 - (t.pnl + t.stueck * einstand) / (t.stueck * t.kurs);
      faelle.push({ sym: t.sym, art: 'verkauf', bp: r2(k * 10000), annahme: 'Einstand = Kaufkurs × 1,002' });
    }
  });
  const bp = faelle.filter(f => f.bp != null);
  const verfehlt = bp.some(f => Math.abs(f.bp - SCHWELLE.p3Soll) > SCHWELLE.p3Tol);
  const dev = bp.map(f => Math.abs(f.bp - SCHWELLE.p3Soll));
  return { zahl: { faelle: bp.length, maxAbwBp: dev.length ? r2(Math.max.apply(null, dev)) : null, ohneWert: fehlt },
    schwelle: SCHWELLE.p3Soll + ' ± ' + SCHWELLE.p3Tol + ' Bp je Seite', urteil: urteil(verfehlt, fehlt > 0, bp.length), faelle: faelle };
}

/** Bargeld nach jeder Umschichtung, rueckwaerts aus dem heutigen Bargeld (Fluesse: Trades, Ausschuettungen). */
function bargeldNach(d, zer) {
  const buch = d.mfBuch, gr = zer.gruppen, aus = new Array(gr.length);
  let c = buch.cash;
  const fluss = [];
  (buch.trades || []).forEach(t => {
    if (t.art === 'kauf') fluss.push({ t: t.t, b: -t.stueck * t.kurs * 1.002 });
    else if (t.art === 'verkauf') fluss.push({ t: t.t, b: t.stueck * t.kurs * 0.998 });
    else if (t.art === 'reihenende') fluss.push({ t: t.t, b: t.stueck * t.kurs });
  });
  (buch.massnahmen || []).forEach(m => { if (m.art === 'div' && isFinite(m.summe)) fluss.push({ t: m.am || m.t, b: m.summe }); });
  for (let k = gr.length - 1; k >= 0; k--) {
    const ende = MH.nyZeit(MH.tagPlus(gr[k].tag, 1), 0, 0);
    let x = c;
    fluss.forEach(f => { if (f.t >= ende) x -= f.b; });
    aus[k] = x;
  }
  return aus;
}

function pruefeP6(g, q, p1, cashNach, d) {
  const r = { schwelle: '0 Positionen < 5 % des Platzwerts, ≤ ' + SCHWELLE.p6Leer + ' leerer Platz', urteil: NP };
  const kv = ((d.mfBuch.korbVerlauf) || []).find(x => MH.nyTag(x.t) === g.tag);
  const zielzahl = kv ? kv.ziel : (p1 && p1.zielzahlNeu) || null;
  r.zielzahlQuelle = kv ? 'korbVerlauf' : (zielzahl ? 'Neuberechnung P1' : null);
  if (!zielzahl) { r.grund = 'Zielzahl unbekannt'; return r; }
  const kursD = {}; let fehlt = 0;
  g.trades.forEach(t => { kursD[t.sym] = t.kurs; });
  function kurs(s) { if (kursD[s] > 0) return kursD[s]; const o = q.eroeffnung(s, g.tag); if (o > 0) kursD[s] = o; return o > 0 ? o : null; }
  let kosten = 0;
  g.trades.forEach(t => { kosten += t.stueck * t.kurs * 0.002; });
  let posWert = 0;
  const werte = g.nachher.map(p => { const k = kurs(p.sym); if (!k) fehlt++; const w = k ? p.stueck * k : null; if (w) posWert += w; return { sym: p.sym, wert: w }; });
  const depot = posWert + cashNach + kosten;   // Depotwert vor der Umschichtung (Kosten zurueck)
  const platz = depot / zielzahl;
  const klein = werte.filter(w => w.wert != null && w.wert < SCHWELLE.p6Anteil * platz).map(w => w.sym);
  const leer = Math.max(0, zielzahl - g.nachher.length);
  r.zahl = { kleinst: klein.length, leer: leer, zielzahl: zielzahl, positionen: g.nachher.length, platzwert: r2(platz),
    kleinsteProzent: werte.length ? r2(Math.min.apply(null, werte.filter(w => w.wert != null).map(w => w.wert)) / platz * 100) : null };
  r.kleinst = klein;
  r.urteil = urteil(klein.length > 0 || leer > SCHWELLE.p6Leer, fehlt > 0, 1);
  return r;
}

function pruefeP4P5(g, gNext, d, q, zer, ht, pruefEnde) {
  const buch = d.mfBuch, bisTag = gNext ? gNext.tag : pruefEnde;
  const p4 = { faelle: [], ohneDatei: [], phantom: [] }, p5 = { faelle: [], ohneDatei: [] };
  const divStore = (buch.massnahmen || []).filter(m => m.art === 'div');
  const splitStore = (buch.massnahmen || []).filter(m => m.art === 'split');
  const reihenende = (buch.trades || []).filter(t => t.art === 'reihenende');
  const relevant = zer.intervalle.filter(iv => iv.kaufTag <= g.tag && (!iv.endeTag || iv.endeTag >= g.tag));
  const quellDiv = {};
  relevant.forEach(function (iv) {
    const saetze = q.massnahmen(iv.sym);
    const von = iv.kaufTag > g.tag ? iv.kaufTag : g.tag;
    const ende = iv.endeTag && iv.endeTag < bisTag ? iv.endeTag : bisTag;
    if (!saetze) { p4.ohneDatei.push(iv.sym); p5.ohneDatei.push(iv.sym); }
    (saetze || []).forEach(function (s) {
      const ex = s.ex_date;
      if (!ex) return;
      if (s._art === 'cash_dividends' && s.rate > 0 && ex > iv.kaufTag && ex > von && ex <= ende && (!iv.endeTag || iv.endeTag >= ex)) {
        if (gNext && ex >= gNext.tag && iv.endeTag !== gNext.tag) return;
        const stueck = iv.stueck * faktorZwischen(saetze, iv.kaufTag, ex);
        const soll = stueck * s.rate;
        const b = divStore.find(m => m.sym === iv.sym && utcTag(m.t) === ex);
        quellDiv[iv.sym + ':' + ex] = true;
        p4.faelle.push({ sym: iv.sym, ex: ex, rate: s.rate, soll: r2(soll), gebucht: b ? r2(b.summe) : null,
          abwPct: b ? r2((b.summe / soll - 1) * 100) : null });
      } else if (SPLIT_ARTEN.indexOf(s._art) >= 0 && ex > iv.kaufTag && ex > von && ex <= ende) {
        const b = splitStore.find(m => m.sym === iv.sym && utcTag(m.t) === ex);
        p5.faelle.push({ sym: iv.sym, art: s._art, ex: ex, gebucht: !!b });
      } else if (ANDERE_ARTEN.indexOf(s._art) >= 0 && ex > iv.kaufTag && ex > von && ex <= ende) {
        const b = reihenende.find(t => t.sym === iv.sym && MH.nyTag(t.t) >= ex);
        p5.faelle.push({ sym: iv.sym, art: s._art, ex: ex, gebucht: !!b || (iv.endeArt === 'reihenende') });
      }
    });
    /* (c) Reihenende im Archiv: noch gehalten, Archivreihe endet >= 5 Handelstage vor dem juengsten Archivtag */
    if (!iv.endeTag && !gNext) {
      const ser = q.archivTag(iv.sym);
      if (ser && ser.length) {
        const letzt = MH.nyTag(ser[ser.length - 1][0]);
        const archivEnde = q.archivEnde || pruefEnde;
        const tage = ht.filter(x => x > letzt && x <= archivEnde).length;
        if (tage >= SCHWELLE.reihenendeTage) p5.faelle.push({ sym: iv.sym, art: 'reihenende-archiv', ex: letzt, gebucht: false });
      }
    }
  });
  divStore.forEach(function (m) {
    const ex = utcTag(m.t);
    if (ex <= g.tag || (gNext && ex > gNext.tag) || ex > bisTag) return;
    if (!quellDiv[m.sym + ':' + ex] && p4.ohneDatei.indexOf(m.sym) < 0) p4.phantom.push({ sym: m.sym, ex: ex, summe: r2(m.summe) });
  });
  const ungeb = p4.faelle.filter(f => f.gebucht == null).length;
  const betragFalsch = p4.faelle.filter(f => f.abwPct != null && Math.abs(f.abwPct) > SCHWELLE.p4Pct).length;
  const r4 = { zahl: { faelle: p4.faelle.length, gebucht: p4.faelle.length - ungeb, ungebucht: ungeb, betragFalsch: betragFalsch,
    ohneSatz: p4.phantom.length, ohneDatei: p4.ohneDatei.length, bis: bisTag },
    schwelle: '0 ungebucht, 0 ohne Satz, Betrag ≤ ' + SCHWELLE.p4Pct + ' %',
    urteil: urteil(ungeb > 0 || betragFalsch > 0 || p4.phantom.length > 0, p4.ohneDatei.length > 0, relevant.length), faelle: p4.faelle, ohneSatz: p4.phantom, ohneDatei: p4.ohneDatei };
  const ung5 = p5.faelle.filter(f => !f.gebucht).length;
  const r5 = { zahl: { faelle: p5.faelle.length, ungebucht: ung5, ohneDatei: p5.ohneDatei.length, bis: bisTag }, schwelle: '0 ungebucht',
    urteil: urteil(ung5 > 0, p5.ohneDatei.length > 0, relevant.length), faelle: p5.faelle, ohneDatei: p5.ohneDatei };
  return { p4: r4, p5: r5 };
}

/* Nachtrag 04.10.2026 (PM, KRITERIEN.md P7): (b) Anfangsstand nur an der ersten Umschichtung des Buchs - nur dort setzt die
 * Marktlinie an (massstab.js); ab der zweiten entfaellt (b), (a) gilt weiter. erste = false auch bei gekappten Trades. */
function pruefeP7(g, gNext, d, q, erste) {
  const v = (d.mfVerlauf || []).filter(p => p.t >= g.t0 && (!gNext || p.t < gNext.t0));
  const ohne = v.filter(p => !(p.buchT > 0) || !(p.spyT > 0)).length;
  const falsch = v.filter(p => p.buchT > 0 && p.spyT > 0 && p.buchT !== p.spyT).length;
  const a = v.find(p => p.spy > 0);
  const o = erste ? q.eroeffnung('SPY', g.tag) : null;
  const pp = erste && a && o > 0 ? Math.abs(a.spy / o - 1) * 100 : null;
  return { zahl: { punkte: v.length, ohneStempel: ohne, buchTungleichSpyT: falsch, anfangPp: pp == null ? null : Math.round(pp * 1000) / 1000,
    spyAnker: a ? a.spy : null, spyEroeffnung: o || null, anfang: erste ? 'geprueft' : 'entfaellt (nicht die erste Umschichtung)' },
    schwelle: '0 Punkte buchT ≠ spyT; Anfangsstand ≤ ' + SCHWELLE.p7Pp + ' Pp (nur erste Umschichtung)',
    urteil: urteil(falsch > 0 || (pp != null && pp > SCHWELLE.p7Pp), ohne > 0 || (erste && pp == null) || !v.length, v.length) };
}

function pruefeZeitpunkt(g, gVor, ht) {
  const ab = MH.nyZeit(g.tag, SCHWELLE.ab[0], SCHWELLE.ab[1]), bis = MH.nyZeit(g.tag, SCHWELLE.bis[0], SCHWELLE.bis[1]);
  const ausserhalb = g.trades.filter(t => t.t < ab || t.t > bis).map(t => MH.nyUhr(t.t) + ' ' + t.sym);
  let soll = null, verspaetung = null;
  if (gVor) {
    const i = ht.indexOf(gVor.tag);
    soll = i >= 0 && ht[i + SCHWELLE.halten] ? ht[i + SCHWELLE.halten] : null;
    const j = ht.indexOf(g.tag);
    if (soll && j >= 0) verspaetung = j - (i + SCHWELLE.halten);   // negativ = zu frueh
    else soll = null;
  }
  const uhr = g.trades.map(t => MH.nyUhr(t.t));
  return { zahl: { sollTag: soll, verspaetungHandelstage: verspaetung, ausserhalbFenster: ausserhalb.length, uhrVon: uhr[0], uhrBis: uhr[uhr.length - 1] },
    schwelle: 'Verspätung 0; 0 Orders außerhalb 09:35–16:00 NY', ausserhalb: ausserhalb,
    urteil: urteil(ausserhalb.length > 0 || (verspaetung != null && verspaetung !== 0), soll == null, 1) };
}

function hochrechnung(g, p2, p3, cashNach) {
  const wert = g.trades.reduce((s, t) => s + t.stueck * t.kurs, 0);
  let fehlt = false, summe = 0;
  g.trades.forEach(function (t, i) {
    const a = p2.faelle[i], c = p3.faelle[i];
    if (!a || a.nachteilBp == null) { fehlt = true; return; }
    const kostenBp = c && c.bp != null ? c.bp - SCHWELLE.p3Soll : 0;
    summe += t.stueck * t.kurs * (a.nachteilBp + kostenBp) / 10000;
  });
  const posNach = g.nachher.reduce((s, p) => s + p.stueck * p.kurs, 0);
  const depot = posNach + cashNach + wert * 0.002;   // grob: Depotwert vor der Umschichtung
  const pp = depot > 0 ? summe / depot * SCHWELLE.umschJahr * 100 : null;
  return { zahl: pp == null ? null : Math.round(pp * 1000) / 1000, umsatz: depot > 0 ? r2(wert / depot) : null,
    schwelle: '≤ ' + SCHWELLE.hochPp + ' Pp p. a.', urteil: urteil(pp != null && pp > SCHWELLE.hochPp, fehlt || pp == null, 1) };
}

/** U-Regel ueber alle Umschichtungen. */
function uRegel(liste) {
  const gruende = [];
  liste.forEach(function (u, k) {
    if (u.P5.urteil === VERFEHLT) gruende.push(u.tag + ': P5 verfehlt');
    if (u.hochrechnung.urteil === VERFEHLT) gruende.push(u.tag + ': Hochrechnung P2+P3 > 1 Pp p. a.');
    if (k > 0) {
      const v = liste[k - 1];
      const a = u.P1.urteil === VERFEHLT || u.P2.urteil === VERFEHLT, b = v.P1.urteil === VERFEHLT || v.P2.urteil === VERFEHLT;
      if (a && b) gruende.push(v.tag + ' und ' + u.tag + ': P1/P2 zweimal hintereinander verfehlt');
      if (u.zeitpunkt.urteil === VERFEHLT && v.zeitpunkt.urteil === VERFEHLT) gruende.push(v.tag + ' und ' + u.tag + ': Zeitpunkt zweimal verfehlt');
    }
  });
  return { halt: gruende.length > 0, gruende: gruende };
}

function pruefe(d, q, opts) {
  opts = opts || {};
  if (!d || !d.mfBuch) return { fehler: 'kein mfBuch im Store', umschichtungen: [], uRegel: { halt: false, gruende: [] } };
  const zer = zerlege(d.mfBuch), ht = q.handelstage();
  const v = d.mfVerlauf || [];
  const pruefEnde = opts.pruefEnde || (v.length ? (v[v.length - 1].tag || MH.nyTag(v[v.length - 1].t)) : MH.nyTag(Date.now()));
  const cash = bargeldNach(d, zer);
  const liste = zer.gruppen.map(function (g, k) {
    const gNext = zer.gruppen[k + 1] || null, gVor = zer.gruppen[k - 1] || null;
    const P1 = pruefeP1(g, q, ht);
    if (zer.gekappt && k === 0) { P1.urteil = P1.urteil === VERFEHLT ? VERFEHLT : NP; P1.grund = 'Trades gekappt (400): Bestand vor der Umschichtung unbekannt'; }
    const P2 = pruefeP2(g, q), P3 = pruefeP3(g, d, q, zer);
    const p45 = pruefeP4P5(g, gNext, d, q, zer, ht, pruefEnde);
    const P6 = pruefeP6(g, q, P1, cash[k], d), P7 = pruefeP7(g, gNext, d, q, k === 0 && !zer.gekappt);
    const zeitpunkt = pruefeZeitpunkt(g, gVor, ht);
    return { tag: g.tag, stichtag: P1.stichtag, orders: g.trades.length, P1: P1, P2: P2, P3: P3, P4: p45.p4, P5: p45.p5,
      P6: P6, P7: P7, zeitpunkt: zeitpunkt, hochrechnung: hochrechnung(g, P2, P3, cash[k]) };
  });
  return { kennung: 'umsetzungspruefung-2026-11/v1', pruefEnde: pruefEnde, umschichtungen: liste, uRegel: uRegel(liste) };
}

/* ---------------- Dateiquellen (nur lesen) ---------------- */
const ARCHIV = 'E:/Markt-Dashboard-Archiv/';
function lies(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function universumAusCode() {
  const src = fs.readFileSync(path.join(__dirname, '../../mittelfrist.js'), 'utf8');
  const m = /var UNIVERSUM = \(([\s\S]*?)\)\.split/.exec(src);
  if (!m) throw new Error('UNIVERSUM in mittelfrist.js nicht gefunden');
  return (m[1].match(/'([^']*)'/g) || []).map(s => s.slice(1, -1)).join('').split(/\s+/).filter(Boolean);
}
function dateiQuellen(archiv) {
  archiv = archiv || ARCHIV;
  const cTag = {}, cMin = {}, cMass = {};
  function archivTag(sym) {
    if (!(sym in cTag)) { const j = lies(archiv + 'archiv1d/bars_1d_' + sym + '.json'); cTag[sym] = j && j.series ? j.series : null; }
    return cTag[sym];
  }
  function minutenJahr(sym, jahr) {
    const k = sym + '/' + jahr;
    if (!(k in cMin)) { const j = lies(archiv + 'alpaca1m/' + sym + '/' + jahr + '.json'); cMin[k] = j || null; }
    return cMin[k];
  }
  function eroeffnung(sym, tag) {
    const j = minutenJahr(sym, tag.slice(0, 4));
    if (!j || !j.series) return null;
    const von = MH.nyZeit(tag, 9, 30), bis = MH.nyZeit(tag, 16, 0);
    let best = null;
    for (let i = 0; i < j.series.length; i++) { const b = j.series[i]; if (b[0] >= von && b[0] < bis && (!best || b[0] < best[0])) best = b; }
    return best ? best[5] : null;
  }
  function massnahmen(sym) {
    if (!(sym in cMass)) {
      const a = lies(archiv + 'alpaca-massnahmen/' + sym + '.json');
      let saetze = a ? (a.saetze || []).slice() : null;
      fs.readdirSync(archiv).filter(n => /^alpaca-massnahmen-nachtrag/.test(n)).forEach(function (n) {
        const b = lies(archiv + n + '/' + sym + '.json');
        if (b && b.saetze) { saetze = saetze || []; b.saetze.forEach(s => { if (!saetze.some(x => x.id === s.id)) saetze.push(s); }); }
      });
      cMass[sym] = saetze;
    }
    return cMass[sym];
  }
  let ht = null;
  function handelstage() {
    if (ht) return ht;
    const tage = {};
    fs.readdirSync(archiv + 'alpaca1m/SPY').filter(n => /^\d{4}\.json$/.test(n)).forEach(function (n) {
      const j = lies(archiv + 'alpaca1m/SPY/' + n);
      ((j && j.sitzungen) || []).forEach(s => { if (s.sitzung === 'regulaer') tage[MH.nyTag(s.von)] = true; });
    });
    ht = Object.keys(tage).sort();
    return ht;
  }
  const q = { universum: universumAusCode(), archivTag: archivTag, eroeffnung: eroeffnung, massnahmen: massnahmen, handelstage: handelstage };
  return q;
}

/* ---------------- Ausgabe ---------------- */
function zeile(name, k) { return '  ' + (name + '          ').slice(0, 12) + (k.urteil + '              ').slice(0, 15) + JSON.stringify(k.zahl) + '  [' + k.schwelle + ']'; }
function tabelle(erg) {
  const out = [];
  erg.umschichtungen.forEach(function (u) {
    out.push('Umschichtung ' + u.tag + ' (Stichtag ' + u.stichtag + ', ' + u.orders + ' Orders)');
    ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].forEach(n => out.push(zeile(n, u[n])));
    out.push(zeile('Zeitpunkt', u.zeitpunkt));
    out.push(zeile('P2+P3 p.a.', u.hochrechnung));
  });
  out.push('U-Regel: ' + (erg.uRegel.halt ? 'HALT – ' + erg.uRegel.gruende.join('; ') : 'kein Halt'));
  return out.join('\n');
}

if (require.main === module) {
  const args = process.argv.slice(2);
  let ausDatei = null, storeArg = null;
  for (let i = 0; i < args.length; i++) { if (args[i] === '--aus') ausDatei = args[++i]; else storeArg = args[i]; }
  let p = storeArg || path.join(process.env.APPDATA || '', 'markt-dashboard', 'store');
  if (fs.existsSync(p) && fs.statSync(p).isDirectory()) p = path.join(p, 'depot.json');
  const roh = JSON.parse(fs.readFileSync(p, 'utf8'));   // nur lesen, in den Speicher
  const d = roh && roh.value !== undefined && !roh.mfBuch ? roh.value : roh;
  const q = dateiQuellen();
  const archivEnden = q.universum.map(s => { const x = q.archivTag(s); return x && x.length ? MH.nyTag(x[x.length - 1][0]) : null; }).filter(Boolean).sort();
  q.archivEnde = archivEnden[archivEnden.length - 1];
  const erg = pruefe(d, q);
  erg.store = p; erg.archivEnde = q.archivEnde; erg.lauf = new Date().toISOString();
  console.log(tabelle(erg));
  const heute = new Date(); const tag = heute.getFullYear() + '-' + String(heute.getMonth() + 1).padStart(2, '0') + '-' + String(heute.getDate()).padStart(2, '0');
  const ziel = ausDatei || path.join(process.env.USERPROFILE || '', 'Downloads', 'Markt-Dashboard-Daten', 'umsetzungspruefung', tag + '.json');
  fs.mkdirSync(path.dirname(ziel), { recursive: true });
  fs.writeFileSync(ziel, JSON.stringify(erg, null, 1));
  console.log('Ergebnis: ' + ziel);
}

module.exports = { pruefe: pruefe, zerlege: zerlege, uRegel: uRegel, tabelle: tabelle, SCHWELLE: SCHWELLE, BESTANDEN: BESTANDEN, VERFEHLT: VERFEHLT, NP: NP };
