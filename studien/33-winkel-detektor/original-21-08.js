/* Familie 'felix-winkel' (Ticket #33): Neuer Kanal-Abschnitt nach bestaetigtem
 * Wendepunkt; normierter Winkel (steigung*n/breite) dreht das Vorzeichen gegen
 * den Vor-Abschnitt und ist steil genug -> Signal in Richtung des neuen Winkels.
 *
 * Methodik strikt walk-forward:
 * - Wendepunkt mit Fenster F ist erst ab i >= wp.i + F bestaetigt. Q.wendepunkte
 *   auf der vollen Reihe + dieser Filter ist identisch mit einem Lauf auf
 *   bars[0..i], weil die WP-Bedingung nur bars[j-F..j+F] ansieht.
 * - Einstieg zum Schluss der Signalkerze. Nur intraday, kein Halten ueber Nacht.
 * - Raster: S in {0.5, 1.0} x F in {4, 6} (F = Fenster UND Bestaetigungs-Lag;
 *   ein Lag kuerzer als das Fenster wuerde in die Zukunft schauen).
 * - Anmerkung: kanalUeber verlangt bis-von >= 15, d.h. der junge Abschnitt
 *   liefert praktisch erst ab 16 Kerzen einen Kanal (Spec sagt "ab 10"; darunter
 *   gibt der Helfer null zurueck -> Bedingung steht noch nicht).
 * - Signal verworfen (zu nah am Tagesschluss): Abschnitt gilt als gefeuert,
 *   aber kein Cooldown (kein Trade fand statt).
 */
'use strict';
const fs = require('fs');
const Q = require('C:/Users/Wilhe/Downloads/Stock-Dashboard/quant.js');
const DIR = 'C:/Users/Wilhe/AppData/Local/Temp/claude/C--Users-Wilhe-AppData-Local-Programs-markt-dashboard/5d59645f-0547-4aec-912b-09c638f04c24/scratchpad/';

const TFS = [
  { tf: '5m',  file: 'wende-5m.json',  hor: [[12, '1h'], [36, '3h']], cooldown: 12, minRest: 6 },
  { tf: '15m', file: 'wende-15m.json', hor: [[4, '1h'], [12, '3h']],  cooldown: 4,  minRest: 2 },
  { tf: '1m',  file: 'wende-1m.json',  hor: [[60, '1h'], [180, '3h']], cooldown: 60, minRest: 30 },
];
const CONFIGS = [
  { name: 'S0.5-F4', S: 0.5, F: 4 },
  { name: 'S1.0-F4', S: 1.0, F: 4 },
  { name: 'S0.5-F6', S: 0.5, F: 6 },
  { name: 'S1.0-F6', S: 1.0, F: 6 },
];

function mean(a) { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : 0; }
function sd(a) {
  if (a.length < 2) return 0;
  const m = mean(a); let s = 0;
  for (const x of a) s += (x - m) * (x - m);
  return Math.sqrt(s / (a.length - 1));
}
const r2 = x => Math.round(x * 100) / 100;
const r3 = x => Math.round(x * 1000) / 1000;

/* Handelstage: Kalendertag des Stempels (UTC-Tag deckt sich fuer RTH mit dem ET-Tag). */
function daySegments(bars) {
  const segs = [];
  let s = 0;
  for (let i = 1; i <= bars.length; i++) {
    if (i === bars.length || Math.floor(bars[i][0] / 86400000) !== Math.floor(bars[s][0] / 86400000)) {
      segs.push({ s, e: i - 1 });
      s = i;
    }
  }
  return segs;
}

/* Kontrolle H: mittlere H-Kerzen-Rendite aus NICHT ueberlappenden Fenstern,
 * innerhalb der Tage (Signale halten nie ueber Nacht, die Basislinie auch nicht). */
function ctrlH(bars, segs, H) {
  const rets = [];
  for (const g of segs) {
    for (let k = g.s; k + H <= g.e; k += H) {
      const a = bars[k][1], b = bars[k + H][1];
      if (a == null || b == null || a === 0) continue;
      rets.push((b - a) / a);
    }
  }
  return mean(rets);
}

/* Kontrolle TS: mittlere Rendite Kerze -> Tagesschluss ueber alle Kerzen. */
function ctrlTS(bars, segs) {
  const rets = [];
  for (const g of segs) {
    const ce = bars[g.e][1];
    if (ce == null) continue;
    for (let k = g.s; k <= g.e; k++) {
      const a = bars[k][1];
      if (a == null || a === 0) continue;
      rets.push((ce - a) / a);
    }
  }
  return mean(rets);
}

const winkel = k => k.steigung * k.n / k.breite;

/* Detektor: einmal je Abschnitt, beim ersten i, an dem alle Bedingungen stehen. */
function detect(bars, S, F, cooldown, minRest, dayEnd) {
  const wp = Q.wendepunkte(bars, F);
  const all = wp.hoch.map(w => ({ i: w.i }))
    .concat(wp.tief.map(w => ({ i: w.i })))
    .sort((a, b) => a.i - b.i);
  const sigs = [];
  let p = 0;
  const C = []; // bestaetigte Wendepunkte in Bestaetigungs-Reihenfolge
  let sectionDone = true;
  let winkelAlt = 0;
  let lastSig = -1e9;
  for (let i = 0; i < bars.length; i++) {
    // neu bestaetigte Wendepunkte einspielen (Walk-forward: erst ab wp.i + F)
    while (p < all.length && all[p].i + F <= i) {
      C.push(all[p]); p++;
      sectionDone = false;
      winkelAlt = 0;
      if (C.length >= 2) {
        const w = C[C.length - 1], wv = C[C.length - 2];
        const kAlt = Q.kanalUeber(bars, wv.i, w.i);
        if (kAlt && kAlt.breite > 0) winkelAlt = winkel(kAlt);
      }
      // Ohne echten Vortrend kann dieser Abschnitt nie feuern
      if (Math.abs(winkelAlt) < 0.5) sectionDone = true;
    }
    if (sectionDone) continue;
    const w = C[C.length - 1];
    if (i - w.i < 10) continue;               // junger Abschnitt erst ab 10 Kerzen
    if (i - lastSig < cooldown) continue;     // Cooldown je Symbol
    const kNeu = Q.kanalUeber(bars, w.i, i);  // liefert null unter 16 Kerzen
    if (!kNeu || !(kNeu.breite > 0)) continue;
    const wn = winkel(kNeu);
    if (Math.abs(wn) < S) continue;
    if (Math.sign(wn) === Math.sign(winkelAlt)) continue;
    // alle Bedingungen stehen -> Abschnitt feuert genau jetzt
    sectionDone = true;
    if (dayEnd[i] - i < minRest) continue;    // verworfen: zu nah am Tagesschluss
    lastSig = i;
    sigs.push({ i, dir: wn > 0 ? 1 : -1 });
  }
  return sigs;
}

/* Auswertung eines Buckets: Liste {sym, t, excess} */
function auswerten(entries) {
  const n = entries.length;
  const bySym = new Map();
  for (const e of entries) {
    if (!bySym.has(e.sym)) bySym.set(e.sym, []);
    bySym.get(e.sym).push(e.excess);
  }
  const symMeans = [];
  for (const [, v] of bySym) if (v.length >= 3) symMeans.push(mean(v));
  const nSym = symMeans.length;
  const m = mean(symMeans), s = sd(symMeans);
  const t = (nSym >= 2 && s > 0) ? m / s * Math.sqrt(nSym) : 0;
  const symPos = nSym ? symMeans.filter(x => x > 0).length / nSym : 0;
  const sorted = entries.slice().sort((a, b) => a.t - b.t);
  const half = Math.floor(n / 2);
  const h1 = mean(sorted.slice(0, half).map(e => e.excess)) * 100;
  const h2 = mean(sorted.slice(half).map(e => e.excess)) * 100;
  const brutto = mean(entries.map(e => e.excess)) * 100;
  return { n, nSym, bruttoPp: r3(brutto), nettoPp: r3(brutto - 0.10), t: r2(t), symPos: r2(symPos), h1Pp: r3(n ? h1 : 0), h2Pp: r3(n ? h2 : 0) };
}

const results = [];
for (const T of TFS) {
  const t0 = Date.now();
  let data;
  try { data = JSON.parse(fs.readFileSync(DIR + T.file, 'utf8')); }
  catch (e) { console.error('Datei fehlt/kaputt: ' + T.file + ' -> uebersprungen'); continue; }
  const syms = Object.keys(data);
  // Vorberechnung je Symbol
  const pre = {};
  for (const sym of syms) {
    const bars = data[sym];
    if (!bars || bars.length < 50) continue;
    const segs = daySegments(bars);
    const dayEnd = new Array(bars.length);
    for (const g of segs) for (let k = g.s; k <= g.e; k++) dayEnd[k] = g.e;
    const cH = {};
    for (const [H] of T.hor) cH[H] = ctrlH(bars, segs, H);
    pre[sym] = { bars, dayEnd, cH, cTS: ctrlTS(bars, segs) };
  }
  for (const cfg of CONFIGS) {
    // Buckets: richtung x horizont
    const buckets = {};
    for (const dir of ['long', 'short'])
      for (const h of [...T.hor.map(x => x[1]), 'TS'])
        buckets[dir + '|' + h] = [];
    let nSigs = 0;
    for (const sym of Object.keys(pre)) {
      const P = pre[sym];
      const sigs = detect(P.bars, cfg.S, cfg.F, T.cooldown, T.minRest, P.dayEnd);
      for (const sig of sigs) {
        const c0 = P.bars[sig.i][1];
        if (c0 == null || c0 === 0) continue;
        const de = P.dayEnd[sig.i];
        const dirName = sig.dir > 0 ? 'long' : 'short';
        const ts = P.bars[sig.i][0];
        nSigs++;
        // TS: jedes akzeptierte Signal, bewertet am Tagesschluss
        const ce = P.bars[de][1];
        if (ce != null) {
          const ret = (ce - c0) / c0;
          buckets[dirName + '|TS'].push({ sym, t: ts, excess: sig.dir * (ret - P.cTS) });
        }
        // H-Horizonte: nur wenn i+H den Tag NICHT verlaesst (sonst zaehlt es als TS, s.o.)
        for (const [H, hName] of T.hor) {
          const j = sig.i + H;
          if (j > de) continue;
          const cj = P.bars[j][1];
          if (cj == null) continue;
          const ret = (cj - c0) / c0;
          buckets[dirName + '|' + hName].push({ sym, t: ts, excess: sig.dir * (ret - P.cH[H]) });
        }
      }
    }
    for (const dir of ['long', 'short']) {
      for (const h of [...T.hor.map(x => x[1]), 'TS']) {
        const a = auswerten(buckets[dir + '|' + h]);
        results.push(Object.assign({ name: cfg.name, zeitrahmen: T.tf, richtung: dir, horizont: h }, a));
      }
    }
    console.error(T.tf + ' ' + cfg.name + ': ' + nSigs + ' Signale');
  }
  console.error(T.tf + ' fertig in ' + ((Date.now() - t0) / 1000).toFixed(1) + ' s');
  data = null;
}

// Tabelle fuer die Konsole
console.error('\nname      tf   rich  hor  n    nSym brutto  netto   t     sym+  h1     h2');
for (const r of results) {
  console.error(
    r.name.padEnd(9) + r.zeitrahmen.padEnd(4) + r.richtung.padEnd(6) + r.horizont.padEnd(4) +
    String(r.n).padEnd(5) + String(r.nSym).padEnd(5) +
    String(r.bruttoPp).padEnd(8) + String(r.nettoPp).padEnd(8) +
    String(r.t).padEnd(6) + String(r.symPos).padEnd(6) +
    String(r.h1Pp).padEnd(7) + String(r.h2Pp));
}
console.log(JSON.stringify(results));
