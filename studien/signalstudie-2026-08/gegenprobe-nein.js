/* GEGENPRUEFUNG des Null-Ergebnisses. Drei Angriffe auf das eigene Nein:
 *   A) Ist die Kontrolle (Symbol x Tageszeit-Versatz) ZU SCHARF und rechnet echte Kanten weg?
 *   B) Ist der Split ein REGIMEWECHSEL - drehen dann zwangslaeufig alle Richtungssignale?
 *   C) Was haette die Studie ueberhaupt sehen KOENNEN (Power)?
 * Ein falsches Nein kostet eine echte Kante, und niemand merkt es.
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
const lade = (iv, ph) => JSON.parse(fs.readFileSync(path.join(OUT, 'lauf-' + iv + '-' + ph + '.json'), 'utf8'));

function tTag(entries) {   // entries: [{tag, x}]
  const m = new Map();
  entries.forEach(e => { if (!m.has(e.tag)) m.set(e.tag, []); m.get(e.tag).push(e.x); });
  const dm = []; for (const [, v] of m) dm.push(mean(v));
  const M = mean(dm), S = sd(dm), n = dm.length;
  return { m: M, t: (n >= 2 && S > 0) ? M / S * Math.sqrt(n) : 0, se: n ? S / Math.sqrt(n) : 0, n };
}

/* ---------- A) Kontrolle zu scharf? ---------- */
console.log('=== A) Wie viel rechnet die Kontrolle weg? ===');
console.log('Drei Rechnungen auf DENSELBEN Signalen: (a) Versatz-Kontrolle wie im Geschirr,');
console.log('(b) nur Symbol-Drift, (c) roh ohne Kontrolle.\n');

function dreiKontrollen(iv, det, dir, hor) {
  const out = [];
  for (const ph of ['entdeckung', 'bestaetigung']) {
    let L; try { L = lade(iv, ph); } catch (e) { continue; }
    const ev = (L.ereignisse[det] || []).filter(e => e.dir === dir && e.fwd[hor] != null);
    if (!ev.length) continue;
    // (a) steht schon in fwd (Ueberschuss gegen Versatz-Kontrolle)
    const a = tTag(ev.map(e => ({ tag: e.tag, x: e.fwd[hor] })));
    // (b) und (c) brauchen die Rohrendite - rekonstruieren aus dem Archiv
    const bars = {};
    const roh = [];
    for (const e of ev) {
      if (!bars[e.sym]) {
        try { bars[e.sym] = (JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + e.sym + '.json', 'utf8')).series || []).filter(b => b[0] % 60000 === 0); }
        catch (er) { bars[e.sym] = []; }
      }
      const B = bars[e.sym]; if (!B.length) continue;
      let i = -1;
      for (let k = 0; k < B.length; k++) if (B[k][0] === e.t) { i = k; break; }
      if (i < 0) continue;
      const H = { '1h': iv === '1m' ? 60 : iv === '5m' ? 12 : iv === '15m' ? 4 : 7,
                  '3h': iv === '1m' ? 180 : iv === '5m' ? 36 : iv === '15m' ? 12 : 21,
                  '1T': 7, '3T': 21, '5T': 35 }[hor];
      if (H == null || i + H >= B.length) continue;
      const p0 = B[i][1], p1 = B[i + H][1];
      if (!(p0 > 0) || !(p1 > 0)) continue;
      roh.push({ tag: e.tag, sym: e.sym, x: (p1 - p0) / p0 * dir });
    }
    if (!roh.length) continue;
    // Symbol-Drift: mittlere H-Vorwaertsrendite des Symbols ueber alle Kerzen
    const drift = {};
    for (const sym of Object.keys(bars)) {
      const B = bars[sym]; if (!B.length) continue;
      const H = { '1h': iv === '1m' ? 60 : iv === '5m' ? 12 : iv === '15m' ? 4 : 7,
                  '3h': iv === '1m' ? 180 : iv === '5m' ? 36 : iv === '15m' ? 12 : 21,
                  '1T': 7, '3T': 21, '5T': 35 }[hor];
      const r = [];
      for (let k = 0; k + H < B.length; k += Math.max(1, Math.floor(H / 2))) {
        const p0 = B[k][1], p1 = B[k + H][1];
        if (p0 > 0 && p1 > 0) r.push((p1 - p0) / p0);
      }
      drift[sym] = mean(r);
    }
    const b = tTag(roh.map(e => ({ tag: e.tag, x: e.x - drift[e.sym] * dir })));
    const c = tTag(roh.map(e => ({ tag: e.tag, x: e.x })));
    out.push({ ph, n: ev.length, a, b, c });
  }
  return out;
}

for (const [iv, det, dir, hor, label] of [
  ['60m', 'rsi2seit', 1, '1T', 'rsi2seit long 1T (belegte Kante, +0,147 Pp/8h)'],
  ['60m', 'kapitulation', 1, '1T', 'kapitulation long 1T (belegte Kante)'],
  ['1m', 'wendepunkt-trendwechsel', -1, '3h', 'Winkel-Detektor short 3h (Felix #33)'],
]) {
  console.log(label);
  console.log('  Phase          n    (a) Versatz    (b) Symbol-Drift   (c) roh');
  for (const r of dreiKontrollen(iv, det, dir, hor)) {
    console.log('  ' + r.ph.padEnd(14) + String(r.n).padStart(5) + '   ' +
      (r3(r.a.m * 100) + ' (t ' + r3(r.a.t) + ')').padStart(16) +
      (r3(r.b.m * 100) + ' (t ' + r3(r.b.t) + ')').padStart(18) +
      (r3(r.c.m * 100) + ' (t ' + r3(r.c.t) + ')').padStart(16));
  }
  console.log('');
}

/* ---------- B) Split = Regimewechsel? ---------- */
console.log('=== B) Drehen NUR die Shorts (Regime) oder alles (Rauschen)? ===');
let gs; try { gs = JSON.parse(fs.readFileSync(STORE + 'hist__GSPC.json', 'utf8')); } catch (e) { gs = null; }
if (gs) {
  const arr = (Array.isArray(gs) ? gs : (gs.series || [])).slice().sort((a, b) => a[0] - b[0]);
  const kurs = {}; arr.forEach(b => { kurs[tagVon(b[0])] = b[1]; });
  const zeit = (von, bis) => {
    const k = Object.keys(kurs).filter(d => d >= von && d < bis).sort();
    return k.length >= 2 ? (kurs[k[k.length - 1]] / kurs[k[0]] - 1) * 100 : null;
  };
  console.log('  S&P 500 Entdeckung (26.05.-22.07.): ' + r3(zeit('2026-05-26', '2026-07-23')) + ' %');
  console.log('  S&P 500 Bestaetigung (23.07.-21.08.): ' + r3(zeit('2026-07-23', '2026-08-22')) + ' %');
}
for (const iv of ['1m', '5m', '15m']) {
  const B = JSON.parse(fs.readFileSync(path.join(OUT, 'bestaetigung-' + iv + '.json'), 'utf8'));
  const z = B.zeilen.filter(x => !x.referenz && x.bestaetigung);
  const l = z.filter(x => /\|long\|/.test(x.kandidat)), s = z.filter(x => /\|short\|/.test(x.kandidat));
  const dreh = a => a.filter(x => x.entdeckung.bruttoPp > 0 && x.bestaetigung.bruttoPp < 0).length;
  console.log('  ' + iv.padEnd(4) + ' long: ' + dreh(l) + '/' + l.length + ' gedreht, mittl. brutto Bestaetigung ' +
    r3(mean(l.map(x => x.bestaetigung.bruttoPp))) + ' | short: ' + dreh(s) + '/' + s.length + ' gedreht, ' +
    r3(mean(s.map(x => x.bestaetigung.bruttoPp))));
}

/* ---------- C) Was haette die Studie sehen koennen? ---------- */
console.log('\n=== C) Power: Welche Kantengroesse war ueberhaupt nachweisbar? ===');
console.log('  Tier   Tage   SE Median   nachweisbar bei t=2   80%-Power braucht');
for (const iv of ['1m', '5m', '15m', '60m']) {
  const B = JSON.parse(fs.readFileSync(path.join(OUT, 'bestaetigung-' + iv + '.json'), 'utf8'));
  const z = B.zeilen.filter(x => !x.referenz && x.bestaetigung && x.bestaetigung.mdeTagPp != null);
  const ses = z.map(x => x.bestaetigung.mdeTagPp / 2).sort((a, b) => a - b);
  const seMed = ses[Math.floor(ses.length / 2)];
  const nTage = B.tage.bestaetigung;
  // fuer 80 % Power bei einseitig 5 %: Effekt >= (1,645 + 0,842) * SE
  console.log('  ' + iv.padEnd(6) + String(nTage).padStart(5) + String(r3(seMed)).padStart(12) +
    String(r3(2 * seMed)).padStart(22) + String(r3(2.487 * seMed)).padStart(20) + ' Pp');
}
console.log('\n  Zum Vergleich: belegte Kanten liegen bei 0,10-0,15 Pp, Kostenhuerde 0,10 Pp.');
