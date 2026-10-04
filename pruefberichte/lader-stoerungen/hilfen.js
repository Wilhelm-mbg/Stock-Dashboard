'use strict';
/* Pruefbericht "Lader-Stoerungen" (Oktober 2026): gemeinsame Hilfen der Kleinsttests.
 *
 * MUSS ALS ERSTES geladen werden - vor jedem Modul der App. Drei Sperren werden hier gesetzt:
 *
 *   1. NETZSPERRE: https/http get+request, net/tls connect, dns.lookup, fetch und child_process
 *      werfen sofort und werden gezaehlt. Kein Test darf eine echte Quelle erreichen; die
 *      Antworten sind alle nachgebaut. kerzenquelle.js ruft https.get zur Laufzeit ueber das
 *      Modulobjekt - die Ersetzung hier greift also auch dort.
 *   2. SCHREIBSPERRE: jede schreibende fs-Verrichtung (auch fs.promises, openSync mit
 *      Schreibflagge, rename, mkdir, rm) ausserhalb EINES frischen Wegwerf-Ordners unter
 *      os.tmpdir() wirft und wird gezaehlt. Der Ordner wird am Ende geloescht. Das Repo liegt
 *      selbst unter %TEMP% - deshalb gilt die Sperre dem eigenen Ordner, nicht os.tmpdir().
 *   3. DATENORDNER: MD_DATEN und MD_ALPACA_WURZEL zeigen VOR dem Laden der App-Module in den
 *      Wegwerf-Ordner. kerzenquelle.js liest sonst ~/Downloads/Markt-Dashboard-Daten und folgt
 *      dort *-pfad.txt-Zeigern auf das echte Archiv (E:).
 *
 * Jeder Test druckt GENAU EINE Zeile: "ZEIGT ABWEICHUNG: [ID] ..." oder "kein Unterschied: [ID] ...".
 * Ein Test, der seinen Weg nicht nachweislich betreten hat (Zaehler der Attrappe = 0), wirft -
 * der Lauf meldet ihn dann als "TEST KAPUTT" statt als gruen (wiki/fehlerformen.md: "Die
 * Gegenprobe, die nichts ausloest").
 *
 * Reines Node, kein Netz, keine Schluessel, kein Electron. Alles Simulation, keine Anlageberatung.
 */
var fs = require('fs');
var fsp = fs.promises;
var path = require('path');
var os = require('os');
var vm = require('vm');

var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..', '..');

/* ---------------- Wegwerf-Ordner und Datenordner ---------------- */
var TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'lader-stoerungen-'));
var TMP_KLEIN = path.resolve(TMP).toLowerCase();
fs.mkdirSync(path.join(TMP, 'daten'));
fs.mkdirSync(path.join(TMP, 'alpaca'));
process.env.MD_DATEN = path.join(TMP, 'daten');
process.env.MD_ALPACA_WURZEL = path.join(TMP, 'alpaca');
/* Ausdrueckliche Archiv-Zeiger (MD_ARCHIV60M, MD_ARCHIV1D, ...) gewinnen in kerzenquelle.js zeigerFuer()
 * VOR dem Datenordner - ein gesetzter Zeiger fuehrte ins echte Archiv. Deshalb hier geleert. */
Object.keys(process.env).forEach(function (k) { if (/^MD_ARCHIV/i.test(k)) delete process.env[k]; });

var VERSTOESSE = { netz: [], schreiben: [] };
var ECHT = {
  rmSync: fs.rmSync.bind(fs), mkdirSync: fs.mkdirSync.bind(fs), setTimeout: global.setTimeout,
  Date: global.Date
};

function imTmp(p) {
  if (p == null) return false;
  if (typeof p === 'number') return true;           /* Dateikennung: kam aus einem bewachten open */
  if (Buffer.isBuffer(p)) p = p.toString();
  if (p instanceof URL) p = p.pathname;
  var r = path.resolve(String(p)).toLowerCase();
  return r === TMP_KLEIN || r.indexOf(TMP_KLEIN + path.sep) === 0;
}
function sperre(art, wer, p) {
  var t = art + ': ' + wer + ' -> ' + String(p);
  VERSTOESSE[art === 'NETZ' ? 'netz' : 'schreiben'].push(t);
  throw new Error('GESPERRT ' + t);
}

/* Schreibende Verrichtungen mit Pfad im ersten (und bei rename/copy auch zweiten) Argument. */
['writeFileSync', 'writeFile', 'appendFileSync', 'appendFile', 'mkdirSync', 'mkdir', 'rmSync', 'rm',
  'rmdirSync', 'rmdir', 'unlinkSync', 'unlink', 'truncateSync', 'truncate', 'createWriteStream',
  'utimesSync', 'utimes', 'mkdtempSync', 'mkdtemp'].forEach(function (n) {
  var f = fs[n]; if (typeof f !== 'function') return;
  fs[n] = function (p) { if (!imTmp(p)) sperre('SCHREIBEN', 'fs.' + n, p); return f.apply(fs, arguments); };
});
['renameSync', 'rename', 'copyFileSync', 'copyFile', 'cpSync', 'cp', 'linkSync', 'link', 'symlinkSync', 'symlink'].forEach(function (n) {
  var f = fs[n]; if (typeof f !== 'function') return;
  fs[n] = function (a, b) {
    if (/^(rename|link|symlink)/.test(n) && !imTmp(a)) sperre('SCHREIBEN', 'fs.' + n, a);
    if (!imTmp(b)) sperre('SCHREIBEN', 'fs.' + n, b);
    return f.apply(fs, arguments);
  };
});
function schreibFlagge(fl) { return fl != null && (typeof fl === 'number' ? (fl & 3) !== 0 : /[wa+]/.test(String(fl))); }
['openSync', 'open'].forEach(function (n) {
  var f = fs[n];
  fs[n] = function (p, fl) { if (schreibFlagge(fl) && !imTmp(p)) sperre('SCHREIBEN', 'fs.' + n, p); return f.apply(fs, arguments); };
});
['writeFile', 'appendFile', 'mkdir', 'rm', 'rmdir', 'unlink', 'truncate', 'utimes', 'mkdtemp'].forEach(function (n) {
  var f = fsp[n]; if (typeof f !== 'function') return;
  fsp[n] = function (p) {
    if (!imTmp(p)) { VERSTOESSE.schreiben.push('fs.promises.' + n + ' -> ' + p); return Promise.reject(new Error('GESPERRT SCHREIBEN: fs.promises.' + n + ' -> ' + p)); }
    return f.apply(fsp, arguments);
  };
});
['rename', 'copyFile', 'cp'].forEach(function (n) {
  var f = fsp[n]; if (typeof f !== 'function') return;
  fsp[n] = function (a, b) {
    if ((n === 'rename' && !imTmp(a)) || !imTmp(b)) { VERSTOESSE.schreiben.push('fs.promises.' + n + ' -> ' + b); return Promise.reject(new Error('GESPERRT SCHREIBEN: fs.promises.' + n)); }
    return f.apply(fsp, arguments);
  };
});
(function () {
  var f = fsp.open;
  fsp.open = function (p, fl) {
    if (schreibFlagge(fl) && !imTmp(p)) { VERSTOESSE.schreiben.push('fs.promises.open -> ' + p); return Promise.reject(new Error('GESPERRT SCHREIBEN: fs.promises.open')); }
    return f.apply(fsp, arguments);
  };
})();

/* ---------------- Netzsperre ---------------- */
['http', 'https'].forEach(function (m) {
  var mod = require(m);
  ['get', 'request'].forEach(function (n) { mod[n] = function (u) { sperre('NETZ', m + '.' + n, (u && u.href) || (u && u.hostname) || u); }; });
});
(function () {
  var net = require('net'), tls = require('tls'), dns = require('dns'), cp = require('child_process');
  ['connect', 'createConnection'].forEach(function (n) { net[n] = function (a) { sperre('NETZ', 'net.' + n, JSON.stringify(a)); }; });
  tls.connect = function (a) { sperre('NETZ', 'tls.connect', JSON.stringify(a)); };
  dns.lookup = function (h) { sperre('NETZ', 'dns.lookup', h); };
  ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork'].forEach(function (n) {
    cp[n] = function (c) { sperre('NETZ', 'child_process.' + n, c); };
  });
  global.fetch = function (u) { try { sperre('NETZ', 'fetch', u); } catch (e) { return Promise.reject(e); } };
})();

/* ---------------- Hilfen fuer die Tests ---------------- */

/** Modul der App laden (relativ zur Repo-Wurzel; PRUEF_WURZEL nimmt einen anderen Stand). */
function lade(datei) { return require(path.join(WURZEL, datei)); }
/** Quelltext einer App-Datei (fuer Datei:Zeile-Angaben in den Texten). */
function quelle(datei) { return fs.readFileSync(path.join(WURZEL, datei), 'utf8'); }
/** Zeilennummer (1-basiert) des ERSTEN eindeutigen Vorkommens von anker in datei; wirft, wenn
 *  der Anker fehlt oder mehrdeutig ist (Anker gegen Inhalt, nie gegen feste Zeilennummern). */
function zeileVon(datei, anker) {
  var s = quelle(datei), i = s.indexOf(anker);
  if (i < 0) throw new Error('Anker fehlt in ' + datei + ': ' + anker);
  if (s.indexOf(anker, i + 1) >= 0) throw new Error('Anker mehrdeutig in ' + datei + ': ' + anker);
  return s.slice(0, i).split('\n').length;
}

var ZAEHLER = 0;
/** Ein frischer Unterordner im Wegwerf-Ordner (nur dort darf geschrieben werden). */
function tempOrdner(name) {
  var p = path.join(TMP, 't' + (++ZAEHLER) + '-' + String(name || 'x').replace(/[^A-Za-z0-9_-]/g, '_'));
  ECHT.mkdirSync(p, { recursive: true });
  return p;
}

/** fn auf einer festen Uhr ausfuehren: Date.now() und new Date() stehen auf jetzt (ms), alles andere
 *  wie gewohnt (Date.UTC, Date.parse, new Date(x), Intl). Gilt fuer alle Module, die das globale
 *  Date zur Laufzeit lesen. Synchron oder async; die echte Uhr kommt danach sicher zurueck. */
function mitUhr(jetzt, fn) {
  var Echt = global.Date;   /* die Uhr davor (bei Verschachtelung die aeussere feste Uhr) */
  class Fest extends ECHT.Date {
    constructor() { if (arguments.length === 0) super(jetzt); else super(...arguments); }
    static now() { return jetzt; }
  }
  global.Date = Fest;
  var zurueck = function () { global.Date = Echt; };
  var r;
  try { r = fn(); } catch (e) { zurueck(); throw e; }
  if (r && typeof r.then === 'function') return r.then(function (v) { zurueck(); return v; }, function (e) { zurueck(); throw e; });
  zurueck();
  return r;
}

/** fn mit sofortigen Zeitgebern: setTimeout(f, ms) laeuft im naechsten Takt (Wartepausen der Lader
 *  nach 429 usw.). Nur fuer async fn; danach ist der echte Zeitgeber zurueck. */
async function mitSchnellenZeitgebern(fn) {
  var echt = global.setTimeout;
  global.setTimeout = function (f) { var a = Array.prototype.slice.call(arguments, 2); return echt(function () { f.apply(null, a); }, 0); };
  try { return await fn(); } finally { global.setTimeout = echt; }
}

/** Uhr fuer eine vm-Sandbox (wie pruefberichte/live-gegen-messung-momentum.test.js). */
function sandboxUhr(jetzt) {
  var Uh = function (x) { return arguments.length ? new ECHT.Date(x) : new ECHT.Date(Uh.jetzt); };
  Uh.now = function () { return Uh.jetzt; }; Uh.jetzt = jetzt; Uh.UTC = ECHT.Date.UTC; Uh.parse = ECHT.Date.parse;
  Uh.prototype = ECHT.Date.prototype;
  return Uh;
}
/** Ein Fenster-Modul (kein module.exports-Zweig gewuenscht) in einer vm-Sandbox laden. win wird
 *  als window/root gereicht; Date ist je Datei durch die Uhr ersetzt. Zeitgeber unter 1 s laufen
 *  sofort, laengere sind stumm. Rueckgabe: win (mit win.__uhr). */
function sandbox(dateien, win, jetzt) {
  var doc = { readyState: 'complete', addEventListener: function () { }, getElementById: function (id) { return (win.__el && win.__el[id]) || null; } };
  var ctx = {
    window: win, self: win, document: doc, console: console, __Uhr: sandboxUhr(jetzt), Intl: Intl,
    setTimeout: function (f, ms) { if (ms >= 1000) return 0; setImmediate(f); return 0; },
    setInterval: function () { return 0; }, clearTimeout: function () { }, clearInterval: function () { }
  };
  win.document = doc;
  vm.createContext(ctx);
  dateien.forEach(function (d) {
    vm.runInContext('(function (Date) {' + quelle(d) + '\n})(__Uhr);', ctx, { filename: d });
  });
  win.__uhr = ctx.__Uhr;
  return win;
}

/** Eine Yahoo-Chart-Antwort nachbauen (v8 /chart). kerzen: [[tSek, o, h, l, c, v, adj?], ...]
 *  (Sekunden wie bei Yahoo; null-Werte erlaubt). o: { sym, gmtoffset, tz, ereignisse, meta }. */
function yahooChart(kerzen, o) {
  o = o || {};
  var q = { open: [], high: [], low: [], close: [], volume: [] }, adj = [], ts = [];
  kerzen.forEach(function (k) {
    ts.push(k[0]); q.open.push(k[1]); q.high.push(k[2]); q.low.push(k[3]); q.close.push(k[4]); q.volume.push(k[5]);
    adj.push(k.length > 6 ? k[6] : k[4]);
  });
  var res = {
    meta: Object.assign({ symbol: o.sym || 'TEST', currency: 'USD', exchangeName: 'NMS', gmtoffset: o.gmtoffset != null ? o.gmtoffset : -14400,
      exchangeTimezoneName: o.tz || 'America/New_York', dataGranularity: o.interval || '1d' }, o.meta || {}),
    timestamp: ts,
    indicators: { quote: [q], adjclose: [{ adjclose: adj }] }
  };
  if (o.ereignisse) res.events = o.ereignisse;
  return JSON.stringify({ chart: { result: [res], error: null } });
}

/** Eine Attrappe, die zaehlt (fehlerformen.md: "jede Attrappe zaehlt"). */
function zaehler() { var z = { n: 0, args: [] }; z.f = function () { z.n++; z.args.push(Array.prototype.slice.call(arguments)); }; return z; }
/** Positivkontrolle: wirft, wenn der Weg nicht betreten wurde. */
function betreten(bed, was) { if (!bed) throw new Error('Weg nicht betreten: ' + was); }

function zeile(id, abweichung, text) {
  var z = (abweichung ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + '[' + id + '] ' + text;
  console.log(z);
  return z;
}

/** Am Ende: Wegwerf-Ordner loeschen (mit der echten Verrichtung, nur innerhalb TMP). */
function aufraeumen() {
  try { if (imTmp(TMP)) ECHT.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* bleibt liegen, unter %TEMP% */ }
}
function verstoesse() { return { netz: VERSTOESSE.netz.slice(), schreiben: VERSTOESSE.schreiben.slice() }; }

/** Laeuft eine Testdatei allein (node pruefberichte/lader-stoerungen/<lader>.test.js), uebernimmt der
 *  gemeinsame Laeufer. */
function allein(mod) {
  if (require.main !== mod) return;
  require(path.join(__dirname, '..', 'lader-stoerungen.test.js')).laufe([mod.exports], process.argv.slice(2));
}

module.exports = {
  WURZEL: WURZEL, TMP: TMP, lade: lade, quelle: quelle, zeileVon: zeileVon, tempOrdner: tempOrdner,
  mitUhr: mitUhr, mitSchnellenZeitgebern: mitSchnellenZeitgebern, sandbox: sandbox, sandboxUhr: sandboxUhr,
  yahooChart: yahooChart, zaehler: zaehler, betreten: betreten, zeile: zeile,
  aufraeumen: aufraeumen, verstoesse: verstoesse, allein: allein, imTmp: imTmp, ECHT: ECHT
};
