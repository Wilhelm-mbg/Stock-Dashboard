'use strict';
/* T2, Schritt 1 - KOPIE von studien/verschwundene-gruende-2026-09-12/universum.js fuer den Trockenlauf (Auftrag Nr. 79).
 *
 * Das Original bleibt unangetastet. Zwei Aenderungen (Klaerung 3 des Auftrags), sonst dieselbe Logik:
 *   AENDERUNG 1 - der Anker `letzterBalken` ist der letzte MINUTENTAG der Reihe (Manifest des Minutenarchivs),
 *                 nicht mehr der letzte Tagesbalken aus _lebenszeit.json.
 *   AENDERUNG 2 - "nicht lebend" folgt der Regel aus T1: der letzte Minutentag liegt mehr als X Handelstage vor dem
 *                 Ende des Archivs (Trockenlauf X = 10; X = 0, 5, 20 als Empfindlichkeit).
 *
 * Eingestuft werden nur (Klaerung 3): Zeilen der alten Tafel, deren Anker sich um mehr als 3 Tage aendert, und alle
 * neu hinzukommenden Reihen. Damit die Empfindlichkeit ohne zweiten Lauf zaehlbar ist, steht die Obermenge (X = 0)
 * in der Arbeitsdatei, je Reihe mit dem kleinsten X, ab dem sie als lebend gaelte (`lebendAbX`).
 *
 * Liest NUR. Schreibt: t2-verschwundene.json (Arbeitsdatei fuer t2-edgar.js) in DIESEN Ordner.
 */
var fs = require('fs');
var path = require('path');
var G = require('./gemeinsam.js');

var KANAL = path.join(G.REPO, 'studien', 'vorregistrierung-2026-09-08-trendkanal-tage');

/* letzter Schlusskurs aus den Tagesdateien der Kanalstudie - wie im Original, aber nur fuer die gefragte Reihe */
function schlussVon(reihe) {
  for (var d = 0; d < 4; d++) {
    var p = path.join(KANAL, 'tage-' + d, reihe + '.json');
    if (!fs.existsSync(p)) continue;
    try { var j = JSON.parse(fs.readFileSync(p, 'utf8')), n = (j.c1 || []).length; if (n) return { c1: j.c1[n - 1], c3: j.c3[n - 1] }; } catch (e) { return null; }
  }
  return null;
}

/** Reine Auswahl: welche Reihen werden eingestuft? reihen: G.reihen().reihen mit lebendNeu; tafel: Zeilen der alten Tafel. */
function auswahl(reihen, tafelJe, xWerte) {
  var aus = [];
  reihen.forEach(function (r) {
    var z = tafelJe[r.reihe] || null;
    var lebendAbX = null;                                     // kleinstes X, bei dem die Reihe als lebend gilt
    xWerte.forEach(function (x) { if (lebendAbX == null && r.lebendNeu[x] === 1) lebendAbX = x; });
    if (r.lebendNeu[xWerte[0]] === 1) return;                 // bei X = 0 lebend: bei jedem X lebend, nie in der Tafel
    var w = z ? G.ankerWechsel(z.letzter_balken, r.letzterMinutentag) : { diff: null, wechselt: true };
    if (z && !w.wechselt) return;                             // Zeile bleibt, Anker praktisch gleich
    aus.push({ r: r, alt: z, ankerDiff: w.diff, neu: !z, lebendAbX: lebendAbX });
  });
  return aus;
}

function main() {
  var R = G.reihen(), kal = R.kal, ende = R.ende;
  R.reihen.forEach(function (r) {
    r.lebendNeu = {};
    G.X_WERTE.forEach(function (x) { r.lebendNeu[x] = G.lebendNachMinuten(r.letzterMinutentag, ende, x, kal, r.erloschen); });
  });
  var T = G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json')), tafelJe = {};
  T.reihen.forEach(function (z) { tafelJe[z.reihe] = z; });
  var sy = G.symbole(), ordnerK = sy.ordner || {}, gruppeK = sy.gruppe || {};

  var gewaehlt = auswahl(R.reihen, tafelJe, G.X_WERTE);
  var zaehler = { aktien: R.reihen.length, tafelAlt: T.reihen.length, lebendAlt: 0, jeX: {}, eingestuft: gewaehlt.length,
    ankerWechselt: 0, neuBeiX0: 0, ohneLetztenKurs: 0 };
  R.reihen.forEach(function (r) { if (r.lebendAlt) zaehler.lebendAlt++; });
  G.X_WERTE.forEach(function (x) {
    var nichtLebend = R.reihen.filter(function (r) { return r.lebendNeu[x] === 0; });
    zaehler.jeX[x] = { nichtLebend: nichtLebend.length, davonInAlterTafel: nichtLebend.filter(function (r) { return tafelJe[r.reihe]; }).length,
      neu: nichtLebend.filter(function (r) { return !tafelJe[r.reihe]; }).length,
      alteZeilenJetztLebend: T.reihen.filter(function (z) { var r = R.reihen.filter(function (q) { return q.reihe === z.reihe; })[0]; return r && r.lebendNeu[x] === 1; }).length };
  });

  var aus = gewaehlt.map(function (g) {
    var r = g.r, basis = r.basis;
    var ordner = ordnerK[basis] || basis;                     // wie im Original (Zeile 66): Ordner des BASIS-Kuerzels
    var m = G.massnahmen(ordner);
    var s = schlussVon(r.reihe);
    if (g.neu) zaehler.neuBeiX0++; else zaehler.ankerWechselt++;
    if (!s) zaehler.ohneLetztenKurs++;
    return {
      reihe: r.reihe, basis: basis, ordner: ordner, art: r.art,
      gruppe: gruppeK[basis] || 'unbekannt',
      letzterBalken: r.letzterMinutentag,                     // AENDERUNG 1: Anker = letzter Minutentag
      letzterBalkenAlt: g.alt ? g.alt.letzter_balken : null,  // Anker der alten Tafel (letzter Tagesbalken)
      letzterTagesbalken: r.letzterTagesbalken,
      ankerDiffTage: g.ankerDiff, neu: g.neu ? 1 : 0, lebendAbX: g.lebendAbX,   // AENDERUNG 2: null = bei keinem X lebend
      lebendAlt: r.lebendAlt,
      erloschenerTraeger: r.erloschen ? 1 : 0,
      kuerzelWiederverwendet: !!(G.lebenszeit().werte[r.reihe] && G.lebenszeit().werte[r.reihe].wiederverwendet),
      cusip: m.cusip || null,
      massnahmeEnde: m.ende,
      barpreis: m.barpreis,
      letzterKursArchiv: s ? s.c1 : null,
      letzterKursC3: s ? s.c3 : null,
      polygon: r.polygon
    };
  });
  aus.sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
  var out = { stand: new Date().toISOString(), regel: 'lebend = letzter Minutentag hoechstens X Handelstage vor dem Ende des Archivs', ende: ende,
    xTrockenlauf: G.X_TROCKENLAUF, xWerte: G.X_WERTE, ankerSchwelleTage: G.ANKER_SCHWELLE_TAGE, lebendAb: G.LEBEND_AB, zaehler: zaehler, reihen: aus };
  G.schreibe('t2-verschwundene.json', out);
  console.log(JSON.stringify(zaehler, null, 1));
  var eArt = {}; aus.forEach(function (x) { var k = x.massnahmeEnde ? x.massnahmeEnde.art : 'keine'; eArt[k] = (eArt[k] || 0) + 1; });
  console.log('Ende-Art (alpaca):', JSON.stringify(eArt));
  console.log('neu je lebendAbX:', JSON.stringify(aus.filter(function (x) { return x.neu; }).reduce(function (a, x) { var k = String(x.lebendAbX); a[k] = (a[k] || 0) + 1; return a; }, {})));
}

module.exports = { auswahl: auswahl };
if (require.main === module) main();
