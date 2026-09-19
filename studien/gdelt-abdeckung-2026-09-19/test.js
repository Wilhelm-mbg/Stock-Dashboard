'use strict';
/* Pruefungen der GDELT-Abdeckungsprobe (Auftrag Nr. 44). Aufruf aus dem Studienordner: node test.js
 * Rot bei: Normalisierung asymmetrisch/nicht idempotent, Kurzform aus Allerweltswort, Karte mit doppelter Kurzform,
 * Spaltenprobe an einer ECHTEN Datei (voll/probe.gkg.csv.zip, vom Vorlauf mit --probe abgelegt): Organisationsspalte
 * keine ";"-Liste mit ",Offset" oder Ton-Spalte keine Zahl mit sechs Kommas. Zeilen mit falscher Feldzahl werden gezaehlt. */
var fs = require('fs');
var path = require('path');
var N = require('./namen.js');
var G = require('./gkg-zaehlen.js');
var HIER = __dirname;
var n = 0, rot = 0;
function ok(bed, text) { n++; if (!bed) { rot++; process.stdout.write('ROT  ' + text + '\n'); } }

/* ---------- 1. Normalisierung: eine Funktion fuer beide Seiten ---------- */
[['Apple Inc.', 'apple'], ['APPLE INC', 'apple'], ['NORTHERN TRUST CORP', 'northern trust'], ['JPMORGAN CHASE & CO', 'jpmorgan chase'],
  ['Bank of America Corp /DE/', 'bank of america'], ['The Coca-Cola Co', 'coca cola'], ['GOLDMAN SACHS GROUP INC', 'goldman sachs'],
  ['Carlyle Group Inc', 'carlyle group'], ['Meta Platforms, Inc.', 'meta platforms'], ['AT&T INC.', 'at t'], ['3M CO', '3m'],
  ['Alphabet Inc. Class A', 'alphabet'], ['NEWS CORP NEW', 'news'], ['Trust Co', 'trust'], ['Apple Watch', 'apple watch'],
  ['Appleton', 'appleton'], ['apple', 'apple'], ['  Apple   Inc  ', 'apple'], ['', '']].forEach(function (p) {
  ok(N.normalisieren(p[0]) === p[1], 'normalisieren(' + JSON.stringify(p[0]) + ') = ' + JSON.stringify(N.normalisieren(p[0])) + ', erwartet ' + JSON.stringify(p[1]));
  ok(N.normalisieren(N.normalisieren(p[0])) === p[1], 'nicht idempotent: ' + p[0]);
});
ok(N.normalisieren('Apple Watch') !== N.normalisieren('Apple Inc'), 'Apple-Watch-Falle: exakter Vergleich trennt');

/* ---------- 2. Kurzform ---------- */
[['apple', 'apple'], ['jpmorgan chase', 'jpmorgan'], ['american airlines', null], ['first solar', null], ['united rentals', null],
  ['general motors', null], ['3m', null], ['bank of america', null], ['at t', null], ['nvidia', 'nvidia'], ['exxon mobil', 'exxon']].forEach(function (p) {
  ok(N.kurzform(p[0]) === p[1], 'kurzform(' + p[0] + ') = ' + N.kurzform(p[0]) + ', erwartet ' + p[1]);
});
N.ALLERWELT.forEach(function (w) { ok(N.kurzform(w + ' xyz') === null, 'Allerweltswort als Kurzform: ' + w); });

/* ---------- 3. Namenskarte ---------- */
var karteP = path.join(HIER, 'namenskarte.json');
ok(fs.existsSync(karteP), 'namenskarte.json fehlt');
if (fs.existsSync(karteP)) {
  var j = JSON.parse(fs.readFileSync(karteP, 'utf8')), kurzZu = {}, ohne = 0, m = 0;
  ok(j.kennung === 'gdelt-abdeckung-2026-09-19/namenskarte/v1', 'Karten-Kennung');
  ok(/panel\/v2$/.test(j.panel), 'Karte aus Panel v2: ' + j.panel);
  Object.keys(j.karte).forEach(function (s) {
    var k = j.karte[s]; m++;
    ok(k.klasse2025 !== null || k.klasse2018 !== null, s + ' ohne Klasse');
    [k.klasse2025, k.klasse2018].forEach(function (kl) { ok(kl === null || kl === 1 || kl === 2 || kl === 3, s + ' Klasse ' + kl); });
    if (k.voll) ok(N.normalisieren(k.voll) === k.voll, s + ' voll nicht normalisiert: ' + k.voll); else ohne++;
    if (k.voll2) ok(N.normalisieren(k.voll2) === k.voll2 && k.voll2 !== k.voll, s + ' voll2');
    if (k.kurz) { ok(k.voll && k.voll.split(' ')[0] === k.kurz && N.kurzform(k.voll) === k.kurz, s + ' kurz passt nicht zu voll'); (kurzZu[k.kurz] = kurzZu[k.kurz] || []).push(s); }
    else ok(!k.voll || N.kurzform(k.voll) === null || j.kurzDoppelt.some(function (d) { return d.indexOf(N.kurzform(k.voll) + ' ->') === 0; }), s + ' Kurzform fehlt ohne Grund');
  });
  Object.keys(kurzZu).forEach(function (q) { ok(kurzZu[q].length === 1, 'Kurzform ' + q + ' bei ' + kurzZu[q].join(',')); });
  ok(ohne === j.zaehler.ohneNamen && ohne === j.ohneNamen.length, 'ohneNamen-Zaehler ' + ohne + '/' + j.zaehler.ohneNamen + '/' + j.ohneNamen.length);
  ok(m === j.zaehler.symbole && m >= 900, 'Symbolzahl ' + m);
  ok(j.stichtage['2025-01-02'].symbole > 500 && j.stichtage['2018-01-02'].symbole > 500, 'Stichtage duenn');
  ok(j.karte.AAPL && j.karte.AAPL.voll === 'apple' && j.karte.AAPL.kurz === 'apple', 'AAPL');
  ok(j.karte.NTRS && j.karte.NTRS.voll === 'northern trust', 'NTRS');
  ok(j.karte.GOOGL && j.karte.GOOGL.kurz === null, 'GOOGL Kurzform "alphabet" muss wegen GOOG doppelt gesperrt sein');
  /* Gegenprobe: ein Symbol mit falschem Namen (Zitierer statt Emittent) darf nicht in der Karte stehen. */
  Object.keys(j.karte).forEach(function (s) { var v = j.karte[s].voll || ''; ok(!/^(citigroup global markets|gs finance|jpmorgan chase financial|fmr|dfa investment)/.test(v) || s === 'C', s + ' traegt Zitierer-Namen: ' + v); });
}

/* ---------- 4. Spaltenprobe an einer echten Datei ---------- */
var probeP = path.join(HIER, 'voll', 'probe.gkg.csv.zip');
ok(fs.existsSync(probeP), 'voll/probe.gkg.csv.zip fehlt (node gkg-zaehlen.js --tag <tag> --probe)');
if (fs.existsSync(probeP)) {
  var csv = G.entpacke(fs.readFileSync(probeP)).toString('utf8'), zeilen = csv.split('\n').filter(Boolean);
  var feld = {}, orgZeilen = 0, orgOk = 0, orgEintraege = 0, orgMitOffset = 0, v1MitOffset = 0, tonOk = 0, tonZeilen = 0, id = 0;
  zeilen.forEach(function (z) {
    var c = z.replace(/\r$/, '').split('\t'); feld[c.length] = (feld[c.length] || 0) + 1;
    if (c.length !== G.SPALTEN) return;
    if (/^\d{14}-T?\d+$/.test(c[0])) id++;
    var org = c[G.SP_ORG];
    if (org) {
      orgZeilen++;
      var e = org.split(';'), alle = true;
      e.forEach(function (x) { orgEintraege++; if (/^.+,\d+$/.test(x)) orgMitOffset++; else alle = false; });
      if (alle) orgOk++;
    }
    var v1 = c[G.SP_ORG - 1]; if (v1) v1.split(';').forEach(function (x) { if (/,\d+$/.test(x)) v1MitOffset++; });
    var t = c[G.SP_TON]; if (t) { tonZeilen++; var f = t.split(','); if (f.length === 7 && f.every(function (x) { return x !== '' && isFinite(+x); }) && Math.abs(+f[0]) <= 100) tonOk++; }
  });
  var n27 = feld[G.SPALTEN] || 0;
  ok(zeilen.length > 500, 'Probe-Datei mit nur ' + zeilen.length + ' Zeilen');
  ok(n27 / zeilen.length >= 0.99, 'nur ' + n27 + ' von ' + zeilen.length + ' Zeilen mit 27 Feldern: ' + JSON.stringify(feld));
  ok(id === n27, 'GKGRECORDID-Form in ' + id + ' von ' + n27);
  ok(orgZeilen > 100 && orgOk === orgZeilen, 'Spalte 15 (V2EnhancedOrganizations): ' + orgOk + ' von ' + orgZeilen + ' Zeilen sind ;-Listen aus Name,Offset (' + orgMitOffset + '/' + orgEintraege + ' Eintraege)');
  ok(v1MitOffset === 0, 'Spalte 14 (V1Organizations) traegt Offsets - Spaltenindex verschoben?');
  ok(tonZeilen === n27 && tonOk === tonZeilen, 'Spalte 16 (V1.5Tone): ' + tonOk + ' von ' + tonZeilen + ' Zeilen mit sieben Zahlen (sechs Kommas)');
  process.stdout.write('Spaltenprobe: ' + zeilen.length + ' Zeilen, Feldzahlen ' + JSON.stringify(feld) + ', Org-Zeilen ' + orgZeilen + ' (' + orgEintraege + ' Eintraege, ' + orgMitOffset + ' mit Offset), Ton-Zeilen ' + tonOk + '/' + tonZeilen + '\n');
  /* Zaehlprobe: dieselbe Datei durch zaehleText mit einer Mini-Karte; ein Artikel zaehlt je Symbol und Stufe einmal. */
  var karte = { kennung: 'test', voll: { apple: ['AAPL'] }, kurz: { apple: ['AAPL'] }, klasse: {} };
  var Z = {}, stich = { voll: {}, kurz: {}, groesse: 10 }, zl = { zeilen: 0, falscheFeldzahl: 0, mitOrganisation: 0, ohneTon: 0, treffer: { voll: 0, kurz: 0 } };
  G.zaehleText(csv, karte, '2025-06-02', Z, stich, zl);
  ok(zl.zeilen === zeilen.length, 'Zaehlprobe Zeilen ' + zl.zeilen + '/' + zeilen.length);
  ok(zl.falscheFeldzahl === zeilen.length - n27, 'Zaehlprobe falscheFeldzahl ' + zl.falscheFeldzahl);
  ok(zl.treffer.voll === zl.treffer.kurz, 'voll==kurz bei gleicher Form "apple": ' + zl.treffer.voll + '/' + zl.treffer.kurz);
  ok(!Z.AAPL || (Z.AAPL.voll[0] === zl.treffer.voll && Z.AAPL.voll[3] <= Z.AAPL.voll[0]), 'Zaehler AAPL konsistent');
  var sv = stich.voll[0] || [];
  ok(sv.length === Math.min(10, zl.treffer.voll), 'Reservoir voll ' + sv.length + ' bei ' + zl.treffer.voll + ' Treffern');
  ok(sv.every(function (s, i) { return i === 0 || s.u >= sv[i - 1].u; }), 'Reservoir nach u sortiert');
  ok(sv.every(function (s) { return N.normalisieren(s.org.slice(0, s.org.lastIndexOf(','))) === 'apple'; }), 'Reservoir traegt fremde Organisationstexte');
  /* Placebo: ein Name, den es nicht gibt, trifft nie. */
  var Z0 = {}, st0 = { voll: {}, kurz: {} }, z0 = { zeilen: 0, falscheFeldzahl: 0, mitOrganisation: 0, ohneTon: 0, treffer: { voll: 0, kurz: 0 } };
  G.zaehleText(csv, { kennung: 't', voll: { 'qzxv wprt': ['NIX'] }, kurz: { qzxvw: ['NIX'] }, klasse: {} }, '2025-06-02', Z0, st0, z0);
  ok(z0.treffer.voll === 0 && z0.treffer.kurz === 0 && !Z0.NIX, 'Placebo-Name trifft: ' + JSON.stringify(z0.treffer));
}

/* ---------- 5. Tage und Teile ---------- */
ok(G.tageVonBis('2025-01-01', '2025-12-31').length === 365, 'tageVonBis 2025');
ok(G.tageVonBis('2018-01-01', '2018-03-31').length === 90, 'tageVonBis 2018 Q1');
ok(G.stempelDesTages('2025-06-02').length === 96 && G.stempelDesTages('2025-06-02')[95] === '20250602234500', 'Stempel des Tages');
var alle = G.tageVonBis('2025-01-01', '2025-12-31'), teile = [1, 2, 3, 4].map(function (k) { return alle.filter(function (t, i) { return i % 4 === k - 1; }); });
ok(teile.reduce(function (a, t) { return a + t.length; }, 0) === 365 && teile.every(function (t, i) { return teile.every(function (u, j) { return i === j || !t.some(function (x) { return u.indexOf(x) >= 0; }); }); }), 'Teile disjunkt und vollstaendig');

process.stdout.write((rot ? 'ROT ' + rot + ' von ' : 'GRUEN ') + n + ' Pruefungen\n');
process.exit(rot ? 1 : 0);
