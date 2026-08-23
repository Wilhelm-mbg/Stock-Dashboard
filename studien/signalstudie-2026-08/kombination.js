/* KOMBINATION der Erkenntnisse - was sich verbinden LAESST, ohne sich zu belügen.
 *
 * Erlaubt ist nur, was keine neue Auswahl trifft:
 *   (1) Belegte Kante x Produkt. Die Kante wurde unabhaengig gemessen (vorregistriert,
 *       nicht aus dem Scan gefischt); die Kostenhuerde ist Arithmetik. Kein neuer Test.
 *   (2) Belegte Kante x Regime. Die Regime-Zuteilung wurde separat validiert (R-TREND,
 *       t=3,2, seit 8.23.26 eingebaut) - ebenfalls vorab, nicht hier ausgewaehlt.
 *
 * NICHT erlaubt und hier bewusst NICHT gerechnet:
 *   - die 51 gescheiterten Kandidaten neu kombinieren (das waere dieselbe Mine, tiefer)
 *   - Kapitulations-Median "ohne Crash-Tage" als Kante nehmen (nachtraeglicher Ausschluss)
 *   - Bedingungen aus der Entdeckung, die die Bestaetigung nicht ueberlebt haben
 *
 * Gerechnet wird auf den ECHTEN Ereignissen der Studie: dieselben Trades, nur mit der
 * Kostenfunktion des jeweiligen Produkts statt der Pauschale von 0,10 Pp.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Q = require('../../quant.js');
const OUT = path.join(__dirname, 'ergebnisse');
const STORE = (process.env.APPDATA || require('os').homedir() + '/AppData/Roaming') + '/markt-dashboard/store/';

const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : 0; };
const sd = a => { if (a.length < 2) return 0; const m = mean(a); let s = 0; for (const x of a) s += (x - m) * (x - m); return Math.sqrt(s / (a.length - 1)); };
const r3 = x => Math.round(x * 1000) / 1000;
const tagVon = ms => new Date(ms).toISOString().slice(0, 10);

function tTag(entries) {
  const m = new Map();
  entries.forEach(e => { if (!m.has(e.tag)) m.set(e.tag, []); m.get(e.tag).push(e.x); });
  const dm = []; for (const [, v] of m) dm.push(mean(v));
  const M = mean(dm), S = sd(dm), n = dm.length;
  return { m: M, t: (n >= 2 && S > 0) ? M / S * Math.sqrt(n) : 0, se: n ? S / Math.sqrt(n) : 0, n };
}

/* Kostenhuerde je Produkt, in Pp des Basiswerts - identisch mit depot.js kostenHuerdePp */
function huerde(produkt, haltenMin, spot, vol) {
  spot = spot || 200; vol = vol || 0.30;
  const now = Date.now(), halten = Math.max(5, haltenMin);
  if (produkt === 'aktie') return 2 * 0.05;
  if (produkt === 'cfd5bp') {
    const naechte = Math.floor(halten / (60 * 24));
    return 2 * 0.05 + 0.05 / 365 * naechte * 100 * 7 / 5;
  }
  const P = Q.PROFILES[produkt]; if (!P) return null;
  const w = Q.makeWarrant('call', spot, vol, now, P.ratio);
  w.strike = Math.round(spot * (1 + (P.otmPct || 0)) * 100) / 100;
  w.expiry = now + P.days * 86400000;
  const wert = Q.warrantValue('call', w, spot, now); if (!(wert > 0.02)) return null;
  const spx = Q.effSpread(w.iv, undefined, wert, w.ratio);
  const omega = Q.warrantOmega('call', w, spot, now); if (!(omega > 0)) return null;
  const theta = Math.max(0, (wert - Q.warrantValue('call', w, spot, now + halten * 60000)) / wert);
  return (2 * spx + theta) / omega * 100;
}

const PRODUKTE = [
  ['atm60_b', 'Schein BV 1,0 / 60 T'],
  ['aktie', 'Aktie 1x'],
  ['cfd5bp', 'CFD (5 Bp, Annahme)'],
  ['atm21_b', 'Schein BV 1,0 / 21 T'],
  ['atm21', 'Standard-Schein (Vorgabe)'],
];

/* Index-Regime (ueber/unter EMA200) je Tag */
function regimeTabelle() {
  const gs = JSON.parse(fs.readFileSync(STORE + 'hist__GSPC.json', 'utf8'));
  const arr = (Array.isArray(gs) ? gs : (gs.series || [])).slice().sort((a, b) => a[0] - b[0]);
  const k = 2 / 201; let e = null; const reg = {};
  arr.forEach(b => { e = e == null ? b[1] : b[1] * k + e * (1 - k); reg[tagVon(b[0])] = b[1] > e; });
  return reg;
}

/* Ereignisse einer Kante aus BEIDEN Phasen zusammenziehen (kein Split noetig -
 * hier wird nichts ausgewaehlt, nur eine Kostenfunktion angewandt) */
function ereignisse(iv, det, dir, hor) {
  const out = [];
  for (const ph of ['entdeckung', 'bestaetigung']) {
    let L; try { L = JSON.parse(fs.readFileSync(path.join(OUT, 'lauf-' + iv + '-' + ph + '.json'), 'utf8')); } catch (e) { continue; }
    for (const ev of (L.ereignisse[det] || [])) {
      if (ev.dir !== dir || ev.fwd[hor] == null) continue;
      out.push({ tag: ev.tag, sym: ev.sym, x: ev.fwd[hor], bed: ev.bed });
    }
  }
  return out;
}

const reg = regimeTabelle();

console.log('KOMBINATION 1: belegte Kante x Produkt');
console.log('Dieselben Trades, nur mit der echten Kostenfunktion statt der Pauschale 0,10 Pp.\n');

const KANTEN = [
  { name: 'rsi2seit long', iv: '60m', det: 'rsi2seit', dir: 1, hor: '1T', haltenMin: 480 },
  { name: 'Kapitulation long', iv: '60m', det: 'kapitulation', dir: 1, hor: '5T', haltenMin: 1560 },
];

for (const K of KANTEN) {
  const ev = ereignisse(K.iv, K.det, K.dir, K.hor);
  if (!ev.length) { console.log(K.name + ': keine Ereignisse'); continue; }
  const roh = tTag(ev.map(e => ({ tag: e.tag, x: e.x })));
  console.log(K.name + ' (' + ev.length + ' Signale, ' + roh.n + ' Tage, Haltedauer ' +
    (K.haltenMin / 60).toFixed(0) + ' h)');
  console.log('  brutto ' + r3(roh.m * 100) + ' Pp, t(Tag) ' + r3(roh.t) + ', SE ' + r3(roh.se * 100));
  console.log('  Produkt                        Huerde    netto    t(netto)');
  for (const [p, label] of PRODUKTE) {
    const h = huerde(p, K.haltenMin);
    if (h == null) continue;
    const netto = roh.m * 100 - h;
    // t gegen H0: netto = 0  -> (brutto - huerde) / SE
    const tN = roh.se > 0 ? netto / (roh.se * 100) : 0;
    console.log('  ' + label.padEnd(30) + h.toFixed(3).padStart(6) + '  ' +
      (netto > 0 ? '+' : '') + netto.toFixed(3).padStart(7) + '   ' + r3(tN).toString().padStart(7) +
      (netto > 0 ? '   traegt' : ''));
  }
  console.log('');
}

console.log('KOMBINATION 2: belegte Kante x Regime (R-TREND, separat validiert)');
console.log('rsi2seit braucht Aufwaerts-Regime, Kapitulation den Stress - so ist es eingebaut.\n');
for (const K of KANTEN) {
  const ev = ereignisse(K.iv, K.det, K.dir, K.hor).filter(e => reg[e.tag] != null);
  if (!ev.length) continue;
  const ueber = ev.filter(e => reg[e.tag]), unter = ev.filter(e => !reg[e.tag]);
  const a = tTag(ueber.map(e => ({ tag: e.tag, x: e.x }))), b = tTag(unter.map(e => ({ tag: e.tag, x: e.x })));
  const hBest = Math.min.apply(null, PRODUKTE.map(p => huerde(p[0], K.haltenMin)).filter(v => v != null));
  console.log(K.name);
  console.log('  Index UEBER EMA200: ' + String(ueber.length).padStart(5) + ' Signale, ' + String(a.n).padStart(3) +
    ' Tage, brutto ' + r3(a.m * 100).toString().padStart(7) + ' Pp, t ' + r3(a.t).toString().padStart(6) +
    ', netto (bestes Produkt) ' + r3(a.m * 100 - hBest));
  console.log('  Index UNTER EMA200: ' + String(unter.length).padStart(5) + ' Signale, ' + String(b.n).padStart(3) +
    ' Tage, brutto ' + r3(b.m * 100).toString().padStart(7) + ' Pp, t ' + r3(b.t).toString().padStart(6) +
    ', netto (bestes Produkt) ' + r3(b.m * 100 - hBest));
  console.log('');
}

console.log('WAS DAS NICHT IST: ein neuer Test. Die Kombination wurde als KOMBINATION nie');
console.log('vorwaerts geprueft. Was sie liefert, ist eine Rechnung auf bekannten Zahlen -');
console.log('kein Beleg, dass sie in Zukunft traegt. Dafuer braucht es Handelstage, keine Rechnung.');
