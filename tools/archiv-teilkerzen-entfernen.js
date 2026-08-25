'use strict';
/* TEILKERZEN AUS DEN ARCHIVEN ENTFERNEN (Issue #85)
 *
 * Yahoo liefert am Ende jeder Reihe die LAUFENDE Kerze mit - eine Momentaufnahme
 * mitten in der Sitzung. Sie traegt nicht den Gitterstempel, sondern die Quote-
 * Uhrzeit: 16:57:27 statt 16:30. Gemessen am 26.08.2026: 400 von 400 gelesenen
 * 60m-Reihen endeten so, mitten in der Reihe kam es 0-mal vor.
 *
 * WARUM EIN EIGENES WERKZEUG UND KEIN NEUABRUF:
 * Das Zusammenfuehren in yahoo-60m-holen.js vereinigt ueber den ZEITSTEMPEL. Die
 * Teilkerze 16:57:27 und die richtige Kerze 16:30 sind zwei verschiedene Schluessel -
 * ein Neuabruf legt die richtige daneben, statt die falsche zu ersetzen. Sie bliebe
 * also stehen, kuenftig mitten in der Reihe. (Seit #85 filtert die Zusammenfuehrung
 * das mit; dieses Werkzeug macht dasselbe sofort und ohne Netz - ein Lauf ueber
 * knapp 3.000 Werte dauert Sekunden statt Stunden.)
 *
 * TAGESKERZEN BRAUCHEN DAS NICHT. Dort traegt der Teiltag denselben Stempel wie der
 * volle Tag (den Sitzungsbeginn), und beim Zusammenfuehren gewinnt die neuere Kerze.
 * archiv1d heilt sich also beim naechsten Abruf nach Handelsschluss von selbst.
 * Nachgemessen: 0 von 400 Tagesreihen sind am Stempel als Teiltag erkennbar.
 * Dieses Werkzeug meldet den Verdacht fuer 1d, aber loescht dort nichts - eine
 * Umsatz-Faustregel ist kein Grund, Daten wegzuwerfen.
 *
 * Aufruf:
 *   node tools/archiv-teilkerzen-entfernen.js              nur zaehlen (Vorgabe)
 *   node tools/archiv-teilkerzen-entfernen.js --wirklich   auch schreiben
 *   node tools/archiv-teilkerzen-entfernen.js --pfad E:/...  anderes Archiv-Wurzelverzeichnis
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const WIRKLICH = process.argv.indexOf('--wirklich') !== -1;
const iP = process.argv.indexOf('--pfad');
const WURZEL = iP !== -1 && process.argv[iP + 1]
  ? process.argv[iP + 1]
  : (fs.existsSync('E:/Markt-Dashboard-Archiv') ? 'E:/Markt-Dashboard-Archiv'
     : path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten'));

/* Eine echte Gitterkerze traegt immer Sekunde 0. Das ist die ganze Regel - dieselbe
 * wie in yahoo-60m-holen.js/fertigeKerze, damit es nicht zwei Wahrheiten gibt. */
function istTeilkerze(tsMs) { return new Date(tsMs).getUTCSeconds() !== 0; }

function dateien(dir) {
  const raus = [];
  (function lauf(d) {
    let e; try { e = fs.readdirSync(d, { withFileTypes: true }); } catch (x) { return; }
    e.forEach(function (x) {
      const p = path.join(d, x.name);
      if (x.isDirectory()) lauf(p);
      else if (/\.json$/i.test(x.name)) raus.push(p);
    });
  })(dir);
  return raus;
}

function archivLauf(name, loeschen) {
  const dir = path.join(WURZEL, name);
  if (!fs.existsSync(dir)) { console.log('  ' + name + ': nicht vorhanden'); return null; }
  const alle = dateien(dir);
  let mitTeil = 0, kerzen = 0, geschrieben = 0, fehler = 0, amEnde = 0, inMitte = 0;
  alle.forEach(function (f) {
    let j;
    try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { fehler++; return; }
    const s = j.series;
    if (!Array.isArray(s) || !s.length) return;
    const schlecht = [];
    s.forEach(function (k, i) { if (istTeilkerze(k[0])) schlecht.push(i); });
    if (!schlecht.length) return;
    mitTeil++;
    kerzen += schlecht.length;
    schlecht.forEach(function (i) { if (i === s.length - 1) amEnde++; else inMitte++; });
    if (!loeschen || !WIRKLICH) return;
    j.series = s.filter(function (k) { return !istTeilkerze(k[0]); });
    /* Nachvollziehbar machen, was das Werkzeug getan hat. */
    j.teilkerzenEntfernt = (j.teilkerzenEntfernt || 0) + schlecht.length;
    j.stand = new Date().toISOString();
    fs.writeFileSync(f, JSON.stringify(j));
    geschrieben++;
  });
  console.log('  ' + name.padEnd(10) + alle.length + ' Reihen, ' + mitTeil + ' mit Teilkerze, ' +
    kerzen + ' Kerzen (' + amEnde + ' am Ende, ' + inMitte + ' mitten drin)' +
    (fehler ? ', ' + fehler + ' unlesbar' : '') +
    (loeschen ? (WIRKLICH ? '  -> ' + geschrieben + ' Dateien geschrieben' : '  -> Probelauf, nichts geschrieben')
              : '  -> wird hier NICHT geloescht'));
  return { mitTeil: mitTeil, kerzen: kerzen };
}

console.log('Archiv-Wurzel: ' + WURZEL);
console.log(WIRKLICH ? 'MODUS: schreiben\n' : 'MODUS: nur zaehlen (--wirklich zum Schreiben)\n');

console.log('Intraday-Archive (Stempelregel greift, wird geloescht):');
['archiv60m', 'archiv15m', 'archiv5m', 'archiv1m', 'such60m'].forEach(function (n) { archivLauf(n, true); });

console.log('\nTagesarchive (Teiltag ist am Stempel nicht erkennbar):');
['archiv1d', 'such1d'].forEach(function (n) { archivLauf(n, false); });
console.log('  Hinweis: ein Teiltag traegt denselben Stempel wie der volle Tag. Beim');
console.log('  Zusammenfuehren gewinnt die neuere Kerze - archiv1d heilt sich also beim');
console.log('  naechsten Abruf NACH Handelsschluss von selbst. Nichts zu loeschen.');

if (!WIRKLICH) console.log('\nNichts geschrieben. Mit --wirklich noch einmal aufrufen.');
