'use strict';
/* Pruefbericht "Lader-Stoerungen" (Oktober 2026), Teil kerzenquelle.js (Praefix KQ).
 *
 * LADER: kerzenquelle.js - Yahoo-Kerzen fuers Dateiarchiv archiv1d/60m/15m/5m/1m (Format 2,
 *        Quelle je Kerze): reiheHolen, fertigeKerze, aufGitter, rasterFilter, dochteReparieren,
 *        zusammenfuehren, satz, huelleLesen, standEintrag, sammle.
 * STAND: 61dca2c.
 * STOERUNGEN: S1 leere 200-Antwort, S2 Quote-Stempel + laufender Eimer, S3 laufender Tagesbalken,
 *        S4 Kuerzel-Neuvergabe, S5 Zwilling / meta.symbol, S6 Split zwischen zwei Abrufen,
 *        S7 erloschene Reihe sammelt flache Kerzen, S8 Zeitumstellung / 60m-Gitter, S9 Feiertag,
 *        S10 Halbtag, S11 Kursaussetzung / Phantom-Docht, S12 Ereignis ohne Kurs,
 *        dazu: abgeschnittene Archivdatei. Bericht: pruefberichte/lader-stoerungen/kerzenquelle.md
 * AUFRUF (Repo-Wurzel): node pruefberichte/lader-stoerungen/kerzenquelle.test.js [KQ-3 ...]
 *
 * Alle Antworten nachgebaut: https.get wird JE TEST durch eine zaehlende Attrappe ersetzt und im
 * finally auf die Sperrfunktion aus hilfen.js zurueckgelegt. Geschrieben wird nur in Ordner aus
 * H.tempOrdner(); vor jedem Schreiblauf wird das zugesichert. Feste Uhr ueber H.mitUhr bzw. das
 * jetzt-Argument - nie die echte Uhr. Reines Node, kein Netz, kein Electron. Alles Simulation.
 */
var H = require('./hilfen.js');   /* zuerst: Netz-, Schreibsperre, Datenordner */
var KQ = H.lade('kerzenquelle.js');
var Boerse = H.lade('boerse.js');
var fs = require('fs');
var path = require('path');
var https = require('https');

var DATEI = 'kerzenquelle.js';
function Z(anker) { return DATEI + ':' + H.zeileVon(DATEI, anker); }
function ZD(datei, anker) { return datei + ':' + H.zeileVon(datei, anker); }

/* ---------------- Zeit ---------------- */
function T(iso) { return Date.parse(iso); }                       /* ms */
function S(iso) { return Math.round(Date.parse(iso) / 1000); }    /* Sekunden wie bei Yahoo */
function iso(ms) { return new Date(ms).toISOString().replace('.000Z', 'Z'); }
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

/** meta.currentTradingPeriod.regular wie bei Yahoo (Sekunden). */
function sitzung(startIso, endeIso) {
  return { currentTradingPeriod: { regular: { start: S(startIso), end: S(endeIso), timezone: 'EDT', gmtoffset: -14400 } } };
}

/* ---------------- Datenordner: nur im Wegwerf-Ordner ---------------- */
var ZEIGER_ENV = ['MD_ARCHIV1D', 'MD_ARCHIV60M', 'MD_ARCHIV15M', 'MD_ARCHIV5M', 'MD_ARCHIV1M'];
function datenordnerImTmp(name) {
  /* Ein gesetzter MD_ARCHIV*-Zeiger gewaenne in zeigerFuer() vor dem Datenordner (kerzenquelle.js
   * zeigerFuer) - er wird fuer diesen Prozess entfernt (Wunsch an hilfen.js, siehe Bericht). */
  ZEIGER_ENV.forEach(function (e) { delete process.env[e]; });
  var d = H.tempOrdner(name);
  KQ.datenOrdnerSetzen(d);
  if (!H.imTmp(KQ.datenOrdner())) throw new Error('Datenordner nicht im Wegwerf-Ordner: ' + KQ.datenOrdner());
  ['1d', '60m', '15m', '5m', '1m'].forEach(function (iv) {
    if (!H.imTmp(KQ.ordnerVon(iv))) throw new Error('Archivordner ' + iv + ' nicht im Wegwerf-Ordner: ' + KQ.ordnerVon(iv));
  });
  return d;
}
/* Schon beim Laden: MD_DATEN zeigt (hilfen.js) in den Wegwerf-Ordner, und jeder Zeiger folgt ihm. */
ZEIGER_ENV.forEach(function (e) { delete process.env[e]; });
var DATEN_ANFANG = KQ.datenOrdner();
if (!H.imTmp(DATEN_ANFANG)) throw new Error('kerzenquelle.js Datenordner nicht im Wegwerf-Ordner: ' + DATEN_ANFANG);
['1d', '60m', '15m', '5m', '1m'].forEach(function (iv) {
  if (!H.imTmp(KQ.ordnerVon(iv))) throw new Error('Archivordner ' + iv + ' nicht im Wegwerf-Ordner: ' + KQ.ordnerVon(iv));
});

function archivOrdner(name) {
  datenordnerImTmp(name + '-daten');
  var z = H.tempOrdner(name);
  if (!H.imTmp(z)) throw new Error('Ziel nicht im Wegwerf-Ordner: ' + z);
  return z;
}

/* ---------------- Attrappe fuer https.get ---------------- */
/** antwort(url, n) -> { status, body }. Liefert, was hole() braucht: Rueckruf mit statusCode und
 *  on('data')/on('end'); die Anfrage kann on('error') und setTimeout(). Zaehlt jeden Aufruf. */
function attrappe(antwort) {
  var z = { n: 0, urls: [] };
  z.get = function (url, o, cb) {
    if (typeof o === 'function') cb = o;
    z.n++; z.urls.push(String(url));
    var a = antwort(String(url), z.n) || { status: 200, body: '' };
    var h = {};
    var res = { statusCode: a.status, on: function (ev, f) { h[ev] = f; return res; } };
    var req = { on: function () { return req; }, setTimeout: function () { return req; }, destroy: function () { } };
    setImmediate(function () { cb(res); if (a.body && h.data) h.data(a.body); if (h.end) h.end(); });
    return req;
  };
  return z;
}
async function mitAttrappe(z, fn) {
  var orig = https.get;               /* die Sperrfunktion aus hilfen.js */
  https.get = z.get;
  try { return await fn(); } finally { https.get = orig; }
}
/** Ein Sammellauf wie in main.js (sammelLauf -> Kerzen.sammle), auf fester Uhr und mit Attrappe. */
async function sammleMit(z, jetzt, opt) {
  if (!H.imTmp(opt.ziel)) throw new Error('sammle-Ziel nicht im Wegwerf-Ordner: ' + opt.ziel);
  var meldungen = [];
  var erg = await H.mitUhr(jetzt, function () {
    return mitAttrappe(z, function () {
      return KQ.sammle(Object.assign({ abstandMs: 0, mindestKerzen: 3, jetzt: jetzt, was: 'Pruefung KQ',
        melde: function (m) { meldungen.push(m); } }, opt));
    });
  });
  erg.meldungen = meldungen;
  return erg;
}
async function holeMit(z, sym, iv, jetzt) {
  return H.mitUhr(jetzt, function () {
    return mitAttrappe(z, function () { return KQ.reiheHolen(sym, iv, { mindestKerzen: 3, jetzt: jetzt }); });
  });
}

/* ---------------- Kerzen bauen ---------------- */
/** Yahoo-Zeile [tSek, o, h, l, c, v] aus ISO-Zeit und Kurs (Spanne +-0,5 %). */
function yz(isoZeit, c, v, o) {
  o = o == null ? c : o;
  return [S(isoZeit), o, Math.max(o, c) * 1.005, Math.min(o, c) * 0.995, c, v == null ? 1000 : v];
}
/** Archivkerze [ms, schluss, umsatz, hoch, tief, eroeffnung] aus einer Yahoo-Zeile. */
function ak(y) { return [y[0] * 1000, y[4], y[5], y[2], y[3], y[1]]; }
/** Tagesbalken mit Stempel 13:30 UTC (Sommerzeit) fuer eine Liste von Tagen. */
function tageszeilen(tage, kurs, stunde) {
  return tage.map(function (t, i) { return yz(t + 'T' + (stunde || '13:30') + ':00Z', typeof kurs === 'function' ? kurs(i) : kurs); });
}
function chart(zeilen, o) { return H.yahooChart(zeilen, o); }

/** Eine Archivdatei so anlegen, wie sammle() sie schreibt (satz + Quelle 'yahoo'), dazu stand.json. */
function archivAnlegen(ziel, sym, iv, serie, stand) {
  var datei = KQ.dateiFuer(sym, iv, ziel);
  if (!H.imTmp(datei)) throw new Error('Archivdatei nicht im Wegwerf-Ordner: ' + datei);
  fs.mkdirSync(path.dirname(datei), { recursive: true });
  var q = KQ.quellenVerdichten(serie, serie.map(function () { return { quelle: 'yahoo' }; }));
  fs.writeFileSync(datei, JSON.stringify(KQ.satz(sym, iv, serie, { quellen: q, waehrung: 'USD', boerse: 'NMS' })));
  if (stand) KQ.standSchreiben(ziel, stand);
  return datei;
}
function lies(datei) { return JSON.parse(fs.readFileSync(datei, 'utf8')); }

/* ================================================================ TESTS */
var tests = [];

/* ---------------------------------------------------------------- KQ-1  S1 Daten */
tests.push({
  id: 'KQ-1', stoerung: 'S1 HTTP 200 mit leerem Inhalt an einer bestehenden Reihe (result:null / ohne timestamp / leerer Koerper)', bewertung: '-',
  lauf: async function (H) {
    var ziel = archivOrdner('kq1-archiv1d');
    var alt = tageszeilen(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'], function (i) { return 50 + i; }).map(ak);
    var standVorher = { fertig: { ABC: KQ.standEintrag(null, alt, 0, '2026-09-25') }, ohne: {} };
    var datei = archivAnlegen(ziel, 'ABC', '1d', alt, standVorher);
    var vorText = fs.readFileSync(datei, 'utf8');
    var koerper = [
      '{"chart":{"result":null,"error":null}}',
      JSON.stringify({ chart: { result: [{ meta: Object.assign({ symbol: 'ABC', currency: 'USD' }, sitzung('2026-09-29T13:30:00Z', '2026-09-29T20:00:00Z')),
        indicators: { quote: [{}], adjclose: [{}] } }], error: null } }),
      ''
    ];
    var z = attrappe(function (url, n) { return { status: 200, body: koerper[n - 1] }; });
    var gruende = [], falsch = [];
    for (var i = 0; i < koerper.length; i++) {
      var erg = await sammleMit(z, T('2026-09-29T21:00:00Z'), { intervall: '1d', symbole: ['ABC'], ziel: ziel });
      var st = KQ.standLesen(ziel);
      gruende.push((st.ohne && st.ohne.ABC && st.ohne.ABC.grund) || '-');
      if (fs.readFileSync(datei, 'utf8') !== vorText) falsch.push('Form ' + (i + 1) + ': Archivdatei veraendert');
      if (JSON.stringify(st.fertig.ABC) !== JSON.stringify(standVorher.fertig.ABC)) falsch.push('Form ' + (i + 1) + ': stand.fertig fortgeschrieben');
      if (erg.ok !== 0 || erg.leer !== 1) falsch.push('Form ' + (i + 1) + ': als Erfolg gezaehlt (ok=' + erg.ok + ')');
    }
    H.betreten(z.n === 3 && gruende.every(function (g) { return g !== '-'; }), 'drei leere 200-Antworten bis in sammle() verarbeitet');
    return { abweichung: falsch.length > 0,
      text: 'leere 200-Antwort (3 Formen) -> ' + (falsch.length ? falsch.join('; ') : 'Datei bytegleich, stand.fertig (bisTag ' + standVorher.fertig.ABC.bisTag + ') unveraendert, als Fehlschlag gezaehlt') +
        '; Grund im Stand: ' + gruende.join(' | ') + ' (Soll: verwerfen, nichts fortschreiben) ' + Z("if (!z) return { fehler: 'keine Reihe' };") + ', ' + Z("stand.ohne[sym] = { grund: r.fehler, am: heuteTag() };") };
  }
});

/* ---------------------------------------------------------------- KQ-2  S1 Nachlauf */
tests.push({
  id: 'KQ-2', stoerung: 'S1 leere 200-Antwort: bleibt die Reihe danach als "ohne Daten" stehen?', bewertung: 'C',
  lauf: async function (H) {
    var ziel = archivOrdner('kq2-archiv1d');
    var tage = ['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'];
    var alt = tageszeilen(tage, 50).map(ak);
    archivAnlegen(ziel, 'ABC', '1d', alt, { fertig: { ABC: KQ.standEintrag(null, alt, 0, '2026-09-25') }, ohne: {} });
    var gut = chart(tageszeilen(tage.concat(['2026-09-28', '2026-09-29']), 50),
      { sym: 'ABC', meta: sitzung('2026-09-30T13:30:00Z', '2026-09-30T20:00:00Z') });
    var z = attrappe(function (url, n) { return { status: 200, body: n === 1 ? '{"chart":{"result":null,"error":null}}' : gut }; });
    var e1 = await sammleMit(z, T('2026-09-29T21:00:00Z'), { intervall: '1d', symbole: ['ABC'], ziel: ziel });
    var e2 = await sammleMit(z, T('2026-09-30T08:00:00Z'), { intervall: '1d', symbole: ['ABC'], ziel: ziel });
    var st = KQ.standLesen(ziel);
    var ueb = KQ.archivUeberblick(ziel);
    H.betreten(z.n === 2 && e1.leer === 1 && e2.ok === 1 && st.fertig.ABC.bisTag === '2026-09-29', 'leer, dann erfolgreich weitergerueckt');
    var bleibt = !!(st.ohne && st.ohne.ABC);
    return { abweichung: bleibt,
      text: 'Reihe ABC: Abruf 1 leer (200), Abruf 2 liefert bis 2026-09-29 (bisTag weitergerueckt). Soll: kein "ohne Daten"-Eintrag mehr fuer eine lebende Reihe. Ist: stand.ohne.ABC ' +
        (bleibt ? 'bleibt stehen (grund "' + st.ohne.ABC.grund + '", am ' + st.ohne.ABC.am + '), archivUeberblick.ohneDaten=' + ueb.ohneDaten : 'entfernt') +
        '; Erfolgszweig loescht ihn nie ' + Z('stand.fertig[sym] = standEintrag(vorher, r.serie, ohneO, heuteTag());') + ', gezaehlt ' + Z('erg.ohneDaten = Object.keys(stand.ohne || {}).length;') };
  }
});

/* ---------------------------------------------------------------- KQ-3  S2 Intraday */
tests.push({
  id: 'KQ-3', stoerung: 'S2 Quote-Stempel-Kerze (15:38:27, flach, Umsatz 0) und davor die laufende Kerze (15m und 60m)', bewertung: '-',
  lauf: async function (H) {
    var jetzt = T('2026-09-29T15:38:30Z');
    var meta = sitzung('2026-09-29T13:30:00Z', '2026-09-29T20:00:00Z');
    var z15 = [];
    for (var m = 0; m < 8; m++) z15.push(yz(iso(T('2026-09-29T13:30:00Z') + m * 900000), 100 + m * 0.1, 5000));
    z15.push(yz('2026-09-29T15:30:00Z', 101.4, 3000, 101));      /* laufender Eimer 15:30-15:45 */
    z15.push(yz('2026-09-29T15:38:27Z', 101.5, 0));               /* Quote-Stempel */
    var z60 = [];
    for (var h = 0; h < 7; h++) z60.push(yz(iso(T('2026-09-28T13:30:00Z') + h * 3600000), 99 + h * 0.1, 9000));
    z60.push(yz('2026-09-28T20:00:00Z', 99.6, 0));                 /* Schlusskerze Vortag */
    z60.push(yz('2026-09-29T13:30:00Z', 100, 9000), yz('2026-09-29T14:30:00Z', 100.5, 9000),
      yz('2026-09-29T15:30:00Z', 101.4, 3000, 101), yz('2026-09-29T15:38:27Z', 101.5, 0));
    var antworten = [chart(z15, { sym: 'XYZ', interval: '15m', meta: meta }), chart(z60, { sym: 'XYZ', interval: '60m', meta: meta })];
    var z = attrappe(function (url, n) { return { status: 200, body: antworten[n - 1] }; });
    var r15 = await holeMit(z, 'XYZ', '15m', jetzt);
    var r60 = await holeMit(z, 'XYZ', '60m', jetzt);
    H.betreten(z.n === 2 && r15.serie && r60.serie && r15.abgeschnitten > 0, 'reiheHolen hat beide Antworten zerlegt und am Ende geschnitten');
    var l15 = r15.serie[r15.serie.length - 1][0], l60 = r60.serie[r60.serie.length - 1][0];
    var ok = l15 === T('2026-09-29T15:15:00Z') && r15.abgeschnitten === 2 && l60 === T('2026-09-29T14:30:00Z') && r60.abgeschnitten === 2;
    return { abweichung: !ok,
      text: 'jetzt 15:38:30 UTC: 15m endet auf ' + iso(l15).slice(11, 16) + ' (abgeschnitten ' + r15.abgeschnitten + '), 60m auf ' + iso(l60).slice(11, 16) +
        ' (abgeschnitten ' + r60.abgeschnitten + '); Soll: Quote-Stempel UND laufender Eimer weg, letzte fertige Kerze bleibt ' +
        Z('while (serie.length && !fertigeKerze(serie[serie.length - 1][0], reg, jetzt, intervall)) {') };
  }
});

/* ---------------------------------------------------------------- KQ-4  S3 Tagesbalken */
tests.push({
  id: 'KQ-4', stoerung: 'S3 laufender Tagesbalken waehrend der Sitzung - Stempel 13:30 / Mitternacht Ortszeit / Quote-Zeit mit Sekunde 0 / ohne currentTradingPeriod', bewertung: 'B',
  lauf: async function (H) {
    var jetzt = T('2026-09-29T17:00:00Z');            /* mitten in der Sitzung 13:30-20:00 UTC */
    var meta = sitzung('2026-09-29T13:30:00Z', '2026-09-29T20:00:00Z');
    var hist = tageszeilen(['2026-09-24', '2026-09-25', '2026-09-28'], 100);
    var varianten = [
      { name: 'a 13:30 (=Sitzungsbeginn)', zeile: yz('2026-09-29T13:30:00Z', 103, 4e5, 100), meta: meta },
      { name: 'b 04:00 (Mitternacht ET)', zeile: yz('2026-09-29T04:00:00Z', 103, 4e5, 100), meta: meta },
      { name: 'c 15:38:00 (Quote-Zeit, Sekunde 0)', zeile: yz('2026-09-29T15:38:00Z', 103, 4e5, 100), meta: meta },
      { name: 'd 13:30 ohne currentTradingPeriod', zeile: yz('2026-09-29T13:30:00Z', 103, 4e5, 100), meta: {} }
    ];
    var z = attrappe(function (url, n) { var v = varianten[n - 1]; return { status: 200, body: chart(hist.concat([v.zeile]), { sym: 'XYZ', meta: v.meta }) }; });
    var behalten = [];
    for (var i = 0; i < varianten.length; i++) {
      var r = await holeMit(z, 'XYZ', '1d', jetzt);
      varianten[i].r = r;
      varianten[i].behalten = !!(r.serie && tagVon(r.serie[r.serie.length - 1][0]) === '2026-09-29');
      if (varianten[i].behalten) behalten.push(varianten[i].name);
    }
    H.betreten(z.n === 4 && varianten[0].r.serie && varianten[0].r.abgeschnitten === 1, 'Tagesregel betreten: Variante a schneidet den laufenden Balken');
    /* Folge von c am naechsten Tag: der richtige 13:30-Balken desselben Tages kommt dazu. */
    var naechster = tageszeilen(['2026-09-28', '2026-09-29', '2026-09-30'], 104).map(ak);
    var v = KQ.zusammenfuehren(varianten[2].r.serie, naechster, '1d', { sym: 'XYZ', quelleNeu: 'yahoo' });
    var am29 = v.serie.filter(function (k) { return tagVon(k[0]) === '2026-09-29'; }).length;
    return { abweichung: behalten.length > 0,
      text: 'jetzt 17:00 UTC, Sitzung bis 20:00: laufender Balken als fertig behalten bei [' + behalten.join('; ') + '], geschnitten nur bei a. ' +
        'Folge c: am Folgetag steht 2026-09-29 ' + am29 + '-mal im Archiv (Schnappschuss 15:38 + Schlussbalken 13:30). Soll: unfertig bis Sitzungsende, egal welcher Stempel. ' +
        Z('return reg && tsMs === reg.start * 1000 ? jetzt >= reg.end * 1000 : true;') + ', kein Tagesgitter ' + Z('return true;   // 1d und Unbekanntes: kein Minutengitter') };
  }
});

/* ---------------------------------------------------------------- KQ-5  S4 Kuerzel-Neuvergabe */
tests.push({
  id: 'KQ-5', stoerung: 'S4 Kuerzel-Neuvergabe: AAC gehoert jetzt einer anderen Firma (meta.firstTradeDate nach dem Ende der alten Reihe)', bewertung: 'B',
  lauf: async function (H) {
    var ziel = archivOrdner('kq5-archiv1d');
    var alt = tageszeilen(['2025-03-10', '2025-03-11', '2025-03-12', '2025-03-13', '2025-03-14'], 10.5).map(ak);
    var datei = archivAnlegen(ziel, 'AAC', '1d', alt, { fertig: { AAC: KQ.standEintrag(null, alt, 0, '2025-03-14') }, ohne: {} });
    var neu = tageszeilen(['2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-08'], 250);
    var meta = Object.assign({ firstTradeDate: S('2026-09-01T13:30:00Z'), longName: 'Neue Firma Inc.' }, sitzung('2026-09-08T13:30:00Z', '2026-09-08T20:00:00Z'));
    var z = attrappe(function () { return { status: 200, body: chart(neu, { sym: 'AAC', meta: meta }) }; });
    var erg = await sammleMit(z, T('2026-09-08T21:00:00Z'), { intervall: '1d', symbole: ['AAC'], ziel: ziel });
    var h = lies(datei);
    H.betreten(z.n === 1 && erg.ok === 1, 'sammle hat die neue Firma geholt und geschrieben');
    var ts = h.series.map(function (k) { return k[0]; });
    var iAlt = ts.indexOf(T('2025-03-14T13:30:00Z')), iNeu = ts.indexOf(T('2026-09-01T13:30:00Z'));
    var angehaengt = iAlt >= 0 && iNeu === iAlt + 1;
    var sprung = angehaengt ? h.series[iNeu][1] / h.series[iAlt][1] : null;
    var marke = h.quellen.length > 1 || Object.keys(h).some(function (k) { return /bruch|firma|erst|first/i.test(k); });
    var hinweis = erg.meldungen.some(function (m) { return m.art === 'wert' && Object.keys(m).some(function (k) { return /bruch|warn|firma/i.test(k); }); });
    return { abweichung: angehaengt && !marke && !hinweis,
      text: 'alte AAC-Reihe endet 2025-03-14 bei 10,50, Antwort mit firstTradeDate 2026-09-01 bei 250: ' +
        (angehaengt ? 'direkt angehaengt (Sprung x' + sprung.toFixed(1) + '), quellen=' + h.quellen.length + ' Bereich, keine Bruchmarke, keine Meldung' : 'nicht angehaengt') +
        '. Soll: Kerzen vor meta.firstTradeDate gehoeren nicht zu dieser Notierung - nicht anhaengen bzw. Bruch markieren. meta wird nur fuer Waehrung/Boerse gelesen ' +
        Z('var reg = res.meta && res.meta.currentTradingPeriod && res.meta.currentTradingPeriod.regular;') + ', Vereinigung ' + Z('neu.forEach(function (k) { karte[k[0]] = k; herkunft[k[0]] = neuQ; });') };
  }
});

/* ---------------------------------------------------------------- KQ-6  S5 Zwilling / meta.symbol */
tests.push({
  id: 'KQ-6', stoerung: 'S5 Zwilling: dieselbe Reihe unter zwei Kuerzeln (meta.symbol != angefragt; BRK.B und BRK-B)', bewertung: 'B',
  lauf: async function (H) {
    var ziel = archivOrdner('kq6-archiv1d');
    var zeilen = tageszeilen(['2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25', '2026-09-28'], function (i) { return 300 + i; });
    archivAnlegen(ziel, 'META', '1d', zeilen.map(ak), { fertig: {}, ohne: {} });
    var meta = sitzung('2026-09-29T13:30:00Z', '2026-09-29T20:00:00Z');
    var z = attrappe(function (url) {
      var sym = /chart\/([^?]+)/.exec(url)[1];
      return { status: 200, body: chart(zeilen, { sym: sym === 'FB' ? 'META' : sym, meta: meta }) };
    });
    var e1 = await sammleMit(z, T('2026-09-29T08:00:00Z'), { intervall: '1d', symbole: ['FB'], ziel: ziel });
    var e2 = await sammleMit(z, T('2026-09-29T08:00:00Z'), { intervall: '1d', symbole: ['BRK.B', 'BRK-B'], ziel: ziel });
    H.betreten(z.n === 3 && e1.ok === 1 && e2.ok === 2, 'drei Abrufe geschrieben');
    var fb = KQ.dateiFuer('FB', '1d', ziel), mt = KQ.dateiFuer('META', '1d', ziel);
    var a = fs.existsSync(fb) && JSON.stringify(lies(fb).series) === JSON.stringify(lies(mt).series);
    var u1 = z.urls[1].split('?')[0], u2 = z.urls[2].split('?')[0];
    var b1 = KQ.dateiFuer('BRK.B', '1d', ziel), b2 = KQ.dateiFuer('BRK-B', '1d', ziel);
    var b = u1 === u2 && fs.existsSync(b1) && fs.existsSync(b2) && JSON.stringify(lies(b1).series) === JSON.stringify(lies(b2).series);
    return { abweichung: a || b,
      text: '(a) Abruf FB, Antwort meta.symbol=META: ' + (a ? 'bars_1d_FB.json mit der META-Reihe geschrieben (Zwilling)' : 'nicht als Zwilling geschrieben') +
        '; (b) BRK.B und BRK-B fragen dieselbe URL (' + u1.replace(/^.*chart\//, '') + '): ' + (b ? 'zwei Dateien mit gleicher Reihe' : 'eine Datei') +
        '. Soll: eine Reihe je Wertpapier - meta.symbol gegen yahooName(sym) pruefen, Dateiname aus derselben Schreibweise. ' +
        Z('var z = Kurse.zerlege(r.body, { bereinigt: false, offenRoh: true });') + ', ' + Z('function yahooName(sym)') + ', ' +
        Z("return path.join(ordnerFuer(sym, ziel), dateiPraefix(intervall) + sym + '.json');") };
  }
});

/* ---------------------------------------------------------------- KQ-7  S6 Split zwischen zwei Abrufen */
tests.push({
  id: 'KQ-7', stoerung: 'S6 Split 4:1 zwischen zwei Abrufen: Yahoo liefert das 15m-Fenster rueckwirkend bereinigt, das Archiv davor roh', bewertung: 'B',
  lauf: async function (H) {
    var ziel = archivOrdner('kq7-archiv15m');
    function tag(d, kurs) { var a = []; for (var m = 0; m < 10; m++) a.push(yz(iso(T(d + 'T13:30:00Z') + m * 900000), kurs, 2000)); return a; }
    var d1 = tag('2026-07-30', 400), d2alt = tag('2026-07-31', 400);
    var alt = d1.concat(d2alt).map(ak);
    var datei = archivAnlegen(ziel, 'XYZ', '15m', alt, { fertig: { XYZ: KQ.standEintrag(null, alt, 0, '2026-07-31') }, ohne: {} });
    /* Fenster range=60d ab 2026-09-29: beginnt am 31.07.; Split am 28.09. - alles davor durch 4 geteilt. */
    var neu = tag('2026-07-31', 100).concat(tag('2026-09-29', 101));
    var z = attrappe(function () { return { status: 200, body: chart(neu, { sym: 'XYZ', interval: '15m', meta: sitzung('2026-09-29T13:30:00Z', '2026-09-29T20:00:00Z') }) }; });
    var erg = await sammleMit(z, T('2026-09-29T21:00:00Z'), { intervall: '15m', symbole: ['XYZ'], ziel: ziel });
    var h = lies(datei);
    H.betreten(z.n === 1 && erg.ok === 1 && h.series.length === 30, 'sammle hat alt (20) und neu (20, davon 10 ueberlappend) vereinigt');
    var maxF = 0, wo = null;
    for (var i = 1; i < h.series.length; i++) {
      var f = Math.max(h.series[i][1] / h.series[i - 1][1], h.series[i - 1][1] / h.series[i][1]);
      if (f > maxF) { maxF = f; wo = h.series[i][0]; }
    }
    var marke = h.quellen.length > 1 || h.bereinigt != null || Object.keys(h).some(function (k) { return /split|faktor|bereinig/i.test(k); });
    var ereignisseGefragt = /events=/.test(z.urls[0]);
    return { abweichung: maxF > 3 && !marke,
      text: 'ueberlappende Kerzen 31.07. alt 400 / neu 100 (Faktor 4,00 an 10 gleichen Stempeln): vereinigt mit Sprung x' + maxF.toFixed(2) + ' am ' + iso(wo) +
        ' (Fensterrand, kein Ereignis), quellen=' + h.quellen.length + ' Bereich, keine Bereinigungsmarke, Ereignisse ' + (ereignisseGefragt ? '' : 'nicht ') + 'abgefragt. ' +
        'Soll: konstanter Faktor an gleichen Stempeln = Bereinigung -> Altteil umrechnen oder Naht markieren, Archiv nie gemischt roh/bereinigt. ' +
        Z('neu.forEach(function (k) { karte[k[0]] = k; herkunft[k[0]] = neuQ; });') + ', URL ohne events ' + Z("encodeURIComponent(yahooName(sym)) + '?range=' + cfg.range + '&interval=' + intervall;") };
  }
});

/* ---------------------------------------------------------------- KQ-8  S7 erloschene Reihe */
tests.push({
  id: 'KQ-8', stoerung: 'S7 erloschene Reihe: je Abruf eine flache Kerze (Umsatz 0, Kurs = letzter Schluss) mit heutigem Stempel', bewertung: 'B',
  lauf: async function (H) {
    var ziel = archivOrdner('kq8-archiv1d');
    var hist = tageszeilen(['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14'], function (i) { return 20 + i * 0.1; });
    var alt = hist.map(ak);
    archivAnlegen(ziel, 'AVB', '1d', alt, { fertig: { AVB: KQ.standEintrag(null, alt, 0, '2026-08-14') }, ohne: {} });
    var letzter = hist[hist.length - 1][4];
    var laeufe = ['2026-10-01', '2026-10-02'];
    var z = attrappe(function (url, n) {
      var d = laeufe[n - 1];
      return { status: 200, body: chart(hist.concat([yz(d + 'T13:30:00Z', letzter, 0)]), { sym: 'AVB', meta: sitzung(d + 'T13:30:00Z', d + 'T20:00:00Z') }) };
    });
    var e1 = await sammleMit(z, T('2026-10-01T21:00:00Z'), { intervall: '1d', symbole: ['AVB'], ziel: ziel });
    var e2 = await sammleMit(z, T('2026-10-02T21:00:00Z'), { intervall: '1d', symbole: ['AVB'], ziel: ziel });
    H.betreten(z.n === 2 && e1.ok === 1 && e2.ok === 1, 'zwei Sammellaeufe an zwei Tagen');
    var h = lies(KQ.dateiFuer('AVB', '1d', ziel));
    var phantome = h.series.filter(function (k) { return k[0] > T('2026-08-14T23:59:59Z'); });
    var st = KQ.standLesen(ziel).fertig.AVB;
    return { abweichung: phantome.length > 0,
      text: 'letzte gehandelte Kerze 2026-08-14, zwei Laeufe: ' + phantome.length + ' Phantomtage im Archiv (' + phantome.map(function (k) { return tagVon(k[0]) + ' v=' + k[2]; }).join(', ') +
        '), stand.bisTag=' + st.bisTag + (st.versucht ? ' (versucht ' + st.versucht + ')' : ' ohne versucht-Marke') + ' - der Plan haelt die Reihe fuer lebend. ' +
        'Soll: flache Umsatz-0-Kerze nach Wochen ohne Handel ist kein Handelstag -> verwerfen, bisTag bleibt. ' +
        Z('return reg && tsMs === reg.start * 1000 ? jetzt >= reg.end * 1000 : true;') + ', ' + Z('stand.fertig[sym] = standEintrag(vorher, r.serie, ohneO, heuteTag());') };
  }
});

/* ---------------------------------------------------------------- KQ-9  S8 Zeitumstellung / 60m-Gitter */
tests.push({
  id: 'KQ-9', stoerung: 'S8 Zeitumstellung (US 01.11.2026, EU 25.10.2026) und 60m-Gitter: US auf :30, Xetra auf :00', bewertung: 'B',
  lauf: async function (H) {
    function stunden(startIso, n, kurs) { var a = []; for (var i = 0; i < n; i++) a.push(yz(iso(T(startIso) + i * 3600000), kurs + i * 0.1, 8000)); return a; }
    /* (a) US: Fr 30.10. Sommerzeit 13:30-19:30 + Schluss 20:00; Mo 02.11. Winterzeit 14:30-20:30 + Schluss 21:00 */
    var us = stunden('2026-10-30T13:30:00Z', 7, 100).concat([yz('2026-10-30T20:00:00Z', 100.7, 0)])
      .concat(stunden('2026-11-02T14:30:00Z', 7, 101)).concat([yz('2026-11-02T21:00:00Z', 101.7, 0)]);
    /* (b) Xetra: Fr 23.10. (UTC+2) 07:00-15:00, Mo 26.10. (UTC+1) 08:00-16:00 - Stundenkerzen auf :00 */
    var eu = stunden('2026-10-23T07:00:00Z', 9, 120).concat(stunden('2026-10-26T08:00:00Z', 9, 121));
    var antworten = [
      chart(us, { sym: 'AAPL', interval: '60m', gmtoffset: -18000, meta: sitzung('2026-11-02T14:30:00Z', '2026-11-02T21:00:00Z') }),
      chart(eu, { sym: 'SAP.DE', interval: '60m', gmtoffset: 3600, tz: 'Europe/Berlin', meta: { exchangeName: 'GER', currency: 'EUR',
        currentTradingPeriod: { regular: { start: S('2026-10-26T08:00:00Z'), end: S('2026-10-26T16:30:00Z'), gmtoffset: 3600 } } } })
    ];
    var z = attrappe(function (url, n) { return { status: 200, body: antworten[n - 1] }; });
    var ra = await holeMit(z, 'AAPL', '60m', T('2026-11-02T21:05:00Z'));
    var rb = await holeMit(z, 'SAP.DE', '60m', T('2026-10-26T17:00:00Z'));
    H.betreten(z.n === 2 && ra.serie && rb.serie && ra.serie.length === us.length && rb.serie.length === eu.length, 'reiheHolen liefert beide Reihen vollstaendig');
    var va = KQ.zusammenfuehren([], ra.serie, '60m', { sym: 'AAPL', quelleNeu: 'yahoo' });
    var vb = KQ.zusammenfuehren([], rb.serie, '60m', { sym: 'SAP.DE', quelleNeu: 'yahoo' });
    var aOk = va.serie.length === us.length;
    var bOk = vb.serie.length === eu.length;
    return { abweichung: !aOk || !bOk,
      text: '(a) US ueber die Umstellung: ' + va.serie.length + ' von ' + us.length + ' behalten' + (aOk ? ' (richtig)' : '') +
        '; (b) Xetra-Stundenkerzen auf :00: ' + vb.serie.length + ' von ' + eu.length + ' behalten (' + vb.serie.map(function (k) { return iso(k[0]).slice(5, 16); }).join(', ') + ')' +
        '. Soll: Gitter der Boerse folgen, alle Kerzen behalten. Minute-0-Regel nimmt je UTC-Tag nur die spaeteste ' +
        Z("var minute0Regel = intervall === '60m' && !istKryptoSym(sym);") + ', ' + Z('return spaetesteJeTag[t] === k[0];') };
  }
});

/* ---------------------------------------------------------------- KQ-10  S9 Feiertag */
tests.push({
  id: 'KQ-10', stoerung: 'S9 Boersenfeiertag 26.11.2026: flache Kerze am Feiertag, am Folgetag nicht mehr geliefert', bewertung: 'B',
  lauf: async function (H) {
    var ziel = archivOrdner('kq10-archiv1d');
    var hist = tageszeilen(['2026-11-19', '2026-11-20', '2026-11-23', '2026-11-24', '2026-11-25'], function (i) { return 50 + i * 0.2; }, '14:30');
    var alt = hist.map(ak);
    archivAnlegen(ziel, 'XYZ', '1d', alt, { fertig: { XYZ: KQ.standEintrag(null, alt, 0, '2026-11-25') }, ohne: {} });
    var feiertag = yz('2026-11-26T14:30:00Z', hist[4][4], 0);
    var halbtag = yz('2026-11-27T14:30:00Z', 51.3, 2e5, 51);
    var z = attrappe(function (url, n) {
      if (n === 1) return { status: 200, body: chart(hist.concat([feiertag]), { sym: 'XYZ', gmtoffset: -18000, meta: sitzung('2026-11-27T14:30:00Z', '2026-11-27T18:00:00Z') }) };
      return { status: 200, body: chart(hist.concat([halbtag]), { sym: 'XYZ', gmtoffset: -18000, meta: sitzung('2026-11-27T14:30:00Z', '2026-11-27T18:00:00Z') }) };
    });
    var e1 = await sammleMit(z, T('2026-11-26T21:30:00Z'), { intervall: '1d', symbole: ['XYZ'], ziel: ziel });
    var e2 = await sammleMit(z, T('2026-11-27T19:00:00Z'), { intervall: '1d', symbole: ['XYZ'], ziel: ziel });
    H.betreten(z.n === 2 && e1.ok === 1 && e2.ok === 1 && !!Boerse.feiertagAn(T('2026-11-26T14:30:00Z')) && !!Boerse.halbtagAn(T('2026-11-27T14:30:00Z')),
      'zwei Laeufe; Testdaten: 26.11. ist laut boerse.js Feiertag, 27.11. Halbtag');
    var h = lies(KQ.dateiFuer('XYZ', '1d', ziel));
    var amFeiertag = h.series.filter(function (k) { return tagVon(k[0]) === '2026-11-26'; });
    var halbtagDa = h.series.some(function (k) { return tagVon(k[0]) === '2026-11-27'; });
    return { abweichung: amFeiertag.length > 0,
      text: 'Lauf am Feiertag nimmt flache Kerze 2026-11-26 (v=0) an; Lauf am Folgetag liefert sie nicht mehr - sie ' + (amFeiertag.length ? 'bleibt dauerhaft im Archiv' : 'ist weg') +
        ' (zusammenfuehren loescht nie). Halbtag 27.11. nach 18:00 ' + (halbtagDa ? 'richtig aufgenommen' : 'fehlt') + '. Soll: keine Kerze an einem NYSE-Feiertag (boerse.js feiertagAn kennt ihn). ' +
        Z('return reg && tsMs === reg.start * 1000 ? jetzt >= reg.end * 1000 : true;') + ', ' + Z('alt.forEach(function (k, i) { karte[k[0]] = k; herkunft[k[0]] = altQ[i]; });') };
  }
});

/* ---------------------------------------------------------------- KQ-11  S10 Halbtag */
tests.push({
  id: 'KQ-11', stoerung: 'S10 halber Handelstag 27.11.2026 (Schluss 13:00 ET = 18:00 UTC): bleibt die Schlusskerze 18:00?', bewertung: 'B',
  lauf: async function (H) {
    function stunden(startIso, n, kurs) { var a = []; for (var i = 0; i < n; i++) a.push(yz(iso(T(startIso) + i * 3600000), kurs + i * 0.1, 8000)); return a; }
    var vortag = stunden('2026-11-25T14:30:00Z', 7, 100).concat([yz('2026-11-25T21:00:00Z', 100.7, 0)]);
    var halb = stunden('2026-11-27T14:30:00Z', 4, 101).concat([yz('2026-11-27T18:00:00Z', 101.35, 0)]);   /* Schlusskerze */
    var nach = [yz('2026-11-27T18:30:00Z', 101.35, 0), yz('2026-11-27T19:30:00Z', 101.35, 0)];          /* Umsatz-0-Kerzen nach dem Schluss */
    var meta = sitzung('2026-11-27T14:30:00Z', '2026-11-27T18:00:00Z');
    var antworten = [chart(vortag.concat(halb), { sym: 'XYZ', interval: '60m', gmtoffset: -18000, meta: meta }),
      chart(vortag.concat(halb, nach), { sym: 'XYZ', interval: '60m', gmtoffset: -18000, meta: meta })];
    var z = attrappe(function (url, n) { return { status: 200, body: antworten[n - 1] }; });
    var ra = await holeMit(z, 'XYZ', '60m', T('2026-11-27T18:05:00Z'));
    var rb = await holeMit(z, 'XYZ', '60m', T('2026-11-27T21:30:00Z'));
    var schluss = T('2026-11-27T18:00:00Z');
    function hat(r) { return r.serie.some(function (k) { return k[0] === schluss; }); }
    H.betreten(z.n === 2 && !!Boerse.halbtagAn(schluss) && ra.serie && rb.serie && hat(ra) && hat(rb), 'fertigeKerze laesst die Halbtags-Schlusskerze durch (Deckel reg.end); 27.11. ist laut boerse.js Halbtag');
    var va = KQ.zusammenfuehren([], ra.serie, '60m', { sym: 'XYZ', quelleNeu: 'yahoo' });
    var vb = KQ.zusammenfuehren([], rb.serie, '60m', { sym: 'XYZ', quelleNeu: 'yahoo' });
    var a = hat(va), b = hat(vb);
    return { abweichung: !a || !b,
      text: 'Schlusskerze 18:00 UTC (offizieller Halbtagsschluss): (a) ohne spaetere Kerzen ' + (a ? 'behalten' : 'VERWORFEN') +
        '; (b) mit Umsatz-0-Kerzen 18:30/19:30 desselben Tages ' + (b ? 'behalten' : 'VERWORFEN - letzte Kerze des Tages ist jetzt 19:30 v=0') +
        '. Soll: der Schlusskurs des Tages bleibt (kerzenquelle.js:359-362 sagt es selbst). Minute 0 gilt nur als spaeteste Kerze des UTC-Tages ' + Z('return spaetesteJeTag[t] === k[0];') };
  }
});

/* ---------------------------------------------------------------- KQ-12  S11 Kursaussetzung / Docht */
tests.push({
  id: 'KQ-12', stoerung: 'S11 Kursaussetzung: null-Zeilen, Umsatz-0-Kerze zum Vorkurs, Umsatz-0-Kerze mit Phantom-Docht', bewertung: 'C',
  lauf: async function (H) {
    var ziel = archivOrdner('kq12-archiv60m');
    var y = [
      yz('2026-09-29T13:30:00Z', 100, 9000),
      [S('2026-09-29T14:30:00Z'), null, null, null, null, null],               /* Aussetzung: alles null */
      [S('2026-09-29T15:30:00Z'), 100.1, 100.3, 99.9, null, 0],                /* Schluss fehlt */
      [S('2026-09-29T16:30:00Z'), 100.2, 100.2, 100.2, 100.2, 0],              /* Umsatz 0, Kurs = Vorkurs */
      yz('2026-09-29T17:30:00Z', 100.5, 7000),
      [S('2026-09-29T18:30:00Z'), 100.4, 106, 100.3, 100.4, 0],                /* Phantom-Docht: Hoch 106 ausserhalb der Tagesspanne */
      yz('2026-09-29T19:30:00Z', 100.4, 7000),
      yz('2026-09-29T20:00:00Z', 100.4, 0)
    ];
    var z = attrappe(function () { return { status: 200, body: chart(y, { sym: 'XYZ', interval: '60m', meta: sitzung('2026-09-29T13:30:00Z', '2026-09-29T20:00:00Z') }) }; });
    var erg = await sammleMit(z, T('2026-09-29T21:00:00Z'), { intervall: '60m', symbole: ['XYZ'], ziel: ziel });
    var h = lies(KQ.dateiFuer('XYZ', '60m', ziel));
    /* Positivkontrolle: dieselbe Reihe erkennt der Lader selbst als Docht. */
    var v = KQ.zusammenfuehren([], h.series, '60m', { sym: 'XYZ', quelleNeu: 'yahoo' });
    var log = fs.readFileSync(path.join(ziel, 'laeufe.log'), 'utf8');
    H.betreten(z.n === 1 && erg.ok === 1 && v.dochteErkannt === 1, 'sammle geschrieben, Docht vom Lader erkannt (dochteErkannt=1)');
    var ts = h.series.map(function (k) { return k[0]; });
    var nullWeg = ts.indexOf(T('2026-09-29T14:30:00Z')) < 0 && ts.indexOf(T('2026-09-29T15:30:00Z')) < 0;
    var vorkursDa = ts.indexOf(T('2026-09-29T16:30:00Z')) >= 0;
    var gemeldet = erg.dochte > 0 || /docht/i.test(log);
    return { abweichung: !nullWeg || !vorkursDa || !gemeldet,
      text: 'null-Zeilen ' + (nullWeg ? 'verworfen' : 'ARCHIVIERT') + ', Aussetzungskerze zum Vorkurs ' + (vorkursDa ? 'behalten' : 'verworfen') +
        ' (beides richtig); Phantom-Docht erkannt (dochteErkannt=' + v.dochteErkannt + '), aber erg.dochte=' + erg.dochte + ' und laeufe.log ohne Docht-/klasseR-Zahl. ' +
        'Soll: "wird GEZAEHLT" (kerzenquelle.js:697-700) heisst ausgewiesen. ' + Z('gereinigt: gereinigt, dochte: 0, dochteErkannt: ph.repariert, klasseR: ph.klasseR };') + ', ' +
        Z('erg.dochte += v.dochte || 0; erg.klasseR += v.klasseR || 0;') };
  }
});

/* ---------------------------------------------------------------- KQ-13  S12 Ereignis ohne Kurs */
tests.push({
  id: 'KQ-13', stoerung: 'S12 Dividende/Split als Zeile ohne Kurs (null-Werte, Stempel Mitternacht) mit events', bewertung: '-',
  lauf: async function (H) {
    var ziel = archivOrdner('kq13-archiv1d');
    var y = tageszeilen(['2026-09-21', '2026-09-22', '2026-09-23', '2026-09-24', '2026-09-25'], function (i) { return 80 + i; });
    y.splice(2, 0, [S('2026-09-23T04:00:00Z'), null, null, null, null, null]);   /* Dividende, Ex-Tag */
    y.splice(4, 0, [S('2026-09-24T04:00:00Z'), null, null, null, null, null]);   /* Split */
    var ev = { dividends: {}, splits: {} };
    ev.dividends[S('2026-09-23T04:00:00Z')] = { amount: 0.25, date: S('2026-09-23T04:00:00Z') };
    ev.splits[S('2026-09-24T04:00:00Z')] = { date: S('2026-09-24T04:00:00Z'), numerator: 2, denominator: 1, splitRatio: '2:1' };
    var z = attrappe(function () { return { status: 200, body: chart(y, { sym: 'XYZ', ereignisse: ev, meta: sitzung('2026-09-28T13:30:00Z', '2026-09-28T20:00:00Z') }) }; });
    var erg = await sammleMit(z, T('2026-09-28T08:00:00Z'), { intervall: '1d', symbole: ['XYZ'], ziel: ziel });
    var h = lies(KQ.dateiFuer('XYZ', '1d', ziel));
    H.betreten(z.n === 1 && erg.ok === 1 && y.length === 7, 'Antwort mit 7 Stempeln (2 ohne Kurs) bis ins Archiv geschrieben');
    var schlecht = h.series.filter(function (k) { return !(k[1] > 0) || k[3] == null || k[4] == null; });
    var tage = {}; h.series.forEach(function (k) { tage[tagVon(k[0])] = (tage[tagVon(k[0])] || 0) + 1; });
    var doppelt = Object.keys(tage).filter(function (t) { return tage[t] > 1; });
    return { abweichung: h.series.length !== 5 || schlecht.length > 0 || doppelt.length > 0,
      text: 'Ereigniszeilen ohne Kurs: Archiv haelt ' + h.series.length + ' von 7 Stempeln, ' + schlecht.length + ' Kerzen ohne gueltigen Kurs, doppelte Tage: ' + (doppelt.join(',') || 'keine') +
        '. Soll: Zeilen ohne Schluss verwerfen. Verworfen in kurse.js zerlege (kursOk) ' + ZD('kurse.js', 'if (!kursOk(c)) { verworfen++; continue; }') };
  }
});

/* ---------------------------------------------------------------- KQ-14  weitere: abgeschnittene Archivdatei */
tests.push({
  id: 'KQ-14', stoerung: 'weitere: vorhandene Archivdatei abgeschnitten (halber Schreibvorgang, kein gueltiges JSON)', bewertung: 'B',
  lauf: async function (H) {
    var ziel = archivOrdner('kq14-archiv60m');
    function tag(d, kurs) { var a = []; for (var i = 0; i < 7; i++) a.push(yz(iso(T(d + 'T13:30:00Z') + i * 3600000), kurs, 5000)); a.push(yz(d + 'T20:00:00Z', kurs, 0)); return a; }
    var alt = tag('2024-09-23', 40).concat(tag('2024-09-24', 41), tag('2024-09-25', 42)).map(ak);   /* aelter als das 730d-Fenster */
    var datei = archivAnlegen(ziel, 'XYZ', '60m', alt, { fertig: { XYZ: KQ.standEintrag(null, alt, 0, '2024-09-25') }, ohne: {} });
    var text = fs.readFileSync(datei, 'utf8');
    fs.writeFileSync(datei, text.slice(0, Math.floor(text.length * 0.6)));   /* Abbruch mitten im Schreiben */
    var vorher = KQ.huelleLesen(datei);                                      /* null: unlesbar */
    var neu = tag('2026-09-28', 60).concat(tag('2026-09-29', 61));
    var z = attrappe(function () { return { status: 200, body: chart(neu, { sym: 'XYZ', interval: '60m', meta: sitzung('2026-09-29T13:30:00Z', '2026-09-29T20:00:00Z') }) }; });
    var erg = await sammleMit(z, T('2026-09-29T21:00:00Z'), { intervall: '60m', symbole: ['XYZ'], ziel: ziel });
    var h = lies(datei);
    H.betreten(vorher === null && fs.existsSync(datei) && z.n === 1 && erg.verarbeitet === 1, 'Datei lag vor dem Lauf da und war unlesbar; sammle hat sie verarbeitet');
    var altDa = h.series.filter(function (k) { return k[0] < T('2025-01-01T00:00:00Z'); }).length;
    var warnung = erg.leer > 0 || erg.meldungen.some(function (m) { return m.art === 'wert' && (m.fehler || Object.keys(m).some(function (k) { return /kaputt|unlesbar|warn/i.test(k); })); });
    return { abweichung: altDa === 0 && !warnung,
      text: 'abgeschnittene Datei mit ' + alt.length + ' Kerzen 2024 (ausserhalb des Yahoo-Fensters): nach dem Lauf ' + altDa + ' davon uebrig, Datei haelt nur noch ' + h.series.length +
        ' neue Kerzen, Meldung dazu=' + erg.dazu + ' ohne Warnung. Soll: unlesbare vorhandene Datei nie ueberschreiben ("Was schon da ist, bleibt"). huelleLesen -> null ' +
        Z("try { j = JSON.parse(fs.readFileSync(datei, 'utf8')); } catch (e) { return null; }") + ', wie fehlend behandelt ' + Z('var huelle = fs.existsSync(datei) ? huelleLesen(datei) : null;') +
        ', nicht atomar geschrieben ' + Z('fs.writeFileSync(datei, JSON.stringify(') };
  }
});

/* Gemeinsamer Laeufer: kerzenquelle.js ist EIN Modul fuer alle Lader-Tests. Nach jedem Test steht
 * sein Datenordner wieder dort, wo hilfen.js ihn hingesetzt hat - die nachfolgenden Lader
 * (alpacaarchiv, sammelrunde) lesen ordnerVon() daraus. */
tests.forEach(function (t) {
  var f = t.lauf;
  t.lauf = async function (H_) { try { return await f(H_); } finally { KQ.datenOrdnerSetzen(DATEN_ANFANG); } };
});

module.exports = { lader: 'kerzenquelle.js', tests: tests };
H.allein(module);
