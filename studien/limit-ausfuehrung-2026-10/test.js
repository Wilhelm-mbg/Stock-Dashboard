'use strict';
/* TEST - Limit statt Marktorder (REGEL.md, Siegel 9cb14c7).
 *
 *   node test.js        alle Pruefungen; Rueckgabewert 1, wenn eine FEHLT
 *
 * Jede Zeile ist 'OK ...' oder 'FEHLT ...'. Kunstdaten mit eigener Saat; echte Daten nur lesend (eine Datei,
 * AAPL/2024, fuer die Gleichheit der Marktorder-Kontrolle mit messen.messeDatei - Zaehlungen, keine Rendite).
 * Mini-Archiv fuer die Fortsetzbarkeit im Temp-Ordner (MD_TEST_KRATZ oder os.tmpdir()/limit-ausfuehrung-test).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var cp = require('child_process');
var LA = require('./lauf.js');
var AW = require('./auswerten.js');
var K = require(path.join(LA.MIN_ORDNER, 'konfig.js'));
var L = require(path.join(LA.MIN_ORDNER, 'lesen.js'));
var M = require(path.join(LA.MIN_ORDNER, 'messen.js'));

var KRATZ = process.env.MD_TEST_KRATZ || path.join(os.tmpdir(), 'limit-ausfuehrung-test');
var MIN = 60000;

/* ---------- Buchfuehrung ---------- */
var ERG = { ok: 0, fehlt: 0 };
function ok(txt) { ERG.ok++; console.log('OK    ' + txt); }
function fehlt(txt) { ERG.fehlt++; console.log('FEHLT ' + txt); }
function pruefe(bed, txt) { if (bed) ok(txt); else fehlt(txt); return !!bed; }
function abschnitt(nr, name, fn) {
  console.log('\n== ' + nr + '. ' + name);
  var t0 = Date.now();
  try { fn(); } catch (e) { fehlt(nr + ' Ausnahme: ' + (e && e.stack || e)); }
  console.log('   (' + ((Date.now() - t0) / 1000).toFixed(1) + ' s)');
}
function f4(x) { return (x === x && x != null) ? (+x).toFixed(4) : String(x); }
function f2(x) { return (x === x && x != null) ? (+x).toFixed(2) : String(x); }
function mittel(a) { var s = 0; for (var i = 0; i < a.length; i++) s += a[i]; return a.length ? s / a.length : NaN; }
function sd(a) { if (a.length < 2) return NaN; var m = mittel(a), s = 0; for (var i = 0; i < a.length; i++) s += (a[i] - m) * (a[i] - m); return Math.sqrt(s / (a.length - 1)); }
function tWert(a) { var m = mittel(a), s = sd(a); return s > 0 ? m / (s / Math.sqrt(a.length)) : (m === 0 ? 0 : Infinity); }

/* ---------- Eigener Zufall und eigene Saat (unabhaengig von messen.js nachgebaut) ---------- */
function rngNeu(saat) { var a = saat >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function fnvNaiv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function gauss(rng) { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

/* ---------- ET-Zeit (Intl) ---------- */
var ET_DATUM = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
var ET_STUNDE = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false });
function etDatum(ms) { return ET_DATUM.format(new Date(ms)); }
function auf0930(tag) {
  var p = tag.split('-').map(Number), mittag = Date.UTC(p[0], p[1] - 1, p[2], 12, 0);
  var h = (+ET_STUNDE.formatToParts(new Date(mittag)).filter(function (x) { return x.type === 'hour'; })[0].value) % 24;
  return Date.UTC(p[0], p[1] - 1, p[2], 9 + (12 - h), 30);
}
function sollMinVon(tag) {
  var e = K.kalender().close[tag];
  var c = (e && e.close ? e.close : '16:00').split(':').map(Number), o = (e && e.open ? e.open : '09:30').split(':').map(Number);
  return (c[0] * 60 + c[1]) - (o[0] * 60 + o[1]);
}
function r4(x) { return Math.round(x * 10000) / 10000; }
function kopiere(k) { return k.map(function (x) { return x.slice(); }); }

/* ---------- Kunst-Reihe: Irrfahrt plus Mikrorauschen auf Eroeffnung und Schluss (sigmaN = 0: reines Martingal) ---------- */
function kunstReihe(tage, saat, o) {
  o = o || {};
  var rng = rngNeu(saat), P = o.start || 100, aus = [];
  var sRw = o.sigmaRw == null ? 0.0002 : o.sigmaRw, sN = o.sigmaN == null ? 0.0012 : o.sigmaN, vol = o.volMin == null ? 2564 : o.volMin;
  tage.forEach(function (tag) {
    var t0 = auf0930(tag), n = sollMinVon(tag);
    for (var m = 0; m < n; m++) {
      var eroeffnung = P * (1 + sN * gauss(rng));
      P = P * Math.exp(sRw * gauss(rng));
      var schluss = P * (1 + sN * gauss(rng));
      var hoch = Math.max(eroeffnung, schluss) * (1 + Math.abs(sN * gauss(rng)) / 2);
      var tief = Math.min(eroeffnung, schluss) * (1 - Math.abs(sN * gauss(rng)) / 2);
      aus.push([t0 + m * MIN, r4(schluss), Math.round(vol * (0.5 + rng())), r4(hoch), r4(tief), r4(eroeffnung)]);
    }
  });
  return aus;
}

/* ---------- Stellvertreter: beide Messgeraete auf derselben Eingabe ---------- */
var DETS = K.detektoren();
function det(key) { return DETS.filter(function (d) { return d.key === key; })[0]; }
function detIdx(key) { return K.DETEKTOR_KEYS.indexOf(key); }
function eingabe(kerzen, reihe) {
  var R = { reihe: reihe || 'KUNST', ordner: reihe || 'KUNST', lebend: 1, jahre: [2024], gruppe: 'kunst', art: 'CS', schnittMs: null, abMs: null };
  var g = { ok: true, kerzen: kerzen, quelle: 'roh', angewandt: new Set(), bytes: 0 };
  var massnahmen = []; massnahmen.ende = null;
  return { R: R, g: g, warm: { kerzen1m: [], tagesUmsatz: [] }, massnahmen: massnahmen };
}
function messeLimit(kerzen, dets, zrSel, reihe, ein) {
  var e = ein || eingabe(kerzen, reihe), zs = LA.zrAuswahl(zrSel);
  var ctx = { kal: K.kalender(), dets: dets, zrSel: zs, nZs: zs.length };
  var delta = new LA.Delta();
  var stat = LA.messeDatei(e.R, e.g, e.warm, e.massnahmen, delta, ctx, Date.now() + 1800000);
  return { stat: stat, delta: delta, Z: stat.zaehler, zrSel: zs, eintraege: dekodiereLimit(delta, zs.length) };
}
function messeMinute(kerzen, dets, zrSel, reihe, ein) {
  var e = ein || eingabe(kerzen, reihe);
  var ctx = { kal: K.kalender(), dets: dets, F: { zaehler: M.leererZaehler() }, zeitrahmen: zrSel || null };
  var delta = new M.Delta();
  var stat = M.messeDatei(e.R, e.g, e.warm, e.massnahmen, delta, ctx, Date.now() + 1800000);
  return { stat: stat, delta: delta };
}
function dekodiereLimit(delta, nZs) {
  var nT = K.kalender().tage.length, aus = [];
  delta.zellen.forEach(function (v, idx) { var e = LA.dekodiere(idx, nT, nZs); e.n = v[0]; e.s = v[1]; e.s2 = v[2]; aus.push(e); });
  return aus;
}
/** Minuten-Layout: Zellenindex -> Koordinaten (Umkehrung von K.zelle). */
function dekodiereMinute(idx) {
  var nTage = K.kalender().tage.length, r = idx;
  var lebend = r % 2; r = (r - lebend) / 2;
  var klasse = r % K.N_K; r = (r - klasse) / K.N_K;
  var tag = r % nTage; r = (r - tag) / nTage;
  var h = r % K.N_H; r = (r - h) / K.N_H;
  var dirIdx = r % 2; var reihe = (r - dirIdx) / 2;
  var art = Math.floor(reihe / K.N_KAND), kand = reihe % K.N_KAND;
  return { art: art, det: Math.floor(kand / K.N_ZR), zr: kand % K.N_ZR, dirIdx: dirIdx, h: h, tag: tag, klasse: klasse, lebend: lebend };
}
/** Vergleicht Signal-Markt (Limit-Lauf) mit den Kandidatenzellen (Minuten-Lauf): Schluessel det|zr|dir|h|tag|klasse|lebend. */
function vergleicheMarkt(lim, min) {
  var a = new Map(), b = new Map();
  lim.eintraege.forEach(function (e) { if (e.art !== LA.A.sigMarkt) return; a.set([e.det, lim.zrSel[e.zs], e.dirIdx, e.h, e.tag, e.klasse, e.lebend].join('|'), [e.n, e.s, e.s2]); });
  min.delta.zellen.forEach(function (v, idx) { var e = dekodiereMinute(idx); if (e.art !== 0) return; b.set([e.det, K.ZEITRAHMEN[e.zr].key, e.dirIdx, e.h, e.tag, e.klasse, e.lebend].join('|'), [v[0], v[1], v[2]]); });
  var abw = 0, beob = 0;
  b.forEach(function (v, k) { var w = a.get(k); beob += v[0]; if (!w || w[0] !== v[0] || w[1] !== v[1] || w[2] !== v[2]) abw++; });
  a.forEach(function (v, k) { if (!b.has(k)) abw++; });
  return { zellenA: a.size, zellenB: b.size, abw: abw, beob: beob };
}
/** Summe je (art, det, zr, dir, h, tag) aus den Limit-Zellen. */
function jeTag(eintraege, art, dI, zs, dirIdx, h) {
  var je = {};
  eintraege.forEach(function (e) {
    if (e.art !== art || e.det !== dI || e.zs !== zs || e.h !== h || (dirIdx != null && e.dirIdx !== dirIdx)) return;
    var z = je[e.tag] || (je[e.tag] = { n: 0, s: 0 }); z.n += e.n; z.s += e.s;
  });
  return je;
}
function dReihe(eintraege, dI, zs, dirIdx, h, artA, artB) {
  var a = jeTag(eintraege, artA, dI, zs, dirIdx, h), b = jeTag(eintraege, artB, dI, zs, dirIdx, h), d = [];
  Object.keys(a).forEach(function (t) { if (b[t]) d.push(a[t].s / a[t].n - b[t].s / b[t].n); });
  return d;
}

/* ---------- Naive Nachrechnung auf 1m (unabhaengig von lauf.js) ---------- */
function zerlegeTage(kerzen) {
  var aus = [], s = 0;
  for (var i = 1; i <= kerzen.length; i++) {
    if (i === kerzen.length || etDatum(kerzen[i][0]) !== etDatum(kerzen[s][0])) {
      var tag = etDatum(kerzen[s][0]), auf = auf0930(tag), soll = sollMinVon(tag), v = 0;
      for (var q = s; q < i; q++) v += kerzen[q][2] || 0;
      aus.push({ tag: tag, von: s, bis: i - 1, auf: auf, sollMin: soll, schluss: auf + soll * MIN, umsatz: kerzen[i - 1][1] * v });
      s = i;
    }
  }
  return aus;
}
function medianNaiv(a) { var s = a.slice().sort(function (x, y) { return x - y; }); return s.length ? s[s.length >> 1] : NaN; }
/** Signale, Placebo-Ziehungen, Fuellungen und Ertraege eines (schlussbasierten) Detektors auf 1m nach REGEL §2-§6. */
function naivLimit(kerzen, D, reihe) {
  var params = K.paramsFuer(D, '1m'), T = zerlegeTage(kerzen), kal = K.kalender();
  T.forEach(function (d, q) {
    d.dicht = (d.bis - d.von + 1) >= K.DICHTE_MIN * d.sollMin;
    d.klasse = q < K.UMSATZ_FENSTER ? -1 : K.klasseIndex(medianNaiv(T.slice(q - K.UMSATZ_FENSTER, q).map(function (x) { return x.umsatz; })));
  });
  var bars = [], tage = [];
  T.forEach(function (d) { if (!d.dicht) return; var von = bars.length; for (var q = d.von; q <= d.bis; q++) bars.push(kerzen[q]); tage.push({ tag: d.tag, von: von, bis: bars.length - 1, schluss: d.schluss, klasse: d.klasse }); });
  var handel = [], letzt = -Infinity;
  function ausstieg(i, d, hMin) {
    if (hMin == null) return bars[d.bis][1];
    var ziel = bars[i + 1][0] + hMin * MIN, j = i + 2;
    while (j <= d.bis && bars[j][0] < ziel) j++;
    return j <= d.bis ? { j: j, kurs: bars[j][5] } : null;
  }
  function fuell(i, dir, d, streng) {
    var lim = bars[i][1];
    for (var j = i + 1; j <= d.bis && bars[j][0] < bars[i][0] + 16 * MIN; j++) {
      var x = dir > 0 ? lim - bars[j][4] : bars[j][3] - lim;
      if (streng ? x >= 0.01 - 1e-6 : x >= -1e-6) return j;
    }
    return -1;
  }
  function eintrag(i, dir, d, placebo) {
    var e = { i: i, dir: dir, tagIdx: kal.idx[d.tag], klasse: d.klasse, placebo: placebo, markt: [], streng: [], gross: [] };
    var js = fuell(i, dir, d, true), jg = fuell(i, dir, d, false);
    [60, 180, null].forEach(function (hm) {
      var a = ausstieg(i, d, hm), kurs = hm == null ? a : (a ? a.kurs : null);
      e.markt.push(kurs == null ? NaN : dir * (kurs - bars[i + 1][5]) / bars[i + 1][5] * 100);
      e.streng.push(js < 0 || kurs == null ? NaN : dir * (kurs - bars[i][1]) / bars[i][1] * 100);
      e.gross.push(jg < 0 || kurs == null ? NaN : dir * (kurs - bars[i][1]) / bars[i][1] * 100);
    });
    e.js = js; e.jg = jg;
    return e;
  }
  tage.forEach(function (d) {
    if (kal.idx[d.tag] === undefined || d.klasse < 0) return;
    var zul = [], sig = [];
    for (var i = d.von; i < d.bis; i++) if (bars[i][0] + MIN + 30 * MIN <= d.schluss) zul.push(i);
    zul.forEach(function (i2) {
      if (bars[i2][0] - letzt < 60 * MIN) return;
      var s = D.signal(bars, i2, params);
      if (!s || !s.dir) return;
      letzt = bars[i2][0];
      sig.push([i2, s.dir > 0 ? 1 : -1]);
      handel.push(eintrag(i2, s.dir > 0 ? 1 : -1, d, false));
    });
    if (!sig.length) return;
    var rng = rngNeu(fnvNaiv(reihe + '|' + d.tag + '|' + D.key + '|1m|limit'));
    sig.forEach(function (sg) {
      var spaeter = zul.filter(function (i) { return i > sg[0]; });
      if (!spaeter.length) return;
      handel.push(eintrag(spaeter[Math.floor(rng() * spaeter.length)], sg[1], d, true));
    });
  });
  return { bars: bars, handel: handel };
}

var KUNST = {};

/* ====================================================================================== */
abschnitt(0, 'FESTLEGUNGEN UND ZELLENLAYOUT', function () {
  pruefe(LA.LIMIT_K['1m'] === 15 && LA.LIMIT_K['5m'] === 3 && LA.LIMIT_K['15m'] === 1 && K.ZEITRAHMEN.every(function (z) { return LA.LIMIT_K[z.key] * z.min === 15; }), '0a k = 15 / 3 / 1 Takte, auf jedem Zeitrahmen 15 Minuten (REGEL §3)');
  pruefe(LA.TICK_USD === 0.01 && LA.TOL_USD === 1e-6, '0b Tick 0,01 $, Toleranz 1e-6 $');
  pruefe(JSON.stringify(AW.KOSTEN) === JSON.stringify([1, 0.5, 0.5, 1, 0.5, 0.5]) && LA.ARTEN.join() === 'sigMarkt,sigStreng,sigGross,plaMarkt,plaStreng,plaGross', '0c Kostenanteil je Zeilenart: Markt K, Limit K/2 (REGEL §5)');
  pruefe(K.KLASSEN.map(function (k) { return k.huerde; }).join('/') === '0.1569/0.0854/0.0647/0.0449' && Math.abs(AW.JEDE_KLASSE_ZU - 0.02245) < 1e-12, '0d Huerden aus konfig.js der Minutenstudie 0,1569/0,0854/0,0647/0,0449, "in jeder Klasse zu" mit Limit bei 0,02245');
  var nT = K.kalender().tage.length, rng = rngNeu(7), fehler = 0;
  for (var q = 0; q < 2000; q++) {
    var c = { art: Math.floor(rng() * 6), det: Math.floor(rng() * 13), zs: Math.floor(rng() * 2), dirIdx: Math.floor(rng() * 2), h: Math.floor(rng() * 3), tag: Math.floor(rng() * nT), klasse: Math.floor(rng() * 4), lebend: Math.floor(rng() * 2) };
    var idx = LA.zelle(nT, 2, c.art, c.det, c.zs, c.dirIdx, c.h, c.tag, c.klasse, c.lebend), d = LA.dekodiere(idx, nT, 2);
    if (JSON.stringify(d) !== JSON.stringify(c) || idx < 0 || idx >= LA.zellenZahl(nT, 2)) fehler++;
  }
  pruefe(fehler === 0, '0e Zellenindex und Dekoder sind Umkehrungen (2.000 Zufallskoordinaten, ' + fehler + ' Fehler)');
  pruefe(LA.zrAuswahl(['15m', '5m']).join() === '5m,15m' && LA.kennung(['5m', '15m']) !== LA.kennung(['1m']) && /signale-minuten-2026-09-06\/v4/.test(LA.kennung(['1m'])), '0f Zeitrahmen-Satz unabhaengig von der Reihenfolge; Kennung traegt den Satz und die Kennung der Minutenstudie');
});

/* ====================================================================================== */
abschnitt(1, 'FUELLREGELN an Hand-Faellen (REGEL §3)', function () {
  var t0 = Date.UTC(2024, 2, 4, 15, 0);
  function k(min, schluss, hoch, tief, auf) { return [t0 + min * MIN, schluss, 1000, hoch, tief, auf]; }
  /* Signalkerze i = 0 auf 5m (Schluss 100,00), Fenster: Kerzen mit t_i + 5 <= t < t_i + 20 Minuten (k = 3) */
  function fall(folge, dir, rf) { var bars = [k(0, 100, 100.2, 99.9, 100.1)].concat(folge); return LA.fuellung(bars, 0, dir || 1, 5, 3, bars.length - 1, rf); }
  var a = fall([k(5, 100.1, 100.2, 100.05, 100.1), k(10, 100.05, 100.1, 100.00, 100.08), k(15, 100.2, 100.3, 100.1, 100.1)]);
  pruefe(a.gross === 2 && a.streng === -1, '1a beruehrt (Tief = Limit 100,00): grosszuegig gefuellt in Kerze 2, streng nicht (' + JSON.stringify(a) + ')');
  var b = fall([k(5, 100.1, 100.2, 100.05, 100.1), k(10, 100.0, 100.1, 99.99, 100.08)]);
  pruefe(b.gross === 2 && b.streng === 2 && !b.lueckeStreng, '1b einen Tick unterschritten (Tief 99,99): beide gefuellt in Kerze 2, keine Luecke');
  var c = fall([k(5, 100.0, 100.1, 99.991, 100.05)]);
  pruefe(c.gross === 1 && c.streng === -1, '1c weniger als ein Tick darunter (99,991): nur grosszuegig');
  var d = fall([k(5, 100.3, 100.4, 100.2, 100.25), k(10, 100.5, 100.6, 100.3, 100.3), k(15, 100.4, 100.6, 100.3, 100.5)]);
  pruefe(d.gross === -1 && d.streng === -1, '1d nie erreicht: ungefuellt nach beiden Regeln');
  var e = fall([k(5, 99.9, 99.96, 99.85, 99.95)]);
  pruefe(e.streng === 1 && e.gross === 1 && e.lueckeStreng && e.limit === 100, '1e Luecke ueber das Limit (Eroeffnung 99,95): gefuellt in Kerze 1, als Luecke gezaehlt, Fuellpreis bleibt das Limit 100,00');
  var bars1e = [k(0, 100, 100.2, 99.9, 100.1), k(5, 99.9, 99.96, 99.85, 99.95), k(10, 100, 100.1, 99.9, 99.9), k(15, 100.5, 100.6, 100.4, 100.45)];
  var ex = [new Int32Array([2, 2, 2, 2]), new Int32Array([-1, -1, -1, -1]), new Int32Array([3, 3, 3, 3])]; ex.von = 0;
  var rE = LA.ertragLimit(bars1e, 0, 1, 0, 3, ex, 1, 100);
  pruefe(Math.abs(rE - (99.9 - 100) / 100 * 100) < 1e-12, '1f Ertrag zum Limitpreis, nicht zur Eroeffnung der Lueckenkerze: (99,90 - 100,00)/100,00 = ' + f4(rE) + ' Pp');
  var f = fall([k(5, 100.2, 100.3, 100.1, 100.2), k(10, 100.2, 100.3, 100.1, 100.2), k(15, 100.2, 100.3, 100.1, 100.2), k(20, 99.8, 100, 99.7, 99.9)]);
  pruefe(f.gross === -1 && f.streng === -1, '1g Beruehrung erst im Takt k+1 (t_i + 20 min): ausserhalb der Gueltigkeit, ungefuellt');
  var g = fall([k(5, 100.2, 100.3, 100.1, 100.2), k(15, 99.95, 100, 99.9, 99.98)]);
  pruefe(g.streng === 2 && g.gross === 2, '1h fehlende Kerze im Fenster (10-Minuten-Takt ohne Handel), Fuellung im dritten Takt: Index 2');
  var h = fall([k(5, 99.9, 100.0, 99.8, 99.95), k(10, 99.7, 99.9, 99.6, 99.8)]);
  pruefe(h.streng === 1, '1i die ERSTE Kerze, die die Regel erfuellt, fuellt (Index ' + h.streng + ')');
  var s1 = fall([k(5, 99.9, 100.00, 99.8, 99.95)], -1), s2 = fall([k(5, 99.9, 100.01, 99.8, 99.95)], -1);
  pruefe(s1.gross === 1 && s1.streng === -1 && s2.streng === 1, '1j Short spiegelbildlich: Hoch = Limit nur grosszuegig, Hoch = Limit + 1 Tick streng');
  var rf = function () { return 4; };
  var v1 = fall([k(5, 100, 100.1, 99.9975, 100)], 1, rf), v2 = fall([k(5, 100, 100.1, 99.998, 100)], 1, rf);
  pruefe(v1.streng === 1 && v2.streng === -1 && v2.gross === 1, '1k bereinigte Datei mit Rueckrechnungsfaktor 4: Tick = 0,0025 Datei-Einheiten (99,9975 streng, 99,998 nicht)');
  var bTag = [k(0, 100, 100.2, 99.9, 100.1), k(5, 100.1, 100.2, 100.05, 100.1), k(10, 99, 99.5, 98.5, 99)];
  var w = LA.fuellung(bTag, 0, 1, 5, 3, 1);
  pruefe(w.streng === -1 && w.gross === -1, '1l Fenster endet am Tagesende (bis = 1): die Kerze danach zaehlt nicht');
  var oh = LA.fuellung([k(0, 100, 100.2, 99.9, 100.1), [t0 + 5 * MIN, 99.98, 1000, null, null, 100.0]], 0, 1, 5, 3, 1);
  pruefe(oh.streng === 1 && oh.ohneHT === 1, '1m Tief fehlt: der Schluss (99,98) zaehlt und die Kerze wird gezaehlt');
  var tol = fall([k(5, 100, 100.1, 100 - 0.01 + 4e-7, 100)]);
  pruefe(tol.streng === 1, '1n Gleitkomma-Toleranz: Tief 99,9900004 gilt als einen Tick darunter');
});

/* ====================================================================================== */
abschnitt(2, 'KUNSTLAUF: Marktorder-Kontrolle = messen.messeDatei der Minutenstudie, Bit fuer Bit (alle 13 Detektoren, 1m/5m/15m)', function () {
  var kal = K.kalender(), tage = kal.tage.filter(function (t) { return t >= '2024-01-01'; }).slice(0, K.UMSATZ_FENSTER + 40);
  var roh = kunstReihe(tage, 20261005);
  var lim = messeLimit(roh, DETS, null), min = messeMinute(roh, DETS, null);
  KUNST.roh = roh; KUNST.lim = lim; KUNST.tage = tage;
  var v = vergleicheMarkt(lim, min);
  pruefe(v.zellenB > 1000 && v.abw === 0 && v.zellenA === v.zellenB, '2a Signal-Markt (n, Summe r, Summe r^2) gleich den Kandidatenzellen der Minutenstudie: ' + v.zellenA + ' / ' + v.zellenB + ' Zellen, ' + v.beob + ' Beobachtungen, ' + v.abw + ' Abweichungen');
  pruefe(JSON.stringify(lim.stat.signale) === JSON.stringify(min.stat.signale) && lim.stat.signaleGesamt === min.stat.signaleGesamt, '2b Signalzahlen je Detektor und Zeitrahmen gleich (' + lim.stat.signaleGesamt + ' Signale)');
  pruefe(JSON.stringify(lim.Z.tageGewertet) === JSON.stringify(min.stat.zaehler.tageGewertet) && JSON.stringify(lim.Z.aufrufe) === JSON.stringify(min.stat.zaehler.aufrufe), '2c gewertete Tage und Detektoraufrufe gleich (' + JSON.stringify(lim.Z.tageGewertet) + ')');
  var nur = messeLimit(roh, DETS, ['5m', '15m']), v2 = vergleicheMarkt(nur, messeMinute(roh, DETS, ['5m', '15m']));
  pruefe(v2.abw === 0 && v2.zellenB > 100 && nur.zrSel.join() === '5m,15m', '2d nur 5m/15m (Layout mit zwei Zeitrahmen): ' + v2.zellenB + ' Zellen gleich, ' + v2.abw + ' Abweichungen');
});

/* ====================================================================================== */
abschnitt(3, 'ZAEHLER, PLACEBO-ZIEHUNG UND RICHTUNGEN im Kunstlauf', function () {
  var lim = KUNST.lim; if (!lim) { fehlt('3 kein Kunstlauf'); return; }
  var hS = K.N_H - 1, Z = lim.Z, fehl = 0, sumS = [0, 0, 0, 0], sumP = [0, 0, 0, 0];
  Object.keys(Z.fuellSignal).forEach(function (key) {
    var p = key.split('|'), dI = detIdx(p[0]), zs = lim.zrSel.indexOf(p[1]), dir = p[2] === 'long' ? 0 : 1;
    var n = function (art) { return lim.eintraege.filter(function (e) { return e.art === art && e.det === dI && e.zs === zs && e.dirIdx === dir && e.h === hS; }).reduce(function (a, e) { return a + e.n; }, 0); };
    var zs1 = Z.fuellSignal[key], zp = Z.fuellPlacebo[key] || [0, 0, 0, 0];
    if (zs1[1] !== n(LA.A.sigMarkt) || zs1[2] !== n(LA.A.sigStreng) || zs1[3] !== n(LA.A.sigGross)) fehl++;
    if (zp[1] !== n(LA.A.plaMarkt) || zp[2] !== n(LA.A.plaStreng) || zp[3] !== n(LA.A.plaGross)) fehl++;
    for (var q = 0; q < 4; q++) { sumS[q] += zs1[q]; sumP[q] += zp[q]; }
  });
  pruefe(fehl === 0 && sumS[0] > 500, '3a Fuellzaehler je (Detektor, ZR, Richtung) = Zellen bei "bis Schluss" (mit Einstieg / streng / grosszuegig), Signal und Placebo: ' + fehl + ' Abweichungen; Signale ' + sumS[0] + ', streng ' + sumS[2] + ' (' + f2(100 * sumS[2] / sumS[1]) + ' %), grosszuegig ' + sumS[3] + ' (' + f2(100 * sumS[3] / sumS[1]) + ' %)');
  pruefe(sumS[0] === lim.stat.signaleGesamt && sumS[0] === sumS[1] && Z.placeboGezogen + Z.placeboWenigerKerzen === sumS[0] && sumP[0] === Z.placeboGezogen, '3b je Signal genau eine Placebo-Ziehung (' + Z.placeboGezogen + ' + ' + Z.placeboWenigerKerzen + ' ohne Kerze = ' + sumS[0] + ' Signale), jedes Signal mit Einstieg');
  pruefe(sumS[2] <= sumS[3] && sumP[2] <= sumP[3], '3c streng gefuellt ist nie mehr als grosszuegig (Signal ' + sumS[2] + ' <= ' + sumS[3] + ', Placebo ' + sumP[2] + ' <= ' + sumP[3] + ')');
  /* Richtungen: je (Detektor, ZR, Tag) hat das Placebo dieselbe Zahl Long und Short wie die Signale (Markt-Zeile bei "bis Schluss") */
  var je = {};
  lim.eintraege.forEach(function (e) {
    if (e.h !== hS || (e.art !== LA.A.sigMarkt && e.art !== LA.A.plaMarkt)) return;
    var k = e.det + '|' + e.zs + '|' + e.tag, z = je[k] || (je[k] = [[0, 0], [0, 0]]);
    z[e.art === LA.A.sigMarkt ? 0 : 1][e.dirIdx] += e.n;
  });
  var verstoss = 0, nk = 0, fehlend = 0; Object.keys(je).forEach(function (k) { nk++; if (je[k][1][0] > je[k][0][0] || je[k][1][1] > je[k][0][1]) verstoss++; fehlend += je[k][0][0] + je[k][0][1] - je[k][1][0] - je[k][1][1]; });
  pruefe(nk > 100 && verstoss === 0 && fehlend === Z.placeboWenigerKerzen, '3d Placebo traegt die Richtungen der Signale: ' + nk + ' (Detektor, ZR, Tag), nie mehr Long/Short-Ziehungen als Signale (' + verstoss + ' Verstoesse); Fehlbetrag ' + fehlend + ' = Zaehler ohne spaetere Kerze ' + Z.placeboWenigerKerzen);
  var vs = Z.placeboVersatzMin, vn = Z.placeboVersatzN;
  pruefe(Object.keys(vn).length > 0 && Object.keys(vn).every(function (z) { return vs[z] / vn[z] > 0; }), '3g Placebo liegt immer NACH dem Signal (Nachtrag 1): mittlerer Versatz ' + Object.keys(vn).map(function (z) { return z + ' ' + f2(vs[z] / vn[z]) + ' min'; }).join(', '));
  pruefe(Z.ausstiegVorFuellung === 0, '3e kein Ausstieg vor der Fuellung (' + Z.ausstiegVorFuellung + ')');
  var abst = Z.abstandStreng['5m'] || {}, maxA = Math.max.apply(null, Object.keys(abst).map(Number));
  pruefe(maxA <= 3 && (Z.abstandStreng['15m'] ? Object.keys(Z.abstandStreng['15m']).every(function (x) { return +x === 1; }) : true) && Math.max.apply(null, Object.keys(Z.abstandStreng['1m'] || { 0: 1 }).map(Number)) <= 15, '3f Fuellkerzen liegen im Fenster: 1m <= 15, 5m <= 3 (' + JSON.stringify(abst) + '), 15m = 1');
});

/* ====================================================================================== */
abschnitt(4, 'NAIVE NACHRECHNUNG (rsi2, 1m): Signale, Placebo-Ziehung mit Saat, Fuellung, Ertraege, Kosten', function () {
  var lim = KUNST.lim; if (!lim) { fehlt('4 kein Kunstlauf'); return; }
  var D = det('rsi2'), dI = detIdx('rsi2'), nv = naivLimit(KUNST.roh, D, 'KUNST');
  var arten = { markt: [LA.A.sigMarkt, LA.A.plaMarkt], streng: [LA.A.sigStreng, LA.A.plaStreng], gross: [LA.A.sigGross, LA.A.plaGross] }, abw = 0, verglichen = 0, nSum = 0;
  Object.keys(arten).forEach(function (regel) {
    [0, 1].forEach(function (pl) {
      for (var h = 0; h < K.N_H; h++) for (var dir = 0; dir < 2; dir++) {
        var z = jeTag(lim.eintraege, arten[regel][pl], dI, 0, dir, h), n = {};
        nv.handel.forEach(function (e) { if ((e.placebo ? 1 : 0) !== pl || (e.dir > 0 ? 0 : 1) !== dir) return; var r = e[regel][h]; if (r !== r) return; var x = n[e.tagIdx] || (n[e.tagIdx] = { n: 0, s: 0 }); x.n++; x.s += r; });
        var tage = new Set(Object.keys(z).concat(Object.keys(n)));
        tage.forEach(function (t) { verglichen++; var a = z[t], b = n[t]; if (!a || !b || a.n !== b.n || Math.abs(a.s - b.s) > 1e-9) abw++; else nSum += a.n; });
      }
    });
  });
  var sig = nv.handel.filter(function (e) { return !e.placebo; }), pla = nv.handel.filter(function (e) { return e.placebo; });
  pruefe(sig.length > 100 && pla.length <= sig.length && pla.length > 0.8 * sig.length && abw === 0, '4a Zellen (Markt / streng / grosszuegig, Signal und Placebo, alle Haltedauern) = naive Rechnung mit eigener Saat-Nachbildung: ' + verglichen + ' (Art, Tag)-Paare, ' + nSum + ' Handel, ' + abw + ' Abweichungen; ' + sig.length + ' Signale, ' + pla.length + ' Ziehungen');
  var fs1 = sig.filter(function (e) { return e.js >= 0; }).length, fp = pla.filter(function (e) { return e.js >= 0; }).length;
  console.log('   rsi2 1m: Fuellquote streng Signal ' + f2(100 * fs1 / sig.length) + ' %, Placebo ' + f2(100 * fp / pla.length) + ' %');
  /* Kosten: auswerten.tagesreihe auf einem Speicher aus diesen Zellen - netto = brutto - K/2 (Limit) bzw. - K (Markt) */
  var nT = K.kalender().tage.length, sp = new LA.Speicher(nT, 3);
  sp.uebernehme(lim.delta);
  var G = { '1m+5m+15m': { zrSel: ['1m', '5m', '15m'], sp: sp } }, falsch = 0, gesehen = 0;
  [LA.A.sigMarkt, LA.A.sigStreng, LA.A.plaGross].forEach(function (art) {
    AW.tagesreihe(G, art, dI, '1m', 0, 0, 'alle').forEach(function (z) {
      gesehen++;
      var kl = new Set(); lim.eintraege.forEach(function (e) { if (e.art === art && e.det === dI && e.zs === 0 && e.dirIdx === 0 && e.h === 0 && e.tag === z.t) kl.add(e.klasse); });
      var Kk = K.KLASSEN[Array.from(kl)[0]].huerde, soll = z.roh - (art === LA.A.sigMarkt ? 1 : 0.5) * Kk;
      if (kl.size !== 1 || Math.abs(z.netto - soll) > 1e-12) falsch++;
    });
  });
  pruefe(gesehen > 50 && falsch === 0, '4b Kostenzerlegung: Tages-netto = brutto - K (Markt) bzw. - K/2 (Limit, Signal und Placebo), ' + gesehen + ' Tage, ' + falsch + ' falsch');
  /* gemischte Klassen: zwei Zellen desselben Tages mit verschiedener Klasse */
  var sp2 = new LA.Speicher(nT, 1), i1 = LA.zelle(nT, 1, LA.A.sigStreng, 0, 0, 0, 0, 5, 0, 1), i2 = LA.zelle(nT, 1, LA.A.sigStreng, 0, 0, 0, 0, 5, 3, 0);
  sp2.n[i1] = 2; sp2.s[i1] = 0.4; sp2.n[i2] = 1; sp2.s[i2] = -0.1;
  var t2 = AW.tagesreihe({ x: { zrSel: ['1m'], sp: sp2 } }, LA.A.sigStreng, 0, '1m', 0, 0, 'alle')[0];
  var soll2 = (0.4 + -0.1 - 0.5 * (2 * 0.1569 + 1 * 0.0449)) / 3;
  pruefe(t2 && Math.abs(t2.netto - soll2) < 1e-12 && Math.abs(t2.roh - 0.1) < 1e-12, '4c gemischte Klassen an einem Tag: netto ' + f4(t2 && t2.netto) + ' = (0,4 - 0,1 - (2 x 0,1569 + 0,0449)/2) / 3 = ' + f4(soll2));
});

/* ====================================================================================== */
abschnitt(5, 'PLACEBO GESEEDET: gleiche Eingabe gleiche Zellen, andere Reihe andere Ziehung, Signale unberuehrt', function () {
  if (!KUNST.roh) { fehlt('5 kein Kunstlauf'); return; }
  var dets = [det('rsi2'), det('reversion')];
  var a = messeLimit(KUNST.roh, dets, ['5m']), b = messeLimit(KUNST.roh, dets, ['5m']), c = messeLimit(KUNST.roh, dets, ['5m'], 'ANDERE');
  function feld(x, nurPlacebo) { var m = []; x.delta.zellen.forEach(function (v, idx) { var e = LA.dekodiere(idx, K.kalender().tage.length, 1); if ((e.art >= 3) === nurPlacebo) m.push(idx + ':' + v.join(',')); }); return m.sort().join(';'); }
  pruefe(feld(a, true) === feld(b, true) && feld(a, false) === feld(b, false) && feld(a, true).length > 100, '5a zweimal dieselbe Eingabe: Placebo- und Signalzellen identisch');
  pruefe(feld(a, false) === feld(c, false) && feld(a, true) !== feld(c, true), '5b andere Reihe (Saat): Signalzellen identisch, Placebo-Ziehung anders');
  /* ohne Kursblick: Kurse ab Kerze 0 veraendern, Stempel und Signale gleich lassen -> dieselben Ziehungen. Probe: die
   * Placebo-Ziehungen haengen nur an zul und Saat; ein Lauf mit verschobenem Kursniveau (x 1,5, Signale der
   * schlussbasierten Detektoren sind skaleninvariant) muss dieselbe Placebo-Zahl je (Tag, Richtung) und dieselben
   * Fuellungen zeigen - die Ertraege in Pp sind skaleninvariant bis auf Rundung. */
  var skal = KUNST.roh.map(function (k) { return [k[0], k[1] * 1.5, k[2] / 1.5, k[3] * 1.5, k[4] * 1.5, k[5] * 1.5]; });
  var d = messeLimit(skal, [det('rsi2')], ['5m']), a1 = messeLimit(KUNST.roh, [det('rsi2')], ['5m']);
  var na = jeTag(a1.eintraege, LA.A.plaMarkt, 0, 0, null, K.N_H - 1), nd = jeTag(d.eintraege, LA.A.plaMarkt, 0, 0, null, K.N_H - 1), gl = 0, alle = 0, rAbw = 0;
  Object.keys(na).forEach(function (t) { alle++; if (nd[t] && nd[t].n === na[t].n) gl++; if (nd[t] && Math.abs(nd[t].s - na[t].s) > 1e-6) rAbw++; });
  pruefe(alle > 20 && gl === alle && rAbw === 0, '5c Kursniveau x 1,5 (Signale skaleninvariant): Placebo-Ziehungen je Tag gleich (' + gl + '/' + alle + ' Tage), Placebo-Marktertraege gleich (' + rAbw + ' Abweichungen)');
});

/* ====================================================================================== */
abschnitt(6, 'KEINE INFORMATION AUS KERZEN NACH DEM EINSTIEG (Stoerungsprobe)', function () {
  if (!KUNST.roh) { fehlt('6 kein Kunstlauf'); return; }
  var bars = KUNST.roh.slice(0, 390 * 5), rng = rngNeu(99), proben = 0, gefuellt = 0, fehlerF = 0, fehlerU = 0, fehlerR = 0;
  for (var q = 0; q < 600; q++) {
    var i = 30 + Math.floor(rng() * (bars.length - 400)), dir = rng() < 0.5 ? 1 : -1, bis = i + 120;
    var f0 = LA.fuellung(bars, i, dir, 1, 15, bis);
    var gest = kopiere(bars);
    var ab = f0.streng >= 0 ? f0.streng + 1 : i + 16;                       // nach der Fuellung bzw. nach dem Fenster
    for (var j = ab; j <= bis; j++) { gest[j][3] *= 1.05; gest[j][4] *= 0.95; gest[j][1] *= 0.97; }
    var f1 = LA.fuellung(gest, i, dir, 1, 15, bis);
    proben++;
    if (f0.streng >= 0) { gefuellt++; if (f1.streng !== f0.streng) fehlerF++; } else if (f1.streng !== -1) fehlerU++;
    /* Ertrag: Kerzen zwischen Fuellung und Ausstieg (ausser der Ausstiegs-Eroeffnung) duerfen ihn nicht aendern */
    if (f0.streng >= 0) {
      var ex = M.ausstiege(bars, i - 5, bis), j60 = ex[0][i - ex.von];
      if (j60 > 0) {
        var g2 = kopiere(bars); for (var j2 = f0.streng + 1; j2 <= bis; j2++) if (j2 !== j60) { g2[j2][1] *= 0.9; g2[j2][3] *= 1.1; g2[j2][4] *= 0.9; g2[j2][5] *= 0.9; }
        var r0 = LA.ertragLimit(bars, i, f0.streng, 0, bis, ex, dir, f0.limit), r1 = LA.ertragLimit(g2, i, f0.streng, 0, bis, ex, dir, f0.limit);
        if (r0 !== r1) fehlerR++;
      }
    }
  }
  pruefe(proben === 600 && gefuellt > 50 && fehlerF === 0 && fehlerU === 0, '6a Kerzen NACH der Fuellkerze (bzw. nach dem Fenster) gestoert: Fuellentscheidung unveraendert in ' + gefuellt + ' gefuellten und ' + (proben - gefuellt) + ' ungefuellten Faellen (' + fehlerF + ' / ' + fehlerU + ' Abweichungen)');
  pruefe(fehlerR === 0, '6b Kerzen zwischen Fuellung und Ausstieg gestoert (ausser der Ausstiegskerze): 1h-Ertrag unveraendert (' + fehlerR + ' Abweichungen)');
  /* Gegenprobe der Stoerungsprobe: wer die Kerze VOR der Fuellung stoert, MUSS die Entscheidung aendern koennen */
  var geaendert = 0, moeglich = 0;
  for (var q2 = 0; q2 < 300; q2++) {
    var i3 = 30 + Math.floor(rng() * (bars.length - 400)), f3 = LA.fuellung(bars, i3, 1, 1, 15, i3 + 60);
    if (f3.streng === i3 + 1) continue;                                      // schon in i+1 gefuellt: nichts zu aendern
    moeglich++;
    var g3 = kopiere(bars); g3[i3 + 1][4] = g3[i3][1] - 0.05;              // Kerze i+1: Tief deutlich unter dem Limit
    var f4b = LA.fuellung(g3, i3, 1, 1, 15, i3 + 60);
    if (f4b.streng === i3 + 1) geaendert++;
  }
  pruefe(moeglich >= 30 && geaendert === moeglich, '6c Gegenprobe: Stoerung IM Fenster (Tief der Kerze i+1 unter das Limit) verlegt die Fuellung in ' + geaendert + ' von ' + moeglich + ' moeglichen Faellen auf i+1 - die Probe kann rot werden');
});

/* ====================================================================================== */
abschnitt(7, 'GEGENPROBE GETEILTER KURS (wie Minutenstudie): Einstieg zum Signalschluss OHNE Fuellbedingung erzeugt den Scheineffekt', function () {
  /* dieselbe Kunst-Reihe wie Pruefung 1/3 der Minutenstudie (110 Tage, Saat 20260906) */
  var kal = K.kalender(), tage = kal.tage.filter(function (t) { return t >= '2024-01-01'; }).slice(0, K.UMSATZ_FENSTER + 90);
  var roh = kunstReihe(tage, 20260906), D = det('rsi2'), nv = naivLimit(roh, D, 'KUNST'), bars = nv.bars;
  var longs = nv.handel.filter(function (e) { return !e.placebo && e.dir > 0; });
  var richtig = [], falsch = [], streng = [], gleich = 0, gefuellt = 0;
  longs.forEach(function (e) {
    var r = e.markt[0]; if (r !== r) return;
    var ziel = bars[e.i + 1][0] + 60 * MIN, j = e.i + 2; while (j < bars.length && bars[j][0] < ziel) j++;
    var f = (bars[j][5] - bars[e.i][1]) / bars[e.i][1] * 100;
    richtig.push(r); falsch.push(f);
    if (e.streng[0] === e.streng[0]) { streng.push(e.streng[0]); gefuellt++; if (Math.abs(e.streng[0] - f) < 1e-12) gleich++; }
  });
  var mR = mittel(richtig), mF = mittel(falsch);
  console.log('   rsi2 long 1m 1h: n ' + richtig.length + ', Markt (Eroeffnung i+1) ' + f4(mR) + ' Pp, IMMER gefuellt zum Signalschluss ' + f4(mF) + ' Pp, Limit streng (nur gefuellte, n ' + streng.length + ') ' + f4(mittel(streng)) + ' Pp');
  pruefe(richtig.length >= 30 && mF > 0.05 && mF - mR >= 0.05, '7a FALSCH (immer zum Signalschluss gefuellt) ' + f4(mF) + ' Pp > +0,05 und ' + f4(mF - mR) + ' ueber der Marktorder - der Scheineffekt entsteht, die Probe ist scharf');
  pruefe(Math.abs(mR) < 0.05, '7b RICHTIG (Marktorder, Eroeffnung i+1) nahe null: ' + f4(mR) + ' Pp');
  /* Auf dieser Reihe (Mikrorauschen 0,12 % je Kerze, Tick 0,01 % des Kurses) fuellt fast jedes Limit: der Limit-Ertrag
   * der gefuellten Signale IST der Signalschluss-Ertrag. Die Fuellbedingung allein schuetzt also nicht vor dem geteilten
   * Kurs - das tut das Placebo mit derselben Mechanik (Pruefung 8). Diese Zeile haelt die Identitaet fest. */
  pruefe(gefuellt > 30 && gleich === gefuellt, '7c fuer gefuellte Signale ist der Limit-Ertrag identisch mit dem Signalschluss-Ertrag (' + gleich + ' von ' + gefuellt + ') - der Schutz gegen den geteilten Kurs liegt im Placebo, nicht in der Fuellregel');
});

/* ====================================================================================== */
abschnitt(8, 'MARTINGAL-PROBE: auf einer reinen Irrfahrt ist Signal minus Placebo (streng) null; Tagesmittel und Ziehung vor dem Signal sind es nicht', function () {
  var kal = K.kalender(), tage = kal.tage.filter(function (t) { return t >= '2023-03-01'; }).slice(0, K.UMSATZ_FENSTER + 150);
  var ctx = { iBes: kal.tage.length, iReg: 0 }, nT = kal.tage.length;
  var zeilen = [], schlecht = [], tmAbstand = [], zeilenGesamt = 0;
  [4711, 1, 2].forEach(function (saat) {
    var mg = kunstReihe(tage, saat, { sigmaN: 0, sigmaRw: 0.0005 });
    var lim = messeLimit(mg, [det('rsi2'), det('reversion')], ['1m', '5m']);
    var sp = new LA.Speicher(nT, 2); sp.uebernehme(lim.delta);
    var G = { x: { zrSel: lim.zrSel, sp: sp } };
    [0, 1].forEach(function (dI) { ['1m', '5m'].forEach(function (zr) { [0, 1].forEach(function (dir) { [0, 2].forEach(function (h) {
      var s = AW.tagesreihe(G, LA.A.sigStreng, dI, zr, dir, h, 'alle'), p = AW.tagesreihe(G, LA.A.plaStreng, dI, zr, dir, h, 'alle');
      if (s.length < 30) return;
      var d = AW.differenz(s, p, ctx, 'ent', 'roh');
      zeilenGesamt++;
      if (saat === 4711) zeilen.push(['rsi2', 'reversion'][dI] + ' ' + zr + ' ' + (dir ? 'short' : 'long') + ' ' + K.HALTEDAUERN[h].key + ' ' + f4(d.mittel) + ' (t ' + f2(d.t) + ')');
      if (!(Math.abs(d.t) < 3)) schlecht.push(saat + '/' + ['rsi2', 'reversion'][dI] + '/' + zr + '/' + dir + '/' + K.HALTEDAUERN[h].key + ' t ' + f2(d.t));
      /* 8d: Signal-Markt allein - Tagesmittel gegen handelsgewichtet */
      if (dI === 0 && zr === '1m' && h === 2) {
        var m = AW.zusammen(AW.tagesreihe(G, LA.A.sigMarkt, dI, zr, dir, h, 'alle'), ctx, 'ent');
        tmAbstand.push(m.tm.brutto.mittel - m.brutto.mittel);
      }
    }); }); }); });
    if (saat === 4711) KUNST.martingal = { kerzen: mg, lim: lim };
  });
  console.log('   Saat 4711: ' + zeilen.join(' | '));
  pruefe(zeilenGesamt >= 24 && schlecht.length === 0, '8a D (Signal-streng minus Placebo-streng, je Handel, Tage geclustert) im Band |t| < 3 auf dem Martingal: ' + zeilenGesamt + ' Zeilen ueber drei Saaten' + (schlecht.length ? ', verfehlt: ' + schlecht.join(', ') : ''));
  var mg4711 = KUNST.martingal.lim, pl = []; mg4711.eintraege.forEach(function (e) { if (e.art === LA.A.plaStreng && e.h === 0) pl.push(e); });
  var plN = pl.reduce(function (a, x) { return a + x.n; }, 0), plM = pl.reduce(function (a, x) { return a + x.s; }, 0) / plN, plQ = pl.reduce(function (a, x) { return a + x.s2; }, 0) / plN - plM * plM;
  pruefe(plN > 300 && plM < 2 * Math.sqrt(plQ / plN), '8b Placebo streng brutto auf dem Martingal ohne Scheingewinn: ' + f4(plM) + ' Pp je Handel (se ' + f4(Math.sqrt(plQ / plN)) + ', n ' + plN + '; Erwartung leicht negativ, -Tick und Ueberschuss)');
  /* FALSCH: Fuellpreis = tiefstes Tief bis zum Ausstieg (Blick nach vorn) -> Scheingewinn */
  var D = det('rsi2'), nv = naivLimit(KUNST.martingal.kerzen, D, 'KUNST'), b = nv.bars, falsch = [];
  nv.handel.forEach(function (e) {
    if (e.placebo || e.dir < 0 || e.js < 0) return;
    var ziel = b[e.i + 1][0] + 60 * MIN, j = e.i + 2; while (j < b.length && b[j][0] < ziel) j++;
    if (j >= b.length || etDatum(b[j][0]) !== etDatum(b[e.i][0])) return;
    var tief = Infinity; for (var q = e.i + 1; q < j; q++) tief = Math.min(tief, b[q][4]);
    falsch.push((b[j][5] - tief) / tief * 100);
  });
  pruefe(falsch.length >= 30 && mittel(falsch) > 0.05 && tWert(falsch) > 3, '8c FALSCH (Fuellpreis = tiefstes Tief bis zum Ausstieg): ' + f4(mittel(falsch)) + ' Pp, t ' + f2(tWert(falsch)) + ' - der Blick nach vorn erzeugt einen Scheingewinn, die Probe ist scharf');
  /* 8d (Nachtrag 1, Punkt 2): das Mittel der Tagesmittel ist verzerrt, wenn die Signalzahl des Tages vom Kursweg nach
   * einem Signal abhaengt - rsi2 1m, Marktorder, bis Schluss, drei Saaten x zwei Richtungen */
  pruefe(tmAbstand.length === 6 && mittel(tmAbstand) < -0.05, '8d Tagesmittel minus handelsgewichtetes Mittel (Signal-Markt rsi2 1m bis Schluss, Martingal): ' + tmAbstand.map(f4).join(' / ') + ', Mittel ' + f4(mittel(tmAbstand)) + ' Pp < -0,05 - deshalb ist der Endpunkt handelsgewichtet mit Tages-Clustern');
  /* 8e (Nachtrag 1, Punkt 1): Gegenprobe der alten Ziehung - Placebo irgendwo am Tag mit der Richtung des Signals.
   * Naiv nachgebaut: Marktertrag bis Schluss, Placebo VOR dem Signal; er muss systematisch besser sein als der danach. */
  var bb = KUNST.martingal.kerzen, sig = nv.handel.filter(function (e) { return !e.placebo; }), vor = [], nach = [];
  sig.forEach(function (e) {
    var tag = etDatum(bb[e.i][0]), von = e.i, bis = e.i;
    while (von > 0 && etDatum(bb[von - 1][0]) === tag) von--;
    while (bis + 1 < bb.length && etDatum(bb[bis + 1][0]) === tag) bis++;
    var schluss = bb[bis][1];
    for (var p = von; p < e.i; p += 7) if (p + 1 <= bis) vor.push(e.dir * (schluss - bb[p + 1][5]) / bb[p + 1][5] * 100);
    for (var p2 = e.i + 1; p2 < bis - 31; p2 += 7) nach.push(e.dir * (schluss - bb[p2 + 1][5]) / bb[p2 + 1][5] * 100);
  });
  pruefe(vor.length > 100 && mittel(vor) - mittel(nach) > 0.05, '8e Gegenprobe der alten Ziehung: Placebo VOR dem Signal mit dessen Richtung verdient ' + f4(mittel(vor)) + ' Pp, NACH dem Signal ' + f4(mittel(nach)) + ' Pp - die Richtung traegt den Kursweg bis zum Signal, eine Ziehung davor blickt nach vorn');
});

/* ====================================================================================== */
abschnitt(9, 'POSITIVKONTROLLE: gepflanzte Kante an der 1h-Ausstiegskerze der Signale wird als D wiedergefunden', function () {
  if (!KUNST.roh) { fehlt('9 kein Kunstlauf'); return; }
  var D = det('rsi2'), nv = naivLimit(KUNST.roh, D, 'KUNST'), STAERKE = 0.005;
  var b = nv.bars, aus = kopiere(KUNST.roh), belegt = new Set(), gepflanzt = 0;
  /* naivLimit.bars ist KUNST.roh (alle Tage dicht) - Indizes stimmen ueberein */
  var einstiege = new Set(nv.handel.filter(function (e) { return !e.placebo; }).map(function (e) { return e.i + 1; }));
  nv.handel.forEach(function (e) {
    if (e.placebo) return;
    var ziel = b[e.i + 1][0] + 60 * MIN, j = e.i + 2; while (j < b.length && b[j][0] < ziel) j++;
    if (j >= b.length || etDatum(b[j][0]) !== etDatum(b[e.i][0]) || belegt.has(j) || einstiege.has(j)) return;
    var o = r4(aus[j][5] * (1 + e.dir * STAERKE)); aus[j][5] = o; if (o > aus[j][3]) aus[j][3] = o; if (o < aus[j][4]) aus[j][4] = o;
    belegt.add(j); gepflanzt++;
  });
  /* Gemessen wird die AENDERUNG von D durch die Pflanzung (gleicher Lauf ohne Pflanzung als Bezug): auf dieser Kunst-Reihe
   * mit unabhaengigem Mikrorauschen hat der Dip-Detektor schon ohne Pflanzung ein echtes D > 0 (Limit am verrauschten
   * Tief gegen ein spaeteres Placebo) - das ist Eigenschaft der Kunst-Reihe, nicht des Geraets. */
  var lim = messeLimit(aus, [D], ['1m']), lim0 = messeLimit(KUNST.roh, [D], ['1m']);
  function dm(l, dir, h) { var s1 = AW.tagesreihe({ x: { zrSel: ['1m'], sp: (function () { var sp = new LA.Speicher(K.kalender().tage.length, 1); sp.uebernehme(l.delta); return sp; })() } }, LA.A.sigStreng, 0, '1m', dir, h, 'alle');
    var p1 = AW.tagesreihe({ x: { zrSel: ['1m'], sp: (function () { var sp = new LA.Speicher(K.kalender().tage.length, 1); sp.uebernehme(l.delta); return sp; })() } }, LA.A.plaStreng, 0, '1m', dir, h, 'alle');
    return AW.differenz(s1, p1, { iBes: K.kalender().tage.length, iReg: 0 }, 'ent', 'roh').mittel; }
  var dL = dm(lim, 0, 0) - dm(lim0, 0, 0), dS = dm(lim, 1, 0) - dm(lim0, 1, 0), d3 = dm(lim, 0, 1) - dm(lim0, 0, 1);
  console.log('   ' + gepflanzt + ' Ausstiegskerzen gepflanzt; Aenderung von D: long 1h ' + f4(dL) + ', short 1h ' + f4(dS) + ', long 3h ' + f4(d3) + ' (ohne Pflanzung D long 1h ' + f4(dm(lim0, 0, 0)) + ')');
  pruefe(gepflanzt > 100 && Math.abs(dL - 0.5) < 0.1, '9a D long 1h steigt durch die Pflanzung um ' + f4(dL) + ' Pp bei gepflanzten +0,50 (Toleranz 0,10)');
  pruefe(Math.abs(dS - 0.5) < 0.1, '9b D short 1h steigt um ' + f4(dS) + ' Pp - Richtung stimmt');
  pruefe(Math.abs(d3) < 0.05, '9c Gegenprobe 3h (dort nichts gepflanzt): D aendert sich um ' + f4(d3) + ' Pp');
});

/* ====================================================================================== */
abschnitt(10, 'ECHTE DATEI AAPL/2024 (nur lesen, 5m/15m): Marktorder-Kontrolle = messen.messeDatei, Bit fuer Bit; Fuellquoten nur gezaehlt', function () {
  var R = L.reihen().filter(function (r) { return r.reihe === 'AAPL'; })[0];
  if (!pruefe(!!R, '10a AAPL in L.reihen()')) return;
  var g = L.ladeJahr(R, 2024);
  if (!pruefe(g.ok && g.kerzen.length > 90000, '10b AAPL/2024 gelesen (' + g.quelle + ', ' + (g.kerzen && g.kerzen.length) + ' regulaere 1m-Kerzen)')) return;
  var e = { R: R, g: g, warm: { kerzen1m: [], tagesUmsatz: [] }, massnahmen: L.massnahmenFuer(R) };
  var lim = messeLimit(null, DETS, ['5m', '15m'], null, e), min = messeMinute(null, DETS, ['5m', '15m'], null, e);
  var v = vergleicheMarkt(lim, min);
  pruefe(v.zellenB > 1000 && v.abw === 0 && v.zellenA === v.zellenB, '10c Signal-Markt = Kandidatenzellen der Minutenstudie: ' + v.zellenB + ' Zellen, ' + v.beob + ' Beobachtungen, ' + v.abw + ' Abweichungen');
  var s = [0, 0, 0, 0]; Object.keys(lim.Z.fuellSignal).forEach(function (k) { for (var q = 0; q < 4; q++) s[q] += lim.Z.fuellSignal[k][q]; });
  pruefe(s[1] > 1000 && s[2] > 0 && s[2] < s[1] && s[3] >= s[2], '10d Zaehlung: ' + s[1] + ' Signale mit Einstieg, streng gefuellt ' + s[2] + ' (' + f2(100 * s[2] / s[1]) + ' %), grosszuegig ' + s[3] + ' (' + f2(100 * s[3] / s[1]) + ' %); Ausstieg vor Fuellung ' + lim.Z.ausstiegVorFuellung + ', ohne Tief/Hoch ' + lim.Z.ohneHochTief);
});

/* ====================================================================================== */
abschnitt(11, 'FORTSETZBARKEIT UND BERICHTSNAME in Kindprozessen (Mini-Archiv)', function () {
  var wurzel = path.join(KRATZ, 'kunstarchiv'), roh = path.join(wurzel, 'alpaca1m');
  var kalQuelle = path.join(K.ORTE.roh(), '_kalender.json');
  if (!pruefe(fs.existsSync(kalQuelle), '11 echter Kalender erreichbar')) return;
  fs.rmSync(wurzel, { recursive: true, force: true }); fs.mkdirSync(roh, { recursive: true });
  fs.copyFileSync(kalQuelle, path.join(roh, '_kalender.json'));
  var kal = K.kalender(), tage23 = kal.tage.filter(function (t) { return t >= '2023-01-01' && t < '2024-01-01'; }).slice(-22), tage24 = kal.tage.filter(function (t) { return t >= '2024-01-01'; }).slice(0, 12);
  var lebenszeit = { werte: {} }, symbole = { gruppe: {}, ordner: {} };
  ['AAPL', 'MSFT'].forEach(function (sym, si) {
    fs.mkdirSync(path.join(roh, sym), { recursive: true });
    var alle = [];
    [[2023, tage23], [2024, tage24]].forEach(function (jt) {
      var kerzen = kunstReihe(jt[1], 900 + si * 10 + jt[0]), T = zerlegeTage(kerzen);
      fs.writeFileSync(path.join(roh, sym, jt[0] + '.json'), JSON.stringify({ sym: sym, series: kerzen, sitzungen: T.map(function (d) { return { von: kerzen[d.von][0], bis: kerzen[d.bis][0], sitzung: 'regulaer' }; }), jahr: jt[0] }));
      alle = alle.concat(kerzen);
    });
    lebenszeit.werte[sym] = { balken: tage23.length + tage24.length, erster: alle[0][0], letzter: alle[alle.length - 1][0], jahre: [2023, 2024] };
    symbole.gruppe[sym] = 'universum';
  });
  fs.writeFileSync(path.join(roh, '_lebenszeit.json'), JSON.stringify(lebenszeit));
  fs.writeFileSync(path.join(roh, '_symbole.json'), JSON.stringify(symbole));
  var env = Object.assign({}, process.env, { MD_ALPACA_WURZEL: wurzel });
  var a = path.join(KRATZ, 'lauf-a'), b = path.join(KRATZ, 'lauf-b');
  fs.rmSync(a, { recursive: true, force: true }); fs.rmSync(b, { recursive: true, force: true });
  function kind(skript, args) { var r = cp.spawnSync(process.execPath, [path.join(__dirname, skript)].concat(args), { env: env, cwd: __dirname, encoding: 'utf8', timeout: 900000, maxBuffer: 64 * 1024 * 1024 }); return { status: r.status, out: (r.stdout || '') + (r.stderr || '') }; }
  function fortschritt(o) { return JSON.parse(fs.readFileSync(path.join(o, '_fortschritt.json'), 'utf8')); }
  var ra = kind('lauf.js', ['--aus', a, '--zeitrahmen', '5m', '15m', '--max', '2', '--neu', '--checkpoint', '1']);
  var Fa = ra.status === 0 ? fortschritt(a) : null;
  pruefe(Fa && Fa.dateien === 2 && Fa.beendet === 'max erreicht', '11a Lauf (a) --max 2: Rueckgabe ' + ra.status + ', ' + (Fa && Fa.dateien) + ' Dateien, "' + (Fa && Fa.beendet) + '"');
  if (ra.status !== 0) console.log(ra.out.slice(-1500));
  var pa = kind('auswerten.js', ['--aus', a]);
  pruefe(pa.status === 0 && fs.existsSync(path.join(a, 'PILOT.md')) && !fs.existsSync(path.join(a, 'ERGEBNIS.md')), '11b unvollstaendiger Lauf heisst PILOT.md, nie ERGEBNIS.md');
  if (pa.status !== 0) console.log(pa.out.slice(-1500));
  var rb = kind('lauf.js', ['--aus', a, '--zeitrahmen', '5m', '15m']);
  var Fb = rb.status === 0 ? fortschritt(a) : null;
  pruefe(Fb && Fb.dateien === 4 && Fb.beendet === 'vollstaendig' && /FORTSETZUNG: 2 Dateien erledigt/.test(rb.out) && Fb.begonnen === Fa.begonnen, '11c Fortsetzung: ' + (Fb && Fb.dateien) + ' Dateien, "' + (Fb && Fb.beendet) + '", Beginn-Stempel behalten');
  var rc = kind('lauf.js', ['--aus', b, '--zeitrahmen', '15m', '5m', '--neu']);
  var Fc = rc.status === 0 ? fortschritt(b) : null;
  if (Fb && Fc) {
    var za = fs.readFileSync(path.join(a, '_zellen.bin')), zb = fs.readFileSync(path.join(b, '_zellen.bin'));
    var sp = LA.Speicher.lade(path.join(b, '_zellen.bin'), kal.tage.length, 2, Fc.zellenStand), nS = 0; for (var i = 0; i < sp.n.length; i++) nS += sp.n[i];
    pruefe(za.length === zb.length && za.subarray(0, za.length - 8).equals(zb.subarray(0, zb.length - 8)) && nS > 0, '11d _zellen.bin (a+b) und (c, am Stueck) byteidentisch bis auf den Stand-Schwanz (' + za.length + ' Bytes, Summe n ' + nS + ')');
    pruefe(JSON.stringify(Fb.zaehler.fuellSignal) === JSON.stringify(Fc.zaehler.fuellSignal) && JSON.stringify(Fb.signale) === JSON.stringify(Fc.signale), '11e Fuellzaehler und Signalzahlen gleich');
  } else fehlt('11d Lauf (c): Rueckgabe ' + rc.status + ' ' + rc.out.slice(-800));
  var pc = kind('auswerten.js', ['--aus', b]);
  pruefe(pc.status === 0 && fs.existsSync(path.join(b, 'ERGEBNIS.md')) && fs.existsSync(path.join(b, 'ergebnis.json')), '11f vollstaendiger Lauf ohne --reihen heisst ERGEBNIS.md (Rueckgabe ' + pc.status + ')');
  if (pc.status !== 0) console.log(pc.out.slice(-1500));
  if (Fb) {
    var Fx = fortschritt(a); Fx.kennung = 'fremde-studie/v0'; fs.writeFileSync(path.join(a, '_fortschritt.json'), JSON.stringify(Fx));
    var rd = kind('lauf.js', ['--aus', a, '--zeitrahmen', '5m', '15m']);
    pruefe(rd.status !== 0 && /anderen Konfiguration/.test(rd.out), '11g fremde Kennung: Abbruch mit Rueckgabe ' + rd.status);
  }
});

/* ====================================================================================== */
abschnitt(12, 'URTEILSREGEL (REGEL §7) an Hand-Konfigurationen', function () {
  function m(mittel, se, n) { return { mittel: mittel, se: se, t: se ? mittel / se : null, mde: se != null ? 2 * se : null, n: n, obere: mittel + 1.96 * se }; }
  function konf(name, richtung, De, Db, nettoB, kK, bruttoB) {
    return { name: name, richtung: richtung, D: { ent: De, bes: Db }, arten: { ent: { sigMarkt: { nHandel: 100 } }, bes: { sigMarkt: { nHandel: 100 }, sigStreng: { kJeHandel: kK, nTage: Db.n, netto: nettoB, brutto: bruttoB || m(0.05, 0.01, Db.n) } } } };
  }
  var cs = [
    konf('traegt', 'long', m(0.20, 0.03, 500), m(0.15, 0.01, 300), m(0.08, 0.01, 300), 0.1569),
    konf('short-traegt', 'short', m(0.20, 0.03, 500), m(0.15, 0.01, 300), m(0.08, 0.01, 300), 0.1569),
    konf('nur-placebo', 'long', m(0.20, 0.03, 500), m(0.15, 0.01, 300), m(-0.01, 0.01, 300), 0.1569),
    konf('tor1-zu-klein', 'long', m(0.05, 0.03, 500), m(0.15, 0.01, 300), m(0.08, 0.01, 300), 0.1569),
    konf('tor2-blind', 'long', m(0.60, 0.05, 500), m(0.15, 0.05, 300), m(0.08, 0.01, 300), 0.0449),
    konf('wenig-tage', 'long', m(0.20, 0.03, 500), m(0.15, 0.01, 20), m(0.08, 0.01, 20), 0.1569),
  ];
  var z = AW.urteile(cs), u = {}; cs.forEach(function (c) { u[c.name] = c.urteil + (c.handelbar ? ' / handelbar' : ''); });
  console.log('   ' + JSON.stringify(u) + ' k1 ' + z.k1 + ' k2 ' + z.k2);
  pruefe(z.k1 === 5 && z.k2 === 4, '12a Tor 1: 5 bestehen (Entdeckung >= 4 x MDE_B), Tor 2 (delta80 < K_Kand/2): 4');
  pruefe(u.traegt === 'traegt / handelbar' && u['short-traegt'] === 'traegt' && cs[1].handelbarGrund === 'nein (Leihe)', '12b long traegt und handelbar; Short traegt, aber nie handelbar (Leihe)');
  pruefe(u['nur-placebo'] === 'schlaegt Placebo, nicht nach Kosten' && u['tor1-zu-klein'] === 'kein Kandidat' && u['tor2-blind'] === 'nicht entscheidbar' && u['wenig-tage'] === 'nicht entscheidbar', '12c schlaegt nur das Placebo -> nicht "traegt"; Tor 1 verfehlt -> kein Kandidat; Tor 2 / < 30 Tage -> nicht entscheidbar');
});

console.log('\n' + ERG.ok + ' OK, ' + ERG.fehlt + ' FEHLT');
process.exitCode = ERG.fehlt ? 1 : 0;
