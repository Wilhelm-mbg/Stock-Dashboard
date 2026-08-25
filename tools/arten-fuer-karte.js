'use strict';
/* WERTPAPIERARTEN IN DEN APP-DATENORDNER REICHEN.
 *
 * Aufruf:  node tools/arten-fuer-karte.js
 *
 * WOZU. Die Marktkarte muss Vorzugsaktien und Indexfonds aussortieren - sonst bekommt
 * jede Vorzugsserie die Stammaktien-Anzahl ihres Unternehmens und wird zur groessten
 * Kachel (FNMFO, 25.08.2026). Die Klassifizierung dafuer liegt unter
 * Markt-Dashboard-Daten/massive/wertpapierarten.json.
 *
 * WARUM NICHT DIREKT VON DORT. Die Regel aus Version 7.17: kein Pfad zu
 * Schluessel-APIs IN der Anwendung. Eine Zusicherung haelt das hart - main.js und
 * index.html duerfen das Wort "massive" nicht einmal enthalten. Dass hier nur eine
 * fertige lokale Datei gelesen wuerde, aendert daran nichts: eine Sicherheitsregel
 * abzuschwaechen, damit ein Feature durchgeht, ist der falsche Weg herum.
 *
 * Also dieselbe Arbeitsteilung wie ueberall sonst: Werkzeuge greifen nach draussen,
 * die App liest nur ihren eigenen Datenordner. Dieses Werkzeug uebersetzt einmal.
 *
 * Es schreibt NUR Kuerzel -> Art, nichts weiter. Kein Schluessel, keine Kurse, keine
 * Verbindung - es kopiert eine Zuordnung von einem Ordner in den anderen.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

const DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
const QUELLE = path.join(DATEN, 'massive', 'wertpapierarten.json');
const ZIEL = path.join(DATEN, 'markt', 'wertpapierarten.json');

if (!fs.existsSync(QUELLE)) {
  console.error('Keine Klassifizierung unter ' + QUELLE);
  console.error('Sie entsteht mit tools/wertpapierarten-holen.js.');
  process.exit(1);
}

let arten;
try {
  const j = JSON.parse(fs.readFileSync(QUELLE, 'utf8'));
  arten = (j && j.arten) || j;
} catch (e) {
  console.error('Die Quelle ist unlesbar: ' + e.message);
  process.exit(1);
}
const n = Object.keys(arten || {}).length;
if (!n || n < 1000) {
  console.error('Die Quelle enthaelt nur ' + n + ' Eintraege - das sieht nach einem Abbruch aus.');
  process.exit(1);
}

fs.mkdirSync(path.dirname(ZIEL), { recursive: true });
fs.writeFileSync(ZIEL, JSON.stringify({
  stand: new Date().toISOString(),
  hinweis: 'Kuerzel -> Wertpapierart. Uebersetzt von tools/arten-fuer-karte.js. ' +
           'CS = Stammaktie, ADRC = Hinterlegungsschein, PFD = Vorzugsaktie, ETF/ETV/ETN = Fonds.',
  arten: arten
}, null, 0), 'utf8');

const zaehl = {};
Object.values(arten).forEach(function (a) { zaehl[a] = (zaehl[a] || 0) + 1; });
console.log('Abgelegt: ' + ZIEL);
console.log('  ' + n + ' Kuerzel');
console.log('  ' + Object.entries(zaehl).sort(function (a, b) { return b[1] - a[1]; })
  .slice(0, 8).map(function (p) { return p[0] + ' ' + p[1]; }).join(', '));
