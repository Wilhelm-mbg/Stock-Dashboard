/* Traegt ein GROESSERES Universum mehr Ertrag - oder nur mehr Trades?
 *
 * Drei Fragen, getrennt:
 *   A) Haelt der Ueberschuss je Trade, wenn man in duennere Werte hineingeht?
 *      (Wenn nicht, kauft man Signale, die den Schnitt senken.)
 *   B) Wie viel Sicherheit bringen mehr Werte wirklich? Mehr Symbole am SELBEN Tag sind
 *      nicht unabhaengig - der tagesgeclusterte Fehler sinkt langsamer als 1/sqrt(n).
 *   C) Wie viele Signale je Tag kommen dazu, und passt das zum Kapital?
 *
 * Gerechnet auf rsi2seit long 60m (die belegte Kante), beide Phasen zusammen -
 * hier wird nichts ausgewaehlt, nur nach Liquiditaet aufgeteilt.
 */
'use strict';
const fs = require('fs');
const path = require('path');
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

// Signale beider Phasen
const sig = [];
for (const ph of ['entdeckung', 'bestaetigung']) {
  let L; try { L = JSON.parse(fs.readFileSync(path.join(OUT, 'lauf-60m-' + ph + '.json'), 'utf8')); } catch (e) { continue; }
  for (const e of (L.ereignisse.rsi2seit || [])) if (e.dir === 1 && e.fwd['1T'] != null) sig.push(e);
}

// Liquiditaet je Symbol: mittlerer Tagesumsatz aus dem 60m-Archiv (nur Yahoo-Kerzen)
const umsatz = {};
for (const sym of [...new Set(sig.map(s => s.sym))]) {
  let a; try { a = (JSON.parse(fs.readFileSync(STORE + 'bars_60m_' + sym + '.json', 'utf8')).series || []).filter(b => b[0] % 60000 === 0); } catch (e) { continue; }
  const t = {}; a.forEach(b => { const k = tagVon(b[0]); t[k] = (t[k] || 0) + (b[2] || 0) * b[1]; });
  const v = Object.values(t).filter(x => x > 0).sort((x, y) => x - y);
  if (v.length) umsatz[sym] = v[Math.floor(v.length / 2)];
}
const syms = Object.keys(umsatz).sort((a, b) => umsatz[b] - umsatz[a]);   // liquideste zuerst
console.log('rsi2seit long 60m: ' + sig.length + ' Signale auf ' + syms.length + ' Werten\n');

/* ---- A) Ueberschuss nach Liquiditaets-Rang ---- */
console.log('A) Traegt die Kante auch in duenneren Werten?');
console.log('   Gruppe (nach Tagesumsatz)      Werte  Signale  Tage   brutto   t(Tag)  Umsatz Median');
const N = syms.length;
[[0, 0.25, 'oberstes Viertel'], [0.25, 0.5, 'zweites Viertel'], [0.5, 0.75, 'drittes Viertel'], [0.75, 1, 'unterstes Viertel']]
  .forEach(([a, b, label]) => {
    const grp = new Set(syms.slice(Math.floor(N * a), Math.floor(N * b)));
    const ev = sig.filter(s => grp.has(s.sym));
    if (!ev.length) return;
    const st = tTag(ev.map(e => ({ tag: e.tag, x: e.fwd['1T'] * 100 })));
    const um = [...grp].map(s => umsatz[s]).sort((x, y) => x - y);
    console.log('   ' + label.padEnd(30) + String(grp.size).padStart(5) + String(ev.length).padStart(9) +
      String(st.n).padStart(6) + r3(st.m).toString().padStart(9) + r3(st.t).toString().padStart(9) +
      '   ' + (um[Math.floor(um.length / 2)] / 1e6).toFixed(0) + ' Mio $');
  });

/* ---- B) Was bringt jedes zusaetzliche Symbol statistisch? ---- */
console.log('\nB) Wie viel Sicherheit bringt ein groesseres Universum?');
console.log('   Die liquidesten K Werte, kumuliert:');
console.log('   K    Signale  Tage   Sig/Tag   brutto   SE      t(Tag)');
for (const K of [10, 20, 30, 50, 75, N]) {
  const grp = new Set(syms.slice(0, K));
  const ev = sig.filter(s => grp.has(s.sym));
  if (!ev.length) continue;
  const st = tTag(ev.map(e => ({ tag: e.tag, x: e.fwd['1T'] * 100 })));
  console.log('   ' + String(K).padEnd(5) + String(ev.length).padStart(7) + String(st.n).padStart(6) +
    (ev.length / st.n).toFixed(1).padStart(9) + r3(st.m).toString().padStart(9) +
    r3(st.se).toString().padStart(8) + r3(st.t).toString().padStart(8));
}

/* ---- C) Was heisst das fuers Kapital? ---- */
console.log('\nC) Signale je Tag und Kapitalbedarf (Budget 3 % je Trade, 8 h Haltedauer)');
const alleTage = [...new Set(sig.map(s => s.tag))].length;
for (const K of [15, 30, 50, N]) {
  const grp = new Set(syms.slice(0, K));
  const ev = sig.filter(s => grp.has(s.sym));
  const proTag = ev.length / alleTage;
  // gleichzeitig offen: 8 h Haltedauer = knapp ein Handelstag
  console.log('   ' + String(K).padStart(3) + ' Werte: ' + proTag.toFixed(1).padStart(5) + ' Signale/Tag' +
    ' -> ' + (proTag * 3).toFixed(0).padStart(3) + ' % Kapital gebunden' +
    (proTag * 3 > 100 ? '  ACHTUNG: mehr als das Depot' : ''));
}

console.log('\nD) Zur Einordnung: der belegte Pool');
console.log('   Die App handelt derzeit den Pool "Standard (99 gemessene Werte)".');
console.log('   Die Messung oben umfasst ' + N + ' Werte - also praktisch denselben Umfang.');
