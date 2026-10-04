'use strict';
/* GRUENDE-TAFEL v2.1 (Auftrag Nr. 92, Schritt 2b, 04.10.2026) - die Tafel v2 nach den Entscheiden des PM aus der Abnahme:
 *   B1  bleibt (Zwilling mit Split-Zusatz, v2-panel.json);
 *   B2  ZURUECKGENOMMEN: die Namensprobe der Suchfirma (E6) verwirft wieder wie im vierten Lauf (als blosses Kennzeichen gab sie
 *       sieben falsche Firmen zurueck: ERB, VISI, VSR, WP, NTT, CHU, DOM);
 *   B3  bleibt, jetzt mit den 38 Handeintraegen der Fassung .../handeintraege-v2/v2 (neu BNK, CVO, OTIV, SGBK, CHU).
 * Gerechnet mit den Funktionen von tafel-v2.js (per require, unveraendert); tafel-v2.js und seine Ausgaben bleiben, wie sie sind.
 *
 * Gegenproben im Lauf:
 *   GP1  mit B2 an (und den 38 Eintraegen) = Tafel v2 (verschwundene-gruende-v2.json) in jeder Zeile ausser den 38 Handeintraegen;
 *   GP2  E6 verwerfend, ohne die fuenf neuen Eintraege = vierter Lauf (z4-gruende-neu.json) + B1 + die 33 alten Eintraege:
 *        jede Zeile in allen Feldern der Einstufung gleich dem vierten Lauf, ausser an den B1-Reihen (Zwilling nach B1 anders) und
 *        an den 33 Handeintraegen (dort Grund = Eintrag, Grund nach den Regeln = vierter Lauf bzw. B1).
 * KEIN Netz, NICHTS von E: (wie tafel-v2.js).
 *
 * Aufruf:  node tafel-v21.js
 * Schreibt: verschwundene-gruende-v21.json (die Tafel v2.1), v21-zahlen.json (Gegenproben, Abweichungen gegen v2, Totalverlust)
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var Z4 = path.join(G.HIER, 'zaehllauf4');
var Z3 = require('../zaehllauf4/z3.js');
var E = require('../zaehllauf4/t4-einstufen.js');
var LF = require('../zaehllauf4/lauf.js');
var A = require('../zaehllauf4/t4-auswerten.js');
var T2 = require('./tafel-v2.js');

var KENNUNG = 'datenfundament-2026-10-04/tafel-v2/v2.1';
var HAND = path.join(G.HIER, 'handeintraege-v2', 'handeintraege.json');
var NEU5 = ['BNK', 'CVO', 'OTIV', 'SGBK', 'CHU'];
var B_AN = { B1: 1, B2: 0, B3: 1 };

var ZIEL = __dirname;
for (var ai = 2; ai < process.argv.length; ai++) if (process.argv[ai] === '--ziel') ZIEL = process.argv[++ai];
function schreibe(name, obj) { var p = path.join(ZIEL, name); fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); return p; }

/** nachfolger_im_archiv (Auskunft) wie in tafel-v2.js: aus der Zeile des vierten Laufs, wo Regel und Nachfolger gleich sind. */
function nachfolgerImArchiv(u, a4) {
  if (u.regel === 'Z' || u.nachfolger_im_archiv === undefined || u.regel === 'H') return;
  if (a4.regel === u.regel && (a4.nachfolger || null) === (u.nachfolger || null) && a4.nachfolger_im_archiv !== undefined) u.nachfolger_im_archiv = a4.nachfolger_im_archiv;
  else u.nachfolger_im_archiv = null;
}

function main() {
  var V = G.json(path.join(Z4, 'z4-verschwundene.json'));
  var PV = G.json(path.join(__dirname, 'v2-panel.json'));
  var zuord4 = G.json(path.join(Z4, 'z4-edgar-zuordnung.json')).zuordnung || {};
  var zuord3 = G.json(path.join(Z3.Z3ORDNER, 'z3-edgar-zuordnung.json')).zuordnung || {};
  var L4 = G.json(path.join(Z4, 'z4-gruende-neu.json')), l4 = {};
  L4.reihen.forEach(function (x) { l4[x.reihe] = x; });
  var TV2 = G.json(path.join(__dirname, 'verschwundene-gruende-v2.json')), v2 = {};
  TV2.reihen.forEach(function (x) { v2[x.reihe] = x; });
  var PK = G.json(path.join(Z3.P2, 't4-panelklasse.json'));
  var HJ = G.json(HAND), hand38 = {}, hand33 = {};
  if (HJ.kennung !== 'datenfundament-2026-10-04/handeintraege-v2/v2') throw new Error('Handeintraege: Kennung ' + HJ.kennung);
  HJ.eintraege.forEach(function (h) { hand38[h.reihe] = h; if (NEU5.indexOf(h.reihe) === -1) hand33[h.reihe] = h; });
  var ED = require('../zaehllauf4/t4-edgar.js');
  var hatBalken = {};   // NICHT von E: - wie tafel-v2.js
  var bd = E.bigdataFunde(), lebendAb = E.ms(V.lebendAb);
  var text = LF.textLeser(), bedarf = {};
  var O = Object.assign({}, E.ALLE_AN, { text: text, bedarf: bedarf });

  var FELDER_GP = ['grund', 'datum', 'quelle', 'beleg', 'regel', 'preis_je_aktie', 'nachfolger', 'zwilling', 'doppelt', 'cik', 'firma', 'zuordnungsweg', 'sic', 'letzter_balken',
    'letzter_kurs_archiv', 'letzter_kurs_roh', 'letzter_kurs_roh_quelle', 'aufschlag_pp', 'signale', 'namensprobe', 'zweit', 'wortlaut', 'kuerzel_neu_vergeben', 'belegtext'];
  var Z = { reihen: V.reihen.length, offen: [], textbedarf: 0, handeintraege: HJ.eintraege.length, hand33: Object.keys(hand33).length, handOhneReihe: [],
    gp1: { verglichen: 0, gleich: 0, anders: [], handZeilenGleich: 0, handZeilenAnders: [] },
    gp2: { gleich: 0, nurB1: [], nurHand: [], unerklaert: [], handNachRegelnWieLauf4: 0, handNachRegelnAnders: [] },
    nurNeu5: { anders: [], gleich: 0 } };
  HJ.eintraege.forEach(function (h) { if (!V.reihen.some(function (R) { return R.reihe === h.reihe; })) Z.handOhneReihe.push(h.reihe); });
  function feldDiff(a, b, felder) { return felder.filter(function (f) { return JSON.stringify(a[f] === undefined ? null : a[f]) !== JSON.stringify(b[f] === undefined ? null : b[f]); }); }

  var tafel = [], arbeit = [];
  V.reihen.forEach(function (R0) {
    var z4 = zuord4[R0.reihe];
    if (!z4 || !z4.fertig) { Z.offen.push(R0.reihe); return; }
    var von = G.tagPlus(R0.letzterBalken, -E.VOR), bis = G.tagPlus(R0.letzterBalken, E.NACH);
    function lade(zz) {
      if (!zz || !zz.cik) return null;
      var S0 = ED.lokal(zz.cik, von, bis).S;
      if (!S0) return undefined;
      return zz.zweit ? E.vereinige(S0, ED.lokal(zz.zweit.cik, von, bis).S) : S0;
    }
    var z3 = zuord3[R0.reihe], b2greift = T2.zuordnungB2(z4, z3, 1) !== z4;
    var S4 = lade(z4), S3 = b2greift ? lade(z3) : S4;
    if (S4 === undefined || S3 === undefined) { Z.offen.push(R0.reihe); return; }
    var c = { pv: PV.je[R0.reihe], z4: z4, z3: z3, S4: S4, S3: S3, hand: hand38, hatBalken: hatBalken, lebendAb: lebendAb, bd: bd, O: O };
    var c33 = Object.assign({}, c, { hand: hand33 });
    var a4 = l4[R0.reihe];
    var u = T2.stufeV2(R0, B_AN, c);
    var g1 = T2.stufeV2(R0, { B1: 1, B2: 1, B3: 1 }, c);
    var g2 = T2.stufeV2(R0, B_AN, c33);
    var nurB1 = T2.stufeV2(R0, { B1: 1, B2: 0, B3: 0 }, c);
    [u, g1].forEach(function (x) { nachfolgerImArchiv(x, a4); });
    var k = PK.je[R0.reihe], k123 = !!(k && k.k123 > 0);
    var panel = R0.panel ? { reihe: R0.panel.reihe, zeilen: R0.panel.zeilen, bis: R0.panel.bis } : null;
    u.panel = panel; g1.panel = panel;

    /* GP1: B2 an = Tafel v2 (ganze Zeile der Tafel), ausser an den 38 Handeintraegen */
    var zg1 = T2.tafelZeile(g1, k123), alt = v2[R0.reihe], gleich1 = JSON.stringify(zg1) === JSON.stringify(alt);
    if (hand38[R0.reihe]) { if (gleich1) Z.gp1.handZeilenGleich++; else Z.gp1.handZeilenAnders.push(R0.reihe); }
    else { Z.gp1.verglichen++; if (gleich1) Z.gp1.gleich++; else Z.gp1.anders.push(R0.reihe + ' [' + feldDiff(zg1, alt || {}, Object.keys(zg1)).join(',') + ']'); }

    /* GP2: E6 verwirft, 33 alte Eintraege = vierter Lauf + B1 + 33 */
    var d2 = feldDiff(g2, a4, FELDER_GP), b1Reihe = !!(PV.je[R0.reihe] && PV.je[R0.reihe].zwillingB1 !== PV.je[R0.reihe].zwilling);
    if (!d2.length) Z.gp2.gleich++;
    else if (hand33[R0.reihe]) {
      Z.gp2.nurHand.push(R0.reihe);
      var nr = g2.handeintrag.nachRegeln, soll = b1Reihe ? nurB1 : a4;
      if (nr.grund === soll.grund && nr.beleg === soll.beleg && nr.regel === soll.regel) Z.gp2.handNachRegelnWieLauf4++; else Z.gp2.handNachRegelnAnders.push(R0.reihe);
    } else if (b1Reihe && feldDiff(g2, nurB1, FELDER_GP).length === 0) Z.gp2.nurB1.push(R0.reihe + ' [' + d2.join(',') + ']');
    else Z.gp2.unerklaert.push(R0.reihe + ' [' + d2.join(',') + ']');
    if (hand33[R0.reihe] && !d2.length) { Z.gp2.handNachRegelnWieLauf4++; }

    /* v2.1 gegen GP2: Unterschied nur an den fuenf neuen Eintraegen */
    if (feldDiff(u, g2, FELDER_GP).length) Z.nurNeu5.anders.push(R0.reihe); else Z.nurNeu5.gleich++;

    if (z4.e6betroffen && u.e6_name_passt === undefined) u.e6_name_passt = null;
    tafel.push(T2.tafelZeile(u, k123));
    arbeit.push({ reihe: R0.reihe, k: k123, v21: u.grund, v2: alt ? alt.grund : null, lauf4: a4.grund, hand: hand38[R0.reihe] ? (NEU5.indexOf(R0.reihe) !== -1 ? 'neu' : 'alt') : null,
      e6: !!z4.e6betroffen, b2greift: b2greift, firmaV21: u.firma || null, firmaV2: alt ? alt.firma : null, belegV21: u.beleg, belegV2: alt ? alt.beleg : null });
  });
  Z.textbedarf = Object.keys(bedarf).length;

  /* ---------- Abweichungen gegen die Tafel v2 und den vierten Lauf; Totalverlust ---------- */
  var abw = { grundAnders: [], nurBelegAnders: [], uebergaenge: {} };
  arbeit.forEach(function (x) {
    var ursache = x.hand === 'neu' ? 'neuer Handeintrag' : (x.e6 && x.b2greift) ? 'B2 zurueckgenommen' : 'sonst';
    if (x.v21 !== x.v2) {
      abw.grundAnders.push({ reihe: x.reihe, v2: x.v2, v21: x.v21, ursache: ursache, klasse123: x.k ? 1 : 0, firmaV2: x.firmaV2, firmaV21: x.firmaV21 });
      var ue = x.v2 + ' -> ' + x.v21; abw.uebergaenge[ue] = (abw.uebergaenge[ue] || 0) + 1;
    } else if (x.belegV21 !== x.belegV2) abw.nurBelegAnders.push(x.reihe + ' (' + x.belegV2 + ' -> ' + x.belegV21 + ', ' + ursache + ')');
  });
  var tvZ = {};
  [['haupt', A.HAUPT], ['streng', A.STRENG]].forEach(function (p) {
    var l = p[1], drin = arbeit.filter(function (x) { return A.tvIn(x.v21, l); });
    function vgl(feld) {
      var alt = arbeit.filter(function (x) { return A.tvIn(x[feld], l); });
      return { bestand: alt.length, heraus: alt.filter(function (x) { return !A.tvIn(x.v21, l); }).map(function (x) { return x.reihe + ' (' + x.v21 + (x.k ? ', K1-3' : '') + ')'; }),
        hinein: drin.filter(function (x) { return !A.tvIn(x[feld], l); }).map(function (x) { return x.reihe + ' (' + x[feld] + ' -> ' + x.v21 + (x.k ? ', K1-3' : '') + ')'; }) };
    }
    tvZ[p[0]] = { liste: l, bestand: drin.length, klasse123: drin.filter(function (x) { return x.k; }).map(function (x) { return x.reihe; }).sort(), gegenV2: vgl('v2'), gegenLauf4: vgl('lauf4') };
  });
  var zaehler = {}, belege = {}, regeln = {};
  tafel.forEach(function (u) { zaehler[u.grund] = (zaehler[u.grund] || 0) + 1; belege[u.beleg] = (belege[u.beleg] || 0) + 1; regeln[u.regel] = (regeln[u.regel] || 0) + 1; });

  var out = { kennung: KENNUNG, stand: new Date().toISOString(),
    grundlage: { lauf4: 'datenfundament-2026-10-04/zaehllauf4 (Commits 02ac0b5, f97dff5)', tafelV2: TV2.kennung + ' (cb3a24d)', handeintraege: HJ.kennung + ' (e7757ce)', panel: PV.panel, zwillinge: 'tafel-v2/v2-panel.json' },
    regeln: Object.assign({}, E.REGELN, { B1: 'Zwilling: (b) zaehlt ungleiche Tage mit, wenn das Verhaeltnis der rohen Schluesse dort fest ist (relative Abweichung <= 1e-6) - Split dazwischen',
      B2: 'ZURUECKGENOMMEN (v2.1): die Namensprobe der Suchfirma (E6) verwirft wie im vierten Lauf; die zu Unrecht verworfenen richtigen Firmen stehen als Handeintraege',
      B3: 'Handeintraege (Fassung v2, 38) gehen allen Regeln vor (Regel H)', B4: 'vollzogene Mantel-Fusionen bleiben SPAC-Ende (kein Eingriff)', B5: 'neue Datei; alte Tafel, Lauf 4, Tafel v2 und Handeintraege unveraendert' }),
    totalverlust: { haupt: A.HAUPT, streng: A.STRENG }, anker: 'letzter Minutentag', zaehler: zaehler, belegarten: belege, jeRegel: regeln, n: tafel.length, reihen: tafel };
  schreibe('verschwundene-gruende-v21.json', out);
  schreibe('v21-zahlen.json', { kennung: KENNUNG + ' (Zahlen)', stand: out.stand, lauf: Z, abweichungenGegenV2: abw, totalverlust: tvZ, zaehler: zaehler, jeRegel: regeln, zaehlerV2: TV2.zaehler, zaehlerLauf4: L4.zaehler });
  console.log('Tafel v2.1:', tafel.length, 'Zeilen, offen', Z.offen.length, '| Textbedarf', Z.textbedarf, '| Hand', Z.handeintraege, 'ohne Reihe', Z.handOhneReihe.length);
  console.log('GP1 B2 an = Tafel v2 ohne die 38:', Z.gp1.gleich, 'von', Z.gp1.verglichen, '| anders', Z.gp1.anders.length, '| Handzeilen gleich', Z.gp1.handZeilenGleich, 'anders', Z.gp1.handZeilenAnders.join(' '));
  console.log('GP2 Lauf 4 + B1 + 33:', Z.gp2.gleich, 'gleich, nur B1', Z.gp2.nurB1.length, ', nur Hand', Z.gp2.nurHand.length, ', unerklaert', Z.gp2.unerklaert.length, '| Hand nach Regeln wie Lauf 4/B1', Z.gp2.handNachRegelnWieLauf4, 'anders', Z.gp2.handNachRegelnAnders.join(' '));
  console.log('v2.1 gegen GP2 anders nur an:', Z.nurNeu5.anders.join(' '));
  console.log('Grund anders als v2:', abw.grundAnders.length, abw.grundAnders.map(function (x) { return x.reihe + '(' + x.v2 + '->' + x.v21 + ',' + x.ursache + ')'; }).join(' '));
  console.log('Haupt', tvZ.haupt.bestand, 'K1-3', tvZ.haupt.klasse123.join(' '), '| streng', tvZ.streng.bestand, 'K1-3', tvZ.streng.klasse123.join(' '));
  console.log('Grund:', JSON.stringify(zaehler));
}

module.exports = { KENNUNG: KENNUNG, B_AN: B_AN, NEU5: NEU5, nachfolgerImArchiv: nachfolgerImArchiv };
if (require.main === module) main();
