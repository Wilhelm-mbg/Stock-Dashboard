'use strict';
/* Tests des Kandidaten grossanstieg-ohne-umsatz (FORM.md §4): Kunstdaten je Regelzeile, Randfaelle, kein Blick nach vorn.
 *   node pruefstrasse/warteschlange/grossanstieg-ohne-umsatz/test.js   -> Rueckgabewert 0 = gruen */
var path = require('path');
var R = require('./regel.js');
var A = require(path.join(__dirname, '..', '..', 'adapter', 'tag.js'));
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }

/** Kunstreihe: n Tage, Kurs 20, Stueckumsatz 1000 + (i mod 7) * 10 (streut, damit die Stdabw > 0 ist). */
function reihe(n, aenderungen) {
  var sp = { reihe: 'KUNST', tag: [], o: [], h: [], l: [], c: [], v: [] };
  for (var i = 0; i < n; i++) { sp.tag.push(i); sp.o.push(20); sp.h.push(20.2); sp.l.push(19.8); sp.c.push(20); sp.v.push(1000 + (i % 7) * 10); }
  (aenderungen || []).forEach(function (a) { Object.keys(a).forEach(function (f) { if (f !== 'i') sp[f][a.i] = a[f]; }); });
  return sp;
}
var P = { schwelleLog: 0.08, kappeLog: 0.5, fenster: 250, atvMax: 1.52 };
var T = 280;
function sig(sp, i) { return R.signal(A.kunstSicht(sp, i), i, P); }

/* 1. Regelzeile: +10 % (log 0,095) bei gewoehnlichem Umsatz -> Signal long */
var s = sig(reihe(300, [{ i: T, c: 22 }]), T);
ok(s && s.dir === 1 && Math.abs(s.r - Math.log(1.1)) < 1e-12, 'Anstieg +10 % bei normalem Umsatz gibt Signal long', JSON.stringify(s));
/* 2. Schwelle 8 % (log): knapp darueber feuert, knapp darunter nicht; Kappe 0,5 (log) */
ok(sig(reihe(300, [{ i: T, c: 20 * Math.exp(0.0801) }]), T) !== null, 'log-Rendite 0,0801 feuert');
ok(sig(reihe(300, [{ i: T, c: 20 * Math.exp(0.0799) }]), T) === null, 'log-Rendite 0,0799 feuert nicht');
ok(sig(reihe(300, [{ i: T, c: 20 * Math.exp(0.49) }]), T) !== null, 'log-Rendite 0,49 feuert (unter der Kappe)');
ok(sig(reihe(300, [{ i: T, c: 20 * Math.exp(0.51) }]), T) === null, 'log-Rendite 0,51 feuert nicht (Kappe 50 %)');
/* 3. Nur Anstiege: Sturz -10 % gibt kein Signal (die Regel ist long, die Sturz-Seite ist nicht Teil des Kandidaten) */
ok(sig(reihe(300, [{ i: T, c: 18 }]), T) === null, 'Sturz -10 % gibt kein Signal');
/* 4. ATV-Grenze 1,52: Umsatz am Ereignistag genau knapp unter / ueber Mittel + 1,52 Stdabw des 250-Tage-Fensters */
var g = reihe(300); var su = 0, su2 = 0; for (var j = T - 250; j < T; j++) { su += g.v[j]; su2 += g.v[j] * g.v[j]; }
var m = su / 250, sd = Math.sqrt((su2 - 250 * m * m) / 249);
var u1 = reihe(300, [{ i: T, c: 22, v: m + 1.519 * sd }]), u2 = reihe(300, [{ i: T, c: 22, v: m + 1.521 * sd }]);
ok(sig(u1, T) !== null, 'ATV 1,519 feuert', R.kennzahlen(A.kunstSicht(u1, T), T, P).atv);
ok(sig(u2, T) === null, 'ATV 1,521 feuert nicht', R.kennzahlen(A.kunstSicht(u2, T), T, P).atv);
ok(sig(reihe(300, [{ i: T, c: 22, v: 50000 }]), T) === null, 'Anstieg mit Umsatzspitze (hohes ATV) gibt kein Signal');
ok(sig(reihe(300, [{ i: T, c: 22, v: 0 }]), T) !== null, 'Anstieg ohne Umsatz (ATV negativ) feuert');
/* 5. Gewoehnlicher Tag feuert nicht */
ok(sig(reihe(300), T) === null, 'gewoehnlicher Tag gibt kein Signal');
/* 6. Randfaelle: zu kurze Reihe, fehlende Werte, konstanter Umsatz */
ok(sig(reihe(300, [{ i: 249, c: 22 }]), 249) === null, 'vor Zeile 250 kein volles 250-Tage-Fenster');
ok(sig(reihe(300, [{ i: 250, c: 22 }]), 250) !== null, 'ab Zeile 250 ist das Fenster voll');
ok(sig(reihe(300, [{ i: T, c: 22 }, { i: 100, v: NaN }]), T) === null, 'fehlender Umsatz im Fenster: kein Signal');
ok(sig(reihe(300, [{ i: T, c: 22 }, { i: 100, c: NaN }]), T) === null, 'fehlender Schluss im Fenster: kein Signal');
ok(sig(reihe(300, [{ i: T, c: 22, v: NaN }]), T) === null, 'fehlender Umsatz am Ereignistag: kein Signal');
ok(sig(reihe(300, [{ i: T, c: NaN }]), T) === null, 'fehlender Schluss am Ereignistag: kein Signal');
var flach = reihe(300, [{ i: T, c: 22 }]); for (var q = 0; q < 300; q++) flach.v[q] = 1000;
ok(sig(flach, T) === null, 'konstanter Umsatz (Stdabw 0): kein Signal');
ok(sig(reihe(300, [{ i: T, c: 22 }, { i: 20, v: NaN }]), T) !== null, 'Luecke vor dem Fenster zaehlt nicht');
ok(R.brauchtHochTief === false && R.brauchtRoh === false && R.brauchtMarkt === false, 'braucht weder Hoch/Tief noch roh noch markt');
/* 7. Kein Blick nach vorn: Zeilen nach i veraendern -> Signal unveraendert; Zugriff hinter i liefert NaN und zaehlt */
var vorn = reihe(300, [{ i: T, c: 22 }]);
for (var z = T + 1; z < 300; z++) { vorn.v[z] = 1e9; vorn.c[z] = 1; vorn.o[z] = 77; }
var s2 = sig(vorn, T);
ok(s2 && s2.dir === 1 && s2.r === s.r && s2.atv === s.atv, 'Zeilen nach i veraendert: Signal unveraendert (kein Blick nach vorn)');
var si = A.kunstSicht(vorn, T), c1 = si.c(T + 1);
ok(c1 !== c1 && si.verstoesse() === 1, 'Zugriff auf i+1 liefert NaN und zaehlt als Verstoss', si.verstoesse());
R.signal(si, T, P);
ok(si.verstoesse() === 1, 'die Regel selbst erzeugt keinen Verstoss', si.verstoesse());

console.log(fails ? fails + ' TEST(S) ROT' : 'ALLE TESTS GRUEN');
process.exit(fails ? 1 : 0);
