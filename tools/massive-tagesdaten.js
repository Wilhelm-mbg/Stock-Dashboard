'use strict';
/* TAGESDATEN FUER DIE VERSCHWUNDENEN WERTE.
 *
 * Zweck: das Kursarchiv enthaelt 199 Werte, die es HEUTE gibt - alle Ueberlebende.
 * Werte, die im Messzeitraum existierten und danach von der Boerse verschwanden,
 * fehlen vollstaendig. Erst mit ihnen laesst sich Momentum auf einem Universum
 * OHNE Rueckschau messen.
 *
 * SCHONEND MIT DER SCHNITTSTELLE:
 *  - 13 s Abstand zwischen zwei Abrufen (noetig waeren 12 bei 5/Min)
 *  - EIN Abruf je Wert: der Aggregat-Endpunkt liefert die ganze Zeitspanne auf einmal
 *  - Fortschritt wird nach JEDEM Wert gespeichert. Ein Abbruch kostet nichts;
 *    der naechste Lauf macht dort weiter, wo der letzte aufhoerte.
 *  - Obergrenze je Lauf, damit man nicht versehentlich Stunden bindet.
 *  - Werte ohne Daten werden vermerkt und nie erneut abgerufen.
 *
 * Aufruf:  node tools/massive-tagesdaten.js [maxWerte] [--alle]
 *          ohne --alle werden nur Werte an NYSE/NASDAQ geholt, die im Messzeitraum
 *          ueberhaupt existierten - der Rest waere fuer ein Grosswerte-Universum
 *          ohnehin nie in Frage gekommen.
 * Ablage:  <Downloads>/Markt-Dashboard-Daten/massive/tagesdaten/<SYM>.json
 */
var fs = require('fs');
var path = require('path');
var M = require('./massive.js');

/* Zeitraum: der Beginn des eigenen 60m-Archivs, damit beide Universen dieselbe
 * Spanne abdecken. Die Basis-Stufe liefert zwei Jahre; mehr waere ohnehin nicht drin. */
var VON = '2023-11-13';
var BIS = new Date().toISOString().slice(0, 10);

(async function () {
  var key;
  try { key = M.schluessel(); } catch (e) { console.error(e.message); process.exit(2); }

  var maxWerte = parseInt(process.argv[2], 10) || 40;
  var alle = process.argv.indexOf('--alle') !== -1;

  var listeDatei = path.join(M.ablage(), 'verschwundene.json');
  if (!fs.existsSync(listeDatei)) {
    console.error('Erst die Liste holen: node tools/massive-verschwundene.js');
    process.exit(3);
  }
  var L = JSON.parse(fs.readFileSync(listeDatei, 'utf8'));

  /* Auswahl: Werte, die im Messzeitraum verschwanden - vorher verschwundene haben
   * im Zeitraum gar nicht gehandelt, spaeter verschwundene stehen noch im Archiv. */
  var kandidaten = (L.eintraege || []).filter(function (t) {
    if (!t.bis || t.bis < VON) return false;                       // vor dem Zeitraum weg
    if (t.von && t.von > BIS) return false;                        // nach dem Zeitraum erst gelistet
    if (alle) return true;
    /* Ohne --alle: nur Hauptboersen. Ein Grosswerte-Universum haette einen Wert von
     * einer Nebenboerse nie enthalten; ihn zu holen kostet Abrufe ohne Erkenntnis. */
    return t.boerse === 'XNYS' || t.boerse === 'XNAS' || t.boerse === 'ARCX' || t.boerse === 'BATS';
  });

  var ordner = M.ablage('tagesdaten');
  var standDatei = path.join(M.ablage(), 'tagesdaten-stand.json');
  var stand = fs.existsSync(standDatei) ? JSON.parse(fs.readFileSync(standDatei, 'utf8')) : { fertig: {}, ohneDaten: {} };

  var offen = kandidaten.filter(function (t) { return !stand.fertig[t.sym] && !stand.ohneDaten[t.sym]; });
  console.log('Verschwundene im Messzeitraum: ' + kandidaten.length +
    (alle ? ' (alle Boersen)' : ' (nur Hauptboersen; mit --alle sind es mehr)'));
  console.log('  schon geholt : ' + Object.keys(stand.fertig).length);
  console.log('  ohne Daten   : ' + Object.keys(stand.ohneDaten).length);
  console.log('  noch offen   : ' + offen.length);
  if (!offen.length) { console.log('\nNichts zu tun - alle Kandidaten sind abgearbeitet.'); return; }

  var nimm = offen.slice(0, maxWerte);
  var dauer = Math.ceil(nimm.length * M.ABSTAND_MS / 60000);
  console.log('\nDieser Lauf holt ' + nimm.length + ' Werte, das dauert rund ' + dauer + ' Minuten.');
  console.log('Abbruch mit Strg+C ist gefahrlos - der Fortschritt steht nach jedem Wert auf der Platte.\n');

  var geholt = 0, leer = 0, fehler = 0;
  for (var i = 0; i < nimm.length; i++) {
    var t = nimm[i];
    var pfad = '/v2/aggs/ticker/' + encodeURIComponent(t.sym) + '/range/1/day/' + VON + '/' + BIS +
      '?adjusted=true&sort=asc&limit=50000';
    try {
      var j = await M.hole(pfad, key);
      var bars = (j.results || []).map(function (b) { return [b.t, b.c, b.v || 0, b.h, b.l]; });
      if (bars.length < 20) {
        stand.ohneDaten[t.sym] = { grund: bars.length + ' Kerzen', am: new Date().toISOString().slice(0, 10) };
        leer++;
        console.log('  ' + String(i + 1).padStart(3) + '/' + nimm.length + '  ' + t.sym.padEnd(8) + 'nur ' + bars.length + ' Kerzen - vermerkt, wird nicht erneut geholt');
      } else {
        fs.writeFileSync(path.join(ordner, t.sym + '.json'), JSON.stringify({
          sym: t.sym, name: t.name, boerse: t.boerse, delistet: t.bis,
          quelle: 'massive /v2/aggs 1/day, adjusted', stand: new Date().toISOString(),
          series: bars,
        }));
        stand.fertig[t.sym] = { kerzen: bars.length, bis: t.bis };
        geholt++;
        console.log('  ' + String(i + 1).padStart(3) + '/' + nimm.length + '  ' + t.sym.padEnd(8) +
          String(bars.length).padStart(4) + ' Tage  bis ' + t.bis + '  ' + (t.name || '').slice(0, 34));
      }
    } catch (e) {
      fehler++;
      console.log('  ' + String(i + 1).padStart(3) + '/' + nimm.length + '  ' + t.sym.padEnd(8) + 'Fehler: ' + e.message.slice(0, 70));
      if (fehler >= 5) { console.log('\nFuenf Fehler in Folge - Abbruch, damit nicht gegen eine Sperre gelaufen wird.'); break; }
    }
    /* Fortschritt nach JEDEM Wert - ein Abbruch soll nie einen Abruf verschwenden. */
    fs.writeFileSync(standDatei, JSON.stringify(stand, null, 1));
  }

  console.log('\nGeholt: ' + geholt + ' Werte mit Daten, ' + leer + ' ohne, ' + fehler + ' Fehler.');
  var restlich = offen.length - nimm.length;
  if (restlich > 0) console.log('Noch offen: ' + restlich + ' - einfach erneut aufrufen, es geht dort weiter.');
  console.log('Ablage: ' + ordner);
})();
