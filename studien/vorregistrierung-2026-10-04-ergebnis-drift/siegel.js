'use strict';
/* Das Siegel: der eine Lauf startet nur, wenn Registrierung, Code, Tests und die blinden Zahlen committet und seitdem unveraendert
 * sind. Geprueft wird gegen Git (nur lesen): keine der Siegel-Dateien ist geaendert oder unversioniert, und der letzte Commit von
 * VORREGISTRIERUNG.md traegt das Wort "Siegel" im Betreff. Eine Korrektur nach dem Siegel (benannter Fehler im Code) wird committet,
 * bevor der Lauf wiederholt wird - VORREGISTRIERUNG.md bleibt dabei unberuehrt.
 */
var cp = require('child_process');
var KF = require('./konfig.js');

var DATEIEN = ['VORREGISTRIERUNG.md', 'konfig.js', 'ereignisse.js', 'zehntel.js', 'groessen.js', 'buch.js', 'messung.js', 'siegel.js', 'lauf.js', 'test.js', 'blind.json'];

function git(args) { return cp.execFileSync('git', args, { cwd: KF.REPO, encoding: 'utf8' }).trim(); }

function pruefe() {
  var pfade = DATEIEN.map(function (d) { return KF.ORDNER_REL + '/' + d; });
  var status = git(['status', '--porcelain', '--'].concat(pfade));
  if (status) throw new Error('KEIN SIEGEL: diese Dateien sind geaendert oder nicht committet:\n' + status);
  var log = git(['log', '-1', '--format=%H%x09%s', '--', KF.ORDNER_REL + '/VORREGISTRIERUNG.md']);
  if (!log) throw new Error('KEIN SIEGEL: VORREGISTRIERUNG.md ist nicht committet');
  var teile = log.split('\t');
  if (!/Siegel/.test(teile[1] || '')) throw new Error('KEIN SIEGEL: der letzte Commit von VORREGISTRIERUNG.md heisst nicht Siegel: ' + teile[1]);
  return { commit: teile[0], betreff: teile[1], kopf: git(['rev-parse', 'HEAD']) };
}

module.exports = { pruefe: pruefe, DATEIEN: DATEIEN };
