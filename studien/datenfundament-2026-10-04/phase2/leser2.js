'use strict';
/* LESER2 - Minuten-Leser v2 (Auftrag Nr. 86, Teil 3). Umhuellt studien/vorregistrierung-2026-09-06-signale-minuten/lesen.js,
 * OHNE es zu aendern. Fuer NEUE Arbeiten; abgeschlossene Studien lesen weiter ueber lesen.js.
 *
 * Was anders ist als in lesen.js:
 *   reihen()    `lebend` und `jahre` kommen aus der Lebenszeit der MINUTEN
 *               (E:/Markt-Dashboard-Archiv/alpaca1m-ableitungen/lebenszeit-minuten.json), nicht aus den Tagesbalken.
 *   ladeJahr()  1. die Kopie aus alpaca1m-bereinigt-v2/, wenn es sie gibt (und sie so weit reicht wie die Rohdatei);
 *               2. sonst die alte Kopie aus alpaca1m-bereinigt/ NUR, wenn sie so weit reicht wie die Rohdatei
 *                  (Vergleich ueber die Manifeste);
 *               3. sonst - es gibt keine Kopie - die Rohdatei (die Leseregel des Archivs: ohne Kopie IST die Rohdatei
 *                  die bereinigte).
 *               Eine Kopie, die kuerzer ist als die Rohdatei, wird NICHT gelesen und es wird NICHT still auf roh
 *               ausgewichen: ladeJahr wirft einen Fehler mit code 'LESER2_KOPIE_VERALTET'.
 *   Fenster     lesen.js liest nur das Fenster seiner Studie (K.FENSTER, bis 31.08.2026). leser2 liest in der Vorgabe
 *               bis zum Ende des Archivs; mit opt.fenster = { von, bis } (ET-Tage) jedes andere Fenster,
 *               mit opt.fenster = FENSTER_LESEN genau das von lesen.js.
 *
 * Wie umhuellt wird: lesen.js fragt Ordner und Fenster bei jedem Aufruf neu bei seinem Konfig-Modul ab (K.ORTE.bereinigt(),
 * K.FENSTER). leser2 stellt beides fuer die Dauer EINES Aufrufs um und danach zurueck (synchron, try/finally) - die Datei
 * lesen.js und ihr Konfig-Modul auf der Platte bleiben unberuehrt.
 *
 * Grenze: tageAus()/schlussMs() aus lesen.js kennen den Boersenkalender nur im Fenster der Minutenstudie (bis 31.08.2026);
 * Halbtage danach gaelten dort als ganze Tage. Wer nach dem 31.08.2026 Tage bildet, nimmt den Kalender aus kalender().
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var P = require('./p2.js');
var K = require(path.join(G.MINUTEN, 'konfig.js'));
var LP = require(path.join(G.MINUTEN, 'lesen.js'));

var KENNUNG = P.KENNUNG_LESER;
var FENSTER_LESEN = { von: K.FENSTER.von, bis: K.FENSTER.bis };   // das Fenster von lesen.js (Stand beim Laden)

/* ---------- Lebenszeit und Manifeste (einmal lesen) ---------- */
var M = null;
function manifeste() {
  if (M) return M;
  var roh = JSON.parse(fs.readFileSync(G.ROH + '/_manifest.json', 'utf8'));
  var alt = JSON.parse(fs.readFileSync(G.BER + '/_manifest.json', 'utf8'));
  var v2 = fs.existsSync(P.BER2 + '/_manifest.json') ? JSON.parse(fs.readFileSync(P.BER2 + '/_manifest.json', 'utf8')) : { eintraege: {}, stand: null };
  M = { roh: roh.eintraege, rohStand: roh.stand, alt: alt.eintraege, altStand: alt.stand, v2: v2.eintraege, v2Stand: v2.stand };
  return M;
}
/** Fuer Tests: eigene Manifeste und Orte unterschieben ({roh, alt, v2} je {schluessel: {letzter}}). null = echte lesen. */
function setzeManifeste(m) { M = m; }

/* ---------- Reihen ---------- */
var REIHEN = null;
/** Alle Aktienreihen wie lesen.js reihen() - aber `lebend` und `jahre` aus der Lebenszeit der Minuten. */
function reihen() {
  if (REIHEN) return REIHEN;
  var L = P.lebenszeitMinuten(), alt = LP.reihen();
  var aus = alt.map(function (R) {
    var w = L.werte[R.reihe];
    if (!w) throw new Error('leser2: Reihe ' + R.reihe + ' fehlt in ' + P.LZM + ' - Lebenszeit-Datei neu bauen (lebenszeit-minuten.js)');
    var N = {}; Object.keys(R).forEach(function (k) { N[k] = R[k]; });
    N.lebend = w.lebend; N.jahre = w.jahre.slice();
    N.lebendAlt = R.lebend; N.ersterMinutentag = w.ersterMinutentag; N.letzterMinutentag = w.letzterMinutentag;
    return N;
  });
  aus.ausgeschlossen = alt.ausgeschlossen;
  aus.kennung = KENNUNG; aus.lebenszeit = { kennung: L.kennung, manifestStand: L.manifestStand, endeDesArchivs: L.endeDesArchivs, regel: L.regel };
  REIHEN = aus;
  return aus;
}

/* ---------- Welche Datei gilt? (reine Regel, ohne Platte ausser existiert()) ---------- */
/** Rueckgabe { kopie: 'v2' | 'alt' | null, quelle: 'bereinigt' | 'roh' } oder ein Fehler-Objekt { veraltet: {...} }.
 *  hat: { v2: bool, alt: bool } - gibt es die Datei?; man: { roh, alt, v2 } - Manifest-Eintraege dieses Schluessels. */
function wahl(schluessel, hat, man) {
  function reicht(kopie) { return !!(man.roh && kopie && kopie.letzter >= man.roh.letzter); }
  if (hat.v2) {
    if (!man.roh || !man.v2) return { veraltet: { kopie: 'v2', grund: 'nicht pruefbar: Eintrag fehlt im Manifest (' + (!man.roh ? 'alpaca1m' : 'alpaca1m-bereinigt-v2') + ')' } };
    if (!reicht(man.v2)) return { veraltet: { kopie: 'v2', kopieEnde: man.v2.letzter, rohEnde: man.roh.letzter } };
    return { kopie: 'v2', quelle: 'bereinigt' };
  }
  if (hat.alt) {
    if (!man.roh || !man.alt) return { veraltet: { kopie: 'alt', grund: 'nicht pruefbar: Eintrag fehlt im Manifest (' + (!man.roh ? 'alpaca1m' : 'alpaca1m-bereinigt') + ')' } };
    if (!reicht(man.alt)) return { veraltet: { kopie: 'alt', kopieEnde: man.alt.letzter, rohEnde: man.roh.letzter } };
    return { kopie: 'alt', quelle: 'bereinigt' };
  }
  return { kopie: null, quelle: 'roh' };
}
function fehlerVeraltet(schluessel, v) {
  var name = v.kopie === 'v2' ? 'alpaca1m-bereinigt-v2' : 'alpaca1m-bereinigt';
  var t = v.grund ? 'leser2: ' + name + '/' + schluessel + ' - ' + v.grund + '. Es wird weder die Kopie noch still die Rohdatei gelesen.'
    : 'leser2: die bereinigte Kopie ' + name + '/' + schluessel + ' endet am ' + G.etTag(v.kopieEnde) + ', die Rohdatei alpaca1m/' + schluessel + ' am ' + G.etTag(v.rohEnde)
      + '. Eine veraltete Kopie wird nicht gelesen und es wird nicht still auf die Rohdatei ausgewichen. Abhilfe: Kopie neu bilden (studien/datenfundament-2026-10-04/phase2/kopien-v2.js --schreiben)'
      + ' - oder, wenn die Reihe dort ausgenommen ist (unerklaerter Kurssprung), erst die Massnahme klaeren.';
  var e = new Error(t);
  e.code = 'LESER2_KOPIE_VERALTET'; e.schluessel = schluessel; e.kopie = v.kopie;
  return e;
}

/* ---------- Eine Jahresdatei ---------- */
/** Wie lesen.js ladeJahr(R, jahr) - gleiche Rueckgabe, dazu { kopie: 'v2'|'alt'|null, leser: KENNUNG, fenster }.
 *  opt.fenster: { von, bis } ET-Tage; Vorgabe von = FENSTER_LESEN.von, bis = Ende des Archivs. */
function ladeJahr(R, jahr, opt) {
  opt = opt || {};
  var schluessel = R.ordner + '/' + jahr + '.json', m = manifeste();
  var hat = { v2: fs.existsSync(P.BER2 + '/' + schluessel), alt: fs.existsSync(G.BER + '/' + schluessel) };
  var w = wahl(schluessel, hat, { roh: m.roh[schluessel], alt: m.alt[schluessel], v2: m.v2[schluessel] });
  if (w.veraltet) throw fehlerVeraltet(schluessel, w.veraltet);
  var fenster = opt.fenster || { von: FENSTER_LESEN.von, bis: P.lebenszeitMinuten().endeDesArchivs };
  var altOrt = K.ORTE.bereinigt, altVon = K.FENSTER.von, altBis = K.FENSTER.bis, g;
  try {
    if (w.kopie === 'v2') K.ORTE.bereinigt = function () { return P.BER2; };
    K.FENSTER.von = fenster.von; K.FENSTER.bis = fenster.bis;
    g = LP.ladeJahr(R, jahr);
  } finally { K.ORTE.bereinigt = altOrt; K.FENSTER.von = altVon; K.FENSTER.bis = altBis; }
  /* Gegenprobe: lesen.js muss genau die Datei genommen haben, die die Regel bestimmt hat */
  var soll = w.kopie === 'v2' ? P.BER2 : (w.kopie === 'alt' ? G.BER : G.ROH);
  if (g.pfad && path.resolve(g.pfad) !== path.resolve(soll, R.ordner, jahr + '.json')) throw new Error('leser2: lesen.js las ' + g.pfad + ' statt ' + soll + '/' + schluessel);
  g.kopie = w.kopie; g.leser = KENNUNG; g.fenster = fenster;
  return g;
}
/** Der ganze Boersenkalender des Archivs (nicht auf ein Studienfenster beschnitten). */
function kalender() { return G.kalender(); }

module.exports = { KENNUNG: KENNUNG, FENSTER_LESEN: FENSTER_LESEN, reihen: reihen, ladeJahr: ladeJahr, wahl: wahl, fehlerVeraltet: fehlerVeraltet,
  manifeste: manifeste, setzeManifeste: setzeManifeste, kalender: kalender, alt: LP };
