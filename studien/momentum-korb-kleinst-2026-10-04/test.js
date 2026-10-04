'use strict';
/* Pruefungen zu Auftrag Nr. 85, Schritt 2. Aufruf aus der Repo-Wurzel:
 *   node --max-old-space-size=6144 studien/momentum-korb-kleinst-2026-10-04/test.js
 * Teil I   die Huelle und ihre Zaehler an Handfaellen (ohne Panel): der Schalter kommt an, die Huelle ergaenzt nur das Argument,
 *          die Zaehler stimmen mit der Rechnung von Hand, die Klinken schlagen an.
 * Teil II  ein Kunstpanel durch den Rechner aus Nr. 78 (korb.js, unveraendert): zwei Umschichtungen von Hand, ohne und mit Regel K;
 *          die Huelle wird je Umschichtung genau einmal gerufen; mit Regel K entsteht kein Kauf unter 5 % des Platzwerts.
 * Teil III die Saetze und die Pruefmarke an gesetzten Zahlen, Trockenlauf des Berichts am Kunstpanel.
 * Teil IV  echtes Panel, NUR ohne Regel und nur k = 0: die Selbstpruefung (vier Endwerte auf den Cent) und die Zahl der Aufrufe der Huelle.
 * Vor dem Siegel wird am echten Panel nichts mit eingeschalteter Regel gerechnet. Die Sollwerte der Kunstfaelle sind von Hand gerechnet
 * (Rechenweg in den Kommentaren). */
var path = require('path');
var KS = require('./kleinst.js');                 /* haengt die Huelle ein, bevor korb.js geladen wird */
var S = KS.S, R = KS.R, MH = KS.MH, H = KS.H;
var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 1e-6 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function wirft(name, f, teil) { var w = false; try { f(); } catch (e) { w = !teil || String(e.message).indexOf(teil) >= 0; if (!w) console.log('   ' + e.message); } ok(name, w); }
function kopie(x) { return JSON.parse(JSON.stringify(x)); }
function pos(b, s) { return b.positionen.filter(function (p) { return p.sym === s; })[0]; }
var AN = { kleinstAnteil: 0.05 }, AUS = { kleinstAnteil: 0 };

/* ================= Teil I: die Huelle und ihre Zaehler, von Hand ================= */

/* ===== 1. Die Huelle sitzt auf dem Modulobjekt, das auch der Rechner benutzt ===== */
ok('Huelle: mfhandel.planeUmschichtung und fuehreAus sind die Huelle, auf demselben Modulobjekt wie beim Rechner',
  MH === require(path.join(path.resolve(__dirname, '..', '..'), 'mfhandel.js')) && MH.planeUmschichtung === KS.planeHuelle && MH.fuehreAus === KS.fuehreHuelle &&
  KS.ECHT.planeUmschichtung !== KS.planeHuelle && KS.ECHT.fuehreAus !== KS.fuehreHuelle && KS.ECHT.planeUmschichtung.length === 4 && KS.ECHT.fuehreAus.length === 5);
ok('Huelle: das Mass ist 5 %, die Pruefmarke 2,0 Pp, genau vier Laeufe', KS.ANTEIL === 0.05 && KS.MARKE_PP === 2 &&
  KS.LAEUFE.map(function (l) { return l.name + ':' + l.fenster + ':' + l.korb; }).join(' ') === 'A-187:A:187 A-breit:A:null B-187:B:187 B-breit:B:null');
wirft('Huelle: ohne gesetzten Schalter rechnet sie nicht (planen)', function () { MH.planeUmschichtung(['A'], { cash: 1, positionen: [] }, { A: 1 }); }, 'ohne Schalter');
wirft('Huelle: ohne gesetzten Schalter rechnet sie nicht (ausfuehren)', function () { MH.fuehreAus({ cash: 1, positionen: [] }, { verkaufen: [], kaufen: [] }, 1, 20); }, 'ohne Schalter');

/* ===== 2. Handfaelle (dieselben wie in test-v6.js Abschnitt 95) =====
 * F1 Kleinstkauf (20 Bp): Depotwert 1002,0075 + 100 x 110 = 12002,0075; Platzwert / 3 = 4000,6692; 5 % = 200,03.
 *    B: geplant 40,0067 Stueck, Bargeld reicht fuer floor(1002,0075 / 100,2 x 10000) / 10000 = 10 Stueck (1000 $ = 25,0 % -> "verkleinert"), Rest 0,0075 $.
 *    C: geplant 80,0134 Stueck, Rest reicht fuer floor(0,0075 / 50,1 x 10000) / 10000 = 0,0001 Stueck (0,005 $ -> "Kleinstkauf"), Rest 0,00249 $.
 *    Mit Regel K faellt C weg (K1): 0,0001 Stueck waeren bezahlbar gewesen -> "ausgefallen nach K1"; Bargeld bleibt 0,0075 $.
 *    Kosten ohne: 0,002 x (1000 + 0,005) = 2,00001 $; mit: 0,002 x 1000 = 2 $.
 * F3 Kleinstbestand: Depotwert 500 + 11000 + 0,005 + 0,006 + 140 = 11640,011 (X ohne Kurs zaehlt nicht); Platzwert / 5 = 2328,0022; 5 % = 116,40011.
 *    Kleinstbestaende: F (0,005 $, Ziel), N (0,006 $, kein Ziel). S (140 $ = 6,01 %) und X (ohne Kurs) bleiben.
 *    Mit Regel K: verkauft F und N (Erloes 0,00499 + 0,005988), Bargeld 500,010978; Kaeufe in der Reihenfolge der Zielliste B, F, C:
 *      B: floor(500,010978 / 100,2 x 10000) / 10000 = 4,9901 Stueck (499,01 $ = 21,4 % -> "verkleinert"), Rest 0,002958 $;
 *      F: floor(0,002958 / 50,1 x 10000) / 10000 = 0 -> "ausgefallen mangels Bargeld";
 *      C: floor(0,002958 / 25,05 x 10000) / 10000 = 0,0001 Stueck -> unter 5 % -> "ausgefallen nach K1".
 *      Nach der Umschichtung: A, X, S, B = 4 Positionen; besetzte Plaetze B, A, S = 3 von 5; Kosten 0,002 x (0,005 + 0,006 + 499,01) = 0,998042 $.
 *    Ohne Regel: verkauft nur N; Bargeld 500,005988; B: 4,99 Stueck (499 $, "verkleinert"), Rest 0,007988 $; C: floor(0,007988 / 25,05 x 10000) / 10000
 *      = 0,0003 Stueck ("Kleinstkauf"). 6 Positionen; besetzt B, A, S = 3 von 5 (F und C sind Reste).
 *    F3 reich (50.000 $ Bargeld, mit Regel K): Depotwert 61140,011, Platzwert 12228,0022, 5 % = 611,40; Kleinstbestaende F, N und jetzt auch S (140 $);
 *      F und S sind Ziel und werden voll neu gekauft (244,56 und 122,28 Stueck), dazu B und C: vier volle Kaeufe. */
var F1 = { ziel: ['A', 'B', 'C'], buch: { cash: 1002.0075, positionen: [{ sym: 'A', stueck: 100, einstand: 50, seit: 1 }], trades: [] }, preise: { A: 110, B: 100, C: 50 } };
var F3 = { ziel: ['B', 'F', 'A', 'S', 'C'], buch: { cash: 500, positionen: [
  { sym: 'A', stueck: 100, einstand: 50, seit: 1 }, { sym: 'F', stueck: 0.0001, einstand: 50.1, seit: 1 }, { sym: 'N', stueck: 0.0002, einstand: 30, seit: 1 },
  { sym: 'X', stueck: 0.0001, einstand: 20, seit: 1 }, { sym: 'S', stueck: 1.4, einstand: 100, seit: 1 }], trades: [] }, preise: { A: 110, F: 50, N: 30, S: 100, B: 100, C: 25 } };
var F3R = kopie(F3); F3R.buch.cash = 50000;

/** Eine Umschichtung durch die Huelle (Schalter o), mit eigenem Zaehler. */
function durchHuelle(f, o) {
  var b = kopie(f.buch), Z = KS.neuerZaehler();
  H.opts = o; H.zaehler = Z;
  var plan, vor, n;
  try { plan = MH.planeUmschichtung(f.ziel, b, f.preise); vor = JSON.stringify(plan); n = MH.fuehreAus(b, plan, 1000, 20); }
  finally { H.opts = null; H.zaehler = null; }
  return { buch: b, plan: plan, n: n, Z: Z, spur: vor + '|' + JSON.stringify(plan) + '|' + JSON.stringify(b) + '|' + n };
}
/** Dieselbe Umschichtung mit den Funktionen der App direkt (ohne Huelle), Schalter als viertes / fuenftes Argument. */
function direkt(f, o) {
  var b = kopie(f.buch), plan = KS.ECHT.planeUmschichtung(f.ziel, b, f.preise, o), vor = JSON.stringify(plan), n = KS.ECHT.fuehreAus(b, plan, 1000, 20, o);
  return vor + '|' + JSON.stringify(plan) + '|' + JSON.stringify(b) + '|' + n;
}
/** Wie die App heute ruft: ohne viertes / fuenftes Argument. */
function wieHeute(f) {
  var b = kopie(f.buch), plan = KS.ECHT.planeUmschichtung(f.ziel, b, f.preise), vor = JSON.stringify(plan), n = KS.ECHT.fuehreAus(b, plan, 1000, 20);
  return vor + '|' + JSON.stringify(plan) + '|' + JSON.stringify(b) + '|' + n;
}

/* ===== 3. Die Huelle reicht den Schalter durch und ergaenzt nur das Argument ===== */
[['F1', F1], ['F3', F3], ['F3 reich', F3R]].forEach(function (x) {
  ok('Huelle ' + x[0] + ': Schalter aus = die Funktionen der App mit kleinstAnteil 0 = der Aufruf von heute (zeichengleich)',
    durchHuelle(x[1], AUS).spur === direkt(x[1], AUS) && direkt(x[1], AUS) === wieHeute(x[1]));
  ok('Huelle ' + x[0] + ': Schalter an = die Funktionen der App mit kleinstAnteil 0,05 (zeichengleich) - und anders als ohne',
    durchHuelle(x[1], AN).spur === direkt(x[1], AN) && direkt(x[1], AN) !== wieHeute(x[1]));
});
var f1o = durchHuelle(F1, AUS), f1m = durchHuelle(F1, AN), f3o = durchHuelle(F3, AUS), f3m = durchHuelle(F3, AN), f3r = durchHuelle(F3R, AN);
ok('F1 ohne: der Kleinstkauf entsteht (C 0,0001 Stueck), kein Feld kleinst', pos(f1o.buch, 'C').stueck === 0.0001 && pos(f1o.buch, 'B').stueck === 10 && !('kleinst' in f1o.plan) && f1o.n === 2);
ok('F1 mit: K1 kommt an - C wird nicht gekauft, Bargeld bleibt', !pos(f1m.buch, 'C') && pos(f1m.buch, 'B').stueck === 10 && f1m.n === 1 && Math.abs(f1m.buch.cash - 0.0075) < 1e-9 &&
  Array.isArray(f1m.plan.kleinst) && f1m.plan.kleinst.length === 0);
ok('F3 mit: K2 kommt an - F und N sind Kleinstbestaende, F wird an seiner Stelle neu geplant', f3m.plan.kleinst.join() === 'F,N' &&
  f3m.plan.kaufen.map(function (o) { return o.sym; }).join() === 'B,F,C' && f3m.plan.halten.join() === 'A,X,S' && !pos(f3m.buch, 'F') && !pos(f3m.buch, 'N'));
ok('F3 ohne: F gilt als gehalten, kein Feld kleinst', f3o.plan.halten.join() === 'A,F,X,S' && !('kleinst' in f3o.plan) && pos(f3o.buch, 'F').stueck === 0.0001);

/* ===== 4. Die Zaehler, von Hand ===== */
function zahl(Z) {
  return [Z.umschichtungen, Z.mitZuWenigBargeld, Z.kaeufeGeplant, Z.voll, Z.verkleinert, Z.kleinstkauf, Z.ausgefallen, Z.ausgefallenBargeld, Z.ausgefallenK1, Z.verkaeufe].join(' ');
}
function klein(Z) { return [Z.kleinstbestaende, Z.kleinstbestaendeZiel, Z.kleinstbestaendeNichtZiel, Z.kleinstVerkauft, Z.kleinstNeuGekauft, Z.kleinstKaufAusgefallen].join(' '); }
function platz(Z) { return [Z.positionenDanachMin, Z.positionenDanachMax, Z.zielplaetze, Z.plaetzeBesetzt, Z.plaetzeLeer].join(' '); }
/*                    Umsch zuWenig geplant voll verkl kleinst ausgef (Bargeld K1) Verkaeufe */
ok('Zaehler F1 ohne: 2 geplant = 0 voll, 1 verkleinert, 1 Kleinstkauf, 0 ausgefallen', zahl(f1o.Z) === '1 1 2 0 1 1 0 0 0 0');
ok('Zaehler F1 mit:  2 geplant = 0 voll, 1 verkleinert, 0 Kleinstkauf, 1 ausgefallen (nach K1)', zahl(f1m.Z) === '1 1 2 0 1 0 1 0 1 0');
ok('Zaehler F1: Kleinstbestaende keine; Plaetze ohne 3 Positionen / 2 von 3 besetzt, mit 2 Positionen / 2 von 3 besetzt',
  klein(f1o.Z) === '0 0 0 0 0 0' && klein(f1m.Z) === '0 0 0 0 0 0' && platz(f1o.Z) === '3 3 3 2 1' && platz(f1m.Z) === '2 2 3 2 1');
nah('Zaehler F1 ohne: Kosten 2,00001 $', f1o.Z.kosten, 2.00001, 1e-9);
nah('Zaehler F1 mit: Kosten 2,00 $', f1m.Z.kosten, 2, 1e-9);
ok('Zaehler F3 ohne: 2 geplant = 1 verkleinert, 1 Kleinstkauf; 1 Verkauf (N)', zahl(f3o.Z) === '1 1 2 0 1 1 0 0 0 1');
ok('Zaehler F3 mit:  3 geplant = 1 verkleinert, 2 ausgefallen (1 mangels Bargeld, 1 nach K1); 2 Verkaeufe', zahl(f3m.Z) === '1 1 3 0 1 0 2 1 1 2');
ok('Zaehler F3 ohne: 2 Kleinstbestaende gezaehlt (1 Ziel, 1 Nicht-Ziel), keiner nach der Regel verkauft', klein(f3o.Z) === '2 1 1 0 0 0');
ok('Zaehler F3 mit: 2 Kleinstbestaende verkauft, der des Ziels nicht neu gekauft (Kauf ausgefallen)', klein(f3m.Z) === '2 1 1 2 0 1');
ok('Zaehler F3: Plaetze ohne 6 Positionen / 3 von 5 besetzt, mit 4 Positionen / 3 von 5 besetzt', platz(f3o.Z) === '6 6 5 3 2' && platz(f3m.Z) === '4 4 5 3 2');
nah('Zaehler F3 mit: Kosten 0,998042 $', f3m.Z.kosten, 0.998042, 1e-9);
ok('Zaehler F3 reich mit: 3 Kleinstbestaende (2 Ziel) verkauft, 2 neu gekauft; vier volle Kaeufe', klein(f3r.Z) === '3 2 1 3 2 0' && zahl(f3r.Z) === '1 0 4 4 0 0 0 0 0 3' &&
  pos(f3r.buch, 'F').stueck === 244.56 && pos(f3r.buch, 'S').stueck === 122.28 && platz(f3r.Z) === '6 6 5 5 0');
ok('Zaehler: ohne gesetzten Zaehler wird nichts gezaehlt, das Ergebnis bleibt gleich', (function () {
  var b = kopie(F1.buch); H.opts = AN; H.zaehler = null;
  try { var p = MH.planeUmschichtung(F1.ziel, b, F1.preise); MH.fuehreAus(b, p, 1000, 20); } finally { H.opts = null; }
  return JSON.stringify(b) === JSON.stringify(f1m.buch);
})());

/* ===== 5. Die Klinken der Huelle schlagen an (Gegenproben) ===== */
(function () {
  var echtF = KS.ECHT.fuehreAus, echtP = KS.ECHT.planeUmschichtung;
  /* (a) kaeme der Schalter bei fuehreAus nicht an (oder fehlte K1), entstuende der Kleinstkauf - die Huelle bricht ab */
  KS.ECHT.fuehreAus = function (buch, plan, nowMs, kostenBp) { return echtF(buch, plan, nowMs, kostenBp); };
  wirft('Klinke: ein Kauf unter 5 % des Platzwerts bei eingeschalteter Regel bricht den Lauf ab', function () { durchHuelle(F1, AN); }, 'unter 5 % des Platzwerts');
  KS.ECHT.fuehreAus = echtF;
  /* (b) kaeme der Schalter bei planeUmschichtung nicht an, fehlte das Feld kleinst - die Huelle bricht ab */
  KS.ECHT.planeUmschichtung = function (ziel, buch, preise) { return echtP(ziel, buch, preise); };
  wirft('Klinke: fehlt das Feld kleinst bei eingeschalteter Regel, bricht der Lauf ab', function () { durchHuelle(F3, AN); }, 'Feld kleinst');
  /* (c) wuerde K2 einen Kleinstbestand uebersehen, weicht die eigene Zaehlung ab */
  KS.ECHT.planeUmschichtung = function (ziel, buch, preise, o) { var p = echtP(ziel, buch, preise, o); if (p.kleinst) p.kleinst = p.kleinst.slice(1); return p; };
  wirft('Klinke: die eigene Zaehlung der Kleinstbestaende gegen das Feld kleinst', function () { durchHuelle(F3, AN); }, 'eigene Zaehlung');
  KS.ECHT.planeUmschichtung = echtP;
  /* (d) ohne Regel darf kein bezahlbarer Kauf ausfallen */
  KS.ECHT.fuehreAus = function (buch, plan, nowMs, kostenBp) { return echtF(buch, plan, nowMs, kostenBp, AN); };
  wirft('Klinke: ohne Regel faellt kein bezahlbarer Kauf aus', function () { durchHuelle(F1, AUS); }, 'bezahlbarer Kauf');
  KS.ECHT.fuehreAus = echtF;
  /* (e) eine Ausfuehrung ohne den Plan aus der Huelle */
  wirft('Klinke: Ausfuehrung ohne den Plan aus der Huelle', function () {
    H.opts = AUS;
    try { MH.fuehreAus(kopie(F1.buch), KS.ECHT.planeUmschichtung(F1.ziel, kopie(F1.buch), F1.preise), 1000, 20); } finally { H.opts = null; H.offen = null; }
  }, 'ohne den Plan');
  ok('Klinken: danach rechnet die Huelle wieder wie zuvor', durchHuelle(F1, AN).spur === f1m.spur && durchHuelle(F3, AUS).spur === f3o.spur);
})();

/* ================= Teil II: ein Kunstpanel durch den Rechner aus Nr. 78 ================= */

/* ---------- Kunstpanel (Aufbau wie in studien/momentum-korb-2026-10-04/test.js) ---------- */
function kunstTafel(tage, reihen) {
  var rows = [];
  reihen.forEach(function (r, s) { r.zeilen.forEach(function (z) { rows.push([z[0], s, z[1], z[2], z[3], z[4]]); }); });
  rows.sort(function (a, b) { return a[0] - b[0] || a[1] - b[1]; });
  var n = rows.length, g = { n: n, tag: new Int32Array(n), sym: new Uint16Array(n), rohSchluss: new Float64Array(n), bSchluss: new Float64Array(n),
    bEroeffnung: new Float64Array(n), umsatz: new Float64Array(n) };
  rows.forEach(function (r, i) { g.tag[i] = r[0]; g.sym[i] = r[1]; g.rohSchluss[i] = r[2]; g.bSchluss[i] = r[3]; g.bEroeffnung[i] = r[4]; g.umsatz[i] = r[5]; });
  var nTage = tage.length, nSym = reihen.length, i;
  var tagVon = new Int32Array(nTage).fill(-1), tagBis = new Int32Array(nTage).fill(-1);
  for (i = 0; i < n; i++) { var t = g.tag[i]; if (tagVon[t] < 0) tagVon[t] = i; tagBis[t] = i + 1; }
  var zaehl = new Int32Array(nSym + 1);
  for (i = 0; i < n; i++) zaehl[g.sym[i] + 1]++;
  for (var s = 0; s < nSym; s++) zaehl[s + 1] += zaehl[s];
  var symStart = Int32Array.from(zaehl), symZeilen = new Int32Array(n), fuell = Int32Array.from(zaehl);
  for (i = 0; i < n; i++) symZeilen[fuell[g.sym[i]]++] = i;
  function zeileVon(sym, tag) {
    if (tag < 0 || tag >= nTage) return -1;
    var a = tagVon[tag], b = tagBis[tag];
    if (a < 0) return -1;
    while (a < b) { var m = (a + b) >> 1; if (g.sym[m] < sym) a = m + 1; else b = m; }
    return (a < tagBis[tag] && g.sym[a] === sym) ? a : -1;
  }
  var symName = reihen.map(function (r) { return r.reihe; }), symIdx = {};
  symName.forEach(function (nm, j) { symIdx[nm] = j; });
  return { g: g, kal: { tage: tage }, maxTag: nTage - 1, nTage: nTage, nSym: nSym, tagVon: tagVon, tagBis: tagBis, symStart: symStart, symZeilen: symZeilen,
    zeileVon: zeileVon, symName: symName, symIdx: symIdx, endeGrund: reihen.map(function () { return null; }),
    stand: { kennung: 'kunst', stand: 'kunst', symbole: reihen.map(function (r) { return { reihe: r.reihe, ordner: r.reihe, lebend: 1, referenz: !!r.referenz, ende_grund: null }; }) },
    letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; } };
}
function wochentage(n) {
  var aus = [], d = new Date(Date.UTC(2020, 0, 1));
  while (aus.length < n) { var w = d.getUTCDay(); if (w !== 0 && w !== 6) aus.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
  return aus;
}
/* 102 Kunstaktien S000..S101 und SPY (Referenz, konstant 400), Tage 0..326. Stichtag 252 -> Ausfuehrung 253; Stichtag 315 -> Ausfuehrung 316; Ende 326.
 * Schlusskurse: bis Tag 199 alle 100; Tag 200..252: 200 - j (Staerke am Stichtag 252 = 1 - j/100 -> Ziel S000..S009);
 *   Tag 253..315: S000..S004 105, S005..S009 95, S010..S014 104 / 103,5 / 103 / 102,5 / 102, uebrige 50
 *     (Staerke am Stichtag 315 = Schluss(294) / 100 - 1 -> Ziel S000..S004, dann S010, S011, S012, S013, S014);
 *   ab Tag 316: S000 1 (Kurssturz NACH dem Stichtag - S000 bleibt Ziel), S001..S004 110, S005..S009 30, S010..S012 100, S013 10, S014 100, uebrige 50.
 * Eroeffnung = Schluss, ausser am Tag 253: 100 fuer S000..S014. Keine Ausschuettungen, kein Reihenende.
 *
 * Umschichtung 1 (Tag 253, beide Fassungen gleich): Platzwert 100000 / 10 = 10000 -> je 100 Stueck zu 100 $, Kosten je 10020 $.
 *   Neun volle Kaeufe = 90180 $, Rest 9820 $; S009: floor(9820 / 100,2 x 10000) / 10000 = 98,0039 Stueck = 9819,99078 $ (98,0 % -> zaehlt als "voll"), Rest 0,00922 $.
 *   Kosten 0,002 x (90000 + 9800,39) = 199,60078 $. Danach 10 Positionen, 10 von 10 Plaetzen besetzt.
 * Umschichtung 2 (Tag 316): Depotwert 0,00922 + 100 x 1 + 400 x 110 + 498,0039 x 30 = 59040,12622; Platzwert 5904,012622; 5 % = 295,20 $.
 *   S000 ist mit 100 $ ein Kleinstbestand (und Ziel).
 *   OHNE Regel: S000 gilt als gehalten. Verkauf S005..S009: 14940,117 $ Volumen, Erloes 14910,236766 $ -> Bargeld 14910,245986 $.
 *     S010: 59,0401 Stueck = 5915,81802 $ mit Kosten (voll) -> 8994,427966;  S011: ebenso (voll) -> 3078,609946;
 *     S012: floor(3078,609946 / 100,2 x 10000) / 10000 = 30,7246 Stueck = 3078,60492 $ (3072,46 $ = 52,0 % -> verkleinert) -> Rest 0,005026;
 *     S013 zu 10 $: floor(0,005026 / 10,02 x 10000) / 10000 = 0,0005 Stueck = 0,00501 $ (Kleinstkauf) -> Rest 0,000016;  S014 zu 100 $: 0 Stueck (ausgefallen).
 *     Kosten 0,002 x (14940,117 + 5904,01 + 5904,01 + 3072,46 + 0,005) = 59,641204 $. Danach 9 Positionen; besetzt S001..S004, S010, S011, S012 = 7 von 10.
 *     Endwert (Schluss = Eroeffnung von Tag 316): 100 + 44000 + 2 x 5904,01 + 3072,46 + 0,005 + 0,000016 = 58980,485016 -> 58980,49 $.
 *   MIT Regel: S000 wird verkauft (99,80 $) und an erster Stelle neu geplant. Bargeld 0,00922 + 99,8 + 14910,236766 = 15010,045986 $.
 *     S000 zu 1 $: 5904,0126 Stueck = 5915,8206252 $ (voll) -> 9094,2253608;  S010: 59,0401 Stueck (voll) -> 3178,4073408;
 *     S011: floor(3178,4073408 / 100,2 x 10000) / 10000 = 31,7206 Stueck = 3178,40412 $ (3172,06 $ = 53,7 % -> verkleinert) -> Rest 0,0032208;
 *     S012 zu 100 $: 0 Stueck (ausgefallen mangels Bargeld);  S013 zu 10 $: 0,0003 Stueck waeren bezahlbar -> unter 5 % -> ausgefallen nach K1;  S014: 0 (Bargeld).
 *     Kosten 0,002 x (100 + 14940,117 + 5904,0126 + 5904,01 + 3172,06) = 60,0403992 $. Danach 7 Positionen; besetzt S000..S004, S010, S011 = 7 von 10.
 *     Endwert: 5904,0126 + 44000 + 5904,01 + 3172,06 + 0,0032208 = 58980,0858208 -> 58980,09 $. */
var NT = 327, TAGE = wochentage(NT);
function pad(j) { return 'S' + ('00' + j).slice(-3); }
function kurs(j, t) {
  var c;
  if (t < 200) c = 100;
  else if (t <= 252) c = 200 - j;
  else if (t <= 315) c = j <= 4 ? 105 : j <= 9 ? 95 : j <= 14 ? 104 - (j - 10) * 0.5 : 50;
  else c = j === 0 ? 1 : j <= 4 ? 110 : j <= 9 ? 30 : j === 13 ? 10 : j <= 14 ? 100 : 50;
  return [c, t === 253 && j <= 14 ? 100 : c];
}
function kunst() {
  var reihen = [], j, t, k, zeilen;
  for (j = 0; j < 102; j++) {
    zeilen = [];
    for (t = 0; t < NT; t++) { k = kurs(j, t); zeilen.push([t, k[0], k[0], k[1], 2e8]); }
    reihen.push({ reihe: pad(j), zeilen: zeilen });
  }
  zeilen = [];
  for (t = 0; t < NT; t++) zeilen.push([t, 400, 400, 400, 2e8]);
  reihen.push({ reihe: 'SPY', zeilen: zeilen, referenz: true });
  var T = kunstTafel(TAGE, reihen), Q = R.vorbereiten(T);
  return { T: T, Q: Q, M: S.Massnahmen(T, Q, function () { return null; }, {}, null), F: { K: { von: 253, bis: NT - 1 } }, haupt: K.EMPFINDLICHKEIT[0].totalverlust };
}
var KV = kunst(), KDEF = { name: 'Kunst', fenster: 'K', korb: null };

/* ===== 6. k = 0 am Kunstpanel, ohne und mit Regel, von Hand ===== */
var ko = KS.k0(KV, KDEF, 0), km = KS.k0(KV, KDEF, 0.05);
ok('Kunstpanel: Zielliste am Stichtag 252 und 315 wie gerechnet', S.zielAm(KV.T, KV.Q, 252, null).ziel.join() === 'S000,S001,S002,S003,S004,S005,S006,S007,S008,S009' &&
  S.zielAm(KV.T, KV.Q, 315, null).ziel.join() === 'S000,S001,S002,S003,S004,S010,S011,S012,S013,S014');
ok('Kunstpanel: zwei Umschichtungen, die Huelle je genau einmal gerufen (planen und ausfuehren), ohne und mit Regel',
  ko.L.zaehler.umschichtungen === 2 && ko.aufrufe.plane === 2 && ko.aufrufe.fuehre === 2 && km.L.zaehler.umschichtungen === 2 && km.aufrufe.plane === 2 && km.aufrufe.fuehre === 2);
ok('Kunstpanel ohne: Zaehler 15 geplant = 12 voll, 1 verkleinert, 1 Kleinstkauf, 1 ausgefallen; 5 Verkaeufe; beide Umschichtungen mit zu wenig Bargeld',
  zahl(ko.zaehler) === '2 2 15 12 1 1 1 1 0 5');
ok('Kunstpanel mit:  Zaehler 16 geplant = 12 voll, 1 verkleinert, 0 Kleinstkauf, 3 ausgefallen (2 mangels Bargeld, 1 nach K1); 6 Verkaeufe',
  zahl(km.zaehler) === '2 2 16 12 1 0 3 2 1 6');
ok('Kunstpanel ohne: der Kleinstbestand S000 (Ziel) wird gezaehlt, aber gehalten', klein(ko.zaehler) === '1 1 0 0 0 0' && pos(ko.L.buch, 'S000').stueck === 100);
ok('Kunstpanel mit: der Kleinstbestand S000 wird verkauft und neu gekauft (5904,0126 Stueck)', klein(km.zaehler) === '1 1 0 1 1 0' && pos(km.L.buch, 'S000').stueck === 5904.0126);
ok('Kunstpanel: Positionen nach der Umschichtung ohne 9 bis 10, mit 7 bis 10; besetzte Plaetze beide 17 von 20', platz(ko.zaehler) === '9 10 20 17 3' && platz(km.zaehler) === '7 10 20 17 3');
ok('Kunstpanel ohne: S012 verkleinert (30,7246 Stueck), S013 als Kleinstkauf (0,0005 Stueck), S014 fehlt',
  pos(ko.L.buch, 'S012').stueck === 30.7246 && pos(ko.L.buch, 'S013').stueck === 0.0005 && !pos(ko.L.buch, 'S014') && pos(ko.L.buch, 'S010').stueck === 59.0401 && ko.L.buch.positionen.length === 9);
ok('Kunstpanel mit: S011 verkleinert (31,7206 Stueck), S012, S013, S014 fehlen',
  pos(km.L.buch, 'S011').stueck === 31.7206 && !pos(km.L.buch, 'S012') && !pos(km.L.buch, 'S013') && !pos(km.L.buch, 'S014') && pos(km.L.buch, 'S010').stueck === 59.0401 && km.L.buch.positionen.length === 7);
nah('Kunstpanel ohne: Bargeld am Ende 0,000016 $', ko.L.buch.cash, 0.000016, 1e-8);
nah('Kunstpanel mit: Bargeld am Ende 0,0032208 $', km.L.buch.cash, 0.0032208, 1e-8);
nah('Kunstpanel ohne: Kosten 199,60078 + 59,641204 = 259,241984 $', ko.zaehler.kosten, 259.241984, 1e-6);
nah('Kunstpanel mit: Kosten 199,60078 + 60,0403992 = 259,6411792 $', km.zaehler.kosten, 259.6411792, 1e-6);
nah('Kunstpanel: die Kosten der Huelle sind die des Rechners (ohne)', ko.zaehler.kosten, ko.L.zaehler.kosten, 1e-6);
nah('Kunstpanel: die Kosten der Huelle sind die des Rechners (mit)', km.zaehler.kosten, km.L.zaehler.kosten, 1e-6);
ok('Kunstpanel ohne: Endwert 58.980,49 $, S&P 500 100.000,00 $', KS.cent(ko.kz.buchEnde) === 5898049 && KS.cent(ko.kz.spyEnde) === 10000000);
ok('Kunstpanel mit: Endwert 58.980,09 $', KS.cent(km.kz.buchEnde) === 5898009);
ok('Kunstpanel: ohne Regel entsteht ein Kauf unter 5 % des Platzwerts (Gegenprobe), mit Regel keiner', ko.zaehler.kleinstkauf === 1 && km.zaehler.kleinstkauf === 0 &&
  ko.zaehler.beispiele.length === 1 && ko.zaehler.beispiele[0].reihe === 'S013' && ko.zaehler.beispiele[0].stueck === 0.0005);

/* ===== 7. Ein ganzer Lauf am Kunstpanel: 63 Startphasen, ohne und mit ===== */
var KL = KS.einLauf(KV, KDEF);
/* Phase k startet am Tag 253 + k; die zweite Umschichtung (Tag 316 + k) liegt nur fuer k <= 10 im Fenster -> 11 x 2 + 52 x 1 = 74 Umschichtungen */
ok('Kunstlauf: 63 Phasen, 74 Umschichtungen, die Huelle je einmal gerufen (ohne und mit)', KL.ohne.startphasen.anzahl === 63 && KL.ohne.zaehler63.umschichtungen === 74 &&
  KL.mit.zaehler63.umschichtungen === 74 && KL.ohne.startphasen.phasen.reduce(function (a, p) { return a + p.umschichtungen; }, 0) === 74);
ok('Kunstlauf: Phase 0 ist die Rechnung von Hand (ohne und mit)', KS.cent(KL.ohne.k0.buchEnde) === 5898049 && KS.cent(KL.mit.k0.buchEnde) === 5898009 &&
  Math.abs(KL.ohne.startphasen.phasen[0].abstandPa - KL.ohne.k0.abstandPa) < 1e-9 && zahl(KL.ohne.k0.zaehler) === zahl(ko.zaehler) && zahl(KL.mit.k0.zaehler) === zahl(km.zaehler));
ok('Kunstlauf: mit Regel K in keiner Phase ein Kauf unter 5 % des Platzwerts; ohne Regel gibt es sie', KL.mit.zaehler63.kleinstkauf === 0 && KL.ohne.zaehler63.kleinstkauf >= 1);
ok('Kunstlauf: jede geplante Order ist genau einmal eingeordnet', [KL.ohne.zaehler63, KL.mit.zaehler63].every(function (Z) {
  return Z.voll + Z.verkleinert + Z.kleinstkauf + Z.ausgefallen === Z.kaeufeGeplant && Z.ausgefallenBargeld + Z.ausgefallenK1 === Z.ausgefallen && Z.plaetzeBesetzt + Z.plaetzeLeer === Z.zielplaetze;
}) && KL.ohne.zaehler63.ausgefallenK1 === 0 && KL.mit.zaehler63.ausgefallenK1 >= 1);
ok('Kunstlauf: gehaltene Werte und Fenster stehen im Ergebnis', KL.fenster.handelstage === 74 && KL.ohne.k0.gehalteneWerte.join() === '9,10' && KL.mit.k0.gehalteneWerte.join() === '7,10' &&
  KL.ohne.zaehler63.positionenDanachMax === 10 && KL.mit.zaehler63.positionenDanachMin <= 7);
ok('Kunstlauf: der Schalter ist nach dem Lauf wieder weg', H.opts === null && H.zaehler === null);

/* ================= Teil III: die Saetze und die Pruefmarke ================= */

/* ===== 8. Pruefmarke: "um mehr als 2,0 Pp p. a. unter" ===== */
function marke(paare) { return KS.pruefmarke(paare.map(function (p, i) { return { name: 'L' + i, ohne: p[0], mit: p[1] }; })); }
var KANN = 'Regel K kann in die App', NICHT = 'Regel K verschlechtert den Rückblick — der PM fragt Wilhelm';
ok('Pruefmarke: mit besser als ohne -> kann in die App', marke([[5, 6], [1, 1.5], [8, 8], [-2, -1]]).schlusssatz === KANN);
ok('Pruefmarke: 1,99 Pp darunter -> kann in die App', marke([[5, 3.01], [1, 1], [8, 8], [2, 2]]).schlusssatz === KANN);
ok('Pruefmarke: genau 2,0 Pp darunter -> noch kann (mehr als heisst echt groesser)', marke([[5, 3], [1, 1], [8, 8], [2, 2]]).schlusssatz === KANN);
ok('Pruefmarke: 2,01 Pp darunter in EINEM der vier Laeufe -> verschlechtert, der Lauf wird genannt', (function () {
  var m = marke([[5, 5], [1, 1], [8, 5.99], [2, 2]]);
  return m.schlusssatz === NICHT && m.ueberschritten.join() === 'L2' && m.jeLauf[2].ueberschritten === true && m.jeLauf[0].ueberschritten === false && Math.abs(m.jeLauf[2].unterschiedPp + 2.01) < 1e-12;
})());
ok('Pruefmarke: gerechnet wird ungerundet (2,004 Pp darunter ist mehr als 2,0)', marke([[5, 2.996], [1, 1], [8, 8], [2, 2]]).schlusssatz === NICHT);
ok('Pruefmarke: negative Mediane - von -1 auf -3,5 ist 2,5 darunter', marke([[-1, -3.5], [1, 1], [8, 8], [2, 2]]).schlusssatz === NICHT);

/* ===== 9. Der Satz je Lauf, woertlich ===== */
var kunstSatz = KS.satz({
  ohne: { k0: { abstandPa: 4.5519, rueckschlagBuch: -49.018 }, startphasen: { vorDemMarkt: 62, anzahl: 63, median: 7.5875 }, zaehler63: { kleinstkauf: 318, ausgefallen: 1064 } },
  mit: { k0: { abstandPa: 5.0149, rueckschlagBuch: -48.26 }, startphasen: { vorDemMarkt: 61, anzahl: 63, median: -0.126 }, zaehler63: { kleinstkauf: 0, ausgefallen: 1234 } } });
ok('Satz: Wortlaut aus §3 mit den Zahlen des Laufs', kunstSatz === 'Mit Regel K: Abstand p. a. bei k = 0 +5,01 Pp (ohne: +4,55), 61 von 63 Startphasen vorn (ohne: 62), Median −0,13 Pp p. a. (ohne: +7,59), ' +
  'größter Rückschlag −48,3 % (ohne: −49,0); Kleinstkäufe 0 (ohne: 318), ausgefallene Käufe 1.234 (ohne: 1.064).');
if (kunstSatz.indexOf('Mit Regel K') !== 0) console.log('   ' + kunstSatz);

/* ===== 10. Trockenlauf des Berichts am Kunstpanel ===== */
(function () {
  var E = { kennung: KS.KENNUNG, panelKennung: 'kunst', korrekturen: [], saetze: {}, laeufe: {}, selbstpruefung: { laeufe: {}, bestanden: true } };
  KS.LAEUFE.forEach(function (def) {
    var l = kopie(KL); l.name = def.name; l.korb = def.korb || 'alle zulaessigen';
    E.laeufe[def.name] = l;
    E.selbstpruefung.laeufe[def.name] = { buchEnde: 257543.65, spyEnde: 215535.7330627431, bestanden: true };
  });
  KS.abschluss(E);
  var text = KS.ergebnisText(E), VERBOTEN = new RegExp('bel' + 'egt|best' + 'ätigt|vali' + 'diert', 'i');
  ok('Bericht: Schlusssatz, vier Saetze, eine Tabelle mit vier Spalten', text.indexOf('**' + E.schlusssatz + '.**') === 0 && text.split('\n- **').length === 5 &&
    text.indexOf('| je Zelle: ohne / mit Regel K | **A-187** | **A-breit** | **B-187** | **B-breit** |') > 0 && (E.schlusssatz === KANN || E.schlusssatz === NICHT));
  ok('Bericht: der Satz jedes Laufs steht woertlich darin', KS.LAEUFE.every(function (def) { return text.indexOf('- **' + def.name + '.** ' + KS.satz(E.laeufe[def.name])) > 0; }));
  ok('Bericht: keines der Urteilswoerter, kein Urteil ueber das Buch', !VERBOTEN.test(text) && !VERBOTEN.test(JSON.stringify(E.saetze)) && !VERBOTEN.test(E.schlusssatz));
  ok('Bericht: der Vergleich mit der Zaehlung des PM nennt die drei Laeufe seiner Tabelle', Object.keys(E.vergleich.zaehlungPm).join() === 'A-187,A-breit,B-187' &&
    E.vergleich.zaehlungPm['A-187'].pm.kleinstkauf === 318 && E.vergleich.zaehlungPm['B-187'].pm.kleinstkauf === 466 && E.vergleich.abstaendeOhne['B-breit'].anzahl === 63);
  ok('Bericht: hoechstens eine Seite (unter 60 Zeilen)', text.split('\n').length < 60);
  if (process.argv.indexOf('--bericht') >= 0) console.log('----- Bericht am KUNSTPANEL (keine echten Zahlen) -----\n' + text + '-----');
})();

/* ================= Teil IV: echtes Panel - nur ohne Regel, nur k = 0 ================= */

/* ===== 11. Selbstpruefung (§3, §6.2): mit kleinstAnteil 0 trifft dieselbe Huelle die alten Endwerte auf den Cent ===== */
var soll = KS.sollwerte();
ok('Sollwerte: B-breit 165.209,66 $ gegen 181.193,87 $; A-187, A-breit, B-187 aus ergebnis.json von Nr. 78', KS.cent(soll['B-breit'].buchEnde) === 16520966 && KS.cent(soll['B-breit'].spyEnde) === 18119387 &&
  KS.cent(soll['A-187'].buchEnde) === 25754365 && KS.cent(soll['A-breit'].buchEnde) === 31604241 && KS.cent(soll['B-187'].buchEnde) === 25487585);
if (process.argv.indexOf('--ohne-panel') >= 0) {
  /* nur zum Entwickeln der Teile I bis III: KEIN vollstaendiger Testlauf, deshalb nie mit Ende 0 */
  console.log(gut + ' Pruefungen gruen, ' + schlecht + ' rot - Teil IV (echtes Panel) UEBERSPRUNGEN, kein vollstaendiger Lauf');
  process.exit(schlecht ? 1 : 2);
}
var V = null;
try { V = KS.vorbereitung(); } catch (e) { console.log('   ' + e.message); }
ok('echtes Panel: geladen, Fenster und SPY-Klinken stehen', !!V);
if (V) {
  var SP = KS.selbstpruefung(V);
  KS.LAEUFE.forEach(function (def) {
    var x = SP.laeufe[def.name];
    ok('Selbstpruefung ' + def.name + ': Endwerte Buch und S&P 500 auf den Cent', x.bestanden === true && KS.cent(x.buchEnde) === KS.cent(soll[def.name].buchEnde) && KS.cent(x.spyEnde) === KS.cent(soll[def.name].spyEnde));
    ok('Selbstpruefung ' + def.name + ': die Huelle je Umschichtung genau einmal gerufen (planen und ausfuehren)',
      x.umschichtungen === (def.fenster === 'A' ? 19 : 20) && x.aufrufePlanen === x.umschichtungen && x.aufrufeAusfuehren === x.umschichtungen);
  });
  ok('Selbstpruefung: alle vier bestanden - der Lauf darf starten', SP.bestanden === true);
}

console.log(gut + ' Pruefungen gruen, ' + schlecht + ' rot');
process.exit(schlecht ? 1 : 0);
