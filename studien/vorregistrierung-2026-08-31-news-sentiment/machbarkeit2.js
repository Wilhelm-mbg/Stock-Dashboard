'use strict';
/* Zweite Machbarkeitsfrage: wie viele UNABHAENGIGE Beobachtungen sind das wirklich?
 * Ein wiederholter Score aus unveraendertem Schlagzeilen-Fenster ist keine neue
 * Beobachtung, sondern dieselbe noch einmal. */
var fs = require('fs'), path = require('path');
var Q = require('../../quant.js');
var KOP = path.join(__dirname, 'store-kopie');
function sommer(ms) { return Q.usSommerzeit(new Date(ms)); }
function schlussMs(y, m, d) { var p = Date.UTC(y, m - 1, 16, 0, 0); return Date.UTC(y, m - 1, d, sommer(p) ? 20 : 21, 0, 0); }
var syms = fs.readdirSync(KOP).map(function (f) { return f.replace(/^newsarchiv_|\.json$/g, ''); });
var alle = {};
syms.forEach(function (s) {
  alle[s] = JSON.parse(fs.readFileSync(path.join(KOP, 'newsarchiv_' + s + '.json'), 'utf8')).items
    .map(function (x) { return { t: x[0], title: x[1] }; }).filter(function (x) { return x.t > 0; })
    .sort(function (a, b) { return a.t - b.t; });
});
var TAGE = ['2026-08-10','2026-08-11','2026-08-12','2026-08-13','2026-08-14','2026-08-17','2026-08-18','2026-08-19','2026-08-20','2026-08-21'];

/* (1) Wann sind die Meldungen ueberhaupt eingetroffen? */
var jeTag = {};
syms.forEach(function (s) { alle[s].forEach(function (it) {
  var k = new Date(it.t - (sommer(it.t) ? 4 : 5) * 3600000).toISOString().slice(0, 10);
  jeTag[k] = (jeTag[k] || 0) + 1;
}); });
console.log('Meldungen je NY-Kalendertag (Erscheinungsstempel):');
Object.keys(jeTag).sort().forEach(function (k) { console.log('  ' + k + '  ' + jeTag[k]); });

/* (2) Symbol-Tage: Score, und ob das Fenster gegenueber dem Vortag NEU ist. */
console.log('\nSymbol-Tage, Score != 0, aufgeschluesselt nach Frische des Fensters:');
var nGesamt = 0, nNeu = 0, jeTagScore = {}, jeSymNeu = {};
syms.forEach(function (s) {
  var vorher = null;
  TAGE.forEach(function (tk) {
    var p = tk.split('-');
    var cut = schlussMs(+p[0], +p[1], +p[2]);
    var f = alle[s].filter(function (x) { return x.t <= cut; }).slice(-12);
    if (!f.length) return;
    var sc = Q.sentiment(f, cut).score;
    if (sc === 0) { vorher = f.map(function (x) { return x.title; }).join('|'); return; }
    nGesamt++;
    var sig = f.map(function (x) { return x.title; }).join('|');
    var neu = (sig !== vorher);
    if (neu) { nNeu++; jeSymNeu[s] = (jeSymNeu[s] || 0) + 1; jeTagScore[tk] = (jeTagScore[tk] || 0) + 1; }
    vorher = sig;
  });
});
console.log('  Symbol-Tage mit Score != 0 gesamt:              ' + nGesamt);
console.log('  davon mit VERAENDERTEM Schlagzeilen-Fenster:    ' + nNeu);
console.log('  reine Wiederholungen (dasselbe Fenster nochmal): ' + (nGesamt - nNeu));
console.log('\n  Verteilung der ' + nNeu + ' frischen Beobachtungen auf Handelstage:');
Object.keys(jeTagScore).sort().forEach(function (k) { console.log('    ' + k + '  ' + jeTagScore[k] + ' Symbole'); });
console.log('  -> Zahl der ZEITPUNKTE (Tage mit >=1 frischer Beobachtung): ' + Object.keys(jeTagScore).length);
console.log('\n  je Symbol: ' + syms.map(function (s) { return s + ':' + (jeSymNeu[s] || 0); }).join('  '));
