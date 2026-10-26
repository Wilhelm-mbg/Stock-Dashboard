'use strict';
/* Sektor-Momentum (Phase 3, blind festgelegt am 04.10.2026): Zielfunktion fuer den Simulator korb.js.
 * Regel in REGEL.md (Teil A). Nichts hier ist gerechnet oder an Kursen eingestellt; alle Zahlen stehen in KONFIG mit Fundstelle.
 *
 * Aufruf wie momentumZiel (mfhandel.js Z. 45-95):
 *   zielfunktion(roh, opts)  ->  { ziel, rangfolge, korb, zuWenig, uebersprungen, verworfen }
 *   placeboZiel(roh, opts)   ->  dieselbe Form; Auswahl zufaellig (deterministisch), sonst gleiches Universum und gleiche Zielzahl.
 * Eingabe roh: { KUERZEL: [[zeitMs, schlussBereinigt, umsatzStueck], ...] }, Zeilen aufsteigend; opts.nowMs = Stichtag (Mitternacht UTC
 * des Stichtag-Panel-Tages, wie in der Grundregel). Zeilen NACH nowMs werden nicht gelesen (kein Blick voraus). Reihen, deren letzte
 * Zeile (bis nowMs) mehr als 7 Kalendertage vor nowMs liegt, fliegen raus wie in momentumZiel.
 * Rueckgabe: ziel = die `anzahl` staerksten Kuerzel (Gleichstand: Kuerzel aufsteigend); rangfolge = [{sym, staerke, umsatz}] absteigend;
 *   korb = { zulaessig, geprueft, ohneUmsatz, unterSchwelle, umsatzMin, fenster } - geprueft = Zahl der Namen der Universumsliste,
 *   zulaessig = davon die, die rangieren; zuWenig = true (ziel = []), wenn weniger als KONFIG.minWerte zulaessig sind -> nicht handeln.
 *   uebersprungen: Kuerzel; verworfen: [{sym, grund}] - jeder Ausschluss mit Grund (ein Name der Liste, der nicht in roh steht: 'nicht im Panel').
 *   Kuerzel in roh, die nicht in der Universumsliste stehen (Aktien, SPY), werden nie gelesen und nie gezaehlt.
 * Bilanzdaten (opts.fundamental) werden von dieser Regel NICHT gelesen; die Regel braucht keine. Zugelassene Form, falls ein Simulator sie
 *   durchreicht (wird ignoriert): { KUERZEL: [{ filed: 'JJJJ-MM-TT', periodEnde: 'JJJJ-MM-TT', form: '10-Q'|'10-K', werte: { TagName: Zahl } }] }.
 * Keine Abhaengigkeiten. Alles Simulation mit virtuellem Kapital, keine Anlageberatung. */

var TAG_MS = 86400000;

var KONFIG = {
  /* Universum: SPDR Select Sector (11 Fonds). Namensliste vorab fest, nicht aus Daten gebildet. XLRE (Start 10.2015) und XLC (Start 06.2018)
   * rangieren erst, wenn sie minZeilen Zeilen haben (Mindestlaengenregel) - bis dahin 'zu kurze Kursreihe'. Fundstelle: Belegdatei §1
   * (CXO: 9 Sektoren XLB, XLE, XLF, XLI, XLK, XLP, XLU, XLV, XLY [Q]; XLRE/XLC sind die zwei spaeter geschaffenen SPDR-Sektoren, Zusatz dieser Studie). */
  universum: ['XLB', 'XLC', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLRE', 'XLU', 'XLV', 'XLY'],
  /* Rueckblick 12 Monate = 252 Handelstage, kein Ueberspringen (luecke 0): Faber (2010), SSRN 1585517, Beispiel 12 Monate Rueckblick,
   * Top 3, gleichgewichtet, monatlich, ohne Ueberspringen [Q-indirekt: Quantpedia/CXO; Entwurf nicht selbst gelesen]. 252 Handelstage = Umrechnung
   * 12 Monate x 21 Tage, wie die Grundregel Jahre in Handelstagen zaehlt (mfhandel: Kurs vor 252 Tagen). */
  rueckblick: 252,
  luecke: 0,
  /* Zahl der gehaltenen Sektoren: 3 (Faber: Top 3; Arnott et al. 2018 Abschn. 3.2: Top 3 [Q-indirekt]). */
  anzahl: 3,
  /* Mindestzahl zulaessiger Fonds fuer eine Rangfolge: 6 - SETZUNG dieser Studie, KEINE Literaturgroesse (Top 3 aus mindestens 6 = obere Haelfte).
   * Unter 6 zulaessigen wird nicht gehandelt (zuWenig). Nicht optimiert. */
  minWerte: 6,
  /* Umsatzschwelle der Aufgabe (gilt auch fuer ETFs): Median Schluss x Stueck ueber 20 Balken bis zum Stichtag >= 100 Mio $, Median = sortiert[n >> 1].
   * Fundstelle: liquide.js KORB (Z. 32-36) und medianUmsatz (Z. 40-56). */
  umsatzMin: 100000000,
  umsatzFenster: 20,
  /* veraltet: letzte Zeile mehr als 7 Kalendertage vor nowMs (mfhandel.js Z. 52 und 68). */
  maxAlterMs: 7 * TAG_MS,
  /* Datenwaechter, SETZUNG ohne Literaturbezug: liegen zwischen der Zeile 252 Handelstage vor dem Stichtag und dem Stichtag mehr als 400
   * Kalendertage (normal etwa 365-372), hat die Reihe eine Luecke und der Rueckblick waere kein Jahr; der Fonds rangiert dann nicht. */
  maxSpanneTage: 400,
  /* Seed-Wort des Placebos (Seed = FNV-1a(wort + '|' + Stichtag JJJJ-MM-TT)). */
  placeboWort: 'sektor-momentum-placebo-v1'
};

function medianOben(a) {
  var s = a.slice().sort(function (x, y) { return x - y; });
  return s.length ? s[s.length >> 1] : NaN;
}

/** Gemeinsamer Kern: prueft jeden Namen der Universumsliste, liefert die rangierenden Punkte (unsortiert, in Listenreihenfolge). */
function pruefeUniversum(roh, opts) {
  opts = opts || {};
  var liste = (opts.universum || KONFIG.universum).slice();   /* Reihenfolge der Liste; Gleichstand und Placebo sortieren selbst nach Kuerzel */
  var rueck = opts.rueckblick || KONFIG.rueckblick, luecke = opts.luecke == null ? KONFIG.luecke : opts.luecke;
  var umsatzMin = opts.umsatzMin == null ? KONFIG.umsatzMin : opts.umsatzMin;
  var fenster = opts.umsatzFenster || KONFIG.umsatzFenster;
  var maxAlter = opts.maxAlterMs || KONFIG.maxAlterMs;
  var maxSpanne = opts.maxSpanneTage || KONFIG.maxSpanneTage;
  var nowMs = opts.nowMs || Date.now();
  var punkte = [], uebersprungen = [], verworfen = [];
  var korb = { zulaessig: 0, geprueft: 0, ohneUmsatz: 0, unterSchwelle: 0, umsatzMin: umsatzMin, fenster: fenster };
  function raus(sym, grund) { uebersprungen.push(sym); verworfen.push({ sym: sym, grund: grund }); }
  liste.forEach(function (sym) {
    korb.geprueft++;
    var voll = roh && Object.prototype.hasOwnProperty.call(roh, sym) ? roh[sym] : null;
    if (!voll) { raus(sym, 'nicht im Panel'); return; }
    /* Kein Blick voraus: nur Zeilen bis einschliesslich nowMs. */
    var r = [];
    for (var q = 0; q < voll.length; q++) if (voll[q] && voll[q][0] <= nowMs) r.push(voll[q]);
    if (r.length < rueck + luecke + 1) { raus(sym, 'zu kurze Kursreihe (' + r.length + ' von ' + (rueck + luecke + 1) + ' Tagen)'); return; }
    if (nowMs - r[r.length - 1][0] > maxAlter) { raus(sym, 'Kurse veraltet (' + Math.round((nowMs - r[r.length - 1][0]) / TAG_MS) + ' Tage alt)'); return; }
    var i = r.length - 1;
    var a = r[i - luecke - rueck][1], p0 = r[i - luecke][1];
    if (!(a > 0) || !(p0 > 0)) { raus(sym, 'Stärke nicht berechenbar (Kurs nicht positiv oder Lücke)'); return; }
    var spanne = (r[i - luecke][0] - r[i - luecke - rueck][0]) / TAG_MS;
    if (spanne > maxSpanne) { raus(sym, 'Lücke in der Reihe (' + Math.round(spanne) + ' Kalendertage für ' + rueck + ' Handelstage)'); return; }
    /* Umsatz: Median von Schluss x Stueck ueber die letzten `fenster` Balken (fehlende Stueckzahl zaehlt 0), wie liquide.js. */
    var ums = [], hat = false;
    for (var b = Math.max(0, i - (fenster - 1)); b <= i; b++) {
      ums.push((r[b][1] || 0) * (r[b][2] || 0));
      if (typeof r[b][2] === 'number' && isFinite(r[b][2])) hat = true;
    }
    var u = medianOben(ums);
    if (umsatzMin > 0) {
      if (!hat) { korb.ohneUmsatz++; raus(sym, 'keine Stückzahlen in den Tagesdaten – Umsatz nicht prüfbar'); return; }
      if (!(u >= umsatzMin)) {
        korb.unterSchwelle++;
        raus(sym, 'Median-Tagesumsatz ' + Math.round(u / 1e6) + ' Mio $ unter ' + Math.round(umsatzMin / 1e6) + ' Mio $ (' + fenster + ' Balken) – nicht im liquiden Korb');
        return;
      }
    }
    var st = p0 / a - 1;
    if (!isFinite(st)) { raus(sym, 'Stärke nicht berechenbar (Kurslücke)'); return; }
    korb.zulaessig++;
    punkte.push({ sym: sym, staerke: st, umsatz: u });
  });
  return { punkte: punkte, uebersprungen: uebersprungen, verworfen: verworfen, korb: korb,
    n: opts.anzahl || KONFIG.anzahl, minWerte: opts.minWerte || KONFIG.minWerte, nowMs: nowMs };
}

function zuWenigErgebnis(k) { return { ziel: [], rangfolge: [], uebersprungen: k.uebersprungen, verworfen: k.verworfen, korb: k.korb, zuWenig: true }; }

/** Die Regel: staerkste `anzahl` Sektor-Fonds nach Gesamtrendite ueber `rueckblick` Handelstage bis zum Stichtag. */
function zielfunktion(roh, opts) {
  var k = pruefeUniversum(roh, opts);
  if (k.punkte.length < k.minWerte) return zuWenigErgebnis(k);
  var p = k.punkte.slice().sort(function (x, y) {
    if (y.staerke !== x.staerke) return y.staerke - x.staerke;
    return x.sym < y.sym ? -1 : x.sym > y.sym ? 1 : 0;      /* Gleichstand: Kuerzel aufsteigend */
  });
  return { ziel: p.slice(0, Math.min(k.n, p.length)).map(function (x) { return x.sym; }), rangfolge: p,
    uebersprungen: k.uebersprungen, verworfen: k.verworfen, korb: k.korb };
}

/* ---------- Placebo: deterministische Zufallsauswahl ---------- */
/** FNV-1a, 32 Bit, ueber die UTF-16-Zeichen (hier nur ASCII). */
function fnv1a(s) {
  var h = 0x811c9dc5;
  for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
/** mulberry32: liefert eine Funktion, die Zahlen in [0, 1) gibt. */
function mulberry32(seed) {
  var a = seed >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function stichtagText(nowMs) { return new Date(nowMs).toISOString().slice(0, 10); }

/** Placebo: dasselbe Universum, dieselbe Zulaessigkeit (Mindestlaenge, veraltet, Kurs, Luecke, Umsatz, minWerte), dieselbe Zielzahl;
 *  die Auswahl ist aber ein Zufallszug ohne Kursbezug. Seed = FNV-1a(placeboWort + '|' + Stichtag); Fisher-Yates ueber die zulaessigen
 *  Kuerzel in aufsteigender Reihenfolge; die ersten `anzahl` sind das Ziel. rangfolge = die ganze Zufallsfolge (staerke und umsatz
 *  werden mitgefuehrt, bestimmen die Auswahl aber nicht). */
function placeboZiel(roh, opts) {
  opts = opts || {};
  var k = pruefeUniversum(roh, opts);
  if (k.punkte.length < k.minWerte) return zuWenigErgebnis(k);
  var wort = opts.placeboWort || KONFIG.placeboWort;
  var zufall = mulberry32(fnv1a(wort + '|' + stichtagText(k.nowMs)));
  var p = k.punkte.slice().sort(function (x, y) { return x.sym < y.sym ? -1 : x.sym > y.sym ? 1 : 0; });
  for (var i = p.length - 1; i > 0; i--) {
    var j = Math.floor(zufall() * (i + 1));
    var t = p[i]; p[i] = p[j]; p[j] = t;
  }
  return { ziel: p.slice(0, Math.min(k.n, p.length)).map(function (x) { return x.sym; }), rangfolge: p,
    uebersprungen: k.uebersprungen, verworfen: k.verworfen, korb: k.korb };
}

module.exports = { zielfunktion: zielfunktion, placeboZiel: placeboZiel, KONFIG: KONFIG, fnv1a: fnv1a, mulberry32: mulberry32 };
