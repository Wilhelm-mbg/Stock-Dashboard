'use strict';
/*
 * zweitrechner.js — der zweite, unabhängige Rechner der Messung „Sektor-Momentum" (ZUSATZ.md §6).
 *
 * Gebaut ausschließlich aus den Regeltexten:
 *   - studien/kandidaten-blind-2026-10/sektor-momentum/REGEL.md            (die Regel, Teil A–D)
 *   - studien/sektor-momentum-messung-2026-10/ZUSATZ.md                     (Datenquelle, Felder, Kalender, Ausschüttungen, SPY, Takt)
 *   - studien/massstab-rueckblick-2026-10-04/REGEL.md Teil A §1.3–1.9 und C  (Zeitablauf, Ausschüttungen, Bewertung, Perioden, p. a.)
 *   - studien/momentum-korb-2026-10-04/REGEL.md §1.5 und C.3–C.4             (Mechanik „Gleichgewicht")
 * und den unveränderten Yahoo-Rohdateien (eigener Parser). Kein Code eines anderen Rechners ist gelesen oder geladen.
 * Wo die Texte zwei Lesarten zulassen, steht im Code „LESART:" und dieselbe Stelle in LESARTEN (geht in die Ausgabe).
 *
 * Aufruf:
 *   node zweitrechner.js --nur-klinken    Prüfsummen, Kalender (A 1.183 / B 1.254), SPY-Ausschüttungen (18 / 20, Ergänzung),
 *                                         SPY-Pflichtprüfung ZUSATZ §1.9 — keine Rangfolge, kein Buch, kein Placebo
 *   node zweitrechner.js --lauf           erst die Klinken (bei Fehler Abbruch), dann A und B bei k = 0, Regel und Placebo
 *                                         → zweitrechner.json neben diesem Skript
 *   Optionen: --daten <ordner> (sonst Umgebungsvariable SEKTOR_DATEN, sonst die Vorgabe aus ZUSATZ §1.2), --aus <datei>
 *
 * Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var TAG_MS = 86400000;

var K = Object.freeze({
  KENNUNG: 'sektor-momentum-messung-2026-10/zweitrechner/v1',
  UNIVERSUM: Object.freeze(['XLB', 'XLC', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLRE', 'XLU', 'XLV', 'XLY']), // REGEL A.1
  MASSSTAB: 'SPY',
  RUECKBLICK: 252,          // REGEL A.2: Schluss(Stichtag) / Schluss(Stichtag − 252 Zeilen) − 1
  MINDESTZEILEN: 253,       // REGEL A.1: 252 + 0 + 1
  ZIELZAHL: 3,              // REGEL A.3
  MINDEST_ZULAESSIG: 6,     // REGEL A.3: weniger als 6 zulässig → zuWenig
  UMSATZ_MIN: 100000000,    // REGEL A.1 / B: Median von Kurs × Stück über 20 Balken ≥ 100 Mio $
  UMSATZ_BALKEN: 20,
  VERALTET_TAGE: 7,         // REGEL A.1 / B: letzte Zeile höchstens 7 Kalendertage vor dem Stichtag
  LUECKE_TAGE: 400,         // REGEL B / C.3: ≤ 400 Kalendertage zwischen Zeile i − 252 und i
  HALTEN: 21,               // REGEL A.5, ZUSATZ §2.3
  KOSTEN_BP: 20,            // REGEL A.7
  STARTKAPITAL: 100000,
  PLACEBO_WORT: 'sektor-momentum-placebo-v1', // REGEL B (Seed), Auftrag
  // ZUSATZ §1.9 / momentum-korb REGEL §1.6, §1a.3: fehlt bei Yahoo der SPY-Satz mit Ex-Tag 15.06.2018, wird er ergänzt.
  // Grund: im Maßnahmen-Archiv fehlte diese Quartalszahlung (vom PM gefunden); Gegenprobe des PM +115,95 % mit / +114,98 % ohne.
  SPY_ERGAENZUNG: Object.freeze({ exTag: '2018-06-15', betrag: 1.2456 }),
  DATEN_VORGABE: 'C:/Users/Wilhe/Downloads/sektor-messung/daten'
});

var FENSTER = Object.freeze({
  A: Object.freeze({ von: '2017-01-04', bis: '2021-09-15', tage: 1183, perioden: 57, voll: 56, rest: 7, stichtag: '2017-01-03' }),
  B: Object.freeze({ von: '2021-09-16', bis: '2026-09-15', tage: 1254, perioden: 60, voll: 59, rest: 15, stichtag: '2021-09-15' })
});

// ZUSATZ §1.9: bekannte SPY-Zahlen (Panel + Maßnahmen-Archiv mit Ergänzung, Nr. 78)
var PFLICHT = Object.freeze({
  i: Object.freeze({ von: '2017-01-03', bis: '2021-09-15', art: 'schluss', prozent: 115.95 }),
  ii: Object.freeze({ von: '2017-01-04', bis: '2021-09-15', art: 'eroeffnung', dollar: 215535.73, prozent: 115.54 }),
  iii: Object.freeze({ von: '2021-09-16', bis: '2026-09-15', art: 'eroeffnung', dollar: 181193.87, prozent: 81.19 }),
  iv: Object.freeze({ A: 23.8656, B: 34.0657 }),
  TOL_PP: 0.30,
  TOL_DOLLAR: 0.01
});

var LESARTEN = [
  { nr: 1, stelle: 'Bewertung „bewerte (rundet auf Cent)"', entscheidung: 'Buchwert = Bargeld + Σ Stück × Schluss, die Summe EINMAL auf Cent gerundet (Math.round(x·100)/100); nicht je Position gerundet. Bargeld bleibt intern ungerundet.' },
  { nr: 2, stelle: 'Depotwert/Budget im Gleichgewicht', entscheidung: 'Depotwert zu Eröffnungskursen UNGERUNDET (nicht über die Cent-Bewertung); Budget = Depotwert / Länge der Zielliste. Wirkt über die 4-Stellen-Rundung der Stückzahl auf den Cent.' },
  { nr: 3, stelle: 'Stückzahl nach Teilverkauf/Aufstockung', entscheidung: 'gehandelte Stück auf 4 Stellen gerundet (Math.round), Bestand danach ebenfalls auf 4 Stellen gerundet gespeichert (nur Gleitkomma-Rest).' },
  { nr: 4, stelle: 'Reihenfolge der Verkäufe', entscheidung: 'ein Durchgang in Buchfolge (Einfügefolge der Positionen): Nicht-Ziel ganz, Ziel über Budget teilweise; danach Käufe in Zielfolge (Rangfolge). Die Verkaufsfolge berührt nur Gleitkomma-Reste.' },
  { nr: 5, stelle: 'Verkleinerter Kauf', entscheidung: 'zuerst Stück = round4((Budget − Wert)/Kurs); ist Stück × Kurs × 1,002 > Bargeld, dann Stück = floor4(Bargeld / (Kurs × 1,002)); Kosten Kauf = Stück × Kurs × 1,002, Verkauf = Stück × Kurs × 0,998.' },
  { nr: 6, stelle: 'Balken ohne Stückzahl in der Umsatzschwelle', entscheidung: 'Umsatz 0 $ (Balken zählt im Median mit). In den Rohdaten kommt kein fehlendes volume vor — ohne Wirkung.' },
  { nr: 7, stelle: '„Vortag" bei Ex-Tag ohne Handelstag', entscheidung: 'letzte Zeile der Reihe vor dem EX-Tag (nicht vor dem Buchungstag); Gutschrift Stück × basis × satz mit satz = Betrag/basis ist davon nur im Gleitkomma berührt.' },
  { nr: 8, stelle: 'SPY-Maßstab', entscheidung: 'Anteile = 100.000 / Eröffnung ungerundet (keine 4-Stellen-Rundung, keine Kosten); Ausschüttung zählt, wenn ihr Buchungstag NACH dem Kauftag liegt; Wiederanlage Anteile += Anteile × basis × satz / Schluss; Endwert ungerundet, verglichen auf Cent.' },
  { nr: 9, stelle: 'SPY-Kauftag bei zuWenig am ersten Ausführungstag', entscheidung: 'SPY wird am ersten Fenstertag (k = 0) gekauft, auch wenn das Buch dort zuWenig meldet; p. a. beider über den Fenstertag (in A/B nicht erwartet).' },
  { nr: 10, stelle: 'Perioden', entscheidung: 'Grenzen sind nur AUSGEFÜHRTE Umschichtungen; Anfang = Wert zum Schluss des Stichtags vor dem Ausführungstag (erste Periode 100.000 = Startkapital bzw. SPY-Kaufwert), Ende = Wert zum Schluss des Stichtags vor der nächsten, die letzte am Fensterende. Werte aus den Tageswerten (Buch auf Cent).' },
  { nr: 11, stelle: 'Prüfsummen-Feld „zeilen"', entscheidung: 'Zahl der Zeitstempel der Rohantwort (vor der Tagesbildung); erster/letzter Tag = New-Yorker Datum des ersten/letzten Zeitstempels.' },
  { nr: 12, stelle: 'Placebo-Zeichenkette', entscheidung: 'Stichtag = Datum des Kalendertags vor dem Ausführungstag als JJJJ-MM-TT; FNV-1a über die UTF-16-Codeeinheiten (hier ASCII = Bytes); Fisher-Yates über die zulässigen Kürzel nach einfachem Zeichenvergleich aufsteigend.' },
  { nr: 13, stelle: 'Reihenende eines gehaltenen Fonds', entscheidung: 'am ersten Handelstag nach der letzten Zeile der ganzen Reihe vor dem Handel zum letzten Schluss ohne Kosten ausgebucht (Ende-Grund unbekannt → „sonst"); in den Daten nicht erwartet, wird gezählt.' },
  { nr: 14, stelle: 'Gleitkomma-Reihenfolge der Summen', entscheidung: 'Bewertung und Depotwert summieren Bargeld zuerst, dann die Positionen in Buchfolge; Gutschrift = (Stück × basis) × satz.' }
];

// ---------------------------------------------------------------- Hilfen

function tagMs(tag) {
  return Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10));
}
function msTag(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}
var NY_FORMAT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
// ZUSATZ §1.5: Datum eines Balkens = Kalendertag des Zeitstempels in America/New_York
function nyTag(sekunden) {
  var t = {};
  NY_FORMAT.formatToParts(new Date(sekunden * 1000)).forEach(function (p) { t[p.type] = p.value; });
  return t.year + '-' + t.month + '-' + t.day;
}
function rund4(x) { return Math.round(x * 10000) / 10000; }
function ab4(x) { return Math.floor(x * 10000) / 10000; }
function cent(x) { return Math.round(x * 100) / 100; }
function istKurs(p) { return typeof p === 'number' && isFinite(p) && p > 0; }
function aufsteigend(a, b) { return a < b ? -1 : (a > b ? 1 : 0); }

// erster Index i mit arr[i] >= x (arr aufsteigend), sonst arr.length
function untereGrenze(arr, x) {
  var lo = 0, hi = arr.length;
  while (lo < hi) { var m = (lo + hi) >> 1; if (arr[m] < x) lo = m + 1; else hi = m; }
  return lo;
}

// ---------------------------------------------------------------- Parser (eigener, ZUSATZ §1.5)

function leseYahoo(obj, sym) {
  var res = obj && obj.chart && obj.chart.result && obj.chart.result[0];
  if (!res) throw new Error(sym + ': keine chart.result[0]');
  var ts = res.timestamp || [];
  var q = res.indicators && res.indicators.quote && res.indicators.quote[0];
  var adjBlock = res.indicators && res.indicators.adjclose && res.indicators.adjclose[0];
  if (!q || !adjBlock) throw new Error(sym + ': quote/adjclose fehlt');
  var adj = adjBlock.adjclose || [];
  var proTag = new Map();
  var zaehler = { balken: ts.length, ohneSchluss: 0, doppeltGleich: 0, doppeltVerschieden: 0, ohneEroeffnung: 0, ohneStueck: 0 };
  for (var i = 0; i < ts.length; i++) {
    var c = q.close ? q.close[i] : null;
    var a = adj[i];
    if (!istKurs(c) || !istKurs(a)) { zaehler.ohneSchluss++; continue; }
    var tag = nyTag(ts[i]);
    var o = q.open ? q.open[i] : null;
    var v = q.volume ? q.volume[i] : null;
    var z = {
      tag: tag,
      ts: tagMs(tag),                       // REGEL C.9: Mitternacht UTC des Tages
      open: istKurs(o) ? o : null,          // ZUSATZ §1.7: fehlt open oder ≤ 0 → kein Eröffnungskurs
      close: c,
      adj: a,
      vol: (typeof v === 'number' && isFinite(v)) ? v : null
    };
    if (proTag.has(tag)) {
      var alt = proTag.get(tag);
      if (alt.open === z.open && alt.close === z.close && alt.adj === z.adj && alt.vol === z.vol) zaehler.doppeltGleich++;
      else zaehler.doppeltVerschieden++;
    }
    proTag.set(tag, z); // sind zwei Balken verschieden, gilt der letzte in der Antwort
  }
  var zeilen = Array.from(proTag.values()).sort(function (x, y) { return x.ts - y.ts; });
  zeilen.forEach(function (z) { if (z.open === null) zaehler.ohneEroeffnung++; if (z.vol === null) zaehler.ohneStueck++; });
  var ev = res.events || {};
  var dividenden = Object.keys(ev.dividends || {}).map(function (k) {
    var d = ev.dividends[k];
    var sek = typeof d.date === 'number' ? d.date : +k;
    return { exTag: nyTag(sek), betrag: d.amount };
  }).sort(function (x, y) { return aufsteigend(x.exTag, y.exTag); });
  var splits = Object.keys(ev.splits || {}).map(function (k) {
    var s = ev.splits[k];
    return { tag: nyTag(typeof s.date === 'number' ? s.date : +k), zaehler: s.numerator, nenner: s.denominator };
  });
  return {
    sym: sym,
    meta: { symbol: res.meta && res.meta.symbol, zeitstempel: ts.length,
      ersterTag: ts.length ? nyTag(ts[0]) : null, letzterTag: ts.length ? nyTag(ts[ts.length - 1]) : null,
      ausschuettungen: Object.keys(ev.dividends || {}).length, splits: Object.keys(ev.splits || {}).length },
    zeilen: zeilen, dividenden: dividenden, splits: splits, zaehler: zaehler
  };
}

// ---------------------------------------------------------------- Aufbereitung auf den SPY-Kalender

// ZUSATZ §1.7 Ausschüttungen: satz = Betrag / close des Vortags (letzte Zeile vor dem Ex-Tag), basis = close des Vortags.
// Ex-Tag ohne Handelstag → erster Handelstag danach; Beträge ≤ 0 und Ex-Tage nach der letzten Zeile zählen nicht; mehrere zählen alle.
function ausschuettungenAufKalender(reihe, kalender) {
  var divAm = new Map();
  var zeilen = reihe.zeilen;
  var tage = zeilen.map(function (z) { return z.tag; });
  var letzter = tage.length ? tage[tage.length - 1] : null;
  var liste = [];
  reihe.dividenden.forEach(function (d) {
    if (!(typeof d.betrag === 'number' && d.betrag > 0)) return;
    if (letzter === null || d.exTag > letzter) return;
    var kIdx = untereGrenze(kalender, d.exTag);
    if (kIdx >= kalender.length) return;
    // LESART 7: „Vortag" = letzte Zeile der Reihe vor dem Ex-Tag
    var vIdx = untereGrenze(tage, d.exTag) - 1;
    if (vIdx < 0) return;
    var basis = zeilen[vIdx].close;
    var e = { exTag: d.exTag, buchungstag: kalender[kIdx], kIdx: kIdx, betrag: d.betrag, basis: basis, satz: d.betrag / basis, ergaenzt: !!d.ergaenzt };
    if (!divAm.has(kIdx)) divAm.set(kIdx, []);
    divAm.get(kIdx).push(e);
    liste.push(e);
  });
  return { divAm: divAm, liste: liste };
}

function bereiteVor(reihe, kalender) {
  var n = kalender.length;
  var openAt = new Array(n), closeAt = new Array(n), rowAt = new Array(n);
  var zeilen = reihe.zeilen;
  var j = -1, nichtImKalender = 0;
  var kalSet = new Set(kalender);
  zeilen.forEach(function (z) { if (!kalSet.has(z.tag)) nichtImKalender++; });
  for (var t = 0; t < n; t++) {
    while (j + 1 < zeilen.length && zeilen[j + 1].tag <= kalender[t]) j++;
    rowAt[t] = j;
    closeAt[t] = j >= 0 ? zeilen[j].close : null;              // letzter Schluss ≤ Tag (ZUSATZ §1.7)
    openAt[t] = (j >= 0 && zeilen[j].tag === kalender[t]) ? zeilen[j].open : null; // nur am Tag selbst
  }
  // ZUSATZ §1.7 Rangbildung: Zeile [Zeitstempel, adjclose, close × volume / adjclose]
  var roh = zeilen.map(function (z) { return [z.ts, z.adj, z.vol === null ? null : z.close * z.vol / z.adj]; });
  var a = ausschuettungenAufKalender(reihe, kalender);
  return {
    sym: reihe.sym, zeilen: zeilen, roh: roh, openAt: openAt, closeAt: closeAt, rowAt: rowAt,
    letzteZeileTag: zeilen.length ? zeilen[zeilen.length - 1].tag : null,
    divAm: a.divAm, dividendenListe: a.liste, nichtImKalender: nichtImKalender
  };
}

// ZUSATZ §1.9: SPY-Ergänzung nur, wenn Yahoo keinen Satz mit Ex-Tag 15.06.2018 führt; höchstens ein Satz aus der Ergänzung.
function spyMitErgaenzung(spyReihe) {
  var hat = spyReihe.dividenden.some(function (d) { return d.exTag === K.SPY_ERGAENZUNG.exTag; });
  var dividenden = spyReihe.dividenden.slice();
  if (!hat) {
    dividenden.push({ exTag: K.SPY_ERGAENZUNG.exTag, betrag: K.SPY_ERGAENZUNG.betrag, ergaenzt: true });
    dividenden.sort(function (x, y) { return aufsteigend(x.exTag, y.exTag); });
  }
  var r = Object.assign({}, spyReihe, { dividenden: dividenden });
  r.ergaenzung = { yahooFuehrtSatz: hat, ergaenzt: !hat };
  return r;
}

// Baut aus geparsten Reihen {SYM: reihe} die Rechendaten; Kalender = Tage der SPY-Reihe (ZUSATZ §1.6).
function baueDaten(reihen) {
  if (!reihen[K.MASSSTAB]) throw new Error('SPY fehlt');
  var spyR = spyMitErgaenzung(reihen[K.MASSSTAB]);
  var kalender = spyR.zeilen.map(function (z) { return z.tag; });
  var kalTs = kalender.map(tagMs);
  var fonds = {};
  K.UNIVERSUM.forEach(function (s) { if (reihen[s]) fonds[s] = bereiteVor(reihen[s], kalender); });
  var spy = bereiteVor(spyR, kalender);
  spy.ergaenzung = spyR.ergaenzung;
  var index = new Map();
  kalender.forEach(function (t, i) { index.set(t, i); });
  return { kalender: kalender, kalTs: kalTs, index: index, fonds: fonds, spy: spy, reihen: reihen };
}

// ---------------------------------------------------------------- Regel: Zielfunktion (REGEL A.1–A.3, C.3, C.5)

function pruefeFonds(r, nowMs, umsatzMin) {
  if (!Array.isArray(r)) return { ok: false, grund: 'nicht im Panel' };
  // kein Blick voraus: nur Zeilen mit Zeitstempel ≤ nowMs, auch für die Mindestlänge (REGEL C.5)
  var z = r.filter(function (x) { return x[0] <= nowMs; }).sort(function (x, y) { return x[0] - y[0]; });
  if (z.length < K.MINDESTZEILEN) return { ok: false, grund: 'zu kurz', zeilen: z.length };
  var i = z.length - 1;
  if (nowMs - z[i][0] > K.VERALTET_TAGE * TAG_MS) return { ok: false, grund: 'veraltet' };
  var p1 = z[i][1], p0 = z[i - K.RUECKBLICK][1];
  if (!istKurs(p1) || !istKurs(p0)) return { ok: false, grund: 'Kurs nicht positiv' };
  if (z[i][0] - z[i - K.RUECKBLICK][0] > K.LUECKE_TAGE * TAG_MS) return { ok: false, grund: 'Lücke in der Reihe' };
  var u = [];
  for (var j = i - K.UMSATZ_BALKEN + 1; j <= i; j++) {
    var kurs = z[j][1], stueck = z[j][2];
    // LESART 6: Balken ohne Stückzahl → Umsatz 0
    u.push((typeof stueck === 'number' && isFinite(stueck) && typeof kurs === 'number' && isFinite(kurs)) ? kurs * stueck : 0);
  }
  u.sort(function (a, b) { return a - b; });
  var median = u[u.length >> 1]; // sortiert[n >> 1], der obere der beiden mittleren
  if (!(median >= umsatzMin)) return { ok: false, grund: 'Umsatz unter Schwelle', umsatz: median };
  return { ok: true, staerke: p1 / p0 - 1, umsatz: median };
}

function zielfunktion(rohMap, nowMs, opts) {
  opts = opts || {};
  var umsatzMin = typeof opts.umsatzMin === 'number' ? opts.umsatzMin : K.UMSATZ_MIN;
  var zul = [], verworfen = {};
  K.UNIVERSUM.forEach(function (sym) {
    var p = pruefeFonds(rohMap ? rohMap[sym] : undefined, nowMs, umsatzMin);
    if (p.ok) zul.push({ sym: sym, staerke: p.staerke, umsatz: p.umsatz });
    else verworfen[sym] = p.grund;
  });
  var rang = zul.slice().sort(function (a, b) {
    if (a.staerke !== b.staerke) return b.staerke - a.staerke; // absteigend
    return aufsteigend(a.sym, b.sym);                          // Gleichstand: Kürzel aufsteigend
  });
  var zuWenig = zul.length < K.MINDEST_ZULAESSIG;
  return {
    ziel: zuWenig ? [] : rang.slice(0, K.ZIELZAHL).map(function (z) { return z.sym; }),
    zuWenig: zuWenig, zulaessig: zul.length, rangfolge: rang, verworfen: verworfen
  };
}

// ---------------------------------------------------------------- Placebo (REGEL B, C.6)

function fnv1a32(s) {
  var h = 0x811c9dc5;
  for (var i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}
// mulberry32, die übliche JavaScript-Fassung
function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
// Fisher-Yates: für i von n−1 abwärts bis 1: j = floor(zufall() × (i+1)), tausche i und j
function mische(arr, zufall) {
  var a = arr.slice();
  for (var i = a.length - 1; i >= 1; i--) {
    var j = Math.floor(zufall() * (i + 1));
    var t = a[i]; a[i] = a[j]; a[j] = t;
  }
  return a;
}
function placeboZiel(rohMap, nowMs, opts) {
  var basis = zielfunktion(rohMap, nowMs, opts); // dieselbe Zulässigkeit und dieselbe Mindestzahl
  var stichtag = msTag(nowMs); // LESART 12: Stichtag als JJJJ-MM-TT, FNV-1a über die Codeeinheiten (ASCII)
  var wort = K.PLACEBO_WORT + '|' + stichtag;
  var seed = fnv1a32(wort);
  if (basis.zuWenig) return Object.assign({}, basis, { ziel: [], seed: seed, wort: wort });
  var syms = basis.rangfolge.map(function (z) { return z.sym; }).sort(aufsteigend);
  var folge = mische(syms, mulberry32(seed));
  return Object.assign({}, basis, { ziel: folge.slice(0, K.ZIELZAHL), seed: seed, wort: wort, folge: folge });
}

// ---------------------------------------------------------------- Mechanik „Gleichgewicht" (korb-REGEL §1.5, C.3)

// buch = { bargeld, pos: Map(sym → Stück) } wird verändert; kursVon(sym) → Eröffnungskurs oder null
function gleichgewicht(buch, ziel, kursVon, kostenBp) {
  var kq = kostenBp / 10000;
  var verkaufFaktor = 1 - kq; // 0,998
  var kaufFaktor = 1 + kq;    // 1,002
  function kurs(s) { var p = kursVon(s); return istKurs(p) ? p : null; }
  function wertZuEroeffnung() {
    var w = buch.bargeld; // LESART 14: Bargeld zuerst, dann Positionen in Buchfolge
    buch.pos.forEach(function (st, s) { var p = kurs(s); if (p !== null) w += st * p; });
    return w;
  }
  var depotwert = wertZuEroeffnung(); // LESART 2: ungerundet; Positionen ohne Kurs zählen nicht
  var budget = depotwert / ziel.length;
  var istZiel = new Set(ziel);
  var handel = [];
  var volumen = 0;
  // zuerst die Verkäufe (LESART 4: ein Durchgang in Buchfolge)
  Array.from(buch.pos.entries()).forEach(function (e) {
    var s = e[0], st = e[1], p = kurs(s);
    if (p === null) return; // ohne Kurs gehalten
    if (!istZiel.has(s)) {
      var v = st * p;
      buch.bargeld += v * verkaufFaktor;
      buch.pos.delete(s);
      volumen += v;
      handel.push({ sym: s, art: 'verkauf', stueck: st, kurs: p, volumen: v });
      return;
    }
    var w = st * p;
    if (w > budget) {
      var n = rund4((w - budget) / p);
      if (n > st) n = st;
      if (n > 0) {
        var v2 = n * p;
        buch.bargeld += v2 * verkaufFaktor;
        var rest = rund4(st - n); // LESART 3
        if (rest > 0) buch.pos.set(s, rest); else buch.pos.delete(s);
        volumen += v2;
        handel.push({ sym: s, art: 'teilverkauf', stueck: n, kurs: p, volumen: v2 });
      }
    }
  });
  // dann die Käufe in der Reihenfolge der Zielliste
  ziel.forEach(function (s) {
    var p = kurs(s);
    if (p === null) return; // Ziel ohne Eröffnungskurs: nicht gehandelt, Anteil bleibt Bargeld
    var st = buch.pos.get(s) || 0;
    var w = st * p;
    if (!(w < budget)) return;
    var n = rund4((budget - w) / p);
    var verkleinert = false;
    // LESART 5: reicht das Bargeld nicht, abgerundet auf vier Stellen, was das Bargeld samt Kosten trägt
    if (n > 0 && n * p * kaufFaktor > buch.bargeld) { n = ab4(buch.bargeld / (p * kaufFaktor)); verkleinert = true; }
    if (n > 0) {
      var v = n * p;
      buch.bargeld -= v * kaufFaktor;
      buch.pos.set(s, rund4(st + n));
      volumen += v;
      handel.push({ sym: s, art: st > 0 ? 'aufstockung' : 'kauf', stueck: n, kurs: p, volumen: v, verkleinert: verkleinert });
    }
  });
  var nachher = wertZuEroeffnung();
  return { depotwert: depotwert, budget: budget, wertNach: nachher, kosten: depotwert - nachher, volumen: volumen, handel: handel };
}

// LESART 1: bewerte = Summe einmal auf Cent
function bewerte(buch, kursVon) {
  var w = buch.bargeld;
  buch.pos.forEach(function (st, s) { w += st * kursVon(s); });
  return cent(w);
}

// ---------------------------------------------------------------- Maßstab SPY (Grundregel §1.6, C.3; ZUSATZ §1.7)

// art 'eroeffnung': Kauf zur Eröffnung von s; 'schluss': Kauf zum Schluss von s. Ausschüttungen mit Buchungstag nach s,
// Wiederanlage am Ex-Tag zum Schluss.
function spyNachlauf(daten, s, e, art, start) {
  var spy = daten.spy;
  start = typeof start === 'number' ? start : K.STARTKAPITAL;
  var kauf = art === 'schluss' ? spy.closeAt[s] : spy.openAt[s];
  if (!istKurs(kauf)) throw new Error('SPY ohne Kaufkurs am ' + daten.kalender[s]);
  var anteile = start / kauf; // LESART 8: ungerundet, ohne Kosten
  var werte = [], aus = [];
  for (var t = s; t <= e; t++) {
    var L = t > s ? spy.divAm.get(t) : null;
    if (L) {
      L.forEach(function (d) {
        var g = anteile * d.basis * d.satz;
        anteile += g / spy.closeAt[t];
        aus.push({ tag: daten.kalender[t], exTag: d.exTag, betragJeAnteil: d.betrag, gutschrift: g, ergaenzt: d.ergaenzt });
      });
    }
    werte.push(anteile * spy.closeAt[t]);
  }
  return { werte: werte, ausschuettungen: aus, anteileEnde: anteile, kaufkurs: kauf };
}

// ---------------------------------------------------------------- Nachlauf des Buchs (Grundregel §1.3–1.8, ZUSATZ §2)

function rohMapAm(daten, st) {
  var m = {};
  K.UNIVERSUM.forEach(function (s) {
    var F = daten.fonds[s];
    if (!F) return; // fehlt die Reihe ganz → „nicht im Panel"
    var idx = F.rowAt[st];
    // ZUSATZ §1.7: die letzten 253 Zeilen bis einschließlich Stichtag
    m[s] = idx < 0 ? [] : F.roh.slice(Math.max(0, idx - K.RUECKBLICK), idx + 1);
  });
  return m;
}

function simuliere(daten, opt) {
  var s = opt.s, e = opt.e, modus = opt.modus || 'regel';
  var halten = opt.halten || K.HALTEN;
  var kal = daten.kalender, kalTs = daten.kalTs, fonds = daten.fonds;
  if (!(s >= 1 && e >= s && e < kal.length)) throw new Error('Fenster ungültig');
  var buch = { bargeld: K.STARTKAPITAL, pos: new Map() };
  var spyLauf = spyNachlauf(daten, s, e, 'eroeffnung'); // LESART 9: Kauf am ersten Fenstertag
  var naechster = s;
  var umschichtungen = [], ausgefuehrt = [], ausschuettungen = [], tage = [], reihenenden = [], zuWenigTage = [];
  var schlussVon = function (t) { return function (sym) { return fonds[sym].closeAt[t]; }; };
  for (var t = s; t <= e; t++) {
    // (1) Reihenende (bei den Fonds nicht erwartet; eine Lücke ist kein Ende). LESART 13: letzter Schluss, ohne Kosten
    Array.from(buch.pos.entries()).forEach(function (en) {
      var F = fonds[en[0]];
      if (F.letzteZeileTag < kal[t]) {
        var letzterSchluss = F.zeilen[F.zeilen.length - 1].close;
        buch.bargeld += en[1] * letzterSchluss;
        buch.pos.delete(en[0]);
        reihenenden.push({ tag: kal[t], sym: en[0], stueck: en[1], kurs: letzterSchluss });
      }
    });
    // (2) Ausschüttungen des Tages ermitteln: Anspruch nach der Stückzahl über die Nacht (vor dem Handel)
    var faellig = [];
    buch.pos.forEach(function (st, sym) {
      var L = fonds[sym].divAm.get(t);
      if (L) L.forEach(function (d) {
        faellig.push({ tag: kal[t], fonds: sym, exTag: d.exTag, stueck: st, betragJeAnteil: d.betrag, basis: d.basis, satz: d.satz, betrag: st * d.basis * d.satz });
      });
    });
    // (3) Umschichtung zur Eröffnung, wenn Ausführungstag
    if (t === naechster) {
      var st = t - 1;
      var nowMs = kalTs[st];
      var roh = rohMapAm(daten, st);
      var z = modus === 'placebo' ? placeboZiel(roh, nowMs) : zielfunktion(roh, nowMs);
      if (z.zuWenig) {
        zuWenigTage.push({ tag: kal[t], stichtag: kal[st], zulaessig: z.zulaessig });
        naechster = t + 1; // am nächsten Handelstag neu versuchen
      } else {
        var kursVon = (function (tt) { return function (sym) { return fonds[sym] ? fonds[sym].openAt[tt] : null; }; })(t);
        var vorPos = {};
        buch.pos.forEach(function (v, k) { vorPos[k] = v; });
        var bargeldVor = buch.bargeld;
        var r = gleichgewicht(buch, z.ziel, kursVon, K.KOSTEN_BP);
        var nachPos = {};
        buch.pos.forEach(function (v, k) { nachPos[k] = v; });
        var u = {
          nr: umschichtungen.length + 1, ausfuehrungstag: kal[t], stichtag: kal[st], ziel: z.ziel.slice(),
          zulaessig: z.zulaessig, verworfen: z.verworfen,
          rangfolge: z.rangfolge.map(function (x) { return { sym: x.sym, staerke: x.staerke, umsatz: x.umsatz }; }),
          stueckVor: vorPos, bargeldVor: bargeldVor,
          stueckNachHandel: nachPos, bargeld: buch.bargeld,
          depotwertEroeffnung: r.depotwert, budget: r.budget, kosten: r.kosten, volumen: r.volumen,
          kostenKlinke: Math.abs(r.kosten - 0.002 * r.volumen) < 1e-6,
          handel: r.handel,
          zieleOhneKurs: z.ziel.filter(function (sym) { return !istKurs(kursVon(sym)); }),
          positionenOhneKurs: Object.keys(vorPos).filter(function (sym) { return !istKurs(kursVon(sym)); })
        };
        if (modus === 'placebo') { u.seed = z.seed; u.wort = z.wort; u.folge = z.folge; }
        umschichtungen.push(u);
        ausgefuehrt.push(t);
        naechster = t + halten;
      }
    }
    // (4) Ausschüttungen gutschreiben (nach dem Handel des Tages)
    faellig.forEach(function (f) { buch.bargeld += f.betrag; ausschuettungen.push(f); });
    // (5) SPY steht in spyLauf; (6) Bewertung zum Schluss
    var wert = bewerte(buch, schlussVon(t));
    var pos = {};
    buch.pos.forEach(function (v, k) { pos[k] = v; });
    tage.push({ tag: kal[t], buch: wert, spy: spyLauf.werte[t - s], bargeld: buch.bargeld, positionen: pos });
  }
  return {
    s: s, e: e, modus: modus, tage: tage, umschichtungen: umschichtungen, ausgefuehrt: ausgefuehrt,
    ausschuettungen: ausschuettungen, spyAusschuettungen: spyLauf.ausschuettungen, spyKaufkurs: spyLauf.kaufkurs,
    reihenenden: reihenenden, zuWenigTage: zuWenigTage
  };
}

// ---------------------------------------------------------------- Auswertung (Perioden, p. a.)

function proJahr(endwert, start, tage) {
  return Math.pow(endwert / start, 365.25 / tage) - 1;
}

function auswerten(daten, sim) {
  var kal = daten.kalender, s = sim.s, e = sim.e;
  var tw = sim.tage;
  var wertAm = function (t) { return tw[t - s]; };
  // LESART 10: Periodengrenzen = ausgeführte Umschichtungen; Werte aus den Tageswerten (Buch auf Cent)
  var perioden = sim.ausgefuehrt.map(function (a, j) {
    var naechste = sim.ausgefuehrt[j + 1];
    var endIdx = naechste !== undefined ? naechste - 1 : e;
    var buchA = j === 0 ? K.STARTKAPITAL : wertAm(a - 1).buch;
    var spyA = j === 0 ? K.STARTKAPITAL : wertAm(a - 1).spy;
    var buchE = wertAm(endIdx).buch, spyE = wertAm(endIdx).spy;
    var rb = buchE / buchA - 1, rs = spyE / spyA - 1;
    return {
      nr: j + 1, ausfuehrungstag: kal[a], bezugstag: j === 0 ? null : kal[a - 1], endtag: kal[endIdx],
      // Handelstage der Periode: von a_j bis zum Tag vor a_{j+1}, die letzte bis zum Fensterende
      handelstage: naechste !== undefined ? naechste - a : e - a + 1,
      zulaessig: sim.umschichtungen[j].zulaessig, ziel: sim.umschichtungen[j].ziel,
      buchAnfang: buchA, buchEnde: buchE, spyAnfang: spyA, spyEnde: spyE,
      renditeBuch: rb, renditeSpy: rs, abstandPp: (rb - rs) * 100
    };
  });
  var tageKal = (daten.kalTs[e] - daten.kalTs[s]) / TAG_MS;
  var buchEnde = tw[tw.length - 1].buch;
  var spyEnde = tw[tw.length - 1].spy;
  var paB = proJahr(buchEnde, K.STARTKAPITAL, tageKal), paS = proJahr(spyEnde, K.STARTKAPITAL, tageKal);
  var kosten = sim.umschichtungen.reduce(function (a, u) { return a + u.kosten; }, 0);
  var volumen = sim.umschichtungen.reduce(function (a, u) { return a + u.volumen; }, 0);
  var gezahlt = sim.ausschuettungen.reduce(function (a, d) { return a + d.betrag; }, 0);
  return {
    modus: sim.modus, k: 0, ersterTag: kal[s], endtag: kal[e], handelstage: e - s + 1, kalendertage: tageKal,
    endwertBuch: buchEnde, endwertSpy: spyEnde, endwertSpyCent: cent(spyEnde),
    buchVorn: buchEnde > spyEnde,
    gesamtBuchProzent: (buchEnde / K.STARTKAPITAL - 1) * 100, gesamtSpyProzent: (spyEnde / K.STARTKAPITAL - 1) * 100,
    paBuchProzent: paB * 100, paSpyProzent: paS * 100, abstandPpPa: (paB - paS) * 100,
    spyKaufkurs: sim.spyKaufkurs,
    zahlUmschichtungen: sim.umschichtungen.length, zuWenigTage: sim.zuWenigTage.length, zuWenigListe: sim.zuWenigTage,
    // ZUSATZ §2.3 / REGEL C.2: Anteil zuWenig an (Umschichtungen + zuWenig-Tage) über 5 % → „nicht ausführbar“
    anteilZuWenig: (sim.umschichtungen.length + sim.zuWenigTage.length) ? sim.zuWenigTage.length / (sim.umschichtungen.length + sim.zuWenigTage.length) : 1,
    nichtAusfuehrbar: (sim.umschichtungen.length + sim.zuWenigTage.length) === 0 || sim.zuWenigTage.length / (sim.umschichtungen.length + sim.zuWenigTage.length) > 0.05,
    kostenSumme: kosten, volumenSumme: volumen, ausschuettungenBuchSumme: gezahlt,
    zahlAusschuettungenBuch: sim.ausschuettungen.length, zahlAusschuettungenSpy: sim.spyAusschuettungen.length,
    reihenenden: sim.reihenenden,
    zahlPerioden: perioden.length,
    umschichtungen: sim.umschichtungen,
    perioden: perioden,
    ausschuettungen: sim.ausschuettungen,
    spyAusschuettungen: sim.spyAusschuettungen,
    tageswerte: tw.map(function (x) { return { datum: x.tag, buch: x.buch, spy: x.spy, bargeld: x.bargeld }; })
  };
}

function fuehreLaeufeAus(daten, fensterDefs) {
  var laeufe = {};
  Object.keys(fensterDefs).forEach(function (name) {
    var f = fensterDefs[name];
    var s = daten.index.get(f.von), e = daten.index.get(f.bis);
    if (s === undefined || e === undefined) throw new Error('Fenster ' + name + ': Tag nicht im Kalender');
    ['regel', 'placebo'].forEach(function (modus) {
      laeufe[name + '-' + modus] = auswerten(daten, simuliere(daten, { s: s, e: e, modus: modus }));
    });
  });
  var vergleich = {};
  Object.keys(fensterDefs).forEach(function (name) {
    var r = laeufe[name + '-regel'], p = laeufe[name + '-placebo'];
    vergleich[name] = {
      regel: { buch: r.endwertBuch, spy: r.endwertSpyCent, buchVorn: r.buchVorn, abstandPpPa: r.abstandPpPa },
      placebo: { buch: p.endwertBuch, spy: p.endwertSpyCent, buchVorn: p.buchVorn, abstandPpPa: p.abstandPpPa },
      regelVorPlacebo: r.endwertBuch > p.endwertBuch,
      abstandRegelMinusPlaceboPpPa: r.paBuchProzent - p.paBuchProzent
    };
  });
  return { laeufe: laeufe, vergleich: vergleich };
}

// ---------------------------------------------------------------- Laden und Klinken

function datenOrdner(argv) {
  var i = argv.indexOf('--daten');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return process.env.SEKTOR_DATEN || K.DATEN_VORGABE;
}

function ladeDaten(ordner) {
  var reihen = {}, dateien = {};
  K.UNIVERSUM.concat([K.MASSSTAB]).forEach(function (sym) {
    var p = path.join(ordner, sym + '.json');
    if (!fs.existsSync(p)) return;
    var buf = fs.readFileSync(p); // nur lesen, Rohdaten bleiben unverändert
    dateien[sym] = { sha256: crypto.createHash('sha256').update(buf).digest('hex'), bytes: buf.length };
    reihen[sym] = leseYahoo(JSON.parse(buf.toString('utf8')), sym);
  });
  var daten = baueDaten(reihen);
  daten.dateien = dateien;
  daten.ordner = ordner;
  return daten;
}

function klinke(liste, name, ist, soll, ok) {
  liste.push({ name: name, ist: ist, soll: soll, ok: !!ok });
}

function pruefeKlinken(daten, pruefsummen) {
  var L = [];
  // 1. Prüfsummen je Datei
  var alle = K.UNIVERSUM.concat([K.MASSSTAB]);
  alle.forEach(function (sym) {
    var soll = pruefsummen && pruefsummen.dateien && pruefsummen.dateien[sym];
    var ist = daten.dateien && daten.dateien[sym];
    var r = daten.reihen[sym];
    if (!soll || !ist || !r) { klinke(L, sym + ' Datei vorhanden', !!ist, true, false); return; }
    klinke(L, sym + ' sha256', ist.sha256.slice(0, 16) + '…', soll.sha256.slice(0, 16) + '…', ist.sha256 === soll.sha256);
    klinke(L, sym + ' bytes', ist.bytes, soll.bytes, ist.bytes === soll.bytes);
    // LESART 11: „zeilen“ = Zahl der Zeitstempel der Rohantwort
    klinke(L, sym + ' zeilen', r.meta.zeitstempel, soll.zeilen, r.meta.zeitstempel === soll.zeilen);
    klinke(L, sym + ' erster/letzter Tag', r.meta.ersterTag + '/' + r.meta.letzterTag, soll.ersterTag + '/' + soll.letzterTag,
      r.meta.ersterTag === soll.ersterTag && r.meta.letzterTag === soll.letzterTag);
    klinke(L, sym + ' Ausschüttungen/Splits', r.meta.ausschuettungen + '/' + r.meta.splits, soll.ausschuettungen + '/' + soll.splits,
      r.meta.ausschuettungen === soll.ausschuettungen && r.meta.splits === soll.splits);
    klinke(L, sym + ' meta.symbol', r.meta.symbol, sym, r.meta.symbol === sym);
  });
  // Tagesbildung (Bericht, Erwartung 0)
  alle.forEach(function (sym) {
    var r = daten.reihen[sym];
    if (!r) return;
    var nk = sym === K.MASSSTAB ? 0 : (daten.fonds[sym] ? daten.fonds[sym].nichtImKalender : 0);
    var z = r.zaehler;
    klinke(L, sym + ' Tagesbildung (ohne Schluss, doppelt verschieden, Zeilen ohne SPY-Tag)', z.ohneSchluss + '/' + z.doppeltVerschieden + '/' + nk, '0/0/0',
      z.ohneSchluss === 0 && z.doppeltVerschieden === 0 && nk === 0);
  });
  // 2. Kalender
  var kal = daten.kalender;
  ['A', 'B'].forEach(function (n) {
    var f = FENSTER[n];
    var s = daten.index.get(f.von), e = daten.index.get(f.bis);
    var tage = (s !== undefined && e !== undefined) ? e - s + 1 : null;
    klinke(L, 'Kalender ' + n + ' ' + f.von + '–' + f.bis + ' Handelstage', tage, f.tage, tage === f.tage);
    klinke(L, 'Kalender ' + n + ' Handelstag vor ' + f.von, s !== undefined ? kal[s - 1] : null, f.stichtag, s !== undefined && kal[s - 1] === f.stichtag);
    if (tage !== null) {
      var voll = Math.floor((tage - 1) / K.HALTEN), rest = tage - voll * K.HALTEN;
      klinke(L, 'Perioden ' + n + ' bei k = 0 ohne zuWenig (voll + angebrochen, Tage der letzten)', (voll + 1) + ' (' + voll + ' + 1, ' + rest + ')',
        f.perioden + ' (' + f.voll + ' + 1, ' + f.rest + ')', voll + 1 === f.perioden && voll === f.voll && rest === f.rest);
    }
  });
  klinke(L, 'Kalender letzter Tag', kal[kal.length - 1], '2026-09-15', kal[kal.length - 1] === '2026-09-15');
  // 3. SPY-Ausschüttungen mit Ergänzung
  var spy = daten.spy;
  klinke(L, 'SPY Ergänzung 15.06.2018', spy.ergaenzung.yahooFuehrtSatz ? 'Yahoo führt den Satz (Yahoo-Betrag gilt)' : 'ergänzt 1,2456 $',
    'höchstens ein Satz am 15.06.2018', spy.dividendenListe.filter(function (d) { return d.exTag === K.SPY_ERGAENZUNG.exTag; }).length === 1);
  var zahlJeTag = {};
  spy.dividendenListe.forEach(function (d) { zahlJeTag[d.exTag] = (zahlJeTag[d.exTag] || 0) + 1; });
  var doppelt = Object.keys(zahlJeTag).filter(function (t) { return zahlJeTag[t] > 1; });
  klinke(L, 'SPY Ex-Tage mit mehr als einem Satz', doppelt.length, 0, doppelt.length === 0);
  var summe = {};
  ['A', 'B'].forEach(function (n) {
    var f = FENSTER[n];
    var im = spy.dividendenListe.filter(function (d) { return d.exTag > f.von && d.exTag <= f.bis; });
    summe[n] = im.reduce(function (a, d) { return a + d.betrag; }, 0);
    var soll = n === 'A' ? 18 : 20;
    klinke(L, 'SPY Ex-Tage ' + n + ' (nach ' + f.von + ' bis ' + f.bis + ')', im.length, soll, im.length === soll);
  });
  var jahre = [];
  for (var j = 2017; j <= 2025; j++) {
    var nJ = spy.dividendenListe.filter(function (d) { return d.exTag.slice(0, 4) === String(j); }).length;
    jahre.push(j + ':' + nJ);
  }
  klinke(L, 'SPY Ex-Tage je Kalenderjahr 2017–2025', jahre.join(' '), 'je 4', jahre.every(function (x) { return x.slice(-2) === ':4'; }));
  // 4. Pflichtprüfung ZUSATZ §1.9
  var pflicht = {};
  ['i', 'ii', 'iii'].forEach(function (k) {
    var p = PFLICHT[k];
    var s = daten.index.get(p.von), e = daten.index.get(p.bis);
    if (s === undefined || e === undefined) { klinke(L, 'Pflicht (' + k + ')', null, p.prozent, false); return; }
    var r = spyNachlauf(daten, s, e, p.art);
    var endwert = r.werte[r.werte.length - 1];
    var prozent = (endwert / K.STARTKAPITAL - 1) * 100;
    pflicht[k] = { endwert: endwert, endwertCent: cent(endwert), prozent: prozent, ausschuettungen: r.ausschuettungen.length };
    var ok = Math.abs(prozent - p.prozent) <= PFLICHT.TOL_PP;
    klinke(L, 'Pflicht (' + k + ') SPY ' + (p.art === 'schluss' ? 'Schluss ' : 'Eröffnung ') + p.von + ' → Schluss ' + p.bis,
      prozent.toFixed(4) + ' %' + (p.dollar ? ' / ' + cent(endwert).toFixed(2) + ' $' : '') + ' (Δ ' + (prozent - p.prozent).toFixed(4) + ' Pp)',
      p.prozent.toFixed(2) + ' %' + (p.dollar ? ' / ' + p.dollar.toFixed(2) + ' $' : '') + ' ±' + PFLICHT.TOL_PP + ' Pp', ok);
  });
  ['A', 'B'].forEach(function (n) {
    var ok = Math.abs(summe[n] - PFLICHT.iv[n]) <= PFLICHT.TOL_DOLLAR;
    pflicht['iv' + n] = summe[n];
    klinke(L, 'Pflicht (iv) SPY Ausschüttungen je Anteil ' + n, summe[n].toFixed(4) + ' $', PFLICHT.iv[n].toFixed(4) + ' $ ±0,01', ok);
  });
  return { ok: L.every(function (x) { return x.ok; }), liste: L, pflicht: pflicht };
}

function druckeKlinken(k) {
  k.liste.forEach(function (x) {
    console.log((x.ok ? 'OK    ' : 'FEHLER') + '  ' + x.name + ': ist ' + x.ist + ' | soll ' + x.soll);
  });
  console.log(k.ok ? 'Alle ' + k.liste.length + ' Klinken grün.' : 'KLINKEN VERFEHLT: ' + k.liste.filter(function (x) { return !x.ok; }).length + ' von ' + k.liste.length);
}

function main(argv) {
  var ordner = datenOrdner(argv);
  var pruefsummen = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefsummen.json'), 'utf8'));
  if (argv.indexOf('--nur-klinken') >= 0) {
    var daten = ladeDaten(ordner);
    var k = pruefeKlinken(daten, pruefsummen);
    druckeKlinken(k);
    return k.ok ? 0 : 1;
  }
  if (argv.indexOf('--lauf') >= 0) {
    var d = ladeDaten(ordner);
    var kl = pruefeKlinken(d, pruefsummen);
    druckeKlinken(kl);
    if (!kl.ok) { console.error('Abbruch: Klinken verfehlt, kein Lauf.'); return 1; }
    var erg = fuehreLaeufeAus(d, FENSTER);
    var ai = argv.indexOf('--aus');
    var aus = ai >= 0 && argv[ai + 1] ? argv[ai + 1] : path.join(__dirname, 'zweitrechner.json');
    var datei = {
      kennung: K.KENNUNG,
      erzeugt: new Date().toISOString(),
      hinweis: 'Zweiter, unabhängiger Rechner (ZUSATZ §6), gebaut nur aus REGEL.md, ZUSATZ.md und den Texten der Grundregel. Alles Simulation, keine Anlageberatung.',
      daten: { ordner: ordner, dateien: d.dateien },
      konstanten: K, fenster: FENSTER,
      lesarten: LESARTEN,
      klinken: kl.liste, pflichtpruefung: kl.pflicht,
      vergleich: erg.vergleich,
      laeufe: erg.laeufe
    };
    fs.writeFileSync(aus, JSON.stringify(datei, null, 1));
    Object.keys(erg.vergleich).forEach(function (n) {
      var v = erg.vergleich[n];
      console.log(n + ': Regel ' + v.regel.buch.toFixed(2) + ' $ / Placebo ' + v.placebo.buch.toFixed(2) + ' $ / SPY ' + v.regel.spy.toFixed(2) + ' $');
    });
    console.log('geschrieben: ' + aus);
    return 0;
  }
  console.log('Aufruf: node zweitrechner.js --nur-klinken | --lauf [--daten <ordner>] [--aus <datei>]');
  return 2;
}

module.exports = {
  K: K, FENSTER: FENSTER, PFLICHT: PFLICHT, LESARTEN: LESARTEN,
  tagMs: tagMs, msTag: msTag, nyTag: nyTag, rund4: rund4, ab4: ab4, cent: cent,
  leseYahoo: leseYahoo, baueDaten: baueDaten, ladeDaten: ladeDaten, spyMitErgaenzung: spyMitErgaenzung,
  pruefeFonds: pruefeFonds, zielfunktion: zielfunktion, placeboZiel: placeboZiel,
  fnv1a32: fnv1a32, mulberry32: mulberry32, mische: mische,
  gleichgewicht: gleichgewicht, bewerte: bewerte, spyNachlauf: spyNachlauf, rohMapAm: rohMapAm,
  simuliere: simuliere, auswerten: auswerten, fuehreLaeufeAus: fuehreLaeufeAus, pruefeKlinken: pruefeKlinken, main: main
};

if (require.main === module) {
  process.exitCode = main(process.argv.slice(2));
}
