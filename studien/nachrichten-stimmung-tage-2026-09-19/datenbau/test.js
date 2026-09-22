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
  ok(syms.length === j.zaehler.symbole && syms.length > 900, 'Symbolzahl ' + syms.length);
  ok(j.karte.AAPL && j.karte.AAPL.voll === 'apple', 'AAPL');
  var gk = G.ladeKarte(karteP);
  ok(gk.symbole === syms.length && gk.voll.apple && gk.voll.apple.indexOf('AAPL') >= 0, 'ladeKarte');
} else ok(true, 'Karte v2 noch nicht gebaut');

process.stdout.write((rot ? 'ROT ' + rot + ' von ' : 'GRUEN ') + n + ' Pruefungen\n');
process.exit(rot ? 1 : 0);
