'use strict';
/* Gemeinsame Hilfen der Generalprobe 23.11.2026 (Auftrag: Umschichtung Mo 23.11.2026, New York).
 * Uebernommen aus pruefberichte/live-gegen-messung-momentum.test.js (Hilfen-Abschnitt, unveraendert);
 * Erweiterungen stehen unten und in den eigenen Dateien der Unteraufgaben. Reines Node, keine
 * Kursdaten, keine Schluessel, kein Netz. Alles Simulation mit virtuellem Kapital. */
var vm = require('vm');

var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..', '..');
var MH = require(path.join(WURZEL, 'mfhandel.js'));
var Ms = require(path.join(WURZEL, 'massstab.js'));
var KK = require(path.join(WURZEL, 'kurse.js'));
var TAG = 86400000;

/* ---------------- Hilfen ---------------- */

/** Stempel eines Tagesbalkens wie bei Yahoo: Eroeffnung 13:30 UTC des Tages von ms (New-Yorker Tag derselbe). */
function stempel(ms) {
  var d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 13, 30);
}
function werktag(t) { var w = new Date(t).getUTCDay(); return w !== 0 && w !== 6; }
/** Juengster Werktag strikt VOR dem UTC-Tag von ms (Stempel 13:30 UTC). */
function werktagVor(ms) {
  var t = stempel(ms) - TAG;
  while (!werktag(t)) t -= TAG;
  return t;
}
/** n Werktage (Mo-Fr, ohne Feiertage), der letzte ist endeT (ein Werktag-Stempel). */
function werktageBis(endeT, n) {
  var aus = [], t = endeT;
  while (aus.length < n) { if (werktag(t)) aus.unshift(t); t -= TAG; }
  return aus;
}
/* Die feste Uhr: Ende November 2026 gilt in New York Winterzeit (UTC-5). */
function nyUTC(j, m, t, h, min) { return Date.UTC(j, m - 1, t, h + 5, min || 0); }
var FR = Date.UTC(2026, 10, 20, 13, 30), MO = Date.UTC(2026, 10, 23, 13, 30), DI = Date.UTC(2026, 10, 24, 13, 30);
/** Kursweg mit fester Staerke: Kurs(i-21) / Kurs(i-252) - 1 = staerke (mfhandel.js momentumZiel). */
function kursweg(n, staerke) {
  var aus = [];
  for (var j = 0; j < n; j++) aus.push(100 * Math.pow(1 + staerke, (j - (n - 1 - 21)) / 231));
  return aus;
}
/** Reihe des Bestands: [[t, schluss, stueck, adjclose]]. 3 Mio Stueck x ~100 $ = liquide. adjclose = schluss. */
function buchReihe(tage, kurse, stueck) {
  return tage.map(function (t, j) { return [t, kurse[j], stueck == null ? 3e6 : stueck, kurse[j]]; });
}
/** Antwort des Kurs-Laders wie Kurse.hole (kurse.js): bars [[t, schluss, volumen, hoch, tief, eroeffnung]], Schluss je nach
 *  bereinigt (adjclose = Spalte 4 der Kunstreihe) und mit o.mitRoh die rohen Schluesse (Spalte 1). */
function ladeAntwort(reihe, o) {
  o = o || {};
  var bars = reihe.map(function (b) { var c = o.bereinigt === false ? b[1] : b[3]; return [b[0], c, b[2], c, c, b[4] != null ? b[4] : b[1]]; });
  var aus = { bars: bars, verworfen: 0, gesamt: reihe.length, feld: o.bereinigt === false ? 'close' : 'adjclose' };
  if (o.mitRoh) aus.roh = reihe.map(function (b) { return [b[0], b[1]]; });
  if (o.ereignisse) aus.ereignisse = { div: [], split: [] };
  return aus;
}
function universum() {
  var src = fs.readFileSync(path.join(WURZEL, 'mittelfrist.js'), 'utf8');
  var m = /var UNIVERSUM = \(\s*([\s\S]*?)\s*\)\.split/.exec(src);
  /* Die Liste steht als verkettete Zeichenkette im Quelltext; sie wird gelesen, nicht abgeschrieben. */
  var text = m[1].split('\n').map(function (z) { var q = /'([^']*)'/.exec(z); return q ? q[1] : ''; }).join('');
  return text.split(/\s+/).filter(Boolean);
}
function speicher(anfang) {
  var s = anfang || {};
  function kopie(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
  return {
    daten: s,
    api: {
      storeGet: async function (n) { return kopie(s[n]); },
      storeSet: async function (n, v) { s[n] = kopie(v); return { ok: true }; }
    }
  };
}
/** Tagesdaten so ablegen, wie tagesdatenSchreiben (mittelfrist.js) es tut - samt Ereignis-Bestand und, seit Nr. 93,
 *  der Bezugsreihe SPY (mf_bezug, gleicher Stand). Ein aelterer Stand der App liest mf_bezug nicht. */
function tagesdatenAblegen(st, roh, at, spy) {
  var syms = Object.keys(roh).sort(), teile = Math.max(1, Math.ceil(syms.length / 25));
  for (var t = 0; t < teile; t++) {
    var stueck = {};
    syms.slice(t * 25, (t + 1) * 25).forEach(function (s) { stueck[s] = roh[s]; });
    st.daten['mf_tagesdaten_teil_' + t] = { roh: stueck };
  }
  st.daten.mf_ereignisse = { at: at, sym: {} };
  if (spy) st.daten.mf_bezug = { at: at, sym: 'SPY', reihe: spy };
  st.daten.mf_tagesdaten_index = { at: at, weg: [], teile: teile };
}
function symboleImBestand(st) {
  var idx = st.daten.mf_tagesdaten_index, n = 0;
  for (var t = 0; idx && t < idx.teile; t++) n += Object.keys((st.daten['mf_tagesdaten_teil_' + t] || {}).roh || {}).length;
  return n;
}
var STATUS = [];
var U_ATTRAPPE = {
  statuszeile: function (ziel, text) { STATUS.push(String(ziel) + ': ' + text); return null; },
  esc: String, d: String, dt: String, money: String, signTxt: String, pz1: String, nf2: { format: String }
};
/** Eine Uhr fuer die Sandbox: Date.now() und new Date() stehen auf jetzt; new Date(x) wie gewohnt. */
function uhr(jetzt) {
  var Uh = function (x) { return arguments.length ? new Date(x) : new Date(Uh.jetzt); };
  Uh.now = function () { return Uh.jetzt; }; Uh.jetzt = jetzt; Uh.UTC = Date.UTC; Uh.parse = Date.parse;
  return Uh;
}
/** Ein Fenster-Modul in einer Sandbox laden, auf der Uhr jetzt (Date wird je Datei ersetzt). Zeitgeber unter einer
 *  Sekunde laufen sofort (die 90-ms-Pausen der Lader); laengere sind stumm (mfdepot.js startet in bereit() einen
 *  Takt nach 12 s und alle 30 min - die sollen hier nicht von selbst laufen). win.__el: Elemente nach Kennung. */
function sandbox(dateien, win, jetzt) {
  var doc = { readyState: 'complete', addEventListener: function () { }, getElementById: function (id) { return (win.__el && win.__el[id]) || null; } };
  var ctx = {
    window: win, document: doc, console: console, __Uhr: uhr(jetzt),
    setTimeout: function (f, ms) { if (ms >= 1000) return 0; setImmediate(f); return 0; },
    setInterval: function () { return 0; }
  };
  win.document = doc;
  vm.createContext(ctx);
  dateien.forEach(function (d) {
    vm.runInContext('(function (Date) {' + fs.readFileSync(path.join(WURZEL, d), 'utf8') + '\n})(__Uhr);', ctx, { filename: d });
  });
  win.__uhr = ctx.__Uhr;
  return win;
}
function kursAttrappe(liefere) {
  return { hole: liefere, ereignisseAb: KK.ereignisseAb };
}
function mittelfristSandbox(st, hole, jetzt) {
  return sandbox(['mittelfrist.js'], {
    U: U_ATTRAPPE, Momentum: require(path.join(WURZEL, 'momentum.js')), Liquide: require(path.join(WURZEL, 'liquide.js')),
    MFHandel: MH, api: st.api, Kurse: kursAttrappe(hole)
  }, jetzt);
}
/** mfdepot.js in der Sandbox. eroeffnungen: {SYM: Eroeffnung des Ausfuehrungstags} fuer den Abruf am Ausfuehrungstag
 *  (A4) - ein Stand der App, der so nicht abruft, fragt die Attrappe nie. */
function mfdepotSandbox(st, d, MF, jetzt, eroeffnungen) {
  var karte = { innerHTML: '' };
  var win = sandbox(['mfdepot.js'], {
    U: U_ATTRAPPE, api: st.api, MF: MF, MFHandel: MH, Massstab: Ms, __el: { buchMomentumKopf: karte },
    Kurse: kursAttrappe(async function (sym, o) {
      var e = eroeffnungen && eroeffnungen[sym];
      if (!(e > 0) || !o || !(o.von > 0)) return { bars: [] };
      return { bars: [[DI, e * 1.01, 1e6, e * 1.02, e * 0.99, e]], verworfen: 0, gesamt: 1, feld: 'close' };
    }),
    __D: function () { return d; }, __save: function () { return Promise.resolve({ ok: true }); }
  }, jetzt);
  win.__karte = karte;
  return win;
}
function geld(x) { return Math.round(x).toLocaleString('de-DE') + ' $'; }
function pz(x) { return (x >= 0 ? '+' : '') + x.toFixed(2).replace('.', ',') + ' %'; }
function tagDe(t) { var s = new Date(t).toISOString(); return s.slice(8, 10) + '.' + s.slice(5, 7) + '.'; }
function zeile(abweichung, text) { console.log((abweichung ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + text); }

/* Kunst-Universum aus den 193 Namen der App-Liste: Staerken als feste Permutation,
 * damit starke und schwache Werte ueber die ganze Liste verteilt sind. */
function kunstUniversum(tage, namen) {
  var roh = {};
  namen.forEach(function (s, k) {
    var rang = (k * 37) % namen.length;                          // 0 = schwaechster
    roh[s] = buchReihe(tage, kursweg(tage.length, 0.05 + 0.004 * rang));
  });
  return roh;
}
function buchMit(positionen, letztesT) {
  return { name: 'momentum', start: 100000, cash: 0, positionen: positionen, trades: [], angelegt: letztesT - 30 * TAG,
    letztesRebalanceT: letztesT, konfig: MH.buchKonfig(), konfigSeit: letztesT, liquideSeit: letztesT, korbVerlauf: [] };
}
function spyAus(tage) { return tage.map(function (t, j) { return [t, 400 + j * 0.1, 8e7, 400 + j * 0.1]; }); }
function driftMarkt(spy, at) { return { at: at, reihe: spy.map(function (b) { return [b[0], b[3]]; }) }; }
/** Den Takt laufen lassen und Fehler des Takts als Testdefekt melden. */
async function taktLauf(dep) {
  STATUS = [];
  await dep.MFDepot.takt();
  var fehler = STATUS.filter(function (s) { return /Fehler/.test(s); });
  if (fehler.length) throw new Error(fehler.join(' | '));
}
function umgeschichtet(d) { return (d.tuneLog || []).some(function (z) { return /^mfrebal-/.test(z.id); }); }

module.exports = {
  WURZEL: WURZEL, MH: MH, Ms: Ms, KK: KK, TAG: TAG, FR: FR, MO: MO, DI: DI,
  stempel: stempel, werktag: werktag, werktagVor: werktagVor, werktageBis: werktageBis, nyUTC: nyUTC,
  kursweg: kursweg, buchReihe: buchReihe, ladeAntwort: ladeAntwort, universum: universum, speicher: speicher,
  tagesdatenAblegen: tagesdatenAblegen, symboleImBestand: symboleImBestand, uhr: uhr, sandbox: sandbox,
  kursAttrappe: kursAttrappe, mittelfristSandbox: mittelfristSandbox, mfdepotSandbox: mfdepotSandbox,
  geld: geld, pz: pz, tagDe: tagDe, kunstUniversum: kunstUniversum, buchMit: buchMit, spyAus: spyAus,
  driftMarkt: driftMarkt, taktLauf: taktLauf, umgeschichtet: umgeschichtet,
  U_ATTRAPPE: U_ATTRAPPE, getStatus: function () { return STATUS; }
};
