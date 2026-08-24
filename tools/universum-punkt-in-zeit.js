'use strict';
/* DAS UNIVERSUM, WIE ES DAMALS AUSSAH - nicht wie es heute aussieht.
 *
 * WARUM DAS DER ERSTE SCHRITT IST. Die groesste bekannte Verzerrung dieses Projekts
 * ist die Ueberlebensauswahl: Von Wilhelms 199 Archivwerten ist KEIN einziger
 * delistet - 100 % Ueberlebende. Wer heute die liquidesten Werte auswaehlt und
 * rueckwaerts misst, misst mit, dass sie es bis heute geschafft haben.
 *
 * Deshalb wird das Universum PUNKT-IN-ZEIT gebildet: Die Auswahl faellt anhand des
 * Dollarumsatzes zu Beginn des Messzeitraums, nicht anhand von heute. Ein Wert, der
 * damals liquide war und spaeter verschwand, gehoert dazu.
 *
 * WIE ES BILLIG GEHT. Der Sammelabruf (grouped daily) liefert ALLE Werte eines
 * Handelstags in EINEM Abruf - gemessen 12.483 Stueck. Zwanzig Tage aus dem
 * Auswahlfenster genuegen fuer einen belastbaren Median des Dollarumsatzes. Zwanzig
 * Abrufe fuer ein Universum, statt tausender.
 *
 * Der Schluessel wird aus MASSIVE_KEY oder massive.key gelesen und nie ausgegeben.
 *
 * Aufruf:  node tools/universum-punkt-in-zeit.js [stichtag] [tage] [mindestUmsatzMio]
 *   stichtag           Anfang des Auswahlfensters (Vorgabe: 2024-09-02)
 *   tage               wie viele Handelstage gemittelt werden (Vorgabe: 20)
 *   mindestUmsatzMio   Schwelle in Mio $ Tagesumsatz (Vorgabe: 5)
 */
var fs = require('fs');
var path = require('path');
var M = require('./massive.js');

(async function () {
  var key;
  try { key = M.schluessel(); } catch (e) { console.error(e.message); process.exit(2); }

  var stichtag = process.argv[2] || '2024-09-02';
  var tage = parseInt(process.argv[3], 10) || 20;
  var schwelleMio = parseFloat(process.argv[4]);
  if (!isFinite(schwelleMio)) schwelleMio = 5;

  console.log('Universum PUNKT-IN-ZEIT');
  console.log('  Auswahlfenster ab ' + stichtag + ', ' + tage + ' Handelstage');
  console.log('  Schwelle: ' + schwelleMio + ' Mio $ Median-Tagesumsatz');
  console.log('  Rund ' + tage + ' Abrufe, also etwa ' + Math.ceil(tage * M.ABSTAND_MS / 60000) + ' Minuten.\n');

  /* Kalendertage abklappern; Wochenenden und Feiertage liefern leere Antworten und
   * werden uebersprungen, ohne einen Handelstag zu verbrauchen. */
  var proSym = {};            // sym -> [Dollarumsatz je Tag]
  var geholt = 0, versucht = 0;
  var d = new Date(stichtag + 'T00:00:00Z');
  while (geholt < tage && versucht < tage * 3) {
    var tagStr = d.toISOString().slice(0, 10);
    d = new Date(d.getTime() + 86400000);
    var wt = new Date(tagStr + 'T00:00:00Z').getUTCDay();
    if (wt === 0 || wt === 6) continue;      // Wochenende kostet keinen Abruf
    versucht++;
    var j;
    try { j = await M.hole('/v2/aggs/grouped/locale/us/market/stocks/' + tagStr + '?adjusted=true', key); }
    catch (e) { console.log('  ' + tagStr + '  Fehler: ' + e.message.slice(0, 60)); continue; }
    var r = j.results || [];
    if (!r.length) { console.log('  ' + tagStr + '  kein Handel (Feiertag)'); continue; }
    geholt++;
    r.forEach(function (b) {
      if (!b.T || !(b.c > 0) || !(b.v > 0)) return;
      (proSym[b.T] = proSym[b.T] || []).push(b.c * b.v);
    });
    console.log('  ' + tagStr + '  ' + r.length + ' Werte  (Handelstag ' + geholt + '/' + tage + ')');
  }

  if (!geholt) { console.error('Kein einziger Handelstag geholt - Abbruch.'); process.exit(3); }

  /* Median statt Mittel: Ein einzelner Nachrichtentag mit dem hundertfachen Umsatz
   * soll einen sonst engen Wert nicht ins Universum heben. */
  function median(a) {
    var s = a.slice().sort(function (x, y) { return x - y; });
    var m = s.length >> 1;
    return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
  }
  var alle = Object.keys(proSym).map(function (sym) {
    return { sym: sym, tage: proSym[sym].length, umsatz: median(proSym[sym]) };
  }).filter(function (x) {
    /* Mindestens die Haelfte der Tage gehandelt - sonst ist der Median Zufall. */
    return x.tage >= Math.ceil(geholt / 2);
  });
  alle.sort(function (a, b) { return b.umsatz - a.umsatz; });

  var gewaehlt = alle.filter(function (x) { return x.umsatz >= schwelleMio * 1e6; });

  var ordner = M.ablage();
  var ziel = path.join(ordner, 'universum-' + stichtag + '.json');
  fs.writeFileSync(ziel, JSON.stringify({
    verfahren: 'punkt-in-zeit/1.0.0',
    stichtag: stichtag, handelstage: geholt, schwelleMio: schwelleMio,
    hinweis: 'Auswahl nach Median-Dollarumsatz IM Auswahlfenster, nicht nach heutiger Liquiditaet. ' +
             'Enthaelt Werte, die spaeter verschwunden sind - genau darum geht es.',
    erstellt: new Date().toISOString(),
    werte: gewaehlt.map(function (x) { return { sym: x.sym, umsatzMio: Math.round(x.umsatz / 1e5) / 10 }; }),
  }, null, 1));

  console.log('\n' + alle.length + ' Werte mit ausreichender Handelshistorie im Fenster.');
  console.log(gewaehlt.length + ' davon ueber ' + schwelleMio + ' Mio $ Median-Tagesumsatz.\n');
  console.log('Verteilung:');
  [1, 5, 10, 25, 50, 100, 500].forEach(function (s) {
    console.log('  ueber ' + String(s).padStart(3) + ' Mio $:  ' +
      alle.filter(function (x) { return x.umsatz >= s * 1e6; }).length);
  });
  console.log('\nAblage: ' + ziel);

  /* Wie viele davon sind heute noch da? Das ist die Ueberlebensquote und damit die
   * Groesse, die alle bisherigen Messungen dieses Projekts verzerrt hat. */
  var vListe = path.join(ordner, 'verschwundene.json');
  if (fs.existsSync(vListe)) {
    var V = {};
    (JSON.parse(fs.readFileSync(vListe, 'utf8')).eintraege || []).forEach(function (t) { V[t.sym] = t.bis; });
    var weg = gewaehlt.filter(function (x) { return V[x.sym]; });
    console.log('\nDavon inzwischen verschwunden: ' + weg.length + ' (' +
      (100 * weg.length / gewaehlt.length).toFixed(1) + ' %)');
    console.log('Genau diese fehlen im bestehenden Archiv - alle 199 Werte dort haben ueberlebt.');
  }
})();
