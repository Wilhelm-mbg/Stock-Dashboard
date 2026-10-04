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

/* Neu (Fix Generalprobe, Fund 7): D-08 selbst wird schon mit Fund 2 gruen, weil sein Netz um 16:05 zurueckkommt und die
 * Umschichtung dann zur Montags-Eroeffnung nachgeholt wird. Dieser Nachweis haelt den Kern von D-08 fest: antwortet den GANZEN
 * Ausfuehrungstag nur SPY (auch nach 16:00), darf die leere Umschichtung nicht als ausgefuehrt zaehlen. Gegen 0b0e522 und gegen
 * den Stand nur mit Fund 2 ZEIGT ABWEICHUNG (letzteAusfuehrungTag 2026-11-23, Quartal verloren). */
module.exports = {
  id: 'D-08b-nur-spy-ganzer-tag',
  klasse: 'B',
  ort: 'mfdepot.js ausfuehrungVorbereiten (ausser SPY keine Eroeffnung) + Umschichtungsblock im Takt (letzteAusfuehrungTag, liquideSeit)',
  titel: 'Antwortet am Ausfuehrungstag bis in den Abend nur SPY, zaehlt eine Umschichtung ohne einen einzigen Kurs nicht als ausgefuehrt',
  ausloeser: 'Mo 23.11.: SPY-Abruf klappt, alle anderen Abrufe liefern keinen Balken - um 09:36 und noch um 16:05 New York.',
  erwartet: 'Kein mfrebal-Eintrag, letzteAusfuehrungTag bleibt der 25.08., liquideSeit bleibt, Faelligkeit bleibt bestehen; ein Hinweis auf der Karte (REGEL §1.3: ein Ausfuehrungstag hat Kurse, neuer Versuch wie bei zuWenig).',
  async lauf() {
    var s = await szenario();
    var b = s.d.mfBuch, vorher = b.letzteAusfuehrungTag, liquide = b.liquideSeit;
    var dep1 = depot(s.st, s.d, s.MF, s.jetzt, holeAm({ SPY: 100 }, L.MO));
    await L.taktLauf(dep1);
    var dep2 = depot(s.st, s.d, s.MF, L.nyUTC(2026, 11, 23, 16, 5), holeAm({ SPY: 100 }, L.MO));
    await L.taktLauf(dep2);
    var fl = MH.faelligkeit(s.spy, b.letzteAusfuehrungTag, 63, L.nyUTC(2026, 11, 24, 10, 5));
    var karte = dep2.__el.buchMomentumKopf.innerHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    var ausgefuehrt = L.umgeschichtet(s.d) || b.letzteAusfuehrungTag !== vorher || b.liquideSeit !== liquide;
    return { abweichung: ausgefuehrt || fl.faellig !== true,
      text: 'beobachtet nach 09:36 und 16:05 (nur SPY): mfrebal ' + (L.umgeschichtet(s.d) ? 'ja' : 'nein') + ', letzteAusfuehrungTag ' + b.letzteAusfuehrungTag +
        ', liquideSeit ' + (b.liquideSeit === liquide ? 'unveraendert' : 'neu gesetzt') + ', Trades ' + b.trades.length + ', Di 10:05 faellig ' + fl.faellig +
        ', Karte "' + (/außer SPY/.test(karte) ? 'außer SPY … keine Eröffnung' : karte.slice(0, 120)) + '"; erwartet: nicht ausgefuehrt, Faelligkeit bleibt, Hinweis auf der Karte.' };
  }
};
