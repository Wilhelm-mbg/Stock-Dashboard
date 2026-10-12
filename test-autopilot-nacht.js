'use strict';
/* Regressionstest Auftrag Nr. 114 (12.10.2026): "Autopilot-Prüfung: Fehler: Q is not defined".
 *
 * Der Nachtlauf (depot.js pilotMessen) baut nach der Messung den Messbericht:
 *   depot.js  pilotMessen -> window.Berichte.baueMessbericht(D.central, a, extra)
 *   berichte.js baueMessbericht -> Q.PROFILES / Q.warrantValue / Q.effSpread / Q.warrantOmega
 * berichte.js bezog nur `var U = window.U`, nie `Q` - der Wurf landete im catch von
 * pilotMessen als a.lastCheck = { ok:false, txt:'Fehler: Q is not defined' }. Der Linter sah
 * es nicht, weil eslint.config.mjs `Q` als Fenster-Global fuehrt (das es nie war).
 *
 * Zwei Pruefungen:
 *  1. VERHALTEN: berichte.js wird so geladen, wie der Renderer es laedt (window-Kontext mit
 *     window.Quant, window.U, window.api, document), verkabelt wie von depot.js init(), und der
 *     Messbericht wird wie in pilotMessen gebaut. Wirft das, ist der Test rot.
 *  2. KLINKE: kein Wurzel-Modul ausser depot.js/quant.js benutzt `Q.` im Code, ohne `Q` selbst
 *     zu beziehen (var/let/const Q = ..., Q = ..., oder Q als Parameter). Kommentare und
 *     Zeichenketten zaehlen nicht; test-*.js und node_modules/dist werden nicht angefasst.
 *
 * AUTOPILOT_QUELLE=<ordner> laesst beide Pruefungen gegen eine andere Fassung der Dateien
 * laufen (Gegenprobe: alte Fassung rot, gefixte Fassung gruen). Ohne Variable: Repo-Wurzel. */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var QUELLE = process.env.AUTOPILOT_QUELLE ? path.resolve(process.env.AUTOPILOT_QUELLE) : __dirname;
var fehler = 0, gut = 0;
function ok(bed, text, info) {
  if (bed) { gut++; console.log('  ✅ ' + text); }
  else { fehler++; console.log('  ❌ ' + text + (info !== undefined ? '  → ' + String(info).slice(0, 400) : '')); }
}
function lies(datei) { return fs.readFileSync(path.join(QUELLE, datei), 'utf8'); }

/* ---------- 1. Verhalten: der Nachtlauf-Pfad ohne Fenster, aber mit window-Kontext ---------- */
function rendererKontext() {
  var sb = {};
  sb.window = sb; sb.self = sb; sb.globalThis = sb;
  sb.console = console;
  sb.setInterval = function () { return 0; };
  sb.clearInterval = function () {};
  sb.setTimeout = function () { return 0; };
  sb.clearTimeout = function () {};
  sb.document = { getElementById: function () { return null; }, querySelector: function () { return null; },
    querySelectorAll: function () { return []; }, addEventListener: function () {}, body: {} };
  sb.navigator = { language: 'de-DE' };
  sb.api = {};                                   // ohne exportAnalysis: der Export kehrt still um
  sb.U = { dez: function (x, stellen) { return Number(x).toFixed(stellen == null ? 2 : stellen).replace('.', ','); },
    esc: function (s) { return String(s); }, nf2: { format: function (x) { return String(x); } } };
  var ctx = vm.createContext(sb);
  /* quant.js setzt im Renderer window.Quant (root.Quant) - hier dieselbe Datei im selben Kontext. */
  vm.runInContext(lies('quant.js'), ctx, { filename: 'quant.js' });
  return ctx;
}

function kunstZustand(now) {
  var D = {
    cash: 90000, trades: [], positions: [], schatten: [], tuneLog: [], mfVerlauf: [],
    intraday: { orderFee: 0, budgetPct: 0.05, profile: 'atm21', handSperre: {} },
    central: { at: now, datenlage: { '60m': { werte: 120, handelstage: 60 }, '15m': { werte: 100, handelstage: 25 } },
      ranking: [], rec: null }
  };
  var a = { on: true, lastMess: now, lastCheck: { at: now, ok: true, txt: 'Testlauf (Kunstzustand, kein Befund)', dauerMin: 1.2 }, messHistorie: [] };
  return { D: D, a: a };
}

(function verhalten() {
  console.log('Autopilot-Nachtlauf: Messbericht wie in depot.js pilotMessen bauen');
  var ctx;
  try { ctx = rendererKontext(); } catch (e) { ok(false, 'quant.js laedt im window-Kontext', e && e.message); return; }
  ok(ctx.Quant && typeof ctx.Quant.warrantValue === 'function' && ctx.Quant.PROFILES, 'window.Quant steht wie im Renderer (PROFILES, warrantValue)');
  try { vm.runInContext(lies('berichte.js'), ctx, { filename: 'berichte.js' }); }
  catch (e) { ok(false, 'berichte.js laedt im window-Kontext', e && e.message); return; }
  ok(ctx.Berichte && typeof ctx.Berichte.verkabeln === 'function' && typeof ctx.Berichte.baueMessbericht === 'function',
    'window.Berichte bietet verkabeln und baueMessbericht');
  if (fehler) return;
  var now = Date.now();
  var Z = kunstZustand(now);
  var D = Z.D, a = Z.a;
  /* Verkabelung wie depot.js init(): Getter statt Kopien (berichte.js mitFrisch). */
  ctx.Berichte.verkabeln({
    depot: function () { return D; }, equityNow: function () { return 100000; },
    istMess: function () { return true; }, stratOf: function (t) { return t && t.strategy === 'hourly' ? 'hourly' : 'intraday'; },
    normWeights: function () { return {}; }, kiSuggestions: function () { return []; }, getHistory: function () { return []; },
    patienceAgg: function () { return {}; }, dateiSpeichern: function () {}, START_CAPITAL: 100000,
    HEALTH: function () { return {}; }, SENT: function () { return []; }, EXPORT_ABDECKUNG: function () { return null; },
    LASTBARS: function () { return {}; }, TAGES_CACHE: function () { return {}; },
    modeParams: function () { return { scanMs: 60000 }; }, melde: function () {}, scheiterGrund: function () { return ''; },
    HAND_LABEL: {}, MIN_OOS_TRADES: 30, MIN_OOS_TAGE: 10
  });
  var md = null, wurf = null;
  try {
    /* Woertlich der Aufruf aus pilotMessen (depot.js, nach der Messung). */
    md = ctx.Berichte.baueMessbericht(D.central, a, { handSperre: D.intraday.handSperre, intraday: D.intraday, version: 'test', schatten: {} });
  } catch (e) { wurf = e; }
  ok(!wurf, 'baueMessbericht wirft nicht (Nachtlauf meldete sonst "Fehler: " + e.message in a.lastCheck)',
    wurf && (wurf.name + ': ' + wurf.message + (/\bQ\b/.test(String(wurf.message)) ? '  [berichte.js bezieht Q nicht - Fix: var Q = window.Quant neben var U = window.U]' : '')));
  if (wurf) return;
  ok(typeof md === 'string' && md.indexOf('# Autopilot-Messbericht') === 0, 'Messbericht beginnt mit der Ueberschrift');
  var profilName = ctx.Quant.PROFILES.atm21 && ctx.Quant.PROFILES.atm21.name;
  ok(profilName && md.indexOf('| ' + profilName + ' |') !== -1, 'Kostenmodell-Tabelle enthaelt die Profilzeile aus Q.PROFILES (' + profilName + ')');
  ok(md.indexOf('Testlauf (Kunstzustand, kein Befund)') !== -1, 'Ergebniszeile uebernimmt a.lastCheck.txt');
})();

/* ---------- 2. Klinke: wer `Q.` benutzt, bezieht `Q` selbst ---------- */
function ohneKommentareUndStrings(src) {
  /* Reihenfolge: erst Zeichenketten leeren (sonst schneidet ein // in einer URL die Zeile),
   * dann Block- und Zeilenkommentare. Heuristik, aber fuer die Frage "steht Q. im CODE" genau genug. */
  return src
    .replace(/`(?:[^`\\]|\\.)*`/g, '``')
    .replace(/'(?:[^'\\\n]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\\n]|\\.)*"/g, '""')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}
var DEF_RE = /\b(?:var|let|const)\b[^;]*\bQ\s*=|(?:^|[^.\w$])Q\s*=[^=]|function\s*[\w$]*\s*\([^)]*\bQ\b[^)]*\)/m;
var USE_RE = /(?:^|[^.\w$])Q\.[A-Za-z_$]/m;
(function klinke() {
  console.log('Klinke: kein Wurzel-Modul benutzt Q. ohne Q zu beziehen');
  var dateien = fs.readdirSync(QUELLE).filter(function (f) {
    return /\.js$/.test(f) && !/^test-/.test(f) && fs.statSync(path.join(QUELLE, f)).isFile();
  }).sort();
  ok(dateien.length > 0, 'Wurzel-JS gefunden (' + dateien.length + ' Dateien, ohne node_modules/dist/test-*)');
  var verstoesse = [];
  var benutzer = [];
  dateien.forEach(function (f) {
    var code = ohneKommentareUndStrings(lies(f));
    if (!USE_RE.test(code)) return;
    benutzer.push(f);
    if (!DEF_RE.test(code)) verstoesse.push(f);
  });
  ok(benutzer.indexOf('depot.js') !== -1 && benutzer.indexOf('berichte.js') !== -1,
    'Klinke sieht die bekannten Benutzer (depot.js, berichte.js) - sonst misst sie nichts', benutzer.join(', '));
  ok(verstoesse.length === 0, 'Jedes Modul, das Q. benutzt, bezieht Q selbst (' + benutzer.length + ' Benutzer geprueft)',
    verstoesse.length ? 'ohne Bezug: ' + verstoesse.join(', ') + ' - Fix je Datei: var Q = window.Quant (Renderer) bzw. self.Quant (Worker) oder require(\'./quant.js\')' : undefined);
})();

console.log('\n' + (fehler ? '❌ ' + fehler + ' rot, ' : '✅ ') + gut + ' Zusicherungen gruen  (Quelle: ' + QUELLE + ')');
process.exit(fehler ? 1 : 0);
