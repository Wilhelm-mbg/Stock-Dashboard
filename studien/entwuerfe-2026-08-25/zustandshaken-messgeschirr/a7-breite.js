'use strict';
/* A7 fuer einen Zustandshaken: Der Haken liest die ERGEBNISSE der Strategie ueber
 * 120 Tage zurueck. Damit waechst das Lesefenster von 261 Kerzen (~37 Handelstage)
 * auf 261 + 120 Handelstage. Frage: traegt der Kontrolltopf das noch, oder faellt
 * die Messung in F4 (weniger als 20 Vergleichskerzen -> Signal faellt raus)? */
var fs = require('fs');
var path = require('path');
var Q = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/quant.js');
var MM = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/messmaschine/messmaschine.js');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv60m';
var SIM = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
var syms = SIM.universum;
var P = { ENTRY: 'rsi2seit', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 1.5,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };
var H = 8, VORLAUF = 261;

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }
function sitzungsPosition(bars) {
  var p = new Int16Array(bars.length), letzter = null, k = 0;
  for (var i = 0; i < bars.length; i++) {
    var d = new Date(bars[i][0]);
    var tag = d.getUTCFullYear() * 10000 + (d.getUTCMonth() + 1) * 100 + d.getUTCDate();
    if (tag !== letzter) { letzter = tag; k = 0; } else { k++; }
    p[i] = k;
  }
  return p;
}
var U = {};
syms.forEach(function (s) { U[s] = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_60m_' + s + '.json'), 'utf8')).series; });
var alleTage = {};
syms.forEach(function (s) { U[s].forEach(function (b) { alleTage[tagVon(b[0])] = 1; }); });
var tage = Object.keys(alleTage).sort();
var schnittTag = tage[Math.floor(tage.length * 0.5)];
var K = MM._intern.baueKontrolle(U, H, schnittTag, VORLAUF, null, P);

/* Wie viele Kerzen liegen ueberhaupt je Handelstag vor? Daraus die Kerzenzahl
 * fuer 120 Handelstage. */
var kerzenJeTag = {};
syms.forEach(function (s) { U[s].forEach(function (b) { var t = tagVon(b[0]); kerzenJeTag[t] = (kerzenJeTag[t] || 0) + 1; }); });
var proTag = [];
Object.keys(kerzenJeTag).forEach(function (t) { proTag.push(kerzenJeTag[t] / syms.length); });
var mittelProTag = proTag.reduce(function (a, b) { return a + b; }, 0) / proTag.length;
console.log('Kerzen je Wert und Handelstag (Mittel): ' + mittelProTag.toFixed(2));
var FENSTER120 = Math.round(120 * mittelProTag);
console.log('120 Handelstage entsprechen ' + FENSTER120 + ' Kerzen. Lesefenster mit Zustand: ' +
  (VORLAUF + FENSTER120) + ' Kerzen (heute ' + VORLAUF + ').');

[VORLAUF, VORLAUF + FENSTER120].forEach(function (LESE) {
  var n = 0, ohne = 0, nB = 0, ohneB = 0;
  syms.forEach(function (sym) {
    var b = U[sym], POS = sitzungsPosition(b);
    for (var i = VORLAUF; i < b.length - H; i++) {
      var s = null;
      try { s = Q.einstiegSignal(b, i, P); } catch (e) { }
      if (!s || s.dir !== 'call') continue;
      var s0 = b[i][1], sH = b[i + H][1];
      if (!(s0 > 0) || !(sH > 0)) continue;
      var tag = tagVon(b[i][0]), hf = tag < schnittTag ? 'entdeckung' : 'bestaetigung';
      var erw = K.erwartung(sym, POS[i], hf, i - LESE - H, i + H - 1);
      n++; if (hf === 'bestaetigung') nB++;
      if (erw == null) { ohne++; if (hf === 'bestaetigung') ohneB++; }
    }
  });
  console.log('Lesefenster ' + LESE + ' Kerzen: ' + n + ' Signale, ohne Kontrolle ' + ohne +
    ' (' + (ohne / n * 100).toFixed(1) + ' %)  |  Bestaetigung: ' + nB + ', ohne Kontrolle ' + ohneB +
    ' (' + (nB ? (ohneB / nB * 100).toFixed(1) : '0') + ' %)');
});
