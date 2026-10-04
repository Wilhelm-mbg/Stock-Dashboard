'use strict';
/* ZAEHLLAUF 4, Schritt 4 - der Lauf der Einstufung (Auftrag Nr. 92). KOPIE von ../zaehllauf3/lauf.js, fuer den vierten Lauf
 * umgeschrieben (die Eichprobe des dritten Laufs entfaellt; die Wortlisten sind unveraendert Fassung 2).
 *
 * Je Reihe: die Einstufung mit allen Regeln und daneben je EINE der Aenderungen aus (V9 E1 E2 E3 E4 E5 E6, dazu E7 zur
 * Auskunft) - `ohne[Aenderung]` traegt den Grund, den die Zeile dann haette (nur wo er anders ist). "Ohne E6" heisst: die
 * Firma aus der Zuordnung des dritten Laufs. Dazu die Gegenprobe "alle sieben (und E7) aus, Zuordnung des dritten Laufs"
 * gegen ../zaehllauf3/z3-gruende-neu.json (muss in jeder Zeile denselben Grund ergeben).
 * Meldungstexte: erst edgar/texte/ dieses Ordners, dann der Cache des dritten Laufs (nur lesen); fehlt einer, kommt die
 * Akzession in z4-textbedarf.json - texte.js holt sie, dann laeuft dieser Schritt noch einmal (bis der Bedarf leer ist).
 *
 * Aufruf:  node lauf.js
 * Liest:   z4-verschwundene.json, z4-edgar-zuordnung.json, ../zaehllauf3/z3-edgar-zuordnung.json, ../zaehllauf3/z3-gruende-neu.json,
 *          die alte Tafel (nur lesen)
 * Schreibt: z4-gruende-neu.json (Arbeitsdatei, KEINE Tafel), z4-textbedarf.json
 */
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var E = require('./t4-einstufen.js');
var W = require('./wortlaut.js');

var TEXTE = path.join(__dirname, 'edgar', 'texte'), TEXTE3 = path.join(Z3.Z3ORDNER, 'edgar', 'texte');
var VARIANTEN = ['V9', 'E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7'];
var NEUE_AUS = { V9: 0, E1: 0, E2: 0, E3: 0, E4: 0, E5: 0, E6: 0, E7: 0 };

/** Texte aus dem Cache: { text } | { fehlt } | null (noch nicht geholt). Eigener Cache vor dem des dritten Laufs. */
function textLeser() {
  var memo = {};
  return function (a) {
    if (memo[a] !== undefined) return memo[a];
    var j = Z3.lies(path.join(TEXTE, a + '.json')) || Z3.lies(path.join(TEXTE3, a + '.json'));
    return (memo[a] = j ? (j.fehlt ? { fehlt: 1 } : { text: j.text }) : null);
  };
}
function kurz(x) { return x ? { grund: x.grund, datum: x.datum, quelle: x.quelle, beleg: x.beleg, regel: x.regel === undefined ? null : x.regel, cik: x.cik, firma: x.firma, zuordnungsweg: x.zuordnungsweg, preis_je_aktie: x.preis_je_aktie, letzter_balken: x.letzter_balken, wortlaut: x.wortlaut || null } : null; }

function main() {
  var ED = require('./t4-edgar.js');
  var V = G.json(path.join(__dirname, 'z4-verschwundene.json')), Zu = G.json(path.join(__dirname, 'z4-edgar-zuordnung.json')), zuord = Zu.zuordnung || {};
  var zuord3 = G.json(path.join(Z3.Z3ORDNER, 'z3-edgar-zuordnung.json')).zuordnung || {};
  var alt = {}, lauf3 = {};
  G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json')).reihen.forEach(function (x) { alt[x.reihe] = x; });
  G.json(path.join(Z3.Z3ORDNER, 'z3-gruende-neu.json')).reihen.forEach(function (x) { lauf3[x.reihe] = x; });
  var hatBalken = E.hatBalkenKarte(), bd = E.bigdataFunde(), lebendAb = E.ms(V.lebendAb);
  var text = textLeser(), bedarf = {};
  var tafel = [], zaehler = {}, belege = {}, regeln = {}, offen = 0, ohneZ = {}, gegenprobe = { gleich: 0, anders: 0, andersReihen: [] }, ausloeser = { geprueft: 0, anders: 0, reihen: [] };
  VARIANTEN.forEach(function (k) { ohneZ[k] = 0; });
  V.reihen.forEach(function (R) {
    var z = zuord[R.reihe];
    if (!z || !z.fertig) { offen++; return; }
    var von = G.tagPlus(R.letzterBalken, -E.VOR), bis = G.tagPlus(R.letzterBalken, E.NACH);
    function lade(zz) {
      if (!zz || !zz.cik) return null;
      var S0 = ED.lokal(zz.cik, von, bis).S;
      if (!S0) return undefined;
      return zz.zweit ? E.vereinige(S0, ED.lokal(zz.zweit.cik, von, bis).S) : S0;   // V1: beide Auszuege zusammen
    }
    var S = lade(z);
    if (S === undefined) { offen++; return; }
    var O = Object.assign({}, E.ALLE_AN, { text: text, bedarf: bedarf });
    var u = E.stufeEin(R, z, S, hatBalken, lebendAb, bd, O);
    var z3 = zuord3[R.reihe] || z, S3 = (z3 === z) ? S : lade(z3);
    u.ohne = {};
    VARIANTEN.forEach(function (k) {
      var Ok = Object.assign({}, O), zk = z, Sk = S;
      if (k === 'E6') { if (z3 === z || !z.e6betroffen) return; zk = z3; Sk = S3; }
      else Ok[k] = 0;
      var uk = E.stufeEin(R, zk, Sk === undefined ? null : Sk, hatBalken, lebendAb, bd, Ok);
      if (uk.grund !== u.grund) { u.ohne[k] = { grund: uk.grund, beleg: uk.beleg }; ohneZ[k]++; }
    });
    /* Gegenprobe: alle Aenderungen aus + Zuordnung des dritten Laufs = dritter Lauf */
    var l3 = lauf3[R.reihe];
    if (l3) {
      var u0 = E.stufeEin(R, z3, S3 === undefined ? null : S3, hatBalken, lebendAb, bd, Object.assign({}, O, NEUE_AUS, { bedarf: {} }));
      if (u0.grund === l3.grund && u0.beleg === l3.beleg) gegenprobe.gleich++; else { gegenprobe.anders++; if (gegenprobe.andersReihen.length < 30) gegenprobe.andersReihen.push(R.reihe + ' ' + l3.grund + '/' + l3.beleg + ' -> ' + u0.grund + '/' + u0.beleg); }
    }
    /* Ausloeser von Durchgang 2 (nur Reihen auf dem Suchweg, die E6 nicht betrifft): Einstufung ohne Text unter den Regeln
     * des dritten bzw. des vierten Laufs (ohne V9) - wo sie sich bei "unbekannt" unterscheiden, haette Durchgang 2 anders gesucht. */
    if (z.weg !== 'polygon-cik' && z.weg !== 'alte-tafel-polygon-name' && !z.e6betroffen && !z.durchgang1) {
      ausloeser.geprueft++;
      var a3 = E.stufeEin(R, z, S, hatBalken, lebendAb, null, Object.assign({}, E.ALLE_AN, NEUE_AUS)).grund === 'unbekannt';
      var a4 = E.stufeEin(R, z, S, hatBalken, lebendAb, null, Object.assign({}, E.ALLE_AN, { V9: 0 })).grund === 'unbekannt';
      if (a3 !== a4) { ausloeser.anders++; ausloeser.reihen.push(R.reihe + (a4 ? ' jetzt unbekannt' : ' jetzt mit Grund')); }
    }
    if (u.signale.i301v3) {
      var ak = /^EDGAR:(\S+)/.exec(u.signale.i301v3)[1], e0 = ((S && S.einreichungen) || []).filter(function (x) { return x.a === ak; })[0];
      u.i301v3_akz = ak; u.i301v3_cik = (e0 && e0.c) || (S && S.cik) || u.cik;
    }
    u.letzter_balken_alt = R.letzterBalkenAlt; u.anker_diff_tage = R.ankerDiffTage; u.neu = R.neu; u.polygon_firma = R.polygonFirma || null;
    var pa = Z3.polygonAmAnker(R); u.polygon_name = pa ? pa.name : null;
    u.polygon_verworfen = z.polygonVerworfen || null; u.durchgang1 = z.durchgang1 || null;
    u.band = Z3.band(R.letzterKursRoh == null ? null : R.letzterKursRoh); u.band_archiv = Z3.band(R.letzterKursArchiv);   // E7
    u.panel = R.panel || null; u.kurs_faktor = R.kursFaktor || null;
    if (R.zwillingKandidaten && R.zwillingKandidaten.length) u.zwilling_kandidaten = R.zwillingKandidaten;
    if (R.zwilling) u.zwilling_info = R.zwilling;
    u.e6 = z.e6betroffen ? { betroffen: 1, lauf3: z.lauf3 || null, polygonName: z.e6polygonName || null, probe: (z.e6 && z.e6.probe) || (z.e6durchgang1 && z.e6durchgang1.probe) || null, verworfen: (z.e6 && z.e6.verworfen) || null, abgelehnt2: z.e6abgelehnt2 || null } : null;
    u.alt = kurz(alt[R.reihe]); u.lauf3 = kurz(l3);
    tafel.push(u);
    zaehler[u.grund] = (zaehler[u.grund] || 0) + 1; belege[u.beleg] = (belege[u.beleg] || 0) + 1; regeln[u.regel] = (regeln[u.regel] || 0) + 1;
  });

  var bl = Object.keys(bedarf).sort().map(function (a) { return { a: a, cik: bedarf[a] }; });
  Z3.schreibe('z4-textbedarf.json', bl);
  var out = { kennung: Z3.KENNUNG, stand: new Date().toISOString(), regeln: E.REGELN, wortlautFassung: W.FASSUNG, anker: 'letzter Minutentag', fenster: { vorTage: E.VOR, nachTage: E.NACH, v3: [E.V3_VOR, E.V3_NACH] },
    edgar: Zu.summe || null, offen: offen, textbedarf: bl.length, zaehler: zaehler, belegarten: belege, jeRegel: regeln, andererGrundOhneAenderung: ohneZ, gegenprobeLauf3: gegenprobe, durchgang2Ausloeser: ausloeser,
    n: tafel.length, reihen: tafel };
  Z3.schreibe('z4-gruende-neu.json', out);
  console.log('eingestuft', tafel.length, 'offen', offen, '| Wortlaut-Fassung', W.FASSUNG, '| Textbedarf', bl.length);
  console.log('Grund:', JSON.stringify(zaehler));
  console.log('Regel:', JSON.stringify(regeln));
  console.log('anderer Grund ohne Aenderung:', JSON.stringify(ohneZ));
  console.log('Gegenprobe alle aus = Lauf 3:', gegenprobe.gleich, 'gleich,', gegenprobe.anders, 'anders', gegenprobe.andersReihen.slice(0, 5).join(' | '));
  console.log('Ausloeser Durchgang 2 anders:', ausloeser.anders, 'von', ausloeser.geprueft);
}

module.exports = { main: main, VARIANTEN: VARIANTEN, NEUE_AUS: NEUE_AUS, textLeser: textLeser };
if (require.main === module) main();
