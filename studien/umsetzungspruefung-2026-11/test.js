'use strict';
/* Kunstdaten-Tests zu pruefe.js (Auftrag Nr. 97): je Kriterium ein bestandener Fall UND ein absichtlich verfehlter
 * (Gegenprobe: jede Pruefung muss anschlagen), dazu "Daten fehlen" -> nie bestanden.
 *   node studien/umsetzungspruefung-2026-11/test.js */
const MH = require('../../mfhandel.js');
const P = require('./pruefe.js');

let ok = 0, nok = 0;
function soll(name, bed) { if (bed) ok++; else { nok++; console.log('ROT  ' + name); } }

/* Kalender: 460 Werktage ab 02.01.2025; Universum 120 Werte, Staerke steigt mit der Nummer. */
const ht = [];
for (let t = '2025-01-02'; ht.length < 460; t = MH.tagPlus(t, 1)) if (MH.istWerktag(t)) ht.push(t);
const SYMS = []; for (let s = 0; s < 120; s++) SYMS.push('S' + String(s).padStart(3, '0'));
const E = 350, E2 = E + 63, ENDE = 440;
function preis(s, i) { return 100 * (1 + (Number(s.slice(1)) / 1000) * i / 300); }

function bau(m) {
  m = m || {};
  const serien = {};
  SYMS.forEach(s => { serien[s] = ht.slice(0, ENDE + 1).map((tag, i) => [MH.nyZeit(tag, 9, 30), preis(s, i), 2e6, 0, 0, preis(s, i)]); });
  const opens = {};
  function oeff(s, i) { return s === 'SPY' ? 500 : preis(s, i) * 1.001; }
  const ziel = SYMS.slice(-12).reverse();                        // S119 ... S108 = Rangfolge
  const kaufT = MH.nyZeit(ht[E], 9, m.uhr || 40);
  let kauf = ziel.slice();
  if (m.p1Tausch) kauf = kauf.slice(0, 9).concat(['S000', 'S001', 'S002']);
  if (m.p1Reihe) kauf = [kauf[1], kauf[0]].concat(kauf.slice(2));
  const buch = { name: 'momentum', start: 100000, cash: 100000, positionen: [], trades: [], massnahmen: [], korbVerlauf: [{ t: kaufT, ziel: 12 }] };
  kauf.forEach(function (s, j) {
    let kurs = oeff(s, E);
    if (m.p2 && j === 3) kurs *= 1.006;                            // 60 Bp ueber der Eroeffnung
    if (m.hoch) kurs *= 1.004;                                     // alle 40 Bp teurer
    let stueck = Math.round(100000 / 12 / kurs * 10000) / 10000;
    if (m.p6 && j === 11) stueck = Math.round(stueck * 0.01 * 10000) / 10000;   // Kleinstbestand
    const k = (m.p3 && j === 5) ? 0.003 : 0.002;
    buch.cash -= stueck * kurs * (1 + k);
    buch.positionen.push({ sym: s, stueck: stueck, einstand: kurs * (1 + k), seit: kaufT });
    buch.trades.push({ t: kaufT, sym: s, art: 'kauf', stueck: stueck, kurs: kurs });
  });
  /* Ausschuettung S119 am Tag E+10, Split 2:1 S118 am Tag E+20 - Quelle und Buchung */
  const mass = { S119: [{ _art: 'cash_dividends', ex_date: ht[E + 10], rate: 1, id: 'd1' }],
    S118: [{ _art: 'forward_splits', ex_date: ht[E + 20], new_rate: 2, old_rate: 1, id: 's1' }] };
  const p119 = buch.positionen.find(p => p.sym === 'S119');
  if (p119 && !m.p4) { buch.cash += p119.stueck; buch.massnahmen.push({ sym: 'S119', art: 'div', t: MH.nyZeit(ht[E + 10], 9, 30), am: MH.nyZeit(ht[E + 10], 12, 0), betrag: 1, stueck: p119.stueck, summe: p119.stueck }); }
  const p118 = buch.positionen.find(p => p.sym === 'S118');
  if (p118 && !m.p5) {
    buch.massnahmen.push({ sym: 'S118', art: 'split', t: MH.nyZeit(ht[E + 20], 9, 30), am: MH.nyZeit(ht[E + 20], 12, 0), zaehler: 2, nenner: 1,
      stueckAlt: p118.stueck, einstandAlt: p118.einstand, stueckNeu: p118.stueck * 2, einstandNeu: p118.einstand / 2 });
    p118.stueck *= 2; p118.einstand /= 2;
  }
  /* zweite Umschichtung: S108 verkauft und neu gekauft (Zeitpunkt-Pruefung (a)) */
  const tag2 = m.spaet ? E2 + 1 : E2, t2 = MH.nyZeit(ht[tag2], 9, 45);
  const p108 = buch.positionen.find(p => p.sym === 'S108');
  if (p108) {
    const k2 = oeff('S108', tag2), erl = p108.stueck * k2 * 0.998;
    buch.cash += erl;
    buch.trades.push({ t: t2, sym: 'S108', art: 'verkauf', stueck: p108.stueck, kurs: k2, pnl: Math.round((erl - p108.stueck * p108.einstand) * 100) / 100 });
    buch.positionen.splice(buch.positionen.indexOf(p108), 1);
    const st = Math.floor(buch.cash / (k2 * 1.002) * 10000) / 10000;
    buch.cash -= st * k2 * 1.002;
    buch.positionen.push({ sym: 'S108', stueck: st, einstand: k2 * 1.002, seit: t2 });
    buch.trades.push({ t: t2, sym: 'S108', art: 'kauf', stueck: st, kurs: k2 });
    buch.korbVerlauf.push({ t: t2, ziel: 12 });
  }
  /* Tagespunkte: Schluss je Tag ab E, buchT = spyT */
  const verlauf = [];
  for (let i = E; i <= ENDE; i++) {
    const t = MH.nyZeit(ht[i], 9, 30);
    verlauf.push({ t: MH.nyZeit(ht[i], 16, 20), tag: ht[i], momentum: 100000, spy: i === E ? 500 * (m.p7anfang ? 1.002 : 1.0001) : 500, buchT: t, spyT: (m.p7 && i === E + 3) ? t + 1 : t });
  }
  const q = {
    universum: SYMS,
    archivTag: s => (m.ohneArchiv ? null : serien[s] || null),
    eroeffnung: (s, tag) => { if (m.ohneMinuten) return null; const i = ht.indexOf(tag); return i >= 0 ? oeff(s, i) : null; },
    handelstage: () => ht,
    massnahmen: s => (m.ohneMassnahmen ? null : mass[s] || []),
    archivEnde: ht[ENDE]
  };
  if (m.uhr) buch.trades.forEach(t => { if (MH.nyTag(t.t) === ht[E]) t.t = MH.nyZeit(ht[E], 9, m.uhr); });
  return { d: { mfBuch: buch, mfVerlauf: verlauf }, q: q };
}
function lauf(m) { const b = bau(m); return P.pruefe(b.d, b.q); }
const U = (e, k) => e.umschichtungen[k || 0];

/* Grundfall: alles bestanden */
const g = lauf();
soll('zwei Umschichtungen erkannt', g.umschichtungen.length === 2);
['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'].forEach(n => soll('Grundfall ' + n + ' bestanden (' + U(g)[n].urteil + ')', U(g)[n].urteil === P.BESTANDEN));
soll('Grundfall Hochrechnung bestanden', U(g).hochrechnung.urteil === P.BESTANDEN);
soll('erste Umschichtung: Zeitpunkt (a) nicht prüfbar', U(g).zeitpunkt.urteil === P.NP);
soll('zweite Umschichtung: Zeitpunkt bestanden', U(g, 1).zeitpunkt.urteil === P.BESTANDEN);
soll('zweite Umschichtung: Verkauf mit 20 Bp erkannt', Math.abs(U(g, 1).P3.faelle[0].bp - 20) < 0.5);
soll('Grundfall: P4 ein Fall gebucht', U(g).P4.zahl.faelle === 1 && U(g).P4.zahl.ungebucht === 0);
soll('Grundfall: P5 ein Split gebucht', U(g).P5.zahl.faelle === 1 && U(g).P5.zahl.ungebucht === 0);
soll('Grundfall: P1 Stichtag = Handelstag vor E', U(g).stichtag === ht[E - 1]);
soll('Grundfall: kein Halt', g.uRegel.halt === false);

/* Gegenproben: jede Pruefung schlaegt an */
const V = P.VERFEHLT;
soll('P1 drei Namen getauscht -> verfehlt', U(lauf({ p1Tausch: true })).P1.urteil === V);
soll('P1 Spitze vertauscht -> verfehlt', U(lauf({ p1Reihe: true })).P1.urteil === V);
soll('P2 60 Bp -> verfehlt', U(lauf({ p2: true })).P2.urteil === V);
soll('P3 30 Bp gebucht -> verfehlt', U(lauf({ p3: true })).P3.urteil === V);
soll('P4 Ausschüttung nicht gebucht -> verfehlt', U(lauf({ p4: true })).P4.urteil === V);
const e5 = lauf({ p5: true });
soll('P5 Split nicht gebucht -> verfehlt', U(e5).P5.urteil === V);
soll('P5 verfehlt -> U-Regel Halt', e5.uRegel.halt === true);
soll('P6 Kleinstbestand -> verfehlt', U(lauf({ p6: true })).P6.urteil === V);
soll('P7 buchT ≠ spyT -> verfehlt', U(lauf({ p7: true })).P7.urteil === V);
soll('P7 Anfangsstand 0,2 Pp -> verfehlt', U(lauf({ p7anfang: true })).P7.urteil === V);
soll('Zeitpunkt 09:31 -> verfehlt', U(lauf({ uhr: 31 })).zeitpunkt.urteil === V);
soll('Zeitpunkt einen Tag zu spät -> verfehlt', U(lauf({ spaet: true }), 1).zeitpunkt.urteil === V);
const eh = lauf({ hoch: true });
soll('Hochrechnung 40 Bp × Umsatz × 4 > 1 Pp -> verfehlt', U(eh).hochrechnung.urteil === V && eh.uRegel.halt === true);

/* U-Regel: P1/P2 zweimal hintereinander; einmal reicht nicht */
function u(p1, p2) { return { tag: 'x', P1: { urteil: p1 }, P2: { urteil: p2 }, P5: { urteil: P.BESTANDEN }, hochrechnung: { urteil: P.BESTANDEN }, zeitpunkt: { urteil: P.BESTANDEN } }; }
soll('U-Regel: P1 einmal verfehlt -> kein Halt', P.uRegel([u(V, P.BESTANDEN), u(P.BESTANDEN, P.BESTANDEN)]).halt === false);
soll('U-Regel: P1 dann P2 verfehlt -> Halt', P.uRegel([u(V, P.BESTANDEN), u(P.BESTANDEN, V)]).halt === true);
soll('U-Regel: nicht prüfbar löst keinen Halt aus', P.uRegel([u(P.NP, P.NP), u(P.NP, P.NP)]).halt === false);

/* Daten fehlen: nie bestanden */
const n1 = U(lauf({ ohneArchiv: true }));
soll('ohne Archiv: P1 nicht prüfbar', n1.P1.urteil === P.NP);
const n2 = U(lauf({ ohneMinuten: true }));
soll('ohne Minuten: P2 nicht prüfbar', n2.P2.urteil === P.NP);
soll('ohne Minuten: P7 nicht prüfbar', n2.P7.urteil === P.NP);
soll('ohne Minuten: Hochrechnung nicht prüfbar', n2.hochrechnung.urteil === P.NP);
const n3 = U(lauf({ ohneMassnahmen: true }));
soll('ohne Maßnahmen-Datei: P4 nicht prüfbar', n3.P4.urteil === P.NP);
soll('ohne Maßnahmen-Datei: P5 nicht prüfbar', n3.P5.urteil === P.NP);
const n4 = P.pruefe({ mfBuch: { trades: [], positionen: [], cash: 0 }, mfVerlauf: [] }, bau().q);
soll('ohne Umschichtung: keine Zeile, kein Halt', n4.umschichtungen.length === 0 && n4.uRegel.halt === false);
const alt = bau(); alt.d.mfVerlauf.forEach(p => { delete p.buchT; delete p.spyT; });
soll('Punkte ohne buchT/spyT: P7 nicht prüfbar', U(P.pruefe(alt.d, alt.q)).P7.urteil === P.NP);
[n1, n2, n3].forEach((x, i) => soll('Daten fehlen ' + i + ': kein Kriterium "bestanden" für die betroffene Prüfung',
  [x.P1, x.P2, x.P4, x.P5, x.P7].filter((k, j) => (i === 0 && j === 0) || (i === 1 && (j === 1 || j === 4)) || (i === 2 && (j === 2 || j === 3))).every(k => k.urteil !== P.BESTANDEN)));

console.log((nok ? 'ROT' : 'GRÜN') + ': ' + ok + ' von ' + (ok + nok) + ' Zusicherungen');
process.exitCode = nok ? 1 : 0;
