'use strict';
/* DAS SUCHARCHIV: physisch abgeschnitten an der Schnittkante.
 *
 * WARUM PHYSISCH UND NICHT PER ANSAGE. Wer viele Ideen prueft, muss die Schwelle
 * fuer viele Tests bezahlen - bei 100 Tests braucht der beste Kandidat einen fast
 * doppelt so grossen Effekt wie bei vier. Der einzige Ausweg ist, SUCHEN und
 * URTEILEN durch die Daten zu trennen: Auf der Entdeckungshaelfte darf beliebig
 * viel probiert werden, weil dort nichts entschieden wird; die
 * Bestaetigungshaelfte wird einmal angefasst.
 *
 * Diese Trennung haelt nur, wenn sie nicht auf Disziplin beruht. Eine Anweisung
 * "bitte nicht auf die zweite Haelfte schauen" ist keine Sperre - sie ist eine
 * Bitte. Deshalb bekommt jeder Suchende ein Archiv, das die zweite Haelfte GAR
 * NICHT ENTHAELT. Was man nicht hat, kann man nicht anpassen.
 *
 * Der Schnitt liegt exakt dort, wo die Messmaschine ihn setzt: beim mittleren
 * Handelstag der gemeinsamen Zeitachse. Sonst suchte man auf einem anderen
 * Zeitraum, als spaeter geurteilt wird.
 *
 * Aufruf: node tools/archiv-halbieren.js <quelle> <ziel> [praefix]
 *   z.B.  node tools/archiv-halbieren.js E:/Markt-Dashboard-Archiv/archiv1d \
 *              E:/Markt-Dashboard-Archiv/such1d bars_1d_
 */
var fs = require('fs');
var path = require('path');

var QUELLE = process.argv[2];
var ZIEL = process.argv[3];
var PRAEFIX = process.argv[4] || 'bars_1d_';
if (!QUELLE || !ZIEL) { console.error('Aufruf: node tools/archiv-halbieren.js <quelle> <ziel> [praefix]'); process.exit(2); }

var dateien = fs.readdirSync(QUELLE).filter(function (f) { return f.indexOf(PRAEFIX) === 0; });
console.log(dateien.length + ' Reihen in ' + QUELLE);

/* Schnitt wie in der Maschine: mittlerer Tag der gemeinsamen Zeitachse. */
var tage = {};
dateien.forEach(function (f) {
  try {
    var s = JSON.parse(fs.readFileSync(path.join(QUELLE, f), 'utf8')).series || [];
    s.forEach(function (k) { tage[new Date(k[0]).toISOString().slice(0, 10)] = 1; });
  } catch (e) { }
});
var sortiert = Object.keys(tage).sort();
var schnitt = sortiert[Math.floor(sortiert.length * 0.5)];
console.log('Handelstage gesamt: ' + sortiert.length + '  ·  Schnitt bei ' + schnitt);
console.log('Das Sucharchiv enthaelt AUSSCHLIESSLICH Kerzen VOR diesem Tag.\n');

if (!fs.existsSync(ZIEL)) fs.mkdirSync(ZIEL, { recursive: true });
var geschrieben = 0, kerzenVor = 0, kerzenNach = 0, verworfen = 0;
dateien.forEach(function (f) {
  var j;
  try { j = JSON.parse(fs.readFileSync(path.join(QUELLE, f), 'utf8')); } catch (e) { return; }
  var s = j.series || [];
  kerzenVor += s.length;
  var kurz = s.filter(function (k) { return new Date(k[0]).toISOString().slice(0, 10) < schnitt; });
  /* Reihen, die vor dem Schnitt fast nichts haben, gehoeren nicht ins Sucharchiv -
   * sie taeuschten eine Breite vor, die es dort nicht gibt. */
  if (kurz.length < 200) { verworfen++; return; }
  kerzenNach += kurz.length;
  fs.writeFileSync(path.join(ZIEL, f), JSON.stringify({
    sym: j.sym, quelle: j.quelle, format: j.format,
    hinweis: 'SUCHARCHIV - abgeschnitten vor ' + schnitt + '. Enthaelt die Bestaetigungshaelfte NICHT. ' +
             'Wer hier sucht, kann sich nicht an Daten anpassen, auf denen spaeter geurteilt wird.',
    schnitt: schnitt,
    series: kurz,
  }));
  geschrieben++;
});

console.log(geschrieben + ' Reihen geschrieben (' + verworfen + ' zu kurz und verworfen)');
console.log(kerzenNach.toLocaleString('de-DE') + ' von ' + kerzenVor.toLocaleString('de-DE') + ' Kerzen (' +
  (100 * kerzenNach / kerzenVor).toFixed(1) + ' %)');
console.log('Ablage: ' + ZIEL);
