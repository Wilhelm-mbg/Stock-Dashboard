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
  id: 'D-07-stichtag-nenner-behaltene-reihen',
  klasse: 'A',
  ort: 'mfhandel.js:360-366 (stichtagPruefen zaehlt ALLE Reihen im Bestand, auch die behaltenen alten) + mittelfrist.js:243-248 (Wert ohne Antwort behaelt seine alte Reihe fuer immer)',
  titel: 'Ab 10 dauerhaft verschwundenen Werten (5 % von 193) blockiert die Stichtag-Pruefung jede Umschichtung - dauerhaft, Nachladen aendert nichts',
  ausloeser: 'Je Wert, der keine Antwort mehr bekommt (Uebernahme, Umbenennung), bleibt seine alte Reihe im Bestand (Index "weg"). Bekannt am 21.08.: BK, MMC, HES, FI (4). ' +
    'stichtagPruefen verlangt fuer >= 95 % ALLER Reihen einen Balken am Stichtag: bei 193 Reihen fehlen ab 10 toten Reihen genuegend Treffer (183 < 183,35). ' +
    'momentumZiel wuerde sie ohnehin als veraltet auslassen.',
  erwartet: 'Die toten Reihen zaehlen nicht in den Nenner (Messung: verschwundene Reihen werden ausgebucht/ausgelassen, die Umschichtung laeuft). Beobachtet: 9 tote ok, 10 tote - kein Handel, "nicht frisch genug", Nachladen angestossen (aendert nichts, Bestand gilt als frisch).',
  async lauf() {
    var res = {};
    for (var n of [9, 10]) {
      var s = await szenario();
      var tot = s.namen.slice(100, 100 + n);
      tot.forEach(function (k) { s.roh[k] = s.roh[k].slice(0, -12); });
      L.tagesdatenAblegen(s.st, s.roh, s.at, s.spy);
      s.st.daten.mf_tagesdaten_index.weg = tot;
      var angestossen = 0;
      var MF = { tagesdatenLesen: s.MF.tagesdatenLesen, ladeUniversum: function () { angestossen++; return Promise.resolve(null); } };
      await L.taktLauf(depot(s.st, s.d, MF, s.jetzt, holeAm(s.eroeff, L.MO)));
      res[n] = { umgeschichtet: L.umgeschichtet(s.d), angestossen: angestossen };
    }
    return { abweichung: !res[10].umgeschichtet,
      text: 'beobachtet: 9 tote Reihen von 193 -> umgeschichtet ' + res[9].umgeschichtet + '; 10 tote -> umgeschichtet ' + res[10].umgeschichtet + ' (Nachladen angestossen: ' + res[10].angestossen +
        'x, ohne Wirkung); erwartet: auch mit 10 und mehr toten Reihen wird umgeschichtet (Ziel aus den lebenden Werten).' };
  }
};
