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

/** ================= EIN KUNST-ARCHIV FUER DIE ARCHIV-GRAFIK =================
 *
 * Die Grafik in Werkzeuge -> Betrieb (Stufe 4) zeigt je Aufloesung eine Karte der
 * letzten 60 Handelstage. In einer frischen Testinstanz ist jedes Archiv leer, und
 * fuenf leere Balken belegen von der Gestaltung genau nichts - man saehe nicht, wie
 * ein Fuellstand aussieht, und schon gar nicht, wie eine LUECKE aussieht.
 *
 * Deshalb hier ein winziger Bestand: sechs Werte, ein paar Tage je Aufloesung, und
 * in jeder Aufloesung eine andere Lage:
 *   1m   sechs Tage am rechten Rand         - so sieht das kurze Yahoo-Fenster aus
 *   5m   40 Tage MIT einem Loch von 4 Tagen - die Kerbe, um die es geht
 *   15m  25 Tage, die letzten fuenf nur bei zwei von sechs Werten - "lueckenhaft"
 *   60m  60 Tage vollstaendig                - so sieht "gut" aus
 *   1d   60 Tage mit zwei einzelnen Loechern - vereinzelte Ausfaelle
 *
 * DIE ZAHLEN SIND ERFUNDEN und heissen darum so. Sie werden in eine ISOLIERTE
 * Instanz geschrieben (eigenes downloads unter %TEMP%), nie in den Datenordner -
 * dieselbe Auflage wie beim Kunstdepot oben. Die Symbole tragen den Vorsatz KUNST,
 * damit auch eine versehentlich liegengebliebene Datei ihre Herkunft nennt
 * (wiki/fehlerformen.md: "Ein Trockenlauf, der aussieht wie ein Befund").
 *
 * Rueckgabe ist eine LISTE VON DATEIEN, kein Schreibvorgang: wohin sie gehoeren,
 * weiss nur der Aufrufer (tools/ui-aufnahmen.js), und diese Datei soll keinen Pfad
 * kennen, den sie nicht gesetzt hat.
 */
var Boerse = require('../boerse.js');
var KUNST_SYMBOLE = ['KUNSTA', 'KUNSTB', 'KUNSTC', 'KUNSTD', 'KUNSTE', 'KUNSTF'];
/* Aufloesung -> { ordner, barMin, tage, luecke, nurZweiAbTag } */
var KUNST_LAGE = {
  '1m':  { ordner: 'archiv1m',  barMin: 1,  tage: 6 },
  '5m':  { ordner: 'archiv5m',  barMin: 5,  tage: 40, luecke: [15, 18] },
  '15m': { ordner: 'archiv15m', barMin: 15, tage: 25, halbAb: 5 },
  '60m': { ordner: 'archiv60m', barMin: 60, tage: 60 },
  /* Tageskerzen: EINE je Tag. Bis zum 04.09.2026 schrieb die Schleife auch hier drei
   * Kerzen je Tag (der Abstand wurde auf 60 Minuten gedeckelt, damit sie im Tag
   * bleiben). Fuer die Archiv-Grafik war das egal - sie zaehlt Tage, nicht Kerzen.
   * Fuer den Reiter Markt ist es nicht egal: dort ist eine Kerze ein TAG, und
   * "der Median der letzten 50 Tage" waere aus 50 Dritteln von Tagen gerechnet. */
  '1d':  { ordner: 'archiv1d',  barMin: 1440, tage: 60, luecke: [9, 9], luecke2: [31, 31], jeTag: 1 }
};

/** Die letzten n Handelstage als UTC-Tagesstempel, juengster zuerst. */
function handelstage(jetzt, n) {
  var aus = [], ms = jetzt;
  for (var i = 0; i < n * 3 && aus.length < n; i++, ms -= 86400000) {
    if (Boerse.istHandelstag(ms)) aus.push(new Date(ms).setUTCHours(0, 0, 0, 0));
  }
  return aus;
}

/** Ein Kunst-Archiv: Universum, Kursdateien und stand.json je Aufloesung.
 *  Rueckgabe: [{ pfad: 'archiv5m/bars_5m_KUNSTA.json', inhalt: {...} }, ...] -
 *  Pfade relativ zum Datenordner, mit Schraegstrich. */
function archiv(jetzt) {
  var now = jetzt || Date.now();
  var aus = [];
  /* Ohne Punkt-in-Zeit-Universum meldet der Sammelplan ein HINDERNIS statt eines
   * Rueckstands - die Grafik zeigte dann fuenfmal "geht nicht" und nie einen
   * Fuellstand. Es gehoert also dazu. */
  aus.push({
    pfad: 'massive/universum-2026-09-01.json',
    inhalt: { stand: '2026-09-01', herkunft: 'Kunstdaten fuer eine Oberflaechen-Aufnahme - keine Messung',
              werte: KUNST_SYMBOLE.map(function (s, i) { return { sym: s, umsatzMio: 900 - i * 40 }; }) }
  });
  Object.keys(KUNST_LAGE).forEach(function (iv) {
    var L = KUNST_LAGE[iv];
    var tage = handelstage(now, L.tage);
    var stand = { fertig: {}, ohne: {} };
    KUNST_SYMBOLE.forEach(function (sym, nr) {
      var serie = [];
      tage.slice().reverse().forEach(function (t0, idx) {
        var alter = L.tage - 1 - idx;                     // 0 = juengster Tag
        if (L.luecke && alter >= L.luecke[0] && alter <= L.luecke[1]) return;
        if (L.luecke2 && alter >= L.luecke2[0] && alter <= L.luecke2[1]) return;
        /* "lueckenhaft" heisst: den Tag hat nur ein TEIL der Reihen. Genau dafuer
         * fallen hier vier von sechs Werten fuer die juengsten Tage aus. */
        if (L.halbAb != null && alter < L.halbAb && nr >= 2) return;
        /* Der Abstand der drei Kerzen darf den Tag nicht verlassen - bei Tageskerzen
         * (barMin 1440) haette k * barMin die Reihe ueber 85 statt 60 Tage gestreckt
         * und die Grafik mit erfundenen Wochenendtagen gefuellt. */
        var schritt = Math.min(L.barMin, 60);
        for (var k = 0; k < (L.jeTag || 3); k++) {
          var t = t0 + (14 * 60 + 30 + k * schritt) * 60000;
          var kurs = Math.round((100 + nr * 7 + idx * 0.4 + k * 0.15) * 100) / 100;
          serie.push([t, kurs, 12000 + k * 300, kurs + 0.3, kurs - 0.3, kurs - 0.1]);
        }
      });
      if (!serie.length) return;
      aus.push({
        pfad: L.ordner + '/bars_' + iv + '_' + sym + '.json',
        inhalt: { sym: sym, quelle: 'Kunstdaten fuer eine Oberflaechen-Aufnahme - keine Messung',
                  format: '[zeit, schluss, umsatz, hoch, tief, eroeffnung]',
                  stand: new Date(now).toISOString(), series: serie }
      });
      stand.fertig[sym] = { kerzen: serie.length, ohneEroeffnung: 0,
        am: new Date(now).toISOString().slice(0, 10),
        bisTag: new Date(serie[serie.length - 1][0]).toISOString().slice(0, 10) };
    });
    aus.push({ pfad: L.ordner + '/stand.json', inhalt: stand });
  });
  return aus;
}

/** ================= KUNSTDATEN FUER DEN REITER MARKT =================
 *
 * Der Ueberblick auf dem Reiter "Markt" (Stufe 5, 04.09.2026) haengt an drei
 * Quellen, und ZWEI davon gibt es in einer isolierten Instanz nicht:
 *   - markt/stammdaten.json (Branche und Aktienanzahl) - eine Datei, die hier
 *     erzeugt werden KANN, also wird sie erzeugt;
 *   - das Tagesarchiv - dito, siehe archiv() weiter oben;
 *   - die LAUFENDEN KURSE aus dem Sammelabruf - die gibt es ohne Netz nicht, und
 *     eine Testinstanz soll auch keins bekommen.
 *
 * Ohne den dritten Teil zeigt die Aufnahme drei Leerzustaende, und von der
 * Gestaltung der Sektor-Balken und der fuenf Hotlists ist dann genau nichts belegt.
 * Deshalb wird hier derselbe gemerkte Stand geschrieben, den marktui.js nach jedem
 * Lauf ablegt (Store-Schluessel marktUeberblickStand) - so, wie ui-aufnahmen.js
 * auch das Depot und die Kostenrunden vorab hinlegt.
 *
 * WICHTIG: Gerechnet wird mit den ECHTEN Funktionen aus markt/uebersicht.js. Ein
 * von Hand geschriebener Stand waere ein Bild von einer Anzeige und kein Lauf der
 * Anzeige - genau der Unterschied, den dieses Projekt "Trockenlauf, der aussieht
 * wie ein Befund" nennt. Erfunden sind hier die EINGANGSDATEN, nicht die Rechnung.
 */
var MU = require('../markt/uebersicht.js');

/* Zwanzig Werte in vier Sektoren. Vier, weil ein Sektor unter drei Werten gar nicht
 * gezeigt wird und eine Leiste mit einem Balken keine Leiste ist. Die Namen tragen
 * den Vorsatz KUNST, damit auch eine versehentlich liegengebliebene Datei ihre
 * Herkunft nennt. */
var KUNST_SEKTOREN = ['Technologie', 'Finanzen', 'Gesundheit', 'Energie'];
function marktSymbole() {
  var aus = [];
  KUNST_SEKTOREN.forEach(function (sek, s) {
    for (var i = 1; i <= 5; i++) {
      aus.push({ sym: 'KUNSTM' + (s * 5 + i), name: 'Kunst-Firma ' + sek + ' ' + i, sektor: sek });
    }
  });
  return aus;
}

/* Erfundene, aber in sich stimmige Eingangsdaten: Kurs, Tagesveraenderung, Volumen,
 * Stueckzahl und 52-Wochen-Hoch. Die Streuung ist mit Absicht ungleich - ein Satz
 * Zahlen, in dem alle Werte dasselbe tun, zeigt von einer Hotlist nichts. */
function marktKurse(jetzt) {
  var now = jetzt || Date.now();
  return marktSymbole().map(function (w, i) {
    var kurs = Math.round((18 + i * 13.7) * 100) / 100;
    /* Bewusst gemischt: sechs deutlich im Plus, fuenf deutlich im Minus, der Rest
     * dazwischen - sonst stuende in "Verlierer heute" fuenfmal eine Null. */
    var pct = Math.round((((i * 37) % 11) - 5) * 0.63 * 100) / 100;
    var aktien = 40000000 + ((i * 73) % 17) * 260000000;
    /* ZWEI Volumen, und der Unterschied ist der Sinn der Liste "Ungewoehnliches
     * Volumen": volBasis ist das uebliche Tagesvolumen und geht ins Kunst-Archiv,
     * volumen ist das HEUTIGE und weicht davon ab. Waeren beide gleich, stuende in
     * der Liste zwanzigmal "1,0x" - und die Aufnahme belegte, dass die Liste
     * rechnet, nicht dass sie etwas zeigt. Der Wert Nummer 8 hat den Ausreisser. */
    var volBasis = 900000 + ((i * 53) % 19) * 210000;
    var volumen = Math.round(volBasis * (i === 7 ? 3.4 : 0.6 + ((i * 29) % 17) * 0.09));
    return { sym: w.sym, name: w.name, sektor: w.sektor, aktien: aktien,
             kurs: kurs, pct: pct, volumen: volumen, volBasis: volBasis,
             mkap: Math.round(kurs * aktien),
             /* Zwei Werte stehen genau am Hoch, die anderen darunter. */
             hoch52: Math.round(kurs * (i % 9 === 0 ? 1.0 : 1.04 + (i % 5) * 0.03) * 100) / 100,
             at: now };
  });
}

/** Die Stammdaten-Datei, wie sie tools/stammdaten-holen.js sie ablegt. */
function marktStammdaten(jetzt) {
  var now = jetzt || Date.now();
  var werte = {};
  marktKurse(now).forEach(function (w, i) {
    werte[w.sym] = { cik: 900000 + i, name: w.name, sic: 3571, sicText: 'Kunstdaten',
                     sektor: w.sektor, boerse: 'Nasdaq', aktien: w.aktien,
                     aktienStand: 'Kunstdaten', startKurs: w.kurs, startKursStand: new Date(now).toISOString().slice(0, 10) };
  });
  return { stand: new Date(now).toISOString(),
           quelle: 'Kunstdaten fuer eine Oberflaechen-Aufnahme - keine Messung',
           hinweis: 'Erfundene Werte. Sie belegen nichts und werden nirgends ausgewertet.',
           aktienStand: 'Kunstdaten', werte: werte };
}

/** Tagesreihen der Kunst-Marktwerte: 60 Handelstage, EINE Kerze je Tag, mit Umsatz.
 *  Rueckgabe wie archiv(): [{ pfad, inhalt }]. */
function marktArchiv(jetzt) {
  var now = jetzt || Date.now();
  var tage = handelstage(now, 60).slice().reverse();
  return marktKurse(now).map(function (w, i) {
    var serie = tage.map(function (t0, idx) {
      /* Ein leichter Trend plus eine Welle - so sind Wochen- und Monatsspanne
       * verschieden, und die drei Zeitraeume der Sektor-Leiste zeigen nicht dasselbe. */
      var kurs = Math.round((w.kurs * (0.88 + idx * 0.002 + Math.sin((idx + i) / 7) * 0.03)) * 100) / 100;
      var umsatz = Math.round(w.volBasis * (0.7 + ((idx * 17 + i) % 13) * 0.05));
      return [t0 + (20 * 60) * 60000, kurs, umsatz, kurs + 0.4, kurs - 0.4, kurs - 0.1];
    });
    return {
      pfad: 'archiv1d/bars_1d_' + w.sym + '.json',
      inhalt: { sym: w.sym, quelle: 'Kunstdaten fuer eine Oberflaechen-Aufnahme - keine Messung',
                format: '[zeit, schluss, umsatz, hoch, tief, eroeffnung]',
                stand: new Date(now).toISOString(), series: serie }
    };
  });
}

/** Der gemerkte Stand des Markt-Ueberblicks, gerechnet mit markt/uebersicht.js.
 *  Dieselbe Form, die marktui.js nach jedem Lauf in den Store legt. */
function marktstand(jetzt) {
  var now = jetzt || Date.now();
  var kurse = marktKurse(now);
  var reihen = {};
  marktArchiv(now).forEach(function (f) {
    reihen[f.inhalt.sym] = f.inhalt.series.map(function (b) { return [b[0], b[1], b[2]]; });
  });
  var werte = kurse.map(function (w) {
    var reihe = reihen[w.sym] || [];
    var rel = MU.relativesVolumen(w.volumen, MU.volumenReihe(reihe));
    return {
      sym: w.sym, name: w.name, sektor: w.sektor, kurs: w.kurs, pct: w.pct,
      kap: w.mkap, volumen: w.volumen, hoch52: w.hoch52,
      relVol: rel ? rel.faktor : null, relTage: rel ? rel.tage : null,
      woche: MU.spanne(reihe, 5), monat: MU.spanne(reihe, 21)
    };
  });
  function leiste(feld) {
    return MU.sektorLeiste(werte.map(function (w) { return { sektor: w.sektor, kap: w.kap, pct: w[feld] }; }));
  }
  var hot = MU.hotlists(werte);
  function schlank(zeilen) {
    return zeilen.map(function (w) {
      return { sym: w.sym, name: w.name, kurs: w.kurs, pct: w.pct, volumen: w.volumen,
               umsatz: w.umsatz != null ? w.umsatz : null, relVol: w.relVol, relTage: w.relTage,
               hoch52: w.hoch52, naehe: w.naehe != null ? w.naehe : null };
    });
  }
  var heute0 = new Date(new Date(now).toISOString().slice(0, 10) + 'T00:00:00Z').getTime();
  return {
    zeit: now, universum: werte.length, gezeigt: werte.length,
    mitVolumen: werte.filter(function (w) { return w.relVol != null; }).length,
    archivGrund: '',
    sektoren: { t1: leiste('pct'), w1: leiste('woche'), m1: leiste('monat') },
    hotlists: { gewinner: schlank(hot.gewinner), verlierer: schlank(hot.verlierer),
                umsatz: schlank(hot.umsatz), volumen: schlank(hot.volumen), hoch52: schlank(hot.hoch52) },
    naheAm: hot.naheAm,
    earnings: [
      { sym: 'KUNSTM3', name: 'Kunst-Firma Technologie 3', zeit: heute0 + 12 * 3600000, art: 'BMO' },
      { sym: 'KUNSTM9', name: 'Kunst-Firma Finanzen 4', zeit: heute0 + 21 * 3600000, art: 'AMC' },
      { sym: 'KUNSTM14', name: 'Kunst-Firma Gesundheit 4', zeit: heute0 + 86400000 + 12 * 3600000, art: 'BMO' },
      { sym: 'KUNSTM18', name: 'Kunst-Firma Energie 3', zeit: heute0 + 86400000 + 21 * 3600000, art: 'TAS' }
    ],
    earningsGrund: ''
  };
}

/* ---- Schlagzeilen fuer das Laufband ----
 * Ohne Netz gibt es keine News, und ohne News ist das Laufband ausgeblendet - dann
 * kann keine Aufnahme es zeigen und keine Sonde es messen. Diese Meldungen sind
 * ERFUNDEN und sagen es selbst: die Quelle heisst "Kunstquelle", die Werte sind die
 * KUNST-Kuerzel, und die Ueberschriften nennen keine echte Firma. Die Zeitstempel
 * sind gestaffelt, damit die Altersangabe ("vor N Min") etwas zu zeigen hat.
 * Geschrieben wird in denselben Store-Schluessel, den renderer.js beim Abruf fuellt
 * (newsStand) - kein Sonderweg, den es nur im Test gibt. */
function newsstand(jetzt) {
  const ZEILEN = [
    'Kunstmarkt schliesst fester - Halbleiter fuehren die Erholung an',
    'KUNSTA1 hebt Jahresprognose an, Aktie im Kunsthandel deutlich im Plus',
    'Notenbank der Kunstwelt laesst den Leitzins unveraendert',
    'KUNSTB2 kuendigt Aktienrueckkauf ueber zwei Milliarden Kunst-Dollar an',
    'Rohstoffe: Kunstoel gibt nach, Kunstgold haelt sich ueber der Marke',
    'KUNSTC3 verschiebt den Produktionsstart des neuen Werks um ein Quartal',
    'Kunstindex erreicht den hoechsten Stand seit vier Kunstmonaten',
    'KUNSTD4 und KUNSTE5 pruefen einen Zusammenschluss, sagen Kunstkreise',
    'Anleihen: Kunstrenditen fallen nach schwaecheren Kunst-Arbeitsmarktdaten',
    'KUNSTF6 meldet Rekordumsatz, warnt aber vor hoeheren Kunstkosten',
    'Kunstaufsicht prueft die Uebernahme im Kunst-Energiesektor',
    'KUNSTG7 verliert nach der Herabstufung durch ein Kunsthaus'
  ];
  /* Von juengster zu aeltester, in Abstaenden von je acht Minuten - damit steht am
   * Kopf des Bandes "vor 3 Min" und am Ende "vor 1 Std 27". */
  const items = ZEILEN.map((t, i) => ({
    title: t,
    url: 'https://example.invalid/kunst-nachricht-' + (i + 1),
    source: 'Kunstquelle',
    t: jetzt - (3 + i * 8) * 60000
  }));
  return { zeit: jetzt, items: items };
}

module.exports = { bauen: bauen, kostenmessung: kostenmessung, archiv: archiv,
                   newsstand: newsstand,
                   marktStammdaten: marktStammdaten, marktArchiv: marktArchiv,
                   marktKurse: marktKurse, marktstand: marktstand,
                   KUNST_SYMBOLE: KUNST_SYMBOLE, KUNST_SEKTOREN: KUNST_SEKTOREN };

if (require.main === module) {
  process.stdout.write(JSON.stringify(bauen(Date.now()), null, 2) + '\n');
}
