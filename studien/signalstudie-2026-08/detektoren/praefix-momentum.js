'use strict';
/* Praefix-Probe (Zukunftsblick) fuer den Momentum-Querschnitt auf dem 60m-Archiv.
 * Fuer zufaellige Indizes i: Signal auf bars.slice(0,i+1) mit Universum auf t<=bars[i].t
 * gekappt und neu vorbereitet  ===  Signal auf der ganzen Reihe/ganzem Universum an Stelle i.
 * Zufallsgenerator: mulberry32, EIN Generator ausserhalb der Schleife. */
var fs = require('fs');
var MOM = require('./momentum.js');
var DIR = 'C:/Users/Wilhe/AppData/Roaming/markt-dashboard/store/';
var SYMS = ['NVDA', 'PLTR', 'INTC'];
var N_TAG = 200, N_BELIEBIG = 70, SEED = 20260822;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
var rnd = mulberry32(SEED);

var uni = {};
fs.readdirSync(DIR).filter(function (f) { return /^bars_60m_/.test(f); }).forEach(function (f) {
  uni[f.slice(9, -5)] = JSON.parse(fs.readFileSync(DIR + f, 'utf8')).series;
});
var vbVoll = MOM.vorbereiten(uni);

function kappe(tMax) {
  var u = {};
  Object.keys(uni).forEach(function (s) {
    var b = uni[s], n = 0;
    while (n < b.length && b[n][0] <= tMax) n++;
    u[s] = b.slice(0, n);
  });
  return u;
}
function gleich(a, b) { return (a == null && b == null) || (a != null && b != null && a.dir === b.dir && a.rang === b.rang && a.n === b.n); }

var geprueft = 0, abw = 0, nichtNull = 0, beispiele = [];
SYMS.forEach(function (sym) {
  var bars = uni[sym];
  var erste = [];   // Indizes erster Bars eines Tages ab Tag 252 (davor gibt es nie ein Signal)
  var tagNr = -1;
  for (var i = 1; i < bars.length; i++) {
    if (MOM.nyTag(bars[i][0]) !== MOM.nyTag(bars[i - 1][0])) { tagNr++; if (tagNr >= 252) erste.push(i); }
  }
  var kand = [];
  for (var k = 0; k < N_TAG; k++) kand.push(erste[Math.floor(rnd() * erste.length)]);
  for (var k2 = 0; k2 < N_BELIEBIG; k2++) kand.push(1 + Math.floor(rnd() * (bars.length - 1)));
  kand.forEach(function (i) {
    var voll = MOM.momentumSignal(bars, i, { sym: sym, vb: vbVoll });
    var vbP = MOM.vorbereiten(kappe(bars[i][0]));
    var prae = MOM.momentumSignal(bars.slice(0, i + 1), i, { sym: sym, vb: vbP });
    geprueft++;
    if (voll) nichtNull++;
    if (!gleich(voll, prae)) { abw++; if (beispiele.length < 10) beispiele.push({ sym: sym, i: i, tag: MOM.nyTag(bars[i][0]), voll: voll, prae: prae }); }
  });
  console.log(sym + ': ' + kand.length + ' Indizes geprueft');
});
console.log('Geprueft: ' + geprueft + '  davon Signal != null: ' + nichtNull + '  Abweichungen: ' + abw +
  '  Trefferquote: ' + ((geprueft - abw) / geprueft * 100).toFixed(2) + ' %');
if (beispiele.length) console.log('Beispiele:', JSON.stringify(beispiele, null, 1));
console.log('Urteil: ' + (abw === 0 ? 'walk-forward' : 'ZUKUNFTSBLICK'));
