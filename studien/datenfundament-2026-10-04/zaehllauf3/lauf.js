'use strict';
/* ZAEHLLAUF 3, Schritt 3 - der Lauf der Einstufung (Auftrag Nr. 90). Ersetzt main() der Kopie t4-einstufen.js.
 *
 * Je Reihe: die Einstufung mit allen Regeln (V1 V2 V3 V3b V5i V5iii V7 V8) und daneben achtmal mit je EINER Regel aus -
 * `ohne[Regel]` traegt den Grund, den die Zeile dann haette (nur wo er anders ist). Die Meldungstexte kommen aus dem
 * Cache edgar/texte/ (texte.js); fehlt einer, gilt die Klasse 'nichts' mit Stand 'text-fehlt' und die Akzession kommt in
 * z3-textbedarf.json - texte.js holt sie, dann laeuft dieser Schritt noch einmal (bis der Bedarf leer ist).
 * Dazu die Eichprobe (bekannte Wahrheit) mit den Wortlisten der Fassung W.FASSUNG.
 *
 * Aufruf:  node lauf.js
 * Liest:   z3-verschwundene.json, z3-edgar-zuordnung.json, die alte Tafel, ../phase2/t4-gruende-neu.json (nur lesen)
 * Schreibt: z3-gruende-neu.json (Arbeitsdatei, KEINE Tafel), z3-textbedarf.json
 */
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var E = require('./t4-einstufen.js');
var W = require('./wortlaut.js');

var TEXTE = path.join(__dirname, 'edgar', 'texte');
var VARIANTEN = ['V1', 'V2', 'V3', 'V3b', 'V5i', 'V5iii', 'V7', 'V8'];
var FENSTER_JE_ART = [[['name_changes'], 60], [['cash_mergers', 'stock_and_cash_mergers'], 90], [['stock_mergers'], 90], [['redemptions'], 90], [['worthless_removals'], 180]];

/** Texte aus dem Cache: { text } | { fehlt } | null (noch nicht geholt). */
function textLeser() {
  var memo = {};
  return function (a) {
    if (memo[a] !== undefined) return memo[a];
    var j = Z3.lies(path.join(TEXTE, a + '.json'));
    return (memo[a] = j ? (j.fehlt ? { fehlt: 1 } : { text: j.text }) : null);
  };
}
/** Aussenpruefung V8 (reine Regel): die Massnahme, die der zweite Lauf sah (die juengste der Datei, wenn sie im Fenster
 *  ihrer Regel liegt - gleich in welcher Rolle), gegen die des dritten (abgebende Seite, dem Anker am naechsten, Rang der Arten). */
function v8Vergleich(R) {
  var j = R.massnahmeEnde, jf = j ? FENSTER_JE_ART.filter(function (x) { return x[0].indexOf(j.art) !== -1; })[0] : null;
  var jungDrin = !!(j && jf && E.imFenster(j.ex, R.letzterBalken, jf[1]));
  var jm = j ? (R.endeMassnahmen || []).filter(function (m) { return m.id === j.id && m.ex === j.ex; })[0] : null;
  var neu = null;
  FENSTER_JE_ART.forEach(function (x) { if (!neu) neu = E.endeFuer(R, E.ALLE_AN, x[0], x[1]); });
  var sorte = !jungDrin && !neu ? 'keine' : jungDrin && neu && neu.id === j.id ? 'gleich' : jungDrin && neu ? 'andere' : neu ? 'nur-neu' : 'nur-alt';
  return { sorte: sorte, alt: jungDrin ? j.art + ' ' + j.ex : null, altRolle: jm ? jm.rolle : null, neu: neu ? neu.art + ' ' + neu.ex : null, juengsteAusserhalb: j && !jungDrin ? j.art + ' ' + j.ex : null };
}

function main() {
  var ED = require('./t4-edgar.js');
  var V = G.json(path.join(__dirname, 'z3-verschwundene.json')), Zu = G.json(path.join(__dirname, 'z3-edgar-zuordnung.json')), zuord = Zu.zuordnung || {};
  var alt = {}, lauf2 = {};
  G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json')).reihen.forEach(function (x) { alt[x.reihe] = x; });
  G.json(path.join(Z3.P2, 't4-gruende-neu.json')).reihen.forEach(function (x) { lauf2[x.reihe] = x; });
  var hatBalken = E.hatBalkenKarte(), bd = E.bigdataFunde(), lebendAb = E.ms(V.lebendAb);
  var text = textLeser(), bedarf = {};
  var tafel = [], zaehler = {}, belege = {}, regeln = {}, offen = 0, ohneZ = {};
  VARIANTEN.forEach(function (k) { ohneZ[k] = 0; });
  function kurz(x) { return x ? { grund: x.grund, datum: x.datum, quelle: x.quelle, beleg: x.beleg, cik: x.cik, firma: x.firma, zuordnungsweg: x.zuordnungsweg, preis_je_aktie: x.preis_je_aktie, letzter_balken: x.letzter_balken } : null; }
  V.reihen.forEach(function (R) {
    var z = zuord[R.reihe];
    if (!z || !z.fertig) { offen++; return; }
    var von = G.tagPlus(R.letzterBalken, -E.VOR), bis = G.tagPlus(R.letzterBalken, E.NACH);
    function lade(cik) { return cik ? ED.lokal(cik, von, bis).S : null; }
    var S = lade(z.cik);
    if (z.cik && !S) { offen++; return; }
    if (z.zweit) S = E.vereinige(S, lade(z.zweit.cik));                                   // V1: beide Auszuege zusammen
    var O = Object.assign({}, E.ALLE_AN, { text: text, bedarf: bedarf });
    var u = E.stufeEin(R, z, S, hatBalken, lebendAb, bd, O);
    u.ohne = {};
    VARIANTEN.forEach(function (k) {
      var Ok = Object.assign({}, O), zk = z, Sk = S;
      Ok[k] = 0;
      if (k === 'V1') {                                                                    // ohne V1 = R-a: die Polygon-CIK ohne Namensprobe, kein zweiter Registrant
        if (!R.polygonFirma || (z.weg === 'polygon-cik' && !z.zweit)) return;
        zk = { cik: R.polygonFirma.cik, name: R.polygonFirma.name, weg: 'polygon-cik', sicherheit: 'stark' };
        Sk = lade(zk.cik);
      }
      var uk = E.stufeEin(R, zk, Sk, hatBalken, lebendAb, bd, Ok);
      if (uk.grund !== u.grund) { u.ohne[k] = { grund: uk.grund, beleg: uk.beleg }; ohneZ[k]++; }
    });
    if (u.signale.i301v3) {
      var ak = /^EDGAR:(\S+)/.exec(u.signale.i301v3)[1], e0 = ((S && S.einreichungen) || []).filter(function (x) { return x.a === ak; })[0];
      u.i301v3_akz = ak; u.i301v3_cik = (e0 && e0.c) || (S && S.cik) || u.cik;
    }
    u.letzter_balken_alt = R.letzterBalkenAlt; u.anker_diff_tage = R.ankerDiffTage; u.neu = R.neu; u.polygon_firma = R.polygonFirma || null;
    u.polygon_verworfen = z.polygonVerworfen || null; u.durchgang1 = z.durchgang1 || null; u.band = Z3.band(R.letzterKursArchiv);
    u.alt = kurz(alt[R.reihe]); u.lauf2 = kurz(lauf2[R.reihe]); u.v8 = v8Vergleich(R);
    tafel.push(u);
    zaehler[u.grund] = (zaehler[u.grund] || 0) + 1; belege[u.beleg] = (belege[u.beleg] || 0) + 1; regeln[u.regel] = (regeln[u.regel] || 0) + 1;
  });

  /* ---- Eichprobe mit bekannter Wahrheit (ohne Urteil): Klasse des 8-K 3.01 bei Uebernahmen laut Alpaca und bei Q-Kuerzeln ---- */
  function eich(u) {
    var w = E.wortlautVon({ a: u.i301v3_akz }, { text: text, bedarf: bedarf, _S: { cik: u.i301v3_cik } });
    return { reihe: u.reihe, regel: u.regel, beleg: u.beleg, akz: u.i301v3_akz, tage: u.signale.i301v3_tage, klasse: w.klasse, stand: w.stand, auszug: w.auszug, band: u.band };
  }
  var kandA = tafel.filter(function (u) { return (u.regel === 2 || u.regel === 3) && u.i301v3_akz && Math.abs(u.signale.i301v3_tage) <= E.NAH_TAGE; });
  var kandB = tafel.filter(function (u) { return u.regel === 0 && u.i301v3_akz; });
  var eichA = G.ziehe(kandA, 150, 'z3-eich-a', function (u) { return u.reihe; }).map(eich);
  var eichB = (kandB.length > 100 ? G.ziehe(kandB, 100, 'z3-eich-b', function (u) { return u.reihe; }) : kandB).map(eich);

  var bl = Object.keys(bedarf).sort().map(function (a) { return { a: a, cik: bedarf[a] }; });
  Z3.schreibe('z3-textbedarf.json', bl);
  var out = { kennung: Z3.KENNUNG, stand: new Date().toISOString(), regeln: E.REGELN, wortlautFassung: W.FASSUNG, anker: 'letzter Minutentag', fenster: { vorTage: E.VOR, nachTage: E.NACH, v3: [E.V3_VOR, E.V3_NACH] },
    edgar: Zu.summe || null, offen: offen, textbedarf: bl.length, zaehler: zaehler, belegarten: belege, jeRegel: regeln, andererGrundOhneRegel: ohneZ,
    eichprobe: { a: { regel: 'Regeln 2 und 3 mit 8-K 3.01 hoechstens 30 Tage am Anker; 150 gezogen, Saat z3-eich-a; erwartet vollzug, nie ruege', kandidaten: kandA.length, reihen: eichA },
      b: { regel: 'Regel 0 (Q-Kuerzel) mit 8-K 3.01 nach V3; alle, hoechstens 100 (Saat z3-eich-b); erwartet ruege', kandidaten: kandB.length, reihen: eichB } },
    n: tafel.length, reihen: tafel };
  Z3.schreibe('z3-gruende-neu.json', out);
  console.log('eingestuft', tafel.length, 'offen', offen, '| Wortlaut-Fassung', W.FASSUNG, '| Textbedarf', bl.length);
  console.log('Grund:', JSON.stringify(zaehler));
  console.log('Regel:', JSON.stringify(regeln));
  console.log('Beleg:', JSON.stringify(belege));
  console.log('anderer Grund ohne Regel:', JSON.stringify(ohneZ));
  console.log('Eichprobe: a', kandA.length, '->', eichA.length, '| b', kandB.length, '->', eichB.length);
}

module.exports = { main: main, v8Vergleich: v8Vergleich, VARIANTEN: VARIANTEN, textLeser: textLeser };
if (require.main === module) main();
