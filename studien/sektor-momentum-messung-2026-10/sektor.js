'use strict';
/* Messung Sektor-Momentum (ZUSATZ.md, Kennung sektor-momentum-messung-2026-10/v1): der Simulator.
 * Gemessen wird die Regel kandidaten-blind-2026-10/sektor-momentum/v1 (REGEL.md, ziel.js aus c903255) auf den Yahoo-Tagesdaten (ZUSATZ §1).
 * Hier stehen: der Leser der Rohdateien (§1.5), Kalender und Klinken (§1.6, §1.9), die rohMap am Stichtag (§1.7), der Nachlauf mit den
 * sechs Schritten von korb.js simuliere in derselben Reihenfolge (§2.2), Takt und zuWenig (§2.3), Perioden (§2.4), Kennzahlen ueber die
 * Originalfunktionen von rueckblick.js (duenne Anpassung an den Yahoo-Kalender, §2.5), die Periodenstreuung mit berechnetem t-Wert (§2.6),
 * die Startphasen (§2.7), das Urteil (§3), der Gesamtertrag auf adjclose (§4) und der Zusatz ohne Urteil (§5).
 * Nur gerufen, nie geaendert: zielfunktion/placeboZiel (ziel.js), gleichgewicht (korb.js), kennzahlen/maxRueckschlag/kalenderjahre/median
 * (rueckblick.js), bewerte (mfhandel.js). Dieses Modul laedt selbst keine Kursdatei, ausser ueber ladeRohdateien (von lauf.js gerufen).
 * Wo ZUSATZ und REGEL schweigen, gilt die Lesart von korb.js / rueckblick.js. Alles Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');
var Z = require(path.join(REPO, 'studien', 'kandidaten-blind-2026-10', 'sektor-momentum', 'ziel.js'));
var KB = require(path.join(REPO, 'studien', 'momentum-korb-2026-10-04', 'korb.js'));
var R = require(path.join(REPO, 'studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js'));
var MH = require(path.join(REPO, 'mfhandel.js'));

var KENNUNG = 'sektor-momentum-messung-2026-10/v1';
var REGEL_KENNUNG = 'kandidaten-blind-2026-10/sektor-momentum/v1';
var FONDS = Z.KONFIG.universum.slice();          /* die elf Namen der REGEL A.1, aus ziel.js gelesen */
var MASSSTAB = 'SPY';
var KUERZEL = FONDS.concat([MASSSTAB]);
var START = R.START;                             /* 100.000 $ (REGEL A.6) */
var KOSTEN_BP = 20;                              /* REGEL A.7: 20 Bp je Seite */
var HALTEN = 21;                                 /* REGEL A.5, C.1: Takt 21 statt MH.buchKonfig().halten = 63 */
var PHASEN = 63;                                 /* REGEL A.8: k = 0 ... 62 */
var MIN_PHASEN_VORN = 45;                        /* ZUSATZ §3.1: mindestens 45 von 63 */
var MAX_ZUWENIG_ANTEIL = 0.05;                   /* ZUSATZ §2.3: ueber 5 % -> "nicht ausfuehrbar" */
var ZEILEN_ROH = Z.KONFIG.rueckblick + Z.KONFIG.luecke + 1;   /* 253 Zeilen je Fonds in der rohMap (ZUSATZ §1.7) */
var TAG_MS = 86400000;
var DATEN_ORDNER = process.env.SEKTOR_DATEN || 'C:/Users/Wilhe/Downloads/sektor-messung/daten';
var LETZTER_TAG = '2026-09-15';
/* ZUSATZ §1.6 und §2.4: Fenster, Stichtage, Zahl der Handelstage, Perioden bei k = 0 ohne zuWenig, SPY-Ex-Tage (§1.9) */
var FENSTER = {
  A: { von: '2017-01-04', bis: '2021-09-15', stichtag: '2017-01-03', handelstage: 1183, perioden: 57, letztePeriode: 7, spyAusschuettungen: 18 },
  B: { von: '2021-09-16', bis: '2026-09-15', stichtag: '2021-09-15', handelstage: 1254, perioden: 60, letztePeriode: 15, spyAusschuettungen: 20 },
};
/* ZUSATZ §1.9 (REGEL A.6, C.1): SPY-Satz vom 15.06.2018. Fuehrt Yahoo fuer SPY einen Satz mit diesem Ex-Tag, gilt Yahoos Betrag;
 * sonst wird dieser Satz ergaenzt. Hoechstens ein Satz je Ex-Tag aus der Ergaenzung (Klinke). Herkunft: Nr. 78 (korb.js ERGAENZUNGEN). */
var SPY_ERGAENZUNG = { ex_date: '2018-06-15', rate: 1.2456 };
/* ZUSATZ §1.9: Pflichtpruefung gegen die bekannten SPY-Zahlen (Nr. 78), Toleranzen (i)-(iii) 0,30 Pp Gesamtertrag, (iv) 0,01 $ */
var PFLICHT = {
  i: { von: '2017-01-03', bis: '2021-09-15', kauf: 'schluss', sollGesamt: 115.95 },
  ii: { von: '2017-01-04', bis: '2021-09-15', kauf: 'eroeffnung', sollEnde: 215535.73 },
  iii: { von: '2021-09-16', bis: '2026-09-15', kauf: 'eroeffnung', sollEnde: 181193.87 },
  iv: { A: 23.8656, B: 34.0657 },
  toleranzPp: 0.30, toleranzDollar: 0.01,
};
/* ZUSATZ §5: Langlaeufe ab 03.01.2000 bis 15.09.2026, rollierende Fuenfjahresfenster. "Nur Ende <= 15.09.2026" heisst: das Fenster ist in den
 * Daten vollstaendig, d. h. s + 5 Jahre <= 16.09.2026 (der Kalendertag nach dem letzten Datentag; der 16.09.2026 ist ein Mittwoch und
 * Handelstag, also endet jedes Fenster mit s + 5 Jahre > 16.09.2026 in Wirklichkeit nach dem 15.09.2026). Beispiel der ZUSATZ:
 * 16.09.2021 -> 15.09.2026 ist dabei, 17.09.2021 nicht. */
var ZUSATZ5 = { ab: '2000-01-03', ende: '2026-09-15', jahre: 5, grenzeNachDaten: '2026-09-16' };
/* Saetze Betrag / Vortagesschluss ausserhalb 0,01 % bis 5 % werden einzeln gelistet (ZUSATZ §1.8, nur Bericht, nie gefiltert). */
var SATZ_BEREICH = [0.0001, 0.05];

function round4(x) { return Math.round(x * 10000) / 10000; }
function kopie(o) { var a = {}; Object.keys(o).forEach(function (k) { a[k] = o[k]; }); return a; }

/* ================= Leser (ZUSATZ §1.5) ================= */
var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
/** Kalendertag eines Unix-Zeitstempels (Sekunden) in America/New_York als JJJJ-MM-TT. */
function tagNY(sek) {
  var t = NY.format(new Date(sek * 1000));
  if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) throw new Error('KLINKE: Datumsformat ' + t);
  return t;
}
/** Zeitstempel der Zeile = Mitternacht UTC des Tages (REGEL C.9). */
function tagMs(tag) { var p = String(tag).split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2]); }
function gueltig(x) { return typeof x === 'number' && isFinite(x) && x > 0; }
function zahlOderNull(x) { return typeof x === 'number' && isFinite(x) ? x : null; }
function gleicheZeile(a, b) {
  return a.open === b.open && a.high === b.high && a.low === b.low && a.close === b.close && a.volume === b.volume && a.adj === b.adj;
}

/** Eine Yahoo-Antwort (v8/chart, 1d) -> Zeilen, Ausschuettungen, Splits, Zaehler.
 *  Zeile entfaellt, wenn close oder adjclose fehlt oder <= 0 ist (gezaehlt). Zwei Zeilen mit demselben New-Yorker Datum: sind sie gleich
 *  (open, high, low, close, volume, adjclose), zaehlt eine; sonst gilt die letzte in der Antwort (gezaehlt und gelistet). */
function liesAntwort(json, sym) {
  var c = json && json.chart;
  if (!c || c.error) throw new Error('KLINKE: ' + sym + ': chart fehlt oder chart.error gesetzt');
  var r = c.result && c.result[0];
  if (!r || !r.meta || r.meta.symbol !== sym) throw new Error('KLINKE: ' + sym + ': result[0] fehlt oder meta.symbol passt nicht');
  var ts = r.timestamp || [], ind = r.indicators || {}, q = ind.quote && ind.quote[0];
  var adj = ind.adjclose && ind.adjclose[0] && ind.adjclose[0].adjclose;
  if (!ts.length || !q || !adj) throw new Error('KLINKE: ' + sym + ': timestamp, quote oder adjclose fehlt');
  ['open', 'close', 'volume'].forEach(function (f) { if (!q[f] || q[f].length !== ts.length) throw new Error('KLINKE: ' + sym + ': Feld ' + f + ' fehlt oder Laenge falsch'); });
  if (adj.length !== ts.length) throw new Error('KLINKE: ' + sym + ': adjclose Laenge falsch');
  var zeilen = [], z = { balken: ts.length, entfallen: 0, entfallenTage: [], doppeltGleich: 0, doppeltVerschieden: 0, doppelt: [] };
  for (var i = 0; i < ts.length; i++) {
    var tag = tagNY(ts[i]), cl = q.close[i], ad = adj[i];
    if (!gueltig(cl) || !gueltig(ad)) { z.entfallen++; z.entfallenTage.push(tag); continue; }
    var zeile = { tag: tag, ms: tagMs(tag), open: zahlOderNull(q.open[i]), high: q.high ? zahlOderNull(q.high[i]) : null, low: q.low ? zahlOderNull(q.low[i]) : null,
      close: cl, volume: zahlOderNull(q.volume[i]), adj: ad };
    var letzte = zeilen[zeilen.length - 1];
    if (letzte && letzte.tag === tag) {
      if (gleicheZeile(letzte, zeile)) { z.doppeltGleich++; z.doppelt.push({ tag: tag, gleich: true }); }
      else { z.doppeltVerschieden++; z.doppelt.push({ tag: tag, gleich: false }); zeilen[zeilen.length - 1] = zeile; }
      continue;
    }
    if (letzte && tag < letzte.tag) throw new Error('KLINKE: ' + sym + ': Zeitstempel nicht aufsteigend (' + tag + ' nach ' + letzte.tag + ')');
    zeilen.push(zeile);
  }
  var ev = r.events || {}, aus = [], splits = [];
  Object.keys(ev.dividends || {}).forEach(function (k) {
    var x = ev.dividends[k] || {}, sek = x.date != null ? Number(x.date) : Number(k);
    aus.push({ betrag: Number(x.amount), exTag: tagNY(sek), sek: sek, schluesselGleich: String(k) === String(x.date) });
  });
  aus.sort(function (a, b) { return a.sek - b.sek; });
  Object.keys(ev.splits || {}).forEach(function (k) {
    var x = ev.splits[k] || {}, sek = x.date != null ? Number(x.date) : Number(k);
    splits.push({ exTag: tagNY(sek), sek: sek, zaehler: Number(x.numerator), nenner: Number(x.denominator), verhaeltnis: x.splitRatio || null });
  });
  splits.sort(function (a, b) { return a.sek - b.sek; });
  return { sym: sym, zeilen: zeilen, ausschuettungen: aus, splits: splits, zaehler: z,
    meta: { waehrung: r.meta.currency || null, boerse: r.meta.exchangeName || null, zeitzone: r.meta.exchangeTimezoneName || null } };
}

/** SPY-Ergaenzung (ZUSATZ §1.9): je Ergaenzung hoechstens ein Satz; nur wenn die Liste fuer diesen Ex-Tag keinen Satz fuehrt. */
function mitErgaenzung(liste, ergaenzungen, protokoll) {
  if (!ergaenzungen || !ergaenzungen.length) return liste;
  var aus = liste.slice(), tage = {};
  ergaenzungen.forEach(function (x) {
    if (tage[x.ex_date]) throw new Error('KLINKE: zwei Ergaenzungen am selben Ex-Tag ' + x.ex_date);
    tage[x.ex_date] = true;
    var da = aus.some(function (y) { return y.exTag === x.ex_date; });
    if (da) { if (protokoll) protokoll.schonDa++; return; }
    aus.push({ betrag: x.rate, exTag: x.ex_date, sek: null, ergaenzt: true });
    if (protokoll) protokoll.ergaenzt++;
  });
  return aus;
}

/** Erster Kalender-Index mit Datum >= datum; -1 ausserhalb des Kalenders (wie R.tagAb). */
function tagAb(D, datum) {
  var t = D.kal.tage, n = t.length;
  if (!n || datum < t[0] || datum > t[n - 1]) return -1;
  var lo = 0, hi = n - 1;
  while (lo < hi) { var m = (lo + hi) >> 1; if (t[m] < datum) lo = m + 1; else hi = m; }
  return lo;
}

/** Die Daten: Kalender = Tage der SPY-Reihe (ZUSATZ §1.6); je Reihe Felder, Zuordnung Kalendertag -> Zeile, rohMap-Zeilen, Ausschuettungen
 *  nach Buchungstag (Ex-Tag ohne Handelstag -> erster Handelstag danach). opt.ergaenzungen: { SYM: [{ex_date, rate}] }, Vorgabe die SPY-Ergaenzung. */
function baueDaten(gelesen, opt) {
  opt = opt || {};
  var erg = opt.ergaenzungen === undefined ? { SPY: [SPY_ERGAENZUNG] } : (opt.ergaenzungen || {});
  var spy = gelesen[MASSSTAB];
  if (!spy) throw new Error('KLINKE: keine Reihe ' + MASSSTAB + ' - kein Kalender');
  var tage = spy.zeilen.map(function (x) { return x.tag; }), N = tage.length;
  var D = { kal: { tage: tage }, ms: new Float64Array(N), idx: {}, n: N, reihen: {}, zielCache: {}, protokoll: { ergaenzt: 0, schonDa: 0 } };
  tage.forEach(function (t, i) { D.ms[i] = tagMs(t); D.idx[t] = i; });
  Object.keys(gelesen).forEach(function (sym) { D.reihen[sym] = baueReihe(D, gelesen[sym], erg[sym] || null); });
  return D;
}
function baueReihe(D, L, erg) {
  var n = L.zeilen.length;
  var r = { sym: L.sym, n: n, tag: new Array(n), ms: new Float64Array(n), open: new Float64Array(n), close: new Float64Array(n), adj: new Float64Array(n),
    volume: new Array(n), roh: new Array(n), zeileAm: new Int32Array(D.n).fill(-1), ohneKalender: [], nachTag: new Array(D.n), splits: L.splits,
    leser: L.zaehler, aussch: [], az: { gelesen: 0, ergaenzt: 0, gezaehlt: 0, nichtPositiv: 0, ausserhalbKalender: 0, nachLetzterZeile: 0, ohneHandelstag: 0, mehrfachAmTag: 0 } };
  for (var i = 0; i < n; i++) {
    var z = L.zeilen[i];
    r.tag[i] = z.tag; r.ms[i] = z.ms; r.open[i] = z.open == null ? NaN : z.open; r.close[i] = z.close; r.adj[i] = z.adj; r.volume[i] = z.volume;
    /* rohMap-Zeile (ZUSATZ §1.7): [Zeitstempel, adjclose, close x volume / adjclose] - Kurs x Stueck = close x volume; ohne volume Stueck null */
    r.roh[i] = [z.ms, z.adj, z.volume == null ? null : z.close * z.volume / z.adj];
    var k = D.idx[z.tag];
    if (k == null) r.ohneKalender.push(z.tag); else r.zeileAm[k] = i;
  }
  var liste = L.ausschuettungen;
  r.az.gelesen = liste.length;
  if (erg) { var vor = D.protokoll.ergaenzt; liste = mitErgaenzung(liste, erg, D.protokoll); r.az.ergaenzt = D.protokoll.ergaenzt - vor; }
  liste.forEach(function (a) {
    var e = { betrag: a.betrag, exTag: a.exTag, ergaenzt: !!a.ergaenzt, buchTag: null, gezaehlt: false, grund: null };
    r.aussch.push(e);
    if (!(a.betrag > 0)) { r.az.nichtPositiv++; e.grund = 'Betrag <= 0'; return; }
    var t = tagAb(D, a.exTag);
    if (t < 0) { r.az.ausserhalbKalender++; e.grund = 'ausserhalb des Kalenders'; return; }
    if (n && a.exTag > r.tag[n - 1]) { r.az.nachLetzterZeile++; e.grund = 'nach der letzten Zeile'; return; }
    if (D.kal.tage[t] !== a.exTag) r.az.ohneHandelstag++;
    (r.nachTag[t] = r.nachTag[t] || []).push(a.betrag);
    if (r.nachTag[t].length === 2) r.az.mehrfachAmTag++;
    e.buchTag = D.kal.tage[t]; e.gezaehlt = true; r.az.gezaehlt++;
  });
  return r;
}

/** Zeilen-Zeiger: Zahl der Zeilen der Reihe mit Zeitstempel <= ms (binaere Suche). */
function endeBis(r, ms) {
  var lo = 0, hi = r.n;
  while (lo < hi) { var m = (lo + hi) >> 1; if (r.ms[m] <= ms) lo = m + 1; else hi = m; }
  return lo;
}

/** Saetze mit Buchungstag d einer Reihe (dieselbe Funktion fuer Buch und Massstab, wie R.ausschuettungenAm):
 *  satz = Betrag / close des Vortags (letzte Zeile der Reihe vor d), basis = close des Vortags. */
function ausschuettungenAm(D, sym, d) {
  var r = D.reihen[sym], liste = r.nachTag[d];
  if (!liste) return [];
  var e = endeBis(r, D.ms[d] - 1);
  if (e <= 0) return [];
  var v = e - 1;
  return liste.map(function (b) { return { rate: b, satz: b / r.close[v], basis: r.close[v] }; });
}

/* ================= rohMap und Zielliste (ZUSATZ §1.7) ================= */
/** rohMap am Stichtag s (Kalender-Index): je Fonds die letzten 253 Zeilen mit Datum <= Stichtag; ein Fonds ohne Zeile bis s fehlt (wie R.rohMapAm). */
function rohMapAm(D, s, zeilen) {
  var roh = {}, nowMs = D.ms[s], nz = zeilen || ZEILEN_ROH;
  FONDS.forEach(function (sym) {
    var r = D.reihen[sym];
    if (!r) return;
    var e = endeBis(r, nowMs);
    if (e <= 0) return;
    roh[sym] = r.roh.slice(Math.max(0, e - nz), e);
  });
  return roh;
}
function kurzGrund(g) { return String(g).split(' – ')[0].replace(/ \(\d+ Balken\)$/, ''); }
/** Zielliste zum Stichtag s, Modus 'kandidat' (zielfunktion) oder 'placebo' (placeboZiel); umsatzMin null = Regel (100 Mio $). Cache je (s, Modus, umsatzMin). */
function zielAm(D, s, modus, umsatzMin) {
  var key = s + '|' + modus + '|' + (umsatzMin == null ? 'regel' : umsatzMin), c = D.zielCache[key];
  if (c) return c;
  var opts = { nowMs: D.ms[s] };
  if (umsatzMin != null) opts.umsatzMin = umsatzMin;
  var f = modus === 'placebo' ? Z.placeboZiel : modus === 'kandidat' ? Z.zielfunktion : null;
  if (!f) throw new Error('unbekannter Modus: ' + modus);
  var r = f(rohMapAm(D, s), opts);
  r.ziel.forEach(function (nm) { if (FONDS.indexOf(nm) < 0) throw new Error('KLINKE: Kuerzel ausserhalb der Liste im Ziel: ' + nm); });
  return (D.zielCache[key] = { ziel: r.ziel.slice(), zuWenig: !!r.zuWenig, zulaessig: r.korb.zulaessig, geprueft: r.korb.geprueft,
    verworfen: r.verworfen.map(function (v) { return v.sym + ': ' + kurzGrund(v.grund); }) });
}

/* ================= Der Nachlauf (ZUSATZ §2.2-2.5, korb.js simuliere) ================= */
function offenWert(buch, preise) {
  var w = buch.cash;
  buch.positionen.forEach(function (p) { if (preise[p.sym] > 0) w += p.stueck * preise[p.sym]; });
  return w;
}
/** SPY: Kauf zur Eroeffnung des Starttags ohne Kosten (Preisweg adjclose: open x adjclose / close). */
function spyKonto(D, startTag, adjWeg) {
  var r = D.reihen[MASSSTAB], z = r.zeileAm[startTag];
  if (z < 0 || !(r.open[z] > 0)) throw new Error('KLINKE: Massstab ohne Eroeffnung am Starttag ' + D.kal.tage[startTag]);
  var kurs = adjWeg ? r.open[z] * r.adj[z] / r.close[z] : r.open[z];
  return { stueck: START / kurs, schluss: NaN, ausschuettungen: 0, summe: 0, rateSumme: 0 };
}
/** Schritt 5: Ausschuettung am Ex-Tag (nach dem Kauftag) zum Schluss wieder anlegen; Bewertung zum Schluss. Liefert den Wert. */
function spySchritt(D, k, d, startTag, mitA, adjWeg) {
  var r = D.reihen[MASSSTAB], z = r.zeileAm[d];
  if (z >= 0) {
    if (mitA && d > startTag) ausschuettungenAm(D, MASSSTAB, d).forEach(function (a) {
      var betrag = k.stueck * a.basis * a.satz;
      k.stueck += betrag / r.close[z];
      k.ausschuettungen++; k.summe += betrag; k.rateSumme += a.rate;
    });
    k.schluss = adjWeg ? r.adj[z] : r.close[z];
  }
  return k.stueck * k.schluss;
}

/** Ein Nachlauf von startTag (erster Ausfuehrungstag, Kalender-Index) bis endTag.
 *  opt: { startTag, endTag, modus: 'kandidat'|'placebo', preisweg: 'haupt'|'adjclose', umsatzMin (null = Regel), ausschuettungen (false = ohne),
 *         kompakt (true = ohne Tageswerte und Umschichtungsliste) } */
function simuliere(D, opt) {
  var startTag = opt.startTag, endTag = opt.endTag, modus = opt.modus || 'kandidat', weg = opt.preisweg || 'haupt';
  if (modus !== 'kandidat' && modus !== 'placebo') throw new Error('unbekannter Modus: ' + modus);
  if (weg !== 'haupt' && weg !== 'adjclose') throw new Error('unbekannter Preisweg: ' + weg);
  var adjWeg = weg === 'adjclose', mitA = !adjWeg && opt.ausschuettungen !== false, kompakt = !!opt.kompakt;
  var umsatzMin = opt.umsatzMin == null ? null : opt.umsatzMin;
  if (!(startTag >= 1) || !(endTag >= startTag) || !(endTag < D.n)) throw new Error('Start/Ende ist kein Handelstag oder hat keinen Vortag');
  var tage = D.kal.tage;
  var buch = { cash: START, positionen: [], trades: [] }, meta = {};
  var zs = { umschichtungen: 0, zuWenigTage: 0, kosten: 0, volumen: 0, kaeufe: 0, verkaeufe: 0, teilverkaeufe: 0, aufstockungen: 0, positionen: 0, ohneKurs: 0,
    ausschuettungen: 0, ausschuettungSumme: 0, mehrfachAmExTag: 0, maxSatz: 0, lueckentage: 0, spyAusschuettungen: 0, spyAusschuettungSumme: 0, spyRateSumme: 0 };
  var reihenenden = [], umschichtungen = [], tw = [], perioden = [], offen = null, haltezeiten = [], saetzeAusserhalb = [], ziele = [], zuWenigListe = [];
  var maxGewicht = { anteil: 0, reihe: null, tag: null };
  var spyK = spyKonto(D, startTag, adjWeg);
  var buchWert = START, spyWert = START;                       /* Werte zum Schluss des Vortags */
  var naechste = startTag;

  for (var d = startTag; d <= endTag; d++) {
    /* 1. Reihenende: erster Handelstag nach der letzten Zeile -> zum letzten Schluss ausbuchen, ohne Kosten (ETFs haben keinen Ende-Grund;
     *    bei den Fonds nicht erwartet). Eine Luecke (Reihe spaeter wieder da) ist kein Ende. */
    for (var i = buch.positionen.length - 1; i >= 0; i--) {
      var p = buch.positionen[i], rp = D.reihen[p.sym];
      if (rp.zeileAm[d] >= 0) continue;
      var lz = rp.n - 1;
      if (rp.ms[lz] < D.ms[d]) {
        var gut = p.stueck * (adjWeg ? rp.adj[lz] : rp.close[lz]);
        buch.cash += gut;
        buch.positionen.splice(i, 1);
        reihenenden.push({ reihe: p.sym, tag: tage[d], letzteZeile: rp.tag[lz], gutschrift: gut });
        haltezeiten.push({ reihe: p.sym, von: meta[p.sym].seitTag, bis: d, ende: 'reihenende' });
        delete meta[p.sym];
      } else zs.lueckentage++;
    }
    /* 2. Ausschuettungen mit Buchungstag d: Anspruch nach der Stueckzahl ueber die Nacht (vor dem Handel des Tages, gehalten seit einem frueheren Tag) */
    var bar = 0;
    if (mitA) for (var j = 0; j < buch.positionen.length; j++) {
      var p2 = buch.positionen[j];
      if (!(meta[p2.sym].seitTag < d)) continue;
      var l = ausschuettungenAm(D, p2.sym, d);
      if (l.length > 1) zs.mehrfachAmExTag++;
      for (var a = 0; a < l.length; a++) {
        var betragB = p2.stueck * l[a].basis * l[a].satz;
        bar += betragB; zs.ausschuettungen++;
        if (l[a].satz > zs.maxSatz) zs.maxSatz = l[a].satz;
        if (l[a].satz < SATZ_BEREICH[0] || l[a].satz > SATZ_BEREICH[1]) saetzeAusserhalb.push({ reihe: p2.sym, tag: tage[d], betrag: l[a].rate, satzProzent: l[a].satz * 100 });
      }
    }
    /* 3. Umschichtung zur Eroeffnung des Ausfuehrungstags; Stichtag = Handelstag davor */
    if (d === naechste) {
      var s = d - 1, zl = zielAm(D, s, modus, umsatzMin);
      if (zl.zuWenig) { zs.zuWenigTage++; zuWenigListe.push(tage[d]); naechste = d + 1 <= endTag ? d + 1 : -1; }
      else {
        var preise = {};
        var kurs = function (name) {
          var rk = D.reihen[name], zk = rk.zeileAm[d];
          if (zk >= 0 && rk.open[zk] > 0) preise[name] = adjWeg ? rk.open[zk] * rk.adj[zk] / rk.close[zk] : rk.open[zk];
        };
        zl.ziel.forEach(kurs); buch.positionen.forEach(function (p3) { kurs(p3.sym); });
        var vor = offenWert(buch, preise);
        var erg = KB.gleichgewicht(buch, zl.ziel, preise, D.ms[d], KOSTEN_BP);
        var kosten = vor - offenWert(buch, preise);
        if (Math.abs(kosten - erg.volumen * KOSTEN_BP / 10000) > 1e-6) throw new Error('KLINKE: Kosten sind nicht ' + KOSTEN_BP + ' Bp auf das gehandelte Volumen');
        erg.verkauft.forEach(function (name) { haltezeiten.push({ reihe: name, von: meta[name].seitTag, bis: d, ende: 'verkauf' }); delete meta[name]; });
        var neu = 0;
        buch.positionen.forEach(function (p4) { if (meta[p4.sym]) return; meta[p4.sym] = { seitTag: d, schluss: NaN }; neu++; zs.positionen++; });
        if (neu !== erg.gekauft.length) throw new Error('KLINKE: Zahl der Kaeufe passt nicht zum Buch');
        zs.umschichtungen++; zs.kosten += kosten; zs.volumen += erg.volumen; zs.kaeufe += neu; zs.verkaeufe += erg.verkauft.length;
        zs.teilverkaeufe += erg.teilverkauft.length; zs.aufstockungen += erg.aufgestockt.length; zs.ohneKurs += erg.fehltKurs.length;
        ziele.push(zl.ziel.join(','));
        if (!kompakt) {
          var bestand = {};
          buch.positionen.forEach(function (p6) { bestand[p6.sym] = p6.stueck; });
          umschichtungen.push({ ausfuehrungstag: tage[d], stichtag: tage[s], ziel: zl.ziel.slice(), zulaessig: zl.zulaessig, geprueft: zl.geprueft, verworfen: zl.verworfen,
            verkauft: erg.verkauft.slice(), teilverkauft: erg.teilverkauft.slice(), aufgestockt: erg.aufgestockt.slice(), gekauft: erg.gekauft.slice(), ohneKurs: erg.fehltKurs.slice(),
            depotwert: erg.depotwert, budget: erg.budget, volumen: erg.volumen, kosten: kosten, gehaltenDanach: buch.positionen.map(function (p7) { return p7.sym; }).sort(),
            bestand: bestand, bargeldDanach: buch.cash, ausschuettungHeute: bar });
        }
        if (offen) { offen.buchEnde = buchWert; offen.spyEnde = spyWert; offen.tage = d - offen.o; perioden.push(offen); }
        offen = { ausfuehrungstag: tage[d], o: d, zulaessig: zl.zulaessig, zielzahl: zl.ziel.length, buchStart: buchWert, spyStart: spyWert };
        naechste = d + HALTEN <= endTag ? d + HALTEN : -1;
      }
    }
    /* 4. Ausschuettungen gutschreiben - nach dem Handel des Tages, angelegt mit der naechsten Umschichtung */
    buch.cash += bar; zs.ausschuettungSumme += bar;
    /* 5. Massstab SPY */
    spyWert = spySchritt(D, spyK, d, startTag, mitA, adjWeg);
    /* 6. Bewertung zum Schluss mit MH.bewerte (Cent); fehlt die Zeile, gilt der letzte Schluss (nie der Einstand) */
    var schluss = {}, groesste = 0, groessteReihe = null;
    for (var b = 0; b < buch.positionen.length; b++) {
      var p5 = buch.positionen[b], m5 = meta[p5.sym], r5 = D.reihen[p5.sym], z5 = r5.zeileAm[d];
      if (z5 >= 0) m5.schluss = adjWeg ? r5.adj[z5] : r5.close[z5];
      schluss[p5.sym] = m5.schluss;
      if (p5.stueck * m5.schluss > groesste) { groesste = p5.stueck * m5.schluss; groessteReihe = p5.sym; }
    }
    var bw = MH.bewerte(buch, schluss);
    if (bw.ohneKurs.length) throw new Error('KLINKE: Position ohne Schlusskurs: ' + bw.ohneKurs.join(','));
    buchWert = bw.wert;
    if (groesste / buchWert > maxGewicht.anteil) maxGewicht = { anteil: groesste / buchWert, reihe: groessteReihe, tag: tage[d] };
    if (!kompakt) tw.push({ tag: d, buch: buchWert, spy: spyWert, bar: buch.cash });
  }
  if (offen) { offen.buchEnde = buchWert; offen.spyEnde = spyWert; offen.tage = endTag - offen.o + 1; offen.angebrochen = true; perioden.push(offen); }
  perioden.forEach(function (P) {
    P.buch = (P.buchEnde / P.buchStart - 1) * 100; P.spy = (P.spyEnde / P.spyStart - 1) * 100; P.abstand = P.buch - P.spy; delete P.o;
  });
  buch.positionen.forEach(function (p8) { haltezeiten.push({ reihe: p8.sym, von: meta[p8.sym].seitTag, bis: endTag, ende: 'offen' }); });
  zs.spyAusschuettungen = spyK.ausschuettungen; zs.spyAusschuettungSumme = spyK.summe; zs.spyRateSumme = spyK.rateSumme;
  return { startTag: startTag, endTag: endTag, modus: modus, preisweg: weg, endBuch: buchWert, endSpy: spyWert, tage: tw, perioden: perioden, umschichtungen: umschichtungen,
    ziele: ziele, zuWenigListe: zuWenigListe, reihenenden: reihenenden, zaehler: zs, positionenAmEnde: buch.positionen.length, buch: buch, maxGewicht: maxGewicht,
    haltezeiten: haltezeiten, saetzeAusserhalb: saetzeAusserhalb };
}

/** Anteil der zuWenig-Tage an den Ausfuehrungstagen (Umschichtungen + zuWenig-Tage), ZUSATZ §2.3. */
function zuWenigAnteil(zs) { var n = zs.umschichtungen + zs.zuWenigTage; return n ? zs.zuWenigTage / n : 0; }
function nichtAusfuehrbar(zs) { return zuWenigAnteil(zs) > MAX_ZUWENIG_ANTEIL; }

/* ================= Kennzahlen: Originale aus rueckblick.js ueber eine duenne Anpassung (ZUSATZ §2.1, §2.5) ================= */
/** R.kennzahlen(Q, L) liest Q.ms[L.startTag], Q.ms[L.endTag]; hier Q.ms = Zeitstempel der Kalendertage. */
function kennzahlen(D, L) { return R.kennzahlen({ ms: D.ms }, L); }
/** R.kalenderjahre(T, L) liest T.kal.tage[x.tag]; hier der Yahoo-Kalender. */
function kalenderjahre(D, L) { return R.kalenderjahre({ kal: D.kal }, L); }
var maxRueckschlag = R.maxRueckschlag, median = R.median;
/** Quantil mit linearer Interpolation (Typ 7): h = (n - 1) p. Fuer die 10-%- und 90-%-Punkte der rollierenden Fenster. */
function quantil(a, p) {
  var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length;
  if (!n) return NaN;
  var h = (n - 1) * p, lo = Math.floor(h);
  return lo + 1 < n ? s[lo] + (h - lo) * (s[lo + 1] - s[lo]) : s[lo];
}

/* ---------- t-Quantil (ZUSATZ §2.6): regularisierte unvollstaendige Betafunktion + Bisektion ---------- */
var LANCZOS = [0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313, -176.61502916214059, 12.507343278686905,
  -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7];
function lnGamma(x) {
  if (x < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * x)) - lnGamma(1 - x);
  x -= 1;
  var a = LANCZOS[0], t = x + 7.5;
  for (var i = 1; i < 9; i++) a += LANCZOS[i] / (x + i);
  return 0.5 * Math.log(2 * Math.PI) + (x + 0.5) * Math.log(t) - t + Math.log(a);
}
/** Kettenbruch der unvollstaendigen Betafunktion (modifiziertes Lentz-Verfahren). */
function betaKettenbruch(a, b, x) {
  var KLEIN = 1e-300, qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap;
  if (Math.abs(d) < KLEIN) d = KLEIN;
  d = 1 / d;
  var h = d;
  for (var m = 1; m <= 10000; m++) {
    var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < KLEIN) d = KLEIN;
    c = 1 + aa / c; if (Math.abs(c) < KLEIN) c = KLEIN;
    d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < KLEIN) d = KLEIN;
    c = 1 + aa / c; if (Math.abs(c) < KLEIN) c = KLEIN;
    d = 1 / d;
    var del = d * c;
    h *= del;
    if (Math.abs(del - 1) < 1e-15) return h;
  }
  throw new Error('Betafunktion: Kettenbruch konvergiert nicht');
}
/** I_x(a, b), regularisiert. */
function betaRegularisiert(x, a, b) {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  var bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  if (x < (a + 1) / (a + b + 2)) return bt * betaKettenbruch(a, b, x) / a;
  return 1 - bt * betaKettenbruch(b, a, 1 - x) / b;
}
/** Verteilungsfunktion der t-Verteilung mit df Freiheitsgraden: P(T <= t). */
function tVerteilung(t, df) {
  var p = 0.5 * betaRegularisiert(df / (df + t * t), df / 2, 0.5);
  return t >= 0 ? 1 - p : p;
}
/** Quantil p (0,5 < p < 1) der t-Verteilung, Bisektion auf 200 Schritte. */
function tQuantil(p, df) {
  if (!(p > 0.5 && p < 1) || !(df > 0)) throw new Error('tQuantil: p oder df ausserhalb');
  var lo = 0, hi = 1;
  while (tVerteilung(hi, df) < p) hi *= 2;
  for (var i = 0; i < 200; i++) { var m = (lo + hi) / 2; if (tVerteilung(m, df) < p) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
/** Periodenstreuung wie R.periodenstreuung (dieselben Formeln), nur der t-Wert ist das berechnete 97,5-%-Quantil fuer n - 1. */
function periodenstreuung(perioden) {
  var x = perioden.map(function (P) { return P.abstand; }), n = x.length;
  if (n < 2) throw new Error('Periodenstreuung: n = ' + n);
  var mittel = x.reduce(function (a, b) { return a + b; }, 0) / n;
  var sd = Math.sqrt(x.reduce(function (a, b) { return a + (b - mittel) * (b - mittel); }, 0) / (n - 1));
  var se = sd / Math.sqrt(n), t = tQuantil(0.975, n - 1);
  var band = [mittel - t * se, mittel + t * se];
  return { n: n, mittel: mittel, standardabweichung: sd, standardfehler: se, tWert: t, freiheitsgrade: n - 1, band95: band,
    periodenVorn: x.filter(function (v) { return v > 0; }).length, schliesstNullEin: band[0] <= 0 && band[1] >= 0 };
}

/* ================= Startphasen (ZUSATZ §2.7) ================= */
function startphasen(D, erster, endTag, nPhasen, basis) {
  var aus = [];
  for (var k = 0; k < nPhasen; k++) {
    if (erster + k > endTag) throw new Error('Startphase ' + k + ' liegt hinter dem Ende');
    var o = kopie(basis); o.startTag = erster + k; o.endTag = endTag;
    var L = simuliere(D, o), kz = kennzahlen(D, L), an = zuWenigAnteil(L.zaehler);
    aus.push({ k: k, start: D.kal.tage[L.startTag], buchEnde: L.endBuch, spyEnde: L.endSpy, buchGesamt: kz.buchGesamt, spyGesamt: kz.spyGesamt, buchPa: kz.buchPa,
      spyPa: kz.spyPa, abstandPa: kz.abstandPa, schlaegt: kz.schlaegt, rueckschlagBuch: maxRueckschlag(L.tage.map(function (x) { return x.buch; })),
      maxGewicht: L.maxGewicht.anteil * 100, umschichtungen: L.zaehler.umschichtungen, zuWenigTage: L.zaehler.zuWenigTage, zuWenigAnteil: an, ziele: L.ziele });
  }
  var ab = aus.map(function (a) { return a.abstandPa; }), rs = aus.map(function (a) { return a.rueckschlagBuch; });
  return { phasen: aus, abstaende: ab, minimum: Math.min.apply(null, ab), median: median(ab), maximum: Math.max.apply(null, ab),
    vorn: aus.filter(function (a) { return a.schlaegt; }).length, anzahl: nPhasen,
    nichtAusfuehrbar: aus.some(function (a) { return a.zuWenigAnteil > MAX_ZUWENIG_ANTEIL; }),
    rueckschlagSpanne: [Math.min.apply(null, rs), Math.max.apply(null, rs)] };
}

/** Gehaltene Fonds nach jeder Umschichtung: kleinste/groesste Zahl, Haeufigkeit je Fonds (Zahl der Umschichtungen, nach denen er gehalten wird). */
function gehalteneFonds(u) {
  var h = {}, n = u.map(function (x) { x.gehaltenDanach.forEach(function (s) { h[s] = (h[s] || 0) + 1; }); return x.gehaltenDanach.length; });
  var haeufig = {};
  Object.keys(h).sort().forEach(function (s) { haeufig[s] = h[s]; });
  return { kleinste: n.length ? Math.min.apply(null, n) : null, groesste: n.length ? Math.max.apply(null, n) : null, haeufigkeit: haeufig,
    verschiedene: Object.keys(h).length };
}

/** Moegliche fehlende Quartalszahlungen gehaltener Fonds (Heuristik wie korb.js ausschuettungsLuecken; ein Hinweis, kein Befund):
 *  Reihen mit mindestens 8 Buchungstagen und Median-Abstand 80 bis 100 Kalendertagen; gemeldet wird ein Abstand ueber 150 Tage, der eine Haltezeit schneidet. */
function ausschuettungsLuecken(D, haltezeiten) {
  var jeReihe = {}, aus = [];
  haltezeiten.forEach(function (h) { (jeReihe[h.reihe] = jeReihe[h.reihe] || []).push(h); });
  Object.keys(jeReihe).forEach(function (reihe) {
    var r = D.reihen[reihe], ex = [], abst = [], i;
    for (i = 0; i < D.n; i++) if (r.nachTag[i]) ex.push(i);
    if (ex.length < 8) return;
    for (i = 1; i < ex.length; i++) abst.push((D.ms[ex[i]] - D.ms[ex[i - 1]]) / TAG_MS);
    var med = median(abst);
    if (!(med >= 80 && med <= 100)) return;
    abst.forEach(function (a, j) {
      if (!(a > 150)) return;
      jeReihe[reihe].forEach(function (h) {
        if (h.von < ex[j + 1] && h.bis > ex[j]) aus.push({ reihe: reihe, exVorher: D.kal.tage[ex[j]], exNachher: D.kal.tage[ex[j + 1]], tage: a,
          gehaltenVon: D.kal.tage[h.von], gehaltenBis: D.kal.tage[h.bis] });
      });
    });
  });
  return aus;
}

/** Ein Fenster in einem Modus: k = 0 voll, Startphasen, Periodenstreuung, Kalenderjahre und die Pflichtzeilen (ZUSATZ §3.2).
 *  opt: { von, bis (Kalender-Indizes), modus, umsatzMin, phasen (Vorgabe 63), tageswerte (Vorgabe true) } */
function messeFenster(D, opt) {
  var nP = opt.phasen == null ? PHASEN : opt.phasen, tage = D.kal.tage;
  var basis = { startTag: opt.von, endTag: opt.bis, modus: opt.modus || 'kandidat', umsatzMin: opt.umsatzMin == null ? null : opt.umsatzMin, preisweg: 'haupt' };
  var L = simuliere(D, basis), kz = kennzahlen(D, L);
  var SP = startphasen(D, opt.von, opt.bis, nP, basis);
  if (nP > 0 && (Math.abs(SP.phasen[0].abstandPa - kz.abstandPa) > 1e-9 || SP.phasen[0].buchEnde !== L.endBuch)) throw new Error('KLINKE: Startphase k = 0 ist nicht die Hauptzahl');
  var u = L.umschichtungen, an = zuWenigAnteil(L.zaehler);
  var barAnteil = L.tage.reduce(function (a, x) { return a + x.bar / x.buch; }, 0) / L.tage.length * 100;
  return {
    modus: basis.modus, umsatzMin: basis.umsatzMin == null ? Z.KONFIG.umsatzMin : basis.umsatzMin,
    fenster: { von: tage[opt.von], bis: tage[opt.bis], stichtag: tage[opt.von - 1], handelstage: L.tage.length, jahre: kz.jahre },
    haupt: { buchEnde: kz.buchEnde, spyEnde: kz.spyEnde, buchGesamt: kz.buchGesamt, spyGesamt: kz.spyGesamt, buchPa: kz.buchPa, spyPa: kz.spyPa,
      abstandPa: kz.abstandPa, schlaegt: kz.schlaegt, rueckschlagBuch: maxRueckschlag(L.tage.map(function (x) { return x.buch; })),
      rueckschlagSpy: maxRueckschlag(L.tage.map(function (x) { return x.spy; })), umschichtungen: L.zaehler.umschichtungen, zuWenigTage: L.zaehler.zuWenigTage,
      zuWenigListe: L.zuWenigListe, ausfuehrungstage: L.zaehler.umschichtungen + L.zaehler.zuWenigTage, zuWenigAnteil: an, kostenGezahlt: L.zaehler.kosten,
      volumen: L.zaehler.volumen, kaeufe: L.zaehler.kaeufe, verkaeufe: L.zaehler.verkaeufe, teilverkaeufe: L.zaehler.teilverkaeufe, aufstockungen: L.zaehler.aufstockungen,
      ohneKursBeiUmschichtung: L.zaehler.ohneKurs, lueckentage: L.zaehler.lueckentage, positionenAmEnde: L.positionenAmEnde, bargeldanteilMittel: barAnteil,
      groesstesGewicht: { prozent: L.maxGewicht.anteil * 100, reihe: L.maxGewicht.reihe, tag: L.maxGewicht.tag }, gehalten: gehalteneFonds(u),
      perioden: L.perioden.length, letztePeriodeTage: L.perioden.length ? L.perioden[L.perioden.length - 1].tage : null, reihenenden: L.reihenenden },
    ausschuettungen: { gebucht: L.zaehler.ausschuettungen, summeBuch: L.zaehler.ausschuettungSumme, mehrfachAmExTag: L.zaehler.mehrfachAmExTag,
      groessterSatzProzent: L.zaehler.maxSatz * 100, saetzeAusserhalb: L.saetzeAusserhalb, moeglicheLuecken: ausschuettungsLuecken(D, L.haltezeiten),
      spyGebucht: L.zaehler.spyAusschuettungen, spyRateSumme: L.zaehler.spyRateSumme, summeSpy: L.zaehler.spyAusschuettungSumme },
    startphasen: SP,
    periodenstreuung: L.perioden.length >= 2 ? periodenstreuung(L.perioden) : null,
    kalenderjahre: kalenderjahre(D, L),
    perioden: L.perioden,
    umschichtungen: u,
    tageswerte: opt.tageswerte === false ? null : L.tage.map(function (x) { return [tage[x.tag], x.buch, x.spy, x.bar]; }),
    nichtAusfuehrbar: an > MAX_ZUWENIG_ANTEIL || SP.nichtAusfuehrbar,
  };
}

/** Kandidat gegen Placebo je Startphase: vorn = Endwert Kandidat > Endwert Placebo (strikt), Abstand p. a. = Differenz der Buch-p.-a.-Werte. */
function kandidatGegenPlacebo(K, P) {
  if (K.startphasen.anzahl !== P.startphasen.anzahl) throw new Error('KLINKE: ungleiche Zahl der Startphasen');
  var ph = K.startphasen.phasen.map(function (x, i) {
    var y = P.startphasen.phasen[i];
    if (y.k !== x.k || y.start !== x.start || y.spyEnde !== x.spyEnde) throw new Error('KLINKE: Startphasen von Kandidat und Placebo passen nicht zusammen');
    return { k: x.k, start: x.start, kandidatEnde: x.buchEnde, placeboEnde: y.buchEnde, vorn: x.buchEnde > y.buchEnde, abstandPa: x.buchPa - y.buchPa };
  });
  var ab = ph.map(function (p) { return p.abstandPa; });
  return { k0Vorn: K.haupt.buchEnde > P.haupt.buchEnde, k0AbstandPa: K.haupt.buchPa - P.haupt.buchPa, phasen: ph, abstaende: ab,
    vorn: ph.filter(function (p) { return p.vorn; }).length, anzahl: ph.length, median: median(ab), minimum: Math.min.apply(null, ab), maximum: Math.max.apply(null, ab) };
}

/** Gesamtertrag auf zwei Wegen fuer k = 0 (ZUSATZ §4): Hauptweg (Schluss + Ausschuettungen) und adjclose-Weg. */
function adjcloseWeg(D, von, bis, umsatzMin) {
  var aus = {}, spy = null;
  ['kandidat', 'placebo'].forEach(function (m) {
    var o = { startTag: von, endTag: bis, modus: m, umsatzMin: umsatzMin == null ? null : umsatzMin, kompakt: true };
    var Lh = simuliere(D, o), oa = kopie(o); oa.preisweg = 'adjclose';
    var La = simuliere(D, oa), kh = kennzahlen(D, Lh), ka = kennzahlen(D, La);
    if (Lh.ziele.join('|') !== La.ziele.join('|')) throw new Error('KLINKE: adjclose-Weg hat eine andere Rangbildung als der Hauptweg (' + m + ')');
    aus[m] = { haupt: { buchEnde: kh.buchEnde, spyEnde: kh.spyEnde, buchPa: kh.buchPa, spyPa: kh.spyPa, abstandPa: kh.abstandPa },
      adjclose: { buchEnde: ka.buchEnde, spyEnde: ka.spyEnde, buchPa: ka.buchPa, spyPa: ka.spyPa, abstandPa: ka.abstandPa },
      unterschied: { buchEndeDollar: ka.buchEnde - kh.buchEnde, spyEndeDollar: ka.spyEnde - kh.spyEnde, buchPaPp: ka.buchPa - kh.buchPa, spyPaPp: ka.spyPa - kh.spyPa,
        abstandPaPp: ka.abstandPa - kh.abstandPa }, umschichtungen: Lh.zaehler.umschichtungen, gleicheZiele: true };
    if (spy && (spy.haupt !== kh.spyEnde || spy.adj !== ka.spyEnde)) throw new Error('KLINKE: SPY haengt vom Modus ab');
    spy = { haupt: kh.spyEnde, adj: ka.spyEnde };
  });
  aus.spy = { haupt: aus.kandidat.haupt.spyEnde, adjclose: aus.kandidat.adjclose.spyEnde, hauptPa: aus.kandidat.haupt.spyPa, adjclosePa: aus.kandidat.adjclose.spyPa,
    unterschiedDollar: aus.kandidat.unterschied.spyEndeDollar, unterschiedPaPp: aus.kandidat.unterschied.spyPaPp };
  return aus;
}

/* ================= Urteil (ZUSATZ §3, REGEL Teil D) ================= */
function vorn(a, b) { return a > b; }                /* "vorn" heisst strikt groesser; Gleichstand ist nicht vorn */
var ZWISCHEN = {
  '111': 'vorn (alle drei Bedingungen)',
  '101': 'k = 0 vorn, aber unter 45 Phasen',
  '100': 'k = 0 vorn, aber unter 45 Phasen und Median ≤ 0',
  '110': 'k = 0 vorn und mindestens 45 Phasen, aber Median ≤ 0',
  '011': 'Median > 0 und mindestens 45 Phasen, aber k = 0 nicht vorn',
  '001': 'Median > 0, aber k = 0 nicht vorn und unter 45 Phasen',
  '010': 'mindestens 45 Phasen, aber k = 0 nicht vorn und Median ≤ 0',
  '000': 'nicht vorn (keine der drei Bedingungen)',
};
/** Die drei Bedingungen eines Fensters: e = { k0Vorn, phasenVorn, nPhasen, median, nichtAusfuehrbar }. */
function fensterBedingungen(e) {
  if (e.nPhasen !== PHASEN) throw new Error('Urteil: ' + PHASEN + ' Startphasen erwartet, nicht ' + e.nPhasen);
  var b1 = e.k0Vorn === true, b2 = e.phasenVorn >= MIN_PHASEN_VORN, b3 = e.median > 0;
  var aus = { k0Vorn: b1, phasenVorn: e.phasenVorn, nPhasen: e.nPhasen, mindestensPhasen: b2, median: e.median, medianPositiv: b3, alleDrei: b1 && b2 && b3,
    nichtAusfuehrbar: !!e.nichtAusfuehrbar };
  aus.zwischen = aus.nichtAusfuehrbar ? 'nicht ausführbar (mehr als 5 % zuWenig-Tage)' : ZWISCHEN[(b1 ? '1' : '0') + (b2 ? '1' : '0') + (b3 ? '1' : '0')];
  return aus;
}
/** Gesamturteil. A, B: Kandidat gegen SPY je Fenster; opt.placebo = { A, B }: Kandidat gegen Placebo (dieselben drei Bedingungen);
 *  opt.datenluecke: Vermerk "Datenluecke gegen das Buch" an einem "schlaegt nicht" (REGEL C.4); opt.vermerke: weitere Vermerke. */
function urteil(A, B, opt) {
  opt = opt || {};
  var fa = fensterBedingungen(A), fb = fensterBedingungen(B), satz, zusatz;
  if (fa.nichtAusfuehrbar || fb.nichtAusfuehrbar) {
    satz = 'nicht ausführbar'; zusatz = fa.nichtAusfuehrbar && fb.nichtAusfuehrbar ? 'in beiden Fenstern' : fa.nichtAusfuehrbar ? 'Fenster A' : 'Fenster B';
  } else if (fa.alleDrei && fb.alleDrei) { satz = 'schlägt SPY'; zusatz = 'in beiden Fenstern alle drei Bedingungen'; }
  else { satz = 'schlägt nicht'; zusatz = fa.alleDrei ? 'vorn nur in Fenster A' : fb.alleDrei ? 'vorn nur in Fenster B' : 'in keinem Fenster alle drei Bedingungen'; }
  var kvp = null;
  if (opt.placebo) {
    var pa = fensterBedingungen(opt.placebo.A), pb = fensterBedingungen(opt.placebo.B);
    kvp = { A: pa, B: pb, beideFenster: pa.alleDrei && pb.alleDrei };
  }
  var vermerke = (opt.vermerke || []).slice();
  if (opt.datenluecke && satz === 'schlägt nicht') vermerke.push('Datenlücke gegen das Buch');
  var befund = satz === 'schlägt SPY' && !!(kvp && kvp.beideFenster);
  var text = satz + ' (' + zusatz + ')' + (satz === 'schlägt SPY' ? (befund ? ' — Momentum-Befund (Kandidat schlägt auch das Placebo in beiden Fenstern)'
    : ' — kein Momentum-Befund (Kandidat schlägt das Placebo nicht nach allen drei Bedingungen in beiden Fenstern)') : '');
  return { satz: satz, zusatz: zusatz, text: text, fenster: { A: fa, B: fb }, kandidatGegenPlacebo: kvp, momentumBefund: befund, vermerke: vermerke };
}

/** Die ganze Messung der Fenster A und B (Hauptrechnung, Placebo, Kandidat gegen Placebo, adjclose-Weg, Urteil). F = { A: {von, bis}, B: {von, bis} }. */
function messung(D, F, opt) {
  opt = opt || {};
  var aus = {}, fort = opt.fortschritt || function () {};
  ['A', 'B'].forEach(function (f) {
    var K = messeFenster(D, { von: F[f].von, bis: F[f].bis, modus: 'kandidat', phasen: opt.phasen }); fort(f + ' Kandidat');
    var P = messeFenster(D, { von: F[f].von, bis: F[f].bis, modus: 'placebo', phasen: opt.phasen }); fort(f + ' Placebo');
    if (K.haupt.spyEnde !== P.haupt.spyEnde) throw new Error('KLINKE: SPY von Kandidat und Placebo verschieden');
    aus[f] = { kandidat: K, placebo: P, kandidatGegenPlacebo: kandidatGegenPlacebo(K, P), adjclose: adjcloseWeg(D, F[f].von, F[f].bis, null),
      nichtAusfuehrbar: K.nichtAusfuehrbar || P.nichtAusfuehrbar };
    fort(f + ' adjclose');
  });
  var e = function (f) { var K = aus[f].kandidat; return { k0Vorn: vorn(K.haupt.buchEnde, K.haupt.spyEnde), phasenVorn: K.startphasen.vorn, nPhasen: K.startphasen.anzahl,
    median: K.startphasen.median, nichtAusfuehrbar: aus[f].nichtAusfuehrbar }; };
  var p = function (f) { var x = aus[f].kandidatGegenPlacebo; return { k0Vorn: x.k0Vorn, phasenVorn: x.vorn, nPhasen: x.anzahl, median: x.median }; };
  if ((opt.phasen == null ? PHASEN : opt.phasen) === PHASEN) aus.urteil = urteil(e('A'), e('B'), { placebo: { A: p('A'), B: p('B') }, datenluecke: opt.datenluecke, vermerke: opt.vermerke });
  return aus;
}

/* ================= Zusatz ohne Urteil (ZUSATZ §5) ================= */
/** Erster Handelstag ab `ab` (JJJJ-MM-TT), an dessen Stichtag die Zielfunktion des Laufs nicht zuWenig meldet; -1 wenn keiner. */
function langlaufStart(D, ab, umsatzMin) {
  var o = ab <= D.kal.tage[0] ? 1 : tagAb(D, ab);
  if (o < 0) return -1;
  for (o = Math.max(1, o); o < D.n; o++) if (!zielAm(D, o - 1, 'kandidat', umsatzMin).zuWenig) return o;
  return -1;
}
/** Ende eines Fuenfjahresfensters ab s: letzter Handelstag mit Datum vor Date.UTC(J + 5, M, T). */
function fuenfJahresEnde(D, s, jahre) {
  var p = D.kal.tage[s].split('-'), grenze = Date.UTC(+p[0] + (jahre || ZUSATZ5.jahre), +p[1] - 1, +p[2]);
  var lo = 0, hi = D.n;
  while (lo < hi) { var m = (lo + hi) >> 1; if (D.ms[m] < grenze) lo = m + 1; else hi = m; }
  return { ende: lo - 1, grenzeMs: grenze };
}
/** Alle rollierenden Fenster ab dem Index start: nur solche mit s + 5 Jahre <= grenzeNachDaten (siehe ZUSATZ5). */
function rollierendeFenster(D, start, grenzeNachDaten) {
  var g = tagMs(grenzeNachDaten || ZUSATZ5.grenzeNachDaten), aus = [];
  for (var s = Math.max(1, start); s < D.n; s++) {
    var f = fuenfJahresEnde(D, s);
    if (f.grenzeMs > g) break;
    aus.push({ s: s, e: f.ende });
  }
  return aus;
}
/** Kennzahlen einer Liste von Fensterpaaren: Zahl, Anteil vorn, Median, 10-%/90-%-Punkt, schlechtestes/bestes Fenster, Anteil vorn je Startjahr. */
function auswertung(liste) {
  /* liste: [{ start, ende, vorn, abstandPa }] */
  var ab = liste.map(function (x) { return x.abstandPa; }), jeJahr = {}, schlecht = null, best = null;
  liste.forEach(function (x) {
    var j = x.start.slice(0, 4);
    var e = jeJahr[j] = jeJahr[j] || { fenster: 0, vorn: 0, anteil: 0 };
    e.fenster++; if (x.vorn) e.vorn++;
    if (!schlecht || x.abstandPa < schlecht.abstandPa) schlecht = x;
    if (!best || x.abstandPa > best.abstandPa) best = x;
  });
  Object.keys(jeJahr).forEach(function (j) { jeJahr[j].anteil = jeJahr[j].vorn / jeJahr[j].fenster; });
  var nv = liste.filter(function (x) { return x.vorn; }).length;
  return { fenster: liste.length, vorn: nv, anteilVorn: liste.length ? nv / liste.length : NaN, median: median(ab), p10: quantil(ab, 0.10), p90: quantil(ab, 0.90),
    schlechtestes: schlecht, bestes: best, jeStartjahr: jeJahr };
}
/** Rollierende Fenster eines Langlaufs: je Fenster ein Nachlauf fuer Kandidat und Placebo ab 100.000 $ (kompakt). */
function rollierend(D, start, umsatzMin, opt) {
  opt = opt || {};
  var F = rollierendeFenster(D, start, opt.grenzeNachDaten), tage = D.kal.tage, zeilen = [], fort = opt.fortschritt || function () {};
  F.forEach(function (f, i) {
    var o = { startTag: f.s, endTag: f.e, modus: 'kandidat', umsatzMin: umsatzMin == null ? null : umsatzMin, kompakt: true };
    var Lk = simuliere(D, o), op = kopie(o); op.modus = 'placebo';
    var Lp = simuliere(D, op), kk = kennzahlen(D, Lk), kp = kennzahlen(D, Lp);
    if (Lk.endSpy !== Lp.endSpy) throw new Error('KLINKE: SPY von Kandidat und Placebo verschieden');
    zeilen.push({ start: tage[f.s], ende: tage[f.e], kandidatEnde: Lk.endBuch, placeboEnde: Lp.endBuch, spyEnde: Lk.endSpy, kandidatPa: kk.buchPa, placeboPa: kp.buchPa,
      spyPa: kk.spyPa, zuWenigTage: Lk.zaehler.zuWenigTage, umschichtungen: Lk.zaehler.umschichtungen });
    if ((i + 1) % 250 === 0) fort(i + 1, F.length);
  });
  var mach = function (fv, fa) { return auswertung(zeilen.map(function (z) { return { start: z.start, ende: z.ende, vorn: fv(z), abstandPa: fa(z) }; })); };
  return {
    zeilen: zeilen,
    kandidat: mach(function (z) { return z.kandidatEnde > z.spyEnde; }, function (z) { return z.kandidatPa - z.spyPa; }),
    placebo: mach(function (z) { return z.placeboEnde > z.spyEnde; }, function (z) { return z.placeboPa - z.spyPa; }),
    kandidatGegenPlacebo: mach(function (z) { return z.kandidatEnde > z.placeboEnde; }, function (z) { return z.kandidatPa - z.placeboPa; }),
    zuWenigFenster: zeilen.filter(function (z) { return z.zuWenigTage > 0; }).length,
  };
}
/** Ein Langlauf (ZUSATZ §5.1/5.2): Start wie dort bestimmt, Ende 15.09.2026; Kandidat und Placebo mit den Zeilen aus §3.2 (ohne Urteil). */
function langlauf(D, umsatzMin, opt) {
  opt = opt || {};
  var start = langlaufStart(D, opt.ab || ZUSATZ5.ab, umsatzMin), ende = D.idx[opt.ende || ZUSATZ5.ende];
  if (start < 0 || ende == null || ende < start) throw new Error('Langlauf: kein Start oder kein Ende (umsatzMin ' + umsatzMin + ')');
  var K = messeFenster(D, { von: start, bis: ende, modus: 'kandidat', umsatzMin: umsatzMin, phasen: opt.phasen, tageswerte: false });
  var P = messeFenster(D, { von: start, bis: ende, modus: 'placebo', umsatzMin: umsatzMin, phasen: opt.phasen, tageswerte: false });
  return { umsatzMin: umsatzMin == null ? Z.KONFIG.umsatzMin : umsatzMin, start: D.kal.tage[start], startIndex: start, ende: D.kal.tage[ende], kandidat: K, placebo: P,
    kandidatGegenPlacebo: kandidatGegenPlacebo(K, P) };
}

/* ================= Klinken auf den Daten (ZUSATZ §1.6, §1.9) ================= */
/** Fenster als Kalender-Indizes mit den Klinken: Stichtag = Handelstag davor, Zahl der Handelstage, A endet vor B, B endet am letzten Tag. */
function fensterIndizes(D, def) {
  def = def || FENSTER;
  var aus = {};
  ['A', 'B'].forEach(function (f) {
    var x = def[f], von = D.idx[x.von], bis = D.idx[x.bis];
    if (von == null || bis == null) throw new Error('KLINKE: Fenster ' + f + ' beginnt oder endet nicht an einem Handelstag');
    if (D.kal.tage[von - 1] !== x.stichtag) throw new Error('KLINKE: Stichtag vor Fenster ' + f + ' ist ' + D.kal.tage[von - 1] + ', nicht ' + x.stichtag);
    if (bis - von + 1 !== x.handelstage) throw new Error('KLINKE: Fenster ' + f + ' hat ' + (bis - von + 1) + ' Handelstage, nicht ' + x.handelstage);
    aus[f] = { von: von, bis: bis, handelstage: bis - von + 1, stichtag: D.kal.tage[von - 1] };
  });
  if (aus.A.bis + 1 !== aus.B.von) throw new Error('KLINKE: Fenster A endet nicht am Handelstag vor Fenster B');
  if (aus.B.bis !== D.n - 1) throw new Error('KLINKE: Fenster B endet nicht am letzten Kalendertag');
  return aus;
}
/** SPY-Ausschuettungen: Buchungstage nach dem ersten Fenstertag bis zum letzten, je Kalenderjahr, Summe der Betraege. */
function spyZaehlung(D, F) {
  var r = D.reihen[MASSSTAB], jeJahr = {}, jeFenster = { A: 0, B: 0 }, summe = { A: 0, B: 0 }, mehrfach = 0;
  for (var t = 0; t < D.n; t++) {
    var l = r.nachTag[t];
    if (!l) continue;
    var j = D.kal.tage[t].slice(0, 4);
    jeJahr[j] = (jeJahr[j] || 0) + l.length;
    if (l.length > 1) mehrfach++;
    ['A', 'B'].forEach(function (f) { if (F[f] && t > F[f].von && t <= F[f].bis) { jeFenster[f] += l.length; l.forEach(function (b) { summe[f] += b; }); } });
  }
  return { jeJahr: jeJahr, jeFenster: jeFenster, summe: summe, mehrfachAmExTag: mehrfach };
}
/** SPY allein (Pflichtpruefung): Kauf zum Schluss oder zur Eroeffnung von `von`, Wiederanlage am Ex-Tag zum Schluss (spySchritt des Nachlaufs), bis `bis`. */
function spyNachlauf(D, von, bis, kauf) {
  var k, r = D.reihen[MASSSTAB], w = NaN, d;
  if (kauf === 'schluss') {
    var z = r.zeileAm[von];
    k = { stueck: START / r.close[z], schluss: r.close[z], ausschuettungen: 0, summe: 0, rateSumme: 0 };
    for (d = von + 1; d <= bis; d++) w = spySchritt(D, k, d, von, true, false);
  } else {
    k = spyKonto(D, von, false);
    for (d = von; d <= bis; d++) w = spySchritt(D, k, d, von, true, false);
  }
  return { ende: w, gesamt: (w / START - 1) * 100, ausschuettungen: k.ausschuettungen, rateSumme: k.rateSumme };
}
/** Pflichtpruefung (ZUSATZ §1.9 (i)-(iv)) - nur SPY, kein Buch. */
function pflichtpruefung(D, P) {
  P = P || PFLICHT;
  var idx = function (t) { var i = D.idx[t]; if (i == null) throw new Error('KLINKE: ' + t + ' ist kein Handelstag'); return i; };
  var aus = {}, ok = true;
  ['i', 'ii', 'iii'].forEach(function (n) {
    var x = P[n], e = spyNachlauf(D, idx(x.von), idx(x.bis), x.kauf);
    var soll = x.sollGesamt != null ? x.sollGesamt : (x.sollEnde / START - 1) * 100;
    var abw = e.gesamt - soll, b = Math.abs(abw) <= P.toleranzPp;
    aus[n] = { von: x.von, bis: x.bis, kauf: x.kauf, istEnde: e.ende, sollEnde: x.sollEnde == null ? null : x.sollEnde, istGesamt: e.gesamt, sollGesamt: soll,
      abweichungPp: abw, toleranzPp: P.toleranzPp, ausschuettungen: e.ausschuettungen, rateSumme: e.rateSumme, bestanden: b };
    if (!b) ok = false;
  });
  var iv = {};
  [['A', 'ii'], ['B', 'iii']].forEach(function (x) {
    var ist = aus[x[1]].rateSumme, soll = P.iv[x[0]], b = Math.abs(ist - soll) <= P.toleranzDollar;
    iv[x[0]] = { ist: ist, soll: soll, abweichung: ist - soll, toleranz: P.toleranzDollar, bestanden: b };
    if (!b) ok = false;
  });
  aus.iv = iv;
  aus.bestanden = ok;
  return aus;
}
/** Alle Klinken vor dem Lauf: Kalender, Fenster, Zeilen ohne Kalendertag, SPY-Ausschuettungen und Ergaenzung, Pflichtpruefung.
 *  Wirft bei Kalender-/Fensterfehlern; die uebrigen Befunde stehen in `fehler` (der Aufrufer bricht ab). */
function klinken(D, opt) {
  opt = opt || {};
  var def = opt.fenster || FENSTER, jahre = opt.jahre || [2017, 2025], letzter = opt.letzterTag || LETZTER_TAG;
  var F = fensterIndizes(D, def), fehler = [];
  if (D.kal.tage[D.n - 1] !== letzter) fehler.push('letzter Kalendertag ' + D.kal.tage[D.n - 1] + ' statt ' + letzter);
  var ohneKal = {}, leser = {}, aussch = {};
  Object.keys(D.reihen).forEach(function (s) {
    var r = D.reihen[s], ohneOpen = 0, ohneVol = 0, fehlend = 0;
    for (var i = 0; i < r.n; i++) { if (!(r.open[i] > 0)) ohneOpen++; if (r.volume[i] == null) ohneVol++; }
    for (var t = D.idx[r.tag[0]] == null ? 0 : D.idx[r.tag[0]]; t < D.n; t++) if (r.zeileAm[t] < 0 && D.kal.tage[t] >= r.tag[0] && D.kal.tage[t] <= r.tag[r.n - 1]) fehlend++;
    ohneKal[s] = r.ohneKalender.length;
    leser[s] = { balken: r.leser.balken, zeilen: r.n, entfallen: r.leser.entfallen, doppeltGleich: r.leser.doppeltGleich, doppeltVerschieden: r.leser.doppeltVerschieden,
      ersterTag: r.tag[0], letzterTag: r.tag[r.n - 1], splits: r.splits.length, ohneOpen: ohneOpen, ohneVolumen: ohneVol, fehlendeKalendertage: fehlend };
    aussch[s] = r.az;
  });
  if (leser[MASSSTAB].ohneOpen) fehler.push('SPY hat ' + leser[MASSSTAB].ohneOpen + ' Tage ohne Eroeffnung (Kauf des Massstabs nicht moeglich)');
  var z = spyZaehlung(D, F);
  ['A', 'B'].forEach(function (f) { if (z.jeFenster[f] !== def[f].spyAusschuettungen) fehler.push('SPY hat im Fenster ' + f + ' ' + z.jeFenster[f] + ' Ex-Tage statt ' + def[f].spyAusschuettungen); });
  for (var j = jahre[0]; j <= jahre[1]; j++) if (z.jeJahr[j] !== 4) fehler.push('SPY hat ' + j + ' nicht vier Ausschuettungen, sondern ' + z.jeJahr[j]);
  if (z.mehrfachAmExTag) fehler.push('SPY mit mehreren Saetzen an einem Ex-Tag: ' + z.mehrfachAmExTag);
  if (D.protokoll.ergaenzt + D.protokoll.schonDa !== 1) fehler.push('die SPY-Ergaenzung wurde nicht genau einmal behandelt');
  var pf = pflichtpruefung(D, opt.pflicht);
  if (!pf.bestanden) fehler.push('Pflichtpruefung verfehlt');
  return { fenster: F, kalender: { tage: D.n, erster: D.kal.tage[0], letzter: D.kal.tage[D.n - 1] }, zeilenOhneKalendertag: ohneKal, leser: leser, ausschuettungen: aussch,
    spy: { jeJahr: z.jeJahr, jeFenster: z.jeFenster, summe: z.summe, mehrfachAmExTag: z.mehrfachAmExTag, ergaenzt: D.protokoll.ergaenzt, schonDa: D.protokoll.schonDa,
      ergaenzung: SPY_ERGAENZUNG }, pflicht: pf, fehler: fehler, bestanden: fehler.length === 0 };
}

/* ================= Rohdateien laden (Pruefsummen zuerst, ZUSATZ §1.3) ================= */
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
/** Prueft eine gelesene Datei gegen ihren Eintrag in pruefsummen.json; wirft bei Abweichung. */
function pruefeDatei(sym, buf, erwartet) {
  if (!erwartet) throw new Error('KLINKE: ' + sym + ' fehlt in pruefsummen.json');
  var h = sha256(buf);
  if (h !== erwartet.sha256) throw new Error('KLINKE: SHA-256 von ' + sym + ' ist ' + h + ', erwartet ' + erwartet.sha256 + ' - Abbruch');
  if (buf.length !== erwartet.bytes) throw new Error('KLINKE: Groesse von ' + sym + ' ist ' + buf.length + ', erwartet ' + erwartet.bytes);
  return h;
}
/** Liest die zwoelf Dateien: zuerst SHA-256 und Groesse jeder Datei, dann der Leser; Zahl der Balken gegen pruefsummen.json. */
function ladeRohdateien(ordner, pruefsummen) {
  var gelesen = {}, summen = {};
  KUERZEL.forEach(function (sym) {
    var buf = fs.readFileSync(path.join(ordner, sym + '.json')), e = pruefsummen.dateien[sym];
    summen[sym] = pruefeDatei(sym, buf, e);
    var L = liesAntwort(JSON.parse(buf.toString('utf8')), sym);
    if (L.zaehler.balken !== e.zeilen) throw new Error('KLINKE: ' + sym + ' hat ' + L.zaehler.balken + ' Balken, pruefsummen.json nennt ' + e.zeilen);
    gelesen[sym] = L;
  });
  return { gelesen: gelesen, summen: summen };
}

module.exports = {
  KENNUNG: KENNUNG, REGEL_KENNUNG: REGEL_KENNUNG, FONDS: FONDS, MASSSTAB: MASSSTAB, KUERZEL: KUERZEL, START: START, KOSTEN_BP: KOSTEN_BP, HALTEN: HALTEN, PHASEN: PHASEN,
  MIN_PHASEN_VORN: MIN_PHASEN_VORN, MAX_ZUWENIG_ANTEIL: MAX_ZUWENIG_ANTEIL, ZEILEN_ROH: ZEILEN_ROH, DATEN_ORDNER: DATEN_ORDNER, LETZTER_TAG: LETZTER_TAG, FENSTER: FENSTER,
  SPY_ERGAENZUNG: SPY_ERGAENZUNG, PFLICHT: PFLICHT, ZUSATZ5: ZUSATZ5, SATZ_BEREICH: SATZ_BEREICH, REPO: REPO, HIER: HIER,
  tagNY: tagNY, tagMs: tagMs, liesAntwort: liesAntwort, mitErgaenzung: mitErgaenzung, tagAb: tagAb, baueDaten: baueDaten, endeBis: endeBis,
  ausschuettungenAm: ausschuettungenAm, rohMapAm: rohMapAm, zielAm: zielAm, kurzGrund: kurzGrund, spyKonto: spyKonto, spySchritt: spySchritt, simuliere: simuliere,
  zuWenigAnteil: zuWenigAnteil, nichtAusfuehrbar: nichtAusfuehrbar, kennzahlen: kennzahlen, kalenderjahre: kalenderjahre, maxRueckschlag: maxRueckschlag, median: median,
  quantil: quantil, lnGamma: lnGamma, betaRegularisiert: betaRegularisiert, tVerteilung: tVerteilung, tQuantil: tQuantil, periodenstreuung: periodenstreuung,
  startphasen: startphasen, gehalteneFonds: gehalteneFonds, ausschuettungsLuecken: ausschuettungsLuecken, messeFenster: messeFenster,
  kandidatGegenPlacebo: kandidatGegenPlacebo, adjcloseWeg: adjcloseWeg, vorn: vorn, fensterBedingungen: fensterBedingungen, urteil: urteil, messung: messung,
  langlaufStart: langlaufStart, fuenfJahresEnde: fuenfJahresEnde, rollierendeFenster: rollierendeFenster, auswertung: auswertung, rollierend: rollierend, langlauf: langlauf,
  fensterIndizes: fensterIndizes, spyZaehlung: spyZaehlung, spyNachlauf: spyNachlauf, pflichtpruefung: pflichtpruefung, klinken: klinken, sha256: sha256,
  pruefeDatei: pruefeDatei, ladeRohdateien: ladeRohdateien,
};
