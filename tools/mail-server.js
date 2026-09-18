'use strict';
/* ================= Mail-Überblick: kleiner Leseserver für die Handy-App =================
 *
 * ANLASS (19.09.2026): Wilhelm will den Mail-Überblick am Handy nachvollziehen - den
 * Tagesbericht, jede gesammelte Mail und das Lauf-Protokoll. Das Handy kann die Dateien
 * unter Markt-Dashboard-Daten\mail nicht lesen; dieser Server liefert sie als JSON und
 * die Seite dazu (tools/mail-ueberblick-app/seite.html). Die Android-App ist nur eine
 * Hülle um diese Seite.
 *
 * NUR LESEN, NUR GET. Es gibt keinen Weg, über diesen Server etwas zu schreiben.
 *
 * ERREICHBARKEIT: Standardmäßig lauscht er auf 127.0.0.1 und auf der Tailscale-Adresse
 * dieses PCs (100.64.0.0/10) - Tailscale ist verschlüsselt und nur für Wilhelms Geräte.
 * Mit --alle lauscht er auf allen Netzen (WLAN); dann sieht jeder im WLAN die Mails,
 * es gibt keinen Login. ponytail: kein Login, Ausbau wenn der Server je außerhalb
 * von Tailscale laufen soll.
 *
 * AUFRUF:  node tools/mail-server.js [--port 8790] [--alle] [--ordner <mail-Ordner>]
 * Beim Anmelden startet ihn die Verknüpfung im Autostart-Ordner (siehe Übergabe). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');

const MAIL_ORDNER = 'C:\\Users\\Wilhe\\Downloads\\Markt-Dashboard-Daten\\mail';
const SEITE = path.join(__dirname, 'mail-ueberblick-app', 'seite.html');
const PORT_STANDARD = 8790;

function argumente(argv) {
  const a = { port: PORT_STANDARD, alle: false, ordner: MAIL_ORDNER };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--port') { const p = Number(argv[++i]); a.port = Number.isInteger(p) && p >= 0 ? p : PORT_STANDARD; }  // 0 = freier Port (Test)
    else if (argv[i] === '--alle') a.alle = true;
    else if (argv[i] === '--ordner') a.ordner = argv[++i];
  }
  return a;
}

/* ---------------------------------------------------------------- neu-Datei lesen */
/* Das Format schreibt tools/mail-ueberblick.js; hier wird es zurückgelesen.
 * Ältere Dateien (vor dem Entscheid "alle Ordner") haben keine Ordner-Zeile. */
function neuParsen(text) {
  const bloecke = text.split(/^={78}\r?\n/m);
  const kopfText = bloecke[0];
  const kopfZeile = kopfText.split(/\r?\n/)[0] || '';
  const stand = (kopfZeile.match(/Stand (\S+ \S+)/) || [])[1] || null;
  const fenster = (kopfZeile.match(/Fenster seit (\S+ \S+)/) || [])[1] || null;
  const konten = [];
  let imKonten = false;
  for (const z of kopfText.split(/\r?\n/)) {
    if (/^KONTEN/.test(z)) { imKonten = true; continue; }
    if (imKonten) { if (!z.trim()) break; konten.push(z.trim()); }
  }
  const mails = [];
  for (const b of bloecke.slice(1)) {
    const [kopf, ...rest] = b.split(/^--- Text ---\r?\n/m);
    const feld = (name) => { const m = kopf.match(new RegExp('^' + name + ': (.*)$', 'm')); return m ? m[1].trim() : ''; };
    const nr = (kopf.match(/^#(\d+)/) || [])[1];
    mails.push({
      nr: Number(nr) || mails.length + 1,
      konto: feld('#\\d+  Konto'),
      ordner: feld('Ordner') || 'INBOX',
      datum: feld('Datum'),
      absender: feld('Absender'),
      betreff: feld('Betreff'),
      gelesen: feld('Status') === 'gelesen',
      anhaenge: feld('Anhänge') === '-' ? [] : feld('Anhänge').split('; ').filter(Boolean),
      text: rest.join('--- Text ---').replace(/\s+$/, '')
    });
  }
  return { stand, fenster, konten, mails };
}

function tageListen(ordner) {
  if (!fs.existsSync(ordner)) return [];
  const tage = {};
  for (const f of fs.readdirSync(ordner)) {
    const m = f.match(/^(neu|ueberblick)-(\d{4}-\d{2}-\d{2})\.(txt|md)$/);
    if (!m) continue;
    const t = tage[m[2]] || (tage[m[2]] = { datum: m[2], neu: false, bericht: false });
    if (m[1] === 'neu') t.neu = true; else t.bericht = true;
  }
  return Object.values(tage).sort((a, b) => b.datum.localeCompare(a.datum));
}

function tagLaden(ordner, datum) {
  const neu = path.join(ordner, `neu-${datum}.txt`);
  const ber = path.join(ordner, `ueberblick-${datum}.md`);
  const erg = { datum, bericht: null, stand: null, fenster: null, konten: [], mails: [] };
  if (fs.existsSync(ber)) erg.bericht = fs.readFileSync(ber, 'utf8');
  if (fs.existsSync(neu)) Object.assign(erg, neuParsen(fs.readFileSync(neu, 'utf8')));
  return erg;
}

/* ---------------------------------------------------------------- HTTP */
function antwort(res, status, body, typ) {
  const daten = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
  res.writeHead(status, { 'Content-Type': typ, 'Content-Length': daten.length, 'Cache-Control': 'no-store' });
  res.end(daten);
}
function json(res, status, obj) { antwort(res, status, JSON.stringify(obj), 'application/json; charset=utf-8'); }

function handler(a) {
  return (req, res) => {
    const url = new URL(req.url, 'http://x');
    const pfad = url.pathname;
    console.log(`${new Date().toISOString()} ${req.socket.remoteAddress} ${req.method} ${pfad}`);
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { fehler: 'nur GET' });
    try {
      if (pfad === '/' || pfad === '/index.html') {
        if (!fs.existsSync(SEITE)) return antwort(res, 500, 'seite.html fehlt', 'text/plain; charset=utf-8');
        return antwort(res, 200, fs.readFileSync(SEITE), 'text/html; charset=utf-8');
      }
      if (pfad === '/api/status') return json(res, 200, { jetzt: new Date().toISOString(), ordner: a.ordner, tage: tageListen(a.ordner).length });
      if (pfad === '/api/tage') return json(res, 200, tageListen(a.ordner));
      const m = pfad.match(/^\/api\/tag\/(\d{4}-\d{2}-\d{2})$/);
      if (m) {
        const t = tagLaden(a.ordner, m[1]);
        if (!t.bericht && !t.mails.length) return json(res, 404, { fehler: 'kein Tag ' + m[1] });
        return json(res, 200, t);
      }
      return json(res, 404, { fehler: 'unbekannt' });
    } catch (e) {
      return json(res, 500, { fehler: (e && e.message) || String(e) });
    }
  };
}

function tailscaleAdresse() {
  for (const liste of Object.values(os.networkInterfaces())) {
    for (const i of liste) {
      if (i.family !== 'IPv4' || i.internal) continue;
      const [a, b] = i.address.split('.').map(Number);
      if (a === 100 && b >= 64 && b <= 127) return i.address;   // CGNAT-Bereich = Tailscale
    }
  }
  return null;
}

function start(a) {
  const adressen = a.alle ? ['0.0.0.0'] : ['127.0.0.1'];
  const ts = a.alle ? null : tailscaleAdresse();
  if (ts) adressen.push(ts);
  const h = handler(a);
  const server = [];
  for (const adr of adressen) {
    const s = http.createServer(h);
    s.on('error', e => console.error(`Lauschen auf ${adr}:${a.port} fehlgeschlagen: ${e.message}`));
    s.listen(a.port, adr, () => console.log(`Mail-Überblick-Server: http://${adr}:${a.port}/  (Ordner ${a.ordner})`));
    server.push(s);
  }
  if (!a.alle && !ts) console.log('Hinweis: keine Tailscale-Adresse gefunden - nur 127.0.0.1. Für WLAN: --alle');
  return server;
}

if (require.main === module) {
  start(argumente(process.argv.slice(2)));
} else {
  module.exports = { neuParsen, tageListen, tagLaden, start, argumente, tailscaleAdresse };
}
