'use strict';
/* GEGENPROBE in isolierter Kopie: die Skalenpruefung ausbauen -> die Klinke muss rot werden.
 * Die Kopie liegt ausserhalb des Repos; ihre require-Pfade werden auf absolute umgeschrieben. */
var fs = require('fs'), path = require('path'), os = require('os');
var REPO = path.resolve(__dirname, '..', '..').split(path.sep).join('/');
var quelle = fs.readFileSync(REPO + '/tools/alpaca-balken-holen.js', 'utf8');
var tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'gegenprobe-skala-'));

function kopie(name, aendern) {
  var s = quelle
    .replace(/require\('\.\.\//g, "require('" + REPO + "/")
    .replace(/require\('\.\//g, "require('" + REPO + "/tools/");
  s = aendern(s);
  var p = path.join(tmp, name);
  fs.writeFileSync(p, s);
  return require(p);
}

/* Kunstreihe wie im Archiv: eine volle 5m-Sitzung je Tag, jede FUENFTE Kerze von Alpaca.
 * Nicht jede zweite - bei durchgehendem Wechsel gaebe es keine gleichquelligen Paare, und
 * die Gegenprobe "Quellenwechsel egal" bliebe gruen, ohne dass die Pruefung deshalb gut
 * waere. Die Verstuemmelung muss an einer Reihe scheitern, wie sie wirklich vorkommt. */
function kunst(faktorTag2) {
  var serie = [], jeKerze = [];
  [Date.parse('2026-03-02T14:30:00Z'), Date.parse('2026-03-03T14:30:00Z')].forEach(function (start, tag) {
    var f = tag === 1 ? faktorTag2 : 1;
    for (var i = 0; i < 78; i++) {
      var alpaca = i % 5 === 4, s = alpaca ? f : 1;
      var jetzt = 100 + i * 0.05, vor = i === 0 ? jetzt : 100 + (i - 1) * 0.05;
      serie.push([start + i * 300000, jetzt * s, 1000 + i, (jetzt + 0.02) * s, (vor - 0.02) * s, vor * s]);
      jeKerze.push({ quelle: alpaca ? 'alpaca' : 'yahoo', abgeleitet: null });
    }
  });
  return { serie: serie, jeKerze: jeKerze };
}

/* Und ein Kunstarchiv auf der Platte, damit auch skalenPruefungDateien() geprueft wird. */
var KQ = require(REPO + '/kerzenquelle.js');
var arch = path.join(tmp, 'archiv');
fs.mkdirSync(path.join(arch, 'archiv5m'), { recursive: true });
var k = kunst(0.5);
fs.writeFileSync(path.join(arch, 'archiv5m', 'bars_5m_KUNST.json'),
  JSON.stringify(KQ.satz('KUNST', '5m', k.serie, { quellen: KQ.quellenVerdichten(k.serie, k.jeKerze), waehrung: 'USD' })));

function messe(mod) {
  var g = mod.skalenTage(mod.grenzVerhaeltnisse(k.serie, k.jeKerze, 300000));
  var d = mod.skalenPruefungDateien(arch);
  return { rein: g.abweichungen.length, datei: d.abweichungen.length, durchgefallen: d.durchgefallen.join(',') };
}

var faelle = [
  ['0-unveraendert.js', function (s) { return s; }, true],
  ['1-band-aufgeweitet.js', function (s) { return s.replace('var SKALEN_BAND = 0.001;', 'var SKALEN_BAND = 1e9;'); }, false],
  ['2-pruefung-ausgebaut.js', function (s) {
    return s.replace('    if (Math.abs(m - 1) > SKALEN_BAND) abw.push({ datum: t, faktor: m, paare: v.length });',
                     '    void m;   /* GEGENPROBE: die Pruefung ausgebaut */');
  }, false],
  /* Nicht an der GRENZE messen, sondern ueberall: dann verwaessern die gleichquelligen
   * Nachbarpaare (Verhaeltnis 1) den Median, und der halbierte Massstab verschwindet.
   * BEIDE Waechter muessen weg - der erste allein laesst der zweite Zeile nichts uebrig. */
  ['3-nicht-an-der-grenze.js', function (s) {
    return s.replace('    if (!qa || !qb || qa === qb) continue;\n    if (qa !== \'alpaca\' && qb !== \'alpaca\') continue;',
                     '    if (!qa || !qb) continue;   /* GEGENPROBE: nicht mehr an der Quellengrenze */');
  }, false],
];

console.log('Gegenprobe: findet die Skalenpruefung den Kunst-Split (Faktor 0,5 ab dem 03.03.)?\n');
var alleWieErwartet = true;
faelle.forEach(function (f) {
  var r;
  try { r = messe(kopie(f[0], f[1])); } catch (e) { r = { fehler: String(e && e.message || e).slice(0, 80) }; }
  var gefunden = !r.fehler && r.rein > 0 && r.datei > 0;
  var wieErwartet = gefunden === f[2];
  if (!wieErwartet) alleWieErwartet = false;
  console.log('  ' + (wieErwartet ? 'wie erwartet' : 'NICHT WIE ERWARTET') + '   ' + f[0].padEnd(28) +
    (r.fehler ? 'FEHLER ' + r.fehler : 'rein ' + r.rein + ', aus der Datei ' + r.datei + ', durchgefallen "' + r.durchgefallen + '"') +
    '   -> Klinke waere ' + (gefunden ? 'GRUEN' : 'ROT'));
});
console.log('\n' + (alleWieErwartet
  ? 'Alle drei Verstuemmelungen machen die Klinke ROT, die unveraenderte Fassung gruen - die Pruefung haengt wirklich an dem, was sie behauptet.'
  : 'ACHTUNG: mindestens eine Verstuemmelung blieb gruen.'));
fs.rmSync(tmp, { recursive: true, force: true });
process.exit(alleWieErwartet ? 0 : 1);
