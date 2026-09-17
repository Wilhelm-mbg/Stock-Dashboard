'use strict';
/* Schritt 0 der Fundamentaltafel: alle FSDS-Quartale 2016q1 .. 2026q3 nach E:/Markt-Dashboard-Archiv/edgar-fsds/.
 *
 * Je Quartal:  <q>.zip  (Beleg, bleibt liegen)  und  <q>/sub.txt + <q>/num.txt  (nur diese zwei werden entpackt;
 * tag.txt/pre.txt/readme.htm werden NIE geschrieben - "Rest loeschen" aus dem Auftrag heisst hier: gar nicht erst anlegen).
 * Die zwei Quartale der Machbarkeit (2019q2, 2024q2) bleiben unangetastet.
 *
 * Regeln: User-Agent mit Kontakt, hoechstens 2 Abrufe gleichzeitig (Deckel der SEC: 10 Anfragen/s, hier irrelevant).
 * Eine Datei gilt erst als da, wenn sie mit der vom Server gemeldeten Groesse (Content-Length) auf der Platte liegt:
 * Download nach <q>.zip.teil, Groesse pruefen, dann umbenennen. Entpacken nach <name>.teil, dann umbenennen.
 * Wiederaufnehmbar: fertige Quartale werden uebersprungen. 404 (Quartal noch nicht veroeffentlicht) wird notiert.
 *
 * Stand: E:/Markt-Dashboard-Archiv/edgar-fsds/_laden.json ; Log: laden.log im Studienordner.
 * Aufruf: node laden.js [--parallel 2]
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var yauzl = require('yauzl');

var WURZEL = 'E:/Markt-Dashboard-Archiv/edgar-fsds';
var UA = 'Markt-Dashboard Studie (wilhelm.gms@gmail.com)';
var LOG = path.join(__dirname, 'laden.log');
var STAND = path.join(WURZEL, '_laden.json');
var PARALLEL = 2;
for (var i = 2; i < process.argv.length; i++) if (process.argv[i] === '--parallel') PARALLEL = parseInt(process.argv[++i], 10) || 2;

/* Auftrag: 2016q1..2026q3. Dazu 2014q1..2015q4 als VORLAUF: ein Handelstag im Januar 2016 braucht das 10-K vom
 * Herbst 2015, und das Fundamental-Momentum braucht acht Quartale Geschichte - ohne Vorlauf waere 2016 zur Haelfte leer
 * (gemessen im ersten Bau: FM in 52 % der Zeilen 2016 gegen 72-78 % ab 2017). */
function quartale() {
  var aus = [];
  for (var j = 2014; j <= 2026; j++) for (var q = 1; q <= 4; q++) { var n = j + 'q' + q; if (n <= '2026q3') aus.push(n); }
  return aus;
}
function log(s) { var z = new Date().toISOString() + ' ' + s; fs.appendFileSync(LOG, z + '\n'); console.log(z); }
function groesse(p) { try { var st = fs.statSync(p); return st.isFile() ? st.size : -1; } catch (e) { return -1; } }

var stand = { start: new Date().toISOString(), quartale: {} };
try { stand = JSON.parse(fs.readFileSync(STAND, 'utf8')); } catch (e) { /* neu */ }
function merke(q, o) { stand.quartale[q] = Object.assign(stand.quartale[q] || {}, o, { stand: new Date().toISOString() }); fs.writeFileSync(STAND, JSON.stringify(stand, null, 1)); }

function kopf(url) {
  return new Promise(function (ok, nein) {
    var req = https.request(url, { method: 'HEAD', headers: { 'User-Agent': UA } }, function (res) { res.resume(); ok({ status: res.statusCode, laenge: parseInt(res.headers['content-length'] || '-1', 10) }); });
    req.setTimeout(60000, function () { req.destroy(new Error('Zeit (HEAD)')); });
    req.on('error', nein); req.end();
  });
}
function lade(url, ziel) {
  return new Promise(function (ok, nein) {
    var req = https.get(url, { headers: { 'User-Agent': UA } }, function (res) {
      if (res.statusCode !== 200) { res.resume(); return ok({ status: res.statusCode }); }
      var laenge = parseInt(res.headers['content-length'] || '-1', 10);
      var out = fs.createWriteStream(ziel);
      res.pipe(out);
      out.on('finish', function () { ok({ status: 200, laenge: laenge, geschrieben: groesse(ziel) }); });
      out.on('error', nein); res.on('error', nein);
    });
    req.setTimeout(120000, function () { req.destroy(new Error('Zeit (GET)')); });
    req.on('error', nein);
  });
}
/* Nur sub.txt und num.txt aus dem ZIP; jede Datei erst als .teil, dann umbenannt. */
function entpacke(zip, ordner) {
  return new Promise(function (ok, nein) {
    var will = { 'sub.txt': 1, 'num.txt': 1 }, fertig = {};
    yauzl.open(zip, { lazyEntries: true }, function (err, zf) {
      if (err) return nein(err);
      zf.readEntry();
      zf.on('entry', function (e) {
        var name = path.basename(e.fileName).toLowerCase();
        if (!will[name] || /\/$/.test(e.fileName)) return zf.readEntry();
        zf.openReadStream(e, function (err2, strom) {
          if (err2) return nein(err2);
          var ziel = path.join(ordner, name);
          var out = fs.createWriteStream(ziel + '.teil');
          strom.pipe(out);
          out.on('finish', function () {
            if (groesse(ziel + '.teil') !== e.uncompressedSize) return nein(new Error(name + ': entpackt ' + groesse(ziel + '.teil') + ' statt ' + e.uncompressedSize));
            fs.renameSync(ziel + '.teil', ziel);
            fertig[name] = e.uncompressedSize;
            zf.readEntry();
          });
          out.on('error', nein); strom.on('error', nein);
        });
      });
      zf.on('end', function () { ok(fertig); });
      zf.on('error', nein);
    });
  });
}

async function quartal(q) {
  var ordner = path.join(WURZEL, q), zip = path.join(WURZEL, q + '.zip');
  var url = 'https://www.sec.gov/files/dera/data/financial-statement-data-sets/' + q + '.zip';
  if (groesse(path.join(ordner, 'sub.txt')) > 0 && groesse(path.join(ordner, 'num.txt')) > 0) {
    merke(q, { status: 'vorhanden', sub: groesse(path.join(ordner, 'sub.txt')), num: groesse(path.join(ordner, 'num.txt')), zip: groesse(zip) });
    return log(q + ' vorhanden (sub ' + groesse(path.join(ordner, 'sub.txt')) + ', num ' + groesse(path.join(ordner, 'num.txt')) + ')');
  }
  var k = await kopf(url);
  if (k.status === 404) { merke(q, { status: '404' }); return log(q + ' 404 - noch nicht veroeffentlicht'); }
  if (k.status !== 200) { merke(q, { status: 'HTTP ' + k.status }); return log(q + ' HTTP ' + k.status + ' (HEAD)'); }
  if (groesse(zip) !== k.laenge) {
    var t0 = Date.now();
    var r = await lade(url, zip + '.teil');
    if (r.status !== 200) { merke(q, { status: 'HTTP ' + r.status }); return log(q + ' HTTP ' + r.status + ' (GET)'); }
    if (r.geschrieben !== r.laenge || r.laenge !== k.laenge) { merke(q, { status: 'groesse falsch', erwartet: k.laenge, geschrieben: r.geschrieben }); return log(q + ' GROESSE FALSCH: ' + r.geschrieben + ' statt ' + k.laenge); }
    fs.renameSync(zip + '.teil', zip);
    log(q + ' geladen ' + r.laenge + ' Bytes in ' + Math.round((Date.now() - t0) / 1000) + ' s');
  } else log(q + ' ZIP schon da (' + k.laenge + ' Bytes)');
  merke(q, { status: 'zip', zip: groesse(zip) });
  if (!fs.existsSync(ordner)) fs.mkdirSync(ordner, { recursive: true });
  var t1 = Date.now();
  var f = await entpacke(zip, ordner);
  if (!(f['sub.txt'] > 0) || !(f['num.txt'] > 0)) { merke(q, { status: 'entpacken unvollstaendig', dateien: f }); return log(q + ' ENTPACKEN UNVOLLSTAENDIG ' + JSON.stringify(f)); }
  merke(q, { status: 'fertig', zip: groesse(zip), sub: f['sub.txt'], num: f['num.txt'], sekundenEntpacken: Math.round((Date.now() - t1) / 1000) });
  log(q + ' entpackt sub ' + f['sub.txt'] + ' num ' + f['num.txt'] + ' in ' + Math.round((Date.now() - t1) / 1000) + ' s');
}

async function main() {
  var liste = quartale();
  log('Start: ' + liste.length + ' Quartale, ' + PARALLEL + ' parallel');
  var i = 0, fehler = 0;
  async function arbeiter() {
    while (i < liste.length) {
      var q = liste[i++];
      try { await quartal(q); } catch (e) { fehler++; merke(q, { status: 'fehler', fehler: String(e && e.message || e) }); log(q + ' FEHLER ' + (e && e.message || e)); }
    }
  }
  var a = [];
  for (var w = 0; w < PARALLEL; w++) a.push(arbeiter());
  await Promise.all(a);
  stand.ende = new Date().toISOString(); stand.fehler = fehler;
  fs.writeFileSync(STAND, JSON.stringify(stand, null, 1));
  log('Ende, Fehler: ' + fehler);
}
main().catch(function (e) { log('ABBRUCH ' + (e && e.stack || e)); process.exit(1); });
