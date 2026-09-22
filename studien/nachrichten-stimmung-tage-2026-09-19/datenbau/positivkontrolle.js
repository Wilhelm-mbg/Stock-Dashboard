'use strict';
/* Positivkontrolle vor dem Vollauf (Auftrag Nr. 47, Baustein 3; Nachtrag 1 Punkt 7). Liest nur, schreibt eine Beleg-Datei.
 * Aufruf: node positivkontrolle.js <kontrolle-ordner>
 *   <k>/2025-06-02.json            Nr. 44 vom PC (Referenz)
 *   <k>/alt/tage/2025-06-02.json   alte Fassung gkg-zaehlen.js + Karte v1 auf dem Server
 *   <k>/neu/kontrolle-utc-2025-06-02.json   neue Fassung + Karte v2 ueber die 96 Dateien des UTC-Tags
 *   <k>/neu-et/tage/2025-06-02.json         neue Fassung, ET-Tag 2025-06-02 (Normalbetrieb)
 * 1. alt == PC: bytegleich auf kennung, karte, tag, zaehler, symbole (dauerS ist Uhrzeit, stichprobe zieht Math.random -
 *    beide sind in der alten Fassung nicht wiederholbar und werden getrennt ausgewiesen).
 * 2. je Symbol in beiden Karten: Summe ueber die ET-Eimer von n + nSpaet == Artikelzahl "voll" von Nr. 44.
 * Simulation, keine Anlageberatung. */
var fs = require('fs'), path = require('path'), crypto = require('crypto');
var G = require('./gkg-tage.js');
var k = process.argv[2];
function lies(p) { return JSON.parse(fs.readFileSync(path.join(k, p), 'utf8')); }
function sha(p) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(k, p))).digest('hex'); }
function kern(j) { return JSON.stringify({ kennung: j.kennung, karte: j.karte, tag: j.tag, zaehler: j.zaehler, symbole: j.symbole }); }

var pc = lies('2025-06-02.json'), alt = lies('alt/tage/2025-06-02.json');
var p1 = { kernGleich: kern(pc) === kern(alt), shaKernPc: crypto.createHash('sha256').update(kern(pc)).digest('hex'), shaKernServer: crypto.createHash('sha256').update(kern(alt)).digest('hex'),
  shaDateiPc: sha('2025-06-02.json'), shaDateiServer: sha('alt/tage/2025-06-02.json'), stichprobeGleich: JSON.stringify(pc.stichprobe) === JSON.stringify(alt.stichprobe),
  dauerS: { pc: pc.dauerS, server: alt.dauerS }, symbole: Object.keys(alt.symbole).length, trefferVoll: alt.zaehler.treffer.voll };

var neu = lies('neu/kontrolle-utc-2025-06-02.json'), v2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'namenskarte-v2.json'), 'utf8')).karte;
var summe = {};
Object.keys(neu.eimer).forEach(function (d) { Object.keys(neu.eimer[d]).forEach(function (s) { var q = neu.eimer[d][s]; summe[s] = (summe[s] || 0) + q.n + q.nSpaet; }); });
var kv1 = JSON.parse(fs.readFileSync(path.join(__dirname, '..', '..', 'gdelt-abdeckung-2026-09-19', 'namenskarte.json'), 'utf8')).karte;
var inBeiden = 0, gleich = 0, abweichung = [];
Object.keys(v2).filter(function (s) { return kv1[s]; }).forEach(function (s) {
  var a = pc.symbole[s] ? pc.symbole[s].voll[0] : 0, b = summe[s] || 0;
  inBeiden++;
  if (a === b) gleich++; else abweichung.push(s + ': Nr.44 ' + a + ' / neu ' + b);
});
/* Symbole aus Karte v1, die in v2 fehlen (Medien, wiederverwendet, nicht mehr Kl. 2-3), zaehlen nicht mit. */
var p2 = { symboleInBeidenKarten: inBeiden, mitTrefferNr44: Object.keys(v2).filter(function (s) { return kv1[s] && pc.symbole[s]; }).length, gleich: gleich, abweichungen: abweichung, etEimer: Object.keys(neu.eimer),
  artikelNeu: Object.keys(summe).reduce(function (x, s) { return x + summe[s]; }, 0), zaehler: neu.zaehler, dauerS: neu.dauerS };

var et = lies('neu-et/tage/2025-06-02.json');
G.pruefeTag(et);
var p3 = { soll: et.soll, dateien: et.dateien, fehlend: et.fehlend.length, symbole: Object.keys(et.symbole).length, treffer: et.zaehler.treffer, spaet: et.zaehler.trefferSpaet,
  fremderTag: et.zaehler.fremderTag, stempelAusDatei: et.zaehler.stempelAusDatei, stempelUngleichDatei: et.zaehler.stempelUngleichDatei, bytesZip: et.zaehler.bytesZip, dauerS: et.dauerS,
  sJeDatei: +(et.dauerS / et.dateien).toFixed(2), mbJeS: +(et.zaehler.bytesZip / 1048576 / et.dauerS).toFixed(2), klinke: 'bestanden' };

var aus = { kennung: G.KENNUNG + '/positivkontrolle', stand: new Date().toISOString(), node: process.version,
  urteil: p1.kernGleich && abweichung.length === 0 ? 'bestanden' : 'FUND', altGegenPc: p1, neuGegenNr44: p2, neuEtTag: p3 };
fs.writeFileSync(path.join(k, 'positivkontrolle.json'), JSON.stringify(aus, null, 1));
process.stdout.write(JSON.stringify({ urteil: aus.urteil, kernGleich: p1.kernGleich, dateiGleich: p1.shaDateiPc === p1.shaDateiServer, gleich: gleich + '/' + inBeiden, abw: abweichung.slice(0, 10), et: p3 }, null, 1) + '\n');
