'use strict';
/* Nr. 121-2b B.1 Kreuzprobe: dieselbe Routine (qqq-bauen.js) auf SPY gegen die Panel-Marktreihe (Tafel spy, bereinigter Schluss c). Verglichen werden
 * die Tagesrenditen c_t / c_(t-1) - 1 je gemeinsamem Tag in Pp: Soll |Abweichung| <= 0,001 Pp je Tag. Die Panel-Reihe ist split-/ausschuettungsbereinigt
 * (Faktor), also gegen cb (Gesamtertrag); die rohe Reihe c nachrichtlich. NUR LESEN (Panel + Archiv), kein Kandidat.
 * Aufruf: node --max-old-space-size=8192 pruefstrasse/daten/kreuzprobe-spy.js [<spy-tage.json>] [<aus.json>] */
var fs = require('fs');
var path = require('path');
var B = require('./qqq-bauen.js');
var arg = process.argv.slice(2);
var E = arg[0] ? JSON.parse(fs.readFileSync(arg[0], 'utf8')) : B.baue('SPY', 'E:/Markt-Dashboard-Archiv', { ergaenzungen: (require(path.join(__dirname, '..', '..', 'studien', 'momentum-korb-2026-10-04', 'korb.js')).ERGAENZUNGEN || {}).SPY || [] });
var TF = require('../tafel.js').oeffne({ quelle: 'panel', bisPanelende: true });
var S = TF.spy, panel = {};
for (var p = 0; p < S.n; p++) panel[TF.tage[S.tag[p]]] = S.c[p];
var vorher = null, abw = [], n = 0, max = 0, maxRoh = 0, ueber = 0, summe = 0, maxRest = 0;
E.tage.forEach(function (x) {
  if (panel[x.d] == null) { vorher = null; return; }
  if (vorher && panel[vorher.d] != null) {
    var rp = (panel[x.d] / panel[vorher.d] - 1) * 100, rq = (x.cb / vorher.cb - 1) * 100, rr = (x.c / vorher.c - 1) * 100, d = rq - rp;
    n++; summe += d; if (Math.abs(d) > max) max = Math.abs(d); if (Math.abs(rr - rp) > maxRoh) maxRoh = Math.abs(rr - rp);
    var D = 0; x.aus.forEach(function (a) { D += a; }); var rest = Math.abs(rq - rr - 100 * D / vorher.c); if (rest > maxRest) maxRest = rest;   /* bereinigt - roh = Ausschuettung / Vortagesschluss */
    if (Math.abs(d) > 0.001) { ueber++; if (abw.length < 40) abw.push({ tag: x.d, panelPp: rp, routinePp: rq, rohPp: rr, abwPp: d, halb: !!x.halb, aus: x.aus }); }
  }
  vorher = x;
});
var R = { panel: TF.kennung, panelBis: TF.tage[TF.maxTag], tage: n, maxAbwPp: max, mittelAbwPp: n ? summe / n : null, ueber0001: ueber, maxAbwRohPp: maxRoh, maxRestNachAusschuettungPp: maxRest, beispiele: abw };
if (arg[1]) fs.writeFileSync(arg[1], JSON.stringify(R, null, 1));
console.log('SPY Kreuzprobe gegen ' + R.panel + ' (bis ' + R.panelBis + '): ' + n + ' Tage, max |Abweichung| ' + max.toFixed(6) + ' Pp, Mittel ' + (R.mittelAbwPp || 0).toExponential(2) + ' Pp, ueber 0,001 Pp: ' + ueber + '; Kursreihe (roh, wie das Panel ohne Ausschuettungen): max ' + maxRoh.toExponential(2) + ' Pp; bereinigt - roh - Ausschuettung/Vortagesschluss: max ' + maxRest.toExponential(2) + ' Pp');
abw.slice(0, 12).forEach(function (a) { console.log('  ' + a.tag + ' Panel ' + a.panelPp.toFixed(4) + ' Routine ' + a.routinePp.toFixed(4) + ' roh ' + a.rohPp.toFixed(4) + (a.halb ? ' Halbtag' : '') + (a.aus.length ? ' Ausschuettung ' + a.aus : '')); });
