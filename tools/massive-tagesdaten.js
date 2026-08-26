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
 * Spanne abdecken.
 *
 * DIESER WUNSCH GEHT NICHT IN ERFUELLUNG, und bis zum 27.08.2026 sagte das niemand.
 * Die Quelle liefert ein ROLLENDES 730-Tage-Fenster, gemessen an den 1.164 bereits
 * geholten Reihen - ohne einen einzigen weiteren Abruf:
 *   abgerufen am 2026-08-23  ->  frueheste Kerze 2024-08-23   (exakt 730 Tage)
 *   abgerufen am 2026-08-25  ->  frueheste Kerze 2024-08-26   (davor Wochenende)
 * 889 von 1.164 Reihen beginnen am selben Tag. Das ist keine Eigenschaft der Werte,
 * das ist der Rand des Abonnements. Die Anfrage ist also nicht falsch gestellt - es
 * gibt schlicht nicht mehr.
 *
 * ZWEI FOLGEN, die jeder kennen muss, der mit diesen Daten rechnet:
 *   1. Das eigene 60m-Archiv beginnt am 2023-09-26. Die Verschwundenen koennen die
 *      ersten elf Monate davon NIE abdecken - die Ueberlebenskorrektur ist fuer
 *      diesen Abschnitt strukturell unvollstaendig, nicht nur noch nicht geholt.
 *   2. Die Mauer wandert taeglich mit. Was heute geholt ist, ist das Aelteste, das
 *      fuer diese Werte je existieren wird; morgen ist ein Tag davon fort.
 * VON bleibt bewusst stehen: es ist der WUNSCH, und der Abstand zum Gelieferten ist
 * genau das, was gemeldet werden soll. Eine Anfrage auf das Fenster zu kuerzen
 * haette den Unterschied unsichtbar gemacht - dieselbe Stille in neuer Verkleidung. */
var VON = '2023-11-13';
var FENSTER_TAGE = 730;   // gemessen 27.08.2026, siehe oben
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

  /* STICHPROBE - fuer schnelle Vorlaeufe, nicht als Ersatz der Vollerhebung.
   * Wilhelm holt alle 1.633 Werte (rund sechs Stunden); das ist die bessere Grundlage,
   * weil sich damit BEIDE Fragen beantworten lassen: "wie liefen die Verschwundenen
   * insgesamt" und "was macht Momentum auf einem Universum, das nur die damals grossen
   * Werte enthaelt, aber ohne Rueckschau". Fuer die zweite braucht es Umsatz und Kurs
   * der Verschwundenen - und die stehen erst in den geholten Daten. Vorher zu filtern
   * hiesse zu raten, was gemessen werden soll.
   * Die Stichprobe bleibt fuer Vorlaeufe: fester Startwert, also wiederholbar. */
  var stichprobe = 0;
  var si = process.argv.indexOf('--stichprobe');
  if (si !== -1) stichprobe = parseInt(process.argv[si + 1], 10) || 0;
  if (stichprobe > 0 && stichprobe < kandidaten.length) {
    var s = 20260823;   // fester Startwert: derselbe Aufruf zieht dieselbe Stichprobe
    var rnd = function () { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; };
    var kopie = kandidaten.slice();
    for (var q = kopie.length - 1; q > 0; q--) { var w = Math.floor(rnd() * (q + 1)); var h = kopie[q]; kopie[q] = kopie[w]; kopie[w] = h; }
    kandidaten = kopie.slice(0, stichprobe);
    console.log('Zufallsstichprobe: ' + stichprobe + ' von ' + kopie.length + ' (fester Startwert, wiederholbar)');
  }
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
  console.log('Abbruch mit Strg+C ist gefahrlos - der Fortschritt steht nach jedem Wert auf der Platte.');
  /* Die Ansage VOR dem Lauf, nicht erst danach: wer 40 Werte holt, soll vorher
   * wissen, dass ein Teil des angefragten Zeitraums gar nicht kommen kann. */
  var randTag = new Date(Date.now() - FENSTER_TAGE * 86400000).toISOString().slice(0, 10);
  if (randTag > VON) {
    console.log('\nACHTUNG, die Quelle kuerzt: angefragt ab ' + VON + ', geliefert wird\n' +
      '  fruehestens ab etwa ' + randTag + ' (rollendes Fenster von ' + FENSTER_TAGE + ' Tagen).\n' +
      '  Rund ' + Math.round((Date.parse(randTag) - Date.parse(VON)) / 86400000) +
      ' Tage des gewuenschten Zeitraums gibt es nicht - und zwar dauerhaft nicht.');
  }
  console.log('');

  var geholt = 0, leer = 0, fehler = 0;
  var gekuerzt = 0, fruehesteGeliefert = null;
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
          angefragtVon: VON, angefragtBis: BIS,
          geliefertVon: new Date(bars[0][0]).toISOString().slice(0, 10),
          geliefertBis: new Date(bars[bars.length - 1][0]).toISOString().slice(0, 10),
          series: bars,
        }));
        /* Was DIESE Reihe wirklich abdeckt - nicht, was angefragt war. Ohne diese
         * beiden Felder muss jeder Verbraucher die Reihe selbst aufmachen, um zu
         * erfahren, ob sie den gewuenschten Zeitraum ueberhaupt enthaelt. */
        var abVon = new Date(bars[0][0]).toISOString().slice(0, 10);
        var bisBis = new Date(bars[bars.length - 1][0]).toISOString().slice(0, 10);
        stand.fertig[t.sym] = { kerzen: bars.length, bis: t.bis, von: abVon, letzte: bisBis };
        if (abVon > VON) gekuerzt++;
        if (!fruehesteGeliefert || abVon < fruehesteGeliefert) fruehesteGeliefert = abVon;
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
  /* DIE KUERZUNG WIRD BEZIFFERT, nicht nur erwaehnt. Ein Lauf, der 40 Reihen holt und
   * bei 40 davon ein Jahr weniger bekommt als angefragt, darf nicht so aussehen wie
   * einer, der bekommen hat, wonach er fragte. Genau diese Stille hat das Kursarchiv
   * zwei Tage unbemerkt stillstehen lassen. */
  if (geholt) {
    console.log("Frueheste gelieferte Kerze in diesem Lauf: " + fruehesteGeliefert +
      "  (angefragt ab " + VON + ")");
    if (gekuerzt) {
      console.log("GEKUERZT: " + gekuerzt + " von " + geholt + " Reihen beginnen spaeter als angefragt.");
      console.log("  Das ist kein Fehler dieses Laufs - die Quelle fuehrt ein rollendes");
      console.log("  Fenster von " + FENSTER_TAGE + " Tagen. Was davor liegt, gibt es dauerhaft nicht,");
      console.log("  und die Grenze wandert jeden Tag um einen Tag weiter.");
    } else {
      console.log("Keine Reihe wurde gekuerzt - der angefragte Zeitraum kam vollstaendig an.");
    }
  }
  var restlich = offen.length - nimm.length;
  if (restlich > 0) console.log('Noch offen: ' + restlich + ' - einfach erneut aufrufen, es geht dort weiter.');
  console.log('Ablage: ' + ordner);
})();
