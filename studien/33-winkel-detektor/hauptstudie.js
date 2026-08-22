/* STUDIE #33 - Felix' Winkel-Detektor, Neubewertung auf 87 Tagen 1-Minuten-Historie.
 *
 * VORREGISTRIERT (Kommentar in Issue #33, 21.08.2026):
 *   Befund damals: 1m, Short-Seite, brutto +0,25 Pp je Trade, kein Zukunftsblick,
 *   robust gegen eine Kerze Verzug, Zufallsprobe bestanden.
 *   Zwei ausdruecklich genannte Vorbehalte:
 *     (1) Ein Teil des Effekts war TAGESZEIT-DRIFT in der Kontrolle.
 *     (2) Nur 7 Tage Historie - zu wenig fuer ein Urteil.
 *   Zugesagt: Neubewertung auf 60+ Tagen mit sauberer Tageszeit-Kontrolle.
 *
 * WAS SICH GEGENUEBER DAMALS AENDERT - und NUR das:
 *   Die alte Kontrolle (ctrlH) mittelte nicht ueberlappende H-Fenster ab TAGESANFANG,
 *   die Signale streuten aber ueber den ganzen Tag. Lag der Wochengewinn vor allem
 *   in der Eroeffnung, ueberschaetzte die Kontrolle die typische Vorwaertsrendite -
 *   und die Short-Seite bekam einen Sockel geschenkt.
 *   NEU: Die Kontrolle ist auf SYMBOL x TAGESZEIT-VERSATZ abgestimmt und laesst den
 *   eigenen Tag aus (leave-one-day-out). Damit sind Symbol-Drift UND Tageszeit-Muster
 *   exakt herausgerechnet.
 *
 * Detektor, Raster, Horizonte, Cooldown: UNVERAENDERT aus wende-felix-winkel.js.
 */
'use strict';
const fs = require('fs');
const Q = require('../../quant.js');
const S_DIR = (process.env.APPDATA || require('os').homedir() + '/AppData/Roaming') + '/markt-dashboard/store/';

const HORIZONTE = [[60, '1h'], [180, '3h']];
const COOLDOWN = 60, MIN_REST = 30;
const CONFIGS = [
  { name: 'S0.5-F4', S: 0.5, F: 4 },
  { name: 'S1.0-F4', S: 1.0, F: 4 },
  { name: 'S0.5-F6', S: 0.5, F: 6 },
  { name: 'S1.0-F6', S: 1.0, F: 6 },
];
const KOSTEN_PP = 0.10;          // 0,10 % Umlauf, die Annahme des Projekts

const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : 0; };
const sd = a => { if (a.length < 2) return 0; const m = mean(a); let s = 0; for (const x of a) s += (x - m) * (x - m); return Math.sqrt(s / (a.length - 1)); };
const r3 = x => Math.round(x * 1000) / 1000;
const r2 = x => Math.round(x * 100) / 100;
const winkel = k => k.steigung * k.n / k.breite;

function istSitzung(ms) {
  const d = new Date(ms), tag = d.getUTCDay();
  if (tag === 0 || tag === 6) return false;
  // US-Sommerzeit exakt: 2. Sonntag im Maerz 07:00 UTC bis 1. Sonntag im November 06:00 UTC.
  // Die Monatsregel stimmte fuer Mai-August, haette aber im Winter die Nachboerse als Sitzung gezaehlt.
  const y = d.getUTCFullYear();
  const so = (m, n) => { const d1 = new Date(Date.UTC(y, m, 1)); const off = (7 - d1.getUTCDay()) % 7; return Date.UTC(y, m, 1 + off + 7 * (n - 1)); };
  const dstVon = so(2, 2) + 7 * 3600000, dstBis = so(10, 1) + 6 * 3600000;
  const sommer = ms >= dstVon && ms < dstBis;
  const m = d.getUTCHours() * 60 + d.getUTCMinutes() - ((sommer ? 13 : 14) * 60 + 30);
  return m >= 0 && m < 390;
}
function daySegments(bars) {
  const segs = []; let s = 0;
  for (let i = 1; i <= bars.length; i++) {
    if (i === bars.length || Math.floor(bars[i][0] / 86400000) !== Math.floor(bars[s][0] / 86400000)) { segs.push({ s, e: i - 1 }); s = i; }
  }
  return segs;
}

/* Detektor - Zeile fuer Zeile wie im Originallauf. */
function detect(bars, S, F, dayEnd) {
  const wp = Q.wendepunkte(bars, F);
  const all = wp.hoch.map(w => ({ i: w.i })).concat(wp.tief.map(w => ({ i: w.i }))).sort((a, b) => a.i - b.i);
  const sigs = []; let p = 0; const C = [];
  let sectionDone = true, winkelAlt = 0, lastSig = -1e9;
  for (let i = 0; i < bars.length; i++) {
    while (p < all.length && all[p].i + F <= i) {
      C.push(all[p]); p++; sectionDone = false; winkelAlt = 0;
      if (C.length >= 2) {
        const w = C[C.length - 1], wv = C[C.length - 2];
        const kAlt = Q.kanalUeber(bars, wv.i, w.i);
        if (kAlt && kAlt.breite > 0) winkelAlt = winkel(kAlt);
      }
      if (Math.abs(winkelAlt) < 0.5) sectionDone = true;
    }
    if (sectionDone) continue;
    const w = C[C.length - 1];
    if (i - w.i < 10) continue;
    if (i - lastSig < COOLDOWN) continue;
    const kNeu = Q.kanalUeber(bars, w.i, i);
    if (!kNeu || !(kNeu.breite > 0)) continue;
    const wn = winkel(kNeu);
    if (Math.abs(wn) < S) continue;
    if (Math.sign(wn) === Math.sign(winkelAlt)) continue;
    sectionDone = true;
    if (dayEnd[i] - i < MIN_REST) continue;
    lastSig = i;
    sigs.push({ i, dir: wn > 0 ? 1 : -1 });
  }
  return sigs;
}

/* ---- Daten laden: die 89 Werte mit tiefer 1m-Historie ---- */
const epics = JSON.parse(fs.readFileSync(S_DIR + 'cap_epics.json', 'utf8'));
const SYMS = [];
for (const sym of Object.keys(epics)) {
  const f = S_DIR + 'bars_1m_' + sym + '.json';
  if (!fs.existsSync(f)) continue;
  let a; try { a = (JSON.parse(fs.readFileSync(f, 'utf8')).series) || []; } catch (e) { continue; }
  a = a.filter(b => istSitzung(b[0]) && b[1] > 0);
  if (a.length < 5000) continue;
  const tage = (a[a.length - 1][0] - a[0][0]) / 86400000;
  if (tage < 60) continue;
  SYMS.push({ sym, bars: a });
}
console.log('Universum: ' + SYMS.length + ' Werte, ' +
  SYMS.reduce((s, x) => s + x.bars.length, 0).toLocaleString('de-DE') + ' Sitzungskerzen');

/* ---- Vorbereitung je Symbol: Tagesgrenzen + tageszeit-abgestimmte Kontrolle ---- */
for (const E of SYMS) {
  const segs = daySegments(E.bars);
  E.segs = segs;
  E.dayEnd = new Array(E.bars.length);
  E.dayStart = new Array(E.bars.length);
  E.dayKey = new Array(E.bars.length);
  for (const g of segs) {
    const key = new Date(E.bars[g.s][0]).toISOString().slice(0, 10);
    for (let k = g.s; k <= g.e; k++) { E.dayEnd[k] = g.e; E.dayStart[k] = g.s; E.dayKey[k] = key; }
  }
  /* Kontrolle je Horizont: Summe und Anzahl der Vorwaertsrenditen JE VERSATZ.
   * ctrl(tag, versatz) = (Summe - eigener Wert) / (Anzahl - 1)  [leave-one-day-out] */
  E.ctrl = {};
  for (const [H] of HORIZONTE) {
    const sum = new Map(), cnt = new Map();
    for (const g of segs) {
      for (let k = g.s; k + H <= g.e; k++) {
        const o = k - g.s, a = E.bars[k][1], b = E.bars[k + H][1];
        if (!(a > 0) || !(b > 0)) continue;
        const r = (b - a) / a;
        sum.set(o, (sum.get(o) || 0) + r); cnt.set(o, (cnt.get(o) || 0) + 1);
      }
    }
    E.ctrl[H] = { sum, cnt };
  }
}

/* ---- Auswertung ---- */
function auswerten(entries) {
  const n = entries.length;
  if (!n) return null;
  // je Symbol
  const bySym = new Map();
  for (const e of entries) { if (!bySym.has(e.sym)) bySym.set(e.sym, []); bySym.get(e.sym).push(e.ex); }
  const symMeans = []; for (const [, v] of bySym) if (v.length >= 3) symMeans.push(mean(v));
  const sM = mean(symMeans), sS = sd(symMeans), nS = symMeans.length;
  const tSym = (nS >= 2 && sS > 0) ? sM / sS * Math.sqrt(nS) : 0;
  const mdeSym = (nS >= 2 && sS > 0) ? 2 * sS / Math.sqrt(nS) * 100 : null;
  // je TAG (die bindende Einheit: Symbole am selben Tag sind nicht unabhaengig)
  const byDay = new Map();
  for (const e of entries) { if (!byDay.has(e.tag)) byDay.set(e.tag, []); byDay.get(e.tag).push(e.ex); }
  const dayMeans = []; for (const [, v] of byDay) dayMeans.push(mean(v));
  const dM = mean(dayMeans), dS = sd(dayMeans), nD = dayMeans.length;
  const tDay = (nD >= 2 && dS > 0) ? dM / dS * Math.sqrt(nD) : 0;
  const mdeDay = (nD >= 2 && dS > 0) ? 2 * dS / Math.sqrt(nD) * 100 : null;
  // Zeitliche Haelften
  const sortiert = entries.slice().sort((a, b) => a.t - b.t);
  const h = Math.floor(n / 2);
  const h1 = mean(sortiert.slice(0, h).map(e => e.ex)) * 100;
  const h2 = mean(sortiert.slice(h).map(e => e.ex)) * 100;
  const brutto = mean(entries.map(e => e.ex)) * 100;
  return {
    n, nSym: nS, nTage: nD,
    bruttoPp: r3(brutto), nettoPp: r3(brutto - KOSTEN_PP),
    tSym: r2(tSym), tDay: r2(tDay),
    mdeSymPp: mdeSym != null ? r3(mdeSym) : null,
    mdeDayPp: mdeDay != null ? r3(mdeDay) : null,
    symPos: nS ? r2(symMeans.filter(x => x > 0).length / nS) : 0,
    h1Pp: r3(h1), h2Pp: r3(h2),
  };
}

const ergebnisse = [];
for (const cfg of CONFIGS) {
  const buckets = {};
  for (const dir of ['long', 'short']) for (const [, lab] of HORIZONTE) buckets[dir + '|' + lab] = [];
  let nSig = 0;
  for (const E of SYMS) {
    const sigs = detect(E.bars, cfg.S, cfg.F, E.dayEnd);
    nSig += sigs.length;
    for (const s of sigs) {
      const i = s.i, c0 = E.bars[i][1], g0 = E.dayStart[i], gE = E.dayEnd[i];
      const o = i - g0;
      for (const [H, lab] of HORIZONTE) {
        if (i + H > gE) continue;                      // haelt nie ueber Nacht
        const c1 = E.bars[i + H][1];
        if (!(c0 > 0) || !(c1 > 0)) continue;
        const roh = (c1 - c0) / c0;
        const C = E.ctrl[H];
        const cn = C.cnt.get(o) || 0;
        if (cn < 5) continue;                          // zu duenne Kontrolle
        const ctrl = (C.sum.get(o) - roh) / (cn - 1);  // eigener Tag ausgelassen
        const ex = (roh - ctrl) * s.dir;               // Ueberschuss, in Signalrichtung
        buckets[(s.dir > 0 ? 'long' : 'short') + '|' + lab].push({
          sym: E.sym, tag: E.dayKey[i], t: E.bars[i][0], ex, o,
        });
      }
    }
  }
  for (const k of Object.keys(buckets)) {
    const r = auswerten(buckets[k]);
    if (r) ergebnisse.push(Object.assign({ cfg: cfg.name, bucket: k }, r));
  }
  console.log('  ' + cfg.name + ': ' + nSig + ' Signale');
}

console.log('\n=== ERGEBNISSE (Ueberschuss gegen symbol- UND tageszeit-abgestimmte Kontrolle) ===');
console.log('Konfig     Bucket        n     Sym  Tage   brutto   netto    t(Sym)  t(Tag)   MDE(Tag)  H1/H2');
ergebnisse.sort((a, b) => b.nettoPp - a.nettoPp).forEach(r => {
  console.log('  ' + r.cfg.padEnd(9) + r.bucket.padEnd(12) +
    String(r.n).padStart(6) + String(r.nSym).padStart(5) + String(r.nTage).padStart(6) +
    String(r.bruttoPp).padStart(9) + String(r.nettoPp).padStart(8) +
    String(r.tSym).padStart(9) + String(r.tDay).padStart(8) +
    String(r.mdeDayPp != null ? r.mdeDayPp : '-').padStart(11) + '   ' +
    r.h1Pp + ' / ' + r.h2Pp);
});

fs.writeFileSync(__dirname + '/ergebnis-16-buckets.json',
  JSON.stringify(ergebnisse, null, 1));
/* Multiplizitaet ausweisen: bei k Tests und familienweise 5 % liegt die Schwelle
 * je Test bei 0,05/k (zweiseitig). Die naive Schwelle 2 ist dann wertlos. */
function invNorm(p) {   // Acklam-Approximation, genuegt fuer eine Schwelle
  const a = [-39.6968302866538, 220.946098424521, -275.928510446969, 138.357751867269, -30.6647980661472, 2.50662827745924];
  const b = [-54.4760987982241, 161.585836858041, -155.698979859887, 66.8013118877197, -13.2806815528857];
  const c = [-0.00778489400243029, -0.322396458041136, -2.40075827716184, -2.54973253934373, 4.37466414146497, 2.93816398269878];
  const d = [0.00778469570904146, 0.32246712907004, 2.445134137143, 3.75440866190742];
  const pl = 0.02425;
  if (p < pl) { const q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p <= 1 - pl) { const q = p - 0.5, r = q * q; return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1); }
  const q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1);
}
const kTests = ergebnisse.length;
console.log('\nGerechnete Tests: ' + kTests + '  ->  Bonferroni-Schwelle fuer |t|: ' +
  r2(invNorm(1 - 0.025 / kTests)) + '   (die naive Schwelle 2 ist bei ' + kTests + ' Tests wertlos)');
