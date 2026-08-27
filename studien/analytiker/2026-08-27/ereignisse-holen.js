'use strict';
/* Analytiker 27.08.2026: Ereignis-Dateien fuer die I1-Kandidaten (29 Reihen)
 * im abgestimmten Schnittstellen-Format der Vorregistrierung skalenfehler §3.
 * Splits UND Dividenden je Kandidat (57 Abrufe, 13 s Abstand, nur lesen).
 * BYND: Splits liegen aus der Morgen-Probe vor, nur Dividenden werden geholt. */
var fs = require('fs'), path = require('path');
var M = require(path.join(__dirname, '..', '..', '..', 'tools', 'massive.js'));
var ZIEL = path.join(__dirname, '..', '..', 'vorregistrierung-2026-08-27-skalenfehler', 'ereignisse');
var KONVENTION = 'faktor bei art=split: Kursfaktor am Ausfuehrungstag = split_from/split_to (Reverse 4:1 -> 4; Forward 1:4 -> 0.25). faktor bei art=dividende: Barbetrag in USD je Aktie (KEIN Kursfaktor). datum: execution_date bzw. ex_dividend_date.';
var kandidaten = Object.keys(require('./kandidaten-i1.json')).sort();
var probe = require('./massive-probe-daten.json');

(async function () {
  var key = M.schluessel();
  var fertig = 0;
  for (var i = 0; i < kandidaten.length; i++) {
    var sym = kandidaten[i];
    var splits, divs, quelleHinweis = '';
    try {
      if (probe.splits[sym]) { splits = probe.splits[sym]; quelleHinweis = 'Splits aus der Morgen-Probe 08:45Z uebernommen; '; }
      else splits = (await M.hole('/v3/reference/splits?ticker=' + sym + '&limit=1000', key)).results || [];
      divs = (await M.hole('/v3/reference/dividends?ticker=' + sym + '&limit=1000', key)).results || [];
    } catch (e) {
      console.log(sym + ': FEHLER ' + e.message);
      continue;
    }
    var ereignisse = [];
    splits.forEach(function (s) { ereignisse.push({ datum: s.execution_date, art: 'split', faktor: s.split_from / s.split_to }); });
    divs.forEach(function (d) { ereignisse.push({ datum: d.ex_dividend_date, art: 'dividende', faktor: d.cash_amount, typ: d.dividend_type || null }); });
    ereignisse.sort(function (a, b) { return a.datum < b.datum ? 1 : -1; });
    fs.writeFileSync(path.join(ZIEL, sym + '.json'), JSON.stringify({
      sym: sym, ereignisse: ereignisse,
      quelle: 'Massive REST /v3/reference/splits und /v3/reference/dividends (Bearer, Gratis-Stufe)',
      abgerufen: new Date().toISOString(),
      abgedeckt: ['split', 'dividende'],
      konvention: KONVENTION,
      hinweis: quelleHinweis + 'I1-Kandidat (Pendel-Paar im Tagesarchiv, Enumeration des Analytikers nach der vorregistrierten I1-Definition auf dem am 27.08. neu geschriebenen Archiv).',
    }, null, 1));
    fertig++;
    console.log(sym + ': ' + splits.length + ' Splits, ' + divs.length + ' Dividenden  (' + fertig + '/' + kandidaten.length + ')');
  }
  console.log('FERTIG: ' + fertig + ' von ' + kandidaten.length + ' Kandidaten abgelegt nach ' + ZIEL);
})().catch(function (e) { console.log('ABBRUCH: ' + e.message); process.exit(1); });
