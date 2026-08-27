'use strict';
/* AUSLIEFERN, VON HAND ODER VON DER WACHE
 *
 * AUSLIEFERN IST SACHE DER RELEASE-WACHE. Eine Sitzung committet und legt ihre Notiz
 * in release-notizen/ ab - mehr nicht. --bauen und --hoch verlangen deshalb ein
 * ausdrueckliches --wache. Wilhelm, 25.08.2026: "du vergibst keine versionen das
 * macht die release wache". Von Hand geht es mit --von-hand, wenn er es so will.
 *
 *   node tools/release.js --pruefen           Was ist unveroeffentlicht? Nur berichten.
 *   node tools/release.js --bauen [--minor]   Version setzen, sauber bauen, testen.
 *   node tools/release.js --hoch              Entwurf, Assets, veroeffentlichen, gegenpruefen.
 *   node tools/release.js --alles [--minor]   Die drei Schritte nacheinander.
 *   node tools/release.js --aufraeumen        Baubaum sicher wegraeumen.
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
/** Wie steht HEAD zu origin/main? Ohne diesen Blick setzt --hoch einen Tag und
 *  scheitert dann am Push - der Tag bleibt liegen und verklemmt den naechsten Lauf.
 *  Am 25.08.2026 genau so passiert: 7 Commits Rueckstand, roher Node-Auswurf. */
function standGegenOrigin() {
  try { execSync('git fetch -q origin', { cwd: REPO, stdio: 'ignore' }); } catch (e) { return null; }
  try {
    var voraus = Number(sh('git rev-list --count origin/main..HEAD'));
    var zurueck = Number(sh('git rev-list --count HEAD..origin/main'));
    return { voraus: voraus, zurueck: zurueck };
  } catch (e) { return null; }
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

/* Was landet ueberhaupt im Paket? Genau diese Dateien sind es wert, einen Release
 * anzuhalten - bei allen anderen ist "geaendert" ohne Folge fuer das Ergebnis.
 * Die Liste spiegelt build.files aus package.json. */
function gehoertInsPaket(datei) {
  if (datei === 'index.html' || datei === 'telemetrie.json') return true;
  if (/^icon\.(png|ico)$/.test(datei)) return true;
  if (datei === 'studien/messmaschine/messmaschine.js') return true;
  if (datei === 'studien/messmaschine/messen.js') return true;
  /* Einzeln, NICHT der ganze strategien/-Ordner: messmaschine.js laedt genau diese
   * eine Datei hart ueber __dirname (Integritaetsschranke), die uebrigen Strategien
   * kommen im App-Pfad aus dem Datenordner. Die Zeile folgt build.files - ohne sie
   * fiele die Datei still aus der Release-Pruefung. */
  if (datei === 'studien/messmaschine/strategien/wertpapierart.js') return true;
  /* Nur JS-Dateien im Wurzelverzeichnis, ohne die Tests. */
  return /^[^/]+\.js$/.test(datei) && !/^test-/.test(datei) && datei !== 'eslint.config.mjs';
}

/* Trennt den Baum in "das haelt einen Release an" und "das ist nur Beiwerk". */
function baumZustand() {
  /* NICHT ueber sh(): dessen trim() frisst das fuehrende Leerzeichen der ERSTEN
   * Zeile, und damit verliert der erste Dateiname einen Buchstaben. */
  const roh = execSync('git status --porcelain', { cwd: REPO, encoding: 'utf8' });
  const zeilen = roh.split('\n').filter(Boolean);
  const teile = { blockend: [], beiwerk: [] };
  zeilen.forEach(function (z) {
    const kennung = z.slice(0, 2);
    const datei = z.slice(3).replace(/^"|"$/g, '');
    /* Unversioniert (??) kann nicht fehlen - es war nie Teil von irgendetwas. */
    const nachverfolgt = kennung !== '??';
    (nachverfolgt && gehoertInsPaket(datei) ? teile.blockend : teile.beiwerk).push(kennung + ' ' + datei);
  });
  return teile;
}

function pruefen() {
  titel('Stand');
  const u = unveroeffentlicht();
  console.log('  HEAD          ' + sh('git rev-parse --short HEAD'));
  console.log('  package.json  ' + version());
  console.log('  letzter Tag   ' + (u.tag || '(keiner)'));
  const z = baumZustand();
  var so = standGegenOrigin();
  console.log('  gegen origin  ' + (so ? so.voraus + ' voraus, ' + so.zurueck + ' zurueck' +
    (so.zurueck && so.voraus ? '   AUSEINANDERGELAUFEN' : so.zurueck ? '   erst nachziehen' : '') : 'nicht erreichbar'));
  console.log('  Arbeitsbaum   ' + (z.blockend.length
    ? 'HAELT AN - ' + z.blockend.length + ' geaenderte Datei(en) aus dem Paket'
    : (z.beiwerk.length ? 'offen, aber ohne Folge (' + z.beiwerk.length + ')' : 'sauber')));
  z.blockend.forEach(function (x) { console.log('     ! ' + x); });
  z.beiwerk.forEach(function (x) { console.log('       ' + x + '   (nicht im Paket)'); });
  titel('Nicht ausgeliefert (' + u.commits.length + ')');
  u.commits.forEach(function (z) { console.log('  ' + z); });
  const n = notizen();
  titel('Gesammelte Notizen (' + n.length + ')');
  n.forEach(function (x) { console.log('  ' + x.datei + '  (' + x.text.split('\n').length + ' Zeilen)'); });
  if (!u.commits.length) console.log('\n  Es gibt nichts auszuliefern.');
  return u;
}

/* ------------------------------------------------- die zwei Riegel (27.08.) */
/* Anlass, konkret: Am 27.08. um 07:57 lief der Bau auf b5c0243; um 07:59 kam
 * a5b66e0 nach origin - der Push der Wache wurde abgelehnt, und dass sie es
 * MERKTE, war Handarbeit (Log gelesen, Uhrzeiten verglichen) und Glueck. Die
 * Funkstille ist eine VERABREDUNG - sie wirkt nur, solange alle vor dem Push
 * nachsehen. Diese zwei Riegel decken verschiedene Loecher, keiner ersetzt
 * den anderen. */

/** RIEGEL 2 (der wichtigere): --hoch verlangt HEAD == Bau-Stand.
 *  Eine Pruefung, die nicht von Kooperation abhaengt, schlaegt eine
 *  Verabredung, die vier Sitzungen einhalten muessen: Sie faengt den
 *  Parallel-Push AUCH ohne Funkstille - und zusaetzlich den Fall, den keine
 *  Sperrdatei sieht: ein Commit nach dem Bau und vor dem --hoch, ganz ohne
 *  Push. bauen() verzeichnet den Stand in dist/bau-stand.json; ein dist ohne
 *  diese Datei ist ein Alt- oder Fremdbau und wird nicht hochgeladen. */
function bauStandSchreiben(dist, ver) {
  fs.writeFileSync(path.join(dist, 'bau-stand.json'), JSON.stringify({
    sha: sh('git rev-parse HEAD'), version: ver, gebaut: new Date().toISOString()
  }, null, 2) + '\n', 'utf8');
}
function bauStandPruefen(dist) {
  const datei = path.join(dist, 'bau-stand.json');
  if (!fs.existsSync(datei)) {
    schluss('Im dist fehlt bau-stand.json - dieses Paket wurde vor Riegel 2 oder ' +
            'von fremder Hand gebaut. Der Stand, aus dem es entstand, ist nicht ' +
            'belegbar: neu bauen.');
  }
  const bau = JSON.parse(fs.readFileSync(datei, 'utf8'));
  const kopf = sh('git rev-parse HEAD');
  if (bau.sha !== kopf) {
    schluss('HEAD (' + kopf.slice(0, 7) + ') ist nicht der Stand, aus dem gebaut wurde (' +
            bau.sha.slice(0, 7) + ', ' + bau.gebaut + ').\n' +
            'Zwischen Bau und Hochladen ist etwas dazugekommen - das Paket enthaelt es ' +
            'nicht, der Tag wuerde aber dahinter zeigen: neu bauen.');
  }
  console.log('  ok: HEAD == Bau-Stand (' + kopf.slice(0, 7) + ')');
}

/** RIEGEL 1 (die Bequemlichkeit obendrauf): release-baut.json im Repo, solange
 *  ein Lauf laeuft - Sitzungen KOENNEN vor dem Push nachsehen. Im finally
 *  geloest, nicht am Ende: gerade der Bau, der mittendrin stirbt, ist der,
 *  dessen Sperre sonst liegen bleibt. Mit Verwaisungs-Pruefung ueber die PID,
 *  sonst sperrt ein toter Bau alle aus (der Archiv-Fall derselben Nacht). */
const BAUT = path.join(REPO, 'release-baut.json');
function lebtPid(pid) { try { process.kill(pid, 0); return true; } catch (e) { return false; } }
function sperreSetzen(phase, ziel) {
  if (fs.existsSync(BAUT)) {
    let alt = null; try { alt = JSON.parse(fs.readFileSync(BAUT, 'utf8')); } catch (e) { alt = null; }
    if (alt && alt.pid && lebtPid(alt.pid)) {
      schluss('Es laeuft schon ein Release-Lauf (' + alt.phase + ' fuer ' + alt.ziel +
              ', PID ' + alt.pid + ', seit ' + alt.start + '). Nicht parallel ausliefern.');
    }
    console.log('  Hinweis: verwaiste release-baut.json (PID tot) wird uebernommen.');
  }
  fs.writeFileSync(BAUT, JSON.stringify({
    phase: phase, ziel: ziel, pid: process.pid, start: new Date().toISOString()
  }, null, 2) + '\n', 'utf8');
}
function sperreLoesen() { try { fs.unlinkSync(BAUT); } catch (e) { } }

/* ------------------------------------------------------------------ bauen */

/** Den Baubaum wegräumen, OHNE das echte node_modules mitzunehmen.
 *
 * Am 24.08.2026 hat ein "git worktree remove --force" auf genau diesen Baum alle 276
 * Pakete des echten node_modules gelöscht. Danach scheiterte jeder Build, und die
 * Ursache lag Stunden zurück.
 *
 * NACHGEMESSEN, weil die naheliegende Erklärung falsch ist: "rekursives Löschen geht
 * durch Junctions" stimmt NICHT. An einer Attrappe geprüft, ließen sowohl fs.rmSync
 * als auch "rmdir /s /q" das Ziel unberührt. Nur git räumt mit eigenem Code auf und
 * steigt dabei in den Verweis hinab. Der Schuldige ist also nicht das Löschen an sich,
 * sondern genau dieser eine Befehl — wer das verwechselt, sucht beim nächsten Mal an
 * der falschen Stelle.
 *
 * Deshalb: erst den Verweis lösen (rmdir entfernt die Junction, nicht ihr Ziel),
 * dann erst git heranlassen. */
function baubaumWeg() {
  const nm = path.join(BAUBAUM, 'node_modules');
  if (fs.existsSync(nm)) {
    try {
      fs.rmdirSync(nm);          // loest die Junction, ruehrt das Ziel nicht an
      console.log('  Junction geloest (das echte node_modules bleibt unberuehrt)');
    } catch (e) {
      schluss('Die Junction unter ' + nm + ' liess sich nicht loesen: ' + e.message +
              '\nDer Baum wird NICHT geloescht - ein rekursives Loeschen wuerde durch die ' +
              'Junction hindurchgehen und das echte node_modules leeren.');
    }
  }
  try { execSync('git worktree remove --force "' + BAUBAUM + '"', { cwd: REPO, stdio: 'ignore' }); } catch (e) { /* war keiner */ }
  if (fs.existsSync(BAUBAUM)) fs.rmSync(BAUBAUM, { recursive: true, force: true });
  try { execSync('git worktree prune', { cwd: REPO, stdio: 'ignore' }); } catch (e) { /* egal */ }
}

function naechsteVersion(minor) {
  /* Steht in package.json eine Nummer, zu der es KEINEN Tag gibt, dann hat ein
   * frueherer Lauf sie schon vergeben und ist danach steckengeblieben (bei 8.28.1
   * am 24.08.2026 an der Junction). Weiterzuzaehlen wuerde sie fuer immer verwaist
   * zuruecklassen - also wird sie wiederverwendet. */
  const jetzt = version();
  const tags = sh('git tag').split('\n');
  if (tags.indexOf('v' + jetzt) === -1) {
    console.log('  Hinweis: ' + jetzt + ' steht in package.json, hat aber keinen Tag -');
    console.log('  ein frueherer Lauf ist steckengeblieben. Diese Nummer wird wiederverwendet.');
    return jetzt;
  }
  const teile = jetzt.split('.').map(Number);
  if (minor) { teile[1]++; teile[2] = 0; } else { teile[2]++; }
  return teile.join('.');
}

function bauen(minor) {
  sperreSetzen('bauen', naechsteVersion(minor));
  try { return bauenKern(minor); } finally { sperreLoesen(); }
}
function bauenKern(minor) {
  const u = unveroeffentlicht();
  if (!u.commits.length) schluss('Seit ' + u.tag + ' gibt es keinen Commit. Nichts auszuliefern.');
  /* NICHT geprueft wird "irgendetwas liegt offen herum". Gebaut wird in einem eigenen
   * Worktree auf HEAD - Uncommittetes kommt dort gar nicht an, ins Paket also erst
   * recht nicht. Der erste Lauf der Wache brach an einem Messprotokoll ab, das in
   * keiner build.files-Liste steht; die Regel war aus der Handarbeits-Zeit uebrig.
   *
   * Geprueft wird die umgekehrte Gefahr: Liegt FERTIGE Arbeit an einer Datei aus dem
   * Paket im Baum und ist noch nicht committet, baut das Skript ohne sie. Das Release
   * erscheint, die Arbeit fehlt still, und derjenige glaubt, sie sei drin. */
  const zustand = baumZustand();
  if (zustand.blockend.length) {
    schluss('Diese Datei(en) gehoeren ins Paket und sind nicht committet:\n  ' +
            zustand.blockend.join('\n  ') +
            '\nGebaut wird aus HEAD - sie waeren im Release NICHT enthalten, ohne dass es ' +
            'jemand merkt. Erst committen (oder verwerfen), dann ausliefern.');
  }
  if (zustand.beiwerk.length) {
    console.log('\n  Hinweis: ' + zustand.beiwerk.length + ' Datei(en) liegen offen im Baum, keine davon');
    console.log('  gehoert ins Paket - das haelt den Release nicht an:');
    zustand.beiwerk.forEach(function (x) { console.log('    ' + x); });
  }

  /* Rueckstand VOR dem Taggen abfangen. Ein Tag auf einem Stand, der nicht gepusht
   * werden kann, ist schlimmer als kein Tag. */
  const stand = standGegenOrigin();
  if (stand && stand.zurueck > 0) {
    schluss('HEAD liegt ' + stand.zurueck + ' Commit(s) hinter origin/main' +
            (stand.voraus ? ' und ' + stand.voraus + ' davor (auseinandergelaufen)' : '') +
            '.\nErst "git merge origin/main" (oder pull), dann ausliefern - sonst scheitert der ' +
            'Push nach dem Taggen und der Tag bleibt ohne Release liegen.');
  }

  const neu = naechsteVersion(minor);
  const tags = sh('git tag').split('\n');
  if (tags.indexOf('v' + neu) !== -1) {
    schluss('Den Tag v' + neu + ' gibt es schon. Wahrscheinlich war eine parallele Sitzung schneller - ' +
            'erst "git fetch --tags" und den Stand ansehen.');
  }

  titel('Tests vor dem Bauen');
  /* Die VOLLE Reihe aus package.json, nicht nur test-v6. Am 25.08.2026 hat der
   * Linter einen Fehler gefunden, den test-v6 nicht sehen konnte: eine doppelt
   * deklarierte Funktion. In JavaScript gewinnt die spaetere - fuer alle
   * Aufrufstellen. Ein Test, der die Funktion aus der Datei schneidet und einzeln
   * prueft, findet Verschattung grundsaetzlich nicht; der Linter schon. */
  try { laut('npm test'); }
  catch (e) { schluss('Die Testreihe ist rot (eslint, test-channel oder test-v6). ' +
                      'Ein rotes Paket wird nicht ausgeliefert.'); }

  const schonGesetzt = version() === neu;
  titel(schonGesetzt ? 'Version bleibt ' + neu + ' (aus dem steckengebliebenen Lauf)'
                     : 'Version ' + version() + ' -> ' + neu);
  const pj = path.join(REPO, 'package.json');
  const j = JSON.parse(fs.readFileSync(pj, 'utf8'));
  j.version = neu;
  fs.writeFileSync(pj, JSON.stringify(j, null, 2) + '\n', 'utf8');
  /* Sicherung: telemetrie.json darf nie mitkommen. */
  laut('git add package.json');
  const vorgemerkt = sh('git diff --cached --name-only').split('\n').filter(Boolean);
  /* Beim Wiederaufnehmen steht die Nummer schon drin - dann gibt es nichts zu committen,
   * und ein 'git commit' ohne Aenderung bricht mit Rueckgabewert 1 ab. */
  if (!vorgemerkt.length && schonGesetzt) {
    console.log('  package.json steht bereits auf ' + neu + ' - kein neuer Commit noetig.');
  } else {
  if (vorgemerkt.some(function (f) { return /telemetrie/i.test(f); })) {
    schluss('telemetrie.json ist vorgemerkt. Das wird nicht committet.');
  }
  if (vorgemerkt.length !== 1 || vorgemerkt[0] !== 'package.json') {
    schluss('Vorgemerkt ist mehr als package.json: ' + vorgemerkt.join(', '));
  }
    laut('git commit -q -m "Version ' + neu + '"');
  }

  titel('Sauberer Baum');
  baubaumWeg();
  laut('git worktree add --detach "' + BAUBAUM + '" HEAD');

  /* Die Junction laesst sich NICHT aus einer Bash-Zeile heraus anlegen - dort schlaegt
   * sie still fehl und der Build laeuft trotzdem los. Deshalb PowerShell direkt, und
   * danach nachzaehlen statt hoffen. */
  titel('node_modules verlinken');
  const ziel = path.join(BAUBAUM, 'node_modules');
  execFileSync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command',
    'New-Item -ItemType Junction -Path "' + ziel + '" -Target "' + path.join(REPO, 'node_modules') + '" | Out-Null'],
    { stdio: 'inherit' });
  /* Zwei verschiedene Fehler, die frueher dieselbe Meldung bekamen - und die falsche
   * schickte am 24.08.2026 die Suche in die falsche Richtung. */
  if (!fs.existsSync(ziel)) {
    schluss('Die Junction liess sich nicht anlegen: ' + ziel);
  }
  const quelle = path.join(REPO, 'node_modules');
  if (!fs.existsSync(path.join(quelle, 'electron', 'package.json')) ||
      !fs.existsSync(path.join(quelle, 'electron-builder', 'package.json'))) {
    schluss('Die Junction steht, aber ihr ZIEL ist leer oder unvollstaendig:\n  ' + quelle +
            '\nDas ist kein Fehler dieses Laufs. Wahrscheinlich hat jemand einen Baum mit ' +
            'Junction rekursiv geloescht - das geht unter Windows durch die Junction hindurch. ' +
            'Abhilfe: npm ci im Quellverzeichnis.');
  }
  console.log('  ok: ' + fs.readdirSync(ziel).length + ' Eintraege sichtbar');

  /* Nicht committet, aber im Paket noetig. */
  const tel = path.join(REPO, 'telemetrie.json');
  if (fs.existsSync(tel)) { fs.copyFileSync(tel, path.join(BAUBAUM, 'telemetrie.json')); console.log('  telemetrie.json kopiert'); }
  else console.log('  WARNUNG: telemetrie.json fehlt im Quellbaum - das Paket bekommt keinen Sendeschluessel');

  titel('Tests im sauberen Baum');
  /* Die VOLLE Reihe, nicht nur test-v6. Bis Issue #76 lief hier - also in genau dem
   * Baum, aus dem das ausgelieferte Paket entsteht - nur test-v6.js; eslint und
   * test-channel sahen das Paket nie. Im Repo oben lief die volle Reihe laengst,
   * ausgerechnet der Baubaum war die Ausnahme. */
  laut('npm test', { cwd: BAUBAUM });

  titel('Bauen');
  laut('npx electron-builder --win --publish never', { cwd: BAUBAUM });

  const dist = path.join(BAUBAUM, 'dist');
  const setup = path.join(dist, 'Markt-Dashboard-Setup.exe');
  const yml = path.join(dist, 'latest.yml');
  if (!fs.existsSync(setup) || !fs.existsSync(yml)) schluss('Im dist fehlt Setup.exe oder latest.yml.');
  /* Riegel 2: der Stand, aus dem DIESES Paket entstand - --hoch verlangt ihn. */
  bauStandSchreiben(dist, neu);
  console.log('\n  fertig: ' + setup + '  (' + Math.round(fs.statSync(setup).size / 1048576) + ' MB)');
  console.log('  Version ' + neu + ' gebaut. Weiter mit --hoch');
  return neu;
}

/* ------------------------------------------------------------------- hoch */
function sha512(datei) {
  return crypto.createHash('sha512').update(fs.readFileSync(datei)).digest('base64');
}

function hoch() {
  const v0 = version();
  sperreSetzen('hoch', v0);
  try { return hochKern(v0); } finally { sperreLoesen(); }
}
function hochKern(v) {
  const tag = 'v' + v;
  const dist = process.env.DIST || path.join(BAUBAUM, 'dist');
  const setup = path.join(dist, 'Markt-Dashboard-Setup.exe');
  const yml = path.join(dist, 'latest.yml');
  if (!fs.existsSync(setup)) schluss('Kein Paket unter ' + dist + '. Erst --bauen.');

  /* Riegel 2, VOR allem anderen - insbesondere vor dem Notizen-Wegraeumen, das
   * selbst einen (gewollten) Commit macht. */
  titel('Bau-Stand gegen HEAD');
  bauStandPruefen(dist);

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

  /* Auch hier: erst der Blick auf origin. Der Push weiter unten ist die Stelle, an
   * der am 25.08.2026 alles auseinanderflog. */
  const st2 = standGegenOrigin();
  if (st2 && st2.zurueck > 0) {
    schluss('HEAD liegt ' + st2.zurueck + ' Commit(s) hinter origin/main. Erst nachziehen, ' +
            'dann veroeffentlichen - sonst scheitert der Push und der Tag bleibt liegen.');
  }

  /* Die verbrauchten Notizen VERSCHWINDEN VOR DEM TAG. Bis zum 25.08.2026 geschah das
   * danach - der Aufraeum-Commit konnte den Tag damit bauartbedingt nie erreichen, und
   * der naechste --pruefen-Lauf hielt ihn fuer unausgelieferte Arbeit (Issue 76.6).
   * Der Text der Notizen steht zu diesem Zeitpunkt laengst in koerper und in tmp; das
   * Loeschen kann den Release-Text also nicht mehr beschaedigen. */
  titel('Notizen wegraeumen');
  n.forEach(function (x) { fs.unlinkSync(path.join(NOTIZEN, x.datei)); console.log('  ' + x.datei + ' verbraucht'); });
  let notizenWeg = false;
  if (n.length) {
    laut('git add -A release-notizen');
    laut('git commit -q -m "Release-Notizen fuer ' + v + ' verbraucht"');
    notizenWeg = true;
  }

  titel('Tag und Entwurf');
  laut('git tag -a ' + tag + ' -m "Markt-Dashboard ' + v + '"');
  /* Ab hier gibt es etwas aufzuraeumen, wenn es schiefgeht. */
  try {
    laut('git push -q origin HEAD');
    laut('git push -q origin ' + tag);
    laut('gh release create ' + tag + ' --draft --title "Markt-Dashboard ' + v + '" --notes-file "' + tmp + '"');
  } catch (e) {
    /* Wer einen Tag anlegt, raeumt ihn weg, wenn er nicht traegt - sonst meldet der
     * naechste Lauf "Tag gibt es schon", waehrend es kein Release dazu gibt. */
    try { execSync('git tag -d ' + tag, { cwd: REPO, stdio: 'ignore' }); } catch (e2) { }
    /* Und die Notizen kommen zurueck. Sie sind seit diesem Lauf verbraucht, aber es
     * gibt kein Release, das sie verbraucht haette - ohne diesen Rueckweg waere die
     * Arbeit von einem halben Tag aus der naechsten Release-Nachricht verschwunden.
     * n traegt Dateiname UND Text, das Zurueckschreiben braucht also kein Git. */
    if (notizenWeg) {
      try {
        n.forEach(function (x) { fs.writeFileSync(path.join(NOTIZEN, x.datei), x.text + '\n', 'utf8'); });
        execSync('git add -A release-notizen', { cwd: REPO, stdio: 'ignore' });
        execSync('git commit -q -m "Release-Notizen zurueckgeholt: ' + tag + ' wurde nicht veroeffentlicht"', { cwd: REPO, stdio: 'ignore' });
        console.log('  ' + n.length + ' Notiz(en) zurueckgeholt - der naechste Lauf findet sie wieder.');
      } catch (e3) {
        console.error('  ACHTUNG: die Notizen liessen sich nicht zurueckholen. Sie stehen im\n' +
                      '  Commit "Release-Notizen fuer ' + v + ' verbraucht" und lassen sich\n' +
                      '  von dort mit git revert wiederherstellen.');
      }
    }
    schluss('Tag oder Entwurf liessen sich nicht anlegen: ' + (e.message || e).toString().split('\n')[0] +
            '\nDer lokale Tag ' + tag + ' wurde wieder entfernt, damit der naechste Lauf nicht ' +
            'daran haengenbleibt.');
  }

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

  console.log('\n  ' + tag + ' ist draussen.');
}

/* ------------------------------------------------------------------- Lauf */
const arg = process.argv.slice(2);
const minor = arg.indexOf('--minor') !== -1;

/** Ausliefern darf die Wache - oder Wilhelm ausdruecklich von Hand.
 *
 *  Eine Regel, die nur in der Dokumentation steht, hat hier nicht gehalten: CLAUDE.md
 *  sagte "benutze die Routine", und genau das hat eine Sitzung dann selbst getan -
 *  fuenf Versionen in einer Nacht. Deshalb steht die Regel hier, wo sie greift. */
function darfAusliefern(was) {
  if (arg.indexOf('--wache') !== -1 || arg.indexOf('--von-hand') !== -1) return;
  console.error('\nAusliefern ist Sache der RELEASE-WACHE, nicht einer Sitzung.');
  console.error('');
  console.error('Wenn du an der App gearbeitet hast: committen, eine Notiz in');
  console.error('release-notizen/ ablegen - fertig. Die Wache holt den Rest.');
  console.error('');
  console.error('  node tools/release.js --pruefen     zeigt, was unveroeffentlicht ist');
  console.error('');
  console.error('Die Wache ruft "' + was + '" mit --wache auf.');
  console.error('Von Hand (Wilhelms Entscheidung): --von-hand anhaengen.');
  process.exit(2);
}
if (arg.indexOf('--aufraeumen') !== -1) { baubaumWeg(); console.log('Baubaum weg.'); }
else if (arg.indexOf('--pruefen') !== -1) { pruefen(); }
else if (arg.indexOf('--bauen') !== -1) { darfAusliefern('--bauen'); bauen(minor); }
else if (arg.indexOf('--hoch') !== -1) { darfAusliefern('--hoch'); hoch(); }
else if (arg.indexOf('--alles') !== -1) { darfAusliefern('--alles'); pruefen(); bauen(minor); hoch(); }
else {
  console.log(fs.readFileSync(__filename, 'utf8').split('*/')[0].replace(/^'use strict';\n\/\* /, '').replace(/^ \* ?/gm, ''));
}
