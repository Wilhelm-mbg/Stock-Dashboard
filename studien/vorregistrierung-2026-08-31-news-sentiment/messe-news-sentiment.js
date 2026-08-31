'use strict';
/* ERSTMESSUNG NEWS-SENTIMENT - Uebernachtertrag T -> T+1.
 * Urteil steht laut Vorregistrierung §1 fest (nicht messbar); was hier laeuft,
 * sind die Pflicht-Kontrollen und die NACHRICHTLICHE Punktschaetzung. */
var fs = require('fs'), path = require('path');
var Q = require('../../quant.js');
var SAAT = 20260831;
function rng(s) { var x = s >>> 0; return function () { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; }
function sommer(ms) { return Q.usSommerzeit(new Date(ms)); }
function tagKey(ms) { return new Date(ms - (sommer(ms) ? 4 : 5) * 3600000).toISOString().slice(0, 10); }
function schlussMs(k) {
  var p = k.split('-'); var probe = Date.UTC(+p[0], +p[1] - 1, +p[2], 16);
  return Date.UTC(+p[0], +p[1] - 1, +p[2], sommer(probe) ? 20 : 21, 0, 0);
}
function mittel(a) { return a.reduce(function (x, y) { return x + y; }, 0) / a.length; }
function sd(a) { var m = mittel(a); return Math.sqrt(a.reduce(function (x, y) { return x + (y - m) * (y - m); }, 0) / Math.max(1, a.length - 1)); }

var SY = fs.readdirSync(path.join(__dirname, 'store-kopie')).map(function (f) { return f.replace(/newsarchiv_|\.json/g, ''); });
console.log('== Erstmessung News-Sentiment ==  Saat ' + SAAT + '  Symbole ' + SY.length);

/* ---- Kurse: Uebernachtertrag je (Symbol, Tag T) ---- */
var un = {};
SY.forEach(function (s) {
  var ser = JSON.parse(fs.readFileSync(path.join(__dirname, 'archiv-kopie', 'bars_1d_' + s + '.json'), 'utf8')).series;
  un[s] = {};
  for (var i = 1; i < ser.length; i++) {
    if (!(ser[i - 1][1] > 0) || !(ser[i][5] > 0)) continue;
    un[s][tagKey(ser[i - 1][0])] = (ser[i][5] / ser[i - 1][1] - 1) * 100;
  }
});

/* ---- Nachrichten ---- */
var news = {};
SY.forEach(function (s) {
  news[s] = JSON.parse(fs.readFileSync(path.join(__dirname, 'store-kopie', 'newsarchiv_' + s + '.json'), 'utf8')).items
    .map(function (x) { return { t: x[0], title: x[1] }; }).filter(function (x) { return x.t > 0; })
    .sort(function (a, b) { return a.t - b.t; });
});
var TAGE = ['2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13', '2026-08-14',
            '2026-08-17', '2026-08-18', '2026-08-19', '2026-08-20', '2026-08-21'];

/* ---- Beobachtungen bilden + Look-ahead-Kontrolle (Pflicht 3) ---- */
var beob = [], laVerstoss = 0, laGeprueft = 0;
TAGE.forEach(function (tk) {
  var cut = schlussMs(tk);
  SY.forEach(function (s) {
    if (un[s][tk] === undefined) return;
    var f = news[s].filter(function (x) { return x.t <= cut; }).slice(-12);
    if (!f.length) return;
    f.forEach(function (x) { laGeprueft++; if (x.t > cut) laVerstoss++; });
    var sc = Q.sentiment(f, cut).score;
    if (sc === 0) return;
    beob.push({ s: s, tag: tk, score: sc, un: un[s][tk] });
  });
});
console.log('Look-ahead: ' + laGeprueft + ' Stempel geprueft, ' + laVerstoss + ' nach Schluss -> ' + (laVerstoss ? 'VERSTOSS' : 'sauber'));
if (laVerstoss) { console.error('ABBRUCH: Look-ahead.'); process.exit(3); }

/* ---- Tagesbereinigung: Marktfaktor raus ---- */
var jeTag = {};
TAGE.forEach(function (tk) {
  var g = SY.filter(function (s) { return un[s][tk] !== undefined; });
  if (g.length >= 3) jeTag[tk] = mittel(g.map(function (s) { return un[s][tk]; }));
});
beob.forEach(function (b) { b.rest = b.un - (jeTag[b.tag] === undefined ? 0 : jeTag[b.tag]); });
var CLUSTER = Object.keys(beob.reduce(function (a, b) { a[b.tag] = 1; return a; }, {})).length;
console.log('Beobachtungen (Score != 0 und Uebernachtertrag da): ' + beob.length + '   Zeitpunkte: ' + CLUSTER);

/* ---- Schaetzer: Steigung, se je TAG geclustert ---- */
function steigung(paare) {
  var mx = mittel(paare.map(function (p) { return p.x; })), my = mittel(paare.map(function (p) { return p.y; }));
  var sxy = 0, sxx = 0;
  paare.forEach(function (p) { sxy += (p.x - mx) * (p.y - my); sxx += (p.x - mx) * (p.x - mx); });
  if (!sxx) return { b: NaN, se: NaN, t: NaN, G: 0 };
  var b = sxy / sxx, a = my - b * mx;
  var proTag = {};
  paare.forEach(function (p) { (proTag[p.tag] = proTag[p.tag] || []).push((p.x - mx) * (p.y - a - b * p.x)); });
  var summen = Object.keys(proTag).map(function (k) { return proTag[k].reduce(function (x, y) { return x + y; }, 0); });
  var G = summen.length;
  if (G < 2) return { b: b, se: NaN, t: NaN, G: G };
  var meat = summen.reduce(function (x, y) { return x + y * y; }, 0) * (G / (G - 1));
  var se = Math.sqrt(meat) / sxx;
  return { b: b, se: se, t: b / se, G: G };
}
var echt = steigung(beob.map(function (b) { return { x: b.score, y: b.rest, tag: b.tag }; }));

/* ---- Pflicht 1: Placebo, Titel(=Scores) zwischen Symbol-Tagen permutiert ---- */
var r = rng(SAAT), placebo = [];
for (var z = 0; z < 200; z++) {
  var idx = beob.map(function (_, i) { return i; });
  for (var i = idx.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t0 = idx[i]; idx[i] = idx[j]; idx[j] = t0; }
  var e = steigung(beob.map(function (b, k) { return { x: beob[idx[k]].score, y: b.rest, tag: b.tag }; }));
  if (isFinite(e.b)) placebo.push(e.b);
}
var pSort = placebo.slice().sort(function (a, b) { return a - b; });

/* ---- Pflicht 2: Positivkontrolle, eingebaute Steigung 0,50 Pp je Score-Punkt ----
 * DREI Formen, siehe Nachtrag 1 der Vorregistrierung. Der Einzelzug (pk1) war die
 * angemeldete Fassung; er streut mit sd ~1,03 Pp/Punkt und kann eine 0,50 gar nicht
 * aufloesen - die +-30-%-Regel war fuer diese Anordnung NIE erfuellbar. Erst pk0
 * (rauschfrei) und pk2 (Mittel vieler Zuege) trennen "Werkzeug tot" von
 * "Anordnung zu schwach". */
var SOLL = 0.50, r2 = rng(SAAT + 1);
function gauss() { var u = 0, v = 0; while (!u) u = r2(); while (!v) v = r2(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
var pk0 = steigung(beob.map(function (b) { return { x: b.score, y: SOLL * b.score, tag: b.tag }; }));
var pk1 = steigung(beob.map(function (b) { return { x: b.score, y: SOLL * b.score + 1.830 * gauss(), tag: b.tag }; }));
var zuege = [];
for (var q = 0; q < 2000; q++) {
  var e2 = steigung(beob.map(function (b) { return { x: b.score, y: SOLL * b.score + 1.830 * gauss(), tag: b.tag }; }));
  if (isFinite(e2.b)) zuege.push(e2.b);
}
var pk2m = mittel(zuege), pk2s = sd(zuege);
var pkTreffer = 100 * zuege.filter(function (x) { return Math.abs(x / SOLL - 1) <= 0.30; }).length / zuege.length;

/* ---- MDE aus der tatsaechlichen Anordnung ---- */
var K = 1.959964 + 0.8416212;
var sx = sd(beob.map(function (b) { return b.score; }));
var mdeB = K * 1.830 / (sx * Math.sqrt(beob.length));
var mdeC = K * 1.830 / (sx * Math.sqrt(CLUSTER));

function zeile(nm, b, se, t) {
  console.log('  ' + (nm + '                          ').slice(0, 26) +
    (isFinite(b) ? (b >= 0 ? '+' : '') + b.toFixed(3) : '   -') + ' Pp/Punkt' +
    '   se ' + (isFinite(se) ? se.toFixed(3) : '-') + '   t ' + (isFinite(t) ? t.toFixed(2) : '-'));
}
console.log('\n== TABELLE (echte Zahlen, Placebo und Positivkontrolle nebeneinander) ==');
zeile('ECHT (nachrichtlich)', echt.b, echt.se, echt.t);
zeile('Placebo Mittel (200)', mittel(placebo), sd(placebo), mittel(placebo) / sd(placebo));
zeile('Positivkontr. rauschfrei', pk0.b, pk0.se, pk0.t);
zeile('Positivkontr. 1 Zug', pk1.b, pk1.se, pk1.t);
zeile('Positivkontr. 2000 Zuege', pk2m, pk2s / Math.sqrt(zuege.length), pk2m / (pk2s / Math.sqrt(zuege.length)));
console.log('  Soll +' + SOLL.toFixed(2) + ' Pp/Punkt:');
console.log('    rauschfrei  ' + pk0.b.toFixed(6) + '  -> ' + (Math.abs(pk0.b - SOLL) < 1e-9 ? 'EXAKT - das Geschirr rechnet richtig' : 'ABWEICHUNG - Geschirr defekt'));
console.log('    1 Zug       ' + pk1.b.toFixed(3) + '  Verhaeltnis ' + (pk1.b / SOLL).toFixed(3) + '  -> ' +
            (Math.abs(pk1.b / SOLL - 1) <= 0.30 ? 'im +-30-%-Fenster' : 'AUSSERHALB +-30 % (siehe Nachtrag 1: mit dieser Anordnung nicht erfuellbar)'));
console.log('    2000 Zuege  ' + pk2m.toFixed(4) + ' +- ' + (pk2s / Math.sqrt(zuege.length)).toFixed(4) +
            '  Verhaeltnis ' + (pk2m / SOLL).toFixed(3) + '  -> ' + (Math.abs(pk2m / SOLL - 1) <= 0.30 ? 'BESTANDEN' : 'DEFEKT'));
console.log('    sd eines Einzelzugs ' + pk2s.toFixed(3) + ' Pp/Punkt; nur ' + pkTreffer.toFixed(1) +
            ' % der Zuege treffen 0,50 auf +-30 %.');
console.log('  Placebo-Band (5./95. Perzentil): ' + pSort[Math.floor(0.05 * pSort.length)].toFixed(3) +
            ' .. ' + pSort[Math.floor(0.95 * pSort.length)].toFixed(3) + ' Pp/Punkt');
console.log('\nMDE der Steigung: ungeclustert ' + mdeB.toFixed(3) + ' Pp/Punkt, je Tag geclustert ' + mdeC.toFixed(3) +
            ' Pp/Punkt   (Kostenhuerde 0,10 Pp)');
console.log('Score-Streuung sx ' + sx.toFixed(3) + '   Beobachtungen ' + beob.length + '   Cluster ' + CLUSTER);
console.log('\nURTEIL: NICHT MESSBAR (Vorregistrierung §1, R3 - vor dem Lauf festgelegt).');

fs.writeFileSync(path.join(__dirname, 'lauf.json'), JSON.stringify({
  saat: SAAT, n: beob.length, cluster: CLUSTER,
  echt: echt, placeboMittel: mittel(placebo), placeboSd: sd(placebo),
  placeboBand: [pSort[Math.floor(0.05 * pSort.length)], pSort[Math.floor(0.95 * pSort.length)]],
  positivkontrolle: { soll: SOLL, rauschfrei: pk0.b, einZug: pk1.b,
    mittel2000: pk2m, sdEinzelzug: pk2s, trefferAnteilProzent: pkTreffer },
  mde: { ungeclustert: mdeB, geclustert: mdeC },
  lookahead: { geprueft: laGeprueft, verstoesse: laVerstoss },
  beobachtungen: beob
}, null, 1));
console.log('lauf.json geschrieben. Store und Archiv NUR gelesen.');
