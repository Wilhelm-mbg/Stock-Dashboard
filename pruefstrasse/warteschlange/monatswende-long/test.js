'use strict';
/* Tests des Kandidaten monatswende-long (FORM.md §4): Kunstkalender je Regelzeile, Randfaelle, kein Blick nach vorn.
 *   node pruefstrasse/warteschlange/monatswende-long/test.js   -> Rueckgabewert 0 = gruen */
var path = require('path');
var R = require('./regel.js');
var A = require(path.join(__dirname, '..', '..', 'adapter', 'tag.js'));
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }

/** Kunstreihe ueber einen gegebenen Kalender (ein Handelstag je Kalendertag), Kurs 20, Umsatz 1000. */
function reihe(kalender) {
  var sp = { reihe: 'KUNST', tag: [], o: [], h: [], l: [], c: [], v: [], datum: kalender.slice() };
  for (var i = 0; i < kalender.length; i++) { sp.tag.push(i); sp.o.push(20); sp.h.push(20.2); sp.l.push(19.8); sp.c.push(20); sp.v.push(1000); }
  return sp;
}
function sig(kal, i) { return R.signal(A.kunstSicht(reihe(kal), i), i, {}); }

/* 1. Regelzeile: Monatsende auf Freitag (29.01.2021, Wochenende 30./31.) -> Signal am Donnerstag 28.01. (vorletzter Werktag), nirgends sonst */
var k1 = ['2021-01-26', '2021-01-27', '2021-01-28', '2021-01-29', '2021-02-01', '2021-02-02', '2021-02-03', '2021-02-04'];
var s1 = sig(k1, 2);
ok(s1 && s1.dir === 1 && s1.datum === '2021-01-28', 'vorletzter Werktag des Monats (Do 28.01.2021) gibt Signal long; Einstieg = Eroeffnung Fr 29.01. = letzter Handelstag', JSON.stringify(s1));
ok(sig(k1, 3) === null && sig(k1, 1) === null && sig(k1, 0) === null, 'letzter Handelstag (29.01.) und fruehere Tage: kein Signal');
ok(sig(k1, 4) === null && sig(k1, 5) === null && sig(k1, 6) === null && sig(k1, 7) === null, 'Tage +1..+4 des Folgemonats: kein Signal (Fenster wird gehalten, nicht neu eroeffnet)');
/* 2. Monatsende mitten in der Woche (Mi 30.06.2021 -> Do 01.07.): Signal am Dienstag 29.06. */
var k2 = ['2021-06-28', '2021-06-29', '2021-06-30', '2021-07-01', '2021-07-02'];
ok(sig(k2, 1) !== null && sig(k2, 2) === null && sig(k2, 0) === null, 'Monatsende am Mittwoch: Signal am Dienstag 29.06.2021, nicht am 30.06.');
/* 3. Monatsende am Sonntag (31.10.2021): letzter Werktag Fr 29.10., Signal Do 28.10. */
var k3 = ['2021-10-27', '2021-10-28', '2021-10-29', '2021-11-01'];
ok(sig(k3, 1) !== null && sig(k3, 2) === null, 'Monatsende am Wochenende: Signal am Donnerstag 28.10.2021 (vorletzter Werktag)');
/* 4. Schaltjahr: Februar 2024 endet Do 29.02. -> Signal Mi 28.02.; Februar 2023 endet Di 28.02. -> Signal Mo 27.02. */
ok(R.istVorletzterWerktagImMonat('2024-02-28') === true && R.istVorletzterWerktagImMonat('2024-02-29') === false && R.istVorletzterWerktagImMonat('2023-02-27') === true && R.istVorletzterWerktagImMonat('2023-02-28') === false,
  'Februar 2024 (Schaltjahr) und 2023: der vorletzte Werktag wird je richtig erkannt');
/* 5. Feiertag am Monatsende (Karfreitag 30.03.2018 ist Werktag, aber kein Handelstag): die Regel kennt keinen Feiertag -> Signal am Do 29.03.
 *    (= tatsaechlich letzter Handelstag), Einstieg Mo 02.04. (+1 statt -1). Bekannte Abweichung, in REGEL.md gezaehlt. Am 28.03. kein Signal. */
var k5 = ['2018-03-27', '2018-03-28', '2018-03-29', '2018-04-02', '2018-04-03'];
ok(sig(k5, 2) !== null && sig(k5, 1) === null, 'Karfreitag am Monatsende: Signal am 29.03.2018 (Einstieg verschiebt sich auf +1, bekannte Abweichung), nicht am 28.03.');
/* 6. Zwoelf Monate Kunstkalender (Werktage 02.01.-31.12.2020 = 261 Tage): genau ein Signal je Monat */
var kal12 = A.kunstKalender(261), sp12 = reihe(kal12), n12 = 0, tage12 = [];
for (var i = 0; i < kal12.length; i++) { var s = R.signal(A.kunstSicht(sp12, i), i, {}); if (s) { n12++; tage12.push(s.datum); } }
ok(kal12[kal12.length - 1] === '2020-12-31' && n12 === 12 && tage12[0] === '2020-01-30' && tage12[11] === '2020-12-30', 'Werktagskalender 2020: genau zwoelf Signale, eines je Monat (30.01. ... 30.12.)', n12 + ' Signale, erstes ' + tage12[0] + ', letztes ' + tage12[11]);
/* 7. Randfaelle: Sicht ohne Kalender (datum NaN) -> kein Signal; Reihe mit Kalenderluecke (Zeile fehlt am Signaltag) -> am Luecken-Tag kein Signal */
var ohne = A.kunstSicht(reihe(k1), 2); ohne.datum = function () { return NaN; };
ok(R.signal(ohne, 2, {}) === null, 'datum(i) nicht lesbar: kein Signal');
var luecke = reihe(k1); luecke.tag = [0, 1, 3, 4, 5, 6, 7, 8]; luecke.datum = k1.concat(['2021-02-05']);   /* Zeile 2 liegt auf Kalendertag 3 (29.01.), Tag 2 fehlt */
for (var f in luecke) if (Array.isArray(luecke[f]) && f !== 'tag' && f !== 'datum') luecke[f] = luecke[f].slice(0, 8);
ok(R.signal(A.kunstSicht(luecke, 2), 2, {}) === null && R.signal(A.kunstSicht(luecke, 1), 1, {}) === null, 'Reihe ohne Zeile am vorletzten Werktag: kein Signal in diesem Monat (keine Interpolation)');
ok(R.brauchtDatum === true && R.brauchtHochTief === false && R.brauchtRoh === false && R.brauchtMarkt === false, 'die Regel verlangt nur das Kalenderdatum (brauchtDatum)');
/* 8. Kein Blick nach vorn: Zeilen nach i veraendern -> Signal unveraendert; die Regel liest weder Kalender noch Kurse hinter i */
var vorn = reihe(k1); for (var z = 3; z < 8; z++) { vorn.c[z] = 1; vorn.o[z] = 99; vorn.v[z] = 1e9; }
var s2 = R.signal(A.kunstSicht(vorn, 2), 2, {});
ok(s2 && s2.dir === 1 && s2.datum === s1.datum, 'Zeilen nach i veraendert: Signal unveraendert (kein Blick nach vorn)');
var si = A.kunstSicht(vorn, 2), d3 = si.datum(3), l2 = si.istLetzterHandelstagImMonat(2);
ok(d3 !== d3 && l2 === null && si.verstoesse() === 1, 'datum(i+1) liefert NaN und zaehlt als Verstoss; istLetzterHandelstagImMonat(i) ist am Tag i unbekannt (null)', si.verstoesse());
R.signal(si, 2, {});
ok(si.verstoesse() === 1, 'die Regel selbst erzeugt keinen Verstoss', si.verstoesse());

console.log(fails ? fails + ' TEST(S) ROT' : 'ALLE TESTS GRUEN');
process.exit(fails ? 1 : 0);
