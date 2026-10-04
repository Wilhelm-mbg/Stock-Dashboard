'use strict';
/* Pruefungen zum Simulator der Messung Sektor-Momentum (ZUSATZ.md). Aufruf aus der Repo-Wurzel:
 *   node studien/sektor-momentum-messung-2026-10/test.js
 * Nur Kunstdaten (Yahoo-foermige Antworten, von Hand gebaut); keine Kursdatei wird gelesen. Sollwerte von Hand gerechnet, Rechenweg im Kommentar.
 * Jede Pruefung haengt an einer Regelzeile von sektor.js: wird die Zeile ausgebaut, wird mindestens eine Pruefung rot (Ausbau-Proben vor Abgabe).
 * SEKTOR_MODUL=<pfad> laedt statt ./sektor.js eine andere Fassung (nur fuer die Ausbau-Proben). Exit-Code 1 bei einem Fehler. */
var path = require('path');
var S = require(process.env.SEKTOR_MODUL || './sektor.js');
var REPO = path.resolve(__dirname, '..', '..');
var Z = require(path.join(REPO, 'studien', 'kandidaten-blind-2026-10', 'sektor-momentum', 'ziel.js'));
var R = require(path.join(REPO, 'studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js'));

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll, tol) { var b = Math.abs(ist - soll) <= (tol == null ? 1e-6 : tol); if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function gleich(name, a, b) { var x = JSON.stringify(a), y = JSON.stringify(b); if (x !== y) console.log('   ist  ' + x + '\n   soll ' + y); ok(name, x === y); }
function wirft(name, f, muster) { var w = false; try { f(); } catch (e) { w = !muster || muster.test(String(e.message)); if (!w) console.log('   Meldung: ' + e.message); } ok(name, w); }

/* ================= Kunstdaten ================= */
var TAG = 86400000;
function wochentage(von, n) {
  var aus = [], p = von.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  while (aus.length < n) { var w = d.getUTCDay(); if (w !== 0 && w !== 6) aus.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + TAG); }
  return aus;
}
function sekVon(tag, std, min) { var p = tag.split('-'); return Date.UTC(+p[0], +p[1] - 1, +p[2], std == null ? 14 : std, min == null ? 30 : min) / 1000; }
function plusTage(tag, n) { return new Date(S.tagMs(tag) + n * TAG).toISOString().slice(0, 10); }
/** Yahoo-Antwort v8/chart: bars [{tag | sek, c, o, v, a, h, l}], divs [{sek, betrag}], splits [{sek, z, n}]. o/a fehlen -> = c; v fehlt -> 2 Mio (null bleibt null). */
function antwort(sym, bars, divs, splits) {
  var ts = [], o = [], c = [], v = [], a = [], h = [], l = [], ev = {};
  bars.forEach(function (b) {
    ts.push(b.sek != null ? b.sek : sekVon(b.tag)); c.push(b.c); o.push(b.o === undefined ? b.c : b.o); v.push(b.v === undefined ? 2e6 : b.v);
    a.push(b.a === undefined ? b.c : b.a); h.push(b.h === undefined ? b.c : b.h); l.push(b.l === undefined ? b.c : b.l);
  });
  if (divs && divs.length) { ev.dividends = {}; divs.forEach(function (d) { ev.dividends[d.sek] = { amount: d.betrag, date: d.sek }; }); }
  if (splits && splits.length) { ev.splits = {}; splits.forEach(function (x) { ev.splits[x.sek] = { date: x.sek, numerator: x.z, denominator: x.n, splitRatio: x.z + ':' + x.n }; }); }
  return { chart: { result: [{ meta: { symbol: sym, currency: 'USD', exchangeName: 'PCX', exchangeTimezoneName: 'America/New_York' }, timestamp: ts, events: ev,
    indicators: { quote: [{ open: o, close: c, volume: v, high: h, low: l }], adjclose: [{ adjclose: a }] } }], error: null } };
}
/** Kunstwelt: Wochentage ab opt.ab (Vorgabe 02.01.2020 = Mittwoch 01.01.2020), Tag t = Index. opt.fonds { SYM: f(t) -> {c, o, v, a} | null },
 *  opt.spy f(t), opt.divs { SYM: [{t | tag | sek, betrag}] }, opt.extra { SYM: [Zeilen an Tagen ohne SPY] }, opt.ergaenzungen (Vorgabe: keine). */
function welt(opt) {
  var tage = wochentage(opt.ab || '2020-01-01', opt.n), gel = {};
  function mk(sym, f) {
    var bars = [];
    tage.forEach(function (tag, t) { var x = f(t); if (x) bars.push({ tag: tag, c: x.c, o: x.o, v: x.v, a: x.a }); });
    ((opt.extra && opt.extra[sym]) || []).forEach(function (b) { bars.push(b); });
    bars.sort(function (x, y) { return x.tag < y.tag ? -1 : 1; });
    var divs = ((opt.divs && opt.divs[sym]) || []).map(function (d) { return { sek: d.sek != null ? d.sek : sekVon(d.tag || tage[d.t]), betrag: d.betrag }; });
    gel[sym] = S.liesAntwort(antwort(sym, bars, divs), sym);
  }
  Object.keys(opt.fonds).forEach(function (sym) { mk(sym, opt.fonds[sym]); });
  mk('SPY', opt.spy || function () { return { c: 400 }; });
  var D = S.baueDaten(gel, { ergaenzungen: opt.ergaenzungen === undefined ? {} : opt.ergaenzungen });
  D.T = tage;
  return D;
}
/* Sechs Fonds; vor Tag 200 Schluss = Basis (XLB 50 < XLE 55 < ... < XLP 75), ab Tag 200 der Pfad (Vorgabe 100). Staerke am Stichtag s (252..451) =
 * Pfad(s) / Basis - 1: Rangfolge XLB > XLE > XLF > XLI > XLK > XLP, solange alle denselben Pfad haben. Stueck 4 Mio: Umsatz >= 50 x 4 Mio = 200 Mio $. */
var BASIS = { XLB: 50, XLE: 55, XLF: 60, XLI: 65, XLK: 70, XLP: 75 };
function fondsF(basis, pfad, ueber) {
  return function (t) {
    if (ueber && Object.prototype.hasOwnProperty.call(ueber, t) && ueber[t] === null) return null;
    var x = t < 200 ? { c: basis } : { c: pfad(t) };
    if (ueber && ueber[t]) Object.keys(ueber[t]).forEach(function (k) { x[k] = ueber[t][k]; });
    if (x.v === undefined) x.v = 4e6;
    return x;
  };
}
function standard(ueber, pfad, basis) {
  var m = {}, b = basis || BASIS;
  Object.keys(b).forEach(function (s) { m[s] = fondsF(b[s], pfad || function () { return 100; }, ueber && ueber[s]); });
  return m;
}
function luecke(von, bis) { var u = {}; for (var t = von; t <= bis; t++) u[t] = null; return u; }
function lauf(D, a, e, extra) { var o = { startTag: a, endTag: e }; Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; }); return S.simuliere(D, o); }
function tw(L, t) { return L.tage.filter(function (x) { return x.tag === t; })[0]; }
function pos(L, s) { return L.buch.positionen.filter(function (p) { return p.sym === s; })[0]; }

/* ================= 1. Leser: Tagesbildung, entfallende und doppelte Zeilen (ZUSATZ §1.5) ================= */
(function () {
  /* 03:00 UTC am 02.03.2021 = 22:00 EST am 01.03.2021; 03:30 UTC am 01.07.2021 = 23:30 EDT am 30.06.2021; 14:30 UTC = 09:30/10:30 New York am selben Tag. */
  var bars = [{ sek: Date.UTC(2021, 2, 2, 3, 0) / 1000, c: 10 }, { sek: Date.UTC(2021, 5, 15, 14, 30) / 1000, c: 11 }, { sek: Date.UTC(2021, 6, 1, 3, 30) / 1000, c: 12 }];
  var L = S.liesAntwort(antwort('XLB', bars, [{ sek: Date.UTC(2021, 2, 5, 4, 0) / 1000, betrag: 0.5 }]), 'XLB');
  gleich('Tagesbildung: Kalendertag in New York (EST und EDT), nicht UTC', L.zeilen.map(function (z) { return z.tag; }), ['2021-03-01', '2021-06-15', '2021-06-30']);
  ok('Zeitstempel der Zeile = Mitternacht UTC des New-Yorker Tages', L.zeilen[0].ms === Date.UTC(2021, 2, 1) && L.zeilen[2].ms === Date.UTC(2021, 5, 30));
  gleich('Ex-Tag einer Ausschuettung = New-Yorker Datum (04:00 UTC am 05.03. -> 04.03.)', [L.ausschuettungen[0].exTag, L.ausschuettungen[0].betrag], ['2021-03-04', 0.5]);
  var b2 = wochentage('2021-03-01', 8).map(function (t, i) { return { tag: t, c: 100 + i }; });
  b2[1].c = null; b2[1].a = 101; b2[2].c = 0; b2[2].a = 102; b2[3].a = null; b2[4].a = -1;     /* Schluss fehlt/0 bei gueltigem adjclose; adjclose fehlt/negativ */
  var L2 = S.liesAntwort(antwort('XLE', b2), 'XLE');
  gleich('Zeile ohne gueltigen Schluss oder adjclose (null, 0, -1) entfaellt und wird gezaehlt', [L2.zaehler.entfallen, L2.zeilen.length, L2.zeilen.map(function (z) { return z.close; })], [4, 4, [100, 105, 106, 107]]);
  /* doppelte Tage: 2. Zeile ist gleich der 1. (14:30 und 18:00 UTC desselben Tages) -> eine; 4. weicht von der 3. ab -> die letzte gilt */
  var t3 = wochentage('2021-03-01', 3);
  var b3 = [{ tag: t3[0], c: 10, v: 5 }, { sek: sekVon(t3[0], 18, 0), c: 10, v: 5 }, { tag: t3[1], c: 20, v: 5 }, { sek: sekVon(t3[1], 19, 0), c: 21, v: 6 }, { tag: t3[2], c: 30 }];
  var L3 = S.liesAntwort(antwort('XLF', b3), 'XLF');
  gleich('doppelter Tag, gleich: eine Zeile, gezaehlt', [L3.zaehler.doppeltGleich, L3.zeilen.length, L3.zeilen[0].close], [1, 3, 10]);
  gleich('doppelter Tag, verschieden: die letzte in der Antwort gilt, gezaehlt und gelistet', [L3.zaehler.doppeltVerschieden, L3.zeilen[1].close, L3.zeilen[1].volume, L3.zaehler.doppelt[1]],
    [1, 21, 6, { tag: t3[1], gleich: false }]);
  wirft('Zeitstempel nicht aufsteigend: Abbruch', function () { S.liesAntwort(antwort('XLF', [{ tag: t3[1], c: 1 }, { tag: t3[0], c: 1 }]), 'XLF'); }, /aufsteigend/);
  wirft('meta.symbol passt nicht: Abbruch', function () { S.liesAntwort(antwort('XLF', b3), 'XLK'); }, /meta.symbol/);
  var kaputt = antwort('XLF', b3); kaputt.chart.result[0].indicators.adjclose[0].adjclose.pop();
  wirft('adjclose kuerzer als timestamp: Abbruch', function () { S.liesAntwort(kaputt, 'XLF'); }, /adjclose/);
  var L4 = S.liesAntwort(antwort('XLF', [{ tag: t3[0], c: 10, v: null, o: null }]), 'XLF');
  ok('fehlendes volume und open bleiben null (keine Null-Ersetzung)', L4.zeilen[0].volume === null && L4.zeilen[0].open === null);
})();

/* ================= 2. Kalender und Klinken (ZUSATZ §1.6) ================= */
(function () {
  /* SPY hat Tag 3 nicht (Feiertag); XLB hat eine Zeile am Samstag nach Tag 2 (Freitag 03.01.2020 -> Samstag 04.01.2020). */
  var D = welt({ n: 10, fonds: { XLB: function () { return { c: 100 }; } }, spy: function (t) { return t === 3 ? null : { c: 400 }; },
    extra: { XLB: [{ tag: '2020-01-04', c: 101 }] } });
  ok('Kalender = Tage der SPY-Reihe (9 von 10 Wochentagen)', D.n === 9 && D.kal.tage.indexOf(D.T[3]) < 0);
  gleich('Zeile eines Fonds an einem Tag ohne SPY-Zeile: gezaehlt, bleibt Zeile der Reihe, ist kein Handelstag', [D.reihen.XLB.ohneKalender, D.reihen.XLB.n, D.reihen.XLB.zeileAm[3]],
    [['2020-01-04', D.T[3]], 11, D.reihen.XLB.tag.indexOf(D.T[4])]);
  var W = welt({ n: 40, fonds: { XLB: function () { return { c: 100 }; } } });
  var def = { A: { von: W.T[10], bis: W.T[24], stichtag: W.T[9], handelstage: 15 }, B: { von: W.T[25], bis: W.T[39], stichtag: W.T[24], handelstage: 15 } };
  var F = S.fensterIndizes(W, def);
  gleich('Fenster als Kalender-Indizes', [F.A.von, F.A.bis, F.B.von, F.B.bis, F.A.handelstage], [10, 24, 25, 39, 15]);
  var d2 = JSON.parse(JSON.stringify(def)); d2.A.handelstage = 16;
  wirft('Klinke Zahl der Handelstage (16 statt 15)', function () { S.fensterIndizes(W, d2); }, /Handelstage/);
  d2 = JSON.parse(JSON.stringify(def)); d2.A.stichtag = W.T[8];
  wirft('Klinke Stichtag = Handelstag vor dem Fensterbeginn', function () { S.fensterIndizes(W, d2); }, /Stichtag/);
  d2 = JSON.parse(JSON.stringify(def)); d2.B.von = W.T[26]; d2.B.stichtag = W.T[25]; d2.B.handelstage = 14;
  wirft('Klinke Fenster A endet am Handelstag vor Fenster B', function () { S.fensterIndizes(W, d2); }, /vor Fenster B/);
  d2 = JSON.parse(JSON.stringify(def)); d2.B.bis = W.T[38]; d2.B.handelstage = 14;
  wirft('Klinke Fenster B endet am letzten Kalendertag', function () { S.fensterIndizes(W, d2); }, /letzten Kalendertag/);
  d2 = JSON.parse(JSON.stringify(def)); d2.A.von = '2020-01-04';
  wirft('Klinke Fensterbeginn ist ein Handelstag', function () { S.fensterIndizes(W, d2); }, /Handelstag/);
  ok('Konstanten der Fenster: A 1.183 Tage / 57 Perioden (56 x 21 + 7), B 1.254 / 60 (59 x 21 + 15), SPY 18 und 20',
    S.FENSTER.A.handelstage === 1183 && 56 * 21 + 7 === 1183 && S.FENSTER.A.perioden === 57 && S.FENSTER.A.letztePeriode === 7 && S.FENSTER.B.handelstage === 1254 &&
    59 * 21 + 15 === 1254 && S.FENSTER.B.perioden === 60 && S.FENSTER.B.letztePeriode === 15 && S.FENSTER.A.spyAusschuettungen === 18 && S.FENSTER.B.spyAusschuettungen === 20 &&
    S.FENSTER.A.stichtag === '2017-01-03' && S.FENSTER.B.stichtag === '2021-09-15');
})();

/* ================= 3. SPY-Ergaenzung 15.06.2018 (ZUSATZ §1.9) ================= */
(function () {
  ok('Ergaenzung als benannte Konstante: 15.06.2018, 1,2456 $', S.SPY_ERGAENZUNG.ex_date === '2018-06-15' && S.SPY_ERGAENZUNG.rate === 1.2456);
  function spyWelt(divs) {
    var tage = wochentage('2018-06-01', 20), bars = tage.map(function (t) { return { tag: t, c: 270 }; });
    return S.baueDaten({ SPY: S.liesAntwort(antwort('SPY', bars, divs), 'SPY') });          /* Vorgabe: Ergaenzung fuer SPY */
  }
  var D1 = spyWelt([]), i15 = D1.idx['2018-06-15'];
  gleich('fehlt der Satz bei Yahoo: ergaenzt (1,2456 $ am 15.06.2018), einmal', [D1.reihen.SPY.nachTag[i15], D1.protokoll], [[1.2456], { ergaenzt: 1, schonDa: 0 }]);
  var D2 = spyWelt([{ sek: sekVon('2018-06-15', 13, 30), betrag: 1.3 }]);
  gleich('fuehrt Yahoo den Satz: Yahoos Betrag gilt, nicht doppelt', [D2.reihen.SPY.nachTag[i15], D2.protokoll], [[1.3], { ergaenzt: 0, schonDa: 1 }]);
  var D3 = spyWelt([{ sek: sekVon('2018-06-14'), betrag: 1.3 }]);
  gleich('Satz an einem anderen Tag ersetzt die Ergaenzung nicht', [D3.reihen.SPY.nachTag[D3.idx['2018-06-14']], D3.reihen.SPY.nachTag[i15]], [[1.3], [1.2456]]);
  wirft('hoechstens ein Satz je Ex-Tag aus der Ergaenzung (Klinke)', function () { S.mitErgaenzung([], [S.SPY_ERGAENZUNG, S.SPY_ERGAENZUNG], { ergaenzt: 0, schonDa: 0 }); }, /zwei Ergaenzungen/);
  var tage = wochentage('2018-06-01', 20), gel = {};
  gel.SPY = S.liesAntwort(antwort('SPY', tage.map(function (t) { return { tag: t, c: 270 }; })), 'SPY');
  gel.XLB = S.liesAntwort(antwort('XLB', tage.map(function (t) { return { tag: t, c: 50 }; })), 'XLB');
  var D4 = S.baueDaten(gel);
  ok('die Ergaenzung gilt nur fuer SPY, nicht fuer die Fonds', !D4.reihen.XLB.nachTag[i15] && D4.reihen.SPY.nachTag[i15][0] === 1.2456);
})();

/* ================= 4. Ausschuettungen lesen: Buchungstag, Satz, Basis ================= */
(function () {
  /* Tag 262 = Freitag 25.12.2020? Nein: Index 262 = 01.01.2021 (Fr), Samstag danach = 02.01.2021 -> Buchung Montag (Index 263). Tag 265 fehlt SPY und XLE (Feiertag). */
  var D = welt({ n: 300, fonds: { XLE: function (t) { return t === 265 ? null : { c: t === 262 ? 80 : 100 }; } }, spy: function (t) { return t === 265 ? null : { c: 400 }; },
    divs: { XLE: [{ tag: plusTage(wochentage('2020-01-01', 300)[262], 1), betrag: 2 }, { t: 265, betrag: 3 }, { t: 270, betrag: 0 }, { tag: '2030-01-02', betrag: 1 }] } });
  var r = D.reihen.XLE, i263 = D.idx[D.T[263]], i266 = D.idx[D.T[266]];
  ok('Ex-Tag Samstag: gebucht am ersten Handelstag danach (Montag)', r.nachTag[i263] && r.nachTag[i263][0] === 2 && r.aussch[0].buchTag === D.T[263]);
  ok('Ex-Tag ohne SPY-Zeile (Feiertag): gebucht am Handelstag danach', r.nachTag[i266] && r.nachTag[i266][0] === 3);
  gleich('Betrag <= 0 und Ex-Tag nach dem Kalender zaehlen nicht; zwei Tage ohne Handelstag gezaehlt', [r.az.gezaehlt, r.az.nichtPositiv, r.az.ausserhalbKalender, r.az.ohneHandelstag], [2, 1, 1, 2]);
  var a = S.ausschuettungenAm(D, 'XLE', i263);
  /* Vortag = letzte Zeile der Reihe vor Montag = Freitag (Index 262), Schluss 80: Satz 2 / 80 = 2,5 %, Basis 80 */
  ok('Satz = Betrag / Schluss des Vortags (letzte Zeile vor dem Buchungstag), Basis = dieser Schluss', a.length === 1 && Math.abs(a[0].satz - 0.025) < 1e-15 && a[0].basis === 80 && a[0].rate === 2);
  ok('kein Satz an einem Tag ohne Ausschuettung', S.ausschuettungenAm(D, 'XLE', i263 + 1).length === 0);
})();

/* ================= 5. rohMap am Stichtag (ZUSATZ §1.7) ================= */
(function () {
  /* XLB: adjclose = 0,9 x close (Kurs x Stueck muss trotzdem close x volume sein); XLK ohne volume. Stichtag 280: Reihen haben 281 Zeilen bis dahin. */
  var f = standard({ XLB: {} });
  f.XLB = function (t) { var c = t < 200 ? 50 : 100 + (t % 7); return { c: c, a: 0.9 * c, v: 3e6 + t }; };
  f.XLK = function (t) { var x = fondsF(70, function () { return 100; })(t); if (t === 270) x.v = null; return x; };
  f.XLC = function (t) { return t >= 290 ? { c: 100, v: 4e6 } : null; };              /* XLC erst nach dem Stichtag 280 */
  var D = welt({ n: 300, fonds: f }), s = 280, roh = S.rohMapAm(D, s);
  ok('rohMap: je Fonds die letzten 253 Zeilen bis einschliesslich Stichtag', roh.XLB.length === 253 && roh.XLB[252][0] === D.ms[s] && roh.XLB[0][0] === D.ms[s - 252]);
  var z = roh.XLB[100], t = s - 252 + 100, c = t < 200 ? 50 : 100 + (t % 7);      /* t = 128: Schluss 50, adjclose 45 */
  var z2 = roh.XLB[250], t2 = s - 252 + 250, c2 = 100 + (t2 % 7);                  /* t = 278: Schluss 100 + 5 */
  nah('rohMap-Zeile nach Tag 200: adjclose 0,9 x 105', z2[1], 0.9 * c2, 1e-12);
  nah('rohMap-Zeile nach Tag 200: Kurs x Stueck = 105 x (3 Mio + 278)', z2[1] * z2[2], c2 * (3e6 + t2), 1e-4);
  nah('rohMap-Zeile: [ms, adjclose, close x volume / adjclose]', z[1], 0.9 * c, 1e-12);
  nah('Kurs x Stueck = close x volume (Dollar-Umsatz, nicht bereinigt)', z[1] * z[2], c * (3e6 + t), 1e-4);
  ok('fehlt volume, ist die Stueckzahl null', roh.XLK[S.endeBis(D.reihen.XLK, D.ms[270]) - 1 - (S.endeBis(D.reihen.XLK, D.ms[s]) - 253)][2] === null);
  ok('Fonds ohne Zeile bis zum Stichtag fehlt in der rohMap (wie R.rohMapAm): XLC hat erst ab Tag 290 Zeilen', D.reihen.XLC && !('XLC' in roh) && !('SPY' in roh) &&
    Object.keys(roh).length === 6 && /XLC: nicht im Panel/.test(S.zielAm(D, s, 'kandidat', null).verworfen.join()));
  /* 253 Zeilen gleichwertig zur ganzen Reihe bis zum Stichtag */
  var voll = {};
  Object.keys(roh).forEach(function (k) { var r = D.reihen[k]; voll[k] = r.roh.slice(0, S.endeBis(r, D.ms[s])); });
  [{}, { umsatzMin: 0 }].forEach(function (o) {
    var oo = { nowMs: D.ms[s] }; if (o.umsatzMin != null) oo.umsatzMin = o.umsatzMin;
    gleich('253 Zeilen = ganze Reihe bis zum Stichtag: zielfunktion gleich' + (o.umsatzMin === 0 ? ' (ohne Schwelle)' : ''), Z.zielfunktion(roh, oo), Z.zielfunktion(voll, oo));
    gleich('253 Zeilen = ganze Reihe bis zum Stichtag: placeboZiel gleich' + (o.umsatzMin === 0 ? ' (ohne Schwelle)' : ''), Z.placeboZiel(roh, oo), Z.placeboZiel(voll, oo));
  });
  var zl = S.zielAm(D, s, 'kandidat', null);
  gleich('zielAm = zielfunktion auf der rohMap mit nowMs = Zeitstempel des Stichtags', zl.ziel, Z.zielfunktion(roh, { nowMs: D.ms[s] }).ziel);
  ok('Zielliste: nie SPY, nur Namen der Liste', zl.ziel.every(function (x) { return S.FONDS.indexOf(x) >= 0; }) && S.FONDS.length === 11 && S.FONDS.indexOf('SPY') < 0);
  /* Umsatzschwelle zaehlt Dollar (close x volume), nicht bereinigte Dollar: XLB mit adj = 0,1 x close und Umsatz knapp ueber 100 Mio $ bleibt zulaessig */
  var f2 = standard(); f2.XLB = function (t) { return { c: t < 200 ? 50 : 100, a: (t < 200 ? 50 : 100) * 0.1, v: t < 200 ? 2.1e6 : 1.01e6 }; };
  var D2 = welt({ n: 260, fonds: f2 });
  ok('Umsatzschwelle in Dollar: close x volume = 101 Mio $ zulaessig, obwohl adjclose x volume nur 10 Mio $ waere', S.zielAm(D2, 255, 'kandidat', null).zulaessig === 6);
})();

/* ================= 6. Handel zur Eroeffnung, Kosten, Stichtag = Vortag (ZUSATZ §1.7, §2.2) ================= */
(function () {
  /* Tag 253: Eroeffnung 80, Schluss 90 (Stichtag 252: Schluss 100). Budget 100000 / 3 = 33333,3333.
   * XLB, XLE: round4(33333,3333 / 80) = 416,6667 Stueck, Kosten je 416,6667 x 80 x 1,002 = 33400,002672 -> Bargeld 33199,994656.
   * XLF: 33400,002672 > Bargeld -> floor(33199,994656 / 80,16 x 10000) / 10000 = 414,1715 (80,16 x 414,1715 = 33199,98744) -> Bargeld 0,007216.
   * Volumen 2 x 33333,336 + 33133,72 = 99800,392; Kosten 0,002 x 99800,392 = 199,600784. Schluss 253: 1247,5049 x 90 + 0,007216 = 112275,448216 -> 112275,45.
   * SPY: Kauf zur Eroeffnung 400 ohne Kosten -> 250 Stueck, Schluss 450 -> 112500. */
  var D = welt({ n: 300, fonds: standard({ XLB: { 253: { o: 80 } }, XLE: { 253: { o: 80 } }, XLF: { 253: { o: 80 } } }, function (t) { return t >= 253 ? 90 : 100; }),
    spy: function (t) { return t >= 253 ? { c: 450, o: t === 253 ? 400 : 450 } : { c: 400 }; } });
  var L = lauf(D, 253, 260);
  gleich('Ziel am Stichtag 252: die drei staerksten (XLB, XLE, XLF)', L.umschichtungen[0].ziel, ['XLB', 'XLE', 'XLF']);
  ok('Stichtag = Handelstag vor dem Ausfuehrungstag', L.umschichtungen[0].stichtag === D.T[252] && L.umschichtungen[0].ausfuehrungstag === D.T[253]);
  gleich('Handel zur Eroeffnung (80), nicht zum Schluss des Stichtags (100) oder des Tages (90): Stueck', [pos(L, 'XLB').stueck, pos(L, 'XLE').stueck, pos(L, 'XLF').stueck], [416.6667, 416.6667, 414.1715]);
  nah('Einstand = Eroeffnung x 1,002', pos(L, 'XLB').einstand, 80.16, 1e-12);
  nah('Kosten = Wert zu Eroeffnungskursen vor minus nach dem Handel = 0,002 x Volumen', L.umschichtungen[0].kosten, 199.600784, 1e-6);
  nah('gehandeltes Volumen', L.umschichtungen[0].volumen, 99800.392, 1e-6);
  nah('Bargeld nach dem Kauf (letzter Kauf verkleinert)', L.umschichtungen[0].bargeldDanach, 0.007216, 1e-6);
  nah('Bewertung zum Schluss 253 (bewerte, Cent)', tw(L, 253).buch, 112275.45, 1e-9);
  nah('SPY: Kauf zur Eroeffnung ohne Kosten, Schluss 450', tw(L, 253).spy, 112500, 1e-9);
  /* kein Blick voraus: XLP am Ausfuehrungstag 253 (Eroeffnung und Schluss 10000) aendert das Ziel nicht; Gegenprobe: am Stichtag 252 -> XLP fuehrt */
  var Dv = welt({ n: 300, fonds: standard({ XLP: { 253: { c: 10000, o: 10000 }, 254: { c: 10000 } } }) });
  gleich('kein Blick voraus: Kurse ab dem Ausfuehrungstag aendern das Ziel nicht', lauf(Dv, 253, 255).umschichtungen[0].ziel, ['XLB', 'XLE', 'XLF']);
  var Dg = welt({ n: 300, fonds: standard({ XLP: { 252: { c: 10000 } } }) });
  gleich('Gegenprobe: Schluss am Stichtag zaehlt (XLP fuehrt)', lauf(Dg, 253, 255).umschichtungen[0].ziel, ['XLP', 'XLB', 'XLE']);
  /* Ziel ohne Eroeffnungskurs: nicht gehandelt, Anteil bleibt Bargeld */
  var Do = welt({ n: 300, fonds: standard({ XLF: { 253: { o: null } } }) });
  var Lo = lauf(Do, 253, 254);
  ok('Ziel ohne Eroeffnungskurs: nicht gekauft, Anteil bleibt Bargeld (gezaehlt)', !pos(Lo, 'XLF') && Lo.zaehler.ohneKurs === 1 && Math.abs(Lo.buch.cash - (100000 - 2 * 33399.99666)) < 1e-6);
})();

/* ================= 7. Takt 21, Perioden, Kalenderjahre, p. a., Rueckschlag (ZUSATZ §2.3-2.5) ================= */
/* W1: alle Pfade flach 100, SPY flach 400; Lauf 253..304. Ausfuehrungstage 253, 274, 295.
 * 253: XLB, XLE 333,3333 Stueck (Kosten je 33399,99666), XLF floor(33200,00668 / 100,2 x 1e4) / 1e4 = 331,3373 -> Bargeld 0,00922; Kosten 0,002 x 99800,39 = 199,60078;
 *      Wert 99800,39922 -> 99800,40.
 * 274: Depotwert 99800,39922, Budget 33266,79974. XLB, XLE: round4(0,6653026) = 0,6653 verkauft -> je 66,53 x 0,998 = 66,39694 -> Bargeld 132,8031.
 *      XLF: round4(1,3306974) = 1,3307 kostet 133,33614 > Bargeld -> floor(132,8031 / 100,2 x 1e4) / 1e4 = 1,3253 (132,79506) -> Bargeld 0,00804.
 *      Volumen 66,53 + 66,53 + 132,53 = 265,59, Kosten 0,53118. Wert 99799,86804 -> 99799,87. Stueck 332,668 / 332,668 / 332,6626.
 * 295: Budget 33266,62268. XLB, XLE: round4(0,0017732) = 0,0018 verkauft (je 0,17964) -> Bargeld 0,36732; XLF round4(0,0036268) = 0,0036 kostet 0,36072 -> Bargeld 0,0066.
 *      Kosten 0,002 x 0,72 = 0,00144. Wert 99799,8666 -> 99799,87. Kosten gesamt 199,60078 + 0,53118 + 0,00144 = 200,1334. */
var W1 = welt({ n: 305, fonds: standard() }), L1 = lauf(W1, 253, 304);
(function () {
  gleich('Takt: Ausfuehrungstage 253, 274, 295 (21 Handelstage nach dem letzten)', L1.umschichtungen.map(function (u) { return u.ausfuehrungstag; }), [W1.T[253], W1.T[274], W1.T[295]]);
  gleich('Stueckzahlen nach 253', [L1.umschichtungen[0].bestand.XLB, L1.umschichtungen[0].bestand.XLE, L1.umschichtungen[0].bestand.XLF], [333.3333, 333.3333, 331.3373]);
  gleich('Gleichgewicht 274: Teilverkauf XLB, XLE; Aufstocken XLF (verkleinert)', [L1.umschichtungen[1].teilverkauft, L1.umschichtungen[1].aufgestockt,
    L1.umschichtungen[1].bestand.XLB, L1.umschichtungen[1].bestand.XLF], [['XLB', 'XLE'], ['XLF'], 332.668, 332.6626]);
  nah('Kosten 274', L1.umschichtungen[1].kosten, 0.53118, 1e-6);
  nah('Kosten 295', L1.umschichtungen[2].kosten, 0.00144, 1e-6);
  nah('Kosten gesamt', L1.zaehler.kosten, 200.1334, 1e-6);
  nah('Klinke Kosten = 0,002 x Volumen', L1.zaehler.kosten, 0.002 * L1.zaehler.volumen, 1e-9);
  nah('Endwert Buch', L1.endBuch, 99799.87, 1e-9);
  nah('Endwert SPY', L1.endSpy, 100000, 1e-9);
  /* Perioden: [253..273] 21 Tage 100000 -> 99800,40; [274..294] 99800,40 -> 99799,87; [295..304] angebrochen, 10 Tage 99799,87 -> 99799,87 */
  var P = L1.perioden;
  gleich('drei Perioden, Tage 21 / 21 / 10, die letzte angebrochen', P.map(function (p) { return [p.tage, !!p.angebrochen]; }), [[21, false], [21, false], [10, true]]);
  gleich('Periode = Schluss vor dem Ausfuehrungstag gegen Schluss vor dem naechsten', [P[0].buchStart, P[0].buchEnde, P[1].buchStart, P[1].buchEnde, P[2].buchEnde],
    [100000, 99800.4, 99800.4, 99799.87, 99799.87]);
  nah('Periodenertrag Buch 1 = 99800,40 / 100000 - 1', P[0].buch, -0.1996, 1e-9);
  nah('Abstand Periode 1 (SPY 0 %)', P[0].abstand, -0.1996, 1e-9);
  /* p. a.: geometrisch ueber Kalendertage / 365,25 vom ersten Ausfuehrungstag bis zum Endtag; Original R.kennzahlen */
  var kz = S.kennzahlen(W1, L1), jahre = (W1.ms[304] - W1.ms[253]) / (365.25 * TAG);
  nah('p. a. von Hand: (99799,87 / 100000)^(1 / Jahre) - 1', kz.buchPa, (Math.pow(99799.87 / 100000, 1 / jahre) - 1) * 100, 1e-12);
  gleich('Kennzahlen = Original R.kennzahlen ueber die Anpassung', kz, R.kennzahlen({ ms: W1.ms }, L1));
  ok('Abstand = Differenz der p.-a.-Werte, vorn strikt', kz.abstandPa === kz.buchPa - kz.spyPa && kz.schlaegt === false);
  /* Kalenderjahre: Index 261 = 31.12.2020; 2020: 99800,40 / 100000 - 1 = -0,1996 %; 2021: 99799,87 / 99800,40 - 1 */
  var KJ = S.kalenderjahre(W1, L1);
  ok('Index 261 ist der 31.12.2020', W1.T[261] === '2020-12-31');
  gleich('Kalenderjahre 2020 und 2021', KJ.map(function (j) { return j.jahr; }), ['2020', '2021']);
  nah('Kalenderjahr 2020 Buch', KJ[0].buch, -0.1996, 1e-9);
  nah('Kalenderjahr 2021 Buch', KJ[1].buch, (99799.87 / 99800.4 - 1) * 100, 1e-9);
  gleich('Kalenderjahre = Original R.kalenderjahre', KJ, R.kalenderjahre({ kal: W1.kal }, L1));
  /* Rueckschlag: Original R.maxRueckschlag; [100, 120, 90, 130, 117] -> 90 / 120 - 1 = -25 % */
  nah('groesster Rueckschlag von Hand', S.maxRueckschlag([100, 120, 90, 130, 117]), -25, 1e-12);
  /* Rueckschlag auf den Tagesschluessen AB dem ersten Ausfuehrungstag (Original): Hoch ist der Schluss 253 (99800,40), nicht das Startkapital */
  nah('Rueckschlag Buch W1: 99799,87 / 99800,40 - 1 (erster Tagesschluss ist das erste Hoch)', S.maxRueckschlag(L1.tage.map(function (x) { return x.buch; })), (99799.87 / 99800.40 - 1) * 100, 1e-9);
  /* gehaltene Fonds und groesstes Gewicht */
  gleich('gehaltene Fonds: je 3, Haeufigkeit je Fonds', S.gehalteneFonds(L1.umschichtungen), { kleinste: 3, groesste: 3, haeufigkeit: { XLB: 3, XLE: 3, XLF: 3 }, verschiedene: 3 });
  nah('groesstes Gewicht = groesste Position / Buchwert: 33333,33 / 99800,40', L1.maxGewicht.anteil, 33333.33 / 99800.4, 1e-12);
})();
(function () {
  /* zuWenig: XLP ohne Zeilen an den Tagen 262..273 -> am Stichtag 273 veraltet (letzte Zeile 261, 12 Handelstage = mehr als 7 Kalendertage) -> 5 zulaessig < 6.
   * Ausfuehrungstag 274: zuWenig, neuer Versuch 275 (Stichtag 274: XLP wieder da) -> Umschichtung 275, naechste 296, 317. */
  var D = welt({ n: 330, fonds: standard({ XLP: luecke(262, 273) }) }), L = lauf(D, 253, 320);
  gleich('zuWenig: Umschichtungen 253, 275, 296, 317; ein zuWenig-Tag (274)', [L.umschichtungen.map(function (u) { return u.ausfuehrungstag; }), L.zaehler.zuWenigTage, L.zuWenigListe],
    [[D.T[253], D.T[275], D.T[296], D.T[317]], 1, [D.T[274]]]);
  ok('Grund des zuWenig: XLP veraltet', S.zielAm(D, 273, 'kandidat', null).zuWenig && /XLP: Kurse veraltet/.test(S.zielAm(D, 273, 'kandidat', null).verworfen.join()));
  gleich('Perioden nach zuWenig: 22 / 21 / 21 / 4 Tage', L.perioden.map(function (p) { return p.tage; }), [22, 21, 21, 4]);
  /* 5-%-Regel: Anteil = zuWenig-Tage / (Umschichtungen + zuWenig-Tage) > 5 % */
  ok('5-%-Regel: 1 von 20 = 5 % ist ausfuehrbar (Grenze)', S.nichtAusfuehrbar({ umschichtungen: 19, zuWenigTage: 1 }) === false);
  ok('5-%-Regel: 1 von 19 = 5,26 % ist nicht ausfuehrbar', S.nichtAusfuehrbar({ umschichtungen: 18, zuWenigTage: 1 }) === true);
  ok('5-%-Regel: ohne Ausfuehrungstage kein Bruch', S.nichtAusfuehrbar({ umschichtungen: 0, zuWenigTage: 0 }) === false);
  ok('Anteil des Laufs: 1 von 5', Math.abs(S.zuWenigAnteil(L.zaehler) - 0.2) < 1e-15 && S.nichtAusfuehrbar(L.zaehler));
})();

/* ================= 8. Ausschuettungen im Buch und bei SPY (ZUSATZ §1.7) ================= */
(function () {
  /* W1-Pfade, Lauf 253..280. XLB Ex 253 (Kauftag, 5 $) zaehlt nicht. XLE Ex 260 (1 $): Satz 1/100, Basis 100 -> 333,3333 x 100 x 0,01 = 333,3333 Bargeld.
   * XLF Ex 274 (2 $, Umschichtungstag, XLF wird aufgestockt): Anspruch nach Stueck VOR dem Handel 331,3373 -> 662,6746, gutgeschrieben NACH dem Handel.
   * Umschichtung 274: Depotwert 333,34252 + 99800,39 = 100133,73252, Budget 33377,91084. Kein Verkauf (round4(-0,4458) nicht > 0).
   *   XLB, XLE je +0,4458 (44,66916) -> Bargeld 244,0042; XLF round4(2,4418084) = 2,4418 kostet 244,66836 > Bargeld -> floor(244,0042 / 100,2 x 1e4) / 1e4 = 2,4351
   *   (243,99702) -> Bargeld 0,00718; danach + 662,6746 = 662,68178. Kosten 0,002 x 332,67 = 0,66534. Schluss 274: 1001,3306 x 100 + 662,68178 = 100795,74178.
   * SPY (400): Ex 253 (Kauftag) zaehlt nicht; Ex 260 4 $: 250 x 400 x 0,01 = 1000 -> + 2,5 Stueck zum Schluss 400 -> 252,5 x 400 = 101000. */
  var D = welt({ n: 300, fonds: standard(), divs: { XLB: [{ t: 253, betrag: 5 }], XLE: [{ t: 260, betrag: 1 }], XLF: [{ t: 274, betrag: 2 }], SPY: [{ t: 253, betrag: 7 }, { t: 260, betrag: 4 }] } });
  var L = lauf(D, 253, 280);
  nah('Kauf am Ex-Tag zaehlt nicht (Bargeld 253 unveraendert 0,00922)', tw(L, 253).bar, 0.00922, 1e-9);
  nah('Ausschuettung am Ex-Tag als Bargeld: Stueck x Basis x Satz', tw(L, 260).bar, 0.00922 + 333.3333, 1e-9);
  nah('Bewertung mit Bargeld 260', tw(L, 260).buch, 100133.73, 1e-9);
  gleich('Umschichtung 274 mit Bargeld aus der Ausschuettung vom 260', [L.umschichtungen[1].bestand.XLB, L.umschichtungen[1].bestand.XLE, L.umschichtungen[1].bestand.XLF], [333.7791, 333.7791, 333.7724]);
  nah('Bargeld nach dem Handel 274 (Gutschrift des Tages noch nicht dabei)', L.umschichtungen[1].bargeldDanach, 0.00718, 1e-9);
  nah('Gutschrift 274 nach dem Handel, Anspruch nach Stueck vor dem Handel (331,3373 x 2)', tw(L, 274).bar, 0.00718 + 662.6746, 1e-9);
  nah('Kosten 274', L.umschichtungen[1].kosten, 0.66534, 1e-9);
  nah('Schluss 274', tw(L, 274).buch, 100795.74, 1e-9);
  gleich('zwei Ausschuettungen gebucht', [L.zaehler.ausschuettungen, Math.round(L.zaehler.ausschuettungSumme * 1e6) / 1e6], [2, 996.0079]);
  nah('SPY: Wiederanlage am Ex-Tag zum Schluss, Ex-Tag am Kauftag zaehlt nicht', tw(L, 260).spy, 101000, 1e-9);
  ok('SPY: eine Ausschuettung gebucht', L.zaehler.spyAusschuettungen === 1 && Math.abs(L.zaehler.spyRateSumme - 4) < 1e-12);
  var Lk = lauf(D, 253, 280, { ausschuettungen: false });
  ok('ohne Ausschuettungen: weder Buch noch SPY', Lk.zaehler.ausschuettungen === 0 && Lk.zaehler.spyAusschuettungen === 0 && Lk.endSpy === 100000);
})();
(function () {
  /* Verkauf am Ex-Tag zaehlt: XLF schliesst am Stichtag 273 bei 50 (Staerke 50/60 - 1 < 0) -> Ziel 274: XLB, XLE, XLI; XLF wird zur Eroeffnung 100 ganz verkauft.
   * XLF Ex 274, 1 $: Satz 1/50 (Vortag 273), Basis 50 -> 331,3373 x 50 x 0,02 = 331,3373, gutgeschrieben nach dem Handel.
   * Handel 274: Depotwert 0,00922 + 99800,39 = 99800,39922, Budget 33266,79974. XLB, XLE je 0,6653 teilverkauft (66,39694), XLF ganz (331,3373 x 100 x 0,998 = 33067,46254)
   * -> Bargeld 33200,26564. XLI: round4(332,6679974) = 332,668 kostet 33333,3336 > Bargeld -> floor(33200,26564 / 100,2 x 1e4) / 1e4 = 331,3399 (33200,25798) -> 0,00766. */
  var D = welt({ n: 300, fonds: standard({ XLF: { 273: { c: 50 } } }), divs: { XLF: [{ t: 274, betrag: 1 }] } });
  var L = lauf(D, 253, 276);
  gleich('Ziel 274 ohne XLF; XLF ganz verkauft', [L.umschichtungen[1].ziel, L.umschichtungen[1].verkauft], [['XLB', 'XLE', 'XLI'], ['XLF']]);
  gleich('XLI gekauft (verkleinert)', L.umschichtungen[1].bestand.XLI, 331.3399);
  nah('Verkauf am Ex-Tag: Anspruch zaehlt, Gutschrift nach dem Handel', tw(L, 274).bar, 0.00766 + 331.3373, 1e-6);
  ok('eine Ausschuettung gebucht, XLF nicht mehr im Buch', L.zaehler.ausschuettungen === 1 && !pos(L, 'XLF'));
})();

/* ================= 9. Bewertung bei fehlender Zeile, Reihenende ================= */
(function () {
  /* W1-Pfade; XLB Schluss 279 = 110, Zeilen 280..282 fehlen -> Bewertung mit 110 (nie der Einstand 100,2). Lauf 253..294, Stueck nach 274 wie W1.
   * Tag 281: 332,668 x 110 + 332,668 x 100 + 332,6626 x 100 + 0,00804 = 103126,54804 -> 103126,55. Lueckentage 3.
   * XLE: letzte Zeile 290 -> am 291 zum letzten Schluss ausgebucht: 332,668 x 100 = 33266,8 ins Bargeld (ohne Kosten). */
  var D = welt({ n: 300, fonds: standard({ XLB: (function () { var u = luecke(280, 282); u[279] = { c: 110 }; return u; })(), XLE: luecke(291, 299) }),
    divs: { XLE: [{ t: 293, betrag: 1 }] } });
  var L = lauf(D, 253, 294);
  ok('Ex-Tag nach der letzten Zeile der Reihe zaehlt nicht (XLE endet 290, Ex 293)', D.reihen.XLE.az.nachLetzterZeile === 1 && D.reihen.XLE.az.gezaehlt === 0);
  nah('fehlende Zeile: letzter Schluss (110) gilt', tw(L, 281).buch, 103126.55, 1e-9);
  /* groesstes Gewicht: XLB 332,668 x 110 = 36593,48 gegen den Buchwert 103126,55 am Tag 279 (erster Tag des Hoechststands; 280..282 gleich, nicht groesser) */
  ok('groesstes Gewicht: groesste Position / Buchwert zum Schluss, Tag und Reihe des ersten Hoechststands', L.maxGewicht.reihe === 'XLB' && L.maxGewicht.tag === D.T[279] &&
    Math.abs(L.maxGewicht.anteil - 36593.48 / 103126.55) < 1e-9);
  nah('Tag 283: Zeile wieder da (100)', tw(L, 283).buch, 99799.87, 1e-9);
  ok('Lueckentage gezaehlt (280, 281, 282)', L.zaehler.lueckentage === 3);
  gleich('Reihenende: Ausbuchung am Handelstag nach der letzten Zeile zum letzten Schluss', L.reihenenden, [{ reihe: 'XLE', tag: D.T[291], letzteZeile: D.T[290], gutschrift: 33266.8 }]);
  nah('Bargeld nach dem Reihenende', tw(L, 291).bar, 0.00804 + 33266.8, 1e-9);
})();

/* ================= 10. Preisweg adjclose (ZUSATZ §4) ================= */
(function () {
  /* XLB, XLE, XLF und SPY: adjclose = 0,95 x close vor Tag 260, = close ab 260. XLB zahlt am 258 3 $ (im Hauptweg gutgeschrieben, im adjclose-Weg nicht).
   * adjclose-Weg, 253: Handel zu 100 x 95/100 = 95. round4(33333,3333 / 95) = 350,8772 (x 95,19 = 33400,000668) zweimal -> Bargeld 33199,998664;
   *   XLF floor(33199,998664 / 95,19 x 1e4) / 1e4 = 348,7761 (33199,996959) -> Bargeld 0,001705. Schluss 253 zu adjclose 95: 1050,5305 x 95 + 0,001705 = 99800,399205 -> 99800,40.
   *   Schluss 260 zu adjclose 100: 105053,051705 -> 105053,05. SPY: 100000 / 380 Stueck, Schluss 260 zu 400 -> 105263,157895.
   * Hauptweg 260: 99800,39922 + 333,3333 x 100 x 0,03 = 100800,39912 -> 100800,40; SPY 100000. */
  var adjF = function (b) { return fondsF(b, function () { return 100; }, (function () { var u = {}; for (var t = 0; t < 260; t++) u[t] = { a: 0.95 * (t < 200 ? b : 100) }; return u; })()); };
  var f = standard(); f.XLB = adjF(50); f.XLE = adjF(55); f.XLF = adjF(60);
  var D = welt({ n: 300, fonds: f, spy: function (t) { return { c: 400, a: t < 260 ? 380 : 400 }; }, divs: { XLB: [{ t: 258, betrag: 3 }], SPY: [{ t: 258, betrag: 2 }] } });
  var La = lauf(D, 253, 265, { preisweg: 'adjclose' }), Lh = lauf(D, 253, 265);
  gleich('adjclose-Weg: Handel zu open x adjclose / close', [pos(La, 'XLB').stueck, pos(La, 'XLF').stueck, Math.round(pos(La, 'XLB').einstand * 1e9) / 1e9], [350.8772, 348.7761, 95.19]);
  nah('adjclose-Weg: Bewertung zu adjclose (253)', tw(La, 253).buch, 99800.40, 1e-9);
  nah('adjclose-Weg: Bewertung zu adjclose (260)', tw(La, 260).buch, 105053.05, 1e-9);
  ok('adjclose-Weg: keine Gutschrift (Buch und SPY)', La.zaehler.ausschuettungen === 0 && La.zaehler.spyAusschuettungen === 0 && Math.abs(tw(La, 260).bar - 0.001705) < 1e-9);
  nah('adjclose-Weg: SPY zu open x adjclose / close gekauft, zu adjclose bewertet', tw(La, 260).spy, 100000 / 380 * 400, 1e-6);
  nah('adjclose-Weg: SPY am Kauftag zu adjclose 380 bewertet (nicht zum Schluss 400)', tw(La, 253).spy, 100000, 1e-6);
  nah('Hauptweg daneben: Gutschrift 3 $ je Stueck', tw(Lh, 260).buch, 100800.40, 1e-9);
  gleich('Rangbildung unveraendert: dieselben Ziele auf beiden Wegen', La.ziele, Lh.ziele);
  var W = S.adjcloseWeg(D, 253, 265, null);
  nah('adjcloseWeg: Unterschied der Endwerte Buch = adjclose minus Hauptweg', W.kandidat.unterschied.buchEndeDollar, La.endBuch - Lh.endBuch, 1e-9);
  ok('adjcloseWeg: SPY fuer Kandidat und Placebo gleich, Felder vollstaendig', W.spy.adjclose === La.endSpy && W.spy.haupt === Lh.endSpy && W.placebo && W.placebo.adjclose.buchEnde > 0);
})();

/* ================= 11. Placebo laeuft durch dieselbe Mechanik (REGEL C.6, ZUSATZ §3.3) ================= */
(function () {
  /* sechs Fonds, alle flach 100 nach Tag 200: Placebo zieht 3 aus 6; die XLP-Luecke 262..273 macht den Ausfuehrungstag 274 fuer beide zu zuWenig
   * (dieselbe Zulaessigkeit): Umschichtungen 253, 275, 296, 317, 338. */
  var D = welt({ n: 360, fonds: standard({ XLP: luecke(262, 273) }) }), Lk = lauf(D, 253, 355), Lp = lauf(D, 253, 355, { modus: 'placebo' });
  var stimmt = Lp.umschichtungen.every(function (u) {
    var s = D.idx[u.stichtag];
    return JSON.stringify(u.ziel) === JSON.stringify(Z.placeboZiel(S.rohMapAm(D, s), { nowMs: D.ms[s] }).ziel);
  });
  ok('Placebo: jedes Ziel = placeboZiel auf derselben rohMap des Stichtags', stimmt && Lp.umschichtungen.length === 5);
  ok('Placebo waehlt nicht die Regel (mindestens ein anderes Ziel)', Lp.ziele.join('|') !== Lk.ziele.join('|'));
  gleich('Placebo: dieselben Ausfuehrungs- und zuWenig-Tage wie der Kandidat', [Lp.umschichtungen.map(function (u) { return u.ausfuehrungstag; }), Lp.zuWenigListe],
    [Lk.umschichtungen.map(function (u) { return u.ausfuehrungstag; }), Lk.zuWenigListe]);
  gleich('zuWenig-Tag 274 bei beiden', Lp.zuWenigListe, [D.T[274]]);
  ok('Placebo: derselbe SPY', Lp.endSpy === Lk.endSpy);
  /* flache, gleiche Kurse: jeder Dollar Kosten fehlt am Ende genau (Buch = 100000 - Kosten, auf den Cent) */
  nah('Placebo: Endwert = 100000 - gezahlte Kosten (flache Kurse)', Lp.endBuch, 100000 - Lp.zaehler.kosten, 0.005);
  nah('Placebo: Kosten = 0,002 x Volumen', Lp.zaehler.kosten, 0.002 * Lp.zaehler.volumen, 1e-9);
  ok('Placebo und Kandidat: unterschiedliche Cache-Eintraege je Modus', S.zielAm(D, 252, 'placebo', null) !== S.zielAm(D, 252, 'kandidat', null));
})();

/* ================= 12. t-Quantile und Periodenstreuung (ZUSATZ §2.6) ================= */
(function () {
  nah('t(0,975; 1) = tan(0,475 pi) (Cauchy, exakt)', S.tQuantil(0.975, 1), Math.tan(0.475 * Math.PI), 1e-9);
  /* df 2: F(t) = 1/2 + t / (2 sqrt(2 + t^2)) -> t^2 = 0,9025 x 2 / 0,0975 */
  nah('t(0,975; 2) exakt', S.tQuantil(0.975, 2), Math.sqrt(0.9025 * 2 / 0.0975), 1e-9);
  [[1, 12.706, 3], [30, 2.042, 3], [56, 2.0032, 4], [59, 2.0010, 4], [60, 2.000, 3], [120, 1.980, 3]].forEach(function (x) {
    nah('t(0,975; ' + x[0] + ') = ' + x[1] + ' (Tabelle, ' + x[2] + ' Stellen)', Number(S.tQuantil(0.975, x[0]).toFixed(x[2])), x[1], 1e-12);
  });
  var abw = 0;
  for (var df = 1; df <= 30; df++) abw = Math.max(abw, Math.abs(S.tQuantil(0.975, df) - [null, 12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179,
    2.160, 2.145, 2.131, 2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042][df]));
  ok('t-Werte 1..30 stimmen auf 3 Stellen mit der Tabelle aus rueckblick.js', abw <= 0.0005);
  nah('t-Verteilung symmetrisch: F(-t) = 1 - F(t)', S.tVerteilung(-1.3, 7), 1 - S.tVerteilung(1.3, 7), 1e-14);
  var per = [3, -1, 4, 1, -5].map(function (a) { return { abstand: a }; }), ps = S.periodenstreuung(per), pr = R.periodenstreuung(per);
  /* Mittel 0,4; Quadratsummen 6,76 + 1,96 + 12,96 + 0,36 + 29,16 = 51,2 -> sd = sqrt(12,8) = 3,5777; se = sd / sqrt(5) = 1,6 */
  ok('Periodenstreuung: Mittel, sd, se wie das Original (dieselben Formeln)', ps.mittel === pr.mittel && ps.standardabweichung === pr.standardabweichung && ps.standardfehler === pr.standardfehler);
  nah('Periodenstreuung von Hand: Mittel 0,4, se 1,6', ps.mittel + ps.standardfehler, 0.4 + 1.6, 1e-12);
  ok('Periodenstreuung: t fuer n - 1 = 4 Freiheitsgrade (2,776), Band schliesst 0 ein, 3 Perioden vorn', Math.abs(ps.tWert - 2.776) < 0.0005 && ps.freiheitsgrade === 4 &&
    ps.schliesstNullEin && ps.periodenVorn === 3 && Math.abs(ps.band95[0] - (0.4 - ps.tWert * 1.6)) < 1e-12);
  ok('Periodenstreuung ueber 30 Freiheitsgrade (die Tabelle von rueckblick.js endet bei 30)', S.periodenstreuung(new Array(57).fill(0).map(function (x, i) { return { abstand: i % 3 }; })).tWert < 2.004);
})();

/* ================= 13. Startphasen (ZUSATZ §2.7) ================= */
(function () {
  var SP = S.startphasen(W1, 253, 304, 5, { modus: 'kandidat' });
  gleich('Startphasen: erster Ausfuehrungstag k Handelstage nach dem Fensterbeginn, Ende gleich', SP.phasen.map(function (p) { return p.start; }), [W1.T[253], W1.T[254], W1.T[255], W1.T[256], W1.T[257]]);
  var L3 = lauf(W1, 256, 304), k3 = S.kennzahlen(W1, L3);
  ok('Phase k = 3 ist ein eigener Nachlauf ab 100.000 $ mit eigener Dauer fuer p. a.', SP.phasen[3].buchEnde === L3.endBuch && SP.phasen[3].abstandPa === k3.abstandPa && k3.jahre < S.kennzahlen(W1, L1).jahre);
  ok('Startphasen: vorn zaehlt strikt (Buch hinter SPY: 0 von 5), Median ueber R.median', SP.vorn === 0 && SP.median === R.median(SP.abstaende) && SP.anzahl === 5);
  ok('vorn heisst strikt groesser: Gleichstand ist nicht vorn', S.vorn(100000, 100000) === false && S.vorn(100000.01, 100000) === true);
  /* Kandidat gegen Placebo: Gleichstand der Endwerte in einer Phase und bei k = 0 ist nicht vorn; Abstand = Differenz der Buch-p.-a.-Werte */
  function fx(ende, pa) { return { haupt: { buchEnde: ende[0], buchPa: pa[0] }, startphasen: { anzahl: ende.length, phasen: ende.map(function (e, i) { return { k: i, start: 'x' + i, spyEnde: 1, buchEnde: e, buchPa: pa[i] }; }) } }; }
  var G = S.kandidatGegenPlacebo(fx([100, 110, 90], [1, 2, -1]), fx([100, 105, 95], [1, 1.5, -0.5]));
  gleich('Kandidat gegen Placebo: Gleichstand nicht vorn, 1 von 3 Phasen vorn, Abstaende 0 / 0,5 / -0,5', [G.k0Vorn, G.vorn, G.abstaende, G.median], [false, 1, [0, 0.5, -0.5], 0]);
})();

/* ================= 14. Urteil (ZUSATZ §3) ================= */
(function () {
  function e(k0, ph, med, na) { return { k0Vorn: k0, phasenVorn: ph, nPhasen: 63, median: med, nichtAusfuehrbar: !!na }; }
  var gutA = e(true, 45, 0.01), u;
  ok('drei Bedingungen erfuellt: k = 0 vorn, 45 von 63, Median > 0', S.fensterBedingungen(gutA).alleDrei === true);
  ok('Grenze 44 von 63 reicht nicht', S.fensterBedingungen(e(true, 44, 1)).alleDrei === false && S.fensterBedingungen(e(true, 44, 1)).zwischen === 'k = 0 vorn, aber unter 45 Phasen');
  ok('Median genau 0 reicht nicht (> 0)', S.fensterBedingungen(e(true, 50, 0)).alleDrei === false);
  ok('k = 0 Gleichstand ist nicht vorn', S.fensterBedingungen(e(S.vorn(5, 5), 63, 1)).alleDrei === false &&
    S.fensterBedingungen(e(false, 63, 1)).zwischen === 'Median > 0 und mindestens 45 Phasen, aber k = 0 nicht vorn');
  ok('Zwischenurteil "Median > 0, aber k = 0 nicht vorn"', S.fensterBedingungen(e(false, 30, 0.5)).zwischen === 'Median > 0, aber k = 0 nicht vorn und unter 45 Phasen');
  ok('Zwischenurteil keine Bedingung', S.fensterBedingungen(e(false, 3, -2)).zwischen === 'nicht vorn (keine der drei Bedingungen)');
  wirft('Urteil verlangt 63 Startphasen', function () { S.fensterBedingungen({ k0Vorn: true, phasenVorn: 60, nPhasen: 62, median: 1 }); }, /63/);
  u = S.urteil(gutA, e(true, 63, 2));
  ok('"schlägt SPY" nur, wenn A und B alle drei erfuellen', u.satz === 'schlägt SPY');
  u = S.urteil(gutA, e(true, 44, 2));
  ok('A ja, B nein: "schlägt nicht", vorn nur in Fenster A', u.satz === 'schlägt nicht' && u.zusatz === 'vorn nur in Fenster A' && u.fenster.B.zwischen === 'k = 0 vorn, aber unter 45 Phasen');
  u = S.urteil(e(false, 50, 1), gutA);
  ok('A nein, B ja: vorn nur in Fenster B', u.satz === 'schlägt nicht' && u.zusatz === 'vorn nur in Fenster B');
  u = S.urteil(e(false, 1, -1), e(true, 1, -1));
  ok('keines: in keinem Fenster alle drei', u.satz === 'schlägt nicht' && u.zusatz === 'in keinem Fenster alle drei Bedingungen');
  u = S.urteil(gutA, e(true, 63, 2, true));
  ok('"nicht ausführbar" geht jedem anderen Satz vor (auch "schlägt SPY")', u.satz === 'nicht ausführbar' && u.zusatz === 'Fenster B' && u.momentumBefund === false);
  u = S.urteil(gutA, e(true, 63, 2), { placebo: { A: e(true, 45, 0.1), B: e(true, 50, 0.2) } });
  ok('Momentum-Befund: Kandidat schlaegt SPY und das Placebo nach denselben drei Bedingungen in beiden Fenstern', u.momentumBefund === true && /Momentum-Befund/.test(u.text));
  u = S.urteil(gutA, e(true, 63, 2), { placebo: { A: e(true, 45, 0.1), B: e(true, 44, 0.2) } });
  ok('kein Momentum-Befund, wenn das Placebo in einem Fenster nicht geschlagen wird', u.satz === 'schlägt SPY' && u.momentumBefund === false && /kein Momentum-Befund/.test(u.text));
  u = S.urteil(gutA, e(true, 44, 2), { datenluecke: true });
  ok('Vermerk "Datenlücke gegen das Buch" an einem "schlägt nicht"', u.vermerke.indexOf('Datenlücke gegen das Buch') >= 0);
  ok('kein Datenlücken-Vermerk an einem "schlägt SPY"', S.urteil(gutA, gutA, { datenluecke: true }).vermerke.length === 0);
})();

/* ================= 15. Zusatz: Start der Langlaeufe, Fensterenden (ZUSATZ §5) ================= */
(function () {
  /* Umsatz: Stueck 0,5 Mio bis Tag 299, 2 Mio ab 300 (Kurs 100). Stichtag s: Median der 20 Balken s-19..s = sortiert[10] ist hoch, wenn mindestens 10 Balken ab 300 -> s >= 309.
   * Regel: erster Ausfuehrungstag 310. Ohne Schwelle: Stichtag 252 hat 253 Zeilen -> 253. */
  var D = welt({ n: 330, fonds: standard(null, null, null) });
  Object.keys(BASIS).forEach(function (sym) { var r = D.reihen[sym]; for (var i = 0; i < r.n; i++) { var v = i < 300 ? 0.5e6 : 2e6; r.volume[i] = v; r.roh[i][2] = r.close[i] * v / r.adj[i]; } });
  ok('Langlauf Regel: erster Tag, dessen Stichtag nicht zuWenig meldet (310)', S.langlaufStart(D, D.T[0], null) === 310);
  ok('Stichtag 308 meldet noch zuWenig (Median 50 Mio $)', S.zielAm(D, 308, 'kandidat', null).zuWenig === true && S.zielAm(D, 309, 'kandidat', null).zuWenig === false);
  ok('Langlauf ohne Schwelle: 253 (erste 253 Zeilen am Stichtag 252)', S.langlaufStart(D, D.T[0], 0) === 253);
  ok('Start "ab" einem Tag (einschliesslich): ab Tag 260 -> 260', S.langlaufStart(D, D.T[260], 0) === 260 && S.langlaufStart(D, D.T[315], null) === 315);
  ok('Start ab einem Samstag (Index 262 ist Freitag 01.01.2021): erster Handelstag danach', S.langlaufStart(D, plusTage(D.T[262], 1), 0) === 263);
  ok('Konstante: Langlaeufe ab 03.01.2000 bis 15.09.2026, fuenf Jahre', S.ZUSATZ5.ab === '2000-01-03' && S.ZUSATZ5.ende === '2026-09-15' && S.ZUSATZ5.jahre === 5);
  /* Fensterenden: Wochentage 01.12.1999 .. 2005; s + 5 Jahre ueber Date.UTC(J + 5, M, T) */
  var t = wochentage('1999-12-01', 1400), K = { kal: { tage: t }, ms: new Float64Array(t.map(S.tagMs)), n: t.length, idx: {} };
  t.forEach(function (x, i) { K.idx[x] = i; });
  function ende(s) { return t[S.fuenfJahresEnde(K, K.idx[s]).ende]; }
  ok('29.02.2000 + 5 Jahre = Date.UTC(2005, 1, 29) = 01.03.2005 -> Ende 28.02.2005 (Montag)', ende('2000-02-29') === '2005-02-28');
  ok('28.02.2000 -> Ende 25.02.2005 (letzter Handelstag vor dem 28.02.2005)', ende('2000-02-28') === '2005-02-25');
  ok('01.03.2000 -> Ende 28.02.2005', ende('2000-03-01') === '2005-02-28');
  var t2 = wochentage('2021-09-01', 1320).filter(function (x) { return x <= '2026-09-15'; }), K2 = { kal: { tage: t2 }, ms: new Float64Array(t2.map(S.tagMs)), n: t2.length, idx: {} };
  t2.forEach(function (x, i) { K2.idx[x] = i; });
  ok('Beispiel der ZUSATZ: 16.09.2021 -> 15.09.2026', t2[S.fuenfJahresEnde(K2, K2.idx['2021-09-16']).ende] === '2026-09-15');
  var RF = S.rollierendeFenster(K2, K2.idx['2021-09-14'], '2026-09-16');
  gleich('nur vollstaendige Fenster (s + 5 Jahre <= 16.09.2026): Starts 14., 15., 16.09.2021, nicht 17.09.', RF.map(function (f) { return [t2[f.s], t2[f.e]]; }),
    [['2021-09-14', '2026-09-11'], ['2021-09-15', '2026-09-14'], ['2021-09-16', '2026-09-15']]);
  /* Auswertung: 10-%/90-%-Punkt linear (Typ 7): [1..10]: h = 0,9 -> 1,9; h = 8,1 -> 9,1 */
  nah('Quantil Typ 7: 10-%-Punkt von 1..10 = 1,9', S.quantil([10, 9, 8, 7, 6, 5, 4, 3, 2, 1], 0.1), 1.9, 1e-12);
  nah('Quantil Typ 7: 90-%-Punkt von 1..10 = 9,1', S.quantil([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 0.9), 9.1, 1e-12);
  var A = S.auswertung([{ start: '2000-01-03', ende: '2004-12-31', vorn: true, abstandPa: 2 }, { start: '2000-06-01', ende: '2005-05-31', vorn: false, abstandPa: -1 },
    { start: '2001-01-02', ende: '2005-12-30', vorn: false, abstandPa: -3 }]);
  gleich('Auswertung: Zahl, Anteil vorn, Median, schlechtestes/bestes Fenster, je Startjahr', [A.fenster, A.vorn, A.median, A.schlechtestes.start, A.bestes.start, A.jeStartjahr['2000'], A.jeStartjahr['2001']],
    [3, 1, -1, '2001-01-02', '2000-01-03', { fenster: 2, vorn: 1, anteil: 0.5 }, { fenster: 1, vorn: 0, anteil: 0 }]);
})();

/* ================= 16. Pruefsummen und Pflichtpruefung (ZUSATZ §1.3, §1.9) ================= */
(function () {
  gleich('Konstanten der Pflichtpruefung (ZUSATZ §1.9)', S.PFLICHT, { i: { von: '2017-01-03', bis: '2021-09-15', kauf: 'schluss', sollGesamt: 115.95 },
    ii: { von: '2017-01-04', bis: '2021-09-15', kauf: 'eroeffnung', sollEnde: 215535.73 }, iii: { von: '2021-09-16', bis: '2026-09-15', kauf: 'eroeffnung', sollEnde: 181193.87 },
    iv: { A: 23.8656, B: 34.0657 }, toleranzPp: 0.30, toleranzDollar: 0.01 });
  var buf = Buffer.from('abc');
  ok('SHA-256("abc") bekannter Testwert', S.sha256(buf) === 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  ok('Pruefsumme stimmt: kein Abbruch', S.pruefeDatei('X', buf, { sha256: S.sha256(buf), bytes: 3 }) === S.sha256(buf));
  wirft('Pruefsumme falsch: Abbruch', function () { S.pruefeDatei('X', buf, { sha256: S.sha256(Buffer.from('abd')), bytes: 3 }); }, /SHA-256/);
  wirft('Groesse falsch: Abbruch', function () { S.pruefeDatei('X', buf, { sha256: S.sha256(buf), bytes: 4 }); }, /Groesse/);
  wirft('Datei fehlt in pruefsummen.json: Abbruch', function () { S.pruefeDatei('X', buf, undefined); }, /fehlt/);
  /* SPY: Schluss 100 bis Tag 9, 110 ab Tag 10; Eroeffnung 98 am Tag 3 und 105 am Tag 10 (Wiederanlage zum Schluss 110, nicht zur Eroeffnung).
   * Ex 3 (1 $, Satz 1/100), Ex 10 (2 $, Satz 2/100).
   * (i) Kauf zum Schluss 2: 1000 Stueck; Ex 3: + 1000 x 1 / 100 = 10 -> 1010; Ex 10: x (1 + 2/110) -> 1010 x 112/110; Ende 20: x 110 = 113120 -> +13,12 %.
   * (ii) Kauf zur Eroeffnung 3: 100000/98 Stueck; Ex 3 = Kauftag zaehlt nicht; Ex 10: x 112/110; Ende = 100000/98 x 112 = 114285,714286 -> +14,285714 %; Saetze 2 $.
   * (iii) Kauf zur Eroeffnung 11 (110): 909,0909 Stueck, keine Ausschuettung, Ende 100000 -> 0 %. */
  var D = welt({ n: 21, fonds: {}, spy: function (t) { return { c: t >= 10 ? 110 : 100, o: t === 3 ? 98 : t === 10 ? 105 : undefined }; }, divs: { SPY: [{ t: 3, betrag: 1 }, { t: 10, betrag: 2 }] } });
  var i = S.spyNachlauf(D, 2, 20, 'schluss'), ii = S.spyNachlauf(D, 3, 20, 'eroeffnung');
  nah('Pflicht (i): Kauf zum Schluss, Wiederanlage am Ex-Tag zum Schluss', i.ende, 113120, 1e-6);
  nah('Pflicht (ii): Kauf zur Eroeffnung, Ex-Tag am Kauftag zaehlt nicht', ii.ende, 100000 / 98 * 112, 1e-6);
  ok('Pflicht (iv): Summe der Saetze nach dem Kauftag', ii.rateSumme === 2 && i.rateSumme === 3 && ii.ausschuettungen === 1);
  var P = { i: { von: D.T[2], bis: D.T[20], kauf: 'schluss', sollGesamt: 13.12 }, ii: { von: D.T[3], bis: D.T[20], kauf: 'eroeffnung', sollEnde: 114285.71 },
    iii: { von: D.T[11], bis: D.T[20], kauf: 'eroeffnung', sollEnde: 100000 }, iv: { A: 2, B: 0 }, toleranzPp: 0.30, toleranzDollar: 0.01 };
  var pf = S.pflichtpruefung(D, P);
  ok('Pflichtpruefung an Kunstdaten bestanden', pf.bestanden && pf.i.bestanden && pf.ii.bestanden && pf.iii.bestanden && pf.iv.A.bestanden && pf.iv.B.bestanden);
  nah('Pflichtpruefung: Soll-Gesamtertrag aus dem Soll-Endwert', pf.ii.sollGesamt, 14.285710, 1e-9);
  P.i.sollGesamt = 13.12 + 0.31;
  ok('Pflichtpruefung: 0,31 Pp daneben ist verfehlt', S.pflichtpruefung(D, P).bestanden === false && S.pflichtpruefung(D, P).i.bestanden === false);
  P.i.sollGesamt = 13.12 + 0.29;
  ok('Pflichtpruefung: 0,29 Pp daneben ist innerhalb', S.pflichtpruefung(D, P).i.bestanden === true);
  P.iv.A = 2.011;
  ok('Pflichtpruefung (iv): 0,011 $ daneben ist verfehlt', S.pflichtpruefung(D, P).iv.A.bestanden === false);
  /* klinken() laeuft an Kunstdaten durch und sammelt die Befunde. SPY flach 100, Ex 10 (= erster Fenstertag A: zaehlt nicht fuer A), 12, 30 je 1 $.
   * (i) Kauf zum Schluss 9: Ex 10 und 12 je +1 % -> 1,01^2 = +2,01 %; (ii) Kauf zur Eroeffnung 10: nur Ex 12 -> 101000; (iii) ab 25: Ex 30 -> 101000. */
  var T40 = wochentage('2020-01-01', 40), divs3 = [{ sek: sekVon(T40[10]), betrag: 1 }, { sek: sekVon(T40[12]), betrag: 1 }, { sek: sekVon(T40[30]), betrag: 1 }];
  function kd(erg) {
    return S.baueDaten({ SPY: S.liesAntwort(antwort('SPY', T40.map(function (x) { return { tag: x, c: 100 }; }), divs3), 'SPY'),
      XLB: S.liesAntwort(antwort('XLB', T40.map(function (x) { return { tag: x, c: 100 }; })), 'XLB') }, erg);
  }
  var Wd = kd(), W0 = kd({ ergaenzungen: {} });
  var def = { A: { von: T40[10], bis: T40[24], stichtag: T40[9], handelstage: 15, spyAusschuettungen: 1 }, B: { von: T40[25], bis: T40[39], stichtag: T40[24], handelstage: 15, spyAusschuettungen: 1 } };
  var PP = { i: { von: T40[9], bis: T40[24], kauf: 'schluss', sollGesamt: 2.01 }, ii: { von: T40[10], bis: T40[24], kauf: 'eroeffnung', sollEnde: 101000 },
    iii: { von: T40[25], bis: T40[39], kauf: 'eroeffnung', sollEnde: 101000 }, iv: { A: 1, B: 1 }, toleranzPp: 0.3, toleranzDollar: 0.01 };
  var KL = S.klinken(Wd, { fenster: def, jahre: [2099, 2098], letzterTag: T40[39], pflicht: PP });
  ok('klinken an Kunstdaten: bestanden (Ergaenzung einmal behandelt, SPY-Ex-Tage nach dem ersten Fenstertag: 1 und 1, Pflicht)', KL.bestanden && KL.spy.jeFenster.A === 1 &&
    KL.spy.jeFenster.B === 1 && KL.spy.ergaenzt === 1 && Math.abs(KL.pflicht.i.istGesamt - 2.01) < 1e-9);
  var KL0 = S.klinken(W0, { fenster: def, jahre: [2099, 2098], letzterTag: T40[39], pflicht: PP });
  ok('klinken: Ergaenzung nicht genau einmal behandelt wird gemeldet', KL0.fehler.length === 1 && /Ergaenzung/.test(KL0.fehler[0]));
  def.A.spyAusschuettungen = 2;
  ok('klinken: falsche Zahl der SPY-Ex-Tage wird gemeldet', S.klinken(Wd, { fenster: def, jahre: [2099, 2098], letzterTag: T40[39], pflicht: PP }).fehler.length === 1);
})();

/* ================= 17. Ende zu Ende (a): die gehaltenen Fonds verlaufen wie SPY -> Abstand = minus Kosten ================= */
(function () {
  /* Alle Fonds und SPY flach 100 ab Tag 200 (gleicher Verlauf). Lauf 253..300 wie W1: Kosten 199,60078 + 0,53118 + 0,00144 = 200,1334; Endwert 100000 - 200,1334
   * = 99799,8666 -> 99799,87 (Cent); SPY 1000 Stueck x 100 = 100000. Abstand in $ = minus Kosten (auf den Cent). */
  var D = welt({ n: 305, fonds: standard(), spy: function () { return { c: 100 }; } }), L = lauf(D, 253, 300), kz = S.kennzahlen(D, L);
  nah('(a) Kosten von Hand', L.zaehler.kosten, 200.1334, 1e-6);
  nah('(a) Endwert Buch = 100000 - Kosten (Cent)', L.endBuch, 99799.87, 1e-9);
  nah('(a) Endwert SPY', L.endSpy, 100000, 1e-9);
  nah('(a) Abstand in $ = minus Kosten', L.endBuch - L.endSpy, -L.zaehler.kosten, 0.005);
  var jahre = (D.ms[300] - D.ms[253]) / (365.25 * TAG);
  nah('(a) Abstand p. a. = p. a. von 99799,87 (SPY 0 %)', kz.abstandPa, (Math.pow(0.9979987, 1 / jahre) - 1) * 100, 1e-12);
  ok('(a) "vorn" nein', kz.schlaegt === false);
})();

/* ================= 18. Ende zu Ende (b): eingepflanzter Vorsprung -> "schlägt SPY"; (c) Rueckstand -> "schlägt nicht" ================= */
function vorsprungWelt(spyRate) {
  /* XLB, XLE, XLF wachsen 0,2 % je Tag, XLI, XLK, XLP fallen 0,1 % je Tag (Stueck 4 Mio: Umsatz >= 60 x 4 Mio), SPY waechst spyRate je Tag.
   * Staerke ueber 252 Tage: 1,002^252 - 1 = +65 % gegen -22 %: der Kandidat haelt immer XLB, XLE, XLF. Eroeffnung = Schluss des Vortags. */
  var f = {};
  ['XLB', 'XLE', 'XLF'].forEach(function (s, j) { f[s] = function (t) { return { c: (100 + j) * Math.pow(1.002, t), o: (100 + j) * Math.pow(1.002, Math.max(0, t - 1)), v: 4e6 }; }; });
  ['XLI', 'XLK', 'XLP'].forEach(function (s, j) { f[s] = function (t) { return { c: (100 + j) * Math.pow(0.999, t), o: (100 + j) * Math.pow(0.999, Math.max(0, t - 1)), v: 4e6 }; }; });
  return welt({ n: 453, fonds: f, spy: function (t) { return { c: 300 * Math.pow(1 + spyRate, t), o: 300 * Math.pow(1 + spyRate, Math.max(0, t - 1)) }; } });
}
(function () {
  var D = vorsprungWelt(0.0005), M = S.messung(D, { A: { von: 253, bis: 352 }, B: { von: 353, bis: 452 } });
  /* die drei Staerken sind gleich bis auf Rundung in der 16. Stelle; die Reihenfolge im Ziel darf daher wechseln, die Menge nicht */
  ok('(b) Kandidat haelt in allen Umschichtungen XLB, XLE, XLF', M.A.kandidat.umschichtungen.concat(M.B.kandidat.umschichtungen).every(function (u) { return u.ziel.slice().sort().join() === 'XLB,XLE,XLF'; }));
  ok('(b) 63 von 63 Startphasen vorn in A und B, Median > 0', M.A.kandidat.startphasen.vorn === 63 && M.B.kandidat.startphasen.vorn === 63 && M.A.kandidat.startphasen.median > 0);
  ok('(b) Urteil "schlägt SPY"', M.urteil.satz === 'schlägt SPY' && M.urteil.fenster.A.alleDrei && M.urteil.fenster.B.alleDrei);
  ok('(b) Kandidat schlaegt das Placebo -> Momentum-Befund', M.urteil.momentumBefund === true && M.A.kandidatGegenPlacebo.vorn >= 45 && M.B.kandidatGegenPlacebo.vorn >= 45);
  ok('(b) Pflichtzeilen vorhanden: Periodenstreuung, Kalenderjahre, Rueckschlag, Kosten, zuWenig, gehaltene Fonds, adjclose',
    M.A.kandidat.periodenstreuung.n === 5 && M.A.kandidat.kalenderjahre.length >= 1 && M.A.kandidat.haupt.rueckschlagSpy <= 0 && M.A.kandidat.haupt.kostenGezahlt > 0 &&
    M.A.kandidat.haupt.zuWenigTage === 0 && M.A.kandidat.haupt.gehalten.groesste === 3 && M.A.adjclose.kandidat.adjclose.buchEnde > 0);
  ok('(b) Perioden je Fenster: 100 Tage = 4 x 21 + 16', M.A.kandidat.haupt.perioden === 5 && M.A.kandidat.haupt.letztePeriodeTage === 16);
  var C = S.messung(vorsprungWelt(0.004), { A: { von: 253, bis: 352 }, B: { von: 353, bis: 452 } });
  ok('(c) Rueckstand (SPY 0,4 % je Tag): "schlägt nicht", in keinem Fenster', C.urteil.satz === 'schlägt nicht' && C.urteil.zusatz === 'in keinem Fenster alle drei Bedingungen' &&
    C.A.kandidat.startphasen.vorn === 0);
  /* (d) "nicht ausfuehrbar" Ende zu Ende: XLP ohne Zeilen an den Tagen 300..319 -> an den Stichtagen ab etwa 306 bis 318 nur 5 zulaessige Fonds (veraltet),
   * jeder Handelstag bis dahin ist ein zuWenig-Tag: weit mehr als 5 % der Ausfuehrungstage in Fenster A -> Urteil "nicht ausführbar" (geht "schlägt SPY" vor).
   * Fenster B bleibt ausfuehrbar: 252 Zeilen ueberspannen dort 272 Handelstage = rund 381 Kalendertage <= 400 (Datenwaechter der REGEL C.3 greift nicht;
   * eine Luecke von 41 Tagen wuerde ihn mit 411 Kalendertagen ausloesen). */
  var Dn = vorsprungWelt(0.0005);
  var r = Dn.reihen.XLP, keep = [];
  for (var i = 0; i < r.n; i++) if (!(i >= 300 && i <= 319)) keep.push(i);
  var gel = {};
  Object.keys(Dn.reihen).forEach(function (sym) {
    var x = Dn.reihen[sym], idx = sym === 'XLP' ? keep : x.tag.map(function (q, j) { return j; });
    gel[sym] = S.liesAntwort(antwort(sym, idx.map(function (j) { return { tag: x.tag[j], c: x.close[j], o: x.open[j], v: x.volume[j], a: x.adj[j] }; })), sym);
  });
  var Dl = S.baueDaten(gel, { ergaenzungen: {} }), N = S.messung(Dl, { A: { von: 253, bis: 352 }, B: { von: 353, bis: 452 } });
  /* k = 0 in A: Umschichtungen 253, 274, 295; Stichtag 315 sieht XLP veraltet (letzte Zeile 299) -> zuWenig 316..320 (Zeilen ab 320 wieder da),
   * Umschichtung 321 und 342: 5 zuWenig-Tage bei 5 Umschichtungen = 50 % */
  ok('(d) k = 0 in A: 5 zuWenig-Tage (316..320) und 5 Umschichtungen (253, 274, 295, 321, 342)', N.A.kandidat.haupt.zuWenigTage === 5 && N.A.kandidat.haupt.umschichtungen === 5 &&
    N.A.kandidat.umschichtungen[3].ausfuehrungstag === Dl.kal.tage[321]);
  ok('(d) zuWenig-Tage ueber 5 % in Fenster A: "nicht ausführbar" geht vor', N.A.nichtAusfuehrbar && !N.B.nichtAusfuehrbar &&
    N.urteil.satz === 'nicht ausführbar' && N.urteil.zusatz === 'Fenster A');
  /* Langlauf und rollierende Fenster laufen an Kunstdaten durch (5 Phasen, 2 Jahre statt 5 ueber die Fensterlaenge) */
  var LL = S.langlauf(D, null, { ab: D.T[0], ende: D.T[452], phasen: 5 });
  ok('Langlauf: Start 253, Kandidat und Placebo, Kandidat gegen Placebo', LL.startIndex === 253 && LL.kandidat.startphasen.anzahl === 5 && LL.kandidatGegenPlacebo.anzahl === 5);
})();

console.log('Pruefungen: ' + (gut + schlecht) + ', bestanden: ' + gut + ', Fehler: ' + schlecht);
if (schlecht) process.exit(1);
