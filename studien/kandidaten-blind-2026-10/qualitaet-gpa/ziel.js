'use strict';
/* Zielfunktion "Qualitaet: Gross Profits / Assets" (Novy-Marx 2013), Kennung qualitaet-gpa/v1.
 * Vor jeder Zahl festgelegt (REGEL.md). Reine Funktion, keine Kursdaten, kein Netz, nichts wird geschrieben.
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 *
 * Aufruf (gleiche Form wie MH.momentumZiel(rohMap, opts)):
 *   zielfunktion(roh, opts) -> { ziel, rangfolge, korb, zuWenig, uebersprungen, verworfen }
 *   placeboZiel(roh, opts)  -> dieselbe Form; gleiches Universum, gleiche Zielzahl, Auswahl zufaellig (fester Seed)
 *
 * roh: { KUERZEL: [[zeitMs, schlussBereinigt, umsatzStueck], ...] }   Zeilen aufsteigend; Umsatz = Kurs x Stueck.
 *   Zeilen NACH opts.nowMs werden ignoriert (kein Blick voraus). Reihen, deren letzte Zeile (bis nowMs) mehr als
 *   7 Kalendertage vor nowMs liegt, fliegen raus (wie momentumZiel).
 *
 * opts.nowMs        Stichtag in ms (Mitternacht UTC des Panel-Datums des Stichtags).
 * opts.fundamental  SEC-Bilanzdaten (EDGAR Financial Statement Data Sets), GENAU in dieser Form:
 *   { KUERZEL: [ { filed:      'JJJJ-MM-TT',          Einreichungsdatum der Meldung (Feld `filed`), nie das Periodenende
 *                  periodEnde: 'JJJJ-MM-TT',          Ende der Berichtsperiode (Feld `ddate` der Zahl)
 *                  form:       '10-K' | '10-Q',        andere Formulare (10-K/A, 10-Q/A, 8-K, 20-F ...) werden ignoriert
 *                  quartale:   1 | 2 | 3 | 4,          Dauer der Flussgroessen in Quartalen, GEZAEHLT VOM GESCHAEFTSJAHRESANFANG
 *                              (SEC `qtrs`): 10-K = 4 (ganzes Jahr); 10-Q = 1 (nur Q1), 2 (Halbjahr kumuliert), 3 (9 Monate kumuliert).
 *                              Ein 10-Q fuehrt neben der Zahl der laufenden Periode auch die Vorjahresvergleichszahl; beide sind
 *                              EIGENE Eintraege (eigenes periodEnde), mit dem filed-Datum DERSELBEN Meldung.
 *                  werte:      { TagName: Zahl, ... }  SEC-us-gaap-Tags exakt (KONFIG.TAGS); Fluesse = Zahl fuer `quartale`,
 *                              Assets = Bestand zum periodEnde (nur im Eintrag der laufenden Periode noetig) } , ... ] }
 *   opts.sic          { KUERZEL: Zahl|String } SIC-Code des Emittenten (EDGAR). Fehlt er: nicht zulaessig (Fail-closed).
 *   opts.placeboWort  nur placeboZiel: Wort fuer den Seed (Standard KONFIG.PLACEBO_WORT); fuer die nachrichtliche Placebo-Familie (REGEL.md C.9).
 *   Weitere (nur Tests): opts.minWerte, umsatzMin, umsatzFenster, maxAlterMs, karenzTage, maxTtmAlterTage, maxZiel.
 * Gleiche (periodEnde, quartale) mehrfach (Korrekturen, Wiedereinreichungen): die JUENGSTE Einreichung mit filed + Karenz <= nowMs
 *   gilt; bei gleichem filed die spaeter stehende. Eintraege, die erst nach nowMs - Karenz eingereicht wurden, existieren nicht.
 *
 * Rueckgabe: ziel = Kuerzel (hoechstens 30), rangfolge = alle rangierten [{sym, staerke (= GP/A), umsatz, gp, assets, ttmEnde, regel}],
 *   absteigend nach GP/A, Gleichstand Kuerzel aufsteigend; korb = { zulaessig (rangiert), geprueft (Eingabe), ohneUmsatz, unterSchwelle,
 *   umsatzMin, fenster, finanz, ohneSic, ohneBilanz, ohneBruttogewinn, veraltet, terzil, zielzahl }; zuWenig = true (und ziel leer),
 *   wenn weniger als KONFIG.MIN_WERTE rangierbar. verworfen = [{sym, grund}] mit Grund je Ausschluss.
 */
var path = require('path');
var Li = require(path.join(__dirname, '..', '..', '..', 'liquide.js'));

var KONFIG = {
  /* Kennzahl: Bruttogewinn / Bilanzsumme. Novy-Marx 2013, JFE 108(1), "The Other Side of Value": (REVT - COGS) / AT. [Q aus Belegdatei] */
  KENNZAHL: 'GP/A',
  /* SEC-Tags, EXAKT (us-gaap). Die Existenz der Tags ist aus dem Gedaechtnis [G] und wird beim ersten Lauf an den Daten geprueft;
   * die Abdeckung bei Grosswerten ist UNVERIFIZIERT. */
  TAGS: { bilanzsumme: 'Assets' },
  /* Rueckfallkette fuer den Bruttogewinn, VORAB und in dieser Reihenfolge. Die erste Regel, deren Tags in ALLEN beteiligten Eintraegen
   * (Jahr, laufendes Quartal, Vorjahresquartal) Zahlen sind, gilt fuer die ganze TTM-Bildung dieses Emittenten (nie gemischt). */
  GP_REGELN: [
    { gp: 'GrossProfit' },
    { erloes: 'Revenues', kosten: 'CostOfRevenue' },
    { erloes: 'Revenues', kosten: 'CostOfGoodsAndServicesSold' },
    { erloes: 'RevenueFromContractWithCustomerExcludingAssessedTax', kosten: 'CostOfRevenue' },
    { erloes: 'RevenueFromContractWithCustomerExcludingAssessedTax', kosten: 'CostOfGoodsAndServicesSold' },
    { erloes: 'SalesRevenueNet', kosten: 'CostOfRevenue' },
    { erloes: 'SalesRevenueNet', kosten: 'CostOfGoodsSold' }
  ],
  /* Finanzwerte (SIC 6000-6999) sind ausgeschlossen: Novy-Marx 2013 nimmt Finanzwerte aus (SIC 6xxx) [Q aus Belegdatei]; fuer sie ist der
   * Bruttogewinn nicht definiert. SIC-Quelle: EDGAR (aktueller Code, nicht punktgenau - in REGEL.md Teil C genannt). */
  FINANZ_SIC_VON: 6000, FINANZ_SIC_BIS: 6999,
  /* Karenz gegen Look-ahead: Eintrag gilt ab filed + KARENZ_TAGE Kalendertage (<= nowMs). Projektkonvention, NICHT aus der Literatur
   * (Novy-Marx: mindestens 6 Monate Verzug; UNVERIFIZIERT, ob 3 Tage genuegen - REGEL.md Teil C). */
  KARENZ_TAGE: 3,
  /* Hoechstalter des TTM-Endes gegen nowMs: 548 Tage = 18 Monate, abgeleitet aus Novy-Marx' jaehrlicher Bildung (Bilanz Jahr t-1 fuer
   * Juni t, bis zum naechsten Juni: bis rund 18 Monate alt) - abgeleitet, UNVERIFIZIERT. */
  MAX_TTM_ALTER_TAGE: 548,
  /* Zuordnung der Perioden: Vorjahres- und Jahresende duerfen um so viele Tage vom Sollmonat abweichen (52/53-Wochen-Jahre). */
  PERIODEN_TOLERANZ_TAGE: 10,
  /* Korbregel: liquide.js KORB (Median-Tagesumsatz >= 100 Mio $ ueber 20 Balken, mindestens 100 rangierbare Werte). */
  UMSATZ_MIN: Li.KORB.umsatzMin, UMSATZ_FENSTER: Li.KORB.fenster, MIN_WERTE: Li.KORB.mindestWerte,
  /* Mindestlaenge der Kursreihe: ein Umsatzfenster. */
  MIN_ZEILEN: Li.KORB.fenster,
  /* Veraltete Kursreihe: wie mfhandel.js momentumZiel. */
  MAX_ALTER_MS: 7 * 86400000,
  /* Oberes Terzil: Novy-Marx 2013 Tab. 7 (Large-Cap, 500 groesste Nicht-Finanzwerte, Terzile nach GP/A) [Q aus Belegdatei]. */
  TERZIL: 3,
  /* Obergrenze der Positionen: Rahmen des Auftrags. */
  MAX_ZIEL: 30,
  PLACEBO_WORT: 'qualitaet-gpa-placebo'
};

/* ---------- Datum ---------- */
function tagMs(s) {
  var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(s));
  if (!m) return NaN;
  var ms = Date.UTC(+m[1], +m[2] - 1, +m[3]);
  return new Date(ms).toISOString().slice(0, 10) === s ? ms : NaN;   /* 2021-02-30 ist kein Datum */
}
/** Datum um k Monate verschoben, Monatsende bleibt Monatsende (31.12. - 3 Monate = 30.09.). */
function schiebeMonate(ms, k) {
  var d = new Date(ms), y = d.getUTCFullYear(), m = d.getUTCMonth() + k, t = d.getUTCDate();
  var last = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  var istEnde = t === new Date(Date.UTC(y, d.getUTCMonth() + 1, 0)).getUTCDate();
  return Date.UTC(y, m, istEnde ? last : Math.min(t, last));
}
function zahl(x) { return typeof x === 'number' && isFinite(x); }

/* ---------- Bilanzdaten: Eintraege, die es zum Stichtag gibt ---------- */
function gueltigeEintraege(liste, nowMs, karenzTage) {
  var karenzMs = karenzTage * 86400000, map = {};
  (liste || []).forEach(function (e) {
    if (!e || (e.form !== '10-K' && e.form !== '10-Q')) return;
    if (e.quartale !== 1 && e.quartale !== 2 && e.quartale !== 3 && e.quartale !== 4) return;
    var f = tagMs(e.filed), p = tagMs(e.periodEnde);
    if (!isFinite(f) || !isFinite(p) || !e.werte) return;
    if (f + karenzMs > nowMs) return;                 /* kein Blick voraus: erst ab filed + Karenz sichtbar */
    var key = e.periodEnde + '|' + e.quartale, alt = map[key];
    if (!alt || f >= alt.f) map[key] = { f: f, p: p, q: e.quartale, w: e.werte, form: e.form };   /* juengste Einreichung, bei Gleichstand die spaetere */
  });
  return Object.keys(map).map(function (k) { return map[k]; });
}
function findeEintrag(eintraege, ms, quartale) {
  var best = null, bd = Infinity, tol = KONFIG.PERIODEN_TOLERANZ_TAGE * 86400000;
  eintraege.forEach(function (e) {
    if (e.q !== quartale) return;
    var d = Math.abs(e.p - ms);
    if (d <= tol && d < bd) { best = e; bd = d; }
  });
  return best;
}
/** Bruttogewinn eines Eintrags nach Regel r, sonst NaN. */
function gpNach(regel, e) {
  if (regel.gp) return zahl(e.w[regel.gp]) ? e.w[regel.gp] : NaN;
  if (!zahl(e.w[regel.erloes]) || !zahl(e.w[regel.kosten])) return NaN;
  return e.w[regel.erloes] - e.w[regel.kosten];
}
/** Die erste Regel der Rueckfallkette, die in allen Eintraegen rechnet; Rueckgabe {gp: Summe mit Vorzeichen, regel: Index+1} oder null. */
function gpSumme(teile) {
  for (var r = 0; r < KONFIG.GP_REGELN.length; r++) {
    var s = 0, ok = true;
    for (var j = 0; j < teile.length; j++) {
      var g = gpNach(KONFIG.GP_REGELN[r], teile[j].e);
      if (!isFinite(g)) { ok = false; break; }
      s += teile[j].vz * g;
    }
    if (ok) return { gp: s, regel: r + 1 };
  }
  return null;
}
/** Juengster rechenbarer 12-Monats-Bruttogewinn plus Bilanzsumme. Rueckgabe {gp, assets, ttmEnde, regel} oder {fehler}. */
function ttm(liste, nowMs, o) {
  var eintraege = gueltigeEintraege(liste, nowMs, o.karenzTage);
  if (!eintraege.length) return { fehler: 'ohneBilanz', grund: 'keine Bilanzdaten bis zum Stichtag (nach Karenz)' };
  var kand = eintraege.filter(function (e) { return zahl(e.w[KONFIG.TAGS.bilanzsumme]) ; })
    .sort(function (a, b) { return b.p - a.p || b.q - a.q; });
  if (!kand.length) return { fehler: 'ohneBilanz', grund: 'keine Bilanzsumme (Assets) bis zum Stichtag' };
  var maxMs = o.maxTtmAlterTage * 86400000, ohneGp = false, ohneAssets = false;
  for (var i = 0; i < kand.length; i++) {
    var e = kand[i], teile;
    if (nowMs - e.p > maxMs) continue;
    if (!(e.w[KONFIG.TAGS.bilanzsumme] > 0)) { ohneAssets = true; continue; }
    if (e.q === 4) teile = [{ e: e, vz: 1 }];
    else {
      var fy = findeEintrag(eintraege, schiebeMonate(e.p, -3 * e.q), 4);
      var vj = findeEintrag(eintraege, schiebeMonate(e.p, -12), e.q);
      if (!fy || !vj) { ohneGp = true; continue; }
      teile = [{ e: fy, vz: 1 }, { e: e, vz: 1 }, { e: vj, vz: -1 }];    /* TTM = Jahr + laufendes Kumulat - Vorjahreskumulat */
    }
    var s = gpSumme(teile);
    if (!s) { ohneGp = true; continue; }
    return { gp: s.gp, assets: e.w[KONFIG.TAGS.bilanzsumme], ttmEnde: e.p, regel: s.regel };
  }
  if (ohneGp) return { fehler: 'ohneBruttogewinn', grund: 'Bruttogewinn nicht rechenbar (Rueckfallkette erschoepft oder Jahres-/Vorjahreswert fehlt)' };
  if (ohneAssets) return { fehler: 'ohneBilanz', grund: 'Bilanzsumme nicht positiv' };
  return { fehler: 'veraltet', grund: 'juengste Bilanz aelter als ' + o.maxTtmAlterTage + ' Tage' };
}

/* ---------- Universum und Rangfolge ---------- */
function optionen(opts) {
  opts = opts || {};
  return {
    nowMs: opts.nowMs || Date.now(),
    minWerte: opts.minWerte || KONFIG.MIN_WERTE,
    umsatzMin: opts.umsatzMin == null ? KONFIG.UMSATZ_MIN : opts.umsatzMin,
    fenster: opts.umsatzFenster || KONFIG.UMSATZ_FENSTER,
    maxAlter: opts.maxAlterMs || KONFIG.MAX_ALTER_MS,
    karenzTage: opts.karenzTage == null ? KONFIG.KARENZ_TAGE : opts.karenzTage,
    maxTtmAlterTage: opts.maxTtmAlterTage || KONFIG.MAX_TTM_ALTER_TAGE,
    maxZiel: opts.maxZiel || KONFIG.MAX_ZIEL,
    fundamental: opts.fundamental || {}, sic: opts.sic || {}
  };
}
function vergleich(a, b) { return b.staerke - a.staerke || (a.sym < b.sym ? -1 : a.sym > b.sym ? 1 : 0); }

function bauePunkte(roh, opts) {
  var o = optionen(opts), punkte = [], uebersprungen = [], verworfen = [];
  var korb = { zulaessig: 0, geprueft: 0, ohneUmsatz: 0, unterSchwelle: 0, umsatzMin: o.umsatzMin, fenster: o.fenster,
    finanz: 0, ohneSic: 0, ohneBilanz: 0, ohneBruttogewinn: 0, veraltet: 0, terzil: 0, zielzahl: 0 };
  function raus(sym, grund) { uebersprungen.push(sym); verworfen.push({ sym: sym, grund: grund }); }
  Object.keys(roh).forEach(function (sym) {
    var rr = roh[sym];
    korb.geprueft++;
    /* Kein Blick voraus: nur Zeilen bis nowMs. */
    var n = rr ? rr.length : 0;
    while (n > 0 && !(rr[n - 1][0] <= o.nowMs)) n--;
    var r = n ? rr.slice(0, n) : [];
    if (r.length < KONFIG.MIN_ZEILEN) { raus(sym, 'zu kurze Kursreihe (' + r.length + ' von ' + KONFIG.MIN_ZEILEN + ' Tagen)'); return; }
    if (o.nowMs - r[r.length - 1][0] > o.maxAlter) { raus(sym, 'Kurse veraltet (' + Math.round((o.nowMs - r[r.length - 1][0]) / 86400000) + ' Tage alt)'); return; }
    var i = r.length - 1;
    if (!(r[i][1] > 0)) { raus(sym, 'Kurs nicht positiv'); return; }
    var z = Li.zulaessig(r, i, { umsatzMin: o.umsatzMin, fenster: o.fenster });
    if (!z.ok) {
      if (o.umsatzMin > 0 && !Li.hatUmsatz(r, i, o.fenster)) korb.ohneUmsatz++; else korb.unterSchwelle++;
      raus(sym, z.grund); return;
    }
    var sic = o.sic[sym];
    if (sic == null || sic === '' || !isFinite(+sic)) { korb.ohneSic++; raus(sym, 'SIC-Code unbekannt (Finanzwert nicht auszuschliessen)'); return; }
    if (+sic >= KONFIG.FINANZ_SIC_VON && +sic <= KONFIG.FINANZ_SIC_BIS) { korb.finanz++; raus(sym, 'Finanzwert (SIC ' + sic + '): Bruttogewinn nicht definiert'); return; }
    var t = ttm(o.fundamental[sym], o.nowMs, o);
    if (t.fehler) { korb[t.fehler]++; raus(sym, t.grund); return; }
    punkte.push({ sym: sym, staerke: t.gp / t.assets, umsatz: z.umsatz, gp: t.gp, assets: t.assets,
      ttmEnde: new Date(t.ttmEnde).toISOString().slice(0, 10), regel: t.regel });
  });
  korb.zulaessig = punkte.length;
  punkte.sort(vergleich);
  return { o: o, punkte: punkte, uebersprungen: uebersprungen, verworfen: verworfen, korb: korb };
}
function zielzahl(n, maxZiel) { return Math.min(maxZiel, Math.ceil(n / KONFIG.TERZIL)); }

function zielfunktion(roh, opts) {
  var b = bauePunkte(roh || {}, opts);
  if (b.punkte.length < b.o.minWerte) return { ziel: [], rangfolge: [], uebersprungen: b.uebersprungen, verworfen: b.verworfen, korb: b.korb, zuWenig: true };
  var nT = Math.ceil(b.punkte.length / KONFIG.TERZIL);            /* oberes Terzil */
  var n = zielzahl(b.punkte.length, b.o.maxZiel);                 /* davon hoechstens 30: die mit hoechster GP/A */
  b.korb.terzil = nT; b.korb.zielzahl = n;
  return { ziel: b.punkte.slice(0, n).map(function (p) { return p.sym; }), rangfolge: b.punkte,
    uebersprungen: b.uebersprungen, verworfen: b.verworfen, korb: b.korb, zuWenig: false };
}

/* ---------- Placebo: gleiches Universum, gleiche Zielzahl, zufaellige Auswahl ---------- */
function fnv1a(s) {
  var h = 0x811c9dc5;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function placeboZiel(roh, opts) {
  var b = bauePunkte(roh || {}, opts);
  if (b.punkte.length < b.o.minWerte) return { ziel: [], rangfolge: [], uebersprungen: b.uebersprungen, verworfen: b.verworfen, korb: b.korb, zuWenig: true };
  var n = zielzahl(b.punkte.length, b.o.maxZiel);
  b.korb.terzil = Math.ceil(b.punkte.length / KONFIG.TERZIL); b.korb.zielzahl = n;
  /* Seed aus Stichtag (UTC-Datum) und festem Wort; Ausgangsliste nach Kuerzel aufsteigend - unabhaengig von Eingabe-Reihenfolge und GP/A. */
  var rnd = mulberry32(fnv1a(new Date(b.o.nowMs).toISOString().slice(0, 10) + '|' + (opts && opts.placeboWort ? opts.placeboWort : KONFIG.PLACEBO_WORT)));
  var syms = b.punkte.map(function (p) { return p.sym; }).sort();
  for (var i = 0; i < n; i++) {                                   /* Fisher-Yates, nur die ersten n Plaetze */
    var j = i + Math.floor(rnd() * (syms.length - i));
    var tmp = syms[i]; syms[i] = syms[j]; syms[j] = tmp;
  }
  return { ziel: syms.slice(0, n), rangfolge: b.punkte, uebersprungen: b.uebersprungen, verworfen: b.verworfen, korb: b.korb, zuWenig: false };
}

module.exports = { zielfunktion: zielfunktion, placeboZiel: placeboZiel, KONFIG: KONFIG,
  _intern: { ttm: ttm, gueltigeEintraege: gueltigeEintraege, schiebeMonate: schiebeMonate, tagMs: tagMs, fnv1a: fnv1a, mulberry32: mulberry32 } };
