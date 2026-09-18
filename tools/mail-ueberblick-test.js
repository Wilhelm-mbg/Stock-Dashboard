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

let fehler = 0;
function pruefe(bedingung, text) { if (!bedingung) { fehler++; console.log('FEHLT: ' + text); } else console.log('ok: ' + text); }

const ausgabe = execFileSync(process.execPath, [WERKZEUG, '--profil', profil, '--ziel', ziel], { encoding: 'utf8' });
console.log(ausgabe);
const dateien = fs.readdirSync(ziel).filter(f => f.startsWith('neu-'));
pruefe(dateien.length === 1, 'genau eine neu-Datei geschrieben');
const inhalt = fs.readFileSync(path.join(ziel, dateien[0]), 'utf8');
const treffer = (inhalt.match(/^#\d+  Konto: /gm) || []).length;
pruefe(treffer === 3, `drei Treffer (gefunden ${treffer})`);
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
pruefe(/test@example\.com: 3 neue/.test(ausgabe), 'Konsole zählt 3 neue für das Testkonto');
const mb = ausgabe.match(/gelesen (\d+) von (\d+) MB/);
pruefe(mb && Number(mb[1]) < Number(mb[2]), `nur der Dateischwanz gelesen, nicht die ganze Datei (${mb ? mb[1] + ' von ' + mb[2] + ' MB' : 'keine Angabe'})`);

const probe = execFileSync(process.execPath, [WERKZEUG, '--probe', '--profil', profil], { encoding: 'utf8' });
pruefe(probe.includes('Konto: test@example.com') && probe.includes('Ihre Bestellung ist unterwegs'), '--probe nennt Konto und jüngste Mail');
pruefe(probe.includes('leer@example.com') && probe.includes('NICHT LESBAR'), '--probe meldet leeres Konto');

fs.rmSync(basis, { recursive: true, force: true });
console.log(fehler ? `\n${fehler} Befund(e)` : '\nAlles gut.');
process.exitCode = fehler ? 1 : 0;
