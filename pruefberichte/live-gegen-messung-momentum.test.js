'use strict';
/* Pruefbericht "Live gegen Messung" - Momentum-Buch (Oktober 2026): die Kleinsttests.
 *
 * HERKUNFT: Zweig pruefung/live-gegen-messung (unabhaengige Durchsicht, Stand 450daed),
 * Datei pruefberichte/live-gegen-messung-momentum.test.js; Bericht ebenda,
 * pruefberichte/2026-10-live-gegen-messung-momentum.md. Uebernommen und angepasst mit
 * Auftrag Nr. 93 (04.10.2026, "das Momentum-Buch handelt wie gemessen"):
 *   - an den heutigen Code: holeTage liefert { reihe, ereignisse } und fragt bereinigt + mitRoh
 *     (die Attrappe des Kurs-Laders kann beides und ereignisseAb); fuehreAus hat ein fuenftes
 *     Argument ({ kleinstAnteil }); neue Felder (mf_bezug, letzteAusfuehrungTag, tag/buchT);
 *   - jeder Test prueft die GEMESSENE Regel (studien/massstab-rueckblick-2026-10-04/REGEL.md
 *     §1.2-§1.5, rueckblick.js) als Soll - keine Erwartung gelockert. Wo die Regel einen Zeitpunkt
 *     braucht (Eroeffnung, Stichtag), laeuft der Test auf einer festen Uhr (Dienstag 24.11.2026,
 *     New York) statt auf Date.now();
 *   - dieselbe Datei laeuft gegen jeden Stand: PRUEF_WURZEL=<Ordner> nimmt die Module von dort
 *     (so entstand der Lauf "vor dem Umbau" gegen 97f16d2).
 * Mit Auftrag Nr. 94 (04.10.2026) Test 10 neu gefasst: jede Zahl jeder Rueckblick-Zeile gegen die Datei, die ihr
 * Eintrag als Quelle nennt (Einzelheiten im Kopf von Test 10); Test 11 unveraendert (Kopf erklaert seine Abweichung).
 * Jeder Test druckt GENAU EINE Zeile: "ZEIGT ABWEICHUNG: ..." oder "kein Unterschied: ...".
 * Reines Node, kein Netz, keine Schluessel, kein Electron. Die Fenster-Module laufen in einer
 * vm-Sandbox mit Attrappen fuer Speicher, Kursabruf und Uhr. Nicht in `npm test` eingehaengt.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/live-gegen-messung-momentum.test.js        alle Tests
 *   node pruefberichte/live-gegen-messung-momentum.test.js 7      nur Test 7
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

/* ---------------- Die Tests ---------------- */
var TESTS = {};

/* 1 - Totalausfall beim Nachladen (Fund F1). Soll (Messung: vollstaendiges Panel, Bewertung zum letzten Schluss):
 *     der gespeicherte Bestand bleibt ganz stehen, der Tagespunkt steht zum letzten Schluss (nie zum Einstand), auf
 *     kaputten Daten wird nicht gehandelt, nachgeladen wird wieder. Gegenprobe: mit funktionierendem Abruf wird umgeschichtet. */
TESTS[1] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 17, 0);
  var tage = werktageBis(MO, 520), spy = spyAus(tage);
  var alt = kunstUniversum(tage, namen);
  // Das Buch: 19 Positionen, gekauft vor 70 Handelstagen (Umschichtung damit faellig)
  var kaufIdx = tage.length - 71, kaufT = tage[kaufIdx] + 3600000;
  var positionen = namen.slice(0, 19).map(function (s) {
    return { sym: s, stueck: 50, einstand: alt[s][kaufIdx][1] * 1.002, seit: tage[kaufIdx] };
  });
  var letzteKurse = {}; namen.forEach(function (s) { letzteKurse[s] = alt[s][alt[s].length - 1][1]; });
  var wertLetzterSchluss = MH.bewerte({ cash: 0, positionen: positionen }, letzteKurse).wert;
  var wertEinstand = Math.round(positionen.reduce(function (a, p) { return a + p.stueck * p.einstand; }, 0) * 100) / 100;
  var eroeff = {}; namen.concat(['SPY']).forEach(function (s) { eroeff[s] = 100; });
  async function lauf(hole) {
    var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
    var atAlt = nyUTC(2026, 11, 23, 10, 0);                        // Montag vor Boersenschluss geladen -> nachzuladen
    tagesdatenAblegen(st, alt, atAlt, spy);
    var d = { momentumAn: true, mfBuch: buchMit(JSON.parse(JSON.stringify(positionen)), kaufT), mfVerlauf: [] };
    var vorher = symboleImBestand(st);
    var mf = mittelfristSandbox(st, hole, jetzt);
    await mf.MF.ladeUniversum();
    var anstoesse = 0;
    var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { anstoesse++; return Promise.resolve(null); } }, jetzt, eroeff);
    await taktLauf(dep);
    return { vorher: vorher, nachher: symboleImBestand(st), atGleich: st.daten.mf_tagesdaten_index.at === atAlt, anstoesse: anstoesse,
      umgeschichtet: umgeschichtet(d), punkt: d.mfVerlauf[d.mfVerlauf.length - 1], positionenGleich: JSON.stringify(d.mfBuch.positionen) === JSON.stringify(positionen) };
  }
  // Rechner wacht aus dem Ruhezustand auf, das Netz ist noch nicht da: jeder Abruf scheitert
  var x = await lauf(async function () { return null; });
  var gp = await lauf(async function (sym, o) { return alt[sym] ? ladeAntwort(alt[sym], o) : (sym === 'SPY' ? ladeAntwort(spy, o) : null); });
  var punktOk = x.punkt && Math.abs(x.punkt.momentum - wertLetzterSchluss) < 0.01;
  var soll = x.nachher === x.vorher && x.atGleich && punktOk && !x.umgeschichtet && x.positionenGleich && x.anstoesse >= 1 && gp.umgeschichtet;
  zeile(!soll, 'Totalausfall beim Nachladen: Bestand ' + x.vorher + ' -> ' + x.nachher + ' Werte (Stand ' + (x.atGleich ? 'unveraendert' : 'neu') + '). ' +
    'Folgetakt: Umschichtung faellig, ' + (x.umgeschichtet ? 'ausgefuehrt' : 'nicht ausgefuehrt') + '; Tagespunkt ' + (x.punkt ? geld(x.punkt.momentum) : '-') +
    ' (Einstand ' + geld(wertEinstand) + ', Messung: letzter Schluss ' + geld(wertLetzterSchluss) + '); Nachladen angestossen: ' + x.anstoesse + 'x. ' +
    'Gegenprobe mit funktionierendem Abruf: ' + (gp.umgeschichtet ? 'umgeschichtet' : 'NICHT umgeschichtet') + '.');
};

/* 2 - Halbe Antwort: 45 Werte ohne Daten (HTTP 200 leer / Drosselung) (Fund F1). Soll: das Buch handelt dieselben
 *     Werte wie mit vollstaendiger Antwort, keine alte Position bleibt ohne Kurs liegen. */
TESTS[2] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 17, 0);
  var tage = werktageBis(MO, 520), spy = spyAus(tage);
  var voll = kunstUniversum(tage, namen);
  var fehlen = namen.slice(-45);                                 // das Ende der Liste trifft eine Drosselung zuerst
  var fehlSet = {}; fehlen.forEach(function (s) { fehlSet[s] = true; });
  var kaufIdx = tage.length - 71;
  /* Gehalten: die drei schwaechsten der fehlenden Werte und 16 weitere schwache - bei vollen
   * Daten waere keiner davon im Ziel, alle wuerden verkauft. */
  var nachStaerke = namen.slice().sort(function (a, b) { return voll[a][250][1] / voll[a][0][1] - voll[b][250][1] / voll[b][0][1]; });
  var gehalten = nachStaerke.filter(function (s) { return fehlSet[s]; }).slice(0, 3)
    .concat(nachStaerke.filter(function (s) { return !fehlSet[s]; }).slice(0, 16));
  var eroeff = {}; namen.concat(['SPY']).forEach(function (s) { eroeff[s] = 100; });
  async function lauf(fehlend) {
    var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
    tagesdatenAblegen(st, voll, nyUTC(2026, 11, 23, 16, 20), spy);          // Montag nach Boersenschluss geladen
    var pos = gehalten.map(function (s) { return { sym: s, stueck: 50, einstand: voll[s][kaufIdx][1] * 1.002, seit: tage[kaufIdx] }; });
    var d = { momentumAn: true, mfBuch: buchMit(pos, tage[kaufIdx] + 3600000), mfVerlauf: [] };
    d.mfBuch.cash = 1000;
    var mf = mittelfristSandbox(st, async function (sym, o) { return fehlend[sym] ? null : (voll[sym] ? ladeAntwort(voll[sym], o) : sym === 'SPY' ? ladeAntwort(spy, o) : null); }, jetzt);
    await mf.MF.ladeUniversum();
    var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, eroeff);
    await taktLauf(dep);
    var korb = d.mfBuch.korbVerlauf[d.mfBuch.korbVerlauf.length - 1] || {};
    return { bestand: symboleImBestand(st), ziel: korb.ziel, syms: d.mfBuch.positionen.map(function (p) { return p.sym; }) };
  }
  var a = await lauf({}), b = await lauf(fehlSet);
  var nurVoll = a.syms.filter(function (s) { return b.syms.indexOf(s) === -1; });
  var haengen = b.syms.filter(function (s) { return fehlSet[s] && gehalten.indexOf(s) !== -1; });
  zeile(nurVoll.length > 0 || haengen.length > 0 || !a.ziel,
    '45 von ' + namen.length + ' Werten ohne Daten: Bestand ' + b.bestand + ' statt ' + a.bestand + ' Werte; Ziel ' + b.ziel + ' statt ' + a.ziel +
    ' Werte, ' + nurVoll.length + ' Positionen der vollen Rechnung fehlen im Buch (' + nurVoll.slice(0, 5).join(', ') + (nurVoll.length > 5 ? ' ...' : '') +
    '); ' + haengen.length + ' alte Positionen ohne Kurs bleiben fuer eine ganze Periode liegen (' + haengen.join(', ') + ').');
};

/* 3 - Ein Wert verschwindet (Uebernahme, Delisting, Kuerzelwechsel) (Fund F2). Soll (REGEL §1.4): die Position wird
 *     ausgebucht - zum letzten Schluss ohne Verkaufskosten (bzw. 0 bei Insolvenz), das Geld ist Bargeld. Die alte Reihe
 *     steht im Bestand (die Quelle liefert nichts mehr; seit Nr. 93 behaelt der Lader sie), seit zehn Handelstagen ohne
 *     neuen Balken; die naechste regulaere Umschichtung ist noch nicht faellig. */
TESTS[3] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 17, 0);
  var tage = werktageBis(MO, 300), spy = spyAus(tage);
  var roh = kunstUniversum(tage, namen.slice(0, 120));
  roh.WEG = buchReihe(tage.slice(0, -10), tage.slice(0, -10).map(function () { return 130; }));
  var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
  tagesdatenAblegen(st, roh, nyUTC(2026, 11, 23, 16, 20), spy);
  var letzte = tage[tage.length - 11];                           // letzte Umschichtung vor zehn Handelstagen
  var d = { momentumAn: true, mfBuch: buchMit([{ sym: 'WEG', stueck: 100, einstand: 100.2, seit: letzte }, { sym: namen[0], stueck: 10, einstand: 100, seit: letzte }], letzte + 3600000), mfVerlauf: [] };
  var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, {});
  await taktLauf(dep);
  var weg = d.mfBuch.positionen.filter(function (p) { return p.sym === 'WEG'; })[0];
  var soll = !weg && Math.abs(d.mfBuch.cash - 100 * 130) < 1e-6 && !umgeschichtet(d);
  zeile(!soll, (weg ? 'WEG steht nach dem Takt noch im Buch (' + weg.stueck + ' Stueck, seit 10 Handelstagen ohne Kurs), nicht ausgebucht'
    : 'WEG ausgebucht') + '; Bargeld ' + geld(d.mfBuch.cash) + '. Messung: am ersten Tag ohne Zeile ausgebucht zu ' + geld(100 * 130) +
    ' ohne Verkaufskosten (bzw. 0 $ bei Insolvenz/Zwangs-Delisting), Geld in der naechsten Umschichtung angelegt (App seit Nr. 93: nach fuenf Handelstagen, gleicher Preis).');
};

/* 4 - Rangfolge: was der Lader in Spalte 1 ablegt, rangiert das Buch (Fund F3). Soll (Messung, bSchluss): Splits ja,
 *     Ausschuettungen nein. 193 Werte, das Ziel sind 19; der Wert auf Platz 20 hat drei Ausschuettungen zu je 1,5 % im Fenster. */
TESTS[4] = async function () {
  var namen = universum(), tage = werktageBis(MO, 520), n = tage.length, i = n - 1;   // mehr als 500 Balken: auch ein Lader mit der alten Laengenhuerde legt sie ab (F8 getrennt in Test 12)
  var roh = {}, rang = {};
  namen.forEach(function (s, k) { rang[s] = (k * 37) % namen.length; roh[s] = buchReihe(tage, kursweg(n, 0.10 + 0.01 * rang[s])); });
  var w20 = namen.filter(function (s) { return rang[s] === namen.length - 20; })[0];
  var exTage = [i - 200, i - 137, i - 74, i - 11];
  roh[w20] = roh[w20].map(function (b, j) { var f = 1; exTage.forEach(function (e) { if (e > j) f *= 0.985; }); return [b[0], b[1], b[2], b[1] * f]; });
  var st = speicher({});
  var mf = mittelfristSandbox(st, async function (sym, o) { return roh[sym] ? ladeAntwort(roh[sym], o) : sym === 'SPY' ? ladeAntwort(spyAus(tage), o) : null; }, nyUTC(2026, 11, 23, 16, 30));
  await mf.MF.ladeUniversum();
  var g = await mf.MF.tagesdatenLesen();
  var messRoh = {}; namen.forEach(function (s) { messRoh[s] = roh[s].map(function (b) { return [b[0], b[1], b[2]]; }); });
  var zielMessung = MH.momentumZiel(messRoh, { nowMs: tage[i] }).ziel;
  var zielApp = MH.momentumZiel(g.roh, { nowMs: tage[i] }).ziel;      // so rangiert das Buch: Spalte 1 des Bestands
  var rein = zielApp.filter(function (x) { return zielMessung.indexOf(x) === -1; });
  var raus = zielMessung.filter(function (x) { return zielApp.indexOf(x) === -1; });
  var stk = function (r) { return (r[i - 21][1] / r[i - 252][1] - 1).toFixed(3).replace('.', ','); };
  var adj = roh[w20].map(function (b) { return [b[0], b[3]]; });
  zeile(rein.length > 0 || raus.length > 0, 'Staerke ' + w20 + ' ohne Ausschuettungen ' + stk(roh[w20]) + ', dividendenbereinigt ' + stk(adj) +
    ' -> im Ziel der App, nicht in der Messung: ' + (rein.join(', ') || '-') + '; in der Messung, nicht in der App: ' + (raus.join(', ') || '-') +
    ' (Ziel ' + zielApp.length + ' von ' + namen.length + ').');
};

/* 5 - Wie alt duerfen die Kurse sein? (Fund F4). Soll (Messung: Kurs desselben Tages): mit Tagesdaten, die 30 Tage alt
 *     sind, wird nicht umgeschichtet; nachgeladen wird, und der Grund steht auf der Karte. */
TESTS[5] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 10, 0);
  var ende = werktagVor(jetzt - 30 * TAG);                       // alle Reihen enden vor 30 Tagen
  var tage = werktageBis(ende, 300), spy = spyAus(tage), roh = kunstUniversum(tage, namen);
  var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 31 * TAG) });
  tagesdatenAblegen(st, roh, jetzt - 31 * TAG, spy);
  var d = { momentumAn: true, mfBuch: buchMit([], tage[tage.length - 80]), mfVerlauf: [] };
  d.mfBuch.cash = 100000;
  var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
  var anstoesse = 0, eroeff = {}; namen.concat(['SPY']).forEach(function (s) { eroeff[s] = 100; });
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { anstoesse++; return Promise.resolve(null); } }, jetzt, eroeff);
  await taktLauf(dep);
  var karte = dep.__karte.innerHTML;
  var grund = /veraltet seit|nicht frisch/.test(karte);
  zeile(umgeschichtet(d) || anstoesse < 1 || !grund, 'Tagesdaten ' + Math.round((jetzt - tage[tage.length - 1]) / TAG) + ' Tage alt: ' +
    (umgeschichtet(d) ? 'umgeschichtet (' + d.mfBuch.positionen.length + ' Kaeufe zu den alten Schlusskursen)' : 'nicht umgeschichtet') +
    '; Nachladen angestossen: ' + anstoesse + 'x; Grund auf der Karte: ' + (grund ? 'ja' : 'nein') + '.');
};

/* 6 - Welcher Kurs wird gehandelt? (Fund F4). Soll (REGEL §1.3): Rangfolge auf den Schluessen des Stichtags, Kauf zur
 *     Eroeffnung des Ausfuehrungstags; ein laufender Balken kommt nicht in den Bestand. (a) Dienstag 10:00 New York,
 *     Stichtag Montag schliesst bei ~100, Dienstag eroeffnet 3 % hoeher. (b) der Lader um 12:00 New York. */
TESTS[6] = async function () {
  var namen = universum(), jetzt = nyUTC(2026, 11, 24, 10, 0);
  var tage = werktageBis(MO, 520), spy = spyAus(tage), roh = kunstUniversum(tage, namen);   // 520 Balken: siehe Test 4
  var st = speicher({ drift_markt: driftMarkt(spy, jetzt - 3600000) });
  tagesdatenAblegen(st, roh, nyUTC(2026, 11, 23, 16, 20), spy);
  var d = { momentumAn: true, mfBuch: buchMit([], tage[tage.length - 80]), mfVerlauf: [] };
  d.mfBuch.cash = 100000;
  var eroeff = { SPY: 450 }; namen.forEach(function (s) { eroeff[s] = roh[s][roh[s].length - 1][1] * 1.03; });
  var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
  var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, eroeff);
  await taktLauf(dep);
  var gekauft = d.mfBuch.positionen;
  var zurEroeffnung = gekauft.length > 0 && gekauft.every(function (p) { return Math.abs(p.einstand - eroeff[p.sym] * 1.002) < 1e-6; });
  var bsp = gekauft[0];
  // (b) der Lader waehrend der Sitzung: Yahoo liefert den laufenden Balken mit (Stempel 13:30 UTC, Kurs = jetzt)
  var st2 = speicher({}), lauf = {}; namen.forEach(function (s) { lauf[s] = roh[s].concat([[DI, 101.5, 1e6, 101.5]]); });
  var mf2 = mittelfristSandbox(st2, async function (sym, o) { return lauf[sym] ? ladeAntwort(lauf[sym], o) : sym === 'SPY' ? ladeAntwort(spy.concat([[DI, 450, 1e6, 450]]), o) : null; }, nyUTC(2026, 11, 24, 12, 0));
  await mf2.MF.ladeUniversum();
  var g2 = await mf2.MF.tagesdatenLesen();
  var r2 = g2 && g2.roh[namen[0]], letzter = r2 ? r2[r2.length - 1] : null;
  var laufendDrin = !!letzter && letzter[0] === DI;
  zeile(!zurEroeffnung || laufendDrin, (bsp ? 'Kauf ' + bsp.sym + ' zu ' + (bsp.einstand / 1.002).toFixed(2).replace('.', ',') + ' $ (Schluss des Stichtags ' +
    roh[bsp.sym][roh[bsp.sym].length - 1][1].toFixed(2).replace('.', ',') + ' $, Eroeffnung ' + eroeff[bsp.sym].toFixed(2).replace('.', ',') + ' $) - ' +
    (zurEroeffnung ? 'alle ' + gekauft.length + ' Kaeufe zur Eroeffnung' : 'nicht zur Eroeffnung') : 'kein Kauf') +
    '; ein Abruf um 12:00 New York legt als letzten Balken ' + (letzter ? tagDe(letzter[0]) + ' ' + String(letzter[1]).replace('.', ',') + ' $' : '-') +
    (laufendDrin ? ' ab (den Zwischenstand der laufenden Sitzung)' : ' ab (der laufende Balken bleibt draussen)') + '.');
};

/* 7 - Buch und Markt im selben Verlaufspunkt (Fund F5). Soll (rueckblick.js Schritt 5/6): beide zum Schluss desselben
 *     Tags. Ein Buch, das Stueck fuer Stueck den Markt haelt, liegt 0 Pp neben ihm. Die Tagesdaten enden am Freitag, die
 *     SPY-Reihe des Massstabs (drift_markt) am Montag mit +2 %. Gegenprobe: Tagesdaten bis Montag. */
TESTS[7] = async function () {
  var jetzt = nyUTC(2026, 11, 24, 6, 0);
  var d1 = MO, d2 = FR;
  var spyTage = werktageBis(d1, 300);
  var spyM = spyTage.map(function (t) { return [t, t === d1 ? 510 : 500]; });   // +2 % am juengsten Tag, sonst flach
  var d6 = spyTage[spyTage.length - 6];
  /* Das Buch haelt Stueck fuer Stueck den Markt (GLEICH = SPY / 5). */
  async function lauf(tageDaten, at) {
    var gleich = buchReihe(tageDaten, tageDaten.map(function (t) { return t === d1 ? 102 : 100; }));
    var spyB = tageDaten.map(function (t) { return [t, t === d1 ? 510 : 500, 8e7, t === d1 ? 510 : 500]; });
    var st = speicher({ drift_markt: { at: jetzt - 3600000, reihe: spyM } });
    tagesdatenAblegen(st, { GLEICH: gleich }, at, spyB);
    var buch = buchMit([{ sym: 'GLEICH', stueck: 1000, einstand: 100, seit: d6 - 30 * TAG }], d6);
    buch.angelegt = d6 - 30 * TAG;
    var d = { momentumAn: true, mfBuch: buch, mfVerlauf: [{ t: d6 + 7.5 * 3600000, momentum: 100000, drift: null, spy: 500, startM: 100000, startD: null }] };
    var mf = mittelfristSandbox(st, async function () { return null; }, jetzt);
    var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, {});
    await taktLauf(dep);
    return { v: dep.MFDepot.vergleich('momentum'), punkt: d.mfVerlauf[d.mfVerlauf.length - 1] };
  }
  var x = await lauf(spyTage.slice(0, -1), nyUTC(2026, 11, 20, 16, 30));
  var gp = await lauf(spyTage, nyUTC(2026, 11, 23, 16, 30));
  var v = x.v;
  zeile(!(v && v.ok && Math.abs(v.abstandPp) < 0.05 && gp.v && gp.v.ok && Math.abs(gp.v.abstandPp) < 0.05),
    'Buch = Markt Stueck fuer Stueck; Tagesdaten bis ' + tagDe(d2) + ', Massstab-Reihe bis ' + tagDe(d1) + ' -> neuer Tagespunkt ' +
    (x.punkt.tag ? 'fuer ' + x.punkt.tag + ' (spy ' + x.punkt.spy + ')' : 'ohne Handelstag (spy ' + x.punkt.spy + ')') + '; Anzeige Buch ' + pz(v.buchPct) +
    ' gegen S&P 500 ' + pz(v.marktPct) + ', Abstand ' + v.abstandPp.toFixed(1).replace('.', ',') + ' Pp (Soll 0). Gegenprobe mit Tagesdaten bis ' + tagDe(d1) +
    ': Abstand ' + gp.v.abstandPp.toFixed(1).replace('.', ',') + ' Pp.');
};

/* 8 - Haltedauer: der Tag der naechsten Umschichtung haengt nicht an der Tageszeit der letzten (Fund F6). Soll
 *     (rueckblick.js: naechste = Q.ptage[o + 63]): derselbe Handelstag, egal wann am Tag umgeschichtet wurde. */
TESTS[8] = function () {
  var tage = werktageBis(stempel(Date.UTC(2026, 11, 30)), 150), markt = tage.map(function (t) { return [t, 500]; });
  var k = 20;
  function faelligNach(letztesT) {
    for (var j = k; j < tage.length; j++) if (MH.rebalanceFaellig(markt.slice(0, j + 1), letztesT, 63)) return j - k;
    return null;
  }
  var morgens = faelligNach(tage[k] - 3.5 * 3600000);            // 10:00 UTC, vor der Eroeffnung
  var nachmittags = faelligNach(tage[k] + 1.5 * 3600000);        // 15:00 UTC, Sitzung laeuft
  zeile(morgens !== nachmittags, 'Umschichtung am selben Handelstag um 10:00 UTC -> naechste nach ' + morgens + ' Balken faellig, um 15:00 UTC -> nach ' +
    nachmittags + ' Balken; die Messung legt den naechsten Ausfuehrungstag immer 63 Panel-Tage spaeter.');
};

/* 9 - Haltedauer: endet die SPY-Reihe (nicht aufgefrischt), darf es kein stilles "nicht faellig" geben (Fund F6).
 *     Soll: die Faelligkeit nennt die veraltete Marktreihe als Grund (A6: mehr als drei Handelstage hinter der Uhr). */
TESTS[9] = function () {
  var tage = werktageBis(stempel(Date.UTC(2026, 11, 30)), 150), k = 20;
  var markt = tage.slice(0, k + 41).map(function (t) { return [t, 500]; });   // Reihe endet 40 Handelstage nach der Umschichtung
  var kalender = tage.length - 1 - k;
  var jetzt = Date.UTC(2026, 11, 31, 15, 0);
  var faellig = MH.rebalanceFaellig(markt, tage[k] + 3600000, 63);
  var f = typeof MH.faelligkeit === 'function' ? MH.faelligkeit(markt, new Date(tage[k]).toISOString().slice(0, 10), 63, jetzt) : null;
  var mitGrund = !!f && f.veraltet === true && f.faellig === null;
  zeile(!mitGrund, kalender + ' Handelstage nach der letzten Umschichtung, SPY-Reihe aber nur 40 Tage weiter: rebalanceFaellig = ' + faellig +
    (f ? '; faelligkeit: faellig = ' + f.faellig + ', veraltet = ' + f.veraltet + ' (Marktreihe seit ' + f.letzterMarktTag + ', ' + f.rueckstand + ' Werktage hinter der Uhr)'
      : ' (Rueckgabe nur wahr/falsch, kein Grund, keine Altersangabe)') + '; die Messung haette am 63. Tag umgeschichtet.');
};

/* 10 - Texte: jede Zahl jeder Rueckblick-Zeile gegen die Datei, die ihr Eintrag als Quelle nennt (kein Fund erwartet).
 *      Umgeschrieben mit Auftrag Nr. 94: die Fassung aus der Durchsicht suchte die Zahlen des ersten Eintrags in
 *      studien/massstab-rueckblick-2026-10-04/ERGEBNIS.md (Nr. 74). Seit Nr. 91 kommen die Zeilen aus anderen Quellen -
 *      die Momentum-Zeilen aus studien/momentum-korb-kleinst-2026-10-04/ergebnis.json (Fassung mit Regel K), die
 *      Drift-Zeile aus studien/vorregistrierung-2026-10-04-ergebnis-drift/ergebnis.json. Jetzt fuer JEDEN Eintrag
 *      (momentum-liquide und drift): die Datei aus seinem Feld quelle (Pfad vor dem ersten Komma - es muss sie geben),
 *      daneben ergebnis.json (die Zahlen, auf die ERGEBNIS.md verweist), Lauf ("Lauf B-187 mit Regel K") bzw. Stufe
 *      ("Stufe 2") aus demselben Feld. Jede Zahl auf eine Nachkommastelle wie in test-v6.js 97.8; das Fenster der
 *      Drift-Zeile und ihre 60 Handelstage stehen nur in der genannten ERGEBNIS.md. Danach muss jede Zahl der gezeigten
 *      Zeile (rueckblickText) einem geprueften Feld gehoeren, und jedes Feld von zahlen muss geprueft sein. Ausgenommen
 *      ist nur der Satz "Grenzen: ..." - ein fester Satz des PM, dessen Zahlen in keiner der Quellen stehen; er wird
 *      genannt, nicht geprueft. */
TESTS[10] = function () {
  var win = sandbox(['studienurteile.js'], {}, Date.now());
  var SU = win.StudienUrteile;
  function r1(x) { return Math.round(x * 10) / 10; }
  function pzDe(x) { return (x < 0 ? '−' : '+') + Math.abs(x).toFixed(1).replace('.', ',') + ' %'; }
  function ppDe(x) { return (x < 0 ? '−' : '+') + Math.abs(x).toFixed(1).replace('.', ',') + ' Pp'; }
  function tagD(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso || '')); return m ? m[3] + '.' + m[2] + '.' + m[1] : '?'; }
  var rot = [], nZahlen = 0, quellen = [], grenzen = [];
  var liste = SU.rueckblicke('momentum-liquide').concat(SU.rueckblicke('drift'));
  liste.forEach(function (e) {
    var z = e.zahlen || {}, name = e.lauf || e.kennung;
    var datei = String(e.quelle || '').split(',')[0].trim();
    if (!datei || !fs.existsSync(path.join(WURZEL, datei))) { rot.push(name + ': die Quelle "' + datei + '" gibt es nicht'); return; }
    var md = fs.readFileSync(path.join(WURZEL, datei), 'utf8'), json;
    try { json = JSON.parse(fs.readFileSync(path.join(WURZEL, path.dirname(datei), 'ergebnis.json'), 'utf8')); }
    catch (err) { rot.push(name + ': keine ergebnis.json neben ' + datei); return; }
    /* je Feld: [Feld, Wert im Register, Wert in der Quelle, Textstueck in der Zeile (oder null)] */
    var p = [['kennung', e.kennung, json.kennung, null]];
    if (e.art === 'zufall') {
      var mS = /Stufe (\d+)/.exec(e.quelle), s = mS && json['stufe' + mS[1]];
      if (!s) { rot.push(name + ': Stufe aus der Quelle fehlt in ergebnis.json'); return; }
      quellen.push(path.dirname(datei) + '/ergebnis.json Stufe ' + mS[1]);
      var fenster = md.indexOf(tagD(z.von) + ' bis ' + tagD(z.bis)) !== -1 && Math.abs(s.jahre - 5) < 0.01;
      var halten = /Verkäufe am (\d+)\. Handelstag/.exec(md);
      p.push(['von', z.von, fenster ? z.von : '(nicht in ' + datei + ')', tagD(z.von)], ['bis', z.bis, fenster ? z.bis : '(nicht in ' + datei + ')', tagD(z.bis)],
        ['plaetze', /\((\d+) Plätze/.exec(e.korb) && Number(/\((\d+) Plätze/.exec(e.korb)[1]), s.plaetzeMax, s.plaetzeMax + ' Plätze'],
        ['haltedauer', /, (\d+) Handelstage/.exec(e.korb) && Number(/, (\d+) Handelstage/.exec(e.korb)[1]), halten && Number(halten[1]), (halten && halten[1]) + ' Handelstage'],
        ['buchGesamt', z.buchGesamt, r1(s.buchGesamt), pzDe(z.buchGesamt)], ['spyGesamt', z.spyGesamt, r1(s.spyGesamt), pzDe(z.spyGesamt)],
        ['schlaegt', z.schlaegt, s.schlaegt, null], ['zufallUeber', z.zufallUeber, s.zufall.ueberDemBuch, null], ['zufallBuecher', z.zufallBuecher, s.zufall.buecher, null],
        ['zufall', z.zufallUeber + '/' + z.zufallBuecher, z.zufallUeber + '/' + z.zufallBuecher, z.zufallUeber + ' von ' + z.zufallBuecher + ' Zufallsbüchern'],
        ['vorwaertstest', z.vorwaertstest, s.vorwaertstestAngezeigt, null],
        ['rueckschlagBuch', z.rueckschlagBuch, r1(s.rueckschlagBuch), pzDe(z.rueckschlagBuch)], ['rueckschlagSpy', z.rueckschlagSpy, r1(s.rueckschlagSpy), pzDe(z.rueckschlagSpy)]);
    } else {
      var mL = /Lauf (\S+)/.exec(e.quelle), L = mL && json.laeufe && json.laeufe[mL[1]];
      var mitK = /mit Regel K/.test(e.quelle), m = L && (mitK ? L.mit : L.ohne);
      if (!m) { rot.push(name + ': Lauf aus der Quelle fehlt in ergebnis.json'); return; }
      quellen.push(path.dirname(datei) + '/ergebnis.json ' + mL[1] + (mitK ? ' mit' : ' ohne') + ' Regel K');
      var korbZ = /Korb der (\d+) /.exec(e.korb);
      p.push(['lauf', e.lauf, mL[1], null], ['regel', e.regel, mitK && json.regel.kleinstAnteil > 0 ? 'mit Regel K' : '(ohne Regel K)', null],
        ['von', z.von, L.fenster.von, tagD(z.von)], ['bis', z.bis, L.fenster.bis, tagD(z.bis)],
        ['korb', korbZ ? Number(korbZ[1]) : 'alle', L.korb === 'alle zulaessigen' ? 'alle' : L.korb, korbZ ? 'Korb der ' + korbZ[1] + ' ' : null],
        ['buchGesamt', z.buchGesamt, r1(m.k0.buchGesamt), pzDe(z.buchGesamt)], ['spyGesamt', z.spyGesamt, r1(m.k0.spyGesamt), pzDe(z.spyGesamt)],
        ['schlaegt', z.schlaegt, m.k0.schlaegt, null], ['phasenVorn', z.phasenVorn, m.startphasen.vorDemMarkt, null], ['phasen', z.phasen, m.startphasen.anzahl, null],
        ['phasenText', z.phasenVorn + '/' + z.phasen, z.phasenVorn + '/' + z.phasen, 'in ' + z.phasenVorn + ' von ' + z.phasen + ' Fällen'],
        ['medianAbstandPa', z.medianAbstandPa, r1(m.startphasen.median), ppDe(z.medianAbstandPa)],
        ['rueckschlagBuch', z.rueckschlagBuch, r1(m.k0.rueckschlagBuch), pzDe(z.rueckschlagBuch)], ['rueckschlagSpy', z.rueckschlagSpy, r1(m.k0.rueckschlagSpy), pzDe(z.rueckschlagSpy)]);
    }
    p.forEach(function (x) { if (x[1] !== x[2]) rot.push(name + '.' + x[0] + ' ' + x[1] + ' statt ' + x[2]); });
    var geprueft = p.map(function (x) { return x[0]; });
    Object.keys(z).forEach(function (k) { if (geprueft.indexOf(k) < 0) rot.push(name + '.' + k + ': Feld ohne Pruefung'); });
    /* jede Zahl der gezeigten Zeile gehoert einem geprueften Feld */
    var text = SU.rueckblickText(e), iG = text.indexOf(' Grenzen: ');
    if (iG !== -1) { grenzen.push(name + ': "' + text.slice(iG + 10) + '"'); text = text.slice(0, iG); }
    p.forEach(function (x) {
      if (x[3] == null) return;
      var i = text.indexOf(x[3]);
      if (i === -1) { rot.push(name + ': "' + x[3] + '" steht nicht in der Zeile'); return; }
      text = text.slice(0, i) + '#' + text.slice(i + x[3].length);
      nZahlen++;
    });
    var uebrig = text.split('S&P 500').join('S&P').match(/\d[\d.,]*/g);   // "S&P 500" ist ein Name, keine Zahl
    if (uebrig) rot.push(name + ': Zahl in der Zeile ohne Pruefung: ' + uebrig.join(', '));
  });
  zeile(rot.length > 0 || liste.length !== 4, rot.length ? 'Zahlen ohne Gegenstueck in der genannten Quelle: ' + rot.join(' | ')
    : 'alle ' + nZahlen + ' Zahlen der ' + liste.length + ' Rueckblick-Zeilen stehen so in der Datei, die ihr Eintrag als Quelle nennt (' +
      quellen.join('; ') + ', eine Nachkommastelle), keine weitere Zahl in den Zeilen, jedes Feld geprueft. Nicht geprueft (fester Satz des PM, ' +
      'keine Zahl in den Quellen): ' + grenzen.join('; '));
};

/* 11 - Texte der Oberflaeche: Zahlen ohne Fundstelle in ERGEBNIS.md / belegstand.md (Fund F7). Unveraendert uebernommen
 *      (nicht Teil von Nr. 93 und Nr. 94). Die Abweichung ist erwartet und bleibt: der Test findet die Zahlen, die
 *      absichtlich stehen geblieben sind - die alten Belege des Momentum-Buchs, gemessen nur an Werten, die es heute
 *      noch gibt, seit Nr. 91 an jeder Stelle unter dem Kopf "Überholt: …" (studienurteile.js belegeKopf). */
TESTS[11] = function () {
  var quellen = ['strategien.js', 'app-shell.js', 'index.html'].map(function (f) { return [f, fs.readFileSync(path.join(WURZEL, f), 'utf8')]; });
  var beleg = ['wiki/belegstand.md', 'studien/massstab-rueckblick-2026-10-04/ERGEBNIS.md', 'studien/momentum-korb-2026-10-04/ERGEBNIS.md']
    .map(function (f) { return fs.readFileSync(path.join(WURZEL, f), 'utf8'); }).join('\n');
  var zahlen = ['Rückschlag 52 %', '52 % größter Rückschlag', 'Rückschlag lag bei 52 Prozent', '8 von 22 Jahren', '14 von 22 Jahren',
    '+5,4 Pp', '+20,3 % p. a.', '−0,1 % gegen +7,4 %', '93 von 96'];
  var ohne = [];
  zahlen.forEach(function (zt) {
    var wo = quellen.filter(function (q) { return q[1].indexOf(zt) !== -1; }).map(function (q) { return q[0]; });
    if (wo.length && beleg.indexOf(zt) === -1) ohne.push('"' + zt + '" (' + wo.join(', ') + ')');
  });
  zeile(ohne.length > 0, 'Zahlen in der Oberflaeche ohne Gegenstueck in belegstand.md und den beiden ERGEBNIS.md: ' + ohne.join('; ') + '.');
};

/* 12 - Mindestlaenge: die Regel rankt ab 253 Balken - der Lader muss eine Reihe mit 400 Balken ablegen (Fund F8). */
TESTS[12] = async function () {
  var namen = universum();
  var tage = werktageBis(MO, 520);
  var voll = kunstUniversum(tage, namen);
  var jung = 'ARM';
  voll[jung] = voll[jung].slice(-400);                           // 400 Handelstage Historie
  var st = speicher({});
  var mf = mittelfristSandbox(st, async function (sym, o) { return voll[sym] ? ladeAntwort(voll[sym], o) : sym === 'SPY' ? ladeAntwort(spyAus(tage), o) : null; },
    nyUTC(2026, 11, 23, 16, 30));
  await mf.MF.ladeUniversum();
  var gelesen = await mf.MF.tagesdatenLesen();
  var r = MH.momentumZiel({ ARM: voll[jung] }, { nowMs: tage[tage.length - 1], minWerte: 1 });
  zeile(!gelesen.roh[jung] && r.rangfolge.length === 1,
    jung + ' mit 400 Balken: momentumZiel rankt die Reihe (Mindestlaenge 253), der Lader ' + (gelesen.roh[jung] ? 'legt sie ab' : 'legt sie nicht ab') +
    ' - Bestand ' + Object.keys(gelesen.roh).length + ' von ' + namen.length + ' Werten, "weg": ' + (gelesen.weg.join(', ') || '-') + '.');
};

/* 13 - Bargeld: kann es negativ werden? (kein Fund erwartet). Unveraendert uebernommen. */
TESTS[13] = function () {
  var seed = 7;
  function zufall() { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; }
  var negativ = 0, kleinstes = Infinity;
  for (var lauf = 0; lauf < 20000; lauf++) {
    var n = 1 + Math.floor(zufall() * 25), ziel = [], preise = {};
    for (var i = 0; i < n; i++) { ziel.push('S' + i); preise['S' + i] = 1 + zufall() * 900; }
    var buch = { cash: 1000 + zufall() * 200000, positionen: [], trades: [] };
    for (var j = 0; j < 3; j++) {
      preise['X' + j] = 5 + zufall() * 300;
      buch.positionen.push({ sym: 'X' + j, stueck: Math.round(zufall() * 500 * 1e4) / 1e4, einstand: preise['X' + j] });
    }
    MH.fuehreAus(buch, MH.planeUmschichtung(ziel, buch, preise), 0, 20);
    if (buch.cash < 0) negativ++;
    if (buch.cash < kleinstes) kleinstes = buch.cash;
  }
  zeile(negativ > 0, 'Bargeld nach fuehreAus in 20.000 Zufallsfaellen ' + (negativ ? negativ + 'x negativ' : 'nie negativ') +
    ' (kleinster Stand ' + kleinstes.toExponential(2) + ' $); Verkaeufe laufen vor Kaeufen, wie in der Messung (dieselbe Funktion).');
};

/* 14 - Kosten je Seite: App und Messung rufen dieselbe Funktion mit 20 Bp (kein Fund erwartet). Angepasst: der Aufruf
 *      in mfdepot.js traegt seit Nr. 87 ein fuenftes Argument ({ kleinstAnteil }) - gelesen wird weiter die Zahl. */
TESTS[14] = function () {
  var mfd = fs.readFileSync(path.join(WURZEL, 'mfdepot.js'), 'utf8');
  var rb = fs.readFileSync(path.join(WURZEL, 'studien/massstab-rueckblick-2026-10-04/rueckblick.js'), 'utf8');
  var app = /MH\.fuehreAus\(d\.mfBuch, plan, now, (\d+)(?:, \{[^}]*\})?\)/.exec(mfd), mess = /var KOSTEN_BP = (\d+);/.exec(rb);
  // Probe: 100 A zu 100 $ verkaufen, B zu 50 $ kaufen
  var buch = { cash: 0, positionen: [{ sym: 'A', stueck: 100, einstand: 50 }], trades: [] };
  MH.fuehreAus(buch, MH.planeUmschichtung(['B'], buch, { A: 100, B: 50 }), 0, 20);
  var b = buch.positionen[0], erloes = 100 * 100 * 0.998;
  var ok = app && mess && app[1] === mess[1] && Math.abs(b.einstand - 50 * 1.002) < 1e-9 && Math.abs(erloes - b.stueck * b.einstand - buch.cash) < 1e-6;
  zeile(!ok, 'App ' + (app && app[1]) + ' Bp (mfdepot.js), Messung ' + (mess && mess[1]) + ' Bp (rueckblick.js KOSTEN_BP), dieselbe Funktion fuehreAus. ' +
    'Probe: Verkauf 10.000 $ -> 9.980 $ gutgeschrieben, Kauf ' + String(b.stueck).replace('.', ',') + ' B zu ' + b.einstand.toFixed(2).replace('.', ',') +
    ' $ (50 $ + 0,2 %), Restgeld ' + buch.cash.toFixed(4).replace('.', ',') + ' $.');
};

/* 15 - Zwei Takte am selben Tag: keine doppelte Umschichtung (kein Fund erwartet). Unveraendert uebernommen. */
TESTS[15] = function () {
  var tage = werktageBis(stempel(Date.UTC(2026, 11, 30)), 150), markt = tage.map(function (t) { return [t, 500]; });
  var vorher = MH.rebalanceFaellig(markt, tage[10] + 3600000, 63);
  var direktDanach = MH.rebalanceFaellig(markt, tage[tage.length - 1] + 3600000, 63);
  var halbStundeSpaeter = MH.rebalanceFaellig(markt, tage[tage.length - 1] + 1800000, 63);
  zeile(!vorher || direktDanach || halbStundeSpaeter, 'faellig vor der Umschichtung: ' + vorher + '; nach letztesRebalanceT = jetzt sofort wieder faellig: ' +
    direktDanach + ' (auch 30 min spaeter: ' + halbStundeSpaeter + ') - der zweite Takt handelt nicht.');
};

/* ---------------- Ablauf ---------------- */
(async function () {
  var nur = process.argv[2] ? [Number(process.argv[2])] : Object.keys(TESTS).map(Number);
  for (var i = 0; i < nur.length; i++) {
    var nr = nur[i];
    if (!TESTS[nr]) { console.log('Test ' + nr + ' gibt es nicht (1 bis ' + Object.keys(TESTS).length + ').'); process.exitCode = 2; continue; }
    process.stdout.write('[' + nr + '] ');
    try { await TESTS[nr](); } catch (e) { console.log('TEST DEFEKT: ' + (e && e.stack || e)); process.exitCode = 1; }
  }
})();
