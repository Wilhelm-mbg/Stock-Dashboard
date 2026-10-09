'use strict';
/* Pruefbericht "Live gegen Messung" - Momentum-Buch (Oktober 2026): Kleinsttests der zweiten Runde.
 *
 * HERKUNFT: Zweig pruefung/live-gegen-messung (Stand 450daed), Datei
 * pruefberichte/live-gegen-messung-momentum.test.js, Tests 16-19 (Nachpruefung durch vier
 * unabhaengige Durchlaeufe). Portiert auf den Code von main (61dca2c, nach Nr. 85/87/91/93/94/95/96)
 * im Stil der uebernommenen Datei pruefberichte/live-gegen-messung-momentum.test.js (Tests 1-15):
 * gleiche Hilfen (hier hineinkopiert, kein require auf jene Datei), feste Uhr (Dienstag 24.11.2026,
 * New York), PRUEF_WURZEL. Soll ist jeweils das gemessene Verhalten (studien/massstab-rueckblick-
 * 2026-10-04/REGEL.md, rueckblick.js) bzw. das richtige Verhalten - keine Erwartung gelockert.
 *
 *   16  Speichern scheitert fuer einen Teil (Platte voll): Mischbestand         (Fund F13)
 *   17  Teilausfall beim Laden trifft alle gehaltenen Werte                     (Fund F1, Zusatz)
 *   18  "Gegen den Markt" beginnt mit der Anlage des Buchs, nicht mit liquideSeit (Fund F9)
 *   19  "Alle Buecher zuruecksetzen" schaltet das Buch ein, der Takt kauft      (Fund F11)
 *   20  ECHTE KENNZAHLEN: wie eng die Grenze des Zehntels auf der App-Liste ist  (Fund F3, Groesse; vom Code unabhaengig)
 *   21  ECHTE KENNZAHLEN: was die alte 500-Balken-Huerde gekostet haette          (Fund F8, Groesse; vom Code unabhaengig)
 * Ergaenzt beim Portieren:
 *   22  F11-Folge: Karte und Kopf zeigen nach dem Zuruecksetzen den alten Stand (mit Gegenprobe)
 *   23  F9 mit echten Takten: Buch im Zustand "aus" angelegt, spaeter eingeschaltet (mit Gegenprobe)
 *   24  F1 auf dem Eroeffnungsweg: offene Verkaeufe, die Kaeufe werden nicht nachgeholt
 *   25  F1 auf dem Eroeffnungsweg: keine Eroeffnung bis 16:00 - 0 Orders, Takt trotzdem neu
 * Uebernommen aus den Belegskripten der Durchsicht vom 04.10.2026 (Belegnamen f1-f7, p1 = Dateien f1-split-am-ausfuehrungstag.js
 * usw.; nicht zu verwechseln mit den Fundnummern F1-F13 oben), je mit Gegenprobe:
 *   26  Split mit Ex-Tag = Ausfuehrungstag: alte Stueckzahl zum geteilten Kurs verkauft; Umkehr-Split blaeht den Plan (Beleg f1)
 *   27  Split, Bestand am Ex-Tag waehrend der Sitzung geladen: Tagespunkt zum halben Wert       (Beleg f1b)
 *   28  Ausschuettung auf eine zur Eroeffnung des Ex-Tags verkaufte Position: nie gebucht        (Beleg f2)
 *   29  Nachfassen eines Verkaufs: der Erloes liegt bis zur naechsten Umschichtung              (Beleg f3)
 *   30  Reihenende in den fuenf Tagen vor der Umschichtung: Platz leer, Geld liegt              (Beleg f4)
 *   31  Tote Reihen gegen die 95-%-Schwelle von stichtagPruefen: ab 10 keine Umschichtung mehr  (Beleg f5)
 *   32  SPY-Ausfall verspaetet die Umschichtung, das Journal nennt einen falschen Grund          (Beleg f6)
 *   33  Ladevorgang ueber 16:15 New York: frischer Stand, erste Werte ohne den Balken des Tages  (Beleg f7)
 *   34  Sieben-Tage-Grenze von momentumZiel ueber den Herbstwechsel; dazu nyZeit 2026-2027      (Beleg p1)
 *
 * UEBERNAHME (Auftrag Nr. 108, 05.10.2026, Zweig fix/runde2): aus origin/pruefung/live-gegen-messung (ba15db3) ins Repo
 * gelegt und gegen main nach den Fixes der Generalprobe gefahren. Wo ein Test nicht mehr den heutigen Weg nahm, ist er
 * angepasst, ohne sein Soll zu lockern ("Angepasst" / "Repariert" / "Ergaenzt (Runde 2, Nr. 108)" an der Stelle: 18, 20,
 * 21, 26, 29, 32, 34). Test 30 (Reihenende erst nach fuenf Handelstagen, Nr. 93 A2): Entscheid Wilhelm 09.10.2026 -
 * Nachkauf statt sofortigem Ausbuchen, Test angepasst (siehe dort).
 *
 * Jeder Test druckt GENAU EINE Zeile: "ZEIGT ABWEICHUNG: ..." oder "kein Unterschied: ...".
 * Reines Node, kein Netz, keine Schluessel, kein Electron. Die Fenster-Module laufen in einer
 * vm-Sandbox mit Attrappen fuer Speicher, Kursabruf und Uhr. Nicht in `npm test` eingehaengt.
 *
 * Aufruf (die Datei soll unter pruefberichte/ liegen; ohne PRUEF_WURZEL gilt der Ordner darueber):
 *   node pruefberichte/live-gegen-messung-momentum-runde2.test.js       alle Tests
 *   node pruefberichte/live-gegen-messung-momentum-runde2.test.js 17    nur Test 17
 *   PRUEF_WURZEL=<Ordner> node ...                                      Module aus <Ordner> (nur gegen main ab Nr. 93;
 *                                                                       gegen 450daed laufen 19, 20, 21 und 22)
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var WURZEL = process.env.PRUEF_WURZEL ? path.resolve(process.env.PRUEF_WURZEL) : path.join(__dirname, '..');
var MH = require(path.join(WURZEL, 'mfhandel.js'));
var Ms = require(path.join(WURZEL, 'massstab.js'));
var KK = require(path.join(WURZEL, 'kurse.js'));
var TAG = 86400000;

/* ---------------- Hilfen (aus pruefberichte/live-gegen-messung-momentum.test.js, main) ---------------- */

/** Stempel eines Tagesbalkens wie bei Yahoo: Eroeffnung 13:30 UTC des Tages von ms (New-Yorker Tag derselbe). */
function stempel(ms) {
  var d = new Date(ms);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 13, 30);
}
function werktag(t) { var w = new Date(t).getUTCDay(); return w !== 0 && w !== 6; }
/** n Werktage (Mo-Fr, ohne Feiertage), der letzte ist endeT (ein Werktag-Stempel). */
function werktageBis(endeT, n) {
  var aus = [], t = stempel(endeT);
  while (aus.length < n) { if (werktag(t)) aus.unshift(t); t -= TAG; }
  return aus;
}
/* Die feste Uhr: Ende November 2026 gilt in New York Winterzeit (UTC-5). */
function nyUTC(j, m, t, h, min) { return Date.UTC(j, m - 1, t, h + 5, min || 0); }
var MO = Date.UTC(2026, 10, 23, 13, 30), DI = Date.UTC(2026, 10, 24, 13, 30);
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
/** Tagesdaten so ablegen, wie tagesdatenSchreiben (mittelfrist.js) es tut - samt Ereignis-Bestand und der Bezugsreihe
 *  SPY (mf_bezug, gleicher Stand). */
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
/** mfdepot.js in der Sandbox. eroeffnungen: {SYM: Eroeffnung des Ausfuehrungstags 24.11.} fuer den Abruf am
 *  Ausfuehrungstag (A4). Das Objekt wird bei jedem Abruf neu gelesen - ein Test kann es zwischen zwei Takten aendern. */
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
function kurs2(x) { return x.toFixed(2).replace('.', ',') + ' $'; }
function pz(x) { return (x >= 0 ? '+' : '') + x.toFixed(2).replace('.', ',') + ' %'; }
function ppDe(x) { return (x >= 0 ? '+' : '') + x.toFixed(1).replace('.', ',') + ' Pp'; }
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

/* ---------------- Hilfen dieser Runde ---------------- */

/** Zwei Schritte der Ereignisschleife: bereit() in mfdepot.js liest die Marktreihe nebenher (ladeMarkt). */
async function nebenher() { await new Promise(function (f) { setImmediate(f); }); await new Promise(function (f) { setImmediate(f); }); }
/** Das Ziel der vollen Rechnung am Stichtag (wie mfdepot.js ausfuehrungVorbereiten: rohBis + momentumZiel). */
function zielAm(roh, stichtagT) { return MH.momentumZiel(MH.rohBis(roh, MH.nyTag(stichtagT)), { nowMs: stichtagT }).ziel; }
/** Was die Messung am Ausfuehrungstag taete: Verkaeufe und Kaeufe zur selben Eroeffnung, Regel K wie das Buch. */
function messungUmschichtung(buch, ziel, eroeff) {
  var b = JSON.parse(JSON.stringify(buch)), K = MH.buchKonfig();
  MH.fuehreAus(b, MH.planeUmschichtung(ziel, b, eroeff, { kleinstAnteil: K.kleinstAnteil }), 0, 20, { kleinstAnteil: K.kleinstAnteil });
  return b;
}
function imZiel(buch, ziel) { return (buch.positionen || []).filter(function (p) { return ziel.indexOf(p.sym) >= 0; }).length; }
/** Optionen wie MFDepot.vergleich (mfdepot.js), fuer den Soll-Zeitraum ohne angelegt. */
function massstabOpts(start, dm) {
  return { an: true, start: start, angelegt: null, punktKurs: true, marktRoh: dm.roh, buchAusschuettungen: true, markt: dm.reihe };
}

/* ---------------- Hilfen fuer 26-34 (aus den Belegskripten hilfen.js und depot.js) ---------------- */

/** n Werktage bis endeT wie werktageBis, aber mit der Uhrzeit von endeT statt 13:30 UTC. Die Belegskripte stempeln
 *  09:30 New York (MH.nyZeit(tag, 9, 30): im Winter 14:30 UTC) - an diesem Stempel haengen Split-, Ausschuettungs- und
 *  Reihenende-Vergleiche (t <= barZeit). */
function werktageUm(endeT, n) {
  var dt = endeT - stempel(endeT);
  return werktageBis(endeT, n).map(function (t) { return t + dt; });
}
/** mfdepot.js in der Sandbox wie mfdepotSandbox, aber der Eroeffnungsbalken traegt den angefragten New-Yorker Tag
 *  (09:30 New York) statt fest den 24.11. - so geht auch ein Ausfuehrungstag im Dezember (Test 32). */
/*  Angepasst (Runde 2, Nr. 108): erHeute (optional) = {SYM: {div, split}} - die Kapitalmassnahmen, die die Quelle
 *  zusammen mit der Eroeffnung liefert, wenn der Abruf sie verlangt (o.ereignisse; mfdepot.js eroeffnung seit dem
 *  Fix der Generalprobe 23.11., Fund 1). Ohne erHeute wie vorher. */
function mfdepotSandboxTag(st, d, MF, jetzt, eroeffnungen, erHeute) {
  var karte = { innerHTML: '' };
  var win = sandbox(['mfdepot.js'], {
    U: U_ATTRAPPE, api: st.api, MF: MF, MFHandel: MH, Massstab: Ms, __el: { buchMomentumKopf: karte },
    Kurse: kursAttrappe(async function (sym, o) {
      var e = eroeffnungen && eroeffnungen[sym];
      if (!(e > 0) || !o || !(o.von > 0)) return { bars: [] };
      var t = MH.nyZeit(MH.nyTag(o.von + 3600000), 9, 30);
      var aus = { bars: [[t, e * 1.01, 1e6, e * 1.02, e * 0.99, e]], verworfen: 0, gesamt: 1, feld: 'close' };
      if (o.ereignisse && erHeute && erHeute[sym]) aus.ereignisse = erHeute[sym];
      return aus;
    }),
    __D: function () { return d; }, __save: function () { return Promise.resolve({ ok: true }); }
  }, jetzt);
  win.__karte = karte;
  return win;
}
/** Bestand ablegen wie tagesdatenAblegen, dazu die Ereignisse je Wert (mf_ereignisse.sym: Splits und Ausschuettungen). */
function bestandAblegen(st, roh, at, spy, ereignisse) {
  tagesdatenAblegen(st, roh, at, spy);
  st.daten.mf_ereignisse = { at: at, sym: ereignisse || {} };
}
/** Ein Takt um jetzt auf dem abgelegten Bestand: frische Sandboxen fuer mittelfrist.js (der Abruf liefert nichts) und
 *  mfdepot.js (Eroeffnungen aus eroeff). */
async function taktUm(st, d, jetzt, eroeff, erHeute) {
  var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
  var dep = mfdepotSandboxTag(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, eroeff, erHeute);
  await taktLauf(dep);
  return dep;
}
function imBuch(b, s) { return (b.positionen || []).some(function (p) { return p.sym === s; }); }
function jn(x) { return x ? 'ja' : 'nein'; }
function betrag(x) { return x.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' $'; }
/** Stueckzahl mit deutschem Komma (41.833 hiesse sonst einundvierzigtausend). */
function stk(x) { return String(x).replace('.', ','); }
/** 'JJJJ-MM-TT' -> 'TT.MM.' */
function tagKurz(s) { return s ? s.slice(8, 10) + '.' + s.slice(5, 7) + '.' : '-'; }

/* Ergaenzt (Runde 2, Nr. 108) fuer 20 und 21: die beiden Kennzahlen messen die GROESSE von F3 und F8 unabhaengig vom Code.
 * Ob der heutige Code den Fund noch hat, sagt diese Probe: ein Ladevorgang des echten Laders (mittelfrist.js) in der Sandbox,
 * ein Wert mit adjclose != close (rangiert er auf close, Spalte 1 - wie die Messung ohne Ausschuettungen?) und ein junger
 * Wert mit 300 Balken (laedt der Lader ihn, oder verwirft er ihn wie die alte 500-Balken-Huerde?). */
async function laderProbe() {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 10, 0), tage = werktageBis(MO, 520), spy = spyAus(tage);
  var roh = kunstUniversum(tage, namen), a = namen[0], b = namen[1];
  roh[a] = roh[a].map(function (z) { return [z[0], z[1], z[2], z[1] * 0.98]; });     // adjclose 2 % unter close (Ausschuettungen)
  roh[b] = roh[b].slice(-300);                                                      // junger Wert: 300 Balken
  var st = speicher({});
  var mf = mittelfristSandbox(st, async function (sym, o) { return sym === 'SPY' ? ladeAntwort(spy, o) : roh[sym] ? ladeAntwort(roh[sym], o) : null; }, jetzt);
  await mf.MF.ladeUniversum();
  var g = await mf.MF.tagesdatenLesen(), rA = g && g.roh[a], rB = g && g.roh[b];
  return { a: a, b: b, spalte1Close: !!rA && Math.abs(rA[rA.length - 1][1] - roh[a][roh[a].length - 1][1]) < 1e-9,
    kurzGeladen: !!rB && rB.length === 300 };
}

/* ---------------- Die Tests ---------------- */
var TESTS = {};

/* 16 - Speichern scheitert fuer einen Teil (Platte voll): Mischbestand aus alten und neuen Reihen (Fund F13).
 *     Der letzte vollstaendige Stand ist vom 10.11.; am 24.11. um 10:00 New York laedt der Lader alle 193 Werte und SPY
 *     neu (der Markt ist seither um 10 % gestiegen), nur mf_tagesdaten_teil_3 laesst sich nicht schreiben - storeSet
 *     antwortet wie main.js im Fehlerfall mit { ok: false, msg }. Das Buch haelt einen Wert aus Teil 3, die Umschichtung
 *     ist faellig. Soll (Messung: vollstaendiges Panel; REGEL §1.4 bucht nur eine Reihe aus, die wirklich endet): der
 *     Schreibfehler bleibt nicht still - kein "frischer" Index ueber einem alten Teil -, und keine Position wird zu einem
 *     zwei Wochen alten Kurs gebucht. */
TESTS[16] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 10, 0);
  var tageAlt = werktageBis(Date.UTC(2026, 10, 10), 520), tageNeu = werktageBis(MO, 520);
  var spyAlt = spyAus(tageAlt), spyNeu = spyAus(tageNeu);
  var alt = kunstUniversum(tageAlt, namen), neu = kunstUniversum(tageNeu, namen);
  Object.keys(neu).forEach(function (s) { neu[s] = neu[s].map(function (b) { return [b[0], b[1] * 1.1, b[2], b[3] * 1.1]; }); });
  var st = speicher({ drift_markt: driftMarkt(spyNeu, jetzt - 3600000) });
  tagesdatenAblegen(st, alt, nyUTC(2026, 11, 10, 16, 30), spyAlt);
  var echtesSet = st.api.storeSet, abrufe = 0;
  st.api.storeSet = async function (n, v) { if (n === 'mf_tagesdaten_teil_3') return { ok: false, msg: 'ENOSPC: no space left on device' }; return echtesSet(n, v); };
  var mf = mittelfristSandbox(st, async function (sym, o) { abrufe++; return neu[sym] ? ladeAntwort(neu[sym], o) : sym === 'SPY' ? ladeAntwort(spyNeu, o) : null; }, jetzt);
  await mf.MF.ladeUniversum();
  var idx = st.daten.mf_tagesdaten_index, teil3 = st.daten.mf_tagesdaten_teil_3.roh, syms3 = Object.keys(teil3);
  var sym = syms3[0], r3 = teil3[sym], alterTage = Math.round((jetzt - r3[r3.length - 1][0]) / TAG);
  var frisch = MH.bestandFrisch(idx.at, jetzt);
  // Das Buch: eine Position aus Teil 3, eine aus Teil 0; letzte Umschichtung vor 70 Handelstagen (faellig)
  var kaufIdx = tageNeu.length - 71, anderer = Object.keys(st.daten.mf_tagesdaten_teil_0.roh)[0];
  var pos = [{ sym: sym, stueck: 100, einstand: 100, seit: tageNeu[kaufIdx] }, { sym: anderer, stueck: 100, einstand: 100, seit: tageNeu[kaufIdx] }];
  var d = { momentumAn: true, mfBuch: buchMit(pos, tageNeu[kaufIdx] + 3600000), mfVerlauf: [] };
  var eroeff = {}; namen.concat(['SPY']).forEach(function (s) { eroeff[s] = 110; });
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: mf.MF.ladeUniversum }, jetzt, eroeff);
  var vorher = abrufe;
  await taktLauf(dep);
  await mf.MF.ladeUniversum();                                   // der Anstoss des Takts: gilt der Bestand als frisch, wird nichts geholt
  var neuAbrufe = abrufe - vorher;
  var ende = (d.mfBuch.trades || []).filter(function (t) { return t.art === 'reihenende' && t.sym === sym; })[0];
  var frischKurs = neu[sym][neu[sym].length - 1][1];
  var hinweis = (/nicht frisch genug \((.*?)\) – Nachladen/.exec(dep.__karte.innerHTML) || [])[1];
  var gemischt = frisch && alterTage > 7;
  zeile(gemischt || !!ende,
    'Teil 3 laesst sich nicht schreiben (storeSet { ok: false, ENOSPC }): der Index meldet ' + (frisch ? 'einen frischen Stand' : 'keinen frischen Stand') +
    ' (' + idx.teile + ' Teile, Stand ' + new Date(idx.at).toISOString().slice(0, 16) + ' UTC), Teil 3 traegt aber noch die Reihen vom 10.11. (' + syms3.length +
    ' Werte, juengster Balken ' + alterTage + ' Tage alt). Erster Takt: ' + (ende ? 'gehaltene Position ' + sym + ' als "Reihenende" ausgebucht zu ' + kurs2(ende.kurs) +
    ' (alter Schluss, ohne Kosten) statt zum frischen Schluss ' + kurs2(frischKurs) : sym + ' nicht ausgebucht') + '; Umschichtung faellig, aber ' +
    (umgeschichtet(d) ? 'ausgefuehrt' : 'gesperrt (' + (hinweis || 'ohne Grund auf der Karte') + ')') + '; Neuversuch des Laders: ' + neuAbrufe +
    ' Abrufe' + (gemischt || ende ? ' (der Bestand gilt bis zum naechsten Boersenschluss als frisch). tagesdatenSchreiben prueft die Rueckgabe von storeSet nicht.' : ' (der alte Index bleibt, der Lader wartet eine Stunde).'));
};

/* 17 - Teilausfall beim Laden trifft alle gehaltenen Werte (Fund F1, Zusatz). Im Zweig (450daed): Umschichtung mit
 *     0 Ausfuehrungen, letztesRebalanceT trotzdem neu, Journal "0 Orders" neben "15 Kaeufe". Hier: gespeichert ist der Stand
 *     vom Freitag nach Schluss; am Dienstag 10:00 New York liefern die ersten 40 Werte der Liste nichts (darunter alle 19
 *     gehaltenen), der Takt laeuft mit Eroeffnungen fuer alle; eine Stunde spaeter liefert der Abruf alles.
 *     Soll (Messung: vollstaendiges Panel, Umschichtung zur Eroeffnung des Ausfuehrungstags): auf dem Teilausfall wird
 *     nicht umgeschichtet und der 63-Tage-Takt nicht neu gesetzt; mit vollen Daten wird zur Eroeffnung DESSELBEN Tages
 *     auf das Ziel der vollen Rechnung umgeschichtet; das Journal nennt so viele Kaeufe und Verkaeufe, wie ausgefuehrt wurden. */
TESTS[17] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 10, 0);
  var tage = werktageBis(MO, 520), spy = spyAus(tage);
  var voll = kunstUniversum(tage, namen);
  var bisFr = {}; namen.forEach(function (s) { bisFr[s] = voll[s].slice(0, -1); });
  var kaufIdx = tage.length - 71, kaufT = tage[kaufIdx] + 3600000;
  var fehlt = {}; namen.slice(0, 40).forEach(function (s) { fehlt[s] = true; });   // Anfang der Liste faellt aus
  var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
  var atFr = nyUTC(2026, 11, 20, 16, 30);
  tagesdatenAblegen(st, bisFr, atFr, spy.slice(0, -1));          // Freitag nach Schluss geladen -> am Dienstag nachzuladen
  var pos = namen.slice(0, 19).map(function (s) { return { sym: s, stueck: 50, einstand: voll[s][kaufIdx][1] * 1.002, seit: tage[kaufIdx] }; });
  var d = { momentumAn: true, mfBuch: buchMit(pos, kaufT), mfVerlauf: [] };
  var tagVorher = MH.nyTag(kaufT);
  var netzGut = false;
  var mf = mittelfristSandbox(st, async function (sym, o) {
    if (!netzGut && fehlt[sym]) return null;
    return voll[sym] ? ladeAntwort(voll[sym], o) : sym === 'SPY' ? ladeAntwort(spy, o) : null;
  }, jetzt);
  await mf.MF.ladeUniversum();
  var bestand1 = symboleImBestand(st), standGleich = st.daten.mf_tagesdaten_index.at === atFr;
  var eroeff = {}; namen.concat(['SPY']).forEach(function (s) { eroeff[s] = 100; });
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, eroeff);
  await taktLauf(dep);
  var handel1 = umgeschichtet(d), tag1 = d.mfBuch.letzteAusfuehrungTag, positionen1 = d.mfBuch.positionen.length;
  var hinweis1 = (/nicht frisch genug \((.*?)\) – Nachladen/.exec(dep.__karte.innerHTML) || [])[1];
  // eine Stunde und eine Minute spaeter: die Sperre des Laders ist vorbei, das Netz liefert alles
  netzGut = true;
  mf.__uhr.jetzt = dep.__uhr.jetzt = jetzt + 61 * 60000;
  await mf.MF.ladeUniversum();
  await taktLauf(dep);
  var j = (d.tuneLog || []).filter(function (e) { return /^mfrebal-/.test(e.id); })[0];
  var ziel = zielAm(voll, MO);
  var inZiel = imZiel(d.mfBuch, ziel);
  var tr = (d.mfBuch.trades || []).filter(function (t) { return j && t.t === j.at; });
  var kaeufe = tr.filter(function (t) { return t.art === 'kauf'; }).length, verkaeufe = tr.filter(function (t) { return t.art === 'verkauf'; }).length;
  var mA = j && /(\d+) Orders/.exec(j.applied[0]), mT = j && /(\d+) Verkäufe, (\d+) Käufe/.exec(j.txt);
  var journalStimmt = !!(mA && mT && Number(mA[1]) === kaeufe + verkaeufe && Number(mT[1]) === verkaeufe && Number(mT[2]) === kaeufe);
  var zurEroeffnung = kaeufe > 0 && tr.every(function (t) { return t.kurs === 100; });   // jeder Kauf und Verkauf zur Eroeffnung (100 $)
  var soll = standGleich && bestand1 === namen.length && !handel1 && tag1 === tagVorher && positionen1 === 19 &&
    !!j && d.mfBuch.letzteAusfuehrungTag === '2026-11-24' && inZiel === ziel.length && d.mfBuch.positionen.length === ziel.length && zurEroeffnung && journalStimmt;
  zeile(!soll, '40 Werte vom Listenanfang ohne Daten, darunter alle 19 gehaltenen: Abruf ' + (standGleich ? 'abgelehnt, Bestand bleibt ganz stehen (' + bestand1 +
    ' Werte, Stand 20.11.)' : 'angenommen (' + bestand1 + ' Werte)') + '; erster Takt ' + (handel1 ? 'schichtet um' : 'schichtet nicht um') +
    (hinweis1 ? ' ("' + hinweis1 + '")' : '') + ', letzte Umschichtung ' + (tag1 === tagVorher ? 'bleibt ' + MH.datumDe(tag1) : 'NEU ' + MH.datumDe(tag1)) + ', ' +
    positionen1 + ' Positionen bleiben. Neuversuch nach 61 min mit allen Werten: ' + (j ? 'umgeschichtet am ' + MH.datumDe(d.mfBuch.letzteAusfuehrungTag) +
    (zurEroeffnung ? ' zur Eroeffnung' : ' NICHT zur Eroeffnung') + ', ' + inZiel + ' von ' + ziel.length + ' Zielwerten der vollen Rechnung im Buch' : 'nicht umgeschichtet') +
    '. Journal: "' + (j ? j.applied[0] : '-') + '" neben "' + (mT ? mT[0] : '-') + '" bei ' + verkaeufe + ' ausgefuehrten Verkaeufen und ' + kaeufe + ' Kaeufen.');
};

/* 18 - Der Massstab "Gegen den Markt" beginnt am Tag, an dem das Buch angelegt wurde, nicht mit der liquiden Regel (Fund F9).
 *     Verlauf wie seit Nr. 93 (Punkte je Handelstag mit tag, spy, spyT): Markt flach bis zur ersten liquiden Umschichtung,
 *     danach +3 %; das Buch faellt bis dahin um 5 % (alte Positionen) und laeuft danach genau wie der Markt.
 *     Soll (REGEL §1.6/§1.8: Buch und SPY starten am selben ersten Ausfuehrungstag der gemessenen Regel; Bezug ist hier der
 *     letzte Tagespunkt davor, der Schluss des Stichtags): 0,0 Pp. */
TESTS[18] = async function () {
  var jetzt = nyUTC(2026, 11, 24, 10, 0), tage = werktageBis(MO, 300), n = tage.length;
  var anlage = tage[n - 60], stichtag = tage[n - 21], liquide = tage[n - 20];
  var spyK = function (t) { return t <= liquide ? 500 : 515; };
  var reihe = tage.map(function (t) { return [t, spyK(t)]; });
  var dm = { at: jetzt - 3600000, reihe: reihe, roh: reihe.map(function (b) { return [b[0], b[1]]; }) };
  var verlauf = tage.filter(function (t) { return t >= anlage; }).map(function (t) {
    var w = t < stichtag ? 100000 - 5000 * (t - anlage) / (stichtag - anlage) : 95000 * spyK(t) / 500;
    return { t: t, tag: MH.nyTag(t), momentum: Math.round(w * 100) / 100, drift: null, spy: spyK(t), spyT: t, buchT: t, startM: 100000, startD: null };
  });
  var buch = buchMit([], anlage);
  buch.angelegt = anlage - 3600000;                              // angelegt und gekauft am Tag des ersten Punkts (wie am 25.08.2026)
  buch.liquideSeit = MH.nyZeit(MH.nyTag(liquide), 10, 0);         // erste liquide Umschichtung, 10:00 New York
  var st = speicher({ drift_markt: dm });
  var d = { momentumAn: true, mfBuch: buch, mfVerlauf: verlauf };
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: async function () { return null; }, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, {});
  await nebenher();
  var v = dep.MFDepot.vergleich('momentum');
  var liqTag = MH.nyTag(buch.liquideSeit);
  var bezugTag = verlauf.filter(function (p) { return p.tag < liqTag; }).slice(-1)[0].tag;   // letzter Punkt vor der Umschichtung (Schluss des Stichtags)
  var abLiquide = Ms.vergleich(verlauf.filter(function (p) { return p.tag >= bezugTag; }), 'momentum', 'startM', massstabOpts(100000, dm));
  /* Ergaenzt (Runde 2, Nr. 108 - Auftrag: "solange es keine solche Umschichtung gibt, steht dort ein klarer Satz statt einer
   * Zahl"): dasselbe Buch ohne liquideSeit - die Karte darf keinen Abstand nennen, sondern den Satz. */
  buch.liquideSeit = null;
  var vVor = dep.MFDepot.vergleich('momentum'), tVor = Ms.langText('Momentum', vVor, function (x) { return pz(x); });
  var satzOk = !!vVor && !vVor.ok && vVor.abstandPp == null && /Vergleich beginnt mit der ersten Umschichtung nach der gemessenen Regel/.test(tVor);
  buch.liquideSeit = MH.nyZeit(MH.nyTag(liquide), 10, 0);
  zeile(!(v && v.ok && abLiquide.ok && Math.abs(v.abstandPp - abLiquide.abstandPp) < 0.05) || !satzOk,
    'Karte/Kopf rechnen seit ' + tagDe(v.seit) + ' (Anlage des Buchs ' + tagDe(buch.angelegt) + '): Buch ' + pz(v.buchPct) + ' gegen S&P 500 ' + pz(v.marktPct) +
    ', Abstand ' + ppDe(v.abstandPp) + ' (Markt: ' + v.marktArt + '). Ab der ersten liquiden Umschichtung (' + tagDe(buch.liquideSeit) + ', Bezug Schluss des Stichtags), wie die Messung startet: Buch ' +
    pz(abLiquide.buchPct) + ' gegen ' + pz(abLiquide.marktPct) + ', Abstand ' + ppDe(abLiquide.abstandPp) + '. Ohne liquideSeit (noch keine liquide Umschichtung): "' + tVor + '"' +
    (satzOk ? '' : ' - kein Satz statt der Zahl') + '.');
};

/* 19 - "Alle Buecher zuruecksetzen" schaltet das Momentum-Buch ein; der naechste Takt kauft sofort (Fund F11).
 *     depot.js (Quelltext): der Knopf setzt D = defaultDepot() (momentumAn: true) - uebernimmt er den Schalter, nennt die
 *     Rueckfrage ihn? Dann der Zustand danach: Schalter an, kein Buch; Tagesdaten vom Montag nach Schluss; Takt am Dienstag
 *     10:00 New York. Gegenprobe: derselbe Takt mit dem Schalter, wie er vor dem Zuruecksetzen stand (aus).
 *     Soll: das Zuruecksetzen laesst den Schalter, wie er war, oder sagt in der Rueckfrage, dass das Buch danach selbst kauft. */
TESTS[19] = async function () {
  var dep0 = fs.readFileSync(path.join(WURZEL, 'depot.js'), 'utf8');
  var block = (/window\.confirm\('Depot wirklich zurücksetzen\?[\s\S]*?D = defaultDepot\(\);([\s\S]*?)save\(\);/.exec(dep0) || []);
  var reset = !!block.length, uebernimmt = reset && /momentumAn/.test(block[1]);
  var vorgabeAn = /function defaultDepot\(\)[\s\S]*?momentumAn: true/.test(dep0);
  var frage = (/window\.confirm\('Depot wirklich zurücksetzen\?[\s\S]*?\)\) return;/.exec(dep0) || [''])[0];
  var frageNenntSchalter = /schalt|Automatik|handelt|kauft/i.test(frage);
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 10, 0), tage = werktageBis(MO, 520), spy = spyAus(tage);
  var voll = kunstUniversum(tage, namen);
  var eroeff = {}; namen.concat(['SPY']).forEach(function (s) { eroeff[s] = 100; });
  async function lauf(schalter) {
    var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
    tagesdatenAblegen(st, voll, nyUTC(2026, 11, 23, 16, 30), spy);
    var d = { momentumAn: schalter };
    var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
    var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, eroeff);
    await taktLauf(dep);
    var k = (d.mfBuch && d.mfBuch.trades || []).filter(function (t) { return t.art === 'kauf'; });
    return { kaeufe: k.length, angelegt: !!d.mfBuch, liquideSeit: d.mfBuch && d.mfBuch.liquideSeit,
      zurEroeffnung: k.length > 0 && d.mfBuch.positionen.every(function (p) { return Math.abs(p.einstand - 100 * 1.002) < 1e-9; }) };
  }
  var x = await lauf(true), gp = await lauf(false);
  zeile(reset && vorgabeAn && !uebernimmt && !frageNenntSchalter && x.kaeufe > 0,
    'Reset setzt D = defaultDepot() (momentumAn: true)' + (uebernimmt ? ', uebernimmt den Schalter' : ', der vorige Schalter wird nicht uebernommen') +
    ', die Rueckfrage erwaehnt ihn ' + (frageNenntSchalter ? 'ja' : 'nicht') + '; erster Takt danach (Di 10:00 New York): Buch neu angelegt, sofort faellig, ' + x.kaeufe +
    ' Kaeufe' + (x.zurEroeffnung ? ' zur Eroeffnung des 24.11.' : '') + (x.liquideSeit ? ', Vorwaertstest beginnt damit (liquideSeit ' + tagDe(x.liquideSeit) + ')' : '') +
    '. Gegenprobe mit dem Schalter wie vorher (aus): ' + gp.kaeufe + ' Kaeufe' + (gp.angelegt ? ' (Buch angelegt, nur gerechnet)' : '') + '.');
};

/* 20 - ECHTE KENNZAHLEN: Wie eng ist die Grenze des Zehntels auf der App-Liste? (Fund F3, Groesse)
 *      Staerken ohne Ausschuettungen je Monatsstichtag aus dem Panel (gleiche Formel wie die App:
 *      bSchluss(t-21) / bSchluss(t-252) - 1), studien/mehrfaktor-2026-09-22/zellen-rueckhalte/momentum.json,
 *      geschnitten mit der App-Liste. Gemessen wird ohne Modell: der Vorsprung des Letzten im Ziel vor dem
 *      Ersten draussen, multiplikativ - so wirkt ein Ausschuettungsaufschlag (F3). Grenzen: Monats- statt
 *      63-Tage-Takt, Liquiditaetsfilter nicht angewandt, Filter des Pruefstands blenden einzelne Monate aus. */
TESTS[20] = async function () {
  var M = JSON.parse(fs.readFileSync(path.join(WURZEL, 'studien/mehrfaktor-2026-09-22/zellen-rueckhalte/momentum.json'), 'utf8'));
  var app = universum(), luecken = [], genuegt = { 0.005: 0, 0.01: 0, 0.02: 0 }, nMin = Infinity, nMax = 0;
  M.signaltage.forEach(function (st) {
    var f = app.filter(function (s) { return typeof st.werte[s] === 'number' && isFinite(st.werte[s]); })
      .map(function (s) { return 1 + st.werte[s] / 100; }).sort(function (a, b) { return b - a; });
    if (f.length < 100) return;
    nMin = Math.min(nMin, f.length); nMax = Math.max(nMax, f.length);
    var k = Math.max(5, Math.round(f.length * 0.1)), l = f[k - 1] / f[k] - 1;
    luecken.push(l);
    Object.keys(genuegt).forEach(function (g) { if (l < Number(g)) genuegt[g]++; });
  });
  var s = luecken.slice().sort(function (a, b) { return a - b; });
  var med = s[s.length >> 1] * 100, n = luecken.length;
  var anker = /0\.83 % im Jahr/.test(fs.readFileSync(path.join(WURZEL, 'studien/querschnitt-pruefstand-2026-09-13/ERGEBNIS-TEIL2.md'), 'utf8'));
  /* Angepasst (Runde 2, Nr. 108): Abweichung nur, solange der Code mit Ausschuettungen rangiert (F3) - die Groesse allein
   * ist kein Befund ueber den heutigen Code. Gegen 450daed (adjclose in Spalte 1) weiter Abweichung. */
  var pr = await laderProbe();
  zeile(genuegt['0.01'] > 0 && !pr.spalte1Close, (pr.spalte1Close ? 'Heute rangiert der Lader auf close ohne Ausschuettungen wie die Messung (Probe ' + pr.a + ': Spalte 1 = close) - F3 behoben; die Groesse bleibt als Kennzahl: ' : 'Der Lader rangiert mit Ausschuettungen (Probe ' + pr.a + ': Spalte 1 = adjclose). ') + n + ' Monatsstichtage (' + M.signaltage[0].tag + ' bis ' + M.signaltage[M.signaltage.length - 1].tag + ', ' + nMin + ' bis ' + nMax +
    ' Werte der App-Liste): der Letzte im Ziel liegt im Median nur ' + med.toFixed(2).replace('.', ',') + ' Pp vor dem Ersten draussen. Ein Ausschuettungsvorsprung von 0,5 / 1 / 2 Pp ' +
    'im Rueckblickfenster reicht fuer einen Tausch an ' + genuegt['0.005'] + ' / ' + genuegt['0.01'] + ' / ' + genuegt['0.02'] + ' von ' + n + ' Stichtagen' +
    (anker ? ' (zum Vergleich: das Universum zahlt rund 1,7 % im Jahr, also ~1,6 Pp im 231-Tage-Fenster; das Momentum-Zehntel 0,83 %, ERGEBNIS-TEIL2.md)' : '') + '.');
};

/* 21 - ECHTE KENNZAHLEN: Was hat die alte 500-Balken-Huerde des Laders gekostet? (Fund F8, Groesse; auf main behoben)
 *      Junge Werte der App-Liste = erster Paneltag nach dem Panelbeginn 2016-01-04
 *      (studien/fundamental-machbarkeit-2026-09-16/panel.json). LIN und APTV sind ausgenommen: Kuerzelwechsel
 *      bzw. Fusion, die Yahoo-Reihe reicht dort weiter zurueck. Naeherung: der erste Stichtag mit Wert in
 *      momentum.json hat 253 Zeilen; die App rankt erst ab 501 Balken, rund 248 Handelstage = 12 Monatsstichtage spaeter. */
TESTS[21] = async function () {
  var M = JSON.parse(fs.readFileSync(path.join(WURZEL, 'studien/mehrfaktor-2026-09-22/zellen-rueckhalte/momentum.json'), 'utf8'));
  var P = JSON.parse(fs.readFileSync(path.join(WURZEL, 'studien/fundamental-machbarkeit-2026-09-16/panel.json'), 'utf8'));
  var app = universum(), erster = {};
  P.reihen.forEach(function (r) { if (!erster[r.reihe] || r.erster < erster[r.reihe]) erster[r.reihe] = r.erster; });
  var jung = app.filter(function (s) { return erster[s] && erster[s] > '2016-01-04' && s !== 'LIN' && s !== 'APTV'; });
  var T = M.signaltage;
  function ok(v) { return typeof v === 'number' && isFinite(v); }
  var namensMonate = 0, tage = {}, betroffen = [];
  jung.forEach(function (sym) {
    var i0 = -1;
    for (var i = 0; i < T.length; i++) if (ok(T[i].werte[sym])) { i0 = i; break; }
    if (i0 < 0) return;
    var treffer = 0;
    for (var ti = i0; ti < Math.min(T.length, i0 + 12); ti++) {
      var w = T[ti].werte;
      var liste = app.filter(function (s) { return ok(w[s]); }).sort(function (a, b) { return w[b] - w[a]; });
      if (liste.length < 100) continue;
      var k = Math.max(5, Math.round(liste.length * 0.1));
      if (liste.slice(0, k).indexOf(sym) !== -1) { treffer++; tage[ti] = true; }
    }
    if (treffer) { namensMonate += treffer; betroffen.push(sym + ' ' + treffer); }
  });
  /* Angepasst (Runde 2, Nr. 108): Abweichung nur, solange der Lader junge Reihen verwirft (F8). */
  var pr = await laderProbe();
  zeile(namensMonate > 0 && !pr.kurzGeladen, (pr.kurzGeladen ? 'Heute laedt der Lader auch eine Reihe mit 300 Balken (Probe ' + pr.b + ') - F8 behoben; die Groesse bleibt als Kennzahl: ' : 'Der Lader verwirft eine Reihe mit 300 Balken (Probe ' + pr.b + '). ') + jung.length + ' junge Werte der App-Liste; ' + betroffen.length + ' davon standen in ihren ersten 12 Monaten mit Wert im staerksten Zehntel der App-Liste (Paneldaten, monatlich, ohne Umsatzfilter), das die App bis Nr. 93 nicht gerankt haette: ' +
    namensMonate + ' Namens-Monate an ' + Object.keys(tage).length + ' von ' + T.length + ' Monatsstichtagen (' + betroffen.join(', ') + '). Auf main laedt der Lader auch kurze Reihen (Abnahme-Test 12).');
};

/* 22 - Folge von F11: nach dem Zuruecksetzen zeigen Karte und Kopf bis zum naechsten Takt noch den alten Stand. depot.js
 *     setzt D neu und zeichnet sofort (render() -> MFDepot.karten()); der Merker STAND in mfdepot.js bleibt. Nachgestellt:
 *     ein Takt bewertet das alte Buch, dann wird D geleert wie von defaultDepot() (Schalter an, kein Buch), dann karten().
 *     Gegenprobe: der naechste Takt (08:30 New York, vor der Eroeffnung - es wird nicht gehandelt).
 *     Soll: unmittelbar nach dem Zuruecksetzen kein Buchwert des geloeschten Buchs. */
TESTS[22] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 8, 0), tage = werktageBis(MO, 520), spy = spyAus(tage);
  var voll = kunstUniversum(tage, namen);
  var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
  tagesdatenAblegen(st, voll, nyUTC(2026, 11, 23, 16, 30), spy);
  var letzte = tage[tage.length - 11];
  var pos = namen.slice(0, 10).map(function (s) { return { sym: s, stueck: 120, einstand: 90, seit: letzte }; });
  var d = { momentumAn: true, mfBuch: buchMit(pos, letzte + 3600000), mfVerlauf: [] };
  var preise = {}; namen.forEach(function (s) { preise[s] = voll[s][voll[s].length - 1][1]; });
  var altWert = MH.bewerte(d.mfBuch, preise).wert;
  var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, {});
  await taktLauf(dep);
  var vorReset = dep.__karte.innerHTML.indexOf(String(altWert)) !== -1;
  // "Alle Buecher zuruecksetzen": D = defaultDepot() - hier dasselbe Objekt, geleert (mfdepot.js liest D bei jedem Aufruf neu)
  Object.keys(d).forEach(function (k) { delete d[k]; });
  d.momentumAn = true;
  dep.MFDepot.karten();
  var karte = dep.__karte.innerHTML, vNach = dep.MFDepot.vergleich('momentum');
  var alt = karte.indexOf(String(altWert)) !== -1, ohneBuch = /Buch noch nicht angelegt/.test(karte);
  dep.__uhr.jetzt = jetzt + 30 * 60000;
  await taktLauf(dep);
  var karteGp = dep.__karte.innerHTML, gpNeu = karteGp.indexOf('100000') !== -1 && karteGp.indexOf(String(altWert)) === -1;
  zeile(alt, 'Vor dem Zuruecksetzen zeigt die Karte ' + geld(altWert) + (vorReset ? '' : ' (nicht gefunden)') + '; unmittelbar danach (karten(), wie render() in depot.js) ' +
    (alt ? 'zeigt sie weiter ' + geld(altWert) : 'nicht mehr den alten Wert') + (ohneBuch ? ' neben "Positionen: Buch noch nicht angelegt"' : '') +
    ', der Massstab (Kopf) nennt Stand ' + (vNach && vNach.standPct != null ? pz(vNach.standPct) : '-') + ' fuer das geloeschte Buch. Gegenprobe naechster Takt (08:30 New York): Karte ' +
    (gpNeu ? 'zeigt 100.000 $ (neues Buch, nicht gehandelt)' : 'zeigt weiter den alten Stand') + '.');
};

/* 23 - F9 mit echten Takten und Gegenprobe: ein Buch, das im Zustand "aus" angelegt wird, schreibt Tagespunkte in bar
 *     (tagespunkt laeuft unabhaengig vom Schalter). 44 Handelstage aus, SPY steigt dabei von 500 auf 525; am 24.11. wird
 *     eingeschaltet und zur Eroeffnung umgeschichtet (erste liquide Umschichtung); danach bleiben alle Kurse flach.
 *     Soll (REGEL §1.6/§1.8): der Vorwaertstest beginnt am ersten Ausfuehrungstag der gemessenen Regel - Bezug ist der
 *     letzte Tagespunkt davor; nach Kosten rund -0,2 Pp. Gegenprobe: dasselbe Buch, angelegt erst am Tag vor dem Einschalten. */
TESTS[23] = async function () {
  var namen = universum(), tage = werktageBis(Date.UTC(2026, 10, 27), 560), iL = tage.indexOf(DI);
  var roh = kunstUniversum(tage.slice(0, iL), namen);               // Reihen bis zum Stichtag 23.11.
  namen.forEach(function (s) {
    var r = roh[s], c = r[r.length - 1][1];
    for (var k = iL; k < tage.length; k++) r.push([tage[k], c, 3e6, c]);   // danach flach
  });
  var spyK = function (k) { return k <= iL - 44 ? 500 : k >= iL - 1 ? 525 : 500 + 25 * (k - (iL - 44)) / 43; };
  var spy = tage.map(function (t, k) { return [t, spyK(k), 8e7, spyK(k)]; });
  var dm = { at: 0, reihe: spy.map(function (b) { return [b[0], b[3]]; }), roh: spy.map(function (b) { return [b[0], b[1]]; }) };
  var eroeff = { SPY: 525 }; namen.forEach(function (s) { eroeff[s] = roh[s][iL - 1][1]; });
  async function lauf(abK) {
    var st = speicher({ drift_markt: dm });
    tagesdatenAblegen(st, roh, 0, spy);
    var d = { momentumAn: false };
    var MF = { tagesdatenLesen: null, ladeUniversum: function () { return Promise.resolve(null); } };
    var dep = null;
    async function takt(k, hh, mm, bisK, an) {
      var tag = MH.nyTag(tage[k]), at = MH.nyZeit(MH.nyTag(tage[bisK]), 16, 30);
      st.daten.mf_bezug = { at: at, sym: 'SPY', reihe: spy.slice(0, bisK + 1) };
      st.daten.mf_tagesdaten_index.at = at; st.daten.mf_ereignisse.at = at;
      d.momentumAn = an;
      if (!dep) {
        var mf = mittelfristSandbox(st, async function () { return null; }, MH.nyZeit(tag, hh, mm));
        MF.tagesdatenLesen = mf.MF.tagesdatenLesen;
        dep = mfdepotSandbox(st, d, MF, MH.nyZeit(tag, hh, mm), eroeff);
      }
      dep.__uhr.jetzt = MH.nyZeit(tag, hh, mm);
      await taktLauf(dep);
    }
    for (var k = abK; k < iL; k++) await takt(k, 17, 0, k, false);   // aus: nur gerechnet, Tagespunkte in bar
    await takt(iL, 10, 0, iL - 1, true);                               // eingeschaltet: Umschichtung zur Eroeffnung des 24.11.
    for (var k2 = iL; k2 < tage.length; k2++) await takt(k2, 17, 0, k2, true);
    var v = dep.MFDepot.vergleich('momentum');
    var liq = d.mfBuch.liquideSeit, liqTag = MH.nyTag(liq), vorher = d.mfVerlauf.filter(function (p) { return p.tag < liqTag; });
    var bezugT = vorher.length ? vorher[vorher.length - 1].t : liq;
    var soll = Ms.vergleich(d.mfVerlauf.filter(function (p) { return p.t >= bezugT; }), 'momentum', 'startM', massstabOpts(d.mfBuch.start, dm));
    return { v: v, soll: soll, punkte: d.mfVerlauf.length, bar: vorher.length,
      angelegt: d.mfBuch.angelegt, liq: liq, positionen: d.mfBuch.positionen.length };
  }
  var x = await lauf(iL - 44), gp = await lauf(iL - 1);
  var ok = x.v && x.v.ok && x.soll.ok && Math.abs(x.v.abstandPp - x.soll.abstandPp) < 0.05;
  zeile(!ok, 'Buch angelegt am ' + tagDe(x.angelegt) + ' im Zustand "aus": ' + x.bar + ' Tagespunkte in bar, eingeschaltet und umgeschichtet am ' + tagDe(x.liq) + ' (' +
    x.positionen + ' Positionen). Karte/Kopf seit ' + tagDe(x.v.seit) + ': Buch ' + pz(x.v.buchPct) + ' gegen S&P 500 ' + pz(x.v.marktPct) + ', Abstand ' + ppDe(x.v.abstandPp) +
    '; ab dem letzten Punkt vor der ersten liquiden Umschichtung (Soll): ' + pz(x.soll.buchPct) + ' gegen ' + pz(x.soll.marktPct) + ', Abstand ' + ppDe(x.soll.abstandPp) +
    '. Gegenprobe (Buch erst am ' + tagDe(gp.angelegt) + ' angelegt, ' + gp.bar + (gp.bar === 1 ? ' Punkt' : ' Punkte') + ' davor): Karte ' + ppDe(gp.v.abstandPp) + ', Soll ' + ppDe(gp.soll.abstandPp) + '.');
};

/* 24 - F1 auf dem Eroeffnungsweg (neu auf main): um 10:00 New York tragen die Tagesbalken der 19 gehaltenen Werte (keiner
 *     ist Ziel) noch keine Eroeffnung - abgefragt werden sie nach den Zielen, eine Drosselung traefe sie zuerst -, die Ziele
 *     und SPY schon; um 10:30 sind auch sie da. Bargeld 0. Soll (REGEL §1.3: Verkaeufe vor Kaeufen zur Eroeffnung des
 *     Ausfuehrungstags, Geld sofort wieder angelegt): am Ende des Tages die Zielwerte im Buch, Bargeld nahe 0 -
 *     so wie die Messung mit denselben Eroeffnungen (messungUmschichtung). */
TESTS[24] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 10, 0), tage = werktageBis(MO, 520), spy = spyAus(tage);
  var voll = kunstUniversum(tage, namen), ziel = zielAm(voll, MO);
  var kaufIdx = tage.length - 63, kaufT = tage[kaufIdx] + 3600000;     // heute genau faellig (62 Balken dazwischen)
  var gehalten = namen.filter(function (s) { return ziel.indexOf(s) < 0; }).slice(0, 19);
  var pos = gehalten.map(function (s) { return { sym: s, stueck: 50, einstand: voll[s][kaufIdx][1] * 1.002, seit: tage[kaufIdx] }; });
  var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
  tagesdatenAblegen(st, voll, nyUTC(2026, 11, 23, 16, 30), spy);
  var d = { momentumAn: true, mfBuch: buchMit(JSON.parse(JSON.stringify(pos)), kaufT), mfVerlauf: [] };
  var alle = { SPY: 450 }; namen.forEach(function (s) { alle[s] = voll[s][voll[s].length - 1][1]; });
  var eroeff = { SPY: 450 }; ziel.forEach(function (s) { eroeff[s] = alle[s]; });
  var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, eroeff);
  await taktLauf(dep);
  var j = (d.tuneLog || []).filter(function (e) { return /^mfrebal-/.test(e.id); })[0];
  gehalten.forEach(function (s) { eroeff[s] = alle[s]; });
  dep.__uhr.jetzt = nyUTC(2026, 11, 24, 10, 30); await taktLauf(dep);
  dep.__uhr.jetzt = nyUTC(2026, 11, 24, 16, 30); await taktLauf(dep);
  var nach = (d.tuneLog || []).filter(function (e) { return /^mfnach-/.test(e.id); })[0];
  var mess = messungUmschichtung(buchMit(JSON.parse(JSON.stringify(pos)), kaufT), ziel, alle);
  var faellig = MH.faelligkeit(st.daten.mf_bezug.reihe, d.mfBuch.letzteAusfuehrungTag, 63, dep.__uhr.jetzt);
  var app = imZiel(d.mfBuch, ziel);
  zeile(app < imZiel(mess, ziel) || d.mfBuch.cash > mess.cash + 1000,
    '10:00 New York ohne Eroeffnung fuer die 19 gehaltenen Werte: "' + (j ? j.applied[0] : '-') + '"' + (j && /mangels Bargeld/.test(j.txt) ? ' (Kaeufe mangels Bargeld nicht ausgefuehrt, ' +
    'nicht als offen gemerkt)' : '') + '; 10:30 nachgefasst: ' + (nach ? '"' + nach.applied[0].slice(0, 60) + ' ..."' : '-') + '. Ende des Tages: ' + app + ' von ' + ziel.length +
    ' Zielwerten im Buch, Bargeld ' + geld(d.mfBuch.cash) + ', naechste Umschichtung nach ' + faellig.noch + ' weiteren Handelstagen. Messung mit denselben Eroeffnungen: ' +
    imZiel(mess, ziel) + ' Zielwerte, Bargeld ' + geld(mess.cash) + '.');
};

/* 25 - F1 auf dem Eroeffnungsweg (der Zusatz aus dem Zweig, auf main): am Ausfuehrungstag liefert die Quelle bis nach
 *     16:00 New York nur fuer SPY eine Eroeffnung (Netz gestoert). Takte um 10:00, 12:00 und 16:30.
 *     Soll (Messung: vollstaendiges Panel - sie schichtet an diesem Tag um; die App wie bei "zuWenig" am naechsten Tag
 *     neu): keine Umschichtung mit 0 Orders, die den 63-Tage-Takt neu setzt. */
TESTS[25] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 10, 0), tage = werktageBis(MO, 520), spy = spyAus(tage);
  var voll = kunstUniversum(tage, namen), ziel = zielAm(voll, MO);
  var kaufIdx = tage.length - 63, kaufT = tage[kaufIdx] + 3600000;     // heute genau faellig (62 Balken dazwischen)
  var pos = namen.filter(function (s) { return ziel.indexOf(s) < 0; }).slice(0, 19)
    .map(function (s) { return { sym: s, stueck: 50, einstand: voll[s][kaufIdx][1] * 1.002, seit: tage[kaufIdx] }; });
  var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
  tagesdatenAblegen(st, voll, nyUTC(2026, 11, 23, 16, 30), spy);
  var d = { momentumAn: true, mfBuch: buchMit(pos, kaufT), mfVerlauf: [] };
  var tagVorher = MH.nyTag(kaufT);
  var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, { SPY: 450 });
  await taktLauf(dep);
  dep.__uhr.jetzt = nyUTC(2026, 11, 24, 12, 0); await taktLauf(dep);
  dep.__uhr.jetzt = nyUTC(2026, 11, 24, 16, 30); await taktLauf(dep);
  var j = (d.tuneLog || []).filter(function (e) { return /^mfrebal-/.test(e.id); })[0];
  var ende = (d.tuneLog || []).filter(function (e) { return /^mfoffen-ende-/.test(e.id); })[0];
  var f = MH.faelligkeit(st.daten.mf_bezug.reihe, d.mfBuch.letzteAusfuehrungTag, 63, dep.__uhr.jetzt);
  var neu = d.mfBuch.letzteAusfuehrungTag !== tagVorher;
  zeile(neu && d.mfBuch.trades.length === 0,
    'Bis 16:30 New York nur fuer SPY eine Eroeffnung: ' + (j ? '"' + j.applied[0] + '"' : 'keine Umschichtung') + ', ' + d.mfBuch.trades.length + ' Ausfuehrungen, ' +
    d.mfBuch.positionen.length + ' alte Positionen (kein Ziel) bleiben; letzte Umschichtung ' + (neu ? 'NEU ' + MH.datumDe(d.mfBuch.letzteAusfuehrungTag) : 'bleibt ' + MH.datumDe(tagVorher)) +
    ' -> faellig ' + (f.faellig ? 'weiter' : 'erst nach ' + f.noch + ' weiteren Handelstagen') + '. Journal am Ende: "' + (ende ? ende.applied[0].slice(0, 70) + ' ...' : '-') +
    '". Die Messung schichtet an diesem Tag auf vollen Daten um.');
};

/* 26 - Split mit Ex-Tag = Ausfuehrungstag (Beleg f1). Der Bestand vom Stichtag (Montag 23.11., 17:00) traegt den Ex-Tag
 *     noch nicht, also bucht der Takt am Dienstag 10:00 New York den Split 2:1 auf XSPL nicht; die Eroeffnung des Ex-Tags
 *     kommt roh, also schon geteilt. XSPL (schwach, kein Ziel) wird mit der alten Stueckzahl zum geteilten Kurs verkauft,
 *     am Folgetag ist die Position weg und nichts wird nachgebucht. Dazu als Planrechnung ein Umkehr-Split 1:10 auf einem
 *     gehaltenen Ziel: der Depotwert im Plan blaeht sich auf und mit ihm jeder Platzwert.
 *     main: mfhandel.js:617 (bucheMassnahmen bucht nur t <= barZeit), mfdepot.js:48 (barZeit = juengster gespeicherter
 *           Balken), mfdepot.js:266 (Eroeffnung bereinigt: false), mfhandel.js:126 (Depotwert = Stueck x Eroeffnung).
 *     Messung: rueckblick.js:195 (preise = bEroeffnung, split-bereinigt wie Stueck und bSchluss), REGEL §1.1/§1.3.
 *     Soll: Buchwert nach dem Handel wie im einheitlichen Massstab (Lauf "Messung"); ein Split aendert den Depotwert im
 *     Plan nicht. Gegenprobe: derselbe Split mit Ex-Tag am Stichtag - der Bestand traegt ihn, gebucht vor dem Handel. */
TESTS[26] = async function () {
  var namen = universum().slice(0, 130), K = { kleinstAnteil: MH.buchKonfig().kleinstAnteil };
  var stichT = MH.nyZeit('2026-11-23', 9, 30), ausf = '2026-11-24', exT = MH.nyZeit(ausf, 9, 30);
  var tage = werktageUm(stichT, 300), n = tage.length, spy = spyAus(tage);
  var roh = kunstUniversum(tage, namen);
  roh.XSPL = buchReihe(tage, kursweg(n, -0.3));                   // schwach -> kein Ziel -> wird verkauft
  var ziel = zielAm(roh, stichT);
  if (ziel.indexOf('XSPL') >= 0) throw new Error('XSPL im Ziel');
  var letzteAusf = tage[n - 63] + 3600000;                       // 62 Balken danach -> heute faellig
  var xK = roh.XSPL[n - 1][1];
  /* art: 'app' (Ex-Tag = Ausfuehrungstag, Bestand ungeteilt), 'messung' (dieselbe Lage in einheitlichem Massstab:
   * Reihe geteilt, 200 Stueck), 'vortag' (Gegenprobe: Ex-Tag am Stichtag, Bestand geteilt, 100 Stueck vor dem Split). */
  async function lauf(art) {
    var st = speicher({ drift_markt: driftMarkt(spy, stichT) });
    var r = JSON.parse(JSON.stringify(roh)), m = art === 'messung';
    if (art !== 'app') r.XSPL = r.XSPL.map(function (b) { return [b[0], b[1] / 2, b[2] * 2, b[3] / 2]; });
    bestandAblegen(st, r, MH.nyZeit('2026-11-23', 17, 0), spy, { XSPL: { div: [], split: [[art === 'vortag' ? stichT : exT, 2, 1]] } });
    var pos = ziel.slice(0, 18).map(function (s) { return { sym: s, stueck: 50, einstand: roh[s][n - 63][1], seit: letzteAusf, kursT: tage[n - 63] }; });
    pos.push({ sym: 'XSPL', stueck: m ? 200 : 100, einstand: m ? 50 : 100, seit: letzteAusf, kursT: tage[n - 63] });
    var d = { momentumAn: true, mfBuch: buchMit(pos, letzteAusf), mfVerlauf: [] };
    var eroeff = {}; Object.keys(roh).forEach(function (s) { eroeff[s] = roh[s][n - 1][1]; });
    eroeff.SPY = 430; eroeff.XSPL = xK / 2;                       // Eroeffnung des Ex-Tags, roh = geteilt
    /* Angepasst (Runde 2, Nr. 108): im Lauf 'app' liefert die Quelle mit der Eroeffnung des Ex-Tags auch das
     * Split-Ereignis, wenn der Abruf es verlangt (der Weg des Generalprobe-Fixes, Fund 1). Soll unveraendert. */
    await taktUm(st, d, MH.nyZeit(ausf, 10, 0), eroeff, art === 'app' ? { XSPL: { div: [], split: [[exT, 2, 1]] } } : null);
    return { d: d, st: st, eroeff: eroeff, x: d.mfBuch.trades.filter(function (t) { return t.sym === 'XSPL'; })[0],
      wert: MH.bewerte(d.mfBuch, eroeff).wert, gebucht: (d.mfBuch.massnahmen || []).length };
  }
  var a = await lauf('app'), b = await lauf('messung'), gp = await lauf('vortag');
  // Folgetag: Bestand mit dem Ex-Tag, Reihe geteilt, Split-Ereignis - die Position ist weg, nichts wird nachgeholt
  var r2 = JSON.parse(JSON.stringify(roh));
  Object.keys(r2).forEach(function (s) { var l = r2[s][n - 1]; r2[s].push([exT, l[1], l[2], l[3]]); });
  r2.XSPL = r2.XSPL.map(function (z) { return [z[0], z[1] / 2, z[2] * 2, z[3] / 2]; });
  bestandAblegen(a.st, r2, MH.nyZeit(ausf, 17, 0), spy.concat([[exT, 430, 8e7, 430]]), { XSPL: { div: [], split: [[exT, 2, 1]] } });
  await taktUm(a.st, a.d, MH.nyZeit('2026-11-25', 10, 0), {});
  var nachgeholt = (a.d.mfBuch.massnahmen || []).length, xsplDa = imBuch(a.d.mfBuch, 'XSPL');
  // Umkehr-Split 1:10 auf einem GEHALTENEN Ziel: z0 hat heute Ex-Tag, Eroeffnung roh = x10, Stueck noch alt (Planrechnung)
  var z0 = ziel[0], bu = { cash: 0, positionen: ziel.slice(0, 10).map(function (s) { return { sym: s, stueck: 50, kursT: tage[n - 63] }; }).concat([{ sym: 'XSPL', stueck: 100, kursT: tage[n - 63] }]) };
  var plOk = MH.planeUmschichtung(ziel, bu, a.eroeff, K);
  var pr2 = Object.assign({}, a.eroeff); pr2[z0] = a.eroeff[z0] * 10;
  /* Angepasst (Runde 2, Nr. 108): der heutige Weg vor dem Plan (mfdepot.js takt -> splitsHeuteBuchen ->
   * MH.splitsAmAusfuehrungstag mit den Ereignissen aus dem Abruf der Eroeffnung). Fehlt die Funktion (Stand vor dem
   * Fix der Generalprobe), wird wie damals mit der alten Stueckzahl geplant. */
  var buUm = JSON.parse(JSON.stringify(bu)), erZ0 = {}, bzZ0 = {};
  erZ0[z0] = { div: [], split: [[exT, 1, 10]] }; bzZ0[z0] = exT;
  if (MH.splitsAmAusfuehrungstag) MH.splitsAmAusfuehrungstag(buUm, erZ0, bzZ0, MH.nyZeit(ausf, 10, 0));
  var plUm = MH.planeUmschichtung(ziel, buUm, pr2, K);
  var verlust = a.wert - b.wert;
  zeile(Math.abs(verlust) > 1 || Math.abs(plUm.depotwert - plOk.depotwert) > 1,
    'Split 2:1 auf XSPL, Ex-Tag = Ausfuehrungstag 24.11.: vor dem Handel gebucht ' + jn(a.gebucht) + ', verkauft ' + a.x.stueck + ' Stueck zu ' + kurs2(a.x.kurs) + ' = ' +
    geld(a.x.stueck * a.x.kurs * 0.998) + '; im einheitlichen Massstab (Messung) ' + b.x.stueck + ' Stueck = ' + geld(b.x.stueck * b.x.kurs * 0.998) + '. Buchwert nach dem Handel ' +
    geld(a.wert) + ' statt ' + geld(b.wert) + ' (' + geld(verlust) + ', ' + pz((a.wert / b.wert - 1) * 100) + '); Folgetag: Split nachgebucht ' + jn(nachgeholt) + ', XSPL im Buch ' + jn(xsplDa) +
    '. Umkehr-Split 1:10 auf dem gehaltenen Ziel ' + z0 + ' (Plan, ' + ziel.length + ' Ziele, Buch 10 Ziele + XSPL): Depotwert ' + geld(plOk.depotwert) + ' -> ' + geld(plUm.depotwert) +
    ', Platzwert je Kauf ' + geld(plOk.kaufen[0].budget) + ' -> ' + geld(plUm.kaufen[0].budget) + '. Gegenprobe Ex-Tag am Stichtag 23.11.: gebucht ' + jn(gp.gebucht) + ', verkauft ' +
    gp.x.stueck + ' Stueck, Buchwert ' + geld(gp.wert) + '.');
};

/* 27 - Split, Bestand am Ex-Tag WAEHREND der Sitzung geladen (Beleg f1b). Gespeichert ist der Stand vom Freitag (nicht frisch),
 *     am Dienstag 24.11. um 10:00 New York laedt der Lader neu. Die Quelle liefert die Vergangenheit schon geteilt (close ist
 *     splitbereinigt) und das Split-Ereignis mit dem Stempel des Ex-Tags; der laufende Balken des Ex-Tags wird abgeschnitten.
 *     Der Split wird nicht gebucht, die Kurse sind aber schon geteilt: der Tagespunkt des Stichtags haelt den halben Wert fest.
 *     main: mittelfrist.js:71 (bereinigt: true), mittelfrist.js:81 (ohneLaufendenBalken), mfhandel.js:617 (nur t <= barZeit),
 *           mfdepot.js:247 (Tagespunkt: bewerte mit den Schluessen des Bestands).
 *     Messung: rueckblick.js:234 (Schritt 6: Bewertung zum bSchluss, Stueck und Kurs im selben bereinigten Massstab), REGEL §1.3.
 *     Soll: Tagespunkt = 100 Stueck x ungeteilter Schluss (= 200 x geteilter). Gegenprobe: dieselbe Quelle um 17:00 geladen -
 *     der Balken des Ex-Tags steht im Bestand, der Split wird gebucht. */
TESTS[27] = async function () {
  var namen = universum();
  var stichT = MH.nyZeit('2026-11-23', 9, 30), ausf = '2026-11-24', exT = MH.nyZeit(ausf, 9, 30);
  var tage = werktageUm(stichT, 300), n = tage.length, spy = spyAus(tage);
  var roh = kunstUniversum(tage, namen);
  var S = namen[7], kS = roh[S][n - 1][1];
  // Quelle am Ex-Tag: Vergangenheit geteilt, laufender Balken des Ex-Tags dabei, Ereignis mit Stempel des Ex-Tags
  function quelle(sym, o) {
    var basis = sym === 'SPY' ? spy : roh[sym];
    if (!basis) return null;
    var r = basis.map(function (b) { return b.slice(); });
    var l = r[r.length - 1]; r.push([exT, l[1], l[2], l[3]]);
    if (sym === S) r = r.map(function (b) { return [b[0], b[1] / 2, b[2] * 2, b[3] / 2]; });
    var a = ladeAntwort(r, o);
    if (o.ereignisse) a.ereignisse = sym === S ? { div: [], split: [[exT, 2, 1]] } : { div: [], split: [] };
    return a;
  }
  async function lauf(jetzt) {
    var st = speicher({ drift_markt: driftMarkt(spy, stichT) });
    var rohAlt = {}; namen.forEach(function (s) { rohAlt[s] = roh[s].slice(0, -1); });
    bestandAblegen(st, rohAlt, MH.nyZeit('2026-11-20', 17, 0), spyAus(tage.slice(0, -1)), {});   // Freitag -> nicht frisch -> neu laden
    var mf = mittelfristSandbox(st, async function (sym, o) { return quelle(sym, o); }, jetzt);
    await mf.MF.ladeUniversum();
    var g = await mf.MF.tagesdatenLesen(), rS = g.roh[S];
    var letzteAusf = tage[n - 20] + 3600000;
    var pos = [{ sym: S, stueck: 100, einstand: kS, seit: letzteAusf, kursT: tage[n - 20] }];
    var d = { momentumAn: true, mfBuch: buchMit(pos, letzteAusf),
      mfVerlauf: [{ t: tage[n - 2], tag: MH.nyTag(tage[n - 2]), momentum: 100 * kS, spy: 400, spyT: tage[n - 2], startM: 100000 }] };
    var dep = mfdepotSandboxTag(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, {});
    await taktLauf(dep);
    return { letzterTag: MH.nyTag(rS[rS.length - 1][0]), schluss: rS[rS.length - 1][1], gebucht: (d.mfBuch.massnahmen || []).length,
      stueck: d.mfBuch.positionen[0].stueck, punkt: d.mfVerlauf[d.mfVerlauf.length - 1] };
  }
  var x = await lauf(MH.nyZeit(ausf, 10, 0)), gp = await lauf(MH.nyZeit(ausf, 17, 0));
  zeile(Math.abs(x.punkt.momentum - 100 * kS) > 1,
    'Bestand am Ex-Tag 24.11. um 10:00 New York neu geladen: juengster Balken ' + tagKurz(x.letzterTag) + ', Schluss ' + S + ' im Bestand ' + kurs2(x.schluss) + ' (vor dem Split ' +
    kurs2(kS) + ' - die Vergangenheit kommt schon geteilt, der Balken des Ex-Tags ist abgeschnitten). Split gebucht ' + jn(x.gebucht) + ', Stueck ' + x.stueck + '; Tagespunkt ' +
    tagKurz(x.punkt.tag) + ': Buch ' + geld(x.punkt.momentum) + ' statt ' + geld(100 * kS) + ' (100 Stueck x ' + kurs2(kS) + ' = 200 x ' + kurs2(kS / 2) + ') - ein geschriebener Punkt wird nicht neu gerechnet. ' +
    'Gegenprobe dieselbe Quelle um 17:00 geladen: juengster Balken ' + tagKurz(gp.letzterTag) + ', Split gebucht ' + jn(gp.gebucht) + ', Stueck ' + gp.stueck + ', Tagespunkt ' + tagKurz(gp.punkt.tag) +
    ': ' + geld(gp.punkt.momentum) + '.');
};

/* 28 - Ausschuettung mit Ex-Tag = Ausfuehrungstag auf Positionen, die zur Eroeffnung des Ex-Tags VERKAUFT werden (Beleg f2):
 *     XDIV (kein Ziel, 100 Stueck, 1,00 $) und ein Kleinstbestand (Ziel, 1 Stueck, 2,00 $), den Regel K2 verkauft und neu
 *     kauft. Am Morgen fehlt der Balken des Ex-Tags im Bestand, am Folgetag ist die Position weg (XDIV) bzw. neu gekauft.
 *     main: mfhandel.js:611-617 (bucheMassnahmen laeuft nur ueber buch.positionen und nur bis barZeit), mfdepot.js:384.
 *     Messung: rueckblick.js:180 (Schritt 2: Anspruch, wer ueber die Nacht hielt - vor dem Handel festgestellt),
 *              rueckblick.js:221 (Schritt 4: gutgeschrieben nach dem Handel), REGEL Teil C.3.
 *     Soll: 100 x 1,00 $ + 1 x 2,00 $ = 102,00 $ Bargeld nach dem Handel des Ex-Tags. Gegenprobe: dieselbe Lage, die
 *     Ausschuettung (0,50 $) liegt auf einem gehaltenen Ziel - sie wird am Folgetag gebucht. */
TESTS[28] = async function () {
  var namen = universum().slice(0, 130);
  var stichT = MH.nyZeit('2026-11-23', 9, 30), ausf = '2026-11-24', exT = MH.nyZeit(ausf, 9, 30);
  var tage = werktageUm(stichT, 300), n = tage.length, spy = spyAus(tage);
  var roh = kunstUniversum(tage, namen);
  roh.XDIV = buchReihe(tage, kursweg(n, -0.3));                   // schwach -> kein Ziel -> wird verkauft
  var ziel = zielAm(roh, stichT);
  var kl = ziel[3], gh = ziel[0];                                 // kl: Kleinstbestand (1 Stueck) -> K2; gh: gehalten (Gegenprobe)
  var letzteAusf = tage[n - 63] + 3600000;
  async function lauf(er) {
    var st = speicher({ drift_markt: driftMarkt(spy, stichT) });
    bestandAblegen(st, roh, MH.nyZeit('2026-11-23', 17, 0), spy, er);
    var pos = ziel.slice(0, 10).map(function (s) { return { sym: s, stueck: s === kl ? 1 : 50, einstand: 100, seit: letzteAusf, kursT: tage[n - 63] }; });
    pos.push({ sym: 'XDIV', stueck: 100, einstand: 100, seit: letzteAusf, kursT: tage[n - 63] });
    var d = { momentumAn: true, mfBuch: buchMit(pos, letzteAusf), mfVerlauf: [] };
    var eroeff = {}; Object.keys(roh).forEach(function (s) { eroeff[s] = roh[s][n - 1][1]; }); eroeff.SPY = 430;
    await taktUm(st, d, MH.nyZeit(ausf, 10, 0), eroeff);
    var verk = d.mfBuch.trades.filter(function (t) { return t.art === 'verkauf'; }).map(function (t) { return t.sym; });
    var klNeu = d.mfBuch.positionen.filter(function (p) { return p.sym === kl; })[0], cash0 = d.mfBuch.cash;
    // Folgetag: der Bestand traegt den Ex-Tag und die Ereignisse
    var r2 = JSON.parse(JSON.stringify(roh));
    Object.keys(r2).forEach(function (s) { var l = r2[s][n - 1]; r2[s].push([exT, l[1], l[2], l[3]]); });
    bestandAblegen(st, r2, MH.nyZeit(ausf, 17, 0), spy.concat([[exT, 430, 8e7, 430]]), er);
    await taktUm(st, d, MH.nyZeit('2026-11-25', 10, 0), {});
    var div = (d.mfBuch.massnahmen || []).filter(function (m) { return m.art === 'div'; });
    return { verk: verk, klNeu: klNeu, cash0: cash0, cash1: d.mfBuch.cash, n: div.length, summe: div.reduce(function (s, m) { return s + m.summe; }, 0),
      gehalten: imBuch(d.mfBuch, gh) };
  }
  var er = { XDIV: { div: [[exT, 1.0]], split: [] } }; er[kl] = { div: [[exT, 2.0]], split: [] };
  var erGp = {}; erGp[gh] = { div: [[exT, 0.5]], split: [] };
  var x = await lauf(er), gp = await lauf(erGp);
  var soll = 100 * 1.0 + 1 * 2.0;
  zeile(Math.abs(x.summe - soll) > 0.01,
    'Ausfuehrungstag 24.11. = Ex-Tag: verkauft ' + x.verk.join(', ') + '; Kleinstbestand ' + kl + ' (1 Stueck ueber Nacht) nach K2 verkauft und neu gekauft (' +
    (x.klNeu ? stk(x.klNeu.stueck) + ' Stueck' + (x.klNeu.kursT === exT ? ', Kauf auf den Ex-Tag gestempelt' : '') : 'nicht gekauft') + '). App bis zum Folgetag: ' + x.n +
    ' Ausschuettungen gebucht (' + betrag(x.summe) + '), Bargeld ' + betrag(x.cash0) + ' -> ' + betrag(x.cash1) + '. Messung: XDIV 100 Stueck x 1,00 $ + ' + kl + ' 1 Stueck x 2,00 $ = ' +
    betrag(soll) + ' nach dem Handel des Ex-Tags gutgeschrieben. Gegenprobe Ausschuettung auf dem gehaltenen Ziel ' + gh + ' (50 Stueck x 0,50 $, ' + (gp.gehalten ? 'gehalten' : 'NICHT gehalten') +
    '): ' + gp.n + ' gebucht bis zum Folgetag (' + betrag(gp.summe) + ').');
};

/* 29 - Nachfassen eines VERKAUFS, der Erloes bleibt liegen (Beleg f3; reine Rechnung mit den Funktionen von mfhandel.js).
 *     Um 09:36 New York fehlt die Eroeffnung der gehaltenen Nicht-Ziel-Position ALT (5.000 $). Der Plan rechnet den Depotwert
 *     ohne sie, der Kauf des 19. Ziels T19 traegt sich ohne ihren Erloes nicht und faellt aus - offen wird nur der Verkauf.
 *     Um 10:05 kommt die Eroeffnung (derselbe Kurs): nachfassen verkauft ALT und kauft nichts. Dazu ein Kleinstbestand
 *     (Ziel T5, 1 Stueck) ohne Eroeffnung: er wird gehalten und steht nicht in offen.
 *     main: mfhandel.js:126 (Depotwert nur mit Kurs), mfhandel.js:750-751 (offeneAuftraege: nur plan.fehltKurs, ein
 *           Verkauf ohne den Kauf, den sein Erloes truege), mfhandel.js:777/791 (nachfassen kauft nur offen.kaeufe),
 *           mfdepot.js:428.
 *     Messung: rueckblick.js:195-200 (alle Eroeffnungen des Tages, Verkaeufe vor Kaeufen in einem fuehreAus), REGEL §1.3.
 *     Soll: am Ende des Tages dieselben Positionen und dasselbe Bargeld wie die Messung. Gegenprobe: dem Kauf T19 fehlt um
 *     09:36 die Eroeffnung (statt dem Verkauf) - er steht in offen und wird um 10:05 nachgekauft. */
TESTS[29] = function () {
  var K = { kleinstAnteil: MH.buchKonfig().kleinstAnteil }, tag = '2026-11-24';
  var vor = MH.nyZeit(tag, 9, 36), nach = MH.nyZeit(tag, 10, 5), oeffT = MH.nyZeit(tag, 9, 30);
  var ziel = []; for (var i = 1; i <= 19; i++) ziel.push('T' + i);
  function buch() {
    var ps = ziel.slice(0, 18).map(function (s) { return { sym: s, stueck: 50, einstand: 100 }; });   // 18 gehaltene Ziele zu je 5.000 $
    ps.push({ sym: 'ALT', stueck: 50, einstand: 100 });                                                // kein Ziel, 5.000 $
    return { cash: 0, positionen: ps, trades: [] };
  }
  /* Kleinstbestand: Ziel T5 mit 1 Stueck (100 $ bei 5.000 $ Platzwert), ALT verkauft, T19 schon im Buch, 4.900 $ Bargeld */
  function buchKlein() {
    var b = buch(); b.positionen[4].stueck = 1; b.cash = 4900; b.positionen.pop(); b.positionen.push({ sym: 'T19', stueck: 50, einstand: 100 });
    return b;
  }
  var kurse = { ALT: 100 }; ziel.forEach(function (s) { kurse[s] = 100; });
  function messung(b) { MH.fuehreAus(b, MH.planeUmschichtung(ziel, b, kurse, K), vor, 20, K); return b; }
  /* Angepasst (Runde 2, Nr. 108): der heutige Weg. Seit dem Fix der Generalprobe (Fund 2) fragt ausfuehrungVorbereiten
   * (mfdepot.js) vor dem Plan MH.eroeffnungAbwarten: fehlt einer GEHALTENEN Position mit Balken am Stichtag die
   * Eroeffnung, wird bis 16:00 New York nicht gehandelt und beim naechsten Takt (10:05) mit allen Eroeffnungen geplant.
   * Dafuer braucht die Rechnung den Bestand: jede Reihe hat einen Balken am Stichtag 23.11. Fehlt die Funktion (Stand
   * vor dem Fix), laeuft der alte Weg: planen ohne den Wert, offen merken, um 10:05 nachfassen. Soll unveraendert. */
  var stichtag = '2026-11-23', roh = {};
  ziel.concat(['ALT']).forEach(function (s) { roh[s] = [[MH.nyZeit(stichtag, 9, 30), 100, 1e6]]; });
  /** Die App: um 09:36 fehlt die Eroeffnung von fehlt; wartet sie, oder ist etwas offen, kommt sie um 10:05 (derselbe Kurs). */
  function app(b, fehlt) {
    var ohne = Object.assign({}, kurse); delete ohne[fehlt];
    var warten = MH.eroeffnungAbwarten ? MH.eroeffnungAbwarten(b.positionen, ohne, roh, stichtag, vor) : [];
    if (warten.length) {
      var planW = MH.planeUmschichtung(ziel, b, kurse, K); MH.fuehreAus(b, planW, nach, 20, K);
      return { plan: planW, offen: MH.offeneAuftraege(ziel, planW, tag), res: null, wartete: warten };
    }
    var plan = MH.planeUmschichtung(ziel, b, ohne, K); MH.fuehreAus(b, plan, vor, 20, K);
    var offen = MH.offeneAuftraege(ziel, plan, tag), pr = {}, bt = {};
    pr[fehlt] = 100; bt[fehlt] = oeffT; b.offen = offen;
    return { plan: plan, offen: offen, res: offen ? MH.nachfassen(b, pr, bt, nach, 20, K) : null, wartete: [] };
  }
  /** Was um 09:36 und 10:05 geschah, als Text. */
  function ablauf(x, fehlt) {
    if (x.wartete.length) return '09:36 gewartet auf [' + x.wartete.join(', ') + '] (kein Handel), 10:05 mit allen Eroeffnungen geplant: Plan-Depotwert ' +
      geld(x.plan.depotwert) + ', Kaeufe ' + x.plan.kaufen.filter(function (o) { return o.stueck > 0; }).length + ' ausgefuehrt';
    return 'Plan-Depotwert ' + geld(x.plan.depotwert) + ' (ohne ' + fehlt + '), Kaeufe geplant ' + x.plan.kaufen.length + ' (' + syms(x.plan.kaufen) + ')' +
      ', ausgefuehrt ' + jn(x.plan.kaufen.length && x.plan.kaufen[0].stueck > 0) + '; offen: Verkaeufe [' + syms(x.offen && x.offen.verkaeufe) + '], Kaeufe [' + syms(x.offen && x.offen.kaeufe) +
      ']. 10:05 nachgefasst: verkauft [' + (x.res ? x.res.verkauft.map(function (v) { return v.sym + ' zu ' + kurs2(v.kurs); }).join(', ') : '') + '], gekauft [' + syms(x.res && x.res.gekauft) + ']';
  }
  function st5(b) { var p = b.positionen.filter(function (x) { return x.sym === 'T5'; })[0]; return p ? p.stueck : 0; }
  function syms(l) { return (l || []).map(function (x) { return x.sym || x; }).join(', '); }
  var bM = messung(buch()), bA = buch(), a = app(bA, 'ALT');
  var kM = messung(buchKlein()), kA = buchKlein(), k = app(kA, 'T5');
  var bG = buch(), g = app(bG, 'T19');
  zeile(bA.positionen.length !== bM.positionen.length || Math.abs(bA.cash - bM.cash) > 100 || Math.abs(st5(kA) - st5(kM)) > 1,
    '09:36 New York ohne Eroeffnung fuer ALT (kein Ziel, 5.000 $): ' + ablauf(a, 'ALT') + ' -> T19 im Buch ' + jn(imBuch(bA, 'T19')) + ', ' +
    bA.positionen.length + ' Positionen, Bargeld ' + betrag(bA.cash) + ' bis zur naechsten Umschichtung (63 Handelstage). Messung: T19 gekauft ' + jn(imBuch(bM, 'T19')) + ', ' +
    bM.positionen.length + ' Positionen, Bargeld ' + betrag(bM.cash) + '. Kleinstbestand T5 (1 Stueck) ohne Eroeffnung: ' + (k.wartete.length ? '09:36 gewartet, 10:05 geplant; ' : '') + 'App ' + stk(st5(kA)) + ' Stueck, offen ' + (k.offen ? syms(k.offen.verkaeufe.concat(k.offen.kaeufe)) : 'nichts') +
    ', Bargeld ' + betrag(kA.cash) + ' bis zur naechsten Umschichtung; Messung ' + stk(st5(kM)) + ' Stueck (K2: verkauft, voll neu gekauft). Gegenprobe Kauf T19 ohne Eroeffnung um 09:36: offen [' +
    syms(g.offen && g.offen.kaeufe) + '], 10:05 gekauft [' + syms(g.res && g.res.gekauft) + '], ' + bG.positionen.length + ' Positionen, Bargeld ' + betrag(bG.cash) + '.');
};

/* 30 - Reihenende in den fuenf Tagen vor der Umschichtung (Beleg f4; reine Rechnung). WEG (5.000 $) hat seine letzte Zeile
 *     am Freitag 20.11., Ausfuehrungstag ist Dienstag 24.11. Die App bucht erst nach fuenf SPY-Balken aus; am 24.11. wird WEG
 *     ohne Eroeffnung gehalten (zaehlt nicht zum Depotwert), der Platz T19 bleibt leer, und das Geld aus dem spaeteren
 *     Ausbuchen liegt bis zur naechsten Umschichtung. Der Preis ist derselbe (letzter Schluss) - die Anlage nicht.
 *     main: mfhandel.js:426/436 (REIHENENDE_TAGE = 5), mfdepot.js:396 (Reihenende vor der Umschichtung des Takts).
 *     Messung: rueckblick.js:165 (Schritt 1: am ersten Handelstag nach der letzten Zeile, VOR Schritt 3), REGEL §1.4, Teil C.5.
 *     Soll: am 24.11. T19 gekauft, Bargeld nahe 0 wie die Messung. Gegenprobe: letzte Zeile am 16.11. - bis zum Stichtag
 *     liegen fuenf SPY-Balken dazwischen, die App bucht am 24.11. vor der Umschichtung aus.
 *     Angepasst (Nachkauf, Entscheid Wilhelm 09.10.2026): die 5-Tage-Regel bleibt; der Kauf, der am 24.11. mangels Bargeld
 *     ausfiel, wird nach dem Ausbuchen zur naechsten Eroeffnung nachgeholt (nachkaufMerken/nachkaufAnlegen/nachfassen wie
 *     mfdepot.js). Geprueft wird deshalb, dass T19 am Ende im Buch ist und das Bargeld nahe der Messung liegt. Was bewusst
 *     bleibt: der Kauf kommt rund fuenf Handelstage spaeter, zum Eroeffnungskurs jenes Tages (hier gleich). */
TESTS[30] = function () {
  var K = { kleinstAnteil: MH.buchKonfig().kleinstAnteil };
  function st(tag) { return MH.nyZeit(tag, 9, 30); }
  var spyTage = ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19', '2026-11-20', '2026-11-23', '2026-11-24', '2026-11-25', '2026-11-27', '2026-11-30', '2026-12-01'];
  function spyBis(tag) { return spyTage.filter(function (t) { return t <= tag; }).map(function (t, j) { return [st(t), 400 + j, 8e7, 400 + j]; }); }
  var ziel = []; for (var i = 1; i <= 19; i++) ziel.push('T' + i);
  function buch() {
    var ps = ziel.slice(0, 18).map(function (s) { return { sym: s, stueck: 50, einstand: 100, kursT: st('2026-08-25') }; });
    ps.push({ sym: 'WEG', stueck: 50, einstand: 100, kursT: st('2026-08-25') });
    return { cash: 0, positionen: ps, trades: [] };
  }
  function rohMit(wegTage) {
    var r = { WEG: [[st(wegTage[0]), 101, 1e6], [st(wegTage[1]), 100, 1e6]] };
    ziel.forEach(function (s) { r[s] = spyTage.map(function (t) { return [st(t), 100, 3e6]; }); });
    return r;
  }
  var kurse = {}; ziel.forEach(function (s) { kurse[s] = 100; });   // WEG hat am 24.11. keine Eroeffnung
  // Messung: Montag 23.11. ausgebucht (letzter Schluss 100, ohne Kosten), Dienstag 24.11. umgeschichtet
  var bM = buch(); bM.positionen = bM.positionen.filter(function (p) { return p.sym !== 'WEG'; }); bM.cash += 50 * 100;
  MH.fuehreAus(bM, MH.planeUmschichtung(ziel, bM, kurse, K), st('2026-11-24'), 20, K);
  /** Die App: Takt am 24.11. 10:00 - erst reihenendeAusbuchen (Bestand bis Montag), dann die Umschichtung; danach die
   *  Takte der Folgetage, bis WEG ausgebucht ist. */
  function app(roh) {
    var b = buch(), heute = MH.nyZeit('2026-11-24', 10, 0);
    var aus1 = MH.reihenendeAusbuchen(b, roh, spyBis('2026-11-23'), heute);
    var plan = MH.planeUmschichtung(ziel, b, kurse, K); MH.fuehreAus(b, plan, heute, 20, K);
    b.nachkauf = MH.nachkaufMerken(ziel, plan, '2026-11-24', heute);   // wie mfdepot.js nach fuehreAus (Nachkauf, 09.10.2026)
    var offen = MH.offeneAuftraege(ziel, plan, '2026-11-24'), t19 = imBuch(b, 'T19'), spaeter = [], nachkauf = [];
    ['2026-11-25', '2026-11-27', '2026-11-30', '2026-12-01'].forEach(function (tag) {
      var jetzt = MH.nyZeit(tag, 10, 0) + TAG;
      var a = MH.reihenendeAusbuchen(b, roh, spyBis(tag), jetzt);
      if (a.length) spaeter.push(tagKurz(tag) + ' (' + a[0].tage + ' Balken)');
      /* Der Takt danach (mfdepot.js): Nachkauf ansetzen, zur Eroeffnung seines Tages nachfassen. */
      var nk = MH.nachkaufAnlegen(b, jetzt, K);
      if (nk) {
        var r = MH.nachfassen(b, kurse, {}, MH.nyZeit(nk.tag, 9, 40), 20, K);
        nachkauf.push(tagKurz(nk.tag) + ' ' + r.gekauft.map(function (g) { return g.sym; }).join(', '));
      }
    });
    return { b: b, aus1: aus1.length, plan: plan, offen: offen, t19: t19, spaeter: spaeter, nachkauf: nachkauf };
  }
  var x = app(rohMit(['2026-11-19', '2026-11-20'])), gp = app(rohMit(['2026-11-13', '2026-11-16']));
  zeile(!imBuch(x.b, 'T19') || Math.abs(x.b.cash - bM.cash) > 100,
    'WEG mit letzter Zeile Fr 20.11., Ausfuehrungstag Di 24.11.: App bucht am 24.11. ' + x.aus1 + ' Position(en) aus, WEG ohne Eroeffnung ' + (x.plan.halten.indexOf('WEG') >= 0 ? 'gehalten' : 'nicht gehalten') +
    ', Plan-Depotwert ' + geld(x.plan.depotwert) + ' (ohne WEG), T19 gekauft ' + jn(x.t19) + ', offener Verkauf ' + JSON.stringify(x.offen && x.offen.verkaeufe) + ' (kann nie gefuellt werden); ausgebucht am ' +
    (x.spaeter.join(', ') || '-') + ', nachgekauft zur Eroeffnung ' + (x.nachkauf.join('; ') || '-') + ' -> Bargeld ' + betrag(x.b.cash) + ' bis zur naechsten Umschichtung, T19 im Buch ' + jn(imBuch(x.b, 'T19')) + '. Messung: WEG am 23.11. ausgebucht, am 24.11. T19 gekauft ' +
    jn(imBuch(bM, 'T19')) + ', Bargeld ' + betrag(bM.cash) + '. Gegenprobe letzte Zeile Mo 16.11.: am 24.11. ' + gp.aus1 + ' ausgebucht, T19 gekauft ' + jn(gp.t19) + ', Bargeld ' + betrag(gp.b.cash) + '.');
};

/* 31 - Tote Reihen gegen die 95-%-Schwelle von stichtagPruefen (Beleg f5). Ein Wert, der endgueltig nichts mehr liefert,
 *     behaelt seine alte Reihe und steht auf weg. ladenAnnehmen nimmt weg-Werte aus dem Nenner, stichtagPruefen nicht: es
 *     verlangt fuer 95 % ALLER Werte im Bestand einen Balken vom Stichtag. Bestand: 189 Werte (HES, BK, MMC, FI liefern schon
 *     heute nichts), davon 8 bis 11 seit 40 Handelstagen ohne Antwort; Ladevorgang am Montagabend, Takt am faelligen Dienstag.
 *     main: mfhandel.js:366 (r.ok: mit * 100 >= gesamt * 95, gesamt = alle Werte), mittelfrist.js:244 (weg behaelt die alte
 *           Reihe), mittelfrist.js:159 (ladenAnnehmen: weg nicht im Nenner), mfdepot.js:284.
 *     Messung: rueckblick.js:99 (zielAm: momentumZiel auf allen Reihen, keine Schwelle; zu alte wirft momentumZiel selbst
 *              hinaus), REGEL §1.2.
 *     Soll: umgeschichtet, solange momentumZiel einen Korb bildet. Gegenprobe: 9 tote Reihen (180 von 189) - umgeschichtet. */
TESTS[31] = async function () {
  var alle = universum(), nie = ['HES', 'BK', 'MMC', 'FI'];          // liefern schon heute nichts (Kommentar in mittelfrist.js)
  var namen = alle.filter(function (s) { return nie.indexOf(s) < 0; });
  var stichT = MH.nyZeit('2026-11-23', 9, 30), ausf = '2026-11-24';
  var tage = werktageUm(stichT, 300), n = tage.length, spy = spyAus(tage);
  async function lauf(tot) {
    var roh = kunstUniversum(tage, namen), weg = namen.slice(-tot);   // seit Wochen ohne Antwort (Uebernahme, Kuerzelwechsel)
    weg.forEach(function (s) { roh[s] = roh[s].slice(0, n - 40); });
    var st = speicher({ drift_markt: driftMarkt(spy, stichT) }), altAt = MH.nyZeit('2026-11-20', 17, 0);
    tagesdatenAblegen(st, roh, altAt, spy); st.daten.mf_tagesdaten_index.weg = weg.concat(nie);
    // Ladevorgang am Montagabend: die toten liefern nichts, alle anderen alles
    var mf = mittelfristSandbox(st, async function (sym, o) {
      if (weg.indexOf(sym) >= 0 || nie.indexOf(sym) >= 0) return null;
      return ladeAntwort(sym === 'SPY' ? spy : roh[sym], o);
    }, MH.nyZeit('2026-11-23', 17, 0));
    await mf.MF.ladeUniversum();
    var g = await mf.MF.tagesdatenLesen();
    var sp = MH.stichtagPruefen(g.roh, g.bezug.reihe, g.at, ausf);
    var mz = MH.momentumZiel(MH.rohBis(g.roh, '2026-11-23'), { nowMs: stichT });
    // Takt am faelligen Ausfuehrungstag
    var d = { momentumAn: true, mfBuch: buchMit([], tage[n - 63] + 3600000), mfVerlauf: [] }; d.mfBuch.cash = 100000;
    var eroeff = {}; namen.forEach(function (s) { eroeff[s] = 100; }); eroeff.SPY = 430;
    var dep = mfdepotSandboxTag(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, MH.nyZeit(ausf, 10, 0), eroeff);
    await taktLauf(dep);
    return { tot: tot, angenommen: g.at !== altAt, bestand: Object.keys(g.roh).length, sp: sp, korb: !mz.zuWenig, zulaessig: mz.korb.zulaessig, um: umgeschichtet(d) };
  }
  var l = [];
  for (var tot = 8; tot <= 11; tot++) l.push(await lauf(tot));
  var gesperrt = l.filter(function (z) { return !z.sp.ok; })[0];
  zeile(l.some(function (z) { return z.korb && !z.um; }),
    'Bestand ' + l[0].bestand + ' Werte, Ladevorgang jeweils ' + (l.every(function (z) { return z.angenommen; }) ? 'angenommen' : 'NICHT immer angenommen') + ': ' +
    l.map(function (z) {
      return z.tot + ' tote Reihen' + (z.tot === 9 ? ' (Gegenprobe)' : '') + ' - Stichtag ' + z.sp.mit + '/' + z.sp.gesamt + (z.sp.ok ? ' ok' : ' gesperrt') + ', momentumZiel ' +
        (z.korb ? 'moeglich (' + z.zulaessig + ' zulaessig)' : 'zu wenig') + ', ' + (z.um ? 'umgeschichtet' : 'NICHT umgeschichtet');
    }).join('; ') + (gesperrt ? '. Karte: "' + gesperrt.sp.grund + '"' : '') + '. Ab dem 10. verschwundenen Wert schichtet das Buch nie mehr um; die Messung kennt diese Schwelle nicht.');
};

/* 32 - Der SPY-Abruf scheitert, die Werte kommen (Beleg f6). Der Ladevorgang wird angenommen, mittelfrist.js behaelt die ALTE
 *     SPY-Reihe und schreibt sie mit dem NEUEN Stand at. faelligkeit() zaehlt an dieser Reihe: die fehlenden Tage fehlen in der
 *     Zaehlung, und bis zu drei Werktage gilt die Reihe nicht als veraltet. SPY im Bestand bis Fr 27.11., danach scheitert der
 *     SPY-Abruf drei Abende lang; am vierten kommt er wieder. Abends geladen, am naechsten Werktag 10:00 New York gehandelt.
 *     main: mittelfrist.js:249 (alte Bezugsreihe behalten), mittelfrist.js:251 (Stand at = jetzt), mfhandel.js:340/343
 *           (veraltet erst nach drei Werktagen, tageSeit an der SPY-Reihe), mfdepot.js:457 (Journal: "die App lief am
 *           faelligen Tag nicht nach Boersenoeffnung").
 *     Messung: rueckblick.js:218 (naechste = Q.ptage[o + halten], der 63. Panel-Handelstag), REGEL §1.3.
 *     Soll: umgeschichtet am faelligen Tag der Messung (oder gesperrt mit dem wahren Grund). Gegenprobe: SPY kommt jeden Abend.
 *     Repariert (Runde 2, Nr. 108): seit dem Fix der Generalprobe (Fund D-06) behaelt mittelfrist.js ohne SPY-Antwort die alte
 *     Bezugsreihe NICHT mehr unter dem neuen Stand - tagesdatenLesen liefert dann bezug = null, und g.bezug.reihe warf einen
 *     TypeError. Gezaehlt wird jetzt an dem, was der Bestand liefert (ohne SPY: nichts). "Gesperrt mit dem wahren Grund" heisst:
 *     an jedem Tag ohne SPY nennt die Karte die fehlende Marktreihe, und das Journal der verspaeteten Umschichtung nennt sie
 *     auch - nicht "die App lief nicht". Soll unveraendert. */
TESTS[32] = async function () {
  var namen = universum();
  var ende = MH.nyZeit('2026-12-04', 9, 30);                      // Fr 04.12.2026
  var alleTage = werktageUm(ende, 320), spyAlle = spyAus(alleTage), rohAlle = kunstUniversum(alleTage, namen);
  var spyBisIdx = alleTage.length - 6;                            // SPY im Bestand nur bis Fr 27.11.
  var E = spyBisIdx + 2 - 63;                                     // faellig (der 63.) ist der Tag nach dem ersten Abend ohne SPY
  var letzteAusf = alleTage[E] + 3600000, messTag = MH.nyTag(alleTage[E + 63]);
  function bisIdx(i) { var r = {}; namen.forEach(function (s) { r[s] = rohAlle[s].slice(0, i + 1); }); return r; }
  async function lauf(spyFehlt) {
    var st = speicher({ drift_markt: driftMarkt(spyAlle, ende) });
    tagesdatenAblegen(st, bisIdx(spyBisIdx), MH.nyZeit(MH.nyTag(alleTage[spyBisIdx]), 17, 0), spyAlle.slice(0, spyBisIdx + 1));
    var d = { momentumAn: true, mfBuch: buchMit([], letzteAusf), mfVerlauf: [] }; d.mfBuch.cash = 100000;
    var eroeff = {}; namen.forEach(function (s) { eroeff[s] = 100; }); eroeff.SPY = 430;
    /* Abend k: Tag i laden (SPY scheitert an den ersten spyFehlt Abenden), am naechsten Werktag um 10:00 der Takt */
    async function abend(k) {
      var i = spyBisIdx + k, spyOk = k > spyFehlt;
      var heute = i + 1 < alleTage.length ? MH.nyTag(alleTage[i + 1]) : '2026-12-07';
      var mf = mittelfristSandbox(st, async function (sym, o) {
        if (sym === 'SPY') return spyOk ? ladeAntwort(spyAlle.slice(0, i + 1), o) : null;
        var r = rohAlle[sym]; return r ? ladeAntwort(r.slice(0, i + 1), o) : null;
      }, MH.nyZeit(MH.nyTag(alleTage[i]), 17, 0));
      await mf.MF.ladeUniversum();
      var g = await mf.MF.tagesdatenLesen(), r0 = g.roh[namen[0]];
      var fl = MH.faelligkeit(g.bezug ? g.bezug.reihe : null, MH.nyTag(letzteAusf), 63, MH.nyZeit(heute, 10, 0));
      var dep = mfdepotSandboxTag(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, MH.nyZeit(heute, 10, 0), eroeff);
      await taktLauf(dep);
      var z = (d.tuneLog || []).filter(function (x) { return /^mfrebal-/.test(x.id); })[0];
      var karte = /Marktreihe \(SPY\) fehlt/.test(dep.__karte.innerHTML);
      return { heute: heute, werteBis: MH.nyTag(r0[r0.length - 1][0]), fl: fl, um: !!z, spyOk: spyOk, karteSpy: karte, txt: z ? z.txt : '',
        spaet: z ? ((/ – (\d+ Handelstage? verspätet \(.*?\))\. Kosten/.exec(z.txt) || [])[1] || null) : null };
    }
    var tageL = [];
    for (var k = 1; k <= 4 && !umgeschichtet(d); k++) tageL.push(await abend(k));
    return { tage: tageL, um: tageL.filter(function (t) { return t.um; })[0] };
  }
  var x = await lauf(3), gp = await lauf(0);
  var ohneSpy = x.tage.filter(function (t) { return !t.spyOk; });
  var mitGrund = ohneSpy.length > 0 && ohneSpy.every(function (t) { return t.karteSpy && !t.um; }) && !!x.um &&
    /SPY/.test(x.um.txt) && !/die App lief nicht/.test(x.um.txt);
  zeile((!x.um || x.um.heute !== messTag) && !mitGrund,
    'Messung: faellig am ' + tagKurz(messTag) + ' (63. Handelstag nach ' + tagKurz(MH.nyTag(alleTage[E])) + '). SPY-Abruf scheitert drei Abende, die Werte kommen: ' +
    x.tage.map(function (t) {
      return tagKurz(t.heute) + ' Werte bis ' + tagKurz(t.werteBis) + ', SPY bis ' + tagKurz(t.fl.letzterMarktTag) + (t.spyOk ? '' : ' (Abruf gescheitert)') + ', tageSeit ' + t.fl.tageSeit + ', faellig ' + jn(t.fl.faellig) +
        ', noch ' + t.fl.noch + ', veraltet ' + jn(t.fl.veraltet) + (t.spyOk ? '' : ', Karte nennt die fehlende Marktreihe ' + jn(t.karteSpy)) + (t.um ? ', umgeschichtet' : '');
    }).join('; ') + ' -> umgeschichtet ' + (x.um ? 'am ' + tagKurz(x.um.heute) + ', Journal: "' + (x.um.spaet || 'ohne Verspaetung') + '"' : 'gar nicht') +
    '. Gegenprobe SPY jeden Abend: umgeschichtet ' + (gp.um ? 'am ' + tagKurz(gp.um.heute) + (gp.um.spaet ? ', "' + gp.um.spaet + '"' : ', ohne Verspaetung') : 'gar nicht') + '.');
};

/* 33 - Ein Ladevorgang, der vor 16:15 New York beginnt und danach endet (Beleg f7). holeTage schneidet den Tagesbalken je Wert
 *     mit der Uhr DIESES Abrufs ab, der Bestand bekommt den Stand at = Ende des Ladevorgangs. bestandFrisch(at) haelt ihn fuer
 *     frisch (kein Nachladen bis zum naechsten Tag); die ersten Werte der Liste tragen den Balken des Tages nicht. Liegen sie
 *     unter 5 %, laesst stichtagPruefen den Handel zu - sie rangieren mit dem Vortag. Ein Abruf je Sekunde, Beginn 16:14:50.
 *     main: mittelfrist.js:81 (ohneLaufendenBalken(reihe, Date.now()) je Wert), mittelfrist.js:251 (at = Date.now() nach dem
 *           letzten Abruf), mfhandel.js:292 (bestandFrisch), mfhandel.js:366 (95 %).
 *     Messung: rueckblick.js:71 (rohMapAm: jede Reihe bis einschliesslich Stichtag), REGEL §1.2.
 *     Soll: kein Handel auf einem Bestand, in dem Werte den Stichtag nicht tragen (alle bis einschliesslich Stichtag, oder
 *     nicht frisch). Gegenprobe: Beginn 16:15:00 - alle Werte tragen den Balken des Tages. */
TESTS[33] = async function () {
  var namen = universum(), D = '2026-11-23';
  var tage = werktageUm(MH.nyZeit(D, 9, 30), 300), spy = spyAus(tage), roh = kunstUniversum(tage, namen);
  async function lauf(start) {
    var st = speicher({}), alt = {};
    namen.forEach(function (s) { alt[s] = roh[s].slice(0, -2); });
    tagesdatenAblegen(st, alt, MH.nyZeit('2026-11-19', 17, 0), spy.slice(0, -2));   // Stand vom Donnerstag -> nicht frisch -> neu laden
    st.daten.mf_ereignisse = { at: 1, sym: {} };
    var win = mittelfristSandbox(st, async function (sym, o) {
      win.__uhr.jetzt += 1000;                                    // ein Abruf je Sekunde (90 ms Pause + Antwortzeit)
      return sym === 'SPY' ? ladeAntwort(spy, o) : roh[sym] ? ladeAntwort(roh[sym], o) : null;
    }, start);
    await win.MF.ladeUniversum();
    var g = await win.MF.tagesdatenLesen();
    var ohne = namen.filter(function (s) { var r = g.roh[s]; return r && MH.nyTag(r[r.length - 1][0]) < D; });
    return { start: start, at: g.at, ohne: ohne, vorTag: ohne.length ? MH.nyTag(g.roh[ohne[0]][g.roh[ohne[0]].length - 1][0]) : null,
      frisch: MH.bestandFrisch(g.at, MH.nyZeit('2026-11-24', 9, 40)), sp: MH.stichtagPruefen(g.roh, g.bezug.reihe, g.at, '2026-11-24') };
  }
  var x = await lauf(MH.nyZeit(D, 16, 14) + 50000), gp = await lauf(MH.nyZeit(D, 16, 15));
  zeile(x.ohne.length > 0 && x.frisch && x.sp.ok,
    'Ladevorgang ' + MH.nyUhr(x.start) + '-' + MH.nyUhr(x.at) + ' New York am 23.11.: Stand at ' + MH.nyUhr(x.at) + ', am Folgetag 09:40 frisch ' + jn(x.frisch) + '; ohne den Balken vom 23.11.: ' +
    x.ohne.length + ' Werte (' + x.ohne.join(', ') + '). Folgetag: stichtagPruefen ' + (x.sp.ok ? 'ok' : 'gesperrt') + ' (' + x.sp.mit + '/' + x.sp.gesamt + ', Stichtag ' + tagKurz(x.sp.stichtag) +
    ') - gerankt und bewertet wuerde mit ' + x.ohne.length + ' Werten auf dem Schluss vom ' + tagKurz(x.vorTag) + ' statt vom Stichtag. Gegenprobe Beginn ' + MH.nyUhr(gp.start) + ': ' +
    gp.ohne.length + ' Werte ohne den Balken, Stichtag ' + gp.sp.mit + '/' + gp.sp.gesamt + '.');
};

/* 34 - Sieben-Tage-Grenze von momentumZiel ueber den Herbstwechsel (Beleg p1). Dazu als Pruefung ohne erwarteten Fund: nyZeit
 *     an jedem Tag 2026-2027 zu fuenf Uhrzeiten gegen Intl (America/New_York). Die Grenze: Yahoo stempelt 09:30 New York, im
 *     Sommer 13:30 UTC, im Winter 14:30 UTC. Eine Reihe mit letzter Zeile Fr 30.10. (Sommer) ist am Stichtag Fr 06.11. (Winter)
 *     genau 7 Kalendertage alt, nach Stempeln aber 7 Tage und eine Stunde - die App wirft sie als veraltet hinaus.
 *     main: mfhandel.js:60/76 (maxAlter 7 x 86400000 gegen den Balkenstempel).
 *     Messung: rueckblick.js:42 (Zeitstempel des Tages = Mitternacht UTC), REGEL Teil C.2 ("7 Kalendertage" sind ganze Tage).
 *     Soll: die App rangiert die Reihe wie die Messung. Gegenprobe: dieselbe Lage ohne Zeitumstellung (Fr 23.10. -> Fr 30.10.). */
TESTS[34] = function () {
  var f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  var tageL = [], falsch = [], faelle = 0;
  for (var t = Date.UTC(2026, 0, 1); t < Date.UTC(2028, 0, 1); t += TAG) tageL.push(new Date(t).toISOString().slice(0, 10));
  tageL.forEach(function (tag) {
    [[0, 0], [9, 30], [9, 35], [16, 0], [16, 15]].forEach(function (hm) {
      var p = {}; faelle++;
      f.formatToParts(new Date(MH.nyZeit(tag, hm[0], hm[1]))).forEach(function (x) { p[x.type] = x.value; });
      if (p.year + '-' + p.month + '-' + p.day !== tag || Number(p.hour) % 24 !== hm[0] || Number(p.minute) !== hm[1]) falsch.push(tag + ' ' + hm.join(':'));
    });
  });
  function mitternacht(ms) { var d = new Date(ms); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()); }
  /** STARK (staerkster Wert, letzte Zeile letzteT) neben 120 frischen Werten bis stichT: App (Stempel) und Messung (Mitternacht). */
  function grenze(stichT, letzteT) {
    var r = { STARK: buchReihe(werktageUm(letzteT, 300), kursweg(300, 5)) }, tage = werktageUm(stichT, 300);
    for (var k = 0; k < 120; k++) r['W' + k] = buchReihe(tage, kursweg(tage.length, 0.01 * k));
    var rM = {};
    Object.keys(r).forEach(function (s) { rM[s] = r[s].map(function (b) { return [mitternacht(b[0]), b[1], b[2]]; }); });
    /* Angepasst (Runde 2, Nr. 108): "App" ist der Weg, den ausfuehrungVorbereiten (mfdepot.js) heute geht -
     * MH.zielAmStichtag; momentumZiel selbst bleibt als gemessene Funktion unveraendert. Fehlt zielAmStichtag (Stand
     * vor Nr. 108), ruft die App wie damals momentumZiel mit den Balkenstempeln. Soll unveraendert. */
    var app = MH.zielAmStichtag ? MH.zielAmStichtag(r, MH.nyTag(stichT)) : MH.momentumZiel(r, { nowMs: stichT });
    var mess = MH.momentumZiel(rM, { nowMs: mitternacht(stichT) });
    var v = app.verworfen.filter(function (x) { return x.sym === 'STARK'; })[0];
    return { app: app.ziel.indexOf('STARK') >= 0, grund: v ? v.grund : 'zulaessig', mess: mess.ziel.indexOf('STARK') >= 0, stunden: (stichT - letzteT) / 3600000 };
  }
  var x = grenze(MH.nyZeit('2026-11-06', 9, 30), MH.nyZeit('2026-10-30', 9, 30)), gp = grenze(MH.nyZeit('2026-10-30', 9, 30), MH.nyZeit('2026-10-23', 9, 30));
  zeile(falsch.length > 0 || x.app !== x.mess,
    'nyZeit 2026-2027: ' + faelle + ' Faelle, ' + falsch.length + ' falsch' + (falsch.length ? ' (' + falsch.slice(0, 3).join(', ') + ')' : '') +
    '. Reihe mit letzter Zeile genau 7 Kalendertage vor dem Stichtag, ueber den Herbstwechsel (Fr 30.10. -> Fr 06.11., ' + x.stunden + ' Stunden zwischen den Stempeln): App rangiert STARK ' +
    jn(x.app) + ' (' + x.grund + '); Messung (Mitternacht UTC) ' + jn(x.mess) + '. Gegenprobe ohne Zeitumstellung (Fr 23.10. -> Fr 30.10., ' + gp.stunden + ' Stunden): App ' + jn(gp.app) +
    ', Messung ' + jn(gp.mess) + '.');
};

/* ---------------- Ablauf ---------------- */
(async function () {
  var nur = process.argv[2] ? [Number(process.argv[2])] : Object.keys(TESTS).map(Number);
  for (var i = 0; i < nur.length; i++) {
    var nr = nur[i];
    if (!TESTS[nr]) { console.log('Test ' + nr + ' gibt es nicht (' + Object.keys(TESTS).join(', ') + ').'); process.exitCode = 2; continue; }
    process.stdout.write('[' + nr + '] ');
    try { await TESTS[nr](); } catch (e) { console.log('TEST DEFEKT: ' + (e && e.stack || e)); process.exitCode = 1; }
  }
})();
