'use strict';
/* Tests des Kandidaten umkehr-nach-vorzeichenserie (FORM.md §4): Kunstdaten je Regelzeile, Randfaelle, kein Blick nach vorn.
 *   node pruefstrasse/warteschlange/umkehr-nach-vorzeichenserie/test.js   -> Rueckgabewert 0 = gruen */
var path = require('path');
var R = require('./regel.js');
var A = require(path.join(__dirname, '..', '..', 'adapter', 'tag.js'));
var fails = 0;
function ok(c, name, extra) { console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }

/** Kunstreihe aus einer Schrittfolge: '+' Anstieg 1 %, '-' Ruecklauf 1 %, '0' unveraendert; davor 20 Tage im Zickzack (+/-). */
function reihe(schritte, nachher) {
  var sp = { reihe: 'KUNST', tag: [], o: [], h: [], l: [], c: [], v: [] }, k = 20, folge = '';
  for (var z = 0; z < 20; z++) folge += z % 2 ? '-' : '+';
  folge += schritte + (nachher || '');
  sp.tag.push(0); sp.o.push(k); sp.h.push(k); sp.l.push(k); sp.c.push(k); sp.v.push(1000);
  for (var i = 0; i < folge.length; i++) {
    var ch = folge[i]; k = ch === '+' ? k * 1.01 : ch === '-' ? k * 0.99 : k;
    sp.tag.push(i + 1); sp.o.push(k); sp.h.push(k); sp.l.push(k); sp.c.push(k); sp.v.push(1000);
  }
  return sp;
}
var P = { folgeMin: 5 };
function letzte(schritte) { return 20 + schritte.length; }                 /* Zeile des letzten Schritts */
function sig(sp, i) { return R.signal(A.kunstSicht(sp, i), i, P); }
function sigS(schritte) { var sp = reihe(schritte, '++++'); return sig(sp, letzte(schritte)); }

/* 1. Regelzeile: fuenf Minustage nach einem Plustag -> Signal long */
var s = sigS('+-----');
ok(s && s.dir === 1 && s.folge === 5, 'fuenf Minustage in Folge geben Signal long', JSON.stringify(s));
/* 2. Grenze folgeMin: vier feuern nicht, sechs und acht feuern */
ok(sigS('+----') === null, 'vier Minustage feuern nicht');
ok(sigS('+------') !== null && sigS('+------').folge === 6, 'sechs Minustage feuern (Folge 6)');
ok(sigS('+--------') !== null, 'acht Minustage feuern');
/* 3. Nulltage verlaengern eine Folge (Quelle §5.1), eroeffnen aber keine */
ok(sigS('+--0--') !== null && sigS('+--0--').folge === 5, 'Nulltag mitten in der Folge zaehlt mit (2 + 0 + 2 = 5)');
ok(sigS('+----0') !== null, 'Nulltag am Signaltag verlaengert vier Minustage auf fuenf');
ok(sigS('+00----') === null, 'fuehrende Nulltage eroeffnen keine Folge (nur 4 echte + davor 0)');
ok(sigS('+00000') === null, 'nur Nulltage sind keine Folge');
ok(sigS('+0-----') !== null && sigS('+0-----').folge === 5, 'Nulltag vor der Folge zaehlt nicht mit (Folge 5)');
/* 4. Ein Plustag unterbricht; Plus-Folgen geben kein Signal (die Short-Seite ist nicht Teil des Kandidaten) */
ok(sigS('+---+--') === null, 'Plustag unterbricht die Folge');
ok(sigS('-+++++++') === null, 'Plus-Folge gibt kein Signal');
/* 5. Randfaelle: zu kurze Reihe, fehlende Werte */
var kurz = { reihe: 'K', tag: [0, 1, 2, 3, 4], o: [10, 9, 8, 7, 6], h: [10, 9, 8, 7, 6], l: [10, 9, 8, 7, 6], c: [10, 9, 8, 7, 6], v: [1, 1, 1, 1, 1] };
ok(R.signal(A.kunstSicht(kurz, 4), 4, P) === null, 'Reihe mit 5 Zeilen (4 Renditen) gibt kein Signal');
var kurz6 = { reihe: 'K', tag: [0, 1, 2, 3, 4, 5], o: [10, 9, 8, 7, 6, 5], h: [10, 9, 8, 7, 6, 5], l: [10, 9, 8, 7, 6, 5], c: [10, 9, 8, 7, 6, 5], v: [1, 1, 1, 1, 1, 1] };
ok(R.signal(A.kunstSicht(kurz6, 5), 5, P) !== null, 'Reihe mit 6 Zeilen (5 Minus-Renditen ab Reihenanfang) feuert');
var luecke = reihe('+-----', '++++'); luecke.c[letzte('+-----') - 2] = NaN;
ok(sig(luecke, letzte('+-----')) === null, 'fehlender Schluss in der Folge: kein Signal');
var heute = reihe('+-----', '++++'); heute.c[letzte('+-----')] = NaN;
ok(sig(heute, letzte('+-----')) === null, 'fehlender Schluss am Signaltag: kein Signal');
var frueh = reihe('+-----', '++++'); frueh.c[3] = NaN;
ok(sig(frueh, letzte('+-----')) !== null, 'Luecke vor der Folge zaehlt nicht');
ok(R.brauchtHochTief === false && R.brauchtRoh === false && R.brauchtMarkt === false, 'braucht weder Hoch/Tief noch roh noch markt');
/* 6. Kein Blick nach vorn: Zeilen nach i veraendern -> Signal unveraendert; Zugriff hinter i liefert NaN und zaehlt */
var T = letzte('+-----'), vorn = reihe('+-----', '++++');
for (var z = T + 1; z < vorn.c.length; z++) { vorn.c[z] = 1; vorn.o[z] = 77; vorn.v[z] = 1e9; }
var s2 = sig(vorn, T);
ok(s2 && s2.dir === 1 && s2.folge === s.folge, 'Zeilen nach i veraendert: Signal unveraendert (kein Blick nach vorn)');
var si = A.kunstSicht(vorn, T), c1 = si.c(T + 1);
ok(c1 !== c1 && si.verstoesse() === 1, 'Zugriff auf i+1 liefert NaN und zaehlt als Verstoss', si.verstoesse());
R.signal(si, T, P);
ok(si.verstoesse() === 1, 'die Regel selbst erzeugt keinen Verstoss', si.verstoesse());

console.log(fails ? fails + ' TEST(S) ROT' : 'ALLE TESTS GRUEN');
process.exit(fails ? 1 : 0);
