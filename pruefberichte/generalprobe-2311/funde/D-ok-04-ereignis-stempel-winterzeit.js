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
  id: 'D-ok-04-ereignis-stempel-winterzeit',
  klasse: 'ok',
  ort: 'mfhandel.js:607-650 (t > kursT, t <= barZeit), kurse.js:ereignisseAus',
  titel: 'Gegenprobe Winter-/Sommerzeit: Ereignis und Tagesbalken tragen denselben Stempel (14:30 UTC im Winter, 13:30 im Sommer) - Ex-Tag = Kauftag wird nicht gebucht, der Folgetag genau einmal',
  ausloeser: 'Kauf zur Eroeffnung Mo 23.11. (kursT = 14:30 UTC), Ausschuettung Ex-Tag Mo (nicht), Di 24.11. (ja, sobald barZeit = Di); dasselbe im Sommer (13:30 UTC).',
  erwartet: 'Winter und Sommer gleich: Mo nicht, Di einmal, ein zweiter Aufruf bucht nichts.',
  async lauf() {
    function fall(kaufT, tagN) {
      var buch = { cash: 0, positionen: [{ sym: 'X', stueck: 10, einstand: 100, seit: kaufT + 3600000, kursT: kaufT }] };
      var ev = { X: { div: [[kaufT, 1], [kaufT + tagN, 2]], split: [] } };
      var r1 = MH.bucheMassnahmen(buch, ev, { X: kaufT }, kaufT + 7200000);
      var r2 = MH.bucheMassnahmen(buch, ev, { X: kaufT + tagN }, kaufT + tagN + 7200000);
      var r3 = MH.bucheMassnahmen(buch, ev, { X: kaufT + tagN }, kaufT + tagN + 9000000);
      return r1.buchungen.length + '/' + r2.buchungen.length + '/' + r3.buchungen.length + ' Cash ' + buch.cash;
    }
    var winter = fall(Date.UTC(2026, 10, 23, 14, 30), 86400000), sommer = fall(Date.UTC(2026, 6, 20, 13, 30), 86400000);
    var ok = winter === '0/1/0 Cash 20' && sommer === '0/1/0 Cash 20';
    return { abweichung: !ok, text: 'Winter (14:30 UTC) ' + winter + '; Sommer (13:30 UTC) ' + sommer + ' (erwartet je 0/1/0 Cash 20).' };
  }
};
