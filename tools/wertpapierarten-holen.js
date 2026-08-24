'use strict';
/* WAS IST UEBERHAUPT EINE AKTIE? - die Frage, die das Universum bisher nicht stellte.
 *
 * Anlass: Die Kapitulations-Messung am 24.08.2026 lief ueber 2.885 Reihen. Darin
 * steckten
 *   ZVZZT  - NASDAQs TESTSYMBOL. Kein Wertpapier. 41 % seiner Stundenkerzen
 *            springen ueber 8 %.
 *   SOXL, SOXS, UVIX, TSLL, TSLR, TSDD, GDXU, GDXD, CONL - gehebelte und inverse
 *            Produkte. Sie bewegen sich nicht wie Unternehmen, sondern wie ihr
 *            Basiswert mal zwei oder drei.
 * Der Schaetzer der Messung haengt an sieben von 7.858 Trades. Genau solche
 * Papiere besetzen diese Plaetze - der schlechteste Trade war SVIX mit -42 Pp,
 * ein inverses Volatilitaetsprodukt.
 *
 * Der Filter des Universums lautete bisher sym.indexOf('-USD') === -1, also
 * "kein Krypto". Das ist kein Aktienfilter.
 *
 * ABHILFE, PRINZIPIELL STATT PER NAMENSLISTE: Die Schnittstelle kennt die
 * Wertpapierart. type=CS ist "Common Stock" - eine Stammaktie eines Unternehmens.
 * ETFs (ETF), Fonds (FUND), ADRs (ADRC), Wandelanleihen, Testsymbole und
 * strukturierte Produkte tragen andere Kuerzel. Eine Namensliste waere eine
 * SETZUNG, die still veraltet; die Wertpapierart ist eine Tatsache.
 *
 * Aufruf: node tools/wertpapierarten-holen.js
 * Ablage: <Datenordner>/massive/wertpapierarten.json
 */
var fs = require('fs');
var path = require('path');
var M = require('./massive.js');

(async function () {
  var key;
  try { key = M.schluessel(); } catch (e) { console.error(e.message); process.exit(2); }

  var arten = {};        // sym -> Kuerzel der Wertpapierart
  var seiten = 0, eintraege = 0;

  /* Aktive UND verschwundene Werte - das Universum ist punkt-in-zeit gebildet und
   * enthaelt beide. Wer nur die aktiven holt, verliert genau die Werte, um deren
   * Ueberlebensverzerrung es geht. */
  for (var aktiv = 0; aktiv < 2; aktiv++) {
    var pfad = '/v3/reference/tickers?market=stocks&active=' + (aktiv === 0 ? 'true' : 'false') + '&limit=1000';
    while (pfad) {
      var j;
      try { j = await M.hole(pfad, key); }
      catch (e) { console.error('  Abbruch: ' + e.message.slice(0, 80)); break; }
      (j.results || []).forEach(function (t) {
        if (t.ticker) { arten[t.ticker] = t.type || 'OHNE'; eintraege++; }
      });
      seiten++;
      process.stdout.write('\r  ' + seiten + ' Seiten, ' + eintraege + ' Wertpapiere …');
      pfad = j.next_url ? j.next_url.replace(/^https?:\/\/[^/]+/, '') : null;
    }
  }
  console.log('');

  var zaehl = {};
  Object.keys(arten).forEach(function (s) { zaehl[arten[s]] = (zaehl[arten[s]] || 0) + 1; });
  console.log('\nWertpapierarten:');
  Object.keys(zaehl).sort(function (a, b) { return zaehl[b] - zaehl[a]; }).slice(0, 12).forEach(function (k) {
    console.log('  ' + k.padEnd(8) + String(zaehl[k]).padStart(7) +
      (k === 'CS' ? '   <- Stammaktien, das gesuchte Universum' : ''));
  });

  var ziel = path.join(M.ablage(), 'wertpapierarten.json');
  fs.writeFileSync(ziel, JSON.stringify({
    verfahren: 'reference-tickers/1.0.0', erstellt: new Date().toISOString(),
    hinweis: 'Wertpapierart je Symbol. CS = Stammaktie. Alles andere (ETF, FUND, ADRC, ' +
             'Testsymbole, gehebelte und inverse Produkte) gehoert nicht in eine Aktienmessung.',
    anzahl: eintraege, arten: arten,
  }));
  console.log('\nAblage: ' + ziel);

  /* Und die Probe aufs Exempel: was faellt aus dem Archiv heraus? */
  var DATEN = path.join(require('os').homedir(), 'Downloads', 'Markt-Dashboard-Daten');
  var ordner = process.env.MD_ARCHIV60M;
  if (!ordner) {
    try { ordner = fs.readFileSync(path.join(DATEN, 'archiv60m-pfad.txt'), 'utf8').replace(/^﻿/, '').trim(); }
    catch (e) { ordner = path.join(DATEN, 'archiv60m'); }
  }
  if (!fs.existsSync(ordner)) return;
  var syms = fs.readdirSync(ordner).filter(function (f) { return f.indexOf('bars_60m_') === 0; })
    .map(function (f) { return f.slice(9, -5); });
  var raus = {}, drin = 0, unbekannt = 0;
  syms.forEach(function (s) {
    var a = arten[s] || arten[s.replace(/-/g, '.')];
    if (!a) { unbekannt++; return; }
    if (a === 'CS') drin++; else (raus[a] = raus[a] || []).push(s);
  });
  console.log('\nArchiv (' + syms.length + ' Reihen):');
  console.log('  Stammaktien (CS): ' + drin);
  console.log('  keiner Art zuzuordnen: ' + unbekannt);
  Object.keys(raus).sort(function (a, b) { return raus[b].length - raus[a].length; }).forEach(function (k) {
    console.log('  ' + k.padEnd(8) + String(raus[k].length).padStart(5) + '  ' + raus[k].slice(0, 10).join(' ') +
      (raus[k].length > 10 ? ' …' : ''));
  });
})();
