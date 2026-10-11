'use strict';
/* Tests des Kandidaten hochvolumen-praemie (FORM.md §4): Kunstdaten je Regelzeile, Randfaelle, kein Blick nach vorn.
 *   node pruefstrasse/warteschlange/hochvolumen-praemie/test.js   -> Rueckgabewert 0 = gruen */
var path = require('path');
var R = require('./regel.js');
var A = require(path.join(__dirname, '..', '..', 'adapter', 'tag.js'));
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }

/** Kunstreihe: n Tage, Kurs 20, Stueckumsatz 1000 + (i mod 7) * 10 (verschieden, damit Raenge eindeutig sind). */
function reihe(n, aenderungen) {
  var sp = { reihe: 'KUNST', tag: [], o: [], h: [], l: [], c: [], v: [] };
  for (var i = 0; i < n; i++) { sp.tag.push(i); sp.o.push(20); sp.h.push(20.2); sp.l.push(19.8); sp.c.push(20); sp.v.push(1000 + (i % 7) * 10); }
  (aenderungen || []).forEach(function (a) { Object.keys(a).forEach(function (f) { if (f !== 'i') sp[f][a.i] = a[f]; }); });
  return sp;
}
var P = { fenster: 50, rangMin: 46, mindestKurs: 5 };

/* 1. Regelzeile 1-2: Umsatzspitze am Tag 60 (5000 Stueck) -> Rang 50, Signal long */
var sp = reihe(80, [{ i: 60, v: 5000 }]);
var s = R.signal(A.kunstSicht(sp, 60), 60, P);
ok(s && s.dir === 1 && s.rang === 50, 'hoechster Dollarumsatz im 50-Tage-Fenster gibt Signal long', JSON.stringify(s));
/* 2. Rang genau 46 feuert, Rang 45 nicht: Tag 60 bekommt einen Umsatz, der genau 4 bzw. 5 Tage des Fensters nicht uebertrifft */
var g = reihe(80); for (var q = 11; q < 60; q++) g.v[q] = 1000 + (q - 11);   /* 49 Referenztage 1000..1048 */
g.v[60] = 1044.5;   /* uebertrifft 1000..1044 (45 Tage) -> Rang 46 */
ok((R.signal(A.kunstSicht(g, 60), 60, P) || {}).rang === 46, 'Rang 46 (oberste 10 %) feuert', R.rang(A.kunstSicht(g, 60), 60, P));
g.v[60] = 1043.5;   /* uebertrifft 1000..1043 (44 Tage) -> Rang 45 */
ok(R.signal(A.kunstSicht(g, 60), 60, P) === null, 'Rang 45 feuert nicht', R.rang(A.kunstSicht(g, 60), 60, P));
/* 3. Dollarumsatz, nicht Stueck: gleiche Stueckzahl, aber Kurs am Tag 60 doppelt -> feuert; Stueckspitze bei halbem Kurs -> nicht */
var d1 = reihe(80, [{ i: 60, c: 40, v: 1060 }]);
ok(R.signal(A.kunstSicht(d1, 60), 60, P) !== null, 'doppelter Kurs bei normaler Stueckzahl ist hoher Dollarumsatz');
var d2 = reihe(80, [{ i: 60, c: 8, v: 2000 }]);
ok(R.signal(A.kunstSicht(d2, 60), 60, P) === null, 'mehr Stueck bei weniger als halbem Kurs ist kein hoher Dollarumsatz');
/* 4. Normaler Tag feuert nicht */
ok(R.signal(A.kunstSicht(reihe(80), 60), 60, P) === null, 'gewoehnlicher Umsatz gibt kein Signal');
/* 5. Randfaelle: zu kurze Reihe, fehlende Werte, Kurs unter 5 $ */
ok(R.signal(A.kunstSicht(reihe(80, [{ i: 48, v: 9000 }]), 48), 48, P) === null, 'vor Tag 49 kein volles Fenster');
ok(R.signal(A.kunstSicht(reihe(80, [{ i: 49, v: 9000 }]), 49), 49, P) !== null, 'am Tag 49 ist das Fenster voll');
ok(R.signal(A.kunstSicht(reihe(80, [{ i: 60, v: 9000 }, { i: 30, c: NaN }]), 60), 60, P) === null, 'fehlender Schluss im Fenster: kein Signal');
ok(R.signal(A.kunstSicht(reihe(80, [{ i: 60, v: NaN }]), 60), 60, P) === null, 'fehlender Umsatz am Signaltag: kein Signal');
ok(R.signal(A.kunstSicht(reihe(80, [{ i: 60, v: 9000 }, { i: 25, c: 4.9 }]), 60), 60, P) === null, 'Kurs unter 5 $ im Referenzzeitraum: kein Signal');
ok(R.signal(A.kunstSicht(reihe(80, [{ i: 60, v: 9000 }, { i: 5, c: 4.9 }]), 60), 60, P) !== null, 'Kurs unter 5 $ vor dem Fenster zaehlt nicht');
ok(R.brauchtHochTief === false, 'die Regel braucht kein Hoch/Tief (laeuft auf dem Panel)');
/* 6. Kein Blick nach vorn: Zeilen nach i veraendern -> Signal unveraendert; Zugriff hinter i liefert NaN und zaehlt */
var vorn = reihe(80, [{ i: 60, v: 5000 }]);
for (var z = 61; z < 80; z++) { vorn.v[z] = 1e9; vorn.c[z] = 1; vorn.o[z] = 77; }
var s2 = R.signal(A.kunstSicht(vorn, 60), 60, P);
ok(s2 && s2.dir === 1 && s2.rang === s.rang, 'Zeilen nach i veraendert: Signal unveraendert (kein Blick nach vorn)');
var si = A.kunstSicht(vorn, 60), v61 = si.v(61);
ok(v61 !== v61 && si.verstoesse() === 1, 'Zugriff auf i+1 liefert NaN und zaehlt als Verstoss', si.verstoesse());
R.signal(si, 60, P);
ok(si.verstoesse() === 1, 'die Regel selbst erzeugt keinen Verstoss', si.verstoesse());

console.log(fails ? fails + ' TEST(S) ROT' : 'ALLE TESTS GRUEN');
process.exit(fails ? 1 : 0);
