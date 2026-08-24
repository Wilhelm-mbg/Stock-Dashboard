/* REPL-Treiber fuer das Markt-Dashboard im Browser.
 *
 * Die App ist Electron, also gibt es auf einem Rechner ohne Bildschirm nichts zu
 * sehen. Dieser Treiber laedt stattdessen index.html in Chromium, legt den
 * Bruecken-Nachbau aus api-shim.mjs darunter und nimmt Befehle von der Standard-
 * eingabe entgegen. Damit laesst sich die Oberflaeche fernsteuern und fotografieren.
 *
 * Aufruf:  node .claude/skills/dashboard-fahren/driver.mjs
 * Befehle: hilfe
 */
import * as http from 'node:http';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { createRequire } from 'node:module';
import { apiShim } from './api-shim.mjs';

const WURZEL = path.resolve(import.meta.dirname, '../../..');
const BILDER = process.env.SCREENSHOT_DIR || path.join(WURZEL, '.bilder');
const PORT = Number(process.env.PORT || 8199);

/* Playwright liegt je nach Rechner lokal, global oder gar nicht. */
function ladePlaywright() {
  const require = createRequire(import.meta.url);
  const orte = ['playwright', 'playwright-core', '/opt/node22/lib/node_modules/playwright'];
  for (const ort of orte) {
    try { return require(ort); } catch (e) { /* naechster Ort */ }
  }
  console.error('Playwright fehlt. Einmalig:  npm i -D playwright   (oder global installieren)');
  process.exit(1);
}

/* Eigener Mini-Server: index.html verlangt per Meta-CSP `self`, ueber file:// faellt
 * die Seite deshalb auseinander. Ein Server spart zugleich jede Abhaengigkeit. */
const TYPEN = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.png': 'image/png', '.ico': 'image/x-icon' };
function starteServer() {
  return new Promise((fertig) => {
    const server = http.createServer((req, res) => {
      const rein = decodeURIComponent((req.url || '/').split('?')[0]);
      const datei = path.join(WURZEL, rein === '/' ? 'index.html' : rein);
      if (!datei.startsWith(WURZEL) || !fs.existsSync(datei) || fs.statSync(datei).isDirectory()) {
        res.writeHead(404); return res.end('nicht gefunden');
      }
      res.writeHead(200, { 'Content-Type': TYPEN[path.extname(datei)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(datei).pipe(res);
    });
    server.listen(PORT, '127.0.0.1', () => fertig(server));
  });
}

const ERLAUBTE_HOSTS = new Set(['query1.finance.yahoo.com', 'query2.finance.yahoo.com', 'feeds.finance.yahoo.com', 'fc.yahoo.com', 'news.google.com', 'api.github.com', 'api.onvista.de']);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

const { chromium } = ladePlaywright();
fs.mkdirSync(BILDER, { recursive: true });

let server = null, browser = null, seite = null;
const aufzeichnung = {};
let abrufe = 0, fehlabrufe = 0;
const fehler = [];

const BEFEHLE = {
  async start() {
    if (seite) return console.log('laeuft schon');
    server = await starteServer();
    browser = await chromium.launch({ args: ['--no-sandbox'] });
    const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: Number(process.env.DPR || 2) });

    // Derselbe Weg wie in main.js: gleiche Host-Liste, gleicher User-Agent. Ohne
    // Browser-Kennung antwortet Yahoo mit 429.
    await ctx.exposeBinding('__nodeFetchText', async (_q, url) => {
      abrufe++;
      let antwort;
      try {
        const u = new URL(url);
        if (u.protocol !== 'https:' || !ERLAUBTE_HOSTS.has(u.hostname)) antwort = { ok: false, status: 0, body: 'Host nicht erlaubt: ' + u.hostname };
        else {
          const r = await fetch(u, { headers: { 'User-Agent': UA, 'Accept': 'application/json,text/xml,application/xml,*/*' }, signal: AbortSignal.timeout(20000) });
          antwort = { ok: r.ok, status: r.status, body: await r.text() };
        }
      } catch (e) { antwort = { ok: false, status: 0, body: String(e.message || e) }; }
      if (!antwort.ok) fehlabrufe++;
      aufzeichnung[url] = antwort;
      return antwort;
    });
    await ctx.addInitScript(apiShim, { modus: 'live', speicher: 'ram', version: '8.24.4 (Browser)' });

    seite = await ctx.newPage();
    seite.on('pageerror', (e) => fehler.push(e.message));
    seite.on('console', (m) => { if (m.type() === 'error') fehler.push(m.text().slice(0, 200)); });
    await seite.goto('http://127.0.0.1:' + PORT + '/index.html', { waitUntil: 'load', timeout: 60000 });
    console.log('geladen – die Kacheln fuellen sich ueber etwa 20 Sekunden.');
  },

  async warte(sekunden) {
    if (!seite) return console.log('erst "start"');
    await seite.waitForTimeout(Number(sekunden || 10) * 1000);
    console.log('gewartet:', Number(sekunden || 10) + 's');
  },

  // Die Erststart-Frage nach Diagnosedaten legt sich sonst ueber die halbe Seite.
  async wegklicken() {
    if (!seite) return console.log('erst "start"');
    console.log(await seite.evaluate(() => (document.getElementById('diagNein') ? (document.getElementById('diagNein').click(), 'Banner weg') : 'kein Banner da')));
  },

  async reiter(name) {
    if (!seite) return console.log('erst "start"');
    const r = await seite.evaluate((k) => {
      const b = document.querySelector(`nav button[data-tab="${k}"]`);
      if (!b) return 'unbekannt – moeglich: ' + [...document.querySelectorAll('nav button[data-tab]')].map((x) => x.dataset.tab).join(', ');
      b.click(); return 'offen: ' + k;
    }, name);
    console.log(r);
  },

  async explorer(sym) {
    if (!seite) return console.log('erst "start"');
    console.log(await seite.evaluate((s) => (window.Explorer ? (window.Explorer.oeffne(s, s), 'Explorer: ' + s) : 'Explorer nicht bereit'), sym));
  },

  // Ueber das DOM klicken, nicht ueber Koordinaten: die App zeichnet Charts auf
  // Canvas-Flaechen, die Treffer sonst abfangen.
  async klick(sel) {
    if (!seite) return console.log('erst "start"');
    console.log(await seite.evaluate((s) => {
      const el = document.querySelector(s);
      if (!el) return 'nicht gefunden: ' + s;
      el.click(); return 'geklickt: ' + s;
    }, sel));
  },

  async text(sel) {
    if (!seite) return console.log('erst "start"');
    const t = await seite.evaluate((s) => (s ? document.querySelector(s) : document.body)?.innerText ?? '(nichts)', sel || null);
    console.log(t.slice(0, 4000));
  },

  async eval(ausdruck) {
    if (!seite) return console.log('erst "start"');
    try { console.log(JSON.stringify(await seite.evaluate(ausdruck))); } catch (e) { console.log('FEHLER:', e.message); }
  },

  async bild(name) {
    if (!seite) return console.log('erst "start"');
    const kurz = path.join(BILDER, (name || 'bild') + '.png');
    const lang = path.join(BILDER, (name || 'bild') + '-ganz.png');
    await seite.evaluate(() => window.scrollTo(0, 0));
    await seite.screenshot({ path: kurz });
    await seite.screenshot({ path: lang, fullPage: true });
    console.log('Bild:', kurz, '/', lang);
  },

  async netz() {
    console.log('Abrufe:', abrufe, '| fehlgeschlagen:', fehlabrufe, '| verschiedene URLs:', Object.keys(aufzeichnung).length, '| Skriptfehler:', fehler.length);
    if (fehler.length) console.log('letzter Fehler:', fehler[fehler.length - 1]);
  },

  // Alles bisher Abgerufene wegschreiben – Futter fuer bundle.mjs.
  async sichern(datei) {
    const ziel = path.resolve(datei || path.join(WURZEL, 'schnappschuss.json'));
    fs.writeFileSync(ziel, JSON.stringify(aufzeichnung));
    console.log('gesichert:', ziel, (fs.statSync(ziel).size / 1048576).toFixed(1), 'MB,', Object.keys(aufzeichnung).length, 'URLs');
  },

  async ende() {
    if (browser) await browser.close().catch(() => {});
    if (server) server.close();
    browser = null; seite = null; server = null;
  },

  hilfe() {
    console.log([
      'start              App laden (Server + Chromium + Bruecken-Nachbau)',
      'warte [s]          Sekunden warten, bis Daten da sind (Standard 10)',
      'wegklicken         Erststart-Frage nach Diagnosedaten schliessen',
      'reiter <name>      dashboard | strategien | depot | werkzeuge | messung',
      'explorer <sym>     Wert im Aktien-Explorer oeffnen, z. B. NVDA',
      'klick <css>        Element ueber das DOM anklicken',
      'text [css]         Text eines Bereichs ausgeben (Standard: ganze Seite)',
      'eval <js>          Ausdruck in der Seite auswerten',
      'bild [name]        Screenshot nach ' + BILDER,
      'netz               Abrufe, Fehlabrufe, Skriptfehler',
      'sichern [datei]    Abrufe als schnappschuss.json wegschreiben',
      'ende               schliessen'
    ].join('\n'));
  }
};

/* Electron und Chromium greifen beide nach stdin – der rohe Dateideskriptor bleibt uns. */
const eingabe = fs.createReadStream(null, { fd: fs.openSync('/dev/stdin', 'r') });
const rl = readline.createInterface({ input: eingabe, output: process.stdout, prompt: 'dashboard> ' });

/* Befehle nacheinander abarbeiten. Wer den Treiber aus einem Skript fuettert,
 * schickt alle Zeilen auf einmal; ohne diese Kette liefe `bild` los, waehrend
 * `start` noch den Browser hochzieht, und meldete "erst start". */
let kette = Promise.resolve();
rl.on('line', (zeile) => {
  kette = kette.then(async () => {
    const [befehl, ...rest] = zeile.trim().split(/\s+/);
    if (!befehl) return rl.prompt();
    const fn = BEFEHLE[befehl];
    if (!fn) { console.log('unbekannt:', befehl, '– "hilfe" zeigt alles'); return rl.prompt(); }
    try { await fn(rest.join(' ')); } catch (e) { console.log('FEHLER:', e.message); }
    if (befehl === 'ende') { rl.close(); process.exit(0); }
    rl.prompt();
  });
});
rl.on('close', async () => { await BEFEHLE.ende(); process.exit(0); });

console.log('Markt-Dashboard-Treiber – "hilfe" zeigt die Befehle, "start" laedt die App.');
rl.prompt();
