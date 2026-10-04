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
  id: 'D-ok-01-nachfassen-ziele-ohne-eroeffnung',
  klasse: 'ok',
  ort: 'mfdepot.js:309-338 (offenNachfassen), mfhandel.js:777 (nachfassen)',
  titel: 'Gegenprobe: fehlen NUR Ziele (nicht Bestaende) um 09:36, holt das Nachfassen um 10:06 sie zur Eroeffnung dieses Tages nach - gleiche Gewichte, Rangfolge, Bargeld ausgeschoepft',
  ausloeser: 'Drei Ziele (Rang 3-5) ohne Eroeffnung um 09:36, um 10:06 vorhanden.',
  erwartet: '19 Positionen, jede 5.000 $ (letzte durch Kosten kleiner), kein Bargeld, offen leer, kein zweiter Kauf.',
  async lauf() {
    var s = await szenario();
    var b = s.d.mfBuch, z = zielAm(s), fehl = z.slice(2, 5);
    var e1 = {}; Object.keys(s.eroeff).forEach(function (k) { if (fehl.indexOf(k) < 0) e1[k] = 100; });
    await L.taktLauf(depot(s.st, s.d, s.MF, s.jetzt, holeAm(e1, L.MO)));
    var offenGemerkt = b.offen ? b.offen.kaeufe.map(function (k) { return k.sym + ':' + k.budget; }).join(',') : '-';
    await L.taktLauf(depot(s.st, s.d, s.MF, s.jetzt + 1800000, holeAm(s.eroeff, L.MO)));
    var w = b.positionen.map(function (p) { return p.stueck * 100; });
    var gleich = w.slice(0, -1).every(function (x) { return Math.abs(x - 5000) < 1; });
    var ok = b.positionen.length === 19 && gleich && b.cash < 1 && !b.offen && fehl.every(function (k) { return symbole(b).indexOf(k) >= 0; });
    return { abweichung: !ok, text: 'offen um 09:36: ' + offenGemerkt + '; um 10:06: ' + b.positionen.length + ' Positionen, Bargeld ' + L.geld(b.cash) + ', offen ' + (b.offen ? 'ja' : 'leer') + ', kleinste/groesste Position ' +
      Math.round(Math.min.apply(null, w)) + '/' + Math.round(Math.max.apply(null, w)) + ' $.' };
  }
};
