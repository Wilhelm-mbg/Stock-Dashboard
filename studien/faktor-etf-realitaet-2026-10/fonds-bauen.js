'use strict';
/* Baut fonds.json (die gesiegelte Fondsliste) - VOR dem ersten Kurs. Kennung faktor-etf-realitaet-2026-10/v1.
 *   node fonds-bauen.js
 * US-Teil: wie in REGEL.md B1/B2 (von Hand festgelegt). UCITS-Teil: mechanisch aus ucits-recherche.json nach
 * REGEL.md B3 - (1) Auflage bis 31.08.2021, (2) je Fonds eine Anteilsklasse (frueheste Auflage; Gleichstand:
 * thesaurierend, dann mit Xetra-Kuerzel, dann Reihenfolge der Recherche), (3) Ausschluss eines Fonds, der vor 2025 keinen
 * Faktorindex abbildete, (4) Yahoo-Symbole in fester Boersenreihenfolge, hoechstens vier. Keine Rendite geht ein. */
const fs = require('fs');
const path = require('path');
const O = __dirname;

const US = [
  // [Kuerzel, Name, Gruppe, Auftrag, Lauf]
  ['RSP', 'Invesco S&P 500 Equal Weight ETF', 'Gleichgewicht', true, 'g1'],
  ['QUAL', 'iShares MSCI USA Quality Factor ETF', 'Qualität', true, 'g1'],
  ['SPHQ', 'Invesco S&P 500 Quality ETF', 'Qualität', true, 'g1'],
  ['USMV', 'iShares MSCI USA Min Vol Factor ETF', 'Niedrige Schwankung', true, 'g1'],
  ['SPLV', 'Invesco S&P 500 Low Volatility ETF', 'Niedrige Schwankung', true, 'g1'],
  ['LRGF', 'iShares U.S. Equity Factor ETF', 'Multifaktor', true, 'g1'],
  ['GSLC', 'Goldman Sachs ActiveBeta U.S. Large Cap Equity ETF', 'Multifaktor', true, 'g1'],
  ['MOAT', 'VanEck Morningstar Wide Moat ETF', 'Moat', true, 'g1'],
  ['COWZ', 'Pacer US Cash Cows 100 ETF', 'Free Cashflow', true, 'g1'],
  ['VLUE', 'iShares MSCI USA Value Factor ETF', 'Value', true, 'g2'],
  ['IWD', 'iShares Russell 1000 Value ETF', 'Value', true, 'g2'],
  ['RPV', 'Invesco S&P 500 Pure Value ETF', 'Value', true, 'g2'],
  ['IWF', 'iShares Russell 1000 Growth ETF', 'Wachstum', true, 'g2'],
  ['QQQ', 'Invesco QQQ Trust (Nasdaq-100)', 'Wachstum', true, 'g2'],
  ['MTUM', 'iShares MSCI USA Momentum Factor ETF', 'Momentum', true, 'g2'],
  ['SPMO', 'Invesco S&P 500 Momentum ETF', 'Momentum', true, 'g2'],
  ['QMOM', 'Alpha Architect U.S. Quantitative Momentum ETF', 'Momentum', true, 'g2'],
  ['PDP', 'Invesco Dorsey Wright Momentum ETF', 'Momentum', true, 'g2'],
  ['SCHD', 'Schwab U.S. Dividend Equity ETF', 'Dividende', true, 'g3'],
  ['VIG', 'Vanguard Dividend Appreciation ETF', 'Dividende', true, 'g3'],
  ['DGRO', 'iShares Core Dividend Growth ETF', 'Dividende', true, 'g3'],
  ['VYM', 'Vanguard High Dividend Yield ETF', 'Dividende', true, 'g3'],
  ['PKW', 'Invesco BuyBack Achievers ETF', 'Aktionärsrendite', true, 'g3'],
  ['SYLD', 'Cambria Shareholder Yield ETF', 'Aktionärsrendite', true, 'g3'],
  ['IJR', 'iShares Core S&P Small-Cap ETF', 'Kleine Werte', true, 'g3'],
  ['IWM', 'iShares Russell 2000 ETF', 'Kleine Werte', true, 'g3'],
  ['AVUV', 'Avantis U.S. Small Cap Value ETF', 'Kleine Werte', true, 'g3'],
  // Zusatz
  ['PRF', 'Invesco FTSE RAFI US 1000 ETF', 'Fundamentalgewichtung', false, 'g1'],
  ['RWL', 'Invesco S&P 500 Revenue ETF', 'Umsatzgewichtung', false, 'g1'],
  ['QUS', 'SPDR MSCI USA StrategicFactors ETF', 'Multifaktor', false, 'g1'],
  ['IVE', 'iShares S&P 500 Value ETF', 'Value', false, 'g2'],
  ['VTV', 'Vanguard Value ETF', 'Value', false, 'g2'],
  ['IVW', 'iShares S&P 500 Growth ETF', 'Wachstum', false, 'g2'],
  ['VUG', 'Vanguard Growth ETF', 'Wachstum', false, 'g2'],
  ['SCHG', 'Schwab U.S. Large-Cap Growth ETF', 'Wachstum', false, 'g2'],
  ['MGK', 'Vanguard Mega Cap Growth ETF', 'Wachstum', false, 'g2'],
  ['NOBL', 'ProShares S&P 500 Dividend Aristocrats ETF', 'Dividende', false, 'g3'],
  ['SDY', 'SPDR S&P Dividend ETF', 'Dividende', false, 'g3'],
  ['DVY', 'iShares Select Dividend ETF', 'Dividende', false, 'g3'],
  ['HDV', 'iShares Core High Dividend ETF', 'Dividende', false, 'g3'],
  ['SPHD', 'Invesco S&P 500 High Dividend Low Volatility ETF', 'Dividende', false, 'g3'],
  ['DGRW', 'WisdomTree U.S. Quality Dividend Growth Fund', 'Dividende', false, 'g3'],
  ['IJH', 'iShares Core S&P Mid-Cap ETF', 'Mittlere Werte', false, 'g3'],
  ['VBR', 'Vanguard Small-Cap Value ETF', 'Kleine Werte', false, 'g3'],
  ['IJS', 'iShares S&P Small-Cap 600 Value ETF', 'Kleine Werte', false, 'g3'],
  // Kontrollen (gleicher Index wie SPY)
  ['IVV', 'iShares Core S&P 500 ETF', 'Kontrolle', false, 'g1'],
  ['VOO', 'Vanguard S&P 500 ETF', 'Kontrolle', false, 'g1']
];

const STICHTAG_AUFLAGE = '2021-08-31';
const AUSSCHLUSS = {
  IE00B5WFQ436: 'bildete laut Recherche bis 2025 den breiten MSCI USA ab (Wechsel auf MSCI USA Sector Neutral Quality per Mitteilung vom 18.03.2025) - die Historie misst keinen Faktor'
};
const G4 = new Set(['Gleichgewicht', 'Qualität', 'Niedrige Schwankung', 'Value', 'Wachstum', 'Momentum']);
const BOERSE = ['.DE', '.L', '.AS', '.SW', '.MI', '.PA', '.DU', '.MU', '.HM', '.HA', '.BE', '.F', '.SG'];

function rang(sym) {
  const isinArtig = /^[A-Z]{2}[A-Z0-9]{9}\d\./.test(sym);
  const i = BOERSE.findIndex((s) => sym.endsWith(s));
  return (isinArtig ? 100 : 0) + (i < 0 ? 50 : i);
}
function symbole(f) {
  const s = (f.yahoo_symbole || []).map((y, i) => ({ s: y.symbol || y, i }));
  s.sort((a, b) => rang(a.s) - rang(b.s) || a.i - b.i);
  return s.map((x) => x.s).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4);
}
/* Anteilsklassen desselben Fonds: gleicher Anbieter, gleiches ISIN-Land, gleicher Namensstamm */
function stamm(f) {
  const n = f.name.replace(/\(.*?\)/g, ' ')
    .replace(/\b(Acc|Dist|Dis|Inc|acc|dis|1C|1D|2D|A|C|D|DR|USD|EUR|INC-USD|ACC-USD|Unhedged)\b/g, ' ')
    .replace(/\s+/g, ' ').trim();
  return f.anbieter + '|' + f.isin.slice(0, 2) + '|' + n;
}

const rec = JSON.parse(fs.readFileSync(path.join(O, 'ucits-recherche.json'), 'utf8'));
const alle = rec.fonds.filter((f) => f.klasse !== 'Maßstab');
const protokoll = { zuJung: [], zweiteKlasse: [], ausgeschlossen: [] };
const kandidat = [];
for (const f of alle) {
  if (AUSSCHLUSS[f.isin]) { protokoll.ausgeschlossen.push({ isin: f.isin, name: f.name, grund: AUSSCHLUSS[f.isin] }); continue; }
  if (!(f.auflage <= STICHTAG_AUFLAGE)) { protokoll.zuJung.push({ isin: f.isin, name: f.name, auflage: f.auflage }); continue; }
  kandidat.push(f);
}
const nachStamm = new Map();
kandidat.forEach((f, i) => { const k = stamm(f); if (!nachStamm.has(k)) nachStamm.set(k, []); nachStamm.get(k).push({ f, i }); });
const gewaehlt = [];
for (const [, xs] of nachStamm) {
  xs.sort((a, b) => (a.f.auflage < b.f.auflage ? -1 : a.f.auflage > b.f.auflage ? 1 : 0) ||
    ((a.f.ertragsverwendung === 'thesaurierend' ? 0 : 1) - (b.f.ertragsverwendung === 'thesaurierend' ? 0 : 1)) ||
    ((a.f.xetra_kuerzel ? 0 : 1) - (b.f.xetra_kuerzel ? 0 : 1)) || a.i - b.i);
  gewaehlt.push(xs[0]);
  for (const x of xs.slice(1)) protokoll.zweiteKlasse.push({ isin: x.f.isin, name: x.f.name, auflage: x.f.auflage, statt: xs[0].f.isin });
}
gewaehlt.sort((a, b) => a.i - b.i);

const fonds = US.map(([id, name, gruppe, auftrag, lauf]) => ({ id, name, gruppe, art: 'US', auftrag, lauf, yahoo: [id] }));
const ids = new Set(fonds.map((f) => f.id));
for (const { f } of gewaehlt) {
  const sy = symbole(f);
  let id = f.xetra_kuerzel || sy[0].split('.')[0];
  if (ids.has(id)) id = id + '-UCITS';
  if (ids.has(id)) throw new Error('Kennung doppelt: ' + id);
  ids.add(id);
  fonds.push({
    id, name: f.name, gruppe: f.gruppe, art: 'UCITS', auftrag: false, lauf: G4.has(f.gruppe) ? 'g4' : 'g5',
    isin: f.isin, anbieter: f.anbieter, index: f.index, klasse: f.klasse, us_gegenstueck: f.us_gegenstueck,
    auflage: f.auflage, ertrag: f.ertragsverwendung, fondswaehrung: f.fondswaehrung, ter_prozent: f.ter_prozent,
    yahoo: sy, quelle: f.quelle_url, bemerkung: f.bemerkung || null, esg_filter: !!f.esg_filter
  });
}
/* Kontrollen UCITS: der Massstab selbst (gegen SPY) und ein synthetischer S&P-500-UCITS (Bauform gegen SXR8) */
fonds.push({ id: 'SXR8', name: 'iShares Core S&P 500 UCITS ETF USD (Acc)', gruppe: 'Kontrolle', art: 'UCITS', auftrag: false, lauf: 'g5',
  isin: 'IE00B5BMR087', anbieter: 'iShares', index: 'S&P 500', klasse: 'gleicher Index', us_gegenstueck: 'SPY', auflage: '2010-05-19',
  ertrag: 'thesaurierend', fondswaehrung: 'USD', ter_prozent: 0.07, yahoo: ['SXR8.DE'], quelle: 'https://www.justetf.com/de/etf-profile.html?isin=IE00B5BMR087',
  bemerkung: 'zweiter Massstab fuer UCITS (REGEL C6); als Kontrolle gegen SPY gerechnet', esg_filter: false });
fonds.push({ id: 'P500', name: 'Invesco S&P 500 UCITS ETF (Acc, synthetisch)', gruppe: 'Kontrolle', art: 'UCITS', auftrag: false, lauf: 'g5',
  isin: 'IE00B3YCGJ38', anbieter: 'Invesco', index: 'S&P 500', klasse: 'gleicher Index', us_gegenstueck: 'SPY', auflage: '2010-05-20',
  ertrag: 'thesaurierend', fondswaehrung: 'USD', ter_prozent: 0.05, yahoo: ['P500.DE', 'SPXS.L'], quelle: 'https://www.justetf.com/de/etf-profile.html?isin=IE00B3YCGJ38',
  bemerkung: 'Kontrolle: Swap-Bauform ohne Quellensteuerabzug gegen SXR8 (REGEL C6)', esg_filter: false });

const out = {
  kennung: 'faktor-etf-realitaet-2026-10/v1',
  hinweis: 'Gesiegelte Fondsliste - vor dem ersten Kurs erzeugt von fonds-bauen.js aus der Liste in REGEL.md B1/B2 und ucits-recherche.json (B3).',
  massstab: { id: 'SPY', yahoo: ['SPY'] }, massstabUcits: { id: 'SXR8', yahoo: ['SXR8.DE'], isin: 'IE00B5BMR087' },
  pruefgroessen: ['^SP500TR', 'EZB-USD', 'EZB-GBP', 'EZB-CHF'],
  ucitsAuswahl: protokoll,
  fonds
};
fs.writeFileSync(path.join(O, 'fonds.json'), JSON.stringify(out, null, 1) + '\n');
const z = (l) => fonds.filter((f) => f.lauf === l).length;
console.log('Fonds: ' + fonds.length + ' (US ' + fonds.filter((f) => f.art === 'US').length + ', UCITS ' + fonds.filter((f) => f.art === 'UCITS').length + ')');
console.log('je Lauf: g1 ' + z('g1') + ', g2 ' + z('g2') + ', g3 ' + z('g3') + ', g4 ' + z('g4') + ', g5 ' + z('g5'));
console.log('zu jung ' + protokoll.zuJung.length + ', zweite Klasse ' + protokoll.zweiteKlasse.length + ', ausgeschlossen ' + protokoll.ausgeschlossen.length);
