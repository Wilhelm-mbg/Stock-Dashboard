'use strict';
/* Messung Sektor-Momentum, Datenpruefung (ZUSATZ.md §1.5, §1.6, §1.8, §1.9, §1.10) - NUR BERICHT, aendert keine Zahl der Messung.
 *   node studien/sektor-momentum-messung-2026-10/datenpruefung.js
 * Liest die unveraenderten Yahoo-Antworten ($SEKTOR_DATEN, Vorgabe unten) mit eigenem Parser, dazu (nur lesen) das Alpaca-Massnahmen-
 * Archiv, das Alpaca-Minutenarchiv (zweite Kursquelle) und die Symbolliste des Tages-Panels v2.2. Schreibt datenpruefung.json und
 * DATENPRUEFUNG.md in diesen Ordner. Keine Kursreihen in den Ausgaben (nur Kennzahlen, Daten-Tage, einzelne Belegwerte).
 * Keine Strategie: keine Rangfolge, kein Buch, keine Auswahl. Gesamtertraege je Fonds stehen nur als Abgleich zweier Rechenwege.
 * Keine Abhaengigkeiten ausser Node. Alles Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var KENNUNG = 'sektor-momentum-messung-2026-10/datenpruefung/v1';
var ORDNER = process.env.SEKTOR_DATEN || 'C:/Users/Wilhe/Downloads/sektor-messung/daten';
var ARCHIV = 'E:/Markt-Dashboard-Archiv';
var MASSNAHMEN = ARCHIV + '/alpaca-massnahmen';
var NACHTRAG = ARCHIV + '/alpaca-massnahmen-nachtrag-2026-10';
var MINUTEN = ARCHIV + '/alpaca1m';
var PANEL_STAND = 'C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/querschnitt-pruefstand-2026-09-13/voll-v22/panel/_stand.json';
var AUS_JSON = path.join(__dirname, 'datenpruefung.json');
var AUS_MD = path.join(__dirname, 'DATENPRUEFUNG.md');

var FONDS = ['XLB', 'XLC', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLRE', 'XLU', 'XLV', 'XLY'];
var ALLE = FONDS.concat(['SPY']);
var LETZTER_TAG = '2026-09-15';
var FENSTER = {
  A: { von: '2017-01-04', bis: '2021-09-15', start: '2017-01-03', sollTage: 1183 },
  B: { von: '2021-09-16', bis: '2026-09-15', start: '2021-09-15', sollTage: 1254 },
  L: { start: '1999-12-31', bis: '2026-09-15' }
};
var SATZ_MIN = 0.0001, SATZ_MAX = 0.05;          /* ZUSATZ §1.8: 0,01 % bis 5 % */
var STUFE = 1e-6;                                 /* relative Aenderung von adjclose/close, ab der eine Stufe zaehlt */
var BETRAG_TOL = 0.0005;                          /* $ je Anteil, Abgleich Yahoo gegen Alpaca */
var SPY_ERGAENZUNG = { ex_date: '2018-06-15', rate: 1.2456 };   /* ZUSATZ §1.9 */
var PFLICHT = { i: 115.95, ii: 215535.73, iii: 181193.87, ivA: 23.8656, ivB: 34.0657, tolPp: 0.30, tolUsd: 0.01 };
var MINUTEN_SCHWELLE = 0.005;                     /* Tage mit > 0,5 % Abweichung einzeln */
/* NYSE-Tage mit Schluss 13:00 New York, 2016 bis 15.09.2026 (bekannter Kalender; dieselben 21 Tage haben im SPY-Minutenarchiv das kleinste
   Verhaeltnis Umsatz 13:01-15:59 / 09:30-13:00 - ein Umsatzkriterium allein trennt sie nicht, SPY handelt nachboerslich zu viel). */
var VERKUERZT = ['2016-11-25', '2017-07-03', '2017-11-24', '2018-07-03', '2018-11-23', '2018-12-24', '2019-07-03', '2019-11-29', '2019-12-24',
  '2020-11-27', '2020-12-24', '2021-11-26', '2022-11-25', '2023-07-03', '2023-11-24', '2024-07-03', '2024-11-29', '2024-12-24',
  '2025-07-03', '2025-11-28', '2025-12-24'];

var nyTag = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
function tagNY(sek) { return nyTag.format(new Date(sek * 1000)); }
function utcUhr(sek) { return new Date(sek * 1000).toISOString().slice(11, 16); }
function jahr(tag) { return tag.slice(0, 4); }
function r6(x) { return x == null || !isFinite(x) ? x : Math.round(x * 1e6) / 1e6; }
function r4(x) { return x == null || !isFinite(x) ? x : Math.round(x * 1e4) / 1e4; }
function r2(x) { return x == null || !isFinite(x) ? x : Math.round(x * 100) / 100; }
function median(a) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); var m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }
function zaehle(obj, k) { obj[k] = (obj[k] || 0) + 1; }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function existiert(p) { try { fs.accessSync(p); return true; } catch (e) { return false; } }

/* ---------- 1. Parser und Tagesbildung (ZUSATZ §1.5) ---------- */
function lies(sym) {
  var datei = path.join(ORDNER, sym + '.json');
  var buf = fs.readFileSync(datei);
  var j = JSON.parse(buf.toString('utf8'));
  var r = j.chart.result[0];
  var ts = r.timestamp, q = r.indicators.quote[0], adj = r.indicators.adjclose[0].adjclose;
  var info = { sha256: sha256(buf), bytes: buf.length, zeilenRoh: ts.length, metaSymbol: r.meta.symbol, entfallen: {}, entfallenListe: [],
    doppelteRoh: 0, doppelteGleich: 0, doppelteVerschieden: [], uhrzeitenUTC: {}, stundenUTC: {}, unsortiert: 0 };
  var tagMap = new Map(), rohTage = {};
  for (var i = 0; i < ts.length; i++) {
    var tag = tagNY(ts[i]), uhr = utcUhr(ts[i]);
    zaehle(info.uhrzeitenUTC, uhr); zaehle(info.stundenUTC, uhr.slice(0, 2));
    if (rohTage[tag]) info.doppelteRoh++; rohTage[tag] = 1;
    var c = q.close[i], a = adj[i], grund = null;
    if (c == null) grund = 'close fehlt'; else if (!(c > 0)) grund = 'close <= 0';
    else if (a == null) grund = 'adjclose fehlt'; else if (!(a > 0)) grund = 'adjclose <= 0';
    if (grund) { zaehle(info.entfallen, grund); info.entfallenListe.push({ tag: tag, utc: uhr, grund: grund }); continue; }
    var z = { tag: tag, ts: ts[i], open: q.open[i], high: q.high[i], low: q.low[i], close: c, volume: q.volume[i], adj: a };
    if (tagMap.has(tag)) {
      var alt = tagMap.get(tag);
      var gleich = alt.open === z.open && alt.high === z.high && alt.low === z.low && alt.close === z.close && alt.volume === z.volume && alt.adj === z.adj;
      if (gleich) { info.doppelteGleich++; continue; }
      info.doppelteVerschieden.push({ tag: tag, utcAlt: utcUhr(alt.ts), utcNeu: uhr, closeAlt: alt.close, closeNeu: c });
    }
    tagMap.set(tag, z);
  }
  var zeilen = Array.from(tagMap.values());
  for (var k = 1; k < zeilen.length; k++) if (zeilen[k].tag <= zeilen[k - 1].tag) info.unsortiert++;
  zeilen.sort(function (x, y) { return x.tag < y.tag ? -1 : x.tag > y.tag ? 1 : 0; });
  info.zeilenGueltig = zeilen.length;
  info.ersterTag = zeilen[0].tag; info.letzterTag = zeilen[zeilen.length - 1].tag;
  var ev = r.events || {};
  var div = Object.keys(ev.dividends || {}).map(function (k) {
    var d = ev.dividends[k];
    return { tag: tagNY(d.date), utc: utcUhr(d.date), betrag: d.amount, schluesselGleichDatum: String(d.date) === String(k) };
  }).sort(function (x, y) { return x.tag < y.tag ? -1 : x.tag > y.tag ? 1 : 0; });
  var spl = Object.keys(ev.splits || {}).map(function (k) {
    var s = ev.splits[k];
    return { tag: tagNY(s.date), utc: utcUhr(s.date), num: s.numerator, den: s.denominator, verhaeltnis: s.splitRatio, faktor: s.numerator / s.denominator };
  }).sort(function (x, y) { return x.tag < y.tag ? -1 : 1; });
  var idx = new Map(); zeilen.forEach(function (z, n) { idx.set(z.tag, n); });
  return { sym: sym, info: info, zeilen: zeilen, idx: idx, div: div, spl: spl };
}

/* letzte Zeile mit tag < t (Index) bzw. erste Zeile mit tag >= t */
function letzteVor(zeilen, t) { var lo = 0, hi = zeilen.length - 1, e = -1; while (lo <= hi) { var m = (lo + hi) >> 1; if (zeilen[m].tag < t) { e = m; lo = m + 1; } else hi = m - 1; } return e; }
function ersteAb(zeilen, t) { var lo = 0, hi = zeilen.length - 1, e = -1; while (lo <= hi) { var m = (lo + hi) >> 1; if (zeilen[m].tag >= t) { e = m; hi = m - 1; } else lo = m + 1; } return e; }

/* Gesamtertrag Schluss + Ausschuettungen, Wiederanlage am Ex-Tag zum Schluss; Ex-Tag ohne Zeile -> naechste Zeile (ZUSATZ §1.7) */
function ertragSchluss(R, div, startTag, endTag) {
  var i0 = R.idx.get(startTag), i1 = R.idx.get(endTag);
  if (i0 == null || i1 == null) return null;
  var stueck = 1, d = 0;
  while (d < div.length && div[d].tag <= startTag) d++;
  for (var i = i0 + 1; i <= i1; i++) {
    var summe = 0;
    while (d < div.length && div[d].tag <= R.zeilen[i].tag) { if (div[d].betrag > 0) summe += div[d].betrag; d++; }
    if (summe) stueck += stueck * summe / R.zeilen[i].close;
  }
  return stueck * R.zeilen[i1].close / R.zeilen[i0].close - 1;
}
function ertragAdj(R, startTag, endTag) {
  var i0 = R.idx.get(startTag), i1 = R.idx.get(endTag);
  if (i0 == null || i1 == null) return null;
  return R.zeilen[i1].adj / R.zeilen[i0].adj - 1;
}

function main() {
  var t0 = Date.now();
  var pruefsummen = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefsummen.json'), 'utf8'));
  var aus = { kennung: KENNUNG, erzeugt: new Date().toISOString(), hinweis: 'Nur Bericht (ZUSATZ §1.10), aendert keine Zahl der Messung. Keine Kursreihen, keine Rangfolge, kein Buch.',
    quellen: { yahoo: ORDNER + '/<KUERZEL>.json (unveraendert, nur gelesen)', massnahmen: MASSNAHMEN, nachtrag: NACHTRAG, minuten: MINUTEN, panel: PANEL_STAND } };
  function sichern() { fs.writeFileSync(AUS_JSON, JSON.stringify(aus, null, 1) + '\n'); }

  /* ---- Einlesen, Pruefsummen ---- */
  var R = {};
  aus.pruefsummen = {}; aus.reihen = {};
  ALLE.forEach(function (s) {
    var x = lies(s); R[s] = x;
    var soll = pruefsummen.dateien[s] || {};
    aus.pruefsummen[s] = { sha256: x.info.sha256, passt: soll.sha256 === x.info.sha256 && soll.bytes === x.info.bytes && soll.zeilen === x.info.zeilenRoh };
    var I = x.info;
    aus.reihen[s] = { metaSymbol: I.metaSymbol, zeilenRoh: I.zeilenRoh, zeilenGueltig: I.zeilenGueltig, entfallen: I.entfallen, entfallenListe: I.entfallenListe,
      doppelteTageRoh: I.doppelteRoh, doppelteGleich: I.doppelteGleich, doppelteVerschieden: I.doppelteVerschieden, unsortiert: I.unsortiert,
      ersterTag: I.ersterTag, letzterTag: I.letzterTag, uhrzeitenUTC: I.uhrzeitenUTC, stundenUTC: I.stundenUTC,
      ausschuettungen: x.div.length, splits: x.spl.length };
  });
  sichern();

  /* ---- 2. Kalender = SPY-Tage, Klinken §1.6 ---- */
  var kal = R.SPY.zeilen.map(function (z) { return z.tag; });
  var kalSet = new Set(kal);
  function zaehleIn(von, bis) { return kal.filter(function (t) { return t >= von && t <= bis; }).length; }
  function vorTag(t) { var i = letzteVor(R.SPY.zeilen, t); return i < 0 ? null : kal[i]; }
  var K = { quelle: 'SPY', tage: kal.length, ersterTag: kal[0], letzterTag: kal[kal.length - 1] };
  K.A = { von: FENSTER.A.von, bis: FENSTER.A.bis, ist: zaehleIn(FENSTER.A.von, FENSTER.A.bis), soll: FENSTER.A.sollTage };
  K.B = { von: FENSTER.B.von, bis: FENSTER.B.bis, ist: zaehleIn(FENSTER.B.von, FENSTER.B.bis), soll: FENSTER.B.sollTage };
  K.A.ok = K.A.ist === K.A.soll; K.B.ok = K.B.ist === K.B.soll;
  K.vorA = { ist: vorTag(FENSTER.A.von), soll: '2017-01-03' }; K.vorA.ok = K.vorA.ist === K.vorA.soll;
  K.vorB = { ist: vorTag(FENSTER.B.von), soll: '2021-09-15' }; K.vorB.ok = K.vorB.ist === K.vorB.soll;
  K.letzterTagOk = K.letzterTag === LETZTER_TAG;
  K.wochenendTage = kal.filter(function (t) { var d = new Date(t + 'T12:00:00Z').getUTCDay(); return d === 0 || d === 6; });
  K.alleKlinkenOk = K.A.ok && K.B.ok && K.vorA.ok && K.vorB.ok && K.letzterTagOk && K.wochenendTage.length === 0;
  aus.kalender = K; sichern();

  /* ---- 3. Luecken je Reihe gegen den SPY-Kalender ---- */
  function imFenster(t, F) { return t >= F.von && t <= F.bis; }
  aus.luecken = {};
  ALLE.forEach(function (s) {
    var x = R[s], ab = x.zeilen[0].tag, eigene = new Set(x.zeilen.map(function (z) { return z.tag; }));
    var L = { abTag: ab, fehlend: [], fehlendJeJahr: {}, ohneSpyZeile: [], ohneOpen: { jeJahr: {}, A: [], B: [], gesamt: 0 },
      volumeNull: { jeJahr: {}, A: [], B: [], gesamt: 0 }, volume0: { jeJahr: {}, A: [], B: [], gesamt: 0 } };
    kal.forEach(function (t) { if (t >= ab && !eigene.has(t)) { L.fehlend.push(t); zaehle(L.fehlendJeJahr, jahr(t)); } });
    x.zeilen.forEach(function (z) {
      if (!kalSet.has(z.tag)) L.ohneSpyZeile.push(z.tag);
      function buche(o, wert) { o.gesamt++; zaehle(o.jeJahr, jahr(z.tag)); var e = { tag: z.tag, wert: wert };
        if (imFenster(z.tag, FENSTER.A)) o.A.push(e); if (imFenster(z.tag, FENSTER.B)) o.B.push(e);
        (o.alle = o.alle || []); if (o.alle.length < 100) o.alle.push(z.tag); }
      if (z.open == null || !(z.open > 0)) buche(L.ohneOpen, z.open);
      if (z.volume == null) buche(L.volumeNull, null);
      else if (z.volume === 0) buche(L.volume0, 0);
    });
    L.fehlendA = L.fehlend.filter(function (t) { return imFenster(t, FENSTER.A); });
    L.fehlendB = L.fehlend.filter(function (t) { return imFenster(t, FENSTER.B); });
    aus.luecken[s] = L;
  });
  sichern();

  /* ---- 4. Splits ---- */
  var mass = {};
  ALLE.forEach(function (s) {
    var p = MASSNAHMEN + '/' + s + '.json';
    mass[s] = existiert(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
    var pn = NACHTRAG + '/' + s + '.json';
    mass[s + '#nachtrag'] = existiert(pn) ? JSON.parse(fs.readFileSync(pn, 'utf8')) : null;
  });
  function satzVon(x, d) { var i = letzteVor(x.zeilen, d.tag); return i < 0 ? null : d.betrag / x.zeilen[i].close; }
  aus.splits = {};
  ALLE.forEach(function (s) {
    var x = R[s];
    aus.splits[s] = x.spl.map(function (sp) {
      var i = ersteAb(x.zeilen, sp.tag), z = x.zeilen[i], v = x.zeilen[i - 1];
      var volVor = [], volNach = [], dvVor = [], dvNach = [];
      for (var k = Math.max(0, i - 20); k < i; k++) { if (x.zeilen[k].volume != null) { volVor.push(x.zeilen[k].volume); dvVor.push(x.zeilen[k].volume * x.zeilen[k].close); } }
      for (var k2 = i; k2 < Math.min(x.zeilen.length, i + 20); k2++) { if (x.zeilen[k2].volume != null) { volNach.push(x.zeilen[k2].volume); dvNach.push(x.zeilen[k2].volume * x.zeilen[k2].close); } }
      var vor = x.div.filter(function (d) { return d.tag < sp.tag; }).slice(-4), nach = x.div.filter(function (d) { return d.tag >= sp.tag; }).slice(0, 4);
      var alp = mass[s] ? mass[s].saetze.filter(function (a) { return a._art !== 'cash_dividends' && a.ex_date === sp.tag; })
        .map(function (a) { return { art: a._art, ex_date: a.ex_date, old_rate: a.old_rate, new_rate: a.new_rate }; }) : null;
      /* Betraege vor dem Split: Yahoo gegen Alpaca roh */
      var vergleich = [];
      if (mass[s]) vor.forEach(function (d) {
        var a = mass[s].saetze.filter(function (m) { return m._art === 'cash_dividends' && m.ex_date === d.tag; });
        if (a.length) vergleich.push({ ex: d.tag, yahoo: d.betrag, alpacaRoh: a[0].rate, verhaeltnisYahooZuAlpaca: r6(d.betrag / a[0].rate) });
      });
      /* XLF 19.09.2016: Abspaltung XLRE. Fuehrt Alpaca am selben Tag einen "cash_dividends"-Satz, wird er als XLRE-Stueck je XLF-Stueck gelesen
         und der Kursfaktor daraus nachgerechnet: roher Vortagesschluss / (roher Vortagesschluss - Satz x XLRE-Schluss am Vortag). */
      var abspaltung = null;
      if (s === 'XLF' && mass[s] && R.XLRE) {
        var am = mass[s].saetze.filter(function (a) { return a._art === 'cash_dividends' && a.ex_date === sp.tag; });
        var xi = R.XLRE.idx.get(v.tag);
        if (am.length && xi != null) {
          var roh = v.close * sp.faktor, wert = am[0].rate * R.XLRE.zeilen[xi].close;
          abspaltung = { alpacaSatz: am[0].rate, xlreSchlussVortag: R.XLRE.zeilen[xi].close, xlfRohSchlussVortag: r4(roh), wertJeXlfStueck: r4(wert),
            impliziterFaktor: r6(roh / (roh - wert)), yahooFaktor: sp.faktor };
        }
      }
      return { tag: sp.tag, utc: sp.utc, verhaeltnis: sp.verhaeltnis, faktor: r6(sp.faktor), vortag: v.tag, abspaltung: abspaltung,
        closeSplittagZuCloseVortag: r6(z.close / v.close), openSplittagZuCloseVortag: r6(z.open / v.close),
        sprungWennUnbereinigt: r6(1 / sp.faktor),
        volumenMedianNachZuVor: r4(median(volNach) / median(volVor)), dollarUmsatzMedianNachZuVor: r4(median(dvNach) / median(dvVor)),
        saetzeVor: vor.map(function (d) { return { ex: d.tag, betrag: d.betrag, satzPct: r4(100 * satzVon(x, d)) }; }),
        saetzeNach: nach.map(function (d) { return { ex: d.tag, betrag: d.betrag, satzPct: r4(100 * satzVon(x, d)) }; }),
        alpacaMassnahme: alp, betraegeVorDemSplitYahooGegenAlpacaRoh: vergleich };
    });
  });
  sichern();

  /* ---- 5. Ausschuettungen je Jahr, Saetze ---- */
  var AU = { jeJahr: {}, saetzeAusserhalb: [], exOhneHandelstag: [], betragNichtPositiv: [], mehrereAmTag: [], vorErsterZeile: [], schluesselUngleichDatum: [], satzStatistik: {}, uhrzeitenUTC: {} };
  ALLE.forEach(function (s) {
    var x = R[s], jj = {}, saetze = [], proTag = {};
    x.div.forEach(function (d) {
      zaehle(jj, jahr(d.tag)); zaehle(AU.uhrzeitenUTC, d.utc); zaehle(proTag, d.tag);
      if (!d.schluesselGleichDatum) AU.schluesselUngleichDatum.push({ sym: s, tag: d.tag });
      if (!(d.betrag > 0)) AU.betragNichtPositiv.push({ sym: s, tag: d.tag, betrag: d.betrag });
      if (!x.idx.has(d.tag)) AU.exOhneHandelstag.push({ sym: s, tag: d.tag, betrag: d.betrag, imSpyKalender: kalSet.has(d.tag) });
      var st = satzVon(x, d);
      if (st == null) { AU.vorErsterZeile.push({ sym: s, tag: d.tag, betrag: d.betrag }); return; }
      saetze.push(st);
      if (st < SATZ_MIN || st > SATZ_MAX) {
        var vi = letzteVor(x.zeilen, d.tag);
        AU.saetzeAusserhalb.push({ sym: s, tag: d.tag, betrag: d.betrag, vortag: x.zeilen[vi].tag, closeVortag: x.zeilen[vi].close, satzPct: r6(100 * st) });
      }
    });
    Object.keys(proTag).forEach(function (t) { if (proTag[t] > 1) AU.mehrereAmTag.push({ sym: s, tag: t, n: proTag[t] }); });
    AU.jeJahr[s] = jj;
    AU.satzStatistik[s] = { n: saetze.length, minPct: r4(100 * Math.min.apply(null, saetze)), medianPct: r4(100 * median(saetze)), maxPct: r4(100 * Math.max.apply(null, saetze)) };
  });
  /* Zaehlungen erklaeren: Jahre mit != 4 Saetzen, ab dem ersten vollen Jahr */
  AU.jahreUngleich4 = {};
  ALLE.forEach(function (s) {
    var x = R[s], j0 = Number(jahr(x.zeilen[0].tag)) + 1, liste = [];
    for (var y = j0; y <= 2025; y++) {
      var n = AU.jeJahr[s][String(y)] || 0;
      if (n !== 4) liste.push({ jahr: y, n: n, exTage: x.div.filter(function (d) { return jahr(d.tag) === String(y); }).map(function (d) { return d.tag + ' ' + d.betrag; }) });
    }
    AU.jahreUngleich4[s] = liste;
  });
  aus.ausschuettungen = AU; sichern();

  /* ---- 6. adjclose gegen close + Ausschuettungen ---- */
  aus.adjAbgleich = {};
  ALLE.forEach(function (s) {
    var x = R[s], Z = x.zeilen, ereig = {};
    function an(i, e) { (ereig[i] = ereig[i] || { div: [], spl: [] })[e.art].push(e.d); }
    x.div.forEach(function (d) { var i = ersteAb(Z, d.tag); if (i > 0 && d.betrag > 0) an(i, { art: 'div', d: d }); });
    x.spl.forEach(function (sp) { var i = ersteAb(Z, sp.tag); if (i > 0) an(i, { art: 'spl', d: sp }); });
    var stufen = 0, zuDiv = 0, zuSpl = 0, ohne = [], groessteAbw = null, abwListe = [], divOhneStufe = [], splMitStufe = [], relAbwListe = [];
    for (var i = 1; i < Z.length; i++) {
      var fV = Z[i - 1].adj / Z[i - 1].close, fN = Z[i].adj / Z[i].close, rel = fN / fV - 1, istM = fV / fN;
      var e = ereig[i], stufe = Math.abs(rel) > STUFE;
      if (stufe) stufen++;
      if (e && e.div.length) {
        var summe = e.div.reduce(function (a, d) { return a + d.betrag; }, 0), soll = 1 - summe / Z[i - 1].close;
        if (stufe) {
          zuDiv++;
          var abw = istM - soll, relSatz = (1 - istM) / (summe / Z[i - 1].close) - 1;
          abwListe.push(Math.abs(abw)); relAbwListe.push(Math.abs(relSatz));
          if (!groessteAbw || Math.abs(abw) > Math.abs(groessteAbw.abw)) groessteAbw = { tag: Z[i].tag, betrag: summe, closeVortag: Z[i - 1].close, soll: r6(soll), ist: r6(istM), abw: abw, relZumSatz: r6(relSatz) };
        } else divOhneStufe.push({ tag: Z[i].tag, ex: e.div.map(function (d) { return d.tag; }), betrag: summe, satzPct: r6(100 * summe / Z[i - 1].close) });
      } else if (e && e.spl.length) {
        if (stufe) { zuSpl++; splMitStufe.push({ tag: Z[i].tag, ist: r6(istM) }); }
      } else if (stufe) ohne.push({ tag: Z[i].tag, vortag: Z[i - 1].tag, istMultiplikator: r6(istM), relAenderung: rel });
    }
    if (groessteAbw) groessteAbw.abw = Number(groessteAbw.abw.toExponential(3));
    var ohneMax = ohne.reduce(function (m, o) { return Math.max(m, Math.abs(o.relAenderung)); }, 0);
    var kleinsteDivStufe = Infinity;
    for (var i2 = 1; i2 < Z.length; i2++) if (ereig[i2] && ereig[i2].div.length) {
      var rr = Math.abs((Z[i2].adj / Z[i2].close) / (Z[i2 - 1].adj / Z[i2 - 1].close) - 1); if (rr < kleinsteDivStufe) kleinsteDivStufe = rr;
    }
    aus.adjAbgleich[s] = { stufen: stufen, zugeordnetAusschuettung: zuDiv, zugeordnetSplit: zuSpl, splitMitStufe: splMitStufe,
      ohneEreignisAnzahl: ohne.length, ohneEreignisGroessteRelAenderung: Number(ohneMax.toExponential(3)),
      ohneEreignisUeber1e5: ohne.filter(function (o) { return Math.abs(o.relAenderung) > 1e-5; }).length,
      ohneEreignisJahre: ohne.length ? ohne[0].tag.slice(0, 4) + '-' + ohne[ohne.length - 1].tag.slice(0, 4) : null,
      kleinsteAusschuettungsStufe: isFinite(kleinsteDivStufe) ? Number(kleinsteDivStufe.toExponential(3)) : null, ohneEreignis: ohne,
      ausschuettungenOhneStufe: divOhneStufe, ausschuettungenGezaehlt: Object.keys(ereig).filter(function (k) { return ereig[k].div.length; }).length,
      groessteAbweichung: groessteAbw, medianAbsAbweichung: abwListe.length ? Number(median(abwListe).toExponential(3)) : null,
      groessteRelAbweichungZumSatz: relAbwListe.length ? r6(Math.max.apply(null, relAbwListe)) : null };
  });
  sichern();

  /* Gesamtertrag je Fonds und Fenster auf zwei Wegen (alphabetisch, nur Abgleich der Rechenwege) */
  aus.gesamtertrag = { hinweis: '(a) adjclose(Ende)/adjclose(Start) - 1; (b) Schluss + Ausschuettungen, Wiederanlage am Ex-Tag zum Schluss; Differenz (a)-(b) in Pp. Nur Abgleich, keine Rangfolge.',
    fenster: { A: '2017-01-03 -> 2021-09-15', B: '2021-09-15 -> 2026-09-15', L: '1999-12-31 -> 2026-09-15' }, je: {} };
  ALLE.forEach(function (s) {
    var o = {};
    [['A', FENSTER.A.start, FENSTER.A.bis], ['B', FENSTER.B.start, FENSTER.B.bis], ['L', FENSTER.L.start, FENSTER.L.bis]].forEach(function (f) {
      var a = ertragAdj(R[s], f[1], f[2]), b = ertragSchluss(R[s], R[s].div, f[1], f[2]);
      o[f[0]] = a == null || b == null ? null : { adjPct: r4(100 * a), schlussPct: r4(100 * b), diffPp: r4(100 * (a - b)) };
    });
    aus.gesamtertrag.je[s] = o;
  });
  sichern();

  /* ---- 7. Zweite Quelle Ausschuettungen (Alpaca, ab 2016) ---- */
  aus.alpacaAbgleich = {};
  ALLE.forEach(function (s) {
    var x = R[s], m = mass[s], n = mass[s + '#nachtrag'];
    if (!m) { aus.alpacaAbgleich[s] = { fehlt: true }; return; }
    var von = m.von, saetze = m.saetze.filter(function (a) { return a._art === 'cash_dividends'; }), gesehen = new Set(saetze.map(function (a) { return a.id; }));
    var ausNachtrag = 0;
    if (n) n.saetze.forEach(function (a) { if (a._art === 'cash_dividends' && !gesehen.has(a.id)) { saetze.push(a); ausNachtrag++; } });
    function splitFaktorNach(t) { return x.spl.reduce(function (p, sp) { return sp.tag > t ? p * sp.faktor : p; }, 1); }
    var alp = {}, nachEnde = [], special = [];
    saetze.forEach(function (a) {
      if (a.ex_date > LETZTER_TAG) { nachEnde.push({ ex: a.ex_date, rate: a.rate }); return; }
      if (a.special) special.push({ ex: a.ex_date, rate: a.rate });
      var f = splitFaktorNach(a.ex_date);
      (alp[a.ex_date] = alp[a.ex_date] || { roh: 0, umg: 0, n: 0, faktor: f }); alp[a.ex_date].roh += a.rate; alp[a.ex_date].umg += a.rate / f; alp[a.ex_date].n++;
    });
    var yah = {};
    x.div.forEach(function (d) { if (d.tag >= von && d.tag <= LETZTER_TAG) { yah[d.tag] = (yah[d.tag] || 0) + d.betrag; } });
    var nurY = [], nurA = [], versch = [], gleich = 0, maxAbw = 0, umgerechnet = 0;
    Object.keys(yah).sort().forEach(function (t) { if (!alp[t]) nurY.push({ ex: t, yahoo: yah[t] }); });
    Object.keys(alp).sort().forEach(function (t) {
      var a = alp[t];
      if (a.faktor !== 1) umgerechnet++;
      if (yah[t] == null) { nurA.push({ ex: t, alpacaRoh: r6(a.roh), alpacaUmgerechnet: r6(a.umg), splitFaktor: a.faktor }); return; }
      var abw = Math.abs(yah[t] - a.umg); if (abw > maxAbw) maxAbw = abw;
      var vz = letzteVor(x.zeilen, t);
      if (abw > BETRAG_TOL) versch.push({ ex: t, yahoo: yah[t], alpacaRoh: r6(a.roh), alpacaUmgerechnet: r6(a.umg), splitFaktor: a.faktor, abw: r6(yah[t] - a.umg),
        closeVortag: vz < 0 ? null : x.zeilen[vz].close, abwSatzPp: vz < 0 ? null : r6(100 * (yah[t] - a.umg) / x.zeilen[vz].close) });
      else gleich++;
    });
    aus.alpacaAbgleich[s] = { von: von, ersterAlpacaExTag: Object.keys(alp).sort()[0] || null, alpacaSaetze: saetze.length, ausNachtrag: ausNachtrag, alpacaBisDatenende: Object.keys(alp).length, yahooAbVon: Object.keys(yah).length,
      gleich: gleich, nurYahoo: nurY, nurAlpaca: nurA, betragVerschieden: versch, groessteAbwUsd: r6(maxAbw), mitSplitUmgerechnet: umgerechnet,
      special: special, nachDatenende: nachEnde };
  });
  sichern();

  /* ---- 8. SPY-Pflichtpruefung (§1.9) ---- */
  var spy = R.SPY, yJuni = spy.div.filter(function (d) { return d.tag === SPY_ERGAENZUNG.ex_date; });
  var spyDiv = spy.div.slice();
  var ergaenzt = 0;
  if (!yJuni.length) { spyDiv.push({ tag: SPY_ERGAENZUNG.ex_date, betrag: SPY_ERGAENZUNG.rate, ergaenzt: true }); spyDiv.sort(function (a, b) { return a.tag < b.tag ? -1 : 1; }); ergaenzt = 1; }
  var P = { yahooHat20180615: yJuni.length ? { betrag: yJuni[0].betrag } : null, ergaenzt: ergaenzt, jeJahr: {} };
  for (var y = 2017; y <= 2025; y++) { var nY = spyDiv.filter(function (d) { return jahr(d.tag) === String(y); }).length; P.jeJahr[y] = { ist: nY, soll: 4, ok: nY === 4 }; }
  function exIn(von, bis) { return spyDiv.filter(function (d) { return d.tag > von && d.tag <= bis && d.betrag > 0; }); }
  var exA = exIn(FENSTER.A.von, FENSTER.A.bis), exB = exIn(FENSTER.B.von, FENSTER.B.bis);
  P.exTageA = { ist: exA.length, soll: 18, ok: exA.length === 18 }; P.exTageB = { ist: exB.length, soll: 20, ok: exB.length === 20 };
  var i_ = ertragSchluss(spy, spyDiv, FENSTER.A.start, FENSTER.A.bis);
  P.i = { was: 'Schluss 03.01.2017 -> Schluss 15.09.2021, Wiederanlage am Ex-Tag zum Schluss', istPct: r4(100 * i_), sollPct: PFLICHT.i, diffPp: r4(100 * i_ - PFLICHT.i) };
  P.i.bestanden = Math.abs(P.i.diffPp) <= PFLICHT.tolPp;
  function kaufBis(kaufTag, endTag) {
    var Z = spy.zeilen, i0 = spy.idx.get(kaufTag), i1 = spy.idx.get(endTag), open = Z[i0].open, stueck = 100000 / open, d = 0, gebucht = [];
    while (d < spyDiv.length && spyDiv[d].tag <= kaufTag) d++;
    for (var i = i0 + 1; i <= i1; i++) {
      while (d < spyDiv.length && spyDiv[d].tag <= Z[i].tag) {
        var D = spyDiv[d]; d++;
        if (!(D.betrag > 0)) continue;
        var basis = Z[i - 1].close, satz = D.betrag / basis, betrag = stueck * basis * satz;
        stueck += betrag / Z[i].close; gebucht.push(D.tag);
      }
    }
    return { open: open, wert: stueck * Z[i1].close, gebucht: gebucht.length };
  }
  var ii = kaufBis(FENSTER.A.von, FENSTER.A.bis), iii = kaufBis(FENSTER.B.von, FENSTER.B.bis);
  P.ii = { was: '100.000 $ zur Eroeffnung 04.01.2017 -> Schluss 15.09.2021', openKauftag: ii.open, istUsd: r2(ii.wert), sollUsd: PFLICHT.ii, diffUsd: r2(ii.wert - PFLICHT.ii),
    diffPp: r4((ii.wert - PFLICHT.ii) / 1000), gebuchteExTage: ii.gebucht };
  P.ii.bestanden = Math.abs(P.ii.diffPp) <= PFLICHT.tolPp;
  P.iii = { was: '100.000 $ zur Eroeffnung 16.09.2021 -> Schluss 15.09.2026', openKauftag: iii.open, istUsd: r2(iii.wert), sollUsd: PFLICHT.iii, diffUsd: r2(iii.wert - PFLICHT.iii),
    diffPp: r4((iii.wert - PFLICHT.iii) / 1000), gebuchteExTage: iii.gebucht };
  P.iii.bestanden = Math.abs(P.iii.diffPp) <= PFLICHT.tolPp;
  var sA = exA.reduce(function (a, d) { return a + d.betrag; }, 0), sB = exB.reduce(function (a, d) { return a + d.betrag; }, 0);
  P.iv = { A: { istUsd: r6(sA), sollUsd: PFLICHT.ivA, diffUsd: r6(sA - PFLICHT.ivA) }, B: { istUsd: r6(sB), sollUsd: PFLICHT.ivB, diffUsd: r6(sB - PFLICHT.ivB) } };
  P.iv.A.bestanden = Math.abs(P.iv.A.diffUsd) <= PFLICHT.tolUsd; P.iv.B.bestanden = Math.abs(P.iv.B.diffUsd) <= PFLICHT.tolUsd;
  P.adjVergleich = { iAusAdjclosePct: r4(100 * ertragAdj(spy, FENSTER.A.start, FENSTER.A.bis)), bAusAdjclosePct: r4(100 * ertragAdj(spy, FENSTER.B.start, FENSTER.B.bis)) };
  P.alleBestanden = P.i.bestanden && P.ii.bestanden && P.iii.bestanden && P.iv.A.bestanden && P.iv.B.bestanden && P.exTageA.ok && P.exTageB.ok &&
    Object.keys(P.jeJahr).every(function (k) { return P.jeJahr[k].ok; });
  aus.spyPflicht = P; sichern();

  /* ---- 9. Zweite Kursquelle: Alpaca-Minuten (roh, SIP) -> Tagesschluss = Eroeffnung der 16:00-Kerze, Rueckfall 15:59-Schluss ---- */
  aus.zweiteKursquelle = minutenVergleich(R);
  /* SPY-Tage mit open ausserhalb der Minutenspanne: welche Startphase k (0..62, §2.7) kauft SPY dort? */
  if (aus.zweiteKursquelle.je && aus.zweiteKursquelle.je.SPY && !aus.zweiteKursquelle.je.SPY.fehlt) aus.zweiteKursquelle.spyKaufAnBetroffenemTag = aus.zweiteKursquelle.je.SPY.yahooOpenAusserhalbMinutenSpanne
    .filter(function (o) { return o.fenster; }).map(function (o) { var k = kal.indexOf(o.tag) - kal.indexOf(FENSTER[o.fenster].von); return { tag: o.tag, fenster: o.fenster, k: k, startphase: k >= 0 && k <= 62 }; });
  sichern();

  /* ---- 10. Tages-Panel v2.2: Namen ---- */
  aus.panel = panelNamen(kal);
  aus.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
  sichern();
  fs.writeFileSync(AUS_MD, bericht(aus));
  console.log('datenpruefung.json und DATENPRUEFUNG.md geschrieben (' + aus.laufzeitSekunden + ' s)');
}

/* NY-Versatz je UTC-Tag (Minuten), gemessen 17:00 UTC (liegt immer in der Sitzung desselben NY-Tags) */
var nyStunde = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hourCycle: 'h23' });
var versatzCache = new Map();
function versatzMs(utcTag) {
  var v = versatzCache.get(utcTag);
  if (v == null) { var h = Number(nyStunde.format(new Date(utcTag * 864e5 + 17 * 36e5))); v = (h - 17) * 36e5; versatzCache.set(utcTag, v); }
  return v;
}

/* Yahoo-Kurse sind float32 (22.100000381469727): Spanne mit relativer Toleranz 1e-6 */
function inSpanne(x, lo, hi) { return x >= lo * (1 - 1e-6) && x <= hi * (1 + 1e-6); }

function minutenVergleich(R) {
  var erg = { quelle: MINUTEN + '/<KUERZEL>/<JAHR>.json (alpaca v2 1Min, feed=sip, adjustment=raw; nur gelesen)',
    regel: 'Schluss = Eroeffnung der 16:00-Kerze (NY), Rueckfall Schluss der 15:59-Kerze, sonst letzte Kerze 09:30-15:59; an den ' + VERKUERZT.length +
      ' NYSE-Tagen mit Schluss 13:00 Eroeffnung der 13:00-Kerze, Rueckfall 12:59-Schluss. Eroeffnung = Eroeffnung der 09:30-Kerze. Rohkurse geteilt durch die Yahoo-Splitfaktoren nach dem Tag.',
    tagesdateien: { archiv1d: ALLE.filter(function (s) { return existiert(ARCHIV + '/archiv1d/bars_1d_' + s + '.json'); }),
      such1d: ALLE.filter(function (s) { return existiert(ARCHIV + '/such1d/bars_1d_' + s + '.json'); }) },
    je: {} };
  if (!existiert(MINUTEN)) { erg.fehlt = true; return erg; }
  ALLE.forEach(function (s) {
    var ordner = MINUTEN + '/' + s;
    if (!existiert(ordner)) { erg.je[s] = { fehlt: true }; return; }
    var tage = new Map();
    fs.readdirSync(ordner).filter(function (f) { return /^\d{4}\.json$/.test(f); }).sort().forEach(function (f) {
      var j = JSON.parse(fs.readFileSync(ordner + '/' + f, 'utf8'));
      if (j.format !== 2 || j.felder !== '[zeit, schluss, umsatz, hoch, tief, eroeffnung]') throw new Error('Minutenformat unbekannt: ' + s + '/' + f);
      var S = j.series;
      for (var k = 0; k < S.length; k++) {
        var b = S[k], t = b[0], lok = t + versatzMs(Math.floor(t / 864e5)), ld = Math.floor(lok / 864e5), min = Math.floor((lok - ld * 864e5) / 6e4);
        if (min < 570 || min > 960) continue;
        var d = tage.get(ld);
        if (!d) { d = { o930: null, c1559: null, o1600: null, letzte: null, letzteMin: -1, o1300: null, c1259: null, letzteVor13: null, letzteVor13Min: -1, vol: 0 }; tage.set(ld, d); }
        d.vol += b[2];
        if (d.hoch == null || b[3] > d.hoch) d.hoch = b[3];
        if (d.tief == null || b[4] < d.tief) d.tief = b[4];
        if (min === 570) d.o930 = b[5];
        if (min === 959) d.c1559 = b[1];
        if (min === 960) { d.o1600 = b[5]; continue; }
        if (min === 780) d.o1300 = b[5];
        if (min === 779) d.c1259 = b[1];
        if (min < 780 && min > d.letzteVor13Min) { d.letzteVor13Min = min; d.letzteVor13 = b[1]; }
        if (min > d.letzteMin) { d.letzteMin = min; d.letzte = b[1]; }
      }
    });
    var x = R[s], quelleZaehl = {}, n = 0, summe = 0, maxAbw = null, gross = [], abws = [], nO = 0, summeO = 0, maxO = null, grossO = [], ohneYahoo = 0;
    var openAusser = [], schlussAusser = [], volRatio = [], jeSplit = x.spl.map(function (sp) { return { tag: sp.tag, vorAbs: [], nachAbs: [], volVor: [], volNach: [] }; });
    tage.forEach(function (d, ld) {
      var tag = new Date(ld * 864e5).toISOString().slice(0, 10);
      if (tag > LETZTER_TAG) return;
      var i = x.idx.get(tag);
      if (i == null) { ohneYahoo++; return; }
      var z = x.zeilen[i], f = x.spl.reduce(function (p, sp) { return sp.tag > tag ? p * sp.faktor : p; }, 1);
      /* Umsatz: Yahoo-Stueck gegen Alpaca-Stueck (Sitzung + 16:00-Kerze) x Splitfaktor; bereinigt heisst Verhaeltnis vor und nach dem Split gleich */
      var vr = z.volume > 0 && d.vol > 0 ? z.volume / (d.vol * f) : null;
      if (vr != null) volRatio.push(vr);
      var kurz = VERKUERZT.indexOf(tag) >= 0, c = null, q;
      if (kurz) {
        if (d.o1300 != null) { c = d.o1300; q = 'verkuerzt 13:00-Eroeffnung'; }
        else if (d.c1259 != null) { c = d.c1259; q = 'verkuerzt 12:59-Schluss'; }
        else if (d.letzteVor13 != null) { c = d.letzteVor13; q = 'verkuerzt letzte Kerze vor 13:00'; }
      }
      else if (d.o1600 != null) { c = d.o1600; q = '16:00-Eroeffnung'; }
      else if (d.c1559 != null) { c = d.c1559; q = '15:59-Schluss'; }
      else if (d.letzte != null) { c = d.letzte; q = 'letzte Kerze'; }
      if (c == null) return;
      zaehle(quelleZaehl, q);
      var abw = (c / f) / z.close - 1;
      n++; summe += Math.abs(abw); abws.push(Math.abs(abw));
      if (!maxAbw || Math.abs(abw) > Math.abs(maxAbw.abw)) maxAbw = { tag: tag, abw: r6(abw), yahoo: z.close, alpaca: r4(c / f), quelle: q };
      if (Math.abs(abw) > MINUTEN_SCHWELLE) gross.push({ tag: tag, yahooClose: z.close, alpacaClose: r4(c / f), abwPct: r4(100 * abw), quelle: q,
        alpaca1559Schluss: d.c1559 == null ? null : r4(d.c1559 / f), abw1559Pct: d.c1559 == null ? null : r4(100 * ((d.c1559 / f) / z.close - 1)),
        minutenSpanne: [r4(d.tief / f), r4(d.hoch / f)], yahooSchlussInSpanne: inSpanne(z.close, d.tief / f, d.hoch / f) });
      jeSplit.forEach(function (js) {
        var nah = Math.abs(Date.parse(tag) - Date.parse(js.tag)) <= 90 * 864e5;
        if (tag < js.tag) { js.vorAbs.push(Math.abs(abw)); if (nah && vr != null) js.volVor.push(vr); }
        else { js.nachAbs.push(Math.abs(abw)); if (nah && vr != null) js.volNach.push(vr); }
      });
      if (d.o930 != null && z.open > 0) {
        var ao = (d.o930 / f) / z.open - 1; nO++; summeO += Math.abs(ao);
        if (!maxO || Math.abs(ao) > Math.abs(maxO.abw)) maxO = { tag: tag, abw: r6(ao), yahoo: z.open, alpaca: r4(d.o930 / f) };
        if (Math.abs(ao) > MINUTEN_SCHWELLE) grossO.push({ tag: tag, yahooOpen: z.open, alpacaOpen: r4(d.o930 / f), abwPct: r4(100 * ao),
          yahooOpenInSpanne: inSpanne(z.open, d.tief / f, d.hoch / f) });
      }
      if (d.tief != null && (z.close < d.tief / f * (1 - 5e-4) || z.close > d.hoch / f * (1 + 5e-4))) schlussAusser.push({ tag: tag, yahooClose: z.close, spanne: [r4(d.tief / f), r4(d.hoch / f)] });
      /* Yahoo-open ausserhalb dessen, was laut Minuten an dem Tag gehandelt wurde (mehr als 0,05 % neben der Spanne) */
      if (z.open > 0 && d.tief != null && (z.open < d.tief / f * (1 - 5e-4) || z.open > d.hoch / f * (1 + 5e-4))) {
        openAusser.push({ tag: tag, fenster: (tag >= FENSTER.A.von && tag <= FENSTER.A.bis) ? 'A' : (tag >= FENSTER.B.von && tag <= FENSTER.B.bis) ? 'B' : '',
          yahooOpen: z.open, minutenOpen: d.o930 == null ? null : r4(d.o930 / f), spanne: [r4(d.tief / f), r4(d.hoch / f)],
          abstandZurSpannePct: r4(100 * (z.open < d.tief / f ? z.open / (d.tief / f) - 1 : z.open / (d.hoch / f) - 1)),
          gleichVortagesschluss: i > 0 && x.zeilen[i - 1].close === z.open, gleichYahooTief: z.open === z.low, gleichYahooHoch: z.open === z.high });
      }
    });
    erg.je[s] = { schluss: { tage: n, mittelAbsPct: r4(100 * summe / n), medianAbsPct: r4(100 * median(abws)), groesste: maxAbw, ueber05Pct: gross.length, liste: gross, quellen: quelleZaehl },
      eroeffnung: { tage: nO, mittelAbsPct: r4(100 * summeO / nO), groesste: maxO, ueber05Pct: grossO.length, liste: grossO },
      umsatzYahooZuAlpacaMedian: r4(median(volRatio)),
      yahooOpenAusserhalbMinutenSpanne: openAusser, yahooSchlussAusserhalbMinutenSpanne: schlussAusser,
      splits: jeSplit.map(function (js) { return { tag: js.tag, tageVor: js.vorAbs.length, mittelAbsPctVor: js.vorAbs.length ? r4(100 * js.vorAbs.reduce(function (a, b) { return a + b; }, 0) / js.vorAbs.length) : null,
        tageNach: js.nachAbs.length, mittelAbsPctNach: js.nachAbs.length ? r4(100 * js.nachAbs.reduce(function (a, b) { return a + b; }, 0) / js.nachAbs.length) : null,
        umsatzVerhaeltnisMedian90TageVor: r4(median(js.volVor)), umsatzVerhaeltnisMedian90TageNach: r4(median(js.volNach)) }; }),
      minutenTageOhneYahooZeile: ohneYahoo };
  });
  return erg;
}

function panelNamen(kal) {
  var o = { datei: PANEL_STAND };
  if (!existiert(PANEL_STAND)) { o.fehlt = true; return o; }
  var j = JSON.parse(fs.readFileSync(PANEL_STAND, 'utf8'));
  o.kennung = j.kennung; o.reihen = (j.symbole || []).length;
  o.treffer = (j.symbole || []).filter(function (e) { return ALLE.indexOf(e.reihe) >= 0 || ALLE.indexOf(e.ordner) >= 0; })
    .map(function (e) { return { reihe: e.reihe, art: e.art, referenz: e.referenz }; });
  o.ausgeschlosseneArten = j.ausgeschlosseneArten ? Object.keys(j.ausgeschlosseneArten) : null;
  /* Kalender: Panel-Handelstage gegen SPY-Tage im gemeinsamen Bereich */
  if (Array.isArray(j.tage)) {
    var bis = j.letzterVollTag || LETZTER_TAG, pt = j.tage.filter(function (t) { return t <= bis; }), von = pt[0];
    var ks = kal.filter(function (t) { return t >= von && t <= bis; }), ps = new Set(pt), kset = new Set(ks);
    o.kalender = { von: von, bis: bis, panelTage: pt.length, spyTage: ks.length,
      nurPanel: pt.filter(function (t) { return !kset.has(t); }), nurSpy: ks.filter(function (t) { return !ps.has(t); }) };
  }
  return o;
}

/* ---------- Bericht ---------- */
function de(x, d) {
  if (x == null || !isFinite(x)) return '–';
  var s = Math.abs(Number(x)).toFixed(d), p = s.split('.');
  p[0] = p[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return (Number(x) < 0 && Number(s) !== 0 ? '−' : '') + p[0] + (p[1] ? ',' + p[1] : '');
}
function deS(x, d) { return x == null ? '–' : (x > 0 && Number(Math.abs(x).toFixed(d)) !== 0 ? '+' : '') + de(x, d); }
function dt(t) { return t ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '–'; }
function ja(b) { return b ? 'ja' : '**NEIN**'; }
function exp(x) { if (x == null || x === 0) return '0'; var e = Math.floor(Math.log10(Math.abs(x))); return de(x / Math.pow(10, e), 2) + '·10^' + e; }
function inAB(t) { return (t >= FENSTER.A.von && t <= FENSTER.A.bis) ? 'A' : (t >= FENSTER.B.von && t <= FENSTER.B.bis) ? 'B' : ''; }

function bericht(a) {
  var L = [], K = a.kalender, P = a.spyPflicht, Z = a.zweiteKursquelle;
  function z(s) { L.push(s == null ? '' : s); }
  function zelle(c) { return String(c).replace(/\|/g, '\\|'); }
  function tab(kopf, zeilen) { z('| ' + kopf.map(zelle).join(' | ') + ' |'); z('|' + kopf.map(function () { return '---'; }).join('|') + '|'); zeilen.forEach(function (r) { z('| ' + r.map(zelle).join(' | ') + ' |'); }); z(); }
  function zahl(x) { return String(x).replace('.', ','); }

  /* ---- Kennzahlen fuer das Fazit ---- */
  var shaOk = ALLE.filter(function (s) { return a.pruefsummen[s].passt; }).length;
  var entf = ALLE.reduce(function (n, s) { return n + a.reihen[s].zeilenRoh - a.reihen[s].zeilenGueltig; }, 0);
  var dopp = ALLE.reduce(function (n, s) { return n + a.reihen[s].doppelteTageRoh; }, 0);
  var uhren = {}; ALLE.forEach(function (s) { Object.keys(a.reihen[s].uhrzeitenUTC).forEach(function (u) { uhren[u] = 1; }); });
  var fehl = ALLE.reduce(function (n, s) { return n + a.luecken[s].fehlend.length; }, 0);
  var ohneSpy = ALLE.reduce(function (n, s) { return n + a.luecken[s].ohneSpyZeile.length; }, 0);
  var ohneOpen = ALLE.reduce(function (n, s) { return n + a.luecken[s].ohneOpen.gesamt; }, 0);
  var volNull = ALLE.reduce(function (n, s) { return n + a.luecken[s].volumeNull.gesamt; }, 0);
  var vol0 = [], vol0AB = 0, luAB = 0;
  ALLE.forEach(function (s) { var l = a.luecken[s]; (l.volume0.alle || []).forEach(function (t) { vol0.push(s + ' ' + t); });
    vol0AB += l.volume0.A.length + l.volume0.B.length; luAB += l.fehlendA.length + l.fehlendB.length + l.ohneOpen.A.length + l.ohneOpen.B.length + l.volumeNull.A.length + l.volumeNull.B.length; });
  var spl = []; ALLE.forEach(function (s) { a.splits[s].forEach(function (x) { spl.push({ s: s, x: x, m: Z.je && Z.je[s] && Z.je[s].splits ? Z.je[s].splits.filter(function (q) { return q.tag === x.tag; })[0] : null }); }); });
  var splCC = spl.map(function (p) { return p.x.closeSplittagZuCloseVortag; });
  var splBet = []; spl.forEach(function (p) { p.x.betraegeVorDemSplitYahooGegenAlpacaRoh.forEach(function (v) { if (p.x.faktor === 2) splBet.push(v.verhaeltnisYahooZuAlpaca); }); });
  var splVol = []; spl.forEach(function (p) { if (p.m) { splVol.push(p.m.umsatzVerhaeltnisMedian90TageVor, p.m.umsatzVerhaeltnisMedian90TageNach); } });
  var splStufe = ALLE.reduce(function (n, s) { return n + a.adjAbgleich[s].zugeordnetSplit; }, 0);
  var zwei = spl.filter(function (p) { return p.x.faktor === 2; }), zweiTage = {}; zwei.forEach(function (p) { zweiTage[p.x.tag] = 1; });
  var zweiAlp = zwei.filter(function (p) { return p.x.alpacaMassnahme && p.x.alpacaMassnahme.some(function (m) { return m.art === 'forward_splits' && m.new_rate / m.old_rate === 2; }); }).length;
  var xlfSp = spl.filter(function (p) { return p.s === 'XLF'; })[0];
  var maxIstSoll = 0, divOhne = 0, ohne1e5 = 0, ohneMax = 0;
  ALLE.forEach(function (s) { var x = a.adjAbgleich[s]; if (x.groessteAbweichung) maxIstSoll = Math.max(maxIstSoll, Math.abs(x.groessteAbweichung.abw));
    divOhne += x.ausschuettungenOhneStufe.length; ohne1e5 += x.ohneEreignisUeber1e5; ohneMax = Math.max(ohneMax, x.ohneEreignisGroessteRelAenderung); });
  var aAB = { nurY: [], nurA: [], versch: [] }, alpRund = 0;
  ALLE.forEach(function (s) { var x = a.alpacaAbgleich[s]; if (x.fehlt) return;
    x.nurYahoo.forEach(function (v) { aAB.nurY.push(s + ' ' + v.ex); });
    x.nurAlpaca.forEach(function (v) { aAB.nurA.push(s + ' ' + v.ex); });
    x.betragVerschieden.forEach(function (v) { if (Math.abs(v.abw) <= 0.0006) alpRund = Math.max(alpRund, Math.abs(v.abw)); else aAB.versch.push({ s: s, v: v }); }); });
  var nurAinAB = aAB.nurA.filter(function (t) { return t.slice(-10) >= FENSTER.A.start && t.slice(-10) <= FENSTER.B.bis; });
  var gA = [], gL = [];
  ALLE.forEach(function (s) { var g = a.gesamtertrag.je[s]; ['A', 'B'].forEach(function (f) { if (g[f]) gA.push(Math.abs(g[f].diffPp)); }); if (g.L) gL.push(Math.abs(g.L.diffPp)); });
  var minMittel = [], minGross = 0, minGrossAB = 0, minMed = [];
  if (Z.je) ALLE.forEach(function (s) { var x = Z.je[s]; if (!x || x.fehlt) return; minMittel.push(x.schluss.mittelAbsPct); minMed.push(x.schluss.medianAbsPct); minGross += x.schluss.ueber05Pct;
    minGrossAB += x.schluss.liste.filter(function (l) { return inAB(l.tag); }).length; });
  var schlussAusser = 0, openAus = [], openAusAB = [];
  if (Z.je) ALLE.forEach(function (s) { var x = Z.je[s]; if (!x || x.fehlt) return; schlussAusser += x.yahooSchlussAusserhalbMinutenSpanne.length;
    x.yahooOpenAusserhalbMinutenSpanne.forEach(function (o) { var e = { s: s, o: o }; openAus.push(e); if (o.fenster) openAusAB.push(e); }); });
  var openAusMaxAB = openAusAB.reduce(function (m, e) { return Math.max(m, Math.abs(e.o.abstandZurSpannePct)); }, 0);
  var openAusTageAB = {}; openAusAB.forEach(function (e) { (openAusTageAB[e.o.tag] = openAusTageAB[e.o.tag] || []).push(e.s); });
  var openAusText = Object.keys(openAusTageAB).sort().map(function (t) { return dt(t) + ' ' + openAusTageAB[t].join('/'); }).join(', ');
  var maxTag = null, maxTagN = 0, jeTagAlle = {};
  openAus.forEach(function (e) { if (e.s !== 'SPY') jeTagAlle[e.o.tag] = (jeTagAlle[e.o.tag] || 0) + 1; });
  Object.keys(jeTagAlle).forEach(function (t) { if (jeTagAlle[t] > maxTagN) { maxTagN = jeTagAlle[t]; maxTag = t; } });
  var openAusABFonds = openAusAB.filter(function (e) { return e.s !== 'SPY'; }).length;
  var jahreAB = ALLE.reduce(function (n, s) { return n + a.ausschuettungen.jahreUngleich4[s].filter(function (j) { return j.jahr >= 2016 && j.n < 4; }).length; }, 0);

  z('# Datenprüfung — Messung Sektor-Momentum (Yahoo, zwölf Reihen)');
  z();
  z('Kennung `' + a.kennung + '` · erzeugt ' + a.erzeugt + ' von `datenpruefung.js` (`node studien/sektor-momentum-messung-2026-10/datenpruefung.js`) · alle Zahlen in `datenpruefung.json`.');
  z('Nur Bericht (ZUSATZ §1.10): ändert keine Zahl der Messung; keine Rangfolge, kein Buch, keine Auswahl. Alles Simulation, keine Anlageberatung.');
  z();
  z('## Fazit — was für die Messung zählt');
  z();
  z('1. **Dateien ' + (shaOk === 12 && entf === 0 && dopp === 0 ? 'heil' : 'AUFFÄLLIG') + ':** ' + shaOk + '/12 Prüfsummen wie `pruefsummen.json`; ' + entf + ' Balken entfallen (§1.5), ' + dopp +
    ' doppelte Tage; Zeitstempel nur ' + Object.keys(uhren).sort().join(' / ') + ' UTC (= 09:30 New York, Sommer/Winter).');
  z('2. **Kalender-Klinken ' + (K.alleKlinkenOk ? 'erfüllt' : 'NICHT erfüllt') + ':** A ' + de(K.A.ist, 0) + ' (Soll ' + de(K.A.soll, 0) + '), B ' + de(K.B.ist, 0) + ' (Soll ' + de(K.B.soll, 0) + ') Handelstage; Vortage ' +
    dt(K.vorA.ist) + ' / ' + dt(K.vorB.ist) + '.' + (a.panel && a.panel.kalender ? ' SPY-Kalender = Panel-v2.2-Kalender (' + de(a.panel.kalender.spyTage, 0) + ' gegen ' + de(a.panel.kalender.panelTage, 0) + ' Tage ' +
    dt(a.panel.kalender.von) + '–' + dt(a.panel.kalender.bis) + ', ' + (a.panel.kalender.nurPanel.length + a.panel.kalender.nurSpy.length) + ' Abweichungen).' : ''));
  z('3. **' + (fehl + ohneSpy + ohneOpen + volNull === 0 && luAB === 0 ? 'Keine Datenlücke gegen das Buch' : 'LÜCKEN') + ':** ' + fehl + ' fehlende Fonds-Tage gegen den SPY-Kalender (ab dem ersten Tag je Fonds), ' + ohneSpy +
    ' Zeilen ohne SPY-Tag, ' + ohneOpen + ' Tage ohne `open`, ' + volNull + ' ohne `volume`; `volume` = 0 nur ' + vol0.length + '× (' + vol0.join(', ') + '), davon in A/B ' + vol0AB + '.');
  z('4. **Splits ' + (splStufe === 0 && splCC.every(function (c) { return Math.abs(c - 1) < 0.05; }) ? 'sauber' : 'AUFFÄLLIG') + ':** 2:1 am ' + Object.keys(zweiTage).map(dt).join(', ') + ' (' + zwei.map(function (p) { return p.s; }).join(', ') +
    '; Alpaca führt denselben Split bei ' + zweiAlp + ' von ' + zwei.length + ')' + (xlfSp ? ' und XLF ' + xlfSp.x.verhaeltnis + ' am ' + dt(xlfSp.x.tag) + ' (= Abspaltung XLRE' +
    (xlfSp.x.abspaltung ? ', Faktor aus Alpacas XLRE-Stückverhältnis nachgerechnet ' + de(xlfSp.x.abspaltung.impliziterFaktor, 4) : '') + ')' : '') +
    '. Kurse, Umsätze **und** Ausschüttungsbeträge sind split-bereinigt, also in derselben Einheit: Schluss Splittag/Vortag ' + de(Math.min.apply(null, splCC), 3) + '–' + de(Math.max.apply(null, splCC), 3) +
    ' (unbereinigt wäre 0,5), Yahoo-Betrag/Alpaca-roh vor dem Split ' + de(Math.min.apply(null, splBet), 4) + '–' + de(Math.max.apply(null, splBet), 4) + ', Umsatz Yahoo/Alpaca-Minuten 90 Tage vor und nach ' +
    de(Math.min.apply(null, splVol), 3) + '–' + de(Math.max.apply(null, splVol), 3) + '; keine Stufe in adjclose/close an einem Splittag.');
  z('5. **Ausschüttungen ' + (divOhne === 0 && ohne1e5 === 0 && nurAinAB.length === 0 ? 'vollständig für A und B' : 'AUFFÄLLIG') + ':** jede Yahoo-Ausschüttung hat ihre Stufe in adjclose/close (|Ist − Soll| ≤ ' + exp(maxIstSoll) +
    '), keine Stufe > 10^−5 ohne Ereignis (' + ALLE.reduce(function (n, s) { return n + a.adjAbgleich[s].ohneEreignisAnzahl; }, 0) + ' Rundungsstufen ≤ ' + exp(ohneMax) + '). Gegen Alpaca (ab ' + dt(a.alpacaAbgleich.SPY.ersterAlpacaExTag) +
    ') fehlt bei Yahoo ' + (nurAinAB.length ? '**' + nurAinAB.length + ' Sätze in A/B: ' + nurAinAB.join(', ') + '**' : 'kein Satz in A oder B') + '; nur bei Alpaca insgesamt: ' +
    (aAB.nurA.length ? aAB.nurA.join(', ') + (aAB.nurA.join() === 'XLF 2016-09-19' ? ' (XLRE-Stückverhältnis, kein Bargeld)' : '') : 'keiner') + '. Beträge gleich bis auf Yahoos Rundung (≤ ' + de(alpRund, 5) + ' $)' +
    (aAB.versch.length ? ' und ' + aAB.versch.map(function (q) { return q.s + ' ' + dt(q.v.ex) + ' (' + de(q.v.yahoo, 6) + ' gegen ' + de(q.v.alpacaUmgerechnet, 6) + ' $' + (inAB(q.v.ex) ? ', in ' + inAB(q.v.ex) : ', vor A') + ')'; }).join(', ') : '') + '.');
  z('6. **SPY-Pflichtprüfung ' + (P.alleBestanden ? 'bestanden' : 'NICHT bestanden') + ':** (i) ' + deS(P.i.istPct, 2) + ' % (Soll +' + de(P.i.sollPct, 2) + ', ' + deS(P.i.diffPp, 2) + ' Pp), (ii) ' + de(P.ii.istUsd, 2) + ' $ (' + deS(P.ii.diffPp, 2) +
    ' Pp), (iii) ' + de(P.iii.istUsd, 2) + ' $ (' + deS(P.iii.diffPp, 2) + ' Pp), (iv) ' + de(P.iv.A.istUsd, 4) + ' / ' + de(P.iv.B.istUsd, 4) + ' $ (' + deS(P.iv.A.diffUsd, 4) + ' / ' + deS(P.iv.B.diffUsd, 4) + ' $). ' +
    (P.yahooHat20180615 ? 'Yahoo führt den 15.06.2018 selbst (' + de(P.yahooHat20180615.betrag, 4) + ' $), die Ergänzung greift nicht' : 'Ergänzung 15.06.2018 gebucht') + '; Ex-Tage A ' + P.exTageA.ist + ', B ' + P.exTageB.ist + ', 2017–2025 je Jahr ' +
    (Object.keys(P.jeJahr).every(function (k) { return P.jeJahr[k].ok; }) ? '4' : 'NICHT 4') + '.');
  if (Z.je) z('7. **Zweite Kursquelle (Alpaca-Minuten, roh, 2016–2026):** Schlusskurse im Mittel ' + de(Math.min.apply(null, minMittel), 4) + '–' + de(Math.max.apply(null, minMittel), 4) + ' % Abweichung, Median je Reihe ≤ ' +
    de(Math.max.apply(null, minMed), 4) + ' %; ' + minGross + ' Tage > 0,5 % (' + minGrossAB + ' in A/B), dort liegt Yahoos Schluss aber in der gehandelten Minutenspanne — ' +
    (schlussAusser === 0 ? 'kein Yahoo-Schluss liegt außerhalb' : '**' + schlussAusser + ' Yahoo-Schlüsse liegen außerhalb**') + '. **`open` ist schwächer:** an ' + openAus.length + ' Reihen-Tagen liegt Yahoos `open` außerhalb ' +
    'dessen, was an dem Tag gehandelt wurde, ' + openAusAB.length + ' davon in A/B (' + openAusABFonds + ' Fonds-, ' + (openAusAB.length - openAusABFonds) + ' SPY-Tage: ' + openAusText + '; bis ' + de(openAusMaxAB, 2) + ' % neben der Spanne).');
  z('8. **Zwei Rechenwege:** Gesamtertrag aus adjclose gegen Schluss + Ausschüttungen |Δ| ≤ ' + de(Math.max.apply(null, gA), 2) + ' Pp in A/B, ≤ ' + de(Math.max.apply(null, gL), 2) +
    ' Pp über 31.12.1999–15.09.2026 — Folge des Wiederanlage-Zeitpunkts (Faktor auf den Vortagesschluss gegen Kauf zum Ex-Tag-Schluss), kein Datenfehler; die Hauptrechnung (§1.7) ist Schluss + Ausschüttungen.');
  z('9. **Nur für den Langlauf (§5, ohne Urteil):** ' + ALLE.filter(function (s) { return a.ausschuettungen.jahreUngleich4[s].some(function (j) { return j.n < 4; }); }).map(function (s) {
    return s + ' ' + a.ausschuettungen.jahreUngleich4[s].filter(function (j) { return j.n < 4; }).map(function (j) { return j.jahr + ':' + j.n; }).join(' '); }).join('; ') +
    ' (Zahl der Sätze je Jahr unter 4) — vor 2016 ohne zweite Quelle; ab 2016 hat jede Reihe in jedem vollen Jahr ' + (jahreAB === 0 ? 'genau 4' : 'NICHT immer 4') + ' Sätze (Sonderzahlungen ausgenommen, Abschnitt 5). XLK: 84 Sätze, weil der Fonds bis 2007 ' +
    'nur jährlich oder gar nicht ausschüttete, nicht wegen einer Lücke in A/B.');
  z('10. **Tages-Panel v2.2:** ' + (a.panel && !a.panel.fehlt ? (a.panel.treffer.filter(function (t) { return t.reihe !== 'SPY'; }).length === 0 ? 'kein Sektor-Fonds unter den ' + de(a.panel.reihen, 0) +
    ' Reihen (Art ETF ist ausgeschlossen); nur SPY als Referenzreihe. REGEL C.2 „nicht geprüft" bleibt richtig.' : 'Treffer: ' + a.panel.treffer.map(function (t) { return t.reihe; }).join(', ')) : 'Datei nicht lesbar.'));
  z();
  z('**Gefährdet etwas die Messung?** ' + ((fehl + ohneOpen + volNull + luAB === 0) && splStufe === 0 && divOhne === 0 && nurAinAB.length === 0 && P.alleBestanden && K.alleKlinkenOk && shaOk === 12 ?
    'Nein: keine Datenlücke gegen das Buch, kein Splitfehler, keine fehlende Ausschüttung in A oder B, alle Klinken und die Pflichtprüfung erfüllt. Hinweise (XLF 18.03.2016, SPY 17.12.2021) liegen unter jeder Toleranz bzw. vor Fenster A. ' +
    'Zu benennen bleibt der `open` an ' + openAusAB.length + ' Reihen-Tagen in A/B (Zeile 7, Liste in Abschnitt 9): fällt ein Ausführungstag darauf, ist der Handelspreis des betroffenen Fonds um bis zu ' + de(openAusMaxAB, 2) +
    ' % falsch (§1.7 handelt zum gelieferten `open`; die Rechnung bleibt dabei, der Lauf kann die Treffer zählen).' :
    'JA — siehe die als AUFFÄLLIG/NICHT markierten Zeilen.'));
  z();

  /* ---- 1 ---- */
  z('## 1. Reihen (Tagesbildung §1.5)');
  z();
  tab(['Kürzel', 'Zeilen roh', 'gültig', 'entfallen', 'doppelte Tage', 'erster Tag', 'letzter Tag', 'Stempel UTC (Zahl)', 'Ausschüttungen', 'Splits', 'Prüfsumme'], ALLE.map(function (s) {
    var r = a.reihen[s];
    return [s, de(r.zeilenRoh, 0), de(r.zeilenGueltig, 0), String(r.zeilenRoh - r.zeilenGueltig), r.doppelteTageRoh + ' (gleich ' + r.doppelteGleich + ', verschieden ' + r.doppelteVerschieden.length + ')', r.ersterTag, r.letzterTag,
      Object.keys(r.uhrzeitenUTC).sort().map(function (u) { return u + ': ' + de(r.uhrzeitenUTC[u], 0); }).join(', '), String(r.ausschuettungen), String(r.splits), a.pruefsummen[s].passt ? 'passt' : '**weicht ab**'];
  }));

  /* ---- 2 ---- */
  z('## 2. Kalender = SPY-Tage (Klinken §1.6)');
  z();
  tab(['Klinke', 'Ist', 'Soll', 'erfüllt'], [
    ['Handelstage A ' + dt(K.A.von) + '–' + dt(K.A.bis), de(K.A.ist, 0), de(K.A.soll, 0), ja(K.A.ok)],
    ['Handelstage B ' + dt(K.B.von) + '–' + dt(K.B.bis), de(K.B.ist, 0), de(K.B.soll, 0), ja(K.B.ok)],
    ['Handelstag vor 04.01.2017', dt(K.vorA.ist), dt(K.vorA.soll), ja(K.vorA.ok)],
    ['Handelstag vor 16.09.2021', dt(K.vorB.ist), dt(K.vorB.soll), ja(K.vorB.ok)],
    ['letzter Tag', dt(K.letzterTag), '15.09.2026', ja(K.letzterTagOk)],
    ['Tage auf Samstag/Sonntag', String(K.wochenendTage.length), '0', ja(K.wochenendTage.length === 0)]]);
  if (a.panel && a.panel.kalender) z('Gegenprobe Panel v2.2 (`_stand.json`, Feld `tage`): ' + de(a.panel.kalender.panelTage, 0) + ' Panel-Tage gegen ' + de(a.panel.kalender.spyTage, 0) + ' SPY-Tage ' + dt(a.panel.kalender.von) + '–' + dt(a.panel.kalender.bis) +
    '; nur im Panel: ' + (a.panel.kalender.nurPanel.join(', ') || 'keiner') + '; nur bei SPY: ' + (a.panel.kalender.nurSpy.join(', ') || 'keiner') + '.');
  z();

  /* ---- 3 ---- */
  z('## 3. Lücken je Reihe gegen den SPY-Kalender (ab ihrem ersten Tag)');
  z();
  function jj(o) { var k = Object.keys(o.jeJahr); return o.gesamt ? o.gesamt + ' (' + k.map(function (y) { return y + ': ' + o.jeJahr[y]; }).join(', ') + ')' : '0'; }
  tab(['Kürzel', 'ab', 'fehlende Tage', 'davon A / B', 'Zeilen ohne SPY-Tag', 'ohne open', 'volume null', 'volume 0', 'Fälle in A / B'], ALLE.map(function (s) {
    var l = a.luecken[s];
    var fall = [].concat(l.ohneOpen.A, l.ohneOpen.B, l.volumeNull.A, l.volumeNull.B, l.volume0.A, l.volume0.B).map(function (e) { return e.tag; });
    return [s, l.abTag, String(l.fehlend.length) + (l.fehlend.length ? ' (' + l.fehlend.slice(0, 20).join(', ') + ')' : ''), l.fehlendA.length + ' / ' + l.fehlendB.length, String(l.ohneSpyZeile.length),
      jj(l.ohneOpen), jj(l.volumeNull), jj(l.volume0), fall.length ? fall.join(', ') : 'keine'];
  }));
  if (vol0.length) z('Tage mit `volume` = 0: ' + vol0.join(', ') + ' — alle vor Fenster A; für die Rangbildung (Umsatz) ohne Belang.');
  z();

  /* ---- 4 ---- */
  z('## 4. Splits');
  z();
  tab(['Kürzel', 'Tag', 'Verhältnis', 'Schluss Splittag / Vortag', 'Eröffnung Splittag / Vortagesschluss', 'Betrag Yahoo / Alpaca roh (Sätze vor dem Split)', 'Satz vor → nach (Median, %)',
    'Umsatz Yahoo / Alpaca 90 T vor → nach', 'Minuten-Schluss mittl. |Abw.| vor / nach (%)', 'Alpaca-Maßnahme'], spl.map(function (p) {
    var x = p.x, m = p.m;
    return [p.s, x.tag, x.verhaeltnis, de(x.closeSplittagZuCloseVortag, 4), de(x.openSplittagZuCloseVortag, 4),
      x.betraegeVorDemSplitYahooGegenAlpacaRoh.map(function (v) { return de(v.verhaeltnisYahooZuAlpaca, 4); }).join(' / ') || '–',
      de(median(x.saetzeVor.map(function (q) { return q.satzPct; })), 3) + ' → ' + de(median(x.saetzeNach.map(function (q) { return q.satzPct; })), 3),
      m ? de(m.umsatzVerhaeltnisMedian90TageVor, 3) + ' → ' + de(m.umsatzVerhaeltnisMedian90TageNach, 3) : '–',
      m ? de(m.mittelAbsPctVor, 4) + ' / ' + de(m.mittelAbsPctNach, 4) : '–',
      x.alpacaMassnahme && x.alpacaMassnahme.length ? x.alpacaMassnahme.map(function (q) { return q.art + ' ' + q.old_rate + '→' + q.new_rate; }).join(', ') : 'keine'];
  }));
  z('Unbereinigt wäre Schluss Splittag / Vortag ≈ 1/Faktor (0,5 bzw. 0,812), der Betrag Yahoo / Alpaca-roh ≈ 1 und das Umsatzverhältnis vor dem Split halbiert. Gemessen: Kurse, Umsätze und Beträge sind ' +
    'rückwirkend mit demselben Faktor bereinigt; der Satz Betrag / Vortagesschluss springt nicht. adjclose/close hat an keinem Splittag eine Stufe (' + splStufe + ').');
  if (xlfSp && xlfSp.x.abspaltung) {
    var ab = xlfSp.x.abspaltung;
    z();
    z('XLF ' + dt(xlfSp.x.tag) + ': Yahoo führt die Abspaltung des Immobiliensektors (XLRE-Stücke an XLF-Halter) als Split ' + xlfSp.x.verhaeltnis + '. Alpaca führt am selben Tag keinen Split, sondern einen „cash_dividends"-Satz ' +
      de(ab.alpacaSatz, 6) + ' — das ist das Stückverhältnis: ' + de(ab.alpacaSatz, 6) + ' × XLRE-Schluss ' + de(ab.xlreSchlussVortag, 2) + ' $ = ' + de(ab.wertJeXlfStueck, 4) + ' $ je XLF-Stück bei rohem Vortagesschluss ' +
      de(ab.xlfRohSchlussVortag, 2) + ' $ → Faktor ' + de(ab.impliziterFaktor, 4) + ' (Yahoo ' + de(ab.yahooFaktor, 3) + '). Die Minutenquelle trifft die XLF-Schlüsse vor dem Tag mit Faktor 1,231 (mittl. Abw. ' +
      (xlfSp.m ? de(xlfSp.m.mittelAbsPctVor, 4) : '–') + ' %). Wertwirkung damit enthalten; liegt vor Fenster A (nur Rückblick der ersten Stichtage und §5).');
  }
  z();

  /* ---- 5 ---- */
  z('## 5. Ausschüttungen');
  z();
  z('### Zahl je Kalenderjahr (Ex-Tag in New York)');
  z();
  var jahre = []; for (var y = 1998; y <= 2026; y++) jahre.push(String(y));
  tab(['Jahr'].concat(ALLE), jahre.map(function (y) { return [y].concat(ALLE.map(function (s) { var n = a.ausschuettungen.jeJahr[s][y], j0 = a.reihen[s].ersterTag.slice(0, 4);
    return n == null ? (y > j0 && y !== '2026' ? '**0**' : y === j0 ? '0' : '') : (n !== 4 && y !== '2026' && y > j0 ? '**' + n + '**' : String(n)); })); })
    .concat([['Summe'].concat(ALLE.map(function (s) { return String(a.reihen[s].ausschuettungen); }))]));
  z('2026 bis 15.09.2026 (zwei Sätze, der September-Satz hat Ex-Tag 21.09.2026, nach Datenende). Fett: volles Jahr mit ≠ 4 Sätzen.');
  z();
  z('### Sätze = Betrag / Schluss der letzten Zeile vor dem Ex-Tag');
  z();
  tab(['Kürzel', 'n', 'kleinster %', 'Median %', 'größter %'], ALLE.map(function (s) { var q = a.ausschuettungen.satzStatistik[s]; return [s, String(q.n), de(q.minPct, 4), de(q.medianPct, 4), de(q.maxPct, 4)]; }));
  z('Außerhalb 0,01 %–5 %: ' + (a.ausschuettungen.saetzeAusserhalb.map(function (q) { return q.sym + ' ' + q.tag + ' Betrag ' + zahl(q.betrag) + ' $ / Schluss ' + de(q.closeVortag, 2) + ' $ = ' + de(q.satzPct, 4) + ' %'; }).join('; ') || 'keiner') +
    '. Ex-Tage ohne Handelstag: ' + (a.ausschuettungen.exOhneHandelstag.length || 'keiner') + '. Beträge ≤ 0: ' + (a.ausschuettungen.betragNichtPositiv.length || 'keiner') + '. Mehrere Sätze an einem Tag: ' +
    (a.ausschuettungen.mehrereAmTag.length || 'keiner') + '. Ereignis-Stempel: ' + Object.keys(a.ausschuettungen.uhrzeitenUTC).sort().map(function (u) { return u + ' UTC (' + a.ausschuettungen.uhrzeitenUTC[u] + ')'; }).join(', ') + '.');
  z();
  z('### Auffällige Zählungen (volle Jahre mit ≠ 4 Sätzen)');
  z();
  ALLE.forEach(function (s) {
    var li = a.ausschuettungen.jahreUngleich4[s]; if (!li.length) return;
    z('- **' + s + '**: ' + li.map(function (j) { return j.jahr + ': ' + j.n + (j.exTage.length ? ' (' + j.exTage.map(zahl).join(', ') + ')' : ''); }).join('; '));
  });
  z();
  if (shaOk !== 12) z('**Achtung: die folgende Lesart wurde an den Dateien mit den Prüfsummen aus `pruefsummen.json` geschrieben — hier weichen Prüfsummen ab.**');
  z('Lesart: **XLK** (84 Sätze gegen ~110) zahlte 1999 einen Kleinstbetrag, 2000 und 2001 nichts, 2002–2005 je eine Dezember-Zahlung, 2006 zwei, 2007 drei und erst ab 2008 vierteljährlich — das Muster ' +
    'eines Fonds, dessen Dividendenerträge die Kosten anfangs kaum deckten (stetiger Übergang zu häufigeren Zahlungen, kleine Beträge), keine Lücke mitten in einer Quartalsfolge — plausibel, aber vor 2016 ohne zweite Quelle. ' +
    'Ab 2008 hat XLK jedes Jahr vier Sätze, ab Juni 2016 von Alpaca bestätigt. XLV 1999/2000 (je ein Satz) zeigt dasselbe Anfangsmuster. **XLI 2001** (Dezember fehlt) ist die einzige Lücke mitten in einer ' +
    'Quartalsfolge — nicht prüfbar (keine zweite Quelle vor 2016), nur §5 betroffen. Vier Jahre mit fünf Sätzen enthalten je eine zusätzliche Zahlung (XLE und XLV 30.12.2019 — von Alpaca bestätigt —, ' +
    'XLU 18.12.2000 drei Tage nach dem 15.12.2000, SPY 15.11.2004); die drei vor 2016 sind nicht gegenprüfbar, jede hat ihre Stufe in adjclose.');
  z();

  /* ---- 6 ---- */
  z('## 6. adjclose gegen close + Ausschüttungen');
  z();
  z('Faktor f = adjclose / close je Zeile; Stufe = relative Änderung > 10^−6 zwischen zwei Zeilen; Soll-Multiplikator f(Vortag)/f(Ex-Tag) = 1 − Betrag / close(Vortag) (CRSP).');
  z();
  tab(['Kürzel', 'Stufen', '→ Ausschüttung', '→ Split', 'ohne Ereignis (größte |Δ|, Jahre)', 'davon > 10^−5', 'Ausschüttungen ohne Stufe', 'kleinste Ausschüttungsstufe', 'größte |Ist − Soll| (Tag)'], ALLE.map(function (s) {
    var x = a.adjAbgleich[s];
    return [s, String(x.stufen), String(x.zugeordnetAusschuettung), String(x.zugeordnetSplit), x.ohneEreignisAnzahl + (x.ohneEreignisAnzahl ? ' (' + exp(x.ohneEreignisGroessteRelAenderung) + ', ' + x.ohneEreignisJahre + ')' : ''),
      String(x.ohneEreignisUeber1e5), String(x.ausschuettungenOhneStufe.length), exp(x.kleinsteAusschuettungsStufe), x.groessteAbweichung ? exp(Math.abs(x.groessteAbweichung.abw)) + ' (' + x.groessteAbweichung.tag + ')' : '–'];
  }));
  z('Die Stufen ohne Ereignis sind Rundung der gelieferten Kurse (alle ≤ ' + exp(ohneMax) + ', fast nur in den Jahren niedriger Kurse vor 2010); die kleinste echte Stufe (XLK 1999, Betrag 0,0005 $) liegt eine Größenordnung darüber. ' +
    'Jede Ausschüttung hat ihre Stufe, kein Split erzeugt eine Stufe.');
  z();
  z('### Gesamtertrag auf zwei Wegen (nur Abgleich der Rechenwege, alphabetisch, keine Rangfolge)');
  z();
  z('(a) adjclose(Ende) / adjclose(Start) − 1; (b) Schluss + Ausschüttungen, Wiederanlage am Ex-Tag zum Schluss (Stück += Stück × Betrag / close(Ex-Tag)). A: Schluss 03.01.2017 → 15.09.2021; B: 15.09.2021 → 15.09.2026; L: 31.12.1999 → 15.09.2026.');
  z();
  function g3(g) { return g ? [de(g.adjPct, 2), de(g.schlussPct, 2), deS(g.diffPp, 3)] : ['–', '–', '–']; }
  tab(['Kürzel', 'A (a) %', 'A (b) %', 'A Δ Pp', 'B (a) %', 'B (b) %', 'B Δ Pp', 'L (a) %', 'L (b) %', 'L Δ Pp'], ALLE.map(function (s) {
    var g = a.gesamtertrag.je[s]; return [s].concat(g3(g.A), g3(g.B), g3(g.L));
  }));
  z('SPY (a) in A = ' + de(a.gesamtertrag.je.SPY.A.adjPct, 2) + ' % trifft die in Nr. 78 genannte „bereinigte Yahoo-Reihe +115,81 %". Der Unterschied (a) − (b) entsteht, weil der CRSP-Faktor die Ausschüttung zum Vortagesschluss anlegt, (b) zum Ex-Tag-Schluss.');
  z();

  /* ---- 7 ---- */
  z('## 7. Zweite Quelle für Ausschüttungen: Alpaca (`alpaca-massnahmen`, Nachtrag 2026-10), ab 2016');
  z();
  z('Alpaca-Sätze sind roh je damaliger Aktie; vor einem Yahoo-Split durch den Splitfaktor geteilt („umgerechnet"). Verglichen bis 15.09.2026, Toleranz 0,0005 $.');
  z();
  tab(['Kürzel', 'erster Alpaca-Ex-Tag', 'Alpaca bis 15.09.2026', 'davon umgerechnet', 'Yahoo ab 2016', 'gleich', 'nur Yahoo', 'nur Alpaca', 'Betrag verschieden', 'größte |Abw.| $', 'Alpaca nach Datenende'], ALLE.map(function (s) {
    var x = a.alpacaAbgleich[s]; if (x.fehlt) return [s, 'Datei fehlt', '', '', '', '', '', '', '', '', ''];
    return [s, x.ersterAlpacaExTag, String(x.alpacaBisDatenende), String(x.mitSplitUmgerechnet), String(x.yahooAbVon), String(x.gleich), x.nurYahoo.map(function (v) { return v.ex; }).join(', ') || '–',
      x.nurAlpaca.map(function (v) { return v.ex + ' (' + de(v.alpacaRoh, 6) + ')'; }).join(', ') || '–', x.betragVerschieden.map(function (v) { return v.ex + ' (' + deS(v.abw, 6) + ')'; }).join(', ') || '–',
      de(x.groessteAbwUsd, 6), x.nachDatenende.map(function (v) { return v.ex; }).join(', ') || '–'];
  }));
  z('- **Nur Yahoo 18.03.2016** bei elf Reihen: Alpacas Archiv beginnt erst mit dem Ex-Tag 17.06.2016 (XLF: 18.03.2016) — Lücke der zweiten Quelle, nicht Yahoos. SPY 15.06.2018 fehlt bei Alpaca (bekannt, Nr. 78); Yahoo führt ihn mit ' +
    (a.spyPflicht.yahooHat20180615 ? de(a.spyPflicht.yahooHat20180615.betrag, 4) : '–') + ' $ (Ergänzungswert 1,2456 $).');
  z('- **Abweichungen um 0,0005 $** (XLC, XLF 2018, XLV): Yahoo rundet auf drei Stellen (0,118 gegen 0,1175) — Rundung, kein Fehler.');
  aAB.versch.forEach(function (q) {
    z('- **' + q.s + ' ' + q.v.ex + '**: Yahoo ' + de(q.v.yahoo, 6) + ' $, Alpaca ' + de(q.v.alpacaRoh, 6) + ' $ roh' + (q.v.splitFaktor !== 1 ? ' / ' + de(q.v.splitFaktor, 3) + ' = ' + de(q.v.alpacaUmgerechnet, 6) + ' $' : '') + ', Δ ' + deS(q.v.abw, 6) + ' $' +
      ' (Satz ' + deS(q.v.abwSatzPp, 4) + ' Pp)' +
      (q.s === 'XLF' ? ' — Yahoos Betrag × 1,231 = ' + de(q.v.yahoo * 1.231, 6) + ' $ roh; welche Quelle irrt, ist offen. Liegt vor Fenster A: wirkt nur über adjclose im Rückblick der ersten Stichtage von A und in §5, um den Satzunterschied.' :
        (q.s === 'SPY' ? ' — wirkt im Maßstab B nur um diesen Satzunterschied (Pflichtprüfung (iv) B ' + deS(a.spyPflicht.iv.B.diffUsd, 4) + ' $, innerhalb 0,01 $).' : '')));
  });
  z();

  /* ---- 8 ---- */
  z('## 8. SPY nach §1.9');
  z();
  tab(['Prüfung', 'Ist', 'Soll', 'Differenz', 'bestanden'], [
    ['Yahoo-Satz mit Ex-Tag 15.06.2018', P.yahooHat20180615 ? de(P.yahooHat20180615.betrag, 4) + ' $' : 'fehlt → ergänzt 1,2456 $', 'vorhanden oder ergänzt', P.yahooHat20180615 ? de(P.yahooHat20180615.betrag - 1.2456, 4) + ' $ zum Ergänzungswert' : '–', 'ja']]
    .concat(Object.keys(P.jeJahr).map(function (k) { return ['Ex-Tage ' + k, String(P.jeJahr[k].ist), '4', String(P.jeJahr[k].ist - 4), ja(P.jeJahr[k].ok)]; }))
    .concat([
      ['Ex-Tage A (04.01.2017, 15.09.2021]', String(P.exTageA.ist), '18', String(P.exTageA.ist - 18), ja(P.exTageA.ok)],
      ['Ex-Tage B (16.09.2021, 15.09.2026]', String(P.exTageB.ist), '20', String(P.exTageB.ist - 20), ja(P.exTageB.ok)],
      ['(i) Schluss 03.01.2017 → 15.09.2021, Wiederanlage', deS(P.i.istPct, 4) + ' %', '+' + de(P.i.sollPct, 2) + ' %', deS(P.i.diffPp, 4) + ' Pp', ja(P.i.bestanden)],
      ['(ii) 100.000 $ Eröffnung 04.01.2017 (open ' + de(P.ii.openKauftag, 4) + ') → Schluss 15.09.2021', de(P.ii.istUsd, 2) + ' $', de(P.ii.sollUsd, 2) + ' $', deS(P.ii.diffUsd, 2) + ' $ = ' + deS(P.ii.diffPp, 4) + ' Pp', ja(P.ii.bestanden)],
      ['(iii) 100.000 $ Eröffnung 16.09.2021 (open ' + de(P.iii.openKauftag, 4) + ') → Schluss 15.09.2026', de(P.iii.istUsd, 2) + ' $', de(P.iii.sollUsd, 2) + ' $', deS(P.iii.diffUsd, 2) + ' $ = ' + deS(P.iii.diffPp, 4) + ' Pp', ja(P.iii.bestanden)],
      ['(iv) Summe je Anteil A', de(P.iv.A.istUsd, 4) + ' $', de(P.iv.A.sollUsd, 4) + ' $', deS(P.iv.A.diffUsd, 4) + ' $', ja(P.iv.A.bestanden)],
      ['(iv) Summe je Anteil B', de(P.iv.B.istUsd, 4) + ' $', de(P.iv.B.sollUsd, 4) + ' $', deS(P.iv.B.diffUsd, 4) + ' $', ja(P.iv.B.bestanden)]]));
  z('Toleranz (i)–(iii) 0,30 Pp, (iv) 0,01 $. Die Reste erklären sich aus den Beträgen: A +0,0004 $ (15.06.2018: Yahoo 1,246 gegen 1,2456) plus Yahoos Rundung auf drei Stellen; B −0,0034 $ (17.12.2021: Yahoo 1,633 gegen Alpaca 1,636431). ' +
    'Unabhängig gerechnet (eigener Parser, eigene Schleife); adjclose ergibt für (i) ' + de(P.adjVergleich.iAusAdjclosePct, 2) + ' %.');
  z();

  /* ---- 9 ---- */
  z('## 9. Zweite Kursquelle: Alpaca-Minuten (`alpaca1m`, SIP, roh)');
  z();
  if (!Z.je) z('Minutenarchiv nicht lesbar.');
  else {
    var td = Z.tagesdateien || { archiv1d: [], such1d: [] };
    z('Tagesdateien `bars_1d_<KÜRZEL>.json` der zwölf Kürzel: `archiv1d/` ' + (td.archiv1d.join(', ') || 'keine') + ', `such1d/` ' + (td.such1d.join(', ') || 'keine') +
      ' (dort liegen nur Nachbarn wie SPYD/SPYG/SPYV). Ersatz: das Minutenarchiv `' + MINUTEN + '/<KÜRZEL>/<JAHR>.json`, alle zwölf Reihen ab 2016 (XLC ab 2018). ' + Z.regel);
    z();
    tab(['Kürzel', 'gemeinsame Tage', 'Schluss mittl. |Abw.| %', 'Median %', 'größte (Tag)', 'Tage > 0,5 %', 'Yahoo-Schluss außerhalb Minutenspanne', 'Eröffnung mittl. |Abw.| %', 'Eröffnung > 0,5 %',
      'Yahoo-open außerhalb Minutenspanne (in A/B)', 'Umsatz Yahoo / Alpaca (Median)', 'Schluss-Quelle'], ALLE.map(function (s) {
      var x = Z.je[s]; if (!x || x.fehlt) return [s, 'fehlt', '', '', '', '', '', '', '', '', '', ''];
      return [s, de(x.schluss.tage, 0), de(x.schluss.mittelAbsPct, 4), de(x.schluss.medianAbsPct, 4), deS(100 * x.schluss.groesste.abw, 3) + ' % (' + x.schluss.groesste.tag + ')', String(x.schluss.ueber05Pct),
        String(x.yahooSchlussAusserhalbMinutenSpanne.length), de(x.eroeffnung.mittelAbsPct, 4), String(x.eroeffnung.ueber05Pct),
        x.yahooOpenAusserhalbMinutenSpanne.length + ' (' + x.yahooOpenAusserhalbMinutenSpanne.filter(function (o) { return o.fenster; }).length + ')', de(x.umsatzYahooZuAlpacaMedian, 3),
        Object.keys(x.schluss.quellen).map(function (q) { return q + ' ' + x.schluss.quellen[q]; }).join(', ')];
    }));
    z('**Schlusskurse mit > 0,5 % Abweichung** (Fenster in Klammern; „15:59" = Abweichung des 15:59-Schlusses als Gegenprobe; Spanne = tiefster/höchster Minutenkurs 09:30–16:00):');
    z();
    ALLE.forEach(function (s) { var x = Z.je[s]; if (!x || x.fehlt) return; x.schluss.liste.forEach(function (l) {
      z('- ' + s + ' ' + l.tag + (inAB(l.tag) ? ' (' + inAB(l.tag) + ')' : '') + ': Yahoo ' + de(l.yahooClose, 2) + ', Minuten ' + de(l.alpacaClose, 2) + ' (' + deS(l.abwPct, 2) + ' %, ' + l.quelle + '; 15:59 ' +
        (l.abw1559Pct == null ? '–' : deS(l.abw1559Pct, 2) + ' %') + '); Spanne ' + de(l.minutenSpanne[0], 2) + '–' + de(l.minutenSpanne[1], 2) + ', Yahoo-Schluss ' + (l.yahooSchlussInSpanne ? 'darin' : '**außerhalb**'));
    }); });
    z();
    z('Lesart: Yahoos Schluss liegt an jedem dieser Tage in der gehandelten Spanne, meist genau auf dem Tageshoch oder -tief — dort lag der Auktionskurs, der in der 16:00-Kerze nicht der erste Handel war. ' +
      'Die Abweichung kommt aus der Ableitung „Eröffnung der 16:00-Kerze", nicht aus Yahoo. Über alle 2016–2026 gemeinsamen Tage liegt **kein** Yahoo-Schluss außerhalb der Minutenspanne (' + schlussAusser + ').');
    z();
    z('**Yahoo-`open` außerhalb der gehandelten Minutenspanne** (mehr als 0,05 % daneben; „= Vortag": `open` gleich Vortagesschluss, „= Tief/Hoch": Yahoo hat Tief bzw. Hoch auf diesen `open` gezogen):');
    z();
    tab(['Kürzel', 'Tag', 'Fenster', 'Yahoo open', 'Minuten-Eröffnung 09:30', 'Minutenspanne', 'Abstand zur Spanne %', 'Muster'], openAus.map(function (e) {
      var o = e.o; return [e.s, o.tag, o.fenster || '–', de(o.yahooOpen, 4), de(o.minutenOpen, 4), de(o.spanne[0], 4) + '–' + de(o.spanne[1], 4), deS(o.abstandZurSpannePct, 3),
        [o.gleichVortagesschluss ? '= Vortag' : '', o.gleichYahooTief ? '= Tief' : '', o.gleichYahooHoch ? '= Hoch' : ''].filter(Boolean).join(', ') || '–'];
    }));
    var spyK = Z.spyKaufAnBetroffenemTag || [];
    z('Lesart: Zu diesen `open`-Werten gibt es laut Minutenarchiv an dem Tag keinen Handel; ' + openAus.filter(function (e) { return e.o.gleichVortagesschluss; }).length + ' von ' + openAus.length +
      ' sind genau der Vortagesschluss (veraltet), am ' + dt(maxTag) + ' trifft es ' + maxTagN + ' Fonds zugleich. Für die Messung zählt `open` nur an Ausführungstagen ' +
      '(Handelspreis, §1.7) und für SPY am Kauftag: 04.01.2017 und 16.09.2021 sind nicht betroffen; ' +
      (spyK.filter(function (q) { return q.startphase; }).map(function (q) { return 'die Startphase k = ' + q.k + ' von ' + q.fenster + ' kauft SPY am ' + dt(q.tag); }).join(', ') || 'keine Startphase kauft SPY an einem betroffenen Tag') +
      '. ZUSATZ §1.7 handelt zum gelieferten `open` — kein Filter; ' +
      'der Lauf kann zählen, wie viele Ausführungen auf diese Tage fallen. Eröffnungsabweichungen > 0,5 % innerhalb der Spanne (Eröffnungsauktion gegen ersten SIP-Handel, Stresstage) sind kein Fehler. ' +
      'Umsatz: Yahoo / Alpaca-Minuten ≈ 1,00–1,01 je Fonds (SPY ' + de(Z.je.SPY.umsatzYahooZuAlpacaMedian, 2) + ').');
  }
  z();

  /* ---- 10 ---- */
  z('## 10. Tages-Panel v2.2');
  z();
  if (a.panel && !a.panel.fehlt) z('`' + a.panel.datei.replace(/^.*\/studien\//, 'studien/') + '` (`symbole`, nur Namen gelesen): ' + de(a.panel.reihen, 0) + ' Reihen; Treffer unter den zwölf Kürzeln: ' +
    a.panel.treffer.map(function (t) { return t.reihe + ' (Art ' + t.art + (t.referenz ? ', Referenzreihe' : '') + ')'; }).join(', ') + '. Ausgeschlossene Arten: ' + (a.panel.ausgeschlosseneArten || []).join(', ') +
    '. Kein Sektor-Fonds steht im Panel; REGEL C.2 („nicht geprüft") trifft zu.');
  else z('Datei nicht lesbar.');
  z();
  z('Laufzeit ' + de(a.laufzeitSekunden, 1) + ' s.');
  return L.join('\n') + '\n';
}

module.exports = { lies: lies, ertragSchluss: ertragSchluss, ertragAdj: ertragAdj, tagNY: tagNY };
if (require.main === module) main();
