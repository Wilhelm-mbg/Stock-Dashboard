'use strict';
/* STAMMDATEN holen: Branche und Aktienanzahl je Boersenkuerzel - aus der SEC.
 *
 * Die Rechnung steht nicht hier, sondern in ../stammdaten.js: dieselbe Datei, die
 * auch der Hauptprozess der App benutzt, seit die Karte die Daten selbst holen kann.
 * Zwei Kopien derselben SIC-Tabelle waeren genau die Sorte Doppelung, die in diesem
 * Projekt schon mehrfach auseinandergelaufen ist. Hier steht nur, was ein WERKZEUG
 * ausmacht: welche Werte gemeint sind, das Tempolimit, und der Bericht am Ende.
 *
 * WANN DIESES WERKZEUG UND WANN DER KNOPF IN DER APP:
 *   Knopf  - schnell, aber nur fuer die Werte, die die Karte gerade zeigt.
 *   Hier   - fuer ALLE Werte des Archivs auf einmal. Dauert laenger, lohnt sich aber,
 *            wenn die Karte spaeter mehr zeigen soll oder die Studien die Branche
 *            brauchen.
 *
 * WARUM DIE SEC UND NICHT DIE MASSIVE-SCHNITTSTELLE. Massive hat beides, aber nur am
 * Detail-Endpunkt - ein Abruf je Wert. Die Basis-Stufe erlaubt fuenf Abrufe je Minute;
 * dreitausend Werte waeren elf Stunden. Die SEC deckelt bei zehn Abrufen je SEKUNDE,
 * kostet nichts und braucht keinen Schluessel. Vor allem aber gibt es die Aktienanzahl
 * dort fuer rund 4.400 Firmen in EINEM Abruf.
 *
 * Aufruf:
 *   node tools/stammdaten-holen.js                 alle Werte des 60m-Archivs
 *   node tools/stammdaten-holen.js AAPL,MSFT,NVDA  nur diese
 *   node tools/stammdaten-holen.js --alle          alles, was die SEC kennt
 * Ablage: <Datenordner>/markt/stammdaten.json
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');
var zlib = require('zlib');
var S = require('../stammdaten.js');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var ZIEL = path.join(DATEN, 'markt');
var DATEI = path.join(ZIEL, 'stammdaten.json');

function warte(ms) { return new Promise(function (w) { setTimeout(w, ms); }); }

/** Ein Abruf bei der SEC. Absender und Tempolimit kommen aus stammdaten.js. */
function holeJson(url) {
  return new Promise(function (fertig) {
    var req = https.get(url, { headers: S.KOPF, timeout: 30000 }, function (res) {
      if (res.statusCode !== 200) { res.resume(); return fertig(null); }
      var teile = [], strom = res;
      var enc = String(res.headers['content-encoding'] || '').toLowerCase();
      if (enc === 'gzip') strom = res.pipe(zlib.createGunzip());
      else if (enc === 'deflate') strom = res.pipe(zlib.createInflate());
      strom.on('data', function (c) { teile.push(c); });
      strom.on('end', function () {
        try { fertig(JSON.parse(Buffer.concat(teile).toString('utf8'))); } catch (e) { fertig(null); }
      });
      strom.on('error', function () { fertig(null); });
    });
    req.on('timeout', function () { req.destroy(); fertig(null); });
    req.on('error', function () { fertig(null); });
  });
}

/** Die Werte des 60m-Archivs - dieselbe Ordner-Konvention wie ueberall sonst. */
function archivOrdner() {
  if (process.env.MD_ARCHIV60M) return process.env.MD_ARCHIV60M;
  try {
    var p = fs.readFileSync(path.join(DATEN, 'archiv60m-pfad.txt'), 'utf8').replace(/^﻿/, '').trim();
    if (p) return p;
  } catch (e) { /* keine Zeigerdatei */ }
  return path.join(DATEN, 'archiv60m');
}
function werteAusArchiv() {
  try {
    return fs.readdirSync(archivOrdner())
      .filter(function (f) { return /^bars_60m_.+\.json$/.test(f); })
      .map(function (f) { return f.slice('bars_60m_'.length, -5); });
  } catch (e) { return []; }
}

/** Der letzte bekannte Schlusskurs aus dem Archiv - NUR als Startwert fuer die
 *  Rangfolge der Karte. Die App ersetzt ihn sofort durch den Live-Kurs; er steht
 *  deshalb mit seinem Datum in der Datei, denn eine Zahl ohne Datum wird frueher oder
 *  spaeter fuer aktuell gehalten. */
function letzterKursAus(sym) {
  try {
    var j = JSON.parse(fs.readFileSync(path.join(archivOrdner(), 'bars_60m_' + sym + '.json'), 'utf8'));
    var r = j && j.series;
    if (!r || !r.length) return null;
    var b = r[r.length - 1];
    if (!(b && b[1] > 0)) return null;
    return { kurs: b[1], stand: new Date(b[0]).toISOString().slice(0, 10) };
  } catch (e) { return null; }
}

// ===========================================================================
(async function () {
  var arg = process.argv[2] || '';
  console.log('Stammdaten aus der SEC  ·  ' + new Date().toLocaleString('de-DE'));
  console.log('='.repeat(74));

  /* Was schon da ist, wird nicht neu geholt. Die Branche eines Unternehmens aendert
   * sich praktisch nie; die Aktienanzahl schon, die kommt aber ohnehin gesammelt. */
  var bekannt = {};
  try { bekannt = JSON.parse(fs.readFileSync(DATEI, 'utf8')).werte || {}; } catch (e) { /* erster Lauf */ }

  var b;
  try { b = await S.basis(holeJson, Date.now()); }
  catch (e) { console.error(e.message); process.exit(1); }
  console.log('1) Kuerzel der SEC bekannt: ' + Object.keys(b.cikVon).length);
  console.log('2) Aktienanzahl, Sammelabruf ' + b.zeitraum + ': ' + b.stufe1 + ' Firmen (dei)' +
    (b.stufe2 ? ', ' + b.stufe2 + ' weitere (us-gaap)' : ''));

  // ---- Welche Werte wollen wir? ----
  var wunsch;
  if (arg === '--alle') wunsch = Object.keys(b.cikVon);
  else if (arg) wunsch = arg.split(',').map(function (x) { return x.trim().toUpperCase(); }).filter(Boolean);
  else {
    wunsch = werteAusArchiv();
    console.log('   Universum aus dem 60m-Archiv: ' + wunsch.length + ' Reihen  (' + archivOrdner() + ')');
    if (!wunsch.length) {
      console.log('\n   Kein Archiv gefunden. Zwei Wege:');
      console.log('     - Zeigerdatei setzen: ' + path.join(DATEN, 'archiv60m-pfad.txt') + '  (eine Zeile, der Pfad)');
      console.log('     - oder ohne Archiv arbeiten:  node tools/stammdaten-holen.js --alle');
      process.exit(1);
    }
  }
  var ohneCik = [];
  var liste = wunsch.filter(function (s) {
    if (b.cikVon[S.secName(s, b.cikVon)]) return true;
    ohneCik.push(s); return false;
  });
  console.log('3) davon bei der SEC gefuehrt: ' + liste.length + ', ohne Eintrag: ' + ohneCik.length);
  if (ohneCik.length) {
    console.log('   ohne Eintrag sind meist ETFs, Fonds und auslaendische Papiere, z. B.: ' +
      ohneCik.slice(0, 12).join(' ') + (ohneCik.length > 12 ? ' …' : ''));
  }

  // ---- Branche ----
  var offen = liste.filter(function (s) { return !(bekannt[s] && bekannt[s].sic); });
  console.log('4) Branche: ' + offen.length + ' neu zu holen, ' + (liste.length - offen.length) + ' schon bekannt');
  if (offen.length > 400) {
    console.log('   Das dauert rund ' + Math.ceil(offen.length * S.PAUSE / 60000) +
      ' Minuten (zehn Abrufe je Sekunde sind das Limit der SEC).');
  }
  var br = await S.branchen(holeJson, warte, liste, b, bekannt, function (f, g) {
    if (f % 100 === 0) console.log('   … ' + f + ' von ' + g);
  });
  console.log('   neu geholt: ' + br.neu + ', ohne Branchenangabe: ' + br.fehl);

  // ---- Stueckzahlen ----
  var st = await S.stueckzahlen(holeJson, warte, liste, b, bekannt, Date.now(), null);
  if (st.luecken) {
    console.log('5) Stueckzahl: ' + st.luecken + ' Reste einzeln nachgeholt (verschobenes Geschaeftsjahr,');
    console.log('   mehrere Aktiengattungen) - davon gefunden: ' + st.einzeln +
      ', wegen Alter verworfen: ' + st.zuAlt + ', gar nicht getaggt: ' + (st.luecken - st.einzeln - st.zuAlt));
  }

  // ---- Startkurs aus dem Archiv, falls vorhanden ----
  if (!arg || arg === '--alle') {
    var mitKurs = 0;
    liste.forEach(function (sym) {
      var e = bekannt[sym];
      if (!e || !(e.aktien > 0)) return;
      var lk = letzterKursAus(sym);
      if (lk) { e.startKurs = lk.kurs; e.startKursStand = lk.stand; mitKurs++; }
    });
    if (mitKurs) console.log('6) Startkurs aus dem Archiv fuer ' + mitKurs + ' Werte (nur zur Rangfolge, die App ersetzt ihn sofort)');
  }

  // ---- Ablegen ----
  fs.mkdirSync(ZIEL, { recursive: true });
  fs.writeFileSync(DATEI, JSON.stringify({
    stand: new Date().toISOString(),
    quelle: 'SEC EDGAR (tools/stammdaten-holen.js)',
    hinweis: 'sic und sicText sind Tatsachen der Behoerde. sektor ist eine Faltung in stammdaten.js - eine Entscheidung, keine Messung.',
    aktienStand: b.zeitraum,
    werte: bekannt
  }, null, 1));

  // ---- Bericht ----
  console.log('\n' + '='.repeat(74) + '\nABDECKUNG\n');
  var proSektor = {};
  liste.forEach(function (s) {
    var e = bekannt[s]; if (!e) return;
    if (!proSektor[e.sektor]) proSektor[e.sektor] = { n: 0, mit: 0 };
    proSektor[e.sektor].n++;
    if (e.aktien > 0) proSektor[e.sektor].mit++;
  });
  Object.keys(proSektor).sort(function (a, c) { return proSektor[c].n - proSektor[a].n; })
    .forEach(function (s) {
      console.log('   ' + s.padEnd(20) + String(proSektor[s].n).padStart(5) + ' Werte, davon ' +
        proSektor[s].mit + ' mit Aktienanzahl');
    });
  var mitG = liste.filter(function (s) { return bekannt[s] && bekannt[s].aktien > 0; });
  console.log('\n   Gesamt: ' + liste.length + ' Werte, ' + mitG.length + ' mit Groesse (' +
    (liste.length ? Math.round(mitG.length / liste.length * 100) : 0) + ' %)');

  var adr = liste.filter(function (s) { return bekannt[s] && bekannt[s].auslaender && bekannt[s].aktien > 0; });
  if (adr.length) {
    console.log('\n   AUSLAENDISCHE EMITTENTEN (20-F/40-F/6-K) - ' + adr.length + ' Stueck:');
    console.log('   ' + adr.slice(0, 20).join(', ') + (adr.length > 20 ? ' …' : ''));
    console.log('   Ihre Stueckzahl sind STAMMAKTIEN. Gehandelt wird meist ein ADR, das mehrere');
    console.log('   davon buendelt - das Verhaeltnis steht nicht in den SEC-Daten. Die Karte laesst');
    console.log('   sie deshalb weg; in der Datei sind sie markiert.');
  }
  var ohne = liste.filter(function (s) { return bekannt[s] && !(bekannt[s].aktien > 0); });
  if (ohne.length) {
    console.log('\n   OHNE GROESSE - diese Werte koennen auf einer Flaechenkarte nicht erscheinen:');
    console.log('   ' + ohne.slice(0, 20).map(function (s) {
      return s + (bekannt[s].aktienVeraltet ? ' (nur ' + bekannt[s].aktienVeraltet + ', zu alt)' : '');
    }).join(', ') + (ohne.length > 20 ? ' …' : ''));
    console.log('   Grund ist fast immer: die Firma taggt die Stueckzahl gar nicht in XBRL');
    console.log('   (mehrere Aktiengattungen) oder es ist ein auslaendischer Emittent mit 20-F.');
  }
  console.log('\n   Abgelegt: ' + DATEI);
  console.log('   Die Marktkapitalisierung wird NICHT hier gerechnet - sie ist Kurs mal');
  console.log('   Aktienanzahl und entsteht in der App bei jeder Aktualisierung neu.');
})();
