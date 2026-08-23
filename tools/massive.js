'use strict';
/* Gemeinsame Anbindung an die Massive-REST-Schnittstelle (Basis-Stufe).
 *
 * WICHTIG ZUM SCHLUESSEL: Er wird NIE ausgegeben, nie geloggt, nie in eine Datei
 * geschrieben, die das Werkzeug selbst anlegt. Er kommt aus genau zwei Quellen:
 *   1. Umgebungsvariable MASSIVE_KEY
 *   2. <Downloads>/Markt-Dashboard-Daten/massive.key  (nur die Datei, nichts anderes)
 * Wilhelm traegt ihn selbst ein. Fehlt er, bricht das Werkzeug mit einem Hinweis ab -
 * es fragt nicht nach und rateet nichts.
 *
 * KEIN NETZWERKPFAD IN DER APP: Dieses Modul liegt unter tools/ und wird nur von
 * Hand oder aus einer geplanten Aufgabe aufgerufen. Die App selbst bindet es nicht
 * ein - build.files nimmt nur die obersten *.js, tools/ ist nicht im Paket.
 *
 * TEMPO: Die Basis-Stufe erlaubt 5 Abrufe je Minute. Das Werkzeug haelt 13 Sekunden
 * Abstand (5 waeren 12) und wiederholt bei HTTP 429 mit wachsender Pause. Wer das
 * umgeht, wird gesperrt - und eine Sperre kostet mehr Zeit als das Warten.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');

var HOST = 'api.massive.com';
var ABSTAND_MS = 13000;         // 5 Abrufe/Minute mit Sicherheitsrand
var letzterAbruf = 0;

function datenOrdner() {
  return path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
}
/** Eigener Ablageort - das Kursarchiv der App wird NICHT angefasst. */
function ablage(unterordner) {
  var p = path.join(datenOrdner(), 'massive', unterordner || '');
  fs.mkdirSync(p, { recursive: true });
  return p;
}

function schluessel() {
  if (process.env.MASSIVE_KEY && process.env.MASSIVE_KEY.trim()) return process.env.MASSIVE_KEY.trim();
  var p = path.join(datenOrdner(), 'massive.key');
  if (fs.existsSync(p)) {
    var s = fs.readFileSync(p, 'utf8').trim();
    if (s) return s;
  }
  throw new Error(
    'Kein Massive-Schluessel gefunden.\n' +
    '  Entweder: Umgebungsvariable MASSIVE_KEY setzen\n' +
    '  oder:     den Schluessel in ' + p + ' schreiben (nur der Schluessel, sonst nichts).\n' +
    '  Die Datei liegt im Datenordner, nicht im Repo - sie wird nie committet.');
}

function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/** Ein Abruf. Gibt den geparsten Rumpf zurueck. Wirft bei HTTP-Fehlern ausser 429. */
function roh(pfadOderUrl, key, versuch) {
  versuch = versuch || 1;
  var u = pfadOderUrl.indexOf('http') === 0 ? new URL(pfadOderUrl) : new URL('https://' + HOST + pfadOderUrl);
  return new Promise(function (res, rej) {
    var req = https.get({
      host: u.host, path: u.pathname + u.search,
      headers: { Authorization: 'Bearer ' + key, Accept: 'application/json', 'User-Agent': 'markt-dashboard' },
      timeout: 30000,
    }, function (r) {
      var b = '';
      r.on('data', function (d) { b += d; });
      r.on('end', function () {
        if (r.statusCode === 429) {
          if (versuch > 5) return rej(new Error('HTTP 429 auch nach fuenf Versuchen - Tempo weiter senken.'));
          var pause = ABSTAND_MS * versuch;
          console.log('   Tempolimit erreicht, warte ' + Math.round(pause / 1000) + ' s …');
          return warte(pause).then(function () { roh(pfadOderUrl, key, versuch + 1).then(res, rej); });
        }
        if (r.statusCode >= 300) {
          /* Der Schluessel steckt im Header, nicht in der URL - die Fehlermeldung
           * kann ihn also nicht enthalten. Trotzdem wird der Rumpf gekuerzt. */
          return rej(new Error('HTTP ' + r.statusCode + ' auf ' + u.pathname + ' – ' + b.slice(0, 200)));
        }
        try { res(JSON.parse(b)); } catch (e) { rej(new Error('Antwort unlesbar auf ' + u.pathname)); }
      });
    });
    req.on('timeout', function () { req.destroy(new Error('Zeitueberschreitung')); });
    req.on('error', rej);
  });
}

/** Abruf mit Tempolimit. */
async function hole(pfadOderUrl, key) {
  var seit = Date.now() - letzterAbruf;
  if (seit < ABSTAND_MS) await warte(ABSTAND_MS - seit);
  letzterAbruf = Date.now();
  return roh(pfadOderUrl, key);
}

/** Alle Seiten einer Liste. maxSeiten begrenzt bewusst - ein Lauf soll planbar enden. */
async function alleSeiten(pfad, key, maxSeiten, aufSeite) {
  var out = [], url = pfad, seite = 0;
  while (url && seite < (maxSeiten || 50)) {
    var j = await hole(url, key);
    var teil = j.results || [];
    out = out.concat(teil);
    seite++;
    if (aufSeite) aufSeite(seite, teil.length, out.length);
    url = j.next_url || null;
  }
  return { eintraege: out, seiten: seite, abgebrochen: !!url };
}

module.exports = { hole: hole, alleSeiten: alleSeiten, schluessel: schluessel, ablage: ablage,
  datenOrdner: datenOrdner, HOST: HOST, ABSTAND_MS: ABSTAND_MS };
