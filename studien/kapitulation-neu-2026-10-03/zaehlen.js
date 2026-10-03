'use strict';
/* KAPITULATION NEU, PHASE 1 - BLINDE SIGNALZAEHLUNG auf dem Alpaca-Minutenarchiv (Auftrag Nr. 65, 03.10.2026).
 *
 * Gezaehlt wird die Variante V2 des Protokolls vom 26.08.2026 (60m, H = 26 Kerzen, Umsatz >= 50 Mio $,
 * Regime), dazu dieselbe Regel ohne Regime (V1). KEINE Rendite eines Kapitulations-Signals wird gerechnet:
 * die einzige Rendite in dieser Datei ist die eines ZUFALLSEINSTIEGS (Topf, siehe unten), und Reihentage
 * mit einem echten Signal sind aus dem Topf ausgeschlossen.
 *
 * Nichts wird nachgebaut, was es schon gibt:
 *   Ausloeser + Umsatztor   studien/messmaschine/strategien/kapitulation.js (S.signal -> quant.js einstiegSignal)
 *   Lesen des Archivs       studien/vorregistrierung-2026-09-06-signale-minuten/lesen.js + konfig.js
 *                           (bereinigt vor roh, nur regulaere Kerzen, Lebenszeit, Sperrtage um Massnahmen)
 *   Umsatzklasse je Tag     liquide.js medianUmsatz ueber 20 Balkentage davor (wie das Minuten-Messgeraet)
 * Neu ist nur: 1m -> 60m (Gitter ab 09:30 ET je Sitzung, 7 Kerzen, die letzte 30 Minuten - das Gitter der
 * Yahoo-Stundenkerzen des alten Archivs), Regime aus SPY des SELBEN Archivs (EMA200 der Stundenschluesse,
 * Formel wortgleich kapitulation.js Zeile 87-92, letzter Stempel STRENG vor dem Signal), und der Topf.
 *
 * Aufruf (aus der Repo-Wurzel, E: wird nur gelesen):
 *   node studien/kapitulation-neu-2026-10-03/zaehlen.js --teil k/n            Stichprobe 400 (feste Saat)
 *   node studien/kapitulation-neu-2026-10-03/zaehlen.js --sperrliste          die Reihen der 47 Split-Saetze, ganz
 *   node studien/kapitulation-neu-2026-10-03/zaehlen.js --alle --teil k/n     Vollzaehlung (Phase 2, Lauf ueber ~1 h)
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var REPO = path.resolve(__dirname, '..', '..');
var MIN = path.join(REPO, 'studien', 'vorregistrierung-2026-09-06-signale-minuten');
var K = require(path.join(MIN, 'konfig.js'));
var L = require(path.join(MIN, 'lesen.js'));
var Liquide = require(path.join(REPO, 'liquide.js'));
var S = require(path.join(REPO, 'studien', 'messmaschine', 'strategien', 'kapitulation.js'));
var ST = require(path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13', 'statistik.js'));

var SAAT = 'kapitulation-2026-10-03';
var VOR = 261, H = 26;                       // Protokoll: mindestKerzenVorlauf 261, haltedauerKerzen 26
var PV1 = { liquiditaet: true, regime: false };
var SPLIT_DATEI = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13', 'panel-stand.json');

/** Geschichtete Stichprobe: lebend/verschwunden im Verhaeltnis des Archivs, feste Saat. */
function stichprobe(alle, n) {
  var rng = ST.mulberry32(ST.fnv(SAAT));
  var leb = alle.filter(function (r) { return r.lebend; }), ver = alle.filter(function (r) { return !r.lebend; });
  var nL = Math.round(n * leb.length / alle.length), nV = n - nL;
  function zieh(a, k) { a = a.slice(); for (var q = a.length - 1; q > 0; q--) { var w = Math.floor(rng() * (q + 1)); var t = a[q]; a[q] = a[w]; a[w] = t; } return a.slice(0, k); }
  return zieh(leb, nL).concat(zieh(ver, nV)).sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
}

/** 1m -> 60m fuer einen Tagesabschnitt aus L.tageAus: Eimer = volle Stunden seit Sitzungsbeginn, Stempel = Eimeranfang. */
function verdichte60(k1, d, bars, oeff) {
  var b = -1, cur = null, vol = 0;
  for (var q = d.von; q <= d.bis; q++) {
    var k = k1[q], e = Math.max(0, Math.floor((k[0] - d.auf) / 3600000));
    /* oeff (Phase 2, nur fuer die Einstiegsluecke S9): Eroeffnung der ersten Minute des Eimers, als EIGENES Feld - die
     * Kerzen selbst bleiben [ms, schluss, stueck], damit der Ausloeser genau das sieht, was er in Phase 1 sah. */
    if (e !== b) { cur = [d.auf + e * 3600000, k[1], 0]; bars.push(cur); if (oeff) oeff.push(k[5]); b = e; }
    cur[1] = k[1]; cur[2] += k[2] || 0; vol += k[2] || 0;
  }
  return vol;
}

/** Ganze Reihe als 60m-Kerzen [ms, schluss, stueck] ueber alle Jahresdateien, dazu Tage und Sperrtage. */
function ladeReihe60(R) {
  var kal = K.kalender(), bars = [], oeff = [], barTag = [], tage = [], sperr = new Set(), angewandt = new Set(), fehl = [], dateien = 0, bytes = 0, msLesen = 0;
  var massnahmen = L.massnahmenFuer(R);
  R.jahre.filter(function (j) { return j >= +K.FENSTER.von.slice(0, 4) && j <= +K.FENSTER.bis.slice(0, 4); }).forEach(function (jahr) {
    var t0 = Date.now(), g = L.ladeJahr(R, jahr); msLesen += Date.now() - t0;
    if (!g.ok) { fehl.push(jahr + ': ' + g.grund); return; }
    dateien++; bytes += g.bytes;
    g.angewandt.forEach(function (a) { angewandt.add(a); });
    /* Sperrtage (+-10 Handelstage um nicht angewandte Massnahmen) nur fuer das Jahr dieser Datei: die Regel haengt an
     * der Quelle der DATEI, und eine rohe Nachbardatei darf einen sauber bereinigten Split nicht nachtraeglich sperren. */
    L.ausschlussTage(R, massnahmen, g.quelle, g.angewandt).forEach(function (t) { if (+t.slice(0, 4) === jahr) sperr.add(t); });
    L.tageAus(g.kerzen).forEach(function (d) {
      var ki = kal.idx[d.tag]; if (ki === undefined) return;
      var von = bars.length, vol = verdichte60(g.kerzen, d, bars, oeff);
      for (var q = von; q < bars.length; q++) barTag.push(tage.length);
      tage.push({ tag: d.tag, ki: ki, t0: g.kerzen[d.von][0], close: g.kerzen[d.bis][1], vol: vol });
    });
  });
  return { bars: bars, oeff: oeff, barTag: barTag, tage: tage, sperr: sperr, angewandt: angewandt, fehl: fehl, dateien: dateien, bytes: bytes, msLesen: msLesen };
}

/** Regime aus SPY-Stundenkerzen: ueber[q] = Schluss > EMA200 (vor 200 Kerzen kein Urteil = null). */
function regimeAus(bars) {
  var k = 2 / (200 + 1), ema = bars.length ? bars[0][1] : 0, zeit = [], ueber = [];
  for (var q = 0; q < bars.length; q++) { ema = bars[q][1] * k + ema * (1 - k); zeit.push(bars[q][0]); ueber.push(q >= 200 ? bars[q][1] > ema : null); }
  return {
    zeit: zeit, ueber: ueber,
    /** Tor offen = SPY NICHT ueber der Linie (null laesst durch, wie kapitulation.js Zeile 168). */
    offen: function (ms) {
      var lo = 0, hi = zeit.length;
      while (lo < hi) { var m = (lo + hi) >> 1; if (zeit[m] < ms) lo = m + 1; else hi = m; }
      return (lo > 0 ? ueber[lo - 1] : null) !== true;
    },
  };
}

function splitListe() {
  var l = JSON.parse(fs.readFileSync(SPLIT_DATEI, 'utf8')).zaehler.splitAbgelehntListe || [], je = {};
  l.forEach(function (e) { (je[e.reihe] || (je[e.reihe] = [])).push(e); });
  return { liste: l, je: je };
}

/** Eine Reihe zaehlen. sig: [Kalenderindex, Klasse, Regime offen, Ausstiegskerze da, Sperrtag, Split-Fenster 0-3]. */
function zaehleReihe(R, regime, splits, opt) {
  /* opt (Phase 2, messen.js): d = schon geladene Reihe (Kunstdaten der Pruefungen), signal = Ausloeser (Vorgabe: der echte,
   * unveraendert), voll = Ertragsstufe, die sich nach der Zaehlung einhaengt und den Topf der Phase 1 ersetzt. */
  opt = opt || {};
  var sigF = opt.signal || function (b, j) { return S.signal(b, j, PV1); }, sigI = [];
  var d = opt.d || ladeReihe60(R), bars = d.bars, bt = d.barTag, tage = d.tage, len = bars.length, i;
  var aus = { reihe: R.reihe, lebend: R.lebend, dateien: d.dateien, bytes: d.bytes, fehl: d.fehl, tage: tage.length, kerzen: len,
    ersterTag: tage.length ? tage[0].tag : null, letzterTag: tage.length ? tage[tage.length - 1].tag : null,
    tageLiq: 0, tageLiqOffen: 0, sig: [], klinke: 0, topf: [], split: [], msLesen: d.msLesen };
  /* Split-Fenster um falsche Spruenge: e = erste Kerze am Ex-Tag. 1 = [e-H, e-1] Halteperiode ueberspannt den Sprung,
   * 2 = [e, e+H] am/nach dem Ex-Tag innerhalb der Haltedauer, 3 = [e+H+1, e+VOR] Sprung liegt im Lesefenster. */
  var fen = [];
  (splits.je[R.reihe] || []).forEach(function (e) {
    var ex = -1; for (var q = 0; q < len; q++) if (tage[bt[q]].tag >= e.ex) { ex = q; break; }
    var kopie = d.angewandt.has(e.art + '|' + e.ex);
    var eintrag = { ex: e.ex, art: e.art, faktor: e.faktor, inKopieAngewandt: kopie, kerze: ex, sprung: ex > 0 ? bars[ex][1] / bars[ex - 1][1] - 1 : null, v1: [0, 0, 0], v2: [0, 0, 0] };
    aus.split.push(eintrag); if (ex >= 0) fen.push({ e: ex, z: eintrag });
  });
  function splitFenster(i) {
    for (var q = 0; q < fen.length; q++) { var e = fen[q].e; if (i >= e - H && i < e) return [1, fen[q].z]; if (i >= e && i <= e + H) return [2, fen[q].z]; if (i > e + H && i <= e + VOR) return [3, fen[q].z]; }
    return null;
  }
  if (len <= VOR) return aus;
  /* Umsatztor wie dollarVolNachlaufend (Mittel der 20 Handelstage VOR dem Tag, Summe Schluss x Stueck der 60m-Kerzen);
   * hier nur fuer die Topf-Zugehoerigkeit nachgerechnet - das Signal selbst entscheidet S.signal. Klinke: weichen beide ab, zaehlt aus.klinke. */
  var ts = new Float64Array(tage.length), P = new Float64Array(tage.length + 1);
  for (i = 0; i < len; i++) ts[bt[i]] += (bars[i][1] || 0) * (bars[i][2] || 0);
  for (i = 0; i < tage.length; i++) P[i + 1] = P[i] + ts[i];
  var ums = tage.map(function (t) { return [t.t0, t.close, t.vol]; }), kl = new Int8Array(tage.length);
  for (i = 0; i < tage.length; i++) kl[i] = i < K.UMSATZ_FENSTER ? -1 : K.klasseIndex(Liquide.medianUmsatz(ums, i - 1, K.UMSATZ_FENSTER));
  var flag = new Uint8Array(len), liqTag = new Uint8Array(tage.length), offTag = new Uint8Array(tage.length), sigTag = new Uint8Array(tage.length);
  for (i = VOR; i < len; i++) {
    var n = bt[i], s1 = sigF(bars, i);
    var liq = n >= 20 && (P[n] - P[n - 20]) / 20 >= 50e6;
    if (!!s1 !== !!(s1 && liq)) aus.klinke++;
    if (!liq) continue;
    var offen = regime.offen(bars[i][0]);
    flag[i] = offen ? 3 : 1; liqTag[n] = 1; if (offen) offTag[n] = 1;
    if (!s1) continue;
    sigTag[n] = 1;
    var sf = splitFenster(i);
    if (sf) { sf[1].v1[sf[0] - 1]++; if (offen) sf[1].v2[sf[0] - 1]++; }
    aus.sig.push([tage[n].ki, kl[n], offen ? 1 : 0, i + H < len ? 1 : 0, d.sperr.has(tage[n].tag) ? 1 : 0, sf ? sf[0] : 0]); sigI.push(i);
  }
  for (i = 0; i < tage.length; i++) { aus.tageLiq += liqTag[i]; aus.tageLiqOffen += offTag[i]; }
  if (opt.voll) { opt.voll(aus, { d: d, bars: bars, bt: bt, tage: tage, len: len, kl: kl, flag: flag, sigTag: sigTag, sigI: sigI, splitFenster: splitFenster }); return aus; }
  /* TOPF (Placebo): je Reihentag EIN Zufallseinstieg unter den Kerzen, die V2 haette nehmen duerfen (Umsatztor offen,
   * Regime offen, Ausstiegskerze da) - ohne Sperrtage, ohne Split-Fenster und OHNE jeden Reihentag mit echtem Signal.
   * Rendite = Schluss[i+H] / Schluss[i] - 1, gespeichert in Basispunkten. */
  var kand = [], tagJetzt = -1;
  function zieh() {
    if (!kand.length) return;
    var t = tage[tagJetzt], rng = ST.mulberry32(ST.fnv(SAAT + '|' + R.reihe + '|' + t.tag)), j = kand[Math.floor(rng() * kand.length)];
    if (bars[j][1] > 0 && bars[j + H][1] > 0) aus.topf.push([t.ki, kl[tagJetzt], Math.round((bars[j + H][1] / bars[j][1] - 1) * 1e4)]);
  }
  for (i = VOR; i < len - H; i++) {
    if (bt[i] !== tagJetzt) { zieh(); kand = []; tagJetzt = bt[i]; }
    if (flag[i] === 3 && !sigTag[bt[i]] && !d.sperr.has(tage[bt[i]].tag) && !splitFenster(i)) kand.push(i);
  }
  zieh();
  return aus;
}

function lauf(argv) {
  var a = { teil: { k: 0, n: 1 }, n: 400, alle: false, sperrliste: false };
  for (var i = 0; i < argv.length; i++) {
    if (argv[i] === '--teil') { var p = argv[++i].split('/'); a.teil = { k: +p[0], n: +p[1] }; }
    else if (argv[i] === '--alle') a.alle = true;
    else if (argv[i] === '--sperrliste') a.sperrliste = true;
  }
  var t0 = Date.now(), alle = L.reihen(), splits = splitListe();
  var spy = ladeReihe60({ reihe: 'SPY', ordner: 'SPY', jahre: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026], schnittMs: null, abMs: null });
  var regime = regimeAus(spy.bars), kal = K.kalender();
  var wahl, name;
  if (a.sperrliste) { wahl = alle.filter(function (r) { return splits.je[r.reihe]; }); name = 'sperrliste'; }
  else { wahl = (a.alle ? alle : stichprobe(alle, a.n)).filter(function (r, q) { return q % a.teil.n === a.teil.k; }); name = (a.alle ? 'voll' : 'stichprobe') + '-teil-' + a.teil.k + '-von-' + a.teil.n; }
  var aus = { kennung: 'kapitulation-neu-2026-10-03/zaehlung/v1', saat: SAAT, art: name, begonnen: new Date(t0).toISOString(),
    archiv: { reihenAktien: alle.length, lebend: alle.filter(function (r) { return r.lebend; }).length },
    splitSaetze: splits.liste.length, splitReihenNichtImUniversum: Object.keys(splits.je).filter(function (r) { return !alle.some(function (x) { return x.reihe === r; }); }),
    reihen: [], ms: { lesen: 0, gesamt: 0 }, bytes: 0 };
  if (a.teil.k === 0) {
    /* Regime je Handelstag (exakt, keine Stichprobe): offen, wenn das Tor an mindestens einer der Stundenkerzen des Tages offen ist. */
    var offen = {}, tagBars = {};
    spy.bars.forEach(function (b, q) { var t = spy.tage[spy.barTag[q]].tag; tagBars[t] = 1; if (regime.offen(b[0])) offen[t] = 1; });
    aus.regime = { spyKerzen: spy.bars.length, spyTage: spy.tage.length, spyFehl: spy.fehl, kalenderTage: kal.tage.length,
      tage: kal.tage.map(function (t) { return offen[t] ? 1 : 0; }).join(''), ersterTag: kal.tage[0], letzterTag: kal.tage[kal.tage.length - 1] };
  }
  wahl.forEach(function (R) {
    var r = zaehleReihe(R, regime, splits);
    aus.ms.lesen += r.msLesen; aus.bytes += r.bytes; delete r.msLesen;
    aus.reihen.push(r);
  });
  aus.ms.gesamt = Date.now() - t0;
  var ziel = path.join(__dirname, 'roh'); if (!fs.existsSync(ziel)) fs.mkdirSync(ziel);
  fs.writeFileSync(path.join(ziel, name + '.json'), JSON.stringify(aus));
  console.log(name + ': ' + aus.reihen.length + ' Reihen, ' + (aus.bytes / 1e9).toFixed(2) + ' GB, lesen ' + Math.round(aus.ms.lesen / 1000) + ' s, gesamt ' + Math.round(aus.ms.gesamt / 1000) + ' s, Signale V1 ' +
    aus.reihen.reduce(function (s, r) { return s + r.sig.length; }, 0) + ', Klinke ' + aus.reihen.reduce(function (s, r) { return s + r.klinke; }, 0));
}

module.exports = { stichprobe: stichprobe, verdichte60: verdichte60, regimeAus: regimeAus, ladeReihe60: ladeReihe60, zaehleReihe: zaehleReihe, splitListe: splitListe, SAAT: SAAT, VOR: VOR, H: H };
if (require.main === module) lauf(process.argv.slice(2));
