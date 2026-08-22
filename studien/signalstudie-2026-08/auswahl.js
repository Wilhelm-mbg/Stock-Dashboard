/* AUSWAHLREGEL der Signalstudie - exakt wie in REGISTRIERUNG.md festgeschrieben.
 * Liest die Entdeckungslaeufe, waehlt die Kandidaten fuer die Bestaetigung und schreibt
 * sie als feste Liste. Danach wird die Bestaetigungsmenge GENAU EINMAL angefasst.
 *
 * Regel: 5 beste Einzelsignale (Signal x Richtung x Horizont) nach t(Tag),
 *        5 beste Bedingungs-Konfigurationen, 3 beste Paare,
 *        plus die belegten Kanten als vorab benannte Referenz.
 * Zusaetzliche Mindestanforderungen, damit kein Zufallsfund auf 12 Signalen in die
 * Bestaetigung rutscht: n >= 100 Signale, nTage >= 20, nSym >= 15 (Intraday);
 * fuer 60m: n >= 60, nTage >= 60, nSym >= 15.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const OUT = path.join(__dirname, 'ergebnisse');

const BELEGT = ['rsi2seit', 'kapitulation', 'momentum', 'drift'];   // vorab benannt, keine Scan-Funde
/* Die Referenz ist die VALIDIERTE Konfiguration, nicht die beste Richtung - sonst waere sie
 * selbst ein Scan-Fund. rsi2seit: RSI2 ueberverkauft im Seitwaertskanal -> Long. Kapitulation:
 * Long. Momentum: Long (Buch kauft die Staerksten). Drift: beide Seiten (Ueberraschung +/-). */
const BELEGT_DIR = { rsi2seit: 'long', kapitulation: 'long', momentum: 'long', drift: null };
const MIN = { A: { n: 100, nTage: 20, nSym: 15 }, B: { n: 60, nTage: 60, nSym: 15 } };

function lade(iv, phase) {
  const f = path.join(OUT, 'lauf-' + iv + '-' + phase + '.json');
  return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : null;
}

function waehle(iv) {
  const L = lade(iv, 'entdeckung');
  if (!L) return null;
  const tier = iv === '60m' ? 'B' : 'A';
  const m = MIN[tier];
  const ok = z => z.n >= m.n && z.nTage >= m.nTage && z.nSym >= m.nSym;
  const einzel = L.zeilen.filter(z => z.bedingung === '-' && ok(z) && BELEGT.indexOf(z.det) === -1)
    .sort((a, b) => b.tTag - a.tTag).slice(0, 5);
  const bedingt = L.zeilen.filter(z => z.bedingung !== '-' && ok(z) && BELEGT.indexOf(z.det) === -1)
    .sort((a, b) => b.tTag - a.tTag).slice(0, 5);
  const paare = (L.paare || []).filter(z => ok(z)).sort((a, b) => b.tTag - a.tTag).slice(0, 3);
  const referenz = L.zeilen.filter(z => z.bedingung === '-' && BELEGT.indexOf(z.det) !== -1 && (!BELEGT_DIR[z.det] || z.dir === BELEGT_DIR[z.det]))
    .sort((a, b) => b.tTag - a.tTag);
  // je belegte Kante nur die beste Richtung x Horizont
  const refSeen = new Set(), ref = [];
  for (const z of referenz) { if (refSeen.has(z.det)) continue; refSeen.add(z.det); ref.push(z); }
  return {
    iv, tier, cutoff: L.cutoff, testsEntdeckung: L.tests, paareGerechnet: (L.paare || []).length,
    kandidaten: { einzel, bedingt, paare, referenz: ref },
    anzahl: einzel.length + bedingt.length + paare.length + ref.length,
  };
}

function schluessel(z) {
  return z.det + '|' + z.dir + '|' + z.hor + (z.bedingung !== '-' ? '|' + z.bedingung + '=' + z.wert : '') + (z.partner ? '|+' + z.partner : '');
}

if (require.main === module) {
  const ivs = process.argv.slice(2).length ? process.argv.slice(2) : ['1m', '5m', '15m', '60m'];
  const alle = {};
  for (const iv of ivs) {
    const w = waehle(iv);
    if (!w) { console.log(iv + ': kein Entdeckungslauf vorhanden'); continue; }
    alle[iv] = w;
    console.log('\n=== ' + iv + ' (Tier ' + w.tier + ', ' + w.testsEntdeckung + ' Tests in der Entdeckung, ' + w.paareGerechnet + ' Paare) ===');
    const zeig = (titel, arr) => {
      console.log('  ' + titel + ':');
      arr.forEach(z => console.log('    ' + schluessel(z).padEnd(48) + ' n=' + String(z.n).padStart(5) + ' Tage=' + String(z.nTage).padStart(3) +
        ' brutto ' + String(z.bruttoPp).padStart(7) + ' t(Tag) ' + String(z.tTag).padStart(6) + ' MDE ' + z.mdeTagPp));
    };
    zeig('Einzelsignale (Top 5)', w.kandidaten.einzel);
    zeig('Mit Bedingung (Top 5)', w.kandidaten.bedingt);
    zeig('Paare (Top 3)', w.kandidaten.paare);
    zeig('Referenz: belegte Kanten', w.kandidaten.referenz);
    console.log('  -> ' + w.anzahl + ' Kandidaten in die Bestaetigung. Bonferroni-Schwelle dort: |t| ' +
      (w.anzahl ? (Math.sqrt(2) * inverf(1 - 0.05 / w.anzahl)).toFixed(2) : '-'));
  }
  fs.writeFileSync(path.join(OUT, 'kandidaten.json'), JSON.stringify(alle, null, 1));
  console.log('\nKandidatenliste festgeschrieben: ergebnisse/kandidaten.json');
}

// inverse Fehlerfunktion (Giles), fuer die Bonferroni-Schwelle
function inverf(x) {
  const a = 0.147; const ln = Math.log(1 - x * x); const t1 = 2 / (Math.PI * a) + ln / 2;
  return Math.sign(x) * Math.sqrt(Math.sqrt(t1 * t1 - ln / a) - t1);
}
module.exports = { waehle, schluessel, BELEGT, MIN };
