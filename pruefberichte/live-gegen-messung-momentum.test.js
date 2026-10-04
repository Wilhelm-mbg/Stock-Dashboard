'use strict';
/* Pruefbericht "Live gegen Messung" - Momentum-Buch (Oktober 2026): die Kleinsttests.
 *
 * Gehoert zu pruefberichte/2026-10-live-gegen-messung-momentum.md. Jeder Test baut
 * Kunstdaten, ruft die Funktionen der App selbst und druckt GENAU EINE Zeile:
 *   "ZEIGT ABWEICHUNG: ..."  oder  "kein Unterschied: ...".
 * Reines Node, kein Netz, keine Schluessel, kein Electron. Die Fenster-Module
 * (mittelfrist.js, mfdepot.js, studienurteile.js) laufen in einer vm-Sandbox mit
 * Attrappen fuer Speicher und Kursabruf. Nicht in `npm test` eingehaengt.
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

var WURZEL = path.join(__dirname, '..');
var MH = require(path.join(WURZEL, 'mfhandel.js'));
var Ms = require(path.join(WURZEL, 'massstab.js'));
var KK = require(path.join(WURZEL, 'kurse.js'));
var TAG = 86400000;

/* ---------------- Hilfen ---------------- */

/** Stempel eines Tagesbalkens wie bei Yahoo: Eroeffnung 13:30 UTC des Tages von ms. */
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
/** Kursweg mit fester Staerke: Kurs(i-21) / Kurs(i-252) - 1 = staerke (mfhandel.js Z. 76/86). */
function kursweg(n, staerke) {
  var aus = [];
  for (var j = 0; j < n; j++) aus.push(100 * Math.pow(1 + staerke, (j - (n - 1 - 21)) / 231));
  return aus;
}
/** Reihe in der Form des Buchs: [[t, schluss, stueck]]. 3 Mio Stueck x ~100 $ = liquide. */
function buchReihe(tage, kurse, stueck) {
  return tage.map(function (t, j) { return [t, kurse[j], stueck == null ? 3e6 : stueck]; });
}
/** Antwort des Kurs-Laders wie Kurse.hole (kurse.js): {bars: [[t, c, v, h, l, o]]}. */
function ladeAntwort(reihe) {
  return { bars: reihe.map(function (b) { return [b[0], b[1], b[2], b[1], b[1], b[1]]; }), verworfen: 0, gesamt: reihe.length, feld: 'adjclose' };
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
/** Tagesdaten so ablegen, wie tagesdatenSchreiben (mittelfrist.js Z. 60-71) es tut. */
function tagesdatenAblegen(st, roh, at) {
  var syms = Object.keys(roh).sort(), teile = Math.max(1, Math.ceil(syms.length / 25));
  for (var t = 0; t < teile; t++) {
    var stueck = {};
    syms.slice(t * 25, (t + 1) * 25).forEach(function (s) { stueck[s] = roh[s]; });
    st.daten['mf_tagesdaten_teil_' + t] = { roh: stueck };
  }
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
/** Ein Fenster-Modul in einer Sandbox laden. sofortigeZeitgeber: setTimeout laeuft gleich
 *  (fuer die 90-ms-Pausen in ladeUniversum); sonst sind Zeitgeber stumm (mfdepot.js startet
 *  in bereit() einen Takt nach 12 s - der soll hier nicht von selbst laufen). */
function sandbox(dateien, win, sofortigeZeitgeber) {
  var doc = { readyState: 'complete', addEventListener: function () { }, getElementById: function () { return null; } };
  var ctx = {
    window: win, document: doc, console: console,
    setTimeout: sofortigeZeitgeber ? function (f) { setImmediate(f); return 0; } : function () { return 0; },
    setInterval: function () { return 0; }
  };
  win.document = doc;
  vm.createContext(ctx);
  dateien.forEach(function (d) { vm.runInContext(fs.readFileSync(path.join(WURZEL, d), 'utf8'), ctx, { filename: d }); });
  return win;
}
function mittelfristSandbox(st, hole) {
  return sandbox(['mittelfrist.js'], {
    U: U_ATTRAPPE, Momentum: require(path.join(WURZEL, 'momentum.js')), Liquide: require(path.join(WURZEL, 'liquide.js')),
    api: st.api, Kurse: { hole: hole }
  }, true);
}
function mfdepotSandbox(st, d, MF) {
  return sandbox(['mfdepot.js'], {
    U: U_ATTRAPPE, api: st.api, MF: MF, MFHandel: MH, Massstab: Ms,
    __D: function () { return d; }, __save: function () { return Promise.resolve({ ok: true }); }
  }, false);
}
function geld(x) { return Math.round(x).toLocaleString('de-DE') + ' $'; }
function pz(x) { return (x >= 0 ? '+' : '') + x.toFixed(2).replace('.', ',') + ' %'; }
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

/* ---------------- Die Tests ---------------- */
var TESTS = {};

/* 1 - Totalausfall beim Nachladen ueberschreibt den gespeicherten Bestand (Fund F1).
 *     Gegenprobe: derselbe Ablauf mit funktionierendem Abruf schichtet um. */
TESTS[1] = async function () {
  var jetzt = Date.now(), namen = universum();
  var tage = werktageBis(werktagVor(jetzt), 520);
  var alt = kunstUniversum(tage, namen);
  // Das Buch: 19 Positionen, gekauft vor 70 Handelstagen (Umschichtung damit faellig)
  var kaufIdx = tage.length - 71, kaufT = tage[kaufIdx] + 3600000;
  var positionen = namen.slice(0, 19).map(function (s) {
    return { sym: s, stueck: 50, einstand: alt[s][kaufIdx][1] * 1.002, seit: tage[kaufIdx] };
  });
  var letzteKurse = {}; namen.forEach(function (s) { letzteKurse[s] = alt[s][alt[s].length - 1][1]; });
  var wertLetzterSchluss = MH.bewerte({ cash: 0, positionen: positionen }, letzteKurse).wert;
  var wertEinstand = Math.round(positionen.reduce(function (a, p) { return a + p.stueck * p.einstand; }, 0) * 100) / 100;
  async function lauf(hole) {
    var st = speicher({ drift_markt: { at: jetzt - 3600000, reihe: tage.map(function (t, j) { return [t, 400 + j * 0.1]; }) } });
    tagesdatenAblegen(st, alt, jetzt - 27 * 3600000);            // aelter als 26 h -> Nachladen faellig
    var d = { momentumAn: true, mfBuch: buchMit(JSON.parse(JSON.stringify(positionen)), kaufT), mfVerlauf: [] };
    var vorher = symboleImBestand(st);
    var mf = mittelfristSandbox(st, hole);
    await mf.MF.ladeUniversum();
    var anstoesse = 0;
    var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { anstoesse++; return Promise.resolve(null); } });
    STATUS = [];
    await dep.MFDepot.takt();
    var fehler = STATUS.filter(function (s) { return /Fehler/.test(s); });
    if (fehler.length) throw new Error(fehler.join(' | '));
    return { vorher: vorher, nachher: symboleImBestand(st), teile: st.daten.mf_tagesdaten_index.teile, anstoesse: anstoesse,
      umgeschichtet: d.mfBuch.letztesRebalanceT !== kaufT, punkt: d.mfVerlauf[d.mfVerlauf.length - 1] };
  }
  // Rechner wacht aus dem Ruhezustand auf, das Netz ist noch nicht da: jeder Abruf scheitert
  var x = await lauf(async function () { return null; });
  var gp = await lauf(async function (sym) { return ladeAntwort(alt[sym]); });
  var abw = x.nachher < x.vorher && !x.umgeschichtet && Math.abs(x.punkt.momentum - wertEinstand) < 0.01 && x.anstoesse === 0 && gp.umgeschichtet;
  zeile(abw, 'Totalausfall beim Nachladen: Bestand ' + x.vorher + ' -> ' + x.nachher + ' Werte (Index ' + x.teile + ' Teil, Stand = jetzt). ' +
    'Folgetakt: Umschichtung faellig, ' + (x.umgeschichtet ? 'ausgefuehrt' : 'NICHT ausgefuehrt') + '; Tagespunkt ' + geld(x.punkt.momentum) +
    ' = Einstand, Messung (letzter Schluss) ' + geld(wertLetzterSchluss) + '; Nachladen angestossen: ' + x.anstoesse + 'x (Stand gilt 26 h als frisch). ' +
    'Gegenprobe mit funktionierendem Abruf: ' + (gp.umgeschichtet ? 'umgeschichtet' : 'NICHT umgeschichtet') + '.');
};

/* 2 - Halbe Antwort: 45 Werte ohne Daten (HTTP 200 leer / Drosselung) (Fund F1). */
TESTS[2] = async function () {
  var jetzt = Date.now(), namen = universum();
  var tage = werktageBis(werktagVor(jetzt), 520);
  var voll = kunstUniversum(tage, namen);
  var fehlen = namen.slice(-45);                                 // das Ende der Liste trifft eine Drosselung zuerst
  var fehlSet = {}; fehlen.forEach(function (s) { fehlSet[s] = true; });
  var kaufIdx = tage.length - 71;
  /* Gehalten: die drei schwaechsten der fehlenden Werte und 16 weitere schwache - bei vollen
   * Daten waere keiner davon im Ziel, alle wuerden verkauft. */
  var nachStaerke = namen.slice().sort(function (a, b) { return voll[a][250][1] / voll[a][0][1] - voll[b][250][1] / voll[b][0][1]; });
  var gehalten = nachStaerke.filter(function (s) { return fehlSet[s]; }).slice(0, 3)
    .concat(nachStaerke.filter(function (s) { return !fehlSet[s]; }).slice(0, 16));
  async function lauf(fehlend) {
    var st = speicher({ drift_markt: { at: jetzt - 3600000, reihe: tage.map(function (t, j) { return [t, 400 + j * 0.1]; }) } });
    tagesdatenAblegen(st, voll, jetzt - 27 * 3600000);
    var pos = gehalten.map(function (s) { return { sym: s, stueck: 50, einstand: voll[s][kaufIdx][1] * 1.002, seit: tage[kaufIdx] }; });
    var d = { momentumAn: true, mfBuch: buchMit(pos, tage[kaufIdx] + 3600000), mfVerlauf: [] };
    d.mfBuch.cash = 1000;
    var mf = mittelfristSandbox(st, async function (sym) { return fehlend[sym] ? null : ladeAntwort(voll[sym]); });
    await mf.MF.ladeUniversum();
    var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } });
    STATUS = [];
    await dep.MFDepot.takt();
    var fehler = STATUS.filter(function (s) { return /Fehler/.test(s); });
    if (fehler.length) throw new Error(fehler.join(' | '));
    var korb = d.mfBuch.korbVerlauf[d.mfBuch.korbVerlauf.length - 1] || {};
    return { bestand: symboleImBestand(st), ziel: korb.ziel, syms: d.mfBuch.positionen.map(function (p) { return p.sym; }) };
  }
  var a = await lauf({}), b = await lauf(fehlSet);
  var nurVoll = a.syms.filter(function (s) { return b.syms.indexOf(s) === -1; });
  var haengen = b.syms.filter(function (s) { return fehlSet[s] && gehalten.indexOf(s) !== -1; });
  zeile(nurVoll.length > 0 || haengen.length > 0,
    '45 von ' + namen.length + ' Werten ohne Daten: Bestand ' + b.bestand + ' statt ' + a.bestand + ' Werte; Ziel ' + b.ziel + ' statt ' + a.ziel +
    ' Werte, ' + nurVoll.length + ' Positionen der vollen Rechnung fehlen im Buch (' + nurVoll.slice(0, 5).join(', ') + (nurVoll.length > 5 ? ' ...' : '') +
    '); ' + haengen.length + ' alte Positionen ohne Kurs bleiben fuer eine ganze Periode liegen (' + haengen.join(', ') + ').');
};

/* 3 - Ein Wert verschwindet (Uebernahme, Delisting, Kuerzelwechsel) (Fund F2). */
TESTS[3] = function () {
  var buch = { cash: 0, positionen: [{ sym: 'WEG', stueck: 100, einstand: 100.2, seit: 0 }, { sym: 'A', stueck: 100, einstand: 100.2, seit: 0 }], trades: [] };
  var letzterSchluss = 130;                                      // letzter Kurs, bevor die Quelle nichts mehr liefert
  var budgets = [];
  for (var runde = 0; runde < 3; runde++) {
    var preise = { A: 110, B: 120 + runde, C: 90 + runde };      // WEG fehlt in den Tagesdaten
    var plan = MH.planeUmschichtung(runde === 0 ? ['B', 'C'] : ['C', 'B'], buch, preise);
    budgets.push(plan.depotwert);
    MH.fuehreAus(buch, plan, runde, 20);
  }
  var weg = buch.positionen.filter(function (p) { return p.sym === 'WEG'; })[0];
  var bw = MH.bewerte(buch, { B: 122, C: 92 });
  zeile(!!weg && bw.ohneKurs.indexOf('WEG') !== -1,
    'nach 3 Umschichtungen steht WEG noch im Buch (' + (weg ? weg.stueck : 0) + ' Stueck), bewertet zum Einstand ' + geld(weg.stueck * weg.einstand) +
    ', nie verkauft, nicht im Depotwert der Umschichtung (' + geld(budgets[2]) + '). Messung: am ersten Tag ohne Zeile ausgebucht zu ' +
    geld(100 * letzterSchluss) + ' (Uebernahme) bzw. 0 $ (Insolvenz/Zwangs-Delisting), Geld in der naechsten Umschichtung angelegt.');
};

/* 4 - Rangfolge auf dividendenbereinigten Kursen (App) gegen Kurse ohne Ausschuettungen (Messung) (Fund F3). */
TESTS[4] = function () {
  var tage = werktageBis(werktagVor(Date.UTC(2026, 9, 2)), 300), n = tage.length, i = n - 1;
  var roh = {}, adj = {};
  for (var k = 0; k < 120; k++) {
    var s = 'W' + (k < 10 ? '00' : k < 100 ? '0' : '') + k;
    roh[s] = buchReihe(tage, kursweg(n, 0.10 + 0.01 * k));
    adj[s] = roh[s];
  }
  /* W107: Kursstaerke 1,17, Platz 13 von 120 (das Ziel sind 12). Drei Quartalsausschuettungen
   * von je 1,5 % liegen im Rueckblickfenster, eine vierte danach. Yahoo-adjclose: jeder Kurs vor
   * einem Ex-Tag wird mit (1 - Satz) multipliziert (kurse.js Z. 74-75). */
  var exTage = [i - 200, i - 137, i - 74, i - 11];
  adj.W107 = roh.W107.map(function (b, j) {
    var f = 1;
    exTage.forEach(function (e) { if (e > j) f *= 0.985; });
    return [b[0], b[1] * f, b[2]];
  });
  var zielMessung = MH.momentumZiel(roh, { nowMs: tage[i] }).ziel;
  var zielApp = MH.momentumZiel(adj, { nowMs: tage[i] }).ziel;
  var rein = zielApp.filter(function (x) { return zielMessung.indexOf(x) === -1; });
  var raus = zielMessung.filter(function (x) { return zielApp.indexOf(x) === -1; });
  var st = function (r) { return (r[i - 21][1] / r[i - 252][1] - 1).toFixed(3).replace('.', ','); };
  zeile(rein.length > 0, 'Staerke W107 ohne Ausschuettungen ' + st(roh.W107) + ', dividendenbereinigt ' + st(adj.W107) +
    ' -> im Ziel der App: ' + (rein.join(', ') || '-') + ', dafuer raus: ' + (raus.join(', ') || '-') + ' (Ziel ' + zielApp.length + ' von 120).');
};

/* 5 - Wie alt duerfen die Kurse sein? Die 7-Tage-Pruefung misst am juengsten Balken DESSELBEN Bestands (Fund F4). */
TESTS[5] = function () {
  var jetzt = Date.now();
  var ende = werktagVor(jetzt - 30 * TAG);                       // alle Reihen enden vor 30 Tagen
  var tage = werktageBis(ende, 300), roh = {};
  for (var k = 0; k < 120; k++) roh['W' + k] = buchReihe(tage, kursweg(300, 0.1 + 0.01 * k));
  var juengster = tage[tage.length - 1];
  var wieTakt = MH.momentumZiel(roh, { nowMs: juengster });      // so ruft mfdepot.js Z. 153
  var gegenUhr = MH.momentumZiel(roh, { nowMs: jetzt });
  var plan = MH.planeUmschichtung(wieTakt.ziel, { cash: 100000, positionen: [] }, (function () { var p = {}; Object.keys(roh).forEach(function (s) { p[s] = roh[s][299][1]; }); return p; })());
  zeile(wieTakt.ziel.length > 0 && gegenUhr.ziel.length === 0,
    'Tagesdaten ' + Math.round((jetzt - juengster) / TAG) + ' Tage alt: mit nowMs = juengster Balken (wie der Takt) Ziel ' + wieTakt.ziel.length +
    ' Werte und ' + plan.kaufen.length + ' Kaeufe zu den alten Schlusskursen; gegen die Uhr gemessen waeren alle ' + gegenUhr.korb.geprueft +
    ' Reihen "veraltet" (' + gegenUhr.verworfen.length + ' verworfen).');
};

/* 6 - Welcher Kurs wird gehandelt? Schluss des Stichtags bzw. Zwischenstand statt Eroeffnung des Folgetags (Fund F4). */
TESTS[6] = function () {
  // (a) Fuellkurs: Stichtag schliesst bei 100, der Ausfuehrungstag eroeffnet bei 103.
  var appBuch = { cash: 100000, positionen: [] }, messBuch = { cash: 100000, positionen: [] };
  MH.fuehreAus(appBuch, MH.planeUmschichtung(['X'], appBuch, { X: 100 }), 0, 20);       // App: letzter Balken
  MH.fuehreAus(messBuch, MH.planeUmschichtung(['X'], messBuch, { X: 103 }), 0, 20);     // Messung: bEroeffnung
  // (b) Der Lader behaelt den Balken der laufenden Sitzung (Stempel 13:30 UTC, Kurs = jetzt).
  var heute = Date.UTC(2026, 9, 2, 13, 30), gestern = heute - TAG;
  var antwort = JSON.stringify({ chart: { result: [{ meta: {}, timestamp: [gestern / 1000, heute / 1000],
    indicators: { quote: [{ close: [100, 101.5], volume: [5e6, 1e6] }], adjclose: [{ adjclose: [100, 101.5] }] } }] } });
  var z = KK.zerlege(antwort, { bereinigt: true, von: 0, bis: Date.UTC(2026, 9, 2, 16, 0) });   // Abruf um 16:00 UTC
  var letzter = z.bars[z.bars.length - 1];
  zeile(appBuch.positionen[0].stueck !== messBuch.positionen[0].stueck && letzter[0] === heute,
    'Kauf zum Schluss des Stichtags (100 $ -> ' + appBuch.positionen[0].stueck + ' Stueck) statt zur Eroeffnung des Folgetags (103 $ -> ' +
    messBuch.positionen[0].stueck + ' Stueck, ' + pz((appBuch.positionen[0].stueck / messBuch.positionen[0].stueck - 1) * 100) +
    '); ein Abruf um 16:00 UTC liefert als letzten Balken den Zwischenstand der laufenden Sitzung (' + letzter[1] + ' $, ' +
    (letzter[2] / 1e6) + ' Mio Stueck bis dahin gegen ' + (z.bars[0][2] / 1e6) + ' Mio am Vortag).');
};

/* 7 - Buch und Markt im selben Verlaufspunkt kommen aus zwei verschieden alten Bestaenden (Fund F5).
 *     Gegenprobe: enden die Tagesdaten am selben Tag wie die SPY-Reihe, ist der Abstand 0. */
TESTS[7] = async function () {
  var jetzt = Date.now();
  var d1 = werktagVor(jetzt), d2 = werktagVor(d1);
  var spyTage = werktageBis(d1, 300);
  var spy = spyTage.map(function (t) { return [t, t === d1 ? 510 : 500]; });   // +2 % am juengsten Tag, sonst flach
  var d6 = spyTage[spyTage.length - 6];
  /* Das Buch haelt Stueck fuer Stueck den Markt (GLEICH = SPY / 5). */
  async function lauf(tageDaten) {
    var gleich = buchReihe(tageDaten, tageDaten.map(function (t) { return t === d1 ? 102 : 100; }));
    var st = speicher({ drift_markt: { at: jetzt - 3600000, reihe: spy } });
    tagesdatenAblegen(st, { GLEICH: gleich }, jetzt - 22 * 3600000);
    var buch = buchMit([{ sym: 'GLEICH', stueck: 1000, einstand: 100, seit: d6 - 30 * TAG }], jetzt - 3600000);
    buch.angelegt = d6 - 30 * TAG;
    var d = { momentumAn: true, mfBuch: buch, mfVerlauf: [{ t: d6 + 7.5 * 3600000, momentum: 100000, drift: null, spy: 500, startM: 100000, startD: null }] };
    var mf = mittelfristSandbox(st, async function () { return null; });
    var anstoesse = 0;
    var dep = mfdepotSandbox(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { anstoesse++; return Promise.resolve(null); } });
    STATUS = [];
    await dep.MFDepot.takt();
    var fehler = STATUS.filter(function (s) { return /Fehler/.test(s); });
    if (fehler.length) throw new Error(fehler.join(' | '));
    return { v: dep.MFDepot.vergleich('momentum'), anstoesse: anstoesse, punkte: d.mfVerlauf.length };
  }
  /* Tagesdaten vor 22 h geladen: sie enden einen Handelstag frueher als die SPY-Reihe. */
  var x = await lauf(spyTage.slice(0, -1));
  var gp = await lauf(spyTage);
  var v = x.v;
  var tag = function (t) { return new Date(t).toISOString().slice(0, 10); };
  zeile(v && v.ok && Math.abs(v.abstandPp) >= 1.9 && gp.v && gp.v.ok && gp.v.abstandPp === 0,
    'Buch = Markt Stueck fuer Stueck; neuer Tagespunkt: Buchwert aus Schluss ' + tag(d2) + ', Marktwert aus Schluss ' + tag(d1) +
    ' (marktAn) -> Anzeige Buch ' + pz(v.buchPct) + ' gegen S&P 500 ' + pz(v.marktPct) + ', Abstand ' + v.abstandPp.toFixed(1).replace('.', ',') +
    ' Pp statt 0 (Nachladen angestossen: ' + x.anstoesse + 'x, Tagesdaten 22 h alt gelten als frisch). Gegenprobe mit Tagesdaten bis ' + tag(d1) +
    ': Abstand ' + gp.v.abstandPp.toFixed(1).replace('.', ',') + ' Pp.');
};

/* 8 - Haltedauer: der Tag der naechsten Umschichtung haengt an der Tageszeit der letzten (Fund F6). */
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

/* 9 - Haltedauer: endet die SPY-Reihe (nicht aufgefrischt), wird nie umgeschichtet - still (Fund F6). */
TESTS[9] = function () {
  var tage = werktageBis(stempel(Date.UTC(2026, 11, 30)), 150), k = 20;
  var markt = tage.slice(0, k + 41).map(function (t) { return [t, 500]; });   // Reihe endet 40 Handelstage nach der Umschichtung
  var kalender = tage.length - 1 - k;
  var faellig = MH.rebalanceFaellig(markt, tage[k] + 3600000, 63);
  zeile(!faellig && kalender >= 63, kalender + ' Handelstage nach der letzten Umschichtung, SPY-Reihe aber nur 40 Tage weiter: rebalanceFaellig = ' + faellig +
    ' (Rueckgabe nur wahr/falsch, kein Grund, keine Altersangabe); die Messung haette am 63. Tag umgeschichtet.');
};

/* 10 - Texte: jede Zahl des Rueckblick-Eintrags gegen ERGEBNIS.md (kein Fund erwartet). */
TESTS[10] = function () {
  var win = sandbox(['studienurteile.js'], {}, false);
  var r = win.StudienUrteile.rueckblicke('momentum-liquide')[0], z = r.zahlen;
  var erg = fs.readFileSync(path.join(WURZEL, 'studien/massstab-rueckblick-2026-10-04/ERGEBNIS.md'), 'utf8');
  /* Das Register fuehrt eine Nachkommastelle, ERGEBNIS.md teils zwei (−40,16 %): gesucht wird
   * eine Prozentzahl mit gleichem Vorzeichen, die auf die Registerzahl rundet. */
  var prozente = (erg.match(/[+−]\d+,\d+ %/g) || []).map(function (s) { return (s[0] === '−' ? -1 : 1) * Number(s.slice(1, -2).replace(',', '.')); });
  function steht(x) { return prozente.some(function (p) { return Math.round(p * 10) / 10 === x; }); }
  var pruef = [
    ['Buch gesamt', steht(z.buchGesamt)],
    ['SPY gesamt', steht(z.spyGesamt)],
    ['nicht geschlagen', z.schlaegt === false && /den S&P 500 nach Kosten: \*\*nein\*\*/.test(erg)],
    ['Phasen', erg.indexOf(z.phasenVorn + ' von ' + z.phasen) !== -1],
    ['Rueckschlag Buch', steht(z.rueckschlagBuch)],
    ['Rueckschlag SPY', steht(z.rueckschlagSpy)],
    ['zulaessig', erg.indexOf(z.zulaessigMin + ' bis ' + z.zulaessigMax) !== -1],
    ['Fenster', erg.indexOf('16.09.2021 bis 15.09.2026') !== -1 && z.von === '2021-09-16' && z.bis === '2026-09-15']
  ];
  var rot = pruef.filter(function (p) { return !p[1]; }).map(function (p) { return p[0]; });
  zeile(rot.length > 0, rot.length ? 'Zahlen ohne Gegenstueck in ERGEBNIS.md: ' + rot.join(', ')
    : 'alle ' + pruef.length + ' Zahlen des Rueckblick-Eintrags (studienurteile.js) stehen so in ERGEBNIS.md; Kartentext: "' + win.StudienUrteile.rueckblickText(r) + '"');
};

/* 11 - Texte der Oberflaeche: Zahlen ohne Fundstelle in ERGEBNIS.md / belegstand.md (Fund F7). */
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

/* 12 - Mindestlaenge: der Lader verwirft Reihen bis 500 Balken, die Regel rankt ab 253 (Fund F8). */
TESTS[12] = async function () {
  var jetzt = Date.now(), namen = universum();
  var tage = werktageBis(werktagVor(jetzt), 520);
  var voll = kunstUniversum(tage, namen);
  var jung = 'ARM';
  voll[jung] = voll[jung].slice(-400);                           // 400 Handelstage Historie
  var st = speicher({});
  var mf = mittelfristSandbox(st, async function (sym) { return ladeAntwort(voll[sym]); });
  await mf.MF.ladeUniversum();
  var gelesen = await mf.MF.tagesdatenLesen();
  var r = MH.momentumZiel({ ARM: voll[jung] }, { nowMs: tage[tage.length - 1], minWerte: 1 });
  zeile(!gelesen.roh[jung] && r.rangfolge.length === 1,
    jung + ' mit 400 Balken: momentumZiel rankt die Reihe (Mindestlaenge 253), der Lader legt sie nicht ab (mittelfrist.js: nur > 500 Balken) - Bestand ' +
    Object.keys(gelesen.roh).length + ' von ' + namen.length + ' Werten, "weg": ' + gelesen.weg.join(', ') + '.');
};

/* 13 - Bargeld: kann es negativ werden? (kein Fund erwartet) */
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

/* 14 - Kosten je Seite: App und Messung rufen dieselbe Funktion mit 20 Bp (kein Fund erwartet). */
TESTS[14] = function () {
  var mfd = fs.readFileSync(path.join(WURZEL, 'mfdepot.js'), 'utf8');
  var rb = fs.readFileSync(path.join(WURZEL, 'studien/massstab-rueckblick-2026-10-04/rueckblick.js'), 'utf8');
  var app = /MH\.fuehreAus\(d\.mfBuch, plan, now, (\d+)\)/.exec(mfd), mess = /var KOSTEN_BP = (\d+);/.exec(rb);
  // Probe: 100 A zu 100 $ verkaufen, B zu 50 $ kaufen
  var buch = { cash: 0, positionen: [{ sym: 'A', stueck: 100, einstand: 50 }], trades: [] };
  MH.fuehreAus(buch, MH.planeUmschichtung(['B'], buch, { A: 100, B: 50 }), 0, 20);
  var b = buch.positionen[0], erloes = 100 * 100 * 0.998;
  var ok = app && mess && app[1] === mess[1] && Math.abs(b.einstand - 50 * 1.002) < 1e-9 && Math.abs(erloes - b.stueck * b.einstand - buch.cash) < 1e-6;
  zeile(!ok, 'App ' + (app && app[1]) + ' Bp (mfdepot.js), Messung ' + (mess && mess[1]) + ' Bp (rueckblick.js KOSTEN_BP), dieselbe Funktion fuehreAus. ' +
    'Probe: Verkauf 10.000 $ -> 9.980 $ gutgeschrieben, Kauf ' + String(b.stueck).replace('.', ',') + ' B zu ' + b.einstand.toFixed(2).replace('.', ',') +
    ' $ (50 $ + 0,2 %), Restgeld ' + buch.cash.toFixed(4).replace('.', ',') + ' $.');
};

/* 15 - Zwei Takte am selben Tag: keine doppelte Umschichtung (kein Fund erwartet). */
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
