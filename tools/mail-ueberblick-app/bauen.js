'use strict';
/* ================= Mail-Überblick-App: APK bauen ohne Gradle =================
 *
 * Baut aus tools/mail-ueberblick-app/android/ eine installierbare APK - mit den rohen
 * Werkzeugen des Android-SDK (aapt2, d8, zipalign, apksigner) und dem JDK (javac, jar,
 * keytool). Kein Gradle, keine Abhängigkeiten, keine package.json-Änderung: für eine
 * WebView-Hülle mit einer Activity ist Gradle 300 MB Ballast.
 *
 * Schritte:
 *   1 aapt2 compile   res/**            -> res.zip (kompilierte Ressourcen)
 *   2 aapt2 link      + Manifest         -> roh.apk (Ressourcen, Manifest) und R.java
 *   3 javac           src + R.java       -> classes/
 *   4 d8              classes/           -> classes.dex
 *   5 jar --update    classes.dex        -> roh.apk
 *   6 zipalign        roh.apk            -> ausgerichtet.apk
 *   7 apksigner       (Debug-Schlüssel)  -> mail-ueberblick.apk
 *
 * Der Signaturschlüssel liegt unter %LOCALAPPDATA%\Programs\mail-ueberblick-toolchain\
 * mail-ueberblick.keystore und wird beim ersten Bau angelegt. Er bleibt: eine App-
 * Aktualisierung am Handy geht nur mit derselben Signatur.
 *
 * Toolchain: JDK und SDK unter %LOCALAPPDATA%\Programs\mail-ueberblick-toolchain\
 * (jdk\<ordner>, sdk\); überschreibbar mit JAVA_HOME und ANDROID_HOME.
 *
 * Aufruf aus der Repo-Wurzel:  node tools/mail-ueberblick-app/bauen.js
 * Ausgabe: C:\Users\Wilhe\Downloads\Markt-Dashboard-Daten\apk\mail-ueberblick.apk */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const HIER = __dirname;
const ANDROID = path.join(HIER, 'android');
const ZIEL_ORDNER = 'C:\\Users\\Wilhe\\Downloads\\Markt-Dashboard-Daten\\apk';
const TOOLCHAIN = path.join(process.env.LOCALAPPDATA || os.homedir(), 'Programs', 'mail-ueberblick-toolchain');
const API = 34;

function ersterOrdner(p) { return fs.existsSync(p) ? fs.readdirSync(p).map(n => path.join(p, n)).find(d => fs.statSync(d).isDirectory()) : null; }
function javaHome() {
  if (process.env.JAVA_HOME && fs.existsSync(process.env.JAVA_HOME)) return process.env.JAVA_HOME;
  const j = ersterOrdner(path.join(TOOLCHAIN, 'jdk'));
  if (!j) throw new Error('JDK fehlt: JAVA_HOME setzen oder unter ' + path.join(TOOLCHAIN, 'jdk') + ' entpacken');
  return j;
}
function sdkHome() {
  const s = process.env.ANDROID_HOME || process.env.ANDROID_SDK_ROOT || path.join(TOOLCHAIN, 'sdk');
  if (!fs.existsSync(s)) throw new Error('Android-SDK fehlt: ' + s);
  return s;
}
function buildTools(sdk) {
  const bt = path.join(sdk, 'build-tools');
  const v = fs.existsSync(bt) ? fs.readdirSync(bt).filter(n => /^\d/.test(n)).sort().reverse()[0] : null;
  if (!v) throw new Error('build-tools fehlen unter ' + bt);
  return path.join(bt, v);
}
function lauf(exe, args, opts) {
  process.stdout.write('  > ' + path.basename(exe) + ' ' + args.map(a => (/\s/.test(a) ? '"' + a + '"' : a)).join(' ').slice(0, 300) + '\n');
  // .bat-Werkzeuge (d8, apksigner) laufen über cmd.exe, ohne shell:true - Node warnt sonst (DEP0190)
  const ueberCmd = process.platform === 'win32' && /\.bat$/i.test(exe);
  const befehl = ueberCmd ? 'cmd.exe' : exe;
  const argumente = ueberCmd ? ['/d', '/s', '/c', '"' + [exe].concat(args).map(a => '"' + a + '"').join(' ') + '"'] : args;
  return execFileSync(befehl, argumente, Object.assign({ stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 64 * 1024 * 1024, windowsVerbatimArguments: ueberCmd }, opts || {})).toString();
}
function dateienUnter(dir, filter) {
  const erg = [];
  if (!fs.existsSync(dir)) return erg;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) erg.push(...dateienUnter(p, filter)); else if (!filter || filter(p)) erg.push(p);
  }
  return erg;
}

function main() {
  const JDK = javaHome();
  const SDK = sdkHome();
  const BT = buildTools(SDK);
  const exe = (n) => n + (process.platform === 'win32' ? '.exe' : '');
  const bat = (n) => n + (process.platform === 'win32' ? '.bat' : '');
  const javac = path.join(JDK, 'bin', exe('javac'));
  const jar = path.join(JDK, 'bin', exe('jar'));
  const keytool = path.join(JDK, 'bin', exe('keytool'));
  const aapt2 = path.join(BT, exe('aapt2'));
  const d8 = path.join(BT, bat('d8'));
  const zipalign = path.join(BT, exe('zipalign'));
  const apksigner = path.join(BT, bat('apksigner'));
  const androidJar = path.join(SDK, 'platforms', 'android-' + API, 'android.jar');
  for (const p of [javac, jar, keytool, aapt2, d8, zipalign, apksigner, androidJar]) {
    if (!fs.existsSync(p)) throw new Error('fehlt: ' + p);
  }
  const env = Object.assign({}, process.env, { JAVA_HOME: JDK, PATH: path.join(JDK, 'bin') + path.delimiter + process.env.PATH });

  const bau = path.join(os.tmpdir(), 'mail-ueberblick-apk-bau');
  fs.rmSync(bau, { recursive: true, force: true });
  fs.mkdirSync(bau, { recursive: true });
  const resZip = path.join(bau, 'res.zip');
  const rohApk = path.join(bau, 'roh.apk');
  const gen = path.join(bau, 'gen');
  const classes = path.join(bau, 'classes');
  const dex = path.join(bau, 'dex');
  const ausgerichtet = path.join(bau, 'ausgerichtet.apk');
  fs.mkdirSync(gen); fs.mkdirSync(classes); fs.mkdirSync(dex);

  console.log('1 aapt2 compile');
  lauf(aapt2, ['compile', '--dir', path.join(ANDROID, 'res'), '-o', resZip]);

  console.log('2 aapt2 link');
  lauf(aapt2, ['link', '-o', rohApk, '--manifest', path.join(ANDROID, 'AndroidManifest.xml'), '-I', androidJar,
    '--java', gen, '--min-sdk-version', '26', '--target-sdk-version', String(API), '--auto-add-overlay', resZip]);

  console.log('3 javac');
  const quellen = dateienUnter(path.join(ANDROID, 'src'), p => p.endsWith('.java')).concat(dateienUnter(gen, p => p.endsWith('.java')));
  lauf(javac, ['--release', '17', '-encoding', 'UTF-8', '-classpath', androidJar, '-d', classes].concat(quellen), { env });

  console.log('4 d8');
  const klassen = dateienUnter(classes, p => p.endsWith('.class'));
  lauf(d8, ['--release', '--min-api', '26', '--lib', androidJar, '--output', dex].concat(klassen), { env });

  console.log('5 classes.dex einfügen');
  lauf(jar, ['--update', '--file', rohApk, '-C', dex, 'classes.dex'], { env });

  console.log('6 zipalign');
  lauf(zipalign, ['-p', '-f', '4', rohApk, ausgerichtet]);

  console.log('7 signieren');
  const keystore = path.join(TOOLCHAIN, 'mail-ueberblick.keystore');
  const pw = 'mail-ueberblick';   // Debug-Schlüssel für Wilhelms eigenes Handy, nicht für einen Store
  if (!fs.existsSync(keystore)) {
    lauf(keytool, ['-genkeypair', '-keystore', keystore, '-storepass', pw, '-keypass', pw, '-alias', 'mail', '-keyalg', 'RSA', '-keysize', '2048',
      '-validity', '10000', '-dname', 'CN=Wilhelm Mail-Ueberblick, OU=privat, O=privat, L=Koeln, C=DE'], { env });
  }
  fs.mkdirSync(ZIEL_ORDNER, { recursive: true });
  const ziel = path.join(ZIEL_ORDNER, 'mail-ueberblick.apk');
  lauf(apksigner, ['sign', '--ks', keystore, '--ks-pass', 'pass:' + pw, '--key-pass', 'pass:' + pw, '--ks-key-alias', 'mail', '--out', ziel, ausgerichtet], { env });
  lauf(apksigner, ['verify', '--print-certs', ziel], { env });
  const kb = (fs.statSync(ziel).size / 1024).toFixed(0);
  console.log(`\nFERTIG: ${ziel} (${kb} KB)`);
  return 0;
}

try { process.exitCode = main(); }
catch (e) {
  console.error('\nBAU FEHLGESCHLAGEN: ' + (e.message || e));
  if (e.stdout) console.error(String(e.stdout));
  if (e.stderr) console.error(String(e.stderr));
  process.exitCode = 1;
}
