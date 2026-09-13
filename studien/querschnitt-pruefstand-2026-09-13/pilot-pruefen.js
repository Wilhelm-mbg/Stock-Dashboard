'use strict';
/* PILOT-PRUEFUNG - Sichtprobe auf die Pilot-Tafel, bevor der Vollauf startet. Keine Ergebnisdatei. */
var fs = require('fs'), path = require('path');
var K = require('./konfig.js'), P = require('./paneldaten.js');
var aus = process.argv[2] || 'pilot';
var kal = K.kalender(), S = P.symbole();
var jahr = +(process.argv[3] || 2016);
var b = P.leseBlock(path.join(__dirname, aus, 'teil-0', jahr + '.json'.replace('json', 'bin')));
var namen = {}; S.liste.forEach(function (r) { namen[r.idx] = r.reihe; });
console.log('Jahr', jahr, 'Zeilen', b.n);
var wunsch = (process.argv[4] || 'COKE,AAPL,SPY').split(',');
wunsch.forEach(function (sym) {
  var idx = S.idx[sym]; if (idx === undefined) return console.log(sym, 'nicht in der Symboltabelle');
  var z = [];
  for (var i = 0; i < b.n; i++) if (b.sym[i] === idx) z.push(i);
  if (!z.length) return console.log(sym, 'keine Zeilen in', jahr);
  console.log('--', sym, '| Zeilen', z.length, '| erster', kal.tage[b.tag[z[0]]], '| letzter', kal.tage[b.tag[z[z.length - 1]]]);
  [0, 1, 2, z.length - 1].forEach(function (q) {
    var i = z[q];
    console.log('   ', kal.tage[b.tag[i]], 'rohC', b.rohSchluss[i].toFixed(4), 'rohO', b.rohEroeffnung[i].toFixed(4),
      'f', b.faktor[i], 'r', b.rendite[i].toFixed(4), 'rOC', b.renditeOC[i].toFixed(4),
      'U_reg', (b.umsatzReg[i] / 1e6).toFixed(2) + 'M', 'U_auk', (b.umsatzAuktion[i] / 1e6).toFixed(2) + 'M',
      'kl', b.klasse[i], 'k', b.kerzen[i], 'marken', b.marken[i]);
  });
});
