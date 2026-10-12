'use strict';
/* ================= pruefstrasse.json fuer den Reiter "Markt" im Management-Tool =================
 *
 * Auftrag Nr. 115 (12.10.2026), Vertrag uebergabe/auftrag-markt-im-management-tool-2026-10-12.md
 * (Nachtrag, Fassung pruefstrasse/lagebild/v1). Baut aus den Dateien der Pruefstrasse im Repo
 *   STATUS.md, pruefstrasse/register.json, pruefstrasse/erledigt/<k>/ergebnis.json + ERGEBNIS.md,
 *   pruefstrasse/warteschlange/<k>/kandidat.json, pruefstrasse/ideen-verworfen.md, wiki/log.md
 * die Datei <Datenordner>/pruefstrasse.json. Fehlt eine Quelle, wird ihr Abschnitt null - nie bricht
 * der Lauf. Nur lesen im Repo, nur eine Datei schreiben (atomar). Kein Netz, kein Electron.
 *
 *   node tools/pruefstrasse-lagebild.js [--aus <Datenordner>] [--repo <Repo-Wurzel>]
 *
 * Vorgabe: Repo = Ordner ueber tools/, Datenordner = ~/Downloads/Markt-Dashboard-Daten. Der PM ruft
 * es nach jedem Mischen der Nacht auf; spaeter laeuft es im Nachtskript des Rechenknechts.
 * Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');

function arg(name, vorgabe) { const i = process.argv.indexOf(name); return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe; }
const REPO = path.resolve(arg('--repo', path.join(__dirname, '..')));
const AUS = path.resolve(arg('--aus', path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten')));

function lies(p) { try { return fs.readFileSync(p, 'utf8'); } catch (e) { return null; } }
function json(p) { const t = lies(p); if (t == null) return null; try { return JSON.parse(t); } catch (e) { return null; } }
function iso(x) { if (x == null) return null; const t = typeof x === 'number' ? x : Date.parse(String(x)); return isFinite(t) ? new Date(t).toISOString() : null; }
function ordner(p) { try { return fs.readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch (e) { return null; } }
function abschnitt(fn) { try { const r = fn(); return r === undefined ? null : r; } catch (e) { return null; } }

/* STATUS.md: "- Letzter Lauf: <von> bis <bis>, Dauer 45 s (...)", "rc=0", "- Push der Vornacht: ..." */
function nacht(statusText) {
  if (statusText == null) return null;
  const lauf = /Letzter Lauf:\s*(\S+)\s+bis\s+(\S+),\s*Dauer\s+([^\n(]+?)\s*(?:\(|\n|$)/.exec(statusText);
  const rc = /rc=(\d+)/.exec(statusText);
  const push = /Push der Vornacht:\s*([^\n]+)/.exec(statusText);
  return { letzterLauf: lauf ? iso(lauf[2]) : null, dauer: lauf ? lauf[3].trim() : null,
    rc: rc ? parseInt(rc[1], 10) : null, push: push ? push[1].trim() : null };
}

/* ERGEBNIS.md: die Zeile der besten Konfiguration = die Tabellenzeile mit dem groessten t. */
function besteZeile(md) {
  if (!md) return null;
  const zeilen = md.split('\n').filter((z) => /^\|\s*[^|-]/.test(z) && !/^\|\s*Konf\b/.test(z));
  let beste = null, bestT = -Infinity;
  zeilen.forEach((z) => {
    const sp = z.split('|').map((s) => s.trim());
    const t = parseFloat(String(sp[7] || '').replace('−', '-').replace(',', '.'));
    if (isFinite(t) && t > bestT) { bestT = t; beste = z.trim(); }
  });
  return beste || (zeilen[0] ? zeilen[0].trim() : null);
}

function urteile() {
  const basis = path.join(REPO, 'pruefstrasse', 'erledigt');
  const namen = ordner(basis);
  if (namen === null) return null;
  return namen.map((k) => {
    const e = json(path.join(basis, k, 'ergebnis.json')) || {};
    const md = lies(path.join(basis, k, 'ERGEBNIS.md'));
    return { kennung: e.kennung || k, titel: e.titel || null, urteil: e.urteil || null, grund: e.grund || null,
      zeile: besteZeile(md), datum: iso(e.stand || e.datum), fundstelle: 'pruefstrasse/erledigt/' + k + '/ERGEBNIS.md' };
  }).sort((a, b) => String(b.datum || '').localeCompare(String(a.datum || '')));
}

function warteschlange() {
  const basis = path.join(REPO, 'pruefstrasse', 'warteschlange');
  const namen = ordner(basis);
  if (namen === null) return null;
  return namen.map((k) => {
    const p = path.join(basis, k, 'kandidat.json');
    const c = json(p) || {};
    let datum = null;
    try { datum = c.datum || c.stand || fs.statSync(p).mtime.toISOString(); } catch (e) { datum = null; }
    const konf = Array.isArray(c.konfigurationen) ? c.konfigurationen.length : (typeof c.konfigurationen === 'number' ? c.konfigurationen : null);
    return { kennung: c.kennung || k, titel: c.titel || null, form: c.form || null, datum: iso(datum), konfigurationen: konf };
  });
}

function register() {
  const r = json(path.join(REPO, 'pruefstrasse', 'register.json'));
  if (!r) return null;
  return { gesamt: typeof r.gesamt === 'number' ? r.gesamt : (Array.isArray(r.konfigurationen) ? r.konfigurationen.length : null),
    zufallErwartet: typeof r.zufallErwartet === 'number' ? r.zufallErwartet : null };
}

/* ideen-verworfen.md: je Eintrag "## <Datum> · `<kennung>` — verworfen (<Grund>)", darunter Absaetze.
 * grund = der Klammergrund der Ueberschrift, sonst der erste Satz des ersten Absatzes. */
function ideenAgent(md, ws) {
  if (md == null && !ws) return null;
  const verworfen = [];
  let letzter = null;
  if (md != null) {
    const re = /^## (\d{4}-\d{2}-\d{2})[^\n]*?`([^`]+)`[^\n]*?(?:\(([^)\n]*)\))?\s*$/gm;
    let m;
    const treffer = [];
    while ((m = re.exec(md))) treffer.push({ idx: m.index, ende: m.index + m[0].length, datum: m[1], kennung: m[2], klammer: m[3] || null });
    treffer.forEach((t, i) => {
      const koerper = md.slice(t.ende, i + 1 < treffer.length ? treffer[i + 1].idx : md.length).trim();
      const absatz = koerper.split(/\n\s*\n/).map((s) => s.replace(/\s+/g, ' ').trim()).filter(Boolean)[0] || '';
      const satz = /^(.*?[.!?])(\s|$)/.exec(absatz);
      verworfen.push({ kennung: t.kennung, grund: t.klammer || (satz ? satz[1] : absatz) || null });
      if (!letzter || t.datum > letzter) letzter = t.datum;
    });
  }
  (ws || []).forEach((w) => { const d = w.datum ? w.datum.slice(0, 10) : null; if (d && (!letzter || d > letzter)) letzter = d; });
  const eingestellt = (ws || []).length;
  return { letzterLauf: letzter, ergebnis: eingestellt + ' in der Warteschlange, ' + verworfen.length + ' verworfen', verworfen: verworfen };
}

/* wiki/log.md: die LETZTE Zeile, die den Nachtlauf beschreibt - nicht die letzte Zeile ueberhaupt
 * (die ist meist eine PM-Notiz zu etwas anderem). Am Bestand vom 12.10.2026 sind das die Formen
 *   "12.10.2026 (Prüfstraße, 02:00 UTC) — donchian20-ausbruch-long: nein ..."           (der Laeufer)
 *   "12.10.2026 (PM, 10:31) — Erste Nacht der Prüfstraße gelaufen. Rechenknecht 04:00 MESZ, 45 s: ..."
 *   "- 12.10.2026 — Nachtlauf gelaufen, rc 0."                                            (Kunstlog im Test)
 * Keine passende Zeile -> null (Nr. 116). */
const NACHT_RE = /Nacht der Pr[üu]fstra[ßs]e|Nachtlauf|\(Pr[üu]fstra[ßs]e,|Rechenknecht[^\n]*?\b\d+ s:/;
function nachtLogzeile(log) {
  if (log == null) return null;
  const z = log.split('\n').filter((x) => NACHT_RE.test(x)).pop();
  return z ? z.slice(0, 400) : null;
}

function bauen() {
  const status = lies(path.join(REPO, 'STATUS.md'));
  const ws = abschnitt(warteschlange);
  const log = lies(path.join(REPO, 'wiki', 'log.md'));
  const logzeile = nachtLogzeile(log);
  const n = abschnitt(() => nacht(status));
  return {
    kennung: 'pruefstrasse/lagebild/v1',
    stand: new Date().toISOString(),
    warteschlange: ws,
    urteile: abschnitt(urteile),
    register: abschnitt(register),
    ideenAgent: abschnitt(() => ideenAgent(lies(path.join(REPO, 'pruefstrasse', 'ideen-verworfen.md')), ws)),
    nacht: n ? Object.assign(n, { logzeile: logzeile }) : null
  };
}

function schreibAtomar(pfad, inhalt) { fs.writeFileSync(pfad + '.tmp', inhalt, 'utf8'); fs.renameSync(pfad + '.tmp', pfad); }

if (require.main === module) {
  const aus = bauen();
  fs.mkdirSync(AUS, { recursive: true });
  const ziel = path.join(AUS, 'pruefstrasse.json');
  schreibAtomar(ziel, JSON.stringify(aus, null, 1));
  const leer = Object.keys(aus).filter((k) => aus[k] === null);
  console.log('pruefstrasse.json geschrieben: ' + ziel + ' (' + (aus.urteile || []).length + ' Urteile, ' +
    (aus.warteschlange || []).length + ' in der Warteschlange' + (leer.length ? '; null: ' + leer.join(', ') : '') + ')');
}
module.exports = { bauen, nacht, besteZeile, ideenAgent, nachtLogzeile, NACHT_RE };
