/* Gegenpruefung 'kanaltrend':
 *  A) Snippet des Pruefers WOERTLICH (aus dem Bericht kopiert) auf 2 Symbolen ausfuehren
 *  B) Praefix-Probe mit Schwerpunkt NAHE AM ENDE (letzte 400 Kerzen) + Stempel roh vs. bereinigt
 *  C) Vergleich mit dem Live-Pfad (depot.js:2511 signalCross auf ganzer Reihe, Zeile 2710)
 *  D) Laeufe: Anteil Signale, deren Vorgaenger-Kerze schon signalisierte
 *  E) 15m-Zaehlung (im Bericht fehlt 15m) */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';

// --- A) Snippet woertlich ---
function kanaltrend(bars, i, params) {
  var P = Object.assign({ ENTRY: 'kanaltrend', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5, MINQ: 60, CHAN: false, MTF: false, TREND: false }, params || {}, { ENTRY: 'kanaltrend' });
  var s = Q.einstiegSignal(bars, i, P);   // bars: fertige Kerzen [t, c, v, h, l], Stempel-Kerzen vorher entfernt
  return s && s.dir ? { dir: s.dir === 'call' ? 1 : -1 } : null;
}

function mulberry32(a) {
  return function () {
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rnd = mulberry32(424242);

function istStempel(x) { return (x[0] % 60000) !== 0 || (!x[2] && x[3] === x[4] && x[3] === x[1]); }
function ladeRoh(iv, sym) { return JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + sym + '.json', 'utf8')).series; }
function bereinigt(b) { return b.filter(function (x) { return !istStempel(x); }); }

var IV = process.argv[2] || '60m';
var SYMS = (process.argv[3] || 'AAPL,MSFT,NVDA').split(',');
var N_ENDE = 300, N_BREIT = 200;

SYMS.forEach(function (sym) {
  var roh = ladeRoh(IV, sym), b = bereinigt(roh), n = b.length;
  // B) Praefix-Probe: 300 Indizes aus den letzten 400 Kerzen + 200 breit gestreut
  var gepr = 0, ab = 0, sig = 0, bsp = [];
  for (var k = 0; k < N_ENDE + N_BREIT; k++) {
    var i = k < N_ENDE ? (n - 400) + Math.floor(rnd() * 400) : 300 + Math.floor(rnd() * (n - 300));
    var v = kanaltrend(b, i), p = kanaltrend(b.slice(0, i + 1), i);
    gepr++; if (v) sig++;
    if (JSON.stringify(v) !== JSON.stringify(p)) { ab++; if (bsp.length < 5) bsp.push(i); }
  }
  // explizit die letzten 5 Indizes
  for (var j = n - 5; j < n; j++) {
    var v2 = kanaltrend(b, j), p2 = kanaltrend(b.slice(0, j + 1), j);
    gepr++; if (JSON.stringify(v2) !== JSON.stringify(p2)) { ab++; bsp.push('END' + j); }
  }
  console.log('[B]', sym, IV, 'n(bereinigt)=' + n, 'Stempel entfernt=' + (roh.length - n), 'geprueft=' + gepr, 'Signale=' + sig, 'Abweichungen=' + ab, bsp.join(','));

  // B2) Stempel-Einfluss: Signal roh vs. bereinigt an den letzten 12 Kerzen des bereinigten Archivs (gleicher Zeitstempel)
  var diff = 0, gepr2 = 0;
  for (var j2 = n - 12; j2 < n; j2++) {
    var t = b[j2][0];
    var iRoh = roh.findIndex(function (x) { return x[0] === t; });
    var a1 = kanaltrend(b, j2), a2 = kanaltrend(roh, iRoh);
    gepr2++; if (JSON.stringify(a1) !== JSON.stringify(a2)) diff++;
  }
  console.log('[B2]', sym, 'Signal roh(mit Stempel) vs. bereinigt an denselben Zeitstempeln: ' + diff + '/' + gepr2 + ' verschieden');

  // C) Live-Pfad: depot.js rechnet fuer mode 'kanaltrend' nur signalCross(ganze Reihe) (Z. 2511/2710).
  var live = 0, kt = 0, ktOhneCross = 0, gemeinsam = 0, ktCall = 0, ktPut = 0;
  var vorher = null, laufFolge = 0, erstes = 0;
  var win = [];
  for (var i3 = 300; i3 < n; i3++) {
    var s = kanaltrend(b, i3);
    var sc = Q.signalCross(b.slice(0, i3 + 1), 'ema', 20, 15);
    if (sc.crossed) live++;
    if (s) {
      kt++; if (s.dir > 0) ktCall++; else ktPut++;
      if (sc.crossed) gemeinsam++; else ktOhneCross++;
      if (vorher && vorher.dir === s.dir) laufFolge++; else erstes++;
    }
    vorher = s;
  }
  console.log('[C]', sym, 'Live-Pfad(signalCross) Signale=' + live, '| kanaltrend=' + kt, '(call ' + ktCall + ', put ' + ktPut + ')',
    'davon zugleich Live-Kreuzung=' + gemeinsam, 'ohne Live-Kreuzung=' + ktOhneCross);
  console.log('[D]', sym, 'kanaltrend-Signale mit signalisierender Vorgaenger-Kerze=' + laufFolge + '/' + kt, 'eigenstaendige Ereignisse=' + erstes);
});
