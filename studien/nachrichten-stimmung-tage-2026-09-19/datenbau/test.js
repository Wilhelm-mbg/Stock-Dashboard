'use strict';
/* Pruefungen des Datenbaus (Auftrag Nr. 47). Kunstfaelle + Spaltenprobe an einer echten GKG-Datei; kein Netz.
 * Aufruf: node test.js [pfad/zu/probe.gkg.csv.zip]   (sonst ../../gdelt-abdeckung-2026-09-19/voll/probe.gkg.csv.zip)
 * Alle gruen vor jedem Lauf. Simulation, keine Anlageberatung. */
var fs = require('fs'), path = require('path');
var G = require('./gkg-tage.js');
var S = require(path.join(__dirname, '..', 'signal.js'));
var KONST = require(path.join(__dirname, '..', 'konstanten.js'));
var N = require(path.join(__dirname, '..', '..', 'gdelt-abdeckung-2026-09-19', 'namen.js'));
var n = 0, rot = 0;
function ok(bed, text) { n++; if (!bed) { rot++; process.stdout.write('ROT  ' + text + '\n'); } }
function wirft(fn, re) { try { fn(); return false; } catch (e) { return re ? re.test(e.message) : true; } }
function nah(a, b) { return Math.abs(a - b) < 1e-9; }

/* ---------- Kunstzeilen ---------- */
function zeile(id, datum, org, ton) {
  var c = []; for (var i = 0; i < G.SPALTEN; i++) c.push('');
  c[0] = id; c[G.SP_DATUM] = datum; c[3] = 'test.example'; c[4] = 'https://test.example/' + id; c[G.SP_ORG] = org; c[G.SP_TON] = ton + ',1,2,3,4,5,100';
  return c.join('\t');
}
var KARTE = G.karteAus({ kennung: 'test', karte: { AAPL: { voll: 'apple', voll2: null, klasse: 3 }, MSFT: { voll: 'microsoft', voll2: 'microsoft corporation x', klasse: 3 }, XYZ: { voll: 'xyz werke', klasse: 2 } } });
function zaehle(zeilen, dateiStempel) {
  var B = {}, z = G.neueZaehler(96);
  G.zaehleText(zeilen.join('\n') + '\n', KARTE, dateiStempel || '20250715120000', B, z, 5);
  return { B: B, z: z, abl: function (tag) { return B[tag] ? G.symboleAblage(B[tag]) : {}; } };
}
function erg(tag, symbole) { return { tag: tag, symbole: symbole }; }

/* ---------- 0. Eine Stelle fuer Zeitzone und Schnitt ---------- */
var quelle = fs.readFileSync(path.join(__dirname, 'gkg-tage.js'), 'utf8');
ok(!/Intl\s*\./.test(quelle) && !/timeZone/.test(quelle), 'Werkzeug rechnet die Zeitzone selbst statt ueber signal.js -> stempelET');
ok(G.SCHNITT === KONST.SCHNITT_ET && G.SCHNITT === '16:00:00', 'Schnitt nicht aus konstanten.js: ' + G.SCHNITT);
ok(G.KENNUNG === 'nachrichten-stimmung-tage-2026-09-19/gdelt/v1', 'Kennung');

/* ---------- 1. Datei-Menge je ET-Tag: 96 / 92 / 100 ---------- */
function mengeOk(tag, soll, erste, letzte) {
  var l = G.stempelDesETTages(tag);
  ok(l.length === soll && l[0] === erste && l[l.length - 1] === letzte, 'ET-Tag ' + tag + ': ' + l.length + ' Dateien ' + l[0] + '..' + l[l.length - 1] + ', erwartet ' + soll + ' ' + erste + '..' + letzte);
}
mengeOk('2025-07-15', 96, '20250715040000', '20250716034500');          // Sommer (EDT, UTC-4)
mengeOk('2025-01-15', 96, '20250115050000', '20250116044500');          // Winter (EST, UTC-5)
mengeOk('2025-03-09', 92, '20250309050000', '20250310034500');          // Umstelltag Maerz: 23 Stunden
mengeOk('2025-11-02', 100, '20251102040000', '20251103044500');         // Umstelltag November: 25 Stunden
mengeOk('2017-03-12', 92, '20170312050000', '20170313034500');
mengeOk('2026-11-01', 100, '20261101040000', '20261102044500');
/* Luecken- und ueberschneidungsfrei ueber beide Umstellungen: die ET-Tage kacheln die UTC-Viertelstunden genau einmal. */
[['2025-03-01', '2025-03-20'], ['2025-10-25', '2025-11-10']].forEach(function (b) {
  var alle = []; G.tageVonBis(b[0], b[1]).forEach(function (t) { alle = alle.concat(G.stempelDesETTages(t)); });
  var luecke = 0; for (var i = 1; i < alle.length; i++) if (Date.parse(alle[i].replace(/(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/, '$1-$2-$3T$4:$5:$6Z')) - Date.parse(alle[i - 1].replace(/(\d{4})(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/, '$1-$2-$3T$4:$5:$6Z')) !== 900000) luecke++;
  ok(luecke === 0 && new Set(alle).size === alle.length, 'Kachelung ' + b.join('..') + ': ' + luecke + ' Spruenge');
});
ok(G.stempelDesUTCTages('2025-06-02').length === 96 && G.stempelDesUTCTages('2025-06-02')[95] === '20250602234500', 'UTC-Tag (Kontrolle)');

/* ---------- 2. Zuordnung: Schnitt 16:00:00 ET, Sommer, Winter, beide Umstelltage ---------- */
function fall(name, stempel, tag, spaet) {
  var r = zaehle([zeile('X-1', stempel, 'Apple Inc,10', 2)]), a = r.abl(tag).AAPL;
  ok(a && a.n === (spaet ? 0 : 1) && a.nSpaet === (spaet ? 1 : 0), name + ': ' + stempel + ' -> ' + JSON.stringify(a) + ' (erwartet ' + tag + (spaet ? ' spaet' : ' n') + ')');
}
fall('Sommer 16:00:00 EDT gehoert zu t', '20250715200000', '2025-07-15', false);
fall('Sommer 16:00:01 EDT ist spaet', '20250715200001', '2025-07-15', true);
fall('Sommer 15:59:59 EDT', '20250715195959', '2025-07-15', false);
fall('Winter 16:00:00 EST gehoert zu t', '20250115210000', '2025-01-15', false);
fall('Winter 16:00:01 EST ist spaet', '20250115210001', '2025-01-15', true);
fall('Winter 20:00 UTC = 15:00 EST', '20250115200000', '2025-01-15', false);
fall('Maerz-Umstelltag 16:00:00 EDT', '20250309200000', '2025-03-09', false);
fall('Maerz-Umstelltag 16:00:01 EDT', '20250309200001', '2025-03-09', true);
fall('Maerz-Umstelltag 00:30 EST (vor der Umstellung)', '20250309053000', '2025-03-09', false);
fall('November-Umstelltag 16:00:00 EST', '20251102210000', '2025-11-02', false);
fall('November-Umstelltag 16:00:01 EST', '20251102210001', '2025-11-02', true);
fall('November-Umstelltag 20:00 UTC = 15:00 EST', '20251102200000', '2025-11-02', false);
fall('November-Umstelltag 01:30 EDT (erste Stunde doppelt)', '20251102053000', '2025-11-02', false);
/* ET-Kalendertag statt UTC-Datum: 02:00 UTC Dienstag = 22:00 ET Montag -> Montag, spaet. */
fall('02:00 UTC 03.06. = 22:00 EDT 02.06.', '20250603020000', '2025-06-02', true);
fall('03:59:59 UTC 02.06. = 23:59:59 EDT 01.06.', '20250602035959', '2025-06-01', true);
fall('04:00 UTC 02.06. = 00:00 EDT 02.06.', '20250602040000', '2025-06-02', false);
var r03 = zaehle([zeile('X-1', '20250603020000', 'Apple Inc,10', 2)]);
ok(!r03.B['2025-06-03'], '02:00 UTC 03.06. landet nicht im Eimer 03.06.');

/* ---------- 3. Leck-Positivkontrolle ---------- */
/* (a) Eine praeparierte Zeile nach 16:00 ET zwischen sauberen Zeilen darf nie in n landen. */
var lk = zaehle([zeile('L-1', '20250715140000', 'Apple Inc,1', 1), zeile('L-2', '20250715200001', 'Apple Inc,1', 99), zeile('L-3', '20250715150000', 'Apple Inc,1', 3), zeile('L-4', '20250716120000', 'Apple Inc,1', 77)]);
var la = lk.abl('2025-07-15').AAPL;
ok(la.n === 2 && nah(la.ton, 2) && la.nSpaet === 1 && la.letzterStempel === '20250715150000', 'Leck: spaete Zeile im Signal ' + JSON.stringify(la));
ok(nah(la.tonAlle, (1 + 99 + 3) / 3), 'tonAlle ueber alle Artikel des ET-Tags');
ok(lk.abl('2025-07-16').AAPL.n === 1, 'Artikel vom 16.07. liegt im eigenen Eimer');
/* (b) Die Klinke pruefeTag muss praeparierte Ablagen verwerfen. */
ok(!wirft(function () { G.pruefeTag(erg('2025-07-15', lk.abl('2025-07-15'))); }), 'saubere Ablage besteht die Klinke');
ok(wirft(function () { G.pruefeTag(erg('2025-07-15', { AAPL: { ton: 1, n: 1, nSpaet: 0, tonAlle: 1, letzterStempel: '20250715200001' } })); }, /Leck/), 'Klinke: letzterStempel 16:00:01 ET wird nicht verworfen');
ok(wirft(function () { G.pruefeTag(erg('2025-07-15', { AAPL: { ton: 1, n: 1, nSpaet: 0, tonAlle: 1, letzterStempel: '20250716120000' } })); }, /Leck/), 'Klinke: Stempel t+1 wird nicht verworfen');
ok(wirft(function () { G.pruefeTag(erg('2025-07-15', { AAPL: { ton: 1, n: 1, nSpaet: 0, tonAlle: 1, letzterStempel: '20250603020000' } })); }, /Leck/), 'Klinke: fremder Tag wird nicht verworfen');
ok(wirft(function () { G.pruefeTag(erg('2025-07-15', { AAPL: { ton: 1, n: 0, nSpaet: 1, tonAlle: 1, letzterStempel: null } })); }), 'Klinke: n=0 mit Ton wird nicht verworfen');
ok(!wirft(function () { G.pruefeTag(erg('2025-07-15', { AAPL: { ton: 1, n: 1, nSpaet: 0, tonAlle: 1, letzterStempel: '20250715200000' } })); }), 'Klinke: 16:00:00 ET genau ist erlaubt');
/* (c) Gegenprobe mit der Klinke der Messung: die abgelegten n-Artikel bestehen tagesSignal ohne Wurf und ohne "spaet". */
var sig = S.tagesSignal([{ stempel: '20250715140000', ton: 1 }, { stempel: la.letzterStempel, ton: 3 }], { iso: '2025-07-15', dateien: 96 });
ok(sig.spaet === 0 && sig.n === 2, 'letzterStempel faellt in tagesSignal nicht als spaet');

/* ---------- 4. n + nSpaet = Gesamtzahl je Symbol-Tag (Kunstdatei ueber zwei ET-Tage) ---------- */
var zl = [], soll = {};
for (var i = 0; i < 400; i++) {
  var ms = Date.parse('2025-11-01T18:00:00Z') + i * 331 * 1000;                     // 36 Stunden ueber den November-Umstelltag
  var st = new Date(ms).toISOString().replace(/[-:T]/g, '').slice(0, 14);
  var org = ['Apple Inc,5', 'Microsoft Corp,7;Apple,9', 'Microsoft Corporation X,1', 'Apple Inc,1;APPLE INC.,40', 'Keine Firma,3'][i % 5];
  zl.push(zeile('N-' + i, st, org, (i % 11) - 5));
  var tagET = S.stempelET(st).iso, syms = {};
  org.split(';').forEach(function (e) { var nm = N.normalisieren(e.slice(0, e.lastIndexOf(','))); (KARTE.voll[nm] || []).forEach(function (s) { syms[s] = 1; }); });
  Object.keys(syms).forEach(function (s) { var k = tagET + '|' + s; soll[k] = (soll[k] || 0) + 1; });
}
var rz = zaehle(zl), ist = {};
Object.keys(rz.B).forEach(function (t) { var a = rz.abl(t); Object.keys(a).forEach(function (s) { ist[t + '|' + s] = a[s].n + a[s].nSpaet; }); });
ok(JSON.stringify(Object.keys(ist).sort().map(function (k) { return k + '=' + ist[k]; })) === JSON.stringify(Object.keys(soll).sort().map(function (k) { return k + '=' + soll[k]; })), 'n + nSpaet != Gesamtzahl: ' + JSON.stringify(ist) + ' / ' + JSON.stringify(soll));
ok(rz.z.treffer === Object.keys(soll).reduce(function (a, k) { return a + soll[k]; }, 0), 'Trefferzaehler');
Object.keys(rz.B).forEach(function (t) { ok(!wirft(function () { G.pruefeTag(erg(t, rz.abl(t))); }), 'Klinke auf der Kunstdatei, Tag ' + t); });
/* Doppelnennung in EINEM Artikel zaehlt einmal; voll2 trifft. */
var dop = zaehle([zeile('D-1', '20250715120000', 'Apple Inc,1;APPLE INC.,40;Apple,9', 1), zeile('D-2', '20250715120000', 'Microsoft Corporation X,1', 1)]).abl('2025-07-15');
ok(dop.AAPL.n === 1 && dop.MSFT.n === 1, 'Doppelnennung / voll2: ' + JSON.stringify(dop));

/* ---------- 5. Stempel aus der Datums-Spalte; Rueckfall auf den Dateistempel wird gezaehlt ---------- */
var fb = zaehle([zeile('F-1', '0', 'Apple Inc,1', 1), zeile('F-2', '20250715121500', 'Apple Inc,1', 1)], '20250715120000');
ok(fb.z.stempelAusDatei === 1 && fb.z.stempelUngleichDatei === 1 && fb.abl('2025-07-15').AAPL.letzterStempel === '20250715121500', 'Datums-Spalte / Rueckfall: ' + JSON.stringify(fb.z));

/* ---------- 6. Deterministisch: zweimal gezaehlt = bytegleich (Reservoir ohne Math.random) ---------- */
var z1 = zaehle(zl), z2 = zaehle(zl);
ok(JSON.stringify(z1.B) === JSON.stringify(z2.B), 'Zaehlung nicht deterministisch');
ok(Object.keys(z1.B).every(function (t) { return Object.keys(z1.B[t].stich).every(function (k) { return z1.B[t].stich[k].length <= 5; }); }), 'Reservoirgroesse');

/* ---------- 7. Spaltenprobe an einer echten Datei (wie Nr. 44, dazu die Datums-Spalte) ---------- */
var probeP = process.argv[2] || path.join(__dirname, '..', '..', 'gdelt-abdeckung-2026-09-19', 'voll', 'probe.gkg.csv.zip');
ok(fs.existsSync(probeP), 'Probe-Datei fehlt: ' + probeP);
if (fs.existsSync(probeP)) {
  var csv = G.entpacke(fs.readFileSync(probeP)).toString('utf8'), zeilen = csv.split('\n').filter(Boolean);
  var feld = {}, orgZeilen = 0, orgOk = 0, v1MitOffset = 0, tonOk = 0, tonZeilen = 0, id = 0, datum = 0, datumGleichId = 0;
  zeilen.forEach(function (z) {
    var c = z.replace(/\r$/, '').split('\t'); feld[c.length] = (feld[c.length] || 0) + 1;
    if (c.length !== G.SPALTEN) return;
    if (/^\d{14}-T?\d+$/.test(c[0])) id++;
    if (/^\d{14}$/.test(c[G.SP_DATUM])) { datum++; if (c[0].slice(0, 14) === c[G.SP_DATUM]) datumGleichId++; }
    var org = c[G.SP_ORG];
    if (org) { orgZeilen++; if (org.split(';').every(function (x) { return /^.+,\d+$/.test(x); })) orgOk++; }
    var v1 = c[G.SP_ORG - 1]; if (v1) v1.split(';').forEach(function (x) { if (/,\d+$/.test(x)) v1MitOffset++; });
    var t = c[G.SP_TON]; if (t) { tonZeilen++; var f = t.split(','); if (f.length === 7 && f.every(function (x) { return x !== '' && isFinite(+x); }) && Math.abs(+f[0]) <= 100) tonOk++; }
  });
  var n27 = feld[G.SPALTEN] || 0;
  ok(zeilen.length > 500 && n27 / zeilen.length >= 0.99, 'Feldzahlen ' + JSON.stringify(feld));
  ok(id === n27, 'GKGRECORDID-Form in ' + id + ' von ' + n27);
  ok(datum === n27, 'Spalte 2 (V2.1DATE) ist in ' + datum + ' von ' + n27 + ' Zeilen ein 14-stelliger Stempel');
  ok(orgZeilen > 100 && orgOk === orgZeilen, 'Spalte 15 (V2EnhancedOrganizations): ' + orgOk + ' von ' + orgZeilen);
  ok(v1MitOffset === 0, 'Spalte 14 traegt Offsets - Spaltenindex verschoben?');
  ok(tonZeilen === n27 && tonOk === tonZeilen, 'Spalte 16 (V1.5Tone): ' + tonOk + ' von ' + tonZeilen);
  var pr = { B: {}, z: G.neueZaehler(96) };
  G.zaehleText(csv, G.karteAus({ kennung: 't', karte: { AAPL: { voll: 'apple', klasse: 3 } } }), zeilen[0].split('\t')[0].slice(0, 14), pr.B, pr.z, 10);
  ok(pr.z.zeilen === zeilen.length && pr.z.stempelAusDatei === 0, 'Zaehlprobe an der echten Datei: ' + JSON.stringify({ zeilen: pr.z.zeilen, stempelAusDatei: pr.z.stempelAusDatei }));
  process.stdout.write('Spaltenprobe: ' + zeilen.length + ' Zeilen, Feldzahlen ' + JSON.stringify(feld) + ', DATE 14-stellig ' + datum + '/' + n27 + ' (gleich GKGRECORDID-Stempel ' + datumGleichId + '), Org ' + orgOk + '/' + orgZeilen + ', Ton ' + tonOk + '/' + tonZeilen + ', AAPL-Treffer ' + pr.z.treffer + '\n');
}

/* ---------- 8. Namenskarte v2 (sobald gebaut) ---------- */
var karteP = path.join(__dirname, 'namenskarte-v2.json');
if (fs.existsSync(karteP)) {
  var j = JSON.parse(fs.readFileSync(karteP, 'utf8')), medien = j.medienAusgeschlossen.liste, wieder = j.wiederverwendetAusgeschlossen.liste;
  ok(j.kennung === 'nachrichten-stimmung-tage-2026-09-19/namenskarte/v2' && /panel\/v2$/.test(j.panel), 'Karten-Kennung/Panel');
  ok(medien.length === 25, 'Medienliste mit ' + medien.length + ' Kuerzeln');
  var syms = Object.keys(j.karte);
  ok(syms.every(function (s) { return medien.indexOf(s.replace(/~\d+$/, '')) < 0; }), 'Medienkuerzel in der Karte');
  ok(syms.every(function (s) { return wieder.indexOf(s) < 0 && !/~\d+$/.test(s); }), 'wiederverwendetes Kuerzel in der Karte');
  ok(syms.every(function (s) { var k = j.karte[s]; return (k.klasse === 2 || k.klasse === 3) && (!k.voll || N.normalisieren(k.voll) === k.voll) && (!k.voll2 || N.normalisieren(k.voll2) === k.voll2); }), 'Klasse/Normalisierung');
  ok(Object.keys(j.stichtage).length === 116 && Object.keys(j.stichtage).every(function (t) { return t.slice(8) <= '07'; }), 'Stichtage: ' + Object.keys(j.stichtage).length + ' erste Handelstage erwartet 116');
  ok(syms.length === j.zaehler.symbole && syms.length > 600, 'Symbolzahl ' + syms.length);
  ok(j.karte.AAPL && j.karte.AAPL.voll === 'apple', 'AAPL');
  var gk = G.ladeKarte(karteP);
  ok(gk.symbole === syms.length && gk.voll.apple && gk.voll.apple.indexOf('AAPL') >= 0, 'ladeKarte');
} else ok(true, 'Karte v2 noch nicht gebaut');

/* ---------- 9. Schlanker Rohauszug (Nachtrag 3) ---------- */
var zlib = require('zlib'), os = require('os');
function teileB(buf, b) { var l = [], p = 0, q; while ((q = buf.indexOf(b, p)) >= 0) { l.push(buf.subarray(p, q)); p = q + 1; } l.push(buf.subarray(p)); return l; }
/** Baut eine Zeile als Buffer; `felder` sind Buffer oder Strings, fehlende Spalten bleiben leer. */
function zeileB(felder, spalten) {
  var c = []; for (var i = 0; i < (spalten || G.SPALTEN); i++) c.push(Buffer.alloc(0));
  Object.keys(felder).forEach(function (i) { c[i] = Buffer.isBuffer(felder[i]) ? felder[i] : Buffer.from(String(felder[i])); });
  var aus = []; c.forEach(function (f, i) { if (i) aus.push(Buffer.from('\t')); aus.push(f); });
  return Buffer.concat(aus);
}
/* Kunstdatei: mit/ohne Firma, falsche Feldzahl, CRLF, letzte Zeile ohne Zeilenende, ungueltige UTF-8-Bytes neben den Tabs. */
var kaputt = Buffer.from([0xff, 0x41, 0xc3]);                                     // ungueltige Bytes, auch direkt vor einem Tab
var kz = [
  zeileB({ 0: '20250715120000-1', 1: '20250715120000', 3: Buffer.concat([Buffer.from('a.example'), kaputt]), 4: 'https://a.example/1', 14: Buffer.concat([Buffer.from('Apple Inc,10;'), kaputt, Buffer.from(',20')]), 15: '2.5,1,2,3,4,5,100' }),
  zeileB({ 0: '20250715120000-2', 1: '20250715120000', 3: 'b.example', 4: 'https://b.example/2', 14: '', 15: '0,0,0,0,0,0,10' }),
  zeileB({ 0: '20250715120000-3', 14: 'Falsche Feldzahl,1' }, G.SPALTEN - 1),
  zeileB({ 0: '20250715120000-4', 14: 'Auch falsch,1' }, G.SPALTEN + 1),
  Buffer.concat([zeileB({ 0: '20250715120000-5', 1: '20250715121500', 3: 'c.example', 4: 'https://c.example/5', 14: 'Keine Firma,3', 15: '-1,0,1,1,0,0,50' }), Buffer.from('\r')]),
  Buffer.alloc(0),
  zeileB({ 0: '20250715120000-6', 1: '20250715123000', 3: 'd.example', 4: 'https://d.example/6', 14: 'Microsoft Corp,7', 15: 'kein Ton' }),
  zeileB({ 0: '20250715120000-7', 1: '20250715124500', 3: 'e.example', 4: 'https://e.example/7', 14: 'Apple,9', 15: '1,1,0,1,0,0,9' })
];
var kunst = Buffer.concat([kz[0], Buffer.from('\n'), kz[1], Buffer.from('\n'), kz[2], Buffer.from('\n'), kz[3], Buffer.from('\n'), kz[4], Buffer.from('\n'), kz[5], Buffer.from('\n'), kz[6], Buffer.from('\n'), kz[7]]);
var kZ = { B: {}, z: G.neueZaehler(96) };
G.zaehleText(kunst.toString('utf8'), KARTE, '20250715120000', kZ.B, kZ.z, 5);
var ka = G.rohAuszug(kunst);
ok(ka.zeilen === 4 && ka.zeilen === kZ.z.mitOrganisation, 'Auszug ' + ka.zeilen + ' Zeilen, mitOrganisation ' + kZ.z.mitOrganisation + ' (erwartet 4)');
/* Feldinhalt bytegleich zur Quelle, Reihenfolge der Quelle, keine CR und keine Ersatzzeichen. */
var aZeilen = ka.buf.length ? teileB(ka.buf, 10).slice(0, -1) : [];
var quellZeilen = [kz[0], kz[4], kz[6], kz[7]], bytegleich = 0;
aZeilen.forEach(function (z, i) {
  var f = teileB(z, 9), s = teileB(quellZeilen[i].subarray(0, quellZeilen[i].length - (quellZeilen[i][quellZeilen[i].length - 1] === 13 ? 1 : 0)), 9);
  if (f.length === 6 && G.ROH_SPALTEN.every(function (sp, j) { return f[j].equals(s[sp]); })) bytegleich++;
});
ok(bytegleich === 4 && aZeilen.length === 4, 'Feldinhalt bytegleich zur Quelle: ' + bytegleich + ' von ' + aZeilen.length);
ok(ka.buf.indexOf(13) < 0 && ka.buf.indexOf(0xef) < 0 && ka.buf.indexOf(0xff) >= 0, 'Auszug traegt CR oder Ersatzzeichen statt der Quellbytes');
ok(G.rohAuszug(Buffer.alloc(0)).zeilen === 0 && G.rohAuszug(Buffer.from('\n\n')).zeilen === 0, 'leere Datei');
/* Roh-Klinke: Zeilenzahl muss zum Zaehler passen. */
ok(wirft(function () { G.rohFuegeAn(G.rohNeu(), '20250715120000', kunst, 3); }, /Roh-Klinke/), 'Roh-Klinke bei abweichender Zeilenzahl');
/* gzip mit mehreren Gliedern liest sich als eine Datei. */
var g1 = zlib.gzipSync(Buffer.from('a\n')), g2 = zlib.gzipSync(Buffer.from('b\n'));
ok(zlib.gunzipSync(Buffer.concat([g1, g2])).toString() === 'a\nb\n', 'mehrgliedriges gzip');

/* ---------- 10. Ablage je UTC-Dateitag: Stuecke, Vereinen, abgebrochener Tag ---------- */
function zipVon(csv) {
  var roh = zlib.deflateRawSync(csv), nm = Buffer.from('gkg.csv');
  var lok = Buffer.alloc(30); lok.writeUInt32LE(0x04034b50, 0); lok.writeUInt16LE(8, 8); lok.writeUInt32LE(roh.length, 18); lok.writeUInt32LE(csv.length, 22); lok.writeUInt16LE(nm.length, 26);
  var cd = Buffer.alloc(46); cd.writeUInt32LE(0x02014b50, 0); cd.writeUInt16LE(8, 10); cd.writeUInt32LE(roh.length, 20); cd.writeUInt32LE(csv.length, 24); cd.writeUInt16LE(nm.length, 28); cd.writeUInt32LE(0, 42);
  var eo = Buffer.alloc(22); eo.writeUInt32LE(0x06054b50, 0); eo.writeUInt16LE(1, 8); eo.writeUInt16LE(1, 10); eo.writeUInt32LE(46 + nm.length, 12); eo.writeUInt32LE(30 + nm.length + roh.length, 16);
  return Buffer.concat([lok, nm, roh, cd, nm, eo]);
}
/* Je Datei 3 Zeilen, 2 davon mit Firma. Jede Viertelstunde :15 fehlt (404, 24 je UTC-Tag); ein Stempel bricht den Lauf ab. */
function kunstDatei(st) {
  return Buffer.concat([zeileB({ 0: st + '-1', 1: st, 3: 'q.example', 4: 'https://q.example/' + st, 14: 'Apple Inc,10', 15: '2,1,1,2,0,0,80' }), Buffer.from('\n'),
    zeileB({ 0: st + '-2', 1: st, 3: 'q.example', 4: 'https://q.example/' + st + 'b', 14: '', 15: '0,0,0,0,0,0,9' }), Buffer.from('\n'),
    zeileB({ 0: st + '-3', 1: st, 3: 'q.example', 4: 'https://q.example/' + st + 'c', 14: 'Foo Corp,1', 15: '-1,0,1,1,0,0,40' }), Buffer.from('\n')]);
}
var abbruchBei = null;
function holeKunst(url) {
  var st = /(\d{14})\.gkg/.exec(url)[1];
  if (st === abbruchBei) return Promise.reject(new Error('Netz weg (Kunstabbruch)'));
  if (st.slice(10, 12) === '15') return Promise.resolve({ status: 404, buf: null });
  return Promise.resolve({ status: 200, buf: zipVon(kunstDatei(st)) });
}
var AUS = fs.mkdtempSync(path.join(os.tmpdir(), 'gdelt-roh-'));
fs.mkdirSync(path.join(AUS, 'tage'), { recursive: true });
fs.mkdirSync(path.join(AUS, 'roh', '_teile'), { recursive: true });
function dateien(d) { return fs.existsSync(d) ? fs.readdirSync(d).sort() : []; }
function stille() { }

(async function () {
  var opt = { reservoir: 5, dateienGesamt: 0, start: Date.now(), hole: holeKunst, abstand: 0 };
  /* (a) Abgebrochener Tag: weder Tagesdatei noch Stueck, erst recht keine fertige .tsv.gz. */
  abbruchBei = '20250716120000';
  var geworfen = false;
  try { await G.verarbeiteTag('2025-07-16', KARTE, opt, AUS, stille); } catch (e) { geworfen = true; }
  abbruchBei = null;
  ok(geworfen, 'Abbruch mitten im Tag wirft');
  ok(dateien(path.join(AUS, 'tage')).length === 0, 'abgebrochener Tag hinterlaesst eine Tagesdatei');
  ok(dateien(path.join(AUS, 'roh')).filter(function (f) { return /\.tsv\.gz$/.test(f); }).length === 0 && dateien(path.join(AUS, 'roh', '_teile')).length === 0,
    'abgebrochener Tag hinterlaesst eine .tsv.gz oder ein Stueck: ' + dateien(path.join(AUS, 'roh')).concat(dateien(path.join(AUS, 'roh', '_teile'))).join(' '));

  /* (b) Ein vollstaendiger ET-Tag legt zwei Stuecke, aber keinen fertigen UTC-Tag (beide Partner fehlen). */
  var v15 = await G.verarbeiteTag('2025-07-15', KARTE, opt, AUS, stille);
  ok(JSON.stringify(v15.roh) === JSON.stringify({ '2025-07-15': 'wartet', '2025-07-16': 'wartet' }), 'Stuecke des ET-Tags: ' + JSON.stringify(v15.roh));
  ok(dateien(path.join(AUS, 'roh')).filter(function (f) { return /\.tsv\.gz$/.test(f); }).length === 0, 'halber UTC-Tag liegt als fertige .tsv.gz');
  ok(v15.rohZeilen === 2 * v15.erg.zaehler.gefunden && v15.erg.zaehler.mitOrganisation === v15.rohZeilen, 'Zeilen im Auszug = Zeilen mit Firma: ' + v15.rohZeilen + ' / ' + v15.erg.zaehler.mitOrganisation);

  /* (c) Der Partner macht den UTC-Tag 2025-07-16 fertig: 96 Stempel, Reihenfolge der Dateien, Inhalt bytegleich. */
  var v16 = await G.verarbeiteTag('2025-07-16', KARTE, opt, AUS, stille);
  ok(v16.roh['2025-07-16'] === 'vereint' && v16.roh['2025-07-17'] === 'wartet', 'Vereinen: ' + JSON.stringify(v16.roh));
  var zielGz = path.join(AUS, 'roh', '2025-07-16.tsv.gz'), beleg = JSON.parse(fs.readFileSync(path.join(AUS, 'roh', '2025-07-16.json'), 'utf8'));
  ok(fs.existsSync(zielGz) && beleg.soll === 96 && beleg.dateien + beleg.fehlend.length === 96 && beleg.fehlend.length === 24 && beleg.zeilen === 2 * beleg.dateien,
    'Beleg des UTC-Tags: ' + JSON.stringify({ soll: beleg.soll, dateien: beleg.dateien, fehlend: beleg.fehlend.length, zeilen: beleg.zeilen }));
  var gzZeilen = teileB(zlib.gunzipSync(fs.readFileSync(zielGz)), 10).slice(0, -1);
  ok(gzZeilen.length === beleg.zeilen, 'Zeilen in der .tsv.gz: ' + gzZeilen.length + ' statt ' + beleg.zeilen);
  ok(teileB(gzZeilen[0], 9)[1].toString() === '20250716000000' && teileB(gzZeilen[gzZeilen.length - 1], 9)[1].toString() === '20250716234500', 'Reihenfolge im Auszug (erste/letzte Datei des UTC-Tags)');
  ok(gzZeilen.every(function (z) { return /^2025071\d{7}-[13]$/.test(teileB(z, 9)[0].toString()) && teileB(z, 9).length === 6; }), 'Auszug traegt fremde Zeilen oder falsche Feldzahl');
  ok(teileB(gzZeilen[0], 9).map(function (f) { return f.toString(); }).join('|') === '20250716000000-1|20250716000000|q.example|https://q.example/20250716000000|Apple Inc,10|2,1,1,2,0,0,80', 'Erste Zeile: ' + teileB(gzZeilen[0], 9).join('|'));
  ok(!dateien(path.join(AUS, 'roh', '_teile')).some(function (f) { return f.indexOf('2025-07-16_') === 0; }), 'Stuecke des fertigen UTC-Tags bleiben liegen');

  /* (d) Sperre und .tmp aus einem Abbruch: der Nachlauf raeumt auf und vereint nach. */
  fs.mkdirSync(path.join(AUS, 'roh', '_teile', '2025-07-15.sperre'));
  fs.writeFileSync(path.join(AUS, 'roh', '2025-07-15.tsv.gz.tmp'), 'halb');
  var v14 = await G.verarbeiteTag('2025-07-14', KARTE, opt, AUS, stille);
  ok(v14.roh['2025-07-15'] === 'gesperrt' && !fs.existsSync(path.join(AUS, 'roh', '2025-07-15.tsv.gz')), 'Sperre haelt das Vereinen auf: ' + JSON.stringify(v14.roh));
  var nl = G.rohNachlauf(AUS);
  ok(nl.sperren === 1 && nl.tmp === 1 && nl.vereint === 1 && fs.existsSync(path.join(AUS, 'roh', '2025-07-15.tsv.gz')), 'Nachlauf: ' + JSON.stringify(nl));
  ok(!fs.existsSync(path.join(AUS, 'roh', '2025-07-15.tsv.gz.tmp')) && JSON.parse(fs.readFileSync(path.join(AUS, 'roh', '2025-07-15.json'), 'utf8')).soll === 96, 'Nachlauf laesst .tmp liegen');
  /* Ein wiederholter Tag legt kein Stueck mehr an, wenn der UTC-Tag schon fertig ist. */
  fs.unlinkSync(path.join(AUS, 'tage', '2025-07-15.json'));
  var w15 = await G.verarbeiteTag('2025-07-15', KARTE, opt, AUS, stille);
  ok(w15.roh['2025-07-15'] === 'schon' && w15.roh['2025-07-16'] === 'schon' && !dateien(path.join(AUS, 'roh', '_teile')).some(function (f) { return f.indexOf('2025-07-15_') === 0 || f.indexOf('2025-07-16_') === 0; }),
    'wiederholter Tag legt neue Stuecke: ' + JSON.stringify(w15.roh));
  /* Schema-Datei. */
  G.rohSchema(AUS);
  var sch = JSON.parse(fs.readFileSync(path.join(AUS, 'roh', '_schema.json'), 'utf8'));
  ok(sch.kennung === 'nachrichten-stimmung-tage-2026-09-19/gdelt-roh/v1' && sch.spalten.map(function (s) { return s.gkg; }).join(',') === '1,2,4,5,15,16', 'Schema: ' + JSON.stringify(sch.spalten.map(function (s) { return s.gkg; })));

  /* (e) Echte Datei: Auszug = Zeilen mit Firma, jedes Feld bytegleich. */
  if (fs.existsSync(probeP)) {
    var pbuf = G.entpacke(fs.readFileSync(probeP)), pa = G.rohAuszug(pbuf);
    var pz = { B: {}, z: G.neueZaehler(96) };
    G.zaehleText(pbuf.toString('utf8'), KARTE, '20250602120000', pz.B, pz.z, 5);
    ok(pa.zeilen === pz.z.mitOrganisation, 'echte Datei: Auszug ' + pa.zeilen + ' Zeilen, mitOrganisation ' + pz.z.mitOrganisation);
    var qz = teileB(pbuf, 10).filter(function (z) { return z.length; }).map(function (z) { return z[z.length - 1] === 13 ? z.subarray(0, z.length - 1) : z; })
      .map(function (z) { return teileB(z, 9); }).filter(function (f) { return f.length === G.SPALTEN && f[G.SP_ORG].length; });
    var az = teileB(pa.buf, 10).slice(0, -1).map(function (z) { return teileB(z, 9); }), gleich = 0;
    az.forEach(function (f, i) { if (f.length === 6 && G.ROH_SPALTEN.every(function (sp, j) { return f[j].equals(qz[i][sp]); })) gleich++; });
    ok(qz.length === az.length && gleich === az.length, 'echte Datei bytegleich: ' + gleich + ' von ' + az.length + ' (Quelle ' + qz.length + ')');
    var gz = zlib.gzipSync(pa.buf);
    process.stdout.write('Rohauszug der Probe: ' + pa.zeilen + ' von ' + teileB(pbuf, 10).filter(function (z) { return z.length; }).length + ' Zeilen, '
      + (pa.buf.length / 1048576).toFixed(2) + ' MB roh, ' + (gz.length / 1048576).toFixed(2) + ' MB gzip = '
      + (100 * gz.length / fs.statSync(probeP).size).toFixed(1) + ' % der Zip-Datei\n');
  }
  fs.rmSync(AUS, { recursive: true, force: true });
})().then(function () {
  process.stdout.write((rot ? 'ROT ' + rot + ' von ' : 'GRUEN ') + n + ' Pruefungen\n');
  process.exit(rot ? 1 : 0);
}, function (e) {
  process.stdout.write('ROT  Ausnahme: ' + (e.stack || e) + '\nROT ' + (rot + 1) + ' von ' + (n + 1) + ' Pruefungen\n');
  process.exit(1);
});
