'use strict';
/* Fahrer fuer die Analytiker-Placebos des dritten Laufs: beide Strategiemodule
 * nacheinander durch die Messmaschine, Protokolle NUR in diesen Ordner. */
var fs = require('fs'), path = require('path'), os = require('os');
var M = require(path.resolve(__dirname, '..', '..', 'messmaschine', 'messmaschine.js'));

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var archiv;
if (process.env.MD_ARCHIV60M) archiv = process.env.MD_ARCHIV60M;
else {
  try { archiv = fs.readFileSync(path.join(DATEN, 'archiv60m-pfad.txt'), 'utf8').replace(/^﻿/, '').trim(); }
  catch (e) { archiv = path.join(process.env.APPDATA || '', 'Markt-Dashboard', 'store'); }
}
console.log('Placebo-Messung auf ' + archiv + '  (Maschine ' + M.VERFAHREN.version + ', Stand ' + M.VERFAHREN.codeStand + ')');

function pp(x, d) { return x == null ? '-' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(d == null ? 4 : d) + ' Pp'); }

['placebo-strategie.js', 'placebo-strategie-folgeeroeffnung.js'].forEach(function (mod) {
  var S = require(path.resolve(__dirname, mod));
  var r = M.messe(S, archiv);
  if (r.verweigert) { console.log(S.key + ' VERWEIGERT: ' + r.grund); return; }
  var ziel = path.join(__dirname, S.key + '-' + r.gemessenAm.slice(0, 10) + '.json');
  fs.writeFileSync(ziel, JSON.stringify(r, null, 1));
  console.log('\n' + S.key + '  (' + r.universum.werte + ' Werte, ' + r.universum.handelstage + ' Handelstage, ' + Math.round(r.dauerMs / 1000) + ' s)');
  r.ergebnisse.forEach(function (e, i) {
    var b = e.bestaetigung;
    var u = r.entscheidungen.filter(function (x) { return x.regel === 'Urteil Variante ' + i; })[0];
    console.log('  Variante ' + i + ': ' + e.signale + ' Signale');
    console.log('    Bestaetigung Ueberschuss ' + pp(b.ueberschuss.tagesmittel) + ' (t ' + (b.ueberschuss.t || 0).toFixed(2) + ', MDE ' + pp(b.ueberschuss.mde) + ')');
    console.log('    URTEIL: ' + (u ? u.ergebnis.urteil : '?'));
    if (u && u.ergebnis.aussicht) console.log('    aussicht.tage80: ' + u.ergebnis.aussicht.tage80);
  });
  var p = r.placebo;
  if (p && p.t != null) console.log('  eingebauter Placebo: ' + pp(p.tagesmittel) + ' (t ' + p.t.toFixed(2) + ', MDE ' + pp(p.mde) + ')');
  if (r.warnungen && r.warnungen.length) r.warnungen.forEach(function (w) { console.log('  WARNUNG [' + w.kennung + '] ' + w.text.slice(0, 160)); });
  console.log('  Protokoll: ' + ziel);
});
