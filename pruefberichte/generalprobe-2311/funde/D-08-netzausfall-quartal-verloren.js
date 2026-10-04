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
  id: 'D-08-netzausfall-quartal-verloren',
  klasse: 'B',
  ort: 'mfdepot.js:278-306 (ausfuehrungVorbereiten: Fehlschlag eines Abrufs = "keine Eroeffnung") + mfdepot.js:440-449 (Umschichtung gilt als ausgefuehrt, Vorwaertstest beginnt) + mfdepot.js:309-318',
  titel: 'Netzfehler/Drosselung wird wie "kein Handel ohne Eroeffnung" behandelt: antwortet ab 09:36 bis 16:00 nur SPY, ist die Umschichtung "ausgefuehrt" und das Quartal verloren',
  ausloeser: 'SPY-Abruf klappt (Handelstag bestaetigt), alle weiteren Abrufe scheitern bis nach 16:00 New York (Netz, Drosselung). eroeffnung() verschluckt jeden Fehler (null). ' +
    'Der Takt setzt trotzdem letzteAusfuehrungTag, liquideSeit (Beginn des Vorwaertstests) und eine Zeile "0 Verkaeufe, 0 Kaeufe"; offen wird um 16:00 geloescht.',
  erwartet: 'Eine Umschichtung ohne einen einzigen Handel zaehlt nicht als ausgefuehrt: Faelligkeit bleibt, der naechste Tag versucht es erneut (die Messung kennt keinen Netzausfall); liquideSeit bleibt leer.',
  async lauf() {
    var s = await szenario();
    var b = s.d.mfBuch, vorher = symbole(b).join(',');
    await L.taktLauf(depot(s.st, s.d, s.MF, s.jetzt, holeAm({ SPY: 100 }, L.MO)));
    await L.taktLauf(depot(s.st, s.d, s.MF, L.nyUTC(2026, 11, 23, 16, 5), holeAm(s.eroeff, L.MO)));     // Netz wieder da, aber nach 16:00
    var tagDanach = L.nyUTC(2026, 11, 24, 10, 5);
    await L.taktLauf(depot(s.st, s.d, s.MF, tagDanach, holeAm(s.eroeff, L.DI)));
    var unveraendert = symbole(b).join(',') === vorher && b.trades.length === 0;
    return { abweichung: unveraendert && b.letzteAusfuehrungTag === '2026-11-23',
      text: 'beobachtet: nach Ausfall bis 16:05 und einem Takt am 24.11.: Positionen unveraendert=' + unveraendert + ' (' + b.positionen.length + '), Trades ' + b.trades.length +
        ', letzteAusfuehrungTag ' + b.letzteAusfuehrungTag + ', liquideSeit ' + (b.liquideSeit ? 'gesetzt' : 'leer') + ', korbVerlauf ' + (b.korbVerlauf || []).length +
        ' - die naechste Umschichtung ist erst in 62 Handelstagen faellig; erwartet: nicht als ausgefuehrt gezaehlt, Wiederholung am naechsten Handelstag.' };
  }
};
