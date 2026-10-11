'use strict';
/* Siegel der Pruefstrasse (FORM.md §5). Gemeinsames Modul fuer Laeufer und Adapter; die Form von pruefeSiegel ist die aus
 * studien/nachzuegler-2026-10/lesen.js (Nr. 109), hier ohne Studienbezug: repo und pfad kommen vom Aufrufer.
 *   siegel1(repo, ordnerRel)  - der Kandidatenordner liegt in einem Commit und hat nichts Ungesichertes (Zweitleser-Befund:
 *                               "letzter Commit beruehrt den Ordner" reicht; die Datei-Pruefsumme ist Sache von Siegel 2).
 *   pruefeSiegel(repo, pfadRel) - Siegel 2: Datei in einem Commit, seit dem Commit unveraendert, Status leer, Blob-Hash gleich.
 * Beide werfen einen Fehler mit e.sperre = true. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var cp = require('child_process');
var crypto = require('crypto');

function sperrFehler(text) { var e = new Error('SPERRE: ' + text); e.sperre = true; return e; }
function git(repo, args) { return cp.spawnSync('git', args, { cwd: repo, encoding: 'buffer', windowsHide: true }); }
function aus(r) { return r.status === 0 ? r.stdout.toString('utf8').trim() : null; }
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

/** Siegel 1: `git log -1 --format=%H -- <ordner>` liefert einen Commit, `git status --porcelain -- <ordner>` ist leer. */
function siegel1(repo, ordnerRel) {
  var rel = String(ordnerRel).replace(/\\/g, '/');
  if (!fs.existsSync(path.join(repo, rel))) throw sperrFehler(rel + ' gibt es nicht');
  var hash = aus(git(repo, ['log', '-1', '--format=%H', '--', rel])) || '';
  if (!/^[0-9a-f]{40}$/.test(hash)) throw sperrFehler(rel + ' liegt in keinem Commit (Siegel 1)');
  var st = git(repo, ['status', '--porcelain', '--', rel]);
  var text = aus(st);
  if (text === null) throw sperrFehler('git status fuer ' + rel + ' scheitert');
  if (text !== '') throw sperrFehler(rel + ' hat Ungesichertes (Siegel 1): ' + text.split('\n')[0]);
  return { commit: hash, ordner: rel };
}

/** Siegel 2 (Nr. 109): Datei in einem Commit, seitdem unveraendert, Status leer, Blob-Hash der Datei = Blob im Commit. */
function pruefeSiegel(repo, pfadRel) {
  var rel = String(pfadRel).replace(/\\/g, '/'), abs = path.join(repo, rel);
  if (!fs.existsSync(abs)) throw sperrFehler(rel + ' fehlt - die Pruefzeit bleibt zu');
  var hash = aus(git(repo, ['log', '-1', '--format=%H', '--', rel])) || '';
  if (!/^[0-9a-f]{40}$/.test(hash)) throw sperrFehler(rel + ' liegt in keinem Commit');
  if (git(repo, ['diff', '--quiet', hash, '--', rel]).status !== 0) throw sperrFehler(rel + ' ist seit ' + hash.slice(0, 7) + ' veraendert');
  var st = aus(git(repo, ['status', '--porcelain', '--', rel]));
  if (st === null || st !== '') throw sperrFehler(rel + ' hat ungesicherte Aenderungen');
  var ist = aus(git(repo, ['hash-object', '--', rel])), soll = aus(git(repo, ['rev-parse', hash + ':' + rel]));
  if (!ist || ist !== soll) throw sperrFehler('Pruefsumme von ' + rel + ' weicht vom Commit ab');
  return { commit: hash, blob: ist, sha256: sha256(fs.readFileSync(abs)), pfad: rel };
}

module.exports = { siegel1: siegel1, pruefeSiegel: pruefeSiegel, sha256: sha256, sperrFehler: sperrFehler, git: git, aus: aus };
