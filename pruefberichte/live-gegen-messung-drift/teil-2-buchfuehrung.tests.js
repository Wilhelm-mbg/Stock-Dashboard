'use strict';
/* Live gegen Messung - Ergebnis-Drift-Buch, Teil 2: BUCHFUEHRUNG. Die Kleinsttests.
 *
 * Soll ist die vorregistrierte Messung (studien/vorregistrierung-2026-10-04-ergebnis-drift: VORREGISTRIERUNG.md A4, A7,
 * Teil C 7-10; buch.js; konfig.js). Ist ist die App (mfhandel.js driftAbgleich, bewerteDrift, bucheMassnahmen,
 * reihenendeAusbuchen, stempleKursT; mfdepot.js takt/buchInit/tagespunkt; drift.js heute/reaktionstag).
 * Wo es geht, laufen DIESELBEN Kunstdaten durch buch.js (simuliere) und durch die App-Funktion.
 * Feste Uhr: jeder Zeitpunkt wird ueber MH.nyZeit (Zeitzone America/New_York, Intl) gebildet; kein Date.now, kein Netz.
 * Jeder Test druckt GENAU EINE Zeile ("ZEIGT ABWEICHUNG: ..." oder "kein Unterschied: ...").
 *
 * Vertrag: module.exports = function (Z) -> [{ nr, titel, lauf }]; Z.WURZEL = Repo-Wurzel, Z.zeile(abweichung, text).
 * Selbstlauf aus der Repo-Wurzel:  node pruefberichte/live-gegen-messung-drift/teil-2-buchfuehrung.tests.js [K3]
 * PRUEF_WURZEL=<Ordner> nimmt die Module von dort.
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var vm = require('vm');

module.exports = function (Z) {
  var W = Z.WURZEL;
  var MH = require(path.join(W, 'mfhandel.js'));
  var Dr = require(path.join(W, 'drift.js'));
  var ORD = path.join(W, 'studien', 'vorregistrierung-2026-10-04-ergebnis-drift');
  var BU = require(path.join(ORD, 'buch.js'));
  var KF = require(path.join(ORD, 'konfig.js'));
  var RB = require(path.join(W, 'studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js'));
  var zeile = Z.zeile;
  var ZEIT = require(path.join(W, 'studien', 'ergebnis-drift-ereignis-2026-10-04', 'zeit.js'));
  /** Uhrzeit New York zu einem Weltzeit-Text (Messung: zeit.js nyAusUtc) */
  function nyUhr(text) { return ZEIT.nyAusUtc(text).zeit.slice(0, 5); }
  var TAG = 86400000;

  /* ---------------- Kalender und Uhr (fest, ueber New York) ---------------- */
  /* NYSE-Feiertage im benutzten Zeitraum (Labor Day, Thanksgiving, Weihnachten, Neujahr, MLK, Presidents Day) */
  var FEIERTAGE = { '2026-09-07': 1, '2026-11-26': 1, '2026-12-25': 1, '2027-01-01': 1, '2027-01-18': 1, '2027-02-15': 1 };
  function tagPlus(tag, n) { return new Date(Date.parse(tag + 'T00:00:00Z') + n * TAG).toISOString().slice(0, 10); }
  function wochentag(tag) { return new Date(tag + 'T00:00:00Z').getUTCDay(); }
  /** n Handelstage ab von (einschliesslich), Wochenenden und - ausser mitFeiertagen - FEIERTAGE ausgelassen. */
  function handelstage(von, n, ohneFeiertage) {
    var aus = [], t = von;
    while (aus.length < n) { var w = wochentag(t); if (w !== 0 && w !== 6 && (ohneFeiertage || !FEIERTAGE[t])) aus.push(t); t = tagPlus(t, 1); }
    return aus;
  }
  /** Stempel eines Tagesbalkens wie bei Yahoo: die Eroeffnung 09:30 New York. */
  function balkenT(tag) { return MH.nyZeit(tag, 9, 30); }
  /** Ein Takt der App an einem Tag (Standard 17:00 New York, nach dem Schluss). */
  function taktT(tag, h, m) { return MH.nyZeit(tag, h == null ? 17 : h, m || 0); }
  function de(tag) { return tag.slice(8, 10) + '.' + tag.slice(5, 7) + '.' + tag.slice(0, 4); }
  function geld(x) {
    var s = Math.abs(x).toFixed(2).split('.');
    return (x < 0 ? '−' : '') + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + s[1] + ' $';
  }
  function zahl(x, st) { return x.toFixed(st == null ? 2 : st).replace('.', ','); }

  /* ---------------- Die Messung: Kunstpanel und Buch (wie studien/.../test.js Abschnitt 6) ---------------- */
  /* reihen: [{ name, ref, grund, kurse: { tag: [Eroeffnung, Schluss] } }]; Kalender = aufeinanderfolgende Tage ab 2024-01-01 */
  function kunstPanel(nTage, reihen) {
    var z = [], t, s;
    for (t = 0; t < nTage; t++) for (s = 0; s < reihen.length; s++) if (reihen[s].kurse[t]) z.push([s, t, reihen[s].kurse[t][0], reihen[s].kurse[t][1]]);
    var n = z.length, g = { n: n, tag: new Int32Array(n), sym: new Uint16Array(n), bEroeffnung: new Float64Array(n), bSchluss: new Float64Array(n), rohSchluss: new Float64Array(n) };
    var tagVon = new Int32Array(nTage).fill(-1), tagBis = new Int32Array(nTage).fill(-1), jeSym = reihen.map(function () { return []; });
    z.forEach(function (r, i) { g.sym[i] = r[0]; g.tag[i] = r[1]; g.bEroeffnung[i] = r[2]; g.bSchluss[i] = r[3]; g.rohSchluss[i] = r[3]; if (tagVon[r[1]] < 0) tagVon[r[1]] = i; tagBis[r[1]] = i + 1; jeSym[r[0]].push(i); });
    var symStart = [0], symZeilen = [];
    jeSym.forEach(function (l) { l.forEach(function (i) { symZeilen.push(i); }); symStart.push(symZeilen.length); });
    var tage = []; for (t = 0; t < nTage; t++) tage.push(new Date(Date.UTC(2024, 0, 1 + t)).toISOString().slice(0, 10));
    var symIdx = {}; reihen.forEach(function (r, i) { symIdx[r.name] = i; });
    return { g: g, nTage: nTage, maxTag: nTage - 1, nSym: reihen.length, kal: { tage: tage }, tagVon: tagVon, tagBis: tagBis, symStart: Int32Array.from(symStart), symZeilen: Int32Array.from(symZeilen),
      symName: reihen.map(function (r) { return r.name; }), symIdx: symIdx, endeGrund: reihen.map(function (r) { return r.grund || null; }),
      stand: { symbole: reihen.map(function (r) { return { reihe: r.name, ordner: r.name, referenz: !!r.ref }; }) },
      zeileVon: function (sym, tag) { for (var i = tagVon[tag] < 0 ? 0 : tagVon[tag]; tagVon[tag] >= 0 && i < tagBis[tag]; i++) if (g.sym[i] === sym) return i; return -1; },
      letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; } };
  }
  function kurse(n, f) { var o = {}; for (var t = 0; t < n; t++) { var k = f(t); if (k) o[t] = k; } return o; }
  /** Die Messung mit den festen Zahlen der Regel (40 Plaetze, 60 Tage, Kosten je Klasse, 0,5 Bp SPY), opt ueberschreibt. */
  function messung(T, meldungen, opt, saetze) {
    var Q = RB.vorbereiten(T), M = RB.Massnahmen(T, Q, function (name) { return (saetze || {})[name] || []; });
    var DIV = function (sym, d) { return RB.ausschuettungenAm(T, Q, M, sym, d); };
    var o = { startTag: 0, endTag: T.maxTag, start: KF.START, plaetze: KF.PLAETZE, halten: KF.HALTEN, kostenPp: KF.KOSTEN_UMLAUF_PP, spyBp: KF.SPY_KOSTEN_BP,
      totalverlust: { insolvenz: true, 'zwangs-delisting': true }, spy: T.symIdx.SPY, detail: true };
    Object.keys(opt || {}).forEach(function (k) { o[k] = opt[k]; });
    return { b: BU.simuliere(T, Q, DIV, meldungen, o), m: BU.massstab(T, Q, DIV, o) };
  }
  function meldung(T, name, E, zeit, wert, klasse, cik) {
    return { E: E, sym: T.symIdx[name], cik: cik === undefined ? 100 + T.symIdx[name] : cik, klasse: klasse === undefined ? 1 : klasse, zeit: zeit, wert: wert, name: name };
  }
  function kaeufe(b) { return b.handel.filter(function (h) { return h.art === 'kauf'; }); }

  /* ---------------- Die App: ein Drift-Buch und ein Signal wie Drift.heute() es liefert ---------------- */
  function appBuch(cash, positionen) { return { name: 'drift', start: 100000, cash: cash, positionen: positionen || [], trades: [] }; }
  function signal(sym, seitTagen, richtung, ueb) {
    return { sym: sym, richtung: richtung || 'kaufen', ueberraschung: ueb == null ? 5 : ueb, rang: 100, seitTagen: seitTagen || 0, nochTage: 60 - (seitTagen || 0) };
  }

  /* Eine Welt fuer Drift.heute(): tage (Handelstage), 45 Fuellwerte mit je einer Meldung (Vergleichsmenge),
   * dazu die Zielwerte. ziele: [{ sym, idx, utc: 'HH:MM', ueb, schluss(i) }]. Die Reihenfolge von ziele ist die
   * Reihenfolge der Schluessel im Bestand drift_termine (so liest mfdepot.js sie). */
  function driftWelt(tage, ziele, bis, spyKurs, ohneFuellsignal) {
    var n = bis == null ? tage.length : bis + 1, kursMap = {}, termine = {}, markt = [];
    for (var i = 0; i < n; i++) markt.push([balkenT(tage[i]), spyKurs ? spyKurs(i) : 400]);
    function reihe(f) { var r = []; for (var j = 0; j < n; j++) r.push([balkenT(tage[j]), f(j)]); return r; }
    ziele.forEach(function (z) {
      kursMap[z.sym] = reihe(z.schluss || function () { return 100; });
      termine[z.sym] = z.idx < n ? [[tage[z.idx] + 'T' + z.utc + ':00.000Z', 1, 1, z.ueb]] : [];
    });
    for (var k = 0; k < 45; k++) {
      var s = 'F' + (k < 10 ? '0' : '') + k, idx = tage.length - 100 + 2 * k;
      kursMap[s] = reihe(function () { return 100; });
      termine[s] = idx < n ? [[tage[idx] + 'T12:00:00.000Z', 1, 1, ohneFuellsignal ? null : 0.5 + 0.001 * ((k * 17) % 45)]] : [];
    }
    return { kursMap: kursMap, termine: termine, markt: markt };
  }
  function letzteSchluesse(kursMap) { var p = {}; Object.keys(kursMap).forEach(function (s) { var r = kursMap[s]; p[s] = r[r.length - 1][1]; }); return p; }

  /* ---------------- mfdepot.js in einer vm-Sandbox (nach pruefberichte/live-gegen-messung-momentum.test.js) ---------------- */
  function speicher(anfang) {
    var s = anfang || {};
    function kopie(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }
    return { daten: s, api: { storeGet: async function (n) { return kopie(s[n]); }, storeSet: async function (n, v) { s[n] = kopie(v); return { ok: true }; } } };
  }
  function uhr(jetzt) {
    var Uh = function (x) { return arguments.length ? new Date(x) : new Date(Uh.jetzt); };
    Uh.now = function () { return Uh.jetzt; }; Uh.jetzt = jetzt; Uh.UTC = Date.UTC; Uh.parse = Date.parse;
    return Uh;
  }
  var STATUS = [];
  var U_ATTRAPPE = {
    statuszeile: function (ziel, text) { STATUS.push(String(ziel) + ': ' + text); return null; },
    esc: String, d: String, dt: String, money: String, signTxt: String, pz1: String, nf2: { format: String }
  };
  function sandbox(dateien, win, jetzt) {
    var doc = { readyState: 'complete', addEventListener: function () { }, getElementById: function (id) { return (win.__el && win.__el[id]) || null; } };
    var ctx = { window: win, document: doc, console: console, __Uhr: uhr(jetzt),
      setTimeout: function (f, ms) { if (ms >= 1000) return 0; setImmediate(f); return 0; }, setInterval: function () { return 0; } };
    win.document = doc;
    vm.createContext(ctx);
    dateien.forEach(function (d) { vm.runInContext('(function (Date) {' + fs.readFileSync(path.join(W, d), 'utf8') + '\n})(__Uhr);', ctx, { filename: d }); });
    return win;
  }
  /** mfdepot.js mit Attrappen: der Tagesbestand kommt aus tagesdaten = { roh, at, bezug }. Der Speicher traegt
   *  drift_termine, drift_markt und mf_ereignisse. Kein Kursabruf (das Drift-Buch ruft keinen). */
  function mfdepotSandbox(st, d, tagesdaten, jetzt) {
    var Ms = require(path.join(W, 'massstab.js'));
    var KK = require(path.join(W, 'kurse.js'));
    return sandbox(['mfdepot.js'], {
      U: U_ATTRAPPE, api: st.api, MFHandel: MH, Drift: Dr, Massstab: Ms, __el: {},
      MF: { tagesdatenLesen: async function () { return JSON.parse(JSON.stringify(tagesdaten)); }, ladeUniversum: function () { return Promise.resolve(null); } },
      Kurse: { hole: async function () { return { bars: [] }; }, ereignisseAb: KK.ereignisseAb },
      __D: function () { return d; }, __save: function () { return Promise.resolve({ ok: true }); }
    }, jetzt);
  }
  async function taktLauf(dep) {
    STATUS = [];
    await dep.MFDepot.takt();
    var fehler = STATUS.filter(function (s) { return /Fehler/.test(s); });
    if (fehler.length) throw new Error(fehler.join(' | '));
  }
  /** Bestand fuer die Sandbox aus einer Drift-Welt: roh mit vier Spalten [t, schluss, stueck, adjclose], SPY als Bezug. */
  function bestand(welt, at) {
    var roh = {};
    Object.keys(welt.kursMap).forEach(function (s) { roh[s] = welt.kursMap[s].map(function (b) { return [b[0], b[1], 3e6, b[1]]; }); });
    var spy = welt.markt.map(function (b) { return [b[0], b[1], 8e7, b[1]]; });
    return { roh: roh, at: at, bezug: { reihe: spy } };
  }
  function speicherFuer(welt, at) {
    var tm = {}; Object.keys(welt.termine).forEach(function (s) { if (welt.termine[s].length) tm[s] = welt.termine[s]; });
    return speicher({ drift_termine: { at: at, sym: tm }, drift_markt: { at: at, reihe: welt.markt.map(function (b) { return [b[0], b[1]]; }) }, mf_ereignisse: { at: at, sym: {} } });
  }

  var TESTS = [];

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K1', titel: 'Platzzahl und Positionsgroesse: 40 Plaetze zu Buchwert/40 (Messung) gegen 5 % je Position ohne Platzgrenze (App)', lauf: async function () {
    var n = 40, syms = [], reihen = [{ name: 'SPY', ref: true, kurse: kurse(3, function () { return [100, 100]; }) }];
    for (var i = 0; i < n; i++) { syms.push('S' + (i < 10 ? '0' : '') + i); reihen.push({ name: syms[i], kurse: kurse(3, function () { return [20, 20]; }) }); }
    var T = kunstPanel(3, reihen);
    var R = messung(T, syms.map(function (s, j) { return meldung(T, s, 1, 100 + j, 5); }));
    var km = kaeufe(R.b), mVoll = km.filter(function (h) { return !h.teil; });
    var buch = appBuch(100000), preise = {}; syms.forEach(function (s) { preise[s] = 20; });
    MH.driftAbgleich(buch, { offen: syms.map(function (s) { return signal(s); }) }, preise, taktT('2026-10-05'), {});
    var ap = buch.positionen, groesse = ap.length ? ap[0].stueck * 20 : 0;
    var ab = ap.length !== km.length || Math.abs(groesse - mVoll[0].volumen) > 1;
    zeile(ab, '40 Kaufsignale an einem Tag, 100.000 $: Messung kauft ' + km.length + ' Positionen (je ' + geld(mVoll[0].volumen) + ' = Buchwert/40, ' +
      (km.length - mVoll.length) + ' davon mit dem Rest), App kauft ' + ap.length + ' (je ' + geld(groesse) + ' = 5 % des Buchwerts; die letzte ein Kleinstrest zu ' + geld(ap[ap.length - 1].stueck * 20) + '), ' +
      (40 - ap.length) + ' Signale verworfen ("Bargeld reicht nicht") - doppelte Positionsgroesse, halbe Streuung.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K2', titel: 'Kapital ausserhalb der Aktien: Start, Rest und Erloese in SPY (Messung) gegen Bargeld ohne Ertrag (App, buchInit)', lauf: async function () {
    var tage = handelstage('2026-01-05', 200, true);
    function spyK(i) { return i < 190 ? 400 : 400 + 4 * (i - 189); }                  // die letzten zehn Handelstage +10 %
    var d = { driftAn: true, momentumAn: false, mfVerlauf: [] };
    for (var lauf = 0; lauf < 2; lauf++) {
      var bis = lauf ? 199 : 189, welt = driftWelt(tage, [], bis, spyK, true), jetzt = taktT(tage[bis]);
      var st = speicherFuer(welt, jetzt - 3600000);
      await taktLauf(mfdepotSandbox(st, d, bestand(welt, jetzt - 3600000), jetzt));
    }
    var punkt = d.mfVerlauf[d.mfVerlauf.length - 1];
    var T = kunstPanel(11, [{ name: 'SPY', ref: true, kurse: kurse(11, function (t) { return [spyK(189 + t), spyK(189 + t)]; }) }]);
    var R = messung(T, []);
    var ab = !d.driftBuch || Math.abs(punkt.drift - R.b.endwert) > 1;
    zeile(ab, 'neues Drift-Buch (buchInit) ohne ein Signal, SPY in zehn Handelstagen +10 %: App ' + (d.driftBuch ? 'Bargeld ' + geld(d.driftBuch.cash) : 'kein Buch') +
      ', Tagespunkt ' + (punkt && punkt.drift != null ? geld(punkt.drift) : '-') + '; Messung (Start und Rest in SPY) ' + geld(R.b.endwert) + ' = Massstab ' + geld(R.m.endwert) +
      ' - jeder nicht in Aktien gebundene Dollar fehlt der App mit dem Marktertrag (Messung: 89,5 % in Aktien, Rest in SPY).');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K3', titel: 'Rangfolge bei mehr Signalen als Platz: frueheste Annahmezeit zuerst (Messung) gegen Schluesselfolge des Bestands (App)', lauf: async function () {
    var tage = handelstage('2026-02-02', 200, true), D = 199;
    var welt = driftWelt(tage, [{ sym: 'AAA', idx: D, utc: '13:00', ueb: 9 }, { sym: 'ZZZ', idx: D, utc: '11:00', ueb: 5 }]);
    var heute = Dr.heute(welt.kursMap, welt.termine, welt.markt);
    var reihenfolge = heute.offen.filter(function (o) { return o.seitTagen === 0; }).map(function (o) { return o.sym; });
    var preise = letzteSchluesse(welt.kursMap); preise.HELD = 100;
    var buch = appBuch(5000, [{ sym: 'HELD', stueck: 950, einstand: 100, richtung: 1, seit: taktT(tage[D - 9]) }]);
    MH.driftAbgleich(buch, heute, preise, taktT(tage[D]), {});
    var appKauf = buch.positionen.filter(function (p) { return p.sym !== 'HELD'; }).map(function (p) { return p.sym; });
    var T = kunstPanel(3, [{ name: 'SPY', ref: true, kurse: kurse(3, function () { return [400, 400]; }) }, { name: 'AAA', kurse: kurse(3, function () { return [100, 100]; }) },
      { name: 'ZZZ', kurse: kurse(3, function () { return [100, 100]; }) }]);
    var R = messung(T, [meldung(T, 'AAA', 1, 13 * 3600 - 5 * 3600, 9), meldung(T, 'ZZZ', 1, 11 * 3600 - 5 * 3600, 5)], { plaetze: 1 });
    var mKauf = kaeufe(R.b).map(function (h) { return h.name; });
    var ab = mKauf.join(',') !== appKauf.join(',');
    zeile(ab, 'zwei Meldungen vor Boersenbeginn am selben Tag (ZZZ ' + nyUhr(welt.termine.ZZZ[0][0]) + ' New York, Ueberraschung 5; AAA ' + nyUhr(welt.termine.AAA[0][0]) + ', Ueberraschung 9), Platz/Geld fuer genau eine: Messung kauft ' +
      mKauf.join(',') + ' (frueheste Annahmezeit), App kauft ' + (appKauf.join(',') || 'nichts') + ' (Reihenfolge in heute.offen: ' + reihenfolge.join(',') +
      ' = Schluesselfolge von drift_termine; sortiert wird nur nach nochTage, Uhrzeit und Ueberraschung zaehlen nicht).');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K4', titel: 'Einstiegskurs: Eroeffnung des Einstiegstags (Messung) gegen juengster Schluss zum Taktzeitpunkt (App)', lauf: async function () {
    var tage = handelstage('2026-02-02', 200, true), D = 199;
    var welt = driftWelt(tage, [{ sym: 'AAA', idx: D, utc: '12:00', ueb: 9, schluss: function (i) { return i < D ? 100 : 110; } }]);
    var heute = Dr.heute(welt.kursMap, welt.termine, welt.markt);
    var sig = heute.offen.filter(function (o) { return o.sym === 'AAA'; })[0];
    var buch = appBuch(100000);
    MH.driftAbgleich(buch, { offen: [sig] }, letzteSchluesse(welt.kursMap), taktT(tage[D]), { budgetAnteil: 0.025 });
    var p = buch.positionen[0];
    var T = kunstPanel(3, [{ name: 'SPY', ref: true, kurse: kurse(3, function () { return [400, 400]; }) },
      { name: 'AAA', kurse: kurse(3, function (t) { return t === 0 ? [100, 100] : [105, 110]; }) }]);
    var R = messung(T, [meldung(T, 'AAA', 1, 7 * 3600, 9)]);
    var mk = kaeufe(R.b)[0];
    var kursA = p ? buch.trades[0].kurs : NaN;
    var ab = !p || Math.abs(kursA - mk.kurs) > 1e-9;
    zeile(ab, 'Meldung ' + nyUhr(welt.termine.AAA[0][0]) + ' New York, Vortagesschluss 100, Eroeffnung 105, Schluss 110: Messung kauft zur Eroeffnung ' + zahl(mk.kurs) + ', App zum Schluss ' + zahl(kursA) +
      ' (Drift.heute nennt einstieg ' + zahl(sig.einstieg) + '; Einstand mit Kosten ' + zahl(p.einstand) + ') - fuer denselben Betrag ' + zahl(100 * (1 - mk.kurs / kursA), 1) +
      ' % weniger Stueck; die +' + zahl(100 * (kursA / mk.kurs - 1), 1) + ' % zwischen Eroeffnung und Schluss des Einstiegstags fehlen der App.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K5', titel: 'Einstiegstag bei einer Meldung waehrend der Handelszeit: naechste Eroeffnung (Messung) gegen Schluss desselben Tags (App)', lauf: async function () {
    var tage = handelstage('2026-06-01', 120), i = 100, tag = tage[i];
    var kal = { tage: tage, idx: {} }; tage.forEach(function (t, j) { kal.idx[t] = j; });
    var reihe = tage.map(function (t) { return [balkenT(t), 100]; }), dIdx = Dr.datumIndex(reihe);
    var faelle = [['vor', '12:00'], ['im', '15:00'], ['nach', '21:00']], teile = [], ab = false;
    faelle.forEach(function (f) {
      var text = tag + 'T' + f[1] + ':00.000Z';
      var e = ZEIT.einstiegstag(ZEIT.nyAusUtc(text), kal, 9.5 * 3600), r = Dr.reaktionstag(text, dIdx);
      if (f[0] === 'im' && r !== e) ab = true;
      teile.push(nyUhr(text) + ' New York: Messung Eroeffnung ' + de(tage[e]) + ', App Schluss ' + de(tage[r]));
    });
    zeile(ab, 'Einstieg je Meldezeit am ' + de(tag) + ' - ' + teile.join('; ') + '. Waehrend der Handelszeit kauft die App schon zum Schluss desselben Tags, ' +
      'die Messung erst zur naechsten Eroeffnung (die Nacht dazwischen ist in der App, nicht in der Messung); in den beiden anderen Faellen derselbe Tag, aber Schluss statt Eroeffnung (K4).');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K6', titel: 'Haltedauer: Eroeffnung des 60. Handelstags (Messung) gegen 60 x 365/252 Kalendertage ab dem Takt (App)', lauf: async function () {
    function beide(tage) {
      var T = kunstPanel(tage.length, [{ name: 'SPY', ref: true, kurse: kurse(tage.length, function () { return [100, 100]; }) }, { name: 'X', kurse: kurse(tage.length, function () { return [50, 50]; }) }]);
      var R = messung(T, [meldung(T, 'X', 0, 7 * 3600, 5)]);
      var mTag = R.b.handel.filter(function (h) { return h.art === 'verkauf'; })[0].tag;
      var buch = appBuch(0, [{ sym: 'X', stueck: 10, einstand: 50.05, richtung: 1, seit: taktT(tage[0]) }]), aTag = -1;
      for (var j = 1; j < tage.length && aTag < 0; j++) {
        MH.driftAbgleich(buch, { offen: [] }, { X: 50 }, taktT(tage[j]), {});
        if (!buch.positionen.length) aTag = j;
      }
      return { m: mTag, a: aTag };
    }
    var mit = handelstage('2026-10-05', 90), ohne = handelstage('2026-10-05', 90, true);
    var x = beide(mit), y = beide(ohne);
    zeile(x.m !== x.a || y.m !== y.a, 'Kauf am ' + de(mit[0]) + ', App taktet taeglich 17:00 New York: Messung verkauft zur Eroeffnung am ' + de(mit[x.m]) + ' (' + x.m + '. Handelstag), App zum Schluss am ' +
      de(mit[x.a]) + ' (' + x.a + '. Handelstag; Thanksgiving und Weihnachten dazwischen); derselbe Zeitraum ohne Feiertage: Messung ' + y.m + '., App ' + y.a +
      '. Handelstag (' + de(ohne[y.a]) + ') - die App haelt nach Kalenderuhr 86,9 Tage, nicht 60 Handelstage.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K7', titel: 'Kosten: halbe Umlaufkosten der Klasse je Seite plus 0,5 Bp SPY (Messung) gegen 10 Bp je Seite fuer alle (App)', lauf: async function () {
    var teile = [], ab = false;
    [[1, '50-250'], [2, '250-1000'], [3, 'ab1000']].forEach(function (k) {
      var T = kunstPanel(6, [{ name: 'SPY', ref: true, kurse: kurse(6, function () { return [100, 100]; }) }, { name: 'X', kurse: kurse(6, function () { return [50, 50]; }) }]);
      var R = messung(T, [meldung(T, 'X', 1, 7 * 3600, 5, k[0])], { halten: 3 });
      var vol = kaeufe(R.b)[0].volumen, mPp = (KF.START - R.b.endwert) / vol * 100;
      var buch = appBuch(100000), t0 = taktT('2026-10-05');
      MH.driftAbgleich(buch, { offen: [signal('X')] }, { X: 50 }, t0, { budgetAnteil: 0.025 });
      var aVol = buch.positionen[0].stueck * 50;
      MH.driftAbgleich(buch, { offen: [] }, { X: 50 }, t0 + 100 * TAG, {});
      var aPp = (100000 - buch.cash) / aVol * 100;
      if (Math.abs(aPp - mPp) > 0.005) ab = true;
      teile.push('Klasse ' + k[1] + ' Messung ' + zahl(mPp, 3) + ' Pp, App ' + zahl(aPp, 3) + ' Pp');
    });
    zeile(ab, 'Kosten je Umlauf bei flachem Kurs (Aktie und SPY-Handel zusammen, auf das Volumen): ' + teile.join('; ') +
      ' - die App kennt keine Klassen; ab1000 zahlt sie gut das Doppelte, 50-250 etwas weniger als die Messung.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K8', titel: 'Nur Kauf (Messung) gegen Leerverkauf des untersten Fuenftels (App)', lauf: async function () {
    var tage = handelstage('2026-02-02', 200, true), D = 199;
    var welt = driftWelt(tage, [{ sym: 'LOW', idx: D, utc: '12:00', ueb: -9 }]);
    var heute = Dr.heute(welt.kursMap, welt.termine, welt.markt);
    var sig = heute.offen.filter(function (o) { return o.sym === 'LOW'; })[0];
    var buch = appBuch(100000), t0 = taktT(tage[D]);
    MH.driftAbgleich(buch, heute, letzteSchluesse(welt.kursMap), t0, {});
    var p = buch.positionen.filter(function (q) { return q.sym === 'LOW'; })[0];
    var vorher = MH.bewerteDrift(buch, { LOW: 100 }).wert, nachher = MH.bewerteDrift(buch, { LOW: 120 }).wert;
    var div = p ? MH.bucheMassnahmen(buch, { LOW: { div: [[t0 + 5 * TAG, 1]], split: [] } }, { LOW: t0 + 6 * TAG }, t0 + 6 * TAG) : null;
    var dSumme = div && div.buchungen.length ? div.buchungen[0].summe : 0;
    /* Die Messung bekommt nur das oberste Zehntel (A7, buch.js:48): eine Meldung des untersten Rands ist kein Handel. */
    var T = kunstPanel(3, [{ name: 'SPY', ref: true, kurse: kurse(3, function () { return [400, 400]; }) }, { name: 'LOW', kurse: kurse(3, function () { return [100, 100]; }) }]);
    var R = messung(T, []);
    zeile(!!p, 'Meldung mit Ueberraschung -9 (unterstes Fuenftel): Drift.heute meldet "' + (sig ? sig.richtung : '-') + '", App eroeffnet ' +
      (p ? 'einen Leerverkauf ueber ' + geld(p.stueck * 100) + ' (Bargeld ' + geld(100000) + ' -> ' + geld(buch.cash - dSumme) + ')' : 'nichts') +
      '; steigt der Kurs um 20 %, faellt das Buch von ' + geld(vorher) + ' auf ' + geld(nachher) + ', eine Ausschuettung von 1 $ je Stueck belastet es mit ' + geld(-dSumme) +
      '. Messung: kein Handel (' + kaeufe(R.b).length + ' Kaeufe), Buch = Massstab.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K9', titel: 'Reihenende: erster Handelstag danach, Insolvenz = 0 (Messung) gegen fuenf Balken spaeter, immer letzter Schluss (App)', lauf: async function () {
    var tage = handelstage('2026-03-02', 12, true), n = tage.length;
    function panel(grund) {
      return kunstPanel(n, [{ name: 'SPY', ref: true, kurse: kurse(n, function () { return [100, 100]; }) },
        { name: 'X', grund: grund, kurse: kurse(n, function (t) { return t <= 3 ? [10, t === 3 ? 2 : 10] : null; }) }]);
    }
    var T = panel('insolvenz'), R = messung(T, [meldung(T, 'X', 1, 7 * 3600, 5)]);
    var mEnde = R.b.handel.filter(function (h) { return h.art === 'totalverlust' || h.art === 'reihenende'; })[0];
    var stueck = kaeufe(R.b)[0].stueck;
    var roh = { X: [0, 1, 2, 3].map(function (j) { return [balkenT(tage[j]), j === 3 ? 2 : 10]; }) };
    var buch = appBuch(0, [{ sym: 'X', stueck: stueck, einstand: 10.01, richtung: 1, seit: taktT(tage[1]) }]), aTag = -1, gut = 0;
    for (var j = 4; j < n && aTag < 0; j++) {
      var spy = tage.slice(0, j + 1).map(function (t) { return [balkenT(t), 100]; });
      var aus = MH.reihenendeAusbuchen(buch, roh, spy, taktT(tage[j]));
      if (aus.length) { aTag = j; gut = aus[0].gutschrift; }
    }
    zeile(aTag !== mEnde.tag || Math.abs(gut - mEnde.volumen) > 0.01, 'Reihe endet am ' + de(tage[3]) + ' mit Schluss 2,00 (Insolvenz), ' + zahl(stueck, 1) + ' Stueck: Messung bucht am ' +
      de(tage[mEnde.tag]) + ' (erster Handelstag danach) ' + geld(mEnde.volumen) + ' (Totalverlust); App bucht am ' + (aTag >= 0 ? de(tage[aTag]) : 'nie') + ' (' + (aTag - 3) +
      '. Balken danach) ' + geld(gut) + ' (letzter Schluss, den Grund kennt sie nicht) - ' + geld(gut - mEnde.volumen) + ' zu viel, und fuenf Tage lang belegt die Position Geld/Platz.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K10', titel: 'Leerverkauf ohne Kosten: Einstand mit Kosten geht in 2 x Einstand - Kurs ein und hebt die Kosten auf (App)', lauf: async function () {
    var buch = appBuch(100000), t0 = taktT('2026-10-05');
    MH.driftAbgleich(buch, { offen: [signal('X', 0, 'verkaufen')] }, { X: 100 }, t0, {});
    var vol = buch.positionen[0].stueck * 100, gleichNach = MH.bewerteDrift(buch, { X: 100 }).wert;
    MH.driftAbgleich(buch, { offen: [] }, { X: 100 }, t0 + 100 * TAG, {});
    var kostenS = 100000 - buch.cash;
    var kauf = appBuch(100000);
    MH.driftAbgleich(kauf, { offen: [signal('X')] }, { X: 100 }, t0, {});
    MH.driftAbgleich(kauf, { offen: [] }, { X: 100 }, t0 + 100 * TAG, {});
    var kostenL = 100000 - kauf.cash;
    zeile(kostenS < kostenL / 2, 'Umlauf bei flachem Kurs 100 ueber ' + geld(vol) + ': Kauf kostet ' + geld(kostenL) + ' (2 x 10 Bp), Leerverkauf ' + geld(kostenS) +
      ' - gleich nach dem Leerverkauf steht das Buch bei ' + geld(gleichNach) + ', also ueber dem Start: die Kosten des Einstands erscheinen als Gewinn. Die Messung kennt keinen Leerverkauf (K8).');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K11', titel: 'Verpasste Takte: drei Handelstage ohne laufende App (mfdepot.js takt in der Sandbox)', lauf: async function () {
    var tage = handelstage('2026-02-02', 200, true), D = 195, B = D + 3;
    var aaa = function (i) { return i < D ? 100 : 110 + 2 * (i - D); };          // Eroeffnung am Tag D: 105
    var old = function (i) { return i < D ? 50 : [50, 48, 46, 45][i - D]; };      // Eroeffnung am Tag D: 50
    var welt = driftWelt(tage, [{ sym: 'AAA', idx: D, utc: '12:00', ueb: 9, schluss: aaa }, { sym: 'OLD', idx: 999, utc: '12:00', ueb: 0, schluss: old }], B);
    var jetzt = taktT(tage[B]), st = speicherFuer(welt, jetzt - 3600000);
    var d = { driftAn: true, momentumAn: false, mfVerlauf: [],
      driftBuch: { name: 'drift', start: 100000, cash: 50000, positionen: [{ sym: 'OLD', stueck: 1000, einstand: 50.05, richtung: 1, seit: taktT(tage[D - 60]), kursT: balkenT(tage[D - 60]) }], trades: [] } };
    await taktLauf(mfdepotSandbox(st, d, bestand(welt, jetzt - 3600000), jetzt));
    var tr = d.driftBuch.trades, kA = tr.filter(function (t) { return t.sym === 'AAA' && t.art === 'kauf'; })[0], vO = tr.filter(function (t) { return t.sym === 'OLD' && t.art === 'verkauf'; })[0];
    /* Messung mit denselben Kursen: Tag 0 = D-60 ... Tag 63 = D+3 */
    var n = 64, o0 = D - 60;
    var T = kunstPanel(n, [{ name: 'SPY', ref: true, kurse: kurse(n, function () { return [400, 400]; }) },
      { name: 'OLD', kurse: kurse(n, function (t) { return [t === 60 ? 50 : old(o0 + t), old(o0 + t)]; }) },
      { name: 'AAA', kurse: kurse(n, function (t) { return [o0 + t === D ? 105 : aaa(o0 + t), aaa(o0 + t)]; }) }]);
    var R = messung(T, [meldung(T, 'OLD', 0, 7 * 3600, 5), meldung(T, 'AAA', 60, 7 * 3600, 9)]);
    var mK = R.b.handel.filter(function (h) { return h.name === 'AAA' && h.art === 'kauf'; })[0], mV = R.b.handel.filter(function (h) { return h.name === 'OLD' && h.art === 'verkauf'; })[0];
    var ab = !kA || !vO || kA.kurs !== mK.kurs || vO.kurs !== mV.kurs;
    zeile(ab, 'App laeuft vom ' + de(tage[D - 1]) + ' abends bis ' + de(tage[B]) + ' 17:00 nicht: AAA (Meldung ' + de(tage[D]) + ' vor Boersenbeginn) Messung Kauf ' + de(tage[o0 + mK.tag]) +
      ' zu ' + zahl(mK.kurs) + ', App ' + (kA ? de(tage[B]) + ' zu ' + zahl(kA.kurs) + ' (Signal ' + (B - D) + ' Handelstage alt, Grenze 5)' : 'kein Kauf') + '; OLD (60. Handelstag am ' + de(tage[D]) +
      ') Messung Verkauf zu ' + zahl(mV.kurs) + ', App ' + (vO ? de(tage[B]) + ' zu ' + zahl(vO.kurs) : 'kein Verkauf') + ' - nachgeholt wird zum Kurs des Takts, nicht zum Kurs des faelligen Tags' +
      (vO ? ' (' + geld((vO.kurs - mV.kurs) * 1000) + ' auf 1.000 Stueck OLD)' : '') + '.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K12', titel: 'Pause laenger als fuenf Handelstage: die Messung hat gekauft, die App verwirft das Signal', lauf: async function () {
    var tage = handelstage('2026-02-02', 200, true), D = 190, B = D + 7;
    var welt = driftWelt(tage, [{ sym: 'AAA', idx: D, utc: '12:00', ueb: 9 }], B);
    var heute = Dr.heute(welt.kursMap, welt.termine, welt.markt);
    var buch = appBuch(100000), g = MH.driftAbgleich(buch, heute, letzteSchluesse(welt.kursMap), taktT(tage[B]), {});
    var v = g.verworfen.filter(function (x) { return x.sym === 'AAA'; })[0];
    var T = kunstPanel(3, [{ name: 'SPY', ref: true, kurse: kurse(3, function () { return [400, 400]; }) }, { name: 'AAA', kurse: kurse(3, function () { return [100, 100]; }) }]);
    var R = messung(T, [meldung(T, 'AAA', 1, 7 * 3600, 9)]);
    var aKauf = buch.positionen.some(function (p) { return p.sym === 'AAA'; });
    zeile(kaeufe(R.b).length !== (aKauf ? 1 : 0), 'erster Takt nach der Meldung vom ' + de(tage[D]) + ' erst am ' + de(tage[B]) + ': Messung kauft am Einstiegstag (' + kaeufe(R.b).length +
      ' Kauf), App ' + (aKauf ? 'kauft' : 'kauft nicht') + (v ? ' - "' + v.grund + '"' : '') + '; die Position fehlt fuer die ganzen 60 Tage.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K13', titel: 'Verfallene Meldung (kein Platz/kein Geld am Einstiegstag) wird in der App Tage spaeter nachgekauft', lauf: async function () {
    var tage = handelstage('2026-03-02', 70, true);
    var D = 58; while (wochentag(tage[D]) !== 1) D++;                               // ein Montag: D+2 ist Mittwoch
    var buch = appBuch(0, [{ sym: 'HELD', stueck: 1000, einstand: 100, richtung: 1, seit: taktT(tage[D + 2]) - 87 * TAG }]);
    var preise = { HELD: 100, AAA: 100 };
    var g0 = MH.driftAbgleich(buch, { offen: [signal('AAA', 0)] }, preise, taktT(tage[D]), {});
    preise.AAA = 104;
    MH.driftAbgleich(buch, { offen: [signal('AAA', 2)] }, preise, taktT(tage[D + 2]), {});
    var p = buch.positionen.filter(function (q) { return q.sym === 'AAA'; })[0];
    /* Messung: ein Platz, HELD am Tag 0 gekauft und am Tag 60 verkauft; AAA meldet am Tag 58 */
    var n = 64, T = kunstPanel(n, [{ name: 'SPY', ref: true, kurse: kurse(n, function () { return [100, 100]; }) }, { name: 'HELD', kurse: kurse(n, function () { return [100, 100]; }) },
      { name: 'AAA', kurse: kurse(n, function (t) { return t < 60 ? [100, 100] : [104, 104]; }) }]);
    var R = messung(T, [meldung(T, 'HELD', 0, 7 * 3600, 5), meldung(T, 'AAA', 58, 7 * 3600, 9)], { plaetze: 1 });
    var mAAA = kaeufe(R.b).filter(function (h) { return h.name === 'AAA'; }).length;
    var grund0 = g0.verworfen.filter(function (x) { return x.sym === 'AAA'; })[0];
    zeile(!!p !== (mAAA > 0), 'Einstiegstag ' + de(tage[D]) + ' ohne Geld/Platz: Messung laesst die Meldung verfallen (' + R.b.zaehler.verfallenPlaetzeVoll + ' verfallen, ' + mAAA +
      ' Kauf AAA); App verwirft sie zuerst ("' + (grund0 ? grund0.grund : '-') + '") und kauft sie am ' + de(tage[D + 2]) + ', als der Verkauf von HELD Geld frei macht, ' +
      (p ? 'zu ' + zahl(p.einstand) + ' fuer ' + geld(p.stueck * 104) : 'nicht') + ' - zwei Tage nach dem Einstiegstag, mit 60 Tagen Haltedauer ab dann.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K14', titel: 'Position ohne Reihe im Bestand: zum Einstand bewertet, nie verkauft, nie ausgebucht (App) gegen Reihenende zum letzten Schluss (Messung)', lauf: async function () {
    var tage = handelstage('2026-03-02', 12, true);
    var buch = appBuch(0, [{ sym: 'GONE', stueck: 100, einstand: 100.1, richtung: 1, seit: taktT(tage[0]) - 200 * TAG }]);
    var g = MH.driftAbgleich(buch, { offen: [] }, {}, taktT(tage[10]), {});
    var spy = tage.map(function (t) { return [balkenT(t), 100]; });
    var aus = MH.reihenendeAusbuchen(buch, {}, spy, taktT(tage[10]));
    var wert = MH.bewerteDrift(buch, {});
    var T = kunstPanel(12, [{ name: 'SPY', ref: true, kurse: kurse(12, function () { return [100, 100]; }) },
      { name: 'GONE', kurse: kurse(12, function (t) { return t <= 3 ? [100, t === 3 ? 80 : 100] : null; }) }]);
    var R = messung(T, [meldung(T, 'GONE', 0, 7 * 3600, 5)]);
    var mEnde = R.b.handel.filter(function (h) { return h.art === 'reihenende'; })[0];
    zeile(buch.positionen.length === 1, 'Reihe fehlt im Bestand (letzter Schluss 80, Einstand 100,10): App laesst die faellige Position offen (' + (g.verworfen[0] ? '"' + g.verworfen[0].grund + '"' : '-') +
      '), bucht kein Reihenende (' + aus.length + ') und zeigt sie zum Einstand: ' + geld(wert.wert) + ' fuer 100 Stueck; Messung: Reihenende am ersten Handelstag danach zum letzten Schluss (' +
      (mEnde ? zahl(mEnde.kurs) : '-') + ').');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K15', titel: 'Gegenprobe: schon gehaltene Firma wird nicht ein zweites Mal gekauft', lauf: async function () {
    var buch = appBuch(50000, [{ sym: 'AAA', stueck: 10, einstand: 100, richtung: 1, seit: taktT('2026-10-01') }]);
    var g = MH.driftAbgleich(buch, { offen: [signal('AAA', 0)] }, { AAA: 100 }, taktT('2026-10-05'), {});
    var T = kunstPanel(4, [{ name: 'SPY', ref: true, kurse: kurse(4, function () { return [100, 100]; }) }, { name: 'AAA', kurse: kurse(4, function () { return [100, 100]; }) }]);
    var R = messung(T, [meldung(T, 'AAA', 1, 7 * 3600, 5), meldung(T, 'AAA', 2, 7 * 3600, 5)]);
    var aN = buch.positionen.length, mN = kaeufe(R.b).length;
    zeile(!(aN === 1 && mN === 1 && R.b.zaehler.schonGehalten === 1), 'zweite Meldung einer gehaltenen Firma: Messung ' + mN + ' Kauf, ' + R.b.zaehler.schonGehalten +
      ' "schon gehalten" (Schluessel CIK); App ' + aN + ' Position, "' + (g.verworfen[0] ? g.verworfen[0].grund : '-') + '" (Schluessel Kuerzel; im App-Universum hat keine Firma zwei Kuerzel).');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K16', titel: 'Gegenprobe: Anspruch auf Ausschuettungen (Stueckzahl ueber die Nacht)', lauf: async function () {
    var tage = handelstage('2026-03-02', 8, true);
    /* Messung: Kauf am Tag 1 zur Eroeffnung, Verkauf am Tag 4 (Kunst-Haltedauer 3); Ex-Tage 1 (Kauftag), 2 (gehalten), 4 (Verkaufstag) */
    var T = kunstPanel(8, [{ name: 'SPY', ref: true, kurse: kurse(8, function () { return [100, 100]; }) }, { name: 'X', kurse: kurse(8, function () { return [50, 50]; }) }]);
    var satz = function (t) { return { _art: 'cash_dividends', ex_date: T.kal.tage[t], rate: 0.5 }; };
    var R = messung(T, [meldung(T, 'X', 1, 7 * 3600, 5)], { halten: 3 }, { X: [satz(1), satz(2), satz(4)] });
    var stM = kaeufe(R.b)[0].stueck, jeM = R.b.zaehler.ausschuettungSumme / stM;
    /* App: Kauf zum Schluss von Tag 1 (kursT = Balken Tag 1), Takte an Tag 2..4; am Tag 4 bucht der Takt erst die Massnahmen, dann den Verkauf */
    var buch = appBuch(0, [{ sym: 'X', stueck: 10, einstand: 50, richtung: 1, seit: taktT(tage[1]), kursT: balkenT(tage[1]) }]);
    var er = { X: { div: [1, 2, 4].map(function (t) { return [balkenT(tage[t]), 0.5]; }), split: [] } }, summe = 0;
    for (var j = 2; j <= 4; j++) {
      var res = MH.bucheMassnahmen(buch, er, { X: balkenT(tage[j]) }, taktT(tage[j]));
      res.buchungen.forEach(function (b) { summe += b.summe; });
    }
    var jeA = summe / 10;
    zeile(Math.abs(jeA - jeM) > 1e-9, 'Ex-Tage am Kauftag, am Tag danach und am Verkaufstag, 0,50 $ je Stueck: Messung ' + zahl(jeM) + ' $ je Stueck, App ' + zahl(jeA) +
      ' $ je Stueck - Kauf am Ex-Tag ohne Anspruch, Verkauf am Ex-Tag mit Anspruch, in beiden gleich (wohin das Geld geht: K2).');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K17', titel: 'Gegenprobe: Split laesst den Wert der Position unveraendert', lauf: async function () {
    var t0 = taktT('2026-10-05');
    var buch = appBuch(1000, [{ sym: 'X', stueck: 10, einstand: 100, richtung: 1, seit: t0, kursT: balkenT('2026-10-05') }]);
    var vor = MH.bewerteDrift(buch, { X: 120 }).wert;
    MH.bucheMassnahmen(buch, { X: { div: [], split: [[balkenT('2026-10-07'), 2, 1]] } }, { X: balkenT('2026-10-07') }, taktT('2026-10-07'));
    var nach = MH.bewerteDrift(buch, { X: 60 }).wert;
    zeile(Math.abs(vor - nach) > 0.005, 'Split 2:1 bei Kurs 120 -> 60: App vorher ' + geld(vor) + ', nachher ' + geld(nach) + ' (Stueck ' + zahl(buch.positionen[0].stueck, 0) +
      ', Einstand ' + zahl(buch.positionen[0].einstand) + '); die Messung rechnet auf der bereinigten Reihe, der Wert laeuft dort ohne Sprung weiter.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K18', titel: 'Gegenprobe: kein Kredit, Bargeld bzw. SPY-Bestand nie negativ', lauf: async function () {
    var syms = []; for (var i = 0; i < 30; i++) syms.push('S' + i);
    var preise = {}; syms.forEach(function (s) { preise[s] = 37; });
    var buch = appBuch(7000, [{ sym: 'HELD', stueck: 930, einstand: 100, richtung: 1, seit: taktT('2026-10-01') }]); preise.HELD = 100;
    MH.driftAbgleich(buch, { offen: syms.map(function (s) { return signal(s); }) }, preise, taktT('2026-10-05'), {});
    var reihen = [{ name: 'SPY', ref: true, kurse: kurse(3, function () { return [100, 100]; }) }];
    syms.forEach(function (s) { reihen.push({ name: s, kurse: kurse(3, function () { return [37, 37]; }) }); });
    var T = kunstPanel(3, reihen), R = messung(T, syms.map(function (s, j) { return meldung(T, s, 1, j, 5); }), { plaetze: 20 });
    zeile(buch.cash < 0 || R.b.spyStueckEnde < 0, '30 Kaufsignale, kaum Geld: App Bargeld danach ' + geld(buch.cash) + ' (' + (buch.positionen.length - 1) + ' Kaeufe), Messung SPY-Bestand ' +
      zahl(R.b.spyStueckEnde, 4) + ' Anteile (' + R.b.zaehler.gekauft + ' Kaeufe, ' + R.b.zaehler.teilkauf + ' mit dem Rest) - beide ohne Kredit.');
  } });

  /* ======================================================================================================== */
  TESTS.push({ nr: 'K19', titel: 'Gegenprobe: Buchwert einmal je Tag, alle Kaeufe des Tags mit demselben Betrag', lauf: async function () {
    var buch = appBuch(60000, [{ sym: 'HELD', stueck: 400, einstand: 100, richtung: 1, seit: taktT('2026-10-01') }]);
    MH.driftAbgleich(buch, { offen: [signal('A'), signal('B'), signal('C')] }, { HELD: 100, A: 20, B: 20, C: 20 }, taktT('2026-10-05'), {});
    var vA = buch.positionen.filter(function (p) { return p.sym !== 'HELD'; }).map(function (p) { return Math.round(p.stueck * 20 * 100) / 100; });
    var T = kunstPanel(3, [{ name: 'SPY', ref: true, kurse: kurse(3, function () { return [100, 100]; }) }, { name: 'A', kurse: kurse(3, function () { return [20, 20]; }) },
      { name: 'B', kurse: kurse(3, function () { return [20, 20]; }) }, { name: 'C', kurse: kurse(3, function () { return [20, 20]; }) }]);
    var vM = kaeufe(messung(T, ['A', 'B', 'C'].map(function (s, j) { return meldung(T, s, 1, j, 5); })).b).map(function (h) { return Math.round(h.volumen * 100) / 100; });
    function gleich(l) { return l.every(function (x) { return Math.abs(x - l[0]) < 0.01; }); }
    zeile(!(gleich(vA) && gleich(vM)), 'drei Kaeufe an einem Tag: App ' + vA.map(geld).join(' / ') + ', Messung ' + vM.map(geld).join(' / ') +
      ' - in beiden ein Betrag fuer alle Kaeufe des Tags, bestimmt vor dem ersten Kauf (die Hoehe selbst: K1).');
  } });

  return TESTS;
};

if (require.main === module) {
  var pfad = require('path');
  var Z = {
    WURZEL: process.env.PRUEF_WURZEL ? pfad.resolve(process.env.PRUEF_WURZEL) : pfad.join(__dirname, '..', '..'),
    zeile: function (ab, text) { console.log((ab ? 'ZEIGT ABWEICHUNG: ' : 'kein Unterschied: ') + text); }
  };
  var nur = process.argv[2];
  (async function () {
    var liste = module.exports(Z);
    for (var i = 0; i < liste.length; i++) {
      var t = liste[i];
      if (nur && t.nr !== nur) continue;
      process.stdout.write(t.nr + '  ');
      try { await t.lauf(); } catch (e) { console.log('TESTDEFEKT: ' + (e && e.stack || e)); process.exitCode = 1; }
    }
  })();
}
