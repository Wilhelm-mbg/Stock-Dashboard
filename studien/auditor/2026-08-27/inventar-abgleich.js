'use strict';
/* ====== Auditor: Inventar gegen den Quelltext abgleichen (27.08.2026) ======
 *
 * Nimmt inventar.json (aus probe-inventar-regeln.js) und fragt fuer jede Kennung:
 * greift der Code sie ueberhaupt ab? Daraus entsteht die Spalte "lebt es?" -
 * ABER nur als VERDACHT, nie als Urteil.
 *
 * WARUM NUR VERDACHT: "keine Fundstelle" ist ein Nullbefund. Er kann heissen,
 * dass das Bedienelement tot ist - oder dass es ueber einen Sammel-Aufruf
 * verdrahtet ist (Delegation an einen Elternknoten, ein data-Attribut, eine
 * Schleife ueber querySelectorAll). Genau das kommt in dieser Oberflaeche vor:
 * die Reiter und Pillen haengen an data-tab/data-sub, nicht an ihren Kennungen.
 * Deshalb wird hier gezaehlt und markiert, nicht entschieden - `06` prueft die
 * Verdachtsfaelle von der Code-Seite.
 *
 * POSITIVKONTROLLE: das Skript prueft sich an drei Kennungen, von denen bekannt
 * ist, dass sie im Code stehen. Findet es die nicht, ist der ganze Lauf wertlos
 * und es sagt das.
 *
 * Aufruf:  node studien/auditor/2026-08-27/inventar-abgleich.js <pfad-zu-inventar.json>
 */
const fs = require('fs');
const path = require('path');

const WURZEL = path.join(__dirname, '..', '..', '..');
const quelleJson = process.argv[2];
if (!quelleJson) { console.error('Pfad zu inventar.json fehlt.'); process.exit(1); }
const INV = JSON.parse(fs.readFileSync(quelleJson, 'utf8'));

/* Alle Oberflaechen-Skripte der Wurzel - dort wohnt die Verdrahtung. */
const DATEIEN = fs.readdirSync(WURZEL)
  .filter((f) => f.endsWith('.js'))
  .filter((f) => !/^(test-|bt-worker)/.test(f));
const QUELLEN = {};
DATEIEN.forEach((f) => {
  try { QUELLEN[f] = fs.readFileSync(path.join(WURZEL, f), 'utf8'); } catch (e) { /* egal */ }
});

/* MIT UMFELD, nicht nur die Trefferzeile. Der erste Wurf sah allein auf die Zeile,
 * in der die Kennung steht - und meldete 23 Knoepfe als "nie verdrahtet", darunter
 * offensichtlich funktionierende wie #stcBtn "Chart laden". Der Grund ist banal:
 * die Verdrahtung steht fast immer eine Zeile SPAETER
 *   var b = document.getElementById('stcBtn');
 *   b.addEventListener('click', ...)
 * Eine Heuristik, die das nicht sieht, erzeugt Verdachtsfaelle am Fliessband -
 * derselbe Fehlertyp wie bei #109, nur in Serie. Deshalb ein Fenster von +/-4
 * Zeilen, und zusaetzlich die Zuweisung an eine Variable, die kurz darauf
 * verdrahtet wird. */
const UMFELD = 4;
function fundstellen(kennung) {
  if (!kennung) return [];
  const treffer = [];
  const muster = new RegExp('[\'"#]' + kennung.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\'"\\s)\\]]');
  Object.keys(QUELLEN).forEach((f) => {
    const zeilen = QUELLEN[f].split('\n');
    zeilen.forEach((z, i) => {
      if (!muster.test(z)) return;
      const von = Math.max(0, i - UMFELD), bis = Math.min(zeilen.length, i + UMFELD + 1);
      treffer.push({ datei: f, zeile: i + 1, text: z.trim().slice(0, 110),
        umfeld: zeilen.slice(von, bis).join(' ⏎ ') });
    });
  });
  return treffer;
}

/* Wird die Kennung nur GELESEN oder auch VERDRAHTET? Gemessen am Umfeld. */
const WIRE = /addEventListener|\.onclick|\.onchange|\.oninput|\.onsubmit|\bon\s*\(/;
function artDerNutzung(treffer) {
  const zeile = treffer.map((x) => x.text).join(' | ');
  const umfeld = treffer.map((x) => x.umfeld || x.text).join(' | ');
  return {
    verdrahtet: WIRE.test(umfeld),
    verdrahtetInZeile: WIRE.test(zeile),
    gelesen: /getElementById|querySelector/.test(umfeld),
    wertZugriff: /\.value|\.checked|\.textContent|\.innerHTML|\.disabled/.test(umfeld)
  };
}

/* --- Positivkontrolle: drei Kennungen, die im Code stehen MUESSEN --- */
const KONTROLLE = ['stratListe', 'kostenHuerde', 'scoreboard'];
const kontrollErgebnis = KONTROLLE.map((k) => ({ kennung: k, treffer: fundstellen(k).length }));
const kontrolleOk = kontrollErgebnis.every((k) => k.treffer > 0);

console.log('=== POSITIVKONTROLLE ===');
kontrollErgebnis.forEach((k) => console.log('  ' + k.kennung + ': ' + k.treffer + ' Fundstellen'));
console.log('  -> ' + (kontrolleOk ? 'BESTANDEN, der Abgleich sucht wirklich'
  : 'DURCHGEFALLEN - jeder Nullbefund unten ist wertlos'));
if (!kontrolleOk) process.exit(2);

const zeilen = [];
const ohneKennung = [];
const verdacht = [];

INV.subs.forEach((s) => {
  s.elemente.forEach((e) => {
    if (!e.sichtbar) return;
    if (!e.id) {
      ohneKennung.push({ sub: s.pille, tag: e.tag, name: e.name, karte: e.karte,
        daten: e.datenAttribute.join(',') });
      return;
    }
    const tr = fundstellen(e.id);
    const art = artDerNutzung(tr);
    const eintrag = {
      sub: s.pille, id: e.id, tag: e.tag + (e.typ ? '[' + e.typ + ']' : ''),
      name: e.name, karte: e.karte,
      wert: e.wert ? e.wert.wert : '', fokussierbar: e.fokussierbar,
      fundstellen: tr.length,
      verdrahtet: art.verdrahtet, gelesen: art.gelesen, wert_zugriff: art.wertZugriff,
      dateien: Array.from(new Set(tr.map((x) => x.datei))).slice(0, 3).join(' ')
    };
    zeilen.push(eintrag);
    if (tr.length === 0) verdacht.push(eintrag);
  });
});

console.log('\n=== UMFANG ===');
INV.subs.forEach((s) => console.log('  ' + s.pille.padEnd(26) +
  String(s.zahlSichtbar).padStart(3) + ' sichtbar von ' + String(s.zahlGesamt).padStart(3) +
  ' | ' + String(s.karten.length).padStart(2) + ' Karten | ' +
  String(s.textZeichen).padStart(5) + ' Zeichen'));
console.log('  ' + 'SUMME'.padEnd(26) + String(zeilen.length + ohneKennung.length).padStart(3) + ' sichtbar');

console.log('\n=== OHNE KENNUNG (' + ohneKennung.length + ') - ueber data-Attribute oder Sammelaufrufe verdrahtet ===');
ohneKennung.slice(0, 30).forEach((o) => console.log('  [' + o.sub + '] ' + o.tag +
  ' "' + o.name.slice(0, 45) + '"' + (o.daten ? '  {' + o.daten + '}' : '')));

console.log('\n=== VERDACHT: keine Fundstelle im Code (' + verdacht.length + ') ===');
if (!verdacht.length) console.log('  keine');
verdacht.forEach((v) => console.log('  [' + v.sub + '] #' + v.id + ' (' + v.tag + ') "' + v.name.slice(0, 50) + '"'));
console.log('  ^ NICHT als tot melden. Nullbefund - Gegenprobe von der Code-Seite noetig.');

console.log('\n=== NUR GELESEN, NIE VERDRAHTET (Verdacht 2. Ordnung) ===');
const knoepfe = zeilen.filter((z) => z.tag.indexOf('button') === 0 && z.fundstellen > 0);
const nurGelesen = knoepfe.filter((z) => !z.verdrahtet);
/* SELBSTPRUEFUNG DES MELDERS. Ein Detektor, der ALLE Knoepfe als verdrahtet
 * durchwinkt, ist ein Gummistempel und sein Nullbefund wertlos - dieselbe Frage
 * wie beim Kontrast-Koeder heute frueh. Deshalb steht das Verhaeltnis dabei. */
console.log('  [Selbstpruefung] ' + knoepfe.length + ' Knoepfe mit Fundstelle, davon ' +
  (knoepfe.length - nurGelesen.length) + ' verdrahtet und ' + nurGelesen.length + ' nicht.');
if (nurGelesen.length === 0) {
  console.log('  ⚠ Der Melder hat KEINEN einzigen Knopf aussortiert. Das kann heissen,');
  console.log('    dass alle verdrahtet sind - oder dass der Melder alles durchwinkt.');
  console.log('    Ohne einen bekannt toten Knopf als Gegenprobe ist diese Null NICHT belastbar.');
} else {
  nurGelesen.forEach((z) => console.log('  [' + z.sub + '] #' + z.id + ' "' + z.name.slice(0, 45) +
    '" -> ' + z.dateien));
  console.log('  ^ Kein addEventListener/onclick im Umfeld von +/-4 Zeilen.');
  console.log('    KANN Delegation ueber einen Elternknoten sein - Gegenprobe durch `06` noetig.');
}

/* Doppelte Beschriftungen ueber die Unterreiter hinweg - "dieselbe Einstellung
 * an zwei Orten" ist Wilhelms Punkt 3. */
const nachName = {};
zeilen.concat(ohneKennung.map((o) => ({ sub: o.sub, id: '', name: o.name, karte: o.karte })))
  .forEach((z) => {
    const n = (z.name || '').toLowerCase().trim();
    if (!n || n.length < 4) return;
    (nachName[n] = nachName[n] || []).push(z.sub + (z.id ? '#' + z.id : ''));
  });
const doppelt = Object.keys(nachName)
  .filter((n) => new Set(nachName[n].map((x) => x.split('#')[0])).size > 1);
console.log('\n=== GLEICHE BESCHRIFTUNG IN MEHREREN UNTERREITERN (' + doppelt.length + ') ===');
doppelt.forEach((n) => console.log('  "' + n.slice(0, 55) + '" -> ' + nachName[n].join(', ')));

const ziel = path.join(path.dirname(quelleJson), 'abgleich.json');
fs.writeFileSync(ziel, JSON.stringify({ kontrolle: kontrollErgebnis, zeilen, ohneKennung, verdacht, doppelt }, null, 1));
console.log('\nGESCHRIEBEN: ' + ziel);
