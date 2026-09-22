/* Vorpruefung nach VORREGISTRIERUNG-KOMBINATION.md §6 in der Fassung von Nachtrag 3 (IC-Test): V1 (Kosten, Information), V2 (IC-Aufloesung).
 * Liest NUR se-Werte der Feldzellen (keine IC-Mittelwerte werden ausgegeben — die Registrierung geschieht vorher).
 *   node pm-vorpruefung-ic.js [zellenordner] [ausgabe.json] */
const fs = require('fs'), path = require('path');
const ORD = process.argv[2] || 'C:/Users/Wilhe/Downloads/Stock-Dashboard/studien/mehrfaktor-2026-09-22/zellen';
const AUS = process.argv[3] || null;
const SIGNALE = ['momentum', 'schwankung', 'bewertung', 'ertragskraft', 'investition', 'sue', 'fue'];
const MDE_FAKTOR = 2.8016, KOSTEN_JE_UMSCHLAG = 0.080, ERWARTUNG_IC = [0.02, 0.03], ERWARTUNG_DEZIL = [0.3, 0.6], IC_BODEN = { se: 0.0035, mde80: 0.010 };
const median = a => { const s = a.slice().sort((x, y) => x - y), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; };
const rows = [], seDezil = [], seIc = [], umschlag = [];
for (const f of SIGNALE) {
  const z = JSON.parse(fs.readFileSync(path.join(ORD, f + '.json'), 'utf8')), e = z.einzelmessung, n = z.nullpunkt;
  const vier = n.orakel.bestanden && n.placebo.symbole.bestanden && n.placebo.zufall.bestanden && n.leck.bestanden;
  if (!e.ic) { console.error(f + ': Zelle ohne IC (Maschine v1?) — Vorpruefung IC nicht moeglich'); process.exit(1); }
  seDezil.push(e.dezilUni.netto.se); seIc.push(e.ic.se); umschlag.push(e.umschlag.dezil);
  rows.push({ feld: f, kennung: z.kennung, tafel: z.tafelKennung || null, nullpunkt: vier, seDezil: e.dezilUni.netto.se, mde80Dezil: e.dezilUni.netto.mde80, seIc: e.ic.se, mde80Ic: e.ic.mde80, nIc: e.ic.n, umschlag: e.umschlag.dezil });
}
const k = SIGNALE.length, umschlagMittel = umschlag.reduce((a, b) => a + b, 0) / k, kosten = umschlagMittel * KOSTEN_JE_UMSCHLAG;
const mdeDezil = MDE_FAKTOR * median(seDezil), mdeIc = MDE_FAKTOR * median(seIc);
const V1 = { kanteHalbe: [ERWARTUNG_DEZIL[0] / 2, ERWARTUNG_DEZIL[1] / 2], kosten, bestanden: ERWARTUNG_DEZIL[0] / 2 > kosten, hinweis: 'Information ueber die Handelbarkeit des Dezils; kein Tor fuer den IC-Test' };
const V2 = { erwarteterIc: ERWARTUNG_IC, mde80IcSchaetzung: mdeIc, faktorZumBoden: median(seIc) / IC_BODEN.se, bestandenObereGrenze: ERWARTUNG_IC[1] >= mdeIc, bestandenUntereGrenze: ERWARTUNG_IC[0] >= mdeIc };
console.log('| Feld | Kennung | Tafel | Nullpunkt (4) | se Dezil | MDE80 Dezil | se IC | MDE80 IC | n IC | Umschlag |');
console.log('|---|---|---|---|---|---|---|---|---|---|');
rows.forEach(r => console.log('| ' + r.feld + ' | ' + r.kennung + ' | ' + (r.tafel || '-') + ' | ' + (r.nullpunkt ? 'ok' : 'FÄLLT') + ' | ' + r.seDezil.toFixed(3) + ' | ' + r.mde80Dezil.toFixed(2) + ' | ' + r.seIc.toFixed(4) + ' | ' + r.mde80Ic.toFixed(4) + ' | ' + r.nIc + ' | ' + (100 * r.umschlag).toFixed(1) + ' % |'));
console.log('\nV1 Kosten: Umschlag ' + (100 * umschlagMittel).toFixed(1) + ' % x 0,080 = ' + kosten.toFixed(3) + ' Pp; Kante/2 ' + V1.kanteHalbe.join('–') + ' => ' + (V1.bestanden ? 'BESTANDEN' : 'GEFALLEN') + ' (Information, kein Tor)');
console.log('V2 IC: Median se(IC) ' + median(seIc).toFixed(4) + ' (Faktor ' + V2.faktorZumBoden.toFixed(1) + ' zum Kunstfeld-Boden 0,0035) => MDE80(IC)-Schaetzung ' + mdeIc.toFixed(4) + '; erwarteter IC ' + ERWARTUNG_IC.join('–') + ' => obere Grenze ' + (V2.bestandenObereGrenze ? 'BESTANDEN' : 'GEFALLEN') + ', untere Grenze ' + (V2.bestandenUntereGrenze ? 'bestanden' : 'gefallen'));
console.log('Dezil (Diagnose): Median se ' + median(seDezil).toFixed(3) + ' => MDE80 ' + mdeDezil.toFixed(2) + ' Pp');
const out = { kennung: 'mehrfaktor-2026-09-22/vorpruefung/v1', stand: new Date().toISOString(), zellen: ORD, felder: rows, erwartungIc: ERWARTUNG_IC, erwartungDezil: ERWARTUNG_DEZIL, icBoden: IC_BODEN, umschlagMittel, kosten, seIcMedian: median(seIc), seDezilMedian: median(seDezil), mde80IcSchaetzung: mdeIc, mde80DezilSchaetzung: mdeDezil, V1, V2, hinweis: 'Nur se-Werte der Feldzellen; keine IC-Mittelwerte eines echten Feldes werden hier ausgewertet.' };
if (AUS) { fs.writeFileSync(AUS, JSON.stringify(out, null, 1)); console.log('geschrieben: ' + AUS); }
