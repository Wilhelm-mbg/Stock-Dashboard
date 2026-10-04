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
  id: 'D-02-split-exTag-ausfuehrungstag',
  klasse: 'A',
  ort: 'mfdepot.js:384/422 (Split wird nur bis zum juengsten GESPEICHERTEN Balken gebucht, geplant wird zu Eroeffnungskursen des Ausfuehrungstags)',
  titel: 'Split mit Ex-Tag = Ausfuehrungstag: gehaltener Wert wird mit nachsplit-Eroeffnung x vorsplit-Stueckzahl bewertet und verkauft',
  ausloeser: 'Gehaltener Wert X (nicht im Ziel) hat am Ausfuehrungstag einen Split 2:1. Der Bestand (Freitag) kennt den Split nicht, die Eroeffnung des Tages ' +
    'ist schon nachsplit; die Stueckzahl im Buch ist noch vorsplit.',
  erwartet: 'Messung (Panel, bereinigt): der Split aendert nichts am Wert - X wird zum Wert 100 Stueck x Schluss (hier ca. 10.044 $) verkauft, minus 20 Bp.',
  async lauf() {
    var s = await szenario();
    var b = s.d.mfBuch, z = zielAm(s);
    var S = ohne(symbole(b), z)[0];
    var p0 = b.positionen.filter(function (p) { return p.sym === S; })[0];
    p0.stueck = 100;
    var schluss = s.roh[S][s.roh[S].length - 1][1];
    s.eroeff[S] = schluss / 2;                        // Eroeffnung Montag, schon nachsplit
    var dep = depot(s.st, s.d, s.MF, s.jetzt, holeAm(s.eroeff, L.MO));
    await L.taktLauf(dep);
    var v = b.trades.filter(function (t) { return t.art === 'verkauf' && t.sym === S; })[0];
    var erloes = v ? v.stueck * v.kurs : 0, soll = 100 * schluss;
    return { abweichung: !v || erloes < 0.9 * soll,
      text: 'beobachtet: ' + S + ' 100 Stueck (vorsplit) zur Eroeffnung ' + (schluss / 2).toFixed(2) + ' $ verkauft, Erloes ' + L.geld(erloes) +
        '; erwartet: wirtschaftlicher Wert ' + L.geld(soll) + ' (Verlust ' + L.geld(soll - erloes) + ', 50 %).' };
  }
};
