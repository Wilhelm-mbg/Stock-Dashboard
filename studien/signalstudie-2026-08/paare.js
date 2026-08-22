/* PAARE: Konjunktion zweier Einzelsignale im selben 30-Minuten-Fenster, gleiche Richtung.
 * Arbeitet auf den im Entdeckungslauf gespeicherten Ereignissen - keine Neuerkennung.
 *
 * Registrierte Einschraenkung: nur Paare, deren beide Glieder einzeln t(Tag) > 0,5 in
 * derselben Richtung (beim Horizont des Paares) zeigen. Die Zahl der gerechneten Paare
 * wird ausgewiesen und zaehlt zur Testzahl.
 * Einstieg = das SPAETERE der beiden Signale (erst dann sind beide Bedingungen bekannt).
 */
'use strict';
const fs = require('fs');
const path = require('path');
const M = require('./messgeschirr.js');
const OUT = path.join(__dirname, 'ergebnisse');

const FENSTER_MS = 30 * 60000;

function rechnePaare(iv, phase) {
  const f = path.join(OUT, 'lauf-' + iv + '-' + phase + '.json');
  if (!fs.existsSync(f)) { console.log(iv + '/' + phase + ': kein Lauf'); return null; }
  const L = JSON.parse(fs.readFileSync(f, 'utf8'));
  const dets = Object.keys(L.ereignisse);
  const hor = M.HORIZONTE[iv].map(h => h[1]);
  // Screening-Tabelle: t(Tag) je det x dir x hor aus den Einzelzeilen
  const tVon = {};
  L.zeilen.filter(z => z.bedingung === '-').forEach(z => { tVon[z.det + '|' + z.dir + '|' + z.hor] = z.tTag; });
  const paare = []; let gerechnet = 0, uebersprungen = 0;
  for (let a = 0; a < dets.length; a++) for (let b = a + 1; b < dets.length; b++) {
    const A = L.ereignisse[dets[a]], B = L.ereignisse[dets[b]];
    // Index je Symbol fuer B
    const bIdx = new Map();
    B.forEach(e => { if (!bIdx.has(e.sym)) bIdx.set(e.sym, []); bIdx.get(e.sym).push(e); });
    for (const [, arr] of bIdx) arr.sort((x, y) => x.t - y.t);
    for (const dir of [1, -1]) for (const lab of hor) {
      const dirName = dir > 0 ? 'long' : 'short';
      const tA = tVon[dets[a] + '|' + dirName + '|' + lab], tB = tVon[dets[b] + '|' + dirName + '|' + lab];
      if (!(tA > 0.5 && tB > 0.5)) { uebersprungen++; continue; }
      gerechnet++;
      const entries = [];
      for (const ea of A) {
        if (ea.dir !== dir) continue;
        const arr = bIdx.get(ea.sym); if (!arr) continue;
        // gibt es ein B-Signal gleicher Richtung innerhalb +-30 Min?
        for (const eb of arr) {
          if (eb.dir !== dir) continue;
          if (Math.abs(eb.t - ea.t) > FENSTER_MS) continue;
          const spaet = eb.t >= ea.t ? eb : ea;
          if (spaet.fwd[lab] == null) continue;
          entries.push({ sym: spaet.sym, tag: spaet.tag, ex: spaet.fwd[lab] });
          break;
        }
      }
      const st = M.statistik(entries);
      if (st) paare.push(Object.assign({ det: dets[a], partner: dets[b], dir: dirName, hor: lab, bedingung: '-', wert: '-' }, st));
    }
  }
  L.paare = paare; L.paareGerechnet = gerechnet; L.paareUebersprungen = uebersprungen;
  fs.writeFileSync(f, JSON.stringify(L));
  console.log(iv + '/' + phase + ': ' + gerechnet + ' Paare gerechnet (' + uebersprungen + ' uebersprungen, Screening t>0,5 beidseitig), ' + paare.length + ' mit Daten');
  paare.sort((x, y) => y.tTag - x.tTag).slice(0, 8).forEach(p =>
    console.log('  ' + (p.det + '+' + p.partner).padEnd(36) + p.dir.padEnd(6) + p.hor.padEnd(4) + ' n=' + String(p.n).padStart(5) + ' Tage=' + String(p.nTage).padStart(3) + ' brutto ' + String(p.bruttoPp).padStart(7) + ' t(Tag) ' + p.tTag));
  return paare;
}
module.exports = { rechnePaare };
if (require.main === module) {
  const iv = process.argv[2], phase = process.argv[3] || 'entdeckung';
  rechnePaare(iv, phase);
}
