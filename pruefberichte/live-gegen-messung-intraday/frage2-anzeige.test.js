'use strict';
/* Pruefbericht "Live gegen Messung" - Intraday-Depot (rsi2seit), FRAGE 2:
 * Was zeigt die Oberflaeche ueber die Regel "RSI(2) im Seitwaertskanal", und stimmt jede Zahl
 * mit wiki/belegstand.md und den Protokollen studien/messmaschine/protokolle/rsi2seit-*.json?
 *
 * Bericht: pruefberichte/live-gegen-messung-intraday/frage2-anzeige.md (Kennungen F2-xx).
 *
 * VERTRAG: module.exports = [ { name, lauf: async () => ({ abweichung, text }) }, ... ].
 * Aufruf als Skript druckt GENAU EINE Zeile je Test:
 *   "ZEIGT ABWEICHUNG: <name> — <text>"  oder  "kein Unterschied: <name> — <text>".
 *
 * Soll-Werte werden aus wiki/belegstand.md und den Protokoll-JSONs GELESEN (nicht abgeschrieben).
 * Ist-Werte kommen, wo es geht, aus dem AUSGEFUEHRTEN App-Code: die Text-erzeugenden Funktionen
 * werden aus depot.js / app-shell.js herausgeschnitten (Klammerzaehlung mit Zeichenketten- und
 * Kommentar-Erkennung) und in einer Sandbox (new Function) mit Attrappen und fester Uhr
 * (Mo 05.10.2026 15:00 UTC) ausgefuehrt. Statische Texte (index.html, strategien.js, explorer.js,
 * app-shell.js) werden als Zeichenketten-Literale gelesen; "sichtbar" heisst: die Zahl steht in einem
 * String-Literal bzw. im HTML-Text, nicht nur in einem Kommentar.
 * Jede Textmarke wird auf -1 geprueft (dann: TEST DEFEKT statt stiller Durchschnitt bis Dateiende).
 *
 * Reines Node, kein Netz, kein Electron, keine grossen Datendateien. App-Code wird nicht veraendert.
 * Wurzel: PRUEF_WURZEL oder zwei Ebenen ueber dieser Datei.
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');

var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..', '..');
var PROT_DIR = path.join(WURZEL, 'studien', 'messmaschine', 'protokolle');
var UHR = Date.UTC(2026, 9, 5, 15, 0);   // Mo 05.10.2026, 11:00 New York - feste Uhr

/* ---------------- Lesen ---------------- */
var CACHE = {};
function lies(rel) {
  if (CACHE[rel] == null) CACHE[rel] = fs.readFileSync(path.join(WURZEL, rel), 'utf8');
  return CACHE[rel];
}
function protokoll(name) { return JSON.parse(lies('studien/messmaschine/protokolle/' + name)); }
/** Alle Protokolle rsi2seit*.json in der Form, die window.api.readProtokolle liefert. */
function alleRsiProtokolle() {
  return fs.readdirSync(PROT_DIR).filter(function (f) { return /^rsi2seit.*\.json$/.test(f); }).sort().map(function (f) {
    return { datei: f, protokoll: JSON.parse(fs.readFileSync(path.join(PROT_DIR, f), 'utf8')) };
  });
}
/** Position einer Textmarke - wirft, statt -1 zurueckzugeben. */
function marke(text, m, ab) {
  var i = text.indexOf(m, ab || 0);
  if (i === -1) throw new Error('Textmarke nicht gefunden: ' + JSON.stringify(m.slice(0, 80)));
  return i;
}
function zeileVon(text, i) { return text.slice(0, i).split('\n').length; }

/* ---------------- Zahlen ---------------- */
function dez(x, n) { return x.toFixed(n).replace('.', ','); }
function vz(x, n) { return (x >= 0 ? '+' : '−') + dez(Math.abs(x), n); }
function tausend(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function normZahl(s) { return s.replace(/^[+−-]/, '').replace(/\.(?=\d{3}\b)/g, ''); }

/* ---------------- Quelltext zerlegen ---------------- */
/** Laeuft ueber JS-Quelltext und ruft cb(art, von, bis) fuer Kommentare und Zeichenketten.
 *  Regex-Literale werden nicht erkannt (in den geschnittenen Funktionen enthalten sie weder
 *  Klammern noch Anfuehrungszeichen - die Schnitte werden zusaetzlich kompiliert). */
function zerlege(src, cb) {
  var i = 0, n = src.length, letztes = '';
  while (i < n) {
    var c = src[i], d = src[i + 1];
    if (c === '/' && d !== '/' && d !== '*' && (letztes === '' || '(,=:[!&|?{};+'.indexOf(letztes) !== -1)) {
      var r = i + 1, klasse = false;
      while (r < n && src[r] !== '\n') {
        if (src[r] === '\\') { r += 2; continue; }
        if (src[r] === '[') klasse = true; else if (src[r] === ']') klasse = false;
        else if (src[r] === '/' && !klasse) break;
        r++;
      }
      if (src[r] === '/') { cb('regex', i, r + 1); i = r + 1; letztes = '/'; continue; }
    }
    if (!/\s/.test(c) && !(c === '/' && (d === '/' || d === '*'))) letztes = c;
    if (c === '/' && d === '/') { var e = src.indexOf('\n', i); e = e === -1 ? n : e; cb('kommentar', i, e); i = e; continue; }
    if (c === '/' && d === '*') { var e2 = src.indexOf('*/', i + 2); e2 = e2 === -1 ? n : e2 + 2; cb('kommentar', i, e2); i = e2; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      var j = i + 1;
      while (j < n && src[j] !== c) { if (src[j] === '\\') j++; j++; }
      cb('string', i, j + 1); i = j + 1; letztes = c; continue;
    }
    cb('code', i, i + 1); i++;
  }
}
/** Schneidet "function name(...) { ... }" (oder ab einer beliebigen Marke den naechsten {}-Block) heraus. */
function schneide(src, startMarke) {
  var s = marke(src, startMarke);
  if (src.slice(Math.max(0, s - 6), s) === 'async ') s -= 6;
  var tiefe = 0, offen = -1, ende = -1;
  zerlege(src.slice(s), function (art, von) {
    if (ende !== -1 || art !== 'code') return;
    var ch = src[s + von];
    if (ch === '{') { if (offen === -1) offen = von; tiefe++; }
    else if (ch === '}') { tiefe--; if (tiefe === 0 && offen !== -1) ende = von + 1; }
  });
  if (ende === -1) throw new Error('Block ohne Ende ab ' + startMarke);
  return src.slice(s, s + ende);
}
/** Inhalte aller String-Literale (ohne Kommentare) - das, was die Oberflaeche zeigen kann. */
function stringsVon(src) {
  var aus = [];
  zerlege(src, function (art, von, bis) { if (art === 'string') aus.push(src.slice(von + 1, bis - 1)); });
  return aus;
}
function kommentareVon(src) {
  var aus = [];
  zerlege(src, function (art, von, bis) { if (art === 'kommentar') aus.push({ text: src.slice(von, bis), zeile: zeileVon(src, von) }); });
  return aus;
}
function sichtbar(html) {
  return html.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/\s+/g, ' ').trim();
}

/* ---------------- Soll: belegstand.md und Protokoll ---------------- */
function belegZeileRsi() {
  var md = lies('wiki/belegstand.md');
  var i = marke(md, '| `rsi2seit` (RSI2 im Seitwärtskanal) |');
  return { text: md.slice(i, md.indexOf('\n', i)), zeile: zeileVon(md, i) };
}
function belegstandSoll() {
  var z = belegZeileRsi().text;
  function hol(re, was) { var m = re.exec(z); if (!m) throw new Error('belegstand.md: ' + was + ' nicht gefunden'); return m; }
  var je = hol(/\*\*([+−-]\d+,\d+) Pp je Signal\*\*/, 'je Signal');
  var tm = hol(/Tagesmittel ([+−-]\d+,\d+)\*\* \(se (\d+,\d+), Band \[([+−-]?\d+,\d+), ([+−-]?\d+,\d+)\]\)/, 'Tagesmittel/se/Band');
  var mcp = hol(/obere Grenzen (\d+,\d+)–(\d+,\d+) Pp/, 'MCP-Grenzen');
  var urteilAbschnitt = /## Nicht entscheidbar/.test(lies('wiki/belegstand.md'));
  return { zeile: belegZeileRsi().zeile, jeSignal: je[1], tagesmittel: tm[1], se: tm[2], bandU: tm[3], bandO: tm[4],
    mcpU: mcp[1], mcpO: mcp[2], abschnittNichtEntscheidbar: urteilAbschnitt };
}
/** Das massgebliche Protokoll laut belegstand.md (Fundstelle der Zeile). */
function sollProtokollName() {
  var m = /(rsi2seit-\d{4}-\d{2}-\d{2}\.json)`/.exec(belegZeileRsi().text);
  if (!m) throw new Error('belegstand.md nennt kein rsi2seit-Protokoll');
  return m[1];
}
function sollProtokoll() {
  var name = sollProtokollName(), j = protokoll(name), e = j.ergebnisse[0];
  var B = e.bestaetigung.ueberschuss, Br = e.bestaetigung.roh, E = e.entdeckung.ueberschuss;
  var aus = null;
  (j.entscheidungen || []).forEach(function (en) { if (/^Urteil Variante/.test(en.regel || '') && en.ergebnis && en.ergebnis.aussicht) aus = en.ergebnis.aussicht.tage80; });
  return { name: name, j: j, urteil: j.bestesUrteil, datum: String(j.gemessenAm).slice(0, 10),
    jeSignalPp: B.jeSignal * 100, tagesmittelPp: B.tagesmittel * 100, sePp: B.se * 100, mdePp: B.mde * 100, t: B.t,
    tage: B.tage, signale: B.signale, rohJeSignalPp: Br.jeSignal * 100, rohTagesmittelPp: Br.tagesmittel * 100,
    entdJeSignalPp: E.jeSignal * 100, entdTagesmittelPp: E.tagesmittel * 100,
    nettoPp: e.nettoJeSignalBestaetigung * 100, kostenUmlaufPp: e.kosten.jeUmlaufAnteil * 100, spanneBp: e.kosten.spanneBp,
    halteKerzen: j.strategie.haltedauerKerzen, zeitrahmen: j.strategie.zeitrahmen, richtung: j.strategie.richtung,
    ausstieg: e.ausstieg, werte: j.universum.werte, aussichtTage80: aus, kontrolle: j.verfahren && j.verfahren.kontrolle };
}
/** Alle Zahlen, die in einer Quelle als Beleg fuer rsi2seit gelten duerfen (fuer die Suche nach
 *  Zahlen ohne Fundstelle): die rsi2seit-Zeilen in belegstand.md und das massgebliche Protokoll
 *  (plus MCP-Protokoll gleichen Datums), auf 1-3 Stellen gerundet. */
function zahlenMitFundstelle() {
  var md = lies('wiki/belegstand.md').split('\n');
  var set = {};
  md.forEach(function (z) {
    if (!/rsi2seit|RSI-Teil|R-TREND|RSI2/.test(z)) return;
    (z.match(/\d[\d.]*,\d+|\d+/g) || []).forEach(function (t) { set[normZahl(t)] = 1; });
  });
  var namen = [sollProtokollName(), sollProtokollName().replace('rsi2seit-', 'rsi2seit-mcp-')];
  namen.forEach(function (n) {
    var j; try { j = protokoll(n); } catch (e) { return; }
    j.ergebnisse.forEach(function (e) {
      ['entdeckung', 'bestaetigung', 'gesamt'].forEach(function (h) {
        ['roh', 'ueberschuss'].forEach(function (a) {
          var x = e[h] && e[h][a]; if (!x) return;
          ['tagesmittel', 'se', 'mde', 'jeSignal'].forEach(function (f) { [1, 2, 3].forEach(function (s) { set[dez(Math.abs(x[f] * 100), s)] = 1; }); });
          [1, 2].forEach(function (s) { set[dez(Math.abs(x.t), s)] = 1; });
          set[String(x.tage)] = 1; set[String(x.signale)] = 1;
        });
      });
      [2, 3].forEach(function (s) { set[dez(Math.abs(e.nettoJeSignalBestaetigung * 100), s)] = 1; set[dez(e.kosten.jeUmlaufAnteil * 100, s)] = 1; });
      set[dez(e.kosten.spanneBp / 100, 2)] = 1;
    });
    set[String(j.universum.werte)] = 1; set[String(j.universum.handelstage)] = 1;
    set[String(j.strategie.haltedauerKerzen)] = 1;
    (j.entscheidungen || []).forEach(function (en) { if (en.ergebnis && en.ergebnis.aussicht) set[String(en.ergebnis.aussicht.tage80)] = 1; });
  });
  return set;
}
/** Zahlen eines sichtbaren Satzes, die weder in belegstand.md (rsi2seit-Zeilen) noch im
 *  massgeblichen Protokoll stehen. Datumsangaben, Versionsnummern und Namen sind ausgenommen. */
function zahlenOhneFundstelle(satz, set) {
  var t = satz.replace(/\d{1,2}\.\d{1,2}\.\d{4}/g, ' ').replace(/S&P 500|S&amp;P 500|S&P 100|S&amp;P 100|Nasdaq 100|200er|EMA\d+|RSI\(2\)|RSI2|\d+ Handelsstunden|\d+-Minuten|Version [\d.]+|\d+[-–]\d+ Uhr|\d+:\d+|#\d+|Nr\. \d+|\bAktie 1×|\b1×/g, ' ');
  var aus = [];
  (t.match(/[+−-]?\d[\d.]*(?:,\d+)?/g) || []).forEach(function (tok) {
    var k = normZahl(tok);
    if (/^\d$/.test(k)) return;                 // einstellige Zaehlwoerter ("zwei", "8 h" steht als Haltedauer im Protokoll)
    if (!set[k] && aus.indexOf(tok) === -1) aus.push(tok);
  });
  return aus;
}

/* ---------------- Sandbox fuer depot.js-Funktionen ---------------- */
function Uattrappe() {
  var aSh = lies('app-shell.js');
  var ut = schneide(aSh, 'urteilText: function (u) {').replace(/^urteilText: /, '');
  var dz = schneide(aSh, 'U.dez = function (x, stellen) {').replace(/^U\.dez = /, '');
  var U = {
    esc: function (s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); },
    nf0: new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }),
    nf2: new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    dt: function (ms) { return new Date(ms).toISOString(); },
    d: function (ms) { return new Date(ms).toISOString().slice(0, 10); },
    signTxt: function (v, unit) { return (v > 0 ? '+' : '') + v.toFixed(2).replace('.', ',') + (unit || ''); }
  };
  U.urteilText = new Function('return (' + ut + ');')();
  U.dez = new Function('return (' + dz + ');')();
  U.money = function (v) { return U.nf2.format(v) + ' $'; };
  return U;
}
function StudienUrteileLaden() {
  var win = {};
  new Function('window', 'document', lies('studienurteile.js'))(win, undefined);
  return win.StudienUrteile;
}
function elAttrappe() {
  return { innerHTML: '', textContent: '', style: {}, querySelector: function () { return null; }, addEventListener: function () {} };
}
/** Baut eine Sandbox mit den angegebenen depot.js-Funktionen und Attrappen. Rueckgabe: Objekt mit
 *  den Funktionen, den Elementen und dem Zustand D. */
function depotSandbox(o) {
  o = o || {};
  var dep = lies('depot.js');
  var funktionen = ['belegKette', 'kanteGueltig', 'kantenAusProtokollen', 'regelKopfAnzeigen', 'huerdeJetzt', 'huerdeAnzeigen',
    'kostenHuerdePp', 'positionsWert', 'renderKlartext', 'setupFromMode', 'edgeZustand', 'reiheUnplausibel', 'zOf',
    'scanKopfText', 'renderIntradayKarte'];
  var code = funktionen.map(function (f) { return schneide(dep, 'function ' + f + '('); }).join('\n');
  var setups = schneide(dep, 'var SETUPS = {');
  var els = {};
  var doc = { getElementById: function (id) { return els[id] || (els[id] = elAttrappe()); }, querySelector: function () { return null; },
    addEventListener: function () {}, dispatchEvent: function () {} };
  var echtesDate = Date;
  function FesteUhr(a) { if (!(this instanceof FesteUhr)) return new echtesDate(UHR).toString(); return arguments.length ? new echtesDate(a) : new echtesDate(UHR); }
  FesteUhr.now = function () { return UHR; }; FesteUhr.UTC = echtesDate.UTC; FesteUhr.parse = echtesDate.parse; FesteUhr.prototype = echtesDate.prototype;
  var D = o.D || { intraday: { enabled: true, mode: 'rsi2seit', interval: '60m', instrument: 'basis', scalpSL: 20, budgetPct: 0.03 }, trades: [], positions: [], tuneLog: [] };
  var win = { api: { readProtokolle: async function () { return { ok: true, protokolle: o.protokolle || [] }; } },
    StudienUrteile: StudienUrteileLaden(), Archiv: o.Archiv || null };
  var U = Uattrappe();
  var umgebung = {
    window: win, document: doc, U: U, D: D, Date: FesteUhr, CustomEvent: function () {},
    Q: o.Q || {}, HEALTH: o.HEALTH || {}, SPY_REGIME: { t: 0, auf: null }, MARKT_SPY: true, START_CAPITAL: 10000,
    modeParams: function () { return { maxHoldMin: D.intraday.scalpHold || 480, sl: -(D.intraday.scalpSL || 20) / 100, exitMode: 'zeit' }; },
    equityNow: function () { return 10000; }, autoOptCfg: function () { return { on: true, regime: true }; },
    killSwitchAktiv: function () { return false; }, save: function () {}, messUniversum: o.messUniversum || function () { return []; },
    marktSpyLaden: function () {}, intradayVergleich: function () { return { ok: false }; },
    Massstab: { langText: function () { return '–'; }, hinweis: function () { return ''; }, prozent: function () { return 0; } },
    pz1: function (x) { return String(x); }
  };
  var namen = Object.keys(umgebung);
  var rumpf = 'var PROTOKOLL_KANTE = {};\n' + setups + ';\n' + code + '\nreturn { ' +
    funktionen.map(function (f) { return f + ': ' + f; }).join(', ') +
    ', kanten: function () { return PROTOKOLL_KANTE; }, setKanten: function (k) { PROTOKOLL_KANTE = k; } };';
  var fnObj = new (Function.prototype.bind.apply(Function, [null].concat(namen).concat([rumpf])))();
  var api = fnObj.apply(null, namen.map(function (k) { return umgebung[k]; }));
  api.el = function (id) { return doc.getElementById(id); };
  api.D = D; api.U = U; api.win = win;
  return api;
}

/* ---------------- Hilfen fuer statische Texte ---------------- */
/** Sichtbarer Text eines HTML-Abschnitts von Marke a bis Marke b (beide muessen existieren). */
function htmlAbschnitt(rel, a, b) {
  var h = lies(rel), i = marke(h, a), j = marke(h, b, i + a.length);
  return { text: sichtbar(h.slice(i, j + b.length)), zeile: zeileVon(h, i) };
}
/** Attribut title="..." des label, das die Marke enthaelt. */
function titleUm(rel, m) {
  var h = lies(rel), i = marke(h, m), t = h.lastIndexOf('title="', i);
  if (t === -1) throw new Error('kein title vor ' + m);
  var e = h.indexOf('"', t + 7);
  if (e === -1 || e > i || h.slice(e, i).indexOf('<label') !== -1) throw new Error('kein title im selben label wie ' + m);
  return { text: sichtbar(h.slice(t + 7, e)), zeile: zeileVon(h, t) };
}
/** Sichtbares String-Literal einer JS-Datei, das die Marke enthaelt (genau eines). */
function literalMit(rel, m) {
  var src = lies(rel), treffer = [];
  zerlege(src, function (art, von, bis) { if (art === 'string' && src.slice(von, bis).indexOf(m) !== -1) treffer.push({ text: src.slice(von + 1, bis - 1), zeile: zeileVon(src, von) }); });
  if (!treffer.length) throw new Error(rel + ': kein String-Literal mit ' + JSON.stringify(m));
  return treffer[0];
}

/* ===================================================================================== */
var TESTS = [];
function test(name, lauf) { TESTS.push({ name: name, lauf: lauf }); }

/* F2-00 Grundlage: belegstand.md und das dort genannte Protokoll sagen dasselbe (sonst gibt es kein Soll). */
test('F2-00 Soll-Grundlage: belegstand.md (rsi2seit-Zeile) gegen das dort genannte Protokoll', async function () {
  var b = belegstandSoll(), p = sollProtokoll(), rot = [];
  var bandU = p.tagesmittelPp - 1.96 * p.sePp, bandO = p.tagesmittelPp + 1.96 * p.sePp;
  [['je Signal', b.jeSignal, vz(p.jeSignalPp, 3)], ['Tagesmittel', b.tagesmittel, vz(p.tagesmittelPp, 3)], ['se', b.se, dez(p.sePp, 3)],
   ['Band unten', b.bandU, vz(bandU, 3)], ['Band oben', b.bandO, dez(bandO, 3)]].forEach(function (x) {
    if (x[1].replace('−', '-') !== x[2].replace('−', '-').replace(/^\+(?=\d)/, x[1][0] === '+' ? '+' : '')) rot.push(x[0] + ' belegstand ' + x[1] + ' / Protokoll ' + x[2]);
  });
  var mcp = protokoll(p.name.replace('rsi2seit-', 'rsi2seit-mcp-'));
  var ob = mcp.ergebnisse.map(function (e) { var u = e.bestaetigung.ueberschuss; return (u.tagesmittel + 1.96 * u.se) * 100; });
  var mn = dez(Math.min.apply(null, ob), 3), mx = dez(Math.max.apply(null, ob), 3);
  if (mn !== b.mcpU) rot.push('MCP-Grenze unten ' + b.mcpU + ' / Protokoll ' + mn);
  if (mx !== b.mcpO) rot.push('MCP-Grenze oben ' + b.mcpO + ' / Protokoll ' + mx);
  if (p.urteil !== 'nicht-entscheidbar' || !b.abschnittNichtEntscheidbar) rot.push('Urteil ' + p.urteil);
  return { abweichung: rot.length > 0, text: rot.length ? rot.join('; ') :
    'belegstand.md:' + b.zeile + ' und ' + p.name + ' stimmen: Urteil ' + p.urteil + ', je Signal ' + b.jeSignal + ' Pp, Tagesmittel ' + b.tagesmittel +
    ' (se ' + b.se + ', Band [' + b.bandU + '; ' + b.bandO + ']), MCP-Grenzen ' + mn + '–' + mx + ' Pp, Haltedauer ' + p.halteKerzen + ' Kerzen ' + p.zeitrahmen +
    ', Kosten ' + dez(p.kostenUmlaufPp, 2) + ' Pp je Umlauf, netto je Signal ' + vz(p.nettoPp, 3) + ' Pp. Das ist das Soll aller folgenden Tests.' };
});

/* F2-01 Protokoll-Auswahl (depot.js kantenAusProtokollen) mit allen rsi2seit-Protokollen des Repos. */
test('F2-01 Protokoll-Auswahl: welche Zahl liest die App aus den Protokollen (kantenAusProtokollen ausgefuehrt)', async function () {
  var sb = depotSandbox({ protokolle: alleRsiProtokolle() });
  await sb.kantenAusProtokollen();
  var k = sb.kanten(), p = sollProtokoll(), r = k.rsi2seit, m = k['rsi2seit-mcp'];
  var rot = [];
  if (!r) rot.push('kein rsi2seit-Eintrag');
  else {
    if (r.datum !== p.datum) rot.push('Datum ' + r.datum + ' statt ' + p.datum);
    if (r.urteil !== p.urteil) rot.push('Urteil ' + r.urteil + ' statt ' + p.urteil);
    if (dez(r.jeSignalPp, 3) !== dez(p.jeSignalPp, 3)) rot.push('je Signal ' + dez(r.jeSignalPp, 3) + ' statt ' + dez(p.jeSignalPp, 3));
    if (r.aussichtTage80 !== p.aussichtTage80) rot.push('Aussicht ' + r.aussichtTage80 + ' statt ' + p.aussichtTage80);
  }
  /* CLAUDE.md sagt: "depot.js waehlt daraus die Variante mit dem groessten Bestaetigungs-t". */
  var claude = lies('CLAUDE.md'), behauptet = claude.indexOf('Variante mit dem **größten**') !== -1;
  var mcp = protokoll(p.name.replace('rsi2seit-', 'rsi2seit-mcp-'));
  var maxT = mcp.ergebnisse.reduce(function (a, e) { return e.bestaetigung.ueberschuss.t > a.bestaetigung.ueberschuss.t ? e : a; });
  return { abweichung: rot.length > 0, text: (rot.length ? rot.join('; ') + '. ' : '') +
    'rsi2seit: Protokoll vom ' + (r && r.datum) + ', ' + (r && r.urteil) + ', je Signal ' + (r && vz(r.jeSignalPp, 3)) + ' Pp, Aussicht ' + (r && r.aussichtTage80) +
    ' Signaltage (Soll ' + p.name + ': ' + vz(p.jeSignalPp, 3) + ', ' + p.aussichtTage80 + '). Auswahl-Regel heute: Variante mit dem Urteil des Protokolls, ' +
    'bei Gleichstand groesstes t (rsi2seit-mcp: ' + (m && vz(m.jeSignalPp, 3)) + ' Pp = Variante mit t ' + dez(maxT.bestaetigung.ueberschuss.t, 2) + '). ' +
    (behauptet ? 'CLAUDE.md beschreibt noch die alte Regel ("groesstes Bestaetigungs-t") - nur Doku, fuer rsi2seit (1 Variante) ohne Folge.' : '') };
});

/* F2-02 Regelkopf (Reiter Regeln): jede Zahl der Beleg-Zeile gegen das Protokoll. */
test('F2-02 Regelkopf "Beleg" (regelKopfAnzeigen ausgefuehrt): Zahlen neben dem Protokoll', async function () {
  var sb = depotSandbox({ protokolle: alleRsiProtokolle() });
  await sb.kantenAusProtokollen();     // ruft regelKopfAnzeigen selbst auf
  var txt = sichtbar(sb.el('regelKopf').innerHTML), p = sollProtokoll();
  var iB = marke(txt, 'Beleg');
  var beleg = txt.slice(iB);
  var set = zahlenMitFundstelle();
  var ohne = zahlenOhneFundstelle(beleg, set);
  /* Die Ueberschuss-Zahl des Kopfsatzes muss die des Protokolls sein (Tagesmittel oder je Signal) -
   * "0,065" steht zufaellig als se im Protokoll, deshalb hier ausdruecklich. */
  var mU = /([+−-]\d+,\d+) Pp Überschuss/.exec(beleg);
  if (mU && [vz(p.tagesmittelPp, 3), vz(p.jeSignalPp, 3)].indexOf(mU[1].replace('-', '−')) === -1) ohne.unshift(mU[1] + ' (als Überschuss; Protokoll ' + vz(p.tagesmittelPp, 3) + ' Tagesmittel / ' + vz(p.jeSignalPp, 3) + ' je Signal)');
  var alt = protokoll('rsi2seit-2026-08-23.json').ergebnisse[0].gesamt;
  var herkunft = '6.509 / 675 / +0,170 = Gesamt-Signale, -Tage und Roh-Tagesmittel aus rsi2seit-2026-08-23.json (' + alt.roh.signale + ', ' + alt.roh.tage + ', ' +
    vz(alt.roh.tagesmittel * 100, 3) + '); "+0,065" steht in keinem Protokoll (08-23 Gesamt-Ueberschuss ' + vz(alt.ueberschuss.tagesmittel * 100, 3) + ')';
  var protoSatz = beleg.indexOf('Überschuss je Signal ' + vz(p.jeSignalPp, 3).replace('−', '-') + ' Pp') !== -1 ||
    beleg.indexOf('Überschuss je Signal ' + (p.jeSignalPp >= 0 ? '+' : '-') + dez(Math.abs(p.jeSignalPp), 3) + ' Pp') !== -1;
  var halte = /Haltedauer (.*?) Produkt/.exec(txt);
  return { abweichung: ohne.length > 0 || !protoSatz, text: 'Beleg-Zeile: "' + beleg.slice(0, 420) + '…". ' +
    (ohne.length ? 'Zahlen ohne Gegenstueck im massgeblichen Protokoll/belegstand.md: ' + ohne.join(', ') + ' (' + herkunft + '). ' : '') +
    'Protokollzahl ' + (protoSatz ? 'steht richtig da' : 'FEHLT') + ' (' + vz(p.jeSignalPp, 3) + ' Pp, ' + p.aussichtTage80 + ' Signaltage). Haltedauer angezeigt: "' +
    (halte ? halte[1].trim() : '?') + '" (Messung: ' + p.halteKerzen + ' Kerzen ' + p.zeitrahmen + ' = Handelsstunden).' };
});

/* F2-03 Kostenhuerde: Huerde, je Signal, netto gegen das Protokoll. */
test('F2-03 Kostenhuerde (huerdeAnzeigen ausgefuehrt, Aktie 1x, 480 min)', async function () {
  var sb = depotSandbox({ protokolle: alleRsiProtokolle() });
  await sb.kantenAusProtokollen();
  var txt = sichtbar(sb.el('kostenHuerde').innerHTML), p = sollProtokoll(), rot = [];
  var mH = /Kostenhürde: (\d+,\d+) Pp je Umlauf/.exec(txt), mJ = /Überschuss je Signal ([+-]\d+,\d+) Pp/.exec(txt), mN = /netto ([+-]\d+,\d+) Pp/.exec(txt);
  var mHd = /Haltedauer (\d+) h/.exec(txt);
  if (!mH || mH[1] !== dez(p.kostenUmlaufPp, 3)) rot.push('Huerde ' + (mH && mH[1]) + ' statt ' + dez(p.kostenUmlaufPp, 3));
  if (!mJ || mJ[1] !== (p.jeSignalPp >= 0 ? '+' : '-') + dez(Math.abs(p.jeSignalPp), 3)) rot.push('je Signal ' + (mJ && mJ[1]));
  if (!mN || mN[1] !== (p.nettoPp >= 0 ? '+' : '-') + dez(Math.abs(p.nettoPp), 3)) rot.push('netto ' + (mN && mN[1]) + ' statt ' + dez(p.nettoPp, 3));
  if (!mHd || Number(mHd[1]) !== p.halteKerzen) rot.push('Haltedauer ' + (mHd && mHd[1]));
  if (txt.indexOf('Urteil der Messmaschine: nicht entscheidbar') === -1) rot.push('Urteilssatz fehlt');
  return { abweichung: rot.length > 0, text: (rot.length ? rot.join('; ') + '. ' : '') + 'Anzeige: Huerde ' + (mH && mH[1]) + ' Pp (Protokoll kosten.jeUmlaufAnteil ' +
    dez(p.kostenUmlaufPp, 3) + '), je Signal ' + (mJ && mJ[1]) + ' Pp, netto ' + (mN && mN[1]) + ' Pp (Protokoll nettoJeSignalBestaetigung ' + vz(p.nettoPp, 3) +
    '), Haltedauer ' + (mHd && mHd[1]) + ' h, Urteil "nicht entscheidbar", Netto-Zahl in Warnfarbe.' };
});

/* F2-04 Klartext-Karte (renderKlartext) mit und ohne Protokoll im Datenordner. */
test('F2-04 Klartext-Karte (renderKlartext ausgefuehrt): Messsatz mit Protokoll, Rueckfall ohne Protokoll', async function () {
  var p = sollProtokoll(), set = zahlenMitFundstelle();
  var mit = depotSandbox({ protokolle: alleRsiProtokolle() }); await mit.kantenAusProtokollen(); mit.renderKlartext();
  var ohneP = depotSandbox({ protokolle: [] }); await ohneP.kantenAusProtokollen(); ohneP.renderKlartext();
  var tMit = sichtbar(mit.el('idKlartext').innerHTML), tOhne = sichtbar(ohneP.el('idKlartext').innerHTML);
  var schein = depotSandbox({ protokolle: alleRsiProtokolle() }); await schein.kantenAusProtokollen();
  schein.D.intraday.instrument = 'schein'; schein.renderKlartext();
  var tSchein = sichtbar(schein.el('idKlartext').innerHTML);
  var zMit = zahlenOhneFundstelle(tMit, set), zOhne = zahlenOhneFundstelle(tOhne, set), zSchein = zahlenOhneFundstelle(tSchein, set);
  var protoOk = tMit.indexOf('Überschuss je Signal ' + (p.jeSignalPp >= 0 ? '+' : '-') + dez(Math.abs(p.jeSignalPp), 3) + ' Pp') !== -1;
  return { abweichung: zOhne.length > 0 || zSchein.length > 0 || !protoOk || zMit.length > 0,
    text: 'mit Protokoll: Messsatz ' + (protoOk ? 'aus ' + p.name + ' (' + vz(p.jeSignalPp, 3) + ' Pp)' : 'FEHLT') +
      (zMit.length ? ', Zahlen ohne Fundstelle ' + zMit.join(', ') : ', keine Zahl ohne Fundstelle') +
      '; OHNE Protokoll: "' + tOhne.slice(marke(tOhne, 'Backtest'), marke(tOhne, 'veralten.') + 8) + '" - ohne Fundstelle: ' + (zOhne.join(', ') || '-') +
      '; mit Hebelschein: "' + tSchein.slice(marke(tSchein, 'Achtung'), marke(tSchein, '−96 %') + 5) + '" - ohne Fundstelle: ' + (zSchein.join(', ') || '-') +
      ' (belegstand: kein Vorsprung belegt, je Signal ' + vz(p.jeSignalPp, 3) + ' Pp).' };
});

/* F2-05 Regeln-Reiter, Erklaerung "Was hier gehandelt wird" (index.html, statisch sichtbar). */
test('F2-05 index.html "Was hier gehandelt wird": +0,147 Pp, 162 Werte, Zeithaelften, Huerden-Satz', async function () {
  var p = sollProtokoll(), set = zahlenMitFundstelle();
  var a = htmlAbschnitt('index.html', 'Zwei Einstiege sind gemessen.', 'Nur Long, weil das Gegenstück gegen die Marktdrift kämpft.');
  var b = htmlAbschnitt('index.html', '<b>Instrument:</b> gemessen wurde mit der Aktie selbst', 'nicht zum Tagesschluss.');
  var zA = zahlenOhneFundstelle(a.text, set), zB = zahlenOhneFundstelle(b.text, set);
  var zeithaelften = /in beiden\s+Zeithälften positiv/.test(a.text);
  var ueberHuerde = /Vorsprung liegt über der Aktien-Kostenhürde/.test(b.text);
  return { abweichung: zA.length > 0 || zB.length > 0 || zeithaelften || ueberHuerde,
    text: 'index.html:' + a.zeile + ' Zahlen ohne Fundstelle: ' + (zA.join(', ') || '-') + (zeithaelften ? '; "in beiden Zeithälften positiv" - Protokoll: Entdeckung je Signal ' +
      vz(p.entdJeSignalPp, 3) + ' Pp, Bestätigung ' + vz(p.jeSignalPp, 3) + ' Pp' : '') + ' (Soll ' + p.name + ': ' + vz(p.jeSignalPp, 3) + ' Pp je Signal auf ' + tausend(p.werte) +
      ' Werten, ' + p.urteil + '). index.html:' + b.zeile + ' Zahlen ohne Fundstelle: ' + (zB.join(', ') || '-') +
      (ueberHuerde ? '; "Der gemessene Vorsprung liegt über der Aktien-Kostenhürde (0,10 %)" - Protokoll: ' + vz(p.jeSignalPp, 3) + ' gegen ' + dez(p.kostenUmlaufPp, 2) +
        ' Pp Kosten, netto ' + vz(p.nettoPp, 3) + ' Pp' : '') + '.' };
});

/* F2-06 Beobachtungs-Pool (index.html, title und Option): 99 Werte, +0,235 statt +0,147. */
test('F2-06 Beobachtungs-Pool (index.html): "99 gemessene Werte", "+0,235 statt +0,147"', async function () {
  var p = sollProtokoll(), set = zahlenMitFundstelle();
  var t = titleUm('index.html', 'Beobachtungs-Pool<select id="idPool">');
  var h = lies('index.html'), iO = marke(h, '<option value="volatil">'), opt = sichtbar(h.slice(iO, marke(h, '</option>', iO)));
  var iS = marke(h, '<option value="auto" selected>'), std = sichtbar(h.slice(iS, marke(h, '</option>', iS)));
  var z = zahlenOhneFundstelle(t.text + ' ' + opt + ' ' + std, set).filter(function (x) { return !/^(15|12|33)$/.test(normZahl(x)); });
  var nWerte = /(\d+) Werte, auf denen gemessen wurde/.exec(t.text);
  return { abweichung: z.length > 0 || (nWerte && Number(nWerte[1]) !== p.werte),
    text: 'index.html:' + t.zeile + ' "' + opt + '" / "' + std + '"; Zahlen ohne Fundstelle: ' + (z.join(', ') || '-') + '. Protokoll ' + p.name + ': gemessen auf ' +
      tausend(p.werte) + ' Werten (' + p.j.universum.herkunft + '), je Signal ' + vz(p.jeSignalPp, 3) + ' Pp; eine Teilmessung "volatiles Drittel" gibt es in keinem Protokoll.' };
});

/* F2-07 Auswahl-Beschriftungen: Urteilswort und Haltedauer. */
test('F2-07 Auswahl-Beschriftungen: "(gemessen, nicht bestätigt)" und "8 h (RSI2-Seitwärts, gemessen)"', async function () {
  var p = sollProtokoll(), U = Uattrappe(), h = lies('index.html');
  var iO = marke(h, '<option value="rsi2seit">RSI(2) im Seitwärtskanal ('), opt = sichtbar(h.slice(iO, marke(h, '</option>', iO)));
  var iH = marke(h, '<select id="idHold">'), sel = h.slice(iH, marke(h, '</select>', iH));
  var m480 = /<option value="480"[^>]*>([^<]*)</.exec(sel);
  var wortProt = U.urteilText(p.urteil), wortAnz = /\(gemessen, ([^)]*)\)/.exec(opt);
  var haltOk = m480 && /gemessen/.test(m480[1]) && 480 === p.halteKerzen * 60;
  var falschWort = !wortAnz || wortAnz[1] !== wortProt;
  return { abweichung: falschWort || !haltOk,
    text: 'index.html:' + zeileVon(h, iO) + ' "' + opt + '" - Protokoll-Urteil "' + wortProt + '"' + (falschWort ? '; "nicht bestätigt" ist ein ANDERES Maschinenurteil (' +
      U.urteilText('nicht-bestaetigt') + ' = gemessen, Nachweis nicht erbracht; vgl. depot.js regelKopfAnzeigen-Hinweis)' : '') +
      '. Haltedauer-Option "' + (m480 && m480[1]) + '" = 480 min = ' + p.halteKerzen + ' Kerzen ' + p.zeitrahmen + (haltOk ? ' - stimmt' : ' - weicht ab') + '.' };
});

/* F2-08 Strategie-Karte "Kurzfristig · Intraday" (strategien.js): Stand, Instrument, Belege hinter dem i. */
test('F2-08 Strategie-Karte Intraday (strategien.js): Belege hinter dem i, Instrument-Zeile', async function () {
  var src = lies('strategien.js'), p = sollProtokoll(), set = zahlenMitFundstelle();
  var block = schneide(src, "key: 'kurz',".replace("key: 'kurz',", "{\n      key: 'kurz',"));
  var lits = stringsVon(block);
  var stand = lits.filter(function (s) { return /nicht entscheidbar/.test(s) && s.length < 80; })[0] || '';
  var befunde = [];
  lits.forEach(function (s) {
    if (/KAPITULATIONS-DIP|Kapitulations-Teil|Donchian/.test(s)) return;    // andere Arme / Regime mit Vermerk - eigener Test
    var z = zahlenOhneFundstelle(s, set);
    if (z.length) befunde.push('"' + s.slice(0, 60) + '…": ' + z.join(', '));
  });
  var kontroll = lits.filter(function (s) { return /KONTROLLMESSUNG 23\.08\.2026/.test(s); })[0] || '';
  var a823 = protokoll('rsi2seit-2026-08-23.json').ergebnisse[0].bestaetigung.ueberschuss;
  var behauptung = lits.filter(function (s) { return /Der Vorsprung liegt ÜBER der Basiswert-Hürde/.test(s); }).length > 0;
  var kante = lits.filter(function (s) { return /stirbt die Kante/.test(s); }).length > 0;
  return { abweichung: befunde.length > 0 || behauptung,
    text: 'Stand-Chip "' + stand + '" stimmt mit ' + p.urteil + '. Belege mit Zahlen ohne Fundstelle in belegstand.md/' + p.name + ': ' + befunde.length + ' - ' + befunde.join(' | ') +
      '. Die "KONTROLLMESSUNG 23.08.2026" nennt +0,024 / 0,182 / −0,045 - weder das massgebliche Protokoll (' + vz(p.tagesmittelPp, 3) + ' / MDE ' + dez(p.mdePp, 3) + ' / ' +
      vz(p.jeSignalPp, 3) + ') noch rsi2seit-2026-08-23.json (' + vz(a823.tagesmittel * 100, 3) + ' / ' + dez(a823.mde * 100, 3) + ' / ' + vz(a823.jeSignal * 100, 3) + ')' +
      (kontroll ? '' : ' [Satz nicht gefunden]') + (behauptung ? '; Gegenwart "Der Vorsprung liegt ÜBER der Basiswert-Hürde (0,10 %)" gegen netto ' + vz(p.nettoPp, 3) + ' Pp' : '') +
      (kante ? '; Instrument-Zeile "mit Schein stirbt die Kante (−96 %)" nennt eine Kante, die nicht belegt ist' : '') + '.' };
});

/* F2-09 Aktien-Explorer (explorer.js): "+0,017", "Hauptstrategie", "Trägt erst mit der Erlaubnis". */
test('F2-09 Aktien-Explorer RSI(2)-Hinweis (explorer.js)', async function () {
  var p = sollProtokoll(), set = zahlenMitFundstelle();
  var l = literalMit('explorer.js', 'Roh ein Münzwurf');
  var z = zahlenOhneFundstelle(l.text, set);
  var woerter = ['Hauptstrategie', 'Trägt erst'].filter(function (w) { return l.text.indexOf(w) !== -1; });
  return { abweichung: z.length > 0 || woerter.length > 0,
    text: 'explorer.js:' + l.zeile + ' "' + l.text + '" - Zahlen ohne Fundstelle: ' + (z.join(', ') || '-') + '; Woerter gegen "' + p.urteil + '": ' + (woerter.join(', ') || '-') +
      ' (Protokoll: ' + vz(p.jeSignalPp, 3) + ' Pp je Signal, CLAUDE.md: null belegte Kanten).' };
});

/* F2-10 Regime-Zahlen (RSI-Teil +0,148 / -0,169): stimmen sie, und steht der Vermerk "nicht neu gemessen" dabei? */
test('F2-10 Regime-Zuteilung: RSI-Teil +0,148/−0,169 an jeder sichtbaren Stelle mit Vermerk', async function () {
  var md = lies('wiki/belegstand.md'), i = marke(md, 'Der RSI-Teil für sich (in der App genannt: ');
  var m = /\(in der App genannt: ([+−-]\d+,\d+) Pp über, ([+−-]\d+,\d+) Pp unter der Linie\)/.exec(md.slice(i, i + 200));
  if (!m) throw new Error('belegstand.md: RSI-Teil-Zahlen nicht lesbar');
  var ueb = m[1], unt = m[2];
  function rund2(s) { return dez(Math.abs(Number(s.replace('−', '-').replace(',', '.'))), 2); }
  var stellen = [
    ['strategien.js', literalMit('strategien.js', 'Zuschaltbar seit Version 8.23.26: die Regime-Zuteilung')],
    ['index.html', titleUm('index.html', '<input type="checkbox" id="idRegime">')],
    ['depot.js', literalMit('depot.js', 'RSI(2) im Seitwärtskanal pausiert (verliert dort')]
  ];
  var rot = [], ok = [];
  stellen.forEach(function (s) {
    var t = s[1].text;
    var zahlOk = t.indexOf(ueb) !== -1 || t.indexOf('+' + rund2(ueb)) !== -1;
    var zahlU = t.indexOf(unt) !== -1 || t.indexOf('−' + rund2(unt)) !== -1;
    var vermerk = /nicht neu gemessen/.test(t);
    var wo = s[0] + ':' + s[1].zeile;
    if (!zahlU) rot.push(wo + ' Zahl unter der Linie fehlt/abweichend');
    if (!vermerk) rot.push(wo + ' ohne Vermerk "nicht neu gemessen": "' + t.slice(0, 140) + '"');
    else ok.push(wo + (zahlOk ? ' (+über)' : ''));
  });
  return { abweichung: rot.length > 0, text: 'Soll belegstand.md:' + zeileVon(md, i) + ' ' + ueb + ' / ' + unt + ' Pp, "weder bestätigt noch widerlegt". Mit Vermerk: ' +
    (ok.join(', ') || '-') + '. ' + (rot.length ? 'Ohne: ' + rot.join(' | ') : '') };
});

/* F2-11 Edge-Waechter: Wortlaut ("gemessener Vorsprung", "im Rahmen der Studie") und Messart (t ueber Symbole). */
test('F2-11 Edge-Waechter (edgeZustand ausgefuehrt auf Kunstarchiv; Warnband/Meldungen aus depot.js)', async function () {
  var p = sollProtokoll(), H = 3600000, syms = ['A1', 'A2', 'A3', 'A4', 'A5', 'A6'];
  var Archiv = { serie: async function (iv, sym) {
    var k = syms.indexOf(sym), bars = [];
    for (var i = 0; i < 400; i++) bars.push([UHR - (400 - i) * H, 100 + (i % 10) * 0.1 * (1 + k * 0.1)]);
    return bars;
  } };
  var Q = { einstiegSignal: function (bars, i) { return i % 10 === 0 ? { dir: 'call' } : null; } };
  var sb = depotSandbox({ Archiv: Archiv, Q: Q, messUniversum: function () { return syms; } });
  sb.win.Archiv = Archiv;
  var r = await sb.edgeZustand('rsi2seit');
  var dep = lies('depot.js');
  var band = literalMit('depot.js', 'pausiert</b> – der gemessene Vorsprung ist in zwei Nächten').text;
  var melde = literalMit('depot.js', 'Der gemessene Vorsprung von ').text;
  var shell = literalMit('app-shell.js', 'Edge-Wächter</b> prüft auf dem vollen Handels-Universum').text;
  var woerter = [];
  if (/im Rahmen der Studie/.test(r.txt)) woerter.push('"im Rahmen der Studie" (welcher? die Studie vom 21.08. mit +0,147/t 4,1 hat keine Fundstelle; das Protokoll sagt ' + p.urteil + ')');
  if (/gemessene Vorsprung/.test(band)) woerter.push('Warnband "der gemessene Vorsprung ist … verfallen"');
  if (/gemessene Vorsprung/.test(melde)) woerter.push('Journal/Meldung "Der gemessene Vorsprung von …"');
  if (/noch trägt/.test(shell)) woerter.push('app-shell "ob der Überschuss … noch trägt"');
  var methode = /t über Symbole/.test(r.txt) && p.kontrolle !== 'drift-symbol';
  return { abweichung: woerter.length > 0 || methode,
    text: 'Waechter-Text: "' + r.txt + '". Wortlaut gegen "' + p.urteil + '": ' + (woerter.join('; ') || '-') + '. Messart: Waechter = Drift des Symbols, t ueber Symbole, ' +
      'Einstieg zum Schluss Kerze i bis i+8; Messmaschine = Kontrolle "' + p.kontrolle + '", t ueber Tage geclustert (CLAUDE.md) - die Waechterzahl ist eine andere Groesse als die Protokollzahl.' };
});

/* F2-12 Zahlen in app-shell.js (Erklaertexte der Pillen), die rsi2seit betreffen. */
test('F2-12 app-shell.js Erklaertexte zu RSI(2) im Seitwärtskanal: Zahlen mit Fundstelle', async function () {
  var src = lies('app-shell.js'), set = zahlenMitFundstelle(), befunde = [], gesehen = 0;
  stringsVon(src).forEach(function (s) {
    if (!/RSI\(2\) im Seitwärtskanal|RSI\(2\)-Modus/.test(s)) return;
    gesehen++;
    var z = zahlenOhneFundstelle(s.replace(/26 (beim|für den) Kapitulations-Dip|26 Handelsstunden|03\.10\.2026/g, ' '), set);
    if (z.length) befunde.push('app-shell.js:' + zeileVon(src, marke(src, s.slice(0, 60))) + ' ' + z.join(', ') + ' in "' + s.slice(0, 110) + '…"');
  });
  return { abweichung: befunde.length > 0, text: gesehen + ' sichtbare Texte geprueft; ohne Fundstelle: ' + (befunde.join(' | ') || '-') +
    '. Die Haltedauer "8 Handelsstunden" stimmt mit haltedauerKerzen 8 / 60m.' };
});

/* F2-13 Nur Kommentare: Zahlen in depot.js/quant.js, die nirgends belegt sind (hoechstens C). */
test('F2-13 Kommentare mit alten Messzahlen (depot.js, quant.js) - nicht sichtbar', async function () {
  var set = zahlenMitFundstelle(), aus = [];
  [['depot.js', /\+0,147|\+0,235|t = 4,1|t=1,9|\+0,017|\+0,073|−?-?0,169|\+0,148|belegte Hauptstrategie|BELEGTE Strategie|den belegten Edge/],
   ['quant.js', /\+0,147|\+0,235|t = 4,1|\+0,017/]].forEach(function (x) {
    kommentareVon(lies(x[0])).forEach(function (k) {
      var m = x[1].exec(k.text);
      if (m) aus.push(x[0] + ':' + (k.zeile + k.text.slice(0, m.index).split('\n').length - 1) + ' "' + m[0] + '"');
    });
  });
  var sichtbarAuch = stringsVon(lies('quant.js')).filter(function (s) { return /0,147|4,1/.test(s); }).length;
  void set;
  return { abweichung: aus.length > 0, text: 'nur in Kommentaren: ' + aus.join(', ') + (sichtbarAuch ? '' : ' (quant.js zeigt keine davon in einem String)') +
    '. FEHLERTYPEN.md D2 nennt "0,11 / 0,147 / 0,170" als drei Werte derselben Kante in Umlauf - Kommentarstand, Bewertung C.' };
});

/* F2-14 Ohne Zahl, ohne Behauptung: Scan-Kopf und Intraday-Karte. */
test('F2-14 Scan-Kopf (scanKopfText) und Intraday-Karte (renderIntradayKarte) ausgefuehrt: keine Regel-Zahl, kein Beleg-Wort', async function () {
  var sb = depotSandbox({ HEALTH: { lastScanT: UHR - 600000 } });
  var kopf = sb.scanKopfText();
  sb.renderIntradayKarte();
  var karte = sichtbar(sb.el('buchIntradayKopf').innerHTML);
  var schlecht = /Pp|belegt|validiert|Kante|Vorsprung|gemessen/.test(kopf + ' ' + karte);
  return { abweichung: schlecht, text: 'Scan-Kopf "' + kopf + '", Karte "' + karte.slice(0, 160) + '…" - ' + (schlecht ? 'enthaelt ein Beleg-Wort' : 'keine Zahl zur Regel, kein Beleg-Wort') + '.' };
});

/* F2-15 Not-Stopp: angezeigter Wert gegen die Messung. */
test('F2-15 Not-Stopp und Ausstieg: Anzeige gegen Messung', async function () {
  var sb = depotSandbox({ protokolle: alleRsiProtokolle() }); await sb.kantenAusProtokollen();
  var txt = sichtbar(sb.el('regelKopf').innerHTML), p = sollProtokoll();
  var mS = /Not-Stop\s*(\d+\s*%)/.exec(txt);
  sb.renderKlartext();
  var kt = sichtbar(sb.el('idKlartext').innerHTML);
  var kAus = /Ausstieg nach (\d+) Handelsstunden, darunter nur ein Not-Stop/.exec(kt);
  var behauptetGemessen = /Not-Stop[^.]*gemessen/.test(txt + kt);
  return { abweichung: !kAus || Number(kAus[1]) !== p.halteKerzen || behauptetGemessen,
    text: 'Regelkopf Not-Stop ' + (mS ? mS[1] : '?') + ', Klartext "' + (kAus ? kAus[0] : '?') + '". Messung: Ausstieg ' + JSON.stringify(p.ausstieg) +
      ' ohne Stopp; die Anzeige behauptet fuer den Stopp keine Messung' + (behauptetGemessen ? ' - DOCH' : '') + ' (ob der Live-Stopp den Messwert veraendert, ist Frage 1).' };
});

module.exports = TESTS;

if (require.main === module) {
  (async function () {
    for (var i = 0; i < TESTS.length; i++) {
      var t = TESTS[i], r;
      try { r = await t.lauf(); } catch (e) { r = { abweichung: true, text: 'TEST DEFEKT: ' + String(e && e.message || e) }; }
      console.log((r.abweichung ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + t.name + ' — ' + String(r.text).replace(/\s+/g, ' '));
    }
  })();
}
