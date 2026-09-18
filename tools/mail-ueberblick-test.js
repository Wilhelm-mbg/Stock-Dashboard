'use strict';
/* ================= Selbsttest für tools/mail-ueberblick.js =================
 *
 * Baut ein Mini-Thunderbird-Profil unter %TEMP%, füllt einen IMAP-Posteingang mit
 * sechs Mails und prüft, dass das Werkzeug genau die richtigen drei findet:
 *   1 aktuell, ungelesen, Betreff RFC-2047-kodiert, Text quoted-printable  -> Treffer
 *   2 aktuell, aber X-Mozilla-Status 0x0008 (gelöscht)                       -> übersprungen
 *   3 drei Tage alt                                                         -> zu alt
 *   4 aktuell, gelesen, multipart mit text/plain, text/html und PDF-Anhang   -> Treffer (Anhang!)
 *   5 aktuell, X-Mozilla-Status2 0x00200000 (auf dem Server gelöscht)        -> übersprungen
 *   6 aktuell, nur HTML in base64                                            -> Treffer (Text aus HTML)
 * Dazu weitere Ordner (Finanzen, Projekte.sbd/Alpha: mitlesen; Trash, Papierkorb,
 * [Gmail].sbd/Alle Nachrichten: ausnehmen) - siehe unten.
 * Ein zweites Konto hat eine winzige INBOX -> muss als NICHT LESBAR gemeldet werden.
 * Das echte Profil wird nie angefasst (--profil zeigt auf den Temp-Ordner).
 *
 * Aufruf: node tools/mail-ueberblick-test.js   (Exit 0 = alles gut, 1 = Befund) */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const WERKZEUG = path.join(__dirname, 'mail-ueberblick.js');
const basis = fs.mkdtempSync(path.join(os.tmpdir(), 'mail-ueberblick-test-'));
const profil = path.join(basis, 'profil');
const ziel = path.join(basis, 'ziel');
const imap = path.join(profil, 'ImapMail', 'imap.test.com');
const leer = path.join(profil, 'ImapMail', 'imap.leer.com');
fs.mkdirSync(imap, { recursive: true });
fs.mkdirSync(leer, { recursive: true });
fs.writeFileSync(path.join(profil, 'prefs.js'), [
  'user_pref("mail.server.server1.type", "imap");',
  'user_pref("mail.server.server1.userName", "test@example.com");',
  'user_pref("mail.server.server1.directory-rel", "[ProfD]ImapMail/imap.test.com");',
  'user_pref("mail.server.server2.type", "imap");',
  'user_pref("mail.server.server2.userName", "leer@example.com");',
  'user_pref("mail.server.server2.directory-rel", "[ProfD]ImapMail/imap.leer.com");',
  ''
].join('\n'));

const jetzt = new Date();
function rfc(d) { return d.toUTCString().replace('GMT', '+0000'); }
function fromZeile(d) {
  const w = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getUTCDay()];
  const m = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][d.getUTCMonth()];
  const p = n => String(n).padStart(2, '0');
  return `From - ${w} ${m} ${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}:${p(d.getUTCSeconds())} ${d.getUTCFullYear()}`;
}
const vor = h => new Date(jetzt.getTime() - h * 3600 * 1000);

const mails = [];
// 0 sechs Tage alt und 6 MB groß (Anhang): steht am Dateianfang, damit der Schwanz-Leser
//   beweisen muss, dass er NICHT die ganze Datei liest (Stoppkriterium greift).
mails.push([fromZeile(vor(144)), 'X-Mozilla-Status: 0001', 'X-Mozilla-Status2: 00000000',
  'From: gross@example.com', 'Subject: Grosser alter Anhang', `Date: ${rfc(vor(144))}`,
  'Content-Type: multipart/mixed; boundary="GROSS"', '',
  '--GROSS', 'Content-Type: text/plain', '', 'Alt und gross.', '',
  '--GROSS', 'Content-Type: application/octet-stream; name="ballast.bin"', 'Content-Transfer-Encoding: base64', '',
  Buffer.alloc(6 * 1024 * 1024, 7).toString('base64').replace(/(.{76})/g, '$1\n'), '',
  '--GROSS--', ''].join('\n'));
// 1 aktuell, ungelesen, kodierter Betreff, quoted-printable
mails.push([fromZeile(vor(2)), 'X-Mozilla-Status: 0000', 'X-Mozilla-Status2: 00000000',
  'From: =?UTF-8?B?SsO8cmdlbiBUZXN0?= <juergen@example.com>', 'To: test@example.com',
  'Subject: =?UTF-8?B?UmVjaG51bmcgw7xiZXJmw6RsbGln?=', `Date: ${rfc(vor(2))}`,
  'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: quoted-printable', '',
  'Bitte =C3=BCberweisen Sie bis Freitag.', 'Gru=C3=9F', ''].join('\n'));
// 2 aktuell, gelöscht (0x0008)
mails.push([fromZeile(vor(3)), 'X-Mozilla-Status: 0009', 'X-Mozilla-Status2: 00000000',
  'From: weg@example.com', 'Subject: Geloeschte Mail', `Date: ${rfc(vor(3))}`,
  'Content-Type: text/plain; charset=us-ascii', '', 'Sollte nicht erscheinen.', ''].join('\n'));
// 3 drei Tage alt
mails.push([fromZeile(vor(72)), 'X-Mozilla-Status: 0001', 'X-Mozilla-Status2: 00000000',
  'From: alt@example.com', 'Subject: Alte Mail', `Date: ${rfc(vor(72))}`,
  'Content-Type: text/plain; charset=us-ascii', '', 'Drei Tage alt.', ''].join('\n'));
// 4 multipart mit Anhang, gelesen
mails.push([fromZeile(vor(5)), 'X-Mozilla-Status: 0001', 'X-Mozilla-Status2: 00000000',
  'From: "Amt" <amt@example.com>', 'Subject: Bescheid', `Date: ${rfc(vor(5))}`,
  'Content-Type: multipart/mixed; boundary="AUSSEN"', '',
  '--AUSSEN', 'Content-Type: multipart/alternative; boundary="INNEN"', '',
  '--INNEN', 'Content-Type: text/plain; charset=iso-8859-1', 'Content-Transfer-Encoding: quoted-printable', '',
  'Anbei der Bescheid. Widerspruch bis 30.09. m=F6glich.', '',
  '--INNEN', 'Content-Type: text/html; charset=utf-8', '', '<p>Anbei der <b>Bescheid</b>.</p>', '',
  '--INNEN--', '',
  '--AUSSEN', 'Content-Type: application/pdf; name="Bescheid.pdf"', 'Content-Disposition: attachment; filename="Bescheid.pdf"',
  'Content-Transfer-Encoding: base64', '', Buffer.from('%PDF-1.4 fake').toString('base64'), '',
  '--AUSSEN--', ''].join('\n'));
// 5 auf dem Server gelöscht (Status2)
mails.push([fromZeile(vor(1)), 'X-Mozilla-Status: 0000', 'X-Mozilla-Status2: 00200000',
  'From: server@example.com', 'Subject: Serverseitig geloescht', `Date: ${rfc(vor(1))}`,
  'Content-Type: text/plain', '', 'Sollte nicht erscheinen.', ''].join('\n'));
// 6 nur HTML, base64
mails.push([fromZeile(vor(4)), 'X-Mozilla-Status: 0000', 'X-Mozilla-Status2: 00000000',
  'From: Shop <shop@example.com>', 'Subject: Ihre Bestellung ist unterwegs', `Date: ${rfc(vor(4))}`,
  'Content-Type: text/html; charset=utf-8', 'Content-Transfer-Encoding: base64', '',
  Buffer.from('<html><body><h1>Versand</h1><p>Paket kommt &uuml;bermorgen &amp; Gruß.</p></body></html>').toString('base64'), ''].join('\r\n'));
// Mail 6 trägt \r\n wie Thunderbird unter Windows; die Mails 1-5 nur \n. Beides muss gehen.
// Ablagereihenfolge wie im echten Postfach: die alten Mails (0 und 3) stehen vorn, die
// aktuellen hinten. Nur so kann der Schwanz-Leser nach dem ersten 4-MB-Schwanz aufhören.
mails.splice(1, 0, mails.splice(3, 1)[0]);
fs.writeFileSync(path.join(imap, 'INBOX'), mails.join('\n') + '\n', 'latin1');
fs.writeFileSync(path.join(leer, 'INBOX'), '');

// Weitere Ordner desselben Kontos (Entscheid 19.09.2026: alle Ordner lesen):
//   Finanzen               -> aktuelle Mail, muss als Ordner "Finanzen" erscheinen
//   Projekte.sbd/Alpha     -> Unterordner, muss als "Projekte/Alpha" erscheinen
//   Trash, Papierkorb      -> aktuelle Mails, dürfen NICHT erscheinen
//   [Gmail].sbd/Alle Nachrichten -> Kopie jeder Mail, darf NICHT erscheinen (sonst doppelt)
//   INBOX.msf, msgFilterRules.dat -> kein Postfach
function einfach(stunden, absender, betreff, text) {
  return [fromZeile(vor(stunden)), 'X-Mozilla-Status: 0000', 'X-Mozilla-Status2: 00000000',
    `From: ${absender}`, `Subject: ${betreff}`, `Date: ${rfc(vor(stunden))}`,
    'Content-Type: text/plain; charset=utf-8', '', text, ''].join('\n') + '\n';
}
fs.writeFileSync(path.join(imap, 'Finanzen'), einfach(6, 'bank@example.com', 'Kontoauszug bereit', 'Ordnermail Finanzen.'), 'latin1');
fs.mkdirSync(path.join(imap, 'Projekte.sbd'));
fs.writeFileSync(path.join(imap, 'Projekte.sbd', 'Alpha'), einfach(7, 'team@example.com', 'Alpha Status', 'Ordnermail Alpha.'), 'latin1');
fs.writeFileSync(path.join(imap, 'Trash'), einfach(1, 'muell@example.com', 'Papierkorb-Mail', 'Weg damit.'), 'latin1');
fs.writeFileSync(path.join(imap, 'Papierkorb'), einfach(1, 'muell@example.com', 'Papierkorb-Mail zwei', 'Weg damit.'), 'latin1');
fs.mkdirSync(path.join(imap, '[Gmail].sbd'));
fs.writeFileSync(path.join(imap, '[Gmail].sbd', 'Alle Nachrichten'), einfach(2, 'doppelt@example.com', 'Alle-Nachrichten-Kopie', 'Doppelt.'), 'latin1');
fs.writeFileSync(path.join(imap, 'INBOX.msf'), 'Index, kein Postfach');
fs.writeFileSync(path.join(imap, 'msgFilterRules.dat'), 'version="9"');

let fehler = 0;
function pruefe(bedingung, text) { if (!bedingung) { fehler++; console.log('FEHLT: ' + text); } else console.log('ok: ' + text); }

const ausgabe = execFileSync(process.execPath, [WERKZEUG, '--profil', profil, '--ziel', ziel], { encoding: 'utf8' });
console.log(ausgabe);
const dateien = fs.readdirSync(ziel).filter(f => f.startsWith('neu-'));
pruefe(dateien.length === 1, 'genau eine neu-Datei geschrieben');
const inhalt = fs.readFileSync(path.join(ziel, dateien[0]), 'utf8');
const treffer = (inhalt.match(/^#\d+  Konto: /gm) || []).length;
pruefe(treffer === 5, `fünf Treffer: drei aus INBOX, Finanzen, Projekte/Alpha (gefunden ${treffer})`);
pruefe(/Ordner: Finanzen\n[\s\S]*?Betreff: Kontoauszug bereit/.test(inhalt), 'Ordner Finanzen gelesen und benannt');
pruefe(/Ordner: Projekte\/Alpha\n/.test(inhalt), 'Unterordner Projekte.sbd/Alpha als Projekte/Alpha');
pruefe(!inhalt.includes('Papierkorb-Mail'), 'Trash und Papierkorb ausgenommen');
pruefe(!inhalt.includes('Alle-Nachrichten-Kopie'), '[Gmail]-Systemordner ausgenommen (keine Doppelung)');
pruefe(/test@example\.com: 5 neue Mails aus 3 Ordnern \(INBOX 3, Finanzen 1, Projekte\/Alpha 1\)/.test(inhalt), 'Kontenblock zählt je Ordner');
pruefe(inhalt.includes('Betreff: Rechnung überfällig'), 'RFC-2047-Betreff dekodiert');
pruefe(inhalt.includes('Absender: Jürgen Test <juergen@example.com>'), 'RFC-2047-Absender dekodiert');
pruefe(inhalt.includes('Bitte überweisen Sie bis Freitag.'), 'quoted-printable UTF-8 dekodiert');
pruefe(inhalt.includes('Widerspruch bis 30.09. möglich.'), 'text/plain in iso-8859-1 aus multipart bevorzugt');
pruefe(!inhalt.includes('<b>Bescheid</b>'), 'HTML-Teil nicht genommen, wenn text/plain da ist');
pruefe(inhalt.includes('Anhänge: Bescheid.pdf'), 'Anhangsname erkannt');
pruefe(inhalt.includes('Paket kommt übermorgen & Gruß.'), 'HTML-only-Mail als Text (base64, Entities)');
pruefe(!inhalt.includes('Geloeschte Mail'), 'gelöschte Mail (0x0008) übersprungen');
pruefe(!inhalt.includes('Serverseitig geloescht'), 'serverseitig gelöschte Mail (Status2) übersprungen');
pruefe(!inhalt.includes('Alte Mail'), 'alte Mail außerhalb des Fensters');
pruefe(/Betreff: Rechnung überfällig[\s\S]*?Status: ungelesen/.test(inhalt), 'ungelesen erkannt');
pruefe(/Betreff: Bescheid\n[\s\S]*?Status: gelesen/.test(inhalt), 'gelesen erkannt');
pruefe(inhalt.includes('leer@example.com: NICHT LESBAR'), 'leeres Konto als NICHT LESBAR gemeldet');
pruefe(/test@example\.com: 5 neue \(4 ungelesen\) aus 3 Ordnern/.test(ausgabe), 'Konsole zählt 5 neue aus 3 Ordnern für das Testkonto');
const mb = ausgabe.match(/gelesen (\d+) von (\d+) MB/);
pruefe(mb && Number(mb[1]) < Number(mb[2]), `nur der Dateischwanz gelesen, nicht die ganze Datei (${mb ? mb[1] + ' von ' + mb[2] + ' MB' : 'keine Angabe'})`);

const probe = execFileSync(process.execPath, [WERKZEUG, '--probe', '--profil', profil], { encoding: 'utf8' });
pruefe(probe.includes('Konto: test@example.com') && probe.includes('Ihre Bestellung ist unterwegs'), '--probe nennt Konto und jüngste Mail');
pruefe(probe.includes('leer@example.com') && probe.includes('NICHT LESBAR'), '--probe meldet leeres Konto');

/* ---- Leseserver (tools/mail-server.js): liest die neu-Datei zurück und liefert sie als JSON */
const server = require('./mail-server.js');
const tage = server.tageListen(ziel);
pruefe(tage.length === 1 && tage[0].neu && !tage[0].bericht, 'Server listet den Tag mit neu-Datei, ohne Bericht');
const tag = server.tagLaden(ziel, tage[0].datum);
pruefe(tag.mails.length === 5, `Server liest alle fünf Mails zurück (gefunden ${tag.mails.length})`);
const fin = tag.mails.find(m => m.ordner === 'Finanzen');
pruefe(fin && fin.absender === 'bank@example.com' && fin.text === 'Ordnermail Finanzen.' && fin.gelesen === false, 'Ordner, Absender, Text und Status stimmen');
const bescheid = tag.mails.find(m => m.betreff === 'Bescheid');
pruefe(bescheid && bescheid.anhaenge.length === 1 && bescheid.anhaenge[0] === 'Bescheid.pdf' && bescheid.gelesen, 'Anhangsliste und gelesen-Status stimmen');
pruefe(tag.konten.some(z => /leer@example\.com: NICHT LESBAR/.test(z)), 'Kontenblock kommt mit');
const http = require('http');
process.exitCode = 1;   // bis die Schlusszeile unten geschrieben ist: ein stiller Abbruch darf nicht grün aussehen
const laufende = server.start(server.argumente(['--port', '0', '--ordner', ziel]));
const s0 = laufende[0];
new Promise((resolve, reject) => { s0.on('listening', resolve); s0.on('error', reject); }).then(() => new Promise((resolve, reject) => {
  http.get(`http://127.0.0.1:${s0.address().port}/api/tag/${tage[0].datum}`, res => {
    let b = ''; res.on('data', c => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, body: b }));
  }).on('error', reject);
})).then(a => {
  pruefe(a.status === 200 && JSON.parse(a.body).mails.length === 5, 'HTTP /api/tag liefert 200 und fünf Mails');
  return new Promise((resolve) => http.get(`http://127.0.0.1:${s0.address().port}/api/tag/2000-01-01`, r => { r.resume(); resolve(r.statusCode); }));
}).then(code => {
  pruefe(code === 404, 'unbekannter Tag: 404');
}).catch(e => { fehler++; console.log('FEHLT: Server-Anfrage: ' + e.message); }).finally(() => {
  laufende.forEach(s => s.close());
  fs.rmSync(basis, { recursive: true, force: true });
  console.log(fehler ? `\n${fehler} Befund(e)` : '\nAlles gut.');
  process.exitCode = fehler ? 1 : 0;
});
