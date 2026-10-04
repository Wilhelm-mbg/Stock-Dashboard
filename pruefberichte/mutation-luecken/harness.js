'use strict';
/* Mutations-Harness fuer das Momentum-Buch (Auftrag "Mutationstest Buecher", 04.10.2026).
 * Aufruf:  node pruefberichte/mutation-buecher/harness.js <mutanten.json> <ergebnis.json> [arbeitsordner]
 * mutanten.json: [{ id, datei, suche, ersatz, funktion, beschreibung, nr? }]
 *   suche muss in datei GENAU einmal vorkommen (sonst nr = 1-basiertes Vorkommen angeben).
 * Jeder Mutant laeuft in einer EIGENEN Kopie unter /tmp (nie im Arbeitsbaum): Quelltexte kopiert,
 * studien/ und daten/ verlinkt. Geprueft werden test-v6.js, test-channel.js und
 * pruefberichte/live-gegen-messung-momentum.test.js (+ optional pruefberichte/mutation-buecher.test.js).
 * Urteil: GETOETET, wenn die Menge der roten Zeilen / der Kleinsttest-Urteile / der Exit-Code
 * vom unveraenderten Code abweicht; sonst UEBERLEBT. Reines Node, kein Netz.
 */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');

var WURZEL = path.resolve(__dirname, '..', '..');
var mutFile = process.argv[2], outFile = process.argv[3];
var ARBEIT = process.argv[4] || '/tmp/mut-' + process.pid;
var NUR_NEU = process.env.NUR_NEUE_TESTS === '1';   // nur pruefberichte/mutation-buecher.test.js

function kopie(ziel) {
  fs.rmSync(ziel, { recursive: true, force: true });
  fs.mkdirSync(ziel, { recursive: true });
  fs.readdirSync(WURZEL).forEach(function (n) {
    if (n === '.git' || n === 'node_modules') return;
    var q = path.join(WURZEL, n), z = path.join(ziel, n);
    if (n === 'studien') { fs.symlinkSync(q, z); return; }
    cp.execFileSync('cp', ['-r', q, z]);
  });
}
function lauf(wurzel, args, ms) {
  var r = cp.spawnSync('node', args, { cwd: wurzel, encoding: 'utf8', timeout: ms || 300000, maxBuffer: 1 << 28,
    env: Object.assign({}, process.env, { PRUEF_WURZEL: wurzel }) });
  return { code: r.status, sig: (r.stdout || '') + (r.stderr || ''), timeout: r.error && r.error.code === 'ETIMEDOUT' };
}
function unterschrift(wurzel) {
  var o = {};
  if (!NUR_NEU) {
    var v6 = lauf(wurzel, ['test-v6.js']);
    o.v6 = { code: v6.code, rot: v6.sig.split('\n').filter(function (l) { return l.indexOf('❌') >= 0; }).map(function (l) { return l.trim().slice(0, 160); }).sort(), timeout: v6.timeout, aus: v6.code === null ? v6.sig.slice(-300) : '' };
    var ch = lauf(wurzel, ['test-channel.js']);
    o.channel = { code: ch.code, rot: ch.sig.split('\n').filter(function (l) { return l.indexOf('❌') >= 0; }).map(function (l) { return l.trim().slice(0, 160); }).sort() };
    var kl = lauf(wurzel, ['pruefberichte/live-gegen-messung-momentum.test.js']);
    o.klein = { code: kl.code, urteile: kl.sig.split('\n').filter(function (l) { return /^\[\d+\]/.test(l); }).map(function (l) { var m = /^\[(\d+)\] (ZEIGT ABWEICHUNG|kein Unterschied)/.exec(l); return m ? m[1] + ':' + m[2] : l.slice(0, 80); }) };
    o.klein.voll = kl.sig.split('\n').filter(function (l) { return /^\[\d+\]/.test(l); }).map(function (l) { return l.replace(/\d[\d.,]*/g, '#'); });
  }
  var neueDateien = [];
  var mb = path.join(wurzel, 'pruefberichte/mutation-buecher');
  if (fs.existsSync(mb)) fs.readdirSync(mb).forEach(function (n) { if (/^teil-.*\.test\.js$/.test(n)) neueDateien.push('pruefberichte/mutation-buecher/' + n); });
  if (fs.existsSync(path.join(wurzel, 'pruefberichte/mutation-buecher.test.js'))) neueDateien.push('pruefberichte/mutation-buecher.test.js');
  if (neueDateien.length) {
    o.neu = { code: 0, rot: [] };
    neueDateien.sort().forEach(function (d) {
      var nt = lauf(wurzel, [d]);
      if (nt.code !== 0) o.neu.code = nt.code === null ? -1 : nt.code;
      o.neu.rot = o.neu.rot.concat(nt.sig.split('\n').filter(function (l) { return /^ROT|FEHL|❌/.test(l.trim()); }).map(function (l) { return d.split('/').pop() + ': ' + l.trim().slice(0, 140); }));
    });
    o.neu.rot.sort();
  }
  return o;
}
function vergleich(a, b) {
  var gruende = [];
  if (!NUR_NEU) {
    if (JSON.stringify(a.v6.rot) !== JSON.stringify(b.v6.rot) || a.v6.code !== b.v6.code) {
      var neu = b.v6.rot.filter(function (x) { return a.v6.rot.indexOf(x) < 0; });
      gruende.push('test-v6: ' + (neu.length ? neu.length + ' neu rot, z.B. ' + neu[0] : 'Exit ' + b.v6.code + (b.v6.aus ? ' ' + b.v6.aus : '')));
    }
    if (a.channel.code !== b.channel.code || JSON.stringify(a.channel.rot) !== JSON.stringify(b.channel.rot)) gruende.push('test-channel rot');
    if (JSON.stringify(a.klein.urteile) !== JSON.stringify(b.klein.urteile) || a.klein.code !== b.klein.code) gruende.push('Kleinsttest-Urteil geaendert: ' + b.klein.urteile.filter(function (x, i) { return x !== a.klein.urteile[i]; }).join(','));
    else if (JSON.stringify(a.klein.voll) !== JSON.stringify(b.klein.voll)) gruende.push('(Hinweis, kein Urteil) Kleinsttest-Text geaendert');
  }
  if (a.neu && b.neu && (a.neu.code !== b.neu.code || JSON.stringify(a.neu.rot) !== JSON.stringify(b.neu.rot))) gruende.push('neue Kleinsttests rot/Exit ' + b.neu.code);
  return gruende;
}
function zaehle(s, t) { var n = 0, i = -1; while ((i = s.indexOf(t, i + 1)) >= 0) n++; return n; }
function nteVorkommen(s, t, n) { var i = -1; for (var k = 0; k < n; k++) { i = s.indexOf(t, i + 1); if (i < 0) return -1; } return i; }

kopie(ARBEIT);
var basis = unterschrift(ARBEIT);
var mut = JSON.parse(fs.readFileSync(mutFile, 'utf8'));
var erg = [];
function speichern() { fs.writeFileSync(outFile, JSON.stringify({ basis: { v6rot: basis.v6 && basis.v6.rot.length, neuCode: basis.neu && basis.neu.code }, ergebnisse: erg }, null, 1)); }
mut.forEach(function (m) {
  var f = path.join(ARBEIT, m.datei);
  var orig = fs.readFileSync(path.join(WURZEL, m.datei), 'utf8');
  var n = zaehle(orig, m.suche), r = { id: m.id, funktion: m.funktion, beschreibung: m.beschreibung, datei: m.datei };
  if (n === 0 || (n > 1 && !m.nr)) { r.urteil = 'UNGUELTIG'; r.grund = n + ' Vorkommen von suche'; erg.push(r); speichern(); return; }
  var i = n === 1 ? orig.indexOf(m.suche) : nteVorkommen(orig, m.suche, m.nr);
  var neu = orig.slice(0, i) + m.ersatz + orig.slice(i + m.suche.length);
  fs.writeFileSync(f, neu);
  var syn = cp.spawnSync('node', ['--check', f], { encoding: 'utf8' });
  if (syn.status !== 0) { r.urteil = 'UNGUELTIG'; r.grund = 'Syntaxfehler'; }
  else {
    var b = unterschrift(ARBEIT), g = vergleich(basis, b);
    r.urteil = g.length && !(g.length === 1 && g[0].indexOf('(Hinweis') === 0) ? 'GETOETET' : 'UEBERLEBT';
    r.gruende = g;
  }
  fs.writeFileSync(f, orig);   // Mutant zurueck
  erg.push(r); speichern();
  console.log(m.id + ' ' + r.urteil + (r.gruende && r.gruende.length ? ' | ' + r.gruende.join(' ; ') : ''));
});
console.log('fertig: ' + erg.length + ' Mutanten, getoetet ' + erg.filter(function (x) { return x.urteil === 'GETOETET'; }).length + ', ueberlebt ' + erg.filter(function (x) { return x.urteil === 'UEBERLEBT'; }).length + ', ungueltig ' + erg.filter(function (x) { return x.urteil === 'UNGUELTIG'; }).length);
fs.rmSync(ARBEIT, { recursive: true, force: true });
