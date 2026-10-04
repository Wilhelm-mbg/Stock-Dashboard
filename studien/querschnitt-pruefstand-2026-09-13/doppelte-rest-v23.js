'use strict';
/* REST DER DOPPELTEN ABSCHNITTE (Auftrag Nr. 92, Schritt 2, Auskunft zu Teil 2) - wie viele der entfernten Zeilen haben im
 * Zwilling wirklich KEIN Gegenstueck? doppelte-abschnitte-v23.json zaehlt als "gleiche Tage" nur exakt gleiche rohe Schluesse;
 * vor einem Split weicht der rohe Schluss des Zwillings oft nur im letzten Bit ab (Verhaeltnis 1,0000000000000002). Hier je
 * entfernter Zeile: hat der Zwilling am selben Tag eine Zeile, und ist der rohe Schluss gleich bis auf 1e-6 relativ?
 * Jahresweise gelesen (tafel-v2/panel-jahresweise.js), nur lesen. Aufruf: node doppelte-rest-v23.js -> doppelte-rest-v23.json
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var PJ = require(path.join(K.REPO, 'studien', 'datenfundament-2026-10-04', 'tafel-v2', 'panel-jahresweise.js'));

var O22 = path.join(__dirname, 'voll-v22');
var DL = JSON.parse(fs.readFileSync(path.join(__dirname, 'doppelte-abschnitte-v23.json'), 'utf8'));
var st = PJ.stand(O22), idx = {};
st.symbole.forEach(function (r, i) { idx[r.reihe] = i; });
var paar = {}, zwi = {};
DL.doppelt.forEach(function (x) { paar[idx[x.abschnitt]] = idx[x.zwilling]; zwi[idx[x.zwilling]] = 1; });
var D = {}, C = {};
PJ.jahresweise(O22, K.PANEL_KENNUNG_V22, st, function (b) {
  for (var i = 0; i < b.n; i++) {
    var s = b.sym[i];
    if (paar[s] !== undefined) (D[s] = D[s] || []).push([b.tag[i], b.rohSchluss[i]]);
    if (zwi[s]) (C[s] = C[s] || {})[b.tag[i]] = b.rohSchluss[i];
  }
});
var Z = { zeilen: 0, exaktGleich: 0, bis1e6: 0, andererKurs: 0, ohneZwillingstag: 0 }, je = [];
Object.keys(D).forEach(function (s) {
  var c = C[paar[s]], z = { abschnitt: st.symbole[s].reihe, zwilling: st.symbole[paar[s]].reihe, zeilen: 0, exaktGleich: 0, bis1e6: 0, andererKurs: 0, ohneZwillingstag: 0, ersterOhne: null };
  D[s].forEach(function (r) {
    z.zeilen++;
    var v = c[r[0]];
    if (v === undefined) { z.ohneZwillingstag++; if (!z.ersterOhne) z.ersterOhne = st.tage[r[0]]; }
    else if (v === r[1]) z.exaktGleich++;
    else if (Math.abs(v - r[1]) <= 1e-6 * Math.max(Math.abs(v), Math.abs(r[1]))) z.bis1e6++;
    else z.andererKurs++;
  });
  ['zeilen', 'exaktGleich', 'bis1e6', 'andererKurs', 'ohneZwillingstag'].forEach(function (k) { Z[k] += z[k]; });
  if (z.andererKurs || z.ohneZwillingstag) je.push(z);
});
je.sort(function (x, y) { return (y.andererKurs + y.ohneZwillingstag) - (x.andererKurs + x.ohneZwillingstag); });
var out = { kennung: 'querschnitt-pruefstand-2026-09-13/doppelte-rest-v23/v1', stand: new Date().toISOString(), liste: DL.kennung + ' (' + DL.stand + ')', zaehler: Z,
  abschnitteMitRest: je.length, speicherSpitzeMB: PJ.spitzeMB(), je: je };
fs.writeFileSync(path.join(__dirname, 'doppelte-rest-v23.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(Z), 'Abschnitte mit Rest', je.length, 'Spitze', out.speicherSpitzeMB, 'MB');
console.log(je.slice(0, 8).map(function (z) { return z.abschnitt + '>' + z.zwilling + ' ohneTag ' + z.ohneZwillingstag + ' anders ' + z.andererKurs + ' ab ' + z.ersterOhne; }).join(' | '));
