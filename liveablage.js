'use strict';
/* DIE TAGESABLAGE DES LIVE-SAMMLERS (09.09.2026) - Lesen und Schreiben, ohne Electron.
 *
 * DER BEFUND, AUS DEM DIESE DATEI ENTSTAND (PM, 08.09.2026, gemessen): das Fenster der
 * App stand "(Keine Rueckmeldung)" fuer rund 235 von 300 Sekunden jeder Live-Runde,
 * von 15:30 bis 02:21 Berliner Zeit, jeden Handelstag. Die Runde haengte 11.000 Kerzen
 * an 2.750 Jahresdateien an - SYNCHRON im Hauptprozess, je Datei Journal, zwei fsync,
 * Gegenlesen; auf einer Festplatte ist jeder fsync ein Kopfsprung. 148 MB in 232 s.
 * Eine Zeitangabe in einem Log ist eine Blockade der Oberflaeche, wenn der Pfad der
 * Hauptprozess ist (wiki/fehlerformen.md).
 *
 * DIE ANTWORT: die Live-Runde schreibt KEINE Jahresdatei mehr. Je Reihe gibt es eine
 * kleine TAGESABLAGE alpaca1m/<ORDNER>/_live.jsonl (JSON-Zeilen):
 *
 *   {"v":1,"reihe":"AAPL","tag":"2026-09-09"}      <- Kopf, tag = ET-Tag
 *   [1789000000000,231.5,1200,231.7,231.4,231.6]    <- je Kerze eine Zeile, dieselbe
 *   ...                                                Form wie in der Jahresdatei
 *
 * Neue Kerzen werden ANGEHAENGT (fs.promises.appendFile) - kein Journal, kein fsync.
 * Beim ersten Schreiben eines neuen ET-Tags wird die Datei ERSETZT (atomar: Zwischen-
 * datei mit Prozessnummer, dann rename). Schreiblast je Runde: ~11.000 Zeilen, rund
 * ein halbes Megabyte statt 148 MB, und nichts davon im Hauptprozess-Faden.
 *
 * DAS JAHR SCHREIBT ALLEIN DER NACHLAUF (tools/alpaca-vollsammlung.js --nachholen,
 * 23:30, mit Anhang und Journal, unveraendert). Er holt den Tag ohnehin komplett von
 * der Quelle. Die Tagesablage ist ein ZWISCHENSPEICHER FUER HEUTE, keine Archivdatei:
 * geht sie verloren oder ist sie zerrissen, fehlt nichts, was der Nachlauf nicht
 * abends holt. Sie liegt im Archivordner nur, weil der Leser sie dort neben der
 * Jahresdatei findet - additiv, mit Unterstrich wie die anderen Meta-Dateien; jede
 * Zaehlung des Archivs (Manifest, --pruefen, Lueckenliste) nimmt nur ^\d{4}\.json$.
 *
 * WO WEITERHOLEN steht in alpaca1m/_livestand.json (eine Datei, gehoert der Live-Runde):
 * je Reihe Stempel, letzte Runde, Leer-Zaehler. Beim Start der App asynchron gelesen,
 * nach jeder Runde asynchron und atomar geschrieben. Ein neuer ET-Tag laesst die
 * Stempel verfallen - die Runde holt dann ab Mitternacht ET (livesammler.startFuer
 * ohne Stempel), also vor dem Beginn jeder Sitzung.
 *
 * DER LESER (Viewer) sieht Jahresdatei-Schwanz PLUS Tagesablage: zusammengefuehrt nach
 * Stempel, bei Doppelung gewinnt die Jahresdatei (nach dem Nachlauf stehen dieselben
 * Kerzen in beiden). Eine unvollstaendige letzte Zeile wird verworfen, ein Kopf mit
 * anderem Tag als heute macht die Datei unsichtbar (das ist gestern).
 *
 * WAS HIER NICHT STEHT: kein Netz, kein Schluessel, keine Sperre (zwei Schreiber gibt
 * es hier nicht - die Runde laeuft einmal zur Zeit, und keine Datei des Nachlaufs wird
 * beruehrt), kein Electron. test-v6.js Abschnitt 88 prueft jede Regel in Node.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var fsp = fs.promises;
var A = require('./alpacaarchiv.js');

var VERSION = 1;
var DATEI = '_live.jsonl';
var STAND = '_livestand.json';
var PROTOKOLL = '_lauf.log';
var KOPF_BYTES = 256;

function zahl(v) { return typeof v === 'number' && isFinite(v); }
function kerzeOk(k) { return Array.isArray(k) && k.length === 6 && zahl(k[0]); }

/* ================= 1) Zeilen (rein) ================= */
function kopfZeile(reihe, tag) { return JSON.stringify({ v: VERSION, reihe: reihe, tag: tag }); }
function kerzenZeile(k) { return JSON.stringify(k); }
function kerzenText(kerzen) { return kerzen.map(kerzenZeile).join('\n') + '\n'; }

/** Den Text einer Tagesablage zerlegen.
 *  heuteTag  der ET-Tag, den der Leser erwartet (null: jeden Tag annehmen)
 *  Rueckgabe { ok, kopf, kerzen, verworfen: { unvollstaendig, form, doppelt }, grund }
 *  - endet der Text nicht mit "\n", ist die letzte Zeile unvollstaendig und faellt weg
 *    (ein Absturz mitten im Anhang; die Kerze kommt mit der naechsten Runde wieder);
 *  - ein Kopf mit anderem Tag -> ok:false, grund 'anderer Tag' - die Datei ist gestern;
 *  - Zeilen, die keine Kerze sind, werden gezaehlt und uebergangen;
 *  - doppelte Stempel: die erste gewinnt (wie beim Anhang der Jahresdatei). */
function zerlegen(text, heuteTag) {
  var aus = { ok: false, kopf: null, kerzen: [], verworfen: { unvollstaendig: 0, form: 0, doppelt: 0 }, grund: null };
  var t = String(text == null ? '' : text);
  if (!t) { aus.grund = 'leer'; return aus; }
  var zeilen = t.split('\n');
  /* split laesst hinter dem letzten "\n" eine leere Zeichenkette - die ist keine Zeile.
   * Fehlt das "\n", ist das letzte Stueck ein angerissener Anhang. */
  var letztes = zeilen.pop();
  if (letztes !== '') aus.verworfen.unvollstaendig = 1;
  if (!zeilen.length) { aus.grund = 'ohne Kopf'; return aus; }
  var kopf = null;
  try { kopf = JSON.parse(zeilen[0]); } catch (e) { kopf = null; }
  if (!kopf || typeof kopf !== 'object' || kopf.v !== VERSION || typeof kopf.tag !== 'string' || !kopf.reihe) {
    aus.grund = 'Kopf unlesbar'; return aus;
  }
  aus.kopf = kopf;
  if (heuteTag != null && kopf.tag !== heuteTag) { aus.grund = 'anderer Tag (' + kopf.tag + ')'; return aus; }
  var da = {};
  for (var i = 1; i < zeilen.length; i++) {
    if (!zeilen[i]) continue;
    var k = null;
    try { k = JSON.parse(zeilen[i]); } catch (e) { k = null; }
    if (!kerzeOk(k)) { aus.verworfen.form++; continue; }
    if (da[k[0]]) { aus.verworfen.doppelt++; continue; }
    da[k[0]] = 1;
    aus.kerzen.push(k);
  }
  aus.kerzen.sort(function (a, b) { return a[0] - b[0]; });
  aus.ok = true;
  return aus;
}

/** Jahresdatei-Schwanz und Tagesablage zusammenfuehren - DIE JAHRESDATEI GEWINNT: vom
 *  Tag kommt nur, was juenger ist als der letzte Stempel des Jahres. Nach dem Nachlauf
 *  stehen dieselben Kerzen in beiden; die Regel macht daraus eine Reihe ohne Doppel und
 *  ohne Ruecksprung. `jahrKerzen` muessen in Zeitfolge sein (so liest sie der Viewer). */
function zusammenfuehren(jahrKerzen, tagKerzen) {
  var a = (jahrKerzen || []).filter(kerzeOk), l = (tagKerzen || []).filter(kerzeOk);
  var jahrBis = a.length ? a[a.length - 1][0] : null;
  var neu = jahrBis == null ? l : l.filter(function (k) { return k[0] > jahrBis; });
  return { kerzen: a.concat(neu), ausJahr: a.length, ausTag: neu.length, verworfen: l.length - neu.length,
    jahrBis: jahrBis, tagBis: l.length ? l[l.length - 1][0] : null,
    bis: neu.length ? neu[neu.length - 1][0] : jahrBis };
}

/* ================= 2) Der Stand der Live-Runde (rein + Datei) ================= */
function standLeer(tag) { return { v: VERSION, tag: tag || null, stand: null, runde: null, werte: {} }; }
/** Der Stand fuer diesen ET-Tag: traegt er einen anderen Tag, VERFALLEN die Stempel
 *  (werte leer, `verfallen` nennt den alten Tag) - die Runde holt dann ab Mitternacht
 *  ET, also vor dem Beginn jeder Sitzung. Was kein Stand ist, wird ein leerer. */
function standFuerTag(stand, tag) {
  if (!stand || typeof stand !== 'object' || stand.v !== VERSION || !stand.werte || typeof stand.werte !== 'object') return standLeer(tag);
  if (stand.tag !== tag) return { v: VERSION, tag: tag, stand: stand.stand || null, runde: stand.runde || null, werte: {}, verfallen: stand.tag || null };
  return stand;
}

/* ================= 3) Orte ================= */
function pfadFuer(roh, ordner) { return path.join(roh, ordner, DATEI); }
function standPfad(roh) { return path.join(roh, STAND); }

/* ================= 4) Platte - alles ueber fs.promises ================= */
var TMP_ZAEHLER = 0;
/** Atomar schreiben wie alpacaarchiv.atomarSchreiben, nur asynchron: Zwischendatei
 *  mit Prozessnummer und Zaehler, dann rename. */
async function atomar(pfad, text) {
  await fsp.mkdir(path.dirname(pfad), { recursive: true });
  var tmp = pfad + '.tmp-' + process.pid + '-' + (++TMP_ZAEHLER);
  await fsp.writeFile(tmp, text);
  try { await fsp.rename(tmp, pfad); }
  catch (e) { try { await fsp.unlink(tmp); } catch (e2) { /* dann liegt sie da */ } throw e; }
}
/** JSON-Datei lesen; null, wenn es sie nicht gibt oder sie unlesbar ist. */
async function jsonLesen(pfad) {
  try { return JSON.parse(await fsp.readFile(pfad, 'utf8')); } catch (e) { return null; }
}
/** JSON-Datei lesen und nach Aenderungszeit MERKEN (merk: ein Objekt des Aufrufers):
 *  die Lebenszeit (2,5 MB) und die Symbol-Abbildung aendern sich selten, die Runde
 *  fragt jede fuenf Minuten - ein stat je Runde, ein Zerlegen je Aenderung. */
async function jsonGemerkt(pfad, merk) {
  merk = merk || {};
  var st = null;
  try { st = await fsp.stat(pfad); } catch (e) { st = null; }
  if (!st) { merk.pfad = pfad; merk.mtime = 0; merk.wert = null; return null; }
  if (merk.pfad === pfad && merk.mtime === st.mtimeMs && merk.wert !== undefined) return merk.wert;
  var wert = await jsonLesen(pfad);
  merk.pfad = pfad; merk.mtime = st.mtimeMs; merk.wert = wert;
  return wert;
}
/** Nur den Kopf einer Tagesablage lesen (die ersten 256 Bytes). null: keine Datei,
 *  kein Kopf, fremdes Format. */
async function kopfLesen(pfad) {
  var fh = null;
  try { fh = await fsp.open(pfad, 'r'); } catch (e) { return null; }
  try {
    var buf = Buffer.alloc(KOPF_BYTES);
    var r = await fh.read(buf, 0, KOPF_BYTES, 0);
    var s = buf.slice(0, r.bytesRead).toString('utf8');
    var i = s.indexOf('\n');
    if (i < 0) return null;
    var k = null;
    try { k = JSON.parse(s.slice(0, i)); } catch (e) { k = null; }
    return (k && typeof k === 'object' && k.v === VERSION && typeof k.tag === 'string' && k.reihe) ? k : null;
  } finally { await fh.close(); }
}
/** Kerzen an die Tagesablage haengen.
 *  pfad     <roh>/<ORDNER>/_live.jsonl
 *  reihe    die Reihe, wie sie in den Kopf gehoert
 *  tag      der ET-Tag der Runde; Kerzen eines anderen ET-Tags werden uebersprungen
 *  kerzen   [t, schluss, umsatz, hoch, tief, eroeffnung]
 *  zustand  { tagJe: {} } - ein Objekt des Aufrufers, das je Pfad den Tag der Datei
 *           merkt: der Kopf wird einmal je Reihe und Tag gelesen, nicht je Anhang.
 *  Traegt die Datei den Tag, wird angehaengt (appendFile, kein fsync). Sonst - neue
 *  Datei oder anderer Tag - wird sie ERSETZT (atomar). Ein Fehler ist ein Ergebnis
 *  ({ ok:false, grund }), kein Absturz der Runde; die Form der Rueckgabe ist die von
 *  alpacaarchiv.jahrSchreiben, damit livesammler.runde beide summieren kann. */
async function anhaengen(pfad, reihe, tag, kerzen, zustand) {
  var t0 = Date.now();
  try {
    var liste = (kerzen || []).filter(function (k) { return kerzeOk(k) && A.etTag(k[0]) === tag; })
      .sort(function (a, b) { return a[0] - b[0]; });
    var uebersprungen = (kerzen || []).length - liste.length;
    if (!liste.length) return { ok: true, geschrieben: false, art: 'anhang', neu: 0, uebersprungen: uebersprungen, letzterStempel: null, pfad: pfad, geschriebenBytes: 0, ms: Date.now() - t0 };
    zustand = zustand || {};
    if (!zustand.tagJe) zustand.tagJe = {};
    var bekannt = zustand.tagJe[pfad];
    if (bekannt !== tag) {
      var kopf = await kopfLesen(pfad);
      bekannt = kopf ? kopf.tag : null;
    }
    var text = kerzenText(liste), art, bytes;
    if (bekannt === tag) {
      await fsp.appendFile(pfad, text);
      art = 'anhang'; bytes = Buffer.byteLength(text, 'utf8');
    } else {
      var voll = kopfZeile(reihe, tag) + '\n' + text;
      await atomar(pfad, voll);
      art = 'neu'; bytes = Buffer.byteLength(voll, 'utf8');
    }
    zustand.tagJe[pfad] = tag;
    return { ok: true, geschrieben: true, art: art, neu: liste.length, uebersprungen: uebersprungen,
      letzterStempel: liste[liste.length - 1][0], pfad: pfad, geschriebenBytes: bytes, ms: Date.now() - t0 };
  } catch (e) {
    return { ok: false, pfad: pfad, grund: 'Tagesablage: ' + ((e && e.code) ? e.code + ' ' : '') + String((e && e.message) || e).slice(0, 200), ms: Date.now() - t0 };
  }
}
/** Der Stand: lesen (null ohne Datei), atomar schreiben. */
async function standLesen(roh) { return jsonLesen(standPfad(roh)); }
async function standSchreiben(roh, stand) {
  stand.stand = new Date().toISOString();
  await atomar(standPfad(roh), JSON.stringify(stand));
  return true;
}
/** Eine Zeile ins Laufprotokoll des Rohordners - dieselbe Datei wie die Vollsammlung
 *  (alpacaarchiv.protokoll), nur asynchron. */
async function protokoll(roh, zeile) {
  try {
    await fsp.mkdir(roh, { recursive: true });
    await fsp.appendFile(path.join(roh, PROTOKOLL), new Date().toISOString() + '  ' + zeile + '\n');
    return true;
  } catch (e) { return false; }
}

/* ================= 5) Der Leser (Viewer, synchron, klein) ================= */
/** Die heutigen Kerzen einer Reihe aus der Tagesablage - oder { ok:false, kerzen:[] }.
 *  Synchron, weil der Viewer-Zweig synchron liest und die Datei klein ist (ein Tag,
 *  hoechstens ~1.000 Zeilen). Nicht fuer die Live-Runde. */
function lesenSync(pfad, heuteTag) {
  var text = null;
  try { text = fs.readFileSync(pfad, 'utf8'); } catch (e) { return { ok: false, kopf: null, kerzen: [], verworfen: { unvollstaendig: 0, form: 0, doppelt: 0 }, grund: 'keine Datei' }; }
  return zerlegen(text, heuteTag);
}

module.exports = {
  VERSION: VERSION, DATEI: DATEI, STAND: STAND, PROTOKOLL: PROTOKOLL,
  kopfZeile: kopfZeile, kerzenZeile: kerzenZeile, kerzenText: kerzenText, zerlegen: zerlegen, zusammenfuehren: zusammenfuehren,
  standLeer: standLeer, standFuerTag: standFuerTag,
  pfadFuer: pfadFuer, standPfad: standPfad,
  atomar: atomar, jsonLesen: jsonLesen, jsonGemerkt: jsonGemerkt, kopfLesen: kopfLesen, anhaengen: anhaengen,
  standLesen: standLesen, standSchreiben: standSchreiben, protokoll: protokoll,
  lesenSync: lesenSync,
};
