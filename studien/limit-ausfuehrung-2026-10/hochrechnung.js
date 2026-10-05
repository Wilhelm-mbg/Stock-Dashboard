'use strict';
/* HOCHRECHNUNG der Vollaufzeit aus dem Pilot (REGEL §8.3).
 *
 *   node hochrechnung.js --pilot pilot-0 pilot-1 pilot-2 pilot-3 [--probe1m <limit-ordner> <minuten-ordner>]
 *
 * Rechenzeit je Zeitrahmen (msJeZr) des Limit-Piloten gegen die des Minuten-Piloten (dieselben 20 Reihen, dieselben
 * vier Teile) ergibt den Faktor; mit ihm wird die Rechenzeit des Minuten-Vollaufs (ergebnis-*-Ordner,
 * fortschritt-teil-k.json) hochgerechnet. Wandzeit = laengster Teil (acht Teile nebeneinander wie im September).
 * Fuer 1m kann ein Ein-Datei-Probelauf beider Geraete den Faktor liefern (--probe1m); sonst gilt der 5m/15m-Faktor.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var MIN_ORDNER = path.join(__dirname, '..', 'vorregistrierung-2026-09-06-signale-minuten');

function lies(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function msZr(F) { return (F.zaehler && F.zaehler.msJeZr) || {}; }
function summe(liste, zr) { return liste.reduce(function (a, F) { return a + (msZr(F)[zr] || 0); }, 0); }

function rechne(a) {
  var lim = a.pilot.map(function (o) { return lies(path.join(__dirname, o, '_fortschritt.json')); });
  var minP = [0, 1, 2, 3].map(function (k) { return lies(path.join(MIN_ORDNER, 'pilot-' + k, '_fortschritt.json')); });
  var voll515 = [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return lies(path.join(MIN_ORDNER, 'ergebnis-5m15m-2026-09-08', 'fortschritt-teil-' + k + '.json')); });
  var voll1 = [0, 1, 2, 3, 4, 5, 6, 7].map(function (k) { return lies(path.join(MIN_ORDNER, 'ergebnis-1m-2026-09-11', 'fortschritt-teil-' + k + '.json')); });
  var aus = { je: {} };
  ['5m', '15m'].forEach(function (zr) {
    var l = summe(lim, zr), m = summe(minP, zr);
    aus.je[zr] = { limitPilotS: l / 1000, minutePilotS: m / 1000, faktor: m ? l / m : null };
  });
  var f515 = (summe(lim, '5m') + summe(lim, '15m')) / (summe(minP, '5m') + summe(minP, '15m'));
  aus.faktor5m15m = f515;
  var f1 = f515;
  if (a.probe1m) {
    var pl = lies(path.join(a.probe1m[0], '_fortschritt.json')), pm = lies(path.join(a.probe1m[1], '_fortschritt.json'));
    f1 = (msZr(pl)['1m'] || 0) / (msZr(pm)['1m'] || 1);
    aus.probe1m = { limitS: (msZr(pl)['1m'] || 0) / 1000, minuteS: (msZr(pm)['1m'] || 0) / 1000, faktor: f1, dateien: pl.dateien };
  }
  aus.faktor1m = f1;
  /* Minuten-Vollauf: Rechenzeit (lesen + rechnen) je Teil; Wandzeit = laengster Teil */
  function teilStunden(liste) { return liste.map(function (F) { return (F.ms.lesen + F.ms.rechnen) / 3600000; }); }
  var t515 = teilStunden(voll515), t1 = teilStunden(voll1);
  aus.minuteVoll = { teile5m15mH: t515, teile1mH: t1, wand5m15mH: Math.max.apply(null, t515), wand1mH: Math.max.apply(null, t1) };
  aus.limitVoll = { wand5m15mH: aus.minuteVoll.wand5m15mH * f515, wand1mH: aus.minuteVoll.wand1mH * f1 };
  aus.limitVoll.summeH = aus.limitVoll.wand5m15mH + aus.limitVoll.wand1mH;
  aus.ueber6h = aus.limitVoll.wand5m15mH > 6 || aus.limitVoll.wand1mH > 6;
  return aus;
}
function argumente(argv) {
  var a = { pilot: [], probe1m: null };
  for (var i = 0; i < argv.length; i++) {
    if (argv[i] === '--pilot') while (i + 1 < argv.length && argv[i + 1].slice(0, 2) !== '--') a.pilot.push(argv[++i]);
    else if (argv[i] === '--probe1m') a.probe1m = [argv[++i], argv[++i]];
  }
  return a;
}
module.exports = { rechne: rechne };
if (require.main === module) console.log(JSON.stringify(rechne(argumente(process.argv.slice(2))), null, 1));
