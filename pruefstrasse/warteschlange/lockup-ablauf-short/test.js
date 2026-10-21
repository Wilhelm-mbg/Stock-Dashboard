'use strict';
/* Tests des Kandidaten lockup-ablauf-short (FORM.md §4): Kunstkalender je Regelzeile, Randfaelle, kein Blick nach vorn.
 *   node pruefstrasse/warteschlange/lockup-ablauf-short/test.js   -> Rueckgabewert 0 = gruen */
var fs = require('fs');
var path = require('path');
var R = require('./regel.js');
var A = require(path.join(__dirname, '..', '..', 'adapter', 'tag.js'));
var KAND = JSON.parse(fs.readFileSync(path.join(__dirname, 'kandidat.json'), 'utf8'));
var P = KAND.params;
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }

/** Werktage (Mo-Fr) ab einem Datum, n Stueck; ohne Feiertage ausser den genannten. */
function werktage(ab, n, ohne) {
  var out = [], ms = Date.UTC(+ab.slice(0, 4), +ab.slice(5, 7) - 1, +ab.slice(8, 10));
  while (out.length < n) { var d = new Date(ms), w = d.getUTCDay(), s = d.toISOString().slice(0, 10); if (w !== 0 && w !== 6 && (!ohne || ohne.indexOf(s) < 0)) out.push(s); ms += 86400000; }
  return out;
}
/** Tafel-Kalender `kal`; die Reihe beginnt am Tafelindex `start` (Neuemission) und laeuft bis zum Ende. Kurs 20, Umsatz 1000. */
function reihe(kal, start) {
  var sp = { reihe: 'KUNST', tag: [], o: [], h: [], l: [], c: [], v: [], datum: kal.slice() };
  for (var t = start; t < kal.length; t++) { sp.tag.push(t); sp.o.push(20); sp.h.push(20.2); sp.l.push(19.8); sp.c.push(20); sp.v.push(1000); }
  return sp;
}
function signale(sp) {
  var out = [];
  for (var i = 0; i < sp.tag.length; i++) { var s = R.signal(A.kunstSicht(sp, i), i, P); if (s) out.push({ i: i, s: s }); }
  return out;
}

/* Kunsttafel: Werktage ab Mo 04.01.2016 (Panelanfang), US-Feiertage 2021 um den Ablauf herausgenommen */
var KAL = werktage('2016-01-04', 1600, ['2021-07-05', '2021-05-31']);
var start = KAL.indexOf('2021-01-05');   /* Neuemission: erste Notierung Di 05.01.2021, Preisfeststellung Mo 04.01.2021 */

/* 1. Regelzeile: E = 04.01.2021 + 180 = Sa 03.07.2021 -> Tag 0 = Di 06.07. (05.07. Feiertag); Fenster ab Sa 19.06. -> Signal Mo 21.06. */
ok(R.ablauf('2021-01-05', P) === '2021-07-03' && R.fensterAb('2021-07-03', P) === '2021-06-19', 'Ablauf = erste Notierung - 1 + 180 Kalendertage, Fenster 14 Kalendertage davor');
var s1 = signale(reihe(KAL, start));
ok(s1.length === 1 && s1[0].s.dir === -1 && s1[0].s.datum === '2021-06-21' && s1[0].s.ablauf === '2021-07-03', 'Neuemission: genau ein Signal short am 21.06.2021', JSON.stringify(s1.map(function (x) { return x.s; })));
var iSig = KAL.indexOf('2021-06-21'), iT0 = KAL.indexOf('2021-07-06');
ok(iT0 - iSig === 10, 'Signaltag = Tag -10 (zehn Handelstage vor Tag 0), Einstieg Eroeffnung Tag -9, H11 -> Ausstieg Eroeffnung Tag +2', iT0 - iSig);
/* 2. Reihe am Panelanfang (und vor ersteZeileAb) -> nie ein Signal */
ok(signale(reihe(KAL, 0)).length === 0, 'Reihe notiert ab Panelanfang: kein Signal (keine Neuemission)');
ok(signale(reihe(KAL, KAL.indexOf('2016-01-20'))).length === 0, 'erste Zeile vor ersteZeileAb (2016-02-01): kein Signal');
ok(signale(reihe(KAL, KAL.indexOf('2016-02-01'))).length === 1, 'erste Zeile am 2016-02-01: Signal');
/* 3. Ablauf am Wochentag ohne Feiertag: erste Notierung Do 01.04.2021 -> E = Mo 27.09.2021, Fenster ab Mo 13.09. -> Signal am 13.09. */
var s3 = signale(reihe(KAL, KAL.indexOf('2021-04-01')));
ok(s3.length === 1 && s3[0].s.datum === '2021-09-13' && s3[0].s.ablauf === '2021-09-27', 'Ablauf Montag: Signal genau zwei Wochen vorher', JSON.stringify(s3.map(function (x) { return x.s.datum; })));
/* 4. Luecke in der Reihe ueber das ganze Fenster -> kein Signal (die Regel holt kein Fenster nach dem Ablauf nach) */
var lu = reihe(KAL, start), a = lu.tag.indexOf(KAL.indexOf('2021-06-18')), b = lu.tag.indexOf(KAL.indexOf('2021-07-06'));
['tag', 'o', 'h', 'l', 'c', 'v'].forEach(function (f) { lu[f].splice(a + 1, b - a - 1); });
ok(signale(lu).length === 0, 'Reihe ohne Zeile im Fenster [E-14, E): kein Signal');
/* 5. Luecke nur am Fensteranfang -> Signal am ersten vorhandenen Tag im Fenster */
var lu2 = reihe(KAL, start), a2 = lu2.tag.indexOf(KAL.indexOf('2021-06-21'));
['tag', 'o', 'h', 'l', 'c', 'v'].forEach(function (f) { lu2[f].splice(a2, 2); });
var s5 = signale(lu2);
ok(s5.length === 1 && s5[0].s.datum === '2021-06-23', 'erste Zeile im Fenster fehlt: Signal am ersten vorhandenen Tag (23.06.)', JSON.stringify(s5.map(function (x) { return x.s.datum; })));
/* 6. Randfaelle: zu kurze Reihe, datum nicht lesbar, ohne params */
ok(signale(reihe(KAL.slice(0, KAL.indexOf('2021-04-30')), start)).length === 0, 'Reihe endet vor dem Fenster: kein Signal');
var o = A.kunstSicht(reihe(KAL, start), iSig - start); o.datum = function () { return NaN; };
ok(R.signal(o, iSig - start, P) === null, 'datum nicht lesbar: kein Signal');
ok(R.signal(A.kunstSicht(reihe(KAL, start), iSig - start), iSig - start, {}) === null && R.signal(A.kunstSicht(reihe(KAL, start), 0), 0, P) === null, 'ohne params oder bei i = 0: kein Signal');
ok(R.brauchtDatum === true && R.brauchtRoh === false && R.brauchtMarkt === false && R.brauchtHochTief === false, 'die Regel verlangt nur das Kalenderdatum');
/* 7. Konfiguration wie in der Quelle: short, H11, ein Signal je Reihe */
ok(KAND.konfigurationen.length === 1 && KAND.konfigurationen[0].richtung === 'short' && KAND.konfigurationen[0].haltedauer === 11 && P.sperrTage === 180 && P.vorlaufKalendertage === 14, 'kandidat.json: eine Konfiguration short H11, 180 Tage, Vorlauf 14 Kalendertage');
/* 8. Kein Blick nach vorn: Zeilen nach i veraendern -> Signal unveraendert; die Regel liest nichts hinter i */
var vorn = reihe(KAL, start), iv = iSig - start;
for (var z = iv + 1; z < vorn.tag.length; z++) { vorn.c[z] = 1; vorn.o[z] = 99; vorn.v[z] = 1e9; }
vorn.tag.length = iv + 3; ['o', 'h', 'l', 'c', 'v'].forEach(function (f) { vorn[f].length = iv + 3; });
var sv = A.kunstSicht(vorn, iv), s8 = R.signal(sv, iv, P);
ok(s8 && s8.dir === -1 && s8.datum === '2021-06-21', 'Zeilen nach i veraendert und Reihe gekuerzt: Signal unveraendert');
ok(sv.verstoesse() === 0, 'die Regel selbst erzeugt keinen Verstoss', sv.verstoesse());
var d1 = sv.datum(iv + 1);
ok(d1 !== d1 && sv.verstoesse() === 1, 'datum(i+1) liefert NaN und zaehlt als Verstoss (die Schranke wirkt)', sv.verstoesse());

console.log(fails ? fails + ' TEST(S) ROT' : 'ALLE TESTS GRUEN');
process.exit(fails ? 1 : 0);
