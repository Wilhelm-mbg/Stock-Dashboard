'use strict';
/* REGEL.md C9: rechnet die 5-Jahres-Werte der Factsheet-Stichproben (factsheet-g1..g5.json, von den Gruppen erhoben) mit dem
 * ENDGUELTIGEN Rechner nach (benannte Ergaenzungen C2, K1b, K2) und schreibt factsheet-gesamt.json:
 * je Stichprobe Anbieterwert, Wert der Gruppe (vor den Korrekturen) und Endwert, Abweichung Endwert - Anbieter in Pp p. a.
 *   node factsheet-nachrechnen.js --roh <ordner> */
const fs = require('fs');
const path = require('path');
const R = require('./rechnen.js');
const i = process.argv.indexOf('--roh');
if (i < 0) { console.error('Aufruf: node factsheet-nachrechnen.js --roh <ordner>'); process.exit(2); }
const roh = process.argv[i + 1];
const ctx = R.kontext(roh, '2026-12-31');
const cache = new Map();
function reihe(sym) {
  if (!cache.has(sym)) {
    const r = R.leseReihe(roh, sym);
    const b = R.bereite(r, sym === 'SPY' ? null : ctx.spy, ctx.fxUsdJeEur);
    cache.set(sym, { tr: b.tr, waehrung: r.waehrung });
  }
  return cache.get(sym);
}
const out = [];
for (const g of ['g1', 'g2', 'g3', 'g4', 'g5']) {
  const p = path.join(__dirname, 'factsheet-' + g + '.json');
  if (!fs.existsSync(p)) continue;
  for (const s of JSON.parse(fs.readFileSync(p, 'utf8')).stichproben || []) {
    const e = { gruppe: g, id: s.id, symbol: s.symbol, stichtag: s.stichtag, art: s.art, waehrung: s.waehrung || 'USD', anbieter_url: s.anbieter_url,
      anbieter_5j_pa: s.anbieter_5j_pa, gruppe_5j_pa: s.unser_5j_pa, gruppe_abweichung_pp: s.abweichung_pp };
    if (typeof s.anbieter_5j_pa === 'number' && s.stichtag && s.symbol) {
      try {
        const x = reihe(s.symbol);
        const tr = ctx.waehrungUmrechnen(x.tr, x.waehrung, e.waehrung);
        const w = R.renditeBisStichtag(tr, s.stichtag, 5);
        if (w) { e.end_5j_pa = Number((w.pa * 100).toFixed(4)); e.abweichung_pp = Number((e.end_5j_pa - s.anbieter_5j_pa).toFixed(3)); e.zeitraum = w.von + '..' + w.bis; }
      } catch (err) { e.fehler = String(err.message || err); }
    } else e.nicht_erreichbar = true;
    out.push(e);
  }
}
const ab = out.filter((x) => typeof x.abweichung_pp === 'number').map((x) => x.abweichung_pp).sort((a, b) => a - b);
const med = ab.length ? (ab.length % 2 ? ab[(ab.length - 1) / 2] : (ab[ab.length / 2 - 1] + ab[ab.length / 2]) / 2) : null;
const zusammen = { verglichen: ab.length, nichtErreichbar: out.filter((x) => x.nicht_erreichbar).length, min: ab[0], max: ab[ab.length - 1], median: med,
  ueber030: out.filter((x) => Math.abs(x.abweichung_pp) >= 0.3).map((x) => x.id + ' ' + x.abweichung_pp) };
fs.writeFileSync(path.join(__dirname, 'factsheet-gesamt.json'), JSON.stringify({ kennung: R.KENNUNG, zusammen, stichproben: out }, null, 1) + '\n');
console.log(JSON.stringify(zusammen));
