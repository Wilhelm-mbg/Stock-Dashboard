'use strict';
/* Pruefungen zu Sektor-Momentum (Phase 3). Aufruf aus der Repo-Wurzel:
 *   node studien/kandidaten-blind-2026-10/sektor-momentum/test.js
 * Kunstdaten; Sollwerte von Hand gerechnet (Rechenweg im Kommentar). Jede Pruefung haengt an genau einer Regelzeile: wird die Zeile in
 * ziel.js ausgebaut, wird mindestens diese Pruefung rot. Ausser Node keine Abhaengigkeiten (liquide.js nur fuer eine Gegenprobe der Medianregel). */
var path = require('path');
var Z = require('./ziel.js');
var Li = require(path.join(__dirname, '..', '..', '..', 'liquide.js'));
var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 1e-12 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function gleich(name, a, b) { var x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) console.log('   ist ' + x + '\n   soll ' + y); ok(name, x === y); }

var TAG = 86400000, NOW = Date.UTC(2021, 5, 30);
var NAMEN = ['XLB', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLRE', 'XLU', 'XLV', 'XLY'];   /* 10 Fonds im Panel; XLC fehlt (erst ab 2018) */
/** Reihe mit n Tageszeilen, letzte Zeile bei `ende`; Zeile 0 = Kurs `erst`, letzte Zeile = Kurs `letzt`, dazwischen `mitte`; Stueck je Tag `stueck`.
 *  opt.luecke = [ab, tage]: ab Zeile `ab` verschiebt sich die Zeit um zusaetzliche `tage` Kalendertage (fehlende Tage in der Reihe). */
function serie(n, erst, letzt, stueck, ende, mitte, opt) {
  var r = [], k, t;
  for (k = 0; k < n; k++) {
    t = (ende == null ? NOW : ende) - (n - 1 - k) * TAG;
    if (opt && opt.luecke && k < opt.luecke[0]) t -= opt.luecke[1] * TAG;
    var kurs = k === 0 ? erst : k === n - 1 ? letzt : (mitte == null ? 100 : mitte);
    r.push(stueck === null ? [t, kurs] : [t, kurs, stueck]);
  }
  return r;
}
var S = 2000000;          /* Stueck: 100 $ x 2 Mio = 200 Mio $ > 100 Mio $ */
/* Staerken (Rueckblick 252 Tage: Zeile 252 gegen Zeile 0 einer 253-Zeilen-Reihe, Kurs 100 am Anfang):
 *   XLB +10 %  XLE +50 %  XLF +30 %  XLI +20 %  XLK +40 %  XLP -10 %  XLRE +15 %  XLU 0 %  XLV +5 %  XLY +25 %
 * Rangfolge von Hand: XLE 0,50 > XLK 0,40 > XLF 0,30 > XLY 0,25 > XLI 0,20 > XLRE 0,15 > XLB 0,10 > XLV 0,05 > XLU 0 > XLP -0,10 ; Ziel = XLE, XLK, XLF. */
var ST = { XLB: 0.10, XLE: 0.50, XLF: 0.30, XLI: 0.20, XLK: 0.40, XLP: -0.10, XLRE: 0.15, XLU: 0.0, XLV: 0.05, XLY: 0.25 };
function basis() { var m = {}; NAMEN.forEach(function (s) { m[s] = serie(253, 100, 100 * (1 + ST[s]), S); }); return m; }
function ziel(m, o) { o = o || {}; if (o.nowMs == null) o.nowMs = NOW; return Z.zielfunktion(m, o); }
function sym(res) { return res.rangfolge.map(function (x) { return x.sym; }); }
function verworfenSym(res, s) { return res.verworfen.filter(function (v) { return v.sym === s; })[0]; }

/* ---------- 0. Konstanten (Fundstellen in ziel.js und REGEL.md Teil B) ---------- */
var K = Z.KONFIG;
gleich('KONFIG.universum: die elf SPDR-Sektoren, feste Liste', K.universum, ['XLB', 'XLC', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLRE', 'XLU', 'XLV', 'XLY']);
ok('KONFIG: Rueckblick 252, kein Ueberspringen, 3 Positionen, Mindestzahl 6', K.rueckblick === 252 && K.luecke === 0 && K.anzahl === 3 && K.minWerte === 6);
ok('KONFIG: Umsatzschwelle 100 Mio $ ueber 20 Balken, veraltet 7 Tage', K.umsatzMin === 1e8 && K.umsatzFenster === 20 && K.maxAlterMs === 7 * TAG);
ok('Obergrenze der Aufgabe: Zielzahl <= 30', K.anzahl <= 30);
(function () {
  var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js')), bk = MH.buchKonfig();
  ok('Mindestzeilen 253 wie die Grundregel (231 + 21 + 1 = 252 + 0 + 1): gleicher fruehester Stichtag 03.01.2017', K.rueckblick + K.luecke + 1 === bk.rueckblick + bk.luecke + 1);
})();

/* ---------- 1. Grundfall: Rangfolge und Ziel von Hand ---------- */
var m1 = basis(), r1 = ziel(m1);
gleich('Grundfall: Rangfolge XLE, XLK, XLF, XLY, XLI, XLRE, XLB, XLV, XLU, XLP', sym(r1), ['XLE', 'XLK', 'XLF', 'XLY', 'XLI', 'XLRE', 'XLB', 'XLV', 'XLU', 'XLP']);
gleich('Grundfall: Ziel = die drei staerksten', r1.ziel, ['XLE', 'XLK', 'XLF']);
nah('Staerke XLE = 150/100 - 1 = 0,50', r1.rangfolge[0].staerke, 0.5);
nah('Staerke XLP = 90/100 - 1 = -0,10', r1.rangfolge[9].staerke, -0.1);
nah('Umsatz = Median(Schluss x Stueck): 19 Tage 100 x 2 Mio, letzter Tag 150 x 2 Mio -> 200 Mio (XLE)', r1.rangfolge[0].umsatz, 2e8);
ok('Rueckgabeform wie momentumZiel: ziel, rangfolge, korb, zuWenig, uebersprungen, verworfen', ['ziel', 'rangfolge', 'korb', 'uebersprungen', 'verworfen'].every(function (k) { return k in r1; }) && !r1.zuWenig);
gleich('korb: 10 zulaessig von 11 Namen der Liste (XLC fehlt im Panel)', [r1.korb.zulaessig, r1.korb.geprueft], [10, 11]);
ok('XLC fehlt im Panel: nicht zulaessig, Grund "nicht im Panel"', verworfenSym(r1, 'XLC') && /nicht im Panel/.test(verworfenSym(r1, 'XLC').grund) && r1.uebersprungen.indexOf('XLC') >= 0);
ok('Zielzahl 3 (nicht max(5, 10 %)), hoechstens 30', r1.ziel.length === 3 && r1.ziel.length <= 30);

/* ---------- 2. Signal: Rueckblick 12 Monate, KEIN Ueberspringen ---------- */
(function () {
  var m = basis();
  m.XLB = serie(253, 100, 110, S, NOW, 1000);       /* Zwischenkurse 1000: Zeile 231 (Kurs vor 21 Tagen) waere bei 12-1 ein anderer Wert */
  var r = ziel(m);
  nah('kein Ueberspringen: Zwischenkurse zaehlen nicht, Staerke XLB bleibt 110/100 - 1', r.rangfolge.filter(function (x) { return x.sym === 'XLB'; })[0].staerke, 0.10);
  gleich('Zwischenkurse aendern die Rangfolge nicht', sym(r), sym(r1));
  /* Gegenprobe der Regel: Anfangskurs ist Zeile i-252, nicht Zeile i-231 oder i-273 */
  var m2 = basis();
  m2.XLP = serie(254, 1, 100, S, NOW, 100);          /* Zeile 0 (Kurs 1) liegt 253 Tage zurueck und zaehlt NICHT; Anfang ist Zeile 1 = 100 */
  nah('Anfang ist genau Zeile i-252 (254 Zeilen: Zeile 0 zaehlt nicht): Staerke 100/100 - 1 = 0', ziel(m2).rangfolge.filter(function (x) { return x.sym === 'XLP'; })[0].staerke, 0);
})();

/* ---------- 3. Gleichstand deterministisch: Kuerzel aufsteigend ---------- */
(function () {
  var m = basis();
  m.XLB = serie(253, 100, 130, S); m.XLY = serie(253, 100, 130, S);   /* mit XLF drei Fonds auf +30 % */
  var r = ziel(m);
  gleich('Gleichstand dreier Fonds auf Platz 3 bis 5: Kuerzel aufsteigend XLB, XLF, XLY', sym(r).slice(2, 5), ['XLB', 'XLF', 'XLY']);
  gleich('Gleichstand: das Ziel nimmt den alphabetisch ersten (XLB) auf Platz 3', r.ziel, ['XLE', 'XLK', 'XLB']);
  var revU = ziel(m, { universum: K.universum.slice().reverse() });
  gleich('Gleichstand und umgekehrt geordnete Universumsliste (opts): weiter Kuerzel aufsteigend', revU.ziel, r.ziel);
  var umgekehrt = {}; Object.keys(m).reverse().forEach(function (k) { umgekehrt[k] = m[k]; });
  gleich('Gleichstand und Schluesselfolge in roh: Ergebnis unabhaengig davon', ziel(umgekehrt).ziel, r.ziel);
})();

/* ---------- 4. Zu kurze Reihen, Mindestlaenge, XLRE/XLC erst ab Start ---------- */
(function () {
  var m = basis();
  m.XLE = serie(252, 100, 150, S);                    /* eine Zeile zu wenig: 252 < 253 */
  var r = ziel(m);
  ok('252 Zeilen sind zu kurz (Mindestlaenge 253): XLE verworfen mit Laengenangabe', verworfenSym(r, 'XLE') && /zu kurze Kursreihe \(252 von 253/.test(verworfenSym(r, 'XLE').grund));
  gleich('XLE rangiert nicht, Ziel ohne XLE', r.ziel, ['XLK', 'XLF', 'XLY']);
  ok('genau 253 Zeilen rangieren (Grenze): XLRE im Grundfall zulaessig', sym(r1).indexOf('XLRE') >= 0);
  var m2 = basis(); m2.XLC = serie(100, 100, 400, S);  /* XLC seit 100 Tagen am Markt, +300 %: darf noch nicht rangieren */
  var r2 = ziel(m2);
  ok('XLC mit 100 Zeilen (Start 2018, noch zu jung): nicht im Ziel, Grund zu kurz', r2.ziel.indexOf('XLC') < 0 && /zu kurze/.test(verworfenSym(r2, 'XLC').grund));
  var m3 = basis(); m3.XLC = serie(253, 100, 200, S);
  var r3 = ziel(m3);
  gleich('XLC mit 253 Zeilen und +100 %: ab dann im Universum, Platz 1', [r3.ziel[0], r3.korb.zulaessig], ['XLC', 11]);
  /* Zeilen nach nowMs zaehlen nicht fuer die Laenge */
  var m4 = basis(); m4.XLE = serie(253, 100, 150, S, NOW + TAG);   /* letzte Zeile einen Tag NACH dem Stichtag -> nur 252 Zeilen bis nowMs */
  ok('Zeile nach dem Stichtag zaehlt nicht mit: nur 252 Zeilen -> zu kurz', /zu kurze/.test(verworfenSym(ziel(m4), 'XLE').grund));
})();

/* ---------- 5. Veraltete Reihe ---------- */
(function () {
  var m = basis(); m.XLE = serie(253, 100, 150, S, NOW - 8 * TAG);
  var r = ziel(m);
  ok('letzte Zeile 8 Tage vor dem Stichtag: veraltet, verworfen', verworfenSym(r, 'XLE') && /veraltet \(8 Tage/.test(verworfenSym(r, 'XLE').grund));
  gleich('veraltete Reihe darf nicht mitranken (waere sonst Platz 1)', r.ziel, ['XLK', 'XLF', 'XLY']);
  m.XLE = serie(253, 100, 150, S, NOW - 7 * TAG);
  ok('genau 7 Tage alt ist noch zulaessig (Grenze: mehr als 7 Tage fliegt raus)', ziel(m).ziel[0] === 'XLE');
})();

/* ---------- 6. Kurs <= 0, nicht berechenbar ---------- */
(function () {
  var m = basis(); m.XLE = serie(253, 100, 0, S);
  var r = ziel(m);
  ok('Schlusskurs 0: Staerke nicht berechenbar, verworfen', verworfenSym(r, 'XLE') && /nicht berechenbar/.test(verworfenSym(r, 'XLE').grund));
  m = basis(); m.XLK = serie(253, -5, 140, S);
  r = ziel(m);
  ok('Anfangskurs negativ: verworfen (sonst waere die Staerke Unsinn)', verworfenSym(r, 'XLK') && r.ziel.indexOf('XLK') < 0);
  m = basis(); m.XLF = serie(253, 100, NaN, S);
  ok('Kurs NaN: verworfen', ziel(m).ziel.indexOf('XLF') < 0 && /nicht berechenbar/.test(verworfenSym(ziel(m), 'XLF').grund));
})();

/* ---------- 7. Luecke in der Reihe ---------- */
(function () {
  var m = basis();
  m.XLE = serie(253, 100, 150, S, NOW, 100, { luecke: [100, 200] });   /* 253 Zeilen, aber 200 Kalendertage fehlen: Spanne 252 + 200 = 452 > 400 */
  var r = ziel(m);
  ok('Luecke (452 Kalendertage fuer 252 Handelstage): verworfen mit Grund Luecke', verworfenSym(r, 'XLE') && /Lücke in der Reihe \(452/.test(verworfenSym(r, 'XLE').grund));
  m.XLE = serie(253, 100, 150, S, NOW, 100, { luecke: [100, 100] });  /* Spanne 352 <= 400: kleine Luecke (Feiertage, Ausfalltage) ist erlaubt */
  ok('kleine Luecke (352 Kalendertage) bleibt zulaessig', ziel(m).ziel[0] === 'XLE');
})();

/* ---------- 8. Umsatzschwelle auch fuer ETFs ---------- */
(function () {
  var m = basis(); m.XLE = serie(253, 100, 150, 600000);   /* 100 x 0,6 Mio = 60 Mio $ (19 Tage), letzter Tag 90 Mio: Median 60 Mio < 100 Mio */
  var r = ziel(m);
  ok('Median-Tagesumsatz 60 Mio $ < 100 Mio $: ETF nicht zulaessig, Grund Umsatz', verworfenSym(r, 'XLE') && /unter 100 Mio/.test(verworfenSym(r, 'XLE').grund));
  gleich('korb.unterSchwelle zaehlt ihn, zulaessig 9', [r.korb.unterSchwelle, r.korb.zulaessig], [1, 9]);
  m.XLE = serie(253, 100, 100, 1000000);                   /* 19 Tage 100 x 1 Mio = 1e8 und letzter Tag 1e8: Median genau 1e8 */
  ok('Median genau 100 Mio $ ist zulaessig (>=)', ziel(m).korb.zulaessig === 10 && ziel(m).korb.unterSchwelle === 0);
  /* Median = sortiert[n >> 1] (oberer der beiden mittleren), nicht Mittelwert: 11 Tage 50 Mio, 9 Tage 300 Mio -> sortiert[10] = 50 Mio (Mittel 164 Mio) */
  var r2 = serie(253, 100, 100, S);
  for (var q = 233; q <= 252; q++) r2[q][2] = (q - 233) < 11 ? 500000 : 3000000;   /* 100 x 0,5 Mio = 50 Mio; 100 x 3 Mio = 300 Mio */
  m.XLE = r2;
  var rr = ziel(m);
  ok('Median ist sortiert[n>>1] (50 Mio $), nicht das Mittel (164 Mio $): unter Schwelle', rr.korb.unterSchwelle === 1 && verworfenSym(rr, 'XLE'));
  /* 20 Balken: 10 Tage 50 Mio, 10 Tage 300 Mio -> sortiert[10] = 300 Mio (oberer der mittleren; unterer waere 50 Mio, Mittel 175 Mio); Balken 232 (50 Mio) liegt
   * ausserhalb des Fensters: ein 21er-Fenster haette 11 niedrige und sortiert[10] = 50 Mio */
  var r5 = serie(253, 100, 100, S);
  for (q = 232; q <= 252; q++) r5[q][2] = q <= 242 ? 500000 : 3000000;
  m.XLE = r5;
  ok('Median oberer der beiden mittleren (300 Mio $ bei 10 zu 10) und Fenster genau 20 Balken: zulaessig', ziel(m).korb.zulaessig === 10 && ziel(m).korb.unterSchwelle === 0);
  /* Balken ausserhalb des 20er-Fensters zaehlen nicht */
  var r3 = serie(253, 100, 100, 500000); r3[100][2] = 1e9; r3[0][2] = 1e9;
  m.XLE = r3;
  ok('Umsatz weit vor dem 20er-Fenster zaehlt nicht', ziel(m).korb.unterSchwelle === 1);
  /* ohne Stueckzahlen */
  m.XLE = serie(253, 100, 150, null);
  var r4 = ziel(m);
  gleich('Zeilen ohne Stueckzahl: Umsatz nicht pruefbar, ohneUmsatz 1, unterSchwelle 0', [r4.korb.ohneUmsatz, r4.korb.unterSchwelle], [1, 0]);
  /* Gegenprobe gegen liquide.js (Regel der App) */
  var samples = [serie(253, 100, 150, 700000), serie(253, 100, 150, 1000000), serie(253, 100, 150, 1500000), r2, r3];
  var gleichLi = samples.every(function (s) {
    var li = Li.zulaessig(s, s.length - 1, { umsatzMin: 1e8, fenster: 20 });
    var mm = basis(); mm.XLE = s;
    var res = ziel(mm), zul = res.rangfolge.some(function (x) { return x.sym === 'XLE'; });
    return li.ok === zul;
  });
  ok('Umsatzregel stimmt mit liquide.js (Li.zulaessig) auf fuenf Reihen ueberein', gleichLi);
  m.XLE = serie(253, 100, 150, 600000);
  ok('Umsatzschwelle 0 setzbar (opts): Regel ist die einzige Huerde, nicht eingebaut', ziel(m, { umsatzMin: 0 }).korb.zulaessig === 10);
})();

/* ---------- 9. Mindestzahl zulaessiger Fonds: zuWenig ---------- */
(function () {
  var m = {}; ['XLB', 'XLE', 'XLF', 'XLI', 'XLK'].forEach(function (s) { m[s] = serie(253, 100, 100 * (1 + ST[s]), S); });
  var r = ziel(m);
  ok('5 zulaessige < 6: zuWenig, ziel leer, rangfolge leer (nicht handeln)', r.zuWenig === true && r.ziel.length === 0 && r.rangfolge.length === 0);
  ok('zuWenig meldet trotzdem korb und verworfen (6 fehlende Namen)', r.korb.zulaessig === 5 && r.korb.geprueft === 11 && r.verworfen.length === 6);
  m.XLP = serie(253, 100, 90, S);
  r = ziel(m);
  gleich('genau 6 zulaessige: es wird gerankt (Grenze)', [r.zuWenig || false, r.ziel.length], [false, 3]);
  r = ziel({});
  ok('leeres Panel: alle elf "nicht im Panel", zuWenig', r.zuWenig === true && r.verworfen.length === 11 && r.verworfen.every(function (v) { return /nicht im Panel/.test(v.grund); }));
  var mm = basis(); NAMEN.slice(0, 5).forEach(function (s) { mm[s] = serie(100, 100, 100, S); });   /* fuenf zu kurz -> nur 5 zulaessig */
  ok('zu kurze Reihen zaehlen nicht zur Mindestzahl', ziel(mm).zuWenig === true);
})();

/* ---------- 10. Nur die Namensliste; Fremdkuerzel nie ---------- */
(function () {
  var m = basis(); m.AAPL = serie(253, 100, 900, S); m.SPY = serie(253, 100, 800, S);
  var r = ziel(m);
  gleich('Aktie und SPY mit +800 % stehen nicht im Ziel und nicht in der Rangfolge', [r.ziel, sym(r).indexOf('AAPL') + sym(r).indexOf('SPY')], [['XLE', 'XLK', 'XLF'], -2]);
  ok('Fremdkuerzel werden nicht mitgezaehlt (geprueft bleibt 11)', r.korb.geprueft === 11);
  var r2 = ziel(basis(), { universum: ['XLB', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLU'] });
  ok('Namensliste ist Parameter (opts.universum): sieben Namen -> sieben geprueft', r2.korb.geprueft === 7 && r2.ziel.length === 3);
})();

/* ---------- 11. Kein Blick voraus ---------- */
(function () {
  var m = basis();
  m.XLP = m.XLP.concat([[NOW + TAG, 100000, S]]);                    /* Zeile NACH dem Stichtag: wuerde XLP auf +99.900 % heben */
  var r = ziel(m);
  gleich('Zeile nach nowMs aendert nichts (Ziel und Rangfolge wie ohne)', [r.ziel, sym(r)], [r1.ziel, sym(r1)]);
  var r2 = ziel(m, { nowMs: NOW + TAG });
  ok('Gegenprobe: mit nowMs einen Tag spaeter ist die Zeile sichtbar und XLP fuehrt', r2.ziel[0] === 'XLP');
  var m2 = basis(); var nach = []; for (var k = 1; k <= 30; k++) nach.push([NOW + k * TAG, 1, S]);
  m2.XLE = m2.XLE.concat(nach);
  gleich('dreissig Tage Zukunft mit Kurs 1 aendern das Ziel am Stichtag nicht', ziel(m2).ziel, r1.ziel);
  /* Bilanzdaten werden nicht gelesen, auch nicht, wenn sie nach nowMs eingereicht sind */
  var fund = { XLE: [{ filed: '2021-12-31', periodEnde: '2021-09-30', form: '10-Q', werte: { NetIncomeLoss: -1e12 } }] };
  gleich('opts.fundamental wird ignoriert (Regel braucht keine Bilanz)', ziel(basis(), { fundamental: fund }).ziel, r1.ziel);
})();

/* ---------- 12. Eingabe wird nicht veraendert ---------- */
(function () {
  var m = basis(), vorher = JSON.stringify(m);
  ziel(m); Z.placeboZiel(m, { nowMs: NOW });
  ok('roh bleibt unveraendert (keine Mutation durch Ziel und Placebo)', JSON.stringify(m) === vorher);
})();

/* ---------- 13. Placebo ---------- */
/* Unabhaengige Nachrechnung von FNV-1a und mulberry32 mit BigInt (andere Rechenart als in ziel.js: Math.imul / >>>). */
function fnvBig(s) { var h = 0x811c9dc5n, M = 0xffffffffn; for (var i = 0; i < s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * 0x01000193n) & M; } return h; }
function mulBig(seed) {
  var a = seed, M = 0xffffffffn;
  function imul(x, y) { return (x * y) & M; }
  return function () {
    a = (a + 0x6D2B79F5n) & M; var t = a;
    t = imul(t ^ (t >> 15n), t | 1n);
    t = t ^ ((t + imul(t ^ (t >> 7n), t | 61n)) & M);
    return Number((t ^ (t >> 14n)) & M) / 4294967296;
  };
}
ok('FNV-1a("a") = 0xe40c292c (bekannter Testwert)', Z.fnv1a('a') === 0xe40c292c);
ok('FNV-1a("foobar") = 0xbf9cf968 (bekannter Testwert)', Z.fnv1a('foobar') === 0xbf9cf968);
(function () {
  var seed = fnvBig(Z.KONFIG.placeboWort + '|2021-06-30');
  ok('Seed = FNV-1a(Wort|Stichtag): BigInt-Nachrechnung stimmt', BigInt(Z.fnv1a(Z.KONFIG.placeboWort + '|2021-06-30')) === seed);
  var a = Z.mulberry32(Number(seed)), b = mulBig(seed), gleichBis = true;
  for (var i = 0; i < 20; i++) if (a() !== b()) gleichBis = false;
  ok('PRNG: die ersten 20 Werte stimmen mit der BigInt-Nachrechnung ueberein', gleichBis);
  /* Fisher-Yates von Hand nachgebaut ueber die zehn zulaessigen Kuerzel aufsteigend */
  var p = NAMEN.slice().sort(), zuf = mulBig(seed);
  for (var j = p.length - 1; j > 0; j--) { var k = Math.floor(zuf() * (j + 1)); var t = p[j]; p[j] = p[k]; p[k] = t; }
  var pl = Z.placeboZiel(basis(), { nowMs: NOW });
  gleich('Placebo-Ziel am 30.06.2021 = die ersten drei der nachgerechneten Mischung', pl.ziel, p.slice(0, 3));
  gleich('Placebo-Rangfolge ist die ganze Mischung (zehn Kuerzel)', pl.rangfolge.map(function (x) { return x.sym; }), p);
})();
(function () {
  var m = basis();
  var a = Z.placeboZiel(m, { nowMs: NOW }), b = Z.placeboZiel(m, { nowMs: NOW });
  gleich('Placebo deterministisch: zweimal derselbe Aufruf, dasselbe Ziel', a.ziel, b.ziel);
  var elig = NAMEN.slice(), stimmt = true, verschieden = {}, tage = [];
  for (var d = 0; d < 200; d++) {
    var t = NOW + d * 3 * TAG, mm = {};
    NAMEN.forEach(function (s) { mm[s] = serie(253, 100, 100 * (1 + ST[s]), S, t); });
    var res = Z.placeboZiel(mm, { nowMs: t });
    if (res.ziel.length !== 3 || new Set(res.ziel).size !== 3 || !res.ziel.every(function (s) { return elig.indexOf(s) >= 0; })) stimmt = false;
    verschieden[res.ziel.join()] = 1; tage.push(res.ziel);
  }
  ok('Placebo: an 200 Stichtagen immer genau 3 verschiedene Fonds aus dem zulaessigen Universum', stimmt);
  ok('Placebo haengt vom Stichtag ab (viele verschiedene Ziele), nicht konstant', Object.keys(verschieden).length > 50);
  var haeufig = {}; NAMEN.forEach(function (s) { haeufig[s] = 0; });
  tage.forEach(function (z) { z.forEach(function (s) { haeufig[s]++; }); });
  ok('Placebo: jeder der zehn Fonds wird in 200 Ziehungen zu 3 in 10 etwa gleich oft gewaehlt (40 bis 80 mal)', NAMEN.every(function (s) { return haeufig[s] >= 40 && haeufig[s] <= 80; }));
  /* ohne Kursbezug: alle Kurse umgedreht -> gleiche Wahl */
  var umg = {}; NAMEN.forEach(function (s) { umg[s] = serie(253, 100, 100 * (1 - ST[s] / 2), S); });
  gleich('Placebo ohne Kursbezug: umgedrehte Staerken, gleiche Wahl', Z.placeboZiel(umg, { nowMs: NOW }).ziel, a.ziel);
  ok('Gegenprobe: die Regel waehlt bei den umgedrehten Staerken anders', ziel(umg).ziel.join() !== ziel(m).ziel.join());
  /* anderes Wort, anderes Ergebnis */
  var anders = 0; for (var q = 0; q < 20; q++) {
    var tq = NOW + q * TAG, mq = {}; NAMEN.forEach(function (s) { mq[s] = serie(253, 100, 100 * (1 + ST[s]), S, tq); });
    if (Z.placeboZiel(mq, { nowMs: tq }).ziel.join() !== Z.placeboZiel(mq, { nowMs: tq, placeboWort: 'anderes-wort' }).ziel.join()) anders++;
  }
  ok('Seed haengt am Wort: anderes Wort ergibt an den meisten Tagen eine andere Wahl', anders >= 10);
  gleich('Placebo unabhaengig von der Reihenfolge der Universumsliste', Z.placeboZiel(m, { nowMs: NOW, universum: K.universum.slice().reverse() }).ziel, a.ziel);
  /* Schluesselfolge */
  var rev = {}; Object.keys(m).reverse().forEach(function (k) { rev[k] = m[k]; });
  gleich('Placebo unabhaengig von der Schluesselfolge in roh', Z.placeboZiel(rev, { nowMs: NOW }).ziel, a.ziel);
})();
(function () {
  var m = basis();
  m.XLU = serie(253, 100, 100, 500000);                 /* unter der Umsatzschwelle */
  m.XLE = serie(253, 100, 150, S, NOW - 9 * TAG);       /* veraltet */
  m.XLK = serie(100, 100, 140, S);                      /* zu kurz */
  var gesehen = {}, zuf;
  for (var d = 0; d < 100; d++) {
    var t = NOW + d * 2 * TAG, mm = {};
    NAMEN.forEach(function (s) { mm[s] = m[s].map(function (z) { return [z[0] + d * 2 * TAG, z[1], z[2]]; }); });
    zuf = Z.placeboZiel(mm, { nowMs: t });
    zuf.ziel.forEach(function (s) { gesehen[s] = 1; });
  }
  ok('Placebo waehlt nie einen unzulaessigen Fonds (Umsatz, veraltet, zu kurz) - dasselbe Universum wie die Regel', !gesehen.XLU && !gesehen.XLE && !gesehen.XLK && Object.keys(gesehen).length === 7);
  var a = Z.placeboZiel(m, { nowMs: NOW }), b = ziel(m);
  gleich('Placebo und Regel melden denselben Korb (zulaessig, geprueft, Gruende)', [a.korb, a.verworfen], [b.korb, b.verworfen]);
  var wenig = {}; ['XLB', 'XLE', 'XLF'].forEach(function (s) { wenig[s] = serie(253, 100, 110, S); });
  var pw = Z.placeboZiel(wenig, { nowMs: NOW });
  ok('Placebo: zu wenig zulaessige Fonds -> zuWenig, nicht handeln, wie die Regel', pw.zuWenig === true && pw.ziel.length === 0 && ziel(wenig).zuWenig === true);
  ok('Placebo hat Zielzahl 3 auch bei kleinstem erlaubtem Universum (6 Fonds)', (function () { var s6 = {}; NAMEN.slice(0, 6).forEach(function (s) { s6[s] = serie(253, 100, 100, S); }); return Z.placeboZiel(s6, { nowMs: NOW }).ziel.length === 3; })());
})();

console.log('Pruefungen: ' + (gut + schlecht) + ', bestanden: ' + gut + ', Fehler: ' + schlecht);
if (schlecht) process.exit(1);
