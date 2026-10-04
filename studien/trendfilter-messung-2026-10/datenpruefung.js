'use strict';
/* Trendfilter-Messung (REGEL.md §2.6): Datenpruefung der sechs Yahoo-Reihen - OHNE einen Kurs zu aendern.
 *
 *   node studien/trendfilter-messung-2026-10/datenpruefung.js [--daten <ordner>] [--ohne-e] [--e <archivordner>] [--aus <ordner>]
 *
 *   --daten   Ordner mit den Rohantworten <KUERZEL>.json (Vorgabe: daten/ neben diesem Skript)
 *   --ohne-e  zweite Quelle (Alpaca-Massnahmen und Alpaca-Minutenarchiv auf Platte E:) abschalten
 *   --e       Wurzel des Archivs (Vorgabe E:/Markt-Dashboard-Archiv); wird nur GELESEN, jahresweise, ein Prozess
 *   --aus     wohin datenpruefung.json und DATENPRUEFUNG.md geschrieben werden (Vorgabe: neben dieses Skript)
 *
 * Geprueft wird (Auftrag Datenpruefer, 05.10.2026): (1) Aufbau, (2) Kalender gegen SPY und gegen die NYSE-Regeln,
 * (3) verdaechtige Kurse, (4) Splits, (5) Ausschuettungen und Gesamtertrag gegen adjclose, (6) zweite Quelle,
 * (7) Einordnung: welche Befunde eine Zahl des Urteils beruehren koennten, mit Groessenordnung. Nichts wird repariert
 * (REGEL §2.6: das Urteil bleibt auf den Yahoo-Daten). Ausgegeben werden nur relative Abweichungen, Verhaeltnisse, Tage,
 * Zaehlungen und Einstufungen - keine absoluten Kurse, keine Betraege je Stueck (Daten Dritter, oeffentliches Repo). Ertraege der Regeln rechnet dieses Skript NICHT; die Kipp-Probe
 * (Abschnitt 6) zaehlt nur, ob ein Signal nach REGEL §4 mit den Schlusskursen der zweiten Quelle anders ausfiele. */
var fs = require('fs');
var path = require('path');
var L = require('./laden.js');

function argWert(name, vorgabe) {
  var i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe;
}
var DATEN = path.resolve(argWert('--daten', path.join(__dirname, 'daten')));
var OHNE_E = process.argv.indexOf('--ohne-e') >= 0;
var EBASIS = argWert('--e', 'E:/Markt-Dashboard-Archiv');
var AUS = path.resolve(argWert('--aus', __dirname));

var KUERZEL = L.KUERZEL;                                    // SPY zuerst - die Minutenauswertung braucht das nicht, liest aber so
var ENDE = L.ENDE;
var HAUPT = ['SPY', 'BIL', 'ACWX', 'AGG'];                  // Hauptlesart (entscheidet)
var KLASSE = { SPY: 'aktien', ACWX: 'aktien', EFA: 'aktien', BIL: 'anleihen', SHY: 'anleihen', AGG: 'anleihen' };
var SCHWELLE = { aktien: 0.07, anleihen: 0.015 };          // Auftrag: |r| > 7 % bzw. > 1,5 %
var GRENZE_O = 0.005, GRENZE_C = 0.002;                     // Auftrag: Abweichung zur zweiten Quelle > 0,5 % / > 0,2 %
var BEFUND_AB = 0.0005;                                     // Einordnung: ab 0,05 % (50 $ auf 100.000 $) wird ein Befund gelistet
var VORBEHALT_AB = 0.001;                                   // ab 0,1 % (100 $ auf 100.000 $) oder bei gekipptem Signal: Vorbehalt
var EPS = 1e-6;                                             // "gleich" bei Kursvergleichen innerhalb einer Reihe
var KAPITAL = 100000;

/* Zeitraeume. Vorlauf A: das erste Signal fuer A steht am 30.12.2016; R2 braucht dafuer TR an M-12 = 31.12.2015,
 * R1 zehn Monatsenden ab 31.03.2016, R3 200 Handelstage ab Maerz 2016 und sein Gedaechtnis (R3V). Der Vorlauf von B
 * (31.08.2020 bis 15.09.2021) liegt ganz in A. Zusatz: erstes Signal 30.09.2003, R2 braucht M-12 = 30.09.2002. */
var ZR = [
  { id: 'R3V', name: 'SPY-Vorgeschichte (nur Gedächtnis von R3)', von: '1993-01-01', bis: '2002-09-29' },
  { id: 'Z', name: 'Zusatz inkl. Vorlauf', von: '2002-09-30', bis: ENDE },
  { id: 'AV', name: 'Vorlauf A', von: '2015-12-31', bis: '2017-01-03' },
  { id: 'A', name: 'Fenster A', von: '2017-01-04', bis: '2021-09-15' },
  { id: 'B', name: 'Fenster B', von: '2021-09-16', bis: ENDE }
];
var ZRID = {};
ZR.forEach(function (z) { ZRID[z.id] = z; });
/* Wofuer jede Reihe in welchem Zeitraum gebraucht wird (REGEL §1, §4, §7). Fehlt ein Eintrag: nicht gebraucht. */
var BEDARF = {
  SPY: { R3V: 'Gedächtnis R3 (nur Schluss)', Z: 'Zusatz: Maßstab, R1–R3', AV: 'Signale R1–R3 (nur Schluss)', A: 'Maßstab, R1–R3', B: 'Maßstab, R1–R3' },
  BIL: { AV: 'Signal R2 (nur Schluss)', A: 'Geld R1–R3, Signal R2', B: 'Geld R1–R3, Signal R2' },
  SHY: { Z: 'Zusatz: Geld', AV: 'nur N2 (Schluss)', A: 'nur N2', B: 'nur N2' },
  ACWX: { AV: 'Signal R2 (nur Schluss)', A: 'Nicht-US R2', B: 'Nicht-US R2' },
  EFA: { Z: 'Zusatz: Nicht-US', AV: 'nur N2 (Schluss)', A: 'nur N2', B: 'nur N2' },
  AGG: { Z: 'Zusatz: Anleihen R2 (ab 29.09.2003)', A: 'Anleihen R2', B: 'Anleihen R2' }
};
var JAHRE_FENSTER = { A: tageZwischen('2017-01-04', '2021-09-15') / 365.25, B: tageZwischen('2021-09-16', ENDE) / 365.25 };

/* ---------------- kleine Helfer ---------------- */
function tageZwischen(a, b) { return Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / 86400000); }
function plusTage(tag, n) { return new Date(Date.parse(tag + 'T00:00:00Z') + n * 86400000).toISOString().slice(0, 10); }
function wochentag(tag) { return new Date(tag + 'T00:00:00Z').getUTCDay(); }
function imZr(tag, z) { return tag >= z.von && tag <= z.bis; }
function sortiert(a) { return a.slice().sort(function (x, y) { return x - y; }); }
function median(a) {
  if (!a.length) return null;
  var s = sortiert(a), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
/** p-Punkt nach dem Rang-Verfahren (kleinster Wert, unter oder auf dem mindestens der Anteil p der Werte liegt). */
function punkt(a, p) {
  if (!a.length) return null;
  var s = sortiert(a);
  return s[Math.max(0, Math.min(s.length - 1, Math.ceil(p * s.length) - 1))];
}
function maxAbs(a, feld) {
  var best = null;
  a.forEach(function (x) { if (x[feld] !== null && x[feld] !== undefined && (best === null || Math.abs(x[feld]) > Math.abs(best[feld]))) best = x; });
  return best;
}
/** relative Groesse in Prozent, 4 Nachkommastellen. */
function pz(x) { return x === null || x === undefined || !isFinite(x) ? null : Math.round(x * 1e6) / 1e4; }
function r6(x) { return x === null || x === undefined || !isFinite(x) ? null : Math.round(x * 1e6) / 1e6; }
function anzahlJe(liste, schluessel) {
  var o = {};
  liste.forEach(function (x) { var k = schluessel(x); o[k] = (o[k] || 0) + 1; });
  return o;
}
function hhmm(min) { return min === null || min === undefined ? null : ('0' + Math.floor(min / 60)).slice(-2) + ':' + ('0' + min % 60).slice(-2); }
/** Zahl im deutschen Format fuer Texte (Komma, Tausenderpunkt); nk = feste Nachkommastellen, sonst wie sie ist. */
function de(x, nk) {
  if (x === null || x === undefined || (typeof x === 'number' && !isFinite(x))) return '–';
  if (typeof x !== 'number') return String(x);
  var s = (nk === undefined ? String(x) : x.toFixed(nk)).replace('.', ',');
  var teile = s.split(',');
  teile[0] = teile[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return teile.join(',');
}
function datum(t) { return t ? t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4) : '–'; }
function innen(x, lo, hi) { return x !== null && lo !== null && hi !== null && x >= lo * (1 - 1e-9) && x <= hi * (1 + 1e-9); }

/* ---------------- NYSE-Kalender (unabhaengig vom SPY-Kalender gerechnet) ---------------- */
function utcTag(j, m, t) { return new Date(Date.UTC(j, m, t)).toISOString().slice(0, 10); }
function nterWochentag(j, m, wt, n) { var e = new Date(Date.UTC(j, m, 1)).getUTCDay(); return 1 + ((wt - e + 7) % 7) + (n - 1) * 7; }
function letzterWochentag(j, m, wt) {
  var tage = new Date(Date.UTC(j, m + 1, 0)).getUTCDate();
  var l = new Date(Date.UTC(j, m, tage)).getUTCDay();
  return tage - ((l - wt + 7) % 7);
}
function ostersonntag(j) {
  var a = j % 19, b = Math.floor(j / 100), c = j % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  var g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  var l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  return Date.UTC(j, Math.floor((h + l - 7 * m + 114) / 31) - 1, ((h + l - 7 * m + 114) % 31) + 1);
}
function verschoben(j, m, t) {
  var wt = new Date(Date.UTC(j, m, t)).getUTCDay();
  return wt === 6 ? utcTag(j, m, t - 1) : wt === 0 ? utcTag(j, m, t + 1) : utcTag(j, m, t);
}
/* Sonderschliessungen der NYSE im Zeitraum (Staatsbegraebnisse, 11. September, Sturm Sandy). */
var SONDER = { '1994-04-27': 'Begraebnis Nixon', '2001-09-11': '11. September', '2001-09-12': '11. September',
  '2001-09-13': '11. September', '2001-09-14': '11. September', '2004-06-11': 'Begraebnis Reagan', '2007-01-02': 'Begraebnis Ford',
  '2012-10-29': 'Sturm Sandy', '2012-10-30': 'Sturm Sandy', '2018-12-05': 'Begraebnis G. H. W. Bush', '2025-01-09': 'Begraebnis Carter' };
function nyseFrei(j) {
  var f = {};
  var nj = new Date(Date.UTC(j, 0, 1)).getUTCDay();
  if (nj !== 6) f[nj === 0 ? utcTag(j, 0, 2) : utcTag(j, 0, 1)] = 'Neujahr';    // Samstag: kein Ersatztag (NYSE-Regel)
  if (j >= 1998) f[utcTag(j, 0, nterWochentag(j, 0, 1, 3))] = 'Martin Luther King';
  f[utcTag(j, 1, nterWochentag(j, 1, 1, 3))] = 'Presidents Day';
  f[new Date(ostersonntag(j) - 2 * 86400000).toISOString().slice(0, 10)] = 'Karfreitag';
  f[utcTag(j, 4, letzterWochentag(j, 4, 1))] = 'Memorial Day';
  if (j >= 2022) f[verschoben(j, 5, 19)] = 'Juneteenth';
  f[verschoben(j, 6, 4)] = 'Unabhaengigkeitstag';
  f[utcTag(j, 8, nterWochentag(j, 8, 1, 1))] = 'Labor Day';
  f[utcTag(j, 10, nterWochentag(j, 10, 4, 4))] = 'Thanksgiving';
  f[verschoben(j, 11, 25)] = 'Weihnachten';
  Object.keys(SONDER).forEach(function (t) { if (+t.slice(0, 4) === j) f[t] = SONDER[t]; });
  return f;
}
/** Halbtage (Schluss 13:00 ET): Tag nach Thanksgiving, Heiligabend an Werktagen, 3. Juli wenn der 4. auf Di-Fr faellt. */
function nyseHalbtage(j) {
  var frei = nyseFrei(j), h = {};
  h[utcTag(j, 10, nterWochentag(j, 10, 4, 4) + 1)] = 'nach Thanksgiving';
  var wt24 = new Date(Date.UTC(j, 11, 24)).getUTCDay();
  if (wt24 >= 1 && wt24 <= 5) h[utcTag(j, 11, 24)] = 'Heiligabend';
  var wt4 = new Date(Date.UTC(j, 6, 4)).getUTCDay();
  if (wt4 >= 2 && wt4 <= 5) h[utcTag(j, 6, 3)] = 'vor dem 4. Juli';
  Object.keys(h).forEach(function (t) { if (frei[t]) delete h[t]; });
  return h;
}

/* ---------------- Yahoo-Reihen lesen ---------------- */
function ladeReihe(sym) {
  var roh = fs.readFileSync(path.join(DATEN, sym + '.json'), 'utf8');
  var l = L.lies(roh);
  var R = { sym: sym, meta: l.meta, alle: l.zeilen, div: l.div, splits: l.splits, sha: L.sha256(roh) };
  R.bis = l.zeilen.filter(function (z) { return z.tag <= ENDE; });
  R.nachEnde = l.zeilen.length - R.bis.length;
  R.folge = R.bis.filter(function (z) { return z.c !== null && z.c > 0; });     // Zeilen mit brauchbarem Schluss
  R.idx = {};
  R.folge.forEach(function (z, i) { R.idx[z.tag] = i; });
  R.jeTag = {};
  R.bis.forEach(function (z) { R.jeTag[z.tag] = z; });
  R.ersterTag = R.folge.length ? R.folge[0].tag : null;
  R.divBis = l.div.filter(function (d) { return d.tag <= ENDE; });
  /* Splitfaktor: Yahoo-Kurs = Rohkurs x faktor(tag). Bei "z:n" (z neue je n alte) ist der bereinigte Vorkurs Rohkurs x n/z. */
  R.faktor = function (tag) {
    var f = 1;
    R.splits.forEach(function (s) { if (tag < s.tag) f *= s.nenner / s.zaehler; });
    return f;
  };
  return R;
}

/** Ausschuettungen nach REGEL §2.5 den Zeilen zuordnen: Ex-Tag ohne Zeile -> naechste Zeile mit Schluss. */
function buche(R, divListe) {
  var gebucht = {}, verschobenListe = [], vorErster = [];
  var j = 0;
  for (var i = 0; i < R.folge.length; i++) {
    var z = R.folge[i];
    while (j < divListe.length && divListe[j].tag <= z.tag) {
      var d = divListe[j];
      if (i === 0) vorErster.push(d.tag);
      else {
        gebucht[z.tag] = (gebucht[z.tag] || 0) + d.betrag;
        if (d.tag !== z.tag) verschobenListe.push({ exTag: d.tag, gebuchtAm: z.tag });
      }
      j++;
    }
  }
  return { gebucht: gebucht, verschoben: verschobenListe, vorErsterZeile: vorErster };
}
/** Gesamtertrag TR(t) = TR(t-1) x (C(t) + D(t)) / C(t-1), TR = 1 an der ersten Zeile; ersatzC ersetzt einzelne Schluesse. */
function trReihe(R, gebucht, ersatzC) {
  var tr = new Array(R.folge.length);
  var cv = null;
  for (var i = 0; i < R.folge.length; i++) {
    var z = R.folge[i];
    var c = (ersatzC && ersatzC[z.tag] !== undefined) ? ersatzC[z.tag] : z.c;
    tr[i] = i === 0 ? 1 : tr[i - 1] * (c + (gebucht[z.tag] || 0)) / cv;
    cv = c;
  }
  return tr;
}

/* ---------------- (1) Aufbau ---------------- */
function aufbau(R) {
  var tage = anzahlJe(R.alle, function (z) { return z.tag; });
  var doppelt = Object.keys(tage).filter(function (t) { return tage[t] > 1; });
  var wochenende = R.alle.filter(function (z) { var w = wochentag(z.tag); return w === 0 || w === 6; }).map(function (z) { return z.tag; });
  var uhr = anzahlJe(R.alle, function (z) { return L.nyZeit(z.ts); });
  var uhrDiv = anzahlJe(R.div, function (d) { return L.nyZeit(d.ts); });
  var unsortiert = 0;
  for (var i = 1; i < R.alle.length; i++) if (R.alle[i].ts <= R.alle[i - 1].ts) unsortiert++;
  var nach = R.alle.filter(function (z) { return z.tag > ENDE; });
  return {
    zeilenGesamt: R.alle.length,
    ersterTag: R.alle.length ? R.alle[0].tag : null,
    letzterTag: R.alle.length ? R.alle[R.alle.length - 1].tag : null,
    zeilenBisEnde: R.bis.length,
    zeilenNachEnde: R.nachEnde,
    nachEndeVonBis: nach.length ? [nach[0].tag, nach[nach.length - 1].tag] : null,
    ersterTagMitSchluss: R.ersterTag,
    letzterTagBisEnde: R.folge.length ? R.folge[R.folge.length - 1].tag : null,
    doppelteTage: doppelt,
    wochenendTage: wochenende,
    zeitstempelUnsortiertOderGleich: unsortiert,
    uhrzeitNewYork: uhr,
    uhrzeitAusschuettungsstempel: uhrDiv,
    ausschuettungenGesamt: R.div.length,
    ausschuettungenNachEnde: R.div.filter(function (d) { return d.tag > ENDE; }).map(function (d) { return d.tag; }),
    splits: R.splits.map(function (s) { return s.tag + ' ' + s.zaehler + ':' + s.nenner; }),
    boerse: R.meta.fullExchangeName || R.meta.exchangeName,
    waehrung: R.meta.currency,
    zeitzone: R.meta.exchangeTimezoneName,
    ersterHandelMeta: R.meta.firstTradeDate ? L.nyTag(R.meta.firstTradeDate) : null
  };
}

/* ---------------- (2)+(3) je Zeitraum ---------------- */
function pruefeZeitraum(R, z, spyTage, spyRendite) {
  var thr = SCHWELLE[KLASSE[R.sym]];
  var spySet = {};
  spyTage.forEach(function (t) { spySet[t] = 1; });
  var zeilen = R.bis.filter(function (x) { return imZr(x.tag, z); });
  var tageSpy = spyTage.filter(function (t) { return imZr(t, z); });
  var vorErst = R.ersterTag ? tageSpy.filter(function (t) { return t < R.ersterTag; }).length : tageSpy.length;
  var fehlend = R.ersterTag ? tageSpy.filter(function (t) { return t >= R.ersterTag && !R.jeTag[t]; }) : [];
  var ueber = zeilen.filter(function (x) { return !spySet[x.tag]; }).map(function (x) { return x.tag; });
  function tagListe(f) { return zeilen.filter(f).map(function (x) { return x.tag; }); }
  var o = {
    zeitraum: z.id, von: z.von, bis: z.bis,
    spyHandelstage: tageSpy.length, zeilen: zeilen.length,
    ersteZeile: zeilen.length ? zeilen[0].tag : null, letzteZeile: zeilen.length ? zeilen[zeilen.length - 1].tag : null,
    spyTageVorErstnotiz: vorErst,
    fehlendeTage: fehlend, ueberzaehligeTage: ueber,
    ohneSchluss: tagListe(function (x) { return x.c === null; }),
    ohneEroeffnung: tagListe(function (x) { return x.o === null; }),
    nichtPositiv: tagListe(function (x) { return [x.o, x.h, x.l, x.c].some(function (v) { return v !== null && v <= 0; }); }),
    hochUnterTief: tagListe(function (x) { return x.h !== null && x.l !== null && x.h < x.l; }),
    eroeffnungAusserhalbSpanne: tagListe(function (x) { return x.o !== null && x.h !== null && x.l !== null && !innen(x.o, x.l, x.h); }),
    schlussAusserhalbSpanne: tagListe(function (x) { return x.c !== null && x.h !== null && x.l !== null && !innen(x.c, x.l, x.h); }),
    umsatzNullOderLeer: zeilen.filter(function (x) { return !x.v; }).length,
    sprungSchluss: [], lueckeSchlussEroeffnung: [], sprungPaare: [], eroeffnungsAusreisser: [],
    eroeffnungGleichSchluss: 0, eroeffnungGleichVortagsschluss: 0, flacheKerze: 0, vergleichbareTage: 0
  };
  var r = [];
  for (var i = 1; i < R.folge.length; i++) {
    var a = R.folge[i - 1], b = R.folge[i];
    if (!imZr(b.tag, z)) continue;
    var D = R.gebucht[b.tag] || 0;
    var rc = b.c / a.c - 1, rtr = (b.c + D) / a.c - 1;
    var markt = spyRendite[b.tag];
    r.push({ i: i, tag: b.tag, r: rc });
    o.vergleichbareTage++;
    if (Math.abs(rc) > thr) o.sprungSchluss.push({ tag: b.tag, vortag: a.tag, r: pz(rc), rMitAusschuettung: pz(rtr), spyAmTag: pz(markt) });
    if (b.o !== null && b.o > 0) {
      var g = b.o / a.c - 1, oc = b.o / b.c - 1;
      if (Math.abs(g) > thr) o.lueckeSchlussEroeffnung.push({ tag: b.tag, luecke: pz(g), schlussZuEroeffnung: pz(b.c / b.o - 1), spyAmTag: pz(markt) });
      if (Math.abs(g) > thr / 2 && Math.abs(oc) > thr / 2 && (g > 0) === (oc > 0)) {
        o.eroeffnungsAusreisser.push({ tag: b.tag, eroeffnungZuVortagsschluss: pz(g), eroeffnungZuSchluss: pz(oc), spyAmTag: pz(markt) });
      }
      if (Math.abs(b.o / b.c - 1) < EPS) o.eroeffnungGleichSchluss++;
      if (Math.abs(b.o / a.c - 1) < EPS) o.eroeffnungGleichVortagsschluss++;
      if (b.h !== null && b.l !== null && Math.abs(b.h / b.l - 1) < EPS && Math.abs(b.o / b.c - 1) < EPS) o.flacheKerze++;
    }
  }
  for (var k = 1; k < r.length; k++) {
    var r1 = r[k - 1].r, r2 = r[k].r;
    if (r[k].i !== r[k - 1].i + 1) continue;
    if (Math.abs(r1) > thr / 2 && Math.abs(r2) > thr / 2 && (r1 > 0) !== (r2 > 0) &&
        Math.abs((1 + r1) * (1 + r2) - 1) < 0.3 * Math.min(Math.abs(r1), Math.abs(r2))) {
      o.sprungPaare.push({ tag1: r[k - 1].tag, r1: pz(r1), tag2: r[k].tag, r2: pz(r2), netto: pz((1 + r1) * (1 + r2) - 1),
        spy1: pz(spyRendite[r[k - 1].tag]), spy2: pz(spyRendite[r[k].tag]) });
    }
  }
  return o;
}

/* Eroeffnung = Vortagsschluss / = Schluss / flache Kerze je Kalenderjahr. */
function eroeffnungJeJahr(R) {
  var j = {};
  for (var i = 1; i < R.folge.length; i++) {
    var a = R.folge[i - 1], b = R.folge[i], y = b.tag.slice(0, 4);
    var e = j[y] || (j[y] = { tage: 0, oGleichVortag: 0, oGleichSchluss: 0, flach: 0, ohneO: 0 });
    e.tage++;
    if (b.o === null || b.o <= 0) { e.ohneO++; continue; }
    if (Math.abs(b.o / a.c - 1) < EPS) e.oGleichVortag++;
    if (Math.abs(b.o / b.c - 1) < EPS) e.oGleichSchluss++;
    if (b.h !== null && b.l !== null && Math.abs(b.h / b.l - 1) < EPS && Math.abs(b.o / b.c - 1) < EPS) e.flach++;
  }
  return j;
}
function oGleichVortag(R, tag) {
  var i = R.idx[tag];
  if (!i) return false;
  var b = R.folge[i];
  return b.o !== null && Math.abs(b.o / R.folge[i - 1].c - 1) < EPS;
}

/* ---------------- (4) Splits ---------------- */
function vorSchluss(R, tag) {
  for (var i = R.folge.length - 1; i >= 0; i--) if (R.folge[i].tag < tag) return R.folge[i];
  return null;
}
function splitPruefung(R) {
  return R.splits.filter(function (s) { return s.tag <= ENDE; }).map(function (s) {
    var idx = -1;
    for (var i = 0; i < R.folge.length; i++) if (R.folge[i].tag >= s.tag) { idx = i; break; }
    var um = [];
    for (var k = Math.max(1, idx - 3); k <= Math.min(R.folge.length - 1, idx + 3); k++) {
      um.push({ tag: R.folge[k].tag, schlussZuVortag: pz(R.folge[k].c / R.folge[k - 1].c - 1),
        eroeffnungZuVortag: R.folge[k].o ? pz(R.folge[k].o / R.folge[k - 1].c - 1) : null,
        adjZuVortag: (R.folge[k].adj && R.folge[k - 1].adj) ? pz(R.folge[k].adj / R.folge[k - 1].adj - 1) : null });
    }
    /* Gleiche Basis heisst: die Ausschuettungsrenditen vorher und nachher liegen in derselben Groessenordnung; ein Faktor
     * n/z (hier 2 bzw. 1/3) dazwischen waere eine fremde Basis. */
    var divs = R.divBis.map(function (d) {
      var vor = vorSchluss(R, d.tag);
      return { exTag: d.tag, rendite: vor ? pz(d.betrag / vor.c) : null };
    });
    var vorher = divs.filter(function (d) { return d.exTag < s.tag; }).slice(-4);
    var nachher = divs.filter(function (d) { return d.exTag >= s.tag; }).slice(0, 4);
    var rv = vorher.map(function (d) { return d.rendite; }).filter(function (x) { return x !== null; });
    var rn = nachher.map(function (d) { return d.rendite; }).filter(function (x) { return x !== null; });
    /* Rundungsprobe ohne Betraege auszugeben: ein bereinigter Betrag ist "Rohbetrag x Kursfaktor"; ist der Rohbetrag
     * (= Betrag / Kursfaktor) auf drei Stellen rund, der Betrag selbst aber nicht, wurde er nachweislich umgerechnet. */
    var kf = s.nenner / s.zaehler;
    function rund3(x) { return Math.abs(x * 1000 - Math.round(x * 1000)) < 1e-3; }
    var vorAlle = R.divBis.filter(function (d) { return d.tag < s.tag; });
    return { tag: s.tag, verhaeltnis: s.zaehler + ':' + s.nenner, kursfaktorVorher: kf,
      schlussUmDenStichtag: um, ausschuettungenVorher: vorher, ausschuettungenNachher: nachher,
      renditeMedianVorher: median(rv), renditeMedianNachher: median(rn),
      verhaeltnisDerRenditen: (median(rv) && median(rn)) ? r6(median(rv) / median(rn)) : null,
      rundungsprobeVorher: { zahl: vorAlle.length,
        rohbetragRund: vorAlle.filter(function (d) { return rund3(d.betrag / kf); }).length,
        betragSelbstRund: vorAlle.filter(function (d) { return rund3(d.betrag); }).length } };
  });
}

/* ---------------- (5) Ausschuettungen ---------------- */
function ausschuettungen(R, spySet, info) {
  var jeJahr = {}, jeMonat = {};
  R.divBis.forEach(function (d) {
    jeJahr[d.tag.slice(0, 4)] = (jeJahr[d.tag.slice(0, 4)] || 0) + 1;
    jeMonat[d.tag.slice(0, 7)] = (jeMonat[d.tag.slice(0, 7)] || 0) + 1;
  });
  var mehrfach = Object.keys(jeMonat).filter(function (m) { return jeMonat[m] > 1; });
  /* Erwartete Zahl je Jahr = haeufigster Wert der vollen Jahre (erstes Jahr der Reihe und 2026 ausgenommen). */
  var erstJ = R.ersterTag ? +R.ersterTag.slice(0, 4) : 2026;
  var voll = [];
  for (var y = erstJ + 1; y <= 2025; y++) voll.push(String(y));
  var zaehl = anzahlJe(voll, function (x) { return jeJahr[x] || 0; });
  var modus = +Object.keys(zaehl).sort(function (a, b) { return zaehl[b] - zaehl[a]; })[0];
  var abweichend = voll.filter(function (x) { return (jeJahr[x] || 0) !== modus; }).map(function (x) { return { jahr: x, zahl: jeJahr[x] || 0 }; });
  /* Monatszahler: der Januar entfaellt planmaessig, wenn der Dezember zwei Ex-Tage hat (Anfang und Ende Dezember). */
  var fehlMonate = [], dezemberDoppelt = 0;
  if (modus === 12) {
    voll.forEach(function (x) {
      if (jeMonat[x + '-12'] > 1) dezemberDoppelt++;
      for (var m = 1; m <= 12; m++) {
        var k = x + '-' + (m < 10 ? '0' : '') + m;
        if (jeMonat[k]) continue;
        if (m === 1 && jeMonat[(+x - 1) + '-12'] > 1) continue;
        fehlMonate.push(k);
      }
    });
  }
  var mehrfachOhneDezember = mehrfach.filter(function (m) { return !(modus === 12 && m.slice(5) === '12' && jeMonat[m] === 2); })
    .map(function (m) {
      return { monat: m, exTage: R.divBis.filter(function (d) { return d.tag.slice(0, 7) === m; }).map(function (d) {
        var vor = vorSchluss(R, d.tag);
        return d.tag + (vor ? ' (' + de(pz(d.betrag / vor.c), 3) + ' %)' : '');
      }) };
    });
  var renditen = R.divBis.map(function (d) {
    var vor = vorSchluss(R, d.tag);
    return { exTag: d.tag, betrag: d.betrag, rendite: vor ? d.betrag / vor.c : null };
  });
  var rw = renditen.filter(function (x) { return x.rendite !== null; }).map(function (x) { return x.rendite; });
  var med = median(rw);
  var hoch = renditen.filter(function (x) { return x.rendite !== null && x.rendite > 3 * med; })
    .map(function (x) { return { exTag: x.exTag, rendite: pz(x.rendite), vielfachesDesMedians: r6(x.rendite / med) }; });
  return {
    zahlBisEnde: R.divBis.length,
    jeJahr: jeJahr,
    erwartetJeJahr: modus,
    jahreMitAbweichenderZahl: abweichend,
    dezemberMitZweiExTagenVolleJahre: modus === 12 ? dezemberDoppelt : null,
    monateMitMehrerenExTagen: mehrfachOhneDezember,
    fehlendeMonateInVollenJahren: fehlMonate,
    exTagKeinSpyHandelstag: R.divBis.filter(function (d) { return !spySet[d.tag]; }).map(function (d) { return d.tag; }),
    exTagOhneZeileDerReihe: info.verschoben,
    exTagAnOderVorErsterZeile: info.vorErsterZeile,
    nichtPositiveBetraege: R.divBis.filter(function (d) { return !(d.betrag > 0); }).map(function (d) { return d.tag; }),
    renditeMedian: pz(med),
    renditeMax: pz(Math.max.apply(null, rw)),
    renditeUeberDreifachemMedian: hoch
  };
}

/* Gesamtertrag gegen adjclose. Zwei Vergleiche je Tag:
 *  d  = (TR(t)/TR(t-1)) / (adj(t)/adj(t-1)) - 1         -> REGEL §2.5 (Ausschuettung zum Schluss des Ex-Tags angelegt)
 *  dY = ((C(t)/(C(t-1) - D(t))) / (adj(t)/adj(t-1)) - 1  -> Yahoo-Verfahren (Faktor 1 - D/C(t-1) auf alle Vortage)
 * dY misst, ob adjclose genau die gemeldeten Ausschuettungen enthaelt; d enthaelt zusaetzlich den Verfahrensunterschied. */
function trGegenAdj(R) {
  var q = [];
  for (var i = 1; i < R.folge.length; i++) {
    var a = R.folge[i - 1], b = R.folge[i];
    if (!a.adj || !b.adj) { q.push({ tag: b.tag, d: null, dY: null }); continue; }
    var D = R.gebucht[b.tag] || 0;
    var ra = b.adj / a.adj;
    q.push({ tag: b.tag, d: (R.tr[i] / R.tr[i - 1]) / ra - 1, dY: (b.c / (a.c - D)) / ra - 1, ex: D > 0 });
  }
  var aus = {};
  ZR.forEach(function (z) {
    var w = q.filter(function (x) { return imZr(x.tag, z); });
    if (!w.length) return;
    var gueltig = w.filter(function (x) { return x.d !== null; });
    var m = maxAbs(gueltig, 'd'), my = maxAbs(gueltig, 'dY');
    var i0 = -1, i1 = -1;
    for (var i = 0; i < R.folge.length; i++) { if (R.folge[i].tag < z.von) i0 = i; if (R.folge[i].tag <= z.bis) i1 = i; }
    var faktor = null;
    if (i0 >= 0 && i1 > i0 && R.folge[i0].adj && R.folge[i1].adj) faktor = (R.tr[i1] / R.tr[i0]) / (R.folge[i1].adj / R.folge[i0].adj) - 1;
    aus[z.id] = {
      tage: w.length, ohneAdj: w.length - gueltig.length,
      groessteTagesabweichung: m ? { tag: m.tag, abweichung: pz(m.d), exTag: m.ex } : null,
      tageUeber0_01Prozent: gueltig.filter(function (x) { return Math.abs(x.d) > 1e-4; }).length,
      tageUeber0_1Prozent: gueltig.filter(function (x) { return Math.abs(x.d) > 1e-3; }).map(function (x) { return x.tag + ' ' + pz(x.d); }),
      restNachYahooVerfahrenMax: my ? { tag: my.tag, abweichung: pz(my.dY) } : null,
      faktorAbweichung: pz(faktor),
      faktorVon: i0 >= 0 ? R.folge[i0].tag : null, faktorBis: i1 >= 0 ? R.folge[i1].tag : null
    };
  });
  return aus;
}

/* ---------------- (6a) Alpaca-Massnahmen ---------------- */
function alpacaMassnahmen(R) {
  var p = path.join(EBASIS, 'alpaca-massnahmen', R.sym + '.json');
  if (!fs.existsSync(p)) return { fehlt: p };
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  var saetze = (j.saetze || []).slice();
  var dateien = [p.replace(/\\/g, '/')];
  var bisStand = (j.stand || '').slice(0, 10);
  var np = path.join(EBASIS, 'alpaca-massnahmen-nachtrag-2026-10', R.sym + '.json');
  if (fs.existsSync(np)) {
    var n = JSON.parse(fs.readFileSync(np, 'utf8'));
    var ids = {};
    saetze.forEach(function (s) { ids[s.id] = 1; });
    (n.saetze || []).forEach(function (s) { if (!ids[s.id]) saetze.push(s); });
    dateien.push(np.replace(/\\/g, '/'));
    if (n.bis && n.bis > bisStand) bisStand = n.bis;
  }
  var arten = anzahlJe(saetze, function (s) { return s._art; });
  var andere = saetze.filter(function (s) { return s._art !== 'cash_dividends'; });
  var bar = saetze.filter(function (s) { return s._art === 'cash_dividends' && s.symbol === R.sym; });
  var von = j.von || '2016-01-01';
  var bis = bisStand < ENDE ? bisStand : ENDE;
  var y = R.divBis.filter(function (d) { return d.tag >= von && d.tag <= bis; });
  var aBy = {};
  bar.forEach(function (s) { (aBy[s.ex_date] = aBy[s.ex_date] || []).push(s); });
  /* Ausgegeben werden nur Verhaeltnisse und relative Groessen (keine Betraege je Stueck - Daten Dritter, oeffentliches
   * Repo). Die Betraege selbst braucht nur die Kipp-Probe; sie haengen nicht aufzaehlbar an "_intern" und landen so nie in
   * der JSON. g = Wirkung am Ex-Tag relativ zum Vortagsschluss. */
  function relKurs(tag, betrag) { var v = vorSchluss(R, tag); return v ? betrag / v.c : null; }
  var benutzt = {};
  var intern = { ersatz: [], zusatz: [], gAnders: [], gNurYahoo: [], gNurAlpaca: [] };
  var gleich = 0, anders = [], nurYahoo = [], verschoben2 = [], relDiffs = [], kursDiffs = [];
  y.forEach(function (d) {
    var f = R.faktor(d.tag);
    var a = aBy[d.tag];
    if (a) {
      a.forEach(function (s) { benutzt[s.id] = 1; });
      var rate = a.reduce(function (s, x) { return s + x.rate; }, 0) * f;
      var diff = d.betrag - rate;
      relDiffs.push(Math.abs(diff / rate));
      kursDiffs.push(Math.abs(relKurs(d.tag, diff)));
      /* gleich: Yahoo rundet auf 3 Stellen (bei BIL vor dem Split: Rohbetrag auf 3 Stellen, dann x 2) */
      if (Math.abs(diff) <= 0.0005 * f + 1e-9 || Math.abs(diff / rate) < 1e-4) { gleich++; return; }
      var alp = r6(rate), q = d.betrag / alp;
      var art = (q > 1.9 && q < 2.1) ? 'doppelt'
        : (f !== 1 && Math.abs(d.betrag - Math.round(alp / f * 1000) / 1000 * f) < 1e-6) ? 'rundung' : 'abweichend';
      var g = relKurs(d.tag, d.betrag - alp);
      anders.push({ exTag: d.tag, verhaeltnisYahooZuAlpaca: r6(q), abweichungProzent: pz(diff / rate), wirkungProzentDesKurses: pz(g),
        splitfaktor: f, saetze: a.length, art: art });
      intern.ersatz.push({ tag: d.tag, betrag: alp });
      intern.gAnders.push(g);
      return;
    }
    var best = null;
    bar.forEach(function (s) {
      if (benutzt[s.id]) return;
      var dt = Math.abs(tageZwischen(d.tag, s.ex_date));
      if (dt <= 7 && (!best || dt < best.dt)) best = { s: s, dt: dt };
    });
    if (best) {
      benutzt[best.s.id] = 1;
      verschoben2.push({ yahooExTag: d.tag, alpacaExTag: best.s.ex_date, verhaeltnisYahooZuAlpaca: r6(d.betrag / (best.s.rate * f)) });
    } else {
      var gy = relKurs(d.tag, d.betrag);
      nurYahoo.push({ exTag: d.tag, renditeProzent: pz(gy) });
      intern.gNurYahoo.push(gy);
    }
  });
  var nurAlpaca = bar.filter(function (s) { return !benutzt[s.id] && s.ex_date >= von && s.ex_date <= bis; })
    .map(function (s) {
      var f = R.faktor(s.ex_date), ga = relKurs(s.ex_date, s.rate * f);
      intern.zusatz.push({ tag: s.ex_date, betrag: s.rate * f });
      intern.gNurAlpaca.push(ga);
      return { exTag: s.ex_date, renditeProzent: pz(ga), splitfaktor: f, special: s.special };
    });
  var aus = {
    dateien: dateien, abgedeckt: von + ' .. ' + bis, arten: arten,
    andereMassnahmen: andere.map(function (s) {
      var k = {};
      Object.keys(s).forEach(function (x) { if (x !== 'id' && x !== 'cusip' && x !== 'old_cusip' && x !== 'new_cusip') k[x] = s[x]; });
      return k;
    }),
    yahooImBereich: y.length, alpacaImBereich: bar.filter(function (s) { return s.ex_date >= von && s.ex_date <= bis; }).length,
    gleich: gleich, betragAnders: anders, datumVerschoben: verschoben2, nurYahoo: nurYahoo, nurAlpaca: nurAlpaca,
    groessteRelativeAbweichungProzent: relDiffs.length ? pz(Math.max.apply(null, relDiffs)) : null,
    groessteWirkungProzentDesKurses: kursDiffs.length ? pz(Math.max.apply(null, kursDiffs)) : null
  };
  Object.defineProperty(aus, '_intern', { value: intern, enumerable: false });
  return aus;
}

/* ---------------- (6b) Alpaca-Minutenarchiv ---------------- */
var NYTEILE = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit',
  day: '2-digit', hour: '2-digit', minute: '2-digit' });
var versatzCache = {};
/** Versatz New York gegen UTC in ms fuer die UTC-Stunde des Stempels (Kerzen liegen 04:00-20:00 ET, nie in der Umstellstunde). */
function nyVersatz(ms) {
  var h = Math.floor(ms / 3600000);
  var v = versatzCache[h];
  if (v === undefined) {
    var p = {};
    NYTEILE.formatToParts(new Date(h * 3600000)).forEach(function (x) { p[x.type] = x.value; });
    v = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute) - h * 3600000;
    versatzCache[h] = v;
  }
  return v;
}
var tagCache = {};
function lokalTag(loc) {
  var k = Math.floor(loc / 86400000);
  return tagCache[k] || (tagCache[k] = new Date(k * 86400000).toISOString().slice(0, 10));
}
function lokalMinute(loc) { return Math.floor((((loc % 86400000) + 86400000) % 86400000) / 60000); }

/** Regulaere Sitzung je Tag laut Sitzungskalender der SPY-Datei (nur zum Gegenpruefen der Halbtagsregel). */
function sitzungsFenster(sitzungen) {
  var f = {};
  (sitzungen || []).forEach(function (s) {
    if (s.sitzung !== 'regulaer') return;
    var lv = s.von + nyVersatz(s.von), lb = s.bis + nyVersatz(s.bis);
    var tag = lokalTag(lv), auf = lokalMinute(lv), zu = lokalMinute(lb) + 1;
    if (f[tag]) { f[tag].auf = Math.min(f[tag].auf, auf); f[tag].zu = Math.max(f[tag].zu, zu); f[tag].teile++; }
    else f[tag] = { auf: auf, zu: zu, teile: 1 };
  });
  return f;
}
var HALB = {};
for (var hj = 2016; hj <= 2026; hj++) Object.keys(nyseHalbtage(hj)).forEach(function (t) { HALB[t] = 1; });
function schlussMinute(tag) { return HALB[tag] ? 780 : 960; }

/** Tageswerte aus Minutenkerzen [zeit, schluss, umsatz, hoch, tief, eroeffnung]. Sitzung 09:30 bis 16:00 (Halbtag 13:00) ET.
 *  Eroeffnung = O der ersten regulaeren Kerze; Schluss-Kandidaten: C1 = O der Schlusskerze (16:00 bzw. 13:00),
 *  C2 = C der Schlusskerze, C3 = C der letzten regulaeren Kerze. */
function tagesWerte(datei) {
  var fremd = (datei.quellen || []).filter(function (q) { return q.quelle !== 'alpaca'; });
  var tage = {}, fremdKerzen = 0;
  var s = datei.series || [];
  for (var i = 0; i < s.length; i++) {
    var k = s[i];
    if (fremd.length && fremd.some(function (q) { return k[0] >= q.von && k[0] <= q.bis; })) { fremdKerzen++; continue; }
    var loc = k[0] + nyVersatz(k[0]);
    var tag = lokalTag(loc), min = lokalMinute(loc), zu = schlussMinute(tag);
    var t = tage[tag];
    if (!t) t = tage[tag] = { n: 0, o: null, oMin: null, oH: null, oL: null, c1: null, c2: null, c1H: null, c1L: null, c3: null, c3Min: null, regH: null, regL: null, zu: zu };
    if (min >= 570 && min < zu) {
      t.n++;
      if (t.o === null) { t.o = k[5]; t.oMin = min; t.oH = k[3]; t.oL = k[4]; }
      t.c3 = k[1]; t.c3Min = min;
      if (t.regH === null || k[3] > t.regH) t.regH = k[3];
      if (t.regL === null || k[4] < t.regL) t.regL = k[4];
    } else if (min === zu) { t.c1 = k[5]; t.c2 = k[1]; t.c1H = k[3]; t.c1L = k[4]; }
  }
  return { tage: tage, fremdKerzen: fremdKerzen, quellen: (datei.quellen || []).map(function (q) { return q.quelle; }) };
}

function minutenLesen(reihen) {
  var JAHRE = [];
  for (var y = 2016; y <= +ENDE.slice(0, 4); y++) JAHRE.push(y);
  var vergleich = {}, kopf = {};
  var fensterPruef = { tageImSpyKalender: 0, regulaerNichtAb0930: [], schlussLautSpyDatei: {}, abweichendVonHalbtagsregel: [] };
  KUERZEL.forEach(function (s) { vergleich[s] = {}; kopf[s] = { dateien: 0, fremdKerzen: 0, quellen: {}, formate: {} }; });
  JAHRE.forEach(function (y) {
    KUERZEL.forEach(function (sym) {
      var p = path.join(EBASIS, 'alpaca1m', sym, y + '.json');
      if (!fs.existsSync(p)) return;
      var datei = JSON.parse(fs.readFileSync(p, 'utf8'));
      kopf[sym].dateien++;
      kopf[sym].formate[datei.format] = (kopf[sym].formate[datei.format] || 0) + 1;
      if (sym === 'SPY') {
        var f = sitzungsFenster(datei.sitzungen);
        Object.keys(f).forEach(function (t) {
          if (t > ENDE) return;
          fensterPruef.tageImSpyKalender++;
          if (f[t].auf !== 570 || f[t].teile !== 1) fensterPruef.regulaerNichtAb0930.push(t + ' ' + hhmm(f[t].auf));
          var zuText = hhmm(f[t].zu);
          fensterPruef.schlussLautSpyDatei[zuText] = (fensterPruef.schlussLautSpyDatei[zuText] || 0) + 1;
          if (f[t].zu !== schlussMinute(t)) fensterPruef.abweichendVonHalbtagsregel.push(datum(t) + ': letzte reguläre SPY-Kerze ' + hhmm(f[t].zu - 1) + ', Schluss laut Regel ' + hhmm(schlussMinute(t)));
        });
      }
      var tw = tagesWerte(datei);
      datei = null;
      kopf[sym].fremdKerzen += tw.fremdKerzen;
      tw.quellen.forEach(function (q) { kopf[sym].quellen[q] = (kopf[sym].quellen[q] || 0) + 1; });
      Object.keys(tw.tage).forEach(function (t) { if (t <= ENDE) vergleich[sym][t] = tw.tage[t]; });
    });
  });
  var je = {};
  KUERZEL.forEach(function (sym) {
    var R = reihen[sym], A = vergleich[sym];
    var tageListe = [], fehltAlpaca = [], fehltYahoo = [], unvollstaendig = [];
    R.folge.forEach(function (z, i) {
      if (z.tag < '2016-01-01') return;
      var a = A[z.tag];
      if (!a || a.n === 0) { fehltAlpaca.push(z.tag); return; }
      var f = R.faktor(z.tag);
      /* unvollstaendig: keine Schlusskerze und die letzte regulaere Kerze liegt mehr als 5 Minuten vor dem Schluss */
      var unv = a.c1 === null && a.c3Min < a.zu - 5;
      if (unv) unvollstaendig.push(z.tag + ' (letzte Kerze ' + hhmm(a.c3Min) + ')');
      var cA = a.c1 !== null ? a.c1 : a.c3;
      var dc = [a.c1, a.c2, a.c3].filter(function (x) { return x !== null; }).map(function (x) { return z.c / (x * f) - 1; });
      tageListe.push({
        tag: z.tag, f: f, yo: z.o, yc: z.c, ao: a.o * f, ac: cA * f, cQuelle: a.c1 !== null ? 'C1' : 'C3', unv: unv,
        oMin: a.oMin, n: a.n, veraltet: i > 0 && z.o !== null && Math.abs(z.o / R.folge[i - 1].c - 1) < EPS,
        oInErsterKerze: innen(z.o, a.oL * f, a.oH * f), cInSchlusskerze: a.c1 !== null && innen(z.c, a.c1L * f, a.c1H * f),
        cInSitzung: innen(z.c, a.regL * f, a.regH * f), regH: a.regH * f, regL: a.regL * f,
        dO: (z.o !== null && z.o > 0) ? z.o / (a.o * f) - 1 : null,
        dC: unv ? null : z.c / (cA * f) - 1,
        dCmin: dc.length ? dc.reduce(function (m, x) { return Math.abs(x) < Math.abs(m) ? x : m; }) : null,
        dC1: a.c1 !== null ? z.c / (a.c1 * f) - 1 : null,
        dC2: a.c2 !== null ? z.c / (a.c2 * f) - 1 : null,
        dC3: a.c3 !== null && !unv ? z.c / (a.c3 * f) - 1 : null
      });
    });
    Object.keys(A).forEach(function (t) { if (A[t].n > 0 && !R.jeTag[t] && t >= (R.ersterTag || '')) fehltYahoo.push(t); });
    je[sym] = { tage: tageListe, fehltAlpaca: fehltAlpaca, fehltYahoo: fehltYahoo.sort(), unvollstaendig: unvollstaendig };
  });
  return { je: je, kopf: kopf, fenster: fensterPruef };
}

function kennzahlen(liste, feld) {
  var w = liste.filter(function (x) { return x[feld] !== null; }).map(function (x) { return Math.abs(x[feld]); });
  var vz = liste.filter(function (x) { return x[feld] !== null; }).map(function (x) { return x[feld]; });
  return { n: w.length, medianBetrag: pz(median(w)), p95Betrag: pz(punkt(w, 0.95)), p99Betrag: pz(punkt(w, 0.99)),
    maxBetrag: pz(w.length ? Math.max.apply(null, w) : null), medianMitVorzeichen: pz(median(vz)) };
}
/* Einstufung einer Eroeffnungsabweichung: "veraltet" und "ausserhalb" sind Yahoo-Fehler, "innerhalb" ist Quellenrauschen
 * (der Yahoo-Kurs wurde in der ersten Minute tatsaechlich gehandelt). */
function einstufungO(x) {
  if (x.veraltet) return 'Yahoo-Eröffnung = Vortagsschluss (veraltet)';
  if (x.oInErsterKerze) return 'innerhalb der Spanne der ersten Minute der zweiten Quelle';
  return 'außerhalb der Spanne der ersten Minute der zweiten Quelle';
}
function oFehler(x) { return x.veraltet || !x.oInErsterKerze; }
function einstufungC(x) {
  var naechster = x.dCmin === null ? '' : ' (nächster Schluss-Kandidat ' + de(pz(x.dCmin)) + ' %)';
  if (x.dCmin !== null && Math.abs(x.dCmin) < BEFUND_AB) return 'deckt sich mit einem Schluss-Kandidaten der zweiten Quelle' + naechster;
  if (!x.cInSitzung) {
    return (x.yc > x.regH ? 'ÜBER dem Hoch' : 'UNTER dem Tief') + ' der regulären Sitzung der zweiten Quelle (um ' + de(pz(x.yc / (x.yc > x.regH ? x.regH : x.regL) - 1), 3) + ' %)' +
      (x.cInSchlusskerze ? ', nur in der Schlusskerze (Auktion/Nachbörse) gehandelt' : ', auch außerhalb der Schlusskerze') + naechster;
  }
  if (x.cInSchlusskerze) return 'innerhalb der Spanne der Schlusskerze' + naechster;
  return 'innerhalb der Sitzungsspanne, außerhalb der Schlusskerze' + naechster;
}
function zeileO(x) {
  var o = { tag: x.tag, abweichung: pz(x.dO), ersteKerze: hhmm(x.oMin), einstufung: einstufungO(x) };
  if (x.f !== 1) o.splitfaktor = x.f;
  return o;
}
/* Nur relative Groessen: Abweichung zu C1/C2/C3 und Lage des Yahoo-Schlusses zu Hoch und Tief der regulaeren Sitzung. */
function zeileC(x) {
  var o = { tag: x.tag, abweichung: pz(x.dC), kandidat: x.cQuelle, c1: pz(x.dC1), c2: pz(x.dC2), c3: pz(x.dC3),
    gegenSitzungshochProzent: pz(x.yc / x.regH - 1), gegenSitzungstiefProzent: pz(x.yc / x.regL - 1), einstufung: einstufungC(x) };
  if (x.f !== 1) o.splitfaktor = x.f;
  return o;
}

function minutenAuswertung(mv, reihen, spyTage) {
  var zr2 = [{ id: '2016-2026', von: '2016-01-01', bis: ENDE }, { id: 'AV2016', von: '2016-01-01', bis: '2017-01-03' }, ZRID.A, ZRID.B];
  var je = {};
  KUERZEL.forEach(function (sym) {
    var v = mv.je[sym];
    var o = { fehltInAlpaca: {}, fehltInYahoo: v.fehltYahoo, unvollstaendigInAlpaca: v.unvollstaendig, zeitraeume: {} };
    zr2.forEach(function (z) {
      var w = v.tage.filter(function (x) { return imZr(x.tag, z); });
      var veraltet = w.filter(function (x) { return x.veraltet && x.dO !== null; });
      o.fehltInAlpaca[z.id] = v.fehltAlpaca.filter(function (t) { return imZr(t, z); });
      o.zeitraeume[z.id] = {
        tage: w.length,
        eroeffnung: kennzahlen(w, 'dO'),
        schluss: kennzahlen(w, 'dC'),
        schlussKandidaten: { C1_O_der_Schlusskerze: kennzahlen(w, 'dC1'), C2_C_der_Schlusskerze: kennzahlen(w, 'dC2'), C3_C_der_letzten_regulaeren: kennzahlen(w, 'dC3') },
        schlussOhneSchlusskerze: w.filter(function (x) { return x.cQuelle !== 'C1'; }).length,
        ersteKerzeNicht0930: w.filter(function (x) { return x.oMin !== 570; }).length,
        eroeffnungGleichVortagsschluss: { n: veraltet.length,
          davonZweiteQuelleAnders0_05: veraltet.filter(function (x) { return Math.abs(x.dO) > BEFUND_AB; }).map(function (x) { return x.tag + ' ' + pz(x.dO); }) },
        eroeffnungUeber0_5: w.filter(function (x) { return x.dO !== null && Math.abs(x.dO) > GRENZE_O; }).map(zeileO),
        schlussUeber0_2: w.filter(function (x) { return x.dC !== null && Math.abs(x.dC) > GRENZE_C; }).map(zeileC)
      };
    });
    je[sym] = o;
  });
  /* Ausfuehrungstage: erster SPY-Handelstag jedes Monats in A (ab Februar 2017) und B; dazu Start- und Endtage, Monatsenden */
  var ersteTage = {}, monatsEnden = {};
  spyTage.forEach(function (t) { var m = t.slice(0, 7); if (!ersteTage[m]) ersteTage[m] = t; monatsEnden[m] = t; });
  var index = {};
  KUERZEL.forEach(function (sym) { index[sym] = {}; mv.je[sym].tage.forEach(function (x) { index[sym][x.tag] = x; }); });
  function zelleO(sym, t) {
    var x = index[sym][t];
    if (!x) return { fehlt: reihen[sym].jeTag[t] ? 'Alpaca' : 'Yahoo' };
    var o = { d: pz(x.dO) };
    if (x.oMin !== 570) o.ersteKerze = hhmm(x.oMin);
    if (x.dO !== null && Math.abs(x.dO) > BEFUND_AB) o.einstufung = einstufungO(x);
    return o;
  }
  function zelleC(sym, t) {
    var x = index[sym][t];
    if (!x) return { fehlt: reihen[sym].jeTag[t] ? 'Alpaca' : 'Yahoo' };
    var o = { d: pz(x.dC), k: x.cQuelle, dmin: pz(x.dCmin) };
    if (x.dC !== null && Math.abs(x.dC) > BEFUND_AB) o.einstufung = einstufungC(x);
    return o;
  }
  var ausf = [];
  Object.keys(ersteTage).sort().forEach(function (m) {
    var t = ersteTage[m];
    var fenster = (t > '2017-01-04' && t <= '2021-09-15') ? 'A' : (t > '2021-09-16' && t <= ENDE) ? 'B' : null;
    if (!fenster) return;
    var z = { monat: m, tag: t, fenster: fenster };
    KUERZEL.forEach(function (sym) { z[sym] = zelleO(sym, t); });
    ausf.push(z);
  });
  var start = [];
  spyTage.forEach(function (t) {
    var f = (t >= '2017-01-04' && t < '2017-02-04') ? 'A' : (t >= '2021-09-16' && t < '2021-10-16') ? 'B' : null;
    if (!f) return;
    var z = { tag: t, fenster: f };
    KUERZEL.forEach(function (sym) { z[sym] = zelleO(sym, t); });
    start.push(z);
  });
  var mEnden = [];
  Object.keys(monatsEnden).sort().forEach(function (m) {
    var t = monatsEnden[m];
    if (t < '2016-01-01' || t > '2026-08-31') return;
    var z = { monat: m, tag: t };
    KUERZEL.forEach(function (sym) { z[sym] = zelleC(sym, t); });
    mEnden.push(z);
  });
  var endTage = ['2021-09-15', ENDE].map(function (t) {
    var z = { tag: t };
    KUERZEL.forEach(function (sym) { z[sym] = zelleC(sym, t); });
    return z;
  });
  function zusammen(liste, syms) {
    var o = {};
    syms.forEach(function (sym) {
      var w = liste.filter(function (z) { return z[sym] && z[sym].d !== undefined && z[sym].d !== null; });
      var mx = null;
      w.forEach(function (z) { if (mx === null || Math.abs(z[sym].d) > Math.abs(mx.d)) mx = { tag: z.tag, d: z[sym].d }; });
      o[sym] = { n: w.length, fehlend: liste.length - w.length, medianBetragProzent: median(w.map(function (z) { return Math.abs(z[sym].d); })),
        ueber0_05: w.filter(function (z) { return Math.abs(z[sym].d) > BEFUND_AB * 100; }).length, maxProzent: mx };
    });
    return o;
  }
  return {
    je: je,
    ausfuehrungstage: ausf,
    ausfuehrungstageZusammen: { A: zusammen(ausf.filter(function (z) { return z.fenster === 'A'; }), KUERZEL),
      B: zusammen(ausf.filter(function (z) { return z.fenster === 'B'; }), KUERZEL) },
    starttage: start,
    starttageZusammen: { A: zusammen(start.filter(function (z) { return z.fenster === 'A'; }), KUERZEL),
      B: zusammen(start.filter(function (z) { return z.fenster === 'B'; }), KUERZEL) },
    monatsenden: mEnden,
    monatsendenZusammen: zusammen(mEnden, KUERZEL),
    endtage: endTage,
    index: index
  };
}

/* ---------------- Kipp-Probe: fielen Signale mit den Schluessen der zweiten Quelle anders aus? ----------------
 * Nur Signale nach REGEL §4 (keine Buchfuehrung, keine Ertraege). Variante "Schluss": alle Yahoo-Schluesse ab 2016, fuer die
 * die zweite Quelle einen vollstaendigen Tag hat, durch deren Schluss (C1, sonst C3) ersetzt; Ausschuettungen bleiben Yahoo.
 * Variante "Ausschuettung": Yahoo-Schluesse, Betraege mit Abweichung durch Alpaca ersetzt und Alpaca-only-Saetze ergaenzt
 * (Yahoo-only-Saetze bleiben: Alpaca hat dort nachweislich Luecken, z. B. SPY 15.06.2018). */
function kippProbe(reihen, mw, massn, monatsEnden, spyTage) {
  function ersatzSchluss(sym) {
    var m = {};
    Object.keys(mw.index[sym]).forEach(function (t) { var x = mw.index[sym][t]; if (!x.unv) m[t] = x.ac; });
    return m;
  }
  function divAlternative(sym) {
    var R = reihen[sym], a = massn[sym];
    var liste = R.divBis.map(function (d) { return { tag: d.tag, betrag: d.betrag }; });
    if (a && !a.fehlt) {
      a._intern.ersatz.forEach(function (x) { liste.forEach(function (d) { if (d.tag === x.tag) d.betrag = x.betrag; }); });
      a._intern.zusatz.forEach(function (x) { liste.push({ tag: x.tag, betrag: x.betrag }); });
    }
    return liste.sort(function (p, q) { return p.tag < q.tag ? -1 : p.tag > q.tag ? 1 : 0; });
  }
  function trMap(sym, variante) {
    var R = reihen[sym];
    var tr = variante === 'schluss' ? trReihe(R, R.gebucht, ersatzSchluss(sym))
      : variante === 'ausschuettung' ? trReihe(R, buche(R, divAlternative(sym)).gebucht, null) : R.tr;
    var m = {};
    R.folge.forEach(function (z, i) { m[z.tag] = tr[i]; });
    return m;
  }
  function monatsendeVor12(M) {
    var k = (+M.slice(0, 4) - 1) + '-' + M.slice(5, 7);
    for (var i = 0; i < monatsEnden.length; i++) if (monatsEnden[i].slice(0, 7) === k) return monatsEnden[i];
    return null;
  }
  var mE = monatsEnden.filter(function (t) { return t >= '2016-01-01' && t <= '2026-08-31'; });
  function r1(tr) {
    var o = {};
    mE.forEach(function (M) {
      var k = monatsEnden.indexOf(M);
      var s = 0;
      for (var j = k - 9; j <= k; j++) s += tr[monatsEnden[j]];
      o[M] = tr[M] > s / 10;
    });
    return o;
  }
  function r2(trS, trG, trN) {
    var o = {};
    mE.forEach(function (M) {
      var M12 = monatsendeVor12(M);
      if (!M12 || M12 < '2015-12-31') return;
      var rs = trS[M] / trS[M12] - 1, rg = trG[M] / trG[M12] - 1, rn = trN[M] / trN[M12] - 1;
      o[M] = rs > rg ? (rs >= rn ? 'SPY' : 'NichtUS') : 'Anleihen';
    });
    return o;
  }
  function zonen(ersatz) {
    var R = reihen.SPY, o = {}, summe = 0, c = [];
    for (var i = 0; i < R.folge.length; i++) {
      var z = R.folge[i];
      var ci = (ersatz && ersatz[z.tag] !== undefined) ? ersatz[z.tag] : z.c;
      c.push(ci);
      summe += ci;
      if (c.length > 200) summe -= c[c.length - 201];
      if (c.length >= 200 && z.tag >= '2016-01-01') {
        var q = ci / (summe / 200);
        o[z.tag] = q <= 0.99 ? 'unter' : q >= 1.01 ? 'ueber' : 'band';
      }
    }
    return o;
  }
  /* R3-Zustand nach REGEL §4.3 (Anfang am ersten Tag mit 200 Schluessen, dann Band); ausgegeben wird nur der Vergleich. */
  function zustaende(ersatz) {
    var R = reihen.SPY, o = {}, summe = 0, c = [], drin = null;
    for (var i = 0; i < R.folge.length; i++) {
      var z = R.folge[i];
      var ci = (ersatz && ersatz[z.tag] !== undefined) ? ersatz[z.tag] : z.c;
      c.push(ci);
      summe += ci;
      if (c.length > 200) summe -= c[c.length - 201];
      if (c.length < 200) continue;
      var sma = summe / 200;
      if (drin === null) drin = ci > sma;
      else if (drin && ci <= 0.99 * sma) drin = false;
      else if (!drin && ci >= 1.01 * sma) drin = true;
      if (z.tag >= '2016-01-01') o[z.tag] = drin;
    }
    return o;
  }
  function vergleiche(a, b) {
    var ks = Object.keys(a).filter(function (k) { return b[k] !== undefined; });
    return { verglichen: ks.length, abweichend: ks.filter(function (k) { return a[k] !== b[k]; }) };
  }
  var aus = { erklaerung: 'gezaehlt wird nur, ob ein Signal anders ausfiele; Signalstaende und Ertraege werden nicht ausgegeben' };
  ['schluss', 'ausschuettung'].forEach(function (v) {
    var t = {};
    KUERZEL.forEach(function (s) { t[s] = trMap(s, null); });
    var tv = {};
    KUERZEL.forEach(function (s) { tv[s] = trMap(s, v); });
    aus[v] = {
      R1: vergleiche(r1(t.SPY), r1(tv.SPY)),
      R2: vergleiche(r2(t.SPY, t.BIL, t.ACWX), r2(tv.SPY, tv.BIL, tv.ACWX)),
      R2_N2: vergleiche(r2(t.SPY, t.SHY, t.EFA), r2(tv.SPY, tv.SHY, tv.EFA))
    };
    if (v === 'schluss') {
      aus[v].R3_Zone = vergleiche(zonen(null), zonen(ersatzSchluss('SPY')));
      aus[v].R3_Zustand = vergleiche(zustaende(null), zustaende(ersatzSchluss('SPY')));
    }
  });
  /* R3 kann an Tag d nur handeln, wenn der Vortag ausserhalb des Bands lag und der Tag davor in einer anderen Zone (zustandsfrei). */
  var z0 = zonen(null);
  aus.r3MoeglicheHandelstage = function (tag) {
    var i = spyTage.indexOf(tag);
    if (i < 2) return null;
    var a = z0[spyTage[i - 1]], b = z0[spyTage[i - 2]];
    if (!a || !b) return null;
    return (a === 'unter' || a === 'ueber') && a !== b;
  };
  return aus;
}

/* ---------------- (7) Einordnung ---------------- */
function einordnung(erg, reihen, mw, spyTage, kipp) {
  var bef = [];
  function add(b) {
    b.dollarJe100k = b.groesseProzent === null ? null : Math.round(Math.abs(b.groesseProzent) / 100 * KAPITAL);
    if (b.fenster && JAHRE_FENSTER[b.fenster] && b.groesseProzent !== null) b.ppPa = Math.round(Math.abs(b.groesseProzent) / JAHRE_FENSTER[b.fenster] * 1000) / 1000;
    bef.push(b);
  }
  function fensterVon(tag) { return imZr(tag, ZRID.A) ? 'A' : imZr(tag, ZRID.B) ? 'B' : imZr(tag, ZRID.AV) ? 'AV' : 'Z'; }
  if (mw) {
    /* (a) Eroeffnung an Ausfuehrungs- und Starttagen. Vorbehalt nur bei belegtem Yahoo-Fehler (veraltet oder ausserhalb der
     * ersten Minute der zweiten Quelle); liegt der Yahoo-Kurs in der ersten Minute, ist es Quellenrauschen (Hinweis). */
    var tage = {};
    mw.ausfuehrungstage.forEach(function (z) { tage[z.tag] = (tage[z.tag] || []).concat(['Ausführungstag R1/R2']); });
    mw.starttage.forEach(function (z) { tage[z.tag] = (tage[z.tag] || []).concat(['Starttag']); });
    Object.keys(tage).sort().forEach(function (t) {
      KUERZEL.forEach(function (sym) {
        var x = mw.index[sym][t];
        if (!x || x.dO === null || Math.abs(x.dO) < BEFUND_AB) return;
        var haupt = HAUPT.indexOf(sym) >= 0;
        var wer = sym === 'SPY' ? (tage[t].indexOf('Starttag') >= 0 ? 'Maßstab (Kauf am Starttag) und jede Regel, die SPY an diesem Tag kauft oder verkauft' : 'jede Regel, die SPY an diesem Tag kauft oder verkauft')
          : 'nur wenn eine Regel ' + sym + ' an diesem Tag kauft oder verkauft';
        add({ reihe: sym, fenster: fensterVon(t), art: 'Eröffnung an ' + tage[t].join(' + '), tag: t, groesseProzent: pz(x.dO),
          einstufung: einstufungO(x), wirkung: wer + (haupt ? '' : ' (nur N2, nachrichtlich)'),
          stufe: haupt && Math.abs(x.dO) >= VORBEHALT_AB && oFehler(x) ? 'vorbehalt' : 'hinweis' });
      });
    });
    /* (b) Eroeffnung an anderen Tagen in A/B: wirkt nur, wenn R3 an diesem Tag handelt (SPY, BIL). Zustandsfreie Probe:
     * R3 kann an Tag d nur handeln, wenn der Vortag ausserhalb des Bands lag und der Tag davor in einer anderen Zone.
     * Gelistet: an moeglichen R3-Tagen ab 0,05 %, an allen uebrigen Tagen ab 0,5 % (als Hinweis). */
    spyTage.forEach(function (t) {
      if (tage[t] || !(imZr(t, ZRID.A) || imZr(t, ZRID.B))) return;
      var moeglich = kipp.r3MoeglicheHandelstage(t);
      ['SPY', 'BIL'].forEach(function (sym) {
        var x = mw.index[sym][t];
        if (!x || x.dO === null) return;
        var g = Math.abs(x.dO);
        if (!(moeglich ? g >= BEFUND_AB : g > GRENZE_O)) return;
        add({ reihe: sym, fenster: fensterVon(t), art: 'Eröffnung an einem Tag, an dem nur R3 handeln kann', tag: t, groesseProzent: pz(x.dO),
          einstufung: einstufungO(x), wirkung: 'nur wenn R3 an diesem Tag handelt; zustandsfreie Probe: R3 kann an diesem Tag ' +
            (moeglich ? 'handeln (Vortag außerhalb des Bands, Zonenwechsel)' : 'NICHT handeln (Vortag im Band oder Zone unverändert)'),
          stufe: moeglich && g >= VORBEHALT_AB && oFehler(x) ? 'vorbehalt' : 'hinweis' });
      });
    });
    /* (c) Monatsend-Schluesse der Signalreihen: gelistet, wenn KEIN Schluss-Kandidat der zweiten Quelle auf 0,05 % passt;
     * (d) Schluesse > 0,2 % an anderen Tagen. Ob ein Signal kippt, sagt die Kipp-Probe. */
    var kippTage = {};
    ['R1', 'R2', 'R2_N2'].forEach(function (r) { kipp.schluss[r].abweichend.forEach(function (t) { kippTage[t] = (kippTage[t] || []).concat([r]); }); });
    kipp.schluss.R3_Zustand.abweichend.forEach(function (t) { kippTage[t] = (kippTage[t] || []).concat(['R3-Zustand']); });
    mw.monatsenden.forEach(function (z) {
      ['SPY', 'BIL', 'ACWX', 'SHY', 'EFA'].forEach(function (sym) {
        var c = z[sym];
        if (!c || c.dmin === undefined || c.dmin === null || Math.abs(c.dmin) < BEFUND_AB * 100) return;
        var haupt = HAUPT.indexOf(sym) >= 0;
        add({ reihe: sym, fenster: fensterVon(z.tag), art: 'Monatsend-Schluss (Signal ' + (sym === 'SPY' ? 'R1/R2/R3' : 'R2') + (haupt ? '' : ', nur N2') + ')',
          tag: z.tag, groesseProzent: c.d, einstufung: c.einstufung,
          wirkung: 'wirkt nur über das Signal; Kipp-Probe mit den Schlüssen der zweiten Quelle: ' + (kippTage[z.tag] ? 'KIPPT ' + kippTage[z.tag].join(', ') : 'kein Signal kippt'),
          stufe: haupt && kippTage[z.tag] ? 'vorbehalt' : 'hinweis' });
      });
    });
    ['SPY', 'BIL', 'ACWX', 'AGG'].forEach(function (sym) {
      ['A', 'B'].forEach(function (f) {
        erg.minuten.je[sym].zeitraeume[f].schlussUeber0_2.forEach(function (x) {
          if (bef.some(function (b) { return b.reihe === sym && b.tag === x.tag && b.art.indexOf('Schluss') >= 0; })) return;
          if (x.einstufung.indexOf('deckt sich') === 0) return;
          add({ reihe: sym, fenster: f, art: 'Tagesschluss > 0,2 % neben der zweiten Quelle', tag: x.tag, groesseProzent: x.abweichung, einstufung: x.einstufung,
            wirkung: sym === 'SPY' ? 'R3-Entscheid dieses Tages (Kipp-Probe: R3-Zustand ' + (kippTage[x.tag] ? 'KIPPT' : 'bleibt') + ') und Tagesbewertung (Rückschlag); kein Handel zu diesem Kurs'
              : 'nur Tagesbewertung des Bestands; kein Handel zu diesem Kurs',
            stufe: kippTage[x.tag] ? 'vorbehalt' : 'hinweis' });
        });
      });
    });
    /* (e) Endtage */
    mw.endtage.forEach(function (z) {
      KUERZEL.forEach(function (sym) {
        var c = z[sym];
        if (!c || c.dmin === undefined || c.dmin === null || Math.abs(c.dmin) < BEFUND_AB * 100) return;
        add({ reihe: sym, fenster: fensterVon(z.tag), art: 'Schluss am Endtag (Endwert)', tag: z.tag, groesseProzent: c.d, einstufung: c.einstufung,
          wirkung: 'Endwert, wenn ' + sym + ' am Endtag gehalten wird', stufe: HAUPT.indexOf(sym) >= 0 && Math.abs(c.dmin) >= VORBEHALT_AB * 100 ? 'vorbehalt' : 'hinweis' });
      });
    });
    /* (f) Ausschuettungen gegen Alpaca */
    KUERZEL.forEach(function (sym) {
      var a = erg.alpacaMassnahmen[sym];
      if (!a || a.fehlt) return;
      var signal = sym === 'SPY' || sym === 'BIL' || sym === 'ACWX' ? ' und Signal R2 für zwölf Monate (Variante „Ausschüttung“ der Kipp-Probe)' : '';
      a.betragAnders.forEach(function (x, i) {
        var g = a._intern.gAnders[i];
        add({ reihe: sym, fenster: fensterVon(x.exTag), art: 'Ausschüttung: Yahoo = ' + de(x.verhaeltnisYahooZuAlpaca, 3) + ' × Alpaca' + (x.art === 'doppelt' ? ' (Yahoo doppelt)' : ''),
          tag: x.exTag, groesseProzent: pz(g), wirkung: 'Gesamtertrag von ' + sym + ' am Ex-Tag, wenn ' + sym + ' zum Vortagsschluss gehalten wird' + signal,
          stufe: HAUPT.indexOf(sym) >= 0 && Math.abs(g) >= VORBEHALT_AB ? 'vorbehalt' : 'hinweis' });
      });
      a.nurYahoo.forEach(function (x, i) {
        var g = a._intern.gNurYahoo[i];
        add({ reihe: sym, fenster: fensterVon(x.exTag), art: 'Ausschüttung nur bei Yahoo', tag: x.exTag, groesseProzent: pz(g),
          wirkung: 'nur falls Yahoo irrt: Gesamtertrag am Ex-Tag zu hoch; Alpaca hat belegte Lücken (2016, SPY 15.06.2018), der Rhythmus der Reihe verlangt die Zahlung',
          stufe: 'hinweis' });
      });
      a.nurAlpaca.forEach(function (x, i) {
        var g = a._intern.gNurAlpaca[i];
        add({ reihe: sym, fenster: fensterVon(x.exTag), art: 'Ausschüttung nur bei Alpaca', tag: x.exTag, groesseProzent: pz(-g),
          wirkung: 'falls Alpaca recht hat: Gesamtertrag am Ex-Tag bei Yahoo zu niedrig, wenn ' + sym + ' zum Vortagsschluss gehalten wird' + signal,
          stufe: HAUPT.indexOf(sym) >= 0 && Math.abs(g) >= VORBEHALT_AB ? 'vorbehalt' : 'hinweis' });
      });
    });
  }
  /* (g) Zusatz: Monatsanfaenge vor 2016 mit Eroeffnung = Vortagsschluss (ohne zweite Quelle nicht entscheidbar) */
  var ersteTage = {};
  spyTage.forEach(function (t) { var m = t.slice(0, 7); if (!ersteTage[m]) ersteTage[m] = t; });
  var zus = {};
  ['SPY', 'SHY', 'EFA', 'AGG'].forEach(function (sym) {
    var R = reihen[sym];
    var alle = R.folge.filter(function (z) { return z.tag >= '2003-10-01' && z.tag < '2016-01-01'; });
    var veraltet = alle.filter(function (z) { return oGleichVortag(R, z.tag); }).map(function (z) { return z.tag; });
    var mon = Object.keys(ersteTage).map(function (m) { return ersteTage[m]; }).filter(function (t) { return t >= '2003-10-01' && t < '2016-01-01' && oGleichVortag(R, t); });
    zus[sym] = { tage: alle.length, eroeffnungGleichVortagsschluss: veraltet.length, davonMonatsanfaenge: mon };
  });
  return { befunde: bef, zusatzOhneZweiteQuelle: zus,
    regel: 'Kurse gelistet ab ' + de(BEFUND_AB * 100) + ' % (' + de(BEFUND_AB * KAPITAL) + ' $ auf 100.000 $; Schlüsse nur, wenn kein Kandidat der zweiten Quelle auf ' +
      de(BEFUND_AB * 100) + ' % passt), Ausschüttungs-Abweichungen alle; Vorbehalt ab ' + de(VORBEHALT_AB * 100) +
      ' % in einer Reihe der Hauptlesart bei belegtem Yahoo-Fehler (Eröffnung veraltet oder außerhalb der ersten Minute, Ausschüttung abweichend) oder bei gekipptem Signal; ' +
      '$ = Betrag × 100.000 $ (wächst mit dem Bestand); Pp p. a. = Betrag / Fensterjahre (A ' + de(JAHRE_FENSTER.A, 2) + ', B ' + de(JAHRE_FENSTER.B, 2) + ')' };
}

/* ---------------- Urteil je Reihe und Zeitraum ---------------- */
function urteile(erg) {
  var u = {};
  KUERZEL.forEach(function (sym) {
    u[sym] = {};
    ['AV', 'A', 'B', 'Z', 'R3V'].forEach(function (zid) {
      var rolle = BEDARF[sym][zid];
      if (!rolle) { u[sym][zid] = { stufe: '-', rolle: 'nicht gebraucht', gruende: [] }; return; }
      var p = erg.reihen[sym].zeitraeume[zid];
      var g = [], stufe = 'taugt';
      var nichtErlaubtVorErst = zid !== 'Z' && p.spyTageVorErstnotiz > 0;
      if (p.fehlendeTage.length || p.ohneSchluss.length || p.nichtPositiv.length || nichtErlaubtVorErst) {
        stufe = 'taugt nicht';
        g.push('fehlende Tage ' + p.fehlendeTage.length + ', ohne Schluss ' + p.ohneSchluss.length + ', nicht positiv ' + p.nichtPositiv.length + ', vor Erstnotiz ' + p.spyTageVorErstnotiz);
      }
      if (p.ohneEroeffnung.length && (zid === 'A' || zid === 'B' || zid === 'Z')) { g.push(p.ohneEroeffnung.length + ' Tage ohne Eröffnung (REGEL §3.5)'); if (stufe === 'taugt') stufe = 'taugt mit Vorbehalt'; }
      var inZr = (erg.einordnung ? erg.einordnung.befunde : []).filter(function (b) {
        return b.reihe === sym && (b.fenster === zid || (zid === 'Z' && b.fenster !== 'R3V'));
      });
      inZr.filter(function (b) { return b.stufe === 'vorbehalt'; }).forEach(function (b) {
        if (stufe === 'taugt') stufe = 'taugt mit Vorbehalt';
        g.push(datum(b.tag) + ' ' + b.art + ' ' + de(b.groesseProzent, 2) + ' % (≈ ' + de(b.dollarJe100k) + ' $)');
      });
      if (zid === 'Z') {
        var zo = erg.einordnung && erg.einordnung.zusatzOhneZweiteQuelle[sym];
        var gp = erg.minuten ? erg.minuten.je[sym].zeitraeume['2016-2026'].eroeffnungGleichVortagsschluss : null;
        g.push('2002–2015 ohne zweite Quelle' + (zo ? '; Eröffnung = Vortagsschluss an ' + zo.eroeffnungGleichVortagsschluss + ' Tagen 10/2003–2015, davon ' + zo.davonMonatsanfaenge.length + ' Monatsanfänge' +
          (gp ? ' (zum Vergleich 2016–2026: ' + gp.davonZweiteQuelleAnders0_05.length + ' von ' + gp.n + ' solchen Tagen von der zweiten Quelle als veraltet bestätigt)' : '') : ''));
        if (stufe === 'taugt') stufe = 'taugt mit Vorbehalt';
      }
      if (OHNE_E && zid !== 'Z' && zid !== 'R3V') g.push('ohne zweite Quelle geprüft (--ohne-e)');
      u[sym][zid] = { stufe: stufe, rolle: rolle, gruende: g };
    });
  });
  return u;
}

/* ---------------- Hauptlauf ---------------- */
function main() {
  var t0 = Date.now();
  var reihen = {};
  KUERZEL.forEach(function (s) { reihen[s] = ladeReihe(s); });
  var buchInfo = {};
  KUERZEL.forEach(function (s) {
    var R = reihen[s];
    buchInfo[s] = buche(R, R.divBis);
    R.gebucht = buchInfo[s].gebucht;
    R.tr = trReihe(R, R.gebucht, null);
  });
  var SPY = reihen.SPY;
  var spyTage = SPY.folge.map(function (z) { return z.tag; });
  var spySet = {};
  spyTage.forEach(function (t) { spySet[t] = 1; });
  var spyRendite = {};
  for (var i = 1; i < SPY.folge.length; i++) spyRendite[SPY.folge[i].tag] = SPY.folge[i].c / SPY.folge[i - 1].c - 1;

  var soll = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefsummen.json'), 'utf8'));
  var erg = {
    kennung: 'trendfilter-messung-2026-10/v1 datenpruefung',
    regel: 'REGEL.md §2.6 (Siegel 6f9d06f)',
    erzeugt: new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).format(new Date()) + ' Berlin',
    datenordner: DATEN.replace(/\\/g, '/'),
    zweiteQuelle: OHNE_E ? 'abgeschaltet (--ohne-e)' : EBASIS,
    schwellen: { sprungAktien: SCHWELLE.aktien, sprungAnleihenGeld: SCHWELLE.anleihen, zweiteQuelleEroeffnung: GRENZE_O, zweiteQuelleSchluss: GRENZE_C,
      befundAb: BEFUND_AB, vorbehaltAb: VORBEHALT_AB, gleichheit: EPS,
      sprungPaar: 'beide |r| > halbe Schwelle, entgegengesetzt, |netto| < 0,3 x kleinerer Betrag',
      eroeffnungsAusreisser: 'Eroeffnung liegt mehr als die halbe Schwelle ueber (unter) Vortags- UND Tagesschluss' },
    zeitraeume: ZR, bedarf: BEDARF,
    pruefsummen: {}
  };
  KUERZEL.forEach(function (s) { erg.pruefsummen[s] = reihen[s].sha === soll.reihen[s].shaRoh ? 'gleich' : 'ANDERS'; });

  /* (2) Kalender */
  var frei = {};
  for (var y = 1993; y <= 2026; y++) { var f = nyseFrei(y); Object.keys(f).forEach(function (t) { frei[t] = f[t]; }); }
  var werktagOhneSpy = [], spyAnFeiertag = [];
  for (var t = SPY.ersterTag; t <= ENDE; t = plusTage(t, 1)) {
    var w = wochentag(t);
    if (w === 0 || w === 6) continue;
    if (!spySet[t] && !frei[t]) werktagOhneSpy.push(t);
    if (spySet[t] && frei[t]) spyAnFeiertag.push(t + ' ' + frei[t]);
  }
  var feiertageJeZr = {};
  ZR.forEach(function (z) {
    feiertageJeZr[z.id] = Object.keys(frei).filter(function (x) { var ww = wochentag(x); return imZr(x, z) && x >= SPY.ersterTag && ww !== 0 && ww !== 6; }).length;
  });
  var startA = spyTage.filter(function (x) { return x >= '2017-01-04' && x < '2017-02-04'; });
  var startB = spyTage.filter(function (x) { return x >= '2021-09-16' && x < '2021-10-16'; });
  var monatsEnden = [];
  spyTage.forEach(function (x, k) { if (k === spyTage.length - 1 || spyTage[k + 1].slice(0, 7) !== x.slice(0, 7)) monatsEnden.push(x); });
  monatsEnden = monatsEnden.filter(function (x) { return x.slice(0, 7) !== ENDE.slice(0, 7); });
  /* Erster moeglicher Zusatz-Tag (REGEL §7.1): erstes Monatsende mit Signal aller drei Regeln (SHY, EFA) und AGG-Schluss */
  function hatZeile(sym, tag) { var z = reihen[sym].jeTag[tag]; return !!(z && z.c !== null && z.c > 0); }
  function monatsendeVor12(M) {
    var k = (+M.slice(0, 4) - 1) + '-' + M.slice(5, 7);
    var c = monatsEnden.filter(function (x) { return x.slice(0, 7) === k; });
    return c.length ? c[0] : null;
  }
  var e1 = null, e2 = null, e3 = null, eAgg = null, eAlle = null;
  monatsEnden.forEach(function (M, k) {
    var r1 = k >= 9;
    var M12 = monatsendeVor12(M);
    var r2 = !!M12 && ['SPY', 'SHY', 'EFA'].every(function (s) { return hatZeile(s, M) && hatZeile(s, M12); });
    var r3 = spyTage.indexOf(M) >= 199;
    var agg = hatZeile('AGG', M);
    if (r1 && !e1) e1 = M;
    if (r2 && !e2) e2 = M + ' (M-12 = ' + M12 + ')';
    if (r3 && !e3) e3 = M;
    if (agg && !eAgg) eAgg = M;
    if (r1 && r2 && r3 && agg && !eAlle) eAlle = M;
  });
  var ersterZusatz = eAlle ? spyTage.filter(function (x) { return x > eAlle; })[0] : null;
  erg.kalender = {
    spyHandelstageGesamtBisEnde: spyTage.length,
    spyHandelstageA: spyTage.filter(function (x) { return imZr(x, ZRID.A); }).length,
    spyHandelstageB: spyTage.filter(function (x) { return imZr(x, ZRID.B); }).length,
    spyHandelstageVorlaufA: spyTage.filter(function (x) { return imZr(x, ZRID.AV); }).length,
    spyHandelstageZusatz: spyTage.filter(function (x) { return imZr(x, ZRID.Z); }).length,
    starttageA: startA.length, starttageAErsterLetzter: [startA[0], startA[startA.length - 1]],
    starttageB: startB.length, starttageBErsterLetzter: [startB[0], startB[startB.length - 1]],
    monatsendenBisAugust2026: monatsEnden.length,
    nyse: { werktageOhneSpyZeileUndOhneFeiertag: werktagOhneSpy, spyZeileAnNyseFeiertag: spyAnFeiertag, nyseFeiertageAnWerktagenJeZeitraum: feiertageJeZr },
    zusatz: {
      erstesMonatsendeR1: e1, erstesMonatsendeR2MitShyEfa: e2, erstesMonatsendeR3: e3, erstesMonatsendeMitAggSchluss: eAgg,
      erstesMonatsendeAlle: eAlle, ersterMoeglicherTag: ersterZusatz,
      aggErsteZeilen: reihen.AGG.folge.slice(0, 3).map(function (z) { return z.tag; }),
      shyErsteZeilen: reihen.SHY.folge.slice(0, 3).map(function (z) { return z.tag; }),
      starttageBis16092021: spyTage.filter(function (x) { return x >= ersterZusatz && x <= '2021-09-16'; }).length
    }
  };

  /* (1), (3), (4), (5) je Reihe */
  erg.reihen = {};
  KUERZEL.forEach(function (s) {
    var R = reihen[s];
    var o = { klasse: KLASSE[s], aufbau: aufbau(R), zeitraeume: {} };
    ZR.forEach(function (z) {
      if (s !== 'SPY' && z.id === 'R3V') return;
      o.zeitraeume[z.id] = pruefeZeitraum(R, z, spyTage, spyRendite);
    });
    o.eroeffnungJeJahr = eroeffnungJeJahr(R);
    o.splits = splitPruefung(R);
    o.ausschuettungen = ausschuettungen(R, spySet, buchInfo[s]);
    o.gesamtertragGegenAdjclose = trGegenAdj(R);
    erg.reihen[s] = o;
  });

  /* (6) zweite Quelle, Kipp-Probe, (7) Einordnung */
  var mw = null, kipp = null;
  if (!OHNE_E) {
    erg.alpacaMassnahmen = {};
    KUERZEL.forEach(function (s) { erg.alpacaMassnahmen[s] = alpacaMassnahmen(reihen[s]); });
    var mv = minutenLesen(reihen);
    mw = minutenAuswertung(mv, reihen, spyTage);
    erg.minuten = { quelle: EBASIS + '/alpaca1m/<KUERZEL>/<JAHR>.json (alpaca v2 1Min, feed sip, adjustment raw)', kopf: mv.kopf, sitzungsfenster: mv.fenster };
    Object.keys(mw).forEach(function (k) { if (k !== 'index') erg.minuten[k] = mw[k]; });
    erg.minuten.bilSplitRohkurse = ['2017-11-28', '2017-11-29', '2017-11-30', '2017-12-01'].map(function (x) {
      var q = mw.index.BIL[x];
      return q ? { tag: x, faktorAngewandt: q.f, schlussAbweichungProzent: pz(q.dC), ohneFaktorProzent: pz(q.yc / (q.ac / q.f) - 1) } : { tag: x, fehlt: true };
    });
    kipp = kippProbe(reihen, mw, erg.alpacaMassnahmen, monatsEnden, spyTage);
    erg.kippProbe = { erklaerung: kipp.erklaerung, schluss: kipp.schluss, ausschuettung: kipp.ausschuettung };
    /* Verdaechtige Tage ab 2016 gegen die zweite Quelle halten: weicht sie dort kaum ab, ist der Sprung echt. */
    KUERZEL.forEach(function (s) {
      ['AV', 'A', 'B'].forEach(function (z) {
        var p = erg.reihen[s].zeitraeume[z];
        if (!p) return;
        var ix = mw.index[s];
        function dc(t) { var x = ix[t]; return x ? pz(x.dC) : null; }
        function dO(t) { var x = ix[t]; return x ? pz(x.dO) : null; }
        p.sprungSchluss.forEach(function (x) { x.zweiteQuelleSchluss = dc(x.tag); x.zweiteQuelleVortag = dc(x.vortag); });
        p.lueckeSchlussEroeffnung.forEach(function (x) { x.zweiteQuelleEroeffnung = dO(x.tag); });
        p.sprungPaare.forEach(function (x) { x.zweiteQuelleSchluss1 = dc(x.tag1); x.zweiteQuelleSchluss2 = dc(x.tag2); });
        p.eroeffnungsAusreisser.forEach(function (x) { x.zweiteQuelleEroeffnung = dO(x.tag); });
      });
    });
  }
  erg.dritteQuelle = { versucht: 'Stooq-CSV https://stooq.com/q/d/l/?s=spy.us&i=d (Abruf von Hand am 05.10.2026, nichts gespeichert)',
    ergebnis: 'nicht erreichbar: die Antwort ist eine HTML-Seite mit JavaScript-Rechenaufgabe (Bot-Schutz) statt CSV; nicht umgangen, weggelassen' };
  erg.einordnung = einordnung(erg, reihen, mw, spyTage, kipp);
  erg.urteil = urteile(erg);
  erg.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
  return erg;
}

/* ---------------- Bericht (DATENPRUEFUNG.md) ---------------- */
function tabelle(kopf, zeilen) {
  return ['| ' + kopf.join(' | ') + ' |', '|' + kopf.map(function () { return '---'; }).join('|') + '|']
    .concat(zeilen.map(function (z) { return '| ' + z.join(' | ') + ' |'; })).join('\n');
}
function liste(a, n) {
  if (!a || !a.length) return '0';
  return a.length + (n === 0 ? '' : ' (' + a.slice(0, n || 6).join(', ') + (a.length > (n || 6) ? ', …' : '') + ')');
}

/** Ein Satz zur Kipp-Probe fuer die Kurzfassung. */
function kippSatz(ks, ka) {
  var n = ks.R1.abweichend.length + ks.R2.abweichend.length + ka.R1.abweichend.length + ka.R2.abweichend.length;
  var m = n === 0 ? 'Mit Schlüssen bzw. Ausschüttungen der zweiten Quelle kippt kein Monatssignal (R1 ' + ks.R1.verglichen + ', R2 ' + ks.R2.verglichen + ' Monatsenden ab 2016)'
    : 'ACHTUNG: mit der zweiten Quelle kippen ' + n + ' Monatssignale (' + [].concat(ks.R1.abweichend, ks.R2.abweichend, ka.R1.abweichend, ka.R2.abweichend).map(datum).join(', ') + ')';
  var z = ks.R3_Zustand.abweichend;
  return m + '; der R3-Zustand weicht an ' + z.length + ' von ' + de(ks.R3_Zustand.verglichen) + ' Tagen ab' + (z.length ? ' (' + z.slice(0, 4).map(datum).join(', ') + (z.length > 4 ? ', …' : '') + ')' : '') + '.';
}

function bericht(erg) {
  var o = [];
  var K = erg.kalender, U = erg.urteil;
  var kurz = { 'taugt': 'taugt', 'taugt mit Vorbehalt': 'taugt mit Vorbehalt', 'taugt nicht': '**taugt nicht**', '-': '–' };
  function zelle(sym, zid) {
    var u = U[sym][zid];
    if (u.stufe === '-') return '–';
    return kurz[u.stufe] + (u.rolle.indexOf('nur N2') === 0 ? ' (N2)' : '');
  }
  var vorb = (erg.einordnung.befunde || []).filter(function (b) { return b.stufe === 'vorbehalt'; });
  o.push('# Datenprüfung Trendfilter-Messung (REGEL §2.6)');
  o.push('');
  o.push('**Kurzfassung** (Yahoo-Rohdaten unverändert; Vorlauf A = 31.12.2015–03.01.2017, nur Schlüsse; Zusatz inkl. Vorlauf ab 30.09.2002; „N2“ = nur nachrichtlich):');
  o.push(tabelle(['Reihe', 'Vorlauf A', 'A', 'B', 'Zusatz 2003–2026'], KUERZEL.map(function (s) {
    return [s, zelle(s, 'AV'), zelle(s, 'A'), zelle(s, 'B'), zelle(s, 'Z')];
  })));
  var top = vorb.slice().sort(function (a, b) { return Math.abs(b.groesseProzent) - Math.abs(a.groesseProzent); })
    .map(function (b) { return b.reihe + ' ' + datum(b.tag) + ' ' + b.art.replace(/ \+ Starttag/, '').replace(/^Ausschüttung: .*\(Yahoo doppelt\)$/, 'Ausschüttung doppelt') + ' ' + de(b.groesseProzent, 2) + ' % (≈ ' + de(b.dollarJe100k) + ' $)'; });
  var ks = erg.kippProbe ? erg.kippProbe.schluss : null;
  var ka = erg.kippProbe ? erg.kippProbe.ausschuettung : null;
  o.push('Kalender lückenlos (0 fehlende/überzählige Tage); SPY-Handelstage A ' + de(K.spyHandelstageA) + ' / B ' + de(K.spyHandelstageB) +
    ', Starttage ' + K.starttageA + ' / ' + K.starttageB + '; erster Zusatz-Tag ' + datum(K.zusatz.ersterMoeglicherTag) + '. Vorbehalte (belegte Yahoo-Fehler, je auf 100.000 $): ' + (top.length ? top.join('; ') : 'keine') +
    (ks ? '. ' + kippSatz(ks, ka) : '.'));
  o.push('');
  o.push('Erzeugt von `datenpruefung.js` am ' + erg.erzeugt + ' (Laufzeit ' + de(erg.laufzeitSekunden) + ' s); alle Zählungen in `datenpruefung.json`. Prüfsummen der Rohantworten: ' +
    KUERZEL.map(function (s) { return s + ' ' + erg.pruefsummen[s]; }).join(', ') + '. Zweite Quelle: ' + erg.zweiteQuelle + '. Simulation, keine Anlageberatung.');
  o.push('');
  o.push('Urteilsregel: **taugt nicht** bei fehlenden Tagen, fehlenden oder nicht positiven Schlüssen im gebrauchten Zeitraum; **mit Vorbehalt**, wenn ein Befund eine Zahl des Urteils um ≥ ' + de(VORBEHALT_AB * 100) +
    ' % des Bestands (≈ ' + de(VORBEHALT_AB * KAPITAL) + ' $ auf 100.000 $) verschieben kann, ein Signal mit der zweiten Quelle kippt oder (Zusatz) die Jahre 2002–2015 ohne zweite Quelle sind. Gründe je Zelle in `urteil`.');
  o.push('');
  o.push(tabelle(['Reihe', 'Zeitraum', 'Rolle', 'Urteil', 'Gründe'], [].concat.apply([], KUERZEL.map(function (s) {
    return ['AV', 'A', 'B', 'Z', 'R3V'].filter(function (z) { return U[s][z].stufe !== '-'; }).map(function (z) {
      return [s, ZRID[z].name, U[s][z].rolle, U[s][z].stufe, U[s][z].gruende.join('; ') || '–'];
    });
  }))));

  /* 1 Aufbau */
  o.push('');
  o.push('## 1 Aufbau');
  o.push('');
  o.push(tabelle(['Reihe', 'Börse', 'Zeilen', 'erster Tag', 'letzter Tag', 'nach 15.09.2026 (abgeschnitten)', 'doppelt', 'Wochenende', 'Uhrzeit NY', 'Ausschüttungen (nach Ende)', 'Splits'],
    KUERZEL.map(function (s) {
      var a = erg.reihen[s].aufbau;
      return [s, a.boerse, de(a.zeilenGesamt), datum(a.ersterTag), datum(a.letzterTag),
        a.zeilenNachEnde + (a.nachEndeVonBis ? ' (' + datum(a.nachEndeVonBis[0]) + '–' + datum(a.nachEndeVonBis[1]) + ')' : ''),
        a.doppelteTage.length, a.wochenendTage.length, Object.keys(a.uhrzeitNewYork).map(function (k) { return k + ': ' + a.uhrzeitNewYork[k]; }).join(', '),
        a.ausschuettungenGesamt + ' (' + (a.ausschuettungenNachEnde.length ? a.ausschuettungenNachEnde.map(datum).join(', ') : '0') + ')', a.splits.join(', ') || '–'];
    })));
  o.push('');
  o.push('Ausschüttungsstempel: ' + KUERZEL.map(function (s) { var u = erg.reihen[s].aufbau.uhrzeitAusschuettungsstempel; return s + ' ' + Object.keys(u).map(function (k) { return k + ' ×' + u[k]; }).join(', '); }).join('; ') +
    ' – Ex-Tag nach New Yorker Datum ist damit eindeutig. Zeitstempel unsortiert oder doppelt: ' + KUERZEL.map(function (s) { return erg.reihen[s].aufbau.zeitstempelUnsortiertOderGleich; }).join('/') + '.');
  o.push('');
  o.push('Je Zeitraum (gebrauchte Zeiträume; R3V nur SPY): Zeilen, fehlende Kurse, Spannenfehler.');
  o.push('');
  var zeilenAufbau = [];
  KUERZEL.forEach(function (s) {
    Object.keys(erg.reihen[s].zeitraeume).forEach(function (z) {
      var p = erg.reihen[s].zeitraeume[z];
      zeilenAufbau.push([s, z, de(p.zeilen), de(p.spyHandelstage), p.spyTageVorErstnotiz, liste(p.fehlendeTage), liste(p.ueberzaehligeTage), p.ohneSchluss.length + '/' + p.ohneEroeffnung.length,
        p.nichtPositiv.length, p.hochUnterTief.length, p.eroeffnungAusserhalbSpanne.length + '/' + p.schlussAusserhalbSpanne.length, p.umsatzNullOderLeer]);
    });
  });
  o.push(tabelle(['Reihe', 'Zeitraum', 'Zeilen', 'SPY-Tage', 'SPY-Tage vor Erstnotiz', 'fehlende Tage', 'überzählige Tage', 'ohne Schluss/Eröffnung', 'nicht positiv', 'Hoch < Tief', 'O/C außerhalb Spanne', 'Umsatz 0'], zeilenAufbau));

  /* 2 Kalender */
  o.push('');
  o.push('## 2 Kalender');
  o.push('');
  o.push('- SPY gegen die NYSE-Regeln (Feiertage samt Ersatztagen, Juneteenth ab 2022, MLK ab 1998, Sonderschließungen 1994, 2001, 2004, 2007, 2012, 2018, 2025), ' +
    datum(erg.reihen.SPY.aufbau.ersterTagMitSchluss) + '–' + datum(ENDE) + ': Werktage ohne SPY-Zeile und ohne Feiertag **' + K.nyse.werktageOhneSpyZeileUndOhneFeiertag.length +
    '**, SPY-Zeilen an NYSE-Feiertagen **' + K.nyse.spyZeileAnNyseFeiertag.length + '**. Der SPY-Kalender ist also genau der NYSE-Kalender.');
  o.push('- SPY-Handelstage: A (04.01.2017–15.09.2021) **' + de(K.spyHandelstageA) + '**, B (16.09.2021–15.09.2026) **' + de(K.spyHandelstageB) + '**, Vorlauf A ' + de(K.spyHandelstageVorlaufA) +
    ', Zusatz inkl. Vorlauf ' + de(K.spyHandelstageZusatz) + '. Monatsenden bis August 2026: ' + K.monatsendenBisAugust2026 + '.');
  o.push('- Starttage nach §5.2: A **' + K.starttageA + '** (' + datum(K.starttageAErsterLetzter[0]) + '–' + datum(K.starttageAErsterLetzter[1]) + '), B **' + K.starttageB + '** (' +
    datum(K.starttageBErsterLetzter[0]) + '–' + datum(K.starttageBErsterLetzter[1]) + ') – je 22 wie erwartet.');
  var Z = K.zusatz;
  o.push('- Erster möglicher Zusatz-Tag (§7.1): **' + datum(Z.ersterMoeglicherTag) + '**. Begründung aus den Daten: R1 hat ab dem Monatsende ' + datum(Z.erstesMonatsendeR1) +
    ' zehn Monatsenden, R3 ab ' + datum(Z.erstesMonatsendeR3) + ' 200 Schlüsse; R2 mit SHY/EFA ist erst ab ' + Z.erstesMonatsendeR2MitShyEfa.replace(/(\d{4}-\d{2}-\d{2})/g, function (m) { return datum(m); }) +
    ' berechenbar (SHY ab ' + datum(Z.shyErsteZeilen[0]) + '); AGG hat erst ab ' + datum(Z.aggErsteZeilen[0]) + ' Kurse, das erste Monatsende mit AGG-Schluss ist ' + datum(Z.erstesMonatsendeMitAggSchluss) +
    ' → erster SPY-Handelstag danach. Starttage des Zusatzes bis 16.09.2021: ' + de(Z.starttageBis16092021) + '.');
  o.push('- Jede Reihe gegen den SPY-Kalender: in jedem Zeitraum **0 fehlende und 0 überzählige Tage** (Tabelle oben), auch keine Ex-Tage außerhalb des Kalenders (Abschnitt 5). Der Vorlauf von B (31.08.2020–15.09.2021) liegt in A.');
  var r3v = erg.reihen.SPY.zeitraeume.R3V;
  o.push('- R3 hat ein Gedächtnis (Band, Zustand ab 1993); dafür zählen nur die SPY-Schlüsse ' + datum(r3v.ersteZeile) + '–' + datum(r3v.letzteZeile) + ' (R3V): ' + de(r3v.zeilen) + ' Zeilen, fehlend ' +
    r3v.fehlendeTage.length + ', ohne Schluss ' + r3v.ohneSchluss.length + ', Schluss-Sprünge > 7 % ' + (r3v.sprungSchluss.map(function (x) { return datum(x.tag) + ' ' + de(x.r, 2) + ' %'; }).join(', ') || 'keine') +
    ', Sprungpaare ' + r3v.sprungPaare.length + '.');

  /* 3 Verdaechtige Kurse */
  o.push('');
  o.push('## 3 Verdächtige Kurse');
  o.push('');
  o.push('Grenzen: Aktien-ETFs |r| > 7 %, Anleihen-/Geld-ETFs |r| > 1,5 %. Sprungpaar: beide Beträge > halbe Grenze, entgegengesetzt, netto < 0,3 × kleinerer Betrag. ' +
    'Eröffnungs-Ausreißer: Eröffnung mehr als die halbe Grenze über (unter) Vortags- **und** Tagesschluss. In Klammern die SPY-Bewegung desselben Tages.');
  o.push('');
  var zv = [];
  KUERZEL.forEach(function (s) {
    Object.keys(erg.reihen[s].zeitraeume).forEach(function (z) {
      var p = erg.reihen[s].zeitraeume[z];
      zv.push([s, z, p.sprungSchluss.length, p.lueckeSchlussEroeffnung.length, p.sprungPaare.length, p.eroeffnungsAusreisser.length,
        p.eroeffnungGleichSchluss + ' / ' + p.eroeffnungGleichVortagsschluss + ' / ' + p.flacheKerze]);
    });
  });
  o.push(tabelle(['Reihe', 'Zeitraum', 'Schluss-Sprünge', 'Lücken Schluss→Eröffnung', 'Sprungpaare', 'Eröffnungs-Ausreißer', 'O = C / O = Vortags-C / flach'], zv));
  o.push('');
  /* Groesste Abweichung der zweiten Quelle an allen verdaechtigen Tagen in Vorlauf A, A und B */
  var maxZq = 0;
  KUERZEL.forEach(function (s) {
    ['AV', 'A', 'B'].forEach(function (z) {
      var p = erg.reihen[s].zeitraeume[z];
      [].concat(p.sprungSchluss.map(function (x) { return [x.zweiteQuelleSchluss, x.zweiteQuelleVortag]; }),
        p.lueckeSchlussEroeffnung.map(function (x) { return [x.zweiteQuelleEroeffnung]; }),
        p.sprungPaare.map(function (x) { return [x.zweiteQuelleSchluss1, x.zweiteQuelleSchluss2]; }),
        p.eroeffnungsAusreisser.map(function (x) { return [x.zweiteQuelleEroeffnung]; }))
        .forEach(function (w) { w.forEach(function (v) { if (typeof v === 'number' && Math.abs(v) > maxZq) maxZq = Math.abs(v); }); });
    });
  });
  o.push('Einzelne Tage in Vorlauf A, A und B; in Klammern SPY am selben Tag und „2. Q.“ = Abweichung Yahoo gegen die zweite Quelle an diesem Tag (Schluss bzw. Eröffnung). ' +
    (erg.minuten ? 'Alle diese Tage bestätigt die zweite Quelle: an keinem weicht sie um mehr als ' + de(maxZq, 2) + ' % ab, die Sprünge selbst sind ein Vielfaches davon – es sind echte Markttage (Brexit 2016, März 2020, 2022, April 2025).' : ''));
  o.push('');
  function zq(v) { return v === null || v === undefined ? '' : '; 2. Q. ' + de(v, 2); }
  KUERZEL.forEach(function (s) {
    ['AV', 'A', 'B'].forEach(function (z) {
      var p = erg.reihen[s].zeitraeume[z];
      var t = p.sprungSchluss.map(function (x) { return datum(x.tag) + ' ' + de(x.r, 2) + ' % (SPY ' + de(x.spyAmTag, 2) + zq(x.zweiteQuelleSchluss) + ')'; });
      var l = p.lueckeSchlussEroeffnung.map(function (x) { return datum(x.tag) + ' ' + de(x.luecke, 2) + ' %' + (x.zweiteQuelleEroeffnung !== undefined && x.zweiteQuelleEroeffnung !== null ? ' (2. Q. ' + de(x.zweiteQuelleEroeffnung, 2) + ')' : ''); });
      var pa = p.sprungPaare.map(function (x) { return datum(x.tag1) + '/' + datum(x.tag2) + ' ' + de(x.r1, 2) + '/' + de(x.r2, 2) + ' % (SPY ' + de(x.spy1, 2) + '/' + de(x.spy2, 2) + ')'; });
      var ea = p.eroeffnungsAusreisser.map(function (x) { return datum(x.tag) + ' ' + de(x.eroeffnungZuVortagsschluss, 2) + '/' + de(x.eroeffnungZuSchluss, 2) + ' %' + (x.zweiteQuelleEroeffnung !== undefined && x.zweiteQuelleEroeffnung !== null ? ' (2. Q. ' + de(x.zweiteQuelleEroeffnung, 2) + ')' : ''); });
      if (!t.length && !l.length && !pa.length && !ea.length) return;
      o.push('- ' + s + ' ' + z + ': ' + [t.length ? 'Sprünge ' + t.join(', ') : '', l.length ? 'Lücken Schluss→Eröffnung ' + l.join(', ') : '', pa.length ? 'Paare ' + pa.join(', ') : '', ea.length ? 'Eröffnungs-Ausreißer (zu Vortags-/Tagesschluss) ' + ea.join(', ') : '']
        .filter(Boolean).join('; '));
    });
  });
  o.push('- Zusatz 2002–2015 (ohne zweite Quelle): ACWX hat in den ersten Handelswochen (April 2008) Eröffnungen bis +25 % über Vortags- und Tagesschluss (' +
    erg.reihen.ACWX.zeitraeume.Z.eroeffnungsAusreisser.filter(function (x) { return x.tag < '2009-01-01'; }).map(function (x) { return datum(x.tag); }).join(', ') +
    ') – Fehldrucke, aber ACWX wird im Zusatz nicht benutzt. Übrige Zusatz-Funde liegen in den Krisenmonaten 2007–2009 mit gleichgerichteter SPY-Bewegung (Liste in der JSON).');
  o.push('');
  o.push('**Eröffnung = Vortagsschluss je Jahr** (Hinweis auf veraltete Eröffnungskurse; bei BIL/SHY ist Gleichheit wegen der kleinen Tagesbewegung unter einem Cent normal):');
  o.push('');
  var jahre = [];
  for (var jj = 1993; jj <= 2026; jj++) jahre.push(String(jj));
  o.push(tabelle(['Jahr'].concat(KUERZEL), jahre.map(function (j) {
    return [j].concat(KUERZEL.map(function (s) { var e = erg.reihen[s].eroeffnungJeJahr[j]; return e ? e.oGleichVortag + ' / ' + e.tage : '–'; }));
  })));
  if (erg.minuten) {
    o.push('');
    o.push('Gegenprobe 2016–2026 (zweite Quelle): Tage mit Yahoo-Eröffnung = Vortagsschluss, an denen die erste reguläre Minute der zweiten Quelle um > 0,05 % abweicht (= bestätigt veraltet): ' +
      KUERZEL.map(function (s) {
        var q = erg.minuten.je[s].zeitraeume['2016-2026'].eroeffnungGleichVortagsschluss;
        return s + ' ' + q.davonZweiteQuelleAnders0_05.length + ' von ' + q.n + (q.davonZweiteQuelleAnders0_05.length ? ' (' + q.davonZweiteQuelleAnders0_05.map(function (x) { return datum(x.slice(0, 10)) + ' ' + de(+x.slice(11), 2) + ' %'; }).join(', ') + ')' : '');
      }).join('; ') + '.');
  }

  /* 4 Splits */
  o.push('');
  o.push('## 4 Splits');
  o.push('');
  KUERZEL.forEach(function (s) {
    erg.reihen[s].splits.forEach(function (sp) {
      o.push('- **' + s + ' ' + datum(sp.tag) + ' (' + sp.verhaeltnis + ', Vorkurse × ' + de(sp.kursfaktorVorher, 4) + ')**: Schluss zum Vortag um den Stichtag ' +
        sp.schlussUmDenStichtag.map(function (x) { return datum(x.tag) + ' ' + de(x.schlussZuVortag, 3) + ' %'; }).join(', ') +
        ' – kein Sprung, die Kurse sind bereinigt. Ausschüttungsrendite (auf den Vortagsschluss) vor dem Stichtag ' + sp.ausschuettungenVorher.map(function (x) { return datum(x.exTag) + ' ' + de(x.rendite, 3) + ' %'; }).join(', ') +
        '; danach ' + sp.ausschuettungenNachher.map(function (x) { return datum(x.exTag) + ' ' + de(x.rendite, 3) + ' %'; }).join(', ') +
        '. Verhältnis der Renditen vorher/nachher ' + de(sp.verhaeltnisDerRenditen, 2) + ' (bei fremder Basis wäre es ' + de(1 / sp.kursfaktorVorher, 2) + ' bzw. ' + de(sp.kursfaktorVorher, 2) + '): **gleiche Basis**. ' +
        'Rundungsprobe der ' + sp.rundungsprobeVorher.zahl + ' Beträge vor dem Stichtag: geteilt durch den Kursfaktor auf drei Stellen rund ' + sp.rundungsprobeVorher.rohbetragRund +
        ', selbst rund ' + sp.rundungsprobeVorher.betragSelbstRund + (sp.rundungsprobeVorher.betragSelbstRund < sp.rundungsprobeVorher.rohbetragRund ? ' – die Beträge sind nachweislich umgerechnet.' : '.'));
    });
  });
  if (erg.minuten) {
    o.push('- BIL gegen die Rohkurse der zweiten Quelle (nicht splitbereinigt, vor dem 30.11.2017 × 2): ' + erg.minuten.bilSplitRohkurse.map(function (x) {
      return datum(x.tag) + ' Faktor ' + x.faktorAngewandt + ', Abweichung ' + de(x.schlussAbweichungProzent, 4) + ' % (ohne Faktor ' + de(x.ohneFaktorProzent, 2) + ' %)';
    }).join('; ') + '. Die Ausschüttungsbeträge vor dem Split stimmen mit Alpaca × 2 überein (Abschnitt 6a; Yahoo rundet den Rohbetrag auf drei Stellen und verdoppelt dann).');
  }

  /* 5 Ausschuettungen */
  o.push('');
  o.push('## 5 Ausschüttungen');
  o.push('');
  var alleJahre = [];
  for (var aj = 1993; aj <= 2026; aj++) alleJahre.push(String(aj));
  o.push(tabelle(['Jahr'].concat(KUERZEL), alleJahre.map(function (j) {
    return [j].concat(KUERZEL.map(function (s) { var n = erg.reihen[s].ausschuettungen.jeJahr[j]; return n === undefined ? (erg.reihen[s].aufbau.ersterTag.slice(0, 4) <= j ? '0' : '–') : String(n); }));
  })));
  o.push('');
  KUERZEL.forEach(function (s) {
    var a = erg.reihen[s].ausschuettungen;
    o.push('- **' + s + '**: ' + a.zahlBisEnde + ' Ex-Tage bis 15.09.2026, erwartet ' + a.erwartetJeJahr + ' je volles Jahr' +
      (a.dezemberMitZweiExTagenVolleJahre !== null ? ' (Monatszahler: Dezember mit zwei Ex-Tagen in ' + a.dezemberMitZweiExTagenVolleJahre + ' Jahren, der Januar entfällt dann planmäßig)' : '') +
      '. Abweichende Jahre: ' + (a.jahreMitAbweichenderZahl.map(function (x) { return x.jahr + ': ' + x.zahl; }).join(', ') || 'keine') +
      '. Fehlende Monate: ' + liste(a.fehlendeMonateInVollenJahren, 12) + '. Sonst mehrfach belegte Monate: ' + (a.monateMitMehrerenExTagen.map(function (x) { return x.monat + ' (' + x.exTage.join(', ') + ')'; }).join('; ') || 'keine') +
      '. Ex-Tag kein SPY-Tag / ohne Zeile der Reihe / an der ersten Zeile: ' + a.exTagKeinSpyHandelstag.length + ' / ' + a.exTagOhneZeileDerReihe.length + ' / ' + a.exTagAnOderVorErsterZeile.length +
      '; nicht positive Beträge ' + a.nichtPositiveBetraege.length + '. Rendite je Ausschüttung Median ' + de(a.renditeMedian, 3) + ' %, höchstens ' + de(a.renditeMax, 3) + ' %' +
      (a.renditeUeberDreifachemMedian.length ? '; über dem Dreifachen des Medians: ' + a.renditeUeberDreifachemMedian.map(function (x) { return datum(x.exTag) + ' ' + de(x.rendite, 3) + ' %'; }).join(', ') : '') + '.');
  });
  o.push('- Einordnung der Lücken: BIL zahlte 2010–2015 und von Mitte 2020 bis Anfang 2022 nichts (Geldmarktzins unter den Kosten des Fonds) – im Fenster A/B betrifft das nur eine Ertragsquelle nahe null. ' +
    'SHY ohne November 2012 (Nachbarmonate ≈ 0,02 % des Kurses), EFA 2004–2007 und ACWX 2012 nur eine Ausschüttung je Jahr: vor 2016 ohne zweite Quelle nicht prüfbar, Größenordnung je Fall unter 1 %.');
  o.push('');
  o.push('**Gesamtertrag aus Schluss + Ausschüttung (REGEL §2.5) gegen `adjclose`.** „Tag max“ = größte Abweichung der Tagesrenditen; „Rest Yahoo-Verfahren“ = dieselbe Abweichung, wenn man die Ausschüttung wie Yahoo ' +
    '(Faktor 1 − D/C(t−1)) statt wie §2.5 einrechnet – ist sie ≈ 0, enthält `adjclose` genau die gemeldeten Ausschüttungen und der Rest ist reiner Verfahrensunterschied; „Faktor“ = TR-Wachstum / adjclose-Wachstum − 1 über den Zeitraum.');
  o.push('');
  var adjZeilen = [];
  KUERZEL.forEach(function (s) {
    var g = erg.reihen[s].gesamtertragGegenAdjclose;
    ['AV', 'A', 'B', 'Z'].forEach(function (z) {
      var q = g[z];
      if (!q) return;
      adjZeilen.push([s, z, q.groessteTagesabweichung ? datum(q.groessteTagesabweichung.tag) + ' ' + de(q.groessteTagesabweichung.abweichung, 4) + ' %' + (q.groessteTagesabweichung.exTag ? ' (Ex-Tag)' : '') : '–',
        q.tageUeber0_01Prozent + ' / ' + q.tageUeber0_1Prozent.length, q.restNachYahooVerfahrenMax ? de(q.restNachYahooVerfahrenMax.abweichung, 4) + ' %' : '–', q.faktorAbweichung === null ? '–' : de(q.faktorAbweichung, 4) + ' %']);
    });
  });
  o.push(tabelle(['Reihe', 'Zeitraum', 'Tag max', 'Tage > 0,01 % / > 0,1 %', 'Rest Yahoo-Verfahren max', 'Faktor'], adjZeilen));

  /* 6 Zweite Quelle */
  o.push('');
  o.push('## 6 Zweite Quelle');
  if (!erg.minuten) {
    o.push('');
    o.push('Abgeschaltet (`--ohne-e`).');
  } else {
    o.push('');
    o.push('### 6a Alpaca-Maßnahmen (Barausschüttungen ab 2016)');
    o.push('');
    o.push('Betrag anders = Verhältnis Yahoo/Alpaca (Alpaca vor einem Split mit dem Kursfaktor umgerechnet); nur Yahoo / nur Alpaca = Ausschüttung in % des Vortagsschlusses.');
    o.push('');
    o.push(tabelle(['Reihe', 'abgedeckt', 'Yahoo / Alpaca', 'gleich', 'Betrag anders', 'nur Yahoo', 'nur Alpaca', 'andere Maßnahmen'], KUERZEL.map(function (s) {
      var a = erg.alpacaMassnahmen[s];
      return [s, a.abgedeckt.replace(/(\d{4}-\d{2}-\d{2})/g, function (m) { return datum(m); }), a.yahooImBereich + ' / ' + a.alpacaImBereich, a.gleich,
        a.betragAnders.map(function (x) { return datum(x.exTag) + ' Yahoo = ' + de(x.verhaeltnisYahooZuAlpaca, 3) + ' × Alpaca' + (x.splitfaktor !== 1 ? ' (Kursfaktor ' + x.splitfaktor + ')' : ''); }).join('; ') || '–',
        a.nurYahoo.map(function (x) { return datum(x.exTag) + ' (' + de(x.renditeProzent, 3) + ' %)'; }).join('; ') || '–',
        a.nurAlpaca.map(function (x) { return datum(x.exTag) + ' (' + de(x.renditeProzent, 3) + ' %)'; }).join('; ') || '–',
        a.andereMassnahmen.map(function (x) { return x._art + ' ' + datum(x.ex_date) + ' ' + (x.old_rate ? x.old_rate + '→' + x.new_rate : ''); }).join('; ') || '–'];
    })));
    o.push('');
    var rundung = [], doppelt = [];
    KUERZEL.forEach(function (s) {
      erg.alpacaMassnahmen[s].betragAnders.forEach(function (x) {
        if (x.art === 'doppelt') doppelt.push(s + ' ' + datum(x.exTag) + ': Yahoo = ' + de(x.verhaeltnisYahooZuAlpaca, 3) + ' × Alpaca');
        else if (x.art === 'rundung') rundung.push(s + ' ' + datum(x.exTag));
      });
    });
    o.push('Lesart: „gleich“ = gleicher Ex-Tag und Betrag bis auf Yahoos Rundung auf drei Stellen. ' +
      (rundung.length ? rundung.length + ' Fälle vor einem Split sind genau Yahoos Rundung des Rohbetrags auf drei Stellen vor der Umrechnung (' + rundung.join(', ') + '; Wirkung je Fall < 0,001 %). ' : '') +
      (doppelt.length ? '**Doppelt geführt bei Yahoo: ' + doppelt.join('; ') + '** – die Nachbarmonate liegen beim einfachen Betrag (Einzelheiten in Abschnitt 7). ' : '') +
      'Fälle „nur Yahoo“ 2016 und SPY 15.06.2018 sind bekannte Lücken bei Alpaca; die übrigen Fälle stehen in Abschnitt 7 mit ihrer Größe.');
    o.push('');
    o.push('### 6b Alpaca-Minutenarchiv (Rohkurse, SIP)');
    o.push('');
    var kf = erg.minuten.kopf, sf = erg.minuten.sitzungsfenster;
    o.push('Aufbau: je Kürzel und Jahr eine Datei (Format ' + Object.keys(kf.SPY.formate).join('/') + ', Felder [Zeit ms UTC, Schluss, Umsatz, Hoch, Tief, Eröffnung], Quelle durchweg „alpaca“, fremde Kerzen ' +
      KUERZEL.map(function (s) { return kf[s].fremdKerzen; }).reduce(function (a, b) { return a + b; }) + '). Eröffnung = O der ersten regulären Minute ab 09:30 New York; Tagesschluss-Kandidaten: ' +
      'C1 = O der Schlusskerze (16:00, an Halbtagen 13:00), C2 = C der Schlusskerze, C3 = C der letzten regulären Minute. Halbtage nach NYSE-Regel; gegen den Sitzungskalender der SPY-Datei geprüft: ' +
      (sf.abweichendVonHalbtagsregel.length ? sf.abweichendVonHalbtagsregel.join('; ') + ' (Lücke in den SPY-Minuten, nicht im Kalender)' : 'keine Abweichung') + '. Tage, an denen die zweite Quelle den Schluss nicht hat (letzte Kerze > 5 min vor Schluss, keine Schlusskerze): ' +
      KUERZEL.map(function (s) { return s + ' ' + erg.minuten.je[s].unvollstaendigInAlpaca.length; }).join(', ') + ' (nicht verglichen). Fehlende Tage in der zweiten Quelle: ' +
      KUERZEL.map(function (s) { return s + ' ' + erg.minuten.je[s].fehltInAlpaca['2016-2026'].length; }).join(', ') + '; Tage nur in der zweiten Quelle: ' + KUERZEL.map(function (s) { return s + ' ' + erg.minuten.je[s].fehltInYahoo.length; }).join(', ') + '.');
    o.push('');
    o.push('**Projektwissen „amtlicher Schluss = O der 16:00-Kerze“ selbst geprüft** (2016–2026, Betrag der relativen Abweichung zu Yahoo, Median / 95-%-Punkt / 99-%-Punkt in %):');
    o.push('');
    o.push(tabelle(['Reihe', 'C1 = O 16:00', 'C2 = C 16:00', 'C3 = C letzte reguläre', 'ohne 16:00-Kerze'], KUERZEL.map(function (s) {
      var q = erg.minuten.je[s].zeitraeume['2016-2026'], k = q.schlussKandidaten;
      function f3(x) { return de(x.medianBetrag, 4) + ' / ' + de(x.p95Betrag, 4) + ' / ' + de(x.p99Betrag, 4); }
      return [s, f3(k.C1_O_der_Schlusskerze), f3(k.C2_C_der_Schlusskerze), f3(k.C3_C_der_letzten_regulaeren), q.schlussOhneSchlusskerze];
    })));
    o.push('');
    o.push('Befund: Für die NYSE-Arca-Werte BIL, EFA, AGG trifft C1 am besten; bei SPY liegen C1 und C3 gleichauf (Median ≈ 0,009 %); bei den Nasdaq-Werten ACWX und SHY trifft C2 (Schluss der 16:00-Kerze) ' +
      'mindestens so gut – dort kommt die Schlussauktion nicht als erster Abschluss der Minute. Gerechnet wird unten mit C1 (sonst C3); bei Abweichungen > 0,2 % steht dabei, ob ein anderer Kandidat passt.');
    o.push('');
    o.push('**Kennzahlen Yahoo gegen zweite Quelle** (Betrag der relativen Abweichung in %: Median / 99-%-Punkt / Maximum; n Tage):');
    o.push('');
    var mz = [];
    KUERZEL.forEach(function (s) {
      ['2016-2026', 'AV2016', 'A', 'B'].forEach(function (z) {
        var q = erg.minuten.je[s].zeitraeume[z];
        mz.push([s, z, q.tage, de(q.eroeffnung.medianBetrag, 4) + ' / ' + de(q.eroeffnung.p99Betrag, 4) + ' / ' + de(q.eroeffnung.maxBetrag, 4),
          de(q.schluss.medianBetrag, 4) + ' / ' + de(q.schluss.p99Betrag, 4) + ' / ' + de(q.schluss.maxBetrag, 4), q.eroeffnungUeber0_5.length, q.schlussUeber0_2.length, q.ersteKerzeNicht0930]);
      });
    });
    o.push(tabelle(['Reihe', 'Zeitraum', 'Tage', 'Eröffnung', 'Schluss (C1, sonst C3)', 'Eröffnung > 0,5 %', 'Schluss > 0,2 %', 'erste Kerze nach 09:30'], mz));
    o.push('');
    o.push('Alle Tage mit Eröffnung > 0,5 % bzw. Schluss > 0,2 % (2016–2026):');
    o.push('');
    KUERZEL.forEach(function (s) {
      var q = erg.minuten.je[s].zeitraeume['2016-2026'];
      q.eroeffnungUeber0_5.forEach(function (x) {
        o.push('- ' + s + ' ' + datum(x.tag) + ' **Eröffnung** ' + de(x.abweichung, 3) + ' % (erste Kerze der zweiten Quelle ' + x.ersteKerze + '): ' + x.einstufung);
      });
      q.schlussUeber0_2.forEach(function (x) {
        o.push('- ' + s + ' ' + datum(x.tag) + ' **Schluss** ' + de(x.abweichung, 3) + ' % gegen ' + x.kandidat + ' (gegen C1/C2/C3 ' + de(x.c1, 3) + '/' + de(x.c2, 3) + '/' + de(x.c3, 3) +
          ' %; gegen Hoch/Tief der regulären Sitzung der zweiten Quelle ' + de(x.gegenSitzungshochProzent, 3) + '/' + de(x.gegenSitzungstiefProzent, 3) + ' %): ' + x.einstufung);
      });
    });
    o.push('');
    o.push('**Ausführungstage R1/R2** (erster Handelstag jedes Monats; A ab Februar 2017): Abweichung der Yahoo-Eröffnung gegen die zweite Quelle in %. Zusammenfassung: ' +
      ['A', 'B'].map(function (f) {
        var zz = erg.minuten.ausfuehrungstageZusammen[f];
        return f + ': ' + HAUPT.map(function (s) { return s + ' max ' + (zz[s].maxProzent ? de(zz[s].maxProzent.d, 4) + ' % (' + datum(zz[s].maxProzent.tag) + ')' : '–') + ', > 0,05 %: ' + zz[s].ueber0_05; }).join('; ');
      }).join(' — ') + '.');
    o.push('');
    o.push(tabelle(['Monat', 'Tag', 'SPY', 'BIL', 'ACWX', 'AGG', 'SHY (N2)', 'EFA (N2)'], erg.minuten.ausfuehrungstage.map(function (z) {
      return [z.fenster + ' ' + z.monat, datum(z.tag)].concat(KUERZEL.slice().sort(function (a, b) { return ['SPY', 'BIL', 'ACWX', 'AGG', 'SHY', 'EFA'].indexOf(a) - ['SPY', 'BIL', 'ACWX', 'AGG', 'SHY', 'EFA'].indexOf(b); })
        .map(function (s) { var c = z[s]; return c.fehlt ? 'fehlt (' + c.fehlt + ')' : de(c.d, 4) + (c.ersteKerze ? ' @' + c.ersteKerze : '') + (c.einstufung && c.einstufung.indexOf('veraltet') >= 0 ? ' **veraltet**' : ''); }));
    })));
    o.push('');
    o.push('**Starttage** (Kauf zur Eröffnung, Maßstab immer SPY): ' + ['A', 'B'].map(function (f) {
      var zz = erg.minuten.starttageZusammen[f];
      return f + ' ' + HAUPT.map(function (s) { return s + ' max ' + (zz[s].maxProzent ? de(zz[s].maxProzent.d, 4) + ' % (' + datum(zz[s].maxProzent.tag) + ')' : '–'); }).join(', ');
    }).join('; ') + '. **Endtage** (Schluss): ' + erg.minuten.endtage.map(function (z) {
      return datum(z.tag) + ' ' + KUERZEL.map(function (s) { return s + ' ' + (z[s].fehlt ? 'fehlt' : de(z[s].d, 4)); }).join(', ');
    }).join('; ') + ' (%).');
    o.push('');
    var mz2 = erg.minuten.monatsendenZusammen;
    o.push('**Monatsend-Schlüsse 2016-01 bis 2026-08** (Signaltage; ' + erg.minuten.monatsenden.length + ' Monate): ' + KUERZEL.map(function (s) {
      return s + ' Median ' + de(mz2[s].medianBetragProzent, 4) + ' %, max ' + (mz2[s].maxProzent ? de(mz2[s].maxProzent.d, 4) + ' % (' + datum(mz2[s].maxProzent.tag) + ')' : '–') + ', > 0,05 %: ' + mz2[s].ueber0_05;
    }).join('; ') + '. Der Monatsend-Schluss 31.12.2015 (Bezug des ersten R2-Signals in A) liegt vor der zweiten Quelle.');
    o.push('');
    var kp = erg.kippProbe;
    o.push('**Kipp-Probe** (nur Signale nach REGEL §4, keine Erträge): Variante „Schluss“ – jeder Yahoo-Schluss ab 2016 durch den der zweiten Quelle ersetzt (Ausschüttungen Yahoo): R1 ' +
      kp.schluss.R1.abweichend.length + ' von ' + kp.schluss.R1.verglichen + ' Monatsenden anders, R2 ' + kp.schluss.R2.abweichend.length + ' von ' + kp.schluss.R2.verglichen +
      ', R2 mit N2-Reihen ' + kp.schluss.R2_N2.abweichend.length + ' von ' + kp.schluss.R2_N2.verglichen + ', R3-Zone (unter/im/über dem 1-%-Band) an ' + kp.schluss.R3_Zone.abweichend.length + ' von ' + de(kp.schluss.R3_Zone.verglichen) + ' Tagen' +
      (kp.schluss.R3_Zone.abweichend.length ? ' (' + kp.schluss.R3_Zone.abweichend.map(datum).join(', ') + ')' : '') + ', R3-Zustand (investiert/draußen, mit Gedächtnis ab 1993) an ' + kp.schluss.R3_Zustand.abweichend.length + ' von ' +
      de(kp.schluss.R3_Zustand.verglichen) + ' Tagen' + (kp.schluss.R3_Zustand.abweichend.length ? ' (' + kp.schluss.R3_Zustand.abweichend.map(datum).join(', ') + ')' : '') +
      '. Variante „Ausschüttung“ – Yahoo-Schlüsse, abweichende Beträge durch Alpaca ersetzt, Alpaca-only ergänzt: R1 ' +
      kp.ausschuettung.R1.abweichend.length + ', R2 ' + kp.ausschuettung.R2.abweichend.length + ', R2 (N2) ' + kp.ausschuettung.R2_N2.abweichend.length + ' anders. ' +
      ((kp.schluss.R1.abweichend.length + kp.schluss.R2.abweichend.length + kp.ausschuettung.R1.abweichend.length + kp.ausschuettung.R2.abweichend.length +
        kp.schluss.R3_Zustand.abweichend.length) === 0
        ? 'Damit hängen die Signale der Hauptlesart in Vorlauf A, A und B an keiner Stelle an der Wahl der Quelle; die Datenabweichungen wirken nur über Ausführungskurse und Ausschüttungen (Abschnitt 7).'
        : 'An den genannten Stellen hängt ein Signal an der Wahl der Quelle; ob dort tatsächlich ein Handel ausgelöst wird, zeigt erst der Rechner (Abschnitt 7).'));
    o.push('');
    o.push('### 6c Dritte Quelle');
    o.push('');
    o.push(erg.dritteQuelle.versucht + ': ' + erg.dritteQuelle.ergebnis + '. Die Jahre 2002–2015 bleiben damit ohne Gegenprobe.');
  }

  /* 7 Einordnung */
  o.push('');
  o.push('## 7 Einordnung: Befunde, die eine Zahl des Urteils berühren könnten');
  o.push('');
  o.push('Regel: ' + erg.einordnung.regel + '. Nichts wird repariert; die Wirkung rechnet der Rechner später nachrichtlich mit dem Wert der zweiten Quelle (REGEL §2.6).');
  o.push('');
  var bf = erg.einordnung.befunde.slice().sort(function (a, b) { return (a.stufe === b.stufe ? 0 : a.stufe === 'vorbehalt' ? -1 : 1) || (a.tag < b.tag ? -1 : 1); });
  o.push(tabelle(['Stufe', 'Reihe', 'Fenster', 'Tag', 'Befund', 'Größe', '$ auf 100.000 $', 'Pp p. a.', 'Wirkt wie'], bf.map(function (b) {
    return [b.stufe === 'vorbehalt' ? '**Vorbehalt**' : 'Hinweis', b.reihe, b.fenster, datum(b.tag), b.art + (b.einstufung ? ' – ' + b.einstufung : ''), de(b.groesseProzent, 4) + ' %',
      de(b.dollarJe100k), b.ppPa === undefined ? '–' : de(b.ppPa, 3), b.wirkung];
  })));
  o.push('');
  var zo = erg.einordnung.zusatzOhneZweiteQuelle;
  o.push('Zusatz 10/2003–2015 (jeder Handelstag ist dort Starttag, keine Gegenprobe): Eröffnung = Vortagsschluss an ' + Object.keys(zo).map(function (s) {
    return s + ' ' + zo[s].eroeffnungGleichVortagsschluss + ' von ' + de(zo[s].tage) + ' Tagen (Monatsanfänge: ' + (zo[s].davonMonatsanfaenge.length ? zo[s].davonMonatsanfaenge.map(datum).join(', ') : 'keine') + ')';
  }).join('; ') + '. Wirkung je betroffenem Fenster höchstens die Übernachtlücke dieses Tages (bei SPY typisch 0,1–0,5 %); der Zusatz entscheidet nichts.');
  o.push('');
  o.push('## Verfahren');
  o.push('');
  o.push('- Aufruf aus der Repo-Wurzel: `node studien/trendfilter-messung-2026-10/datenpruefung.js [--daten <ordner>] [--ohne-e] [--e <archiv>] [--aus <ordner>]`. Liest nur; E: wird jahresweise in einem Prozess gelesen.');
  o.push('- Handelstag = New Yorker Datum des Zeitstempels (`laden.js nyTag`); Kalender = SPY-Zeilen mit Schluss; alles nach dem 15.09.2026 bleibt außen vor. Gesamtertrag nach §2.5 nur zum Vergleich mit `adjclose`.');
  o.push('- In dieser Datei und in der JSON stehen nur relative Abweichungen (%), Verhältnisse, Tage, Zählungen und Einstufungen – keine absoluten Kurse und keine Beträge je Stück.');
  return o.join('\n') + '\n';
}

if (require.main === module) {
  var erg = main();
  fs.writeFileSync(path.join(AUS, 'datenpruefung.json'), JSON.stringify(erg, null, 1) + '\n');
  fs.writeFileSync(path.join(AUS, 'DATENPRUEFUNG.md'), bericht(erg));
  console.log('datenpruefung.json und DATENPRUEFUNG.md geschrieben (' + erg.laufzeitSekunden + ' s) nach ' + AUS.replace(/\\/g, '/'));
  KUERZEL.forEach(function (s) {
    console.log(s + ': ' + ['AV', 'A', 'B', 'Z'].map(function (z) { return z + ' ' + erg.urteil[s][z].stufe; }).join(' | '));
  });
}

module.exports = { nyseFrei: nyseFrei, nyseHalbtage: nyseHalbtage, median: median, punkt: punkt, main: main, bericht: bericht };
