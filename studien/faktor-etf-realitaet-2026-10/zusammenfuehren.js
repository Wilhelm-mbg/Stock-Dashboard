'use strict';
/* Faktor-ETF-Realitaetsprobe 2026-10 - fuehrt die Gruppenergebnisse (gruppe-g1..g4.json) zu ergebnis.json zusammen
 * und erzeugt die Tabellenzeilen fuer ERGEBNIS.md (tabellen.md). Rechnet nichts neu ausser Formatierung und Zaehlung.
 *   node zusammenfuehren.js            (aus dem Studienordner oder mit Pfad) */
const fs = require('fs');
const path = require('path');
const R = require('./rechnen.js');
const O = __dirname;

function lies(n) { const p = path.join(O, n); return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null; }
const MINUS = '−';
function zahl(x, st) { if (x == null || !isFinite(x)) return '–'; const s = Math.abs(x).toFixed(st == null ? 2 : st).replace('.', ','); return (x < 0 ? MINUS : x > 0 ? '+' : '±') + s; }
function proz(x, st) { return x == null ? '–' : (x * 100).toFixed(st == null ? 0 : st).replace('.', ',') + ' %'; }
function pp(x) { return x == null ? '–' : zahl(x * 100); }
function datum(d) { return d ? d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(0, 4) : '–'; }
function monat(m) { return m ? m.slice(5, 7) + '/' + m.slice(0, 4) : '–'; }

const fondsListe = lies('fonds.json').fonds;
const nachId = new Map(fondsListe.map((f) => [f.id, f]));
const gruppen = ['g1', 'g2', 'g3', 'g4', 'g5'].map((g) => lies('gruppe-' + g + '.json')).filter(Boolean);
const fs1 = ['g1', 'g2', 'g3', 'g4', 'g5'].map((g) => lies('factsheet-' + g + '.json')).filter(Boolean);
const factsheet = new Map();
for (const f of fs1) for (const e of (f.stichproben || f.fonds || [])) if (e && e.id) factsheet.set(e.id, e);

function kategorie(f) {
  if (f.gruppe === 'Kontrolle') return 'Kontrolle';
  if (f.art === 'UCITS') return 'UCITS';
  return f.auftrag ? 'Auftrag' : 'Zusatz';
}

function zeileUS(e, f) {
  const g = e.gegenSPY; const r = g.rollierend;
  return '| ' + [kategorie(f), f.gruppe, '**' + f.id + '**', datum(e.datenbeginn),
    g.A.berechenbar ? pp(g.A.abstandPa) : '–', g.B.berechenbar ? pp(g.B.abstandPa) : '–',
    r.n ? r.vorn + '/' + r.n + ' (' + proz(r.anteil) + ')' : '–', r.n ? pp(r.median) : '–',
    r.n ? pp(r.schlechtester) + ' (' + monat(r.schlechtesterStart) + ')' : '–',
    proz(g.rueckschlagGegenMassstab.tiefe, 1).replace(/^-/, MINUS), e.urteil].join(' | ') + ' |';
}
function zeileUCITS(e, f) {
  const g = e.gegenSPY; const x = e.gegenSXR8 || null; const r = g.rollierend; const rx = x ? x.rollierend : null;
  return '| ' + [f.gruppe, '**' + f.id + '**', f.isin || '–', e.symbol, datum(e.datenbeginn),
    g.A.berechenbar ? pp(g.A.abstandPa) : '–', g.B.berechenbar ? pp(g.B.abstandPa) : '–',
    r.n ? r.vorn + '/' + r.n + ' (' + proz(r.anteil) + ')' : '–',
    x && x.A.berechenbar ? pp(x.A.abstandPa) : '–', x && x.B.berechenbar ? pp(x.B.abstandPa) : '–',
    rx && rx.n ? rx.vorn + '/' + rx.n + ' (' + proz(rx.anteil) + ')' : '–', rx && rx.n ? pp(rx.median) : '–',
    proz(x ? x.rueckschlagGegenMassstab.tiefe : null, 1).replace(/^-/, MINUS), e.urteil].join(' | ') + ' |';
}

const alle = [];
let spyPruefung = null;
for (const g of gruppen) {
  if (!spyPruefung && g.spyPruefung) spyPruefung = g.spyPruefung;
  for (const e of g.fonds) {
    const f = nachId.get(e.id);
    if (!f) throw new Error('unbekannter Fonds in Gruppenergebnis: ' + e.id);
    const o = {
      id: e.id, name: f.name, gruppe: f.gruppe, art: f.art, kategorie: kategorie(f), isin: f.isin || null, lauf: f.lauf,
      symbol: e.symbol || null, symbolGrund: e.symbolGrund || null, waehrung: e.waehrung || null,
      datenbeginn: e.datenbeginn || null, datenende: e.datenende || null, auflage: f.auflage || null,
      urteil: e.urteil || null, fehler: e.fehler || null,
      gegenSPY: e.gegenSPY || null, gegenSXR8: e.gegenSXR8 || null,
      pruefungKurz: e.pruefung ? {
        sprungpaare: e.pruefung.sprungpaare.length, grosseBewegungen: e.pruefung.grosseBewegungen.length, luecken: e.pruefung.luecken.length,
        ausschuettungen: e.pruefung.ausschuettungen, kapitalgewinne: e.pruefung.kapitalgewinne, splits: e.pruefung.splits.length,
        abgleichAdjcloseA: e.pruefung.abgleichAdjclose.A ? e.pruefung.abgleichAdjclose.A.differenzPa : null,
        abgleichAdjcloseB: e.pruefung.abgleichAdjclose.B ? e.pruefung.abgleichAdjclose.B.differenzPa : null
      } : null,
      factsheet: factsheet.get(e.id) || null
    };
    if (o.gegenSPY) o.zeile = f.art === 'UCITS' ? zeileUCITS(e, f) : zeileUS(e, f);
    alle.push(o);
  }
}
const reihenfolge = new Map(fondsListe.map((f, i) => [f.id, i]));
alle.sort((a, b) => reihenfolge.get(a.id) - reihenfolge.get(b.id));

const vorn = (k) => alle.filter((x) => x.kategorie === k && x.urteil === 'verlässlich vorn').map((x) => x.id);
const zaehl = (k) => {
  const xs = alle.filter((x) => x.kategorie === k);
  return { fonds: xs.length, verlaesslichVorn: xs.filter((x) => x.urteil === 'verlässlich vorn').length,
    nichtVerlaesslich: xs.filter((x) => x.urteil === 'nicht verlässlich vorn').length,
    zuJung: xs.filter((x) => (x.urteil || '').indexOf('nicht beurteilbar') === 0).length,
    fehler: xs.filter((x) => !x.urteil).length };
};
const geschl = lies('geschlossene-fonds.json');
const zweit = lies(path.join('zweitrechner', 'ergebnis-zweit.json'));

const ergebnis = {
  kennung: R.KENNUNG, erzeugt: new Date().toISOString(), datenende: R.DATENENDE, fenster: R.FENSTER,
  regel: 'REGEL.md (Siegel) - verlaesslich vorn = >= 80 % der rollierenden 5-Jahres-Fenster vor SPY UND vorn in A UND vorn in B; UCITS zusaetzlich gegen SXR8',
  spyPruefung,
  zusammenfassung: {
    verlaesslichVorn: { auftrag: vorn('Auftrag'), zusatz: vorn('Zusatz'), ucits: vorn('UCITS'), kontrolle: vorn('Kontrolle') },
    zaehlung: { auftrag: zaehl('Auftrag'), zusatz: zaehl('Zusatz'), ucits: zaehl('UCITS'), kontrolle: zaehl('Kontrolle') }
  },
  geschlosseneFonds: geschl ? { belegt: (geschl.fonds || []).length, us: (geschl.fonds || []).filter((x) => x.boerse === 'US').length,
    ucits: (geschl.fonds || []).filter((x) => x.boerse === 'UCITS').length, datei: 'geschlossene-fonds.json' } : null,
  zweitrechner: zweit ? { datei: 'zweitrechner/ergebnis-zweit.json' } : null,
  fonds: alle
};
fs.writeFileSync(path.join(O, 'ergebnis.json'), JSON.stringify(ergebnis, null, 1) + '\n');

/* Tabellen fuer ERGEBNIS.md */
const kopfUS = '| Art | Gruppe | Fonds | Daten ab | A Abstand p. a. | B Abstand p. a. | 5-J.-Fenster vor SPY | Median p. a. | schlechtester p. a. (Start) | größter Rückschlag gg. SPY | Urteil |\n|---|---|---|---|---|---|---|---|---|---|---|';
const kopfU = '| Gruppe | Fonds | ISIN | Symbol | Daten ab | gg. SPY A | gg. SPY B | gg. SPY Fenster vorn | gg. SXR8 A | gg. SXR8 B | gg. SXR8 Fenster vorn | gg. SXR8 Median | Rückschlag gg. SXR8 | Urteil |\n|---|---|---|---|---|---|---|---|---|---|---|---|---|---|';
let t = '### US-ETFs gegen SPY (Auftrag, Zusatz, Kontrollen)\n\n' + kopfUS + '\n';
for (const x of alle) if (x.art !== 'UCITS' && x.zeile) t += x.zeile + '\n';
t += '\n### UCITS gegen SPY (in USD) und gegen SXR8 (in EUR)\n\n' + kopfU + '\n';
for (const x of alle) if (x.art === 'UCITS' && x.zeile) t += x.zeile + '\n';
const ohne = alle.filter((x) => !x.zeile);
if (ohne.length) t += '\nOhne Zahlen: ' + ohne.map((x) => x.id + ' (' + (x.fehler || 'keine Reihe') + ')').join(', ') + '\n';
fs.writeFileSync(path.join(O, 'tabellen.md'), t);
console.log(JSON.stringify(ergebnis.zusammenfassung, null, 1));
console.log('Fonds: ' + alle.length + ', ohne Zahlen: ' + ohne.length);
