'use strict';
/* TEIL 1 - Lebenszeit aus den MINUTEN (Auftrag Nr. 86). Bau-Skript, wiederholbar: derselbe Stand des Manifests ergibt
 * dieselbe Datei, Byte fuer Byte (die Datei traegt keinen Laufstempel, ihr Stand ist der des Manifests).
 *
 * Regel (PM): je Reihe erster und letzter Minutentag (New Yorker Tag) aus dem Manifest des Minutenarchivs;
 *   lebend = letzter Minutentag hoechstens 10 Handelstage vor dem Ende des Archivs (Ende = groesster letzter Minutentag
 *   ueber alle Reihen; Handelstage aus _kalender.json); erloschene Traeger wiederverwendeter Kuerzel sind nie lebend.
 *
 * Liest (nur lesen):  E:/Markt-Dashboard-Archiv/alpaca1m/_manifest.json, _kalender.json, _lebenszeit.json, _symbole.json
 * Schreibt (NEU):     E:/Markt-Dashboard-Archiv/alpaca1m-ableitungen/lebenszeit-minuten.json
 *                     teil1-zahlen.json in diesen Ordner (mit Laufstempel - die Pruefung, nicht das Erzeugnis)
 *
 * Aufruf:  node lebenszeit-minuten.js            baut und prueft
 *          node lebenszeit-minuten.js --nur-pruefen   schreibt nichts auf E:, vergleicht nur
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var G = require('../gemeinsam.js');
var P = require('./p2.js');

/** Die Tafel als Objekt - rein aus den Eingaengen, ohne Uhr. */
function baue() {
  var mj = G.json(G.ROH + '/_manifest.json');
  var man = G.manifest(), kal = G.kalender(), lz = G.lebenszeit(), sy = G.symbole().ordner || {};
  var endeMs = null;
  Object.keys(man.jeOrdner).forEach(function (o) { man.jeOrdner[o].forEach(function (e) { if (endeMs == null || e.letzter > endeMs) endeMs = e.letzter; }); });
  var ende = G.etTag(endeMs);
  /* Aktienreihen: genau die des Minuten-Lesers (lesen.js reihen(): CS/ADRC mit Balken) - aus dem Leser selbst. */
  var aktie = {};
  G.reihen().reihen.forEach(function (r) { aktie[r.reihe] = r.art || 'CS'; });

  var werte = {}, Z = { reihen: 0, aktienreihen: 0, lebend: 0, lebendAktien: 0, erloscheneTraeger: 0, ohneMinuten: 0, unscharf: 0,
    aktienTagesbalkenUeber30TageNachMinuten: 0, aktienTagesbalkenUeber90TageNachMinuten: 0 };
  Object.keys(lz.werte).sort().forEach(function (r) {
    var e = lz.werte[r];
    if (!e || !(e.balken > 0) || !e.letzter) return;                 // wie lesen.js: ohne Balken keine Reihe
    var ordner = sy[r] || r;
    var erloschen = !!(e.wiederverwendet && e.wiederverwendet.schnitt);
    var z = P.lebenszeitZeile(man.jeOrdner[ordner], { schnittMs: erloschen ? e.wiederverwendet.schnitt : null,
      abMs: e.zweiteReihe && e.zweiteReihe.abMs ? e.zweiteReihe.abMs : null, erloschen: erloschen }, ende, kal, P.X_LEBEND);
    /* letzter Tagesbalken: fuer den erloschenen Traeger der Schnitt (wie im Trockenlauf T1), sonst das Feld der Tafel */
    var tb = new Date(erloschen ? e.wiederverwendet.schnitt : e.letzter).toISOString().slice(0, 10);
    var w = { ordner: ordner, aktie: aktie[r] ? 1 : 0, erloschen: erloschen ? 1 : 0,
      ersterMinutentag: z.ersterMinutentag, letzterMinutentag: z.letzterMinutentag, minutentage: z.minutentage, jahre: z.jahre,
      abstandHandelstage: z.abstandHandelstage, lebend: z.lebend,
      letzterTagesbalken: tb, tagesbalkenNachMinutenTage: z.letzterMinutentag ? G.tageZwischen(z.letzterMinutentag, tb) : null };
    if (z.unscharf) { w.unscharf = 1; Z.unscharf++; }
    werte[r] = w;
    Z.reihen++; if (w.lebend) Z.lebend++; if (erloschen) Z.erloscheneTraeger++; if (!z.letzterMinutentag) Z.ohneMinuten++;
    if (w.aktie) {
      Z.aktienreihen++; if (w.lebend) Z.lebendAktien++;
      if (w.tagesbalkenNachMinutenTage > 30) Z.aktienTagesbalkenUeber30TageNachMinuten++;
      if (w.tagesbalkenNachMinutenTage > 90) Z.aktienTagesbalkenUeber90TageNachMinuten++;
    }
  });
  var deckel = P.panelDeckel(ende, kal, P.X_LEBEND);
  return {
    kennung: P.KENNUNG_LZM,
    stand: mj.stand,                                                  // Stand des Manifests - kein eigener Laufstempel
    quelle: 'alpaca1m/_manifest.json (' + mj.dateien + ' Jahresdateien, Stand ' + mj.stand + ')',
    manifestStand: mj.stand, manifestDateien: mj.dateien,
    endeDesArchivs: ende,
    kalenderGeholt: kal.geholt,
    regel: 'lebend = letzter Minutentag (New Yorker Tag) hoechstens ' + P.X_LEBEND + ' Handelstage vor dem Ende des Archivs; Ende = groesster letzter Minutentag ueber alle Reihen; '
      + 'Handelstage aus alpaca1m/_kalender.json; erloschene Traeger wiederverwendeter Kuerzel sind nie lebend; ohne Minutentag nie lebend.',
    xHandelstage: P.X_LEBEND,
    panelDeckel: { regel: 'ein Panel endet fruehestens ' + (P.X_LEBEND + 1) + ' Handelstage vor dem Ende des Archivs - erst dann ist jede Reihe, die im Panel endet, entschieden',
      spaetestesPanelEnde: deckel },
    tagesbalken: { quelle: 'alpaca1m/_lebenszeit.json (Stand ' + lz.stand + ') - nur zum Vergleich; Tagesbalken laufen nach dem Abgang weiter (wiki/fehlerformen.md, 04.10.2026)',
      feld: 'tagesbalkenNachMinutenTage = Kalendertage vom letzten Minutentag zum letzten Tagesbalken (beim erloschenen Traeger: zum Schnitt)' },
    felder: { ordner: 'Ordner im Minutenarchiv', aktie: '1 = Aktienreihe des Minuten-Lesers (CS/ADRC)', erloschen: '1 = erloschener Traeger eines wiederverwendeten Kuerzels',
      ersterMinutentag: 'ISO, New Yorker Tag', letzterMinutentag: 'ISO, New Yorker Tag', minutentage: 'Summe der Tage der Jahresdateien laut Manifest', jahre: 'Jahre mit Datei',
      abstandHandelstage: 'Handelstage vom letzten Minutentag bis zum Ende des Archivs', lebend: '1 / 0 nach der Regel' },
    zahlen: Z,
    werte: werte
  };
}
function text(obj) {
  /* je Reihe eine Zeile: lesbar im Editor, klein, stabil */
  var kopf = {}; Object.keys(obj).forEach(function (k) { if (k !== 'werte') kopf[k] = obj[k]; });
  var zeilen = Object.keys(obj.werte).map(function (r) { return JSON.stringify(r) + ':' + JSON.stringify(obj.werte[r]); });
  return JSON.stringify(kopf, null, 1).replace(/\n\}$/, function () { return ',\n "werte": {\n' + zeilen.join(',\n') + '\n }\n}'; }) + '\n';
}
function sha(t) { return crypto.createHash('sha256').update(t).digest('hex'); }

function main() {
  var nurPruefen = process.argv.indexOf('--nur-pruefen') !== -1;
  var obj = baue(), t = text(obj);
  JSON.parse(t);                                                      // die Datei muss gueltiges JSON sein
  var vorher = fs.existsSync(P.LZM) ? fs.readFileSync(P.LZM, 'utf8') : null;
  if (!nurPruefen) {
    if (!fs.existsSync(P.ABL)) fs.mkdirSync(P.nurNeu(P.ABL + '/').replace(/\/$/, ''));
    if (vorher !== t) P.atomar(P.nurNeu(P.LZM), t);
  }
  /* ---- Pruefungen des Auftrags ---- */
  var W = G.json(path.join(G.HIER, 't1-wechsel.json'));
  var soll = W.jeX[String(P.X_LEBEND)].lebendZuAbgegangen.map(function (z) { return z.reihe; }).sort();
  var R = G.reihen().reihen, ab = [], auf = [], abweichungLmt = 0;
  R.forEach(function (r) {
    var w = obj.werte[r.reihe];
    if (!w) { abweichungLmt++; return; }
    if (w.letzterMinutentag !== r.letzterMinutentag) abweichungLmt++;
    if (r.lebendAlt === 1 && w.lebend === 0) ab.push(r.reihe);
    if (r.lebendAlt === 0 && w.lebend === 1) auf.push(r.reihe);
  });
  ab.sort();
  var kal = G.kalender(), iEnde = kal.hIdx(obj.endeDesArchivs) - 1, rueck = [];
  for (var q = 0; q <= P.X_LEBEND + 1; q++) rueck.push(kal.tage[iEnde - q]);
  var pr = {
    stand: new Date().toISOString(), datei: P.LZM, bytes: Buffer.byteLength(t), sha256: sha(t),
    geschrieben: nurPruefen ? 0 : (vorher === t ? 'unveraendert (byte-gleich mit dem Bestand)' : 1),
    byteGleichMitBestand: vorher == null ? null : vorher === t,
    zahlen: obj.zahlen, endeDesArchivs: obj.endeDesArchivs, manifestStand: obj.manifestStand,
    pruefungen: {
      aktienreihen7299: obj.zahlen.aktienreihen === 7299,
      lebendAktien2249: obj.zahlen.lebendAktien === 2249,
      wechselLebendZuAbgegangen: ab.length, wechselSoll: soll.length,
      wechselGenauDieListe: JSON.stringify(ab) === JSON.stringify(soll),
      wechselAbgegangenZuLebend: auf.length,
      letzterMinutentagWieTrockenlauf: abweichungLmt === 0,
      panelDeckel: obj.panelDeckel.spaetestesPanelEnde, panelDeckelNachgerechnet: rueck[P.X_LEBEND + 1],
      handelstageRueckwaertsVomEnde: rueck
    }
  };
  pr.pruefungen.alleBestanden = pr.pruefungen.aktienreihen7299 && pr.pruefungen.lebendAktien2249 && pr.pruefungen.wechselGenauDieListe
    && ab.length === 57 && auf.length === 0 && pr.pruefungen.letzterMinutentagWieTrockenlauf && pr.pruefungen.panelDeckel === '2026-09-17';
  P.schreibe('teil1-zahlen.json', pr);
  console.log(JSON.stringify(pr, null, 1));
}

module.exports = { baue: baue, text: text };
if (require.main === module) main();
