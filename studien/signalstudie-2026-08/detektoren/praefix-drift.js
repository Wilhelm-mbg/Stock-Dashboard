'use strict';
/* Praefix-Probe Ertragstermin-Drift: Signal aus dem Lauf auf Daten bis Tag i (Kurse aller
 * Symbole, Markt und Termine, deren Reaktionstag <= i) muss dem Signal des Laufs auf der
 * ganzen Reihe an Tag i gleichen. Zeitrahmen 1d (nativ fuer den Detektor: Rang ueber
 * Handelstag-Index des Marktes). Datenbasis ab 2022-01-01 (Tier-B-Fenster + Vorlauf). */
const { lade } = require('./lade.js');
const D = require('./drift.js');
const Dr = D.Dr;

function mulberry32(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const rnd = mulberry32(20260822);                       // EIN Generator, ausserhalb aller Schleifen

const AB = Date.parse('2022-01-01T00:00:00Z');
const voll = lade();
const kursMap = {}, termine = voll.termine;
Object.keys(voll.kursMap).forEach(s => { kursMap[s] = voll.kursMap[s].filter(b => b[0] >= AB); });
const markt = voll.markt.filter(b => b[0] >= AB);
const tag = ms => new Date(ms).toISOString().slice(0, 10);

const t0 = Date.now();
const tabVoll = D.signalTabelle(kursMap, termine, markt);
console.log('Voller Lauf:', Object.keys(tabVoll).length, 'Symbole mit Signalen,', (Date.now() - t0) + ' ms');

/* Praefix bis einschliesslich Tag i (Datum des Symbols): Kurse/Markt bis zum Datum,
 * Termine nur, wenn ihr Reaktionstag (nach der Regel der App) im Praefix liegt. */
function praefix(datum) {
  const k = {}, tm = {};
  Object.keys(kursMap).forEach(s => { k[s] = kursMap[s].filter(b => tag(b[0]) <= datum); });
  const m = markt.filter(b => tag(b[0]) <= datum);
  Object.keys(termine).forEach(s => {
    const idx = Dr.datumIndex(k[s] || []);
    tm[s] = termine[s].filter(t => { const r = Dr.reaktionstag(t[0], idx); return r != null && r < (k[s] || []).length; });
  });
  return D.signalTabelle(k, tm, m);
}

const SYMS = ['AAPL', 'MSFT', 'JPM'];
const N_ZUFALL = 200;
let gepr = 0, abw = 0, gesamtQuer = 0, abwQuer = 0, signalTage = 0, liste = [];
SYMS.forEach(sym => {
  const bars = kursMap[sym];
  const von = 260, bis = bars.length - 1;                 // 260 Tage Vorlauf fuer Fenster + Vergleichsmenge
  const idx = new Set();
  while (idx.size < N_ZUFALL) idx.add(von + Math.floor(rnd() * (bis - von + 1)));   // mindestens 200 VERSCHIEDENE Indizes
  Object.keys(tabVoll[sym] || {}).forEach(d => { const i = bars.findIndex(b => tag(b[0]) === d); if (i >= von) idx.add(i); });
  let ab = 0, g = 0, sig = 0;
  [...idx].sort((a, b) => a - b).forEach(i => {
    const d = tag(bars[i][0]);
    const voll_i = D.signal(bars, i, { signale: tabVoll[sym] || {} });
    const tabP = praefix(d);
    const pre_i = D.signal(bars.slice(0, i + 1), i, { signale: tabP[sym] || {} });
    const a = (voll_i ? voll_i.dir : 0), b = (pre_i ? pre_i.dir : 0);
    g++; if (a) sig++;
    if (a !== b) { ab++; liste.push(sym + ' ' + d + ' voll=' + a + ' praefix=' + b); }
    // Querschnitt: alle Symbole an diesem Tag
    Object.keys(kursMap).forEach(s => {
      const v = (tabVoll[s] || {})[d] || 0, p = (tabP[s] || {})[d] || 0;
      gesamtQuer++; if (v !== p) { abwQuer++; if (liste.length < 40) liste.push('  quer ' + s + ' ' + d + ' voll=' + v + ' praefix=' + p); }
    });
  });
  console.log(sym.padEnd(5), 'geprueft', g, '(davon Signaltage', sig + ')', 'Abweichungen', ab);
  gepr += g; abw += ab; signalTage += sig;
});
console.log('\nSUMME 3 Symbole x 1d: geprueft', gepr, 'Signaltage', signalTage, 'Abweichungen', abw, '-> Trefferquote', (100 * (gepr - abw) / gepr).toFixed(2) + ' %');
console.log('Querschnitt (alle 189 Symbole an denselben Tagen): geprueft', gesamtQuer, 'Abweichungen', abwQuer);
if (liste.length) console.log('Abweichungen:\n' + liste.join('\n'));
console.log('Dauer', ((Date.now() - t0) / 1000).toFixed(0) + ' s');
