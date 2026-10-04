'use strict';
/* Generalprobe 23.11.2026 - Harness: die erste Umschichtung des Momentum-Buchs am Montag 23.11.2026 zur
 * Eroeffnung in New York (Winterzeit UTC-5), mit dem Code von HEAD, Takt fuer Takt alle 5 Minuten.
 *
 * Treibt mfdepot.js (MFDepot.takt()) und mittelfrist.js (echter Lader MF.ladeUniversum) in vm-Sandboxen mit
 * EINER gemeinsamen festen Uhr (lib.js uhr(); beide Sandboxen lesen dasselbe Uhr-Objekt, auch fuer Date.now()).
 * Die Kurs-Attrappe antwortet auf Ebene des Netzabrufs (api.fetchText): sie baut Yahoo-Chart-JSON zeitrichtig
 * und laeuft durch den ECHTEN Lader kurse.js (baueLader/zerlege) - Fensterfilter, Verwerfen, offenRoh, mitRoh,
 * Ereignisse gehen damit wirklich durch den App-Code. Gemessen am Code (04.10.2026), was die App uebergibt:
 *   mittelfrist.js holeTage : Kurse.hole(sym, { von: 0, bis: Date.now(), interval: '1d', bereinigt: true, mitRoh: true, ereignisse: true })
 *   mfdepot.js eroeffnung   : Kurse.hole(sym, { von: nyZeit(heute, 0, 0), bis: Date.now(), interval: '1d', bereinigt: false, offenRoh: true })
 * Reines Node, keine Kursdaten, kein Netz, keine Schluessel. Alles Simulation mit virtuellem Kapital.
 *
 * Aufruf (aus der Repo-Wurzel):
 *   node pruefberichte/generalprobe-2311/harness.js a          ein Szenario (a b1 b2 c1 c2 d d2 e e30 f g g1b dst)
 *   node pruefberichte/generalprobe-2311/harness.js alle       alle, vier Prozesse gleichzeitig
 * Schreibt szenario-<kennung>.md und .json in diesen Ordner. */

/* lib.js benutzt fs und path ohne eigenes require (Fund H-lib-require): als Globale vorbelegen, bevor sie geladen wird. */
global.fs = require('fs');
global.path = require('path');
var cp = require('child_process');
var vm = require('vm');
var L = require('./lib.js');
var MH = L.MH, Ms = L.Ms, KK = L.KK, TAG = L.TAG, WURZEL = L.WURZEL;
var ORDNER = __dirname;

/* ================= kleine Hilfen ================= */
function nyStr(ms) { return MH.nyTag(ms) + ' ' + MH.nyUhr(ms); }
function r4(x) { return Math.round(x * 1e4) / 1e4; }
function r2(x) { return Math.round(x * 100) / 100; }
function kopie(x) { return JSON.parse(JSON.stringify(x)); }
function hashRnd(a, b) { var x = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return (x - Math.floor(x)) * 2 - 1; }
function handelstage(vonTag, bisTag, frei) {
  var aus = [];
  for (var t = vonTag; t <= bisTag; t = MH.tagPlus(t, 1)) if (MH.istWerktag(t) && (frei || []).indexOf(t) < 0) aus.push(t);
  return aus;
}
var T_FR0 = MH.nyZeit('2026-11-20', 0, 0);
var T_DI_ENDE = MH.nyZeit('2026-11-24', 23, 55);
function minuten(n) { return n * 60000; }

/* ================= die Welt: Kunstkurse in Splitbasis P (heutige Stueckelung) ================= */
/** opt: feiertage [Tag], ende {SYM: 'JJJJ-MM-TT' letzter Balken}. Die Ereignisse setzt der Aufrufer in welt.ereignisse
 *  (nach der Rollenbestimmung): { SYM: { splits: [{tag, z, n}], divs: [{tag, betrag}] } }, Betrag in P-Einheiten. */
function baueWelt(opt) {
  opt = opt || {};
  var frei = opt.feiertage || [];
  var tage = handelstage('2025-04-01', '2026-11-24', frei);
  var stamps = tage.map(function (d) { return MH.nyZeit(d, 9, 30); });
  var schl = tage.map(function (d) { return MH.nyZeit(d, 16, 0); });
  var tageIdx = {}; tage.forEach(function (d, j) { tageIdx[d] = j; });
  var namen = L.universum();
  var basis = L.kunstUniversum(stamps, namen);
  var serie = {};
  var iFr = tageIdx['2026-11-20'];
  /* Sonderfaelle der REGEL (die staerksten Namen): zwei mit zu wenig Umsatz, einer mit 253, einer mit 252 Balken am Stichtag */
  var sonder = {};
  namen.forEach(function (s, k) {
    var rang = (k * 37) % namen.length;
    if (rang === 192 || rang === 191) sonder[s] = 'umsatz';
    if (rang === 190) sonder[s] = 'kurz253';
    if (rang === 189) sonder[s] = 'kurz252';
  });
  if (opt.ohneSonder) sonder = {};
  function baue(sym, k, rows, o) {
    var bars = [], vorC = null;
    for (var j = 0; j < rows.length; j++) {
      var jj = o.j0 + j, c = r4(rows[j][1] * (1 + 0.0005 * hashRnd(k, jj)));
      var op = vorC == null ? c : r4(vorC * (1 + 0.008 * hashRnd(k + 500, jj)));
      var h = r4(Math.max(op, c) * (1 + 0.004 * Math.abs(hashRnd(k + 900, jj))));
      var l = r4(Math.min(op, c) * (1 - 0.004 * Math.abs(hashRnd(k + 1300, jj))));
      bars.push({ j: jj, o: op, h: h, l: l, c: c, v: o.v || rows[j][2] });
      vorC = c;
    }
    return bars;
  }
  namen.forEach(function (s, k) {
    var rows = basis[s], j0 = 0, v = null, art = sonder[s];
    if (art === 'umsatz') v = 3e5;
    if (art === 'kurz253') { j0 = iFr - 252; rows = rows.slice(j0); }
    if (art === 'kurz252') { j0 = iFr - 251; rows = rows.slice(j0); }
    var bars = baue(s, k, rows, { j0: j0, v: v });
    if (opt.ende && opt.ende[s]) bars = bars.filter(function (b) { return tage[b.j] <= opt.ende[s]; });
    serie[s] = { sym: s, k: k, bars: bars, sonder: art || null };
  });
  var spyRows = tage.map(function (t, j) { return [stamps[j], 400 + j * 0.1, 8e7, 400 + j * 0.1]; });
  serie.SPY = { sym: 'SPY', k: 999, bars: baue('SPY', 999, spyRows, { j0: 0 }), sonder: null };
  var welt = { tage: tage, stamps: stamps, schl: schl, tageIdx: tageIdx, namen: namen, serie: serie, ereignisse: {},
    T: 0, ausfall: opt.ausfall || [], zaehler: { gesamt: 0, fehl: 0, spy: 0 }, abrufe: [] };

  function exStempel(tag) { return tageIdx[tag] != null ? stamps[tageIdx[tag]] : MH.nyZeit(tag, 9, 30); }
  welt.exStempel = exStempel;
  /** Faktor der zum Zeitpunkt T noch UNBEKANNTEN Splits (Ex-Tag nach T): vorher gehandelte Kurse stehen mit diesem Faktor hoeher. */
  welt.ruUnbekannt = function (sym, T) {
    var r = 1;
    ((welt.ereignisse[sym] || {}).splits || []).forEach(function (sp) { if (exStempel(sp.tag) > T) r *= sp.z / sp.n; });
    return r;
  };
  /** Das Verhaeltnis der Splits mit Ex-Tag bis einschliesslich tag (z/n je Split), fuer Stueck in P-Einheiten. */
  welt.splitBis = function (sym, tag) {
    var r = 1;
    ((welt.ereignisse[sym] || {}).splits || []).forEach(function (sp) { if (sp.tag <= tag) r *= sp.z / sp.n; });
    return r;
  };
  /** Die Balken des Werts, wie Yahoo sie zum Zeitpunkt T meldet (nur Balken mit Stempel <= T; der heutige laeuft bis 16:00). */
  welt.gesehen = function (sym, T) {
    var s = serie[sym]; if (!s) return null;
    var ev = welt.ereignisse[sym] || {}, rU = welt.ruUnbekannt(sym, T), rows = [];
    for (var q = 0; q < s.bars.length; q++) {
      var b = s.bars[q]; if (stamps[b.j] > T) break;
      var t0 = stamps[b.j], fertig = T >= schl[b.j], o = b.o, h = b.h, l = b.l, c = b.c, v = b.v;
      if (!fertig) {
        var f = (T - t0) / (schl[b.j] - t0);
        c = r4(o + (b.c - o) * f + o * 0.004 * Math.sin(f * 17 + s.k) + o * 0.0007);
        h = r4(Math.max(o, c, b.o * (1 + 0.001))); l = r4(Math.min(o, c, b.o * (1 - 0.001)));
        v = Math.round(b.v * f);
      }
      rows.push({ t: t0, o: r4(o * rU), h: r4(h * rU), l: r4(l * rU), c: r4(c * rU), v: Math.round(v / rU), adjF: 1, laufend: !fertig, j: b.j });
    }
    var divs = [], splits = [];
    (ev.divs || []).forEach(function (d) {
      var ex = exStempel(d.tag); if (ex > T) return;
      var vor = null; rows.forEach(function (r) { if (r.t < ex) vor = r; });
      var amt = d.betrag * rU;
      if (vor) { var fac = 1 - amt / vor.c; rows.forEach(function (r) { if (r.t < ex) r.adjF *= fac; }); }
      divs.push([ex, amt]);
    });
    (ev.splits || []).forEach(function (sp) { var ex = exStempel(sp.tag); if (ex <= T) splits.push([ex, sp.z, sp.n]); });
    return { rows: rows, divs: divs, splits: splits };
  };
  /** Tagesbalken in P-Basis (endgueltige Werte), oder null. */
  welt.bar = function (sym, tag) {
    var s = serie[sym], j = tageIdx[tag]; if (!s || j == null) return null;
    for (var q = 0; q < s.bars.length; q++) if (s.bars[q].j === j) return s.bars[q];
    return null;
  };
  /** Juengster Balken bis einschliesslich tag (Bewertung: nie der Einstand, sondern der letzte Schluss). */
  welt.barBis = function (sym, tag) {
    var s = serie[sym], jj = tageIdx[tag], best = null; if (!s) return null;
    for (var q = 0; q < s.bars.length; q++) if (s.bars[q].j <= jj) best = s.bars[q];
    return best;
  };
  /** Rohmap in P-Basis bis einschliesslich Stichtag: [[t, schluss, stueck]] (Soll-Seite, REGEL: bSchluss, umsatz/bSchluss). */
  welt.rohP = function (bisTag, ohneSpy) {
    var aus = {}, jMax = tageIdx[bisTag];
    Object.keys(serie).forEach(function (s) {
      if (s === 'SPY' && ohneSpy !== false) return;
      aus[s] = serie[s].bars.filter(function (b) { return b.j <= jMax; }).map(function (b) { return [stamps[b.j], b.c, b.v]; });
    });
    return aus;
  };
  function ausfallArt(sym, T) {
    for (var i = 0; i < welt.ausfall.length; i++) {
      var a = welt.ausfall[i];
      if (T >= a.von && T < a.bis && (!a.syms || a.syms[sym])) return a.art;
    }
    return null;
  }
  /** Der Netzabruf, den die App ueber api.fetchText macht ({ ok, status, body }). */
  welt.fetchText = async function (u) {
    var m = /\/chart\/([^?]+)\?(.*)$/.exec(u);
    if (!m) return { ok: false, status: 404, body: '' };
    var sym = decodeURIComponent(m[1]), q = {};
    m[2].split('&').forEach(function (kv) { var p = kv.split('='); q[p[0]] = decodeURIComponent(p[1] || ''); });
    welt.zaehler.gesamt++; if (sym === 'SPY') welt.zaehler.spy++;
    var art = ausfallArt(sym, welt.T);
    if (art) welt.zaehler.fehl++;
    if (art === 'wurf') throw new Error('Netz weg');
    if (art === 'null') return null;
    if (art === '500') return { ok: false, status: 500, body: '' };
    if (art === '429') return { ok: false, status: 429, body: '' };
    if (art === 'leer') return { ok: true, status: 200, body: '{"chart":{"result":null,"error":null}}' };
    var g = welt.gesehen(sym, welt.T);
    if (!g) return { ok: false, status: 404, body: '{"chart":{"result":null,"error":{"code":"Not Found"}}}' };
    var p1 = q.period1 != null ? Number(q.period1) * 1000 : -Infinity, p2 = q.period2 != null ? Number(q.period2) * 1000 : Infinity;
    var rows = g.rows.filter(function (r) { return r.t >= p1 && r.t <= p2; });
    var res = { meta: { symbol: sym, regularMarketPrice: rows.length ? rows[rows.length - 1].c : null },
      timestamp: rows.map(function (r) { return r.t / 1000; }),
      indicators: { quote: [{ open: rows.map(function (r) { return r.o; }), high: rows.map(function (r) { return r.h; }),
        low: rows.map(function (r) { return r.l; }), close: rows.map(function (r) { return r.c; }), volume: rows.map(function (r) { return r.v; }) }],
        adjclose: [{ adjclose: rows.map(function (r) { return r4(r.c * r.adjF); }) }] } };
    if (q.events) {
      var ev = {};
      if (g.divs.length) { ev.dividends = {}; g.divs.forEach(function (d) { ev.dividends[d[0] / 1000] = { amount: d[1], date: d[0] / 1000 }; }); }
      if (g.splits.length) { ev.splits = {}; g.splits.forEach(function (s2) { ev.splits[s2[0] / 1000] = { date: s2[0] / 1000, numerator: s2[1], denominator: s2[2], splitRatio: s2[1] + ':' + s2[2] }; }); }
      res.events = ev;
    }
    return { ok: true, status: 200, body: JSON.stringify({ chart: { result: [res], error: null } }) };
  };
  return welt;
}

/* ================= Rangfolge von Hand (REGEL §1.2), unabhaengig von MFHandel.momentumZiel ================= */
function handRang(rohMap, nowMs) {
  var punkte = [], idx = 0;
  Object.keys(rohMap).forEach(function (sym) {
    var r = rohMap[sym];
    idx++;
    if (!r || r.length < 253) return;                                  // Mindestlaenge 231 + 21 + 1
    if (nowMs - r[r.length - 1][0] > 7 * TAG) return;                  // veraltet
    var i = r.length - 1, a = r[i - 252][1], m = r[i - 21][1];
    if (!(a > 0) || !(m > 0)) return;
    var ums = []; for (var q = i - 19; q <= i; q++) ums.push(r[q][1] * r[q][2]);
    ums.sort(function (x, y) { return x - y; });
    if (!(ums[ums.length >> 1] >= 1e8)) return;                        // Korb: Median (oberer) >= 100 Mio
    punkte.push({ sym: sym, st: m / a - 1, n: idx });
  });
  punkte.sort(function (x, y) { return y.st - x.st || x.n - y.n; });
  var n = Math.max(5, Math.round(punkte.length * 0.1));
  return { ziel: punkte.slice(0, n).map(function (p) { return p.sym; }), rang: punkte.map(function (p) { return p.sym; }), zulaessig: punkte.length, zielzahl: n,
    zuWenig: punkte.length < 100 };
}
/** Plan und Ausfuehrung ganz von Hand (REGEL §1.2/§1.3, Regel K 0,05). Mutiert nichts; Rueckgabe das Buch nachher und die Orders. */
function handAusfuehren(ziel, buch, preise, kl, kosten) {
  var k = kosten / 10000, cash = buch.cash, pos = buch.positionen.map(function (p) { return { sym: p.sym, stueck: p.stueck, einstand: p.einstand }; });
  var wert = cash; pos.forEach(function (p) { if (preise[p.sym] > 0) wert += p.stueck * preise[p.sym]; });
  var budget = wert / ziel.length, orders = [], bleibt = [], neu = [];
  var kleinst = {};
  pos.forEach(function (p) {
    var kurs = preise[p.sym];
    if (!(kurs > 0)) { bleibt.push(p); return; }
    var klein = kl > 0 && p.stueck * kurs < kl * budget;
    if (klein) kleinst[p.sym] = true;
    if (ziel.indexOf(p.sym) >= 0 && !klein) { bleibt.push(p); return; }
    cash += p.stueck * kurs * (1 - k);
    orders.push({ art: 'verkauf', sym: p.sym, stueck: p.stueck, kurs: kurs });
  });
  ziel.forEach(function (s) {
    var gehalten = bleibt.some(function (p) { return p.sym === s; });
    if (gehalten || !(preise[s] > 0)) return;
    var kurs = preise[s], st = r4(budget / kurs), kost = st * kurs * (1 + k);
    if (!(st > 0) || kost > cash) { st = Math.max(0, Math.floor(cash / (kurs * (1 + k)) * 1e4) / 1e4); kost = st * kurs * (1 + k); if (!(st > 0)) return; }
    if (kl > 0 && st * kurs < kl * budget) return;
    cash -= kost; neu.push({ sym: s, stueck: st, einstand: kurs * (1 + k) });
    orders.push({ art: 'kauf', sym: s, stueck: st, kurs: kurs });
  });
  return { cash: cash, positionen: bleibt.concat(neu), orders: orders, budget: budget, depotwert: wert };
}

/* ================= Sandboxen mit gemeinsamer Uhr ================= */
function sandboxGem(dateien, win, UHR) {
  var doc = { readyState: 'complete', addEventListener: function () { }, getElementById: function (id) { return (win.__el && win.__el[id]) || null; } };
  var ctx = {
    window: win, document: doc, console: console, __Uhr: UHR,
    setTimeout: function (f, ms) { if (ms >= 1000) return 0; setImmediate(f); return 0; },
    setInterval: function () { return 0; }
  };
  win.document = doc;
  vm.createContext(ctx);
  dateien.forEach(function (d) {
    vm.runInContext('(function (Date) {' + fs.readFileSync(path.join(WURZEL, d), 'utf8') + '\n})(__Uhr);', ctx, { filename: d });
  });
  return win;
}

/* ================= Rollen und Buch ================= */
function rollenBestimmen(welt, stichtag) {
  var roh = welt.rohP(stichtag), nowMs = welt.stamps[welt.tageIdx[stichtag]];
  var h = handRang(roh, nowMs), m = MH.momentumZiel(roh, { nowMs: nowMs });
  var ziel = h.ziel;
  var kept = ziel.filter(function (s, i) { return i % 2 === 0; });          // 10 bleiben
  var keptN = kept.filter(function (s) { return !welt.serie[s].sonder; });
  var neu = ziel.filter(function (s, i) { return i % 2 === 1; });           // 9 werden gekauft
  var sold = h.rang.slice(19, 28);                                          // 9 gehalten, nicht im Ziel -> verkauft
  return { ziel: ziel, rang: h.rang, kept: kept, keptN: keptN, neu: neu, sold: sold, hand: h, mh: m,
    gleichMH: JSON.stringify(m.ziel) === JSON.stringify(h.ziel) };
}
function e0Tag(opt, welt) {
  var faellig = opt.faelligTag || '2026-11-23';
  var kal = handelstage('2025-04-01', '2026-11-25', (opt.feiertage || []).filter(function (t) { return t !== faellig; }));
  return kal[kal.indexOf(faellig) - 63];
}
function buchBauen(welt, rollen, e0, tCheck) {
  var syms = rollen.kept.concat(rollen.sold), k = 0.002, pos = [], cash = 100000, trades = [];
  var tOpen = welt.stamps[welt.tageIdx[e0]], seit = tOpen + 6 * 60000;
  syms.forEach(function (s) {
    var b = welt.bar(s, e0), rU = welt.ruUnbekannt(s, tCheck), kurs = b.o * rU, st = Math.floor((100000 / 19) / (kurs * (1 + k)) * 1e4) / 1e4;
    cash -= st * kurs * (1 + k);
    pos.push({ sym: s, stueck: st, einstand: kurs * (1 + k), seit: seit, kursT: tOpen });
    trades.push({ t: seit, sym: s, art: 'kauf', stueck: st, kurs: kurs });
  });
  var b = L.buchMit(pos, seit);
  b.cash = cash; b.trades = trades; b.letzteAusfuehrungTag = e0; b.angelegt = seit - 30 * TAG; b.start = 100000;
  return b;
}

/* ================= der Lauf ================= */
/** opt: kennung, feiertage, ende, ausfall, ereignisFn(rollen, welt), start (ms, erster Takt), ende (ms), takte (Liste ms, statt Raster),
 *  uhrSprung [{ab, offset}] (Systemuhr minus Weltzeit), faelligTag, bereitT (Zeitpunkt des Vorab-Ladens), nurBis (Abbruch der Takte). */
async function lauf(opt) {
  opt = opt || {};
  var welt = baueWelt({ feiertage: opt.feiertage, ende: opt.endeReihen, ausfall: opt.ausfall, ohneSonder: opt.ohneSonder });
  var stichtag = opt.stichtag || '2026-11-20';
  var rollen = rollenBestimmen(welt, stichtag);
  welt.ereignisse = opt.ereignisFn ? opt.ereignisFn(rollen, welt) : {};
  var faelligTag = opt.faelligTag || '2026-11-23';
  var e0 = e0Tag(opt, welt);
  var UHR = L.uhr(0), st = L.speicher({});
  var sprung = (opt.uhrSprung || []).slice().sort(function (a, b) { return a.ab - b.ab; });
  function versatz(T) { var o = 0; sprung.forEach(function (s) { if (T >= s.ab) o = s.offset; }); return o; }
  function zeit(T) { welt.T = T; UHR.jetzt = T + versatz(T); }
  var warte = async function () { };
  var kurse = KK.baueLader({ fetchText: welt.fetchText }, warte);
  kurse.ereignisseAb = KK.ereignisseAb;
  var mf = sandboxGem(['mittelfrist.js'], { U: L.U_ATTRAPPE, Momentum: require(path.join(WURZEL, 'momentum.js')), Liquide: require(path.join(WURZEL, 'liquide.js')),
    MFHandel: MH, api: st.api, Kurse: kurse }, UHR);
  var pending = [];
  var MFgem = { tagesdatenLesen: mf.MF.tagesdatenLesen, ladenAnnehmen: mf.MF.ladenAnnehmen,
    ladeUniversum: function () { var p = mf.MF.ladeUniversum(); pending.push(p); return p; } };
  async function drain() { while (pending.length) { var p = pending.shift(); try { await p; } catch (e) { } } }

  /* Vorab-Laden wie am Donnerstag nach Schluss: der echte Lader schreibt den Bestand (Erststart-Pfad) */
  var bereitT = opt.bereitT || MH.nyZeit('2026-11-19', 16, 20);
  zeit(bereitT);
  L.getStatus().length = 0;
  await mf.MF.ladeUniversum();
  var bestand0 = L.symboleImBestand(st);
  function marktSchreiben(T) {
    var g = welt.gesehen('SPY', T), fertig = g.rows.filter(function (r) { return T >= welt.schl[r.j] + 15 * 60000; });
    st.daten.drift_markt = { at: T, reihe: fertig.map(function (r) { return [r.t, r.c]; }), roh: fertig.map(function (r) { return [r.t, r.c]; }) };
  }
  marktSchreiben(bereitT);
  var buch0 = buchBauen(welt, rollen, e0, bereitT);
  /* Verlauf bis Donnerstag (alte Tagespunkte): Wert zu den Schluessen, Einheiten wie die App sie am Donnerstag sah */
  var verlauf0 = [];
  ['2026-11-16', '2026-11-17', '2026-11-18', '2026-11-19'].forEach(function (tag) {
    var w = buch0.cash; buch0.positionen.forEach(function (p) { w += p.stueck * welt.barBis(p.sym, tag).c * welt.ruUnbekannt(p.sym, bereitT); });
    var sb = welt.bar('SPY', tag), t = welt.stamps[welt.tageIdx[tag]];
    verlauf0.push({ t: t, tag: tag, momentum: r2(w), drift: null, spy: sb.c, spyT: t, buchT: t, startM: 100000, startD: null });
  });
  var d = { momentumAn: true, mfBuch: kopie(buch0), mfVerlauf: kopie(verlauf0), tuneLog: [] };
  var karte = { innerHTML: '' }, detail = { innerHTML: '' };
  var dep = sandboxGem(['mfdepot.js'], { U: L.U_ATTRAPPE, api: st.api, MF: MFgem, MFHandel: MH, Massstab: Ms, Boerse: require(path.join(WURZEL, 'boerse.js')),
    __el: { buchMomentumKopf: karte, mfdMomentum: detail }, Kurse: kurse,
    __D: function () { return d; }, __save: function () { return Promise.resolve({ ok: true }); } }, UHR);

  /* Takte */
  var ab = opt.start || T_FR0, bis = opt.ende || T_DI_ENDE, takte = opt.takte;
  if (!takte) { takte = []; for (var T = ab; T <= bis; T += minuten(5)) takte.push(T); }
  var log = [], tradeLog = [], statusSet = {}, fehlerTakte = [], negCash = [], karteFehler = [], punktLog = [], wertSpur = [];
  var nTune = 0, nTrades = d.mfBuch.trades.length, nVerlauf = d.mfVerlauf.length, nPos = d.mfBuch.positionen.length, nMass = 0;
  var abrufe0 = welt.zaehler.gesamt;
  for (var ti = 0; ti < takte.length; ti++) {
    var Tw = takte[ti];
    zeit(Tw); marktSchreiben(Tw);
    var vorAbrufe = welt.zaehler.gesamt, fehlerText = null;
    try { await L.taktLauf(dep); } catch (e) { fehlerText = String(e.message || e); }
    await drain();
    var stat = L.getStatus().slice();
    var eintrag = { T: nyStr(Tw), uhr: nyStr(UHR.jetzt), was: [], abrufe: welt.zaehler.gesamt - vorAbrufe };
    stat.forEach(function (s) { var kurz = s.replace(/\d{1,2}\.\d{1,2}\.\d{4}(, \d{1,2}:\d{2}:\d{2})?/g, 'TT').slice(0, 220); statusSet[kurz] = (statusSet[kurz] || 0) + 1; });
    if (fehlerText || stat.some(function (s) { return /Fehler/.test(s); })) { fehlerTakte.push(nyStr(Tw) + ': ' + (fehlerText || stat.filter(function (s) { return /Fehler/.test(s); }).join(' | '))); eintrag.was.push('FEHLER'); }
    var m = d.mfBuch;
    if (d.tuneLog.length !== nTune) {
      d.tuneLog.slice(0, d.tuneLog.length - nTune).reverse().forEach(function (z) { eintrag.was.push('Journal ' + z.id.replace(/-\d+$/, '') + ': ' + z.applied.join(' | ')); });
      nTune = d.tuneLog.length;
    }
    if (m.trades.length !== nTrades) {
      m.trades.slice(nTrades).forEach(function (tr) { tradeLog.push({ Tw: Tw, T: nyStr(Tw), uhr: nyStr(UHR.jetzt), trade: kopie(tr) }); });
      eintrag.was.push((m.trades.length - nTrades) + ' Trades'); nTrades = m.trades.length;
    }
    if (d.mfVerlauf.length !== nVerlauf) {
      d.mfVerlauf.slice(nVerlauf).forEach(function (p) { punktLog.push({ Tw: Tw, T: nyStr(Tw), punkt: kopie(p) }); eintrag.was.push('Punkt ' + p.tag + ' ' + p.momentum); });
      nVerlauf = d.mfVerlauf.length;
    }
    if (m.positionen.length !== nPos) { eintrag.was.push('Positionen ' + nPos + ' -> ' + m.positionen.length); nPos = m.positionen.length; }
    var nm = (m.massnahmen || []).length;
    if (nm !== nMass) { (m.massnahmen || []).slice(nMass).forEach(function (x) { eintrag.was.push('Massnahme ' + x.art + ' ' + x.sym + (x.art === 'div' ? ' ' + r2(x.summe) : ' ' + x.zaehler + ':' + x.nenner)); }); nMass = nm; }
    if (m.cash < 0) { negCash.push(nyStr(Tw) + ' cash ' + m.cash); eintrag.was.push('CASH<0'); }
    if (/Fehler|NaN|undefined|Infinity/.test(karte.innerHTML)) { karteFehler.push(nyStr(Tw)); eintrag.was.push('KARTE-FEHLER'); }
    if (m.offen && !(eintrag.was.length)) eintrag.was.push('offen');
    if (eintrag.was.length) log.push(eintrag);
  }
  var ctx = { opt: opt, welt: welt, rollen: rollen, e0: e0, faelligTag: faelligTag, d: d, buch0: buch0, verlauf0: verlauf0, bestand0: bestand0, karte: karte,
    log: log, tradeLog: tradeLog, statusSet: statusSet, fehlerTakte: fehlerTakte, negCash: negCash, karteFehler: karteFehler, punktLog: punktLog,
    takteAnzahl: takte.length, abrufe: welt.zaehler.gesamt - abrufe0, bereitT: bereitT, UHR: UHR };
  return ctx;
}

/* ================= das Soll nach REGEL ================= */
function sollRechnen(ctx) {
  var welt = ctx.welt, o = ctx.opt;
  var faelligTag = ctx.faelligTag;
  /* Ausfuehrungstag: der erste Handelstag der Welt ab dem faelligen Tag; Stichtag: der Handelstag davor */
  var ausfTag = welt.tage.filter(function (t) { return t >= faelligTag; })[0];
  var iA = welt.tageIdx[ausfTag], stichtag = welt.tage[iA - 1];
  var tA = welt.stamps[iA];
  var roh = welt.rohP(stichtag), nowMs = welt.stamps[iA - 1];
  var mh = MH.momentumZiel(roh, { nowMs: nowMs }), hr = handRang(roh, nowMs);
  /* Buch in P-Einheiten (REGEL: Panelpreise sind bereinigt, Stueck wachsen mit dem Split) */
  var pos = ctx.buch0.positionen.map(function (p) { return { sym: p.sym, stueck: p.stueck * welt.splitBis(p.sym, ausfTag), einstand: p.einstand / welt.splitBis(p.sym, ausfTag) }; });
  var cash = ctx.buch0.cash, reihenende = [];
  /* REGEL §1.4: am ersten Handelstag nach der letzten Zeile einer gehaltenen Reihe: ausgebucht zum letzten Schluss, ohne Kosten */
  pos = pos.filter(function (p) {
    var s = welt.serie[p.sym], letzte = s.bars[s.bars.length - 1];
    if (letzte.j < iA - 1) { cash += p.stueck * letzte.c; reihenende.push(p.sym + ' (letzter Schluss ' + welt.tage[letzte.j] + ' ' + letzte.c + ')'); return false; }
    return true;
  });
  var opens = {};
  Object.keys(welt.serie).forEach(function (s) { var b = welt.bar(s, ausfTag); if (b && !(ctx.opt.sollOhneKurs && ctx.opt.sollOhneKurs[s])) opens[s] = b.o; });
  var vorher = { cash: cash, positionen: pos };
  var kl = MH.buchKonfig().kleinstAnteil;
  var plan = MH.planeUmschichtung(mh.ziel, vorher, opens, { kleinstAnteil: kl });
  var nach = kopie(vorher); nach.trades = [];
  MH.fuehreAus(nach, plan, tA, 20, { kleinstAnteil: kl });
  var hand = handAusfuehren(mh.ziel, vorher, opens, kl, 20);
  var wertOpenVor = MH.bewerte(vorher, opens).wert, wertOpenNach = MH.bewerte(nach, opens).wert;
  /* Ausschuettungen mit Ex-Tag = Ausfuehrungstag: Anspruch hat, wer die Nacht davor hielt (auch bei Verkauf zur Eroeffnung), Gutschrift nach dem Handel */
  var divSoll = 0, divSollSold = 0;
  vorher.positionen.forEach(function (p) {
    ((welt.ereignisse[p.sym] || {}).divs || []).forEach(function (dv) {
      if (dv.tag === ausfTag) { var x = p.stueck * dv.betrag; divSoll += x; if (!nach.positionen.some(function (q) { return q.sym === p.sym; })) divSollSold += x; }
    });
  });
  var kostenSoll = wertOpenVor - wertOpenNach;
  var endCash = nach.cash + divSoll;
  return { ausfTag: ausfTag, stichtag: stichtag, tA: tA, ziel: mh.ziel, zielHand: hr.ziel, gleichMH: JSON.stringify(mh.ziel) === JSON.stringify(hr.ziel),
    zulaessig: mh.korb.zulaessig, geprueft: mh.korb.geprueft, zielzahl: mh.ziel.length, vorher: vorher, nach: nach, plan: plan, hand: hand, opens: opens,
    wertOpenVor: wertOpenVor, wertOpenNach: wertOpenNach, kosten: kostenSoll, divSoll: divSoll, divSollSold: divSollSold, endCash: endCash, reihenende: reihenende};
}

/* ================= Auswertung ================= */
function posKarte(buch) { var m = {}; buch.positionen.forEach(function (p) { m[p.sym] = (m[p.sym] || 0) + p.stueck; }); return m; }
function auswerten(ctx) {
  var welt = ctx.welt, d = ctx.d, soll = sollRechnen(ctx), aus = { abw: [], pruef: [] };
  function abw(id, text) { aus.abw.push({ id: id, text: text }); }
  function ok(text) { aus.pruef.push(text); }
  var rebal = d.tuneLog.filter(function (z) { return /^mfrebal-/.test(z.id); });
  aus.rebal = rebal.map(function (z) { return { id: z.id, at: nyStr(z.at), quelle: z.quelle, applied: z.applied, txt: z.txt }; });
  aus.anzahlRebal = rebal.length;
  aus.sollAusfuehrung = { tag: soll.ausfTag, stichtag: soll.stichtag };
  aus.tradeLog = ctx.tradeLog.map(function (x) { return { T: x.T, uhr: x.uhr, t: x.trade.t, sym: x.trade.sym, art: x.trade.art, stueck: x.trade.stueck, kurs: x.trade.kurs, pnl: x.trade.pnl }; });

  /* 1 genau einmal */
  var erwartetRebal = 1;
  if (rebal.length !== erwartetRebal) abw('anzahl-rebal', 'Eintraege mfrebal-* im tuneLog: ' + rebal.length + ' (Soll ' + erwartetRebal + ')');
  else ok('genau ein Eintrag mfrebal-* im tuneLog (um ' + rebal.map(function (z) { return nyStr(z.at); }).join(', ') + ' Uhrzeit der App-Uhr)');
  /* 2 Trades je Position */
  var handel = ctx.tradeLog.filter(function (x) { return x.trade.art === 'kauf' || x.trade.art === 'verkauf'; });
  var jeSym = {}; handel.forEach(function (x) { jeSym[x.trade.sym] = (jeSym[x.trade.sym] || 0) + 1; });
  var mehrfach = Object.keys(jeSym).filter(function (s) { return jeSym[s] > 1; });
  aus.tradesJeSym = jeSym;
  if (mehrfach.length) abw('doppelte-trades', 'mehr als ein Trade je Wert nach dem Start: ' + mehrfach.map(function (s) { return s + ' x' + jeSym[s]; }).join(', '));
  else ok('kein Wert mit mehr als einem Trade (' + Object.keys(jeSym).length + ' Werte gehandelt, ' + handel.length + ' Trades)');
  /* 3 Kurse je Trade */
  var kursKlassen = {}, kursAbw = [];
  handel.forEach(function (x) {
    var tr = x.trade, Tw = x.Tw, rU = welt.ruUnbekannt(tr.sym, Tw), tag = MH.nyTag(Tw);
    var b = welt.bar(tr.sym, tag), g = welt.gesehen(tr.sym, Tw), lauf = g.rows[g.rows.length - 1];
    var fr = welt.bar(tr.sym, soll.stichtag);
    var iT = welt.tageIdx[tag], bN = welt.serie[tr.sym].bars.filter(function (q) { return q.j === iT + 1; })[0];
    function gl(a) { return a != null && Math.abs(a - tr.kurs) < 1e-9 * Math.max(1, Math.abs(a)); }
    var klasse = 'sonstiger';
    if (b && gl(b.o * rU)) klasse = 'Eroeffnung des Tages ' + tag;
    else if (b && gl(b.c * rU)) klasse = 'SCHLUSS des Tages';
    else if (lauf && lauf.laufend && gl(lauf.c)) klasse = 'LAUFENDER KURS';
    else if (bN && gl(bN.o * rU)) klasse = 'SPAETERER KURS (naechste Eroeffnung)';
    else if (fr && gl(fr.c * rU)) klasse = 'Schluss des Stichtags';
    kursKlassen[klasse] = (kursKlassen[klasse] || 0) + 1;
    if (klasse !== 'Eroeffnung des Tages ' + soll.ausfTag) kursAbw.push(tr.art + ' ' + tr.sym + ' ' + tr.kurs + ' = ' + klasse);
  });
  aus.kursKlassen = kursKlassen;
  if (kursAbw.length) abw('kurs-nicht-eroeffnung', kursAbw.length + ' Trades nicht zur Eroeffnung des Ausfuehrungstags ' + soll.ausfTag + ': ' + kursAbw.slice(0, 8).join('; '));
  else if (handel.length) ok('alle ' + handel.length + ' Trades zur Eroeffnung des Ausfuehrungstags ' + soll.ausfTag + ' (nie Schluss, nie laufender Kurs, nie spaeterer Kurs)');
  /* 4 Zeit der Trades */
  var zeiten = {}; handel.forEach(function (x) { zeiten[x.T + ' (Uhr ' + x.uhr.slice(11) + ')'] = (zeiten[x.T + ' (Uhr ' + x.uhr.slice(11) + ')'] || 0) + 1; });
  aus.handelZeiten = zeiten;
  /* 5 Stichtag und Ausfuehrungstag in der Journalzeile */
  if (rebal[0]) {
    var mA = /Ausführungstag (\d\d\.\d\d\.\d{4})/.exec(rebal[0].txt), mS = /Stichtags (\d\d\.\d\d\.\d{4})/.exec(rebal[0].txt);
    var f = function (t) { return t.slice(8, 10) + '.' + t.slice(5, 7) + '.' + t.slice(0, 4); };
    aus.journal = { ausfuehrungstag: mA && mA[1], stichtag: mS && mS[1] };
    if (!mS || mS[1] !== f(soll.stichtag)) abw('stichtag', 'Journalzeile nennt Stichtag ' + (mS && mS[1]) + ', Soll ' + f(soll.stichtag));
    else ok('Journalzeile: Stichtag ' + mS[1] + ' (Soll ' + f(soll.stichtag) + ')');
    if (!mA || mA[1] !== f(soll.ausfTag)) abw('ausfuehrungstag', 'Journalzeile nennt Ausfuehrungstag ' + (mA && mA[1]) + ', Soll ' + f(soll.ausfTag));
  }
  /* 6 Ziele: Hand gegen MFHandel gegen App (korbVerlauf, Positionen) */
  if (!soll.gleichMH) abw('ziel-hand-vs-mh', 'Rangfolge von Hand und MFHandel.momentumZiel weichen ab (Soll-Seite selbst unsicher)');
  var kv = d.mfBuch.korbVerlauf || [], lkv = kv[kv.length - 1];
  aus.korb = { sollZulaessig: soll.zulaessig, sollGeprueft: soll.geprueft, sollZielzahl: soll.zielzahl, app: lkv || null };
  if (lkv && (lkv.zulaessig !== soll.zulaessig || lkv.ziel !== soll.zielzahl)) abw('korb', 'korbVerlauf: ' + lkv.zulaessig + '/' + lkv.geprueft + ' Ziel ' + lkv.ziel + ' gegen Soll ' + soll.zulaessig + '/' + soll.geprueft + ' Ziel ' + soll.zielzahl);
  /* 7 Endbuch gegen Soll (P-Einheiten) */
  var ist = posKarte(d.mfBuch), sollM = posKarte(soll.nach);
  var diffe = [];
  Object.keys(ist).concat(Object.keys(sollM)).filter(function (s, i, a) { return a.indexOf(s) === i; }).forEach(function (s) {
    var a = ist[s] || 0, b = sollM[s] || 0;
    if (Math.abs(a - b) > 1e-3) diffe.push({ sym: s, ist: a, soll: b });
  });
  aus.endbuch = { istPositionen: Object.keys(ist).length, sollPositionen: Object.keys(sollM).length, cashIst: d.mfBuch.cash, cashSoll: soll.endCash, cashSollOhneDividenden: soll.nach.cash,
    dividendenSoll: soll.divSoll, dividendenSollVerkauft: soll.divSollSold, diffe: diffe };
  if (diffe.length) abw('endbuch-positionen', diffe.length + ' Positionen weichen vom Soll ab: ' + diffe.slice(0, 6).map(function (x) { return x.sym + ' ist ' + r4(x.ist) + ' soll ' + r4(x.soll); }).join('; '));
  else ok('Positionen und Stueckzahlen am Ende (' + Object.keys(ist).length + ') gleich dem Soll (MFHandel-Funktionen und von Hand)');
  if (Math.abs(d.mfBuch.cash - soll.endCash) > 0.02) abw('endbuch-cash', 'Bargeld am Ende ' + r2(d.mfBuch.cash) + ' gegen Soll ' + r2(soll.endCash) + ' (Differenz ' + r2(d.mfBuch.cash - soll.endCash) + ')');
  else ok('Bargeld am Ende ' + r2(d.mfBuch.cash) + ' = Soll ' + r2(soll.endCash));
  /* hand vs MH (Soll gegen sich selbst) */
  if (Math.abs(soll.hand.cash - soll.nach.cash) > 0.005) abw('soll-hand-vs-mh', 'Soll von Hand (' + r2(soll.hand.cash) + ') und per fuehreAus (' + r2(soll.nach.cash) + ') weichen ab');
  /* 8 keine verlorene Position: jede Startposition ist am Ende da oder durch Verkauf/Reihenende belegt */
  var weg = ctx.buch0.positionen.filter(function (p) { return !ist[p.sym]; }).map(function (p) { return p.sym; });
  var belegt = {}; d.mfBuch.trades.forEach(function (t) { if (t.t > ctx.buch0.positionen[0].seit && (t.art === 'verkauf' || t.art === 'reihenende')) belegt[t.sym] = true; });
  var verloren = weg.filter(function (s) { return !belegt[s]; });
  if (verloren.length) abw('verlorene-position', 'Positionen ohne Verkauf/Ausbuchung verschwunden: ' + verloren.join(', '));
  else ok('keine verlorene Position (' + weg.length + ' verkaufte/ausgebuchte, alle mit Trade belegt)');
  /* 9 Bargeld nie negativ, Karte/Status */
  if (ctx.negCash.length) abw('cash-negativ', 'Bargeld negativ: ' + ctx.negCash.slice(0, 3).join('; ')); else ok('Bargeld in keinem der ' + ctx.takteAnzahl + ' Takte negativ');
  if (ctx.fehlerTakte.length) abw('statuszeile-fehler', ctx.fehlerTakte.length + ' Takte mit "Fehler" in der Statuszeile: ' + ctx.fehlerTakte.slice(0, 3).join('; ')); else ok('keine Statuszeile mit "Fehler"');
  if (ctx.karteFehler.length) abw('karte-fehler', ctx.karteFehler.length + ' Takte mit Fehler/NaN/undefined auf der Karte: ' + ctx.karteFehler.slice(0, 3).join('; ')); else ok('Karte ohne Fehler/NaN/undefined');
  /* 10 Erhaltung Wert vor = Wert nach + Kosten, an den Eroeffnungen des Ausfuehrungstags */
  var tSeit = ctx.buch0.positionen[0].seit, neue = d.mfBuch.trades.filter(function (t) { return t.t > tSeit && (t.art === 'kauf' || t.art === 'verkauf'); });
  var notional = 0; neue.forEach(function (t) { notional += t.stueck * t.kurs; });
  var kostenApp = notional * 0.002;
  aus.erhaltung = { wertSollVorOpen: r2(soll.wertOpenVor), wertSollNachOpen: r2(soll.wertOpenNach), kostenSoll: r2(soll.kosten), kostenAusTrades: r2(kostenApp), notional: r2(notional) };
  if (Math.abs(soll.kosten - kostenApp) > 0.5 && neue.length) abw('erhaltung', 'Kosten aus den Trades der App ' + r2(kostenApp) + ' gegen Soll ' + r2(soll.kosten) + ' (Wert vor ' + r2(soll.wertOpenVor) + ', nach ' + r2(soll.wertOpenNach) + ' zu Eroeffnungskursen)');
  else if (neue.length) ok('Erhaltung: Wert zu Eroeffnungskursen vor ' + r2(soll.wertOpenVor) + ' - Kosten ' + r2(soll.kosten) + ' = nach ' + r2(soll.wertOpenNach) + '; Kosten der App-Trades ' + r2(kostenApp));
  /* 11 Tagespunkte */
  var punkte = d.mfVerlauf.filter(function (p) { return p.t > ctx.verlauf0[ctx.verlauf0.length - 1].t; });
  var tage = punkte.map(function (p) { return p.tag; });
  aus.punkte = punkte.map(function (p) { return { tag: p.tag, wert: p.momentum, spy: p.spy, t: nyStr(p.t) }; });
  var erwTage = welt.tage.filter(function (t) { return t >= '2026-11-20' && t <= '2026-11-24'; });
  if (JSON.stringify(tage) !== JSON.stringify(erwTage)) abw('punkte-tage', 'Tagespunkte ' + tage.join(',') + ' gegen Soll (ein Punkt je Handelstag) ' + erwTage.join(','));
  else ok('ein Tagespunkt je abgeschlossenem Handelstag: ' + tage.join(', '));
  /* Wert der Punkte: Freitag = Buch VOR der Umschichtung zu den Schluessen; spaeter Tage = Soll-Buch nach Umschichtung zu Schluessen */
  punkte.forEach(function (p) {
    var iT = welt.tageIdx[p.tag], bW = null;
    if (p.tag < soll.ausfTag) {
      var w = ctx.buch0.cash; ctx.buch0.positionen.forEach(function (q) { w += q.stueck * welt.splitBis(q.sym, '9999-12-31') * welt.barBis(q.sym, p.tag).c; }); bW = w;
    } else {
      var w2 = soll.endCash; var nachM = posKarte(soll.nach);
      Object.keys(nachM).forEach(function (s) { w2 += nachM[s] * welt.barBis(s, p.tag).c; });
      bW = w2;
      /* Ausschuettungen die der Soll-Stand erst nach p.tag buchen wuerde: keine (alle Ex-Tage <= Ausfuehrungstag) */
    }
    var dif = p.momentum - bW;
    p.sollWert = r2(bW); p.diff = r2(dif);
    if (Math.abs(dif) > 0.05) abw('punkt-wert-' + p.tag, 'Tagespunkt ' + p.tag + ': Wert ' + p.momentum + ' gegen Soll ' + r2(bW) + ' (Differenz ' + r2(dif) + ')');
  });
  aus.punkte = punkte.map(function (p) { return { tag: p.tag, wert: p.momentum, sollWert: p.sollWert, diff: p.diff, spy: p.spy, geschrieben: null }; });
  punkte.forEach(function (p, i) { aus.punkte[i].geschrieben = (ctx.punktLog.filter(function (x) { return x.punkt.tag === p.tag; })[0] || {}).T; });
  /* Soll im Auszug */
  aus.soll = { ausfuehrungstag: soll.ausfTag, stichtag: soll.stichtag, zulaessig: soll.zulaessig, geprueft: soll.geprueft, zielzahl: soll.zielzahl, ziel: soll.ziel,
    gleichHandUndMH: soll.gleichMH, depotwertOpen: r2(soll.hand.depotwert), budget: r2(soll.hand.budget), orders: soll.hand.orders.map(function (o) { return o.art + ' ' + o.sym + ' ' + o.stueck + ' @' + o.kurs; }),
    cashNachHandel: r2(soll.nach.cash), reihenende: soll.reihenende, dividenden: r2(soll.divSoll) };
  aus.rollen = { ziel: ctx.rollen.ziel, kept: ctx.rollen.kept, neu: ctx.rollen.neu, sold: ctx.rollen.sold, handGleichMH: ctx.rollen.gleichMH };
  aus.buchVorher = { cash: r2(ctx.buch0.cash), positionen: ctx.buch0.positionen.length, wertFreitagSchluss: aus.punkte[0] ? aus.punkte[0].sollWert : null };
  aus.buchNachher = { cash: r2(d.mfBuch.cash), positionen: d.mfBuch.positionen.length, offen: d.mfBuch.offen || null };
  aus.massnahmen = (d.mfBuch.massnahmen || []).map(function (x) { return { art: x.art, sym: x.sym, t: nyStr(x.t), am: nyStr(x.am), summe: x.summe != null ? r2(x.summe) : undefined, zaehler: x.zaehler, nenner: x.nenner,
    stueckAlt: x.stueckAlt, stueckNeu: x.stueckNeu }; });
  aus.log = ctx.log;
  aus.status = ctx.statusSet;
  aus.takte = ctx.takteAnzahl; aus.abrufe = ctx.abrufe; aus.bestand0 = ctx.bestand0;
  aus.soll_ = soll;
  return aus;
}

/* ================= Szenarien ================= */
var MO_T = '2026-11-23', DI_T = '2026-11-24', FR_T = '2026-11-20';
function nz(tag, h, m, s) { return MH.nyZeit(tag, h, m) + (s || 0) * 1000; }
function symSet(liste) { var o = {}; liste.forEach(function (s) { o[s] = true; }); return o; }
var SZENARIEN = {
  a: { titel: 'alles normal', opt: function () { return {}; } },
  b1: { titel: 'Kursabruf am Montag frueh scheitert ganz (08:00-12:00 NY: Antwort null)', opt: function () {
    return { ausfall: [{ von: nz(MO_T, 8, 0), bis: nz(MO_T, 12, 0), art: 'null', syms: null }] }; } },
  b1w: { titel: 'wie b1, aber der Abruf wirft eine Ausnahme (Netz weg), 08:00-12:00 NY', opt: function () {
    return { ausfall: [{ von: nz(MO_T, 8, 0), bis: nz(MO_T, 12, 0), art: 'wurf', syms: null }] }; } },
  b2: { titel: 'Teilausfall: 45 Werte leer (HTTP 200 leer / 429-Drosselung) bis 11:00 NY', opt: function () {
    return { ausfallFn: function (rollen, welt) {
      /* 45 Werte: 3 zu verkaufende, 2 gehaltene bleibende, 4 neue Ziele, dazu 36 weitere des Universums; die Haelfte leer, die andere gedrosselt */
      var s = rollen.sold.slice(0, 3).concat(rollen.kept.slice(0, 2), rollen.neu.slice(0, 4));
      var rest = welt.namen.filter(function (x) { return s.indexOf(x) < 0 && rollen.ziel.indexOf(x) < 0 && rollen.sold.indexOf(x) < 0; });
      s = s.concat(rest.slice(0, 45 - s.length));
      var leer = {}, drossel = {}; s.forEach(function (x, i) { if (i % 2 === 0) leer[x] = true; else drossel[x] = true; });
      return [{ von: nz(MO_T, 9, 30), bis: nz(MO_T, 11, 0), art: 'leer', syms: leer }, { von: nz(MO_T, 9, 30), bis: nz(MO_T, 11, 0), art: '429', syms: drossel }];
    } }; } },
  c1: { titel: 'Split 2:1 am Freitag 20.11. in einem gehaltenen (bleibenden) Wert, Ausschuettung mit Ex-Tag Montag in einem anderen (bleibenden) und in einem verkauften', opt: function () {
    return { ereignisFn: function (r) { var e = {};
      e[r.kept[0]] = { splits: [{ tag: FR_T, z: 2, n: 1 }] };
      e[r.kept[1]] = { divs: [{ tag: MO_T, betrag: 0.5 }] };
      e[r.sold[1]] = { divs: [{ tag: MO_T, betrag: 0.5 }] };
      return e; } }; } },
  c2: { titel: 'wie c1, zusaetzlich Split 2:1 mit Ex-Tag MONTAG 23.11. in einem verkauften, einem bleibenden und einem neu zu kaufenden Wert', opt: function () {
    return { ereignisFn: function (r) { var e = {};
      e[r.kept[0]] = { splits: [{ tag: FR_T, z: 2, n: 1 }] };
      e[r.kept[1]] = { divs: [{ tag: MO_T, betrag: 0.5 }] };
      e[r.sold[1]] = { divs: [{ tag: MO_T, betrag: 0.5 }] };
      e[r.sold[0]] = { splits: [{ tag: MO_T, z: 2, n: 1 }] };
      e[r.kept[2]] = { splits: [{ tag: MO_T, z: 2, n: 1 }] };
      e[r.neu[0]] = { splits: [{ tag: MO_T, z: 2, n: 1 }] };
      return e; } }; } },
  d: { titel: 'ein gehaltener, zu verkaufender Wert hat seine letzte Kerze am Mittwoch 18.11.', opt: function () {
    return { endeFn: function (r) { var e = {}; e[r.sold[0]] = '2026-11-18'; return e; }, sollOhne: true }; } },
  d2: { titel: 'ein gehaltener, im Ziel bleibender Wert hat seine letzte Kerze am Mittwoch 18.11.', opt: function () {
    return { endeFn: function (r) { var e = {}; e[r.keptN[0]] = '2026-11-18'; return e; } }; } },
  e: { titel: 'die App startet erst Montag 15:50 NY (5-Minuten-Raster ab 15:50)', opt: function () { return { start: nz(MO_T, 15, 50) }; } },
  e30: { titel: 'wie e, aber echter Takt der App: erster Takt 12 s nach dem Start 15:50:00, dann alle 30 min', opt: function () {
    var ts = []; for (var T = nz(MO_T, 15, 50, 12); T <= T_DI_ENDE; T += minuten(30)) ts.push(T);
    return { takte: ts }; } },
  f: { titel: 'Montag 23.11. ist kein Handelstag (Feiertag, SPY ohne Balken)', opt: function () {
    return { feiertage: [MO_T] }; } },
  g: { titel: 'Systemuhr springt: um 09:50 NY -30 min (korrigiert), um 13:00 NY +2 h (Sprung vor)', opt: function () {
    return { uhrSprung: [{ ab: nz(MO_T, 9, 50), offset: -minuten(30) }, { ab: nz(MO_T, 13, 0), offset: minuten(90) }] }; } },
  g1b: { titel: 'Systemuhr wird VOR der Umschichtung um 30 min zurueckgestellt (um 09:00 NY)', opt: function () {
    return { uhrSprung: [{ ab: nz(MO_T, 9, 0), offset: -minuten(30) }] }; } }
};

function szenarioOpt(k) {
  var s = SZENARIEN[k], o = s.opt();
  var welt0 = null;
  if (o.ausfallFn || o.endeFn) {
    /* Rollen brauchen die Welt: eine Vorab-Welt nur fuer die Rangfolge (Ereignisse und Ausfaelle aendern P nicht) */
    var w = baueWelt({ feiertage: o.feiertage }), r = rollenBestimmen(w, '2026-11-20');
    if (o.ausfallFn) o.ausfall = o.ausfallFn(r, w);
    if (o.endeFn) o.endeReihen = o.endeFn(r);
  }
  o.kennung = k;
  return o;
}

/* ================= Berichte ================= */
var EINORDNUNG = {};
try { EINORDNUNG = require('./einordnung.js'); } catch (e) { EINORDNUNG = {}; }
function mdSzenario(k, aus, ctx) {
  var s = SZENARIEN[k], z = [];
  z.push('# Szenario ' + k + ' - ' + s.titel);
  z.push('');
  z.push('Generalprobe 23.11.2026, Code von HEAD, New-York-Zeit (Winter, UTC-5), ' + aus.takte + ' Takte zu 5 Minuten' + (ctx.opt.takte ? ' (hier: eigene Taktliste)' : ' von Freitag 20.11. 00:00 bis Dienstag 24.11. 23:55') + ', ' + aus.abrufe + ' Kursabrufe der Attrappe. Alles Kunstdaten, feste Uhr, virtuelles Kapital.');
  z.push('');
  z.push('## Ergebnis in einer Zeile');
  z.push('');
  z.push(aus.abw.length ? '**' + aus.abw.length + ' Abweichung(en) vom Soll:** ' + aus.abw.map(function (a) { return a.id; }).join(', ') : '**Keine Abweichung vom Soll** (REGEL.md §1.2-§1.5, Teil C).');
  z.push('');
  z.push('## Umschichtung');
  z.push('');
  z.push('- Eintraege `mfrebal-*` im tuneLog: **' + aus.anzahlRebal + '** (Soll 1)' + (aus.rebal[0] ? ', Zeit laut App-Uhr ' + aus.rebal[0].at + ' (' + aus.rebal[0].quelle + ')' : ''));
  z.push('- Ausfuehrungstag / Stichtag (Soll aus der Welt): ' + aus.sollAusfuehrung.tag + ' / ' + aus.sollAusfuehrung.stichtag + '; Journalzeile nennt ' + JSON.stringify(aus.journal || null));
  z.push('- Uhrzeit(en) der Trades (Weltzeit NY, in Klammern Systemuhr): ' + (Object.keys(aus.handelZeiten).map(function (x) { return x + ' x' + aus.handelZeiten[x]; }).join('; ') || 'keine Trades'));
  z.push('- Kurse der Trades: ' + (Object.keys(aus.kursKlassen).map(function (x) { return aus.kursKlassen[x] + 'x ' + x; }).join('; ') || 'keine'));
  z.push('- Trades je Wert: ' + (Object.keys(aus.tradesJeSym).length + ' Werte, hoechstens ' + Math.max.apply(null, [0].concat(Object.keys(aus.tradesJeSym).map(function (x) { return aus.tradesJeSym[x]; }))) + ' Trade(s) je Wert'));
  z.push('- Korb/Ziel: Soll ' + aus.soll.zulaessig + ' von ' + aus.soll.geprueft + ' zulaessig, Zielzahl ' + aus.soll.zielzahl + '; App (korbVerlauf) ' + JSON.stringify(aus.korb.app));
  z.push('- Bargeld vorher ' + aus.buchVorher.cash + ' | Soll nach Handel ' + aus.soll.cashNachHandel + ' (+ Ausschuettungen Soll ' + aus.soll.dividenden + ') | App am Ende ' + aus.buchNachher.cash + (aus.buchNachher.offen ? ' | offen: ' + JSON.stringify(aus.buchNachher.offen) : ''));
  z.push('- Positionen: vorher ' + aus.buchVorher.positionen + ', App am Ende ' + aus.buchNachher.positionen + ', Soll ' + aus.endbuch.sollPositionen);
  z.push('- Erhaltung (Eroeffnungskurse): ' + JSON.stringify(aus.erhaltung));
  z.push('- Tagespunkte (Schluessel tag, Wert, Soll): ' + aus.punkte.map(function (p) { return p.tag + ' ' + p.wert + ' (Soll ' + p.sollWert + ', Diff ' + p.diff + ', geschrieben ' + p.geschrieben + ')'; }).join('; '));
  if (aus.massnahmen.length) z.push('- Kapitalmassnahmen gebucht: ' + aus.massnahmen.map(function (x) { return x.art + ' ' + x.sym + ' Ex ' + x.t + ' gebucht ' + x.am + (x.summe != null ? ' ' + x.summe : '') + (x.zaehler ? ' ' + x.zaehler + ':' + x.nenner + ' Stueck ' + r4(x.stueckAlt) + '->' + r4(x.stueckNeu) : ''); }).join('; '));
  z.push('');
  z.push('## Pruefungen, die stimmen');
  z.push('');
  aus.pruef.forEach(function (p) { z.push('- ' + p); });
  z.push('');
  z.push('## Abweichungen');
  z.push('');
  if (!aus.abw.length) z.push('Keine.'); else aus.abw.forEach(function (a) { z.push('- **' + a.id + '**: ' + a.text); });
  z.push('');
  z.push('## Journal der Umschichtung (App-Text)');
  z.push('');
  aus.rebal.forEach(function (r) { z.push('> ' + r.txt); z.push(''); });
  z.push('## Trades (Weltzeit NY)');
  z.push('');
  z.push('| Zeit | Art | Wert | Stueck | Kurs |');
  z.push('|---|---|---|---|---|');
  aus.tradeLog.forEach(function (t) { z.push('| ' + t.T + ' | ' + t.art + ' | ' + t.sym + ' | ' + t.stueck + ' | ' + t.kurs + ' |'); });
  z.push('');
  z.push('## Takte mit Ereignis (nur Takte, in denen sich etwas aenderte)');
  z.push('');
  var gek = aus.log.slice(0, 80);
  gek.forEach(function (l) { z.push('- ' + l.T + (l.uhr !== l.T ? ' (Uhr ' + l.uhr + ')' : '') + ' [' + l.abrufe + ' Abrufe]: ' + l.was.join('; ')); });
  if (aus.log.length > gek.length) z.push('- ... und ' + (aus.log.length - gek.length) + ' weitere Takte mit Ereignis');
  z.push('');
  z.push('## Statuszeilen (verschiedene, mit Haeufigkeit)');
  z.push('');
  Object.keys(aus.status).slice(0, 15).forEach(function (x) { z.push('- ' + aus.status[x] + 'x ' + x); });
  if (EINORDNUNG[k]) { z.push(''); z.push('## Einordnung'); z.push(''); z.push(EINORDNUNG[k]); }
  return z.join('\n') + '\n';
}
function jsonSzenario(k, aus, ctx) {
  var s = SZENARIEN[k];
  return { kennung: k, titel: s.titel, takte: aus.takte, abrufe: aus.abrufe, uebereinstimmung_mit_REGEL: aus.abw.length === 0, abweichungen: aus.abw, pruefungen: aus.pruef,
    anzahlRebal: aus.anzahlRebal, rebal: aus.rebal.map(function (r) { return { at: r.at, quelle: r.quelle, applied: r.applied }; }), journal: aus.journal,
    handelZeiten: aus.handelZeiten, kursKlassen: aus.kursKlassen, tradesJeSym: aus.tradesJeSym, trades: aus.tradeLog, korb: aus.korb, soll: aus.soll, erhaltung: aus.erhaltung,
    punkte: aus.punkte, endbuch: aus.endbuch, buchVorher: aus.buchVorher, buchNachher: aus.buchNachher, massnahmen: aus.massnahmen, rollen: aus.rollen, fehlerTakte: ctx.fehlerTakte, statuszeilen: aus.status };
}

/* ================= Sommer-/Winterzeit: direkter Test der Uhr (mfhandel.js) gegen eine unabhaengige Regelrechnung ================= */
function refOffset(ms) {
  var y = new Date(ms).getUTCFullYear();
  var w3 = new Date(Date.UTC(y, 2, 1)).getUTCDay(), so3 = 1 + ((7 - w3) % 7) + 7;     // zweiter Sonntag im Maerz
  var w11 = new Date(Date.UTC(y, 10, 1)).getUTCDay(), so11 = 1 + ((7 - w11) % 7);     // erster Sonntag im November
  var von = Date.UTC(y, 2, so3, 7, 0), bis = Date.UTC(y, 10, so11, 6, 0);              // 02:00 EST = 07:00 UTC; 02:00 EDT = 06:00 UTC
  return ms >= von && ms < bis ? -4 : -5;
}
function refNy(ms) { var d = new Date(ms + refOffset(ms) * 3600000); return { tag: d.toISOString().slice(0, 10), stunde: d.getUTCHours(), minute: d.getUTCMinutes() }; }
function refZeit(tag, h, m) {
  var z = Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10), h, m), aus = [];
  [4, 5].forEach(function (o) { var t = z + o * 3600000, p = refNy(t); if (p.tag === tag && p.stunde === h && p.minute === m) aus.push(t); });
  return aus;                                                           // 0 = gibt es nicht (Luecke), 2 = doppelt (Herbst)
}
function refFertig(nowMs) {
  var p = refNy(nowMs), heute = p.tag, ist = MH.istWerktag(heute);
  var z = refZeit(heute, 16, 15)[0];
  if (ist && nowMs >= z) return heute;
  var t = heute; do { t = MH.tagPlus(t, -1); } while (!MH.istWerktag(t)); return t;
}
function dstPruefung() {
  var fenster = [['2026-03-04', '2026-03-12'], ['2026-10-28', '2026-11-05'], ['2027-03-03', '2027-03-18']], n = 0, abw = [], nZeit = 0, nFertig = 0, nFrisch = 0;
  fenster.forEach(function (f) {
    var a = MH.nyZeit(f[0], 0, 0) - 6 * 3600000, b = MH.nyZeit(f[1], 23, 59) + 6 * 3600000;
    for (var t = a; t <= b; t += 5 * 60000) {
      n++;
      var p = refNy(t), q = { tag: MH.nyTag(t), uhr: MH.nyUhr(t) };
      var refUhr = (p.stunde < 10 ? '0' : '') + p.stunde + ':' + (p.minute < 10 ? '0' : '') + p.minute;
      if (q.tag !== p.tag || q.uhr !== refUhr) abw.push({ art: 'nyTag/nyUhr', ms: t, iso: new Date(t).toISOString(), ist: q.tag + ' ' + q.uhr, soll: p.tag + ' ' + refUhr });
      nFertig++;
      var rf = refFertig(t), mf = MH.letzterFertigerWerktag(t);
      if (rf !== mf) abw.push({ art: 'letzterFertigerWerktag', ms: t, iso: new Date(t).toISOString(), ist: mf, soll: rf });
    }
    /* nyZeit: Mitternacht, Eroeffnung, Handelsbeginn der App, Schluss, Schluss fertig, 23:59 */
    for (var tag = f[0]; tag <= f[1]; tag = MH.tagPlus(tag, 1)) {
      [[0, 0], [9, 30], [9, 35], [16, 0], [16, 15], [23, 59]].forEach(function (hm) {
        var r = refZeit(tag, hm[0], hm[1]); nZeit++;
        var ist = MH.nyZeit(tag, hm[0], hm[1]);
        if (r.length !== 1 || ist !== r[0]) abw.push({ art: 'nyZeit', tag: tag, hm: hm.join(':'), ist: new Date(ist).toISOString(), soll: r.map(function (x) { return new Date(x).toISOString(); }).join(' / ') });
      });
      /* bestandFrisch: ein Bestand genau eine Minute vor / nach dem Schluss-fertig des juengsten Werktags */
      for (var dk = 0; dk < 3; dk++) {
        var nowMs = MH.nyZeit(tag, 10 + dk * 4, 0), d2 = refFertig(nowMs), z2 = refZeit(d2, 16, 15)[0];
        [-60000, 0].forEach(function (off) {
          nFrisch++;
          var an = z2 + off, soll = an >= z2, ist = MH.bestandFrisch(an, nowMs);
          if (soll !== ist) abw.push({ art: 'bestandFrisch', now: new Date(nowMs).toISOString(), at: new Date(an).toISOString(), ist: ist, soll: soll });
        });
      }
    }
  });
  /* Luecke (02:30 am 08.03.2026) und Doppelstunde (01:30 am 01.11.2026): was liefert nyZeit? nur zur Beschreibung */
  var info = { luecke_2026_03_08_0230: new Date(MH.nyZeit('2026-03-08', 2, 30)).toISOString(), doppel_2026_11_01_0130: new Date(MH.nyZeit('2026-11-01', 1, 30)).toISOString(),
    wechsel2027: (function () { var s = []; for (var t = '2027-03-06'; t <= '2027-03-15'; t = MH.tagPlus(t, 1)) s.push(t + ' ' + (refOffset(MH.nyZeit(t, 12, 0)) === -4 ? 'EDT' : 'EST')); return s.join(', '); })() };
  return { anzahlMinutenraster: n, anzahlNyZeit: nZeit, anzahlFertig: nFertig, anzahlFrisch: nFrisch, abweichungen: abw, info: info };
}

/* ================= Ausfuehren ================= */
async function szenarioLaufen(k) {
  if (k === 'dst') {
    var r = dstPruefung();
    var md = '# Szenario g (Teil 2) - Sommer-/Winterzeit: direkter Test der Uhr in mfhandel.js\n\n' +
      'Gegen eine unabhaengige Regelrechnung (US-Regel: zweiter Sonntag im Maerz 02:00 EST bis erster Sonntag im November 02:00 EDT). Getestet: nyTag/nyUhr im 5-Minuten-Raster ueber die Wechsel ' +
      '08.03.2026, 01.11.2026, 14.03.2027 (und die Woche um den 07.03.2027, an dem es KEINEN Wechsel gibt - der Wechsel 2027 ist am 14.03.), letzterFertigerWerktag im selben Raster (also auch 22:00-04:00 UTC), ' +
      'nyZeit fuer 00:00, 09:30, 09:35, 16:00, 16:15, 23:59 an jedem Tag der Fenster und bestandFrisch an der Grenze 16:15 +/- 1 Minute.\n\n' +
      '- Raster-Punkte: ' + r.anzahlMinutenraster + ', nyZeit-Faelle: ' + r.anzahlNyZeit + ', bestandFrisch-Faelle: ' + r.anzahlFrisch + '\n- Abweichungen: **' + r.abweichungen.length + '**\n' +
      r.abweichungen.slice(0, 20).map(function (x) { return '  - ' + JSON.stringify(x); }).join('\n') + '\n\n' +
      '- Info: ' + JSON.stringify(r.info) + '\n';
    fs.writeFileSync(path.join(ORDNER, 'szenario-g-dst.md'), md);
    fs.writeFileSync(path.join(ORDNER, 'szenario-g-dst.json'), JSON.stringify(r, null, 1));
    console.log('dst: ' + r.abweichungen.length + ' Abweichungen; Raster ' + r.anzahlMinutenraster);
    return r;
  }
  var o = szenarioOpt(k), t0 = Date.now();
  var ctx = await lauf(o);
  var aus = auswerten(ctx);
  fs.writeFileSync(path.join(ORDNER, 'szenario-' + k + '.md'), mdSzenario(k, aus, ctx));
  fs.writeFileSync(path.join(ORDNER, 'szenario-' + k + '.json'), JSON.stringify(jsonSzenario(k, aus, ctx), null, 1));
  console.log(k + ': ' + (aus.abw.length ? aus.abw.length + ' Abweichung(en): ' + aus.abw.map(function (a) { return a.id; }).join(', ') : 'keine Abweichung') + ' (' + Math.round((Date.now() - t0) / 1000) + ' s)');
  return aus;
}

module.exports = Object.assign({}, L, { baueWelt: baueWelt, lauf: lauf, auswerten: auswerten, sollRechnen: sollRechnen, handRang: handRang, handAusfuehren: handAusfuehren,
  szenarioOpt: szenarioOpt, SZENARIEN: SZENARIEN, szenarioLaufen: szenarioLaufen, dstPruefung: dstPruefung, nz: nz, nyStr: nyStr, minuten: minuten, rollenBestimmen: rollenBestimmen,
  sandboxGem: sandboxGem, refNy: refNy, refZeit: refZeit, e0Tag: e0Tag, ORDNER: ORDNER });

if (require.main === module) {
  var arg = process.argv[2] || 'a';
  if (arg === 'alle') {
    var liste = Object.keys(SZENARIEN).concat(['dst']), laufend = 0, i = 0, fertig = 0;
    (function weiter() {
      while (laufend < 4 && i < liste.length) {
        (function (k) {
          laufend++;
          var c = cp.spawn(process.execPath, [__filename, k], { stdio: 'inherit' });
          c.on('exit', function (code) { laufend--; fertig++; if (code) console.log(k + ': Prozess endete mit ' + code); weiter(); });
        })(liste[i++]);
      }
    })();
  } else {
    szenarioLaufen(arg).catch(function (e) { console.error(e && e.stack || e); process.exit(1); });
  }
}
