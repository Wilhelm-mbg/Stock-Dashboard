'use strict';
/* Gegenprobe der Ertragsrechnung: `ertraege` (rechnen.js) gegen `halte` des Pruefstands, an echten Panelzeilen.
 * 400 zufaellige Universumsmitglieder (fester Startwert) an zufaelligen Tagen, alle vier Horizonte; dazu gezielt Reihen, die
 * kurz danach enden. Verglichen wird der Ertrag Eroeffnung -> Eroeffnung eines Ein-Wert-Korbes. Kein Bezug zu Meldungen oder
 * Ueberraschungen - reine Werkzeugpruefung.       node --max-old-space-size=6144 pruefe-ertrag.js
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var R = require('./rechnen.js');
var AU = require('./aufloesung.js');
var PK = require(path.join(K.PRUEFSTAND, 'konfig.js'));
var PS = require(path.join(K.PRUEFSTAND, 'pruefstand.js'));

var T = PS.Tafel(K.PANEL_AUS), rnd = AU.zufallsquelle(K.ZUFALL_START + 99), HOR = K.HORIZONTE, puffer = new Float64Array(HOR.length);
var n = 0, abw = 0, maxAbw = 0, enden = 0, beispiele = [];
function vergleiche(mem, E) {
  R.ertraege(T, mem.naechste, E, HOR, puffer);
  HOR.forEach(function (H, h) {
    if (E + H > T.maxTag) return;
    var z = { tote: 0, toteTotalverlust: 0, luecken: 0 };
    var soll = PS.halte(T, [mem], E, E + H, PK.TOTALVERLUST_GRUENDE, z).periode, ist = puffer[h], d = Math.abs(soll - ist);
    n++; if (z.tote) enden++;
    if (d > maxAbw) maxAbw = d;
    if (d > 1e-6) { abw++; if (beispiele.length < 5) beispiele.push({ reihe: T.symName[mem.sym], tag: T.kal.tage[E], H: H, soll: soll, ist: ist }); }
  });
}
for (var i = 0; i < 400; i++) {
  var tag = 260 + Math.floor(rnd() * (T.maxTag - 330)), U = PS.universum(T, tag, { klassen: K.KLASSEN_ALLE });
  if (!U.liste.length) continue;
  vergleiche(U.liste[Math.floor(rnd() * U.liste.length)], U.aTag);
}
/* gezielt: Mitglieder, deren Reihe innerhalb von 60 Tagen endet (Abgang im Haltefenster) */
var gezielt = 0;
for (var t = 300; t < T.maxTag - 70 && gezielt < 150; t += 7) {
  var U2 = PS.universum(T, t, { klassen: K.KLASSEN_ALLE });
  for (var j = 0; j < U2.liste.length && gezielt < 150; j++) {
    var m = U2.liste[j], letzte = T.g.tag[T.letzteZeile(m.sym)];
    if (letzte > U2.aTag && letzte < U2.aTag + 60) { vergleiche(m, U2.aTag); gezielt++; }
  }
}
var aus = { stand: new Date().toISOString(), vergleiche: n, davonMitReihenende: enden, gezielteAbgaenge: gezielt, abweichungen: abw, groessteAbweichungPp: maxAbw, beispiele: beispiele };
fs.writeFileSync(path.join(__dirname, 'pruefe-ertrag.json'), JSON.stringify(aus, null, 1));
process.stdout.write(JSON.stringify(aus) + '\n');
process.exitCode = abw ? 1 : 0;
