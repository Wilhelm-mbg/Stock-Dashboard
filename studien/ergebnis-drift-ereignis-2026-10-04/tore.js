'use strict';
/* Die beiden Kunstfaelle fuer jedes Tor des Vorregistrierungs-Entwurfs (wiki/fehlerformen.md "Das Tor wurde nie am erwarteten
 * Fall geprueft"): Nullfall und eingepflanzter Effekt der erwarteten Groesse. Gerechnet wird NUR aus den blinden Standardfehlern
 * in aufloesung.json (Normalnaeherung) - kein Ertrag, keine Ueberraschung.            node tore.js  -> tore.json
 *
 * Groessen: A = Abstand oberstes minus unterstes Zehntel, B = oberstes Zehntel minus Klassenmittel (die Kaufseite).
 * Fehler je Fenster: der GROESSERE aus Zufalls-Zuteilung und Tagesreihe (Newey-West).
 * Tore:  E  = Entdeckung 2016-2020 mit t >= 2 (einseitig, erwartete Richtung)
 *        Bst = Bestaetigung 2021-2026 mit t >= 2 (gleiche Richtung)
 *        T1alt = die Projektregel "Entdeckung >= 4 x Bestaetigungs-MDE" (CLAUDE.md)
 * Szenarien (Erwartung aus der Literatur, KEIN Ergebnis): Abstand A ueber 60 Tage 4 Pp (Bernard/Thomas 1989), 2 Pp, 1 Pp;
 * ueber 20 Tage je ein Drittel davon; B = die Haelfte von A.
 */
var fs = require('fs');
var path = require('path');
var AU = require('./aufloesung.js');
var M = JSON.parse(fs.readFileSync(path.join(__dirname, 'aufloesung.json'), 'utf8'));

function zeile(teilmenge, H) { return M.zeilen.filter(function (r) { return r.teilmenge === teilmenge && r.H === H; })[0]; }
function fehler(r) { return { A: Math.max(r.seAbstandTag, r.nwAbstandTag), B: Math.max(r.seObenTag, r.nwObenTag) }; }

var aus = { stand: new Date().toISOString(), faelle: [] };
[20, 60].forEach(function (H) {
  var e = fehler(zeile('Hauptklassen 2016-2020', H)), b = fehler(zeile('Hauptklassen 2021-2026', H)), g = fehler(zeile('Hauptklassen 2016-2026', H));
  [0, 1, 2, 4].forEach(function (a60) {
    var A = a60 * (H === 60 ? 1 : 1 / 3), B = A / 2;
    ['A', 'B'].forEach(function (seite) {
      var d = seite === 'A' ? A : B, se = { e: e[seite], b: b[seite], g: g[seite] };
      var pE = AU.macht(d, se.e, 2), pB = AU.macht(d, se.b, 2);
      aus.faelle.push({ H: H, szenarioAbstand60: a60, groesse: seite, effekt: d, seEntdeckung: se.e, seBestaetigung: se.b, seGesamt: se.g,
        mdeBestaetigung: M.faktor * se.b, mdeGesamt: M.faktor * se.g,
        pEntdeckung: pE, pBestaetigung: pB, pBeide: pE * pB,
        /* Projektregel: Entdeckungswert >= 4 x Bestaetigungs-MDE; der Entdeckungswert streut mit seEntdeckung um den Effekt */
        tor1altSchwelle: 4 * M.faktor * se.b, pTor1alt: AU.phi((d - 4 * M.faktor * se.b) / se.e) });
    });
  });
});
fs.writeFileSync(path.join(__dirname, 'tore.json'), JSON.stringify(aus, null, 1));
function f(x, n) { return x.toFixed(n === undefined ? 2 : n); }
console.log('H | Szenario A60 | Groesse | Effekt | se Entd. | se Best. | MDE Best. | MDE gesamt | P(E) | P(Bst) | P(beide) | Tor-1-alt-Schwelle | P(Tor 1 alt)');
aus.faelle.forEach(function (x) {
  console.log([x.H, x.szenarioAbstand60, x.groesse, f(x.effekt), f(x.seEntdeckung, 3), f(x.seBestaetigung, 3), f(x.mdeBestaetigung), f(x.mdeGesamt),
    f(100 * x.pEntdeckung, 1) + ' %', f(100 * x.pBestaetigung, 1) + ' %', f(100 * x.pBeide, 2) + ' %', f(x.tor1altSchwelle), f(100 * x.pTor1alt, 2) + ' %'].join(' | '));
});
