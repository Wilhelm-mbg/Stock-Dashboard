'use strict';
/* AUSLIEFERN, VON HAND ODER VON DER WACHE
 *
 *   node tools/release.js --pruefen           Was ist unveroeffentlicht? Nur berichten.
 *   node tools/release.js --bauen [--minor]   Version setzen, sauber bauen, testen.
 *   node tools/release.js --hoch              Entwurf, Assets, veroeffentlichen, gegenpruefen.
 *   node tools/release.js --alles [--minor]   Die drei Schritte nacheinander.
 *
 * WARUM ES DIESES SKRIPT GIBT: Jeder Release lief bisher als Handarbeit, und jedes Mal
 * ist dieselbe Falle zugeschnappt - mal fehlte die node_modules-Junction, mal wurde aus
 * dem falschen Verzeichnis hochgeladen, mal hatte eine parallele Sitzung dieselbe Nummer
 * vergeben. Alles Mechanische steht deshalb hier, nicht in einem Kopf.
 *
 * WAS ES SICH WEIGERT ZU TUN:
 *   - bauen, wenn der Arbeitsbaum schmutzig ist (fremde unfertige Arbeit im Paket)
 *   - bauen, wenn die Tests rot sind
 *   - eine Nummer vergeben, die es als Tag schon gibt
 *   - telemetrie.json committen
 *   - veroeffentlichen, ohne danach zu pruefen, was wirklich oben liegt
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');
const { execFileSync, execSync } = require('child_process');

const REPO = path.resolve(__dirname, '..');
const BAUBAUM = path.join(os.homedir(), 'Downloads', 'build-clean');
const NOTIZEN = path.join(REPO, 'release-notizen');

function sh(cmd, opt) {
  return execSync(cmd, Object.assign({ cwd: REPO, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }, opt || {})).trim();
}
function laut(cmd, opt) {
  execSync(cmd, Object.assign({ cwd: REPO, stdio: 'inherit' }, opt || {}));
}
function schluss(txt) { console.error('\nABBRUCH: ' + txt); process.exit(1); }
function titel(t) { console.log('\n=== ' + t + ' ==='); }

/* ---------------------------------------------------------------- pruefen */
function version() { return JSON.parse(fs.readFileSync(path.join(REPO, 'package.json'), 'utf8')).version; }
function letzterTag() {
  try { return sh('git describe --tags --abbrev=0'); } catch (e) { return null; }
}
function unveroeffentlicht() {
  const t = letzterTag();
  const bereich = t ? t + '..HEAD' : 'HEAD';
  const zeilen = sh('git log --oneline ' + bereich).split('\n').filter(Boolean);
  return { tag: t, commits: zeilen };
}
function notizen() {
  if (!fs.existsSync(NOTIZEN)) return [];
  /* LIESMICH.md beschreibt die Ablage selbst und bleibt liegen - sie ist keine Notiz
   * und darf am Ende auch nicht mitgeloescht werden. */
  return fs.readdirSync(NOTIZEN)
    .filter(function (f) { return /\.md$/i.test(f) && f.toUpperCase() !== 'LIESMICH.MD'; }).sort()
    .map(function (f) { return { datei: f, text: fs.readFileSync(path.join(NOTIZEN, f), 'utf8').trim() }; });
}

function pruefen() {
  titel('Stand');
  const u = unveroeffentlicht();
  console.log('  HEAD          ' + sh('git rev-parse --short HEAD'));
  console.log('  package.json  ' + version());
  console.log('  letzter Tag   ' + (u.tag || '(keiner)'));
  console.log('  Arbeitsbaum   ' + (sh('git status --short') ? 'SCHMUTZIG' : 'sauber'));
  titel('Nicht ausgeliefert (' + u.commits.length + ')');
  u.commits.forEach(function (z) { console.log('  ' + z); });
  const n = notizen();
  titel('Gesammelte Notizen (' + n.length + ')');
  n.forEach(function (x) { console.log('  ' + x.datei + '  (' + x.text.split('\n').length + ' Zeilen)'); });
  if (!u.commits.length) console.log('\n  Es gibt nichts auszuliefern.');
  return u;
}

/* ------------------------------------------------------------------ bauen */
function naechsteVersion(minor) {
  const teile = version().split('.').map(Number);
  if (minor) { teile[1]++; teile[2] = 0; } else { teile[2]++; }
  return teile.join('.');
}

function bauen(minor) {
  const u = unveroeffentlicht();
  if (!u.commits.length) schluss('Seit ' + u.tag + ' gibt es keinen Commit. Nichts auszuliefern.');
  if (sh('git status --short')) {
    schluss('Der Arbeitsbaum ist schmutzig. Aus einem schmutzigen Baum wird nicht gebaut - ' +
            'sonst landet fremde unfertige Arbeit im Paket. Erst committen oder wegraeumen.');
  }

  const neu = naechsteVersion(minor);
  const tags = sh('git tag').split('\n');
  if (tags.indexOf('v' + neu) !== -1) {
    schluss('Den Tag v' + neu + ' gibt es schon. Wahrscheinlich war eine parallele Sitzung schneller - ' +
            'erst "git fetch --tags" und den Stand ansehen.');
  }

  titel('Tests vor dem Bauen');
  try { laut('node test-v6.js'); }
  catch (e) { schluss('Die Tests sind rot. Ein rotes Paket wird nicht ausgeliefert.'); }

  titel('Version ' + version() + ' -> ' + neu);
  const pj = path.join(REPO, 'package.json');
  const j = JSON.parse(fs.readFileSync(pj, 'utf8'));
  j.version = neu;
  fs.writeFileSync(pj, JSON.stringify(j, null, 2) + '\n', 'utf8');
  /* Sicherung: telemetrie.json darf nie mitkommen. */
  laut('git add package.json');
  const vorgemerkt = sh('git diff --cached --name-only').split('\n').filter(Boolean);
  if (vorgemerkt.some(function (f) { return /telemetrie/i.test(f); })) {
    schluss('telemetrie.json ist vorgemerkt. Das wird nicht committet.');
  }
  if (vorgemerkt.length !== 1 || vorgemerkt[0] !== 'package.json') {
    schluss('Vorgemerkt ist mehr als package.json: ' + vorgemerkt.join(', '));
  }
  laut('git commit -q -m "Version ' + neu + '"');

  titel('Sauberer Baum');
  try { laut('git worktree prune'); } catch (e) { /* egal */ }
  if (fs.existsSync(BAUBAUM)) fs.rmSync(BAUBAUM, { recursive: true, force: true });
  laut('git worktree add --detach "' + BAUBAUM + '" HEAD');

  /* Die Junction laesst sich NICHT aus einer Bash-Zeile heraus anlegen - dort schlaegt
   * sie still fehl und der Build laeuft trotzdem los. Deshalb PowerShell direkt, und
   * danach nachzaehlen statt hoffen. */
  titel('node_modules verlinken');
  const ziel = path.join(BAUBAUM, 'node_modules');
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    'New-Item -ItemType Junction -Path "' + ziel + '" -Target "' + path.join(REPO, 'node_modules') + '" | Out-Null'],
    { stdio: 'inherit' });
  if (!fs.existsSync(path.join(ziel, 'electron', 'package.json')) ||
      !fs.existsSync(path.join(ziel, 'electron-builder', 'package.json'))) {
    schluss('Die Junction steht nicht. Ohne node_modules meldet electron-builder ' +
            '"Electron version is a range, not a fixed version" - das heisst NICHT, dass ' +
            'package.json falsch ist.');
  }
  console.log('  ok: ' + fs.readdirSync(ziel).length + ' Eintraege sichtbar');

  /* Nicht committet, aber im Paket noetig. */
  const tel = path.join(REPO, 'telemetrie.json');
  if (fs.existsSync(tel)) { fs.copyFileSync(tel, path.join(BAUBAUM, 'telemetrie.json')); console.log('  telemetrie.json kopiert'); }
  else console.log('  WARNUNG: telemetrie.json fehlt im Quellbaum - das Paket bekommt keinen Sendeschluessel');

  titel('Tests im sauberen Baum');
  laut('node test-v6.js', { cwd: BAUBAUM });

  titel('Bauen');
  laut('npx electron-builder --win --publish never', { cwd: BAUBAUM });

  const dist = path.join(BAUBAUM, 'dist');
  const setup = path.join(dist, 'Markt-Dashboard-Setup.exe');
  const yml = path.join(dist, 'latest.yml');
  if (!fs.existsSync(setup) || !fs.existsSync(yml)) schluss('Im dist fehlt Setup.exe oder latest.yml.');
  console.log('\n  fertig: ' + setup + '  (' + Math.round(fs.statSync(setup).size / 1048576) + ' MB)');
  console.log('  Version ' + neu + ' gebaut. Weiter mit --hoch');
  return neu;
}

/* ------------------------------------------------------------------- hoch */
function sha512(datei) {
  return crypto.createHash('sha512').update(fs.readFileSync(datei)).digest('base64');
}

function hoch() {
  const v = version();
  const tag = 'v' + v;
  const dist = process.env.DIST || path.join(BAUBAUM, 'dist');
  const setup = path.join(dist, 'Markt-Dashboard-Setup.exe');
  const yml = path.join(dist, 'latest.yml');
  if (!fs.existsSync(setup)) schluss('Kein Paket unter ' + dist + '. Erst --bauen.');

  /* Die Pruefsumme in latest.yml muss zu der Datei passen, die daneben liegt -
   * sonst laedt der Updater und verwirft dann. */
  titel('Gegenprobe vor dem Hochladen');
  const ymlText = fs.readFileSync(yml, 'utf8');
  const mSha = /sha512:\s*(\S+)/.exec(ymlText);
  const mVer = /version:\s*(\S+)/.exec(ymlText);
  if (!mSha || !mVer) schluss('latest.yml ist unlesbar.');
  if (mVer[1] !== v) schluss('latest.yml nennt ' + mVer[1] + ', package.json ' + v + '.');
  const echt = sha512(setup);
  if (mSha[1] !== echt) schluss('Die Pruefsumme in latest.yml passt nicht zum Paket daneben.');
  console.log('  ok: Version ' + v + ', Pruefsumme stimmt');

  titel('Notizen einsammeln');
  const n = notizen();
  const koerper = (n.length
    ? n.map(function (x) { return x.text; }).join('\n\n')
    : 'Sammelrelease. Einzelheiten in den Commits:\n\n' +
      unveroeffentlicht().commits.map(function (z) { return '- ' + z; }).join('\n')) +
    '\n\n---\n*Simulation mit virtuellem Kapital. Keine Anlageberatung.*';
  const tmp = path.join(os.tmpdir(), 'release-' + v + '.md');
  fs.writeFileSync(tmp, koerper, 'utf8');
  console.log('  ' + n.length + ' Notiz(en), ' + koerper.length + ' Zeichen');

  titel('Tag und Entwurf');
  laut('git tag -a ' + tag + ' -m "Markt-Dashboard ' + v + '"');
  laut('git push -q origin HEAD');
  laut('git push -q origin ' + tag);
  laut('gh release create ' + tag + ' --draft --title "Markt-Dashboard ' + v + '" --notes-file "' + tmp + '"');

  titel('Assets hochladen');
  laut('gh release upload ' + tag + ' "' + yml + '" "' + setup + '"');

  titel('Veroeffentlichen');
  laut('gh release edit ' + tag + ' --draft=false --latest');

  /* Ein veroeffentlichtes Release ist nicht endgueltig: eine parallele Sitzung kann
   * die Assets desselben Tags ersetzen. Deshalb nachsehen, was WIRKLICH oben liegt. */
  titel('Gegenprobe nach dem Veroeffentlichen');
  const oben = JSON.parse(sh('gh release view ' + tag + ' --json assets,isDraft'));
  if (oben.isDraft) schluss('Das Release steht noch als Entwurf.');
  oben.assets.forEach(function (a) { console.log('  ' + a.name + '  ' + a.size + ' Bytes  ' + a.updatedAt); });
  const fern = path.join(os.tmpdir(), 'latest-fern.yml');
  laut('gh release download ' + tag + ' -p latest.yml -O "' + fern + '" --clobber');
  const fernSha = /sha512:\s*(\S+)/.exec(fs.readFileSync(fern, 'utf8'));
  if (!fernSha || fernSha[1] !== echt) {
    schluss('Die veroeffentlichte latest.yml nennt eine ANDERE Pruefsumme als mein Paket. ' +
            'Wahrscheinlich hat eine parallele Sitzung denselben Tag ueberschrieben.');
  }
  console.log('  ok: oben liegt mein Paket');

  titel('Notizen wegraeumen');
  n.forEach(function (x) { fs.unlinkSync(path.join(NOTIZEN, x.datei)); console.log('  ' + x.datei + ' verbraucht'); });
  if (n.length) {
    laut('git add -A release-notizen');
    laut('git commit -q -m "Release-Notizen fuer ' + v + ' verbraucht"');
    laut('git push -q origin HEAD');
  }
  console.log('\n  ' + tag + ' ist draussen.');
}

/* ------------------------------------------------------------------- Lauf */
const arg = process.argv.slice(2);
const minor = arg.indexOf('--minor') !== -1;
if (arg.indexOf('--pruefen') !== -1) { pruefen(); }
else if (arg.indexOf('--bauen') !== -1) { bauen(minor); }
else if (arg.indexOf('--hoch') !== -1) { hoch(); }
else if (arg.indexOf('--alles') !== -1) { pruefen(); bauen(minor); hoch(); }
else {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^'use strict';\n\/\* /, '').replace(/^ \* ?/gm, ''));
}
