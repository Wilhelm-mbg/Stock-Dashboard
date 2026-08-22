/* Spekulations-Radar in die Gemeinschafts-Ablage hochladen (Wunsch #44)
 * =====================================================================
 * Die stuendliche Suche laeuft nur auf EINEM Rechner und schrieb bisher nur in den
 * lokalen Daten-Ordner - bei allen anderen Installationen blieb die Radar-Karte leer.
 * Dieses Skript legt dieselbe Datei zusaetzlich im Zweig "radar" des Projekts ab.
 * Die App liest von dort (feste URL in main.js) und schreibt selbst NIE ins Netz.
 *
 * Aufruf (nach dem Schreiben von spekulationen.json):
 *     node tools/radar-hochladen.js
 *
 * Der Zweig "radar" enthaelt bewusst nur diese eine Datei (elternlos, kein Code).
 * Angefasst wird ausschliesslich dieser Pfad in diesem Zweig - nie "main", kein
 * Force, nichts wird geloescht. Die Anmeldung laeuft ueber den Git-Zugang, der auf
 * diesem Rechner ohnehin eingerichtet ist; das Geheimnis bleibt im Speicher und wird
 * weder ausgegeben noch irgendwo abgelegt.
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var os = require('os');
var cp = require('child_process');

var REPO = '/repos/Wilhelm-mbg/Stock-Dashboard/contents/spekulationen.json';
var ZWEIG = 'radar';
var QUELLE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'spekulationen.json');

// Zugang aus dem Git-Credential-Speicher - nur im Speicher, nie ausgegeben
function holeZugang() {
  var aus = cp.execSync('git credential fill', {
    cwd: path.join(__dirname, '..'),
    input: 'protocol=https\nhost=github.com\n\n',
    encoding: 'utf8'
  });
  var zeilen = aus.split('\n');
  var tok = null;
  for (var i = 0; i < zeilen.length; i++) {
    if (zeilen[i].indexOf('password=') === 0) tok = zeilen[i].slice(9).trim();
  }
  if (!tok) throw new Error('Kein Git-Zugang gefunden');
  return tok;
}

function api(tok, methode, pfad, koerper) {
  return new Promise(function (fertig, fehler) {
    var daten = koerper ? JSON.stringify(koerper) : null;
    var kopf = {
      'Authorization': 'token ' + tok,
      'User-Agent': 'Markt-Dashboard-Radar',
      'Accept': 'application/vnd.github+json'
    };
    if (daten) { kopf['Content-Type'] = 'application/json'; kopf['Content-Length'] = Buffer.byteLength(daten); }
    var req = https.request({ host: 'api.github.com', path: pfad, method: methode, headers: kopf, timeout: 20000 }, function (res) {
      var s = '';
      res.setEncoding('utf8');
      res.on('data', function (c) { s += c; });
      res.on('end', function () {
        var b = null;
        try { b = s ? JSON.parse(s) : null; } catch (e) { }
        fertig({ status: res.statusCode, body: b });
      });
    });
    req.on('timeout', function () { req.destroy(); fehler(new Error('Zeitueberschreitung')); });
    req.on('error', fehler);
    if (daten) req.write(daten);
    req.end();
  });
}

async function einmal(tok, inhalt) {
  // Aktuellen Stand holen: GitHub verlangt den sha der Datei, die ersetzt wird
  var ist = await api(tok, 'GET', REPO + '?ref=' + ZWEIG);
  if (ist.status !== 200 || !ist.body || !ist.body.sha) {
    throw new Error('Zweig "' + ZWEIG + '" nicht lesbar (HTTP ' + ist.status + ')');
  }
  if (ist.body.content && Buffer.from(ist.body.content, 'base64').toString('utf8') === inhalt) {
    return 'unveraendert';   // nichts Neues: kein leerer Commit
  }
  var stand = '';
  try { stand = JSON.parse(inhalt).stand || ''; } catch (e) { }
  var put = await api(tok, 'PUT', REPO, {
    message: 'radar: Stand ' + stand,
    content: Buffer.from(inhalt, 'utf8').toString('base64'),
    sha: ist.body.sha,
    branch: ZWEIG
  });
  if (put.status !== 200 && put.status !== 201) {
    throw new Error('Hochladen fehlgeschlagen (HTTP ' + put.status + (put.body && put.body.message ? ': ' + put.body.message : '') + ')');
  }
  return 'hochgeladen';
}

(async function () {
  if (!fs.existsSync(QUELLE)) { console.error('Keine spekulationen.json im Daten-Ordner - nichts hochzuladen.'); process.exit(1); }
  var inhalt = fs.readFileSync(QUELLE, 'utf8');
  if (Buffer.byteLength(inhalt) > 300000) { console.error('Datei groesser als 300 KB - die App wuerde sie ohnehin verwerfen.'); process.exit(1); }
  try { JSON.parse(inhalt); } catch (e) { console.error('Datei ist kein gueltiges JSON - nicht hochgeladen.'); process.exit(1); }

  var tok = holeZugang();
  try {
    console.log(await einmal(tok, inhalt));
  } catch (e) {
    // Ein Konflikt heisst: jemand anders war schneller. Einmal neu lesen und erneut versuchen.
    console.error('Erster Versuch fehlgeschlagen: ' + e.message + ' - noch einmal.');
    try { console.log(await einmal(tok, inhalt)); }
    catch (e2) { console.error('Auch der zweite Versuch schlug fehl: ' + e2.message); process.exit(1); }
  }
})();
