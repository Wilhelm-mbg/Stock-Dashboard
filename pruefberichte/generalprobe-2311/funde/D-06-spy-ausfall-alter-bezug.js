'use strict';
/* Pruefmodul der Generalprobe 23.11.2026 (Takt-Ablauf, Zustand, Zusammenspiel von mfdepot.js / mittelfrist.js / kurse.js).
 * Kleinsttest in der Sandbox von ../lib.js: feste Uhr (New York, Winterzeit), Kunstdaten, kein Netz, keine Schluessel.
 * Alles Simulation mit virtuellem Kapital.
 * Angepasst (Fix Generalprobe): der Stub fuer ladeUniversum am Montag tat nichts - nach der Behebung (kein alter Bezug
 * unter neuem Stand, der Takt stoesst wegen fehlender Marktreihe das Nachladen an) konnte der Nachweis so nie gruen
 * werden, obwohl die App richtig handelt. Jetzt laedt der Montags-Lader wirklich (mittelfrist.js in der Sandbox, Uhr
 * Mo 09:36, Attrappe liefert bis Freitag samt SPY und einen laufenden Montagsbalken), und es laufen zwei Takte:
 * 09:36 und 10:06. Soll: Umschichtung zur Eroeffnung des 23.11., Stichtag 20.11., Tagespunkt nur fuer den 20.11. */
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
  erwartet: 'Montag 23.11.: der Takt sieht keinen Freitags-SPY, stoesst das Nachladen an (09:36) und schichtet nach dem Laden zur Eroeffnung des 23.11. um (Stichtag 20.11., ' +
    'Tagespunkt fuer den 20.11.) - wie der Kontrolllauf mit SPY. Beobachtet vor der Behebung: alter SPY unter neuem Stand, 61 Balken gezaehlt, nicht faellig, kein Nachladen.',
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
      var gelesen = await mf.MF.tagesdatenLesen(), bezugGelesen = !!(gelesen && gelesen.bezug);
      var jetzt = L.nyUTC(2026, 11, 23, 9, 36);
      st.daten.drift_markt = L.driftMarkt(spyF, jetztLade);
      var kaufIdx = tageF.length - 63;
      var pos = namen.slice(0, 19).map(function (k) { return { sym: k, stueck: 50, einstand: 100, seit: tageF[kaufIdx], kursT: tageF[kaufIdx] }; });
      var d = { momentumAn: true, mfBuch: L.buchMit(pos, tageF[kaufIdx] + 3600000), mfVerlauf: [] };
      d.mfBuch.letzteAusfuehrungTag = MH.nyTag(tageF[kaufIdx]);
      var eroeff = {}; namen.concat(['SPY']).forEach(function (k) { eroeff[k] = 100; });
      /* Der Montags-Lader: Yahoo liefert um 09:36 alles bis Freitag samt SPY und dazu den laufenden Montagsbalken
       * (den der Lader abschneiden muss). */
      function mitMontag(r) { var z = r[r.length - 1]; return r.concat([[L.MO, z[1] * 1.01, z[2], z[3] * 1.01]]); }
      var mfMo = L.mittelfristSandbox(st, async function (sym, o) {
        if (sym === 'SPY') return L.ladeAntwort(mitMontag(spyF), o);
        return rohF[sym] ? L.ladeAntwort(mitMontag(rohF[sym]), o) : null;
      }, jetzt);
      var angestossen = 0, ladung = null;
      var MF = { tagesdatenLesen: mfMo.MF.tagesdatenLesen,
        ladeUniversum: function () { angestossen++; ladung = mfMo.MF.ladeUniversum(); return ladung; } };
      var dep = depot(st, d, MF, jetzt, holeAm(eroeff, L.MO));
      await L.taktLauf(dep);                                                         // Mo 09:36
      var nach0936 = { angestossen: angestossen, umgeschichtet: L.umgeschichtet(d) };
      if (ladung) await ladung;
      dep.__uhr.jetzt = L.nyUTC(2026, 11, 23, 10, 6);
      await L.taktLauf(dep);                                                         // Mo 10:06
      var rebal = (d.tuneLog || []).filter(function (z) { return /^mfrebal-/.test(z.id); });
      return { spyLetzt: spyLetzt, bezugAt: bz.at === st.daten.mf_tagesdaten_index.at, bezugGelesen: bezugGelesen, nach0936: nach0936,
        umgeschichtet: rebal.length, ausfTag: d.mfBuch.letzteAusfuehrungTag, stichtag20: rebal.length === 1 && /Stichtags 20\.11\.2026/.test(rebal[0].txt),
        punkt: d.mfVerlauf.map(function (p) { return p.tag; }).join(',') };
    }
    function soll(x) { return x.umgeschichtet === 1 && x.ausfTag === '2026-11-23' && x.stichtag20 && x.punkt === '2026-11-20'; }
    var ohneSpy = await lauf1(true), mitSpy = await lauf1(false);
    return { abweichung: !(soll(ohneSpy) && soll(mitSpy) && (ohneSpy.nach0936.umgeschichtet || ohneSpy.nach0936.angestossen > 0)),
      text: 'beobachtet (SPY-Abruf scheitert Fr 16:30): mf_bezug endet ' + ohneSpy.spyLetzt + ', Stand gleich dem Index: ' + ohneSpy.bezugAt + ', vom Lesen als Bezug geliefert: ' +
        ohneSpy.bezugGelesen + '; Mo 09:36 Nachladen angestossen: ' + ohneSpy.nach0936.angestossen + 'x, umgeschichtet: ' + ohneSpy.nach0936.umgeschichtet +
        '; bis 10:06 Umschichtungen: ' + ohneSpy.umgeschichtet + ', Ausfuehrungstag ' + ohneSpy.ausfTag + ', Stichtag 20.11.: ' + ohneSpy.stichtag20 + ', Tagespunkt fuer ' +
        (ohneSpy.punkt || '-') + ' (Soll 2026-11-20). Kontrolllauf mit SPY: SPY endet ' + mitSpy.spyLetzt + ', Umschichtungen ' + mitSpy.umgeschichtet + ', Ausfuehrungstag ' +
        mitSpy.ausfTag + ', Tagespunkt ' + (mitSpy.punkt || '-') + '.' };
  }
};
