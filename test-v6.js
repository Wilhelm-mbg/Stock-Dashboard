'use strict';
/* Tests v6: ORB, Auto-Stop, Risiko-Sizing, Resampling/MTF */
var Q = require('./quant.js');
var fails = 0;
function ok(cond, name, extra) {
  console.log((cond ? '  ✅ ' : '  ❌ ') + name + (extra !== undefined ? '  [' + extra + ']' : ''));
  if (!cond) fails++;
}
function lcg(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 - 0.5; }; }

console.log('1) resampleBars & mtfAgrees');
var bars1 = [];
var t0 = Date.UTC(2026, 5, 1, 13, 30);
for (var i = 0; i < 200; i++) bars1.push([t0 + i * 60000, 100 + i * 0.05, 1000]);
var b5 = Q.resampleBars(bars1, 5);
ok(b5.length === 40, '1m→5m: 200 Bars → 40', b5.length);
ok(b5[0][2] === 5000, 'Volumen wird summiert', b5[0][2]);
ok(b5[39][1] === bars1[199][1], 'Schlusskurs = letzter Bar des Bündels');
ok(Q.mtfAgrees(bars1, 'call', 5) === true, 'steigender 5m-Chart bestätigt Call');
ok(Q.mtfAgrees(bars1, 'put', 5) === false, 'steigender 5m-Chart blockt Put');

console.log('2) autoStop (atmender Not-SL)');
var quiet = [], wild = [];
var r1 = lcg(1), r2 = lcg(2);
for (var k = 0; k < 200; k++) { quiet.push(100 + r1() * 0.1); wild.push(100 + r2() * 3); }
var slQ = Q.autoStop(quiet, 15, 12), slW = Q.autoStop(wild, 15, 12);
ok(slQ < 0 && slW < 0, 'Stops negativ', slQ.toFixed(3) + ' / ' + slW.toFixed(3));
ok(Math.abs(slW) > Math.abs(slQ), 'wilder Markt → weiterer Stop', slQ.toFixed(3) + ' vs ' + slW.toFixed(3));
ok(Math.abs(slQ) >= 0.10 && Math.abs(slW) <= 0.45, 'Grenzen 10–45 % eingehalten');

console.log('3) ORB-Backtest (Gap-and-Go-Tag)');
// 3 Tage: enge 30-Min-Range, danach klarer Trend nach oben → ORB-Call muss zünden
var barsO = [];
var rndO = lcg(9);
for (var d = 0; d < 3; d++) {
  var ds = t0 + d * 86400000, base = 100 + d * 2;
  for (var b = 0; b < 390; b++) {
    var p;
    if (b < 30) p = base + rndO() * 0.3;                     // enge Eröffnungs-Range
    else p = base + 0.4 + (b - 30) * 0.012 + rndO() * 0.25;  // Ausbruch + Trend
    barsO.push([ds + b * 60000, p, 900000]);
  }
}
var rO = Q.backtestIntraday({ TEST: barsO }, {
  capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1,
  entryMode: 'orb', orbMin: 30, confirmBps: 15,
  sl: -0.25, tp: null, trailPct: 0.15, maxHoldMin: 0, cooldownMin: 10, maxPerDay: 10, minEdge: 0
});
ok(!rO.error, 'ORB-Backtest läuft', rO.error);
ok(rO.trades.length >= 2 && rO.trades.length <= 6, '~1 Trade je Tag (1 je Richtung max.)', rO.trades.length);
ok(rO.trades.every(function (t) { return t.dir === 'call'; }), 'Gap-and-Go: nur Calls');
ok(rO.summary.retPct > 0, 'Trendtage → ORB im Plus', rO.summary.retPct + ' %');

console.log('4) Risiko-Sizing');
var rFix = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'orb', orbMin: 30, sl: -0.25, tp: null, trailPct: 0.15, cooldownMin: 10, maxPerDay: 10, minEdge: 0 });
var rRisk = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'orb', orbMin: 30, sl: -0.25, tp: null, trailPct: 0.15, cooldownMin: 10, maxPerDay: 10, minEdge: 0, riskPct: 0.5 });
ok(!rRisk.error && rRisk.trades.length > 0, 'Risiko-Sizing läuft', rRisk.trades.length);
// SL −25 %, Risiko 0,5 % von 10000 = 50 $ → Positionswert ≈ 200 $ (vs. fix 300 $)
var pos0 = rFix.trades[0].entry * rFix.trades[0].qty;
var pos1 = rRisk.trades[0].entry * rRisk.trades[0].qty;
ok(Math.abs(pos1 - 200) < 40, 'Positionswert ≈ Risiko/SL (≈200 $)', Math.round(pos1) + ' $ (fix: ' + Math.round(pos0) + ' $)');

console.log('5) sl:"auto" im Backtest');
var rAuto = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'orb', orbMin: 30, sl: 'auto', tp: null, trailPct: 0.15, cooldownMin: 10, maxPerDay: 10, minEdge: 0, maxHoldMin: 60 });
ok(!rAuto.error && rAuto.trades.length > 0, 'auto-SL-Backtest läuft', rAuto.error || rAuto.trades.length);

console.log('6) MTF im Backtest blockt Gegen-Signale');
var rMtf = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'cross', mtf: true, sl: -0.25, tp: 0.35, cooldownMin: 5, maxPerDay: 40, minEdge: 0 });
var rNo = Q.backtestIntraday({ TEST: barsO }, { capital: 10000, period: 20, budgetPct: 0.03, orderFee: 1, entryMode: 'cross', mtf: false, sl: -0.25, tp: 0.35, cooldownMin: 5, maxPerDay: 40, minEdge: 0 });
ok(!rMtf.error && !rNo.error, 'beide laufen');
ok(rMtf.trades.length <= rNo.trades.length, 'MTF filtert (nicht mehr Trades)', rMtf.trades.length + ' vs ' + rNo.trades.length);


console.log('7) Regime-Whitelist: harte Sperren gelten auch gegen das Modell');
// Es wird die ECHTE Funktion aus quant.js getestet – keine Spiegelkopie mehr,
// die bei Änderungen am Produktcode niemals rot werden konnte.
var regimeValidate = Q.regimeValidate;
var trendMarkt = { trendAnteilPct: 85, mittlererWellenScore: 70, kanalAnteilPct: 40, minutenSeitEroeffnung: 60 };
var seitwaerts = { trendAnteilPct: 50, mittlererWellenScore: 70, kanalAnteilPct: 40, minutenSeitEroeffnung: 60 };
ok(!regimeValidate({ setup: 'umkehr', ausloeser: 'welle', zeitrahmen: '1m' }, trendMarkt).ok, 'Umkehr im Trendmarkt wird abgelehnt');
ok(regimeValidate({ setup: 'umkehr', ausloeser: 'welle', zeitrahmen: '1m' }, seitwaerts).ok, 'Umkehr im Seitwärtsmarkt ist erlaubt');
ok(!regimeValidate({ setup: 'umkehr', ausloeser: 'welle', zeitrahmen: '1m' }, { trendAnteilPct: 50, mittlererWellenScore: 20, kanalAnteilPct: 40 }).ok, 'Wellental ohne Wellenmuster wird abgelehnt');
ok(!regimeValidate({ setup: 'ausbruch', ausloeser: 'range', zeitrahmen: '1m' }, { trendAnteilPct: 50, mittlererWellenScore: 20, kanalAnteilPct: 0, minutenSeitEroeffnung: 300 }).ok, 'Eröffnungs-Range am Nachmittag wird abgelehnt');
ok(!regimeValidate({ setup: 'ausbruch', ausloeser: 'welle', zeitrahmen: '1m' }, seitwaerts).ok, 'Auslöser aus dem falschen Setup wird abgelehnt');
ok(!regimeValidate({ setup: 'zocken', ausloeser: 'alles', zeitrahmen: '1m' }, seitwaerts).ok, 'Erfundenes Setup wird abgelehnt');
ok(!regimeValidate({ setup: 'ausbruch', ausloeser: 'kreuzung', zeitrahmen: '1d' }, seitwaerts).ok, 'Unzulässiger Zeitrahmen wird abgelehnt');
var wKanal = { setup: 'ausbruch', ausloeser: 'kreuzung', zeitrahmen: '5m', kanal: true };
regimeValidate(wKanal, { trendAnteilPct: 50, mittlererWellenScore: 50, kanalAnteilPct: 5, minutenSeitEroeffnung: 60 });
ok(wKanal.kanal === false, 'Kanalfilter wird abgeschaltet, wenn es kaum gültige Kanäle gibt');


console.log('8) Strategie-Farm: Bewährung entscheidet, nicht der Backtest');
var U2 = Q.bewaehrungsUrteil;
ok(U2([]) === 'weiter', 'ohne Prüfung wird nichts übernommen');
ok(U2([{ champ: 1, hera: 5, trades: 20, sieger: 'herausforderer' }]) === 'weiter', 'ein einzelner Sieg reicht nicht');
ok(U2([{ champ: 1, hera: 5, trades: 20, sieger: 'herausforderer' },
       { champ: 1, hera: 5, trades: 20, sieger: 'herausforderer' }]) === 'weiter', 'zwei Siege reichen noch nicht (3 Prüfungen nötig)');
var T0 = Date.UTC(2026, 7, 10, 12, 0), STD = 3600000;
ok(U2([{ at: T0, champ: 1, hera: 5, trades: 6, sieger: 'herausforderer' },
       { at: T0 + 12 * STD, champ: 1, hera: 5, trades: 5, sieger: 'herausforderer' },
       { at: T0 + 26 * STD, champ: 1, hera: 5, trades: 6, sieger: 'herausforderer' }]) === 'uebernehmen', 'drei Siege über mehr als 20 Stunden → Übernahme');
ok(U2([{ at: T0, champ: 1, hera: 5, trades: 2, sieger: 'herausforderer' },
       { at: T0 + 12 * STD, champ: 1, hera: 5, trades: 2, sieger: 'herausforderer' },
       { at: T0 + 26 * STD, champ: 1, hera: 5, trades: 2, sieger: 'herausforderer' }]) === 'weiter', 'zu wenige Trades → keine Übernahme');
ok(U2([{ at: T0, champ: 9, hera: 10, trades: 20, sieger: 'herausforderer' },
       { at: T0 + 12 * STD, champ: 9, hera: 10, trades: 20, sieger: 'herausforderer' },
       { at: T0 + 26 * STD, champ: 50, hera: 1, trades: 20, sieger: 'champion' }]) === 'weiter', 'zwei knappe Siege wiegen einen klaren Verlust nicht auf');
ok(U2([{ champ: 5, hera: 1, trades: 20, sieger: 'champion' },
       { champ: 5, hera: 1, trades: 20, sieger: 'champion' },
       { champ: 5, hera: 1, trades: 20, sieger: 'champion' },
       { champ: 5, hera: 1, trades: 20, sieger: 'champion' }]) === 'verwerfen', 'vier Niederlagen → Herausforderer wird verworfen');
ok(U2([{ champ: 1, hera: 5, trades: 20, sieger: 'herausforderer' },
       { champ: 5, hera: 1, trades: 20, sieger: 'champion' },
       { champ: 5, hera: 1, trades: 20, sieger: 'champion' },
       { champ: 5, hera: 1, trades: 20, sieger: 'champion' }]) === 'verwerfen', 'ein Sieg von vier reicht nicht');


console.log('9) Zeitfenster kennen die US-Winterzeit');
// Sommer: Eröffnung 13:30 UTC · Winter: 14:30 UTC
var sommer = Date.UTC(2026, 6, 15, 13, 45);   // 15.07., 15 Min nach Eröffnung
var winter = Date.UTC(2026, 11, 15, 14, 45);  // 15.12., 15 Min nach Eröffnung
ok(Q.usSommerzeit(new Date(sommer)) === true, 'Juli ist Sommerzeit');
ok(Q.usSommerzeit(new Date(winter)) === false, 'Dezember ist Winterzeit');
ok(Q.minutenSeitOeffnung(sommer) === 15, 'Sommer: 15 Minuten nach Eröffnung', Q.minutenSeitOeffnung(sommer));
ok(Q.minutenSeitOeffnung(winter) === 15, 'Winter: 15 Minuten nach Eröffnung', Q.minutenSeitOeffnung(winter));
ok(Q.inWindow(sommer, 'open2') === true, 'Sommer: früher Handel liegt in open2');
ok(Q.inWindow(winter, 'open2') === true, 'Winter: früher Handel liegt in open2');
ok(Q.inWindow(Date.UTC(2026, 11, 15, 18, 30), 'close2') === false, 'Winter: 18:30 UTC ist NICHT die Schlussphase');
ok(Q.inWindow(Date.UTC(2026, 11, 15, 20, 30), 'close2') === true, 'Winter: 20:30 UTC IST die Schlussphase');
ok(Q.inWindow(Date.UTC(2026, 6, 15, 19, 30), 'close2') === true, 'Sommer: 19:30 UTC ist die Schlussphase');
// Grenzfälle der Umstellung
ok(Q.usSommerzeit(new Date(Date.UTC(2026, 2, 7, 12, 0))) === false, 'vor der Märzumstellung: Winterzeit');
ok(Q.usSommerzeit(new Date(Date.UTC(2026, 2, 9, 12, 0))) === true, 'nach der Märzumstellung: Sommerzeit');
ok(Q.usSommerzeit(new Date(Date.UTC(2026, 10, 2, 12, 0))) === false, 'nach der Novemberumstellung: Winterzeit');

console.log('10) Volatilität wird auf das Bar-Raster hochgerechnet');
function reihe(stepMs) {
  var r = lcg2(7), b = [], t = Date.UTC(2026, 5, 1, 13, 30), p = 100;
  for (var i = 0; i < 400; i++) { p *= 1 + r() * 0.002; b.push([t + i * stepMs, p, 900000]); }
  return b;
}
function lcg2(seed) { var s = seed; return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648 - 0.5; }; }
ok(Q.barMinOf(reihe(60000)) === 1, '1-Minuten-Raster wird erkannt');
ok(Q.barMinOf(reihe(300000)) === 5, '5-Minuten-Raster wird erkannt');
var cl = reihe(60000).map(function (b) { return b[1]; });
var ivFalsch = Q.histVolIntraday(cl, 78), ivRichtig = Q.histVolIntraday(cl, 390);
// (der 78er-Wert läuft hier in die Untergrenze von 10 % – der Unterschied ist real noch größer)
ok(ivRichtig > ivFalsch * 1.8, 'Vola auf 1-Min-Basis ist deutlich höher als mit 5-Min-Annahme',
  (ivFalsch * 100).toFixed(1) + ' % vs ' + (ivRichtig * 100).toFixed(1) + ' %');


console.log('11) Bewährung braucht echte Zeit, nicht nur drei Klicks');
var jetzt = Date.UTC(2026, 7, 17, 12, 0);
function pr(hOffset, sieger) { return { at: jetzt + hOffset * 3600000, champ: sieger === 'champion' ? 5 : 1, hera: sieger === 'champion' ? 1 : 5, trades: 8, sieger: sieger }; }
var schnell = [pr(0, 'herausforderer'), pr(0.05, 'herausforderer'), pr(0.12, 'herausforderer')];
ok(Q.bewaehrungsUrteil(schnell) === 'weiter', 'drei Siege in sieben Minuten reichen NICHT', Q.bewaehrungsUrteil(schnell));
var langsam = [pr(0, 'herausforderer'), pr(12, 'herausforderer'), pr(26, 'herausforderer')];
ok(Q.bewaehrungsUrteil(langsam) === 'uebernehmen', 'drei Siege über 26 Stunden reichen', Q.bewaehrungsUrteil(langsam));
var knapp = [pr(0, 'herausforderer'), pr(8, 'herausforderer'), pr(19, 'herausforderer')];
ok(Q.bewaehrungsUrteil(knapp) === 'weiter', '19 Stunden sind noch zu wenig (20 verlangt)', Q.bewaehrungsUrteil(knapp));

console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' TEST(S) FEHLGESCHLAGEN');
process.exit(fails ? 1 : 0);
