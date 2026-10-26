'use strict';
/* ================= Aktionaersrendite: Zielfunktion (Kandidat aktionaersrendite, blind festgelegt 04.10.2026) =================
 * Regel in einem Satz: Rang der Netto-Ausschuettungsrendite = (Dividenden + Rueckkaeufe - Neuemissionen der letzten vier Quartale)
 * geteilt durch die Marktkapitalisierung (Kurs am Stichtag x Aktienzahl), absteigend; die obersten Werte (Dezil, hoechstens 30), nur Rendite > 0.
 * Fundstellen: Boudoukh/Michaely/Richardson/Roberts, J. Finance 62(2), 2007 (Netto-Ausschuettung); Pontiff/Woodgate, J. Finance 63(2), 2008
 * (Netto-Emission). Alle Parameter mit Fundstelle: REGEL.md Teil B. Die Datei rechnet NICHTS aus eigenen Daten; sie ist reine Logik.
 * Der Simulator (korb.js) kann momentumZiel durch zielfunktion austauschen: gleiche Eingabe, gleiche Rueckgabeform.
 *
 * EINGABE zielfunktion(roh, opts)  /  placeboZiel(roh, opts)
 *   roh  = { KUERZEL: [[zeitMs, schlussBereinigt, umsatzStueck], ...] }   Zeilen aufsteigend. Zeilen nach opts.nowMs werden ignoriert;
 *          Reihen, deren letzte Zeile mehr als 7 Kalendertage vor nowMs liegt, fliegen raus (wie momentumZiel). Der Schlusskurs muss auf
 *          DERSELBEN Stueckbasis stehen wie die Aktienzahl (siehe REGEL.md Teil C.3 - Split-Falle).
 *   opts.nowMs        Stichtag in ms (Mitternacht UTC des Stichtags, wie im Simulator). Ohne Angabe Date.now().
 *   opts.fundamental  Bilanzdaten, EXAKT in dieser Form:
 *     { KUERZEL: [ { filed:      'JJJJ-MM-TT',   Einreichungsdatum bei der SEC (sub.filed), NICHT das Periodenende
 *                    periodEnde: 'JJJJ-MM-TT',   Ende der Berichtsperiode (sub.period)
 *                    form:       '10-Q' | '10-K' | '10-Q/A' | '10-K/A',   andere Formen werden ignoriert
 *                    dauer:      1 | 2 | 3 | 4,  Quartale, die die FLUSS-Werte dieser Meldung abdecken (num.qtrs): 10-Q Q1 = 1, Halbjahr = 2,
 *                                neun Monate = 3 (in 10-Q stehen Cashflow-Werte KUMULIERT seit Geschaeftsjahresbeginn!), 10-K = 4.
 *                                Fehlt dauer, gilt 10-K = 4; bei 10-Q wird NICHT geraten - die Meldung taugt dann nicht fuer Fluesse.
 *                    sic:        optional, ganze Zahl (sub.sic), Branchenschluessel 4-stellig
 *                    werte:      { SEC-Tag-Name (ohne Praefix, exakt): Zahl }   Dollar bzw. Stueck in VOLLEN Einheiten (nicht Tausend/Million);
 *                                Fluesse mit dem Vorzeichen des Tags (Payments..., Proceeds... positiv)
 *                  }, ... ] }
 *   Verwendete Tags: NetCashProvidedByUsedInFinancingActivities (Pflicht-Tag, Beleg, dass der Cashflow-Ausweis vorliegt),
 *   PaymentsOfDividendsCommonStock | PaymentsOfDividends | PaymentsOfOrdinaryDividends,
 *   PaymentsForRepurchaseOfCommonStock | PaymentsForRepurchaseOfEquity,
 *   ProceedsFromIssuanceOfCommonStock | ProceedsFromIssuanceOrSaleOfEquity | StockIssuedDuringPeriodValueNewIssues,
 *   EntityCommonStockSharesOutstanding (Deckblatt, ueber ALLE Aktiengattungen summiert) | CommonStockSharesOutstanding |
 *   WeightedAverageNumberOfSharesOutstandingBasic.
 *   Sichtbar ist eine Meldung nur, wenn filed + Karenz (1 Tag) <= nowMs. Mehrfach (Korrektur): je Tag und Periode die juengste
 *   sichtbare Einreichung, die den Tag traegt. Fehlt ein Kuerzel in fundamental: nicht zulaessig.
 *   opts-Ueberschreibungen (nur fuer Tests und Kontrollen): jeder Schluessel von KONFIG, z. B. minWerte, umsatzMin, karenzTage, sicAusschluss.
 *
 * RUECKGABE { ziel:[kuerzel], rangfolge:[{sym, staerke, rendite, umsatz, marktkap, aktien, dividende, rueckkauf, emission, ausschuettung}],
 *             korb:{zulaessig, geprueft, ...}, zuWenig:bool (nur wenn wahr), uebersprungen:[kuerzel], verworfen:[{sym, grund}] }
 *   staerke = rendite (damit korb.js-aehnliche Kontrollen, die rangfolge[i].umsatz/staerke lesen, laufen). Bei zuWenig sind ziel und rangfolge leer. */
var MH = require('../../../mfhandel.js');
var Li = require('../../../liquide.js');
var BK = MH.buchKonfig();
var TAG = 86400000;

/* ---------- Konstanten (Fundstellen: REGEL.md Teil B; "Festlegung" = nicht aus der Literatur, vorab gesetzt) ---------- */
var KONFIG = {
  umsatzMin: BK.umsatzMin, umsatzFenster: BK.umsatzFenster, minWerte: BK.mindestWerte,   /* liquide.js KORB: 100 Mio $, 20 Balken, mindestens 100 */
  minZeilen: 20,            /* Festlegung: eine Reihe braucht mindestens so viele Zeilen wie das Umsatzfenster (liquide.js medianUmsatz) */
  maxAlterMs: 7 * TAG,      /* wie momentumZiel: eingefrorene Reihen fliegen raus */
  anteil: 0.1,              /* Dezil: Boudoukh et al. sortieren in Dezile; gleiche Zahl wie mfhandel.js momentumZiel (Anteil 0,1) */
  maxZiel: 30,              /* Rahmen des Auftrags: hoechstens ~30 Positionen */
  minZiel: 5,               /* wie momentumZiel: max(5, ...) */
  karenzTage: 1,            /* Festlegung: eine Meldung vom Tag d ist ab Stichtag d+1 sichtbar (Einreichung kann nach Handelsschluss liegen) */
  maxBilanzAlterTage: 460,  /* Festlegung: juengster Berichtszeitraum hoechstens ~15 Monate alt (Jahresmeldung + Meldefrist) */
  ankerVersuche: 2,         /* Rueckfall: juengster Berichtszeitraum, sonst der davor */
  toleranzTage: 15,         /* Festlegung: Abgleich der Periodenenden (52/53-Wochen-Jahre) */
  minMarktkap: 1e8,         /* Festlegung Einheitenfehler: liquides Universum mit Marktkap. unter 100 Mio $ => Aktienzahl in Tausend o. ae. */
  maxRendite: 1.0,          /* Festlegung Einheiten-/Vorzeichenfehler: |Netto-Rendite| > 100 % ist kein Befund, sondern ein Fehler */
  sicAusschluss: [6000, 6999],   /* Finanzwerte (SIC 6000-6999) nicht zulaessig - Begruendung REGEL.md Teil A.2; null = nicht ausschliessen */
  pflichtTag: 'NetCashProvidedByUsedInFinancingActivities',
  ketten: {   /* Rueckfallkette je Fluss: der ERSTE Tag, dessen TTM berechenbar ist; nie addiert (Doppelzaehlung) */
    dividende: ['PaymentsOfDividendsCommonStock', 'PaymentsOfDividends', 'PaymentsOfOrdinaryDividends'],
    rueckkauf: ['PaymentsForRepurchaseOfCommonStock', 'PaymentsForRepurchaseOfEquity'],
    emission: ['ProceedsFromIssuanceOfCommonStock', 'ProceedsFromIssuanceOrSaleOfEquity', 'StockIssuedDuringPeriodValueNewIssues'],
  },
  aktienKette: ['EntityCommonStockSharesOutstanding', 'CommonStockSharesOutstanding', 'WeightedAverageNumberOfSharesOutstandingBasic'],
  placeboWort: 'aktionaersrendite-placebo-v1',
};
var FORMEN = ['10-K', '10-Q', '10-K/A', '10-Q/A'];
var QUARTAL_TAGE = 91.25;

function konfig(opts) {
  var c = {};
  Object.keys(KONFIG).forEach(function (k) { c[k] = (opts && opts[k] !== undefined) ? opts[k] : KONFIG[k]; });
  return c;
}
function tagMs(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return NaN;
  var m = Date.parse(s + 'T00:00:00Z');
  return isFinite(m) ? m : NaN;
}
function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }
function num(w, tag) { var v = w[tag]; return (typeof v === 'number' && isFinite(v)) ? v : null; }

/* ---------- Bilanzdaten: sichtbare Meldungen ---------- */
function sichtbar(recs, nowMs, c) {
  var aus = [];
  (Array.isArray(recs) ? recs : []).forEach(function (r, idx) {
    if (!r || typeof r !== 'object' || !r.werte || typeof r.werte !== 'object') return;
    if (FORMEN.indexOf(r.form) < 0) return;
    var f = tagMs(r.filed), p = tagMs(r.periodEnde);
    if (!isFinite(f) || !isFinite(p)) return;
    if (f + c.karenzTage * TAG > nowMs) return;                         /* kein Blick voraus */
    var d = r.dauer;
    if (!(d === 1 || d === 2 || d === 3 || d === 4)) d = (r.form === '10-K' || r.form === '10-K/A') ? 4 : null;
    aus.push({ filed: f, pe: p, dauer: d, sic: (typeof r.sic === 'number' && isFinite(r.sic)) ? r.sic : null, werte: r.werte, idx: idx });
  });
  return aus;
}
/** Wert eines Tags fuer (Periodenende, Dauer): juengste sichtbare Einreichung, die den Tag traegt (Korrekturen). */
function wertDe(sicht, pe, dauer, tag) {
  var b = null, v = null;
  sicht.forEach(function (r) {
    if (r.pe !== pe || r.dauer !== dauer) return;
    var x = num(r.werte, tag);
    if (x === null) return;
    if (!b || r.filed > b.filed || (r.filed === b.filed && r.idx > b.idx)) { b = r; v = x; }
  });
  return v;
}
/** Wert zu (Dauer, Tag) mit Periodenende nahe soll (innerhalb toleranzTage); naechstes Periodenende gewinnt. */
function nahe(sicht, dauer, tag, soll, c) {
  var best = null;
  sicht.forEach(function (r) {
    if (r.dauer !== dauer || num(r.werte, tag) === null) return;
    var ab = Math.abs(r.pe - soll);
    if (ab > c.toleranzTage * TAG) return;
    if (best === null || ab < best.ab || (ab === best.ab && r.pe > best.pe)) best = { ab: ab, pe: r.pe };
  });
  return best ? wertDe(sicht, best.pe, dauer, tag) : null;
}
/** Vier-Quartale-Summe eines Flusses am Anker a. Dauer 4 (10-K): der Wert selbst. Sonst (kumulierter 10-Q-Wert):
 *  TTM = Wert(a) + Jahreswert des letzten Geschaeftsjahres - kumulierter Wert derselben Dauer im Vorjahr. Fehlt ein Teil: null. */
function ttm(sicht, a, tag, c) {
  var x = wertDe(sicht, a.pe, a.dauer, tag);
  if (x === null) return null;
  if (a.dauer === 4) return x;
  var jahr = nahe(sicht, 4, tag, a.pe - a.dauer * QUARTAL_TAGE * TAG, c);
  var vor = nahe(sicht, a.dauer, tag, a.pe - 365 * TAG, c);
  if (jahr === null || vor === null) return null;
  return x + jahr - vor;
}
function anker(sicht, c, nowMs) {
  var map = {}, hat = false;
  sicht.forEach(function (r) {
    if (!r.dauer || num(r.werte, c.pflichtTag) === null) return;
    hat = true;
    if (!map[r.pe] || r.dauer > map[r.pe]) map[r.pe] = r.dauer;
  });
  var liste = Object.keys(map).map(Number).sort(function (a, b) { return b - a; })
    .filter(function (pe) { return nowMs - pe <= c.maxBilanzAlterTage * TAG; })
    .map(function (pe) { return { pe: pe, dauer: map[pe] }; });
  return { liste: liste.slice(0, c.ankerVersuche), hat: hat, alle: liste.length };
}
/** Fluesse am Anker; null, wenn nicht berechenbar. Kein Tag der Kette im Anker ausgewiesen => 0 (Nicht-Zahler tragen den Tag nicht);
 *  ausgewiesen, aber TTM nicht berechenbar => null (nicht raten). Negative Fluesse (Vorzeichenfehler) => 0, gezaehlt. */
function fluesse(sicht, a, c) {
  if (ttm(sicht, a, c.pflichtTag, c) === null) return null;
  var out = { tags: {}, vorzeichen: 0 };
  var namen = ['dividende', 'rueckkauf', 'emission'];
  for (var i = 0; i < namen.length; i++) {
    var kette = c.ketten[namen[i]], gefunden = false, wert = null, tag = null;
    for (var j = 0; j < kette.length; j++) {
      if (wertDe(sicht, a.pe, a.dauer, kette[j]) === null) continue;
      gefunden = true;
      var v = ttm(sicht, a, kette[j], c);
      if (v !== null) { wert = v; tag = kette[j]; break; }
    }
    if (!gefunden) { wert = 0; tag = null; }
    else if (wert === null) return null;
    if (wert < 0) { wert = 0; out.vorzeichen++; }
    out[namen[i]] = wert; out.tags[namen[i]] = tag;
  }
  return out;
}
function aktienzahl(sicht, c) {
  var b = null, w = null;
  sicht.forEach(function (r) {
    var x = null;
    for (var j = 0; j < c.aktienKette.length; j++) { var v = num(r.werte, c.aktienKette[j]); if (v !== null && v > 0) { x = v; break; } }
    if (x === null) return;
    if (!b || r.filed > b.filed || (r.filed === b.filed && (r.pe > b.pe || (r.pe === b.pe && r.idx > b.idx)))) { b = r; w = x; }
  });
  return w;
}
function branche(sicht) {
  var b = null;
  sicht.forEach(function (r) {
    if (r.sic === null) return;
    if (!b || r.filed > b.filed || (r.filed === b.filed && r.idx > b.idx)) b = r;
  });
  return b ? b.sic : null;
}
function zielzahl(zulaessig, c) { return Math.min(c.maxZiel, Math.max(c.minZiel, Math.round(zulaessig * c.anteil))); }

/* ---------- Universum und Kennzahl ---------- */
function universum(roh, opts) {
  opts = opts || {};
  var c = konfig(opts), nowMs = opts.nowMs || Date.now(), fund = opts.fundamental || {};
  var punkte = [], uebersprungen = [], verworfen = [];
  var korb = { zulaessig: 0, geprueft: 0, ohneUmsatz: 0, unterSchwelle: 0, umsatzMin: c.umsatzMin, fenster: c.umsatzFenster,
    ohneBilanz: 0, finanzwerte: 0, ohneAktien: 0, einheitenverdacht: 0, vorzeichenKorrigiert: 0, positiv: 0 };
  function raus(sym, grund) { uebersprungen.push(sym); verworfen.push({ sym: sym, grund: grund }); }
  Object.keys(roh).forEach(function (sym) {
    korb.geprueft++;
    var r = (roh[sym] || []).filter(function (z) { return z && z[0] <= nowMs; });          /* kein Blick voraus */
    if (r.length < c.minZeilen) { raus(sym, 'zu kurze Kursreihe (' + r.length + ' von ' + c.minZeilen + ' Zeilen)'); return; }
    var i = r.length - 1;
    if (nowMs - r[i][0] > c.maxAlterMs) { raus(sym, 'Kurse veraltet (' + Math.round((nowMs - r[i][0]) / TAG) + ' Tage alt)'); return; }
    var kurs = r[i][1];
    if (!(kurs > 0) || !isFinite(kurs)) { raus(sym, 'Kurs <= 0 oder nicht berechenbar'); return; }
    var z = Li.zulaessig(r, i, { umsatzMin: c.umsatzMin, fenster: c.umsatzFenster });
    if (!z.ok) {
      if (c.umsatzMin > 0 && !Li.hatUmsatz(r, i, c.umsatzFenster)) korb.ohneUmsatz++; else korb.unterSchwelle++;
      raus(sym, z.grund); return;
    }
    var sicht = sichtbar(fund[sym], nowMs, c);
    if (!sicht.length) { korb.ohneBilanz++; raus(sym, 'keine Bilanzdaten bis zum Stichtag (Karenz ' + c.karenzTage + ' Tag)'); return; }
    var sic = branche(sicht);
    if (c.sicAusschluss && sic !== null && sic >= c.sicAusschluss[0] && sic <= c.sicAusschluss[1]) { korb.finanzwerte++; raus(sym, 'Finanzwert (SIC ' + sic + ')'); return; }
    var an = anker(sicht, c, nowMs), fl = null, ank = null;
    if (!an.hat) { korb.ohneBilanz++; raus(sym, 'Cashflow-Ausweis fehlt (' + c.pflichtTag + ' nicht vorhanden)'); return; }
    if (!an.alle) { korb.ohneBilanz++; raus(sym, 'Bilanz veraltet (juengster Berichtszeitraum aelter als ' + c.maxBilanzAlterTage + ' Tage)'); return; }
    for (var k = 0; k < an.liste.length && !fl; k++) { fl = fluesse(sicht, an.liste[k], c); if (fl) ank = an.liste[k]; }
    if (!fl) { korb.ohneBilanz++; raus(sym, 'Zahlungsstroeme nicht berechenbar (Vier-Quartale-Summe unvollstaendig)'); return; }
    var aktien = aktienzahl(sicht, c);
    if (aktien === null) { korb.ohneAktien++; raus(sym, 'Aktienzahl fehlt'); return; }
    var mk = kurs * aktien;
    if (!(mk >= c.minMarktkap)) { korb.einheitenverdacht++; raus(sym, 'Marktkapitalisierung ' + Math.round(mk) + ' $ unter ' + c.minMarktkap + ' $ (Einheitenverdacht)'); return; }
    var aus = fl.dividende + fl.rueckkauf, rend = (aus - fl.emission) / mk;
    if (!(Math.abs(rend) <= c.maxRendite)) { korb.einheitenverdacht++; raus(sym, 'Netto-Rendite ' + (rend * 100).toFixed(0) + ' % ausserhalb +-' + (c.maxRendite * 100) + ' % (Einheiten-/Vorzeichenverdacht)'); return; }
    korb.zulaessig++; korb.vorzeichenKorrigiert += fl.vorzeichen; if (rend > 0) korb.positiv++;
    punkte.push({ sym: sym, staerke: rend, rendite: rend, umsatz: z.umsatz, marktkap: mk, aktien: aktien, dividende: fl.dividende, rueckkauf: fl.rueckkauf,
      emission: fl.emission, ausschuettung: aus, ankerPeriodenende: iso(ank.pe), ankerDauer: ank.dauer, tags: fl.tags });
  });
  return { c: c, nowMs: nowMs, punkte: punkte, korb: korb, uebersprungen: uebersprungen, verworfen: verworfen };
}
function sortiere(punkte) {
  return punkte.slice().sort(function (a, b) { return b.rendite - a.rendite || (a.sym < b.sym ? -1 : a.sym > b.sym ? 1 : 0); });
}
function leer(u) { return { ziel: [], rangfolge: [], uebersprungen: u.uebersprungen, verworfen: u.verworfen, korb: u.korb, zuWenig: true }; }

/** Die Regel: Rang absteigend nach Netto-Ausschuettungsrendite, nur Rendite > 0 waehlbar, Zielzahl = min(30, max(5, round(0,1 x zulaessig))). */
function zielfunktion(roh, opts) {
  var u = universum(roh, opts), c = u.c;
  if (u.korb.zulaessig < c.minWerte) return leer(u);
  var rang = sortiere(u.punkte), n = zielzahl(u.korb.zulaessig, c);
  var pos = rang.filter(function (p) { return p.rendite > 0; });
  if (pos.length < c.minZiel) return leer(u);
  return { ziel: pos.slice(0, n).map(function (p) { return p.sym; }), rangfolge: rang, uebersprungen: u.uebersprungen, verworfen: u.verworfen, korb: u.korb };
}

/* ---------- Placebo: gleiche Mechanik, gleiches Universum, gleiche Zielzahl, Auswahl zufaellig ---------- */
function hash32(s) { var h = 2166136261 >>> 0; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; } return h >>> 0; }   /* FNV-1a 32 Bit */
function mulberry32(a) {
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function samen(nowMs, wort) { return hash32(wort + '|' + iso(nowMs)); }
/** Zufallsauswahl mit festem Seed (Wort + Stichtag). Zieht aus ALLEN zulaessigen Werten (auch Rendite <= 0), Anzahl = Laenge der echten Zielliste. */
function placeboZiel(roh, opts) {
  var echt = zielfunktion(roh, opts);
  if (echt.zuWenig) return echt;
  var u = universum(roh, opts), c = u.c;
  var pool = u.punkte.map(function (p) { return p.sym; }).sort(), n = echt.ziel.length, rnd = mulberry32(samen(u.nowMs, c.placeboWort));
  for (var i = 0; i < n; i++) { var j = i + Math.floor(rnd() * (pool.length - i)); var t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
  return { ziel: pool.slice(0, n), rangfolge: echt.rangfolge, uebersprungen: echt.uebersprungen, verworfen: echt.verworfen, korb: echt.korb, placebo: true, seed: samen(u.nowMs, c.placeboWort) };
}

module.exports = { KONFIG: KONFIG, zielfunktion: zielfunktion, placeboZiel: placeboZiel, zielzahl: zielzahl, hash32: hash32, mulberry32: mulberry32, samen: samen };
