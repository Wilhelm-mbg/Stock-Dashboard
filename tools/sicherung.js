'use strict';
/* SICHERUNG UND UMZUG (Felix, Issue #69).
 *
 *   node tools/sicherung.js --erstellen              Paket anlegen
 *   node tools/sicherung.js --einspielen <datei>     Paket zurueckspielen
 *   node tools/sicherung.js --ansehen <datei>        nur hineinschauen
 *
 * WAS HINEINKOMMT - und warum so wenig. Der Datenbestand ist rund 320 MB, aber davon
 * ist fast alles NACHLADBAR: die 799 Kursdateien im Store holt die App selbst wieder,
 * das 3,6-GB-Archiv auf E: sowieso. Unersetzlich sind wenige hundert Kilobyte:
 *
 *   depot.json          Buecher, Trades, Einstellungen, Spannen-Messung
 *   bestand.json        die eigenen Papiere
 *   drift_termine.json  Ergebnistermine (muehsam zusammengetragen)
 *   markt/*.json        Stammdaten und Wertpapierarten (zwanzig Minuten Abruf)
 *   diagnose.json       Installations-Kennung - sonst zaehlt die neue Maschine als neue
 *
 * Ein Paket, das 320 MB nachladbarer Kerzen mitschleppt, wird nicht benutzt. Eines mit
 * einem halben Megabyte schon.
 *
 * WAS AUSDRUECKLICH NICHT HINEINKOMMT: die Zugangsdaten. settings.json fuehrt capKey,
 * capId und capPass. Ein Sicherungspaket wandert per USB-Stick oder Mail auf einen
 * anderen Rechner - Zugangsdaten haben darin nichts verloren, auch nicht die eines
 * Demo-Kontos. Sie werden beim Einspielen NICHT ueberschrieben und muessen auf der
 * neuen Maschine einmal von Hand eingetragen werden. Drei Felder tippen ist zumutbar,
 * ein Schluessel in einer herumliegenden Zip-Datei nicht.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const STORE = path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
  'Markt-Dashboard', 'store');
const DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
const ZIEL_ORDNER = path.join(os.homedir(), 'Downloads');

/* Was mitkommt. Alles andere bleibt bewusst draussen. */
const AUS_STORE = ['depot.json', 'bestand.json', 'drift_termine.json', 'drift_markt.json',
  'diagnose.json', 'sentiment.json', 'spekGesehen.json', 'vormarktStand.json'];
const AUS_DATEN = ['markt', 'spekulationen.json', 'insider.json', 'archiv60m-pfad.txt'];
/* Zugangsdaten - stehen hier, damit sichtbar ist, dass sie bewusst fehlen. */
const NIEMALS = ['capKey', 'capId', 'capPass'];

function nurTag() { return new Date().toISOString().slice(0, 10); }

/* ---------------------------------------------------------------- erstellen */
function erstellen() {
  const tmp = path.join(os.tmpdir(), 'md-sicherung-' + Date.now());
  fs.mkdirSync(path.join(tmp, 'store'), { recursive: true });
  fs.mkdirSync(path.join(tmp, 'daten'), { recursive: true });

  const drin = [], fehlt = [];
  AUS_STORE.forEach(function (f) {
    const q = path.join(STORE, f);
    if (!fs.existsSync(q)) { fehlt.push('store/' + f); return; }
    fs.copyFileSync(q, path.join(tmp, 'store', f));
    drin.push('store/' + f + '  (' + Math.round(fs.statSync(q).size / 1024) + ' KB)');
  });

  /* settings.json OHNE die Zugangsdaten - der einzige Eintrag, der unterwegs
   * veraendert wird, und der Grund steht im Paket. */
  const sp = path.join(STORE, 'settings.json');
  if (fs.existsSync(sp)) {
    let s = {};
    try { s = JSON.parse(fs.readFileSync(sp, 'utf8')); } catch (e) { s = {}; }
    const raus = [];
    NIEMALS.forEach(function (k) { if (s[k]) { delete s[k]; raus.push(k); } });
    fs.writeFileSync(path.join(tmp, 'store', 'settings.json'), JSON.stringify(s, null, 1));
    drin.push('store/settings.json  (ohne ' + (raus.join(', ') || 'Zugangsdaten') + ')');
  }

  AUS_DATEN.forEach(function (f) {
    const q = path.join(DATEN, f);
    if (!fs.existsSync(q)) { fehlt.push('daten/' + f); return; }
    kopiereRekursiv(q, path.join(tmp, 'daten', f));
    drin.push('daten/' + f);
  });

  const zettel = [
    'SICHERUNG MARKT-DASHBOARD', 'Erstellt: ' + new Date().toISOString(), '',
    'DRIN:', ...drin.map(function (x) { return '  ' + x; }), '',
    'NICHT DRIN, und warum:',
    '  Zugangsdaten (capKey, capId, capPass) - ein Paket wandert auf andere Rechner.',
    '    Auf der neuen Maschine einmal unter Werkzeuge > Einstellungen eintragen.',
    '  Kursdateien (bars_*.json, rund 300 MB) - die App laedt sie selbst nach.',
    '  Das 60m-Archiv auf E: (3,6 GB) - getrennt sichern, wenn gewuenscht.',
    '  Messprotokolle und Studien - die liegen im Git-Repo.',
    ...(fehlt.length ? ['', 'Nicht gefunden (kein Fehler, gab es hier nicht):',
      ...fehlt.map(function (x) { return '  ' + x; })] : []),
    '',
    'ZURUECKSPIELEN:  node tools/sicherung.js --einspielen <diese-datei>'
  ].join('\n');
  fs.writeFileSync(path.join(tmp, 'LIESMICH.txt'), zettel, 'utf8');

  const ziel = path.join(ZIEL_ORDNER, 'markt-dashboard-sicherung-' + nurTag() + '.zip');
  if (fs.existsSync(ziel)) fs.unlinkSync(ziel);
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    'Compress-Archive -Path "' + path.join(tmp, '*') + '" -DestinationPath "' + ziel + '" -CompressionLevel Optimal'],
    { stdio: 'inherit' });
  fs.rmSync(tmp, { recursive: true, force: true });

  console.log('\n' + zettel);
  console.log('\nPaket: ' + ziel + '  (' + Math.round(fs.statSync(ziel).size / 1024) + ' KB)');
}

function kopiereRekursiv(von, nach) {
  const s = fs.statSync(von);
  if (!s.isDirectory()) { fs.copyFileSync(von, nach); return; }
  fs.mkdirSync(nach, { recursive: true });
  fs.readdirSync(von).forEach(function (f) { kopiereRekursiv(path.join(von, f), path.join(nach, f)); });
}

/* --------------------------------------------------------------- einspielen */
function auspacken(datei) {
  if (!fs.existsSync(datei)) { console.error('Keine Datei: ' + datei); process.exit(1); }
  const tmp = path.join(os.tmpdir(), 'md-einspielen-' + Date.now());
  fs.mkdirSync(tmp, { recursive: true });
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    'Expand-Archive -Path "' + datei + '" -DestinationPath "' + tmp + '" -Force'], { stdio: 'inherit' });
  return tmp;
}

function ansehen(datei) {
  const tmp = auspacken(datei);
  const z = path.join(tmp, 'LIESMICH.txt');
  console.log(fs.existsSync(z) ? fs.readFileSync(z, 'utf8') : '(kein Zettel im Paket)');
  fs.rmSync(tmp, { recursive: true, force: true });
}

function einspielen(datei) {
  const tmp = auspacken(datei);
  /* Was schon dasteht, wird zur Seite gelegt statt ueberschrieben. Ein Einspielen,
   * das den bisherigen Stand vernichtet, ist keine Sicherung, sondern ein Risiko. */
  const sicher = path.join(STORE, 'vor-einspielen-' + Date.now());
  let gerettet = 0, geschrieben = 0;
  fs.mkdirSync(sicher, { recursive: true });

  const qs = path.join(tmp, 'store');
  if (fs.existsSync(qs)) {
    fs.readdirSync(qs).forEach(function (f) {
      const alt = path.join(STORE, f);
      if (f === 'settings.json' && fs.existsSync(alt)) {
        /* Die vorhandenen Zugangsdaten bleiben - im Paket sind ohnehin keine. */
        let a = {}, n = {};
        try { a = JSON.parse(fs.readFileSync(alt, 'utf8')); } catch (e) { }
        try { n = JSON.parse(fs.readFileSync(path.join(qs, f), 'utf8')); } catch (e) { }
        NIEMALS.forEach(function (k) { if (a[k]) n[k] = a[k]; });
        fs.copyFileSync(alt, path.join(sicher, f)); gerettet++;
        fs.writeFileSync(alt, JSON.stringify(n, null, 1)); geschrieben++;
        return;
      }
      if (fs.existsSync(alt)) { fs.copyFileSync(alt, path.join(sicher, f)); gerettet++; }
      fs.copyFileSync(path.join(qs, f), alt); geschrieben++;
    });
  }
  const qd = path.join(tmp, 'daten');
  if (fs.existsSync(qd)) {
    fs.mkdirSync(DATEN, { recursive: true });
    fs.readdirSync(qd).forEach(function (f) {
      kopiereRekursiv(path.join(qd, f), path.join(DATEN, f)); geschrieben++;
    });
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log('Eingespielt: ' + geschrieben + ' Eintraege.');
  console.log('Der bisherige Stand liegt unter: ' + sicher + '  (' + gerettet + ' Dateien)');
  console.log('Die Zugangsdaten wurden NICHT angetastet - im Paket sind keine.');
  console.log('Auf einer neuen Maschine einmal unter Werkzeuge > Einstellungen eintragen.');
}

/* --------------------------------------------------------------------- Lauf */
const arg = process.argv.slice(2);
if (arg.indexOf('--erstellen') !== -1) erstellen();
else if (arg.indexOf('--einspielen') !== -1) einspielen(arg[arg.indexOf('--einspielen') + 1]);
else if (arg.indexOf('--ansehen') !== -1) ansehen(arg[arg.indexOf('--ansehen') + 1]);
else {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0]
    .replace(/^'use strict';\n\/\* /, '').replace(/^ \* ?/gm, ''));
}
