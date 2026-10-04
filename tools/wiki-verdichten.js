'use strict';
/* ================= WIKI VERDICHTEN (Auftrag Nr. 84, 04.10.2026) =================
 *
 * WOFUER. wiki/offene-auftraege.md war auf rund 137 KB gewachsen, weil jede erledigte
 * Zeile ihren ganzen Abnahmebericht trug. Dieses Werkzeug nimmt die erledigten Zeilen
 * heraus, ohne dass etwas verloren geht und ohne dass sich eine Zahl aendert.
 *
 * DIE QUELLE IST IMMER DAS ARCHIV, nie die Seite. Nach `bauen` steht auf der Seite nur
 * noch der Rest; das Archiv (wiki/archiv/offene-auftraege-bis-2026-10-04.md) ist die
 * byte-gleiche Kopie des Ausgangsstands und wird gegen START_SHA gehalten. Dadurch ist
 * jeder Lauf wiederholbar und baut dasselbe.
 *
 * WELCHE Zeilen gehen und welche bleiben, hat der PM entschieden (Auftrag §1). Das
 * Werkzeug stuft nichts ein - es haelt die Liste nur gegen die Statuszeichen der Seite.
 *
 * VON HAND geschrieben sind allein die Eintraege in tools/wiki-verdichten-eintraege.json
 * (je Nummer datum, ergebnis, fundstelle). Titel, Vermerke des PM und »Archiv Nr. N«
 * setzt das Werkzeug selbst; jede Ziffernfolge eines Eintrags muss in der alten Zeile
 * genau so vorkommen, sonst wird nichts geschrieben.
 *
 * Aufruf aus der Repo-Wurzel:
 *     node tools/wiki-verdichten.js archiv              Kopie anlegen (nur wenn sie fehlt), Pruefsummen
 *     node tools/wiki-verdichten.js zerlegen <ordner>   die 69 Zeilen umbrochen in Lesedateien
 *     node tools/wiki-verdichten.js festwerte <datei>   Festwerte gegen die Auftragsdatei halten
 *     node tools/wiki-verdichten.js pruefen [datei]     im Speicher bauen, alles pruefen, nichts schreiben
 *                                                       (mit [datei]: Gegenprobe an einer verfaelschten Kopie der Eintraege)
 *     node tools/wiki-verdichten.js bauen               wie pruefen; schreibt NUR, wenn alles besteht
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const WURZEL = path.join(__dirname, '..');
const DATEI = {
  seite: 'wiki/offene-auftraege.md',
  archiv: 'wiki/archiv/offene-auftraege-bis-2026-10-04.md',
  erledigt: 'wiki/erledigt.md',
  index: 'wiki/index.md',
  eintraege: 'tools/wiki-verdichten-eintraege.json',
  skript: 'tools/wiki-verdichten.js'
};
const EIGENE = [DATEI.seite, DATEI.archiv, 'wiki/archiv/', DATEI.erledigt, DATEI.index, DATEI.eintraege, DATEI.skript];

/* Der Ausgangsstand: SHA-256 und Groesse der Seite, wie sie am 04.10.2026 12:14 auf der
 * Platte lag (zugleich der Stand in Commit f51f61e). */
const START_SHA = '21ef8f1e92b43e4b77033ddea4bffadac88c98d944ed699d20ec014ba269d4fd';
const START_BYTES = 138123;

function bereich(a, b) { const r = []; for (let i = a; i <= b; i++) r.push(i); return r; }

/* ---------- Festwerte aus dem Auftrag (§0, §1, §2) ---------- */

const REIHENFOLGE_ALT = [...bereich(1, 4), ...bereich(23, 84), ...bereich(5, 8), ...bereich(10, 22), 9];
const ZEICHEN_SOLL = { '✅': 57, '🟢': 9, '🔵': 11, '🟡': 5, '🟠': 1, '🔴': 1 };
const VERSCHIEBEN = [1, 2, 3, 4, 5, 6, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28,
  30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59,
  60, 61, 62, 63, 64, 65, 66, 67, 68, 70, 71, 73, 74, 75];
const AUSSER_DER_REIHE = [27, 45, 58];
const BLEIBEN = [7, 8, 29, 41, 69, 72, 76, 77, 78, 79, 80, 81, 82, 83, 84];

const VERMERK = {
  4: 'Entscheid zur Live-Menge → Nr. 23',
  16: 'in Nr. 15 erledigt',
  27: 'aufgegangen in Nr. 30',
  34: 'Entscheid 16.09.: das V0-Zielportfolio bleibt liegen, kein Anschluss ans Buch (entscheide.md)',
  39: 'der Ponytail-Block in CLAUDE.md wurde am 04.10.2026 auf Wilhelms Entscheid wieder entfernt (`ce0563d`)',
  45: 'registriert am 19.09.; Datenbau Nr. 47 und Nr. 63, gemessen in Nr. 66',
  58: 'erledigt durch Nr. 64 (Trockenlauf) und Nr. 67 (voller Neubau, Panel v2.2, 03.10.) — die Zeile war nicht nachgeführt',
  59: 'erledigt durch Nr. 60',
  64: 'Regel entschieden: voller Neubau → Nr. 67',
  65: 'Phase 2 → Nr. 68',
  70: 'der eigentliche Fund → Nr. 72',
  71: 'Rest → Nr. 73, dann Nr. 81',
  73: 'Rest → Nr. 77 und Nr. 81',
  75: 'zweiter, unabhängiger Lauf → Nr. 78'
};

const STAND_ALT = 'Stand 04.09.2026 (aufgeräumt).';
const STAND_NEU = 'Stand 04.10.2026 (verdichtet: Erledigtes bis Nr. 75 steht in [erledigt.md](erledigt.md), der volle Wortlaut der alten Zeilen in [archiv/offene-auftraege-bis-2026-10-04.md](archiv/offene-auftraege-bis-2026-10-04.md)).';

const TABELLENKOPF = '| # | Auftrag | Zustand |';
const TABELLENLINIE = '|---|---|---|';
const LAEUFT = '## Läuft / als Nächstes';
const SPAETER = '## Später, auf Wilhelms Zuruf';
const BAUSTELLEN = '## Bekannte Baustellen (klein, unbeauftragt)';

const RESTE_KOPF = '## Reste aus verschobenen Zeilen (Wortlaut der alten Zeilen, vom PM am 04.10.2026 ausgewählt, nicht neu geprüft)';
const RESTE = [
  { nr: 22, zeile: '- **Nr. 22 (Viewer 8c — Zeichenwerkzeuge):** kein Rückgängig (Strg+Z), a11y-Sonde sieht die Leiste nicht, Leisten-Symbole sind Buchstaben (Politur).' },
  { nr: 26, zeile: '- **Nr. 26 (Nachbesserung Live-Sammler + Nachlauf nach der QS):** F26/F29 (soll der Nachlauf die Lebenszeit fortschreiben — Entscheid), F17, F33, F36. *F26/F29 gehört seit 04.10. zu Nr. 72 und Nr. 79.*', zusatz: ' *F26/F29 gehört seit 04.10. zu Nr. 72 und Nr. 79.*' },
  { nr: 30, zeile: '- **Nr. 30 (Live-Sammler ohne Bremse):** Split-Tag roh neben bereinigt (alte Frage 5).' },
  { nr: 31, zeile: '- **Nr. 31 (Trendwende II):** Vorwärtstest ab 2026-09-01, vorab festgenagelt — braucht bei dieser Effektgröße ≈ 133 Handelstage für t = 3.' },
  { nr: 32, zeile: '- **Nr. 32 (Updater fehlt im Paket):** der Auslöser bleibt offen; `origin/paket-qs-updater-2026-09-12` liegt als Zweig auf GitHub — der Commit ist auf main, Zweig kann weg.', teilen: true },
  { nr: 46, zeile: '- **Nr. 46 (Server R620):** Nachtkopie (Wilhelm), Entwurf Teil 4 (nur Entwurf).' }
];

const ERLEDIGT_KOPF = '## Aus der Auftragsliste verschoben am 04.10.2026 (Nr. 1 bis 75)';
const ERLEDIGT_SATZ = 'Voller Wortlaut jeder Zeile: [archiv/offene-auftraege-bis-2026-10-04.md](archiv/offene-auftraege-bis-2026-10-04.md).';
const ERLEDIGT_SPALTEN = '| Datum | Auftrag | Ergebnis in einem Satz | Fundstelle |';
const ERLEDIGT_LINIE = '|---|---|---|---|';

const INDEX_ALT = '| [offene-auftraege.md](offene-auftraege.md) | Was gerade ansteht, in Reihenfolge |';
const INDEX_ZUSATZ = ' — erledigte Zeilen bis 04.10.2026 im Wortlaut: [archiv/offene-auftraege-bis-2026-10-04.md](archiv/offene-auftraege-bis-2026-10-04.md)';
const INDEX_NEU = INDEX_ALT.slice(0, -2) + INDEX_ZUSATZ + ' |';

/* ---------- Kleinzeug ---------- */

function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }
function pfad(rel) { return path.join(WURZEL, rel); }
function lies(rel) { return fs.readFileSync(pfad(rel)); }
function git(args) { return execFileSync('git', args, { cwd: WURZEL, maxBuffer: 64 * 1024 * 1024 }); }
function gleich(a, b) { return a.length === b.length && a.every((x, i) => x === b[i]); }
function anzahl(text, stueck) { return text.split(stueck).length - 1; }

function Pruefliste() {
  const liste = [];
  return {
    setze(name, ok, einzelheiten) { liste.push({ name, ok: !!ok, einzelheiten: einzelheiten || '' }); return !!ok; },
    alleOk() { return liste.every((p) => p.ok); },
    drucke() {
      for (const p of liste) {
        console.log((p.ok ? '[bestanden] ' : '[NICHT BESTANDEN] ') + p.name + (p.einzelheiten ? ' — ' + p.einzelheiten : ''));
      }
    }
  };
}

/* ---------- Die Seite zerlegen: Kopf, Tabellenzeilen, Rest ---------- */

const ZEILE_RE = /^\| (\d+) \| (\*\*(.+?)\*\*.*?) \| ((✅|🟢|🔵|🟡|🟠|🔴).*) \|$/u;

function parseZeile(roh) {
  const m = ZEILE_RE.exec(roh);
  if (!m) throw new Error('Tabellenzeile nicht lesbar: ' + roh.slice(0, 70));
  const fett = /\*\*(.+?)\*\*/.exec(m[4]);
  return { nr: Number(m[1]), roh, titel: m[3], zustand: m[4], zeichen: m[5], statusFett: fett ? fett[1] : '' };
}

function zerlege(text) {
  if (text.includes('\r')) throw new Error('Zeilenenden: CR gefunden, die Seite hatte LF');
  if (!text.endsWith('\n')) throw new Error('Die Seite endet nicht mit einem Zeilenumbruch');
  const zeilen = text.slice(0, -1).split('\n');
  const k = zeilen.indexOf(TABELLENKOPF);
  if (k < 0 || zeilen.indexOf(TABELLENKOPF, k + 1) >= 0) throw new Error('Tabellenkopf nicht genau einmal gefunden');
  if (zeilen[k + 1] !== TABELLENLINIE) throw new Error('Trennzeile der Tabelle fehlt');
  let e = k + 2;
  while (e < zeilen.length && zeilen[e].startsWith('|')) e++;
  return { kopf: zeilen.slice(0, k), tabelle: zeilen.slice(k + 2, e).map(parseZeile), rest: zeilen.slice(e) };
}

/* ---------- Pruefung der Zahlen: jede Ziffernfolge muss in der alten Zeile genau so stehen ----------
 * Eine Ziffernfolge sind Ziffern, auch mit Punkt oder Komma dazwischen; ein Vorzeichen
 * unmittelbar davor (+, -, das echte Minus, der Halbgeviertstrich) gehoert dazu. Ein Treffer
 * in der alten Zeile zaehlt nur, wenn er dort nicht Teil einer laengeren Zahl ist und nicht
 * selbst ein Vorzeichen traegt, das im Eintrag fehlt - sonst waere aus »−0,02« unbemerkt
 * »0,02« geworden. */

const ZAHL_RE = /[+\-−–]?\d+(?:[.,]\d+)*/g;

function zahlKommtVor(alt, t) {
  const mitZiffer = /^\d/.test(t);
  let i = alt.indexOf(t);
  while (i >= 0) {
    const davor = alt.slice(Math.max(0, i - 2), i);
    const danach = alt.slice(i + t.length, i + t.length + 2);
    const davorOk = !mitZiffer || !(/[\d+\-−–]$/.test(davor) || /\d[.,]$/.test(davor));
    const danachOk = !(/^\d/.test(danach) || /^[.,]\d/.test(danach));
    if (davorOk && danachOk) return true;
    i = alt.indexOf(t, i + 1);
  }
  return false;
}

const HASH_RE = /(?<![0-9a-z])[0-9a-f]{7,40}(?![0-9a-z])/g;
function istHash(s) { return /^[0-9a-f]{7,40}$/.test(s) && /\d/.test(s) && /[a-f]/.test(s); }
function hashKommtVor(alt, h) { return new RegExp('(?<![0-9a-z])' + h + '(?![0-9a-z])').test(alt); }

/* Hoechstens zwei Saetze: Satzgrenze ist Punkt, Ausrufe- oder Fragezeichen, danach Leerraum
 * und ein Grossbuchstabe - ausser nach einer Ziffer (Datum, Ordnungszahl) und nach den
 * ueblichen Kuerzeln. Eine Faustregel, die eher zu streng zaehlt als zu milde. */
function saetze(s) {
  const ohneKuerzel = s.replace(/\b(Nr|Abs|bzw|ca|inkl|Mio|Mrd|St|vgl|usw|ggf|z|B|u|a|d|h)\.(?=\s)/g, (m) => m.slice(0, -1) + ' ');
  return (ohneKuerzel.match(/(?<!\d)[.!?][)“«"]?\s+(?=[A-ZÄÖÜ„»])/g) || []).length + 1;
}

function pruefeEintrag(z, e) {
  const fehler = [];
  const hinweise = [];
  for (const feld of ['datum', 'ergebnis', 'fundstelle']) {
    if (typeof e[feld] !== 'string') { fehler.push(feld + ' fehlt'); return { fehler, hinweise }; }
    if (e[feld] !== e[feld].trim() || /[|\r\n\t]/.test(e[feld])) fehler.push(feld + ': Rand-Leerraum, senkrechter Strich oder Umbruch');
  }

  if (z.nr === 58) {
    if (e.datum !== '03.10.') fehler.push('Datum muss für Nr. 58 »03.10.« sein');
  } else if (e.datum === '—') {
    if (/\d\d\.\d\d\./.test(z.statusFett)) hinweise.push('Datum »—«, obwohl das Statuswort einen Tag nennt');
  } else if (!/^\d\d\.\d\d\.$/.test(e.datum)) {
    fehler.push('Datum nicht in der Form TT.MM.');
  } else if (!new RegExp('(?<!\\d)' + e.datum.split('.').join('\\.')).test(z.roh)) {
    fehler.push('Datum ' + e.datum + ' steht nicht in der alten Zeile');
  } else if (!z.statusFett.includes(e.datum)) {
    hinweise.push('Datum ' + e.datum + ' steht nicht im ersten fetten Statuswort');
  }

  const laenge = [...e.ergebnis].length;
  if (!laenge) fehler.push('Ergebnis leer');
  if (laenge > 400) fehler.push('Ergebnis hat ' + laenge + ' Zeichen (höchstens 400)');
  if (saetze(e.ergebnis) > 2) fehler.push('Ergebnis hat mehr als zwei Sätze');
  for (const t of e.ergebnis.match(ZAHL_RE) || []) {
    if (!zahlKommtVor(z.roh, t)) fehler.push('Ergebnis: Ziffernfolge »' + t + '« steht so nicht in der alten Zeile');
  }

  let rest = e.fundstelle;
  for (const s of rest.match(/`[^`]*`/g) || []) {
    const inhalt = s.slice(1, -1);
    if (istHash(inhalt)) {
      if (!hashKommtVor(z.roh, inhalt)) fehler.push('Fundstelle: Hash ' + inhalt + ' steht nicht in der alten Zeile');
    } else if (!z.roh.includes(inhalt)) {
      fehler.push('Fundstelle: ' + s + ' steht nicht in der alten Zeile');
    }
  }
  rest = rest.replace(/`[^`]*`/g, () => ' ');
  for (const h of (rest.match(HASH_RE) || []).filter(istHash)) {
    if (!hashKommtVor(z.roh, h)) fehler.push('Fundstelle: Hash ' + h + ' steht nicht in der alten Zeile');
  }
  rest = rest.replace(HASH_RE, (h) => (istHash(h) ? ' ' : h));
  for (const t of rest.match(ZAHL_RE) || []) {
    if (!zahlKommtVor(z.roh, t)) fehler.push('Fundstelle: Ziffernfolge »' + t + '« steht so nicht in der alten Zeile');
  }
  if (!z.roh.includes('**' + z.titel + '**') || z.titel.includes('|')) fehler.push('Titel nicht wörtlich übernehmbar');
  return { fehler, hinweise };
}

function eintragsZeile(z, e) {
  const vermerk = e.ohneVermerk ? '' : (VERMERK[z.nr] || '');
  const fund = [vermerk, e.fundstelle, 'Archiv Nr. ' + z.nr].filter(Boolean).join(' · ');
  return '| ' + [e.datum, 'Nr. ' + z.nr + ' — ' + z.titel, e.ergebnis, fund].join(' | ') + ' |';
}

/* ---------- Schritt 1: die byte-gleiche Kopie ---------- */

function schrittArchiv() {
  if (!fs.existsSync(pfad(DATEI.archiv))) {
    fs.mkdirSync(path.dirname(pfad(DATEI.archiv)), { recursive: true });
    fs.copyFileSync(pfad(DATEI.seite), pfad(DATEI.archiv), fs.constants.COPYFILE_EXCL);
    console.log('Archiv angelegt (kopiert, nicht neu geschrieben).');
  } else {
    console.log('Archiv liegt schon vor - nichts kopiert.');
  }
  const a = lies(DATEI.archiv);
  console.log('SHA-256 Archiv:  ' + sha256(a) + ' (' + a.length + ' Bytes)');
  console.log('SHA-256 Seite:   ' + sha256(lies(DATEI.seite)));
  console.log('SHA-256 in HEAD: ' + sha256(git(['show', 'HEAD:' + DATEI.seite])));
  console.log('Startwert:       ' + START_SHA);
  return sha256(a) === START_SHA;
}

/* ---------- Schritt 2: Inventur (§0) ---------- */

function ladeArchiv(pr) {
  const buf = lies(DATEI.archiv);
  const sha = sha256(buf);
  pr.setze('Archiv ist byte-gleich mit dem Ausgangsstand', sha === START_SHA && buf.length === START_BYTES,
    'SHA-256 ' + sha + ', ' + buf.length + ' Bytes');
  const text = buf.toString('utf8');
  pr.setze('Archiv ist verlustfrei als UTF-8 lesbar', Buffer.from(text, 'utf8').equals(buf));
  const alt = zerlege(text);
  alt.text = text;
  alt.nachNr = new Map(alt.tabelle.map((z) => [z.nr, z]));
  return alt;
}

function inventur(alt, pr) {
  const nummern = alt.tabelle.map((z) => z.nr);
  pr.setze('Inventur: 84 Tabellenzeilen in der Reihenfolge 1–4, 23–84, 5–8, 10–22, 9, jede Nummer genau einmal',
    gleich(nummern, REIHENFOLGE_ALT) && new Set(nummern).size === 84, nummern.length + ' Zeilen');
  const zaehlung = {};
  for (const z of alt.tabelle) zaehlung[z.zeichen] = (zaehlung[z.zeichen] || 0) + 1;
  const zeichenText = Object.keys(ZEICHEN_SOLL).map((k) => k + ' ' + (zaehlung[k] || 0)).join(', ');
  pr.setze('Inventur: Statuszeichen wie vom PM gezählt',
    Object.keys(ZEICHEN_SOLL).every((k) => zaehlung[k] === ZEICHEN_SOLL[k]) && Object.keys(zaehlung).length === 6, zeichenText);
  const erledigtNachZeichen = alt.tabelle.filter((z) => z.zeichen === '✅' || z.zeichen === '🟢').map((z) => z.nr);
  const soll = [...erledigtNachZeichen, ...AUSSER_DER_REIHE].sort((a, b) => a - b);
  pr.setze('Verschiebeliste des PM = alle ✅/🟢 (66) und dazu 27, 45, 58; die übrigen 15 bleiben',
    erledigtNachZeichen.length === 66 && gleich(soll, VERSCHIEBEN) && VERSCHIEBEN.length === 69 &&
    gleich(bereich(1, 84).filter((n) => !VERSCHIEBEN.includes(n)), BLEIBEN),
    VERSCHIEBEN.length + ' verschieben, ' + BLEIBEN.length + ' bleiben');
  pr.setze('Aufbau: Kopf mit genau einem Stand-Vermerk, danach genau die zwei Aufzählungs-Abschnitte',
    anzahl(alt.text, STAND_ALT) === 1 && anzahl(alt.kopf.join('\n'), STAND_ALT) === 1 &&
    alt.kopf.includes(LAEUFT) && alt.rest[0] === '' && alt.rest[1] === SPAETER &&
    gleich(alt.rest.filter((z) => z.startsWith('## ')), [SPAETER, BAUSTELLEN]),
    'Kopf ' + alt.kopf.length + ' Zeilen, Rest ' + alt.rest.length + ' Zeilen, Tabelle ' +
    alt.tabelle.reduce((s, z) => s + [...z.roh].length, 0) + ' Zeichen');
}

/* ---------- Lesedateien: die zu verschiebenden Zeilen, umbrochen, nur zum Lesen ---------- */

function umbrich(text, breite) {
  const aus = [];
  let akt = '';
  for (const wort of text.split(' ')) {
    if (akt && akt.length + 1 + wort.length > breite) { aus.push(akt); akt = wort; } else akt = akt ? akt + ' ' + wort : wort;
  }
  if (akt) aus.push(akt);
  return aus;
}

function lesefassung(z) {
  const hashes = [...new Set(z.roh.match(HASH_RE) || [])].filter(istHash);
  return [
    '######## Nr. ' + z.nr + ' · ' + z.roh.length + ' Zeichen · ' + z.zeichen + (VERMERK[z.nr] ? ' · PM-Vermerk: ' + VERMERK[z.nr] : '') + ' ########',
    'TITEL: ' + z.titel,
    'STATUSWORT (erstes Fettes im Zustand): ' + z.statusFett,
    'HASH-KANDIDATEN: ' + (hashes.join(' ') || '—'),
    '--------',
    ...umbrich(z.roh, 170),
    ''
  ].join('\n');
}

function schrittZerlegen(ordner) {
  const pr = Pruefliste();
  const alt = ladeArchiv(pr);
  inventur(alt, pr);
  pr.drucke();
  if (!pr.alleOk()) return false;
  fs.mkdirSync(ordner, { recursive: true });
  const stapel = [];
  let akt = [];
  let summe = 0;
  for (const nr of VERSCHIEBEN) {
    const z = alt.nachNr.get(nr);
    if (akt.length && (akt.length >= 10 || summe + z.roh.length > 16000)) { stapel.push(akt); akt = []; summe = 0; }
    akt.push(z);
    summe += z.roh.length;
  }
  if (akt.length) stapel.push(akt);
  stapel.forEach((st, i) => {
    const name = 'zeilen-' + String(i + 1).padStart(2, '0') + '.txt';
    const text = st.map(lesefassung).join('\n');
    fs.writeFileSync(path.join(ordner, name), text, 'utf8');
    console.log(name + ': Nr. ' + st.map((z) => z.nr).join(', ') + ' (' + text.length + ' Zeichen, ' + text.split('\n').length + ' Zeilen)');
  });
  return true;
}

/* ---------- Festwerte gegen die Auftragsdatei halten (gegen Abschreibfehler) ---------- */

function schrittFestwerte(datei) {
  const roh = fs.readFileSync(datei, 'utf8');
  const zeilen = roh.split(/\r?\n/);
  const glatt = roh.replace(/\s+/g, () => ' ');
  const fehlt = [];
  for (const nr of Object.keys(VERMERK)) {
    const stueck = 'Nr. ' + nr + ' „' + VERMERK[nr];
    const i = glatt.indexOf(stueck);
    if (i < 0 || !/["“”]/.test(glatt[i + stueck.length])) fehlt.push('Vermerk Nr. ' + nr);
  }
  if (Object.keys(VERMERK).length !== 14) fehlt.push('Zahl der Vermerke');
  if (!zeilen.includes('  ' + RESTE_KOPF)) fehlt.push('Kopf des Reste-Abschnitts');
  for (const r of RESTE) if (!zeilen.includes('  ' + r.zeile)) fehlt.push('Rest Nr. ' + r.nr);
  if (!glatt.includes('Das sind: ' + VERSCHIEBEN.join(', ') + '.')) fehlt.push('Verschiebeliste');
  if (!glatt.includes('in der Reihenfolge ihrer Nummern:** ' + BLEIBEN.join(', ') + '.')) fehlt.push('Bleibeliste');
  for (const [name, wert] of [['Stand alt', STAND_ALT], ['Stand neu', STAND_NEU], ['Index-Zeile', INDEX_ALT], ['Index-Zusatz', INDEX_ZUSATZ]]) {
    if (!glatt.includes('`' + wert + '`')) fehlt.push(name);
  }
  for (const [name, wert] of [['Kopf des Abschnitts in erledigt.md', ERLEDIGT_KOPF], ['Satz unter dem Kopf', ERLEDIGT_SATZ]]) {
    if (!glatt.includes('„' + wert)) fehlt.push(name);
  }
  if (!glatt.includes('`' + ERLEDIGT_SPALTEN.slice(2, -2) + '`')) fehlt.push('Spalten der Tabelle');
  console.log(fehlt.length ? '[NICHT BESTANDEN] Festwerte weichen vom Auftrag ab: ' + fehlt.join('; ')
    : '[bestanden] Festwerte stehen wörtlich im Auftrag (14 Vermerke, 6 Reste samt Kopf, beide Nummernlisten, Stand, Index, Abschnitt)');
  return !fehlt.length;
}

/* ---------- Schritt 3 und 4: bauen und pruefen ---------- */

function baueUndPruefe(pr, eintraegeDatei) {
  const alt = ladeArchiv(pr);
  inventur(alt, pr);

  /* --- die neue Seite --- */
  const kopfNeu = alt.kopf.join('\n').split(STAND_ALT).join(STAND_NEU).split('\n');
  const resteBlock = ['', RESTE_KOPF, '', ...RESTE.map((r) => r.zeile)];
  const seiteNeu = [...kopfNeu, TABELLENKOPF, TABELLENLINIE, ...BLEIBEN.map((nr) => alt.nachNr.get(nr).roh),
    ...resteBlock, ...alt.rest].join('\n') + '\n';
  const neu = zerlege(seiteNeu);

  pr.setze('Die 15 Bleibe-Zeilen sind zeichengleich mit ihrer Fassung im Archiv, in der Reihenfolge ihrer Nummern',
    neu.tabelle.length === 15 && neu.tabelle.every((z, i) => z.nr === BLEIBEN[i] && z.roh === alt.nachNr.get(z.nr).roh));
  const schwanz = (zeilen) => zeilen.slice(zeilen.indexOf(SPAETER)).join('\n');
  pr.setze('Die beiden Aufzählungs-Abschnitte sind zeichengleich mit dem Archiv',
    neu.rest.indexOf(SPAETER) > 0 && schwanz(neu.rest) === schwanz(alt.rest) && schwanz(alt.rest) === alt.rest.slice(1).join('\n'),
    [...schwanz(alt.rest)].length + ' Zeichen');
  const abweichend = alt.kopf.map((z, i) => i).filter((i) => alt.kopf[i] !== neu.kopf[i]);
  const ab = alt.kopf.indexOf(LAEUFT);
  pr.setze('Kopf unverändert bis auf die eine Ersetzung des Stand-Vermerks; Erklärtext zeichengleich',
    alt.kopf.length === neu.kopf.length && abweichend.length === 1 && abweichend[0] < ab &&
    alt.kopf[abweichend[0]].split(STAND_ALT).join(STAND_NEU) === neu.kopf[abweichend[0]] &&
    anzahl(seiteNeu, STAND_NEU) === 1 && anzahl(seiteNeu, STAND_ALT) === 0 &&
    alt.kopf.slice(ab).join('\n') === neu.kopf.slice(ab).join('\n'),
    'geänderte Kopfzeile: ' + abweichend.map((i) => i + 1).join(', '));
  pr.setze('Abschnitt »Reste aus verschobenen Zeilen« steht wörtlich zwischen Tabelle und »Später, auf Wilhelms Zuruf«',
    gleich(neu.rest.slice(0, neu.rest.indexOf(SPAETER)), [...resteBlock, '']));

  /* --- die sechs Reste gegen die Archiv-Zeile ihrer Nummer --- */
  const resteFehler = [];
  for (const r of RESTE) {
    let text = r.zeile.replace(/^- \*\*Nr\. \d+ \([^)]*\):\*\* /, () => '');
    if (text === r.zeile) resteFehler.push('Nr. ' + r.nr + ': Kopf nicht erkannt');
    if (r.zusatz) text = text.split(r.zusatz).join('');
    const teile = r.teilen ? text.split('; ').flatMap((t) => t.split(' — ')) : [text];
    for (const t of teile) {
      if (alt.nachNr.get(r.nr).roh.includes(t)) continue;
      const ohnePunkt = t.endsWith('.') && alt.nachNr.get(r.nr).roh.includes(t.slice(0, -1));
      resteFehler.push('Nr. ' + r.nr + ' »' + t + '«' + (ohnePunkt ? ' (ohne den Schlusspunkt steht es dort)' : ''));
    }
  }
  pr.setze('Jeder der sechs Reste steht wörtlich in der Archiv-Zeile seiner Nummer', !resteFehler.length, resteFehler.join('; '));

  /* --- der Abschnitt fuer erledigt.md --- */
  let eintraege = {};
  const quelle = eintraegeDatei || pfad(DATEI.eintraege);
  if (fs.existsSync(quelle)) eintraege = JSON.parse(fs.readFileSync(quelle, 'utf8'));
  const fehlend = VERSCHIEBEN.filter((nr) => !eintraege[nr]);
  const fremd = Object.keys(eintraege).filter((k) => !VERSCHIEBEN.includes(Number(k)));
  pr.setze('Einträge: für jede der 69 Nummern genau einer, keiner darüber hinaus', !fehlend.length && !fremd.length,
    (fehlend.length ? 'es fehlen Nr. ' + fehlend.join(', ') : '') + (fremd.length ? ' überzählig: ' + fremd.join(', ') : ''));
  const zeilenNeu = [];
  const fehler = [];
  const hinweise = [];
  const ohneVermerk = [];
  for (const nr of VERSCHIEBEN) {
    const e = eintraege[nr];
    if (!e) continue;
    const z = alt.nachNr.get(nr);
    const p = pruefeEintrag(z, e);
    for (const f of p.fehler) fehler.push('Nr. ' + nr + ': ' + f);
    for (const h of p.hinweise) hinweise.push('Nr. ' + nr + ': ' + h);
    if (e.ohneVermerk) ohneVermerk.push('Nr. ' + nr + ': ' + e.ohneVermerk);
    if (e.ohneVermerk && !VERMERK[nr]) fehler.push('Nr. ' + nr + ': ohneVermerk gesetzt, aber es gibt keinen Vermerk');
    const zeile = p.fehler.length ? '' : eintragsZeile(z, e);
    if (zeile && anzahl(zeile, '|') !== 5) fehler.push('Nr. ' + nr + ': senkrechter Strich in einer Zelle');
    zeilenNeu.push(zeile);
  }
  pr.setze('Einträge: Datum, Titel, Commit-Hashes, Fundstellen und jede Ziffernfolge stehen genau so in der alten Zeile; Ergebnis höchstens zwei Sätze und 400 Zeichen',
    !fehler.length, fehler.join('\n    '));

  const erledigtPlatte = lies(DATEI.erledigt).toString('utf8');
  const schnitt = (t) => { const i = t.indexOf('\n' + ERLEDIGT_KOPF + '\n'); return i < 0 ? t : t.slice(0, i); };
  const basis = schnitt(erledigtPlatte);
  const abschnitt = ['', ERLEDIGT_KOPF, '', ERLEDIGT_SATZ, '', ERLEDIGT_SPALTEN, ERLEDIGT_LINIE, ...zeilenNeu].join('\n') + '\n';
  const erledigtNeu = basis + abschnitt;
  const erledigtHead = git(['show', 'HEAD:' + DATEI.erledigt]).toString('utf8');
  pr.setze('erledigt.md: alles Bestehende bleibt zeichengleich (gegen HEAD), der neue Abschnitt steht am Ende',
    basis === schnitt(erledigtHead) && basis.endsWith('|\n') && !basis.includes('\r') && erledigtNeu.startsWith(basis) &&
    anzahl(erledigtNeu, ERLEDIGT_KOPF) === 1, Buffer.byteLength(basis) + ' Bytes Bestand');

  /* --- jede Nummer genau einmal --- */
  const imAbschnitt = abschnitt.split('\n').map((z) => /^\| (?:\d\d\.\d\d\.|—) \| Nr\. (\d+) — /.exec(z)).filter(Boolean).map((m) => Number(m[1]));
  const alle = [...neu.tabelle.map((z) => z.nr), ...imAbschnitt];
  pr.setze('Jede Nummer von 1 bis 84 steht genau einmal: 15 als Tabellenzeile der Seite + 69 als »Nr. N —« im neuen Abschnitt, nach Nummer sortiert',
    gleich(imAbschnitt, VERSCHIEBEN) && neu.tabelle.length === 15 && alle.length === 84 &&
    bereich(1, 84).every((n) => alle.filter((x) => x === n).length === 1),
    neu.tabelle.length + ' + ' + imAbschnitt.length + ' = ' + alle.length);

  /* --- index.md --- */
  const indexPlatte = lies(DATEI.index).toString('utf8');
  const ersetze = (t) => t.split('\n').map((z) => (z === INDEX_ALT ? INDEX_NEU : z)).join('\n');
  const indexNeu = ersetze(indexPlatte);
  const indexHead = git(['show', 'HEAD:' + DATEI.index]).toString('utf8');
  pr.setze('index.md: genau eine Zeile bekommt den Zusatz, sonst nichts (gegen HEAD)',
    indexNeu.split('\n').filter((z) => z === INDEX_NEU).length === 1 && !indexNeu.split('\n').includes(INDEX_ALT) &&
    indexNeu === ersetze(indexHead) && !indexNeu.includes('\r'));

  /* --- hat jemand anderes die Seite angefasst? --- */
  const neuSha = sha256(Buffer.from(seiteNeu, 'utf8'));
  const lage = (sha) => (sha === START_SHA ? 'Ausgangsstand' : sha === neuSha ? 'neue Seite' : 'FREMDE ÄNDERUNG');
  const lagePlatte = lage(sha256(lies(DATEI.seite)));
  const lageHead = lage(sha256(git(['show', 'HEAD:' + DATEI.seite])));
  pr.setze('Die Seite wurde seit der Kopie von niemand anderem geändert (Platte und HEAD gegen den Startwert)',
    lagePlatte !== 'FREMDE ÄNDERUNG' && lageHead !== 'FREMDE ÄNDERUNG', 'Platte: ' + lagePlatte + ', HEAD: ' + lageHead);

  return {
    seiteNeu, erledigtNeu, indexNeu, hinweise, ohneVermerk,
    groesse: 'offene-auftraege.md: ' + START_BYTES + ' → ' + Buffer.byteLength(seiteNeu) + ' Bytes; Tabellenzeilen ' +
      alt.tabelle.length + ' → ' + neu.tabelle.length + '; erledigt.md: ' + Buffer.byteLength(basis) + ' → ' + Buffer.byteLength(erledigtNeu) + ' Bytes'
  };
}

/* Gegenprobe: `pruefen <andere-eintraege.json>` haelt eine absichtlich verfaelschte Kopie der
 * Eintraege gegen dieselben Pruefungen - sie muss durchfallen. `bauen` nimmt nie eine andere Datei. */
function schrittBauen(schreiben, andereEintraege) {
  const pr = Pruefliste();
  const bau = baueUndPruefe(pr, schreiben ? null : andereEintraege);
  pr.drucke();
  console.log('[Größe] ' + bau.groesse);
  if (bau.hinweise.length) console.log('[Hinweise, kein Fehler]\n    ' + bau.hinweise.join('\n    '));
  if (bau.ohneVermerk.length) console.log('[Vermerk weggelassen]\n    ' + bau.ohneVermerk.join('\n    '));
  const status = git(['status', '--porcelain']).toString('utf8').split('\n').filter(Boolean);
  console.log('[git status] eigene: ' + (status.filter((s) => EIGENE.includes(s.slice(3))).join(', ') || '—') +
    ' · fremde: ' + (status.filter((s) => !EIGENE.includes(s.slice(3))).join(', ') || '—'));
  if (!pr.alleOk()) { console.log(schreiben ? 'NICHTS GESCHRIEBEN - mindestens eine Prüfung besteht nicht.' : 'Mindestens eine Prüfung besteht nicht.'); return false; }
  if (!schreiben) { console.log('Alle Prüfungen bestanden (nichts geschrieben).'); return true; }
  fs.writeFileSync(pfad(DATEI.seite), bau.seiteNeu, 'utf8');
  fs.writeFileSync(pfad(DATEI.erledigt), bau.erledigtNeu, 'utf8');
  fs.writeFileSync(pfad(DATEI.index), bau.indexNeu, 'utf8');
  const zurueck = lies(DATEI.seite).toString('utf8') === bau.seiteNeu && lies(DATEI.erledigt).toString('utf8') === bau.erledigtNeu &&
    lies(DATEI.index).toString('utf8') === bau.indexNeu && sha256(lies(DATEI.archiv)) === START_SHA;
  console.log(zurueck ? '[bestanden] Geschrieben und von der Platte zurückgelesen: drei Seiten wie gebaut, Archiv unberührt.'
    : '[NICHT BESTANDEN] Die Platte weicht vom Gebauten ab.');
  return zurueck;
}

function main() {
  const [modus, arg] = process.argv.slice(2);
  let ok = false;
  if (modus === 'archiv') ok = schrittArchiv();
  else if (modus === 'zerlegen') ok = schrittZerlegen(arg || path.join(os.tmpdir(), 'wiki-verdichten-zeilen'));
  else if (modus === 'festwerte' && arg) ok = schrittFestwerte(arg);
  else if (modus === 'pruefen') ok = schrittBauen(false, arg);
  else if (modus === 'bauen') ok = schrittBauen(true);
  else console.log('Aufruf: node tools/wiki-verdichten.js archiv | zerlegen <ordner> | festwerte <auftragsdatei> | pruefen | bauen');
  process.exitCode = ok ? 0 : 1;
}

main();
