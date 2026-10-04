'use strict';
/* Pruefbericht "Lader-Stoerungen" (Oktober 2026): die Kleinsttests.
 *
 * FRAGE: Reagieren die Lader der App (kurse.js, kerzenquelle.js, livesammler.js, alpacaarchiv.js,
 * archiv.js, sammelrunde.js) auf die bekannten Stoerungen der Quellen richtig - verwerfen, behalten,
 * melden - oder schreiben sie still falsche Daten in den Store? Je Stoerung ein Kleinsttest mit
 * nachgebauter Antwort. Bericht: pruefberichte/2026-10-lader-stoerungen.md (Stand 61dca2c).
 *
 * Die Tests stehen je Lader unter pruefberichte/lader-stoerungen/<lader>.test.js; diese Datei ist der
 * gemeinsame Laeufer. Jeder Test druckt GENAU EINE Zeile:
 *   "ZEIGT ABWEICHUNG: [ID] ..."   der heutige Code reagiert anders als die Stoerung verlangt
 *   "kein Unterschied: [ID] ..."   der heutige Code reagiert richtig
 *   "TEST KAPUTT: [ID] ..."        der Test hat seinen Weg nicht betreten oder ist abgestuerzt
 * Danach eine Summenzeile. Rueckgabewert: 0 = Lauf vollstaendig (auch mit Abweichungen - die sind der
 * Befund), 1 = mindestens ein Test kaputt, 2 = Netz- oder Schreibsperre verletzt.
 *
 * Reines Node, kein Netz (Sperre in hilfen.js), keine Schluessel, kein Electron; geschrieben wird nur
 * in einen Wegwerf-Ordner unter %TEMP%, der am Ende geloescht wird. Nicht in `npm test` eingehaengt.
 *
 * Aufruf aus der Repo-Wurzel:
 *   node pruefberichte/lader-stoerungen.test.js            alle Tests
 *   node pruefberichte/lader-stoerungen.test.js KU KQ-3    nur Tests, deren Kennung so beginnt
 *   PRUEF_WURZEL=<Ordner> node pruefberichte/lader-stoerungen.test.js   gegen einen anderen Stand
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var H = require('./lader-stoerungen/hilfen.js');   /* zuerst: setzt Netz-, Schreibsperre und Datenordner */
var path = require('path');

var DATEIEN = ['kurse', 'kerzenquelle', 'livesammler', 'alpacaarchiv', 'archiv', 'sammelrunde'];
var DATEN0 = process.env.MD_DATEN, ALPACA0 = process.env.MD_ALPACA_WURZEL;

/** Modulweiten Zustand nach jedem Test zuruecksetzen: der Datenordner von kerzenquelle.js (datenOrdnerSetzen
 *  gilt fuer das ganze Modul) und die Alpaca-Wurzel zeigen wieder in den Wegwerf-Ordner. */
function zuruecksetzen() {
  process.env.MD_DATEN = DATEN0;
  process.env.MD_ALPACA_WURZEL = ALPACA0;
  var kq = require.cache[require.resolve(path.join(H.WURZEL, 'kerzenquelle.js'))];
  if (kq && kq.exports && typeof kq.exports.datenOrdnerSetzen === 'function') kq.exports.datenOrdnerSetzen(DATEN0);
}

async function laufe(module_, filter) {
  filter = (filter || []).filter(Boolean);
  var n = { abw: 0, gleich: 0, kaputt: 0 };
  for (var m = 0; m < module_.length; m++) {
    var mod = module_[m];
    var tests = (mod && mod.tests) || [];
    for (var i = 0; i < tests.length; i++) {
      var t = tests[i];
      if (filter.length && !filter.some(function (f) { return t.id.indexOf(f) === 0; })) continue;
      try {
        var erg = await t.lauf(H);
        if (!erg || typeof erg.abweichung !== 'boolean' || !erg.text) throw new Error('Test lieferte kein { abweichung, text }');
        H.zeile(t.id, erg.abweichung, erg.text);
        if (erg.abweichung) n.abw++; else n.gleich++;
      } catch (e) {
        console.log('TEST KAPUTT: [' + t.id + '] ' + String((e && e.message) || e).split('\n')[0]);
        n.kaputt++;
      }
      zuruecksetzen();
    }
  }
  var v = H.verstoesse();
  console.log('--- ' + (n.abw + n.gleich + n.kaputt) + ' Tests: ' + n.abw + ' zeigen Abweichung, ' + n.gleich +
    ' kein Unterschied, ' + n.kaputt + ' kaputt; Netzversuche ' + v.netz.length + ', Schreibversuche ausserhalb ' + v.schreiben.length);
  v.netz.concat(v.schreiben).forEach(function (x) { console.log('SPERRE VERLETZT: ' + x); });
  H.aufraeumen();
  process.exitCode = (v.netz.length || v.schreiben.length) ? 2 : (n.kaputt ? 1 : 0);
  return n;
}

module.exports = { laufe: laufe };

if (require.main === module) {
  var mods = [], ladeFehler = 0;
  DATEIEN.forEach(function (d) {
    try { mods.push(require(path.join(__dirname, 'lader-stoerungen', d + '.test.js'))); }
    catch (e) { console.log('TEST KAPUTT: [' + d + '] Datei laedt nicht: ' + String((e && e.message) || e).split('\n')[0]); ladeFehler++; }
  });
  laufe(mods, process.argv.slice(2)).then(function () { if (ladeFehler && !process.exitCode) process.exitCode = 1; });
}
