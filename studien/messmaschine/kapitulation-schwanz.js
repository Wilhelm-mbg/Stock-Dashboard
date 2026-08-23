'use strict';
/* SCHWANZ-KENNZAHLEN ZUM KAPITULATIONS-DIP.
 *
 * In der Vorregistrierung vom 24.08.2026 ausdruecklich als KENNZAHL angekuendigt,
 * nicht als Ausschlussgrund - nachtraegliches Weglassen von Faellen verbietet B7.
 *
 * Der Anlass steht seit dem 21.08. im Quelltext von quant.js:
 *   "Der Gewinn sitzt im rechten Schwanz. Ohne die besten 5 % der Trades faellt das
 *    Mittel UNTER die Drift-Basislinie (+0,72 % -> -0,06 % gegen +0,56 % Drift)."
 * Das war gegen die Drift-Basislinie gerechnet. Hier wird dieselbe Frage gegen die
 * GEPAARTE KONTROLLE gestellt - also gegen das, was derselbe Wert zur selben
 * Stunde ohnehin getan haette.
 *
 * Warum das zaehlt: Eine Kante, die nur ueber wenige grosse Erholungen laeuft, ist
 * nicht dieselbe Sache wie eine Kante, die viele kleine Vorteile summiert. Bei der
 * ersten entscheidet, ob man beim Ausreisser dabei war - und ob man ihn ueberhaupt
 * halten konnte. Der Not-Stop bei -25 % im Schein wuerde genau diese Trades kappen.
 *
 * Aufruf: node studien/messmaschine/kapitulation-schwanz.js
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var M = require('./messmaschine.js');
var S = require('./strategien/kapitulation.js');

var ARCHIV = process.argv[2] ||
  path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');

/* Die Maschine liefert Kennzahlen, aber nicht die Einzeltrades. Fuer die
 * Schwanzfrage werden sie hier noch einmal erzeugt - mit DERSELBEN Kontrolle
 * (A7, Lesefenster ausgelassen), damit die Zahlen vergleichbar bleiben. */
var Q = require('../../quant.js');
var P = { ENTRY: 'kapitulation', LINE: 'ema', period: 20, confirmBps: 15, ZTHR: 2.0,
          MINQ: 0, CHAN: false, MTF: false, TREND: false };
var H = S.haltedauerKerzen, VOR = 261, FENSTER = S.leseFensterKerzen;

var dateien = fs.readdirSync(ARCHIV).filter(function (f) { return f.indexOf('bars_60m_') === 0; });
var U = {};
dateien.forEach(function (f) {
  var sym = f.slice(9, -5);
  if (sym.indexOf('-USD') !== -1) return;
  try { var j = JSON.parse(fs.readFileSync(path.join(ARCHIV, f), 'utf8')); if (j.series && j.series.length) U[sym] = j.series; } catch (e) { }
});

/* Schnitttag genau wie die Maschine ihn setzt. */
var alleTage = {};
Object.keys(U).forEach(function (s) { U[s].forEach(function (b) { alleTage[new Date(b[0]).toISOString().slice(0, 10)] = 1; }); });
var tage = Object.keys(alleTage).sort();
var schnitt = tage[Math.floor(tage.length * 0.5)];

var K = M._intern.baueKontrolle(U, H, schnitt, VOR, null, {});
var trades = [];
Object.keys(U).forEach(function (sym) {
  var b = U[sym];
  for (var i = VOR; i < b.length - H; i++) {
    var s = null; try { s = Q.einstiegSignal(b, i, P); } catch (e) { continue; }
    if (!s || s.dir !== 'call') continue;
    var s0 = b[i][1], sH = b[i + H][1];
    if (!(s0 > 0) || !(sH > 0)) continue;
    var tag = new Date(b[i][0]).toISOString().slice(0, 10);
    var hf = tag < schnitt ? 'entdeckung' : 'bestaetigung';
    var erw = K.erwartung(sym, new Date(b[i][0]).getUTCHours(), hf, i - FENSTER, i + H - 1);
    if (erw == null) continue;
    trades.push({ sym: sym, tag: tag, hf: hf, roh: sH / s0 - 1, ueber: (sH / s0 - 1) - erw });
  }
});

function pp(x) { return ((x >= 0 ? '+' : '') + (x * 100).toFixed(3)); }
function auswerten(name, liste) {
  if (!liste.length) { console.log(name + ': keine Trades'); return; }
  var sortiert = liste.slice().sort(function (a, b) { return a.ueber - b.ueber; });
  function mittel(a) { return a.reduce(function (x, y) { return x + y.ueber; }, 0) / a.length; }
  var n = sortiert.length;
  var ohne5 = sortiert.slice(0, Math.floor(n * 0.95));
  var ohne1 = sortiert.slice(0, Math.floor(n * 0.99));
  var beste5 = sortiert.slice(Math.floor(n * 0.95));
  console.log('\n' + name + '  (' + n + ' Trades)');
  console.log('  Mittel Ueberschuss        ' + pp(mittel(sortiert)).padStart(9) + ' Pp');
  console.log('  Median Ueberschuss        ' + pp(sortiert[n >> 1].ueber).padStart(9) + ' Pp');
  console.log('  ohne die besten 1 %       ' + pp(mittel(ohne1)).padStart(9) + ' Pp');
  console.log('  ohne die besten 5 %       ' + pp(mittel(ohne5)).padStart(9) + ' Pp   <- die Frage aus quant.js');
  console.log('  nur die besten 5 %        ' + pp(mittel(beste5)).padStart(9) + ' Pp');
  console.log('  Anteil positiv            ' + (100 * sortiert.filter(function (t) { return t.ueber > 0; }).length / n).toFixed(1) + ' %');
  console.log('  groesster Einzeltrade     ' + pp(sortiert[n - 1].ueber).padStart(9) + ' Pp  (' + sortiert[n - 1].sym + ', ' + sortiert[n - 1].tag + ')');
  console.log('  schlechtester             ' + pp(sortiert[0].ueber).padStart(9) + ' Pp  (' + sortiert[0].sym + ', ' + sortiert[0].tag + ')');
  /* Wie viele Trades tragen die Haelfte des Gesamtertrags? */
  var summe = sortiert.reduce(function (a, t) { return a + t.ueber; }, 0);
  if (summe > 0) {
    var lauf = 0, zaehler = 0;
    for (var q = n - 1; q >= 0; q--) { lauf += sortiert[q].ueber; zaehler++; if (lauf >= summe / 2) break; }
    console.log('  Haelfte des Ertrags aus    ' + zaehler + ' Trades (' + (100 * zaehler / n).toFixed(1) + ' %)');
  }
}

console.log('KAPITULATIONS-DIP: wo sitzt der Ertrag?');
console.log('Ueberschuss gegen die gepaarte Kontrolle (A7, Lesefenster ' + FENSTER + ' Kerzen ausgelassen).');
console.log('Kennzahl, KEIN Ausschluss - nachtraegliches Weglassen verbietet B7.');
auswerten('Beide Haelften', trades);
auswerten('Entdeckung', trades.filter(function (t) { return t.hf === 'entdeckung'; }));
auswerten('Bestaetigung (das Urteil haengt hieran)', trades.filter(function (t) { return t.hf === 'bestaetigung'; }));
