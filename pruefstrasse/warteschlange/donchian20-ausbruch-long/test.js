'use strict';
/* Tests des Kandidaten donchian20-ausbruch-long (FORM.md §4): Kunstdaten je Regelzeile, Randfaelle, kein Blick nach vorn.
 *   node pruefstrasse/warteschlange/donchian20-ausbruch-long/test.js   -> Rueckgabewert 0 = gruen */
var path = require('path');
var R = require('./regel.js');
var A = require(path.join(__dirname, '..', '..', 'adapter', 'tag.js'));
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }

/** Kunstreihe: n Tage flach bei 100 (Hoch 101, Tief 99), dann ab Tag `ab` ein Kanal, der nicht faellt; Schluss am Tag `sig` auf `cSig`. */
function reihe(n, aenderungen) {
  var sp = { reihe: 'KUNST', tag: [], o: [], h: [], l: [], c: [], v: [] };
  for (var i = 0; i < n; i++) { sp.tag.push(i); sp.o.push(100); sp.h.push(101); sp.l.push(99); sp.c.push(100); sp.v.push(1000); }
  (aenderungen || []).forEach(function (a) { Object.keys(a).forEach(function (f) { if (f !== 'i') sp[f][a.i] = a[f]; }); });
  return sp;
}
var P = { N: 20, confirmBps: 15 };

/* 1. Regelzeile 1-3: Ausbruch am Tag 40 (Schluss 101,2 > 101 x 1,0015 = 101,1515), Kanal 'seit' (flach) -> Signal long */
var sp = reihe(60, [{ i: 40, c: 101.2, h: 101.3 }]);
var s = R.signal(A.kunstSicht(sp, 40), 40, P);
ok(s && s.dir === 1, 'Ausbruch ueber die obere Linie x (1 + 15 Bp) gibt Signal long', JSON.stringify(s));
ok(s && s.oben === 101 && s.unten === 99, 'Signal traegt die Linie des Signaltags (oben 101, unten 99)');
/* 2. Knapp unter der Bestaetigungsschwelle: 101,15 < 101,1515 -> kein Signal */
ok(R.signal(A.kunstSicht(reihe(60, [{ i: 40, c: 101.15 }]), 40), 40, P) === null, 'Schluss unter oben x (1 + 15 Bp) ist kein Ausbruch');
/* 3. Regelzeile 2: Kanal 'ab' (beide Linien unter dem Stand vor 10 Tagen) sperrt long */
var ab = reihe(60);
for (var i = 20; i < 40; i++) { ab.h[i] = 101 - (i - 19) * 0.2; ab.l[i] = 99 - (i - 19) * 0.2; ab.c[i] = 100 - (i - 19) * 0.2; }
ab.c[40] = 120; ab.h[40] = 120;
var kAb = R.kanal(A.kunstSicht(ab, 40), 40, 20);
ok(kAb && kAb.richtung === 'ab', 'fallender Kanal heisst ab', kAb && kAb.richtung);
ok(R.signal(A.kunstSicht(ab, 40), 40, P) === null, 'im Kanal ab gibt es keinen Ausbruch nach oben');
/* 4. Regelzeile 3 spiegelbildlich: Ausbruch nach unten im flachen Kanal -> short */
var sh = R.signal(A.kunstSicht(reihe(60, [{ i: 40, c: 98.8, l: 98.7 }]), 40), 40, P);
ok(sh && sh.dir === -1, 'Ausbruch unter die untere Linie gibt Signal short');
/* 5. Regelzeile 4: Bestaetigung am Folgetag gegen dieselbe Linie */
var spB = reihe(60, [{ i: 40, c: 101.2, h: 101.3 }, { i: 41, c: 101.05 }]);
ok(R.bestaetigt(A.kunstSicht(spB, 41), 41, P, s) === true, 'Folgetag ueber der Linie bestaetigt (101,05 > 101)');
spB.c[41] = 100.9;
ok(R.bestaetigt(A.kunstSicht(spB, 41), 41, P, s) === false, 'Folgetag unter der Linie lehnt ab (100,9 < 101)');
/* 6. Randfaelle: Mindestvorlauf 30 Tage, NaN im Fenster */
ok(R.signal(A.kunstSicht(reihe(60, [{ i: 29, c: 120 }]), 29), 29, P) === null, 'vor Tag 30 kein Kanal (Mindestvorlauf N + N/2)');
ok(R.signal(A.kunstSicht(reihe(60, [{ i: 30, c: 120, h: 120 }]), 30), 30, P) !== null, 'am Tag 30 ist der Kanal da', 'Signal');
var nan = reihe(60, [{ i: 40, c: 101.2 }]); for (var q = 20; q < 40; q++) { nan.h[q] = NaN; nan.l[q] = NaN; }
ok(R.signal(A.kunstSicht(nan, 40), 40, P) === null, 'Fenster ohne Hoch/Tief gibt keinen Kanal');
ok(R.brauchtHochTief === true, 'die Regel meldet, dass sie Hoch/Tief braucht');
/* 7. Kein Blick nach vorn: Zeilen nach i veraendern -> Signal unveraendert; Zugriff hinter i liefert NaN und zaehlt */
var vorn = reihe(60, [{ i: 40, c: 101.2, h: 101.3 }]);
for (var z = 41; z < 60; z++) { vorn.c[z] = 50 + z; vorn.h[z] = 200; vorn.l[z] = 1; vorn.o[z] = 77; }
var s2 = R.signal(A.kunstSicht(vorn, 40), 40, P);
ok(s2 && s2.dir === 1 && s2.oben === s.oben && s2.unten === s.unten, 'Zeilen nach i veraendert: Signal unveraendert (kein Blick nach vorn)');
var si = A.kunstSicht(vorn, 40), c41 = si.c(41);
ok(c41 !== c41 && si.verstoesse() === 1, 'Zugriff auf i+1 liefert NaN und zaehlt als Verstoss', si.verstoesse());
R.signal(si, 40, P);
ok(si.verstoesse() === 1, 'die Regel selbst erzeugt keinen Verstoss', si.verstoesse());

console.log(fails ? fails + ' TEST(S) ROT' : 'ALLE TESTS GRUEN');
process.exit(fails ? 1 : 0);
