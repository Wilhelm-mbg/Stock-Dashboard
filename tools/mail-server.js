'use strict';
/* ================= Mail-Überblick: Leseserver und Ticket-Board für die Handy-App =================
 *
 * ANLASS (19.09.2026): Wilhelm will den Mail-Überblick am Handy nachvollziehen - als
 * Ticket-Board wie in Jira: jede Mail ein Ticket mit Schlüssel (MAIL-n), Priorität
 * (aus der Einordnung der Routine: handeln = hoch, lesen = mittel, Rest = niedrig),
 * Status (offen / in Arbeit / erledigt), Notiz. Offene Tickets bleiben über Tage stehen.
 *
 * QUELLEN (alle unter Markt-Dashboard-Daten\mail\):
 *   neu-JJJJ-MM-TT.txt          die gesammelten Mails (schreibt tools/mail-ueberblick.js)
 *   ueberblick-JJJJ-MM-TT.md    der Tagesbericht (schreibt die Routine)
 *   einordnung-JJJJ-MM-TT.json  die Einordnung der Routine je Mail: nr, klasse, kurz, aufgabe
 *   tickets.json                Ticket-Zustand (Schlüssel, Status, Priorität, Notiz) - die
 *                               EINZIGE Datei, die dieser Server schreibt. Thunderbird und
 *                               die Mails selbst werden nie angefasst.
 *
 * ERREICHBARKEIT: Standardmäßig lauscht er auf 127.0.0.1 und auf der Tailscale-Adresse
 * dieses PCs (100.64.0.0/10) - Tailscale ist verschlüsselt und nur für Wilhelms Geräte.
 * Mit --alle lauscht er auf allen Netzen (WLAN); dann sieht und ändert jeder im WLAN die
 * Tickets, es gibt keinen Login. ponytail: kein Login, Ausbau wenn der Server je
 * außerhalb von Tailscale laufen soll.
 *
 * AUFRUF:  node tools/mail-server.js [--port 8790] [--alle] [--ordner <mail-Ordner>]
 * Beim Anmelden startet ihn die Verknüpfung im Autostart-Ordner (siehe Übergabe). */
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const MAIL_ORDNER = 'C:\\Users\\Wilhe\\Downloads\\Markt-Dashboard-Daten\\mail';
const SEITE = path.join(__dirname, 'mail-ueberblick-app', 'seite.html');
const PORT_STANDARD = 8790;
const STATUS = ['offen', 'in-arbeit', 'erledigt'];
const PRIORITAET = ['hoch', 'mittel', 'niedrig'];
const KLASSE_ZU_PRIO = { handeln: 'hoch', lesen: 'mittel', rest: 'niedrig' };

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
 * Ältere Dateien haben keine Ordner- oder Message-ID-Zeile. */
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
    const mid = feld('Message-ID');
    mails.push({
      nr: Number(nr) || mails.length + 1,
      konto: feld('#\\d+  Konto'),
      ordner: feld('Ordner') || 'INBOX',
      messageId: mid === '-' ? '' : mid,
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
    const m = f.match(/^(neu|ueberblick|einordnung)-(\d{4}-\d{2}-\d{2})\.(txt|md|json)$/);
    if (!m) continue;
    const t = tage[m[2]] || (tage[m[2]] = { datum: m[2], neu: false, bericht: false, einordnung: false });
    t[m[1] === 'ueberblick' ? 'bericht' : m[1]] = true;
  }
  return Object.values(tage).sort((a, b) => b.datum.localeCompare(a.datum));
}

function einordnungLaden(ordner, datum) {
  const p = path.join(ordner, `einordnung-${datum}.json`);
  if (!fs.existsSync(p)) return {};
  try {
    const liste = JSON.parse(fs.readFileSync(p, 'utf8'));
    const map = {};
    // Schlüssel: die Message-ID (stabil, auch wenn die neu-Datei neu geschrieben wird) und die Nr.
    for (const e of Array.isArray(liste) ? liste : (liste.mails || [])) {
      if (!e) continue;
      if (e.id) map['id:' + e.id] = e;
      if (e.nr) map['nr:' + e.nr] = e;
    }
    return map;
  } catch (_e) { return {}; }
}
function einordnungFuer(map, m) {
  return (m.messageId && map['id:' + m.messageId]) || map['nr:' + m.nr] || null;
}

function tagLaden(ordner, datum) {
  const neu = path.join(ordner, `neu-${datum}.txt`);
  const ber = path.join(ordner, `ueberblick-${datum}.md`);
  const erg = { datum, bericht: null, stand: null, fenster: null, konten: [], mails: [] };
  if (fs.existsSync(ber)) erg.bericht = fs.readFileSync(ber, 'utf8');
  if (fs.existsSync(neu)) Object.assign(erg, neuParsen(fs.readFileSync(neu, 'utf8')));
  return erg;
}

/* ---------------------------------------------------------------- Tickets */
/* Schlüssel je Mail: Message-ID, sonst Hash aus Konto, Datum, Absender, Betreff. */
function mailId(m) {
  const basis = m.messageId || [m.konto, m.datum, m.absender, m.betreff].join('|');
  return crypto.createHash('sha1').update(basis).digest('hex').slice(0, 16);
}
function ticketsLaden(ordner) {
  const p = path.join(ordner, 'tickets.json');
  if (!fs.existsSync(p)) return { naechsteNummer: 1, tickets: {} };
  try { const t = JSON.parse(fs.readFileSync(p, 'utf8')); return { naechsteNummer: t.naechsteNummer || 1, tickets: t.tickets || {} }; }
  catch (_e) { return { naechsteNummer: 1, tickets: {} }; }
}
function ticketsSpeichern(ordner, t) {
  fs.mkdirSync(ordner, { recursive: true });
  const p = path.join(ordner, 'tickets.json');
  fs.writeFileSync(p + '.tmp', JSON.stringify(t, null, 1), 'utf8');
  fs.renameSync(p + '.tmp', p);
}

/* Das Board: alle Mails aller Tage (neueste Datei zuerst; gleiche Mail nur einmal), je mit
 * Einordnung der Routine und Ticket-Zustand. Neue Mails bekommen beim ersten Sehen einen
 * Schlüssel MAIL-n und werden gespeichert. */
function boardLaden(ordner) {
  const store = ticketsLaden(ordner);
  const gesehen = new Set();
  const tickets = [];
  let geaendert = false;
  for (const tag of tageListen(ordner)) {
    if (!tag.neu) continue;
    const t = tagLaden(ordner, tag.datum);
    const einordnung = einordnungLaden(ordner, tag.datum);
    for (const m of t.mails) {
      const id = mailId(m);
      if (gesehen.has(id)) continue;
      gesehen.add(id);
      const e = einordnungFuer(einordnung, m);
      let z = store.tickets[id];
      if (!z) {
        z = { schluessel: 'MAIL-' + store.naechsteNummer++, status: 'offen', prioritaet: null, notiz: '', angelegt: new Date().toISOString(), geaendert: null };
        store.tickets[id] = z; geaendert = true;
      }
      const klasse = e ? String(e.klasse || '').toLowerCase() : null;
      tickets.push({
        id, schluessel: z.schluessel, status: z.status, notiz: z.notiz || '', geaendert: z.geaendert,
        prioritaet: z.prioritaet || KLASSE_ZU_PRIO[klasse] || null,
        prioritaetQuelle: z.prioritaet ? 'wilhelm' : (klasse ? 'routine' : 'keine'),
        klasse, kurz: e ? (e.kurz || '') : '', aufgabe: e ? (e.aufgabe || '') : '',
        tag: tag.datum, nr: m.nr, konto: m.konto, ordner: m.ordner, datum: m.datum, absender: m.absender,
        betreff: m.betreff, gelesen: m.gelesen, anhaenge: m.anhaenge, text: m.text
      });
    }
  }
  if (geaendert) ticketsSpeichern(ordner, store);
  return { tickets, anzahl: tickets.length };
}
function ticketAendern(ordner, id, aenderung) {
  const store = ticketsLaden(ordner);
  const z = store.tickets[id];
  if (!z) return null;
  if (aenderung.status !== undefined) { if (!STATUS.includes(aenderung.status)) return { fehler: 'Status unbekannt' }; z.status = aenderung.status; }
  if (aenderung.prioritaet !== undefined) { if (aenderung.prioritaet !== null && !PRIORITAET.includes(aenderung.prioritaet)) return { fehler: 'Priorität unbekannt' }; z.prioritaet = aenderung.prioritaet; }
  if (aenderung.notiz !== undefined) z.notiz = String(aenderung.notiz).slice(0, 4000);
  z.geaendert = new Date().toISOString();
  ticketsSpeichern(ordner, store);
  return z;
}

/* ---------------------------------------------------------------- HTTP */
function antwort(res, status, body, typ) {
  const daten = typeof body === 'string' ? Buffer.from(body, 'utf8') : body;
  res.writeHead(status, { 'Content-Type': typ, 'Content-Length': daten.length, 'Cache-Control': 'no-store' });
  res.end(daten);
}
function json(res, status, obj) { antwort(res, status, JSON.stringify(obj), 'application/json; charset=utf-8'); }
function koerperLesen(req) {
  return new Promise((resolve, reject) => {
    let b = ''; let n = 0;
    req.on('data', c => { n += c.length; if (n > 64 * 1024) { reject(new Error('zu groß')); req.destroy(); } else b += c; });
    req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

function handler(a) {
  return (req, res) => {
    const url = new URL(req.url, 'http://x');
    const pfad = url.pathname;
    console.log(`${new Date().toISOString()} ${req.socket.remoteAddress} ${req.method} ${pfad}`);
    try {
      const ticket = pfad.match(/^\/api\/ticket\/([0-9a-f]{16})$/);
      if (ticket && (req.method === 'PUT' || req.method === 'PATCH')) {
        return koerperLesen(req).then(k => {
          const z = ticketAendern(a.ordner, ticket[1], k);
          if (!z) return json(res, 404, { fehler: 'Ticket unbekannt' });
          if (z.fehler) return json(res, 400, z);
          return json(res, 200, z);
        }).catch(e => json(res, 400, { fehler: e.message }));
      }
      if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { fehler: 'nur GET, Tickets per PUT' });
      if (pfad === '/' || pfad === '/index.html') {
        if (!fs.existsSync(SEITE)) return antwort(res, 500, 'seite.html fehlt', 'text/plain; charset=utf-8');
        return antwort(res, 200, fs.readFileSync(SEITE), 'text/html; charset=utf-8');
      }
      if (pfad === '/api/status') return json(res, 200, { jetzt: new Date().toISOString(), ordner: a.ordner, tage: tageListen(a.ordner).length });
      if (pfad === '/api/tage') return json(res, 200, tageListen(a.ordner));
      if (pfad === '/api/board') return json(res, 200, boardLaden(a.ordner));
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
  module.exports = { neuParsen, tageListen, tagLaden, boardLaden, ticketAendern, mailId, start, argumente, tailscaleAdresse };
}
