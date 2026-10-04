'use strict';
/* GRUENDE-TAFEL v2 (Auftrag Nr. 92, Schritt 2, 04.10.2026) - der Bau. Grundlage ist der vierte Zaehllauf (../zaehllauf4/,
 * abgenommen): dieselben Regeln (t4-einstufen.js per require, unveraendert), dieselbe Zuordnung, dieselben Meldungstexte,
 * derselbe rohe letzte Kurs (z4-verschwundene.json). Dazu die Entscheide des PM:
 *   B1  Zwilling mit dem Zusatz zu (b) (Verhaeltnis der rohen Schluesse fest -> Split dazwischen), aus v2-panel.json;
 *   B2  die Namensprobe der Suchfirma (E6) verwirft nicht mehr: betroffene Reihen nehmen die Firma, die ohne Verwerfung
 *       gewaehlt war (= Zuordnung des dritten Laufs, wie "ohne E6" in ../zaehllauf4/lauf.js); Kennzeichen e6_name_passt;
 *   B3  die Handeintraege (../handeintraege-v2/handeintraege.json) gehen allen Regeln vor.
 * B4, B5 wie in wiki/datenquellen.md (kein Eingriff; neue Datei).
 *
 * KEIN Netz: Auszuege nur ueber ED.lokal (Caches im Repo), Texte nur aus den Caches; fehlt etwas, wird es gezaehlt, nicht geholt.
 * NICHTS auf E:: die Karte "Kuerzel hat noch Balken" (hatBalkenKarte, liest E:) wird NICHT geladen - sie speist nur das
 * Auskunftsfeld nachfolger_im_archiv; das wird aus der Zeile des vierten Laufs uebernommen, wo Regel und Nachfolger gleich
 * sind, sonst null (gezaehlt).
 *
 * Gegenprobe im Lauf: B1-Zusatz, B2 und B3 aus -> jede Zeile wie ../zaehllauf4/z4-gruende-neu.json.
 *
 * Aufruf:  node tafel-v2.js            (nach v2-panel.js)
 * Schreibt: verschwundene-gruende-v2.json (die Tafel v2), v2-zahlen.json (Gegenprobe, Matrix, Totalverlust)
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var Z4 = path.join(G.HIER, 'zaehllauf4');
var Z3 = require('../zaehllauf4/z3.js');
var E = require('../zaehllauf4/t4-einstufen.js');
var LF = require('../zaehllauf4/lauf.js');
var A = require('../zaehllauf4/t4-auswerten.js');

var KENNUNG = 'datenfundament-2026-10-04/tafel-v2/v1';
var HAND = path.join(G.HIER, 'handeintraege-v2', 'handeintraege.json');
var B_AN = { B1: 1, B2: 1, B3: 1 };

var ZIEL = __dirname, ZWILLINGE = path.join(__dirname, 'v2-panel.json');   // --ziel / --zwillinge nur fuer Probelaeufe ausserhalb des Ordners
for (var ai = 2; ai < process.argv.length; ai++) { if (process.argv[ai] === '--ziel') ZIEL = process.argv[++ai]; else if (process.argv[ai] === '--zwillinge') ZWILLINGE = process.argv[++ai]; }
function schreibe(name, obj) { var p = path.join(ZIEL, name); fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); return p; }

/** Zwilling-Info der Reihe aus v2-panel.json, Form wie R.zwilling des vierten Laufs (t4-universum.js). b1 = false: ohne Zusatz. */
function zwillingInfo(p, b1) {
  if (!p) return null;
  var name = b1 ? p.zwillingB1 : p.zwilling;
  if (!name) return null;
  var k = (p.kandidaten || []).filter(function (x) { return x.name === name; })[0];
  var w = { ok: true, name: name, ende: p.bis, bGleich: k.bGleich, bTage: k.bTage, cTage: k.cTage, doppelte: k.doppelte, zeilen: p.zeilen };
  if (b1) { w.bGleichB1 = k.bGleichB1; w.b1Zusatz = k.bGleichB1 > k.bGleich ? 1 : 0; w.b1 = k.b1; }
  return w;
}

/** B2: e6_name_passt der Firma, die ohne Verwerfung gewaehlt ist. false = die Namensprobe des vierten Laufs hat genau diese
 *  CIK verworfen; true = sie hat sie geprueft und behalten; null = nicht geprueft. */
function e6NamePasst(z4, cik) {
  if (!z4 || !z4.e6betroffen || !cik) return null;
  var weg = [];
  if (z4.e6 && z4.e6.verworfen) weg.push(z4.e6.verworfen.cik);
  if (z4.e6durchgang1 && z4.e6durchgang1.verworfen) weg.push(z4.e6durchgang1.verworfen.cik);
  (z4.e6abgelehnt2 || []).forEach(function (x) { weg.push(x.cik); });
  if (weg.indexOf(cik) !== -1) return false;
  if (z4.cik === cik && (z4.e6 || z4.e6durchgang1)) return true;
  return null;
}

/** B3: Handeintrag ueber die Einstufung legen. */
function handAuflegen(u, h, R) {
  var regelGrund = { grund: u.grund, datum: u.datum, quelle: u.quelle, beleg: u.beleg, regel: u.regel, nachfolger: u.nachfolger || null };
  var v = Object.assign({}, u);
  v.grund = h.grund;
  v.datum = u.datum || h.anker;
  v.quelle = 'handeintrag-v2:' + h.quelle;
  v.beleg = 'handeintrag';
  v.regel = 'H';
  v.preis_je_aktie = h.grund === u.grund ? u.preis_je_aktie : null;
  v.aufschlag_pp = h.grund === u.grund ? u.aufschlag_pp : null;
  v.nachfolger = h.nachfolger || null;
  v.nachfolger_im_archiv = (h.nachfolger && h.nachfolger === u.nachfolger) ? u.nachfolger_im_archiv : null;
  v.handeintrag = { quelle: h.quelle, beleg: h.beleg, anmerkung: h.anmerkung || null, nachfolger: h.nachfolger || null, anker: h.anker, ankerPasst: h.anker === R.letzterBalken, nachRegeln: regelGrund };
  return v;
}

/** B2: welche Zuordnung gilt. Greift nur bei einer von E6 betroffenen Reihe mit einer Zuordnung des dritten Laufs. */
function zuordnungB2(z4, z3, an) { return (an && z4 && z4.e6betroffen && z3 && z3 !== z4) ? z3 : z4; }

/** Die Einstufung einer Reihe mit den Schaltern b = { B1, B2, B3 }.
 *  c = { pv (Eintrag aus v2-panel.json), z4, z3, S4, S3 (Auszuege zu z4 / z3), hand (Karte), hatBalken, lebendAb, bd, O }. */
function stufeV2(R0, b, c) {
  var R = Object.assign({}, R0, { zwilling: b.B1 ? zwillingInfo(c.pv, true) : R0.zwilling });
  var zz = zuordnungB2(c.z4, c.z3, b.B2), SS = zz === c.z4 ? c.S4 : c.S3;
  var u = E.stufeEin(R, zz, SS, c.hatBalken, c.lebendAb, c.bd, c.O);
  u.zwilling_info = R.zwilling || null;
  if (b.B2 && c.z4 && c.z4.e6betroffen) { u.e6_name_passt = e6NamePasst(c.z4, zz.cik || null); u.zuordnung_b2 = zz === c.z4 ? 'unveraendert' : 'zuordnung-lauf3'; }
  if (b.B3 && c.hand[R0.reihe]) u = handAuflegen(u, c.hand[R0.reihe], R0);
  return u;
}

/** Felder der Tafel v2 je Zeile (Aufbau wie die alte Tafel, dazu die Felder des vierten Laufs und von B1-B3). */
function tafelZeile(u, k123) {
  return { reihe: u.reihe, ordner: u.ordner, art: u.art, gruppe: u.gruppe, grund: u.grund, datum: u.datum || null, quelle: u.quelle || null, beleg: u.beleg, regel: u.regel,
    preis_je_aktie: u.preis_je_aktie == null ? null : u.preis_je_aktie, aufschlag_pp: u.aufschlag_pp == null ? null : u.aufschlag_pp,
    nachfolger: u.nachfolger || null, nachfolger_im_archiv: u.nachfolger_im_archiv == null ? null : u.nachfolger_im_archiv,
    letzter_balken: u.letzter_balken, letzter_kurs_archiv: u.letzter_kurs_archiv, letzter_kurs_roh: u.letzter_kurs_roh, letzter_kurs_roh_quelle: u.letzter_kurs_roh_quelle,
    cik: u.cik || null, firma: u.firma || null, zuordnungsweg: u.zuordnungsweg || null, sic: u.sic || null, wortlaut: u.wortlaut || null,
    zwilling: u.zwilling || null, zwilling_info: u.zwilling_info || null, doppelt: u.doppelt ? true : false,
    e6_name_passt: u.e6_name_passt === undefined ? null : u.e6_name_passt, zuordnung_b2: u.zuordnung_b2 || null,
    handeintrag: u.handeintrag || null, klasse123: k123 ? 1 : 0, panel: u.panel || null, signale: u.signale || null };
}

function main() {
  var V = G.json(path.join(Z4, 'z4-verschwundene.json'));
  var PV = G.json(ZWILLINGE);
  var zuord4 = G.json(path.join(Z4, 'z4-edgar-zuordnung.json')).zuordnung || {};
  var zuord3 = G.json(path.join(Z3.Z3ORDNER, 'z3-edgar-zuordnung.json')).zuordnung || {};
  var L4 = G.json(path.join(Z4, 'z4-gruende-neu.json')), l4 = {};
  L4.reihen.forEach(function (x) { l4[x.reihe] = x; });
  var PK = G.json(path.join(Z3.P2, 't4-panelklasse.json'));
  var HJ = G.json(HAND), hand = {};
  HJ.eintraege.forEach(function (h) { hand[h.reihe] = h; });
  var ED = require('../zaehllauf4/t4-edgar.js');
  var hatBalken = {};   // NICHT von E: - siehe Kopf
  var bd = E.bigdataFunde(), lebendAb = E.ms(V.lebendAb);
  var text = LF.textLeser(), bedarf = {};
  var O = Object.assign({}, E.ALLE_AN, { text: text, bedarf: bedarf });

  var Z = { reihen: V.reihen.length, offen: [], textbedarf: 0, handeintraege: HJ.eintraege.length, handOhneReihe: [], handAnkerAnders: [],
    gegenprobe: { gleich: 0, anders: [], feldAnders: {}, nachfolgerImArchivAnders: 0 },
    b2: { betroffen: 0, firmaAnders: 0, namePasst: { 'true': 0, 'false': 0, 'null': 0 } }, nachfolgerImArchiv: { ausLauf4: 0, null: 0, zwilling: 0 } };
  HJ.eintraege.forEach(function (h) { if (!V.reihen.some(function (R) { return R.reihe === h.reihe; })) Z.handOhneReihe.push(h.reihe); });

  var FELDER_GP = ['grund', 'datum', 'quelle', 'beleg', 'regel', 'preis_je_aktie', 'nachfolger', 'zwilling', 'doppelt', 'cik', 'firma', 'zuordnungsweg', 'sic', 'letzter_balken',
    'letzter_kurs_archiv', 'letzter_kurs_roh', 'letzter_kurs_roh_quelle', 'aufschlag_pp', 'signale', 'namensprobe', 'zweit', 'wortlaut', 'kuerzel_neu_vergeben', 'belegtext'];
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
    var z3 = zuord3[R0.reihe], b2greift = zuordnungB2(z4, z3, 1) !== z4;
    var S4 = lade(z4), S3 = b2greift ? lade(z3) : S4;
    if (S4 === undefined || S3 === undefined) { Z.offen.push(R0.reihe); return; }
    var c = { pv: PV.je[R0.reihe], z4: z4, z3: z3, S4: S4 === null ? null : S4, S3: S3 === null ? null : S3, hand: hand, hatBalken: hatBalken, lebendAb: lebendAb, bd: bd, O: O };
    function stufe(b) { return stufeV2(R0, b, c); }
    var u = stufe(B_AN), u0 = stufe({ B1: 0, B2: 0, B3: 0 });
    var ohne = { B1: stufe({ B1: 0, B2: 1, B3: 1 }), B2: stufe({ B1: 1, B2: 0, B3: 1 }), B3: stufe({ B1: 1, B2: 1, B3: 0 }) };
    var nur = { B1: stufe({ B1: 1, B2: 0, B3: 0 }), B2: stufe({ B1: 0, B2: 1, B3: 0 }), B3: stufe({ B1: 0, B2: 0, B3: 1 }) };

    /* Gegenprobe: alles aus = vierter Lauf (alle Felder der Einstufung; nachfolger_im_archiv getrennt, s. Kopf) */
    var a4 = l4[R0.reihe], anders = [];
    FELDER_GP.forEach(function (f) { if (JSON.stringify(u0[f] === undefined ? null : u0[f]) !== JSON.stringify(a4[f] === undefined ? null : a4[f])) anders.push(f); });
    if ((u0.nachfolger_im_archiv || 0) !== (a4.nachfolger_im_archiv || 0)) Z.gegenprobe.nachfolgerImArchivAnders++;
    if (!anders.length) Z.gegenprobe.gleich++;
    else { Z.gegenprobe.anders.push(R0.reihe + ' [' + anders.join(',') + ']'); anders.forEach(function (f) { Z.gegenprobe.feldAnders[f] = (Z.gegenprobe.feldAnders[f] || 0) + 1; }); }

    /* nachfolger_im_archiv (Auskunft) aus dem vierten Lauf, wo Regel und Nachfolger gleich sind */
    if (u.regel === 'Z') Z.nachfolgerImArchiv.zwilling++;
    else if (u.nachfolger_im_archiv !== undefined && u.regel !== 'H') {
      if (a4.regel === u.regel && (a4.nachfolger || null) === (u.nachfolger || null) && a4.nachfolger_im_archiv !== undefined) { u.nachfolger_im_archiv = a4.nachfolger_im_archiv; Z.nachfolgerImArchiv.ausLauf4++; }
      else { u.nachfolger_im_archiv = null; Z.nachfolgerImArchiv.null++; }
    }
    if (z4.e6betroffen) { Z.b2.betroffen++; if (b2greift && (z3.cik || null) !== (z4.cik || null)) Z.b2.firmaAnders++; Z.b2.namePasst[String(u.e6_name_passt === undefined ? null : u.e6_name_passt)]++; }
    if (hand[R0.reihe] && !u.handeintrag.ankerPasst) Z.handAnkerAnders.push(R0.reihe + ' ' + hand[R0.reihe].anker + ' / ' + R0.letzterBalken);
    u.panel = R0.panel ? { reihe: R0.panel.reihe, zeilen: R0.panel.zeilen, bis: R0.panel.bis } : null;
    var k = PK.je[R0.reihe], k123 = !!(k && k.k123 > 0);
    tafel.push(tafelZeile(u, k123));
    arbeit.push({ reihe: R0.reihe, k: k123, v2: u.grund, lauf4: a4.grund, ohneB1: ohne.B1.grund, ohneB2: ohne.B2.grund, ohneB3: ohne.B3.grund, nurB1: nur.B1.grund, nurB2: nur.B2.grund, nurB3: nur.B3.grund, beleg: u.beleg, belegLauf4: a4.beleg,
      ohneB1beleg: ohne.B1.beleg, ohneB2beleg: ohne.B2.beleg });
  });
  Z.textbedarf = Object.keys(bedarf).length;

  /* ---------- Zahlen: Matrix vierter Lauf -> v2, je Ursache; Totalverlust ---------- */
  var M = { andersAlsLauf4: 0, jeUrsache: { B1: 0, B2: 0, B3: 0, zusammen: 0 }, jeUrsacheKlasse123: { B1: 0, B2: 0, B3: 0, zusammen: 0 }, uebergaenge: {}, reihen: [], belegAndersGleicherGrund: { B1: 0, B2: 0 } };
  arbeit.forEach(function (x) {
    if (x.v2 === x.lauf4) {
      if (x.beleg !== x.belegLauf4) { if (x.ohneB1beleg === x.belegLauf4) M.belegAndersGleicherGrund.B1++; else if (x.ohneB2beleg === x.belegLauf4) M.belegAndersGleicherGrund.B2++; }
      return;
    }
    M.andersAlsLauf4++;
    var u = ['B1', 'B2', 'B3'].filter(function (b) { return x['ohne' + b] === x.lauf4; });
    /* Ursache: die Aenderung, ohne die der Grund des vierten Laufs zurueckkommt; sind es mehrere: 'B1 und B2'. Holt keine einzelne
     * ihn zurueck, die, die ALLEIN den neuen Grund ergeben ('B2 oder B3'); sonst 'zusammen'. */
    var allein = ['B1', 'B2', 'B3'].filter(function (b) { return x['nur' + b] === x.v2; });
    var ur = u.length === 1 ? u[0] : u.length ? u.join(' und ') : allein.length ? allein.join(' oder ') : 'zusammen';
    if (M.jeUrsache[ur] === undefined) { M.jeUrsache[ur] = 0; M.jeUrsacheKlasse123[ur] = 0; }
    M.jeUrsache[ur]++; if (x.k) M.jeUrsacheKlasse123[ur]++;
    var ue = x.lauf4 + ' -> ' + x.v2; M.uebergaenge[ue] = (M.uebergaenge[ue] || 0) + 1;
    M.reihen.push({ reihe: x.reihe, lauf4: x.lauf4, v2: x.v2, ursache: ur, klasse123: x.k ? 1 : 0 });
  });
  var tvZ = {};
  [['haupt', A.HAUPT], ['streng', A.STRENG]].forEach(function (p) {
    var l = p[1], drin = arbeit.filter(function (x) { return A.tvIn(x.v2, l); }), vier = arbeit.filter(function (x) { return A.tvIn(x.lauf4, l); });
    tvZ[p[0]] = { liste: l, bestand: drin.length, klasse123: drin.filter(function (x) { return x.k; }).map(function (x) { return x.reihe; }), lauf4: vier.length,
      lauf4Klasse123: vier.filter(function (x) { return x.k; }).map(function (x) { return x.reihe; }),
      heraus: vier.filter(function (x) { return !A.tvIn(x.v2, l); }).map(function (x) { return x.reihe + ' (' + x.v2 + (x.k ? ', K1-3' : '') + ')'; }),
      hinein: drin.filter(function (x) { return !A.tvIn(x.lauf4, l); }).map(function (x) { return x.reihe + ' (' + x.lauf4 + ' -> ' + x.v2 + (x.k ? ', K1-3' : '') + ')'; }) };
  });
  var zaehler = {}, belege = {}, regeln = {};
  tafel.forEach(function (u) { zaehler[u.grund] = (zaehler[u.grund] || 0) + 1; belege[u.beleg] = (belege[u.beleg] || 0) + 1; regeln[u.regel] = (regeln[u.regel] || 0) + 1; });

  var out = { kennung: KENNUNG, stand: new Date().toISOString(),
    grundlage: { lauf4: 'datenfundament-2026-10-04/zaehllauf4 (Commits 02ac0b5, f97dff5)', handeintraege: HJ.kennung + ' (f9cc14a)', panel: PV.panel, zwillinge: 'tafel-v2/v2-panel.json' },
    regeln: Object.assign({}, E.REGELN, { B1: 'Zwilling: (b) zaehlt ungleiche Tage mit, wenn das Verhaeltnis der rohen Schluesse dort fest ist (relative Abweichung <= 1e-6) - Split dazwischen',
      B2: 'Namensprobe der Suchfirma (E6) nur Kennzeichen e6_name_passt, keine Verwerfung (Firma wie ohne E6 = Zuordnung des dritten Laufs)', B3: 'Handeintraege gehen allen Regeln vor (Regel H)',
      B4: 'vollzogene Mantel-Fusionen bleiben SPAC-Ende (kein Eingriff)', B5: 'neue Datei; alte Tafel, Lauf 4 und Handeintraege unveraendert' }),
    totalverlust: { haupt: A.HAUPT, streng: A.STRENG }, anker: 'letzter Minutentag', zaehler: zaehler, belegarten: belege, jeRegel: regeln, n: tafel.length, reihen: tafel };
  schreibe('verschwundene-gruende-v2.json', out);
  schreibe('v2-zahlen.json', { kennung: KENNUNG + ' (Zahlen)', stand: out.stand, lauf: Z, matrix: M, totalverlust: tvZ, zaehler: zaehler, jeRegel: regeln, zaehlerLauf4: L4.zaehler });
  console.log('Tafel v2:', tafel.length, 'Zeilen, offen', Z.offen.length, '| Textbedarf', Z.textbedarf, '| Hand ohne Reihe', Z.handOhneReihe.length, '| Anker anders', Z.handAnkerAnders.length);
  console.log('Gegenprobe alles aus = Lauf 4:', Z.gegenprobe.gleich, 'gleich,', Z.gegenprobe.anders.length, 'anders', JSON.stringify(Z.gegenprobe.feldAnders), '| nachfolger_im_archiv anders', Z.gegenprobe.nachfolgerImArchivAnders);
  console.log('Matrix: anders als Lauf 4', M.andersAlsLauf4, JSON.stringify(M.jeUrsache), 'Klasse 1-3', JSON.stringify(M.jeUrsacheKlasse123));
  console.log('Haupt', tvZ.haupt.bestand, 'K1-3', tvZ.haupt.klasse123.join(' '), '| streng', tvZ.streng.bestand, 'K1-3', tvZ.streng.klasse123.length);
  console.log('Grund:', JSON.stringify(zaehler));
}

module.exports = { zwillingInfo: zwillingInfo, e6NamePasst: e6NamePasst, handAuflegen: handAuflegen, zuordnungB2: zuordnungB2, stufeV2: stufeV2, tafelZeile: tafelZeile,
  KENNUNG: KENNUNG, B_AN: B_AN };
if (require.main === module) main();
