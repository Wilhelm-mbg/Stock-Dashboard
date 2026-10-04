'use strict';
/* REGEL.md C10: Abgleich Hauptrechner (rechnen.js) gegen den unabhaengigen zweiten Rechner (zweitrechner/ergebnis-zweit.json).
 *   node vergleich-zweit.js --roh <ordner>      -> schreibt zweitrechner/vergleich.json und gibt die Tabelle aus
 * Toleranzen (vorab in C10): Abstaende 0,05 Pp p. a., Zahl der Fenster vor SPY +-1, Rueckschlag 0,5 Pp. */
const fs = require('fs');
const path = require('path');
const R = require('./rechnen.js');
const i = process.argv.indexOf('--roh');
if (i < 0) { console.error('Aufruf: node vergleich-zweit.js --roh <ordner>'); process.exit(2); }
const roh = process.argv[i + 1];
const Z = JSON.parse(fs.readFileSync(path.join(__dirname, 'zweitrechner', 'ergebnis-zweit.json'), 'utf8'));
const F = JSON.parse(fs.readFileSync(path.join(__dirname, 'fonds.json'), 'utf8')).fonds;
/* wie der Zweitrechner OHNE die Datenkorrekturen nach dem Siegel (benannte Ausschuettungs-Ergaenzungen C2 und K2 USD-Werte;
 * K1b hat er als Lesart uebernommen) - Rechenweg gegen Rechenweg. Die Wirkung der Korrekturen steht in ERGEBNIS.md. */
const ctx = R.kontext(roh, undefined, true);
const zeilen = [];
function pruefe(name, a, b, tol) {
  const d = a - b; const ok = Math.abs(d) <= tol;
  zeilen.push({ name, haupt: a, zweit: b, differenz: d, toleranz: tol, ok });
}
/* SPY absolut */
for (const k of ['A', 'B']) {
  const h = R.fensterRendite(ctx.spy, R.FENSTER[k].start, R.FENSTER[k].ende);
  pruefe('SPY ' + k + ' Rendite (Pp)', h.r * 100, Z.spy[k].r * 100, 0.05);
}
for (const z of Z.fonds) {
  const f = F.find((x) => x.id === z.id);
  const e = R.rechneFonds(f, ctx);
  const g = e.gegenSPY;
  zeilen.push({ name: z.id + ' Symbol', haupt: e.symbol, zweit: z.symbol, ok: e.symbol === z.symbol });
  for (const k of ['A', 'B']) {
    if (g[k].berechenbar && z[k].berechenbar) pruefe(z.id + ' ' + k + ' Abstand p. a. (Pp)', g[k].abstandPa * 100, z[k].abstandPa * 100, 0.05);
    else zeilen.push({ name: z.id + ' ' + k + ' berechenbar', haupt: g[k].berechenbar, zweit: z[k].berechenbar, ok: g[k].berechenbar === z[k].berechenbar });
  }
  const r = g.rollierend; const q = z.rollierend;
  zeilen.push({ name: z.id + ' Zahl der Fenster n', haupt: r.n, zweit: q.n, ok: r.n === q.n });
  pruefe(z.id + ' Fenster vor SPY', r.vorn, q.vorn, 1);
  pruefe(z.id + ' Median p. a. (Pp)', r.median * 100, q.median * 100, 0.05);
  pruefe(z.id + ' schlechtester p. a. (Pp)', r.schlechtester * 100, q.schlechtester * 100, 0.05);
  zeilen.push({ name: z.id + ' erster/letzter Startmonat', haupt: r.erstesFenster + '/' + r.letztesFenster, zweit: q.erstesFenster + '/' + q.letztesFenster, ok: r.erstesFenster === q.erstesFenster && r.letztesFenster === q.letztesFenster });
  pruefe(z.id + ' Rueckschlag gegen SPY (Pp)', g.rueckschlagGegenMassstab.tiefe * 100, z.rueckschlag.tiefe * 100, 0.5);
  zeilen.push({ name: z.id + ' Urteil gegen SPY', haupt: R.urteil(g.A, g.B, g.rollierend).satz, zweit: z.urteil, ok: R.urteil(g.A, g.B, g.rollierend).satz === z.urteil });
  if (z.gegenSXR8 && e.gegenSXR8) {
    const x = e.gegenSXR8; const y = z.gegenSXR8;
    for (const k of ['A', 'B']) pruefe(z.id + ' gg. SXR8 ' + k + ' Abstand p. a. (Pp)', x[k].abstandPa * 100, y[k].abstandPa * 100, 0.05);
    if (y.rollierend) {
      zeilen.push({ name: z.id + ' gg. SXR8 Zahl der Fenster n', haupt: x.rollierend.n, zweit: y.rollierend.n, ok: x.rollierend.n === y.rollierend.n });
      pruefe(z.id + ' gg. SXR8 Fenster vorn', x.rollierend.vorn, y.rollierend.vorn, 1);
      pruefe(z.id + ' gg. SXR8 Median p. a. (Pp)', x.rollierend.median * 100, y.rollierend.median * 100, 0.05);
    }
    if (y.rueckschlag) pruefe(z.id + ' gg. SXR8 Rueckschlag (Pp)', x.rueckschlagGegenMassstab.tiefe * 100, y.rueckschlag.tiefe * 100, 0.5);
    zeilen.push({ name: z.id + ' Gesamturteil (SPY und SXR8)', haupt: e.urteil, zweit: z.urteilGesamt || '-', ok: e.urteil === z.urteilGesamt });
  }
}
const alle = zeilen.every((x) => x.ok);
for (const x of zeilen) {
  const fmt = (v) => (typeof v === 'number' ? v.toFixed(4) : String(v));
  console.log((x.ok ? 'ok    ' : 'ABWEICH') + ' ' + x.name.padEnd(40) + ' haupt ' + fmt(x.haupt).padStart(12) + '  zweit ' + fmt(x.zweit).padStart(12) + (x.differenz != null ? '  diff ' + x.differenz.toFixed(4) : ''));
}
console.log(alle ? 'Alle Groessen innerhalb der Toleranz (REGEL C10).' : 'Abweichungen ausserhalb der Toleranz - Ursache klaeren.');
fs.writeFileSync(path.join(__dirname, 'zweitrechner', 'vergleich.json'), JSON.stringify({ kennung: R.KENNUNG, alleInToleranz: alle, zeilen }, null, 1) + '\n');
