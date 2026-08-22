/* Traegt der billigere Schein die Kante - oder schneidet sein Stop sie ab?
 *
 * Befund: rsi2seit hat einen NEGATIVEN Median (-0,023 Pp); der positive Erwartungswert
 * (+0,099) steckt ganz im rechten Rand. Ein Stop schneidet Verteilungsraender ab.
 * Der BV-1,0-Schein hat Hebel 9,8; bei 20 % Stop auf den Schein loest ein Rueckschlag
 * von 20/9,8 = 2,04 % im Basiswert aus. Die Aktie 1x wird davon gar nicht getroffen.
 *
 * Gerechnet wird der MAXIMALE GEGENLAUF (MAE) je Trade aus Hoch/Tief der Archivkerzen
 * ueber die Haltedauer - und was uebrig bleibt, wenn ausgestoppte Trades beim Stop enden.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'ergebnisse');
const STORE = (process.env.APPDATA || require('os').homedir() + '/AppData/Roaming') + '/markt-dashboard/store/';

const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : 0; };
const sd = a => { if (a.length < 2) return 0; const m = mean(a); let s = 0; for (const x of a) s += (x - m) * (x - m); return Math.sqrt(s / (a.length - 1)); };
const r3 = x => Math.round(x * 1000) / 1000;
const HOLD_BARS = 7;          // 8 h auf 60m = 7 Sitzungskerzen

// Signale einsammeln (beide Phasen - hier wird nichts ausgewaehlt)
const sig = [];
for (const ph of ['entdeckung', 'bestaetigung']) {
  let L; try { L = JSON.parse(fs.readFileSync(path.join(OUT, 'lauf-60m-' + ph + '.json'), 'utf8')); } catch (e) { continue; }
  for (const e of (L.ereignisse.rsi2seit || [])) if (e.dir === 1 && e.fwd['1T'] != null) sig.push(e);
}
console.log('rsi2seit long, 60m: ' + sig.length + ' Signale\n');

const bars = {};
function reihe(sym) {
  if (!bars[sym]) {
    try { bars[sym] = (JSON.parse(fs.readFileSync(STORE + 'bars_60m_' + sym + '.json', 'utf8')).series || []).filter(b => b[0] % 60000 === 0); }
    catch (e) { bars[sym] = []; }
  }
  return bars[sym];
}

// MAE und Endertrag je Trade
const trades = [];
for (const s of sig) {
  const B = reihe(s.sym); if (!B.length) continue;
  let i = -1; for (let k = 0; k < B.length; k++) if (B[k][0] === s.t) { i = k; break; }
  if (i < 0 || i + HOLD_BARS >= B.length) continue;
  const p0 = B[i][1]; if (!(p0 > 0)) continue;
  let mae = 0;
  for (let k = i + 1; k <= i + HOLD_BARS; k++) {
    const tief = B[k][4] != null ? B[k][4] : B[k][1];
    if (!(tief > 0)) continue;
    const dd = (tief - p0) / p0 * 100;          // negativ = Gegenlauf
    if (dd < mae) mae = dd;
  }
  const ende = (B[i + HOLD_BARS][1] - p0) / p0 * 100;
  trades.push({ tag: s.tag, mae, ende, ex: s.fwd['1T'] * 100 });
}
console.log('auswertbar: ' + trades.length + ' Trades\n');

const maes = trades.map(t => t.mae).sort((a, b) => a - b);
const q = p => maes[Math.floor(maes.length * p)];
console.log('Maximaler Gegenlauf (MAE) im Basiswert waehrend der 8 Stunden:');
console.log('  Median ' + r3(q(0.5)) + ' %   25 % schlechter als ' + r3(q(0.25)) +
  ' %   10 % schlechter als ' + r3(q(0.10)) + ' %   schlimmster ' + r3(maes[0]) + ' %\n');

/* Wie viele Trades stoppt welcher Stop aus - und was bleibt uebrig?
 * Ausgestoppt: Ertrag = Stop-Schwelle (im Basiswert), sonst der echte Endertrag.
 * Die Kontrolle (Ueberschuss) wird proportional mitgefuehrt. */
console.log('Produkt / Stop            stoppt aus   mittl. Ertrag   Ueberschuss   Huerde   netto');
const VAR = [
  { name: 'Aktie 1x, kein Stop', schwelle: null, huerde: 0.100 },
  { name: 'Schein BV1,0, SL 20 %', schwelle: -20 / 9.8, huerde: 0.066 },
  { name: 'Schein BV1,0, SL 30 %', schwelle: -30 / 9.8, huerde: 0.066 },
  { name: 'Schein BV1,0, SL 45 %', schwelle: -45 / 9.8, huerde: 0.066 },
  { name: 'Standard-Schein, SL 20 %', schwelle: -20 / 16.2, huerde: 0.261 },
];
const basisEnde = mean(trades.map(t => t.ende));
const basisEx = mean(trades.map(t => t.ex));
for (const v of VAR) {
  let gestoppt = 0;
  const ende = trades.map(t => {
    if (v.schwelle != null && t.mae <= v.schwelle) { gestoppt++; return v.schwelle; }
    return t.ende;
  });
  const mEnde = mean(ende);
  // Ueberschuss = Endertrag minus (Endertrag - Ueberschuss) der ungestoppten Rechnung,
  // also die Kontrolle bleibt gleich: ex = ende - kontrolle
  const kontrolle = basisEnde - basisEx;
  const ex = mEnde - kontrolle;
  console.log('  ' + v.name.padEnd(24) + (v.schwelle == null ? '     –' : (gestoppt / trades.length * 100).toFixed(0).padStart(5) + ' %') +
    r3(mEnde).toString().padStart(16) + r3(ex).toString().padStart(14) + v.huerde.toFixed(3).padStart(9) +
    ((ex - v.huerde) > 0 ? '  +' : '  ') + r3(ex - v.huerde));
}
console.log('\nLesart: Der billigere Schein spart 0,034 Pp Huerde. Kostet sein Stop mehr als das,');
console.log('ist die Aktie trotz hoeherer Huerde die bessere Wahl - der Rand traegt die Kante.');
