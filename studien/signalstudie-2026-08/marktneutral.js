/* Die Bestaetigung MARKTNEUTRAL nachrechnen.
 * Befund der Gegenpruefung: Entdeckung -0,27 % S&P, Bestaetigung +3,59 %. 32 der 51
 * Kandidaten sind Short - in einer Rally muessen die scheitern, ohne dass das Signal
 * schlecht sein muss. Die Kontrolle je Symbol x Versatz entfernt die MITTLERE Drift,
 * aber nicht den TAGESSCHOCK.
 * Verfahren wie bei Studie #33: Tagesmittel auf die Index-Tagesrendite regressieren,
 * der Achsenabschnitt (alpha) ist der marktneutrale Ueberschuss.
 * Das ist eine ROBUSTHEITSPROBE, kein neues Urteil - die Kandidatenliste bleibt fix.
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

// Index-Tagesrenditen
const gs = JSON.parse(fs.readFileSync(STORE + 'hist__GSPC.json', 'utf8'));
const arr = (Array.isArray(gs) ? gs : (gs.series || [])).slice().sort((a, b) => a[0] - b[0]);
const schluss = {}; arr.forEach(b => { schluss[tagVon(b[0])] = b[1]; });
const tageS = Object.keys(schluss).sort();
const idxRet = {}; for (let i = 1; i < tageS.length; i++) idxRet[tageS[i]] = schluss[tageS[i]] / schluss[tageS[i - 1]] - 1;

function neutral(entries) {   // [{tag, x}]
  const m = new Map();
  entries.forEach(e => { if (!m.has(e.tag)) m.set(e.tag, []); m.get(e.tag).push(e.x); });
  const X = [], Y = [];
  for (const [tag, v] of m) { if (idxRet[tag] == null) continue; X.push(idxRet[tag]); Y.push(mean(v)); }
  if (X.length < 5) return null;
  const mx = mean(X), my = mean(Y);
  let sxy = 0, sxx = 0; X.forEach((x, i) => { sxy += (x - mx) * (Y[i] - my); sxx += (x - mx) * (x - mx); });
  const beta = sxx > 0 ? sxy / sxx : 0, alpha = my - beta * mx;
  const res = Y.map((y, i) => y - beta * X[i]);
  const a = mean(res), s = sd(res), n = res.length;
  return { alpha, beta, t: (n >= 2 && s > 0) ? a / s * Math.sqrt(n) : 0, se: s / Math.sqrt(n), n };
}

const HOR = { '1h': 1, '3h': 1, 'TS': 1, '1T': 1, '3T': 1, '5T': 1 };

console.log('BESTAETIGUNG marktneutral (Tages-Beta herausgerechnet)\n');
for (const iv of ['1m', '5m', '15m', '60m']) {
  const B = JSON.parse(fs.readFileSync(path.join(OUT, 'bestaetigung-' + iv + '.json'), 'utf8'));
  let L; try { L = JSON.parse(fs.readFileSync(path.join(OUT, 'lauf-' + iv + '-bestaetigung.json'), 'utf8')); } catch (e) { continue; }
  console.log('=== ' + iv + ' (Schwelle |t| >= ' + B.schwelle + ') ===');
  console.log('  Kandidat'.padEnd(48) + '  roh brutto  t(roh)   alpha   beta  t(neutral)');
  for (const z of B.zeilen) {
    if (!z.bestaetigung) continue;
    const teile = z.kandidat.split('|');
    const det = teile[0], dir = teile[1] === 'long' ? 1 : -1, hor = teile[2];
    if (teile.some(p => p.indexOf('+') === 0)) continue;      // Paare hier nicht
    const bed = teile[3] ? teile[3].split('=') : null;
    const ev = (L.ereignisse[det] || []).filter(e => e.dir === dir && e.fwd[hor] != null &&
      (!bed || e.bed[bed[0]] === bed[1]));
    if (!ev.length) continue;
    const nz = neutral(ev.map(e => ({ tag: e.tag, x: e.fwd[hor] })));
    if (!nz) continue;
    const kipp = Math.abs(nz.t) >= B.schwelle && (nz.alpha * 100 - 0.10) > 0;
    console.log('  ' + z.kandidat.padEnd(46) + String(z.bestaetigung.bruttoPp).padStart(11) +
      String(z.bestaetigung.tTag).padStart(8) + String(r3(nz.alpha * 100)).padStart(8) +
      String(r3(nz.beta)).padStart(7) + String(r3(nz.t)).padStart(12) + (kipp ? '   <-- BESTAETIGT' : ''));
  }
  console.log('');
}
