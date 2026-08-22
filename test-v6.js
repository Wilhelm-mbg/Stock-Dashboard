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
ok(schl[0][1] === 100.1235 && schl[0][2] === 11 && schl[0][3] === 101 && schl[0][4] === 99.00001,
   'Speicherform gerundet (7 signifikante Stellen, Volumen ganzzahlig)');
/* Der Grund fuer signifikante statt fester Nachkommastellen: Bei billigen Werten waren
 * 4 Nachkommastellen nur drei signifikante Stellen. DOGE steht bei 0,0797 - der
 * Rundungsverlust lag dort bei 0,025 %, bei einer typischen Kerzenbewegung von 0,47 %
 * und Kostenhuerden ab 0,02 %. Die Messbasis haette den Vorsprung verschluckt, den sie
 * belegen soll. Ein Pennystock bei 0,0031415 verlor sogar 1,3 %. */
var billig = A.schlank([[T0, 0.0796800, 5, 0.0031415, 0.00012345678]]);
ok(Math.abs(billig[0][1] / 0.0796800 - 1) < 1e-6, 'billige Werte behalten ihre Genauigkeit (DOGE)', billig[0][1]);
ok(Math.abs(billig[0][3] / 0.0031415 - 1) < 1e-6, 'auch ein Pennystock bleibt genau', billig[0][3]);
ok(Math.abs(billig[0][4] / 0.00012345678 - 1) < 1e-5, 'und ein sehr kleiner Kurs ebenso', billig[0][4]);
ok(A.schlank([[T0, 72843.359375, 1, 72843.359375, 72843.359375]])[0][1] === 72843.36,
   'teure Werte werden weiterhin verschlankt, nicht in voller Laenge gespeichert');
ok(A.schlank([[T0, 0, 1]])[0][1] === 0, 'ein Kurs von null bleibt null (kein Logarithmus von 0)');
var dv = A.dollarVolTag([[T0, 100, 1000], [T0 + 60000, 100, 1000], [T0 + 86400000, 200, 500]]);
ok(dv === 150000, 'Dollar-Umsatz je Tag: (100*1000+100*1000+200*500)/2 Tage', dv);
/* Stempel-Kerzen (Befund 21.08.2026): Yahoo haengt an jede Chart-Antwort einen
 * Eintrag mit der AKTUELLEN Uhrzeit an. Der landete als Pseudo-Kerze mit krummem
 * Zeitstempel dauerhaft in der Messbasis (15:38:27 zwischen 15:30 und 15:45). */
(function () {
  var m = 60000, t15 = T0;
  var mitStempel = [[t15, 100, 10], [t15 + 8 * m + 27000, 100.2, 1], [t15 + 15 * m, 101, 12],
                    [t15 + 30 * m, 102, 11], [t15 + 30 * m + 41000, 102.1, 1]];
  var sauber = A.ohneStempel(mitStempel, 15);
  ok(sauber.length === 3 && sauber[1][0] === t15 + 15 * m && sauber[2][0] === t15 + 30 * m,
     'ohneStempel: krumme Zwischen- und End-Stempel fliegen, echte Nachbarn bleiben', sauber.length);
  var nachtLuecke = [[t15, 1, 1], [t15 + 15 * m, 1, 1], [t15 + 17 * 3600000, 1, 1]];
  ok(A.ohneStempel(nachtLuecke, 15).length === 3, 'ohneStempel: Nacht-Luecken sind KEINE Stempel');
  // Scanner-Seite: Schleife statt Einmal-Kappung - Stempel UND laufende Kerze fallen
  var jetzt = Date.UTC(2026, 7, 21, 14, 0, 3);
  var live = [[jetzt - 3 * 3600000, 1, 1], [jetzt - 2 * 3600000, 1, 1], [jetzt - 90 * m, 1, 1],
              [jetzt - 30 * m, 1, 1], [jetzt - 3000, 1, 1]];
  var f60 = Q.fertigeBars(live, 60, jetzt);
  ok(f60.length === 3 && f60[2][0] === jetzt - 90 * m,
     'fertigeBars: bei 60m fallen Stempel UND laufende Kerze (die alte Einmal-Kappung liess die laufende durch)', f60.length);
  ok(Q.fertigeBars(live, 5, jetzt).length === 4, 'fertigeBars: bei 5m ist nur der Stempel zu jung');
})();

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
  // Drei Schein-Stellen plus zwei Basiswert-Stellen (Bruchstueck-Stueckelung, 21.08.2026).
  // Die Zahl ist der Wachhund: aendert sie sich, ist eine Sizing-Stelle dazugekommen oder
  // verschwunden - und die Deckel-Pruefung darunter muss sie mit erfassen.
  ok(sizingStellen.length === 5, 'Positionsgroesse: alle fuenf Sizing-Stellen gefunden', sizingStellen.length);
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
  ok(/D\.handelsPause && D\.handelsPause\.bis > now && !isRsi2Seit && !isKapitulation\) \{ patienceAdd\('Handelspause/.test(depotSrc),
     'Regime-Pause: blockt neue Einstiege der WIDERLEGTEN Modi');
  /* Inventur 22.08.2026: Die ungemessene Fallback-Pause traf mit "Trendanteil
   * 40-60, wenig Wellen" genau den Seitwaertsmarkt, in dem rsi2seit sein Geld
   * verdient. Fuer die belegten Kanten ist sie deshalb ausgenommen. */
  ok(/handelsPause[\s\S]{0,60}!isRsi2Seit && !isKapitulation/.test(depotSrc),
     'Regime-Pause: die belegten Kanten sind von der ungemessenen Pause ausgenommen');
  // Die Fallback-Regel nachrechnen
  function pausiert(trend, welle) { return trend > 40 && trend < 60 && welle < 45; }
  ok(pausiert(50, 30) === true,  'Fallback: 50 % Trend + Wellen 30 -> Pause');
  ok(pausiert(50, 60) === false, 'Fallback: Wellen 60 -> kein Grund zu pausieren (Umkehr passt)');
  ok(pausiert(85, 30) === false, 'Fallback: klarer Trend -> kein Grund zu pausieren (Trendfolge passt)');
  ok(pausiert(40, 30) === false && pausiert(60, 30) === false, 'Fallback: Grenzen 40/60 sind exklusiv');

  // --- Klartext-Karte macht beide Sperren sichtbar ---
  ok(/Kill-Switch aktiv: Tagesverlust/.test(depotSrc), 'Klartext-Karte zeigt den Kill-Switch');
  ok(/Handelspause \(Marktlage\)/.test(depotSrc), 'Klartext-Karte zeigt die Handelspause');

  // --- Regime-Zuteilung (Studie 21.08.2026): jede Kante nur in ihrem Regime ---
  ok(/regimeZuteilung: false/.test(depotSrc), 'Regime: Default aus (Bestand aendert sich nicht still)');
  ok(/function spyTrendAuf/.test(depotSrc), 'Regime: SPY-Anker-Helfer existiert');
  ok(/SPY_REGIME\.t < 30 \* 60000/.test(depotSrc), 'Regime: SPY-Abruf gecacht (30 min), nicht je Symbol');
  ok(/dir && cfg\.regimeZuteilung/.test(depotSrc), 'Regime: Gate greift erst NACH der Signalfindung');
  ok(/var istKapi = kapiTrade \|\| isKapitulation/.test(depotSrc),
     'Regime: Gate erkennt das Zusatz-Standbein UND den eigenstaendigen Kapitulations-Modus');
  ok(/!istKapi && regimeAuf === false/.test(depotSrc), 'Regime: rsi2seit pausiert nur bei SPY unter EMA200');
  ok(/istKapi && regimeAuf === true/.test(depotSrc), 'Regime: Kapitulation pausiert nur bei SPY ueber EMA200');
  /* Der Gate-Block sass urspruenglich IM rsi2seit-Zweig und war fuer den eigenstaendigen
   * Modus 'kapitulation' unerreichbar. Diese Zusicherung prueft die Verschachtelung:
   * das Gate muss hinter der gesamten Ausloeser-Kette und vor 'if (!dir) continue;' stehen. */
  var iKette = depotSrc.lastIndexOf("} else if (sig.crossed) {");
  var iGate = depotSrc.indexOf('dir && cfg.regimeZuteilung');
  var iWeiter = depotSrc.indexOf('if (!dir) continue;');
  ok(iKette > 0 && iGate > iKette && iWeiter > iGate,
     'Regime: Gate steht HINTER der Ausloeser-Kette, gilt also fuer beide belegten Modi');
  var iRegGate = depotSrc.indexOf('dir && cfg.regimeZuteilung');
  var iRegSchatten = depotSrc.indexOf("schattenNeu('Regime-Filter'", iRegGate);
  ok(iRegGate > 0 && iRegSchatten > iRegGate && iRegSchatten - iRegGate < 900,
     'Regime: geblockte Signale landen im Schattenbuch (Vorwaertstest misst weiter)');
  ok((depotSrc.match(/schattenNeu\('Regime-Filter'/g) || []).length === 2,
     'Regime: beide Kanten schreiben den Schatten');
  ok(/regimeAuf === null|auf: null/.test(depotSrc) && /ohne Anker: Regel setzt aus/.test(depotSrc),
     'Regime: ohne SPY-Daten fail-open (Basis-Verhalten, kein stiller Handelsstopp)');
  var stratSrc = fs.readFileSync(__dirname + '/strategien.js', 'utf8');
  ok(/regimeZuteilung = true/.test(stratSrc), 'Regime: Empfehlungs-Knopf schaltet die Regel an');
  var diagSrc = fs.readFileSync(__dirname + '/diagnose.js', 'utf8');
  ok(/regimeZuteilung: !!\(depot\.intraday && depot\.intraday\.regimeZuteilung\)/.test(diagSrc),
     'Regime: Diagnose meldet den Schalter (weisse Liste)');
  var htmlSrc = fs.readFileSync(__dirname + '/index.html', 'utf8');
  ok(/id="idRegime"/.test(htmlSrc), 'Regime: Haekchen in der Oberflaeche vorhanden');
})();

/* ============ 17b) Oberflaechen-Aufraeumung (UI-Audit 21.08.2026) ============
 * Die Oberflaeche zeigte das alte System: die widerlegte Stunden-Strategie stand
 * an erster Stelle und behauptete "aktiv", ihr Knopf eroeffnete weiter Positionen,
 * sechs Schalter des heutigen Systems waren gar nicht verkabelt, und die
 * Klartext-Karte nannte die belegte Hauptstrategie beim Namen eines widerlegten
 * Modus. Diese Zusicherungen halten den bereinigten Zustand fest. */
console.log('\n17b) Oberflaeche: Altlasten und Verdrahtung');
(function () {
  var d = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var h = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var r = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
  var s = fs.readFileSync(__dirname + '/strategien.js', 'utf8');

  // --- Die widerlegte Stunden-Strategie tritt zurueck ---
  ok(/hourlyEnabled: false/.test(d), 'Stunden-Strategie startet aus (widerlegt)');
  ok(/D\.hourlyEnabled !== false && Math\.abs\(S\) >= OPEN_THR/.test(d),
     'Manueller Lauf eroeffnet nichts mehr, solange die Strategie aus ist');
  ok(/id="archivWiderlegt"/.test(h), 'Widerlegtes liegt im aufklappbaren Archiv');
  var iIntra = h.indexOf('strat-card intraday'), iArchiv = h.indexOf('id="archivWiderlegt"');
  ok(iIntra > 0 && iArchiv > iIntra, 'Die belegte Strategie steht VOR dem Archiv');
  /* Nicht nur "kommt vor": Das Urteil muss VOR der inneren Erklaerungs-Klappe stehen,
   * sonst muesste man die widerlegte Strategie erst aufklappen, um von der
   * Widerlegung zu erfahren. */
  var iArch2 = h.indexOf('id="archivWiderlegt"');
  var iVerdikt = h.indexOf('Widerlegt am 21.08.2026', iArch2);
  var iInnenKlappe = h.indexOf('<details class="how"><summary>Wie sie funktioniert', iArch2);
  ok(iVerdikt > iArch2 && iInnenKlappe > iVerdikt,
     'Das Messurteil steht VOR der inneren Klappe, nicht darin versteckt');
  ok(/t=−11,6|t = −11,6/.test(h), 'Der Messwert der Widerlegung ist erhalten geblieben');
  ok(!/id="weightsPanel"/.test(h), 'Keine Gewichts-Regler mehr fuer drei unbelegte Quellen');
  ok(/getElementById\('weightsPanel'\);\s*\n\s*if \(!el\) return;/.test(d),
     'renderWeights vertraegt das fehlende Panel');

  // --- Die Schalter des heutigen Systems sind wirklich verkabelt ---
  var verkabelt = (d.match(/\.concat\(\[[\s\S]{0,400}?addEventListener\('change', idSave\)/) || [''])[0];
  ['idBlackout', 'idInstrument', 'idPool', 'idKapiZusatz', 'idRegime', 'idMaxStufe', 'idKryptoHandeln'].forEach(function (id) {
    ok(verkabelt.indexOf("'" + id + "'") !== -1, 'Feld ' + id + ' bekommt einen change-Listener');
  });
  ok(/\.filter\(Boolean\)\s*\n\s*\.forEach\(function \(el\) \{ el\.addEventListener\('change', idSave\); \}\)/.test(d),
     'Ein fehlendes Bedienelement kappt nicht mehr die ganze Verkabelung');

  // --- Belegte Kanten behalten ihre gemessene Konfiguration ---
  ok(/if \(m === 'rsi2seit' \|\| m === 'kapitulation'\) \{\s*\n\s*setzeWert\(idI, '60m'\)/.test(d),
     'Auslöser-Wahl stellt die belegten Kanten auf 60m statt auf 1m');
  ok(/setzeWert\(idH, m === 'kapitulation' \? '1560' : '480'\)/.test(d),
     'Auslöser-Wahl bringt auch die gemessene Haltedauer mit');
  ok(/if \(warBelegt\) setzeWert\(idH, '60'\)/.test(d),
     'Beim Verlassen der belegten Kanten bleibt keine 26-Stunden-Haltedauer haengen');
  ['480', '1560'].forEach(function (w) {
    ok(new RegExp('<option value="' + w + '"').test(h), 'Haltedauer ' + w + ' existiert als Auswahl im Formular');
  });
  ok(/rsi2seitZeitrahmenGeprueft/.test(d), 'Einmal-Sicherung zieht Bestandsdepots auf 60m gerade');
  ok(/TRIG_BELEGT = \{ rsi2seit: 1, kapitulation: 1 \}/.test(d), 'Auslöser-Liste kennt den Belegstand');
  ok(/standardTrigger\(setup\)/.test(d) && /setup === 'umkehr' \? 'rsi2seit'/.test(d),
     'Der Umkehr-Standard ist die belegte Kante, nicht der Listenerste');

  // --- Klartext-Karte nennt die Wahrheit ---
  ok(/c\.mode === 'rsi2seit' \|\| c\.mode === 'kapitulation'/.test(d), 'Klartext hat einen Zweig fuer die belegten Kanten');
  ok(/var trigName = \(SETUPS\[st\.setup\]/.test(d), 'Klartext zieht den Namen aus SETUPS statt ihn abzutippen');
  ok(/Math\.round\(\(c\.scalpHold \|\| 480\) \/ 60\)/.test(d), 'Haltedauer kommt aus der Konfiguration, nicht aus dem Text');
  ok(/SPY_REGIME\.auf/.test(d) && !/await spyTrendAuf\(\)[\s\S]{0,200}renderKlartext/.test(d),
     'Klartext liest die Marktlage aus dem Cache - kein Netzabruf im Render-Pfad');
  ok(!/var\(--bad\)/.test(d), 'Kein undefiniertes Farb-Token mehr im Kill-Switch-Kasten');

  // --- Backtest luegt nicht ueber die belegten Kanten ---
  ok(/mode === 'intraday' \|\| mode === 'intradayCompare'[\s\S]{0,160}rsi2seit/.test(d),
     'Backtest bricht fuer die belegten Kanten ab statt eine falsche Zahl zu zeigen');

  // --- Robustheit des Dashboards ---
  ok(/function setzeInhalt/.test(r), 'Dashboard setzt Inhalte nur bei vorhandenem Ziel');
  ok(!/document\.getElementById\('(tiles|bigtech|chips|winners|losers)'\)\.innerHTML/.test(r),
     'Kein ungeprueftes innerHTML mehr im Dashboard (skeletons lief vor dem ersten Kursabruf)');

  // --- Strategien-Uebersicht spiegelt das heutige System ---
  ok(/key: 'stunden'/.test(s), 'Die Uebersicht kennt die widerlegte Strategie samt Schalter');
  ok(/if \(key === 'stunden'\) D\.hourlyEnabled = an;/.test(s), 'Der zweite Schalter schreibt wirklich in den Speicher');
  ok(/getElementById\('hourlyEnabled'\)[\s\S]{0,80}checked = D\.hourlyEnabled !== false/.test(s),
     'Der zweite Schalter zieht den Kippschalter im anderen Reiter nach');
  ok(/window\.__syncStrategyUI/.test(s) && /window\.__syncStrategyUI = function/.test(d),
     'Abzeichen und Klartext-Karte werden aus beiden Reitern heraus aufgefrischt');
  // Der An/Aus-Zustand darf NICHT mehr aus idSave() zurueckgeschrieben werden -
  // sonst ueberschreibt ein beliebiger Feld-Change die Entscheidung aus dem anderen Reiter.
  var iSave = d.indexOf('function idSave()'), iSaveEnd = d.indexOf('renderHandSperre();', iSave);
  ok(iSave > 0 && iSaveEnd > iSave && d.slice(iSave, iSaveEnd).indexOf('D.intraday.enabled =') === -1,
     'idSave schreibt den An/Aus-Zustand nicht mehr zurueck');
  ok(/idE\.addEventListener\('change', function \(\) \{ D\.intraday\.enabled = idE\.checked;/.test(d),
     'Der An/Aus-Zustand kommt nur noch vom eigenen Schalter');
  ok(!/Optionsscheine \(Hebel\)/.test(s), 'Die Intraday-Karte behauptet nicht mehr, mit Schein zu handeln');
  ok(/Regime-Zuteilung/.test(s), 'Die Intraday-Karte nennt die Regime-Zuteilung');

  // --- Farben und Ebenen ---
  ['--series4', '--btn', '--btn-danger', '--btn-ink'].forEach(function (tok) {
    var n = (h.match(new RegExp('\\' + tok + ':', 'g')) || []).length;
    ok(n >= 2, 'Farb-Token ' + tok + ' ist in BEIDEN Themen definiert', n + '×');
  });
  ok(/\.modal-bg \{[^}]*z-index: 100/.test(h), 'Dialoge liegen ueber dem klebenden Cockpit');
  ok(/:focus-visible \{ outline: 2px solid var\(--series\); outline-offset: 2px; \}/.test(h),
     'Der Fokusring verformt die Knoepfe nicht mehr');
  ok(/\.switch input:focus-visible \+ \.knob/.test(h), 'Kippschalter zeigen Tastatur-Fokus');

  // --- Sicherheits-Trio (Inventur 22.08.2026) ---
  // 1) Ausfall der Kursquelle: Exits nachversuchen, Stoerung sichtbar machen, Takt strecken
  ok(/hatOffen\) fds\[ri\] = await fetchIntraday/.test(d),
     'Ausfall: Symbole mit offener Position bekommen einen Sofort-Nachversuch');
  ok(/HEALTH\.exitBlind = \(HEALTH\.exitBlind \|\| 0\) \+ 1/.test(d),
     'Ausfall: unbewachte offene Positionen werden gezaehlt');
  ok(/antworten === 0 && syms\.length >= 5/.test(d), 'Ausfall: Stoerung = kompletter Scan ohne Antwort');
  ok(/HEALTH\.stoerungScans \|\| 0\) >= 2 \? 4 : 1/.test(d), 'Ausfall: Takt wird bei Stoerung vervierfacht');
  ok(/function warnbandSetzen/.test(d) && /id="warnband"/.test(h), 'Warnband existiert und wird bedient');
  // 2) Store-Sicherung
  var m2 = fs.readFileSync(__dirname + '/main.js', 'utf8');
  ok(/SICHERUNG_STORES = \{ depot: true \}/.test(m2), 'Store: das Depot hat Sicherungsgenerationen');
  ok(/\.bak1'\)\) fs\.copyFileSync\(f \+ '\.bak1', f \+ '\.bak2'\)/.test(m2), 'Store: bak1 rotiert nach bak2');
  ok(/__ausSicherung = gen/.test(m2), 'Store: eine geladene Sicherung wird MARKIERT statt still geliefert');
  ok(/if \(D\.__ausSicherung\)/.test(d) && /delete D\.__ausSicherung/.test(d),
     'Store: der Renderer zeigt die Markierung an und entfernt sie vor dem Speichern');
  ok(/storeSet\('depot', D\)\.then\(function \(r\)/.test(d) && /HEALTH\.saveFail/.test(d),
     'Store: save() prueft sein Ergebnis und meldet Fehlschlaege');
  // 3) Edge-Waechter hat jetzt die angekuendigte Konsequenz
  ok(/a\.edgeHistorie\[1\]\.verfall/.test(d), 'Edge-Waechter: Eskalation erst nach ZWEI Naechten Verfall');
  ok(/D\.intraday\.edgePause = \{ seit/.test(d), 'Edge-Waechter: Verfall pausiert neue Einstiege wirklich');
  ok(/schattenNeu\('Edge-Wächter'/.test(d), 'Edge-Waechter: pausierte Signale laufen im Schattenbuch weiter');
  ok(/edgePauseHand/.test(d) && /data-edgefrei/.test(d), 'Edge-Waechter: Hand-Uebersteuerung existiert und wird respektiert');
  ok(/edge\.mittelPp > 0 && D\.intraday\.edgePause\) \{\s*\n\s*delete D\.intraday\.edgePause/.test(d),
     'Edge-Waechter: eine positive Nacht hebt die Pause automatisch auf');
  ok(/ein\.n >= 30 && avgE < 0/.test(d), 'Vorwaertstest: negatives Live-Ergebnis landet im Warnband');
  // 4) Sektor-Klumpen
  ok(/SEKTOR_CHIPS/.test(d) && /schattenNeu\('Sektor-Klumpen'/.test(d),
     'Sektor-Deckel: Halbleiter-Klumpen wird begrenzt UND per Schatten gemessen');
  ok(/Math\.ceil\(klumpenMax \/ 2\)/.test(d), 'Sektor-Deckel: Grenze ist die Haelfte des Richtungs-Deckels');
  // 5) Trendwechsel-Beobachtung (Felix #33/#35)
  var q2 = fs.readFileSync(__dirname + '/quant.js', 'utf8');
  ok(/trendwechsel: trendwechsel/.test(q2), 'Trendwechsel: Detektor ist als reine Funktion exportiert');
  ok(/id="sub-wende"/.test(h) && /data-sub="wende"/.test(h), 'Trendwechsel: eigener Unter-Reiter existiert');
  ok(/Beobachtung, kein Handel/.test(h), 'Trendwechsel: der Reiter sagt ehrlich, dass nicht gehandelt wird');
  ok(/Sekunden-Kerzen \(1\/5\/10 s\) sind mit der Kursquelle nicht möglich/.test(h),
     'Trendwechsel: die Sekunden-Grenze der Datenquelle steht dabei');
  // Wunsch #38 (22.08.2026): die Wende muss im Chart nachvollziehbar sein
  ok(/bild: \{ wpVor: wVor, wpLetzt: wLetzt, kanalVor: kAlt \|\| null, kanalJung: null \}/.test(q2),
     'Trendwechsel-Chart: der Detektor gibt seine Stuetzstellen zum Zeichnen mit');
  ok(/raus\.bild\.kanalJung = kNeu;/.test(q2), 'Trendwechsel-Chart: der junge Kanal wird mitgegeben');
  ok(/data-wende=/.test(d) && /function wendeChartsVerkabeln/.test(d),
     'Trendwechsel-Chart: Zeilen sind anklickbar und verkabelt');
  ok(/function zeichneWendeChart/.test(d) && /WENDE_BARS\[sy\] = sigBars/.test(d),
     'Trendwechsel-Chart: gezeichnet werden genau die geprueften Kerzen, kein zweiter Abruf');
  ok(/ab hier bestätigt/.test(d) && /kein Blick in die Zukunft/.test(d),
     'Trendwechsel-Chart: die Bestaetigungs-Verzoegerung ist im Bild sichtbar und benannt');
  ok(/Beobachtung, kein Handel – Simulation, keine Anlageberatung/.test(d),
     'Trendwechsel-Chart: auch die Chart-Legende bleibt ehrlich');

  // --- Spekulations-Radar (22.08.2026): Anzeige von Fremdinhalten, streng entschaerft ---
  ok(/read-spekulationen/.test(m2) && /spekulationen\.json/.test(m2), 'Radar: Lese-Kanal im Hauptprozess existiert');
  ok(/st\.size > 300000/.test(m2), 'Radar: Groessenkappe gegen ausufernde Dateien');
  var p2 = fs.readFileSync(__dirname + '/preload.js', 'utf8');
  ok(/readSpekulationen/.test(p2), 'Radar: Bruecke ist exponiert');
  ok(/id="spekRadar"/.test(h), 'Radar: Karte auf dem Dashboard vorhanden');
  ok(/Ungemessen, reine Beobachtung/.test(h) && /gehandelt wird hiervon nichts/.test(h),
     'Radar: die Karte sagt ehrlich, dass nichts davon gehandelt wird');
  ok(/esc\(z\.these\)/.test(r) && /esc\(safeUrl\(q\.url\)\)/.test(r),
     'Radar: Fremdinhalte werden escaped, Links nur ueber safeUrl');
  ok(/jetzt - t > 48 \* 3600000\) continue/.test(r), 'Radar: Eintraege aelter als 48 h fallen raus');
  ok(/ein\.slice\(0, 12\)/.test(r), 'Radar: hoechstens 12 Eintraege');
  ok(/spekGesehen\.indexOf\(z\.id\) === -1/.test(r), 'Radar: Benachrichtigung je Eintrag nur einmal');
  ok(/redaktionelle Einschätzung der Suche, keine Messung/.test(r),
     'Radar: die Chance-Einstufung wird als Setzung ausgewiesen');

  // --- Echte Handelskosten aus dem Demo-Konto (22.08.2026) ---
  var c2 = fs.readFileSync(__dirname + '/capital.js', 'utf8');
  ok(/fill: cj\.level != null \? cj\.level : null/.test(c2),
     'Kosten: der echte Ausfuehrungskurs wird beim Eroeffnen zurueckgelesen');
  ok(/ok: true, msg: 'geschlossen', fill: fill/.test(c2),
     'Kosten: auch beim Schliessen - erst beide Seiten ergeben eine Runde');
  ok(/quote: async function/.test(c2) && /spreadPct/.test(c2), 'Kosten: Geld-Brief-Spanne abfragbar');
  ok((c2.match(/demo-api-capital\.backend-capital\.com/g) || []).length >= 1 &&
     !/[^-]api-capital\.backend-capital\.com/.test(c2.replace(/demo-api-capital/g, 'X')),
     'Kosten: weiterhin AUSSCHLIESSLICH der Demo-Host');
  ok(/function kostenMessungNeu/.test(d) && /capSlipOpen == null \|\| p\.capSlipClose == null\) return/.test(d),
     'Kosten: nur vollstaendige Runden zaehlen');
  ok(/function kostenBilanz/.test(d) && /medianPct/.test(d), 'Kosten: Bilanz ueber den Median, kein Ausreisser dominiert');
  ok(/angenommen: /.test(d), 'Kosten: die gemessene Zahl steht neben der Annahme der Studien');
  ok(/kb\.n < 20 \? 'noch zu wenige Runden/.test(d), 'Kosten: unter 20 Runden gibt es kein Urteil');
  var diag2 = fs.readFileSync(__dirname + '/diagnose.js', 'utf8');
  ok(/handelskosten: \(function/.test(diag2) && !/slipOpen/.test(diag2),
     'Kosten: Diagnose meldet nur Aggregate, keine einzelnen Ausfuehrungen');
  ok(/Bilanz der gemessenen Handelskosten/.test(h),
     'Kosten: der Einwilligungstext nennt die neue Kategorie');

  // --- Spannen-Messung: die Kostenhuerde direkt aus Geld/Brief (22.08.2026) ---
  ok(/function spannenProbe/.test(d) && d.indexOf('window.CapAPI.enabled() && window.CapAPI.quote') !== -1,
     'Spannen: Messung laeuft nur mit verbundener Demo-API');
  ok(d.indexOf('window.Dash.marketOpen())) return;') !== -1,
     'Spannen: nur bei offener Boerse (geschlossen sind Spannen wertlos)');
  ok(d.indexOf('i < 6 && i < syms.length') !== -1, 'Spannen: hoechstens sechs Werte je Takt - schont die API');
  ok(d.indexOf('q.spreadPct < 0.2') !== -1, 'Spannen: unplausible Werte werden verworfen');
  ok(/function spannenBilanz/.test(d) && d.indexOf('Erst je Wert den Median') !== -1,
     'Spannen: erst je Wert Median, dann ueber die Werte - kein Symbol dominiert');
  ok(d.indexOf('sp.proben.length < 10) return null') !== -1, 'Spannen: unter zehn Proben gibt es kein Urteil');
  ok(diag2.indexOf('spannen: (function') !== -1 && diag2.indexOf('spreadPct: p') === -1,
     'Spannen: Diagnose meldet nur Aggregate, keine Einzelkurse');
  ok(/quote: async function/.test(c2) && c2.indexOf('/markets/') !== -1,
     'Spannen: die Kursabfrage nutzt den Markt-Endpunkt des Demo-Hosts');
  // --- Massen-Backfill: Messbasis in einem Rutsch vertiefen (22.08.2026) ---
  ok(/function massenBackfill/.test(d), 'Backfill: Massen-Auffuellung existiert');
  ok(d.indexOf("POOLS_60M.ndx100") !== -1, 'Backfill: Nasdaq-100 ist im Universum');
  ok(d.indexOf("massenStop") !== -1 && /function massenAbbrechen/.test(d), 'Backfill: jederzeit anhaltbar');
  ok(d.indexOf("fehlSerie < 3") !== -1 && d.indexOf("1500 * fehlSerie") !== -1,
     'Backfill: bei Fehlern Rueckzug statt Weiterhaemmern - eine gedrosselte API sperrt sonst');
  ok(d.indexOf("opts.pauseMs || 300") !== -1, 'Backfill: feste Pause je Anfrage');
  ok(d.indexOf("si % 10 === 9") !== -1, 'Backfill: Zwischenstand wird laufend gesichert');
  ok((d.match(/minutenSeitOeffnung/g) || []).length >= 2,
     'Backfill: nur Kerzen der regulaeren US-Sitzung (CFDs laufen fast rund um die Uhr)');
  ok(/massenBtn/.test(h) && /massenStopBtn/.test(h), 'Backfill: Knoepfe vorhanden');
  ok(h.indexOf("mit Absicht gedrosselt") !== -1, 'Backfill: die Drosselung wird dem Nutzer erklaert');
  // --- Simulations-Hinweis ueberlebt jeden Umbau ---
  var simH = (h.match(/keine Anlageberatung/gi) || []).length;
  var simD = (d.match(/keine Anlageberatung/gi) || []).length;
  ok(simH >= 4, 'Simulations-Hinweis in der Oberflaeche erhalten', simH + ' Stellen');
  ok(simD >= 4, 'Simulations-Hinweis in den gerenderten Auswertungen erhalten', simD + ' Stellen');
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

/* ================= Zufallsgegenprobe auf der Handelsrichtung =================
 * Sie ist am 21.08.2026 dazugekommen, weil eine Trendfolge-Strategie auf Krypto mit
 * +13,7 % p.a. nach einem Fund aussah - bis dieselbe Rechnung mit gewuerfelter Richtung
 * und gleicher Haltedauer +19,4 % ergab. Der Zufall schlug das Signal. Die Probe ist
 * damit die wichtigste Einzelzahl jeder Messung und muss selbst geprueft sein. */
console.log('\nZufallsgegenprobe (Richtungs-Permutation)');
(function () {
  function trades(n, art, saat) {
    var out = [], z = saat || 12345;
    var r = function () { z ^= z << 13; z ^= z >>> 17; z ^= z << 5; return ((z >>> 0) % 100000) / 100000; };
    for (var i = 0; i < n; i++) {
      var bew = (r() - 0.5) * 4;                       // Kursbewegung rund -2 % bis +2 %
      var dir;
      if (art === 'perfekt') dir = bew > 0 ? 'call' : 'put';
      else if (art === 'verkehrt') dir = bew > 0 ? 'put' : 'call';
      else dir = r() < 0.5 ? 'call' : 'put';
      out.push({ dir: dir, entrySpot: 100, exitSpot: 100 * (1 + bew / 100) });
    }
    return out;
  }
  var gP = Q.gegenprobeRichtung(trades(600, 'perfekt'), 2000);
  var gZ = Q.gegenprobeRichtung(trades(600, 'zufall'), 2000);
  var gV = Q.gegenprobeRichtung(trades(600, 'verkehrt'), 2000);

  ok(gP.ueberzufaellig && gP.pWert <= 0.01, 'ein Signal, das die Richtung immer trifft, gilt als belegt', 'p = ' + gP.pWert);
  ok(!gZ.ueberzufaellig, 'reines Raten gilt NICHT als belegt', 'p = ' + gZ.pWert);
  ok(gZ.pWert > 0.1 && gZ.pWert < 0.9, 'beim Raten liegt p in der Mitte, nicht am Rand', 'p = ' + gZ.pWert);
  ok(!gV.ueberzufaellig && gV.pWert > 0.9, 'ein systematisch verkehrtes Signal gilt nicht als belegt', 'p = ' + gV.pWert);
  ok(Math.abs(gZ.zufallMittel) < 0.05, 'die Zufallsverteilung ist um null zentriert', gZ.zufallMittel);
  ok(gP.quote === 100 && gV.quote === 0, 'Trefferquote wird richtig gezählt', gP.quote + ' % / ' + gV.quote + ' %');

  // Wiederholbarkeit: die Zucht und die Analyse-Zentrale vergleichen Messungen
  // miteinander. Ein schwankendes Urteil auf denselben Daten waere dort Gift.
  var a = JSON.stringify(Q.gegenprobeRichtung(trades(300, 'zufall', 777), 500));
  var b = JSON.stringify(Q.gegenprobeRichtung(trades(300, 'zufall', 777), 500));
  ok(a === b, 'zwei Läufe auf denselben Trades geben dasselbe Urteil');

  // Ohne Kursdaten darf sie nicht raten, sondern muss sich verweigern
  ok(Q.gegenprobeRichtung(trades(8, 'perfekt'), 500).zuWenig === true, 'bei zu wenigen Trades wird kein Urteil gefällt');
  ok(Q.gegenprobeRichtung([{ dir: 'call' }, { dir: 'put' }], 500).zuWenig === true, 'Trades ohne Kursdaten zählen nicht mit');

  // Der Fall, der die Probe ausgeloest hat: ein Signal, das ueberwiegend long steht,
  // waehrend der Markt ohnehin steigt. Es verdient Geld, trifft aber keine Richtung.
  var steigend = [], z2 = 999;
  var r2 = function () { z2 ^= z2 << 13; z2 ^= z2 >>> 17; z2 ^= z2 << 5; return ((z2 >>> 0) % 100000) / 100000; };
  for (var i2 = 0; i2 < 500; i2++) {
    var bew2 = (r2() - 0.42) * 4;                       // Markt mit Aufwaertsdrift
    steigend.push({ dir: r2() < 0.64 ? 'call' : 'put', entrySpot: 100, exitSpot: 100 * (1 + bew2 / 100) });
  }
  var gS = Q.gegenprobeRichtung(steigend, 2000);
  ok(!gS.ueberzufaellig, 'Long-Neigung in einem steigenden Markt gilt NICHT als Richtungstreffer', 'p = ' + gS.pWert + ', echt ' + gS.echt + ' %');
})();

/* ================= Kanal-Verzug =================
 * Ein Regressionskanal beschreibt, was WAR. Er läuft der Bewegung zwangsläufig nach.
 * Am AMD-Chart vom 20.08.2026 meldete er am Tageshoch „aufwärts" und am Tagestief
 * „abwärts" – wer das nicht ausrechnet, hält eine Beschreibung der Vergangenheit für
 * eine Vorhersage. Diese Tests sichern, dass die Zahl stimmt und ehrlich ausfällt. */
console.log('\nKanal-Verzug');
(function () {
  // Ein Verlauf mit klarem Wendepunkt: 200 Kerzen abwärts, dann 120 aufwärts.
  // Die Sinuswelle sorgt für Kanalbreite – ohne Streuung gibt es keine Kanten.
  var w = [];
  for (var i = 0; i < 200; i++) w.push([i * 3600000, 100 - i * 0.15 + Math.sin(i) * 0.3, 1000, 0, 0]);
  for (var j = 0; j < 120; j++) w.push([(200 + j) * 3600000, 70 + j * 0.25 + Math.sin(j) * 0.3, 1000, 0, 0]);
  var vz = Q.kanalVerzug(w, { fenster: 60, maxRueck: 150 });

  ok(vz && vz.trend === 'auf', 'nach der Wende meldet der Kanal aufwärts', vz && vz.trend);
  ok(vz.wendeBei < vz.gemeldetBei, 'der Wendepunkt liegt tiefer als der Meldekurs',
     vz.wendeBei.toFixed(2) + ' < ' + vz.gemeldetBei.toFixed(2));
  ok(vz.verzugKerzen > 0, 'die Meldung kommt NACH dem Wendepunkt, nie davor', vz.verzugKerzen + ' Kerzen');
  ok(vz.anteilVerpasst > 0 && vz.anteilVerpasst < 100, 'der verpasste Anteil liegt zwischen 0 und 100 %', vz.anteilVerpasst + ' %');
  ok(vz.wendeVor > vz.gemeldetVor, 'der Wendepunkt liegt weiter zurück als die Meldung',
     vz.wendeVor + ' vs ' + vz.gemeldetVor);

  // Seitwärts: eine Verzugszahl ohne Richtung hätte kein Vorzeichen, das etwas bedeutet
  var flach = [], r3 = lcg(31);
  for (var k = 0; k < 300; k++) flach.push([k * 3600000, 100 + r3() * 2, 1000, 0, 0]);
  var vzF = Q.kanalVerzug(flach, { fenster: 60 });
  ok(!vzF || vzF.ohneRichtung || vzF.trend !== 'seit' || vzF.anteilVerpasst == null,
     'bei Seitwärtsbewegung wird kein Verzug behauptet');

  ok(Q.kanalVerzug([[0, 1], [1, 2]], { fenster: 60 }) === null, 'zu kurze Reihen geben null statt einer erfundenen Zahl');

  /* Entartete Kanalbreite: Folgt der Kurs der Geraden exakt, lagen das 92.- und das
   * 8.-Perzentil der Abweichungen im Fliesskomma-Rauschen. kanalUeber gab dann null
   * zurück – KEIN Kanal, obwohl die Passgenauigkeit perfekt war. Auf einer glatten
   * Rampe kam abwechselnd ein Ergebnis und null heraus. */
  var rampe = [];
  for (var m = 0; m < 300; m++) rampe.push([m * 3600000, 100 + m * 0.2, 1000, 100 + m * 0.2, 100 + m * 0.2]);
  var leer = 0;
  for (var p2 = 80; p2 < 300; p2++) if (!Q.kanalUeber(rampe, Math.max(0, p2 - 60), p2)) leer++;
  ok(leer === 0, 'eine perfekt gerade Reihe liefert durchgehend einen Kanal, nicht abwechselnd null', leer + ' Lücken');
  var kR = Q.kanalUeber(rampe, 200, 280);
  ok(kR && kR.trend === 'auf' && kR.r2 === 1, 'und sie wird als perfekt passender Aufwärtskanal erkannt', kR && (kR.trend + ', r² ' + kR.r2));
})();

/* ================= Trendfolge im Kanal und durchgehende Märkte ================= */
console.log('\nTrendfolge-Modus');
(function () {
  // Aufwärtsverlauf mit Wellen: der Kanal zeigt nach oben, die Leitlinie wird mehrfach gekreuzt
  var b = [], r = lcg(21);
  for (var i = 0; i < 700; i++) b.push([Date.UTC(2026, 0, 1) + i * 3600000, 100 + i * 0.05 + Math.sin(i / 9) * 1.2 + r() * 0.3]);
  b = b.map(function (x) { return [x[0], x[1], 1000, x[1] * 1.002, x[1] * 0.998]; });
  var P = { ENTRY: 'kanaltrend', LINE: 'ema', period: 20, confirmBps: 5, ZTHR: 1.5, MINQ: 40, CHAN: false, MTF: false, TREND: false };
  var treffer = [], i2;
  for (i2 = 420; i2 < b.length; i2++) { var s = null; try { s = Q.einstiegSignal(b, i2, P); } catch (e) { } if (s) treffer.push(s); }
  ok(treffer.length > 0, 'im Aufwärtskanal feuert der Trendfolge-Einstieg', treffer.length + ' Signale');
  ok(treffer.every(function (s) { return s.dir === 'call'; }),
     'und zwar ausschließlich auf der Kanalseite – nie gegen den Trend',
     treffer.filter(function (s) { return s.dir === 'call'; }).length + ' von ' + treffer.length + ' Call');

  /* Der Modus muss ein AUSLÖSER sein, kein Zustand. Der Kanaltrend allein gilt auf rund
   * 72 % aller Kerzen; wer bei jeder davon kauft, zahlt tausendfach Spanne. Auf BTC feuert
   * er mit der Leitlinien-Kreuzung als Auslöser auf 0,2 % der Kerzen. */
  ok(treffer.length / (b.length - 420) < 0.25,
     'er feuert selten genug, um ein Auslöser zu sein statt eines Dauerzustands',
     Math.round(1000 * treffer.length / (b.length - 420)) / 10 + ' % der Kerzen');

  /* Durchgehende Märkte: Krypto hat keinen Handelsschluss, aber dayKey() teilt bei
   * UTC-Mitternacht. Am 21.08.2026 gemessen, was das anrichtet: 9 von 21 Trades schlossen
   * mit „Tagesschluss-Glattstellung", und zwei völlig verschiedene Ausstiegsmodi lieferten
   * dadurch bis auf die Kommastelle dasselbe Ergebnis. */
  var map = { A: b, B: b.map(function (x, k) { return [x[0], x[1] * (1 + Math.sin(k / 13) * 0.01), 1000, x[3], x[4]]; }) };
  var gemein = { capital: 10000, orderFee: 0, profile: 'atm60_b', budgetPct: 0.05, sl: -0.3, tp: null,
                 minQuality: 40, period: 20, confirmBps: 5, lineType: 'ema', entryMode: 'kanaltrend', channel: false };
  var mitTag = Q.backtestIntraday(map, Object.assign({}, gemein, { exitMode: 'trendhalten' }));
  var ohneTag = Q.backtestIntraday(map, Object.assign({}, gemein, { exitMode: 'trendhalten', tagesschluss: false }));
  if (mitTag.error || ohneTag.error) {
    ok(false, 'Backtest lief durch', (mitTag.error || '') + ' ' + (ohneTag.error || ''));
  } else {
    var tagesGruende = mitTag.trades.filter(function (t) { return /Tagesschluss/.test(t.why || ''); }).length;
    ok(tagesGruende > 0, 'mit Tagesgrenze schließen Positionen am UTC-Tagesende', tagesGruende + ' von ' + mitTag.trades.length);
    ok(ohneTag.trades.filter(function (t) { return /Tagesschluss/.test(t.why || ''); }).length === 0,
       'ohne Tagesgrenze verschwindet dieser Grund vollständig');
    var hMit = mitTag.summary.avgHoldMin, hOhne = ohneTag.summary.avgHoldMin;
    ok(hOhne >= hMit, 'ohne die erfundene Grenze werden Positionen nicht kürzer gehalten', hMit + ' → ' + hOhne + ' Min');
  }
})();

/* ================= Schein-Finder: Kennzahlen und Risikostufe ================= */
console.log('\nSchein-Finder');
(function () {
  var now = Date.UTC(2026, 7, 21, 14, 0);
  function kz(dir, strike, tage, bv, iv) {
    return Q.scheinKennzahlen(dir, { strike: strike, expiry: now + tage * 86400000, iv: iv || 0.35, ratio: bv || 1 }, 100, now);
  }
  var tief = kz('call', 80, 180);
  var atm = kz('call', 100, 60);
  var otm = kz('call', 110, 21);
  ok(tief && atm && otm, 'Kennzahlen werden berechnet');
  ok(tief.omega < atm.omega && atm.omega < otm.omega, 'weiter aus dem Geld = mehr Hebel', tief.omega + ' < ' + atm.omega + ' < ' + otm.omega);
  ok(tief.totalverlustP < atm.totalverlustP && atm.totalverlustP < otm.totalverlustP,
     'weiter aus dem Geld = höhere Totalverlust-Wahrscheinlichkeit', tief.totalverlustP + ' < ' + atm.totalverlustP + ' < ' + otm.totalverlustP);
  ok(tief.thetaWoche > otm.thetaWoche, 'kurzläufige OTM-Scheine verlieren schneller Zeitwert', tief.thetaWoche + ' vs ' + otm.thetaWoche + ' %/Woche');
  ok(kz('put', 100, 60).delta < 0 && atm.delta > 0, 'Delta hat das richtige Vorzeichen');
  ok(Math.abs(atm.breakEven - (atm.strike + atm.wert / atm.ratio)) < 0.01, 'Break-even = Strike + Preis/BV');
  // Der Kostenhebel: BV 1,0 zahlt relativ die kleinste Spanne (Cent-Modell, an echten Kursen geeicht)
  var bvKlein = kz('call', 100, 60, 0.1), bvGross = kz('call', 100, 60, 1.0);
  ok(bvKlein && bvGross && bvGross.spreadPct < bvKlein.spreadPct,
     'BV 1,0 hat die kleinere relative Spanne', bvGross.spreadPct + ' % < ' + bvKlein.spreadPct + ' %');

  ok(Q.scheinRisikostufe(tief).stufe < Q.scheinRisikostufe(kz('call', 110, 10, 1)).stufe,
     'tief im Geld + lange Laufzeit ist defensiver als OTM + kurz');
  ok(Q.scheinRisikostufe(tief).gruende.length > 0, 'jede Stufe kommt mit Begründung');
  var r5 = Q.scheinRisikostufe(kz('call', 112, 8, 1));
  ok(r5.stufe === 5, 'weit OTM + 8 Tage = Stufe 5 (Lotterielos)', 'Stufe ' + r5.stufe);
  ok(Q.scheinRisikostufe(null).stufe === 5, 'auch ohne Kennzahlen gibt es ein Urteil statt eines Absturzes');
  ok(Q.scheinKennzahlen('call', { strike: 110, expiry: now + 7 * 86400000, iv: 0.35, ratio: 0.1 }, 100, now) === null,
     'Pfennig-Scheine (unter 2 Cent) werden aussortiert statt bepreist');

  var raster = Q.scheinRaster(100, 0.35, now);
  ok(raster.length > 300, 'das Raster ist dicht genug zum Filtern', raster.length + ' Scheine');
  ok(raster.every(function (k) { return k.stufe >= 1 && k.stufe <= 5 && k.stufenGruende.length; }),
     'jeder Schein im Raster trägt Stufe und Begründung');
  ok(raster.some(function (k) { return k.stufe === 1; }) && raster.some(function (k) { return k.stufe === 5; }),
     'das Raster deckt die ganze Bandbreite ab');
})();

/* ================= RSI2 im Seitwärtskanal + Basiswert-Pfad =================
 * Ergebnis der Bedingungsstudie vom 21.08.2026 (162 Aktien, Stundenkerzen):
 * RSI(2) unbedingt ist ein Münzwurf (+0,017 Pp), im Seitwärtskanal mit Volumen
 * +0,147 Pp auf 8 h (t = 4,1 über Symbole). Der Vorsprung liegt über der
 * Basiswert-Hürde (0,10 %) und unter der Scheinhürde (0,21 %) – und er zahlt
 * über Nacht aus (streng intraday −0,081 %, mit Nacht +0,230 % je Trade). */
console.log('\nRSI2-Seitwärts und Basiswert-Pfad');
(function () {
  function barsBauen(art, saat) {
    // Seitwärtsband mit Wellen bzw. klarer Trend; Volumen mit einzelnen Spitzen
    var b = [], r = lcg(saat || 11);
    for (var i = 0; i < 400; i++) {
      var kurs = art === 'seit' ? 100 + Math.sin(i / 7) * 2.2 + r() * 0.7
                                : 100 + i * 0.3 + Math.sin(i / 7) * 1.2 + r() * 0.5;
      b.push([Date.UTC(2026, 0, 2, 0, 0) + i * 3600000, kurs, 1000 + (r() > 0.44 ? 900 : 0), kurs * 1.002, kurs * 0.998]);
    }
    return b;
  }
  var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 5, ZTHR: 1.5, MINQ: 0, CHAN: false, MTF: false, TREND: false };
  function zaehle(b) {
    var k = 0;
    for (var i = 320; i < b.length; i++) { var s = null; try { s = Q.einstiegSignal(b, i, P); } catch (e) { } if (s) k++; }
    return k;
  }
  // Saat 21: dieselbe Serie, die unten im Backtest nachweislich handelt. Saat 11 traf
  // zufällig eine Phase, in der der EMA100-Trendfilter INNERHALB von rsiExtremSignal
  // die Dips blockt - das ist Verhalten des Signals, kein Fehler des Modus.
  var seitN = zaehle(barsBauen('seit', 21));
  var trendN = zaehle(barsBauen('trend'));
  ok(seitN > 0, 'im Seitwärtsband feuert der Modus', seitN + ' Signale');
  ok(trendN === 0, 'im klaren Trend feuert er NICHT – der Kanal gibt die Erlaubnis, nicht die Richtung', trendN);

  // Ohne Volumenspitze kein Signal: dieselben Kurse, flaches Volumen
  var flachV = barsBauen('seit').map(function (x) { return [x[0], x[1], 1000, x[3], x[4]]; });
  ok(zaehle(flachV) === 0, 'ohne Volumenbestätigung kein Signal');

  /* --- Basiswert-Instrument: linear, ohne Zeitwert, Bruchstücke erlaubt --- */
  var map = { A: barsBauen('seit', 21), B: barsBauen('seit', 22) };
  var o = { capital: 10000, orderFee: 0, budgetPct: 0.04, sl: -0.9, tp: null, maxHoldMin: 480,
            period: 20, confirmBps: 5, lineType: 'ema', exitMode: 'zeit', minEdge: 0,
            cooldownMin: 60, maxPerDay: 100, entryMode: 'rsi2seit', instrument: 'basis', basisBp: 5, tagesschluss: false };
  var r1 = Q.backtestIntraday(map, o);
  ok(!r1.error && r1.trades.length > 0, 'der Basiswert-Backtest handelt', r1.trades.length + ' Trades');
  ok(r1.trades.every(function (t) { return t.dir === 'call' || t.dir === 'put'; }), 'Richtungen sind gesetzt');
  // Linear heißt: Schein-Ertrag == Basiswert-Ertrag (bis auf die Spanne). Beim Schein
  // wäre der Ertrag um den Hebel vervielfacht und vom Zeitwert verzerrt.
  var linear = r1.trades.every(function (t) {
    if (!t.entrySpot || !t.exitSpot || t.dir !== 'call') return true;
    var basiswert = t.exitSpot / t.entrySpot - 1;
    var schein = t.exit / t.entry - 1;
    return Math.abs(schein - basiswert) < 0.003;   // 2×5 Bp Spanne + Rundung
  });
  ok(linear, 'Basiswert-Trades sind linear: Positionsertrag = Kursbewegung minus Spanne');

  // Ein teurer Wert (Kurs > Kapital×Budget) darf beim Basiswert NICHT herausfallen
  var teuer = { T: barsBauen('seit', 23).map(function (x) { return [x[0], x[1] * 60, x[2], x[3] * 60, x[4] * 60]; }) };
  var r2 = Q.backtestIntraday(teuer, o);
  ok(!r2.error && r2.trades.length > 0, 'Werte über 400 $ werden gehandelt (Bruchstücke)', r2.trades.length + ' Trades');

  // nurRichtung: die Put-Seite kämpft gegen die Drift und wird abgeschaltet
  var r3 = Q.backtestIntraday(map, Object.assign({}, o, { nurRichtung: 'call' }));
  ok(r3.trades.every(function (t) { return t.dir === 'call'; }), 'nurRichtung call lässt keine Puts durch');

  // exitMode 'zeit': kein Signal-Ausstieg – nur Zeit, Stop, Tagesschluss
  var gruende = {};
  r1.trades.forEach(function (t) { gruende[(t.why || '?').split('(')[0].trim()] = 1; });
  ok(!gruende['Gegen-Durchbruch'], 'Zeit-Ausstieg kennt keinen Gegen-Durchbruch', Object.keys(gruende).join(', '));

  // Altlast: Übernacht-Positionen haben eine Nacht Gnade, aber nur eine
  var T9 = Date.UTC(2026, 7, 21, 10, 0);
  ok(Q.altlastGrund({ openT: T9 - 0.8 * 86400000, strategy: 'intraday', uebernacht: true }, T9) === null,
     'eine Übernacht-Position von gestern Abend bleibt beim Start offen');
  ok(Q.altlastGrund({ openT: T9 - 3 * 86400000, strategy: 'intraday', uebernacht: true }, T9) !== null,
     'nach drei Tagen ist auch sie Altlast');
})();

/* ================= Mittelfrist-Depot: Handelslogik ================= */
console.log('\nMittelfrist-Depot');
(function () {
  var MH = require('./mfhandel.js');
  var now = Date.UTC(2026, 7, 21);
  function serie(steig, tage) {
    var r = [];
    for (var i = 0; i < (tage || 300); i++) r.push([now - ((tage || 300) - i) * 86400000, 100 * (1 + steig * i / 300)]);
    return r;
  }
  var roh = { A: serie(0.6), B: serie(0.3), C: serie(-0.3), D: serie(0.1), E: serie(0.05), F: serie(0.02), G: serie(-0.1) };

  /* --- Rangfolge --- */
  var z = MH.momentumZiel(roh, { rueckblick: 231, luecke: 21, anteil: 0.3, minWerte: 5, nowMs: now });
  ok(z.rangfolge[0].sym === 'A' && z.rangfolge[z.rangfolge.length - 1].sym === 'C',
     'die Rangfolge sortiert vom stärksten zum schwächsten', z.rangfolge[0].sym + ' … ' + z.rangfolge[z.rangfolge.length - 1].sym);
  ok(z.ziel.indexOf('C') === -1, 'der schwächste Wert kommt nicht ins Ziel');
  // Eingefrorene Serien: ein Wert, dessen Kurse 30 Tage alt sind, darf nicht mitranken -
  // im fallenden Markt saehe er faelschlich stabil aus
  var alt = Object.assign({}, roh, { H: serie(0.9, 300).map(function (x) { return [x[0] - 30 * 86400000, x[1]]; }) });
  var z2 = MH.momentumZiel(alt, { rueckblick: 231, luecke: 21, anteil: 0.3, minWerte: 5, nowMs: now });
  ok(z2.uebersprungen.indexOf('H') >= 0, 'eingefrorene Serien werden übersprungen statt mitzuranken');
  ok(MH.momentumZiel({ A: serie(0.5) }, { minWerte: 25, nowMs: now }).zuWenig === true,
     'zu wenige Werte: keine Auswahl statt einer dünnen');

  /* --- Umschichtung --- */
  var buch = { cash: 10000, positionen: [] };
  var preise = { A: 150, B: 120, C: 80, D: 110, E: 105, F: 101, G: 90 };
  var plan = MH.planeUmschichtung(z.ziel, buch, preise);
  ok(plan.kaufen.length === z.ziel.length, 'leeres Buch: alles wird gekauft');
  MH.fuehreAus(buch, plan, now, 20);
  var bw = MH.bewerte(buch, preise);
  ok(Math.abs(bw.wert - 10000 * (1 - 0.002)) < 15, 'nach dem Kauf fehlt genau die Spanne (20 Bp)', bw.wert);
  // Zweites Rebalancing: A faellt aus dem Ziel -> verkaufen, X kommt hinein -> kaufen
  var ziel2 = z.ziel.filter(function (s) { return s !== 'A'; }).concat(['G']);
  var plan2 = MH.planeUmschichtung(ziel2, buch, preise);
  ok(plan2.verkaufen.length === 1 && plan2.verkaufen[0].sym === 'A', 'was aus dem Ziel fällt, wird verkauft');
  ok(plan2.kaufen.length === 1 && plan2.kaufen[0].sym === 'G', 'was neu ins Ziel kommt, wird gekauft');
  ok(plan2.halten.length === z.ziel.length - 1, 'der Rest bleibt unangetastet – jeder Trade kostet');
  var cashVor = buch.cash;
  MH.fuehreAus(buch, plan2, now + 86400000, 20);
  ok(buch.positionen.some(function (p) { return p.sym === 'G'; }) && !buch.positionen.some(function (p) { return p.sym === 'A'; }),
     'die Umschichtung ist im Buch angekommen');
  ok(buch.trades.filter(function (t) { return t.pnl != null; }).length >= 1, 'Verkäufe tragen ihr Ergebnis');

  /* --- Kein Kurs, kein Handel --- */
  var planO = MH.planeUmschichtung(['A', 'X'], { cash: 1000, positionen: [] }, { A: 100 });
  ok(planO.kaufen.length === 1 && planO.fehltKurs.indexOf('X') >= 0,
     'ohne Kurs wird nicht gehandelt, sondern gemeldet');

  /* --- Rebalancing-Uhr in Handelstagen --- */
  var spy = []; for (var i = 0; i < 100; i++) spy.push([now - (100 - i) * 86400000, 100]);
  ok(MH.rebalanceFaellig(spy, 0, 63) === true, 'ohne Vorgeschichte ist sofort fällig');
  ok(MH.rebalanceFaellig(spy, now - 10 * 86400000, 63) === false, 'nach 10 Tagen nicht fällig');
  ok(MH.rebalanceFaellig(spy, now - 90 * 86400000, 63) === true, 'nach 90 Tagen fällig');

  /* --- Drift-Buch: long und short, Alter zaehlt --- */
  var db = { cash: 10000, positionen: [] };
  var heute = { offen: [
    { sym: 'A', richtung: 'kaufen', seitTagen: 1, ueberraschung: 12 },
    { sym: 'C', richtung: 'verkaufen', seitTagen: 2, ueberraschung: -15 },
    { sym: 'B', richtung: 'kaufen', seitTagen: 40, ueberraschung: 20 }
  ], faellig: [] };
  var g1 = MH.driftAbgleich(db, heute, preise, now, {});
  ok(g1.eroeffnet === 2, 'junge Signale werden eröffnet, das 40 Tage alte nicht', g1.eroeffnet);
  ok(db.positionen.some(function (p) { return p.sym === 'C' && p.richtung === -1; }), 'die Short-Seite wird als Short geführt');
  // Short gewinnt, wenn der Kurs faellt: C von 80 auf 60
  var bwD1 = MH.bewerteDrift(db, preise).wert;
  var bwD2 = MH.bewerteDrift(db, Object.assign({}, preise, { C: 60 })).wert;
  ok(bwD2 > bwD1, 'fallender Kurs macht die Short-Position wertvoller', bwD1 + ' → ' + bwD2);
  // Nach 60 Handelstagen wird geschlossen
  var g2 = MH.driftAbgleich(db, { offen: [], faellig: [] }, preise, now + 120 * 86400000, {});
  ok(g2.geschlossen === 2, 'nach der Haltedauer wird geschlossen', g2.geschlossen);
  ok(db.positionen.length === 0 && db.trades.filter(function (t) { return t.pnl != null; }).length === 2,
     'beide Ausstiege stehen mit Ergebnis im Handelsprotokoll');
  // Doppelte Eroeffnung verhindern
  var db2 = { cash: 10000, positionen: [] };
  MH.driftAbgleich(db2, heute, preise, now, {});
  var g3 = MH.driftAbgleich(db2, heute, preise, now + 3600000, {});
  ok(g3.eroeffnet === 0, 'dasselbe Signal wird nicht doppelt eröffnet');

  /* --- Erkannt, aber nicht gehandelt: kein stiller Ausstieg mehr --- */
  ok(g1.verworfen.some(function (v) { return v.sym === 'B' && /alt/.test(v.grund); }),
     'das zu alte Signal steht mit Grund im Protokoll, statt spurlos zu verschwinden');
  ok(g3.verworfen.some(function (v) { return v.sym === 'A' && /schon im Buch/.test(v.grund); }),
     'ein bereits gehaltenes Signal wird als verworfen gemeldet');
  var gK = MH.driftAbgleich({ cash: 10000, positionen: [] },
    { offen: [{ sym: 'ZZZ', richtung: 'kaufen', seitTagen: 1 }], faellig: [] }, preise, now, {});
  ok(gK.verworfen.some(function (v) { return v.sym === 'ZZZ' && /Kurs/.test(v.grund); }),
     'ohne Kurs wird der Grund gemeldet, nicht stillschweigend übersprungen');
  var gArm = MH.driftAbgleich({ cash: 0.01, positionen: [] },
    { offen: [{ sym: 'A', richtung: 'kaufen', seitTagen: 1 }], faellig: [] }, preise, now, {});
  ok(gArm.verworfen.some(function (v) { return /Bargeld/.test(v.grund); }),
     'reicht das Bargeld nicht, steht auch das mit Grund im Protokoll');
  // Pruef-Modus: sagt, was das Buch taete - fasst das Buch aber nicht an
  var dbP = { cash: 10000, positionen: [], trades: [] };
  var gP = MH.driftAbgleich(dbP, heute, preise, now, { nurPruefen: true });
  ok(dbP.positionen.length === 0 && dbP.cash === 10000 && dbP.trades.length === 0,
     'der Prüf-Modus handelt nicht, er berichtet nur', dbP.positionen.length + '/' + dbP.cash);
  ok(gP.verworfen.some(function (v) { return /Automatik aus/.test(v.grund); }),
     'bei ausgeschalteter Automatik steht jedes Signal mit „Automatik aus“ im Protokoll');
  ok(z2.verworfen.some(function (v) { return v.sym === 'H' && /veraltet/.test(v.grund); }),
     'auch die Momentum-Rangfolge nennt den Grund für jeden Ausschluss');
  // Die Anzeige muss die Liste auch wirklich zeigen - sonst bleibt sie im Datenmodell stecken
  var mfdSrc = fs.readFileSync(__dirname + '/mfdepot.js', 'utf8');
  ok(/verworfenTabelle\(/.test(mfdSrc) && /Erkannt, aber nicht gehandelt/.test(mfdSrc),
     'die verworfenen Signale stehen sichtbar im Mittelfrist-Fenster');
  ok(/nurPruefen: true/.test(mfdSrc),
     'auch bei ausgeschalteter Automatik wird erhoben, was das Buch täte');
})();

/* ================= Diagnose: die weisse Liste haelt dicht ================= */
console.log('\nDiagnose-Versand');
(function () {
  var Dg = require('./diagnose.js');
  // Vergiftete Eingaben: alles, was NIEMALS im Versand landen darf
  var einstellungen = { capitalKey: 'GEHEIM-KEY-123', capitalPass: 'GEHEIM-PASS-456',
    kiRules: 'MEINE-GEHEIMEN-REGELN', updateRepo: 'x/y', kiVeto: true };
  var depot = {
    intraday: { enabled: true, mode: 'rsi2seit', instrument: 'basis', interval: '60m', scalpHold: 480, kryptoHandeln: false },
    momentumAn: true, driftAn: false, maxRisikostufe: 3, rechenstand: 9,
    watchlist: [{ y: 'GEHEIMAKTIE' }],
    positions: [{ sym: 'MEINSYMBOL', qty: 5, entry: 1.23, openT: Date.now() - 49 * 3600000 }],
    trades: [
      { status: 'closed', sym: 'TRADESYMBOL', pnl: 12.5, strategy: 'intraday', basis: true, modus: 'rsi2seit',
        dir: 'call', openT: 1787300000000, closeT: 1787328800000, entrySpot: 100, exitSpot: 102, uebernacht: true, why: 'Zeit abgelaufen' },
      { status: 'closed', sym: 'TRADESYMBOL', pnl: -4, strategy: 'hourly', dir: 'put', openT: 1787300000000, closeT: 1787303600000, entrySpot: 50, exitSpot: 51 }
    ],
    schatten: [{ status: 'closed' }, { status: 'open', sym: 'SCHATTENSYMBOL' }],
    schattenKonfig: 'xzeit_h480_s-90_t-_r0_patm60_b_i60m',
    schattenStat: { 'Klumpen-Limit': { n: 3, sumPct: -4.2, gerettet: 2, verhindert: 1 } },
    mfBuch: { start: 10000, cash: 12.34, positionen: [{ sym: 'BUCHSYMBOL' }], trades: [{ sym: 'BUCHSYMBOL' }], angelegt: 1, letztesRebalanceT: 2 },
    driftBuch: { start: 10000, cash: 5000, positionen: [{ sym: 'DRIFTSYMBOL', richtung: -1 }], trades: [] },
    mfVerlauf: [{ t: 1, momentum: 10000, drift: 10000, spy: 640 }, { t: 2, momentum: 10123, drift: 9987, spy: 645 }]
  };
  var fehler = [];
  for (var i = 0; i < 30; i++) fehler.push({ at: '2026-08-21', nachricht: 'Fehler ' + i, quelle: 'depot.js', zeile: i });
  var extra = { health: { startedAt: Date.now() - 3600000, scans: 42, fetchOk: 400, fetchFail: 7, killSwitch: 1, staleBars: 2, workerFail: 0, scanErrors: 0, kiOk: 5, kiFail: 1 },
    // Gesamtzaehler MIT Giftkoeder: nur die benannten Felder duerfen durch
    gesamt: { seit: 111, sitzungen: 12, laufzeitMin: 480, scans: 500, scanErrors: 3, fetchOk: 9000, fetchFail: 44,
      kiOk: 0, kiFail: 0, killSwitch: 2, staleBars: 9, workerFail: 1, GIFTFELD: 'GIFTGESAMT' },
    zeitzone: 'Europe/Berlin', sprache: 'de-DE', termineWerte: 189, tagesdatenStand: 123456, tagesdatenWerte: 189 };
  var d = Dg.baueDiagnose(einstellungen, depot, fehler, { version: '8.23.0', plattform: 'Win32', electron: '37', installId: 'inst-test' }, extra);
  var text = JSON.stringify(d);

  ok(d.version === '8.23.0' && d.installId === 'inst-test', 'Version und Kennung sind drin');
  ok(d.nutzung.modus === 'rsi2seit' && d.nutzung.zeitrahmen === '60m' && d.nutzung.haltedauerMin === 480,
     'das Nutzungsbild trägt jetzt auch die Konfigurationstiefe');
  ok(d.nutzung.profil === null, 'das Schein-Profil wird beim Basiswert-Instrument NICHT gemeldet (irrelevant)');
  ok(d.kennzahlen.intraday.n === 1 && d.kennzahlen.stunden.n === 1 && d.kennzahlen.intraday.pnl === 12.5,
     'Kennzahlen sind JE STRATEGIE getrennt – ein Topf verwischt die Frage der Auswertung');
  ok(d.kennzahlen.basisTrades === 1, 'Basiswert-Trades werden gezählt');
  /* Trade-Ebene: das Herzstueck der Auswertung - Haltedauern, Uhrzeiten,
   * Ausstiegsgruende. OHNE Symbol; der Giftkoeder-Check unten beweist es. */
  var et = d.kennzahlen.einzelTrades;
  ok(et && et.length === 2 && et[0].modus === 'rsi2seit' && et[0].haltedauerMin === 480 &&
     et[0].uebernacht === true && et[0].grund === 'Zeit abgelaufen',
     'Einzeltrades reisen mit allen Auswertungsfeldern mit', JSON.stringify(et && et[0]));
  ok(et[0].bewegungPct === 2 && et[1].bewegungPct === -2,
     'die Basiswert-Bewegung wird in Signalrichtung gerechnet (Put: fallend = positiv)',
     et[0].bewegungPct + ' / ' + et[1].bewegungPct);
  ok(!('sym' in et[0]) && JSON.stringify(et).indexOf('SYMBOL') === -1,
     'Einzeltrades tragen KEIN Symbol');
  ok(d.kennzahlen.aeltesteOffeneStd === 49,
     'das Alter der ältesten offenen Position ist sichtbar (das Theta-Verfall-Muster)', d.kennzahlen.aeltesteOffeneStd);
  ok(d.buecher.verlauf.reihe.length === 2 && d.buecher.verlauf.reihe[1].momentum === 10123,
     'die komplette Tagesreihe der Bücher reist mit (Drawdown wird messbar)');
  ok(d.betrieb.zeitzone === 'Europe/Berlin' && d.betrieb.abrufeFehl === 7 && d.betrieb.killSwitch === 1,
     'Betriebsdaten sind drin – die Zeitzone erklärt eine ganze Klasse scheinbarer Fehler');
  ok(d.betrieb.laufzeitMin >= 59 && d.betrieb.laufzeitMin <= 61, 'die Laufzeit wird aus dem Start berechnet', d.betrieb.laufzeitMin + ' Min');
  /* Gesamtzaehler: Die Sitzungszaehler stehen kurz nach dem Start bei null - die
   * erste Tester-Diagnose kam nach 1 Minute Laufzeit und war nichtssagend. Erst
   * die Summe ueber alle Sitzungen erzaehlt, wie die Installation lebt. */
  ok(d.betrieb.gesamt && d.betrieb.gesamt.sitzungen === 12 && d.betrieb.gesamt.laufzeitMin === 480 &&
     d.betrieb.gesamt.abrufeFehl === 44 && d.betrieb.gesamt.alteKurse === 9,
     'die Gesamtzaehler über alle Sitzungen reisen mit');
  ok(text.indexOf('GIFTGESAMT') === -1 && text.indexOf('GIFTFELD') === -1,
     'unbekannte Felder im Gesamtzaehler bleiben draussen (weisse Liste)');
  var dOhne = Dg.baueDiagnose(einstellungen, depot, fehler, { version: '8.23.0', plattform: 'Win32', electron: '37', installId: 'inst-test' },
    Object.assign({}, extra, { gesamt: null }));
  ok(dOhne.betrieb.gesamt === null, 'ohne Gesamtzaehler (alte Stores) bleibt das Feld schlicht null');
  ok(d.vorwaertstest.konfig !== null && d.vorwaertstest.bilanz['Klumpen-Limit'].n === 3 && d.vorwaertstest.offen === 1,
     'die Vorwärtstest-Bilanz reist mit – der wichtigste Evidenzkanal');
  /* Der behobene Bug: früher wurde nur der Kassenbestand gesendet. Nach einem
   * Rebalancing (Kasse ≈ 0) sah jedes Momentum-Buch wie ein Totalverlust aus.
   * Jetzt reisen die bewerteten Tagesstände aus dem Verlauf mit. */
  ok(d.buecher.momentum.cash === 12.34 && d.buecher.verlauf.letzter.momentum === 10123,
     'die Bücher melden bewertete Stände, nicht nur die Kasse');
  ok(d.buecher.drift.positionen === 1, 'auch das Drift-Buch ist dabei');
  ok(d.daten.termineWerte === 189 && d.daten.tagesdatenWerte === 189, 'der Zustand der Datenleitungen ist drin');
  ok(d.fehler.length === 20, 'das Fehlerprotokoll ist auf 20 gedeckelt', d.fehler.length);

  // DIE eigentliche Pruefung: nichts Sensibles darf durchsickern - egal wie es heisst
  ['GEHEIM-KEY-123', 'GEHEIM-PASS-456', 'MEINE-GEHEIMEN-REGELN', 'GEHEIMAKTIE',
   'MEINSYMBOL', 'TRADESYMBOL', 'BUCHSYMBOL', 'DRIFTSYMBOL', 'SCHATTENSYMBOL'].forEach(function (giftig) {
    ok(text.indexOf(giftig) === -1, 'weisse Liste haelt dicht: ' + giftig + ' ist NICHT im Versand');
  });
})();

/* ================= Kapitulations-Dip ================= */
console.log('\nKapitulations-Dip');
(function () {
  var P = { ENTRY: 'kapitulation', LINE: 'ema', period: 20, confirmBps: 5, ZTHR: 1.5, MINQ: 0, CHAN: false, MTF: false, TREND: false };
  /* Die Reihe braucht ECHTE Kapitulationen: scharfe Stuerze mit Volumenspitze, dann
   * Erholung. Eine sanfte Welle reicht nicht - reversionSignal verlangt Ueberdehnung
   * plus Umkehrbestaetigung, und genau das ist der Sinn: Der Modus soll den Ausverkauf
   * kaufen, nicht jede Delle. */
  function reihe(richtung, saat) {
    var b = [], r = lcg(saat || 31);
    for (var i = 0; i < 400; i++) {
      var phase = i % 35, sturz = phase < 3 ? -(3 - phase) * 1.6 : 0;
      var kurs = 100 + richtung * i * 0.10 + Math.sin(i / 8) * 1.2 + sturz + r() * 0.25;
      b.push([Date.UTC(2026, 0, 2) + i * 3600000, kurs, 1000 + (phase < 4 ? 1400 : 0) + (r() > 0.45 ? 300 : 0), kurs, kurs]);
    }
    return b;
  }
  function zaehle(b) {
    var calls = 0, puts = 0;
    for (var i = 320; i < b.length; i++) {
      var v = null; try { v = Q.einstiegSignal(b, i, P); } catch (e) { }
      if (v && v.dir === 'call') calls++; else if (v) puts++;
    }
    return { calls: calls, puts: puts };
  }
  var ab = zaehle(reihe(-1));
  var auf = zaehle(reihe(+1));
  ok(ab.calls > 0, 'im Abwärtskanal feuert der Kapitulations-Dip', ab.calls + ' Signale');
  ok(ab.puts === 0 && auf.puts === 0, 'niemals Puts – das Put-Gegenstück ist gemessen und fällt (−0,33 % je Trade)');
  ok(auf.calls === 0, 'im Aufwärtskanal feuert er NICHT – dort ist der Dip keine Kapitulation', auf.calls);
})();

/* ================= Altlast-Erkennung =================
 * Aus der Datenauswertung vom 21.08.2026: Positionen werden nur im Scan geschlossen, und
 * der läuft nur bei offener App UND offener Börse. War die App tagelang zu, lief der
 * Zeitwert weiter ab. Gefunden: Trades mit 22 und 23 Tagen Haltedauer auf 60-Tage-
 * Scheinen (−44 % und −41 %); über alle 28 geschlossenen Trades stammten 38 % des
 * Verlusts aus reinem Zeitwertverfall. */
console.log('\nAltlast-Erkennung');
(function () {
  var T = Date.UTC(2026, 7, 21, 10, 0);
  var tag = 86400000;
  function pos(o) {
    return Object.assign({ openT: T - 3 * tag, expiry: T + 50 * tag, strategy: 'hourly' }, o);
  }
  ok(Q.altlastGrund(pos({ openT: T - 3600000 }), T) === null,
     'eine heute eröffnete Position bleibt offen – dafür ist der laufende Scan da');
  ok(Q.altlastGrund(pos({ strategy: 'intraday' }), T) !== null,
     'eine Intraday-Position von vorgestern wird geschlossen');
  /* Der teuerste Fall im Bestand: 9 Trades ohne Strategie-Kennung, Median 22,2 Tage,
     zusammen −1.993 $. Eine fehlende Kennung darf nicht durchrutschen. */
  ok(Q.altlastGrund(pos({ strategy: undefined }), T) !== null,
     'eine Position OHNE Strategie-Kennung wird wie kurzfristig behandelt');
  ok(Q.altlastGrund(pos({ strategy: '' }), T) !== null, 'auch eine leere Kennung zählt als fehlend');

  // Stunden-Strategie: hält im Median 1,5 Tage. Drei Tage auf einem 60-Tage-Schein sind
  // 5 % der Laufzeit – das ist regulärer Betrieb und darf nicht angetastet werden.
  ok(Q.altlastGrund(pos({}), T) === null,
     'eine Stunden-Position nach 3 von 60 Tagen bleibt offen (5 % der Laufzeit)');
  // 22 von 60 Tagen sind 37 % – das ist der Fall, der 24 bis 31 % Zeitwert gekostet hat.
  var alt = Q.altlastGrund(pos({ openT: T - 22 * tag, expiry: T + 38 * tag }), T);
  ok(alt !== null && alt.indexOf('%') > 0, 'nach 22 von 60 Tagen greift die Laufzeit-Regel', alt);

  ok(Q.altlastGrund(pos({ openT: T - 20 * tag, expiry: T + 60 * tag }), T,
     { anteilLaufzeit: 0.9 }) === null, 'die Schwelle lässt sich anheben');
  ok(Q.altlastGrund(null, T) === null, 'ohne Position kein Urteil');
  ok(Q.altlastGrund({ strategy: 'hourly' }, T) === null, 'ohne Eröffnungszeit kein Urteil');
  // Ein Schein ohne Verfallsdatum lässt sich nicht nach Laufzeit beurteilen. Dann lieber
  // nichts tun, als eine Position auf eine erfundene Grundlage hin zu schließen.
  ok(Q.altlastGrund({ openT: T - 30 * tag, strategy: 'hourly' }, T) === null,
     'ohne Verfallsdatum greift die Laufzeit-Regel nicht');
})();

/* ================= Fingerabdruck der Schatten-Konfiguration =================
 * Aus der Datenauswertung vom 21.08.2026: In der Schatten-Bilanz stand ein Urteil, das
 * aus 392 Schatten mit DREI Minuten Haltedauer stammte, während die App längst mit 240
 * Minuten lief. Bei drei Minuten und 2,7 % Spanne je Seite misst man nichts als die
 * Kosten – Median −5,8 % gegen 5,4 % Round-Trip, Trefferquote 3 %. Die Zahl sah nach
 * Filterwirkung aus und war die Kostenstruktur. */
console.log('\nSchatten-Konfiguration');
(function () {
  var blitz = { exitMode: 'blitz', maxHoldMin: 3, sl: -0.25, tp: null, trail: 0.10 };
  var laufen = { exitMode: 'crest', maxHoldMin: 240, sl: -0.25, tp: null, trail: 0 };
  var cfg = { profile: 'atm21_b', interval: '15m' };

  ok(Q.schattenKonfig(blitz, cfg) !== Q.schattenKonfig(laufen, cfg),
     'drei Minuten und vier Stunden Haltedauer sind NICHT dieselbe Messung');
  ok(Q.schattenKonfig(blitz, cfg) === Q.schattenKonfig(blitz, cfg),
     'dieselbe Konfiguration gibt denselben Fingerabdruck');

  // Jedes Feld, das das Ergebnis verändert, muss den Fingerabdruck verändern
  [['maxHoldMin', 60], ['sl', -0.4], ['tp', 0.5], ['trail', 0.25], ['exitMode', 'target']].forEach(function (f) {
    var anders = Object.assign({}, blitz); anders[f[0]] = f[1];
    ok(Q.schattenKonfig(anders, cfg) !== Q.schattenKonfig(blitz, cfg),
       'geändertes ' + f[0] + ' ergibt einen anderen Fingerabdruck');
  });
  ok(Q.schattenKonfig(blitz, { profile: 'otm5_10', interval: '15m' }) !== Q.schattenKonfig(blitz, cfg),
     'ein anderes Scheinprofil ergibt einen anderen Fingerabdruck');
  ok(Q.schattenKonfig(blitz, { profile: 'atm21_b', interval: '1m' }) !== Q.schattenKonfig(blitz, cfg),
     'ein anderer Zeitrahmen ergibt einen anderen Fingerabdruck');

  /* Der Modusname gehört NICHT dazu: Zwei Modi mit gleichen Ausstiegsregeln liefern
     vergleichbare Schatten. Ein reiner Namenswechsel darf die Zählung nicht wegwerfen –
     sonst fängt die Bilanz bei jeder Umbenennung von vorn an und wird nie aussagekräftig. */
  ok(Q.schattenKonfig(blitz, { profile: 'atm21_b', interval: '15m', mode: 'waves' }) ===
     Q.schattenKonfig(blitz, { profile: 'atm21_b', interval: '15m', mode: 'wave' }),
     'ein reiner Modus-Namenswechsel setzt die Bilanz NICHT zurück');

  ok(typeof Q.schattenKonfig(null, null) === 'string', 'auch ohne Angaben kommt ein Fingerabdruck heraus');
  ok(Q.schattenKonfig({ sl: 'auto', maxHoldMin: 60 }, cfg).indexOf('auto') >= 0,
     'ein atmender Stop wird als solcher vermerkt, nicht als Zahl gerundet');
})();

/* ================= Signifikanz aus Monatserträgen =================
 * Der Grund für dieses Maß: Bei überlappenden Trades zählt ein trade-basierter t-Wert
 * dieselbe Marktbewegung dutzendfach. Am 21.08.2026 auf Krypto wurde aus t = 5,5
 * (je Kerze) ein t = 0,46 (je Monat) — dieselbe Strategie, ehrlicher Nenner. */
console.log('\nMonatsstatistik');
(function () {
  /* Das Rauschen wird auf Mittelwert null ZENTRIERT, bevor es benutzt wird.
   * Grund: lcg() ist bei manchen Startwerten schief. Saat 9 liefert über 756 Ziehungen
   * einen Mittelwert von +0,045 statt ~0 — als "Rauschen" eingesetzt ergab das einen
   * Aufwärtstrend von 0,09 % am Tag, und der Test "reines Rauschen gilt nicht als Beleg"
   * scheiterte mit t = 5,09. Nicht der geprüfte Code war schuld, sondern der Generator.
   * Zentrieren macht den Test vom Startwert unabhängig. */
  function kurve(monate, proMonatPct, rauschen, saat) {
    var n = monate * 21, roh = [], r = lcg(saat || 5), i;
    for (i = 0; i < n; i++) roh.push(r());
    if (rauschen) {
      var mw = roh.reduce(function (a, b) { return a + b; }, 0) / n;
      for (i = 0; i < n; i++) roh[i] -= mw;
    }
    var e = [], kap = 10000, k = 0;
    for (var m = 0; m < monate; m++) {
      for (var t = 0; t < 21; t++) {
        kap *= 1 + (proMonatPct / 100) / 21 + (rauschen ? roh[k] * rauschen : 0);
        e.push([Date.UTC(2020, m, 1 + t), kap]);
        k++;
      }
    }
    return e;
  }
  var stetig = Q.monatsStatistik(kurve(36, 1.0, 0));
  ok(stetig.monate === 36, 'zählt die Monate, nicht die Trades', stetig.monate);
  ok(Math.abs(stetig.jeMonat - 1.0) < 0.05, 'trifft den Monatsertrag', stetig.jeMonat + ' %');
  ok(Math.abs(stetig.proJahr - 12) < 0.6, 'rechnet auf das Jahr hoch', stetig.proJahr + ' %');
  ok(stetig.positiveMonate === 100, 'zählt positive Monate', stetig.positiveMonate + ' %');
  ok(stetig.belastbar && stetig.ueberzufaellig, '36 stetige Monate gelten als belastbar und überzufällig', 't = ' + stetig.tWert);

  var kurz = Q.monatsStatistik(kurve(9, 3.0, 0));
  ok(!kurz.belastbar && !kurz.ueberzufaellig,
     'neun Monate gelten NICHT als Beleg, egal wie gut sie aussehen', 't = ' + kurz.tWert + ', ' + kurz.proJahr + ' % p.a.');

  // OHNE Drift, nur Rauschen. Der erste Anlauf gab 0,05 % Monatsdrift mit dazu - über
  // 36 Monate ist das ein echter Effekt, kein Rauschen, und der Test scheiterte zu Recht.
  var laut = Q.monatsStatistik(kurve(36, 0, 0.02, 9));
  ok(!laut.ueberzufaellig, 'reines Rauschen ohne Drift gilt nicht als Beleg', 't = ' + laut.tWert + ', ' + laut.proJahr + ' % p.a.');

  ok(Q.monatsStatistik([]) === null, 'leere Kurve gibt null');
  ok(Q.monatsStatistik([[Date.UTC(2026, 0, 1), 100]]) === null, 'ein einzelner Punkt gibt null');
  // Drei Punkte, aber alle im selben Monat: ein Monat ist kein Urteil.
  ok(Q.monatsStatistik([[Date.UTC(2026, 0, 1), 100], [Date.UTC(2026, 0, 2), 101], [Date.UTC(2026, 0, 3), 102]]).zuKurz === true,
     'eine Kurve über wenige Tage gibt kein Urteil');

  /* Der Monatsübergang muss verkettet sein: Sonst fehlt der Ertrag, der zwischen dem
     letzten Tag eines Monats und dem ersten des nächsten entstanden ist. */
  var e2 = [[Date.UTC(2026, 0, 31), 100], [Date.UTC(2026, 1, 1), 110], [Date.UTC(2026, 1, 28), 110],
            [Date.UTC(2026, 2, 1), 121], [Date.UTC(2026, 2, 28), 121], [Date.UTC(2026, 3, 1), 133.1]];
  var kette = Q.monatsStatistik(e2);
  ok(kette.monate === 4, 'vier Kalendermonate erkannt', kette.monate);
  ok(Math.abs(kette.jeMonat - 7.5) < 2.5, 'der Sprung über den Monatswechsel geht nicht verloren', kette.jeMonat + ' %');
})();

/* ================= Ergebnis-Drift ================= */
console.log('\nErgebnis-Drift');
(function () {
  var Dr = require('./drift.js');

  /* --- Reaktionstag --- */
  var reihe = [];
  for (var i = 0; i < 40; i++) reihe.push([Date.UTC(2026, 0, 5 + i), 100 + i]);
  var di = Dr.datumIndex(reihe);
  ok(Dr.reaktionstag('2026-01-10T14:00:00Z', di) === di['2026-01-10'],
     'Meldung vor Börsenschluss wirkt am selben Tag');
  ok(Dr.reaktionstag('2026-01-10T21:00:00Z', di) === di['2026-01-10'] + 1,
     'Meldung nach Börsenschluss (ab 20:00 UTC) erst am Folgetag');
  ok(Dr.reaktionstag('2026-99-99', di) === null, 'unlesbares Datum gibt null');

  /* --- Paarung des jüngsten Termins (echte AMD-Antwort vom 21.08.2026) --- */
  var hist = [
    { quartalsEndeMs: Date.parse('2025-09-30'), ueberraschung: 2.48, ist: 1.2, schaetzung: 1.17 },
    { quartalsEndeMs: Date.parse('2025-12-31'), ueberraschung: 15.98, ist: 1.53, schaetzung: 1.32 },
    { quartalsEndeMs: Date.parse('2026-03-31'), ueberraschung: 5.82, ist: 1.37, schaetzung: 1.29 },
    { quartalsEndeMs: Date.parse('2026-06-30'), ueberraschung: 3.21, ist: 1.66, schaetzung: 1.61 }
  ];
  var pa = Dr.paareAktuell(hist, Date.parse('2026-08-04'));
  ok(pa && pa.quartalsende === '2026-06-30' && pa.ueberraschung === 3.21,
     'jüngstes Quartal wird mit dem Meldetermin gepaart', pa && (pa.quartalsende + ', ' + pa.ueberraschung + ' %'));
  ok(pa.abstandTage === 35, 'der Abstand Quartalsende → Meldung wird ausgewiesen', pa.abstandTage + ' Tage');
  ok(Dr.paareAktuell(hist.slice().reverse(), Date.parse('2026-08-04')).quartalsende === '2026-06-30',
     'die Reihenfolge der Quartale spielt keine Rolle');
  // Falsch datierte Ereignisse sind schlimmer als gar keine: Ein um Wochen verschobener
  // Reaktionstag macht aus dem Drift Rauschen.
  ok(Dr.paareAktuell(hist, Date.parse('2026-06-01')) === null, 'Termin VOR dem Quartalsende wird verworfen');
  ok(Dr.paareAktuell(hist, Date.parse('2027-01-16')) === null, 'Termin über 120 Tage danach wird verworfen');
  ok(Dr.paareAktuell(hist, 0) === null, 'ohne Meldetermin kein Ereignis');
  ok(Dr.paareAktuell([], Date.parse('2026-08-04')) === null, 'ohne Historie kein Ereignis');
  ok(Dr.paareAktuell([{ quartalsEndeMs: Date.parse('2026-06-30'), ueberraschung: null }], Date.parse('2026-08-04')) === null,
     'ohne Überraschungswert kein Ereignis');

  /* --- Zuordnung: oberstes und unterstes Fünftel, ohne Blick in die Zukunft --- */
  var evs = [];
  for (var k = 0; k < 300; k++) evs.push({ sym: 'S' + (k % 10), i: k, mi: k, ueb: ((k * 37) % 101) - 50 });
  var zu = Dr.zuordnen(evs, { fenster: 120, anteil: 0.2, minVergleich: 40 });
  ok(zu.length > 50, 'aus 300 Ereignissen entstehen Positionen', zu.length);
  ok(zu.every(function (p) { return p.richtung === 1 || p.richtung === -1; }), 'jede Position hat eine Richtung');
  var langN = zu.filter(function (p) { return p.richtung > 0; }).length;
  var kurzN = zu.filter(function (p) { return p.richtung < 0; }).length;
  ok(Math.abs(langN - kurzN) < zu.length * 0.25, 'beide Beine sind ähnlich groß (marktneutral)', langN + ' long / ' + kurzN + ' short');
  ok(zu.every(function (p) { return p.e.mi >= 40; }), 'die ersten Ereignisse haben zu wenig Vergleich und werden übersprungen');
  // Der Fehler, der in der Messung 1,6 Prozentpunkte Scheinertrag erzeugt hat: ein
  // Ereignis darf nur gegen FRÜHERE eingeordnet werden, nie gegen spätere.
  var evsKurz = evs.slice(0, 120);
  var zuKurz = Dr.zuordnen(evsKurz, { fenster: 120, anteil: 0.2, minVergleich: 40 });
  var gemeinsam = zu.filter(function (p) { return p.e.mi < 120; });
  ok(zuKurz.length === gemeinsam.length,
     'spätere Ereignisse ändern die Zuordnung früherer NICHT (kein Blick in die Zukunft)',
     zuKurz.length + ' vs ' + gemeinsam.length);

  /* --- Depotlauf auf gebauten Kursen mit echtem Drift --- */
  var kurse = {}, termine = {}, markt = [];
  var r9 = lcg(77);
  for (var t9 = 0; t9 < 900; t9++) markt.push([Date.UTC(2020, 0, 1) + t9 * 86400000, 100 * Math.pow(1.0002, t9)]);
  for (var sN = 0; sN < 12; sN++) {
    var sym = 'T' + sN, b9 = [], tl = [];
    for (var d9 = 0; d9 < 900; d9++) b9.push([markt[d9][0], 100]);
    // Alle 90 Tage eine Meldung; danach läuft der Kurs 60 Tage in Überraschungsrichtung
    for (var e9 = 100; e9 + 70 < 900; e9 += 90) {
      var ueb = ((sN * 13 + e9) % 41) - 20;
      tl.push([new Date(markt[e9][0]).toISOString(), 1, 1 + ueb / 100, ueb]);
      for (var f9 = e9; f9 < 900; f9++) {
        var schritt = f9 <= e9 + 60 ? ueb / 6000 : 0;
        b9[f9][1] = b9[f9 - 1][1] * (1 + schritt + r9() * 0.004);
      }
    }
    kurse[sym] = b9; termine[sym] = tl;
  }
  var lauf = Dr.durchlauf(kurse, termine, markt, { minVergleich: 8, kostenBp: 0 });
  ok(lauf && lauf.proJahr > 0, 'bei eingebautem Drift findet der Durchlauf ihn', lauf && (lauf.proJahr + ' % p.a.'));
  ok(lauf.tWert > 1, 'und zwar überzufällig', 't = ' + lauf.tWert);

  /* Kosten MÜSSEN das Ergebnis senken. Ein früherer Anlauf zog sie direkt vom
   * Kursertrag ab – auf der Short-Seite wurde daraus durch das Minuszeichen ein
   * Gewinn, und die Kosten hoben sich zwischen den Beinen exakt auf. 10 Basispunkte
   * änderten das Ergebnis dadurch um +0,01 statt es zu senken. */
  var teuer = Dr.durchlauf(kurse, termine, markt, { minVergleich: 8, kostenBp: 40 });
  ok(teuer.proJahr < lauf.proJahr, 'Kosten senken das Ergebnis (beide Beine zahlen)',
     lauf.proJahr + ' % → ' + teuer.proJahr + ' %');

  /* Gegenprobe: auf reinen Zufallskursen darf NICHTS herauskommen. */
  var zufKurse = {}, r10 = lcg(404);
  Object.keys(kurse).forEach(function (sy) {
    var b10 = [[markt[0][0], 100]];
    for (var z10 = 1; z10 < 900; z10++) b10.push([markt[z10][0], b10[z10 - 1][1] * (1 + r10() * 0.02)]);
    zufKurse[sy] = b10;
  });
  var zufall = Dr.durchlauf(zufKurse, termine, markt, { minVergleich: 8, kostenBp: 0 });
  ok(!zufall || Math.abs(zufall.tWert) < 2.5, 'auf Zufallskursen entsteht kein Vorsprung',
     zufall ? 't = ' + zufall.tWert : 'kein Ergebnis');

  /* --- Heute-Ansicht --- */
  var h9 = Dr.heute(kurse, termine, markt, { minVergleich: 8 });
  ok(h9 && Array.isArray(h9.offen), 'die Heute-Ansicht liefert eine Liste');
  ok(h9.offen.every(function (o) { return o.nochTage > 0 && o.nochTage <= 60; }),
     'alle offenen Positionen haben eine Restlaufzeit zwischen 1 und 60 Tagen');
  ok(h9.offen.every(function (o) { return o.richtung === 'kaufen' || o.richtung === 'verkaufen'; }),
     'jede Zeile nennt eine Handlung');
})();

/* ================= Wird auch alles ausgeliefert? =================
 * Am 21.08.2026 gefunden: Die `files`-Liste in package.json war eine explizite
 * Aufzählung und enthielt momentum.js, strategien.js und mittelfrist.js NICHT. Im
 * gepackten Build fehlten sie deshalb – `window.Momentum` war undefiniert, der
 * Mittelfrist-Tab und die Strategie-Schalter existierten in der installierten App gar
 * nicht. Im Quellordner lief alles, weshalb es niemandem auffiel: Der Unterschied
 * zwischen „läuft bei mir" und „läuft beim Nutzer" war eine vergessene Zeile.
 *
 * Dieser Test vergleicht die Skripte, die index.html lädt, mit dem, was das
 * Verpackungsmuster einschließt. Er braucht keinen Build – nur die beiden Dateien. */
console.log('\nAuslieferung');
(function () {
  // __dirname statt relativer Pfade: sonst faellt die Auslieferungs-Pruefung still
  // aus, sobald der Test aus einem anderen Arbeitsverzeichnis gestartet wird.
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));
  var muster = pkg.build.files;

  var skripte = [];
  var re = /<script\s+src="([^"]+)"/g, m;
  while ((m = re.exec(html))) if (m[1].indexOf('://') === -1) skripte.push(m[1]);
  ok(skripte.length > 10, 'index.html lädt Skripte', skripte.length + ' Stück');

  /** Deckt das Muster diese Datei ab? Nur die Formen, die hier vorkommen:
   *  exakter Name, `*.js`, und Ausschlüsse mit `!`. */
  function abgedeckt(datei) {
    var drin = false;
    muster.forEach(function (p) {
      var neg = p.charAt(0) === '!';
      var pat = neg ? p.slice(1) : p;
      var passt = pat === datei ||
        (pat.indexOf('*') >= 0 &&
         new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$').test(datei));
      if (passt) drin = !neg;
    });
    return drin;
  }

  var fehlend = skripte.filter(function (s) { return !abgedeckt(s); });
  ok(fehlend.length === 0,
     'JEDES von index.html geladene Skript wird mitgeliefert',
     fehlend.length ? 'FEHLT: ' + fehlend.join(', ') : skripte.length + ' geprüft');

  // Die Datei muss auch wirklich existieren – ein Tippfehler im src wäre derselbe Ausfall
  var ohneDatei = skripte.filter(function (s) { return !fs.existsSync(__dirname + '/' + s); });
  ok(ohneDatei.length === 0, 'und existiert auch im Quellordner',
     ohneDatei.length ? 'FEHLT: ' + ohneDatei.join(', ') : 'alle da');

  // Gegenprobe: Testdateien dürfen NICHT mitgeliefert werden
  ok(!abgedeckt('test-v6.js') && !abgedeckt('test-channel.js'),
     'Testdateien werden ausgeschlossen');

  /* Sende-Schlüssel (Issue #39): Fehlt telemetrie.json im PAKET, faellt die App
   * still auf den Browser-Weg zurueck - genau das ist einer Installation passiert.
   * Die Datei ist bewusst nicht im Repo (Token!), deshalb pruefen wir zweistufig:
   * das Muster muss sie einschliessen, und WENN sie lokal liegt, muss sie gueltig
   * sein. Zusaetzlich wird nach einem Build der Paketinhalt geprueft. */
  ok(abgedeckt('telemetrie.json'), 'Der Sende-Schlüssel ist im Verpackungsmuster enthalten');
  var telePfad = __dirname + '/telemetrie.json';
  if (fs.existsSync(telePfad)) {
    var tOk = false, tGrund = '';
    try {
      var tj = JSON.parse(fs.readFileSync(telePfad, 'utf8'));
      var teile = String((tj && tj.repo) || '').split('/');
      tOk = teile.length === 2 && teile.every(function (x) { return x.length > 0; }) &&
        typeof tj.token === 'string' && tj.token.length > 20;
      tGrund = tOk ? 'repo + Token plausibel' : 'repo oder Token unbrauchbar';
    } catch (e) { tGrund = 'kein gültiges JSON'; }
    ok(tOk, 'Der lokale Sende-Schlüssel ist gültig (sonst landen Meldungen im Browser)', tGrund);
  } else {
    console.log('  ℹ  telemetrie.json liegt hier nicht – dieser Build würde den Browser-Weg nutzen (kein Fehler auf fremden Rechnern).');
  }
  // Nach einem Build: liegt der Schlüssel wirklich im Paket?
  var asarPfad = __dirname + '/dist/win-unpacked/resources/app.asar';
  if (fs.existsSync(telePfad) && fs.existsSync(asarPfad)) {
    var drinImPaket = false, wieGeprueft = '';
    try {
      // Sauber ueber die asar-Bibliothek, wenn vorhanden - sie liest den echten Index.
      var asarLib = require('@electron/asar');
      drinImPaket = asarLib.listPackage(asarPfad).some(function (f) { return /telemetrie\.json$/.test(f); });
      wieGeprueft = 'asar-Index';
    } catch (e) {
      // Rueckfall: der asar-Header ist JSON im Klartext am Dateianfang.
      try {
        var fd = fs.openSync(asarPfad, 'r');
        var buf = Buffer.alloc(262144);
        var gelesen = fs.readSync(fd, buf, 0, buf.length, 0);
        fs.closeSync(fd);
        drinImPaket = buf.slice(0, gelesen).toString('utf8').indexOf('telemetrie.json') !== -1;
        wieGeprueft = 'Header-Suche';
      } catch (e2) { wieGeprueft = 'nicht lesbar'; }
    }
    ok(drinImPaket, 'Der letzte Build enthält den Sende-Schlüssel im Paket', wieGeprueft);
  }
  ok(abgedeckt('main.js') && abgedeckt('preload.js') && abgedeckt('bt-worker.js'),
     'Hauptprozess, Bridge und Worker sind abgedeckt');
})();


console.log('\n30) Datenquellen-Diagnose (Capital.com) – ein Fehlschlag muss seinen GRUND nennen');
(function () {
  var cap = fs.readFileSync(__dirname + '/capital.js', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');

  function block(quelle, start) {
    // Schneidet den Rumpf einer Methode ab "name: async function" bis zur Zeile,
    // die sie auf gleicher Einrückung schließt.
    var i = quelle.indexOf(start);
    if (i === -1) return '';
    var j = quelle.indexOf('\n    },', i);
    return j === -1 ? quelle.slice(i) : quelle.slice(i, j);
  }

  ok(/lastPriceError:\s*function/.test(cap), 'capital.js bietet lastPriceError() an');

  /* Dauerregel statt Einzelfall: KEINE der Kursfunktionen darf null zurückgeben, ohne
   * einen Grund zu hinterlassen. Genau daran scheiterte die Fehlersuche am 22.08.2026 –
   * "kein Markt", "Login weg", "gedrosselt" und "unlesbar" sahen für den Aufrufer alle
   * gleich aus. Der '!epic'-Ausgang zählt nicht mit: dort hat epicFor schon gemeldet. */
  (function () {
    function rumpf(start) {
      var i = cap.indexOf(start); if (i === -1) return '';
      var j = cap.indexOf('\n    },', i); return j === -1 ? cap.slice(i) : cap.slice(i, j);
    }
    var stumm = [];
    ['epicFor: async', 'pricesRange: async', 'prices: async', 'quote: async'].forEach(function (n) {
      var b = rumpf(n); if (!b) return;
      var ausgaenge = (b.match(/return null;/g) || []).length - (b.indexOf('if (!epic) return null;') !== -1 ? 1 : 0);
      var gruende = (b.match(/letzterKursFehler =/g) || []).length - (b.indexOf("letzterKursFehler = '';") !== -1 ? 1 : 0);
      if (gruende < ausgaenge) stumm.push(n.split(':')[0] + ' (' + (ausgaenge - gruende) + ')');
    });
    ok(stumm.length === 0,
       'Keine Kursfunktion hat einen stummen Fehlerausgang',
       stumm.length ? stumm.join(', ') : 'epicFor, pricesRange, prices, quote geprüft');
  })();
  ok(/roh:\s*async function/.test(cap), 'capital.js bietet roh() für die Rohantwort an');

  // Kern der Sache: KEIN stummes null mehr. Jeder Fehlerausgang muss vorher einen Grund setzen.
  var eF = block(cap, 'epicFor: async function');
  var nullsE = (eF.match(/return null;/g) || []).length;
  var gruendeE = (eF.match(/letzterKursFehler =/g) || []).length;
  ok(nullsE > 0 && gruendeE >= nullsE,
     'epicFor: jeder Fehlerausgang setzt einen Grund', gruendeE + ' Gründe / ' + nullsE + ' Ausgänge');

  var pR = block(cap, 'pricesRange: async function');
  ok(/letzterKursFehler = 'Kursabruf/.test(pR),
     'pricesRange nennt bei HTTP-Fehler Symbol, Zeitrahmen, Zeitraum und Status');
  ok(pR.indexOf('String(res.body') !== -1,
     'pricesRange gibt den Antwortrumpf mit aus (dort steht Capitals errorCode)');

  // Die Diagnose selbst
  ok(/async function datenquelleTest/.test(dep), 'depot.js hat datenquelleTest()');
  ok(dep.indexOf('window.__datenquelleTest') !== -1, 'datenquelleTest ist von außen aufrufbar');
  var dqI = dep.indexOf('async function datenquelleTest');
  var dq = dep.slice(dqI, dqI + 6000);
  ok(dq.indexOf('CapAPI.enabled()') !== -1 && dq.indexOf('CapAPI.status()') !== -1 &&
     dq.indexOf('epicFor') !== -1 && dq.indexOf('/prices/') !== -1,
     'Die Prüfung geht alle vier Stufen durch: aktiv → Anmeldung → Markt → Kursabruf');

  // Wochenend-Falle: eine Stichprobe auf Samstag/Sonntag liefert zu Recht nichts
  // und würde sonst als "Historie endet hier" fehlgedeutet.
  ok(/getUTCDay\(\) === 0 \|\| .*getUTCDay\(\) === 6/.test(dq),
     'Stichproben-Tage werden von Wochenenden weggeschoben');

  // Auflösungsnamen müssen zu Capitals Vokabular passen (MINUTE/MINUTE_5/MINUTE_15)
  ok(/'MINUTE'/.test(dq) && /'MINUTE_5'/.test(dq) && /'MINUTE_15'/.test(dq),
     'Die Tiefenmessung nutzt Capitals Auflösungsnamen');

  // massenBackfill: Grund statt bloßem Zähler
  var mbI = dep.indexOf('async function massenBackfill');
  var mb = dep.slice(mbI, dep.indexOf('async function datenquelleTest'));
  ok(mb.indexOf('stat.grund') !== -1 && mb.indexOf('lastPriceError') !== -1,
     'massenBackfill hält den konkreten Fehlergrund fest');
  ok(/Letzter Fehler: ' \+ stat\.grund/.test(mb),
     'Der Grund erscheint auch in der Statuszeile, nicht nur intern');

  // Früh-Abbruch: muss bei systemischem Fehler greifen …
  ok(/ohneErfolg >= 3 && \(stat\.bars === 0 \|\| ohneErfolg >= 10\)/.test(mb),
     'Ein systemischer Fehlschlag bricht den Lauf ab – auch wenn er erst mitten im Lauf auftritt');
  // … darf aber NICHT durch übersprungene (bereits vollständige) Werte ausgelöst werden.
  ok(/if \(geholt\) \{ stat\.symbole\+\+; ohneErfolg = 0; \}/.test(mb),
     'Ein erfolgreicher Wert setzt den Abbruchzähler zurück (fertige Werte lösen nichts aus)');
  // Capital führt nicht jeden Wert als CFD – im DAX-Pool hängen 41 .DE-Symbole
  // hintereinander. Die dürfen nicht als „die Verbindung ist kaputt" gedeutet werden.
  ok(mb.indexOf("symGrund.indexOf('Kein Markt') !== 0") !== -1,
     'Nicht geführte Einzelwerte lösen KEINEN Verbindungs-Abbruch aus');

  /* Der schwerste Befund der Gegenprüfung (22.08.2026): ein Abruffenster deckt 1000
   * Kerzen WANDUHRZEIT ab – bei 1m nur 16,7 h. Die Wochenendlücke der US-Sitzung ist
   * 65,5 h, mit Feiertagsmontag rund 90 h. Mit fester Grenze 2 kam der 1m-Lauf über das
   * erste Wochenende nicht hinaus – also genau dort nicht weiter, wofür er gebaut wurde.
   * Deshalb hier nachgerechnet statt nur nach Text gesucht. */
  ok(/var leerGrenze = Math\.max\(2, Math\.ceil\(96 \* 3600000 \/ fensterMs\) \+ 1\)/.test(mb),
     'Die Grenze für leere Fenster richtet sich nach der Fensterbreite');
  (function () {
    function leerGrenze(barMin) { var f = 1000 * barMin * 60000; return Math.max(2, Math.ceil(96 * 3600000 / f) + 1); }
    var wochenende = 65.5 * 3600000;          // Fr 20:00 UTC bis Mo 13:30 UTC
    var langesWE = 89.5 * 3600000;            // mit Feiertagsmontag bis Di 13:30 UTC
    var schlecht = [];
    [1, 5, 15].forEach(function (bm) {
      var reichweite = leerGrenze(bm) * 1000 * bm * 60000;
      if (reichweite < langesWE) schlecht.push(bm + 'm deckt nur ' + Math.round(reichweite / 3600000) + ' h');
    });
    ok(schlecht.length === 0,
       'Jeder Zeitrahmen kann ein langes Wochenende (90 h ohne Kerzen) überbrücken',
       schlecht.length ? schlecht.join('; ') : '1m ' + Math.round(leerGrenze(1) * 16.667) + ' h > ' + Math.round(langesWE / 3600000) + ' h');
    ok(leerGrenze(1) * 1000 * 1 * 60000 >= wochenende,
       '1-Minuten-Lauf kommt über das erste Wochenende hinaus (der Kernzweck der Funktion)');
  })();

  // Leere Fenster = Ende der Historie, nicht Fehlschlag. Beim ZWEITEN Lauf ist das der
  // Normalfall bei jedem Wert - mitgezaehlt haette sich der Lauf selbst abgewuergt.
  ok(mb.indexOf('else if ((fehlSerie >= 3 || ohneSitzung >= 3)') !== -1,
     'Leere Abrufe am Ende der Historie lösen keinen Verbindungs-Abbruch aus (Fortsetzbarkeit)');

  // Leerlauf-Bremse: Kerzen kommen an, aber keine liegt in der US-Sitzung.
  ok(/ohneSitzung < 3/.test(mb) && mb.indexOf('ohneSitzung++') !== -1,
     'Ein Wert, der nur Kerzen ausserhalb der Handelszeit liefert, wird abgebrochen statt stumm 90 Tage weit abgefragt');
  ok(/ohneSitzung = 0/.test(mb), 'Die Leerlauf-Bremse wird zurückgesetzt, sobald echte Sitzungskerzen ankommen');

  /* Eine Drosselung (HTTP 429) darf nicht als gemessene Historiengrenze durchgehen –
   * ausgerechnet in dem Werkzeug, das beides auseinanderhalten soll. */
  ok(/if \(!r\.ok\) \{[\s\S]{0,400}httpFehler\+\+/.test(dq),
     'HTTP-Fehler werden getrennt gezählt, nicht als „keine Daten"');
  ok(/gestoert \? null : tiefe/.test(dq) && dq.indexOf('Tiefe UNBEKANNT') !== -1,
     'Eine gestörte Messung wird als UNBEKANNT ausgewiesen, nicht als kurze Historie');
  ok(dq.indexOf("iTyp.indexOf('SHARES') === -1") !== -1,
     'Die Prüfung warnt, wenn hinter dem Kürzel kein Aktienmarkt liegt');

  // Knopf: vorhanden UND verdrahtet – tote Schalter gab es hier schon einmal (6 Stück).
  var vork = (html.match(/id="quelleTestBtn"/g) || []).length;
  ok(vork === 1, 'Der Knopf „Datenquelle testen" existiert genau einmal', vork + '×');
  ok(/quelleTestBtn'\)[\s\S]{0,200}addEventListener\('click'/.test(dep),
     'Der Knopf ist an eine Klick-Behandlung angeschlossen');
  ok(/qBtn\.disabled = false/.test(dep), 'Der Knopf wird nach der Prüfung wieder freigegeben');

  // Mehrzeilige Diagnose muss auch mehrzeilig ankommen
  var statusZeile = (html.match(/id="massenStatus"[^>]*/) || [''])[0];
  ok(statusZeile.indexOf('pre-wrap') !== -1,
     'Die Statusfläche gibt Zeilenumbrüche wieder (sonst verklebt die Diagnose zu einem Absatz)');
})();


console.log('\n31) Auslieferung – enthält der letzte Build wirklich den aktuellen Stand?');
(function () {
  var asarPfad = __dirname + '/dist/win-unpacked/resources/app.asar';
  if (!fs.existsSync(asarPfad)) {
    console.log('  ℹ  Noch kein Build vorhanden – diese Prüfung greift erst nach „electron-builder".');
    return;
  }
  var asarLib;
  try { asarLib = require('@electron/asar'); }
  catch (e) { console.log('  ℹ  asar-Bibliothek nicht verfügbar – Prüfung übersprungen.'); return; }

  var quellVersion = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8')).version;
  var paketVersion = null;
  try { paketVersion = JSON.parse(asarLib.extractFile(asarPfad, 'package.json').toString('utf8')).version; }
  catch (e) { }

  /* Ein fehlgeschlagener Build hinterlässt das ALTE dist/ – und ein Release daraus
   * liefert stillschweigend den vorherigen Stand aus. Genau das ist hier am
   * 22.08.2026 passiert: „npm run build" gibt es nicht, der Fehlschlag blieb in einer
   * verketteten Shell-Zeile unsichtbar, und das Paket war eine Version alt. */
  ok(paketVersion === quellVersion,
     'Das gebaute Paket ist auf dem Stand der Quelle',
     'Quelle ' + quellVersion + ' / Paket ' + (paketVersion || 'unlesbar'));

  /* Der Versionsvergleich oben fängt nur "der Build lief gar nicht". Wird nach dem
   * Build weiter am Code gefeilt, bleibt die Version gleich und das Paket ist trotzdem
   * veraltet. Deshalb byteweise vergleichen – das ist der einzige Test, der beides fängt. */
  var crypto = require('crypto');
  function hash(b) { return crypto.createHash('sha1').update(b).digest('hex').slice(0, 12); }
  var abweichend = [];
  ['depot.js', 'capital.js', 'index.html', 'quant.js', 'renderer.js', 'main.js', 'app-shell.js'].forEach(function (f) {
    var quelle, paket;
    try { quelle = hash(fs.readFileSync(__dirname + '/' + f)); } catch (e) { return; }
    try { paket = hash(asarLib.extractFile(asarPfad, f)); } catch (e) { paket = 'fehlt'; }
    if (quelle !== paket) abweichend.push(f + ' (' + paket + ' statt ' + quelle + ')');
  });
  ok(abweichend.length === 0,
     'Jede ausgelieferte Datei ist inhaltsgleich mit der Quelle',
     abweichend.length ? abweichend.join('; ') : 'alle geprüften Dateien identisch');
})();

console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' TEST(S) FEHLGESCHLAGEN');
process.exit(fails ? 1 : 0);
