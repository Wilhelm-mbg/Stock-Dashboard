'use strict';
/* Pruefbericht "Live gegen Messung" - INTRADAY-DEPOT, Frage 1: Handelt depot.js genau die
 * gemessene Regel rsi2seit?
 *
 * SOLL-SEITE (die Messung):
 *   studien/messmaschine/strategien/rsi2seit.js  - Signal = Q.einstiegSignal(bars, i, P) mit
 *       P = { ENTRY:'rsi2seit', LINE:'ema', period:20, confirmBps:15, ZTHR:1.5, MINQ:0,
 *             CHAN:false, MTF:false, TREND:false }, nur Long, zeitrahmen '60m',
 *       haltedauerKerzen 8, kosten.spanneBp 5, leseFensterKerzen 261.
 *   studien/messmaschine/messmaschine.js - Einstieg einstiegKurs(b, i, 'schlusskerze') = Schluss
 *       der Signalkerze, Ausstieg ausstiegKurs(b, i + 8, 'schluss') = Schluss der 8. Folgekerze,
 *       JEDES Signal jeder Kerze zaehlt (keine Abklingzeit, kein Positionsdeckel), kein Stop,
 *       Kosten 2 x 5 Bp je Umlauf, Universum: alles im Archiv ausser -USD.
 * IST-SEITE (der Live-Pfad): depot.js intradayScan() - echt ausgefuehrt in einer vm-Sandbox.
 *   depot.js wird UNVERAENDERT gelesen; beim Laden wird VOR der Zeile "init().catch(" ein
 *   Ausgang eingefuegt (window.__intern), und reine Randfunktionen (Speichern, Zeichnen,
 *   Schattenbuch, Melden, Termin-Abruf, Universum) werden auf Attrappen umgelenkt. Der
 *   Handelspfad selbst (Kursabruf -> fertigeBars -> einstiegSignal -> Filter -> Kauf ->
 *   Ausstiegspruefung -> closeTrade) laeuft woertlich. Kursabruf (window.Kurse.hole), Archiv
 *   (archiv.js echt, Speicher als Attrappe), Uhr (Date je Datei ersetzt), Boerse (boerse.js
 *   echt) und Marktoeffnung (usMarketOpen aus renderer.js herausgeschnitten) sind gestellt.
 * Kunstkerzen: Wertverlauf wie in test-v6.js (Strategie-Chart #52) - Aufwaertsdrift mit
 *   Dips und Volumenspitzen, erzeugt rsi2seit-Signale. Die Zeitstempel werden NACHTRAEGLICH
 *   vergeben (das Signal haengt nur an Schluss und Volumen, nicht an der Uhrzeit) - so laesst
 *   sich ein Signal gezielt auf eine bestimmte Kerze eines bestimmten Tages legen.
 *   Stempel wie Yahoo: Kerzenbeginn 9:30, 10:30, ... 15:30 New York (die letzte ist eine
 *   halbe Stunde lang), UTC-Millisekunden.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/live-gegen-messung-intraday/frage1-regel.test.js
 * Wurzel: PRUEF_WURZEL=<Ordner> nimmt die Module von dort.
 * Reines Node, kein Netz, keine Schluessel. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
process.env.TZ = 'Europe/Berlin';          // die App laeuft auf einem Rechner in Deutschland
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..', '..');
var QN = require(path.join(WURZEL, 'quant.js'));              // reine Rechnung (Soll-Seite)
var BOERSE = require(path.join(WURZEL, 'boerse.js'));
var ARCHIV_KERN = require(path.join(WURZEL, 'archiv.js'));
var STRAT = require(path.join(WURZEL, 'studien', 'messmaschine', 'strategien', 'rsi2seit.js'));
var STRAT_MCP = require(path.join(WURZEL, 'studien', 'messmaschine', 'strategien', 'rsi2seit-mcp.js'));
var MESS_QUELLE = fs.readFileSync(path.join(WURZEL, 'studien', 'messmaschine', 'messmaschine.js'), 'utf8');
var DEPOT_QUELLE = fs.readFileSync(path.join(WURZEL, 'depot.js'), 'utf8');
var H = STRAT.haltedauerKerzen;                                // 8
var SPANNE = STRAT.kosten.spanneBp / 10000;                    // 5 Bp je Seite
var STD = 3600000, MIN = 60000, TAG = 86400000;

/* ---------------- Hilfen: Quelltext ---------------- */
function schneide(quelle, von, bis, wer) {
  var a = quelle.indexOf(von);
  if (a < 0) throw new Error('Textmarke nicht gefunden (' + wer + '): ' + von);
  var b = bis == null ? quelle.length : quelle.indexOf(bis, a + von.length);
  if (b < 0) throw new Error('Endmarke nicht gefunden (' + wer + '): ' + bis);
  return quelle.slice(a, b);
}
function zeileVon(quelle, marke) {
  var a = quelle.indexOf(marke);
  if (a < 0) return null;
  return quelle.slice(0, a).split('\n').length;
}

/* ---------------- Hilfen: Kalender und Kunstkerzen ---------------- */
/** Eroeffnung (UTC-ms) eines US-Handelstags; null an Wochenende/Feiertag. */
function oeffnungUTC(tagMs) {
  if (!BOERSE.istHandelstag(tagMs)) return null;
  var d = new Date(tagMs);
  var t1330 = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 13, 30);
  return QN.minutenSeitOeffnung(t1330) === 0 ? t1330 : t1330 + STD;
}
/** Kerzenstempel eines Handelstags wie Yahoo 60m: 9:30, 10:30, ... (letzte ggf. kuerzer). */
function kerzenDesTags(tagMs) {
  var o = oeffnungUTC(tagMs);
  if (o == null) return [];
  var laenge = BOERSE.sitzungsMinuten(o);
  var aus = [];
  for (var m = 0; m < laenge; m += 60) aus.push(o + m * MIN);
  return aus;
}
/** Ende (UTC-ms) der Kerze mit Stempel t. */
function kerzenEnde(t) {
  var o = oeffnungUTC(t), laenge = BOERSE.sitzungsMinuten(t);
  return Math.min(t + STD, o + laenge * MIN);
}
function tagUTC(j, m, t) { return Date.UTC(j, m - 1, t); }
/** n Stempel so, dass Index sIdx auf Kerze pos (0 = 9:30) des Tages zielTag faellt. */
function stempelUm(zielTag, pos, sIdx, n) {
  var vor = [], nach = [];
  var heute = kerzenDesTags(zielTag);
  if (!heute.length || pos >= heute.length) throw new Error('Zieltag/Position ungueltig');
  var t, k;
  vor = heute.slice(0, pos).reverse();
  for (t = zielTag - TAG; vor.length < sIdx; t -= TAG) { k = kerzenDesTags(t).reverse(); vor = vor.concat(k); }
  vor = vor.slice(0, sIdx).reverse();
  nach = heute.slice(pos);
  for (t = zielTag + TAG; vor.length + nach.length < n; t += TAG) nach = nach.concat(kerzenDesTags(t));
  return vor.concat(nach).slice(0, n);
}
/** Wertverlauf wie test-v6.js (Strategie-Chart #52) - erzeugt rsi2seit-Signale. */
function kunstWerte(n, verschiebung, ausschlag, volFaktor) {
  var aus = [], v = verschiebung || 0, f = ausschlag == null ? 1 : ausschlag, vf = volFaktor == null ? 1 : volFaktor;
  for (var bi = 0; bi < n; bi++) {
    var j = bi + v;
    var pr = 100 + f * (j * 0.012 + Math.sin(j / 11) * 1.6 + Math.sin(j / 3.3) * 0.9);
    aus.push({ c: pr, v: vf * (100000 + (j % 17 === 0 ? 400000 : 0) + (j % 5) * 6000) });
  }
  return aus;
}
/** Messung (Soll): Signalindizes nach rsi2seit.js auf einer Reihe [t, c, v, h, l]. */
function sollSignale(bars, ab) {
  var aus = [];
  for (var i = Math.max(ab || 0, 261); i < bars.length; i++) {
    var s = null;
    try { s = STRAT.signal(bars, i); } catch (e) { s = null; }
    if (s && s.dir > 0) aus.push(i);
  }
  return aus;
}
/** Reihe mit Eroeffnungskursen: innerhalb des Tages Schluss der Vorkerze x (1 + 0,3 %),
 *  ueber Nacht x (1 + nachtLuecke). Volle Zeile wie Kurse.hole: [t, c, v, h, l, o]. */
function baueReihe(werte, stempel, nachtLuecke) {
  var bars = [];
  for (var i = 0; i < werte.length; i++) {
    var c = werte[i].c;
    var vorC = i ? werte[i - 1].c : c;
    var neuerTag = i && new Date(stempel[i]).toISOString().slice(0, 10) !== new Date(stempel[i - 1]).toISOString().slice(0, 10);
    var o = i ? vorC * (1 + (neuerTag ? (nachtLuecke == null ? 0.02 : nachtLuecke) : 0.003)) : c;
    bars.push([stempel[i], c, werte[i].v, Math.max(c, o) * 1.001, Math.min(c, o) * 0.999, o]);
  }
  return bars;
}
/** Sicht des Kursabrufs zur Zeit jetzt: alle Kerzen mit Stempel <= jetzt; die laufende
 *  Kerze traegt als Schluss ihren Eroeffnungskurs (so steht der Kurs eine Minute nach
 *  Kerzenbeginn), Volumen klein. */
function sichtZu(bars, jetzt) {
  var aus = [];
  for (var i = 0; i < bars.length && bars[i][0] <= jetzt; i++) {
    var b = bars[i];
    if (jetzt < kerzenEnde(b[0])) aus.push([b[0], b[5], Math.round(b[2] * 0.05), b[5], b[5], b[5]]);
    else aus.push(b.slice());
  }
  return aus;
}
function ny(j, m, t, h, min) {          // New-Yorker Wanduhr -> UTC-ms (Sommer/Winter aus quant.js)
  var probe = Date.UTC(j, m - 1, t, 13, 30);
  var sommer = QN.minutenSeitOeffnung(probe) === 0;
  return Date.UTC(j, m - 1, t, h + (sommer ? 4 : 5), min || 0);
}
function zeitNY(ms) {
  var d = new Date(ms), s = new Date(ms + (QN.minutenSeitOeffnung(ms) - ((d.getUTCHours() * 60 + d.getUTCMinutes()) - 570)) * MIN);
  /* Rueckrechnung: Minuten seit Oeffnung + 9:30 = Wanduhr New York */
  var m = QN.minutenSeitOeffnung(ms) + 570;
  var tagStr = s.toISOString().slice(5, 10);
  return tagStr.slice(3) + '.' + tagStr.slice(0, 2) + '. ' + String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(((m % 60) + 60) % 60).padStart(2, '0') + ' NY';
}
function pp(x) { return (x >= 0 ? '+' : '') + (x * 100).toFixed(3) + ' %'; }

/* ---------------- Sandbox: depot.js echt, Raender als Attrappe ---------------- */
function uhr(jetzt) {
  var Uh = function (x) {
    if (!(this instanceof Uh)) return new Date(Uh.jetzt).toString();
    if (arguments.length === 0) return new Date(Uh.jetzt);
    if (arguments.length === 1) return new Date(x);
    return new (Function.prototype.bind.apply(Date, [null].concat(Array.prototype.slice.call(arguments))))();
  };
  Uh.now = function () { return Uh.jetzt; }; Uh.jetzt = jetzt; Uh.UTC = Date.UTC; Uh.parse = Date.parse;
  Uh.prototype = Date.prototype;
  return Uh;
}
/** Allesfresser fuer DOM und unbeteiligte Module: jede Eigenschaft, jeder Aufruf geht. */
function fresser() {
  var f = function () { return fresser(); };
  return new Proxy(f, {
    get: function (t, k) {
      if (k === Symbol.toPrimitive) return function () { return ''; };
      if (k === 'then') return undefined;
      if (k in t) return t[k];
      return fresser();
    },
    set: function (t, k, v) { t[k] = v; return true; },
    apply: function () { return fresser(); }
  });
}
var RAND = [
  'scanUniverse = function () { return window.__syms.slice(); };',
  'naechsterTermin = async function (s) { return window.__termin ? window.__termin(s) : null; };',
  'save = async function () { };', 'render = function () { };', 'cockpitRender = function () { };',
  'renderSigMonitor = function () { };', 'renderSymBlocks = function () { };', 'updateSymBlocks = function () { };',
  'notifyTrade = function () { };', 'melde = function () { };', 'stoerungAnzeigen = function () { };',
  'schattenNeu = function (grund, sym) { (window.__schatten = window.__schatten || []).push(grund + "|" + sym); };',
  'schattenUpdate = function () { };', 'schattenAufraeumen = function () { };', 'regelnPruefen = function () { };',
  'runScreener = async function () { };'
].join('\n  ');
function depotSandbox(jetzt, reihen, o) {
  o = o || {};
  var Uh = uhr(jetzt);
  var speicher = {};
  var api = { storeGet: async function (k) { return speicher[k] ? JSON.parse(JSON.stringify(speicher[k])) : null; },
              storeSet: async function (k, v) { speicher[k] = JSON.parse(JSON.stringify(v)); return { ok: true }; } };
  var win = {
    api: api, Cal: o.cal || null, CapAPI: o.capAPI || null, Bugs: null,
    __syms: Object.keys(reihen), __termin: o.termin || null, __abrufe: [],
    BTPool: { pmap: async function (xs, f) { var r = []; for (var i = 0; i < xs.length; i++) r.push(await f(xs[i], i)); return r; } },
    Kurse: {
      kursOk: function (v) { return typeof v === 'number' && isFinite(v) && v > 0; },
      hole: async function (sym, opt) {
        win.__abrufe.push({ sym: sym, opt: opt });
        if (o.yahooStumm) return null;
        var r = reihen[sym]; if (!r) return null;
        var sicht = o.sicht ? o.sicht(sym, Uh.jetzt) : sichtZu(r, Uh.jetzt);
        var tiefe = opt && opt.range === '730d' ? sicht.length : 151;   // 60m range=1mo ~ 151 Kerzen
        return { bars: sicht.slice(-tiefe), verworfen: 0, gesamt: sicht.length, feld: 'close' };
      }
    }
  };
  var winP = new Proxy(win, { get: function (t, k) { if (k in t) return t[k]; if (typeof k === 'symbol') return undefined; return fresser(); } });
  var ctx = { window: winP, document: fresser(), console: console, __Uhr: Uh, Proxy: Proxy,
    setTimeout: function () { return 0; }, setInterval: function () { return 0; }, clearTimeout: function () { },
    clearInterval: function () { }, localStorage: fresser(), navigator: fresser(), requestAnimationFrame: function () { } };
  vm.createContext(ctx);
  function lade(datei, quelle) {
    vm.runInContext('(function (Date) {' + quelle + '\n})(__Uhr);', ctx, { filename: datei });
  }
  ['quant.js', 'risiko.js', 'boerse.js', 'archiv.js'].forEach(function (d) {
    lade(d, fs.readFileSync(path.join(WURZEL, d), 'utf8'));
  });
  /* usMarketOpen aus renderer.js - dieselbe Funktion, die window.Dash.marketOpen ist. */
  var rq = fs.readFileSync(path.join(WURZEL, 'renderer.js'), 'utf8');
  var mo = schneide(rq, '  function usMarketOpen() {', '\n  }\n', 'renderer.js usMarketOpen') + '\n  }\n';
  vm.runInContext('(function (Date) { window.Dash = { marketOpen: (function () {' + mo + ' return usMarketOpen; })(), ' +
    'quote: function () { return null; }, STOCKS: [] }; })(__Uhr);', ctx, { filename: 'renderer.js#usMarketOpen' });
  /* Archiv: archiv.js baut sich beim Laden selbst (root.Archiv = baueArchiv(root.api)).
   * Vorbelegung: die Kerzen VOR dem 1-Monats-Fenster, wie sie ein laufendes Archiv haette. */
  Object.keys(reihen).forEach(function (sym) {
    var vorher = sichtZu(reihen[sym], Uh.jetzt);
    if (o.archivLeer) return;
    speicher['bars_60m_' + sym] = { series: vorher.slice(0, Math.max(0, vorher.length - 100)).map(function (b) { return b.slice(0, 5); }) };
  });
  var src = DEPOT_QUELLE;
  var marke = '  init().catch(function (e) {';
  var k = src.indexOf(marke);
  if (k < 0) throw new Error('depot.js: Textmarke "init().catch" nicht gefunden');
  src = src.slice(0, k) + '  ' + RAND + '\n' +
    '  window.__intern = { intradayScan: intradayScan, setD: function (d) { D = d; }, getD: function () { return D; },\n' +
    '    defaultDepot: defaultDepot, modeParams: modeParams, zOf: zOf, positionsWert: positionsWert, bidOf: bidOf };\n' +
    '  return;\n' + src.slice(k);
  lade('depot.js', src);
  var I = win.__intern;
  var D = I.defaultDepot();
  D.intraday.enabled = true;
  D.maxRisikostufe = 5;
  Object.assign(D.intraday, o.cfg || {});
  if (o.D) o.D(D);
  I.setD(D);
  return { win: win, I: I, D: D, uhr: Uh, scan: async function (t) { Uh.jetzt = t; await I.intradayScan(); return I.getD(); } };
}
function offene(D, sym) { return D.positions.filter(function (p) { return p.strategy === 'intraday' && (!sym || p.sym === sym); }); }
function alleTrades(D, sym) { return D.trades.filter(function (p) { return p.strategy === 'intraday' && (!sym || p.sym === sym); }); }
/** Wartegruende des Scans (D.patience je Tag) flach: "Grund x n; ..." */
function patience(D) {
  var p = D.patience || {}, aus = [];
  Object.keys(p).forEach(function (tag) { Object.keys(p[tag] || {}).forEach(function (g) { aus.push(g + ' x' + p[tag][g]); }); });
  return aus.length ? aus.join('; ') : '(kein Wartegrund - kein Signal)';
}

/** Szenario: eine Reihe mit EINEM gewaehlten Signal auf (zielTag, pos). Liefert Reihe und Signalindex.
 *  Gesucht wird ein Signal s im Wertverlauf, bei dem in den H Kerzen davor und danach kein
 *  weiteres Signal liegt (sonst vermischen sich die Faelle). */
function szenario(zielTag, pos, o) {
  o = o || {};
  var n = 900, werte = kunstWerte(n, o.verschiebung || 0, o.ausschlag, o.volFaktor);
  var vorlauf = stempelUm(tagUTC(2026, 1, 5) + 0, 0, 0, n);         // nur fuer die Signalsuche
  var probe = baueReihe(werte, vorlauf, 0);
  var sig = sollSignale(probe, 300);
  var wahl = null;
  for (var q = 0; q < sig.length; q++) {
    var s = sig[q];
    if (s + H + 6 >= n) break;
    var frei = sig.every(function (x) { return x === s || Math.abs(x - s) > H + 2; });
    if (frei || o.mehrfach) { wahl = s; break; }
  }
  if (wahl == null) throw new Error('Kunstreihe ohne freistehendes Signal');
  var stempel = stempelUm(zielTag, pos, wahl, n);
  var bars = baueReihe(werte, stempel, o.nachtLuecke);
  if (o.nachSignal) o.nachSignal(bars, wahl);
  var kontrolle = sollSignale(bars, wahl - 2).filter(function (x) { return x <= wahl + H; });
  if (kontrolle.indexOf(wahl) < 0) throw new Error('Signal nach Neustempelung verschwunden - Testdefekt');
  return { bars: bars, s: wahl, signale: sollSignale(bars, 300) };
}
/** Die Messung fuer EIN Signal s: Einstieg Schluss(s), Ausstieg Schluss(s+8), netto nach 2 x 5 Bp. */
function sollTrade(bars, s) {
  var s0 = bars[s][1], sH = bars[s + H][1];
  return { einT: kerzenEnde(bars[s][0]), ein: s0, ausT: kerzenEnde(bars[s + H][0]), aus: sH,
           brutto: sH / s0 - 1, netto: sH / s0 - 1 - 2 * SPANNE };
}
/** Scans im 90-Sekunden-Takt waeren zu viele; gescannt wird je Kerze 1 Minute nach Beginn
 *  und 1 Minute nach Ende (dazwischen aendert sich an fertigen Kerzen nichts). */
function scanZeiten(bars, vonIdx, bisIdx) {
  var z = [];
  for (var i = vonIdx; i <= bisIdx && i < bars.length; i++) { z.push(bars[i][0] + MIN); z.push(kerzenEnde(bars[i][0]) + MIN); }
  return z.filter(function (t, j, a) { return a.indexOf(t) === j; }).sort(function (a, b) { return a - b; });
}
async function fahre(sb, zeiten) {
  for (var i = 0; i < zeiten.length; i++) await sb.scan(zeiten[i]);
  return sb.I.getD();
}

/* ======================================================================== */
var TESTS = [];
function test(name, lauf) { TESTS.push({ name: name, lauf: lauf }); }

/* F1-01 (a, d) Signalgleichheit: Auf derselben Kerze rechnet live dieselbe Funktion wie die
 * Messung? Live sieht die Reihe ueber Kursabruf (1 Monat) + Archiv (aelter); gerechnet wird
 * auf den fertigen Kerzen. Soll: rsi2seit.js signal() auf der Archivreihe. Gefahren wird ein
 * ganzer Handelstag (jede Kerze 1 min nach Beginn) und verglichen, auf WELCHER Kerze live ein
 * Signal erkennt (Einstieg) und auf welcher die Messung. Signal auf einer Mittagskerze, damit
 * F1-04 (Schlusskerze) und F1-05 nicht hineinspielen. */
test('F1-01 Signal: dieselbe Kerze, dieselbe Funktion (rsi2seit.js gegen intradayScan)', async function () {
  var sz = szenario(tagUTC(2026, 6, 10), 2);                       // Mittwoch, 11:30-Kerze
  var sb = depotSandbox(sz.bars[sz.s - 3][0], { KUNST: sz.bars });
  var zeiten = []; for (var i = sz.s - 2; i <= sz.s + 1; i++) zeiten.push(sz.bars[i][0] + MIN);
  var D = await fahre(sb, zeiten);
  var tr = alleTrades(D, 'KUNST');
  if (!tr.length) return { abweichung: true, text: 'Messung: Signal auf Kerze ' + zeitNY(sz.bars[sz.s][0]) + ', live kein Einstieg. Wartegruende: ' + patience(D) };
  var erwartetT = sz.bars[sz.s + 1][0] + MIN;                       // erster Scan nach Schluss der Signalkerze
  var gleich = tr.length === 1 && tr[0].openT === erwartetT;
  return { abweichung: !gleich, text: 'Messung: Signal auf der Kerze ' + zeitNY(sz.bars[sz.s][0]) + '; live: ' + tr.length +
    ' Einstieg(e), erster um ' + zeitNY(tr[0].openT) + ' (= erster Scan nach Kerzenschluss ' + (gleich ? 'ja' : 'NEIN') + ')' };
});

/* F1-02 (c) Parameter: live baut P mit ZTHR = zOf(15) = 2,0, die Messung mit ZTHR 1,5. Fuer
 * ENTRY 'rsi2seit' liest einstiegSignal ZTHR, LINE, confirmBps nicht (nur rsiExtremSignal +
 * kanalUeber + Volumen). Test: beide Parametersaetze auf 900 Kunstkerzen x 5 Verschiebungen
 * mit der reinen Funktion - der Live-Satz wird aus dem Quelltext von depot.js gelesen (die
 * Zeile im rsi2seit-Zweig), nicht abgeschrieben. Zusaetzlich: period > 65 (in der Oberflaeche
 * waehlbar?) verlaengert das Fenster ueber 261 Kerzen - Probe mit period 80. */
test('F1-02 Kanal-/Signalparameter: Live-P (zOf) gegen gemessenes P (ZTHR 1,5)', async function () {
  var zweig = schneide(DEPOT_QUELLE, "var vsK = Q.einstiegSignal(sigBars, sigBars.length - 1, {", '});', 'depot.js rsi2seit-Zweig');
  var cfg = { lineType: 'ema', period: 20, confirmBps: 15 };
  var zOf = function (c) { return c <= 5 ? 1.5 : c <= 15 ? 2.0 : 2.5; };
  var zSrc = schneide(DEPOT_QUELLE, '  function zOf(confirmBps) {', '\n', 'depot.js zOf');
  zOf = new Function(zSrc + '\n return zOf;')();
  var Plive = new Function('cfg', 'zOf', 'return {' + zweig.slice(zweig.indexOf('{') + 1) + '};')(cfg, zOf);
  var Psoll = STRAT.params;
  var diff = [];
  for (var v = 0; v < 5; v++) {
    var w = kunstWerte(900, v * 37), st = stempelUm(tagUTC(2026, 3, 2), 0, 0, 900), b = baueReihe(w, st, 0);
    for (var i = 261; i < b.length; i++) {
      var a = QN.einstiegSignal(b, i, Psoll), c = QN.einstiegSignal(b, i, Plive);
      if (!!a !== !!c || (a && a.dir !== c.dir)) diff.push(i);
    }
  }
  var w2 = kunstWerte(900, 0), b2 = baueReihe(w2, stempelUm(tagUTC(2026, 3, 2), 0, 0, 900), 0), diff80 = 0;
  var P80 = Object.assign({}, Plive, { period: 80 });
  for (var j = 400; j < b2.length; j++) { if (!!QN.einstiegSignal(b2, j, Psoll) !== !!QN.einstiegSignal(b2, j, P80)) diff80++; }
  var felder = Object.keys(Psoll).filter(function (f) { return Psoll[f] !== Plive[f]; });
  return { abweichung: diff.length > 0,
    text: 'Parameter verschieden in: ' + (felder.join(', ') || 'keinem') + ' (live ZTHR ' + Plive.ZTHR + ', Messung ' + Psoll.ZTHR +
      '); Signale auf 4.195 Kunstkerzen verschieden: ' + diff.length + ' -> fuer rsi2seit wirkungslos. Nebenbefund: mit period 80 wichen ' + diff80 + ' Kerzen ab (Fenster > 261).' };
});

/* Gemeinsamer Lauf: ein Signal, Scans von der Signalkerze bis s + bis; Rueckgabe Trade + Soll. */
async function einLauf(sz, o) {
  o = o || {};
  var reihen = {}; (o.syms || ['KUNST']).forEach(function (s) { reihen[s] = sz.bars; });
  var sb = depotSandbox(sz.bars[sz.s - 2][0], reihen, o);
  var zeiten = o.zeiten || scanZeiten(sz.bars, sz.s, sz.s + (o.bis || H + 4));
  for (var i = 0; i < zeiten.length; i++) {
    if (o.vorScan) o.vorScan(sb, zeiten[i]);
    await sb.scan(zeiten[i]);
  }
  var D = sb.I.getD();
  var tr = alleTrades(D, o.syms ? null : 'KUNST');
  return { sb: sb, D: D, tr: tr, t: tr[tr.length - 1] || null, soll: sollTrade(sz.bars, sz.s) };
}
/** Wie viele Kerzen nach der Signalkerze waren beim Ausstieg fertig? */
function kerzenBis(bars, s, t) { var n = 0; for (var i = s + 1; i < bars.length && kerzenEnde(bars[i][0]) <= t; i++) n++; return n; }

/* F1-03 (b) Unfertige Kerze: Die Messung rechnet bars[i] als fertige Kerze. Live liefert Yahoo
 * die laufende Kerze mit. Probe: 30 Minuten in die Signalkerze hinein zeigt der Abruf die
 * Kerze bereits mit ihren ENDWERTEN (Schluss, Volumen) - waere sie fertig, gaebe es das
 * Signal. Soll: kein Einstieg vor Kerzenschluss, Einstieg danach. */
test('F1-03 Unfertige laufende Kerze wird nicht als Signalkerze gelesen', async function () {
  var sz = szenario(tagUTC(2026, 6, 10), 2);
  var halb = sz.bars[sz.s][0] + 30 * MIN;
  var sicht = function (sym, jetzt) {
    var v = sichtZu(sz.bars, jetzt);
    if (jetzt < kerzenEnde(sz.bars[sz.s][0]) && jetzt >= sz.bars[sz.s][0]) v[v.length - 1] = sz.bars[sz.s].slice();
    return v;
  };
  var r = await einLauf(sz, { sicht: sicht, zeiten: [halb, kerzenEnde(sz.bars[sz.s][0]) + MIN] });
  var frueh = r.tr.filter(function (t) { return t.openT < kerzenEnde(sz.bars[sz.s][0]); }).length;
  var spaet = r.tr.length - frueh;
  return { abweichung: frueh > 0 || spaet !== 1,
    text: 'Scan 30 min in der Signalkerze (Endwerte sichtbar): ' + frueh + ' Einstieg(e) (Soll 0); nach Kerzenschluss: ' + spaet + ' (Soll 1) - fertigeBars (quant.js) schneidet die laufende Kerze ab' };
});

/* F1-04 (e, k) Signal auf der Schlusskerze 15:30-16:00. Messung: Einstieg zum Schluss dieser
 * Kerze (16:00). Live: fertigeBars haelt die Kerze bis 16:30 fuer unfertig (Stempel + 60 min),
 * nach 16:00 ist die Boerse zu und es wird nicht gescannt -> das Signal wird erst am naechsten
 * Morgen gelesen und zum Kurs des Morgens gekauft (Uebernachtluecke im Kunstverlauf +2 %).
 * Im Protokoll rsi2seit-2026-08-26 liegen 38.163 von 104.900 Signalen (36 %) auf dieser Kerze ("6G"). */
test('F1-04 Signal auf der Schlusskerze (15:30): Einstieg erst am naechsten Morgen', async function () {
  var sz = szenario(tagUTC(2026, 6, 10), 6);                       // Mi 10.06.2026, 15:30-Kerze
  var zeiten = [sz.bars[sz.s][0] + MIN, sz.bars[sz.s][0] + 29 * MIN, ny(2026, 6, 10, 16, 1), ny(2026, 6, 10, 16, 31),
                ny(2026, 6, 11, 9, 31), ny(2026, 6, 11, 10, 31)];
  var r = await einLauf(sz, { zeiten: zeiten });
  if (!r.t) return { abweichung: true, text: 'Messung: Einstieg ' + zeitNY(r.soll.einT) + ' zu ' + r.soll.ein.toFixed(2) + '; live gar kein Einstieg. ' + patience(r.D) };
  var dt = r.t.openT - r.soll.einT, dp = r.t.entrySpot / r.soll.ein - 1;
  return { abweichung: dt > 5 * MIN || Math.abs(dp) > 1e-9,
    text: 'Messung: Einstieg ' + zeitNY(r.soll.einT) + ' zu ' + r.soll.ein.toFixed(2) + '; live: ' + zeitNY(r.t.openT) + ' zu ' + r.t.entrySpot.toFixed(2) +
      ' (' + pp(dp) + ' = Uebernachtluecke, ' + Math.round(dt / STD) + ' h spaeter)' };
});

/* F1-05 (e) Einstiegskurs innerhalb der Sitzung: Messung = Schluss der Signalkerze. Live =
 * Spot beim ersten Scan nach Kerzenschluss (fd.series letzter Kurs = laufende Folgekerze) plus
 * 5 Bp. Im Kunstverlauf liegt die Folge-Eroeffnung 0,3 % ueber dem Schluss, damit die
 * Konvention sichtbar wird; am echten Markt ist dieser Abstand innerhalb der Sitzung im Mittel
 * ~0 (Zweig E: -0,00003 Pp) - die GROESSE ist also klein, die KONVENTION eine andere. */
test('F1-05 Einstiegskurs innerhalb der Sitzung: Spot beim Scan statt Schluss der Signalkerze', async function () {
  var sz = szenario(tagUTC(2026, 6, 10), 2);
  var r = await einLauf(sz, { zeiten: [kerzenEnde(sz.bars[sz.s][0]) + MIN] });
  if (!r.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(r.D) };
  var dp = r.t.entrySpot / r.soll.ein - 1;
  return { abweichung: Math.abs(dp) > 1e-9,
    text: 'Messung kauft zu Schluss(Signalkerze) ' + r.soll.ein.toFixed(3) + ', live zu Spot ' + r.t.entrySpot.toFixed(3) + ' (' + pp(dp) +
      ') = Eroeffnung der Folgekerze (Konvention folgeEroeffnung statt schlusskerze); Briefkurs ' + r.t.entry.toFixed(3) + ' (+5 Bp)' };
});

/* F1-06 (f) Haltedauer: Messung = Schluss der 8. Folgekerze (ausstiegKurs(b, i + 8)). Live
 * zaehlt fertige Kerzen mit Stempel > openT (depot.js Zweig "HANDELSKERZEN statt Wanduhr").
 * openT liegt NACH dem Beginn der ersten Folgekerze (Scan 1 min nach Kerzenschluss) - diese
 * Kerze zaehlt nie mit. Signal Di 09.06.2026 10:30. */
test('F1-06 Ausstieg: Zahl der gehaltenen Kerzen und Ausstiegskurs', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var r = await einLauf(sz, { bis: H + 4 });
  if (!r.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(r.D) };
  if (r.t.status !== 'closed') return { abweichung: true, text: 'Position nach ' + (H + 4) + ' Kerzen noch offen' };
  var n = kerzenBis(sz.bars, sz.s, r.t.closeT);
  var dp = r.t.exitSpot / r.soll.aus - 1;
  return { abweichung: n !== H || Math.abs(dp) > 1e-9,
    text: 'Messung: raus zum Schluss der 8. Folgekerze ' + zeitNY(r.soll.ausT) + ' zu ' + r.soll.aus.toFixed(3) + '; live: ' + zeitNY(r.t.closeT) +
      ' nach ' + n + ' fertigen Folgekerzen zu ' + r.t.exitSpot.toFixed(3) + ' (' + pp(dp) + '), Grund "' + r.t.why + '"' };
});

/* F1-07 (f) Wochenende: Signal Fr 12.06.2026 10:30. Messung: 8 Folgekerzen = Fr 11:30..15:30
 * (5) + Mo 9:30, 10:30, 11:30 -> Ausstieg Mo 12:30. Live: das 2-Tage-Schutznetz fuer
 * Uebernacht-Positionen (now - openT > 2 Tage, depot.js "Schutznetz skaliert mit dem
 * Horizont") greift beim ersten Scan am Montag VOR der Kerzenzaehlung. */
test('F1-07 Ausstieg ueber das Wochenende (Signal Freitag)', async function () {
  var sz = szenario(tagUTC(2026, 6, 12), 1);
  var r = await einLauf(sz, { bis: H + 4 });
  if (!r.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(r.D) };
  var n = kerzenBis(sz.bars, sz.s, r.t.closeT);
  return { abweichung: n !== H,
    text: 'Messung: raus ' + zeitNY(r.soll.ausT) + ' nach 8 Kerzen; live: ' + (r.t.closeT ? zeitNY(r.t.closeT) : 'offen') + ' nach ' + n + ' Kerzen, Grund "' + r.t.why + '"' };
});

/* F1-08 (f) Feiertag: Signal Do 02.04.2026 14:30, Karfreitag 03.04. geschlossen (boerse.js).
 * Messung: Do 15:30 + Mo 9:30..15:30 (7) = 8 Kerzen -> Ausstieg Mo 16:00. */
test('F1-08 Ausstieg ueber Feiertag + Wochenende (Signal vor Karfreitag)', async function () {
  if (BOERSE.istHandelstag(tagUTC(2026, 4, 3))) return { abweichung: false, text: 'boerse.js kennt Karfreitag 2026 nicht - Probe entfaellt' };
  var sz = szenario(tagUTC(2026, 4, 2), 5);
  var r = await einLauf(sz, { bis: H + 4 });
  if (!r.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(r.D) };
  var n = kerzenBis(sz.bars, sz.s, r.t.closeT);
  return { abweichung: n !== H,
    text: 'Messung: raus ' + zeitNY(r.soll.ausT) + ' nach 8 Kerzen; live: ' + (r.t.closeT ? zeitNY(r.t.closeT) : 'offen') + ' nach ' + n + ' Kerzen, Grund "' + r.t.why + '"' };
});

/* F1-09 (g) Not-Stopp: Die Messung rsi2seit hat keinen Stop (kein stopNiveau). Live:
 * sl = -(scalpSL 20)/100 = -0,20 aus modeParams, geprueft gegen den Geldkurs. Kunstverlauf:
 * drei Kerzen nach dem Einstieg faellt der Kurs um 22 % und erholt sich bis zur 8. Kerze. */
test('F1-09 Not-Stopp -20 % live, kein Stop in der Messung', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1, { nachSignal: function (b, s) {
    for (var k = s + 3; k < b.length; k++) {
      var f = k <= s + 5 ? 0.78 : 0.99;
      b[k][1] = b[s][1] * f; b[k][3] = b[k][1] * 1.001; b[k][4] = b[k][1] * 0.999;
      b[k][5] = b[k - 1][1] * 1.003;
    }
  } });
  var r = await einLauf(sz, { bis: H + 4 });
  if (!r.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(r.D) };
  var n = kerzenBis(sz.bars, sz.s, r.t.closeT);
  return { abweichung: n !== H || /Stop/.test(r.t.why || ''),
    text: 'Messung: kein Stop, raus nach 8 Kerzen zu ' + pp(r.soll.brutto) + ' brutto; live sl=' + r.t.sl + ', raus nach ' + n + ' Kerzen zu ' +
      pp(r.t.exitSpot / r.t.entrySpot - 1) + ', Grund "' + r.t.why + '"' };
});

/* F1-10 (g) Kein Gewinnziel, kein Nachziehstopp: die Messung haelt stur 8 Kerzen; die
 * Depot-Vorgabe hat tp 0,35 und scalpTrail 15. Kunstverlauf: +40 % zwei Kerzen nach dem
 * Einstieg, dann -20 % vom Hoch. Soll: Ausstieg nur durch die Zeit. */
test('F1-10 Kein Gewinnziel und kein Nachziehstopp (wie gemessen)', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1, { nachSignal: function (b, s) {
    for (var k = s + 2; k < b.length; k++) {
      var f = k <= s + 3 ? 1.40 : 1.12;
      b[k][1] = b[s][1] * f; b[k][3] = b[k][1] * 1.001; b[k][4] = b[k][1] * 0.999; b[k][5] = b[k - 1][1] * 1.003;
    }
  } });
  var r = await einLauf(sz, { bis: H + 4 });
  if (!r.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(r.D) };
  var zeitAus = /Haltedauer/.test(r.t.why || '');
  return { abweichung: !zeitAus || r.t.tp !== null || r.t.trail !== 0,
    text: 'live tp=' + r.t.tp + ', trail=' + r.t.trail + ', Ausstieg "' + r.t.why + '" (Soll: nur Zeit; Zeitpunkt siehe F1-06)' };
});

/* F1-11 (h) Kosten: Messung 2 x 5 Bp je Umlauf, linear (Aktie). Live (instrument 'basis'):
 * Briefkurs Spot x (1 + 0,0005), Geldkurs Spot x (1 - 0,0005), Gebuehr 0. Verglichen wird die
 * gebuchte Rendite (pnl / cost) mit der Mess-Formel auf DENSELBEN Ein-/Ausstiegs-Spots. */
test('F1-11 Kosten: 5 Bp je Seite auf dem Basiswert', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var r = await einLauf(sz, { bis: H + 4 });
  if (!r.t || r.t.status !== 'closed') return { abweichung: true, text: 'kein abgeschlossener Trade live. ' + patience(r.D) };
  var live = r.t.pnl / r.t.cost, soll = r.t.exitSpot / r.t.entrySpot - 1 - 2 * SPANNE;
  return { abweichung: Math.abs(live - soll) > 2e-5 || !r.t.basis,
    text: 'gebuchte Rendite ' + pp(live) + ' gegen Mess-Formel ' + pp(soll) + ' (Differenz ' + ((live - soll) * 1e4).toFixed(3) + ' Bp), basis=' + !!r.t.basis + ', spx=' + r.t.spx };
});

/* F1-12 (h) Instrument: Die Messung ist eine Aktien-Messung (5 Bp, linear). Live haengt am
 * Feld instrument: 'basis' (Neuinstallation) oder 'schein' - und depotmigration.js setzt bei
 * einem BESTANDS-Depot ohne das Feld ausdruecklich 'schein'. Probe mit instrument 'schein'. */
test('F1-12 Instrument Schein statt Aktie (Bestandsdepots)', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var r = await einLauf(sz, { bis: 1, cfg: { instrument: 'schein' } });
  if (!r.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(r.D) };
  return { abweichung: !r.t.basis,
    text: 'live basis=' + !!r.t.basis + ', Spanne je Seite ' + (r.t.spx * 1e4).toFixed(0) + ' Bp (Messung 5), Hebel ' + r.t.omega + ' (Messung 1)' };
});

/* F1-13 (i) Positionsgroesse: Die Messung zaehlt jedes Signal mit gleichem Gewicht. Live:
 * budgetPct 3 % des Depots je Trade - gleich gross, ABER nach 3 Verlusten am Tag halbiert
 * (lsFactor 0,5) und ab 5 Verlusten gesperrt (Tilt-Schutz). Probe: derselbe Einstieg mit und
 * ohne Verlustserie 3. */
test('F1-13 Positionsgroesse: Verlustserie halbiert das Gewicht eines Signals', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var tag = new Date(kerzenEnde(sz.bars[sz.s][0])).toISOString().slice(0, 10);
  var a = await einLauf(sz, { bis: 1 });
  var b = await einLauf(sz, { bis: 1, D: function (D) { D.lossStreak = { day: tag, n: 3 }; } });
  if (!a.t || !b.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(a.D) + patience(b.D) };
  var q = b.t.cost / a.t.cost;
  return { abweichung: Math.abs(q - 1) > 1e-6,
    text: 'Einsatz ohne Serie ' + a.t.cost.toFixed(0) + ' $ (= 3 % von 100.000), mit 3 Verlusten ' + b.t.cost.toFixed(0) + ' $ (Faktor ' + q.toFixed(2) + '); Messung: Faktor 1' };
});

/* F1-14 (i, B) Welche Zahl das Live-Buch nachbildet: gleich grosse Trades -> das Buch verdient
 * das Mittel JE SIGNAL. Die Messung urteilt ueber das TAGESMITTEL (messmaschine.js B1:
 * Tage gleich gewichtet). Beide Zahlen aus dem Protokoll rsi2seit-2026-08-26 (Bestaetigung)
 * und die Rechnung der Maschine (_intern.tagesMittel / jeSignal) an einem Kleinstbeispiel. */
test('F1-14 Gewichtung: Live-Buch = Mittel je Signal, Urteil = Tagesmittel', async function () {
  var M = require(path.join(WURZEL, 'studien', 'messmaschine', 'messmaschine.js'));
  var bsp = [{ tag: 'a', wert: 0.01 }, { tag: 'b', wert: -0.002 }, { tag: 'b', wert: -0.002 }, { tag: 'b', wert: -0.002 }];
  var tm = M._intern.tagesMittel(bsp), mTage = tm.mittel.reduce(function (x, y) { return x + y; }, 0) / tm.mittel.length;
  var js = M._intern.jeSignal(bsp).mittel;
  var prot = JSON.parse(fs.readFileSync(path.join(WURZEL, 'studien', 'messmaschine', 'protokolle', 'rsi2seit-2026-08-26.json'), 'utf8'));
  var B = prot.ergebnisse[0].bestaetigung.ueberschuss;
  return { abweichung: Math.abs(mTage - js) > 1e-12,
    text: 'Kleinstbeispiel: Tagesmittel ' + pp(mTage) + ' gegen je Signal (= gleich grosse Live-Trades) ' + pp(js) +
      '; Protokoll Bestaetigung: Tagesmittel ' + pp(B.tagesmittel) + ', je Signal ' + pp(B.jeSignal) };
});

/* F1-15 (j) Folgesignale desselben Werts: Die Messung zaehlt JEDES Signal, auch wenn das
 * vorige Fenster noch laeuft (ueberlappende Fenster, B10). Live: eine offene Position je Wert
 * wird nur verwaltet ("continue"), danach 120 min Abklingzeit. Gesucht: zwei Signale <= 8 Kerzen auseinander. */
test('F1-15 Mehrere Signale desselben Werts innerhalb der Haltedauer', async function () {
  /* Der Kunstverlauf hat Volumenspitzen nur alle 17 Kerzen. Fuer ein Folgesignal wird die
   * Kerze s + k (k = 1..8) zu einem weiteren Dip mit Volumenspitze gemacht - das aendert
   * nichts am Signal s (das liest nur Kerzen <= s). Gesucht wird das erste k, bei dem
   * rsi2seit.js dort ebenfalls ein Signal sieht. */
  var sz = null, s2 = null;
  for (var k = 1; k <= H && s2 == null; k++) {
    for (var tiefe = 0.995; tiefe >= 0.97 && s2 == null; tiefe -= 0.005) {
      var kand = szenario(tagUTC(2026, 6, 9), 1, { nachSignal: (function (kk, tf) { return function (b, s) {
        for (var j = s + 1; j <= s + kk; j++) { b[j][1] = b[j - 1][1] * (j === s + kk ? tf : 1.0005); b[j][3] = b[j][1] * 1.001; b[j][4] = b[j][1] * 0.999; b[j][5] = b[j - 1][1]; }
        b[s + kk][2] = b[s][2] * 2;
      }; })(k, tiefe) });
      var neben = kand.signale.filter(function (x) { return x > kand.s && x <= kand.s + H; });
      if (neben.length) { sz = kand; s2 = neben[0]; }
    }
  }
  if (s2 == null) return { abweichung: true, text: 'TESTDEFEKT: kein Folgesignal konstruierbar' };
  var sollN = sz.signale.filter(function (x) { return x >= sz.s && x <= sz.s + H; }).length;
  var sb = depotSandbox(sz.bars[sz.s - 2][0], { KUNST: sz.bars });
  var D = await fahre(sb, scanZeiten(sz.bars, sz.s, s2 + 2));
  var liveN = alleTrades(D, 'KUNST').length;
  return { abweichung: liveN !== sollN,
    text: 'Messung: ' + sollN + ' Signale (Kerzen ' + zeitNY(sz.bars[sz.s][0]) + ' und ' + zeitNY(sz.bars[s2][0]) + '), jedes ein eigener Trade; live: ' + liveN +
      ' Einstieg(e) - das zweite Signal trifft auf die offene Position, die nur verwaltet wird (depot.js "if (open) { ... continue; }")' };
});

/* F1-16 (j) Viele Werte zugleich: Die Messung nimmt jedes Signal jedes Werts. Live deckeln
 * risk.maxPos 8 (risiko.js darfOeffnen, zaehlt ALLE offenen Positionen des Depots), klumpenMax 8
 * und maxPerDay 10. Probe: 12 Werte mit identischem Verlauf -> 12 Signale auf derselben Kerze. */
test('F1-16 Gleichzeitige Signale vieler Werte (Deckel)', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var syms = []; for (var k = 1; k <= 12; k++) syms.push('KUNST' + (k < 10 ? '0' : '') + k);
  var r = await einLauf(sz, { syms: syms, zeiten: [kerzenEnde(sz.bars[sz.s][0]) + MIN] });
  var n = r.tr.length;
  return { abweichung: n !== syms.length,
    text: 'Messung: ' + syms.length + ' Signale = ' + syms.length + ' Trades; live: ' + n + ' eroeffnet. Wartegruende: ' + patience(r.D) };
});

/* F1-17 (k) Tagesschluss: isNearUsClose (15:45-16:00) sperrt Einstiege nur ohne
 * Uebernacht-Erlaubnis; rsi2seit hat uebernacht:true. Probe: Signal auf der 14:30-Kerze, der
 * erste Scan kommt erst um 15:50. Soll (Messung kennt keine Uhrzeitsperre): Einstieg. */
test('F1-17 Tagesschluss-Sperre greift fuer rsi2seit nicht', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 5);
  var r = await einLauf(sz, { zeiten: [ny(2026, 6, 9, 15, 50)] });
  return { abweichung: !r.t,
    text: r.t ? 'Einstieg um ' + zeitNY(r.t.openT) + ' trotz isNearUsClose (uebernacht=' + r.t.uebernacht + ')' : 'kein Einstieg: ' + patience(r.D) };
});

/* F1-18 (l) Zeitzone: Kerzenstempel sind UTC-ms, fertigeBars rechnet mit Millisekunden, die
 * Marktoeffnung kommt aus quant.js (US-Sommerzeit). Probe in den beiden Wochen, in denen US
 * und EU verschieden umstellen (11.03.2026: US Sommer, EU Winter; 28.10.2026: EU Winter,
 * US Sommer), Rechneruhr Europe/Berlin: Einstieg wie in F1-01 genau nach Kerzenschluss, und
 * Ausstieg nach derselben Kerzenzahl wie in einer normalen Woche (Vergleich mit F1-06). */
test('F1-18 Zeitzone: Wochen mit verschiedener Sommerzeit US/EU', async function () {
  var aus = [], abw = false;
  var szN = szenario(tagUTC(2026, 6, 9), 1);
  var normal = await einLauf(szN, { bis: H + 4 });
  var nNormal = normal.t && normal.t.closeT ? kerzenBis(szN.bars, szN.s, normal.t.closeT) : null;
  var tage = [[2026, 3, 10], [2026, 10, 27]];
  for (var i = 0; i < tage.length; i++) {
    var sz = szenario(tagUTC(tage[i][0], tage[i][1], tage[i][2]), 1);
    var r = await einLauf(sz, { bis: H + 4 });
    if (!r.t) { abw = true; aus.push(tage[i].join('-') + ': kein Einstieg'); continue; }
    var einOk = r.t.openT === kerzenEnde(sz.bars[sz.s][0]) + MIN;
    var n = r.t.closeT ? kerzenBis(sz.bars, sz.s, r.t.closeT) : null;
    if (!einOk || n !== nNormal) abw = true;
    aus.push(tage[i][2] + '.' + tage[i][1] + '.: Einstieg ' + zeitNY(r.t.openT) + (einOk ? ' (Kerzenschluss+1 min)' : ' (FALSCH)') + ', Ausstieg nach ' + n + ' Kerzen');
  }
  return { abweichung: abw, text: aus.join('; ') + ' - normale Woche: ' + nNormal + ' Kerzen (die Kerzenzahl selbst ist F1-06)' };
});

/* F1-19 .. F1-25 (m) Live-Filter, die die Messung nicht hat. Jeder Test: dasselbe Signal, ein
 * Filter gesetzt. Soll (Messung): Einstieg. */
async function filterProbe(o) {
  var sz = szenario(tagUTC(2026, 6, 9), 1, o.sz || {});
  var r = await einLauf(sz, Object.assign({ zeiten: [kerzenEnde(sz.bars[sz.s][0]) + MIN] }, o.lauf || {}));
  return r;
}
test('F1-19 Liquiditaetsfilter minDollarVol 50 Mio $ je Tag', async function () {
  var r = await filterProbe({ sz: { volFaktor: 0.05 } });
  return { abweichung: !r.t, text: 'Wert mit ~3,5 Mio $ Tagesumsatz, Signal laut Messung vorhanden; live ' + (r.t ? 'Einstieg' : 'kein Einstieg: ' + patience(r.D)) };
});
test('F1-20 Zahlen-Blackout (Ergebnistermin in den naechsten 30 h)', async function () {
  var r = await filterProbe({ lauf: { termin: function () { return Date.UTC(2026, 5, 10, 11, 0); } } });
  return { abweichung: !r.t, text: 'Termin am Folgetag vor Boersenbeginn; live ' + (r.t ? 'Einstieg' : 'kein Einstieg: ' + patience(r.D)) };
});
test('F1-21 Edge-Waechter-Pause', async function () {
  var r = await filterProbe({ lauf: { D: function (D) { D.intraday.edgePause = { seit: Date.UTC(2026, 5, 1), arm: 'rsi2seit' }; } } });
  return { abweichung: !r.t, text: 'edgePause gesetzt; live ' + (r.t ? 'Einstieg' : 'kein Einstieg: ' + patience(r.D)) };
});
test('F1-22 Symbolsperre "Verlustbringer"', async function () {
  var r = await filterProbe({ lauf: { D: function (D) { D.symBlock = { KUNST: { seit: Date.UTC(2026, 5, 1), n: 6, pnl: -50, quote: 17 } }; } } });
  return { abweichung: !r.t, text: 'symBlock gesetzt; live ' + (r.t ? 'Einstieg' : 'kein Einstieg: ' + patience(r.D)) };
});
test('F1-23 Event-Blackout (FOMC/CPI/NFP +-45 min, Vorgabe blackout "block")', async function () {
  var cal = { isBlackout: function () { return { name: 'FOMC' }; }, upcoming: function () { return null; } };
  var r = await filterProbe({ lauf: { cal: cal } });
  return { abweichung: !r.t, text: 'Termin-Fenster aktiv; live ' + (r.t ? 'Einstieg' : 'kein Einstieg: ' + patience(r.D)) };
});
test('F1-24 Kosten-Check (Bewegung muss 1,5 x Kosten decken)', async function () {
  var r = await filterProbe({ sz: { ausschlag: 0.02 } });
  return { abweichung: !r.t, text: 'ruhiger Wert (Stundenstreuung ~0,01 %), Signal laut Messung vorhanden; live ' + (r.t ? 'Einstieg' : 'kein Einstieg: ' + patience(r.D)) };
});
test('F1-25 Regime-Zuteilung (SPY > EMA200) - Vorgabe aus', async function () {
  var r = await filterProbe({});
  var spy = r.sb.win.__abrufe.filter(function (a) { return a.sym === 'SPY'; }).length;
  return { abweichung: !r.t || spy > 0 || r.D.intraday.regimeZuteilung !== false,
    text: 'regimeZuteilung=' + r.D.intraday.regimeZuteilung + ', SPY-Abrufe ' + spy + ', Einstieg ' + (r.t ? 'ja' : 'nein') + ' (eingeschaltet waere es ein Filter, den die Messung rsi2seit nicht hat)' };
});

/* F1-26 (m) Universum: Die Messung lief auf allem im Archiv ausser -USD (Protokoll: 2.874
 * Werte). Live: Basis-Kacheln (renderer.js STOCKS) + Watchlist + 60m-Pool (depot.js EXTRA_60M
 * bzw. POOLS_60M). Die Listen werden aus dem Quelltext gezaehlt, nicht abgeschrieben. */
test('F1-26 Universum: gemessen 2.874 Werte, live ~100', async function () {
  var rq = fs.readFileSync(path.join(WURZEL, 'renderer.js'), 'utf8');
  var stocks = schneide(rq, '  var STOCKS = [', '];', 'renderer.js STOCKS').match(/\{ y: '/g) || [];
  var ex = schneide(DEPOT_QUELLE, '  var EXTRA_60M = (', ").split(' ');", 'depot.js EXTRA_60M');
  var extra = ex.replace(/'\s*\+\s*'/g, '').replace(/^[\s\S]*?\('/, '').replace(/'[\s\S]*$/, '').split(/\s+/).filter(Boolean);
  var menge = {}; stocks.forEach(function (_, i) { menge['b' + i] = 1; });
  var basisNamen = (schneide(rq, '  var STOCKS = [', '];', 'renderer.js STOCKS').match(/y: '([^']+)'/g) || []).map(function (z) { return z.slice(4, -1); });
  basisNamen.concat(extra).forEach(function (s) { menge[s] = 1; });
  var live = basisNamen.concat(extra).filter(function (s, i, a) { return a.indexOf(s) === i; }).length;
  var prot = JSON.parse(fs.readFileSync(path.join(WURZEL, 'studien', 'messmaschine', 'protokolle', 'rsi2seit-2026-08-26.json'), 'utf8'));
  return { abweichung: live !== prot.universum.werte,
    text: 'Messung: ' + prot.universum.werte + ' Werte (' + prot.universum.herkunft + '); live: ' + basisNamen.length + ' Basis + ' + extra.length + ' Pool = ' + live + ' verschiedene Werte (+ Watchlist)' };
});

/* F1-27 (a, A bedingt) Capital-Rueckfall: Antwortet Yahoo nicht und ist das Demo-Konto
 * verbunden, rechnet der Scan auf CFD-Kerzen von Capital.com (depot.js fetchIntraday). Deren
 * Volumen ist kein Boersenvolumen - die Volumenbestaetigung (1,3 x Mittel) haengt daran.
 * Probe: gleiche Schlusskurse, CFD-Volumen flach. Soll (Messung auf Yahoo-Archiv): Signal. */
test('F1-27 Capital-Rueckfall: Signal auf CFD-Kerzen', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var t = kerzenEnde(sz.bars[sz.s][0]) + MIN;
  var cap = { enabled: function () { return true; },
    prices: async function (sym, iv, n) {
      var v = sichtZu(sz.bars, cap.__jetzt()).slice(-n).map(function (b) { return [b[0], b[1], 5000, b[3], b[4]]; });
      return { series: v, dollarVolDay: 5e9, source: 'capital' };
    },
    openPosition: function () { return new Promise(function () { }); }, closePosition: function () { return new Promise(function () { }); } };
  var r = await einLauf(sz, { zeiten: [t], yahooStumm: true, capAPI: cap, vorScan: function (sb) { cap.__jetzt = function () { return sb.uhr.jetzt; }; } });
  return { abweichung: !r.t, text: 'Yahoo stumm, Capital liefert dieselben Schlusskurse mit CFD-Volumen (Messung auf Yahoo: Signal); live ' + (r.t ? 'Einstieg' : 'kein Einstieg: ' + patience(r.D) + ' - die Volumenbestaetigung rechnet auf CFD-Volumen') };
});

/* F1-28 (m) Krypto: Die Messung schliesst -USD aus (rsi2seit.js universum 'aktien',
 * messmaschine.js Filter). Live haengt kryptoHandeln die Krypto-Werte an und handelt dort
 * denselben Modus (Wanduhr-Haltedauer, 10 Bp). Vorgabe aus - Probe mit eingeschaltetem Schalter. */
test('F1-28 Krypto-Werte im Live-Universum (Schalter kryptoHandeln)', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var r = await einLauf(sz, { syms: ['BTC-USD'], zeiten: [kerzenEnde(sz.bars[sz.s][0]) + MIN], cfg: { kryptoHandeln: true } });
  return { abweichung: r.tr.length > 0, text: 'Messung: -USD nicht im Universum; live mit kryptoHandeln: ' + r.tr.length + ' Einstieg(e) auf BTC-USD' + (r.t ? ' (Spanne ' + (r.t.spx * 1e4).toFixed(0) + ' Bp)' : '') };
});

/* F1-29 (f, A) Symbolsperre waehrend offener Position: Die Sperre steht im Scan VOR der
 * Verwaltung offener Positionen ("continue"). Wird ein Wert gesperrt (Hand-Sperre
 * {manuell:true} oder automatisch), laeuft seine offene Position ohne Zeit-Ausstieg weiter. */
test('F1-29 Sperre eines Werts mit offener Position setzt den Zeit-Ausstieg aus', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var gesperrt = false;
  var r = await einLauf(sz, { bis: H + 6, vorScan: function (sb, t) {
    var D = sb.I.getD();
    if (!gesperrt && offene(D, 'KUNST').length) { D.symBlock = { KUNST: { manuell: true, seit: t } }; gesperrt = true; }
  } });
  if (!r.t) return { abweichung: true, text: 'kein Einstieg live. ' + patience(r.D) };
  return { abweichung: r.t.status !== 'closed',
    text: 'Wert nach dem Einstieg gesperrt; nach ' + (H + 6) + ' Kerzen ist die Position ' + (r.t.status === 'closed' ? 'geschlossen ("' + r.t.why + '")' : 'NOCH OFFEN') + ' (Messung: raus nach 8)' };
});

/* F1-30 (j) Abklingzeit nach dem Ausstieg: live 120 min je Wert (cooldownMin, mindestens
 * 2 Kerzen) - ein Signal, das kurz nach dem Zeit-Ausstieg kommt, wird nicht gehandelt.
 * Rein aus dem Quelltext: der Zeitstempel wird beim Schliessen gesetzt. Gegenprobe ueber
 * modeParams in der Sandbox. */
test('F1-30 Abklingzeit 120 min nach jedem Ein- und Ausstieg', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var sb = depotSandbox(sz.bars[sz.s][0], { KUNST: sz.bars });
  var mp = sb.I.modeParams();
  var setztBeimSchliessen = /if \(why\) \{ closeTrade\(open, spot, now, why\); D\.intradayCooldown\[sym\] = now; \}/.test(DEPOT_QUELLE);
  return { abweichung: mp.cooldownMin > 0 || setztBeimSchliessen,
    text: 'modeParams rsi2seit: cooldownMin ' + mp.cooldownMin + ', maxPerDay ' + mp.maxPerDay + ', maxHoldMin ' + mp.maxHoldMin + ', sl ' + mp.sl +
      '; Abklingzeit auch nach dem Ausstieg gesetzt: ' + setztBeimSchliessen + ' (Messung: keine)' };
});

/* F1-31 (m) Kill-Switch: Tagesverlust >= risk.dayLossPct (3 %) sperrt den Handel bis
 * Tagesende UND stellt alle offenen Positionen sofort glatt (killSwitchPruefen). Die Messung
 * kennt keine Depot-Grenze. Probe: Sperre fuer heute gesetzt. */
test('F1-31 Kill-Switch (Tagesverlust-Limit) sperrt Einstiege', async function () {
  var sz = szenario(tagUTC(2026, 6, 9), 1);
  var r = await einLauf(sz, { zeiten: [kerzenEnde(sz.bars[sz.s][0]) + MIN], vorScan: function (sb, t) {
    sb.I.getD().killSwitch = { day: sb.win.Risiko.tagesSchluessel(t) };
  } });
  return { abweichung: !r.t, text: 'Kill-Switch fuer heute aktiv; live ' + (r.t ? 'Einstieg' : 'kein Einstieg: ' + patience(r.D)) };
});

module.exports = TESTS;

if (require.main === module) {
  (async function () {
    for (var i = 0; i < TESTS.length; i++) {
      var t = TESTS[i], r;
      try { r = await t.lauf(); }
      catch (e) { r = { abweichung: true, text: 'TESTDEFEKT: ' + (e && e.stack ? e.stack.split('\n').slice(0, 3).join(' | ') : e) }; }
      console.log((r.abweichung ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + t.name + ' — ' + r.text);
    }
  })();
}
