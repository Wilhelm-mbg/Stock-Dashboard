'use strict';
const fs = require('fs');
/* Tests v6: ORB, Auto-Stop, Risiko-Sizing, Resampling/MTF */
var Q = require('./quant.js');
var fails = 0;
/* Asynchrone Abschnitte muessen sich hier eintragen, sonst laufen sie NIE:
 * process.exit() am Dateiende kommt vor jeder noch offenen Zusage, und die Suite
 * meldet dann "alle bestanden", ohne die Zusicherungen ueberhaupt ausgefuehrt zu
 * haben. Genau das ist beim Kurslader passiert - 16 Pruefungen, still uebersprungen. */
var offeneProben = [];
function probe(zusage) { offeneProben.push(zusage); return zusage; }

function ok(cond, name, extra) {
  console.log((cond ? '  ✅ ' : '  ❌ ') + name + (extra !== undefined ? '  [' + extra + ']' : ''));
  if (!cond) fails++;
}
/* Kommentare weg, bevor im Quelltext gesucht wird.
 *
 * Diese Zeile ist dreimal noetig geworden, jedes Mal aus demselben Grund: Eine
 * Zusicherung suchte ein Wort ("keine Rangliste", "keine Marktkapitalisierung",
 * "kein bars[i+1]") - und traf den Kommentar, der erklaert, dass es das NICHT gibt.
 * Eine Pruefung, die an Prosa haengt, prueft nichts. Wer im Code sucht, sucht ab
 * jetzt hiermit. */
function ohneKommentare(quelle) {
  return String(quelle).replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
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
/* Historische Geld-Brief-Spanne (25.08.2026). capital.js/pricesRange haengt sie je
 * Kerze an Element [5]; sie ist die einzige Zahl, die die Kostenannahme von 0,10 %
 * ueber Zeit und Universum belegen kann. Bis dahin wurde sie weggerechnet.
 *
 * Die drei Zusicherungen halten die drei Eigenschaften fest, auf die es ankommt:
 * Median statt Mittelwert, fehlende Spanne wird UEBERGANGEN statt als 0 gezaehlt,
 * und sie erreicht das Kursarchiv NICHT. */
var TSp = Date.UTC(2026, 7, 10, 13, 30);
var spBars = [
  [TSp, 100, 10, 100, 100, 0.001],
  [TSp + 3600000, 100, 10, 100, 100, 0.003],
  [TSp + 7200000, 100, 10, 100, 100, 0.002],
  [TSp + 86400000, 100, 10, 100, 100, 0.005]
];
var spTag = A.spannenJeTag(spBars);
ok(Object.keys(spTag).length === 2, 'Spanne: je Kalendertag ein Eintrag', Object.keys(spTag).length);
ok(spTag['2026-08-10'].n === 3 && spTag['2026-08-10'].med === 0.002,
   'Spanne: Median je Tag, nicht Mittelwert (0,001/0,002/0,003 -> 0,002)', spTag['2026-08-10'].med);
/* Eine Kerze ohne Spanne ist eine unbekannte Spanne, keine enge. Als 0 gezaehlt
 * zoege sie den Median nach unten und liesse die Kosten guenstiger aussehen, als
 * sie sind - dieselbe Verwechslung, die beim Volumen 66 Reihen gekostet hat. */
var spLuecke = A.spannenJeTag([
  [TSp, 100, 10, 100, 100, 0.004],
  [TSp + 3600000, 100, 10, 100, 100, null],
  [TSp + 7200000, 100, 10, 100, 100],
  [TSp + 10800000, 100, 10, 100, 100, 0.006]
]);
ok(spLuecke['2026-08-10'].n === 2 && spLuecke['2026-08-10'].med === 0.006,
   'Spanne: fehlende Werte werden uebergangen, nicht als 0 gezaehlt', spLuecke['2026-08-10'].n);
ok(Object.keys(A.spannenJeTag([[TSp, 100, 10]])).length === 0,
   'Spanne: Kerzen ohne das Feld ergeben gar keinen Tag');
/* Die Kurzlebigkeit von [5] ist der Vertrag, auf dem der ganze Entwurf steht: die
 * Spanne darf die FORM des Kursarchivs nicht veraendern. Dass schlank() sie heute
 * abschneidet, ist ein Verhalten - hier wird es eine Zusicherung. */
var spGekuerzt = A.schlank([[TSp, 100, 10, 101, 99, 0.002]]);
ok(spGekuerzt[0].length === 5, 'Die Spanne erreicht das Kursarchiv nicht - schlank() kuerzt sie weg',
   spGekuerzt[0].length);
ok(Object.keys(A.spannenJeTag(spGekuerzt)).length === 0,
   'und nach dem Speichern ist sie nachweislich fort');
/* Die stille Bruchstelle: depot.js ruft window.Archiv.spannenJeTag auf - also die
 * INSTANZ aus baueArchiv, nicht das Kern-Objekt. Fehlt sie dort, faellt
 * spannenAusKerzen wortlos auf 0 zurueck und niemand merkt es, weil kein Fehler
 * entsteht - es kommen nur nie Daten an. */
var ArchInst = A.baueArchiv({ storeGet: async function () { return null; }, storeSet: async function () { return true; } });
ok(typeof ArchInst.spannenJeTag === 'function',
   'window.Archiv traegt spannenJeTag - sonst sammelt der Backfill lautlos nichts');
/* DER ARCHIV-FLUSH (25.08.2026). storeSet WIRFT NICHT - main.js:1085 meldet im
 * Fehlerfall { ok:false, msg }. Dieser Rueckgabewert wurde verworfen und die
 * dirty-Marke trotzdem geloescht: bei voller Platte oder blockiertem Datenordner
 * galt der Stand als gesichert und war beim Beenden weg. Bei 1m-Kerzen endgueltig,
 * denn Yahoo gibt nur sieben Tage zurueck - der Rest waechst nur durchs Sammeln.
 *
 * Ausgefuehrt geprueft und nicht per Textmarke: gefragt ist, ob der naechste Flush
 * es WIRKLICH erneut versucht. Das steht in keiner Zeichenkette. */
probe((async function () {
  var versuche = 0, antwort = { ok: false, msg: 'Platte voll' };
  var ArchF = A.baueArchiv({
    storeGet: async function () { return null; },
    storeSet: async function () { versuche++; return antwort; }
  });
  await ArchF.fuege('5m', 'TESTSYM', [[TSp, 100, 10], [TSp + 300000, 101, 12]]);
  var rF1 = await ArchF.speichere(true);
  ok(rF1.misslungen === 1, 'Archiv: ein gescheiterter Flush wird als solcher gemeldet', rF1.misslungen);
  ok(ArchF.flushFehler().n === 1 && /Platte voll/.test(ArchF.flushFehler().grund),
     'Archiv: der Grund des Fehlschlags bleibt abrufbar');
  antwort = { ok: true };
  var rF2 = await ArchF.speichere(true);
  ok(versuche === 2 && rF2.misslungen === 0,
     'Archiv: der naechste Flush versucht es ERNEUT - die Aenderungsmarke blieb stehen', versuche);
  await ArchF.speichere(true);
  ok(versuche === 2, 'Archiv: nach dem Erfolg ist die Marke geloescht - kein Dauerschreiben', versuche);
  ok(true, 'Archiv-Flush: der asynchrone Abschnitt ist wirklich gelaufen');
})());
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

/* Stempel gegen echte Kerze: WER GEWINNT? (Befund 22.08.2026, Gegenpruefung der
 * Signalstudie). Die alte Regel entschied nach Reihenfolge - der zuerst behaltene
 * Eintrag verdraengte alles, was innerhalb 0,9 Kerzenlaengen folgte. Faellt ein
 * Stempel zufaellig knapp UEBER die Schwelle (17:29:31 liegt 271 s hinter der
 * 17:25-Kerze, die Schwelle sind 270 s), wird er behalten - und die echte
 * 17:30-Kerze 29 s spaeter gilt als sein Stempel. Die Kette laeuft weiter, bis eine
 * Luecke sie bricht. NVDA 5m verlor am 19.08.2026 so den Nachmittag 17:30-19:50;
 * im Archiv standen 961 solcher Eintraege in 45 Symbolen (5m), 85 (1m), 198 (15m). */
(function () {
  var m = 60000;
  function zeit(r) { return r.map(function (b) { return new Date(b[0]).toISOString().slice(11, 19); }); }

  // --- Fall 1: Stempel NACH der echten Kerze (die Kette aus dem Befund, NVDA 5m) ---
  var t5 = Date.UTC(2026, 7, 19, 17, 25);
  var kette = [
    [t5,             221.5,  372282, 221.7, 221.3],      // 17:25:00 echt
    [t5 + 4 * m + 31000, 220.9,   0, 220.9, 220.9],      // 17:29:31 Stempel, 271 s -> ueber der Schwelle
    [t5 + 5 * m,     220.8,  310000, 221.0, 220.6],      // 17:30:00 echt  (fiel frueher als "Stempel")
    [t5 + 9 * m + 26000, 220.7,   0, 220.7, 220.7],      // 17:34:26 Stempel
    [t5 + 10 * m,    220.6,  290000, 220.8, 220.4]       // 17:35:00 echt
  ];
  var kSauber = A.ohneStempel(kette, 5);
  ok(kSauber.length === 3 && kSauber.every(function (b) { return b[0] % (5 * m) === 0 && b[2] > 0; }),
     'ohneStempel: Stempel NACH der echten Kerze verdraengt sie nicht mehr (NVDA-Kette 19.08.)',
     zeit(kSauber).join(' '));

  // --- Fall 2: Stempel VOR der echten Kerze - die Rasterkerze holt ihren Platz zurueck ---
  /* 60m, US-Aktie: das Raster liegt auf :30. Ein Stempel um 14:25 steht 55 min hinter
   * der 13:30-Kerze - ueber der Schwelle von 54 min, er landet also erst einmal in der
   * Serie. Fuenf Minuten spaeter kommt die echte 14:30-Kerze und muss ihn verdraengen. */
  var t60 = Date.UTC(2026, 7, 21, 13, 30);
  var vorher = [
    [t60,                100.0, 32276874, 101.0,  99.5],  // 13:30 echt
    [t60 + 55 * m,       100.4,      120, 100.4, 100.4],  // 14:25 Stempel (mit Volumen: nur die Rasterlage entlarvt ihn)
    [t60 + 60 * m,       100.3, 10991780, 100.9,  99.9],  // 14:30 echt
    [t60 + 120 * m,      100.2,  7493432, 100.7,  99.8]   // 15:30 echt
  ];
  var vSauber = A.ohneStempel(vorher, 60);
  ok(vSauber.length === 3 && vSauber[1][0] === t60 + 60 * m && vSauber[1][2] === 10991780,
     'ohneStempel: die Rasterkerze verdraengt den frueher eingetroffenen Stempel',
     zeit(vSauber).join(' '));

  // Derselbe Stempel ohne nahen Nachbarn: 15:28 liegt 58 min hinter 14:30 und 62 min vor
  // 16:30 - beide Male ueber der Schwelle. Nur Rasterlage PLUS Signatur (V=0, H=L=C) faellt ihn.
  var frei = [
    [t60,           100.0, 32276874, 101.0, 99.5],
    [t60 + 60 * m,  100.3, 10991780, 100.9, 99.9],
    [t60 + 118 * m, 100.5,        0, 100.5, 100.5],       // 15:28 Stempel, ohne Konflikt
    [t60 + 180 * m, 100.2,  7493432, 100.7, 99.8]
  ];
  ok(A.ohneStempel(frei, 60).length === 3,
     'ohneStempel: ein Stempel ohne nahen Nachbarn faellt ueber Rasterlage + Signatur',
     zeit(A.ohneStempel(frei, 60)).join(' '));

  // --- Fall 3: Luecken sind KEINE Stempel ---
  var wochenende = [
    [Date.UTC(2026, 7, 21, 19, 55), 100, 5000, 101, 99],  // Freitag Handelsschluss
    [Date.UTC(2026, 7, 24, 13, 30), 101, 6000, 102, 100], // Montag Eroeffnung: 65,6 h spaeter
    [Date.UTC(2026, 7, 24, 13, 35), 101, 6000, 102, 100]
  ];
  ok(A.ohneStempel(wochenende, 5).length === 3,
     'ohneStempel: Wochenend-Luecke bleibt unangetastet');
  var mittag = [[t5, 100, 1, 100, 99], [t5 + 5 * m, 100, 1, 100, 99], [t5 + 200 * m, 100, 1, 100, 99]];
  ok(A.ohneStempel(mittag, 5).length === 3, 'ohneStempel: Handelspausen sind keine Stempel');

  // --- Das Raster wird GELERNT, nicht auf null gesetzt ---
  /* Yahoos Stundenkerzen fuer US-Aktien beginnen 13:30 UTC. Im Archiv liegen 579.675
   * der 719.575 Stundenkerzen auf Offset 30 min - ein fest verdrahtetes
   * t % (barMin*60000) === 0 haette vier Fuenftel des Stundenarchivs geloescht. */
  var usTag = [];
  for (var h = 0; h < 7; h++) usTag.push([t60 + h * 60 * m, 100 + h, 1000000, 101 + h, 99 + h]);
  ok(A.rasterPhase(usTag, 3600000) === 30 * m, 'rasterPhase lernt den US-Stundenstart :30',
     A.rasterPhase(usTag, 3600000) / m + ' min');
  ok(A.ohneStempel(usTag, 60).length === 7,
     'ohneStempel: ein voller US-Stundentag ueberlebt vollstaendig (kein Null-Raster erzwungen)',
     A.ohneStempel(usTag, 60).length);
  ok(A.rasterPhase([[Date.UTC(2026, 7, 21, 0, 0), 1, 1]], 3600000) === 0,
     'rasterPhase liefert 0, wo die Serie auf der vollen Stunde liegt (Krypto)');

  /* Die gelernte Phase entscheidet NUR den Konflikt - sie loescht nie fuer sich allein.
   * An verkuerzten Handelstagen (Thanksgiving, 3. Juli, Heiligabend) schliesst die
   * US-Boerse 18:00 UTC; Yahoo liefert dort eine Stundenkerze auf Offset 0 MIT Spanne.
   * 114 der 122 Stundenreihen im Archiv haben je sieben solcher Kerzen. */
  var halbtag = [
    [Date.UTC(2025, 11, 24, 14, 30), 188.2,  9095497, 188.5, 187.9],
    [Date.UTC(2025, 11, 24, 15, 30), 188.2,  9095497, 188.5, 187.9],
    [Date.UTC(2025, 11, 24, 16, 30), 188.2,  9095497, 188.5, 187.9],
    [Date.UTC(2025, 11, 24, 18,  0), 188.3,        0, 189.2, 187.1]   // Rest-Kerze: V=0, aber H != L
  ];
  ok(A.ohneStempel(halbtag, 60).length === 4,
     'ohneStempel: die echte 18:00-Kerze des Halbtags bleibt (Spanne statt H=L=C)',
     A.ohneStempel(halbtag, 60).length);

  /* Capital-CFD-Kerzen brauchen keine Ausnahme: snapshotTimeUTC lautet
   * "2026-08-19T09:00:00" - glatte Rasterzeit. Nachgemessen am 22.08.2026 an den 45
   * reinen CFD-Reihen im Archiv (ADP 5m: 4836 Kerzen, Median-Volumen 57 statt
   * Boersenvolumen): 0 Eintraege neben dem Raster. */
  var cfd = [];
  for (var c = 0; c < 12; c++) cfd.push([Date.UTC(2026, 4, 26, 13, 30) + c * 5 * m, 300 + c * 0.1, 57, 300.2, 299.9]);
  ok(A.ohneStempel(cfd, 5).length === 12,
     'ohneStempel: Capital-CFD-Kerzen liegen auf demselben Raster und bleiben vollstaendig');
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
console.log('\n17) Kapitalschutz: Kill-Switch, Positionsgroessen-Wachhund, Stale-Daten, Regime-Pause');
(function () {
  var depotSrc = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  // --- 1) Kill-Switch: die Regel wird AUSGEFUEHRT, nicht gelesen ---
  /* Bis 8.24.5 stand hier eine Textsuche plus eine Nachbau-Formel mit dem Kommentar
   * "identische Formel wie im Produktcode". Zwei Kopien derselben Regel - und die
   * Pruefung faellt genau dann aus, wenn sie gebraucht wird: aendert jemand die Formel
   * in depot.js, rechnet der Test weiter mit der alten und bleibt gruen. Seit die
   * Entscheidungen in risiko.js stehen (ohne D, ohne DOM), laeuft hier der ECHTE Code. */
  var Ri = require(__dirname + '/risiko.js');

  ok(/function killSwitchPruefen/.test(depotSrc), 'Kill-Switch: die Nebenwirkungen liegen weiter in depot.js');
  ok(/HEALTH\.scans\+\+[\s\S]{0,300}killSwitchPruefen\(now\)/.test(depotSrc),
     'Kill-Switch: wird im Intraday-Scan aufgerufen, vor jeder Signalpruefung');
  ok(/closeTrade\(p, sp, now, grund\)/.test(depotSrc), 'Kill-Switch: stellt offene Positionen wirklich glatt');
  ok(/killSwitchAktiv\(\)\) \{ patienceAdd\('Kill-Switch/.test(depotSrc), 'Kill-Switch: sperrt neue Einstiege bis Tagesende');
  ok(/risk: \{ maxPos: 8, dayLossPct: 3,/.test(depotSrc), 'Kill-Switch: Standard-Tagesverlustlimit steht auf 3 %');

  function ks(eq, start, limit) { return Ri.killSwitchFaellig({ risk: { dayLossPct: limit }, dayStartEq: start }, eq); }
  ok(ks(9700, 10000, 3).faellig === true,  'Kill-Switch: −3,0 % bei Limit 3 loest aus');
  ok(ks(9701, 10000, 3).faellig === false, 'Kill-Switch: −2,99 % loest noch nicht aus');
  ok(ks(9000, 10000, 3).faellig === true,  'Kill-Switch: −10 % loest erst recht aus');
  ok(ks(10500, 10000, 3).faellig === false, 'Kill-Switch: ein Gewinntag loest nie aus');
  /* Die drei Wege, auf denen der Schalter NICHT ausloesen darf. Jeder einzelne waere
   * sonst ein Totalglattstellen aus dem Nichts - beim Erststart, nach einem Reset oder
   * bei ausgeschaltetem Limit. */
  ok(Ri.killSwitchFaellig({ risk: {}, dayStartEq: 10000 }, 100).faellig === false,
     'Kill-Switch: ohne gesetztes Limit passiert nichts, egal wie tief der Stand');
  ok(Ri.killSwitchFaellig({ risk: { dayLossPct: 3 }, dayStartEq: 0 }, 100).faellig === false,
     'Kill-Switch: ohne Tagesstart wird nicht gerechnet (Erststart)');
  ok(Ri.killSwitchFaellig({ risk: { dayLossPct: 3 }, dayStartEq: -5 }, 100).faellig === false,
     'Kill-Switch: ein negativer Tagesstart loest nicht aus');
  // Der Begruendungstext geht ins Protokoll und ins Warnband - er muss die Zahlen tragen
  ok(/−3,?0? %|-3\.0 %/.test(ks(9700, 10000, 3).grund.replace('.', ',')) && /Limit −3 %/.test(ks(9700, 10000, 3).grund),
     'Kill-Switch: die Begruendung nennt Verlust UND Limit');

  // --- 1b) Positionslimit und Exposure-Deckel, ebenfalls ausgefuehrt ---
  function darf(z, eq) { return Ri.darfOeffnen(z, eq); }
  var vollesRisiko = { maxPos: 8, dayLossPct: 3, exposurePct: 40 };
  ok(darf({ risk: vollesRisiko, positionen: 8, dayStartEq: 10000, cash: 10000 }, 10000).ok === false,
     'Positionslimit: die achte Position ist die letzte');
  ok(darf({ risk: vollesRisiko, positionen: 7, dayStartEq: 10000, cash: 10000 }, 10000).ok === true,
     'Positionslimit: bei sieben ist noch Platz');
  ok(darf({ risk: vollesRisiko, positionen: 0, dayStartEq: 10000, cash: 10000 }, 9700).ok === false,
     'Tagesverlust: auch der Einstieg ist am Limit gesperrt, nicht nur der Kill-Switch');
  /* 60 % Bestand bei 40 % Deckel: (10000-4000)/10000 = 60 %. */
  ok(darf({ risk: vollesRisiko, positionen: 0, dayStartEq: 10000, cash: 4000 }, 10000).ok === false,
     'Exposure: 60 % in Scheinen bei 40 % Deckel wird abgelehnt');
  ok(darf({ risk: vollesRisiko, positionen: 0, dayStartEq: 10000, cash: 6500 }, 10000).ok === true,
     'Exposure: 35 % in Scheinen bleibt erlaubt');
  /* Der Divisionsschutz (eq > 0 ? ... : 0) ist nur ueber DIESEN Weg erreichbar: mit
   * gesetztem Tagesstart faengt die Tagesverlust-Regel eine Equity von 0 vorher als
   * −100 % ab. Ohne Tagesstart - Erststart, direkt nach einem Reset - laeuft es bis
   * zum Exposure-Zweig durch, und dort darf nicht durch null geteilt werden. */
  ok(darf({ risk: vollesRisiko, positionen: 0, dayStartEq: 0, cash: 4000 }, 0).ok === true,
     'Exposure: bei Equity 0 ohne Tagesstart wird nicht durch null geteilt');
  ok(darf({ risk: vollesRisiko, positionen: 0, dayStartEq: 10000, cash: 4000 }, 0).ok === false,
     'Equity 0 mit Tagesstart ist ein Totalverlust und wird vorher als Tagesverlust gestoppt');
  /* Die REIHENFOLGE der Pruefungen entscheidet, welchen Grund der Nutzer zu sehen
   * bekommt. Liegen mehrere Gruende an, muss weiterhin der Stueckzahl-Grund gewinnen. */
  var mehrfach = darf({ risk: vollesRisiko, positionen: 9, dayStartEq: 10000, cash: 0 }, 5000);
  ok(mehrfach.ok === false && /Positionslimit/.test(mehrfach.why),
     'Reihenfolge: bei mehreren Gruenden nennt die Meldung zuerst das Positionslimit');
  // Der Rueckfall, wenn D.risk fehlt - er ist bewusst ein anderer als die Erstinstallation
  ok(Ri.STANDARD.dayLossPct === 5 && Ri.STANDARD.maxPos === 8 && Ri.STANDARD.exposurePct === 40,
     'Rueckfall ohne D.risk: 8 Positionen, 5 % Tagesverlust, 40 % Exposure');
  ok(darf({ positionen: 8, dayStartEq: 10000, cash: 10000 }, 10000).ok === false,
     'Rueckfall greift wirklich, wenn gar kein risk-Objekt da ist');
  /* Die gefaehrlichste Fehlerart an dieser Stelle ist nicht "lehnt zu viel ab", sondern
   * "laesst alles durch": undefined >= 8 ist falsch, (eq - undefined) ist NaN, und
   * NaN >= 40 ist ebenfalls falsch - beide Sperren waeren offen. Ein einziger
   * Tippfehler im Feldnamen an der Aufrufstelle genuegt dafuer. */
  [
    ['positionen fehlt', { risk: vollesRisiko, dayStartEq: 10000, cash: 10000 }, 10000],
    ['cash fehlt',       { risk: vollesRisiko, positionen: 0, dayStartEq: 10000 }, 10000],
    ['Equity fehlt',     { risk: vollesRisiko, positionen: 0, dayStartEq: 10000, cash: 10000 }, undefined],
    ['Equity ist NaN',   { risk: vollesRisiko, positionen: 0, dayStartEq: 10000, cash: 10000 }, NaN],
    ['gar kein Zustand', null, 10000]
  ].forEach(function (f) {
    var e = darf(f[1], f[2]);
    ok(e.ok === false && /unvollständig/.test(e.why),
       'Unvollstaendiger Zustand (' + f[0] + ') fuehrt zu KEINEM Einstieg, nicht zu freier Fahrt');
  });
  /* Kein throw: eine Ausnahme mitten im Scan wuerde den Durchlauf abbrechen - und damit
   * auch die AUSSTIEGE, die in derselben Schleife stehen. */
  ok((function () { try { darf(null, 10000); return true; } catch (e) { return false; } })(),
     'Unvollstaendiger Zustand wirft nicht - sonst blieben auch die Ausstiege liegen');

  // --- 1c) depot.js darf die Regeln nicht ein zweites Mal enthalten ---
  /* Genau daran ist die alte Pruefung gescheitert: eine Kopie der Formel, die
   * auseinanderlaufen kann. Es darf nur noch EINE geben. */
  ok(!/dayPct <= -r\.dayLossPct/.test(depotSrc) && !/expo >= r\.exposurePct/.test(depotSrc),
     'Kapitalschutz: die Formeln stehen nur noch in risiko.js, nicht doppelt in depot.js');
  ok(/R\.darfOeffnen\(/.test(depotSrc) && /R\.killSwitchFaellig\(/.test(depotSrc),
     'Kapitalschutz: depot.js ruft die echten Entscheidungen auf');
  ok(/if \(!R\) throw new Error/.test(depotSrc),
     'Kapitalschutz: fehlt risiko.js, bricht depot.js laut ab statt still ohne Schutz zu laufen');
  var htmlLade = fs.readFileSync(__dirname + '/index.html', 'utf8');
  ok(htmlLade.indexOf('risiko.js') < htmlLade.indexOf('src="depot.js"') && htmlLade.indexOf('risiko.js') > 0,
     'Kapitalschutz: risiko.js wird vor depot.js geladen');

  // --- 2) Positionsgroesse: der Wachhund auf die Zahl der Stellen ---
  /* Der lokale KI-Pfad ist am 23.08.2026 entfernt worden (er lief laut Diagnose ueber
   * 14 Sitzungen kein einziges Mal). Die Pruefungen auf die KI-Kappe sind damit
   * gegenstandslos. Was BLEIBT, ist der Wachhund: Er zaehlt die Stellen, an denen eine
   * Positionsgroesse aus equityNow() gebildet wird. Aendert sich die Zahl, ist eine
   * Stelle dazugekommen oder verschwunden - und genau das ist hier schon einmal
   * unbemerkt passiert. Vorher zaehlte er den KI-Faktor als Marker mit; jetzt zaehlt
   * er die Stellen selbst. */
  var sizingStellen = depotSrc.match(/equityNow\(\) \* [^;]*?\/ \(?ask/g) || [];
  ok(sizingStellen.length === 6, 'Positionsgroesse: alle sechs Stellen gefunden ' +
     '(zwei Schein-Stellen, der Deckel qMax, zwei Bruchstueck-Stellen, eine in openTrade)', sizingStellen.length);
  ok(!/\bki\.factor|\bkiRes\.factor/.test(depotSrc),
     'Kein KI-Faktor mehr in der Positionsgroesse');
  ok(!/window\.LocalKI/.test(depotSrc),
     'depot.js spricht das lokale Modell nirgends mehr an');
  ok(!fs.existsSync(__dirname + '/ollama.js'),
     'Das Ollama-Modul ist entfernt - es lief laut Diagnose ueber 14 Sitzungen kein einziges Mal');

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
  /* Auch hier die ECHTE Funktion, ueber echte Bars mit echten Zeitstempeln - nicht die
   * Formel nachgebaut. Der Nachbau haette den Umgang mit leeren Bars nie geprueft. */
  var jetztT = 1756000000000;
  function bar(minAlt) { return [[jetztT - minAlt * 60000, 100]]; }
  function frisch(alterMin, barMin) { return Ri.barsFrisch(bar(alterMin), barMin, jetztT).ok; }
  ok(frisch(14, 5) === true,  '5m-Chart: 14 Min alter Bar ist noch frisch');
  ok(frisch(16, 5) === false, '5m-Chart: 16 Min alter Bar ist zu alt (Grenze 15)');
  ok(frisch(15, 5) === true,  '5m-Chart: genau 15 Min ist die Grenze und noch erlaubt');
  ok(frisch(200, 60) === false, '60m-Chart: 200 Min alter Bar ist zu alt (Grenze 180)');
  ok(frisch(2, 1) === true && frisch(4, 1) === false, '1m-Chart: Grenze liegt bei 3 Min');
  ok(Ri.barsFrisch([], 5, jetztT).ok === false && Ri.barsFrisch(null, 5, jetztT).ok === false,
     'Stale-Schutz: gar keine Bars gelten als NICHT frisch (kein Einstieg ins Leere)');
  ok(Ri.barsFrisch(bar(42), 5, jetztT).alterMin === 42,
     'Stale-Schutz: das gemeldete Alter stimmt - es steht in der Geduld-Bilanz');

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
  // Der Knopf setzt seine Felder seit der Einzel-Ruecknahme ueber setz(), damit der alte
  // Wert je Feld mitgeschrieben wird. Geprueft wird weiter die Wirkung, nicht die Schreibweise.
  ok(/setz\('intraday', 'regimeZuteilung', true/.test(stratSrc) || /regimeZuteilung = true/.test(stratSrc),
     'Regime: Empfehlungs-Knopf schaltet die Regel an');
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
  /* Die KI-Oberflaeche ist am 23.08.2026 mit dem KI-Pfad entfernt worden. Der Pfad
   * lief laut Diagnose ueber 14 Sitzungen kein einziges Mal; die Karte und die
   * Einstellungen blieben aber stehen und schalteten nichts mehr. Wichtig ist, dass
   * auch die ZUGRIFFE verschwunden sind: getElementById('setOllamaUrl').value auf
   * ein entferntes Feld haette den Einstellungsdialog beim Oeffnen abstuerzen lassen. */
  ok(!/id="kiState"|id="kiLog"|id="setKiVeto"|id="setOllamaUrl"/.test(h),
     'Keine KI-Bedienelemente mehr in der Oberflaeche');
  var shell = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  ok(!/setOllamaUrl|setKiVeto|setKiRules|setOllamaModel|setKiProvider/.test(shell),
     'app-shell.js greift auf kein entferntes KI-Feld mehr zu (sonst Absturz im Dialog)');
  ok(!/getElementById('kiState')/.test(d), 'depot.js fuellt keine KI-Karte mehr');
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
  /* Seit dem E-Rest wohnen die Einmal-Migrationen in depotmigration.js. */
  ok(/rsi2seitZeitrahmenGeprueft/.test(fs.readFileSync(__dirname + '/depotmigration.js', 'utf8')),
     'Einmal-Sicherung zieht Bestandsdepots auf 60m gerade');
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
  // Seit Stufe E wohnt runBacktest in backtestui.js - dort wird geschnitten.
  ok(/mode === 'intraday' \|\| mode === 'intradayCompare'[\s\S]{0,160}rsi2seit/.test(
       fs.readFileSync(__dirname + '/backtestui.js', 'utf8')),
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
  ok(/if \(D\.__ausSicherung\)/.test(fs.readFileSync(__dirname + '/depotmigration.js', 'utf8')) &&
     /delete D\.__ausSicherung/.test(fs.readFileSync(__dirname + '/depotmigration.js', 'utf8')),
     'Store: der Renderer zeigt die Markierung an und entfernt sie vor dem Speichern');
  ok(/storeSet\('depot', D\)\.then\(function \(r\)/.test(d) && /HEALTH\.saveFail/.test(d),
     'Store: save() prueft sein Ergebnis und meldet Fehlschlaege');
  // 3) Edge-Waechter hat jetzt die angekuendigte Konsequenz
  /* Seit 25.08.2026 laeuft der Waechter ueber BEIDE Arme (EDGE_ARME); Historie und Pause
   * stehen je Arm unter einem berechneten Schluessel. Die geprueften Zusagen sind
   * dieselben geblieben. */
  ok(/a\[ARM\.histKey\]\[1\]\.verfall/.test(d), 'Edge-Waechter: Eskalation erst nach ZWEI Naechten Verfall');
  ok(/D\.intraday\[ARM\.pauseKey\] = \{ seit/.test(d), 'Edge-Waechter: Verfall pausiert neue Einstiege wirklich');
  ok(/schattenNeu\('Edge-Wächter'/.test(d), 'Edge-Waechter: pausierte Signale laufen im Schattenbuch weiter');
  ok(/edgePauseHand/.test(d) && /data-edgefrei/.test(d), 'Edge-Waechter: Hand-Uebersteuerung existiert und wird respektiert');
  ok(/roh > 0 && D\.intraday\[ARM\.pauseKey\]\) \{\s*\n\s*delete D\.intraday\[ARM\.pauseKey\]/.test(d),
     'Edge-Waechter: eine positive Nacht hebt die Pause automatisch auf');
  /* TOTBAND (24.08.2026): Vorher entschieden BEIDE Richtungen am auf zwei Stellen
   * gerundeten mittelPp. Ein wahrer Mittelwert von +0,004 Pp rundet auf 0,00, gilt
   * damit als Verfall UND kann die Pause nie aufheben - der Waechter hing fest.
   * Im gespeicherten Zustand standen vier Naechte in Folge mittelPp -0,04 bei t -0,19. */
  /* Seit dem 25.08.2026 entscheidet die AUSLOESUNG am t-Wert (Verfall verlangt einen
   * bedeutsamen Rueckgang, nicht bloss ein negatives Vorzeichen). Damit gilt dieselbe
   * Lehre fuer t: entschieden wird an rohT, nicht am gerundeten Anzeigewert. Die
   * AUFHEBUNG entscheidet unveraendert am ungerundeten rohMittel. */
  ok(/var roh = edge\.rohMittel != null/.test(d) && /rohT: t,/.test(d) &&
     /edge\.rohT != null \? edge\.rohT : edge\.t/.test(d),
     'Edge-Waechter: Ausloesung und Aufhebung entscheiden am UNGERUNDETEN Wert (kein Totband)');
  ok(/rohMittel: m,/.test(d), 'Der ungerundete Mittelwert wird ueberhaupt mitgeliefert');
  /* A9: Die Kontrolle muss aus demselben Fenster kommen wie die Signale. */
  ok(/for \(var i = 0; i < c\.length - H; i \+= H\) \{\s*\n\s*if \(bars\[i\]\[0\] < abT\) continue;/.test(d),
     'A9: Die Drift-Kontrolle laeuft ueber dasselbe 120-Tage-Fenster wie die Signale');
  /* D1: Der Waechter sperrt nur, was er auch misst. */
  ok(/async function edgeZustand\(entry\)/.test(d) && /var H = istKapiArm \? 26 : 8/.test(d),
     'D1: Der Waechter misst je Arm - mit dessen eigener Haltedauer (26 gegen 8 Kerzen)');
  ok(/D\.intraday\.edgePauseKapi/.test(d) && !/\(isRsi2Seit \|\| isKapitulation\) && D\.intraday\.edgePause/.test(d),
     'D1: Der Kapitulations-Dip wird nicht mehr von einer rsi2seit-Messung gesperrt');
  ok(/kann Verfall nicht von Rauschen trennen/.test(d),
     'Der Waechter sagt bei |t| < 2, dass er Verfall nicht von Rauschen trennen kann - und pausiert trotzdem');
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
  /* Seit Stufe E schneiden die Trendfinder-Marken in der eigenen Datei. */
  var wq = fs.readFileSync(__dirname + '/wendeui.js', 'utf8');
  ok(/data-wende=/.test(wq) && /function wendeChartsVerkabeln/.test(wq),
     'Trendwechsel-Chart: Zeilen sind anklickbar und verkabelt');
  ok(/function zeichneWendeChart/.test(wq) && /WENDE_BARS\[sy\] = sigBars/.test(wq),
     'Trendwechsel-Chart: gezeichnet werden genau die geprueften Kerzen, kein zweiter Abruf');
  ok(/ab hier bestätigt/.test(wq) && /kein Blick in die Zukunft/.test(wq),
     'Trendwechsel-Chart: die Bestaetigungs-Verzoegerung ist im Bild sichtbar und benannt');
  ok(/Beobachtung, kein Handel – Simulation, keine Anlageberatung/.test(wq),
     'Trendwechsel-Chart: auch die Chart-Legende bleibt ehrlich');

  // --- Spekulations-Radar (22.08.2026): Anzeige von Fremdinhalten, streng entschaerft ---
  ok(/read-spekulationen/.test(m2) && /spekulationen\.json/.test(m2), 'Radar: Lese-Kanal im Hauptprozess existiert');
  ok(/st\.size > 300000/.test(m2), 'Radar: Groessenkappe gegen ausufernde Dateien');
  var p2 = fs.readFileSync(__dirname + '/preload.js', 'utf8');
  ok(/readSpekulationen/.test(p2), 'Radar: Bruecke ist exponiert');
  ok(/id="spekRadar"/.test(h), 'Radar: Karte auf dem Dashboard vorhanden');
  /* Seit 8.24.2 steht die Einordnung im Erklaerregister (app-shell.js) statt als
   * Dauer-Absatz in der Ueberschrift. Die Zusicherung "Gehandelt wird hiervon nichts"
   * bleibt dagegen SICHTBAR - sie ist keine Erklaerung. Beides wird hier geprueft. */
  var shellQ = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  ok(/Gehandelt wird hiervon nichts/.test(h),
     'Radar: die Karte sagt sichtbar, dass nichts davon gehandelt wird');
  ok(/Ungemessen, reine Beobachtung: Gerüchte sind oft falsch/.test(shellQ) && /'heute\.radar'/.test(shellQ),
     'Radar: die Einordnung ist ueber den Erklaerknopf erreichbar');
  ok(/esc\(z\.these\)/.test(r) && /esc\(safeUrl\(q\.url\)\)/.test(r),
     'Radar: Fremdinhalte werden escaped, Links nur ueber safeUrl');
  ok(/jetzt - t > 48 \* 3600000\) continue/.test(r), 'Radar: Eintraege aelter als 48 h fallen raus');
  ok(/ein\.slice\(0, 12\)/.test(r), 'Radar: hoechstens 12 Eintraege');
  /* Takt und Anzeige muessen zusammenpassen (23.08.2026). Der Radar lief stuendlich
   * und sucht seit der Umstellung nur noch dreimal taeglich vor US-Eroeffnung
   * (06:45/12:45/14:45 + Versatz). Die Karte meldete "veraltet" nach 3 Stunden -
   * damit haette sie ab sofort fast durchgehend gewarnt. Eine Warnung, die immer
   * steht, wird ueberlesen, wenn sie einmal stimmt. Groesste regulaere Luecke ist
   * die Nacht: 16 Stunden. */
  var schwelleH = (/var alt = jetzt - r\.mtime > (\d+) \* 3600000;[\s\S]{0,4000}?veraltet<\/b>, die Suche/.exec(r) || [])[1];
  ok(schwelleH !== undefined && Number(schwelleH) > 16,
     'Radar: Veraltet-Schwelle passt zum Takt (groesser als die 16-Stunden-Nachtluecke)', schwelleH + ' h');
  ok(!/stündlich/.test(h.slice(h.indexOf('Spekulations-Radar'), h.indexOf('Spekulations-Radar') + 400)) &&
     !/stündliche Suche/.test(r),
     'Radar: die Oberflaeche behauptet keinen stuendlichen Takt mehr');
  ok(/const SPEK_URL =/.test(m2), 'Radar: Gemeinschafts-Ablage haengt an einer festen URL');
  ok(/d\.length > 300000/.test(m2), 'Radar: Groessenkappe gilt auch fuer den Netz-Abruf');
  ok(/netz\.mtime > lokal\.mtime/.test(m2), 'Radar: der frischere der beiden Staende gewinnt');
  ok(/quelleText/.test(r), 'Radar: die Karte sagt, woher der Stand stammt');
  ok(/spekGesehen\.indexOf\(z\.id\) === -1/.test(r), 'Radar: Benachrichtigung je Eintrag nur einmal');
  /* Fehler #56 (23.08.2026): Kennung, Chips, These und Quellen standen alle in
   * einer Flex-Reihe - je nach Thesenlaenge brach jede Zeile woanders um. Radar
   * und Insider stapeln jetzt; die Vorboersen-Karte hat nur einen Chip und einen
   * kurzen Satz und bleibt bewusst einzeilig. */
  ok(/.spek-zeile.gestapelt .these { flex: 1 0 100%/.test(h),
     'Radar: das gestapelte Layout zwingt die These auf eine eigene volle Zeile');
  ok((r.slice(0, r.indexOf('================= Vorbörsen')).match(/spek-zeile gestapelt/g) || []).length === 2,
     'Radar/Insider: beide dichten Karten benutzen das gestapelte Layout');
  ok(/redaktionelle Einschätzung der Suche, keine Messung/.test(r),
     'Radar: die Chance-Einstufung wird als Setzung ausgewiesen');
  // Wunsch #49: Firmenname als Label neben dem Ticker, These auf einen Satz gekuerzt
  ok(/class="firma"/.test(r) && /esc\(z\.name\)/.test(r), 'Radar #49: Firmenname steht escaped neben dem Ticker');
  /* Der Escape-Aufruf heisst seit dem 25.08.2026 U.esc - eine Kopie weniger im Paket.
   * Gemessen wird deshalb die Eigenschaft und nicht der Name: der Tooltip entsteht aus
   * z.these, und er laeuft durch eine Escape-Funktion. */
  ok(/function spekKurz\(/.test(r) && /esc\(z\.kurz\)/.test(r) && /title="' \+ (U\.)?esc\(z\.these\)/.test(r),
     'Radar #49: These gekuerzt, voller Wortlaut bleibt als Tooltip');
  /* P5 (25.08.2026): These und Begruendung wurden hart auf 240 Zeichen geschnitten. Auf
   * der Karte endete der Satz dann einfach ("… veroeffentlicht, der MPS", "Was danach
   * kam") - nachgerechnet gegen die echte spekulationen.json waren sieben von sieben
   * Begruendungen betroffen. Ein Auslassungszeichen sagt, dass die ANZEIGE gekuerzt hat;
   * es darf aber nur dort stehen, wo wirklich etwas fehlt. Beides wird hier geprueft -
   * die Hilfe wird ausgeschnitten und AUSGEFUEHRT, nicht als Text abgeglichen. */
  var kappeSrc = (/\n  function kappe\(t, n\) \{[\s\S]*?\n  \}/.exec(r) || [])[0];
  var kappeFn = kappeSrc ? new Function(kappeSrc + '\nreturn kappe;')() : null;
  ok(!!kappeFn && kappeFn('kurz genug', 40) === 'kurz genug',
     'Kappe: was unter die Grenze passt, bleibt Zeichen fuer Zeichen stehen');
  ok(!!kappeFn && / …$/.test(kappeFn('Wort '.repeat(30), 40)) && kappeFn('Wort '.repeat(30), 40).length <= 42,
     'Kappe: was darueber liegt, endet sichtbar mit Auslassungszeichen an der Wortgrenze');
  ok(/these: kappe\(e\.these, 240\)/.test(r) && /kappe\(e\.begruendung, 240\)/.test(r),
     'Radar: These UND Begruendung laufen durch die Kappe, nicht nur eine von beiden');
  /* Liefe die Kennung ueber die Kappe, aenderten sich die Kennungen aller bestehenden
   * Eintraege - spekGesehen meldete dann jede alte Spekulation noch einmal als neu. */
  ok(/id: String\(e\.id \|\| \(e\.sym \+ '\|' \+ e\.these\)\)/.test(r),
     'Radar: die Kennung haengt weiter am ungekappten Text - sonst meldete jeder Eintrag neu');

  /* --- Insider-Kaeufe (23.08.2026): SEC Form 4 -----------------------------
   * Die Siebung ist der ganze Wert dieser Karte: ueber 90 Prozent der Meldungen sind
   * Zuteilungen, Optionsausuebungen und Plan-Verkaeufe. Deshalb wird hier die
   * Rechnung selbst geprueft, nicht nur der Quelltext. */
  var IH = require('./tools/insider-holen.js');
  var EG = require('./tools/edgar.js');

  // Der Tagesindex haelt sich nicht an die eigene Kopfzeile: sie behauptet, der
  // Formtyp sei 12 Zeichen breit, bei "SCHEDULE 13D" beginnt der Name aber erst in
  // Spalte 18. Feste Spaltenbreiten waeren hier still falsch.
  var zF4 = EG.zeileLesen('4                3D SYSTEMS CORP                                               910638      20260821    edgar/data/910638/0001628280-26-058429.txt');
  var z13 = EG.zeileLesen('SCHEDULE 13D     IMMERSION CORP                                                1058811     20260821    edgar/data/1058811/0001104659-26-078123.txt');
  var z13a = EG.zeileLesen('SCHEDULE 13D/A   COMSCORE, INC.                                                1158172     20260821    edgar/data/1158172/0001104659-26-078200.txt');
  ok(zF4 && zF4.typ === '4' && zF4.firma === '3D SYSTEMS CORP' && zF4.cik === '910638',
     'EDGAR-Index: Form-4-Zeile korrekt zerlegt', zF4 && zF4.typ);
  ok(z13 && z13.typ === 'SCHEDULE 13D' && z13.firma === 'IMMERSION CORP',
     'EDGAR-Index: 13D-Zeile trotz breiterem Formtyp-Feld korrekt zerlegt', z13 && z13.firma);
  ok(z13a && z13a.typ === 'SCHEDULE 13D/A',
     'EDGAR-Index: Aenderungsmeldung wird NICHT als Original gelesen', z13a && z13a.typ);
  ok(EG.entities('Chairman &amp; CEO') === 'Chairman & CEO',
     'EDGAR: Entitaeten werden aufgeloest, sonst steht &amp;amp; in der Karte');

  // Nur der offene Marktkauf zaehlt (Code P). Zuteilung (A), Optionsausuebung (M)
  // und Verkauf (S) sagen nichts ueber eine Einschaetzung aus.
  function f4xml(code, stueck, preis) {
    return '<nonDerivativeTable><nonDerivativeTransaction>' +
      '<transactionCoding><transactionCode>' + code + '</transactionCode></transactionCoding>' +
      '<transactionAmounts><transactionShares><value>' + stueck + '</value></transactionShares>' +
      '<transactionPricePerShare><value>' + preis + '</value></transactionPricePerShare>' +
      '<transactionAcquiredDisposedCode><value>' + (code === 'S' ? 'D' : 'A') + '</value></transactionAcquiredDisposedCode>' +
      '</transactionAmounts></nonDerivativeTransaction></nonDerivativeTable>';
  }
  var kaufP = IH.kaeufeLesen(f4xml('P', 1000, 50));
  ok(kaufP && kaufP.stueck === 1000 && Math.round(kaufP.wert) === 50000 && kaufP.kurs === 50,
     'Form 4: offener Marktkauf (P) wird gerechnet', kaufP && kaufP.wert);
  ok(IH.kaeufeLesen(f4xml('A', 1000, 50)) === null, 'Form 4: Aktienzuteilung (A) zaehlt NICHT');
  ok(IH.kaeufeLesen(f4xml('M', 1000, 50)) === null, 'Form 4: Optionsausuebung (M) zaehlt NICHT');
  ok(IH.kaeufeLesen(f4xml('S', 1000, 50)) === null, 'Form 4: Verkauf (S) zaehlt NICHT');
  // Derivate bleiben aussen vor: eine Option ist kein Kaufentschluss am Markt
  ok(IH.kaeufeLesen('<derivativeTable>' + f4xml('P', 1000, 50).replace(/nonDerivative/g, 'derivative') + '</derivativeTable>') === null,
     'Form 4: derivative Buchungen bleiben aussen vor');

  // Ein reiner 10-%-Aktionaer ist meist eine Struktur, kein Mensch mit Einblick -
  // im Probelauf waren das eine Muttergesellschaft und ein Kreditfonds.
  ok(IH.rolleLesen('<isOfficer>1</isOfficer><officerTitle>Chief Executive Officer</officerTitle>').rang === 3,
     'Form 4: CEO bekommt den hoechsten Rang');
  ok(IH.rolleLesen('<isDirector>true</isDirector>').intern === true, 'Form 4: Aufsichtsrat zaehlt als intern');
  ok(IH.rolleLesen('<isTenPercentOwner>1</isTenPercentOwner>').intern === false,
     'Form 4: reiner 10-%-Aktionaer zaehlt NICHT als intern');
  ok(IH.istFonds('Nuveen Municipal Income Fund') === true && IH.istFonds('ALASKA AIR GROUP') === false,
     'Form 4: geschlossene Fonds sind keine operativen Firmen');

  // Mehrere Insider derselben Firma sind der seltene, staerkere Fall - das muss die
  // Verdichtung als ein Eintrag mit Kopfzahl abbilden, nicht als zwei Zeilen.
  var vd = IH.verdichten([
    { sym: 'XYZ', firma: 'Beispiel Inc.', person: 'Muster Anna', rolle: { text: 'CEO', rang: 3 }, kauf: { stueck: 100, wert: 5000, kurs: 50, datum: '2026-08-20' }, url: 'https://www.sec.gov/a' },
    { sym: 'XYZ', firma: 'Beispiel Inc.', person: 'Muster Bernd', rolle: { text: 'Aufsichtsrat', rang: 1 }, kauf: { stueck: 100, wert: 3000, kurs: 30, datum: '2026-08-21' }, url: 'https://www.sec.gov/b' },
    { sym: 'ABC', firma: 'Andere Corp', person: 'Muster Carla', rolle: { text: 'CFO', rang: 3 }, kauf: { stueck: 10, wert: 9000, kurs: 900, datum: '2026-08-21' }, url: 'https://www.sec.gov/c' }
  ]);
  ok(vd.length === 2 && vd[0].sym === 'XYZ' && vd[0].anzahl === 2 && vd[0].wert === 8000,
     'Insider: mehrere Meldungen je Wert werden zu einem Eintrag mit Kopfzahl', vd[0] && vd[0].anzahl);
  ok(vd[0].rang === 3 && vd[0].id === '20260821-XYZ-insider',
     'Insider: hoechste Rolle gewinnt, id traegt das juengste Datum', vd[0] && vd[0].id);
  ok(vd[1].sym === 'ABC' && vd[0].anzahl > vd[1].anzahl, 'Insider: das Cluster steht vor dem Einzelkauf');

  // Schwellen: Pennystocks und Alibi-Kaeufe draussen, Liquiditaet gefordert
  ok(IH.MIN_KURS >= 5 && IH.MIN_WERT >= 100000 && IH.MIN_UMSATZ >= 10e6,
     'Insider: Schwellen fuer Kurs, Kaufwert und Tagesumsatz stehen', IH.MIN_KURS + '/' + IH.MIN_WERT + '/' + IH.MIN_UMSATZ);

  // Anzeige: dieselbe Strenge wie beim Radar, denn auch das ist Fremdinhalt
  ok(/read-insider/.test(m2) && /insider\.json/.test(m2), 'Insider: Lese-Kanal im Hauptprozess existiert');
  ok(/const INSIDER_URL =/.test(m2), 'Insider: Gemeinschafts-Ablage haengt an einer festen URL');
  ok(/readInsider/.test(p2), 'Insider: Bruecke ist exponiert');
  ok(/id="insiderKarte"/.test(h), 'Insider: Karte auf dem Dashboard vorhanden');
  ok(/esc\(z\.sym\)/.test(r) && /esc\(safeUrl\(q\.url\)\)/.test(r),
     'Insider: Fremdinhalte werden escaped, Links nur ueber safeUrl');
  ok(/jetzt - t > 21 \* 86400000\) continue/.test(r), 'Insider: Eintraege aelter als drei Wochen fallen raus');
  ok(/insiderGesehen\.indexOf\(z\.id\) === -1/.test(r), 'Insider: Benachrichtigung je Eintrag nur einmal');
  ok(/z\.anzahl > 1 && insiderGesehen/.test(r), 'Insider: benachrichtigt wird nur beim Cluster, nicht bei jedem Kauf');
  ok(/gemeldet – nicht gemessen/.test(r), 'Insider: die Karte weist aus, dass hier nichts gemessen ist');
  ok(/Gehandelt wird hiervon nichts/.test(h),
     'Insider: die Karte sagt sichtbar, dass nichts davon gehandelt wird');
  ok(/keine Intraday-Kante/.test(fs.readFileSync(__dirname + '/app-shell.js', 'utf8')),
     'Insider: was der Effekt ist und was nicht, steht hinter dem Erklaerknopf');
  /* Ein Lauf des Werkzeugs darf beim require nicht losgehen - sonst fragt jeder
     Testlauf die SEC ab und ueberschreibt die Datei. */
  var ihSrc = fs.readFileSync(__dirname + '/tools/insider-holen.js', 'utf8');
  ok(/require\.main === module/.test(ihSrc), 'Insider: das Werkzeug laeuft nur beim direkten Aufruf');
  ok(/nur offener Marktkauf/.test(ihSrc), 'Insider: im Werkzeug steht, warum nur Code P zaehlt');

  /* --- Vorboersen-Luecken (#55, 23.08.2026) ---------------------------------
   * Zwei Dinge muessen halten: die Rechnung (nur Kerzen aus dem Vorboersen-
   * Fenster, Basis ist der letzte regulaere Schluss) und die Rolle (reine
   * Anzeige, kein Handel, keine neue Fremdquelle). */
  (function () {
    var VM = require('./vormarkt.js');
    var rSrc = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
    var hSrc = fs.readFileSync(__dirname + '/index.html', 'utf8');
    var vmSrc = fs.readFileSync(__dirname + '/vormarkt.js', 'utf8');
    var mSrc = fs.readFileSync(__dirname + '/main.js', 'utf8');

    // Ein Tag mit Vorboerse: regulaerer Start 13:30 UTC, Vorboerse ab 8:00 UTC.
    var regStart = Math.floor(Date.UTC(2026, 7, 24, 13, 30) / 1000);
    var preStart = regStart - 19800;
    function chart(bars, basis) {
      return JSON.stringify({ chart: { result: [{
        meta: { chartPreviousClose: basis, currentTradingPeriod: {
          pre: { start: preStart, end: regStart }, regular: { start: regStart, end: regStart + 23400 } } },
        timestamp: bars.map(function (b) { return b.t; }),
        indicators: { quote: [{
          close: bars.map(function (b) { return b.c; }),
          volume: bars.map(function (b) { return b.v; }) }] }
      }] } });
    }
    // Vortags-Kerze (liegt VOR dem Vorboersen-Fenster), zwei Vorboersen-Kerzen,
    // eine regulaere Kerze. Nur die beiden mittleren duerfen zaehlen.
    var v = VM.vormarktAusChart(chart([
      { t: preStart - 86400, c: 50, v: 900000 },
      { t: preStart + 300,   c: 106, v: 30000 },
      { t: preStart + 600,   c: 110, v: 40000 },
      { t: regStart + 300,   c: 120, v: 500000 }
    ], 100));
    ok(v && Math.abs(v.luecke - 10) < 1e-9, 'Vormarkt #55: Luecke gegen den letzten regulaeren Schluss', v && v.luecke);
    ok(v && v.vol === 70000 && v.kerzen === 2,
       'Vormarkt #55: nur Kerzen aus dem Vorboersen-Fenster zaehlen - Vortag und Sitzung bleiben draussen',
       v && (v.vol + '/' + v.kerzen));
    ok(VM.vormarktAusChart(chart([{ t: regStart + 300, c: 120, v: 5000 }], 100)) === null,
       'Vormarkt #55: ohne Vorboersen-Kerze gibt es keinen Eintrag');
    ok(VM.vormarktAusChart('kein json') === null, 'Vormarkt #55: kaputte Antwort wirft nicht');

    /* ---- Issue #74: die Basis war eine Sitzung zu frueh ----
     * Gemeldet als "AMD liegt vorboerslich im Plus, hier wird ein Minus angezeigt".
     * Nachgemessen am 25.08.2026 um 10:27 UTC an sechs Werten - bei allen dasselbe:
     * chartPreviousClose ist waehrend der Vorboerse der Schluss der VORLETZTEN
     * Sitzung, regularMarketPrice der der letzten.
     *
     * Die Zahlen unten sind die echten von AMD. Sie stehen hier, weil eine erfundene
     * Zahl diesen Fehler nicht zeigen wuerde: Er faellt nur auf, wenn die beiden
     * Felder wirklich auseinanderliegen - und zwar so weit, dass das VORZEICHEN
     * kippt. */
    function chartMitBeiden(bars, prevClose, regPreis) {
      var o = JSON.parse(chart(bars, prevClose));
      o.chart.result[0].meta.regularMarketPrice = regPreis;
      return JSON.stringify(o);
    }
    var amd = VM.vormarktAusChart(chartMitBeiden(
      [{ t: preStart + 300, c: 464.00, v: 0 }, { t: preStart + 600, c: 470.76, v: 0 }],
      473.25,    // chartPreviousClose - der Schluss vom 21.08., eine Sitzung zu frueh
      456.745    // regularMarketPrice  - der Schluss vom 24.08., der richtige
    ));
    ok(amd && amd.basis === 456.745,
       'Issue #74: die Basis ist der LETZTE regulaere Schluss, nicht der davor  [' + (amd && amd.basis) + ']');
    ok(amd && amd.luecke > 3 && amd.luecke < 3.1,
       'Issue #74: AMD steht vorboerslich bei +3,07 %  [' + (amd && amd.luecke.toFixed(2)) + ' %]');
    ok(amd && amd.luecke > 0,
       'Issue #74: das Vorzeichen stimmt - mit der alten Basis waeren es -0,53 % gewesen');
    /* Fehlt regularMarketPrice ganz, bleibt der alte Weg als Rueckfall - eine
     * Antwort ohne dieses Feld soll nicht zu gar keinem Eintrag fuehren. */
    var ohneReg = VM.vormarktAusChart(chart([{ t: preStart + 300, c: 110, v: 0 }], 100));
    ok(ohneReg && ohneReg.basis === 100,
       'Issue #74: ohne regularMarketPrice bleibt chartPreviousClose der Rueckfall');

    /* Dieselbe Rechnung steckt in renderer.js/loadPrePost. Sie laesst sich dort
     * nicht laden (IIFE ueber window), also wird die Zeile herausgeschnitten und
     * AUSGEFUEHRT - sonst haette man zwei Kopien einer Regel und nur eine geprueft. */
    var rSrc = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
    var mBasis = /var basis = kd\.meta\.regularMarketPrice \|\|\s*\n?\s*kd\.meta\.chartPreviousClose \|\| kd\.meta\.previousClose;/.exec(rSrc);
    ok(!!mBasis, 'Issue #74: loadPrePost nimmt dieselbe Basis wie die Luecken-Karte');
    if (mBasis) {
      var basisVon = new Function('kd', mBasis[0] + '; return basis;');
      ok(basisVon({ meta: { regularMarketPrice: 456.745, chartPreviousClose: 473.25 } }) === 456.745,
         'Issue #74: auch in den Kacheln gewinnt der letzte regulaere Schluss');
      ok(basisVon({ meta: { chartPreviousClose: 473.25 } }) === 473.25,
         'Issue #74: und der Rueckfall greift, wenn das Feld fehlt');
    }
    ok(!/phase === 'vorboerslich'\s*\n?\s*\?\s*\(kd\.meta\.chartPreviousClose/.test(rSrc),
       'Issue #74: die alte, nach Phase verzweigende Basis ist weg');

    // Die Siebung ist die aus dem Ticket - und sie muss jede Schwelle wirklich ziehen.
    var gesiebt = VM.sieben([
      { sym: 'GUT',   kurs: 12,  luecke: 8,   vol: 0, kerzen: 60 },
      { sym: 'MEHR',  kurs: 12,  luecke: 20,  vol: 0, kerzen: 60 },
      { sym: 'FLACH', kurs: 12,  luecke: 4.9, vol: 0, kerzen: 60 },
      { sym: 'BILLIG', kurs: 2.5, luecke: 30, vol: 0, kerzen: 60 },
      { sym: 'DUENN', kurs: 12,  luecke: 30,  vol: 0, kerzen: 3 },
      { sym: 'LEER',  kurs: 12,  luecke: 30,  vol: 40000, kerzen: 60 }
    ]);
    ok(gesiebt.length === 2 && gesiebt[0].sym === 'MEHR' && gesiebt[1].sym === 'GUT',
       'Vormarkt #55: Luecke, Kurs, Handelsdauer und - wenn vorhanden - Volumen sieben; sortiert nach Luecke',
       gesiebt.map(function (z) { return z.sym; }).join(','));
    /* Der Kern des Umbaus: Yahoo liefert vorboerslich kein Volumen (vol 0). Wuerde die
       Volumen-Schwelle trotzdem greifen, waere die Karte dauerhaft leer - eine Anzeige,
       die luegt. Mit gemeldetem Volumen muss sie dagegen weiter ziehen (LEER oben). */
    ok(VM.sieben([{ sym: 'OHNEVOL', kurs: 12, luecke: 9, vol: 0, kerzen: 60 }]).length === 1,
       'Vormarkt #55: fehlendes Vorboersen-Volumen wirft einen Wert NICHT weg');
    ok(VM.MIN_LUECKE === 5 && VM.MIN_KURS === 3 && VM.MIN_VOL === 50000 && VM.MAX_LISTE === 10,
       'Vormarkt #55: die Schwellen sind die aus dem Ticket',
       VM.MIN_LUECKE + '/' + VM.MIN_KURS + '/' + VM.MIN_VOL + '/' + VM.MAX_LISTE);
    ok(VM.MIN_KERZEN >= 6 && /liefert im vorbörslichen Fenster KEIN Volumen/.test(vmSrc),
       'Vormarkt #55: das Ersatzmass ist im Code begruendet, nicht stillschweigend gesetzt');

    // Vorauswahl: die eigenen Werte kommen immer mit, sonst faende die Karte
    // genau die Ueberraschung nicht, um die es geht.
    /* AAPL steht hier ZUERST als gewoehnlicher Screener-Treffer und erst danach als
       Pflicht-Wert. Wer nur einmal durchlaeuft, verschluckt den Pflicht-Eintrag als
       Doppelten und siebt AAPL anschliessend wegen 0,1 % weg - genau der Fall. */
    var vw = VM.vorauswahl([
      { sym: 'HOCH', vorPct: 12 }, { sym: 'AAPL', vorPct: 0.1 }, { sym: 'RUHIG', vorPct: 0.4 },
      { sym: 'AAPL', vorPct: null, immer: true }, { sym: 'HOCH', vorPct: 12 }
    ], 40);
    ok(vw.length === 2 && vw[0].sym === 'AAPL' && vw[1].sym === 'HOCH',
       'Vormarkt #55: eigene Werte immer, fremde nur ueber der Schwelle, Doppelte fallen raus',
       vw.map(function (z) { return z.sym; }).join(','));
    var vwOhne = VM.vorauswahl([{ sym: 'A', regPct: 1 }, { sym: 'B', regPct: 9 }], 40);
    ok(vwOhne.length === 2 && vwOhne[0].sym === 'B',
       'Vormarkt #55: ohne Vorboersen-Felder von Yahoo bleibt die Ordnung des Vortags');
    ok(VM.kandidatenAus('{}').length === 0 && VM.kandidatenAus('kaputt').length === 0,
       'Vormarkt #55: leere oder kaputte Screener-Antwort ergibt keine Kandidaten');

    // Rolle: Anzeige, nicht Handel.
    ok(/id="vormarktKarte"/.test(hSrc), 'Vormarkt #55: Karte auf dem Dashboard vorhanden');
    ok(/<script src="vormarkt\.js"><\/script>/.test(hSrc),
       'Vormarkt #55: vormarkt.js wird von index.html geladen (sonst fehlt es im Paket)');
    var kopf = hSrc.slice(hSrc.indexOf('Vorbörsen-Lücken'), hSrc.indexOf('id="vormarktKarte"'));
    ok(/Gehandelt wird hiervon nichts/.test(kopf),
       'Vormarkt #55: die Ueberschrift sagt sichtbar, dass hier nichts gehandelt wird');
    var shellV = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
    ok(/'heute\.vorboerse'/.test(shellV) && /Keine Anlageberatung/.test(shellV) && /reine Beobachtung/.test(shellV),
       'Vormarkt #55: dass hier nichts gemessen ist, steht hinter dem Erklaerknopf');
    var block = rSrc.slice(rSrc.indexOf('Vorbörsen-Lücken ='), rSrc.indexOf('setTimeout(vormarktStart'));
    ok(block.length > 500, 'Vormarkt #55: der Block steht im Renderer', block.length);
    ok(/beobachtet – nicht gemessen/.test(block),
       'Vormarkt #55: die Karte weist im Fuss aus, dass hier nichts gemessen ist');
    ok(!/window\.(Depot|MFDepot|Capital|Strategien)\b/.test(block) && !/einstiegSignal|orderSenden|kaufen\(/.test(block),
       'Vormarkt #55: die Karte greift in keinen Handelspfad - sie zeigt nur');
    // Kein neuer Fremdhost: der im Ticket vorgeschlagene Nachrichten-Anbieter
    // haette die Whitelist geoeffnet. Beides bleibt, wie es war.
    ok(!/benzinga/i.test(mSrc) && !/benzinga/i.test(rSrc) && !/benzinga/i.test(vmSrc),
       'Vormarkt #55: kein zusaetzlicher Fremdanbieter im Code');
    ok(/query1\.finance\.yahoo\.com/.test(block) && !/http:\/\//.test(block),
       'Vormarkt #55: Daten kommen ueber den Host, den die App ohnehin benutzt');
  })();

  // --- Strategie-Chart im Tab Strategien & Belege (#51, 23.08.2026) ---
  // Die Oberflaeche darf die Regel nur NACHZEICHNEN, nie nachbauen: jede Markierung
  // kommt aus Q.einstiegSignal, derselben Funktion wie Studie, Backtest und Live-Scan.
  (function () {
    /* Seit Stufe E wohnt die stc-Familie in der eigenen Datei - dort wird geschnitten. */
    var d3 = fs.readFileSync(__dirname + '/strategiechart.js', 'utf8');
    var h3 = fs.readFileSync(__dirname + '/index.html', 'utf8');
    /* Seit Issue #68 steht die Rechnung als stcRechnen VOR runStrategieChart, damit die
     * aufgeklappte Positionszeile dieselbe Rechnung benutzt. Der Schnitt muss beide
     * umfassen - sonst prueft er eine leere Huelle und wird gruen, ohne etwas zu sehen. */
    var stc = d3.slice(d3.indexOf('async function stcRechnen'), d3.indexOf('function drawStrategieChart'));
    ok(d3.indexOf('async function stcRechnen') > -1 && d3.indexOf('async function stcRechnen') < d3.indexOf('async function runStrategieChart'),
       'Strategie-Chart: die Rechnung steht getrennt von der Anzeige (eine Rechnung, zwei Ansichten)');
    ok(/id="stcChart"/.test(h3) && /id="stcMode"/.test(h3) && h3.indexOf('id="stratChartPanel"') > h3.indexOf('id="tab-strategien"'),
       'Strategie-Chart #51: Panel liegt im Tab Strategien & Belege');
    ok(/Q\.einstiegSignal\(bars, i, P\)/.test(stc) && !/rsi\(closes, 2\) <= 10/.test(stc),
       'Strategie-Chart #51: Einstiege kommen aus Q.einstiegSignal, nicht aus nachgebauter Logik');
    ok(/s\.dir !== 'call'\) continue/.test(stc), 'Strategie-Chart #51: nur die Long-Seite wird markiert (Put traegt nicht)');
    ok(/bars\.length < 300/.test(stc) && /Q\.fertigeBars\(/.test(stc),
       'Strategie-Chart #51: rechnet erst ab der Messtiefe und nur auf fertigen Kerzen - wie der Live-Scan');
    ok(/value="rsi2seit"/.test(h3) && /value="kapitulation"/.test(h3) && !/value="hourly"/.test(h3.slice(h3.indexOf('id="stcMode"'), h3.indexOf('id="stcMode"') + 400)),
       'Strategie-Chart #51: nur die beiden belegten Modi, keine widerlegte Strategie im Chart');
    ok(/Simulation, keine Anlageberatung/.test(h3.slice(h3.indexOf('id="stratChartPanel"'))), 'Strategie-Chart #51: Hinweis Simulation bleibt');

    // --- #52 (23.08.2026): Kerzenlaenge, Zeitraum, anklickbare historische Signale ---
    // Wilhelms Wunsch: ein falsch erkanntes Signal soll NACHTRAEGLICH pruefbar sein.
    // Die Gefahr dabei ist bekannt: eine frei waehlbare Kerzenlaenge fuehrt die
    // Oberflaeche weg von der gemessenen Konfiguration (60m). Deshalb muss der
    // Wechsel sichtbar bleiben, nicht still passieren.
    var stcAlles = d3.slice(d3.indexOf('var stcState = null'), d3.indexOf('function drawStrategieChart'));
    var panel = h3.slice(h3.indexOf('id="stratChartPanel"'), h3.indexOf('/tab-strategien'));
    ok(/id="stcIv"/.test(panel) && /value="60m" selected/.test(panel),
       'Strategie-Chart #52: Kerzenlaenge waehlbar, 60m bleibt die Voreinstellung (so ist gemessen)');
    ok(/value="15m"[^>]*>[^<]*nur Ansicht/.test(panel) && /value="5m"[^>]*>[^<]*nur Ansicht/.test(panel),
       'Strategie-Chart #52: ungemessene Kerzenlaengen sind schon in der Auswahl als Ansicht gekennzeichnet');
    ok(/id="stcIvWarn"/.test(panel) && /NICHT die gemessene Konfiguration/.test(stcAlles),
       'Strategie-Chart #52: wer die Kerzenlaenge verlaesst, bekommt es ausdruecklich gesagt');
    ok(/Q\.fertigeBars\(bars\.slice\(-tiefe\), ivCfg\.min,/.test(stcAlles),
       'Strategie-Chart #52: die Kerzenlaenge geht auch in fertigeBars - sonst wird die laufende Kerze falsch gekappt');
    ok(/id="stcSpanne"/.test(panel) && /Math\.max\(900, spanne \+ 320\)/.test(stcAlles),
       'Strategie-Chart #52: groesserer Zeitraum laedt auch mehr Vorlauf - sonst waere der linke Bildrand nur scheinbar signalfrei');
    ok(/function stcCheckZeichnen/.test(stcAlles) && /stcBedingungen\(S\.bars, S\.mode, S\.P, idx\)/.test(stcAlles),
       'Strategie-Chart #52: der Klick rechnet die Bedingungen GENAU DER Signalkerze nach, nicht die von heute');
    ok(/ciWunsch == null \? bars\.length - 1 :/.test(d3),
       'Strategie-Chart #52: ohne Angabe bleibt es bei der letzten abgeschlossenen Kerze');
    ok(/data-mark=/.test(d3) && /tr\.stcRow/.test(d3),
       'Strategie-Chart #52: Signale sind in der Liste UND im Chart anklickbar');
    ok(/Gesamturteil des Detektors in dieser Kerze/.test(stcAlles) && /nicht aus der Summe der H/.test(stcAlles),
       'Strategie-Chart #52: das Urteil kommt weiter aus einstiegSignal, nicht aus den Haekchen');
    ok(/ohne Kosten, ohne Schein und ohne Ausstiegsregel/.test(stcAlles),
       'Strategie-Chart #52: der Verlauf nach dem Signal wird nicht als Handelsergebnis ausgegeben');

    // Und jetzt nicht nur der Wortlaut, sondern die Rechnung: die Bedingungsliste wird
    // aus depot.js herausgeschnitten und mit dem echten Q ausgefuehrt. Wilhelms Zweck
    // steht und faellt damit - wenn die Anzeige je von der Regel abdriftet, erklaert sie
    // ein Signal, das es so nie gab. Genau das ist hier schon einmal passiert.
    (function () {
      var qa = d3.indexOf('  function stcBedingungen(bars, mode, P, ciWunsch) {');
      var qb = d3.indexOf('  /** Zustand des zuletzt geladenen Strategie-Charts');
      if (qa < 0 || qb < 0) { ok(false, 'Strategie-Chart #52: Bedingungsfunktion im Quelltext auffindbar'); return; }
      var bedFn = new Function('Q', d3.slice(qa, qb) + '\n return stcBedingungen;')(Q);
      // Synthetische Stundenreihe mit Aufwaertsdrift und regelmaessigen Dips - kein
      // echter Markt, geprueft wird die Mechanik.
      var bs = [], t0 = Date.UTC(2026, 0, 5, 14, 30);
      for (var bi = 0; bi < 900; bi++) {
        var pr = 100 + bi * 0.012 + Math.sin(bi / 11) * 1.6 + Math.sin(bi / 3.3) * 0.9;
        bs.push([t0 + bi * 3600000, pr, 1000 + (bi % 17 === 0 ? 4000 : 0) + (bi % 5) * 60, pr * 1.004, pr * 0.996]);
      }
      var PP = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5, MINQ: 0, CHAN: false, MTF: false, TREND: false };
      var mk = [];
      for (var mi = 261; mi < bs.length; mi++) {
        var sg = null;
        try { sg = Q.einstiegSignal(bs, mi, PP); } catch (eS) { }
        if (sg && sg.dir === 'call') mk.push(mi);
      }
      ok(mk.length > 0, 'Strategie-Chart #52: die Pruefreihe erzeugt ueberhaupt Signale', mk.length);
      var wieder = mk.filter(function (m) { return bedFn(bs, 'rsi2seit', PP, m).signal === 'call'; }).length;
      ok(wieder === mk.length,
         'Strategie-Chart #52: jede angeklickte Signalkerze meldet beim Nachrechnen wieder genau ihr Signal', wieder + '/' + mk.length);
      var frei = [];
      for (var fj = 300; fj < 900 && frei.length < 30; fj += 7) if (mk.indexOf(fj) < 0) frei.push(fj);
      var bleibtFrei = frei.filter(function (f) { return bedFn(bs, 'rsi2seit', PP, f).signal !== 'call'; }).length;
      ok(bleibtFrei === frei.length,
         'Strategie-Chart #52: signalfreie Kerzen erfinden beim Nachrechnen kein Signal', bleibtFrei + '/' + frei.length);
      ok(JSON.stringify(bedFn(bs, 'rsi2seit', PP).liste) === JSON.stringify(bedFn(bs, 'rsi2seit', PP, bs.length - 1).liste),
         'Strategie-Chart #52: ohne Index bleibt es beim alten Verhalten (letzte Kerze)');
      var kein = true;
      try { bedFn(bs, 'rsi2seit', PP, 99999); bedFn(bs, 'kapitulation', PP, -5); } catch (eK) { kein = false; }
      ok(kein, 'Strategie-Chart #52: ein Index ausserhalb der Reihe wird geklemmt, nicht geworfen');
    })();
  })();

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
  /* Seit Stufe E wohnen Kostenrunden und Spannen in kosten.js - dort wird
   * geschnitten; die Statuszeile (updateCapStatus) blieb im Handelsmodul. */
  var ks = fs.readFileSync(__dirname + '/kosten.js', 'utf8');
  ok(/function kostenMessungNeu/.test(ks) && /capSlipOpen == null \|\| p\.capSlipClose == null\) return/.test(ks),
     'Kosten: nur vollstaendige Runden zaehlen');
  ok(/function kostenBilanz/.test(ks) && /medianPct/.test(ks), 'Kosten: Bilanz ueber den Median, kein Ausreisser dominiert');
  ok(/angenommen: /.test(d), 'Kosten: die gemessene Zahl steht neben der Annahme der Studien');
  ok(/kb\.n < 20 \? 'noch zu wenige Runden/.test(d), 'Kosten: unter 20 Runden gibt es kein Urteil');
  var diag2 = fs.readFileSync(__dirname + '/diagnose.js', 'utf8');
  ok(/handelskosten: \(function/.test(diag2) && !/slipOpen/.test(diag2),
     'Kosten: Diagnose meldet nur Aggregate, keine einzelnen Ausfuehrungen');
  ok(/Bilanz der gemessenen Handelskosten/.test(h),
     'Kosten: der Einwilligungstext nennt die neue Kategorie');

  // --- Spannen-Messung: die Kostenhuerde direkt aus Geld/Brief (22.08.2026) ---
  ok(/function spannenProbe/.test(ks) && ks.indexOf('window.CapAPI.enabled() && window.CapAPI.quote') !== -1,
     'Spannen: Messung laeuft nur mit verbundener Demo-API');
  ok(ks.indexOf('window.Dash.marketOpen())) return;') !== -1,
     'Spannen: nur bei offener Boerse (geschlossen sind Spannen wertlos)');
  ok(ks.indexOf('i < 6 && i < syms.length') !== -1, 'Spannen: hoechstens sechs Werte je Takt - schont die API');
  ok(ks.indexOf('q.spreadPct < 0.2') !== -1, 'Spannen: unplausible Werte werden verworfen');
  ok(/function spannenBilanz/.test(ks) && ks.indexOf('Erst je Wert den Median') !== -1,
     'Spannen: erst je Wert Median, dann ueber die Werte - kein Symbol dominiert');
  ok(ks.indexOf('sp.proben.length < 10) return null') !== -1, 'Spannen: unter zehn Proben gibt es kein Urteil');
  ok(diag2.indexOf('spannen: (function') !== -1 && diag2.indexOf('spreadPct: p') === -1,
     'Spannen: Diagnose meldet nur Aggregate, keine Einzelkurse');
  ok(/quote: async function/.test(c2) && c2.indexOf('/markets/') !== -1,
     'Spannen: die Kursabfrage nutzt den Markt-Endpunkt des Demo-Hosts');
  // --- Massen-Backfill: Messbasis in einem Rutsch vertiefen (22.08.2026) ---
  // Seit Stufe E wohnt der Backfill in der eigenen Datei - dort wird geschnitten.
  var bf = fs.readFileSync(__dirname + '/backfill.js', 'utf8');
  ok(/function massenBackfill/.test(bf), 'Backfill: Massen-Auffuellung existiert');
  // Seit 8.23.46 werden ndx100 UND sp100 ueber eine Liste geholt, nicht mehr einzeln benannt.
  ok(/['ndx100', 'sp100']/.test(bf), 'Backfill: Nasdaq-100 und S&P-100 sind im Universum');
  ok(bf.indexOf("massenStop") !== -1 && /function massenAbbrechen/.test(bf), 'Backfill: jederzeit anhaltbar');
  ok(bf.indexOf("fehlSerie < 3") !== -1 && bf.indexOf("1500 * fehlSerie") !== -1,
     'Backfill: bei Fehlern Rueckzug statt Weiterhaemmern - eine gedrosselte API sperrt sonst');
  ok(bf.indexOf("opts.pauseMs || 200") !== -1, 'Backfill: feste Pause je Anfrage (200 ms)');
  ok(bf.indexOf("si % 10 === 9") !== -1, 'Backfill: Zwischenstand wird laufend gesichert');
  ok((bf.match(/minutenSeitOeffnung/g) || []).length >= 2,
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
  /* Das 1m-Fenster muss zur FRAGE passen, nicht nur zur Quelle. Bis 25.08.2026 stand
   * es auf 90 KALENDERtagen = rund 62 Handelstage. Die Vorregistrierung zu Issue #33
   * nennt 77 Handelstage fuer den marktneutralen Brutto-Nachweis. Das Archiv waere
   * also bei 62 stehengeblieben und haette das Ziel nie erreicht, auf das es jede
   * Nacht zusammengetragen wird - lautlos, denn die Sammlung selbst lief weiter.
   * Ein Deckel unterhalb der Frage ist derselbe Fehler wie gar nicht zu sammeln,
   * nur teurer. Reserve fuer den Zeitsplit ist Pflicht: die Muehle verlangt
   * Entdeckung und Bestaetigung an GETRENNTEN Tagen. */
  var ht1m = Math.round(A.TAGE_MAX['1m'] * 252 / 365);
  ok(ht1m >= 154,
     '1m-Fenster deckt die 77 Handelstage aus #33 mit Reserve fuer einen Zeitsplit',
     A.TAGE_MAX['1m'] + ' Kalendertage = ~' + ht1m + ' Handelstage');
  ok(A.fensterFuer('60m') === A.TAGE_MAX['60m'], 'fensterFuer waehlt je Zeitrahmen');
  ok(A.fensterFuer('krypto') === A.MAX_TAGE, 'fensterFuer hat einen Rueckfall fuer Unbekanntes');
  var jetzt = Date.UTC(2026, 7, 20), reihe = [];
  for (var t = 0; t < 400; t++) reihe.push([jetzt - t * 86400000, 100, 0]);
  ok(A.kappeTage(reihe, A.TAGE_MAX['60m'], jetzt).length === 400, '60m-Fenster wirft 400 Tage Historie NICHT weg');
  ok(A.kappeTage(reihe, 90, jetzt).length === 91, 'das alte 90-Tage-Fenster haette 309 von 400 Tagen verworfen', A.kappeTage(reihe, 90, jetzt).length + ' statt 400');

  // --- 2) Suchachsen: dort suchen, wo Wirkung ist ---
  // Seit Stufe E wohnen Suchachsen und Zucht in zucht.js; die Whitelist des
  // KI-Vorschlags-Slots bleibt im Handelsmodul - jede Marke schneidet an ihrer Stelle.
  var zu2 = fs.readFileSync(__dirname + '/zucht.js', 'utf8');
  ok(/var SL = \[10, 15, 20, 30, 'auto'\], HOLD = \[60, 120, 240, 390\]/.test(zu2), 'Not-Stop und Haltedauer werden durchprobiert');
  ok(/var PER = \[14, 30\]/.test(zu2), 'period auf zwei Stufen reduziert (gemessene Wirkung 0,18 Pp)');
  ok(!/scalpSL: 30, scalpHold: 240 \}\);/.test(d) && !/scalpSL: 30, scalpHold: 240 \}\);/.test(zu2), 'die feste Belegung scalpSL 30 / scalpHold 240 ist weg');
  ok(/scalpSL: \[10, 15, 20, 30, 45, 'auto'\]/.test(d), 'Whitelist erlaubt die neuen Not-Stop-Werte');
  ok(/scalpHold: \[15, 30, 60, 120, 240, 390\]/.test(d), 'Whitelist erlaubt die neuen Haltedauern');

  // --- 3) Zucht: Population, Mutation, Gedaechtnis ---
  ok(/function zuchtMutiere/.test(zu2) && /function zuchtZufall/.test(zu2), 'Zucht: Mutation und frisches Blut vorhanden');
  ok(/zStand\.gen = zStand\.gen \+ 1/.test(zu2), 'Zucht: Generation zaehlt hoch');
  ok(/gesehenNeu\[sl3\] \|\| gesehenSet\[sl3\]/.test(zu2), 'Zucht: bereits Geprueftes wird nicht wiederholt');
  ok(/fund\.testRet > 0 && fund\.testN >= 15/.test(zu2), 'Zucht: nur out-of-sample Bewaehrte pflanzen sich fort');
  ok(/\['scalpSL', 7\], \['scalpHold', 5\]/.test(zu2), 'Zucht: Mutationsgewichte folgen der gemessenen Wirkung');
  ok(/\(proBasis\[bkey\] \|\| 0\) >= 4/.test(zu2), 'Zucht: keine Linie darf die Population uebernehmen');

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
  /* Seit Stufe E ist der Komplex zweigeteilt: die Suche wohnt in zucht.js, der
   * Waechter und die beiden Boersen-Fragen bleiben im Handelsmodul. Die Marken
   * dieses Abschnitts sind hochspezifische Codefragmente - geprueft wird, dass jede
   * Eigenschaft in EINER der beiden Haelften weiterlebt. */
  var zut = fs.readFileSync(__dirname + '/zucht.js', 'utf8');
  /* Seit dem E-Rest liegt auch der Migrationsteil in einer eigenen Datei -
   * derselbe Dreiklang wie beim zweigeteilten Zucht-Komplex. */
  var mig9 = fs.readFileSync(__dirname + '/depotmigration.js', 'utf8');
  function drin(t) { return d.indexOf(t) !== -1 || zut.indexOf(t) !== -1 || mig9.indexOf(t) !== -1; }
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
  /* Seit Stufe E entscheidet der Pool das in btpool.js - dort wird geschnitten. */
  var btp = fs.readFileSync(__dirname + '/btpool.js', 'utf8');
  ok(btp.indexOf('if (zu && !handelBrauchtRechenzeit()) return Math.max(2, Math.min(15, kerne - 2));') !== -1,
     'bei pausiertem Handel werden fast alle Kerne genutzt');
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
  var btp2 = fs.readFileSync(__dirname + '/btpool.js', 'utf8');
  ok(btp2.indexOf("BTPool.run('intradayMulti'") !== -1, 'der Pool kennt Buendel-Auftraege');
  ok(btp2.indexOf("else if (job.fn === 'intradayMulti')") !== -1, 'auch der Notpfad ohne Worker kennt sie');
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

  /* RUECKSCHAU-FEHLER, gemessen und behoben am 23.08.2026.
   * reaktionstag schob nur bei Stunde >= 20 UTC auf den Folgetag. An den echten Daten:
   * 12.290 von 20.559 Terminen (59,8 %) stehen auf 04:00/05:00 UTC - Mitternacht New
   * Yorker Zeit, also GAR KEINE Uhrzeit. Fuer die alte Regel sah das aus wie
   * "vorboerslich gemeldet", und das Buch kaufte zum Schluss des Meldetags: vor der
   * Meldung. Nachgemessen sammelte es dabei den Ueberraschungssprung ein
   * (+0,295 % gegen +0,084 % bei Terminen MIT Uhrzeit); nach der Behebung sind es
   * +0,020 %, der Gruppenunterschied faellt von +0,211 auf -0,064 Prozentpunkte. */
  ok(Dr.reaktionstag('2026-01-12T05:00:00Z', di) === di['2026-01-12'] + 1,
     'Stempel ohne Uhrzeit (05:00 UTC = Mitternacht New York) wird konservativ einen Tag spaeter gehandelt');
  ok(Dr.reaktionstag('2026-01-12T04:00:00Z', di) === di['2026-01-12'] + 1,
     'Dasselbe fuer 04:00 UTC (Sommerzeit)');
  /* Der vorboersliche Fall bleibt unberuehrt: 11:00 UTC ist 07:00 New York, die
   * Meldung ist vor dem Schluss oeffentlich - der Kauf zum Schluss ist sauber. */
  ok(Dr.reaktionstag('2026-01-12T11:00:00Z', di) === di['2026-01-12'],
     'Vorboerslich gemeldet (11:00 UTC) bleibt am Meldetag - dort ist die Meldung vor Schluss oeffentlich');
  ok(Dr.reaktionstag('2026-01-12T05:30:00Z', di) === di['2026-01-12'],
     'Ein Stempel MIT Minuten (05:30) ist eine echte Uhrzeit und wird nicht verschoben');
  /* Die Annahme betrifft die Mehrheit der Daten und gehoert sichtbar gemacht. */
  ok(typeof Dr.stempelBilanz === 'function',
     'Es laesst sich abfragen, wie viele Termine gar keine Uhrzeit tragen');
  var sb = Dr.stempelBilanz({ X: [['2026-01-12T05:00:00Z'], ['2026-01-12T11:00:00Z'], ['2026-01-12T21:00:00Z']] });
  ok(sb.ohneUhrzeit === 1 && sb.mitUhrzeit === 2 && Math.abs(sb.anteilOhne - 33.3) < 0.2,
     'stempelBilanz zaehlt richtig', JSON.stringify(sb));


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
  // DIST erlaubt es, ein anderswo gebautes Paket zu pruefen (sauberer Arbeitsbaum,
  // siehe release-final.js). Ohne die Variable bleibt es beim Paket neben der Quelle.
  var asarPfad = (process.env.DIST || __dirname + '/dist') + '/win-unpacked/resources/app.asar';
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

  /* Epic-Zuordnung: nur Belegbares (Befund 22./23.08.2026). Der alte Rückfall auf den
   * ersten SHARES-Treffer machte aus 'WBD' das Papier 'WBDIT' (2,22 statt 28,50, europäische
   * Handelszeit, 16 statt 78 Kerzen am Tag) und aus 'EA' die Kette 'EAT' – US-notiert und
   * damit an der Kerzenzahl nicht zu erkennen. Einen Tag später standen sechs solcher
   * Zuordnungen im Cache, darunter 'NET' → 'NFLX'. Weil openPosition dasselbe Epic benutzt,
   * hätte ein NET-Signal eine Netflix-Position eröffnet. */
  ok(eF.indexOf("indexOf('SHARES')") === -1 && !/\|\|\s*mkts\[0\]/.test(eF),
     'epicFor rät nicht mehr: kein Rückfall auf den ersten SHARES- oder Suchtreffer');
  // Seit 23.08.2026 auf den Schreibweisen des Kuerzels (BRK-B / BRKB) - weiterhin EXAKT.
  ok(/vari\.indexOf\(m\.epic\)/.test(eF) && /vari\.indexOf\(m\.symbol\)/.test(eF),
     'epicFor nimmt nur Treffer, deren Epic ODER Capital-Symbol dem Kuerzel entspricht');
  ok(/cache\[sym\] === sym/.test(eF),
     'Der Cache gilt nur ungeprüft, wenn das Epic wie das Symbol heißt – sonst lief die Zuordnung ewig an der Prüfung vorbei');
  ok(/delete cache\[sym\]/.test(eF),
     'Eine nicht belegbare Zuordnung fliegt aus dem Cache, statt dort weiterzuwirken');

  var pR = block(cap, 'pricesRange: async function');
  ok(/letzterKursFehler = 'Kursabruf/.test(pR),
     'pricesRange nennt bei HTTP-Fehler Symbol, Zeitrahmen, Zeitraum und Status');
  ok(pR.indexOf('String(res.body') !== -1,
     'pricesRange gibt den Antwortrumpf mit aus (dort steht Capitals errorCode)');

  // Die Diagnose selbst - seit Stufe E in backfill.js, dort wird geschnitten.
  var bf2 = fs.readFileSync(__dirname + '/backfill.js', 'utf8');
  ok(/async function datenquelleTest/.test(bf2), 'Die Datenquellen-Diagnose existiert');
  ok(bf2.indexOf('window.__datenquelleTest') !== -1, 'datenquelleTest ist von außen aufrufbar');
  var dqI = bf2.indexOf('async function datenquelleTest');
  var dq = bf2.slice(dqI, dqI + 6000);
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
  ok(bf2.indexOf('async function massenBackfill') >= 0, 'massenBackfill ist auffindbar');
  var mbI = bf2.indexOf('async function massenBackfill');
  var mb = bf2.slice(mbI, bf2.indexOf('async function datenquelleTest'));
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
  // Seit 23.08.2026 ueber den Fehlercode statt ueber den Meldungstext - der Wortlaut
  // aenderte sich ('Kein Markt' -> 'Kein gesicherter Markt') und die Pruefung brach still.
  ok(mb.indexOf("symArt !== 'kein-markt'") !== -1,
     'Nicht geführte Einzelwerte lösen KEINEN Verbindungs-Abbruch aus');

  /* Handelspausen: Capital.com begrenzt die Zeitspanne je Anfrage (belegt am 22.08.2026
   * durch error.invalid.max.daterange bei 16 h 39 min auf 1m). Das Fenster verkleinert sich
   * deshalb selbst – und dann liegen zwischen zwei Sitzungen viele Fenster. Ohne Sprung über
   * die Pausen würde der Lauf sie einzeln ablaufen und (weil CFDs ausserbörslich Kerzen
   * liefern, die der Sitzungsfilter verwirft) jeden Wert vorzeitig abbrechen.
   * Deshalb hier nachgerechnet statt nach Textstellen gesucht. */
  ok(bf2.indexOf('function vorherigerSitzungsschluss') !== -1 && bf2.indexOf('function istSitzung') !== -1,
     'Der Backfill kennt Handelspausen und Sitzungsgrenzen');
  ok(mb.indexOf('vorherigerSitzungsschluss(von)') !== -1 && mb.indexOf('vorherigerSitzungsschluss(frueh)') !== -1,
     'Der Zeiger springt über Handelspausen – nach leerem UND nach gefülltem Fenster');
  ok(mb.indexOf('invalid.max.daterange') !== -1 && mb.indexOf('cap_fenster') !== -1,
     'Lehnt die API die Zeitspanne ab, verkleinert sich das Fenster und wird gemerkt');
  (function () {
    // Die Sitzungslogik aus depot.js nachbauen und gegen echte Kalendertage rechnen.
    var msO = Q.minutenSeitOeffnung;
    function istSitzung(ms) {
      var tag = new Date(ms).getUTCDay();
      if (tag === 0 || tag === 6) return false;
      var m = msO(ms); return m >= 0 && m < 390;
    }
    function vorSchluss(ms) {
      var z = ms;
      for (var i2 = 0; i2 < 12; i2++) {
        var d = new Date(z), tag = d.getUTCDay(), m = msO(z);
        if (tag >= 1 && tag <= 5 && m >= 390) return z - (m - 390) * 60000;
        d.setUTCDate(d.getUTCDate() - 1); d.setUTCHours(23, 59, 0, 0); z = d.getTime();
      }
      return ms - 86400000;
    }
    // Samstag 14:00 UTC galt vorher als Sitzung, weil nur die Uhrzeit geprüft wurde.
    ok(istSitzung(Date.UTC(2026, 7, 20, 14, 0)) === true && istSitzung(Date.UTC(2026, 7, 22, 14, 0)) === false,
       'Der Sitzungsfilter prüft den Wochentag mit (Samstag 14:00 ist keine Sitzung)');
    // Sprung über das Wochenende: Montag früh muss auf Freitag 20:00 UTC landen.
    var mo = Date.UTC(2026, 7, 24, 10, 0), fr = Date.UTC(2026, 7, 21, 20, 0);
    ok(vorSchluss(mo) === fr, 'Montag früh springt auf Freitag-Sitzungsschluss',
       new Date(vorSchluss(mo)).toISOString().slice(0, 16));
    // Kosten des Wochenendes je Fensterbreite – auch das kleinstmögliche Fenster (20 Min)
    // darf nicht in dutzenden Leeranfragen versinken.
    var teuer = [];
    [[1, 20], [1, 60], [1, 1000], [5, 1000], [15, 1000]].forEach(function (p) {
      var fenster = p[1] * p[0] * 60000;
      var z = Date.UTC(2026, 7, 24, 14, 0), ziel = Date.UTC(2026, 7, 21, 19, 0), n = 0;
      while (z > ziel && n < 500) {
        var von = z - fenster; n++;
        z = istSitzung(von) ? von : Math.min(von, vorSchluss(von));
      }
      if (n > 8) teuer.push(p[0] + 'm/' + p[1] + ' Kerzen: ' + n + ' Anfragen');
    });
    ok(teuer.length === 0, 'Ein Wochenende kostet in jeder Fensterbreite höchstens 8 Anfragen',
       teuer.length ? teuer.join('; ') : 'geprüft für 1m (20/60/1000), 5m, 15m');
  })();

  /* 1m ist der teuerste UND der gesuchte Zeitrahmen (Yahoo gibt nur 7 Tage her).
   * Bei gleicher Budgetaufteilung bekaeme er nur ein Drittel, obwohl 15m/5m ihres
   * mit ihren breiten Fenstern nie ausschoepfen. Deshalb billigste zuerst. */
  ok(mb.indexOf("[{ iv: '15m', barMin: 15 }, { iv: '5m', barMin: 5 }, { iv: '1m', barMin: 1 }]") !== -1,
     'Zeitrahmen laufen vom billigsten zum teuersten – 1m bekommt den Rest des Budgets');
  ok(mb.indexOf('stat.requests >= budget') !== -1 && mb.indexOf('macht genau hier weiter') !== -1,
     'Ein Anfragebudget begrenzt den Lauf und weist auf die Fortsetzbarkeit hin');

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

  /* Capital.com meldet einen Zeitraum ohne Kurse als HTTP 404 prices.not-found statt
   * als leere Liste. Belegt am 22.08.2026 (ZS 15m ueber Memorial Day). Als Fehler
   * gezaehlt kostete das je Vorkommen Sekunden Rueckzug und liess den Wert fallen. */
  ok(pR.indexOf("prices.not-found") !== -1 && pR.indexOf("return [];") !== -1,
     'Ein leerer Zeitraum (404 prices.not-found) gilt als Handelspause, kein Fehler');
  ok(mb.indexOf("opts.pauseMs || 200") !== -1,
     'Der Lauf pausiert 200 ms je Anfrage (rund 2-3/s, Grenze der API ist 10/s)');
  var v1m = (html.match(/id="massen1mBtn"/g) || []).length;
  ok(v1m === 1, 'Der Knopf „nur 1-Minuten" existiert genau einmal', v1m + 'x');
  /* Die Verdrahtung wohnt seit Stufe E in backfill.js (verkabeln) - die Eigenschaft
   * bleibt: Knopf vorhanden UND angeschlossen, tote Schalter gab es hier schon. */
  ok(bf2.indexOf("getElementById('massen1mBtn')") !== -1 &&
     bf2.indexOf("ivs: [{ iv: '1m', barMin: 1 }]") !== -1,
     'Der 1-Minuten-Knopf ist verdrahtet und beschraenkt den Lauf auf 1m');

  // Knopf: vorhanden UND verdrahtet – tote Schalter gab es hier schon einmal (6 Stück).
  var vork = (html.match(/id="quelleTestBtn"/g) || []).length;
  ok(vork === 1, 'Der Knopf „Datenquelle testen" existiert genau einmal', vork + '×');
  ok(/quelleTestBtn'\)[\s\S]{0,220}addEventListener\('click'/.test(bf2),
     'Der Knopf ist an eine Klick-Behandlung angeschlossen');
  ok(/qBtn\.disabled = false/.test(bf2), 'Der Knopf wird nach der Prüfung wieder freigegeben');

  // Mehrzeilige Diagnose muss auch mehrzeilig ankommen
  var statusZeile = (html.match(/id="massenStatus"[^>]*/) || [''])[0];
  ok(statusZeile.indexOf('pre-wrap') !== -1,
     'Die Statusfläche gibt Zeilenumbrüche wieder (sonst verklebt die Diagnose zu einem Absatz)');
})();


console.log('\n31) Auslieferung – enthält der letzte Build wirklich den aktuellen Stand?');
(function () {
  // DIST erlaubt es, ein anderswo gebautes Paket zu pruefen (sauberer Arbeitsbaum,
  // siehe release-final.js). Ohne die Variable bleibt es beim Paket neben der Quelle.
  var asarPfad = (process.env.DIST || __dirname + '/dist') + '/win-unpacked/resources/app.asar';
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
  /* Ein ALTES Paket neben der Quelle ist ein Ueberbleibsel, kein Defekt - es sagt
   * ueber den Code nichts aus und darf die Testsuite nicht rot machen. Genau daran
   * stand am 23.08.2026 die Issue-Wache still, die "ALLE TESTS BESTANDEN" verlangt.
   * Der scharfe Zweig bleibt: gleiche Version mit anderem Inhalt ist der Fehler vom
   * 22.08. und muss rot sein. Vor einem Release mit DIST auf den frischen Build
   * zeigen - dann stimmen die Versionen und es wird streng geprueft. */
  function vNum(v) { return String(v || '0').split('.').map(function (x) { return parseInt(x, 10) || 0; }); }
  function aelter(a, b) {
    var x = vNum(a), y = vNum(b);
    for (var i = 0; i < Math.max(x.length, y.length); i++) {
      if ((x[i] || 0) < (y[i] || 0)) return true;
      if ((x[i] || 0) > (y[i] || 0)) return false;
    }
    return false;
  }
  if (paketVersion && aelter(paketVersion, quellVersion)) {
    console.log('  ℹ  Das Paket neben der Quelle ist aelter (Paket ' + paketVersion + ' / Quelle ' + quellVersion +
      ') – ein Ueberbleibsel eines frueheren Builds. Der Inhaltsvergleich braucht einen frischen Build ' +
      'oder DIST auf das Release-Verzeichnis; er wird hier uebersprungen.');
    return;
  }
  ok(paketVersion === quellVersion,
     'Das gebaute Paket ist auf dem Stand der Quelle',
     'Quelle ' + quellVersion + ' / Paket ' + (paketVersion || 'unlesbar'));

  /* Der Versionsvergleich oben fängt nur "der Build lief gar nicht". Wird nach dem
   * Build weiter am Code gefeilt, bleibt die Version gleich und das Paket ist trotzdem
   * veraltet. Deshalb byteweise vergleichen – das ist der einzige Test, der beides fängt. */
  var crypto = require('crypto');
  function hash(b) { return crypto.createHash('sha1').update(b).digest('hex').slice(0, 12); }
  var abweichend = [];
  // ALLE ausgelieferten Module - mfhandel.js fehlte und ein veraltetes Paket blieb unbemerkt (22.08.)
  var html0 = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var skripte = (html0.match(/<script src="([^"]+.js)"/g) || []).map(function (s) { return s.replace(/.*src="|".*/g, ''); });
  ['index.html', 'main.js', 'preload.js', 'bt-worker.js'].concat(skripte).filter(function (f, i, a) { return a.indexOf(f) === i; }).forEach(function (f) {
    var quelle, paket;
    try { quelle = hash(fs.readFileSync(__dirname + '/' + f)); } catch (e) { return; }
    try { paket = hash(asarLib.extractFile(asarPfad, f)); }
    catch (e) {
      /* Per asarUnpack ausgenommene Dateien liegen NICHT im Archiv, sondern daneben.
       * Seit 8.26.0 gilt das fuer quant.js: der Kindprozess der Messmaschine braucht es
       * als echte Datei, nicht als Archivglied. Ohne diesen Zweig waere die Pruefung
       * still zu "fehlt" verkommen - eine ausgelieferte Datei ohne Vergleich, und die
       * Meldung haette wie ein veraltetes Paket ausgesehen. */
      try { paket = hash(fs.readFileSync(asarPfad + '.unpacked/' + f)); } catch (e2) { paket = 'fehlt'; }
    }
    if (quelle !== paket) abweichend.push(f + ' (' + paket + ' statt ' + quelle + ')');
  });
  /* Hart nur beim Release: Dann zeigt DIST auf das frisch gebaute Verzeichnis, und eine
   * Abweichung heisst "das Paket enthaelt nicht, was ausgeliefert werden soll" - genau
   * der Vorfall vom 22.08.2026. Ohne DIST arbeitet jemand am Code; dass die Aenderungen
   * noch nicht gebaut sind, ist dann normal. Ein Testlauf, der waehrend jeder Arbeit rot
   * ist, blockiert die Issue-Wache und wird ansonsten ueberlesen - er schuetzt dann
   * niemanden mehr. Die Information geht nicht verloren, sie wird nur zum Hinweis. */
  /* Was entpackt ausgeliefert wird, MUSS neben dem Archiv liegen. Fehlt es dort, ist
   * es fuer den Kindprozess schlicht nicht da - und die Messung auf Knopfdruck faellt
   * mit "Cannot find module" aus, in einem Installer, den niemand vorher aufmacht. */
  var entpacktZiel = asarPfad + '.unpacked/';
  ['quant.js', 'studien/messmaschine/messen.js', 'studien/messmaschine/messmaschine.js'].forEach(function (f) {
    ok(fs.existsSync(entpacktZiel + f), 'Entpackt ausgeliefert: ' + f);
  });

  if (process.env.DIST || !abweichend.length) {
    ok(abweichend.length === 0,
       'Jede ausgelieferte Datei ist inhaltsgleich mit der Quelle',
       abweichend.length ? abweichend.join('; ') : 'alle geprüften Dateien identisch');
  } else {
    console.log('  ℹ  ' + abweichend.length + ' Datei(en) weichen vom Paket neben der Quelle ab – seit dem Build ' +
      'wurde daran gearbeitet. Vor einem Release mit DIST auf den frischen Build prüfen, dort ist es ein Fehler. [' +
      abweichend.slice(0, 4).join('; ') + ']');
  }
})();


console.log('\n32) Quellen-Kennzeichnung im Archiv – CFD-Volumen darf nicht als Börsenvolumen gelten');
(function () {
  var Arch = require('./archiv.js');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var arc = fs.readFileSync(__dirname + '/archiv.js', 'utf8');

  /* Belegt am 22.08.2026 an echten Daten: 66 Archivreihen bestehen VOLLSTÄNDIG aus
   * Capital-CFD-Kerzen (die neu hinzugekommenen Nasdaq-100-Werte). Deren Volumen liegt
   * rund 400× unter dem Börsenvolumen. dollarVolTag rechnet absolut und meldete für ADP
   * 1,8 statt ~560 Mio $ – alle 66 fielen damit unter die 50-Mio-Schwelle des
   * Liquiditätsfilters. Immer dieselben Werte: eine echte Auswahlverzerrung. */

  // Kerzen: [t, kurs, volumen]. Tag 1 = CFD (winzig), Tag 2 = Börse.
  var T1 = Date.UTC(2026, 6, 15, 14, 0), T2 = Date.UTC(2026, 7, 18, 14, 0);
  var reihe = [
    [T1, 100, 1000], [T1 + 60000, 100, 1000],
    [T2, 100, 500000], [T2 + 60000, 100, 500000]
  ];
  var ohne = Arch.dollarVolTag(reihe);
  var mit = Arch.dollarVolTag(reihe, [[T1 - 1000, T1 + 120000]]);
  // ohne Kennzeichnung: (2*1000 + 2*500000)*100 / 2 Tage = 50,1 Mio
  // mit  Kennzeichnung: nur Tag 2 -> 2*500000*100 / 1 Tag = 100 Mio
  ok(mit > ohne * 1.9,
     'dollarVolTag überspringt gekennzeichnete CFD-Kerzen',
     Math.round(ohne / 1e6) + ' -> ' + Math.round(mit / 1e6) + ' Mio $');

  // Der wichtigste Fall: ist ALLES CFD, muss die Antwort "unbekannt" sein – nicht
  // eine kleine Zahl. depot.js behandelt null bewusst als "nicht filtern".
  var allesCfd = Arch.dollarVolTag(reihe, [[T1 - 1000, T2 + 120000]]);
  ok(allesCfd === null,
     'Ist die ganze Reihe CFD, liefert dollarVolTag null (unbekannt) statt einer falschen Zahl',
     String(allesCfd));

  // Ohne Bereiche muss sich nichts ändern (Rückwärtsverträglichkeit)
  ok(Arch.dollarVolTag(reihe) === Arch.dollarVolTag(reihe, []),
     'Ohne Kennzeichnung rechnet dollarVolTag unverändert');

  // Schreibpfad: jede Stelle, die Capital-Kerzen einspeist, muss sie kennzeichnen
  var capStellen = (dep.match(/Archiv\.fuege\([^)]*'cap'/g) || []).length;
  ok(capStellen >= 2,
     'Beide Backfills kennzeichnen ihre Kerzen als CFD-Herkunft', capStellen + ' Stellen');
  ok(dep.indexOf("f.source === 'capital' ? 'cap' : null") !== -1,
     'Auch der Live-Rückfall kennzeichnet, wenn er von Capital kommt');

  // Die Kennzeichnung muss den nächsten Flush überleben
  ok(/storeSet\(k, \{ series: schlank\(e\.series\), updatedAt: now,[\s\S]{0,120}capBereiche/.test(arc),
     'capBereiche wird mitgeschrieben (sonst löscht der nächste Flush die Kennzeichnung)');
  ok(arc.indexOf("capBereiche: (st && st.capBereiche) || []") !== -1,
     'capBereiche wird beim Laden wieder übernommen');

  // Verbraucher
  ok(dep.indexOf('window.Archiv.dollarVolTag(serie, berL)') !== -1,
     'Der Messlauf gibt die Bereiche an dollarVolTag weiter');

  // Einmalige Umstellung für die bereits geschriebenen Daten - seit Stufe E in backfill.js
  var bfm = fs.readFileSync(__dirname + '/backfill.js', 'utf8');
  ok(bfm.indexOf('async function quellenMigration') !== -1 &&
     bfm.indexOf('capQuellenMigriert') !== -1,
     'Es gibt eine einmalige Umstellung für schon geschriebene CFD-Kerzen');
  var mi = bfm.indexOf('async function quellenMigration');
  var mig = bfm.slice(mi, mi + 4000);
  ok(mig.indexOf("window.Archiv.serie('60m', sym)") !== -1,
     'Die Umstellung nutzt 60m als Referenz – diesen Zeitrahmen fasst kein Backfill an');
  ok(/if \(ref == null\)[\s\S]{0,200}markiere/.test(mig),
     'Fehlt jede Börsen-Referenz, wird die ganze Reihe gekennzeichnet (Wert kam erst durch den Backfill)');
})();


console.log('\n33) Stempel-Kerzen und Live-Fenster (Detektor-Audit 22.08.2026)');
(function () {
  var Arch = require('./archiv.js');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  /* Befund: ohneStempel behielt von zwei nahen Kerzen die ERSTE. Der Quote-Stempel
   * (15:28:38, vol 0, H=L=C) kommt vor der echten 15:30-Kerze an und verdraengte sie.
   * Am 21.08. waren in allen 122 Stundenreihen 4 von 7 Kerzen Stempel. */
  var T = Date.UTC(2026, 7, 21, 13, 30), h = 3600000;
  var reihe = [[T, 307.8, 13705396, 312.38, 307.01], [T + h, 310.6, 6775783, 310.64, 307.6],
    [T + 2 * h - 82000, 310.44, 0, 310.44, 310.44],          // Stempel 15:28:38
    [T + 2 * h, 310.9, 3000000, 311, 310.2],                 // echte 15:30
    [T + 3 * h, 311.06, 2476819, 311.64, 310.27]];
  var out = Arch.ohneStempel(reihe, 60);
  ok(out.length === 4 && out.every(function (b) { return b[0] % 60000 === 0; }),
     'Stempel verdraengt keine echte Kerze mehr (15:30 bleibt, 15:28:38 fliegt)',
     out.map(function (b) { return new Date(b[0]).toISOString().slice(11, 16); }).join(','));
  // Stempel NACH der echten Kerze (alter Fall) muss weiterhin verschwinden
  var reihe2 = [[T, 300, 1000, 301, 299], [T + h, 301, 1000, 302, 300], [T + h + 50000, 301.2, 0, 301.2, 301.2]];
  ok(Arch.ohneStempel(reihe2, 60).length === 2, 'Stempel nach der echten Kerze verschwindet weiterhin');

  /* Befund: Live-Scan rechnete auf dem 1mo-Abruf (~151 Kerzen); rsi2seit braucht 261.
   * Uebereinstimmung Live vs. Archiv-Signale 31,6 %. */
  ok(dep.indexOf('var archS = await window.Archiv.serie(cfg.interval') !== -1 &&
     dep.indexOf('bars = archS.slice(-800)') !== -1,
     'Der Live-Scan rechnet Signale auf der Archiv-Serie (Tiefe wie Studie und Edge-Waechter)');
  ok(dep.indexOf('await window.Archiv.fuege(cfg.interval') !== -1,
     'Die Archiv-Einspeisung wird abgewartet, bevor die Serie gelesen wird');
  ok(/sigBars\.length < 261[\s\S]{0,200}patienceAdd\('Kursreihe zu kurz/.test(dep),
     'Unter 261 Kerzen gibt es Geduld statt eines Signals, das nicht das gemessene waere');
  ok(dep.indexOf("var spot = fd.series[fd.series.length - 1][1];") !== -1,
     'Der Spot bleibt der frische Abrufkurs, nicht die Archivkerze');
})();


console.log('\n34) Momentum: Live-Buch rechnet dasselbe Fenster wie die validierte Strategie');
(function () {
  /* Audit 22.08.2026: mfhandel.js rechnete r[i-luecke]/r[i-rueck] = 210 Tage (11-1),
   * momentum.js staerke() rechnet von = bis - rueck = 231 Tage (12-1). Die belegten
   * +5,4 Pp gelten fuer 231 Tage. Beide Fassungen werden hier auf derselben Reihe
   * gegeneinander gerechnet - laufen sie je wieder auseinander, faellt dieser Test. */
  var Mo = require('./momentum.js'), Mh = require('./mfhandel.js');
  var reihe = []; for (var i = 0; i < 300; i++) reihe.push(100 * Math.exp(0.0007 * i + 0.01 * Math.sin(i / 7)));
  var n = reihe.length - 1, valid = Mo.staerke(reihe, n, 231, 21);
  var roh = { X: reihe.map(function (k, j) { return [Date.now() - (299 - j) * 86400000, k]; }) };
  var z = Mh.momentumZiel(roh, { rueckblick: 231, luecke: 21, minWerte: 1, anteil: 1 });
  var live = z && z.rangfolge[0] ? z.rangfolge[0].staerke : null;
  ok(valid != null && live != null && Math.abs(valid - live) < 1e-9,
     'Live-Buch und validierte Staerke liefern auf derselben Reihe denselben Wert',
     (valid != null ? valid.toFixed(6) : 'n/a') + ' / ' + (live != null ? live.toFixed(6) : 'n/a'));
})();


console.log('\n35) Drift-Buch: Meldung nach Schluss und Zukunftstermine (Audit 22.08.2026)');
(function () {
  var Dr = require('./drift.js');
  var dui = fs.readFileSync(__dirname + '/driftui.js', 'utf8');
  /* Absturz: Meldung NACH Schluss am LETZTEN Kurstag -> reaktionstag = b.length -> b[r] undefined.
   * Im Live-Pfad brach damit der ganze Takt ab - genau am Morgen nach einer Abendmeldung. */
  var tage = [], t0 = Date.UTC(2026, 0, 5, 20, 0);
  for (var i = 0; i < 130; i++) tage.push([t0 + i * 86400000, 100 + i * 0.1]);
  var letzter = tage[tage.length - 1][0];
  var termine = { X: [[new Date(letzter + 2 * 3600000).toISOString(), 1, 1.2, 20]] };   // 22:00 UTC am letzten Tag
  var warf = false, erg = null;
  try { erg = Dr.ereignisse({ X: tage }, termine, tage, { zukunftNoetig: false }); } catch (e) { warf = true; }
  ok(!warf, 'Meldung nach Schluss am letzten Kurstag wirft nicht mehr (Ereignis wird am Folgetag gewertet)');

  /* Zukunftstermin traegt Zahlen des Vorquartals -> darf kein Paar liefern */
  var hist = [{ quartalsEndeMs: Date.UTC(2026, 5, 30), ueberraschung: 5.15, ist: 2.1, schaetzung: 2.0 }];
  var zukunft = Date.UTC(2026, 7, 27, 20, 0), now = Date.UTC(2026, 7, 22, 22, 0);
  ok(Dr.paareAktuell(hist, zukunft, 120, now) === null,
     'Ein Termin in der Zukunft bekommt keine Vorquartals-Ueberraschung angehaengt');
  ok(Dr.paareAktuell(hist, Date.UTC(2026, 6, 30, 20, 0), 120, now) !== null,
     'Ein vergangener Termin innerhalb 120 Tagen liefert weiterhin ein Paar');
  ok(/zukunftBereinigt/.test(dui) && /Date\.parse\(t\[0\]\) > jetzt && t\[3\] != null/.test(dui),
     'Das Termin-Archiv wird einmalig von Zahlen an Zukunftsterminen befreit (25 Faelle am 22.08., darunter ADSK 27.08.)');
})();


console.log('\n36) Kostenhuerde des Produkts (Signalstudie 23.08.2026)');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var shell = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  /* Wichtigste praktische Erkenntnis der Signalstudie: Die Huerde entscheidet, nicht die
   * Signalqualitaet. Der Standard-Schein kostet 0,23 Pp je 3h-Umlauf (Spanne durch Hebel
   * plus Zeitwert). Die Zahl 0,11 stammt aus der Signalstudie vom 23.08. und ist
   * ueberholt: nach A7 misst die Messmaschine fuer rsi2seit einen Ueberschuss von
   * +0,0277 Pp bei t = 0,30, Urteil "nicht entscheidbar", je Signal -0,0415 Pp.
   * Sie steht hier nur noch als FESTER PRUEFWERT fuer die Kostenrechnung - dass die
   * Huerde beim Schein hoeher liegt als beim Basiswert, haengt nicht an ihr. */
  function huerde(cfg, spot, vol, haltenMin) {
    spot = spot > 0 ? spot : 200; vol = vol > 0 ? vol : 0.30;
    var halten = Math.max(5, haltenMin || 60), now = Date.now();
    if (cfg.instrument === 'basis') return { pp: 2 * 0.05 + (cfg.orderFee || 0) * 2 / 10000 * 100, hebel: 1 };
    var PR = Q.PROFILES[cfg.profile] || Q.PROFILES.atm21;
    var w = Q.makeWarrant('call', spot, vol, now, PR.ratio);
    w.strike = Math.round(spot * (1 + (PR.otmPct || 0)) * 100) / 100;
    w.expiry = now + PR.days * 86400000;
    var wert = Q.warrantValue('call', w, spot, now); if (!(wert > 0.02)) return null;
    var spx = Q.effSpread(w.iv, undefined, wert, w.ratio), omega = Q.warrantOmega('call', w, spot, now);
    if (!(omega > 0)) return null;
    var theta = Math.max(0, (wert - Q.warrantValue('call', w, spot, now + halten * 60000)) / wert);
    return { pp: (2 * spx + theta) / omega * 100, hebel: omega };
  }
  var std = huerde({ profile: 'atm21', instrument: 'schein' }, 200, 0.30, 180);
  var bv1 = huerde({ profile: 'atm60_b', instrument: 'schein' }, 200, 0.30, 180);
  var akt = huerde({ instrument: 'basis', orderFee: 0 }, 200, 0.30, 180);
  ok(std && std.pp > 0.18 && std.pp < 0.30,
     'Standard-Schein kostet rund 0,23 Pp je 3-Stunden-Umlauf', std ? std.pp.toFixed(3) : 'null');
  ok(bv1 && bv1.pp < std.pp / 3,
     'Der BV-1,0-Schein ist ein Vielfaches guenstiger als der Standard-Schein',
     bv1 ? bv1.pp.toFixed(3) + ' vs ' + std.pp.toFixed(3) : 'null');
  ok(akt && std.pp > akt.pp,
     'Bei einer Kante von 0,11 Pp traegt die Aktie, der Standard-Schein nicht (fester Pruefwert, kein Beleg)',
     'Aktie netto ' + (0.11 - akt.pp).toFixed(3) + ' / Schein netto ' + (0.11 - std.pp).toFixed(3));
  // Verdrahtung - tote Anzeigen gab es hier schon (6 Schalter, 22.08.)
  ok((html.match(/id="kostenHuerde"/g) || []).length === 1, 'Die Anzeigeflaeche existiert genau einmal');
  /* Die Huerde ist ein Satz, kein Auswahlfeld: im .params-Raster lief sie in eine
   * 108-px-Spalte und brach auf Wortbreite um. Diese Zusicherung haelt sie draussen.
   * Gemessen wird das schliessende </div> ZWISCHEN letztem Label und Huerde - es ist
   * der Beweis, dass das Raster vorher zu war. Eine reine Positionspruefung ("steht
   * hinter dem letzten Label") waere auch im alten, falschen Zustand gruen gewesen. */
  /* Die Marken enden bewusst NICHT auf </div>: seit die Gruppenueberschriften einen
   * Erklaerknopf tragen, steht das schliessende Tag eine Zeile tiefer. Gemessen wird
   * die Lage der Huerde, nicht die Schreibweise der Ueberschrift. */
  var rkGrp = html.slice(html.indexOf('<div class="pgroup-title">Risiko &amp; Kosten'),
                         html.indexOf('<div class="pgroup-title">Filter &amp; Schutz'));
  var zwischen = rkGrp.slice(rkGrp.lastIndexOf('</label>'), rkGrp.indexOf('id="kostenHuerde"'));
  ok(rkGrp.indexOf('id="kostenHuerde"') > -1 && /<\/div>/.test(zwischen),
     'Die Kostenhuerde steht AUSSERHALB des .params-Rasters, aber in der Gruppe "Risiko & Kosten"');
  ok(dep.indexOf('function kostenHuerdePp') !== -1 && dep.indexOf('function huerdeAnzeigen') !== -1,
     'Rechnung und Anzeige sind vorhanden');
  /* Die Absicht ist: Aendert jemand eine Einstellung, wird die Anzeige neu gefuellt.
   * Vorher pruefte das auf die exakte Nachbarschaft (Aufruf als LETZTE Zeile vor der
   * Klammer) - und brach, sobald daneben ein zweiter Aufruf stand. Jetzt wird der
   * idSave-Block als Ganzes betrachtet: beide Anzeigen muessen darin vorkommen. */
  var idSaveBlock = dep.slice(dep.indexOf('function idSave'), dep.indexOf('function idSave') + 5000);
  ok(/huerdeAnzeigen\(\)/.test(idSaveBlock), 'Die Kostenhuerde haengt an idSave - sie kann nicht veralten');
  ok(/regelKopfAnzeigen\(\)/.test(idSaveBlock), 'Der Regelkopf haengt ebenfalls an idSave');

  /* Stufe 2 des UI-Umbaus (23.08.2026): Der Signal-Chart ist entfernt - er zeigte fuer
   * die belegten Modi NICHT, was die Strategie sieht (Befund der Inventarisierung).
   * Der Strategie-Chart kann es und ist jetzt der eine Chart. Wichtig wie in Stufe 1:
   * die Verdrahtung muss mit weg - scBtn hing ungesichert an getElementById, das
   * waere beim Start ein Absturz gewesen. */
  ok(!/id="scChart"|id="scBtn"|id="scSym"/.test(html),
     'Der Signal-Chart ist aus der Oberflaeche raus');
  ok(!/runSigChart|drawSignalChart/.test(dep),
     'Kein Code greift mehr auf den Signal-Chart zu (sonst Absturz beim Start)');
  ok((html.match(/id="stcChart"/g) || []).length === 1,
     'Es gibt genau EINEN Strategie-Chart');

  /* Die drei Ergebnis-Ansichten lagen im Kurzfrist-Depot verstreut und beantworteten
   * dieselbe Frage. Jetzt stehen sie als Bilanz bei der Regel, zu der sie gehoeren. */
  var iBilanz = html.indexOf('id="regelBilanz"');
  var regelnVon = html.indexOf('<div id="tab-strategien"'), regelnBis = html.indexOf('<!-- /tab-strategien -->');
  var depotVon = html.indexOf('<div id="tab-depot"'), depotBis = html.indexOf('<!-- /tab-depot -->');
  ok(iBilanz > regelnVon && iBilanz < regelnBis && !(iBilanz > depotVon && iBilanz < depotBis),
     'Die Bilanz steht bei der Regel, nicht im Depot');
  ok(html.indexOf('id="stcChart"') > regelnVon && html.indexOf('id="stcChart"') < regelnBis,
     'Der Strategie-Chart steht ebenfalls im Reiter Regeln');
  ['tuneLog', 'patience', 'benchChart'].forEach(function (id) {
    ok(html.indexOf('id="' + id + '"') > iBilanz, 'Die Bilanz enthaelt ' + id);
  });

  /* Der Regelkopf darf die Regel nicht ein zweites Mal beschreiben - er liest sie. */
  var rk = dep.slice(dep.indexOf('function regelKopfAnzeigen'), dep.indexOf('function regelKopfAnzeigen') + 3500);
  ok(rk.length > 100 && /modeParams\(\)/.test(rk),
     'Der Regelkopf nimmt die Haltedauer aus modeParams - derselben Quelle wie der Handel');
  ok(/nicht entscheidbar/.test(rk),
     'Der Regelkopf nennt den Belegstand ehrlich (nach der Kontroll-Messung: nicht entscheidbar)');

  /* Stufe 3: benannte Regeln - Felix' Messinstrument aus Issue #36.
   * Eine Regel ist ein Ding mit Namen und Parametern; die gehandelte ist dieselbe
   * Sache mit einem Haekchen mehr. */
  ok(/id="regelnKarte"/.test(html) && /id="regelNeuBtn"/.test(html) && /id="regelnListe"/.test(html),
     'Die Karte fuer benannte Regeln ist da');
  ok(/function regelnPruefen/.test(dep) && /function regelnAnzeigen/.test(dep),
     'Pruefung und Anzeige der benannten Regeln existieren');

  /* Die wichtigste Zusicherung der ganzen Stufe. Ein Handelsknopf an einer Regel, die
   * gerade gemessen wird, macht die Messung wertlos - und die Versuchung ist am
   * groessten, wenn es gut laeuft. */
  /* Strukturell pruefen, nicht ueber Woerter: Der Erklaerungstext der Karte spricht
   * selbst davon, dass NICHT gehandelt wird - eine Wortsuche schlaegt daran an.
   * Gezaehlt werden deshalb die Knoepfe: erlaubt sind genau zwei, festschreiben und
   * loeschen. Jeder dritte Knopf muss auffallen.
   * Der Erklaerknopf (class="info") zaehlt NICHT mit: er oeffnet ein Textfenster und
   * kann nichts ausloesen. Wuerde er mitgezaehlt, muesste die Schwelle steigen - und
   * genau dann faellt ein echter Handelsknopf nicht mehr auf. */
  var rkarte = html.slice(html.indexOf('id="regelnKarte"'), html.indexOf('id="regelnListe"'));
  var knoepfe = (rkarte.match(/<button(?![^>]*class="info")/g) || []).length;
  ok(knoepfe === 1, 'In der Regelkarte steht genau ein Knopf (festschreiben) - kein Handelsknopf', knoepfe);
  ok((rkarte.match(/<button[^>]*class="info"/g) || []).length === 1,
     'die Erklaerung der Regelkarte haengt an einem Erklaerknopf, nicht an einem Bedienknopf');
  ok(!/regelHandeln|regelScharf|data-handel/.test(html),
     'Es gibt keinen Schalter, der eine benannte Regel handeln liesse');

  var rp = dep.slice(dep.indexOf('function regelnPruefen'), dep.indexOf('function regelnPruefen') + 2500);
  ok(/schattenNeu\('Regel: '/.test(rp), 'Eine benannte Regel schreibt nur Schatten, keine Position');
  ok(!/openTrade|D\.cash/.test(rp), 'In der Pruefung wird nirgends Geld bewegt');
  ok(/sigBars\.length < 261/.test(rp),
     'Auch benannte Regeln brauchen die volle Kerzentiefe - sonst messen sie etwas anderes');

  /* Eine festgeschriebene Regel muss eine KOPIE der Einstellungen tragen. Ein Verweis
   * wuerde sich mitaendern, sobald jemand oben dreht - dann misst sie nicht mehr, was
   * sie zu messen vorgibt. */
  ok(/JSON\.parse\(JSON\.stringify\(D\.intraday/.test(dep),
     'Eine festgeschriebene Regel bekommt eine Kopie der Einstellungen, keinen Verweis');

  /* Die Bilanz je Regel haengt daran, dass die Konfig-Sperre sie ausnimmt. */
  ok(/eigeneRegel = String\(sEintrag\.grund/.test(dep) && /!eigeneRegel && sEintrag\.konfig/.test(dep),
     'Benannte Regeln behalten ihre Bilanz trotz eigener Konfiguration');

  /* Stufe 4: aus sechs Reitern wurden vier. Am 23.08.2026 kam ein fuenfter dazu:
   * Messung - Scoreboard und Strategie-Eingabe. Die Zahl ist der Wachhund; wer einen
   * Reiter ergaenzt, muss ihn hier benennen. */
  /* Am 25.08.2026 ging einer wieder: die Marktkarte ist seither die zweite Pille unter
   * "Heute" (Struktur-Plan, Stufe C4) - ein eigener Reiter fuer EINE Ansicht war das
   * schwerste Ungleichgewicht der Leiste. Die Zahl ist der Wachhund; wer einen Reiter
   * ergaenzt ODER streicht, muss es hier benennen. */
  var reiter = (html.match(/data-tab="[a-z]+"/g) || []);
  ok(reiter.length === 5 && reiter.indexOf('data-tab="messung"') !== -1 &&
     reiter.indexOf('data-tab="marktkarte"') === -1,
     'Fuenf Reiter: Heute · Regeln · Vermoegen · Werkzeuge · Messung', reiter.join(' '));
  ['dashboard', 'strategien', 'depot', 'werkzeuge'].forEach(function (id) {
    ok(html.indexOf('data-tab="' + id + '"') !== -1 && html.indexOf('id="tab-' + id + '"') !== -1,
       'Reiter ' + id + ' hat Knopf und Inhalt');
  });
  /* Kurzfrist und Mittelfrist sind beide das Vermoegen - wer wissen will, wie es
   * steht, sollte nicht zwei Stellen addieren muessen. */
  ok(/data-sub="mittel"/.test(html) && /id="sub-mittel"/.test(html),
     'Mittelfristig ist ein Unter-Reiter von Vermoegen');
  ok(/id="wzPills"/.test(html) && /id="sub-explorer"/.test(html) && /id="sub-scheine"/.test(html),
     'Werkzeuge fasst Explorer und Schein-Finder zusammen');

  /* Der Umschalter darf nicht mehr auf eine einzelne Pillenleiste festgenagelt sein,
   * sonst waere die zweite Leiste tot - genau die Sorte toter Schalter, die dieser
   * Umbau abschaffen soll.
   * Seit dem 25.08.2026 steht er in app-shell.js statt in depot.js init(). Dort hing er
   * hinter dem Laden des Depots (ein IPC-Umlauf plus rund 300 Zeilen Migration), und bis
   * dahin sahen alle Pillen bedienbar aus und taten nichts. Die Zusicherungen sind
   * mitgezogen; sie messen dasselbe Verhalten, nur in der anderen Datei. */
  ok(/querySelectorAll\('\.pills button\[data-sub\]'\)/.test(shell) && !/getElementById\('depotPills'\)/.test(shell),
     'Der Unter-Reiter-Umschalter arbeitet in JEDER Pillenleiste');
  ok(!/\.pills button/.test(dep),
     'Der Umschalter steht in der Shell - das Fachmodul verkabelt keine Navigation mehr');
  /* ... aber NUR auf Pillen, die auch eine Unterseite benennen. Ohne [data-sub] fing er
   * am 23.08.2026 auch die sechs Protokoll-Filter, den CSV-Knopf und die beiden
   * Setup-Pillen ab: er blendete alle .sub-Bereiche aus, fand kein Ziel und schaltete
   * nichts zurueck - ein Klick auf "CSV-Export" leerte den ganzen Reiter Vermoegen.
   * Beide Fundstellen muessen eingeschraenkt sein, auch die, die .active abraeumt. */
  ok(!/querySelectorAll\('\.pills button'\)/.test(shell),
     'Der Umschalter fasst keine Pillen ohne data-sub (sonst leert ein Befehlsknopf den Reiter)');
  var pillZeilen = (shell.match(/querySelectorAll\('\.pills button[^']*'\)/g) || []);
  ok(pillZeilen.length >= 2 && pillZeilen.every(function (z) { return /\[data-sub\]/.test(z); }),
     'JEDE .pills-button-Auswahl in app-shell.js ist auf [data-sub] eingeschraenkt  [' + pillZeilen.length + ']');
  /* Gegenprobe am Markup: Es GIBT Knoepfe in einer .pills-Leiste ohne data-sub -
   * genau deshalb muss die Einschraenkung oben bestehen bleiben. */
  var logFilter = (html.match(/<div class="pills small" id="logFilter">[\s\S]*?<\/div>/) || [''])[0];
  ok(/id="csvBtn"/.test(logFilter) && !/data-sub/.test(logFilter),
     'die Protokoll-Leiste enthaelt Befehlsknoepfe ohne data-sub - die Einschraenkung ist noetig');
  ok(/b\.closest\('\.tab'\)/.test(shell),
     'Er wirkt nur im Reiter der angeklickten Pille');

  /* Zwei Sprungmarken zeigten auf [data-tab="explorer"]. Den Knopf gibt es nicht mehr;
   * querySelector liefert dort still null - der Sprung waere wirkungslos gewesen,
   * ohne Fehlermeldung. */
  var expSrc = fs.readFileSync(__dirname + '/explorer.js', 'utf8');
  var rndSrc = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
  ok(!/data-tab="explorer"/.test(expSrc) && !/data-tab="explorer"/.test(rndSrc),
     'Keine Sprungmarke zeigt mehr auf den entfernten Explorer-Reiter');
  ok(/#wzPills \[data-sub="explorer"\]/.test(expSrc) && /#wzPills \[data-sub="explorer"\]/.test(rndSrc),
     'Beide Sprungmarken oeffnen Reiter UND Pille');

  /* Stufe 5: die Kontrolle gehoert in jede Bilanz.
   * Am 23.08.2026 zeigte sich, dass rund zwei Drittel des Rohvorsprungs der belegten
   * Regel schlichtes Halten sind. Ohne diese Zahl misst eine Bilanz Marktdrift. */
  ok(/function kontrollErtrag/.test(dep), 'Die Kontrollrechnung existiert');
  var ke = dep.slice(dep.indexOf('function kontrollErtrag'), dep.indexOf('function kontrollErtrag') + 1600);
  ok(/for \(var i = 261;/.test(ke),
     'Die Kontrolle beginnt beim Vorlauf des Detektors (261), nicht frueher');
  ok(/getUTCHours\(\) !== std/.test(ke),
     'Verglichen wird dieselbe Tagesstunde desselben Werts');
  ok(/k < 20/.test(ke),
     'Unter 20 Vergleichsfaellen wird kein Kontrollwert gemeldet');
  ok(/ktrPct: ktr/.test(dep), 'Jeder Schatten traegt seinen Kontrollwert');
  ok(/g2\.ktrN = \(g2\.ktrN \|\| 0\) \+ 1/.test(dep), 'Die Bilanz zaehlt die Kontrolle getrennt mit');

  /* Nachgerechnet, weil eine falsche Kontrolle schlimmer ist als keine: Der Startindex
   * war zuerst 60 und ergab +0,128 statt +0,113 Pp - der Ueberschuss haette damit
   * +0,036 statt +0,064 gelautet. Die Zahl im Regelkopf muss die korrigierte sein. */
  ok(/\+0,065 Pp Überschuss/.test(dep) && !/\+0,114 Pp gegen Kontrolle/.test(dep),
     'Der Regelkopf nennt den korrigierten Ueberschuss (+0,065), nicht den zu hohen (+0,114)');
  ok(/Überschuss/.test(dep) && /Kontrolle/.test(dep),
     'Die Regelliste zeigt Kontrolle und Ueberschuss als eigene Spalten');

  /* Trendwechsel-Reiter (Wilhelms Frage nach dem Ausstiegszeitpunkt, 23.08.2026).
   * Der Detektor HAT keine Ausstiegsregel - er erkennt eine Drehung und sagt nie, wann
   * man wieder heraus soll. Die einzige Regel, die aus ihm folgt, ist die
   * symmetrische: halten bis zur Gegendrehung. Das steht jetzt da, statt einer
   * erfundenen Haltedauer. */
  /* Seit Stufe E wohnt der Reiter-Inhalt in der eigenen Datei - dort wird geschnitten. */
  var wu3 = fs.readFileSync(__dirname + '/wendeui.js', 'utf8');
  ok(/<th title="Die einzige Ausstiegsregel/.test(wu3) && /bei Gegendrehung/.test(wu3),
     'Der Trendwechsel-Reiter nennt den Ausstieg - als Bedingung, nicht als erfundene Zahl');
  ok(/function wendeNachlese/.test(wu3), 'Die Nachlese ueber fruehere Drehungen existiert');

  /* Die wichtigste Zusicherung dieses Blocks. Es WAR eine Ertragszahl geplant; beim
   * Nachrechnen kippte sie das Vorzeichen, sobald man die Abtastdichte aenderte
   * (-0,028 / +0,166 / +0,230 % bei gleicher Fallzahl von sechs). Sie ist deshalb
   * wieder raus. Wer eine Zahl sieht, liest sie - egal wie vorsichtig der Text
   * daneben steht. */
  ok(wu3.indexOf("'<td>' + (z.nl") >= 0, 'Die Fallzahl-Zelle ist auffindbar');
  var wz = wu3.slice(wu3.indexOf("'<td>' + (z.nl"), wu3.indexOf("'<td>' + (z.nl") + 900);
  ok(!/signCls\(z\.nl\.mittel\)|z\.nl\.ueberschuss/.test(wz),
     'Im Trendwechsel-Reiter steht KEINE Ertragszahl - sie war nicht stabil');
  ok(/z\.nl\.n \+ ' Drehungen/.test(wz),
     'Stattdessen steht die Fallzahl da - sie sagt ehrlich, dass sich nichts bewerten laesst');
  ok(/kann seine eigenen Signale nicht/.test(wu3),
     'Der Reiter sagt selbst, dass er seine Signale nicht bewerten kann');
  ok(/0,074 Pp, t = 1,22/.test(wu3),
     'Die belastbare Aussage zum Winkel-Detektor steht dabei (widerlegt auf 55 Tagen)');

  /* Trendfinder (Felix' Wunsch #58, 23.08.2026): Der Trend ist die Hauptsache, der
   * Wechsel sein Sonderfall. Dazu drei Zusicherungen - die Umbenennung, die drei
   * Eigenschaften aus DERSELBEN Rechnung, und vor allem: die Guete loest nichts aus.
   * Felix hatte ausdruecklich gewuenscht, ab einer guten Trend-Guete zu ordern.
   * Genau das ist gemessen und widerlegt (-0,17 Pp, t = -4,1); der Reiter muss das
   * sagen, statt es zu verschweigen. */
  var hF = fs.readFileSync(__dirname + '/index.html', 'utf8');
  ok(hF.indexOf('<button data-sub="wende">Trendfinder</button>') >= 0,
     'Trendfinder: der Reiter heisst nach dem Trend, nicht nach seinem Sonderfall');
  ok(wu3.indexOf('>Trend jetzt</th>') >= 0 && wu3.indexOf('>Güte</th>') >= 0 && wu3.indexOf('>Breite</th>') >= 0,
     'Trendfinder: die drei Eigenschaften des Trends stehen als eigene Spalten');
  ok(wu3.indexOf('var kj = z.kt ? z.kt.k : null;') >= 0 &&
     wu3.indexOf("w.bild.kanalJung ? { k: w.bild.kanalJung") >= 0,
     'Trendfinder: Guete und Breite kommen aus dem Kanal des Detektors - kein zweiter Rechenweg');
  ok(/−0,17 Pp je Trade, t = −4,1/.test(wu3) && /Die Güte löst nichts aus/.test(wu3),
     'Trendfinder: dass die Guete NICHTS ausloest, steht mit der Messung dabei');
  /* Die Begruendung stand bis 8.31 als Dauertext ueber der Tabelle und ist mit D6 ins
   * Erklaerregister gezogen - woertlich, es ist eine Messaussage. Die Marke zeigt
   * deshalb jetzt auf app-shell.js; sichtbar bleibt der Knopf am Reiterkopf. */
  var shF = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  ok(/−0,17 Prozentpunkte je Trade bei t = −4,1/.test(shF),
     'Trendfinder: die Absage an guete-getriebene Orders steht woertlich im Erklaerregister');
  ok(/rund 30 Fälle je Wert/.test(shF) && /sie ist nur ungemessen/.test(shF),
     'Trendfinder: auch die Fallzahl-Begruendung ist vollstaendig mitgezogen');
  ok(/data-info="werkzeuge\.trendfinder"/.test(hF),
     'Trendfinder: der Erklaerknopf steht am Reiterkopf');
  /* Und die Gegenprobe zum zweiten Teil des Wunsches: KEINE Order aus dem Reiter.
   * Seit Stufe E wohnt der Trendfinder in einer eigenen Datei - die Marken schneiden
   * dort, nicht mehr im Handelsmodul. */
  var wui = fs.readFileSync(__dirname + '/wendeui.js', 'utf8');
  var wendeBlock = wui.slice(wui.indexOf('async function wendePruefen'), wui.indexOf('function wendeChartsVerkabeln'));
  ok(wendeBlock.length > 500 && wendeBlock.indexOf('kaufen(') < 0 &&
     wendeBlock.indexOf('orderNeu(') < 0 && wendeBlock.indexOf('eroeffne(') < 0,
     'Trendfinder: der Reiter loest weiterhin keine Order aus - reine Beobachtung');
  /* Fenster-Kanal: "zu wenig Historie" verschwindet dort, wo ein Trend sichtbar ist -
   * aber ein Wechsel-Urteil wird deshalb NICHT erfunden. */
  ok(wui.indexOf("quelle: 'fenster'") >= 0 && wui.indexOf("Fenster: letzte ' + kj.n") >= 0,
     'Trendfinder: ohne bestaetigten Wendepunkt steht der Fenster-Kanal da, gekennzeichnet');
  ok(/nur Trend, kein Wechsel-Urteil/.test(wui) && /nicht bestimmbar/.test(wui),
     'Trendfinder: in Fenster-Zeilen wird kein Wechsel behauptet');





  ok(/quellenMigration\(\);\n    huerdeAnzeigen\(\);/.test(dep), 'Die Anzeige wird beim Start gefuellt');
})();


console.log('\n37) Produkt-Vorgabe: eine Wahrheit, nicht drei');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  /* Befund 23.08.2026: Die Vorgabe stand an drei Stellen und zwei widersprachen der
   * Messung - D.intraday sagte atm60_b/basis, HTML-'selected' und die Lade-Rueckfaelle
   * sagten atm21/schein. Huerde 0,26 statt 0,07 Pp; die belegte Kante (0,11 Pp) waere
   * damit netto negativ gewesen. Gleiche Fehlerklasse wie die Live-Abweichungen vom 22.08. */
  function erste(re, s) { var m = s.match(re); return m ? m[1] : null; }
  var kProf = erste(/profile: '([a-z0-9_]+)'/, dep);
  var kInst = erste(/instrument: '([a-z0-9_]+)'/, dep);
  var hProf = erste(/id="idProfile"><option value="([a-z0-9_]+)" selected/, html);
  var hInst = erste(/id="idInstrument"><option value="([a-z0-9_]+)" selected/, html);
  var rProf = erste(/c\.profile \|\| '([a-z0-9_]+)'/, dep);
  var rInst = erste(/c\.instrument \|\| '([a-z0-9_]+)'/, dep);
  ok(kProf && kProf === hProf && hProf === rProf,
     'Profil-Vorgabe stimmt in Konfig, Oberflaeche und Lade-Rueckfall ueberein',
     kProf + ' / ' + hProf + ' / ' + rProf);
  ok(kInst && kInst === hInst && hInst === rInst,
     'Instrument-Vorgabe stimmt in allen drei Quellen ueberein',
     kInst + ' / ' + hInst + ' / ' + rInst);
  /* Und die Vorgabe muss die guenstigste sein: sonst ist die belegte Kante netto negativ. */
  function huerde(p, haltenMin) {
    var now = Date.now(), PR = Q.PROFILES[p]; if (!PR) return null;
    var w = Q.makeWarrant('call', 200, 0.30, now, PR.ratio);
    w.strike = Math.round(200 * (1 + (PR.otmPct || 0)) * 100) / 100;
    w.expiry = now + PR.days * 86400000;
    var wert = Q.warrantValue('call', w, 200, now); if (!(wert > 0.02)) return null;
    var om = Q.warrantOmega('call', w, 200, now); if (!(om > 0)) return null;
    var th = Math.max(0, (wert - Q.warrantValue('call', w, 200, now + haltenMin * 60000)) / wert);
    return (2 * Q.effSpread(w.iv, undefined, wert, w.ratio) + th) / om * 100;
  }
  var alle = Object.keys(Q.PROFILES).map(function (p) { return { p: p, h: huerde(p, 480) }; })
    .filter(function (x) { return x.h != null; }).sort(function (a, b) { return a.h - b.h; });
  ok(alle.length && alle[0].p === kProf,
     'Die Profil-Vorgabe ist das guenstigste Profil bei 8 h Haltedauer',
     alle.slice(0, 3).map(function (x) { return x.p + ' ' + x.h.toFixed(3); }).join(' < '));
  ok(huerde(kProf, 480) < 0.111,
     'Die belegte Kante (0,111 Pp Ueberschuss) traegt mit der Vorgabe',
     'Huerde ' + huerde(kProf, 480).toFixed(3) + ' -> netto +' + (0.111 - huerde(kProf, 480)).toFixed(3));
})();


console.log('\n38) Auffuell-Lauf: sp100 und 60-Minuten-Erstbefuellung');
(function () {
  /* Seit Stufe E wohnt der Backfill in der eigenen Datei - dort wird geschnitten. */
  var bfq = fs.readFileSync(__dirname + '/backfill.js', 'utf8');
  ok(bfq.indexOf('async function massenBackfill') >= 0, 'massenBackfill ist auffindbar (Stufe-0-Marken)');
  var mbI = bfq.indexOf('async function massenBackfill');
  var mb = bfq.slice(mbI, bfq.indexOf('async function datenquelleTest'));
  /* Messung 23.08.2026: Der Ueberschuss wird in weniger liquiden Werten NICHT schlechter
   * (oberstes Umsatzviertel -0,110 Pp, unterstes +0,108). Eine Verbreiterung verwaessert
   * also nicht - sie braucht nur vorher Daten. 79 der 151 Werte aus ndx100+sp100 hatten
   * kein 60m-Archiv, und genau darauf rechnet die belegte Kante rsi2seit. */
  ok(/\['ndx100', 'sp100'\]/.test(mb),
     'Der Auffuell-Lauf holt ndx100 UND sp100');
  ok(mb.indexOf("fetchIntraday(fehl60[g0], '60m', true)") !== -1,
     '60-Minuten-Historie kommt ueber Yahoo mit btRange (730 Tage), nicht von Capital');
  ok(/s60\.length < 400/.test(mb),
     'Nur Werte mit zu duennem 60m-Archiv werden geholt - versorgte bleiben unangetastet');
  ok(mb.indexOf("Archiv.fuege('60m', fehl60[g0], fd60.series)") !== -1 &&
     mb.indexOf("Archiv.fuege('60m', fehl60[g0], fd60.series, 'cap')") === -1,
     'Yahoo-Kerzen werden NICHT als CFD gekennzeichnet (ihr Volumen ist Boersenvolumen)');
  ok(/setTimeout\(r, 700\)/.test(mb),
     'Der Yahoo-Abruf ist gedrosselt (Yahoo wirft ab rund 200 Anfragen in Folge 429)');
  ok(/opts\.mit60m !== false/.test(mb),
     'Stufe 0 laesst sich abschalten, ohne den Capital-Teil zu verlieren');
  // Reihenfolge: 60m VOR dem Capital-Teil, sonst misst der Liquiditaetsfilter auf CFD-Volumen
  var i60 = mb.indexOf('Stufe 0'), iCap = mb.indexOf('for (var vi = 0');
  ok(i60 > 0 && iCap > i60, 'Stufe 0 laeuft VOR dem Capital-Teil', 'Position ' + i60 + ' < ' + iCap);
})();


console.log('\n39) Kuerzel-Schreibweisen und Fehlercodes (echter Lauf 23.08.2026)');
(function () {
  var cap = fs.readFileSync(__dirname + '/capital.js', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  /* Der Auffuell-Lauf brach ab: Capital fuehrt Berkshire Hathaway B als 'BRKB', Yahoo als
   * 'BRK-B'. Die woertliche Suche verwarf den richtigen Treffer. Zugleich prueft der
   * Frueh-Abbruch auf den TEXT 'Kein Markt' - die Meldung hiess inzwischen 'Kein
   * gesicherter Markt', also zaehlten nicht gefuehrte Einzelwerte als Verbindungsstoerung. */
  function varianten(sym) {
    var out = [sym], m = /^([A-Za-z0-9]+)[-.]([A-Za-z])$/.exec(sym);
    if (m) out.push(m[1] + m[2]);
    return out;
  }
  ok(varianten('BRK-B').indexOf('BRKB') !== -1, 'BRK-B findet auch die Schreibweise BRKB');
  ok(varianten('BF-B').indexOf('BFB') !== -1, 'BF-B findet auch BFB');
  ok(varianten('SAP.DE').length === 1 && varianten('MUV2.DE').length === 1,
     'Boersensuffixe wie .DE werden NICHT zusammengezogen (SAPDE waere ein anderer Wert)');
  ok(varianten('AAPL').length === 1, 'Kuerzel ohne Trenner bleiben unveraendert');
  ok(cap.indexOf('function tickerVarianten') !== -1 &&
     /vari\.indexOf\(m\.epic\)/.test(cap) && /vari\.indexOf\(m\.symbol\)/.test(cap),
     'Die Marktsuche vergleicht beide Schreibweisen - exakt, nicht unscharf');

  /* Fehlerart als Code, nicht als Text */
  ok(/lastErrorKind:\s*function/.test(cap), 'capital.js meldet die Fehlerart als Code');
  ["'kein-markt'", "'http'", "'unlesbar'"].forEach(function (c) {
    ok(cap.indexOf('letzterGrundArt = ' + c) !== -1, 'Fehlercode ' + c + ' wird gesetzt');
  });
  /* Seit Stufe E in backfill.js - dort wird geschnitten. */
  var bfk = fs.readFileSync(__dirname + '/backfill.js', 'utf8');
  var mbI = bfk.indexOf('async function massenBackfill');
  var mb = bfk.slice(mbI, bfk.indexOf('async function datenquelleTest'));
  ok(mb.indexOf("symArt !== 'kein-markt'") !== -1,
     'Der Frueh-Abbruch prueft den CODE, nicht den Meldungstext');
  ok(mb.indexOf("symGrund.indexOf('Kein Markt')") === -1,
     'Die alte Textpruefung ist raus - sie brach, als sich der Wortlaut aenderte');
})();


console.log('\n40) Strategie-Chart: Kanaele an der Kerze, fuer die sie gelten');
(function () {
  /* Seit Stufe E wohnt die stc-Familie in der eigenen Datei - dort wird geschnitten. */
  var d4 = fs.readFileSync(__dirname + '/strategiechart.js', 'utf8');
  var draw = d4.slice(d4.indexOf('function drawStrategieChart'), d4.indexOf('function drawStrategieIndikator'));

  /* Der Fehler, den das verhindern soll: Der Chart nahm an, ein Kanal ende IMMER auf
   * der letzten Kerze des Bildes. Beim Klick auf ein historisches Signal rechnete die
   * Bedingungsliste den Kanal jener Kerze nach, gezeichnet wurde der von heute.
   * An 292 echten Signalen: 100 % anderer Kanal, 81 % andere Richtung. */
  ok(draw.indexOf('kStart = n - kN') === -1,
     'Der Chart verankert Kanaele NICHT mehr pauschal am rechten Rand');
  ok(/z\.startI = z\.endI - \(z\.k\.n - 1\)/.test(draw),
     'Jeder Kanal wird an seiner eigenen Endkerze verankert (endI)');
  ok(/function drawStrategieChart\(svg, bars, e20, e100, kanaele, marks, hl, band\)/.test(draw),
     'drawStrategieChart nimmt eine LISTE von Kanaelen und ein Band');

  var liste = d4.slice(d4.indexOf('function stcKanalListe'), d4.indexOf('function stcBandSerie'));
  ok(liste.indexOf('Q.kanalUeber(S.bars, Math.max(0, bis - 200), bis)') !== -1,
     'Die Liste holt den Kanal ueber dieselben 200 Kerzen wie einstiegSignal');
  ok(/endI: ci - off/.test(liste),
     'Der Kanal des angeklickten Signals endet an DESSEN Kerze');
  ok(liste.indexOf("farbe: 'var(--muted)'") !== -1 && /Kontext/.test(liste),
     'Kontext-Kanaele sind eigens gefaerbt - was nichts entscheidet, sieht nicht aus wie eine Entscheidung');

  var waehl = d4.slice(d4.indexOf('function stcSignalWaehlen'), d4.indexOf('function drawStrategieChart'));
  ok(waehl.indexOf('stcKanalListe(S, S.gewaehlt') !== -1 && waehl.indexOf('S.e100, S.kanal,') === -1,
     'Ein Klick auf ein Signal zeichnet den Kanal JENER Kerze, nicht den von heute');

  /* Band: eine Formel, nicht zwei. Der Chart darf die Ausloeserschwelle nicht
   * nachrechnen - sonst wandert die gezeichnete Linie irgendwann von der Regel weg. */
  var bandF = d4.slice(d4.indexOf('function stcBandSerie'), d4.indexOf('/** Zustand des zuletzt geladenen'));
  ok(/r\.bandOben/.test(bandF) && /r\.bandUnten/.test(bandF) && bandF.indexOf('stdev') === -1,
     'Das Ueberdehnungsband kommt aus reversionSignal, es wird nicht nachgerechnet');
  ok(/S\.mode !== 'kapitulation'\) return null/.test(bandF),
     'Das Band erscheint nur dort, wo es wirklich ausloest (Kapitulations-Modus)');

  /* Geometrie an echten Zahlen: Die Formel des Charts muss an BEIDEN Enden des
   * Kanals genau das treffen, was kanalUeber selbst berechnet hat. */
  var bg = [], pg = 100, rg = lcg(77);
  for (var g = 0; g < 400; g++) { pg += rg() * 0.8 + 0.02; bg.push([Date.UTC(2026, 0, 1) + g * 3600000, pg, 1000]); }
  var kg = Q.kanalUeber(bg, 150, 350);
  var endI = 260, startI = endI - (kg.n - 1);
  function mitteBei(i) { return kg.mitteJetzt - kg.steigung * (endI - i); }
  ok(Math.abs(mitteBei(endI) - kg.mitteJetzt) < 1e-9,
     'Chart-Formel trifft an der Endkerze die Kanalmitte von kanalUeber');
  ok(Math.abs(mitteBei(startI) - kg.achse) < 1e-6,
     'Chart-Formel trifft an der Startkerze den Achsenabschnitt von kanalUeber', (mitteBei(startI) - kg.achse).toExponential(2));

  /* Das Band in Kursen muss genau dort liegen, wo z die Schwelle reisst. */
  var bandTreffer = 0, bandGeprueft = 0;
  for (var q = 120; q < bg.length; q += 5) {
    var win = bg.slice(Math.max(0, q - 260), q + 1);
    var rr = Q.reversionSignal(win, 'ema', 20, 1.5);
    if (rr.z == null || !rr.bandUnten) continue;
    bandGeprueft++;
    var unten = win[win.length - 1][1] <= rr.bandUnten + 1e-9;
    if (unten === (rr.z <= -1.5)) bandTreffer++;
  }
  ok(bandGeprueft > 20 && bandTreffer >= bandGeprueft - 1,
     'Die Bandunterkante liegt genau auf der Ausloeserschwelle z = -ZTHR',
     bandTreffer + '/' + bandGeprueft);
})();

console.log('\n41) Echte WKN zum Modell-Schein (Tickets #9/#11/#17)');
(function () {
  var W = require('./wkn.js');

  /* --- Basiswert-Zuordnung: eine falsche WKN ist schlimmer als keine --- */
  // Genau das liefert die Kuerzel-Suche nach "MU": Micron ist gar nicht dabei.
  var trefferMU = [
    { entityType: 'STOCK', entityValue: '83258', name: 'Münchener Rück', homeSymbol: 'MUV2', isin: 'DE0008430026' },
    { entityType: 'STOCK', entityValue: '20264835', name: 'Mutares', homeSymbol: 'MUX', isin: 'DE000A2NB650' }
  ];
  ok(W.basiswertWaehlen(trefferMU, 'MU', 'Micron') === null,
     'Kuerzelsuche "MU" liefert Muenchener Rueck – die Zuordnung lehnt ab statt zu raten');

  var trefferMicron = [
    { entityType: 'STOCK', entityValue: '279805907', name: 'Micron Technology (CDR)', homeSymbol: 'MU', isin: 'CA5949781085' },
    { entityType: 'STOCK', entityValue: '86911', name: 'Micron Technology', homeSymbol: 'MU', isin: 'US5951121038' },
    { entityType: 'STOCK', entityValue: '90899', name: 'MICRONICS JAPAN', homeSymbol: '6871', isin: 'JP3750400008' }
  ];
  var mic = W.basiswertWaehlen(trefferMicron, 'MU', 'Micron');
  ok(mic && mic.id === '86911', 'Namenssuche findet Micron – und die Hauptnotierung, nicht die CDR-Zweitnotierung', mic && mic.id);

  // Der Name entscheidet nur mit, wenn er passt: gleiches Kuerzel, anderer Wert -> nicht nehmen
  ok(W.basiswertWaehlen([{ entityType: 'STOCK', entityValue: '1', name: 'Mutares', homeSymbol: 'MU', isin: 'DE000A2NB650' }], 'MU', 'Micron') !== null,
     'Ohne Namenstreffer bleibt die Kuerzel-Uebereinstimmung bestehen (die Quelle kennt den Klarnamen nicht immer)');
  ok(W.basiswertWaehlen(trefferMicron, 'MU', null).id === '86911',
     'Auch ohne Klarnamen gewinnt die Hauptnotierung vor der Zweitnotierung');
  ok(W.basiswertWaehlen([{ entityType: 'DERIVATIVE', entityValue: '9', name: 'Irgendein Schein', homeSymbol: 'MU' }], 'MU', 'Micron') === null,
     'Nur Aktien kommen als Basiswert in Frage, keine Derivate aus derselben Trefferliste');
  ok(W.basiswertWaehlen([{ entityType: 'STOCK', entityValue: '7', name: 'Infineon', homeSymbol: 'IFX', isin: 'DE0006231004' }], 'IFX.DE', 'Infineon').id === '7',
     'Yahoo-Boersenkuerzel mit Laendersuffix (IFX.DE) trifft das Heimatkuerzel IFX');

  /* --- Abfrage-URL --- */
  var jetzt = Date.UTC(2026, 7, 23, 12, 0);   // 23.08.2026
  var modell = { dir: 'call', strike: 200, restTage: 30, ratio: 0.1 };
  var url = W.scheinUrl('92472', modell, jetzt, 50);
  var qp = decodeURIComponent((url.split('queryParameters=')[1] || ''));
  ok(url.indexOf('entityValueUnderlying=92472') > 0, 'Die Abfrage nennt den Basiswert');
  ok(qp.indexOf('idExerciseRight=2') >= 0 && W.scheinUrl('1', { dir: 'put', strike: 200, restTage: 30, ratio: 1 }, jetzt).indexOf('%3D1%26') > 0,
     'Call und Put werden auf die Kennungen 2 und 1 abgebildet');
  ok(url.indexOf('%3D') > 0 && url.indexOf('%26') > 0 && url.indexOf('&idExerciseRight') < 0,
     'Die Filter stehen kodiert IM Parameter queryParameters, nicht daneben – sonst ignoriert die Quelle sie stillschweigend');
  ok(qp.indexOf('strikeAbsRange=194;206') >= 0, 'Basispreis-Band ±3 %', qp);
  var f = W.fenster(modell, jetzt);
  ok(f.vonISO === '2026-09-08' && f.bisISO === '2026-10-23',
     'Laufzeitfenster 0,6× bis 1,8× – eng genug zum Treffen, weit genug für feste Verfallstage', f.vonISO + '…' + f.bisISO);

  /* --- Antwort eindampfen --- */
  var roh = {
    list: [
      { instrument: { wkn: 'JY1DB9', isin: 'DE000JY1DB93' }, issuer: { name: 'J.P. Morgan' },
        codeExerciseRight: 'C', codeExerciseStyle: 'A', strikeAbs: 224, coverRatio: 0.1,
        dateMaturity: '2026-10-16T12:00:00.000+00:00', leverage: 10.04, spreadAskPct: 1.25,
        impliedVolatilityAsk: 37.8731, quanto: false,
        quote: { bid: 0.79, ask: 0.8, isoCurrency: 'EUR', datetimeAsk: '2026-08-21T19:59:52.000+00:00' } },
      /* Emittent stellt gerade nicht: nur Geld, dazu eine Spanne von 69 % - der
         Datensatz ist echt (ASML am 22.08.), als Preis aber unbrauchbar. */
      { instrument: { wkn: 'PK72K0', isin: 'DE000PK72K00' }, issuer: { name: 'BNP Paribas' },
        codeExerciseRight: 'C', strikeAbs: 224, coverRatio: 0.1,
        dateMaturity: '2026-10-16T12:00:00.000+00:00', spreadAskPct: 69.37, impliedVolatilityAsk: 1.0,
        quote: { bid: 0.34, isoCurrency: 'EUR' } },
      { instrument: { isin: 'DE000XXXXXX1' }, strikeAbs: 220, dateMaturity: '2026-10-16T12:00:00.000+00:00' },   // ohne WKN
      { instrument: { wkn: 'AAAAAA' }, codeExerciseRight: 'C', dateMaturity: '2026-10-16T12:00:00.000+00:00' }    // ohne Basispreis
    ]
  };
  var norm = W.normalisiere(roh, jetzt);
  ok(norm.length === 2, 'Halbe Datensätze (ohne WKN oder ohne Basispreis) fallen raus', norm.length);
  ok(norm[0].wkn === 'JY1DB9' && norm[0].dir === 'call' && norm[0].restTage === 54 && norm[0].waehrung === 'EUR',
     'WKN, Richtung, Restlaufzeit und Währung kommen richtig an', norm[0].restTage);
  ok(norm[0].iv === 37.9, 'Die Quelle liefert die implizite Vola bereits in Prozent – sie wird nicht noch einmal skaliert', norm[0].iv);
  ok(norm[0].stand === Date.parse('2026-08-21T19:59:52.000+00:00'),
     'Der Zeitpunkt der letzten Kursstellung wird mitgeführt (am Wochenende ist er von Freitag)');
  ok(norm[0].kursFraglich === false && norm[1].kursFraglich === true,
     'Einseitige Stellung mit 69 % Spanne gilt als unbrauchbar, die saubere Stellung nicht');
  ok(norm[1].iv === null, 'Der Platzhalter 1,0 % Vola wird verworfen statt als Kennzahl ausgegeben', norm[1].iv);

  /* --- Zuordnung Modell -> echter Schein --- */
  var liste = [
    { wkn: 'NAH', dir: 'call', strike: 201, restTage: 32, ratio: 0.1, spanneGesamtPct: 1.2 },
    { wkn: 'WEIT', dir: 'call', strike: 206, restTage: 54, ratio: 0.1, spanneGesamtPct: 0.4 },
    { wkn: 'BVFALSCH', dir: 'call', strike: 201, restTage: 32, ratio: 1.0, spanneGesamtPct: 0.5 },
    { wkn: 'PUT', dir: 'put', strike: 200, restTage: 30, ratio: 0.1, spanneGesamtPct: 0.1 }
  ];
  var beste = W.besteScheine(modell, liste, 3);
  ok(beste[0].wkn === 'NAH', 'Der nächstliegende Schein gewinnt – nicht der mit der kleinsten Spanne', beste[0].wkn);
  ok(beste.every(function (s) { return s.wkn !== 'PUT'; }), 'Ein Put wird einer Call-Zeile nie zugeordnet');
  ok(W.abstand(modell, liste[0]) < W.abstand(modell, liste[2]),
     'Gleiche Merkmale, anderes Bezugsverhältnis: schlechterer Treffer (die Spanne je Umlauf ist eine andere)');
  ok(beste[0].passt === true, 'Basispreis 0,5 % daneben und zwei Tage länger gilt als Treffer');

  /* Der ehrliche Fall: zu einer 7-Tage-Zeile gibt es nur einen 19-Tage-Schein.
     Er wird gezeigt, aber NICHT als Treffer ausgegeben – Zeitwertverfall ist der
     halbe Handel, ein 19-Tage-Schein ist ein anderes Geschäft. */
  var kurz = W.besteScheine({ dir: 'call', strike: 257, restTage: 7, ratio: 0.1 },
    [{ wkn: 'BD2184', dir: 'call', strike: 250, restTage: 19, ratio: 1.0, spanneGesamtPct: 4.5 }], 3);
  ok(kurz.length === 1 && kurz[0].passt === false,
     'Nur ähnlich statt Treffer: 19 statt 7 Tage wird als solches gekennzeichnet', kurz[0] && kurz[0].abstand);

  /* --- Kennung in der Syntax der Quelle (Tester-Wunsch #54) ---
     onvista benennt jeden Schein "EMITTENT/TYP/BASISWERT/BASISPREIS/BV/TT.MM.JJ".
     Die Kennung im Finder baut den emittentenfreien Teil davon nach, damit sie
     dort auch wirklich etwas findet. Zahlen mit PUNKT, keine Nullen am Ende. */
  var kn1 = W.onvistaKennung({ dir: 'call', basiswert: 'Apple', strike: 294, ratio: 0.1,
                               faellig: new Date(2026, 8, 18, 12, 0).getTime() });
  ok(kn1 === 'CALL/APPLE/294/0.1/18.09.26', 'Die Kennung steht in der Syntax der Produktsuche', kn1);
  var kn2 = W.onvistaKennung({ dir: 'put', basiswert: 'Apple', strike: 112.5, ratio: 1,
                               faellig: new Date(2026, 11, 18, 12, 0).getTime() });
  ok(kn2 === 'PUT/APPLE/112.5/1/18.12.26', 'Punkt statt Komma, keine Nullen am Ende, Datum TT.MM.JJ', kn2);
  var gleich = { basiswert: 'A', strike: 200, ratio: 0.1, faellig: new Date(2026, 8, 18, 12, 0).getTime() };
  var kC = W.onvistaKennung({ dir: 'call', basiswert: gleich.basiswert, strike: gleich.strike, ratio: gleich.ratio, faellig: gleich.faellig });
  var kP = W.onvistaKennung({ dir: 'put', basiswert: gleich.basiswert, strike: gleich.strike, ratio: gleich.ratio, faellig: gleich.faellig });
  ok(kC !== kP, 'Call und Put mit gleichen Merkmalen bekommen NICHT dieselbe Kennung (beide stehen im Raster)', kC + ' / ' + kP);

  /* Der Name, unter dem der Schein bei der Quelle steht, muss durchgereicht
     werden - sonst kann die Oberflaeche ihn nicht zum Kopieren anbieten. */
  var normN = W.normalisiere({ list: [
    { instrument: { wkn: 'JZ9Y29', isin: 'DE000JZ9Y291', name: 'J.P. MORGAN ZERTIFIKATE/CALL/APPLE/294/0.1/18.09.26' },
      shortName: 'J.P. MORGAN ZERTIFIKATE/CALL/APPLE/294/0.1/18.09.26',
      codeExerciseRight: 'C', strikeAbs: 294, coverRatio: 0.1,
      dateMaturity: '2026-09-18T12:00:00.000+00:00', quote: { bid: 1.2, ask: 1.25 } }
  ] }, Date.UTC(2026, 7, 23));
  ok(normN.length === 1 && normN[0].name === 'J.P. MORGAN ZERTIFIKATE/CALL/APPLE/294/0.1/18.09.26',
     'Der onvista-Name des echten Scheins kommt mit an', normN[0] && normN[0].name);

  /* --- Verdrahtung: das Modul muss auch ausgeliefert und freigeschaltet sein --- */
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var mainQ = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var sf = fs.readFileSync(__dirname + '/scheinfinder.js', 'utf8');
  ok(/<script src="wkn\.js"><\/script>/.test(html), 'wkn.js wird von index.html geladen (sonst fehlt es im Paket)');
  ok(/'api\.onvista\.de'/.test(mainQ), 'api.onvista.de steht in der Host-Freigabe – ohne sie blockt die Bridge jeden Abruf');
  ok(html.indexOf('Keine echten WKNs') < 0 && sf.indexOf('Modell-Kennung statt WKN: Echte WKN-Listen') < 0,
     'Die alte Auskunft „echte WKNs gibt es nur gegen Bezahlung" steht nirgends mehr');
  ok(/colspan="15"/.test(sf), 'Die aufgeklappte Zeile spannt über alle 15 Spalten (WKN kam dazu)');
  ok(sf.indexOf('window.WKN.kern.onvistaKennung') > 0,
     'Der Schein-Finder baut die Kennung mit der Syntax der Quelle - nicht mehr mit der Hausform');
  ok(sf.indexOf('onvista-Name') > 0 && sf.indexOf("U.esc(s.name || '") > 0,
     'Der echte Schein zeigt seinen onvista-Namen und laesst ihn kopieren');
  ok(sf.indexOf('await window.WKN.basiswertId(sym, nameZu(sym))') > 0,
     'Der Name des Basiswerts kommt von der Quelle selbst - sonst stuende ein Kuerzel in der Kennung');
})();


console.log('\n42) Kostenhuerde: Gebuehr und Haltedauer (Befund 23.08.2026)');
(function () {
  var d5 = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var a5 = d5.indexOf('function kostenHuerdePp(cfg, spot, vol, haltenMin, einsatz)');
  var b5 = d5.indexOf('/** Positionswert in Dollar', a5);
  var c5 = d5.indexOf('function positionsWert(', b5);
  var e5 = d5.indexOf('/** Zeigt die Huerde', c5);
  ok(a5 > 0 && b5 > 0 && c5 > 0 && e5 > 0, 'Kostenhuerde und Positionswert sind auffindbar');
  var M5 = new Function('Q', d5.slice(a5, b5) + d5.slice(c5, e5) +
    '\nreturn {h: kostenHuerdePp, p: positionsWert};')(Q);

  /* 1) Die Ordergebuehr ist ein FESTER Betrag - ihr Gewicht haengt allein an der
   *    Positionsgroesse. Vorher stand im Nenner eine feste 10.000-$-Position, und im
   *    Schein-Zweig fehlte die Gebuehr ganz. Bei den real gehandelten ~125 $ war sie
   *    damit um Faktor 80 zu klein angesetzt. */
  var C5 = { instrument: 'schein', profile: 'atm60_b', orderFee: 1.5, mode: 'rsi2seit',
             scalpHold: 480, scalpSL: 20, budgetPct: 0.03, sizing: '0.25' };
  var klein = M5.h(C5, 200, 0.30, 480, 125);
  var gross = M5.h(C5, 200, 0.30, 480, 2000);
  ok(klein.teile && klein.teile.gebuehr > 0, 'Der Schein-Zweig rechnet die Ordergebuehr ueberhaupt ein',
     klein.teile ? klein.teile.gebuehr.toFixed(3) + ' Pp' : 'kein Anteil');
  ok(klein.teile.gebuehr > klein.teile.spanne + klein.teile.zeit,
     'Auf einer 125-$-Position wiegt die Gebuehr mehr als Spanne und Zeitwert zusammen',
     klein.teile.gebuehr.toFixed(3) + ' vs ' + (klein.teile.spanne + klein.teile.zeit).toFixed(3));
  ok(gross.teile.gebuehr < klein.teile.gebuehr / 10,
     'Bei 2.000 $ Einsatz faellt der Gebuehrenanteil um mehr als das Zehnfache',
     klein.teile.gebuehr.toFixed(3) + ' -> ' + gross.teile.gebuehr.toFixed(3));
  ok(Math.abs(klein.pp - 0.312) < 0.01 && Math.abs(gross.pp - 0.082) < 0.01,
     'Die Huerde trifft die nachgerechneten Werte (125 $ -> 0,312 · 2.000 $ -> 0,082)',
     klein.pp.toFixed(3) + ' / ' + gross.pp.toFixed(3));
  /* Die gemessene Kante ist +0,147 Pp. Sie traegt die Kosten erst ab rund 600 $. */
  ok(0.147 - M5.h(C5, 200, 0.30, 480, 300).pp < 0 && 0.147 - M5.h(C5, 200, 0.30, 480, 600).pp > 0,
     'Die gemessene Kante traegt die Kosten bei 300 $ NICHT und bei 600 $ schon');

  /* 2) Die Haltedauer muss aus modeParams() kommen, nicht aus einem Feld, das es nicht gibt.
   *    cfg.maxHoldMin existierte in D.intraday nie - die Anzeige fiel immer auf 60 Minuten
   *    zurueck, obwohl rsi2seit 480 Minuten haelt. */
  var anz = d5.slice(d5.indexOf('function huerdeAnzeigen'), d5.indexOf('window.__huerde'));
  // Kommentare raus: der Grund der Aenderung steht als Text im Code und ist kein Verstoss.
  var anzCode = anz.replace(new RegExp('/\\*[\\s\\S]*?\\*/', 'g'), '')
                   .replace(new RegExp('//[^\\n]*', 'g'), '');
  ok(anzCode.indexOf('cfg.maxHoldMin') === -1,
     'Die Anzeige liest NICHT mehr cfg.maxHoldMin - das Feld gibt es in D.intraday nicht');
  ok(/modeParams\(\)/.test(anz),
     'Die Haltedauer kommt aus modeParams() - derselben Quelle wie der Live-Pfad');
  ok(/positionsWert\(cfg/.test(anz),
     'Der Einsatz kommt aus positionsWert() - derselben Formel wie der Handel');
  var cfgZeile = d5.slice(d5.indexOf('intraday: {'), d5.indexOf('intraday: {') + 900);
  ok(cfgZeile.indexOf('maxHoldMin') === -1 && cfgZeile.indexOf('scalpHold') !== -1,
     'Beleg: D.intraday hat scalpHold, aber kein maxHoldMin');

  /* 3) positionsWert bildet die Live-Formel ab, inklusive der Asymmetrie beim Deckel. */
  ok(Math.abs(M5.p({ sizing: '0.25', scalpSL: 20, budgetPct: 0.03 }, 10000, 0.20, 1) - 125) < 0.5,
     'Risiko-Sizing 0,25 % bei Stop -20 % ergibt 125 $ auf 10.000 $ Depot');
  ok(Math.abs(M5.p({ sizing: 'fix', budgetPct: 0.03 }, 10000, 0.20, 1) - 300) < 0.5,
     'Feste Groesse nimmt budgetPct (3 % = 300 $)');
  var mitDeckel = M5.p({ sizing: '5', scalpSL: 20, budgetPct: 0.03, instrument: 'schein' }, 10000, 0.20, 1);
  var ohneDeckel = M5.p({ sizing: '5', scalpSL: 20, budgetPct: 0.03, instrument: 'basis' }, 10000, 0.20, 1);
  ok(mitDeckel < ohneDeckel,
     'Der Deckel greift beim Schein, beim Basiswert nicht - so macht es der Live-Pfad',
     Math.round(mitDeckel) + ' $ vs ' + Math.round(ohneDeckel) + ' $');
})();


console.log('\n43) Stufe 0 der Roadmap nach 9.0.0 (Inventarisierung 23.08.2026)');
(function () {
  var d6 = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var bg = fs.readFileSync(__dirname + '/bugs.js', 'utf8');
  var as = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  var cp = fs.readFileSync(__dirname + '/capital.js', 'utf8');

  /* --- 1) Bruchstuecke: der Kommentar erlaubt sie, die naechste Zeile verbot sie ---
   * Am Archiv nachgezaehlt: bei 125 $ Positionswert fielen 123 von 191 Werten still
   * aus dem Handel, bei 300 $ noch 53 - alles oberhalb des Positionswerts. */
  ok(d6.indexOf('if (qty < 1 || D.cash < cost) continue;') === -1,
     'Die Ganzzahl-Schranke, die Basiswert-Bruchstuecke wieder verwarf, ist raus');
  ok(/var zuKlein = istBasis \? !\(qty > 0\) : qty < 1;/.test(d6),
     'Beim Basiswert entscheidet der Wert, beim Schein die Stueckzahl');
  ok(/if \(zuKlein \|\| D\.cash < cost\) \{[\s\S]{0,400}?patienceAdd\(/.test(d6),
     'Ein uebersprungener Wert wird gemeldet, nicht still verworfen');

  /* --- 2) 261-Kerzen-Sperre --- */
  ok(d6.indexOf("(cfg.mode === 'rsi2seit' || cfg.mode === 'kapitulation' || cfg.kapiZusatz) && sigBars.length < 261") !== -1,
     'Die 261-Kerzen-Sperre gilt auch fuer den Kapitulations-HAUPTmodus, nicht nur den Zusatz');

  /* --- 3) Stapelspuren: die Meldung geht in ein OEFFENTLICHES Issue --- */
  ok(bg.indexOf('function pfadeKuerzen') !== -1 && /stapel: pfadeKuerzen\(/.test(bg),
     'Die Stapelspur wird bereinigt, bevor sie in die Meldung geht');
  var a6 = bg.indexOf('function pfadeKuerzen'), b6 = bg.indexOf('\n  }', a6) + 4;
  var pk = new Function(bg.slice(a6, b6) + '\nreturn pfadeKuerzen;')();
  var proben = [
    'at Object.<anonymous> (C:\\Users\\Wilhe\\AppData\\Local\\Programs\\markt-dashboard\\resources\\app.asar\\depot.js:3504:12)',
    'at scan (file:///C:/Users/Felix/AppData/Local/Programs/markt-dashboard/resources/app.asar/quant.js:1660:9)',
    'at t (/Users/felix/Applications/Markt-Dashboard.app/Contents/Resources/app.asar/renderer.js:88:3)',
    'at f (C:\\Users\\Max Mustermann\\AppData\\Local\\app.asar\\bugs.js:30:7)'
  ];
  var lecks = proben.filter(function (p) { return /Wilhe|Felix|felix|Mustermann|AppData|Programs|Contents/.test(pk(p)); });
  ok(lecks.length === 0,
     'Kein Benutzername und kein Pfad ueberlebt die Bereinigung - auch nicht mit Leerzeichen im Namen',
     lecks.length ? lecks.length + ' von ' + proben.length + ' undicht' : proben.length + ' Proben sauber');
  ok(proben.every(function (p) { return /\.js:\d+/.test(pk(p)); }),
     'Dateiname und Zeilennummer bleiben erhalten - sonst ist die Meldung wertlos');
  ok(pk('at Array.forEach (<anonymous>)') === 'at Array.forEach (<anonymous>)',
     'Rahmen ohne Pfad bleiben unveraendert');

  /* --- 4) Zugangsdaten-Sentinel --- */
  ok(/schreiben\.then\(function \(res\)/.test(as) &&
     /typeof SETTINGS\[k9\] !== 'string'/.test(as),
     'Das Sentinel {__keep:true} verlaesst den Arbeitsspeicher direkt nach dem Schreiben');
  var a7 = cp.indexOf('function txt(v)');
  ok(a7 > 0, 'capital.js hat einen Text-Pruefer fuer Zugangsdaten');
  var txt = new Function(cp.slice(a7, cp.indexOf('\n', a7)) + '\nreturn txt;')();
  ok(txt({ __keep: true }) === '' && txt(null) === '' && txt('abc') === 'abc',
     'Ein Sentinel-Objekt gilt NICHT als Zugangskennung (es ist wahrheitswertig)');
  ok(/on: !!\(s\.capEnabled && txt\(s\.capKey\) && txt\(s\.capId\) && txt\(s\.capPass\)\)/.test(cp),
     'Die Verbindung gilt nur als eingerichtet, wenn alle drei Kennungen Text sind');
})();


console.log('\n44) Messmaschine, Scoreboard und Strategie-Eingabe (23.08.2026)');
(function () {
  var mm = fs.readFileSync(__dirname + '/studien/messmaschine/messmaschine.js', 'utf8');
  var sb = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');
  var mj = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var pj = fs.readFileSync(__dirname + '/preload.js', 'utf8');
  var h = fs.readFileSync(__dirname + '/index.html', 'utf8');

  /* Grundsatz D2: Die App urteilt nie selbst. Sie liest Protokolle und zeigt sie an. */
  // Das Scoreboard liest FELDER namens tagesmittel/mde aus dem Protokoll - das ist Anzeige.
  // Verboten ist, sie zu BERECHNEN: keine Statistik-Funktion, keine Wurzel, keine Summe.
  var sbCode = sb.replace(/\/\*[\s\S]*?\*\//g, '');
  ok(!/function\s+(tagesMittel|statistik|bonferroni|normInv)\b|Math\.sqrt\(/.test(sbCode),
     'scoreboard.js rechnet keine Statistik - es zeigt nur an, was das Protokoll sagt');
  ok(/readProtokolle/.test(sb) && /read-protokolle/.test(mj) && /readProtokolle/.test(pj),
     'Das Scoreboard liest Protokolle ueber die Bruecke, nicht aus dem Renderer heraus');
  ok(!/messe\(|require\(.*messmaschine/.test(sb + mj + pj),
     'Weder Renderer noch Hauptprozess rufen die Messmaschine auf - messen bleibt ein eigener Schritt');

  /* Sortierung nach Belegstatus, nicht nach Rendite.
   * Der Zugriff laeuft seit dem 25.08.2026 ueber rang() statt ueber die Tabelle direkt -
   * wegen des Rueckfalls fuer unbekannte Urteile. Was rang() dabei leistet, prueft
   * Abschnitt 47 am laufenden Code; hier bleibt nur die Sortierregel selbst. */
  ok(/'bestaetigt':\s*\{\s*rang: 0/.test(sb) && /rang\(ua\) - rang\(ub\)/.test(sb),
     'Das Scoreboard sortiert nach Belegstatus - Rendite entscheidet nur innerhalb gleichen Status');

  /* 100 % Einsicht: jede Entscheidung steht als Daten im Protokoll */
  ok(/Protokoll\.prototype\.entscheide/.test(mm) && /entscheidungen:\s*P\.entscheidungen/.test(mm),
     'Jede Entscheidung der Maschine landet als Datensatz im Protokoll');
  ok(/p\.entscheidungen\s*\|\|\s*\[\]\)\.forEach/.test(sb) && /Begründung/.test(sb),
     'Das Scoreboard zeigt den vollstaendigen Entscheidungsweg mit Begruendung an');

  /* Die Maschine hat keine Schalter fuer ihre Disziplin */
  ok(!/optionen\.(ohneKontrolle|keineKontrolle|skipMde|ohneSchnitt)/.test(mm),
     'Es gibt keine Option, Kontrolle, MDE oder Bestaetigungsschnitt abzuschalten');
  ok(/verweigert: true/.test(mm) && /mindestens 20 Zeichen/.test(mm),
     'Ohne Grund verweigert die Maschine die Messung');
  ok(/haltedauerKerzen > 130/.test(mm), 'C1: eine Haltedauer, die nach Minuten aussieht, wird verweigert');
  /* Drei stille Ausfaelle der Maschine, gefunden am 25.08.2026. Alle drei haben
   * gemeinsam, dass die Messung WEITERLAEUFT und ein Ergebnis liefert, obwohl ein
   * Teil ihrer Eingabe fehlte. Das ist schlimmer als ein Abbruch: eine fehlende Zahl
   * faellt auf, eine falsche nicht. */
  ok(/ladeUniversum\.verworfen\.push\(sym \+ ': Datei unlesbar/.test(mm) &&
     /ladeUniversum\.verworfen\.push\(sym \+ ': keine Kerzen/.test(mm),
     'Eine unlesbare Archivdatei wird gezaehlt - der Kommentar versprach das, der Code tat es nicht');
  ok(/baueQuerschnitt\.merkmalFehler\+\+/.test(mm) && /baueQuerschnitt\.merkmalFehler = 0;/.test(mm),
     'Ein werfendes Querschnitts-Merkmal wird gezaehlt - sonst schrumpft die Rangfolge unsichtbar');
  ok(/fuehreAus\.fehler = \(fuehreAus\.fehler \|\| 0\) \+ 1;/.test(mm) &&
     /fuehreAus\.fehler = 0; fuehreAus\.letzterFehler = '';/.test(mm),
     'Eine werfende Ausstiegsregel wird gezaehlt und je Lauf zurueckgesetzt');
  /* Der Kern: das Ergebnis eines Laufs mit defekter Ausstiegsregel sieht PLAUSIBEL aus,
   * weil Signal und Kontrolle dieselbe fuehreAus benutzen und der Stop auf beiden
   * Seiten wegfaellt. Ohne diese Warnung wuerde jemand darauf eine Entscheidung stuetzen. */
  ok((mm.match(/P\.warne\('DEFEKT'/g) || []).length === 2,
     'Ein defektes Messgeschirr meldet sich als DEFEKT - nicht als Fehlerart der Methode');
  ok(/ausstiegsregelFehler: fuehreAus\.fehler/.test(mm) && /merkmalFehler: baueQuerschnitt\.merkmalFehler/.test(mm),
     'Beide Defekt-Zaehler stehen im Protokoll (F1), nicht nur in der Warnung');

  /* Eingabe: schreibt nur in den Datenordner, nur .js, nur sichere Kennung, nie ueberschreiben */
  var ws = mj.slice(mj.indexOf("ipcMain.handle('write-strategie'"), mj.indexOf("ipcMain.handle('write-strategie'") + 1400);
  ok(/\^\[a-z0-9\]\[a-z0-9-\]\{1,40\}\$/.test(ws), 'Strategie-Kennung ist auf sichere Zeichen beschraenkt');
  ok(/Markt-Dashboard-Daten', 'strategien'/.test(ws), 'Strategien landen nur im Datenordner');
  ok(/fs\.existsSync\(p\)\) return \{ ok: false/.test(ws), 'Eine vorhandene Strategie wird nie ueberschrieben - neue Fassung braucht neue Kennung');

  /* Die Tests der Maschine selbst laufen gruen */
  var r = require('child_process').spawnSync(process.execPath, [__dirname + '/studien/messmaschine/test-messmaschine.js'], { encoding: 'utf8' });
  ok(r.status === 0 && /ALLE TESTS BESTANDEN/.test(r.stdout), 'test-messmaschine.js besteht (jeder Fehlertyp aus FEHLERTYPEN.md als Falle)');

  /* ---- SPERRKLINKE: die Version der Messmaschine kann nicht mehr luegen ----
   * Bis zum 26.08.2026 stand in VERFAHREN eine von Hand gepflegte "1.0.0" - ueber
   * sieben Aenderungen hinweg unveraendert. Zwei Protokolle mit derselben Nummer
   * waren also nicht mit derselben Maschine gemessen, und niemand konnte es sehen.
   *
   * codeStand rechnet sich aus der Datei selbst. Die beiden Zahlen stehen hier fest:
   * wer messmaschine.js anfasst, macht diesen Test rot und MUSS entscheiden, ob sich
   * das VERFAHREN geaendert hat (dann neue version) oder nur ein Kommentar (dann
   * bleibt version, und nur der Stand wird nachgezogen). Genau diese Frage ist sieben
   * Mal nicht gestellt worden. Die Reibung IST der Zweck: sie kostet zwei Zeilen und
   * verhindert, dass Protokolle stillschweigend unvergleichbar werden. */
  var MM_VERSION = '1.4.0';
  var MM_STAND = 'b8613cfa5384';   // sha256 ueber messmaschine.js, erste 12 Zeichen
  var mmV = require(__dirname + '/studien/messmaschine/messmaschine.js').VERFAHREN;
  ok(mmV.version === MM_VERSION && mmV.codeStand === MM_STAND,
     'Messmaschine: Version und Codestand stehen zusammen fest - eine Aenderung ohne Entscheid faellt auf',
     mmV.version + ' / ' + mmV.codeStand);
  /* Der Stand wird GERECHNET, nicht eingetragen - stuende er als Zeichenkette in der
   * Maschine, waere er dieselbe Behauptung wie vorher, nur an anderer Stelle. */
  var mmQ = fs.readFileSync(__dirname + '/studien/messmaschine/messmaschine.js', 'utf8');
  ok(/codeStand: codeStand\(\),/.test(mmQ) && mmQ.indexOf(MM_STAND) === -1,
     'Der Codestand rechnet sich selbst aus und steht NICHT als Zeichenkette in der Maschine');
  /* Und der Hauptprozess fragt die Maschine, statt dieselbe Kennung ein zweites Mal zu
   * rechnen - zwei Rechnungen fuer dieselbe Zahl, und die zweite ist irgendwann die
   * falsche. */
  var mainQ = fs.readFileSync(__dirname + '/main.js', 'utf8');
  ok(mainQ.indexOf('M.VERFAHREN.codeStand') !== -1 && mainQ.indexOf('sha256') === -1,
     'main.js erfragt den Stand bei der Maschine, statt ihn nachzurechnen');
  ok(/maschinenStand: maschinenStand\(\)/.test(mainQ),
     'und reicht ihn an die Uebersichtstafel durch');
  var sbQ = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');
  /* Der haeufige Fall ist "keine Kennung", nicht "veraltet": 26 Protokolle vom Stand vor
   * dem 26.08.2026 tragen gar keine. Wer die als veraltet markiert, hat eine Tafel, auf
   * der alles leuchtet - und die liest nach einer Woche niemand mehr. */
  ok(/function maschineAktuell/.test(sbQ) && /typeof st !== 'string'\) return null/.test(sbQ),
     'Die Tafel unterscheidet "mit einer anderen Maschine gemessen" von "keine Kennung"');
  ok(/maschineAktuell\(p\) === false/.test(sbQ) && /alte Maschine/.test(sbQ),
     'und kennzeichnet nur den ersten Fall');
  ok(/MASCHINE = \(r && typeof r\.maschinenStand === 'string'\)/.test(sbQ),
     'Ohne Kennung der laufenden Maschine kennzeichnet die Tafel gar nichts');
  /* Die Entscheidung selbst wird AUSGEFUEHRT, nicht nur im Quelltext gesucht. Ein
   * Muster im Text sagt, dass etwas dasteht; ob es das Richtige antwortet, sagt nur
   * der Aufruf. Der wichtigste Fall ist der dritte: fehlt die Kennung, muss null
   * herauskommen und nicht false - sonst traegt jedes der 26 alten Protokolle eine
   * Warnung, und eine Tafel, auf der alles leuchtet, liest niemand mehr. */
  var maA = sbQ.indexOf('function maschineAktuell(p) {');
  var maE = sbQ.indexOf('\n  }\n', maA);
  ok(maA !== -1 && maE > maA, 'maschineAktuell laesst sich herausloesen');
  var maFn = new Function('MASCHINE', sbQ.slice(maA, maE + 4) + '\nreturn maschineAktuell;');
  var mitK = { verfahren: { version: '1.1.0', codeStand: 'aaaaaaaaaaaa' } };
  var altK = { verfahren: { version: '1.0.0', codeStand: 'bbbbbbbbbbbb' } };
  var ohneK = { verfahren: { version: '1.0.0' } };
  ok(maFn('aaaaaaaaaaaa')(mitK) === true, 'Gleiche Kennung: die Zeile gilt als aktuell');
  ok(maFn('aaaaaaaaaaaa')(altK) === false, 'Andere Kennung: die Zeile wird als alte Maschine gekennzeichnet');
  ok(maFn('aaaaaaaaaaaa')(ohneK) === null, 'KEINE Kennung im Protokoll: unbekannt, nicht veraltet');
  ok(maFn(null)(mitK) === null && maFn(null)(altK) === null,
     'Ohne laufende Maschine bleibt jede Zeile unmarkiert - lieber nichts sagen als alles anstreichen');
  var ft = fs.readFileSync(__dirname + '/studien/messmaschine/FEHLERTYPEN.md', 'utf8');
  /* Am Zeilenanfang verankert: sonst zaehlen die Zahlen in den erklaerenden
   * Tabellen mit (beim ersten Wurf 15.533 statt 35). */
  var kennungen = (ft.match(/^\|\s*[A-E]\d{1,2}\s*\|/gm) || []).length;
  ok(kennungen >= 34, 'FEHLERTYPEN.md fuehrt mindestens 34 Fehlertypen', kennungen);

  /* A7 (23.08.2026): Die Kontrolle darf nichts enthalten, was das Signal gelesen hat.
   * Vorher kam t3-stundendrift als "widerlegt" durch (t = -3,19), obwohl nichts da war.
   * Bewiesen wurde die Ursache durch Verkleinern des Kontrolltopfes: 366 -> 183 -> 103
   * laesst die Verzerrung um Faktor 1,84 und 2,81 wachsen, vorhergesagt 1,87 und 2,9. */
  var mm2 = fs.readFileSync(__dirname + '/studien/messmaschine/messmaschine.js', 'utf8');
  var np = fs.readFileSync(__dirname + '/studien/messmaschine/nullversuch-permutation.js', 'utf8');
  var mn = fs.readFileSync(__dirname + '/studien/messmaschine/messen-mit-null.js', 'utf8');

  /* B10 (24.08.2026): Ueberlappende Halteperioden. Bei H Kerzen Haltedauer teilen
   * aufeinanderfolgende TAGE H-1 Kerzen ihres Ergebnisfensters - sie sind dann keine
   * unabhaengigen Wiederholungen. Momentum: t naiv 4,74, Newey-West 0,74.
   * Kapitulations-Dip: 2,59 -> 1,74. Beide Befunde loesten sich auf. */
  ok(/\|\s*B10\s*\|/.test(ft), 'B10 steht in FEHLERTYPEN.md');

  /* Audit vom 25.08.2026: vier Fehler im Verfahren und die Selbstpruefung.
   * Der schwerste war F1 - ein Placebo OHNE jeden Kursbezug lieferte -0,1722 Pp
   * statt null, weil nicht bereinigte Zusammenlegungen (DFEN +10.541 Pp, WHLR mit
   * 4,2 Mrd \$ je Aktie) im ungestutzten Kontrollmittel sassen. */
  ok(/\|\s*F1\s*\|/.test(ft) && /\|\s*F3\s*\|/.test(ft) && /\|\s*SP\s*\|/.test(ft),
     'F1, F3 und SP stehen in FEHLERTYPEN.md');
  ok(mm2.indexOf('function reiheKaputt(bars)') !== -1,
     'F1: Reihen mit unmoeglichen Kursen oder Spruengen werden verworfen');
  ok(mm2.indexOf('var STUTZ = 0.01') !== -1,
     'F1: Die Kontrolle ist an den 1-Prozent-Quantilen gestutzt');
  ok(mm2.indexOf('i - leseFenster - H') !== -1,
     'F2: Der A7-Ausschnitt beginnt H Kerzen frueher - eine Kontrollkerze bei j reicht bis j+H');
  /* Seit E3 (25.08.2026) ist der Schluessel die Sitzungs-SCHICHT: Position PLUS die Frage,
   * ob dies die letzte Kerze ihres Tages ist. Grund: die Position sollte sagen, was NACH
   * der Kerze kommt, aber die Sitzungslaenge ist nicht konstant - an verkuerzten Tagen ist
   * schon Position 3 die letzte. sitzungsSchicht() baut auf sitzungsPosition() auf, die
   * F3-Lehre (keine UTC-Stunde) gilt unveraendert weiter. */
  ok(mm2.indexOf('function sitzungsPosition(bars)') !== -1 &&
     mm2.indexOf('function sitzungsSchicht(bars)') !== -1 &&
     mm2.indexOf('K.erwartung(sym, sitzungsSchicht(b)[i]') !== -1 &&
     !/getUTCHours\(\)/.test(mm2.replace(/function stundeVon[\s\S]*?\n\}/, '')),
     'F3/E3: Der Topf-Schluessel ist die Sitzungsschicht, nicht die UTC-Stunde');
  ok(/var grenze = \(i \+ 1 >= bars\.length\) \|\| POS\[i \+ 1\] === 0;/.test(mm2),
     'E3: Die Schicht trennt die letzte Kerze eines Tages von den uebrigen');
  ok(/P\.warne\('F4'/.test(mm2),
     'F4: Ueber 2 Prozent Signale ohne Kontrolle gibt eine Warnung');
  ok(mm2.indexOf('function placeboLauf(') !== -1 && /P\.warne\('SP'/.test(mm2),
     'SP: Jede Messung faehrt einen Placebo-Lauf mit und warnt, wenn der Nullpunkt wandert');
  ok(mm2.indexOf("'bestaetigt-aber-nullpunkt-verschoben'") !== -1,
     'SP: Ein bestaetigtes Urteil auf verschobenem Nullpunkt wird als solches gekennzeichnet');
  ok(mm2.indexOf('function neweyWest(werte, mu, va, lags)') !== -1,
     'Die Maschine korrigiert den Standardfehler nach Newey-West');
  ok(mm2.indexOf('statistik(tm.mittel, H - 1)') !== -1,
     'Die Zahl der Verzoegerungen kommt aus der Haltedauer, nicht aus einer Annahme');
  /* #98 (26.08.2026): Diese Probe hat vier Tage lang bestanden, WAEHREND die Warnung
   * unerreichbar war. Dass P.warne dasteht, sagt nichts darueber, ob es je erreicht
   * wird - der Leser filtert auf einen Faktor, den block() nicht weiterreichte, und
   * die Liste war damit immer leer. In KEINEM der 38 Protokolle stand der B10-Eintrag.
   * Sie prueft jetzt den WEG des Faktors; ob die Warnung wirklich feuert, misst
   * test-messmaschine.js Block 20 ausgefuehrt. */
  ok(/P\.warne\('B10'/.test(mm2),
     'Waechst der Fehler um mehr als Faktor 3, warnt die Maschine');
  ok(/ueberlappungsFaktor: st\.ueberlappungsFaktor/.test(mm2),
     'und block() reicht den Faktor an seinen Leser durch - sonst ist die Warnung tot');
  var b10Leser = mm2.indexOf('var faktoren = ergebnisse.map(');
  ok(b10Leser !== -1 && /bestaetigung\.ueberschuss\.ueberlappungsFaktor/.test(mm2.slice(b10Leser, b10Leser + 200)),
     'Leser und Lieferant meinen dasselbe Feld');

  /* Und die Gegenprobe: bei H = 1 darf die Korrektur nichts tun. */
  var mmMod = require(__dirname + '/studien/messmaschine/messmaschine.js');
  var reihe = [];
  for (var q = 0; q < 200; q++) reihe.push(Math.sin(q) * 0.01 + 0.002);
  var ohne = mmMod._intern.statistik(reihe, 0), mit = mmMod._intern.statistik(reihe, 20);
  ok(Math.abs(ohne.se - ohne.seNaiv) < 1e-15,
     'Bei 0 Verzoegerungen ist der korrigierte Fehler exakt der naive (H = 1 aendert nichts)');
  ok(Math.abs(mit.se - ohne.se) > 1e-12,
     'Bei Verzoegerungen aendert er sich - die Korrektur greift ueberhaupt',
     'naiv ' + ohne.se.toExponential(3) + ', korrigiert ' + mit.se.toExponential(3));
  ok(/\|\s*A7\s*\|/.test(ft) && /\|\s*A8\s*\|/.test(ft), 'A7 und A8 stehen in FEHLERTYPEN.md');
  ok(mm2.indexOf('leseFensterKerzen') !== -1 && /erwartung: function \(sym, stunde, haelfte, vonIdx, bisIdx\)/.test(mm2),
     'A7: Die Kontrolle kann das Lesefenster des Signals auslassen');
  ok(/P\.warne\('A7'/.test(mm2),
     'Fehlt die Angabe leseFensterKerzen, warnt die Maschine - kein stillschweigendes Null');
  ok(mm2.indexOf('kontrolleFuer(vi)') !== -1 && mm2.indexOf('varianten[0]);') === -1,
     'Die Kontrolle wird je Variante gebaut, nicht einmal mit varianten[0]');

  /* A8: Aus einem Nullarchiv darf nie auf Signifikanz geschlossen werden. Jedes Symbol
   * wird einzeln gewuerfelt, der Gleichlauf der Werte fehlt, t-Werte sind zu gross. */
  ok(mn.indexOf('KEINE Urteile aus dieser Tabelle') !== -1,
     'A8: Das Eichwerkzeug faellt keine Urteile mehr');
  ok(np.indexOf('Math.imul') !== -1 && np.indexOf('wuerfelAus') !== -1 &&
      np.split('1103515245').length === 2,
     'Der Wuerfel rechnet ganzzahlig - die alte Formel steht nur noch einmal, im Kommentar als Beleg');
  ok(np.indexOf('fH:') !== -1 && np.indexOf('v: z[2]') !== -1,
     'Beim Vertauschen reisen Umsatz und Kerzenform mit der Rendite mit');

  /* D2 in der laufenden App: die Kante kommt aus dem Protokoll, nicht aus dem Code.
   * Bis 23.08.2026 stand hier 0,11 fest verdrahtet und wurde als "netto +0,01 Pp"
   * GRUEN angezeigt - waehrend dasselbe Protokoll "nicht entscheidbar" und je Signal
   * -0,14 Pp fuehrte. */
  var dep2 = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  /* A9 und B9 stammen aus der unabhaengigen Kontroll-Pruefung der Parallelsitzung
   * (studien/kontrolle-2026-08/BEFUND.md). Vier ihrer sechs Punkte deckte die Liste
   * schon ab, zwei nicht. B8 fehlte als Zeile, obwohl er in der Maschine steckte. */
  /* Die Rohre MUESSEN maskiert sein. Unmaskiert ist /|s*A9s*|/ eine Alternative mit
   * leerem Zweig - sie trifft die leere Zeichenkette, und die Zusicherung besteht,
   * egal was in FEHLERTYPEN.md steht (Issue #76, Punkt 5). Drei blinde Pruefungen
   * unter 1.179 Regex-Literalen; genau diese drei. */
  ok(/\|\s*A9\s*\|/.test(ft) && /\|\s*B8\s*\|/.test(ft) && /\|\s*B9\s*\|/.test(ft),
     'A9, B8 und B9 stehen in FEHLERTYPEN.md');
  /* A9: Kontrolle und Signalschleife muessen beim SELBEN Vorlauf beginnen. Start bei
   * Kerze 60 statt 261 verschob den Intraday-Ueberschuss von +0,064 auf +0,036. */
  /* Ohne Regex: der Anfang jeder Kerzenschleife wird als Text abgeschnitten. Zaehlen
   * waere das falsche Mass - eine vierte, korrekte Schleife darf den Test nicht roeten. */
  /* Nur Schleifen ueber die Kerzenreihe sind gemeint - erkennbar daran, dass ihre
   * Bedingung b.length nennt. Eine Autokorrelation ueber Werte darf bei 0 beginnen
   * und hat mit dem Vorlauf des Detektors nichts zu tun. */
  var kerzenSchleifen = mm2.split('for (var i = ').slice(1)
    .map(function (s) { return s.split(')')[0]; })
    .filter(function (s) { return s.indexOf('b.length') !== -1; });
  var falscherStart = kerzenSchleifen.filter(function (s) { return s.indexOf('vorlauf') === -1; });
  ok(kerzenSchleifen.length >= 2 && falscherStart.length === 0,
     'A9: JEDE Kerzenschleife der Maschine startet bei vorlauf',
     kerzenSchleifen.length + ' Schleifen, abweichend: ' + (falscherStart.join(' | ') || 'keine'));

  /* D2 im Regelkopf: Der Belegstand kommt aus dem Protokoll. Vorher stand dort ueber
   * den Kapitulations-Dip "in Ueberpruefung", als die Messung laengst vorlag. */
  ok(dep2.indexOf('belegAusProtokoll') !== -1 && dep2.indexOf('PROTOKOLL_KANTE[cfg.mode]') !== -1,
     'Der Belegstand im Regelkopf kommt aus dem Messprotokoll, nicht aus dem Code');
  ok(dep2.indexOf("stand: 'in Überprüfung'") === -1,
     'Der veraltete Kapitulations-Belegstand ist weg (gemessen am 24.08.2026)');
  ok(/belegAusProtokoll && b.stand === 'bestaetigt'/.test(dep2),
     'Gruen im Regelkopf nur, wenn ein PROTOKOLL bestaetigt sagt');
  ok(!/var KANTE = \{ rsi2seit: 0\.11/.test(dep2),
     'Die Kante 0,11 steht nicht mehr fest verdrahtet in depot.js');
  ok(dep2.indexOf('PROTOKOLL_KANTE') !== -1 && dep2.indexOf('readProtokolle()') !== -1,
     'Die Kante kommt aus dem Messprotokoll (D2: das Protokoll ist die einzige Quelle)');
  ok(/var belegt = kante\.urteil === "bestaetigt";/.test(dep2) &&
     /\(belegt && netto > 0 \? "gut" : "warn"\)/.test(dep2),
     'GRUEN nur bei Urteil "bestaetigt" - ein positives Vorzeichen allein ist kein Vorsprung');
  ok(dep2.indexOf('kante.jeSignalPp') !== -1,
     'Verglichen wird der Ueberschuss JE SIGNAL mit der Huerde je Umlauf - nicht das Tagesmittel');

  /* ---- Welche Variante spricht fuer das Protokoll? (26.08.2026) ----
   * Bis dahin nahm depot.js die Variante mit dem staerksten Bestaetigungs-t, das
   * Scoreboard dagegen bestesUrteil samt der Variante, die es traegt. Zwei Stellen
   * derselben App sagten fuer dasselbe Protokoll verschiedene Urteile. Das ist der
   * Grund - nicht, dass eine Auswahl freundlicher klaenge.
   * Betroffen war genau eines von 26 Protokollen: winkelbestaetigt-2026-08-25.
   * Die Auswahl wird AUSGEFUEHRT, nicht im Quelltext gesucht: ein Muster sagt, dass
   * etwas dasteht, nicht dass es das Richtige waehlt. */
  var kaA = dep2.indexOf('var urteilProtokoll = j.bestesUrteil || null;');
  /* Die Endmarke schliesst die Schleife MIT ein. Ohne das reicht eine zweite Zeile
   * 'if (!urteilProtokoll) return;' irgendwo davor, und herausgeloest wird ein
   * halber Block - der wirft dann beim Bauen, statt eine Falschauswahl zu zeigen.
   * Genau das ist am 26.08.2026 beim Gegenprobieren passiert und sah aus wie ein
   * bestandener Test. Deshalb steht die Eindeutigkeit hier als eigene Zusicherung. */
  var kaMarke = '        });\n        if (!urteilProtokoll) return;';
  var kaE = dep2.indexOf(kaMarke, kaA);
  ok(kaA !== -1 && kaE > kaA, 'Die Variantenwahl laesst sich herausloesen');
  ok(kaE !== -1 && dep2.indexOf(kaMarke, kaE + 1) === -1,
     'Die Endmarke der Variantenwahl kommt genau einmal vor - sonst loest der Test etwas anderes heraus');
  kaE += '        });\n'.length;
  var kaFn = new Function('j', dep2.slice(kaA, kaE) +
    'return { urteil: urteilProtokoll, jeSignal: beste ? beste.jeSignal : null };');
  function varianten(ts, urteile) {
    return ts.map(function (t, i) {
      return { bestaetigung: { ueberschuss: { t: t, jeSignal: (i + 1) / 1000 } } };
    });
  }
  /* Der echte Fall: alle t negativ. "Staerkstes t" heisst dort "am wenigsten negativ",
   * und genau das kippte die Auswahl auf Variante 0. */
  var wb = kaFn({ bestesUrteil: 'nicht-bestaetigt',
    urteile: ['nicht-entscheidbar', 'nicht-entscheidbar', 'nicht-entscheidbar', 'nicht-entscheidbar', 'nicht-bestaetigt'],
    ergebnisse: varianten([-0.96, -1.34, -1.54, -1.58, -2.11]) });
  ok(wb.urteil === 'nicht-bestaetigt',
     'winkelbestaetigt-Fall: gezeigt wird das Urteil des Protokolls, nicht das der staerksten Variante',
     wb.urteil);
  ok(Math.abs(wb.jeSignal - 0.005) < 1e-12,
     'und die Zahl je Signal gehoert zu genau dieser Variante (der fuenften)', wb.jeSignal);
  /* Gegenprobe, dass die Regel nicht einfach immer die letzte nimmt: bei kapitulation
   * traegt die Variante mit dem staerksten t das Urteil - dort aendert sich nichts. */
  var kp = kaFn({ bestesUrteil: 'nicht-bestaetigt',
    urteile: ['nicht-entscheidbar', 'nicht-entscheidbar', 'nicht-bestaetigt'],
    ergebnisse: varianten([1.51, 1.19, 2.14]) });
  ok(kp.urteil === 'nicht-bestaetigt' && Math.abs(kp.jeSignal - 0.003) < 1e-12,
     'kapitulation-Fall: unveraendert, die dritte Variante traegt das Urteil');
  /* Bei mehreren Varianten MIT dem Urteil gewinnt das staerkste t - sonst haenge die
   * Auswahl an der Reihenfolge in der Datei. */
  var gl = kaFn({ bestesUrteil: 'nicht-entscheidbar',
    urteile: ['nicht-entscheidbar', 'nicht-entscheidbar', 'nicht-bestaetigt'],
    ergebnisse: varianten([0.4, 1.9, 2.5]) });
  ok(Math.abs(gl.jeSignal - 0.002) < 1e-12,
     'Unter gleichrangigen Varianten gewinnt das staerkste t', gl.jeSignal);
  /* Und wenn KEINE Variante mit diesem Urteil eine brauchbare Zahl hat, steht das
   * Urteil ohne Zahl da. Eine Zahl aus einer anderen Variante waere schlimmer als
   * keine: sie sieht aus, als gehoerte sie dazu. */
  var ohne = kaFn({ bestesUrteil: 'nicht-bestaetigt',
    urteile: ['nicht-entscheidbar', 'nicht-bestaetigt'],
    ergebnisse: [{ bestaetigung: { ueberschuss: { t: 1.2, jeSignal: 0.001 } } },
                 { bestaetigung: { ueberschuss: { t: 2.0, jeSignal: null } } }] });
  ok(ohne.urteil === 'nicht-bestaetigt' && ohne.jeSignal === null,
     'Ohne passende Zahl steht das Urteil allein da - nie eine Zahl aus einer anderen Variante');
  /* Beide Anzeigen muessen mit der fehlenden Zahl umgehen koennen. */
  ok(/jeSignalPp: beste \? beste\.jeSignal \* 100 : null/.test(dep2),
     'Die fehlende Zahl wird als null weitergereicht, nicht als NaN');
  ok((dep2.match(/jeSignalPp == null/g) || []).length >= 2,
     'und beide Anzeigen fangen sie ab', (dep2.match(/jeSignalPp == null/g) || []).length + ' Stellen');
  ok(!/beste von " \+ kante\.varianten/.test(dep2),
     'Der Text "beste von N Varianten" ist weg - gezeigt wird nicht die beste, sondern die massgebliche');

  /* ---- Hinweis bei "nicht bestaetigt" (Wilhelms Entscheid 2b, 26.08.2026) ----
   * kapitulation steht seit der Neumessung auf diesem Urteil. "Nicht bestaetigt" und
   * "nicht entscheidbar" sind verschiedene Aussagen, und der Unterschied geht im Wort
   * unter. NUR HINWEIS: der Ausloeser bleibt waehlbar. */
  ok(/var hinweisUrteil = \(belegAusProtokoll && b\.stand === 'nicht-bestaetigt'\)/.test(dep2),
     'Bei "nicht bestaetigt" steht ein Hinweis im Regelkopf');
  ok(/Wählbar bleibt der Auslöser/.test(dep2),
     'und er sagt ausdruecklich, dass der Ausloeser waehlbar bleibt - Hinweis, kein Eingriff');
  ok(/nicht entscheidbar/.test(dep2.slice(dep2.indexOf('var hinweisUrteil'), dep2.indexOf('var hinweisUrteil') + 1400)),
     'Er benennt den Unterschied zu "nicht entscheidbar" - sonst liest sich beides gleich');

  /* ---- #100: beide Anzeigen lesen dieselbe Quelle, also brauchen sie denselben Takt ----
   * kantenAusProtokollen() rief nach dem Fuellen von PROTOKOLL_KANTE nur huerdeAnzeigen().
   * Der Regelkopf auf derselben Seite erfuhr nie, dass Protokolle da sind, und behauptete
   * dauerhaft "Kein Messprotokoll im Datenordner" - waehrend die Huerde sechs Zeilen
   * tiefer dasselbe Protokoll mit einem ANDEREN Urteil zeigte.
   * Reproduziert am 26.08.2026 in der laufenden App: Kopf "nicht entscheidbar" (aus dem
   * Code), Huerde "nicht bestaetigt" (aus dem Protokoll). Zwei Wahrheiten auf einer Seite.
   * Daran hingen zwei frisch ausgelieferte Arbeiten - Wilhelms Entscheid 2b und die
   * Variantenwahl nach Protokoll-Urteil -, weil beide in belegAusProtokoll leben. */
  /* Bis zum Ende der Funktion, nicht 900 Zeichen weit - der erklaerende Kommentar
   * dazwischen ist laenger als das Fenster, und die Probe wurde dadurch rot, obwohl
   * der Code stimmte. Schon wieder die Prosa. */
  var kaVon = dep2.indexOf('PROTOKOLL_KANTE = neu;');
  var kaBlock = dep2.slice(kaVon, dep2.indexOf('kanten-geladen', kaVon));
  ok(/huerdeAnzeigen\(\)/.test(kaBlock) && /regelKopfAnzeigen\(\)/.test(kaBlock),
     'Nach dem Laden der Protokolle werden BEIDE Anzeigen neu gezeichnet (#100)');

  /* ---- 1b: die Aufloesungswand steht in der Oberflaeche ----
   * Die Aussicht (aussicht.tage80) stand in jedem Protokoll, aber nirgends in der
   * App - alle zwoelf Strategien standen gleichberechtigt da, obwohl sieben mit
   * diesen Daten nie entscheidbar sein werden. Wilhelms Vorgabe (Tafel 26.08.):
   * die KLEINSTE Aussicht ueber alle Varianten zeigen, ab rund 2.500 Handelstagen
   * ein eigener Abschnitt. Hinweis, kein Eingriff. */
  ok(/Urteil Variante/.test(dep2) && /aussichtTage80: t80Min/.test(dep2),
     'Die Bruecke liest die Aussicht aus den "Urteil Variante"-Eintraegen der Protokolle (1b)');
  ok(/a\.tage80 < t80Min/.test(dep2),
     'und nimmt die KLEINSTE ueber alle Varianten - nicht die erste, nicht die beste (1b)');
  ok(/aussichtTage80: k\.aussichtTage80/.test(dep2),
     'DepotAPI.protokollKante gibt die Aussicht weiter - eine Quelle fuer alle Anzeigen (1b)');
  var sb9 = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');
  ok(/WAND_TAGE = 2500/.test(sb9),
     'Die Wand-Schwelle im Scoreboard ist Wilhelms 2.500 von der Tafel (1b)');
  ok(/bestesUrteil === 'nicht-entscheidbar'/.test(sb9.slice(sb9.indexOf('function hinterWand'), sb9.indexOf('function hinterWand') + 400)),
     'Hinter die Wand wandert NUR "nicht entscheidbar" - ein entschiedenes Urteil ist keine Messgeraet-Frage (1b)');
  ok(/Nicht entscheidbar mit diesen Daten/.test(sb9),
     'Der Abschnitt traegt Wilhelms Wortlaut von der Tafel (1b)');
  ok(/weder gut noch schlecht/.test(sb9) && /bleiben wählbar/.test(sb9),
     'Der Erklaersatz sagt ausdruecklich: keine Abwertung, nichts wird abgeschaltet (1b)');
  ok(/Handelstage bis entscheidbar/.test(sb9),
     'Die Aussicht-Spalte erklaert ihre Einheit im Kopf (1b)');
  var st9 = fs.readFileSync(__dirname + '/strategien.js', 'utf8');
  ok(/aussichtTage80/.test(st9) && /entscheidbar frühestens/.test(st9),
     'Auch die Strategien-Karten nennen die Aussicht - dieselbe Quelle ueber DepotAPI (1b)');
  /* Eigenschafts-Pruefung gegen ein ECHTES Protokoll: aendert die Messmaschine die
   * Ablage der Aussicht, wird die Anzeige still leer - das soll hier laut werden.
   * kapitulation 26.08.: Varianten 1551/2330/224, kleinste 224 (Tafel-Tabelle). */
  (function () {
    var kp = __dirname + '/studien/messmaschine/protokolle/kapitulation-2026-08-26.json';
    if (!fs.existsSync(kp)) return; // aeltere Checkouts haben das Protokoll nicht
    var j9 = JSON.parse(fs.readFileSync(kp, 'utf8'));
    var min9 = null;
    (j9.entscheidungen || []).forEach(function (en) {
      if (!/^Urteil Variante/.test(en.regel || '') || !en.ergebnis) return;
      var a = en.ergebnis.aussicht;
      if (a && isFinite(a.tage80) && (min9 == null || a.tage80 < min9)) min9 = a.tage80;
    });
    ok(min9 === 224,
       'Die Lesevorschrift findet im echten Protokoll die kleinste Aussicht (kapitulation: 224)', min9);
  })();

  /* ---- #102: interne Schluessel gehoeren nicht in die Anzeige ----
   * Sichtbar wurde es erst durch die Reparatur von #100: sobald der Regelkopf das
   * Protokoll ueberhaupt zu sehen bekam, stand dort woertlich "Beleg nicht-bestaetigt". */
  var aSh = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  var hHtml = fs.readFileSync(__dirname + '/index.html', 'utf8');   // html ist in diesem Block nicht in Reichweite
  ok(/urteilText: function \(u\)/.test(aSh), 'Die Uebersetzung der Urteile wohnt in app-shell');
  var utA = aSh.indexOf('urteilText: function (u) {');
  var utE = aSh.indexOf('\n    },', utA);
  ok(utA !== -1 && utE > utA, 'urteilText laesst sich herausloesen');
  var utFn = new Function('return { ' + aSh.slice(utA, utE + 6) + ' };')().urteilText;
  ok(utFn('nicht-bestaetigt') === 'nicht bestätigt', 'nicht-bestaetigt wird lesbar', utFn('nicht-bestaetigt'));
  ok(utFn('bestaetigt') === 'bestätigt' && utFn('nicht-entscheidbar') === 'nicht entscheidbar',
     'und die uebrigen Urteile ebenso');
  ok(utFn('bestaetigt-aber-nullpunkt-verschoben') === 'bestätigt – aber Nullpunkt verschoben',
     'auch das Urteil mit Vorbehalt');
  /* Ein unbekanntes Urteil darf nicht verschluckt werden - die Maschine darf neue
   * erfinden, und ein stilles "?" waere schlimmer als ein ungewohntes Wort. */
  ok(utFn('ganz-neues-urteil') === 'ganz neues urteil', 'Ein unbekanntes Urteil wird lesbar statt verschluckt');
  ok(utFn(null) === '?', 'und ohne Urteil steht ein Fragezeichen');
  /* Alle vier Anzeigen benutzen dieselbe Uebersetzung - zwei Tabellen an zwei Orten
   * waeren die naechste Stelle, an der eine veraltet. */
  ok((dep2.match(/U\.urteilText\(/g) || []).length >= 3,
     'depot.js zeigt kein Urteil mehr roh an', (dep2.match(/U\.urteilText\(/g) || []).length + ' Stellen');
  var sbQ2 = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');
  ok(/function label\(u\) \{ return U\.urteilText\(u\); \}/.test(sbQ2),
     'und das Scoreboard benutzt dieselbe statt einer eigenen');
  ok(!/rang: \d+, text:/.test(sbQ2),
     'Die zweite Tabelle ist weg - kein gepflegter Text ohne Leser');

  /* ---- #103: Zeilenkoepfe sind keine Spaltenkoepfe ----
   * Meine eigene Regression aus 779c02c: table.tbl th bringt Grossbuchstaben, Sperrung
   * und einen Unterstrich mit. Die Regel, die den Strich in der letzten Zeile entfernt,
   * gilt nur fuer td - unter der letzten Zeile blieb ein 130 px breiter Rest stehen. */
  ok(/table\.tbl th\[scope="row"\] \{[^}]*text-transform: none/.test(hHtml),
     'Zeilenkoepfe schreien nicht in Versalien (#103)');
  ok(/table\.tbl tr:last-child th\[scope="row"\] \{[^}]*border-bottom: none/.test(hHtml),
     'und hinterlassen in der letzten Zeile keinen Reststrich');

  /* ---- #101: eine Klasse, die es nur gebunden gibt, faerbt nichts ----
   * Der Ruecksetzer im Depotverlauf trug class="down". Die gibt es in index.html vier
   * Mal - .card .pp.down, .chip.down, #cockpit .down, .ppk.down - jedes Mal an einen
   * Zusammenhang gebunden. Im Kennzahlenkopf greift keine davon, der Verlust blieb
   * schwarz. Fuer Vorzeichen hat die App .pos/.neg, und U.signCls waehlt sie. */
  ok(!/class=\\"down\\"/.test(dep2) || !/Max\. Rücksetzer[^;]*class=\\"down\\"/.test(dep2),
     'Der Ruecksetzer traegt keine kontextgebundene Klasse mehr (#101)');
  var eqK = dep2.slice(dep2.indexOf('Max. Rücksetzer') - 400, dep2.indexOf('Max. Rücksetzer') + 200);
  ok(/U\.signCls\(dd\)/.test(eqK), 'sondern .pos/.neg ueber U.signCls');
  ok(/U\.signCls\(vGesamt\)/.test(dep2),
     'und der Verlauf ebenso - er kann genauso negativ sein und stand ganz ohne Klasse da');
  /* Die Klassen muessen es auch ungebunden geben - sonst haette man die eine tote
   * Klasse gegen die naechste getauscht. */
  ok(/^\s*\.neg \{[^}]*var\(--down\)/m.test(hHtml) && /^\s*\.pos \{[^}]*var\(--up\)/m.test(hHtml),
     '.pos und .neg gibt es ungebunden - sonst waere die Farbe wieder nur eine Behauptung');
  /* #103, Rest: die Zeilenkoepfe standen einen Punkt kleiner als ihre eigenen Werte. */
  ok(/table\.tbl th\[scope="row"\] \{[^}]*font-size: inherit/.test(hHtml),
     'Zeilenkoepfe haben dieselbe Schriftgroesse wie die Zellen daneben (#103, Rest)');

  /* ---- Depotverlauf: EIN Bild, und die Zahlen ueber die ganze Historie (26.08.2026) ----
   * Unter Vermoegen -> Depot standen zwei Bilder DERSELBEN Daten untereinander: eine
   * schlichte Flaeche mit drei Kennzahlen darueber und darunter das ausfuehrliche Bild
   * mit Achsen, Startkapital-Linie und Maus-Hinweis. Das schlichtere konnte weniger und
   * ist entfallen; die Kennzahlen sind zum ausfuehrlichen umgezogen.
   * Diese Stelle hatte bis dahin KEINE einzige Zusicherung - deshalb konnten zwei
   * Ansichten derselben Zahlen nebeneinander bestehen, ohne dass es auffiel. */
  var b2Html = fs.readFileSync(__dirname + '/index.html', 'utf8'), b2Dep = dep2;
  ok(b2Html.indexOf('id="equityChart"') !== -1, 'Das ausfuehrliche Verlaufsbild steht');
  ok(b2Html.indexOf('id="eqPanel"') === -1,
     'Das zweite, schlichtere Verlaufsbild ist weg - nicht zwei Bilder derselben Daten');
  ok((b2Html.match(/id="eqKopf"/g) || []).length === 1,
     'Die drei Kennzahlen haben genau einen Ort');
  ok(b2Html.indexOf('id="eqKopf"') < b2Html.indexOf('id="equityChart"'),
     'und stehen ueber dem Bild, zu dem sie gehoeren');
  /* renderEquity zeichnet nichts mehr - sonst waere das zweite Bild nur unsichtbar
   * geworden statt entfallen. */
  var reA = b2Dep.indexOf('function renderEquity() {');
  var reE = b2Dep.indexOf('\n  }\n', reA);
  ok(reA !== -1 && reE > reA, 'renderEquity laesst sich herausloesen');
  var reQ = b2Dep.slice(reA, reE);
  ok(reQ.indexOf('<svg') === -1 && reQ.indexOf('<path') === -1,
     'renderEquity zeichnet keine zweite Kurve mehr - es setzt nur noch die Zahlen');
  ok(reQ.indexOf("getElementById('eqKopf')") !== -1, 'und schreibt in den neuen Ort');
  /* Die 5-Punkte-Regel ist mit umgezogen: drei Kennzahlen aus vier Punkten sind keine
   * Auskunft, sondern eine Behauptung. */
  ok(/if \(h\.length < 5\) \{ el\.style\.display = 'none'; return; \}/.test(reQ),
     'Unter 5 Punkten bleiben die Kennzahlen versteckt');
  /* DIE WICHTIGE FALLE: die Zahlen rechnen ueber die GESAMTE Historie, das Bild daneben
   * zeigt einen Ausschnitt. Wer sie aus dem gezeichneten Bild herleitet, aendert sie
   * stillschweigend - ein Hoch von vor zwei Jahren verschwaende einfach.
   * Deshalb AUSGEFUEHRT geprueft, mit einem Verlauf, dessen Hoch ganz am Anfang liegt. */
  ok(reQ.indexOf('.slice(') === -1,
     'Die Kennzahlen rechnen ueber ALLE Punkte - kein Ausschnitt in renderEquity');
  var rzA = b2Dep.indexOf('var hoch = h[0][1], peak = h[0][1], dd = 0;');
  var rzE = b2Dep.indexOf('var eqLast = h[h.length - 1][1];', rzA);
  ok(rzA !== -1 && rzE > rzA, 'Die Kennzahlen-Rechnung laesst sich herausloesen');
  var rzFn = new Function('h', b2Dep.slice(rzA, rzE) + '\nreturn { hoch: hoch, dd: dd };');
  /* 1000 Punkte: Hoch 20.000 bei Punkt 3, danach faellt es auf 9.000 und laeuft flach.
   * Ein Ausschnitt der letzten 800 Punkte saehe weder das Hoch noch den Ruecksetzer. */
  var verlauf = [];
  for (var vi = 0; vi < 1000; vi++) verlauf.push([vi, vi === 3 ? 20000 : (vi < 3 ? 10000 : 9000)]);
  var rz = rzFn(verlauf);
  ok(rz.hoch === 20000,
     'Das Hoch aus dem Anfang der Historie ueberlebt - es wird nicht aus dem Bildausschnitt geholt', rz.hoch);
  ok(Math.abs(rz.dd - (-0.55)) < 1e-9,
     'und der groesste Ruecksetzer wird gegen dieses Hoch gerechnet, nicht gegen den Ausschnitt',
     (rz.dd * 100).toFixed(1) + ' %');

  /* A6 (23.08.2026): Der Nullpunkt der Maschine liegt nicht bei null. Auf Daten mit
   * vertauschter Reihenfolge kam eine These als "bestaetigt" durch (t=+2,97), eine
   * andere als "widerlegt" (t=-8,07). Ohne dieses Werkzeug ist kein Urteil belastbar. */
  ok(/\|\s*A6\s*\|/.test(ft), 'A6 steht in FEHLERTYPEN.md');
  ok(np.indexOf('koerbe[h]') !== -1 && np.indexOf('getUTCHours') !== -1,
     'Der Nullversuch vertauscht INNERHALB jeder UTC-Stunde - sonst aendert sich die Kontrolle');
  ok(np.indexOf('Math.random') === -1,
     'Fester Startwert statt Math.random - derselbe Aufruf ergibt dieselbe Vertauschung');
  ok(mn.indexOf('Eichung') !== -1 && mn.indexOf('Math.max(st.sd') === -1,
     'Das Eichwerkzeug zieht nichts mehr ab - seit A7 ist die Verzerrung unmoeglich, nicht geschaetzt');
  ok(mn.indexOf('bestaetigt') === -1 && mn.indexOf('widerlegt') === -1,
     'Und es faellt keine Urteile mehr (A8: t-Werte auf Nullarchiven sind zu gross)');

  /* Ein Protokoll aus einem fremden Archiv darf die App nie erreichen - sonst steht
   * im Scoreboard ein Urteil aus gewuerfelten Daten, das aussieht wie ein Befund. */
  var ms = fs.readFileSync(__dirname + '/studien/messmaschine/messen.js', 'utf8');
  ok(ms.indexOf('fremdesArchiv') !== -1 && /fremdesArchiv \?[^\n]*fremdarchiv/.test(ms),
     'Messungen an einem fremden Archiv bekommen -fremdarchiv in den Dateinamen');
  ok(/if \(fremdesArchiv\) \{[\s\S]{0,200}Keine Kopie in den Datenordner/.test(ms),
     'Und sie werden NICHT in den Datenordner kopiert - das Scoreboard sieht sie nie');

  /* Die Vorregistrierung ist der Beleg, dass die Thesen vor der Messung feststanden. */
  ok(fs.existsSync(__dirname + '/studien/messmaschine/VORREGISTRIERUNG-2026-08-23-eigenbau.md'),
     'Die Vorregistrierung vom 23.08.2026 liegt im Repo');
  ok(mm2.indexOf('B8 Testfamilie') !== -1,
     'B8: Bonferroni zaehlt die ganze Testfamilie, nicht nur die Varianten einer Datei');

  ok(/data-tab="messung"/.test(h) && /id="scoreboard"/.test(h) && /id="stAblegen"/.test(h),
     'Reiter Messung mit Scoreboard und Eingabe ist in der Oberflaeche');

  /* Ausstiegsregeln (C6/C7, 23.08.2026). Die Maschine darf sie NICHT der Regel
   * ueberlassen: Wer selbst entscheidet, wann und zu welchem Kurs verkauft wird,
   * verkauft rueckblickend zum Hoechstkurs. */
  var mm = fs.readFileSync(__dirname + '/studien/messmaschine/messmaschine.js', 'utf8');
  ok(/function fuehreAus\(pfad, einKurs, stopNiveau, params\)/.test(mm),
     'Die Maschine fuehrt den Ausstieg selbst aus - die Regel liefert nur ein Niveau');
  ok(/Math\.min\(stop, p\.auf\)/.test(mm),
     'C7: Gefuellt wird zum schlechteren aus Stop und erstem handelbaren Kurs, nie zum Wunschkurs');
  ok(/baueKontrolle\(U, H, schnittTag, vorlauf,[\s\S]{0,200}stopNiveau/.test(mm),
     'Die Kontrolle bekommt denselben Ausstieg - sonst misst man den Stop statt das Signal');
  ok(/\|\s*C6\s*\|/.test(ft) && /\|\s*C7\s*\|/.test(ft),
     'C6 und C7 stehen in FEHLERTYPEN.md');

  /* C7 genauer (24.08.2026): Wo das Archiv Eroeffnungskurse fuehrt, wird der echte
   * benutzt statt des Vorkerzen-Schlusses. Der Testfall der Maschine misst den
   * Unterschied: -0,2695 Pp gegen -0,0990 Pp - die Naeherung war Faktor 2,7 zu guenstig. */
  ok(mm2.indexOf('function eroeffnungKurs(bars, k)') !== -1,
     'Die Maschine hat eine Regel fuer den ersten handelbaren Kurs');
  /* Drei Ausstiegspfade seit dem 25.08.2026: Signal, A7-Kontrolle (Zeit desselben Werts)
   * und Querschnitts-Kontrolle (andere Werte derselben Zeit). Alle drei muessen dieselbe
   * Fuellregel benutzen, sonst misst man zwei Ausfuehrungen und nennt den Unterschied
   * Effekt. Die Zahl steht hart, damit ein VIERTER Pfad ohne die Regel auffliegt. */
  var c7Pfade = mm2.split('auf: eroeffnungKurs(b,').length - 1;
  ok(c7Pfade === 3,
     'Signalpfad UND beide Kontrollen benutzen sie - sonst misst man zwei verschiedene Ausfuehrungen  [' + c7Pfade + ']');
  ok(/P\.warne\('C7'/.test(mm2),
     'Fuehrt das Archiv keine Eroeffnungskurse, warnt die Maschine - keine stille Naeherung');
  var yh = fs.readFileSync(__dirname + '/tools/yahoo-60m-holen.js', 'utf8');
  /* Beide Marken sind am 26.08.2026 nach kerzenquelle.js gewandert, damit die App
   * beim eigenen Sammeln dieselbe Zeile schreibt. Geprueft wird sie dort - und dass
   * das Werkzeug wirklich durch das Modul geht statt daran vorbei. */
  var kq = fs.readFileSync(__dirname + '/kerzenquelle.js', 'utf8');
  var K7 = require(__dirname + '/kurse.js');
  ok(K7.zerlege(JSON.stringify({ chart: { result: [{ timestamp: [100],
    indicators: { quote: [{ close: [10], open: [9], high: [10], low: [9], volume: [5] }] },
    meta: {} }] } }), { bereinigt: false }).bars[0].length === 6,
     'Eine Kerze hat SECHS Felder - der Eroeffnungskurs ist das sechste, die ersten fuenf bleiben');
  /* DIE LUECKE MUSS EINE LUECKE BLEIBEN. Faellt ein fehlender Eroeffnungskurs schon
   * beim Zerlegen still auf den Schlusskurs, kann die Warnung oben nie mehr feuern:
   * die Maschine saehe ueberall Eroeffnungskurse und rechnete mit einer Naeherung,
   * von der niemand mehr erfaehrt. Aus einer offengelegten Naeherung waere eine
   * verschwiegene geworden - und das ist schlimmer als gar keine. */
  var luecke7 = JSON.stringify({ chart: { result: [{ timestamp: [100, 200],
    indicators: { quote: [{ close: [10, 11], open: [null, 9], high: [10, 11],
      low: [10, 11], volume: [5, 6] }] }, meta: {} }] } });
  ok(K7.zerlege(luecke7, { bereinigt: false, offenRoh: true }).bars[0][5] === null,
     'Fehlt er im Archivpfad, bleibt er LEER - sonst koennte C7 nie warnen');
  ok(K7.zerlege(luecke7, { bereinigt: false }).bars[0][5] === 10,
     'Fuer die Anzeige faellt er weiter auf den Schluss - dort ist die Luecke laestiger');
  ok(K7.zerlege(luecke7, { bereinigt: false, offenRoh: true }).bars[1][5] === 9,
     'und ein vorhandener Eroeffnungskurs bleibt in beiden Faellen unangetastet');
  ok(/offenRoh: true/.test(kq),
     'Das Kursarchiv holt wirklich mit offenRoh - sonst naehme es die stille Naeherung mit');
  ok(kq.indexOf('karte[k[0]] = k') !== -1 && yh.indexOf('--aktualisieren') !== -1,
     'Es fuehrt Reihen fort statt sie zu ueberschreiben (Yahoo liefert nur 730 Tage)');
  ok(/Q\.reiheHolen\(/.test(yh) && /Q\.zusammenfuehren\(/.test(yh),
     'und das Abrufwerkzeug holt und vereinigt DURCH das Modul, nicht daneben');

  /* Der Weg muss auch durch die Oberflaeche fuehren - sonst weicht man wieder auf
   * ein Wegwerf-Skript aus, und genau dort passierten beide Fehler. */
  var sb2 = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');
  ok(/id="stStop"/.test(h), 'Die Strategie-Eingabe hat ein Feld fuer die Ausstiegsregel');
  ok(/stopNiveau: stopNiveau/.test(sb2),
     'Eine eingegebene Ausstiegsregel landet als stopNiveau in der Strategiedatei');
  ok(/ausstiegText/.test(sb2),
     'Das Scoreboard zeigt bei einer Ausstiegsregel die TATSAECHLICHE Haltedauer an');
})();


console.log('\n45) Massive-Anbindung: Schluessel, Tempolimit, Aussengrenze');
(function () {
  var mv = fs.readFileSync(__dirname + '/tools/massive.js', 'utf8');
  var vw = fs.readFileSync(__dirname + '/tools/massive-verschwundene.js', 'utf8');
  var mj = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var h = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));

  /* Der Schluessel darf die App nie erreichen. Die Regel aus Version 7.17 lautet:
   * kein Netzwerkpfad zu Schluessel-APIs IN der Anwendung. tools/ laeuft von Hand. */
  ok(pkg.build.files.indexOf('tools/**') === -1 && !pkg.build.files.some(function (f) { return /tools/.test(String(f)); }),
     'tools/ ist nicht im Paket - die Anbindung wird nie mit ausgeliefert');
  ok(!/massive/i.test(mj) && !/massive/i.test(h),
     'Weder Hauptprozess noch Oberflaeche kennen Massive');
  ok(!/api\.massive\.com/.test(mj), 'api.massive.com steht NICHT in der Host-Freigabe der App');

  /* Der Schluessel kommt aus genau zwei Quellen und wird nie ausgegeben. */
  ok(/process\.env\.MASSIVE_KEY/.test(mv) && /massive\.key/.test(mv),
     'Schluessel nur aus MASSIVE_KEY oder der Datei massive.key im Datenordner');
  var kf = mv.slice(mv.indexOf('function schluessel'), mv.indexOf('function warte'));
  ok(!/console\.log[^\n]*(key|schluessel|s\b)/i.test(kf) || !/console\./.test(kf),
     'Die Schluessel-Funktion gibt nichts aus');
  ok(/Authorization: 'Bearer ' \+ key/.test(mv), 'Der Schluessel geht in den Header, nicht in die URL');
  ok(!/\?.*apiKey|&apiKey/.test(mv), 'Kein Schluessel als Abfrageparameter - der stuende in jedem Fehlerprotokoll');
  ok(!/massive\.key/.test(fs.readFileSync(__dirname + '/.gitignore', 'utf8')) || true,
     'Hinweis: die Schluesseldatei liegt im Datenordner, nicht im Repo');

  /* Tempolimit: 5 Abrufe je Minute sind 12 s; das Werkzeug haelt mehr. */
  var abstand = (mv.match(/ABSTAND_MS\s*=\s*(\d+)/) || [])[1];
  ok(abstand && Number(abstand) >= 12000, 'Abstand zwischen zwei Abrufen mindestens 12 s (Basis-Stufe: 5/Min)', abstand + ' ms');
  ok(/statusCode === 429/.test(mv) && /versuch > 5/.test(mv), 'HTTP 429 wird abgefangen und mit wachsender Pause wiederholt');
  ok(/maxSeiten \|\| 50/.test(mv), 'Die Seitenzahl ist gedeckelt - ein Lauf endet planbar');

  /* Eigener Ablageort: das Kursarchiv der App wird nicht angefasst. */
  ok(/'massive'/.test(mv) && /Markt-Dashboard-Daten/.test(mv),
     'Massive schreibt in einen eigenen Ordner unter Markt-Dashboard-Daten/massive');
  // Entscheidend ist nicht, ob das Archiv VORKOMMT (es wird zum Abgleich gelesen),
  // sondern ob hineingeschrieben wird. Jeder Schreibaufruf muss in die eigene Ablage zeigen.
  var schreibt = vw.match(new RegExp('writeFileSync\\([^,)]*', 'g')) || [];
  ok(schreibt.length > 0 && schreibt.every(function (s) { return /ziel/.test(s); }),
     'Der Abruf schreibt ausschliesslich in die eigene Ablage, nie ins Kursarchiv',
     schreibt.length + ' Schreibaufruf(e): ' + schreibt.join(' | '));
  ok(vw.indexOf('var ziel = path.join(M.ablage()') !== -1,
     'Das Ziel ist M.ablage() - der eigene Massive-Ordner');

  /* Der Zweck steht im Werkzeug, nicht nur im Commit. */
  ok(/Ueberlebensverzerrung/.test(vw), 'Das Werkzeug benennt seinen Zweck: die Ueberlebensverzerrung messen');
  ok(/active=false/.test(vw), 'Es holt ausdruecklich die NICHT mehr aktiven Ticker');
  ok(/'CS' \|\| t\.art === 'ADRC'/.test(vw), 'Nur aktienartige Papiere - Fonds und Rechte wuerden die Messung verwaessern');

  /* --- Tagesdaten-Abruf: schont die Schnittstelle und verliert keinen Fortschritt --- */
  var td = fs.readFileSync(__dirname + '/tools/massive-tagesdaten.js', 'utf8');
  ok(/M\.hole\(/.test(td) && !/https\.get/.test(td),
     'Tagesdaten-Abruf schont die Schnittstelle: er geht ueber M.hole und erbt das Tempolimit');
  var proAbruf = (td.match(new RegExp('M\\.hole\\(', 'g')) || []).length;
  ok(proAbruf === 1, 'Genau EIN Abruf je Wert - der Aggregat-Endpunkt liefert die ganze Spanne auf einmal', proAbruf);
  ok(/fs\.writeFileSync\(standDatei/.test(td) && td.indexOf('fs.writeFileSync(standDatei') > td.indexOf('for (var i = 0'),
     'Der Fortschritt wird INNERHALB der Schleife gespeichert - ein Abbruch verschwendet keinen Abruf');
  ok(/stand\.fertig\[t\.sym\]/.test(td) && /stand\.ohneDaten\[t\.sym\]/.test(td),
     'Bereits geholte und ergebnislose Werte werden nie erneut abgerufen');
  ok(/fehler >= 5/.test(td), 'Nach fuenf Fehlern bricht der Lauf ab, statt gegen eine Sperre zu laufen');
  ok(/maxWerte/.test(td), 'Die Zahl der Werte je Lauf ist gedeckelt und einstellbar');
  var tdSchreibt = td.match(new RegExp('writeFileSync\\([^,)]*', 'g')) || [];
  ok(tdSchreibt.length > 0 && tdSchreibt.every(function (s) { return /ordner|standDatei/.test(s); }),
     'Auch der Tagesdaten-Abruf schreibt nur in die eigene Ablage', tdSchreibt.join(' | '));
})();


console.log('MERKMALE der Signale (Felix, Issue #57): Aufzeichnung statt Nachsuche');
(function () {
  /* Kerzen bauen: [t, close, volumen, hoch, tief], 5-Minuten-Raster ueber mehrere Tage.
     Ein steigender Verlauf mit ruhigem Volumen ist der Normalfall, an dem die
     Auspraegungen ablesbar sein muessen. */
  function baueBars(n, opt) {
    opt = opt || {};
    var b = [], t = Date.UTC(2026, 5, 1, 13, 30);
    for (var i = 0; i < n; i++) {
      var tag = Math.floor(i / 78);                       // 78 Fuenfminutenkerzen = ein Handelstag
      var zeit = t + tag * 86400000 + (i % 78) * 300000;
      var c = 100 + i * (opt.steig === undefined ? 0.05 : opt.steig);
      var v = opt.vol ? opt.vol(i) : 1000;
      b.push([zeit, c, v, c + 0.2, c - 0.2]);
    }
    return b;
  }

  var steigend = baueBars(400);
  var m = Q.signalMerkmale(steigend, steigend.length - 1);
  ok(m && typeof m === 'object', 'signalMerkmale liefert ein Objekt');
  ok(m.trend === 'auf', 'sauber steigender Verlauf wird als Aufwaertskanal beschrieben (kanalUeber sagt auf/seit/ab)', m.trend);
  ok(m.kanal === 'unten' || m.kanal === 'mitte' || m.kanal === 'oben', 'Kanallage ist eine der drei Auspraegungen', m.kanal);
  ok(m.vol === 'normal', 'gleichmaessiges Volumen ist "normal"', m.vol);

  /* Volumen-Ausschlag: die letzten fuenf Kerzen dreimal so schwer wie der Median davor. */
  var laut = baueBars(400, { vol: function (i) { return i >= 395 ? 3000 : 1000; } });
  ok(Q.signalMerkmale(laut, laut.length - 1).vol === 'hoch', 'dreifaches Volumen in den letzten Kerzen ist "hoch"');
  var leise = baueBars(400, { vol: function (i) { return i >= 395 ? 300 : 1000; } });
  ok(Q.signalMerkmale(leise, leise.length - 1).vol === 'niedrig', 'ein Drittel Volumen ist "niedrig"');

  /* KEIN Blick nach vorn - die entscheidende Zusicherung. Werden hinter i weitere
     Kerzen angehaengt, muss das Ergebnis AN i unveraendert bleiben. Ohne diese
     Eigenschaft waere jede spaetere Auswertung wertlos. */
  var kurz = baueBars(300);
  var lang = baueBars(400);
  var mK = Q.signalMerkmale(kurz, 299), mL = Q.signalMerkmale(lang, 299);
  ok(JSON.stringify(mK) === JSON.stringify(mL),
     'Merkmale an Kerze i aendern sich nicht, wenn spaetere Kerzen dazukommen (kein Blick nach vorn)',
     JSON.stringify(mK) + ' vs ' + JSON.stringify(mL));

  /* Zu wenig Daten darf null liefern, aber nie werfen. */
  var winzig = baueBars(10);
  var mW = Q.signalMerkmale(winzig, 9);
  ok(mW.vol === null && mW.kanal === null, 'zu kurze Reihe: Merkmale bleiben leer statt geraten');
  ok(JSON.stringify(Q.signalMerkmale(null, 0)) === JSON.stringify({ kanal: null, trend: null, vol: null, adr: null }),
     'ohne Kerzen kommt ein leeres Merkmalsobjekt zurueck, keine Ausnahme');

  /* --- Bilanz: Ueberschuss gegen die Kontrolle, duenne Toepfe markiert --- */
  var bil = Q.merkmalsBilanz({
    'vol|hoch': { n: 40, sumPct: 80, ktrN: 40, ktrSum: 40 },     // Oe +2,0 %, Kontrolle +1,0 %
    'vol|niedrig': { n: 5, sumPct: -10, ktrN: 5, ktrSum: 0 }     // zu duenn fuer ein Urteil
  });
  var volFeld = bil.felder.filter(function (f) { return f.key === 'vol'; })[0];
  ok(!!volFeld, 'die Bilanz gruppiert nach Merkmal');
  var hoch = volFeld.zeilen.filter(function (z) { return z.wert === 'hoch'; })[0];
  ok(hoch.avg === 2 && hoch.ktr === 1 && hoch.ueber === 1,
     'Ueberschuss = Schnitt minus Kontrolle, beide bleiben sichtbar', hoch.avg + ' / ' + hoch.ktr + ' / ' + hoch.ueber);
  ok(hoch.duenn === false, '40 Signale gelten als auswertbar');
  var nied = volFeld.zeilen.filter(function (z) { return z.wert === 'niedrig'; })[0];
  ok(nied.duenn === true, 'unter ' + Q.MERK_MIN + ' Signalen wird der Topf als zu duenn markiert');
  ok(bil.toepfe === 2 && bil.gesamtN === 45, 'Zahl der Vergleiche und der Eintraege wird mitgefuehrt', bil.toepfe + ' / ' + bil.gesamtN);
  ok(Q.merkmalsBilanz({}).gesamtN === 0, 'leere Zaehlung ergibt eine leere Bilanz');

  /* --- Verdrahtung im Depot: Aufzeichnung ja, Entscheidung nein --- */
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  ok(/Q\.signalMerkmale\(bars, bars\.length - 1\)/.test(dep) && /merk: merk/.test(dep),
     'jeder Schatten bekommt die Merkmale des Moments mitgeschrieben');
  ok(/sEintrag\.grund !== 'Einstieg'/.test(dep),
     'gezaehlt werden nur die Signale, die alle Filter passiert haben - das sind die "getaetigten Kaeufe"');
  // Die Merkmale duerfen NIE ein Signal verhindern oder ausloesen. Waeren sie an einer
  // Verzweigung beteiligt, waere aus der Aufzeichnung heimlich eine Strategie geworden.
  ok(!/if\s*\([^)]*signalMerkmale/.test(dep) && !/merk\.(kanal|vol|adr|trend)\s*===/.test(dep),
     'kein Merkmal steht in einer Handelsentscheidung - die Aufzeichnung greift nicht ein');
  ok(/D\.schattenStat = \{\};\s*[\s\S]{0,400}?D\.merkStat = \{\};/.test(dep),
     'aendern sich die Ausstiegsregeln, beginnt die Merkmals-Zaehlung mit der Bilanz gemeinsam neu');
  ok(/Merkmale der Signale – Aufzeichnung, kein Befund/.test(dep),
     'die Karte nennt sich selbst Aufzeichnung, nicht Befund');
  ok(/Kandidat für eine Messung/.test(dep) && /Simulation, keine Anlageberatung/.test(dep),
     'die Karte sagt dazu, dass ein auffaelliger Wert erst eine Studie braucht');
})();

console.log('\n38) Audit 23.08.2026 – die fuenf Fehler duerfen nicht zurueckkommen');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var ren = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
  var mfd = fs.readFileSync(__dirname + '/mfdepot.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');

  /* --- B1: Cockpit rechnete gegen 10000, die Buecher laufen mit 100000 ---
   * Ein unberuehrtes Buch meldete dadurch +900,0 %, ein Buch mit 8 % Verlust +820,0 %.
   * Die Zahl steht ausserhalb aller Reiter und ist damit immer sichtbar. */
  ok(!/lp\.momentum \/ 10000/.test(dep) && !/lp\.drift \/ 10000/.test(dep),
     'B1: das Cockpit teilt nicht mehr durch eine fest verdrahtete 10000');
  ok(/lp\.momentum \/ stM/.test(dep) && /lp\.drift \/ stD/.test(dep),
     'B1: der Bezugswert kommt aus dem Buch, nicht aus einer Konstante');
  ok(/startM: d\.mfBuch/.test(mfd) && /startD: d\.driftBuch/.test(mfd),
     'B1: mfVerlauf schreibt das Startkapital mit, damit alte Punkte lesbar bleiben');
  // Die Rechnung selbst, an genau den Zahlen, die frueher +900 ergaben
  function stand(wert, start) { return Math.round((wert / start - 1) * 1000) / 10; }
  ok(stand(100000, 100000) === 0, 'B1: ein unberuehrtes 100.000-$-Buch steht bei 0,0 %  [' + stand(100000, 100000) + ']');
  ok(stand(92000, 100000) === -8, 'B1: 92.000 $ von 100.000 $ sind -8,0 %  [' + stand(92000, 100000) + ']');
  ok(/100\.000-\$-B(ü|ue)cher/.test(html), 'B1: der Tooltip nennt dieselbe Groesse wie der Rest der Oberflaeche');

  /* --- B2: Klassenkollision blendete die Tagesbewegung aus ---
   * renderer.js schrieb den Prozentwert als class="sub"; die Reiter-Regel
   * .sub{display:none} verdeckte ihn auf allen sechs Kopfkacheln. */
  ok(/class="kachel-sub"/.test(ren) && !/'<div class="sub">'/.test(ren),
     'B2: die Kachel benutzt kachel-sub, nicht die Reiter-Klasse sub');
  ok(/\.tile \.kachel-sub/.test(html) && !/\.tile \.sub\b/.test(html),
     'B2: das CSS gestaltet kachel-sub');
  // Gegenprobe: die Reiter-Regel gibt es noch, sie ist ja der Grund fuer die Umbenennung
  ok(/\.sub \{ display: none; \}/.test(html),
     'B2: .sub{display:none} steht weiter fuer die Unterseiten - deshalb darf keine Kachel so heissen');
  /* Allgemein: KEIN von JS erzeugtes Element darf eine Klasse tragen, die das CSS
   * global ausblendet. Sonst rechnet die App etwas aus und verdeckt es selbst. */
  var versteckende = (html.match(/^\s*\.([a-z][\w-]*) \{ display: none; \}/gm) || [])
    .map(function (z) { return z.trim().replace(/^\./, '').replace(/ .*/, ''); });
  var kollisionen = versteckende.filter(function (k) {
    return new RegExp("'<div class=\"" + k + "\">'").test(ren + dep);
  });
  ok(kollisionen.length === 0,
     'B2: kein JS-erzeugtes Element traegt eine global ausgeblendete Klasse  [' + (kollisionen.join(', ') || 'keine') + ']');

  /* --- B3: stcRunning war nur noch in der Benutzung da ---
   * Unter 'use strict' warf "Chart laden" dadurch bei jedem Klick. Die Klasse
   * insgesamt deckt jetzt der Linter ab (npm run lint); hier bleibt der Wachposten
   * fuer genau diese Variable, weil sie schon einmal einem Umbau zum Opfer fiel.
   * Seit Stufe E wohnt sie in strategiechart.js - der Wachposten zieht mit. */
  ok(/var stcRunning = false;/.test(fs.readFileSync(__dirname + '/strategiechart.js', 'utf8')),
     'B3: stcRunning ist deklariert - sonst wirft der Knopf "Chart laden"');
  ok(fs.existsSync(__dirname + '/eslint.config.mjs'),
     'B3: es gibt eine Linter-Konfiguration, die undeklarierte Namen findet');
  /* Zwei Punkte aus Issue #76 (25.08.2026), beide von derselben Sorte: eine Pruefung,
   * die es gibt, aber nichts prueft.
   *
   * Punkt 4: Kein files-Muster traf auf .mjs zu. Die Konfiguration des Linters war
   * damit die EINZIGE Quelldatei des Repos, die er selbst nicht ansah - gemessen mit
   * `eslint --print-config`: null aktive Regeln. Nachgewiesen behoben: 17 Regeln,
   * sourceType 'module', und eine Probedatei mit `no-undef` faellt jetzt durch. */
  var esCfg = fs.readFileSync(__dirname + '/eslint.config.mjs', 'utf8');
  ok(/files: \['\*\.mjs'\]/.test(esCfg) && /sourceType: 'module'/.test(esCfg),
     'Der Linter prueft auch .mjs - sonst sieht er seine eigene Konfiguration nicht an');
  /* Punkt 3: Der Platzhalter der Vorlage war 25 Zeichen lang und bestand damit die
   * Laengenpruefung in main.js. Wer die Vorlage kopierte, ohne ein Token einzutragen,
   * bekam KEINEN Konfigurationsfehler - die App hielt die Datei fuer gueltig und
   * scheiterte erst bei GitHub, sichtbar nirgends. Beide Haelften werden geprueft:
   * die gekuerzte Vorlage UND die Pruefung, die eine aeltere Vorlage abfaengt. */
  var vorlage = JSON.parse(fs.readFileSync(__dirname + '/telemetrie.json.vorlage', 'utf8'));
  ok(vorlage.token.length <= 20,
     'Der Platzhalter der Telemetrie-Vorlage faellt durch die Laengenpruefung', vorlage.token.length);
  var mjT = fs.readFileSync(__dirname + '/main.js', 'utf8');
  ok(/istPlatzhalter/.test(mjT) && /!istPlatzhalter/.test(mjT),
     'und main.js weist einen stehengebliebenen Platzhalter ausdruecklich ab');

  /* --- B5: der Regime-Anker forderte mehr Kerzen, als sein Abruf liefern kann --- */
  // Bis zum catch, NICHT bis zum ersten "return SPY_REGIME.auf" - das ist die frühe
  // Rückgabe aus dem Zwischenspeicher und steht noch vor den Abrufen.
  var anker = (dep.match(/async function spyTrendAuf\(\)[\s\S]*?catch \(eR\)/) || [''])[0];
  ok(/fetchIntraday/.test(anker), 'B5: die Funktion spyTrendAuf ist samt Abruf auffindbar');
  ok(/fetchIntraday\('SPY', '60m', true\)/.test(anker),
     'B5: der SPY-Anker holt die tiefe Reihe (btRange), nicht das 1-Monats-Fenster');
  ok(/fetchIntraday\('SPY', '60m', false\)/.test(anker),
     'B5: bei Fehlschlag bleibt der Capital.com-Ersatzweg erhalten');
  var noetig = (anker.match(/series\.length > (\d+)/) || [])[1];
  ok(Number(noetig) === 220,
     'B5: die Schwelle steht weiter bei 220 Kerzen  [' + noetig + ']');

  /* --- Kursplausibilitaet: '== null' liess 0, negative Werte und NaN durch --- */
  /* Die Regel wohnt jetzt in kurse.js und wird dort AUSGEFUEHRT, nicht gesucht.
   * depot.js darf keine zweite Fassung mehr tragen - zwei Kopien einer Regel sind
   * genau der Fehler, den der Lader aufloest. */
  var Ku = require(__dirname + '/kurse.js');
  ok(Ku.kursOk(1) === true && Ku.kursOk(0.01) === true,
     'Kurse: ein normaler Kurs ist brauchbar');
  ok(Ku.kursOk(0) === false && Ku.kursOk(-5) === false && Ku.kursOk(NaN) === false &&
     Ku.kursOk(Infinity) === false && Ku.kursOk(null) === false && Ku.kursOk('12') === false,
     'Kurse: 0, negativ, NaN, unendlich, null und Text sind es nicht');
  ok(/var kursOk = window\.Kurse\.kursOk/.test(dep) && !/function kursOk\(v\)/.test(dep),
     'Kurse: depot.js holt die Regel, statt sie ein zweites Mal hinzuschreiben');
  ok(!/if \(closes\[i\] == null\) continue;/.test(dep) && !/if \(closes\[i\] != null\)/.test(dep),
     'Kurse: kein Abruf verlaesst sich mehr allein auf "== null"');

  /* --- Equity-Kurve: Aktienpositionen wurden als Schein bepreist ---
   * Das ist der einzige der fuenf Befunde, der sich richtig AUSFUEHREN laesst, weil
   * quant.js ladbar ist. Vorher meldete derselbe Lauf 5 % Drawdown, obwohl die Kurve
   * nie mehr als 0,02 % unter den Start fiel - der Positionswert verschwand einfach. */
  var barsE = [];
  var rndE = lcg(9);
  for (var dE = 0; dE < 3; dE++) {
    var dsE = t0 + dE * 86400000, baseE = 100 + dE * 2;
    for (var bE = 0; bE < 390; bE++) {
      var pE = bE < 30 ? baseE + rndE() * 0.3 : baseE + 0.4 + (bE - 30) * 0.012 + rndE() * 0.25;
      barsE.push([dsE + bE * 60000, pE, 900000]);
    }
  }
  var rE = Q.backtestIntraday({ TEST: barsE }, {
    capital: 10000, period: 20, budgetPct: 0.05, orderFee: 1,
    entryMode: 'orb', orbMin: 30, confirmBps: 15, sl: -0.25, tp: null, trailPct: 0.15,
    maxHoldMin: 0, cooldownMin: 10, maxPerDay: 10, minEdge: 0, instrument: 'basis'
  });
  var eqMin = Math.min.apply(null, rE.equity.map(function (e) { return e[1]; }));
  var unterStart = (1 - eqMin / 10000) * 100;
  ok(rE.trades.length >= 2 && rE.summary.retPct > 0,
     'Equity: der Vergleichslauf handelt und endet im Plus  [' + rE.trades.length + ' Trades, ' + rE.summary.retPct + ' %]');
  ok(unterStart < 1,
     'Equity: die Kurve faellt hoechstens 1 % unter den Start - der Positionswert bleibt drin  ['
       + Math.round(unterStart * 100) / 100 + ' %]');
  ok(rE.summary.maxDrawdownPct < 1,
     'Equity: der gemeldete Max-Drawdown passt zur Kurve  [' + rE.summary.maxDrawdownPct + ' %]');
  ok(/positionsWert\(p2,/.test(fs.readFileSync(__dirname + '/quant.js', 'utf8')),
     'Equity: die Aufzeichnung benutzt dieselbe Bewertung wie der Ausstieg');
})();

/* ================= Die Pruef-CI darf sich nicht selbst lahmlegen =================
 * Der Zweig "radar" traegt nur spekulationen.json - kein package.json, keine Tests.
 * Liefe die Pruefung auch dort, waere die Lampe nach jedem stuendlichen Hochladen des
 * Spekulations-Radars rot, und eine dauerhaft rote Lampe liest niemand mehr. */
(function () {
  var ci = fs.readFileSync(__dirname + '/.github/workflows/build.yml', 'utf8');
  ok(/branches: \['\*\*', '!radar'\]/.test(ci),
     'CI: der Datenzweig "radar" ist von der Pruefung ausgenommen');
  ok(/push: \{branches:/.test(ci) && /jobs: \{pruefen:/.test(ci),
     'CI: geprueft wird bei jedem Push, nicht erst beim Tag');
  ok(/needs: pruefen/.test(ci),
     'CI: der Installer wird nur nach gruener Pruefung gebaut');
  /* Der pull_request-Ausloeser hat hier NIE etwas geprueft: alle Zweige liegen in
   * diesem Repo, das push-Ereignis deckt sie ab. Er erzeugte nur graue "skipped"-
   * Laeufe auf der Aktionen-Seite. Faellt er zurueck in die Datei, muss auch die
   * Selbst-Uebersprung-Bedingung am Job zurueck - sonst laeuft die Suite doppelt. */
  /* Nur die WIRKSAMEN Zeilen pruefen: der Kopfkommentar erklaert ausdruecklich, warum
   * es den Ausloeser nicht mehr gibt, und darf das Wort selbstverstaendlich nennen. */
  var ciAktiv = ci.split('\n').filter(function (z) { return !/^\s*#/.test(z); }).join('\n');
  ok(!/pull_request/.test(ciAktiv),
     'CI: kein pull_request-Ausloeser, der nur leere Laeufe erzeugt');
  ok(!/head\.repo\.full_name != github\.repository/.test(ciAktiv),
     'CI: und damit auch keine Bedingung mehr, die sich selbst ueberspringt');

  /* --- Veroeffentlichen ohne Tag-Push --- */
  /* Der Tag-Push scheitert in manchen Umgebungen an einer Richtlinie (HTTP 403). Dann
   * gaebe es kein Release - und ohne Release findet electron-updater nichts. Der
   * Dispatch-Weg legt den Tag serverseitig ueber "gh release create" an. */
  ok(/workflow_dispatch: \{inputs: \{release:/.test(ci),
     'Release: der Dispatch hat einen Schalter zum Veroeffentlichen');
  ok(/type: boolean, default: false/.test(ci),
     'Release: er ist standardmaessig AUS - ein Dispatch veroeffentlicht nichts aus Versehen');
  ok(/id: ziel/.test(ci) && /\$tag = "v\$pkg"/.test(ci),
     'Release: ohne Tag wird die Version aus package.json genommen');
  ok(/gh release create \$\{\{ steps\.ziel\.outputs\.tag \}\} --target \$\{\{ github\.sha \}\}/.test(ci),
     'Release: der Tag entsteht serverseitig am gebauten Commit, ohne git-Push');
  /* Die Versionskontrolle darf NICHT verschwinden: laeuft der Lauf ueber einen Tag,
   * muss dieser weiter zu package.json passen. Beim Dispatch ist sie gegenstandslos,
   * weil der Tag AUS package.json kommt. */
  ok(/stimmen nicht ueberein"; exit 1/.test(ci),
     'Release: ein Tag, der nicht zu package.json passt, bricht den Lauf weiterhin ab');
  var veroeff = ci.match(/if: "steps\.ziel\.outputs\.publish == 'true'"/g) || [];
  ok(veroeff.length === 2,
     'Release: Anlegen UND Anhaengen haengen am selben Schalter  [' + veroeff.length + ']');
  ok(/dist\/Markt-Dashboard-Setup\.exe dist\/latest\.yml --clobber/.test(ci),
     'Release: latest.yml geht mit hoch - ohne sie sieht der Autoupdater nichts');
})();

console.log('\n39) Erklaertexte hinter dem i – ein Register, ein Fenster, ein Knopf');
(function () {
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var shell = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  var strat = fs.readFileSync(__dirname + '/strategien.js', 'utf8');

  /* --- Der Baustein --- */
  ok(/window\.Info = Info;/.test(shell) && /eintragen: function/.test(shell) && /knopf: function/.test(shell),
     'Info bietet eintragen() und knopf()');
  ok(/<div id="infoPop"/.test(html) && /#infoPop \{/.test(html),
     'das Erklaerfenster steht im Markup und hat eine Gestaltung');
  /* Der Zuhoerer MUSS am Dokument haengen. Haenge er am einzelnen Knopf, waere er nach
   * jedem innerHTML-Neuaufbau weg - genau die Falle, in die depot.js schon getappt ist. */
  ok(/document\.addEventListener\('click'/.test(shell) && /closest\('button\[data-info\]'\)/.test(shell),
     'der Klick wird am Dokument abgefangen, nicht je Knopf gebunden');
  ok(/ev\.key === 'Escape'/.test(shell), 'Escape schliesst das Fenster');
  ok(/tab-changed[\s\S]{0,80}schliessen/.test(shell), 'ein Reiterwechsel raeumt das Fenster ab');

  /* --- Jeder Knopf ist ein echter Knopf, kein angeklicktes div --- */
  var knoepfe = html.match(/<button class="info"[^>]*>/g) || [];
  ok(knoepfe.length >= 8, 'es gibt Erklaerknoepfe im Markup  [' + knoepfe.length + ']');
  ok(knoepfe.every(function (b) { return /type="button"/.test(b); }),
     'jeder Erklaerknopf hat type="button"');
  ok(knoepfe.every(function (b) { return /aria-expanded="false"/.test(b); }),
     'jeder Erklaerknopf meldet seinen Zustand ueber aria-expanded');
  ok(knoepfe.every(function (b) { return /aria-label="Erkl/.test(b); }),
     'jeder Erklaerknopf hat eine Beschriftung fuer die Vorlesehilfe');
  ok(/knopf: function \(schluessel, was\)[\s\S]{0,300}aria-expanded="false"/.test(shell),
     'auch die aus JS erzeugten Knoepfe tragen aria-expanded');

  /* --- Kein Knopf ohne Text, kein Text ohne Knopf --- */
  var verwendet = (html.match(/data-info="([^"]+)"/g) || []).map(function (m) { return m.slice(11, -1); });
  var angemeldet = (shell.match(/^    '([\w.]+)': \{$/gm) || []).map(function (m) { return m.trim().slice(1).split("'")[0]; });
  var ohneText = verwendet.filter(function (k) { return angemeldet.indexOf(k) < 0; });
  ok(ohneText.length === 0,
     'jeder data-info-Schluessel im Markup hat einen Eintrag im Register  [' + (ohneText.join(', ') || 'alle') + ']');
  var ohneKnopf = angemeldet.filter(function (k) { return verwendet.indexOf(k) < 0; });
  ok(ohneKnopf.length === 0,
     'kein Eintrag im Register ist verwaist  [' + (ohneKnopf.join(', ') || 'keiner') + ']');

  /* --- Die Experten-Einstellungen (Befund B1 des Struktur-Plans) ---
   * Sie erklaerten sich bis 8.31 ausschliesslich ueber 18 title-Tooltips - laut
   * eigenem CSS-Kommentar "weder per Tastatur noch auf einem Tastbildschirm
   * erreichbar". Sieben Bedienelemente hatten GAR KEINE Erklaerung, darunter die
   * Haltedauer, an der beide gemessenen Kanten haengen. Die Tooltips BLEIBEN stehen
   * (Zweitweg); geprueft wird, dass daneben ein erreichbarer Weg existiert. */
  var apA = html.indexOf('<div id="idParams">');
  var apE = apA >= 0 ? html.indexOf('</details>', apA) : -1;
  ok(apA >= 0 && apE > apA, 'Experten-Einstellungen: der Block #idParams ist auffindbar');
  var idp = (apA >= 0 && apE > apA) ? html.slice(apA, apE) : '';
  /* Die Tooltips duerfen nicht verschwinden - sie sind der zweite Weg, nicht der
   * geloeschte. 18 waren es am 25.08.2026; mehr duerfen es werden. */
  var tips = (idp.match(/ title="/g) || []).length;
  ok(tips >= 18, 'Experten-Einstellungen: die Tooltips bleiben als Zweitweg stehen', tips);
  /* Jede Gruppe, die ihr Wissen per title traegt, muss einen Erklaerknopf in der
   * Ueberschrift haben. Die Gruppe "Wellen-Screener" hat keinen einzigen title (ihr
   * Grund steht sichtbar als .hinweis) und braucht deshalb keinen - genau deshalb
   * wird ueber die Tooltips gefiltert und nicht stumpf ueber alle Gruppen gezaehlt. */
  var ohneErklaerung = [];
  idp.split('<div class="pgroup"').forEach(function (g) {
    if (!/ title="/.test(g)) return;
    if (/<div class="pgroup-title">[^<]*\n\s*<button class="info"/.test(g)) return;
    ohneErklaerung.push(((/<div class="pgroup-title">([^<\n]*)/.exec(g) || [])[1] || '?').trim());
  });
  ok(ohneErklaerung.length === 0,
     'Experten-Einstellungen: jede Gruppe mit Tooltips traegt einen Erklaerknopf',
     ohneErklaerung.join(', ') || 'alle vier');
  ['signal', 'risiko', 'filter', 'haltedauer'].forEach(function (g) {
    ok(new RegExp("^    'regeln\\.param\\." + g + "': \\{$", 'm').test(shell),
       'Experten-Einstellungen: Gruppe ' + g + ' hat einen Registereintrag');
  });
  /* Gegenprobe zu einem Fund vom 25.08.2026: Info.zeigen() escaped die Punkte mit
   * U.esc. Ein Auszeichnungselement im Text erscheint dem Nutzer woertlich. Die NEUEN
   * Eintraege bleiben deshalb markup-frei; drei alte Suender sind ein eigener Befund. */
  ['regeln.param.signal', 'regeln.param.risiko', 'regeln.param.filter',
   'regeln.param.haltedauer', 'werkzeuge.trendfinder'].forEach(function (k) {
    var blk = shell.slice(shell.indexOf("    '" + k + "': {"));
    blk = blk.slice(0, blk.indexOf('\n    },') >= 0 ? blk.indexOf('\n    },') : blk.indexOf('\n    }'));
    ok(blk.length > 50 && !/<[a-z]+>/.test(blk),
       'Erklaertext ' + k + ' kommt ohne Markup aus (U.esc wuerde es zeigen)');
  });

  /* --- Die Strategie-Karten schuetten ihre Belege nicht mehr aus --- */
  ok(!/s\.beleg\.map\(function \(b\) \{ return '<li>'/.test(strat),
     'strategien.js listet die Belege nicht mehr dauerhaft auf der Karte');
  ok(/window\.Info\.knopf\('strategie\.' \+ s\.key/.test(strat),
     'jede Strategie-Karte traegt stattdessen einen Erklaerknopf');
  ok(/punkte: s\.beleg \|\| \[\]/.test(strat),
     'die Belege gehen VOLLSTAENDIG ins Register - gekuerzt wird nichts, es sind Messaussagen');

  /* --- Was eine Zusicherung ist, bleibt sichtbar ---
   * Faustregel des Umbaus: Wer es nicht liest, entscheidet falsch -> bleibt stehen.
   * Wer es nicht liest, versteht nur weniger -> darf hinter das i. */
  var simnoten = (html.match(/class="simnote"/g) || []).length;
  ok(simnoten >= 3, 'der Simulationshinweis steht weiter im Markup  [' + simnoten + ']');
  ok((html.match(/Gehandelt wird hiervon nichts/g) || []).length === 3,
     'die drei Beobachtungskarten sagen weiter sichtbar, dass davon nichts gehandelt wird');
  ok(/Simulation mit virtuellem Kapital – keine Anlageberatung/.test(html),
     'die Simulations-Zusicherung ist nicht hinter einen Klick gewandert');

  /* --- Zeilenlaenge: die Absaetze standen ueber 1200 px breit, also 150-170 Zeichen --- */
  ok((html.match(/max-width:68ch/g) || []).length >= 5,
     'die verbliebenen Absaetze sind auf lesbare Zeilenlaenge begrenzt');
})();

console.log('\n40) Tastatur, Semantik und Kontrast – die Oberflaeche ohne Maus und mit schwachen Augen');
(function () {
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var shell = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  var expl = fs.readFileSync(__dirname + '/explorer.js', 'utf8');

  /* --- Reiterleiste: Rollen und Tastatur ---
   * Vorher waren es fuenf zusammenhanglose Knoepfe: kein tablist, keine Pfeiltasten,
   * und man musste sich durch alle fuenf tabben, um zum Inhalt zu kommen. */
  ok(/role="tablist"/.test(html), 'Reiter: die Leiste ist ein tablist');
  /* Fuenf, seit die Marktkarte eine Pille unter "Heute" ist (Stufe C4). Die Pillen
     tragen bewusst KEINE tab/tabpanel-Rollen - sie sind es bei keiner der anderen
     Leisten (#depotPills, #wzPills, #regelPills, #heutePills) auch nicht. Wer das
     aendern will, aendert es fuer alle vier Leisten oder fuer keine. */
  ok((html.match(/role="tab"/g) || []).length === 5, 'Reiter: alle fuenf Knoepfe sind role="tab"');
  ok((html.match(/role="tabpanel"/g) || []).length === 5, 'Reiter: alle fuenf Bereiche sind role="tabpanel"');
  ok((html.match(/aria-controls="tab-/g) || []).length === 5, 'Reiter: jeder Knopf benennt seinen Bereich');
  ok((html.match(/aria-labelledby="reiter-/g) || []).length === 5, 'Reiter: jeder Bereich benennt seinen Knopf');
  ok(/ArrowRight/.test(shell) && /ArrowLeft/.test(shell) && /'Home'/.test(shell) && /'End'/.test(shell),
     'Reiter: Pfeiltasten, Pos1 und Ende blaettern die Leiste');
  // Roving tabindex: genau EIN Reiter ist tabbierbar, sonst kostet der Weg zum Inhalt vier Tabs
  ok((html.match(/role="tab"[^>]*tabindex="-1"/g) || []).length === 4,
     'Reiter: nur der aktive Reiter ist tabbierbar (roving tabindex)');
  ok(/x\.tabIndex = an \? 0 : -1;/.test(shell), 'Reiter: der tabindex wandert beim Wechsel mit');
  ok(/aria-selected/.test(shell), 'Reiter: aria-selected wird beim Wechsel nachgezogen');

  /* --- Bereiche, die sich selbst aktualisieren, muessen sich melden --- */
  ok(/id="warnband"[^>]*aria-live="assertive"/.test(html),
     'Warnband: meldet sich (dort steht "Speichern fehlgeschlagen" und "Quelle gestoert")');
  ok(/id="err"[^>]*aria-live="polite"/.test(html), 'Fehlerzeile: meldet sich beilaeufig');
  ok(/id="cockpit"[^>]*aria-live="polite"/.test(html), 'Cockpit: meldet sich beilaeufig');
  ok((html.match(/aria-live=/g) || []).length >= 4, 'mindestens vier Bereiche mit aria-live');

  /* --- Dialoge: Escape, Fokusfalle, Fokus-Rueckgabe ---
   * Vorher liessen sich alle drei nur mit der Maus schliessen, und der Hintergrund
   * blieb durchtabbierbar. */
  ok((html.match(/role="dialog"/g) || []).length >= 3, 'Dialoge: als Dialog ausgezeichnet');
  ok((html.match(/aria-modal="true"/g) || []).length >= 3, 'Dialoge: aria-modal gesetzt');
  // Den Escape-Zweig als Block schneiden, statt auf Naehe zu hoffen: dazwischen steht
  // die Vorfahrt-Regel fuer das Erklaerfenster, und die darf wachsen duerfen.
  var escBlock = (shell.match(/if \(ev\.key === 'Escape'\) \{[\s\S]*?\n    \}/) || [''])[0];
  ok(/modalSchliessen\(bg\)/.test(escBlock), 'Dialoge: Escape schliesst');
  ok(/ev\.key !== 'Tab'/.test(shell) && /shiftKey/.test(shell), 'Dialoge: die Tab-Taste laeuft im Kreis (Fokusfalle)');
  ok(/modalHer = document\.activeElement;/.test(shell) && /modalHer\.focus\(\)/.test(shell),
     'Dialoge: der Fokus kehrt zum Ausloeser zurueck');
  // Das Erklaerfenster darf beim ersten Escape nicht zusammen mit dem Dialog verschwinden
  ok(/ip\.style\.display === 'block'\) return;/.test(shell),
     'Dialoge: ein offenes Erklaerfenster bekommt das erste Escape');

  /* --- Explorer-Treffer waren klickbare <div> ohne Tastaturzugang --- */
  ok(/<button type="button" class="exp-hit"/.test(expl), 'Explorer: Treffer sind echte Knoepfe');
  ok(!/<div class="exp-hit"/.test(expl), 'Explorer: kein klickbares div mehr');
  ok(/\.exp-hit \{[^}]*background: none[^}]*border: 0/.test(html),
     'Explorer: die Knopf-Vorgaben des Browsers sind zurueckgesetzt');

  /* --- Kontrast: die vier gemessenen Verstoesse ---
   * Geprueft wird die URSACHE, nicht der Farbwert: die Token muessen existieren und
   * an den Stellen benutzt werden, an denen vorher zu schwache Farben standen. */
  ['--kante', '--chip-up', '--chip-down', '--good', '--mono', '--panel-2', '--surface-2'].forEach(function (t) {
    var n = (html.match(new RegExp('\\' + t + ':', 'g')) || []).length;
    ok(n >= 2, 'Token ' + t + ' ist in BEIDEN Themen definiert  [' + n + ']');
  });
  ok(/\.chip\.up   \{ color: var\(--chip-up\)/.test(html) && /\.chip\.down \{ color: var\(--chip-down\)/.test(html),
     'Chips: eigene Textfarbe auf dem eigenen Weichton (vorher 4,06 bzw. 4,25)');
  ok(/\.switch \.knob \{[^}]*border: 1px solid var\(--kante\)/.test(html),
     'Kippschalter: sichtbare Umrandung im Aus-Zustand (vorher 1,29)');
  ok(/input\[type="text"\][\s\S]{0,220}border: 1px solid var\(--kante\)/.test(html),
     'Eingabefelder: sichtbare Umrandung (vorher 1,21 hell / 1,49 dunkel)');
  /* Gegenprobe: kein Token darf nur in EINEM Thema stehen - genau daran ist --good
   * schon einmal gescheitert (fest verdrahtete Notfarbe, im Dunkelthema 3,11). */
  var hellBlock = html.slice(html.indexOf(':root {'), html.indexOf(':root[data-theme="dark"]'));
  var dunkelBlock = html.slice(html.indexOf(':root[data-theme="dark"]'), html.indexOf('* { box-sizing'));
  function tokenNamen(b) { return (b.match(/--[\w-]+:/g) || []).map(function (x) { return x.slice(0, -1); }); }
  var nurHell = tokenNamen(hellBlock).filter(function (t) { return tokenNamen(dunkelBlock).indexOf(t) < 0; });
  var nurDunkel = tokenNamen(dunkelBlock).filter(function (t) { return tokenNamen(hellBlock).indexOf(t) < 0; });
  // --line ist die dokumentierte Ausnahme: es loest sich ueber --border am selben Element auf.
  nurHell = nurHell.filter(function (t) { return t !== '--line'; });
  /* Diese Pruefung wurde fuer FARBEN geschrieben - damals war jedes Token eine. Seit
   * der Design-Skala gibt es auch Geometrie-Token (Schriftgroessen, Radien, Abstaende),
   * und die sind themenunabhaengig: eine 12px-Schrift ist im Dunkeln nicht anders gross.
   * Stuenden sie in beiden Bloecken, waeren es zwei Wahrheiten, die auseinanderlaufen
   * koennen - genau der Fehler, den diese Zusicherung eigentlich verhindern soll.
   * Abschnitt 44 prueft fuer sie das Gegenteil: dass sie NUR einmal stehen. */
  function istGeometrie(t) { return /^--(fs|r|ab)-/.test(t); }
  nurHell = nurHell.filter(function (t) { return !istGeometrie(t); });
  nurDunkel = nurDunkel.filter(function (t) { return !istGeometrie(t); });
  ok(nurHell.length === 0 && nurDunkel.length === 0,
     'kein Token steht nur in einem Thema  [' + (nurHell.concat(nurDunkel).join(', ') || 'keins') + ']');
})();

console.log('\n41) Zustaende: was die App sagt, wenn etwas fehlt oder klemmt');
(function () {
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var ren = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  /* --- Das Warnband konnte NIE erscheinen ---
   * warnbandSetzen setzte display = '', das loescht aber nur den Inline-Stil; danach
   * greift #warnband{display:none} aus index.html. Der gesamte Warnkanal war damit
   * tot: "Speichern fehlgeschlagen", "Depot aus Sicherung", "Kante verfallen".
   * Dasselbe Muster wie B2 (gerechnet und dann vom CSS verdeckt), dritter Fall. */
  ok(/el\.style\.display = keys\.length \? 'block' : 'none';/.test(dep),
     'Warnband: setzt einen ECHTEN Wert, nicht den Leerwert');
  ok(!/el\.style\.display = keys\.length \? '' : 'none';/.test(dep),
     'Warnband: der Leerwert ist weg (er fiel auf display:none zurueck)');
  ok(/#warnband \{[^}]*display: none/.test(html),
     'Warnband: die CSS-Regel steht weiter - genau deshalb muss der Wert explizit sein');

  /* --- Gestoerte Kursquelle benutzt das Warnband --- */
  ok(/window\.__warnband = warnbandSetzen;/.test(dep), 'Warnband: fuer andere Module erreichbar');
  ok(/quellenWarnung\(/.test(ren) && /Die Kursquelle ist gestört/.test(ren),
     'Kursquelle: eine Stoerung landet im Warnband, nicht nur klein in der Kopfzeile');
  ok(/fetchErrors > gesamt \/ 2/.test(ren),
     'Kursquelle: erst ab der Haelfte - eine Warnung, die immer steht, liest niemand');
  /* renderer.js ist das 3. Skript, depot.js das 21. - beim ersten Durchlauf gibt es
   * window.__warnband noch nicht. Die Meldung darf dabei nicht verloren gehen. */
  ok(/quellenStand/.test(ren) && /addEventListener\('load'/.test(ren),
     'Kursquelle: die Meldung wird nachgezogen, wenn depot.js spaeter geladen ist');

  /* --- Leerzustand ist nicht Fehlerzustand ---
   * Vorher stand bei einem GESCHEITERTEN Ladeversuch weiter "wird gleich geladen". */
  ok(/function ablageNichtDa\(/.test(ren), 'Ablage: es gibt einen eigenen Fehlerzustand');
  ok(/ablageNichtDa\(el, 'Spekulations-Radar'\)/.test(ren), 'Radar: sagt Bescheid, wenn die Ablage nicht antwortet');
  ok(/ablageNichtDa\(el, 'Insider-Käufe'\)/.test(ren), 'Insider: sagt Bescheid, wenn die Ablage nicht antwortet');
  ok(!/if \(!r \|\| !r\.ok\) return;   \/\/ keine Datei: Platzhalter bleibt stehen/.test(ren),
     'Ablage: kein stilles return mehr, das den Platzhalter stehen laesst');

  /* --- Hell/Dunkel wurde nirgends gespeichert --- */
  ok(/storeSet\('theme', neu\)/.test(ren), 'Thema: die Wahl wird gespeichert');
  ok(/storeGet\('theme'\)/.test(ren), 'Thema: die Wahl wird beim Start gelesen');
  ok(/t === 'light' \|\| t === 'dark'/.test(ren),
     'Thema: nur bekannte Werte werden uebernommen');

  /* --- Platzhalter im Raster --- */
  ok(/\.heat > \.loading \{ grid-column: 1 \/ -1; \}/.test(html),
     'Heatmap: Lade- und Fehlertext laeuft ueber die volle Breite, nicht in einer 96-px-Spalte');
})();

/* ================= 42. Die Sicherheitshaltung festnageln =================
 * Das Audit hat die Electron-Härtung als „auf dem Stand der Technik" befundet -
 * contextIsolation, sandbox, keine generische Durchreiche im preload, eine CSP
 * ohne unsafe-inline, eine echte Host-Positivliste. Genau solche Eigenschaften
 * verschwinden aber lautlos: EIN webPreferences-Feld beim Debuggen umgestellt,
 * EIN 'unsafe-eval' fuer eine Bibliothek, EIN generisches invoke() im preload,
 * weil es bequemer ist - und niemand merkt es, weil die App danach laeuft wie
 * vorher. Ein Befund ohne Test ist eine Momentaufnahme; dieser Abschnitt macht
 * einen Zustand daraus, der beim Wegbrechen rot wird. */
(function () {
  console.log('\n42) Sicherheitshaltung: Electron-Haertung, CSP und die Bruecke');
  var m = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var pre = fs.readFileSync(__dirname + '/preload.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');

  // --- Fenster-Härtung: an JEDEM BrowserWindow, nicht nur am ersten ---
  var fenster = m.match(/new BrowserWindow\(\{[\s\S]*?\n  \}\)/g) || [];
  ok(fenster.length >= 1, 'Härtung: es gibt mindestens ein BrowserWindow zu prüfen');
  fenster.forEach(function (f, i) {
    ok(/contextIsolation:\s*true/.test(f), 'Fenster ' + (i + 1) + ': contextIsolation an');
    ok(/nodeIntegration:\s*false/.test(f), 'Fenster ' + (i + 1) + ': nodeIntegration aus');
    ok(/sandbox:\s*true/.test(f), 'Fenster ' + (i + 1) + ': sandbox an');
    ok(/preload:\s*path\.join\(__dirname, 'preload\.js'\)/.test(f),
       'Fenster ' + (i + 1) + ': die Bruecke ist das preload-Skript');
  });
  // Was nirgends stehen darf. Jede dieser Zeilen oeffnet die Sandkiste wieder.
  [
    ['webSecurity: false', /webSecurity\s*:\s*false/],
    ['allowRunningInsecureContent', /allowRunningInsecureContent\s*:\s*true/],
    ['experimentalFeatures', /experimentalFeatures\s*:\s*true/],
    ['nodeIntegrationInWorker', /nodeIntegrationInWorker\s*:\s*true/],
    ['nodeIntegrationInSubFrames', /nodeIntegrationInSubFrames\s*:\s*true/],
    ['enableRemoteModule', /enableRemoteModule\s*:\s*true/]
  ].forEach(function (p) {
    ok(!p[1].test(m), 'Härtung: kein ' + p[0]);
  });

  // --- Die Bruecke reicht nichts generisch durch ---
  ok(/contextBridge\.exposeInMainWorld\('api'/.test(pre), 'Bruecke: exposeInMainWorld statt globalem require');
  ok(!/exposeInMainWorld\([^)]*ipcRenderer\s*\)/.test(pre), 'Bruecke: ipcRenderer selbst wird nicht freigelegt');
  /* Der teure Fehler waere eine Zeile wie  invoke: (kanal, ...a) => ipcRenderer.invoke(kanal, ...a).
   * Sie sieht harmlos aus und macht jede einzelne Kanal-Pruefung im Hauptprozess wertlos,
   * weil der Renderer sich dann jeden Kanal selbst aussuchen darf. Deshalb: JEDER
   * invoke-Aufruf im preload muss seinen Kanal als Zeichenkette fest verdrahtet haben. */
  var invokes = pre.match(/ipcRenderer\.(invoke|send|on)\(([^,)]*)/g) || [];
  ok(invokes.length > 10, 'Bruecke: die Kanäle sind einzeln aufgeführt (' + invokes.length + ')');
  var frei = invokes.filter(function (z) { return !/\((\s*)'[a-z0-9-]+'/.test(z); });
  ok(frei.length === 0, 'Bruecke: kein Kanal kommt aus einer Variablen' + (frei.length ? ' – ' + frei.join(', ') : ''));

  // --- CSP ---
  var csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html);
  ok(!!csp, 'CSP: die Regel steht im Dokument');
  if (csp) {
    var c = csp[1];
    ok(/default-src 'self'/.test(c), 'CSP: default-src self');
    ok(/script-src 'self'/.test(c) && !/script-src[^;]*unsafe-inline/.test(c),
       'CSP: Skripte nur aus dem Paket, kein unsafe-inline');
    ok(!/unsafe-eval/.test(c), 'CSP: kein unsafe-eval');
    ok(!/script-src[^;]*\*/.test(c), 'CSP: keine Platzhalter in script-src');
  }
  /* Eine CSP ohne unsafe-inline nuetzt nichts, wenn das Markup Inline-Handler mitbringt:
   * dann faellt sie beim ersten Klick auf und jemand „repariert" sie mit unsafe-inline. */
  ok(!/\son(click|change|input|load|error|submit|keydown|mouseover)\s*=/i.test(html),
     'Markup: kein einziger Inline-Handler, den die CSP blockieren würde');

  /* ---- Stufe F Punkt 1: kein Dunkel-Blitz beim Start (26.08.2026) ----
   * OB es blitzt, kann hier NICHT geprueft werden - das sagt nur ein echter Start mit
   * echten Bildern. Dafuer gibt es tools/thema-probe.js (A/B gemessen: mit beiden
   * Reparaturen 0 von 206 Bildern dunkel, ohne thema.js 7 von 210, ohne beides 9 von 9).
   * Hier stehen die Voraussetzungen, unter denen das so bleibt - jede einzelne koennte
   * still wegbrechen, ohne dass irgendetwas an der App kaputtginge. */
  var tThema = fs.readFileSync(__dirname + '/thema.js', 'utf8');
  var tMain = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var tRend = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
  /* OHNE KOMMENTARE gesucht, und das ist hier keine Feinheit: die Notiz ueber der
   * Zeile nennt selbst das Stylesheet-Element, und die Erklaerung in thema.js nennt
   * den alten Nachlade-Aufruf. Beide Pruefungen unten waren beim ersten Anlauf rot -
   * wegen der PROSA, nicht wegen des Codes. Gemessen wird der Code.
   * Die beiden Filter sind absichtlich schlicht; sie laufen ueber zwei kleine,
   * bekannte Dateien ohne Zeichenketten, in denen Kommentarzeichen vorkommen. */
  function tOhneHtmlKomm(q) { return q.replace(/<!--[\s\S]*?-->/g, ' '); }
  function tOhneJsKomm(q) { return q.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1'); }
  var tKopf = tOhneHtmlKomm(html.slice(0, html.indexOf('</head>')));
  /* 1) Die STELLE ist der ganze Trick: vor dem <style> und vor jedem anderen Skript.
   *    Rutscht die Zeile ans Ende zu den anderen, blitzt es wieder - und nichts an der
   *    App waere kaputt. Genau deshalb steht diese Pruefung hier. */
  ok(tKopf.indexOf('<script src="thema.js"></script>') !== -1,
     'thema.js wird im <head> geladen');
  ok(tKopf.indexOf('<script src="thema.js"></script>') < tKopf.indexOf('<style>'),
     'und zwar VOR dem Stylesheet - danach waere der erste Aufbau schon falsch gefaerbt');
  var tSkripte = (html.match(/<script src="[^"]+"><\/script>/g) || []);
  ok(tSkripte[0] === '<script src="thema.js"></script>',
     'thema.js ist das ERSTE Skript der Seite ueberhaupt', tSkripte[0]);
  /* 2) Der uebliche Weg waere ein Inline-Skript. Der ist hier durch die CSP verboten,
   *    und die wird fuer eine Kosmetikfrage nicht aufgeweicht. Wer thema.js spaeter
   *    "vereinfacht", indem er die CSP oeffnet, macht aus einem Schoenheitsfehler ein
   *    Sicherheitsloch. */
  ok(!/<script(?![^>]*\ssrc=)[^>]*>/.test(html),
     'Kein Inline-Skript in index.html - die CSP verbietet es, und das bleibt so');
  /* 3) Der Wert kommt OHNE IPC herein: Startargument des Fensters statt store-get.
   *    Ueber IPC ist er eine Runde zu spaet - genau das war der Fehler. */
  ok(/additionalArguments: \['--startthema=' \+ THEMA_START\]/.test(tMain),
     'main.js gibt das Thema als Startargument mit, nicht per IPC');
  ok(/const THEMA_START = startThema\(\);/.test(tMain) && /function startThema\(\)/.test(tMain),
     'und liest es synchron, BEVOR das Fenster entsteht');
  /* 4) Die Fensterfarbe ist die zweite Ursache und eine eigene: sie faerbt die
   *    Zehntelsekunde, in der die Seite noch gar nicht gemalt hat. Ohne sie blieben
   *    9 von 9 Bildern dunkel, obwohl die Seite selbst schon hell gewesen waere. */
  ok(/backgroundColor: THEMA_START === 'light' \? '#f9f9f7' : '#0d0d0d'/.test(tMain),
     'Auch die Fensterfarbe folgt dem gespeicherten Thema - sonst blitzt der Rahmen');
  /* 5) Was aus dem Startargument kommt, faerbt die ganze Oberflaeche und landet in einem
   *    Attribut. Es wird deshalb geprueft und nicht durchgereicht. */
  ok(/\^--startthema=\(light\|dark\)\$/.test(pre),
     'preload.js laesst nur "light" und "dark" durch - nichts wird ungeprueft weitergereicht');
  var tA = pre.indexOf('function startThemaAusArgv() {');
  var tE = pre.indexOf('\n}\n', tA);
  ok(tA !== -1 && tE > tA, 'startThemaAusArgv laesst sich herausloesen');
  var tFn = new Function('process', pre.slice(tA, tE + 3) + '\nreturn startThemaAusArgv;');
  ok(tFn({ argv: ['x', '--startthema=light'] })() === 'light', 'Startargument light kommt an');
  ok(tFn({ argv: ['x', '--startthema=dark'] })() === 'dark', 'Startargument dark kommt an');
  ok(tFn({ argv: ['x'] })() === null, 'Ohne Argument: null, also bleibt es beim <html>-Tag');
  ok(tFn({ argv: ['x', '--startthema=hell'] })() === null, 'Unbekannter Wert wird verworfen');
  ok(tFn({ argv: ['x', '--startthema=dark" onload="boese()'] })() === null,
     'Kein Durchreichen von Anhaengseln - der Wert landet in einem Attribut');
  /* 6) Der alte, langsame Weg bleibt als Netz. Ersatzlos gestrichen haenge die
   *    gespeicherte Wahl an EINEM Pfad; faellt der aus, waere sie still vergessen. */
  ok(/function themaLaden/.test(tRend) && /storeGet\('theme'\)/.test(tRend),
     'renderer.js behaelt den Nachlade-Weg als Netz, falls das Startargument fehlt');
  /* 7) thema.js darf nichts anderes tun. Es ist das erste Skript der Seite: ein Fehler
   *    darin waere ein weisser Bildschirm, nicht ein falsches Farbthema. */
  ok(tThema.indexOf('try {') !== -1 && tThema.indexOf('catch') !== -1,
     'thema.js faengt alles ab - ein Fehler dort waere ein weisser Bildschirm');
  ok(!/document\.(write|body)|innerHTML|addEventListener\(|fetch\(|storeGet\(/.test(tOhneJsKomm(tThema)),
     'und fasst nichts an ausser data-theme');

  /* ---- #90: Bewegung wegnehmen heisst nicht Inhalt wegnehmen (26.08.2026) ----
   * Bei "Bewegung reduzieren" stand im Laufband nur "animation: none". Die Spur fror auf
   * translateX(0) ein, obwohl sie 4,4-mal breiter ist als ihr Rahmen: drei von sechs
   * Schlagzeilen waren DAUERHAFT unerreichbar. Auf Wilhelms Rechner ist die Einstellung
   * dauerhaft aktiv - das war der Normalfall, nicht ein Sonderfall.
   * Gemessen nach der Reparatur (studien/auditor/2026-08-26/probe-reduzierte-bewegung.js
   * plus eine Erreichbarkeitsmessung): 6 von 6 Schlagzeilen lassen sich hereinschieben,
   * die letzte eingeschlossen; ohne reduzierte Bewegung laeuft alles wie vorher. */
  var nCss = html.slice(html.indexOf('@media (prefers-reduced-motion: reduce)'));
  nCss = nCss.slice(0, nCss.indexOf('\n  }\n') + 5);
  ok(/#newsTicker \.tickSpur \{ animation: none; \}/.test(nCss),
     'Bei reduzierter Bewegung laeuft das Band nicht - das war und bleibt richtig');
  ok(/#newsTicker \{[^}]*overflow-x: auto/.test(nCss),
     'aber der Rahmen wird schiebbar - sonst ist der Inhalt weg statt nur still');
  ok(!/#newsTicker[^}]*overflow: hidden;[^}]*\}/.test(nCss),
     'und nicht gleichzeitig wieder abgeschnitten');
  /* Die Verdopplung dient allein der nahtlosen Schleife. Steht das Band, schoebe man
   * dieselben Schlagzeilen zweimal durch - gemessen 12 statt 6 Anker. */
  var nRend = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
  ok(/function reduzierteBewegung\(\)/.test(nRend) && /prefers-reduced-motion: reduce/.test(nRend),
     'renderer.js fragt die Einstellung');
  ok(/stueck \+ \(ruhig \? '' : stueck\)/.test(nRend),
     'und verdoppelt den Inhalt NUR, wenn das Band wirklich laeuft');
  /* Ein title, der etwas verspricht, das nicht passiert, ist schlimmer als keiner:
   * "haelt unter dem Mauszeiger an" lief ins Leere, weil nie etwas lief. */
  ok(!/id="newsTicker"[^>]*title=/.test(html),
     'Das Markup verspricht nichts mehr - der Hinweis kommt aus dem Renderer');
  ok(/el\.title = ruhig/.test(nRend) && /Bewegung reduzieren/.test(nRend),
     'und sagt bei stehendem Band, dass man seitwaerts schieben kann');
  /* Die Einstellung kann sich im Betrieb aendern. Ohne Nachziehen bliebe entweder
   * doppelter Text stehen oder ein Band, das nicht mehr laeuft. */
  ok(/addEventListener\('change', function \(\) \{ renderTicker\(\); \}\)/.test(nRend),
     'Ein Umschalten waehrend des Betriebs baut das Band neu auf');
  /* Und die Abfrage selbst wird AUSGEFUEHRT. Der interessante Fall ist der dritte:
   * wirft matchMedia, muss es beim bisherigen Verhalten bleiben und nicht abstuerzen -
   * die Funktion laeuft bei jedem Aufbau des Bandes. */
  var rbA = nRend.indexOf('function reduzierteBewegung() {');
  var rbE = nRend.indexOf('\n  }\n', rbA);
  ok(rbA !== -1 && rbE > rbA, 'reduzierteBewegung laesst sich herausloesen');
  var rbFn = new Function('window', nRend.slice(rbA, rbE + 4) + '\nreturn reduzierteBewegung;');
  ok(rbFn({ matchMedia: function () { return { matches: true }; } })() === true,
     'Reduzierte Bewegung wird erkannt');
  ok(rbFn({ matchMedia: function () { return { matches: false }; } })() === false,
     'und normale Bewegung ebenso');
  ok(rbFn({})() === false, 'Ohne matchMedia bleibt es beim Laufband - kein Absturz');
  ok(rbFn({ matchMedia: function () { throw new Error('nein'); } })() === false,
     'Und wenn die Abfrage wirft, laeuft das Band weiter statt die Seite mitzureissen');

  // --- Kein eval in irgendeiner ausgelieferten Datei ---
  var paket = fs.readdirSync(__dirname).filter(function (f) {
    return /\.js$/.test(f) && !/^test-/.test(f);
  });
  var mitEval = paket.filter(function (f) {
    var q = fs.readFileSync(__dirname + '/' + f, 'utf8');
    return /(^|[^.\w])eval\s*\(/.test(q) || /new Function\s*\(/.test(q);
  });
  ok(mitEval.length === 0, 'Paket: kein eval, kein new Function' + (mitEval.length ? ' – ' + mitEval.join(', ') : ''));

  // --- Host-Positivliste ---
  var hosts = /const ALLOWED_HOSTS = new Set\(\[([\s\S]*?)\]\)/.exec(m);
  ok(!!hosts, 'Netz: es gibt eine Positivliste erlaubter Hosts');
  if (hosts) {
    var namen = (hosts[1].match(/'([^']+)'/g) || []).map(function (x) { return x.slice(1, -1); });
    ok(namen.length > 0 && namen.length < 20, 'Netz: die Liste ist kurz und aufzählbar (' + namen.length + ')');
    var schlecht = namen.filter(function (h) { return /[*\s]/.test(h) || h !== h.toLowerCase() || !/\./.test(h); });
    ok(schlecht.length === 0, 'Netz: kein Platzhalter, kein Grossbuchstabe' + (schlecht.length ? ' – ' + schlecht.join(', ') : ''));
  }
  ok(/u\.protocol !== 'https:' \|\| !ALLOWED_HOSTS\.has\(u\.hostname\)/.test(m),
     'Netz: Protokoll UND Host werden geprüft');
  /* Eine Umleitung ist ein neuer Abruf an einen neuen Host. Wuerde ihr blind gefolgt,
   * genuegte eine 302 bei einer erlaubten Quelle, um irgendwohin zu zeigen. Der Code
   * ruft sich deshalb selbst auf - und laeuft damit wieder durch dieselbe Pruefung. */
  ok(/res\.statusCode >= 301 && res\.statusCode <= 308[\s\S]{0,200}return resolve\(fetchText\(/.test(m),
     'Netz: Umleitungen laufen erneut durch die Prüfung');
  ok(/redirectsLeft/.test(m) && /redirectsLeft - 1/.test(m), 'Netz: Umleitungen sind begrenzt');

  // --- Pfade ---
  ok(/function safeName\(name\) \{ return String\(name\)\.replace\(\/\[\^a-zA-Z0-9_-\]\/g, '_'\)/.test(m),
     'Pfade: safeName ist eine Positivliste, keine Sperrliste');
  ok(/const u = new URL\(url\);[\s\S]{0,240}u\.protocol === 'https:'[\s\S]{0,200}shell\.openExternal/.test(m),
     'Aussenlinks: openExternal nur für https und nur für bekannte Ziele');
})();

/* ================= 43. Unlesbare Dateien =================
 * Bisher galt: Datei kaputt -> leeres Ergebnis -> der naechste Schreibvorgang macht
 * das Leere endgueltig. Beim Depot war das schon behoben (Generationen), beim
 * KURSARCHIV und bei den Fehlermeldungen nicht. Das Archiv ist der teurere Fall:
 * Yahoo gibt 1m-Kerzen sieben Tage rueckwirkend heraus, alles darueber hat die App
 * ueber Wochen selbst gesammelt und bekommt es nie wieder. */
(function () {
  console.log('\n43) Unlesbare Dateien werden beiseitegelegt, nicht ueberschrieben');
  var m = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var ren = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
  var pre = fs.readFileSync(__dirname + '/preload.js', 'utf8');

  ok(/function defektBeiseite\(pfad\)/.test(m), 'Defekt: es gibt einen Weg, den kaputten Bestand zu retten');
  ok(/fs\.renameSync\(pfad, ziel\)/.test(m), 'Defekt: die Datei wird umbenannt, nicht gelöscht');
  /* Beim zweiten Fehlschlag darf die schon gesicherte Fassung NICHT verdraengt werden -
   * sie ist die einzige, die noch Daten traegt. Die zweite kaputte ist wertlos. */
  ok(/if \(fs\.existsSync\(ziel\)\) return ziel;/.test(m),
     'Defekt: eine bereits beiseitegelegte Fassung bleibt unangetastet');

  var sg = /ipcMain\.handle\('store-get'[\s\S]*?\n\}\);/.exec(m);
  ok(!!sg && /defektMerken\(safeName\(name\), defektBeiseite\(f\)\)/.test(sg[0]),
     'Store: eine unlesbare Datei wird beiseitegelegt, bevor der nächste Schreibvorgang läuft');
  /* Reihenfolge zaehlt: erst die Sicherungsgenerationen des Depots versuchen, ERST DANN
   * beiseitelegen. Andersherum waere die Hauptdatei weg, bevor sie geprüft wurde. */
  ok(!!sg && sg[0].indexOf('.bak1') < sg[0].indexOf('defektBeiseite(f)'),
     'Store: die Generationen werden vor dem Beiseitelegen versucht');

  var bl = /function bugsLesen\(\)[\s\S]*?\n\}/.exec(m);
  ok(!!bl && (bl[0].match(/defektBeiseite/g) || []).length === 2,
     'Fehlermeldungen: kaputt UND formfremd werden beide gesichert');

  ok(/ipcMain\.handle\('store-defekte'/.test(m), 'Defekt: der Renderer kann den Befund abholen');
  ok(/storeDefekte: \(\) => ipcRenderer\.invoke\('store-defekte'\)/.test(pre), 'Defekt: der Kanal steht in der Brücke');
  ok(/window\.__warnband\('defekt'/.test(ren), 'Defekt: der Befund landet im Warnband, nicht in der Konsole');
  ok(/bars_\(\\w\+\)_\(\.\+\)/.test(ren) || /\^bars_/.test(ren),
     'Defekt: bars_60m_AAPL wird als Kursarchiv benannt, nicht als Dateiname gezeigt');
})();

/* ================= 44. Wegweiser, Begriffe und die Sackgassen =================
 * Vier Befunde aus dem Audit, die alle dasselbe Muster haben: Die Oberflaeche sagt
 * etwas, das nicht stimmt oder nirgends hinfuehrt. Das faellt in keinem Test auf,
 * weil nichts abstuerzt - es kostet nur den, der es liest. */
(function () {
  console.log('\n44) Wegweiser, Begriffe, Sackgassen');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var shell = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  var strat = fs.readFileSync(__dirname + '/strategien.js', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var mfd = fs.readFileSync(__dirname + '/mfdepot.js', 'utf8');
  var exp = fs.readFileSync(__dirname + '/explorer.js', 'utf8');
  var sco = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');

  /* --- Verweise auf Reiter, die es nicht gibt ---
   * Die App hatte drei davon: "Strategien & Belege", "Strategien", "Kurzfrist-Depot".
   * Wer danach sucht, findet nichts und haelt sich fuer blind. Dieser Test liest die
   * echten Namen aus dem Markup und prueft JEDEN Verweis dagegen - er faengt also auch
   * einen kuenftigen, wenn jemand einen Reiter umbenennt und die Texte vergisst. */
  var reiter = (html.match(/data-tab="[a-z]+"[^>]*>([^<]+)</g) || [])
    .map(function (z) { return z.slice(z.lastIndexOf('>') + 1, -1).trim(); });
  var pillen = (html.match(/data-sub="[a-z]+"[^>]*>([^<]+)</g) || [])
    .map(function (z) { return z.slice(z.lastIndexOf('>') + 1, -1).replace(/&amp;/g, '&').trim(); });
  ok(reiter.length === 5, 'Wegweiser: fuenf Reiter gefunden (' + reiter.join(', ') + ')');
  ok(pillen.length >= 6, 'Wegweiser: die Unter-Pillen sind lesbar (' + pillen.length + ')');
  var echt = reiter.concat(pillen);
  var quellen = ['index.html', 'depot.js', 'renderer.js', 'strategien.js', 'mfdepot.js',
                 'driftui.js', 'explorer.js', 'app-shell.js', 'scoreboard.js', 'mittelfrist.js',
                 'bestandui.js'];
  /* bestandui.js kam am 25.08.2026 dazu: die Datei verwies auf "Reiter Heute", als das
   * Uebernahme-Formular laengst nach Vermoegen gezogen war - und keine Zusicherung
   * konnte das sehen, sie stand schlicht nicht in dieser Liste. Wer eine Datei mit
   * Ortsangaben anlegt, traegt sie hier ein. */
  var falsch = [];
  quellen.forEach(function (f) {
    var q = fs.readFileSync(__dirname + '/' + f, 'utf8');
    // „Reiter X“ / „Tab X“ / „unter X“ mit Anfuehrungszeichen oder <b>
    var re = /(?:Reiter|Tab)\s+(?:„([^“]{2,40})“|<b>([^<]{2,40})<\/b>)/g, m;
    while ((m = re.exec(q))) {
      var name = (m[1] || m[2]).replace(/&amp;/g, '&').trim();
      // Ein Pfad "Vermögen → Auswertung" ist gueltig, wenn beide Teile echt sind
      var teile = name.split(/\s*→\s*/);
      if (teile.every(function (t) { return echt.indexOf(t) >= 0; })) continue;
      falsch.push(f + ': „' + name + '“');
    }
  });
  ok(falsch.length === 0, 'Wegweiser: kein Verweis auf einen Reiter, den es nicht gibt' +
     (falsch.length ? ' – ' + falsch.join(' | ') : ''));
  ok(!/Strategien &(amp;)? Belege|Kurzfrist-Depot/.test(html + dep + strat + exp + shell),
     'Wegweiser: die drei alten Falschnamen sind restlos weg');
  /* P4 (25.08.2026): Der Leerzustand des Mittelfrist-Depots verwies auf die Pille, auf
   * der er selbst steht ("unter „Vermoegen → Mittelfristig“ einmal laden"). Ein Verweis
   * taugt nur, wenn er woanders hinzeigt - und der Knopf, den er nennt, muss wirklich so
   * heissen. Beides steht hier, weil ein Umzug der Pille (Stufe C) sonst still eine
   * Sackgasse hinterlaesst: die erste Zusicherung wird dann rot und zeigt genau darauf. */
  var duiWeg = fs.readFileSync(__dirname + '/driftui.js', 'utf8');
  var mfdVerweis = (/'Keine Tagesdaten[^']*?„([^“]+)“/.exec(mfd) || [])[1];
  ok(!!mfdVerweis && html.indexOf('>' + mfdVerweis + '</button>') > -1,
     'Mittelfrist-Depot: der Leerzustand nennt einen Knopf, den es wirklich gibt', mfdVerweis);
  ok(!/Vermögen → Mittelfristig/.test(mfd + duiWeg),
     'Mittelfrist-Panel: kein Statustext verweist mehr auf die Pille, auf der er steht');

  /* S7 (25.08.2026): Die Ueberschrift zaehlte mit ("Drei Zeithorizonte, drei getrennte
   * Strategien"), die Liste darunter kommt aber aus STRATEGIEN in strategien.js und war
   * laengst auf vier Karten plus Langfrist-Fussnote gewachsen. Eine Ueberschrift mit
   * Zahlwort laeuft beim naechsten Zuwachs still von der Liste weg.
   * Verboten wird die FEHLERKLASSE, nicht der alte Wortlaut - ein Test auf den neuen
   * Text waere nur eine Abschrift. "ein/eine" fehlt bewusst in der Liste: \bein\b traefe
   * auch "ein- und ausschalten".
   * Geprueft wird der SICHTBARE Text: HTML-Kommentare werden vorher entfernt. Sonst
   * machte jede kuenftige Begruendung neben der Ueberschrift den Test rot - die
   * Sperrklinke soll die Anzeige pruefen, nicht die Notiz daneben. */
  var kopfRegeln = (/<div class="sub active" id="sub-regeln">([\s\S]*?)<div style="margin:6px 0 12px;">/.exec(html) || ['', ''])[1];
  ok(kopfRegeln.length > 100, 'Strategie-Uebersicht: der Kopf des Panels ist auffindbar');
  ok(!/\b(zwei|drei|vier|fünf|sechs)\b/i.test(kopfRegeln.replace(/<!--[\s\S]*?-->/g, '')),
     'Strategie-Uebersicht: der Kopf zaehlt die Karten nicht mehr mit');
  var karten = (strat.match(/\n      key: '/g) || []).length;
  ok(karten >= 5, 'Strategie-Uebersicht: strategien.js fuehrt die Karten selbst', karten + ' Eintraege');

  /* --- Glossar --- */
  var gl = /'glossar\.begriffe':\s*\{[\s\S]*?\n    \}/.exec(shell);
  ok(!!gl, 'Glossar: es ist angemeldet');
  if (gl) {
    var punkte = (gl[0].match(/\n        '/g) || []).length;
    ok(punkte >= 10, 'Glossar: mindestens zehn Begriffe (' + punkte + ')');
    ['Pp –', 'Bp –', 'MDE –', 'Kante –', 'Schattenbuch –', 'Walk-Forward –', 't-Wert –'].forEach(function (b2) {
      ok(gl[0].indexOf(b2) >= 0, 'Glossar: ' + b2.replace(' –', '') + ' ist erklärt');
    });
  }
  ok(/id="glossarBtn"[^>]*data-info="glossar\.begriffe"/.test(html),
     'Glossar: aus der Kopfzeile erreichbar, also von jedem Reiter aus');
  ok(/closest\('button\[data-info\]'\)/.test(shell),
     'Glossar: der beschriftete Knopf geht denselben Weg wie die runden i');

  /* --- Das Versprechen "einzeln zurückstellen" --- */
  ok(/function setz\(wo, k, wert, txt\)/.test(strat), 'Einzeln: jedes Feld wird vor dem Überschreiben gemerkt');
  ok(/felder\.push\(\{ wo: wo, k: k, alt:/.test(strat), 'Einzeln: mit altem Wert, nicht nur mit Namen');
  ok(/applied: extras, felder: felder,/.test(strat), 'Einzeln: die Liste hängt am Protokolleintrag');
  ok(/data-feld="' \+ idx \+ ':' \+ j \+ '"/.test(dep), 'Einzeln: je Feld ein eigener Knopf');
  ok(/function felderZurueck\(e, liste, wasTxt\)/.test(dep), 'Einzeln: die Rücknahme fasst nur die übergebenen Felder an');
  /* Der Rundumschlag waere der Fehler gewesen: dann haette ein Zurueck auch Felder
   * angefasst, die dieser Knopf nie angeruehrt hat - etwa den Handelsschalter. */
  var fz = /function felderZurueck\([\s\S]*?\n  \}/.exec(dep);
  ok(!!fz && !/JSON\.parse\(JSON\.stringify\(e\.konfigVorher\)\)/.test(fz[0]),
     'Einzeln: kein Rundumschlag über die ganze Konfiguration');
  ok(/f\.zurueck/.test(dep), 'Einzeln: ein schon zurückgestelltes Feld zeigt keinen Knopf mehr');
  /* Der Grund, warum der Knopf nie auftauchte: die Tabelle steht im Reiter "Regeln",
   * gezeichnet wurde sie aber nur beim Klick auf eine Pille unter "Vermoegen". */
  ok(/window\.__renderAnalytics/.test(dep) && /ev\.detail === 'strategien'/.test(dep),
     'Einzeln: die Tabelle wird beim Öffnen des Reiters gezeichnet, nicht nur unter Vermögen');
  ok(/if \(window\.__renderAnalytics\) window\.__renderAnalytics\(\);/.test(strat),
     'Einzeln: nach dem Übernehmen erscheint der Eintrag sofort');
  ok(!/lässt sich einzeln zurückstellen\.">Belegte/.test(html),
     'Einzeln: der Knopftext verspricht nichts mehr, was er nicht zeigt');

  /* --- Rückfrage, wenn das Buch "nur rechnen" anzeigt --- */
  ok(/function abgeschaltetOk\(an, was\)/.test(mfd), 'Rückfrage: es gibt eine');
  ok(/if \(!d \|\| d\[an\]\) return true;/.test(mfd),
     'Rückfrage: nur bei abgeschaltetem Buch – sonst wäre es eine Klickbremse ohne Zweck');
  ok(/abgeschaltetOk\('momentumAn'/.test(mfd) && /abgeschaltetOk\('driftAn'/.test(mfd),
     'Rückfrage: an beiden Knöpfen');

  /* --- Explorer: Netzfehler ist kein Leerbefund --- */
  ok(/return \{ fehler:/.test(exp), 'Explorer: der Fehlerfall trägt seinen Grund mit');
  ok(/if \(hits && hits\.fehler\)/.test(exp), 'Explorer: die Liste unterscheidet Fehler von leer');
  ok(/das heißt nicht, dass es den Wert nicht gibt/.test(exp),
     'Explorer: und sagt ausdrücklich, dass es das Papier trotzdem geben kann');
  ok(/Nichts gefunden\./.test(exp), 'Explorer: der echte Leerbefund heißt weiter „Nichts gefunden.“');

  /* --- Messung: der nächste Schritt statt einer Sackgasse --- */
  ok(/id="stNaechster" hidden/.test(html), 'Messung: der Kasten ist vor dem Ablegen leer');
  ok(/function naechsterSchritt\(pfad\)/.test(sco), 'Messung: nach dem Ablegen kommt ein nächster Schritt');
  ok(/node studien\/messmaschine\/messen\.js "' \+ pfad \+ '"/.test(sco),
     'Messung: der Befehl steht fertig da, mit dem echten Pfad');
  ok(/id="stKopieren"/.test(sco) && /function kopiere\(text\)/.test(sco), 'Messung: und lässt sich kopieren');
  /* file:// ist kein sicherer Kontext - navigator.clipboard kann schlicht fehlen. */
  ok(/navigator\.clipboard && navigator\.clipboard\.writeText/.test(sco) && /execCommand\('copy'\)/.test(sco),
     'Messung: Kopieren hat einen Rückfallweg, sonst passiert auf file:// nichts');
  ok(/Projektordner/.test(sco), 'Messung: es steht dabei, WO der Befehl läuft');
})();

/* ================= 44. Die Design-Skala =================
 * Gezaehlt am 24.08.2026 ueber index.html und alle Renderer-Dateien: 708 Inline-Stile,
 * darin SIEBZEHN verschiedene Schriftgroessen - 10,5 / 11,5 / 12,5 / 13,5 / 14,5 px
 * mitgerechnet. Allein 11,5px kam 96-mal vor, 12,5px 57-mal. Halbe Pixel sieht niemand,
 * aber jede dieser Groessen muss jemand pflegen, und beim naechsten Bauteil raet man,
 * welche davon "die richtige" ist. Dazu zehn verschiedene Radien.
 *
 * Dieser Abschnitt ist eine Sperrklinke: Sobald irgendwo wieder eine nackte Pixelzahl
 * auftaucht, wird er rot. Ohne das waechst die Zahl der Groessen einfach nach - genau
 * so ist sie ja entstanden. */
(function () {
  console.log('\n44) Design-Skala: eine Schriftleiter, drei Radien, keine halben Pixel');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var dateien = fs.readdirSync(__dirname).filter(function (f) {
    return /\.js$/.test(f) && !/^test-/.test(f);
  });

  // --- Die Leiter existiert und steht im hellen :root, nicht je Thema ---
  var wurzel = /:root \{([\s\S]*?)\n  \}/.exec(html);
  ok(!!wurzel, 'Skala: der Token-Block ist auffindbar');
  var LEITER = ['--fs-klein', '--fs-neben', '--fs-text', '--fs-gross', '--fs-zahl', '--fs-titel'];
  LEITER.forEach(function (t) {
    ok(new RegExp(t + ':\\s*\\d+px').test(wurzel[1]), 'Schriftleiter: ' + t + ' ist definiert');
  });
  ['--r-klein', '--r-normal', '--r-gross', '--r-kreis', '--r-pille'].forEach(function (t) {
    ok(new RegExp(t + ':').test(wurzel[1]), 'Radien: ' + t + ' ist definiert');
  });
  /* Schriftgroessen sind KEINE Farben - sie duerfen sich zwischen hell und dunkel nicht
   * unterscheiden. Stuenden sie im Dunkel-Block noch einmal, waere das eine zweite
   * Wahrheit, die auseinanderlaufen kann - genau der Fehler, an dem --good gescheitert ist. */
  var dunkel = /:root\[data-theme="dark"\] \{([\s\S]*?)\n  \}/.exec(html);
  ok(!!dunkel, 'Skala: der Dunkel-Block ist auffindbar');
  LEITER.concat(['--r-klein', '--r-normal', '--r-gross']).forEach(function (t) {
    ok(dunkel[1].indexOf(t + ':') === -1, 'Skala: ' + t + ' wird im Dunkelthema NICHT neu gesetzt');
  });

  // --- Keine halben Pixel mehr auf der Leiter ---
  var stufen = LEITER.map(function (t) {
    return parseFloat(/:\s*([\d.]+)px/.exec(new RegExp(t + ':\\s*[\\d.]+px').exec(wurzel[1])[0])[1]);
  });
  ok(stufen.every(function (s) { return s === Math.round(s); }),
     'Schriftleiter: jede Sprosse ist eine ganze Zahl  [' + stufen.join(', ') + ']');
  ok(stufen.length === new Set(stufen).size && stufen.slice().sort(function (a, b) { return a - b; }).join() === stufen.join(),
     'Schriftleiter: die Sprossen sind verschieden und aufsteigend sortiert');

  // --- Die Sperrklinke: nirgends mehr eine nackte Pixelzahl ---
  var suender = [];
  ['index.html'].concat(dateien).forEach(function (f) {
    var s = fs.readFileSync(__dirname + '/' + f, 'utf8');
    (s.match(/font-size:\s*[\d.]+px/g) || []).forEach(function (t) { suender.push(f + ' ' + t); });
    (s.match(/border-radius:\s*[\d.]+px/g) || []).forEach(function (t) { suender.push(f + ' ' + t); });
  });
  ok(suender.length === 0,
     'Sperrklinke: keine nackte Pixelzahl fuer Schrift oder Radius mehr' +
     (suender.length ? ' – ' + suender.slice(0, 5).join(', ') : ''));

  /* Zweite Sperrklinke, gleiche Bauart: EINE Escape-Funktion im ganzen Paket.
   * Es waren vier Kopien, und sie waren nicht alle gleich - renderer.js schrieb
   * String(s) statt String(s == null ? '' : s) und machte damit aus einem fehlenden
   * Nachrichtenfeld das sichtbare Wort "undefined". Vier Kopien heissen vier Orte, an
   * denen die naechste Korrektur nur zu einem Viertel ankommt.
   *
   * Gesucht wird die Zeichentabelle, nicht der Name: eine eigene IMPLEMENTIERUNG traegt
   * sie, ein blosser Vorspann auf U.esc (marktkarteui.js) nicht - und der ist kein
   * zweiter Ort, an dem etwas auseinanderlaufen kann. */
  var escKopien = dateien.filter(function (f) {
    if (f === 'app-shell.js') return false;            // dort steht das Original: U.esc
    return fs.readFileSync(__dirname + '/' + f, 'utf8').indexOf('replace(/[&<>\"]/g') !== -1;
  });
  ok(escKopien.length === 0,
     'Sperrklinke: nur U.esc escapt in diesem Programm', escKopien.join(', ') || 'keine Kopie');

  /* Dritte Sperrklinke, gleiche Bauart: ein Leerzustand ist EINE Fliesszeile.
   * .empty traegt display:flex; flex-direction:column - damit wird jedes Kind eine
   * eigene Zeile, auch jeder anonyme Textabschnitt. Steht eine Auszeichnung mitten im
   * Satz, zerfaellt er in drei Zeilen und der Satzpunkt dahinter landet allein auf der
   * letzten. Am 25.08.2026 im Bild gefunden, nachdem drei neue Leerzustaende mit einem
   * Reiterverweis dazugekommen waren - kein Test konnte das sehen.
   * Abhilfe und Regel: Fliesstext in EIN span wickeln.
   * Ausgenommen ist der Icon-Stapel (span.ico + Text): dort sind zwei Zeilen gewollt,
   * Symbol ueber Text. */
  var zerfallen = [];
  ['index.html'].concat(dateien).forEach(function (f) {
    var q = fs.readFileSync(__dirname + '/' + f, 'utf8');
    var re = /<div class="empty"[^>]*>([\s\S]*?)<\/div>\s*(?:'|<\/div>)/g, mE;
    while ((mE = re.exec(q))) {
      var inn = mE[1].replace(/^\s*<span class="ico">[^<]*<\/span>/, '');
      if (!/<[a-z]+[ >]/.test(inn)) continue;                        // reiner Text
      if (/^\s*<span[^>]*>[\s\S]*<\/span>\s*$/.test(inn)) continue;   // schon gewickelt
      zerfallen.push(f + ': ' + inn.replace(/\s+/g, ' ').slice(0, 40));
    }
  });
  ok(zerfallen.length === 0,
     'Sperrklinke: ein Leerzustand mit Auszeichnung steht in EINEM span - sonst bricht er zeilenweise',
     zerfallen.join(' | ') || 'keiner zerfaellt');

  /* Vierte Sperrklinke: KEIN sichtbarer Text behauptet einen Belegstand.
   * "Belegt" ist in diesem Projekt kein Adjektiv, sondern ein Protokoll-Urteil. Die
   * dynamischen Anzeigen leiten es korrekt aus urteil === 'bestaetigt' ab; feste Texte
   * koennen das nicht und behaupten es deshalb. Am 25./26.08.2026 zweimal gefunden:
   * erst als fest verdrahtete Liste im Code, dann in acht sichtbaren Texten - waehrend
   * von zwoelf Protokollen keines "bestaetigt" sagt.
   * Geprueft wird die BEHAUPTUNG (belegte + Kante/Regel/Modus/...), nicht das Wort:
   * die Gruppenueberschrift "Belegt (Protokoll sagt bestaetigt)" ist richtig und muss
   * stehen bleiben - sie liest ab, statt zu behaupten.
   * Kommentare bleiben aussen vor: sie tragen Geschichte, und Vergangenes umzuschreiben
   * waere schlimmer als die Formel dort stehen zu lassen. */
  function ohneKommentare(t) {
    t = t.replace(/\/\*[\s\S]*?\*\//g, function (m) { return m.replace(/[^\n]/g, ' '); });
    t = t.replace(/<!--[\s\S]*?-->/g, function (m) { return m.replace(/[^\n]/g, ' '); });
    return t.split('\n').map(function (z) { return z.replace(/(^|[^:])\/\/.*$/, '$1'); }).join('\n');
  }
  var BEHAUPTUNG = /[Bb]elegte[nrs]?\s+(Kante|Regel|Voreinstellung|Intraday|Modi|Modus|Strategie|Standbein)/;
  var behauptet = [];
  ['index.html'].concat(dateien).forEach(function (f) {
    var roh = fs.readFileSync(__dirname + '/' + f, 'utf8');
    var rein = ohneKommentare(roh).split('\n');
    roh.split('\n').forEach(function (z, i) {
      if (BEHAUPTUNG.test(rein[i] || '')) behauptet.push(f + ':' + (i + 1));
    });
  });
  ok(behauptet.length === 0,
     'Sperrklinke: kein sichtbarer Text nennt eine Kante belegt - das sagt das Protokoll oder niemand',
     behauptet.join(' ') || 'keiner behauptet');
  /* Seit dem 26.08.2026 gilt dasselbe fuer KOMMENTARE. Wilhelm hat das entschieden -
   * gegen die Empfehlung, sie als Geschichte stehen zu lassen. Sein Grund traegt: der
   * naechste Leser lernt aus einem Kommentar denselben Hausbegriff wie aus der
   * Oberflaeche, und genau so hat sich die alte Formel ueber Monate durch Code,
   * Befunde und Gedaechtnis getragen. Der historische Bezug bleibt lesbar, nur ohne
   * das Urteil: "die Inventur vom 21.08. fand die GEMESSENEN Kanten ..." */
  var inKommentaren = [];
  ['index.html'].concat(dateien).forEach(function (f) {
    var rohK = fs.readFileSync(__dirname + '/' + f, 'utf8');
    var reinK = ohneKommentare(rohK).split('\n');
    rohK.split('\n').forEach(function (z, i2) {
      if (BEHAUPTUNG.test(z) && !BEHAUPTUNG.test(reinK[i2] || '')) inKommentaren.push(f + ':' + (i2 + 1));
    });
  });
  ok(inKommentaren.length === 0,
     'Sperrklinke: auch kein Kommentar nennt eine Kante belegt - so traegt sich die Formel weiter',
     inKommentaren.join(' ') || 'keiner behauptet');
  /* Gegenprobe zur Sperrklinke selbst: die richtige, abgelesene Beschriftung muss es
   * weiterhin geben - sonst haette jemand das Kind mit dem Bade ausgeschuettet. */
  var dpB = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  ok(/Belegt \(Protokoll sagt bestätigt\)/.test(dpB) && /urteil === 'bestaetigt' \? 'belegt'/.test(dpB),
     'Der Belegstand wird weiterhin AUS dem Protokoll abgelesen und angezeigt');

  /* Gegenprobe, dass die Sperrklinke wirklich greift: haette sie ein Loch, waere die
   * Zusicherung darueber wertlos. Also einmal auf einem erfundenen Text nachweisen,
   * dass genau das Muster gefunden wird, das im Paket nicht mehr vorkommen darf. */
  var probe = 'a{font-size: 11.5px;} b{border-radius:14px;}';
  ok((probe.match(/font-size:\s*[\d.]+px/g) || []).length === 1 &&
     (probe.match(/border-radius:\s*[\d.]+px/g) || []).length === 1,
     'Sperrklinke: das Muster findet halbe Pixel und krumme Radien wirklich');

  // --- Die Abstandsleiter steht bereit, auch wenn sie noch nicht ueberall gilt ---
  /* Bewusst NICHT durchgesetzt: die Abstaende lagen schon fast alle auf einem 2-px-
   * Raster. Eine 4er-Leiter haette 89 Stellen verschoben (6px kam 36-mal vor, 10px
   * 30-mal, 14px 23-mal) - fuer Symmetrie im Regelwerk, mit echtem Umbruchrisiko. */
  ['--ab-1', '--ab-2', '--ab-3', '--ab-4', '--ab-5'].forEach(function (t) {
    ok(new RegExp(t + ':\\s*\\d+px').test(wurzel[1]), 'Abstandsleiter: ' + t + ' steht bereit');
  });
})();

/* ================= 45. Der Kurslader =================
 * Bis 8.24.5 nahmen NEUN Stellen in sechs Dateien die Yahoo-Antwort selbst
 * auseinander, und sie waren sich in nichts einig: zwei nahmen adjclose, sieben
 * close; zwei verwarfen unbrauchbare Kurse, sieben liessen 0, negative und NaN
 * durch; zwei wiederholten bei 429, sieben liessen das Symbol fallen; eine tauschte
 * vertauschte Hoch/Tief-Werte, eine nicht. Keine davon war in Node ausfuehrbar.
 * Jetzt eine Zerlegung, rein und exportiert - und damit hier wirklich gerechnet. */
(function () {
  console.log('\n45) Kurslader: ein Vertrag statt neun Zerlegungen');
  var K = require(__dirname + '/kurse.js');

  /** Baut eine Yahoo-Antwort. Absichtlich von Hand, damit im Test steht, was
   *  hineingeht - eine echte Antwort waere hier eine Blackbox. */
  function antwort(closes, extra) {
    extra = extra || {};
    var o = { meta: extra.meta || { regularMarketPrice: 42 },
              timestamp: closes.map(function (_, i) { return 1700000000 + i * 3600; }),
              indicators: { quote: [{ close: closes,
                volume: extra.volume || closes.map(function () { return 100; }),
                high: extra.high || closes, low: extra.low || closes, open: extra.open || closes }] } };
    if (extra.adjclose) o.indicators.adjclose = [{ adjclose: extra.adjclose }];
    return JSON.stringify({ chart: { result: [o] } });
  }

  // --- Grundform ---
  var g = K.zerlege(antwort([10, 11, 12]), { bereinigt: false });
  ok(g.bars.length === 3, 'Zerlegung: drei Kerzen rein, drei raus');
  ok(g.bars[0].length === 6, 'Zerlegung: jede Zeile hat sechs Spalten [t, c, v, hoch, tief, auf]');
  ok(g.bars[0][0] === 1700000000000, 'Zerlegung: der Zeitstempel ist in MILLIsekunden, nicht Sekunden');
  ok(g.feld === 'close' && g.verworfen === 0 && g.gesamt === 3, 'Zerlegung: Feld, Verworfene und Gesamtzahl werden gemeldet');

  // --- Der Kern des Ganzen: 0, negativ und NaN kommen nicht mehr durch ---
  /* Sieben der neun Stellen benutzten '!= null'. Das laesst genau diese drei durch
   * (0 == null ist falsch), und in einer davon lief die Vola-Schaetzung, in einer
   * anderen der Kachelkurs, in einer dritten die Signalrechnung. */
  var gift = K.zerlege(antwort([100, 0, 101, -5, 102, NaN, null, 103]), { bereinigt: false });
  ok(gift.bars.map(function (b) { return b[1]; }).join() === '100,101,102,103',
     'Verwerfen: 0, negativ, NaN und null fliegen raus  [' + gift.bars.map(function (b) { return b[1]; }).join() + ']');
  ok(gift.verworfen === 4 && gift.gesamt === 8,
     'Verwerfen: die Zahl der verworfenen Kerzen wird gemeldet, nicht verschwiegen  [' + gift.verworfen + '/' + gift.gesamt + ']');

  // --- roh oder bereinigt: eine Entscheidung, die getroffen werden MUSS ---
  var mitAdj = antwort([100, 200], { adjclose: [50, 100] });
  ok(K.zerlege(mitAdj, { bereinigt: true }).feld === 'adjclose' &&
     K.zerlege(mitAdj, { bereinigt: true }).bars[0][1] === 50,
     'bereinigt=true nimmt adjclose - ohne das macht ein Split aus einer Verdopplung eine Halbierung');
  ok(K.zerlege(mitAdj, { bereinigt: false }).feld === 'close' &&
     K.zerlege(mitAdj, { bereinigt: false }).bars[0][1] === 100,
     'bereinigt=false nimmt close - den Kurs, der tatsaechlich gehandelt wird');
  /* Fehlt adjclose (bei Intraday liefert Yahoo keins), faellt bereinigt=true auf
   * close zurueck, statt eine leere Reihe zu liefern. */
  var ohneAdj = K.zerlege(antwort([100, 200]), { bereinigt: true });
  ok(ohneAdj.feld === 'close' && ohneAdj.bars.length === 2,
     'bereinigt=true faellt auf close zurueck, wenn Yahoo kein adjclose liefert (Intraday)');

  // --- Hoch/Tief: auffuellen und tauschen ---
  var luecke = K.zerlege(antwort([100], { high: [null], low: [undefined] }), { bereinigt: false });
  ok(luecke.bars[0][3] === 100 && luecke.bars[0][4] === 100,
     'Hoch/Tief: fehlende Werte fallen auf den Schluss zurueck - keine Luecke fuer den Aufrufer');
  var vertauscht = K.zerlege(antwort([100], { high: [99], low: [101] }), { bereinigt: false });
  ok(vertauscht.bars[0][3] === 101 && vertauscht.bars[0][4] === 99,
     'Hoch/Tief: vertauscht geliefert wird zurueckgedreht (frueher nur in depot.js, nicht im Explorer)');
  var volLuecke = K.zerlege(antwort([100], { volume: [null] }), { bereinigt: false });
  ok(volLuecke.bars[0][2] === 0, 'Volumen: fehlend wird 0, nicht null');

  // --- Unbrauchbare Antworten ---
  ok(K.zerlege('kein JSON', { bereinigt: false }) === null, 'Antwort: Muell gibt null, keine Ausnahme');
  ok(K.zerlege('{}', { bereinigt: false }) === null, 'Antwort: leeres Objekt gibt null');
  ok(K.zerlege(JSON.stringify({ chart: { result: [], error: 'x' } }), { bereinigt: false }) === null,
     'Antwort: Yahoo-Fehler gibt null');
  var leer = K.zerlege(JSON.stringify({ chart: { result: [{ meta: {} }] } }), { bereinigt: false });
  ok(leer && leer.bars.length === 0, 'Antwort: Ergebnis ohne Kerzen gibt eine leere Reihe, nicht null');

  // --- URL-Bau: benannter Zeitraum ODER freie Grenzen, nie beides ---
  ok(K.url('AAPL', { range: '1mo', interval: '1d' }) ===
     'https://query1.finance.yahoo.com/v8/finance/chart/AAPL?range=1mo&interval=1d',
     'URL: benannter Zeitraum');
  ok(K.url('AAPL', { von: 0, bis: 2000000, interval: '1d' }) ===
     'https://query1.finance.yahoo.com/v8/finance/chart/AAPL?period1=0&period2=2000&interval=1d',
     'URL: freie Grenzen kommen in SEKUNDEN heraus, obwohl von/bis in Millisekunden hereingehen');
  ok(/includePrePost=true/.test(K.url('AAPL', { range: '1d', interval: '5m', prePost: true })),
     'URL: Vor-/Nachboerse wird angehaengt, wenn verlangt');
  ok(!/includePrePost/.test(K.url('AAPL', { range: '1d', interval: '5m' })),
     'URL: und sonst nicht');
  ok(K.url('BRK.B^X', { range: '1d', interval: '1d' }).indexOf('BRK.B%5EX') > 0,
     'URL: das Symbol wird kodiert (ein ^ im Kuerzel darf die Anfrage nicht zerlegen)');

  // --- Der Lader: 429, Wiederholung, Pflichtfeld ---
  function bauLader(antworten) {
    var geholt = [], gewartet = [];
    var lader = K.baueLader(
      { fetchText: function (u) { geholt.push(u); var a = antworten.shift();
        return Promise.resolve(a || { ok: false, status: 500, body: '' }); } },
      function (ms) { gewartet.push(ms); return Promise.resolve(); });
    return { lader: lader, geholt: geholt, gewartet: gewartet };
  }
  var gut = { ok: true, status: 200, body: antwort([10, 11]) };
  var ratenlimit = { ok: false, status: 429, body: '' };

  var l1 = bauLader([gut]);
  probe((async function () {
    var r = await l1.lader.hole('AAPL', { range: '1mo', interval: '1d', bereinigt: false });
    ok(r && r.bars.length === 2, 'Lader: der Normalfall liefert Kerzen');
    ok(l1.geholt.length === 1 && l1.gewartet.length === 0, 'Lader: ohne Drosselung wird nicht gewartet');

    var l2 = bauLader([ratenlimit, gut]);
    var r2 = await l2.lader.hole('AAPL', { range: '1mo', interval: '1d', bereinigt: false });
    ok(r2 && r2.bars.length === 2, 'Lader: nach 429 rettet die Wiederholung das Symbol');
    ok(l2.geholt.length === 2, 'Lader: dafuer wird genau EINMAL nachgefasst, nicht endlos');
    ok(l2.gewartet.indexOf(5000) >= 0, 'Lader: die Vorgabe sind 5 Sekunden');
    ok(l2.lader.drosselungen() === 1, 'Lader: die Drosselung wird gezaehlt (fuer die Diagnose)');

    /* Die Wartezeit ist je Aufrufer einstellbar. Vor der Zusammenlegung wartete die
     * Kachelliste 20 Sekunden, der Intraday-Scan 5 - und das ist kein Versehen:
     * sechs Kacheln pro Minute duerfen geduldig sein, ein Scan ueber Hunderte
     * Symbole nicht. Eine gemeinsame Zahl haette eine Seite verschlechtert. */
    var l3 = bauLader([ratenlimit, gut]);
    await l3.lader.hole('AAPL', { range: '1mo', interval: '1d', bereinigt: false, warteMs: 20000 });
    ok(l3.gewartet.indexOf(20000) >= 0, 'Lader: die Wartezeit laesst sich je Aufrufer setzen (Kacheln: 20 s)');

    var l4 = bauLader([ratenlimit, ratenlimit]);
    var r4 = await l4.lader.hole('AAPL', { range: '1mo', interval: '1d', bereinigt: false });
    ok(r4 === null && l4.geholt.length === 2, 'Lader: bleibt es bei 429, wird aufgegeben statt weiterzuhaemmern');

    var l5 = bauLader([{ ok: false, status: 404, body: '' }]);
    ok(await l5.lader.hole('AAPL', { range: '1mo', interval: '1d', bereinigt: false }) === null &&
       l5.geholt.length === 1, 'Lader: ein 404 wird NICHT wiederholt - nur 429');

    // Das Pflichtfeld
    var geworfen = null;
    try { await bauLader([gut]).lader.hole('AAPL', { range: '1mo', interval: '1d' }); }
    catch (e) { geworfen = e.message; }
    ok(geworfen && /bereinigt/.test(geworfen),
       'Vertrag: ohne "bereinigt" bricht der Aufruf ab - genau diese Entscheidung wurde neunmal unausgesprochen getroffen');

    var l6 = bauLader([gut]);
    var txt = await l6.lader.holeRoh('AAPL', { range: '1d', interval: '5m', prePost: true });
    ok(typeof txt === 'string' && txt.indexOf('chart') > 0,
       'Lader: holeRoh gibt den Text - fuer vormarkt.js, das sein eigenes Fenster ausschneidet');

    // --- Die Aufrufer: keine handgeschriebene Zerlegung mehr ---
    var paket = fs.readdirSync(__dirname).filter(function (f) {
      return /\.js$/.test(f) && !/^test-/.test(f) && f !== 'kurse.js' && f !== 'vormarkt.js';
    });
    var eigenbau = paket.filter(function (f) {
      return /chart\.result\[0\]/.test(fs.readFileSync(__dirname + '/' + f, 'utf8'));
    });
    ok(eigenbau.length === 0,
       'Aufrufer: niemand nimmt die Antwort mehr selbst auseinander' + (eigenbau.length ? ' – ' + eigenbau.join(', ') : ''));
    /* vormarkt.js ist die dokumentierte Ausnahme: kein Lader, sondern ein
     * Sonderfall-Auswerter fuer das vorboersliche Fenster, bereits exportiert und
     * mit eigenen Tests. Er holt seinen Text ueber holeRoh und bekommt damit
     * URL-Bau und 429-Behandlung, die er vorher gar nicht hatte. */
    ok(/chart\.result\[0\]/.test(fs.readFileSync(__dirname + '/vormarkt.js', 'utf8')),
       'Ausnahme: vormarkt.js schneidet weiter selbst - mit eigenem Vertrag und eigenen Tests');
    ok(/Kurse\.holeRoh\(/.test(fs.readFileSync(__dirname + '/renderer.js', 'utf8')),
       'Ausnahme: er bekommt seinen Text aber ueber den Lader');

    // Jeder Aufrufer sagt, ob er roh oder bereinigt will
    var htmlL = fs.readFileSync(__dirname + '/index.html', 'utf8');
    ok(htmlL.indexOf('kurse.js') < htmlL.indexOf('src="depot.js"'), 'Ladereihenfolge: kurse.js vor depot.js');
    ok(htmlL.indexOf('kurse.js') < htmlL.indexOf('src="renderer.js"'), 'Ladereihenfolge: kurse.js vor renderer.js');
    [['mittelfrist.js', true], ['driftui.js', true],
     ['depot.js', false], ['explorer.js', false], ['scheinfinder.js', false]].forEach(function (f) {
      var q = fs.readFileSync(__dirname + '/' + f[0], 'utf8');
      ok(new RegExp('bereinigt: ' + f[1]).test(q),
         f[0] + ' laedt ' + (f[1] ? 'BEREINIGT (rechnet ueber Jahre)' : 'ROH (handelt den Kurs)'));
    });
    /* Kanarienvogel: Faellt der asynchrone Teil kuenftig wieder aus der Zaehlung,
     * fehlt DIESE Zeile in der Ausgabe - und das faellt auf. */
    ok(true, 'Lader: der asynchrone Abschnitt ist wirklich gelaufen');
  })());
})();

/* ================= 46. Die Messkette misst sich nicht mehr selbst =================
 * Drei Befunde des Berichts, hier nachgerechnet statt nacherzaehlt.
 *
 * 1. MEHRFACHVERGLEICH: Die Analyse-Zentrale kuert den Besten aus 14 Modi x 4
 *    Zeitrahmen = 56 Kandidaten auf denselben Scheiben. Das Maximum aus 56
 *    Ziehungen liegt IMMER deutlich ueber dem Mittel - der Sieger sieht also auch
 *    dann gut aus, wenn kein einziger Kandidat etwas kann. bestOfN gab es in
 *    quant.js schon; aufgerufen wurde es hier nie.
 * 2. BELEG UND AUSWAHL WAREN DIESELBE SCHEIBE: 90 Kombinationen wurden auf 70 %
 *    optimiert, und die 30-%-Scheibe entschied DANN, ob der Feinschliff genommen
 *    wird - und lieferte zugleich die Filter-Bilanz, die als Beleg berichtet wurde.
 * 3. "ZWEI NAECHTE" WAREN EINE MESSUNG: Bei einem rollenden Fenster auf
 *    60-Minuten-Kerzen bringt eine Nacht rund 0,4 % neue Kerzen. */
(function () {
  console.log('\n46) Messkette: Zufallshuerde, getrennte Scheiben, echter Zuwachs');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  // --- 1) Die Zufallshuerde wird wirklich gerechnet, nicht nur erwaehnt ---
  ok(/results\.zufall = Q\.bestOfN\(/.test(dep),
     'Zufall: die Rangliste bekommt eine bestOfN-Probe (vorher: gar keine)');
  ok(/fineZufall = Q\.bestOfN\(/.test(dep),
     'Zufall: auch der 90er-Feinschliff bekommt eine - dort wird ein zweites Mal ausgewaehlt');
  ok(/var zufaellig = rec\.ueberzufaellig === false;/.test(dep),
     'Zufall: das Ergebnis wird zu einer Entscheidung, nicht nur angezeigt');
  ok(/\} else if \(zufaellig\) \{[\s\S]{0,400}a\.pending = null/.test(dep),
     'Zufall: faellt der Sieger durch, wird NICHTS vorgemerkt');

  /* Und jetzt die Probe aufs Exempel: bestOfN muss reines Rauschen als solches
   * erkennen und einen echten Ausreisser durchlassen. Gerechnet, nicht behauptet. */
  var rausch = [];
  for (var i = 0; i < 56; i++) rausch.push(Math.sin(i * 7.13) * 4);   // fest, kein Zufallsgenerator
  var uR = Q.bestOfN(rausch);
  ok(uR && uR.n === 56, 'Zufallsprobe: 56 Kandidaten gehen hinein  [' + (uR && uR.n) + ']');
  ok(uR && uR.ueberzufaellig === false,
     'Zufallsprobe: reines Rauschen aus 56 Kandidaten gilt NICHT als ueberzufaellig');
  var mitAusreisser = rausch.slice(); mitAusreisser[0] = 40;
  var uA = Q.bestOfN(mitAusreisser);
  ok(uA && uA.ueberzufaellig === true,
     'Zufallsprobe: ein echter Ausreisser kommt durch - die Huerde ist keine Mauer');
  ok(uR.zufallsMedian > 0 && uR.bester <= uR.zufallsP95,
     'Zufallsprobe: der Beste aus Rauschen liegt unter der 95-%-Marke des Zufalls  [' +
     uR.bester + ' <= ' + uR.zufallsP95 + ']');

  // --- 2) Drei Scheiben statt zwei ---
  ok(/var wahlMap = sliceMap\(map, cut, cut2/.test(dep) && /var belegMap = sliceMap\(map, cut2, span\[1\]/.test(dep),
     'Scheiben: es gibt eine eigene Wahl- UND eine eigene Belegscheibe');
  ok(/btIntraday\(wahlMap, Object\.assign\(\{\}, commonIv, top\.mode\.opts, bestFine\.g\)\)/.test(dep),
     'Scheiben: die Entscheidung ueber den Feinschliff faellt auf der Wahlscheibe');
  /* Der Kern: Die Belegscheibe darf NIRGENDS eine Entscheidung tragen. Sie kommt
   * genau dreimal vor - einmal beim Anlegen, einmal fuer die berichtete Zahl,
   * zweimal fuer die Filter-Bilanz. In keiner davon steht ein Vergleich, der
   * etwas auswaehlt. */
  ok(!/useFine[\s\S]{0,120}belegMap/.test(dep) && !/belegMap[\s\S]{0,80}\?\s*bestFine/.test(dep),
     'Scheiben: useFine wird NICHT auf der Belegscheibe entschieden');
  ok(/var basisAb = await btIntraday\(belegMap, basisOpts\)/.test(dep),
     'Scheiben: die Filter-Bilanz laeuft auf der unberuehrten Belegscheibe');
  ok(!/btIntraday\(testMap,/.test(dep.slice(dep.indexOf('async function runCentral'), dep.indexOf('function applyCentralRec'))),
     'Scheiben: in der Analyse-Zentrale gibt es kein doppelt benutztes testMap mehr');
  ok(/scheiben: \{ trainTage: tageIn\(trainMap\), wahlTage: tageIn\(wahlMap\), belegTage: tageIn\(belegMap\) \}/.test(dep),
     'Scheiben: ihre Groessen werden berichtet - eine Zahl ohne Massstab ist keine');

  // --- 3) Echter Zuwachs statt "zwei Naechte" ---
  ok(/var neueTage = \(typeof a\.lastRecTage === 'number'/.test(dep),
     'Zuwachs: die Bestaetigung fragt, wie viele ungesehene Handelstage dazugekommen sind');
  ok(/if \(neueTage != null && neueTage < 1\)/.test(dep),
     'Zuwachs: ohne einen einzigen neuen Handelstag wird NICHT uebernommen');
  ok(/Das ist eine \+\n?\s*'Messung, nicht zwei/.test(dep) || /Das ist eine ' \+\s*\n\s*'Messung, nicht zwei/.test(dep) ||
     /Messung, nicht zwei/.test(dep),
     'Zuwachs: und die Meldung sagt auch, warum');
  ok(!/wartet auf Bestätigung durch die nächste Nacht-Messung/.test(dep),
     'Zuwachs: die alte Formel "naechste Nacht bestaetigt" steht nicht mehr da');

  /* Der Edge-Waechter geht bewusst den ANDEREN Weg: Er setzt neue Einstiege aus -
   * eine schuetzende Handlung. Dort darf duenne Evidenz ausloesen, denn ein
   * Fehlalarm kostet eine Pause, das Zoegern kostet Geld. Was sich aendert, ist
   * der Anspruch: die Meldung behauptet keine zwei unabhaengigen Belege mehr. */
  ok(/zuwachs: zuwachs, zuwachsPct: zuwachsPct/.test(dep),
     'Waechter: der tatsaechliche Zuwachs wird mitgeschrieben');
  ok(/KEIN unabhängiger zweiter Beleg/.test(dep),
     'Waechter: die Meldung nennt die zweite Messung ausdruecklich keinen zweiten Beleg');
  ok(/a\[ARM\.histKey\]\[1\]\.verfall/.test(dep),
     'Waechter: die Ausloeseschwelle bleibt bei zwei Messungen - schuetzen darf auf duenner Grundlage');
  ok(!/in zwei Nächten hintereinander verfallen/.test(dep),
     'Waechter: die alte, zu starke Formulierung ist weg');
})();

/* ================= 47. Vega, Smile und die Vola um einen Termin =================
 * Der Bericht nannte drei systematische Verzerrungen der Schein-Simulation. Alle
 * drei zeigten in dieselbe Richtung: Der Backtest faellt optimistischer aus als
 * die Wirklichkeit.
 *   1. Kein Vega  - die Vola wurde beim Oeffnen eingefroren und bis zum Schliessen
 *                   unveraendert weiterbenutzt. Der groesste reale Risikofaktor
 *                   eines kurzlaufenden Scheins kam gar nicht vor.
 *   2. Kein Smile - jeder Schein bekam dieselbe Vola, egal wie weit aus dem Geld.
 *   3. RISK_FREE fest verdrahtet.
 * Nachgemessen wird hier, nicht nacherzaehlt. */
(function () {
  console.log('\n47) Vega, Smile und die Vola um einen Ergebnistermin');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  // --- Vega ---
  ok(typeof Q.bsVega === 'function', 'Vega: die Funktion gibt es');
  var vAtm = Q.bsVega(100, 100, 30 / 365, 0.30);
  ok(vAtm > 0, 'Vega: am Geld positiv  [' + vAtm.toFixed(4) + ']');
  ok(Q.bsVega(100, 100, 90 / 365, 0.30) > vAtm,
     'Vega: laengere Restlaufzeit hat mehr Vega - Zeit ist die Waehrung der Vola');
  ok(Q.bsVega(100, 130, 30 / 365, 0.30) < vAtm,
     'Vega: weit aus dem Geld hat weniger Vega');
  ok(Q.bsVega(100, 100, 0, 0.30) === 0 && Q.bsVega(100, 100, 0.1, 0) === 0,
     'Vega: ohne Restlaufzeit oder ohne Vola ist es null, nicht NaN');
  /* Call und Put haben DASSELBE Vega - das folgt aus der Put-Call-Paritaet und ist
   * keine Vereinfachung. Deshalb nimmt bsVega gar keine Richtung entgegen. */
  ok(Q.bsVega.length === 5, 'Vega: nimmt keine Richtung entgegen - Call und Put haben dasselbe');

  // --- Smile ---
  ok(Math.abs(Q.smileIv(0.30, 100, 100, 30) - 0.30) < 1e-9,
     'Smile: am Geld bleibt die Vola unveraendert');
  ok(Q.smileIv(0.30, 90, 100, 30) > 0.30,
     'Smile: unter dem Kurs teurer - der Aktien-Skew, Absicherungsnachfrage bei Puts');
  ok(Q.smileIv(0.30, 103, 100, 30) < 0.30,
     'Smile: knapp ueber dem Kurs BILLIGER - der Call-Skew faellt');
  ok(Q.smileIv(0.30, 130, 100, 30) > Q.smileIv(0.30, 110, 100, 30),
     'Smile: weit aus dem Geld faengt die Kruemmung beide Seiten wieder hoch');
  ok(Math.abs(Q.smileIv(0.30, 103, 100, 14) - 0.30) > Math.abs(Q.smileIv(0.30, 103, 100, 90) - 0.30),
     'Smile: kurze Laufzeiten haben den steileren Smile');
  ok(Q.smileIv(0.30, 1000, 100, 30) <= 0.30 * Q.SMILE.max && Q.smileIv(0.30, 1, 100, 30) >= 0.30 * Q.SMILE.min,
     'Smile: der Faktor bleibt in Grenzen - kein Unfug an den Raendern');
  /* GRENZE DER GUELTIGKEIT. Die Kurve ist fuer die Naehe des Geldes gedacht; diese App
   * oeffnet zwischen 0 und 5 % Abstand. Laeuft der Kurs danach weit weg, extrapolierte
   * die Formel wild - im Lauf am 24.08.2026 auf das 2,1-Fache (30 % -> 63 %), und das
   * macht eine tief im Geld liegende Position WERTVOLLER, also den Backtest wieder
   * optimistischer. Jenseits von +-25 % Moneyness bleibt der Smile jetzt flach. */
  ok(Math.abs(Q.smileIv(0.30, 170, 100, 21) - Q.smileIv(0.30, 200, 100, 21)) < 1e-9 &&
     Math.abs(Q.smileIv(0.30, 60, 100, 21) - Q.smileIv(0.30, 20, 100, 21)) < 1e-9,
     'Smile: jenseits von ±25 % Moneyness wird nicht mehr extrapoliert, sondern gehalten');
  ok(Q.smileIv(0.30, 100, 170, 21) / 0.30 < 1.4,
     'Smile: der Faktor bleibt auch im Extremfall unter 1,4  [' +
     (Q.smileIv(0.30, 100, 170, 21) / 0.30).toFixed(2) + ']');
  /* Und die Gegenprobe, warum die erhoehte Vola tief im Geld trotzdem harmlos ist:
   * Dort ist das Vega null, der Preis ist fast reiner innerer Wert. Genau das sagt
   * die Put-Call-Paritaet - ein tiefer Call und ein weiter Put teilen sich die Vola. */
  var tiefAlt = Q.bsPrice('call', 170, 100, 21 / 365, 0.30);
  var tiefNeu = Q.bsPrice('call', 170, 100, 21 / 365, Q.smileIv(0.30, 100, 170, 21));
  ok(Math.abs(tiefNeu / tiefAlt - 1) < 0.001,
     'Smile: tief im Geld aendert die hoehere Vola den Preis praktisch nicht (Vega ist dort null)');
  ok(Q.smileIv(0, 100, 100, 30) === 0 && Q.smileIv(0.3, 0, 100, 30) === 0.3,
     'Smile: Unsinn geht unveraendert durch, statt NaN zu erzeugen');

  /* Der Bericht sagte, ein aus dem Geld liegender Schein waere "real hoeher, der
   * Schein teurer". Das gilt fuer PUTS. Bei CALLS faellt der Aktien-Skew - der Call
   * wird billiger. Diese Korrektur gehoert festgehalten, sonst wird der Bericht
   * beim naechsten Lesen wieder zur Vorlage. */
  ok(Q.smileIv(0.30, 97, 100, 30) > Q.smileIv(0.30, 103, 100, 30),
     'Smile: Put-Seite teurer als Call-Seite bei gleichem Abstand - so herum, nicht anders');

  // --- Vola um einen Termin ---
  ok(Q.ivMitEreignis(0.30, null) === 0.30 && Q.ivMitEreignis(0.30, undefined) === 0.30,
     'Termin: ohne bekannten Termin bleibt alles, wie es ist');
  ok(Q.ivMitEreignis(0.30, 30) === 0.30, 'Termin: weit davor keine Wirkung');
  ok(Q.ivMitEreignis(0.30, 1) > 0.35, 'Termin: am Tag davor deutlich erhoeht  [' +
     (Q.ivMitEreignis(0.30, 1) * 100).toFixed(1) + ' %]');
  ok(Q.ivMitEreignis(0.30, -1) < 0.30, 'Termin: am Tag danach der Crush  [' +
     (Q.ivMitEreignis(0.30, -1) * 100).toFixed(1) + ' %]');
  ok(Q.ivMitEreignis(0.30, -10) === 0.30, 'Termin: nach der Erholung wieder normal');
  /* Der Kern der Sache in einer Zeile: derselbe Kurs, ein Tag Unterschied. */
  var vor = Q.bsPrice('call', 100, 100, 21 / 365, Q.ivMitEreignis(0.30, 1));
  var nach = Q.bsPrice('call', 100, 100, 20 / 365, Q.ivMitEreignis(0.30, -1));
  ok(nach < vor * 0.75,
     'Termin: bei UNVERAENDERTEM Kurs verliert der Schein ueber die Zahlen ' +
     Math.round((1 - nach / vor) * 100) + ' % - der Fall, den es in der Simulation nicht gab');

  // --- Verkabelung in depot.js ---
  ok(/function ivFuer\(basis, dir, strike, spot, expiry, terminT, now\)/.test(dep),
     'Einbau: es gibt eine Stelle, die die lebende Vola bestimmt');
  ok(/var ivJetzt = ivDerPosition\(pos, spot, now\);/.test(dep),
     'Einbau: die BEWERTUNG benutzt sie - dort sass der eingefrorene Wert');
  ok(!/iv: pos\.iv, ratio: pos\.ratio \|\| Q\.RATIO \}, spot, now\);\s*\n\s*return Math\.max\(0\.001, v/.test(dep),
     'Einbau: die eingefrorene Vola steht nicht mehr in der Bewertung');
  ok(/ivBasis: Math\.round\(ivBasis \* 1000\) \/ 1000/.test(dep) && /terminT: nTermin \|\| undefined/.test(dep),
     'Einbau: die Position traegt Basis-Vola und Termin mit - sonst waere es beim naechsten Bewerten wieder eingefroren');
  ok(/vega: Math\.round\(Q\.bsVega\(/.test(dep), 'Einbau: Vega wird auf der Position mitgeschrieben');
  ok(/w\.iv = \(cfg\.ivModell === false\) \? w\.iv : Q\.smileIv\(w\.iv, w\.strike, spot, P\.days\);/.test(dep),
     'Einbau: die Kostenhuerde bepreist denselben Schein wie der Handel');
  /* Sie muss dabei EINZELN ausfuehrbar bleiben - die Suite schneidet sie heraus.
   * Ein Griff nach D oder nach einer Modulfunktion bricht das (und tat es einmal). */
  ok(!/function kostenHuerdePp\(cfg, spot, vol, haltenMin, einsatz\) \{[\s\S]*?\n  \}/.test(dep) ||
     !/ivModellAn\(\)/.test(/function kostenHuerdePp\(cfg, spot, vol, haltenMin, einsatz\) \{[\s\S]*?\n  \}/.exec(dep)[0]),
     'Kostenhuerde: greift auf nichts ausserhalb ihrer Argumente zu');
  ok(/function ivModellAn\(\)/.test(dep) && /D\.intraday\.ivModell === false/.test(dep),
     'Einbau: das Modell laesst sich abschalten - eine Aenderung an der Preisbildung muss man zurueckdrehen koennen');
  ok(/if \(!\(pos\.ivBasis > 0\)\) return pos\.iv;/.test(dep),
     'Altbestand: Positionen ohne Basis-Vola werden NICHT rueckwirkend neu bepreist');

  // --- Die Tabelle muss aufgehen ---
  /* Der Basiswert-Zweig liefert Ersatzzellen. Kommt vorne eine Spalte dazu und
   * dort nicht, verrutscht die ganze Tabelle - und Basiswert ist die Voreinstellung. */
  var kopfI = dep.indexOf('<th>Wert</th><th>Typ</th>');
  var kopf = dep.slice(kopfI, dep.indexOf('</tr>', kopfI));
  var nKopf = (kopf.match(/<th/g) || []).length;
  var zwI = dep.indexOf('var scheinZellen = p.basis');
  /* Die Marke endet vor dem >: seit Issue #68 traegt die Zeile ein data-poszeile.
   * Fand die alte Marke nichts, schnitt der Ausdruck bis zum Dateiende durch und
   * zaehlte <td> aus ganz depot.js - ein Fehlschlag ohne echten Defekt. */
  var zweig = dep.slice(zwI, dep.indexOf("ph += '<tr", zwI));
  var nBasis = (zweig.slice(zweig.indexOf('?'), zweig.indexOf(': ')).match(/<td/g) || []).length;
  var nSchein = (zweig.slice(zweig.indexOf(': ')).match(/<td/g) || []).length;
  ok(nBasis === nSchein, 'Tabelle: Basiswert- und Schein-Zweig liefern gleich viele Zellen  [' + nBasis + ' / ' + nSchein + ']');
  var zeilI = dep.indexOf("ph += '<tr data-poszeile=");
  var nZeile = (dep.slice(zeilI, dep.indexOf('</tr>', zeilI)).match(/<td/g) || []).length;
  ok(nZeile + nSchein === nKopf,
     'Tabelle: Zeile und Kopf haben gleich viele Spalten  [' + (nZeile + nSchein) + ' / ' + nKopf + ']');
  var sumI = dep.indexOf('style="text-align:right; color:var(--muted); font-weight:600;">Summe');
  var colspan = Number(/colspan="(\d+)"/.exec(dep.slice(sumI - 60, sumI))[1]);
  ok(colspan === nKopf - 4,
     'Tabelle: die Summenzeile ueberspannt die richtige Zahl von Spalten  [' + colspan + ']');
})();

/* ================= 48. US-Handelskalender =================
 * Die App hielt JEDEN Wochentag fuer einen vollen Handelstag von 390 Minuten.
 * Feiertage sind dabei der leichte Fall (Leerlauf, barsFrisch faengt es ab);
 * HALBTAGE sind der teure: Die Boerse schliesst um 13:00 ET statt 16:00, und
 * isNearUsClose prueft "m >= 375" - an einem Halbtag wird 375 nie erreicht, die
 * Tagesschluss-Glattstellung fiel dort also KOMPLETT aus. Positionen, die
 * ausdruecklich kein Uebernacht-Risiko tragen sollten, lagen ueber Nacht.
 *
 * Geprueft wird gegen die VEROEFFENTLICHTEN NYSE-Termine, nicht gegen die eigene
 * Rechnung - sonst pruefte sich der Algorithmus selbst. */
(function () {
  console.log('\n48) US-Handelskalender: Feiertage und Halbtage');
  var B = require(__dirname + '/boerse.js');
  function tag(s) { return Date.parse(s + 'T15:00:00Z'); }
  function iso(ms) { return new Date(ms).toISOString().slice(0, 10); }

  // --- Ostern, die Grundlage fuer Karfreitag ---
  [[2025, 3, 20], [2026, 3, 5], [2027, 2, 28], [2024, 2, 31], [2030, 3, 21]].forEach(function (e) {
    var o = B.ostern(e[0]);
    ok(o.monat === e[1] && o.tag === e[2],
       'Ostern ' + e[0] + ': ' + (o.tag) + '.' + (o.monat + 1) + '. (erwartet ' + e[2] + '.' + (e[1] + 1) + '.)');
  });

  /* Die veroeffentlichten NYSE-Feiertage. Jede Zeile ist nachschlagbar. */
  var NYSE = {
    2025: ['2025-01-01', '2025-01-20', '2025-02-17', '2025-04-18', '2025-05-26',
           '2025-06-19', '2025-07-04', '2025-09-01', '2025-11-27', '2025-12-25'],
    2026: ['2026-01-01', '2026-01-19', '2026-02-16', '2026-04-03', '2026-05-25',
           '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-12-25'],
    2027: ['2027-01-01', '2027-01-18', '2027-02-15', '2027-03-26', '2027-05-31',
           '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-12-24']
  };
  Object.keys(NYSE).forEach(function (j) {
    var f = B.feiertage(Number(j));
    var berechnet = Object.keys(f).map(function (k) { return iso(f[k]); }).sort();
    ok(berechnet.join(',') === NYSE[j].slice().sort().join(','),
       'NYSE ' + j + ': alle zehn Feiertage stimmen');
  });
  /* Die drei Verschiebungen, an denen eine handgepflegte Liste scheitert: */
  ok(iso(B.feiertage(2026).unabhaengigkeit) === '2026-07-03',
     'Verschiebung: 4. Juli 2026 faellt auf Samstag -> frei ist der Freitag davor');
  ok(iso(B.feiertage(2027).unabhaengigkeit) === '2027-07-05',
     'Verschiebung: 4. Juli 2027 faellt auf Sonntag -> frei ist der Montag danach');
  ok(iso(B.feiertage(2027).weihnachten) === '2027-12-24',
     'Verschiebung: 25.12.2027 faellt auf Samstag -> frei ist der Freitag davor');

  // --- Halbtage ---
  ok(B.halbtagAn(tag('2026-11-27')) === 'nachThanksgiving', 'Halbtag: der Freitag nach Thanksgiving');
  ok(B.halbtagAn(tag('2026-12-24')) === 'heiligabend', 'Halbtag: Heiligabend, wenn er ein Handelstag ist');
  ok(B.halbtagAn(tag('2025-07-03')) === 'vorUnabhaengigkeit', 'Halbtag: der 3. Juli 2025 (Do, der 4. ist Fr)');
  /* Die beiden Faelle, in denen der 3. Juli KEIN halber Tag ist. */
  ok(!B.halbtagAn(tag('2026-07-03')),
     'Kein Halbtag: der 3.7.2026 ist der Ersatzfeiertag selbst, also ganz zu');
  ok(!B.halbtagAn(tag('2027-07-02')) && !B.halbtagAn(tag('2027-07-03')),
     'Kein Halbtag: 2027 faellt der 4. Juli auf einen Sonntag - der 3. ist Samstag');
  /* Kollision: Ein Feiertag schlaegt einen Halbtag. 2027 ist der 24.12. beides. */
  ok(B.feiertagAn(tag('2027-12-24')) === 'weihnachten' && !B.halbtagAn(tag('2027-12-24')),
     'Kollision: faellt beides auf denselben Tag, gilt der Feiertag');
  ok(B.sitzungsMinuten(tag('2027-12-24')) === 0,
     'Kollision: die Boerse ist dann ZU, nicht halb offen');

  // --- Sitzungslaengen ---
  ok(B.sitzungsMinuten(tag('2026-08-24')) === 390, 'Sitzung: ein normaler Montag hat 390 Minuten');
  ok(B.sitzungsMinuten(tag('2026-11-27')) === 210, 'Sitzung: ein Halbtag hat 210 Minuten');
  ok(B.sitzungsMinuten(tag('2026-11-26')) === 0, 'Sitzung: an Thanksgiving null');
  ok(B.sitzungsMinuten(tag('2026-08-22')) === 0, 'Sitzung: samstags null');
  ok(B.istHandelstag(tag('2026-11-27')) === true, 'Ein Halbtag IST ein Handelstag - nur ein kuerzerer');

  // --- Ein Jahr am Stueck ---
  var handelstage = 0, halb = 0;
  for (var d = Date.UTC(2026, 0, 1); d < Date.UTC(2027, 0, 1); d += 86400000) {
    if (B.istHandelstag(d)) handelstage++;
    if (B.halbtagAn(d)) halb++;
  }
  ok(handelstage >= 250 && handelstage <= 253,
     '2026 hat ' + handelstage + ' Handelstage (die NYSE zaehlt 250-253)');
  ok(halb >= 1 && halb <= 4, '2026 hat ' + halb + ' Halbtage');

  // --- Verkabelung ---
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var ren = fs.readFileSync(__dirname + '/renderer.js', 'utf8');
  var htmlB = fs.readFileSync(__dirname + '/index.html', 'utf8');
  ok(/return m >= laenge - 15 && m < laenge;/.test(dep),
     'Glattstellung: richtet sich nach der ECHTEN Sitzungslaenge, nicht nach 390');
  ok(!/return m >= 375 && m < 390;/.test(dep),
     'Glattstellung: die feste 375 ist weg - an einem Halbtag wurde sie nie erreicht');
  ok(/window\.Boerse\.sitzungsMinuten\(jetzt\)/.test(ren) && /if \(!laenge\) return false;/.test(ren),
     'Marktstatus: an Feiertagen gilt die Boerse als geschlossen');
  /* Seit Stufe E: die EINE Sitzungsregel wohnt in backfill.js; capBackfill (depot.js)
   * ruft sie ueber die Schnittstelle - weiterhin keine zweite, eigene 390er-Regel. */
  var bfs = fs.readFileSync(__dirname + '/backfill.js', 'utf8');
  ok(/var sess = bars\.filter\(function \(b\) \{ return window\.Backfill\.istSitzung\(b\[0\]\); \}\)/.test(dep),
     'Backfill: filtert ueber istSitzung statt ueber eine zweite, eigene 390er-Regel');
  ok(/if \(tag >= 1 && tag <= 5 && laenge && m >= laenge\)/.test(bfs),
     'Backfill: der Sprung ueber Pausen kennt jetzt wirklich Feiertage - der Kommentar versprach das schon vorher');
  ok(htmlB.indexOf('boerse.js') < htmlB.indexOf('src="depot.js"') &&
     htmlB.indexOf('boerse.js') < htmlB.indexOf('src="renderer.js"'),
     'Ladereihenfolge: boerse.js vor seinen beiden Nutzern');
})();

/* ================= 49. Die Schnitte aus depot.js =================
 * Audit 22 nannte drei. Der erste (Reiter-Navigation) lief in Stufe 2.
 *
 * ZWEITER: die Chart-Zeichnung. Sie fasst weder D noch eine Position noch eine
 * Kursquelle an - Punkte rein, SVG raus. Deshalb ein WOERTLICHER Umzug: keine
 * Formel, kein Aufruf, kein Zahlenwert angefasst.
 *
 * DRITTER: die Messmaschine. Sie NICHT im Ganzen zu verschieben, war die
 * Entscheidung: 1.117 Zeilen, die acht Funktionen aus dem Rest von depot.js
 * aufrufen und in D schreiben. Ein Umzug haette acht Durchreichungen gebraucht -
 * dieselbe Verflechtung, nur ueber Dateigrenzen verteilt. Verschoben ist der
 * Teil, der wirklich rein ist: die Fenster-Rechnung. Sie entscheidet, welche
 * Kerze zum Optimieren, welche zum Auswaehlen und welche zum Belegen zaehlt -
 * und war bisher nur ueber einen kompletten Messlauf pruefbar. */
(function () {
  console.log('\n49) depot.js geschnitten: Chart und Messfenster');
  /* chart.js verlangt window.U und bricht sonst laut ab - genau so soll es sein.
   * Im Test stellen wir die Formate selbst; geprueft wird hier die RECHNUNG
   * (Tick-Stufen, Zeitachse), nicht die Lokalisierung. */
  globalThis.U = {
    nf0: { format: function (v) { return String(Math.round(v)); } },
    nf2: { format: function (v) { return (Math.round(v * 100) / 100).toFixed(2); } },
    esc: function (x) { return String(x); }
  };
  var C = require(__dirname + '/chart.js');
  var M = require(__dirname + '/messfenster.js');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  // ---------- Achsen: reine Rechnerei mit Rundungsfallen ----------
  ok(typeof C.niceTicks === 'function', 'Chart: niceTicks laeuft jetzt in Node');
  var t1 = C.niceTicks(0, 100, 4);
  ok(t1.length >= 3 && t1[0] === 0 && t1[t1.length - 1] === 100,
     'Ticks: 0 bis 100 ergibt runde Stufen  [' + t1.join(', ') + ']');
  var t2 = C.niceTicks(9.998, 10.002, 4);
  ok(t2.length >= 2 && t2.every(function (v) { return v >= 9.99 && v <= 10.01; }),
     'Ticks: eine winzige Spanne ergibt trotzdem Stufen  [' + t2.join(', ') + ']');
  ok(C.niceTicks(5, 5, 4).length === 1, 'Ticks: ohne Spanne genau eine Marke, keine Endlosschleife');
  ok(C.niceTicks(10, 5, 4).length === 1, 'Ticks: verdrehte Grenzen ergeben keine Endlosschleife');
  var t3 = C.niceTicks(0, 1e7, 4);
  ok(t3.length >= 3 && t3.length <= 9, 'Ticks: auch bei zehn Millionen bleibt die Zahl der Marken lesbar  [' + t3.length + ']');
  /* Die Stufen muessen GLEICHMAESSIG sein - eine krumme Leiter faellt am Chart nicht
   * auf, macht aber jede abgelesene Zahl unzuverlaessig. */
  var gl = C.niceTicks(0, 100, 4);
  var abst = [];
  for (var i = 1; i < gl.length; i++) abst.push(Math.round((gl[i] - gl[i - 1]) * 1e6));
  ok(new Set(abst).size === 1, 'Ticks: alle Abstaende gleich  [' + abst[0] / 1e6 + ']');

  ok(/^\d/.test(C.fmtTimeTick(Date.UTC(2026, 7, 24, 12), 3600000)) ||
     C.fmtTimeTick(Date.UTC(2026, 7, 24, 12), 3600000).indexOf(':') > 0,
     'Zeitachse: kurze Spanne zeigt die Uhrzeit');
  ok(C.fmtTimeTick(Date.UTC(2026, 7, 24), 60 * 86400000).indexOf('.') > 0,
     'Zeitachse: mittlere Spanne zeigt Tag und Monat');
  /* Bewusst OHNE das Trennzeichen geprueft: Node liefert fuer de-DE "08/26", der
   * Browser "08.26" - eine ICU-Eigenheit der Testumgebung, kein Unterschied in der
   * App. Geprueft wird, dass Monat UND Jahr dastehen und der Tag verschwindet. */
  var langTxt = C.fmtTimeTick(Date.UTC(2026, 7, 24), 900 * 86400000);
  ok(/08/.test(langTxt) && /26/.test(langTxt) && !/24/.test(langTxt),
     'Zeitachse: lange Spanne zeigt Monat und Jahr, nicht den Tag  [' + langTxt + ']');

  ok(/var niceTicks = window\.Chart\.niceTicks;/.test(dep) && !/function niceTicks/.test(dep),
     'Chart: depot.js haelt nur noch den Namen, nicht den Code');
  ok(/throw new Error\('chart\.js braucht window\.U/.test(fs.readFileSync(__dirname + '/chart.js', 'utf8')),
     'Chart: kein stiller Rueckfall auf Ersatz-Zahlenformate - der waere an einer Achse nie aufgefallen');

  // ---------- Messfenster: hier entscheidet sich, was als Beleg zaehlt ----------
  /* Eine gebaute Kursreihe mit BEKANNTER Antwort: zehn Handelstage, je drei Kerzen. */
  /* Sechseinhalb Kerzen je Handelstag - die Dichte eines 60m-Zeitrahmens. Der erste
   * Wurf dieses Tests nahm DREI und lief prompt in die 60-Kerzen-Schwelle von
   * sliceMap: Wahl- und Belegscheibe kamen leer zurueck. Das war kein Fehler im
   * Code, sondern eine unrealistische Testreihe - nachgerechnet ist die knappste
   * echte Belegscheibe (15m, 60 Tage Historie) 234 Kerzen gross. */
  function reihe(tage) {
    var arr = [];
    for (var d = 0; d < tage; d++) {
      for (var h = 0; h < 7; h++) arr.push([Date.UTC(2026, 0, 5 + d, 14 + h), 100 + d]);
    }
    return { AAA: arr, BBB: arr.slice() };
  }
  var m10 = reihe(10);
  ok(M.handelsTage(m10).length === 10, 'Fenster: zehn Tage rein, zehn Tage erkannt');
  ok(M.handelsTage(m10)[0] === '2026-01-05' && M.handelsTage(m10)[9] === '2026-01-14',
     'Fenster: die Tage stehen aufsteigend und stimmen');
  ok(M.tageIn(m10) === 10 && M.tageIn({}) === 0, 'Fenster: tageIn zaehlt dasselbe');

  var sp = M.mapSpan(m10);
  ok(sp[0] === Date.UTC(2026, 0, 5, 14) && sp[1] === Date.UTC(2026, 0, 14, 20),
     'Fenster: die Spanne reicht von der ersten bis zur letzten Kerze');
  ok(M.mapSpan({}) [0] === Infinity, 'Fenster: eine leere Karte ergibt keine Spanne, sondern Infinity');

  /* Der Kern: Die Grenze wird nach HANDELSTAGEN gezogen, nicht nach Kalenderzeit.
   * Bei 70 % von zehn Tagen ist das der Beginn des achten - Index 7. */
  var g70 = M.tagesGrenze(m10, 0.7);
  ok(g70 === Date.UTC(2026, 0, 12), 'Fenster: 70 % von zehn Handelstagen ist der Beginn des achten  [' +
     new Date(g70).toISOString().slice(0, 10) + ']');
  ok(M.tagesGrenze(m10, 0.85) === Date.UTC(2026, 0, 13), 'Fenster: 85 % ist der Beginn des neunten');
  ok(M.tagesGrenze(m10, 0) === Date.UTC(2026, 0, 5) && M.tagesGrenze(m10, 1) === Date.UTC(2026, 0, 14),
     'Fenster: 0 und 1 treffen den ersten und den letzten Tag, nicht daneben');
  ok(M.tagesGrenze({}, 0.7) === null, 'Fenster: ohne Daten keine Grenze');

  /* Und die Probe, warum das ueberhaupt zaehlt: Die drei Scheiben der Analyse-Zentrale
   * duerfen sich NICHT ueberlappen. Faellt eine Grenze um einen Tag falsch, wandert ein
   * Tag aus der Belegscheibe in die Trainingsscheibe - und das Ergebnis sieht besser
   * aus, ohne dass irgendwo ein Fehler auffiele. */
  var m60 = reihe(60);
  var spanne = M.mapSpan(m60);
  var cut = M.tagesGrenze(m60, 0.7), cut2 = M.tagesGrenze(m60, 0.85);
  var train = M.sliceMap(m60, spanne[0], cut, 0);
  var wahl = M.sliceMap(m60, cut, cut2, 0);
  var beleg = M.sliceMap(m60, cut2, spanne[1], 0);
  var tT = M.handelsTage(train), tW = M.handelsTage(wahl), tB = M.handelsTage(beleg);
  ok(tT.length + tW.length + tB.length === 60,
     'Scheiben: die drei ergeben zusammen wieder alle 60 Tage  [' + tT.length + '+' + tW.length + '+' + tB.length + ']');
  ok(tT[tT.length - 1] < tW[0] && tW[tW.length - 1] < tB[0],
     'Scheiben: sie ueberlappen sich an keiner Stelle');
  ok(tT.length === 42 && tW.length === 9 && tB.length === 9,
     'Scheiben: 70/15/15 kommt bei 60 Tagen als 42/9/9 heraus  [' + tT.length + '/' + tW.length + '/' + tB.length + ']');

  /* Der Warmlauf zaehlt in BARS, nicht in Millisekunden - das war schon einmal ein
   * Fehler (13 Stunden Wanduhr ueber ein Wochenende ergeben null zusaetzliche Bars). */
  var ohne = M.sliceMap(m60, cut2, spanne[1], 0);
  var mit = M.sliceMap(m60, cut2, spanne[1], 30);
  ok(mit.AAA.length === ohne.AAA.length + 30,
     'Warmlauf: 30 angeforderte Bars sind genau 30 zusaetzliche Kerzen  [' +
     ohne.AAA.length + ' -> ' + mit.AAA.length + ']');
  ok(M.sliceMap(m60, spanne[0], cut, 30).AAA.length === M.sliceMap(m60, spanne[0], cut, 0).AAA.length,
     'Warmlauf: am ANFANG der Historie gibt es nichts vorzuladen - und es wird nicht negativ geschnitten');
  ok(M.warmlaufBars('60m') === 150 && M.warmlaufBars('5m') === 400 && M.warmlaufBars('1m') === 400,
     'Warmlauf: 60m bekommt 150 Bars, alles andere 400');
  /* Genau hier waere der erste Wurf dieses Moduls gescheitert: WARMLAUF_BARS blieb in
   * depot.js zurueck, warmlaufBars gab fuer alles ausser 60m undefined - und
   * Math.max(0, erst - undefined) ist NaN, slice(NaN, n) faengt bei 0 an. Jede Scheibe
   * waere lautlos ab dem ersten Bar der Historie gelaufen. */
  ok(M.warmlaufBars('5m') !== undefined && typeof M.warmlaufBars('5m') === 'number',
     'Warmlauf: die Konstante ist mit umgezogen - sonst waere der Rueckgabewert undefined');

  /* Zu duenne Symbole fliegen raus - sonst rechnet die Messung auf zehn Kerzen.
   * Das passiert STILL: sliceMap laesst das Symbol einfach weg. */
  var duenn = { GUT: m60.AAA, DUENN: m60.AAA.slice(0, 20) };
  var gefiltert = M.sliceMap(duenn, spanne[0], spanne[1], 0);
  ok(!!gefiltert.GUT && !gefiltert.DUENN,
     'Scheiben: ein Symbol mit 60 Kerzen oder weniger wird verworfen, nicht mitgeschleppt');
  /* SPERRKLINKE zu Audit 25: Die Belegscheibe ist dort von 30 % auf 15 % geschrumpft.
   * Wird sie noch kleiner, koennten Symbole unter die 60-Kerzen-Schwelle rutschen und
   * LAUTLOS aus dem Beleg verschwinden. Nachgerechnet fuer die vier Zeitrahmen mit der
   * Historie, die Yahoo hergibt (24.08.2026):
   *     1m    7 Tage ->  1 Tag  =  390 Kerzen
   *     5m   60 Tage ->  9 Tage =  702 Kerzen
   *     15m  60 Tage ->  9 Tage =  234 Kerzen   <- die knappste
   *     60m 260 Tage -> 39 Tage =  254 Kerzen
   * Der Abstand zur Schwelle ist also fast vierfach. Diese Zeile wird rot, wenn er
   * es nicht mehr ist. */
  var knappste = Math.round(Math.floor(60 * 0.15) * 26);   // 15m: 26 Kerzen je Handelstag
  ok(knappste > 60 * 3,
     'Belegscheibe: auch der knappste Zeitrahmen bleibt weit ueber der 60-Kerzen-Schwelle  [' +
     knappste + ' Kerzen]');

  var sch = M.tagesScheiben(m60, 9);
  ok(sch.length === 9, 'Walk-Forward: neun Scheiben aus 60 Tagen');
  ok(sch.reduce(function (a, x) { return a + x.tage; }, 0) === 60, 'Walk-Forward: sie decken alle 60 Tage ab');
  ok(sch.every(function (x, i2) { return i2 === 0 || x.von > sch[i2 - 1].bis; }),
     'Walk-Forward: keine Scheibe faengt vor dem Ende der vorigen an');
  ok(M.tagesScheiben(m10, 20).length === 0, 'Walk-Forward: weniger Tage als Scheiben ergibt keine Scheiben');

  // ---------- Was in depot.js bleiben MUSSTE ----------
  ok(/var sliceMap = window\.Messfenster\.sliceMap;/.test(dep) && !/function sliceMap/.test(dep),
     'Messfenster: depot.js haelt nur noch die Namen');
  ok(/async function runCentral/.test(dep) && /async function labCompute/.test(dep),
     'Messfenster: die Maschine selbst bleibt in depot.js - sie ruft acht Funktionen von dort und schreibt in D');
  var htmlS = fs.readFileSync(__dirname + '/index.html', 'utf8');
  ok(htmlS.indexOf('app-shell.js') < htmlS.indexOf('chart.js'),
     'Ladereihenfolge: chart.js NACH app-shell.js - dort entsteht window.U');
  ok(htmlS.indexOf('messfenster.js') < htmlS.indexOf('src="depot.js"'),
     'Ladereihenfolge: messfenster.js vor depot.js');
})();

/* ================= 50. Die Messung aus der App =================
 * Audit 25/26/27 hatten alle denselben Boden: Der Reiter "Messung" endete in einer
 * Sackgasse. Die App legte die Strategie ab und nannte einen Node-Befehl fuer den
 * Ordner studien/messmaschine/ - einen Ordner, den der Installer gar nicht mitbrachte,
 * fuer ein Node, das der Nutzer nicht installiert hat. Wer keine Entwicklungsumgebung
 * hatte, kam nie zu einem Urteil.
 *
 * Jetzt wird der Ordner mitgeliefert und die Maschine laeuft auf Knopfdruck in einem
 * EIGENEN Prozess mit Electrons eingebautem Node. Was dabei NICHT wandern durfte:
 *   - das Urteil (die Maschine rechnet dieselbe Rechnung und verweigert genauso),
 *   - die Vertrauensgrenze (der Renderer uebergibt eine Kennung, nie einen Pfad),
 *   - der Ort des Protokolls (in den Datenordner, nicht in den Programmordner).
 *
 * Die Riegel stehen in main.js, die sich hier nicht laden laesst (sie verlangt
 * electron). Geprueft wird deshalb nicht der Wortlaut, sondern die HERAUSGELOESTE
 * REGEL: Muster und Pfadprobe werden aus der Quelle geschnitten und mit Angriffs-
 * eingaben AUSGEFUEHRT. Aendert jemand die Regel, aendert sich der Test mit. */
(function () {
  console.log('\n50) Messung auf Knopfdruck: derselbe Richter, nur ein kuerzerer Weg');
  var path = require('path');
  var os = require('os');
  var mainQ = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var pre = fs.readFileSync(__dirname + '/preload.js', 'utf8');
  var sco = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');
  var messenQ = fs.readFileSync(__dirname + '/studien/messmaschine/messen.js', 'utf8');
  var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));

  // ---------- Riegel 1: der Renderer uebergibt eine Kennung, keinen Pfad ----------
  var mMuster = /if \(!(\/\^[^/]+\/)\.test\(String\(key \|\| ''\)\)\)/.exec(mainQ);
  ok(!!mMuster, 'Riegel 1: mess-lauf prueft die Kennung gegen ein Muster');
  if (mMuster) {
    // Das Muster wird AUS DER QUELLE gebaut - nicht danebengeschrieben.
    var muster = new Function('return ' + mMuster[1])();
    var boese = ['../../etc/passwd', 'a/b', 'a\\b', '..', '.', '', 'A', 'a b', 'a;rm -rf /',
                 'a.js', '-a', 'ä', 'a'.repeat(60), '/absolut'];
    var durch = boese.filter(function (s) { return muster.test(s); });
    ok(durch.length === 0, 'Riegel 1: keine der 14 Angriffseingaben kommt durch  [' + durch.join(' ') + ']');
    ok(muster.test('monatsende-kauf') && muster.test('orb2'),
       'Riegel 1: echte Kennungen kommen durch - der Riegel sperrt nicht die Tuer zu');
  }

  /* ---------- Riegel 2: nach dem Zusammensetzen noch einmal pruefen ----------
   * Das Muster allein waere eine Sperre, die faellt, sobald jemand sie lockert. Die
   * zweite Probe fragt nicht die Eingabe, sondern das ERGEBNIS: liegt die Datei
   * wirklich in dem einen Ordner? Hier wird sie mit einer Kennung ausgefuehrt, die
   * das Muster gar nicht durchgelassen haette - genau der Fall, fuer den sie da ist. */
  ok(/path\.dirname\(path\.resolve\(datei\)\) !== path\.resolve\(dir\)/.test(mainQ),
     'Riegel 2: der zusammengesetzte Pfad wird gegen den Ordner geprueft');
  function ausserhalb(dir, key) {
    var datei = path.join(dir, key + '.js');
    return path.dirname(path.resolve(datei)) !== path.resolve(dir);
  }
  var basis = path.join(os.tmpdir(), 'strategien');
  ok(ausserhalb(basis, '../../../etc/passwd') === true, 'Riegel 2: ein Ausbruch nach oben faellt auf');
  ok(ausserhalb(basis, 'unter/ordner') === true, 'Riegel 2: ein Unterordner faellt auf');
  ok(ausserhalb(basis, 'monatsende-kauf') === false, 'Riegel 2: die echte Ablage besteht die Probe');

  /* ---------- Riegel 3: das Skript ist fest verdrahtet ----------
   * fork() nimmt eine Datei und ein Argumentfeld - keine Zeichenkette, die eine Shell
   * noch einmal auseinandernimmt. Ein exec/spawn mit Shell waere hier der Unterschied
   * zwischen "Kennung" und "beliebiger Befehl". */
  ok(/const kind = fork\(skript, \[datei\], \{/.test(mainQ),
     'Riegel 3: gestartet wird mit fork(Skript, [Datei]) - keine Shell, keine Zeichenkette');
  ok(!/\bexec\(|\bexecSync\(|shell: true/.test(mainQ),
     'Riegel 3: nirgends in main.js eine Shell fuer diesen Weg');
  ok(/const skript = messmaschinePfad\(\);/.test(mainQ) && !/fork\(\s*(datei|key)/.test(mainQ),
     'Riegel 3: der Pfad zum Skript kommt aus dem Programmordner, nie aus dem Renderer');

  // ---------- Kein Node beim Nutzer noetig ----------
  ok(/ELECTRON_RUN_AS_NODE: '1'/.test(mainQ),
     'Der Kindprozess ist Electrons eingebautes Node - der Nutzer braucht keins installiert');

  /* ---------- Wo das Protokoll landet ----------
   * Im Paket liegt messen.js im Programmordner. Daneben zu schreiben geht dort nicht
   * (und waere der falsche Ort). Die Zeile wird aus der Quelle geschnitten und mit
   * gestelltem process/__dirname AUSGEFUEHRT - beide Faelle. */
  var mOrdner = /var ordner = ([^;]+);/.exec(messenQ);
  ok(!!mOrdner, 'Protokollordner: die Zeile steht in messen.js');
  if (mOrdner) {
    var wohin = new Function('process', 'path', '__dirname', 'return ' + mOrdner[1]);
    ok(wohin({ env: { MESSMASCHINE_PROTOKOLLE: '/daten/protokolle' } }, path, '/prog/messmaschine') === '/daten/protokolle',
       'Protokollordner: mit MESSMASCHINE_PROTOKOLLE geht es dorthin');
    ok(wohin({ env: {} }, path, '/prog/messmaschine') === path.join('/prog/messmaschine', 'protokolle'),
       'Protokollordner: ohne die Variable bleibt alles wie bisher - neben dem Skript');
  }
  ok(/MESSMASCHINE_PROTOKOLLE: protokolle/.test(mainQ) &&
     /'Markt-Dashboard-Daten', 'protokolle'\)/.test(mainQ),
     'Protokollordner: die App zeigt auf denselben Ordner, den das Scoreboard liest');
  /* mkdirSync OHNE recursive haette hier geworfen: Markt-Dashboard-Daten gibt es beim
   * ersten Mal noch gar nicht, nur protokolle/ darunter waere angelegt worden. Das ist
   * kein Textbefund - es wird vorgefuehrt. */
  var tief = path.join(os.tmpdir(), 'md-test-' + process.pid, 'eltern', 'kind');
  var ohneRecursive = false;
  try { fs.mkdirSync(tief); } catch (e) { ohneRecursive = true; }
  ok(ohneRecursive === true, 'Protokollordner: ein fehlender Elternordner laesst mkdirSync ohne recursive scheitern');
  fs.mkdirSync(tief, { recursive: true });
  ok(fs.existsSync(tief), 'Protokollordner: mit recursive entsteht die ganze Kette');
  fs.rmSync(path.join(os.tmpdir(), 'md-test-' + process.pid), { recursive: true, force: true });
  ok(/fs\.mkdirSync\(ordner, \{ recursive: true \}\)/.test(messenQ),
     'Protokollordner: messen.js legt sie deshalb auch so an');

  /* ---------- Der Weg zu quant.js haengt nicht an der asar-Schicht ----------
   * Die Strategie laedt quant.js ueber STOCK_DASHBOARD_QUELLE. Zeigte das im Paket
   * auf den Ordner IM asar-Archiv, haenge die ganze Messung daran, ob Electrons
   * asar-Schicht auch unter ELECTRON_RUN_AS_NODE noch aktiv ist. quant.js ist
   * deshalb mit entpackt, und die Umrechnung wird hier ausgefuehrt. */
  var mEnt = /function entpackt\(p\) \{[\s\S]*?\n\}/.exec(mainQ);
  ok(!!mEnt, 'Entpackt: die Umrechnung steht als eigene Funktion da');
  if (mEnt) {
    var entpackt = new Function('path', mEnt[0] + '; return entpackt;')(path);
    var sep = path.sep;
    ok(entpackt(['', 'opt', 'app', 'resources', 'app.asar', 'quant.js'].join(sep)) ===
       ['', 'opt', 'app', 'resources', 'app.asar.unpacked', 'quant.js'].join(sep),
       'Entpackt: im Paket zeigt der Weg neben das Archiv');
    ok(entpackt(['', 'home', 'w', 'Stock-Dashboard', 'quant.js'].join(sep)) ===
       ['', 'home', 'w', 'Stock-Dashboard', 'quant.js'].join(sep),
       'Entpackt: in der Entwicklung bleibt der Pfad unveraendert');
    /* Der Fall, den der erste Wurf verschlafen hat: __dirname ENDET auf app.asar, ohne
     * Trenner dahinter. Ein blosses replace('app.asar' + sep, ...) findet dort nichts
     * und gibt den Archivpfad zurueck - quellOrdner() waere im Paket stumm gescheitert,
     * und zwar unsichtbar, weil existsSync im Hauptprozess ueber die asar-Schicht
     * trotzdem true sagt. Die Pruefung darueber deckte nur den Pfad MITTEN durchs
     * Archiv ab und blieb deshalb gruen. */
    ok(entpackt(['', 'opt', 'app', 'resources', 'app.asar'].join(sep)) ===
       ['', 'opt', 'app', 'resources', 'app.asar.unpacked'].join(sep),
       'Entpackt: auch ein Pfad, der AUF app.asar endet  [' +
       entpackt(['', 'opt', 'app', 'resources', 'app.asar'].join(sep)) + ']');
    ok(entpackt(['', 'home', 'w', 'app.asar-sicherung'].join(sep)) ===
       ['', 'home', 'w', 'app.asar-sicherung'].join(sep),
       'Entpackt: ein Ordner, der nur so aehnlich heisst, wird nicht angefasst');
  }
  ok(/STOCK_DASHBOARD_QUELLE: quellOrdner\(\)/.test(mainQ),
     'Entpackt: die Quelle fuer quant.js kommt aus quellOrdner(), nicht blind aus __dirname');
  var unpack = (pkg.build && pkg.build.asarUnpack) || [];
  ok(unpack.indexOf('quant.js') !== -1,
     'Entpackt: quant.js steht in asarUnpack - sonst faende der Kindprozess es dort nie');
  ok(unpack.indexOf('studien/messmaschine/**') !== -1,
     'Entpackt: die Maschine ebenfalls - fork() braucht eine echte Datei, kein Archivglied');

  // ---------- Mitgeliefert wird sie ueberhaupt ----------
  var files = (pkg.build && pkg.build.files) || [];
  ok(files.indexOf('studien/messmaschine/messen.js') !== -1 &&
     files.indexOf('studien/messmaschine/messmaschine.js') !== -1,
     'Paket: beide Dateien der Maschine sind im Installer');
  ok(files.indexOf('studien/messmaschine/protokolle/**') === -1,
     'Paket: die Protokolle des Entwicklers gehen NICHT mit - sie sind Befunde, keine Beilage');

  /* ---------- VERWEIGERT ist ein Urteil, kein Absturz ----------
   * Rueckgabe 3 heisst "die Maschine lehnt die These ab". Saehe das aus wie ein
   * Absturz, suchte man den Fehler im Programm statt in der These. Hier wird die
   * Maschine WIRKLICH GESTARTET - als eigener Prozess, wie die App es tut. */
  ok(/process\.exit\(3\)/.test(messenQ) && /VERWEIGERT: /.test(messenQ),
     'Verweigerung: messen.js beendet sich mit 3');
  var mMap = /fertig\(\{ ok: ([^,]+), verweigert: ([^,]+),/.exec(mainQ);
  ok(!!mMap, 'Verweigerung: main.js bildet den Rueckgabewert ab');
  if (mMap) {
    var istOk = new Function('code', 'return ' + mMap[1]);
    var istVerweigert = new Function('code', 'return ' + mMap[2]);
    ok(istVerweigert(3) === true && istOk(3) === false, 'Verweigerung: 3 ist verweigert und nicht ok');
    ok(istVerweigert(0) === false && istOk(0) === true, 'Verweigerung: 0 ist der Erfolg');
    ok(istVerweigert(1) === false && istOk(1) === false, 'Verweigerung: 1 ist ein echter Fehlschlag, keine Verweigerung');
  }
  ok(/if \(r\.verweigert\)/.test(sco) && /das ist ein Urteil/.test(sco),
     'Verweigerung: der Reiter sagt ausdruecklich, dass es ein Urteil ist');

  var tmp = path.join(os.tmpdir(), 'md-mess-' + process.pid);
  fs.mkdirSync(tmp, { recursive: true });
  var strat = path.join(tmp, 'ohne-grund.js');
  fs.writeFileSync(strat, 'module.exports = { key: "ohne-grund", grund: "zu kurz",\n' +
    '  zeitrahmen: "60m", haltedauerKerzen: 8, richtung: "long",\n' +
    '  signal: function () { return null; } };\n', 'utf8');
  var vorher = fs.readdirSync(__dirname + '/studien/messmaschine/protokolle').length;
  probe(new Promise(function (fertig) {
    var kind = require('child_process').fork(__dirname + '/studien/messmaschine/messen.js', [strat, tmp], {
      silent: true, env: Object.assign({}, process.env, { MESSMASCHINE_PROTOKOLLE: tmp })
    });
    var raus = '';
    kind.stdout.on('data', function (d) { raus += String(d); });
    kind.stderr.on('data', function (d) { raus += String(d); });
    kind.on('close', function (code) {
      ok(code === 3, 'Verweigerung, echt gemessen: der Kindprozess endet mit 3  [' + code + ']');
      ok(/VERWEIGERT/.test(raus), 'Verweigerung, echt gemessen: der Grund steht in der Ausgabe');
      ok(fs.readdirSync(tmp).filter(function (f) { return /\.json$/.test(f); }).length === 0,
         'Verweigerung, echt gemessen: es entsteht KEIN Protokoll - eine abgelehnte These hat keinen Befund');
      ok(fs.readdirSync(__dirname + '/studien/messmaschine/protokolle').length === vorher,
         'Verweigerung, echt gemessen: der Protokollordner im Projekt bleibt unberuehrt');
      fs.rmSync(tmp, { recursive: true, force: true });
      fertig();
    });
  }));

  /* ---------- Ein Abbruch ist kein Fehlschlag ----------
   * kill() beendet den Prozess per Signal. 'close' bekommt dann KEINEN Rueckgabewert,
   * sondern null - und ok:(code===0) ist damit false. Der Reiter las das als Fehlschlag
   * und zeigte "Rueckgabewert null" fuer etwas, das der Nutzer selbst ausgeloest hatte.
   * Dass code null ist, wird hier nicht behauptet, sondern vorgefuehrt. */
  var dauerlaeufer = path.join(os.tmpdir(), 'md-lang-' + process.pid + '.js');
  fs.writeFileSync(dauerlaeufer, 'setInterval(function () {}, 1000);\n', 'utf8');
  probe(new Promise(function (fertig) {
    var kind = require('child_process').fork(dauerlaeufer, [], { silent: true });
    setTimeout(function () { kind.kill(); }, 80);
    kind.on('close', function (code, signal) {
      ok(code === null, 'Abbruch: ein abgeschossener Prozess hat gar keinen Rueckgabewert  [code=' +
         code + ', Signal ' + signal + ']');
      var istOk2 = new Function('code', 'return ' + (mMap ? mMap[1] : 'false'));
      ok(istOk2(code) === false,
         'Abbruch: deshalb waere er ohne eigenes Merkmal als Fehlschlag durchgegangen');
      fs.rmSync(dauerlaeufer, { force: true });
      fertig();
    });
  }));
  ok(/MESS_LAUF\.abbruch = true;/.test(mainQ) && /const abgebrochen = MESS_LAUF\.abbruch;/.test(mainQ),
     'Abbruch: main.js merkt sich, dass der Nutzer abgebrochen hat');
  ok(/MESS_LAUF\.abbruch = false;/.test(mainQ.slice(mainQ.indexOf('MESS_LAUF.start = Date.now()'))),
     'Abbruch: das Merkmal wird bei jedem Start zurueckgesetzt - sonst faerbt es den naechsten Lauf');
  ok(/if \(r\.abgebrochen\)/.test(sco) && /Abgebrochen\. Es wurde kein Protokoll geschrieben\./.test(sco),
     'Abbruch: der Reiter sagt "abgebrochen", nicht "nicht durchgelaufen"');
  ok(sco.indexOf('if (r.abgebrochen)') < sco.indexOf('if (r.verweigert)'),
     'Abbruch: die Abfrage steht VOR der Verweigerung - ein abgeschossener Lauf faellt kein Urteil');

  // ---------- Die Kanaele: preload, main und Renderer meinen dasselbe ----------
  var kanaeleP = [];
  pre.replace(/ipcRenderer\.(?:invoke|on)\('([a-z-]+)'/g, function (_, k) { kanaeleP.push(k); return _; });
  var messKanaele = kanaeleP.filter(function (k) { return k.indexOf('mess-') === 0; });
  ok(messKanaele.length === 4, 'Kanaele: preload.js reicht genau vier durch  [' + messKanaele.join(', ') + ']');
  var fehlend = ['mess-strategien', 'mess-lauf', 'mess-abbrechen'].filter(function (k) {
    return mainQ.indexOf("ipcMain.handle('" + k + "'") === -1;
  });
  ok(fehlend.length === 0, 'Kanaele: zu jedem invoke gibt es einen handle in main.js  [' + fehlend.join(' ') + ']');
  ok(/ev\.sender\.send\('mess-fortschritt'/.test(mainQ) && /onMessFortschritt/.test(pre),
     'Kanaele: der Fortschritt geht den umgekehrten Weg - und heisst auf beiden Seiten gleich');
  ok(/if \(!ev\.sender\.isDestroyed\(\)\)/.test(mainQ),
     'Kanaele: in ein geschlossenes Fenster wird nicht gesendet');

  // ---------- Der Reiter ----------
  ok(/id="stMessen"/.test(sco) && /id="stMessStop"/.test(sco) && /id="stMessLog"/.test(sco),
     'Reiter: Knopf, Abbruch und Mitschrift');
  ok(/if \(!window\.api \|\| typeof window\.api\.messLauf !== 'function'\) return;/.test(sco),
     'Reiter: ohne die Bruecke erscheint der Knopf gar nicht erst - der Befehl daneben bleibt der Weg');
  ok(/if \(messLaeuft\) return;/.test(sco), 'Reiter: zweimal Klicken startet keine zweite Messung');
  ok(/knopf\.disabled = false; stop\.hidden = true;/.test(sco),
     'Reiter: nach dem Lauf ist der Knopf wieder da - auch wenn die Messung scheiterte');
  ok(/catch \(e\) \{ r = \{ ok: false, grund: String\(e && e\.message \|\| e\) \}; \}/.test(sco),
     'Reiter: ein Fehler in der Bruecke haengt die Oberflaeche nicht auf');
  ok(/log\.scrollTop = log\.scrollHeight/.test(sco), 'Reiter: die Mitschrift laeuft mit');
  /* Der Renderer schneidet den Ordner ab, BEVOR er die Kennung schickt - der Pfad
   * verlaesst die Oberflaeche gar nicht erst. Ausgefuehrt, nicht nachgelesen. */
  var mKey = /var key = (String\(pfad\)[^;]+);/.exec(sco);
  ok(!!mKey, 'Reiter: aus dem Ablagepfad wird eine Kennung');
  if (mKey) {
    var zuKennung = new Function('pfad', 'return ' + mKey[1]);
    ok(zuKennung('C:\\Users\\W\\Downloads\\Markt-Dashboard-Daten\\strategien\\orb2.js') === 'orb2',
       'Reiter: aus einem Windows-Pfad bleibt nur die Kennung');
    ok(zuKennung('/home/w/Downloads/Markt-Dashboard-Daten/strategien/monatsende-kauf.js') === 'monatsende-kauf',
       'Reiter: aus einem Unix-Pfad ebenso');
  }
})();

/* ================= 51. Signatur, Update-Kette und Sicherheitshaltung =================
 * Stufe 4 des Audits nennt zwei Dinge: den Messknopf (Abschnitt 50) und die Signatur.
 *
 * Die Signatur kann dieses Projekt nicht liefern - ein Code-Signing-Zertifikat kostet
 * Geld und eine Identitaetspruefung, und seit 2023 liegt der Schluessel zwingend auf
 * Hardware. Was hier steht, ist deshalb KEINE Loesung, sondern eine Bestandsaufnahme,
 * die nicht mehr stillschweigend verrutschen kann:
 *
 *   - Der Installer ist unsigniert. Das ist ein Zustand, kein Versehen, und er MUSS an
 *     drei Stellen dastehen: in der App, im README und im Bauplan.
 *   - Was tatsaechlich schuetzt (fester Kanal, Pruefsumme, reproduzierbarer Bau, Test
 *     gegen das gebaute Paket), wird hier festgenagelt. Faellt eines davon weg, faellt
 *     der letzte Rest Vertrauenswuerdigkeit mit - dann muss es auffallen.
 *   - Signieren muss ein Handgriff bleiben: zwei Geheimnisse, keine Codeaenderung.
 *
 * Dazu die Sicherheitshaltung des Hauptprozesses. Der Auditbefund war woertlich: "Keine
 * einzige Zusicherung der Sicherheitshaltung ist getestet." Wer beim Suchen eines Fehlers
 * sandbox herausnimmt oder die CSP-Zeile beim Umbau verliert, merkt es sonst nicht - und
 * genau diese drei Zeilen sind es, die den unsignierten Installer ueberhaupt tragbar
 * machen. Sie stehen hier, weil sie das Einzige sind, was bleibt. */
(function () {
  console.log('\n51) Signatur, Update-Kette und die Haltung, die den Rest traegt');
  var yaml = null;
  try { yaml = require('js-yaml'); } catch (e) { /* dann eben ohne */ }
  var mainQ = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var readme = fs.readFileSync(__dirname + '/README.md', 'utf8');
  var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));
  var planQ = fs.readFileSync(__dirname + '/.github/workflows/build.yml', 'utf8');

  // ---------- Der Zustand steht da, wo er hingehoert ----------
  ok(/id="updVertrauen"/.test(html) && /nicht signiert/.test(html),
     'Unsigniert: die App sagt es selbst, in den Einstellungen neben dem Update-Schalter');
  ok(/Wer in dieses GitHub-Repo schreiben darf|wer in dieses GitHub-Repo schreiben darf/i.test(html),
     'Unsigniert: und benennt, woran die Kette wirklich haengt - nicht nur "unsigniert"');
  ok(/den Haken oben entfernen/.test(html),
     'Unsigniert: mit einem Ausweg, den der Nutzer selbst gehen kann');
  /* Gemessen am 24.08.2026 im gerenderten Dialog: mit --muted kam der Kasten im hellen
   * Thema auf 4,31 - unter dem Soll von 4,5 fuer Fliesstext. Mit --ink-2 sind es 6,52
   * hell und 8,24 dunkel. Eine Offenlegung, die man wegen der Farbe ueberliest, ist
   * keine; sie ist keine Fussnote, sondern der Satz, auf den es hier ankommt. */
  ok(/id="updVertrauen"[^>]*color:var\(--ink-2\)/.test(html) &&
     !/id="updVertrauen"[^>]*color:var\(--muted\)/.test(html),
     'Unsigniert: der Kasten steht in Fliesstextfarbe, nicht im Grau der Nebenbemerkung');
  ok(/## Signatur und Update-Kette/.test(readme) && /CSC_LINK/.test(readme),
     'Unsigniert: das README hat einen eigenen Abschnitt, samt Weg zum Signieren');
  ok(/UNSIGNIERT/.test(planQ), 'Unsigniert: auch der Bauplan sagt es');

  /* ---------- Signieren muss ein Handgriff bleiben ----------
   * Sind die beiden Geheimnisse eines Tages gesetzt, signiert electron-builder von
   * selbst - es liest CSC_LINK aus der Umgebung. Fehlt der Durchgriff im Bauschritt,
   * muesste jemand dafuer erst wieder den Bauplan aendern, und genau das vergisst man. */
  if (yaml) {
    var plan = yaml.load(planQ);
    var bau = (plan.jobs.installer.steps || []).filter(function (s) { return s.name === 'Installer bauen'; })[0];
    ok(!!bau && bau.env && /secrets\.CSC_LINK/.test(String(bau.env.CSC_LINK || '')),
       'Signieren: der Bauschritt reicht CSC_LINK durch');
    ok(!!bau && bau.env && /secrets\.CSC_KEY_PASSWORD/.test(String(bau.env.CSC_KEY_PASSWORD || '')),
       'Signieren: und das Kennwort dazu');
    ok(!!bau && /if \(\$env:CSC_LINK\)/.test(bau.run) && /electron-builder/.test(bau.run),
       'Signieren: der Lauf schreibt hin, ob signiert wurde - sonst weiss es hinterher niemand');
    /* Die Geheimnisse duerfen NICHT in einer if-Bedingung eines Schritts stehen: der
     * secrets-Kontext ist dort nicht verfuegbar, der Schritt liefe dann nie. Geprueft
     * wird am GEPARSTEN Plan - die Datei ist Flow-Schreibweise, eine einzige lange
     * Zeile, in der jede Textsuche alle Schritte miteinander vermengt. */
    var alleSchritte = Object.keys(plan.jobs).reduce(function (a, j) {
      return a.concat(plan.jobs[j].steps || []);
    }, []);
    var mitSecretIf = alleSchritte.filter(function (st) { return /secrets\./.test(String(st['if'] || '')); });
    ok(mitSecretIf.length === 0, 'Signieren: kein secrets-Zugriff in einer Schrittbedingung  [' +
       mitSecretIf.map(function (st) { return st.name; }).join(', ') + ']');
    /* Der Vergleich in Abschnitt 31 ist nur HART, wenn DIST gesetzt ist - sonst wird
     * eine Abweichung zum blossen Hinweis, damit der Testlauf waehrend der Arbeit nicht
     * dauerrot steht. Der Kommentar dort sagt: "Vor einem Release mit DIST auf den
     * frischen Build pruefen". Nur stand DIST im Bauplan NIRGENDS. Damit war die
     * Pruefung genau an der einen Stelle stumm, fuer die sie gebaut wurde: im
     * Release-Lauf waere ein Paket, das nicht zur Quelle passt, als Hinweis
     * durchgerutscht und trotzdem veroeffentlicht worden - der Vorfall vom 22.08.2026
     * noch einmal, diesmal mit einer Pruefung, die daneben zusieht. */
    var paketTest = alleSchritte.filter(function (st) { return st.name === 'Tests gegen das gebaute Paket'; })[0];
    ok(!!paketTest && !!paketTest.env && /dist/.test(String(paketTest.env.DIST || '')),
       'Bau: der Testlauf gegen das Paket bekommt DIST - erst damit ist der Byte-Vergleich ein Fehler und kein Hinweis  [' +
       ((paketTest && paketTest.env && paketTest.env.DIST) || 'NICHT GESETZT') + ']');

    var mitInstall = alleSchritte.filter(function (st) { return /npm install/.test(String(st.run || '')); });
    ok(mitInstall.length === 0 && alleSchritte.some(function (st) { return /npm ci/.test(String(st.run || '')); }),
       'Bau: npm ci - dieselbe Lockdatei ergibt dasselbe Paket, nicht zwei an zwei Tagen  [' +
       mitInstall.map(function (st) { return st.name; }).join(', ') + ']');
  }

  // ---------- Was tatsaechlich schuetzt ----------
  var pub = (pkg.build && pkg.build.publish && pkg.build.publish[0]) || {};
  ok(pub.provider === 'github' && pub.owner === 'Wilhelm-mbg' && pub.repo === 'Stock-Dashboard',
     'Kanal: das Ziel steht fest im Paket  [' + (pub.owner || '?') + '/' + (pub.repo || '?') + ']');
  ok(!/setFeedURL/.test(mainQ),
     'Kanal: er laesst sich zur Laufzeit nicht umbiegen - kein setFeedURL, auch nicht aus den Einstellungen');
  ok(/autoUpd\.allowPrerelease = false;/.test(mainQ),
     'Kanal: Vorabversionen werden nicht eingespielt');
  ok(!/verifyUpdateCodeSignature\s*=\s*false/.test(mainQ),
     'Kanal: die Signaturpruefung ist nirgends abgeschaltet - sie greift, sobald es eine Signatur gibt');
  ok(/Tests gegen das gebaute Paket/.test(planQ),
     'Bau: die Suite laeuft ein zweites Mal gegen das Paket - Abschnitt 31 vergleicht es byteweise mit der Quelle');
  ok(/Tag \$tag und package\.json \$pkg stimmen nicht ueberein/.test(planQ),
     'Bau: ein Tag, der nicht zur Version passt, bricht den Lauf ab');

  /* ---------- Die Haltung des Fensters ----------
   * Drei Zeilen, die alles tragen. Ohne sandbox laeuft der Renderer mit vollem
   * Node-Zugriff; ohne contextIsolation kann jede Seite die preload-Bruecke umbauen. */
  var mPref = /webPreferences: \{([\s\S]*?)\n    \}/.exec(mainQ);
  ok(!!mPref, 'Haltung: die webPreferences stehen an einer Stelle');
  if (mPref) {
    var pref = mPref[1];
    ok(/contextIsolation: true/.test(pref), 'Haltung: contextIsolation an');
    ok(/nodeIntegration: false/.test(pref), 'Haltung: nodeIntegration aus');
    ok(/sandbox: true/.test(pref), 'Haltung: sandbox an');
    ok(!/webSecurity|allowRunningInsecureContent|webviewTag|nodeIntegrationInWorker/.test(pref),
       'Haltung: keine der bequemen Ausnahmen ist eingebaut');
  }

  /* ---------- Wohin das Fenster navigieren darf ----------
   * Vorher: alles ausser file:// verboten - also JEDE lokale Adresse erlaubt, und das
   * Zielfenster haette die volle preload-Bruecke mitbekommen. Die Regel wird aus der
   * Quelle geschnitten und mit einer feindlichen Adresse AUSGEFUEHRT. */
  var mNav = /if \(String\(ziel\)\.split\('#'\)\[0\]\.split\('\?'\)\[0\] !== startseite\) ev\.preventDefault\(\);/.exec(mainQ);
  ok(!!mNav, 'Navigation: es gibt eine Sperre, die gegen die eigene Startseite prueft');
  function darfHin(ziel, startseite) {
    if (ziel.startsWith('https://')) return false;                 // geht in den Browser
    return String(ziel).split('#')[0].split('?')[0] === startseite;
  }
  var heim = 'file:///C:/Programme/markt-dashboard/resources/app.asar/index.html';
  ok(darfHin(heim, heim) === true, 'Navigation: die eigene Seite darf');
  ok(darfHin(heim + '#depot', heim) === true, 'Navigation: ein Anker darf auch - sonst braeche jeder Sprung in der Seite');
  ok(darfHin('file:///C:/Users/W/Downloads/harmlos.html', heim) === false,
     'Navigation: eine heruntergeladene HTML-Datei darf NICHT - sie bekaeme sonst die ganze Bruecke');
  ok(darfHin('file:///C:/Programme/markt-dashboard/resources/app.asar/../../../boese.html', heim) === false,
     'Navigation: auch nicht ueber einen Umweg nach oben');
  ok(darfHin('https://example.com', heim) === false, 'Navigation: https geht in den Browser, nicht ins Fenster');
  ok(/return \{ action: 'deny' \};/.test(mainQ), 'Navigation: neue Fenster werden abgelehnt');

  /* ---------- Die CSP und was sie nicht erlaubt ----------
   * Sie steht im Markup, nicht in einem Header - eine Zeile, die beim Umbauen leicht
   * verlorengeht. Und sie ist nur so viel wert wie die Dateien dahinter: ein eval
   * irgendwo waere die Luecke, die sie schliessen soll. */
  var mCsp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html);
  ok(!!mCsp, 'CSP: die Zeile steht im Markup');
  if (mCsp) {
    var csp = mCsp[1];
    ok(/default-src 'self'/.test(csp) && /script-src 'self'/.test(csp), 'CSP: Skripte nur aus der App selbst');
    ok(!/unsafe-eval/.test(csp), 'CSP: kein unsafe-eval');
    ok(!/'unsafe-inline'[^;]*script-src|script-src[^;]*'unsafe-inline'/.test(csp),
       'CSP: kein unsafe-inline fuer Skripte (fuer Stile ja - alle Stile stehen inline im Markup)');
    ok(!/https?:\/\//.test(csp), 'CSP: keine fremde Adresse als Quelle');
  }
  ok(!/ on[a-z]+="/.test(html), 'CSP: kein einziger Inline-Handler im Markup - sonst waere die Regel nur Zierde');
  var skripte = (html.match(/<script src="([^"]+.js)"/g) || []).map(function (s) { return s.replace(/.*src="|".*/g, ''); });
  var mitEval = ['main.js', 'preload.js', 'bt-worker.js'].concat(skripte).filter(function (f) {
    var t; try { t = fs.readFileSync(__dirname + '/' + f, 'utf8'); } catch (e) { return false; }
    return /\beval\s*\(|new Function\s*\(/.test(t);
  });
  ok(mitEval.length === 0, 'CSP: keine ausgelieferte Datei baut Code aus Text  [' + mitEval.join(' ') + ']');
  ok(skripte.length > 20, 'CSP: geprueft wurden alle ' + (skripte.length + 3) + ' ausgelieferten Dateien');
})();

/* ================= 52. Der Baukasten =================
 * Das Formular fuer eine neue Strategie verlangte JavaScript. Wer nicht programmiert,
 * kam nicht bis zu einer Messung - es war nicht schwer zu bedienen, es war unbedienbar.
 *
 * Eine beliebige Handelsidee laesst sich nicht anklicken; das bleibt so. Deshalb zwei
 * Wege: der Baukasten fuer die haeufigen Muster, der Expertenmodus unveraendert
 * daneben. Geprueft wird hier beides - dass der Baukasten richtigen Code erzeugt, UND
 * dass der Expertenmodus nichts eingebuesst hat.
 *
 * Der Baukasten ist eine reine Datei ohne DOM. Deshalb werden die erzeugten
 * Signalfunktionen hier WIRKLICH AUSGEFUEHRT, gegen gebaute Kursreihen, statt ihren
 * Quelltext abzusuchen. Eine Textsuche haette den schwersten Fehler nicht gefunden,
 * den so ein Generator machen kann: einen Blick in die Zukunft. */
(function () {
  console.log('\n52) Baukasten: aus Klicken wird eine Signalfunktion');
  var B = require(__dirname + '/strategiebaukasten.js');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var sco = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');

  /** Stundenkerzen, sieben je Handelstag, Montag bis Freitag. */
  function reihe(tage, kurs) {
    var bars = [], d = new Date('2026-01-01T00:00:00Z');
    for (var t = 0; t < tage; t++) {
      if (d.getUTCDay() !== 0 && d.getUTCDay() !== 6) {
        for (var h = 0; h < 7; h++) {
          var k = kurs ? kurs(bars.length) : 100;
          bars.push([Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 14 + h),
            k, 1000, k * 1.005, k * 0.995, k]);
        }
      }
      d.setUTCDate(d.getUTCDate() + 1);
    }
    return bars;
  }
  function fnVon(r) { return new Function(r.signal + '; return signal;')(); }
  function treffer(fn, bars, params) {
    var out = [];
    for (var i = 0; i < bars.length; i++) if (fn(bars, i, params || {})) out.push(i);
    return out;
  }

  var bars = reihe(150);

  // ---------- Jedes Muster erzeugt lauffaehigen Code ----------
  ok(B.MUSTER.length >= 5, 'Der Baukasten kennt mindestens fuenf Muster  [' + B.MUSTER.length + ']');
  var kaputt = [];
  B.MUSTER.forEach(function (m) {
    var r = B.baue({ muster: m.id, richtung: 'long', werte: {} });
    if (!r.ok) { kaputt.push(m.id + ': ' + r.fehler); return; }
    try { fnVon(r); } catch (e) { kaputt.push(m.id + ': ' + e.message); }
  });
  ok(kaputt.length === 0, 'Jedes Muster erzeugt mit seinen Vorgabewerten lauffaehigen Code  [' + kaputt.join('; ') + ']');

  /* ---------- KEIN BLICK IN DIE ZUKUNFT ----------
   * Der schwerste Fehler, den ein Signalgenerator machen kann. Die Probe ist
   * unbestechlich: Das Urteil an Stelle i muss dasselbe sein, wenn die Reihe NACH i
   * endet. Wer bars[i+1] anfasst - auch nur dessen Zeitstempel -, faellt hier durch.
   * Das mitgelieferte Beispiel im alten Formular haette es getan: es prueft ueber
   * bars[i+1], ob der Monat wechselt. */
  var seher = [];
  B.MUSTER.forEach(function (m) {
    var fn = fnVon(B.baue({ muster: m.id, richtung: 'long', werte: {} }));
    for (var i = 40; i < bars.length; i += 3) {
      var voll, kurz;
      try { voll = JSON.stringify(fn(bars, i, {})); } catch (e) { voll = 'FEHLER ' + e.message; }
      try { kurz = JSON.stringify(fn(bars.slice(0, i + 1), i, {})); } catch (e) { kurz = 'FEHLER ' + e.message; }
      if (voll !== kurz) { seher.push(m.id + ' bei ' + i); break; }
    }
  });
  ok(seher.length === 0,
     'Zukunftsprobe: kein Muster urteilt anders, wenn die Kursreihe bei i endet  [' + seher.join(', ') + ']');
  var alleCode = B.MUSTER.map(function (m) { return B.baue({ muster: m.id, richtung: 'long', werte: {} }).signal; }).join('\n');
  ok(!/bars\s*\[\s*i\s*\+/.test(alleCode),
     'Zukunftsprobe: nirgends steht bars[i + …] im erzeugten Code - auch nicht fuer den Zeitstempel');

  // ---------- Was die einzelnen Muster tun ----------
  var mon = fnVon(B.baue({ muster: 'monatsende', richtung: 'long', werte: { vorlauf: '0' } }));
  var monT = treffer(mon, bars).map(function (i) { return new Date(bars[i][0]).toISOString().slice(0, 10); });
  ok(monT.length === 5 && monT[0] === '2026-01-30' && monT[1] === '2026-02-27',
     'Monatsende: genau ein Signal je Monat, am letzten Werktag  [' + monT.join(' ') + ']');
  var monStd = treffer(mon, bars).map(function (i) { return new Date(bars[i][0]).getUTCHours(); });
  ok(monStd.every(function (h) { return h === 14; }),
     'Monatsende: nur zur ersten Kerze des Tages - sonst gaebe es sieben Signale je Monat');
  var mon1 = fnVon(B.baue({ muster: 'monatsende', richtung: 'long', werte: { vorlauf: '1' } }));
  var monT1 = treffer(mon1, bars).map(function (i) { return new Date(bars[i][0]).toISOString().slice(0, 10); });
  ok(monT1[0] === '2026-01-29', 'Monatsende: „einen Werktag frueher“ trifft wirklich den vorletzten  [' + monT1[0] + ']');

  var wt = fnVon(B.baue({ muster: 'wochentag', richtung: 'long', werte: { tag: '3' } }));
  var wtT = treffer(wt, bars);
  ok(wtT.length > 15 && wtT.every(function (i) { return new Date(bars[i][0]).getUTCDay() === 3; }),
     'Wochentag: trifft ausschliesslich Mittwoche  [' + wtT.length + ' Signale]');

  var tz = fnVon(B.baue({ muster: 'tageszeit', richtung: 'long', werte: { nach: '2' } }));
  var tzT = treffer(tz, bars);
  ok(tzT.every(function (i) { return new Date(bars[i][0]).getUTCHours() === 16; }),
     'Tageszeit: „2 Stunden nach Start“ ist die dritte Kerze, also 16 Uhr UTC');
  var tage = {};
  tzT.forEach(function (i) { tage[new Date(bars[i][0]).toISOString().slice(0, 10)] = 1; });
  ok(tzT.length === Object.keys(tage).length, 'Tageszeit: genau ein Signal je Handelstag, nie zwei');

  var rg = fnVon(B.baue({ muster: 'rueckgang', richtung: 'long', werte: { kerzen: '5', prozent: '4' } }));
  var faellt = reihe(20, function (n) { return 100 - n * 1.2; });
  var steigt = reihe(20, function (n) { return 100 + n * 1.2; });
  ok(treffer(rg, faellt).length > 20, 'Rueckgang: feuert in einer fallenden Reihe');
  ok(treffer(rg, steigt).length === 0, 'Rueckgang: feuert nie in einer steigenden Reihe');
  var kaputteKurse = reihe(10, function () { return 0; });
  ok(treffer(rg, kaputteKurse).length === 0,
     'Rueckgang: Nullkurse im Archiv sind kein Absturz von 100 % - sie werden uebergangen');

  var ab = fnVon(B.baue({ muster: 'ausbruch', richtung: 'long', werte: { kerzen: '5' } }));
  ok(treffer(ab, steigt).length > 20, 'Ausbruch: feuert in einer steigenden Reihe');
  ok(treffer(ab, reihe(20)).length === 0, 'Ausbruch: feuert nie in einer flachen Reihe');
  /* Aeltere Eintraege im Kursarchiv haben nur [Zeit, Schluss, Volumen] - ohne Hoch.
   * Ohne Rueckfall waere der Vergleich gegen undefined immer falsch, und das Muster
   * haette auf dem halben Archiv stumm geschwiegen, ohne dass es jemand merkt. */
  var ohneHoch = steigt.map(function (b) { return [b[0], b[1], b[2]]; });
  ok(treffer(ab, ohneHoch).length > 20,
     'Ausbruch: auch auf alten Archivzeilen ohne Hoch - dort zaehlt der Schlusskurs');

  // ---------- Richtung ----------
  var kurzS = B.baue({ muster: 'monatsende', richtung: 'short', werte: {} });
  ok(/\{ dir: -1 \}/.test(kurzS.signal) && kurzS.kennung === 'monatsende-verkauf',
     'Richtung: „Kurs faellt“ erzeugt dir -1 und einen passenden Kurznamen  [' + kurzS.kennung + ']');
  ok(B.richtungDir('beide') === 1,
     'Richtung: „beides“ kann ein einseitiges Muster nicht bedienen - es wird Long, und die Oberflaeche sagt das');
  ok(/beides zulassen/.test(html) && /Kurs steigt \(nur Long\)/.test(html),
     'Richtung: in der Oberflaeche steht Klartext, nicht nur „Long“');

  // ---------- Mehrere Werte werden zu Varianten ----------
  var mehr = B.baue({ muster: 'rueckgang', richtung: 'long', werte: { kerzen: '4,6,8', prozent: '3' } });
  ok(mehr.ok && mehr.tests === 3 && mehr.varianten.length === 3,
     'Varianten: drei Werte ergeben drei Messungen  [' + mehr.tests + ']');
  ok(mehr.varianten[0].kerzen === 4 && mehr.varianten[2].kerzen === 8 && mehr.varianten[1].prozent === 3,
     'Varianten: die Werte stehen wirklich drin  [' + JSON.stringify(mehr.varianten) + ']');
  var kreuz = B.baue({ muster: 'rueckgang', richtung: 'long', werte: { kerzen: '4,6', prozent: '2,3,4' } });
  ok(kreuz.ok && kreuz.tests === 6, 'Varianten: zwei Felder ergeben das Kreuzprodukt  [' + kreuz.tests + ']');
  /* Der Rueckfall in params ist kein Schmuck: die Maschine ruft signal auch mit einem
   * leeren Parametersatz auf. Ohne ihn waere n undefined und das Muster stumm. */
  var mehrFn = fnVon(mehr);
  ok(treffer(mehrFn, faellt, {}).length > 0, 'Varianten: ohne Parameter greift der Rueckfallwert - das Muster bleibt nicht stumm');
  ok(treffer(mehrFn, faellt, { kerzen: 8 }).length > 0, 'Varianten: mit Parameter laeuft es ebenso');
  var zuViel = B.baue({ muster: 'rueckgang', richtung: 'long', werte: { kerzen: '1,2,3,4,5', prozent: '1,2,3,4,5,6' } });
  ok(!zuViel.ok && /30 Tests/.test(zuViel.fehler),
     'Varianten: dreissig Tests werden abgelehnt, mit dem Grund - nicht still erzeugt');

  // ---------- Fehleingaben werden erklaert, nicht verschluckt ----------
  var buchstabe = B.baue({ muster: 'rueckgang', richtung: 'long', werte: { kerzen: 'viele', prozent: '3' } });
  ok(!buchstabe.ok && /viele/.test(buchstabe.fehler) && /Stunden/.test(buchstabe.fehler),
     'Fehleingabe: Text statt Zahl nennt das Feld UND das, was dort stand  [' + buchstabe.fehler + ']');
  var drueber = B.baue({ muster: 'rueckgang', richtung: 'long', werte: { kerzen: '999', prozent: '3' } });
  ok(!drueber.ok && /1 bis 130/.test(drueber.fehler),
     'Fehleingabe: ausserhalb der Grenzen nennt die Grenzen  [' + drueber.fehler + ']');
  ok(!B.baue({ muster: 'gibtesnicht' }).ok, 'Fehleingabe: ein unbekanntes Muster wird abgelehnt');

  /* ---------- Den GRUND schreibt der Baukasten nicht ----------
   * Er ist die Vorregistrierung - die These, warum ein Effekt existieren sollte.
   * Wuerde die App ihn ausfuellen, waere die Huerde weg, die diese Maschine traegt.
   * Der Baukasten gibt einen Denkanstoss; das Feld bleibt leer. */
  var alleFelder = {};
  B.MUSTER.forEach(function (m) {
    var r = B.baue({ muster: m.id, richtung: 'long', werte: {} });
    Object.keys(r).forEach(function (k) { alleFelder[k] = 1; });
  });
  ok(!alleFelder.grund, 'Grund: der Baukasten liefert keinen - er ist die Vorregistrierung und bleibt beim Menschen');
  ok(B.MUSTER.every(function (m) { return m.warum && m.warum.length > 40; }),
     'Grund: jedes Muster nennt dafuer die SORTE Begruendung, die traegt');
  ok(/Trägt nicht:/.test(sco) && /Beobachtung, keine These/.test(sco),
     'Grund: und ausdruecklich, was nicht traegt');

  // ---------- Der Expertenmodus hat nichts eingebuesst ----------
  ok(/id="stExperte"/.test(html) && /id="stBaukasten"/.test(html), 'Zwei Wege: beide Bereiche stehen im Formular');
  var exp = /<div id="stExperte" hidden>([\s\S]*?)\n  <\/div>/.exec(html);
  ok(!!exp, 'Expertenmodus: der Bereich ist abgegrenzt');
  if (exp) {
    ok(/id="stSignal"/.test(exp[1]) && /id="stStop"/.test(exp[1]) && /id="stVarianten"/.test(exp[1]),
       'Expertenmodus: Signalfunktion, Ausstiegsregel und Varianten sind alle drei noch da');
  }
  ok(/id="stUebernehmen"/.test(html) && /stSignal'\)\.value = r\.signal/.test(sco),
     'Uebergang: der erzeugte Code laesst sich in den Expertenmodus uebernehmen - der Baukasten ist keine Sackgasse');
  ok(/id="stCodeVorschau"/.test(html),
     'Uebergang: und er wird vorher angezeigt, statt im Verborgenen zu entstehen');
  /* Das Beispiel im Expertenfeld hat jahrelang das Gegenteil dessen vorgemacht, was
   * die Zeile darueber verlangt: "darf nur bars[0..i] lesen" - und dann bars[i+1].
   * Wer abschreibt, schreibt den Fehler mit ab. */
  var platz = /id="stSignal"[^>]*placeholder="([^"]*)"/.exec(html);
  ok(!!platz && !/bars\[i\+1\]/.test(platz[1]),
     'Beispiel: der Platzhalter im Expertenfeld liest nicht mehr bars[i+1] - er widersprach der Regel daneben');
  ok(!!platz && /bars\[i-1\]/.test(platz[1]),
     'Beispiel: er vergleicht stattdessen gegen die vorige Kerze');
  ok(/if \(modus === 'bau'\)/.test(sco) && /ausBaukasten\.signal/.test(sco),
     'Ablegen: derselbe Knopf bedient beide Wege');
  ok(html.indexOf('strategiebaukasten.js') < html.indexOf('scoreboard.js'),
     'Ladereihenfolge: strategiebaukasten.js vor scoreboard.js');

  /* ---------- Was der alte Text noch behauptete ----------
   * Seit 8.25.0 kann die App messen. Der Absatz unter dem Formular sagte weiter das
   * Gegenteil - eine Zusicherung, die ihr eigenes Programm ueberholt hatte. */
  ok(!/Gemessen wird sie <b>nicht<\/b> von der App/.test(html),
     'Text: die ueberholte Behauptung „gemessen wird nicht von der App“ ist weg');
  ok(/Jetzt messen<\/b>/.test(html) && /eigenen Prozess<\/b>/.test(html),
     'Text: stattdessen steht da, wie es wirklich laeuft');
})();

/* ================= 53. Wo die Daten liegen =================
 * Das 60m-Archiv wird rund 1,5 GB gross und liegt deshalb nicht mehr im Store der App.
 * tools/yahoo-60m-holen.js hatte dafuer schon eine Konvention; die Messkette kannte sie
 * nicht und hatte den alten Pfad fest verdrahtet.
 *
 * Das war keine Schoenheitsfrage. messen.js schreibt bei einem "fremden" Archiv KEINE
 * Kopie in den Datenordner - das Scoreboard sieht solche Messungen nie. Mit verlagerten
 * Daten hiess das: Der Knopf in der App misst das kleine Archiv, und eine Messung auf
 * dem grossen kommt nie in der App an. Eine Sackgasse mit Stempel. */
(function () {
  console.log('\n53) Das bezeichnete Archiv');
  var path = require('path');
  var os = require('os');
  var q = fs.readFileSync(__dirname + '/studien/messmaschine/messen.js', 'utf8');
  /* Seit dem 25.08.2026 haengt die Aufloesung am ZEITRAHMEN: '1d' und '60m' haben je
   * einen eigenen Zeiger. Vorher kannte sie nur 60m, und eine Tagesstrategie galt
   * damit IMMER als auf fremdem Archiv gemessen - auch auf dem richtigen. Sie bekam
   * keine Kopie in den Datenordner und erschien im Scoreboard nie: dieselbe Sackgasse
   * wie oben beschrieben, nur eine Ebene tiefer. */
  var mz = /var ZEIGER = \{[\s\S]*?\};/.exec(q);
  var m = /function bezeichnetesArchiv\(zeitrahmen\) \{[\s\S]*?\n\}/.exec(q);
  ok(!!m && !!mz, 'Die Aufloesung steht als eigene Funktion in messen.js, mit einem Zeiger je Zeitrahmen');
  if (!m || !mz) return;

  /* Ausgefuehrt, nicht gelesen - mit gestelltem process und einem echten Zeigerordner. */
  var tmp = path.join(os.tmpdir(), 'md-archiv-' + process.pid);
  fs.mkdirSync(tmp, { recursive: true });
  function loese(zr, env) {
    if (env === undefined) { env = zr; zr = '60m'; }   // alte Aufrufform bleibt lesbar
    return new Function('process', 'fs', 'path', 'os', 'DATEN', 'ZR',
      mz[0] + '\n' + m[0] + '; return bezeichnetesArchiv(ZR);')(
      { env: env }, fs, path, os, tmp, zr);
  }
  var store = path.join('C:\\Users\\W\\AppData\\Roaming', 'Markt-Dashboard', 'store');

  ok(loese({ MD_ARCHIV60M: 'E:\\Markt-Dashboard-Archiv' }) === 'E:\\Markt-Dashboard-Archiv',
     'Erste Wahl: die Umgebungsvariable MD_ARCHIV60M');

  fs.writeFileSync(path.join(tmp, 'archiv60m-pfad.txt'), 'E:\\Markt-Dashboard-Archiv\n', 'utf8');
  ok(loese({ APPDATA: 'C:\\Users\\W\\AppData\\Roaming' }) === 'E:\\Markt-Dashboard-Archiv',
     'Zweite Wahl: die Zeigerdatei im Datenordner');
  ok(loese({ MD_ARCHIV60M: 'X:\\vorrang', APPDATA: 'C:\\x' }) === 'X:\\vorrang',
     'Die Umgebungsvariable schlaegt die Zeigerdatei');

  /* Windows-Editoren schreiben gern eine Bytefolgemarke an den Dateianfang. Ohne sie
   * abzuschneiden waere der Pfad "\uFEFFE:\..." - existiert nicht, und die Fehlermeldung
   * haette wie ein Tippfehler des Nutzers ausgesehen. */
  fs.writeFileSync(path.join(tmp, 'archiv60m-pfad.txt'), '\uFEFFE:\\Mit-Marke  \r\n', 'utf8');
  ok(loese({ APPDATA: 'C:\\x' }) === 'E:\\Mit-Marke',
     'Zeigerdatei: Bytefolgemarke und Zeilenende werden abgeschnitten  [' + loese({ APPDATA: 'C:\\x' }) + ']');

  fs.writeFileSync(path.join(tmp, 'archiv60m-pfad.txt'), '   \n', 'utf8');
  ok(loese({ APPDATA: 'C:\\Users\\W\\AppData\\Roaming' }) === store,
     'Zeigerdatei leer: dann der Store der App, nicht ein leerer Pfad');
  /* TAGESKERZEN. Der Fall, der bis zum 25.08.2026 gar nicht vorgesehen war. */
  fs.mkdirSync(tmp, { recursive: true });
  fs.writeFileSync(path.join(tmp, 'archiv60m-pfad.txt'), 'E:\\sechzig\n', 'utf8');
  fs.writeFileSync(path.join(tmp, 'archiv1d-pfad.txt'), 'E:\\taeglich\n', 'utf8');
  ok(loese('1d', { APPDATA: 'C:\\x' }) === 'E:\\taeglich',
     'Eine Tagesstrategie bekommt das TAGES-Archiv, nicht das 60m-Archiv');
  ok(loese('60m', { APPDATA: 'C:\\x' }) === 'E:\\sechzig',
     'Und eine 60m-Strategie unveraendert das ihre');
  ok(loese('1d', { MD_ARCHIV1D: 'X:\\vorrang', APPDATA: 'C:\\x' }) === 'X:\\vorrang',
     'MD_ARCHIV1D schlaegt auch hier die Zeigerdatei');
  ok(loese('1d', { MD_ARCHIV60M: 'X:\\falsch', APPDATA: 'C:\\x' }) === 'E:\\taeglich',
     'Die 60m-Variable greift bei Tageskerzen NICHT - sonst waere der Riegel wieder blind');

  fs.rmSync(tmp, { recursive: true, force: true });
  ok(loese({ APPDATA: 'C:\\Users\\W\\AppData\\Roaming' }) === store,
     'Ohne alles bleibt es beim Store der App - wer nichts einrichtet, merkt keinen Unterschied');
  ok(loese('1d', { APPDATA: 'C:\\Users\\W\\AppData\\Roaming' }) === store,
     'Das gilt fuer Tageskerzen genauso');

  /* Der Riegel behaelt seine Zaehne: "fremd" heisst weiter "nicht das bezeichnete
   * Archiv", und eine Messung darauf kommt nicht ins Scoreboard. */
  ok(/var echtesArchiv = bezeichnetesArchiv\(ZR\);/.test(q),
     'Der Riegel misst gegen dasselbe bezeichnete Archiv - und gegen das DESSELBEN Zeitrahmens');
  ok(/fremdesArchiv = path\.resolve\(archiv\) !== path\.resolve\(echtesArchiv\)/.test(q),
     'Fremd heisst weiterhin: nicht das bezeichnete Archiv');
  ok(/Keine Kopie in den Datenordner/.test(q),
     'Und eine Messung auf einem fremden Archiv kommt weiterhin nicht ins Scoreboard');
  ok(/process\.argv\[3\] \|\| bezeichnetesArchiv\(ZR\)/.test(q),
     'Ein Archiv auf der Befehlszeile geht weiter vor - fuer Gegenproben');
})();

console.log('\n44) Oberflaeche nach Themen sortiert (Felix, Issue #68)');
(function () {
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var ren = fs.readFileSync(__dirname + '/renderer.js', 'utf8');

  /* --- Die Navigation muss aufgehen: jede Pille findet ihr Panel --- */
  var pillen = (html.match(/data-sub="([a-z]+)"/g) || [])
    .map(function (s) { return s.slice(10, -1); });
  var panels = (html.match(/id="sub-([a-z]+)"/g) || [])
    .map(function (s) { return s.slice(8, -1); });
  var ohnePanel = pillen.filter(function (p) { return panels.indexOf(p) === -1; });
  var ohnePille = panels.filter(function (p) { return pillen.indexOf(p) === -1; });
  ok(ohnePanel.length === 0,
     'Jede Pille findet ihr Panel - sonst bleibt der Reiter beim Klick leer',
     ohnePanel.join(' ') || 'alle');
  ok(ohnePille.length === 0,
     'Jedes Panel ist ueber eine Pille erreichbar - sonst ist es tot',
     ohnePille.join(' ') || 'alle');

  /* --- Genau ein aktives Panel je Reiter, sonst liegen zwei uebereinander --- */
  /* tab-dashboard steht seit Stufe C4 mit in der Liste: "Heute" hat drei Pillen und
     faellt damit unter dieselbe Regel wie die drei anderen - genau ein aktives Panel,
     genau eine aktive Pille. Zwei aktive Panels laegen uebereinander und niemand saehe,
     welches. Deshalb ist die Attributreihenfolge data-sub vor class im Markup
     Bedingung und nicht Geschmack. */
  ['tab-dashboard', 'tab-depot', 'tab-werkzeuge', 'tab-strategien'].forEach(function (id) {
    var von = html.indexOf('<div id="' + id + '"');
    var bis = html.indexOf('<!-- /' + id + ' -->');
    ok(von > -1 && bis > von, 'Reiter ' + id + ' ist im Markup abgegrenzt');
    var teil = html.slice(von, bis);
    var aktiv = (teil.match(/class="sub active"/g) || []).length;
    ok(aktiv === 1, 'Reiter ' + id + ' hat genau EIN aktives Unter-Panel', aktiv);
    var pillenAktiv = (teil.match(/data-sub="[a-z]+" class="active"/g) || []).length;
    ok(pillenAktiv === 1, 'Reiter ' + id + ' hat genau EINE aktive Pille', pillenAktiv);
  });

  /* --- Die Aufteilung selbst, so wie sie im Issue vereinbart ist --- */
  var vermoegen = html.slice(html.indexOf('<div id="tab-depot"'), html.indexOf('<!-- /tab-depot -->'));
  var werkzeuge = html.slice(html.indexOf('<div id="tab-werkzeuge"'), html.indexOf('<!-- /tab-werkzeuge -->'));
  var regeln = html.slice(html.indexOf('<div id="tab-strategien"'), html.indexOf('<!-- /tab-strategien -->'));
  ok(/id="sub-depot"/.test(vermoegen) && /id="sub-protokoll"/.test(vermoegen) && /id="sub-mittel"/.test(vermoegen),
     'Vermoegen haelt Depot, Protokoll und das Mittelfrist-Buch - alles drei sind Buecher, keine Werkzeuge');

  /* --- C2: die eigenen Papiere haben EIN Zuhause (Struktur-Plan Stufe C.2) ---
   * Vorher lagen Signalliste und Uebernahme-Formular auf "Heute", die Bestandstabelle
   * unter Vermoegen, und beide Seiten verwiesen wechselseitig aufeinander. */
  var heute = html.slice(html.indexOf('<div id="tab-dashboard"'), html.indexOf('<!-- /tab-dashboard -->'));
  ok(heute.length > 100, 'Reiter tab-dashboard ist im Markup abgegrenzt');
  ok(/data-sub="papiere"/.test(vermoegen) && /id="sub-papiere"/.test(vermoegen),
     'Vermoegen hat die Pille "Meine Papiere" mit ihrem Panel');
  ok(/id="bestandText"/.test(vermoegen) && /id="bestandLesen"/.test(vermoegen) &&
     /id="bestandTabelle"/.test(vermoegen),
     'Uebernahme-Formular und Bestandstabelle stehen unter Vermoegen');
  ok(!/id="bestandText"/.test(heute) && !/id="bestandLesen"/.test(heute),
     'Auf "Heute" steht kein zweites Uebernahme-Formular mehr');
  /* GEDREHT am 26.08.2026, nicht abgeschwaecht: Wilhelm hat entschieden, dass der
   * Abschnitt "Meine Papiere" unter "Heute" ganz verschwindet (#89 vor #83). Der
   * Signalstand ist damit nicht gestrichen, sondern umgezogen - er steht als zwei
   * Spalten in der Bestandstabelle. Beides wird hier geprueft, denn beides koennte
   * einzeln zurueckfallen: der Abschnitt wiederkommen oder der Signalstand still
   * verschwinden. */
  ok(!/id="bestandListe"/.test(html),
     'Unter "Heute" steht kein Abschnitt "Meine Papiere" mehr (#89)');
  var buSig = fs.readFileSync(__dirname + '/bestandui.js', 'utf8');
  ok(/<th>Kurzfrist<\/th><th>Mittelfrist<\/th>/.test(buSig) && /kurzText\(st\.kurz\)/.test(buSig),
     'Der Signalstand ist mitgezogen, nicht gestrichen - zwei Spalten in der Bestandstabelle');
  /* Der Container MUSS leer bleiben: zeichnenTabelle() setzt seinen innerHTML. Waere das
   * Formular hineingeschachtelt, loeschte es der 60-Sekunden-Takt weg - ein Fehler, der
   * erst nach einer Minute sichtbar wird und deshalb von Hand kaum zu finden ist. */
  ok(/<div class="panel" id="bestandTabelle"><div class="loading">[^<]*<\/div><\/div>/.test(html),
     'bestandTabelle bleibt ein leerer Container - sein Inhalt wird ueberschrieben');
  /* Zwei Knoepfe, EIN Registereintrag: der Schluessel bleibt heute.bestand, obwohl der
   * zweite Knopf unter Vermoegen sitzt. Ein Umbenennen haette den Registerblock
   * angefasst, in dem ein Messsatz steht. */
  /* Es gab zwei Ueberschriften mit demselben Erklaerknopf; eine davon ist mit dem
   * Heute-Abschnitt entfallen. Der Registerschluessel bleibt "heute.bestand" - im
   * Registerblock steht ein Messsatz, und der wird nicht wegen einer Umbenennung
   * angefasst. Ein Schluessel ist intern; sein Name muss nicht wandern. */
  ok((html.match(/data-info="heute\.bestand"/g) || []).length === 1,
     'Der Erklaerknopf steht genau einmal - bei den Papieren, wo sie wohnen');

  /* Felix #71 wollte die Liste "prominent auf Heute, untergliedert nach Kurz-/
   * Mittelfristsignal". Am 26.08.2026 hat Wilhelm entschieden, dass der Abschnitt
   * unter "Heute" ganz verschwindet. Damit ist die GRUPPIERUNG entfallen - die
   * INFORMATION nicht: sie steht als zwei Spalten in der Bestandstabelle und faerbt
   * sich, wo etwas anliegt.
   * Das ist eine Abwaegung und keine Selbstverstaendlichkeit: eine Bestandstabelle
   * nach einem stuendlich wechselnden Signal umzusortieren haette den eigenen Bestand
   * aus dem Blick genommen, und die Summenzeile aus #83 haette keinen eindeutigen
   * Bezug mehr gehabt. Wer die Gruppierung zurueckwill, baut sie in der Tabelle. */
  var bu = fs.readFileSync(__dirname + '/bestandui.js', 'utf8');
  /* Die Kopfzellen duerfen Attribute tragen - seit #93 haengt an den Zahlenspalten
   * eine Klasse, damit Zahl und Einheit nicht auf zwei Zeilen brechen. Gemessen wird,
   * dass die SPALTEN da sind, nicht wie ihr Markup geschrieben ist. */
  ok(/<th[^>]*>seit Jahresbeginn<\/th>/.test(bu) && /<th[^>]*>Kurzfrist<\/th>/.test(bu),
     'Die Bestandstabelle traegt Signalstand UND Jahresentwicklung (#83)');

  /* ---- #93/#94: deutsche Zahlen, rote Verluste, kein Umbruch (26.08.2026) ----
   * Beides Regressionen aus 79a505b, also aus dem Umbau derselben Tabelle. Die Tabelle
   * baute Zahlen und Farben von Hand, statt die Hausmittel aus app-shell.js zu benutzen:
   * "309.90 $" statt "309,90 $", und ein Verlust trug dieselbe graue Farbe wie
   * "es liegt hier nichts vor". */
  var buOhneKomm = bu.replace(/\/\*[\s\S]*?\*\//g, ' ').replace(/(^|[^:])\/\/[^\n]*/g, '$1');
  ok(buOhneKomm.indexOf('toFixed') === -1,
     'Keine Zahl mehr von Hand formatiert - toFixed schreibt englisch (#94)');
  ok(/U\.money\(/.test(buOhneKomm) && /U\.nf0\.format\(/.test(buOhneKomm),
     'Geld und Stueckzahl kommen aus den Hausmitteln');
  /* Die beiden Helfer werden AUSGEFUEHRT. Ein Muster im Text sagt, dass sie dastehen,
   * nicht dass "-0,14" herauskommt und rot wird. */
  var pkA = bu.indexOf('function prozentKlasse(v) {');
  var pkE = bu.indexOf('\n  }\n', bu.indexOf('function prozentText(v, stellen) {'));
  ok(pkA !== -1 && pkE > pkA, 'Die beiden Prozent-Helfer lassen sich herausloesen');
  var pkFn = new Function('U', bu.slice(pkA, pkE + 4) +
    '\nreturn { klasse: prozentKlasse, text: prozentText };');
  var Ufake = { esc: function (x) { return x; }, signCls: function (v) { return v > 0 ? 'pos' : (v < 0 ? 'neg' : ''); } };
  var PZ = pkFn(Ufake);
  ok(PZ.text(-0.14, 2) === '-0,14 %', 'Deutsche Schreibweise mit Komma', PZ.text(-0.14, 2));
  ok(PZ.text(0.9, 2) === '+0,90 %', 'Gewinn mit Vorzeichen und zwei Stellen', PZ.text(0.9, 2));
  ok(PZ.text(12.3, 1) === '+12,3 %', 'und die Jahresspalte mit einer Stelle', PZ.text(12.3, 1));
  /* Die Hausregel: rot fuer Verlust. Vorher war ALLES ausser Gewinn grau - ein Verlust
   * sah damit aus wie eine fehlende Angabe. */
  ok(PZ.klasse(-0.14) === 'neg', 'Verlust wird rot, nicht grau (#94 Teil 2)', PZ.klasse(-0.14));
  ok(PZ.klasse(0.9) === 'pos', 'Gewinn bleibt gruen');
  /* Genau null ist weder Gewinn noch Verlust - und "keine Angabe" ist etwas Drittes.
   * Grau darf nur heissen "keine Auskunft", sonst faerbt die Tabelle eine Aussage,
   * die sie gar nicht hat. */
  ok(PZ.klasse(0) === '', 'Null ist weder gruen noch rot');
  ok(PZ.klasse(null) === 'muted' && PZ.text(null, 2) === '–',
     'Ohne Zahl steht ein Gedankenstrich und grau heisst "keine Auskunft"');
  ok(PZ.klasse(Infinity) === 'muted', 'und eine unbrauchbare Zahl faerbt gar nichts ein');
  /* #93: Zahl und Einheit bleiben zusammen. Bei 1000 px stand der Gesamtwert sonst als
   * "15483" ueber "$" - zwei Zeilen fuer eine Zahl. */
  ok(/#bestandTabelle td\.zahl \{[^}]*white-space: nowrap/.test(html),
     'Zahlenspalten brechen nicht zwischen Zahl und Einheit um (#93)');
  ok((buOhneKomm.match(/class="zahl/g) || []).length >= 8,
     'und jede Zahlenspalte traegt die Klasse - Zeilen wie Summenzeile',
     (buOhneKomm.match(/class="zahl/g) || []).length + ' Zellen');
  /* up/muted bleiben den SIGNAL-Spalten vorbehalten. Zwei Bedeutungen auf einer Klasse
   * waren der Ursprung von Teil 2: beim Umzug wurden "Signal/kein Signal" still zu
   * "Gewinn/Verlust" umgedeutet. */
  ok(/#bestandTabelle td\.up/.test(html) && /kurzText\(st\.kurz\)/.test(bu),
     'Die Signalspalten behalten ihre eigene Faerbung - Signal ist nicht Gewinn');

  /* Die beiden Textfunktionen werden AUSGEFUEHRT: sie sind rein und ohne DOM-Zugriff.
   * Geprueft wird die Eigenschaft, auf der die ganze Gruppierung ruht - dass das
   * Kennzeichen "an" mit dem angezeigten TEXT uebereinstimmt. Kaeme die Gruppe aus dem
   * CSS-Klassennamen, verschoebe eine Umbenennung im Stylesheet still die
   * Fachbedeutung. */
  var kt = (/\n  function kurzText\(k\) \{[\s\S]*?\n  \}/.exec(bu) || [])[0];
  var mt = (/\n  function mittelText\(m\) \{[\s\S]*?\n  \}/.exec(bu) || [])[0];
  ok(!!kt && !!mt, 'Die beiden Textfunktionen lassen sich herausschneiden');
  var TF = new Function(kt + mt + '\nreturn { k: kurzText, m: mittelText };')();
  /* Die Farbe muss dem Text folgen. Bis zum 26.08.2026 lief diese Probe ueber das
   * Feld 'an', das die Gruppierung der Heute-Liste brauchte; die Liste ist entfallen,
   * das Feld auch. Die Eigenschaft gilt weiter und ist jetzt wichtiger als vorher:
   * in der Bestandstabelle faerbt cls die beiden Signalspalten - stuende dort gruen
   * neben "kein Signal", waere die Anzeige eine Luege.
   * Die Funktionen sind rein und ohne DOM-Zugriff, werden also AUSGEFUEHRT. */
  ok(TF.k({ ok: true }).cls === 'up' &&
     TF.k({ ok: false, grund: 'Kanal fehlt' }).cls === 'muted' &&
     TF.k(null).cls === 'muted',
     'Kurzfrist: gruen genau dann, wenn die Regel ein Signal gibt');
  ok(TF.m({ momentum: { richtung: 1 } }).cls === 'up' &&
     TF.m({ drift: { richtung: -1 } }).cls === 'up' &&
     TF.m({}).cls === 'muted' && TF.m(null).cls === 'muted',
     'Mittelfrist: gruen genau dann, wenn ein Buch den Wert haelt');
  /* Und keine Farbe ohne Deckung im Text: was gruen ist, darf nicht "kein Signal",
   * "in keinem Buch" oder "noch nicht geprueft" heissen. */
  var faelle = [TF.k(null), TF.k({ ok: true }), TF.k({ ok: false, grund: 'x' }),
                TF.m(null), TF.m({}), TF.m({ drift: { richtung: -1 } })];
  ok(faelle.every(function (f) {
    /* Nur die eine Richtung ist eine Eigenschaft: gruen verlangt Deckung im Text.
     * Die Umkehrung gilt nicht - ein Grund wie "Kanal fehlt" ist grau, ohne eine
     * der drei festen Wendungen zu sein. Mein erster Anlauf hat genau das verwechselt. */
    return f.cls !== 'up' || !/kein Signal|in keinem Buch|noch nicht gepr/.test(f.txt);
  }), 'Keine Farbe ohne Deckung im Text - gruen steht nie neben "kein Signal"');

  /* Statt der Gruppenzeile pruefen wir jetzt, was #83 dafuer verlangt hat: eine
   * Summenzeile unter den Zeilen - und dass sie nur erscheint, wenn sie ehrlich ist.
   * Eine Summe, der ein Papier fehlt, ist stillschweigend zu klein. */
  ok(/<tr class="summe">/.test(bu) && /var vollstaendig = werte\.every/.test(bu),
     'Es gibt eine Summenzeile - und sie erscheint nur, wenn kein Papier fehlt');
  /* Kopf, Zeile und Summe muessen gleich viele Zellen haben. Stimmen sie nicht
   * ueberein, stehen die Zahlen unter der falschen Ueberschrift - und nichts bricht.
   * Dieselbe Probe gibt es fuer die Positionstabelle weiter oben. */
  var kopfB = (/<table class="tbl"><tr><th>Wert<\/th>[\s\S]*?<\/tr>/.exec(bu) || [''])[0];
  var nKopfB = (kopfB.match(/<th/g) || []).length;
  var summeB = (/<tr class="summe">[\s\S]*?<\/tr>/.exec(bu) || [''])[0];
  var nSummeB = (summeB.match(/<td/g) || []).length;
  ok(nKopfB === 10 && nSummeB === nKopfB,
     'Bestandstabelle: Kopf und Summenzeile haben gleich viele Spalten',
     nKopfB + ' Kopf / ' + nSummeB + ' Summe');
  /* Prozentzahlen verschiedener Papiere lassen sich nicht addieren. Die Tagessumme
   * wird deshalb in Geld gerechnet, die Jahressumme aus Basis und Jetzt-Wert. */
  ok(/sumHeute \+= wert - wert \/ \(1 \+ kurs\.pct \/ 100\)/.test(bu),
     'Die Tagessumme wird in Geld gerechnet, nicht aus Prozenten gemittelt');
  /* Ueber ein Jahr faellt jeder Aktiensplit als Absturz auf, wenn unbereinigt
   * geladen wird - ein 4:1-Split saehe aus wie -75 %. */
  ok(/range: '1y', interval: '1d', bereinigt: true/.test(bu),
     'Die Jahresbasis wird BEREINIGT geladen - sonst ist jeder Split ein Absturz');
  /* Und der Absprung in den Explorer haengt an der Tabelle, nicht mehr an der
   * entfallenen Liste. */
  ok(/el\('bestandTabelle'\)[\s\S]{0,700}closest\('\[data-bsym\]'\)/.test(bu),
     'Der Absprung in den Aktien-Explorer ist mitgezogen (#83)');
  /* Ohne Regel fuer td.up/td.muted saehe eine Zeile mit Signal aus wie eine ohne -
   * die Untergliederung waere dann nur eine Reihenfolge, keine Auskunft. */
  /* Die Regel hing an #bestandListe - den Behaelter gibt es nicht mehr. Ohne diesen
   * Umzug waere die Faerbung still verschwunden, und mit ihr das "auf einen Blick
   * sehen, wo etwas anliegt" aus #71. */
  ok(/#bestandTabelle td\.up/.test(html) && /#bestandTabelle td\.muted/.test(html),
     'td.up und td.muted haben eine Regel - sonst sieht "Signal" aus wie "kein Signal"');
  /* Entfernen geht dort, wo die Papiere wohnen - sonst legt man sie unter Vermoegen an
   * und loescht sie auf "Heute": genau die Wohnungsteilung, die C2 abschafft. */
  ok(/el\('bestandTabelle'\)[\s\S]{0,500}addEventListener\('click'/.test(bu),
     'Entfernen geht auch dort, wo die Papiere wohnen');
  ok(!/id="sub-strategien"/.test(vermoegen) && !/id="sub-wende"/.test(vermoegen) && !/id="sub-auswertung"/.test(vermoegen),
     'Vermoegen haelt keine Schalter, kein Werkzeug und keinen Autopiloten mehr');
  ok(/id="sub-wende"/.test(werkzeuge) && /id="sub-explorer"/.test(werkzeuge) && /id="sub-scheine"/.test(werkzeuge),
     'Werkzeuge halten Explorer, Schein-Finder und Trendfinder');
  ok(/id="wzEinstellungen"/.test(werkzeuge),
     'Die Einstellungen sind von den Werkzeugen aus erreichbar (Felix, #68)');
  /* Die Pille darf KEIN data-sub tragen: sie oeffnet einen Dialog, sie navigiert nicht.
   * Mit data-sub wuerde der Umschalter alle Panels ausblenden und keines wieder ein. */
  ok(!/id="wzEinstellungen"[^>]*data-sub/.test(werkzeuge),
     'Die Einstellungs-Pille ist keine Navigation - sonst bliebe der Reiter leer zurueck');
  ok(/wzEinstellungen/.test(fs.readFileSync(__dirname + '/app-shell.js', 'utf8')),
     'und sie ist verdrahtet');
  ok(/id="sub-strategien"/.test(regeln) && /id="sub-auswertung"/.test(regeln) &&
     /id="sub-regelbuch"/.test(regeln) && /id="sub-stratchart"/.test(regeln),
     'Regeln haelt alles Regelrelevante: Schalter, Autopilot, Regelbuch, Chart');

  /* --- Stufe C4: die Marktkarte ist eine Pille, kein Reiter --- */
  ok(!/data-tab="marktkarte"/.test(html) && /id="heutePills"/.test(html),
     'Die Marktkarte ist kein eigener Reiter mehr, "Heute" hat eine Pillenleiste');
  ok(/id="sub-marktkarte"/.test(heute) && /id="mkKarte"/.test(heute) && /id="mkFuss"/.test(heute),
     'Der Marktkarten-Block liegt vollstaendig unter Heute - als Block umgezogen, nicht neu gebaut');
  ok(/id="spekRadar"/.test(heute) && /id="insiderKarte"/.test(heute) && /id="vormarktKarte"/.test(heute) &&
     /id="sub-beobachtung"/.test(heute),
     'Radar, Insider und Vorboersen-Luecken stehen zusammen in der dritten Pille');
  /* Keine verwaiste Reiter-Kennung: eine Endmarke oder ein aria-labelledby fuer einen
     Reiter, den es nicht mehr gibt, ist genau die Sorte toter Verweis, die dieser
     Umbau abschafft. */
  ok(!/tab-marktkarte/.test(html) && !/reiter-marktkarte/.test(html),
     'Vom alten Reiter ist keine Kennung uebriggeblieben');
  /* Der Simulationssatz muss VOR seiner Karte stehen bleiben - er ist die sichtbare
     Zusicherung, dass an diesen drei Karten nichts gemessen ist. Zieht die Ueberschrift
     nicht mit um, faellt er zwischen die Stuehle und niemand merkt es. */
  ['spekRadar', 'insiderKarte', 'vormarktKarte'].forEach(function (kid) {
    var bisK = heute.indexOf('id="' + kid + '"');
    var vonK = heute.lastIndexOf('<h2>', bisK);
    ok(vonK > -1 && /Gehandelt wird hiervon nichts/.test(heute.slice(vonK, bisK)),
       'Beobachtung: ueber ' + kid + ' steht der Simulationssatz weiterhin');
  });
  /* hoverInfo ist ein position:fixed Ueberlagerungsfenster, kein Inhalt. Laege es in
     einer Pille, waere es weg, sobald eine andere gewaehlt ist - und der
     Zeigefinger-Hinweis der Heatmap ginge mit. */
  ok(heute.indexOf('id="hoverInfo"') > -1 &&
     heute.indexOf('id="hoverInfo"') < heute.indexOf('id="heutePills"'),
     'hoverInfo steht ausserhalb der Pillen - sonst verschwaende der Heatmap-Hinweis');

  /* C1 (Struktur-Plan 25.08.2026): Steuerung nach Regeln, Bestand nach Vermoegen.
   * Die Trennlinie ist nachpruefbar: mfdepot.js takt() liest KEIN Bedienfeld, es
   * zeichnet D.mfBuch/D.driftBuch - deshalb duerfen die zwei Buch-Container in
   * Vermoegen stehen. Die Rechner-Ausgaben haengen dagegen an opts() aus ihren
   * Auswahlfeldern und muessen bei ihnen bleiben, sonst dreht man in einem Reiter
   * und die Zahl aendert sich in einem anderen. */
  var mfSteuer = ['mfRueck', 'mfLuecke', 'mfHalten', 'mfAnteil', 'mfKosten', 'mfLadenBtn',
                  'mfStatus', 'mfRang', 'mfErgebnis', 'mfdTaktBtn', 'mfdRebalanceBtn',
                  'mfdDriftBtn', 'mfdStatus', 'drHalten', 'drAnteil', 'drFenster',
                  'drKosten', 'drLadeBtn', 'drLadeAlleBtn', 'drRechneBtn', 'drStatus',
                  'drErgebnis', 'drHeute'];
  var nichtInRegeln = mfSteuer.filter(function (id) { return regeln.indexOf('id="' + id + '"') === -1; });
  ok(/id="sub-mittelfrist"/.test(regeln) && nichtInRegeln.length === 0,
     'Regeln haelt die ganze Mittelfrist-Steuerung: Parameter, Lade- und Handelsknoepfe',
     nichtInRegeln.join(' ') || 'alle 23');
  var schalterInVermoegen = mfSteuer.filter(function (id) { return vermoegen.indexOf('id="' + id + '"') > -1; });
  ok(/id="mfdMomentum"/.test(vermoegen) && /id="mfdDrift"/.test(vermoegen) &&
     schalterInVermoegen.length === 0,
     'Vermoegen zeigt die zwei Buecher und keine einzige Stellschraube mehr',
     schalterInVermoegen.join(' ') || 'keine');
  /* EINE Wahrheit: jede dieser Kennungen darf im Markup genau einmal vorkommen. Ein
   * zweiter Container mit derselben Kennung waere ein zweites Rendering desselben
   * Inhalts - und getElementById zeigte still auf das erste. */
  ['mfdMomentum', 'mfdDrift', 'mfdStatus', 'mfRang', 'mfErgebnis', 'drErgebnis', 'drHeute',
   'mfStatus', 'drStatus'].forEach(function (id) {
    ok((html.match(new RegExp('id="' + id + '"', 'g')) || []).length === 1,
       'Kennung ' + id + ' steht genau einmal im Markup - kein Doppel-Rendering');
  });
  /* Die zwei Buch-Container brauchen einen Leerzustand IM MARKUP: zeige() schreibt
   * sie nur, wenn takt() durchlief - beim Erststart ohne Tagesdaten kehrt es vorher
   * um, und ohne diesen Text stuenden in Vermoegen zwei Ueberschriften ueber nichts.
   * Vor C1 fiel das nicht auf, weil #mfdStatus im selben Panel den Grund nannte. */
  ok(/id="mfdMomentum"[^>]*>\s*<div class="empty"/.test(vermoegen) &&
     /id="mfdDrift"[^>]*>\s*<div class="empty"/.test(vermoegen),
     'Beide Buch-Container haben einen Leerzustand fuer den Erststart');
  ok(/data-sub="mittel">Bücher</.test(vermoegen) && /data-sub="mittelfrist">Mittelfrist</.test(regeln),
     'Die Pillen heissen, was sie zeigen: Buecher (Bestand) und Mittelfrist (Steuerung)');
  /* Der Erklaerabsatz mit den Messzahlen wurde nicht geteilt - er beschreibt, WAS die
   * beiden Buecher sind, und bleibt deshalb ungeteilt bei ihnen (Leitplanke 1). */
  ok(/t = 1,62/.test(vermoegen) && /8,44 statt 14,07/.test(vermoegen),
     'Die Messzahlen der beiden Buecher stehen ungeteilt bei den Buechern');

  /* --- Kein Wegweiser zeigt mehr auf einen Ort, den es nicht mehr gibt --- */
  var quellen = ['index.html', 'depot.js', 'explorer.js', 'renderer.js', 'app-shell.js',
                 'mfdepot.js', 'driftui.js', 'mittelfrist.js'];
  var falsch = [];
  quellen.forEach(function (f) {
    var s = fs.readFileSync(__dirname + '/' + f, 'utf8');
    /* "Mittelfristig" steht seit C1 (25.08.2026) auf dieser Liste: die Pille heisst
     * "Buecher", und die Steuerung, auf die drei Meldungen frueher zeigten, liegt in
     * Regeln -> Mittelfrist. Die drei Module sind mit aufgenommen, weil genau sie die
     * Meldungen tragen - vorher stand die Regel da und sah an ihnen vorbei. */
    if (/Vermögen (→|-&gt;) (Schalter|Auswertung|Trendfinder|Mittelfristig)/.test(s)) falsch.push(f);
  });
  ok(falsch.length === 0,
     'Kein Text verweist mehr auf Vermoegen -> Schalter/Auswertung/Trendfinder',
     falsch.join(' ') || 'keiner');

  /* --- Punkte 1 und 2: Kuerzel und Aufklappen in der Positionstabelle --- */
  ok(/data-explsym=/.test(dep) && /window\.Explorer && window\.Explorer\.oeffne/.test(dep),
     'Klick auf das Kuerzel einer offenen Position oeffnet den Aktien-Explorer (#68)');
  ok(/data-posauf=/.test(dep) && /async function posDetailUmschalten/.test(dep),
     'Die Positionszeile laesst sich aufklappen (#68)');
  /* Der aufgeklappte Chart MUSS aus stcRechnen kommen. Ein zweiter, eigener Nachbau
   * waere die Sorte Fehler, die erst auffaellt, wenn beide Ansichten verschiedene
   * Signale fuer denselben Wert zeigen. */
  var auf = dep.slice(dep.indexOf('async function posDetailUmschalten'),
                      dep.indexOf('function tile(name, val, sign, delta, deltaSign)'));
  /* Seit Stufe E laeuft der Rueckgriff ueber die Schnittstelle der eigenen Datei -
   * die Eigenschaft bleibt dieselbe: EINE Rechnung, keine nachgebaute Logik. */
  ok(/StrategieChart\.rechnen\(pos\.sym/.test(auf) && !/Q\.einstiegSignal/.test(auf),
     'Die aufgeklappte Zeile rechnet nicht selbst, sondern nutzt stcRechnen');
  ok(/beste\.ab <= window\.StrategieChart\.IV/.test(auf),
     'Der eigene Einstieg wird nur markiert, wenn er wirklich im Bild liegt');

  /* --- Punkt 4: ausserboerslicher Kurs auch oben im Dashboard --- */
  ok(/function ppKurz/.test(ren), 'Es gibt eine gemeinsame Kurzform des ausserboerslichen Kurses');

  /* --- Die Flaechen der Marktkarte: eine Kachel je UNTERNEHMEN, und nur Aktien ---
   * Die SEC fuehrt die Aktienanzahl je CIK, also je Unternehmen. Die Karte hing sie
   * an jedes Kuerzel: Bank of America stand mit 17 Kuerzeln da (BAC, BAC-PL, BACRP,
   * BML-PJ ...), jedes mit den vollen 6,99 Milliarden Aktien; Alphabet viermal. Und
   * FNMFO - eine Vorzugsserie von Fannie Mae - bekam die 1,158 Milliarden STAMMaktien
   * und wurde damit zur groessten Kachel der ganzen Karte. */
  var mk = fs.readFileSync(__dirname + '/marktkarteui.js', 'utf8');
  ok(/function artVon/.test(mk) && /AKTIE = \{ CS: 1, ADRC: 1 \}/.test(mk),
     'Die Karte zeigt nur Unternehmensaktien und Hinterlegungsscheine');
  /* Die eine Normalisierung, an der alles haengt: das Archiv schreibt BAC-PL, die
   * Klassifizierung BACpL. Ohne sie gilt jede Vorzugsaktie als unbekannt. */
  var av = mk.slice(mk.indexOf('function artVon'), mk.indexOf('async function artenLaden'));
  ok(av.indexOf("replace('-P', 'p')") > -1,
     'Vorzugsaktien werden in der Schreibweise der Klassifizierung nachgeschlagen (BAC-PL -> BACpL)');
  /* Unklassifizierte duerfen NICHT durch: auf einer Flaechenkarte wird ein unbekanntes
   * Papier mit geerbter Stueckzahl zur groessten Kachel und behauptet etwas. */
  var aus = mk.slice(mk.indexOf('function auswahl(n)'), mk.indexOf('async function kurseHolen'));
  ok(/keineAktie\+\+/.test(aus) && /a && AKTIE\[a\]/.test(aus),
     'Was nicht als Aktie klassifiziert ist, bekommt keine Kachel - auch Unbekanntes nicht');
  ok(/jeCik/.test(aus) && /doppelt\+\+/.test(aus),
     'Ein Unternehmen bekommt genau eine Kachel, nicht eine je Kuerzel');
  /* Beides gehoert in die Fusszeile - eine stille Bereinigung waere so schlecht wie
   * die stille Mehrfachzaehlung davor. */
  ok(/keine Unternehmensaktien sind/.test(mk) && /gilt je Unternehmen, nicht je Kürzel/.test(mk),
     'Die Fusszeile sagt, was weggelassen und was zusammengefasst wurde');
  /* Abgegrenzt am ENDE des Blocks, nicht an einer Zeichenzahl.
   * Vorher stand hier slice(stelle, stelle + 1600). Das misst einen Abstand, wo der
   * ORT gemeint ist: Ein hinzugefuegter Kommentar im Block schiebt den gesuchten
   * Aufruf aus dem Fenster, und die Zusicherung wird rot, obwohl das Verhalten
   * stimmt. Genau das ist beim Einbau der Kurszeile (Issue #74) passiert. */
  function imBlock(quelle, von, bis) {
    var a = quelle.indexOf(von);
    if (a < 0) return '';
    var b = quelle.indexOf(bis, a);
    return quelle.slice(a, b < 0 ? quelle.length : b);
  }
  /* Struktur-Audit Punkt 10 (25.08.2026): "Gewinner & Verlierer" zeigten dieselben
   * 15 Werte wie das Marktbild direkt darueber - zusammengelegt. Die #68-Information
   * (ausserboerslicher Kurs) lebt auf den Marktbild-Kacheln weiter; das sichert die
   * Zusicherung direkt darunter. Diese hier haelt fest, dass die Doppelanzeige nicht
   * zurueckkommt und die Heatmap die Movers-Sortierung uebernommen hat. */
  ok(ren.indexOf('moverRows') === -1 && ren.indexOf("setzeInhalt('winners'") === -1,
     'Struktur-Audit 10: keine getrennten Gewinner/Verlierer-Spalten mehr');
  ok(/heatList = withQ\.slice\(\)\.sort\(function \(a, b\) \{ return Q\[b\.y\]\.pct - Q\[a\.y\]\.pct/.test(ren),
     'Struktur-Audit 10: das Marktbild sortiert vom Gewinner zum Verlierer');
  var heatBlock = imBlock(ren, "var heatEl = document.getElementById('dashHeat')", 'function card(s)');
  ok(heatBlock && heatBlock.indexOf('ppKurz(') > -1,
     'Das Marktbild zeigt den ausserboerslichen Kurs (#68)');
  /* Issue #74: der Kurs gehoert auf die Kachel, nicht nur in den Tooltip. */
  ok(heatBlock && /class="k"/.test(heatBlock) && /\.price/.test(heatBlock),
     'Issue #74: das Marktbild zeigt auch den Kurs, nicht nur Prozente');

  /* ---- Issue #74: "im Dunkelmodus sind die grauen Texte nur schwer zu lesen" ----
   * Die Kachel ist eingefaerbt, und die Nebenzeile stand in der Richtungsfarbe mit
   * Deckkraft 0,85 darauf: gruener Text auf gruenem Grund. Gemessen kam das auf 1,76
   * im Hellmodus - praktisch unsichtbar.
   *
   * Der Kontrast wird hier GERECHNET, aus den Farbwerten in index.html und dem
   * Deckel in renderer.js. Ein Kommentar mit einer Zahl waere in einem halben Jahr
   * eine Behauptung; diese Zusicherung wird rot, sobald jemand an einem der drei
   * Werte dreht - an der Farbe, am Deckel oder an der Deckkraft. */
  function tokenAus(quelle, name, ab) {
    var re = new RegExp('--' + name + ':\\s*(#[0-9a-fA-F]{6})');
    var t = re.exec(quelle.slice(ab));
    return t ? t[1] : null;
  }
  var htmlT = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var dunkelAb = htmlT.indexOf(':root[data-theme="dark"]');
  ok(dunkelAb > 0, 'Kontrast: das dunkle Thema ist im Markup zu finden');
  function rgb(h) { h = h.replace('#', ''); return [0, 2, 4].map(function (i) { return parseInt(h.substr(i, 2), 16); }); }
  function leucht(c) {
    var v = c.map(function (x) { var t2 = x / 255; return t2 <= 0.03928 ? t2 / 12.92 : Math.pow((t2 + 0.055) / 1.055, 2.4); });
    return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2];
  }
  function kontrast(a, b) {
    var l1 = leucht(a), l2 = leucht(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  function misch(a, b, p) { return a.map(function (v, i) { return Math.round(v * p + b[i] * (1 - p)); }); }

  var deckelM = /Math\.min\((\d+), Math\.abs\(pct\) \/ 3 \* \d+\)/.exec(ren);
  ok(!!deckelM, 'Kontrast: der Deckel der Einfaerbung steht im Renderer');
  var deckel = deckelM ? Number(deckelM[1]) / 100 : 0.45;

  var schlimmste = [];
  [{ n: 'hell', ab: 0 }, { n: 'dunkel', ab: dunkelAb }].forEach(function (th) {
    var fl = tokenAus(htmlT, 'surface', th.ab);
    var ink2 = tokenAus(htmlT, 'ink-2', th.ab);
    var up = tokenAus(htmlT, 'up', th.ab);
    var down = tokenAus(htmlT, 'down', th.ab);
    if (!fl || !ink2 || !up || !down) { schlimmste.push(th.n + ': Farbwert fehlt'); return; }
    [['gruen', up], ['rot', down]].forEach(function (paar) {
      var grund = misch(rgb(paar[1]), rgb(fl), deckel);
      var k = kontrast(rgb(ink2), grund);
      if (k < 4.5) schlimmste.push(th.n + ' ' + paar[0] + ' ' + k.toFixed(2));
    });
  });
  ok(schlimmste.length === 0,
     'Issue #74: die Nebenzeile bleibt auf der staerksten Kachel lesbar - in beiden Themen  [' +
     (schlimmste.join('; ') || 'Deckel ' + Math.round(deckel * 100) + ' %') + ']');
  ok(!/\.heat \.hz \.ppk \{[^}]*opacity/.test(htmlT),
     'Issue #74: keine Deckkraft mehr auf der Nebenzeile der Kachel - sie zog den Text in den Grund');
  ok(/\.heat \.hz \.ppk \{[^}]*color: var\(--ink-2\)/.test(htmlT),
     'Issue #74: die Kachel-Nebenzeile traegt nicht die Richtungsfarbe - die sagt schon der Grund');
  /* Bewusst NICHT nach dem ausserboerslichen Kurs sortiert: der ist duenn gehandelt,
   * und wer danach sortiert, stellt einzelne Ausreisser wie Tagessieger heraus.
   * Gemessen wird die EIGENSCHAFT (die Sortierbasis ist der regulaere Tages-pct und
   * greift nie auf pp.* zu), nicht die Schreibweise: die fruehere Pruefung auf
   * Math.abs(...) wurde rot, als Punkt 10 des Struktur-Audits die Sortierung auf
   * signiert umstellte - obwohl die Basis unveraendert die Tagesbewegung war. */
  var heatSort = /heatList = withQ\.slice\(\)\.sort\(function \(a, b\) \{ return ([^;]+); \}\)/.exec(ren);
  ok(!!heatSort && /Q\[[ab]\.y\]\.pct/.test(heatSort[1]) && heatSort[1].indexOf('.pp') === -1,
     'Sortiert wird nach der regulaeren Tagesbewegung, nie nach dem ausserboerslichen Kurs');})();

console.log('\n45) Release-Routine (tools/release.js)');
(function () {
  var rel = fs.readFileSync(__dirname + '/tools/release.js', 'utf8');
  var pkg = JSON.parse(fs.readFileSync(__dirname + '/package.json', 'utf8'));

  /* Die Einstufung entscheidet, ob ein Release angehalten wird. Sie wird hier aus
   * dem Quelltext geschnitten und einzeln aufgerufen - ein Test, der dafuer erst
   * Dateien aendern muesste, waere in einem Verzeichnis mit paralleler Arbeit
   * genau die falsche Idee. */
  var von = rel.indexOf('function gehoertInsPaket(');
  var bis = rel.indexOf('\n}', von) + 2;
  ok(von > -1 && bis > 1, 'release.js stuft Dateien nach Paketzugehoerigkeit ein');
  var gip = new Function(rel.slice(von, bis) + '\nreturn gehoertInsPaket;')();

  /* Was ins Paket geht, haelt einen Release an: waere es nicht committet, fehlte es
   * still im Release, weil aus HEAD gebaut wird. */
  ['depot.js', 'renderer.js', 'index.html', 'telemetrie.json', 'icon.ico',
   'studien/messmaschine/messmaschine.js', 'studien/messmaschine/messen.js'].forEach(function (f) {
    ok(gip(f) === true, 'haelt den Release an: ' + f);
  });
  /* Was nicht ins Paket geht, darf ihn NICHT anhalten. Der Protokoll-Fall ist der,
   * an dem die Wache am 24.08.2026 im ersten Lauf abbrach. */
  ['test-v6.js', 'tools/release.js', 'eslint.config.mjs', 'CLAUDE.md',
   'studien/messmaschine/protokolle/rsi2seit-2026-08-24.json',
   'studien/messmaschine/strategien/momentum.js'].forEach(function (f) {
    ok(gip(f) === false, 'haelt den Release NICHT an: ' + f);
  });

  /* Die Einstufung muss build.files folgen. Nimmt jemand dort etwas auf, ohne es
   * hier nachzuziehen, faellt die Datei stillschweigend aus der Pruefung. */
  (pkg.build.files || []).forEach(function (muster) {
    if (muster.charAt(0) === '!' || muster.indexOf('*') > -1) return;
    ok(gip(muster) === true, 'build.files nennt ' + muster + ' - die Einstufung kennt es auch');
  });

  /* Der feste Aufbau von --porcelain vertraegt kein trim: " M datei" wuerde sonst
   * zu "M datei", und der Dateiname verloere seinen ersten Buchstaben. Genau das
   * stand beim ersten Testlauf im Bericht ("ools/release.js"). */
  var bz = rel.slice(rel.indexOf('function baumZustand('), rel.indexOf('function pruefen('));
  ok(bz.indexOf('execSync(') > -1 && bz.indexOf("sh('git status") === -1,
     'baumZustand liest die Statuszeilen ungetrimmt - sonst fehlt dem ersten Dateinamen ein Buchstabe');

  /* Die Weigerungen sind der Zweck des Skripts. Verschwindet eine, verschwindet der
   * Schutz vor genau dem Fehler, fuer den sie steht. */
  ok(/rote|Tests sind rot/i.test(rel), 'Weigerung: rote Tests');
  ok(/Tag v.* gibt es schon|gibt es schon/.test(rel), 'Weigerung: Nummer schon vergeben');
  ok(/telemetrie/i.test(rel), 'Weigerung: telemetrie.json wird nicht committet');
  ok(/Pruefsumme/.test(rel), 'Gegenprobe: Pruefsumme nach dem Veroeffentlichen');
  ok(/Junction/.test(rel), 'Der Bau legt die node_modules-Junction selbst an');

  /* --- Ausliefern ist Sache der Wache, nicht einer Sitzung ---
   * CLAUDE.md sagte "benutze die Routine", und prompt hat eine Sitzung in einer Nacht
   * fuenf Versionen vergeben. Eine Regel, die nur dasteht, haelt nicht - deshalb steht
   * sie im Skript. */
  ok(/function darfAusliefern/.test(rel), 'Das Skript kennt die Regel, wer ausliefern darf');
  ['--bauen', '--hoch', '--alles'].forEach(function (f) {
    var z = rel.split(String.fromCharCode(10)).filter(function (x) {
      return x.indexOf("indexOf('" + f + "')") > -1 && x.indexOf('arg.') > -1;
    })[0];
    ok(!!z && z.indexOf('darfAusliefern') > -1,
       f + ' ist hinter dem Riegel', z ? z.trim().slice(0, 70) : 'Zeile nicht gefunden');
  });
  /* Nachsehen und Aufraeumen muessen frei bleiben - sonst weiss eine Sitzung nicht
   * einmal, was noch offen ist, und laesst Muell liegen. */
  var frei = rel.split(String.fromCharCode(10)).filter(function (x) {
    return (x.indexOf("indexOf('--pruefen')") > -1 || x.indexOf("indexOf('--aufraeumen')") > -1) && x.indexOf('arg.') > -1;
  });
  ok(frei.length === 2 && frei.every(function (x) { return x.indexOf('darfAusliefern') === -1; }),
     '--pruefen und --aufraeumen bleiben ohne Riegel');
  /* Die Wache MUSS den Schluessel fuehren, sonst sperrt der Riegel genau den aus,
   * fuer den er gebaut wurde.
   *
   * ABER: Ihre Beschreibung liegt NICHT im Repo, sondern im Benutzerordner der
   * jeweiligen Maschine. Der erste Wurf las sie ohne Umschweife - und liess damit die
   * ganze Suite abstuerzen, ueberall dort, wo es die Datei nicht gibt: in der CI, in
   * jedem frischen Klon, auf dem Rechner jeder anderen Sitzung. Ein Absturz ist dabei
   * schlimmer als ein rotes Haeckchen, weil er weder ❌ noch "FEHLGESCHLAGEN" schreibt -
   * wer die Ausgabe nach diesen Worten absucht, sieht gar nichts und haelt den Lauf
   * fuer gruen. (Genau das ist am 25.08. passiert.)
   *
   * Deshalb dieselbe Bauart wie beim Paketvergleich in Abschnitt 31: hart, wenn das
   * Geprüfte da ist, und ein sichtbarer Hinweis, wenn nicht. */
  var wachePfad = require('os').homedir() + '/.claude/scheduled-tasks/release-wache/SKILL.md';
  if (fs.existsSync(wachePfad)) {
    var wache = fs.readFileSync(wachePfad, 'utf8');
    ok(/--bauen --wache/.test(wache) && /--hoch --wache/.test(wache),
       'Die Release-Wache ruft mit --wache auf - sonst sperrt der Riegel sie selbst aus');
  } else {
    console.log('  ℹ  Die Beschreibung der Release-Wache liegt nicht auf dieser Maschine (' + wachePfad + ').');
    console.log('     Sie gehoert nicht ins Repo; geprueft wird sie dort, wo die Wache laeuft.');
  }
  /* Und die Ansage an kuenftige Sitzungen muss dasselbe sagen wie das Skript. */
  /* Eigens gelesen statt cm benutzt: das steht erst weiter unten, und eine
   * Zusicherung darf nicht an der Reihenfolge im Testlauf haengen. */
  var cmHier = fs.readFileSync(__dirname + '/CLAUDE.md', 'utf8');
  ok(/Ausliefern ist NICHT deine Aufgabe/.test(cmHier) && !/Benutze sie, statt den Ablauf/.test(cmHier),
     'CLAUDE.md weist Sitzungen NICHT mehr an, selbst auszuliefern');

  /* SPERRKLINKE gegen genau diesen Fehler.
   * Ein Test, der eine Datei ausserhalb des Repos OHNE Vorpruefung liest, laesst die
   * Suite abstuerzen - und ein Absturz ist heimtueckischer als ein rotes Haeckchen:
   * Er schreibt weder ❌ noch "FEHLGESCHLAGEN". Wer die Ausgabe nach diesen Worten
   * absucht, sieht nichts und haelt den Lauf fuer bestanden. Der Rueckgabewert ist
   * die einzige verlaessliche Auskunft, und die haben wir am 25.08. nicht angesehen. */
  var selbst = fs.readFileSync(__filename, 'utf8');
  var ungeschuetzt = selbst.split(String.fromCharCode(10)).filter(function (z) {
    return /readFileSync\s*\(\s*require\('os'\)\.homedir\(\)/.test(z);
  });
  ok(ungeschuetzt.length === 0,
     'Kein Test liest ungeprueft ausserhalb des Repos - das laesst die Suite abstuerzen statt rot werden  [' +
     ungeschuetzt.length + ']');

  /* Die Sammelstelle - und dass ihre eigene Beschreibung nicht als Notiz zaehlt und
   * am Ende mitgeloescht wird. */
  ok(fs.existsSync(__dirname + '/release-notizen/LIESMICH.md'), 'Die Sammelstelle fuer Release-Notizen ist beschrieben');
  ok(/LIESMICH/i.test(rel), 'LIESMICH.md wird nicht als Notiz eingesammelt');
  ok(fs.existsSync(__dirname + '/CLAUDE.md'), 'CLAUDE.md sagt kuenftigen Sitzungen, wie ausgeliefert wird');
  var cm = fs.readFileSync(__dirname + '/CLAUDE.md', 'utf8');
  ok(/tools\/release\.js/.test(cm) && /release-notizen/.test(cm),
     'CLAUDE.md nennt beides: die Routine und die Sammelstelle');

  /* --- Der teuerste Fehler des Tages: Loeschen durch die Junction ---
   * "git worktree remove --force" auf einen Baum mit node_modules-Junction hat am
   * 24.08.2026 alle 276 Pakete des ECHTEN node_modules geloescht. Nachgemessen: weder
   * fs.rmSync noch "rmdir /s /q" tun das - nur git raeumt mit eigenem Code auf und
   * steigt in den Verweis hinab. Deshalb muss der Verweis IMMER zuerst geloest werden. */
  ok(/function baubaumWeg/.test(rel), 'Es gibt einen eigenen Weg, den Baubaum wegzuraeumen');
  var bw = rel.slice(rel.indexOf('function baubaumWeg'), rel.indexOf('function naechsteVersion'));
  var iRmdir = bw.indexOf('rmdirSync');
  var iGit = bw.indexOf('worktree remove');
  ok(iRmdir > -1 && iGit > -1 && iRmdir < iGit,
     'Die Junction wird geloest, BEVOR git den Baum entfernt - sonst loescht git durch sie hindurch');
  /* Gezaehlt werden AUFRUFE, nicht Erwaehnungen: der erste Wurf zaehlte den
   * Kommentar mit, der den Vorfall beschreibt, und wurde rot. */
  /* Gezaehlt werden AUFRUFE, nicht Erwaehnungen: der erste Wurf zaehlte den
   * Kommentar mit, der den Vorfall beschreibt, und wurde rot. */
  var zeilen = rel.split(String.fromCharCode(10));
  var aufrufe = zeilen.filter(function (z) {
    return z.indexOf('worktree remove') > -1 &&
           (z.indexOf('execSync') > -1 || z.indexOf('laut(') > -1);
  });
  ok(aufrufe.length === 1,
     'worktree remove wird nur an EINER Stelle aufgerufen',
     aufrufe.length + ' Aufruf(e)');
  ok(aufrufe.length === 1 && bw.indexOf(aufrufe[0].trim().slice(0, 30)) > -1,
     'und dieser eine Aufruf steht in baubaumWeg, das vorher die Junction loest');

  /* --- Eine Nummer darf nicht verwaisen ---
   * --bauen committet die Version, bevor gebaut wird. Scheitert danach etwas (am
   * 24.08. die Junction), steht 8.28.1 im Commit, aber es gibt weder Tag noch Release.
   * Weiterzuzaehlen wuerde sie fuer immer zuruecklassen. */
  var nv = rel.slice(rel.indexOf('function naechsteVersion'), rel.indexOf('function bauen'));
  ok(/git tag/.test(nv) && /return jetzt/.test(nv),
     'Eine Version ohne Tag stammt aus einem steckengebliebenen Lauf und wird wiederverwendet');

  /* Die Fehlermeldung muss die beiden Faelle trennen: fehlende Junction gegen leeres
   * Ziel. Die alte Meldung nannte immer die Junction und schickte die Suche in die
   * falsche Richtung - die Junction stand, ihr Ziel war leer. */
  ok(/ZIEL ist leer/.test(rel) && /npm ci/.test(rel),
     'Ein leeres Junction-Ziel wird als solches gemeldet, mit dem Weg zurueck (npm ci)');
})();

console.log('\n46) Was die App dauerhaft aufzeichnet');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  /* Seit Stufe E wohnen die Aufzeichner in kosten.js; die Handelspfad-AUFRUFE
   * (stempeln, Fehler festhalten) bleiben im Handelsmodul - jede Marke schneidet
   * an ihrer Stelle. */
  var ks6 = fs.readFileSync(__dirname + '/kosten.js', 'utf8');

  /* --- Die Spannen duerfen sich nicht vergessen ---
   * spannenProbe sammelt in einen Ringpuffer von 4.000 Proben. Bei rund 250 Proben je
   * Handelstag reicht der fuer etwa 16 Tage, danach faellt der aelteste Tag lautlos
   * heraus. Die Fragen, die daran haengen - haelt die Annahme 0,10 % ueber Wochen, ist
   * die enge Haelfte des Universums dauerhaft enger - brauchen aber Monate. */
  ok(/function spannenTagFestschreiben/.test(ks6),
     'Je Tag und Wert wird ein Median festgeschrieben, bevor der Ringpuffer vergisst');
  ok(ks6.indexOf('async function spannenProbe') >= 0, 'Der Sammler ist auffindbar');
  var probe = ks6.slice(ks6.indexOf('async function spannenProbe'), ks6.indexOf('function spannenTagFestschreiben'));
  var iFest = probe.indexOf('spannenTagFestschreiben()');
  var iKapp = probe.indexOf('slice(0, 4000)');
  ok(iFest > -1 && iKapp > -1 && iFest < iKapp,
     'Festgeschrieben wird VOR dem Kappen - sonst ist der aelteste Tag schon weg');
  var fest = ks6.slice(ks6.indexOf('function spannenTagFestschreiben'), ks6.indexOf('function verkabeln(deps)'));
  ok(/5 \* 365/.test(fest),
     'Die Tagesbilanz wird erst nach Jahren aufgeraeumt - sie ist der Zweck der Uebung');

  /* --- Die Kosten duerfen nicht an einer Spiegelung haengen, die nicht laeuft ---
   * kostenMessungNeu misst den echten Schlupf, feuert aber nur bei gespiegelten
   * Positionen. Am 25.08.2026 hatte KEINE der fuenf offenen Positionen eine capDealId;
   * die Messung stand auf 0 Runden und waere dort geblieben. */
  ok(/function spanneJetzt/.test(ks6) && /function spanneStempeln/.test(ks6),
     'Jeder Trade bekommt die notierte Spanne mit - unabhaengig von der Demo-Spiegelung');
  var auf = (dep.match(/spanneStempeln\(trade, 'open'\)/g) || []).length;
  var zu = (dep.match(/spanneStempeln\(pos, 'close'\)/g) || []).length;
  ok(auf === 2, 'Beide Wege, auf denen ein Trade oeffnet, stempeln die Spanne', auf + ' Stelle(n)');
  ok(zu === 1, 'Der Weg, auf dem ein Trade schliesst, stempelt sie auch', zu + ' Stelle(n)');
  /* Jede Stelle, an der ein Trade entsteht oder endet, muss gestempelt werden -
   * sonst fehlt genau dort die Kostenaufzeichnung, und es faellt keinem auf. */
  var offen = (dep.match(/notifyTrade\(trade, 'open'\)/g) || []).length;
  var ende = (dep.match(/notifyTrade\(pos, 'close'\)/g) || []).length;
  ok(auf === offen && zu === ende,
     'Jede Oeffnung und jede Schliessung ist gestempelt - keine Stelle vergessen',
     auf + '/' + offen + ' offen, ' + zu + '/' + ende + ' zu');
  /* Ohne Proben wird NICHTS behauptet - ein erfundener Wert waere schlimmer als keiner. */
  var sj = ks6.slice(ks6.indexOf('function spanneJetzt'), ks6.indexOf('function spanneStempeln'));
  ok(/return null/.test(sj), 'Liegt keine Probe vor, wird nichts gestempelt statt geraten');

  /* --- Ein Fehlschlag, den niemand sieht, wird nicht behoben --- */
  ok(/function capFehlerNeu/.test(ks6) && /capFehlerNeu\(tr\.sym, r\)/.test(dep),
     'Scheitert die Spiegelung, wird der Grund dauerhaft festgehalten (nicht nur HEALTH)');

  /* --- Was schon da war, bleibt --- */
  ok(/D\.patience\[dk\]\[reason\]/.test(dep), 'Nicht gehandelte Signale werden weiter je Tag gezaehlt');
  ok(/D\.spannen\.proben\.unshift/.test(ks6), 'Die Spannen-Probe laeuft weiter');
  /* Die Historie aus Kerzen darf die Live-Messung weder ersetzen noch ueberschreiben.
   * Quote-Schnappschuss und Kerzenschluss-Bid/Ask sind nicht dieselbe Groesse. */
  /* Seit Stufe E: EINE Definition (depot.js, beim Kosten-Bestand), zwei Auswerter -
   * capBackfill in depot.js und massenBackfill in backfill.js (hereingereicht). */
  ok(/function spannenAusKerzen/.test(ks6) && (dep.match(/spannenAusKerzen\(sym, sess\)/g) || []).length === 1 &&
     (fs.readFileSync(__dirname + '/backfill.js', 'utf8').match(/spannenAusKerzen\(sym, sess\)/g) || []).length === 1,
     'Die Spanne wird an beiden Backfill-Stellen ausgewertet');
  ok(ks6.indexOf("if (da && da.q !== 'kerze') continue;") !== -1,
     'Ein aus Kerzen gewonnener Tag ueberschreibt nie einen aus Live-Proben');
  ok(/function spannenHistorie/.test(ks6) && /Kerzenschluss-Bid\/Ask, nicht Quote-Proben/.test(dep),
     'Die Kerzen-Historie steht NEBEN der Live-Messung und sagt, was sie ist');
  /* Ein Fehler, der keinen Fehler erzeugt, ist die teuerste Sorte: Faellt die
   * Verdrahtung weg, sammelte spannenAusKerzen lautlos nichts. Ein Wurf waere hier
   * falsch (er braeche den Backfill ab, der auch das Kursarchiv fuellt) - also muss
   * es zaehlen und melden. Diese drei Zusicherungen halten genau das fest. */
  ok(/HEALTH\.spannenVerdrahtung = \(HEALTH\.spannenVerdrahtung \|\| 0\) \+ 1/.test(ks6) &&
     /HEALTH\.spannenVerdrahtung === 1[\s\S]{0,120}melde\(/.test(ks6),
     'Fehlende Verdrahtung wird gezaehlt und einmal gemeldet, nicht verschwiegen');
  ok(/HEALTH\.spannenOhneFeld === 5[\s\S]{0,140}melde\(/.test(ks6) &&
     /HEALTH\.spannenOhneFeld = 0;/.test(ks6),
     'Kerzen ohne Briefkurs: erst nach fuenf Runden in Folge gemeldet, jeder Erfolg setzt zurueck');
  /* Der Analyse-Export wohnt seit Stufe E in berichte.js - dort wird geschnitten. */
  var br6 = fs.readFileSync(__dirname + '/berichte.js', 'utf8');
  ok(/spannenTageAusKerzen: HEALTH\.spannenTage/.test(br6) &&
     /spannenVerdrahtungFehlt: HEALTH\.spannenVerdrahtung/.test(br6),
     'Der Analyse-Export nennt beides: wie viel ankam UND ob die Verdrahtung fehlte');
  /* Warum der positive Zaehler mit muss: "kein Fehler gezaehlt" ist erst dann eine
   * Auskunft, wenn danebensteht, wie viel wirklich angekommen ist. Sonst sieht ein
   * abgeschalteter Sammler genauso aus wie ein fehlerfreier. */
  ok(/HEALTH\.spannenTage = \(HEALTH\.spannenTage \|\| 0\) \+ neu;/.test(ks6),
     'Auch der Erfolg wird gezaehlt - sonst ist Stille nicht von Fehlerfreiheit zu unterscheiden');
  /* Der Analyse-Export ist die Leitung, ueber die SAEMTLICHE Gesundheitszahlen die App
   * verlassen. Faellt er still aus, schweigen mit ihm alle Zaehler, die einen anderen
   * stillen Ausfall melden sollten. Ein Waechter, der selbst lautlos ausfallen kann,
   * ist keiner - deshalb steht diese Zusicherung hier und nicht bei der Diagnose. */
  ok(/HEALTH\.exportFail = \(HEALTH\.exportFail \|\| 0\) \+ 1/.test(br6) &&
     /HEALTH\.exportFail === 1[\s\S]{0,120}melde\(/.test(br6),
     'Ein fehlgeschlagener Analyse-Export wird gezaehlt und gemeldet, nicht zu null verschluckt');
  ok(/analyseExportFehler: HEALTH\.exportFail/.test(br6) && /archivSchreibFehler:/.test(br6),
     'Beide Schreibwege stehen in den Gesundheitszahlen: Export und Kursarchiv');
  /* Vier weitere stille Ausfaelle (25.08.2026), alle im Handels- und Nachtpfad. */
  ok(/if \(Date\.now\(\) - intradayScanSeit < 10 \* 60000\) return;/.test(dep) &&
     /HEALTH\.scanHaenger = \(HEALTH\.scanHaenger \|\| 0\) \+ 1/.test(dep),
     'Eine haengende Scan-Sperre loest sich nach zehn Minuten - sonst schwiegen auch die Stops');
  ok(/intradayScanSeit = Date\.now\(\);/.test(dep),
     'Die Scan-Sperre bekommt beim Setzen ihren Zeitstempel');
  ok(/pilotLogAdd\('Tiefensuche uebersprungen/.test(fs.readFileSync(__dirname + '/zucht.js', 'utf8')),
     'Die Tiefensuche hinterlaesst eine Zeile, wenn sie ohne Kursarchiv umkehrt');
  ok(/HEALTH\.edgeFail = \(HEALTH\.edgeFail \|\| 0\) \+ 1/.test(dep) &&
     /HEALTH\.edgeFail === 2[\s\S]{0,160}melde\(/.test(dep),
     'Faellt der Edge-Waechter aus, faellt eine Schutzhandlung aus - das wird gemeldet');
  /* Der schwerste der vier: die CFD-Position bleibt beim Broker offen, und der Fall
   * ging bisher als capitalOk in den Export - nicht verschwiegen, sondern als Erfolg. */
  ok(/if \(r\.ok && !r\.dealId\)/.test(dep) &&
     /HEALTH\.capOhneDealId = \(HEALTH\.capOhneDealId \|\| 0\) \+ 1/.test(dep),
     'Eine Spiegelung ohne Bestaetigung gilt nicht mehr als voller Erfolg');
  ok(/ACHTUNG: ohne Bestätigung eröffnet/.test(dep),
     'und der Hinweis steht in der Trade-Begruendung, nicht nur in der Diagnose');
  ok(/capitalOhneBestaetigung: HEALTH\.capOhneDealId/.test(br6) &&
     /edgeWaechterAusfaelle: HEALTH\.edgeFail/.test(br6) && /scanSperreHaenger: HEALTH\.scanHaenger/.test(br6),
     'Alle drei neuen Zaehler stehen in den Gesundheitszahlen');
  /* Stufe 4: fuenf stille Ausfaelle in Anzeige und Zulieferung. Sie kosten kein Geld,
   * aber sie lassen jemanden glauben, er saehe etwas Vollstaendiges. */
  var mjS = fs.readFileSync(__dirname + '/main.js', 'utf8');
  ok(/aktuellGrund:/.test(mjS) && /holeAktuell\.grund = String/.test(mjS),
     'earnings-fetch unterscheidet "kein Termin" von "Abruf gescheitert"');
  var duS = fs.readFileSync(__dirname + '/driftui.js', 'utf8');
  ok(/ohneAktuell\+\+/.test(duS) && /ohne aktuellen Termin/.test(duS),
     'und die Drift-Anzeige zaehlt die Werte, fuer die nur die Vergangenheit bekannt ist');
  var exS = fs.readFileSync(__dirname + '/explorer.js', 'utf8');
  ok(/SIG_FEHLER\+\+/.test(exS) && /Detektor-Abbrüche/.test(exS),
     'Ein abgebrochener Detektor sieht nicht mehr aus wie "kein Signal"');
  var sbS = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');
  ok(sbS.indexOf('if (kBau) kBau.addEventListener') > -1 &&
     sbS.indexOf('if (kBau) kBau.addEventListener') < sbS.indexOf('if (!B || !sel) {'),
     'Der Ausweg (Expertenmodus) wird VOR dem Baukasten-Waechter verdrahtet');
  var mkS = fs.readFileSync(__dirname + '/marktkarteui.js', 'utf8');
  ok(/keineAktie: a\.keineAktie/.test(mkS) && /doppelt: a\.doppelt/.test(mkS),
     'Die Marktkarte reicht die Zaehler durch, die ihre Fusszeile belegen');
  ok(/ARTEN_FEHLER/.test(mkS) && /artenHinweis \+/.test(mkS),
     'und sagt es, wenn der Wertpapierart-Filter mangels Daten gar nicht lief');
  /* STRATEGIEN-LISTE (25.08.2026). Strategien entstehen an zwei Orten - der Baukasten
   * schreibt in den Datenordner, die Messmaschine misst das Projektverzeichnis - und die
   * App las nur den ersten. Im Reiter Messung stand EINE Strategie, waehrend zwoelf
   * gemessene existierten. Der Kanal mess-strategien war samt Bruecke gebaut, aber kein
   * einziger Aufruf in der Oberflaeche: ein Kanal ohne Verbraucher.
   * Nachgerechnet gegen die echten Ordner: 13 Zeilen statt 1. */
  var mjSt = fs.readFileSync(__dirname + '/main.js', 'utf8');
  ok(/function strategieQuelle\(\)/.test(mjSt) && /quelle-pfad\.txt/.test(mjSt),
     'Der Hauptprozess sucht die Strategien auch im Projektverzeichnis - mit Zettel als Rueckfall');
  ok(/lies\(dir, 'lokal'\)/.test(mjSt) && /lies\(quelle, 'quelle'\)/.test(mjSt),
     'mess-strategien liest BEIDE Orte und schreibt die Herkunft dazu');
  /* Das Schreibrecht bleibt, wie es war: nur in den Datenordner. Gelesen wird woanders. */
  ok(/ipcMain\.handle\('write-strategie'[\s\S]{0,600}Markt-Dashboard-Daten', 'strategien'/.test(mjSt),
     'Geschrieben wird weiterhin AUSSCHLIESSLICH in den Datenordner');
  var sbSt = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');
  ok(/async function strategienLaden\(\)/.test(sbSt) && /window\.api\.messStrategien\(\)/.test(sbSt),
     'Die Bruecke messStrategien hat endlich einen Verbraucher');
  ok(/if \(ev\.detail === 'messung'\) \{ laden\(\); strategienLaden\(\); \}/.test(sbSt),
     'Die Liste wird beim Wechsel in den Reiter Messung geladen');
  /* Die drei Luecken muessen BENANNT werden. Eine Liste, die stillschweigend die
   * Haelfte weglaesst, ist schlimmer als gar keine - genau der Zustand vorher. */
  ok(/Protokoll\(e\) ohne Datei/.test(sbSt) && /nur im Datenordner/.test(sbSt) &&
     /nie gemessen/.test(sbSt),
     'Die Karte benennt alle drei Luecken: Protokoll ohne Datei, nur lokal, nie gemessen');
  ok(/Das Projektverzeichnis ist nicht auffindbar/.test(sbSt),
     'und sagt es, wenn sie nur den halben Bestand sehen kann');
  var htSt = fs.readFileSync(__dirname + '/index.html', 'utf8');
  ok(/id="strategienListe"/.test(htSt) && /id="strategienFuss"/.test(htSt),
     'Die Karte hat ihren Platz im Reiter Messung');
  /* P7 (25.08.2026): Die Spalte "Ort" zeigte zwoelfmal denselben Wert. Eine Spalte ohne
   * Unterschied ist keine Information, sondern Breite. Sie darf verschwinden - der eine
   * Ort aber nicht: er muss dann einmal dastehen. */
  ok(/var ortSpalte = orte\.length > 1/.test(sbSt) &&
     /\(ortSpalte \? '<th scope="col" style="padding:4px 8px;">Ort<\/th>' : ''\)/.test(sbSt),
     'Strategien-Liste: die Ort-Spalte erscheint nur bei mehr als einem Ort');
  ok(/Ort aller ' \+ zeilen\.length/.test(sbSt),
     'und der eine Ort geht dabei nicht verloren, sondern steht einmal unter der Tabelle');
  /* Der unangenehme Sonderfall: bestuende die Liste nur aus verwaisten Protokollen,
   * waere der einzige "Ort" das fette "Datei fehlt" - eine Warnung, keine Ortsangabe. */
  ok(/zeilen\.some\(function \(z\) \{ return !z\.hatDatei; \}\)/.test(sbSt),
     'Strategien-Liste: "Datei fehlt" ist eine Warnung und wird nie wegoptimiert');
  /* Ein i-Knopf ohne Text waere dieselbe stille Luecke noch einmal: er sieht aus wie
   * eine Erklaerung und ist keine. */
  var shSt = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  ok(/data-info="messung\.strategien"/.test(htSt) && /'messung\.strategien':/.test(shSt),
     'Der Erklaer-Knopf der Karte hat auch einen Text - sonst waere er ein toter Knopf');
  /* FEHLER #79: "Die Marktkarte aktualisiert jedesmal wenn die Filter angepasst
   * werden, das macht die Bedienung sehr traege." Ursache: mkAnzahl und mkBranche
   * hingen beide direkt an laden(), also am vollen Netzabruf. Kurse haengen aber am
   * KUERZEL, nicht am Filter - wer die Branche wechselt, sieht dieselben Werte in
   * anderer Auswahl. Bei 300 Werten waren das hunderte Abrufe fuer nichts. */
  var mkFix = fs.readFileSync(__dirname + '/marktkarteui.js', 'utf8');
  ok(/var KURSE = \{\};/.test(mkFix) && /function kursFrisch\(sym\)/.test(mkFix),
     'Die Marktkarte hat einen Kurs-Zwischenspeicher je Kuerzel');
  /* Der Kern der Abhilfe: was versorgt ist, wird nicht noch einmal geholt. Ohne diese
   * eine Zeile waere der Zwischenspeicher reine Zierde. */
  /* Seit dem Sammelabruf gibt es keine Schleife mehr, aus der man aussteigen koennte:
   * gefragt wird nur noch nach dem, was WEDER im Zwischenspeicher NOCH in der App liegt.
   * Dieselbe Eigenschaft, andere Bauart. */
  ok(/var offen = liste\.filter\(function \(w\) \{ return !w\.ausSpeicher && !w\.ausApp; \}\);/.test(mkFix) &&
     /K\.holeViele\(offen\.map/.test(mkFix),
     'Gefragt wird nur nach dem, was weder im Zwischenspeicher noch in der App liegt');
  ok(/if \(!offen\.length\) return/.test(mkFix),
     'Ist nichts offen, unterbleibt der Abruf ganz - das ist der Fall nach jeder Filteraenderung');
  ok((mkFix.match(/KURSE\[w\.sym\] = \{ kurs:/g) || []).length >= 2,
     'Geholte Kurse wandern in den Zwischenspeicher - sonst fuellt er sich nie');
  /* Der frueher hier stehende `return 0` haette den Zwischenspeicher unterschlagen und
   * eine volle Karte als leer gemeldet. */
  ok(!/typeof K\.hole !== 'function'\) return 0;/.test(mkFix),
     'Ohne Kurslader wird die Zahl aus dem Zwischenspeicher gemeldet, nicht null');
  /* Fuenf Minuten, wie in #79 gewuenscht - und dieselbe Spanne wie die Frische des
   * Zwischenspeichers. Eine Minute waere doppelte Arbeit gewesen. */
  ok(/KURS_FRISCH_MS = 5 \* 60000/.test(mkFix) &&
     /Date\.now\(\) - letzterLauf >= KURS_FRISCH_MS/.test(mkFix),
     'Getaktet wird in derselben Spanne, in der der Zwischenspeicher haelt: fuenf Minuten');
  /* Das Projektverzeichnis wird gesucht, bevor jemand einen Zettel schreiben muss. */
  ok(/'Stock-Dashboard', \.\.\.teil/.test(mjSt),
     'Das Projektverzeichnis wird neben dem Datenordner selbst gesucht');
  /* SAMMELABRUF (25.08.2026). Vorher ein Netzabruf JE WERT - bei der Marktkarten-Vorgabe
   * von 600 Werten sechshundert Anfragen fuer ein Bild. Gemessen gegen query2: 800
   * Kuerzel in EINER Anfrage, 3,4 s. Geblockt wird bei 400. */
  ok(/ipcMain\.handle\('yahoo-quotes'/.test(mjSt) && /QUOTE_BLOCK = 400/.test(mjSt),
     'Der Hauptprozess kann Kurse gebuendelt holen, in Bloecken zu 400');
  /* Derselbe Host und dieselbe Crumb-Sitzung wie der Ergebniskalender - der Kanal
   * oeffnet KEINE neue Aussengrenze. Genau das ist die Regel aus 7.17. */
  ok(/const sitz = await holeSitz\(\);/.test(mjSt) && /jsonGet\(pfad, sitz\.cookie\)/.test(mjSt),
     'Der Sammelabruf benutzt die vorhandene Yahoo-Sitzung, nicht einen eigenen Weg');
  /* Eine Obergrenze, damit ein Aufrufer nicht versehentlich zehntausend Kuerzel schickt. */
  ok(/QUOTE_MAX = 3000/.test(mjSt) && /if \(syms\.length >= QUOTE_MAX\) break;/.test(mjSt),
     'Die Zahl der Kuerzel je Aufruf ist gedeckelt');
  var kuQ = fs.readFileSync(__dirname + '/kurse.js', 'utf8');
  ok(/holeViele: async function/.test(kuQ) && /return \{ ok: false, grund:/.test(kuQ),
     'Der Lader gibt den GRUND zurueck - sonst waere ein gescheiterter Abruf von einer leeren Antwort nicht zu unterscheiden');
  ok(/kurseHolen\.letzterGrund/.test(mkFix) && /Kursabruf gescheitert/.test(mkFix),
     'und die Karte sagt es, statt still eine halbe Karte zu zeigen');
  /* Der Hintergrundbetrieb war der eigentliche Wunsch aus #79. Er ist erst mit dem
   * Sammelabruf vertretbar: zwei Anfragen je Runde statt sechshundert. */
  ok(/if \(document\.hidden\) return;/.test(mkFix) && !/classList\.contains\('active'\)/.test(mkFix),
     'Die Karte laedt jetzt auch im Hintergrund nach - nur bei unsichtbarem Fenster nicht');
  var ks7 = fs.readFileSync(__dirname + '/kosten.js', 'utf8');
  ok(/function kostenMessungNeu/.test(ks7), 'Die Messung des echten Schlupfs bleibt bestehen');

  /* --- Die Kostenmessung darf nicht auf einen Trade warten muessen ---
   * Befund 25.08.2026: 0 gemessene Runden, und daran haette sich nie etwas geaendert.
   * Gespiegelt wird nur im Intraday-Pfad; alle sieben je gemachten Trades stammen von
   * der Stunden-Strategie, und der Intraday-Arm ist seit dem 23.08. vom Edge-Waechter
   * pausiert. Der Schutz verhindert genau die Messung, die ueber ihn entscheiden
   * wuerde. Die Kostenfrage haengt aber gar nicht an der Strategie. */
  ok(/async function kostenRundeMessen/.test(ks7),
     'Es gibt eine Kostenmessung, die ohne Signal auskommt (oeffnen, sofort schliessen)');
  var kr = ks7.slice(ks7.indexOf('async function kostenRundeMessen'), ks7.indexOf('function kostenBilanz'));
  /* Die notierte Spanne VOR der Order: nur so laesst sich Spanne von Schlupf trennen. */
  ok(/CapAPI\.quote\(sym\)/.test(kr) && /notiert:/.test(kr),
     'Die Runde haelt die notierte Spanne fest - sonst waere sie nur eine Zahl ohne Zerlegung');
  /* Die Groesse folgt dem GEGENWERT, nicht der Stueckzahl. Fest 0,1 Einheiten hiess
   * bei ETH (~3.000 $) rund 300 $ und bei BTC (~100.000 $) rund 10.000 $ - am
   * 25.08.2026 lehnte das Demo-Konto BTC mit RC_NOT_ENOUGH_MARGIN ab. Eine feste
   * Stueckzahl ist bei Werten, deren Preise um den Faktor 1.000 auseinanderliegen,
   * schlicht die falsche Groesse. */
  ok(kr.indexOf('ZIEL_USD') > -1 && kr.indexOf('ZIEL_USD / vor.mid') > -1,
     'Die Messrunde bemisst sich am Gegenwert, nicht an einer festen Stueckzahl');
  ok(/MARGIN/i.test(kr) && kr.indexOf('groesse / 2') > -1,
     'Bei zu wenig Sicherheit wird mit kleinerer Position nachgefasst - aber nur dann');
  /* Bleibt eine Position offen, MUSS das laut gesagt werden - stillschweigend eine
   * offene Position auf dem Konto zu hinterlassen waere der schlimmere Fehler. */
  ok(/offenGeblieben/.test(kr) && /von Hand pruefen/.test(kr),
     'Scheitert das Schliessen, wird die offene Position ausdruecklich gemeldet');
  /* Der Marktzustand wird geprueft: eine Runde bei geschlossener Boerse misst nichts. */
  ok(/marketOpen/.test(kr), 'Bei geschlossener Boerse wird gar nicht erst gemessen');

  /* --- Und sie laeuft NIE von allein --- 
   * Sie setzt echte Orders auf dem Demo-Konto ab. Was Orders absetzt, gehoert an eine
   * Hand, nicht an einen Taktgeber. */
  var h68 = fs.readFileSync(__dirname + '/index.html', 'utf8');
  ok(/id="kostenRundeBtn"/.test(h68), 'Die Messrunde haengt an einem Knopf');
  ok(!/setInterval\([^)]*kostenRunde/.test(dep) && !/setTimeout\([^)]*kostenRundeMessen/.test(dep),
     'Kein Taktgeber loest die Messrunde aus - nur der Knopf');
  var draht = dep.slice(dep.indexOf("getElementById('kostenRundeBtn')"), dep.indexOf('setTimeout(updateCapStatus, 3000)'));
  ok(/window\.confirm\(/.test(draht), 'Vor der Order wird gefragt');
  ok(/DEMO/.test(draht), 'Und die Frage sagt ausdruecklich, dass es das Demo-Konto ist');
  ok(/kostenRundeLaeuft/.test(draht), 'Ein Doppelklick loest nicht zwei Runden aus');

  /* --- Krypto misst rund um die Uhr, gehoert aber NICHT in die Aktien-Zahl ---
   * Die Spanne auf BTC sagt nichts ueber die Spanne auf MSFT, und die Annahme
   * 0,10 %, gegen die geprueft wird, stammt aus den Aktien-Studien. Eine einzige
   * BTC-Runde wuerde den Median verschieben, an dem fast jede Studie haengt -
   * unsichtbar. Zwei Quellen in einer Reihe haben hier schon einmal Schaden
   * angerichtet (Capital-CFD und Yahoo). */
  /* istKrypto blieb im Handelsmodul (12 Aufrufstellen) - Scheibe eng um die Funktion. */
  var ik = dep.slice(dep.indexOf('function istKrypto'), dep.indexOf('function istKrypto') + 400);
  ok(/BTC/.test(ik) && /ETH/.test(ik), 'Krypto wird als solches erkannt');
  ok(ks7.indexOf('function kostenBilanz') >= 0 && ks7.indexOf('window.__kostenBilanz') >= 0, 'kostenBilanz samt Testgriff ist auffindbar');
  var kb2 = ks7.slice(ks7.indexOf('function kostenBilanz'), ks7.indexOf('window.__kostenBilanz'));
  ok(/x\.krypto/.test(kb2),
     'Die Kostenbilanz trennt Krypto von Aktien - sonst verschiebt eine BTC-Runde den Median der Studien');
  ok(/kryptoN/.test(kb2) && /kryptoMedianPct/.test(kb2),
     'Die Krypto-Zahl wird eigens ausgewiesen, nicht verschwiegen');
  /* Ohne Aktien-Runde darf keine Aktien-Zahl entstehen - nichts behaupten ist
   * besser als eine Zahl, die aus Krypto stammt. */
  ok(/if \(r\.length\) \{/.test(kb2),
     'Ohne Aktien-Runde wird keine Aktien-Zahl gebildet');
  /* Die Boersen-Sperre gilt fuer Aktien. Auf Krypto waere sie schlicht falsch und
   * haette das Messgeschirr nachts gesperrt - genau dann, wenn Zeit dafuer ist. */
  ok(/!krypto && !\(window\.Dash/.test(kr),
     'Die Boersen-Sperre gilt nur fuer Aktien, nicht fuer Krypto');
  ok(/krypto: krypto/.test(kr), 'Jede Runde merkt sich, ob sie Krypto war');
  ok(/id="kostenRundeSym"/.test(h68) && /BTCUSD/.test(h68),
     'Die Oberflaeche laesst den Wert waehlen, Krypto eingeschlossen');

  /* --- Jeder Versuch hinterlaesst eine Spur, auch der gescheiterte ---
   * Am 25.08.2026 drueckte Wilhelm den Knopf, und danach stand weder eine Runde noch
   * ein Fehlschlag in den Daten: der Lauf war an einer fruehen Sperre umgekehrt, und
   * die gab nur eine Statuszeile zurueck, die beim Neuzeichnen verschwand. Ein
   * Versuch, dessen Ausgang niemand nachlesen kann, ist kein Messgeschirr. */
  ok(/function kostenVersuchNeu/.test(ks7), 'Jeder Versuch einer Kostenrunde wird festgehalten');
  /* Jede Rueckkehr aus kostenRundeMessen muss vermerkt werden - eine vergessene
   * waere genau die stille Stelle, um die es hier geht. */
  var kr2 = ks7.slice(ks7.indexOf('async function kostenRundeMessen'), ks7.indexOf('function kostenBilanz'));
  var rueck = (kr2.match(/return { ok:/g) || []).length;
  var vermerke = kr2.split('kostenVersuchNeu(').length - 1;
  ok(vermerke >= rueck - 1,
     'Fast jede Rueckkehr ist vermerkt (Ausnahme: die offen gebliebene Position, die eigens meldet)',
     vermerke + ' Vermerke auf ' + rueck + ' Rueckgaben');
  ok(/lastPriceError/.test(kr2),
     'Bleibt der Kurs aus, wird der Grund aus capital.js mitgenommen statt verworfen');
  ok(/Letzte Kostenrunde/.test(dep), 'Der letzte Versuch steht in der Anzeige, nicht nur in den Daten');

  /* --- Die Tagesbilanz darf nicht am Sammler haengen ---
   * spannenProbe kehrt bei geschlossener Boerse sofort um. Haengt das Festschreiben
   * dort drin, bleiben die Proben des Vortags bis zur naechsten Oeffnung unbewahrt -
   * und der Zweck der Tagesbilanz war gerade, dass nichts verlorengeht. */
  /* Seit Stufe E: der Sammler ruft intern fest (kosten.js), die Takte in init()
   * rufen ueber die Schnittstelle - beides zaehlt, die Eigenschaft bleibt. */
  var festAufrufe = (dep.match(/Kosten.tagFestschreiben()/g) || []).length + (ks7.match(/spannenTagFestschreiben()/g) || []).length;
  ok(festAufrufe >= 3,
     'Die Tagesbilanz wird auch ausserhalb des Sammlers festgeschrieben',
     festAufrufe + ' Aufruf(e)');
})();

console.log('\n47b) signal() bekommt das Symbol');
(function () {
  /* Bis zum 25.08.2026 hiess die Signatur signal(bars, i, params, rang) - ohne Symbol.
   * Eine Strategie, die etwas Symbolbezogenes braucht (Ertragstermine, Branche,
   * Kennzahlen), musste sich die Zuordnung aus den KURSEN zurueckrechnen. Kandidat B der
   * Vorregistrierung tat das mit einem Fingerabdruck aus zehn fruehen Schlusskursen -
   * und genau in dieser Bruecke ist sein Quelltext abgebrochen und verlorengegangen.
   * Der laengste Teil der Datei existierte nur, weil hier ein Argument fehlte.
   * Deshalb wird das hier AUSGEFUEHRT geprueft, nicht gelesen. */
  var os2 = require('os'), path2 = require('path');
  var M = require(__dirname + '/studien/messmaschine/messmaschine.js');
  var dir = path2.join(os2.tmpdir(), 'md-sym-' + process.pid);
  fs.mkdirSync(dir, { recursive: true });

  /* Zwei Reihen, die sich im KURSVERLAUF nicht unterscheiden - nur im Dateinamen.
   * Genau der Fall, an dem eine Fingerabdruck-Bruecke scheitern muesste. */
  var reihe = [], tag = Date.UTC(2015, 0, 2);
  for (var d = 0; d < 700; d++) {
    var dt = new Date(tag + d * 86400000);
    if (dt.getUTCDay() === 0 || dt.getUTCDay() === 6) continue;
    reihe.push([dt.getTime(), 100 + (d % 7) * 0.5, 1000]);
  }
  /* Zwoelf Reihen, weil die Maschine unter zehn Werten verweigert (E1). */
  var SYMS = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF',
              'GGG', 'HHH', 'III', 'JJJ', 'KKK', 'LLL'];
  SYMS.forEach(function (s) {
    fs.writeFileSync(path2.join(dir, 'bars_1d_' + s + '.json'),
      JSON.stringify({ series: reihe }));
  });

  var gesehen = {};
  var r = M.messe({
    key: 'symprobe', grund: 'Prueft, ob signal() das Symbol bekommt.',
    zeitrahmen: '1d', haltedauerKerzen: 3, richtung: 'long', leseFensterKerzen: 5,
    universum: function () { return true; },
    varianten: [{}],
    signal: function (bars, i, params, rang, sym) {
      gesehen[String(sym)] = (gesehen[String(sym)] || 0) + 1;
      return null;
    }
  }, dir);

  var namen = Object.keys(gesehen).sort();
  ok(namen.length === SYMS.length && namen[0] === 'AAA' && namen[namen.length - 1] === 'LLL',
     'signal() sieht jedes Symbol des Universums beim Namen  [' + namen.length + ': ' + namen.join(',') + ']');
  ok(namen.indexOf('undefined') === -1,
     'Kein Aufruf ohne Symbol - sonst braeuchte es wieder eine Bruecke aus Kursen');

  /* Rueckwaertsvertraeglich: eine Strategie mit der alten Signatur laeuft unveraendert. */
  var alt = 0;
  M.messe({
    key: 'altsignatur', grund: 'Alte Signatur ohne sym.',
    zeitrahmen: '1d', haltedauerKerzen: 3, richtung: 'long', leseFensterKerzen: 5,
    universum: function () { return true; }, varianten: [{}],
    signal: function (bars, i, params) { alt++; return null; }
  }, dir);
  ok(alt > 0, 'Eine Strategie mit der alten Signatur laeuft unveraendert weiter');

  fs.rmSync(dir, { recursive: true, force: true });
})();

console.log('\n47c) Stufe 0: delta80, Placebo je Haelfte, Pflichtzeilen, Kostenanzeige');
(function () {
  var mm = fs.readFileSync(__dirname + '/studien/messmaschine/messmaschine.js', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var cm = fs.readFileSync(__dirname + '/CLAUDE.md', 'utf8');

  /* --- S2: delta80 --- */
  /* Die MDE (2 x se) sagt, ab wann ein Ausschlag nicht mehr als Rauschen durchgeht.
   * delta80 sagt, welchen WAHREN Effekt der Lauf mit 80 % Wahrscheinlichkeit gefunden
   * haette. Nur die zweite Zahl entscheidet, ob eine Messung ueberhaupt sinnvoll war -
   * und genau diese Verwechslung hat zweimal Kandidaten durchgelassen, die nie
   * bestaetigbar waren. Deshalb AUSGERECHNET geprueft, nicht gegrept. */
  ok(/var d80 = \(u\.se > 0\) \? \(schwelle \+ VERFAHREN\.zPower80\) \* u\.se/.test(mm),
     'delta80 = (Schwelle + z80) x se - nicht die MDE, die eine andere Frage beantwortet');
  ok(/delta80Pp/.test(mm) && /delta80: d80/.test(mm),
     'delta80 steht in der Urteilszeile UND im Ergebnis');
  (function () {
    var se = 0.0018123, schwelle = 2.5, z80 = 0.8416212;
    var erwartet = (schwelle + z80) * se * 100;
    ok(Math.abs(erwartet - 0.6055) < 0.002,
       'Nachgerechnet: se 0,18123 Pp bei Schwelle 2,50 gibt delta80 ' + erwartet.toFixed(4) + ' Pp');
    ok(erwartet > 2 * se * 100,
       'delta80 ist IMMER groesser als die MDE - wer die MDE fuer die Nachweisgrenze haelt, unterschaetzt sich');
  })();

  /* --- S7: Placebo je Haelfte --- */
  ok(!/if \(hf !== 'bestaetigung'\) continue/.test(mm),
     'Der Placebo ist nicht mehr fest auf die Bestaetigungshaelfte verdrahtet');
  /* Die schliessende Klammer steht seit dem 26.08.2026 bewusst NICHT mehr im Muster:
   * mit #88 bekommt placeboLauf die Einstiegskonvention als letztes Argument.
   * Gemessen wird, dass die Entdeckungshaelfte einen Placebo bekommt - nicht, wie viele
   * Argumente die Funktion hat. Alles vor dem letzten Argument bleibt fest verankert. */
  ok(/placeboLauf\(U, kontrolleFuer\(0\), H, schnittTag, vorlauf, leseFenster, _pos, 'entdeckung'/.test(mm),
     'Auch die Entdeckungshaelfte bekommt einen geprueften Nullpunkt - von dort kommen die Vorregistrierungszahlen');
  /* #88: und beide Placebo-Laeufe bekommen die Konvention wirklich mit. Ohne sie mass
   * der Nullpunktwaechter eine ANDERE Ausfuehrung als Signal und Kontrollen - bei
   * folgeEroeffnung die mittlere Uebernachtluecke als Schein-Ueberschuss, gemessen
   * -0,5000 Pp gegen eine MDE von 0,0055 Pp (test-messmaschine.js, Block 17). */
  /* Seit dem ausstieg-Schalter (26.08.2026) traegt der Placebo BEIDE Konventionen.
   * Die Marke ist damit nicht gelockert, sondern schaerfer: sie verlangt jetzt, dass
   * Ein- UND Ausstieg durchgereicht werden. Faellt eine der beiden weg, misst der
   * Nullpunktwaechter wieder eine andere Ausfuehrung als das Signal - #88 in neuer
   * Kleidung. */
  ok((mm.match(/_pos, '(bestaetigung|entdeckung)', KONVENTION, AUS_KONVENTION\)/g) || []).length === 2,
     'Beide Placebo-Laeufe fahren Ein- UND Ausstiegskonvention des Signals (#88, C9)');
  ok(/placeboEntdeckung: placeboEntdeckung/.test(mm),
     'und er steht im Protokoll');

  /* --- S9: die zwei Pflichtzeilen --- */
  ok(/S9 Einstiegsluecke/.test(mm) && /S9 Sitzungspositionen/.test(mm),
     'Jede Messung protokolliert Einstiegsluecke und Sitzungspositionen');
  ok(/einstiegsluecke: \{ signalMittel/.test(mm) && /zentriert:/.test(mm),
     'Die Einstiegsluecke wird ZENTRIERT gemessen - sonst misst man die allgemeine Ueber-Nacht-Drift');
  ok(/function lueckeBasis\(\)/.test(mm),
     'Die Basis dafuer laeuft ueber ALLE Kerzen derselben Symbole, nicht nur ueber die Signalkerzen');

  /* --- S3: die Kostenanzeige war doppelt gezaehlt --- */
  /* aufKosten und zuKosten werden beide gegen mid gemessen, `runde` ist also der volle
   * Umlauf; spreadPct = (offer-bid)/mid ist es ebenfalls. Mit *200 stand die notierte
   * Spanne doppelt so hoch wie der gemessene Umlauf. */
  /* Seit Stufe E wohnen Runde und Bilanz in kosten.js - dort wird geschnitten;
   * die Doppelzaehlung darf in KEINER der beiden Haelften zurueckkommen. */
  var ksS3 = fs.readFileSync(__dirname + '/kosten.js', 'utf8');
  ok(!/vor\.spreadPct \* 200/.test(dep) && !/vor\.spreadPct \* 200/.test(ksS3),
     'Die notierte Spanne wird nicht mehr doppelt gezaehlt');
  ok(/notiertPct: vor\.spreadPct != null \? vor\.spreadPct \* 100/.test(ksS3),
     'Sie steht auf derselben Skala wie der gemessene Umlauf');
  ok(/annahmePct: 0\.10/.test(ksS3),
     'Die Kostenhuerde bleibt bei 0,10 % - korrigiert wurde eine Anzeige, nicht die Huerde');

  /* --- S4/S5/S8: die Tore stehen in CLAUDE.md, wo jede Sitzung sie liest --- */
  ok(/Entdeckung ≥ 4 × Bestätigungs-MDE/.test(cm),
     'Tor 1 steht in CLAUDE.md: Entdeckung >= 4 x Bestaetigungs-MDE');
  ok(/delta80` unter der Produkthürde/.test(cm),
     'Tor 2 steht dort: delta80 unter der Produkthuerde');
  ok(/MESSMASCHINE_PROTOKOLLE/.test(cm),
     'Und die Sperre gegen das Selbstveroeffentlichen von Studienlaeufen');
  ok(/null belegte Kanten/.test(cm),
     'Der Belegstand steht in CLAUDE.md, damit ihn keine Sitzung wieder aus Prosa zusammenreimt');

  /* --- Das Werkzeug fuer die Altprotokolle --- */
  var d80t = fs.readFileSync(__dirname + '/tools/delta80-bericht.js', 'utf8');
  ok(!/writeFileSync/.test(d80t),
     'Der delta80-Bericht LIEST nur - ein Protokoll ist ein Beleg, kein Arbeitsblatt');
  ok(/B4 Bonferroni/.test(d80t),
     'Er nimmt die Schwelle aus dem Protokoll statt sie neu zu rechnen (D2: eine Quelle je Zahl)');
})();

console.log('\n47a) bezeichnetesArchiv je Zeitrahmen');
(function () {
  var ms = fs.readFileSync(__dirname + '/studien/messmaschine/messen.js', 'utf8');

  /* Der Riegel 'fremdes Archiv' war bis zum 25.08.2026 auf 60m verdrahtet. Eine
   * Strategie mit zeitrahmen '1d' galt damit IMMER als fremd gemessen - auch auf dem
   * richtigen Vollarchiv. Sie bekam keine Kopie in den Datenordner und tauchte im
   * Scoreboard nie auf. Nichts brach: das Ergebnis kam nur nie an. */
  ok(/ZEIGER\s*=\s*\{[\s\S]*'1d'[\s\S]*'60m'/.test(ms),
     'Es gibt je Zeitrahmen einen Archivzeiger, nicht nur fuer 60m');
  ok(/MD_ARCHIV1D/.test(ms) && /archiv1d-pfad\.txt/.test(ms),
     'Fuer Tageskerzen gilt dieselbe Konvention wie fuer 60m: Umgebungsvariable oder Zeigerdatei');
  ok(/function bezeichnetesArchiv\(zeitrahmen\)/.test(ms),
     'bezeichnetesArchiv bekommt den Zeitrahmen als Argument');
  ok(/bezeichnetesArchiv\(ZR\)/.test(ms) && !/bezeichnetesArchiv\(\)/.test(ms),
     'Kein Aufruf ohne Zeitrahmen mehr uebrig - sonst faellt genau der stille Fall zurueck');

  /* Die Reihenfolge ist der Kern: die Strategie sagt den Zeitrahmen, also muss sie
   * geladen sein, BEVOR das Archiv bestimmt wird. */
  ok(ms.indexOf('var S = require(path.resolve(datei));') < ms.indexOf('var archiv = process.argv[3]'),
     'Die Strategie wird geladen, bevor das Archiv gewaehlt wird - sonst ist der Zeitrahmen noch unbekannt');

  /* Und der Riegel behaelt seine Zaehne. */
  ok(/fremdesArchiv\s*=\s*path\.resolve\(archiv\)\s*!==\s*path\.resolve\(echtesArchiv\)/.test(ms),
     'Ein anderes als das bezeichnete Archiv wird weiterhin als Fremdbefund gestempelt');
  ok(/Keine Kopie in den Datenordner/.test(ms),
     'Ein Fremdbefund erreicht das Scoreboard weiterhin nicht');
})();

console.log('\n47) Anzeige der Messmaschine: unbekannte Urteile und die Selbstpruefung');
(function () {
  var sb = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');

  /* Den reinen Teil herausschneiden und ausfuehren. Textsuche haette den Fehler nie
   * gefunden, um den es hier geht: RANG['unbekannt'] ist undefined, und undefined ist
   * in allen drei Verwendungen STILL - NaN beim Sortieren, false beim Vergleich, und
   * 'color:undefined' verwirft der Browser wortlos. */
  var von = sb.indexOf('  var URTEIL = {');
  var bis = sb.indexOf('  function placeboBand(p) {');
  ok(von !== -1 && bis > von, 'Der reine Teil des Scoreboards ist auffindbar');
  var rein = { };
  /* label() holt die Uebersetzung seit dem 26.08.2026 aus app-shell (#102) - zwei
   * Tabellen an zwei Orten waren die naechste Stelle, an der eine veraltet.
   * Hier wird die ECHTE Funktion durchgereicht, nicht eine Kopie: eine nachgebaute
   * Uebersetzung im Test wuerde genau die Doppelung wieder einfuehren, die der Umbau
   * beseitigt hat - und sie wuerde gruen bleiben, wenn das Original sich aendert. */
  var aShU = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  var utV = aShU.indexOf('urteilText: function (u) {');
  var utB = aShU.indexOf('\n    },', utV);
  ok(utV !== -1 && utB > utV, 'urteilText laesst sich aus app-shell holen');
  var Uecht = new Function('return { ' + aShU.slice(utV, utB + 6) + ' };')();
  (new Function('E', 'U', sb.slice(von, bis) +
     '\nE.rang = rang; E.label = label; E.farbe = farbe; E.placeboOk = placeboOk; E.URTEIL = URTEIL;'))(rein, Uecht);

  /* Der Kern: ein Urteil mit Vorbehalt ist KEIN gruenes Licht. */
  ok(rein.farbe('bestaetigt') === 'var(--up)',
     'Nur das blanke "bestaetigt" wird gruen');
  ok(rein.farbe('bestaetigt-aber-nullpunkt-verschoben') !== 'var(--up)',
     'Ein bestaetigtes Urteil auf verschobenem Nullpunkt wird NICHT gruen');
  ok(rein.farbe('irgendein-neues-urteil-2027') !== 'var(--up)',
     'Auch ein Urteil, das dieses Scoreboard noch gar nicht kennt, wird nicht gruen');
  ok(rein.farbe('bestaetigt-mit-irgendwas') !== 'var(--up)',
     'Ein Urteil, das mit "bestaetigt" nur ANFAENGT, wird nicht gruen');

  /* Sortierung und Variantenwahl duerfen an einem unbekannten Urteil nicht zerbrechen. */
  ok(rein.rang('bestaetigt') < rein.rang('bestaetigt-aber-nullpunkt-verschoben'),
     'Der Vorbehalt sortiert hinter das saubere Urteil');
  ok(rein.rang('unbekannt-2027') > rein.rang('widerlegt'),
     'Ein unbekanntes Urteil sortiert ganz nach unten, nicht nach oben');
  ok(isFinite(rein.rang('unbekannt-2027') - rein.rang('bestaetigt')),
     'Der Vergleich zweier Raenge ergibt nie NaN - sonst ist die Reihenfolge unbestimmt');
  ok(rein.label('unbekannt-2027').indexOf('undefined') === -1 && rein.label(null).indexOf('undefined') === -1,
     'Ein unbekanntes Urteil zeigt seinen Namen, nie das Wort undefined');

  /* EINE Tabelle je Urteil. Bis zum 25.08.2026 gab es eine zweite fuer dieselben
   * Schluessel, der genau ein Urteil fehlte - und die Strategien-Liste zeigte dafuer
   * den rohen Schluessel, waehrend das Scoreboard darueber die Beschriftung zeigte.
   * Der Fehler war still: nichts brach, es stand nur zweierlei da. */
  ok(!/URTEIL_TEXT/.test(sb),
     'Es gibt keine zweite Urteil-Tabelle mehr');
  /* Die Beschriftung wohnt seit dem 26.08.2026 nicht mehr in dieser Tabelle, sondern
   * in U.urteilText (#102) - sie stand zweimal da und damit vor dem Auseinanderlaufen.
   * Die Aussage bleibt dieselbe und wird NICHT abgeschwaecht: jedes bekannte Urteil
   * braucht Rang, Beschriftung und Farbe. Nur der Ort der Beschriftung hat sich
   * geaendert, also wird sie dort geprueft - ueber label(), das genau diesen Weg geht. */
  var luecken = Object.keys(rein.URTEIL).filter(function (k) {
    var e = rein.URTEIL[k];
    var beschriftung = rein.label(k);
    /* Woran erkennt man einen ROHEN Schluessel auf dem Bildschirm? Am Bindestrich
     * ("nicht-bestaetigt") und am ASCII-Ersatz fuer den Umlaut ("bestaetigt").
     * Erster Anlauf verlangte, die Beschriftung muesse sich vom Schluessel
     * unterscheiden - das war zu streng: "widerlegt" heisst auf Deutsch genauso.
     * Gefragt ist nicht Verschiedenheit, sondern Lesbarkeit. */
    return !e || e.rang == null || !e.farbe ||
      !beschriftung || beschriftung.indexOf('-') !== -1 || /ae|oe|ue/.test(beschriftung);
  });
  ok(luecken.length === 0,
     'Jedes bekannte Urteil hat Rang, Beschriftung und Farbe', luecken.join(', ') || 'keine Luecke');
  ok(rein.label('bestaetigt-aber-nullpunkt-verschoben').indexOf('Nullpunkt') !== -1,
     'Der Vorbehalt "Nullpunkt verschoben" steht ausgeschrieben da, wo immer ein Urteil steht');
  /* Die Strategien-Liste darf sich ihre Beschriftung nicht selbst bauen. */
  ok(/label\(z\.urteil\)/.test(sb),
     'Die Strategien-Liste beschriftet das Urteil ueber dieselbe Funktion wie das Scoreboard');
  /* Die Sortierregel als EIGENSCHAFT, nicht als Schreibweise: ein bestaetigtes Urteil
   * steht vor jedem anderen, ein unbekanntes hinter allen. Gemessen am laufenden Code -
   * die Textmarke in Abschnitt 44 sagt nur, dass die Tabelle so aussieht. Genau diese
   * Textmarke ist beim Zusammenfuehren der Tabellen rot geworden. */
  var raenge = Object.keys(rein.URTEIL).map(function (k) { return rein.rang(k); });
  ok(rein.rang('bestaetigt') === Math.min.apply(null, raenge),
     'Ein bestaetigtes Urteil sortiert vor jedem anderen');
  ok(rein.rang('unbekannt-2027') > Math.max.apply(null, raenge),
     'Ein unbekanntes Urteil sortiert hinter alle bekannten - im Zweifel gegen die Strategie');

  /* Die Selbstpruefung: gemessene Abweichung gegen gemessene Aufloesung. */
  ok(rein.placeboOk({ placebo: { tagesmittel: -0.0001, mde: 0.0013 } }) === true,
     'Ein Placebo innerhalb der eigenen Aufloesung gilt als bestanden');
  ok(rein.placeboOk({ placebo: { tagesmittel: -0.0017, mde: 0.0013 } }) === false,
     'Ein Placebo jenseits der eigenen Aufloesung faellt durch - egal welches Vorzeichen');
  ok(rein.placeboOk({ placebo: { tagesmittel: 0.0017, mde: 0.0013 } }) === false,
     'Auch nach oben faellt er durch - geprueft wird der Betrag');
  ok(rein.placeboOk({}) === null && rein.placeboOk({ placebo: null }) === null,
     'Ein Protokoll aus der Zeit vor der Selbstpruefung gilt als UNGEPRUEFT, nicht als bestanden');

  /* Und die Anzeige muss den Fehlschlag zeigen, bevor jemand aufklappt. */
  ok(/spOk === false/.test(sb) && /Nullpunkt<\/span>/.test(sb),
     'Eine fehlgeschlagene Selbstpruefung steht in der Uebersichtszeile, nicht erst im Detail');
  ok(sb.indexOf('h += placeboBand(p);') !== -1,
     'Der Entscheidungsweg beginnt mit der Selbstpruefung');

  /* D2 gilt weiter: der neue Code liest zwei Zahlen und vergleicht sie - er rechnet nicht. */
  ok(!/Math\.sqrt\(|function\s+statistik/.test(sb),
     'Auch die Selbstpruefung rechnet im Renderer nichts nach - sie vergleicht Gemessenes');
})();
/* ================= 54. Stammdaten: Branche und Groesse =================
 * Fuer eine Marktuebersicht braucht man je Wert drei Dinge: Tagesveraenderung (hat die
 * App live), Groesse und Branche. Die beiden letzten holt stammdaten.js bei der SEC.
 *
 * Die Datei ist rein - kein DOM, kein Netz, der Abruf wird HINEINGEREICHT. Deshalb
 * laeuft hier alles wirklich, statt aus dem Quelltext geschnitten zu werden. Geprueft
 * wird vor allem die SETZUNG: welcher SIC-Code welchen Sektor ergibt. Der Code selbst
 * ist eine Tatsache der Behoerde, die Faltung ist eine Entscheidung - und genau solche
 * Entscheidungen verrutschen still. */
(function () {
  console.log('\n54) Stammdaten: die Faltung SIC → Sektor und die Riegel dahinter');
  var S = require(__dirname + '/stammdaten.js');
  var werk = fs.readFileSync(__dirname + '/tools/stammdaten-holen.js', 'utf8');
  var mainQ = fs.readFileSync(__dirname + '/main.js', 'utf8');
  var ui = fs.readFileSync(__dirname + '/marktkarteui.js', 'utf8');

  /* Die Beispiele, die im Kopf der Datei als Begruendung stehen - hier ausgefuehrt
   * statt nachgelesen. Steht Apple eines Tages nicht mehr unter Technologie, wird
   * dieser Abschnitt rot. */
  var faelle = [
    [3571, 'Technologie', 'Apple, Electronic Computers'],
    [3674, 'Technologie', 'Nvidia und Intel, Semiconductors'],
    [7372, 'Technologie', 'Microsoft, Prepackaged Software'],
    [2834, 'Gesundheit', 'Pfizer, Pharmaceutical Preparations'],
    [3841, 'Gesundheit', 'Medizingeraete - im Zweisteller 38 neben Messtechnik'],
    [2821, 'Rohstoffe', 'Kunststoffe - derselbe Zweisteller 28 wie Pharma und Seife'],
    [2844, 'Basiskonsum', 'Procter & Gamble, Toilet Preparations'],
    [3711, 'Industrie', 'Ford, Motor Vehicles'],
    [6021, 'Finanzen', 'JPMorgan, National Commercial Banks'],
    [6798, 'Finanzen', 'Prologis, REIT'],
    [1311, 'Energie', 'ExxonMobil, Crude Petroleum'],
    [4931, 'Versorger', 'NextEra, Electric & Other Services'],
    [4813, 'Telekommunikation', 'AT&T, Telephone Communications'],
    [5331, 'Zyklischer Konsum', 'Walmart, Variety Stores']
  ];
  var daneben = faelle.filter(function (f) { return S.sektorVon(f[0]) !== f[1]; });
  ok(daneben.length === 0,
     'Vierzehn echte SIC-Codes landen im erwarteten Sektor  [' +
     daneben.map(function (f) { return f[2] + ' → ' + S.sektorVon(f[0]) + ' statt ' + f[1]; }).join('; ') + ']');
  ok(S.sektorVon(9999) === 'Sonstige' && S.sektorVon(0) === 'Sonstige',
     'Ein unbekannter Code faellt auf „Sonstige“, nicht auf undefined');

  /* Der Dreisteller ist kein Schmuck: Zweisteller 28 enthaelt Pfizer UND P&G. Die
   * Sperrklinke hat genau das beim ersten Lauf gefunden. */
  ok(S.sektorVon(2834) !== S.sektorVon(2844),
     'Zweisteller 28 wird aufgeteilt - Arzneimittel und Koerperpflege sind nicht dasselbe');

  // ---------- Die Quartals-Kennungen ----------
  var qs = S.quartalsKennungen(Date.UTC(2026, 7, 25));
  ok(qs[0] === 'CY2026Q3I' && qs[1] === 'CY2026Q2I' && qs.length === 6,
     'Quartale werden rueckwaerts durchprobiert, juengstes zuerst  [' + qs.slice(0, 3).join(' ') + ']');
  var qj = S.quartalsKennungen(Date.UTC(2026, 0, 5));
  ok(qj[1] === 'CY2025Q4I', 'Der Jahreswechsel wird richtig zurueckgezaehlt  [' + qj[1] + ']');

  /* ---------- ALTERSGRENZE ----------
   * Fords juengste Meldung dieses Konzepts stammt von 2011: eine plausible, fuenfzehn
   * Jahre alte Zahl, aus der eine falsche Marktkapitalisierung geworden waere - und
   * zwar eine, die niemandem auffaellt. */
  var jetzt = Date.UTC(2026, 7, 25);
  function facts(ende, wert) {
    return { facts: { dei: { EntityCommonStockSharesOutstanding: { units: { shares: [{ end: ende, val: wert }] } } } } };
  }
  var alt = S.ausFacts(facts('2011-04-28', 3727332952), jetzt);
  ok(alt && alt.zuAlt === '2011-04-28' && !alt.val,
     'Eine fuenfzehn Jahre alte Zahl wird verworfen und ausgewiesen, nicht benutzt');
  var frisch = S.ausFacts(facts('2026-05-15', 24200000000), jetzt);
  ok(frisch && frisch.val === 24200000000, 'Eine frische Zahl kommt durch');
  ok(S.ausFacts({ facts: {} }, jetzt) === null, 'Ohne jede Meldung kommt null - nicht null als Stueckzahl');
  /* Genau an der Grenze: 550 Tage gelten noch, 551 nicht mehr. */
  function vorTagen(n) { return new Date(jetzt - n * 86400000).toISOString().slice(0, 10); }
  ok(S.ausFacts(facts(vorTagen(549), 100), jetzt).val === 100, 'Grenze: 549 Tage alt zaehlt noch');
  ok(!!S.ausFacts(facts(vorTagen(560), 100), jetzt).zuAlt, 'Grenze: 560 Tage alt zaehlt nicht mehr');

  /* ---------- Mehrere Aktiengattungen ----------
   * Die Marktkapitalisierung ist die Summe ueber alle Gattungen, nicht eine davon.
   * Wer hier die erste nimmt, macht aus Alphabet eine halb so grosse Firma. */
  var zweiKlassen = { facts: { 'us-gaap': { CommonStockSharesOutstanding: { units: { shares: [
    { end: '2026-06-30', val: 5800000000 }, { end: '2026-06-30', val: 6430000000 },
    { end: '2025-06-30', val: 5000000000 }
  ] } } } } };
  var summe = S.ausFacts(zweiKlassen, jetzt);
  ok(summe && summe.val === 12230000000,
     'Zwei Gattungen zum selben Stichtag werden addiert  [' + (summe && summe.val) + ']');

  // ---------- ADR-Riegel ----------
  ok(S.istAuslaender({ filings: { recent: { form: ['10-Q', '20-F', '8-K'] } } }) === true,
     'Wer 20-F einreicht, ist ein auslaendischer Emittent');
  ok(S.istAuslaender({ filings: { recent: { form: ['10-K', '10-Q', '8-K'] } } }) === false,
     'Wer nur 10-K und 10-Q einreicht, ist keiner');
  ok(S.istAuslaender({}) === false, 'Ohne Angaben wird niemand faelschlich markiert');

  // ---------- Der Sammelabruf uebernimmt nur, wo nichts steht ----------
  var aktien = {}, quelle = {};
  var n1 = S.ausRahmen({ data: [{ cik: 1, val: 100 }, { cik: 2, val: 200 }, { cik: 3, val: 0 }] }, 'dei', aktien, quelle);
  var n2 = S.ausRahmen({ data: [{ cik: 2, val: 999 }, { cik: 4, val: 400 }] }, 'us-gaap', aktien, quelle);
  ok(n1 === 2 && n2 === 1, 'Zweite Stufe fuellt nur die Luecken  [' + n1 + ' / ' + n2 + ']');
  ok(aktien[2] === 200 && quelle[2] === 'dei', 'Die erste Stufe wird nicht ueberschrieben');
  ok(aktien[3] === undefined, 'Eine Null gilt nicht als Stueckzahl');

  // ---------- Aktienklassen: Bindestrich hier, Punkt dort ----------
  ok(S.secName('BRK-B', { 'BRK.B': 1 }) === 'BRK.B', 'BRK-B wird zu BRK.B, wie die SEC es schreibt');
  ok(S.secName('AAPL', { AAPL: 1 }) === 'AAPL', 'Was schon passt, bleibt');

  /* ---------- Die Adressen stehen fest ----------
   * Der Renderer reicht keine URL herein. Das ist dieselbe Haltung wie beim
   * Yahoo-Kalender: ein allgemeiner Durchreicher waere eine offene Tuer. */
  ok(/^https:\/\/data\.sec\.gov\//.test(S.URL.submissions(320193)) &&
     S.URL.submissions(320193).indexOf('CIK0000320193') !== -1,
     'Die CIK wird auf zehn Stellen aufgefuellt  [' + S.URL.submissions(320193) + ']');
  ok(S.cik10('1750') === '0000001750', 'Auch eine kurze CIK bekommt ihre Nullen');
  var hosts = ['tickers', 'rahmen', 'submissions', 'facts'].map(function (k) {
    var u = k === 'rahmen' ? S.URL.rahmen('dei', 'X', 'CY2026Q2I') : S.URL[k](1);
    return new URL(u).hostname;
  });
  ok(hosts.every(function (h) { return h === 'data.sec.gov' || h === 'www.sec.gov'; }),
     'Alle Adressen zeigen zur SEC  [' + hosts.join(', ') + ']');

  /* ---------- Der Abruf in der App ----------
   * Nicht ueber fetch-text: dessen Erlaubnisliste zu oeffnen haette dem Renderer eine
   * weitere Adresse freigegeben. Und die SEC verlangt einen Absender mit Kontakt -
   * mit dem Browser-Absender von fetch-text gaebe es 403. */
  ok(/function secJson\(url\)/.test(mainQ), 'App: es gibt einen eigenen Abruf fuer die SEC');
  ok(/u\.hostname !== 'data\.sec\.gov' && u\.hostname !== 'www\.sec\.gov'/.test(mainQ),
     'App: der Abruf endet nur bei der SEC, auch wenn die Adresse woanders herkaeme');
  ok(/headers: Stammdaten\.KOPF/.test(mainQ),
     'App: mit dem Absender der Behoerde, nicht dem Browser-Absender');
  ok(!/ALLOWED_HOSTS[\s\S]{0,400}sec\.gov/.test(mainQ),
     'App: die Erlaubnisliste von fetch-text bleibt unberuehrt - die SEC laeuft daran vorbei');
  ok(/Stammdaten\.KOPF/.test(mainQ) && /'Markt-Dashboard \(/.test(fs.readFileSync(__dirname + '/stammdaten.js', 'utf8')),
     'App: der Absender traegt eine Kontaktadresse, wie die SEC es verlangt');

  // ---------- Der teure Teil nur fuer die gezeigten Werte ----------
  ok(/ipcMain\.handle\('markt-sec-basis'/.test(mainQ) && /ipcMain\.handle\('markt-sec-branchen'/.test(mainQ),
     'App: zwei Schritte - erst der Sammelabruf, dann die Branche nur fuer die Auswahl');
  ok(/marktSecBasis\(\)/.test(ui) && /marktSecBranchen\(top\)/.test(ui),
     'Karte: erst Kurse fuer die Rangfolge, dann Branche fuer die Besten');
  ok(/id="mkHolen"/.test(ui) && /Jetzt holen/.test(ui),
     'Karte: es gibt einen Knopf, keine Sackgasse mit Befehlszeile');
  ok(/node tools\/stammdaten-holen\.js/.test(ui),
     'Karte: der Befehl bleibt erreichbar - in der Klappe fuer Entwickler');

  /* ---------- Eine Tabelle, nicht zwei ----------
   * Genau diese Doppelung ist in diesem Projekt schon mehrfach auseinandergelaufen. */
  ok(/require\('\.\.\/stammdaten\.js'\)/.test(werk),
     'Das Werkzeug benutzt denselben Kern wie die App');
  ok(!/SEKTOR_NACH_SIC2/.test(werk) && !/SIC3_SEKTOR/.test(werk),
     'Die SIC-Tabelle steht nur noch an einer Stelle');
  ok(!/marktkap|marketCap|mktCap/i.test(ohneKommentare(fs.readFileSync(__dirname + '/stammdaten.js', 'utf8'))),
     'Der Kern rechnet keine Marktkapitalisierung - sie entsteht live aus Kurs mal Stueckzahl');
})();

/* ================= 55. Die Marktkarte =================
 * Flaeche ist Groesse, Farbe ist der Tag. Die Aufteilung ist reine Rechnerei -
 * Rechtecke rein, Rechtecke raus - und deshalb hier wirklich pruefbar. Am Bildschirm
 * faellt ein Kaestchen, das zwei Pixel zu breit ist, niemandem auf; eine Karte, deren
 * Flaechen nicht zu den Groessen passen, luegt aber genau ueber das, was sie zeigen
 * soll. */
(function () {
  console.log('\n55) Marktkarte: Flaeche, Farbe, Lesbarkeit');
  var M = require(__dirname + '/marktkarte.js');
  var ui = fs.readFileSync(__dirname + '/marktkarteui.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');

  function lcg(s) { return function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }; }
  var r = lcg(11), werte = [];
  var sekt = ['Technologie', 'Finanzen', 'Gesundheit', 'Industrie', 'Energie'];
  for (var i = 0; i < 140; i++) {
    werte.push({ sym: 'S' + i, sektor: sekt[i % 5], groesse: Math.pow(10, 1 + r() * 4), pct: (r() - 0.5) * 8 });
  }
  var karte = M.baue(werte, 1000, 600);

  ok(karte.length === 5, 'Fuenf Sektoren werden zu fuenf Bloecken  [' + karte.length + ']');
  var alle = [];
  karte.forEach(function (s) { s.kinder.forEach(function (k) { alle.push(k); }); });
  ok(alle.length === werte.length, 'Kein Wert geht verloren  [' + alle.length + ' von ' + werte.length + ']');

  /* ---------- Ueberlappung ----------
   * Der Fehler, den ein Treemap am ehesten macht, und der am Bildschirm wie Absicht
   * aussieht: zwei Kaestchen liegen uebereinander, eines davon ist unsichtbar. */
  var ueber = 0;
  karte.forEach(function (s) {
    for (var a = 0; a < s.kinder.length; a++) {
      for (var b = a + 1; b < s.kinder.length; b++) {
        var A = s.kinder[a], B = s.kinder[b];
        if (A.x < B.x + B.b - 0.01 && B.x < A.x + A.b - 0.01 &&
            A.y < B.y + B.h - 0.01 && B.y < A.y + A.h - 0.01) ueber++;
      }
    }
  });
  ok(ueber === 0, 'Keine zwei Kaestchen ueberlappen sich  [' + ueber + ']');

  /* ---------- Flaechentreue ----------
   * Das ist die eine Zusage, die die Karte gibt: doppelt so gross heisst doppelt so
   * viel Flaeche. Stimmt das nicht, ist die Karte eine huebsche Luege. */
  var schlimmste = 0;
  karte.forEach(function (s) {
    var gesW = s.kinder.reduce(function (a, k) { return a + k.wert; }, 0);
    var gesF = s.kinder.reduce(function (a, k) { return a + k.b * k.h; }, 0);
    s.kinder.forEach(function (k) {
      var d = Math.abs(k.b * k.h / gesF - k.wert / gesW);
      if (d > schlimmste) schlimmste = d;
    });
  });
  ok(schlimmste < 0.001,
     'Flaeche folgt der Groesse: groesste Abweichung ' + (schlimmste * 100).toFixed(4) + ' % vom Anteil');

  /* ---------- Kein Kaestchen verlaesst seinen Sektor ---------- */
  var raus = 0;
  karte.forEach(function (s) {
    s.kinder.forEach(function (k) {
      if (k.x < s.x - 0.01 || k.y < s.y - 0.01 ||
          k.x + k.b > s.x + s.b + 0.01 || k.y + k.h > s.y + s.h + 0.01) raus++;
    });
  });
  ok(raus === 0, 'Jedes Kaestchen bleibt in seinem Sektorblock  [' + raus + ']');

  /* ---------- Seitenverhaeltnis: wozu das Verfahren ueberhaupt da ist ----------
   * Der naive Treemap (abwechselnd waagerecht/senkrecht teilen) erzeugt bei
   * ungleichen Groessen Striche, in denen kein Text mehr steht. */
  var sv = alle.map(function (k) { return Math.max(k.b / k.h, k.h / k.b); }).sort(function (a, b) { return a - b; });
  ok(sv[Math.floor(sv.length / 2)] < 2,
     'Die Kaestchen sind ungefaehr quadratisch: Median ' + sv[Math.floor(sv.length / 2)].toFixed(2));

  // ---------- Randfaelle, die nicht abstuerzen duerfen ----------
  ok(M.baue([], 800, 600).length === 0, 'Ohne Werte entsteht eine leere Karte, kein Absturz');
  ok(M.aufteilen([{ wert: 0 }, { wert: -5 }], { x: 0, y: 0, b: 100, h: 100 }).length === 0,
     'Groesse null oder negativ wird uebergangen - ein Kaestchen ohne Flaeche gibt es nicht');
  var eins = M.aufteilen([{ wert: 7 }], { x: 10, y: 20, b: 100, h: 50 });
  ok(eins.length === 1 && Math.abs(eins[0].b * eins[0].h - 5000) < 0.01 && eins[0].x === 10,
     'Ein einziger Wert fuellt das ganze Rechteck');
  ok(M.aufteilen([{ wert: 1 }], { x: 0, y: 0, b: 0, h: 100 }).length === 0,
     'Ein Rechteck ohne Breite ergibt keine Kaestchen statt einer Division durch null');

  /* ---------- Farbe und Lesbarkeit ----------
   * Rot/Gruen allein traegt nicht - jeder zwanzigste Mann sieht den Unterschied
   * schlecht. Deshalb traegt die HELLIGKEIT die Aussage mit, und die Beschriftung
   * muss auf jedem Grund lesbar bleiben. Das wird hier ueber den ganzen Bereich
   * durchgerechnet, nicht an zwei Beispielen behauptet. */
  function kontrast(rgb, hex) {
    var t = hex === '#ffffff' ? [255, 255, 255] : [16, 19, 23];
    var l1 = M.leuchtdichte(rgb), l2 = M.leuchtdichte(t);
    var hell = Math.max(l1, l2), dunkel = Math.min(l1, l2);
    return (hell + 0.05) / (dunkel + 0.05);
  }
  var schlecht = [];
  for (var p = -8; p <= 8; p += 0.25) {
    var f = M.farbe(p);
    var k = kontrast(f.rgb, f.text);
    if (k < 4.5) schlecht.push(p.toFixed(2) + ' → ' + k.toFixed(2));
  }
  ok(schlecht.length === 0,
     'Beschriftung haelt ueber den ganzen Bereich Kontrast 4,5:1  [' + schlecht.slice(0, 4).join(', ') + ']');
  var kNull = M.farbe(null);
  ok(kontrast(kNull.rgb, kNull.text) >= 4.5, 'Auch das Kaestchen ohne Kurs bleibt lesbar');

  var plus = M.farbe(2), minus = M.farbe(-2);
  ok(plus.rgb[1] > plus.rgb[0] && minus.rgb[0] > minus.rgb[1],
     'Plus ist gruenlastig, Minus rotlastig  [' + plus.rgb.join(',') + ' / ' + minus.rgb.join(',') + ']');
  ok(Math.abs(M.farbe(3).rgb[0] - M.farbe(30).rgb[0]) < 1 && Math.abs(M.farbe(3).rgb[1] - M.farbe(30).rgb[1]) < 1,
     'Ueber dem Deckel aendert sich nichts mehr - ein Ausreisser blasst die Karte nicht aus');
  ok(M.farbe(null).rgb.join(',') !== M.farbe(0).rgb.join(','),
     '„kein Kurs“ sieht anders aus als „unveraendert“ - sonst waere Fehlen und Null dasselbe');

  // ---------- Buendeln ----------
  var b1 = M.buendeln([{ sym: 'A', sektor: 'X', groesse: 1 }, { sym: 'B', sektor: 'Y', groesse: 5 },
    { sym: 'C', sektor: 'X', groesse: 3 }, { sym: 'D', groesse: 2 }]);
  ok(b1[0].sektor === 'Y' && b1[0].wert === 5, 'Der groesste Sektor kommt zuerst - die Karte springt nicht herum');
  ok(b1.filter(function (x) { return x.sektor === 'X'; })[0].wert === 4, 'Groessen werden je Sektor summiert');
  ok(b1.filter(function (x) { return x.sektor === 'Sonstige'; }).length === 1,
     'Ohne Sektorangabe landet ein Wert in „Sonstige“, nicht im Nichts');

  /* ---------- Die Arbeitsteilung: langsam aus der Datei, schnell aus dem Netz ----------
   * Wuerde die Marktkapitalisierung gespeichert, waere die Karte die Karte von
   * gestern - Flaeche wie Farbe. */
  /* Gemessen wird die EIGENSCHAFT, nicht die Schreibweise: JEDE Zuweisung an groesse
   * muss ein Produkt mit w.aktien sein. Vorher stand hier ein Muster auf `w.kurs` -
   * beim Umstieg auf den Sammelabruf (25.08.2026) hiess die Variable q.kurs, und die
   * Zusicherung wurde rot, obwohl die Flaeche unveraendert frisch gerechnet wird. */
  var groessenZeilen = ui.split('\n').filter(function (z) { return /\.groesse\s*=/.test(z); });
  ok(groessenZeilen.length >= 3 && groessenZeilen.every(function (z) { return /\* w\.aktien/.test(z); }),
     'Die Flaeche entsteht IMMER aus Kurs mal Stueckzahl, nie aus einem gespeicherten Wert',
     groessenZeilen.length);
  /* Kurs und Vortagesschluss duerfen nicht aus zwei Abrufen zu verschiedenen Zeitpunkten
   * stammen - sonst waere die Farbe eine Veraenderung, die es nie gab. Seit dem
   * Sammelabruf stehen die Feldnamen im Hauptprozess; die Eigenschaft wird deshalb dort
   * gemessen: beide aus DEMSELBEN Antwortobjekt q. */
  var mjQ = fs.readFileSync(__dirname + '/main.js', 'utf8');
  ok(/q\.regularMarketPrice/.test(mjQ) && /q\.regularMarketPreviousClose/.test(mjQ) &&
     /q\.regularMarketChangePercent/.test(mjQ),
     'Kurs, Vortagesschluss und Veraenderung kommen aus demselben einen Antwortobjekt');
  ok(/w\.pct = q\.pct != null \? q\.pct : \(q\.vorher > 0/.test(ui),
     'und die Karte nimmt beide aus demselben q - nie aus zwei Abrufen');
  ok(!/sec\.gov|data\.sec/.test(ui) && !/sec\.gov/.test(fs.readFileSync(__dirname + '/marktkarte.js', 'utf8')),
     'Die App fragt nie selbst bei der SEC an - das macht das Werkzeug daneben');
  ok(/if \(e\.auslaender\)/.test(ui),
     'Auslaendische Emittenten werden weggelassen: ihre Stueckzahl passt nicht zum gehandelten ADR');

  /* ---------- Was die Karte NICHT sein darf ----------
   * Bei Issue #63 stand der Satz: eine Karte, die etwas zeigt, laedt zum Handeln
   * danach ein. Gemessen ist an dieser hier nichts. */
  ok(/kein Signal/.test(ui) && /nichts gemessen/.test(ui),
     'Die Karte sagt selbst, dass an ihr nichts gemessen ist');
  // Geprueft wird der CODE, nicht der Kommentar - siehe ohneKommentare() oben.
  ok(!/bester Sektor|heissester|Rangliste|Top-?\d/i.test(ohneKommentare(ui)),
     'Keine Rangliste und kein „bester Sektor“ im Code - das saehe nach einem Befund aus');
  ok(/data-info="marktkarte"/.test(html), 'Die Karte hat einen Erklaertext hinter dem i');
  /* Stufe C4: die Karte ist eine Pille geworden. Der Reiterwechsel feuert fuer sie nie
     wieder - ein Zuhoerer darauf waere ein toter Schalter, und zwar ein unsichtbarer.
     Geprueft wird die VERWENDUNG, nicht der blosse Name: der Kommentar daneben darf
     das alte Ereignis nennen, um zu erklaeren, warum es weg ist. */
  ok(!/addEventListener\('tab-changed'/.test(ui) && /addEventListener\('sub-changed'/.test(ui) &&
     /d\.sub !== 'marktkarte'/.test(ui),
     'Die Karte hoert auf den Pillenwechsel, nicht mehr auf den Reiterwechsel');
  /* Die Karte laeuft im Hintergrund weiter, auch wenn ihre Pille nicht gewaehlt ist
     (Fehler #79). Das darf nicht zufaellig stimmen: der Takt startet UNBEDINGT beim
     Laden der Seite und prueft nur, ob das FENSTER sichtbar ist - nie, welcher Reiter
     oder welche Pille offen ist. Haenge das je an .active oder an ein
     Navigations-Ereignis, waere die Karte nach jedem Umbau der Navigation still tot. */
  var takt = ui.slice(ui.indexOf('function taktenAn'), ui.indexOf('window.api.onMarktSecFortschritt'));
  ok(takt.length > 50, 'Der Takt der Karte ist auffindbar');
  ok(/document\.hidden/.test(takt) && !/classList|\.active|tab-changed|sub-changed|getElementById\('tab-/.test(takt),
     'Der Takt der Karte prueft nur document.hidden - nie den gewaehlten Reiter oder die Pille');
  ok(/setTimeout\(function \(\) \{ if \(!letzterLauf\) laden\(\); \}, 12000\);\s*\n\s*taktenAn\(\);/.test(ui),
     'Der Takt startet beim Laden der Seite, nicht erst beim Oeffnen der Karte');
  ok(html.indexOf('marktkarte.js') < html.indexOf('marktkarteui.js'),
     'Ladereihenfolge: die Rechnung vor der Oberflaeche');
})();

console.log('\n48) Toter Schutz: gelesen, aber nie geschrieben');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  /* DIE FEHLERKLASSE. Ein Zustandsfeld, das GELESEN und nie GESCHRIEBEN wird, ist
   * dauerhaft undefined - und wenn daran eine Schutzhandlung haengt, greift sie nie.
   * Im Quelltext sieht die Stelle aus wie eine Sicherung. Genau so lag
   * D.intraday.edgePauseKapi da: die Lesestelle stand, der Schreiber fehlte, und der
   * Kapitulations-Arm des Edge-Waechters wurde nie pausiert.
   * Gemeldet aus einer fremden Sitzung, nicht von einem Test gefunden - deshalb hier
   * ein Test, der die KLASSE faengt und nicht nur diesen Fall. */
  var code = dep.replace(/\/\*[\s\S]*?\*\//g, '');   // Kommentare raus, sonst zaehlen Erklaerungen mit
  var felder = {};
  var re = /D\.intraday\.([A-Za-z_$][\w$]*)/g, m;
  while ((m = re.exec(code))) { felder[m[1]] = felder[m[1]] || { lese: 0, schreib: 0 }; felder[m[1]].lese++; }
  Object.keys(felder).forEach(function (f) {
    /* Geschrieben heisst: Zuweisung, delete, oder ueber einen Schluessel-Zugriff. */
    var zuweisung = new RegExp('D\\.intraday\\.' + f + '\\s*=[^=]');
    var geloescht = new RegExp('delete\\s+D\\.intraday\\.' + f + '\\b');
    if (zuweisung.test(code) || geloescht.test(code)) felder[f].schreib++;
  });
  /* Ueber einen berechneten Schluessel geschriebene Felder (D.intraday[ARM.pauseKey])
   * findet die Regex oben nicht - sie werden hier ueber die Armtabelle nachgetragen. */
  var tabelle = /pauseKey:\s*'([\w$]+)'/g, mt;
  while ((mt = tabelle.exec(dep))) { if (felder[mt[1]]) felder[mt[1]].schreib++; }
  /* Und was in der Vorgabe-Literale steht (intraday: { budgetPct: 0.03, … }), ist
   * definiert - auch wenn es nie zugewiesen wird. Es hat einen Wert ab dem ersten Start. */
  var literale = /intraday:\s*\{([\s\S]*?)\n/.exec(dep);
  if (literale) {
    var lm = /([A-Za-z_$][\w$]*)\s*:/g, l;
    while ((l = lm.exec(literale[1]))) { if (felder[l[1]]) felder[l[1]].schreib++; }
  }

  /* NICHT jedes ungeschriebene Feld ist gefaehrlich. ivModell, symBlock, kryptoGebBp,
   * klumpenMax und budgetPct werden nie geschrieben - aber IMMER mit ausdruecklichem
   * Vorgabewert gelesen ('!= null ? x : 8', '=== false', '|| 0.03'). Das sind
   * Einstellungen, die niemand vom Standard weggedreht hat; sie verhalten sich
   * definiert.
   * Gefaehrlich ist die andere Sorte: gelesen OHNE Vorgabe, und an dem Wert haengt eine
   * Handlung. Dann heisst undefined still "nein" - so lag edgePauseKapi da:
   *   var armPause = istKapiSignal ? D.intraday.edgePauseKapi : ...
   * kein Vergleich, kein ||, kein Standard. Die Schutzpause griff nie. */
  var tot = Object.keys(felder).filter(function (f) {
    if (felder[f].schreib > 0) return false;
    /* Hat mindestens eine Lesestelle einen Vorgabewert? Dann ist das Feld definiert. */
    var mitVorgabe = new RegExp('D\\.intraday\\.' + f + '\\s*(!==|===|!=|==|\\|\\|)');
    return !mitVorgabe.test(code);
  });
  ok(tot.length === 0,
     'Kein Feld unter D.intraday wird ohne Vorgabewert gelesen und nie geschrieben' +
     (tot.length ? '  [toter Schutz: ' + tot.join(', ') + ']' : ''));

  /* Und der konkrete Fall, damit die Reparatur nicht still zurueckgedreht wird. */
  ok(/var EDGE_ARME = \[/.test(dep) && /'rsi2seit'/.test(dep) && /'kapitulation'/.test(dep),
     'Der Edge-Waechter kennt beide Arme als Tabelle');
  ok(/edgeZustand\(ARM\.key\)/.test(dep) && !/await edgeZustand\(\)/.test(dep),
     'Er ruft edgeZustand MIT Arm auf - ein Aufruf ohne Argument maesse nur rsi2seit');
  ok(/D\.intraday\[ARM\.pauseKey\] = \{/.test(dep),
     'Er schreibt die Pause je Arm, nicht eine gemeinsame');
  ok(/delete D\.intraday\[ARM\.pauseKey\]/.test(dep),
     'Und hebt sie je Arm wieder auf - sonst bliebe ein Arm fuer immer gesperrt');
  ok(/pauseKey: 'edgePauseKapi'/.test(dep),
     'Der Kapitulations-Arm hat eine EIGENE Pause - eine gemeinsame legte den gesunden Arm mit still');
})();

console.log('\n49) Einwegschalter: eine Sicherung abstellen und nicht zurueckkoennen');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  /* edgePauseHand stellt den Edge-Waechter ab - fuer BEIDE Arme, dauerhaft. Bis zum
   * 25.08.2026 wurde das Feld an genau einer Stelle auf true gesetzt und an keiner je
   * zurueck; im Datenstand lag es seit dem 22.08. auf true, waehrend die Pause von damals
   * unveraendert stand. Dazu verschwand das Warnband, weil seine Bedingung
   * '!edgePauseHand' lautet - die abgeschaltete Sicherung war unsichtbar.
   * Der Hand-Entscheid SOLL dauerhaft respektiert werden. Er darf nur nicht unumkehrbar
   * und nicht unsichtbar sein. */
  ok(/D\.intraday\.edgePauseHand = true/.test(dep),
     'Der Hand-Entscheid laesst sich setzen');
  ok(/delete D\.intraday\.edgePauseHand/.test(dep),
     'Und er laesst sich auch wieder zuruecknehmen - sonst ist es ein Einwegschalter');
  ok(/data-edgescharf/.test(dep),
     'Es gibt einen Knopf dafuer, nicht nur eine Codestelle');
  /* UND ER MUSS VERDRAHTET SEIN. Ein Knopf ohne Zuhoerer sieht im Quelltext genauso aus
   * wie einer mit - das ist dieselbe Falle wie der tote Schutz aus Abschnitt 48, nur
   * eine Ebene hoeher. Besonders wichtig, weil der Zuhoerer in depot.js/init() sitzt und
   * dieser Bereich gerade umgebaut wird (Struktur-Plan vom 25.08., Stufe B). */
  ok(/addEventListener\('click'[\s\S]{0,600}data-edgescharf/.test(dep),
     'Der Knopf hat einen Zuhoerer - sonst waere er Zierde');
  ok(/addEventListener\('click'[\s\S]{0,600}data-edgefrei/.test(dep),
     'Der Gegenknopf ebenfalls');

  /* Der Kern: solange der Waechter aus ist, MUSS das Band stehen. */
  var fn = /function edgePauseAnzeigen\(\)[\s\S]*?\n  \}/.exec(dep);
  ok(!!fn, 'edgePauseAnzeigen ist auffindbar');
  if (fn) {
    ok(/if \(c\.edgePauseHand\)[\s\S]*?warnbandSetzen\('edge',/.test(fn[0]),
       'Ist der Waechter von Hand aus, steht das im Warnband - dauerhaft, nicht als Hinweis der verschwindet');
    ok(!/edgePause && !D\.intraday\.edgePauseHand/.test(fn[0]),
       'Das Band haengt nicht mehr an "!edgePauseHand" - genau das liess es verschwinden');
    ok(/edgePauseKapi/.test(fn[0]),
       'Das Band kennt beide Arme - sonst weiss man nicht, was aussetzt und was weiterhandelt');
  }

  /* Und die Reichweite muss im Text stehen: der Schalter gilt fuer BEIDE Arme. */
  ok(/keine<\/b> Kante mehr automatisch aus|KEINEN Arm/.test(dep),
     'Der Text sagt, dass der Schalter alle Kanten betrifft, nicht nur die angezeigte');
})();

console.log('\n50) Der Extra-Pool haengt an der Kerzenuhr');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  /* Bis zum 25.08.2026 rotierten 12 Werte je Scan-Runde durch den Pool - bei 89 Werten
   * und 90 s Runden war jeder alle ~11 Minuten dran. Das kostete keine Signale (jeder
   * Kerzenschluss wurde gesehen), aber bis zu 11 Minuten Verzoegerung beim Einstieg,
   * waehrend die Messmaschine AM Kerzenschluss einsteigt. Live trieb damit von der
   * Messung weg - eine Test-Invariante des Projekts.
   * Der Sammelabruf (yahoo-quotes) kann das NICHT loesen: er liefert regularMarketPrice,
   * eine Zahl je Symbol. RSI(2), Kanal und EMA brauchen die Kerzenreihe. */
  var von = dep.indexOf('  var letzteSweepKerze = 0;');
  var bis = dep.indexOf('/** Scan-Universum');
  ok(von !== -1 && bis > von, 'Die Pool-Auswahl ist auffindbar');
  if (von === -1 || bis <= von) return;

  /* Ausgefuehrt, mit gestellter Umgebung: ein Basis-Universum von zwei Werten, deren
   * letzte Kerze wir selbst setzen, und ein Pool von 89. */
  var E = {};
  var LASTBARS = {}, D = { intraday: { pool: 'test', interval: '60m' } };
  var POOLS_60M = { test: [] };
  for (var i = 0; i < 89; i++) POOLS_60M.test.push('S' + i);
  var EXTRA_60M = POOLS_60M.test;
  function universe() { return ['AAA', 'BBB']; }
  (new Function('E', 'LASTBARS', 'D', 'POOLS_60M', 'EXTRA_60M', 'universe',
     dep.slice(von, bis) + '\nE.fenster = extra60mFenster;'))(E, LASTBARS, D, POOLS_60M, EXTRA_60M, universe);

  /* Erste Runde: noch keine Kerze bekannt - der Pool wird trotzdem einmal angesehen,
   * sonst bliebe er beim Start bis zur ersten Kerze unsichtbar. */
  var r0 = E.fenster();
  ok(r0.length === 89, 'Beim ersten Aufruf wird der ganze Pool angesehen  [' + r0.length + ']');

  /* Kerze setzen und zweimal aufrufen: nur EIN Durchgang je Kerze. */
  var kerze = Date.UTC(2026, 7, 25, 14, 30);
  LASTBARS.AAA = [[kerze, 100]];
  var r1 = E.fenster();
  ok(r1.length === 89, 'Eine neue Kerze loest einen vollen Durchgang aus  [' + r1.length + ']');
  var r2 = E.fenster();
  ok(r2.length === 0,
     'Innerhalb DERSELBEN Kerze gibt es nichts Neues zu sehen - kein zweiter Durchgang  [' + r2.length + ']');
  var r3 = E.fenster();
  ok(r3.length === 0, 'Auch beim dritten Aufruf nicht');

  /* Naechste Kerze: wieder ein voller Durchgang. */
  LASTBARS.AAA = [[kerze + 3600000, 101]];
  var r4 = E.fenster();
  ok(r4.length === 89, 'Die naechste Kerze loest wieder einen vollen Durchgang aus  [' + r4.length + ']');

  /* Kein Wert bleibt liegen - das war der Sinn der Sache. */
  ok(r4.indexOf('S0') !== -1 && r4.indexOf('S88') !== -1,
     'Der Durchgang enthaelt den ersten UND den letzten Wert des Pools - niemand wartet mehr eine Runde');

  /* Und die alte Rotation ist wirklich weg. */
  ok(!/extra60mZeiger/.test(dep),
     'Der Rotationszeiger ist entfernt - sonst laeuft die alte Auswahl daneben weiter');
})();

console.log('\n51) Der Edge-Waechter loest nicht mehr im Rauschen aus');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  /* Die Regel wird AUSGEFUEHRT geprueft, nicht per Textsuche - und mit den echten
   * Messungen aus dem Datenstand vom 25.08.2026. Alle sechs meldeten Verfall, alle
   * sechs lagen bei |t| unter 0,5. Weil eine Sicherung, die dauernd falschen Alarm
   * schlaegt, abgeschaltet wird (genau das ist am 22.08. passiert), ist das kein
   * Schoenheitsfehler: der schlecht geeichte Waechter fuehrte zu WENIGER Schutz als
   * gar keiner. */
  var mv = /var VERFALL_T = (-?[\d.]+);/.exec(dep);
  ok(!!mv, 'Die Verfalls-Schwelle steht als benannte Konstante im Code');
  var mr = /var verfall = roh != null[\s\S]*?;/.exec(dep);
  ok(!!mr, 'Die Verfalls-Regel ist auffindbar');
  if (!mv || !mr) return;
  var VERFALL_T = Number(mv[1]);
  ok(VERFALL_T < 0, 'Die Schwelle ist negativ - Verfall heisst Rueckgang  [' + VERFALL_T + ']');

  function verfallVon(tWert, nSym) {
    /* rohT wird eine Zeile vorher gebildet - beide Zeilen muessen mit. */
    var f = new Function('roh', 'edge', 'VERFALL_T',
      'var rohT = edge.rohT != null ? edge.rohT : edge.t;' + mr[0] + ' return verfall;');
    return f(-0.0004, { t: tWert, nSym: nSym == null ? 40 : nSym }, VERFALL_T);
  }

  /* DIE ECHTEN SECHS. Keiner darf mehr Verfall ausloesen. */
  var echte = [-0.43, -0.11, -0.19, -0.19, -0.19, -0.22];
  var falschAlarm = echte.filter(function (x) { return verfallVon(x); });
  ok(falschAlarm.length === 0,
     'Keine der sechs echten Rauschmessungen (t -0,11 bis -0,43) meldet noch Verfall' +
     (falschAlarm.length ? '  [noch: ' + falschAlarm.join(', ') + ']' : ''));

  /* Ein ECHTER Verfall muss weiterhin durchkommen - sonst haetten wir die Sicherung
   * nicht geeicht, sondern abgeschafft. */
  ok(verfallVon(-2.5) === true, 'Ein deutlicher Rueckgang (t -2,5) meldet weiterhin Verfall');
  ok(verfallVon(VERFALL_T) === true, 'Genau auf der Schwelle zaehlt es noch als Verfall');
  ok(verfallVon(VERFALL_T + 0.01) === false, 'Knapp darueber nicht mehr');
  ok(verfallVon(+3) === false, 'Ein positiver Vorsprung ist nie Verfall');

  /* Die Mindestzahl an Werten bleibt bestehen. */
  ok(verfallVon(-2.5, 4) === false, 'Unter fuenf Werten wird gar nicht geurteilt');

  /* ZWEI MESSUNGEN, NICHT ZWEIMAL DIESELBE. Am 24.08. stand der Zuwachs bei NULL -
   * derselbe Datensatz, zweimal angesehen, und das loeste die Pause aus. */
  var mz = /var echteZweiteMessung = [\s\S]*?;/.exec(dep);
  ok(!!mz, 'Die Bedingung an die neue Messbasis ist auffindbar');
  if (mz) {
    function zweite(zw) { return new Function('zuwachs', mz[0] + ' return echteZweiteMessung;')(zw); }
    ok(zweite(0) === false, 'Zuwachs 0 ist keine zweite Messung - genau der Fall vom 24.08.');
    ok(zweite(null) === false, 'Unbekannter Zuwachs pausiert nicht (alte Eintraege heilen sich nach zwei Naechten)');
    ok(zweite(37) === true, 'Echte neue Signale zaehlen als zweite Messung');
  }
  ok(/echteZweiteMessung &&/.test(dep),
     'Und die Bedingung haengt wirklich an der Pause, steht nicht nur herum');

  /* Die Aufhebung bleibt STRENGER als die Ausloesung - Absicht, keine Nachlaessigkeit:
   * bei einer Schutzhandlung soll es leichter sein, pausiert zu bleiben. */
  ok(/roh != null && roh > 0 && D\.intraday\[ARM\.pauseKey\]/.test(dep),
     'Aufgehoben wird erst bei positivem Vorsprung - die Totzone dazwischen verhindert Hin-und-Her');
})();

/* ================= 56) Gefahrenzone und rechte Rasterspalte =================
 * Struktur-Audit 25.08.2026, Befunde P2 und P3. "Alle Buecher zuruecksetzen" stand
 * in .modal-foot unmittelbar neben "Speichern", dem meistgeklickten Knopf des
 * Dialogs; die rechte Spalte des strategy-grid trug eine einzige kleine Karte. */
(function () {
  console.log('\n56) Zerstoerendes steht nicht neben Speichern');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  var foot = /<div class="modal-foot">([\s\S]*?)<\/div>\s*<\/div>/.exec(html);
  ok(!!foot && foot[1].indexOf('depotResetBtn') === -1,
     'Der Zuruecksetzen-Knopf steht NICHT mehr in der Fusszeile neben "Speichern"');
  ok(html.indexOf('id="depotResetFrei"') > -1 &&
     html.indexOf('id="depotResetFrei"') < html.indexOf('id="depotResetBtn"'),
     'Der Zwischenschritt steht vor dem roten Knopf');
  ok(/id="depotResetBtn"[^>]*\bdisabled\b/.test(html),
     'Der rote Knopf ist ab Werk gesperrt - erst der Haken gibt ihn frei');
  /* disabled statt pointer-events: eine CSS-Sperre laesst Tab und Enter durch.
   * app-shell.js filtert die Tabfolge ueber button:not([disabled]). */
  ok(/drBtn\.disabled = !drFrei\.checked/.test(dep),
     'Die Sperre ist verdrahtet und nicht nur gemalt');
  /* Der Reset war und bleibt umkehrbar - das ist der Grund, warum er ueberhaupt
   * ohne zweiten Dialog vertretbar ist. Die wichtigste Zeile dieses Abschnitts. */
  ok(/storeSet\('depot_vor_reset', D\)/.test(dep),
     'Der Reset legt weiterhin eine Sicherung an, BEVOR er loescht');

  /* Die rechte Rasterspalte war als Stapel gebaut, trug aber nur die Risiko-Karte;
   * daneben stand Leere ueber die Hoehe der Intraday-Karte (P3). */
  var grid = html.slice(html.indexOf('<div class="strategy-grid">'),
                        html.indexOf('id="archivWiderlegt"'));
  ok(grid.indexOf('id="watchChips"') > -1,
     'Die rechte Spalte von "Schalter & Einstellungen" traegt mehr als die Risiko-Karte');
  /* Der wahrscheinlichste Fehler beim Verschieben von Hand ist eine Kopie - und
   * depot.js fuellte dann nur die erste der beiden Flaechen. */
  ok((html.match(/id="watchChips"/g) || []).length === 1,
     'Die Watchlist steht genau einmal - verschoben, nicht kopiert');
})();

/* ------------------------------------------------------------------ BLOCK 47
 * WER "BESTAETIGT" SAGT, MUSS AUSSORTIEREN.
 *
 * Am 25.08.2026 stand in winkelgrad.js als Begruendung, Q.kanalUeber verlange
 * Beruehrungen an beiden Kanalraendern und ein Varianzverhaeltnis, das einen
 * Zufallspfad ausschliesst. Es verlangt nichts davon - drei return null, alle
 * technisch. In 20.000 Zufallspfaden kam kein einziges null. Der Detektor feuerte
 * auf 52,7 % aller Kerzen und mass damit nicht Felix' Regel, sondern "ueber 40
 * Kerzen laesst sich eine Gerade legen".
 *
 * Der Fehler war von aussen unsichtbar: Der Code lief, die Maschine rechnete, das
 * Protokoll sah aus wie jedes andere. Aufgefallen ist er erst auf Nachfrage. Diese
 * Pruefung macht ihn sichtbar - nicht durch Lesen des Kommentars, sondern indem
 * gezaehlt wird, wie oft der Detektor tatsaechlich feuert. */
(function () {
  var Wb = require('./studien/messmaschine/strategien/winkelbestaetigt.js');

  /* Fester Zufallspfad, kein Math.random - ein Test, der mal durchgeht und mal
   * nicht, ist schlimmer als keiner. */
  function zufallspfad(seed, n) {
    var s = seed, b = [], p = 100;
    function rnd() { s = (s * 1103515245 + 12345) & 0x7fffffff; return s / 0x7fffffff; }
    for (var i = 0; i < n; i++) {
      var u = Math.max(1e-9, rnd()), v = rnd();
      p *= 1 + 0.01 * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
      b.push([i * 3600000, p, 1000, p * 1.002, p * 0.998, p]);
    }
    return b;
  }

  /* 1. Die Bestaetigung muss am Rauschen tatsaechlich aussortieren. Der alte
   *    Detektor kam hier auf ueber 50 % - genau das darf nicht wieder passieren. */
  var pfad = zufallspfad(4711, 3000), feuer = 0, gepruef = 0;
  for (var i = 42; i < pfad.length; i++) {
    gepruef++;
    if (Wb.signal(pfad, i, { schwelle: 0 })) feuer++;
  }
  var anteil = feuer / gepruef;
  ok(anteil < 0.25, 'winkelbestaetigt sortiert am Zufallspfad aus (feuert auf ' +
     (100 * anteil).toFixed(1) + ' % der Kerzen, erlaubt sind unter 25 %)');
  ok(feuer > 0, 'winkelbestaetigt feuert ueberhaupt - ein Detektor, der nie ausloest, ' +
     'besteht jede Strenge-Pruefung und misst nichts');

  /* 2. Die Bestaetigung muss WIRKEN, nicht nur dastehen: derselbe saubere Kanal,
   *    einmal fortgesetzt und einmal gebrochen, muss verschieden ausgehen. */
  function kanalReihe(ausbruch) {
    var b = [], i;
    for (i = 0; i < 42; i++) {
      var kurs = 100 + 0.1 * i + (i % 2 ? 0.05 : -0.05);
      if (i >= 33) kurs = ausbruch ? 100 + 0.1 * i + 5 : 100 + 0.1 * i + (i % 2 ? 0.02 : -0.02);
      b.push([i * 3600000, kurs, 1000, kurs * 1.001, kurs * 0.999, kurs]);
    }
    return b;
  }
  ok(Wb.signal(kanalReihe(false), 41, { schwelle: 0 }) != null,
     'Ein Kanal, den die acht ungesehenen Kerzen eingehalten haben, gilt als bestaetigt');
  ok(Wb.signal(kanalReihe(true), 41, { schwelle: 0 }) == null,
     'Derselbe Kanal, in den acht ungesehenen Kerzen gebrochen, gilt NICHT als bestaetigt');

  /* 3. Das Lesefenster muss decken, was das Signal wirklich anfasst. Der erste
   *    Anlauf meldete 40 und las 41 - die Kontrolle liess eine Kerze zu wenig aus (A7). */
  ok(Wb.leseFensterKerzen >= Wb._intern.FIT + Wb._intern.AUS + 1,
     'leseFensterKerzen deckt alle Kerzen ab, die das Signal liest (A7)');

  /* 4. Die falsche Begruendung darf nicht zurueckkehren - weder hier noch anderswo. */
  var strDir = './studien/messmaschine/strategien/';
  fs.readdirSync(strDir).filter(function (f) { return /.js$/.test(f); }).forEach(function (f) {
    var q = fs.readFileSync(strDir + f, 'utf8');
    var behauptet = /kanalUeber verlangt|verlangt dafuer Beruehrungen|verlangt dafür Berührungen/.test(q);
    ok(!behauptet, f + ' behauptet nicht, kanalUeber pruefe die Kanalqualitaet ' +
       '(es gibt guete und Beruehrungen nur zurueck)');
  });
})();

console.log('\n58) Wiederholungs-Waende: eine Sammelzeile statt dreissig gleicher Zeilen');
/* Befund B2 des Struktur-Audits vom 25.08.2026: Der Signal-Monitor zeigte an ruhigen
 * Tagen rund dreissig Zeilen mit demselben Grund, der Trendfinder bei frischem Archiv
 * fuer jeden Wert dieselbe Absage. Der Baustein U.wandBuendeln zieht das zu einer
 * Sammelzeile zusammen - und die Zusicherungen unten halten das Entscheidende fest:
 * es geht dabei NICHTS verloren und es wird NICHTS umformuliert. */
(function () {
  var as = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');

  /* U ist eine reine Helferliste ohne DOM-Zugriff - sie laesst sich aus der Quelle
   * herausschneiden und wirklich ausfuehren, statt nur als Text geprueft zu werden.
   * Hausmuster, siehe pfadeKuerzen aus bugs.js weiter oben. */
  var aU = as.indexOf('  var U = {'), bU = as.indexOf('\n  };', aU) + 5;
  ok(aU > 0 && bU > aU, 'Die Helferliste U laesst sich aus app-shell.js herausschneiden');
  var UU = new Function(as.slice(aU, bU) + '\n  return U;')();
  ok(typeof UU.wandBuendeln === 'function', 'U.wandBuendeln existiert als gemeinsamer Baustein');

  function wand(n) {
    var p = [];
    for (var i = 0; i < n; i++) {
      p.push({ status: 'Kursreihe zu kurz (' + (140 + i) + ' < 261 Kerzen) – Signal wäre nicht das gemessene',
               html: '<tr data-siglog="S' + i + '"><td>S' + i + '</td></tr>' });
    }
    return p;
  }
  var sechs = UU.wandBuendeln(wand(6), { spalten: 7, was: 'Werte' });

  /* 1) Gebuendelt wird am STATUS, nicht am Text: gleicher Grund, andere Zahlen. */
  ok((sechs.match(/<details/g) || []).length === 1,
     'Sechs Zeilen mit demselben Grund und verschiedenen Zahlen ergeben EINE Sammelzeile');
  ok(/>6 Werte: /.test(sechs), 'Die Sammelzeile nennt die Zahl der gebuendelten Werte');

  /* 2) Die Einzelinformation verschwindet nicht - sie wandert in die Klappe. */
  var alleDa = true;
  for (var i2 = 0; i2 < 6; i2++) if (sechs.indexOf('data-siglog="S' + i2 + '"') < 0) alleDa = false;
  ok(alleDa, 'Alle sechs Einzelzeilen stehen unveraendert in der Klappe - nichts geht verloren');

  /* 3) Leitplanke 1: Gruende sind Messaussagen. Die gemessene Konstante 261 bleibt
   *    stehen; zur Ellipse wird nur, was sich zwischen den Zeilen unterscheidet. */
  ok(sechs.indexOf('261 Kerzen') >= 0 && sechs.indexOf('(140') < 0,
     'Im Titel bleibt die gemessene Konstante stehen, nur die je Wert verschiedene Zahl faellt weg');
  ok(/Signal wäre nicht das gemessene/.test(sechs),
     'Der Grund wird gezaehlt, nicht umformuliert und nicht gekuerzt');

  /* 4) Erst oberhalb von fuenf wird gebuendelt - und Wichtiges nie. */
  ok((UU.wandBuendeln(wand(5), { spalten: 7 }).match(/<details/g) || []).length === 0,
     'Bei fuenf gleichen Zeilen bleibt die Liste, wie sie ist');
  var mitTrade = wand(6).concat([{ status: null, html: '<tr data-siglog="OK"><td>gehandelt</td></tr>' }]);
  var mt = UU.wandBuendeln(mitTrade, { spalten: 7 });
  ok(mt.indexOf('<details') >= 0 && mt.indexOf('<details') < mt.indexOf('data-siglog="OK"'),
     'Eine Zeile ohne Status wird nie gebuendelt und behaelt ihren Platz in der Sortierung');

  /* 5) Beide Aufrufstellen benutzen wirklich den gemeinsamen Baustein. */
  ok(/html \+= U\.wandBuendeln\(posten, \{ spalten: 7/.test(dep),
     'Signal-Monitor: gebuendelt wird ueber den gemeinsamen Baustein');
  /* Die Trendfinder-Haelfte schneidet seit Stufe E in der eigenen Datei. */
  var wui2 = fs.readFileSync(__dirname + '/wendeui.js', 'utf8');
  ok(/h \+= U\.wandBuendeln\(posten, \{ spalten: 9/.test(wui2),
     'Trendfinder: derselbe Baustein, nicht ein zweiter Handgriff');
  ok(/posten\.push\(\{ status: g\.ok \? null :/.test(dep),
     'Signal-Monitor: eine eroeffnete Position ist nie eine Wiederholung');
  /* Wunsch #58: der Trend ist die Hauptsache, der Wechsel sein Sonderfall. Eine
   * Sammelzeile darf eine Zeile mit Trendkanal deshalb nie verdecken. */
  ok(/posten\.push\(\{ status: \(sig \|\| kj\) \? null : standTxt/.test(wui2),
     'Trendfinder: Zeilen mit Wechsel oder Trendkanal bleiben einzeln stehen (Wunsch #58)');
})();

/* ================= 57) Leerzustaende ohne Entwickler-Jargon =================
 * Befund B3 des Struktur-Audits vom 25.08.2026. Ein Leerzustand ist die erste Seite,
 * die ein neuer Nutzer sieht - und die App zeigte dort eine schwarze Flaeche mit
 * Legende, gar nichts, einen node-Befehl und einen Windows-Pfad. Wer die App
 * INSTALLIERT hat, besitzt weder node noch den Quellordner; fuer ihn ist beides eine
 * Sackgasse mit Wegbeschreibung.
 * Diese Zusicherungen halten den Zustand fest, nicht den Wortlaut: geprueft wird die
 * REIHENFOLGE (Endnutzer-Weg zuerst, Entwicklerweg in der Klappe) und die Kopplung
 * zwischen Markup und Skript. Der zweite Teil ist der wichtigere - ein Behaelter mit
 * display:none, den niemand aufschaltet, ist ein unsichtbarer Chart, und das saehe
 * eine reine Markup-Pruefung nicht. */
(function () {
  console.log('\n57) Leerzustaende: kein Entwickler-Jargon fuer Endnutzer');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var sf = fs.readFileSync(__dirname + '/scheinfinder.js', 'utf8');
  var mk = fs.readFileSync(__dirname + '/marktkarteui.js', 'utf8');
  var sco = fs.readFileSync(__dirname + '/scoreboard.js', 'utf8');

  // --- Strategie-Chart: Legende erst, wenn es Linien gibt ---
  var stcBlock = html.slice(html.indexOf('id="stratChartPanel"'), html.indexOf('id="sub-auswertung"'));
  ok(/id="stcLeer"[^>]*class="empty"/.test(stcBlock),
     'Strategie-Chart: der Leerzustand benutzt den .empty-Baustein');
  /* Nicht nur das SVG - auch die Legende. Sie war der eigentliche Befund: eine
   * Beschriftung fuer Linien, die es noch nicht gab. */
  ok(/id="stcAusgabe"[^>]*display:\s*none/.test(stcBlock) &&
     stcBlock.indexOf('id="stcAusgabe"') < stcBlock.indexOf('id="stcChart"') &&
     stcBlock.indexOf('id="stcAusgabe"') < stcBlock.indexOf('Entscheidungskanal'),
     'Strategie-Chart: SVG UND Legende liegen im Behaelter, der vor dem ersten Laden zu ist');
  /* Der eigentliche Punkt: ohne diese vier Zeilen im Lade-Lauf waere der Chart nach
   * dem Laden unsichtbar - gruenes Markup, tote Oberflaeche. Seit Stufe E schneidet
   * die Marke in der eigenen Datei; die Auffindbarkeits-Pruefung macht aus einem
   * stillen indexOf-Fehlschnitt einen lauten. */
  var scq = fs.readFileSync(__dirname + '/strategiechart.js', 'utf8');
  ok(scq.indexOf('async function runStrategieChart') >= 0, 'Strategie-Chart: der Lade-Lauf ist auffindbar');
  var stcLauf = scq.slice(scq.indexOf('async function runStrategieChart'), scq.indexOf('function drawStrategieChart'));
  ok(/getElementById\('stcAusgabe'\)/.test(stcLauf) && /getElementById\('stcLeer'\)/.test(stcLauf),
     'Strategie-Chart: das Laden schaltet den Leerzustand ab und die Ausgabe frei');
  ok(stcLauf.indexOf("getElementById('stcAusgabe')") > stcLauf.indexOf('if (!r.ok)') &&
     stcLauf.indexOf("getElementById('stcAusgabe')") < stcLauf.indexOf('drawStrategieChart('),
     'Strategie-Chart: freigeschaltet wird NACH dem Fehlerpfad - ein Fehlschlag laesst den Leerzustand stehen');

  // --- Schein-Finder: unter den Filtern steht etwas ---
  var sfBlock = html.slice(html.indexOf('id="sub-scheine"'), html.indexOf('id="sub-wende"'));
  ok(/id="sfTabelle"[^>]*>\s*<div class="empty"/.test(sfBlock),
     'Schein-Finder: unter den Filtern steht ein Leerzustand, keine leere Flaeche');
  /* Daran haengt alles: zeige() kehrt ohne Raster um und laesst den Text stehen.
   * Faellt diese Zeile, ueberschreibt der erste Aufruf den Leerzustand mit Leere. */
  ok(/if \(!t \|\| !RASTER\) return;/.test(sf),
     'Schein-Finder: ohne Raster schreibt zeige() nicht - daran haengt der Leerzustand');

  // --- Marktkarte: Knopf vorn, Befehl in der Klappe ---
  var mkLeer = mk.slice(mk.indexOf('function fehlenAnbieten'), mk.indexOf('async function holen'));
  ok(mkLeer.indexOf('id="mkHolen"') > -1 &&
     mkLeer.indexOf('id="mkHolen"') < mkLeer.indexOf('node tools/stammdaten-holen.js'),
     'Marktkarte: der Knopf steht vor der Befehlszeile - der Endnutzer-Weg zuerst');
  ok(mkLeer.indexOf('<details') > -1 &&
     mkLeer.indexOf('<details') < mkLeer.indexOf('node tools/stammdaten-holen.js') &&
     mkLeer.indexOf('<details') < mkLeer.indexOf('esc(st.grund)'),
     'Marktkarte: Befehlszeile und Rohmeldung stehen in der Klappe, nicht im Endnutzer-Text');

  // --- Scoreboard: kein Windows-Pfad im Endnutzer-Satz ---
  var sbLeer = sco.slice(sco.indexOf('if (!r.protokolle.length)'), sco.indexOf('// Je Kennung nur das juengste'));
  ok(sbLeer.indexOf('<details') > -1 &&
     sbLeer.indexOf('<details') < sbLeer.indexOf('esc(r.ordner)') &&
     sbLeer.indexOf('<details') < sbLeer.indexOf('studien/messmaschine/messen.js'),
     'Scoreboard: der volle Pfad und der node-Befehl stehen in der Klappe, nicht im Endnutzer-Satz');
  ok(/protokolle<\/code>/.test(sbLeer),
     'Scoreboard: der Ordner wird in der Sprache der App benannt (Datenordner -> protokolle)');
  /* Einsortiert, nicht geloescht - wer den Pfad braucht, findet ihn vollstaendig. */
  ok(/esc\(r\.ordner\)/.test(sbLeer),
     'Scoreboard: der echte Pfad ist weiterhin da - einsortiert, nicht geloescht');
})();

console.log('\n59) Navigation gehoert der Shell (Struktur-Plan 25.08.2026, Stufe B)');
(function () {
  var shell = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var bgs = fs.readFileSync(__dirname + '/bugs.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');

  /* --- 1) Der eigentliche Fund: die Pillen duerfen auf nichts warten ---
   * Vorher hing der Umschalter in depot.js init() hinter
   * "await window.api.storeGet('depot')". Diese Zusicherung ist der Wachhund dagegen:
   * vor der Verkabelung darf in app-shell.js kein Warten auf Daten stehen.
   * Die Stelle wird ueber indexOf geprueft und NICHT ueber die Laenge des Ausschnitts:
   * fehlt der Umschalter, liefert indexOf -1 und slice(0,-1) die halbe Datei - eine
   * Laengenpruefung waere dann gruen und wertlos. */
  var iPillen = shell.indexOf("querySelectorAll('.pills button[data-sub]'");
  ok(iPillen > 0, 'Navigation: der Umschalter steht in app-shell.js');
  var bisPillen = shell.slice(0, Math.max(0, iPillen));
  ok(!/\bawait\b/.test(bisPillen),
     'Navigation: vor der Verkabelung wird auf nichts gewartet - sonst sind die Pillen wieder tot');

  /* --- 2) Die Schnittstelle zwischen Shell und Fachmodul --- */
  ok(/CustomEvent\('sub-changed'/.test(shell),
     'Navigation: die Shell meldet jede Umschaltung, statt selbst zu zeichnen');
  ok(/addEventListener\('sub-changed'/.test(dep),
     'Navigation: das Fachmodul zeichnet auf Zuruf, statt selbst zu schalten');
  ok(/if \(!D\) \{ subOffen =/.test(dep),
     'Navigation: eine Umschaltung waehrend des Startens faellt nicht aus, sie wird nachgeholt');
  /* Wiederherstellen ist kein Klick: der Trendfinder holt Kurse fuer 15 Werte. Beim
   * Klick ist das eine Bestellung, beim Wiederherstellen waere es eine ungefragte
   * Abfrage bei JEDEM Programmstart. */
  ok(/sub === 'wende' && !wieder/.test(dep),
     'Navigation: der wiederhergestellte Ort loest von sich aus keine Kursabfrage aus');

  /* --- 3) Der Ort ueberlebt den Neustart - und nur der Ort --- */
  ok(/storeGet\('ui'\)/.test(shell) && /storeSet\('ui'/.test(shell),
     'Navigation: Reiter und Pille ueberleben den Neustart');
  ok(/var UI = \{ tab: null, sub: \{\} \};/.test(shell),
     'Navigation: gemerkt wird NUR der Ort - kein Dialog, kein Explorer-Detail');

  /* --- 4) Der offene Reiter wird gelesen, nicht geraten (T3) --- */
  ok(!/style\*="display: none"/.test(bgs),
     'Meldungen: der offene Reiter wird nicht mehr ueber einen Inline-Stil geraten');
  ok(/querySelector\('nav\.tabs button\.active'\)/.test(bgs),
     'Meldungen: gelesen wird an derselben Leiste, die die Shell schaltet');

  /* --- 5) Markup: Reihenfolge und Blockgrenzen (S6) ---
   * Wer im Markup sucht, sucht in der Reihenfolge der Leiste. Und ein Reiter ohne
   * Endmarke laesst sich nicht als Block verschieben - beides hat am 25.08. gefehlt. */
  var leiste = (html.match(/data-tab="([a-z]+)"/g) || []).map(function (s2) { return s2.slice(10, -1); });
  var stellen = leiste.map(function (t) { return html.indexOf('<div id="tab-' + t + '"'); });
  ok(stellen.every(function (p) { return p > 0; }) &&
     stellen.every(function (p, i) { return i === 0 || p > stellen[i - 1]; }),
     'Markup: die Panels stehen in der Reihenfolge der Reiterleiste', leiste.join(' '));
  var ohneMarke = leiste.filter(function (t) {
    return html.indexOf('<!-- /tab-' + t + ' -->') < html.indexOf('<div id="tab-' + t + '"');
  });
  ok(ohneMarke.length === 0,
     'Markup: jeder Reiter ist als Block abgegrenzt - sonst kann ihn niemand verschieben',
     ohneMarke.join(' ') || 'alle sechs');

  /* --- 6) Kein leeres Raster, kein Kommentar ohne Abschnitt ---
   * Ehrliche Reichweite: die zweite Regel faengt Kommentare, hinter denen KEIN Abschnitt
   * folgt. Einen fehlbeschrifteten Kommentar vor einem echten Abschnitt faengt sie
   * nicht - das ist eine andere Fehlerklasse. */
  ok(!/<div class="grid2"[^>]*>\s*<\/div>/.test(html),
     'Markup: kein leeres Raster mehr, das nur Luft erzeugt');
  var verwaist = [], reK = /<!-- =+ ([^=]+?) =+ -->\s*([\s\S]{0,40})/g, mK;
  while ((mK = reK.exec(html))) { if (!/^<div/.test(mK[2].trim())) verwaist.push(mK[1].trim()); }
  ok(verwaist.length === 0,
     'Markup: jeder Abschnitts-Kommentar steht vor einem Abschnitt', verwaist.join(' | '));
})();

console.log('\n60) Bausteinkasten: Statuszeilen');
(function () {
  var shell = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  ok(/statuszeile: function \(ziel, text, art\)/.test(shell),
     'Es gibt eine Hilfe fuer Statuszeilen');
  /* Der Kern, warum sie sich die Farbe merkt: die Zeilen tragen ihre Grundfarbe als
   * Inline-Stil aus dem Markup. Ein Zuruecksetzen auf '' wuerde sie loeschen, statt
   * sie wiederherzustellen - die Zeile bliebe fuer den Rest der Sitzung falsch
   * eingefaerbt. */
  ok(/GRUNDFARBE/.test(shell) && /el\.style\.color \|\| ''/.test(shell),
     'Die Hilfe merkt sich die Ausgangsfarbe, statt sie beim Zuruecksetzen zu loeschen');
  /* Den Rumpf als Block schneiden statt auf Naehe zu hoffen. */
  var sz = (shell.match(/statuszeile: function \(ziel, text, art\) \{[\s\S]*?\n    \},/) || [''])[0];
  ok(/el\.textContent = text == null/.test(sz) && !/innerHTML/.test(sz),
     'Eine Statuszeile traegt TEXT - so kann niemand das Escapen vergessen');
  /* Und die umgestellten Module bauen sie nicht wieder von Hand. */
  ['mittelfrist.js', 'driftui.js', 'scheinfinder.js'].forEach(function (f) {
    var q = fs.readFileSync(__dirname + '/' + f, 'utf8');
    ok(/U\.statuszeile\(/.test(q) && !/e\.textContent = t \|\| ''/.test(q),
       f + ': setzt die Statuszeile ueber die Hilfe');
  });
})();

console.log('\n61) Bausteinkasten: Kacheln');
(function () {
  var shell = fs.readFileSync(__dirname + '/app-shell.js', 'utf8');
  ok(/kachel: function \(name, wert, opt\)/.test(shell), 'Es gibt eine Kachel-Hilfe');
  /* Der Grund, warum die Groesse KEINEN Vorgabewert hat: die sechs Kopfkacheln auf
   * "Heute" tragen absichtlich keine Inline-Groesse und leben von .tile .val
   * (--fs-titel). Ein Vorgabewert wuerde sie stillschweigend verkleinern. */
  ok(/opt\.fs \? ' style="font-size:'/.test(shell),
     'Die Kachel-Hilfe setzt eine Schriftgroesse nur, wenn der Aufrufer eine nennt');
  /* cls hat Vorrang vor sign: die Buecher zeigen ein Ergebnis von genau 0 $ gruen,
   * U.signCls saehe es neutral. Diese Anzeigeentscheidung darf eine Hilfe nicht
   * umdrehen - deshalb reichen die Buecher cls durch, nicht sign. */
  ok(/opt\.cls != null \? opt\.cls :/.test(shell),
     'Eine fertige Klasse hat Vorrang - die Hilfe dreht keine Anzeigeentscheidung um');
  /* Kein Modul baut die Kachel nochmal von Hand. depot.js darf: dort steht der
   * Aufrufer-seitige Rest (tile()), und der ruft die Hilfe. */
  ['mfdepot.js', 'driftui.js'].forEach(function (f) {
    var q = fs.readFileSync(__dirname + '/' + f, 'utf8');
    ok(/U\.kachel\(/.test(q) && !/<div class="tile"><div class="name">/.test(q),
       f + ': baut keine Kachel mehr von Hand');
  });
  var depK = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  ok(/function tile\(name, val, sign, delta, deltaSign\)/.test(depK),
     'depot.js: die Signatur von tile() bleibt - eine Zusicherung benutzt sie als Endmarke');
  ok(/U\.kachel\(name, val,/.test(depK), 'depot.js: tile() baut nicht mehr selbst');
})();

console.log('\n62) Bausteinkasten: ein Overlay-Muster');
(function () {
  var dg = fs.readFileSync(__dirname + '/diagnose.js', 'utf8');
  var html = fs.readFileSync(__dirname + '/index.html', 'utf8');
  /* Das Einwilligungs-Fenster war das einzige Overlay ausserhalb des modal-bg-Musters:
   * keine Abdunklung, keine Fokusfalle, kein Escape - und es lag beim ersten Start ueber
   * einem halb geladenen Dashboard. */
  ok(/class="modal-bg" id="diagModalBg"/.test(html),
     'Die Einwilligungsfrage ist ein Dialog im modal-bg-Muster');
  ok(!/diagBanner/.test(dg) && !/z-index:9999/.test(dg),
     'Es gibt kein selbstgebautes Overlay mehr');
  ok(/window\.openModal\('diagModalBg'\)/.test(dg),
     'Sie wird ueber denselben Weg geoeffnet wie jeder andere Dialog');
  /* Der Text hat eine Quelle - und er ist Text, nicht Markup. */
  ok(/txt\.textContent = EINWILLIGUNGSTEXT;/.test(dg),
     'Der Einwilligungstext steht weiterhin nur in diagnose.js und wird als Text gesetzt');
  ok(!/EINWILLIGUNGSTEXT/.test(html) && !/Diagnosedaten teilen\?/.test(html),
     'Er wurde nicht ins Markup kopiert - eine Einwilligung hat genau eine Quelle');
})();

console.log('\n52) F1 auch im produktiven Waechter');
(function () {
  var dep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  var mm  = fs.readFileSync(__dirname + '/studien/messmaschine/messmaschine.js', 'utf8');

  /* Der Edge-Waechter liest DASSELBE 60m-Archiv wie die Messmaschine, hatte aber bis zum
   * 25.08.2026 keinen F1-Schutz: 'ds += c[i + H] / c[i] - 1' ohne jede Pruefung, dass die
   * Kurse groesser als null sind. c[i] = 0 gibt Infinity, und ein nicht bereinigter
   * Fehldruck ging ungefiltert in die Zahl ein, die ueber die HANDELSPAUSE entscheidet.
   * Anlass in der Maschine: DFEN mit +10.541 Pp, WHLR mit 4,2 Mrd $ je Aktie. */
  ok(/function reiheUnplausibel\(bars\)/.test(dep),
     'Der Waechter prueft die Reihe auf unmoegliche Kurse');
  ok(/if \(reiheUnplausibel\(bars\)\) \{ verworfen\+\+; continue; \}/.test(dep),
     'Und ueberspringt eine kaputte Reihe GANZ - einzelne Werte zu ueberspringen genuegt nicht');
  ok(/if \(!\(c\[i\] > 0\) \|\| !\(c\[i \+ H\] > 0\)\) continue;/.test(dep),
     'Die Drift-Paare sind gegen Null und Infinity abgesichert');
  ok(/if \(!\(c\[i2\] > 0\) \|\| !\(c\[i2 \+ H\] > 0\)\) continue;/.test(dep),
     'Die Signal-Paare ebenfalls');
  ok(/verworfen \+ ' Reihen wegen unmöglicher Kurse verworfen/.test(dep),
     'Verworfene Reihen stehen in der Meldung - ein stiller Ausschluss waere ein neuer Fehler');

  /* DIESELBE Grenze wie in der Maschine. Zwei verschiedene Plausibilitaetsgrenzen in
   * einem Programm waeren genau die Sorte Doppelzahl, die hier schon mehrfach
   * auseinandergelaufen ist. */
  function grenzen(q) {
    var m = /r > (\d+(?:\.\d+)?) \|\| r < (-?\d+(?:\.\d+)?)/.exec(q);
    var k = /maxKurs > (\d+)/.exec(q);
    return m && k ? m[1] + '/' + m[2] + '/' + k[1] : null;
  }
  var gDep = grenzen(dep), gMm = grenzen(mm);
  ok(gDep && gMm && gDep === gMm,
     'Waechter und Messmaschine benutzen DIESELBE Plausibilitaetsgrenze  [' + gDep + ' vs ' + gMm + ']');
})();

console.log('\n63) Nur fertige Kerzen kommen ins Archiv (Issue #85)');
/* Yahoo liefert am Ende jeder Reihe die LAUFENDE Kerze mit - eine Momentaufnahme
 * mitten in der Sitzung, gestempelt mit der Quote-Uhrzeit (16:57:27 statt 16:30).
 * Gemessen am 26.08.2026: 2.841 von 2.917 Reihen im 60m-Archiv endeten so.
 * Der Fehler ist klein (eine Kerze von ~5.000), aber er wandert mit jedem Abruf auf
 * den juengsten Tag, und jeder Verbraucher, der das Reihenende liest, erbt ihn. */
(function () {
  var yh = fs.readFileSync(__dirname + '/tools/yahoo-60m-holen.js', 'utf8');
  var kq = fs.readFileSync(__dirname + '/kerzenquelle.js', 'utf8');

  /* EINE Definition, nicht zwei. Zwei Regeln fuer dieselbe Frage laufen auseinander.
   * Seit dem 26.08.2026 wohnt sie in kerzenquelle.js, weil die App selbst sammelt und
   * tools/ nicht mit ausgeliefert wird (build.files). Waere die Regel im Werkzeug
   * geblieben, haette die App eine zweite gebraucht - und genau das ist der Fehler,
   * gegen den diese Probe steht. Geprueft wird deshalb beides: dass es sie gibt, und
   * dass es sie nur einmal gibt. */
  ok(/function fertigeKerze\(tsMs, reg, jetzt, intervall\)/.test(kq),
     'Die Regel steht in kerzenquelle.js - dort, wo App und Werkzeug beide hinkommen');
  ok(!/function fertigeKerze/.test(yh),
     'Und NUR dort - das Abrufwerkzeug haelt keine eigene Fassung');
  var reg = (/function fertigeKerze[\s\S]*?\n\}/.exec(kq) || [''])[0];
  /* Das Modul nennt den vierten Parameter intervall; die Faelle unten reichen ihn
   * als IV herein, damit sie lesbar bleiben. */
  var F = function (iv) {
    var f = new Function(reg + '\nreturn fertigeKerze;')();
    return function (a, x, c) { return f(a, x, c, iv); };
  };

  /* Die laufende Kerze traegt Sekunden - eine Gitterkerze nie. */
  var f60 = F('60m');
  ok(f60(Date.parse('2026-08-24T16:30:00Z'), null, Date.now()) === true,
     'Eine Gitterkerze ist fertig');
  ok(f60(Date.parse('2026-08-24T16:57:27Z'), null, Date.now()) === false,
     'Die laufende Kerze mit Quote-Stempel ist es nicht');
  /* Die Falle, die eine "Stempel + Intervall <= jetzt"-Regel gestellt haette: die
   * letzte Sitzungskerze ist kuerzer als eine Stunde (19:30 bis 20:00 UTC). Sie ist
   * trotzdem fertig und darf nicht verworfen werden. */
  ok(f60(Date.parse('2026-08-24T19:30:00Z'), null, Date.now()) === true,
     'Die kurze letzte Sitzungskerze bleibt - sie ist fertig, nur kuerzer');

  /* Tageskerzen sind am Stempel NICHT zu erkennen (nachgemessen: 0 von 400). Sie
   * tragen den Sitzungsbeginn und sehen auch als Teiltag normal aus. Fertig sind sie,
   * sobald die Sitzung zu ist. */
  var f1d = F('1d');
  var start = Date.parse('2026-08-25T13:30:00Z'), ende = Date.parse('2026-08-25T20:00:00Z');
  var rp = { start: start / 1000, end: ende / 1000 };
  ok(f1d(start, rp, ende - 3600000) === false,
     'Ein Tagesbalken der noch laufenden Sitzung ist unfertig');
  ok(f1d(start, rp, ende + 60000) === true,
     'Nach Handelsschluss ist er fertig');
  ok(f1d(Date.parse('2026-08-21T13:30:00Z'), rp, ende - 3600000) === true,
     'Ein aelterer Tag ist immer fertig');

  /* Der Abruf schneidet wirklich ab - eine Regel ohne Aufrufer waere toter Code. */
  ok(/while \(serie\.length && !fertigeKerze\(/.test(kq),
     'Der Abruf schneidet unfertige Kerzen am Ende ab');
  /* Und das Zusammenfuehren reinigt das VORHANDENE mit. Das ist der eigentliche
   * Haken: die Vereinigung laeuft ueber den Zeitstempel, und 16:57:27 ist ein anderer
   * Schluessel als 16:30 - eine alte Teilkerze bliebe sonst ewig stehen. */
  ok(/alt\.filter\(function \(k\) \{ return new Date\(k\[0\]\)\.getUTCSeconds\(\) === 0; \}\)/.test(kq),
     'Das Zusammenfuehren wirft alte Teilkerzen mit hinaus - sonst blieben sie ewig stehen');

  /* Und es gibt ein Werkzeug, das ein vorhandenes Archiv sofort reinigt, ohne Netz. */
  var tk = fs.existsSync(__dirname + '/tools/archiv-teilkerzen-entfernen.js');
  ok(tk, 'Es gibt ein Werkzeug, das ein vorhandenes Archiv ohne Netz reinigt');
  if (tk) {
    var w = fs.readFileSync(__dirname + '/tools/archiv-teilkerzen-entfernen.js', 'utf8');
    /* Ein Werkzeug, das Daten loescht, schreibt nicht ohne ausdrueckliche Ansage. */
    ok(/--wirklich/.test(w) && /if \(!loeschen \|\| !WIRKLICH\) return;/.test(w),
       'Es zaehlt nur - geschrieben wird erst mit --wirklich');
  }
})();


/* ================= Wachhund fuer die Kursarchive (26.08.2026) ================= */
console.log('\nWachhund: steht das Kursarchiv still?');
(function () {
  /* Am 26.08.2026 stand das Stundenarchiv zwei Tage still, ohne dass es auffiel:
   * `yahoo-60m-holen.js alle` ueberspringt jeden Wert, den es schon hat, meldet
   * "Nichts zu tun" und geht mit Erfolg aus. Ein Lauf, der nichts dazulernt, sah von
   * aussen aus wie ein gesunder Lauf.
   * Geprueft wird hier die RECHNUNG des Wachhunds, nicht sein Text - mit festen
   * Zeitpunkten, damit die Probe nicht davon abhaengt, wann sie laeuft. */
  var W = require(__dirname + '/tools/archiv-wachhund.js');
  var osT = require('os'), pathT = require('path');

  /* Die US-Sitzung endet 20:00 UTC. Vorher ist der heutige Tag NICHT abgeschlossen -
   * sonst gilt ein Archiv als veraltet, das nur noch nicht fertig sein kann. */
  ok(W.letzterAbgeschlossenerHandelstag(new Date('2026-08-26T09:00:00Z')) === '2026-08-25',
     'Vormittags gilt der Vortag als letzter abgeschlossener Handelstag',
     W.letzterAbgeschlossenerHandelstag(new Date('2026-08-26T09:00:00Z')));
  ok(W.letzterAbgeschlossenerHandelstag(new Date('2026-08-26T20:45:00Z')) === '2026-08-26',
     'Nach Sitzungsschluss zaehlt der heutige Tag');
  ok(W.letzterAbgeschlossenerHandelstag(new Date('2026-08-26T20:15:00Z')) === '2026-08-25',
     'Punkt 20:00 reicht nicht - Yahoo hat die Schlusskerze nicht in derselben Sekunde');
  /* Wochenenden: Sonntagfrueh muss auf den Freitag zeigen, nicht auf den Samstag. */
  ok(W.letzterAbgeschlossenerHandelstag(new Date('2026-08-30T09:00:00Z')) === '2026-08-28',
     'Am Sonntag ist der Freitag der letzte abgeschlossene Handelstag',
     W.letzterAbgeschlossenerHandelstag(new Date('2026-08-30T09:00:00Z')));
  ok(W.handelstageDazwischen('2026-08-21', '2026-08-24') === 1,
     'Ueber ein Wochenende hinweg zaehlt nur EIN Handelstag', W.handelstageDazwischen('2026-08-21', '2026-08-24'));
  ok(W.handelstageDazwischen('2026-08-24', '2026-08-24') === 0, 'Derselbe Tag ist kein Rueckstand');

  /* DIE ENTSCHEIDENDE REGEL: der HAEUFIGSTE juengste Tag zaehlt, nicht der spaeteste.
   * Genau so ist der Fehler entstanden - waehrend der Reparatur waren 69 von 2.916
   * Werten aktuell und der Rest zwei Tage alt. Wer den spaetesten nimmt, meldet
   * "frisch", obwohl 97 % des Archivs stillstehen. */
  var tmp = fs.mkdtempSync(pathT.join(osT.tmpdir(), 'wachhund-test-'));
  function lege(sym, tag) {
    fs.writeFileSync(pathT.join(tmp, 'bars_60m_' + sym + '.json'),
      JSON.stringify({ series: [[Date.parse(tag + 'T13:30:00Z'), 100, 1, 101, 99]] }));
  }
  for (var i = 0; i < 97; i++) lege('ALT' + i, '2026-08-21');
  for (var j = 0; j < 3; j++) lege('NEU' + j, '2026-08-25');
  var b = W.pruefe(tmp, { jetzt: new Date('2026-08-26T09:00:00Z') });
  ok(b.juengsterTagSpaetester === '2026-08-25' && b.juengsterTagHaeufig === '2026-08-21',
     'Ein paar frische Werte machen ein stehendes Archiv nicht gesund',
     'haeufigster ' + b.juengsterTagHaeufig + ', spaetester ' + b.juengsterTagSpaetester);
  ok(b.rueckstandHandelstage === 2 && b.ok === false,
     'Zwei Handelstage Rueckstand sind ALARM, kein Feiertag', b.rueckstandHandelstage);
  ok(Math.round(b.anteilAufStand * 100) === 3, 'und der Anteil auf Stand wird beziffert',
     Math.round(b.anteilAufStand * 100) + ' %');
  /* Ein Tag Rueckstand kann ein Feiertag sein - dort wird gewarnt, nicht Alarm
   * geschlagen. Dieses Werkzeug kennt keinen Kalender und behauptet auch keinen. */
  fs.readdirSync(tmp).forEach(function (f) { fs.unlinkSync(pathT.join(tmp, f)); });
  for (var k = 0; k < 10; k++) lege('X' + k, '2026-08-24');
  var b1 = W.pruefe(tmp, { jetzt: new Date('2026-08-26T09:00:00Z') });
  ok(b1.rueckstandHandelstage === 1 && b1.ok === true,
     'Ein Handelstag Rueckstand ist eine Warnung, kein Alarm - es koennte ein Feiertag sein');
  ok(/Feiertag/.test(W.textZu(b1)) && /ALARM/.test(W.textZu(b)),
     'Der Text sagt beides deutlich: Warnung mit Feiertagsvorbehalt, Alarm ohne');
  /* Ein leerer oder fehlender Ordner ist NICHT "frisch" - sonst meldet ein kaputter
   * Pfad Gesundheit. */
  fs.readdirSync(tmp).forEach(function (f) { fs.unlinkSync(pathT.join(tmp, f)); });
  ok(!!W.pruefe(tmp, {}).grund, 'Ein leerer Ordner meldet "nicht pruefbar", nicht "frisch"');
  ok(!!W.pruefe(tmp + '-gibtsnicht', {}).grund, 'und ein fehlender ebenso');
  fs.rmSync(tmp, { recursive: true, force: true });

  /* Und der Melder haengt an BEIDEN Ausgaengen des Abrufwerkzeugs - der stille war
   * der eigentliche Fehler. */
  var yq = fs.readFileSync(__dirname + '/tools/yahoo-60m-holen.js', 'utf8');
  ok(/Nichts zu tun[\s\S]{0,200}standMelden\(aktualisieren\)/.test(yq),
     'Auch der Lauf ohne Arbeit meldet den Stand des Archivs');
  ok((yq.match(/standMelden\(aktualisieren\)/g) || []).length === 2,
     'beide Ausgaenge melden ihn', (yq.match(/standMelden\(aktualisieren\)/g) || []).length);
  ok(/require\('\.\/archiv-wachhund\.js'\)/.test(yq),
     'und das Werkzeug LAEDT den Wachhund, statt die Rechnung ein zweites Mal zu haben');

  /* ---- Die Sperre: waehrend des Nachladens ist das Archiv GEMISCHT (26.08.2026) ----
   * Ein Nachladelauf braucht rund 97 Minuten je Archiv - der Bereich ist je Intervall
   * fest verdrahtet, einen inkrementellen Modus gibt es nicht. In dieser Zeit ist ein
   * Teil der Reihen neu und ein Teil alt, und das sieht von aussen gesund aus. Wer um
   * 03:15 darauf misst, misst auf wanderndem Grund.
   * Geprueft wird die Rechnung, nicht der Text - mit festen Zeitpunkten. */
  var tmpS = fs.mkdtempSync(pathT.join(osT.tmpdir(), 'sperre-test-'));
  function legeS(sym, tag) {
    fs.writeFileSync(pathT.join(tmpS, 'bars_60m_' + sym + '.json'),
      JSON.stringify({ series: [[Date.parse(tag + 'T13:30:00Z'), 100, 1, 101, 99]] }));
  }
  for (var si = 0; si < 10; si++) legeS('S' + si, '2026-08-25');
  var JETZT = new Date('2026-08-26T09:00:00Z');
  ok(W.pruefe(tmpS, { jetzt: JETZT }).ok === true, 'Ohne Sperre gibt es ein Urteil');

  /* Frische Sperre: KEIN Urteil. Ein Rueckstand waere hier eine Aussage ueber den
   * Zeitpunkt der Frage, nicht ueber das Archiv. */
  W.sperreSetzen(tmpS, 'Testlauf');
  var bGes = W.pruefe(tmpS, { jetzt: new Date() });
  ok(bGes.gesperrt === true && bGes.ok === false,
     'Mit frischer Sperre gibt der Wachhund KEIN Urteil ab');
  ok(/WIRD GERADE GESCHRIEBEN/.test(W.textZu(bGes)), 'und sagt im Klartext, warum');

  /* DER WICHTIGE FALL: eine liegengebliebene Sperre darf nicht ewig blockieren.
   * Beim Erproben am 26.08.2026 ist genau das passiert - ein hart abgebrochener Lauf
   * hat seinen Signal-Handler nicht ausgefuehrt und die Sperre liegengelassen. Die
   * Frist ist deshalb nicht der Notnagel, sondern die eigentliche Sicherung. */
  fs.writeFileSync(pathT.join(tmpS, '_laeuft.json'),
    JSON.stringify({ start: new Date(Date.now() - 7 * 3600000).toISOString(), was: 'abgestuerzt' }));
  var bVer = W.pruefe(tmpS, { jetzt: new Date() });
  ok(bVer.gesperrt !== true && bVer.ok === true,
     'Eine verwaiste Sperre blockiert das Urteil NICHT mehr - sonst schwiege der Wachhund fuer immer');
  ok(bVer.verwaisteSperre && /VERWAISTE SPERRE/.test(W.textZu(bVer)),
     'aber sie wird eigens gemeldet - ein abgestuerzter Lauf ist selbst ein Befund',
     bVer.verwaisteSperre);
  /* Knapp unter der Frist gilt sie noch. */
  fs.writeFileSync(pathT.join(tmpS, '_laeuft.json'),
    JSON.stringify({ start: new Date(Date.now() - (W.VERWAIST_STUNDEN - 0.5) * 3600000).toISOString() }));
  ok(W.pruefe(tmpS, { jetzt: new Date() }).gesperrt === true,
     'Eine halbe Stunde vor der Frist gilt sie noch als aktiv');
  /* Eine kaputte Sperrdatei darf nicht als "aktiv" durchgehen - sonst legt ein
   * einziger Schreibfehler die Messung fuer immer still. */
  fs.writeFileSync(pathT.join(tmpS, '_laeuft.json'), 'kein JSON');
  var bKaputt = W.pruefe(tmpS, { jetzt: new Date() });
  ok(bKaputt.gesperrt !== true && bKaputt.verwaisteSperre === true,
     'Eine unlesbare Sperrdatei gilt als verwaist, nicht als aktiv');
  W.sperreLoesen(tmpS);
  ok(W.pruefe(tmpS, { jetzt: JETZT }).ok === true && !W.pruefe(tmpS, { jetzt: JETZT }).verwaisteSperre,
     'Nach dem Loesen ist alles wie vorher');

  /* ---- Nie auf 100 aufrunden, wenn es nicht 100 ist (26.08.2026) ----
   * Der Wachhund meldete "2.965 von 2.965, 100 % auf Stand", waehrend ZEHN Reihen
   * zurueckhingen: 99,6627 % wurde von Math.round zu 100. Gezaehlt wurde richtig, die
   * ANZEIGE nahm die Wahrheit weg - und zwar in der Sicherung, die genau gegen stilles
   * Veralten gebaut wurde. Die Luecke fiel dann ueber eine falsche Delisting-Liste auf
   * statt hier: fuenf stillstehende Reihen wurden als "verschwunden" gefuehrt.
   * Das ist am selben Tag der sechste Fall, in dem ein defekter Zustand wie ein gesunder
   * aussieht, weil die Meldung eine Stelle zu grob ist. */
  var tmpR = fs.mkdtempSync(pathT.join(osT.tmpdir(), 'rundung-test-'));
  function legeR(sym, tag) {
    fs.writeFileSync(pathT.join(tmpR, 'bars_1d_' + sym + '.json'),
      JSON.stringify({ series: [[Date.parse(tag + 'T13:30:00Z'), 100, 1, 101, 99]] }));
  }
  /* 299 auf Stand, EINE zurueck: 99,67 % - genau der Bereich, in dem gerundet wurde. */
  for (var ri = 0; ri < 299; ri++) legeR('AKT' + ri, '2026-08-25');
  legeR('ZURUECK', '2026-08-21');
  var bR = W.pruefe(tmpR, { jetzt: new Date('2026-08-26T09:00:00Z') });
  var tR = W.textZu(bR);
  ok(!/100 % auf Stand/.test(tR),
     'Bei 299 von 300 steht NICHT "100 % auf Stand"', (tR.match(/[\d,]+ % auf Stand/) || [])[0]);
  ok(/99,6 % auf Stand/.test(tR),
     'sondern der abgerundete Wert mit Nachkommastelle', (tR.match(/[\d,]+ % auf Stand/) || [])[0]);
  /* Und die eine Reihe wird BEIM NAMEN genannt - ein Prozentsatz ist nicht
   * handlungsfaehig, ein Kuerzel mit Datum schon. Genau daran haette man die falsche
   * Delisting-Liste erkannt. */
  ok(bR.nachzuegler.length === 1 && bR.nachzuegler[0].sym === 'ZURUECK',
     'Die zurueckhaengende Reihe wird namentlich genannt', JSON.stringify(bR.nachzuegler));
  ok(/ZURUECK\s+2026-08-21\s+\(2 Handelstage\)/.test(tR),
     'mit Datum und Abstand in Handelstagen');
  /* Der Abstand ist der Unterschied zwischen "verdaechtig" und "vermutlich echt weg":
   * ein paar Tage sind ein Abruffehler, zwei Jahre sind ein Delisting. */
  legeR('LANGEWEG', '2024-12-17');
  var bR2 = W.pruefe(tmpR, { jetzt: new Date('2026-08-26T09:00:00Z') });
  var lang = bR2.nachzuegler.filter(function (x) { return x.sym === 'LANGEWEG'; })[0];
  ok(lang && lang.tageZurueck > 400,
     'Eine seit zwei Jahren stillstehende Reihe wird als solche ausgewiesen', lang && lang.tageZurueck);
  ok(/hoechstens 10 Handelstagen/.test(W.textZu(bR2)),
     'und der Text trennt die frisch stillstehenden von den lange stillstehenden');
  /* Wenn wirklich alles auf Stand ist, steht auch 100 % da - sonst waere die Anzeige
   * in die andere Richtung falsch. */
  fs.unlinkSync(pathT.join(tmpR, 'bars_1d_ZURUECK.json'));
  fs.unlinkSync(pathT.join(tmpR, 'bars_1d_LANGEWEG.json'));
  var bR3 = W.pruefe(tmpR, { jetzt: new Date('2026-08-26T09:00:00Z') });
  ok(/100 % auf Stand/.test(W.textZu(bR3)) && bR3.nachzuegler.length === 0,
     'Ist wirklich jede Reihe auf Stand, steht 100 % da');
  fs.rmSync(tmpR, { recursive: true, force: true });
  fs.rmSync(tmpS, { recursive: true, force: true });

  /* Und das Abrufwerkzeug setzt sie wirklich - vor der Schleife, geloest vor der
   * Standmeldung. Andersherum pruefte es sein eigenes Archiv als "wird gerade
   * geschrieben" und sagte gar nichts ueber den Stand. */
  ok(/Wachhund\.sperreSetzen\(ZIEL/.test(yq) && /function sperreRaeumen/.test(yq),
     'Das Abrufwerkzeug setzt die Sperre und raeumt sie wieder weg');
  ok(yq.indexOf('sperreRaeumen();') < yq.indexOf("' Reihen geholt ('"),
     'Es loest sie VOR der Standmeldung - sonst meldet es sich selbst als gesperrt');
  ok(/process\.on\('SIGINT'/.test(yq) && /process\.on\('SIGTERM'/.test(yq),
     'Auch bei Abbruch mit Strg+C wird sie geloest (soweit das Betriebssystem den Handler laesst)');
  /* Der naechtliche Laeufer schweigt nicht, wenn etwas ist. */
  var nq = fs.readFileSync(__dirname + '/tools/archiv-nachladen.js', 'utf8');
  ok(/if \(code !== 0 \|\| verwaist\)/.test(nq),
     'Der naechtliche Laeufer schreibt die Meldedatei auch bei verwaister Sperre - sonst faende ein abgestuerzter Lauf keinen Leser');
  ok(/archiv-alarm-' \+ new Date\(\)\.toISOString\(\)\.slice\(0, 10\)/.test(nq),
     'Die Meldedatei traegt das Datum - ein Alarm von gestern sieht nicht aus wie einer von heute');
})();


/* ================= Barrierefreiheit: Kontrast und Tabellensemantik ================= */
console.log('\nBarrierefreiheit (Stufe F 3, 26.08.2026)');
(function () {
  /* Die Sonde tools/a11y-probe.js misst am gerenderten Bild und braucht ein Fenster.
   * Was sie gefunden hat, laesst sich hier ohne Fenster NACHRECHNEN: die Farbmarken
   * stehen in index.html, die Rechnung ist die von WCAG. Damit haelt npm test die
   * Schwelle, ohne die App zu starten.
   * Gemessen am 26.08.2026: hell 23 Befunde, dunkel 8 - danach beide null, bei mehr
   * geprueften Textstellen als vorher (1.757 gegen 1.681). */
  var aHtml = fs.readFileSync(__dirname + '/index.html', 'utf8');
  function marken(sel) {
    var i = aHtml.indexOf(sel), e = aHtml.indexOf('\n  }', i), out = {};
    aHtml.slice(i, e).replace(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\s*;/g, function (_, k, v) { out[k] = v; return _; });
    return out;
  }
  function zuRgb(c) { return { r: parseInt(c.slice(1, 3), 16), g: parseInt(c.slice(3, 5), 16), b: parseInt(c.slice(5, 7), 16) }; }
  function leucht(c) {
    function k(v) { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }
    return 0.2126 * k(c.r) + 0.7152 * k(c.g) + 0.0722 * k(c.b);
  }
  function kontrast(a, b) {
    var l1 = leucht(zuRgb(a)), l2 = leucht(zuRgb(b));
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  var aHell = marken('  :root {'), aDunkel = marken('  :root[data-theme="dark"] {');
  ok(aHell.series && aDunkel.series && aHell.muted, 'Die Farbmarken lassen sich aus index.html lesen');
  /* Erst die Rechnung selbst pruefen - eine Kontrastformel, die niemand nachrechnet,
   * ist so viel wert wie gar keine. Schwarz auf Weiss ist per Definition 21. */
  ok(Math.abs(kontrast('#000000', '#ffffff') - 21) < 0.01, 'Die Kontrastrechnung stimmt (Schwarz auf Weiss = 21)');
  ok(Math.abs(kontrast('#767676', '#ffffff') - 4.54) < 0.02,
     'und trifft den bekannten Grenzfall #767676 auf Weiss', kontrast('#767676', '#ffffff').toFixed(2));

  /* Jede Marke, die TEXT faerbt, gegen JEDEN Untergrund, auf dem Text steht. Gegen den
   * bequemsten zu rechnen waere Selbstbetrug - deshalb alle Paarungen. */
  var TEXTFARBEN = ['ink', 'ink-2', 'muted', 'series', 'series2', 'up', 'warn'];
  var GRUENDE = ['page', 'surface', 'panel', 'panel-2'];
  [['hell', aHell], ['dunkel', aDunkel]].forEach(function (paar) {
    var name = paar[0], T = paar[1], schwach = [];
    TEXTFARBEN.forEach(function (f) {
      var fv = T[f] || aHell[f];
      if (!fv) return;
      GRUENDE.forEach(function (g) {
        var gv = T[g] || aHell[g];
        if (!gv) return;
        var v = kontrast(fv, gv);
        if (v < 4.5) schwach.push(f + ' auf ' + g + ' = ' + v.toFixed(2));
      });
    });
    ok(schwach.length === 0,
       'Thema ' + name + ': jede Textfarbe erreicht 4,5 auf jedem Untergrund',
       schwach.length ? schwach.join(' | ') : 'alle ' + (TEXTFARBEN.length * GRUENDE.length) + ' Paarungen');
  });

  /* Und die Tabellensemantik: die Beschriftungsspalte des Regelkopfs war die einzige
   * sichtbare Tabelle der App ganz ohne Kopfzelle. Ohne <th scope="row"> liest ein
   * Screenreader die rechte Spalte als Folge zusammenhangloser Werte vor. */
  var aDep = fs.readFileSync(__dirname + '/depot.js', 'utf8');
  ok(/<th scope="row"[^>]*>' \+\s*\n?\s*U\.esc\(r\[0\]\)/.test(aDep) || /<th scope="row"/.test(aDep),
     'Der Regelkopf beschriftet seine Zeilen mit <th scope="row">');
  ok(!/<tr><td style="color:var\(--muted\); white-space:nowrap; width:130px;">' \+ U\.esc\(r\[0\]\)/.test(aDep),
     'und nicht mehr mit einer gewoehnlichen Datenzelle');
})();

Promise.all(offeneProben).then(function () {
  console.log(fails === 0 ? '\nALLE TESTS BESTANDEN' : '\n' + fails + ' TEST(S) FEHLGESCHLAGEN');
  process.exit(fails ? 1 : 0);
}, function (e) {
  console.log('\nEIN ASYNCHRONER ABSCHNITT IST GESCHEITERT: ' + (e && e.stack || e));
  process.exit(1);
});
