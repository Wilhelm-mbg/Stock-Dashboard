'use strict';
/* DIE TAGESABLAGE DES NACHRICHTEN-ARCHIVS (19.09.2026) - Lesen und Schreiben, ohne Electron.
 *
 * WOZU: Bis zum 19.09.2026 lagen die Schlagzeilen je Symbol als Store-Schluessel
 * (newsarchiv_<SYM>.json, [ms, Titel], gedeckelt auf 400 Eintraege, 17 Symbole). Eine
 * Messung des Nachrichten-Sentiments braucht mehr: die Klassen 1-3 des Tages-Panels
 * (rund 1.100 Werte) und KEINEN Deckel. Wilhelms Entscheid vom 19.09.2026 (Nr. 43).
 *
 * DIE FORM, nach dem Muster des Live-Sammlers (liveablage.js): je Symbol und Jahr eine
 * Datei mit JSON-Zeilen, nur angehaengt, nie umgeschrieben:
 *
 *   <Daten>/nachrichten/<SYM>/<jahr>.jsonl
 *   [1789000000000,"Titel der Meldung"]     <- je Schlagzeile eine Zeile
 *
 * Das Jahr ist das der Meldung (pubDate), nicht das des Abrufs. Es gibt keinen Kopf:
 * das Symbol steht im Ordner, das Jahr im Dateinamen.
 *
 * DOPPELTE: derselbe Artikel taucht bei jedem Abruf wieder auf, der Zeitstempel
 * schwankt dabei manchmal um Minuten. Doppelt ist deshalb, was denselben Titel traegt
 * und weniger als einen Tag vom bekannten Stempel entfernt liegt; derselbe Titel Tage
 * spaeter (Serien wie "Stock Market Today") ist eine neue Meldung. Bekannt sind je
 * Symbol die juengsten Eintraege - einmal aus den letzten beiden Jahresdateien
 * geladen, danach im Speicher weitergefuehrt.
 * ponytail: das Erinnerungsfenster hat 400 Titel je Symbol, aeltere Doppelte fallen
 * durch; Ausbau, wenn die Quelle je Abruf mehr als ein paar Dutzend Meldungen liefert.
 *
 * ALLES ASYNCHRON ueber fs.promises - nichts hiervon darf den Hauptprozess-Faden
 * halten (Fehlerform 08.09.2026: die Dauer im Log war eine Blockade der Oberflaeche).
 *
 * DAS UNIVERSUM kommt aus <Daten>/nachrichten-universum.json (tools/nachrichten-
 * universum.js schreibt sie aus dem Tages-Panel). Fehlt die Datei, liefert
 * universumLesen null und der Aufrufer nimmt seine alte Liste - ein Rueckfall, nie
 * ein Fehler.
 *
 * MIGRATION: die alten Store-Schluessel werden einmal in die Jahresdateien
 * uebernommen und danach nicht mehr beschrieben; gelesen werden koennen sie weiter.
 *
 * Kein Netz, kein Schluessel, kein Electron. test-v6.js Abschnitt 90 prueft die Regeln.
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var fsp = fs.promises;

var ORDNER = 'nachrichten';
var UNIVERSUM_DATEI = 'nachrichten-universum.json';
var FENSTER = 400;                 /* Titel je Symbol, die als bekannt gelten */
var DOPPELT_MS = 86400000;         /* gleicher Titel innerhalb eines Tages = derselbe Artikel */
var STORE_MUSTER = /^newsarchiv_(.+)\.json$/;
var MS_MIN = Date.UTC(2000, 0, 1);  /* ein Stempel davor ist ein Parserfehler, keine Meldung */

function symOk(s) { return typeof s === 'string' && /^[A-Z0-9][A-Z0-9.\-]{0,15}$/.test(s); }
function eintragOk(e) {
  return Array.isArray(e) && e.length === 2 && typeof e[0] === 'number' && isFinite(e[0]) && e[0] >= MS_MIN &&
    typeof e[1] === 'string' && e[1].trim().length > 0;
}
function jahrVon(ms) { return new Date(ms).getUTCFullYear(); }
function pfadFuer(daten, sym, jahr) { return path.join(daten, ORDNER, sym, String(jahr) + '.jsonl'); }
function universumPfad(daten) { return path.join(daten, UNIVERSUM_DATEI); }

/* ================= Universum ================= */
/** Die Universum-Datei lesen: { kennung, stand, quelle, symbole } mit nur gueltigen,
 *  eindeutigen Symbolen - oder null (keine Datei, unlesbar, leer). Wirft nie. */
async function universumLesen(daten) {
  var j = null;
  try { j = JSON.parse(await fsp.readFile(universumPfad(daten), 'utf8')); } catch (e) { return null; }
  if (!j || typeof j !== 'object' || !Array.isArray(j.symbole)) return null;
  var gesehen = {}, symbole = [];
  j.symbole.forEach(function (s) { if (symOk(s) && !gesehen[s]) { gesehen[s] = 1; symbole.push(s); } });
  if (!symbole.length) return null;
  return { kennung: String(j.kennung || ''), stand: String(j.stand || ''), quelle: String(j.quelle || ''), symbole: symbole };
}

/* ================= Lesen ================= */
/** Zeilen einer Jahresdatei als Eintraege; unlesbare Zeilen werden uebersprungen. */
function zerlegen(text) {
  var aus = [];
  String(text || '').split('\n').forEach(function (z) {
    if (!z) return;
    var e = null;
    try { e = JSON.parse(z); } catch (err) { e = null; }
    if (eintragOk(e)) aus.push(e);
  });
  return aus;
}
/** Die Jahresdateien eines Symbols (nur ^\d{4}\.jsonl$), aufsteigend. */
async function jahresDateien(daten, sym) {
  var namen = [];
  try { namen = await fsp.readdir(path.join(daten, ORDNER, sym)); } catch (e) { return []; }
  return namen.filter(function (n) { return /^\d{4}\.jsonl$/.test(n); }).sort();
}
/** Alle Eintraege eines Symbols, ueber alle Jahre, nach Stempel sortiert. */
async function lesen(daten, sym) {
  var aus = [];
  var dateien = await jahresDateien(daten, sym);
  for (var i = 0; i < dateien.length; i++) {
    var text = '';
    try { text = await fsp.readFile(path.join(daten, ORDNER, sym, dateien[i]), 'utf8'); } catch (e) { text = ''; }
    aus = aus.concat(zerlegen(text));
  }
  return aus.sort(function (a, b) { return a[0] - b[0]; });
}
/** Die bekannten Titel eines Symbols laden: die letzten FENSTER Eintraege der
 *  juengsten beiden Jahresdateien, als Map Titel -> [Stempel...] (Einfuegereihenfolge =
 *  Alter, so faellt beim Beschneiden das Aelteste). */
async function bekanntLaden(daten, sym) {
  var m = new Map();
  var dateien = (await jahresDateien(daten, sym)).slice(-2);
  var eintraege = [];
  for (var i = 0; i < dateien.length; i++) {
    var text = '';
    try { text = await fsp.readFile(path.join(daten, ORDNER, sym, dateien[i]), 'utf8'); } catch (e) { text = ''; }
    eintraege = eintraege.concat(zerlegen(text));
  }
  eintraege.slice(-FENSTER).forEach(function (e) { merken(m, e[1].trim(), e[0]); });
  return m;
}
/** Einen Stempel zum Titel merken; der Titel wandert ans Ende der Einfuegereihenfolge. */
function merken(m, titel, ms) {
  var l = m.get(titel) || [];
  m.delete(titel);
  m.set(titel, l.concat([ms]));
}
function istDoppelt(m, titel, ms) {
  return (m.get(titel) || []).some(function (alt) { return Math.abs(alt - ms) < DOPPELT_MS; });
}
function beschneiden(m) {
  while (m.size > FENSTER) m.delete(m.keys().next().value);
}

/* ================= Anhaengen ================= */
/** Eintraege [ms, titel] an die Jahresdateien eines Symbols haengen.
 *  zustand  { bekannt: {} } - ein Objekt des Aufrufers; je Symbol die Map der
 *           bekannten Titel, beim ersten Anhang aus der Platte geladen.
 *  Nur anhaengen (appendFile), kein Umschreiben, kein Deckel. Ein Fehler ist ein
 *  Ergebnis ({ ok:false, grund }), kein Absturz des Laufs. */
async function anhaengen(daten, sym, eintraege, zustand) {
  var t0 = Date.now();
  try {
    if (!symOk(sym)) return { ok: false, grund: 'Symbol unzulaessig: ' + String(sym).slice(0, 20), ms: 0 };
    zustand = zustand || {};
    if (!zustand.bekannt) zustand.bekannt = {};
    var liste = (eintraege || []).filter(eintragOk).sort(function (a, b) { return a[0] - b[0]; });
    var verworfen = (eintraege || []).length - liste.length;
    if (!liste.length) return { ok: true, neu: 0, doppelt: 0, verworfen: verworfen, dateien: 0, ms: Date.now() - t0 };
    var bekannt = zustand.bekannt[sym];
    if (!bekannt) bekannt = zustand.bekannt[sym] = await bekanntLaden(daten, sym);
    var jeJahr = {}, neu = 0, doppelt = 0;
    liste.forEach(function (e) {
      var titel = e[1].trim();
      if (istDoppelt(bekannt, titel, e[0])) { doppelt++; return; }
      merken(bekannt, titel, e[0]);
      var j = jahrVon(e[0]);
      (jeJahr[j] = jeJahr[j] || []).push(JSON.stringify([e[0], titel]));
      neu++;
    });
    beschneiden(bekannt);
    var jahre = Object.keys(jeJahr);
    if (jahre.length) await fsp.mkdir(path.join(daten, ORDNER, sym), { recursive: true });
    for (var i = 0; i < jahre.length; i++) {
      await fsp.appendFile(pfadFuer(daten, sym, jahre[i]), jeJahr[jahre[i]].join('\n') + '\n');
    }
    return { ok: true, neu: neu, doppelt: doppelt, verworfen: verworfen, dateien: jahre.length, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, grund: 'Nachrichtenablage: ' + ((e && e.code) ? e.code + ' ' : '') + String((e && e.message) || e).slice(0, 200), ms: Date.now() - t0 };
  }
}

/* ================= Migration der Store-Schluessel ================= */
/** Alle newsarchiv_<SYM>.json aus dem Store-Ordner einmal in die Jahresdateien
 *  uebernehmen. Die Store-Dateien bleiben liegen (lesbar), werden aber nicht mehr
 *  beschrieben - das entscheidet der Aufrufer, der danach nur noch anhaengen ruft. */
async function migrieren(storeOrdner, daten, zustand) {
  var erg = { symbole: 0, uebernommen: 0, doppelt: 0, fehler: [] };
  var namen = [];
  try { namen = await fsp.readdir(storeOrdner); } catch (e) { return erg; }
  for (var i = 0; i < namen.length; i++) {
    var m = STORE_MUSTER.exec(namen[i]);
    if (!m) continue;
    var sym = m[1];
    if (!symOk(sym)) { erg.fehler.push(sym + ': Symbol unzulaessig'); continue; }
    var j = null;
    try { j = JSON.parse(await fsp.readFile(path.join(storeOrdner, namen[i]), 'utf8')); } catch (e) { erg.fehler.push(sym + ': unlesbar'); continue; }
    var r = await anhaengen(daten, sym, (j && j.items) || [], zustand);
    if (!r.ok) { erg.fehler.push(sym + ': ' + r.grund); continue; }
    erg.symbole++; erg.uebernommen += r.neu; erg.doppelt += r.doppelt;
  }
  return erg;
}

module.exports = {
  ORDNER: ORDNER, UNIVERSUM_DATEI: UNIVERSUM_DATEI, FENSTER: FENSTER, DOPPELT_MS: DOPPELT_MS,
  MS_MIN: MS_MIN, symOk: symOk, eintragOk: eintragOk, jahrVon: jahrVon, pfadFuer: pfadFuer, universumPfad: universumPfad,
  universumLesen: universumLesen, zerlegen: zerlegen, jahresDateien: jahresDateien, lesen: lesen,
  bekanntLaden: bekanntLaden, anhaengen: anhaengen, migrieren: migrieren,
};
