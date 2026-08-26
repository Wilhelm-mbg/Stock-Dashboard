'use strict';
/* ZAEHLWERKZEUG (kein Messwerkzeug): Wie ueberlebensverzerrt ist das grosse
 * Kursarchiv auf E:?
 *
 * Es wird NICHTS gerechnet, was einer Ertragsaussage nahekommt. Gezaehlt wird:
 *  - wie viele Kuerzel aus der Verschwundenen-Liste im Archiv liegen,
 *  - wie viele Werte in einem Jahr von der Boerse verschwanden, gegen die
 *    Breite des Archivs in demselben Jahr,
 *  - wie gross die Luecke im Bestaetigungsfenster der offenen Entwuerfe ist.
 *
 * WAS DIESE ZAHLEN NICHT KOENNEN. Die Quellliste fuehrt bei KEINEM der 6.921
 * Eintraege ein Listing-Datum (gezaehlt: 0 von 6.921). Damit laesst sich nicht
 * sagen, wie viele Werte es in einem Jahr insgesamt gab - nur, wie viele in
 * genau diesem Jahr verschwanden. Das ist eine UNTERE SCHRANKE der Luecke:
 * wer 2015 delistet wurde, handelte 2015 mit Sicherheit; wer 2019 delistet
 * wurde, handelte 2015 vielleicht auch, aber vielleicht gab es ihn da noch
 * nicht. Nur die erste Gruppe wird gezaehlt.
 *
 * Aufruf: node studien/tueftler/werkzeug/zaehle-ueberlebende.js
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

/* Pfad NICHT fest verdrahten: Windows-Backslashes ueberleben das Bash-Quoting nicht
 * (Fehlerkatalog "Windows-Pfade in node -e"). Die Ablage fuehrt ihn mit Schraegstrichen. */
var ARCHIV = fs.readFileSync(path.join(os.homedir(), 'Downloads',
  'Markt-Dashboard-Daten', 'archiv1d-pfad.txt'), 'utf8').trim();
var MASSIVE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');

/* --- 1. Was liegt im Archiv? --- */
var archivSym = {};
fs.readdirSync(ARCHIV).forEach(function (f) {
  var m = /^bars_1d_(.+)\.json$/.exec(f);
  if (m) archivSym[m[1]] = 1;
});
var nArchiv = Object.keys(archivSym).length;

/* --- 2. Die Verschwundenen. Auf EINDEUTIGE Kuerzel eindampfen: 25 Kuerzel stehen
 *        mehrfach in der Liste (mehrfach vergeben und mehrfach delistet). Wer
 *        Eintraege statt Kuerzel zaehlt, meldet mehr Beschaffte als es Dateien
 *        gibt - genau das ist beim ersten Lauf passiert. --- */
var V = JSON.parse(fs.readFileSync(path.join(MASSIVE, 'verschwundene.json'), 'utf8'));
var jeSym = {};
V.eintraege.forEach(function (t) {
  /* bei Mehrfachvergabe das SPAETESTE Delisting behalten - das ist der Eintrag,
   * der die groesste Zeitspanne des Archivs beruehrt */
  if (!jeSym[t.sym] || (t.bis || '') > (jeSym[t.sym].bis || '')) jeSym[t.sym] = t;
});
var weg = Object.keys(jeSym).map(function (s) { return jeSym[s]; });
var mitBis = weg.filter(function (t) { return t.bis; });
var mitVon = weg.filter(function (t) { return t.von; });

console.log('== ARCHIV ==');
console.log('  archiv1d Symbole:             ' + nArchiv);
console.log('== VERSCHWUNDENE (massive, Stand ' + V.stand.slice(0, 10) + ') ==');
console.log('  Eintraege:                    ' + V.eintraege.length);
console.log('  eindeutige Kuerzel:           ' + weg.length);
console.log('  davon mit Delisting-Datum:    ' + mitBis.length);
console.log('  davon mit Listing-Datum:      ' + mitVon.length +
  '   <- deshalb nur untere Schranken unten');

var daten = mitBis.map(function (t) { return t.bis; }).sort();
console.log('  Delisting-Daten reichen von:  ' + daten[0] + ' bis ' + daten[daten.length - 1]);
console.log('  ==> Vor ' + daten[0] + ' fuehrt die Quelle NICHTS. Fuer 1986-2004 ist die');
console.log('      Luecke nicht einmal diagnostizierbar, geschweige denn zu fuellen.');

/* --- 3. Schnittmenge. Ein Treffer heisst NICHT, dass der verschwundene Wert im
 *        Archiv liegt - das Kuerzel kann neu vergeben worden sein. --- */
var treffer = weg.filter(function (t) { return archivSym[t.sym]; });
console.log('== SCHNITTMENGE ==');
console.log('  Kuerzel in beiden Listen:     ' + treffer.length +
  '   (Obergrenze; Kuerzel werden neu vergeben)');
console.log('  ' + treffer.map(function (t) { return t.sym + '/' + t.bis; }).join('  '));

/* --- 4. Wie breit ist das Archiv je Jahr? Stichprobe, hochgerechnet. --- */
var alle = Object.keys(archivSym).sort();
var schritt = Math.max(1, Math.floor(alle.length / 400));
var probe = [];
for (var i = 0; i < alle.length; i += schritt) probe.push(alle[i]);

var lebtImJahr = {};
probe.forEach(function (sym) {
  var d;
  try { d = JSON.parse(fs.readFileSync(path.join(ARCHIV, 'bars_1d_' + sym + '.json'), 'utf8')); }
  catch (e) { return; }
  var s = d.series;
  if (!s || !s.length) return;
  var gesehen = {};
  for (var k = 0; k < s.length; k++) gesehen[new Date(s[k][0]).getUTCFullYear()] = 1;
  Object.keys(gesehen).forEach(function (j) { lebtImJahr[j] = (lebtImJahr[j] || 0) + 1; });
});
var faktor = alle.length / probe.length;

/* --- 5. Delistings je Jahr gegen die Archivbreite. Untere Schranke. --- */
var wegJahr = {};
mitBis.forEach(function (t) { var j = t.bis.slice(0, 4); wegJahr[j] = (wegJahr[j] || 0) + 1; });

console.log('\n== UNTERE SCHRANKE DER LUECKE JE JAHR ==');
console.log('  Nur Werte, die IN dem Jahr verschwanden - die handelten in dem Jahr');
console.log('  mit Sicherheit und fehlen im Archiv mit Sicherheit.\n');
console.log('  Jahr | Archiv (hochger.) | verschwand in dem Jahr | Anteil am Querschnitt');
var sumWeg = 0, sumArchiv = 0;
for (var jahr = 2004; jahr <= 2026; jahr++) {
  var imArchiv = Math.round((lebtImJahr[jahr] || 0) * faktor);
  var w = wegJahr[String(jahr)] || 0;
  var anteil = (imArchiv + w) ? (100 * w / (imArchiv + w)) : 0;
  console.log('  ' + jahr + ' | ' + String(imArchiv).padStart(17) + ' | ' +
    String(w).padStart(22) + ' | ' + anteil.toFixed(1).padStart(5) + ' %');
  if (jahr >= 2008) { sumWeg += w; sumArchiv += imArchiv; }
}
console.log('\n  Bestaetigungsfenster der offenen Entwuerfe (2008-2026):');
console.log('    Summe der Jahres-Delistings: ' + sumWeg);
console.log('    Summe der Archiv-Jahre:      ' + sumArchiv);
console.log('    ==> im Mittel fehlen mindestens ' +
  (100 * sumWeg / (sumWeg + sumArchiv)).toFixed(1) + ' % des Querschnitts,');
console.log('        und zwar ausschliesslich Werte, die es nicht geschafft haben.');

/* --- 6. Was von den Verschwundenen ist schon beschafft? --- */
var td = path.join(MASSIVE, 'tagesdaten');
var beschafftSym = {};
if (fs.existsSync(td)) {
  fs.readdirSync(td).filter(function (f) { return /\.json$/.test(f); })
    .forEach(function (f) { beschafftSym[f.slice(0, -5)] = 1; });
}
var nBeschafft = Object.keys(beschafftSym).length;
var wegBeschafft = weg.filter(function (t) { return beschafftSym[t.sym]; }).length;
console.log('\n== BESCHAFFT ==');
console.log('  Tagesdaten-Dateien:           ' + nBeschafft);
console.log('  davon in der Verschwundenen-Liste: ' + wegBeschafft);
console.log('  Verschwundene noch ohne Kurse:     ' + (weg.length - wegBeschafft));
