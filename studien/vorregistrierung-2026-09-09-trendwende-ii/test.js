'use strict';
/* TEST - Positivkontrolle und Sperrklinken des Messgeraets Trendwende II (VORREGISTRIERUNG §14).
 *
 *   node test.js            alle Pruefungen; Rueckgabewert 1, wenn eine FEHLT
 *
 * HERKUNFT: Kopie von studien/vorregistrierung-2026-09-06-signale-minuten/test.js (81 Pruefungen, abgenommen 07.09.2026);
 * die Pruefungen der unveraenderten Fremdmodule (Verdichtung, lesen.js) bleiben dort. Hier mitgetragen und angepasst:
 * Zellendecoder, Positivkontrolle, Placebo A/B, geteilter Kurs, Detektor-Gleichheit, Vorfilter, Klassen/Huerden, August-
 * Konstanten, Fortsetzbarkeit in Kindprozessen, Randregeln, ET-Tag, Wertpapierart. NEU: Praefix-Probe aller neun Detektoren,
 * W1a gegen hauptstudie.js detect(), Schein-Konstanten gegen BERICHT.md, Uebernacht-Ausstieg ueber Dateigrenzen, Jahres-
 * scheiben gegen Handrechnung, Aktualitaets-Tor und Vorwaertstest an konstruierten Faellen, Hansen-Hodrick L = 2, Regime,
 * Konstruktionsfaelle W4-W7, Klinken (kein Netz, kein Schluessel, kein Schreiben ins Archiv, kein Yahoo).
 *
 * Jede Zeile der Ausgabe ist 'OK ...', 'FEHLT ...' oder 'UEBERSPRUNGEN ...'. Eine Ausnahme in einer Pruefung ist FEHLT.
 * ARCHIV: nur lesen, nur AAPL/2024 und die Meta-Dateien. Mini-Archiv im Kratzordner (MD_TEST_KRATZ oder tmpdir).
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var cp = require('child_process');
var K = require('./konfig.js');
var L = require(path.join(K.MINUTEN, 'lesen.js'));
var M = require('./messen.js');
var A = require('./auswerten.js');
var DT = require('./detektoren.js');
var Q = require(path.join(K.REPO, 'quant.js'));
var Liquide = require(path.join(K.REPO, 'liquide.js'));
var TAB = require(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'));
var WP = require(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'detektoren', 'wendepunkt-trendwechsel.js'));
var KA = require(path.join(K.KANAL, 'auswerten.js'));

var KRATZ = process.env.MD_TEST_KRATZ || path.join(os.tmpdir(), 'trendwende-ii-test');
var MIN = 60000;

/* ---------- Buchfuehrung ---------- */
var ERG = { ok: 0, fehlt: 0, ueber: 0 };
function ok(txt) { ERG.ok++; console.log('OK    ' + txt); }
function fehlt(txt) { ERG.fehlt++; console.log('FEHLT ' + txt); }
function ueber(txt) { ERG.ueber++; console.log('UEBERSPRUNGEN ' + txt); }
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
function rngNeu(saat) { var a = saat >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(rng) { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

/* ---------- ET-Zeit, unabhaengig von lesen.js ---------- */
var ET_DATUM = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
var ET_STUNDE = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false });
function etDatum(ms) { return ET_DATUM.format(new Date(ms)); }
function etVersatz(tag) { var p = tag.split('-').map(Number), mittag = Date.UTC(p[0], p[1] - 1, p[2], 17, 0); var h = (+ET_STUNDE.formatToParts(new Date(mittag)).filter(function (x) { return x.type === 'hour'; })[0].value) % 24; return 17 - h; }
function auf0930(tag) { var p = tag.split('-').map(Number); return Date.UTC(p[0], p[1] - 1, p[2], 9 + etVersatz(tag), 30); }
function sollMinVon(tag) { var e = K.kalender().close[tag], c = (e && e.close ? e.close : '16:00').split(':').map(Number); return c[0] * 60 + c[1] - 570; }
function minutenSeitAuf(ms) { return (ms - auf0930(etDatum(ms))) / MIN; }

/* ---------- Kunst-Reihe: Irrfahrt plus Mikrorauschen, keine Gerade ---------- */
function kunstReihe(tage, saat, o) {
  o = o || {};
  var rng = rngNeu(saat), P = o.start || 100, aus = [];
  var sRw = o.sigmaRw == null ? 0.0002 : o.sigmaRw, sN = o.sigmaN == null ? 0.0012 : o.sigmaN, vol = o.volMin == null ? 2564 : o.volMin;
  tage.forEach(function (tag) {
    var t0 = auf0930(tag), n = sollMinVon(tag), tagKerzen = [];
    for (var m = 0; m < n; m++) {
      var eroeffnung = P * (1 + sN * gauss(rng));
      P = P * Math.exp(sRw * gauss(rng));
      var schluss = P * (1 + sN * gauss(rng));
      var hoch = Math.max(eroeffnung, schluss) * (1 + Math.abs(sN * gauss(rng)) / 2);
      var tief = Math.min(eroeffnung, schluss) * (1 - Math.abs(sN * gauss(rng)) / 2);
      tagKerzen.push([t0 + m * MIN, r4(schluss), Math.round(vol * (0.5 + rng())), r4(hoch), r4(tief), r4(eroeffnung)]);
    }
    if (o.duenn && o.duenn.tag === tag) { var weg = tagKerzen.length - o.duenn.behalte, a = Math.floor((tagKerzen.length - weg) / 2); tagKerzen.splice(a, weg); }
    aus = aus.concat(tagKerzen);
  });
  return aus;
}
function r4(x) { return Math.round(x * 10000) / 10000; }
function kopiere(kerzen) { return kerzen.map(function (k) { return k.slice(); }); }

/* ---------- Stellvertreter fuer messen.messeDatei ---------- */
function messe(kerzen, dets, o) {
  o = o || {};
  var R = { reihe: o.reihe || 'KUNST', ordner: o.reihe || 'KUNST', lebend: o.lebend == null ? 1 : o.lebend, jahre: [2024], gruppe: 'kunst', art: 'CS', schnittMs: null, abMs: null };
  var g = { ok: true, kerzen: kerzen, quelle: 'roh', angewandt: new Set(), bytes: 0 };
  var warm = o.warm || { kerzen1m: [], tagesUmsatz: [] };
  var massnahmen = []; massnahmen.ende = null;
  var ctx = { kal: K.kalender(), dets: dets, F: { zaehler: M.leererZaehler() } };
  var delta = new M.Delta();
  var stat = M.messeDatei(R, g, warm, massnahmen, delta, ctx, Date.now() + 600000);
  return { stat: stat, delta: delta, Z: stat.zaehler, eintraege: dekodiereAlle(delta), topf: topfMittel(delta) };
}
function z1m(v) { return (v && typeof v === 'object') ? (v['1m'] || 0) : (v || 0); }
function dekodiere(idx) {
  var nTage = K.kalender().tage.length, r = idx;
  var lebend = r % 2; r = (r - lebend) / 2;
  var klasse = r % K.N_K; r = (r - klasse) / K.N_K;
  var tag = r % nTage; r = (r - tag) / nTage;
  var h = r % K.N_H; r = (r - h) / K.N_H;
  var dirIdx = r % 2; var reihe = (r - dirIdx) / 2;
  var art = Math.floor(reihe / K.N_KAND), kand = reihe % K.N_KAND;
  return { idx: idx, reihe: reihe, art: art, kand: kand, det: Math.floor(kand / K.N_ZR), zr: kand % K.N_ZR, dirIdx: dirIdx, dir: dirIdx === 0 ? 1 : -1, h: h, tag: tag, klasse: klasse, lebend: lebend };
}
function dekodiereAlle(delta) { var aus = []; delta.zellen.forEach(function (v, idx) { var e = dekodiere(idx); e.n = v[0]; e.s = v[1]; e.s2 = v[2]; e.h2 = v[3]; aus.push(e); }); return aus; }
function topfMittel(delta) {
  var nTage = K.kalender().tage.length, m = new Map();
  delta.topf.forEach(function (v, idx) { var r = idx, lebend = r % 2; r = (r - lebend) / 2; var klasse = r % K.N_K; r = (r - klasse) / K.N_K; var tag = r % nTage; r = (r - tag) / nTage; var h = r % K.N_H; var zr = (r - h) / K.N_H; m.set(zr + '|' + h + '|' + tag + '|' + klasse + '|' + lebend, { n: v[0], mittel: v[1] / v[0], tag: tag, zr: zr, h: h }); });
  return m;
}
function tagesreiheAusZellen(eintraege, art, det, zr, h, dirIdx, netto) {
  var je = {};
  eintraege.forEach(function (e) {
    if (e.art !== art || e.det !== det || e.zr !== zr || e.h !== h) return;
    if (dirIdx != null && e.dirIdx !== dirIdx) return;
    var z = je[e.tag] || (je[e.tag] = { n: 0, s: 0 }); z.n += e.n; z.s += e.s - (netto ? e.n * K.KLASSEN[e.klasse].huerde : 0);
  });
  var tage = Object.keys(je).map(Number).sort(function (a, b) { return a - b; }), n = 0, s = 0; tage.forEach(function (t) { n += je[t].n; s += je[t].s; });
  return { tage: tage, mittelJeTag: tage.map(function (t) { return je[t].s / je[t].n; }), n: n, jeSignal: n ? s / n : NaN, je: je };
}

/* ---------- Naive Nachrechnung der Regeln (unabhaengig von messen.js) ---------- */
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
function naiveSignale(kerzen, D, params) {
  var T = zerlegeTage(kerzen), kal = K.kalender();
  T.forEach(function (d, q) { d.dicht = (d.bis - d.von + 1) >= K.DICHTE_MIN * d.sollMin; d.klasse = q < K.UMSATZ_FENSTER ? -1 : K.klasseIndex(medianNaiv(T.slice(q - K.UMSATZ_FENSTER, q).map(function (x) { return x.umsatz; }))); });
  var bars = [], dichte = [];
  T.forEach(function (d) { if (!d.dicht) return; var von = bars.length; for (var q = d.von; q <= d.bis; q++) bars.push(kerzen[q]); dichte.push({ tag: d.tag, von: von, bis: bars.length - 1, auf: d.auf, schluss: d.schluss, klasse: d.klasse, sollMin: d.sollMin }); });
  var signale = [], letzt = -Infinity;
  dichte.forEach(function (d) {
    if (kal.idx[d.tag] === undefined || d.klasse < 0) return;
    for (var i = d.von; i < d.bis; i++) {
      var t = bars[i][0];
      if (t + MIN + K.MIN_REST_MIN * MIN > d.schluss) continue;
      if (t - letzt < K.COOLDOWN_MIN * MIN) continue;
      var s = D.signal(bars, i, params);
      if (!s || !s.dir) continue;
      letzt = t;
      signale.push({ i: i, dir: s.dir > 0 ? 1 : -1, tag: d.tag, tagIdx: kal.idx[d.tag], klasse: d.klasse, bis: d.bis });
    }
  });
  return { bars: bars, tage: dichte, signale: signale };
}
function rendite1h(bars, sg, falsch) {
  if (sg.i + 1 > sg.bis) return NaN;
  var ein = falsch ? bars[sg.i][1] : bars[sg.i + 1][5], ziel = bars[sg.i + 1][0] + 60 * MIN, j = sg.i + 2;
  while (j <= sg.bis && bars[j][0] < ziel) j++;
  if (j > sg.bis) return NaN;
  return sg.dir * (bars[j][5] - ein) / ein * 100;
}
function tagesreiheNaiv(signale, r, netto) {
  var je = {};
  signale.forEach(function (sg, q) { if (r[q] !== r[q]) return; var z = je[sg.tagIdx] || (je[sg.tagIdx] = { n: 0, s: 0 }); z.n++; z.s += r[q] - (netto ? K.KLASSEN[sg.klasse].huerde : 0); });
  var tage = Object.keys(je).map(Number).sort(function (a, b) { return a - b; }), n = 0, s = 0; tage.forEach(function (t) { n += je[t].n; s += je[t].s; });
  return { tage: tage, mittelJeTag: tage.map(function (t) { return je[t].s / je[t].n; }), n: n, jeSignal: n ? s / n : NaN };
}
/** Pflanzung am 1h-Ausstieg (Minutenstudie Nachtrag 3.2): Eroeffnung der Ausstiegskerze um dir*staerke verschoben. */
function pflanzeAusstieg(kerzen, signale, staerke) {
  var aus = kopiere(kerzen), gepflanzt = new Set(), belegt = new Set();
  var einstiege = new Set(signale.map(function (sg) { return sg.i + 1; }));
  signale.forEach(function (sg) {
    var ziel = kerzen[sg.i + 1][0] + 60 * MIN, j = sg.i + 2;
    while (j <= sg.bis && kerzen[j][0] < ziel) j++;
    if (j > sg.bis || einstiege.has(j) || belegt.has(j)) return;
    var f = 1 + sg.dir * staerke, o = r4(aus[j][5] * f);
    aus[j][5] = o; if (o > aus[j][3]) aus[j][3] = o; if (o < aus[j][4]) aus[j][4] = o;
    gepflanzt.add(sg.i); belegt.add(j);
  });
  return { kerzen: aus, gepflanzt: gepflanzt };
}

/* ---------- Gemeinsame Daten ---------- */
var DETS = K.detektoren();
function det(key) { return DETS.filter(function (d) { return d.key === key; })[0]; }
function detIdx(key) { return DETS.indexOf(det(key)); }
var AAPL = null;
function aapl2024() {
  if (AAPL) return AAPL;
  var R = L.reihen().filter(function (r) { return r.reihe === 'AAPL'; })[0];
  if (!R) throw new Error('AAPL nicht in L.reihen()');
  var g = L.ladeJahr(R, 2024);
  if (!g.ok) throw new Error('AAPL/2024 nicht lesbar: ' + g.grund);
  AAPL = { R: R, g: g, bars: { '1m': g.kerzen, '5m': L.verdichte(g.kerzen, '5m'), '15m': L.verdichte(g.kerzen, '15m') } };
  return AAPL;
}
var KUNST = {};
var H15 = 0, H1H = 1, H3H = 2, HS = 3, HN = 4;

/* ====================================================================================== */
abschnitt(0, 'Zellendecoder und Layout', function () {
  var nTage = K.kalender().tage.length, fehler = 0, rng = rngNeu(1);
  for (var q = 0; q < 2000; q++) {
    var reihe = Math.floor(rng() * K.N_REIHEN), dirIdx = Math.floor(rng() * 2), h = Math.floor(rng() * K.N_H), tag = Math.floor(rng() * nTage), klasse = Math.floor(rng() * K.N_K), lebend = Math.floor(rng() * 2);
    var e = dekodiere(K.zelle(nTage, reihe, dirIdx, h, tag, klasse, lebend));
    if (e.reihe !== reihe || e.dirIdx !== dirIdx || e.h !== h || e.tag !== tag || e.klasse !== klasse || e.lebend !== lebend) fehler++;
    if (K.reiheIndex(e.kand, e.art) !== reihe || K.kandIndex(e.det, e.zr) !== e.kand) fehler++;
  }
  pruefe(fehler === 0, '0a Decoder invertiert K.zelle/K.reiheIndex/K.kandIndex (2000 Stichproben, ' + fehler + ' Fehler)');
  pruefe(K.N_DET === 9 && K.N_H === 5 && K.N_KAND === 27 && K.N_REIHEN === 81 && K.N_KONFIG === 255 && K.H_UEBERNACHT === 4 && K.HALTEDAUERN[4].uebernacht === true, '0b Layout: 9 Detektoren, 5 Haltedauern (naechste = Uebernacht), 27 Kandidaten, 81 Zellenreihen, 255 Konfigurationen');
  pruefe(/^trendwende-ii-2026-09-09\/v1\/9x3x2x5x4x3\+kurs\+schein\+jahre$/.test(K.KONFIG_KENNUNG), '0c Kennung ' + K.KONFIG_KENNUNG);
  var mb = (K.zellenZahl(nTage) * 4 + K.topfZahl(nTage) * 3 + K.kursZahl(nTage) * 3) * 8 / 1e6;
  pruefe(mb > 500 && mb < 700, '0d Zellenspeicher ' + mb.toFixed(0) + ' MB je Prozess (Registrierung §10: ≈ 590)');
});

/* ====================================================================================== */
abschnitt(1, 'POSITIVKONTROLLE - gepflanzte Kante am 1h-Ausstieg wird in Groesse und Richtung wiedergefunden', function () {
  var kal = K.kalender();
  var tage = kal.tage.filter(function (t) { return t >= '2024-01-01'; }).slice(0, K.UMSATZ_FENSTER + 90);
  var roh = kunstReihe(tage, 20260912);
  pruefe(roh.length >= 110 * 300, '1a Kunst-Reihe: ' + tage.length + ' Kalendertage, ' + roh.length + ' Kerzen, keine Gerade (sd Minutenrenditen ' + f4(sd(roh.slice(0, 5000).map(function (k, i, a) { return i ? (k[1] / a[i - 1][1] - 1) * 100 : 0; }))) + ' Pp)');
  var wahl = null;
  ['W7', 'W1a'].forEach(function (key) {
    if (wahl) return;
    var D = det(key), p = K.paramsFuer(D, '1m'), n1 = naiveSignale(roh, D, p);
    var tageMit = new Set(n1.signale.map(function (s) { return s.tagIdx; })).size;
    console.log('   ' + key + ' ohne Pflanzung: ' + n1.signale.length + ' Signale auf ' + tageMit + ' Tagen');
    if (tageMit >= 30) wahl = { key: key, D: D, p: p, pass1: n1 };
  });
  if (!pruefe(!!wahl, '1b ein schlussbasierter Detektor feuert auf >= 30 Signaltagen der Kunst-Reihe')) return;
  var D = wahl.D, dI = detIdx(wahl.key);
  var klassen = new Set(wahl.pass1.tage.filter(function (d) { return d.klasse >= 0; }).map(function (d) { return d.klasse; }));
  pruefe(klassen.size === 1 && klassen.has(1), '1c Umsatzklasse der Kunst-Reihe ist 50-250');
  var STAERKE = 0.005;
  var pf = pflanzeAusstieg(roh, wahl.pass1.signale, STAERKE);
  var pass2 = naiveSignale(pf.kerzen, D, wahl.p);
  var gleich = pass2.signale.length === wahl.pass1.signale.length && pass2.signale.every(function (s, q) { return s.i === wahl.pass1.signale[q].i && s.dir === wahl.pass1.signale[q].dir; });
  pruefe(pf.gepflanzt.size >= 30 && gleich, '1d Pflanzung am Ausstieg: ' + pf.gepflanzt.size + ' von ' + wahl.pass1.signale.length + ' Signalen gepflanzt; Signalmenge nach der Pflanzung identisch (' + pass2.signale.length + ')');
  var r2 = pass2.signale.map(function (s) { return rendite1h(pass2.bars, s); }), rP = [], rN = [];
  pass2.signale.forEach(function (s, q) { if (r2[q] !== r2[q]) return; (pf.gepflanzt.has(s.i) ? rP : rN).push(r2[q]); });
  pruefe(rP.length >= 30 && Math.abs(mittel(rP) - STAERKE * 100) < 0.1 && (!rN.length || Math.abs(mittel(rN)) < 0.1), '1e gepflanzte Signale tragen die Kante: Mittel ' + f4(mittel(rP)) + ' Pp bei Soll ' + f4(STAERKE * 100) + ' (n ' + rP.length + '; ' + rN.length + ' ungepflanzte nahe null: ' + f4(mittel(rN)) + ')');
  var mp = messe(pf.kerzen, DETS);
  KUNST.gepflanzt = mp; KUNST.wahl = wahl; KUNST.tage = tage;
  pruefe(z1m(mp.stat.tageGewertet) === tage.length - K.UMSATZ_FENSTER && z1m(mp.Z.tageOhneKlasse) === K.UMSATZ_FENSTER && z1m(mp.Z.tageDuenn) === 0, '1f messeDatei wertet auf 1m ' + z1m(mp.stat.tageGewertet) + ' Tage (Soll ' + (tage.length - K.UMSATZ_FENSTER) + '), ohne Klasse ' + z1m(mp.Z.tageOhneKlasse) + ', duenn ' + z1m(mp.Z.tageDuenn));
  pruefe((mp.stat.signale[wahl.key] || [])[0] === pass2.signale.length, '1g Signalmenge: messeDatei ' + (mp.stat.signale[wahl.key] || [])[0] + ' = naive Nachrechnung ' + pass2.signale.length + ' (' + wahl.key + ' 1m)');
  var zNetto = tagesreiheAusZellen(mp.eintraege, 0, dI, 0, H1H, null, true), nNetto = tagesreiheNaiv(pass2.signale, r2, true);
  var diff = Math.abs(mittel(zNetto.mittelJeTag) - mittel(nNetto.mittelJeTag));
  pruefe(zNetto.n === nNetto.n && zNetto.tage.length === nNetto.tage.length && diff < 0.01, '1h Netto-Tagesmittel 1h: Zellen ' + f4(mittel(zNetto.mittelJeTag)) + ' Pp (n ' + zNetto.n + ', ' + zNetto.tage.length + ' Tage) = naiv ' + f4(mittel(nNetto.mittelJeTag)) + ' (n ' + nNetto.n + '), |Diff| ' + diff.toExponential(2));
  var zLong = tagesreiheAusZellen(mp.eintraege, 0, dI, 0, H1H, 0, false), zShort = tagesreiheAusZellen(mp.eintraege, 0, dI, 0, H1H, 1, false);
  pruefe(zLong.n > 0 && zLong.jeSignal > 0 && zShort.n > 0 && zShort.jeSignal > 0, '1i Richtung stimmt: Rohertrag long ' + f4(zLong.jeSignal) + ' Pp (n ' + zLong.n + '), short ' + f4(zShort.jeSignal) + ' Pp (n ' + zShort.n + ') - beide in Signalrichtung positiv');
  var sollNetto = STAERKE * 100 - K.KLASSEN[1].huerde;
  pruefe(Math.abs(mittel(zNetto.mittelJeTag) - sollNetto) < 0.05, '1j Groesse stimmt: Netto-Tagesmittel ' + f4(mittel(zNetto.mittelJeTag)) + ' Pp bei Soll ' + f4(sollNetto));
  var and = [H15, H3H, HS, HN].map(function (h) { return tagesreiheAusZellen(mp.eintraege, 0, dI, 0, h, null, false).jeSignal; });
  pruefe(and.every(function (x) { return Math.abs(x) < 0.05; }), '1k Gegenprobe: die Pflanzung sitzt nur in der 1h-Ausstiegskerze - 15m ' + f4(and[0]) + ', 3h ' + f4(and[1]) + ', schluss ' + f4(and[2]) + ', naechste ' + f4(and[3]) + ' Pp bleiben nahe null');
  var kn = 0, ks = 0, nT = kal.tage.length, kandIdx = K.kandIndex(dI, 0), von = kandIdx * 2 * nT * K.N_K * 2, bis = (kandIdx + 1) * 2 * nT * K.N_K * 2;
  mp.delta.kurs.forEach(function (v, idx) { if (idx >= von && idx < bis) { kn += v[0]; ks += v[1]; } });
  var einstiege = pass2.signale.map(function (s) { return pf.kerzen[s.i + 1][5]; }), sollSumme = einstiege.reduce(function (a, b) { return a + b; }, 0);
  pruefe(kn === einstiege.length && Math.abs(ks - sollSumme) < 1e-6, '1l Kurszellen: ' + kn + ' Signale mit Einstieg (naiv ' + einstiege.length + '), Summe ' + f4(ks) + ' (naiv ' + f4(sollSumme) + ')');
  var m0 = messe(roh, DETS);
  KUNST.roh = m0; KUNST.rohKerzen = roh;
  var z0 = tagesreiheAusZellen(m0.eintraege, 0, dI, 0, H1H, null, false);
  pruefe(z0.n > 0 && Math.abs(z0.jeSignal) < 0.05 && Math.abs(mittel(z0.mittelJeTag)) < 0.05, '1m ohne Pflanzung nahe null: Rohertrag je Signal ' + f4(z0.jeSignal) + ' Pp, Tagesmittel ' + f4(mittel(z0.mittelJeTag)) + ' (n ' + z0.n + ')');
  var zN = tagesreiheAusZellen(m0.eintraege, 0, dI, 0, HN, null, false), zS = tagesreiheAusZellen(m0.eintraege, 0, dI, 0, HS, null, false);
  pruefe(zN.n > 0 && zN.n < zS.n && Math.abs(zN.jeSignal) < 0.1, '1n Uebernacht ohne Pflanzung: n ' + zN.n + ' (< schluss-n ' + zS.n + ', letzter Tag offen), Rohertrag ' + f4(zN.jeSignal) + ' Pp nahe null; offen ' + m0.stat.offen.length);
});

/* ====================================================================================== */
abschnitt(2, 'PLACEBO A und B auf der Zufallsreihe ohne Pflanzung (alle 15 Zellen ZR x H)', function () {
  if (!KUNST.roh) { fehlt('2 kein ungepflanzter Lauf'); return; }
  var m0 = KUNST.roh, E = m0.eintraege, Z = m0.Z, pool = {};
  E.forEach(function (e) {
    if (e.art !== 1) return;
    var tm = m0.topf.get(e.zr + '|' + e.h + '|' + e.tag + '|' + e.klasse + '|' + e.lebend);
    if (!tm) { pool.ohneTopf = (pool.ohneTopf || 0) + 1; return; }
    var k = e.zr + '|' + e.h, p = pool[k] || (pool[k] = {}), z = p[e.tag] || (p[e.tag] = { num: 0, n: 0 });
    z.num += e.s - e.dir * e.n * tm.mittel; z.n += e.n;
  });
  pruefe(!pool.ohneTopf, '2a jede Placebo-Zelle hat einen Topf derselben (ZR, H, Tag, Klasse, lebend): ' + (pool.ohneTopf || 0) + ' ohne');
  var schlecht = [], zeilen = [], gesehen = 0;
  for (var zi = 0; zi < K.N_ZR; zi++) for (var h = 0; h < K.N_H; h++) {
    var p = pool[zi + '|' + h]; if (!p) { zeilen.push(K.ZEITRAHMEN[zi].key + '/' + K.HALTEDAUERN[h].key + ': keine Ziehung'); continue; }
    gesehen++;
    var tm = Object.keys(p).map(function (t) { return p[t].num / p[t].n; }), mw = mittel(tm), t = tWert(tm);
    zeilen.push(K.ZEITRAHMEN[zi].key + '/' + K.HALTEDAUERN[h].key + ' ' + f4(mw) + ' (t ' + f2(t) + ', ' + tm.length + ' Tage)');
    if (tm.length >= 20 && !(Math.abs(mw) < 0.05 && Math.abs(t) < 3)) schlecht.push(K.ZEITRAHMEN[zi].key + '/' + K.HALTEDAUERN[h].key);
  }
  console.log('   Placebo A gegen Topf: ' + zeilen.join(' | '));
  pruefe(schlecht.length === 0 && gesehen === 15, '2b Placebo A gepoolt je (ZR, H): |Tagesmittel| < 0,05 Pp und |t| < 3 in allen ' + gesehen + ' Zellen' + (schlecht.length ? ' - verfehlt: ' + schlecht.join(', ') : ''));
  var je = {};
  E.forEach(function (e) { if (e.h !== HS) return; var k = e.kand + '|' + e.tag, z = je[k] || (je[k] = { K: [0, 0], A: [0, 0], B: [0, 0] }); z[['K', 'A', 'B'][e.art]][e.dirIdx] += e.n; });
  var nPaare = 0, aFalsch = 0, bZuViel = 0, bFehl = 0, sigGesamt = 0, richtungFalsch = 0;
  Object.keys(je).forEach(function (k) { var z = je[k], kS = z.K[0] + z.K[1], aS = z.A[0] + z.A[1], bS = z.B[0] + z.B[1]; nPaare++; sigGesamt += kS; if (aS !== kS) aFalsch++; if (bS > kS) bZuViel++; bFehl += kS - bS; if (z.B[0] > z.K[0] || z.B[1] > z.K[1]) richtungFalsch++; });
  pruefe(nPaare > 100 && aFalsch === 0, '2c Placebo A: Ziehungen je (Kandidat, Tag) = Signale des Tages in ' + (nPaare - aFalsch) + ' von ' + nPaare + ' Paaren');
  pruefe(Z.placeboAGezogen === sigGesamt && sigGesamt === m0.stat.signaleGesamt, '2d Zaehler placeboAGezogen ' + Z.placeboAGezogen + ' = Signale aus den Zellen ' + sigGesamt + ' = stat.signaleGesamt ' + m0.stat.signaleGesamt);
  pruefe(bZuViel === 0 && bFehl === Z.placeboBOhnePartner && richtungFalsch === 0, '2e Placebo B: je (Kandidat, Tag) hoechstens so viele Ziehungen wie Signale, Fehlbetrag ' + bFehl + ' = ohnePartner ' + Z.placeboBOhnePartner + ', Richtung nie ueber der der Signale');
  pruefe(Z.placeboBGezogen + Z.placeboBOhnePartner === sigGesamt, '2f Placebo B: gezogen ' + Z.placeboBGezogen + ' + ohne Partner ' + Z.placeboBOhnePartner + ' = Signale ' + sigGesamt);
  /* Uebernacht-Zellen: Kandidat, Placebo A und B haben am letzten Tag keine Beobachtung, sonst genau eine je Ziehung */
  var letzt = Math.max.apply(null, E.map(function (e) { return e.tag; }));
  var nN = 0, nS = 0, amLetzten = 0;
  E.forEach(function (e) { if (e.h === HN) { nN += e.n; if (e.tag === letzt) amLetzten += e.n; } if (e.h === HS) nS += e.n; });
  pruefe(amLetzten === 0 && nN > 0 && nN < nS && m0.stat.offen.length > 0, '2g Uebernacht-Zellen: ' + nN + ' Beobachtungen (< schluss ' + nS + '), am letzten Tag 0 (offen: ' + m0.stat.offen.length + ' Beitraege inkl. Topf)');
});

/* ====================================================================================== */
abschnitt(3, 'GEGENPROBE GETEILTER KURS - Signalschluss als Einstieg erzeugt den Scheineffekt (W7 long am 60-Kerzen-Tief)', function () {
  if (!KUNST.roh) { fehlt('3 kein ungepflanzter Lauf'); return; }
  var roh = KUNST.rohKerzen, D = det('W7'), p = K.paramsFuer(D, '1m'), n1 = naiveSignale(roh, D, p);
  var longs = n1.signale.filter(function (s) { return s.dir > 0; });
  if (!pruefe(longs.length >= 30, '3a W7 hat >= 30 Long-Signale auf der Zufallsreihe (' + longs.length + ')')) return;
  var richtig = [], falsch = [];
  longs.forEach(function (s) { var r = rendite1h(n1.bars, s), f = rendite1h(n1.bars, s, true); if (r === r && f === f) { richtig.push(r); falsch.push(f); } });
  var mR = mittel(richtig), mF = mittel(falsch);
  console.log('   W7 long 1m: n ' + richtig.length + ', richtig ' + f4(mR) + ' Pp, falsch ' + f4(mF) + ' Pp');
  pruefe(mF > 0.05 && mF - mR >= 0.05, '3b FALSCH (Einstieg Signalschluss) ' + f4(mF) + ' Pp > +0,05 und ' + f4(mF - mR) + ' ueber RICHTIG - der Scheineffekt entsteht in behaupteter Richtung');
  pruefe(Math.abs(mR) < 0.05, '3c RICHTIG (Einstieg Eroeffnung i+1) nahe null: ' + f4(mR) + ' Pp');
  var z = tagesreiheAusZellen(KUNST.roh.eintraege, 0, detIdx('W7'), 0, H1H, 0, false);
  pruefe(z.n === richtig.length && Math.abs(z.jeSignal - mR) < 0.001, '3d messen.js-Zelle (W7 1m long 1h) ' + f4(z.jeSignal) + ' Pp bei n ' + z.n + ' = eigene Rechnung ' + f4(mR) + ' bei n ' + richtig.length);
});

/* ====================================================================================== */
abschnitt(4, 'DETEKTOR-GLEICHHEIT: W2/W3/W8 gegen die August-Funktionen, W2 gegen signalPraefix, W1a gegen hauptstudie.js detect()', function () {
  var b = aapl2024().bars['5m'];
  var quelle = fs.readFileSync(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'), 'utf8');
  function konst(name) { var m = quelle.match(new RegExp('var ' + name + ' = (\\{[^}]*\\});')); if (!m) throw new Error(name + ' nicht in _tabelle.js'); return new Function('return ' + m[1])(); }
  var P_KAPI = konst('P_KAPI'), P_KT = konst('P_KANALTREND');
  function dirTab(s) { return s && s.dir ? (s.dir > 0 ? 1 : -1) : 0; }
  pruefe(det('W2').signal === TAB.filter(function (x) { return x.key === 'wendepunkt-trendwechsel'; })[0].signal && det('W3').signal === TAB.filter(function (x) { return x.key === 'kapitulation'; })[0].signal && det('W8').signal === TAB.filter(function (x) { return x.key === 'kanaltrend'; })[0].signal, '4a W2/W3/W8 sind DIESELBEN Funktionsobjekte wie in der August-Tabelle (require, keine Kopie)');
  [{ key: 'W3', ref: function (i) { var s = Q.einstiegSignal(b, i, P_KAPI); return s && s.dir === 'call' ? 1 : 0; } },
   { key: 'W8', ref: function (i) { var s = Q.einstiegSignal(b, i, Object.assign({}, P_KT, { MINQ: 60 })); return s && s.dir ? (s.dir === 'call' ? 1 : -1) : 0; } }].forEach(function (f) {
    var D = det(f.key), p = K.paramsFuer(D, '5m'), n = 0, sig = 0, abw = 0;
    for (var i = 260; i < b.length; i += 1) { var a = dirTab(D.signal(b, i, p)), r = f.ref(i); n++; if (a) sig++; if (a !== r) abw++; }
    var txt = '4b ' + f.key + ' gegen Q.einstiegSignal (5m, ' + n + ' Indizes): ' + sig + ' Signale, ' + abw + ' Abweichungen';
    if (sig === 0 && abw === 0) ueber(txt + ' - nur null verglichen'); else pruefe(n >= 3000 && abw === 0, txt);
  });
  /* W2 gegen signalPraefix (Referenz = Q.trendwechsel auf dem Praefix) - Stichprobe plus alle Fundstellen */
  var D2 = det('W2'), p2 = K.paramsFuer(D2, '5m'), menge = new Set(), rng = rngNeu(7);
  for (var q = 0; q < 700; q++) menge.add(60 + Math.floor(rng() * (b.length - 60)));
  for (var i2 = 60; i2 < b.length; i2 += 2) { var s2 = D2.signal(b, i2, p2); if (s2) menge.add(i2); }
  var abw2 = 0, sig2 = 0, n2 = 0, ersteAbw = null;
  menge.forEach(function (i) {
    var a = dirTab(D2.signal(b, i, p2)), r = dirTab(WP.signalPraefix(b, i, { S: 1.0, F: 5 })); n2++;
    if (a) sig2++;
    /* die Tabelle liefert nur die ERSTE Kerze je Abschnitt; die Referenz meldet an jeder Kerze mit stehender Bedingung:
     * jedes Tabellen-Signal muss die Referenz haben (a != 0 => r == a), nicht umgekehrt. */
    if (a && a !== r) { abw2++; if (!ersteAbw) ersteAbw = i; }
  });
  pruefe(n2 >= 700 && sig2 > 0 && abw2 === 0, '4c W2 (5m): jedes der ' + sig2 + ' Tabellen-Signale hat dieselbe Richtung wie signalPraefix (Q.trendwechsel auf bars[0..i]); ' + n2 + ' Indizes, ' + abw2 + ' Abweichungen' + (ersteAbw != null ? ' (erste i=' + ersteAbw + ')' : ''));
  /* W1a gegen detect() aus hauptstudie.js (Textextraktion; das Skript selbst liest den App-Store und wird nicht geladen) */
  var hs = fs.readFileSync(path.join(K.REPO, 'studien', '33-winkel-detektor', 'hauptstudie.js'), 'utf8');
  var von = hs.indexOf('function detect(bars, S, F, dayEnd)'), bis = hs.indexOf('return sigs;\n}', von);
  if (!pruefe(von > 0 && bis > von, '4d detect() in hauptstudie.js gefunden')) return;
  var detect = new Function('Q', 'COOLDOWN', 'MIN_REST', 'winkel', hs.slice(von, bis + 'return sigs;\n}'.length) + '\nreturn detect;')(Q, 60, 30, function (k) { return k.steigung * k.n / k.breite; });
  var k1 = aapl2024().bars['1m'], T = L.tageAus(k1), dayEnd = new Int32Array(k1.length);
  T.forEach(function (d) { for (var q = d.von; q <= d.bis; q++) dayEnd[q] = d.bis; });
  var soll = detect(k1, 0.5, 6, dayEnd);
  var D1 = det('W1a'), p1 = K.paramsFuer(D1, '1m');
  /* Scan A: Kerzen-Cooldown wie detect() (i - lastSig < 60), MIN_REST in Kerzen - nur die Zustandsregel unterscheidet sich */
  var scanA = [], last = -1e9;
  for (var i3 = 0; i3 < k1.length; i3++) {
    if (i3 - last < 60) continue;
    var s3 = D1.signal(k1, i3, p1); if (!s3) continue;
    if (dayEnd[i3] - i3 < 30) continue;
    last = i3; scanA.push({ i: i3, dir: s3.dir });
  }
  var sollKey = new Set(soll.map(function (s) { return s.i + '|' + s.dir; })), aKey = new Set(scanA.map(function (s) { return s.i + '|' + s.dir; }));
  var nurSoll = soll.filter(function (s) { return !aKey.has(s.i + '|' + s.dir); }), nurA = scanA.filter(function (s) { return !sollKey.has(s.i + '|' + s.dir); });
  var gemeinsam = soll.length - nurSoll.length, anteil = (nurSoll.length + nurA.length) / Math.max(1, soll.length);
  console.log('   detect(): ' + soll.length + ' Signale; Scan A: ' + scanA.length + '; gemeinsam ' + gemeinsam + '; nur detect ' + nurSoll.length + ', nur Scan ' + nurA.length);
  pruefe(soll.length > 100 && anteil <= 0.03, '4e W1a zeilengleich zu detect() (AAPL/2024 1m, S 0,5 / F 6): ' + gemeinsam + ' von ' + soll.length + ' Signalen identisch (Index und Richtung), Abweichungen ' + (nurSoll.length + nurA.length) + ' = ' + (100 * anteil).toFixed(2) + ' % (zulaessig ≤ 3 %, Nachtrag 1; nur die Cooldown-Zustandsregel)');
  /* Jede Abweichung muss der Cooldown-Klasse angehoeren: ein detect-Signal fehlt im Scan nur, wenn die Bedingung im selben Abschnitt
   * an einer Kerze stand, die im Scan noch im Cooldown lag (der Scan schliesst den Abschnitt dann, detect nicht). */
  var erklaert = 0;
  nurSoll.forEach(function (s) {
    var W = DT.helfer.wpListe(k1, 6), lo = 0, hi = W.liste.length; while (lo < hi) { var m = (lo + hi) >> 1; if (W.liste[m] + 6 <= s.i) lo = m + 1; else hi = m; }
    var wLetzt = W.liste[lo - 1], wAlt = W.alt[W.liste[lo - 2] + '|' + wLetzt];
    for (var j = Math.max(wLetzt + 10, wLetzt + 6); j < s.i; j++) if (DT.helfer.winkelBedingung(k1, wLetzt, wAlt, j, 0.5)) { erklaert++; break; }
  });
  /* Scan-Signale ohne detect-Gegenstueck sind Folgen derselben Regel: detect() liegt nach einem seiner Mehr-Signale 60 Kerzen im Cooldown. */
  var erklaertA = nurA.filter(function (s) { return nurSoll.some(function (d) { return s.i > d.i && s.i - d.i < 60; }); }).length;
  pruefe(erklaert === nurSoll.length && erklaertA === nurA.length, '4f alle ' + nurSoll.length + ' detect-Signale, die der Scan nicht hat, liegen in einem Abschnitt, in dem die Bedingung frueher stand (Cooldown-Zustandsregel): ' + erklaert + ' erklaert; ' + nurA.length + ' Scan-Signale ohne detect-Gegenstueck liegen im detect-Cooldown eines solchen Signals: ' + erklaertA + ' erklaert');
  /* Scan B (die Regeln des Laufs: Minuten-Cooldown, Zulaessigkeit je Tag) gegen Scan A ab dem 21. Tag (davor hat die
   * Einzeldatei keine Umsatzklasse): nur der Cooldown ueber die Tagesgrenze unterscheidet (Kerzen gegen Minuten). */
  var nB = naiveSignale(k1, D1, p1), abTag = T[K.UMSATZ_FENSTER].von, bKey = new Set(nB.signale.map(function (s) { return s.i + '|' + s.dir; }));
  var scanA20 = scanA.filter(function (s) { return s.i >= abTag; });
  var diffB = scanA20.filter(function (s) { return !bKey.has(s.i + '|' + s.dir); }).length + nB.signale.filter(function (s) { return !aKey.has(s.i + '|' + s.dir); }).length;
  pruefe(nB.signale.length > 100 && diffB / Math.max(1, scanA20.length) <= 0.05, '4g Laufregeln (Minuten-Cooldown, Zulaessigkeit je Tag) gegen Kerzen-Cooldown ab dem 21. Tag: ' + nB.signale.length + ' gegen ' + scanA20.length + ' Signale, ' + diffB + ' verschieden (' + (100 * diffB / Math.max(1, scanA20.length)).toFixed(2) + ' %, nur Tagesgrenze; zulaessig ≤ 5 %)');
});

/* ====================================================================================== */
abschnitt(5, 'VORFILTER W8 (signalCross) gegen den vollen Aufruf auf 1m, 5m, 15m', function () {
  var Adat = aapl2024();
  K.ZEITRAHMEN.forEach(function (zr) {
    var b = Adat.bars[zr.key], Dk = det('W8'), pk = K.paramsFuer(Dk, zr.key), schritt = Math.max(1, Math.floor(b.length / 3000)), menge = new Set();
    for (var j = 261; j < b.length; j += schritt) menge.add(j);
    for (var q = 261; q < b.length; q += Math.max(1, Math.floor(schritt / 4))) { var s = M.rufe(Dk, pk, b, q); if (s && s.dir) menge.add(q); }
    var abw = 0, sig = 0, n = 0;
    menge.forEach(function (i) { var a = M.rufe(Dk, pk, b, i), r = Dk.signal(b, i, pk); n++; var da = a && a.dir ? a.dir : 0, dr = r && r.dir ? r.dir : 0; if (dr) sig++; if (da !== dr) abw++; });
    var txt = '5 W8 ' + zr.key + ': ' + n + ' Indizes, ' + sig + ' Signale (voller Aufruf), ' + abw + ' Abweichungen';
    if (sig === 0 && abw === 0) ueber(txt + ' - nur null verglichen'); else pruefe(n >= 400 && abw === 0, txt);
  });
});

/* ====================================================================================== */
abschnitt(6, 'PRAEFIX-PROBE aller neun Detektoren: signal(bars.slice(0, i+1), i) = signal(bars, i), >= 1.000 Stichproben je Detektor', function () {
  var Adat = aapl2024(), kunst = KUNST.rohKerzen || kunstReihe(K.kalender().tage.filter(function (t) { return t >= '2024-01-01'; }).slice(0, 40), 5);
  var quellen = [['AAPL 1m', Adat.bars['1m'], '1m'], ['AAPL 5m', Adat.bars['5m'], '5m'], ['AAPL 15m', Adat.bars['15m'], '15m'], ['Kunst 1m', kunst, '1m']];
  DETS.forEach(function (D) {
    var n = 0, sig = 0, abw = 0, erste = null;
    quellen.forEach(function (qu) {
      var b = qu[1], p = K.paramsFuer(D, qu[2]), rng = rngNeu(fnvSaat(D.key + qu[0])), idx = [];
      var je = qu[2] === '1m' ? 330 : (qu[2] === '5m' ? 220 : 160);
      for (var k = 0; k < je; k++) idx.push(300 + Math.floor(rng() * (b.length - 300)));
      for (var e = 1; e <= 5; e++) idx.push(b.length - e);                                   // Reihenende
      var gefunden = 0;
      for (var q = 300; q < b.length && gefunden < 60; q += 7) { var s = D.signal(b, q, p); if (s) { idx.push(q); gefunden++; } }   // Fundstellen
      idx.forEach(function (i) {
        var voll = D.signal(b, i, p), prae = D.signal(b.slice(0, i + 1), i, p); n++;
        var dv = voll && voll.dir ? voll.dir : 0, dp = prae && prae.dir ? prae.dir : 0;
        if (dv) sig++;
        if (dv !== dp) { abw++; if (!erste) erste = qu[0] + ' i=' + i + ' voll ' + dv + ' / praefix ' + dp; }
      });
    });
    pruefe(n >= 1000 && abw === 0, '6 ' + D.key + ': ' + n + ' Stichproben, ' + sig + ' Signale, ' + abw + ' Abweichungen zwischen vollem und Praefix-Aufruf' + (erste ? ' - erste ' + erste : ''));
  });
});
function fnvSaat(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/* ====================================================================================== */
abschnitt(7, 'KLASSEN, KASSA-HUERDEN (kosten.js, liquide.js, wiki/kosten.md) und SCHEIN-HUERDEN (BERICHT.md)', function () {
  var kt = fs.readFileSync(path.join(K.REPO, 'kosten.js'), 'utf8');
  var re = /\{\s*name:\s*'([^']+)',\s*von:\s*([0-9.e]+|Infinity),\s*bis:\s*([0-9.e]+|Infinity)\s*\}/g, m, zeilen = [];
  while ((m = re.exec(kt))) zeilen.push({ name: m[1], von: Number(m[2]), bis: Number(m[3]) });
  pruefe(zeilen.length === K.KLASSEN.length && K.KLASSEN.every(function (k, i) { return zeilen[i] && zeilen[i].name === k.name && zeilen[i].von === k.von && zeilen[i].bis === k.bis; }), '7a K.KLASSEN-Grenzen = kosten.js UMSATZ_KLASSEN: ' + zeilen.map(function (z) { return z.name; }).join(', '));
  pruefe(K.klasseIndex(4.99e6) === -1 && K.klasseIndex(NaN) === -1 && K.klasseIndex(5e6) === 0 && K.klasseIndex(50e6) === 1 && K.klasseIndex(250e6) === 2 && K.klasseIndex(1e9) === 3, '7b klasseIndex: -1 unter 5 Mio $ und bei NaN, Grenzen zur oberen Klasse');
  pruefe(Liquide.medianUmsatz([[0, 30, 100], [0, 10, 100], [0, 40, 100], [0, 20, 100]], 3, 4) === 3000 && K.UMSATZ_FENSTER === Liquide.KORB.fenster, '7c Liquide.medianUmsatz = sortiert[n>>1]; UMSATZ_FENSTER ' + K.UMSATZ_FENSTER + ' = KORB.fenster');
  var md = fs.readFileSync(path.join(K.REPO, 'wiki', 'kosten.md'), 'utf8').split(/\r?\n/);
  function tabelleAus(zeilenText, ueberschrift) {
    var start = -1; for (var i = 0; i < zeilenText.length; i++) if (ueberschrift.test(zeilenText[i]) && /^#/.test(zeilenText[i])) { start = i; break; }
    if (start < 0) throw new Error('Ueberschrift nicht gefunden: ' + ueberschrift);
    var rows = [], drin = false;
    for (var j = start + 1; j < zeilenText.length; j++) { var z = zeilenText[j].trim(); if (/^\|/.test(z)) { drin = true; rows.push(z.split('|').slice(1, -1).map(function (c) { return c.replace(/\*\*/g, '').trim(); })); } else if (drin) break; if (/^#/.test(z)) break; }
    return rows.slice(2);
  }
  function zahl(c) { return parseFloat(c.replace(',', '.')); }
  function vergleiche(bez, ueberschrift, spalte, feld) {
    var rows = tabelleAus(md, ueberschrift), je = {}; rows.forEach(function (r) { je[r[0]] = zahl(r[spalte]); });
    var fehl = K.KLASSEN.filter(function (k) { return !(Math.abs(je[k.name] - k[feld]) < 1e-9); });
    pruefe(rows.length >= 4 && fehl.length === 0, bez + ': ' + K.KLASSEN.map(function (k) { return k.name + ' ' + f4(k[feld]); }).join(', '));
  }
  vergleiche('7d huerde (mitte ab 2021) gegen kosten.md "Das K der Kostenformel"', /Das K der Kostenformel/, 2, 'huerde');
  vergleiche('7e huerdeSchluss gegen kosten.md "Die Schluss-Huerde je Klasse"', /Die Schluss-H.rde je Klasse/, 1, 'huerdeSchluss');
  vergleiche('7f eroeffnungFaktor gegen kosten.md "Je Klasse x Fenster"', /Je Klasse . Fenster/, 4, 'eroeffnungFaktor');
  pruefe(K.KLASSEN.every(function (k, i) { return K.huerdeFenster(i, 0, 390) === k.huerdeEroeffnung && K.huerdeFenster(i, 30, 390) === k.huerde && K.huerdeFenster(i, 360, 390) === k.huerdeSchluss && K.huerdeFenster(i, 180, 210) === k.huerdeSchluss; }), '7g huerdeFenster: Eroeffnung / mitte / Schluss (Halbtag ab 12:30)');
  pruefe(Math.abs(K.centBodenPp(3) - 100 * K.CENT_BODEN_USD / 3) < 1e-12 && K.ueberCentBoden(3, 0) === true && K.ueberCentBoden(180, 0) === false, '7h Cent-Boden 100 x 0,005 / Kurs, Vergleich gegen die Huerde der Klasse');
  /* Schein-Huerden aus BERICHT.md, Tabelle "Produkt | Hebel | 3 h | 1 Tag | ..." */
  var ber = fs.readFileSync(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'BERICHT.md'), 'utf8').split(/\r?\n/);
  var kopfIdx = -1; for (var bi = 0; bi < ber.length; bi++) if (/^\|\s*Produkt\s*\|\s*Hebel\s*\|\s*3 h\s*\|\s*1 Tag/.test(ber[bi])) { kopfIdx = bi; break; }
  if (!pruefe(kopfIdx > 0, '7i BERICHT.md: Tabelle "Produkt | Hebel | 3 h | 1 Tag" gefunden (Zeile ' + (kopfIdx + 1) + ')')) return;
  var rows = []; for (var ri = kopfIdx + 2; ri < ber.length && /^\|/.test(ber[ri]); ri++) rows.push(ber[ri].split('|').slice(1, -1).map(function (c) { return c.replace(/\*\*/g, '').trim(); }));
  K.SCHEINE.forEach(function (s) {
    var r = rows.filter(function (x) { return s.berichtZeile.test(x[0]); })[0];
    pruefe(!!r && Math.abs(zahl(r[1]) - s.hebel) < 1e-9 && Math.abs(zahl(r[2]) - s.kurz) < 1e-9 && Math.abs(zahl(r[3]) - s.tag) < 1e-9, '7j ' + s.name + ': Hebel ' + s.hebel + ', 3 h ' + s.kurz + ', 1 Tag ' + s.tag + ' = BERICHT.md Zeile "' + (r ? r[0] : '?') + '" (' + (r ? r.slice(1, 4).join(' / ') : '-') + ')');
  });
  pruefe(K.scheinHuerde('bv1', '15m') === 0.05 && K.scheinHuerde('bv1', '1h') === 0.05 && K.scheinHuerde('bv1', '3h') === 0.05 && K.scheinHuerde('bv1', 'schluss') === 0.16 && K.scheinHuerde('bv1', 'naechste') === 0.16 && K.scheinHuerde('standard', '3h') === 0.23 && K.scheinHuerde('standard', 'naechste') === 0.42, '7k scheinHuerde: 15m/1h/3h = 3-h-Wert, schluss/naechste = Tageswert (BV 1,0: 0,05 / 0,16; Standard: 0,23 / 0,42)');
  var st = { brutto: { mittel: 0.30, se: 0.10, obere: 0.30 + 1.96 * 0.10 } }, sw = A.scheinWerte(st, 'standard', '3h');
  pruefe(Math.abs(sw.mittel - 0.07) < 1e-12 && Math.abs(sw.t - 0.7) < 1e-12 && Math.abs(sw.obere - (0.496 - 0.23)) < 1e-12, '7l scheinWerte: Brutto 0,30 − 0,23 = 0,07, t 0,70, obere Grenze 0,266');
});

/* ====================================================================================== */
abschnitt(8, 'AUGUST-KONSTANTEN gegen messgeschirr.js; Haltedauern', function () {
  var mg = fs.readFileSync(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'messgeschirr.js'), 'utf8');
  var cd = mg.match(/COOLDOWN\s*=\s*\{\s*'1m':\s*(\d+)/), mr = mg.match(/MIN_REST\s*=\s*\{\s*'1m':\s*(\d+)/);
  pruefe(cd && +cd[1] === K.COOLDOWN_MIN && mr && +mr[1] === K.MIN_REST_MIN && K.DICHTE_MIN === 0.8, '8a COOLDOWN_MIN ' + K.COOLDOWN_MIN + ', MIN_REST_MIN ' + K.MIN_REST_MIN + ' = messgeschirr 1m; DICHTE_MIN 0,8');
  var hd = K.HALTEDAUERN;
  pruefe(hd.length === 5 && hd[0].min === 15 && hd[1].min === 60 && hd[2].min === 180 && hd[3].min === null && !hd[3].uebernacht && hd[4].min === null && hd[4].uebernacht === true && hd[4].key === 'naechste', '8b HALTEDAUERN 15m / 1h / 3h / schluss / naechste (Uebernacht)');
  pruefe(K.lagVon(0) === 1 && K.lagVon(3) === 1 && K.lagVon(4) === 2, '8c Lag fuer momente(): intraday 1 (naiv), Uebernacht 2 (Hansen-Hodrick bis Lag 1)');
});

/* ====================================================================================== */
abschnitt(9, 'FORTSETZBARKEIT in Kindprozessen (Mini-Archiv, Uebernacht ueber die Jahresgrenze, Fortsetzung, fremde Kennung)', function () {
  var wurzel = path.join(KRATZ, 'kunstarchiv'), roh = path.join(wurzel, 'alpaca1m');
  var kalQuelle = path.join(K.ORTE.roh(), '_kalender.json');
  if (!fs.existsSync(kalQuelle)) { ueber('9 echter Kalender nicht erreichbar'); return; }
  fs.rmSync(wurzel, { recursive: true, force: true }); fs.mkdirSync(roh, { recursive: true });
  fs.copyFileSync(kalQuelle, path.join(roh, '_kalender.json'));
  var kal = K.kalender(), tage23 = kal.tage.filter(function (t) { return t >= '2023-01-01' && t < '2024-01-01'; }).slice(-24), tage24 = kal.tage.filter(function (t) { return t >= '2024-01-01'; }).slice(0, 10);
  var lebenszeit = { stand: new Date().toISOString(), bisJahr: 2024, werte: {} }, symbole = { stand: new Date().toISOString(), gruppe: {}, ordner: {} };
  ['AAPL', 'MSFT'].forEach(function (sym, si) {
    fs.mkdirSync(path.join(roh, sym), { recursive: true });
    var alle = [];
    [[2023, tage23], [2024, tage24]].forEach(function (jt) {
      var kerzen = kunstReihe(jt[1], 900 + si * 10 + jt[0]), T = zerlegeTage(kerzen);
      var datei = { sym: sym, format: 2, series: kerzen, sitzungen: T.map(function (d) { return { von: kerzen[d.von][0], bis: kerzen[d.bis][0], sitzung: 'regulaer' }; }), jahr: jt[0] };
      fs.writeFileSync(path.join(roh, sym, jt[0] + '.json'), JSON.stringify(datei));
      alle = alle.concat(kerzen);
    });
    lebenszeit.werte[sym] = { balken: tage23.length + tage24.length, erster: alle[0][0], letzter: alle[alle.length - 1][0], jahre: [2023, 2024] };
    symbole.gruppe[sym] = 'universum';
  });
  fs.writeFileSync(path.join(roh, '_lebenszeit.json'), JSON.stringify(lebenszeit));
  fs.writeFileSync(path.join(roh, '_symbole.json'), JSON.stringify(symbole));
  var env = Object.assign({}, process.env, { MD_ALPACA_WURZEL: wurzel });
  var a = path.join(KRATZ, 'lauf-a'), b = path.join(KRATZ, 'lauf-b'), d = path.join(KRATZ, 'lauf-d');
  [a, b, d].forEach(function (o) { fs.rmSync(o, { recursive: true, force: true }); });
  function kind(args) { var r = cp.spawnSync(process.execPath, [path.join(K.HIER, 'messen.js')].concat(args), { env: env, cwd: K.HIER, encoding: 'utf8', timeout: 900000, maxBuffer: 64 * 1024 * 1024 }); return { status: r.status, out: (r.stdout || '') + (r.stderr || '') }; }
  function fortschritt(o) { return JSON.parse(fs.readFileSync(path.join(o, '_fortschritt.json'), 'utf8')); }
  var ra = kind(['--aus', a, '--max', '2', '--neu', '--checkpoint', '1']), Fa = ra.status === 0 ? fortschritt(a) : null;
  pruefe(ra.status === 0 && Fa && Fa.dateien === 2 && Fa.beendet === 'max erreicht', '9a Lauf (a) --max 2: Rueckgabe ' + ra.status + ', ' + (Fa && Fa.dateien) + ' Dateien, beendet "' + (Fa && Fa.beendet) + '"');
  if (ra.status !== 0) console.log(ra.out.slice(-2000));
  var rb = kind(['--aus', a]), Fb = rb.status === 0 ? fortschritt(a) : null;
  pruefe(rb.status === 0 && Fb && Fb.dateien === 4 && Fb.beendet === 'vollstaendig' && /FORTSETZUNG: 2 Dateien erledigt/.test(rb.out), '9b Lauf (b) Fortsetzung nach AAPL: ' + (Fb && Fb.dateien) + ' Dateien, "' + (Fb && Fb.beendet) + '"');
  var rc = kind(['--aus', b, '--neu']), Fc = rc.status === 0 ? fortschritt(b) : null;
  pruefe(rc.status === 0 && Fc && Fc.dateien === 4 && Fc.beendet === 'vollstaendig', '9c Lauf (c) am Stueck: ' + (Fc && Fc.dateien) + ' Dateien');
  if (Fb && Fc) {
    var za = fs.readFileSync(path.join(a, '_zellen.bin')), zb = fs.readFileSync(path.join(b, '_zellen.bin'));
    var spB = M.Speicher.lade(path.join(b, '_zellen.bin'), kal.tage.length, Fc.zellenStand);
    var nSumme = 0; for (var i = 0; i < spB.n.length; i++) nSumme += spB.n[i];
    pruefe(za.length === zb.length && za.subarray(0, za.length - 8).equals(zb.subarray(0, zb.length - 8)) && nSumme > 0, '9d _zellen.bin (a+b) und (c) BYTEIDENTISCH bis auf den Stand-Schwanz (Summe n ' + nSumme + ') - die Fortsetzung an der Reihengrenze verliert nichts');
    pruefe(Fc.zaehler.uebernachtOffen > 0 && Fc.zaehler.uebernachtVerbucht > 0 && Fc.zaehler.fortsetzungOhneUebernacht === 0 && Fb.zaehler.fortsetzungOhneUebernacht === 0, '9e Uebernacht ueber die Jahresgrenze: offen ' + Fc.zaehler.uebernachtOffen + ', in der Folgedatei verbucht ' + Fc.zaehler.uebernachtVerbucht + ', verfallen ' + Fc.zaehler.uebernachtVerfallen + ' (letzte Datei je Reihe), Fortsetzungen ohne Uebergabe 0');
    /* naive Nachrechnung: Uebernacht-Ertrag des letzten 2023-Tages muss aus der Eroeffnung des ersten 2024-Tages kommen -
     * der Topf poolt BEIDE Kunst-Reihen derselben Zelle (Tag, Klasse, lebend), also beide nachrechnen. */
    var nT = kal.tage.length, sumTopf = 0, nTopf = 0, tagIdx = -1, folgt = true, oB = null;
    ['AAPL', 'MSFT'].forEach(function (sym) {
      var kA = JSON.parse(fs.readFileSync(path.join(roh, sym, '2023.json'), 'utf8')).series, kB = JSON.parse(fs.readFileSync(path.join(roh, sym, '2024.json'), 'utf8')).series;
      var TA = zerlegeTage(kA), dl = TA[TA.length - 1], o = kB[0][5]; if (oB == null) oB = o;
      tagIdx = kal.idx[dl.tag]; if (kal.idx[zerlegeTage(kB)[0].tag] !== tagIdx + 1) folgt = false;
      for (var q = dl.von; q < dl.bis; q++) if (kA[q][0] + MIN + K.MIN_REST_MIN * MIN <= dl.schluss) { sumTopf += (o - kA[q + 1][5]) / kA[q + 1][5] * 100; nTopf++; }
    });
    var idxT = K.topfZelle(nT, 0, HN, tagIdx, 1, 0);                                    // lebend 0: die Kunst-Reihen enden 2024
    pruefe(folgt && spB.tn[idxT] === nTopf && Math.abs(spB.ts[idxT] - sumTopf) < 1e-6, '9f Topf-Zelle naechste am letzten 2023-Tag (1m, Klasse 50-250, nicht lebend, beide Reihen): n ' + spB.tn[idxT] + ' = naiv ' + nTopf + ', Summe ' + f4(spB.ts[idxT]) + ' = naiv ' + f4(sumTopf) + ' (Ausstieg = Eroeffnung des ersten 2024-Tages, AAPL ' + oB + ')');
  }
  /* (d) Fortsetzung mitten in einer Reihe: --max 3, dann weiter -> MSFT/2024 ohne Uebergabe, nur naechste-Zellen weichen ab */
  var rd = kind(['--aus', d, '--max', '3', '--neu', '--checkpoint', '1']), rd2 = rd.status === 0 ? kind(['--aus', d]) : null, Fd = rd2 && rd2.status === 0 ? fortschritt(d) : null;
  if (Fd && Fc) {
    var spD = M.Speicher.lade(path.join(d, '_zellen.bin'), kal.tage.length, Fd.zellenStand), spC = M.Speicher.lade(path.join(b, '_zellen.bin'), kal.tage.length, Fc.zellenStand);
    var gleichSonst = true, nDiffNaechste = 0, nDiffTopf = 0;
    for (var i2 = 0; i2 < spC.n.length; i2++) { if (spC.n[i2] === spD.n[i2]) continue; if (dekodiere(i2).h === HN) nDiffNaechste += spC.n[i2] - spD.n[i2]; else gleichSonst = false; }
    for (var i3 = 0; i3 < spC.tn.length; i3++) if (spC.tn[i3] !== spD.tn[i3]) { var r3 = i3, le = r3 % 2; r3 = (r3 - le) / 2; r3 = Math.floor(r3 / K.N_K); r3 = Math.floor(r3 / nT); if (r3 % K.N_H === HN) nDiffTopf += spC.tn[i3] - spD.tn[i3]; else gleichSonst = false; }
    pruefe(Fd.dateien === 4 && Fd.zaehler.fortsetzungOhneUebernacht === 1 && gleichSonst && nDiffNaechste > 0 && nDiffTopf > 0, '9g Fortsetzung mitten in MSFT: fortsetzungOhneUebernacht ' + Fd.zaehler.fortsetzungOhneUebernacht + ', alle Nicht-Uebernacht-Zellen identisch mit (c), Uebernacht-Zellen um ' + nDiffNaechste + ' Beobachtungen (Topf ' + nDiffTopf + ') kleiner - gezaehlt, nicht geschaetzt');
  } else fehlt('9g Laeufe (d) nicht durchgelaufen: ' + (rd && rd.status) + ' / ' + (rd2 && rd2.status));
  if (Fb) {
    var Fx = fortschritt(a); Fx.kennung = 'fremde-studie/v0'; fs.writeFileSync(path.join(a, '_fortschritt.json'), JSON.stringify(Fx));
    var rx = kind(['--aus', a]);
    pruefe(rx.status !== 0 && rx.status !== null && /anderen Konfiguration/.test(rx.out), '9h manipulierte Kennung: Rueckgabewert ' + rx.status + ' und Meldung "andere Konfiguration"');
  }
});

/* ====================================================================================== */
abschnitt(10, 'RANDREGELN ueber messeDatei (Fenster, Klasse < 5 Mio $, duenner Tag, Halbtag, Uebernacht-Luecke)', function () {
  var kal = K.kalender(), w7 = [det('W7')];
  var alleTage = Object.keys(kal.close).sort(), spaet = alleTage.filter(function (t) { return t >= '2026-07-01' && t <= '2026-09-03'; }), draussen = spaet.filter(function (t) { return t > K.FENSTER.bis; });
  if (draussen.length === 0) ueber('10a Kalender kennt keine Tage nach ' + K.FENSTER.bis);
  else {
    var ma = messe(kunstReihe(spaet, 11), w7), topfTage = new Set(); ma.topf.forEach(function (v) { topfTage.add(kal.tage[v.tag]); });
    var verboten = Array.from(topfTage).filter(function (t) { return !(t <= K.FENSTER.bis); });
    pruefe(z1m(ma.Z.tageOhneKalender) === draussen.length && verboten.length === 0, '10a Kerzen an ' + draussen.length + ' Tagen nach ' + K.FENSTER.bis + ': tageOhneKalender ' + z1m(ma.Z.tageOhneKalender) + ', keine Zelle ausserhalb');
  }
  var tage30 = kal.tage.filter(function (t) { return t >= '2024-02-01'; }).slice(0, 30);
  var mb = messe(kunstReihe(tage30, 12, { volMin: 25 }), w7);
  pruefe(mb.delta.zellen.size === 0 && mb.delta.topf.size === 0 && z1m(mb.Z.tageOhneKlasse) === tage30.length, '10b Reihe mit ~1 Mio $ Tagesumsatz: 0 Zellen, 0 Topf, tageOhneKlasse ' + z1m(mb.Z.tageOhneKlasse));
  var duennTag = tage30[25], kd = kunstReihe(tage30, 13, { duenn: { tag: duennTag, behalte: 250 } }), mc = messe(kd, w7), topfTageC = new Set(); mc.topf.forEach(function (v) { topfTageC.add(kal.tage[v.tag]); });
  var duennJeZr = K.ZEITRAHMEN.map(function (zr) { return (mc.Z.tageDuenn && mc.Z.tageDuenn[zr.key]) || 0; });
  pruefe(duennJeZr.every(function (x) { return x === 1; }) && !topfTageC.has(duennTag) && z1m(mc.stat.tageGewertet) === tage30.length - K.UMSATZ_FENSTER - 1, '10c duenner Tag ' + duennTag + ': tageDuenn je ZR ' + duennJeZr.join('/') + ', kein Topf an diesem Tag, ' + z1m(mc.stat.tageGewertet) + ' dichte Tage gewertet');
  /* Uebernacht-Luecke: der duenne Tag ist ein Kalendertag der Reihe (Kerzen da), also hat der Vortag einen Ausstieg;
   * fehlt ein Kalendertag GANZ, hat der Vortag keine Uebernacht-Beobachtung (ohneNaechsterTag). */
  var mitLuecke = tage30.slice(0, 26).concat(tage30.slice(27)), ml = messe(kunstReihe(mitLuecke, 15), w7);
  var vorLuecke = kal.idx[tage30[25]], nVor = 0; ml.topf.forEach(function (v) { if (v.tag === vorLuecke && v.h === HN) nVor += v.n; });
  pruefe(nVor === 0 && ml.Z.ohneNaechsterTag > 0 && ml.stat.offen.length > 0, '10d fehlender Kalendertag ' + tage30[26] + ': Vortag ohne Uebernacht-Topf (' + nVor + '), ohneNaechsterTag ' + ml.Z.ohneNaechsterTag + ', letzter Tag offen ' + ml.stat.offen.length);
  var halb = kal.tage.filter(function (t) { return /^2024-/.test(t) && kal.close[t] && kal.close[t].close === '13:00'; })[0];
  if (!halb) { ueber('10e kein Halbtag 2024'); return; }
  var hi = kal.tage.indexOf(halb), tageH = kal.tage.slice(hi - K.UMSATZ_FENSTER - 2, hi + 3), kh = kunstReihe(tageH, 14);
  var ab1230 = { key: 'kunst-ab1230', params: {}, signal: function (bars, i) { return minutenSeitAuf(bars[i][0]) >= 180 ? { dir: 1 } : null; } };
  var um1200 = { key: 'kunst-1200', params: {}, signal: function (bars, i) { return minutenSeitAuf(bars[i][0]) === 150 ? { dir: 1 } : null; } };
  var md = messe(kh, [ab1230, um1200]), hIdx = kal.idx[halb];
  var nAb = 0, nUm = [0, 0, 0, 0, 0];
  md.eintraege.forEach(function (e) { if (e.art !== 0 || e.tag !== hIdx) return; if (e.det === 0) nAb += e.n; else if (e.zr === 0) nUm[e.h] += e.n; });
  pruefe(nAb === 0 && nUm[H15] === 1 && nUm[H1H] === 0 && nUm[H3H] === 0 && nUm[HS] === 1 && nUm[HN] === 1, '10e Halbtag ' + halb + ': "ab 12:30" 0 Zellen; "12:00" auf 1m: 15m 1, 1h 0, 3h 0 (kein Ausstieg vor 13:00), schluss 1, naechste 1 (Beobachtungen: ' + nUm.join('/') + ')');
});

/* ====================================================================================== */
abschnitt(11, 'ET-TAG = UTC-TAG (AAPL 1m) und WERTPAPIERART (L.reihen nur CS/ADRC)', function () {
  var k1 = aapl2024().bars['1m'], abw = 0;
  for (var i = 0; i < k1.length; i += 3) if (L.tagVon(k1[i][0]) !== etDatum(k1[i][0])) abw++;
  pruefe(abw === 0 && k1.length > 90000, '11a ' + k1.length + ' Kerzen: L.tagVon = ET-Datum, ' + abw + ' Abweichungen');
  var reihen = L.reihen(), aus = reihen.ausgeschlossen || {};
  pruefe(reihen.length > 5000 && aus.ETF > 600 && !reihen.some(function (R) { return R.reihe === 'SPY'; }), '11b ' + reihen.length + ' Aktien-Reihen, ETF ausgeschlossen ' + aus.ETF + ', SPY nicht darunter (Marktreihe nur fuers Regime)');
});

/* ====================================================================================== */
abschnitt(12, 'JAHRESSCHEIBEN gegen Handrechnung, TREND, AKTUALITAETS-TOR und VORWAERTSTEST an konstruierten Faellen', function () {
  var kal = K.kalender(), nT = kal.tage.length, ctx = { nTage: nT, jahr: new Int16Array(nT) };
  kal.tage.forEach(function (t, i) { ctx.jahr[i] = +t.slice(0, 4); });
  /* Tagesreihe: u = Jahr-abhaengige Konstante plus deterministischer Zickzack, alle Tage */
  function zeile(t, u) { return { t: t, n: 2, s: 2 * (u + 0.1), nh: 0.2, h2: 0.2, nK: [0, 2, 0, 0], mN: 2, mS: 2 * (u + 0.1), nhM: 0.2, h2M: 0.2, roh: u + 0.1, netto: u, nettoF: u, uBrutto: u + 0.1, u: u, uF: u }; }
  var reihe = [], soll = {};
  for (var t = 0; t < nT; t++) { var j = ctx.jahr[t], u = (j - 2016) * 0.01 + (t % 2 ? 0.02 : -0.02); reihe.push(zeile(t, u)); (soll[j] = soll[j] || []).push(u); }
  var js = A.jahresscheiben(reihe, 1, ctx, '1h'), fehler = 0;
  K.JAHRE.forEach(function (j) { var s = js.filter(function (x) { return x.jahr === String(j); })[0], w = soll[j]; if (!s || s.nTage !== w.length || Math.abs(s.u - mittel(w)) > 1e-9 || Math.abs(s.se - sd(w) / Math.sqrt(w.length)) > 1e-9 || Math.abs(s.t - mittel(w) / (sd(w) / Math.sqrt(w.length))) > 1e-6) fehler++; });
  var l250 = js[js.length - 1], w250 = reihe.slice(nT - 250).map(function (z) { return z.u; });
  pruefe(fehler === 0 && js.length === 12 && l250.nTage === 250 && Math.abs(l250.u - mittel(w250)) < 1e-9, '12a Jahresscheiben 2016..2026 und letzte 250: nTage, Mittel, se, t = Handrechnung (' + fehler + ' Fehler; letzte 250: u ' + f4(l250.u) + ' = ' + f4(mittel(w250)) + ')');
  var tr = A.trend(js);
  pruefe(tr.n === 11 && Math.abs(tr.steigung - 0.01) < 1e-4 && tr.se < 1e-4 && tr.t > 100, '12b Trend: Steigung ' + f4(tr.steigung) + ' Pp/Jahr = 0,01 (11 Jahre, se ' + tr.se.toExponential(1) + ', t ' + f2(tr.t) + ')');
  var jsDuenn = A.jahresscheiben(reihe.filter(function (z) { return ctx.jahr[z.t] >= 2024 || z.t % 40 === 0; }), 1, ctx, '1h');
  pruefe(jsDuenn.filter(function (x) { return x.duenn; }).length === 8 && A.trend(jsDuenn).steigung === null, '12c Jahre mit < ' + K.JAHR_MIN_TAGE + ' Signaltagen sind "zu duenn" (ohne t); Trend mit < ' + K.TREND_MIN_JAHRE + ' vollen Jahren = null');
  /* Aktualitaets-Tor: konstruierte Konfigurationen durch A.urteil */
  function konf(entU, entT, besU, besT, aktU, aktT, aktN, tor2) {
    var mk = function (u, t, n) { var se = t ? Math.abs(u / t) : 0.01; return { nTage: n, nSig: n, kKand: 0.0854, brutto: { mittel: u + 0.0854, se: se, obere: u + 0.0854 + 1.96 * se, t: t }, netto: { mittel: u }, nettoF: { mittel: u }, uBrutto: { mittel: u + 0.0854 }, u: { mittel: u, se: se, t: t, mde: 2 * se, hh0: false }, uF: { mittel: u } }; };
    var e = mk(entU, entT, 900), b = mk(besU, besT, 800), a = mk(aktU, aktT, aktN);
    return { richtung: 'long', h: '1h', alle: { ent: e, bes: b, ohneTopf: 0 }, aktuell: { nTage: aktN, u: a.u, brutto: a.brutto, netto: a.netto }, mdeB: b.u.mde, kKand: 0.0854, tor1: true, tor2: tor2, delta80: 0.02, torAkt: aktN >= K.AKTUELL_MIN_TAGE && aktU > 0 && aktT > K.AKTUELL_T_MIN,
      schein: { bv1: { mittel: besU + 0.0854 - 0.05, obere: 0.2 }, standard: { mittel: besU + 0.0854 - 0.23, obere: 0.0 } } };
  }
  var c1 = konf(0.08, 6, 0.06, 5, -0.03, -2.5, 120, true); A.urteil(c1, 1.96, true, true);
  pruefe(c1.urteil === 'nicht belegt: Aktualitaets-Tor' && !c1.handelbar && !c1.handelbarSchein.bv1, '12d "2025 gestorben": Entdeckung t 6, Bestaetigung t 5, letzte 250 Tage u −0,03 / t −2,5 => ' + c1.urteil + ' (kein handelbar)');
  var c2 = konf(0.08, 6, 0.06, 5, 0.05, 1.0, 120, true); A.urteil(c2, 1.96, true, true);
  pruefe(c2.urteil === 'belegt' && c2.handelbar && c2.handelbarSchein.bv1 && !c2.handelbarSchein.standard && !c2.vorwaerts, '12e lebendig (letzte 250: u +0,05, t 1,0): belegt, handelbar, mit Schein BV 1,0 ja (0,0654 − 0,05 > 0), Standard nein');
  var c3 = konf(0.005, 0.4, 0.004, 0.3, 0.06, 2.4, 60, true); c3.tor1 = false; c3.tor2 = false; A.urteil(c3, 1.96, true, true);
  pruefe(c3.urteil === 'kein Kandidat' && c3.vorwaerts, '12f "nur im letzten Jahr lebendig" (Tor 1 verfehlt, letzte 250: 60 Tage, u +0,06, t 2,4): ' + c3.urteil + ', Kandidat fuer den Vorwaertstest');
  var c4 = konf(0.08, 6, 0.06, 5, 0.05, 1.0, 8, true); A.urteil(c4, 1.96, true, true);
  pruefe(c4.urteil === 'nicht belegt: Aktualitaets-Tor' && /Signaltage/.test(c4.grund), '12g < ' + K.AKTUELL_MIN_TAGE + ' Signaltage in den letzten 250: Tor nicht pruefbar => ' + c4.urteil);
  var c5 = konf(0.08, 6, 0.06, 5, 0.05, 1.0, 120, true); c5.richtung = 'short'; A.urteil(c5, 1.96, true, true);
  pruefe(c5.urteil === 'belegt' && !c5.handelbar && c5.handelbarGrund === 'nein (Leihe)' && c5.handelbarSchein.bv1, '12h Short: belegt, als Aktie "nein (Leihe)", mit Schein BV 1,0 handelbar (Put braucht keine Leihe)');
});

/* ====================================================================================== */
abschnitt(13, 'HANSEN-HODRICK L = 2 (Uebernacht) und REGIME (SPY EMA200 gegen naive Rechnung)', function () {
  var rng = rngNeu(99), x = [], e = 0;
  for (var t = 0; t < 2000; t++) { var n = gauss(rng); x.push({ t: t, x: n + e }); e = n; }          // MA(1): Lag-1-Autokorrelation 0,5
  var m2 = A.momente(x, 2), m1 = A.momente(x, 1), k1 = KA.momente(x, 1);
  pruefe(m1.se === m1.seNaiv && Math.abs(k1.se / k1.seNaiv - Math.sqrt(1999 / 2000)) < 1e-9 && m2.seHH > 1.25 * m2.seNaiv && m2.seHH < 1.6 * m2.seNaiv && m2.se === m2.seHH, '13a MA(1)-Reihe: L=1 se = naiv (Kanal-momente selbst: Faktor sqrt((n-1)/n)); L=2 se_HH/se_naiv = ' + f2(m2.seHH / m2.seNaiv) + ' (Soll ≈ √2 = 1,41)');
  var y = x.map(function (p) { return { t: p.t, x: gauss(rng) }; }), my = A.momente(y, 2);
  pruefe(Math.abs(my.seHH / my.seNaiv - 1) < 0.1, '13b unabhaengige Reihe: L=2 se_HH/se_naiv = ' + f2(my.seHH / my.seNaiv) + ' ≈ 1');
  var kal = K.kalender(), schluss = {}, r2 = rngNeu(5), c = 100;
  kal.tage.forEach(function (tag) { c *= Math.exp(0.01 * gauss(r2)); schluss[tag] = c; });
  var R = A.regimeAusSchluessen(kal, schluss), naiv = new Int8Array(kal.tage.length).fill(-1), ema = NaN, alpha = 2 / (K.EMA_N + 1), s = 0;
  kal.tage.forEach(function (tag, i) { var v = schluss[tag]; if (i < K.EMA_N) { s += v; if (i === K.EMA_N - 1) ema = s / K.EMA_N; return; } ema = alpha * v + (1 - alpha) * ema; naiv[i] = v > ema ? 1 : 0; });
  var abw = 0; for (var i = 0; i < naiv.length; i++) if (naiv[i] !== R.regime[i]) abw++;
  pruefe(abw === 0 && R.unbekannt === K.EMA_N && R.ueber + R.unter === kal.tage.length - K.EMA_N, '13c Regime = naive EMA200 (' + abw + ' Abweichungen), Vorlauf ' + R.unbekannt + ' Tage unbekannt, ueber ' + R.ueber + ' / unter ' + R.unter);
});

/* ====================================================================================== */
abschnitt(14, 'KONSTRUKTIONSFAELLE W4, W5, W6 und RSI = quant.js rsi', function () {
  var kal = K.kalender(), tag = kal.tage.filter(function (t) { return t >= '2024-03-01'; })[0], t0 = auf0930(tag);
  function kerze(m, o, c, h, l, v) { return [t0 + m * MIN, c, v, h, l, o]; }
  /* W4: 30 ruhige Kerzen, dann 4 hoehere Hochs/Tiefs, dann Klimax (neues Hoch, 3x Volumen, Schluss in der Vorspanne) */
  var b4 = []; for (var m = 0; m < 30; m++) b4.push(kerze(m, 100, 100, 100.2, 99.8, 1000));
  for (var k = 0; k < 4; k++) b4.push(kerze(30 + k, 100 + k, 100.5 + k, 100.7 + k, 99.9 + k, 1000));
  b4.push(kerze(34, 103.6, 103.5, 104.5, 103.3, 3100));                                    // Klimax: Hoch 104,5 > 103,7, Schluss 103,5 in [102,9; 103,7]
  var p4 = det('W4').params, s4 = DT.W.klimax(b4, 34, p4), vorher = [30, 31, 32, 33].map(function (i) { return DT.W.klimax(b4, i, p4); }).filter(Boolean).length;
  var b4b = b4.map(function (x) { return x.slice(); }); b4b[34][2] = 2900;
  var b4c = b4.map(function (x) { return x.slice(); }); b4c[34][1] = 104.2;
  pruefe(s4 && s4.dir === -1 && vorher === 0 && !DT.W.klimax(b4b, 34, p4) && !DT.W.klimax(b4c, 34, p4), '14a W4: Klimax-Kerze => short; davor 0; mit 2,9x Volumen oder Schluss ueber der Vorspanne kein Signal');
  /* W5: Hoch bei 10 (102), Hoch bei 25 (101,5 < 102), Abstand 15 >= 10, F = 5 => short an Kerze 30 */
  var b5 = []; for (var m5 = 0; m5 < 45; m5++) { var h = 100 + (m5 === 10 ? 2 : (m5 === 25 ? 1.5 : 0.1 * Math.sin(m5))); b5.push(kerze(m5, 100, 100, h, 99, 1000)); }
  var p5 = det('W5').params, s5 = DT.W.dow(b5, 30, p5), s5vor = DT.W.dow(b5, 29, p5), s5nach = DT.W.dow(b5, 31, p5);
  var b5b = b5.map(function (x) { return x.slice(); }); b5b[25][3] = 102.5;
  pruefe(s5 && s5.dir === -1 && !s5vor && !s5nach && !DT.W.dow(b5b, 30, p5), '14b W5: tieferes Hoch (101,5 < 102) an der Bestaetigungskerze 30 => short, nicht an 29/31; hoeheres Hoch => kein Signal');
  /* W6: 20 Kerzen Rauschen sigma ~0,1 %, dann Anstieg 100 -> 102 in 5 Kerzen (>> 3 sigma), dann Ruecklauf; 50 % erreicht bei 101 */
  var b6 = [], rng = rngNeu(3), c6 = 100; for (var m6 = 0; m6 < 21; m6++) { c6 = 100.02 + 0.1 * Math.abs(gauss(rng)); b6.push(kerze(m6, c6, c6, c6 + 0.05, c6 - 0.05, 1000)); }
  b6[20][1] = 100;                                                                              // eindeutiges Tief a = 20 (>= 20 Kerzen davor fuer sigma)
  [100.4, 100.8, 101.2, 101.6, 102.0].forEach(function (c, q) { b6.push(kerze(21 + q, c, c, c + 0.05, c - 0.05, 1000)); });
  [101.8, 101.4, 100.9, 100.5].forEach(function (c, q) { b6.push(kerze(26 + q, c, c, c + 0.05, c - 0.05, 1000)); });
  var p6 = det('W6').params, s6 = [26, 27, 28, 29].map(function (i) { return DT.W.vUmkehr(b6, i, p6); });
  pruefe(!s6[0] && !s6[1] && s6[2] && s6[2].dir === -1 && !s6[3], '14c W6: Anstieg 100 -> 102, Ruecklauf erreicht 50 % erstmals bei 100,9 (Kerze 28) => short genau dort, nicht davor/danach');
  /* RSI = quant.js rsi() an AAPL-Schluessen */
  var k1 = aapl2024().bars['1m'], closes = k1.map(function (b) { return b[1]; }), R14 = DT.helfer.rsiReihe(k1, 14), abw = 0, r3 = rngNeu(4);
  for (var q3 = 0; q3 < 1000; q3++) { var i = 14 + Math.floor(r3() * (k1.length - 14)); if (Math.abs(R14[i] - Q.rsi(closes, 14, i)) > 1e-9) abw++; }
  pruefe(abw === 0 && Q.rsi(closes, 14, 5) === null && R14[5] !== R14[5], '14d RSI(14)-Reihe = Q.rsi an 1000 Indizes (' + abw + ' Abweichungen); unter 14 Kerzen null/NaN');
});

/* ====================================================================================== */
abschnitt(15, 'KLINKEN: kein Netz, kein Schluessel, kein Schreiben ins Archiv, kein Yahoo; Pilot heisst nie voll', function () {
  var dateien = ['konfig.js', 'detektoren.js', 'messen.js', 'auswerten.js', 'hochrechnung.js'], text = {};
  dateien.forEach(function (f) { text[f] = fs.readFileSync(path.join(K.HIER, f), 'utf8'); });
  var netz = dateien.filter(function (f) { return /require\(\s*['"](https?|net|dgram|tls|ws)['"]\s*\)/.test(text[f]) || /fetch\(|XMLHttpRequest|alpaca\.js|capital\.com|yahoo|yfinance|APCA_API|api_key|apiKey|secret/i.test(text[f]); });
  pruefe(netz.length === 0, '15a keine Netzmodule, keine Schluessel, kein Yahoo in ' + dateien.join(', '));
  var schreib = dateien.filter(function (f) { var t = text[f], re = /fs\.(writeFileSync|appendFileSync|renameSync|mkdirSync|rmSync|unlinkSync)\(([^)]*)\)/g, m, schlecht = false; while ((m = re.exec(t))) { if (/ORTE|archivWurzel|MD_ALPACA|studien-zellen/.test(m[2])) schlecht = true; } return schlecht; });
  pruefe(schreib.length === 0 && /ORTE\.roh\(\)/.test(text['konfig.js']) === false, '15b kein Schreibaufruf mit Archivpfad (ORTE/archivWurzel) in den Werkzeugen');
  pruefe(/pilot: !!a\.reihen/.test(text['messen.js']) && /PILOT-ERGEBNIS\.md/.test(text['auswerten.js']), '15c --reihen setzt pilot=true; auswerten.js schreibt dann PILOT-ERGEBNIS.md, nie ERGEBNIS.md');
  var nacht = fs.readFileSync(path.join(K.HIER, 'nacht.cmd'), 'utf8');
  pruefe(/vorregistrierung-2026-09-09-trendwende-ii/.test(nacht) && !/&&/.test(nacht.split('\n').filter(function (z) { return /schtasks/.test(z); }).join('\n')) && /--checkpoint 200 --wachhund 900/.test(nacht), '15d nacht.cmd zeigt auf diesen Ordner, schtasks-Zeilen ohne &&, Checkpoint 200 / Wachhund 900');
  pruefe(K.SE_ERWARTET_NAECHSTE === null || (K.SE_ERWARTET_NAECHSTE > 0 && K.SE_ERWARTET_NAECHSTE < 1), '15e SE_ERWARTET_NAECHSTE ' + K.SE_ERWARTET_NAECHSTE + ' (null bis zum Piloten, danach aus PILOT-ERGEBNIS.md)');
  A.selbsttestQuantil(); ok('15f Normalquantile z_Bonf(1/5/10/20) = 1,96 / 2,58 / 2,81 / 3,02');
});

/* ====================================================================================== */
console.log('\n' + ERG.ok + ' OK, ' + ERG.fehlt + ' FEHLT, ' + ERG.ueber + ' UEBERSPRUNGEN');
process.exitCode = ERG.fehlt ? 1 : 0;
