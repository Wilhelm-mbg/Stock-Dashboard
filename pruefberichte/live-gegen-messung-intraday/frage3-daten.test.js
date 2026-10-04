'use strict';
/* Pruefbericht "Live gegen Messung" - Intraday-Depot (rsi2seit), FRAGE 3: Handelt das Depot auf
 * fehlenden oder veralteten Daten? Kleinsttests zu pruefberichte/live-gegen-messung-intraday/frage3-daten.md.
 *
 * VERTRAG: module.exports = [ { name, lauf: async () => ({ abweichung, text }) }, ... ].
 * Direkt aufgerufen druckt die Datei GENAU EINE Zeile je Test:
 *   "ZEIGT ABWEICHUNG: <name> — <text>"  oder  "kein Unterschied: <name> — <text>".
 *
 * WIE: depot.js laeuft ECHT in einer vm-Sandbox, zusammen mit den echten quant.js, risiko.js,
 * boerse.js, archiv.js (und fuer Test F3-12 capital.js). Ersetzt werden nur die Raender:
 *   - Date (feste Uhr, je Datei ueber einen Parameter ersetzt, wie im Momentum-Pruefbericht),
 *   - window.api (Speicher im Arbeitsspeicher; Archiv-Reihen liegen unter bars_60m_<SYM>),
 *   - window.Kurse.hole (Attrappe: baut eine Yahoo-Chart-Antwort aus Kunstkerzen und zerlegt sie mit
 *     dem ECHTEN kurse.js/zerlege - so gilt auch die kursOk-Pruefung des Laders),
 *   - Oberflaeche (document, U, Dash) und Nebenmodule ohne Einfluss auf den Handelspfad (Stummel).
 * Damit intradayScan von aussen erreichbar ist, wird an den Quelltext in der Sandbox (nicht an die
 * Datei) VOR dem Startaufruf init() eine Zeile angehaengt, die interne Funktionen herausreicht; init()
 * selbst wird nicht gestartet (es wuerde den Speicher lesen und Takte aufsetzen) - D setzt der Test.
 * render/save und die reinen Anzeige-Funktionen werden in der Sandbox stillgelegt.
 * Kein Netz, keine Schluessel, kein Electron. Nicht in `npm test` eingehaengt.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/live-gegen-messung-intraday/frage3-daten.test.js        alle Tests
 *   node pruefberichte/live-gegen-messung-intraday/frage3-daten.test.js 4      nur Test Nr. 4 (1-basiert)
 * PRUEF_WURZEL=<Ordner> nimmt die Module von einem anderen Stand.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..', '..');
var KK = require(path.join(WURZEL, 'kurse.js'));          // zerlege/kursOk - rein
var QN = require(path.join(WURZEL, 'quant.js'));          // nur fuer die Kunstdaten (Signal suchen)
var MIN = 60000, STD = 3600000, TAG = 86400000;

/* ---------------- Kunstdaten ---------------- */

/** Deterministischer Zufall (lineare Kongruenz). */
function rng(s) { return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }

/** Stempel der n letzten 60m-Kerzen bis einschliesslich endT (Beginn der letzten Kerze), wie Yahoo:
 *  Kerzenbeginn xx:30 New York, 7 Kerzen je Tag (09:30 ... 15:30), Mo-Fr. Feiertage spielen keine Rolle. */
function stunden(endT, n) {
  var out = [], d = new Date(endT), tag = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  while (out.length < n) {
    var w = new Date(tag).getUTCDay();
    if (w !== 0 && w !== 6) {
      var h0 = QN.usSommerzeit(new Date(tag + 15 * STD)) ? 13 : 14;
      for (var k = 6; k >= 0 && out.length < n; k--) {
        var t = tag + (h0 * 60 + 30 + 60 * k) * MIN;
        if (t <= endT) out.unshift(t);
      }
    }
    tag -= TAG;
  }
  return out;
}
/** Die k Handelsstunden-Stempel NACH t0 (t0 selbst ist ein Kerzenbeginn). */
function stundenNach(t0, k) {
  var out = [], t = t0;
  while (out.length < k) {
    t += 30 * MIN;
    var s = stunden(t, 1)[0];
    if (s > t0 && (!out.length || s > out[out.length - 1])) out.push(s);
  }
  return out;
}
/** Kerze [t, schluss, volumen, hoch, tief] */
function kerze(t, c, v) { return [t, c, v == null ? 1e6 : v, Math.round(c * 1.002 * 100) / 100, Math.round(c * 0.998 * 100) / 100]; }
/** Flache Reihe auf Kurs c (leichtes Rauschen, damit Vola-Rechnungen nicht entarten). */
function flach(ts, c) { var r = rng(7); return ts.map(function (t) { return kerze(t, Math.round(c * (1 + (r() - 0.5) * 0.002) * 100) / 100); }); }
/** Seitwaerts-Rauschen um 100, aus dem rsi2seit von selbst Signale zieht (gefunden durch Suche). */
function rauschen(ts, seed) {
  var r = rng(seed), p = 100;
  return ts.map(function (t) {
    p = p * (1 + (r() - 0.5) * 0.012) + (100 - p) * 0.03 + 0.004;
    return kerze(t, Math.round(p * 100) / 100, 1e6 * (0.7 + 0.6 * r()));
  });
}
var P_RSI2SEIT = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1, MINQ: 0, CHAN: false, MTF: false, TREND: false };
function signalCall(bars, i) { var s = QN.einstiegSignal(bars, i, P_RSI2SEIT); return !!(s && s.dir === 'call'); }
/** Eine Kunstreihe, deren LETZTE Kerze ein rsi2seit-Long ist; die Signalkerze beginnt um endT
 *  (die Reihe wird so verschoben, dass sie dort endet). Mindestens vorlauf Kerzen davor. */
function signalReihe(endT, vorlauf) {
  for (var seed = 1; seed < 400; seed++) {
    var ts = stunden(endT, 700), b = rauschen(ts, seed);
    for (var i = vorlauf; i < b.length; i++) {
      if (!signalCall(b, i)) continue;
      /* Neu auf endT stempeln (Kurse bleiben, Stempel = die letzten i+1 Handelsstunden bis endT) */
      var ts2 = stunden(endT, i + 1), aus = [];
      for (var j = 0; j <= i; j++) aus.push([ts2[j]].concat(b[j].slice(1)));
      if (signalCall(aus, aus.length - 1)) return aus;
    }
  }
  throw new Error('keine Kunstreihe mit rsi2seit-Signal gefunden');
}

/* ---------------- Sandbox ---------------- */

/** Feste Uhr fuer die Sandbox: Date.now()/new Date() = jetzt, new Date(x) wie gewohnt. */
function uhr(jetzt) {
  var Uh = function () {
    if (!arguments.length) return new Date(Uh.jetzt);
    return new (Function.prototype.bind.apply(Date, [null].concat([].slice.call(arguments))))();
  };
  Uh.now = function () { return Uh.jetzt; }; Uh.jetzt = jetzt; Uh.UTC = Date.UTC; Uh.parse = Date.parse;
  Uh.prototype = Date.prototype;
  return Uh;
}
/** Tiefer Stummel: jede Eigenschaft ist wieder ein Stummel, jeder Aufruf liefert undefined. */
function stummel() {
  var f = function () { return undefined; };
  return new Proxy(f, { get: function (t, k) { if (k === 'then') return undefined; if (k === Symbol.toPrimitive) return function () { return ''; }; return stummel(); }, apply: function () { return undefined; } });
}
/** Yahoo-Chart-Antwort aus Kunstkerzen [t, c, v, h, l] (Zeiten in ms). */
function yahooText(bars) {
  return JSON.stringify({ chart: { result: [{ meta: {}, timestamp: bars.map(function (b) { return Math.floor(b[0] / 1000); }),
    indicators: { quote: [{ close: bars.map(function (b) { return b[1]; }), volume: bars.map(function (b) { return b[2]; }),
      high: bars.map(function (b) { return b[3]; }), low: bars.map(function (b) { return b[4]; }), open: bars.map(function (b) { return b[1]; }) }] } }] } });
}
var HAKEN = '  init().catch(';
/**
 * o.jetzt        Uhr (ms)
 * o.store        Speicher-Inhalt (Archiv: bars_60m_<SYM>: { series })
 * o.liefere      function (sym, opt, jetzt) -> Kunstkerzen oder null (null = Abruf gescheitert)
 * o.stocks       Basis-Universum (Dash.STOCKS)
 * o.storeGetWirft  { key: true } - storeGet wirft fuer diesen Schluessel
 * o.capital      { prices: function (sym) -> Capital-JSON-Text } - laedt das ECHTE capital.js
 */
function depotSandbox(o) {
  var store = o.store || {};
  var el = {};
  function getEl(id) {
    return el[id] || (el[id] = { id: id, textContent: '', innerHTML: '', value: '', style: {}, dataset: {}, checked: false, disabled: false,
      addEventListener: function () { }, classList: { add: function () { }, remove: function () { }, toggle: function () { }, contains: function () { return false; } },
      querySelectorAll: function () { return []; }, querySelector: function () { return null; }, setAttribute: function () { }, appendChild: function () { } });
  }
  var abrufe = [];
  var win = {
    api: {
      storeGet: async function (n) {
        if (o.storeGetWirft && o.storeGetWirft[n]) throw new Error('Datei gesperrt: ' + n);
        return store[n] == null ? null : JSON.parse(JSON.stringify(store[n]));
      },
      storeSet: async function (n, v) { store[n] = JSON.parse(JSON.stringify(v)); return { ok: true }; },
      capFetch: async function (method, url) {
        if (!o.capital) return { ok: false, status: 0, body: '' };
        if (/\/session$/.test(url)) return { ok: true, status: 200, headers: { cst: 'c', 'x-security-token': 's' }, body: '{}' };
        var m = /\/prices\/([^?]+)/.exec(url);
        if (m && method === 'GET') return { ok: true, status: 200, body: o.capital.prices(decodeURIComponent(m[1])) };
        return { ok: false, status: 404, body: '' };
      }
    },
    U: new Proxy({ esc: String, nf2: { format: String }, d: String, dt: String, signTxt: String, money: String,
      dez: function (x, n) { return Number(x).toFixed(n); } }, { get: function (t, k) { return k in t ? t[k] : function () { return ''; }; } }),
    Dash: { marketOpen: function () { return true; }, STOCKS: (o.stocks || ['AAA']).map(function (s) { return { y: s }; }), quote: function () { return null; } },
    Kurse: {
      kursOk: KK.kursOk, reihe: KK.reihe, ereignisseAb: KK.ereignisseAb,
      hole: async function (sym, opt) {
        abrufe.push({ sym: sym, range: opt && opt.range });
        var b = o.liefere ? o.liefere(sym, opt, ctx.__Uhr.jetzt) : null;
        if (!b) return null;
        return KK.zerlege(yahooText(b), opt);            // der ECHTE Zerleger samt kursOk
      }
    },
    Berichte: { exportAnalysis: function () { } },
    BTPool: { pmap: async function (items, worker, conc) {     // wortgleich zu btpool.js/pmap
      var out = new Array(items.length), idx = 0;
      async function lane() { while (idx < items.length) { var i = idx++; try { out[i] = await worker(items[i], i); } catch (e) { out[i] = null; } } }
      var lanes = []; for (var l = 0; l < Math.max(1, Math.min(conc || 5, items.length)); l++) lanes.push(lane());
      await Promise.all(lanes); return out;
    } },
    getSettings: function () { return o.capital ? { capEnabled: true, capKey: 'k', capId: 'i', capPass: 'p' } : {}; }
  };
  ['Kosten', 'StrategieChart', 'BacktestUI', 'Chart', 'Messfenster'].forEach(function (n) { win[n] = stummel(); });
  var doc = { readyState: 'complete', addEventListener: function () { }, getElementById: getEl, querySelectorAll: function () { return []; },
    querySelector: function () { return null; }, createElement: function () { return getEl('neu' + Math.random()); }, body: getEl('body') };
  win.document = doc;
  var ctx = { window: win, document: doc, console: console, __Uhr: uhr(o.jetzt), Promise: Promise,
    setTimeout: function (f, ms) { if (ms >= 1000) return 0; setImmediate(f); return 0; }, setInterval: function () { return 0; },
    clearTimeout: function () { }, clearInterval: function () { }, localStorage: { getItem: function () { return null; }, setItem: function () { } } };
  vm.createContext(ctx);
  var dateien = ['quant.js', 'risiko.js', 'boerse.js', 'archiv.js'].concat(o.capital ? ['capital.js'] : []);
  dateien.forEach(function (d) {
    vm.runInContext('(function (Date) {' + fs.readFileSync(path.join(WURZEL, d), 'utf8') + '\n})(__Uhr);', ctx, { filename: d });
  });
  var src = fs.readFileSync(path.join(WURZEL, 'depot.js'), 'utf8');
  var a = src.lastIndexOf(HAKEN);
  if (a === -1) throw new Error('Haken "init().catch(" in depot.js nicht gefunden - Pruefgeschirr passt nicht mehr zum Stand');
  var auslass = ' window.__intern = { intradayScan: intradayScan, defaultDepot: defaultDepot, setD: function (d) { D = d; }, getD: function () { return D; },' +
    ' LASTBARS: LASTBARS, HEALTH: HEALTH, SIG: SIG, SIG_LOG: SIG_LOG, spyTrendAuf: spyTrendAuf, edgeZustand: edgeZustand, equityNow: equityNow };' +
    ' render = function () { }; renderSigMonitor = function () { }; renderSymBlocks = function () { }; cockpitRender = function () { };' +
    ' save = function () { return Promise.resolve(); };\n  if (false) ';
  src = src.slice(0, a) + auslass + src.slice(a);
  vm.runInContext('(function (Date) {' + src + '\n})(__Uhr);', ctx, { filename: 'depot.js' });
  var I = win.__intern;
  I.win = win; I.store = store; I.abrufe = abrufe;
  I.stelle = function (t) { ctx.__Uhr.jetzt = t; };
  I.jetzt = function () { return ctx.__Uhr.jetzt; };
  /** Einen Scan laufen lassen; ein Fehler im Scan ist ein Defekt des Pruefgeschirrs, kein Befund. */
  I.scan = async function () {
    var vor = I.HEALTH.scanErrors;
    await I.intradayScan();
    if (I.HEALTH.scanErrors !== vor) throw new Error('Scan-Fehler in der Sandbox: ' + (I.HEALTH.lastError && I.HEALTH.lastError.msg));
  };
  return I;
}

/** Ein Depot-Zustand wie bei einer frischen Installation, Intraday-Handel AN (rsi2seit, 60m, Basiswert). */
function depotZustand(I, aend) {
  var d = I.defaultDepot();
  d.notify = false;
  d.intraday.enabled = true;
  d.intraday.mode = 'rsi2seit'; d.intraday.interval = '60m'; d.intraday.instrument = 'basis';
  if (aend) aend(d);
  I.setD(d);
  return d;
}
/** Eine offene rsi2seit-Basiswert-Position, wie intradayScan sie anlegt (Felder aus depot.js ~3352). */
function position(id, sym, spot, openT, wert) {
  var spx = 0.0005, ask = spot * (1 + spx), qty = Math.round((wert || 3000) / ask * 10000) / 10000;
  return { id: id, sym: sym, dir: 'call', openT: openT, strategy: 'intraday', modus: 'rsi2seit', entrySpot: spot, entry: ask, qty: qty,
    cost: qty * ask, orderFee: 0, spx: spx, basis: true, strike: spot, expiry: openT + 60 * TAG, iv: 0.3, ratio: 1, ivBasis: 0.3,
    sl: -0.2, tp: null, trail: 0, maxHoldMin: 480, exitMode: 'zeit', uebernacht: true, peak: ask, chN: 0, chan: null,
    sources: { intraday: 1 }, reason: 'Kunstposition', status: 'open' };
}
function legeOffen(d, p) { d.positions.push(p); d.trades.unshift(p); d.cash -= p.cost; }
function archiv(store, sym, bars) { store['bars_60m_' + sym] = { series: bars.map(function (b) { return b.slice(); }) }; }
/** Was ein Abruf zur Zeit jetzt sieht: alle Kerzen, die bis jetzt begonnen haben (die laufende eingeschlossen,
 *  wie Yahoo), bei range=1mo nur die letzten 150 (rund ein Monat Stundenkerzen). */
function sicht(bars, opt, jetzt) {
  var v = bars.filter(function (b) { return b[0] <= jetzt; });
  return (opt && opt.range === '1mo') ? v.slice(-150) : v;
}
function de(x, n) { return Number(x).toFixed(n == null ? 2 : n).replace('.', ','); }
function uhrzeitNY(t) { return new Date(t - (QN.usSommerzeit(new Date(t)) ? 4 : 5) * STD).toISOString().slice(5, 16).replace('T', ' ') + ' NY'; }
function grundVon(I, sym) { var l = I.SIG_LOG[sym] || []; return l.map(function (e) { return e.grund; }); }
function offen(I, sym) { return I.getD().positions.filter(function (p) { return p.sym === sym; })[0] || null; }
function geschlossen(I, sym) { return I.getD().trades.filter(function (p) { return p.sym === sym && p.status === 'closed'; })[0] || null; }

/* Feste Uhr: Dienstag 10.11.2026, New York Winterzeit (UTC-5). Kerzen beginnen 14:30 ... 20:30 UTC. */
function nyUTC(j, m, t, h, mi) { return Date.UTC(j, m - 1, t, h + 5, mi || 0); }

/* ---------------- Die Tests ---------------- */
var TESTS = [];

/* F3-01 - Archiv leer/unlesbar: offene Position ohne Not-Stopp und ohne Zeit-Ausstieg.
 * Soll: eine offene Position wird mit dem frischen Kurs bewertet und gestoppt - die Laengenpruefung
 * (261 Kerzen) gilt dem SIGNAL, nicht dem Ausstieg. Ist: depot.js:2864 `continue` steht VOR dem
 * Positionsmanagement (ab 2880); mit dem Abruf allein (range=1mo, ~150 Kerzen) wird die Position nie
 * angesehen. Drei Laeufe: (a) Archiv leer, (b) Archiv wirft beim Lesen (archiv.js lade() behaelt das
 * abgelehnte Versprechen im Cache - auch der zweite Scan liest nicht), (c) Gegenprobe Archiv voll. */
TESTS.push({ name: 'F3-01 Archiv leer/unlesbar: offene Position bekommt weder Not-Stopp noch Zeit-Ausstieg', lauf: async function () {
  var jetzt = nyUTC(2026, 11, 10, 11, 35);
  var ts = stunden(nyUTC(2026, 11, 10, 10, 30), 500);
  var bars = flach(ts, 100);
  for (var k = 1; k <= 6; k++) bars[bars.length - k] = kerze(bars[bars.length - k][0], 70);   // Absturz auf 70: Not-Stopp -20 % weit unterschritten
  var openT = ts[ts.length - 20] + 61 * MIN;                                                        // vor 20 Handelsstunden eroeffnet: Zeit-Ausstieg laengst faellig
  async function lauf(art) {
    var store = {};
    if (art === 'voll') archiv(store, 'AAA', bars.slice(0, -10));
    var I = depotSandbox({ jetzt: jetzt, store: store, liefere: function (s, opt, j) { return s === 'AAA' ? sicht(bars, opt, j) : null; },
      storeGetWirft: art === 'wirft' ? { bars_60m_AAA: true } : null });
    var d = depotZustand(I);
    legeOffen(d, position(1, 'AAA', 100, openT));
    var fehlerVor = I.HEALTH.scanErrors;
    await I.intradayScan();                      // hier bewusst ohne Defekt-Pruefung: (b) bricht den Scan ab
    I.stelle(jetzt + 2 * MIN);
    await I.intradayScan();
    if (art !== 'wirft' && I.HEALTH.scanErrors !== fehlerVor) throw new Error('Scan-Fehler: ' + I.HEALTH.lastError.msg);
    var p = offen(I, 'AAA'), g = geschlossen(I, 'AAA');
    return { offen: !!p, why: g && g.why, exitSpot: g && g.exitSpot, gruende: grundVon(I, 'AAA'),
      abbrueche: I.HEALTH.scanErrors - fehlerVor, fehler: I.HEALTH.lastError && I.HEALTH.lastError.msg };
  }
  var a = await lauf('leer'), b = await lauf('wirft'), c = await lauf('voll');
  var abw = a.offen || b.offen || c.offen;
  return { abweichung: abw, text: 'Kurs 70 (Einstand 100, Not-Stopp -20 %), Haltedauer seit 20 Handelsstunden ueberschritten, frischer Abruf liefert 150 Kerzen. ' +
    '(a) Archiv leer: Position ' + (a.offen ? 'bleibt OFFEN' : 'geschlossen (' + a.why + ')') + ' - Monitor sagt "' + (a.gruende[a.gruende.length - 1] || '-') + '"; ' +
    '(b) Archiv wirft beim Lesen, zwei Scans: ' + (b.offen ? 'bleibt OFFEN' : 'geschlossen (' + b.why + ')') +
    (b.abbrueche ? ', und zwar weil BEIDE Scans ganz abbrechen ("' + b.fehler + '" - Archiv.fuege steht ohne try im Scan, der abgelehnte Ladevorgang bleibt im Cache)' : '') + '; ' +
    '(c) Gegenprobe Archiv voll: ' + (c.offen ? 'OFFEN' : 'geschlossen zu ' + de(c.exitSpot) + ' (' + c.why + ')') + '.' };
} });


/* F3-02 - Abruf scheitert fuer ein Symbol mit offener Position, danach kommt die Quelle zurueck.
 * Soll: ohne Kurs kein Ausstieg, aber sichtbar gemeldet; nach der Erholung Ausstieg zum FRISCHEN Kurs
 * (nicht rueckwirkend zu einem erfundenen oder alten Kurs). depot.js:2776-2791 (Nachversuch, exitBlind). */
TESTS.push({ name: 'F3-02 Abruf scheitert bei offener Position: kein Ausstieg ohne Kurs, Meldung, danach Ausstieg zum frischen Kurs', lauf: async function () {
  var j1 = nyUTC(2026, 11, 10, 11, 35), j2 = nyUTC(2026, 11, 10, 13, 35);
  var ts = stunden(nyUTC(2026, 11, 10, 13, 30), 500), bars = flach(ts, 100);
  bars[bars.length - 1] = kerze(bars[bars.length - 1][0], 104);          // laufende Kerze 13:30: frischer Kurs 104
  bars[bars.length - 2] = kerze(bars[bars.length - 2][0], 103);
  var openT = stunden(nyUTC(2026, 11, 9, 9, 30), 1)[0] + 61 * MIN;        // Mo 10:31 NY: Zeit-Ausstieg am Di gegen 12:30 faellig
  var quelleDa = false;
  var store = {}; archiv(store, 'AAA', bars.filter(function (b) { return b[0] < nyUTC(2026, 11, 10, 9, 0); }));
  var I = depotSandbox({ jetzt: j1, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' && quelleDa ? sicht(bars, opt, j) : null; } });
  var d = depotZustand(I); legeOffen(d, position(1, 'AAA', 100, openT));
  await I.scan();
  var nachAusfall = !!offen(I, 'AAA'), gemeldet = grundVon(I, 'AAA').some(function (g) { return /Kursquelle gestört/.test(g); });
  var blind = I.HEALTH.exitBlind || 0;
  quelleDa = true; I.stelle(j2);
  await I.scan();
  var g = geschlossen(I, 'AAA');
  var soll = nachAusfall && gemeldet && blind > 0 && g && g.exitSpot === 104;
  /* Zur Einordnung: die Messung steigt zum Schluss der 8. Kerze nach der Signalkerze aus; hier lag die
   * Quelle waehrend der Faelligkeit brach - live wird zum ersten frischen Kurs danach verkauft. */
  return { abweichung: !soll, text: 'Abruf scheitert (Mo-Einstieg, Di 11:35): Position ' + (nachAusfall ? 'bleibt offen' : 'GESCHLOSSEN') +
    ', Monitor ' + (gemeldet ? 'meldet "Kursquelle gestört – offene Position ohne frische Bewertung"' : 'meldet NICHTS') + ', exitBlind ' + blind +
    '. Quelle zurueck (13:35): ' + (g ? 'geschlossen zu ' + de(g.exitSpot) + ' (' + g.why + ') = frischer Kurs 104,00' : 'NICHT geschlossen') +
    '. Kein Ausstieg rueckwirkend; die Haltedauer verlaengert sich um die Ausfallzeit (Messung: Schluss der 8. Kerze).' };
} });

/* F3-03 - Veraltete Reihe bei offener Position: Not-Stopp zum 20 Stunden alten Kurs.
 * Soll: frischer Kurs oder "veraltet" melden. Ist: barsFrisch (risiko.js:40) gilt nur fuer Einstiege
 * (depot.js ~3156); der Ausstieg nimmt spot = letzte Kerze des Abrufs (depot.js:2846), gleich wie alt. */
TESTS.push({ name: 'F3-03 Veraltete Reihe: Not-Stopp/Ausstieg zum alten Kurs, ohne Kennzeichnung', lauf: async function () {
  var jetzt = nyUTC(2026, 11, 10, 11, 35);
  var ts = stunden(nyUTC(2026, 11, 9, 15, 30), 500), bars = flach(ts, 100);   // die Reihe endet Mo 15:30 NY - 20 Stunden alt
  bars[bars.length - 1] = kerze(bars[bars.length - 1][0], 75);
  var openT = stunden(nyUTC(2026, 11, 9, 10, 30), 1)[0] + 61 * MIN;
  var store = {}; archiv(store, 'AAA', bars.slice(0, -1));
  var I = depotSandbox({ jetzt: jetzt, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' ? sicht(bars, opt, j) : null; } });
  var d = depotZustand(I); legeOffen(d, position(1, 'AAA', 100, openT));
  await I.scan();
  var g = geschlossen(I, 'AAA');
  var alterH = (jetzt - bars[bars.length - 1][0]) / STD;
  var markiert = g && /veraltet|alt/i.test(g.why || '') || grundVon(I, 'AAA').some(function (x) { return /veraltet/i.test(x); });
  var abw = !!g && !markiert;
  return { abweichung: abw, text: 'Letzte Kerze ' + uhrzeitNY(bars[bars.length - 1][0]) + ' (' + de(alterH, 1) + ' h alt, Schluss 75), Uhr ' + uhrzeitNY(jetzt) + ': ' +
    (g ? 'geschlossen zu ' + de(g.exitSpot) + ' ("' + g.why + '"), ' + (markiert ? 'als veraltet gekennzeichnet' : 'ohne jeden Hinweis auf das Alter des Kurses') : 'Position bleibt offen') +
    '. Ein Einstieg auf denselben Daten waere als "Kursdaten veraltet" abgelehnt worden (barsFrisch, 3 Kerzen) - fuer Ausstiege gibt es keine Altersgrenze (risiko.js:35-38, bewusst).' };
} });

/* F3-04 / F3-05 - Einstieg auf eine alte Signalkerze. barsFrisch misst das Alter ab KERZENBEGINN und laesst
 * 3 Kerzenlaengen (180 min) zu. Liefert die Quelle die neueren Kerzen nicht (Verzug), steigt das Depot
 * bis zu 120 min nach dem Schluss der Signalkerze ein. Soll: handelt nicht (die Messung steigt zum Schluss
 * der Signalkerze ein; ein Signal, dessen Nachfolgekerze schon fertig sein muesste, ist veraltet). */
async function einstiegNachAlter(minutenSeitBeginn, oZusatz) {
  var endT = nyUTC(2026, 11, 10, 10, 30);
  var bars = signalReihe(endT, 300);
  var jetzt = endT + minutenSeitBeginn * MIN;
  var store = {}; archiv(store, 'AAA', bars.slice(0, -1));
  var I = depotSandbox(Object.assign({ jetzt: jetzt, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' ? sicht(bars, opt, j) : null; } }, oZusatz || {}));
  depotZustand(I);
  await I.scan();
  var p = offen(I, 'AAA');
  return { p: p, gruende: grundVon(I, 'AAA'), signalSchluss: bars[bars.length - 1][1], endT: endT, jetzt: jetzt };
}
TESTS.push({ name: 'F3-04 Einstieg auf eine Signalkerze, die schon 110 Minuten geschlossen ist (Quelle im Verzug)', lauf: async function () {
  var kontrolle = await einstiegNachAlter(61), alt = await einstiegNachAlter(170);
  if (!kontrolle.p) throw new Error('Kontrolle ohne Einstieg (' + kontrolle.gruende.join(' | ') + ') - Kunstreihe traegt nicht');
  return { abweichung: !!alt.p, text: 'Signalkerze ' + uhrzeitNY(alt.endT) + ', Schluss ' + de(alt.signalSchluss) + '. Kontrolle 1 min nach Kerzenschluss: Einstieg zu ' +
    de(kontrolle.p.entrySpot) + '. Quelle liefert danach nichts Neueres, Uhr ' + uhrzeitNY(alt.jetzt) + ' (110 min nach Kerzenschluss): ' +
    (alt.p ? 'EINSTIEG zu ' + de(alt.p.entrySpot) + ' - auf einem Signal, dessen Nachfolgekerze laengst fertig sein muesste' : 'kein Einstieg (' + alt.gruende.slice(-1)[0] + ')') +
    '. barsFrisch erlaubt 3 x 60 min ab Kerzenbeginn = bis 120 min nach Kerzenschluss.' };
} });
TESTS.push({ name: 'F3-05 Schutz greift: Signalkerze aelter als 3 Kerzenlaengen wird nicht gehandelt', lauf: async function () {
  var x = await einstiegNachAlter(200);
  var gemeldet = x.gruende.some(function (g) { return /Kursdaten veraltet/.test(g); });
  return { abweichung: !!x.p || !gemeldet, text: 'Signalkerze ' + uhrzeitNY(x.endT) + ', Uhr ' + uhrzeitNY(x.jetzt) + ' (200 min ab Kerzenbeginn): ' +
    (x.p ? 'EINSTIEG' : 'kein Einstieg') + ', Monitor: "' + (x.gruende.slice(-1)[0] || '-') + '".' };
} });

/* F3-06 - Regime-Filter (regimeZuteilung an) ohne SPY-Daten: das Depot handelt ungefiltert.
 * depot.js ~2652-2680 spyTrendAuf: ohne Anker auf = null ("Regel setzt aus, Basis-Verhalten"), 30 min
 * zwischengespeichert; 3101-3116 laesst rsi2seit bei null durch. Soll: handelt nicht (fail-closed). */
TESTS.push({ name: 'F3-06 Regime-Filter an, SPY-Abruf scheitert: rsi2seit handelt ungefiltert', lauf: async function () {
  var endT = nyUTC(2026, 11, 10, 10, 30), bars = signalReihe(endT, 300);
  var spyTs = stunden(endT, 600), spyAb = spyTs.map(function (t, i) { return kerze(t, 500 - i * 0.2); });   // SPY faellt: unter der EMA200
  async function lauf(spyDa) {
    var store = {}; archiv(store, 'AAA', bars.slice(0, -1));
    var I = depotSandbox({ jetzt: endT + 61 * MIN, store: store, liefere: function (sy, opt, j) {
      if (sy === 'AAA') return sicht(bars, opt, j);
      if (sy === 'SPY') return spyDa ? sicht(spyAb, opt, j) : null;
      return null; } });
    depotZustand(I, function (d) { d.intraday.regimeZuteilung = true; });
    await I.scan();
    return { p: offen(I, 'AAA'), gruende: grundVon(I, 'AAA') };
  }
  var mit = await lauf(true), ohne = await lauf(false);
  var gegenprobeOk = !mit.p && mit.gruende.some(function (g) { return /Regime/.test(g); });
  if (!gegenprobeOk) throw new Error('Gegenprobe: mit fallendem SPY haette der Filter blocken muessen (' + mit.gruende.join(' | ') + ')');
  return { abweichung: !!ohne.p, text: 'SPY faellt (unter EMA200): Einstieg blockiert ("' + mit.gruende.slice(-1)[0] + '"). SPY-Abruf scheitert: ' +
    (ohne.p ? 'EINSTIEG zu ' + de(ohne.p.entrySpot) + ' - der Filter faellt offen, und das Ergebnis "kein Anker" gilt 30 min' : 'kein Einstieg') + '.' };
} });

/* F3-07 - Regime-Filter auf ALTEN SPY-Daten: spyTrendAuf prueft das Alter der letzten SPY-Kerze nicht. */
TESTS.push({ name: 'F3-07 Regime-Filter rechnet auf SPY-Kerzen, die einen Monat alt sind', lauf: async function () {
  var endT = nyUTC(2026, 11, 10, 10, 30), bars = signalReihe(endT, 300);
  var spyTs = stunden(endT, 700);
  var spy = spyTs.map(function (t, i) { return kerze(t, i < 560 ? 400 + i * 0.2 : 512 - (i - 560) * 0.9); });   // bis vor 140 Kerzen steigend, seitdem Absturz
  var altEnde = spy[559][0];
  async function lauf(veraltet) {
    var store = {}; archiv(store, 'AAA', bars.slice(0, -1));
    var I = depotSandbox({ jetzt: endT + 61 * MIN, store: store, liefere: function (sy, opt, j) {
      if (sy === 'AAA') return sicht(bars, opt, j);
      if (sy === 'SPY') return veraltet ? spy.slice(0, 560) : sicht(spy, opt, j);
      return null; } });
    depotZustand(I, function (d) { d.intraday.regimeZuteilung = true; });
    await I.scan();
    return { p: offen(I, 'AAA'), gruende: grundVon(I, 'AAA') };
  }
  var frisch = await lauf(false), alt = await lauf(true);
  if (frisch.p) throw new Error('Gegenprobe: auf frischen SPY-Daten (Absturz) haette der Filter blocken muessen');
  return { abweichung: !!alt.p, text: 'Frische SPY-Reihe (Absturz der letzten 140 Stunden): blockiert. SPY-Antwort endet ' + uhrzeitNY(altEnde) +
    ' (' + Math.round((endT - altEnde) / TAG) + ' Kalendertage alt, damals Aufwaertstrend): ' +
    (alt.p ? 'EINSTIEG zu ' + de(alt.p.entrySpot) + ' - kein Alterscheck auf der SPY-Reihe, keine Meldung' : 'kein Einstieg') + '.' };
} });

/* F3-08 - Luecke in der 60m-Reihe: App war ~2 Monate aus. Das Archiv endet vor 300 Handelsstunden, der Abruf
 * (range=1mo) bringt die letzten 150. depot.js:2842 rechnet auf der zusammengesetzten Reihe, die Laengen-
 * pruefung (2864) zaehlt nur Kerzen, nicht Luecken. EMA100/Kanal(200) spannen damit ueber die Luecke.
 * Soll: auf einer lueckenhaften Reihe nicht handeln (oder erst auffuellen) - die Messung lief auf
 * durchgehenden Daten. */
TESTS.push({ name: 'F3-08 Luecke von 300 Handelsstunden im Archiv: Signal auf der zusammengestueckelten Reihe', lauf: async function () {
  var endT = nyUTC(2026, 11, 10, 10, 30), fund = null;
  for (var seed = 1; seed < 300 && !fund; seed++) {
    var ts = stunden(endT, 900), C = rauschen(ts, seed);
    for (var e = 760; e < 900; e++) {
      var Ce = C.slice(0, e + 1), G = C.slice(0, e - 450 + 1).concat(C.slice(e - 149, e + 1));
      if (signalCall(G, G.length - 1) && !signalCall(Ce, Ce.length - 1)) {
        var ts2 = stunden(endT, e + 1);
        Ce = Ce.map(function (b, k) { return [ts2[k]].concat(b.slice(1)); });
        fund = { C: Ce, archivTeil: Ce.slice(0, e - 450 + 1), seed: seed }; break;
      }
    }
  }
  if (!fund) throw new Error('keine Kunstreihe gefunden');
  var store = {}; archiv(store, 'AAA', fund.archivTeil);
  var I = depotSandbox({ jetzt: endT + 61 * MIN, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' ? sicht(fund.C, opt, j) : null; } });
  depotZustand(I);
  await I.scan();
  var p = offen(I, 'AAA');
  var arch = await I.win.Archiv.serie('60m', 'AAA');
  var maxLueckeH = 0; for (var k = 1; k < arch.length; k++) maxLueckeH = Math.max(maxLueckeH, (arch[k][0] - arch[k - 1][0]) / STD);
  return { abweichung: !!p, text: 'Archiv endet ' + uhrzeitNY(fund.archivTeil[fund.archivTeil.length - 1][0]) + ', Abruf liefert die letzten 150 Kerzen; ' +
    'zusammengesetzt ' + arch.length + ' Kerzen mit einer Luecke von ' + Math.round(maxLueckeH / 24) + ' Kalendertagen. Auf der durchgehenden Reihe: kein rsi2seit-Signal; ' +
    'live: ' + (p ? 'EINSTIEG zu ' + de(p.entrySpot) + ' - ohne Pruefung auf Luecken' : 'kein Einstieg (' + grundVon(I, 'AAA').slice(-1)[0] + ')') + '.' };
} });

/* F3-09 - Zeit-Ausstieg: wie viele Kerzen haelt live? Die Messung (edgeZustand depot.js ~6200, c[i+H]/c[i],
 * H = 8) steigt zum Schluss der Signalkerze ein und zum Schluss der 8. Kerze danach aus. Live zaehlt
 * depot.js:2915 nur Kerzen mit Beginn NACH openT - openT liegt aber nach dem Beginn der 1. Kerze danach
 * (Einstieg erst, wenn die Signalkerze fertig ist). Luecken (Handelsstopp) verlaengern Messung und
 * Live gleich - beide zaehlen Kerzen. (Ein Regel-Befund - zur Einordnung fuer Frage 1.) */
TESTS.push({ name: 'F3-09 Zeit-Ausstieg zaehlt ab dem Einstiegszeitpunkt: 9 statt 8 Kerzen gehalten', lauf: async function () {
  var S = nyUTC(2026, 11, 10, 10, 30), nach = stundenNach(S, 10);
  var ts = stunden(nach[9], 500), bars = flach(ts, 100);
  var openT = S + 61 * MIN;
  async function stand(jetzt) {
    var store = {}; archiv(store, 'AAA', bars.filter(function (b) { return b[0] < S; }));
    var I = depotSandbox({ jetzt: jetzt, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' ? sicht(bars, opt, j) : null; } });
    var d = depotZustand(I); legeOffen(d, position(1, 'AAA', 100, openT));
    await I.scan();
    return geschlossen(I, 'AAA');
  }
  var nach8 = await stand(nach[7] + 61 * MIN), nach9 = await stand(nach[8] + 61 * MIN);
  return { abweichung: !nach8, text: 'Signalkerze ' + uhrzeitNY(S) + ', Einstieg ' + uhrzeitNY(openT) + '. Messung: Ausstieg zum Schluss der 8. Kerze danach (Kerze ab ' + uhrzeitNY(nach[7]) + '). ' +
    'Live 1 min danach: ' + (nach8 ? 'geschlossen ("' + nach8.why + '")' : 'NOCH OFFEN') + '; nach der 9. Kerze: ' + (nach9 ? 'geschlossen ("' + nach9.why + '")' : 'noch offen') +
    '. Die erste Kerze nach dem Signal beginnt vor openT und zaehlt nie mit.' };
} });

/* F3-10 - Einstieg am Freitag: das 2-Tage-Schutznetz (depot.js:2901, "falls die App pausiert hat") greift
 * am Montag beim ersten Scan, VOR dem Zeit-Ausstieg - die Position wird zur Montagseroeffnung verkauft
 * statt nach 8 Handelsstunden. Dasselbe nach jedem Ruhezustand ueber 2 Kalendertage: Ausstieg zum
 * frischen Kurs (das ist das Soll), aber jede Freitagsposition trifft es auch bei laufender App. */
TESTS.push({ name: 'F3-10 Freitags-Einstieg: Schutznetz schliesst Montag zur Eroeffnung statt nach 8 Handelsstunden', lauf: async function () {
  var S = nyUTC(2026, 11, 13, 14, 30), openT = S + 61 * MIN;              // Freitag 13.11., Signalkerze 14:30 NY
  var mo = nyUTC(2026, 11, 16, 9, 35);                                     // Montag, erster Scan nach der Eroeffnung
  var ts = stunden(nyUTC(2026, 11, 16, 9, 30), 500), bars = flach(ts, 100);
  bars[bars.length - 1] = kerze(bars[bars.length - 1][0], 101.5);         // laufende Montagskerze
  var store = {}; archiv(store, 'AAA', bars.filter(function (b) { return b[0] < S; }));
  var I = depotSandbox({ jetzt: mo, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' ? sicht(bars, opt, j) : null; } });
  var d = depotZustand(I); legeOffen(d, position(1, 'AAA', 100, openT));
  await I.scan();
  var g = geschlossen(I, 'AAA');
  var messAus = stundenNach(S, 8)[7];
  return { abweichung: !!g, text: 'Einstieg ' + uhrzeitNY(openT) + ' (Fr). Messung: Ausstieg zum Schluss der 8. Kerze danach (Kerze ab ' + uhrzeitNY(messAus) + ', Montagsschluss). ' +
    'Live, Uhr ' + uhrzeitNY(mo) + ': ' + (g ? 'GESCHLOSSEN zu ' + de(g.exitSpot) + ' ("' + g.why + '") nach 1 von 8 Kerzen' : 'offen') + '.' };
} });

/* F3-11 - Neustart an einem neuen Tag: der Tagesstart des Kill-Switch wird mit EINSTANDSKURSEN gesetzt.
 * LASTBARS ist nach dem Start leer; spotOf (depot.js ~1915) faellt fuer Werte ausserhalb des Kurs-Tickers
 * auf entrySpot zurueck; killSwitchPruefen (2795) laeuft VOR dem Fuellen von LASTBARS (2818) und setzt
 * ensureDay mit diesem Wert. Der Kursverlust von gestern zaehlt damit als heutiger Tagesverlust.
 * Soll: Tagesstart = Bewertung zum letzten bekannten Kurs. (Positionsgroesse 20 % des Depots, damit die
 * 3-%-Schwelle sichtbar wird - der Versatz selbst haengt nicht an der Groesse.) */
TESTS.push({ name: 'F3-11 Neustart am neuen Tag: Tagesstart zu Einstandskursen, Kill-Switch loest auf den Verlust von gestern aus', lauf: async function () {
  var openT = nyUTC(2026, 11, 9, 14, 31), j1 = nyUTC(2026, 11, 10, 10, 35);
  var ts = stunden(nyUTC(2026, 11, 10, 10, 30), 500);
  var bars = ts.map(function (t) { return kerze(t, t < nyUTC(2026, 11, 9, 15, 0) ? 100 : 92); });   // Mo 15:30 auf 92 gefallen
  var store = {}; archiv(store, 'AAA', bars.slice(0, -3)); archiv(store, 'BBB', bars.slice(0, -3));
  var I = depotSandbox({ jetzt: j1, store: store, stocks: ['AAA', 'BBB'], liefere: function (sy, opt, j) { return (sy === 'AAA' || sy === 'BBB') ? sicht(bars, opt, j) : null; } });
  var d = depotZustand(I, function (dd) { dd.dayKey = '2026-11-09'; dd.dayStartEq = 100000; });
  legeOffen(d, position(1, 'AAA', 100, openT, 20000)); legeOffen(d, position(2, 'BBB', 100, openT, 20000));
  var eqGestern = d.cash + d.positions.reduce(function (a, p) { return a + p.qty * 92 * (1 - p.spx); }, 0);
  await I.scan();
  var start = d.dayStartEq;
  I.stelle(j1 + 2 * MIN);
  await I.scan();
  var ks = d.killSwitch;
  return { abweichung: !!ks || Math.abs(start - eqGestern) > 1, text: 'Positionen zu 100 gekauft, Montagsschluss 92; Dienstag erster Scan nach Neustart: Tagesstart ' + de(start, 0) +
    ' $ (Soll, zum letzten Kurs: ' + de(eqGestern, 0) + ' $). Zweiter Scan: ' + (ks ? 'KILL-SWITCH ("' + ks.pct + ' %"), ' + ks.n + ' Positionen glattgestellt zu 92 - ohne jede Kursbewegung heute' : 'kein Kill-Switch') + '.' };
} });

/* F3-12 - Nullkurs ueber den Capital-Ersatzweg. Yahoo faellt aus, CapAPI.prices (capital.js ~250-254)
 * prueft nur bid != null - ein Geldkurs 0 ergibt die Mitte (0 + Brief)/2. Der Yahoo-Lader verwirft
 * dieselbe 0 (kurse.js kursOk). Soll: kursOk auf beiden Wegen; kein Stopp auf einen Fehldruck. */
TESTS.push({ name: 'F3-12 Fehldruck (Geldkurs 0) ueber den Capital-Ersatzweg loest den Not-Stopp aus; ueber Yahoo nicht', lauf: async function () {
  var jetzt = nyUTC(2026, 11, 10, 11, 35);
  var ts = stunden(nyUTC(2026, 11, 10, 10, 30), 500), bars = flach(ts, 100);
  var openT = stunden(nyUTC(2026, 11, 10, 9, 30), 1)[0] + 61 * MIN;
  function capText(sym) {
    if (sym !== 'AAA') return '{"prices":[]}';
    var ps = bars.slice(-300).map(function (b, k, arr) {
      var letzte = k === arr.length - 1;
      return { snapshotTimeUTC: new Date(b[0]).toISOString().slice(0, 19), closePrice: { bid: letzte ? 0 : b[1] - 0.05, ask: b[1] + 0.05 }, lastTradedVolume: 1000 };
    });
    return JSON.stringify({ prices: ps });
  }
  async function lauf(weg) {
    var store = { cap_epics: { AAA: 'AAA' } }; archiv(store, 'AAA', bars.slice(0, -2));
    var mitNull = bars.slice(); mitNull[mitNull.length - 1] = [bars[bars.length - 1][0], 0, 1e6, 0, 0];
    var I = depotSandbox({ jetzt: jetzt, store: store, capital: weg === 'capital' ? { prices: capText } : null,
      liefere: function (sy, opt, j) { return (weg === 'yahoo' && sy === 'AAA') ? sicht(mitNull, opt, j) : null; } });
    var d = depotZustand(I); legeOffen(d, position(1, 'AAA', 100, openT));
    await I.scan();
    return { g: geschlossen(I, 'AAA'), o: offen(I, 'AAA') };
  }
  var y = await lauf('yahoo'), c = await lauf('capital');
  return { abweichung: !!c.g || !!y.g, text: 'Letzte Kerze mit Kurs 0. Ueber Yahoo: ' + (y.g ? 'GESCHLOSSEN zu ' + de(y.g.exitSpot) : 'verworfen (kurse.js kursOk), Position bleibt offen') +
    '. Ueber den Capital-Ersatzweg (Geld 0 / Brief 100,05): ' + (c.g ? 'GESCHLOSSEN zu ' + de(c.g.exitSpot) + ' ("' + c.g.why + '")' : 'Position bleibt offen') + '.' };
} });

/* F3-13 - Vorlauf zu kurz (< 261 Kerzen): kein Signal, kein Einstieg (Schutz depot.js ~2853). */
TESTS.push({ name: 'F3-13 Schutz greift: Vorlauf unter 261 Kerzen - kein Signal, kein Einstieg', lauf: async function () {
  var endT = nyUTC(2026, 11, 10, 10, 30), bars = signalReihe(endT, 300).slice(-200);
  var store = {}; archiv(store, 'AAA', bars.slice(0, -1));
  var I = depotSandbox({ jetzt: endT + 61 * MIN, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' ? sicht(bars, opt, j) : null; } });
  depotZustand(I);
  await I.scan();
  var gr = grundVon(I, 'AAA'), p = offen(I, 'AAA');
  return { abweichung: !!p || !gr.some(function (g) { return /zu kurz/.test(g); }), text: '200 Kerzen (auf 261 waere die letzte ein Signal): ' + (p ? 'EINSTIEG' : 'kein Einstieg') +
    ', Monitor: "' + (gr.slice(-1)[0] || '-') + '".' };
} });

/* F3-14 - Edge-Waechter ohne Messbasis (leeres Archiv). Er misst NICHT aus den Messprotokollen, sondern aus
 * dem 60m-Archiv (depot.js ~6164); unter 5 Werten liefert er nur einen Text, keine Zahl - die
 * Pausen-Entscheidung (~6377, verfall braucht nSym >= 5) bleibt aus, gehandelt wird weiter. Der Waechter
 * ist nicht Teil der gemessenen Regel; ohne ihn handelt das Depot die gemessene Regel. */
TESTS.push({ name: 'F3-14 Edge-Waechter ohne Messbasis: meldet "erst 0 Signale", pausiert nicht, Handel laeuft', lauf: async function () {
  var endT = nyUTC(2026, 11, 10, 10, 30), bars = signalReihe(endT, 300);
  var store = {};
  var I = depotSandbox({ jetzt: endT + 61 * MIN, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' ? sicht(bars, opt, j) : null; } });
  var d = depotZustand(I);
  var e = await I.edgeZustand('rsi2seit');
  archiv(store, 'AAA', bars.slice(0, -1));
  var I2 = depotSandbox({ jetzt: endT + 61 * MIN, store: store, liefere: function (sy, opt, j) { return sy === 'AAA' ? sicht(bars, opt, j) : null; } });
  depotZustand(I2);
  await I2.scan();
  var p = offen(I2, 'AAA');
  var meldet = /erst 0/.test(e.txt || '');
  return { abweichung: !meldet || e.rohMittel != null || !!d.intraday.edgePause, text: 'Waechter auf leerem Archiv: "' + e.txt + '" (keine Zahl, also keine Pause). ' +
    'Ein Signal wird danach ' + (p ? 'gehandelt' : 'nicht gehandelt') + ' - wie in der Messung, die keinen Waechter kennt. Die Messprotokolle (Datenordner) steuern den Handel nicht, nur die Anzeige.' };
} });

/* F3-15 - Kill-Switch stellt eine Position glatt, deren Abruf gerade scheitert - zu einem Kurs aus einem
 * frueheren Scan. killSwitchPruefen (depot.js ~132-160) nimmt spotOf -> LASTBARS (nur bei Erfolg
 * ueberschrieben, 2818) und schliesst alles mit Kurs > 0. Die Meldung behauptet, Positionen ohne
 * aktuellen Kurs blieben offen. Ausserdem: der Kill-Switch sieht die Kurse des laufenden Scans erst
 * im NAECHSTEN Scan (LASTBARS wird nach ihm gefuellt), entgegen dem Kommentar bei ~2793. */
TESTS.push({ name: 'F3-15 Kill-Switch schliesst eine Position ohne frischen Kurs zum 3 Stunden alten Kurs', lauf: async function () {
  var j1 = nyUTC(2026, 11, 10, 10, 35), j2 = nyUTC(2026, 11, 10, 13, 35), j3 = j2 + 2 * MIN;
  var ts = stunden(nyUTC(2026, 11, 10, 13, 30), 500);
  var aaa = flach(ts, 100), bbb = ts.map(function (t) { return kerze(t, t >= nyUTC(2026, 11, 10, 11, 0) ? 84 : 100); });
  var openT = nyUTC(2026, 11, 10, 10, 31), aaaWeg = false;
  var store = {}; archiv(store, 'AAA', aaa.slice(0, -6)); archiv(store, 'BBB', bbb.slice(0, -6));
  var I = depotSandbox({ jetzt: j1, store: store, stocks: ['AAA', 'BBB'], liefere: function (sy, opt, j) {
    if (sy === 'AAA') return aaaWeg ? null : sicht(aaa, opt, j);
    if (sy === 'BBB') return sicht(bbb, opt, j);
    return null; } });
  var d = depotZustand(I);
  legeOffen(d, position(1, 'AAA', 100, openT, 20000)); legeOffen(d, position(2, 'BBB', 100, openT, 20000));
  await I.scan();                                    // 10:35: alles frisch, LASTBARS gefuellt, Tagesstart gesetzt
  aaaWeg = true; I.stelle(j2);
  await I.scan();                                    // 13:35: AAA-Abruf scheitert, BBB bei 84
  var nachScan2 = !!d.killSwitch;
  I.stelle(j3);
  await I.scan();                                    // 13:37
  var gA = geschlossen(I, 'AAA');
  var kursAlterMin = I.LASTBARS.AAA ? Math.round((j3 - I.LASTBARS.AAA[I.LASTBARS.AAA.length - 1][0]) / MIN) : null;
  return { abweichung: !!(gA && /Kill-Switch/.test(gA.why || '')), text: 'BBB faellt auf 84 (Tagesverlust ueber 3 %), AAA-Abruf scheitert seit 13:35. Kill-Switch im Scan 13:35: ' +
    (nachScan2 ? 'ausgeloest' : 'NICHT ausgeloest (rechnet mit den Kursen des Vorscans)') + '; im Scan 13:37: ' + (d.killSwitch ? 'ausgeloest' : 'nicht ausgeloest') +
    '. AAA: ' + (gA ? 'GESCHLOSSEN zu ' + de(gA.exitSpot) + ' ("' + gA.why + '") - Kurs aus LASTBARS, letzte Kerze ' + kursAlterMin + ' min alt' : 'bleibt offen') + '.' };
} });

/* F3-16 - Offene Position auf einem Wert, der nicht (mehr) im Scan-Universum steht: Watchlist-Eintrag
 * entfernt, Pool umgestellt, Screener-Treffer von gestern (scanUniverse depot.js ~2007-2018 nimmt
 * Screener-Treffer nur fuer HEUTE, den Extra-Pool nur einmal je Kerze). intradayScan ruft nur
 * scanUniverse() ab und managt Positionen nur innerhalb der Symbol-Schleife (ab 2880) - fuer diesen Wert
 * wird nie ein Kurs geholt: kein Not-Stopp, kein Zeit-Ausstieg, Bewertung zum Einstand (spotOf ~1915).
 * Soll: jede offene Position wird in jedem Scan abgerufen und gemanagt. */
TESTS.push({ name: 'F3-16 Offene Position ausserhalb des Scan-Universums: nie abgerufen, nie gestoppt, zum Einstand bewertet', lauf: async function () {
  var jetzt = nyUTC(2026, 11, 10, 11, 35);
  var ts = stunden(nyUTC(2026, 11, 10, 10, 30), 500), bars = flach(ts, 100), zzz = flach(ts, 100);
  for (var k = 1; k <= 6; k++) zzz[zzz.length - k] = kerze(zzz[zzz.length - k][0], 70);
  var store = {}; archiv(store, 'AAA', bars.slice(0, -2)); archiv(store, 'ZZZ', zzz.slice(0, -2));
  var I = depotSandbox({ jetzt: jetzt, store: store, stocks: ['AAA'], liefere: function (sy, opt, j) {
    if (sy === 'AAA') return sicht(bars, opt, j);
    if (sy === 'ZZZ') return sicht(zzz, opt, j);
    return null; } });
  var d = depotZustand(I);
  legeOffen(d, position(1, 'ZZZ', 100, stunden(nyUTC(2026, 11, 9, 9, 30), 1)[0] + 61 * MIN));
  for (var r = 0; r < 3; r++) { I.stelle(jetzt + r * 2 * MIN); await I.scan(); }
  var abgerufen = I.abrufe.filter(function (a) { return a.sym === 'ZZZ'; }).length;
  var p = offen(I, 'ZZZ');
  var wert = p ? I.equityNow() - d.cash : null;
  return { abweichung: !!p, text: 'ZZZ (Kurs 70, Einstand 100, Zeit-Ausstieg faellig) steht nicht in Basis/Watchlist/Pool. Drei Scans: ZZZ ' + abgerufen + 'x abgerufen, Position ' +
    (p ? 'bleibt OFFEN, bewertet mit ' + de(wert, 0) + ' $ (zum Einstand; Wert zum Kurs 70: ' + de(p.qty * 70 * (1 - p.spx), 0) + ' $)' : 'geschlossen') + '.' };
} });

module.exports = TESTS;

if (require.main === module) {
  (async function () {
    var nur = process.argv[2] ? parseInt(process.argv[2], 10) : null;
    for (var i = 0; i < TESTS.length; i++) {
      if (nur && nur !== i + 1) continue;
      var t = TESTS[i], r;
      try { r = await t.lauf(); }
      catch (e) { r = { abweichung: true, text: 'TESTDEFEKT (kein Befund, das Pruefgeschirr ist gescheitert): ' + (e && e.message ? e.message : e) }; }
      console.log((r.abweichung ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + t.name + ' — ' + r.text);
    }
  })();
}
