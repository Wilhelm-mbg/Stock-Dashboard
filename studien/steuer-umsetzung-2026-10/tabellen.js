'use strict';
// Erzeugt die Markdown-Tabellen des Berichts aus ergebnis.json (keine Handabschrift).
const fs = require('fs');
const j = require('./ergebnis.json');
const r = x => Math.round(x).toLocaleString('de-DE');
const p = x => (x * 100).toFixed(2).replace('.', ',');
let o = '';
const NAMEN = { f1: 'Fenster 1: 16.09.2021 – 15.09.2026', f2: 'Fenster 2: 04.01.2017 – 15.09.2021' };
for (const k of ['f1', 'f2']) {
  const f = j.fenster[k], K0 = f.basis.startEUR, J = f.jahre;
  const cg = e => Math.pow(e / K0, 1 / J) - 1;
  o += `### ${NAMEN[k]}\n\nStartkapital 100.000 $ = ${r(K0)} € (EZB-Kurs am Starttag), ${J.toFixed(2).replace('.', ',')} Jahre.\n\n`;
  o += '**Endvermögen in €** (Mittel über ' + j.trials + ' Zufallsläufe des Buchmodells; (b), (c) deterministisch)\n\n';
  o += '| | (a) Einzelaktienbuch | (b) Momentum-ETF | (c) S&P-500-ETF |\n|---|---|---|---|\n';
  const L = (n, fn) => { o += `| ${n} | ${fn('a')} | ${fn('b')} | ${fn('c')} |\n`; };
  L('vor Steuern, nach Kosten', x => r(f.vorSteuer[x].endMitVerkauf));
  L('nach Steuern, **mit Verkauf am Ende**', x => '**' + r(f.basis[x].endMitVerkauf) + '**');
  L('nach Steuern, **ohne Verkauf** (Marktwert, latente Steuer nicht abgezogen)', x => r(f.basis[x].endOhneVerkauf));
  L('gezahlte Steuer insgesamt (laufend + Schlussverkauf bzw. Vorabpauschalen)', x => r(f.basis[x].steuer));
  L('Rendite p. a. vor Steuern (nach Kosten)', x => p(cg(f.vorSteuer[x].endMitVerkauf)) + ' %');
  L('Rendite p. a. nach Steuern, mit Verkauf', x => p(cg(f.basis[x].endMitVerkauf)) + ' %');
  L('Steuerbremse in Pp p. a. (vor minus nach Steuern)', x => p(cg(f.vorSteuer[x].endMitVerkauf) - cg(f.basis[x].endMitVerkauf)));
  o += `\nStreuung des Buchmodells über die Zufallsläufe (10 %–90 %-Band, mit Verkauf): ${r(f.basis.a.p10)} – ${r(f.basis.a.p90)} € (das ist nur Modellrauschen aus der Positionsauswahl, keine Marktunsicherheit).\n\n`;
  o += '**Gewinnschwelle: nötiger Vorsprung vor Steuern** (Rendite p. a. von (a) minus Rendite p. a. des ETF, beide nach Kosten bzw. TER, vor Steuern, in Pp p. a.; (a) wird dazu um eine gleichbleibende Jahresrendite verschoben, bis das Endvermögen nach Steuern dem des ETF entspricht)\n\n';
  o += '| | gegen (b) Momentum-ETF | gegen (c) S&P-500-ETF |\n|---|---|---|\n';
  o += `| nötiger Vorsprung vor Steuern | **${p(f.basis.schwelleB.vorsprungNoetig)} Pp** | **${p(f.basis.schwelleC.vorsprungNoetig)} Pp** |\n`;
  o += `| tatsächlicher Vorsprung des Buchs im Fenster (Rückblick) | ${p(f.basis.schwelleB.vorsprungIst)} Pp | ${p(f.basis.schwelleC.vorsprungIst)} Pp |\n`;
  o += `| Steuerlast-Unterschied bei den tatsächlichen Renditen (Steuerbremse (a) minus ETF) | ${p((cg(f.vorSteuer.a.endMitVerkauf) - cg(f.basis.a.endMitVerkauf)) - (cg(f.vorSteuer.b.endMitVerkauf) - cg(f.basis.b.endMitVerkauf)))} Pp p. a. | ${p((cg(f.vorSteuer.a.endMitVerkauf) - cg(f.basis.a.endMitVerkauf)) - (cg(f.vorSteuer.c.endMitVerkauf) - cg(f.basis.c.endMitVerkauf)))} Pp p. a. |\n\n`;
  o += '**Empfindlichkeit** (Endvermögen in € nach Steuern mit Verkauf; Schwelle = nötiger Vorsprung vor Steuern in Pp p. a.)\n\n';
  o += '| Szenario | (a) | (b) | (c) | Schwelle gg. (b) | Schwelle gg. (c) |\n|---|---|---|---|---|---|\n';
  for (const s of f.sens) o += `| ${s.name} | ${r(s.a.endMitVerkauf)} | ${r(s.b.endMitVerkauf)} | ${r(s.c.endMitVerkauf)} | ${p(s.schwelleB.vorsprungNoetig)} | ${p(s.schwelleC.vorsprungNoetig)} |\n`;
  o += '\n**Annahme zum Momentum-ETF (b)** (nur (b) und die Schwelle gegen (b) ändern sich)\n\n| Annahme | (b) Endvermögen € | Schwelle gg. (b) Pp |\n|---|---|---|\n';
  for (const s of f.bVarianten) o += `| ${s.name} | ${r(s.b.endMitVerkauf)} | ${p(s.schwelleB.vorsprungNoetig)} |\n`;
  o += '\n';
}
fs.writeFileSync(__dirname + '/tabellen.md', o);
console.log(o);
