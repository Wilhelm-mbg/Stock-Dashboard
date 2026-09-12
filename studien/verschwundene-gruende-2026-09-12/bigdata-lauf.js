'use strict';
/* Schritt 5: der Rest, den EDGAR nicht aufloest - und warum er eine STICHPROBE bleibt.
 *
 * Nach dem zweiten EDGAR-Durchgang sind 216 von 4.996 Reihen ohne Grund (4,3 %).
 * Bigdata.com koennte sie beantworten, aber jede Abfrage kostet Guthaben, und der
 * Auftrag deckelt bei 250 Einheiten. Bei rund 5 Einheiten je Abfrage waeren das
 * hoechstens 50 Reihen - ein Viertel des Rests. 50 einzeln aufgeloeste Kuerzel
 * aendern die Tafel um ein Prozent und sagen nichts darueber, was in den anderen
 * 166 steckt. Eine ZUFALLSSTICHPROBE sagt das: sie schaetzt die Zusammensetzung des
 * Rests mit einem Fehlerbalken, und die aufgeloesten Reihen wandern trotzdem in die
 * Tafel. Deshalb wird gezogen, nicht abgearbeitet.
 *
 * Die Ziehung ist deterministisch (fester Startwert), damit jede Wiederholung
 * dieselbe Stichprobe trifft und nachpruefbar ist.
 *
 * Aufruf:  node bigdata-lauf.js ziehen     -> bigdata-stichprobe.json
 *          node bigdata-lauf.js buchen     -> prueft das Guthabenbuch gegen den Deckel
 * Die Abfragen selbst laufen ueber den Connector der Sitzung, nicht aus diesem Skript.
 */
var fs = require('fs');
var path = require('path');

var DECKEL = 250;                 // Auftrag: hoechstens 250 Guthaben-Einheiten
var KOSTEN = 5;                   // Faustwert je Abfrage laut Auftrag
var STARTWERT = 20260912;

/* Linearer Kongruenzgenerator - kurz, ohne Abhaengigkeit, und bei festem Startwert
 * ueber jede Node-Version hinweg gleich. Math.random() waere hier nicht nachpruefbar. */
function wuerfel(saat) {
  var s = saat >>> 0;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function ziehen(anzahl) {
  var T = JSON.parse(fs.readFileSync(path.join(__dirname, 'verschwundene-gruende.json'), 'utf8'));
  var rest = T.reihen.filter(function (x) { return x.grund === 'unbekannt'; })
    .sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
  var r = wuerfel(STARTWERT), aus = [], kopie = rest.slice();
  for (var i = 0; i < anzahl && kopie.length; i++) aus.push(kopie.splice(Math.floor(r() * kopie.length), 1)[0]);
  var j = { stand: new Date().toISOString(), grundgesamtheit: rest.length, gezogen: aus.length,
    startwert: STARTWERT, deckel: DECKEL, kostenJeAbfrage: KOSTEN,
    reihen: aus.map(function (x) { return { reihe: x.reihe, letzter_balken: x.letzter_balken, letzter_kurs_archiv: x.letzter_kurs_archiv }; }) };
  fs.writeFileSync(path.join(__dirname, 'bigdata-stichprobe.json'), JSON.stringify(j, null, 1));
  console.log('Grundgesamtheit ' + rest.length + ', gezogen ' + aus.length);
  console.log(aus.map(function (x) { return x.reihe + ' ' + x.letzter_balken; }).join('\n'));
}

/* Deckelpruefung. Wird vor JEDER Abfrage gestellt und bricht ab, statt zu warnen. */
function darfNoch(verbraucht, abfragen) {
  if (verbraucht + KOSTEN > DECKEL) return false;
  return true;
}

function buchen() {
  var p = path.join(__dirname, 'bigdata-ergebnis.json');
  if (!fs.existsSync(p)) { console.log('noch kein Guthabenbuch'); return; }
  var B = JSON.parse(fs.readFileSync(p, 'utf8'));
  var verbraucht = B.vorher - B.nachher;
  if (verbraucht > DECKEL) { console.error('ROT: ' + verbraucht.toFixed(2) + ' verbraucht, Deckel ' + DECKEL); process.exit(1); }
  if (!darfNoch(verbraucht - KOSTEN, B.abfragen)) console.log('Hinweis: Deckel ist erreicht, kein weiterer Aufruf zulaessig.');
  console.log('vorher ' + B.vorher + ', nachher ' + B.nachher + ', verbraucht ' + verbraucht.toFixed(4) + ' von ' + DECKEL + ' bei ' + B.abfragen + ' Abfragen');
}

module.exports = { DECKEL: DECKEL, KOSTEN: KOSTEN, darfNoch: darfNoch };
if (require.main === module) {
  var b = process.argv[2];
  if (b === 'ziehen') ziehen(Number(process.argv[3] || 12));
  else buchen();
}
