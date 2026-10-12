'use strict';
/* Tests des Kandidaten vor-fomc-long (FORM.md §4): Kunstkalender je Regelzeile, Randfaelle, kein Blick nach vorn.
 *   node pruefstrasse/warteschlange/vor-fomc-long/test.js   -> Rueckgabewert 0 = gruen  (bewertung "zeit", Nr. 118; bis dahin im vorrat/) */
var fs = require('fs');
var path = require('path');
var R = require('./regel.js');
var A = require(path.join(__dirname, '..', '..', 'adapter', 'tag.js'));
var KAND = JSON.parse(fs.readFileSync(path.join(__dirname, 'kandidat.json'), 'utf8'));
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }

/** Kunstreihe ueber einen gegebenen Kalender (ein Handelstag je Kalendertag), Kurs 20, Umsatz 1000. */
function reihe(kalender) {
  var sp = { reihe: 'KUNST', tag: [], o: [], h: [], l: [], c: [], v: [], datum: kalender.slice() };
  for (var i = 0; i < kalender.length; i++) { sp.tag.push(i); sp.o.push(20); sp.h.push(20.2); sp.l.push(19.8); sp.c.push(20); sp.v.push(1000); }
  return sp;
}
var P = { fomcTage: ['2022-03-16', '2024-11-07', '2030-05-07'] };   /* Mittwoch, Donnerstag (Wahlwoche), Dienstag (Kunstfall) */
function sig(kal, i, params) { return R.signal(A.kunstSicht(reihe(kal), i), i, params || P); }

/* 1. Regelzeile: Bekanntgabe Mi 16.03.2022 -> Signal am Mo 14.03. (A-2), Einstieg Eroeffnung Di 15.03. (A-1); sonst nirgends */
var k1 = ['2022-03-10', '2022-03-11', '2022-03-14', '2022-03-15', '2022-03-16', '2022-03-17', '2022-03-18'];
var s1 = sig(k1, 2);
ok(s1 && s1.dir === 1 && s1.datum === '2022-03-14' && s1.bekanntgabe === '2022-03-16', 'Bekanntgabe am Mittwoch: Signal am Montag (A-2), Einstieg = Eroeffnung des Vortags der Bekanntgabe', JSON.stringify(s1));
ok(sig(k1, 0) === null && sig(k1, 1) === null && sig(k1, 3) === null && sig(k1, 4) === null && sig(k1, 5) === null, 'Fr, Di (A-1), Mi (A), Do: kein Signal');
/* 2. Bekanntgabe am Donnerstag (07.11.2024, Wahlwoche) -> Signal Di 05.11. */
var k2 = ['2024-11-04', '2024-11-05', '2024-11-06', '2024-11-07', '2024-11-08'];
ok(sig(k2, 1) !== null && sig(k2, 1).bekanntgabe === '2024-11-07' && sig(k2, 0) === null && sig(k2, 2) === null, 'Bekanntgabe am Donnerstag: Signal am Dienstag, nicht am Montag oder Mittwoch');
/* 3. Bekanntgabe am Dienstag (Kunstfall 07.05.2030): A-2 ist der Freitag davor (Wochenende uebersprungen) */
var k3 = ['2030-05-02', '2030-05-03', '2030-05-06', '2030-05-07'];
ok(sig(k3, 1) !== null && sig(k3, 1).datum === '2030-05-03' && sig(k3, 2) === null, 'Bekanntgabe am Dienstag: Signal am Freitag davor (uebernaechster Werktag ueber das Wochenende)');
/* 4. Kein Listentag in der Naehe -> kein Signal; ohne Liste -> kein Signal (die Regel erfindet keine Termine) */
ok(sig(['2022-04-04', '2022-04-05', '2022-04-06'], 0) === null, 'kein Bekanntgabetag in Reichweite: kein Signal');
ok(sig(k1, 2, {}) === null && sig(k1, 2, { fomcTage: [] }) === null, 'ohne Terminliste kein Signal');
/* 5. Die echte Liste aus kandidat.json: 87 planmaessige Bekanntgaben 2016-2026, nur Mi/Do, 2020 sieben (17./18.03. abgesagt), keine Dubletten */
var L = KAND.params.fomcTage, wt = {}, dub = 0, seen = {}, je = {};
L.forEach(function (d) { var w = new Date(d + 'T00:00:00Z').getUTCDay(); wt[w] = (wt[w] || 0) + 1; if (seen[d]) dub++; seen[d] = true; var j = d.slice(0, 4); je[j] = (je[j] || 0) + 1; });
ok(L.length === 87 && dub === 0 && Object.keys(wt).sort().join(',') === '3,4' && je['2020'] === 7 && je['2016'] === 8 && je['2026'] === 8 && L.slice().sort().join() === L.join(),
  'kandidat.json: 87 Bekanntgabetage 2016-2026, sortiert, ohne Dubletten, nur Mittwoch (' + wt[3] + ') und Donnerstag (' + wt[4] + '), 2020 sieben', L.length + ' Tage, Jahre ' + JSON.stringify(je));
ok(L.indexOf('2020-03-18') === -1 && L.indexOf('2019-10-04') === -1 && L.indexOf('2020-03-15') === -1 && L.indexOf('2025-08-22') === -1, 'abgesagte (18.03.2020), ausserplanmaessige (04.10.2019, 15.03.2020) und Notation Votes (22.08.2025) stehen nicht in der Liste');
/* 6. Mit der echten Liste: Kunstkalender aller Werktage 2022 -> genau acht Signale, je am Montag vor einer Mittwoch-Bekanntgabe */
var kal22 = [], ms = Date.UTC(2022, 0, 3); while (kal22.length < 260) { var w = new Date(ms).getUTCDay(); if (w !== 0 && w !== 6) kal22.push(new Date(ms).toISOString().slice(0, 10)); ms += 86400000; }
var sp22 = reihe(kal22), n22 = 0, tage22 = [];
for (var i = 0; i < kal22.length; i++) { var s = R.signal(A.kunstSicht(sp22, i), i, KAND.params); if (s) { n22++; tage22.push(s.datum + '>' + s.bekanntgabe); } }
ok(kal22[kal22.length - 1] === '2022-12-30' && n22 === 8 && tage22[0] === '2022-01-24>2022-01-26' && tage22[7] === '2022-12-12>2022-12-14', 'Werktage 2022 mit der echten Liste: acht Signale (24.01. ... 12.12.), je zwei Werktage vor der Bekanntgabe', n22 + ' Signale: ' + tage22.join(' '));
/* 7. Randfaelle: datum nicht lesbar -> kein Signal; Reihe ohne Zeile am Tag A-2 -> kein Signal fuer diese Sitzung */
var ohne = A.kunstSicht(reihe(k1), 2); ohne.datum = function () { return NaN; };
ok(R.signal(ohne, 2, P) === null, 'datum(i) nicht lesbar: kein Signal');
var luecke = reihe(k1); luecke.tag = [0, 1, 3, 4, 5, 6]; ['o', 'h', 'l', 'c', 'v'].forEach(function (f) { luecke[f] = luecke[f].slice(0, 6); });
ok(R.signal(A.kunstSicht(luecke, 2), 2, P) === null && R.signal(A.kunstSicht(luecke, 1), 1, P) === null, 'Reihe ohne Zeile am Tag A-2: kein Signal fuer diese Sitzung (keine Interpolation)');
ok(R.brauchtDatum === true && R.brauchtHochTief === false && R.brauchtRoh === false && R.brauchtMarkt === false, 'die Regel verlangt nur das Kalenderdatum (brauchtDatum)');
/* 8. Kein Blick nach vorn: Zeilen nach i veraendern -> Signal unveraendert; die Regel liest weder Kalender noch Kurse hinter i */
var vorn = reihe(k1); for (var z = 3; z < 7; z++) { vorn.c[z] = 1; vorn.o[z] = 99; vorn.v[z] = 1e9; }
var s2 = R.signal(A.kunstSicht(vorn, 2), 2, P);
ok(s2 && s2.dir === 1 && s2.bekanntgabe === s1.bekanntgabe, 'Zeilen nach i veraendert: Signal unveraendert (kein Blick nach vorn)');
var si = A.kunstSicht(vorn, 2), d3 = si.datum(3);
ok(d3 !== d3 && si.verstoesse() === 1, 'datum(i+1) liefert NaN und zaehlt als Verstoss', si.verstoesse());
R.signal(si, 2, P);
ok(si.verstoesse() === 1, 'die Regel selbst erzeugt keinen Verstoss', si.verstoesse());

console.log(fails ? fails + ' TEST(S) ROT' : 'ALLE TESTS GRUEN');
process.exit(fails ? 1 : 0);
