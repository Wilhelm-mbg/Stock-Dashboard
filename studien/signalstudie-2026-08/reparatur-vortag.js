/* Reparatur fuer Laeufe, die vor dem vortag-Fix gestartet wurden (22.08. ~23:40):
 * bed.vortag las die Rendite des SIGNALTAGES (Zukunftsblick). Die Detektorsignale und
 * Vorwaertsrenditen sind korrekt; nur die Bedingung wird neu gesetzt und die Tabelle
 * neu aggregiert. Terzile aus Entdeckungstagen, wie im Geschirr. */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('./messgeschirr.js');
const OUT = path.join(__dirname, 'ergebnisse');

const iv = process.argv[2], phase = process.argv[3] || 'entdeckung';
const f = path.join(OUT, 'lauf-' + iv + '-' + phase + '.json');
const L = JSON.parse(fs.readFileSync(f, 'utf8'));
if (L.vortagRepariert) { console.log('schon repariert'); process.exit(0); }

const U = M.ladeUniversum(iv);
const proSym = {};
for (const E of U) {
  M.bereite(E, iv);
  const vor = {};
  E.segs.forEach((g, di) => { if (di > 0) vor[E.dayKey[g.s]] = E.tagRet[E.dayKey[E.segs[di - 1].s]]; });
  proSym[E.sym] = vor;
}
// Terzile ueber Vortagsrenditen der Entdeckungstage
const alle = [];
for (const s of Object.keys(proSym)) for (const k of Object.keys(proSym[s])) if (k < L.cutoff && proSym[s][k] != null) alle.push(proSym[s][k]);
alle.sort((a, b) => a - b);
const terz = [alle[Math.floor(alle.length / 3)], alle[Math.floor(alle.length * 2 / 3)]];

let gesetzt = 0, na = 0;
for (const det of Object.keys(L.ereignisse)) for (const e of L.ereignisse[det]) {
  const vr = proSym[e.sym] ? proSym[e.sym][e.tag] : undefined;
  if (vr == null) { e.bed.vortag = 'na'; na++; continue; }
  e.bed.vortag = vr > terz[1] ? 'hoch' : (vr < terz[0] ? 'tief' : 'mitte'); gesetzt++;
}
L.zeilen = M.aggregiere(L.ereignisse, M.HORIZONTE[iv]);
L.tests = L.zeilen.length;
L.vortagRepariert = new Date().toISOString();
delete L.paare; delete L.paareGerechnet; delete L.paareUebersprungen;   // Paare danach neu rechnen
fs.writeFileSync(f, JSON.stringify(L));
console.log(iv + '/' + phase + ': vortag neu gesetzt fuer ' + gesetzt + ' Ereignisse (' + na + ' ohne Vortag), ' + L.tests + ' Testzeilen neu aggregiert');
const max = Math.max.apply(null, L.zeilen.filter(z => z.bedingung === 'vortag').map(z => Math.abs(z.tTag)));
console.log('  groesstes |t| unter vortag jetzt: ' + max.toFixed(2));
