'use strict';
/* ================= #80: Eichung der Kanal-Guete gegen Rauschen =================
 *
 * Wilhelms Entscheid (26.08.2026, Weg 2): die Guete wird als Perzentil gegen
 * Rauschen angezeigt. Dafuer braucht es die Verteilung der Guete, die DIESELBE
 * Suche (Q.kanaele + Q.kanalSegmente) auf reinen Zufallspfaden produziert.
 *
 * Warum die Pipeline und nicht der Einzel-Fit: kanaele() waehlt selbst das beste
 * Fenster und den besten Kanal - der angezeigte Kanal ist ein Maximum ueber
 * Kandidaten. Eicht man nur den Einzel-Fit, unterschaetzt man die Zufalls-
 * erwartung genau um diese Auswahl. Hier wird gesammelt, was die Suche AUSGIBT.
 *
 * Deterministisch (feste xorshift-Seeds, dasselbe Muster wie test-channel.js).
 * Aufruf:  node studien/kanal-guete-2026-08-26/eichung.js
 * Ausgabe: eichtabelle.json (Rohdaten) + der fertige Konstanten-Block fuer
 * quant.js auf stdout. */
var path = require('path');
var fs = require('fs');
var Q = require(path.join(__dirname, '..', '..', 'quant.js'));

function machRnd(seed) {
  var s = seed | 0 || 1;
  return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) / 4294967296) - 0.5; };
}

/* Zufallspfad wie in test-channel.js Nr. 15c: additiver Random Walk. Die Guete
 * ist skalenfrei gebaut (r2, Beruehrungen, Enge relativ zu sigma) - die
 * Schrittweite kuerzt sich heraus, gewaehlt wie dort: 2,5 je Kerze. */
function zufallspfad(rnd, laenge) {
  var bars = [], p = 100 + rnd() * 20;
  for (var i = 0; i < laenge; i++) { p += rnd() * 2.5; bars.push([i * 3600000, p, 1000]); }
  return bars;
}

/* n-Klassen: die Fensterlaengen, die die Suche real ausgibt (>= 25). Grenzen so
 * gewaehlt, dass jede Klasse dicht besetzt ist; die letzte ist offen. */
var KLASSEN = [[25, 40], [40, 55], [55, 75], [75, 100], [100, 135], [135, 180], [180, 240], [240, 1e9]];
function klasseVon(n) {
  for (var i = 0; i < KLASSEN.length; i++) if (n >= KLASSEN[i][0] && n < KLASSEN[i][1]) return i;
  return -1;
}

var LAENGEN = [60, 90, 120, 180, 250, 400, 600];
var JE_LAENGE = 600;

var proben = KLASSEN.map(function () { return []; });
var gesamtKanaele = 0;
LAENGEN.forEach(function (L, li) {
  for (var lauf = 0; lauf < JE_LAENGE; lauf++) {
    var rnd = machRnd(100000 + li * 10000 + lauf);
    var rw = zufallspfad(rnd, L);
    var raus = [];
    try { raus = raus.concat(Q.kanaele(rw) || []); } catch (e) { /* zu kurz o.ae. */ }
    try { raus = raus.concat(Q.kanalSegmente(rw) || []); } catch (e2) { /* dito */ }
    raus.forEach(function (k) {
      if (!k || !isFinite(k.guete) || !isFinite(k.n)) return;
      var ki = klasseVon(k.n);
      if (ki >= 0) { proben[ki].push(k.guete); gesamtKanaele++; }
    });
  }
});

/* Je Klasse: fuer jede ganze Guete 0..100 der Anteil der Zufallskanaele mit
 * ECHT kleinerer Guete (0..1000, in Promille - ganzzahlig, kompakt). */
var tabelle = KLASSEN.map(function (kl, ki) {
  var g = proben[ki].slice().sort(function (a, b) { return a - b; });
  var anteil = [];
  var j = 0;
  for (var guete = 0; guete <= 100; guete++) {
    while (j < g.length && g[j] < guete) j++;
    anteil.push(g.length ? Math.round(j / g.length * 1000) : 0);
  }
  var median = g.length ? g[Math.floor(g.length / 2)] : null;
  return { von: kl[0], bis: kl[1] >= 1e9 ? null : kl[1], laeufe: g.length, medianGuete: median, anteilPromille: anteil };
});

fs.writeFileSync(path.join(__dirname, 'eichtabelle.json'), JSON.stringify({
  verfahren: 'Pipeline-Eichung: Q.kanaele + Q.kanalSegmente auf additiven Random Walks (xorshift, Seeds 100000+li*10000+lauf), Laengen ' + LAENGEN.join('/') + ', je ' + JE_LAENGE + ' Laeufe',
  gesamtKanaele: gesamtKanaele,
  klassen: tabelle
}, null, 1));

console.log('Eichung fertig: ' + gesamtKanaele + ' Zufallskanaele.');
console.log('Median-Guete je n-Klasse (der #80-Befund sagte ~75):');
tabelle.forEach(function (t) {
  console.log('  n ' + String(t.von).padStart(3) + '-' + (t.bis == null ? 'oo ' : String(t.bis).padStart(3)) +
    ': ' + t.laeufe + ' Kanaele, Median ' + t.medianGuete);
});
console.log('\n/* --- Konstanten-Block fuer quant.js (von eichung.js erzeugt) --- */');
console.log('var GUETE_RAUSCHEN = ' + JSON.stringify(tabelle.map(function (t) {
  return { von: t.von, anteil: t.anteilPromille };
})) + ';');
