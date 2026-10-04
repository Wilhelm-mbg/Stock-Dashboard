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
  id: 'D-03-tagespunkt-ausfuehrungstag-vor-handel',
  klasse: 'B',
  ort: 'mfdepot.js:398 (tagespunkt vor dem Handel) + mfdepot.js:244 (Sperre nur bei letzteAusfuehrungTag > x.tag)',
  titel: 'Erster Takt des Ausfuehrungstags nach 16:15 New York: der Tagespunkt dieses Tages wird vom Buch VOR der Umschichtung geschrieben',
  ausloeser: 'Die App laeuft am Ausfuehrungstag erst nach Boersenschluss an (Takt 17:00 New York, Bestand mit Montagsbalken). Der Takt schreibt zuerst den ' +
    'Punkt fuer Mo (x = Mo, abgeschlossen), danach schichtet er zur Montags-Eroeffnung um.',
  erwartet: 'Punkt Mo = Buch NACH der Umschichtung zu den Montags-Schluessen (wie die Messung: Handel zur Eroeffnung, Bewertung zum Schluss).',
  async lauf() {
    var jetzt = L.nyUTC(2026, 11, 23, 17, 0);
    var namen = L.universum(), tage = L.werktageBis(L.MO, 300), spy = L.spyAus(tage), roh = L.kunstUniversum(tage, namen);
    Object.keys(roh).forEach(function (k) { var r = roh[k], l = r[r.length - 1]; r[r.length - 1] = [l[0], l[1] * 1.03, l[2], l[3] * 1.03]; });
    var st = L.speicher({}), at = L.nyUTC(2026, 11, 23, 16, 30);
    L.tagesdatenAblegen(st, roh, at, spy);
    st.daten.drift_markt = L.driftMarkt(spy, at);
    var kaufIdx = tage.length - 64;
    var pos = namen.slice(0, 19).map(function (k) { return { sym: k, stueck: 50, einstand: roh[k][kaufIdx][1] * 1.002, seit: tage[kaufIdx], kursT: tage[kaufIdx] }; });
    var d = { momentumAn: true, mfBuch: L.buchMit(pos, tage[kaufIdx] + 3600000), mfVerlauf: [] };
    d.mfBuch.letzteAusfuehrungTag = MH.nyTag(tage[kaufIdx]);
    var eroeff = {}; namen.concat(['SPY']).forEach(function (k) { eroeff[k] = 100; });
    var mf = L.mittelfristSandbox(st, async function () { return null; }, jetzt);
    var dep = depot(st, d, { tagesdatenLesen: mf.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt, holeAm(eroeff, L.MO));
    await L.taktLauf(dep);
    var preise = {}; namen.forEach(function (k) { preise[k] = roh[k][roh[k].length - 1][1]; });
    var soll = MH.bewerte(d.mfBuch, preise).wert;
    var p = d.mfVerlauf[d.mfVerlauf.length - 1];
    return { abweichung: !L.umgeschichtet(d) || !p || Math.abs(p.momentum - soll) > 1,
      text: 'beobachtet: umgeschichtet ' + L.umgeschichtet(d) + ', Punkt ' + (p ? p.tag + ' = ' + L.geld(p.momentum) : '-') +
        ' (altes Buch zu den Montags-Schluessen); erwartet: ' + L.geld(soll) + ' (neues Buch nach Handel zur Eroeffnung, zu den Montags-Schluessen), Differenz ' +
        (p ? L.geld(soll - p.momentum) : '-') + '.' };
  }
};
