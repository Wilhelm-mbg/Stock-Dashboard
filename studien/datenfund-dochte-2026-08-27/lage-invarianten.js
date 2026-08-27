'use strict';
/* ============ Kerzenlage: Invarianten am echten Archiv (NUR LESEND) ============
 *
 * PM-Auflage 27.08.: Die absoluten Zahlen WANDERN mit jedem Halbtag - sie werden
 * hier BERICHTET (Ausgangsstand mit Datum), nicht zugesichert. Zugesichert werden
 * nur Invarianten, die nicht altern:
 *   I1  Lage 'vorboerse' im Archiv: 0  (die Quelle liefert nopp keine Vorboerse)
 *   I2  Lage 'nachhandel' an NORMALTAGEN: 0  (nur Halbtage bekommen die AH-Kerze)
 *   I3  Kreuzsumme: auktion + schlusskurs + nachhandel == Kerzen nach Sitzungsende
 *       (dieselbe Menge wie population-60m.js, andere Rechenstrecke)
 * Die Konstruktions-Eigenschaften (auktion => v>0 usw.) werden NICHT als
 * Invarianten gefuehrt - sie sind per Bauform wahr und ihr "Test" waere Tautologie.
 * Kein Teil von npm test: braucht das E:-Archiv. */
var fs = require('fs'), path = require('path');
var KL = require(path.join(__dirname, '..', '..', 'kerzenlage.js'));
var B = require(path.join(__dirname, '..', '..', 'boerse.js'));
var D = 'E:/Markt-Dashboard-Archiv/archiv60m';

function dateien(ordner) {
  var out = [];
  fs.readdirSync(ordner, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(ordner, e.name);
    if (e.isDirectory() && !/^backup/.test(e.name)) out = out.concat(dateien(p));
    else if (/^bars_60m_.*\.json$/.test(e.name)) out.push(p);
  });
  return out;
}

var zaehl = { sitzung: 0, auktion: 0, schlusskurs: 0, nachhandel: 0, vorboerse: 0, unbekannt: 0 };
var nachhandelNormaltag = 0, beispieleNN = [];
dateien(D).forEach(function (f) {
  var j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return; }
  var s = j.series; if (!Array.isArray(s)) return;
  s.forEach(function (k) {
    var lage = KL.kerzenLage(k[0], k[2]);
    zaehl[lage] = (zaehl[lage] || 0) + 1;
    if (lage === 'nachhandel' && !B.halbtagAn(k[0])) {
      nachhandelNormaltag++;
      if (beispieleNN.length < 5) beispieleNN.push(path.basename(f) + ' ' + new Date(k[0]).toISOString());
    }
  });
});

var heute = new Date().toISOString().slice(0, 10);
console.log('AUSGANGSSTAND (' + heute + ', berichtet - diese Zahlen wandern):');
Object.keys(zaehl).forEach(function (l) { console.log('  ' + l.padEnd(12) + zaehl[l].toLocaleString('de')); });
var nachEnde = zaehl.auktion + zaehl.schlusskurs + zaehl.nachhandel;
console.log('\nINVARIANTEN (altern nicht):');
var i1 = zaehl.vorboerse === 0;
var i2 = nachhandelNormaltag === 0;
console.log('  I1 vorboerse == 0:              ' + (i1 ? 'HAELT' : 'VERLETZT (' + zaehl.vorboerse + ')'));
console.log('  I2 nachhandel@Normaltag == 0:   ' + (i2 ? 'HAELT' : 'VERLETZT (' + nachhandelNormaltag + ')'));
beispieleNN.forEach(function (b) { console.log('     ' + b); });
console.log('  I3 Kreuzsumme nach Sitzungsende: ' + nachEnde.toLocaleString('de') +
  '  (gegen population-60m.js halten - andere Rechenstrecke, gleiche Menge)');
process.exit(i1 && i2 ? 0 : 1);
