/* PHASE 4 - BESTAETIGUNG. Liest die in auswahl.js festgeschriebene Kandidatenliste und
 * rechnet GENAU DIESE auf den zurueckgehaltenen Tagen. Nichts anderes. Kein Nachjustieren.
 *
 * Fuer jeden Kandidaten: Ueberschuss, t(Tag), MDE auf der Bestaetigungsmenge, und das
 * Urteil nach Registrierung:
 *   - |t| >= Bonferroni-Schwelle (0,05 / Kandidatenzahl, zweiseitig)  -> BESTAETIGT
 *   - gesuchte Kante (netto > 0, also brutto > Kosten) unter dem MDE  -> UNENTSCHIEDEN
 *   - sonst                                                           -> NICHT BESTAETIGT
 * Belegte Kanten (Referenz) werden getrennt ausgewiesen: sie sind vorab benannte
 * Hypothesen und tragen nicht zur Kandidatenzahl der Scan-Funde bei.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('./messgeschirr.js');
const A = require('./auswahl.js');
const OUT = path.join(__dirname, 'ergebnisse');

function inverf(x) { const a = 0.147; const ln = Math.log(1 - x * x); const t1 = 2 / (Math.PI * a) + ln / 2; return Math.sign(x) * Math.sqrt(Math.sqrt(t1 * t1 - ln / a) - t1); }
const zSchwelle = k => Math.sqrt(2) * inverf(1 - 0.05 / k);

function bestaetige(iv, detektoren) {
  const K = JSON.parse(fs.readFileSync(path.join(OUT, 'kandidaten.json'), 'utf8'))[iv];
  if (!K) { console.log(iv + ': keine Kandidaten'); return null; }
  const scan = [].concat(K.kandidaten.einzel, K.kandidaten.bedingt, K.kandidaten.paare);
  const ref = K.kandidaten.referenz;
  const noetig = new Set([].concat(scan, ref).flatMap(z => [z.det, z.partner]).filter(Boolean));
  const dets = detektoren.filter(d => noetig.has(d.key));
  console.log('=== BESTAETIGUNG ' + iv + ': ' + scan.length + ' Scan-Kandidaten + ' + ref.length + ' Referenz, Detektoren: ' + dets.map(d => d.key).join(', ') + ' ===');

  // Bestaetigungslauf: dieselbe Maschine, nur die anderen Tage
  // Vorhandenen Bestaetigungslauf wiederverwenden (die Detektion ist deterministisch);
  // NEU=1 erzwingt die Neuberechnung.
  const fL = path.join(OUT, 'lauf-' + iv + '-bestaetigung.json');
  const L = (fs.existsSync(fL) && !process.env.NEU) ? JSON.parse(fs.readFileSync(fL, 'utf8'))
    : M.lauf({ iv, phase: 'bestaetigung', detektoren: dets, log: () => {} });
  // Paare auf der Bestaetigungsmenge nachrechnen (ohne Screening - die Auswahl ist fix)
  let paareB = [];
  if (K.kandidaten.paare.length) {
    const P = require('./paare.js');
    paareB = P.rechnePaare(iv, 'bestaetigung', true) || [];
  }
  const finde = z => {
    if (z.partner) return paareB.find(p => ((p.det === z.det && p.partner === z.partner) || (p.det === z.partner && p.partner === z.det)) && p.dir === z.dir && p.hor === z.hor);
    return L.zeilen.find(y => y.det === z.det && y.dir === z.dir && y.hor === z.hor && y.bedingung === z.bedingung && y.wert === z.wert);
  };
  const kScan = scan.length, schwelle = kScan ? zSchwelle(kScan) : 2;
  const urteil = (z, b, schw) => {
    if (!b) return 'keine Signale in der Bestaetigung';
    if (Math.abs(b.tTag) >= schw && b.nettoPp > 0) return 'BESTAETIGT';
    if (b.mdeTagPp != null && M.KOSTEN_PP < b.mdeTagPp && b.bruttoPp > 0) return 'unentschieden (Netto-Frage unter MDE ' + b.mdeTagPp + ')';
    return 'nicht bestaetigt';
  };
  const zeilen = [];
  const zeig = (titel, arr, schw, istRef) => {
    console.log('\n' + titel + (istRef ? '' : '  (Schwelle |t| >= ' + schw.toFixed(2) + ' bei ' + kScan + ' Kandidaten)'));
    console.log('  Kandidat'.padEnd(50) + 'Entdeckung          Bestaetigung                            Urteil');
    console.log('  '.padEnd(50) + 'brutto  t(Tag)      n   Tage  brutto   netto  t(Tag)   MDE');
    arr.forEach(z => {
      const b = finde(z);
      const u = urteil(z, b, istRef ? 2 : schw);
      zeilen.push({ kandidat: A.schluessel(z), referenz: !!istRef, entdeckung: { bruttoPp: z.bruttoPp, tTag: z.tTag }, bestaetigung: b || null, urteil: u });
      console.log('  ' + A.schluessel(z).padEnd(48) + String(z.bruttoPp).padStart(7) + String(z.tTag).padStart(7) + '   ' +
        (b ? String(b.n).padStart(5) + String(b.nTage).padStart(6) + String(b.bruttoPp).padStart(8) + String(b.nettoPp).padStart(8) + String(b.tTag).padStart(8) + String(b.mdeTagPp).padStart(7) : '   -'.padEnd(42)) +
        '   ' + u);
    });
  };
  zeig('SCAN-FUNDE', scan, schwelle, false);
  zeig('REFERENZ (vorab benannte belegte Kanten, Schwelle |t| >= 2)', ref, 2, true);
  const out = { iv, cutoff: L.cutoff, tage: L.tage, kandidatenScan: kScan, schwelle: Math.round(schwelle * 100) / 100, zeilen };
  fs.writeFileSync(path.join(OUT, 'bestaetigung-' + iv + '.json'), JSON.stringify(out, null, 1));
  return out;
}
module.exports = { bestaetige };
if (require.main === module) {
  const tab = require(process.env.DETEKTOR_TABELLE || path.join(__dirname, 'detektoren.js'));
  for (const iv of process.argv.slice(2)) bestaetige(iv, tab);
}
