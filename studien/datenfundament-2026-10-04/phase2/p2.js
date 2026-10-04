'use strict';
/* P2 - gemeinsame Orte, Kennungen und reine Regeln der Phase 2a "Datenfundament" (Auftrag Nr. 86, 04.10.2026).
 *
 * Baut auf ../gemeinsam.js des Trockenlaufs (Nr. 79) auf - per require, ohne es zu aendern. Geschrieben wird nur
 *   - in DIESEN Ordner (studien/datenfundament-2026-10-04/phase2/) und
 *   - in zwei NEUE Ordner auf E: (alpaca1m-ableitungen/, alpaca1m-bereinigt-v2/).
 * alpaca1m/ und alpaca1m-bereinigt/ werden nur gelesen. Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');

var HIER = __dirname;
var ABL = G.ARCHIV + '/alpaca1m-ableitungen';             // NEU (Teil 1)
var LZM = ABL + '/lebenszeit-minuten.json';
var BER2 = G.ARCHIV + '/alpaca1m-bereinigt-v2';           // NEU (Teil 2)
var X_LEBEND = 10;                                        // Regel des PM: hoechstens 10 Handelstage vor dem Ende des Archivs
var KENNUNG_LZM = 'datenfundament-2026-10-04/phase2/lebenszeit-minuten/v1';
var KENNUNG_KOPIEN = 'datenfundament-2026-10-04/phase2/kopien-v2/v1';
var KENNUNG_LESER = 'datenfundament-2026-10-04/phase2/leser2/v1';
var KENNUNG_GRUENDE = 'datenfundament-2026-10-04/phase2/gruende-trockenlauf-2 (KEINE Tafel)';

/* ---------- Teil 1: Lebenszeit aus den Minuten (reine Regel) ---------- */
/** Eine Zeile der Lebenszeit aus den Minuten.
 *  eintraege: Manifest-Eintraege des Ordners [{jahr, erster, letzter, tage}] (ms); opt: {schnittMs, abMs, erloschen};
 *  ende: letzter Minutentag des ganzen Archivs (ISO); kal: G.kalenderAus(...); x: Handelstage.
 *  lebend = letzter Minutentag hoechstens x Handelstage vor `ende`; erloschener Traeger nie; ohne Minuten nie. */
function lebenszeitZeile(eintraege, opt, ende, kal, x) {
  opt = opt || {};
  var m = G.letzterMinutentag(eintraege, { schnittMs: opt.schnittMs == null ? null : opt.schnittMs, abMs: opt.abMs == null ? null : opt.abMs });
  var jahre = [];
  (eintraege || []).forEach(function (e) {
    if (opt.schnittMs != null && e.erster > opt.schnittMs) return;
    if (opt.abMs != null && e.letzter < opt.abMs) return;
    jahre.push(e.jahr);
  });
  jahre.sort(function (a, b) { return a - b; });
  var abstand = m.letzter ? kal.abstand(m.letzter, ende) : null;
  return { ersterMinutentag: m.erster, letzterMinutentag: m.letzter, minutentage: m.minutentage, jahre: jahre,
    abstandHandelstage: abstand, lebend: G.lebendNachMinuten(m.letzter, ende, x, kal, !!opt.erloschen), unscharf: m.unscharf ? 1 : 0 };
}
/** Panel-Deckel: ein Panel endet fruehestens x + 1 Handelstage vor dem Ende des Archivs - dann ist jede Reihe, die im
 *  Panel endet, entschieden (lebend oder abgegangen). Rueckgabe: der spaeteste zulaessige letzte Panel-Tag (ISO). */
function panelDeckel(ende, kal, x) {
  var i = kal.hIdx(ende) - 1;                               // Index des Endes (oder des letzten Handelstags davor)
  return kal.tage[i - (x + 1)] || null;
}

/* ---------- Teil 2: Split-Saetze (reine Regeln) ---------- */
var SPERRE_MIN_LOG = 0.1, SPERRE_ANTEIL = 0.5;            // = K.SPLIT_SPERRE_* des Pruefstands; test.js vergleicht mit konfig.js
/** Zeigt die Rohreihe den Sprung, den der Satz behauptet? (Split-Sperre des Panels, wie t5-splits.js/paneldaten.js) */
function zeigtSprung(rohVerhaeltnis, faktor) {
  if (!(rohVerhaeltnis > 0) || !(faktor > 0)) return null;
  var soll = -Math.log(faktor), ist = Math.log(rohVerhaeltnis);
  if (!(Math.abs(soll) >= SPERRE_MIN_LOG)) return true;
  return Math.abs(ist - soll) <= (1 - SPERRE_ANTEIL) * Math.abs(soll);
}
/** Entscheid je Split-Satz einer Reihe (Auftrag 5.2). satz: {art, datum, faktor}; befund: der Befund zu einem vom
 *  Panelbau ABGELEHNTEN Satz {rohZeigtSprung, sprungAmNachbartag: {tagAb, versatzHandelstage}} - oder null, wenn der
 *  Satz nie abgelehnt wurde.
 *   - nie abgelehnt                                         -> anwenden, Ex-Tag wie im Satz
 *   - abgelehnt, Sprung genau einen Handelstag NACH dem Tag im Satz -> anwenden, Ex-Tag = Tag des Sprungs (5.2 ii)
 *   - abgelehnt, sonst (kein Sprung; MFH: Sprung nur am Tag davor, Faktor 0,9) -> nicht anwenden (5.2 i, iii) */
function satzEntscheid(satz, befund) {
  if (!befund) return { anwenden: true, datum: satz.datum, grund: 'nicht abgelehnt' };
  var nb = befund.sprungAmNachbartag;
  if (nb && nb.versatzHandelstage === 1) {
    return { anwenden: true, datum: nb.tagAb, datumQuelle: satz.datum, verschoben: 1, grund: 'echter Split: die Rohdatei zeigt den Sprung einen Handelstag nach dem Tag im Satz' };
  }
  return { anwenden: false, grund: nb ? 'unsicher: Sprung nur am Nachbartag mit Versatz ' + nb.versatzHandelstage + ' (nicht der Folgetag)' : 'die Rohdatei zeigt am Ex-Tag und +-3 Handelstage keinen Sprung' };
}
/** Sprung von Schluss zu naechster Eroeffnung um mehr als `schwelle` (0,4 = 40 %), auf oder ab. */
function grosserSprung(schluss, eroeffnung, schwelle) {
  if (!(schluss > 0) || !(eroeffnung > 0)) return false;
  var v = eroeffnung / schluss;
  return v > 1 + schwelle || v < 1 - schwelle;
}

/* ---------- Dateien ---------- */
function schreibe(name, obj) { var p = path.join(HIER, name); fs.writeFileSync(p + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(p + '.tmp', p); return p; }
function atomar(pfad, text) { fs.writeFileSync(pfad + '.tmp', text); fs.renameSync(pfad + '.tmp', pfad); }
/** Schreibschutz: geschrieben wird auf E: nur unter den zwei neuen Ordnern. Alles andere wirft. */
function nurNeu(pfad) {
  var p = String(pfad).replace(/\\/g, '/');
  if (p.indexOf(ABL + '/') !== 0 && p.indexOf(BER2 + '/') !== 0) throw new Error('Schreibschutz: ' + p + ' liegt nicht in einem der zwei neuen Ordner');
  return p;
}
var LZMJ = null;
function lebenszeitMinuten() { if (!LZMJ) LZMJ = JSON.parse(fs.readFileSync(LZM, 'utf8')); return LZMJ; }

module.exports = {
  HIER: HIER, ABL: ABL, LZM: LZM, BER2: BER2, X_LEBEND: X_LEBEND,
  KENNUNG_LZM: KENNUNG_LZM, KENNUNG_KOPIEN: KENNUNG_KOPIEN, KENNUNG_LESER: KENNUNG_LESER, KENNUNG_GRUENDE: KENNUNG_GRUENDE,
  lebenszeitZeile: lebenszeitZeile, panelDeckel: panelDeckel,
  SPERRE_MIN_LOG: SPERRE_MIN_LOG, SPERRE_ANTEIL: SPERRE_ANTEIL, zeigtSprung: zeigtSprung, satzEntscheid: satzEntscheid, grosserSprung: grosserSprung,
  schreibe: schreibe, atomar: atomar, nurNeu: nurNeu, lebenszeitMinuten: lebenszeitMinuten
};
