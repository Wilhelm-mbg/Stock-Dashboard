'use strict';
/* Fund H-lib-require (Klasse C): lib.js nutzt fs und path, ohne sie zu laden. Aus einer Datei (nicht aus `node -e`, wo fs/path
 * Globale sind) geladen, endet require('./lib.js') in "ReferenceError: path is not defined". Die Datei steht unter der Zeile
 * "Uebernommen ... unveraendert" aus dem Pruefbericht, dessen Kopf die beiden require-Zeilen hat; sie sind beim Uebernehmen verloren gegangen. */
var vm = require('vm'), fs = require('fs'), path = require('path');
module.exports = {
  id: 'H-lib-require', klasse: 'C', ort: 'pruefberichte/generalprobe-2311/lib.js:6-8',
  titel: 'lib.js: fs und path werden benutzt, aber nicht per require geladen',
  ausloeser: 'require("./lib.js") aus einer normalen Datei (nicht node -e)',
  erwartet: 'lib.js laedt sich selbst; die Datei muss var fs = require("fs"); var path = require("path"); tragen',
  async lauf() {
    var datei = path.join(__dirname, '..', 'lib.js'), src = fs.readFileSync(datei, 'utf8');
    var fn = vm.runInNewContext('(function (exports, require, module, __filename, __dirname) {' + src + '\n})', { process: process }, { filename: datei });
    var m = { exports: {} }, meldung = null;
    try { fn(m.exports, require, m, datei, path.dirname(datei)); } catch (e) { meldung = String(e.message || e); }
    return { abweichung: !!meldung, text: meldung ? 'beobachtet: ' + meldung + '; erwartet: lib.js laedt ohne Fehler' : 'beobachtet: laedt ohne Fehler (erwartet: ohne Fehler)' };
  }
};
