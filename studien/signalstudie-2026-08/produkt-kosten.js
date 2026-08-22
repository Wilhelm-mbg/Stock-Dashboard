/* PHASE 5 - Produktfrage: Was kostet ein Umlauf je Produkt, UMGERECHNET AUF DEN BASISWERT?
 *
 * Die Kante einer Strategie wird in Prozentpunkten des Basiswerts gemessen. Jedes Produkt
 * uebersetzt diese Bewegung anders - und hat eigene Kosten. Vergleichbar sind die Produkte
 * nur, wenn man ALLE Kosten auf dieselbe Einheit bringt: Prozentpunkte Basiswert je Umlauf.
 *
 *   Optionsschein : Spanne am Schein (Cent-Modell der App, an Emittentenkursen geeicht)
 *                   geteilt durch den Hebel (Omega) -> Basiswert-Aequivalent; dazu der
 *                   Zeitwertverlust ueber die Haltedauer (Theta), ebenfalls durch Omega.
 *   CFD           : Geld/Brief-Spanne des CFD (wird ab 24.08. gemessen; hier Annahmen
 *                   2/5/10 Bp) - im Basiswert-Aequivalent 1:1, Hebel aendert nichts daran,
 *                   weil die Spanne auf den Basiswert gestellt wird. Ueber Nacht: Finanzierung.
 *   Aktie         : Spanne liquider US-Namen ~1-3 Bp plus Gebuehr. Kein Hebel, Kapital bindet.
 *   US-Option     : Spanne je nach Moneyness, in Prozent des Optionspreises; gleiche
 *                   Umrechnung wie beim Schein. Annahmen 2 %/5 % - markiert als Annahme.
 *
 * Das Modell der App wird EXAKT so benutzt wie im Depot (Q.makeWarrant, Q.warrantValue,
 * Q.effSpread, Q.warrantOmega) - Profile aus Q.PROFILES.
 */
'use strict';
const Q = require('../../quant.js');

const SPOT = 200, VOL = 0.30, NOW = Date.UTC(2026, 7, 24, 14, 0);
const HALTE = [[3 / 24 / 7, '3 h'], [1 / 5, '1 Handelstag'], [1, '1 Woche'], [3, '3 Wochen']];   // in Wochen

function schein(profKey, dir) {
  const P = Q.PROFILES[profKey];
  const w = Q.makeWarrant(dir, SPOT, VOL, NOW, P.ratio);
  // Profil anwenden: Strike-Abstand und Laufzeit wie im Schein-Finder
  w.strike = Math.round(SPOT * (dir === 'call' ? 1 + P.otmPct : 1 - P.otmPct) * 100) / 100;
  w.expiry = NOW + P.days * 86400000;
  const wert = Q.warrantValue(dir, w, SPOT, NOW);
  const spx = Q.effSpread(w.iv, undefined, wert, w.ratio);          // je Seite, Anteil am Scheinpreis
  const omega = Q.warrantOmega(dir, w, SPOT, NOW);
  return { P, w, wert, spx, omega };
}

console.log('Kosten je UMLAUF in Prozentpunkten des BASISWERTS  (Spot ' + SPOT + ' $, Vola ' + VOL * 100 + ' %)\n');
console.log('Produkt                           Hebel   Spanne/Seite      Halte: ' + HALTE.map(h => h[1].padStart(12)).join(''));
console.log('                                          (am Produkt)      ' + HALTE.map(() => '   Kosten Pp').join(''));

// Optionsscheine
for (const key of ['atm21', 'otm3_14', 'otm5_10', 'atm60_b']) {
  const s = schein(key, 'call');
  const zeile = [];
  for (const [wochen] of HALTE) {
    const spaeter = Q.warrantValue('call', s.w, SPOT, NOW + wochen * 7 * 86400000);
    const theta = Math.max(0, (s.wert - spaeter) / s.wert);                    // Anteil am Scheinpreis
    const kostenSchein = 2 * s.spx + theta;                                      // Umlauf: zwei Seiten + Zeitwert
    const kostenBasis = kostenSchein / s.omega * 100;                            // in Pp Basiswert
    zeile.push(kostenBasis);
  }
  console.log(('Schein ' + s.P.name).padEnd(34) + String(s.omega.toFixed(1)).padStart(5) + '   ' +
    (s.spx * 100).toFixed(2).padStart(6) + ' % (' + s.wert.toFixed(2) + ' EUR)   ' +
    zeile.map(v => v.toFixed(3).padStart(12)).join(''));
}

// CFD: Spanne auf den Basiswert gestellt; Finanzierung ~5 % p.a. auf den Nominalwert ueber Nacht
for (const bp of [2, 5, 10]) {
  const zeile = HALTE.map(([wochen]) => {
    const naechte = Math.max(0, Math.round(wochen * 5) - (wochen < 0.2 ? 1 : 0));   // 3h = 0 Naechte
    const fin = 0.05 / 365 * Math.max(0, naechte) * 100 * 7 / 5;                     // Kalendertage
    return 2 * bp / 100 + fin;
  });
  console.log(('CFD, Spanne ' + bp + ' Bp (Annahme, ab 24.08. gemessen)').padEnd(34) + '  1-5   ' + (bp / 100).toFixed(2).padStart(6) + ' %              ' +
    zeile.map(v => v.toFixed(3).padStart(12)).join(''));
}

// Aktie: Spanne 1-3 Bp + 1 $ Gebuehr je Seite auf 10.000 $ Position
for (const bp of [1, 3]) {
  const geb = 2 * 1 / 10000 * 100;
  const zeile = HALTE.map(() => 2 * bp / 100 + geb);
  console.log(('Aktie, Spanne ' + bp + ' Bp + 1 $/Seite').padEnd(34) + '    1   ' + (bp / 100).toFixed(2).padStart(6) + ' %              ' +
    zeile.map(v => v.toFixed(3).padStart(12)).join(''));
}

// US-Option ATM, 21 Tage: Optionspreis via BS mit Ratio 1, Spanne 2 % / 5 % des Optionspreises (ANNAHME)
for (const sp of [0.02, 0.05]) {
  const w = { strike: SPOT, expiry: NOW + 21 * 86400000, iv: VOL * 1.1, ratio: 1 };
  const wert = Q.warrantValue('call', w, SPOT, NOW);
  const omega = Q.warrantOmega('call', w, SPOT, NOW);
  const zeile = HALTE.map(([wochen]) => {
    const spaeter = Q.warrantValue('call', w, SPOT, NOW + wochen * 7 * 86400000);
    const theta = Math.max(0, (wert - spaeter) / wert);
    return (2 * sp + theta) / omega * 100;
  });
  console.log(('US-Option ATM 21T, Spanne ' + (sp * 100) + ' % (Annahme)').padEnd(34) + String(omega.toFixed(1)).padStart(5) + '   ' +
    (sp * 100).toFixed(2).padStart(6) + ' % (' + wert.toFixed(2) + ' $)     ' +
    zeile.map(v => v.toFixed(3).padStart(12)).join(''));
}

console.log('\nLesart: Eine Kante muss BRUTTO groesser sein als die Zahl in ihrer Spalte, sonst ist sie');
console.log('mit diesem Produkt nicht handelbar. Die 0,10 Pp der Studien-Annahme entsprechen der CFD-Zeile');
console.log('mit 5 Bp Spanne. Schein-Kosten steigen mit der Haltedauer durch den Zeitwert - beim');
console.log('3-Wochen-Halten frisst Theta allein mehr als jede Intraday-Kante dieses Projekts.');
