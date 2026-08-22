/* Zusatzpruefungen zu Studie #33, auf dem vorregistrierten Bucket
 * (1m, Short, 3h - das war der einzige Teilueberlebende von damals):
 *   A) Wie viel des alten Befunds (+0,25 Pp) war die TAGESZEIT-KONTROLLE?
 *      Beide Kontrollen auf denselben Signalen rechnen.
 *   B) Vertrauensbereich tagesgeclustert - laesst sich eine handelbare Kante ausschliessen?
 *   C) Permutationstest: Signalzeitpunkte innerhalb desselben Versatzes verwuerfeln.
 *   D) Robustheit: Einstieg eine Kerze spaeter.
 */
'use strict';
const fs = require('fs');
const Q = require('../../quant.js');
const S_DIR = (process.env.APPDATA || require('os').homedir() + '/AppData/Roaming') + '/markt-dashboard/store/';
const H = 180, COOLDOWN = 60, MIN_REST = 30;
const CFG = { S: 0.5, F: 6 };            // bester Short-Bucket der Neubewertung
const KOSTEN = 0.10;

const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : 0; };
const sd = a => { if (a.length < 2) return 0; const m = mean(a); let s = 0; for (const x of a) s += (x - m) * (x - m); return Math.sqrt(s / (a.length - 1)); };
const r3 = x => Math.round(x * 1000) / 1000;
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
  for (let i = 1; i <= bars.length; i++) if (i === bars.length || Math.floor(bars[i][0] / 86400000) !== Math.floor(bars[s][0] / 86400000)) { segs.push({ s, e: i - 1 }); s = i; }
  return segs;
}
function detect(bars, S, F, dayEnd) {
  const wp = Q.wendepunkte(bars, F);
  const all = wp.hoch.map(w => ({ i: w.i })).concat(wp.tief.map(w => ({ i: w.i }))).sort((a, b) => a.i - b.i);
  const sigs = []; let p = 0; const C = []; let done = true, wAlt = 0, last = -1e9;
  for (let i = 0; i < bars.length; i++) {
    while (p < all.length && all[p].i + F <= i) {
      C.push(all[p]); p++; done = false; wAlt = 0;
      if (C.length >= 2) { const k = Q.kanalUeber(bars, C[C.length - 2].i, C[C.length - 1].i); if (k && k.breite > 0) wAlt = winkel(k); }
      if (Math.abs(wAlt) < 0.5) done = true;
    }
    if (done) continue;
    const w = C[C.length - 1];
    if (i - w.i < 10 || i - last < COOLDOWN) continue;
    const kNeu = Q.kanalUeber(bars, w.i, i);
    if (!kNeu || !(kNeu.breite > 0)) continue;
    const wn = winkel(kNeu);
    if (Math.abs(wn) < S || Math.sign(wn) === Math.sign(wAlt)) continue;
    done = true;
    if (dayEnd[i] - i < MIN_REST) continue;
    last = i; sigs.push({ i, dir: wn > 0 ? 1 : -1 });
  }
  return sigs;
}

// Daten
const epics = JSON.parse(fs.readFileSync(S_DIR + 'cap_epics.json', 'utf8'));
const E = [];
for (const sym of Object.keys(epics)) {
  const f = S_DIR + 'bars_1m_' + sym + '.json'; if (!fs.existsSync(f)) continue;
  let a; try { a = (JSON.parse(fs.readFileSync(f, 'utf8')).series) || []; } catch (e) { continue; }
  a = a.filter(b => istSitzung(b[0]) && b[1] > 0);
  if (a.length < 5000 || (a[a.length - 1][0] - a[0][0]) / 86400000 < 60) continue;
  const segs = daySegments(a);
  const dayEnd = new Array(a.length), dayStart = new Array(a.length), dayKey = new Array(a.length);
  for (const g of segs) { const k = new Date(a[g.s][0]).toISOString().slice(0, 10); for (let x = g.s; x <= g.e; x++) { dayEnd[x] = g.e; dayStart[x] = g.s; dayKey[x] = k; } }
  // ALTE Kontrolle: nicht ueberlappende H-Fenster ab Tagesanfang
  const alt = [];
  for (const g of segs) for (let k = g.s; k + H <= g.e; k += H) { const p0 = a[k][1], p1 = a[k + H][1]; if (p0 > 0 && p1 > 0) alt.push((p1 - p0) / p0); }
  // NEUE Kontrolle: je Versatz, leave-one-day-out
  const sum = new Map(), cnt = new Map();
  for (const g of segs) for (let k = g.s; k + H <= g.e; k++) {
    const o = k - g.s, p0 = a[k][1], p1 = a[k + H][1];
    if (!(p0 > 0) || !(p1 > 0)) continue;
    const r = (p1 - p0) / p0; sum.set(o, (sum.get(o) || 0) + r); cnt.set(o, (cnt.get(o) || 0) + 1);
  }
  E.push({ sym, bars: a, dayEnd, dayStart, dayKey, ctrlAlt: mean(alt), sum, cnt, segs });
}
console.log('Werte: ' + E.length + '\n');

// Signale einsammeln (Short, 3h)
const eintraege = [];
for (const X of E) {
  for (const s of detect(X.bars, CFG.S, CFG.F, X.dayEnd)) {
    if (s.dir > 0) continue;                        // nur Short
    const i = s.i, gE = X.dayEnd[i];
    if (i + H > gE) continue;
    const p0 = X.bars[i][1], p1 = X.bars[i + H][1];
    if (!(p0 > 0) || !(p1 > 0)) continue;
    const roh = (p1 - p0) / p0, o = i - X.dayStart[i];
    const cn = X.cnt.get(o) || 0; if (cn < 5) continue;
    const cNeu = (X.sum.get(o) - roh) / (cn - 1);
    // eine Kerze spaeter einsteigen
    let rohV = null;
    if (i + 1 + H <= gE && X.bars[i + 1][1] > 0 && X.bars[i + 1 + H][1] > 0) rohV = (X.bars[i + 1 + H][1] - X.bars[i + 1][1]) / X.bars[i + 1][1];
    eintraege.push({ sym: X.sym, tag: X.dayKey[i], o,
      exAlt: -(roh - X.ctrlAlt), exNeu: -(roh - cNeu), exVerzug: rohV != null ? -(rohV - cNeu) : null });
  }
}
console.log('Signale (Short, 3h): ' + eintraege.length + '\n');

function tTag(vals) {           // vals: [{tag, x}]
  const m = new Map();
  vals.forEach(v => { if (!m.has(v.tag)) m.set(v.tag, []); m.get(v.tag).push(v.x); });
  const dm = []; for (const [, a] of m) dm.push(mean(a));
  const M = mean(dm), S = sd(dm), n = dm.length;
  return { m: M, t: (n >= 2 && S > 0) ? M / S * Math.sqrt(n) : 0, se: S / Math.sqrt(n), n };
}

console.log('=== OOS) Nur die 55 Tage, die NICHT in der Originalstudie waren (vor 13.08.) ===');
{
  const oos = eintraege.filter(e => e.tag < '2026-08-13');
  const ins = eintraege.filter(e => e.tag >= '2026-08-13');
  const O = tTag(oos.map(e => ({ tag: e.tag, x: e.exNeu })));
  const I = tTag(ins.map(e => ({ tag: e.tag, x: e.exNeu })));
  const ew = a => mean(a.map(e => e.exNeu)) * 100;
  console.log('  In-Sample (13.-21.08., '+I.n+' Tage, '+ins.length+' Sig): tagesgew. '+r3(I.m*100)+' Pp, signalgew. '+r3(ew(ins))+' Pp, t(Tag) '+r3(I.t));
  console.log('  Out-of-Sample (vor 13.08., '+O.n+' Tage, '+oos.length+' Sig): tagesgew. '+r3(O.m*100)+' Pp, signalgew. '+r3(ew(oos))+' Pp, t(Tag) '+r3(O.t));
  console.log('  OOS netto (signalgew.): '+r3(ew(oos)-KOSTEN)+' Pp   95%-Bereich brutto (Tage): ['+r3((O.m-1.96*O.se)*100)+' ; '+r3((O.m+1.96*O.se)*100)+']');
}

console.log('=== HAELFTEN tagesgeclustert (Schnitt nach TAGEN, nicht nach Signalen) ===');
{
  const tage=[...new Set(eintraege.map(e=>e.tag))].sort();
  const mitte=tage[Math.floor(tage.length/2)];
  const h1=tTag(eintraege.filter(e=>e.tag<mitte).map(e=>({tag:e.tag,x:e.exNeu})));
  const h2=tTag(eintraege.filter(e=>e.tag>=mitte).map(e=>({tag:e.tag,x:e.exNeu})));
  const diff=(h1.m-h2.m)*100, seD=Math.sqrt(h1.se*h1.se+h2.se*h2.se)*100;
  console.log('  H1 ('+h1.n+' Tage): '+r3(h1.m*100)+' Pp t '+r3(h1.t)+' | H2 ('+h2.n+' Tage): '+r3(h2.m*100)+' Pp t '+r3(h2.t));
  console.log('  Differenz '+r3(diff)+' Pp, SE '+r3(seD)+', t(Diff) '+r3(diff/seD)+'  -> '+(Math.abs(diff/seD)<1?'Rauschen':'Unterschied'));
}

console.log('=== MARKTNEUTRAL: Tagesmittel um das Tages-Beta bereinigt ===');
{
  /* Ein Short-Signal verdient an einem Markt-Abwaertstag, ohne dass der Detektor etwas
   * koennen muss. Die Kontrolle je Symbol x Versatz entfernt die MITTLERE Drift, aber
   * nicht den TAGESSCHOCK. Regression des Tagesmittels auf die Tagesrendite des Index;
   * der Achsenabschnitt ist der marktneutrale Ueberschuss. */
  const gs=JSON.parse(fs.readFileSync(S_DIR+'hist__GSPC.json','utf8'));
  const idx=Array.isArray(gs)?gs:(gs.series||gs.data||[]);
  const schluss={}; idx.forEach(b=>{schluss[new Date(b[0]).toISOString().slice(0,10)]=b[1];});
  const tageS=Object.keys(schluss).sort();
  const retTag={}; for(let i=1;i<tageS.length;i++) retTag[tageS[i]]=schluss[tageS[i]]/schluss[tageS[i-1]]-1;
  function neutral(eintr){
    const m=new Map(); eintr.forEach(e=>{if(!m.has(e.tag))m.set(e.tag,[]);m.get(e.tag).push(e.exNeu);});
    const X=[],Y=[]; for(const [tag,a] of m){ if(retTag[tag]==null)continue; X.push(retTag[tag]); Y.push(mean(a)); }
    const mx=mean(X),my=mean(Y); let sxy=0,sxx=0; X.forEach((x,i)=>{sxy+=(x-mx)*(Y[i]-my);sxx+=(x-mx)*(x-mx);});
    const beta=sxx>0?sxy/sxx:0, alpha=my-beta*mx;
    const res=Y.map((y,i)=>y-beta*X[i]); const a=mean(res), s=sd(res), n=res.length;
    return {alpha:alpha,beta:beta,t:(n>=2&&s>0)?a/s*Math.sqrt(n):0,n:n,se:s/Math.sqrt(n)};
  }
  const all=neutral(eintraege), oos=neutral(eintraege.filter(e=>e.tag<'2026-08-13'));
  console.log('  Alle 62 Tage : Beta '+r3(all.beta)+'  alpha '+r3(all.alpha*100)+' Pp  t(Tag, neutral) '+r3(all.t));
  console.log('  OOS 55 Tage  : Beta '+r3(oos.beta)+'  alpha '+r3(oos.alpha*100)+' Pp  t(Tag, neutral) '+r3(oos.t)+'   95%: ['+r3((oos.alpha-1.96*oos.se)*100)+' ; '+r3((oos.alpha+1.96*oos.se)*100)+']');
  // Haelften marktneutral
  const tg=[...new Set(eintraege.map(e=>e.tag))].sort(), mitte=tg[Math.floor(tg.length/2)];
  const h1=neutral(eintraege.filter(e=>e.tag<mitte)), h2=neutral(eintraege.filter(e=>e.tag>=mitte));
  console.log('  Haelften neutral: H1 '+r3(h1.alpha*100)+' Pp | H2 '+r3(h2.alpha*100)+' Pp   (roh waren es 0,115 / 0,087)');
}

console.log('=== A) Wie viel war die Tageszeit-Kontrolle? ===');
const A_alt = tTag(eintraege.map(e => ({ tag: e.tag, x: e.exAlt })));
const A_neu = tTag(eintraege.map(e => ({ tag: e.tag, x: e.exNeu })));
console.log('  ALTE Kontrolle (Fenster ab Tagesanfang): brutto ' + r3(A_alt.m * 100) + ' Pp   t(Tag) ' + r3(A_alt.t));
console.log('  NEUE Kontrolle (Versatz-abgestimmt)    : brutto ' + r3(A_neu.m * 100) + ' Pp   t(Tag) ' + r3(A_neu.t));
console.log('  -> Differenz = reiner Kontroll-Artefakt: ' + r3((A_alt.m - A_neu.m) * 100) + ' Pp');

console.log('\n=== B) Vertrauensbereich (tagesgeclustert, 95 %) ===');
const lo = (A_neu.m - 1.96 * A_neu.se) * 100, hi = (A_neu.m + 1.96 * A_neu.se) * 100;
console.log('  brutto ' + r3(A_neu.m * 100) + ' Pp   [' + r3(lo) + ' ; ' + r3(hi) + ']   (n=' + A_neu.n + ' Tage)');
console.log('  netto  ' + r3(A_neu.m * 100 - KOSTEN) + ' Pp   [' + r3(lo - KOSTEN) + ' ; ' + r3(hi - KOSTEN) + ']');
console.log('  -> handelbare Kante (netto > 0) ' + (hi - KOSTEN > 0 ? 'NICHT ausgeschlossen' : 'ausgeschlossen'));

console.log('\n=== C) Permutation (Signalversatz beibehalten, Tag/Symbol neu gelost) ===');
// Nullverteilung: fuer jeden Eintrag einen zufaelligen ANDEREN Tag desselben Symbols
// mit demselben Versatz ziehen. Erhaelt Versatz- und Symbolstruktur exakt.
const proSym = new Map(); E.forEach(X => proSym.set(X.sym, X));
let seed = 20260822;                       // ausserhalb jeder Schleife, wie die Checkliste verlangt
// mulberry32: 32-Bit-Arithmetik, kein Ueberlauf ueber 2^53. Der alte LCG (seed*1103515245)
// lief bis 2,4e18 und zerfiel durch Gleitkomma-Rundung in einen Zyklus von 10.466 Schritten.
const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ZIEH = 2000;
let extrem = 0; const nullen = [];
for (let z = 0; z < ZIEH; z++) {
  const kunst = [];
  for (const e of eintraege) {
    const X = proSym.get(e.sym);
    const cn = X.cnt.get(e.o) || 0; if (cn < 5) continue;
    // zufaellige Rendite an DEMSELBEN Versatz, irgendein Tag
    const g = X.segs[Math.floor(rnd() * X.segs.length)];
    const k = g.s + e.o;
    if (k + H > g.e || !(X.bars[k] && X.bars[k + H])) continue;
    const p0 = X.bars[k][1], p1 = X.bars[k + H][1];
    if (!(p0 > 0) || !(p1 > 0)) continue;
    const roh = (p1 - p0) / p0;
    const c = (X.sum.get(e.o) - roh) / (cn - 1);
    kunst.push({ tag: new Date(X.bars[g.s][0]).toISOString().slice(0, 10), x: -(roh - c) });
  }
  const r = tTag(kunst); nullen.push(r.m);
  if (r.m >= A_neu.m) extrem++;
}
nullen.sort((a, b) => a - b);
console.log('  Zufalls-Null: Mittel ' + r3(mean(nullen) * 100) + ' Pp, 95%-Quantil ' + r3(nullen[Math.floor(ZIEH * 0.95)] * 100) + ' Pp');
console.log('  Echter Wert ' + r3(A_neu.m * 100) + ' Pp wurde von ' + extrem + ' von ' + ZIEH + ' Zufallslaeufen erreicht  -> p = ' + r3(extrem / ZIEH));

console.log('\n=== D) Einstieg eine Kerze spaeter ===');
const mitV = eintraege.filter(e => e.exVerzug != null);
const D = tTag(mitV.map(e => ({ tag: e.tag, x: e.exVerzug })));
console.log('  brutto ' + r3(D.m * 100) + ' Pp (statt ' + r3(A_neu.m * 100) + ')   t(Tag) ' + r3(D.t) + '   n=' + mitV.length);
