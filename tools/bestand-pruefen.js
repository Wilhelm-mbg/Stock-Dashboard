'use strict';
/* Bestandsprüfung: Was liegt wirklich im Datenordner, und hat es Lücken?
 *
 * Aufruf (Windows, im Projektordner):
 *     node tools/bestand-pruefen.js
 * Ein anderer Store-Pfad geht als Argument:
 *     node tools/bestand-pruefen.js "D:\ein\anderer\store"
 *
 * NUR LESEND. Das Skript schreibt keine einzige Datei, legt nichts an und löscht
 * nichts - es öffnet jede Datei, sagt was drinsteht, und hört auf. Es darf also
 * auch bei laufender App gestartet werden.
 *
 * Geprüft wird, was die App selbst nicht anzeigt:
 *   - Kursarchiv: je Zeitrahmen und Symbol, wie viele Kerzen, welcher Zeitraum,
 *     wie viele Handelstage tatsächlich belegt sind - und wo Lücken klaffen.
 *   - Unlesbare Dateien und beiseitegelegte .defekt-Reste (seit 8.24.5).
 *   - Depot, Sicherungsgenerationen, Einstellungen.
 *   - Der Downloads-Ordner: Protokolle, Strategien, Fehlermeldungen.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function storeOrdner() {
  if (process.argv[2]) return process.argv[2];
  const appdata = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
  return path.join(appdata, 'Markt-Dashboard', 'store');
}
function datenOrdner() {
  return path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
}

function mb(n) { return (n / 1048576).toFixed(1) + ' MB'; }
function tag(ms) { return new Date(ms).toISOString().slice(0, 10); }
function zahl(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

/** Handelstage einer Bar-Reihe und die Lücken darin (in Kalendertagen). */
function abdeckung(series) {
  const tage = new Set();
  for (const b of series) if (b && b.length) tage.add(tag(b[0]));
  const sortiert = [...tage].sort();
  const luecken = [];
  for (let i = 1; i < sortiert.length; i++) {
    const a = Date.parse(sortiert[i - 1] + 'T00:00:00Z');
    const b = Date.parse(sortiert[i] + 'T00:00:00Z');
    const abstand = Math.round((b - a) / 86400000);
    // Ein Wochenende sind drei Kalendertage Abstand - alles darüber ist eine echte Lücke
    if (abstand > 4) luecken.push({ von: sortiert[i - 1], bis: sortiert[i], tage: abstand - 1 });
  }
  return { tage: sortiert.length, von: sortiert[0], bis: sortiert[sortiert.length - 1], luecken };
}

function lies(p) {
  try { return { ok: true, wert: JSON.parse(fs.readFileSync(p, 'utf8')) }; }
  catch (e) { return { ok: false, fehler: String(e.message || e).slice(0, 90) }; }
}

// ============================================================================
const SD = storeOrdner();
const DD = datenOrdner();
console.log('Bestandsprüfung  ·  ' + new Date().toLocaleString('de-DE'));
console.log('Store  : ' + SD);
console.log('Daten  : ' + DD);
console.log('='.repeat(78));

if (!fs.existsSync(SD)) {
  console.log('\nDer Store-Ordner existiert nicht. Entweder lief die App auf diesem Rechner');
  console.log('noch nie, oder der Pfad ist ein anderer - dann als Argument übergeben.');
  process.exit(1);
}

const dateien = fs.readdirSync(SD);
const bars = dateien.filter((f) => /^bars_.+\.json$/.test(f));
const defekt = dateien.filter((f) => /\.defekt$/.test(f));
const baks = dateien.filter((f) => /\.bak[12]$/.test(f));

// ---------- 1) Kursarchiv ----------
console.log('\n1) KURSARCHIV\n');
const proIv = {};
let unlesbar = [];
let gesamtBytes = 0, gesamtKerzen = 0;

for (const f of bars) {
  const m = /^bars_([^_]+)_(.+)\.json$/.exec(f);
  if (!m) continue;
  const [, iv, sym] = m;
  const p = path.join(SD, f);
  gesamtBytes += fs.statSync(p).size;
  const r = lies(p);
  if (!r.ok) { unlesbar.push({ f, fehler: r.fehler }); continue; }
  const serie = (r.wert && r.wert.series) || [];
  if (!proIv[iv]) proIv[iv] = [];
  const a = serie.length ? abdeckung(serie) : { tage: 0, luecken: [] };
  gesamtKerzen += serie.length;
  proIv[iv].push({ sym, kerzen: serie.length, ...a,
                   cap: (r.wert.capBereiche || []).length,
                   stand: r.wert.updatedAt ? tag(r.wert.updatedAt) : '?' });
}

if (!bars.length) {
  console.log('   Keine bars_*-Dateien. Das Archiv ist leer - es füllt sich mit jedem Scan.');
}
for (const iv of Object.keys(proIv).sort()) {
  const liste = proIv[iv].sort((a, b) => b.tage - a.tage);
  const tage = liste.map((x) => x.tage).sort((a, b) => a - b);
  const median = tage[Math.floor(tage.length / 2)] || 0;
  const mitLuecken = liste.filter((x) => x.luecken.length);
  const duenn = liste.filter((x) => x.tage < median * 0.5);
  console.log('   ' + iv.padEnd(5) + zahl(liste.length).padStart(4) + ' Symbole  ·  Handelstage: ' +
    'min ' + tage[0] + ', Median ' + median + ', max ' + tage[tage.length - 1]);
  /* Die Spanne ueber ALLE Symbole, nicht die des laengsten. Der erste Wurf nahm
   * liste[0] - das ist nach Tagen sortiert das dickste Symbol, und die Zeile las
   * sich dann wie die Spanne des ganzen Zeitrahmens. */
  const alleVon = liste.map((x) => x.von).filter(Boolean).sort();
  const alleBis = liste.map((x) => x.bis).filter(Boolean).sort();
  console.log('         Zeitraum ' + (alleVon[0] || '?') + ' bis ' + (alleBis[alleBis.length - 1] || '?') +
    '  ·  ' + zahl(liste.reduce((s, x) => s + x.kerzen, 0)) + ' Kerzen' +
    (alleVon[0] !== alleVon[alleVon.length - 1]
      ? '  (der jüngste Beginn ist ' + alleVon[alleVon.length - 1] + ')' : ''));
  if (duenn.length) {
    console.log('         ' + duenn.length + ' Symbol(e) unter der halben Median-Abdeckung: ' +
      duenn.slice(0, 8).map((x) => x.sym + ' (' + x.tage + ')').join(', ') + (duenn.length > 8 ? ' …' : ''));
  }
  if (mitLuecken.length) {
    console.log('         ' + mitLuecken.length + ' Symbol(e) mit Lücken über vier Tagen:');
    for (const x of mitLuecken.slice(0, 5)) {
      const gr = x.luecken.sort((a, b) => b.tage - a.tage)[0];
      console.log('           ' + x.sym.padEnd(10) + x.luecken.length + ' Lücke(n), größte ' +
        gr.tage + ' Tage (' + gr.von + ' → ' + gr.bis + ')');
    }
    if (mitLuecken.length > 5) console.log('           … und ' + (mitLuecken.length - 5) + ' weitere');
  }
  if (!duenn.length && !mitLuecken.length) console.log('         keine Lücken, keine Ausreißer');
  console.log('');
}
if (bars.length) console.log('   Archiv gesamt: ' + zahl(gesamtKerzen) + ' Kerzen in ' + mb(gesamtBytes));

// ---------- 2) Schäden ----------
console.log('\n2) SCHÄDEN UND RESTE\n');
if (unlesbar.length) {
  console.log('   ' + unlesbar.length + ' Datei(en) NICHT lesbar:');
  for (const u of unlesbar.slice(0, 10)) console.log('     ' + u.f + '  →  ' + u.fehler);
} else {
  console.log('   Keine unlesbare Datei.');
}
if (defekt.length) {
  console.log('   ' + defekt.length + ' beiseitegelegte .defekt-Datei(en) - die App hat dort einmal');
  console.log('   einen kaputten Bestand gerettet, statt ihn zu überschreiben:');
  for (const d of defekt.slice(0, 10)) console.log('     ' + d);
  console.log('   Sie werden von der App nicht mehr angefasst. Wenn Sie sie nicht brauchen,');
  console.log('   können Sie sie von Hand löschen.');
} else {
  console.log('   Keine .defekt-Reste - es musste noch nie etwas gerettet werden.');
}
console.log('   Sicherungsgenerationen (.bak1/.bak2): ' + (baks.length || 'keine'));

// ---------- 3) Depot und Einstellungen ----------
console.log('\n3) DEPOT UND EINSTELLUNGEN\n');
for (const name of ['depot', 'settings', 'diagnose', 'mf_tagesdaten_index', 'drift_termine', 'drift_markt']) {
  const p = path.join(SD, name + '.json');
  if (!fs.existsSync(p)) { console.log('   ' + name.padEnd(20) + 'nicht vorhanden'); continue; }
  const r = lies(p);
  const groesse = mb(fs.statSync(p).size);
  if (!r.ok) { console.log('   ' + name.padEnd(20) + 'UNLESBAR  →  ' + r.fehler); continue; }
  let zusatz = '';
  const w = r.wert || {};
  if (name === 'depot') {
    zusatz = (w.positions || []).length + ' offene Position(en), ' +
      (w.trades || []).length + ' Trades, ' + (w.tuneLog || []).length + ' Protokolleinträge' +
      (w.__ausSicherung ? '  ← aus Sicherung ' + w.__ausSicherung : '');
  } else if (name === 'drift_termine' && w.sym) {
    zusatz = Object.keys(w.sym).length + ' Symbole mit Terminen';
  } else if (name === 'mf_tagesdaten_index') {
    zusatz = (w.teile || 0) + ' Teile, Stand ' + (w.at ? tag(w.at) : '?');
  }
  console.log('   ' + name.padEnd(20) + groesse.padStart(8) + '  ' + zusatz);
}

// ---------- 4) Der Downloads-Ordner ----------
console.log('\n4) DATENORDNER (Downloads)\n');
if (!fs.existsSync(DD)) {
  console.log('   Nicht vorhanden - es wurde noch nichts exportiert.');
} else {
  for (const unter of ['protokolle', 'strategien']) {
    const p = path.join(DD, unter);
    if (!fs.existsSync(p)) { console.log('   ' + unter.padEnd(16) + 'nicht vorhanden'); continue; }
    const fs2 = fs.readdirSync(p).filter((x) => /\.(json|js|md)$/.test(x));
    console.log('   ' + unter.padEnd(16) + fs2.length + ' Datei(en)' +
      (fs2.length ? '  ·  neueste: ' + fs2.sort().pop() : ''));
  }
  const bug = path.join(DD, 'fehlermeldungen.json');
  if (fs.existsSync(bug)) {
    const r = lies(bug);
    console.log('   fehlermeldungen  ' + (r.ok ? (r.wert.meldungen || []).length + ' Meldung(en), davon offen: ' +
      (r.wert.meldungen || []).filter((m) => m.status === 'offen').length : 'UNLESBAR → ' + r.fehler));
  } else console.log('   fehlermeldungen  nicht vorhanden');
  for (const f of ['analyse-daten.json', 'messbericht.md', 'auswertung-bericht.md']) {
    const p = path.join(DD, f);
    console.log('   ' + f.padEnd(16) + (fs.existsSync(p)
      ? mb(fs.statSync(p).size) + '  ·  ' + tag(fs.statSync(p).mtimeMs) : 'nicht vorhanden'));
  }
  const defektD = fs.readdirSync(DD).filter((x) => /\.defekt$/.test(x));
  if (defektD.length) console.log('   .defekt-Reste    ' + defektD.join(', '));
}

console.log('\n' + '='.repeat(78));
console.log('Fertig. Es wurde nichts geändert.');
