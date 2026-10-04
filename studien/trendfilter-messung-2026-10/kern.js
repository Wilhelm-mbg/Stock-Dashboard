'use strict';
/* Trendfilter-Messung — gemeinsamer Rechner (Regel: REGEL.md, Siegel 6f9d06f).
 *
 * Hier steht alles, was fuer die drei Regeln GLEICH ist: Daten auf den SPY-Kalender legen (§2.4), Gesamtertragsindex (§2.5),
 * Buch mit Erstkauf, Wechseln, Kosten und Ausschuettungen (§3), Kennzahlen (§3.8, §8), Starttage und Fenster (§5), Zusatz (§7.1),
 * Placebo (§6) und die Entscheidregel (§5.3). Die Signale der Regeln stehen in regel-R1.js, regel-R2.js, regel-R3.js; jedes
 * liefert ein Ziel-Feld `ziel[i]` = Kuerzel der Reihe, die die Regel ab der ERoeFFNUNG des Kalendertags i haelt (null = nicht
 * berechenbar). Der zweite Rechner (zweitrechner.js) benutzt nichts von hier.
 *
 * Lesarten, die REGEL.md dem Code ueberlaesst (festgelegt vor dem Lauf):
 *  L1 Bargeld vor dem Erstkauf ist eine Pseudo-Reihe 'BAR' mit Kurs 1 und ohne Kosten; der Erstkauf ist kein Wechsel.
 *  L2 Kosten: Verkauf Erloes = Volumen - 0,002 x Volumen; Kauf Volumen = Erloes / 1,002, Kosten = 0,002 x Kaufvolumen (§3.3).
 *  L3 Kann ein Wechsel an einem Tag nicht ausgefuehrt werden (keine Eroeffnung UND kein Schluss einer der beiden Reihen), bleibt
 *     die alte Reihe und der Versuch wird am naechsten Tag wiederholt (§3.5 „am naechsten Tag mit Kurs"); jeder Fall wird gezaehlt.
 *  L4 Ausschuettung eines Tages: Betrag nach (Reihe, Stueck) zum Schluss des Vortags; angelegt NACH dem Handel des Tages in die dann
 *     gehaltene Reihe zum Schluss (bei N1 also nach einem Wechsel zum Schluss - die Ausschuettung traegt keine Verkaufskosten).
 *  L5 Monatsende: letzter SPY-Handelstag eines Monats; der letzte Kalendertag der Daten (15.09.2026) ist KEIN Monatsende, weil der
 *     September 2026 dort abgeschnitten ist.
 *  L6 Quantile (Placebo, Zusatz): Rangverfahren, Wert an Stelle ceil(p x N) der aufsteigend sortierten Werte (1-basiert).
 */
var fs = require('fs');
var path = require('path');
var L = require('./laden.js');

var START = 100000;
var KOSTEN = 0.002;
var ENDE = L.ENDE;
var TAG_MS = 86400000;

var HAUPT = { geld: 'BIL', intl: 'ACWX', anleihen: 'AGG' };
var ERSATZ = { geld: 'SHY', intl: 'EFA', anleihen: 'AGG' };
var FENSTER = {
  A: { name: 'A', start: '2017-01-04', ende: '2021-09-15', startBis: '2017-02-04' },
  B: { name: 'B', start: '2021-09-16', ende: '2026-09-15', startBis: '2021-10-16' }
};
var ZUSATZ_LETZTER_START = '2021-09-16';
var PLACEBO_LAEUFE = 1000;
/* Rueckschlaege, die sich um hoechstens so viel unterscheiden, gelten als gleich (Korrektur 1, siehe zusatz/fassen). */
var RUECKSCHLAG_GLEICH = 1e-9;
/* Nachrichtliche Lesarten (§7.2). sig = Zusatz zu den Signal-Optionen, sim = Optionen des Buchs, nur = gilt nur fuer diese Regel. */
var VARIANTEN = {
  N1: { titel: 'Ausfuehrung zum Schluss des Signaltags (wie im Original)', sim: { ausfuehrung: 'schluss' } },
  N2: { titel: 'Ersatzreihen SHY statt BIL, EFA statt ACWX', sig: { geld: 'SHY', intl: 'EFA' } },
  N3: { titel: 'ohne Band (Schluss > SMA200 -> SPY, sonst Geld)', sig: { ohneBand: true }, nur: 'R3' },
  N4: { titel: 'ohne Kosten', sim: { kosten: 0 } },
  N5: { titel: 'absolutes Momentum auf den Gewinner angewandt', sig: { absolutAufGewinner: true }, nur: 'R2' }
};

/* ---------------- Datum ---------------- */
function utc(tag) { return Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10)); }
function tagAus(ms) { return new Date(ms).toISOString().slice(0, 10); }
function tageZwischen(a, b) { return Math.round((utc(b) - utc(a)) / TAG_MS); }
/** Gleiches Datum einen Kalendermonat spaeter (Date.UTC-Rechnung). */
function plusMonat(tag) { return tagAus(Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7), +tag.slice(8, 10))); }
/** Ende eines 5-Jahres-Fensters (§7.1): gleiches Datum fuenf Jahre spaeter minus ein Kalendertag (Date.UTC-Rechnung). */
function fuenfJahreMinusTag(tag) { return tagAus(Date.UTC(+tag.slice(0, 4) + 5, +tag.slice(5, 7) - 1, +tag.slice(8, 10)) - TAG_MS); }

/* ---------------- Daten ---------------- */
function ladeDaten(ordner) {
  ordner = ordner || path.join(__dirname, 'daten');
  var roh = {};
  L.KUERZEL.forEach(function (sym) { roh[sym] = L.lies(fs.readFileSync(path.join(ordner, sym + '.json'), 'utf8')); });
  return baueDaten(roh, ENDE);
}

/** Erstes i mit tage[i] >= tag (n, wenn keins). */
function abIndex(tage, tag) {
  var a = 0, b = tage.length;
  while (a < b) { var m = (a + b) >> 1; if (tage[m] < tag) a = m + 1; else b = m; }
  return a;
}

/** Legt gelesene Reihen ({ zeilen:[{tag,o,c}], div:[{tag,betrag}] } je Kuerzel, wie laden.lies) auf den SPY-Kalender. */
function baueDaten(roh, ende) {
  ende = ende || ENDE;
  if (!roh.SPY) throw new Error('SPY fehlt');
  var tage = [];
  roh.SPY.zeilen.forEach(function (z) { if (z.tag <= ende && z.c > 0) tage.push(z.tag); });
  for (var t = 1; t < tage.length; t++) if (!(tage[t] > tage[t - 1])) throw new Error('SPY-Kalender nicht streng steigend bei ' + tage[t]);
  var n = tage.length;
  var idx = {};
  tage.forEach(function (tg, i) { idx[tg] = i; });
  var zaehlung = { zeilenOhneSpyTag: {}, exTagVerschoben: [], exTagAusserhalb: [], luecken: {} };
  var reihen = {};
  Object.keys(roh).forEach(function (sym) {
    var r = roh[sym];
    var o = new Float64Array(n).fill(NaN), c = new Float64Array(n).fill(NaN), d = new Float64Array(n);
    var gesehen = {};
    zaehlung.zeilenOhneSpyTag[sym] = [];
    r.zeilen.forEach(function (z) {
      if (z.tag > ende) return;
      if (gesehen[z.tag]) throw new Error(sym + ': Tag doppelt ' + z.tag);
      gesehen[z.tag] = true;
      var i = idx[z.tag];
      if (i === undefined) { if (z.c != null) zaehlung.zeilenOhneSpyTag[sym].push(z.tag); return; }
      if (z.o > 0) o[i] = z.o;
      if (z.c > 0) c[i] = z.c;
    });
    var erster = -1, letzter = -1, i;
    for (i = 0; i < n; i++) if (c[i] > 0) { if (erster < 0) erster = i; letzter = i; }
    (r.div || []).forEach(function (dv) {
      if (dv.tag > ende || !(dv.betrag > 0)) return;
      var j = abIndex(tage, dv.tag);
      while (j < n && !(c[j] > 0)) j++;
      if (erster < 0 || j >= n || j < erster || dv.tag < tage[erster]) { zaehlung.exTagAusserhalb.push(sym + ' ' + dv.tag); return; }
      if (tage[j] !== dv.tag) zaehlung.exTagVerschoben.push(sym + ' ' + dv.tag + ' -> ' + tage[j]);
      d[j] += dv.betrag;
    });
    var tr = new Float64Array(n).fill(NaN);
    var luecken = [];
    if (erster >= 0) {
      tr[erster] = 1;
      var prev = erster;
      for (i = erster + 1; i < n; i++) {
        if (c[i] > 0) { tr[i] = tr[prev] * (c[i] + d[i]) / c[prev]; prev = i; } else { tr[i] = tr[prev]; if (i <= letzter) luecken.push(tage[i]); }
      }
    }
    zaehlung.luecken[sym] = luecken;
    reihen[sym] = { sym: sym, o: o, c: c, d: d, tr: tr, erster: erster, letzter: letzter };
  });
  var monatsende = new Uint8Array(n);
  var monatsendeVonMonat = {};
  for (var j = 0; j < n - 1; j++) {
    if (tage[j].slice(0, 7) !== tage[j + 1].slice(0, 7)) { monatsende[j] = 1; monatsendeVonMonat[tage[j].slice(0, 7)] = j; }
  }
  return { tage: tage, n: n, idx: idx, reihen: reihen, monatsende: monatsende, monatsendeVonMonat: monatsendeVonMonat, zaehlung: zaehlung, ende: ende };
}

/** Index des Monatsendes `monate` Kalendermonate vor dem Monatsende m (oder -1, wenn es in den Daten keins gibt). */
function monatsendeVor(D, m, monate) {
  var y = +D.tage[m].slice(0, 4), mo = +D.tage[m].slice(5, 7) - 1 - monate;
  var dt = new Date(Date.UTC(y, mo, 1)).toISOString().slice(0, 7);
  var j = D.monatsendeVonMonat[dt];
  return j === undefined ? -1 : j;
}

/** Ziel-Feld einer Monatsregel: f(m) entscheidet am Monatsende m (Kuerzel oder null); ziel[i] = f(letztes Monatsende vor i). */
function monatlich(D, f) {
  var ziel = new Array(D.n).fill(null);
  var aktuell = null;
  for (var i = 0; i < D.n; i++) {
    ziel[i] = aktuell;
    if (D.monatsende[i]) aktuell = f(i);
  }
  return ziel;
}

/* ---------------- Buch (§3) ---------------- */
function handelspreis(D, sym, i, modus) {
  var r = D.reihen[sym];
  if (!r) throw new Error('Reihe fehlt: ' + sym);
  if (modus === 'eroeffnung') {
    if (r.o[i] > 0) return { p: r.o[i], art: 'o' };
    if (r.c[i] > 0) return { p: r.c[i], art: 'c-statt-o' };
    return null;
  }
  if (r.c[i] > 0) return { p: r.c[i], art: 'c' };
  return null;
}
function letzterSchluss(D, sym, i) {
  var c = D.reihen[sym].c;
  for (var j = i; j >= 0; j--) if (c[j] > 0) return c[j];
  return NaN;
}

/**
 * Spielt ein Buch vom Starttag s bis zum Endtag e (Kalenderindizes, einschliesslich) nach dem Ziel-Feld.
 * opt.kosten (Vorgabe 0,002 je Seite), opt.ausfuehrung 'eroeffnung' (Vorgabe) oder 'schluss' (N1).
 * Liefert { endwert, werte (Schlusswerte s..e), erstkauf, wechsel [{i,tag,von,nach,art}], kosten, tageJe, fehlend, ausschuettungen, ausschuettungBetrag }.
 */
function simuliere(D, ziel, s, e, opt) {
  opt = opt || {};
  var k = opt.kosten == null ? KOSTEN : opt.kosten;
  var amSchluss = opt.ausfuehrung === 'schluss';
  var held = 'BAR', units = START;
  var heldVortag = 'BAR', unitsVortag = START;
  var erstkauf = null, wechsel = [], kosten = 0, fehlend = [], tageJe = {}, ausschuettungen = 0, ausschuettungBetrag = 0;
  var werte = new Float64Array(e - s + 1);

  function handle(i, nach, modus) {
    var pv = held === 'BAR' ? { p: 1, art: 'bar' } : handelspreis(D, held, i, modus);
    var pn = handelspreis(D, nach, i, modus);
    if (!pv || !pn) { fehlend.push({ tag: D.tage[i], art: 'kein Kurs, verschoben', von: held, nach: nach }); return false; }
    if (pv.art === 'c-statt-o' || pn.art === 'c-statt-o') fehlend.push({ tag: D.tage[i], art: 'Eroeffnung fehlt, Schluss genommen', von: held, nach: nach });
    var erloes;
    if (held === 'BAR') erloes = units;
    else { var vol = units * pv.p; var kv = vol * k; kosten += kv; erloes = vol - kv; }
    var kaufVol = erloes / (1 + k);
    kosten += kaufVol * k;
    var neu = kaufVol / pn.p;
    if (held === 'BAR') erstkauf = { i: i, tag: D.tage[i], reihe: nach, art: pn.art };
    else wechsel.push({ i: i, tag: D.tage[i], von: held, nach: nach, art: modus === 'schluss' ? 'schluss' : pn.art + '/' + pv.art });
    held = nach;
    units = neu;
    return true;
  }

  for (var i = s; i <= e; i++) {
    var zh = ziel[i];
    if (zh == null) throw new Error('kein Ziel am ' + D.tage[i]);
    /* (1) Erstkauf (beide Modi) bzw. Wechsel zur Eroeffnung (Hauptlesart) */
    if (held === 'BAR' || (!amSchluss && zh !== held)) handle(i, zh, 'eroeffnung');
    /* (2) Anspruch auf die Ausschuettung des Tages: Reihe und Stueck zum Schluss des Vortags */
    var betrag = 0;
    if (heldVortag !== 'BAR') {
      var dv = D.reihen[heldVortag].d[i];
      if (dv > 0) { betrag = unitsVortag * dv; ausschuettungen++; ausschuettungBetrag += betrag; }
    }
    /* (3) N1: Wechsel zum Schluss des Signaltags (nicht am Endtag) */
    if (amSchluss && held !== 'BAR' && i < e) {
      var zm = ziel[i + 1];
      if (zm != null && zm !== held) handle(i, zm, 'schluss');
    }
    /* (4) Ausschuettung ohne Kosten zum Schluss in die gehaltene Reihe */
    if (betrag > 0) {
      if (held === 'BAR') units += betrag;
      else {
        var pc = D.reihen[held].c[i];
        if (!(pc > 0)) { pc = letzterSchluss(D, held, i); fehlend.push({ tag: D.tage[i], art: 'Wiederanlage zum letzten Schluss', reihe: held }); }
        units += betrag / pc;
      }
    }
    /* (5) Bewertung zum Schluss */
    var wert;
    if (held === 'BAR') wert = units;
    else {
      var cs = D.reihen[held].c[i];
      if (!(cs > 0)) { cs = letzterSchluss(D, held, i); fehlend.push({ tag: D.tage[i], art: 'Bewertung zum letzten Schluss', reihe: held }); }
      wert = units * cs;
    }
    werte[i - s] = wert;
    tageJe[held] = (tageJe[held] || 0) + 1;
    heldVortag = held; unitsVortag = units;
  }
  return { endwert: werte[e - s], werte: werte, erstkauf: erstkauf, wechsel: wechsel, kosten: kosten, tageJe: tageJe, fehlend: fehlend,
    ausschuettungen: ausschuettungen, ausschuettungBetrag: ausschuettungBetrag };
}

function konstant(D, sym) { return new Array(D.n).fill(sym); }
/** Massstab (§3.6): SPY ab der Eroeffnung von s, ohne Kosten; je (s, e) einmal gerechnet und gemerkt. */
function massstab(D, s, e) {
  if (!D._massstab) D._massstab = {};
  var key = s + '-' + e;
  if (!D._massstab[key]) {
    if (!D._spyZiel) D._spyZiel = konstant(D, 'SPY');
    var l = simuliere(D, D._spyZiel, s, e, { kosten: 0 });
    D._massstab[key] = { lauf: l, kz: kennzahlen(D, l.werte, s, e) };
  }
  return D._massstab[key];
}

/* ---------------- Kennzahlen (§3.8, §8) ---------------- */
function cent(x) { return (Math.round(x * 100) / 100).toFixed(2); }

function kennzahlen(D, werte, s, e) {
  var tage = tageZwischen(D.tage[s], D.tage[e]);
  var end = werte[werte.length - 1];
  var pa = Math.pow(end / START, 365.25 / tage) - 1;
  var peak = START, peakI = s, maxDD = 0, ddVon = null, ddTief = null;
  var offenSeit = -1, unter = 0;
  var uw = { tage: 0, von: null, bis: null, erholt: true };
  for (var j = 0; j < werte.length; j++) {
    var v = werte[j], i = s + j;
    if (v >= peak) {
      if (offenSeit >= 0) {
        var dauer = tageZwischen(D.tage[offenSeit], D.tage[i]);
        if (dauer > uw.tage) uw = { tage: dauer, von: D.tage[offenSeit], bis: D.tage[i], erholt: true };
        offenSeit = -1;
      }
      peak = v; peakI = i;
    } else {
      unter++;
      if (offenSeit < 0) offenSeit = peakI;
      var dd = v / peak - 1;
      if (dd < maxDD) { maxDD = dd; ddVon = D.tage[peakI]; ddTief = D.tage[i]; }
    }
  }
  if (offenSeit >= 0) {
    var rest = tageZwischen(D.tage[offenSeit], D.tage[e]);
    if (rest > uw.tage) uw = { tage: rest, von: D.tage[offenSeit], bis: D.tage[e], erholt: false };
  }
  return { endwert: end, endwertCent: cent(end), pa: pa, kalendertage: tage, maxRueckschlag: maxDD, rueckschlagSpitze: ddVon, rueckschlagTief: ddTief,
    unterWasser: uw, anteilTageUnterWasser: unter / werte.length };
}

function kalenderjahre(D, werteR, werteS, s, e) {
  var aus = [];
  var vorR = START, vorS = START;
  for (var i = s; i <= e; i++) {
    var jahr = D.tage[i].slice(0, 4);
    if (i === e || D.tage[i + 1].slice(0, 4) !== jahr) {
      var r = werteR[i - s], sp = werteS[i - s];
      aus.push({ jahr: +jahr, bis: D.tage[i], regel: r / vorR - 1, spy: sp / vorS - 1 });
      vorR = r; vorS = sp;
    }
  }
  return aus;
}

/** Ein Lauf (Regel und Massstab) ueber [s, e], ausgewertet nach §8. */
function auswerten(D, laufR, s, e, mitDetail) {
  var m = massstab(D, s, e);
  var kR = kennzahlen(D, laufR.werte, s, e), kS = m.kz;
  var jahre = kR.kalendertage / 365.25;
  var aus = {
    start: D.tage[s], ende: D.tage[e], kalendertage: kR.kalendertage,
    regel: kR, spy: kS,
    abstandPp: (kR.pa - kS.pa) * 100,
    vorn: kR.endwert > kS.endwert,
    wechsel: laufR.wechsel.length,
    wechselJeJahr: laufR.wechsel.length / jahre,
    kosten: laufR.kosten,
    fehlendeKurse: laufR.fehlend.length
  };
  if (mitDetail) {
    var anteil = {};
    var gesamt = e - s + 1;
    Object.keys(laufR.tageJe).forEach(function (sym) { anteil[sym] = laufR.tageJe[sym] / gesamt; });
    aus.erstkauf = laufR.erstkauf && { tag: laufR.erstkauf.tag, reihe: laufR.erstkauf.reihe };
    aus.wechselListe = laufR.wechsel.map(function (w) { return { tag: w.tag, von: w.von, nach: w.nach }; });
    aus.anteilTage = anteil;
    aus.fehlendeKurseListe = laufR.fehlend;
    aus.ausschuettungenRegel = laufR.ausschuettungen;
    aus.ausschuettungenSpy = m.lauf.ausschuettungen;
    aus.kalenderjahre = kalenderjahre(D, laufR.werte, m.lauf.werte, s, e);
    aus.wechselJeKalenderjahr = {};
    laufR.wechsel.forEach(function (w) { var y = w.tag.slice(0, 4); aus.wechselJeKalenderjahr[y] = (aus.wechselJeKalenderjahr[y] || 0) + 1; });
  }
  return aus;
}

/* ---------------- Statistik ---------------- */
function median(a) {
  var b = Array.from(a).sort(function (x, y) { return x - y; });
  var n = b.length;
  if (!n) return NaN;
  return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2;
}
function quantil(a, p) {
  var b = Array.from(a).sort(function (x, y) { return x - y; });
  var r = Math.ceil(p * b.length);
  return b[Math.min(b.length, Math.max(1, r)) - 1];
}

/* ---------------- Fenster und Starttage (§5) ---------------- */
function endIndex(D, tag) { var j = abIndex(D.tage, tag); return (j < D.n && D.tage[j] === tag) ? j : j - 1; }
function starttage(D, f) {
  var aus = [];
  for (var i = abIndex(D.tage, f.start); i < D.n && D.tage[i] < f.startBis; i++) aus.push(i);
  return aus;
}

function fensterMessen(D, ziel, f, simOpt) {
  var e = endIndex(D, f.ende);
  var st = starttage(D, f);
  var liste = st.map(function (s) {
    var a = auswerten(D, simuliere(D, ziel, s, e, simOpt), s, e, false);
    return { start: a.start, endwertRegel: a.regel.endwert, endwertSpy: a.spy.endwert, abstandPp: a.abstandPp, vorn: a.vorn,
      rueckschlagRegel: a.regel.maxRueckschlag, rueckschlagSpy: a.spy.maxRueckschlag, wechsel: a.wechsel };
  });
  var ab = liste.map(function (x) { return x.abstandPp; });
  var vorn = liste.filter(function (x) { return x.vorn; }).length;
  var k0 = auswerten(D, simuliere(D, ziel, st[0], e, simOpt), st[0], e, true);
  return {
    k0: k0,
    starttage: {
      anzahl: liste.length, erster: liste[0].start, letzter: liste[liste.length - 1].start,
      vorn: vorn, anteilVorn: vorn / liste.length,
      median: median(ab), minimum: Math.min.apply(null, ab), maximum: Math.max.apply(null, ab),
      rueckschlagRegelMin: Math.min.apply(null, liste.map(function (x) { return x.rueckschlagRegel; })),
      rueckschlagRegelMax: Math.max.apply(null, liste.map(function (x) { return x.rueckschlagRegel; })),
      liste: liste
    }
  };
}

/* ---------------- Placebo (§6) ---------------- */
function fnv1a(text) {
  var h = 0x811c9dc5;
  for (var i = 0; i < text.length; i++) { h ^= text.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
/** Tage, an denen eine Regel wechseln kann, in (s, e]: monatlich = erster Handelstag jedes Monats, taeglich = jeder Tag. */
function waehlbareTage(D, art, s, e) {
  var aus = [];
  for (var i = s + 1; i <= e; i++) if (art === 'taeglich' || D.monatsende[i - 1]) aus.push(i);
  return aus;
}
/** Ziel-Feld eines Zufallslaufs: Folge der Reihen folge[0..W], Wechsel an den (aufsteigenden) Tagen tageW. */
function placeboZiel(D, s, e, folge, tageW, feld) {
  var j = 0;
  for (var i = s; i <= e; i++) {
    while (j < tageW.length && tageW[j] <= i) j++;
    feld[i] = folge[j];
  }
  return feld;
}
function placebo(D, ziel, regelName, fensterName, art, s, e, simOpt, anzahl) {
  anzahl = anzahl || PLACEBO_LAEUFE;
  var regelLauf = simuliere(D, ziel, s, e, simOpt);
  var folge = [regelLauf.erstkauf.reihe].concat(regelLauf.wechsel.map(function (w) { return w.nach; }));
  var W = regelLauf.wechsel.length;
  var saatText = 'trendfilter-2026-10|' + regelName + '|' + fensterName;
  var saat = fnv1a(saatText);
  var rng = mulberry32(saat);
  var wahl = waehlbareTage(D, art, s, e);
  var m = massstab(D, s, e);
  var feld = new Array(D.n).fill(null);
  var abst = [], dd = [], endwerte = [];
  var mehrAlsRegel = 0, vorSpy = 0;
  for (var r = 0; r < anzahl; r++) {
    var pool = wahl.slice();
    var gezogen = [];
    for (var q = 0; q < W; q++) {
      var j = q + Math.floor(rng() * (pool.length - q));
      var tmp = pool[q]; pool[q] = pool[j]; pool[j] = tmp;
      gezogen.push(pool[q]);
    }
    gezogen.sort(function (a, b) { return a - b; });
    placeboZiel(D, s, e, folge, gezogen, feld);
    var l = simuliere(D, feld, s, e, simOpt);
    var kz = kennzahlen(D, l.werte, s, e);
    abst.push((kz.pa - m.kz.pa) * 100);
    dd.push(kz.maxRueckschlag);
    endwerte.push(l.endwert);
    if (l.endwert > regelLauf.endwert) mehrAlsRegel++;
    if (l.endwert > m.kz.endwert) vorSpy++;
    if (l.wechsel.length !== W) throw new Error('Placebo mit ' + l.wechsel.length + ' statt ' + W + ' Wechseln');
  }
  return {
    laeufe: anzahl, wechselW: W, folge: folge, saatText: saatText, saat: saat, waehlbareTage: wahl.length,
    istRegelSelbst: W === 0,
    abstandMedian: median(abst), abstandP5: quantil(abst, 0.05), abstandP95: quantil(abst, 0.95),
    anteilVorSpy: vorSpy / anzahl, mehrAlsRegel: mehrAlsRegel,
    rueckschlagMedian: median(dd), rueckschlagP5: quantil(dd, 0.05), rueckschlagP95: quantil(dd, 0.95),
    endwertMedian: median(endwerte)
  };
}

/* ---------------- Zusatz (§7.1) ---------------- */
function ersterZusatzTag(D, ziele) {
  var agg = D.reihen.AGG;
  for (var m = 0; m < D.n - 1; m++) {
    if (!D.monatsende[m] || !(agg.c[m] > 0)) continue;
    var i = m + 1;
    if (ziele.every(function (z) { return z[i] != null; })) return i;
  }
  return -1;
}
function zusatz(D, ziel, ersterTag) {
  var letzter = endIndex(D, ZUSATZ_LETZTER_START);
  var liste = [];
  for (var s = ersterTag; s <= letzter; s++) {
    var e = endIndex(D, fuenfJahreMinusTag(D.tage[s]));
    var a = auswerten(D, simuliere(D, ziel, s, e, {}), s, e, false);
    liste.push({ start: a.start, ende: a.ende, abstandPp: a.abstandPp, vorn: a.vorn, rueckschlagRegel: a.regel.maxRueckschlag, rueckschlagSpy: a.spy.maxRueckschlag,
      unterWasserRegel: a.regel.unterWasser.tage, unterWasserSpy: a.spy.unterWasser.tage, wechselJeJahr: a.wechselJeJahr });
  }
  function fassen(l) {
    var ab = l.map(function (x) { return x.abstandPp; });
    var vorn = l.filter(function (x) { return x.vorn; }).length;
    /* Korrektur 1 (nach dem ersten Lauf): haelt die Regel SPY ueber den ganzen groessten Rueckschlag, sind beide Rueckschlaege
     * mathematisch gleich; der strikte Vergleich liess dann Gleitkomma-Rauschen (1e-16) ueber "flacher" entscheiden (R2: 184 von
     * 640 solchen Fenstern als flacher gezaehlt). Seither: flacher = mehr als 1e-9 flacher, |Differenz| <= 1e-9 = gleich. */
    var flacher = l.filter(function (x) { return x.rueckschlagRegel > x.rueckschlagSpy + RUECKSCHLAG_GLEICH; }).length;
    var gleich = l.filter(function (x) { return Math.abs(x.rueckschlagRegel - x.rueckschlagSpy) <= RUECKSCHLAG_GLEICH; }).length;
    return {
      fenster: l.length, vorn: vorn, anteilVorn: vorn / l.length,
      abstandMedian: median(ab), abstandMin: Math.min.apply(null, ab), abstandMax: Math.max.apply(null, ab),
      abstandP10: quantil(ab, 0.10), abstandP90: quantil(ab, 0.90),
      rueckschlagRegelMedian: median(l.map(function (x) { return x.rueckschlagRegel; })),
      rueckschlagSpyMedian: median(l.map(function (x) { return x.rueckschlagSpy; })),
      rueckschlagRegelSchlechtester: Math.min.apply(null, l.map(function (x) { return x.rueckschlagRegel; })),
      rueckschlagSpySchlechtester: Math.min.apply(null, l.map(function (x) { return x.rueckschlagSpy; })),
      anteilFlacherAlsSpy: flacher / l.length, flacherAlsSpy: flacher, gleichWieSpy: gleich,
      unterWasserRegelMedian: median(l.map(function (x) { return x.unterWasserRegel; })),
      unterWasserSpyMedian: median(l.map(function (x) { return x.unterWasserSpy; })),
      wechselJeJahrMedian: median(l.map(function (x) { return x.wechselJeJahr; }))
    };
  }
  var jeJahr = {};
  liste.forEach(function (x) { var y = x.start.slice(0, 4); (jeJahr[y] = jeJahr[y] || []).push(x); });
  var gesamtE = D.n - 1;
  return {
    ersterTag: D.tage[ersterTag], letzterStart: D.tage[letzter],
    fensterListeFelder: ['start', 'ende', 'abstandPp', 'vorn', 'rueckschlagRegel', 'rueckschlagSpy'],
    fensterListe: liste.map(function (x) {
      return [x.start, x.ende, Math.round(x.abstandPp * 1e4) / 1e4, x.vorn ? 1 : 0, Math.round(x.rueckschlagRegel * 1e5) / 1e5, Math.round(x.rueckschlagSpy * 1e5) / 1e5];
    }),
    zusammen: fassen(liste),
    jeStartjahr: Object.keys(jeJahr).sort().map(function (y) { var f = fassen(jeJahr[y]); f.startjahr = +y; return f; }),
    gesamtlauf: auswerten(D, simuliere(D, ziel, ersterTag, gesamtE, {}), ersterTag, gesamtE, true)
  };
}

/* ---------------- Entscheidregel (§5.3) ---------------- */
function urteil(fenster) {
  var bed = {}, verfehlt = [];
  ['A', 'B'].forEach(function (f) {
    var x = fenster[f];
    var b = { a_k0Vorn: x.k0.vorn, b_mind70ProzentVorn: x.starttage.anteilVorn >= 0.70, c_medianUeberNull: x.starttage.median > 0 };
    bed[f] = b;
    if (!b.a_k0Vorn) verfehlt.push(f + ': k = 0 nicht vorn');
    if (!b.b_mind70ProzentVorn) verfehlt.push(f + ': nur ' + x.starttage.vorn + ' von ' + x.starttage.anzahl + ' Starttagen vorn (< 70 %)');
    if (!b.c_medianUeberNull) verfehlt.push(f + ': Median ' + x.starttage.median.toFixed(2) + ' Pp p. a. nicht > 0');
  });
  return { schlaegtSpy: verfehlt.length === 0, satz: verfehlt.length === 0 ? 'schlägt SPY' : 'schlägt SPY nicht', bedingungen: bed, verfehlt: verfehlt };
}

/* ---------------- Eine Regel vollstaendig messen ---------------- */
/** def = { name: 'R1', titel, art: 'monatlich'|'taeglich', signal(D, opt) -> ziel }. */
function messeRegel(D, def, optionen) {
  optionen = optionen || {};
  var zielHaupt = def.signal(D, Object.assign({}, HAUPT));
  var fenster = {};
  ['A', 'B'].forEach(function (fn) {
    var f = FENSTER[fn];
    var m = fensterMessen(D, zielHaupt, f, {});
    var st = starttage(D, f);
    m.placebo = placebo(D, zielHaupt, def.name, fn, def.art, st[0], endIndex(D, f.ende), {}, optionen.placeboLaeufe);
    m.nachrichtlich = {};
    Object.keys(VARIANTEN).forEach(function (vn) {
      var v = VARIANTEN[vn];
      if (v.nur && v.nur !== def.name) return;
      var z = v.sig ? def.signal(D, Object.assign({}, HAUPT, v.sig)) : zielHaupt;
      var r = fensterMessen(D, z, f, v.sim || {});
      m.nachrichtlich[vn] = { titel: v.titel, k0: r.k0, starttage: r.starttage };
    });
    fenster[fn] = m;
  });
  var aus = { regel: def.name, titel: def.titel, art: def.art, fenster: fenster, urteil: urteil(fenster) };
  if (optionen.zusatzErsterTag != null) aus.zusatz = zusatz(D, def.signal(D, Object.assign({}, ERSATZ)), optionen.zusatzErsterTag);
  return aus;
}

module.exports = {
  START: START, KOSTEN: KOSTEN, ENDE: ENDE, HAUPT: HAUPT, ERSATZ: ERSATZ, FENSTER: FENSTER, VARIANTEN: VARIANTEN, PLACEBO_LAEUFE: PLACEBO_LAEUFE,
  ZUSATZ_LETZTER_START: ZUSATZ_LETZTER_START,
  utc: utc, tageZwischen: tageZwischen, plusMonat: plusMonat, fuenfJahreMinusTag: fuenfJahreMinusTag, abIndex: abIndex, endIndex: endIndex,
  ladeDaten: ladeDaten, baueDaten: baueDaten, monatsendeVor: monatsendeVor, monatlich: monatlich,
  simuliere: simuliere, massstab: massstab, kennzahlen: kennzahlen, kalenderjahre: kalenderjahre, auswerten: auswerten, konstant: konstant,
  median: median, quantil: quantil, cent: cent, starttage: starttage, fensterMessen: fensterMessen,
  fnv1a: fnv1a, mulberry32: mulberry32, waehlbareTage: waehlbareTage, placeboZiel: placeboZiel, placebo: placebo,
  ersterZusatzTag: ersterZusatzTag, zusatz: zusatz, urteil: urteil, messeRegel: messeRegel
};
