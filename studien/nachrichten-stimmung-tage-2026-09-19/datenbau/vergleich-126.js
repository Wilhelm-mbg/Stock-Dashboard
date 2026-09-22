'use strict';
/* Zweite Positivkontrolle (Auftrag-Nachtrag Punkt 3): jede neu gezaehlte Tagesdatei, die auch vor dem Umbau vorlag, muss
 * bytegleich sein - bis auf das Laufzeitfeld dauerS (und die Fehlerliste, falls ein Lauf Netzfehler sah).
 * Aufruf: node vergleich-126.js <ablage>   (erwartet <ablage>/tage und <ablage>/tage-vor-umbau/tage) */
var fs = require('fs'), path = require('path');
var A = process.argv[2], neu = path.join(A, 'tage'), alt = path.join(A, 'tage-vor-umbau', 'tage');
function ohneDauer(s) { return s.replace(/"dauerS":[-0-9.eE+]+,/, ''); }
var gleich = 0, ungleich = [], offen = [];
fs.readdirSync(alt).filter(function (f) { return /\.json$/.test(f); }).sort().forEach(function (f) {
  if (!fs.existsSync(path.join(neu, f))) { offen.push(f.slice(0, 10)); return; }
  var a = ohneDauer(fs.readFileSync(path.join(alt, f), 'utf8')), b = ohneDauer(fs.readFileSync(path.join(neu, f), 'utf8'));
  if (a === b) gleich++;
  else {
    var ja = JSON.parse(a), jb = JSON.parse(b), felder = [];
    Object.keys(ja).forEach(function (k) { if (JSON.stringify(ja[k]) !== JSON.stringify(jb[k])) felder.push(k); });
    ungleich.push(f.slice(0, 10) + ' [' + felder.join(',') + ']');
  }
});
console.log('bytegleich (ohne dauerS): ' + gleich + ', ungleich: ' + ungleich.length + (ungleich.length ? ' -> ' + ungleich.slice(0, 10).join(' ') : '') + ', noch nicht neu gezaehlt: ' + offen.length);
process.exit(ungleich.length ? 1 : 0);
