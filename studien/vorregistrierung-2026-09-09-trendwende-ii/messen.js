'use strict';
/* MESSEN - Trendwende II: ein Durchlauf je Datei ueber alle 24 Kandidaten (8 Detektoren x 3 Zeitrahmen, Nachtrag 3), zwei
 * Placebos und den Topf, fuenf Haltedauern (VORREGISTRIERUNG §1-§4, §10).
 *
 * HERKUNFT: Kopie von studien/vorregistrierung-2026-09-06-signale-minuten/messen.js (v4, 07.09.2026, abgenommen mit
 * 81 Pruefungen). Geaendert gegenueber dort - und NUR das:
 *   - konfig.js dieser Studie (eigene Detektortabelle, fuenf Haltedauern, Kennung); lesen.js kommt per require aus
 *     der Minutenstudie, unveraendert.
 *   - Haltedauer 'naechste' (Uebernacht): Ausstieg = Eroeffnung der ersten regulaeren 1m-Kerze des naechsten
 *     Kalender-Handelstags der Reihe. Am letzten Tag einer Jahresdatei bleiben die Beitraege OFFEN und werden mit dem
 *     Warmlauf in die Folgedatei uebergeben (dort verbucht: "ganz oder gar nicht" je Datei). Nach einer Fortsetzung
 *     aus dem Checkpoint fehlt die Uebergabe fuer eine Datei je Reihe (gezaehlt fortsetzungOhneUebernacht).
 *   - kein gefensterter Detektor (vwap-abstand ist nicht dabei). Der signalCross-Vorfilter in rufe() bleibt als Code
 *     stehen, wird aber seit NACHTRAG 3 (12.09.2026) von keinem Detektor mehr verlangt (der Trendfolge-Detektor ist
 *     gestrichen); er greift nur ueber die Eigenschaft `vorfilter` eines Tabelleneintrags.
 *   - NACHTRAG 3: viertes Kurszellen-Feld `kl` = Σ Einstiegsluecke in Pp (dir · (Eroeffnung i+1 − Schluss i) / Schluss i
 *     · 100); Kennung v2, alte _zellen.bin passen nicht mehr (Kennungs- und Laengenpruefung schlagen an).
 *
 * Aufruf (aus der Repo-Wurzel oder von hier):
 *   node --max-old-space-size=4096 messen.js --aus <ordner> [--reihen A B C] [--teil k/n] [--max N]
 *                                             [--checkpoint N] [--wachhund SEK] [--neu] [--zeitrahmen 1m 5m 15m]
 * Argumente wie dort. Zellen: n, Summe, Quadratsumme, Summe Einstiegsfenster-Huerde je (Reihe, Richtung, Haltedauer,
 * ET-Tag, Klasse, lebend) als _zellen.bin (Float64), _fortschritt.json, _lauf.log; Checkpoints, Wachhund, Fortsetzung.
 *
 * NUR LESEN auf dem Archiv. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var L = require(path.join(K.MINUTEN, 'lesen.js'));
var Liquide = require(path.join(K.REPO, 'liquide.js'));
var Q = require(path.join(K.REPO, 'quant.js'));
var TAB = require(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'));
var OFFEN = 'offen';

/* ---------- Argumente ---------- */
function argumente(argv) {
  var a = { aus: null, reihen: null, teil: null, max: 0, checkpoint: 200, wachhund: 900, neu: false, zeitrahmen: null };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--zeitrahmen') { a.zeitrahmen = []; while (i + 1 < argv.length && argv[i + 1].slice(0, 2) !== '--') String(argv[++i]).split(',').forEach(function (z) { if (z) a.zeitrahmen.push(z); }); }
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

/* ---------- Zellenspeicher (wie dort) ---------- */
function Speicher(nTage) {
  var z = K.zellenZahl(nTage), tz = K.topfZahl(nTage), kz = K.kursZahl(nTage);
  this.nTage = nTage;
  this.n = new Float64Array(z); this.s = new Float64Array(z); this.s2 = new Float64Array(z); this.h2 = new Float64Array(z);
  this.tn = new Float64Array(tz); this.ts = new Float64Array(tz); this.ts2 = new Float64Array(tz);
  this.kn = new Float64Array(kz); this.ks = new Float64Array(kz); this.kcb = new Float64Array(kz); this.kl = new Float64Array(kz);
}
Speicher.prototype.felder = function () { return [this.n, this.s, this.s2, this.h2, this.tn, this.ts, this.ts2, this.kn, this.ks, this.kcb, this.kl]; };
Speicher.prototype.uebernehme = function (delta) {
  var self = this;
  delta.zellen.forEach(function (v, idx) { self.n[idx] += v[0]; self.s[idx] += v[1]; self.s2[idx] += v[2]; self.h2[idx] += v[3]; });
  delta.topf.forEach(function (v, idx) { self.tn[idx] += v[0]; self.ts[idx] += v[1]; self.ts2[idx] += v[2]; });
  delta.kurs.forEach(function (v, idx) { self.kn[idx] += v[0]; self.ks[idx] += v[1]; self.kcb[idx] += v[2]; self.kl[idx] += v[3]; });
};
Speicher.prototype.schreibe = function (pfad, stand) {
  var teile = this.felder().map(function (a) { return Buffer.from(a.buffer, a.byteOffset, a.byteLength); });
  teile.push(Buffer.from(new Float64Array([stand || 0]).buffer));
  var tmp = pfad + '.tmp';
  fs.writeFileSync(tmp, Buffer.concat(teile));
  fs.renameSync(tmp, pfad);
};
Speicher.lade = function (pfad, nTage, stand) {
  var sp = new Speicher(nTage), buf = fs.readFileSync(pfad), off = 0;
  sp.felder().forEach(function (a) {
    if (off + a.byteLength > buf.length) throw new Error('_zellen.bin zu kurz - passt nicht zur Konfiguration');
    a.set(new Float64Array(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + a.byteLength))); off += a.byteLength;
  });
  if (buf.length - off !== 8) throw new Error('_zellen.bin ohne Stand-Schwanz - passt nicht zur Konfiguration');
  var gelesen = new Float64Array(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + 8))[0];
  if (stand != null && gelesen !== stand) throw new Error('_zellen.bin (Stand ' + gelesen + ') passt nicht zu _fortschritt.json (Stand ' + stand + ') - Checkpoint unvollstaendig, nicht fortsetzen');
  sp.stand = gelesen;
  return sp;
};
function Delta() { this.zellen = new Map(); this.topf = new Map(); this.kurs = new Map(); }
Delta.prototype.add = function (idx, r, h) { var v = this.zellen.get(idx); if (!v) { v = [0, 0, 0, 0]; this.zellen.set(idx, v); } v[0]++; v[1] += r; v[2] += r * r; v[3] += h; };
Delta.prototype.addTopf = function (idx, r) { var v = this.topf.get(idx); if (!v) { v = [0, 0, 0]; this.topf.set(idx, v); } v[0]++; v[1] += r; v[2] += r * r; };
/** Kurszelle: n, Σ Einstiegskurs (roh), Zahl ueber dem Cent-Boden, Σ Einstiegsluecke in Pp (Nachtrag 3). */
Delta.prototype.addKurs = function (idx, kurs, ueber, luecke) { var v = this.kurs.get(idx); if (!v) { v = [0, 0, 0, 0]; this.kurs.set(idx, v); } v[0]++; v[1] += kurs; if (ueber) v[2]++; if (luecke === luecke && luecke != null) v[3] += luecke; };

/* ---------- Ertrag (§3): Einstieg Eroeffnung i+1, Ausstieg Eroeffnung der Kerze nach Ablauf / Schluss / naechste Eroeffnung ---------- */
/** Ausstiegsindizes je Haltedauer fuer alle Kerzen eines Tages: exit[h][i - von] = j oder -1 (Uebernacht: -1, eigener Weg). */
function ausstiege(bars, von, bis) {
  var aus = [];
  K.HALTEDAUERN.forEach(function (H) {
    var e = new Int32Array(bis - von + 1);
    if (H.uebernacht) { e.fill(-1); aus.push(e); return; }
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
/** Rohertrag in Pp fuer Richtung dir; NaN ohne Beobachtung. Uebernacht: `naechste` = Eroeffnung des Folgetags
 *  (undefined => OFFEN, letzter Tag der Datei; NaN => kein Folgetag in der Reihe). */
function ertrag(bars, i, h, bis, exit, dir, naechste) {
  if (i + 1 > bis) return NaN;
  var ein = bars[i + 1][5];
  if (!(ein > 0)) return NaN;
  var H = K.HALTEDAUERN[h], aus;
  if (H.uebernacht) { if (naechste === undefined) return OFFEN; aus = naechste; }
  else if (H.min == null) aus = bars[bis][1];
  else { var j = exit[h][i - exit.von]; if (j < 0) return NaN; aus = bars[j][5]; }
  if (!(aus > 0)) return NaN;
  return dir * (aus - ein) / ein * 100;
}

/* ---------- Detektoraufruf: Parameter je Zeitrahmen, Vorfilter ---------- */
function rufe(D, params, bars, i) {
  if (D.vorfilter === 'signalCross') {
    /* Vorfilter (Minutenstudie Nachtrag 1.11b): einstiegSignal(kanaltrend) verlangt tsig.crossed von signalCross auf
     * dem 261er-Fenster - ohne Kreuzung ist die Antwort sicher null, der teure Kanal entfaellt. Gleichheitsprobe test.js. */
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
  return { tageOhneKlasse: {}, tageMassnahmen: {}, tageOhneKalender: {}, tageDuenn: {}, tageGewertet: {}, tageGewertetKlasse: {}, msJeZr: {}, zeitrahmenNichtErkannt: {},
    aufrufe: {}, fehler: {}, signaleGesamt: {}, ohneHorizont: [0, 0, 0, 0, 0], ohneEinstieg: 0, placeboAGezogen: 0, placeboBGezogen: 0, placeboBOhnePartner: 0,
    uebernachtOffen: 0, uebernachtVerbucht: 0, uebernachtVerfallen: 0, ohneNaechsterTag: 0, fortsetzungOhneUebernacht: 0, lueckeOhneSchluss: 0,
    lesenVerworfen: { unsortiert: 0, ausserFenster: 0, lebenszeit: 0, nichtRegulaer: 0, ohneKurs: 0 } };
}
function zaehlerAddieren(a, b) {
  Object.keys(b).forEach(function (k) {
    var v = b[k];
    if (typeof v === 'number') a[k] = (a[k] || 0) + v;
    else if (Array.isArray(v)) { a[k] = a[k] || []; for (var i = 0; i < v.length; i++) a[k][i] = (a[k][i] || 0) + v[i]; }
    else if (v && typeof v === 'object') { a[k] = a[k] || {}; zaehlerAddieren(a[k], v); }
  });
  return a;
}
function leererFortschritt(a) {
  var kal = K.kalender();
  return { kennung: K.KONFIG_KENNUNG, begonnen: new Date().toISOString(), pilot: !!a.reihen, reihenArg: a.reihen, teil: a.teil, zeitrahmen: a.zeitrahmen || K.ZEITRAHMEN.map(function (z) { return z.key; }),
    nTage: kal.tage.length, bestaetigungAb: kal.bestaetigungAb, zellenStand: 0,
    erledigt: {}, ausgelassen: [], signale: {}, dateien: 0, bytes: 0, kerzenRegulaer: 0, ms: { lesen: 0, rechnen: 0 },
    reihenAusgeschlossen: null, zaehler: leererZaehler() };
}
function fortschrittSchreiben(ordner, F, sp) {
  F.zellenStand++;
  sp.schreibe(path.join(ordner, '_zellen.bin'), F.zellenStand);
  var tmp = path.join(ordner, '_fortschritt.json.tmp');
  F.stand = new Date().toISOString();
  fs.writeFileSync(tmp, JSON.stringify(F));
  fs.renameSync(tmp, path.join(ordner, '_fortschritt.json'));
}
/** Offene Uebernacht-Beitraege eines Warmlaufs verfallen lassen (gezaehlt, nie geschaetzt). */
function verfalle(F, warm) { if (warm && warm.offen && warm.offen.length) { F.zaehler.uebernachtVerfallen += warm.offen.length; warm.offen = []; } }

/** Eine Reihe ueber ihre Jahre; ruft je Datei `dateiFertig()` und prueft `abbruch()`. */
function messeReihe(R, ctx) {
  var F = ctx.F;
  var jahre = R.jahre.filter(function (j) { return j >= +K.FENSTER.von.slice(0, 4) && j <= +K.FENSTER.bis.slice(0, 4); });
  var massnahmen = L.massnahmenFuer(R);
  var warm = null;
  var WARM_TAGE = 16;
  for (var ji = 0; ji < jahre.length; ji++) {
    var jahr = jahre[ji], key = R.reihe + '/' + jahr;
    if (ctx.abbruch()) { verfalle(F, warm); return; }
    if (F.erledigt[key]) { verfalle(F, warm); warm = null; continue; }
    if (ctx.a.max && F.dateien >= ctx.a.max) { verfalle(F, warm); return; }
    var t0 = Date.now();
    if (warm == null && ji > 0) {
      var vv = ji > 1 ? L.ladeJahr(R, jahre[ji - 2]) : null, v = L.ladeJahr(R, jahre[ji - 1]);
      var w0 = (vv && vv.ok) ? warmlaufAus(vv.kerzen, WARM_TAGE) : null;
      warm = v.ok ? warmlaufAus(v.kerzen, WARM_TAGE, w0) : (w0 ? { kerzen1m: [], tagesUmsatz: w0.tagesUmsatz } : { kerzen1m: [], tagesUmsatz: [] });
      warm.nachFortsetzung = true;                                      // offene Uebernacht-Beitraege der Vordatei sind nicht mehr da
    }
    if (warm == null) warm = { kerzen1m: [], tagesUmsatz: [] };
    var g = L.ladeJahr(R, jahr);
    var tLesen = Date.now() - t0;
    if (!g.ok) { F.ausgelassen.push({ datei: key, grund: g.grund, pfad: g.pfad }); protokoll(ctx.ordner, 'AUSGELASSEN ' + key + ': ' + g.grund); verfalle(F, warm); warm = null; continue; }
    var delta = new Delta(), frist = Date.now() + ctx.a.wachhund * 1000;
    var stat;
    try { stat = messeDatei(R, g, warm, massnahmen, delta, ctx, frist); }
    catch (e) {
      if (e && e.wachhund) { F.ausgelassen.push({ datei: key, grund: 'Wachhund ' + ctx.a.wachhund + ' s' }); protokoll(ctx.ordner, 'WACHHUND ' + key); }
      else { F.ausgelassen.push({ datei: key, grund: 'Fehler: ' + (e && e.message) }); protokoll(ctx.ordner, 'FEHLER ' + key + ': ' + (e && e.stack || e)); }
      verfalle(F, warm);                                                 // die in dieser Datei verbuchten Beitraege der Vordatei sind mit dem Delta weg
      warm = warmlaufAus(g.kerzen, WARM_TAGE, warm); continue;
    }
    ctx.sp.uebernehme(delta);
    zaehlerAddieren(F.zaehler, stat.zaehler); zaehlerAddieren(F.zaehler.lesenVerworfen, g.verworfen || {});
    Object.keys(stat.zaehler.fehler || {}).forEach(function (dk) {
      if (stat.zaehler.fehler[dk] > 0.01 * (stat.zaehler.aufrufe[dk] || 0)) throw new Error('Detektor ' + dk + ' wirft auf ' + stat.zaehler.fehler[dk] + ' von ' + stat.zaehler.aufrufe[dk] + ' Aufrufen in ' + key + ' - systematischer Fehler, Lauf abgebrochen');
    });
    F.erledigt[key] = 1; F.dateien++; F.bytes += g.bytes; F.kerzenRegulaer += g.kerzen.length;
    F.ms.lesen += tLesen; F.ms.rechnen += Date.now() - t0 - tLesen;
    var sig = F.signale[R.reihe] || (F.signale[R.reihe] = { lebend: R.lebend, gruppe: R.gruppe, art: R.art, ende: massnahmen.ende || null, tage: 0, tageGewertet: {}, tageGewertetKlasse: {}, det: {} });
    sig.tage += stat.tage;
    Object.keys(stat.tageGewertet).forEach(function (zk) { sig.tageGewertet[zk] = (sig.tageGewertet[zk] || 0) + stat.tageGewertet[zk]; });
    Object.keys(stat.tageGewertetKlasse).forEach(function (zk) { sig.tageGewertetKlasse[zk] = (sig.tageGewertetKlasse[zk] || 0) + stat.tageGewertetKlasse[zk]; });
    Object.keys(stat.signale).forEach(function (dk) { var z = sig.det[dk] || (sig.det[dk] = [0, 0, 0]); for (var q = 0; q < 3; q++) z[q] += stat.signale[dk][q]; });
    var gew = K.ZEITRAHMEN.map(function (zr) { return stat.tageGewertet[zr.key] || 0; }).join('/');
    protokoll(ctx.ordner, key.padEnd(16) + g.quelle.padEnd(10) + String(g.kerzen.length).padStart(8) + ' reg. Kerzen  ' + gew.padStart(11) + ' von ' + String(stat.tage).padEnd(4) + ' Tagen gewertet (1m/5m/15m)  ' + String(stat.signaleGesamt).padStart(7) + ' Signale  ' + tLesen + ' ms lesen  ' + (Date.now() - t0 - tLesen) + ' ms rechnen');
    warm = warmlaufAus(g.kerzen, WARM_TAGE, warm);
    warm.offen = stat.offen; warm.letzterTag = stat.letzterTag;        // Uebernacht-Uebergabe in die Folgedatei
    ctx.dateiFertig();
  }
  verfalle(F, warm);                                                     // letzte Datei der Reihe: kein Folgetag mehr
}
function warmlaufAus(kerzen1m, tage, vorher) {
  var T = L.tageAus(kerzen1m), ums = (vorher ? vorher.tagesUmsatz : []).slice();
  T.forEach(function (d) { var v = 0; for (var q = d.von; q <= d.bis; q++) v += kerzen1m[q][2] || 0; ums.push([kerzen1m[d.von][0], kerzen1m[d.bis][1], v]); });
  var von = T.length > tage ? T[T.length - tage].von : 0;
  return { kerzen1m: kerzen1m.slice(von), tagesUmsatz: ums.slice(-(K.UMSATZ_FENSTER + 5)), offen: [], letzterTag: null };
}
function istDicht(d, zrMin) { return (d.bis - d.von + 1) >= K.DICHTE_MIN * (d.sollMin / (zrMin || 1)); }

/** Eine Datei: alle Zeitrahmen, Detektoren, Placebos, Topf. Schreibt nur in `delta`; offene Uebernacht-Beitraege in stat.offen. */
function messeDatei(R, g, warm, massnahmen, delta, ctx, frist) {
  var kal = ctx.kal, nTage = kal.tage.length, dets = ctx.dets, Z = leererZaehler();
  var kerzen = g.kerzen, lebend = R.lebend;
  var rohFaktor = g.rohFaktor || function () { return 1; };
  var stat = { signale: {}, signaleGesamt: 0, tage: 0, tageGewertet: {}, tageGewertetKlasse: {}, zaehler: Z, offen: [], letzterTag: null };
  dets.forEach(function (D) { stat.signale[D.key] = [0, 0, 0]; });
  if (!kerzen.length) return stat;
  var T1 = L.tageAus(kerzen);
  var ums = warm.tagesUmsatz.slice(), klasseJeTag = {};
  T1.forEach(function (d) { var v = 0; for (var q = d.von; q <= d.bis; q++) v += kerzen[q][2] || 0; ums.push([kerzen[d.von][0], kerzen[d.bis][1], v]); });
  var basis = ums.length - T1.length;
  T1.forEach(function (d, q) {
    var idx = basis + q;
    klasseJeTag[d.tag] = (idx - K.UMSATZ_FENSTER < 0) ? -1 : K.klasseIndex(Liquide.medianUmsatz(ums, idx - 1, K.UMSATZ_FENSTER));
  });
  stat.tage = T1.length;
  /* Uebernacht (§3): Eroeffnung der ersten regulaeren 1m-Kerze des NAECHSTEN KALENDER-Handelstags je Tag der Datei;
   * Luecke in der Reihe => NaN (keine Beobachtung); letzter Tag der Datei => undefined (offen, Folgedatei). */
  var naechste = {};
  T1.forEach(function (d, q) {
    var n1 = T1[q + 1]; if (!n1) return;
    var a = kal.idx[d.tag], b = kal.idx[n1.tag];
    naechste[d.tag] = (a !== undefined && b !== undefined && b === a + 1) ? kerzen[n1.von][5] : NaN;
  });
  stat.letzterTag = T1[T1.length - 1].tag;
  /* Offene Beitraege der Vordatei verbuchen (nur wenn deren letzter Tag der Kalender-Vortag des ersten Tages hier ist). */
  if (warm.nachFortsetzung) Z.fortsetzungOhneUebernacht++;
  if (warm.offen && warm.offen.length) {
    var e0 = T1[0], a0 = kal.idx[warm.letzterTag], b0 = kal.idx[e0.tag];
    var o = (a0 !== undefined && b0 !== undefined && b0 === a0 + 1) ? kerzen[e0.von][5] : NaN;
    warm.offen.forEach(function (e) {
      if (o > 0) { var r = e.dir * (o - e.ein) / e.ein * 100; if (e.topf) delta.addTopf(e.idx, r); else delta.add(e.idx, r, e.hf); Z.uebernachtVerbucht++; }
      else Z.uebernachtVerfallen++;
    });
  }
  var sperrTage = L.ausschlussTage(R, massnahmen, g.quelle, g.angewandt);
  var jahrStartMs = kerzen[0][0];
  var alle1m = warm.kerzen1m.length ? warm.kerzen1m.concat(kerzen) : kerzen;

  for (var zi = 0; zi < K.ZEITRAHMEN.length; zi++) {
    var zr = K.ZEITRAHMEN[zi], barMs = zr.min * 60000;
    if (ctx.zeitrahmen && ctx.zeitrahmen.indexOf(zr.key) === -1) continue;
    var tZr = Date.now();
    var roh = L.verdichte(alle1m, zr.key), Troh = L.tageAus(roh), bars = [];
    Troh.forEach(function (d) {
      var dicht = (d.bis - d.von + 1) >= K.DICHTE_MIN * (d.sollMin / zr.min);
      if (dicht) for (var q = d.von; q <= d.bis; q++) bars.push(roh[q]);
      else if (roh[d.von][0] >= jahrStartMs) Z.tageDuenn[zr.key] = (Z.tageDuenn[zr.key] || 0) + 1;
    });
    if (bars.length < 60) continue;
    if (TAB.helfer.barMinVon(bars) !== zr.min) { Z.zeitrahmenNichtErkannt[zr.key] = (Z.zeitrahmenNichtErkannt[zr.key] || 0) + 1; continue; }
    var T = L.tageAus(bars);
    var params = dets.map(function (D) { return K.paramsFuer(D, zr.key); });
    var letztesSignal = {}; dets.forEach(function (D) { letztesSignal[D.key] = -1e15; });
    for (var di = 0; di < T.length; di++) {
      var d = T[di];
      if (bars[d.von][0] < jahrStartMs) continue;
      if (Date.now() > frist) { var e = new Error('Wachhund'); e.wachhund = true; throw e; }
      var tagIdx = kal.idx[d.tag];
      if (tagIdx === undefined) { Z.tageOhneKalender[zr.key] = (Z.tageOhneKalender[zr.key] || 0) + 1; continue; }
      var klasse = klasseJeTag[d.tag]; if (klasse == null) klasse = -1;
      if (klasse < 0) { Z.tageOhneKlasse[zr.key] = (Z.tageOhneKlasse[zr.key] || 0) + 1; continue; }
      if (sperrTage.has(d.tag)) { Z.tageMassnahmen[zr.key] = (Z.tageMassnahmen[zr.key] || 0) + 1; continue; }
      Z.tageGewertet[zr.key] = (Z.tageGewertet[zr.key] || 0) + 1; stat.tageGewertet[zr.key] = (stat.tageGewertet[zr.key] || 0) + 1;
      var zk = zr.key + '|' + K.KLASSEN[klasse].name;
      Z.tageGewertetKlasse[zk] = (Z.tageGewertetKlasse[zk] || 0) + 1; stat.tageGewertetKlasse[zk] = (stat.tageGewertetKlasse[zk] || 0) + 1;
      var zul = [], fensterVon = {};
      for (var i = d.von; i < d.bis; i++) if (bars[i][0] + barMs + K.MIN_REST_MIN * 60000 <= d.schluss) { zul.push(i); var w = Math.floor((bars[i][0] - d.auf) / (K.PAAR_FENSTER_MIN * 60000)); (fensterVon[w] = fensterVon[w] || []).push(i); }
      if (!zul.length) continue;
      var exit = ausstiege(bars, d.von, d.bis), nOffen = naechste[d.tag];
      var hVon = function (i) { return K.huerdeFenster(klasse, (bars[i + 1][0] - d.auf) / 60000, d.sollMin); };
      /** Alle Haltedauern einer Kerze verbuchen: Zelle (idxFn) oder Topf; Rueckgabe Zahl der Beobachtungen (offen zaehlt mit). */
      var verbuche = function (i, dir, hf, topf, idxFn) {
        var beob = 0;
        for (var h = 0; h < K.N_H; h++) {
          var r = ertrag(bars, i, h, d.bis, exit, dir, nOffen);
          if (r === OFFEN) { stat.offen.push({ topf: topf, idx: idxFn(h), ein: bars[i + 1][5], dir: dir, hf: hf }); Z.uebernachtOffen++; beob++; continue; }
          if (r !== r) { if (K.HALTEDAUERN[h].uebernacht && nOffen !== nOffen && i + 1 <= d.bis) Z.ohneNaechsterTag++; if (!topf) Z.ohneHorizont[h]++; continue; }
          beob++;
          if (topf) delta.addTopf(idxFn(h), r); else delta.add(idxFn(h), r, hf);
        }
        return beob;
      };
      /* Topf (§7b dort): jede zulaessige Kerze, Long-Ertrag je Haltedauer */
      for (var q = 0; q < zul.length; q++) verbuche(zul[q], 1, 0, true, function (h) { return K.topfZelle(nTage, zi, h, tagIdx, klasse, lebend); });
      /* Kandidaten */
      for (var dI = 0; dI < dets.length; dI++) {
        var D = dets[dI], kand = K.kandIndex(dI, zi), k = 0, echte = [];
        Z.aufrufe[D.key] = Z.aufrufe[D.key] || 0;
        for (var q2 = 0; q2 < zul.length; q2++) {
          var i2 = zul[q2];
          if (bars[i2][0] - letztesSignal[D.key] < K.COOLDOWN_MIN * 60000) continue;
          var s = null; Z.aufrufe[D.key]++;
          try { s = rufe(D, params[dI], bars, i2); } catch (err) { Z.fehler[D.key] = (Z.fehler[D.key] || 0) + 1; continue; }
          if (!s || !s.dir) continue;
          letztesSignal[D.key] = bars[i2][0];
          k++; stat.signale[D.key][zi]++; stat.signaleGesamt++;
          var dir = s.dir > 0 ? 1 : -1, dirIdx = dir > 0 ? 0 : 1, hf = hVon(i2);
          echte.push([i2, dir]);
          if (i2 + 1 <= d.bis && bars[i2 + 1][5] > 0) {
            var ek = bars[i2 + 1][5] * rohFaktor(bars[i2 + 1][0]);
            /* Einstiegsluecke (Nachtrag 3): dir · (Eroeffnung i+1 − Schluss i) / Schluss i · 100, in Pp und in
             * Handelsrichtung. Verhaeltnis, also von der Bereinigung unabhaengig - deshalb ohne rohFaktor. */
            var lue = bars[i2][1] > 0 ? dir * (bars[i2 + 1][5] - bars[i2][1]) / bars[i2][1] * 100 : NaN;
            if (!(lue === lue)) Z.lueckeOhneSchluss++;
            delta.addKurs(K.kursZelle(nTage, kand, dirIdx, tagIdx, klasse, lebend), ek, K.ueberCentBoden(ek, klasse), lue);
          }
          var reihe0 = K.reiheIndex(kand, 0);
          var beob = verbuche(i2, dir, hf, false, function (h) { return K.zelle(nTage, reihe0, dirIdx, h, tagIdx, klasse, lebend); });
          if (!beob) Z.ohneEinstieg++;
        }
        Z.signaleGesamt[D.key] = (Z.signaleGesamt[D.key] || 0) + k;
        if (!k) continue;
        var rng = mulberry32(fnv(R.reihe + '|' + d.tag + '|' + D.key + '|' + zr.key));
        /* Placebo A: k zufaellige zulaessige Kerzen desselben Tages, zufaellige Richtung, ohne Kursblick */
        var topf = zul.slice(), m = Math.min(k, topf.length), reiheA = K.reiheIndex(kand, 1);
        for (var p = 0; p < m; p++) {
          var wI = p + Math.floor(rng() * (topf.length - p)); var tmp = topf[p]; topf[p] = topf[wI]; topf[wI] = tmp;
          var pi = topf[p], pdir = rng() < 0.5 ? 1 : -1, pdirIdx = pdir > 0 ? 0 : 1, phf = hVon(pi);
          Z.placeboAGezogen++;
          verbuche(pi, pdir, phf, false, (function (pd) { return function (h) { return K.zelle(nTage, reiheA, pd, h, tagIdx, klasse, lebend); }; })(pdirIdx));
        }
        /* Placebo B (gepaart): dieselbe Tageszeit (30-Minuten-Fenster), gleiche Richtung, ohne Kursblick */
        var reiheB = K.reiheIndex(kand, 2);
        for (var e2 = 0; e2 < echte.length; e2++) {
          var si = echte[e2][0], sdir = echte[e2][1], sw = Math.floor((bars[si][0] - d.auf) / (K.PAAR_FENSTER_MIN * 60000));
          var kand2 = (fensterVon[sw] || []).filter(function (x) { return x !== si; });
          if (!kand2.length) { Z.placeboBOhnePartner++; continue; }
          var bi = kand2[Math.floor(rng() * kand2.length)], bdirIdx = sdir > 0 ? 0 : 1, bhf = hVon(bi);
          Z.placeboBGezogen++;
          verbuche(bi, sdir, bhf, false, (function (bd) { return function (h) { return K.zelle(nTage, reiheB, bd, h, tagIdx, klasse, lebend); }; })(bdirIdx));
        }
      }
    }
    Z.msJeZr[zr.key] = (Z.msJeZr[zr.key] || 0) + (Date.now() - tZr);
  }
  return stat;
}

function lauf(a) {
  if (!a.aus) { console.error('Pflichtargument --aus <ordner> fehlt (pilot-*/ oder voll*/).'); process.exit(2); }
  var ordner = path.resolve(K.HIER, a.aus);
  fs.mkdirSync(ordner, { recursive: true });
  var kal = K.kalender();
  if (kal.bestaetigungAb !== K.BESTAETIGUNG_AB) { console.error('Kalender-Split ' + kal.bestaetigungAb + ' != registriert ' + K.BESTAETIGUNG_AB + ' - Abbruch, nichts gerechnet.'); process.exit(3); }
  var fp = path.join(ordner, '_fortschritt.json'), zp = path.join(ordner, '_zellen.bin');
  var F, sp;
  if (!a.neu && fs.existsSync(fp) && fs.existsSync(zp)) {
    F = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (F.kennung !== K.KONFIG_KENNUNG || F.nTage !== kal.tage.length) { console.error('Fortschritt in ' + ordner + ' gehoert zu einer anderen Konfiguration (' + F.kennung + ') - Abbruch.'); process.exit(4); }
    sp = Speicher.lade(zp, kal.tage.length, F.zellenStand);
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
  protokoll(ordner, 'START ' + K.KONFIG_KENNUNG + ' | ' + reihen.length + ' Reihen (' + alle.length + ' Aktien, ausgeschlossen ' + JSON.stringify(alle.ausgeschlossen) + ') | ' + dets.length + ' Detektoren | ' + K.N_H + ' Haltedauern | Tage ' + kal.tage.length + ' | Bestaetigung ab ' + kal.bestaetigungAb + (a.reihen ? ' | PILOT' : '') + (a.teil ? ' | Teil ' + a.teil.k + '/' + a.teil.n : ''));
  var stop = false;
  process.on('SIGINT', function () { stop = true; protokoll(ordner, 'SIGINT - nach dieser Datei wird gesichert und beendet'); });
  var seitCheckpoint = 0, tStart = Date.now();
  if (a.zeitrahmen) {
    var unbekannt = a.zeitrahmen.filter(function (z) { return !K.ZEITRAHMEN.some(function (x) { return x.key === z; }); });
    if (unbekannt.length) { console.error('Unbekannte Zeitrahmen: ' + unbekannt.join(' ')); process.exit(6); }
    protokoll(ordner, 'ZEITRAHMEN-TEIL: nur ' + a.zeitrahmen.join(' '));
  }
  var ctx = { a: a, kal: kal, dets: dets, F: F, sp: sp, ordner: ordner, zeitrahmen: a.zeitrahmen,
    abbruch: function () { return stop || (a.max && F.dateien >= a.max); },
    dateiFertig: function () { if (++seitCheckpoint >= a.checkpoint) { fortschrittSchreiben(ordner, F, sp); seitCheckpoint = 0; protokoll(ordner, 'CHECKPOINT ' + F.dateien + ' Dateien, ' + Math.round((Date.now() - tStart) / 60000) + ' min, Detektorfehler ' + JSON.stringify(F.zaehler.fehler)); } } };
  var abbruchFehler = null;
  try { for (var ri = 0; ri < reihen.length && !ctx.abbruch(); ri++) messeReihe(reihen[ri], ctx); }
  catch (e) { abbruchFehler = e; protokoll(ordner, 'ABBRUCH: ' + (e && e.message)); }
  F.beendet = abbruchFehler ? 'Abbruch: ' + abbruchFehler.message : (ctx.abbruch() ? (stop ? 'SIGINT' : 'max erreicht') : 'vollstaendig');
  fortschrittSchreiben(ordner, F, sp);
  protokoll(ordner, 'ENDE ' + F.beendet + ' | ' + F.dateien + ' Dateien | ' + (F.bytes / 1e9).toFixed(2) + ' GB | ' + F.kerzenRegulaer.toLocaleString('de-DE') + ' reg. Kerzen | lesen ' + Math.round(F.ms.lesen / 1000) + ' s, rechnen ' + Math.round(F.ms.rechnen / 1000) + ' s | ausgelassen ' + F.ausgelassen.length + ' | Detektorfehler ' + JSON.stringify(F.zaehler.fehler) + ' | Uebernacht offen/verbucht/verfallen ' + F.zaehler.uebernachtOffen + '/' + F.zaehler.uebernachtVerbucht + '/' + F.zaehler.uebernachtVerfallen);
  if (abbruchFehler) process.exitCode = 5;
  return F;
}

module.exports = { lauf: lauf, argumente: argumente, messeDatei: messeDatei, ausstiege: ausstiege, ertrag: ertrag, rufe: rufe, istDicht: istDicht, OFFEN: OFFEN,
  Speicher: Speicher, Delta: Delta, fnv: fnv, mulberry32: mulberry32, warmlaufAus: warmlaufAus, leererZaehler: leererZaehler, zaehlerAddieren: zaehlerAddieren };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
