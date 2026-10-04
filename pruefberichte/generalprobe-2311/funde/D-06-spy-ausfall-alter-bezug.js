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
  id: 'D-06-spy-ausfall-alter-bezug',
  klasse: 'A',
  ort: 'mittelfrist.js:215/249-251 (SPY ist der LETZTE der 194 Abrufe; bei Ausfall wird der alte Bezug unter dem NEUEN Stand at abgelegt)',
  titel: 'SPY-Abruf scheitert im Freitagslauf: die Marktreihe bleibt einen Tag alt, gilt aber als gleicher Stand - Faelligkeit und Tagespunkt rechnen falsch, Umschichtung entfaellt am Montag',
  ausloeser: 'Freitag 16:30 New York: 193 Werte kommen, der letzte Abruf (SPY, Position 194 hinter 193 Abrufen - Yahoo drosselt bei ca. 200 in Folge) scheitert. ' +
    'mf_bezug behaelt die Reihe bis Donnerstag, traegt aber at = Freitag; der Bestand gilt als frisch, es wird nicht nachgeladen.',
  erwartet: 'Montag 23.11. 09:36: 62 Balken seit dem letzten Ausfuehrungstag -> faellig -> Umschichtung am 23.11. (Kontrolllauf mit SPY: ja). Beobachtet: 61 gezaehlt, nicht faellig.',
  async lauf() {
    async function lauf1(spyFaellt) {
      var namen = L.universum();
      var tageF = L.werktageBis(L.FR, 300), tageD = tageF.slice(0, -1);
      var rohF = L.kunstUniversum(tageF, namen), spyF = L.spyAus(tageF);
      var rohD = L.kunstUniversum(tageD, namen), spyD = L.spyAus(tageD);
      var st = L.speicher({});
      L.tagesdatenAblegen(st, rohD, L.nyUTC(2026, 11, 19, 16, 30), spyD);           // Donnerstag-Stand
      var jetztLade = L.nyUTC(2026, 11, 20, 16, 30);
      var mf = L.mittelfristSandbox(st, async function (sym, o) {
        if (sym === 'SPY') return spyFaellt ? null : L.ladeAntwort(spyF, o);
        return rohF[sym] ? L.ladeAntwort(rohF[sym], o) : null;
      }, jetztLade);
      await mf.MF.ladeUniversum();
      var bz = st.daten.mf_bezug, spyLetzt = new Date(bz.reihe[bz.reihe.length - 1][0]).toISOString().slice(0, 10);
      var jetzt = L.nyUTC(2026, 11, 23, 9, 36);
      st.daten.drift_markt = L.driftMarkt(spyF, jetztLade);
      var kaufIdx = tageF.length - 63;
      var pos = namen.slice(0, 19).map(function (k) { return { sym: k, stueck: 50, einstand: 100, seit: tageF[kaufIdx], kursT: tageF[kaufIdx] }; });
      var d = { momentumAn: true, mfBuch: L.buchMit(pos, tageF[kaufIdx] + 3600000), mfVerlauf: [] };
      d.mfBuch.letzteAusfuehrungTag = MH.nyTag(tageF[kaufIdx]);
      var eroeff = {}; namen.concat(['SPY']).forEach(function (k) { eroeff[k] = 100; });
      var mf2 = L.mittelfristSandbox(st, async function () { return null; }, jetzt);
      await L.taktLauf(depot(st, d, { tagesdatenLesen: mf2.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, holeAm(eroeff, L.MO)));
      return { spyLetzt: spyLetzt, bezugAt: bz.at === st.daten.mf_tagesdaten_index.at, umgeschichtet: L.umgeschichtet(d), punkt: d.mfVerlauf.map(function (p) { return p.tag; }).join(',') };
    }
    var ohneSpy = await lauf1(true), mitSpy = await lauf1(false);
    return { abweichung: mitSpy.umgeschichtet && !ohneSpy.umgeschichtet,
      text: 'beobachtet (SPY-Abruf scheitert): SPY-Reihe endet ' + ohneSpy.spyLetzt + ' unter dem Stand Freitag (at gleich: ' + ohneSpy.bezugAt + '), Mo 09:36 umgeschichtet: ' +
        ohneSpy.umgeschichtet + ', Tagespunkt fuer ' + ohneSpy.punkt + ' (statt 2026-11-20). Kontrolllauf mit SPY: SPY endet ' + mitSpy.spyLetzt + ', umgeschichtet: ' + mitSpy.umgeschichtet + '.' };
  }
};
