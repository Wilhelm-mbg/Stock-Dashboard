'use strict';
/* PRUEFUNGEN je Regelzeile mit Kunstdaten (aufgerufen von test.js). Liest kein echtes Panel und keine echte EDGAR-Datei.
 * Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var KN = require('./konfig.js');
var LS = require('./lesen.js');
var ED = require('./edgar.js');
var MK = require('./merkmale.js');
var VK = require('./verknuepfung.js');
var MS = require('./messen.js');
var AW = require('./auswerten.js');
var LA = require('./lauf.js');

function lauf(h) {
  var ok = h.ok, nah = h.nah, teil = h.teil, TMP = h.TMP;

  /* ======================= Z7: Reaktionstag einer Annahmezeit ======================= */
  teil('Z7 Reaktionstag');
  var tage = h.kunstKalender('2019-01-01', '2019-12-31'), ix = function (d) { return tage.indexOf(d); };
  var halb = { '2019-11-29': { open: '09:30', close: '13:00' } };
  ok(ED.reaktionstag('2019-04-30T19:00:00.000Z', tage, null) === ix('2019-04-30'), 'Sommerzeit 15:00 ET -> derselbe Tag');
  ok(ED.reaktionstag('2019-04-30T20:05:00.000Z', tage, null) === ix('2019-05-01'), 'Sommerzeit 16:05 ET -> naechster Tag');
  ok(ED.reaktionstag('2019-04-30T20:00:00.000Z', tage, null) === ix('2019-05-01'), '16:00:00 genau -> naechster Tag (halboffen)');
  ok(ED.reaktionstag('2019-01-15T20:30:00.000Z', tage, null) === ix('2019-01-15'), 'Winterzeit 15:30 ET -> derselbe Tag');
  ok(ED.reaktionstag('2019-01-15T21:01:00.000Z', tage, null) === ix('2019-01-16'), 'Winterzeit 16:01 ET -> naechster Tag');
  ok(ED.reaktionstag('2019-01-15T12:00:00.000Z', tage, null) === ix('2019-01-15'), 'vor Handelsbeginn -> derselbe Tag');
  ok(ED.reaktionstag('2019-06-15T15:00:00.000Z', tage, null) === ix('2019-06-17'), 'Samstag -> Montag');
  ok(ED.reaktionstag('2019-11-29T18:30:00.000Z', tage, halb) === ix('2019-12-02'), 'Halbtag 13:30 ET -> naechster Handelstag');
  ok(ED.reaktionstag('2019-11-29T17:30:00.000Z', tage, halb) === ix('2019-11-29'), 'Halbtag 12:30 ET -> derselbe Tag');
  ok(ED.reaktionstag('kaputt', tage, null) === -1 && ED.reaktionstag('2020-06-01T15:00:00.000Z', tage, null) === -1, 'unlesbar / nach Kalenderende -> -1');

  /* ======================= Z1/Z2: CIK, SIC, 8-K ======================= */
  teil('Z1 Z2 CIK SIC 8-K');
  (function () {
    var q = { tafel: { X: { cik: 5 }, Z: { cik: 9 } }, gruende: [{ reihe: 'Y', panel: { reihe: 'Y~2' }, cik: '0000000007' }, { reihe: 'W', panel: { reihe: 'W' }, cik: null }] };
    var r = ED.cikJeReihe(['X', 'X~2', 'Y~2', 'W', 'Z'], [false, false, false, false, true], q);
    ok(r.cik[0] === 5 && r.cik[1] === 0 && r.cik[2] === 7 && r.cik[3] === 0 && r.cik[4] === 0, 'Tafel, kein Grundname fuer X~2, Gruende-Tafel ueber panel.reihe, Referenz ohne CIK');
    var ord = path.join(TMP, 'edgar'); fs.mkdirSync(ord, { recursive: true });
    fs.writeFileSync(path.join(ord, ED.cik10(11) + '.json'), JSON.stringify({ sic: '2834', k8: [
      { t: '2019-04-30T19:00:00.000Z', f: '8-K', i: '2.02,9.01' }, { t: '2019-05-30T19:00:00.000Z', f: '8-K/A', i: '2.02' },
      { t: '2019-06-30T19:00:00.000Z', f: '8-K', i: '5.02' }, { f: '8-K', i: '2.02' }, { t: '2019-07-30T19:00:00.000Z', f: '8-K', i: '12.02,2.02' }] }));
    fs.writeFileSync(path.join(ord, ED.cik10(12) + '.json'), JSON.stringify({ sic: '0000', k8: [] }));
    var F = ED.ladeFirmen([11, 12, 13], ord);
    var f = F.firmen.get(11);
    ok(f.sic3 === '283' && f.annahmen.length === 2, 'SIC 2834 -> Gruppe 283; nur 8-K mit Punkt 2.02 und Zeit (2 von 5)');
    ok(F.zaehler.formAnders === 1 && F.zaehler.ohneZeit === 1, '8-K/A und fehlende Zeit gezaehlt');
    ok(F.firmen.get(12).sic3 === null && F.zaehler.fehlt === 1, 'SIC 0000 -> keine Gruppe; fehlende Datei gezaehlt');
  })();

  /* ======================= Kunstpanel mit bekannter Antwort ======================= */
  var TAGE = h.kunstKalender('2016-01-04', '2024-12-31'), nT = TAGE.length;
  var NGR = 8, JE = 6, NS = NGR * JE;
  var reihen = [{ name: 'SPY', schluss: new Float64Array(nT).fill(100), referenz: true, klasse: 3 }];
  for (var s = 0; s < NS; s++) reihen.push({ name: 'S' + s, schluss: new Float64Array(nT).fill(100), eroeffnung: new Float64Array(nT).fill(100), klasse: s % 4 });
  var SYM = function (s2) { return s2 + 1; };                /* Panelindex (SPY = 0) */
  var ereignis = [];                                         /* { D, A, r, delta, gruppe } */
  for (var k = 0; ; k++) {
    var D0 = 300 + 30 * k; if (D0 + 40 >= nT) break;
    ereignis.push({ D: D0, gruppe: k % NGR, A: (k % NGR) * JE + (k % JE), r: 0, delta: 1 + 0.1 * ((k % 5) - 2) });
    ereignis.push({ D: D0 + 15, gruppe: (k + 3) % NGR, A: ((k + 3) % NGR) * JE + ((k + 2) % JE), r: 1, delta: 1 + 0.1 * ((k % 3) - 1) });
  }
  ereignis.sort(function (a, b) { return a.D - b.D; });
  /* Sonderfaelle */
  var evDoppel = ereignis[10], Y = evDoppel.gruppe * JE + ((evDoppel.A % JE) + 1) % JE;   /* zweites A derselben Gruppe am selben Tag */
  var evAus = ereignis[6], X = evAus.gruppe * JE + ((evAus.A % JE) + 2) % JE;                /* X meldet am Einstiegstag eine 2.02 */
  var evAbg = ereignis[8], Zab = evAbg.gruppe * JE + ((evAbg.A % JE) + 3) % JE;            /* Z endet 3 Tage nach dem Einstieg */
  /* S47 ist eine Gattung von S46 (gleiche CIK) */
  function setze(sx, ab, faktor) { var p = reihen[SYM(sx)]; for (var t = ab; t < nT; t++) { p.schluss[t] *= faktor; p.eroeffnung[t] *= faktor; } }
  ereignis.forEach(function (ev) {
    var f = ev.r === 0 ? 1.01 : 0.99;
    var Ap = reihen[SYM(ev.A)];
    setze(ev.A, ev.D, f); Ap.eroeffnung[ev.D] = Ap.schluss[ev.D] / f;                /* Sprung im Handel des Tages D */
    if (ev === evDoppel) { var Yp = reihen[SYM(Y)]; setze(Y, ev.D, f); Yp.eroeffnung[ev.D] = Yp.schluss[ev.D] / f; }
    for (var m = 0; m < JE; m++) {
      var B = ev.gruppe * JE + m; if (B === ev.A || (ev === evDoppel && B === Y)) continue;
      var Bp = reihen[SYM(B)], e = ev.D + 1;
      Bp.eroeffnung[e] = Bp.schluss[e] * (ev.r === 0 ? (1 - ev.delta / 100) : (1 + ev.delta / 100));   /* Kante nur zwischen Eroeffnung und Schluss von e */
    }
  });
  reihen[SYM(Zab)].schluss.fill(NaN, evAbg.D + 1 + 4); reihen[SYM(Zab)].ende_grund = 'uebernahme';
  h.kunstPanel(path.join(TMP, 'panel-k'), TAGE, reihen, nT - 1);
  var cikArr = new Int32Array(NS + 1); for (var s3 = 0; s3 < NS; s3++) cikArr[SYM(s3)] = 1000 + s3;
  cikArr[SYM(47)] = cikArr[SYM(46)];
  var firmen = new Map();
  for (var s4 = 0; s4 < NS; s4++) if (!firmen.has(cikArr[SYM(s4)])) firmen.set(cikArr[SYM(s4)], { sic: String(2000 + 100 * Math.floor(s4 / JE) + 1), sic3: String(200 + 10 * Math.floor(s4 / JE)), annahmen: [] });
  function annahme(t, uhrUtc) { return TAGE[t] + 'T' + uhrUtc + '.000Z'; }
  ereignis.forEach(function (ev) { firmen.get(cikArr[SYM(ev.A)]).annahmen.push(annahme(ev.D, '18:00:00')); });      /* 13/14 Uhr ET: im Handel von D */
  firmen.get(cikArr[SYM(X)]).annahmen.push(annahme(evAus.D + 1, '18:00:00'));
  var quellen = { cik: { cik: cikArr, zaehler: {} }, firmen: { firmen: firmen, zaehler: {} } };
  var T = LS.oeffne({ aus: path.join(TMP, 'panel-k'), kennung: 'kunst/nachzuegler', schluss: null });
  var C = MS.vorbereiten(T, quellen);
  var dE = function (D) { return C.Z.aTag[D]; };

  teil('Z5 Ertrag');
  (function () {
    var B = SYM(ereignis[2].gruppe * JE + ((ereignis[2].A % JE) + 1) % JE), e = ereignis[2].D + 1;
    var re = T.zeileVon(B, e), rx = T.zeileVon(B, e + 5);
    ok(nah(MK.ertrag(T, C.M, re, rx), 100 * (100 / T.g.bEroeffnung[re] - 1), 1e-9), 'Ertrag = Schluss(e+h) / Eroeffnung(e) - 1');
    ok(nah(MK.ertrag(T, C.M, re, re), T.g.renditeOC[re], 1e-6), 'h = 0: Eroeffnung -> Schluss desselben Tages');
  })();

  teil('Z7 Ausloeser');
  (function () {
    var ev = ereignis[4], zA = T.zeileVon(SYM(ev.A), ev.D);
    var bA = ev.r === 0 ? MK.B_E1AUF | MK.B_E2AUF | MK.B_E3AUF : MK.B_E1AB | MK.B_E2AB | MK.B_E3AB;
    ok((C.bits[zA] & bA) === bA && (C.bits[zA] & MK.B_202), 'Sprung von A: E1, E2, E3 in Ereignisrichtung, 2.02 markiert');
    var z1 = T.zeileVon(SYM(ev.A), ev.D + 1);
    ok((C.bits[z1] & 63) === 0, 'am Tag danach (Schluss = Maximum, nicht echt groesser): kein Ausloeser');
    /* Kunstreihe: steigt taeglich -> jeder Tag ist ein Ausbruch, wenn D NICHT im Vergleichsfenster liegt */
    var Tg = { g: { n: 30, bSchluss: new Float64Array(30).map(function (x, i) { return 10 + i; }) }, nSym: 1, symStart: Int32Array.from([0, 30]), symZeilen: Int32Array.from({ length: 30 }, function (x, i) { return i; }) };
    var bt = new Uint8Array(30); MK.rohAusloeser(Tg, bt);
    ok(bt[19] === 0 && bt[20] === MK.B_E1AUF && bt[29] === MK.B_E1AUF, 'E1 ab der 21. Zeile; der Tag selbst steht nicht im Fenster');
    Tg.g.bSchluss[25] = Tg.g.bSchluss[24]; bt.fill(0); MK.rohAusloeser(Tg, bt);
    ok(bt[25] === 0, 'Schluss gleich dem Maximum ist kein Ausbruch (echt groesser)');
  })();

  teil('Z7 E3 Schwelle');
  (function () {
    var n = 80, sch = new Float64Array(n), spy = new Float64Array(n).fill(100);
    sch[0] = 100; for (var i = 1; i < n; i++) sch[i] = sch[i - 1] * (i % 2 ? 1.01 : 1 / 1.01);
    var sd = (function () { var r = []; for (var i2 = 10; i2 < 70; i2++) r.push(100 * (sch[i2] / sch[i2 - 1] - 1)); var m = r.reduce(function (a, b) { return a + b; }, 0) / r.length; return Math.sqrt(r.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (r.length - 1)); })();
    var s1 = Float64Array.from(sch), s2 = Float64Array.from(sch), s3 = Float64Array.from(sch);
    s1[70] = s1[69] * (1 + 2.2 * sd / 100); s2[70] = s2[69] * (1 + 1.8 * sd / 100); s3[70] = s3[69] * (1 + 2.2 * sd / 100);
    var spy3 = Float64Array.from(spy); spy3[70] = 100 * (1 + 0.5 * sd / 100); for (var i3 = 71; i3 < n; i3++) spy3[i3] = spy3[70];
    var tg = h.kunstKalender('2016-01-04', '2016-06-30').slice(0, n);
    [[s1, spy, true], [s2, spy, false], [s3, spy3, false]].forEach(function (fall, fi) {
      var o = path.join(TMP, 'e3-' + fi);
      h.kunstPanel(o, tg, [{ name: 'SPY', schluss: fall[1], referenz: true, klasse: 3 }, { name: 'A', schluss: fall[0], klasse: 2 }]);
      var T3 = LS.oeffne({ aus: o, kennung: 'kunst/nachzuegler', schluss: null }), M3 = MK.kumuliert(T3), b3 = new Uint8Array(T3.g.n);
      var fm = new Map([[7, { sic3: '283', annahmen: [tg[70] + 'T15:00:00.000Z'] }]]);
      var z3 = MK.e3(T3, M3, b3, Int32Array.from([0, 7]), fm, null);
      var hat = (b3[T3.zeileVon(1, 70)] & MK.B_E3AUF) !== 0;
      ok(hat === fall[2], ['2,2 sd -> Ereignis', '1,8 sd -> keines', '2,2 sd, aber SPY +0,5 sd -> 1,7 sd -> keines'][fi] + ' ' + JSON.stringify(z3));
    });
  })();

  teil('Z8 Sperrfrist');
  (function () {
    var E = MS.ereignisse(T, C), e1 = E.ev[0];
    ok(e1.D.length > 50, 'E1 auf: ' + e1.D.length + ' Ereignisse');
    ok(E.ev[evDoppel.r].D.filter(function (d) { return d === evDoppel.D; }).length === 2, 'zwei A am selben Tag: zwei Ereignisse');
    /* Sperrfrist an einer Kunstreihe mit taeglichem Ausbruch */
    var n = 400, sch = new Float64Array(n).map(function (x, i) { return 100 + i; });
    var tg = h.kunstKalender('2016-01-04', '2017-12-31').slice(0, n), o = path.join(TMP, 'sperr');
    h.kunstPanel(o, tg, [{ name: 'SPY', schluss: new Float64Array(n).fill(100), referenz: true, klasse: 3 }, { name: 'A', schluss: sch, klasse: 2 }]);
    var T4 = LS.oeffne({ aus: o, kennung: 'kunst/nachzuegler', schluss: null });
    var C4 = MS.vorbereiten(T4, { cik: { cik: new Int32Array(2), zaehler: {} }, firmen: { firmen: new Map(), zaehler: {} } });
    var E4 = MS.ereignisse(T4, C4), d = E4.ev[0].D;
    var abst = d.slice(1).map(function (x, i) { return x - d[i]; });
    ok(d.length > 3 && abst.every(function (x) { return x === KN.SPERRFRIST; }), 'taeglicher Ausbruch -> genau alle 20 Handelstage ein Ereignis (' + d.length + ')');
    ok(d[0] === 250, 'erstes Ereignis am ersten Tag mit 250 Vortagen (Zeile ' + d[0] + ')');
  })();

  teil('Z9 V2');
  (function () {
    var n = 330, tg = h.kunstKalender('2016-01-04', '2017-12-31').slice(0, n), R = h.zufall(77);
    function nrm() { var u = 0, v = 0; while (u === 0) u = R(); while (v === 0) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
    var mkt = [], fak = [];
    for (var t = 0; t < n; t++) { mkt.push(nrm()); fak.push(nrm()); }
    var gew = [1, 0.9, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.95];     /* R0 = A, R1..R8 Partner, R3 mit Luecke, R9 = gleiche CIK wie R0 */
    var rr = [{ name: 'SPY', schluss: null, referenz: true, klasse: 3 }];
    var sp = new Float64Array(n); sp[0] = 100; for (var t2 = 1; t2 < n; t2++) sp[t2] = sp[t2 - 1] * (1 + mkt[t2] / 100);
    rr[0].schluss = sp;
    for (var s5 = 0; s5 < 10; s5++) {
      var w = gew[s5], p = new Float64Array(n); p[0] = 50;
      for (var t3 = 1; t3 < n; t3++) p[t3] = p[t3 - 1] * (1 + (1.3 * mkt[t3] + w * fak[t3] + Math.sqrt(1 - Math.min(0.99, w * w) + 0.01) * nrm()) / 100);
      if (s5 === 3) for (var t4 = 100; t4 < 160; t4++) p[t4] = NaN;           /* Reihe 4: Luecke -> 190 gueltige Tage im Fenster */
      rr.push({ name: 'R' + s5, schluss: p, klasse: 1 });
    }
    var o = path.join(TMP, 'v2'); h.kunstPanel(o, tg, rr);
    var T5 = LS.oeffne({ aus: o, kennung: 'kunst/nachzuegler', schluss: null });
    var ck = Int32Array.from([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 1]);            /* R9 hat die CIK von R0 */
    var c = 300, K5 = VK.v2(T5, c, ck, null), top = Array.from(K5.top.slice(1 * 5, 1 * 5 + 5));
    ok(top.indexOf(10) === -1, 'gleiche CIK ist nie Partner (Z3)');
    ok(top.indexOf(4) === -1, 'Reihe mit < 200 gueltigen Tagen ist kein Partner');
    ok(top[0] === 2 && top[1] === 3, 'die staerksten Partner zuerst: ' + top.join(','));
    /* Pearson nachgerechnet fuer ein Paar */
    function resid(sym) { var x = [], ys = []; for (var t5 = c - 249; t5 <= c; t5++) { var z = T5.zeileVon(sym, t5), zs = T5.zeileVon(0, t5); if (z < 0 || zs < 0) { x.push(NaN); ys.push(NaN); continue; } x.push(T5.g.rendite[z]); ys.push(T5.g.rendite[zs]); } return { x: x, s: ys }; }
    function beta(o2) { var a = [], b = []; o2.x.forEach(function (v, i) { if (v === v && o2.s[i] === o2.s[i]) { a.push(v); b.push(o2.s[i]); } }); var ma = a.reduce(function (p2, q) { return p2 + q; }, 0) / a.length, mb = b.reduce(function (p2, q) { return p2 + q; }, 0) / b.length; var sab = 0, sbb = 0; a.forEach(function (v, i) { sab += (v - ma) * (b[i] - mb); sbb += (b[i] - mb) * (b[i] - mb); }); return sab / sbb; }
    var ra = resid(1), rb = resid(3), ba = beta(ra), bb = beta(rb), xa = [], xb = [];
    ra.x.forEach(function (v, i) { if (v === v && rb.x[i] === rb.x[i] && ra.s[i] === ra.s[i]) { xa.push(v - ba * ra.s[i]); xb.push(rb.x[i] - bb * rb.s[i]); } });
    var mA = xa.reduce(function (p3, q) { return p3 + q; }, 0) / xa.length, mB = xb.reduce(function (p3, q) { return p3 + q; }, 0) / xb.length, sab2 = 0, saa = 0, sbb2 = 0;
    xa.forEach(function (v, i) { sab2 += (v - mA) * (xb[i] - mB); saa += (v - mA) * (v - mA); sbb2 += (xb[i] - mB) * (xb[i] - mB); });
    ok(nah(K5.korr[1 * 5 + 1], sab2 / Math.sqrt(saa * sbb2), 1e-9), 'Korrelation der Residuen = Pearson von Hand (' + K5.korr[1 * 5 + 1].toFixed(4) + ')');
    /* kein Blick nach vorn: Zeilen nach c veraendern aendert nichts */
    var rd = Float32Array.from(T5.g.rendite); for (var z6 = 0; z6 < T5.g.n; z6++) if (T5.g.tag[z6] > c) rd[z6] = 50;
    var T6 = Object.assign({}, T5, { g: Object.assign({}, T5.g, { rendite: rd }) });
    ok(Array.from(VK.v2(T6, c, ck, null).top).join() === Array.from(K5.top).join(), 'Daten nach dem Stichtag aendern die Liste nicht');
    ok(VK.stichtag(tg, tg.indexOf('2016-03-15')) === tg.indexOf('2016-02-29'), 'Stichtag = letzter Handelstag des Vormonats');
  })();

  /* ======================= Messung am Kunstpanel: bekannte Antwort ======================= */
  teil('Messung bekannte Antwort');
  var zr = MS.zeitraum(T, 'entdeckung');
  ok(TAGE[zr.exitMax] === '2022-12-30', 'Entdeckung endet mit dem Ausstieg 30.12.2022');
  ok(T.gesperrt && TAGE[T.maxTag] === '2022-12-30', 'Tafel gesperrt bis 30.12.2022');
  var E = MS.ereignisse(T, C), Ev = MS.imZeitraumFiltern(T, C, E, zr), Pa = MS.placeboA(T, C, Ev, zr), Pc = MS.placeboC(T, C, Ev, zr);
  var Mx = MS.messe(T, C, { echt: Ev, plA: Pa.ev, plC: Pc.ev }, zr);
  var Z = Mx.zellen;
  function zelle(k, e) { return { n: Z.n[k * Z.nTage + e], sb: Z.sb[k * Z.nTage + e], sk: Z.sk[k * Z.nTage + e], sl: Z.sl[k * Z.nTage + e], skk: Z.skk[k * Z.nTage + e] }; }
  function kantePp(ev) { return ev.r === 0 ? 100 * (1 / (1 - ev.delta / 100) - 1) : 100 * (1 / (1 + ev.delta / 100) - 1); }
  var falsch = 0, gesehen = 0, falschN = 0, falschK = 0, falschL = 0, h2falsch = 0, h2gesehen = 0;
  ereignis.forEach(function (ev) {
    var e = dE(ev.D); if (e < 0 || e + 5 > zr.exitMax || ev === evAus || ev === evAbg || (ev.A === Zab && ev.D > evAbg.D)) return;
    var dir = ev.r === 0 ? 1 : -1, soll = dir * kantePp(ev);
    for (var a = 0; a < (ev === evDoppel ? 2 : 3); a++) for (var hi = 0; hi < 3; hi++) for (var c = 0; c < 4; c++) {
      var z = zelle(KN.konfIndex(a, ev.r, 0, 0, hi, c), e);
      var mitglieder = 0; for (var m = 0; m < JE; m++) { var B = ev.gruppe * JE + m; if (B !== ev.A && !(ev === evDoppel && B === Y) && !(ev.A === 46 && B === 47) && !(ev.A === 47 && B === 46) && !(B === Zab && ev.D > evAbg.D) && B % 4 === c) mitglieder++; }
      if (z.n !== mitglieder) falschN++;
      if (!z.n) continue;
      gesehen++;
      if (!nah(z.sb / z.n, soll, 1e-6)) falsch++;
      if (!nah(z.sk / z.n, KN.HUERDE[c], 1e-12) || !nah(z.skk / z.n, KN.HUERDE_KASSA[c], 1e-12)) falschK++;
      if (!nah(z.sl / z.n, dir < 0 ? (KN.HALTEDAUERN[hi] + 1) / 252 : 0, 1e-12)) falschL++;
      var cA = ev.A % 4, z2 = zelle(KN.konfIndex(a, ev.r, 0, 1, hi, c), e);
      if (ev === evDoppel) continue;
      if (cA === 2 || cA === 3) { h2gesehen++; if (!(z2.n === z.n && nah(z2.sb / z2.n, soll, 1e-6) && nah(z2.sk / z2.n, KN.HUERDE[c] + KN.HUERDE[cA], 1e-12) && nah(z2.sl / z2.n, (KN.HALTEDAUERN[hi] + 1) / 252, 1e-12))) h2falsch++; }
      else if (z2.n) h2falsch++;
    }
  });
  ok(gesehen > 300 && falsch === 0, 'H1: jede Beobachtung = gepflanzte Kante in Ereignisrichtung, Topf 0 (' + gesehen + ' Zellen)');
  ok(falschN === 0, 'B einmal je Tag; ohne A, ohne zweites A am selben Tag, ohne Gattung gleicher CIK');
  ok(falschK === 0, 'Huerde nach Nachtrag 1 je Klasse von B, Kassa als Vergleich');
  ok(falschL === 0, 'Leihe (h+1)/252 nur auf das Leerverkaufsbein (H1 ab)');
  ok(h2gesehen > 50 && h2falsch === 0, 'H2: nur A der Klassen 250-1000 / ab 1000; Kosten K(B) + K(A); Leihe immer');
  ok(Mx.zaehler.beobachtungen[0] > 0 && Mx.zaehler.beobachtungen[1] > 0 && Mx.zaehler.beobachtungen[2] > 0, 'echte und Placebo-Beobachtungen vorhanden');
  (function () {
    var e = dE(evAus.D), c = X % 4, k1 = KN.konfIndex(0, evAus.r, 0, 0, 0, c);
    ok(Z.ex1n[k1] >= 1, 'eigene 2.02 am Einstiegstag -> ausgeschlossen und gezaehlt (Z10 i)');
    var z = zelle(k1, e), soll = 0; for (var m = 0; m < JE; m++) { var B = evAus.gruppe * JE + m; if (B !== evAus.A && B !== X && B % 4 === c) soll++; }
    ok(z.n === soll, 'X fehlt in der Zelle seines Tages');
    var k2 = KN.konfIndex(0, evDoppel.r, 0, 0, 0, Y % 4);
    ok(Z.ex2n[k2] >= 1, 'eigener Ausloeser derselben Art und Richtung am Ereignistag -> ausgeschlossen (Z10 ii)');
    var cZ = Zab % 4, k5 = KN.konfIndex(0, evAbg.r, 0, 0, 2, cZ), k0 = KN.konfIndex(0, evAbg.r, 0, 0, 0, cZ);
    ok(Z.abn[k5 * 3 + 0] >= 1 && zelle(k5, dE(evAbg.D)).n < zelle(k0, dE(evAbg.D)).n, 'Abgang (Uebernahme) innerhalb von +5: eigene Zeile, nicht im Hauptergebnis');
  })();
  (function () {
    var bF = 0, bN = 0, cF = 0, cN = 0, lF = 0, lN = 0;
    for (var k = 0; k < 384; k++) {
      var K0 = KN.konfAus(k); if (K0.v !== 0 || K0.hi > 2) continue;
      for (var e = 0; e < Z.nTage; e++) {
        var i = k * Z.nTage + e;
        if (Z.bn[i]) { bN++; if (!nah(Z.bsb[i] / Z.bn[i], 0, 1e-9)) bF++; }
        if (Z.cn[i]) { cN++; if (!nah(Z.csb[i] / Z.cn[i], 0, 1e-9)) cF++; }
        if (Z.ln[i] && K0.hi >= 1) { lN++; if (!nah(Z.lsb[i] / Z.ln[i], 0, 1e-9)) lF++; }
      }
    }
    ok(bN > 100 && bF === 0, 'Placebo (b): zufaelliges unverknuepftes B derselben Klasse -> Brutto 0 (' + bN + ' Zellen)');
    ok(cN > 100 && cF === 0, 'Placebo (c): Ereignis 20 Tage spaeter -> Brutto 0 (' + cN + ' Zellen)');
    ok(lN > 100 && lF === 0, 'spaeter Einstieg (e+1): die Kante sitzt im ersten Tag -> 0 (' + lN + ' Zellen)');
  })();

  teil('Auswertung Tore');
  var A = AW.entdeckung(Z, zr, T);
  (function () {
    var x = A.konf[KN.konfIndex(0, 0, 0, 0, 0, 0)], kd = 0, ab = TAGE.findIndex(function (t) { return t >= KN.PRUEFUNG_AB; });
    for (var i = 0; i < TAGE.length; i++) if (TAGE[i] >= KN.T_E_VON && i <= zr.exitMax) kd++;
    ok(x.TE === kd && x.TB === nT - 1 - ab + 1, 'T_E und T_B aus dem Kalender (Z16): ' + x.TE + ' / ' + x.TB);
    ok(nah(x.seBproj, x.st.netto.se * Math.sqrt(x.TE / x.TB), 1e-12) && nah(x.tor1Schwelle, 4 * 2 * x.seBproj, 1e-12), 'MDE_B = 2 se_E sqrt(T_E/T_B); Tor 1 = 4 MDE_B');
    ok(x.tor1 === (x.st.netto.mittel > 0 && x.st.netto.mittel >= x.tor1Schwelle), 'Tor-1-Entscheid folgt der Formel');
    ok(nah(x.st.brutto.mittel - x.st.netto.mittel, KN.HUERDE[0], 1e-9), 'netto = brutto - Huerde (aufwaerts, keine Leihe)');
    var y = A.konf[KN.konfIndex(0, 1, 0, 0, 2, 1)];
    ok(nah(y.st.leihe0.mittel - y.st.netto.mittel, 0.01 * 6 / 252, 1e-9) && nah(y.st.netto.mittel - y.st.leihe3.mittel, 0.02 * 6 / 252, 1e-9), 'Leihe 0 % / 1 % / 3 % als Zeilen');
    ok(x.st.plA.n > 0 && Math.abs(x.st.plA.mittel) < 0.5 * x.st.brutto.mittel, 'Placebo (a) zieht Tage aus der Ereignisverteilung: klein gegen die Kante');
    ok(A.zahlen.konfigurationen === 384, '384 Konfigurationen ausgewertet');
  })();
  (function () {
    /* Kunstzellen: eine Konfiguration mit bekannter Tagesreihe */
    var Zk = MS.Zellen(TAGE.length), k = KN.konfIndex(1, 0, 1, 0, 0, 2), R = h.zufall(5), nT2 = Zk.nTage;
    for (var e = 400; e < 1400; e++) {
      var i = k * nT2 + e, x = 0.6 + (R() - 0.5) * 2;
      Zk.n[i] = 1; Zk.sb[i] = x; Zk.sk[i] = KN.HUERDE[2];
      Zk.bn[i] = 1; Zk.bsb[i] = 0.03 + (R() - 0.5) * 0.2;            /* Placebo (b) mit Versatz 0,03 >= 0,074/4 */
      Zk.an[i] = 1; Zk.asb[i] = 0.01 + (R() - 0.5) * 0.2;            /* Placebo (a) mit Versatz 0,01 < 0,074/4 */
    }
    var Ak = AW.entdeckung(Zk, zr, T), xk = Ak.konf[k];
    ok(xk.st.plB.t >= 2 && xk.verstoss.plB, 'Placebo-Verstoss: |t| >= 2 und Groesse >= Huerde/4 (' + xk.st.plB.mittel.toFixed(3) + ', t ' + xk.st.plB.t.toFixed(1) + ')');
    ok(xk.st.plA.t >= 2 && !xk.verstoss.plA, 'kein Verstoss bei |t| >= 2, aber Groesse < Huerde/4 (' + xk.st.plA.mittel.toFixed(3) + ', t ' + xk.st.plA.t.toFixed(1) + ')');
    ok(xk.st.netto.t > 10 && xk.tor1 && !xk.kandidat && xk.gruende.join() === 'Placebo B', 'Tor 1 bestanden, Kandidat faellt nur am Placebo: ' + xk.gruende.join() + ' t ' + xk.st.netto.t);
    for (var e2 = 400; e2 < 1400; e2++) Zk.bsb[k * nT2 + e2] -= 0.03;
    var xk2 = AW.entdeckung(Zk, zr, T).konf[k];
    ok(xk2.kandidat, 'ohne den Versatz: Kandidat');
  })();

  teil('Z19 Holm');
  ok(nah(AW.quantil(1 - 0.05 / 384), 3.65, 0.01) && nah(AW.phi(1.959964), 0.975, 1e-6), 'z(0,05/384) = 3,65; phi(1,96) = 0,975');
  (function () {
    var H0 = AW.holm([0.0001, 0.00013, 0.01, 0.000129], 384, 0.05);
    ok(H0.bestanden.join() === 'true,true,false,true' && nah(H0.schwelle[0], 0.05 / 384, 1e-15) && nah(H0.schwelle[1], 0.05 / 382, 1e-15), 'Holm ueber m = 384: k-te gegen 0,05/(384-k+1), Abbruch beim ersten Verfehlen');
    var H1 = AW.holm([0.0002, 0.00001], 384, 0.05);
    ok(H1.bestanden.join() === 'false,true', 'zweite Schwelle 0,05/383 = 0,000131 verfehlt');
  })();

  /* ======================= Pruefzeit nur mit Siegel: der echte Lauf am Kunstpanel ======================= */
  teil('Sperre im Lauf');
  (function () {
    var aus = path.join(TMP, 'lauf'); fs.mkdirSync(aus, { recursive: true });
    var oeff = { aus: path.join(TMP, 'panel-k'), kennung: 'kunst/nachzuegler', schluss: null };
    var still = process.stdout.write; process.stdout.write = function () { return true; };
    try {
      LA.hauptlauf('entdeckung', { ausgabe: aus, oeffne: oeff, quellen: quellen, ohneSpeicher: true });
      var kand = JSON.parse(fs.readFileSync(path.join(aus, 'KANDIDATEN.json'), 'utf8'));
      process.stdout.write = still;
      ok(kand.konfigurationen === 384 && Array.isArray(kand.kandidaten) && /^[0-9a-f]{64}$/.test(kand.ergebnisEntdeckungSha256), 'Entdeckung schreibt KANDIDATEN.json mit Pruefsumme (' + kand.kandidaten.length + ' Kandidaten)');
      /* eine Konfiguration von Hand siegeln, damit die Pruefung etwas zu tun hat */
      kand.kandidaten = [{ k: KN.konfIndex(0, 0, 0, 0, 0, 2), name: KN.konfAus(KN.konfIndex(0, 0, 0, 0, 0, 2)).name }];
      var sd = path.join(h.REPO_T, 'studie', 'KANDIDATEN.json');
      fs.writeFileSync(sd, JSON.stringify(kand));
      var sieg = { repo: h.REPO_T, pfad: 'studie/KANDIDATEN.json' };
      process.stdout.write = function () { return true; };
      var fehl = null; try { LA.hauptlauf('pruefung', { ausgabe: aus, oeffne: Object.assign({ siegel: sieg }, oeff), quellen: quellen, ohneSpeicher: true, siegelDatei: sd }); } catch (e) { fehl = e; }
      process.stdout.write = still;
      ok(fehl && fehl.sperre && !fs.existsSync(path.join(aus, 'ergebnis-pruefung.json')), 'Pruefung mit ungesiegelter Liste -> Abbruch, nichts geschrieben');
      h.gitT(['commit', '-q', '-am', 'Siegel Kunst']);
      process.stdout.write = function () { return true; };
      LA.hauptlauf('pruefung', { ausgabe: aus, oeffne: Object.assign({ siegel: sieg }, oeff), quellen: quellen, ohneSpeicher: true, siegelDatei: sd });
      process.stdout.write = still;
      var P = JSON.parse(fs.readFileSync(path.join(aus, 'ergebnis-pruefung.json'), 'utf8'));
      var z = P.pruefung.zeilen[0];
      ok(P.gesperrt === false && P.zeitraum.einstiegAb >= '2023-01-01' && z && z.st.netto.n > 5, 'gueltiges Siegel -> Pruefzeit ab 2023 gemessen (' + (z ? z.st.netto.n : 0) + ' Tage)');
      ok(z && nah(z.st.brutto.mittel, z.st.netto.mittel + KN.HUERDE[2], 1e-9) && z.holmSchwelle === 0.05 / 384, 'Pruefung: netto, Holm-Schwelle 0,05/384 fuer den ersten');
      fs.writeFileSync(sd, JSON.stringify(kand) + ' ');
      process.stdout.write = function () { return true; };
      fehl = null; try { LA.hauptlauf('pruefung', { ausgabe: aus, oeffne: Object.assign({ siegel: sieg }, oeff), quellen: quellen, ohneSpeicher: true, siegelDatei: sd }); } catch (e) { fehl = e; }
      process.stdout.write = still;
      ok(fehl && fehl.sperre, 'Pruefung mit veraendertem Siegel -> Abbruch');
    } finally { process.stdout.write = still; }
  })();
}

module.exports = { lauf: lauf };
