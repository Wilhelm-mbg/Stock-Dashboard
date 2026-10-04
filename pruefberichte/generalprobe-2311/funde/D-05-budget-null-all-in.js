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
  id: 'D-05-budget-null-all-in',
  klasse: 'A',
  ort: 'mfhandel.js:748 (offeneAuftraege: budget aus plan.depotwert) + mfhandel.js:777-800 (nachfassen: stueck 0 -> fuehreAus-Verkleinerung nimmt das ganze Bargeld) + mfhandel.js:127 (planeUmschichtung)',
  titel: 'Abruf der Eroeffnungen scheitert fuer die Bestaende bzw. fuer alles ausser SPY: Budget 0 - entweder fallen alle Kaeufe aus, oder das Nachfassen kauft EINEN Wert mit dem ganzen Bargeld',
  ausloeser: '(a) Alle gehaltenen Werte ohne Eroeffnung (stehen am Ende der Abrufliste, Drosselung), Ziele mit Eroeffnung: plan.depotwert = Bargeld = 0, die Kaeufe haben stueck 0, ' +
    'stehen aber nicht in offen (nur fehltKurs-Ziele) - nach dem spaeteren Verkauf bleibt das Buch bei 94 % Bargeld. ' +
    '(b) Nur SPY antwortet (kurzer Netzausfall nach dem SPY-Abruf): offen traegt budget 0 fuer alle Kaeufe; das Nachfassen um 10:06 setzt stueck = 0 -> Verkleinerung auf das ganze Bargeld.',
  erwartet: '19 Positionen, jede ca. 5 % des Buchs (Gleichgewichtung nach Budget), Bargeld < 100 $.',
  async lauf() {
    // (a)
    var a = await szenario();
    var ba = a.d.mfBuch, gehalten = symbole(ba);
    var ea = {}; Object.keys(a.eroeff).forEach(function (k) { if (gehalten.indexOf(k) < 0) ea[k] = 100; });
    await L.taktLauf(depot(a.st, a.d, a.MF, a.jetzt, holeAm(ea, L.MO)));
    var nachA1 = { pos: ba.positionen.length, kaufOffen: ba.offen ? ba.offen.kaeufe.length : 0 };
    await L.taktLauf(depot(a.st, a.d, a.MF, a.jetzt + 1800000, holeAm(a.eroeff, L.MO)));
    var anteilBarA = ba.cash / wertBuch(ba, 100);
    // (b)
    var c = await szenario();
    var bc = c.d.mfBuch;
    await L.taktLauf(depot(c.st, c.d, c.MF, c.jetzt, holeAm({ SPY: 100 }, L.MO)));
    await L.taktLauf(depot(c.st, c.d, c.MF, c.jetzt + 1800000, holeAm(c.eroeff, L.MO)));
    var groesst = Math.max.apply(null, bc.positionen.map(function (p) { return p.stueck * 100; }));
    var anteilMax = groesst / wertBuch(bc, 100);
    return { abweichung: anteilBarA > 0.2 || anteilMax > 0.3 || bc.positionen.length < 15,
      text: 'beobachtet (a) Bestaende ohne Eroeffnung: nach 09:36 ' + nachA1.pos + ' Positionen, ' + nachA1.kaufOffen + ' Kaeufe in offen; nach 10:06 ' + ba.positionen.length +
        ' Positionen, Bargeld ' + (anteilBarA * 100).toFixed(1) + ' % des Buchs. (b) nur SPY: nach 10:06 ' + bc.positionen.length + ' Positionen, groesste ' +
        (anteilMax * 100).toFixed(1) + ' % des Buchs (' + L.geld(groesst) + '). erwartet: 19 Positionen zu je ca. 5 %, Bargeld < 1 %.' };
  }
};
