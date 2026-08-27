'use strict';
/* Tueftler, 27.08.2026 - lebt die Reihe bei der ZWEITEN Quelle?
 *
 * ANLASS UND EIGENE KORREKTUR. Mein Falsch-Positiv-Kriterium von heute Nacht wollte
 * das Ueberlebensarchiv als Zeugen nehmen ("hat frische Kerzen"). Das geht nicht:
 * genau die fuenf Streitreihen sind die, die der Wachhund als RUECKSTAENDIG fuehrt,
 * und ihre letzten Kerzen tragen Umsatz 0 - die bekannte Stempel-Signatur. Ein
 * haengendes Archiv kann nicht bezeugen, ob ein Papier handelt.
 *
 * Also die unabhaengige Quelle fragen. Unterschieden wird nicht nach der ZAHL der
 * Kerzen, sondern nach UMSATZ: eine Kerze mit Umsatz 0 ist kein Handelstag.
 * Zusaetzlich wird der Instrumententyp mitgelesen - am 26.08. kamen bei sieben von
 * acht Abfragen auf delistete Kuerzel Fonds unter demselben Kuerzel zurueck.
 *
 * Nur lesen. Es wird nichts geschrieben ausser dem Ergebnis.
 */
var https = require('https');
var fs = require('fs');
var path = require('path');

function hole(sym) {
  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
    '?range=1mo&interval=1d';
  return new Promise(function (ok, fehl) {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function (res) {
      var s = '';
      res.on('data', function (d) { s += d; });
      res.on('end', function () {
        try { ok(JSON.parse(s)); } catch (e) { fehl(new Error('kein JSON, HTTP ' + res.statusCode)); }
      });
    }).on('error', fehl);
  });
}

(async function () {
  var syms = process.argv.slice(2);
  if (!syms.length) syms = ['AVB', 'EQR', 'WBS', 'LBRDA', 'LBRDK', 'TWO', 'AAPL'];
  var erg = [];
  for (var i = 0; i < syms.length; i++) {
    var sym = syms[i];
    var z = { sym: sym };
    try {
      var j = await hole(sym);
      var r = j.chart && j.chart.result && j.chart.result[0];
      if (!r) { z.fehler = (j.chart && j.chart.error && j.chart.error.description) || 'kein Ergebnis'; erg.push(z); continue; }
      var m = r.meta || {};
      z.typ = m.instrumentType; z.boerse = m.fullExchangeName || m.exchangeName; z.waehrung = m.currency;
      var ts = r.timestamp || [];
      var q = (r.indicators && r.indicators.quote && r.indicators.quote[0]) || {};
      var tage = [];
      for (var k = 0; k < ts.length; k++) {
        tage.push({
          t: new Date(ts[k] * 1000).toISOString().slice(0, 10),
          c: q.close ? q.close[k] : null,
          v: q.volume ? q.volume[k] : null
        });
      }
      /* DREI Zustaende, nicht zwei - das war der Fehler im ersten Anlauf:
       *   v > 0   gehandelt
       *   v === 0 Stempelkerze: die Quelle haengt sie an, es gab keinen Handel
       *   v null  gar keine Daten (Yahoo fuellt den Bereich bis heute auf)
       * "Kerzen zaehlen" vermengt alle drei und beweist gar nichts. */
      var mitUmsatz = tage.filter(function (x) { return x.v > 0; });
      z.kerzen = tage.length;
      z.kerzenGehandelt = mitUmsatz.length;
      z.kerzenStempel = tage.filter(function (x) { return x.v === 0; }).length;
      z.kerzenLeer = tage.filter(function (x) { return x.v === null || x.v === undefined; }).length;
      z.letzteMitUmsatz = mitUmsatz.length ? mitUmsatz[mitUmsatz.length - 1].t : null;
      z.letzteUeberhaupt = tage.length ? tage[tage.length - 1].t : null;
      z.letzteFuenf = tage.slice(-5);
    } catch (e) { z.fehler = e.message; }
    erg.push(z);
    await new Promise(function (ok) { setTimeout(ok, 900); });
  }
  var out = {
    erzeugt: new Date().toISOString(),
    frage: 'Handeln die fuenf Streitreihen bei der zweiten Quelle noch - gemessen am Umsatz, nicht an der Kerzenzahl?',
    quelle: 'yahoo v8 chart, range=1mo interval=1d',
    ergebnisse: erg
  };
  var ziel = path.join(__dirname, '..', 'daten', 'probe-yahoo-lebend-2026-08-27.json');
  fs.writeFileSync(ziel, JSON.stringify(out, null, 1));
  erg.forEach(function (z) {
    if (z.fehler) { console.log(z.sym.padEnd(7) + 'FEHLER: ' + z.fehler); return; }
    console.log(z.sym.padEnd(7) + String(z.typ).padEnd(8) + String(z.boerse).padEnd(11) +
      ' Kerzen=' + String(z.kerzen).padStart(3) +
      ' | gehandelt=' + String(z.kerzenGehandelt).padStart(3) +
      ' Stempel=' + String(z.kerzenStempel).padStart(3) +
      ' leer=' + String(z.kerzenLeer).padStart(3) +
      ' | letzter Umsatz ' + z.letzteMitUmsatz);
  });
  console.log('geschrieben: ' + ziel);
})().catch(function (e) { console.error('FEHLER: ' + e.message); process.exit(1); });
