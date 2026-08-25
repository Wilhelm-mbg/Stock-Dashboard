'use strict';
/* Fahrer fuer den Analytiker-Placebo: ruft die Messmaschine direkt auf und legt
 * das Protokoll NUR unter studien/analytiker/2026-08-26/ ab (nie im Datenordner
 * der App - dorthin gehoeren nur echte Messungen ueber messen.js). */
var fs = require('fs'), path = require('path'), os = require('os');
var M = require(path.resolve(__dirname, '..', '..', 'messmaschine', 'messmaschine.js'));
var S = require(path.resolve(__dirname, 'placebo-strategie.js'));

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var archiv;
if (process.env.MD_ARCHIV60M) archiv = process.env.MD_ARCHIV60M;
else {
  try { archiv = fs.readFileSync(path.join(DATEN, 'archiv60m-pfad.txt'), 'utf8').replace(/^﻿/, '').trim(); }
  catch (e) { archiv = path.join(process.env.APPDATA || '', 'Markt-Dashboard', 'store'); }
}
console.log('Placebo-Messung auf ' + archiv);
var r = M.messe(S, archiv);
if (r.verweigert) { console.log('VERWEIGERT: ' + r.grund); process.exit(3); }
var ziel = path.join(__dirname, 'analytiker-placebo-' + r.gemessenAm.slice(0, 10) + '.json');
fs.writeFileSync(ziel, JSON.stringify(r, null, 1));
function pp(x, d) { return x == null ? '-' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(d == null ? 4 : d) + ' Pp'); }
console.log(S.key + '  (' + r.universum.werte + ' Werte, ' + r.universum.handelstage + ' Handelstage)');
r.ergebnisse.forEach(function (e, i) {
  var b = e.bestaetigung;
  var u = r.entscheidungen.filter(function (x) { return x.regel === 'Urteil Variante ' + i; })[0];
  console.log('  Variante ' + i + ': ' + e.signale + ' Signale');
  console.log('    Bestaetigung Ueberschuss ' + pp(b.ueberschuss.tagesmittel) + ' (t ' + (b.ueberschuss.t || 0).toFixed(2) + ', MDE ' + pp(b.ueberschuss.mde) + ')');
  console.log('    je Signal: ' + pp(b.ueberschuss.jeSignal));
  console.log('    URTEIL: ' + (u ? u.ergebnis.urteil : '?') + ' - ' + (u ? u.begruendung : ''));
});
if (r.warnungen && r.warnungen.length) r.warnungen.forEach(function (w) { console.log('  WARNUNG [' + w.kennung + '] ' + w.text); });
console.log('Protokoll: ' + ziel);
