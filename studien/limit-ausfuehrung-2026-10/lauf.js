'use strict';
/* LAUF - Limit statt Marktorder (REGEL.md, Auftrag Nr. 106, Siegel 9cb14c7).
 *
 * Ein Durchlauf je Symbol-Jahr-Datei des Alpaca-Minutenarchivs, mit den SIGNALEN DER MINUTENSTUDIE, unveraendert:
 * konfig.js, lesen.js und messen.js von dort werden per require benutzt und nicht angefasst. Die Schleife
 * von messen.messeDatei (Klasse je Tag, Massnahmen-Sperre, 80-%-Regel je Zeitrahmen, zulaessige Kerzen,
 * Cooldown, Detektoraufruf mit Fensterung/Vorfilter) steht hier noch einmal - Bit fuer Bit gleich, das prueft
 * test.js gegen messen.messeDatei (Zeilenart Signal-Markt = Kandidatenzellen der Minutenstudie). Neu ist nur,
 * was nach dem Signal passiert: Limit zum Schluss der Signalkerze, k Takte gueltig, zwei Fuellregeln,
 * Placebo mit derselben Limit-Mechanik.
 *
 * Aufruf (aus der Repo-Wurzel oder von hier):
 *   node --max-old-space-size=4096 lauf.js --aus <ordner> --zeitrahmen 5m 15m [--reihen A B C] [--teil k/n]
 *                                          [--max N] [--checkpoint N] [--wachhund SEK] [--neu]
 *   --aus         Ausgabeordner relativ zu diesem Ordner (pilot-*, voll-*). Nie derselbe fuer Probe und Befund.
 *   --zeitrahmen  1m | 5m 15m | 1m 5m 15m (Standard alle). Bestimmt das Zellenlayout (nur gewaehlte Zeitrahmen).
 *   uebrige wie messen.js der Minutenstudie.
 *
 * WAS AUF DIE PLATTE KOMMT: Summen (n, Sigma r, Sigma r^2) je (Zeilenart, Detektor, Zeitrahmen, Richtung,
 * Haltedauer, ET-Tag, Umsatzklasse, lebend) als _zellen.bin, dazu _fortschritt.json und _lauf.log. Eine Datei
 * ist ganz drin oder gar nicht (Zwischenspeicher je Datei), Checkpoint alle N Dateien, Neustart setzt fort.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var MIN_ORDNER = path.join(__dirname, '..', 'vorregistrierung-2026-09-06-signale-minuten');
var K = require(path.join(MIN_ORDNER, 'konfig.js'));
var L = require(path.join(MIN_ORDNER, 'lesen.js'));
var M = require(path.join(MIN_ORDNER, 'messen.js'));
var Liquide = require(path.join(K.REPO, 'liquide.js'));
var TAB = require(path.join(K.REPO, 'studien', 'signalstudie-2026-08', 'detektoren', '_tabelle.js'));

var HIER = __dirname;

/* ---------- Festlegungen der REGEL (§3, §5, §6) ---------- */
var LIMIT_K = { '1m': 15, '5m': 3, '15m': 1 };              // Takte nach der Signalkerze = 15 Minuten je Zeitrahmen
var TICK_USD = 0.01;                                         // streng: einen Tick unter (Short: ueber) dem Limit
var TOL_USD = 1e-6;                                          // Gleitkomma-Toleranz in Rohdollar
var ARTEN = ['sigMarkt', 'sigStreng', 'sigGross', 'plaMarkt', 'plaStreng', 'plaGross'];
var A = { sigMarkt: 0, sigStreng: 1, sigGross: 2, plaMarkt: 3, plaStreng: 4, plaGross: 5 };
var N_ART = ARTEN.length;
var SAAT_ZUSATZ = '|limit';                                  // Placebo-Saat: Reihe|Tag|Detektor|Zeitrahmen|limit

/* ---------- Zellenlayout (nur die gewaehlten Zeitrahmen) ---------- */
function zrAuswahl(liste) {
  var keys = (liste && liste.length) ? liste : K.ZEITRAHMEN.map(function (z) { return z.key; });
  /* in der Reihenfolge von K.ZEITRAHMEN, damit '15m 5m' und '5m 15m' dasselbe Layout haben */
  return K.ZEITRAHMEN.map(function (z) { return z.key; }).filter(function (z) { return keys.indexOf(z) !== -1; });
}
function kennung(zrSel) { return 'limit-ausfuehrung-2026-10/v2/' + N_ART + 'x' + K.N_DET + 'x' + zrSel.join('+') + 'x' + K.N_H + 'x' + K.N_K + '|' + K.KONFIG_KENNUNG; }
function zellenZahl(nTage, nZs) { return N_ART * K.N_DET * nZs * 2 * K.N_H * nTage * K.N_K * 2; }
/** Zelle: (((((((art*N_DET+det)*nZs+zs)*2+dir)*N_H+h)*nTage+tag)*N_K+klasse)*2+lebend */
function zelle(nTage, nZs, art, det, zs, dirIdx, h, tag, klasse, lebend) {
  return (((((((art * K.N_DET + det) * nZs + zs) * 2 + dirIdx) * K.N_H + h) * nTage + tag) * K.N_K + klasse) * 2) + lebend;
}
function dekodiere(idx, nTage, nZs) {
  var r = idx, lebend = r % 2; r = (r - lebend) / 2;
  var klasse = r % K.N_K; r = (r - klasse) / K.N_K;
  var tag = r % nTage; r = (r - tag) / nTage;
  var h = r % K.N_H; r = (r - h) / K.N_H;
  var dirIdx = r % 2; r = (r - dirIdx) / 2;
  var zs = r % nZs; r = (r - zs) / nZs;
  var det = r % K.N_DET; var art = (r - det) / K.N_DET;
  return { art: art, det: det, zs: zs, dirIdx: dirIdx, h: h, tag: tag, klasse: klasse, lebend: lebend };
}

/* ---------- Speicher ---------- */
function Speicher(nTage, nZs) {
  var z = zellenZahl(nTage, nZs);
  this.nTage = nTage; this.nZs = nZs;
  this.n = new Float64Array(z); this.s = new Float64Array(z); this.s2 = new Float64Array(z);
}
Speicher.prototype.felder = function () { return [this.n, this.s, this.s2]; };
Speicher.prototype.uebernehme = function (delta) {
  var self = this;
  delta.zellen.forEach(function (v, idx) { self.n[idx] += v[0]; self.s[idx] += v[1]; self.s2[idx] += v[2]; });
};
Speicher.prototype.addiere = function (b) {
  var a = this.felder(), c = b.felder();
  for (var f = 0; f < a.length; f++) for (var i = 0; i < a[f].length; i++) a[f][i] += c[f][i];
};
/** Felder plus Stand-Schwanz (8 Byte) - wie messen.js: passt der Stand nicht zu _fortschritt.json, verweigert lade(). */
Speicher.prototype.schreibe = function (pfad, stand) {
  var teile = this.felder().map(function (a) { return Buffer.from(a.buffer, a.byteOffset, a.byteLength); });
  teile.push(Buffer.from(new Float64Array([stand || 0]).buffer));
  var tmp = pfad + '.tmp';
  fs.writeFileSync(tmp, Buffer.concat(teile));
  fs.renameSync(tmp, pfad);
};
Speicher.lade = function (pfad, nTage, nZs, stand) {
  var sp = new Speicher(nTage, nZs), buf = fs.readFileSync(pfad), off = 0;
  sp.felder().forEach(function (a) {
    if (off + a.byteLength > buf.length) throw new Error('_zellen.bin zu kurz - passt nicht zum Layout');
    a.set(new Float64Array(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + a.byteLength))); off += a.byteLength;
  });
  if (buf.length - off !== 8) throw new Error('_zellen.bin ohne Stand-Schwanz - passt nicht zum Layout');
  var gelesen = new Float64Array(buf.buffer.slice(buf.byteOffset + off, buf.byteOffset + off + 8))[0];
  if (stand != null && gelesen !== stand) throw new Error('_zellen.bin (Stand ' + gelesen + ') passt nicht zu _fortschritt.json (Stand ' + stand + ') - nicht fortsetzen');
  sp.stand = gelesen;
  return sp;
};
function Delta() { this.zellen = new Map(); }
Delta.prototype.add = function (idx, r) { var v = this.zellen.get(idx); if (!v) { v = [0, 0, 0]; this.zellen.set(idx, v); } v[0]++; v[1] += r; v[2] += r * r; };

/* ---------- Die Limit-Mechanik (REGEL §3/§4) - reine Funktionen, von test.js an Hand-Faellen geprueft ---------- */
function tiefVon(b) { return (typeof b[4] === 'number' && b[4] > 0) ? b[4] : b[1]; }
function hochVon(b) { return (typeof b[3] === 'number' && b[3] > 0) ? b[3] : b[1]; }
/** Fuellung eines Limits zum Schluss der Kerze i in Richtung dir (1 Kauf, -1 Verkauf), k Takte der Laenge zrMin
 *  Minuten, nur Kerzen bis `bis` (letzte Kerze des Tages). rohFaktor(t) rechnet Datei-Kurse in damals gehandelte
 *  Dollar um (1 fuer Rohdateien). Liest fuer die Entscheidung in Kerze j nur Kerzen bis j.
 *  Rueckgabe { limit, streng: j|-1, gross: j|-1, lueckeStreng: bool, ohneHT: Zahl der Kerzen ohne Tief/Hoch im Fenster }. */
function fuellung(bars, i, dir, zrMin, k, bis, rohFaktor) {
  var lim = bars[i][1], von = bars[i][0] + zrMin * 60000, ende = bars[i][0] + (1 + k) * zrMin * 60000;
  var aus = { limit: lim, streng: -1, gross: -1, lueckeStreng: false, ohneHT: 0 };
  for (var j = i + 1; j <= bis; j++) {
    var b = bars[j];
    if (b[0] >= ende) break;
    if (b[0] < von) continue;
    var f = rohFaktor ? rohFaktor(b[0]) : 1;
    var extrem = dir > 0 ? tiefVon(b) : hochVon(b);
    var feld = dir > 0 ? b[4] : b[3];
    if (!(typeof feld === 'number' && feld > 0)) aus.ohneHT++;                // Tief/Hoch fehlt: der Schluss zaehlt (REGEL §3)
    var x = (dir > 0 ? (lim - extrem) : (extrem - lim)) * f;          // wie weit der Kurs durch das Limit ging, in Rohdollar
    if (aus.gross < 0 && x >= -TOL_USD) aus.gross = j;
    if (x >= TICK_USD - TOL_USD) {
      aus.streng = j;
      var xo = (dir > 0 ? (lim - b[5]) : (b[5] - lim)) * f;            // Eroeffnung schon durch das Limit: Luecke
      aus.lueckeStreng = xo >= TICK_USD - TOL_USD;
      break;
    }
  }
  return aus;
}
/** Ertrag (Pp) eines Limit-Handels: Einstieg zum Limitpreis in Kerze jFill, Ausstieg wie in der Minutenstudie
 *  (exit[h] mit Anker t_{i+1}; bis Schluss = Schluss der letzten Kerze). NaN ohne Fuellung oder ohne Ausstieg;
 *  -2 als Marke, wenn der Ausstieg nicht hinter der Fuellung laege (darf nie vorkommen, wird gezaehlt). */
function ertragLimit(bars, i, jFill, h, bis, exit, dir, limit) {
  if (jFill < 0) return NaN;
  var aus;
  if (K.HALTEDAUERN[h].min == null) aus = bars[bis][1];
  else {
    var j = exit[h][i - exit.von];
    if (j < 0) return NaN;
    if (j <= jFill) return -2e9;
    aus = bars[j][5];
  }
  if (!(aus > 0) || !(limit > 0)) return NaN;
  return dir * (aus - limit) / limit * 100;
}

/* ---------- Zaehler ---------- */
function leererZaehler() {
  return { tageOhneKlasse: {}, tageMassnahmen: {}, tageOhneKalender: {}, tageDuenn: {}, tageGewertet: {}, msJeZr: {}, zeitrahmenNichtErkannt: {},
    aufrufe: {}, fehler: {}, signaleGesamt: {},
    /* je 'det|zr|dir': [Signale, mit Einstieg, gefuellt streng, gefuellt grosszuegig] - dasselbe fuer das Placebo */
    fuellSignal: {}, fuellPlacebo: {},
    abstandStreng: {}, abstandGross: {},           // je zr: Histogramm j - i der Fuellkerze
    lueckeStreng: { signal: 0, placebo: 0 }, ohneHochTief: 0, ausstiegVorFuellung: 0, placeboGezogen: 0, placeboWenigerKerzen: 0, placeboVersatzMin: {}, placeboVersatzN: {},
    lesenVerworfen: { unsortiert: 0, ausserFenster: 0, lebenszeit: 0, nichtRegulaer: 0, ohneKurs: 0 } };
}
function plus(o, k, v) { o[k] = (o[k] || 0) + (v == null ? 1 : v); }
function fuellZaehlen(tab, key, mitEinstieg, f) {
  var z = tab[key] || (tab[key] = [0, 0, 0, 0]);
  z[0]++; if (mitEinstieg) z[1]++; if (f.streng >= 0) z[2]++; if (f.gross >= 0) z[3]++;
}

/* ---------- Eine Datei ---------- */
/** Wie messen.messeDatei (Minutenstudie), mit den sechs Zeilenarten der Limit-Regel statt Kandidat/Placebo A/B/Topf.
 *  ctx: { kal, dets, zrSel (Schluessel-Liste), nZs }. Schreibt nur in `delta`. */
function messeDatei(R, g, warm, massnahmen, delta, ctx, frist) {
  var kal = ctx.kal, nTage = kal.tage.length, dets = ctx.dets, Z = leererZaehler(), zrSel = ctx.zrSel, nZs = zrSel.length;
  var kerzen = g.kerzen, lebend = R.lebend;
  var rohFaktor = g.rohFaktor || function () { return 1; };
  var stat = { signale: {}, signaleGesamt: 0, tage: 0, tageGewertet: {}, zaehler: Z };
  dets.forEach(function (D) { stat.signale[D.key] = [0, 0, 0]; });
  if (!kerzen.length) return stat;
  /* Umsatzklasse je Tag - wortgleich messen.js */
  var T1 = L.tageAus(kerzen);
  var ums = warm.tagesUmsatz.slice(), klasseJeTag = {};
  T1.forEach(function (d) { var v = 0; for (var q = d.von; q <= d.bis; q++) v += kerzen[q][2] || 0; ums.push([kerzen[d.von][0], kerzen[d.bis][1], v]); });
  var basis = ums.length - T1.length;
  T1.forEach(function (d, q) {
    var idx = basis + q;
    klasseJeTag[d.tag] = (idx - K.UMSATZ_FENSTER < 0) ? -1 : K.klasseIndex(Liquide.medianUmsatz(ums, idx - 1, K.UMSATZ_FENSTER));
  });
  stat.tage = T1.length;
  var sperrTage = L.ausschlussTage(R, massnahmen, g.quelle, g.angewandt);
  var jahrStartMs = kerzen[0][0];
  var alle1m = warm.kerzen1m.length ? warm.kerzen1m.concat(kerzen) : kerzen;

  for (var zi = 0; zi < K.ZEITRAHMEN.length; zi++) {
    var zr = K.ZEITRAHMEN[zi], barMs = zr.min * 60000, zs = zrSel.indexOf(zr.key);
    if (zs === -1) continue;
    var kLim = LIMIT_K[zr.key];
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
      if (tagIdx === undefined) { plus(Z.tageOhneKalender, zr.key); continue; }
      var klasse = klasseJeTag[d.tag]; if (klasse == null) klasse = -1;
      if (klasse < 0) { plus(Z.tageOhneKlasse, zr.key); continue; }
      if (sperrTage.has(d.tag)) { plus(Z.tageMassnahmen, zr.key); continue; }
      plus(Z.tageGewertet, zr.key); plus(stat.tageGewertet, zr.key);
      var zul = [];
      for (var i = d.von; i < d.bis; i++) if (bars[i][0] + barMs + K.MIN_REST_MIN * 60000 <= d.schluss) zul.push(i);
      if (!zul.length) continue;
      var exit = M.ausstiege(bars, d.von, d.bis);
      for (var dI = 0; dI < dets.length; dI++) {
        var D = dets[dI], echte = [];
        Z.aufrufe[D.key] = Z.aufrufe[D.key] || 0;
        for (var q2 = 0; q2 < zul.length; q2++) {
          var i2 = zul[q2];
          if (bars[i2][0] - letztesSignal[D.key] < K.COOLDOWN_MIN * 60000) continue;
          var s = null; Z.aufrufe[D.key]++;
          try { s = M.rufe(D, params[dI], bars, i2, T, di); } catch (err) { plus(Z.fehler, D.key); continue; }
          if (!s || !s.dir) continue;
          letztesSignal[D.key] = bars[i2][0];
          stat.signale[D.key][zi]++; stat.signaleGesamt++;
          var dir = s.dir > 0 ? 1 : -1;
          echte.push([i2, dir]);
          handel(bars, i2, dir, d, exit, kLim, zr, rohFaktor, nTage, nZs, zs, dI, D.key, tagIdx, klasse, lebend, delta, Z, false);
        }
        plus(Z.signaleGesamt, D.key, echte.length);
        if (!echte.length) continue;
        /* Placebo (REGEL Nachtrag 1, ersetzt §6.1-Ziehung): je Signal eine zulaessige Kerze desselben Tages STRENG NACH
         * der Signalkerze, gleichverteilt, mit der Richtung dieses Signals. Richtung und Existenz des Placebos stehen
         * damit zu seinem Einstieg schon fest - eine Ziehung VOR dem Signal haette dessen Richtung (aus dem Kursweg bis
         * zum Signal) als Blick nach vorn benutzt (Martingal-Probe, test.js 8). Keine spaetere Kerze: kein Placebo. */
        var rng = M.mulberry32(M.fnv(R.reihe + '|' + d.tag + '|' + D.key + '|' + zr.key + SAAT_ZUSATZ));
        for (var p = 0; p < echte.length; p++) {
          var si = echte[p][0], ab = 0;
          while (ab < zul.length && zul[ab] <= si) ab++;
          var nKand = zul.length - ab;
          if (!nKand) { Z.placeboWenigerKerzen++; continue; }
          var pi = zul[ab + Math.floor(rng() * nKand)];
          Z.placeboGezogen++;
          plus(Z.placeboVersatzMin, zr.key, (bars[pi][0] - bars[si][0]) / 60000); plus(Z.placeboVersatzN, zr.key);
          handel(bars, pi, echte[p][1], d, exit, kLim, zr, rohFaktor, nTage, nZs, zs, dI, D.key, tagIdx, klasse, lebend, delta, Z, true);
        }
      }
    }
    Z.msJeZr[zr.key] = (Z.msJeZr[zr.key] || 0) + (Date.now() - tZr);
  }
  return stat;
}
/** Ein Handel (Signal oder Placebo) an Kerze i: Markt-Ertrag (Eroeffnung i+1), Limit streng und grosszuegig. */
function handel(bars, i, dir, d, exit, kLim, zr, rohFaktor, nTage, nZs, zs, dI, detKey, tagIdx, klasse, lebend, delta, Z, placebo) {
  var dirIdx = dir > 0 ? 0 : 1, aMarkt = placebo ? A.plaMarkt : A.sigMarkt, aStreng = placebo ? A.plaStreng : A.sigStreng, aGross = placebo ? A.plaGross : A.sigGross;
  var mitEinstieg = i + 1 <= d.bis && bars[i + 1][5] > 0;
  var f = fuellung(bars, i, dir, zr.min, kLim, d.bis, rohFaktor);
  Z.ohneHochTief += f.ohneHT;
  fuellZaehlen(placebo ? Z.fuellPlacebo : Z.fuellSignal, detKey + '|' + zr.key + '|' + (dir > 0 ? 'long' : 'short'), mitEinstieg, f);
  if (f.streng >= 0) { plus(Z.abstandStreng[zr.key] || (Z.abstandStreng[zr.key] = {}), String(f.streng - i)); if (f.lueckeStreng) Z.lueckeStreng[placebo ? 'placebo' : 'signal']++; }
  if (f.gross >= 0) plus(Z.abstandGross[zr.key] || (Z.abstandGross[zr.key] = {}), String(f.gross - i));
  for (var h = 0; h < K.N_H; h++) {
    var r = M.ertrag(bars, i, h, d.bis, exit, dir);
    if (r === r) delta.add(zelle(nTage, nZs, aMarkt, dI, zs, dirIdx, h, tagIdx, klasse, lebend), r);
    var rs = ertragLimit(bars, i, f.streng, h, d.bis, exit, dir, f.limit);
    if (rs === -2e9) Z.ausstiegVorFuellung++;
    else if (rs === rs) delta.add(zelle(nTage, nZs, aStreng, dI, zs, dirIdx, h, tagIdx, klasse, lebend), rs);
    var rg = ertragLimit(bars, i, f.gross, h, d.bis, exit, dir, f.limit);
    if (rg === -2e9) Z.ausstiegVorFuellung++;
    else if (rg === rg) delta.add(zelle(nTage, nZs, aGross, dI, zs, dirIdx, h, tagIdx, klasse, lebend), rg);
  }
}

/* ---------- Reihe, Fortschritt, Lauf (Muster messen.js) ---------- */
function protokoll(ordner, zeile) {
  var s = new Date().toISOString() + '  ' + zeile;
  console.log(s);
  try { fs.appendFileSync(path.join(ordner, '_lauf.log'), s + '\n'); } catch (e) { /* Log ist Komfort */ }
}
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
function fortschrittSchreiben(ordner, F, sp) {
  F.zellenStand++;
  sp.schreibe(path.join(ordner, '_zellen.bin'), F.zellenStand);
  var tmp = path.join(ordner, '_fortschritt.json.tmp');
  F.stand = new Date().toISOString();
  fs.writeFileSync(tmp, JSON.stringify(F));
  fs.renameSync(tmp, path.join(ordner, '_fortschritt.json'));
}
function messeReihe(R, ctx) {
  var F = ctx.F;
  var jahre = R.jahre.filter(function (j) { return j >= +K.FENSTER.von.slice(0, 4) && j <= +K.FENSTER.bis.slice(0, 4); });
  var massnahmen = L.massnahmenFuer(R);
  var warm = null, WARM_TAGE = 16;                                  // wie messen.js (Review F6)
  for (var ji = 0; ji < jahre.length; ji++) {
    var jahr = jahre[ji], key = R.reihe + '/' + jahr;
    if (ctx.abbruch()) return;
    if (F.erledigt[key]) { warm = null; continue; }
    if (ctx.a.max && F.dateien >= ctx.a.max) return;
    var t0 = Date.now();
    if (warm == null && ji > 0) {
      var vv = ji > 1 ? L.ladeJahr(R, jahre[ji - 2]) : null, v = L.ladeJahr(R, jahre[ji - 1]);
      var w0 = (vv && vv.ok) ? M.warmlaufAus(vv.kerzen, WARM_TAGE) : null;
      warm = v.ok ? M.warmlaufAus(v.kerzen, WARM_TAGE, w0) : (w0 ? { kerzen1m: [], tagesUmsatz: w0.tagesUmsatz } : { kerzen1m: [], tagesUmsatz: [] });
    }
    if (warm == null) warm = { kerzen1m: [], tagesUmsatz: [] };
    var g = L.ladeJahr(R, jahr);
    var tLesen = Date.now() - t0;
    if (!g.ok) { F.ausgelassen.push({ datei: key, grund: g.grund, pfad: g.pfad }); protokoll(ctx.ordner, 'AUSGELASSEN ' + key + ': ' + g.grund); warm = null; continue; }
    var delta = new Delta(), frist = Date.now() + ctx.a.wachhund * 1000, stat;
    try { stat = messeDatei(R, g, warm, massnahmen, delta, ctx, frist); }
    catch (e) {
      if (e && e.wachhund) { F.ausgelassen.push({ datei: key, grund: 'Wachhund ' + ctx.a.wachhund + ' s' }); protokoll(ctx.ordner, 'WACHHUND ' + key); }
      else { F.ausgelassen.push({ datei: key, grund: 'Fehler: ' + (e && e.message) }); protokoll(ctx.ordner, 'FEHLER ' + key + ': ' + (e && e.stack || e)); }
      warm = M.warmlaufAus(g.kerzen, WARM_TAGE, warm); continue;
    }
    ctx.sp.uebernehme(delta);
    M.zaehlerAddieren(F.zaehler, stat.zaehler); M.zaehlerAddieren(F.zaehler.lesenVerworfen, g.verworfen || {});
    Object.keys(stat.zaehler.fehler || {}).forEach(function (dk) {
      if (stat.zaehler.fehler[dk] > 0.01 * (stat.zaehler.aufrufe[dk] || 0)) throw new Error('Detektor ' + dk + ' wirft auf ' + stat.zaehler.fehler[dk] + ' von ' + stat.zaehler.aufrufe[dk] + ' Aufrufen in ' + key + ' - Lauf abgebrochen');
    });
    F.erledigt[key] = 1; F.dateien++; F.bytes += g.bytes; F.kerzenRegulaer += g.kerzen.length;
    F.ms.lesen += tLesen; F.ms.rechnen += Date.now() - t0 - tLesen;
    var sig = F.signale[R.reihe] || (F.signale[R.reihe] = { lebend: R.lebend, gruppe: R.gruppe, art: R.art, tage: 0, det: {} });
    sig.tage += stat.tage;
    Object.keys(stat.signale).forEach(function (dk) { var z = sig.det[dk] || (sig.det[dk] = [0, 0, 0]); for (var q = 0; q < 3; q++) z[q] += stat.signale[dk][q]; });
    var gew = ctx.zrSel.map(function (z) { return stat.tageGewertet[z] || 0; }).join('/');
    protokoll(ctx.ordner, key.padEnd(16) + g.quelle.padEnd(10) + String(g.kerzen.length).padStart(8) + ' reg. Kerzen  ' + gew.padStart(9) + ' von ' + String(stat.tage).padEnd(4) + ' Tagen gewertet (' + ctx.zrSel.join('/') + ')  ' + String(stat.signaleGesamt).padStart(7) + ' Signale  ' + tLesen + ' ms lesen  ' + (Date.now() - t0 - tLesen) + ' ms rechnen');
    warm = M.warmlaufAus(g.kerzen, WARM_TAGE, warm);
    ctx.dateiFertig();
  }
}
function lauf(a) {
  if (!a.aus) { console.error('Pflichtargument --aus <ordner> fehlt.'); process.exit(2); }
  var zrSel = zrAuswahl(a.zeitrahmen);
  if (a.zeitrahmen) {
    var unbekannt = a.zeitrahmen.filter(function (z) { return !K.ZEITRAHMEN.some(function (x) { return x.key === z; }); });
    if (unbekannt.length) { console.error('Unbekannte Zeitrahmen: ' + unbekannt.join(' ')); process.exit(6); }
  }
  var ordner = path.resolve(HIER, a.aus);
  fs.mkdirSync(ordner, { recursive: true });
  var kal = K.kalender();
  if (kal.bestaetigungAb !== K.BESTAETIGUNG_AB) { console.error('Kalender-Split ' + kal.bestaetigungAb + ' != registriert ' + K.BESTAETIGUNG_AB + ' - Abbruch.'); process.exit(3); }
  var KENN = kennung(zrSel), fp = path.join(ordner, '_fortschritt.json'), zp = path.join(ordner, '_zellen.bin'), F, sp;
  if (!a.neu && fs.existsSync(fp) && fs.existsSync(zp)) {
    F = JSON.parse(fs.readFileSync(fp, 'utf8'));
    if (F.kennung !== KENN || F.nTage !== kal.tage.length) { console.error('Fortschritt in ' + ordner + ' gehoert zu einer anderen Konfiguration (' + F.kennung + ') - Abbruch.'); process.exit(4); }
    sp = Speicher.lade(zp, kal.tage.length, zrSel.length, F.zellenStand);
    protokoll(ordner, 'FORTSETZUNG: ' + Object.keys(F.erledigt).length + ' Dateien erledigt, Zellenstand ' + F.zellenStand);
  } else {
    if (a.neu && fs.existsSync(fp)) protokoll(ordner, 'NEU: vorhandener Fortschritt in ' + ordner + ' wird ueberschrieben');
    F = { kennung: KENN, begonnen: new Date().toISOString(), pilot: !!a.reihen, reihenArg: a.reihen, teil: a.teil, zeitrahmen: zrSel, limitK: LIMIT_K,
      nTage: kal.tage.length, bestaetigungAb: kal.bestaetigungAb, zellenStand: 0, erledigt: {}, ausgelassen: [], signale: {}, dateien: 0, bytes: 0, kerzenRegulaer: 0,
      ms: { lesen: 0, rechnen: 0 }, reihenAusgeschlossen: null, zaehler: leererZaehler() };
    sp = new Speicher(kal.tage.length, zrSel.length);
  }
  var alle = L.reihen();
  F.reihenAusgeschlossen = alle.ausgeschlossen || null;
  var reihen = alle;
  if (a.reihen) { var soll = new Set(a.reihen); reihen = alle.filter(function (R) { return soll.has(R.reihe); }); var fehlen = a.reihen.filter(function (r) { return !alle.some(function (R) { return R.reihe === r; }); }); if (fehlen.length) protokoll(ordner, 'WARNUNG: verlangte Reihen ohne Balken/keine Aktie: ' + fehlen.join(' ')); }
  if (a.teil) reihen = reihen.filter(function (R, i) { return i % a.teil.n === a.teil.k; });
  var dets = K.detektoren();
  protokoll(ordner, 'START ' + KENN + ' | ' + reihen.length + ' Reihen (' + alle.length + ' Aktien) | Zeitrahmen ' + zrSel.join(' ') + ' | k ' + JSON.stringify(LIMIT_K) + (a.reihen ? ' | PILOT' : '') + (a.teil ? ' | Teil ' + a.teil.k + '/' + a.teil.n : ''));
  var stop = false;
  process.on('SIGINT', function () { stop = true; protokoll(ordner, 'SIGINT - nach dieser Datei wird gesichert und beendet'); });
  var seitCheckpoint = 0, tStart = Date.now();
  var ctx = { a: a, kal: kal, dets: dets, F: F, sp: sp, ordner: ordner, zrSel: zrSel, nZs: zrSel.length,
    abbruch: function () { return stop || (a.max && F.dateien >= a.max); },
    dateiFertig: function () { if (++seitCheckpoint >= a.checkpoint) { fortschrittSchreiben(ordner, F, sp); seitCheckpoint = 0; protokoll(ordner, 'CHECKPOINT ' + F.dateien + ' Dateien, ' + Math.round((Date.now() - tStart) / 60000) + ' min'); } } };
  var abbruchFehler = null;
  try { for (var ri = 0; ri < reihen.length && !ctx.abbruch(); ri++) messeReihe(reihen[ri], ctx); }
  catch (e) { abbruchFehler = e; protokoll(ordner, 'ABBRUCH: ' + (e && e.message)); }
  F.beendet = abbruchFehler ? 'Abbruch: ' + abbruchFehler.message : (ctx.abbruch() ? (stop ? 'SIGINT' : 'max erreicht') : 'vollstaendig');
  fortschrittSchreiben(ordner, F, sp);
  protokoll(ordner, 'ENDE ' + F.beendet + ' | ' + F.dateien + ' Dateien | ' + (F.bytes / 1e9).toFixed(2) + ' GB | ' + F.kerzenRegulaer.toLocaleString('de-DE') + ' reg. Kerzen | lesen ' + Math.round(F.ms.lesen / 1000) + ' s, rechnen ' + Math.round(F.ms.rechnen / 1000) + ' s | ausgelassen ' + F.ausgelassen.length + ' | Detektorfehler ' + JSON.stringify(F.zaehler.fehler) + ' | Ausstieg vor Fuellung ' + F.zaehler.ausstiegVorFuellung);
  if (abbruchFehler) process.exitCode = 5;
  return F;
}

module.exports = { LIMIT_K: LIMIT_K, TICK_USD: TICK_USD, TOL_USD: TOL_USD, ARTEN: ARTEN, A: A, N_ART: N_ART, SAAT_ZUSATZ: SAAT_ZUSATZ,
  zrAuswahl: zrAuswahl, kennung: kennung, zellenZahl: zellenZahl, zelle: zelle, dekodiere: dekodiere, Speicher: Speicher, Delta: Delta,
  fuellung: fuellung, ertragLimit: ertragLimit, tiefVon: tiefVon, hochVon: hochVon, messeDatei: messeDatei, leererZaehler: leererZaehler,
  argumente: argumente, lauf: lauf, MIN_ORDNER: MIN_ORDNER };
if (require.main === module) lauf(argumente(process.argv.slice(2)));
