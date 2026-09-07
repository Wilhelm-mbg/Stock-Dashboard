'use strict';
/* HOCHRECHNUNG des Vollaufs aus Pilot-Protokollen (VORREGISTRIERUNG §11, Uebergabe).
 *
 *   node hochrechnung.js <ordner-mit-logs> [weitere ...]
 *
 * Liest die _lauf.log-Zeilen "SYM/JAHR quelle N reg. Kerzen ... ms lesen ... ms rechnen", holt die Dateigroesse
 * per stat (nur Metadaten) und rechnet Sekunden je GB und je Million regulaerer Kerzen, getrennt nach Gruppe
 * (lebend/universum, verschwunden). Hochgerechnet wird auf die Dateien und Bytes des CS/ADRC-Universums
 * (lesen.js reihen(), stat je Datei). Nur lesen. Keine Anlageberatung - das hier ist Betriebsplanung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var L = require('./lesen.js');

var ordner = process.argv.slice(2);
if (!ordner.length) { console.error('Ordner mit _lauf.log oder *.log angeben'); process.exit(2); }
var zeilen = [];
ordner.forEach(function (o) {
  var p = path.resolve(K.HIER, o);
  var dateien = fs.statSync(p).isDirectory() ? fs.readdirSync(p).filter(function (f) { return /\.log$/.test(f); }).map(function (f) { return path.join(p, f); }) : [p];
  dateien.forEach(function (f) { fs.readFileSync(f, 'utf8').split(/\r?\n/).forEach(function (z) { if (/ reg\. Kerzen /.test(z)) zeilen.push(z); }); });
});
var re = /^\S+\s+(\S+)\/(\d{4})\s+(\S+)\s+(\d+) reg\. Kerzen\s+(\S+) von (\d+)\s+Tagen gewertet.*?(\d+) Signale\s+(\d+) ms lesen\s+(\d+) ms rechnen/;
var reihen = {}; L.reihen().forEach(function (R) { reihen[R.reihe] = R; });
var gruppen = {};
function grp(R) { return R ? (R.lebend ? 'lebend' : 'nicht lebend') + '|' + R.gruppe : 'unbekannt'; }
zeilen.forEach(function (z) {
  var m = re.exec(z); if (!m) return;
  var R = reihen[m[1]]; if (!R) return;
  var d = L.dateiPfad(R, +m[2]); var bytes = 0; try { bytes = fs.statSync(d.pfad).size; } catch (e) { return; }
  var g = gruppen[grp(R)] || (gruppen[grp(R)] = { dateien: 0, bytes: 0, kerzen: 0, msLesen: 0, msRechnen: 0, signale: 0 });
  g.dateien++; g.bytes += bytes; g.kerzen += +m[4]; g.msLesen += +m[8]; g.msRechnen += +m[9]; g.signale += +m[7];
});
console.log('Pilot-Protokolle: ' + zeilen.length + ' Dateizeilen');
var gesamt = { dateien: 0, bytes: 0, kerzen: 0, ms: 0 };
Object.keys(gruppen).sort().forEach(function (k) {
  var g = gruppen[k], ms = g.msLesen + g.msRechnen;
  gesamt.dateien += g.dateien; gesamt.bytes += g.bytes; gesamt.kerzen += g.kerzen; gesamt.ms += ms;
  console.log('  ' + k.padEnd(26) + String(g.dateien).padStart(4) + ' Dateien ' + (g.bytes / 1e9).toFixed(2).padStart(6) + ' GB ' + (g.kerzen / 1e6).toFixed(1).padStart(6) + ' Mio Kerzen ' +
    String(Math.round(ms / 1000)).padStart(6) + ' s  => ' + (ms / 1000 / (g.bytes / 1e9)).toFixed(0).padStart(5) + ' s/GB, ' + (ms / 1000 / (g.kerzen / 1e6)).toFixed(0).padStart(5) + ' s/Mio Kerzen, ' + (ms / 1000 / g.dateien).toFixed(0).padStart(4) + ' s/Datei');
});
var sProGB = gesamt.ms / 1000 / (gesamt.bytes / 1e9);
console.log('Pilot gesamt: ' + gesamt.dateien + ' Dateien, ' + (gesamt.bytes / 1e9).toFixed(2) + ' GB, ' + (gesamt.kerzen / 1e6).toFixed(1) + ' Mio reg. Kerzen, ' + Math.round(gesamt.ms / 1000) + ' s => ' + sProGB.toFixed(0) + ' s/GB');

/* Nenner: das CS/ADRC-Universum je Gruppe (stat je Datei). */
var uni = {}; var jahrOk = function (j) { return j >= +K.FENSTER.von.slice(0, 4) && j <= +K.FENSTER.bis.slice(0, 4); };
L.reihen().forEach(function (R) {
  var g = uni[grp(R)] || (uni[grp(R)] = { dateien: 0, bytes: 0 });
  R.jahre.filter(jahrOk).forEach(function (j) { var d = L.dateiPfad(R, j); try { var s = fs.statSync(d.pfad).size; g.dateien++; g.bytes += s; } catch (e) { /* fehlt */ } });
});
var summe = 0, summeGB = 0, summeDateien = 0;
console.log('Hochrechnung je Gruppe (Rate der Gruppe, sonst Gesamtrate):');
Object.keys(uni).sort().forEach(function (k) {
  var g = uni[k], p = gruppen[k], rate = p ? (p.msLesen + p.msRechnen) / 1000 / (p.bytes / 1e9) : sProGB;
  var s = rate * g.bytes / 1e9; summe += s; summeGB += g.bytes / 1e9; summeDateien += g.dateien;
  console.log('  ' + k.padEnd(26) + String(g.dateien).padStart(6) + ' Dateien ' + (g.bytes / 1e9).toFixed(1).padStart(6) + ' GB x ' + rate.toFixed(0).padStart(5) + ' s/GB = ' + (s / 3600).toFixed(1).padStart(7) + ' h');
});
console.log('Vollauf: ' + summeDateien + ' Dateien, ' + summeGB.toFixed(1) + ' GB => ' + (summe / 3600).toFixed(1) + ' Prozess-Stunden; bei 8 Teilen ' + (summe / 3600 / 8).toFixed(1) + ' h, bei 12 Teilen ' + (summe / 3600 / 12).toFixed(1) + ' h (Pilotraten unter Parallellast gemessen)');
