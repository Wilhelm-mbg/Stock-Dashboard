'use strict';
/* Auswertung Issue #63 nach REGISTRIERUNG.md. Liest die beiden Laeufe, druckt
 * (a) die vier Primaertests, (b) die Nebenbefunde, (c) die Produkthuerde. */
var fs = require('fs');
var path = require('path');

var HUERDE = { '1h': null, '3h': 0.23, 'TS': 0.42 };   // Standard-Schein ATM 21T, Signalstudie-Produkttabelle
var KOSTEN = 0.10;

/* Nimmt die schlanke Zeilendatei (im Repo) oder den vollen Lauf, falls frisch gerechnet. */
function lade(iv) {
  var voll = path.join(__dirname, 'ergebnisse', 'lauf-' + iv + '-beide.json');
  var schlank = path.join(__dirname, 'ergebnisse', 'zeilen-' + iv + '.json');
  return JSON.parse(fs.readFileSync(fs.existsSync(voll) ? voll : schlank, 'utf8'));
}

function zeile(z) {
  return [
    z.det.padEnd(9), z.dir.padEnd(5), z.hor.padEnd(3),
    String(z.n).padStart(6), String(z.nSym).padStart(4), String(z.nTage).padStart(3),
    (z.bruttoPp >= 0 ? '+' : '') + z.bruttoPp.toFixed(3).padStart(6),
    (z.nettoPp >= 0 ? '+' : '') + z.nettoPp.toFixed(3).padStart(6),
    (z.tTag >= 0 ? '+' : '') + z.tTag.toFixed(2).padStart(5),
    (z.mdeTagPp == null ? '  -  ' : z.mdeTagPp.toFixed(3)).padStart(6),
    (z.symPos == null ? '  -  ' : z.symPos.toFixed(2)).padStart(5),
  ].join(' ');
}
var KOPF = 'det       dir   hor      n  sym Tge  brutto  netto     t    MDE  symPos';

var alle = {};
['5m', '15m'].forEach(function (iv) { alle[iv] = lade(iv); });

console.log('=== PRIMAERTESTS (st_voll, Horizont 3h, Schwelle |t| >= 2,50) ===');
console.log(KOPF);
var belegt = [];
['5m', '15m'].forEach(function (iv) {
  ['long', 'short'].forEach(function (dir) {
    var z = alle[iv].zeilen.find(function (r) { return r.det === 'st_voll' && r.dir === dir && r.hor === '3h' && r.bedingung === '-'; });
    if (!z) { console.log(iv + ' ' + dir + ': KEINE ZEILE'); return; }
    console.log(iv.padEnd(4) + ' ' + zeile(z));
    var ok = z.tTag >= 2.50 && z.nettoPp > 0 && z.symPos != null && z.symPos >= 0.55;
    if (ok) belegt.push(iv + '/' + dir);
  });
});
console.log('\nURTEIL Primaertest: ' + (belegt.length ? 'BELEGT in ' + belegt.join(', ') : 'NICHT BELEGT (keine der vier Zellen erfuellt alle drei Bedingungen)'));

console.log('\n=== NEBENBEFUNDE: alle Stufen x Richtung x Horizont (ohne Bedingungsschnitte) ===');
['5m', '15m'].forEach(function (iv) {
  console.log('\n-- ' + iv + ' --');
  console.log(KOPF);
  alle[iv].zeilen.filter(function (r) { return r.bedingung === '-'; })
    .sort(function (a, b) { return a.det.localeCompare(b.det) || a.dir.localeCompare(b.dir) || a.hor.localeCompare(b.hor); })
    .forEach(function (z) { console.log(zeile(z)); });
});

console.log('\n=== Groesster t-Wert ueberhaupt (auch Bedingungsschnitte, rein explorativ) ===');
['5m', '15m'].forEach(function (iv) {
  var top = alle[iv].zeilen.slice().sort(function (a, b) { return Math.abs(b.tTag) - Math.abs(a.tTag); }).slice(0, 5);
  console.log('-- ' + iv + ' (' + alle[iv].tests + ' Testzeilen) --');
  console.log(KOPF + '   bedingung');
  top.forEach(function (z) { console.log(zeile(z) + '   ' + z.bedingung + '=' + z.wert); });
});

console.log('\n=== Produkthuerde 3h (Standard-Schein ATM 21T, Hebel 16,2 = 0,23 Pp je Umlauf) ===');
console.log('det       iv   dir   brutto  netto(Aktie 0,10)  netto(Schein 0,23)');
['5m', '15m'].forEach(function (iv) {
  ['st_roh', 'st_ema', 'st_voll', 'st_steil'].forEach(function (det) {
    ['long', 'short'].forEach(function (dir) {
      var z = alle[iv].zeilen.find(function (r) { return r.det === det && r.dir === dir && r.hor === '3h' && r.bedingung === '-'; });
      if (!z) return;
      console.log(det.padEnd(9) + ' ' + iv.padEnd(4) + ' ' + dir.padEnd(5) + ' ' +
        ((z.bruttoPp >= 0 ? '+' : '') + z.bruttoPp.toFixed(3)).padStart(7) + '  ' +
        ((z.bruttoPp - KOSTEN >= 0 ? '+' : '') + (z.bruttoPp - KOSTEN).toFixed(3)).padStart(16) + '  ' +
        ((z.bruttoPp - HUERDE['3h'] >= 0 ? '+' : '') + (z.bruttoPp - HUERDE['3h']).toFixed(3)).padStart(18));
    });
  });
});
