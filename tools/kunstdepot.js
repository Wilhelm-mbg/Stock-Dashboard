'use strict';
/* ================= KUNSTDATEN fuer Oberflaechen-Aufnahmen =================
 *
 * Warum es diese Datei gibt: Eine isolierte Testinstanz startet mit einem leeren
 * Depot. Jede Aufnahme zeigt dann Leerzustaende - drei Karten ohne Zahlen, ein
 * Verlauf ohne Linie, eine Handlungsliste ohne Handlung. Damit ist eine
 * Gestaltung genau NICHT belegt: man sieht, dass nichts da ist, nicht, wie es
 * aussieht, wenn etwas da ist.
 *
 * WAS DAS HIER IST UND WAS NICHT:
 *  - Es ist ein STORE-ZUSTAND zum Ansehen. Erfundene Kurse, erfundene Orders,
 *    erfundene Verlaufspunkte.
 *  - Es ist KEINE Messung und darf nie eine werden. Die Zahlen stehen in keinem
 *    Protokoll, sie belegen nichts und sie werden nirgends ausgewertet.
 *    (wiki/fehlerformen.md: "Ein Trockenlauf, der aussieht wie ein Befund" - ein
 *    Werkzeug, das Zahlen erzeugt, benennt sie nach ihrer HERKUNFT. Deshalb heisst
 *    die Datei kunstdepot und nicht beispieldepot.)
 *  - Es wird ausschliesslich in eine ISOLIERTE Instanz geschrieben (eigenes
 *    userData unter %TEMP%). Der Datenordner und die installierte App von Wilhelm
 *    werden nie beruehrt.
 *
 * Aufruf: von tools/ui-aufnahmen.js mit --kunstdaten. Direkt gestartet schreibt es
 * die Datei nach stdout, damit man hineinsehen kann:
 *   node tools/kunstdepot.js
 */

var TAG = 86400000;

/** Ein Depot-Zustand mit zwei gefuellten Buechern, laufender Intraday-Strategie und
 *  20 Verlaufspunkten. jetzt = Bezugszeitpunkt (Vorgabe: die Uhr). */
function bauen(jetzt) {
  var now = jetzt || Date.now();
  var START = 100000;

  /* ---- Mittelfrist: Momentum ---- */
  var mfBuch = {
    name: 'momentum', start: START, cash: 12480.55,
    angelegt: now - 96 * TAG,
    letztesRebalanceT: now - 21 * TAG,
    konfig: { rueckblick: 231, luecke: 21, halten: 63, anteil: 0.1, mindestWerte: 25,
              umsatzMin: 100000000, umsatzFenster: 20 },
    konfigSeit: now - 21 * TAG,
    liquideSeit: now - 21 * TAG,
    korbVerlauf: [
      { t: now - 84 * TAG, zulaessig: 96, geprueft: 193, ziel: 19 },
      { t: now - 21 * TAG, zulaessig: 101, geprueft: 193, ziel: 20 }
    ],
    positionen: [
      { sym: 'NVDA', stueck: 128.4, einstand: 214.32, seit: now - 21 * TAG },
      { sym: 'AVGO', stueck: 74.1, einstand: 352.18, seit: now - 21 * TAG },
      { sym: 'MU', stueck: 39.7, einstand: 911.06, seit: now - 21 * TAG }
    ],
    trades: [
      { t: now - 84 * TAG, sym: 'AAPL', art: 'kauf', stueck: 92.3, kurs: 301.44 },
      { t: now - 21 * TAG, sym: 'AAPL', art: 'verkauf', stueck: 92.3, kurs: 318.9, pnl: 1611.5 },
      { t: now - 21 * TAG, sym: 'NVDA', art: 'kauf', stueck: 128.4, kurs: 214.32 },
      { t: now - 21 * TAG, sym: 'AVGO', art: 'kauf', stueck: 74.1, kurs: 352.18 },
      { t: now - 21 * TAG, sym: 'MU', art: 'kauf', stueck: 39.7, kurs: 911.06 }
    ]
  };

  /* ---- Mittelfrist: Ergebnis-Drift (long UND short) ---- */
  var driftBuch = {
    name: 'drift', start: START, cash: 84210.9,
    angelegt: now - 96 * TAG,
    letztesRebalanceT: 0,
    positionen: [
      { sym: 'MSFT', stueck: 11.2, einstand: 408.55, richtung: 1, seit: now - 12 * TAG },
      { sym: 'INTC', stueck: 52.6, einstand: 89.4, richtung: -1, seit: now - 8 * TAG },
      { sym: 'QCOM', stueck: 27.9, einstand: 168.2, richtung: 1, seit: now - 3 * TAG }
    ],
    trades: [
      { t: now - 30 * TAG, sym: 'TSLA', art: 'kauf', stueck: 14.8, kurs: 351.2 },
      { t: now - 14 * TAG, sym: 'TSLA', art: 'verkauf', stueck: 14.8, kurs: 339.75, pnl: -169.46 },
      { t: now - 12 * TAG, sym: 'MSFT', art: 'kauf', stueck: 11.2, kurs: 408.55 },
      { t: now - 8 * TAG, sym: 'INTC', art: 'leerverkauf', stueck: 52.6, kurs: 89.4 },
      { t: now - 3 * TAG, sym: 'QCOM', art: 'kauf', stueck: 27.9, kurs: 168.2 }
    ]
  };

  /* ---- 20 Verlaufspunkte, einer je Tag, mit Bezugswert IM Punkt ----
   * Genau so schreibt mfdepot.js sie: startM/startD stehen im Punkt, damit ein
   * alter Verlauf auch nach einer Kapitalaenderung lesbar bleibt. */
  var mfVerlauf = [];
  for (var i = 19; i >= 0; i--) {
    var t = now - i * TAG;
    var s = (19 - i) / 19;
    mfVerlauf.push({
      t: t,
      momentum: Math.round((START * (1 + 0.0318 * s + 0.006 * Math.sin(s * 7))) * 100) / 100,
      drift: Math.round((START * (1 - 0.0136 * s + 0.004 * Math.sin(s * 5 + 1))) * 100) / 100,
      spy: Math.round((640 * (1 + 0.011 * s)) * 100) / 100,
      startM: START, startD: START
    });
  }

  /* ---- Intraday: an, mit geschlossenen Trades und einer offenen Position ---- */
  var trades = [];
  var id = 1;
  var muster = [
    { sym: 'AMD', dir: 'call', tage: 17, pnl: 214.8 },
    { sym: 'META', dir: 'put', tage: 13, pnl: -96.4 },
    { sym: 'GOOGL', dir: 'call', tage: 9, pnl: 331.05 },
    { sym: 'ASML', dir: 'call', tage: 5, pnl: -142.7 },
    { sym: 'TSM', dir: 'call', tage: 2, pnl: 128.9 }
  ];
  muster.forEach(function (m) {
    var oT = now - m.tage * TAG - 3 * 3600000;
    trades.push({
      id: id++, sym: m.sym, dir: m.dir, strategy: 'intraday', basis: true,
      openT: oT, closeT: oT + 7 * 3600000, status: 'closed',
      entrySpot: 100, entry: 100, qty: 30, spx: 0.0005,
      exit: 100 + m.pnl / 30, pnl: m.pnl,
      reason: 'RSI(2) unter 5 im Seitwärtskanal, Basiswert 1x',
      scenario: 'Kunstdaten für eine Oberflächen-Aufnahme – keine Messung.'
    });
  });
  var offen = {
    id: id++, sym: 'NVDA', dir: 'call', strategy: 'intraday', basis: true,
    openT: now - 5 * 3600000, status: 'open',
    entrySpot: 224.41, entry: 224.30, qty: 13, spx: 0.0005,
    sl: -0.25, tp: 0.35,
    reason: 'RSI(2) unter 5 im Seitwärtskanal, Basiswert 1x',
    scenario: 'Kunstdaten für eine Oberflächen-Aufnahme – keine Messung.'
  };
  trades.unshift(offen);
  trades.sort(function (a, b) { return b.openT - a.openT; });

  /* Bargeld so gewaehlt, dass Depotwert und Gesamt-P/L zusammenpassen: Startkapital
   * plus die Summe der geschlossenen Ergebnisse minus dem Einsatz der offenen
   * Position. Eine Kachelreihe, die sich selbst widerspricht, waere als Aufnahme
   * wertlos. */
  var summeGeschlossen = muster.reduce(function (a, m) { return a + m.pnl; }, 0);
  var einsatzOffen = offen.entry * offen.qty;
  var cash = Math.round((START + summeGeschlossen - einsatzOffen) * 100) / 100;

  var equityHist = [];
  for (var k = 0; k < 120; k++) {
    var q = k / 119;
    equityHist.push([Math.round(now - (1 - q) * 19 * TAG),
      Math.round((START * (1 + 0.0124 * q + 0.0035 * Math.sin(q * 11))) * 100) / 100]);
  }

  return {
    cash: cash,
    positions: [offen],
    trades: trades,
    stats: { news: { r: 0, w: 0 }, tech: { r: 7, w: 4 }, elliott: { r: 5, w: 3 }, maIntraday: { r: 0, w: 0 } },
    patience: {},
    weights: { news: 0, tech: 0.55, elliott: 0.30 },
    intraday: { enabled: true, exitStyle: 'laufen', mode: 'rsi2seit', interval: '60m', period: 20,
      confirmBps: 15, profile: 'atm60_b', instrument: 'basis', pool: 'auto', kapiZusatz: false,
      regimeZuteilung: false, orderFee: 0, minDollarVol: 50, budgetPct: 0.03, sl: -0.25, tp: 0.35,
      cooldownMin: 120, maxPerDay: 10, lineType: 'ema', trendFilter: false, window: 'all',
      scalpHold: 480, scalpTrail: 15, scalpSL: 20, blackout: 'block', channel: true, mtf: true,
      sizing: 'fix', screener: false, avoidHours: [], autoTune: true },
    momentumAn: true, driftAn: true, maxRisikostufe: 3,
    watchlist: [],
    intradayLastScan: now - 12 * 60000, intradayDay: new Date(now).toISOString().slice(0, 10),
    intradayCount: 1, intradayCooldown: {},
    notify: true, hourlyEnabled: false,
    equityHist: equityHist,
    risk: { maxPos: 8, dayLossPct: 3, exposurePct: 40 },
    dayKey: new Date(now).toISOString().slice(0, 10),
    dayStartEq: Math.round((START + summeGeschlossen - 128.9) * 100) / 100,
    lastRun: now - 3 * 3600000, nextId: id,
    /* Ohne messStart zieht die Migration einen Messschnitt und stempelt jeden Trade
     * als Altlast - die Kachel "P/L der Messung" stuende dann auf null. */
    messStart: now - 90 * TAG,
    mfBuch: mfBuch, driftBuch: driftBuch, mfVerlauf: mfVerlauf,
    pruefStand: { buecher: now - 18 * 60000 },
    autoOpt: { on: true, regime: true, regimeMin: 60, lastMess: now - 14 * 3600000, lastRegime: now - 40 * 60000 },
    regime: { at: now - 40 * 60000, ok: true, quelle: 'Regel', nurAnzeige: true, pause: false,
      txt: 'RSI(2) im Seitwärtskanal · 60m — Kunstdaten für eine Oberflächen-Aufnahme.' }
  };
}

/** Der Store der Kostenmessung. Er liegt seit dem 27.08.2026 NEBEN dem Depot in
 *  einer eigenen Datei (Store-Name 'kostenmessung') - genau dort schreibt kosten.js
 *  hin, und nur von dort liest die Bilanz. Vier erfundene Runden, damit die
 *  Statuszeile der Klappe "Kostenmessung" auf der Aufnahme etwas zu zeigen hat.
 *  Auch das ist KEINE Messung: die echten Runden liegen im Datenordner und werden
 *  hier nicht angefasst. */
function kostenmessung(jetzt) {
  var now = jetzt || Date.now();
  return {
    seit: now - 40 * TAG,
    verworfen: [],
    uebernacht: null,
    runden: [
      { at: now - 9 * TAG, sym: 'AAPL', gefaess: 'capital', krypto: false, dir: 'call', basis: true,
        slipOpen: 0.0005, slipClose: 0.0006, runde: 0.0011 },
      { at: now - 6 * TAG, sym: 'MSFT', gefaess: 'capital', krypto: false, dir: 'call', basis: true,
        slipOpen: 0.0004, slipClose: 0.0005, runde: 0.0009 },
      { at: now - 4 * TAG, sym: 'NVDA', gefaess: 'alpaca', umsatzKlasse: '250-1000', stueck: 1,
        gegenwertUsd: 224, slipOpen: 0.0003, slipClose: 0.0003, runde: 0.0006 },
      { at: now - 2 * TAG, sym: 'INTC', gefaess: 'alpaca', umsatzKlasse: '50-250', stueck: 2,
        gegenwertUsd: 178, slipOpen: 0.0004, slipClose: 0.0004, runde: 0.0008 }
    ]
  };
}

module.exports = { bauen: bauen, kostenmessung: kostenmessung };

if (require.main === module) {
  process.stdout.write(JSON.stringify(bauen(Date.now()), null, 2) + '\n');
}
