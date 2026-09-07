'use strict';
/* TEST - Positivkontrolle und Sperrklinken des Messgeraets (VORREGISTRIERUNG §11, Nachtrag 1).
 *
 *   node test.js            alle Pruefungen; Rueckgabewert 1, wenn eine FEHLT
 *
 * Jede Zeile der Ausgabe ist 'OK ...', 'FEHLT ...' oder 'UEBERSPRUNGEN ...'. Geprueft wird der GRUND,
 * nicht nur das Ergebnis (wiki/fehlerformen.md, "Pruefung prueft etwas anderes"): neben der Zahl aus
 * der Zelle steht immer der Zaehler, die Signalmenge oder die Kennung, die sie erklaert. Eine Ausnahme
 * in einer Pruefung ist FEHLT, nie UEBERSPRUNGEN.
 *
 * KUNST-REIHEN: eigener Zufall mit Saat (mulberry32, unabhaengig von messen.js), Kerzen
 * [t, schluss, umsatz, hoch, tief, eroeffnung] auf ECHTEN Kalendertagen (K.kalender()), 09:30 bis
 * Sitzungsschluss ET, Irrfahrt mit Mikrorauschen auf Schluss und Eroeffnung - KEINE Gerade. Das
 * Mikrorauschen ist kein Schmuck: ohne unabhaengiges Rauschen waere Schluss i = Eroeffnung i+1, und die
 * Gegenprobe "geteilter Kurs" (Nachtrag 15) koennte den Scheineffekt nicht erzeugen.
 *
 * ARCHIV: nur lesen, nur AAPL/2024 ueber lesen.js plus die Meta-Dateien. Das Mini-Archiv fuer die
 * Fortsetzbarkeit liegt im Kratzordner (MD_TEST_KRATZ oder os.tmpdir()/signale-minuten-test).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var cp = require('child_process');
var K = require('./konfig.js');
var L = require('./lesen.js');
var M = require('./messen.js');
var Q = require(path.join(K.REPO, 'quant.js'));
var Liquide = require(path.join(K.REPO, 'liquide.js'));
var TAB = require(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'));

var KRATZ = process.env.MD_TEST_KRATZ || path.join(os.tmpdir(), 'signale-minuten-test');
var MIN = 60000, STUNDE = 3600000;

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

/* ---------- Eigener Zufall (Saat) ---------- */
function rngNeu(saat) { var a = saat >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function gauss(rng) { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }

/* ---------- ET-Zeit, unabhaengig von lesen.js (Intl) ---------- */
var ET_DATUM = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
var ET_STUNDE = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: '2-digit', hour12: false });
function etDatum(ms) { return ET_DATUM.format(new Date(ms)); }
/** Versatz UTC - ET in Stunden fuer diesen Kalendertag (Mittag UTC liegt nie auf einer Umstellung). */
var VERSATZ_MERK = {}, AUF_MERK = {};
function etVersatz(tag) {
  if (VERSATZ_MERK[tag] !== undefined) return VERSATZ_MERK[tag];
  var p = tag.split('-').map(Number), mittag = Date.UTC(p[0], p[1] - 1, p[2], 12, 0);
  var h = (+ET_STUNDE.formatToParts(new Date(mittag)).filter(function (x) { return x.type === 'hour'; })[0].value) % 24;
  return (VERSATZ_MERK[tag] = 12 - h);
}
/** UTC-Stempel von 09:30 ET an diesem Kalendertag. */
function auf0930(tag) {
  if (AUF_MERK[tag] !== undefined) return AUF_MERK[tag];
  var p = tag.split('-').map(Number);
  return (AUF_MERK[tag] = Date.UTC(p[0], p[1] - 1, p[2], 9 + etVersatz(tag), 30));
}
/** Sitzungsminuten des Kalendertags (390, Halbtag 210) aus dem Kalender der Quelle. */
function sollMinVon(tag) {
  var e = K.kalender().close[tag];
  var c = (e && e.close ? e.close : '16:00').split(':').map(Number), o = (e && e.open ? e.open : '09:30').split(':').map(Number);
  return (c[0] * 60 + c[1]) - (o[0] * 60 + o[1]);
}
/** Minuten seit 09:30 ET fuer einen Stempel. */
function minutenSeitAuf(ms) { return (ms - auf0930(etDatum(ms))) / MIN; }

/* ---------- Kunst-Reihe ---------- */
/** Kerzen auf den Kalendertagen `tage`. o: {start, sigmaRw, sigmaN, volMin, duenn:{tag, behalte}}.
 *  Irrfahrt P (log-normal je Minute) plus unabhaengiges Mikrorauschen auf Eroeffnung und Schluss. */
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
    if (o.duenn && o.duenn.tag === tag) {                       // duenner Tag: nur `behalte` Kerzen, Mitte herausgenommen
      var weg = tagKerzen.length - o.duenn.behalte, a = Math.floor((tagKerzen.length - weg) / 2);
      tagKerzen.splice(a, weg);
    }
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
  var warm = { kerzen1m: [], tagesUmsatz: [] };
  var massnahmen = []; massnahmen.ende = null;
  var ctx = { kal: K.kalender(), dets: dets, F: { zaehler: M.leererZaehler() } };
  var delta = new M.Delta();
  var stat = M.messeDatei(R, g, warm, massnahmen, delta, ctx, Date.now() + 600000);
  /* Zaehler kommen seit Review F3 lokal je Datei in stat.zaehler zurueck (Tageszaehler je Zeitrahmen). */
  return { stat: stat, delta: delta, Z: stat.zaehler || ctx.F.zaehler, eintraege: dekodiereAlle(delta), topf: topfMittel(delta) };
}
/** Tageszaehler auf 1m (Zaehler sind Objekte je Zeitrahmen; eine nackte Zahl wird durchgereicht). */
function z1m(v) { return (v && typeof v === 'object') ? (v['1m'] || 0) : (v || 0); }
/** Zellenindex -> Koordinaten (Umkehrung von K.zelle). */
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
function dekodiereAlle(delta) {
  var aus = [];
  delta.zellen.forEach(function (v, idx) { var e = dekodiere(idx); e.n = v[0]; e.s = v[1]; e.s2 = v[2]; e.h2 = v[3]; aus.push(e); });
  return aus;
}
/** Topfmittel je (zr, h, tag, klasse, lebend) als Map 'zr|h|tag|klasse|lebend' -> Mittel. */
function topfMittel(delta) {
  var nTage = K.kalender().tage.length, m = new Map();
  delta.topf.forEach(function (v, idx) {
    var r = idx, lebend = r % 2; r = (r - lebend) / 2; var klasse = r % K.N_K; r = (r - klasse) / K.N_K; var tag = r % nTage; r = (r - tag) / nTage; var h = r % K.N_H; var zr = (r - h) / K.N_H;
    m.set(zr + '|' + h + '|' + tag + '|' + klasse + '|' + lebend, { n: v[0], mittel: v[1] / v[0], tag: tag, zr: zr, h: h });
  });
  return m;
}
/** Kandidaten-Tagesreihe (netto oder roh) aus den Zellen: art, det, zr, h, dirIdx (null = beide). */
function tagesreiheAusZellen(eintraege, art, det, zr, h, dirIdx, netto) {
  var je = {};
  eintraege.forEach(function (e) {
    if (e.art !== art || e.det !== det || e.zr !== zr || e.h !== h) return;
    if (dirIdx != null && e.dirIdx !== dirIdx) return;
    var z = je[e.tag] || (je[e.tag] = { n: 0, s: 0 });
    z.n += e.n; z.s += e.s - (netto ? e.n * K.KLASSEN[e.klasse].huerde : 0);
  });
  var tage = Object.keys(je).map(Number).sort(function (a, b) { return a - b; });
  var n = 0, s = 0; tage.forEach(function (t) { n += je[t].n; s += je[t].s; });
  return { tage: tage, mittelJeTag: tage.map(function (t) { return je[t].s / je[t].n; }), n: n, jeSignal: n ? s / n : NaN, je: je };
}

/* ---------- Eigene, naive Nachrechnung der Regeln aus §2/§3 (unabhaengig von messen.js) ---------- */
/** Tage einer Kerzenreihe nach ET-Datum (Intl): [{tag, von, bis, auf, sollMin, schluss, umsatz}]. */
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
/** Signale eines Detektors auf 1m nach den Regeln der Vorregistrierung: dichte Tage, Klasse aus 20
 *  Vortagen, zulaessige Kerze (>= 30 min Rest, Folgekerze), Cooldown 60 min. Rueckgabe {bars, tage, signale}. */
function naiveSignale(kerzen, D, params) {
  var T = zerlegeTage(kerzen), kal = K.kalender();
  T.forEach(function (d, q) {
    d.dicht = (d.bis - d.von + 1) >= K.DICHTE_MIN * d.sollMin;
    d.klasse = q < K.UMSATZ_FENSTER ? -1 : K.klasseIndex(medianNaiv(T.slice(q - K.UMSATZ_FENSTER, q).map(function (x) { return x.umsatz; })));
  });
  var bars = [], dichte = [];
  T.forEach(function (d) {
    if (!d.dicht) return;
    var von = bars.length;
    for (var q = d.von; q <= d.bis; q++) bars.push(kerzen[q]);
    dichte.push({ tag: d.tag, von: von, bis: bars.length - 1, auf: d.auf, schluss: d.schluss, klasse: d.klasse, sollMin: d.sollMin });
  });
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
/** 1h-Rohertrag (Pp) eines Signals: Einstieg bars[i+1][5] (falsch: bars[i][1]), Ausstieg Eroeffnung der
 *  ersten Kerze mit t >= t_{i+1} + 60 min innerhalb des Tages; NaN ohne Ausstieg. */
function rendite1h(bars, sg, falsch) {
  if (sg.i + 1 > sg.bis) return NaN;
  var ein = falsch ? bars[sg.i][1] : bars[sg.i + 1][5], ziel = bars[sg.i + 1][0] + 60 * MIN, j = sg.i + 2;
  while (j <= sg.bis && bars[j][0] < ziel) j++;
  if (j > sg.bis) return NaN;
  return sg.dir * (bars[j][5] - ein) / ein * 100;
}
/** Tagesmittel-Reihe aus einer Signalliste mit Renditen r (NaN faellt weg). */
function tagesreiheNaiv(signale, r, netto) {
  var je = {};
  signale.forEach(function (sg, q) {
    if (r[q] !== r[q]) return;
    var z = je[sg.tagIdx] || (je[sg.tagIdx] = { n: 0, s: 0 });
    z.n++; z.s += r[q] - (netto ? K.KLASSEN[sg.klasse].huerde : 0);
  });
  var tage = Object.keys(je).map(Number).sort(function (a, b) { return a - b; });
  var n = 0, s = 0; tage.forEach(function (t) { n += je[t].n; s += je[t].s; });
  return { tage: tage, mittelJeTag: tage.map(function (t) { return je[t].s / je[t].n; }), n: n, jeSignal: n ? s / n : NaN };
}
/** Block-Pflanzung (Wortlaut des Auftrags): nach jeder Signalkerze i die Kerzen i+2..i+61 (innerhalb des
 *  Tages) multiplikativ um dir*staerke verschieben; Einstiegskerze i+1 bleibt unangetastet. Signale, deren
 *  i+1 noch in einer frueheren Pflanzung liegt, werden nicht gepflanzt. Rueckgabe {kerzen, gepflanzt:Set(i)}.
 *  Wird nur noch NACHRICHTLICH gerechnet (siehe pflanzeAusstieg): der Ruecksprung bei i+62 faellt in das
 *  Ausstiegsfenster der Signale, die der Detektor im angehobenen Block neu findet (gemessen 07.09.: von 472
 *  gepflanzten Signalen ueberlebten 55 den zweiten Pass, 430 neue lagen bei -0,25 Pp) - die Kontrolle
 *  wuerde negativ, obwohl die Maschine richtig rechnet. */
function pflanzeBlock(kerzen, signale, staerke) {
  var aus = kopiere(kerzen), gepflanzt = new Set(), letztesEnde = -1;
  signale.forEach(function (sg) {
    if (sg.i + 1 <= letztesEnde) return;
    var f = 1 + sg.dir * staerke, ende = Math.min(sg.i + 61, sg.bis);
    for (var q = sg.i + 2; q <= ende; q++) { aus[q][1] = r4(aus[q][1] * f); aus[q][3] = r4(aus[q][3] * f); aus[q][4] = r4(aus[q][4] * f); aus[q][5] = r4(aus[q][5] * f); }
    gepflanzt.add(sg.i); letztesEnde = ende;
  });
  return { kerzen: aus, gepflanzt: gepflanzt };
}
/** Pflanzung am Ausstieg: die Kante sitzt in der EROEFFNUNG der 1h-Ausstiegskerze (erste Kerze mit
 *  t >= t_{i+1} + 60 min), multiplikativ um dir*staerke; Hoch/Tief nur so weit, dass die Kerze stimmig
 *  bleibt. Schlusskurse und Umsaetze bleiben, also bleibt die Signalmenge der schlussbasierten Detektoren
 *  (rsi2, reversion) im zweiten Pass IDENTISCH - die Kontrolle misst dann nur das Rechenwerk: Einstieg
 *  bars[i+1][5], Ausstiegskerze und -feld, Richtung, Huerde, Tagesmittel. Nicht gepflanzt wird, wenn die
 *  Ausstiegskerze zugleich Einstiegskerze eines anderen Signals ist (Signal genau am Cooldown-Ende) oder
 *  kein Ausstieg im Tag liegt. Rueckgabe {kerzen, gepflanzt:Set(i), ausstieg:Map(i->j)}. */
function pflanzeAusstieg(kerzen, signale, staerke) {
  var aus = kopiere(kerzen), gepflanzt = new Set(), ausstieg = new Map(), belegt = new Set();
  var einstiege = new Set(signale.map(function (sg) { return sg.i + 1; }));
  signale.forEach(function (sg) {
    var ziel = kerzen[sg.i + 1][0] + 60 * MIN, j = sg.i + 2;
    while (j <= sg.bis && kerzen[j][0] < ziel) j++;
    if (j > sg.bis || einstiege.has(j) || belegt.has(j)) return;
    var f = 1 + sg.dir * staerke, o = r4(aus[j][5] * f);
    aus[j][5] = o; if (o > aus[j][3]) aus[j][3] = o; if (o < aus[j][4]) aus[j][4] = o;
    gepflanzt.add(sg.i); ausstieg.set(sg.i, j); belegt.add(j);
  });
  return { kerzen: aus, gepflanzt: gepflanzt, ausstieg: ausstieg };
}

/* ---------- Gemeinsame Daten ---------- */
var DETS = K.detektoren();
function det(key) { return DETS.filter(function (d) { return d.key === key; })[0]; }
function detIdx(key) { return DETS.indexOf(det(key)); }
var AAPL = null;
/** AAPL/2024 ueber lesen.js - genau eine Datei, gemerkt. */
function aapl2024() {
  if (AAPL) return AAPL;
  var R = L.reihen().filter(function (r) { return r.reihe === 'AAPL'; })[0];
  if (!R) throw new Error('AAPL nicht in L.reihen()');
  var g = L.ladeJahr(R, 2024);
  if (!g.ok) throw new Error('AAPL/2024 nicht lesbar: ' + g.grund);
  AAPL = { R: R, g: g, bars: { '1m': g.kerzen, '5m': L.verdichte(g.kerzen, '5m'), '15m': L.verdichte(g.kerzen, '15m') } };
  return AAPL;
}
var KUNST = {};                                   // Ergebnisse der Kunst-Laeufe fuer die Pruefungen 1-3

/* ====================================================================================== */
abschnitt(0, 'Zellendecoder (Selbstpruefung der Testhilfen)', function () {
  var nTage = K.kalender().tage.length, fehler = 0, rng = rngNeu(1);
  for (var q = 0; q < 2000; q++) {
    var reihe = Math.floor(rng() * K.N_REIHEN), dirIdx = Math.floor(rng() * 2), h = Math.floor(rng() * K.N_H), tag = Math.floor(rng() * nTage), klasse = Math.floor(rng() * K.N_K), lebend = Math.floor(rng() * 2);
    var e = dekodiere(K.zelle(nTage, reihe, dirIdx, h, tag, klasse, lebend));
    if (e.reihe !== reihe || e.dirIdx !== dirIdx || e.h !== h || e.tag !== tag || e.klasse !== klasse || e.lebend !== lebend) fehler++;
    if (K.reiheIndex(e.kand, e.art) !== reihe || K.kandIndex(e.det, e.zr) !== e.kand) fehler++;
  }
  pruefe(fehler === 0, '0 Decoder invertiert K.zelle/K.reiheIndex/K.kandIndex (2000 Stichproben, ' + fehler + ' Fehler)');
});

/* ====================================================================================== */
abschnitt(1, 'POSITIVKONTROLLE - gepflanzte Kante wird in Groesse und Richtung wiedergefunden', function () {
  var kal = K.kalender();
  var tage = kal.tage.filter(function (t) { return t >= '2024-01-01'; }).slice(0, K.UMSATZ_FENSTER + 90);
  var roh = kunstReihe(tage, 20260906);
  pruefe(roh.length >= 110 * 300, '1a Kunst-Reihe: ' + tage.length + ' Kalendertage ' + tage[0] + '..' + tage[tage.length - 1] + ', ' + roh.length + ' Kerzen, keine Gerade (sd der Minutenrenditen ' + f4(sd(roh.slice(0, 5000).map(function (k, i, a) { return i ? (k[1] / a[i - 1][1] - 1) * 100 : 0; }))) + ' Pp)');
  /* Detektor waehlen: der erste, der ohne Pflanzung auf >= 30 Signaltagen feuert */
  var wahl = null;
  ['rsi2', 'reversion', 'donchian'].forEach(function (key) {
    if (wahl) return;
    var D = det(key), p = K.paramsFuer(D, '1m'), n1 = naiveSignale(roh, D, p);
    var tageMit = new Set(n1.signale.map(function (s) { return s.tagIdx; })).size;
    console.log('   ' + key + ' ohne Pflanzung: ' + n1.signale.length + ' Signale auf ' + tageMit + ' Tagen');
    if (tageMit >= 30) wahl = { key: key, D: D, p: p, pass1: n1 };
  });
  if (!pruefe(!!wahl, '1b ein Detektor feuert auf >= 30 Signaltagen der Kunst-Reihe')) return;
  var D = wahl.D, dI = detIdx(wahl.key);
  pruefe(wahl.pass1.bars.length === roh.length, '1c alle Kunst-Tage dicht (Detektions-Reihe = Kerzen: ' + wahl.pass1.bars.length + ' = ' + roh.length + ')');
  var klassen = new Set(wahl.pass1.tage.filter(function (d) { return d.klasse >= 0; }).map(function (d) { return d.klasse; }));
  pruefe(klassen.size === 1 && klassen.has(1), '1d Umsatzklasse der Kunst-Reihe ist 50-250 (Klassen: ' + Array.from(klassen).map(function (k) { return K.KLASSEN[k].name; }).join(',') + ')');

  /* Nachrichtlich: die Block-Pflanzung des Auftragstexts, nur naiv gerechnet - sie zeigt, warum die
   * Kontrolle am Ausstieg pflanzt (Kommentar an pflanzeBlock). Kein Urteil. */
  var STAERKE = 0.005;
  var pb = pflanzeBlock(roh, wahl.pass1.signale, STAERKE), pb2 = naiveSignale(pb.kerzen, D, wahl.p);
  var rb2 = pb2.signale.map(function (s) { return rendite1h(pb2.bars, s); }), rbAlt = [], rbNeu = [];
  pb2.signale.forEach(function (s, q) { if (rb2[q] !== rb2[q]) return; (pb.gepflanzt.has(s.i) ? rbAlt : rbNeu).push(rb2[q]); });
  console.log('   nachrichtlich Block-Pflanzung i+2..i+61: ' + pb.gepflanzt.size + ' gepflanzt, Pass 2 ' + pb2.signale.length + ' Signale, davon ' + rbAlt.length + ' gepflanzte (Mittel ' + f4(mittel(rbAlt)) + ' Pp) und ' + rbNeu.length + ' neue (Mittel ' + f4(mittel(rbNeu)) + ' Pp) - der Ruecksprung bei i+62 liegt im Ausstiegsfenster der neuen Signale');

  /* Pflanzung am Ausstieg, dann Signale NEU bestimmen */
  var pf = pflanzeAusstieg(roh, wahl.pass1.signale, STAERKE);
  var geaendert = 0; for (var q = 0; q < roh.length; q++) if (roh[q][5] !== pf.kerzen[q][5]) geaendert++;
  var schlussGleich = roh.every(function (k, i) { return k[1] === pf.kerzen[i][1] && k[2] === pf.kerzen[i][2]; });
  var einstiegUnberuehrt = wahl.pass1.signale.every(function (s) { return pf.kerzen[s.i + 1][5] === roh[s.i + 1][5] && pf.kerzen[s.i][1] === roh[s.i][1]; });
  pruefe(pf.gepflanzt.size >= 30 && geaendert === pf.gepflanzt.size && schlussGleich && einstiegUnberuehrt, '1e Pflanzung am Ausstieg: ' + pf.gepflanzt.size + ' von ' + wahl.pass1.signale.length + ' Signalen gepflanzt (' + geaendert + ' Ausstiegs-Eroeffnungen verschoben; Schluesse, Umsaetze, Signal- und Einstiegskerzen unangetastet)');
  var pass2 = naiveSignale(pf.kerzen, D, wahl.p);
  var gleich = pass2.signale.length === wahl.pass1.signale.length && pass2.signale.every(function (s, q) { return s.i === wahl.pass1.signale[q].i && s.dir === wahl.pass1.signale[q].dir; });
  pruefe(gleich, '1f Signalmenge nach der Pflanzung NEU bestimmt: ' + pass2.signale.length + ' Signale, identisch mit Pass 1 (' + wahl.pass1.signale.length + ') - die Pflanzung ist fuer den schlussbasierten Detektor unsichtbar');
  var r2 = pass2.signale.map(function (s) { return rendite1h(pass2.bars, s); });
  var rPflanzt = [], rNeu = [];
  pass2.signale.forEach(function (s, q) { if (r2[q] !== r2[q]) return; (pf.gepflanzt.has(s.i) ? rPflanzt : rNeu).push(r2[q]); });
  console.log('   Pass 2: ' + pass2.signale.length + ' Signale, davon ' + rPflanzt.length + ' gepflanzt mit 1h-Beobachtung (Mittel ' + f4(mittel(rPflanzt)) + ' Pp), ' + rNeu.length + ' ungepflanzte mit Beobachtung (Mittel ' + f4(mittel(rNeu)) + ' Pp)');
  /* Ungepflanzt bleiben Signale genau am Cooldown-Ende (ihre Einstiegskerze ist die Ausstiegskerze des
   * Vorgaengers) - bei einem Detektor, der auf ~28 % der Kerzen feuert, sind das ~10 %; sie muessen nahe null liegen. */
  pruefe(rPflanzt.length >= 30 && Math.abs(mittel(rPflanzt) - STAERKE * 100) < 0.1 && rNeu.length <= 0.2 * rPflanzt.length && (!rNeu.length || Math.abs(mittel(rNeu)) < 0.1), '1g gepflanzte Signale tragen die Kante: Mittel ' + f4(mittel(rPflanzt)) + ' Pp bei Soll ' + f4(STAERKE * 100) + ' (n ' + rPflanzt.length + '; ' + rNeu.length + ' ungepflanzte am Cooldown-Ende nahe null: ' + f4(mittel(rNeu)) + ')');

  /* Das Messgeraet, ganz: alle 13 Detektoren, Zellen des gewaehlten Detektors auf 1m/1h */
  var mp = messe(pf.kerzen, DETS);
  KUNST.gepflanzt = mp; KUNST.wahl = wahl; KUNST.tage = tage;
  pruefe(z1m(mp.stat.tageGewertet) === tage.length - K.UMSATZ_FENSTER && z1m(mp.Z.tageOhneKlasse) === K.UMSATZ_FENSTER && z1m(mp.Z.tageDuenn) === 0 && z1m(mp.Z.tageOhneKalender) === 0, '1h messeDatei wertet auf 1m ' + z1m(mp.stat.tageGewertet) + ' Tage (Soll ' + (tage.length - K.UMSATZ_FENSTER) + '), ohne Klasse ' + z1m(mp.Z.tageOhneKlasse) + ', duenn ' + z1m(mp.Z.tageDuenn) + ', ohne Kalender ' + z1m(mp.Z.tageOhneKalender));
  pruefe((mp.stat.signale[wahl.key] || [])[0] === pass2.signale.length, '1i Signalmenge: messeDatei ' + (mp.stat.signale[wahl.key] || [])[0] + ' = naive Nachrechnung ' + pass2.signale.length + ' (' + wahl.key + ' 1m)');

  /* Kurszellen (Nachtrag 3): Zahl und Summe gegen die naive Rechnung, Cent-Boden-Zaehler gegen die Klassenhuerde.
   * NUR die Zellen des gewaehlten Kandidaten auf 1m - delta.kurs traegt alle 39 Kandidaten (der erste Anlauf
   * dieser Pruefung verglich 3.647 Signale aller Detektoren mit 516 eines einzigen und war zu Recht rot). */
  var nT = K.kalender().tage.length, kandIdx = K.kandIndex(K.DETEKTOR_KEYS.indexOf(wahl.key), 0);
  var von = kandIdx * 2 * nT * K.N_K * 2, bis = (kandIdx + 1) * 2 * nT * K.N_K * 2;
  var kn = 0, ks = 0, kcb = 0;
  mp.delta.kurs.forEach(function (v, idx) { if (idx >= von && idx < bis) { kn += v[0]; ks += v[1]; kcb += v[2]; } });
  var einstiege = pass2.signale.map(function (s) { return pf.kerzen[s.i + 1] ? pf.kerzen[s.i + 1][5] : 0; }).filter(function (x) { return x > 0; });
  var sollSumme = einstiege.reduce(function (a, b) { return a + b; }, 0);
  var sollUeber = einstiege.filter(function (k) { return K.centBodenPp(k) > K.KLASSEN[1].huerde; }).length;   // Kunst-Reihe ist Klasse 50-250
  pruefe(kn === einstiege.length && Math.abs(ks - sollSumme) < 1e-6 && kcb === sollUeber,
    '1z Kurszellen (' + wahl.key + ' 1m): ' + kn + ' Signale mit Einstieg (naiv ' + einstiege.length + '), Summe ' + f4(ks) + ' (naiv ' + f4(sollSumme) + '), ueber dem Cent-Boden ' + kcb + ' (naiv ' + sollUeber + '); mittlerer Kurs ' + f4(ks / kn) + ' $, Boden ' + f4(K.centBodenPp(ks / kn)) + ' Pp gegen Huerde ' + f4(K.KLASSEN[1].huerde));
  var zNetto = tagesreiheAusZellen(mp.eintraege, 0, dI, 0, 0, null, true), nNetto = tagesreiheNaiv(pass2.signale, r2, true);
  var diff = Math.abs(mittel(zNetto.mittelJeTag) - mittel(nNetto.mittelJeTag));
  pruefe(zNetto.n === nNetto.n && zNetto.tage.length === nNetto.tage.length && diff < 0.01, '1j Netto-Tagesmittel 1h: Zellen ' + f4(mittel(zNetto.mittelJeTag)) + ' Pp (n ' + zNetto.n + ', ' + zNetto.tage.length + ' Tage) vs naiv ' + f4(mittel(nNetto.mittelJeTag)) + ' (n ' + nNetto.n + ', ' + nNetto.tage.length + ' Tage), |Diff| ' + diff.toExponential(2));
  var zLong = tagesreiheAusZellen(mp.eintraege, 0, dI, 0, 0, 0, false), zShort = tagesreiheAusZellen(mp.eintraege, 0, dI, 0, 0, 1, false);
  pruefe(zLong.n > 0 && zLong.jeSignal > 0 && (zShort.n === 0 || zShort.jeSignal > 0), '1k Richtung stimmt: Rohertrag long ' + f4(zLong.jeSignal) + ' Pp (n ' + zLong.n + '), short ' + f4(zShort.jeSignal) + ' Pp (n ' + zShort.n + ') - beide in Signalrichtung positiv');
  var sollNetto = STAERKE * 100 - K.KLASSEN[1].huerde;
  pruefe(Math.abs(mittel(zNetto.mittelJeTag) - sollNetto) < 0.05, '1l Groesse stimmt: Netto-Tagesmittel ' + f4(mittel(zNetto.mittelJeTag)) + ' Pp bei Soll ' + f4(sollNetto) + ' (+0,50 gepflanzt minus Huerde ' + f4(K.KLASSEN[1].huerde) + '), Abweichung ' + f4(mittel(zNetto.mittelJeTag) - sollNetto));
  var z3 = tagesreiheAusZellen(mp.eintraege, 0, dI, 0, 1, null, false), zS = tagesreiheAusZellen(mp.eintraege, 0, dI, 0, 2, null, false);
  pruefe(Math.abs(z3.jeSignal) < 0.05 && Math.abs(zS.jeSignal) < 0.05, '1m Gegenprobe: die Pflanzung sitzt nur in der 1h-Ausstiegskerze - 3h ' + f4(z3.jeSignal) + ' Pp und bis Schluss ' + f4(zS.jeSignal) + ' Pp bleiben nahe null');

  /* Ohne Pflanzung: nahe null */
  var m0 = messe(roh, DETS);
  KUNST.roh = m0; KUNST.rohKerzen = roh;
  var z0 = tagesreiheAusZellen(m0.eintraege, 0, dI, 0, 0, null, false);
  pruefe(z0.n > 0 && Math.abs(z0.jeSignal) < 0.05 && Math.abs(mittel(z0.mittelJeTag)) < 0.05, '1n ohne Pflanzung nahe null: Rohertrag je Signal ' + f4(z0.jeSignal) + ' Pp, Tagesmittel ' + f4(mittel(z0.mittelJeTag)) + ' (n ' + z0.n + ', ' + z0.tage.length + ' Tage)');
  pruefe((m0.stat.signale[wahl.key] || [])[0] === wahl.pass1.signale.length, '1o Signalmenge ohne Pflanzung: messeDatei ' + (m0.stat.signale[wahl.key] || [])[0] + ' = naiv ' + wahl.pass1.signale.length);
});

/* ====================================================================================== */
abschnitt(2, 'PLACEBO A und B auf der Zufallsreihe ohne Pflanzung', function () {
  if (!KUNST.roh) { fehlt('2 kein ungepflanzter Lauf aus Pruefung 1'); return; }
  var m0 = KUNST.roh, E = m0.eintraege, Z = m0.Z;
  /* (a) gepoolt je (ZR, H): Tagesmittel von dir_p * (rohLong_p - Topfmittel) */
  var pool = {};
  E.forEach(function (e) {
    if (e.art !== 1) return;
    var tm = m0.topf.get(e.zr + '|' + e.h + '|' + e.tag + '|' + e.klasse + '|' + e.lebend);
    if (!tm) { pool.ohneTopf = (pool.ohneTopf || 0) + 1; return; }
    var k = e.zr + '|' + e.h, p = pool[k] || (pool[k] = {}), z = p[e.tag] || (p[e.tag] = { num: 0, n: 0 });
    z.num += e.s - e.dir * e.n * tm.mittel; z.n += e.n;                  // e.s = Summe dir*rohLong
  });
  pruefe(!pool.ohneTopf, '2a jede Placebo-Zelle hat einen Topf derselben (ZR, H, Tag, Klasse, lebend): ' + (pool.ohneTopf || 0) + ' ohne');
  var schlecht = [], zeilen = [];
  for (var zi = 0; zi < K.N_ZR; zi++) for (var h = 0; h < K.N_H; h++) {
    var p = pool[zi + '|' + h]; if (!p) { zeilen.push(K.ZEITRAHMEN[zi].key + '/' + K.HALTEDAUERN[h].key + ': keine Ziehung'); continue; }
    var tm = Object.keys(p).map(function (t) { return p[t].num / p[t].n; }), n = Object.keys(p).reduce(function (a, t) { return a + p[t].n; }, 0);
    var mw = mittel(tm), t = tWert(tm);
    zeilen.push(K.ZEITRAHMEN[zi].key + '/' + K.HALTEDAUERN[h].key + ' ' + f4(mw) + ' Pp (t ' + f2(t) + ', ' + tm.length + ' Tage, ' + n + ' Ziehungen)');
    if (tm.length >= 20 && !(Math.abs(mw) < 0.03 && Math.abs(t) < 3)) schlecht.push(K.ZEITRAHMEN[zi].key + '/' + K.HALTEDAUERN[h].key);
  }
  console.log('   Placebo A gegen Topf: ' + zeilen.join(' | '));
  pruefe(schlecht.length === 0 && zeilen.length === 9, '2b Placebo A gepoolt je (ZR, H): |Tagesmittel| < 0,03 Pp und |t| < 3 ueberall' + (schlecht.length ? ' - verfehlt: ' + schlecht.join(', ') : ''));
  /* (b) Ziehungen je (Kandidat, Tag) bei Haltedauer 'bis Schluss' (jede zulaessige Kerze hat dort einen Ausstieg) */
  var hS = K.N_H - 1, je = {};
  E.forEach(function (e) {
    if (e.h !== hS) return;
    var k = e.kand + '|' + e.tag, z = je[k] || (je[k] = { K: [0, 0], A: [0, 0], B: [0, 0] });
    z[['K', 'A', 'B'][e.art]][e.dirIdx] += e.n;
  });
  var nPaare = 0, aFalsch = 0, bZuViel = 0, bFehl = 0, sigGesamt = 0, richtungFalsch = 0;
  Object.keys(je).forEach(function (k) {
    var z = je[k], kS = z.K[0] + z.K[1], aS = z.A[0] + z.A[1], bS = z.B[0] + z.B[1];
    nPaare++; sigGesamt += kS;
    if (aS !== kS) aFalsch++;
    if (bS > kS) bZuViel++;
    bFehl += kS - bS;
    if (z.B[0] > z.K[0] || z.B[1] > z.K[1]) richtungFalsch++;
  });
  pruefe(nPaare > 100 && aFalsch === 0, '2c Placebo A: Ziehungen je (Kandidat, Tag) = Signale des Tages in ' + (nPaare - aFalsch) + ' von ' + nPaare + ' Paaren');
  pruefe(Z.placeboAGezogen === sigGesamt && sigGesamt === m0.stat.signaleGesamt, '2d Zaehler placeboAGezogen ' + Z.placeboAGezogen + ' = Signale aus den Zellen ' + sigGesamt + ' = stat.signaleGesamt ' + m0.stat.signaleGesamt);
  pruefe(bZuViel === 0 && bFehl === Z.placeboBOhnePartner && richtungFalsch === 0, '2e Placebo B: je (Kandidat, Tag) hoechstens so viele Ziehungen wie Signale, Fehlbetrag ' + bFehl + ' = Zaehler ohnePartner ' + Z.placeboBOhnePartner + ', Richtungsverteilung je Richtung nie ueber der der Signale (' + richtungFalsch + ' Verstoesse)');
  pruefe(Z.placeboBGezogen + Z.placeboBOhnePartner === sigGesamt, '2f Placebo B: gezogen ' + Z.placeboBGezogen + ' + ohne Partner ' + Z.placeboBOhnePartner + ' = Signale ' + sigGesamt);
  /* Placebo B traegt die Richtung des echten Signals: bei 0 ohne Partner exakt dieselbe Richtungsverteilung */
  if (Z.placeboBOhnePartner === 0) {
    var gleich = Object.keys(je).every(function (k) { return je[k].B[0] === je[k].K[0] && je[k].B[1] === je[k].K[1]; });
    pruefe(gleich, '2g Placebo B: Richtungsverteilung je (Kandidat, Tag) exakt die der Signale (kein Fall ohne Partner)');
  } else ueber('2g Placebo-B-Richtungsverteilung exakt: ' + Z.placeboBOhnePartner + ' Faelle ohne Partner - nur die Schranke aus 2e prueft');
});

/* ====================================================================================== */
abschnitt(3, 'GEGENPROBE GETEILTER KURS (Nachtrag 15) - Signalschluss als Einstieg erzeugt den Scheineffekt', function () {
  if (!KUNST.roh) { fehlt('3 kein ungepflanzter Lauf aus Pruefung 1'); return; }
  var roh = KUNST.rohKerzen, wahl = null;
  ['rsi2', 'reversion'].forEach(function (key) {
    if (wahl) return;
    var D = det(key), p = K.paramsFuer(D, '1m'), n1 = naiveSignale(roh, D, p);
    var longs = n1.signale.filter(function (s) { return s.dir > 0; });
    if (longs.length >= 30) wahl = { key: key, D: D, n1: n1, longs: longs };
  });
  if (!pruefe(!!wahl, '3a ein Dip-Detektor (rsi2/reversion) hat >= 30 Long-Signale auf der Zufallsreihe')) return;
  var richtig = [], falsch = [];
  wahl.longs.forEach(function (s) { var r = rendite1h(wahl.n1.bars, s), f = rendite1h(wahl.n1.bars, s, true); if (r === r && f === f) { richtig.push(r); falsch.push(f); } });
  var mR = mittel(richtig), mF = mittel(falsch), seR = sd(richtig) / Math.sqrt(richtig.length);
  console.log('   ' + wahl.key + ' long 1m: n ' + richtig.length + ', richtig ' + f4(mR) + ' Pp (se ' + f4(seR) + '), falsch ' + f4(mF) + ' Pp');
  pruefe(mF > 0.05 && mF - mR >= 0.05, '3b FALSCH (Einstieg Signalschluss) ' + f4(mF) + ' Pp > +0,05 und ' + f4(mF - mR) + ' ueber RICHTIG - der Scheineffekt entsteht in behaupteter Richtung');
  pruefe(Math.abs(mR) < 0.05, '3c RICHTIG (Einstieg Eroeffnung i+1) nahe null: ' + f4(mR) + ' Pp');
  var z = tagesreiheAusZellen(KUNST.roh.eintraege, 0, detIdx(wahl.key), 0, 0, 0, false);
  pruefe(z.n === richtig.length && Math.abs(z.jeSignal - mR) < 0.001, '3d messen.js-Zelle (' + wahl.key + ' 1m long 1h, roh je Signal) ' + f4(z.jeSignal) + ' Pp bei n ' + z.n + ' = eigene richtige Rechnung ' + f4(mR) + ' bei n ' + richtig.length + ' (|Diff| ' + Math.abs(z.jeSignal - mR).toExponential(2) + ')');
});

/* ====================================================================================== */
abschnitt(4, 'DETEKTOR-GLEICHHEIT gegen quant.js an echten Kerzen (AAPL/2024, 5m)', function () {
  var b = aapl2024().bars['5m'];
  pruefe(b.length > 3300, '4a AAPL/2024 5m: ' + b.length + ' Kerzen (' + aapl2024().g.quelle + ', ' + aapl2024().g.kerzen.length + ' regulaere 1m-Kerzen)');
  var quelle = fs.readFileSync(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'), 'utf8');
  function konst(name) { var m = quelle.match(new RegExp('var ' + name + ' = (\\{[^}]*\\});')); if (!m) throw new Error(name + ' nicht in _tabelle.js gefunden'); return new Function('return ' + m[1])(); }
  var P_KAPI = konst('P_KAPI'), P_RSI2SEIT = konst('P_RSI2SEIT');
  function dirVon(s) { return s === 'call' ? 1 : s === 'put' ? -1 : 0; }
  function dirTab(s) { return s && s.dir ? (s.dir > 0 ? 1 : -1) : 0; }
  var faelle = [
    { key: 'rsi2', ab: 260, schritt: 3, ref: function (i) { return dirVon(Q.rsiExtremSignal(b.slice(i - 260, i + 1), 10, 90).signal); } },
    { key: 'reversion', ab: 260, schritt: 3, ref: function (i) { return dirVon(Q.reversionSignal(b.slice(Math.max(0, i - 260), i + 1), 'ema', 20, 2.0).signal); } },
    { key: 'squeeze', ab: 260, schritt: 3, ref: function (i) { return dirVon(Q.squeezeSignal(b.slice(Math.max(0, i - 260), i + 1), 20, 2).signal); } },
    { key: 'donchian', ab: 29, schritt: 3, ref: function (i) { return dirVon(Q.donchianSignal(b.slice(i - 29, i + 1), 20, 15).signal); } },
    { key: 'kapitulation', ab: 260, schritt: 1, ref: function (i) { var s = Q.einstiegSignal(b, i, P_KAPI); return s && s.dir === 'call' ? 1 : 0; } },
    { key: 'rsi2seit', ab: 260, schritt: 1, ref: function (i) { var s = Q.einstiegSignal(b, i, P_RSI2SEIT); return s && s.dir ? dirVon(s.dir) : 0; } },
  ];
  faelle.forEach(function (f) {
    var D = det(f.key), p = K.paramsFuer(D, '5m'), n = 0, sig = 0, abw = 0, erste = null;
    for (var i = f.ab; i < b.length; i += f.schritt) {
      var a = dirTab(D.signal(b, i, p)), r = f.ref(i); n++;
      if (a) sig++;
      if (a !== r) { abw++; if (!erste) erste = { i: i, tab: a, quant: r }; }
    }
    var txt = '4 ' + f.key + ' (5m, mtf/tagesreihe ' + JSON.stringify(p) + '): ' + n + ' Indizes, ' + sig + ' Signale, ' + abw + ' Abweichungen' + (erste ? ' - erste bei i=' + erste.i + ' Mantel ' + erste.tab + ' / quant ' + erste.quant : '');
    if (abw === 0 && sig === 0) ueber(txt + ' - 0 Signale, Gleichheit nur fuer null geprueft');
    else pruefe(n >= 3000 && abw === 0, txt);
  });
});

/* ====================================================================================== */
abschnitt(5, 'AUFRUF-FENSTERUNG UND VORFILTER (Nachtrag 11) an AAPL/2024 auf 1m, 5m, 15m', function () {
  var A = aapl2024();
  K.ZEITRAHMEN.forEach(function (zr) {
    var b = A.bars[zr.key], T = L.tageAus(b);
    function diVon(i) { var lo = 0, hi = T.length - 1; while (lo < hi) { var m = (lo + hi) >> 1; if (T[m].bis < i) lo = m + 1; else hi = m; } return lo; }
    /* vwap-abstand: Fenster ab Tagesanfang mit >= 110 Kerzen davor gegen das volle Praefix */
    var Dv = det('vwap-abstand'), pv = K.paramsFuer(Dv, zr.key);
    var von = Math.floor(b.length * 0.2), bis = Math.floor(b.length * 0.62), schritt = Math.max(1, Math.floor((bis - von) / 400));
    var idx = []; for (var i = von; i < bis && idx.length < 400; i += schritt) idx.push(i);
    var abw = 0, sig = 0, erste = null;
    idx.forEach(function (i) {
      var a = M.rufe(Dv, pv, b, i, T, diVon(i)), r = Dv.signal(b, i, pv);
      var da = a && a.dir ? a.dir : 0, dr = r && r.dir ? r.dir : 0;
      if (dr) sig++;
      if (da !== dr) { abw++; if (!erste) erste = { i: i, rufe: da, voll: dr }; }
    });
    var txt = '5 vwap-abstand ' + zr.key + ': ' + idx.length + ' Indizes, ' + sig + ' Signale (volles Praefix), ' + abw + ' Abweichungen' + (erste ? ' - erste i=' + erste.i + ' rufe ' + erste.rufe + ' / voll ' + erste.voll : '');
    if (sig === 0 && abw === 0) ueber(txt + ' - 0 Signale im Stichprobenbereich, nur null verglichen');
    else pruefe(idx.length >= 400 && abw === 0, txt);
    /* kanaltrend: Vorfilter (signalCross-Kreuzung) gegen den vollen Aufruf; Stichprobe plus alle Fundstellen des Vorfilters */
    var Dk = det('kanaltrend'), pk = K.paramsFuer(Dk, zr.key);
    var schrittK = Math.max(1, Math.floor(b.length / 3000)), menge = new Set();
    for (var j = 261; j < b.length; j += schrittK) menge.add(j);
    for (var q = 261; q < b.length; q += Math.max(1, Math.floor(schrittK / 4))) { var s = M.rufe(Dk, pk, b, q, T, diVon(q)); if (s && s.dir) menge.add(q); }
    var abwK = 0, sigK = 0, ersteK = null, nK = 0;
    menge.forEach(function (i) {
      var a = M.rufe(Dk, pk, b, i, T, diVon(i)), r = Dk.signal(b, i, pk); nK++;
      var da = a && a.dir ? a.dir : 0, dr = r && r.dir ? r.dir : 0;
      if (dr) sigK++;
      if (da !== dr) { abwK++; if (!ersteK) ersteK = { i: i, rufe: da, voll: dr }; }
    });
    var txtK = '5 kanaltrend ' + zr.key + ': ' + nK + ' Indizes, ' + sigK + ' Signale (voller Aufruf), ' + abwK + ' Abweichungen' + (ersteK ? ' - erste i=' + ersteK.i + ' rufe ' + ersteK.rufe + ' / voll ' + ersteK.voll : '');
    if (sigK === 0 && abwK === 0) ueber(txtK + ' - 0 Signale (kanaltrend auf ' + zr.key + ' fast signalfrei, Tabelle), nur null verglichen');
    else pruefe(nK >= 400 && abwK === 0, txtK);
  });
});

/* ====================================================================================== */
abschnitt(6, 'VERDICHTUNG = verdichtenMinuten (naive 5m/15m gegen L.verdichte auf AAPL-1m)', function () {
  var k1 = aapl2024().bars['1m'];
  ['5m', '15m'].forEach(function (zrKey) {
    var iv = zrKey === '5m' ? 5 : 15, aus = [], akt = null;
    var erster = k1[0][0];
    /* Erste Periode nur, wenn sie nicht vor dem ersten Stempel begann (Viewer); die letzte Periode der Reihe
     * wird IMMER geschlossen (lesen.js verdichte, Review F1: Sentinel statt Viewer-Regel "unvollstaendig faellt"). */
    function schliesse() { if (!akt) return; if (akt.t >= erster) aus.push([akt.t, akt.zu, akt.um, akt.hoch, akt.tief, akt.auf]); akt = null; }
    k1.forEach(function (k) {
      var m = minutenSeitAuf(k[0]);                                        // Minuten seit 09:30 ET desselben Tages
      var start = k[0] - (((m % iv) + iv) % iv) * MIN;                    // Periodenanfang auf dem 09:30-Gitter
      if (akt && start !== akt.t) schliesse();
      if (!akt) akt = { t: start, auf: k[5], zu: k[1], hoch: k[3], tief: k[4], um: k[2] };
      else { akt.zu = k[1]; if (k[3] > akt.hoch) akt.hoch = k[3]; if (k[4] < akt.tief) akt.tief = k[4]; akt.um += k[2]; }
    });
    schliesse();
    var v = aapl2024().bars[zrKey], abw = 0, erste = null;
    var n = Math.min(v.length, aus.length);
    for (var i = 0; i < n; i++) for (var f = 0; f < 6; f++) if (v[i][f] !== aus[i][f]) { abw++; if (!erste) erste = { i: i, feld: f, app: v[i][f], naiv: aus[i][f] }; break; }
    pruefe(v.length === aus.length && abw === 0, '6 ' + zrKey + ': ' + v.length + ' App-Kerzen = ' + aus.length + ' naive Kerzen, ' + abw + ' ungleiche Kerzen' + (erste ? ' - erste i=' + erste.i + ' Feld ' + erste.feld + ' App ' + erste.app + ' / naiv ' + erste.naiv : ''));
    var stempelFalsch = 0, vor = 0, nach = 0;
    v.forEach(function (k) { var m = minutenSeitAuf(k[0]); if (m % iv !== 0) stempelFalsch++; if (m < 0) vor++; if (m > 390 - iv) nach++; });
    pruefe(stempelFalsch === 0 && vor === 0 && nach === 0, '6 ' + zrKey + ' Stempel: alle auf dem 09:30-ET-Gitter (' + stempelFalsch + ' daneben), ' + vor + ' vor 09:30, ' + nach + ' nach ' + (zrKey === '5m' ? '15:55' : '15:45') + ' ET');
  });
  /* Sentinel (Review F1): endet die Reihe vor dem Periodenende (15:57 statt 15:59), bleibt die letzte 5m-Kerze. */
  var tagK = K.kalender().tage.filter(function (t) { return t >= '2024-03-01'; })[0], k1k = kunstReihe([tagK], 6).slice(0, 388);
  var v5k = L.verdichte(k1k, '5m'), letzte = v5k[v5k.length - 1];
  pruefe(v5k.length === 78 && letzte && minutenSeitAuf(letzte[0]) === 385 && letzte[1] === k1k[387][1] && letzte[2] === k1k[385][2] + k1k[386][2] + k1k[387][2], '6 Sentinel: 388 Minutenkerzen (bis 15:57) ergeben ' + v5k.length + ' 5m-Kerzen, die letzte um 15:55 ET schliesst mit der 15:57-Kerze und traegt den Umsatz ihrer 3 Minuten');
});

/* ====================================================================================== */
abschnitt(7, 'KLASSEN UND HUERDEN gegen kosten.js, liquide.js und wiki/kosten.md', function () {
  var kt = fs.readFileSync(path.join(K.REPO, 'kosten.js'), 'utf8');
  var re = /\{\s*name:\s*'([^']+)',\s*von:\s*([0-9.e]+|Infinity),\s*bis:\s*([0-9.e]+|Infinity)\s*\}/g, m, zeilen = [];
  while ((m = re.exec(kt))) zeilen.push({ name: m[1], von: Number(m[2]), bis: Number(m[3]) });
  var gleich = zeilen.length === K.KLASSEN.length && K.KLASSEN.every(function (k, i) { return zeilen[i] && zeilen[i].name === k.name && zeilen[i].von === k.von && zeilen[i].bis === k.bis; });
  pruefe(gleich, '7a K.KLASSEN-Grenzen stehen als Text in kosten.js UMSATZ_KLASSEN: ' + zeilen.map(function (z) { return z.name + ' ' + z.von + '-' + z.bis; }).join(', '));
  pruefe(K.klasseIndex(4.99e6) === -1 && K.klasseIndex(NaN) === -1 && K.klasseIndex(-1) === -1 && K.klasseIndex(5e6) === 0 && K.klasseIndex(50e6) === 1 && K.klasseIndex(250e6) === 2 && K.klasseIndex(1e9) === 3 && K.klasseIndex(1e12) === 3, '7b klasseIndex: -1 unter 5 Mio $ und bei NaN, Grenzen 5/50/250/1000 Mio $ jeweils zur oberen Klasse');
  var probe = [[0, 30, 100], [0, 10, 100], [0, 40, 100], [0, 20, 100]];                      // Umsaetze 3000, 1000, 4000, 2000 -> sortiert[4>>1] = 3000
  pruefe(Liquide.medianUmsatz(probe, 3, 4) === 3000 && Liquide.median([1, 2, 3, 4]) === 3, '7c Liquide.medianUmsatz = sortiert[n>>1] (Beispiel 4 Tage -> 3000, kein Mittel der Mitte)');
  pruefe(K.UMSATZ_FENSTER === Liquide.KORB.fenster, '7d K.UMSATZ_FENSTER ' + K.UMSATZ_FENSTER + ' = Liquide.KORB.fenster ' + Liquide.KORB.fenster);
  var md = fs.readFileSync(path.join(K.REPO, 'wiki', 'kosten.md'), 'utf8').split(/\r?\n/);
  function tabelle(ueberschrift) {
    var start = -1; for (var i = 0; i < md.length; i++) if (ueberschrift.test(md[i]) && /^#/.test(md[i])) { start = i; break; }
    if (start < 0) throw new Error('Ueberschrift nicht gefunden: ' + ueberschrift);
    var zeilen = [], drin = false;
    for (var j = start + 1; j < md.length; j++) { var z = md[j].trim(); if (/^\|/.test(z)) { drin = true; zeilen.push(z.split('|').slice(1, -1).map(function (c) { return c.replace(/\*\*/g, '').trim(); })); } else if (drin) break; if (/^#/.test(z)) break; }
    return zeilen.slice(2);                                                                    // Kopf und Trennzeile weg
  }
  function zahl(c) { return parseFloat(c.replace(',', '.')); }
  function vergleiche(bez, ueberschrift, spalte, feld) {
    var rows = tabelle(ueberschrift), je = {}; rows.forEach(function (r) { je[r[0]] = zahl(r[spalte]); });
    var fehl = K.KLASSEN.filter(function (k) { return !(Math.abs(je[k.name] - k[feld]) < 1e-9); });
    pruefe(rows.length >= 4 && fehl.length === 0, bez + ': ' + K.KLASSEN.map(function (k) { return k.name + ' ' + f4(k[feld]) + (Math.abs(je[k.name] - k[feld]) < 1e-9 ? '=' : '!=') + je[k.name]; }).join(', '));
  }
  vergleiche('7e huerde (mitte ab 2021) gegen kosten.md "Das K der Kostenformel", Spalte K ab 2021', /Das K der Kostenformel/, 2, 'huerde');
  vergleiche('7f huerdeSchluss gegen kosten.md "Die Schluss-Huerde je Klasse", Spalte Schluss ab 2021', /Die Schluss-H.rde je Klasse/, 1, 'huerdeSchluss');
  vergleiche('7g eroeffnungFaktor gegen kosten.md "Je Klasse x Fenster", Spalte Eroeffnung/Mitte', /Je Klasse . Fenster/, 4, 'eroeffnungFaktor');
  var hf = K.KLASSEN.every(function (k, i) { return K.huerdeFenster(i, 0, 390) === k.huerdeEroeffnung && K.huerdeFenster(i, 29, 390) === k.huerdeEroeffnung && K.huerdeFenster(i, 30, 390) === k.huerde && K.huerdeFenster(i, 359, 390) === k.huerde && K.huerdeFenster(i, 360, 390) === k.huerdeSchluss; });
  var hfHalb = K.KLASSEN.every(function (k, i) { return K.huerdeFenster(i, 179, 210) === k.huerde && K.huerdeFenster(i, 180, 210) === k.huerdeSchluss; });
  pruefe(hf && hfHalb, '7h huerdeFenster: erste 30 Sitzungsminuten Eroeffnung (' + K.KLASSEN.map(function (k) { return f4(k.huerdeEroeffnung); }).join('/') + '), letzte 30 Schluss (Volltag ab 15:30, Halbtag ab 12:30), sonst mitte');
  var eroeff = K.KLASSEN.every(function (k) { return k.huerdeEroeffnung === k.huerde * k.eroeffnungFaktor; });
  pruefe(eroeff, '7i huerdeEroeffnung = huerde x eroeffnungFaktor ungerundet (Nachtrag 21: verglichen wird ungerundet)');

  /* ---- Cent-Boden (Nachtrag 3, PM-Frage 7) ---- */
  var cb3 = K.centBodenPp(3), cb180 = K.centBodenPp(180);
  pruefe(Math.abs(cb3 - 100 * K.CENT_BODEN_USD / 3) < 1e-12 && Math.abs(cb180 - 100 * K.CENT_BODEN_USD / 180) < 1e-12 && cb3 > K.KLASSEN[0].huerde && cb180 < K.KLASSEN[3].huerde,
    '7j Cent-Boden = 100 x ' + K.CENT_BODEN_USD + ' / Kurs: bei 3 $ ' + f4(cb3) + ' Pp (ueber der Huerde 5-50 ' + f4(K.KLASSEN[0].huerde) + '), bei 180 $ ' + f4(cb180) + ' Pp (unter ab1000 ' + f4(K.KLASSEN[3].huerde) + ')');
  var ucb = K.ueberCentBoden(3, 0) === true && K.ueberCentBoden(180, 0) === false && K.ueberCentBoden(0, 0) === true;
  pruefe(ucb, '7k ueberCentBoden vergleicht gegen die Huerde DER KLASSE (3 $ in 5-50 ja, 180 $ nein, Kurs 0 gilt als ueber dem Boden)');

  /* Rueckrechnung auf den rohen Kurs: die bereinigte Kopie teilt vor dem Ex-Tag durch den Faktor. */
  var rf = L.rohFaktorFunktion([{ exMs: L.etTagMs('2020-08-31'), faktor: 4 }]);
  var vor = rf(L.etTagMs('2020-01-02')), nach = rf(L.etTagMs('2020-12-31'));
  pruefe(vor === 4 && nach === 1, '7l rohFaktor: vor dem Ex-Tag ' + vor + ' (Kurs x4), danach ' + nach + ' - AAPL Januar 2020 bereinigt 73,94 => roh 295,75 $');
  var rf0 = L.rohFaktorFunktion([]);
  pruefe(rf0(0) === 1 && rf0(Date.now ? 1e12 : 1e12) === 1, '7m rohFaktor ohne Massnahmen ist immer 1 (die Rohdatei IST dann die bereinigte)');
});

/* ====================================================================================== */
abschnitt(8, 'AUGUST-KONSTANTEN gegen messgeschirr.js', function () {
  var mg = fs.readFileSync(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'messgeschirr.js'), 'utf8');
  var cd = mg.match(/COOLDOWN\s*=\s*\{\s*'1m':\s*(\d+)/), mr = mg.match(/MIN_REST\s*=\s*\{\s*'1m':\s*(\d+)/);
  pruefe(cd && +cd[1] === K.COOLDOWN_MIN, '8a COOLDOWN_MIN ' + K.COOLDOWN_MIN + ' = messgeschirr COOLDOWN 1m ' + (cd && cd[1]) + ' Kerzen');
  pruefe(mr && +mr[1] === K.MIN_REST_MIN, '8b MIN_REST_MIN ' + K.MIN_REST_MIN + ' = messgeschirr MIN_REST 1m ' + (mr && mr[1]) + ' Kerzen');
  var ho = mg.match(/'1m':\s*\[\[(\d+),\s*'1h'\],\s*\[(\d+),\s*'3h'\],\s*\['TS',\s*'TS'\]\]/);
  var hd = K.HALTEDAUERN;
  pruefe(ho && hd.length === 3 && hd[0].min === +ho[1] && hd[1].min === +ho[2] && hd[2].min === null && hd[2].key === 'schluss', '8c HALTEDAUERN ' + hd.map(function (h) { return h.key + ':' + h.min; }).join(', ') + ' = HORIZONTE 1m [' + (ho ? ho[1] + ', ' + ho[2] + ', TS' : '?') + ']');
  pruefe(/soll \* 0\.8/.test(mg) && K.DICHTE_MIN === 0.8, '8d DICHTE_MIN ' + K.DICHTE_MIN + ' = 80-%-Regel "soll * 0.8" in messgeschirr.js ladeUniversum');
});

/* ====================================================================================== */
abschnitt(9, 'FORTSETZBARKEIT in Kindprozessen (Mini-Archiv, --max, Fortsetzung, --neu, fremde Kennung)', function () {
  var wurzel = path.join(KRATZ, 'kunstarchiv'), roh = path.join(wurzel, 'alpaca1m');
  var kalQuelle = path.join(K.ORTE.roh(), '_kalender.json');
  if (!fs.existsSync(kalQuelle)) { ueber('9 echter Kalender ' + kalQuelle + ' nicht erreichbar - kein Mini-Archiv'); return; }
  fs.rmSync(wurzel, { recursive: true, force: true });
  fs.mkdirSync(roh, { recursive: true });
  fs.copyFileSync(kalQuelle, path.join(roh, '_kalender.json'));
  var kal = K.kalender(), tage23 = kal.tage.filter(function (t) { return t >= '2023-01-01' && t < '2024-01-01'; }).slice(-22), tage24 = kal.tage.filter(function (t) { return t >= '2024-01-01'; }).slice(0, 12);
  var lebenszeit = { stand: new Date().toISOString(), bisJahr: 2024, werte: {} }, symbole = { stand: new Date().toISOString(), gruppe: {}, ordner: {} };
  ['AAPL', 'MSFT'].forEach(function (sym, si) {                                              // echte CS-Kuerzel als Namen der Kunst-Reihen (Wertpapierart-Karte)
    fs.mkdirSync(path.join(roh, sym), { recursive: true });
    var alle = [];
    [[2023, tage23], [2024, tage24]].forEach(function (jt) {
      var kerzen = kunstReihe(jt[1], 900 + si * 10 + jt[0]), T = zerlegeTage(kerzen);
      var datei = { sym: sym, format: 2, felder: '[zeit, schluss, umsatz, hoch, tief, eroeffnung]', quellen: [{ von: kerzen[0][0], bis: kerzen[kerzen.length - 1][0], quelle: 'kunst' }],
        series: kerzen, sitzungen: T.map(function (d) { return { von: kerzen[d.von][0], bis: kerzen[d.bis][0], sitzung: 'regulaer' }; }), jahr: jt[0] };
      fs.writeFileSync(path.join(roh, sym, jt[0] + '.json'), JSON.stringify(datei));
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
  function kind(args) {
    var r = cp.spawnSync(process.execPath, [path.join(K.HIER, 'messen.js')].concat(args), { env: env, cwd: K.HIER, encoding: 'utf8', timeout: 600000, maxBuffer: 64 * 1024 * 1024 });
    return { status: r.status, out: (r.stdout || '') + (r.stderr || '') };
  }
  function fortschritt(ordner) { return JSON.parse(fs.readFileSync(path.join(ordner, '_fortschritt.json'), 'utf8')); }
  var ra = kind(['--aus', a, '--max', '2', '--neu', '--checkpoint', '1']);
  var Fa = ra.status === 0 ? fortschritt(a) : null;
  pruefe(ra.status === 0 && Fa && Fa.dateien === 2 && Fa.beendet === 'max erreicht' && Object.keys(Fa.erledigt).length === 2 && /ENDE max erreicht/.test(ra.out), '9a Lauf (a) --max 2 --neu: Rueckgabe ' + ra.status + ', ' + (Fa && Fa.dateien) + ' Dateien, beendet "' + (Fa && Fa.beendet) + '", erledigt ' + (Fa && Object.keys(Fa.erledigt).join(' ')));
  if (ra.status !== 0) console.log(ra.out.slice(-2000));
  var rb = kind(['--aus', a]);
  var Fb = rb.status === 0 ? fortschritt(a) : null;
  pruefe(rb.status === 0 && Fb && Fb.dateien === 4 && Fb.beendet === 'vollstaendig' && /FORTSETZUNG: 2 Dateien erledigt/.test(rb.out) && Fa && Fb.zellenStand > Fa.zellenStand && Fb.begonnen === Fa.begonnen, '9b Lauf (b) Fortsetzung: Rueckgabe ' + rb.status + ', protokolliert FORTSETZUNG mit 2 erledigten, danach ' + (Fb && Fb.dateien) + ' Dateien, beendet "' + (Fb && Fb.beendet) + '", Zellenstand ' + (Fa && Fa.zellenStand) + ' -> ' + (Fb && Fb.zellenStand) + ', Beginn-Stempel des ersten Laufs behalten');
  if (rb.status !== 0) console.log(rb.out.slice(-2000));
  var rc = kind(['--aus', b, '--neu']);
  var Fc = rc.status === 0 ? fortschritt(b) : null;
  pruefe(rc.status === 0 && Fc && Fc.dateien === 4 && Fc.beendet === 'vollstaendig', '9c Lauf (c) --neu am Stueck: Rueckgabe ' + rc.status + ', ' + (Fc && Fc.dateien) + ' Dateien, beendet "' + (Fc && Fc.beendet) + '"');
  if (rc.status !== 0) console.log(rc.out.slice(-2000));
  if (Fb && Fc) {
    var za = fs.readFileSync(path.join(a, '_zellen.bin')), zb = fs.readFileSync(path.join(b, '_zellen.bin'));
    /* Die Dateien tragen am Ende den Zellenstand (Review F2) - der ist nach (a)+(b) und (c) verschieden, alles
     * davor muss byteidentisch sein; lade() prueft den Stand gegen _fortschritt.json. */
    var spA = M.Speicher.lade(path.join(a, '_zellen.bin'), kal.tage.length, Fb.zellenStand), spB = M.Speicher.lade(path.join(b, '_zellen.bin'), kal.tage.length, Fc.zellenStand);
    var nSumme = 0; for (var i = 0; i < spB.n.length; i++) nSumme += spB.n[i];
    var koerper = za.length === zb.length && za.subarray(0, za.length - 8).equals(zb.subarray(0, zb.length - 8));
    pruefe(koerper && nSumme > 0 && spA.stand === Fb.zellenStand && spB.stand === Fc.zellenStand, '9d _zellen.bin (a+b) und (c) BYTEIDENTISCH bis auf den Stand-Schwanz (' + za.length + ' Bytes, Staende ' + spA.stand + ' / ' + spB.stand + ' = _fortschritt.json, Summe n ' + nSumme + ' > 0 - die Zellen sind nicht leer)');
    pruefe(Fb.dateien === Fc.dateien && JSON.stringify(Fb.signale) === JSON.stringify(Fc.signale) && JSON.stringify(Fb.erledigt) === JSON.stringify(Fc.erledigt), '9e _fortschritt.json: dateien ' + Fb.dateien + ' = ' + Fc.dateien + ', Signalzahlen je Reihe und erledigte Dateien gleich');
    var sig = Object.keys(Fc.signale), mitSig = sig.filter(function (r) { return Object.keys(Fc.signale[r].det).some(function (d) { return Fc.signale[r].det[d][0] > 0; }); });
    var gewertet = sig.map(function (r) { return z1m(Fc.signale[r].tageGewertet); });
    pruefe(sig.length === 2 && mitSig.length === 2 && gewertet.every(function (g) { return g === tage23.length - K.UMSATZ_FENSTER + tage24.length; }), '9f beide Kunst-Reihen (' + sig.join(', ') + ') haben Signale und auf 1m je ' + gewertet.join('/') + ' gewertete Tage (Soll ' + (tage23.length - K.UMSATZ_FENSTER + tage24.length) + ': 2023 nach 20 Balkentagen, 2024 ganz dank Warmlauf der Umsaetze)');
  }
  /* (d) fremde Kennung: der Fortschritt gehoert zu einer anderen Konfiguration -> Abbruch mit Grund */
  if (Fb) {
    var Fx = fortschritt(a); Fx.kennung = 'fremde-studie/v0'; fs.writeFileSync(path.join(a, '_fortschritt.json'), JSON.stringify(Fx));
    var rd = kind(['--aus', a]);
    pruefe(rd.status !== 0 && rd.status !== null && /anderen Konfiguration/.test(rd.out) && /fremde-studie\/v0/.test(rd.out), '9g manipulierte kennung: Rueckgabewert ' + rd.status + ' und Meldung "andere Konfiguration" mit der fremden Kennung');
  }
});

/* ====================================================================================== */
abschnitt(10, 'RANDREGELN ueber messeDatei (Fenster, Klasse < 5 Mio $, duenner Tag, Halbtag)', function () {
  var kal = K.kalender(), rsi2 = [det('rsi2')];
  /* (a) Tage nach dem Fensterende 2026-08-31 liefern keine Zelle, werden aber gezaehlt */
  var alleTage = Object.keys(kal.close).sort(), spaet = alleTage.filter(function (t) { return t >= '2026-07-01' && t <= '2026-09-03'; });
  var draussen = spaet.filter(function (t) { return t > K.FENSTER.bis; });
  if (draussen.length === 0) ueber('10a Kalender der Quelle kennt keine Tage nach ' + K.FENSTER.bis);
  else {
    var ma = messe(kunstReihe(spaet, 11), rsi2);
    var topfTage = new Set(); ma.topf.forEach(function (v) { topfTage.add(kal.tage[v.tag]); });
    var zellTage = new Set(); ma.eintraege.forEach(function (e) { zellTage.add(kal.tage[e.tag]); });
    var verboten = Array.from(topfTage).concat(Array.from(zellTage)).filter(function (t) { return !(t <= K.FENSTER.bis); });
    var erwartet = spaet.slice(K.UMSATZ_FENSTER).filter(function (t) { return t <= K.FENSTER.bis; });
    pruefe(z1m(ma.Z.tageOhneKalender) === draussen.length && verboten.length === 0 && topfTage.size === erwartet.length && erwartet.every(function (t) { return topfTage.has(t); }), '10a Kerzen an ' + draussen.length + ' Tagen nach ' + K.FENSTER.bis + ' (' + draussen.join(', ') + '): tageOhneKalender 1m ' + z1m(ma.Z.tageOhneKalender) + ', keine Zelle ausserhalb (' + verboten.length + '), Topf-Tage im Fenster ' + topfTage.size + ' = erwartet ' + erwartet.length);
  }
  /* (b) Umsatz < 5 Mio $: keine Klasse, keine Kandidatenzelle, kein Topf */
  var tage30 = kal.tage.filter(function (t) { return t >= '2024-02-01'; }).slice(0, 30);
  var mb = messe(kunstReihe(tage30, 12, { volMin: 25 }), rsi2);
  pruefe(mb.delta.zellen.size === 0 && mb.delta.topf.size === 0 && z1m(mb.Z.tageOhneKlasse) === tage30.length && z1m(mb.stat.tageGewertet) === 0 && mb.stat.tage === tage30.length, '10b Reihe mit ~1 Mio $ Tagesumsatz: 0 Kandidatenzellen, 0 Topfzellen, tageOhneKlasse 1m ' + z1m(mb.Z.tageOhneKlasse) + ' = ' + tage30.length + ' Balkentage, gewertet ' + z1m(mb.stat.tageGewertet));
  /* (c) duenner Tag: 250 von 390 Kerzen -> nicht gewertet; dichte Tage gewertet */
  var duennTag = tage30[25];
  var kd = kunstReihe(tage30, 13, { duenn: { tag: duennTag, behalte: 250 } }), Td = zerlegeTage(kd);
  var dd = Td.filter(function (d) { return d.tag === duennTag; })[0];
  var mc = messe(kd, rsi2);
  var topfTageC = new Set(); mc.topf.forEach(function (v) { topfTageC.add(kal.tage[v.tag]); });
  var zellTageC = new Set(); mc.eintraege.forEach(function (e) { zellTageC.add(kal.tage[e.tag]); });
  var duennJeZr = K.ZEITRAHMEN.map(function (zr) { return (mc.Z.tageDuenn && mc.Z.tageDuenn[zr.key]) || 0; });
  pruefe(dd && dd.bis - dd.von + 1 === 250 && duennJeZr.every(function (x) { return x === 1; }) && !topfTageC.has(duennTag) && !zellTageC.has(duennTag) && z1m(mc.stat.tageGewertet) === tage30.length - K.UMSATZ_FENSTER - 1 && topfTageC.size === z1m(mc.stat.tageGewertet), '10c duenner Tag ' + duennTag + ' (' + (dd && dd.bis - dd.von + 1) + ' von 390 Kerzen): tageDuenn je Zeitrahmen ' + duennJeZr.join('/') + ', keine Topf-/Kandidatenzelle an diesem Tag, ' + z1m(mc.stat.tageGewertet) + ' dichte Tage auf 1m gewertet (Topf-Tage ' + topfTageC.size + ')');
  /* (d) Halbtag: kein Einstieg nach 12:30 ET. Kunst-Detektoren erzwingen Signale nach Tageszeit. */
  var halb = kal.tage.filter(function (t) { return /^2024-/.test(t) && kal.close[t] && kal.close[t].close === '13:00'; })[0];
  if (!halb) { ueber('10d kein Halbtag 2024 im Kalender'); return; }
  var hi = kal.tage.indexOf(halb), tageH = kal.tage.slice(hi - K.UMSATZ_FENSTER - 2, hi + 3), kh = kunstReihe(tageH, 14);
  var ab1230 = { key: 'kunst-ab1230', params: {}, signal: function (bars, i) { return minutenSeitAuf(bars[i][0]) >= 180 ? { dir: 1 } : null; } };
  var um1200 = { key: 'kunst-1200', params: {}, signal: function (bars, i) { return minutenSeitAuf(bars[i][0]) === 150 ? { dir: 1 } : null; } };
  var md = messe(kh, [ab1230, um1200]), hIdx = kal.idx[halb], hS = K.N_H - 1;
  var nAbHalb = 0, nAbVoll = 0, nUmHalbSchluss = 0, nUmHalb1h = 0, nUmHalbAlleZr = 0;
  md.eintraege.forEach(function (e) {
    if (e.art !== 0) return;
    if (e.tag === hIdx) {
      if (e.det === 0) nAbHalb += e.n;                                                       // alle Zeitrahmen: nie
      else { if (e.h === hS) nUmHalbAlleZr += e.n; if (e.zr === 0 && e.h === hS) nUmHalbSchluss += e.n; if (e.zr === 0 && e.h === 0) nUmHalb1h += e.n; }
    } else if (e.det === 0 && e.zr === 0 && e.h === hS) nAbVoll += e.n;
  });
  pruefe(nAbHalb === 0 && nUmHalbSchluss === 1 && nUmHalbAlleZr === K.N_ZR && nUmHalb1h === 0 && nAbVoll >= 2 && z1m(md.stat.tageGewertet) === tageH.length - K.UMSATZ_FENSTER, '10d Halbtag ' + halb + ': Detektor "ab 12:30 ET" liefert dort 0 Zellen auf allen Zeitrahmen (an Volltagen 1m ' + nAbVoll + ' Schluss-Beobachtungen), Detektor "12:00 ET" liefert auf 1m 1 Schluss-Beobachtung (je Zeitrahmen eine: ' + nUmHalbAlleZr + ') und 0 fuer 1h (kein Ausstieg vor 13:00); ' + z1m(md.stat.tageGewertet) + ' Tage auf 1m gewertet');
  /* direkt: ausstiege/ertrag am Halbtag - zulaessig sind genau die Kerzen bis 12:29 ET */
  var Th = L.tageAus(kh), dh = Th.filter(function (d) { return d.tag === halb; })[0];
  pruefe(dh && dh.sollMin === 210 && dh.schluss === auf0930(halb) + 210 * MIN && dh.auf === auf0930(halb), '10e tageAus am Halbtag: sollMin ' + (dh && dh.sollMin) + ', Schluss = 13:00 ET, Anfang = 09:30 ET');
  if (dh) {
    var exit = M.ausstiege(kh, dh.von, dh.bis), zul = [];
    for (var i = dh.von; i < dh.bis; i++) if (kh[i][0] + MIN + K.MIN_REST_MIN * MIN <= dh.schluss) zul.push(i);
    var letzteMin = minutenSeitAuf(kh[zul[zul.length - 1]][0]);
    var r1229 = M.ertrag(kh, zul[zul.length - 1], 0, dh.bis, exit, 1), r1129 = M.ertrag(kh, zul[zul.length - 61], 0, dh.bis, exit, 1), rS = M.ertrag(kh, zul[zul.length - 1], hS, dh.bis, exit, 1);
    pruefe(zul.length === 180 && letzteMin === 179 && r1229 !== r1229 && r1129 === r1129 && rS === rS, '10f Halbtag zulaessig: ' + zul.length + ' Kerzen, letzte um 12:' + (letzteMin - 150) + ' ET; 1h-Ertrag dort ohne Beobachtung (NaN), um 11:29 beobachtet (' + f4(r1129) + '), bis Schluss beobachtet (' + f4(rS) + ')');
  }
});

/* ====================================================================================== */
abschnitt(11, 'ET-TAG = UTC-TAG fuer alle regulaeren AAPL-1m-Kerzen', function () {
  var k1 = aapl2024().bars['1m'], abw = 0, erste = null, tage = new Set();
  for (var i = 0; i < k1.length; i++) { var u = L.tagVon(k1[i][0]), e = etDatum(k1[i][0]); tage.add(e); if (u !== e) { abw++; if (!erste) erste = { t: k1[i][0], utc: u, et: e }; } }
  pruefe(abw === 0 && k1.length > 90000, '11 ' + k1.length + ' Kerzen an ' + tage.size + ' Tagen: L.tagVon = ET-Datum (Intl America/New_York) in allen Faellen, ' + abw + ' Abweichungen' + (erste ? ' - erste ' + new Date(erste.t).toISOString() + ' utc ' + erste.utc + ' et ' + erste.et : ''));
});

/* ====================================================================================== */
abschnitt(12, 'WERTPAPIERART (Nachtrag 8): L.reihen() nur CS/ADRC, kein Testkuerzel, ETFs gezaehlt', function () {
  var reihen = L.reihen();
  var arten = JSON.parse(fs.readFileSync(path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'wertpapierarten.json'), 'utf8')).arten || {};
  var verboten = { ETF: 1, ETN: 1, ETV: 1, FUND: 1 }, treffer = [], test = [], fremd = [], zaehl = {};
  reihen.forEach(function (R) {
    var basis = R.reihe.replace(/~2$/, ''), art = arten[basis] || arten[basis.replace(/-/g, '.')] || null;
    zaehl[art] = (zaehl[art] || 0) + 1;
    if (art && verboten[art]) treffer.push(R.reihe);
    if (/^Z[VWXJ]ZZT$/.test(basis)) test.push(R.reihe);
    if (art !== 'CS' && art !== 'ADRC') fremd.push(R.reihe + ':' + art);
  });
  pruefe(reihen.length > 5000 && treffer.length === 0, '12a ' + reihen.length + ' Reihen, keine mit Art ETF/ETN/ETV/FUND (' + treffer.length + ' Treffer' + (treffer.length ? ': ' + treffer.slice(0, 5).join(' ') : '') + ')');
  pruefe(test.length === 0, '12b kein Nasdaq-Testkuerzel (ZVZZT ...) in den Reihen (' + test.length + ')');
  pruefe(fremd.length === 0, '12c jede Reihe hat Art CS oder ADRC: ' + JSON.stringify(zaehl) + (fremd.length ? ' - fremd: ' + fremd.slice(0, 5).join(' ') : ''));
  var aus = reihen.ausgeschlossen || {};
  pruefe(aus.ETF > 600, '12d reihen.ausgeschlossen zaehlt ETF ' + aus.ETF + ' > 600 (ausgeschlossen je Art: ' + JSON.stringify(aus) + ')');
});

/* ====================================================================================== */
console.log('\n' + ERG.ok + ' OK, ' + ERG.fehlt + ' FEHLT, ' + ERG.ueber + ' UEBERSPRUNGEN');
process.exitCode = ERG.fehlt ? 1 : 0;
