'use strict';
/* SICHERHEITS-TESTS ZUR DURCHSICHT 2026-10 (Hauptprozess, Sicherung, .gitignore).
 *
 * Anders als test-v6.js prueft diese Datei VERHALTEN: main.js wird mit einem
 * nachgebauten Electron geladen (ipcMain, dialog, BrowserWindow, shell), https und
 * child_process.fork werden ersetzt. Damit laufen die echten IPC-Handler.
 *
 *   node test-sicherheit.js                        gegen den Arbeitsbaum
 *   SICHERHEIT_QUELLE=<ordner> node test-sicherheit.js   gegen eine andere Fassung
 *                                                  (z. B. git archive des alten Stands)
 *
 * Die HTML-Injektion (Fund 2) prueft test-sicherheit-xss.js. */
const Module = require('module');
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const { EventEmitter } = require('events');
const { execFileSync } = require('child_process');

const QUELLE = path.resolve(process.env.SICHERHEIT_QUELLE || __dirname);
let fehler = 0, gut = 0;
function ok(bed, name, extra) {
  if (bed) { gut++; console.log('  ✅ ' + name); } else { fehler++; console.log('  ❌ ' + name + (extra !== undefined ? '  [' + extra + ']' : '')); }
}
function warte(ms) { return new Promise((r) => setTimeout(r, ms)); }
function mitFrist(p, ms) { return Promise.race([p, warte(ms).then(() => 'HAENGT')]); }

/* ------------------------------------------------------------ Nachbau Electron */
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'md-sicherheit-'));
const handler = {};
const geoeffnet = [];          // shell.openExternal
const dialoge = [];            // dialog.showMessageBox
let dialogAntwort = 0;
const geforkt = [];            // child_process.fork
const fenster = { openHandler: null, navigieren: null };
function leer() { return new Proxy(function () {}, { get: (t, k) => (k === 'then' ? undefined : leer()), apply: () => leer() }); }
class FakeWin {
  constructor() {
    this.webContents = {
      setWindowOpenHandler: (f) => { fenster.openHandler = f; },
      on: (n, f) => { if (n === 'will-navigate') fenster.navigieren = f; },
      send: () => {}, isDestroyed: () => false
    };
  }
  on() {} once() {} loadFile() {} show() {} hide() {} focus() {} isDestroyed() { return false; }
  static fromWebContents() { return new FakeWin(); }
  static getAllWindows() { return [1]; }
}
const electron = {
  app: new Proxy({}, { get(t, k) {
    if (k === 'getPath') return () => TMP;
    if (k === 'requestSingleInstanceLock') return () => true;
    if (k === 'whenReady') return () => Promise.resolve();
    if (k === 'isPackaged') return false;
    if (k === 'getVersion') return () => '0.0.0';
    if (k === 'getAppPath') return () => QUELLE;
    return leer();
  } }),
  ipcMain: { handle: (n, f) => { handler[n] = f; }, on: () => {} },
  shell: { openExternal: (u) => { geoeffnet.push(u); return Promise.resolve(); } },
  dialog: { showMessageBox: (a, b) => { dialoge.push(b || a); return Promise.resolve({ response: dialogAntwort }); } },
  BrowserWindow: FakeWin,
  Tray: leer(), Menu: leer(), safeStorage: leer()
};
/* https: Anfragen an Yahoo/GitHub gehen an einen lokalen Server, der sich je Test
 * anders verhaelt. Nichts verlaesst den Rechner. */
let ZIEL_PORT = 0;
function umleiten(url, opts, cb) {
  if (typeof opts === 'function') { cb = opts; opts = {}; }
  let pfad;
  if (typeof url === 'string') { const u = new URL(url); pfad = u.hostname + u.pathname + u.search; }
  else { opts = url; pfad = (opts.hostname || opts.host) + (opts.path || '/'); }
  const o = Object.assign({}, opts, { protocol: 'http:', hostname: '127.0.0.1', host: undefined, port: ZIEL_PORT, path: '/' + pfad });
  return http.request(o, cb);
}
const fakeHttps = { get: (u, o, cb) => { const r = umleiten(u, o, cb); r.end(); return r; }, request: umleiten };
const fakeCp = Object.assign({}, require('child_process'), {
  fork: (skript, args) => {
    geforkt.push(args[0]);
    const k = new EventEmitter(); k.stdout = new EventEmitter(); k.stderr = new EventEmitter(); k.kill = () => {};
    setTimeout(() => k.emit('close', 0), 5);
    return k;
  }
});
const orig = Module._load;
Module._load = function (req) {
  if (req === 'electron') return electron;
  if (req === 'https') return fakeHttps;
  if (req === 'child_process') return fakeCp;
  return orig.apply(this, arguments);
};
require(path.join(QUELLE, 'main.js'));
Module._load = orig;

/* Eine Strategie, genau so gebaut wie scoreboard.js sie ablegt. */
function vorlage(key, signal) {
  return "'use strict';\n" +
    '/* Abgelegt aus der App am 2026-10-04 12:00. Gemessen wird mit:\n' +
    ' *   node studien/messmaschine/messen.js <diese Datei>\n */\n' +
    "var Q = require(require('path').join(process.env.STOCK_DASHBOARD_QUELLE || '.', 'quant.js'));\n" +
    signal + '\n' +
    'module.exports = {\n' +
    '  key: ' + JSON.stringify(key) + ',\n' +
    '  grund: ' + JSON.stringify('Nach drei roten Tagen kippt die Stimmung, weil Verkaeufer erschoepft sind.') + ',\n' +
    "  zeitrahmen: '60m',\n  haltedauerKerzen: 5,\n  richtung: \"long\",\n  universum: 'aktien',\n" +
    '  kosten: { spanneBp: 5 },\n  signal: signal,\n};\n';
}
const GUT_SIGNAL = 'function signal(bars, i, params) {\n  if (i < 3) return false;\n' +
  '  return bars[i].c < bars[i - 1].c && bars[i - 1].c < bars[i - 2].c && Q && params !== null;\n}';
const BOESE = "require('fs').writeFileSync(require('os').tmpdir() + '/poc-rce.txt', 'aus dem Renderer');\n" +
  "module.exports = { key: 'poc-rce' };";
const BOESE_GETARNT = vorlage('getarnt', 'function signal(bars, i) { var f = [].constructor.constructor; ' +
  "f('return this')().process.exit(9); return false; }");
const SDIR = path.join(TMP, 'Markt-Dashboard-Daten', 'strategien');

(async function () {
  /* ================= Fund 1: kein beliebiger Code aus dem Renderer ================= */
  console.log('\nFund 1 – write-strategie / mess-lauf');
  const ev = { sender: { send: () => {}, isDestroyed: () => false } };
  let r = await handler['write-strategie'](ev, 'poc-rce', BOESE);
  ok(r && r.ok === false && !fs.existsSync(path.join(SDIR, 'poc-rce.js')),
    'write-strategie legt beliebigen Code (require/fs) NICHT ab', JSON.stringify(r));
  r = await handler['write-strategie'](ev, 'getarnt', BOESE_GETARNT);
  ok(r && r.ok === false, 'auch getarnt in der Vorlage (constructor.constructor) wird abgelehnt', JSON.stringify(r));
  r = await handler['write-strategie'](ev, 'drei-rote', vorlage('drei-rote', GUT_SIGNAL));
  ok(r && r.ok === true && fs.existsSync(path.join(SDIR, 'drei-rote.js')),
    'eine Strategie aus der App-Vorlage wird weiter abgelegt', JSON.stringify(r));

  /* Was trotzdem im Ordner liegt (von Hand, aus aelterer Fassung), laeuft nur geprueft. */
  fs.mkdirSync(SDIR, { recursive: true });
  fs.writeFileSync(path.join(SDIR, 'von-hand.js'), BOESE);
  geforkt.length = 0; dialoge.length = 0; dialogAntwort = 1;
  r = await mitFrist(handler['mess-lauf'](ev, 'von-hand'), 3000);
  ok(geforkt.length === 0 && r && r.ok === false, 'mess-lauf startet eine Datei mit beliebigem Code NICHT – auch nicht nach Ja im Dialog',
    'geforkt=' + geforkt.length);

  geforkt.length = 0; dialoge.length = 0; dialogAntwort = 0;
  r = await mitFrist(handler['mess-lauf'](ev, 'drei-rote'), 3000);
  ok(dialoge.length === 1 && geforkt.length === 0 && r && r.ok === false,
    'ohne Bestaetigung im nativen Dialog wird nichts gestartet', 'dialoge=' + dialoge.length + ' geforkt=' + geforkt.length);
  geforkt.length = 0; dialoge.length = 0; dialogAntwort = 1;
  r = await mitFrist(handler['mess-lauf'](ev, 'drei-rote'), 3000);
  ok(geforkt.length === 1 && r && r.ok === true, 'nach Bestaetigung laeuft die Messung wie bisher', JSON.stringify(r));
  geforkt.length = 0; dialoge.length = 0; dialogAntwort = 0;
  r = await mitFrist(handler['mess-lauf'](ev, 'drei-rote'), 3000);
  ok(geforkt.length === 1 && dialoge.length === 0, 'eine freigegebene, unveraenderte Strategie laeuft ohne neue Frage');
  ok(!fs.existsSync(path.join(TMP, 'store', 'strategie-freigaben.json')),
    'die Freigaben liegen nicht im Store-Ordner (store-set kommt nicht hin)');
  r = await handler['store-set'](ev, 'strategie-freigaben', { 'drei-rote': 'x' });
  fs.appendFileSync(path.join(SDIR, 'drei-rote.js'), '// geaendert\n');
  geforkt.length = 0; dialoge.length = 0; dialogAntwort = 0;
  r = await mitFrist(handler['mess-lauf'](ev, 'drei-rote'), 3000);
  ok(dialoge.length === 1 && geforkt.length === 0, 'geaenderter Inhalt braucht eine neue Bestaetigung');

  /* Die vorhandenen Messlaeufe gehen weiter: was der Baukasten der App erzeugt, besteht. */
  let P = null;
  try { P = require(path.join(QUELLE, 'strategiepruefung.js')); } catch (e) { P = null; }
  ok(!!P, 'strategiepruefung.js ist ladbar');
  if (P) {
    let B = null;
    try { B = require(path.join(QUELLE, 'strategiebaukasten.js')); } catch (e) { B = null; }
    if (B && B.MUSTER) {
      let gepr = 0, durch = 0; const nicht = [];
      B.MUSTER.forEach((m) => ['long', 'short'].forEach((rt) => {
        const werte = {};
        m.felder.forEach((f) => { werte[f.name] = f.vorgabe; });
        const r2 = B.baue({ muster: m.id, richtung: rt, werte: werte });
        if (!r2 || !r2.ok) { nicht.push(m.id + ' baut nicht'); return; }
        gepr++;
        const e2 = P.inhaltPruefen(vorlage('bau-' + m.id, r2.signal));
        if (e2.ok) durch++; else nicht.push(m.id + ': ' + e2.grund.slice(0, 60));
      }));
      ok(gepr >= 10 && durch === gepr, 'jede Baukasten-Regel (alle Muster, beide Richtungen) besteht die Inhaltspruefung',
        durch + '/' + gepr + ' ' + nicht.join('; '));
    } else ok(false, 'strategiebaukasten.js ist ladbar');
    ok(P.inhaltPruefen(vorlage('x', GUT_SIGNAL)).ok, 'die App-Vorlage mit eigener Signalfunktion besteht die Inhaltspruefung');
  }

  /* ================= Fund 3: openExternal nur fuer erlaubte Hosts ================= */
  console.log('\nFund 3 – Links im Standard-Browser');
  await warte(20);
  ok(typeof fenster.openHandler === 'function' && typeof fenster.navigieren === 'function', 'Fenster-Handler sind gesetzt');
  if (fenster.openHandler && fenster.navigieren) {
    geoeffnet.length = 0; dialoge.length = 0; dialogAntwort = 0;
    fenster.openHandler({ url: 'https://news.google.com/rss/articles/abc' });
    fenster.navigieren({ preventDefault: () => {} }, 'https://github.com/Wilhelm-mbg/Stock-Dashboard/issues/1');
    await warte(20);
    ok(geoeffnet.length === 2, 'erlaubte Hosts (news.google.com, github.com) oeffnen direkt', geoeffnet.join(' '));
    geoeffnet.length = 0;
    fenster.openHandler({ url: 'https://evil.example/?k=geheim' });
    await warte(20);
    fenster.navigieren({ preventDefault: () => {} }, 'https://angreifer.example/x');
    await warte(20);
    ok(geoeffnet.length === 0, 'fremde Hosts oeffnen NICHT ungefragt (window.open und location.href)', geoeffnet.join(' '));
    ok(dialoge.length >= 1, 'stattdessen kommt eine Rueckfrage im nativen Dialog');
    geoeffnet.length = 0; dialogAntwort = 1;
    fenster.openHandler({ url: 'https://www.reuters.com/markets/' });
    await warte(20);
    ok(geoeffnet.length === 1, 'nach Ja im Dialog oeffnet auch eine fremde Nachrichtenquelle');
    geoeffnet.length = 0; dialogAntwort = 0;
    fenster.openHandler({ url: 'https://news.google.com.evil.example/' });
    fenster.openHandler({ url: 'https://user@evil.example/' });
    fenster.openHandler({ url: 'file:///C:/Windows/system32/calc.exe' });
    await warte(20);
    ok(geoeffnet.length === 0, 'Namensanhaengsel, Benutzerteil und file: bleiben zu');
  }

  /* ================= Fund 4: Abrufe mit Groessengrenze haengen nicht ================= */
  console.log('\nFund 4 – Abrufe ueber der Groessengrenze');
  let modus = 'crumb-gross';
  const srv = http.createServer((q, s) => {
    if (q.url.indexOf('/fc.yahoo.com') === 0) { s.writeHead(200, { 'set-cookie': 'A3=x; path=/' }); return s.end('ok'); }
    if (q.url.indexOf('/query2.finance.yahoo.com/v1/test/getcrumb') === 0) {
      if (modus === 'crumb-gross') { s.writeHead(200); s.write(Buffer.alloc(8192, 120)); return; }  // offen lassen
      s.writeHead(200); return s.end('crumb123');
    }
    if (q.url.indexOf('/query2.finance.yahoo.com/v7/finance/quote') === 0) {
      s.writeHead(200); const b = Buffer.alloc(65536, 32); let n = 0;
      const t = setInterval(() => { if (s.destroyed || ++n > 80) { clearInterval(t); return; } s.write(b); }, 1);
      return;
    }
    s.writeHead(404); s.end();
  });
  await new Promise((r2) => srv.listen(0, '127.0.0.1', r2));
  ZIEL_PORT = srv.address().port;
  r = await mitFrist(handler['yahoo-quotes'](ev, ['AAPL']), 4000);
  ok(r !== 'HAENGT', 'holeSitz: Crumb-Antwort ueber 4 KB loest auf statt zu haengen', r === 'HAENGT' ? 'haengt' : JSON.stringify(r).slice(0, 80));
  modus = 'gut';
  r = await mitFrist(handler['yahoo-quotes'](ev, ['MSFT']), 6000);
  ok(r !== 'HAENGT', 'jsonGet: Kursantwort ueber 2 MB loest auf statt zu haengen', r === 'HAENGT' ? 'haengt' : JSON.stringify(r).slice(0, 80));
  srv.close();
  const mq = fs.readFileSync(path.join(QUELLE, 'main.js'), 'utf8');
  const ohneAufloesen = mq.split('\n').filter((z) => /length > [^;]*destroy\(\)/.test(z) && !/resolve|fertig/.test(z));
  ok(ohneAufloesen.length === 0, 'keine Groessengrenze in main.js bricht ab, ohne aufzuloesen (auch diagnose-send)', ohneAufloesen.length + ' Stellen');

  /* ================= Fund 5: Sicherung ohne Broker-Schluessel ================= */
  console.log('\nFund 5 – Sicherung');
  const sq = fs.readFileSync(path.join(QUELLE, 'tools', 'sicherung.js'), 'utf8');
  const gm = /const GEHEIME_FELDER = \[([^\]]*)\]/.exec(mq);
  const nm = /const NIEMALS = \[([^\]]*)\]/.exec(sq);
  const liste = (m) => (m ? m[1].split(',').map((x) => x.trim().replace(/'/g, '')).filter(Boolean) : []);
  const geheim = liste(gm), niemals = liste(nm);
  ok(geheim.length >= 5 && geheim.every((k) => niemals.indexOf(k) !== -1),
    'jedes Geheimfeld aus main.js steht in der Ausschlussliste der Sicherung', 'fehlt: ' + geheim.filter((k) => niemals.indexOf(k) === -1).join(','));
  /* Und im Paket selbst: Sicherung mit einem nachgebauten powershell.exe, das statt zu
   * packen den Ordner kopiert. Laeuft nur, wo es kein echtes powershell gibt. */
  if (process.platform !== 'win32') {
    const H = fs.mkdtempSync(path.join(os.tmpdir(), 'md-sich-home-'));
    const bin = path.join(H, 'bin'); fs.mkdirSync(bin);
    fs.writeFileSync(path.join(bin, 'powershell.exe'),
      '#!/bin/sh\ncmd="$4"\nvon=$(printf "%s" "$cmd" | sed -n \'s/.*-Path "\\(.*\\)\\/\\*".*/\\1/p\')\n' +
      'nach=$(printf "%s" "$cmd" | sed -n \'s/.*-DestinationPath "\\([^"]*\\)".*/\\1/p\')\ncp -r "$von" "$nach"\n');
    fs.chmodSync(path.join(bin, 'powershell.exe'), 0o755);
    const store = path.join(H, 'appdata', 'Markt-Dashboard', 'store'); fs.mkdirSync(store, { recursive: true });
    fs.writeFileSync(path.join(store, 'settings.json'), JSON.stringify({ capKey: 'CK', capId: 'CI', capPass: 'CP', alpKey: 'AK-geheim', alpSecret: 'AS-geheim', thema: 'dunkel' }));
    fs.mkdirSync(path.join(H, 'Downloads'), { recursive: true });
    let paket = null;
    try {
      execFileSync(process.execPath, [path.join(QUELLE, 'tools', 'sicherung.js'), '--erstellen'],
        { env: Object.assign({}, process.env, { HOME: H, APPDATA: path.join(H, 'appdata'), PATH: bin + path.delimiter + process.env.PATH }), stdio: 'pipe' });
      const z = fs.readdirSync(path.join(H, 'Downloads')).find((f) => /sicherung/.test(f));
      paket = z ? fs.readFileSync(path.join(H, 'Downloads', z, 'store', 'settings.json'), 'utf8') : null;
    } catch (e) { paket = null; }
    ok(paket !== null && /dunkel/.test(paket) && !/geheim|"CK"|"CP"/.test(paket),
      'das Sicherungspaket enthaelt keine Capital- und keine Alpaca-Schluessel', paket);
  }

  /* ================= Fund 6: .gitignore ================= */
  console.log('\nFund 6 – .gitignore');
  const gi = path.join(QUELLE, '.gitignore');
  const pruefe = ['.env', '.env.lokal', 'zertifikat.pfx', 'signatur.key', 'tools/geheim.key'];
  let ignoriert = [];
  try {
    const aus = execFileSync('git', ['-c', 'core.excludesFile=' + gi, 'check-ignore', '--no-index', '--stdin'],
      { cwd: (function () { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'md-gi-')); execFileSync('git', ['init', '-q'], { cwd: d }); return d; })(), input: pruefe.join('\n'), stdio: ['pipe', 'pipe', 'ignore'] });
    ignoriert = String(aus).split('\n').filter(Boolean);
  } catch (e) { ignoriert = String(e.stdout || '').split('\n').filter(Boolean); }
  if (!ignoriert.length) {
    // Rueckfall ohne git: Muster selbst lesen
    const muster = fs.readFileSync(gi, 'utf8').split('\n').map((z) => z.trim());
    ignoriert = pruefe.filter((p) => muster.indexOf(path.basename(p)) !== -1 || muster.some((m) => m.startsWith('*.') && p.endsWith(m.slice(1))) || (/^\.env/.test(path.basename(p)) && muster.indexOf('.env.*') !== -1));
  }
  ok(pruefe.every((p) => ignoriert.indexOf(p) !== -1), '.env, *.pfx und *.key sind von Git ausgeschlossen', ignoriert.join(','));

  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* egal */ }
  console.log('\n' + (fehler ? '❌ ' + fehler + ' FEHLGESCHLAGEN, ' : '') + '✅ ' + gut + ' bestanden');
  process.exit(fehler ? 1 : 0);
})().catch((e) => { console.log('❌ Abbruch: ' + (e && e.stack || e)); process.exit(1); });
