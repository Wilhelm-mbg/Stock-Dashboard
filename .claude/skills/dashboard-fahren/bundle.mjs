/* Baut aus der App und einer Abruf-Aufzeichnung eine bedienbare Einzeldatei.
 *
 * Zweck: das Dashboard herzeigen, wo Electron nicht laeuft und kein Netz erlaubt
 * ist – etwa als Artifact-Seite. Die Oberflaeche bleibt vollstaendig bedienbar,
 * die Kurse stehen auf dem Stand der Aufzeichnung.
 *
 * Aufruf:  node .claude/skills/dashboard-fahren/bundle.mjs schnappschuss.json ausgabe.html [--seite]
 *
 * --seite  schreibt ein vollstaendiges HTML-Dokument. Ohne die Angabe entsteht ein
 *          Rumpf ohne <html>/<head>/<body> – so verlangt es der Artifact-Dienst,
 *          der die Datei in sein eigenes Geruest einhaengt.
 */
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as zlib from 'node:zlib';
import { apiShim } from './api-shim.mjs';

const WURZEL = path.resolve(import.meta.dirname, '../../..');
const [quelleArg, zielArg, ...rest] = process.argv.slice(2);
const QUELLE = path.resolve(quelleArg || path.join(WURZEL, 'schnappschuss.json'));
const ZIEL = path.resolve(zielArg || path.join(WURZEL, 'dashboard-einzeldatei.html'));
const GANZE_SEITE = rest.includes('--seite');
const wert = (name, standard) => {
  const t = rest.find((r) => r.startsWith(name + '='));
  return t ? Number(t.slice(name.length + 1)) : standard;
};
/* Eine volle Aufzeichnung wiegt einige hundert Megabyte – die Strategien holen
 * Kurshistorie ab 1962 und zwei Jahre Stundenkerzen fuer Dutzende Werte. Fuer eine
 * Vorschau reicht das jeweils juengste Stueck. Wer alles behalten will: --kerzen=0. */
const KERZEN = wert('--kerzen', 500);
const GRENZE = wert('--grenze', 150) * 1024;

if (!fs.existsSync(QUELLE)) {
  console.error('Keine Aufzeichnung unter', QUELLE, '– vorher im Treiber "sichern" aufrufen.');
  process.exit(1);
}

const html = fs.readFileSync(path.join(WURZEL, 'index.html'), 'utf8');

/* Kopf und Rumpf trennen: der Artifact-Dienst haengt die Datei in sein eigenes
 * Geruest, ein zweites <html> waere ein Dokument im Dokument. */
const stil = (html.match(/<style>[\s\S]*?<\/style>/g) || []).join('\n');
const rumpf = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));

/* Die Skripte in der Reihenfolge einsetzen, in der die Seite sie laedt –
 * quant.js definiert Werkzeuge, auf die depot.js beim Laden schon zugreift. */
const skripte = [...rumpf.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
let inhalt = rumpf;
for (const datei of skripte) {
  const quelltext = fs.readFileSync(path.join(WURZEL, datei), 'utf8');
  // Ersetzung als Funktion: sonst deutet String.replace Zeichenfolgen wie $& oder
  // $' im Quelltext als Rueckverweise und blaeht die Datei um ein Vielfaches auf.
  // </script> im Quelltext wuerde den umschliessenden Block vorzeitig beenden.
  const eingebettet = `<script>/* ${datei} */\n${quelltext.replace(/<\/script>/gi, '<\\/script>')}\n</script>`;
  inhalt = inhalt.replace(`<script src="${datei}"></script>`, () => eingebettet);
}

/* Kursreihen auf die letzten KERZEN Punkte stutzen. Die Oberflaeche merkt davon
 * nichts – sie bekommt dieselbe Struktur, nur eine kuerzere Historie. */
function stutze(text) {
  if (!KERZEN) return text;
  let daten;
  try { daten = JSON.parse(text); } catch (e) { return text; }
  const ergebnis = daten && daten.chart && daten.chart.result && daten.chart.result[0];
  if (!ergebnis || !Array.isArray(ergebnis.timestamp) || ergebnis.timestamp.length <= KERZEN) return text;
  const ab = ergebnis.timestamp.length - KERZEN;
  const kuerze = (feld) => { if (Array.isArray(feld)) return feld.slice(ab); return feld; };
  ergebnis.timestamp = ergebnis.timestamp.slice(ab);
  for (const block of (ergebnis.indicators && ergebnis.indicators.quote) || []) {
    for (const k of Object.keys(block)) block[k] = kuerze(block[k]);
  }
  for (const block of (ergebnis.indicators && ergebnis.indicators.adjclose) || []) {
    for (const k of Object.keys(block)) block[k] = kuerze(block[k]);
  }
  return JSON.stringify(daten);
}

const roh = JSON.parse(fs.readFileSync(QUELLE, 'utf8'));
const gestutzt = {};
let verworfen = 0;
for (const [url, antwort] of Object.entries(roh)) {
  const body = antwort && antwort.ok && typeof antwort.body === 'string' ? stutze(antwort.body) : (antwort.body || '');
  if (GRENZE && body.length > GRENZE) { verworfen++; continue; }
  gestutzt[url] = { ok: antwort.ok, status: antwort.status, body: body };
}
const aufzeichnung = Buffer.from(JSON.stringify(gestutzt));
const gepackt = zlib.gzipSync(aufzeichnung, { level: 9 }).toString('base64');
const anzahl = Object.keys(gestutzt).length;
const stand = new Date(fs.statSync(QUELLE).mtime).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' });

const kopf = `
<script id="schnappschuss-daten" type="application/octet-stream">${gepackt}</script>
<script>
/* Aufzeichnung entpacken, bevor die Oberflaeche nach Kursen fragt. */
window.__SNAPSHOT = {};
window.__SNAPSHOT_READY = (async function () {
  try {
    var roh = document.getElementById('schnappschuss-daten').textContent.trim();
    var bytes = Uint8Array.from(atob(roh), function (c) { return c.charCodeAt(0); });
    var strom = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
    window.__SNAPSHOT = JSON.parse(await new Response(strom).text());
  } catch (e) {
    console.error('Schnappschuss nicht lesbar:', e);
  }
})();
(${apiShim.toString()})({ modus: 'schnapp', speicher: 'lokal', version: '8.24.4 (Schnappschuss ${stand})' });

/* Die App entscheidet ueber das Attribut data-theme am Wurzelelement, kennt aber keine
 * Systemvorgabe. Wo niemand ein Thema gesetzt hat – etwa im Artifact-Betrachter mit
 * Einstellung "System" – die Vorliebe des Betrachters uebernehmen. Der Hell/Dunkel-
 * Knopf der App ueberschreibt das anschliessend wie gewohnt. */
(function () {
  var wurzel = document.documentElement;
  if (wurzel.getAttribute('data-theme')) return;
  var dunkel = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  wurzel.setAttribute('data-theme', dunkel ? 'dark' : 'light');
})();

/* Der CSV-Export der Depot-Ansicht haengt an einem Anker mit download-Attribut.
 * Im Artifact-Betrachter laeuft so ein Klick ins Leere; dort fuehrt der Weg ueber
 * die Faehigkeit downloads, die dem Betrachter eine Rueckfrage stellt. Ausserhalb
 * dieses Betrachters bleibt alles beim Alten. */
(function () {
  var urspruenglich = HTMLAnchorElement.prototype.click;
  var band = null;

  function melde(text) {
    if (band) band.remove();
    band = document.createElement('div');
    band.textContent = text;
    band.style.cssText = 'position:fixed; right:12px; bottom:12px; z-index:99999; max-width:340px;' +
      'padding:9px 12px; border-radius:8px; border:1px solid var(--grid,#333);' +
      'background:var(--panel,#1a1a19); color:var(--ink,#fff);' +
      'font:12px/1.5 system-ui,sans-serif; box-shadow:0 6px 24px rgba(0,0,0,.35);';
    document.body.appendChild(band);
    setTimeout(function () { if (band) { band.remove(); band = null; } }, 6000);
  }

  HTMLAnchorElement.prototype.click = function () {
    var name = this.getAttribute('download');
    var ziel = this.href || '';
    var imBetrachter = !!(window.claude && typeof window.claude.use === 'function');
    var eigeneDatei = ziel.indexOf('blob:') === 0 || ziel.indexOf('data:') === 0;
    if (!name || !imBetrachter || !eigeneDatei) return urspruenglich.apply(this, arguments);

    window.claude.use('downloads').then(function (speicher) {
      if (!speicher) { melde('In dieser Ansicht lassen sich keine Dateien speichern.'); return null; }
      return fetch(ziel).then(function (a) { return a.blob(); }).then(function (blob) {
        return speicher.save({ filename: name, data: blob });
      });
    }).catch(function (e) {
      var code = e && e.code;
      if (code === 'declined') return;
      melde(code === 'extension_not_enabled'
        ? 'Dieses Dateiformat ist in der Vorschau nicht freigegeben.'
        : 'Speichern nicht moeglich: ' + ((e && e.message) || 'unbekannter Grund'));
    });
  };
})();
</script>
<style>
  #schnappBand {
    position: fixed; left: 12px; bottom: 12px; z-index: 99999;
    display: flex; align-items: center; gap: 10px;
    max-width: min(560px, calc(100vw - 24px));
    padding: 9px 12px; border: 1px solid var(--grid, #333); border-radius: 8px;
    background: var(--panel, #1a1a19); color: var(--ink-2, #ccc);
    font: 12px/1.5 system-ui, sans-serif; box-shadow: 0 6px 24px rgba(0,0,0,.35);
  }
  #schnappBand b { color: var(--ink, #fff); }
  #schnappBand button {
    flex: none; border: 1px solid var(--grid, #333); border-radius: 6px;
    background: transparent; color: var(--ink-2, #ccc); cursor: pointer;
    padding: 3px 9px; font: inherit;
  }
  #schnappBand button:hover { color: var(--ink, #fff); }
</style>
`;

const band = `
<div id="schnappBand">
  <span><b>Schnappschuss vom ${stand}.</b> Bedienbar, aber ohne Netz: Kurse, Charts und
  Schlagzeilen stehen auf dem Stand der Aufzeichnung (${anzahl} Abrufe). Depot und Einstellungen
  liegen im Browser-Speicher.</span>
  <button type="button" onclick="this.parentNode.remove()">Schliessen</button>
</div>
`;

const seite = GANZE_SEITE
  ? `<!DOCTYPE html>\n<html lang="de" data-theme="dark">\n<head>\n<meta charset="UTF-8">\n<title>Markt-Dashboard</title>\n${stil}\n</head>\n<body>\n${kopf}\n${inhalt}\n${band}\n</body>\n</html>\n`
  : `<title>Markt-Dashboard</title>\n${stil}\n${kopf}\n${inhalt}\n${band}\n`;

fs.writeFileSync(ZIEL, seite);
console.log('gebaut:', ZIEL);
console.log(skripte.length, 'Skripte eingebettet |', anzahl, 'Abrufe behalten,', verworfen, 'zu gross |',
  (aufzeichnung.length / 1048576).toFixed(1), 'MB roh →', (gepackt.length / 1048576).toFixed(1), 'MB gepackt |',
  'Datei', (fs.statSync(ZIEL).size / 1048576).toFixed(1), 'MB');
if (fs.statSync(ZIEL).size > 16 * 1048576) {
  console.log('WARNUNG: ueber 16 MB – der Artifact-Dienst nimmt die Datei so nicht an.',
    'Kleiner wird sie mit --kerzen=250 oder --grenze=80.');
}
