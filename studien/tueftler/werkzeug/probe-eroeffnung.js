'use strict';
/* Tueftler-Sonde, 27.08.2026 — EINE einzige Abfrage.
 *
 * Frage: Liefert die Quelle zu den Tagesbalken einen Eroeffnungskurs (`o`)?
 * Anlass: Alle 1.164 abgelegten Reihen der Verschwundenen tragen fuenf Felder
 *         [t, c, v, h, l] — kein `o`. Damit ist zu klaeren, ob die QUELLE keinen
 *         Eroeffnungskurs fuehrt (dann ist der Weg 3 der Ueberlebensluecke tot)
 *         oder ob ihn erst die ABLAGE weggeworfen hat (dann ist er nachholbar).
 *
 * Es wird nichts geschrieben und nichts veraendert; die Ausgabe nennt nur die
 * Feldnamen der ersten Kerze, nie den Schluessel.
 */
var M = require('../../../tools/massive.js');

(async function () {
  var key = M.schluessel();
  var sym = process.argv[2] || 'AACB';
  var von = process.argv[3] || '2025-06-02';
  var bis = process.argv[4] || '2025-06-06';
  var pfad = '/v2/aggs/ticker/' + encodeURIComponent(sym) + '/range/1/day/' + von + '/' + bis +
    '?adjusted=true&sort=asc&limit=50';
  var j = await M.hole(pfad, key);
  var r = (j.results || []);
  console.log('Symbol      : ' + sym + '   Zeitraum ' + von + ' .. ' + bis);
  console.log('Kerzen      : ' + r.length);
  if (!r.length) { console.log('KEINE Kerzen — Sonde unentschieden.'); return; }
  console.log('Feldnamen   : ' + Object.keys(r[0]).sort().join(' '));
  console.log('hat "o"     : ' + (Object.prototype.hasOwnProperty.call(r[0], 'o') ? 'JA' : 'NEIN'));
  console.log('erste Kerze : ' + JSON.stringify(r[0]));
})().catch(function (e) { console.error('FEHLER: ' + e.message); process.exit(1); });
