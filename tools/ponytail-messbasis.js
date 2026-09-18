/* Messbasis fuer die Ponytail-Probe: Zeilen je Commit (11.-18.09.) und Token je Sitzung
 * aus den Uebergaben. Liest nur; schreibt nichts ins Repo. Aufruf:
 *   node messbasis.js <repo> <uebergabe-ordner> <von YYYY-MM-DD> <bis YYYY-MM-DD>
 */
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const repo = process.argv[2];
const ueb = process.argv[3];
const von = process.argv[4];
const bis = process.argv[5];

function median(a) {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function mittel(a) { return a.length ? a.reduce((x, y) => x + y, 0) / a.length : null; }
function f(x) { return x == null ? '-' : (Math.round(x * 10) / 10).toString().replace('.', ','); }

/* ---- 1. Zeilen je Commit ---- */
/* execFileSync statt execSync: unter Windows liefe der Befehl durch cmd.exe, und das
 * frisst die %-Platzhalter des Formats ("%ad ist kein Befehl"). */
const log = require('child_process').execFileSync('git',
  ['log', '--since=' + von, '--until=' + bis + 'T23:59:59', '--format=@@%h|%ad|%s', '--date=short', '--numstat'],
  { cwd: repo, encoding: 'utf8' });
const commits = [];
let cur = null;
for (const zeile of log.split('\n')) {
  if (zeile.startsWith('@@')) {
    const [h, d, ...s] = zeile.slice(2).split('|');
    cur = { hash: h, datum: d, betreff: s.join('|'), dateien: [], plus: 0, minus: 0 };
    commits.push(cur);
  } else if (cur && /^\d+\t|^-\t/.test(zeile)) {
    const [p, m, datei] = zeile.split('\t');
    cur.dateien.push(datei);
    cur.plus += p === '-' ? 0 : +p;
    cur.minus += m === '-' ? 0 : +m;
    if (/\.(js|cmd|html|mjs)$/i.test(datei)) cur.code = (cur.code || 0) + (p === '-' ? 0 : +p) + (m === '-' ? 0 : +m);
  }
}
const istCode = (d) => /\.(js|cmd|html|mjs)$/i.test(d);
const nurWiki = commits.filter(c => c.dateien.length && c.dateien.every(d => d.startsWith('wiki/')));
const mitCode = commits.filter(c => c.dateien.some(istCode));
const sonst = commits.filter(c => !nurWiki.includes(c) && !mitCode.includes(c));
function gruppe(name, g) {
  const z = g.map(c => c.plus + c.minus);
  console.log(name + ': ' + g.length + ' Commits, Median ' + f(median(z)) + ', Mittel ' + f(mittel(z)) + ' Zeilen (eingefuegt+geloescht)');
}
console.log('Fenster ' + von + ' bis ' + bis + ', Commits gesamt: ' + commits.length);
gruppe('nur wiki/', nurWiki);
gruppe('mit Code (*.js, *.cmd, *.html, *.mjs)', mitCode);
gruppe('sonstige (weder nur wiki/ noch Code)', sonst);
const ohneDateien = commits.filter(c => !c.dateien.length);
if (ohneDateien.length) console.log('Commits ohne Dateiaenderung (z. B. Merge): ' + ohneDateien.map(c => c.hash).join(', '));
console.log('\nJe Commit (hash datum plus minus klasse):');
for (const c of commits) {
  const k = nurWiki.includes(c) ? 'wiki' : mitCode.includes(c) ? 'code' : 'sonst';
  console.log(c.hash + ' ' + c.datum + ' +' + c.plus + ' -' + c.minus + ' ' + k);
}
/* Dieselben Code-Commits, aber nur die Zeilen in Code-Dateien gezaehlt (ohne JSON/Wiki) */
const nurCode = mitCode.map(c => c.code || 0);
console.log('mit Code, nur Zeilen in *.js/*.cmd/*.html/*.mjs gezaehlt: ' + mitCode.length + ' Commits, Median ' + f(median(nurCode)) + ', Mittel ' + f(mittel(nurCode)));

/* ---- 2. Token je Sitzung aus den Uebergaben ---- */
console.log('\nUebergaben (Dateien ohne Praefix auftrag-, Datum im Namen oder mtime im Fenster):');
const dateien = fs.readdirSync(ueb).filter(n => n.endsWith('.md') && !n.startsWith('auftrag-'));
const rows = [];
for (const n of dateien) {
  const p = path.join(ueb, n);
  const st = fs.statSync(p);
  const mtime = st.mtime.toISOString().slice(0, 10);
  const mName = n.match(/(\d{4}-\d{2}-\d{2})/);
  const datumName = mName ? mName[1] : null;
  const imFenster = (datumName && datumName >= von && datumName <= bis) || (mtime >= von && mtime <= bis);
  if (!imFenster) continue;
  const text = fs.readFileSync(p, 'utf8');
  const zeilen = text.split('\n').filter(z => /tokenverbrauch|verbrauch|budget/i.test(z));
  rows.push({ n, datumName, mtime, zeilen });
}
rows.sort((a, b) => (a.datumName || a.mtime).localeCompare(b.datumName || b.mtime));
for (const r of rows) {
  console.log('\n## ' + r.n + '  (Name: ' + r.datumName + ', mtime: ' + r.mtime + ')');
  for (const z of r.zeilen) console.log('   ' + z.trim().slice(0, 220));
  if (!r.zeilen.length) console.log('   (keine Zeile mit Verbrauch/Budget)');
}
