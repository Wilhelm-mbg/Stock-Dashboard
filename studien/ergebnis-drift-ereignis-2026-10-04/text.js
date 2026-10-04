'use strict';
/* Textabruf fuer die Zeitpruefung (§5.2) und die Handprobe (§5.3): der ANFANG einer Einreichung von www.sec.gov.
 * Nur die ersten Kilobyte werden gelesen, dann wird die Verbindung abgebrochen. Die Kennung kommt als Konstante UA aus dem
 * vorhandenen Lader (nicht abgeschrieben, nie ausgegeben). Eigener Takt wie in abruf.js: eine Spur, mindestens K.TAKT_MS
 * zwischen zwei Anfragen. NIE gleichzeitig mit `abruf.js --alle` laufen lassen (ein Prozess, eine Spur).
 * Gecacht wird der gelesene Anfang unter E:/Markt-Dashboard-Archiv/edgar-submissions/kopf/.
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var zlib = require('zlib');
var K = require('./konfig.js');
var ALT = require(K.ALTER_LADER);

var letzte = 0, ANFRAGEN = 0;
function schlaf(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
function takt() {
  var rest = letzte + K.TAKT_MS - Date.now();
  return (rest > 0 ? schlaf(rest) : Promise.resolve()).then(function () { letzte = Date.now(); });
}

/** Die ersten maxBytes (entpackt) einer Adresse. Liefert {code, text, abgeschnitten}. */
function holeAnfang(url, maxBytes) {
  return takt().then(function () {
    return new Promise(function (ok, nein) {
      ANFRAGEN++;
      var fertig = false;
      function ende(code, teile, abgeschnitten) { if (fertig) return; fertig = true; ok({ code: code, text: Buffer.concat(teile).toString('utf8'), abgeschnitten: abgeschnitten }); }
      var req = https.get(url, { headers: { 'User-Agent': ALT.UA, 'Accept-Encoding': 'gzip' } }, function (res) {
        var strom = res, teile = [], n = 0;
        if (res.headers['content-encoding'] === 'gzip') strom = res.pipe(zlib.createGunzip());
        strom.on('data', function (d) {
          teile.push(d); n += d.length;
          if (n >= maxBytes) { ende(res.statusCode, teile, true); req.destroy(); }
        });
        strom.on('end', function () { ende(res.statusCode, teile, false); });
        strom.on('error', function (e) { if (!fertig) nein(e); });
        res.on('error', function (e) { if (!fertig) nein(e); });
      });
      req.setTimeout(60000, function () { req.destroy(new Error('Zeit')); });
      req.on('error', function (e) { if (!fertig) nein(e); });
    });
  });
}

function adresse(cik, akzession) { return 'https://www.sec.gov/Archives/edgar/data/' + Number(cik) + '/' + akzession + '.txt'; }

/** Anfang einer Einreichung, gecacht (Datei <Akzession>-<maxBytes>.txt). 429/403 wird hochgeworfen, nicht abgelegt. */
async function einreichungAnfang(cik, akzession, maxBytes) {
  var p = path.join(K.CACHE_KOPF, akzession + '-' + maxBytes + '.txt');
  if (fs.existsSync(p)) return fs.readFileSync(p, 'utf8');
  var r = await holeAnfang(adresse(cik, akzession), maxBytes);
  if (r.code !== 200) throw new Error('HTTP ' + r.code + ' fuer ' + akzession);
  if (!fs.existsSync(K.CACHE_KOPF)) fs.mkdirSync(K.CACHE_KOPF, { recursive: true });
  fs.writeFileSync(p, r.text);
  return r.text;
}

module.exports = { holeAnfang: holeAnfang, einreichungAnfang: einreichungAnfang, adresse: adresse, anfragen: function () { return ANFRAGEN; } };
