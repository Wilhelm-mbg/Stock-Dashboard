'use strict';
/* DIAGNOSE der Massive-Anmeldung. Gebaut, weil ein erster Lauf HTTP 401
 * "Unknown API Key" ergab und die urspruengliche Annahme (Authorization: Bearer)
 * aus der Doku eines GLEICHNAMIGEN, aber anderen Produkts stammte
 * (docs.joinmassive.com ist ein Proxy-Netzwerk, nicht die Finanzdaten).
 *
 * Statt zu raten wird gemessen. Geprueft werden nacheinander:
 *   1. die Schluesseldatei selbst - Form, nicht Inhalt
 *   2. drei Anmeldeverfahren gegen einen billigen Endpunkt
 *
 * DER SCHLUESSEL WIRD NIE AUSGEGEBEN. Weder ganz noch teilweise. Was ausgegeben
 * wird, sind Laenge und Zeichenklassen - genug, um den haeufigsten Windows-Fehler
 * zu erkennen (echo "..." > datei schreibt die Anfuehrungszeichen MIT), ohne dass
 * der Schluessel in einem Protokoll, einer Sitzung oder einem Screenshot landet.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');

var DATEI = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive.key');

function form(s) {
  var b = Buffer.from(s, 'utf8');
  return {
    laenge: s.length,
    bom: b.length >= 3 && b[0] === 0xEF && b[1] === 0xBB && b[2] === 0xBF,
    anfuehrung: /^["']|["']$/.test(s),
    leerzeichen: /\s/.test(s),
    zeilenumbruch: /[\r\n]/.test(s),
    nurHexUndStrich: /^[0-9a-fA-F-]+$/.test(s),
    sieht_aus_wie_uuid: /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s),
    zeichenklassen: [
      /[a-z]/.test(s) ? 'klein' : null, /[A-Z]/.test(s) ? 'GROSS' : null,
      /[0-9]/.test(s) ? 'Ziffern' : null, /[-_]/.test(s) ? 'Strich' : null,
      /[^0-9a-zA-Z\-_]/.test(s) ? 'Sonderzeichen' : null,
    ].filter(Boolean).join(', '),
  };
}

function probe(name, aufbau) {
  return new Promise(function (res) {
    var o = aufbau();
    https.get({ host: 'api.massive.com', path: o.pfad, headers: o.header, timeout: 20000 }, function (r) {
      var b = '';
      r.on('data', function (d) { b += d; });
      r.on('end', function () {
        var kurz = b.slice(0, 160).replace(/\s+/g, ' ');
        res({ name: name, status: r.statusCode, rumpf: kurz });
      });
    }).on('error', function (e) { res({ name: name, status: 0, rumpf: String(e.message) }); })
      .on('timeout', function () { res({ name: name, status: 0, rumpf: 'Zeitueberschreitung' }); });
  });
}

(async function () {
  console.log('=== 1) Die Schluesseldatei ===');
  if (!fs.existsSync(DATEI)) {
    if (!process.env.MASSIVE_KEY) { console.error('Weder ' + DATEI + ' noch MASSIVE_KEY vorhanden.'); process.exit(2); }
    console.log('  Datei fehlt, aber MASSIVE_KEY ist gesetzt - pruefe die.');
  }
  var rohText = process.env.MASSIVE_KEY || fs.readFileSync(DATEI, 'utf8');
  var f = form(rohText);
  console.log('  roh:      ' + f.laenge + ' Zeichen' +
    (f.bom ? ', MIT BOM' : '') + (f.anfuehrung ? ', MIT Anfuehrungszeichen' : '') +
    (f.zeilenumbruch ? ', mit Zeilenumbruch' : '') + (f.leerzeichen ? ', mit Leerzeichen' : ''));
  /* Bereinigen wie das Werkzeug es tut, plus Anfuehrungszeichen - das ist der
   * Windows-Klassiker: echo "abc" > datei schreibt "abc" MIT Anfuehrungszeichen. */
  var key = rohText.replace(/^﻿/, '').trim().replace(/^["']|["']$/g, '').trim();
  var g = form(key);
  console.log('  bereinigt: ' + g.laenge + ' Zeichen, Zeichen: ' + g.zeichenklassen +
    (g.sieht_aus_wie_uuid ? '  -> sieht aus wie eine UUID' : ''));
  if (f.anfuehrung) console.log('  !! Die Datei enthaelt Anfuehrungszeichen. In der Eingabeaufforderung schreibt\n' +
    '     echo "abc" > datei  die Zeichen MIT. Richtig ist:  echo abc> datei  (ohne Leerzeichen vor >)');
  if (g.sieht_aus_wie_uuid) console.log('  !! Eine UUID ist auf der Massive-Seite die ACCESS KEY ID fuer die S3-Ablage,\n' +
    '     nicht der API-Schluessel. Der API-Schluessel steht unter „Accessing the API".');
  if (g.laenge < 16) console.log('  !! Sehr kurz - ist das wirklich der ganze Schluessel?');

  console.log('\n=== 2) Anmeldeverfahren ===');
  console.log('  Geprueft wird gegen einen billigen Endpunkt (eine Seite, ein Ticker).');
  var pfad = '/v3/reference/tickers?active=false&market=stocks&limit=1';
  var proben = [
    ['Authorization: Bearer', function () { return { pfad: pfad, header: { Authorization: 'Bearer ' + key, Accept: 'application/json', 'User-Agent': 'markt-dashboard' } }; }],
    ['Abfrageparameter apiKey', function () { return { pfad: pfad + '&apiKey=' + encodeURIComponent(key), header: { Accept: 'application/json', 'User-Agent': 'markt-dashboard' } }; }],
    ['X-API-Key', function () { return { pfad: pfad, header: { 'X-API-Key': key, Accept: 'application/json', 'User-Agent': 'markt-dashboard' } }; }],
  ];
  var gut = null;
  for (var i = 0; i < proben.length; i++) {
    var r = await probe(proben[i][0], proben[i][1]);
    var zeichen = r.status === 200 ? 'OK  ' : r.status === 401 ? 'ABGELEHNT' : r.status === 429 ? 'TEMPO' : 'HTTP ' + r.status;
    console.log('  ' + proben[i][0].padEnd(26) + zeichen + '  ' + (r.status === 200 ? '' : r.rumpf.slice(0, 90)));
    if (r.status === 200 && !gut) gut = proben[i][0];
    if (i < proben.length - 1) await new Promise(function (x) { setTimeout(x, 13000); });   // Tempolimit einhalten
  }

  console.log('\n=== Ergebnis ===');
  if (gut) {
    console.log('  Es funktioniert: ' + gut);
    console.log('  Wenn das nicht "Authorization: Bearer" ist, muss tools/massive.js darauf umgestellt werden.');
  } else {
    console.log('  Kein Verfahren wurde angenommen. Wahrscheinlichste Ursachen in dieser Reihenfolge:');
    console.log('   1. Es ist der falsche Schluessel - auf der Massive-Seite gibt es zwei:');
    console.log('      "Accessing the API" -> API Key (dieser hier gebraucht)');
    console.log('      "Accessing Flat Files (S3)" -> Access Key ID + Secret (fuer die Dateiablage)');
    console.log('   2. Die Datei enthaelt Anfuehrungszeichen oder Steuerzeichen (siehe oben).');
    console.log('   3. Der Schluessel gehoert zu einem anderen Konto oder wurde neu erzeugt (Regenerate).');
  }
})();
