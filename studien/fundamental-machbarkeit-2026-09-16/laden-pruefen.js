'use strict';
/* Nachpruefung des Ladens: je Quartal (1) ZIP-Groesse gegen Content-Length des Servers (HEAD, User-Agent mit Kontakt),
 * (2) sub.txt/num.txt-Groesse gegen die im ZIP-Verzeichnis eingetragene entpackte Groesse, (3) keine .teil-Reste.
 * Grund: die geplante Aufgabe lief zweimal an (Trigger + Start-ScheduledTask) - zwei Instanzen koennten dieselbe
 * Datei geschrieben haben. Eine Datei gilt nur als da, wenn Groesse UND Verzeichnis-Eintrag stimmen.
 * Schreibt: E:/Markt-Dashboard-Archiv/edgar-fsds/_laden-pruefung.json
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var yauzl = require('yauzl');
var WURZEL = 'E:/Markt-Dashboard-Archiv/edgar-fsds';
var UA = 'Markt-Dashboard Studie (wilhelm.gms@gmail.com)';
function groesse(p) { try { return fs.statSync(p).size; } catch (e) { return -1; } }
function kopf(url) { return new Promise(function (ok, nein) { var req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': UA } }, function (res) { res.resume(); ok({ status: res.statusCode, laenge: parseInt(res.headers['content-length'] || '-1', 10) }); }); req.setTimeout(60000, function () { req.destroy(new Error('Zeit')); }); req.on('error', nein); req.end(); }); }
function verzeichnis(zip) { return new Promise(function (ok, nein) { var e = {}; yauzl.open(zip, { lazyEntries: true }, function (err, zf) { if (err) return nein(err); zf.readEntry(); zf.on('entry', function (x) { e[path.basename(x.fileName).toLowerCase()] = x.uncompressedSize; zf.readEntry(); }); zf.on('end', function () { ok(e); }); zf.on('error', nein); }); }); }
async function main() {
  var qs = fs.readdirSync(WURZEL).filter(function (f) { return /^\d{4}q[1-4]\.zip$/.test(f); }).map(function (f) { return f.slice(0, 6); }).sort();
  var aus = { stand: new Date().toISOString(), quartale: {}, fehler: 0, teilReste: fs.readdirSync(WURZEL).filter(function (f) { return /\.teil$/.test(f); }) };
  qs.forEach(function (q) { try { fs.readdirSync(path.join(WURZEL, q)).forEach(function (f) { if (/\.teil$/.test(f)) aus.teilReste.push(q + '/' + f); }); } catch (e) { /* kein Ordner */ } });
  for (var i = 0; i < qs.length; i++) {
    var q = qs[i], zip = path.join(WURZEL, q + '.zip');
    var k = await kopf('https://www.sec.gov/files/dera/data/financial-statement-data-sets/' + q + '.zip');
    await new Promise(function (ok) { setTimeout(ok, 150); });
    var r = { zipBytes: groesse(zip), serverBytes: k.laenge, zipOk: k.status === 200 && groesse(zip) === k.laenge };
    try {
      var v = await verzeichnis(zip);
      r.subBytes = groesse(path.join(WURZEL, q, 'sub.txt')); r.subSoll = v['sub.txt']; r.numBytes = groesse(path.join(WURZEL, q, 'num.txt')); r.numSoll = v['num.txt'];
      r.subOk = r.subBytes === r.subSoll; r.numOk = r.numBytes === r.numSoll;
    } catch (e) { r.zipLesbar = false; r.fehler = String(e.message); }
    r.ok = !!(r.zipOk && r.subOk && r.numOk);
    if (!r.ok) aus.fehler++;
    aus.quartale[q] = r;
    console.log(q, r.ok ? 'ok' : 'FEHLER ' + JSON.stringify(r));
  }
  aus.teilReste.length && console.log('TEIL-RESTE', aus.teilReste);
  fs.writeFileSync(path.join(WURZEL, '_laden-pruefung.json'), JSON.stringify(aus, null, 1));
  console.log('Quartale', qs.length, 'Fehler', aus.fehler, 'Teil-Reste', aus.teilReste.length);
}
main().catch(function (e) { console.error(e); process.exit(1); });
