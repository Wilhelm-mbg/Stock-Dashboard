'use strict';
/* Pruefungen zu Auftrag Nr. 100. Aufruf aus der Repo-Wurzel:
 *   node --max-old-space-size=6144 studien/momentum-zufall-2026-10/test.js            (Teil I und II)
 *   node studien/momentum-zufall-2026-10/test.js --ohne-panel                         (nur Teil I)
 * Teil I  Handfaelle ohne Panel: die Ziehung (Zahl, nur Korbwerte, keine doppelt, wiederholbar, Buecher verschieden, im Groben gleich
 *         verteilt, Formel aus REGEL.md Teil C 3 unabhaengig nachgebaut), der Einsatzweg ueber zielAm (eigener Zwischenspeicher, das
 *         echte Q bleibt unberuehrt, "zu wenig" wird durchgereicht), die Klinken, Perzentil und Entscheidregel an gesetzten Zahlen.
 * Teil II echtes Panel v2.3: Selbstpruefung (Momentum-Buch trifft Nr. 96 auf den Cent) und Durchreich-Probe (auf das Bit); am ersten
 *         Stichtag beider Fenster je 200 Ziehungen gegen momentumZiel (alle zulaessig), keine Referenzreihe, wiederholbar; ein
 *         Zufallsbuch zweimal gerechnet ist auf das Bit gleich. */
var crypto = require('crypto');
var L = require('./lauf.js');                     /* setzt RUECKBLICK_PANEL=v2.3, bevor kleinst.js/rueckblick.js geladen werden */
var S = L.S, R = L.R, MH = L.MH;

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 1e-9 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function wirft(name, f, teil) { var w = false; try { f(); } catch (e) { w = !teil || String(e.message).indexOf(teil) >= 0; if (!w) console.log('   ' + e.message); } ok(name, w); }

/* ================= Teil I: Handfaelle ================= */
var SYMS = [];
for (var i = 1; i <= 187; i++) SYMS.push('W' + String(i).padStart(3, '0'));
var KORB_UMSATZ = SYMS.slice().reverse();          /* Reihenfolge wie korbZiel sie liefert (hier: absichtlich nicht sortiert) */
var T = { kal: { tage: ['2020-01-02', '2020-01-03', '2020-01-06', '2020-01-07'] }, symIdx: {} };
SYMS.forEach(function (s, k) { T.symIdx[s] = k; });
T.symIdx.SPY = 187;
var Q = { ref: SYMS.map(function () { return false; }).concat([true]), korbCache: {} };
var E1 = { ziel: SYMS.slice(0, 19), zuWenig: false, zulaessig: 187, geprueft: 187, zulaessigBreit: 900, korb: KORB_UMSATZ, korbUmsatz: KORB_UMSATZ.map(function (x, k) { return 1e9 - k; }) };
var E2 = { ziel: [], zuWenig: true, zulaessig: 0, geprueft: 0, zulaessigBreit: 0, korb: [], korbUmsatz: [] };
Q.korbCache[1] = { breit: { ziel: [] }, koerbe: { 187: E1 } };
Q.korbCache[2] = { breit: { ziel: [] }, koerbe: { 187: E2 } };

/* 1. Die Ziehung selbst */
var z5 = L.ziehe(E1.korb, 19, 5, '2020-01-03');
ok('Ziehung: genau 19 Werte', z5.length === 19);
ok('Ziehung: keiner doppelt', new Set(z5).size === 19);
ok('Ziehung: nur Werte aus dem Korb', z5.every(function (x) { return E1.korb.indexOf(x) >= 0; }));
ok('Ziehung: wiederholbar (gleicher Startwert, gleicher Stichtag -> dieselbe Liste)', L.ziehe(E1.korb, 19, 5, '2020-01-03').join() === z5.join());
ok('Ziehung: unabhaengig von der Reihenfolge der Korbliste (wird nach Zeichencode sortiert)', L.ziehe(SYMS, 19, 5, '2020-01-03').join() === z5.join());
ok('Ziehung: anderes Buch -> andere Liste', L.ziehe(E1.korb, 19, 6, '2020-01-03').join() !== z5.join());
ok('Ziehung: anderer Stichtag -> andere Liste', L.ziehe(E1.korb, 19, 5, '2020-01-06').join() !== z5.join());
ok('Ziehung: die Eingabe bleibt unveraendert', E1.korb[0] === 'W187' && E1.korb.length === 187);
var alle = L.ziehe(E1.korb, 187, 1, '2020-01-03');
ok('Ziehung: z = m ergibt eine Vertauschung aller Werte', alle.length === 187 && new Set(alle).size === 187);
wirft('Ziehung: z groesser als der Korb wirft', function () { L.ziehe(E1.korb, 188, 1, '2020-01-03'); }, 'Zielzahl');
wirft('Ziehung: z = 0 wirft', function () { L.ziehe(E1.korb, 0, 1, '2020-01-03'); }, 'Zielzahl');
wirft('Ziehung: Stichtag ohne JJJJ-MM-TT wirft', function () { L.ziehe(E1.korb, 19, 1, 1234); }, 'Stichtag');

/* 2. Die Formel aus REGEL.md Teil C 3, hier unabhaengig nachgebaut (erster und zweiter Zug) */
function u(b, tag, j) { return parseInt(crypto.createHash('sha256').update('momentum-zufall-2026-10|' + b + '|' + tag + '|' + j).digest('hex').slice(0, 12), 16) / Math.pow(2, 48); }
var sortiert = SYMS.slice();                        /* W001 ... W187 ist schon nach Zeichencode sortiert */
var i0 = Math.floor(u(5, '2020-01-03', 0) * 187);
var nachZug0 = sortiert.slice(); nachZug0[0] = sortiert[i0]; nachZug0[i0] = sortiert[0];
var i1 = 1 + Math.floor(u(5, '2020-01-03', 1) * 186);
ok('Formel: erster Zug = sortiert[floor(u_0 * 187)]', z5[0] === sortiert[i0]);
ok('Formel: zweiter Zug = (nach dem ersten Tausch)[1 + floor(u_1 * 186)]', z5[1] === nachZug0[i1]);
nah('Formel: zufallU ist die nachgebaute Zahl', L.zufallU(5, '2020-01-03', 0), u(5, '2020-01-03', 0), 0);
var uMin = 1, uMax = 0;
for (var b = 1; b <= 500; b++) { var x = L.zufallU(b, '2020-01-03', 0); if (x < uMin) uMin = x; if (x > uMax) uMax = x; }
ok('Formel: u liegt in [0, 1)', uMin >= 0 && uMax < 1);

/* 3. Im Groben gleich verteilt: 3.000 Buecher am selben Stichtag, je Wert erwartet 3.000 x 19 / 187 = 304,8 Treffer */
var haeufig = {}, erster = {}, NB = 3000;
SYMS.forEach(function (s) { haeufig[s] = 0; erster[s] = 0; });
for (var b2 = 1; b2 <= NB; b2++) { var z = L.ziehe(E1.korb, 19, b2, '2020-01-03'); z.forEach(function (s) { haeufig[s]++; }); erster[z[0]]++; }
var erw = NB * 19 / 187, chi = 0, chiE = 0, erwE = NB / 187, minH = Infinity, maxH = 0;
SYMS.forEach(function (s) { chi += Math.pow(haeufig[s] - erw, 2) / erw; chiE += Math.pow(erster[s] - erwE, 2) / erwE; minH = Math.min(minH, haeufig[s]); maxH = Math.max(maxH, haeufig[s]); });
console.log('   Gleichverteilung: Treffer je Wert ' + minH + ' bis ' + maxH + ' (erwartet 304,8), Chi-Quadrat ' + chi.toFixed(1) + ' / erster Platz ' + chiE.toFixed(1) + ' (186 Freiheitsgrade)');
ok('Gleichverteilung: jeder Wert 222 bis 388 Treffer (erwartet 304,8 +- 5 Standardabweichungen)', minH >= 222 && maxH <= 388);
ok('Gleichverteilung: Chi-Quadrat ueber alle Werte unter 260 (186 Freiheitsgrade, Mittel 186)', chi < 260);
ok('Gleichverteilung: Chi-Quadrat des ersten Platzes unter 260', chiE < 260);

/* 4. Der Einsatzweg ueber zielAm (REGEL.md Teil C 2) */
var Qz = L.qMit(T, Q, L.wahlZufall(T, Q, 5));
var zz = S.zielAm(T, Qz, 1, 187);
ok('Einsatzweg: zielAm liefert ueber das eigene Q die Ziehung von Buch 5', zz.ziel.join() === z5.join() && zz.art === 'zufall-5');
ok('Einsatzweg: die uebrigen Felder kommen vom echten Eintrag', zz.zulaessig === 187 && zz.geprueft === 187 && zz.zulaessigBreit === 900 && zz.korb === E1.korb && zz.zuWenig === false);
ok('Einsatzweg: derselbe Stichtag zweimal -> derselbe Eintrag (Zwischenspeicher des Buchs)', S.zielAm(T, Qz, 1, 187) === zz);
ok('Einsatzweg: das echte Q liefert weiter das Momentum-Ziel, unveraendert', S.zielAm(T, Q, 1, 187) === E1 && E1.ziel.join() === SYMS.slice(0, 19).join() && Object.keys(Q.korbCache).length === 2);
ok('Einsatzweg: "zu wenig" wird unveraendert durchgereicht', S.zielAm(T, Qz, 2, 187) === E2);
ok('Einsatzweg: Qz erbt alles andere vom echten Q', Qz.ref === Q.ref && Object.getPrototypeOf(Qz) === Q);
var Qd = L.qMit(T, Q, L.wahlDurch());
ok('Durchreichen: der echte Eintrag kommt unveraendert an', S.zielAm(T, Qd, 1, 187) === E1);
var Qk = L.qMit(T, Q, L.wahlKorb(T, Q)), zk = S.zielAm(T, Qk, 1, 187);
ok('Ganzer Korb: alle 187 Werte, nach Zeichencode', zk.ziel.length === 187 && zk.ziel.join() === SYMS.join() && zk.art === 'korb');
var Qk2 = L.qMit(T, { ref: Q.ref, korbCache: { 1: { koerbe: { 187: Object.assign({}, E1, { zulaessig: 186 }) } } } }, L.wahlKorb(T, Q));
wirft('Ganzer Korb: nicht 187 zulaessige wirft', function () { S.zielAm(T, Qk2, 1, 187); }, 'ganzer Korb');

/* 5. Die Klinken je Ziehung */
wirft('Klinke: falsche Zahl', function () { L.pruefeZiehung(T, Q, E1, z5.slice(0, 18)); }, 'gezogen');
wirft('Klinke: Wert nicht im Korb', function () { L.pruefeZiehung(T, Q, { ziel: ['A'], korb: ['W001'] }, ['W002']); }, 'nicht im Korb');
wirft('Klinke: Wert doppelt', function () { L.pruefeZiehung(T, Q, { ziel: ['A', 'B'], korb: ['W001', 'W002'] }, ['W001', 'W001']); }, 'doppelt');
wirft('Klinke: Referenzreihe', function () { L.pruefeZiehung(T, Q, { ziel: ['A'], korb: ['SPY'] }, ['SPY']); }, 'Referenzreihe');
ok('Klinke: die echte Ziehung geht durch', (function () { try { L.pruefeZiehung(T, Q, E1, z5); return true; } catch (e) { return false; } })());

/* 6. Perzentil und Entscheidregel an gesetzten Zahlen */
var eins200 = []; for (var k = 1; k <= 200; k++) eins200.push(201 - k);   /* absichtlich absteigend */
nah('Perzentil: 95. von 1..200 = 190,05 (h = 199 x 0,95 = 189,05)', L.perzentil(eins200, 0.95), 190.05, 1e-9);
nah('Perzentil: 5. von 1..200 = 10,95', L.perzentil(eins200, 0.05), 10.95, 1e-9);
nah('Perzentil: Median-Lage 0,5 = 100,5', L.perzentil(eins200, 0.5), 100.5, 1e-12);
nah('Perzentil: 100. = Maximum', L.perzentil(eins200, 1), 200, 0);
var st1 = L.fensterStat(191, 100, eins200, 5);
ok('Statistik: Rang 1 + Zahl darueber (191 -> 9 darueber -> Rang 10)', st1.rang === 10 && st1.zufallUeberMomentum === 9);
ok('Statistik: ueber P95 strikt (191 > 190,05)', st1.ueber95 === true);
ok('Statistik: genau auf P95 ist nicht darueber', L.fensterStat(L.perzentil(eins200, 0.95), 100, eins200, 5).ueber95 === false);   /* 199 x 0,95 ist in Gleitkomma 189,0499... */
ok('Statistik: vor SPY strikt (101..200 -> 100 Buecher), Median 100,5 vor 100', st1.vorSpy === 100 && st1.anteilVorSpy === 0.5 && st1.medianVorSpy === true);
ok('Statistik: Median gleich SPY ist nicht vor SPY', L.fensterStat(191, 100.5, eins200, 5).medianVorSpy === false);
var J = function (a, b, c, d) { return { A: { ueber95: a, medianVorSpy: c }, B: { ueber95: b, medianVorSpy: d } }; };
ok('Regel: beide ueber P95 -> die Auswahl traegt (auch wenn kein Median vor SPY)', L.urteil(J(true, true, false, false)) === 'die Auswahl trägt');
ok('Regel: eines nicht ueber P95, beide Mediane vor SPY -> der Korb traegt', L.urteil(J(true, false, true, true)) === 'der Korb trägt' && L.urteil(J(false, false, true, true)) === 'der Korb trägt');
ok('Regel: eines nicht ueber P95, nur ein Median vor SPY -> nicht entscheidbar', L.urteil(J(true, false, false, true)) === 'nicht entscheidbar' && L.urteil(J(false, true, true, false)) === 'nicht entscheidbar');
ok('Regel: keines ueber P95, kein Median vor SPY -> nicht entscheidbar', L.urteil(J(false, false, false, false)) === 'nicht entscheidbar');
ok('Verteilung als Text: Stufen von 2 Pp', L.verteilungText([-1, 0.5, 3.2, 3.9]) === '−2 bis +0: 1 · +0 bis +2: 1 · +2 bis +4: 2');

/* ================= Teil II: echtes Panel v2.3 ================= */
if (process.argv.indexOf('--ohne-panel') < 0) {
  var V = L.vorbereitung();
  var SP = L.selbstpruefung(V);
  ok('Selbstpruefung: Momentum-Buch A-187 trifft Nr. 96 auf den Cent', SP.laeufe['A-187'].bestanden === true);
  ok('Selbstpruefung: Momentum-Buch B-187 trifft Nr. 96 auf den Cent', SP.laeufe['B-187'].bestanden === true);
  ok('Durchreich-Probe A und B auf das Bit', SP.durchreichen['A-187'].bitgleich === true && SP.durchreichen['B-187'].bitgleich === true);
  ['A', 'B'].forEach(function (f) {
    var F = V.F[f], s = V.Q.ptage[V.Q.ord[F.von] - 1], tag = String(V.T.kal.tage[s]), e = S.zielAm(V.T, V.Q, s, 187), roh = R.rohMapAm(V.T, V.Q, s), listen = {}, fehler = [];
    ok('Panel ' + f + ': erster Stichtag ' + tag + ', Korb 187, Momentum-Ziel 19', e.korb.length === 187 && e.ziel.length === 19 && !e.zuWenig);
    for (var b3 = 1; b3 <= 200; b3++) {
      var zl = S.zielAm(V.T, L.qMit(V.T, V.Q, L.wahlZufall(V.T, V.Q, b3)), s, 187).ziel, roh2 = {};
      zl.forEach(function (x) { roh2[x] = roh[x]; });
      var r = MH.momentumZiel(roh2, { nowMs: V.Q.ms[s] });
      if (zl.length !== 19 || r.korb.zulaessig !== 19 || r.korb.geprueft !== 19) fehler.push(b3 + ': ' + zl.length + ' gezogen, ' + r.korb.zulaessig + ' zulaessig');
      if (zl.some(function (x) { return V.Q.ref[V.T.symIdx[x]]; })) fehler.push(b3 + ': Referenzreihe');
      if (S.zielAm(V.T, L.qMit(V.T, V.Q, L.wahlZufall(V.T, V.Q, b3)), s, 187).ziel.join() !== zl.join()) fehler.push(b3 + ': nicht wiederholbar');
      listen[zl.join()] = true;
    }
    if (fehler.length) console.log('   ' + fehler.slice(0, 5).join('; '));
    ok('Panel ' + f + ': 200 Ziehungen - je 19, alle nach momentumZiel zulaessig, keine Referenzreihe, wiederholbar', fehler.length === 0);
    ok('Panel ' + f + ': 200 verschiedene Listen', Object.keys(listen).length === 200);
    ok('Panel ' + f + ': das echte Q liefert danach weiter das Momentum-Ziel', S.zielAm(V.T, V.Q, s, 187) === e);
  });
  var a1 = L.k0(V, 'B', L.qMit(V.T, V.Q, L.wahlZufall(V.T, V.Q, 1))), a2 = L.k0(V, 'B', L.qMit(V.T, V.Q, L.wahlZufall(V.T, V.Q, 1)));
  ok('Wiederholbar: Zufallsbuch 1 in B zweimal gerechnet ist auf das Bit gleich', a1.kz.buchEnde === a2.kz.buchEnde && a1.L.tage.every(function (x, j) { return x.buch === a2.L.tage[j].buch; }));
  ok('Zufallsbuch 1 in B: dieselben Umschichtungstage wie das Momentum-Buch, je 19 Ziele', a1.L.umschichtungen.length === 20 && a1.L.umschichtungen.every(function (x) { return x.zielzahl === 19 && x.zulaessig === 187; }));
}

console.log('\n' + gut + ' bestanden, ' + schlecht + ' fehlgeschlagen');
if (schlecht) process.exit(1);
