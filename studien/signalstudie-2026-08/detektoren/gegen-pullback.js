/* Gegenpruefung Pullback (Skeptiker).
 * 1) Archiv-Inspektion: Kerzen je Tag, Stempel, Nicht-Sitzungskerzen, Duplikate
 * 2) Praefix-Probe NAHE AM ENDE (letzte 60 Indizes je Symbol, alle) + Zufall (mulberry32)
 * 3) Live-Simulation: Yahoo 5d-Reihe (alle Sitzungskerzen der letzten 5 Handelstage bis i,
 *    variabel 313..390 Bars) vs. Snippet (Fenster 260) - Vollsweep, 6 Symbole
 * 4) Snippet des Pruefers 1:1 ausfuehren */
var fs = require('fs');
var Q = require('../../../quant.js');
var STORE = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var IV = '5m';
var SYMS = ['AAPL', 'NVDA', 'MSFT', 'AMZN', 'TSLA', 'SPY'];

// Snippet des Pruefers, woertlich
function pullbackSig(bars, i, params) {
  var p = params || {}, period = p.period || 20, conf = p.confirmBps === undefined ? 15 : p.confirmBps;
  var win = bars.slice(Math.max(0, i - Math.max(period * 4, 260)), i + 1);
  var s = Q.pullbackSignal(win, p.lineType || 'ema', period, conf);
  return s.signal === 'call' ? { dir: +1 } : s.signal === 'put' ? { dir: -1 } : null;
}
function dirOf(r) { return r ? r.dir : null; }
function sigLive(bars, i) {
  // Yahoo range=5d: alle Kerzen der letzten 5 Handelstage (inkl. heutigem Teil) bis i
  var tage = [], j;
  for (j = i; j >= 0; j--) {
    var d = new Date(bars[j][0]).toISOString().slice(0, 10);
    if (tage[tage.length - 1] !== d) { if (tage.length === 5) break; tage.push(d); }
  }
  var win = bars.slice(j + 1, i + 1);
  var s = Q.pullbackSignal(win, 'ema', 20, 15);
  return s.signal === 'call' ? +1 : s.signal === 'put' ? -1 : null;
}
function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(4711);

var G = { praefEnde: 0, praefEndeN: 0, praefZuf: 0, praefZufN: 0, liveAbw: 0, liveN: 0, sigSnip: 0, sigLive: 0, liveAbwBsp: [] };
SYMS.forEach(function (sym) {
  var f = STORE + 'bars_' + IV + '_' + sym + '.json';
  if (!fs.existsSync(f)) { console.log(sym, 'fehlt'); return; }
  var raw = JSON.parse(fs.readFileSync(f, 'utf8')).series;
  // 1) Archiv-Inspektion
  var perDay = {}, nonSess = 0, stamps = 0, dup = 0, unsorted = 0, volNull = 0;
  for (var k = 0; k < raw.length; k++) {
    var t = raw[k][0], d = new Date(t), wt = d.getUTCDay(), m = Q.minutenSeitOeffnung(t);
    var day = d.toISOString().slice(0, 10);
    perDay[day] = (perDay[day] || 0) + 1;
    if (!(wt >= 1 && wt <= 5 && m >= 0 && m < 390)) nonSess++;
    if (m === 390) stamps++;
    if (k && raw[k][0] === raw[k - 1][0]) dup++;
    if (k && raw[k][0] < raw[k - 1][0]) unsorted++;
    if (!raw[k][2]) volNull++;
  }
  var counts = Object.keys(perDay).map(function (x) { return perDay[x]; });
  var hist = {}; counts.forEach(function (c) { hist[c] = (hist[c] || 0) + 1; });
  console.log(sym, 'roh=' + raw.length, 'Tage=' + counts.length, 'KerzenJeTag=' + JSON.stringify(hist), 'nichtSitzung=' + nonSess, 'Stempel(m=390)=' + stamps, 'Dup=' + dup, 'unsortiert=' + unsorted, 'vol0=' + volNull);
  var bars = raw.filter(function (b) { var d = new Date(b[0]); var wt = d.getUTCDay(); var m = Q.minutenSeitOeffnung(b[0]); return wt >= 1 && wt <= 5 && m >= 0 && m < 390; });
  var n = bars.length;
  // 2a) Praefix nahe am Ende: ALLE letzten 60 Indizes
  for (var i = n - 60; i < n; i++) {
    var full = dirOf(Q.einstiegSignal(bars, i, { ENTRY: 'pullback', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2, MINQ: 0, CHAN: false, MTF: false, TREND: false }));
    var pre = dirOf(Q.einstiegSignal(bars.slice(0, i + 1), i, { ENTRY: 'pullback', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2, MINQ: 0, CHAN: false, MTF: false, TREND: false }));
    G.praefEndeN++; if (full !== pre) G.praefEnde++;
    // Scharfe Variante: Praefix ueber ROH-Reihe (mit Stempel) vs. Snippet - Stempel darf nicht wirken, wenn gefiltert
  }
  // 2b) Praefix Zufall, 300 je Symbol, davon Snippet
  for (var r = 0; r < 300; r++) {
    var ii = 260 + Math.floor(rnd() * (n - 260));
    var a = dirOf(pullbackSig(bars, ii)), b = dirOf(pullbackSig(bars.slice(0, ii + 1), ii));
    G.praefZufN++; if (a !== b) G.praefZuf++;
  }
  // 3) Live-Simulation (variable 5d-Reihe) vs. Snippet - Vollsweep ab Bar 400
  for (var q = 400; q < n; q++) {
    var s1 = dirOf(pullbackSig(bars, q)), s2 = sigLive(bars, q);
    G.liveN++; if (s1 != null) G.sigSnip++; if (s2 != null) G.sigLive++;
    if (s1 !== s2) { G.liveAbw++; if (G.liveAbwBsp.length < 8) G.liveAbwBsp.push(sym + ' ' + new Date(bars[q][0]).toISOString() + ' snippet=' + s1 + ' live=' + s2); }
  }
});
console.log('PRAEFIX Ende (letzte 60 je Symbol): ' + G.praefEnde + '/' + G.praefEndeN + ' Abweichungen');
console.log('PRAEFIX Zufall (Snippet): ' + G.praefZuf + '/' + G.praefZufN + ' Abweichungen');
console.log('LIVE-Simulation (5d-Reihe 313..390 Bars) vs Snippet (260): ' + G.liveAbw + '/' + G.liveN + ' Abweichungen; Signale Snippet=' + G.sigSnip + ' Live=' + G.sigLive);
G.liveAbwBsp.forEach(function (x) { console.log('  ', x); });
