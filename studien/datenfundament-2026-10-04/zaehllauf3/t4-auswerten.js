'use strict';
/* ZAEHLLAUF 3, Schritt 4 - Auswertung (Auftrag Nr. 90, Abschnitt 2). Nur zaehlen - KEINE Tafel.
 *
 * KOPIE von ../phase2/t4-auswerten.js (vergleiche, tvIn, Beleg-Lage, Gruppen), erweitert um: Vergleich gegen den zweiten
 * Lauf, Ursache je Regel (aus lauf.js: `ohne`), Lesarten V4, Wortlaut (Klassen, Kreuztabelle, Lern-/Pruef-/Eichprobe),
 * Aussenpruefung V8, die Gruppen des Auftrags, Leseliste Klasse 1-3, die 14 Reihen des zweiten Laufs, Handeintrag (V6).
 *
 * Aufruf:  node t4-auswerten.js
 * Liest:   z3-gruende-neu.json, z3-verschwundene.json, z3-lernprobe.json, z3-pruefprobe.json, pruefprobe-lesart.json,
 *          ../phase2/t4-panelklasse.json (nur lesen - das Panel wird nicht geladen)
 * Schreibt: z3-zahlen.json, z3-matrix.json, z3-kippfaelle.json, z3-totalverlust.json, z3-wortlaut.json, z3-gruppen.json, z3-anhang.md
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');

var NEUER_GRUND = 'abgemeldet-anlass-offen';
var GRUENDE = ['umbenennung-ticker', 'uebernahme', 'fusion-aktientausch', 'insolvenz', 'spac-ende', 'zwangs-delisting', 'freiwillig', NEUER_GRUND, 'ausgesetzt', 'unbekannt'];
var HAUPT = ['insolvenz', 'zwangs-delisting'], STRENG = HAUPT.concat(['unbekannt', 'freiwillig', NEUER_GRUND, 'ausgesetzt']);   // V4
var REGELN = ['V1', 'V2', 'V3', 'V3b', 'V5i', 'V5iii', 'V7', 'V8'];
var BAENDER = ['unter 1', '1-5', '5-8', '8-13', 'ueber 13', 'ohne Kurs'];
var KLASSEN = ['vollzug', 'ruege', 'mehrdeutig', 'eigener-entschluss', 'nichts'];
var DIE14 = ['YHOO', 'DVMT', 'ETP', 'ESV', 'WNR', 'OZRK', 'JAH', 'SBNY', 'BCR', 'SLW', 'SYMC', 'PF', 'ESL', 'SODA'];
var BELEGE = ['edgar-8K-3.01-vollzug', 'edgar-8K-3.01-ruege', 'edgar-8K-3.01-eigener-entschluss', 'edgar-8K-3.01+prospekt', 'edgar-8K-3.01+5.01', 'edgar-8K-3.01', 'edgar-8K-3.01-ruege-frueh+25-NSE', 'edgar-mantel+8K-3.01',
  'edgar-8K-2.01+prospekt', 'edgar-8K-1.03', 'q-kuerzel+edgar-8K-1.03', 'edgar-formular25', 'edgar-formular15', 'edgar-mantel+abmeldung'];

/** Reine Regel (wie im zweiten Lauf): "kippt" = Grund vorher weder "unbekannt" noch gleich dem neuen; freiwillig ->
 *  abgemeldet-anlass-offen ist eine Umbenennung, kein Kipp-Fall. */
function vergleiche(alt, neu) {
  if (!alt) return 'neu';
  if (alt.grund === neu.grund) return (alt.datum === neu.datum && alt.quelle === neu.quelle) ? 'gleich' : 'gleicher-grund-anderer-beleg';
  if (alt.grund === 'unbekannt') return 'unbekannt-bekommt-grund';
  if (alt.grund === 'freiwillig' && neu.grund === NEUER_GRUND) return 'umbenannt-R-c';
  return neu.grund === 'unbekannt' ? 'kippt-verliert-grund' : 'kippt';
}
function tvIn(grund, liste) { return !!(grund && liste.indexOf(grund) !== -1); }
function zahl(l, f) { return l.filter(f).length; }
function jeFeld(l, f) { return l.reduce(function (a, z) { var k = String(f(z)); a[k] = (a[k] || 0) + 1; return a; }, {}); }
function sortiert(o) { return Object.keys(o).sort(function (a, b) { return o[b] - o[a] || (a < b ? -1 : 1); }).map(function (k) { return [k, o[k]]; }); }
function istKipp(v) { return v === 'kippt' || v === 'kippt-verliert-grund'; }

function main() {
  var N = G.json(path.join(Z3.HIER, 'z3-gruende-neu.json')), PK = G.json(path.join(Z3.P2, 't4-panelklasse.json')), Vje = {};
  G.json(path.join(Z3.HIER, 'z3-verschwundene.json')).reihen.forEach(function (R) { Vje[R.reihe] = R; });
  var zeilen = N.reihen;
  zeilen.forEach(function (z) {
    var pk = PK.je[z.reihe] || { k123: 0, k23: 0 };
    z.k123 = pk.k123; z.k23 = pk.k23; z.vAlt = vergleiche(z.alt, z); z.vL2 = vergleiche(z.lauf2, z); z.ursachen = Object.keys(z.ohne || {});
  });
  var alte = zeilen.filter(function (z) { return !z.neu; }), neue = zeilen.filter(function (z) { return z.neu; });
  var Z = { kennung: Z3.KENNUNG, stand: new Date().toISOString(), wortlautFassung: N.wortlautFassung, eingestuft: zeilen.length, offen: N.offen, tafelImGanzen: { alt: jeFeld(alte, function (z) { return z.alt.grund; }),
    lauf2: jeFeld(zeilen, function (z) { return z.lauf2.grund; }), lauf3: jeFeld(zeilen, function (z) { return z.grund; }) }, jeRegel: N.jeRegel, belegarten: N.belegarten };

  /* ---- 1 Matrix ---- */
  function matrix(liste, von) { var m = {}; liste.forEach(function (z) { var a = von(z).grund; m[a] = m[a] || {}; m[a][z.grund] = (m[a][z.grund] || 0) + 1; }); return m; }
  var mAlt = matrix(alte, function (z) { return z.alt; }), mL2 = matrix(zeilen, function (z) { return z.lauf2; });
  Z.neueReihen = { reihen: neue.length, jeGrund: jeFeld(neue, function (z) { return z.grund; }) };

  /* ---- 2 Kipp-Faelle ---- */
  function kippZahl(liste, feld, vor) {
    var k = liste.filter(function (z) { return istKipp(z[feld]); });
    var jeRegel = {}; REGELN.forEach(function (r) { jeRegel[r] = zahl(k, function (z) { return z.ohne && z.ohne[r]; }); });
    return { zeilen: liste.length, vergleich: jeFeld(liste, function (z) { return z[feld]; }), kipp: k.length, verliertGrund: zahl(k, function (z) { return z[feld] === 'kippt-verliert-grund'; }), mitKlasse123: zahl(k, function (z) { return z.k123 > 0; }),
      kippFaelleMitRegelAlsUrsache: jeRegel, ohneRegelAlsUrsache: zahl(k, function (z) { return !z.ursachen.length; }), stroeme: sortiert(jeFeld(k, function (z) { return vor(z).grund + ' -> ' + z.grund; })) };
  }
  Z.kipp = { gegenAlteTafel: kippZahl(alte, 'vAlt', function (z) { return z.alt; }), gegenLauf2: kippZahl(zeilen, 'vL2', function (z) { return z.lauf2; }),
    andererGrundOhneRegel: N.andererGrundOhneRegel, hinweis: 'andererGrundOhneRegel: je Regel einmal ausgeschaltet, alle anderen an - Zahl der Zeilen (von allen), die dann einen anderen Grund haetten' };
  Z.aenderungGegenLauf2JeRegel = {}; REGELN.forEach(function (r) { Z.aenderungGegenLauf2JeRegel[r] = sortiert(jeFeld(zeilen.filter(function (z) { return z.ohne && z.ohne[r]; }), function (z) { return z.ohne[r].grund + ' -> ' + z.grund; })).slice(0, 8); });
  function kurz(x) { return x ? { grund: x.grund, datum: x.datum, beleg: x.beleg, quelle: x.quelle, firma: x.firma, cik: x.cik, weg: x.zuordnungsweg } : null; }
  function fall(z) { return { reihe: z.reihe, anker: z.letzter_balken, alt: kurz(z.alt), lauf2: kurz(z.lauf2), lauf3: kurz(z), regel: z.regel, ursachen: z.ursachen, ohne: z.ohne, gegenAlt: z.vAlt, gegenLauf2: z.vL2,
    letzterKurs: z.letzter_kurs_archiv, wortlaut: z.wortlaut || null, k123: z.k123, k23: z.k23 }; }
  var nachK = function (a, b) { return b.k123 - a.k123 || (a.reihe < b.reihe ? -1 : 1); };
  var kippL2 = zeilen.filter(function (z) { return istKipp(z.vL2); }).map(fall).sort(nachK), kippAlt = alte.filter(function (z) { return istKipp(z.vAlt); }).map(fall).sort(nachK);

  /* ---- 3 Totalverlust-Eigenschaft (V4) ---- */
  function tv(liste, von) {
    var a = [];
    zeilen.forEach(function (z) { var v = von(z), war = tvIn(v ? v.grund : null, liste), ist = tvIn(z.grund, liste); if (war !== ist) a.push({ reihe: z.reihe, richtung: ist ? 'hinzu' : 'weg', vorher: v ? v.grund : null, jetzt: z.grund, beleg: z.beleg, k123: z.k123, k23: z.k23 }); });
    function c(f) { return a.filter(f).length; }
    return { zahlen: { geaendert: a.length, hinzu: c(function (x) { return x.richtung === 'hinzu'; }), weg: c(function (x) { return x.richtung === 'weg'; }), mitKlasse123: c(function (x) { return x.k123 > 0; }),
      hinzuKlasse123: c(function (x) { return x.richtung === 'hinzu' && x.k123 > 0; }), wegKlasse123: c(function (x) { return x.richtung === 'weg' && x.k123 > 0; }), mitKlasse23: c(function (x) { return x.k23 > 0; }),
      hinzuAus: sortiert(jeFeld(a.filter(function (x) { return x.richtung === 'hinzu'; }), function (x) { return x.vorher; })), wegNach: sortiert(jeFeld(a.filter(function (x) { return x.richtung === 'weg'; }), function (x) { return x.jetzt; })) }, reihen: a.sort(nachK) };
  }
  var vAlt = function (z) { return z.alt; }, vL2 = function (z) { return z.lauf2; };
  var TV = { haupt: { gegenAlteTafel: tv(HAUPT, vAlt), gegenLauf2: tv(HAUPT, vL2) }, streng: { gegenAlteTafel: tv(STRENG, vAlt), gegenLauf2: tv(STRENG, vL2) } };
  Z.totalverlust = { listen: { haupt: HAUPT, streng: STRENG }, bestand: { haupt: zahl(zeilen, function (z) { return tvIn(z.grund, HAUPT); }), hauptKlasse123: zahl(zeilen, function (z) { return tvIn(z.grund, HAUPT) && z.k123 > 0; }),
    streng: zahl(zeilen, function (z) { return tvIn(z.grund, STRENG); }), strengKlasse123: zahl(zeilen, function (z) { return tvIn(z.grund, STRENG) && z.k123 > 0; }),
    hauptLauf2: zahl(zeilen, function (z) { return tvIn(z.lauf2.grund, HAUPT); }), hauptLauf2Klasse123: zahl(zeilen, function (z) { return tvIn(z.lauf2.grund, HAUPT) && z.k123 > 0; }) },
    haupt: { gegenAlteTafel: TV.haupt.gegenAlteTafel.zahlen, gegenLauf2: TV.haupt.gegenLauf2.zahlen }, streng: { gegenAlteTafel: TV.streng.gegenAlteTafel.zahlen, gegenLauf2: TV.streng.gegenLauf2.zahlen } };
  var leseliste = zeilen.filter(function (z) { return z.k123 > 0 && tvIn(z.grund, HAUPT); }).sort(nachK).map(function (z) { return { reihe: z.reihe, anker: z.letzter_balken, grund: z.grund, beleg: z.beleg, regel: z.regel, firma: z.firma, letzterKurs: z.letzter_kurs_archiv,
    datum: z.datum, quelle: z.quelle, wortlaut: z.wortlaut || null, auszug: z.wortlaut_auszug || null, lauf2: z.lauf2.grund, alt: z.alt ? z.alt.grund : null, k123: z.k123, k23: z.k23 }; });
  var je = {}; zeilen.forEach(function (z) { je[z.reihe] = z; });
  var die14 = DIE14.map(function (r) { var z = je[r]; return z ? { reihe: r, k123: z.k123, alt: z.alt ? z.alt.grund + ' (' + z.alt.beleg + ', ' + (z.alt.firma || '-') + ')' : null, lauf2: z.lauf2.grund + ' (' + z.lauf2.beleg + ', ' + (z.lauf2.firma || '-') + ')',
    lauf3: z.grund + ' (' + z.beleg + ', ' + (z.datum || '-') + ', ' + (z.firma || '-') + ')', regel: z.regel, weg: z.zuordnungsweg, namensprobe: z.namensprobe, zweit: z.zweit ? z.zweit.name : null, wortlaut: z.wortlaut || null, ursachen: z.ursachen, totalverlustHaupt: tvIn(z.grund, HAUPT) ? 'ja' : 'nein' } : { reihe: r, fehlt: 1 }; });

  /* ---- 4 Wortlaut ---- */
  var r11 = zeilen.filter(function (z) { return z.regel === 11; }), kreuz = {};
  r11.forEach(function (z) { var k = [z.wortlaut, z.signale.fusion_nah ? 'Fusionsbeleg' : 'kein Fusionsbeleg', z.emittent_formular25 ? 'Emittent-25' : 'kein Emittent-25', z.band].join(' | '); kreuz[k] = (kreuz[k] || 0) + 1; });
  function jeKlasseBand(l) { var o = {}; KLASSEN.forEach(function (k) { var x = l.filter(function (z) { return z.wortlaut === k; }); if (!x.length) return; o[k] = { n: x.length, mitFusionsbeleg: zahl(x, function (z) { return z.signale.fusion_nah; }), mitEmittent25: zahl(x, function (z) { return z.emittent_formular25; }),
    hoechstens30TageAmAnker: zahl(x, function (z) { return Math.abs(z.signale.i301v3_tage) <= 30; }), band: jeFeld(x, function (z) { return z.band; }), grund: jeFeld(x, function (z) { return z.grund; }) }; }); return o; }
  var wortlautRegeln = zeilen.filter(function (z) { return z.regel >= 9 && z.regel <= 12 && z.wortlaut_stand; });
  var lern = Z3.lies(path.join(Z3.HIER, 'z3-lernprobe.json')), pruef = Z3.lies(path.join(Z3.HIER, 'z3-pruefprobe.json')), les = Z3.lies(path.join(Z3.HIER, 'pruefprobe-lesart.json'));
  var pr = null;
  if (pruef && les) {
    var pz = pruef.reihen.map(function (x) { var l = les.lesart[x.reihe] || null; return { reihe: x.reihe, klasse: x.klasse, abschnitt: x.abschnitt, lesart: l, stimmt: l === x.klasse ? 1 : 0, anmerkung: (les.anmerkung || {})[x.reihe] || null, tageZumAnker: x.tageZumAnker, band: x.band, auszug: x.auszug }; });
    var jk = {}; pz.forEach(function (x) { jk[x.klasse] = jk[x.klasse] || { n: 0, stimmt: 0 }; jk[x.klasse].n++; jk[x.klasse].stimmt += x.stimmt; });
    pr = { saat: pruef.saat, fassung: pruef.wortlautFassung, reihen: pz.length, stimmt: zahl(pz, function (x) { return x.stimmt; }), jeKlasse: jk, fehlgriffe: pz.filter(function (x) { return !x.stimmt; }).map(function (x) { return { reihe: x.reihe, klasse: x.klasse, lesart: x.lesart, anmerkung: x.anmerkung }; }), liste: pz };
  }
  function eich(e) { return { regel: e.regel, kandidaten: e.kandidaten, reihen: e.reihen.length, jeKlasse: jeFeld(e.reihen, function (x) { return x.klasse; }), jeStand: jeFeld(e.reihen, function (x) { return x.stand; }) }; }
  var WL = { fassung: N.wortlautFassung, regel11: { reihen: r11.length, jeKlasse: jeFeld(r11, function (z) { return z.wortlaut; }), jeTabellenzeile: jeFeld(r11, function (z) { return z.v2_zeile + ' ' + z.grund + ' ' + z.beleg; }), jeGrund: jeFeld(r11, function (z) { return z.grund; }),
    jeStand: jeFeld(r11, function (z) { return z.wortlaut_stand; }), wortlautUnklar: zahl(r11, function (z) { return z.wortlaut_unklar; }), klasseMalHinweise: jeKlasseBand(r11), kreuztabelle: sortiert(kreuz) },
    regeln9bis12: { reihen: wortlautRegeln.length, jeStand: jeFeld(wortlautRegeln, function (z) { return z.wortlaut_stand; }), textNichtZuHolen: zahl(wortlautRegeln, function (z) { return z.wortlaut_stand === 'nicht-zu-holen' || z.wortlaut_stand === 'text-fehlt'; }),
      abschnittNichtGefunden: zahl(wortlautRegeln, function (z) { return z.wortlaut_stand === 'abschnitt-nicht-gefunden'; }) },
    lernprobe: lern ? { saat: lern.saat, fassung: lern.wortlautFassung, reihen: lern.reihen.length, jeKlasse: jeFeld(lern.reihen, function (x) { return x.klasse; }), ohneAbschnitt: zahl(lern.reihen, function (x) { return !x.abschnitt; }) } : null,
    pruefprobe: pr ? { saat: pr.saat, fassung: pr.fassung, reihen: pr.reihen, stimmt: pr.stimmt, jeKlasse: pr.jeKlasse, fehlgriffe: pr.fehlgriffe } : null, eichprobe: { a: eich(N.eichprobe.a), b: eich(N.eichprobe.b) } };
  Z.wortlaut = WL;

  /* ---- 5 Aussenpruefungen ---- */
  function weg(z) { return z.zweit ? 'beide Auszuege (' + (z.zuordnungsweg === 'polygon-cik' ? 'Polygon' : 'Suche') + ' + alte Tafel)' : z.zuordnungsweg === 'polygon-cik' ? 'Polygon-CIK, Namensprobe ' + z.namensprobe : !z.cik ? 'keine Firma' : 'Suche' + (z.namensprobe ? ' (Polygon-CIK verworfen)' : ' (kein Polygon-Eintrag)'); }
  var verworfen = zeilen.filter(function (z) { return z.polygon_verworfen; });
  Z.aussen = { a_namensprobe: { jeWeg: jeFeld(zeilen, weg), polygonEintraege: zahl(zeilen, function (z) { return z.polygon_firma; }), jeProbe: jeFeld(zeilen.filter(function (z) { return z.polygon_firma; }), function (z) { return z.namensprobe; }),
    verworfen: { zeilen: verworfen.length, sucheFindetFirma: zahl(verworfen, function (z) { return z.cik; }), firmaDerSucheTraegtPolygonNamen: zahl(verworfen, function (z) { return z.cik && Z3.nameAehnlich(z.firma, z.polygon_verworfen.name); }),
      firmaDerSucheGleichAlteTafel: zahl(verworfen, function (z) { return z.cik && z.alt && z.alt.cik === z.cik; }), jeGrund: jeFeld(verworfen, function (z) { return z.grund; }), grundLauf2: jeFeld(verworfen, function (z) { return z.lauf2.grund; }) },
    zweiterRegistrant: { zeilen: zahl(zeilen, function (z) { return z.zweit; }), aendertDenGrundGegenLauf2: zahl(zeilen, function (z) { return z.zweit && z.grund !== z.lauf2.grund; }), mitKlasse123: zahl(zeilen, function (z) { return z.zweit && z.k123 > 0; }) },
    v1AendertDenGrund: zahl(zeilen, function (z) { return z.ohne && z.ohne.V1; }) } };
  function lage(liste, test, d, anker) { var l = liste.filter(test), a = { zeilen: l.length, innerhalb30: 0, davor: 0, danach: 0 }; l.forEach(function (z) { var t = G.tageZwischen(anker(z), d(z)); if (t < -30) a.davor++; else if (t > 30) a.danach++; else a.innerhalb30++; }); return a; }
  var bl = {};
  BELEGE.forEach(function (b) { bl[b] = { lauf3: lage(zeilen, function (z) { return z.beleg === b && z.datum; }, function (z) { return z.datum; }, function (z) { return z.letzter_balken; }),
    lauf2: lage(zeilen, function (z) { return z.lauf2.beleg === b && z.lauf2.datum; }, function (z) { return z.lauf2.datum; }, function (z) { return z.letzter_balken; }) }; });
  bl['alle 8-K 3.01 der Regel 11'] = { lauf3: lage(r11, function (z) { return z.datum; }, function (z) { return z.datum; }, function (z) { return z.letzter_balken; }) };
  Z.aussen.b_belegLage = bl;
  var v8 = zeilen.filter(function (z) { return z.v8 && z.v8.sorte !== 'gleich' && z.v8.sorte !== 'keine'; });
  Z.aussen.c_v8 = { jeSorte: jeFeld(zeilen, function (z) { return z.v8.sorte; }), andereMassnahmeAlsBisher: v8.length, davonAendertDenGrund: zahl(v8, function (z) { return z.ohne && z.ohne.V8; }), v8AendertDenGrund: zahl(zeilen, function (z) { return z.ohne && z.ohne.V8; }),
    nurAufnehmendeSeite: zeilen.filter(function (z) { return z.v8.sorte === 'nur-alt' && z.v8.altRolle === 'aufnehmend'; }).map(function (z) { return z.reihe + ' (' + z.v8.alt + '; Lauf 2: ' + z.lauf2.grund + ', Lauf 3: ' + z.grund + ')'; }),
    nurNeu: v8.filter(function (z) { return z.v8.sorte === 'nur-neu'; }).map(function (z) { return { reihe: z.reihe, neu: z.v8.neu, juengste: z.v8.juengsteAusserhalb, lauf2: z.lauf2.grund, lauf3: z.grund }; }),
    andere: v8.filter(function (z) { return z.v8.sorte === 'andere'; }).map(function (z) { return { reihe: z.reihe, alt: z.v8.alt, neu: z.v8.neu, lauf2: z.lauf2.grund, lauf3: z.grund }; }),
    grundwechselDurchV8: sortiert(jeFeld(zeilen.filter(function (z) { return z.ohne && z.ohne.V8; }), function (z) { return z.ohne.V8.grund + ' -> ' + z.grund; })) };

  /* ---- 6 Gruppen ---- */
  function gz(z) { return { reihe: z.reihe, anker: z.letzter_balken, grund: z.grund, beleg: z.beleg, firma: z.firma, letzterKurs: z.letzter_kurs_archiv, wortlaut: z.wortlaut || null, k123: z.k123 }; }
  var m6770 = zeilen.filter(function (z) { return z.sic === '6770' && z.signale.i301v3; }), amKurs = m6770.filter(function (z) { return z.regel >= 10 && !(z.letzter_kurs_archiv >= 8); });
  var ausg = zeilen.filter(function (z) { return z.regel === 10; }), neuV = zeilen.filter(function (z) { return z.kuerzel_neu_vergeben; });
  var e25 = zeilen.filter(function (z) { return z.signale.f25_emittent && z.signale.i301v3; }), e25r11 = e25.filter(function (z) { return z.regel === 11; });
  var hand = zeilen.filter(function (z) { return z.k123 > 0 && z.grund === 'unbekannt'; }).sort(nachK);
  var Gr = { stand: Z.stand, mantel: { regel9: zahl(zeilen, function (z) { return z.regel === 9; }), regel9Klasse123: zahl(zeilen, function (z) { return z.regel === 9 && z.k123 > 0; }), regel9JeWortlaut: jeFeld(zeilen.filter(function (z) { return z.regel === 9; }), function (z) { return z.wortlaut; }),
    regel9GrundLauf2: jeFeld(zeilen.filter(function (z) { return z.regel === 9; }), function (z) { return z.lauf2.grund; }), sic6770Mit301: m6770.length, sic6770Mit301JeRegel: jeFeld(m6770, function (z) { return z.regel; }), scheitertAmKurs: amKurs.map(gz) },
    ausgesetzt: { zahl: ausg.length, mitKlasse123: zahl(ausg, function (z) { return z.k123 > 0; }), grundLauf2: jeFeld(ausg, function (z) { return z.lauf2.grund; }), reihen: ausg.map(function (z) { var o = gz(z); o.polygonAbgang = z.ausgesetzt.polygonAbgang; o.tageNachAnker = z.ausgesetzt.tageNachAnker; o.massnahmeDanach = z.ausgesetzt.massnahmeDanach; o.lauf2 = z.lauf2.grund; return o; }),
      kuerzelNeuVergeben: neuV.map(function (z) { var o = gz(z); o.spaetererEintrag = z.kuerzel_neu_vergeben.polygonName + ' (' + z.kuerzel_neu_vergeben.polygonAbgang + ')'; return o; }) },
    emittent25Neben301: { zeilen: e25.length, jeRegel: jeFeld(e25, function (z) { return z.regel; }), jeGrund: jeFeld(e25, function (z) { return z.grund; }), regel11: { zeilen: e25r11.length, jeGrund: jeFeld(e25r11, function (z) { return z.grund; }),
      jeGrundUndBand: sortiert(jeFeld(e25r11, function (z) { return z.grund + ' | ' + z.band; })), jeWortlaut: jeFeld(e25r11, function (z) { return z.wortlaut; }) } },
    regel12: zeilen.filter(function (z) { return z.regel === 12; }).map(function (z) { var o = gz(z); o.fruehesRuege = z.quelle; o.formular25NSE = z.zusatz; o.lauf2 = z.lauf2.grund + ' (' + z.lauf2.beleg + ')'; o.auszug = z.wortlaut_auszug; return o; }),
    handeintrag: hand.map(function (z) { var R = Vje[z.reihe] || {}; return { reihe: z.reihe, anker: z.letzter_balken, polygonName: (z.polygon_firma && z.polygon_firma.name) || (z.polygon_verworfen && z.polygon_verworfen.name) || ((R.polygonEintraege || []).map(function (p) { return p.name + ' (' + p.bis + ')'; }).join('; ') || null),
      letzterKurs: z.letzter_kurs_archiv, beleg: z.beleg, firma: z.firma, weg: z.zuordnungsweg, namensprobe: z.namensprobe, alt: z.alt ? z.alt.grund + ' (' + (z.alt.firma || '-') + ')' : null, lauf2: z.lauf2.grund,
      massnahmen: (R.endeMassnahmen || []).map(function (m) { return m.art + ' ' + m.ex + ' ' + m.rolle + (m.neuesKuerzel ? ' -> ' + m.neuesKuerzel : ''); }), k123: z.k123, k23: z.k23 }; }) };
  Z.gruppen = { mantel: { regel9: Gr.mantel.regel9, regel9Klasse123: Gr.mantel.regel9Klasse123, regel9JeWortlaut: Gr.mantel.regel9JeWortlaut, regel9GrundLauf2: Gr.mantel.regel9GrundLauf2, sic6770Mit301: m6770.length, sic6770Mit301JeRegel: Gr.mantel.sic6770Mit301JeRegel, scheitertAmKurs: amKurs.length },
    ausgesetzt: { zahl: ausg.length, mitKlasse123: Gr.ausgesetzt.mitKlasse123, grundLauf2: Gr.ausgesetzt.grundLauf2, kuerzelNeuVergeben: neuV.length }, emittent25Neben301: Gr.emittent25Neben301, regel12: Gr.regel12.length, handeintrag: hand.length,
    unbekannt: { zeilen: zahl(zeilen, function (z) { return z.grund === 'unbekannt'; }), mitKlasse123: hand.length, jeBeleg: jeFeld(zeilen.filter(function (z) { return z.grund === 'unbekannt'; }), function (z) { return z.beleg; }) } };

  /* ---- Dateien ---- */
  Z3.schreibe('z3-zahlen.json', Z);
  Z3.schreibe('z3-matrix.json', { stand: Z.stand, hinweis: 'Grund vorher (Zeile) -> Grund im dritten Lauf (Spalte). Keine Tafel.', alteTafel: mAlt, lauf2: mL2 });
  Z3.schreibe('z3-kippfaelle.json', { stand: Z.stand, regel: 'kippt = Grund vorher weder unbekannt noch gleich dem neuen; freiwillig -> abgemeldet-anlass-offen zaehlt nicht', gegenLauf2: kippL2, gegenAlteTafel: kippAlt });
  Z3.schreibe('z3-totalverlust.json', { stand: Z.stand, listen: Z.totalverlust.listen, zahlen: Z.totalverlust, leselisteKlasse123Haupt: leseliste, die14: die14, haupt: { gegenLauf2: TV.haupt.gegenLauf2.reihen, gegenAlteTafel: TV.haupt.gegenAlteTafel.reihen },
    streng: { gegenLauf2: TV.streng.gegenLauf2.reihen, gegenAlteTafel: TV.streng.gegenAlteTafel.reihen } });
  Z3.schreibe('z3-wortlaut.json', Object.assign({ stand: Z.stand }, WL, { pruefprobeListe: pr ? pr.liste : null, eichprobeReihen: N.eichprobe }));
  Z3.schreibe('z3-gruppen.json', Gr);

  /* ---- Anhang (Tabellen) ---- */
  var M = [], kap = function (t) { M.push('', '## ' + t, ''); };
  function tab(m, titel) {
    M.push('| ' + titel + ' | ' + GRUENDE.join(' | ') + ' | Summe |', '|---|' + GRUENDE.map(function () { return '---'; }).join('|') + '|---|');
    GRUENDE.forEach(function (a) { var r = m[a] || {}, s = 0, zl = GRUENDE.map(function (n) { s += r[n] || 0; return r[n] ? (a === n ? String(r[n]) : '**' + r[n] + '**') : '.'; }); if (s) M.push('| ' + a + ' | ' + zl.join(' | ') + ' | ' + s + ' |'); });
  }
  function s(x) { return String(x == null ? '-' : x).replace(/\|/g, '/').replace(/\s+/g, ' '); }
  function tz(kopf, zl) { M.push('| ' + kopf.join(' | ') + ' |', '|' + kopf.map(function () { return '---'; }).join('|') + '|'); zl.forEach(function (r) { M.push('| ' + r.map(s).join(' | ') + ' |'); }); }
  M.push('# Anhang zu ZAEHLLAUF3.md (erzeugt von t4-auswerten.js, Stand ' + Z.stand + ', Wortlaut-Fassung ' + N.wortlautFassung + ')');
  kap('Matrix Grund alte Tafel (Zeile) -> Grund dritter Lauf (Spalte), ' + alte.length + ' Zeilen'); tab(mAlt, 'alt \\ Lauf 3');
  M.push('| *' + neue.length + ' neue Reihen* | ' + GRUENDE.map(function (n) { return Z.neueReihen.jeGrund[n] || '.'; }).join(' | ') + ' | ' + neue.length + ' |');
  kap('Matrix Grund zweiter Lauf (Zeile) -> Grund dritter Lauf (Spalte), ' + zeilen.length + ' Zeilen'); tab(mL2, 'Lauf 2 \\ Lauf 3');
  kap('20 gezogene Kipp-Faelle gegen den zweiten Lauf (Saat `z3-kipp`, von ' + kippL2.length + ')');
  tz(['Reihe', 'Anker', 'Lauf 2: Grund (Beleg, Datum)', 'Lauf 3: Grund (Beleg, Datum)', 'Regel', 'Ursache', 'Firma Lauf 2 -> Lauf 3', 'letzter Kurs', 'Wortlaut', 'K1-3'], G.ziehe(kippL2, 20, 'z3-kipp', function (f) { return f.reihe; }).map(function (f) {
    return [f.reihe, f.anker, f.lauf2.grund + ' (' + f.lauf2.beleg + ', ' + (f.lauf2.datum || '-') + ')', f.lauf3.grund + ' (' + f.lauf3.beleg + ', ' + (f.lauf3.datum || '-') + ')', f.regel, f.ursachen.join('+') || '-', (f.lauf2.firma || '-') + (f.lauf2.cik !== f.lauf3.cik ? ' -> ' + (f.lauf3.firma || '-') : ''), f.letzterKurs, f.wortlaut, f.k123]; }));
  kap('Die 14 Reihen des zweiten Laufs (PHASE2A.md, Klasse 1-3)');
  tz(['Reihe', 'alte Tafel', 'Lauf 2', 'Lauf 3 (Beleg, Datum, Firma)', 'Regel', 'Weg / Namensprobe', 'Wortlaut', 'Ursache', 'Totalverlust (Haupt)'], die14.map(function (x) { return [x.reihe, x.alt, x.lauf2, x.lauf3, x.regel, x.weg + ' / ' + (x.namensprobe || '-') + (x.zweit ? ' + ' + x.zweit : ''), x.wortlaut, x.ursachen.join('+') || '-', x.totalverlustHaupt]; }));
  kap('Leseliste: alle ' + leseliste.length + ' Reihen mit Klasse 1-3, die im dritten Lauf in der Hauptlesart Totalverlust sind');
  tz(['Reihe', 'Anker', 'Grund', 'Beleg (Datum)', 'Firma', 'letzter Kurs', 'Lauf 2', 'K1-3', 'Wortlaut', 'Auszug'], leseliste.map(function (x) { return [x.reihe, x.anker, x.grund, x.beleg + ' (' + (x.datum || '-') + ')', x.firma, x.letzterKurs, x.lauf2, x.k123, x.wortlaut, x.auszug]; }));
  kap('Totalverlust (Hauptlesart) gegen den zweiten Lauf geaendert, mit Klasse 1-3');
  tz(['Reihe', 'Richtung', 'Lauf 2', 'Lauf 3', 'Beleg', 'K1-3', 'K2-3'], TV.haupt.gegenLauf2.reihen.filter(function (x) { return x.k123 > 0; }).map(function (x) { return [x.reihe, x.richtung, x.vorher, x.jetzt, x.beleg, x.k123, x.k23]; }));
  kap('Regel 11: Klasse des Wortlauts x Hinweise');
  tz(['Klasse', 'Reihen', 'Grund', 'mit Fusionsbeleg (180/30)', 'mit Formular 25 des Emittenten', '3.01 hoechstens 30 Tage am Anker'].concat(BAENDER), KLASSEN.filter(function (k) { return WL.regel11.klasseMalHinweise[k]; }).map(function (k) { var x = WL.regel11.klasseMalHinweise[k];
    return [k, x.n, sortiert(x.grund).map(function (p) { return p[0] + ' ' + p[1]; }).join(', '), x.mitFusionsbeleg, x.mitEmittent25, x.hoechstens30TageAmAnker].concat(BAENDER.map(function (b) { return x.band[b] || 0; })); }));
  if (pr) { kap('Pruefprobe: 40 Reihen der Regel 11 (Saat `z3-pruef`), Klasse gegen meine Lesart des Auszugs');
    tz(['Reihe', 'Klasse', 'meine Lesart', 'stimmt', 'Tage zum Anker', 'Kursband', 'Anmerkung'], pr.liste.map(function (x) { return [x.reihe, x.klasse + (x.abschnitt ? '' : ' (kein Abschnitt)'), x.lesart, x.stimmt ? 'ja' : '**nein**', x.tageZumAnker, x.band, x.anmerkung]; })); }
  kap('Ausgesetzte Werte (Regel 10), alle ' + ausg.length);
  tz(['Reihe', 'Anker', 'letzter Kurs', 'Polygon-Abgang (Tage nach Anker)', 'Ende-Massnahme danach', 'Wortlaut 3.01', 'Firma', 'Lauf 2', 'K1-3'], Gr.ausgesetzt.reihen.map(function (x) { return [x.reihe, x.anker, x.letzterKurs, x.polygonAbgang ? x.polygonAbgang + ' (' + x.tageNachAnker + ')' : '-', x.massnahmeDanach, x.wortlaut, x.firma, x.lauf2, x.k123]; }));
  if (neuV.length) { M.push('', 'Nicht als ausgesetzt gezaehlt, weil das Kuerzel neu vergeben ist (' + neuV.length + '): ' + Gr.ausgesetzt.kuerzelNeuVergeben.map(function (x) { return x.reihe + ' (' + x.firma + ' / spaeter ' + x.spaetererEintrag + '; jetzt ' + x.grund + ')'; }).join('; ')); }
  kap('Mantelgesellschaften: SIC 6770 mit 8-K 3.01 nach V3, die am Kurs scheitern (' + amKurs.length + ')');
  tz(['Reihe', 'Anker', 'letzter Kurs', 'Grund', 'Beleg', 'Wortlaut', 'Firma'], Gr.mantel.scheitertAmKurs.map(function (x) { return [x.reihe, x.anker, x.letzterKurs, x.grund, x.beleg, x.wortlaut, x.firma]; }));
  kap('Regel 12 (fruehe Ruege + 25-NSE), alle ' + Gr.regel12.length);
  tz(['Reihe', 'Anker', 'fruehes 8-K 3.01', 'Formular 25-NSE', 'letzter Kurs', 'Lauf 2', 'K1-3', 'Auszug'], Gr.regel12.map(function (x) { return [x.reihe, x.anker, x.fruehesRuege, x.formular25NSE, x.letzterKurs, x.lauf2, x.k123, x.auszug]; }));
  kap('Liste fuer den Handeintrag (V6): Klasse 1-3 und unbekannt, ' + hand.length + ' Reihen');
  tz(['Reihe', 'Anker', 'Polygon-Name', 'letzter Kurs', 'Beleg', 'gelesene Firma (Weg)', 'alte Tafel', 'Lauf 2', 'Massnahmen-Dateien', 'K1-3'], Gr.handeintrag.map(function (x) { return [x.reihe, x.anker, x.polygonName, x.letzterKurs, x.beleg, (x.firma || '-') + ' (' + x.weg + (x.namensprobe ? ', Probe ' + x.namensprobe : '') + ')', x.alt, x.lauf2, x.massnahmen.join('; ') || 'kein Ende-Satz', x.k123]; }));
  fs.writeFileSync(path.join(Z3.HIER, 'z3-anhang.md'), M.join('\n') + '\n');

  /* ---- Konsole: nur Zaehlungen ---- */
  function p(t, o) { console.log(t + ' ' + JSON.stringify(o)); }
  p('TAFEL', Z.tafelImGanzen); p('NEUE', Z.neueReihen); p('KIPP alt', Z.kipp.gegenAlteTafel); p('KIPP lauf2', Z.kipp.gegenLauf2); p('OHNE REGEL', Z.kipp.andererGrundOhneRegel); p('JE REGEL STROM', Z.aenderungGegenLauf2JeRegel);
  p('TV', Z.totalverlust); p('WORTLAUT', { regel11: { jeKlasse: WL.regel11.jeKlasse, jeTabellenzeile: WL.regel11.jeTabellenzeile, jeStand: WL.regel11.jeStand }, r9bis12: WL.regeln9bis12, lern: WL.lernprobe, pruef: WL.pruefprobe, eich: WL.eichprobe });
  p('KLASSExHINWEIS', WL.regel11.klasseMalHinweise); p('AUSSEN a', Z.aussen.a_namensprobe); p('AUSSEN b', bl);
  p('AUSSEN c', { jeSorte: Z.aussen.c_v8.jeSorte, andere: Z.aussen.c_v8.andereMassnahmeAlsBisher, aendertGrund: Z.aussen.c_v8.davonAendertDenGrund, v8Grund: Z.aussen.c_v8.v8AendertDenGrund, aufnehmend: Z.aussen.c_v8.nurAufnehmendeSeite, strom: Z.aussen.c_v8.grundwechselDurchV8 });
  p('GRUPPEN', Z.gruppen); p('DIE14', die14.map(function (x) { return x.reihe + ': ' + x.lauf3 + ' [R' + x.regel + ', ' + x.weg + '/' + (x.namensprobe || '-') + (x.zweit ? '+zweit' : '') + ', ' + (x.wortlaut || '-') + ', TV ' + x.totalverlustHaupt + ']'; }));
  console.log('LESELISTE ' + leseliste.length + ': ' + leseliste.map(function (x) { return x.reihe + ' ' + x.beleg.replace('edgar-', '').replace('8K-', '') + ' ' + x.letzterKurs; }).join('; '));
  console.log('HANDEINTRAG ' + hand.length + ': ' + hand.map(function (x) { return x.reihe; }).join(' '));
}

module.exports = { vergleiche: vergleiche, tvIn: tvIn, HAUPT: HAUPT, STRENG: STRENG, NEUER_GRUND: NEUER_GRUND };
if (require.main === module) main();
