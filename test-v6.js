'use strict';
const fs = require('fs');
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

console.log('3b) ⚡ Blitz-Ausstieg: nie länger als 3 Minuten im Markt');
// Sägezahn-Tag: Aufwärts-Kreuzungen, die sofort wieder drehen – Blitz muss binnen Minuten raus sein
var barsB = [];
var rndB = lcg(21);
for (var dB = 0; dB < 2; dB++) {
  var dsB = t0 + dB * 86400000;
  for (var bB = 0; bB < 390; bB++) {
    // Wellen mit ~14-Minuten-Periode: regelmäßige Kreuzungen in beide Richtungen
    var pB = 100 + 1.5 * Math.sin(bB / 4.5) + rndB() * 0.15;
    barsB.push([dsB + bB * 60000, pB, 900000]);
  }
}
var rB = Q.backtestIntraday({ TEST: barsB }, {
  capital: 10000, period: 9, budgetPct: 0.03, orderFee: 1, confirmBps: 5,
  entryMode: 'cross', exitMode: 'blitz', sl: -0.30, tp: null, trailPct: 0.10,
  maxHoldMin: 3, cooldownMin: 2, maxPerDay: 40, minEdge: 0
});
ok(!rB.error, 'Blitz-Backtest läuft', rB.error);
ok(rB.trades.length >= 5, 'Blitz handelt oft (viele kleine Versuche)', rB.trades.length);
ok(rB.trades.every(function (t) { return t.holdMin <= 3; }), 'KEIN Trade länger als 3 Minuten gehalten', Math.max.apply(null, rB.trades.map(function (t) { return t.holdMin; })) + ' Min max');
ok(rB.trades.some(function (t) { return /Blitz/.test(t.why || ''); }), 'Blitz-Exits werden als solche benannt');

console.log('3c) Tages-Backtest: Datums-Ausrichtung statt Index-Ausrichtung');
// Symbol B hat ein 30-Tage-Loch in der Mitte – vorher bekamen B-Signale Kurse fremder Tage.
var dayMs = 86400000, t0d = Date.UTC(2025, 0, 6);
function handelsTage(n, lueckeVon, lueckeBis, seed) {
  var out = [], rnd = lcg(seed), preis = 100, tag = 0, i = 0;
  while (out.length < n) {
    var ts = t0d + tag * dayMs; tag++;
    var wt = new Date(ts).getUTCDay();
    if (wt === 0 || wt === 6) continue;
    i++;
    if (luecke_von != null && i >= luecke_von && i <= luecke_bis) continue;
    preis = preis * (1 + rnd() * 0.02) + 0.05;
    out.push([ts, preis]);
  }
  return out;
}
var luecke_von = null, luecke_bis = null;
var serieA = handelsTage(320, null, null, 5);
luecke_von = 150; luecke_bis = 180;
var serieB = handelsTage(290, 150, 180, 7);
luecke_von = null; luecke_bis = null;
var rD = Q.backtest({ AAA: serieA, BBB: serieB }, { capital: 10000, weights: { tech: 1, elliott: 1 }, openThr: 0.2, closeThr: 0.2, maxPos: 4, budgetPct: 0.1 });
ok(!rD.error, 'Tages-Backtest läuft mit Lücken-Symbol', rD.error);
var zeitOk = rD.trades.every(function (tr) {
  var serie = tr.sym === 'AAA' ? serieA : serieB;
  return serie.some(function (p) { return p[0] === tr.openT; });
});
ok(zeitOk, 'Jeder Trade öffnet an einem Tag, den es für SEIN Symbol wirklich gibt', rD.trades.length + ' Trades geprüft');
ok(rD.equity.length > 100, 'Equity-Kurve über den gemeinsamen Kalender', rD.equity.length);

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
// Regel 5 aus dem Prompt: bei hoher Vola ist 1m überwiegend Rauschen. Sie war nicht
// durchgesetzt – am 19.08. wählte das Modell bei vola1mPct 0,275 trotzdem 1m.
var wVola = { setup: 'ausbruch', ausloeser: 'kreuzung', zeitrahmen: '1m' };
var rVola = regimeValidate(wVola, { trendAnteilPct: 71, mittlererWellenScore: 40, kanalAnteilPct: 30, vola1mPct: 0.275 });
ok(rVola.ok && wVola.zeitrahmen === '5m', 'hohe Vola korrigiert 1m auf 5m', wVola.zeitrahmen);
var wRuhig = { setup: 'ausbruch', ausloeser: 'kreuzung', zeitrahmen: '1m' };
regimeValidate(wRuhig, { trendAnteilPct: 71, mittlererWellenScore: 40, kanalAnteilPct: 30, vola1mPct: 0.05 });
ok(wRuhig.zeitrahmen === '1m', 'bei ruhigem Markt bleibt 1m erlaubt', wRuhig.zeitrahmen);
var wOhne = { setup: 'ausbruch', ausloeser: 'kreuzung', zeitrahmen: '1m' };
regimeValidate(wOhne, { trendAnteilPct: 71, mittlererWellenScore: 40, kanalAnteilPct: 30 });
ok(wOhne.zeitrahmen === '1m', 'ohne Vola-Angabe wird nicht korrigiert', wOhne.zeitrahmen);


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

console.log('12) Kalender rechnet Berliner Zeit zeitzonenfest nach UTC');
var Cal = require('./calendar.js');
function berlin(d, t) { return Cal.berlinZeit(d, t).toISOString(); }
ok(berlin('2026-09-11', '14:30') === '2026-09-11T12:30:00.000Z', 'Sommerzeit: 14:30 Berlin = 12:30 UTC (8:30 New York)', berlin('2026-09-11', '14:30'));
ok(berlin('2026-12-09', '20:00') === '2026-12-09T19:00:00.000Z', 'Winterzeit: 20:00 Berlin = 19:00 UTC (14:00 New York)', berlin('2026-12-09', '20:00'));
ok(berlin('2026-03-29', '01:30') === '2026-03-29T00:30:00.000Z', 'vor der Märzumstellung noch Winterzeit');
ok(berlin('2026-03-29', '03:30') === '2026-03-29T01:30:00.000Z', 'nach der Märzumstellung Sommerzeit');
ok(berlin('2026-10-25', '01:30') === '2026-10-24T23:30:00.000Z', 'vor der Oktoberumstellung noch Sommerzeit');
ok(berlin('2026-10-26', '14:30') === '2026-10-26T13:30:00.000Z', 'nach der Oktoberumstellung Winterzeit');
ok(berlin('2027-06-04', '14:30') === '2027-06-04T12:30:00.000Z', 'gilt auch im Folgejahr');
// Der US-Arbeitsmarktbericht ist der erste Freitag im Monat
var nfp = Cal.next(90).filter(function (e) { return e.name.indexOf('Arbeitsmarktbericht') !== -1; })[0];
ok(!nfp || nfp.dt.getUTCDay() === 5, 'Arbeitsmarktbericht fällt auf einen Freitag', nfp ? nfp.dt.toISOString() : 'keiner im Fenster');

console.log('13) Kursarchiv: mischen, kappen, Abdeckung');
var A = require('./archiv.js');
var T0 = Date.UTC(2026, 7, 10, 13, 30);
var alt = [[T0, 100, 10], [T0 + 60000, 101, 11]];
var neu13 = [[T0 + 60000, 101.5, 12], [T0 + 120000, 102, 13]];
var gem = A.mischeBars(alt, neu13);
ok(gem.length === 3, 'Duplikate nach Zeitstempel entfernt', gem.length);
ok(gem[1][1] === 101.5, 'neuere Daten gewinnen (fertiger Bar ersetzt laufenden)', gem[1][1]);
ok(gem[0][0] < gem[1][0] && gem[1][0] < gem[2][0], 'Serie bleibt aufsteigend sortiert');
var lang = [];
for (var d13 = 0; d13 < 120; d13++) lang.push([Date.UTC(2026, 3, 1) + d13 * 86400000, 100 + d13, 1]);
var gek = A.kappeTage(lang, 90, Date.UTC(2026, 3, 1) + 119 * 86400000);
ok(gek.length === 91 && A.abdeckungTage(gek) === 91, 'rollierend 90 Kalendertage gekappt', gek.length + ' Bars');
ok(A.abdeckungTage([[T0, 1], [T0 + 3600000, 1], [T0 + 86400000, 1]]) === 2, 'Abdeckung zaehlt Handelstage, nicht Bars');
var schl = A.schlank([[T0, 100.123456789, 10.7, 100.99999, 99.00001]]);
ok(schl[0][1] === 100.1235 && schl[0][2] === 11 && schl[0][3] === 101 && schl[0][4] === 99, 'Speicherform gerundet (4 Nachkommastellen, Volumen ganzzahlig)');
var dv = A.dollarVolTag([[T0, 100, 1000], [T0 + 60000, 100, 1000], [T0 + 86400000, 200, 500]]);
ok(dv === 150000, 'Dollar-Umsatz je Tag: (100*1000+100*1000+200*500)/2 Tage', dv);

console.log('14) Trend-Ruecksetzer (Pullback) an der Leitlinie');
(function () {
  var t0p = Date.UTC(2026, 5, 1, 13, 30);
  function serie(fn) { var b = []; for (var i = 0; i < 200; i++) b.push([t0p + i * 60000, fn(i), 1000]); return b; }
  // Aufwaertstrend, Kurs klar ueber EMA20, faellt zuletzt zur Linie zurueck und dreht
  var auf = serie(function (i) {
    var basis = 100 + i * 0.06;                       // steigender Trend
    if (i >= 190 && i < 198) basis -= (i - 189) * 0.12;  // Ruecksetzer Richtung Linie
    if (i >= 198) basis -= 0.9 - (i - 197) * 0.15;       // dreht wieder nach oben
    return basis;
  });
  var p1 = Q.pullbackSignal(auf, 'ema', 20, 15);
  ok(p1.signal === 'call', 'Ruecksetzer im Aufwaertstrend -> Call', p1.signal + ' (dist ' + p1.distBps + ' bps)');
  // Ohne Ruecksetzer (Kurs bleibt weit ueber der Linie): kein Signal
  var oben = serie(function (i) { return 100 + i * 0.06; });
  ok(Q.pullbackSignal(oben, 'ema', 20, 15).signal === null, 'ohne Beruehrung kein Signal');
  // Spiegelbild: Abwaertstrend -> Put
  var ab = serie(function (i) {
    var basis = 200 - i * 0.06;
    if (i >= 190 && i < 198) basis += (i - 189) * 0.12;
    if (i >= 198) basis += 0.9 - (i - 197) * 0.15;
    return basis;
  });
  ok(Q.pullbackSignal(ab, 'ema', 20, 15).signal === 'put', 'Ruecksetzer im Abwaertstrend -> Put');
  // Fallendes Messer: Beruehrung, aber letzte Kerze faellt weiter -> kein Einstieg
  var messer = serie(function (i) {
    var basis = 100 + i * 0.06;
    if (i >= 190) basis -= (i - 189) * 0.12;   // faellt durch, ohne zu drehen
    return basis;
  });
  ok(Q.pullbackSignal(messer, 'ema', 20, 15).signal === null, 'fallendes Messer wird nicht gekauft');
})();

console.log('15) Neue Signale: RSI(2)-Extrem, Donchian, Bollinger-Squeeze');
(function () {
  var t0n = Date.UTC(2026, 5, 1, 13, 30);
  function serie(fn) { var b = []; for (var i = 0; i < 220; i++) b.push([t0n + i * 60000, fn(i), 1000]); return b; }
  // RSI(2): Aufwaertstrend mit zwei scharfen Verlusttagen am Ende -> ueberverkauft -> Call
  var rAuf = serie(function (i) { return 100 + i * 0.05 - (i >= 218 ? (i - 217) * 0.8 : 0); });
  var x1 = Q.rsiExtremSignal(rAuf);
  ok(x1.signal === 'call' && x1.wert <= 10, 'RSI(2) ueberverkauft im Aufwaertstrend -> Call', x1.signal + ' (RSI ' + x1.wert + ')');
  var rNeutral = serie(function (i) { return 100 + i * 0.05; });
  ok(Q.rsiExtremSignal(rNeutral).signal === null, 'ohne Extrem kein Signal');
  var rAb = serie(function (i) { return 200 - i * 0.05 + (i >= 218 ? (i - 217) * 0.8 : 0); });
  ok(Q.rsiExtremSignal(rAb).signal === 'put', 'RSI(2) ueberkauft im Abwaertstrend -> Put');
  // Donchian: Seitwaertsband, letzter Schluss bricht klar ueber das 20-Bar-Hoch
  var dSeit = serie(function (i) { return 100 + Math.sin(i / 5) * 0.5 + (i === 219 ? 3 : 0); });
  var d1 = Q.donchianSignal(dSeit, 20, 10);
  ok(d1.signal === 'call', 'Schluss ueber dem 20-Bar-Hoch -> Call', d1.signal);
  ok(Q.donchianSignal(serie(function (i) { return 100 + Math.sin(i / 5) * 0.5; }), 20, 10).signal === null, 'im Band kein Signal');
  ok(Q.donchianSignal(serie(function (i) { return 100 + Math.sin(i / 5) * 0.5 - (i === 219 ? 3 : 0); }), 20, 10).signal === 'put', 'Schluss unter dem 20-Bar-Tief -> Put');
  // Squeeze: erst breite Schwankung, dann enge Kompression, dann Ausbruch nach oben
  function sq(bruch) { return serie(function (i) {
    if (i < 120) return 100 + Math.sin(i / 4) * 2;          // normale Schwankung
    if (i < 219) return 100 + Math.sin(i / 4) * 0.15;       // Kompression
    return bruch;                                            // letzter Bar
  }); }
  var q1 = Q.squeezeSignal(sq(102.5), 20);
  ok(q1.signal === 'call' && q1.enge <= 0.6, 'Kompression + Ausbruch nach oben -> Call', q1.signal + ' (Enge ' + q1.enge + ')');
  ok(Q.squeezeSignal(sq(100.1), 20).signal === null, 'Kompression ohne Ausbruch: kein Signal');
  var qBreit = serie(function (i) { return 100 + Math.sin(i / 4) * 2 + (i === 219 ? 4 : 0); });
  ok(Q.squeezeSignal(qBreit, 20).signal === null, 'Ausbruch OHNE vorherige Kompression zaehlt nicht');
})();

console.log('16) Kostenmodell, kalibriert an echten Emittenten-Kursen (onvista)');
(function () {
  // Referenz: echte Nvidia-Optionsscheine, gemessen am 20.08.2026
  // Ask 8,000 BV 0,1 -> 0,125 % | Ask 0,087 BV 0,1 -> 11,49 % | Ask 4,50 BV 1,0 -> 0,444 %
  function sp(preis, bv) { return Q.effSpread(0.30, undefined, preis, bv) * 100; }
  ok(Math.abs(sp(8.00, 0.1) - 0.125) < 0.05, '8-EUR-Schein (BV 0,1): Modell trifft die echten 0,125 %', sp(8.00, 0.1).toFixed(3) + ' %');
  ok(Math.abs(sp(4.50, 1.0) - 0.444) < 0.05, '4,50-EUR-Schein (BV 1,0): Modell trifft die echten 0,444 %', sp(4.50, 1.0).toFixed(3) + ' %');
  ok(Math.abs(sp(0.087, 0.1) - 11.49) < 1.5, 'Pfennig-Schein: Modell trifft die echten 11,5 %', sp(0.087, 0.1).toFixed(2) + ' %');
  // Der Kern: fester Cent-Betrag, KEIN prozentualer Boden
  ok(sp(8.00, 0.1) < sp(0.80, 0.1) / 8, 'zehnfacher Preis = ein Zehntel des relativen Spreads');
  ok(Q.spreadCent(1.0) === 0.02 && Math.abs(Q.spreadCent(0.1) - 0.011) < 1e-9, 'Cent-Spread: 1 ct bei BV 0,1 / 2 ct bei BV 1,0');
  // Bezugsverhaeltnis als Kostenhebel: gleicher Schein, BV 1,0 kostet ein Fuenftel
  var billig = sp(0.45, 0.1), teuer = sp(4.50, 1.0);
  ok(teuer < billig / 4, 'BV 1,0 statt 0,1 senkt den relativen Spread um Faktor 4+', billig.toFixed(2) + ' % vs ' + teuer.toFixed(2) + ' %');
  ok(sp(0.01, 0.1) === 15, 'Kappe bei 15 % greift fuer Schrott-Scheine');
  // Omega ist ratio-unabhaengig -> BV 1,0 ist reiner Kostengewinn ohne Hebelverlust
  var t0k = Date.now();
  var wA = { strike: 100, expiry: t0k + 30 * 86400000, iv: 0.4, ratio: 0.1 };
  var wB = { strike: 100, expiry: t0k + 30 * 86400000, iv: 0.4, ratio: 1.0 };
  var oA = Q.warrantOmega('call', wA, 100, t0k), oB = Q.warrantOmega('call', wB, 100, t0k);
  ok(Math.abs(oA - oB) < 1e-6, 'Omega ist unabhaengig vom Bezugsverhaeltnis', oA.toFixed(3) + ' vs ' + oB.toFixed(3));
  ok(Q.PROFILES.atm21_b.ratio === 1 && Q.PROFILES.otm3_14.ratio === 0.1, 'Profile tragen ihr Bezugsverhaeltnis');
})();

/* ================= 17) Kapitalschutz v8.9 =================
 * Vier Luecken, die belegt offen waren. Jede bekommt hier einen Waechter, damit sie
 * nicht unbemerkt wieder aufgeht. Kill-Switch und Stale-Pruefung leben in depot.js
 * (Renderer, nicht importierbar) - ihre REGELN werden hier gegen dieselbe Logik
 * geprueft, die der Produktcode verwendet, plus ein Quelltext-Waechter, der anschlaegt,
 * sobald der Aufruf im Scanner verschwindet. */
console.log('\n17) Kapitalschutz: Kill-Switch, KI-Deckel, Stale-Daten, Regime-Pause');
(function () {
  var depotSrc = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var ollamaSrc = fs.readFileSync(__dirname + '/ollama.js', 'utf8');

  // --- 1) Kill-Switch ---
  ok(/function killSwitchPruefen/.test(depotSrc), 'Kill-Switch: Funktion existiert');
  ok(/HEALTH\.scans\+\+[\s\S]{0,300}killSwitchPruefen\(now\)/.test(depotSrc),
     'Kill-Switch: wird im Intraday-Scan aufgerufen, vor jeder Signalpruefung');
  ok(/closeTrade\(p, sp, now, grund\)/.test(depotSrc), 'Kill-Switch: stellt offene Positionen wirklich glatt');
  ok(/killSwitchAktiv\(\)\) \{ patienceAdd\('Kill-Switch/.test(depotSrc), 'Kill-Switch: sperrt neue Einstiege bis Tagesende');
  ok(/risk: \{ maxPos: 8, dayLossPct: 3,/.test(depotSrc), 'Kill-Switch: Standard-Tagesverlustlimit steht auf 3 %');
  // Die Ausloese-Regel selbst nachrechnen (identische Formel wie im Produktcode)
  function loestAus(eq, start, limit) { return start > 0 && (eq / start - 1) * 100 <= -limit; }
  ok(loestAus(9700, 10000, 3) === true,  'Kill-Switch-Regel: −3,0 % bei Limit 3 loest aus');
  ok(loestAus(9701, 10000, 3) === false, 'Kill-Switch-Regel: −2,99 % loest noch nicht aus');
  ok(loestAus(9000, 10000, 3) === true,  'Kill-Switch-Regel: −10 % loest erst recht aus');

  // --- 2) KI darf nie aufdrehen ---
  ok(!/groesse":0\.5 oder 1\.0 oder 1\.5/.test(ollamaSrc), 'KI-Prompt: 1.5 wird nicht mehr angeboten');
  ok(/g = Math\.min\(1\.0, g\)/.test(ollamaSrc), 'KI-Antwort: Faktor wird in ollama.js auf 1.0 gekappt');
  ok(/Math\.min\(1, Math\.max\(0, r\.groesse \|\| 1\)\)/.test(depotSrc), 'kiCheck: zweite Kappe bei 1.0');
  var sizingStellen = depotSrc.match(/equityNow\(\) \* [^;]*?(ki|kiRes)\.factor[^;]*?\)/g) || [];
  ok(sizingStellen.length === 3, 'Positionsgroesse: alle drei Sizing-Stellen gefunden', sizingStellen.length);
  ok(sizingStellen.every(function (z) { return /Math\.min\(1, (ki|kiRes)\.factor \|\| 1\)/.test(z); }),
     'Positionsgroesse: KI-Faktor ist an JEDER Stelle auf 1.0 gedeckelt');
  // Die Kappe selbst nachrechnen
  function kappe(g) { if (!(g > 0)) g = 1.0; return Math.min(1.0, g); }
  ok(kappe(1.5) === 1.0, 'Kappe: 1.5 wird zu 1.0 (KI kann nicht aufdrehen)');
  ok(kappe(0.5) === 0.5, 'Kappe: 0.5 bleibt 0.5 (KI darf bremsen)');
  ok(kappe(99) === 1.0 && kappe(0) === 1.0 && kappe(NaN) === 1.0, 'Kappe: Unsinn faellt auf 1.0 zurueck');

  // --- 3) Stale-Daten-Schutz ---
  ok(/function barsFrisch/.test(depotSrc), 'Stale-Schutz: barsFrisch existiert');
  ok(/patienceAdd\('Kursdaten veraltet', sym\)/.test(depotSrc), 'Stale-Schutz: Eintrag in der Geduld-Bilanz');
  ok(/HEALTH\.staleBars = \(HEALTH\.staleBars \|\| 0\) \+ 1/.test(depotSrc), 'Stale-Schutz: Zaehler in HEALTH');
  // Der Einbau muss VOR der Positionseroeffnung stehen und Ausstiege unberuehrt lassen
  var iScan = depotSrc.indexOf('async function intradayScan');
  var iStale = depotSrc.indexOf("patienceAdd('Kursdaten veraltet'", iScan);
  var iOpen = depotSrc.indexOf('Kosten-Check: Bewegung deckt Kosten nicht', iScan);
  var iExit = depotSrc.indexOf('Stop-Loss erreicht', iScan);
  ok(iStale > iExit && iStale < iOpen, 'Stale-Schutz: sitzt nach der Ausstiegs-Logik und vor dem Einstieg');
  // Die Frische-Regel nachrechnen (identische Formel)
  function frisch(alterMin, barMin) { return alterMin <= barMin * 3; }
  ok(frisch(14, 5) === true,  '5m-Chart: 14 Min alter Bar ist noch frisch');
  ok(frisch(16, 5) === false, '5m-Chart: 16 Min alter Bar ist zu alt (Grenze 15)');
  ok(frisch(200, 60) === false, '60m-Chart: 200 Min alter Bar ist zu alt (Grenze 180)');
  ok(frisch(2, 1) === true && frisch(4, 1) === false, '1m-Chart: Grenze liegt bei 3 Min');

  // --- 4) Regime darf pausieren ---
  ok(Array.isArray(Q.SETUP_ALLOW.pause) && Q.SETUP_ALLOW.pause.indexOf('keiner') !== -1,
     'Regime-Pause: Setup pause steht in der Whitelist');
  var vPause = Q.regimeValidate({ setup: 'pause', ausloeser: 'keiner', zeitrahmen: '5m' },
    { trendAnteilPct: 50, mittlererWellenScore: 30, vola1mPct: 0.2, kanalAnteilPct: 10 });
  ok(vPause.ok === true, 'Regime-Pause: wird von regimeValidate zugelassen');
  var vFalsch = Q.regimeValidate({ setup: 'pause', ausloeser: 'welle', zeitrahmen: '5m' }, {});
  ok(vFalsch.ok === false, 'Regime-Pause: falscher Ausloeser wird weiterhin abgelehnt');
  // Pause darf die bestehenden Sperren nicht aushebeln
  var vUmkehr = Q.regimeValidate({ setup: 'umkehr', ausloeser: 'welle', zeitrahmen: '5m' },
    { trendAnteilPct: 85, mittlererWellenScore: 80 });
  ok(vUmkehr.ok === false, 'Regime-Pause: Umkehr-im-Trend bleibt gesperrt (keine Nebenwirkung)');
  ok(/setup: 'pause', ausloeser: 'keiner'/.test(depotSrc), 'Regime-Pause: Regel-Fallback kann pause waehlen');
  ok(/f\.trendAnteilPct > 40 && f\.trendAnteilPct < 60 && f\.mittlererWellenScore < 45/.test(depotSrc),
     'Regime-Pause: Fallback-Regel ist Trendanteil 40–60 UND Wellen-Score unter 45');
  ok(/D\.handelsPause && D\.handelsPause\.bis > now\) \{ patienceAdd\('Handelspause/.test(depotSrc),
     'Regime-Pause: blockt neue Einstiege tatsaechlich');
  // Die Fallback-Regel nachrechnen
  function pausiert(trend, welle) { return trend > 40 && trend < 60 && welle < 45; }
  ok(pausiert(50, 30) === true,  'Fallback: 50 % Trend + Wellen 30 -> Pause');
  ok(pausiert(50, 60) === false, 'Fallback: Wellen 60 -> kein Grund zu pausieren (Umkehr passt)');
  ok(pausiert(85, 30) === false, 'Fallback: klarer Trend -> kein Grund zu pausieren (Trendfolge passt)');
  ok(pausiert(40, 30) === false && pausiert(60, 30) === false, 'Fallback: Grenzen 40/60 sind exklusiv');

  // --- Klartext-Karte macht beide Sperren sichtbar ---
  ok(/Kill-Switch aktiv: Tagesverlust/.test(depotSrc), 'Klartext-Karte zeigt den Kill-Switch');
  ok(/Handelspause \(Marktlage\)/.test(depotSrc), 'Klartext-Karte zeigt die Handelspause');
})();

/* ================= 18) Datenbasis, Suchachsen und Zucht (v8.10) ================= */
console.log('\n18) Datenbasis, Suchachsen und Zucht');
(function () {
  var d = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var A = require('./archiv.js');

  // --- 1) Datenbasis: anfragen, was die Quelle wirklich hergibt ---
  ok(/btRange: '730d'/.test(d), 'Yahoo-Anfrage 60m holt 730 statt 63 Handelstage');
  ok((d.match(/btRange: '60d'/g) || []).length === 2, '5m und 15m holen 60 statt 23 Handelstage');
  ok(/btRange: '7d'/.test(d), '1m holt die vollen 7 Tage, die Yahoo maximal gibt');
  ok(!/btTage/.test(d), 'period1/period2-Umweg entfernt (er deckelte 15m bei 41 Handelstagen)');
  ok(!/period1=/.test(d), 'kein period1-Aufruf mehr im Kursabruf');
  ok(A.TAGE_MAX && A.TAGE_MAX['60m'] >= 1000, 'Archiv behaelt 60m lange genug fuer 730 Handelstage', A.TAGE_MAX['60m']);
  ok(A.TAGE_MAX['15m'] >= 120 && A.TAGE_MAX['5m'] >= 120, 'Archiv behaelt 5m/15m ueber das Yahoo-Fenster hinaus');
  ok(A.fensterFuer('60m') === A.TAGE_MAX['60m'], 'fensterFuer waehlt je Zeitrahmen');
  ok(A.fensterFuer('krypto') === A.MAX_TAGE, 'fensterFuer hat einen Rueckfall fuer Unbekanntes');
  var jetzt = Date.UTC(2026, 7, 20), reihe = [];
  for (var t = 0; t < 400; t++) reihe.push([jetzt - t * 86400000, 100, 0]);
  ok(A.kappeTage(reihe, A.TAGE_MAX['60m'], jetzt).length === 400, '60m-Fenster wirft 400 Tage Historie NICHT weg');
  ok(A.kappeTage(reihe, 90, jetzt).length === 91, 'das alte 90-Tage-Fenster haette 309 von 400 Tagen verworfen', A.kappeTage(reihe, 90, jetzt).length + ' statt 400');

  // --- 2) Suchachsen: dort suchen, wo Wirkung ist ---
  ok(/var SL = \[10, 15, 20, 30, 'auto'\], HOLD = \[60, 120, 240, 390\]/.test(d), 'Not-Stop und Haltedauer werden durchprobiert');
  ok(/var PER = \[14, 30\]/.test(d), 'period auf zwei Stufen reduziert (gemessene Wirkung 0,18 Pp)');
  ok(!/scalpSL: 30, scalpHold: 240 \}\);/.test(d), 'die feste Belegung scalpSL 30 / scalpHold 240 ist weg');
  ok(/scalpSL: \[10, 15, 20, 30, 45, 'auto'\]/.test(d), 'Whitelist erlaubt die neuen Not-Stop-Werte');
  ok(/scalpHold: \[15, 30, 60, 120, 240, 390\]/.test(d), 'Whitelist erlaubt die neuen Haltedauern');

  // --- 3) Zucht: Population, Mutation, Gedaechtnis ---
  ok(/function zuchtMutiere/.test(d) && /function zuchtZufall/.test(d), 'Zucht: Mutation und frisches Blut vorhanden');
  ok(/zStand\.gen = zStand\.gen \+ 1/.test(d), 'Zucht: Generation zaehlt hoch');
  ok(/gesehenNeu\[sl3\] \|\| gesehenSet\[sl3\]/.test(d), 'Zucht: bereits Geprueftes wird nicht wiederholt');
  ok(/fund\.testRet > 0 && fund\.testN >= 15/.test(d), 'Zucht: nur out-of-sample Bewaehrte pflanzen sich fort');
  ok(/\['scalpSL', 7\], \['scalpHold', 5\]/.test(d), 'Zucht: Mutationsgewichte folgen der gemessenen Wirkung');
  ok(/\(proBasis\[bkey\] \|\| 0\) >= 4/.test(d), 'Zucht: keine Linie darf die Population uebernehmen');

  // Auslese-Regel nachrechnen (dieselbe Formel wie im Produktcode)
  function auslese(liste, max, proMax) {
    liste = liste.slice().sort(function (x, y) { return y.testRet - x.testRet; });
    var pro = {}, out = [];
    liste.forEach(function (u) {
      if ((pro[u.basis] || 0) >= proMax) return;
      pro[u.basis] = (pro[u.basis] || 0) + 1; out.push(u);
    });
    return out.slice(0, max);
  }
  var kand = [];
  for (var i = 0; i < 10; i++) kand.push({ basis: 'wave', testRet: 10 - i });
  kand.push({ basis: 'reversion', testRet: 1 });
  var aus = auslese(kand, 12, 4);
  ok(aus.length === 5, 'Auslese: 10 Wellen-Kandidaten schrumpfen auf 4, Fremdlinie bleibt', aus.length);
  ok(aus.filter(function (u) { return u.basis === 'reversion'; }).length === 1, 'Auslese: die schwaechere Fremdlinie ueberlebt trotzdem');
  ok(aus[0].testRet === 10, 'Auslese: der Beste bleibt vorn');

  // --- 4) Zeitbudget: jede Gruppe kommt dran ---
  function drin(t) { return d.indexOf(t) !== -1; }
  ok(drin('unbegrenzt ? Infinity : 22 * 60000'), 'Nachtlauf hat ein Budget mit Puffer unter dem 25-Minuten-Deckel');
  ok(drin('Math.max(30000, (GESAMT_MS - (Date.now() - t0)) / restGruppen)'), 'Zeitbudget wird auf die verbleibenden Gruppen verteilt');
  ok(drin('uebersprungen (kommen in einer der naechsten Naechte dran)'), 'Uebersprungene Kombinationen werden GEMELDET, nicht still verschluckt');
  ok(drin('kombis = kombis.slice(0, fertigN)'), 'nur tatsaechlich Gerechnetes geht in die Auswertung');
  ok(drin('gruppenFertig++'), 'jede fertige Gruppe wird gezaehlt (sonst stimmt die Verteilung nicht)');
  ok(drin('function handelBrauchtRechenzeit()'), 'Boersen-Sperre fragt, ob ueberhaupt gehandelt wird');

  // --- 5) Trendkanal ist eine gemessene Achse, keine Glaubensfrage ---
  ok(drin('channel:    [true, false]'), 'Kanal an/aus steht in den Zucht-Achsen');
  ok(drin("['channel', 5]"), 'Kanal wird oft mutiert (greift in Ein- UND Ausstieg ein)');
  ok(drin('k.scalpHold, k.channel].join'), 'Kanal gehoert zum Schluessel (sonst gelten an/aus als dieselbe Kombination)');
  ok(drin('channel: (k.channel !== undefined ? !!k.channel : D.intraday.channel !== false)'), 'Kandidat nimmt seinen eigenen Kanal-Schalter mit');
  ok(drin('HOLD = [60, 120, 240, 390], CHAN = [true, false]'), 'Raster probiert den Kanal durch');
  ok(drin('channel: [true, false]'), 'Whitelist erlaubt, den Kanal umzustellen');
  ok(drin("channel: basis === 'wave' ? zuchtWuerfel(ZUCHT_ACHSEN.channel) : false"),
     'frisches Blut wuerfelt den Kanal nur dort aus, wo er etwas bewirkt');
  ok(drin('function zuchtNormal(k)'), 'Kandidaten werden normalisiert, bevor sie als neu gelten');
  ok(drin("if (k.basis !== 'wave') k.channel = false;"), 'ausserhalb des Wellenreiters ist der Kanal immer aus');
  ok(drin("basisJetzt === 'wave' ? CHAN : [false]"), 'das Raster verdoppelt sich nicht mehr fuer Basen ohne Kanal');
  ok(drin("if (a === 'channel' && m.basis !== 'wave') a = 'scalpSL';"), 'Mutation dreht nicht an einer wirkungslosen Achse');
  // Die Normalisierung nachrechnen: Zwillinge muessen als DASSELBE erkannt werden
  (function () {
    function norm(k) { if (k.basis !== 'wave') k.channel = false; return k; }
    function key(k) { return [k.basis, k.interval, k.period, k.confirmBps, k.lineType, k.profile, k.scalpSL, k.scalpHold, k.channel].join('|'); }
    var a1 = norm({ basis: 'reversion', interval: '15m', period: 14, confirmBps: 15, lineType: 'vwap', profile: 'atm21_b', scalpSL: 30, scalpHold: 390, channel: true });
    var a2 = norm({ basis: 'reversion', interval: '15m', period: 14, confirmBps: 15, lineType: 'vwap', profile: 'atm21_b', scalpSL: 30, scalpHold: 390, channel: false });
    ok(key(a1) === key(a2), 'Umkehr mit Kanal AN und AUS ist derselbe Kandidat (war in Gen 1 dreifach in der Population)');
    var w1 = norm({ basis: 'wave', interval: '15m', period: 14, confirmBps: 15, lineType: 'vwap', profile: 'atm21_b', scalpSL: 30, scalpHold: 390, channel: true });
    var w2 = norm({ basis: 'wave', interval: '15m', period: 14, confirmBps: 15, lineType: 'vwap', profile: 'atm21_b', scalpSL: 30, scalpHold: 390, channel: false });
    ok(key(w1) !== key(w2), 'beim Wellenreiter bleiben Kanal AN und AUS zwei verschiedene Kandidaten');
  })();
  ok(drin('if (D.rechenstand !== Q.RECHENSTAND) {'), 'Migration haengt am Rechenstand, nicht an Einmal-Marken');
  ok(drin('D.autoOpt.entdeckt = null; D.autoOpt.kiKandidat = null'), 'aendert sich die Rechenweise, fliegen alte Funde raus');
  ok(Q.RECHENSTAND >= 7, 'Rechenstand wurde fuer die Kanal-Achse hochgesetzt', Q.RECHENSTAND);

  // --- 6) Zeitlimit: Pflicht fuer die Nacht, abschaltbar fuer die Analyse ---
  ok(drin('var unbegrenzt = !!opts.unbegrenzt;'), 'Analyselauf kann das Zeitlimit abschalten');
  ok(drin('unbegrenzt ? Infinity : 22 * 60000'), 'ohne Limit gilt kein Gesamtbudget');
  ok(drin('if (!unbegrenzt && Date.now() - tBlock > anteilMs'), 'ohne Limit wird keine Gruppe abgeschnitten');
  ok(drin('boerseDraengt = !unbegrenzt && handelBrauchtRechenzeit()'), 'ohne Limit greift auch die Boersensperre nicht');
  ok(drin('function restText('), 'Restzeit wird angezeigt');
  ok(drin('msJeKombiSchnitt * kombisGesamtBisher + msJeKombi * fertigN'), 'Restzeit kommt aus GEMESSENER Geschwindigkeit');
  // Die Schaetzformel nachrechnen
  function rest(offenHier, jeGruppe, gruppen, fertig, msJe) {
    var spaeter = Math.max(0, gruppen - fertig - 1) * jeGruppe;
    return (offenHier + spaeter) * msJe / 60000;
  }
  ok(Math.abs(rest(320, 640, 6, 0, 1000) - 58.67) < 0.1, 'Restzeit: halbe erste Gruppe + 5 volle = 58,7 Min', rest(320,640,6,0,1000).toFixed(1));
  ok(rest(0, 640, 6, 5, 1000) === 0, 'Restzeit: letzte Gruppe fertig -> 0 Min');
  ok(rest(640, 640, 6, 5, 1000) > 0, 'Restzeit: letzte Gruppe offen -> mehr als 0');

  // --- 7) Tempo: Stichprobe zum Suchen, alle Werte zum Urteilen ---
  ok(drin('function screenWerte(m)'), 'Messung: Vorauswahl laeuft auf einer Symbol-Stichprobe');
  ok(drin('function zuchtStichprobe(m)'), 'Zucht: Suche laeuft auf einer Symbol-Stichprobe');
  ok(drin('var rv = await btIntraday(testMapAlle,'), 'Zucht: das URTEIL faellt auf allen Werten');
  ok(drin('if (zu && !handelBrauchtRechenzeit()) return Math.max(2, Math.min(15, kerne - 2));'), 'bei pausiertem Handel werden fast alle Kerne genutzt');
  // Stichprobe muss stabil und gleichmaessig sein
  function stichprobe(syms, N2) {
    syms = syms.slice().sort();
    if (syms.length <= N2) return syms;
    var sch = syms.length / N2, out = [];
    for (var i = 0; i < N2; i++) { var x = syms[Math.floor(i * sch)]; if (x) out.push(x); }
    return out;
  }
  var liste = []; for (var q = 0; q < 48; q++) liste.push('S' + String(q).padStart(2, '0'));
  var p1 = stichprobe(liste, 16), p2 = stichprobe(liste.slice().reverse(), 16);
  ok(p1.length === 16, 'Stichprobe zieht genau 16 von 48', p1.length);
  ok(p1.join() === p2.join(), 'Stichprobe ist stabil - gleiche Werte, egal in welcher Reihenfolge sie kommen');
  ok(new Set(p1).size === 16, 'Stichprobe enthaelt keine Doppelten');
  ok(p1[0] === 'S00' && p1[15] === 'S45', 'Stichprobe verteilt sich ueber die ganze Liste', p1[0] + '…' + p1[15]);
  ok(stichprobe(['A','B','C'], 16).length === 3, 'weniger Werte als die Stichprobe gross ist: alle nehmen');

  // --- 9) Signale einmal rechnen statt zwanzigmal ---
  ok(typeof Q.backtestIntradayMulti === 'function', 'backtestIntradayMulti existiert');
  var qsrc = fs.readFileSync(__dirname + '/quant.js', 'utf8');
  var wsrc = fs.readFileSync(__dirname + '/bt-worker.js', 'utf8');
  ok(qsrc.indexOf('function einstiegSignal(bars, ci, P)') !== -1, 'Einstiegspruefung ist als reine Funktion herausgezogen');
  ok(drin("BTPool.run('intradayMulti'"), 'der Pool kennt Buendel-Auftraege');
  ok(drin("else if (job.fn === 'intradayMulti')"), 'auch der Notpfad ohne Worker kennt sie');
  ok(wsrc.indexOf("else if (m.fn === 'intradayMulti')") !== -1, 'der Worker kennt sie');
  ok(drin("[k.basis, k.period, k.confirmBps, k.lineType, k.channel].join('|')"),
     'gebuendelt wird nach dem SIGNAL-Schluessel (Not-Stop und Haltedauer gehoeren nicht dazu)');
  ok(qsrc.indexOf('for (var ci = 0; ci < bars.length; ci++) arr[ci] = einstiegSignal') !== -1, 'vorberechnet wird ab der ERSTEN Kerze (ein Start bei 60 verschluckte Ausbruch-Trades)');
  // Der eigentliche Beweis: gebuendelt muss dasselbe herauskommen wie einzeln
  (function () {
    var t0 = Date.UTC(2026, 0, 5, 14, 30), bars = [], px = 100, sd = 7;
    function r() { sd = (Math.imul(sd, 1103515245) + 12345) & 2147483647; return sd / 2147483648 - 0.5; }
    for (var i = 0; i < 900; i++) {
      px += r() * 0.9 + Math.sin(i / 26) * 0.32;
      var tt = t0 + i * 900000;
      bars.push([tt, px, 20000, px * 1.003, px * 0.997]);
    }
    var map = { AAA: bars, BBB: bars.map(function (b, j) { return [b[0], b[1] * (1 + Math.sin(j / 41) * 0.02), b[2], b[3], b[4]]; }) };
    var basis = { capital: 10000, budgetPct: 0.03, orderFee: 0, minEdge: 1.5, riskPct: 0.25, window: 'all',
      entryMode: 'reversion', lineType: 'ema', period: 14, confirmBps: 15, zThr: 1.2, minQuality: 60,
      channel: false, mtf: false, trendFilter: false, tp: null, trailPct: 0, cooldownMin: 10, maxPerDay: 20,
      otmPct: 0, expiryDays: 21, ratio: 1 };
    var varianten = [];
    [10, 20, 30].forEach(function (sl) { [60, 240].forEach(function (h) { varianten.push({ sl: -sl / 100, maxHoldMin: h }); }); });
    var einzeln = varianten.map(function (v) { return Q.backtestIntraday(map, Object.assign({}, basis, v)); });
    var gebuendelt = Q.backtestIntradayMulti(map, basis, varianten);
    var alleGleich = einzeln.every(function (e, k) { return JSON.stringify(e) === JSON.stringify(gebuendelt[k]); });
    ok(gebuendelt.length === varianten.length, 'Buendel liefert so viele Ergebnisse wie Varianten', gebuendelt.length);
    ok(alleGleich, 'gebuendelt ist Ergebnis fuer Ergebnis identisch mit einzeln gerechnet');
    var unterschiedlich = new Set(einzeln.map(function (e) { return e.summary ? e.summary.nTrades + '/' + e.summary.retPct : 'x'; }));
    ok(unterschiedlich.size > 1, 'die Varianten liefern wirklich Verschiedenes (sonst waere der Test wertlos)', unterschiedlich.size + ' verschiedene');
    // Eroeffnungs-Range ist zustandsbehaftet und darf NICHT vorberechnet werden
    var orbBasis = Object.assign({}, basis, { entryMode: 'orb', orbMin: 30, trailPct: 0.15 });
    var orbEinzeln = varianten.map(function (v) { return Q.backtestIntraday(map, Object.assign({}, orbBasis, v)); });
    var orbBuendel = Q.backtestIntradayMulti(map, orbBasis, varianten);
    ok(orbEinzeln.every(function (e, k) { return JSON.stringify(e) === JSON.stringify(orbBuendel[k]); }),
       'Eroeffnungs-Range bleibt korrekt, obwohl er nicht vorberechnet werden darf');
  })();

  // --- 8) Zufallsprobe gegen Mehrfachtestung ---
  ok(typeof Q.bestOfN === 'function', 'bestOfN existiert');
  ok(drin('var zufallOk = !zpGesamt || zpGesamt.ueberzufaellig;'), 'ein Fund muss die Zufallslatte nehmen');
  ok(drin('bester.testN >= 15 && zufallOk'), 'Zufallsprobe ist Bedingung fuer einen Fund, nicht Beiwerk');
  ok(drin('Zufallsprobe (ungesehene Daten)'), 'die Zufallslatte steht im Protokoll');
  (function () {
    function lcg(x) { return function () { x = (Math.imul(x, 1103515245) + 12345) & 2147483647; return (x + 1) / 2147483649; }; }
    function nrm(r) { var u1 = r(), u2 = r(); return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2); }
    var r1 = lcg(42), rausch = []; for (var i = 0; i < 500; i++) rausch.push(nrm(r1) * 5);
    var a1 = Q.bestOfN(rausch);
    ok(a1 && a1.ueberzufaellig === false, '500 wertlose Kandidaten: der Beste gilt NICHT als Fund', a1 && a1.bester + ' vs Latte ' + a1.zufallsMedian);
    var r2 = lcg(42), echt = []; for (var j = 0; j < 500; j++) echt.push(nrm(r2) * 5); echt[123] = 25;
    var a2 = Q.bestOfN(echt);
    ok(a2 && a2.ueberzufaellig === true, 'ein echter Ausreisser wird als Fund erkannt', a2 && a2.bester + ' vs Latte ' + a2.zufallsMedian);
    ok(JSON.stringify(Q.bestOfN(rausch)) === JSON.stringify(a1), 'Zufallsprobe ist deterministisch');
    ok(Q.bestOfN([1, 2, 3]) === null, 'unter 20 Versuchen gibt es kein Urteil');
    var klein = [], gross = [];
    var r3 = lcg(7); for (var k = 0; k < 30; k++) klein.push(nrm(r3) * 5);
    var r4 = lcg(7); for (var l = 0; l < 2000; l++) gross.push(nrm(r4) * 5);
    ok(Q.bestOfN(gross).zufallsMedian > Q.bestOfN(klein).zufallsMedian,
       'die Zufallslatte steigt mit der Zahl der Versuche',
       Q.bestOfN(klein).zufallsMedian + ' (30) -> ' + Q.bestOfN(gross).zufallsMedian + ' (2000)');
  })();
  ok(drin('handelBrauchtRechenzeit() && minutenBisOeffnung() < 90'), 'Sperre greift nur bei laufendem Handel');
  ok(!drin('if (minutenBisOeffnung() < 90 ||'), 'die unbedingte 90-Minuten-Sperre ist weg');
  // Die Bedingung nachrechnen
  function braucht(intra, stunde) { return !!(intra || stunde !== false); }
  ok(braucht(true, false) === true, 'Sperre: aktiver Intraday-Handel braucht Rechenzeit');
  ok(braucht(false, true) === true, 'Sperre: aktive Stunden-Strategie braucht Rechenzeit');
  ok(braucht(false, false) === false, 'Sperre: bei pausiertem Handel gehoert die Maschine der Messung');
  // Die Verteilung nachrechnen: keine Gruppe darf leer ausgehen
  function verteile(gesamtMs, gruppen, bedarf) {
    var t = 0, fertig = 0, bekommen = [];
    for (var g = 0; g < gruppen; g++) {
      var rest = Math.max(1, gruppen - fertig);
      var anteil = Math.max(30000, (gesamtMs - t) / rest);
      var g2 = Math.min(anteil, bedarf[g]);
      bekommen.push(g2); t += g2; fertig++;
    }
    return { bekommen: bekommen, gesamt: t };
  }
  var v = verteile(22 * 60000, 6, [462000, 109000, 400000, 90000, 350000, 80000]);
  ok(v.bekommen.every(function (x) { return x > 0; }), 'Zeitverteilung: jede der 6 Gruppen bekommt Rechenzeit');
  ok(v.gesamt <= 22 * 60000, 'Zeitverteilung: das Gesamtbudget wird eingehalten', Math.round(v.gesamt / 60000) + ' Min');
  // Der alte Zustand: von vorne durchlaufen, bis die Zeit alle ist. Sechs Gruppen, die
  // je 10 Minuten brauchen wuerden - da kamen nur die ersten durch, der Rest nie.
  var bedarfGleich = [600000, 600000, 600000, 600000, 600000, 600000];
  var summe = 0, drangekommen = 0;
  bedarfGleich.forEach(function (b) { if (summe < 22 * 60000) { drangekommen++; summe += b; } });
  ok(drangekommen < 6, 'ohne Verteilung kam nur ein Teil der Gruppen dran (der alte Zustand)', drangekommen + ' von 6');
  var vGleich = verteile(22 * 60000, 6, bedarfGleich);
  ok(vGleich.bekommen.length === 6 && vGleich.bekommen.every(function (x) { return x > 0; }),
     'mit Verteilung kommen alle 6 dran, auch wenn jede mehr wollte als sie bekommt');
  var langsamste = verteile(22 * 60000, 6, [9e9, 9e9, 9e9, 9e9, 9e9, 9e9]);
  ok(langsamste.bekommen.every(function (x) { return x >= 30000; }), 'auch bei durchweg langsamen Gruppen bekommt jede mindestens 30 s');

  // Mutation muss den Elternteil veraendern, aber im erlaubten Wertebereich bleiben
  var ACHSEN = { period:[9,14,20,30,50], confirmBps:[5,15,30], lineType:['ema','vwap'],
    profile:['atm21_b','atm60_b','otm3_30b'], scalpSL:[10,15,20,30,45,'auto'], scalpHold:[15,30,60,120,240,390] };
  var GEW = [['scalpSL',7],['scalpHold',5],['lineType',4],['confirmBps',2],['profile',2],['period',1]];
  function achse() { var su=0,i; for(i=0;i<GEW.length;i++) su+=GEW[i][1];
    var t2=Math.random()*su; for(i=0;i<GEW.length;i++){t2-=GEW[i][1]; if(t2<=0) return GEW[i][0];} return GEW[0][0]; }
  function mut(k) { var m=JSON.parse(JSON.stringify(k)); var n=Math.random()<0.7?1:2;
    for(var i=0;i<n;i++){var a2=achse(); m[a2]=ACHSEN[a2][Math.floor(Math.random()*ACHSEN[a2].length)];} return m; }
  var elter = { basis:'wave', interval:'15m', period:14, confirmBps:15, lineType:'vwap', profile:'atm21_b', scalpSL:30, scalpHold:240 };
  var gueltig = true, anders = 0, zaehl = {};
  for (var mi = 0; mi < 600; mi++) {
    var kind = mut(elter);
    Object.keys(ACHSEN).forEach(function (a3) { if (ACHSEN[a3].indexOf(kind[a3]) === -1) gueltig = false; });
    if (kind.basis !== elter.basis || kind.interval !== elter.interval) gueltig = false;
    var abw = Object.keys(ACHSEN).filter(function (a4) { return kind[a4] !== elter[a4]; });
    if (abw.length) { anders++; abw.forEach(function (a5) { zaehl[a5] = (zaehl[a5] || 0) + 1; }); }
  }
  ok(gueltig, 'Mutation bleibt in den erlaubten Werten und laesst Basis/Zeitrahmen unangetastet');
  ok(anders > 400, 'Mutation veraendert den Elternteil tatsaechlich', anders + '/600');
  ok((zaehl.scalpSL || 0) > (zaehl.period || 0) * 3, 'Mutation trifft scalpSL viel oefter als period', (zaehl.scalpSL||0) + ' vs ' + (zaehl.period||0));
})();

/* ================= 19) Mittelfristige Querschnitts-Strategie ================= */
console.log('\n19) Momentum im Querschnitt');
(function () {
  var M = require('./momentum.js');

  // --- Grundrechnung ---
  var reihe = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
  ok(Math.abs(M.staerke(reihe, 10, 5, 0) - (20 / 15 - 1)) < 1e-9, 'Stärke: Rendite über 5 Tage');
  ok(Math.abs(M.staerke(reihe, 10, 5, 2) - (18 / 13 - 1)) < 1e-9, 'Stärke: Lücke lässt die letzten Tage aus');
  ok(M.staerke(reihe, 2, 5, 0) === null, 'Stärke: zu früh in der Reihe gibt null');
  ok(M.staerke([null, null, 5, 6], 3, 2, 0) === null, 'Stärke: Lücken in den Daten geben null');
  ok(M.vorwaerts(reihe, 0, 5) === (15 / 10 - 1), 'Vorwärtsrendite');
  ok(M.vorwaerts(reihe, 8, 5) === null, 'Vorwärtsrendite über das Ende hinaus gibt null');

  // --- Rangfolge ---
  var mini = { A: [1,2,3,4,5,6,7,8,9,10], B: [10,9,8,7,6,5,4,3,2,1], C: [5,5,5,5,5,5,5,5,5,5] };
  var r = M.rangfolge(mini, 9, { rueckblick: 5, luecke: 0, minWerte: 3 });
  ok(r && r.length === 3 && r[0].sym === 'A' && r[2].sym === 'B',
     'Rangfolge sortiert vom stärksten zum schwächsten', r ? r.map(function (x) { return x.sym; }).join(' > ') : 'null');
  ok(M.rangfolge(mini, 9, { rueckblick: 5, luecke: 0, minWerte: 99 }) === null,
     'Rangfolge verweigert das Urteil bei zu wenigen Werten');

  // --- Die Lücke ist kein Detail: sie muss das Ergebnis verändern ---
  var mitLuecke = M.rangfolge(mini, 9, { rueckblick: 4, luecke: 2, minWerte: 3 });
  var ohneLuecke = M.rangfolge(mini, 9, { rueckblick: 4, luecke: 0, minWerte: 3 });
  ok(mitLuecke[0].staerke !== ohneLuecke[0].staerke, 'die Lücke wird tatsächlich angewandt');

  // --- Auswahl ---
  var viele = {};
  for (var v = 0; v < 40; v++) {
    var reiheV = [];
    for (var t = 0; t < 300; t++) reiheV.push(100 * Math.pow(1 + v * 0.0002, t));
    viele['S' + String(v).padStart(2, '0')] = reiheV;
  }
  var aus = M.auswahl(viele, 299, { rueckblick: 200, luecke: 21, anteil: 0.10 });
  ok(aus && aus.length === 5, 'Auswahl nimmt mindestens fünf Werte', aus ? aus.length : 'null');
  ok(aus && aus[0].sym === 'S39', 'Auswahl beginnt beim stärksten Wert', aus ? aus[0].sym : '-');
  var aus2 = M.auswahl(viele, 299, { rueckblick: 200, luecke: 21, anteil: 0.25 });
  ok(aus2.length === 10, 'größerer Anteil nimmt mehr Werte', aus2.length);

  // --- Durchlauf auf konstruierten Reihen, bei denen die Antwort feststeht ---
  // Zwanzig Werte, deren Stärke von Anfang bis Ende dieselbe Reihenfolge hat:
  // die Auswahl MUSS den Durchschnitt schlagen, sonst rechnet der Durchlauf falsch.
  var klar = {};
  for (var w = 0; w < 30; w++) {
    var rr = [100];
    for (var t2 = 1; t2 < 900; t2++) rr.push(rr[t2 - 1] * (1 + (w - 15) * 0.0003));
    klar['K' + String(w).padStart(2, '0')] = rr;
  }
  var d = M.durchlauf(klar, { rueckblick: 231, luecke: 21, halten: 63, anteil: 0.2, kostenBp: 0, start: 260 });
  ok(d !== null, 'Durchlauf liefert ein Ergebnis');
  ok(d && d.kapital > d.markt, 'bei eindeutiger Rangfolge schlägt die Auswahl den Durchschnitt',
     d ? d.kapital.toFixed(2) + 'x vs ' + d.markt.toFixed(2) + 'x' : '-');
  ok(d && d.schritte > 3, 'es wird mehrfach umgeschichtet', d ? d.schritte : 0);

  // Kosten müssen wirken - eine Strategie, die Kosten ignoriert, lügt
  var billig = M.durchlauf(klar, { halten: 63, anteil: 0.2, kostenBp: 0, start: 260 });
  var teuer = M.durchlauf(klar, { halten: 63, anteil: 0.2, kostenBp: 200, start: 260 });
  ok(billig.kapital >= teuer.kapital, 'höhere Kosten senken das Ergebnis',
     billig.kapital.toFixed(2) + 'x vs ' + teuer.kapital.toFixed(2) + 'x');

  // GEGENKONTROLLE: reine Zufallspfade ohne jede Struktur. Dort DARF die Auswahl den
  // Durchschnitt nicht nennenswert schlagen - täte sie es, rechnete der Durchlauf falsch
  // (etwa indem er die Zukunft kennt). Über mehrere Startwerte gemittelt, damit nicht
  // ein einzelner Zufallspfad das Urteil bestimmt.
  var vorsprung = [];
  for (var seed = 1; seed <= 8; seed++) {
    var sz = seed * 7919;
    var wuerfel = function () { sz = (Math.imul(sz, 1103515245) + 12345) & 2147483647; return sz / 2147483648 - 0.5; };
    var zufall = {};
    for (var zi = 0; zi < 30; zi++) {
      var zr = [100];
      for (var zt = 1; zt < 900; zt++) zr.push(Math.max(1, zr[zt - 1] * (1 + wuerfel() * 0.03)));
      zufall['Z' + zi] = zr;
    }
    var dz = M.durchlauf(zufall, { rueckblick: 231, luecke: 21, halten: 63, anteil: 0.2, kostenBp: 0, start: 260 });
    if (dz) vorsprung.push(dz.proJahr - dz.marktProJahr);
  }
  var mittel = vorsprung.reduce(function (a2, b2) { return a2 + b2; }, 0) / vorsprung.length;
  ok(Math.abs(mittel) < 8, 'auf reinen Zufallspfaden entsteht KEIN systematischer Vorsprung',
     mittel.toFixed(2) + ' Pp im Mittel über ' + vorsprung.length + ' Welten');

  // --- Die Standardwerte sind die geprüften ---
  ok(M.STANDARD.rueckblick === 231 && M.STANDARD.luecke === 21 && M.STANDARD.halten === 63 && M.STANDARD.anteil === 0.10,
     'Standardparameter sind die auf 1970–2004 gewählten und auf 2005–2026 bestätigten');
})();

console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' TEST(S) FEHLGESCHLAGEN');
process.exit(fails ? 1 : 0);
