'use strict';
/* NACHFRAGE ZUR PROBE: Traegt ein Spin-off-Satz IRGENDWO einen KURSFAKTOR?
 *
 *   node studien/alpaca-vollsammlung-2026-09/probe-spinoff-form.js
 *
 * K5 der Massnahmen-Probe ist an genau einem Satz gefallen: der SPGI-Abspaltung. Sie
 * traegt source_rate: 1 und new_rate: 1 - "fuer ein SPGI-Stueck ein MBGL-Stueck". Das ist
 * ein STUECKVERHAELTNIS, kein Kursfaktor. Der gemessene Kursfaktor war 1,057, und den
 * kann man aus 1:1 nicht ausrechnen: er haengt am Kurs des abgespaltenen Stuecks am
 * Wirkungstag, nicht an der Stueckzahl.
 *
 * Bevor daraus eine Regel wird, wird die Form an MEHREREN bekannten Abspaltungen
 * angesehen - ein einziger Satz koennte ein Sonderfall sein. Geprueft an sieben grossen
 * Abspaltungen 2021-2024 (GE/GEHC, JNJ/KVUE, T/WBD, IBM/KD, MMM/SOLV, XOM, DOW).
 *
 * Ein Abruf. Schreibt eine Ergebnisdatei, sonst nichts.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var S = require('../vorregistrierung-2026-09-02-spannen-historisch/schluessel.js');
var P = require('./probe-massnahmen.js');

var ERGEBNIS = path.join(__dirname, 'probe-spinoff-form-ergebnis.json');
function sag(t) { process.stdout.write(S.verdecken(t) + '\n'); }

async function main() {
  if (!S.vorhanden()) { console.error('Kein Zugang: ' + S.fehlend().join(', ')); process.exit(2); }
  var url = 'https://data.alpaca.markets/v1/corporate-actions?symbols=GE,JNJ,T,IBM,MMM,XOM,DOW,SPGI' +
    '&types=spin_off&start=2016-01-01&end=2026-09-03&limit=1000';
  var res = await globalThis.fetch(url, { headers: S.kopfzeilen(), signal: AbortSignal.timeout(60000) });
  var text = await res.text();
  var daten = null; try { daten = JSON.parse(text); } catch (e) { daten = null; }
  if (res.status !== 200) { sag('HTTP ' + res.status + ' ' + S.verdecken(text.slice(0, 300))); process.exit(1); }
  var saetze = P.flach(daten);
  /* Welche Felder kommen ueberhaupt vor, und traegt eines davon einen Kursfaktor? */
  var felder = {};
  saetze.forEach(function (e) { Object.keys(e).forEach(function (f) { felder[f] = (felder[f] || 0) + 1; }); });
  var mitFaktor = saetze.filter(function (e) { return P.faktorAus(e) !== null && P.faktorAus(e) !== 1; });
  var raus = { erzeugt: new Date().toISOString(), saetze: saetze.length, felder: felder,
    mitKursfaktorUngleichEins: mitFaktor.length, beispiele: saetze.slice(0, 8) };
  fs.writeFileSync(ERGEBNIS, S.verdecken(JSON.stringify(raus, null, 1)));
  sag('Spin-off-Saetze: ' + saetze.length);
  sag('Felder (Anzahl Saetze je Feld): ' + JSON.stringify(felder));
  sag('Saetze mit einem Verhaeltnis ungleich 1: ' + mitFaktor.length);
  saetze.slice(0, 8).forEach(function (e) {
    sag('  ' + e.source_symbol + ' -> ' + e.new_symbol + '  ex ' + e.ex_date +
        '  source_rate ' + e.source_rate + '  new_rate ' + e.new_rate);
  });
  sag('Ergebnis: ' + ERGEBNIS);
}
if (require.main === module) main().catch(function (e) { console.error(S.verdecken(String(e && e.stack || e))); process.exit(1); });
