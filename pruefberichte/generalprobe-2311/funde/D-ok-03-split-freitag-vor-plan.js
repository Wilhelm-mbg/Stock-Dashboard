'use strict';
/* Pruefmodul der Generalprobe 23.11.2026 (Takt-Ablauf, Zustand, Zusammenspiel von mfdepot.js / mittelfrist.js / kurse.js).
 * Kleinsttest in der Sandbox von ../lib.js: feste Uhr (New York, Winterzeit), Kunstdaten, kein Netz, keine Schluessel.
 * Alles Simulation mit virtuellem Kapital. */
global.path = global.path || require('path');   // lib.js benutzt path/fs ohne eigenes require
global.fs = global.fs || require('fs');
var L = require('../lib.js');
var MH = L.MH;

/** Attrappe des Kurs-Laders fuer den Abruf am Ausfuehrungstag: eroeff = {SYM: Eroeffnung}; ein Wert ohne Eintrag
 *  antwortet ohne Balken (wie ein Abruf ohne Eroeffnung / ein gescheiterter Abruf). stempel = Balkenstempel des Tages. */
function holeAm(eroeff, stempel) {
  return async function (sym, o) {
    var e = eroeff && eroeff[sym];
    if (!(e > 0) || !o || !(o.von > 0) || !(stempel >= o.von && stempel <= o.bis)) return { bars: [] };
    return { bars: [[stempel, e * 1.01, 1e6, e * 1.02, e * 0.99, e]], verworfen: 0, gesamt: 1, feld: 'close' };
  };
}
/** mfdepot.js in der Sandbox auf der Uhr jetzt; speichern (optional) bekommt jeden Aufruf von window.__save. */
function depot(st, d, MF, jetzt, hole, speichern) {
  var karte = { innerHTML: '' };
  return L.sandbox(['mfdepot.js'], {
    U: L.U_ATTRAPPE, api: st.api, MF: MF, MFHandel: MH, Massstab: L.Ms, __el: { buchMomentumKopf: karte },
    Kurse: L.kursAttrappe(hole), __D: function () { return d; },
    __save: function () { if (speichern) speichern(d); return Promise.resolve({ ok: true }); }
  }, jetzt);
}
/** Ausgangslage Montag 23.11.2026: Tagesdaten bis Freitag 20.11. (geladen Fr 16:30 New York), SPY dazu, 19 Positionen
 *  (kursT/seit vor 63 Handelstagen), Umschichtung faellig (62 Balken seit dem letzten Ausfuehrungstag). */
async function szenario(o) {
  o = o || {};
  var namen = L.universum();
  var jetzt = o.jetzt || L.nyUTC(2026, 11, 23, 9, 36);
  var tage = L.werktageBis(L.FR, 300), spy = L.spyAus(tage);
  var roh = L.kunstUniversum(tage, namen);
  var st = L.speicher({});
  var at = L.nyUTC(2026, 11, 20, 16, 30);
  L.tagesdatenAblegen(st, roh, at, spy);
  if (!o.keinMarkt) st.daten.drift_markt = L.driftMarkt(spy, at);
  var kaufIdx = tage.length - 63;
  var pos = namen.slice(0, 19).map(function (s) {
    return { sym: s, stueck: 50, einstand: roh[s][kaufIdx][1] * 1.002, seit: tage[kaufIdx], kursT: tage[kaufIdx] };
  });
  var d = { momentumAn: true, mfBuch: L.buchMit(pos, tage[kaufIdx] + 3600000), mfVerlauf: [] };
  d.mfBuch.letzteAusfuehrungTag = MH.nyTag(tage[kaufIdx]);
  var eroeff = {}; namen.concat(['SPY']).forEach(function (s) { eroeff[s] = 100; });
  var mf = L.mittelfristSandbox(st, async function () { return null; }, jetzt);
  var MF = { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } };
  return { namen: namen, tage: tage, spy: spy, roh: roh, st: st, d: d, eroeff: eroeff, MF: MF, jetzt: jetzt, at: at };
}
function zielAm(s) { return MH.momentumZiel(MH.rohBis(s.roh, '2026-11-20'), { nowMs: L.FR }).ziel; }
function symbole(buch) { return buch.positionen.map(function (p) { return p.sym; }); }
function ohne(liste, zielListe) { return liste.filter(function (x) { return zielListe.indexOf(x) < 0; }); }
function wertBuch(b, kurs) { return b.cash + b.positionen.reduce(function (a, p) { return a + p.stueck * kurs; }, 0); }

module.exports = {
  id: 'D-ok-03-split-freitag-vor-plan',
  klasse: 'ok',
  ort: 'mfdepot.js:384 (massnahmenBuchen vor dem Plan), mfhandel.js:607',
  titel: 'Gegenprobe: ein Split mit Ex-Tag = letzter gespeicherter Balken (Fr) wird VOR dem Plan gebucht - der Verkauf am Montag erloest den vollen Wert',
  ausloeser: 'Wert X (nicht im Ziel), 100 Stueck vorsplit, Split 2:1 am Fr 20.11. (Reihe schon bereinigt: Kurs halb), Montags-Eroeffnung = Freitagsschluss.',
  erwartet: '200 Stueck nach der Buchung, Verkaufserloes 200 x Eroeffnung x (1 - 0,002).',
  async lauf() {
    var s = await szenario();
    var b = s.d.mfBuch, S = ohne(symbole(b), zielAm(s))[0];
    s.roh[S] = s.roh[S].map(function (r) { return [r[0], r[1] / 2, r[2], r[3] / 2]; });
    L.tagesdatenAblegen(s.st, s.roh, s.at, s.spy);
    s.st.daten.mf_ereignisse = { at: s.at, sym: {} };
    s.st.daten.mf_ereignisse.sym[S] = { div: [], split: [[L.FR, 2, 1]] };
    var p0 = b.positionen.filter(function (p) { return p.sym === S; })[0];
    p0.stueck = 100;
    var op = s.roh[S][s.roh[S].length - 1][1];
    s.eroeff[S] = op;
    var mf = L.mittelfristSandbox(s.st, async function () { return null; }, s.jetzt);
    await L.taktLauf(depot(s.st, s.d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, s.jetzt, holeAm(s.eroeff, L.MO)));
    var v = b.trades.filter(function (t) { return t.art === 'verkauf' && t.sym === S; })[0];
    return { abweichung: !v || Math.abs(v.stueck - 200) > 1e-9, text: 'verkauft: ' + (v ? v.stueck + ' Stueck zu ' + v.kurs.toFixed(2) + ' $' : 'nichts') + ' (erwartet 200 Stueck zu ' + op.toFixed(2) + ' $).' };
  }
};
