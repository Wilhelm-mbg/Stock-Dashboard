'use strict';
/* NEWS-SENTIMENT, VOLLKORPUS - Uebernachtertrag T -> T+1.
 * Anordnung, Kontrollen und Entscheidungsregeln stehen in VORREGISTRIERUNG.md und
 * werden hier NICHT neu erfunden. Kein Schluessel, kein Netz - der Korpus liegt
 * bereits auf der Platte. */
var fs = require('fs');
var path = require('path');
var Q = require('../../quant.js');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv1d';
var START = '2021-05-01', ENDE = '2026-08-28';   // Fenster wie registriert, Nachtrag 1
var SAAT = 20260901;
var T_KRIT = 1.959964, K80 = 1.959964 + 0.8416212;
var HUERDE_CFD = 0.1247, HUERDE_AKTIE = 0.0600;  // wiki/kosten.md, H = 1 Nacht

function sommer(ms) { return Q.usSommerzeit(new Date(ms)); }
function tagVon(ms) { return new Date(ms - (sommer(ms) ? 4 : 5) * 3600000).toISOString().slice(0, 10); }
function schlussMs(tg) {
  var p = tg.split('-'), probe = Date.UTC(+p[0], +p[1] - 1, +p[2], 16);
  return Date.UTC(+p[0], +p[1] - 1, +p[2], sommer(probe) ? 20 : 21, 0, 0);
}
function mittel(a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
function sd(a) { var m = mittel(a); return Math.sqrt(a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / Math.max(1, a.length - 1)); }
function rng(s) { var a = s >>> 0; return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }

/** Steigung mit je Tag geclustertem Standardfehler (CRVE). */
function steigung(x, y, cluster) {
  var n = x.length, mx = mittel(x), my = mittel(y), sxy = 0, sxx = 0;
  for (var i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); }
  if (!sxx) return { b: NaN, se: NaN, t: NaN, seRoh: NaN, tRoh: NaN, G: 0, n: n };
  var b = sxy / sxx, a = my - b * mx;
  var proG = Object.create(null), rss = 0;
  for (var j = 0; j < n; j++) {
    var e = y[j] - a - b * x[j];
    rss += e * e;
    var s = (x[j] - mx) * e;
    proG[cluster[j]] = (proG[cluster[j]] || 0) + s;
  }
  var summen = Object.keys(proG).map(function (k) { return proG[k]; }), G = summen.length;
  var meat = summen.reduce(function (p, q) { return p + q * q; }, 0) * (G / Math.max(1, G - 1));
  var se = Math.sqrt(meat) / sxx;
  var seRoh = Math.sqrt(rss / (n - 2) / sxx);
  return { b: b, se: se, t: b / se, seRoh: seRoh, tRoh: b / seRoh, G: G, n: n };
}

/* ---------- Daten ---------- */
var uni = JSON.parse(fs.readFileSync(path.join(__dirname, 'universum.json'), 'utf8')).universum
  .map(function (u) { return u.sym; });
console.log('== News-Sentiment Vollkorpus ==  ' + uni.length + ' Werte  ' + START + ' .. ' + ENDE);
console.log('Familie news-sentiment-vollkorpus, testsGesamt = 1, |t| >= ' + T_KRIT.toFixed(4));

/* Korpus - NUR erschoepfte Blaetterketten. Eine abgebrochene saehe spaeter aus wie
 * Nachrichtenlosigkeit, und das waere ein stiller Messfehler. */
var news = {}, luecken = [];
uni.forEach(function (s) {
  var p = path.join(__dirname, 'korpus', s + '.json');
  if (!fs.existsSync(p)) { luecken.push(s + ' (fehlt)'); return; }
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!j.erschoepft) { luecken.push(s + ' (abgebrochen)'); return; }
  news[s] = j.items.map(function (a) { return { t: a[0], title: a[1] }; })
    .sort(function (a, b) { return a.t - b.t; });
});
if (luecken.length) { console.error('ABBRUCH - unvollstaendiger Korpus: ' + luecken.join(', ')); process.exit(3); }
console.log('Korpus: ' + uni.reduce(function (a, s) { return a + news[s].length; }, 0) + ' Meldungen, alle Ketten erschoepft.');

/* Kurse */
var un = {}, tageSatz = Object.create(null);
uni.forEach(function (s) {
  var ser = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + s + '.json'), 'utf8')).series;
  un[s] = Object.create(null);
  for (var i = 1; i < ser.length; i++) {
    if (!(ser[i - 1][1] > 0) || !(ser[i][5] > 0)) continue;
    var tg = tagVon(ser[i - 1][0]);
    if (tg < START || tg > ENDE) continue;
    un[s][tg] = (ser[i][5] / ser[i - 1][1] - 1) * 100;
    tageSatz[tg] = 1;
  }
});
var TAGE = Object.keys(tageSatz).sort();
console.log('Handelstage im Fenster: ' + TAGE.length);

/* ---------- Beobachtungen + Look-ahead-Kontrolle ---------- */
var beob = [], laGeprueft = 0, laVerstoesse = 0, zeiger = {};
uni.forEach(function (s) { zeiger[s] = 0; });
TAGE.forEach(function (tg) {
  var cut = schlussMs(tg);
  uni.forEach(function (s) {
    if (un[s][tg] === undefined) return;
    var liste = news[s];
    /* Laufender Zeiger statt filter() - 40k Tage x 20k Meldungen waeren sonst
     * quadratisch. Die Liste ist aufsteigend sortiert. */
    var z = zeiger[s];
    while (z < liste.length && liste[z].t <= cut) z++;
    zeiger[s] = z;
    var f = liste.slice(Math.max(0, z - 12), z);
    if (!f.length) return;
    for (var q = 0; q < f.length; q++) { laGeprueft++; if (f[q].t > cut) laVerstoesse++; }
    var sc = Q.sentiment(f, cut).score;
    if (sc === 0) return;
    beob.push({ s: s, tag: tg, score: sc, un: un[s][tg] });
  });
});
console.log('Look-ahead: ' + laGeprueft + ' Zeitstempel geprueft, ' + laVerstoesse + ' nach Schluss -> ' +
  (laVerstoesse ? 'VERSTOSS' : 'sauber'));
if (laVerstoesse) { console.error('ABBRUCH: Look-ahead.'); process.exit(3); }

/* Tagesbereinigung: der Marktfaktor raus */
var jeTag = {};
TAGE.forEach(function (tg) {
  var g = uni.map(function (s) { return un[s][tg]; }).filter(function (x) { return x !== undefined && isFinite(x); });
  if (g.length >= 5) jeTag[tg] = mittel(g);
});
beob = beob.filter(function (b) { return jeTag[b.tag] !== undefined; });
beob.forEach(function (b) { b.rest = b.un - jeTag[b.tag]; });
var clusterSatz = {}; beob.forEach(function (b) { clusterSatz[b.tag] = 1; });
var G = Object.keys(clusterSatz).length;
console.log('Beobachtungen (Score != 0): ' + beob.length + '   Cluster (Handelstage): ' + G);
var sx = sd(beob.map(function (b) { return b.score; }));
var sdRest = sd(beob.map(function (b) { return b.rest; }));
console.log('Score-Streuung sx ' + sx.toFixed(4) + '   sd tagesbereinigter Ertrag ' + sdRest.toFixed(3) + ' Pp');

var X = beob.map(function (b) { return b.score; });
var Y = beob.map(function (b) { return b.rest; });
var C = beob.map(function (b) { return b.tag; });
var echt = steigung(X, Y, C);

/* ---------- Placebo (Pflicht B4) ---------- */
var r = rng(SAAT), placebo = [], placeboT = [];
for (var z2 = 0; z2 < 200; z2++) {
  var perm = X.slice();
  for (var i2 = perm.length - 1; i2 > 0; i2--) { var j2 = Math.floor(r() * (i2 + 1)); var tmp = perm[i2]; perm[i2] = perm[j2]; perm[j2] = tmp; }
  var e2 = steigung(perm, Y, C);
  if (isFinite(e2.b)) { placebo.push(e2.b); placeboT.push(e2.t); }
}
var pSort = placebo.slice().sort(function (a, b) { return a - b; });

/* ---------- Positivkontrolle, dreifach (Pflicht B5) ---------- */
var SOLL = 0.50, r2 = rng(SAAT + 1);
function gauss() { var u = 0, v = 0; while (!u) u = r2(); while (!v) v = r2(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
var pk0 = steigung(X, X.map(function (x) { return SOLL * x; }), C);
var pk1 = steigung(X, X.map(function (x) { return SOLL * x + sdRest * gauss(); }), C);
var zuege = [];
for (var q2 = 0; q2 < 2000; q2++) {
  var yy = X.map(function (x) { return SOLL * x + sdRest * gauss(); });
  var ee = steigung(X, yy, C);
  if (isFinite(ee.b)) zuege.push(ee.b);
}
var pk2m = mittel(zuege), pk2s = sd(zuege);

/* ---------- MDE aus der tatsaechlichen Anordnung ---------- */
var mdeGe = K80 * sdRest / (sx * Math.sqrt(G));
var mdeRoh = K80 * sdRest / (sx * Math.sqrt(beob.length));

/* ---------- Tabelle: Kandidat, Placebo und Positivkontrolle in EINER Blickzeile ---------- */
function zl(nm, b, se, t) {
  console.log('  ' + (nm + '                            ').slice(0, 28) +
    (isFinite(b) ? (b >= 0 ? '+' : '') + b.toFixed(4) : '    -').padStart(9) + ' Pp/Punkt' +
    '   se ' + (isFinite(se) ? se.toFixed(4) : '-').padStart(8) +
    '   t ' + (isFinite(t) ? t.toFixed(2) : '-').padStart(7));
}
console.log('\n== TABELLE (geclustert je Handelstag) ==');
zl('KANDIDAT', echt.b, echt.se, echt.t);
zl('Placebo, Mittel aus 200', mittel(placebo), sd(placebo), mittel(placebo) / sd(placebo));
zl('Positivkontrolle rauschfrei', pk0.b, pk0.se, pk0.t);
zl('Positivkontrolle 2000 Zuege', pk2m, pk2s / Math.sqrt(zuege.length), pk2m / (pk2s / Math.sqrt(zuege.length)));
zl('Positivkontrolle 1 Zug (o.U.)', pk1.b, pk1.se, pk1.t);
console.log('  Placebo-Band 5./95. Perzentil: ' + pSort[Math.floor(0.05 * pSort.length)].toFixed(4) +
  ' .. ' + pSort[Math.floor(0.95 * pSort.length)].toFixed(4) + ' Pp/Punkt');
var pkOk0 = Math.abs(pk0.b - SOLL) < 1e-9, pkOk2 = Math.abs(pk2m / SOLL - 1) <= 0.30;
console.log('  Positivkontrolle: rauschfrei ' + (pkOk0 ? 'EXAKT' : 'ABWEICHUNG') +
  ' | 2000 Zuege ' + pk2m.toFixed(4) + ' (' + (pk2m / SOLL).toFixed(3) + 'x) ' + (pkOk2 ? 'BESTANDEN' : 'DEFEKT') +
  ' | Einzelzug ' + pk1.b.toFixed(3) + ' (ohne Urteilskraft, Lehre 31.08.)');
console.log('\nUngeclustert nachrichtlich: b ' + echt.b.toFixed(4) + '  se ' + echt.seRoh.toFixed(4) + '  t ' + echt.tRoh.toFixed(2));
console.log('MDE: geclustert ' + mdeGe.toFixed(4) + '  ungeclustert ' + mdeRoh.toFixed(4) + ' Pp/Punkt');

/* ---------- Urteil nach R1 / R1b / R2 / R3 ---------- */
if (!pkOk0 || !pkOk2) { console.error('\nABBRUCH: Positivkontrolle defekt - jede Null waere wertlos.'); process.exit(3); }
var wirkung = Math.abs(echt.b) * sx;                       // Pp je 1-sd-Score-Sprung
var bandU = echt.b - 1.6448536 * echt.se, bandO = echt.b + 1.6448536 * echt.se;
var signifikant = Math.abs(echt.t) >= T_KRIT;
var urteil;
if (signifikant && wirkung >= HUERDE_CFD) urteil = 'JA (R1)';
else if (signifikant) urteil = 'R1b - statistisch belegt, wirtschaftlich UNTER der Kostenhuerde. KEIN JA.';
else if (bandU >= -mdeGe && bandO <= mdeGe) urteil = 'NEIN (R2) - kein handelbarer Effekt im Fenster';
else urteil = 'NICHT ENTSCHEIDBAR (R3)';
console.log('\nWirkung je 1-sd-Score-Sprung: ' + (echt.b * sx).toFixed(4) + ' Pp' +
  '   | Huerde CFD ' + HUERDE_CFD + ' | Aktie ' + HUERDE_AKTIE + ' (nachrichtlich, Anordnung dort knapp blind)');
console.log('90-%-Band fuer b: ' + bandU.toFixed(4) + ' .. ' + bandO.toFixed(4));
console.log('\nURTEIL: ' + urteil);

fs.writeFileSync(path.join(__dirname, 'lauf.json'), JSON.stringify({
  saat: SAAT, fenster: [START, ENDE], universum: uni,
  n: beob.length, cluster: G, sx: sx, sdRest: sdRest,
  kandidat: echt, placeboMittel: mittel(placebo), placeboSd: sd(placebo),
  placeboBand: [pSort[Math.floor(0.05 * pSort.length)], pSort[Math.floor(0.95 * pSort.length)]],
  positivkontrolle: { soll: SOLL, rauschfrei: pk0.b, einZug: pk1.b, mittel2000: pk2m, sdEinzelzug: pk2s },
  mde: { geclustert: mdeGe, ungeclustert: mdeRoh },
  wirkungJeSd: echt.b * sx, band90: [bandU, bandO],
  lookahead: { geprueft: laGeprueft, verstoesse: laVerstoesse },
  urteil: urteil
}, null, 1));
console.log('lauf.json geschrieben.');
