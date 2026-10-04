'use strict';
/* ZAEHLLAUF 3 - Lernprobe und Pruefprobe des Wortlauts (Auftrag Nr. 90, V2).
 *
 *   node proben.js lern    30 Reihen der Regel 11, Saat z3-lern   -> z3-lernprobe.json  (an ihnen werden Wortlisten und
 *                          Abschnittssuche EINMAL angepasst)
 *   node proben.js pruef   40 ANDERE Reihen der Regel 11, Saat z3-pruef -> z3-pruefprobe.json (an ihnen wird nur gemessen)
 *
 * Je Reihe: Klasse mit der Fassung von wortlaut.js, Treffer je Liste, Auszug (hoechstens 300 Zeichen). Die Regel-11-Reihen
 * haengen nicht an den Wortlisten (Formulare und Fenster entscheiden), die Ziehung ist also vor und nach der Aenderung gleich.
 * Ausgabe auf der Konsole: eine Zeile je Reihe - kurze Auszuege, keine Meldungstexte.
 */
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var W = require('./wortlaut.js');

function probe(welche) {
  var N = G.json(path.join(__dirname, 'z3-gruende-neu.json'));
  var r11 = N.reihen.filter(function (u) { return u.regel === 11; }), key = function (u) { return u.reihe; };
  var lern = G.ziehe(r11, 30, 'z3-lern', key), inLern = {};
  lern.forEach(function (u) { inLern[u.reihe] = 1; });
  var liste = welche === 'lern' ? lern : G.ziehe(r11.filter(function (u) { return !inLern[u.reihe]; }), 40, 'z3-pruef', key);
  return { regel11: r11.length, reihen: liste.map(function (u) {
    var a = /^EDGAR:(\S+)/.exec(u.quelle)[1], t = Z3.lies(path.join(__dirname, 'edgar', 'texte', a + '.json')), k = t && t.text ? W.klasse(t.text) : { klasse: 'nichts', abschnitt: 0, auszug: '', treffer: null };
    return { reihe: u.reihe, akz: a, tageZumAnker: u.signale.i301v3_tage, band: u.band, firma: u.firma, klasse: k.klasse, abschnitt: k.abschnitt, zeichen: k.zeichen || 0, verwiesen: k.verwiesen || [], gestapelt: k.gestapelt || 0,
      treffer: k.treffer, auszug: k.auszug, fusionNah: u.signale.fusion_nah ? 1 : 0, i501: u.signale.i501 ? 1 : 0, emittent25: u.emittent_formular25 ? 1 : 0, sic: u.sic };
  }) };
}
function main() {
  var welche = process.argv[2] === 'pruef' ? 'pruef' : 'lern', p = probe(welche);
  Z3.schreibe(welche === 'lern' ? 'z3-lernprobe.json' : 'z3-pruefprobe.json', { stand: new Date().toISOString(), wortlautFassung: W.FASSUNG, saat: welche === 'lern' ? 'z3-lern' : 'z3-pruef', regel11: p.regel11, reihen: p.reihen });
  p.reihen.forEach(function (x) {
    var t = x.treffer || { vollzug: [], ruege: [], eigen: [] };
    console.log([x.reihe, x.klasse, x.tageZumAnker, x.band, 'F' + x.fusionNah + ' 5.01:' + x.i501 + ' E25:' + x.emittent25, x.abschnitt ? x.zeichen + 'Z' : 'KEIN ABSCHNITT', (x.verwiesen.join('+') || '-') + '/' + x.gestapelt,
      'V[' + t.vollzug.join(';') + '] R[' + t.ruege.join(';') + '] E[' + t.eigen.join(';') + ']', x.auszug].join(' | '));
  });
}
module.exports = { probe: probe };
if (require.main === module) main();
