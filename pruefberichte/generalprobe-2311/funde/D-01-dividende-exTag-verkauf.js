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
  id: 'D-01-dividende-exTag-verkauf',
  klasse: 'A',
  ort: 'mfdepot.js:384 (massnahmenBuchen vor dem Plan) + mfhandel.js:607 (bucheMassnahmen: nur Positionen im Buch)',
  titel: 'Ausschuettung mit Ex-Tag = Ausfuehrungstag geht verloren, wenn die Position zur Eroeffnung dieses Tages verkauft wird',
  ausloeser: 'Momentum-Buch haelt Wert X (nicht im Ziel); X hat Ex-Tag am Ausfuehrungstag (Mo 23.11.). Die Umschichtung verkauft X zur Eroeffnung; ' +
    'der Bestand (Freitag) kennt den Ex-Tag noch nicht (t > barZeit), am Dienstag steht die Position nicht mehr im Buch.',
  erwartet: 'REGEL.md Teil C Nr. 3: "ein Verkauf zur Eroeffnung des Ex-Tags zaehlt noch" - Gutschrift stueck x Betrag (hier 50 x 1,00 $ = 50 $).',
  async lauf() {
    var s = await szenario();
    var b = s.d.mfBuch, vorher = symbole(b);
    var dep = depot(s.st, s.d, s.MF, s.jetzt, holeAm(s.eroeff, L.MO));
    await L.taktLauf(dep);
    var verkauft = ohne(vorher, symbole(b));
    var V = verkauft[0], cash1 = b.cash;
    // Dienstag 24.11. 10:00: Montagsbalken im Bestand, Ex-Tag-Ereignis (Mo) fuer den verkauften Wert im Ereignisbestand
    var jetzt2 = L.nyUTC(2026, 11, 24, 10, 0);
    var roh2 = {};
    Object.keys(s.roh).forEach(function (k) { var r = s.roh[k], l = r[r.length - 1]; roh2[k] = r.concat([[L.MO, l[1], l[2], l[3]]]); });
    var spy2 = s.spy.concat([[L.MO, 430, 8e7, 430]]), at2 = L.nyUTC(2026, 11, 23, 16, 30);
    L.tagesdatenAblegen(s.st, roh2, at2, spy2);
    s.st.daten.mf_ereignisse = { at: at2, sym: {} };
    s.st.daten.mf_ereignisse.sym[V] = { div: [[L.MO, 1.0]], split: [] };
    s.st.daten.drift_markt = L.driftMarkt(spy2, at2);
    var mf2 = L.mittelfristSandbox(s.st, async function () { return null; }, jetzt2);
    var dep2 = depot(s.st, s.d, { tagesdatenLesen: mf2.MF.tagesdatenLesen, ladeUniversum: function () { return Promise.resolve(null); } }, jetzt2, holeAm({}, L.DI));
    await L.taktLauf(dep2);
    var gut = b.cash - cash1;
    return { abweichung: gut < 50 - 1e-6,
      text: 'beobachtet: ' + verkauft.length + ' Werte am Mo verkauft; ' + V + ' (50 Stueck) hat Ex-Tag Mo, Dienstag-Takt: Bargeld ' + L.geld(cash1) + ' -> ' + L.geld(b.cash) +
        ' (Gutschrift ' + gut.toFixed(2) + ' $, Buchungen: ' + ((b.massnahmen || []).length) + '); erwartet: Gutschrift 50,00 $ (Messung zaehlt den Verkauf zur Eroeffnung des Ex-Tags noch).' };
  }
};
