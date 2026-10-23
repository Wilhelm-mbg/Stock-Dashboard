'use strict';
/* Nr. 121-2b D: Rueckwirkung der Kostenregel (Eroeffnung + IBKR Fixed, 5.263 $) auf die 13 Konfigurationen, OFFLINE aus den versiegelten Protokollen
 * (kein Neulauf, keine neuen Renditen; die Nachmessung entscheidet der PM). Naeherung, weil die Protokolle je Trade keinen Kurs und nur vier
 * Klassenzaehler (nK) tragen:
 *   neue Huerde je Trade kNeu = Summe nK[k] x Huerde(k, eroeffnung, 5.263 $, Median-Kurs der Klasse) / Summe nK  (Klasse 5 nicht trennbar -> Klasse 4, vorsichtig)
 *   netto neu = brutto - (brutto - netto alt) x kNeu / kAlt   (die Tagesgewichtung der alten Huerde bleibt erhalten)
 *   se neu = se alt (die Huerde schwankt von Tag zu Tag kaum gegen die Renditen; Kalibrierung: se 0,1225 -> 0,1225 / 0,1720 -> 0,1725)
 * Urteile: (1) nach den Regeln von Nr. 121-2a (Machbarkeitstor mit der Behauptung netto = brutto der Quelle - kNeu, Streuungsfaktor 1,4, m sequentiell
 * in Register-Reihenfolge, "nicht messbar" zaehlt 0) und (2) die alte Urteilsregel des Protokolls (nein = obere 95-%-Grenze netto < 0 bei >= 30 Tagen,
 * sonst nicht entscheidbar; Kandidat t >= Schwelle). Groessenaussage unveraendert (sie steht auf brutto). Aufruf: node pruefstrasse/rueckwirkung-2b.js [<aus.json>]
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
var fs = require('fs'), path = require('path');
var R = path.join(__dirname, '/');
var K = require(R + 'konfig.js'), TO = require(R + 'tore.js'), KO = require(R + 'kosten.js');
var Rg = JSON.parse(fs.readFileSync(R + 'register.json', 'utf8'));
var reihenfolge = []; Rg.konfigurationen.forEach(function (e) { if (reihenfolge.indexOf(e.kennung) === -1) reihenfolge.push(e.kennung); });
var HNEU = [0, 1, 2, 3].map(function (k) { return KO.huerdeUmlauf(k, 'eroeffnung', K.POSITION_USD, null).gesamtPp; });
function f(x, n) { return x == null ? '–' : x.toFixed(n == null ? 3 : n).replace('.', ','); }
var mBisher = 0, zeilen = [];
reihenfolge.forEach(function (kn) {
  var E = JSON.parse(fs.readFileSync(R + 'erledigt/' + kn + '/ergebnis.json', 'utf8')), kand = JSON.parse(fs.readFileSync(R + 'warteschlange/' + kn + '/kandidat.json', 'utf8'));
  if (!E.entdeckung || E.entdeckung.machbarkeit) return;
  var konf = E.entdeckung.konfigurationen, modus = E.entdeckung.bewertung || 'topf', TE = E.entdeckung.TE, mTor = mBisher + konf.length;
  var je = konf.map(function (k) {
    var e = k.entdeckung, er = TO.erwartungFuer(kand, k.key), N = 0, S = 0;
    e.nK.forEach(function (n, i) { N += n; S += n * HNEU[i]; });
    var kNeu = S / N, kAlt = e.kKand, dAlt = e.uBrutto.mittel - e.uNetto.mittel, nettoNeu = e.uBrutto.mittel - dAlt * kNeu / kAlt, se = e.uNetto.se;
    var behauptungNeu = er.bruttoPp - kNeu, sj = e.nTage / TE * 252;
    var M = TO.machbarkeit({ H: k.haltedauer, nT: e.nTage, d: e.tradesJeTag || e.nTr / e.nTage, modus: modus, nettoPp: behauptungNeu, m: mTor, signaltageJeJahr: sj });
    if (M.messbar && e.nTage < K.MIN_TAGE) M.messbar = false;
    return { k: k, e: e, er: er, M: M, kNeu: kNeu, kAlt: kAlt, nettoNeu: nettoNeu, se: se, behauptungNeu: behauptungNeu };
  });
  var messbar = je.filter(function (x) { return x.M.messbar; }), mLauf = mBisher + messbar.length;
  je.forEach(function (x) {
    var k = x.k, e = x.e, tNeu = x.nettoNeu / x.se, obereNeu = x.nettoNeu + 1.96 * x.se, schwelleAlt = TO.kandidatSchwelle(Math.max(1, e.uNetto.nEff - 1), konf.length);
    var altRegel = (x.nettoNeu > 0 && tNeu >= schwelleAlt.t && e.nTage >= K.MIN_TAGE) ? 'Kandidat' : (obereNeu < 0 && e.nTage >= K.MIN_TAGE) ? 'nein' : 'nicht entscheidbar';
    var altRegelVorher = (e.uNetto.mittel > 0 && e.uNetto.t >= schwelleAlt.t && e.nTage >= K.MIN_TAGE) ? 'Kandidat' : (e.uNetto.obere < 0 && e.nTage >= K.MIN_TAGE) ? 'nein' : 'nicht entscheidbar';
    var neu2a = x.M.messbar ? 'messbar (Urteil nach Lauf)' : 'nicht messbar';
    zeilen.push({ kennung: kn, key: k.key, H: k.haltedauer, modus: modus, nT: e.nTage, brutto: e.uBrutto.mittel, nettoAlt: e.uNetto.mittel, tAlt: e.uNetto.t, kAlt: x.kAlt, kNeu: x.kNeu, nettoNeu: x.nettoNeu, tNeu: tNeu, se: x.se,
      mde80: K.MDE_FAKTOR * x.se, obereAlt: e.uNetto.obere, obereNeu: obereNeu, urteilProtokoll: k.urteil, altRegelVorher: altRegelVorher, altRegelNeu: altRegel,
      behauptungAlt: x.er.nettoPp, behauptungNeu: x.behauptungNeu, bruttoPp: x.er.bruttoPp, messbarNeu: x.M.messbar, links: x.M.links, braeuchte: x.M.braeuchteSignaltage, urteil2aNeu: neu2a, mTor: mTor,
      groesse: TO.groessenAussage(e.uBrutto.obere, x.er.bruttoPp, x.er.fensterWieQuelle) });
  });
  mBisher += messbar.length;
});
if (process.argv[2]) fs.writeFileSync(process.argv[2], JSON.stringify({ huerdeNeuJeKlasse: HNEU, zeilen: zeilen }, null, 1));
console.log('Neue Huerde je Klasse (Eroeffnung + IBKR Fixed, 5.263 $, Median-Kurs): ' + HNEU.map(function (h) { return f(h, 4); }).join(' / ') + ' Pp je Umlauf');
console.log('| Kennung | Konf | Modus | n_T | brutto | Huerde alt → neu | netto alt → neu | t alt → neu | se | MDE80 | obere netto alt → neu | Urteil (alte Regel) alt → neu | Behauptung netto alt → neu (brutto) | Machbarkeit 2a-Regeln neu | Groessenaussage |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
zeilen.forEach(function (z) {
  console.log('| ' + z.kennung + ' | ' + z.key + ' | ' + z.modus + ' | ' + z.nT + ' | ' + f(z.brutto, 4) + ' | ' + f(z.kAlt, 4) + ' → ' + f(z.kNeu, 4) + ' | ' + f(z.nettoAlt, 4) + ' → ' + f(z.nettoNeu, 4) + ' | ' + f(z.tAlt, 2) + ' → ' + f(z.tNeu, 2) + ' | ' + f(z.se, 4) + ' | ' + f(z.mde80, 3) +
    ' | ' + f(z.obereAlt, 3) + ' → ' + f(z.obereNeu, 3) + ' | ' + z.altRegelVorher + ' → ' + z.altRegelNeu + ' | ' + f(z.behauptungAlt, 2) + ' → ' + f(z.behauptungNeu, 2) + ' (' + f(z.bruttoPp, 2) + ') | ' + (z.messbarNeu ? 'messbar' : 'nicht messbar') + ' (' + f(z.links, 3) + ') | ' + (z.groesse || 'nein') + ' |');
});
var geaendert = zeilen.filter(function (z) { return z.altRegelVorher !== z.altRegelNeu; });
console.log('\n' + zeilen.length + ' Konfigurationen; alte Urteilsregel geaendert: ' + geaendert.length + (geaendert.length ? ' (' + geaendert.map(function (z) { return z.kennung + ' ' + z.key + ': ' + z.altRegelVorher + ' → ' + z.altRegelNeu; }).join('; ') + ')' : '') +
  '; nach den 2a-Regeln messbar: ' + zeilen.filter(function (z) { return z.messbarNeu; }).length + ' von ' + zeilen.length + '.');
