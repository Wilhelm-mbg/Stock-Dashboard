'use strict';
/* MESSEN - ein Durchlauf je Datei ueber alle 39 Kandidaten, zwei Placebos und den Topf
 * (VORREGISTRIERUNG §11 und Nachtrag 1).
 *
 * Aufruf (aus der Repo-Wurzel oder von hier):
 *   node --max-old-space-size=4096 messen.js --aus <ordner> [--reihen A B C] [--teil k/n] [--max N]
 *                                             [--checkpoint N] [--wachhund SEK] [--neu]
 *
 *   --aus        Ausgabeordner (relativ zu diesem Ordner): pilot/ fuer Proben, voll/ fuer den Nachtlauf.
 *                Nie derselbe Ordner fuer beides - ein Probelauf darf nie wie ein Befund aussehen.
 *   --reihen     nur diese Reihen (Pilot). Setzt die Marke pilot=true im Fortschritt.
 *   --teil k/n   nur jede n-te Reihe ab k (0-basiert) - fuer mehrere Prozesse nebeneinander,
 *                jeder mit eigenem --aus; auswerten.js legt die Zellen zusammen.
 *   --max N      hoechstens N Dateien in diesem Lauf (Probe, Laufzeitmessung).
 *   --checkpoint alle N Dateien Zwischenstand schreiben (Standard 200).
 *   --wachhund   Sekunden je Datei, danach wird die Datei uebersprungen und protokolliert (Standard 900).
 *   --neu        vorhandenen Fortschritt im Ausgabeordner ignorieren (nie still - der Ordner wird genannt).
 *
 * WAS AUF DIE PLATTE KOMMT: nicht Signale (Dutzende GB), sondern Summen je Zelle
 * (konfig.js: Reihe x Richtung x Haltedauer x ET-Tag x Umsatzklasse x lebend) - n, Summe, Quadratsumme,
 * Summe der Einstiegsfenster-Huerde - als _zellen.bin (Float64-Felder), dazu _fortschritt.json (erledigte
 * Dateien, Zaehler, Signalzahl je Reihe und Detektor, Ausgelassenes) und _lauf.log. Ein Neustart laedt beides
 * und ueberspringt Erledigtes. Eine Datei ist entweder GANZ drin oder gar nicht: ihre Beitraege sammeln sich
 * erst in einem eigenen Zwischenspeicher und werden am Dateiende uebernommen; bricht der Wachhund ab, faellt
 * der Zwischenspeicher weg.
 *
 * DIE DETEKTOREN SIND DIE DER AUGUST-TABELLE, UNVERAENDERT. Zwei Dinge am AUFRUF sind Laufzeit
 * (Nachtrag 1, je mit Gleichheitsprobe in test.js): vwap-abstand bekommt ein Fenster ab einem
 * Tagesanfang mit >= 110 Kerzen davor statt bars[0..i] (sonst quadratisch: 52 ms je Aufruf, 78 Minuten
 * je Jahresdatei), und kanaltrend wird nur gerufen, wenn die EMA-Kreuzung, die es selbst verlangt,
 * vorliegt (Q.signalCross auf demselben 261er-Fenster).
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var L = require('./lesen.js');
var Liquide = require(path.join(K.REPO, 'liquide.js'));
var Q = require(path.join(K.REPO, 'quant.js'));
var TAB = require(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'));

/* ---------- Argumente ---------- */
function argumente(argv) {
  var a = { aus: null, reihen: null, teil: null, max: 0, checkpoint: 200, wachhund: 900, neu: false };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--reihen') { a.reihen = []; while (i + 1 < argv.length && argv[i + 1].slice(0, 2) !== '--') a.reihen.push(argv[++i]); }
    else if (x === '--teil') { var p = String(argv[++i]).split('/'); a.teil = { k: +p[0], n: +p[1] }; }
    else if (x === '--max') a.max = +argv[++i];
    else if (x === '--checkpoint') a.checkpoint = +argv[++i];
    else if (x === '--wachhund') a.wachhund = +argv[++i];
    else if (x === '--neu') a.neu = true;
  }
  return a;
}

/* ---------- Zufall fuer die Placebos: deterministisch je (Reihe, Tag, Detektor, Zeitrahmen) ---------- */
function fnv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- Zellenspeicher ---------- */
function Speicher(nTage) {
  var z = K.zellenZahl(nTage), tz = K.topfZahl(nTage);
  this.nTage = nTage;
  this.n = new Float64Array(z); this.s = new Float64Array(z); this.s2 = new Float64Array(z); this.h2 = new Float64Array(z);
  this.tn = new Float64Array(tz); this.ts = new Float64Array(tz); this.ts2 = new Float64Array(tz);
}
Speicher.prototype.felder = function () { return [this.n, this.s, this.s2, this.h2, this.tn, this.ts, this.ts2]; };
Speicher.prototype.uebernehme = function (delta) {
  var self = this;
  delta.zellen.forEach(function (v, idx) { self.n[idx] += v[0]; self.s[idx] += v[1]; self.s2[idx] += v[2]; self.h2[idx] += v[3]; });
  delta.topf.forEach(function (v, idx) { self.tn[idx] += v[0]; self.ts[idx] += v[1]; self.ts2[idx] += v[2]; });
};
Speicher.prototype.schreibe = function (pfad) {
  var teile = this.felder().map(function (a) { return Buffer.from(a.buffer, a.byteOffset, a.byteLength); });
  var tmp = pfad + '.tmp';
  fs.writeFileSync(tmp, Buffer.concat(teile));
  fs.renameSync(tmp, pfad);
};
Speicher.lade = function (pfad, nTage) {
  var sp = new Speicher(nTage), buf = fs.readFileSync(pfad), off = 0;
  sp.felder().forEach(function (a) {
    if (off + a.byteLength > buf.length) throw new Error('_zellen.bin zu kurz - passt nicht zur Konfiguration');
    a.set(new Float64Array(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + a.byteLength))); off += a.byteLength;
  });
  if (off !== buf.length) throw new Error('_zellen.bin zu lang - passt nicht zur Konfiguration');
  return sp;
};
function Delta() { this.zellen = new Map(); this.topf = new Map(); }
Delta.prototype.add = function (idx, r, h) { var v = this.zellen.get(idx); if (!v) { v = [0, 0, 0, 0]; this.zellen.set(idx, v); } v[0]++; v[1] += r; v[2] += r * r; v[3] += h; };
Delta.prototype.addTopf = function (idx, r) { var v = this.topf.get(idx); if (!v) { v = [0, 0, 0]; this.topf.set(idx, v); } v[0]++; v[1] += r; v[2] += r * r; };

/* ---------- Ertrag (§2/§3): Einstieg Eroeffnung i+1, Ausstieg Eroeffnung der Kerze nach Ablauf bzw. Schluss ---------- */
/** Ausstiegsindizes je Haltedauer fuer alle Kerzen eines Tages: exit[h][i - von] = j oder -1. */
function ausstiege(bars, von, bis) {
  var aus = [];
  K.HALTEDAUERN.forEach(function (H) {
    var e = new Int32Array(bis - von + 1);
    if (H.min == null) { for (var i = von; i <= bis; i++) e[i - von] = bis; aus.push(e); return; }
    var j = von;
    for (var i2 = von; i2 <= bis; i2++) {
      if (i2 + 1 > bis) { e[i2 - von] = -1; continue; }
      var ziel = bars[i2 + 1][0] + H.min * 60000;
      if (j <= i2 + 1) j = i2 + 2;
      while (j <= bis && bars[j][0] < ziel) j++;
      e[i2 - von] = j <= bis ? j : -1;
    }
    aus.push(e);
  });
  aus.von = von;
  return aus;
}
/** Rohertrag in Pp fuer Richtung dir; NaN, wenn es keine Beobachtung gibt. */
function ertrag(bars, i, h, bis, exit, dir) {
  if (i + 1 > bis) return NaN;
  var ein = bars[i + 1][5];
  if (!(ein > 0)) return NaN;
  var aus;
  if (K.HALTEDAUERN[h].min == null) aus = bars[bis][1];          // bis Schluss: Schlusskurs der letzten regulaeren Kerze
  else { var j = exit[h][i - exit.von]; if (j < 0) return NaN; aus = bars[j][5]; }
  if (!(aus > 0)) return NaN;
  return dir * (aus - ein) / ein * 100;
}

/* ---------- Detektoraufruf: Parameter je Zeitrahmen, Fensterung, Vorfilter ---------- */
/** Fensteranfang fuer gefensterte Detektoren: Tagesanfang, so dass >= FENSTER_MIN_KERZEN vor i liegen. */
function fensterAnfang(T, di, i) {
  var k = di, start = T[di].von;
  while (i - start < K.FENSTER_MIN_KERZEN && k > 0) { k--; start = T[k].von; }
  return start;
}
function rufe(D, params, bars, i, T, di) {
  if (K.GEFENSTERT[D.key]) {
    var von = fensterAnfang(T, di, i);
    return D.signal(bars.slice(von, i + 1), i - von, params);
  }
  if (D.key === 'kanaltrend') {
    /* Vorfilter: einstiegSignal(kanaltrend) verlangt tsig.crossed von signalCross auf dem 261er-Fenster
     * (quant.js). Ohne Kreuzung ist die Antwort sicher null - der teure Kanal entfaellt. */
    var w = bars.slice(Math.max(0, i - 260), i + 1);
    if (!Q.signalCross(w, 'ema', 20, 15).crossed) return null;
  }
  return D.signal(bars, i, params);
}

/* ---------- Der Lauf ---------- */
function protokoll(ordner, zeile) {
  var s = new Date().toISOString() + '  ' + zeile;
  console.log(s);
  try { fs.appendFileSync(path.join(ordner, '_lauf.log'), s + '\n'); } catch (e) { /* Log ist Komfort */ }
}
function leererZaehler() {
  return { tageOhneKlasse: 0, tageMassnahmen: 0, tageOhneKalender: 0, tageDuenn: 0, tageGewertet: 0, zeitrahmenNichtErkannt: {},
    aufrufe: {}, fehler: {}, signaleGesamt: {}, ohneHorizont: [0, 0, 0], ohneEinstieg: 0, placeboAGezogen: 0, placeboBGezogen: 0, placeboBOhnePartner: 0 };
}
function leererFortschritt(a) {
  var kal = K.kalender();
  return { kennung: K.KONFIG_KENNUNG, begonnen: new Date().toISOString(), pilot: !!a.reihen, reihenArg: a.reihen, teil: a.teil,
    nTage: kal.tage.length, bestaetigungAb: kal.bestaetigungAb, zellenStand: 0,
    erledigt: {}, ausgelassen: [], signale: {}, dateien: 0, bytes: 0, kerzenRegulaer: 0, ms: { lesen: 0, rechnen: 0 },
    reihenAusgeschlossen: null, zaehler: leererZaehler() };
}
function fortschrittSchreiben(ordner, F, sp) {
  F.zellenStand++;
  sp.schreibe(path.join(ordner, '_zellen.bin'));
  var tmp = path.join(ordner, '_fortschritt.json.tmp');
  F.stand = new Date().toISOString();
  fs.writeFileSync(tmp, JSON.stringify(F));
  fs.renameSync(tmp, path.join(ordner, '_fortschritt.json'));
}

/** Eine Reihe ueber ihre Jahre; ruft je Datei `dateiFertig()` und prueft `abbruch()`. */
function messeReihe(R, ctx) {
  var F = ctx.F;
  var jahre = R.jahre.filter(function (j) { return j >= +K.FENSTER.von.slice(0, 4) && j <= +K.FENSTER.bis.slice(0, 4); });
  var massnahmen = L.massnahmenFuer(R);
  var warm = null;              // { kerzen1m: letzte ~12 dichte Handelstage des Vorjahres, tagesUmsatz: [[t, schluss, stueck] ...] }
  var WARM_TAGE = 12;
  for (var ji = 0; ji < jahre.length; ji++) {
    var jahr = jahre[ji], key = R.reihe + '/' + jahr;
    if (ctx.abbruch()) return;
    if (F.erledigt[key]) { warm = null; continue; }
    if (ctx.a.max && F.dateien >= ctx.a.max) return;
    var t0 = Date.now();
    if (warm == null && ji > 0) {                                         // Warmlauf aus dem Vorjahr nachholen (eine Datei)
      var v = L.ladeJahr(R, jahre[ji - 1]);
      warm = v.ok ? warmlaufAus(v.kerzen, WARM_TAGE) : { kerzen1m: [], tagesUmsatz: [] };
    }
    if (warm == null) warm = { kerzen1m: [], tagesUmsatz: [] };
    var g = L.ladeJahr(R, jahr);
    var tLesen = Date.now() - t0;
    if (!g.ok) { F.ausgelassen.push({ datei: key, grund: g.grund, pfad: g.pfad }); protokoll(ctx.ordner, 'AUSGELASSEN ' + key + ': ' + g.grund); warm = null; continue; }
    var delta = new Delta(), frist = Date.now() + ctx.a.wachhund * 1000;
    var stat;
    try { stat = messeDatei(R, g, warm, massnahmen, delta, ctx, frist); }
    catch (e) {
      if (e && e.wachhund) { F.ausgelassen.push({ datei: key, grund: 'Wachhund ' + ctx.a.wachhund + ' s' }); protokoll(ctx.ordner, 'WACHHUND ' + key); }
      else { F.ausgelassen.push({ datei: key, grund: 'Fehler: ' + (e && e.message) }); protokoll(ctx.ordner, 'FEHLER ' + key + ': ' + (e && e.stack || e)); }
      warm = warmlaufAus(g.kerzen, WARM_TAGE, warm); continue;
    }
    ctx.sp.uebernehme(delta);
    F.erledigt[key] = 1; F.dateien++; F.bytes += g.bytes; F.kerzenRegulaer += g.kerzen.length;
    F.ms.lesen += tLesen; F.ms.rechnen += Date.now() - t0 - tLesen;
    var sig = F.signale[R.reihe] || (F.signale[R.reihe] = { lebend: R.lebend, gruppe: R.gruppe, art: R.art, ende: massnahmen.ende || null, tage: 0, tageGewertet: 0, det: {} });
    sig.tage += stat.tage; sig.tageGewertet += stat.tageGewertet;
    Object.keys(stat.signale).forEach(function (dk) { var z = sig.det[dk] || (sig.det[dk] = [0, 0, 0]); for (var q = 0; q < 3; q++) z[q] += stat.signale[dk][q]; });
    protokoll(ctx.ordner, key.padEnd(16) + g.quelle.padEnd(10) + String(g.kerzen.length).padStart(8) + ' reg. Kerzen  ' + String(stat.tageGewertet).padStart(4) + '/' + String(stat.tage).padEnd(4) + ' Tage gewertet  ' + String(stat.signaleGesamt).padStart(7) + ' Signale  ' + tLesen + ' ms lesen  ' + (Date.now() - t0 - tLesen) + ' ms rechnen');
    warm = warmlaufAus(g.kerzen, WARM_TAGE, warm);
    ctx.dateiFertig();
  }
}
/** Warmlauf fuer das Folgejahr: die letzten `tage` DICHTEN Handelstage als 1m-Kerzen (Rueckblick der
 *  Detektoren) plus die Tagesumsaetze ALLER Tage (die Klasse zaehlt Balkentage, dicht oder nicht). */
function warmlaufAus(kerzen1m, tage, vorher) {
  var T = L.tageAus(kerzen1m), ums = (vorher ? vorher.tagesUmsatz : []).slice();
  T.forEach(function (d) { var v = 0; for (var q = d.von; q <= d.bis; q++) v += kerzen1m[q][2] || 0; ums.push([kerzen1m[d.von][0], kerzen1m[d.bis][1], v]); });
  var dicht = T.filter(function (d) { return istDicht(d); }).slice(-tage), aus = [];
  dicht.forEach(function (d) { for (var q = d.von; q <= d.bis; q++) aus.push(kerzen1m[q]); });
  return { kerzen1m: aus, tagesUmsatz: ums.slice(-(K.UMSATZ_FENSTER + 5)) };
}
/** 80-%-Regel (Nachtrag 1, August ladeUniversum): ein Tag zaehlt nur mit >= 80 % der 1m-Sollkerzen. */
function istDicht(d) { return (d.bis - d.von + 1) >= K.DICHTE_MIN * d.sollMin; }

/** Eine Datei: alle Zeitrahmen, Detektoren, Placebos, Topf. Schreibt nur in `delta`. */
function messeDatei(R, g, warm, massnahmen, delta, ctx, frist) {
  var kal = ctx.kal, nTage = kal.tage.length, dets = ctx.dets, Z = ctx.F.zaehler;
  var kerzen = g.kerzen, lebend = R.lebend;
  var stat = { signale: {}, signaleGesamt: 0, tage: 0, tageGewertet: 0 };
  dets.forEach(function (D) { stat.signale[D.key] = [0, 0, 0]; });
  if (!kerzen.length) return stat;
  /* Umsatzklasse je Tag (§3): 20 Balkentage davor, Liquide.medianUmsatz, Klassengrenzen aus konfig. */
  var T1 = L.tageAus(kerzen);
  var ums = warm.tagesUmsatz.slice(), klasseJeTag = {}, dichtJeTag = {};
  T1.forEach(function (d) { var v = 0; for (var q = d.von; q <= d.bis; q++) v += kerzen[q][2] || 0; ums.push([kerzen[d.von][0], kerzen[d.bis][1], v]); });
  var basis = ums.length - T1.length;
  T1.forEach(function (d, q) {
    var idx = basis + q;                                               // Index des Tages in ums; Vortage = idx-20..idx-1
    klasseJeTag[d.tag] = (idx - K.UMSATZ_FENSTER < 0) ? -1 : K.klasseIndex(Liquide.medianUmsatz(ums, idx - 1, K.UMSATZ_FENSTER));
    dichtJeTag[d.tag] = istDicht(d);
  });
  stat.tage = T1.length;
  var sperrTage = L.ausschlussTage(R, massnahmen, g.quelle, g.angewandt);
  /* Nur dichte Tage gehen in die Detektion (80-%-Regel) - so liegt auch barMinVon auf dem Soll. */
  var dicht1m = [];
  T1.forEach(function (d) { if (dichtJeTag[d.tag]) for (var q = d.von; q <= d.bis; q++) dicht1m.push(kerzen[q]); else Z.tageDuenn++; });
  if (!dicht1m.length) return stat;
  var jahrStartMs = dicht1m[0][0];
  var alle1m = warm.kerzen1m.length ? warm.kerzen1m.concat(dicht1m) : dicht1m;

  for (var zi = 0; zi < K.ZEITRAHMEN.length; zi++) {
    var zr = K.ZEITRAHMEN[zi], barMs = zr.min * 60000;
    var bars = L.verdichte(alle1m, zr.key);
    if (bars.length < 60) continue;
    if (TAB.helfer.barMinVon(bars) !== zr.min) { Z.zeitrahmenNichtErkannt[zr.key] = (Z.zeitrahmenNichtErkannt[zr.key] || 0) + 1; continue; }
    var T = L.tageAus(bars);
    var params = dets.map(function (D) { return K.paramsFuer(D, zr.key); });
    var letztesSignal = {}; dets.forEach(function (D) { letztesSignal[D.key] = -1e15; });
    for (var di = 0; di < T.length; di++) {
      var d = T[di];
      if (bars[d.von][0] < jahrStartMs) continue;                        // Warmlauf: nur Rueckblick, keine Messung
      if (Date.now() > frist) { var e = new Error('Wachhund'); e.wachhund = true; throw e; }
      var tagIdx = kal.idx[d.tag];
      if (tagIdx === undefined) { if (zi === 0) Z.tageOhneKalender++; continue; }
      var klasse = klasseJeTag[d.tag]; if (klasse == null) klasse = -1;
      if (klasse < 0) { if (zi === 0) Z.tageOhneKlasse++; continue; }
      if (sperrTage.has(d.tag)) { if (zi === 0) Z.tageMassnahmen++; continue; }
      if (zi === 0) { Z.tageGewertet++; stat.tageGewertet++; }
      /* zulaessige Kerzen: Ende der Kerze + MIN_REST vor dem Sitzungsschluss, und eine Folgekerze existiert */
      var zul = [], fensterVon = {};
      for (var i = d.von; i < d.bis; i++) if (bars[i][0] + barMs + K.MIN_REST_MIN * 60000 <= d.schluss) { zul.push(i); var w = Math.floor((bars[i][0] - d.auf) / (K.PAAR_FENSTER_MIN * 60000)); (fensterVon[w] = fensterVon[w] || []).push(i); }
      if (!zul.length) continue;
      var exit = ausstiege(bars, d.von, d.bis);
      var hVon = function (i) { return K.huerdeFenster(klasse, (bars[i + 1][0] - d.auf) / 60000); };   // Huerde nach Einstiegsfenster
      /* Topf (§7b): jede zulaessige Kerze, Long-Ertrag je Haltedauer */
      for (var q = 0; q < zul.length; q++) for (var h = 0; h < K.N_H; h++) {
        var rt = ertrag(bars, zul[q], h, d.bis, exit, 1);
        if (rt === rt) delta.addTopf(K.topfZelle(nTage, zi, h, tagIdx, klasse, lebend), rt);
      }
      /* Kandidaten */
      for (var dI = 0; dI < dets.length; dI++) {
        var D = dets[dI], kand = K.kandIndex(dI, zi), k = 0, echte = [];
        Z.aufrufe[D.key] = Z.aufrufe[D.key] || 0;
        for (var q2 = 0; q2 < zul.length; q2++) {
          var i2 = zul[q2];
          if (bars[i2][0] - letztesSignal[D.key] < K.COOLDOWN_MIN * 60000) continue;
          var s = null; Z.aufrufe[D.key]++;
          try { s = rufe(D, params[dI], bars, i2, T, di); } catch (err) { Z.fehler[D.key] = (Z.fehler[D.key] || 0) + 1; continue; }
          if (!s || !s.dir) continue;
          letztesSignal[D.key] = bars[i2][0];
          k++; stat.signale[D.key][zi]++; stat.signaleGesamt++;
          var dir = s.dir > 0 ? 1 : -1, dirIdx = dir > 0 ? 0 : 1, beob = 0, hf = hVon(i2);
          echte.push([i2, dir]);
          for (var h2 = 0; h2 < K.N_H; h2++) {
            var r = ertrag(bars, i2, h2, d.bis, exit, dir);
            if (r !== r) { Z.ohneHorizont[h2]++; continue; }
            beob++;
            delta.add(K.zelle(nTage, K.reiheIndex(kand, 0), dirIdx, h2, tagIdx, klasse, lebend), r, hf);
          }
          if (!beob) Z.ohneEinstieg++;
        }
        Z.signaleGesamt[D.key] = (Z.signaleGesamt[D.key] || 0) + k;
        if (!k) continue;
        var rng = mulberry32(fnv(R.reihe + '|' + d.tag + '|' + D.key + '|' + zr.key));
        /* Placebo A (§7a): k zufaellige zulaessige Kerzen desselben Tages, zufaellige Richtung, ohne Kursblick */
        var topf = zul.slice(), m = Math.min(k, topf.length);
        for (var p = 0; p < m; p++) {
          var wI = p + Math.floor(rng() * (topf.length - p)); var tmp = topf[p]; topf[p] = topf[wI]; topf[wI] = tmp;
          var pi = topf[p], pdir = rng() < 0.5 ? 1 : -1, pdirIdx = pdir > 0 ? 0 : 1, phf = hVon(pi);
          Z.placeboAGezogen++;
          for (var h3 = 0; h3 < K.N_H; h3++) {
            var pr = ertrag(bars, pi, h3, d.bis, exit, pdir);
            if (pr === pr) delta.add(K.zelle(nTage, K.reiheIndex(kand, 1), pdirIdx, h3, tagIdx, klasse, lebend), pr, phf);
          }
        }
        /* Placebo B (Nachtrag 1, gepaart): je echtem Signal eine andere zulaessige Kerze aus demselben
         * 30-Minuten-Fenster, gleiche Richtung - dieselbe Tageszeit, ohne Kursblick. */
        for (var e2 = 0; e2 < echte.length; e2++) {
          var si = echte[e2][0], sdir = echte[e2][1], sw = Math.floor((bars[si][0] - d.auf) / (K.PAAR_FENSTER_MIN * 60000));
          var kand2 = (fensterVon[sw] || []).filter(function (x) { return x !== si; });
          if (!kand2.length) { Z.placeboBOhnePartner++; continue; }
          var bi = kand2[Math.floor(rng() * kand2.length)], bdirIdx = sdir > 0 ? 0 : 1, bhf = hVon(bi);
          Z.placeboBGezogen++;
          for (var h4 = 0; h4 < K.N_H; h4++) {
            var br = ertrag(bars, bi, h4, d.bis, exit, sdir);
            if (br === br) delta.add(K.zelle(nTage, K.reiheIndex(kand, 2), bdirIdx, h4, tagIdx, klasse, lebend), br, bhf);
          }
        }
      }
    }
  }
  return stat;
}

function lauf(a) {
  if (!a.aus) { console.error('Pflichtargument --aus <ordner> fehlt (pilot/ oder voll/).'); process.exit(2); }
  var ordner = path.resolve(K.HIER, a.aus);
  fs.mkdirSync(ordner, { recursive: true });
  var kal = K.kalender();
  if (kal.bestaetigungAb !== K.BESTAETIGUNG_AB) { console.error('Kalender-Split ' + kal.bestaetigungAb + ' != registriert ' + K.BESTAETIGUNG_AB + ' - Abbruch, nichts gerechnet.'); process.exit(3); }
  var fp = path.join(ordner, '_fortschritt.json'), zp = path.join(ordner, '_zellen.bin');
  var F, sp;
  if (!a.neu && fs.existsSync(fp) && fs.existsSync(zp)) {
    F = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (F.kennung !== K.KONFIG_KENNUNG || F.nTage !== kal.tage.length) { console.error('Fortschritt in ' + ordner + ' gehoert zu einer anderen Konfiguration (' + F.kennung + ') - Abbruch.'); process.exit(4); }
    sp = Speicher.lade(zp, kal.tage.length);
    protokoll(ordner, 'FORTSETZUNG: ' + Object.keys(F.erledigt).length + ' Dateien erledigt, Zellenstand ' + F.zellenStand);
  } else {
    if (a.neu && fs.existsSync(fp)) protokoll(ordner, 'NEU: vorhandener Fortschritt in ' + ordner + ' wird ueberschrieben');
    F = leererFortschritt(a); sp = new Speicher(kal.tage.length);
  }
  var alle = L.reihen();
  F.reihenAusgeschlossen = alle.ausgeschlossen || null;
  var reihen = alle;
  if (a.reihen) { var soll = new Set(a.reihen); reihen = alle.filter(function (R) { return soll.has(R.reihe); }); var fehlen = a.reihen.filter(function (r) { return !alle.some(function (R) { return R.reihe === r; }); }); if (fehlen.length) protokoll(ordner, 'WARNUNG: verlangte Reihen ohne Balken/keine Aktie: ' + fehlen.join(' ')); }
  if (a.teil) reihen = reihen.filter(function (R, i) { return i % a.teil.n === a.teil.k; });
  var dets = K.detektoren();
  protokoll(ordner, 'START ' + K.KONFIG_KENNUNG + ' | ' + reihen.length + ' Reihen (' + alle.length + ' Aktien, ausgeschlossen ' + JSON.stringify(alle.ausgeschlossen) + ') | ' + dets.length + ' Detektoren | Tage ' + kal.tage.length + ' | Bestaetigung ab ' + kal.bestaetigungAb + (a.reihen ? ' | PILOT' : '') + (a.teil ? ' | Teil ' + a.teil.k + '/' + a.teil.n : ''));
  var stop = false;
  process.on('SIGINT', function () { stop = true; protokoll(ordner, 'SIGINT - nach dieser Datei wird gesichert und beendet'); });
  var seitCheckpoint = 0, tStart = Date.now();
  var ctx = { a: a, kal: kal, dets: dets, F: F, sp: sp, ordner: ordner,
    abbruch: function () { return stop || (a.max && F.dateien >= a.max); },
    dateiFertig: function () { if (++seitCheckpoint >= a.checkpoint) { fortschrittSchreiben(ordner, F, sp); seitCheckpoint = 0; protokoll(ordner, 'CHECKPOINT ' + F.dateien + ' Dateien, ' + Math.round((Date.now() - tStart) / 60000) + ' min'); } } };
  for (var ri = 0; ri < reihen.length && !ctx.abbruch(); ri++) messeReihe(reihen[ri], ctx);
  F.beendet = ctx.abbruch() ? (stop ? 'SIGINT' : 'max erreicht') : 'vollstaendig';
  fortschrittSchreiben(ordner, F, sp);
  protokoll(ordner, 'ENDE ' + F.beendet + ' | ' + F.dateien + ' Dateien | ' + (F.bytes / 1e9).toFixed(2) + ' GB | ' + F.kerzenRegulaer.toLocaleString('de-DE') + ' reg. Kerzen | lesen ' + Math.round(F.ms.lesen / 1000) + ' s, rechnen ' + Math.round(F.ms.rechnen / 1000) + ' s | ausgelassen ' + F.ausgelassen.length);
  return F;
}

module.exports = { lauf: lauf, argumente: argumente, messeDatei: messeDatei, ausstiege: ausstiege, ertrag: ertrag, rufe: rufe, fensterAnfang: fensterAnfang, istDicht: istDicht,
  Speicher: Speicher, Delta: Delta, fnv: fnv, mulberry32: mulberry32, warmlaufAus: warmlaufAus, leererZaehler: leererZaehler };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
