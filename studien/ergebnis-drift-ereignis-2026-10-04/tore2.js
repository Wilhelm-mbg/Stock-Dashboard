'use strict';
/* Ergaenzung zu tore.js: dieselben Kunstfaelle fuer die beiden Fassungen des Entwurfs und beide Schaetzer, H = 60 und H = 20.
 * Fassung 1: Entdeckung 2017-2020 und Bestaetigung 2021-2026, je t >= 2.  Fassung 2: ein Fenster 2021-2026, t >= 2,5.
 * Nur aus den blinden Fehlern in aufloesung.json (Normalnaeherung).        node tore2.js -> tore2.json
 */
var fs = require('fs');
var path = require('path');
var AU = require('./aufloesung.js');
var M = JSON.parse(fs.readFileSync(path.join(__dirname, 'aufloesung.json'), 'utf8'));
function zeile(t, H) { return M.zeilen.filter(function (r) { return r.teilmenge === t && r.H === H; })[0]; }
function fehler(r, schaetzer) {
  return schaetzer === 'tag' ? { A: Math.max(r.seAbstandTag, r.nwAbstandTag), B: Math.max(r.seObenTag, r.nwObenTag) } : { A: r.seAbstandPool, B: r.seObenPool };
}
var aus = [];
[60, 20].forEach(function (H) {
  ['tag', 'ereignis'].forEach(function (s) {
    var e = fehler(zeile('Hauptklassen 2016-2020', H), s), b = fehler(zeile('Hauptklassen 2021-2026', H), s);
    [0, 2, 4].forEach(function (a60) {
      ['A', 'B'].forEach(function (g) {
        var d = (g === 'A' ? a60 : a60 / 2) * (H === 60 ? 1 : 1 / 3);
        var z = { H: H, schaetzer: s, groesse: g, effekt: d, seEntdeckung: e[g], seBestaetigung: b[g], mdeBestaetigung: M.faktor * b[g],
          fassung1Beide: AU.macht(d, e[g], 2) * AU.macht(d, b[g], 2), fassung2: AU.macht(d, b[g], 2.5) };
        aus.push(z);
        console.log([H, s, g, d.toFixed(2), 'se ' + e[g].toFixed(3) + '/' + b[g].toFixed(3), 'MDE Best. ' + z.mdeBestaetigung.toFixed(2),
          'Fassung 1 ' + (100 * z.fassung1Beide).toFixed(1) + ' %', 'Fassung 2 ' + (100 * z.fassung2).toFixed(1) + ' %'].join(' | '));
      });
    });
  });
});
fs.writeFileSync(path.join(__dirname, 'tore2.json'), JSON.stringify({ stand: new Date().toISOString(), faelle: aus }, null, 1));
