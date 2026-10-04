'use strict';
/*
 * zweitrechner-test.js — Prüfungen des zweiten Rechners an Kunstdaten mit von Hand gerechneten Sollwerten.
 * Berührt keine echten Kursdaten (nur der Abbruch-Test liest pruefsummen.json). Aufruf: node zweitrechner-test.js
 * Alles Simulation, keine Anlageberatung.
 */
var fs = require('fs');
var os = require('os');
var path = require('path');
var Z = require('./zweitrechner.js');

var gezaehlt = 0, fehler = 0;
function pruefe(name, bed, info) {
  gezaehlt++;
  if (!bed) { fehler++; console.log('ROT   ' + name + (info !== undefined ? '  → ' + JSON.stringify(info) : '')); }
}
function nahe(a, b, tol) { return typeof a === 'number' && Math.abs(a - b) <= (tol === undefined ? 1e-6 : tol); }

// ------------------------------------------------------------ Hilfsdaten

// n Wochentage ab Montag, 03.01.2000
function wochentage(n) {
  var out = [], t = Date.UTC(2000, 0, 3);
  while (out.length < n) {
    var d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) out.push(new Date(t).toISOString().slice(0, 10));
    t += 86400000;
  }
  return out;
}
function sek(tag) { return Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10), 14, 30) / 1000; }
// Yahoo-Antwort im Format v8/chart aus einer Liste von Tagen und einer Kursfunktion
function yahoo(sym, tage, f, dividenden, splits) {
  var ts = [], o = [], h = [], l = [], c = [], v = [], a = [];
  tage.forEach(function (tag, i) {
    var x = f(i, tag);
    if (!x) return;
    ts.push(sek(tag)); o.push(x.open); h.push(x.close); l.push(x.close); c.push(x.close); v.push(x.vol); a.push(x.adj !== undefined ? x.adj : x.close);
  });
  var ev = {};
  if (dividenden && dividenden.length) {
    ev.dividends = {};
    dividenden.forEach(function (d, k) { var t = sek(d.tag) + k; ev.dividends[String(t)] = { amount: d.betrag, date: t }; });
  }
  if (splits && splits.length) {
    ev.splits = {};
    splits.forEach(function (s) { ev.splits[String(sek(s.tag))] = { date: sek(s.tag), numerator: s.z, denominator: s.n, splitRatio: s.z + ':' + s.n }; });
  }
  return { chart: { result: [{ meta: { symbol: sym }, timestamp: ts, events: ev,
    indicators: { quote: [{ open: o, high: h, low: l, close: c, volume: v }], adjclose: [{ adjclose: a }] } }], error: null } };
}

// Szenario: 301 Wochentage, Fonds ab Tag 101 konstant 10 $, davor P0 (bestimmt die Rangfolge), Umsatz 2e8 $/Tag.
// variante 'wechsel': XLU ab Tag 21 bis 100 bei 2 $ → am Stichtag 280 (Zeile 28) stärkster Fonds.
function szenario(variante, fondsListe) {
  var tage = wochentage(301);
  var P0 = { XLK: 5, XLE: 8, XLF: 9, XLB: 10, XLI: 11, XLP: 12, XLU: 20, XLRE: 13, XLV: 14, XLY: 15, XLC: 16 };
  var liste = fondsListe || ['XLB', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLU'];
  var obj = {};
  liste.forEach(function (sym) {
    var div = [];
    if (sym === 'XLE') div.push({ tag: tage[270], betrag: 0.5 });
    if (sym === 'XLF') div.push({ tag: tage[281], betrag: 0.1 });
    obj[sym] = yahoo(sym, tage, function (i) {
      if (sym === 'XLRE' && i < 10) return null; // XLRE erst ab Tag 10
      var p = i > 100 ? 10 : P0[sym];
      if (variante === 'wechsel' && sym === 'XLU' && i >= 21 && i <= 100) p = 2;
      return { open: p, close: p, vol: 2e7 };
    }, div);
  });
  obj.SPY = yahoo('SPY', tage, function (i) { var p = i > 100 ? 10 : 7; return { open: p, close: p, vol: 1e8 }; }, [{ tag: tage[265], betrag: 0.2 }]);
  return { tage: tage, obj: obj };
}
function datenAus(obj) {
  var reihen = {};
  Object.keys(obj).forEach(function (s) { reihen[s] = Z.leseYahoo(obj[s], s); });
  return Z.baueDaten(reihen);
}

// rohMap-Reihe: n Zeilen, letzte am nowMs, Kurs von p0 nach p1 (linear), Stück so, dass Umsatz = umsatz
function rohReihe(n, nowMs, p0, p1, umsatz) {
  var r = [];
  for (var i = 0; i < n; i++) {
    var ts = nowMs - (n - 1 - i) * 86400000;
    var p = n === 1 ? p1 : p0 + (p1 - p0) * i / (n - 1);
    r.push([ts, p, (umsatz || 2e8) / p]);
  }
  return r;
}

// ------------------------------------------------------------ 1. Hilfen, Datum, Rundung

pruefe('tagMs/msTag', Z.msTag(Z.tagMs('2017-01-03')) === '2017-01-03' && Z.tagMs('1970-01-02') === 86400000);
pruefe('nyTag Sommer 13:30 UTC', Z.nyTag(1444311000) === '2015-10-08');
pruefe('nyTag Winter 03:00 UTC → Vortag', Z.nyTag(Date.UTC(2017, 0, 5, 3, 0) / 1000) === '2017-01-04');
pruefe('nyTag Sommer 03:59 UTC → Vortag', Z.nyTag(Date.UTC(2017, 6, 5, 3, 59) / 1000) === '2017-07-04');
pruefe('nyTag Sommer 04:00 UTC → selber Tag', Z.nyTag(Date.UTC(2017, 6, 5, 4, 0) / 1000) === '2017-07-05');
pruefe('rund4', Z.rund4(468.50739983) === 468.5074 && Z.rund4(0.00000016) === 0 && Z.rund4(3333.33333333) === 3333.3333);
pruefe('ab4 rundet ab', Z.ab4(3313.37332016) === 3313.3733 && Z.ab4(2.99999) === 2.9999);
pruefe('cent', Z.cent(101463.739172) === 101463.74 && Z.cent(99800.399202) === 99800.4);
pruefe('Kostenfaktoren 0,998 / 1,002', 1 - Z.K.KOSTEN_BP / 10000 === 0.998 && 1 + Z.K.KOSTEN_BP / 10000 === 1.002);
pruefe('Konstanten', Z.K.RUECKBLICK === 252 && Z.K.MINDESTZEILEN === 253 && Z.K.ZIELZAHL === 3 && Z.K.MINDEST_ZULAESSIG === 6 &&
  Z.K.UMSATZ_MIN === 1e8 && Z.K.HALTEN === 21 && Z.K.KOSTEN_BP === 20 && Z.K.STARTKAPITAL === 100000 && Z.K.UNIVERSUM.length === 11 &&
  Z.K.UNIVERSUM.indexOf('SPY') < 0 && Z.K.SPY_ERGAENZUNG.betrag === 1.2456 && Z.K.SPY_ERGAENZUNG.exTag === '2018-06-15');
pruefe('Fenster-Konstanten', Z.FENSTER.A.tage === 56 * 21 + 7 && Z.FENSTER.B.tage === 59 * 21 + 15 && Z.FENSTER.A.perioden === 57 && Z.FENSTER.B.perioden === 60);

// ------------------------------------------------------------ 2. Placebo-Bausteine

pruefe('FNV-1a ""', Z.fnv1a32('') === 0x811c9dc5);
pruefe('FNV-1a "a"', Z.fnv1a32('a') === 0xe40c292c);
pruefe('FNV-1a "foobar"', Z.fnv1a32('foobar') === 0xbf9cf968);
var M32 = (1n << 32n) - 1n;
function fnvBig(s) { var h = 0x811c9dc5n; for (var i = 0; i < s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * 0x01000193n) & M32; } return Number(h); }
function mulberryBig(seed) {
  var a = BigInt(seed >>> 0);
  var imul = function (x, y) { return (x * y) & M32; };
  return function () {
    a = (a + 0x6D2B79F5n) & M32;
    var t = imul(a ^ (a >> 15n), a | 1n);
    t = ((t + imul(t ^ (t >> 7n), t | 61n)) & M32) ^ t;
    return Number((t ^ (t >> 14n)) & M32) / 4294967296;
  };
}
['sektor-momentum-placebo-v1|2017-01-03', 'sektor-momentum-placebo-v1|2021-09-15', 'x'].forEach(function (w) {
  pruefe('FNV-1a gegen BigInt: ' + w, Z.fnv1a32(w) === fnvBig(w));
});
[0, 1, 0x811c9dc5, 0xffffffff, Z.fnv1a32('sektor-momentum-placebo-v1|2017-01-03')].forEach(function (seed) {
  var r1 = Z.mulberry32(seed), r2 = mulberryBig(seed), gleich = true;
  for (var i = 0; i < 2000; i++) { var x = r1(), y = r2(); if (x !== y || !(x >= 0 && x < 1)) { gleich = false; break; } }
  pruefe('mulberry32 gegen BigInt, Seed ' + seed, gleich);
});
(function () {
  var folge = [0.5, 0.1, 0.9, 0.0, 0.7], k = 0;
  var m = Z.mische(['A', 'B', 'C', 'D', 'E', 'F'], function () { return folge[k++]; });
  // i=5 j=3 → A B C F E D; i=4 j=0 → E B C F A D; i=3 j=3; i=2 j=0 → C B E F A D; i=1 j=1
  pruefe('Fisher-Yates von Hand', m.join('') === 'CBEFAD', m);
  pruefe('Fisher-Yates zieht genau n−1 Zufallszahlen', k === 5);
})();

// ------------------------------------------------------------ 3. Zielfunktion

var NOW = Date.UTC(2020, 5, 30);
function basisMap() {
  // Stärken: XLK 1,0 XLY 0,9 XLV 0,8 XLU 0,7 ... (verschiedene Endkurse bei gleichem Anfangskurs 10)
  var m = {};
  Z.K.UNIVERSUM.forEach(function (s, i) { m[s] = rohReihe(300, NOW, 10, 10 * (1 + (i + 1) / 10)); });
  return m;
}
(function () {
  var m = basisMap();
  var z = Z.zielfunktion(m, NOW);
  // Reihenfolge der UNIVERSUM-Liste: XLB .1, XLC .2, XLE .3, XLF .4, XLI .5, XLK .6, XLP .7, XLRE .8, XLU .9, XLV 1.0, XLY 1.1
  pruefe('Grundfall: Ziel XLY, XLV, XLU', z.ziel.join(',') === 'XLY,XLV,XLU' && !z.zuWenig && z.zulaessig === 11, z.ziel);
  pruefe('Grundfall: Stärke = Schluss(i)/Schluss(i−252) − 1', nahe(z.rangfolge[0].staerke, m.XLY[299][1] / m.XLY[299 - 252][1] - 1, 1e-12));
  pruefe('Grundfall: Umsatz = Median Kurs × Stück', nahe(z.rangfolge[0].umsatz, 2e8, 1e-3));
  // kein Überspringen: Zwischenkurse ändern nichts
  var m2 = basisMap();
  m2.XLB = m2.XLB.map(function (r, i) { return (i > 47 && i < 299) ? [r[0], 1000, r[2]] : r; });
  var z2 = Z.zielfunktion(m2, NOW);
  pruefe('kein Überspringen: Zwischenkurse ohne Wirkung', z2.rangfolge.filter(function (x) { return x.sym === 'XLB'; })[0].staerke ===
    z.rangfolge.filter(function (x) { return x.sym === 'XLB'; })[0].staerke);
  // Anfang ist genau Zeile i − 252
  var m3 = basisMap(); m3.XLB[299 - 252] = [m3.XLB[299 - 252][0], 5, m3.XLB[299 - 252][2]];
  var s3 = Z.zielfunktion(m3, NOW).rangfolge.filter(function (x) { return x.sym === 'XLB'; })[0].staerke;
  pruefe('Anfang = Zeile i − 252', nahe(s3, 11 / 5 - 1, 1e-9), s3);
  // Gleichstand: Kürzel aufsteigend, unabhängig von der Schlüsselfolge
  var m4 = {}; ['XLY', 'XLV', 'XLB', 'XLC', 'XLE', 'XLF', 'XLI'].forEach(function (s) { m4[s] = rohReihe(300, NOW, 10, 20); });
  var z4 = Z.zielfunktion(m4, NOW);
  pruefe('Gleichstand → Kürzel aufsteigend', z4.ziel.join(',') === 'XLB,XLC,XLE', z4.ziel);
  // Länge 252/253, Zeile nach dem Stichtag zählt nicht
  var m5 = basisMap(); m5.XLC = rohReihe(252, NOW, 10, 100);
  pruefe('252 Zeilen → zu kurz', Z.zielfunktion(m5, NOW).verworfen.XLC === 'zu kurz');
  m5.XLC = rohReihe(253, NOW, 10, 100);
  pruefe('253 Zeilen → zulässig und vorn', Z.zielfunktion(m5, NOW).ziel[0] === 'XLC');
  m5.XLC = rohReihe(253, NOW + 86400000, 10, 100);
  pruefe('Zeile nach dem Stichtag zählt nicht zur Länge', Z.zielfunktion(m5, NOW).verworfen.XLC === 'zu kurz');
  // veraltet 8 gegen 7 Tage
  var m6 = basisMap(); m6.XLC = rohReihe(300, NOW - 8 * 86400000, 10, 100);
  pruefe('8 Tage alt → veraltet', Z.zielfunktion(m6, NOW).verworfen.XLC === 'veraltet');
  m6.XLC = rohReihe(300, NOW - 7 * 86400000, 10, 100);
  pruefe('7 Tage alt → zulässig', Z.zielfunktion(m6, NOW).verworfen.XLC === undefined);
  // Kurs ≤ 0 und NaN
  var m7 = basisMap(); m7.XLC = rohReihe(300, NOW, 10, 100); m7.XLC[299 - 252] = [m7.XLC[47][0], 0, 1e9];
  pruefe('Kurs 0 am Anfang → unzulässig', Z.zielfunktion(m7, NOW).verworfen.XLC === 'Kurs nicht positiv');
  m7.XLC = rohReihe(300, NOW, 10, 100); m7.XLC[299] = [NOW, NaN, 1e7];
  pruefe('Kurs NaN am Ende → unzulässig', Z.zielfunktion(m7, NOW).verworfen.XLC === 'Kurs nicht positiv');
  // Lücke 401 gegen 400 Tage
  var m8 = basisMap(), r8 = rohReihe(300, NOW, 10, 100);
  r8 = r8.map(function (r, i) { return i <= 299 - 252 ? [NOW - 401 * 86400000 - (299 - 252 - i) * 86400000, r[1], r[2]] : r; });
  m8.XLC = r8;
  pruefe('Spanne 401 Tage → Lücke', Z.zielfunktion(m8, NOW).verworfen.XLC === 'Lücke in der Reihe');
  m8.XLC = r8.map(function (r, i) { return i <= 299 - 252 ? [r[0] + 86400000, r[1], r[2]] : r; });
  pruefe('Spanne 400 Tage → zulässig', Z.zielfunktion(m8, NOW).verworfen.XLC === undefined);
  // Umsatzschwelle: Median = sortiert[10] von 20 Balken
  function mitUmsatz(werte) { var r = rohReihe(300, NOW, 10, 100); for (var k = 0; k < 20; k++) r[280 + k] = [r[280 + k][0], r[280 + k][1], werte[k] / r[280 + k][1]]; return r; }
  var unten = [], i;
  for (i = 0; i < 10; i++) unten.push(5e7);
  var m9 = basisMap();
  m9.XLC = mitUmsatz(unten.concat([1e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8]));
  pruefe('10 unter, 10 darüber: Median = oberer der mittleren = 1e8 genau → zulässig', Z.zielfunktion(m9, NOW).verworfen.XLC === undefined);
  m9.XLC = mitUmsatz(unten.concat([5e7, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8]));
  pruefe('11 unter → unzulässig', Z.zielfunktion(m9, NOW).verworfen.XLC === 'Umsatz unter Schwelle');
  m9.XLC = mitUmsatz(unten.concat([99999999, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8, 2e8]));
  pruefe('Median knapp unter 1e8 → unzulässig', Z.zielfunktion(m9, NOW).verworfen.XLC === 'Umsatz unter Schwelle');
  var r10 = rohReihe(300, NOW, 10, 100); for (i = 0; i < 280; i++) r10[i] = [r10[i][0], r10[i][1], 1];
  m9.XLC = r10;
  pruefe('Balken außerhalb der 20 ohne Wirkung', Z.zielfunktion(m9, NOW).verworfen.XLC === undefined);
  // Mindestzahl 5 gegen 6
  var m11 = {}; ['XLB', 'XLE', 'XLF', 'XLI', 'XLK'].forEach(function (s, k) { m11[s] = rohReihe(300, NOW, 10, 11 + k); });
  var z11 = Z.zielfunktion(m11, NOW);
  pruefe('5 zulässig → zuWenig, Ziel leer', z11.zuWenig && z11.ziel.length === 0 && z11.zulaessig === 5 && z11.verworfen.XLRE === 'nicht im Panel');
  m11.XLP = rohReihe(300, NOW, 10, 10.5);
  var z12 = Z.zielfunktion(m11, NOW);
  pruefe('6 zulässig → Ziel 3', !z12.zuWenig && z12.ziel.join(',') === 'XLK,XLI,XLF', z12.ziel);
  pruefe('leere Map → zuWenig', Z.zielfunktion({}, NOW).zuWenig);
  // Fremdkürzel nie im Ziel
  var m13 = basisMap(); m13.SPY = rohReihe(300, NOW, 1, 1000); m13.AAPL = rohReihe(300, NOW, 1, 1000);
  var z13 = Z.zielfunktion(m13, NOW);
  pruefe('Fremdkürzel (SPY, AAPL) nie im Ziel', z13.ziel.indexOf('SPY') < 0 && z13.ziel.indexOf('AAPL') < 0 && z13.zulaessig === 11);
  // kein Blick voraus + Gegenprobe
  var m14 = basisMap(), z14a = Z.zielfunktion(m14, NOW);
  m14.XLB = m14.XLB.concat([[NOW + 86400000, 10000, 1e9]]);
  var z14b = Z.zielfunktion(m14, NOW);
  pruefe('kein Blick voraus: Zeile nach nowMs ohne Wirkung', JSON.stringify(z14a) === JSON.stringify(z14b));
  var z14c = Z.zielfunktion(m14, NOW + 86400000);
  pruefe('Gegenprobe: mit späterem nowMs wirkt die Zeile', z14c.ziel[0] === 'XLB');
  // keine Mutation
  var m15 = basisMap(), kopie = JSON.stringify(m15);
  Z.zielfunktion(m15, NOW); Z.placeboZiel(m15, NOW);
  pruefe('keine Mutation der Eingabe', JSON.stringify(m15) === kopie);
  // 253 letzte Zeilen gleichwertig zur ganzen Reihe
  var m16 = basisMap(), m16k = {};
  Object.keys(m16).forEach(function (s) { m16k[s] = m16[s].slice(-253); });
  pruefe('letzte 253 Zeilen = ganze Reihe', JSON.stringify(Z.zielfunktion(m16, NOW)) === JSON.stringify(Z.zielfunktion(m16k, NOW)));
})();

// ------------------------------------------------------------ 4. Placebo

(function () {
  var m = basisMap();
  var p = Z.placeboZiel(m, NOW);
  var wort = 'sektor-momentum-placebo-v1|2020-06-30';
  pruefe('Placebo: Wort und Seed', p.wort === wort && p.seed === fnvBig(wort));
  var erwartet = Z.mische(Z.K.UNIVERSUM.slice().sort(), mulberryBig(fnvBig(wort))).slice(0, 3);
  pruefe('Placebo: Ziel = Fisher-Yates (BigInt-Generator) über die sortierten zulässigen Kürzel', p.ziel.join(',') === erwartet.join(','), [p.ziel, erwartet]);
  pruefe('Placebo: deterministisch', Z.placeboZiel(basisMap(), NOW).ziel.join(',') === p.ziel.join(','));
  pruefe('Placebo: 3 verschiedene zulässige', p.ziel.length === 3 && new Set(p.ziel).size === 3);
  // ohne Kursbezug: andere Kurse, gleiche Zulässigkeit → gleiches Ziel
  var m2 = {}; Z.K.UNIVERSUM.forEach(function (s, i) { m2[s] = rohReihe(300, NOW, 50, 50 * (1 - i / 20)); });
  pruefe('Placebo: ohne Kursbezug', Z.placeboZiel(m2, NOW).ziel.join(',') === p.ziel.join(','));
  // nur aus zulässigen; unzulässige nie
  var nie = true;
  for (var d = 0; d < 300; d++) {
    var jetzt = NOW + d * 86400000, m3d = {};
    Z.K.UNIVERSUM.forEach(function (s) { if (s !== 'XLC') m3d[s] = rohReihe(s === 'XLK' ? 100 : 300, jetzt, 10, 12); });
    var z = Z.placeboZiel(m3d, jetzt); // XLC fehlt, XLK zu kurz
    z.ziel.forEach(function (s) { if (s === 'XLC' || s === 'XLK') nie = false; });
  }
  pruefe('Placebo: nie ein unzulässiger Fonds', nie);
  // gleichverteilt über viele Stichtage (Seed je Stichtag)
  var zaehl = {}, n = 0;
  for (var t = 0; t < 3000; t++) {
    var now = NOW + t * 86400000;
    var mm = {}; Z.K.UNIVERSUM.forEach(function (s) { mm[s] = [[now - 400 * 86400000, 10, 1e8]].concat(rohReihe(253, now, 10, 11).slice(1)); });
    // (gleiche Stärken; die Zulässigkeit hängt nicht vom Tag ab)
    var pz = Z.placeboZiel(mm, now);
    pz.ziel.forEach(function (s) { zaehl[s] = (zaehl[s] || 0) + 1; }); n++;
  }
  var anteile = Object.keys(zaehl).map(function (s) { return zaehl[s] / (3 * n); });
  pruefe('Placebo: jeder Fonds etwa 1/11 (±0,02)', Object.keys(zaehl).length === 11 && anteile.every(function (a) { return Math.abs(a - 1 / 11) < 0.02; }), zaehl);
  // zuWenig wie die Regel
  var m4 = {}; ['XLB', 'XLE', 'XLF', 'XLI', 'XLK'].forEach(function (s) { m4[s] = rohReihe(300, NOW, 10, 12); });
  var p4 = Z.placeboZiel(m4, NOW);
  pruefe('Placebo: zuWenig wie die Regel', p4.zuWenig && p4.ziel.length === 0);
  // derselbe Korb wie die Regel
  pruefe('Placebo: dieselbe Zulässigkeit', p.zulaessig === Z.zielfunktion(m, NOW).zulaessig);
})();

// ------------------------------------------------------------ 5. Mechanik Gleichgewicht von Hand

(function () {
  // Fall 1: Erstkauf aus Bargeld, letzter Kauf verkleinert
  var buch = { bargeld: 100000, pos: new Map() };
  var kurse = { A: 10, B: 20, C: 50 };
  var r = Z.gleichgewicht(buch, ['A', 'B', 'C'], function (s) { return kurse[s]; }, 20);
  pruefe('GG1 Budget', nahe(r.budget, 100000 / 3, 1e-9));
  pruefe('GG1 Stück A/B', buch.pos.get('A') === 3333.3333 && buch.pos.get('B') === 1666.6667);
  pruefe('GG1 C verkleinert floor4(33199,999666/50,1) = 662,6746', buch.pos.get('C') === 662.6746, buch.pos.get('C'));
  pruefe('GG1 Bargeld 0,002206', nahe(buch.bargeld, 0.002206, 1e-7), buch.bargeld);
  pruefe('GG1 Kosten 199,600794 = 0,002 × Volumen', nahe(r.kosten, 199.600794, 1e-6) && nahe(r.kosten, 0.002 * r.volumen, 1e-8), r.kosten);
  pruefe('GG1 Käufe in Zielfolge, letzter verkleinert', r.handel.map(function (h) { return h.sym; }).join('') === 'ABC' && r.handel[2].verkleinert && !r.handel[0].verkleinert);

  // Fall 2: Nicht-Ziel ganz verkauft, Gewinner teilverkauft, Rundung auf 0 nicht gehandelt, Neukauf, Aufstocken verkleinert
  kurse = { A: 12, B: 18, C: 50, D: 25 };
  var r2 = Z.gleichgewicht(buch, ['A', 'D', 'B'], function (s) { return kurse[s]; }, 20);
  pruefe('GG2 Depotwert 103133,732406', nahe(r2.depotwert, 103133.732406, 1e-6), r2.depotwert);
  pruefe('GG2 Budget 34377,910802', nahe(r2.budget, 34377.910802, 1e-6));
  pruefe('GG2 C ganz verkauft', !buch.pos.has('C'));
  pruefe('GG2 A teilverkauft um 468,5074 → 2864,8259', buch.pos.get('A') === 2864.8259, buch.pos.get('A'));
  pruefe('GG2 A Rest-Differenz rundet auf 0 → kein Kauf', r2.handel.filter(function (h) { return h.sym === 'A'; }).length === 1);
  pruefe('GG2 D neu 1375,1164', buch.pos.get('D') === 1375.1164, buch.pos.get('D'));
  pruefe('GG2 B aufgestockt verkleinert um 234,622 → 1901,2887', buch.pos.get('B') === 1901.2887, buch.pos.get('B'));
  pruefe('GG2 Bargeld 0,0011564', nahe(buch.bargeld, 0.0011564, 1e-7), buch.bargeld);
  pruefe('GG2 Kosten 154,7138496', nahe(r2.kosten, 154.7138496, 1e-6) && nahe(r2.kosten, 0.002 * r2.volumen, 1e-8), r2.kosten);
  pruefe('GG2 Verkäufe vor Käufen', r2.handel.map(function (h) { return h.art; }).join(',') === 'teilverkauf,verkauf,kauf,aufstockung' ||
    r2.handel.map(function (h) { return h.art; }).join(',') === 'verkauf,teilverkauf,kauf,aufstockung', r2.handel.map(function (h) { return h.art; }));

  // Fall 3: neues Ziel ohne Eröffnungskurs → Anteil bleibt Bargeld
  var b3 = { bargeld: 90000, pos: new Map() };
  var k3 = { A: 10, B: 20 };
  var r3 = Z.gleichgewicht(b3, ['A', 'B', 'C'], function (s) { return k3[s] === undefined ? null : k3[s]; }, 20);
  pruefe('GG3 Ziel ohne Kurs: A 3000, B 1500, C nicht gekauft, Bargeld 29880',
    b3.pos.get('A') === 3000 && b3.pos.get('B') === 1500 && !b3.pos.has('C') && nahe(b3.bargeld, 29880, 1e-8), [Array.from(b3.pos), b3.bargeld]);
  pruefe('GG3 Kosten 120 = 0,002 × 60.000', nahe(r3.kosten, 120, 1e-8));
  // Fall 4: gehaltene Position ohne Kurs bleibt und zählt nicht zum Depotwert
  var b4 = { bargeld: 30000, pos: new Map([['X', 100]]) };
  var r4 = Z.gleichgewicht(b4, ['A', 'B', 'C'], function (s) { return s === 'X' ? null : 10; }, 20);
  pruefe('GG4 Depotwert ohne X', r4.depotwert === 30000 && b4.pos.get('X') === 100);
  pruefe('GG4 A 1000, B 1000, C floor4(9960/10,02) = 994,0119', b4.pos.get('A') === 1000 && b4.pos.get('B') === 1000 && b4.pos.get('C') === 994.0119, Array.from(b4.pos));
  // Fall 5: gehaltenes Ziel ohne Kurs wird weder verkauft noch gekauft
  var b5 = { bargeld: 0, pos: new Map([['A', 50], ['B', 10]]) };
  Z.gleichgewicht(b5, ['A', 'C', 'D'], function (s) { return s === 'A' ? null : 10; }, 20);
  pruefe('GG5 A ohne Kurs gehalten, B verkauft, Erlös gekauft', b5.pos.get('A') === 50 && !b5.pos.has('B') && b5.pos.has('C'));
  // bewerte rundet die Summe einmal auf Cent
  var b6 = { bargeld: 0.004, pos: new Map([['A', 0.0001], ['B', 0.0001]]) };
  pruefe('bewerte: Summe einmal auf Cent (0,004 + 0,003 + 0,003 = 0,01)', Z.bewerte(b6, function () { return 30; }) === 0.01);
})();

// ------------------------------------------------------------ 6. Nachlauf am Kunstkalender

function pruefeSzenario(variante) {
  var sz = szenario(variante);
  var d = datenAus(sz.obj);
  var sim = Z.simuliere(d, { s: 260, e: 300, modus: 'regel' });
  var a = Z.auswerten(d, sim);
  var tag = function (i) { return sz.tage[i]; };
  var w = function (i) { return sim.tage[i - 260]; };
  var u1 = sim.umschichtungen[0];
  var v = variante || 'grund';
  pruefe(v + ': Ausführungstage 260 und 281 (Takt 21)', sim.ausgefuehrt.join(',') === '260,281', sim.ausgefuehrt);
  pruefe(v + ': Stichtag = Tag davor', u1.stichtag === tag(259) && u1.ausfuehrungstag === tag(260));
  pruefe(v + ': Ziel 1 = XLK, XLE, XLF', u1.ziel.join(',') === 'XLK,XLE,XLF' && u1.zulaessig === 7, u1.ziel);
  pruefe(v + ': Stück nach Handel 1', u1.stueckNachHandel.XLK === 3333.3333 && u1.stueckNachHandel.XLE === 3333.3333 && u1.stueckNachHandel.XLF === 3313.3733, u1.stueckNachHandel);
  pruefe(v + ': Bargeld 1 = 0,000202', nahe(u1.bargeld, 0.000202, 1e-7), u1.bargeld);
  pruefe(v + ': Kosten 1 = 199,600798', nahe(u1.kosten, 199.600798, 1e-6), u1.kosten);
  pruefe(v + ': Wert Tag 260–269 = 99.800,40', w(260).buch === 99800.4 && w(269).buch === 99800.4, [w(260).buch, w(269).buch]);
  pruefe(v + ': XLE-Ausschüttung Tag 270: 3333,3333 × 0,5 = 1666,66665', nahe(sim.ausschuettungen[0].betrag, 1666.66665, 1e-7) && sim.ausschuettungen[0].tag === tag(270));
  pruefe(v + ': Wert Tag 270 = 101.467,07', w(270).buch === 101467.07, w(270).buch);
  pruefe(v + ': SPY: Kauf 10000 Anteile, Ausschüttung Tag 265 wieder angelegt → 102.000', nahe(w(264).spy, 100000, 1e-6) && nahe(w(265).spy, 102000, 1e-6) && nahe(w(300).spy, 102000, 1e-6));
  var u2 = sim.umschichtungen[1];
  // XLF-Ausschüttung am Ausführungstag 281: Anspruch nach dem Bestand VOR dem Handel (3313,3733), gutgeschrieben NACH dem Handel
  var dx = sim.ausschuettungen.filter(function (x) { return x.fonds === 'XLF'; })[0];
  pruefe(v + ': XLF-Ausschüttung am Ausführungstag nach dem Bestand über die Nacht', dx && dx.stueck === 3313.3733 && nahe(dx.betrag, 331.33733, 1e-7) && dx.tag === tag(281), dx);
  if (!variante) {
    pruefe(v + ': Ziel 2 unverändert, nur Aufstocken', u2.ziel.join(',') === 'XLK,XLE,XLF');
    pruefe(v + ': Stück nach Handel 2', u2.stueckNachHandel.XLK === 3382.2355 && u2.stueckNachHandel.XLE === 3382.2355 && u2.stueckNachHandel.XLF === 3381.9029, u2.stueckNachHandel);
    pruefe(v + ': Kosten 2 = 3,32668', nahe(u2.kosten, 3.32668, 1e-6), u2.kosten);
    pruefe(v + ': Bargeld nach Handel 2 = 0,000172 (Gutschrift danach)', nahe(u2.bargeld, 0.000172, 1e-7), u2.bargeld);
    pruefe(v + ': Bargeld Tag 281 = 331,337502', nahe(w(281).bargeld, 331.337502, 1e-6), w(281).bargeld);
    pruefe(v + ': Endwert 101.795,08', a.endwertBuch === 101795.08, a.endwertBuch);
    pruefe(v + ': Periode 1 Buch 100.000 → 101.467,07', a.perioden[0].buchAnfang === 100000 && a.perioden[0].buchEnde === 101467.07 && a.perioden[0].endtag === tag(280));
    pruefe(v + ': Periode 2 Buch 101.467,07 → 101.795,08', a.perioden[1].buchAnfang === 101467.07 && a.perioden[1].buchEnde === 101795.08);
  } else {
    pruefe(v + ': Ziel 2 = XLU, XLK, XLE (XLF fällt heraus)', u2.ziel.join(',') === 'XLU,XLK,XLE', u2.ziel);
    pruefe(v + ': Stück nach Handel 2', u2.stueckNachHandel.XLU === 3382.2355 && u2.stueckNachHandel.XLK === 3382.2355 && u2.stueckNachHandel.XLE === 3368.6758 &&
      u2.stueckNachHandel.XLF === undefined, u2.stueckNachHandel);
    pruefe(v + ': Kosten 2 = 135,59707', nahe(u2.kosten, 135.59707, 1e-6), u2.kosten);
    pruefe(v + ': Bargeld nach Handel 2 = 0,000782', nahe(u2.bargeld, 0.000782, 1e-7), u2.bargeld);
    pruefe(v + ': Endwert 101.662,81', a.endwertBuch === 101662.81, a.endwertBuch);
  }
  pruefe(v + ': Perioden 2 (21 + 20 Tage)', a.zahlPerioden === 2 && a.perioden[0].handelstage === 21 && a.perioden[1].handelstage === 20);
  pruefe(v + ': Periode SPY 100.000 → 102.000 → 102.000', nahe(a.perioden[0].spyEnde, 102000, 1e-6) && nahe(a.perioden[1].spyAnfang, 102000, 1e-6) && a.perioden[0].spyAnfang === 100000);
  var tageKal = (Z.tagMs(tag(300)) - Z.tagMs(tag(260))) / 86400000;
  pruefe(v + ': p. a. geometrisch über Kalendertage/365,25', tageKal === 56 && nahe(a.paBuchProzent, (Math.pow(a.endwertBuch / 100000, 365.25 / 56) - 1) * 100, 1e-9) &&
    nahe(a.abstandPpPa, a.paBuchProzent - a.paSpyProzent, 1e-12));
  pruefe(v + ': Tageswerte 41, Kostenklinke je Umschichtung', a.tageswerte.length === 41 && sim.umschichtungen.every(function (x) { return x.kostenKlinke; }));
  pruefe(v + ': keine zuWenig-Tage, keine Reihenenden, SPY eine Ausschüttung', a.zuWenigTage === 0 && a.reihenenden.length === 0 && a.zahlAusschuettungenSpy === 1);
  pruefe(v + ': ausführbar (0 % zuWenig)', a.nichtAusfuehrbar === false && a.anteilZuWenig === 0);
  return { d: d, a: a };
}
var grund = pruefeSzenario();
pruefeSzenario('wechsel');

(function () {
  // Placebo am Kunstkalender: läuft, 3 verschiedene zulässige je Umschichtung, Seed aus dem Stichtag
  var p = Z.auswerten(grund.d, Z.simuliere(grund.d, { s: 260, e: 300, modus: 'placebo' }));
  var ok = p.umschichtungen.every(function (u) {
    var erw = Z.mische(['XLB', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLU'], mulberryBig(fnvBig('sektor-momentum-placebo-v1|' + u.stichtag))).slice(0, 3);
    return u.ziel.join(',') === erw.join(',') && new Set(u.ziel).size === 3;
  });
  pruefe('Placebo-Lauf: Ziel je Stichtag = unabhängige Nachrechnung', ok && p.umschichtungen.length === 2);
  pruefe('Placebo-Lauf: SPY gleich wie Regel', p.endwertSpy === grund.a.endwertSpy);
})();

(function () {
  // zuWenig: nur 5 Fonds → kein Handel, jeder Tag neu versucht und gezählt
  var sz = szenario(null, ['XLB', 'XLE', 'XLF', 'XLI', 'XLK']);
  var d = datenAus(sz.obj);
  var a = Z.auswerten(d, Z.simuliere(d, { s: 260, e: 300 }));
  pruefe('zuWenig: 41 Tage gezählt, kein Handel, Buch 100.000', a.zuWenigTage === 41 && a.zahlUmschichtungen === 0 && a.tageswerte.every(function (t) { return t.buch === 100000; }));
  pruefe('zuWenig: Fenster nicht ausführbar', a.nichtAusfuehrbar === true);
  // spät zulässig: XLRE ab Tag 10 → 253 Zeilen erst am Stichtag 262 → Ausführung 263, dann 284
  var sz2 = szenario(null, ['XLB', 'XLE', 'XLF', 'XLI', 'XLK', 'XLRE']);
  var d2 = datenAus(sz2.obj);
  var s2 = Z.simuliere(d2, { s: 260, e: 300 });
  pruefe('zuWenig 260–262, Ausführung 263, nächste 284', s2.zuWenigTage.length === 3 && s2.ausgefuehrt.join(',') === '263,284', [s2.zuWenigTage.length, s2.ausgefuehrt]);
  pruefe('Perioden beginnen mit der ersten ausgeführten Umschichtung', Z.auswerten(d2, s2).perioden[0].ausfuehrungstag === sz2.tage[263]);
})();

(function () {
  // Gleich wie SPY: drei Fonds mit dem Kursverlauf von SPY, keine Ausschüttungen → Buch = SPY minus Kosten
  var tage = wochentage(320), obj = {};
  function kurs(i) { return 50 * (1 + 0.3 * Math.sin(i / 17)) * (1 + i / 1000); }
  ['XLB', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP'].forEach(function (sym, k) {
    obj[sym] = yahoo(sym, tage, function (i) { var p = i >= 60 ? kurs(i) : 10 + k; return { open: p, close: p, vol: 1e7 }; });
  });
  obj.SPY = yahoo('SPY', tage, function (i) { return { open: kurs(i), close: kurs(i), vol: 1e8 }; });
  var d = datenAus(obj);
  var a = Z.auswerten(d, Z.simuliere(d, { s: 270, e: 319 }));
  var rel = a.endwertBuch / a.endwertSpy;
  pruefe('SPY-gleich: Buch knapp unter SPY, Abstand ≈ Kostenanteil', a.endwertBuch < a.endwertSpy && rel > 0.997 && rel < 0.999, [a.endwertBuch, a.endwertSpy, a.kostenSumme]);
})();

// ------------------------------------------------------------ 7. Parser und SPY-Ergänzung

(function () {
  var tage = wochentage(6);
  var o = yahoo('XLB', tage, function (i) { return { open: i === 2 ? null : 10 + i, close: i === 4 ? null : 10 + i, vol: i === 3 ? null : 100, adj: 9 + i }; },
    [{ tag: tage[3], betrag: 0.25 }], [{ tag: tage[5], z: 2, n: 1 }]);
  // doppelter Tag: gleicher Balken und abweichender Balken am Ende anhängen
  var r0 = o.chart.result[0], q = r0.indicators.quote[0];
  function haenge(k, close) { r0.timestamp.push(r0.timestamp[k] + 3600); q.open.push(q.open[k]); q.high.push(close); q.low.push(close); q.close.push(close); q.volume.push(q.volume[k]); r0.indicators.adjclose[0].adjclose.push(r0.indicators.adjclose[0].adjclose[k]); }
  haenge(0, q.close[0]);
  haenge(1, 99);
  var r = Z.leseYahoo(o, 'XLB');
  pruefe('Parser: Balken ohne Schluss entfällt und wird gezählt', r.zaehler.ohneSchluss === 1 && r.zeilen.length === 5);
  pruefe('Parser: doppelt gleich / verschieden gezählt, der letzte gilt', r.zaehler.doppeltGleich === 1 && r.zaehler.doppeltVerschieden === 1 && r.zeilen[1].close === 99);
  pruefe('Parser: open fehlt → kein Eröffnungskurs', r.zeilen[2].open === null && r.zaehler.ohneEroeffnung === 1);
  pruefe('Parser: volume fehlt → Stück null', r.zeilen[3].vol === null);
  pruefe('Parser: Zeitstempel = Mitternacht UTC des New-Yorker Tages', r.zeilen[0].ts === Z.tagMs(tage[0]) && r.zeilen[0].tag === tage[0]);
  pruefe('Parser: Ausschüttung mit New-Yorker Ex-Tag, Split gezählt', r.dividenden.length === 1 && r.dividenden[0].exTag === tage[3] && r.splits.length === 1 && r.meta.splits === 1);
  pruefe('Parser: meta (Zeitstempel roh, erster/letzter Tag)', r.meta.zeitstempel === 8 && r.meta.ersterTag === tage[0] && r.meta.letzterTag === tage[1]);
  // Rangzeile = [ts, adjclose, close × volume / adjclose]
  var spyO = yahoo('SPY', tage, function (i) { return { open: 10, close: 10, vol: 1 }; });
  var d = Z.baueDaten({ SPY: Z.leseYahoo(spyO, 'SPY'), XLB: r });
  var z0 = d.fonds.XLB.roh[0];
  pruefe('Rangzeile [ts, adjclose, close × volume / adjclose]', z0[0] === Z.tagMs(tage[0]) && z0[1] === 9 && nahe(z0[1] * z0[2], 10 * 100, 1e-9));
  pruefe('Rangzeile ohne volume → Stück null', d.fonds.XLB.roh[3][2] === null);
  // Ausschüttung: basis = Schluss der letzten Zeile vor dem Ex-Tag
  var dv = d.fonds.XLB.dividendenListe[0];
  pruefe('Ausschüttung: basis = Vortagesschluss, satz = Betrag/basis', dv.basis === 12 && nahe(dv.satz, 0.25 / 12, 1e-15) && dv.buchungstag === tage[3]);
})();

(function () {
  // Ex-Tag ohne Handelstag → erster Handelstag danach; Betrag ≤ 0 und Ex-Tag nach der letzten Zeile zählen nicht
  var tage = wochentage(10);
  var spyO = yahoo('SPY', tage, function (i) { return i === 4 ? null : { open: 10, close: 10 + i, vol: 1 }; });
  var f = yahoo('XLE', tage.slice(0, 8), function (i) { return { open: 20, close: 20 + i, vol: 1 }; },
    [{ tag: tage[4], betrag: 0.5 }, { tag: tage[5], betrag: 0 }, { tag: tage[9], betrag: 0.3 }, { tag: tage[6], betrag: 0.1 }, { tag: tage[6], betrag: 0.2 }]);
  var d = Z.baueDaten({ SPY: Z.leseYahoo(spyO, 'SPY'), XLE: Z.leseYahoo(f, 'XLE') });
  var L = d.fonds.XLE.dividendenListe;
  pruefe('Ex-Tag ohne Handelstag → erster Handelstag danach', L[0].exTag === tage[4] && L[0].buchungstag === tage[5]);
  pruefe('Vortag = letzte Zeile vor dem Ex-Tag (LESART 7)', L[0].basis === 23);
  pruefe('Betrag 0 und Ex-Tag nach der letzten Zeile zählen nicht; zwei Sätze an einem Tag zählen beide', L.length === 3 && L[1].exTag === tage[6] && L[2].exTag === tage[6]);
})();

(function () {
  // SPY-Ergänzung 15.06.2018
  var tage = ['2018-06-13', '2018-06-14', '2018-06-15', '2018-06-18'];
  var ohne = Z.leseYahoo(yahoo('SPY', tage, function () { return { open: 270, close: 275, vol: 1 }; }), 'SPY');
  var d1 = Z.baueDaten({ SPY: ohne });
  var e1 = d1.spy.dividendenListe.filter(function (x) { return x.exTag === '2018-06-15'; });
  pruefe('SPY-Ergänzung: fehlt bei Yahoo → genau ein Satz 1,2456', e1.length === 1 && e1[0].betrag === 1.2456 && e1[0].ergaenzt && d1.spy.ergaenzung.ergaenzt);
  var mit = Z.leseYahoo(yahoo('SPY', tage, function () { return { open: 270, close: 275, vol: 1 }; }, [{ tag: '2018-06-15', betrag: 1.3 }]), 'SPY');
  var d2 = Z.baueDaten({ SPY: mit });
  var e2 = d2.spy.dividendenListe.filter(function (x) { return x.exTag === '2018-06-15'; });
  pruefe('SPY-Ergänzung: Yahoo führt den Satz → Yahoo-Betrag, nicht doppelt', e2.length === 1 && e2[0].betrag === 1.3 && !e2[0].ergaenzt && d2.spy.ergaenzung.yahooFuehrtSatz);
  // SPY-Nachlauf von Hand: Kauf zur Eröffnung 270 am 13.06., Ex-Tag 15.06. (Vortag 275): 100000/270 Anteile,
  // Gutschrift = A × 275 × (1,2456/275), Wiederanlage zu 275
  var r = Z.spyNachlauf(d1, 0, 3, 'eroeffnung');
  var A = 100000 / 270, A2 = A + A * 275 * (1.2456 / 275) / 275;
  pruefe('SPY-Nachlauf von Hand', nahe(r.werte[3], A2 * 275, 1e-9) && r.ausschuettungen.length === 1);
  var r2 = Z.spyNachlauf(d1, 2, 3, 'eroeffnung');
  pruefe('SPY: Ex-Tag am Kauftag zählt nicht', r2.ausschuettungen.length === 0);
  var r3 = Z.spyNachlauf(d1, 1, 3, 'schluss');
  pruefe('SPY: Kauf zum Schluss (Pflicht i)', nahe(r3.werte[0], 100000, 1e-9) && r3.ausschuettungen.length === 1);
})();

// ------------------------------------------------------------ 8. Datei-Weg und Abbruch

(function () {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'zweitrechner-test-'));
  try {
    var sz = szenario();
    Object.keys(sz.obj).forEach(function (s) { fs.writeFileSync(path.join(dir, s + '.json'), JSON.stringify(sz.obj[s])); });
    var d = Z.ladeDaten(dir);
    var erg = Z.fuehreLaeufeAus(d, { X: { von: sz.tage[260], bis: sz.tage[300] } });
    pruefe('Datei-Weg: Regel-Endwert 101.795,08 wie von Hand', erg.laeufe['X-regel'].endwertBuch === 101795.08);
    pruefe('Datei-Weg: Placebo vorhanden, Vergleich vorhanden', !!erg.laeufe['X-placebo'] && !!erg.vergleich.X && erg.vergleich.X.regel.spy === 102000);
    pruefe('Datei-Weg: sha256 und Größe berechnet', /^[0-9a-f]{64}$/.test(d.dateien.SPY.sha256) && d.dateien.SPY.bytes > 0);
    // --lauf auf fremden Daten: Klinken verfehlt → Abbruch, keine Ausgabe
    var aus = path.join(dir, 'aus.json');
    var log = console.log, err = console.error;
    console.log = function () {}; console.error = function () {};
    var code;
    try { code = Z.main(['--lauf', '--daten', dir, '--aus', aus]); } finally { console.log = log; console.error = err; }
    pruefe('--lauf bricht bei verfehlten Klinken ab und schreibt nichts', code === 1 && !fs.existsSync(aus));
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
})();

console.log((fehler === 0 ? 'GRÜN' : 'ROT') + ': ' + (gezaehlt - fehler) + ' von ' + gezaehlt + ' Prüfungen bestanden.');
process.exitCode = fehler === 0 ? 0 : 1;
