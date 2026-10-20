'use strict';
/* Tests des Kandidaten fomc-gerade-wochen-long (FORM.md §4): Kunstkalender je Regelzeile, Randfaelle, kein Blick nach vorn.
 *   node pruefstrasse/warteschlange/fomc-gerade-wochen-long/test.js   -> Rueckgabewert 0 = gruen */
var fs = require('fs');
var path = require('path');
var R = require('./regel.js');
var A = require(path.join(__dirname, '..', '..', 'adapter', 'tag.js'));
var KAND = JSON.parse(fs.readFileSync(path.join(__dirname, 'kandidat.json'), 'utf8'));
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }

/** Werktage ab Datum a (einschliesslich, wenn Werktag), n Stueck. */
function werktage(a, n) {
  var t = [], ms = Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10));
  while (t.length < n) { var w = new Date(ms).getUTCDay(); if (w !== 0 && w !== 6) t.push(new Date(ms).toISOString().slice(0, 10)); ms += 86400000; }
  return t;
}
/** Kunstreihe ueber einen Kalender (eine Zeile je Kalendertag), Kurs 20, Umsatz 1000. */
function reihe(kal) {
  var sp = { reihe: 'KUNST', tag: [], o: [], h: [], l: [], c: [], v: [], datum: kal.slice() };
  for (var i = 0; i < kal.length; i++) { sp.tag.push(i); sp.o.push(20); sp.h.push(20.2); sp.l.push(19.8); sp.c.push(20); sp.v.push(1000); }
  return sp;
}
function alle(sp, params) {
  var aus = [];
  for (var i = 0; i < sp.c.length; i++) { var s = R.signal(A.kunstSicht(sp, i), i, params); if (s) aus.push({ i: i, d: sp.datum[i], w: s.woche }); }
  return aus;
}

/* 1. Regelzeilen: Kunstzyklus Bekanntgaben Mi 2022-03-16 und Mi 2022-05-04 (34 Werktage Abstand), dann 2022-06-15 */
var P = { fomcTage: ['2022-03-16', '2022-05-04', '2022-06-15'] };
var kal = werktage('2022-03-01', 80), sp = reihe(kal), s = alle(sp, P);
var iA = kal.indexOf('2022-03-16');
var w0 = s.filter(function (x) { return x.w === 0; }), w2 = s.filter(function (x) { return x.w === 2; }), w4 = s.filter(function (x) { return x.w === 4; });
ok(w0.length === 3 && w0[0].d === '2022-03-14' && w0[1].d === '2022-05-02' && w0[2].d === '2022-06-13', 'Woche 0: Signal zwei Werktage vor jeder Bekanntgabe (Einstieg Tag -1)', JSON.stringify(w0));
ok(w2.length >= 1 && w2[0].i === iA + 8 && kal[w2[0].i + 1] === kal[iA + 9], 'Woche 2: Signal am Tag 8, Einstieg Eroeffnung Tag 9 (Quelle: Tage 9-13)', JSON.stringify(w2));
ok(w4.length >= 1 && w4[0].i === iA + 18, 'Woche 4: Signal am Tag 18, Einstieg Tag 19', JSON.stringify(w4));
ok(s.every(function (x) { return x.w === 0 || x.w === 2 || x.w === 4 || x.w === 6; }) && s.filter(function (x) { return x.w === 6; }).length === 0,
  'Zyklus 34 Werktage: keine Woche 6 (Einstieg Tag 29 laege naeher als Tag -7 an der naechsten Bekanntgabe)');
/* 2. Woche 6 nur in langen Zyklen: Bekanntgaben 2022-03-16 und 2022-05-25 (50 Werktage) */
var P6 = { fomcTage: ['2022-03-16', '2022-05-25'] }, s6 = alle(reihe(kal), P6), x6 = s6.filter(function (x) { return x.w === 6; });
ok(x6.length === 1 && x6[0].i === iA + 28, 'langer Zyklus: Woche 6 mit Signal am Tag 28', JSON.stringify(x6));
/* 3. Abstand zur naechsten Sitzung: Zyklus 25 Werktage -> Woche 4 (Einstieg Tag 19 = Tag -6) faellt weg */
var P25 = { fomcTage: ['2022-03-16', '2022-04-20'] }, s25 = alle(reihe(kal), P25);
ok(R.werktageZwischen('2022-03-16', '2022-04-20') === 25 && s25.filter(function (x) { return x.w === 4 && x.i < kal.indexOf('2022-04-20'); }).length === 0 &&
  s25.filter(function (x) { return x.w === 2 && x.i === iA + 8; }).length === 1, 'Zyklus 25 Werktage: Woche 2 ja, Woche 4 nein (Quelle zaehlt Fenster ab Tag -6 nicht)');
/* 4. Abstand zwischen zwei Signalen derselben Reihe >= 5 Handelstage (Cooldown greift nicht) */
var gap = true; for (var q = 1; q < s.length; q++) if (s[q].i - s[q - 1].i < 5) gap = false;
ok(gap, 'Signale derselben Reihe mindestens 5 Handelstage auseinander');
/* 5. Echte Liste, Werktage 2016-2022: rund 170 Signaltage (55 Woche 0, 55 Woche 2, 54 Woche 4, 7 Woche 6) */
var kalE = werktage('2016-01-04', 1825).filter(function (d) { return d <= '2022-12-30'; }), sE = alle(reihe(kalE), KAND.params), je = { 0: 0, 2: 0, 4: 0, 6: 0 };
sE.forEach(function (x) { je[x.w]++; });
ok(je[0] === 55 && je[2] === 55 && je[4] === 54 && je[6] === 7, 'echte Liste 2016-2022 (Werktagskalender): Signaltage je Woche wie in REGEL.md', JSON.stringify(je));
/* 6. Randfaelle */
ok(R.signal(A.kunstSicht(sp, iA + 8), iA + 8, {}) === null && R.signal(A.kunstSicht(sp, iA + 8), iA + 8, { fomcTage: [] }) === null, 'ohne Terminliste kein Signal');
var luecke = reihe(kal); luecke.tag = luecke.tag.filter(function (t) { return t !== iA; });
['o', 'h', 'l', 'c', 'v'].forEach(function (f) { luecke[f] = luecke[f].slice(0, luecke.tag.length); });
var sl = A.kunstSicht(luecke, iA + 7);
ok(R.signal(sl, iA + 7, P) === null, 'Reihe ohne Zeile am Bekanntgabetag: keine Zykluszeit, kein Signal fuer Woche 2');
var kurz = reihe(kal.slice(0, 3));
ok(R.signal(A.kunstSicht(kurz, 0), 0, P) === null && R.signal(A.kunstSicht(kurz, 2), 2, P) === null, 'zu kurze Reihe vor der ersten Bekanntgabe: kein Signal');
var ohne = A.kunstSicht(sp, iA + 8); ohne.datum = function () { return NaN; };
ok(R.signal(ohne, iA + 8, P) === null, 'datum nicht lesbar: kein Signal');
ok(R.brauchtDatum === true && R.brauchtHochTief === false && R.brauchtRoh === false && R.brauchtMarkt === false, 'die Regel verlangt nur das Kalenderdatum');
/* 7. Kein Blick nach vorn: Zeilen nach i veraendern -> Signal unveraendert; Zugriff auf i+1 ist Verstoss, die Regel erzeugt keinen */
var vorn = reihe(kal); for (var z = iA + 9; z < kal.length; z++) { vorn.c[z] = 1; vorn.o[z] = 99; vorn.v[z] = 1e9; }
var a1 = R.signal(A.kunstSicht(sp, iA + 8), iA + 8, P), a2 = R.signal(A.kunstSicht(vorn, iA + 8), iA + 8, P);
ok(a1 && a2 && a1.woche === 2 && a2.woche === 2, 'Zeilen nach i veraendert: Signal unveraendert');
var si = A.kunstSicht(vorn, iA + 8); R.signal(si, iA + 8, P);
ok(si.verstoesse() === 0, 'die Regel liest keine Zeile hinter i', si.verstoesse());
var d9 = si.datum(iA + 9);
ok(d9 !== d9 && si.verstoesse() === 1, 'datum(i+1) liefert NaN und zaehlt als Verstoss');

console.log(fails ? fails + ' TEST(S) ROT' : 'ALLE TESTS GRUEN');
process.exit(fails ? 1 : 0);
