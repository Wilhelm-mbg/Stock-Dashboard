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
  id: 'D-10-knopf-waehrend-takt-stumm',
  klasse: 'C',
  ort: 'mfdepot.js:341 (if (LAEUFT) return; ohne Rueckmeldung)',
  titel: 'Der Knopf "jetzt umschichten" (und "Takt jetzt") tut nichts und sagt nichts, solange ein Takt laeuft (Abruf der Eroeffnungen dauert Sekunden bis Minuten)',
  ausloeser: 'Takt laeuft (wartet auf die Abrufe), der Anwender drueckt den Knopf: takt("momentum") kehrt sofort zurueck, keine Statuszeile, keine Ausfuehrung, keine Warteschlange. Kein Doppelhandel - aber ein scheinbar toter Knopf.',
  erwartet: 'Rueckmeldung ("Takt laeuft gerade - bitte warten") oder Vormerkung des Knopfs fuer das Ende des Takts.',
  async lauf() {
    var s = await szenario();
    var frei, tor = new Promise(function (r) { frei = r; }), erster = true, h = holeAm(s.eroeff, L.MO);
    var dep = depot(s.st, s.d, s.MF, s.jetzt, async function (sym, o) { if (sym === 'SPY' && erster) { erster = false; await tor; } return h(sym, o); });
    var p1 = dep.MFDepot.takt();
    await new Promise(function (r) { setImmediate(r); }); await new Promise(function (r) { setImmediate(r); });
    var n0 = L.getStatus().length;
    var r2 = await dep.MFDepot.takt('momentum');
    var neu = L.getStatus().length - n0;
    frei(); await p1;
    return { abweichung: neu === 0,
      text: 'beobachtet: takt("momentum") waehrend eines laufenden Takts kehrt sofort zurueck (' + String(r2) + '), neue Statuszeilen ' + neu + '; (der laufende Takt schichtet danach um: ' + L.umgeschichtet(s.d) + '); erwartet: eine Rueckmeldung an den Anwender.' };
  }
};
