'use strict';
/* Tests: Regressionskanal + Wellenreiter mit/ohne Kanal */
var Q = require('./quant.js');
var fails = 0;
function ok(cond, name, extra) {
  console.log((cond ? '  ✅ ' : '  ❌ ') + name + (extra !== undefined ? '  [' + extra + ']' : ''));
  if (!cond) fails++;
}

console.log('1) Kanal-Fit gegen bekannte Gerade');
// closes = 100 + 0.5*i ± 1 (alternierend) → Steigung ~0.5, sd ~1
var closes = [];
for (var i = 0; i < 200; i++) closes.push(100 + 0.5 * i + (i % 2 === 0 ? 1 : -1));
var ch = Q.regressionChannel(closes, 120);
ok(ch !== null, 'Kanal berechnet');
var slopeAbs = ch.slopePct / 100 * ch.mid;
ok(Math.abs(slopeAbs - 0.5) < 0.02, 'Steigung ≈ 0.5/Bar', slopeAbs.toFixed(4));
ok(Math.abs(ch.sd - 1.0) < 0.05, 'Residuen-σ ≈ 1', ch.sd.toFixed(3));
ok(ch.steep > 5, 'steiler Aufwärtskanal erkannt (steep >> 1)', ch.steep);
ok(ch.upper > ch.mid && ch.mid > ch.lower, 'Bänder geordnet');

console.log('2) Kurs-Position im Kanal');
// Letzter Kurs künstlich an die Unterkante gelegt
var closes2 = closes.slice();
closes2[closes2.length - 1] = ch.lower;
var ch2 = Q.regressionChannel(closes2, 120);
ok(Math.abs(ch2.pos) < 0.12, 'Kurs an Unterkante → pos ≈ 0', ch2.pos);
var closes3 = closes.slice();
closes3[closes3.length - 1] = ch.upper;
var ch3 = Q.regressionChannel(closes3, 120);
ok(Math.abs(ch3.pos - 1) < 0.12, 'Kurs an Oberkante → pos ≈ 1', ch3.pos);

console.log('3) Seitwärtskanal & Grenzfälle');
var flat = [];
for (var k = 0; k < 200; k++) flat.push(50 + (k % 4 < 2 ? 0.5 : -0.5));
var chF = Q.regressionChannel(flat, 120);
ok(chF && Math.abs(chF.steep) < 0.5, 'Seitwärts → steep ≈ 0', chF && chF.steep);
ok(Q.regressionChannel([1, 2, 3], 120) === null, 'zu wenig Daten → null');
var konst = []; for (var m = 0; m < 150; m++) konst.push(100);
ok(Q.regressionChannel(konst, 120) === null, 'konstante Serie (σ=0) → null');

console.log('4) Wellenreiter-Backtest: ohne vs. mit Kanal (synthetische Trend+Wellen-Serie)');
// 5 Handelstage à 390 1-Min-Bars: Aufwärtstrend + saubere Wellen + Rauschen
function lcg(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 - 0.5; }; }
var rnd = lcg(42);
var bars = [];
var t0 = Date.UTC(2026, 5, 1, 13, 30); // Mo 13:30 UTC
var idx = 0;
for (var d = 0; d < 5; d++) {
  var dayStart = t0 + d * 86400000;
  for (var b = 0; b < 390; b++) {
    var price = 100 * (1 + 0.00018 * idx) + 1.4 * Math.sin(idx / 18) + rnd() * 0.5;
    bars.push([dayStart + b * 60000, price, 900000 + Math.round(rnd() * 200000)]);
    idx++;
  }
}
var base = {
  capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1,
  entryMode: 'wave', zThr: 1.5, minQuality: 45, minEdge: 0.5,
  sl: -0.2, tp: null, maxHoldMin: 60, cooldownMin: 3, maxPerDay: 40,
  trendFilter: true, lineType: 'ema'
};
var r0 = Q.backtestIntraday({ TEST: bars }, Object.assign({}, base, { channel: false }));
var r1 = Q.backtestIntraday({ TEST: bars }, Object.assign({}, base, { channel: true })); // Kanal-Fenster automatisch
ok(!r0.error && !r1.error, 'beide Backtests laufen', (r0.error || '') + (r1.error || ''));
ok(r0.trades.length > 0, 'ohne Kanal: Trades vorhanden', r0.trades.length);
ok(r1.trades.length > 0, 'mit Kanal: Trades vorhanden', r1.trades.length);
var crestExits = r1.trades.filter(function (t) { return /Kanal|Wellenkamm/.test(t.why); }).length;
var slExits = r1.trades.filter(function (t) { return /Stop-Loss/.test(t.why); }).length;
ok(crestExits > slExits, 'Kamm-/Kanal-Exits dominieren über Stop-Loss', crestExits + ' vs ' + slExits);
// Im Aufwärtstrend mit Trendfilter dürfen keine Puts entstehen
ok(r1.trades.every(function (t) { return t.dir === 'call'; }), 'Trendfilter: nur Calls im Aufwärtstrend');
ok(r1.summary.winRate > r0.summary.winRate, 'Kanal verbessert die Trefferquote (saubere Wellen-Serie)', r1.summary.winRate + ' % vs ' + r0.summary.winRate + ' %');
console.log('   ohne Kanal: ' + r0.trades.length + ' Trades, ' + r0.summary.retPct + ' %, WinRate ' + r0.summary.winRate + ' %');
console.log('   mit Kanal:  ' + r1.trades.length + ' Trades, ' + r1.summary.retPct + ' %, WinRate ' + r1.summary.winRate + ' %');

console.log('5) Abwärtskanal blockt Calls');
// klarer Abwärtstrend: steep << -0.8 → Call-Einstiege müssen wegfallen
var rnd2 = lcg(77);
var barsDown = [];
idx = 0;
for (var d2 = 0; d2 < 5; d2++) {
  var ds2 = t0 + d2 * 86400000;
  for (var b2 = 0; b2 < 390; b2++) {
    var pD = 100 * (1 - 0.00025 * idx) + 1.2 * Math.sin(idx / 18) + rnd2() * 0.5;
    barsDown.push([ds2 + b2 * 60000, pD, 900000]);
    idx++;
  }
}
var rD = Q.backtestIntraday({ TEST: barsDown }, Object.assign({}, base, { channel: true }));
ok(!rD.error, 'Backtest Abwärtsserie läuft');
ok(rD.trades.every(function (t) { return t.dir === 'put'; }), 'im Abwärtskanal nur Puts', rD.trades.length + ' Trades');

// v6.3: degap – Kanal bleibt trotz Übernacht-Gaps stabil
(function () {
  var Q2 = Q;
  console.log('6) degap: Übernacht-Gaps verzerren den Kanal nicht mehr');
  var t0g = Date.UTC(2026, 5, 1, 13, 30), bars = [], idx = 0;
  // 3 Tage Seitwärts-Wellen, aber jeder Tag eröffnet 3 $ ÜBER dem Vortagsschluss (Gap up)
  for (var d = 0; d < 3; d++) {
    for (var b = 0; b < 78; b++) { // 5-Min-Bars
      bars.push([t0g + d * 86400000 + b * 300000, 100 + d * 3 + 1.2 * Math.sin(idx / 10), 1000]);
      idx++;
    }
  }
  var raw = Q2.regressionChannel(bars.map(function (x) { return x[1]; }), 200);
  var fixed = Q2.regressionChannel(Q2.degapCloses(bars), 200);
  var f1 = raw && fixed && fixed.sd < raw.sd * 0.9;
  var f2 = fixed && Math.abs(fixed.steep) < 1.0;
  console.log((f1 ? '  ✅ ' : '  ❌ ') + 'entzerrte Serie: deutlich engerer Kanal (σ ' + (fixed && fixed.sd.toFixed(2)) + ' vs ' + (raw && raw.sd.toFixed(2)) + ')');
  console.log((f2 ? '  ✅ ' : '  ❌ ') + 'Seitwärtstage trotz Gaps: steep ≈ 0 (' + (fixed && fixed.steep) + ' vs roh ' + (raw && raw.steep) + ')');
  if (!f1) fails++;
  if (!f2) fails++;
})();


console.log('7) Kanal-Güteprüfung: Zufallspfad vs. echter Kanal');
function rndGen(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
function gaussOf(r) { var u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
function zufallspfad(n, seed) { var r = rndGen(seed), o = [300]; for (var i = 1; i < n; i++) o.push(o[i - 1] * (1 + gaussOf(r) * 0.0004)); return o; }
function echterKanal(n, seed, theta) { var r = rndGen(seed), o = [], d = 0; for (var i = 0; i < n; i++) { d += -(theta || 0.18) * d + gaussOf(r) * 0.35; o.push(300 * (1 + 0.005 * i / n) + d); } return o; }

var trefferZufall = 0, trefferKanal = 0, LAEUFE = 200;
for (var sd = 1; sd <= LAEUFE; sd++) {
  if (Q.bestChannel(zufallspfad(260, sd))) trefferZufall++;
  if (Q.bestChannel(echterKanal(260, sd))) trefferKanal++;
}
var qZ = Math.round(trefferZufall / LAEUFE * 100), qK = Math.round(trefferKanal / LAEUFE * 100);
ok(qZ <= 20, 'Zufallspfad wird selten als Kanal erkannt (Fehlalarm ≤ 20 %)', qZ + ' %');
ok(qK >= 60, 'Echter Kanal wird erkannt (≥ 60 %)', qK + ' %');
ok(qK - qZ >= 40, 'Trennschärfe zwischen Zufall und Kanal', (qK - qZ) + ' Prozentpunkte');
// Zum Vergleich: das alte Verfahren nahm jeden Fit ohne Prüfung
var altTreffer = 0;
for (var sd2 = 1; sd2 <= LAEUFE; sd2++) if (Q.channelFit(zufallspfad(260, sd2), 260)) altTreffer++;
ok(altTreffer === LAEUFE, 'Altes Verfahren hätte jeden Zufallspfad als Kanal gezeichnet', Math.round(altTreffer / LAEUFE * 100) + ' %');

console.log('8) Regimewechsel: kürzeres Fenster oder gar kein Kanal');
function sprungReihe(n, seed) {
  var r = rndGen(seed), o = [], p = 305.4;
  for (var i = 0; i < n; i++) { p *= 1 + gaussOf(r) * 0.0003; if (i === Math.floor(n * 0.45)) p *= 1.0028; o.push(p); }
  return o;
}
var langFenster = 0, sprungTreffer = 0;
for (var sd3 = 1; sd3 <= LAEUFE; sd3++) {
  var bc = Q.bestChannel(sprungReihe(260, sd3));
  if (bc) { sprungTreffer++; if (bc.N >= 280) langFenster++; }
}
ok(Math.round(sprungTreffer / LAEUFE * 100) <= 20, 'Serie mit Sprung wird meist abgelehnt', Math.round(sprungTreffer / LAEUFE * 100) + ' %');
ok(langFenster <= sprungTreffer * 0.5, 'Wenn überhaupt, dann kein langes Fenster über den Sprung hinweg', langFenster + ' von ' + sprungTreffer);

console.log('9) Kanten an Hoch/Tief statt nur Schlusskursen');
var r9 = rndGen(11);
var basis = echterKanal(300, 5, 0.20);
var hoch = basis.map(function (c) { return c + Math.abs(gaussOf(r9)) * 0.30; });
var tief = basis.map(function (c) { return c - Math.abs(gaussOf(r9)) * 0.30; });
var cSchluss = Q.bestChannel(basis);
var cHL = Q.bestChannel(basis, undefined, { highs: hoch, lows: tief });
ok(!!cSchluss && !!cHL, 'beide Varianten liefern einen Kanal');
ok(cHL.widthPct > cSchluss.widthPct, 'Kanal mit Hoch/Tief ist breiter (umschließt die echten Extreme)', cHL.widthPct + ' % vs ' + cSchluss.widthPct + ' %');
ok(cHL.hl === true, 'Kanal meldet, dass Hoch/Tief benutzt wurden');

console.log('10) Steigung nur bei statistischer Belastbarkeit');
var flach = [];
var r10 = rndGen(23);
for (var i10 = 0; i10 < 300; i10++) flach.push(200 + Math.sin(i10 / 9) * 1.2 + gaussOf(r10) * 0.15);
var cFlach = Q.bestChannel(flach);
ok(!cFlach || cFlach.trend === 'flat', 'Seitwärts-Schwingung wird nicht als Trendkanal ausgegeben', cFlach ? cFlach.trend + ' (t=' + cFlach.t + ')' : 'kein Kanal');
var steigend = [];
var r11 = rndGen(29);
for (var i11 = 0; i11 < 300; i11++) steigend.push(200 * (1 + 0.02 * i11 / 300) + Math.sin(i11 / 9) * 1.2 + gaussOf(r11) * 0.15);
var cSteig = Q.bestChannel(steigend);
ok(cSteig && cSteig.trend === 'up', 'klarer Aufwärtskanal wird als aufwärts erkannt', cSteig ? cSteig.trend + ' (t=' + cSteig.t + ')' : 'kein Kanal');

console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' TEST(S) FEHLGESCHLAGEN');
process.exit(fails ? 1 : 0);
