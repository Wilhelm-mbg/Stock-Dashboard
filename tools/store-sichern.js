'use strict';
/* SICHERUNG DES RENDERER-STORES (Archiv-Zusammenfuehrung, Stufe Z0).
 *
 *   node tools/store-sichern.js <quelle> <ziel>
 *
 *   quelle   der Store-Ordner der laufenden App, z. B.
 *            C:/Users/<name>/AppData/Roaming/Markt-Dashboard/store
 *   ziel     ein NEUER Ordner, z. B. E:/Markt-Dashboard-Archiv/store-sicherung-2026-09-03
 *
 * Beide Pfade kommen als Argumente. Diese Datei raet nichts ueber os.homedir() oder
 * APPDATA - tools/sicherung.js tut das, und genau deshalb passt es nur auf einer
 * Maschine. Wer die Sicherung anstoesst, sagt, wovon und wohin.
 *
 * WAS SIE TUT. Alle bars_*.json der Quelle werden kopiert - und nur die. Die uebrigen
 * Store-Dateien (depot.json, settings.json ...) deckt tools/sicherung.js ab; die
 * Kursdateien schliesst es aus, weil "die App sie selbst nachlaedt". Fuer 1-Minuten-
 * Kerzen ist das falsch: Yahoo gibt 7 Tage zurueck, der Store haelt 69. Diese Sicherung
 * ist die erste Kopie dieser Tiefe.
 *
 * WARUM DIE QUELLE LEBT UND WAS DAS BEDEUTET. Die App schreibt jede Store-Datei alle
 * zehn Minuten neu (atomar: tmp + rename). Hier wird die Quelle NUR gelesen - nie
 * geschrieben, nie umbenannt, nie gesperrt. Jede Datei wird
 *   1. gelesen und gehasht (SHA-256),
 *   2. aus genau diesen Bytes ins Ziel geschrieben,
 *   3. aus dem Ziel zurueckgelesen und erneut gehasht,
 *   4. und - weil "Kopie stimmt mit Lesung ueberein" nichts darueber sagt, ob die
 *      Lesung selbst eine halbe Datei war - als JSON geprueft.
 * Weicht 3 von 1 ab oder ist 4 unlesbar, gilt die Datei als "gerade beschrieben":
 * nach 30 Sekunden ein neuer Versuch, hoechstens drei. Was dann noch nicht stimmt,
 * steht in der manifest.json unter nichtSicherbar - es wird nicht stillschweigend
 * weggelassen.
 *
 * DIE manifest.json ist die eigentliche Sicherung: Name, Bytes, Aenderungszeit und
 * SHA-256 je Datei. Wer spaeter wissen will, ob die Kopie noch die von heute ist,
 * rechnet die Summen nach, statt der Ordnergroesse zu glauben.
 *
 * Exit 0: alles gesichert. Exit 1: mindestens eine Datei nicht sicherbar. Exit 2:
 * falsche Argumente oder Ziel existiert schon (eine Sicherung ueberschreibt keine
 * andere).
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');

var MUSTER = /^bars_.*\.json$/;
var VERSUCHE = 3;
var WARTE_MS = 30000;

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function lesbar(buf) {
  try { JSON.parse(buf.toString('utf8')); return true; } catch (e) { return false; }
}

/* Ein Versuch fuer eine Datei. Gibt { ok, sha256, bytes, grund } zurueck. */
function versuch(von, nach) {
  var quelle;
  try { quelle = fs.readFileSync(von); } catch (e) { return { ok: false, grund: 'lesen: ' + e.code }; }
  if (!lesbar(quelle)) return { ok: false, grund: 'Quelle kein gueltiges JSON (halb geschrieben?)' };
  var h1 = sha256(quelle);
  try { fs.writeFileSync(nach, quelle); } catch (e) { return { ok: false, grund: 'schreiben: ' + e.code }; }
  var zurueck;
  try { zurueck = fs.readFileSync(nach); } catch (e) { return { ok: false, grund: 'zurücklesen: ' + e.code }; }
  var h2 = sha256(zurueck);
  if (h1 !== h2) return { ok: false, grund: 'Prüfsumme Kopie ≠ Lesung' };
  /* Die Quelle ein zweites Mal hashen: hat sie sich waehrend des Kopierens geaendert,
   * ist die Kopie zwar in sich stimmig, aber nicht mehr der Stand, den das Manifest
   * beschreibt. Dann lieber noch einmal. */
  var nochmal;
  try { nochmal = sha256(fs.readFileSync(von)); } catch (e) { nochmal = null; }
  if (nochmal !== h1) return { ok: false, grund: 'Quelle hat sich während des Kopierens geändert' };
  return { ok: true, sha256: h1, bytes: quelle.length };
}

async function sichern(quelle, ziel) {
  var namen = fs.readdirSync(quelle).filter(function (n) { return MUSTER.test(n); }).sort();
  fs.mkdirSync(ziel, { recursive: false });
  var dateien = [], nicht = [];
  var bytes = 0, t0 = Date.now();
  for (var i = 0; i < namen.length; i++) {
    var n = namen[i];
    var von = path.join(quelle, n), nach = path.join(ziel, n);
    var st = fs.statSync(von);
    var erg = null, gruende = [];
    for (var v = 1; v <= VERSUCHE; v++) {
      erg = versuch(von, nach);
      if (erg.ok) { erg.versuche = v; break; }
      gruende.push(erg.grund);
      console.log('  ' + n + ': Versuch ' + v + ' misslungen (' + erg.grund + ')' +
        (v < VERSUCHE ? ', warte ' + (WARTE_MS / 1000) + ' s' : ''));
      if (v < VERSUCHE) await warte(WARTE_MS);
    }
    if (erg.ok) {
      dateien.push({ name: n, bytes: erg.bytes, sha256: erg.sha256,
        mtime: st.mtime.toISOString(), versuche: erg.versuche });
      bytes += erg.bytes;
    } else {
      nicht.push({ name: n, gruende: gruende });
      try { fs.unlinkSync(nach); } catch (e) { /* keine halbe Kopie liegen lassen */ }
    }
    if ((i + 1) % 100 === 0) console.log('  ' + (i + 1) + ' / ' + namen.length);
  }
  var manifest = {
    erstellt: new Date().toISOString(),
    quelle: quelle, ziel: ziel, muster: String(MUSTER),
    verfahren: 'lesen → SHA-256 → schreiben → zurücklesen → SHA-256 vergleichen → JSON-Prüfung → Quelle erneut hashen; bei Abweichung 30 s warten, bis zu 3 Versuche',
    dauerSekunden: Math.round((Date.now() - t0) / 1000),
    summe: { dateien: dateien.length, bytes: bytes, nichtSicherbar: nicht.length },
    dateien: dateien, nichtSicherbar: nicht,
  };
  fs.writeFileSync(path.join(ziel, 'manifest.json'), JSON.stringify(manifest, null, 1));
  return manifest;
}

if (require.main === module) {
  var quelle = process.argv[2], ziel = process.argv[3];
  if (!quelle || !ziel) { console.error('Aufruf: node tools/store-sichern.js <quelle> <ziel>'); process.exit(2); }
  if (!fs.existsSync(quelle) || !fs.statSync(quelle).isDirectory()) { console.error('Quelle ist kein Ordner: ' + quelle); process.exit(2); }
  if (fs.existsSync(ziel)) { console.error('Ziel existiert schon, eine Sicherung überschreibt keine andere: ' + ziel); process.exit(2); }
  sichern(quelle, ziel).then(function (m) {
    console.log('\nGesichert: ' + m.summe.dateien + ' Dateien, ' + (m.summe.bytes / 1048576).toFixed(1) + ' MB, ' +
      m.dauerSekunden + ' s');
    if (m.nichtSicherbar.length) {
      console.log('NICHT SICHERBAR: ' + m.nichtSicherbar.map(function (x) { return x.name; }).join(', '));
      process.exit(1);
    }
  }, function (e) { console.error(e && e.stack || e); process.exit(2); });
}

module.exports = { sichern: sichern, versuch: versuch, MUSTER: MUSTER };
