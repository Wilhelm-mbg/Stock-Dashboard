'use strict';
/* Simulation des Edge-Waechters auf dem 60m-Archiv.
 * Ziel: WIE OFT waere der Waechter ueberhaupt in Pause gewesen?
 * Ohne diese Zahl ist jede Fallzahlrechnung fuer eine Messung des Waechters Erfindung.
 * Die Regeln sind woertlich aus depot.js edgeZustand()/pilotMessen() uebernommen. */
var fs = require('fs');
var path = require('path');
var Q = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/quant.js');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv60m';

var BASIS = 'AAPL MSFT NVDA GOOGL AMZN META TSLA AMD AVGO TSM ASML INTC QCOM MU ARM'.split(' ');
var VOLATIL = ('MU ARM TEAM INTC ZS AMD LRCX MDB DDOG NET KLAC AMAT SNOW NOW QCOM WDAY SNAP SHOP IBM ORCL INTU ASML CRWD UAL TXN TSLA AVGO PANW ADBE CRM DASH TSM RCL').split(' ');
var LIVE = [];
BASIS.concat(VOLATIL).forEach(function (s) { if (LIVE.indexOf(s) === -1) LIVE.push(s); });

var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };
var H = 8;                       // Haltedauer wie live/Messung
var FENSTER_MS = 120 * 86400000; // 120 Tage rollend
var VERFALL_T = -1;

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

/* --- Kerzen laden --- */
var U = {};
LIVE.forEach(function (s) {
  var f = path.join(ARCHIV, 'bars_60m_' + s + '.json');
  if (!fs.existsSync(f)) { console.log('FEHLT: ' + s); return; }
  var j = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (j && Array.isArray(j.series) && j.series.length) U[s] = j.series;
});
var syms = Object.keys(U);
console.log('Live-Universum geladen: ' + syms.length + ' von ' + LIVE.length + ' Werten');

/* --- Signale einmal berechnen (Zeitstempel + Rendite ueber H) --- */
var SIG = {};   // sym -> [{ms, i, r}]
var gesamtSignale = 0;
syms.forEach(function (sym) {
  var bars = U[sym];
  var c = bars.map(function (b) { return b[1]; });
  var liste = [], cool = 0;
  for (var i = 300; i < bars.length - H; i++) {
    var s = null;
    try { s = Q.einstiegSignal(bars, i, P); } catch (e) { }
    if (!s || s.dir !== 'call') continue;
    if (bars[i][0] - cool < 120 * 60000) continue;   // Abklingzeit wie im Waechter
    cool = bars[i][0];
    if (!(c[i] > 0) || !(c[i + H] > 0)) continue;
    liste.push({ ms: bars[i][0], i: i, r: c[i + H] / c[i] - 1 });
  }
  SIG[sym] = liste;
  gesamtSignale += liste.length;
});
console.log('Signale im Live-Universum gesamt: ' + gesamtSignale);

/* --- Handelstage der Zeitachse --- */
var tagSatz = {};
syms.forEach(function (s) { U[s].forEach(function (b) { tagSatz[tagVon(b[0])] = 1; }); });
var tage = Object.keys(tagSatz).sort();
console.log('Handelstage: ' + tage.length + '  von ' + tage[0] + ' bis ' + tage[tage.length - 1]);

/* --- Der Waechter, wie er in depot.js rechnet, aber zum Stichtag T --- */
function edgeZustandZu(stichMs) {
  var abT = stichMs - FENSTER_MS;
  var symMittel = [], nGes = 0;
  for (var si = 0; si < syms.length; si++) {
    var sym = syms[si], bars = U[sym];
    if (bars.length < 300) continue;
    var c = bars.map(function (b) { return b[1]; });
    /* Drift des Symbols im selben Fenster (A9), Schrittweite H */
    var ds = 0, dn = 0;
    for (var i = 0; i < c.length - H; i += H) {
      if (bars[i][0] < abT || bars[i + H][0] > stichMs) continue;
      if (!(c[i] > 0) || !(c[i + H] > 0)) continue;
      ds += c[i + H] / c[i] - 1; dn++;
    }
    var drift = dn ? ds / dn : 0;
    var us = [];
    var L = SIG[sym];
    for (var k = 0; k < L.length; k++) {
      if (L[k].ms < abT) continue;
      if (bars[L[k].i + H][0] > stichMs) continue;   // Ergebnis muss vorliegen
      us.push(L[k].r - drift);
      nGes++;
    }
    if (us.length >= 2) symMittel.push(us.reduce(function (a, b) { return a + b; }, 0) / us.length);
  }
  var n = symMittel.length;
  if (n < 5) return { n: nGes, nSym: n, rohMittel: null, rohT: null };
  var m = symMittel.reduce(function (a, b) { return a + b; }, 0) / n;
  var sd = Math.sqrt(symMittel.reduce(function (a, b) { return a + (b - m) * (b - m); }, 0) / (n - 1));
  var t = sd > 0 ? m / (sd / Math.sqrt(n)) : 0;
  return { n: nGes, nSym: n, rohMittel: m, rohT: t, mde: sd > 0 ? 2 * sd / Math.sqrt(n) : null };
}

/* --- Naechtlich durchlaufen --- */
var historie = [];        // wie a.edgeHistorie: [0] ist die juengste
var pause = null;         // wie D.intraday.edgePause
var protokoll = [];       // je Handelstag: {tag, pauseAktiv, rohT, verfall, n}
var pausenWechsel = [];

tage.forEach(function (tag) {
  /* Der Waechter laeuft NACHTS: der Zustand fuer Tag d beruht auf der Messung
   * nach Handelsschluss von d-1. Deshalb erst die Pause anwenden, dann messen. */
  protokoll.push({ tag: tag, pauseAktiv: !!pause });

  var stichMs = Date.parse(tag + 'T23:59:59Z');
  var edge = edgeZustandZu(stichMs);
  var roh = edge.rohMittel, rohT = edge.rohT;
  var verfall = roh != null && (edge.nSym || 0) >= 5 && rohT != null && rohT <= VERFALL_T;
  var vorig = historie[0] || null;
  var zuwachs = (vorig && typeof vorig.n === 'number') ? (edge.n || 0) - vorig.n : null;
  historie.unshift({ at: tag, mittel: roh, t: rohT, verfall: verfall, n: edge.n || 0, zuwachs: zuwachs });
  if (historie.length > 30) historie = historie.slice(0, 30);
  var echteZweite = zuwachs != null && isFinite(zuwachs) && zuwachs > 0;
  if (verfall && historie.length >= 2 && historie[1].verfall && echteZweite && !pause) {
    pause = { seit: tag, t: rohT };
    pausenWechsel.push({ tag: tag, art: 'PAUSE', t: rohT, mittel: roh });
  }
  if (!verfall && roh != null && roh > 0 && pause) {
    pausenWechsel.push({ tag: tag, art: 'FREI', t: rohT, mittel: roh, seit: pause.seit });
    pause = null;
  }
  protokoll[protokoll.length - 1].rohT = rohT;
  protokoll[protokoll.length - 1].verfall = verfall;
  protokoll[protokoll.length - 1].n = edge.n;
  protokoll[protokoll.length - 1].nSym = edge.nSym;
});

/* --- Auswertung --- */
var schnittTag = tage[Math.floor(tage.length * 0.5)];
console.log('Schnitt (halbe Handelstage): ' + schnittTag);

function zaehle(filter, name) {
  var teil = protokoll.filter(filter);
  var mitPause = teil.filter(function (p) { return p.pauseAktiv; });
  var verfallTage = teil.filter(function (p) { return p.verfall; });
  console.log(name + ': ' + teil.length + ' Handelstage, davon ' + mitPause.length +
    ' mit aktiver Pause (' + (teil.length ? (mitPause.length / teil.length * 100).toFixed(1) : '0') + ' %), ' +
    verfallTage.length + ' Naechte mit VERFALL-Messung (' + (teil.length ? (verfallTage.length / teil.length * 100).toFixed(1) : '0') + ' %)');
  return { tage: teil.length, pause: mitPause.length, verfall: verfallTage.length };
}
var ges = zaehle(function () { return true; }, 'GESAMT');
var ent = zaehle(function (p) { return p.tag < schnittTag; }, 'ENTDECKUNG');
var bes = zaehle(function (p) { return p.tag >= schnittTag; }, 'BESTAETIGUNG');

console.log('\nPausen-Wechsel (' + pausenWechsel.length + '):');
pausenWechsel.forEach(function (w) { console.log('  ' + w.tag + ' ' + w.art + '  t=' + (w.t != null ? w.t.toFixed(2) : '-') + '  mittel=' + (w.mittel != null ? (w.mittel * 100).toFixed(3) + ' Pp' : '-')); });

/* Wie viele SIGNALE fielen auf Pausentage? Das ist die Fallzahl, die eine
 * Messung des Waechters ueberhaupt tragen kann. */
var pauseTag = {};
protokoll.forEach(function (p) { if (p.pauseAktiv) pauseTag[p.tag] = 1; });
var sigGes = 0, sigPause = 0, sigGesB = 0, sigPauseB = 0;
var pausTageMitSignal = {};
syms.forEach(function (sym) {
  SIG[sym].forEach(function (s) {
    var t = tagVon(s.ms);
    sigGes++;
    if (pauseTag[t]) { sigPause++; pausTageMitSignal[t] = 1; }
    if (t >= schnittTag) { sigGesB++; if (pauseTag[t]) sigPauseB++; }
  });
});
console.log('\nSignale gesamt ' + sigGes + ', davon auf Pausentagen ' + sigPause +
  ' (' + (sigGes ? (sigPause / sigGes * 100).toFixed(2) : 0) + ' %)');
console.log('Bestaetigungshaelfte: ' + sigGesB + ' Signale, davon auf Pausentagen ' + sigPauseB +
  ' (' + (sigGesB ? (sigPauseB / sigGesB * 100).toFixed(2) : 0) + ' %)');
console.log('Pausentage MIT mindestens einem Signal: ' + Object.keys(pausTageMitSignal).length);

/* t-Verteilung des Waechters ueber die Zeit - wie nah ist er ueberhaupt an -1? */
var ts = protokoll.map(function (p) { return p.rohT; }).filter(function (x) { return x != null && isFinite(x); });
ts.sort(function (a, b) { return a - b; });
function qtl(p) { return ts[Math.min(ts.length - 1, Math.floor(p * ts.length))]; }
console.log('\nt-Werte des Waechters ueber ' + ts.length + ' Naechte: min ' + ts[0].toFixed(2) +
  ' | 10% ' + qtl(0.1).toFixed(2) + ' | Median ' + qtl(0.5).toFixed(2) + ' | 90% ' + qtl(0.9).toFixed(2) +
  ' | max ' + ts[ts.length - 1].toFixed(2));

fs.writeFileSync(process.argv[2] || 'waechter-sim.json', JSON.stringify({
  universum: syms, signale: gesamtSignale, tage: tage.length, schnittTag: schnittTag,
  gesamt: ges, entdeckung: ent, bestaetigung: bes,
  pausenWechsel: pausenWechsel, protokoll: protokoll,
  signalzahlen: { gesamt: sigGes, aufPause: sigPause, bestaetigung: sigGesB, bestaetigungAufPause: sigPauseB }
}, null, 1));
console.log('\ngeschrieben.');
