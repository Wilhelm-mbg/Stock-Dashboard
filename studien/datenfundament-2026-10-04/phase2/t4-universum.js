'use strict';
/* TEIL 4, Schritt 1 - KOPIE von ../t2-universum.js fuer den ZWEITEN Trockenlauf der Gruende-Tafel (Auftrag Nr. 86).
 *
 * Das Original aus Nr. 79 und das der Studie vom 12.09. bleiben unangetastet. Gegenueber der Kopie aus Nr. 79:
 *   AENDERUNG 1 - Universum: ALLE nach Teil 1 nicht lebenden Aktienreihen (lebenszeit-minuten.json, X = 10) - nicht nur
 *                 die Zeilen mit Ankerverschiebung. Anker `letzterBalken` = letzter MINUTENTAG (wie in Nr. 79).
 *   AENDERUNG 2 - R-a: je Reihe die Polygon-Firma: der Eintrag der Polygon-Liste fuer das Kuerzel mit CIK, dessen
 *                 Abgangsdatum hoechstens 45 Tage vom Anker liegt (der naechste). Fehlt er, sucht t4-edgar.js im Volltext.
 *
 * Liest NUR. Schreibt: t4-verschwundene.json (Arbeitsdatei fuer t4-edgar.js) in DIESEN Ordner. Es entsteht keine Tafel.
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var P = require('./p2.js');

var KANAL = path.join(G.REPO, 'studien', 'vorregistrierung-2026-09-08-trendkanal-tage');
var POLYGON_TAGE = 45;                                      // R-a

/* letzter Schlusskurs aus den Tagesdateien der Kanalstudie - wie im Original, aber nur fuer die gefragte Reihe */
function schlussVon(reihe) {
  for (var d = 0; d < 4; d++) {
    var p = path.join(KANAL, 'tage-' + d, reihe + '.json');
    if (!fs.existsSync(p)) continue;
    try { var j = JSON.parse(fs.readFileSync(p, 'utf8')), n = (j.c1 || []).length; if (n) return { c1: j.c1[n - 1], c3: j.c3[n - 1] }; } catch (e) { return null; }
  }
  return null;
}

/** R-a, reine Regel: eintraege = Polygon-Eintraege des Kuerzels [{bis, name, cik}]; der Eintrag MIT CIK, dessen
 *  Abgangsdatum dem Anker am naechsten liegt - hoechstens `maxTage` Kalendertage davor oder danach. Sonst null. */
function polygonFirma(eintraege, anker, maxTage) {
  var best = null;
  (eintraege || []).forEach(function (p) {
    if (!p || !p.bis || !p.cik) return;
    var d = G.tageZwischen(anker, p.bis);
    if (Math.abs(d) <= maxTage && (!best || Math.abs(d) < Math.abs(best.tage))) best = { cik: p.cik, name: p.name || null, bis: p.bis, tage: d };
  });
  return best;
}

function main() {
  var L = P.lebenszeitMinuten(), R = G.reihen(), poly = G.polygon();
  var T = G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json')), tafelJe = {};
  T.reihen.forEach(function (z) { tafelJe[z.reihe] = z; });
  var sy = G.symbole(), ordnerK = sy.ordner || {}, gruppeK = sy.gruppe || {};

  var zaehler = { aktien: R.reihen.length, tafelAlt: T.reihen.length, nichtLebend: 0, davonInAlterTafel: 0, neu: 0, alteZeilenJetztLebend: 0,
    ankerWechseltUeber3Tage: 0, mitPolygonFirma: 0, ohnePolygonFirma: 0, ohneLetztenKurs: 0, ankerAbweichungZuNr79: 0 };
  var aus = [];
  R.reihen.forEach(function (r) {
    var w = L.werte[r.reihe];
    if (!w || !w.aktie) throw new Error('Reihe fehlt in lebenszeit-minuten.json: ' + r.reihe);
    if (w.letzterMinutentag !== r.letzterMinutentag) zaehler.ankerAbweichungZuNr79++;
    var z = tafelJe[r.reihe] || null;
    if (w.lebend === 1) { if (z) zaehler.alteZeilenJetztLebend++; return; }                  // AENDERUNG 1
    zaehler.nichtLebend++; if (z) zaehler.davonInAlterTafel++; else zaehler.neu++;
    var basis = r.basis, ordner = ordnerK[basis] || basis;    // wie im Original (Zeile 66): Ordner des BASIS-Kuerzels
    var m = G.massnahmen(ordner), s = schlussVon(r.reihe);
    var wch = z ? G.ankerWechsel(z.letzter_balken, w.letzterMinutentag) : { diff: null, wechselt: true };
    if (z && wch.wechselt) zaehler.ankerWechseltUeber3Tage++;
    if (!s) zaehler.ohneLetztenKurs++;
    var pf = polygonFirma(poly.je[basis] || poly.je[basis.replace(/-/g, '.')] || [], w.letzterMinutentag, POLYGON_TAGE);   // AENDERUNG 2 (R-a)
    if (pf) zaehler.mitPolygonFirma++; else zaehler.ohnePolygonFirma++;
    aus.push({
      reihe: r.reihe, basis: basis, ordner: ordner, art: r.art,
      gruppe: gruppeK[basis] || 'unbekannt',
      letzterBalken: w.letzterMinutentag,                     // Anker = letzter Minutentag
      letzterBalkenAlt: z ? z.letzter_balken : null,          // Anker der alten Tafel (letzter Tagesbalken)
      letzterTagesbalken: r.letzterTagesbalken,
      ankerDiffTage: wch.diff, ankerWechselt: z ? (wch.wechselt ? 1 : 0) : null, neu: z ? 0 : 1,
      lebendAlt: r.lebendAlt,
      erloschenerTraeger: r.erloschen ? 1 : 0,
      kuerzelWiederverwendet: !!(G.lebenszeit().werte[r.reihe] && G.lebenszeit().werte[r.reihe].wiederverwendet),
      cusip: m.cusip || null,
      massnahmeEnde: m.ende,
      barpreis: m.barpreis,
      letzterKursArchiv: s ? s.c1 : null,
      letzterKursC3: s ? s.c3 : null,
      polygon: r.polygon,
      polygonFirma: pf
    });
  });
  aus.sort(function (a, b) { return a.reihe < b.reihe ? -1 : 1; });
  var out = { stand: new Date().toISOString(), regel: L.regel, ende: L.endeDesArchivs, lebenszeitKennung: L.kennung, manifestStand: L.manifestStand,
    xLebend: L.xHandelstage, ankerSchwelleTage: G.ANKER_SCHWELLE_TAGE, lebendAb: G.LEBEND_AB, polygonTage: POLYGON_TAGE,
    polygonStand: poly.stand, polygonLetztesBis: poly.letztesBis, zaehler: zaehler, reihen: aus };
  P.schreibe('t4-verschwundene.json', out);
  console.log(JSON.stringify(zaehler, null, 1));
  var eArt = {}; aus.forEach(function (x) { var k = x.massnahmeEnde ? x.massnahmeEnde.art : 'keine'; eArt[k] = (eArt[k] || 0) + 1; });
  console.log('Ende-Art (alpaca):', JSON.stringify(eArt));
}

module.exports = { polygonFirma: polygonFirma, POLYGON_TAGE: POLYGON_TAGE };
if (require.main === module) main();
