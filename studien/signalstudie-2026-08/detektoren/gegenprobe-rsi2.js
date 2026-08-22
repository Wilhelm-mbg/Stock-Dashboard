// Gegenpruefung rsi2 (Skeptiker): (1) Praefix-Probe mit Schwerpunkt am Reihenende,
// (2) Snippet vs. Live-Pfad (fertigeBars + rsiExtremSignal auf der ganzen bekannten Reihe),
// (3) Wirkung der 5-Min-Bestaetigung (mtf, Default true) auf 1m-Signale,
// (4) Rasterfremde Stempel im Archiv.
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = process.argv[2] || '1m';
var SYMS = (process.argv[3] || 'NVDA,MU,GOOGL').split(',');
var N = parseInt(process.argv[4] || '300', 10);
var BARMIN = { '1m': 1, '5m': 5, '15m': 15, '60m': 60 }[IV];

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(424242);

// Snippet des Pruefers (woertlich)
function rsi2(bars, i, params) {
  var p = params || {};
  var win = bars.slice(Math.max(0, i - (p.window || 260)), i + 1);
  var s = Q.rsiExtremSignal(win, p.kaufSchwelle || 10, p.verkaufSchwelle || 90);
  return s.signal ? { dir: s.signal === 'call' ? 1 : -1 } : null;
}
function d(r) { return r ? r.dir : 0; }

var tot = 0, abw = 0, endeTot = 0, endeAbw = 0, liveAbw = 0, liveN = 0, sigN = 0, mtfBlock = 0, mtfN = 0, raster = 0;
SYMS.forEach(function (sym) {
  var bars = JSON.parse(fs.readFileSync(STORE + 'bars_' + IV + '_' + sym + '.json', 'utf8')).series;
  var n = bars.length;
  // Rasterfremde Stempel
  var rf = 0;
  for (var k = 0; k < n; k++) { var dt = new Date(bars[k][0]); if (dt.getUTCSeconds() !== 0 || (BARMIN >= 5 && dt.getUTCMinutes() % BARMIN !== (BARMIN === 60 ? 30 : 0))) rf++; }
  raster += rf;
  var idx = [];
  for (var k2 = 0; k2 < N; k2++) idx.push(130 + Math.floor(rnd() * (n - 130)));
  for (var e = n - 60; e < n; e++) idx.push(e);            // die letzten 60 Stellen IMMER
  var lAbw = 0, lEnde = 0, lSig = 0, lLive = 0, lMtf = 0;
  idx.forEach(function (i) {
    var a = rsi2(bars.slice(0, i + 1), i);
    var b = rsi2(bars, i);
    // Zukunft manipuliert: Kurse UND Zeitstempel (Stempel koennten Fensterlaengen verschieben)
    var mani = bars.slice();
    for (var j = i + 1; j < n; j++) mani[j] = [bars[j][0] + 1, bars[j][1] * (1 + (rnd() - 0.5) * 0.3), bars[j][2] * 2, bars[j][3], bars[j][4]];
    var c = rsi2(mani, i);
    tot++;
    var bad = d(a) !== d(b) || d(a) !== d(c);
    if (bad) { abw++; lAbw++; }
    if (i >= n - 60) { endeTot++; if (bad) { endeAbw++; lEnde++; } }
    if (d(a)) { sigN++; lSig++; }
    // Live-Pfad: ganze bekannte Reihe, fertigeBars mit now = Kerzenstart + Kerzenlaenge
    var bekannt = bars.slice(0, i + 1);
    var sigBars = Q.fertigeBars(bekannt, BARMIN, bars[i][0] + BARMIN * 60000);
    var live = Q.rsiExtremSignal(sigBars).signal || null;
    var liveDir = live === 'call' ? 1 : live === 'put' ? -1 : 0;
    liveN++;
    if (liveDir !== d(a)) { liveAbw++; lLive++; }
    // MTF-Gate (1m): Live (depot.js:2775) und Backtest (quant.js:1743) verlangen mtfAgrees
    if (IV === '1m' && d(a)) {
      var win = bars.slice(Math.max(0, i - 260), i + 1);
      mtfN++;
      if (!Q.mtfAgrees(win, d(a) === 1 ? 'call' : 'put', 5)) { mtfBlock++; lMtf++; }
    }
  });
  console.log(sym, IV, 'Kerzen=' + n, 'rasterfremd=' + rf, 'geprueft=' + idx.length, 'Abw=' + lAbw, 'davon Ende(60)=' + lEnde, 'Signale=' + lSig, 'Live!=Snippet=' + lLive, IV === '1m' ? 'MTF blockt=' + lMtf : '');
});
console.log('GESAMT geprueft=' + tot + ' Abweichungen=' + abw + ' (' + ((tot - abw) / tot * 100).toFixed(1) + '% Treffer) | Reihenende: ' + endeAbw + '/' + endeTot + ' | Signale=' + sigN);
console.log('Live-Pfad (ganze bekannte Reihe + fertigeBars) vs. Snippet (261): ' + liveAbw + '/' + liveN + ' abweichend');
if (IV === '1m') console.log('MTF-Gate (mtf=true Default, 1m): blockt ' + mtfBlock + ' von ' + mtfN + ' Snippet-Signalen (' + (mtfBlock / Math.max(1, mtfN) * 100).toFixed(0) + '%)');
console.log('Rasterfremde Stempel gesamt: ' + raster);
