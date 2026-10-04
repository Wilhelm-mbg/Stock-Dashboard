'use strict';
/* GEMEINSAM - Lesehilfen und die reine Zaehllogik des Trockenlaufs "Datenfundament" (Auftrag Nr. 79, 04.10.2026).
 *
 * NUR LESEN. Dieser Ordner aendert keine bestehende Datei: kein Panel, keine Tafel, keinen Leser, nichts auf E:.
 * Geschrieben wird ausschliesslich in studien/datenfundament-2026-10-04/.
 *
 * Die reinen Funktionen (kalenderAus, lebendNachMinuten, letzterMinutentag, endeEinordnen, ankerWechsel) tragen
 * die Zaehlregeln; test.js prueft sie an Kunstfaellen. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');
var ARCHIV = 'E:/Markt-Dashboard-Archiv';
var ROH = ARCHIV + '/alpaca1m';
var BER = ARCHIV + '/alpaca1m-bereinigt';
var MASSN = ARCHIV + '/alpaca-massnahmen';
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var MINUTEN = path.join(REPO, 'studien', 'vorregistrierung-2026-09-06-signale-minuten');
var GRUENDE = path.join(REPO, 'studien', 'verschwundene-gruende-2026-09-12');
var PRUEFSTAND = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
var FUNDAMENTAL = path.join(REPO, 'studien', 'fundamental-machbarkeit-2026-09-16');

var LEBEND_AB = '2026-08-17';            // Stichtag der alten Regel (lesen.js Zeile 78, universum.js Zeile 22)
var X_WERTE = [0, 5, 10, 20];            // Handelstage vor dem Ende des Archivs (Auftrag T1)
var X_TROCKENLAUF = 10;                  // Klaerung 3: Trockenlauf T2/T3 mit X = 10
var FENSTER_AUSSETZER = 60;              // Klaerung 2: letzte 60 Handelstage vor dem Ende des Archivs
var ABGANG_NACH_TAGE = 15;               // Klaerung 2: Abgangsdatum hoechstens 15 Kalendertage nach dem letzten Minutentag
var ANKER_SCHWELLE_TAGE = 3;             // Klaerung 3: Anker aendert sich um mehr als 3 Tage
var TAG = 86400000;

/* ---------- Zeit ---------- */
var ET = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
/** ET-Kalendertag eines UTC-Stempels. Nachboersliche Kerzen (19:59 ET) liegen im Winter schon am UTC-Folgetag -
 *  toISOString() waere dort einen Tag zu spaet (4.264 von 52.312 Manifest-Eintraegen enden in der UTC-Stunde 0). */
function etTag(ms) { return ET.format(new Date(ms)); }
function isoMs(iso) { return Date.parse(iso + 'T12:00:00Z'); }
/** Kalendertage von a nach b (b - a), beide ISO. */
function tageZwischen(a, b) { return Math.round((isoMs(b) - isoMs(a)) / TAG); }
function tagPlus(iso, n) { return new Date(isoMs(iso) + n * TAG).toISOString().slice(0, 10); }

/* ---------- Boersenkalender ---------- */
/** tage: sortierte ISO-Handelstage. hIdx(tag) = Zahl der Handelstage <= tag; abstand(von, bis) = Handelstage, die
 *  NACH `von` bis einschliesslich `bis` liegen (0, wenn beide am selben Handelstag enden). */
function kalenderAus(tage) {
  var idx = {};
  tage.forEach(function (t, i) { idx[t] = i; });
  function hIdx(tag) {
    var lo = 0, hi = tage.length;
    while (lo < hi) { var m = (lo + hi) >> 1; if (tage[m] <= tag) lo = m + 1; else hi = m; }
    return lo;
  }
  return { tage: tage, idx: idx, hIdx: hIdx, abstand: function (von, bis) { return hIdx(bis) - hIdx(von); } };
}
var KAL = null;
function kalender() {
  if (KAL) return KAL;
  var j = JSON.parse(fs.readFileSync(ROH + '/_kalender.json', 'utf8'));
  KAL = kalenderAus(Object.keys(j.tage).sort());
  KAL.geholt = j.geholt;
  return KAL;
}

/* ---------- Regel T1: lebend aus den Minuten ---------- */
/** lebend = letzter Minutentag liegt hoechstens X Handelstage vor dem Ende des Archivs. Ein erloschener Traeger
 *  eines wiederverwendeten Kuerzels ist nie lebend (wie lesen.js, F12). Ohne Minutentag: nicht lebend. */
function lebendNachMinuten(letzterMinutentag, ende, x, kal, erloschen) {
  if (erloschen || !letzterMinutentag) return 0;
  return kal.abstand(letzterMinutentag, ende) <= x ? 1 : 0;
}

/** Letzter (und erster) Minutentag einer Reihe aus ihren Manifest-Eintraegen.
 *  eintraege: [{jahr, erster, letzter, tage}] der Jahresdateien ihres Ordners (ms).
 *  opt.schnittMs: erloschener Traeger - nur Kerzen bis zum Schnitt gehoeren ihr; opt.abMs: ~2-Reihe - erst ab hier.
 *  Liegt eine Jahresdatei UEBER der Grenze (beide Traeger in einer Datei), sagt das Manifest den Tag nicht:
 *  `unscharf` ist dann gesetzt und der Aufrufer nimmt das Feld der Lebenszeit-Tafel. */
function letzterMinutentag(eintraege, opt) {
  opt = opt || {};
  var letzter = null, erster = null, unscharf = false, tage = 0, dateien = 0;
  (eintraege || []).forEach(function (e) {
    var a = e.erster, b = e.letzter;
    if (opt.schnittMs != null) { if (a > opt.schnittMs) return; if (b > opt.schnittMs) { unscharf = true; b = opt.schnittMs; } }
    if (opt.abMs != null) { if (b < opt.abMs) return; if (a < opt.abMs) { unscharf = true; a = opt.abMs; } }
    dateien++; tage += e.tage || 0;
    if (letzter == null || b > letzter) letzter = b;
    if (erster == null || a < erster) erster = a;
  });
  return { letzter: letzter == null ? null : etTag(letzter), erster: erster == null ? null : etTag(erster),
    letzterMs: letzter, unscharf: unscharf, minutentage: tage, dateien: dateien };
}

/** Einordnung eines Reihenendes (Klaerung 2).
 *  o: { lmt, ende, kal, polygon: [iso], tagesbalkenBisZuletzt: bool }
 *  -> gruppe 'laeuft' (Minuten bis zum Ende des Archivs) | 'frueher' (vor den letzten 60 Handelstagen)
 *     | 'abgang' (Abgangsdatum 0..15 Kalendertage nach dem letzten Minutentag)
 *     | 'luecke-der-sammlung' (kein solches Datum, kein Abgangsdatum in der Naehe, Tagesbalken bis zuletzt)
 *     | 'unklar' (keins von beiden klar). */
function endeEinordnen(o) {
  var d = o.kal.abstand(o.lmt, o.ende);
  var aus = { abstandHandelstage: d, polygonBis: null, polygonDiff: null };
  if (d === 0) { aus.gruppe = 'laeuft'; return aus; }
  var best = null, nah = null;
  (o.polygon || []).forEach(function (b) {
    if (!b) return;
    var diff = tageZwischen(o.lmt, b);
    if (diff >= 0 && diff <= ABGANG_NACH_TAGE && (!best || diff < best.diff)) best = { bis: b, diff: diff };
    if (Math.abs(diff) <= 45 && (!nah || Math.abs(diff) < Math.abs(nah.diff))) nah = { bis: b, diff: diff };
  });
  if (best) { aus.polygonBis = best.bis; aus.polygonDiff = best.diff; } else if (nah) { aus.polygonBis = nah.bis; aus.polygonDiff = nah.diff; }
  if (d > FENSTER_AUSSETZER) { aus.gruppe = 'frueher'; return aus; }
  if (best) aus.gruppe = 'abgang';
  else if (!nah && o.tagesbalkenBisZuletzt) aus.gruppe = 'luecke-der-sammlung';
  else aus.gruppe = 'unklar';
  return aus;
}

/** Aendert sich der Anker einer Zeile der Gruende-Tafel um mehr als die Schwelle? (Klaerung 3) */
function ankerWechsel(alterAnker, neuerAnker) {
  if (!alterAnker || !neuerAnker) return { diff: null, wechselt: !!(alterAnker || neuerAnker) && alterAnker !== neuerAnker };
  var diff = tageZwischen(neuerAnker, alterAnker);          // > 0: der alte Anker (Tagesbalken) liegt SPAETER
  return { diff: diff, wechselt: Math.abs(diff) > ANKER_SCHWELLE_TAGE };
}

/* ---------- Dateien lesen ---------- */
function json(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
var LZ = null, MAN = null, SYMB = null, POLY = null;
function lebenszeit() { if (!LZ) { var j = json(ROH + '/_lebenszeit.json'); LZ = { werte: j.werte || {}, stand: j.stand, minutenStand: j.minutenStand }; } return LZ; }
function symbole() { if (!SYMB) SYMB = json(ROH + '/_symbole.json'); return SYMB; }
/** Manifest des Rohearchivs: je Ordner die Jahresdateien [{jahr, erster, letzter, tage, kerzen, bytes}]. */
function manifest() {
  if (MAN) return MAN;
  var j = json(ROH + '/_manifest.json'), je = {}, n = 0;
  Object.keys(j.eintraege).forEach(function (k) {
    var e = j.eintraege[k], p = k.split('/');
    (je[p[0]] = je[p[0]] || []).push({ jahr: e.jahr, erster: e.erster, letzter: e.letzter, tage: e.tage, kerzen: e.kerzen, bytes: e.bytes });
    n++;
  });
  MAN = { stand: j.stand, dateien: n, jeOrdner: je };
  return MAN;
}
/** Polygon-Liste der nicht mehr gehandelten Kuerzel: je Kuerzel alle Abgangsdaten (`bis`). */
function polygon() {
  if (POLY) return POLY;
  var j = json(path.join(DATEN, 'massive', 'verschwundene.json')), je = {}, max = null;
  (j.eintraege || []).forEach(function (e) {
    (je[e.sym] = je[e.sym] || []).push({ bis: e.bis || null, name: e.name || null, cik: e.cik || null });
    if (e.bis && (!max || e.bis > max)) max = e.bis;
  });
  POLY = { stand: j.stand, n: (j.eintraege || []).length, je: je, letztesBis: max };
  return POLY;
}

/** Alle Aktienreihen, wie der Minuten-Leser sie fuehrt (lesen.js reihen(): CS/ADRC, mit Balken), samt der ALTEN
 *  Auskunft `lebend` und den Feldern beider Quellen. Die Reihen kommen aus dem Leser selbst, nicht nachgebaut. */
var REIHEN = null;
function reihen() {
  if (REIHEN) return REIHEN;
  var LP = require(path.join(MINUTEN, 'lesen.js'));
  var lz = lebenszeit().werte, man = manifest(), kal = kalender(), poly = polygon();
  var ende = null;
  Object.keys(man.jeOrdner).forEach(function (o) { man.jeOrdner[o].forEach(function (e) { if (ende == null || e.letzter > ende) ende = e.letzter; }); });
  var endeTag = etTag(ende);
  var aus = LP.reihen().map(function (R) {
    var e = lz[R.reihe], basis = R.reihe.replace(/~2$/, '');
    var erloschen = !!(e.wiederverwendet && e.wiederverwendet.schnitt);
    var m = letzterMinutentag(man.jeOrdner[R.ordner], { schnittMs: erloschen ? e.wiederverwendet.schnitt : null, abMs: e.zweiteReihe && e.zweiteReihe.abMs ? e.zweiteReihe.abMs : null });
    var lmt = m.letzter, quelle = 'manifest';
    if (m.unscharf || !lmt) { lmt = e.letzterMinutentag || lmt; quelle = m.unscharf ? 'lebenszeit (Datei ueber der Grenze)' : 'lebenszeit (keine Datei)'; }
    return { reihe: R.reihe, basis: basis, ordner: R.ordner, art: R.art, gruppe: R.gruppe, lebendAlt: R.lebend, erloschen: erloschen ? 1 : 0,
      zweiteReihe: e.zweiteReihe ? 1 : 0,
      letzterTagesbalken: new Date(erloschen ? e.wiederverwendet.schnitt : e.letzter).toISOString().slice(0, 10),
      letzterTagesbalkenRoh: new Date(e.letzter).toISOString().slice(0, 10),
      letzterMinutentag: lmt, lmtQuelle: quelle, ersterMinutentag: m.erster || e.ersterMinutentag || null,
      lmtLebenszeit: e.letzterMinutentag || null, minutentageLebenszeit: e.minutentage || 0, minutentageManifest: m.minutentage,
      balken: e.balken, polygon: (poly.je[basis] || poly.je[basis.replace(/-/g, '.')] || []).map(function (x) { return x.bis; }).filter(Boolean).sort() };
  });
  REIHEN = { reihen: aus, ende: endeTag, endeMs: ende, kal: kal, lebenszeitStand: lebenszeit().stand, minutenStand: lebenszeit().minutenStand,
    manifestStand: man.stand, polygonStand: poly.stand, polygonLetztesBis: poly.letztesBis, ausgeschlossen: LP.reihen().ausgeschlossen };
  return REIHEN;
}

/* ---------- Massnahmen-Archiv: CUSIP, juengste Ende-Massnahme, Barpreis ---------- */
/* Woertlich die Logik aus verschwundene-gruende-2026-09-12/universum.js (Zeilen 92-110) - dort nicht exportiert,
 * weil das Skript beim Laden sofort laeuft und schreibt. Hier als Lesefunktion. */
var ENDE_ARTEN = ['name_changes', 'cash_mergers', 'stock_mergers', 'stock_and_cash_mergers', 'worthless_removals', 'redemptions'];
function massnahmen(ordner) {
  var p = path.join(MASSN, ordner.replace(/~2$/, '') + '.json');
  var aus = { cusip: null, ende: null, barpreis: null };
  var j;
  try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return aus; }
  (j.saetze || []).forEach(function (s) {
    var c = s.cusip || s.acquiree_cusip || s.new_cusip || s.old_cusip || s.source_cusip || s.target_cusip;
    if (c && !aus.cusip) aus.cusip = c;
    var ex = s.ex_date || s.process_date || s.effective_date;
    if (!ex) return;
    if (ENDE_ARTEN.indexOf(s._art) !== -1 && (!aus.ende || ex > aus.ende.ex)) {
      aus.ende = { art: s._art, ex: ex, id: s.id || null, rate: (s.rate != null ? s.rate : null),
        neuesKuerzel: s.new_symbol || s.acquirer_symbol || null };
      if ((s._art === 'cash_mergers' || s._art === 'stock_and_cash_mergers') && s.rate != null) aus.barpreis = s.rate;
      else aus.barpreis = null;
    }
  });
  return aus;
}

/* ---------- Stichproben: feste Saat ---------- */
/** Mulberry32 ueber eine Text-Saat - derselbe Aufruf zieht immer dieselben Faelle. */
function zufall(saat) {
  var h = 1779033703 ^ saat.length;
  for (var i = 0; i < saat.length; i++) { h = Math.imul(h ^ saat.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  var a = h >>> 0;
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** n Elemente ohne Zuruecklegen, Reihenfolge der Ziehung; die Liste wird vorher nach `schluessel` sortiert, damit die
 *  Ziehung nicht an der Eingangsreihenfolge haengt. */
function ziehe(liste, n, saat, schluessel) {
  var a = liste.slice().sort(function (x, y) { var p = schluessel(x), q = schluessel(y); return p < q ? -1 : p > q ? 1 : 0; });
  var r = zufall(saat), aus = [];
  while (aus.length < n && a.length) { var i = Math.floor(r() * a.length); aus.push(a[i]); a.splice(i, 1); }
  return aus;
}
function schreibe(name, obj) { var p = path.join(HIER, name); fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); return p; }

module.exports = {
  HIER: HIER, REPO: REPO, ARCHIV: ARCHIV, ROH: ROH, BER: BER, MASSN: MASSN, DATEN: DATEN, MINUTEN: MINUTEN, GRUENDE: GRUENDE, PRUEFSTAND: PRUEFSTAND,
  FUNDAMENTAL: FUNDAMENTAL, LEBEND_AB: LEBEND_AB, X_WERTE: X_WERTE, X_TROCKENLAUF: X_TROCKENLAUF, FENSTER_AUSSETZER: FENSTER_AUSSETZER,
  ABGANG_NACH_TAGE: ABGANG_NACH_TAGE, ANKER_SCHWELLE_TAGE: ANKER_SCHWELLE_TAGE,
  etTag: etTag, isoMs: isoMs, tageZwischen: tageZwischen, tagPlus: tagPlus, kalenderAus: kalenderAus, kalender: kalender,
  lebendNachMinuten: lebendNachMinuten, letzterMinutentag: letzterMinutentag, endeEinordnen: endeEinordnen, ankerWechsel: ankerWechsel,
  json: json, lebenszeit: lebenszeit, symbole: symbole, manifest: manifest, polygon: polygon, reihen: reihen,
  massnahmen: massnahmen, ENDE_ARTEN: ENDE_ARTEN,
  zufall: zufall, ziehe: ziehe, schreibe: schreibe
};
