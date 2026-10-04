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
    ' Abrufe (der Bestand gilt bis zum naechsten Boersenschluss als frisch). tagesdatenSchreiben prueft die Rueckgabe von storeSet nicht.');
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
  zeile(!(v && v.ok && abLiquide.ok && Math.abs(v.abstandPp - abLiquide.abstandPp) < 0.05),
    'Karte/Kopf rechnen seit ' + tagDe(v.seit) + ' (Anlage des Buchs ' + tagDe(buch.angelegt) + '): Buch ' + pz(v.buchPct) + ' gegen S&P 500 ' + pz(v.marktPct) +
    ', Abstand ' + ppDe(v.abstandPp) + ' (Markt: ' + v.marktArt + '). Ab der ersten liquiden Umschichtung (' + tagDe(buch.liquideSeit) + ', Bezug Schluss des Stichtags), wie die Messung startet: Buch ' +
    pz(abLiquide.buchPct) + ' gegen ' + pz(abLiquide.marktPct) + ', Abstand ' + ppDe(abLiquide.abstandPp) + '. MFDepot.vergleich uebergibt angelegt, liquideSeit liest es nicht.');
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
TESTS[20] = function () {
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
  zeile(genuegt['0.01'] > 0, n + ' Monatsstichtage (' + M.signaltage[0].tag + ' bis ' + M.signaltage[M.signaltage.length - 1].tag + ', ' + nMin + ' bis ' + nMax +
    ' Werte der App-Liste): der Letzte im Ziel liegt im Median nur ' + med.toFixed(2).replace('.', ',') + ' Pp vor dem Ersten draussen. Ein Ausschuettungsvorsprung von 0,5 / 1 / 2 Pp ' +
    'im Rueckblickfenster reicht fuer einen Tausch an ' + genuegt['0.005'] + ' / ' + genuegt['0.01'] + ' / ' + genuegt['0.02'] + ' von ' + n + ' Stichtagen' +
    (anker ? ' (zum Vergleich: das Universum zahlt rund 1,7 % im Jahr, also ~1,6 Pp im 231-Tage-Fenster; das Momentum-Zehntel 0,83 %, ERGEBNIS-TEIL2.md)' : '') + '.');
};

/* 21 - ECHTE KENNZAHLEN: Was hat die alte 500-Balken-Huerde des Laders gekostet? (Fund F8, Groesse; auf main behoben)
 *      Junge Werte der App-Liste = erster Paneltag nach dem Panelbeginn 2016-01-04
 *      (studien/fundamental-machbarkeit-2026-09-16/panel.json). LIN und APTV sind ausgenommen: Kuerzelwechsel
 *      bzw. Fusion, die Yahoo-Reihe reicht dort weiter zurueck. Naeherung: der erste Stichtag mit Wert in
 *      momentum.json hat 253 Zeilen; die App rankt erst ab 501 Balken, rund 248 Handelstage = 12 Monatsstichtage spaeter. */
TESTS[21] = function () {
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
  zeile(namensMonate > 0, jung.length + ' junge Werte der App-Liste; ' + betroffen.length + ' davon standen in ihren ersten 12 Monaten mit Wert im staerksten Zehntel der App-Liste (Paneldaten, monatlich, ohne Umsatzfilter), das die App bis Nr. 93 nicht gerankt haette: ' +
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
