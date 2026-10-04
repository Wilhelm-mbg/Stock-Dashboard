'use strict';
/* Generalprobe 23.11.2026 - die Kleinsttests zu jedem Fund (Bericht: pruefberichte/2026-10-generalprobe-2311.md).
 * Laedt jedes Modul unter pruefberichte/generalprobe-2311/funde/ und druckt je Fund EINE Zeile:
 * "ZEIGT ABWEICHUNG: ..." oder "kein Unterschied: ...". Reines Node, kein Netz, keine Schluessel, App-Code unveraendert.
 * Aufruf aus der Repo-Wurzel:  node pruefberichte/generalprobe-2311.test.js [Kennungs-Teil]
 * Der Szenario-Harness (alle Montag-Laeufe, ca. 7 Minuten): node pruefberichte/generalprobe-2311/harness.js alle
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var ordner = path.join(__dirname, 'generalprobe-2311', 'funde');
var filter = process.argv[2] || '';
(async function () {
  var dateien = fs.readdirSync(ordner).filter(function (f) { return /\.js$/.test(f) && f.indexOf(filter) >= 0; }).sort();
  var rot = 0, ok = 0;
  for (var i = 0; i < dateien.length; i++) {
    var f = require(path.join(ordner, dateien[i])), r;
    try { r = await f.lauf(); } catch (e) { r = { abweichung: true, text: 'Testfehler: ' + (e && e.message) }; }
    if (r.abweichung) rot++; else ok++;
    console.log((r.abweichung ? 'ZEIGT ABWEICHUNG' : 'kein Unterschied') + ': [' + f.id + (f.klasse ? ' / ' + f.klasse : '') + '] ' + f.ort + ' - ' + f.titel + ' | ' + String(r.text).replace(/\s+/g, ' ').slice(0, 300));
  }
  console.log('\n' + rot + ' mit Abweichung, ' + ok + ' ohne Unterschied, ' + dateien.length + ' Pruefungen.');
})();
