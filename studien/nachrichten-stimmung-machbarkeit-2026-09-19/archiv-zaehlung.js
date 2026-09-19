'use strict';
/* Machbarkeit Nachrichten-Stimmung (19.09.2026), §1.1: Zählung des App-Archivs.
 * Liest NUR die Kopie im Kratzordner (nie store/ der laufenden App). Form je Datei: [[Zeitstempel ms, Titel], ...].
 * Keine Schlagzeile wird bewertet - nur gezählt. Simulation, keine Anlageberatung.
 * Aufruf: node archiv-zaehlung.js <kopie-ordner> [universum-je-jahr.json]  -> schreibt archiv-zaehlung.json daneben. */
var fs = require('fs'), path = require('path');
var ordner = process.argv[2], uniPfad = process.argv[3];
var dateien = fs.readdirSync(ordner).filter(function (f) { return /^newsarchiv_.+\.json$/.test(f); }).sort();
var aus = { stand: new Date().toISOString(), quelle: ordner, dateien: dateien.length, symbole: {}, gesamt: 0, tageMitEintrag: {}, titelDoppelt: 0 };
var alleTitel = {}, minT = Infinity, maxT = -Infinity, jeTag = {};
dateien.forEach(function (f) {
  var sym = f.replace(/^newsarchiv_(.+)\.json$/, '$1'), rows = JSON.parse(fs.readFileSync(path.join(ordner, f), 'utf8')).items || [];
  var ok = rows.filter(function (r) { return Array.isArray(r) && typeof r[0] === 'number' && typeof r[1] === 'string'; });
  var ts = ok.map(function (r) { return r[0]; }), tage = {}, titel = {}, minuten = 0;
  ok.forEach(function (r) {
    var d = new Date(r[0]), iso = d.toISOString().slice(0, 10);
    tage[iso] = (tage[iso] || 0) + 1; jeTag[iso] = (jeTag[iso] || 0) + 1;
    if (titel[r[1]]) aus.titelDoppelt++; titel[r[1]] = 1; alleTitel[r[1]] = 1;
    if (d.getUTCSeconds() !== 0 || d.getUTCMilliseconds() !== 0 || d.getUTCMinutes() !== 0) minuten++;
    if (r[0] < minT) minT = r[0]; if (r[0] > maxT) maxT = r[0];
  });
  var ntage = Object.keys(tage).length;
  aus.symbole[sym] = { eintraege: ok.length, ungueltig: rows.length - ok.length, von: new Date(Math.min.apply(null, ts)).toISOString(), bis: new Date(Math.max.apply(null, ts)).toISOString(),
    tageMitEintrag: ntage, jeTag: ntage ? +(ok.length / ntage).toFixed(2) : null, eigeneTitel: Object.keys(titel).length, stempelUnterTag: minuten };
  aus.gesamt += ok.length;
});
aus.von = new Date(minT).toISOString(); aus.bis = new Date(maxT).toISOString();
aus.spanneTage = +((maxT - minT) / 86400000).toFixed(1);
aus.eigeneTitelGesamt = Object.keys(alleTitel).length;
aus.eintraegeJeTagGesamt = jeTag;
var tageSort = Object.keys(jeTag).sort();
aus.kalendertageMitEintrag = tageSort.length;
aus.jeSymbolUndTag = +(aus.gesamt / (dateien.length * tageSort.length)).toFixed(2);
/* Überschneidung mit dem Panel-Universum (Klassen 1-3), falls die Jahresliste da ist. */
if (uniPfad && fs.existsSync(uniPfad)) {
  var U = JSON.parse(fs.readFileSync(uniPfad, 'utf8')), letztes = Object.keys(U.jahre).sort().pop(), L = U.jahre[letztes];
  var klasse = {}; [1, 2, 3].forEach(function (k) { (L[k] || []).forEach(function (s) { klasse[s] = k; }); });
  aus.panel = { jahr: letztes, tag: L.tag, klasse1: (L[1] || []).length, klasse2: (L[2] || []).length, klasse3: (L[3] || []).length, zuordnung: {} };
  Object.keys(aus.symbole).forEach(function (s) { aus.panel.zuordnung[s] = klasse[s] || 'nicht im Universum'; });
}
fs.writeFileSync(path.join(__dirname, 'archiv-zaehlung.json'), JSON.stringify(aus, null, 1));
delete aus.eintraegeJeTagGesamt;
process.stdout.write(JSON.stringify(aus, null, 1) + '\n');
