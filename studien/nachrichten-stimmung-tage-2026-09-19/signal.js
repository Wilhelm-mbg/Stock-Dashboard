'use strict';
/* Nachrichten-Stimmung, Tagesdesign (Nr. 45): die Signal-Definition der Vorregistrierung als Code — damit nach der
 * Freigabe nichts mehr entschieden werden muss. Hier wird NICHTS gemessen; die Funktionen laufen nur in test.js
 * auf Kunstfällen. Sie lesen keine GDELT-Daten, kein Panel, kein Netz.
 *
 * Artikel = { stempel: 'YYYYMMDDHHMMSS' (GDELT DATE, Crawl-Zeit UTC), ton: Zahl (V1.5Tone[0]) }.
 * Tag = { iso: 'YYYY-MM-DD' (Handelstag t, ET), dateien: Zahl der vorhandenen 15-min-Dateien (0..96) }.
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var KONST = require('./konstanten.js');

var etFormat = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });

/** GDELT-Stempel (UTC) -> { iso: ET-Kalendertag, uhr: 'HH:MM:SS' ET }. Intl trägt die Sommerzeit, keine Handregel. */
function stempelET(s) {
  if (!/^\d{14}$/.test(s)) throw new Error('Stempel nicht YYYYMMDDHHMMSS: ' + s);
  var ms = Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), +s.slice(8, 10), +s.slice(10, 12), +s.slice(12, 14));
  var p = {}; etFormat.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
  var h = p.hour === '24' ? '00' : p.hour;
  return { iso: p.year + '-' + p.month + '-' + p.day, uhr: h + ':' + p.minute + ':' + p.second };
}

/** Ausfalltag: im Block-Ausfall oder unter 50 % der 96 Dateien -> Signal für ALLE Symbole undefiniert. */
function tagUndefiniert(tag) {
  if (tag.iso >= KONST.BLOCK_AUSFALL[0] && tag.iso <= KONST.BLOCK_AUSFALL[1]) return 'block-ausfall';
  if (!(tag.dateien >= KONST.MIN_DATEIEN_JE_TAG)) return 'dateien<' + KONST.MIN_DATEIEN_JE_TAG;
  return null;
}

/**
 * Tages-Signal eines Symbols aus seinen Artikeln des Tages t.
 * Leck-Klinke: ein Artikel mit ET-Kalendertag NACH t ist Zukunft -> wirft (Lauf ungültig), wird nie stillschweigend gefiltert.
 * Artikel von Tag t nach 16:00:00 ET: nicht Teil des Signals (gezählt als `spaet`). Artikel VOR Tag t: fremder Tag, gezählt,
 * nicht Teil des Signals (die Ablage liefert je Tag; alles andere ist ein Zuordnungsfehler, kein Leck).
 * Rückgabe { ton: Mittel oder null, n, spaet, fremd, grund } — ton null = Signal undefiniert.
 */
function tagesSignal(artikel, tag) {
  var grund = tagUndefiniert(tag);
  var aus = { ton: null, n: 0, spaet: 0, fremd: 0, grund: grund };
  var summe = 0;
  artikel.forEach(function (a) {
    var et = stempelET(a.stempel);
    if (et.iso > tag.iso) throw new Error('Leck: Artikel mit Stempel ' + a.stempel + ' (ET ' + et.iso + ') liegt nach Signaltag ' + tag.iso);
    if (et.iso < tag.iso) { aus.fremd++; return; }
    if (et.uhr > KONST.SCHNITT_ET) { aus.spaet++; return; }
    if (typeof a.ton !== 'number' || a.ton !== a.ton) return;
    summe += a.ton; aus.n++;
  });
  if (grund) return aus;
  if (aus.n < KONST.MIN_ARTIKEL) { aus.grund = 'artikel<' + KONST.MIN_ARTIKEL; return aus; }
  aus.ton = summe / aus.n;
  return aus;
}

/**
 * Rang je Tag im Querschnitt: werte = { SYM: Zahl oder null }. Definierte Werte bekommen Rang 0 … 1 (aufsteigend,
 * (Platz − 1)/(m − 1), Gleichstände nach Symbolname wie die Maschine sortiert; m = 1 -> 0,5); undefinierte bleiben null.
 * Invariant gegen jede Niveau-Verschiebung und jede positive Skalierung — das Ton-Niveau bricht zwischen Jahren.
 */
function rangJeTag(werte) {
  var syms = Object.keys(werte).filter(function (s) { return typeof werte[s] === 'number' && werte[s] === werte[s]; })
    .sort(function (a, b) { return werte[a] - werte[b] || (a < b ? -1 : a > b ? 1 : 0); });
  var aus = {}, m = syms.length;
  Object.keys(werte).forEach(function (s) { aus[s] = null; });
  syms.forEach(function (s, i) { aus[s] = m > 1 ? i / (m - 1) : 0.5; });
  return aus;
}

/**
 * Änderung gegen das gleitende Mittel des Symbols: heute − Mittel der letzten GLEITFENSTER_TAGE definierten Tages-Töne
 * (nur Tage < t, mindestens MIN_GLEITFENSTER davon), sonst null.
 */
function aenderung(heute, vortage) {
  if (typeof heute !== 'number') return null;
  var def = vortage.filter(function (x) { return typeof x === 'number' && x === x; }).slice(-KONST.GLEITFENSTER_TAGE);
  if (def.length < KONST.MIN_GLEITFENSTER) return null;
  var m = 0; def.forEach(function (x) { m += x; });
  return heute - m / def.length;
}

/** Kosten je Umlauf je Klasse — aus EINER Stelle (konfig.js des Prüfstands), nie hier beziffert. */
function kostenJeUmlauf(klasse) { return KONST.huerdeVon(klasse); }

module.exports = { stempelET: stempelET, tagUndefiniert: tagUndefiniert, tagesSignal: tagesSignal, rangJeTag: rangJeTag, aenderung: aenderung, kostenJeUmlauf: kostenJeUmlauf };
