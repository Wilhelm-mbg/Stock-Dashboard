'use strict';
/* DIE VERSCHWUNDENEN HOLEN - der Grund, warum die Massive-Basis-Stufe ueberhaupt
 * gebraucht wird.
 *
 * Das Kursarchiv der App enthaelt 191 Werte, die es HEUTE gibt. Jede Messung darauf
 * misst mit: "dieser Wert existiert 2026 noch" - eine Information aus der Zukunft.
 * Beim Momentum haengt rund die Haelfte des Vorsprungs an 30 solchen Werten
 * (Kontrollmessung 23.08.2026). WIE GROSS die Verzerrung insgesamt ist, war bisher
 * nur geschaetzt, weil niemand die Liste der Verschwundenen hatte.
 *
 * Dieses Werkzeug holt sie: /v3/reference/tickers?active=false liefert die Ticker,
 * die NICHT mehr aktiv gehandelt werden - Uebernahmen, Delistings, Pleiten.
 * Es holt NUR die Liste, keine Kurse. Die Liste ist klein und schnell; welche davon
 * Kurse bekommen, entscheidet der naechste Schritt anhand des Ergebnisses hier.
 *
 * Aufruf:  node tools/massive-verschwundene.js [maxSeiten]
 * Ablage:  <Downloads>/Markt-Dashboard-Daten/massive/verschwundene.json
 */
var fs = require('fs');
var path = require('path');
var M = require('./massive.js');

(async function () {
  var key;
  try { key = M.schluessel(); } catch (e) { console.error(e.message); process.exit(2); }

  var maxSeiten = parseInt(process.argv[2], 10) || 30;   // 30 x 1000 = bis zu 30.000 Ticker
  console.log('Hole nicht mehr aktive Ticker von ' + M.HOST + ' (Basis-Stufe: 5 Abrufe/Min, also ' +
    Math.round(M.ABSTAND_MS / 1000) + ' s Abstand).');
  console.log('Hoechstens ' + maxSeiten + ' Seiten a 1.000 - das dauert bis zu ' +
    Math.ceil(maxSeiten * M.ABSTAND_MS / 60000) + ' Minuten. Abbruch mit Strg+C ist gefahrlos.\n');

  var pfad = '/v3/reference/tickers?active=false&market=stocks&limit=1000';
  var r;
  try {
    r = await M.alleSeiten(pfad, key, maxSeiten, function (seite, n, gesamt) {
      console.log('   Seite ' + seite + ': ' + n + ' Ticker (zusammen ' + gesamt + ')');
    });
  } catch (e) { console.error('Abgebrochen: ' + e.message); process.exit(3); }

  /* Auf die Felder eindampfen, die fuer die Verzerrungs-Messung zaehlen. Alles andere
   * waere Ballast: Fuer die Frage "welche Werte gab es damals, die es heute nicht mehr
   * gibt" braucht man Kuerzel, Name, Boerse und die beiden Datumsangaben. */
  var liste = r.eintraege.map(function (t) {
    return { sym: t.ticker, name: t.name || null, boerse: t.primary_exchange || null,
      art: t.type || null, waehrung: t.currency_name || null,
      von: t.list_date || null, bis: t.delisted_utc ? String(t.delisted_utc).slice(0, 10) : null,
      cik: t.cik || null };
  }).filter(function (t) { return t.sym; });

  /* Nur US-Aktien-aehnliche Papiere: CS = Common Stock, ADRC = ADR. Fonds, Rechte,
   * Einheiten und Vorzugsaktien gehoeren nicht in ein Aktien-Universum und wuerden
   * die Verzerrungs-Messung verwaessern. */
  var relevant = liste.filter(function (t) { return t.art === 'CS' || t.art === 'ADRC'; });

  var mitDatum = relevant.filter(function (t) { return t.bis; });
  var seit2023 = mitDatum.filter(function (t) { return t.bis >= '2023-11-13'; });

  var ziel = path.join(M.ablage(), 'verschwundene.json');
  fs.writeFileSync(ziel, JSON.stringify({
    stand: new Date().toISOString(),
    quelle: M.HOST + '/v3/reference/tickers?active=false&market=stocks',
    seiten: r.seiten, abgebrochen: r.abgebrochen,
    gesamt: liste.length, aktienartig: relevant.length,
    hinweis: 'Nicht mehr aktiv gehandelte Ticker. "bis" ist das Delisting-Datum, sofern die Quelle es fuehrt. ' +
             'Diese Liste dient dazu, die Ueberlebensverzerrung des Kursarchivs zu MESSEN - sie ist selbst keine Handelsliste.',
    eintraege: relevant,
  }, null, 1));

  console.log('\nGeholt: ' + liste.length + ' nicht mehr aktive Ticker, davon ' + relevant.length +
    ' aktienartig (CS/ADRC).');
  console.log('  mit Delisting-Datum : ' + mitDatum.length);
  console.log('  seit 13.11.2023 (Beginn des eigenen 60m-Archivs): ' + seit2023.length);
  if (r.abgebrochen) console.log('  ACHTUNG: nach ' + r.seiten + ' Seiten abgebrochen - es gibt weitere. Mit hoeherem Argument erneut laufen lassen.');
  console.log('\nAblage: ' + ziel);

  /* Sofort die Frage beantworten, wegen der das Werkzeug gebaut wurde. */
  var os2 = require('os');
  var store = path.join(process.env.APPDATA || path.join(os2.homedir(), 'AppData', 'Roaming'), 'Markt-Dashboard', 'store');
  if (fs.existsSync(store)) {
    var eigene = fs.readdirSync(store).filter(function (f) { return f.indexOf('bars_60m_') === 0; })
      .map(function (f) { return f.slice(9, -5); });
    var vs = {}; relevant.forEach(function (t) { vs[t.sym] = t; });
    var betroffen = eigene.filter(function (s) { return vs[s]; });
    console.log('\nAbgleich mit dem eigenen 60m-Archiv (' + eigene.length + ' Werte):');
    console.log('  davon inzwischen nicht mehr aktiv: ' + betroffen.length +
      (betroffen.length ? ' (' + betroffen.slice(0, 8).join(', ') + (betroffen.length > 8 ? ' …' : '') + ')' : ''));
    console.log('  -> ' + (betroffen.length === 0
      ? 'Das eigene Universum besteht zu 100 % aus Ueberlebenden. Genau das ist die Verzerrung.'
      : 'Ein Teil des eigenen Universums ist bereits verschwunden - die Verzerrung ist kleiner als befuerchtet.'));
    console.log('  Seit Archivbeginn verschwundene Aktien insgesamt: ' + seit2023.length +
      ' - so viele Werte FEHLEN dem Universum, wenn man ohne Rueckschau messen will.');
  }
})();
