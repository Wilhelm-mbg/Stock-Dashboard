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
 * Aufruf:  node tools/massive-tagesdaten.js [maxWerte] [--alle] [--erneuern]
 *          --erneuern holt schon Vorhandenes noch einmal (etwa um ein fehlendes
 *          Feld nachzutragen). Ohne den Schalter wird Vorhandenes uebersprungen.
 *          ohne --alle werden nur Werte an NYSE/NASDAQ geholt, die im Messzeitraum
 *          ueberhaupt existierten - der Rest waere fuer ein Grosswerte-Universum
 *          ohnehin nie in Frage gekommen.
 * Ablage:  <Downloads>/Markt-Dashboard-Daten/massive/tagesdaten/<SYM>.json
 */
var fs = require('fs');
var path = require('path');
var M = require('./massive.js');

/* VEREINIGEN STATT UEBERSCHREIBEN.
 * Im Piloten am 27.08.2026 aufgefallen: 15 von 20 erneuerten Reihen hatten
 * HINTERHER EINE KERZE WENIGER. Die Ursache ist dieselbe rollende 730-Tage-Grenze,
 * die den ganzen Auftrag ausgeloest hat - seit dem Erstabruf ist sie
 * weitergewandert, der aelteste Tag faellt aus der Antwort, und ein blankes
 * writeFileSync warf ihn damit weg. Das waere absurd gewesen: ein Lauf, der den
 * Eroeffnungskurs RETTEN soll, haette bei jedem Wert einen ganzen Tag vernichtet.
 *
 * Bei gleichem Zeitstempel gewinnt die FRISCHE Kerze - sie hat den Eroeffnungskurs.
 * Alte Kerzen ausserhalb des Fensters bleiben stehen; sie haben keinen, aber sie
 * sind die einzigen, die es je geben wird.
 * Eine alte Kerze mit fuenf Feldern bekommt die Eroeffnung als null HINTEN
 * angehaengt, nie eingeschoben - sonst laese jeder Verbraucher lautlos falsch.
 *
 * Eigene Funktion, damit test-v6 sie ohne Netz aufrufen kann. Sie gibt die
 * frische Reihe NICHT veraendert zurueck, sondern eine neue: die Lauf-Statistik
 * unten muss weiter sagen koennen, was die QUELLE geliefert hat, und nicht, was
 * nach dem Mischen in der Datei steht. Genau das ging beim ersten Versuch schief.
 * (Dieselbe Lehre wie im Kursarchiv, wo zusammenfuehren() dafuer da ist. Dieses
 * Werkzeug hatte sie nie gelernt.) */
/* EIN SYMBOL, EINE DATEI.
 * Im Piloten am 27.08.2026 aufgefallen: AC stand auf Platz 10 UND 11 - zwei
 * Zeilen, dieselbe Firma, Loeschdatum einen Tag auseinander. Die Liste der
 * Verschwundenen ist aus mehreren Abzuegen zusammengesetzt, und wer an zwei
 * aufeinanderfolgenden Tagen verschwand, steht zweimal drin: 23 von 1.633.
 * Der Lauf holte solche Werte zweimal - 23 Abrufe zu je 13 s, rund fuenf Minuten.
 *
 * WICHTIGER ALS DIE FUENF MINUTEN: seit dem Vereinigen ist ein Doppeleintrag
 * nicht mehr harmlos. Frueher ueberschrieb der zweite Abruf den ersten, jetzt
 * MISCHT er sich hinein. Solange beide Zeilen dieselbe Firma meinen, ist das
 * folgenlos - gemessen am 27.08.2026 ist das bei allen 23 der Fall. Wird ein
 * Ticker aber je neu vergeben (in den USA ueblich, sobald er frei ist), lagen
 * zwei verschiedene Unternehmen in EINER Kursreihe, ohne dass es jemand saehe.
 * Genau davor warnt die Meldung unten - sie ist bewusst laut, weil so ein Fund
 * ein anderes Werkzeug braucht und nicht stillschweigend gemittelt werden darf.
 *
 * Behalten wird der Eintrag mit dem SPAETESTEN Loeschdatum: er deckt den
 * laengeren Zeitraum ab, und der Abruf holt ohnehin alles bis heute. */
function entdoppeln(kandidaten) {
  var nach = Object.create(null);
  kandidaten.forEach(function (t) { (nach[t.sym] = nach[t.sym] || []).push(t); });
  var raus = [], doppelt = 0, verdaechtig = [];
  kandidaten.forEach(function (t) {
    var e = nach[t.sym];
    if (!e) return;                       // schon abgehandelt
    delete nach[t.sym];                   // Reihenfolge des ersten Vorkommens bleibt
    if (e.length > 1) {
      doppelt += e.length - 1;
      /* Zwei Zeitraeume, die sich NICHT beruehren, sind kein Abzugs-Artefakt,
       * sondern zwei Firmen. Ein Tag Unterschied im Loeschdatum ist eines. */
      var spannen = e.map(function (x) { return { von: x.von || null, bis: x.bis || null }; });
      var echt = spannen.some(function (a) {
        return spannen.some(function (b) {
          return a.bis && b.von && b.von > a.bis;
        });
      });
      if (echt) verdaechtig.push(t.sym);
    }
    var beste = e[0];
    e.forEach(function (x) { if ((x.bis || '') > (beste.bis || '')) beste = x; });
    raus.push(beste);
  });
  return { liste: raus, doppelt: doppelt, verdaechtig: verdaechtig };
}

function vereinigen(vorhanden, frisch) {
  var karte = Object.create(null);
  (vorhanden || []).forEach(function (k) {
    karte[k[0]] = k.length >= 6 ? k : [k[0], k[1], k[2], k[3], k[4], null];
  });
  frisch.forEach(function (k) { karte[k[0]] = k; });
  var reihe = Object.keys(karte).map(Number).sort(function (a, b) { return a - b; })
    .map(function (ms) { return karte[ms]; });
  return { reihe: reihe, behalten: reihe.length - frisch.length };
}

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

/* Der Lauf startet nur als Programm. Beim require aus test-v6 wird nur die
 * Funktion oben geholt - sonst zoege ein Testlauf ueber Stunden Daten.
 * Kein top-level return: node erlaubt ihn im CommonJS-Wrapper, der Linter nicht. */
module.exports = { vereinigen: vereinigen, entdoppeln: entdoppeln };

if (require.main === module) (async function () {
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

  var ed = entdoppeln(kandidaten);
  if (ed.doppelt) {
    console.log('Doppelt in der Liste: ' + ed.doppelt + ' Eintraege - je Symbol bleibt einer.');
  }
  if (ed.verdaechtig.length) {
    console.log('');
    console.log('!! TICKER OFFENBAR NEU VERGEBEN: ' + ed.verdaechtig.join(', '));
    console.log('   Zwei Eintraege desselben Kuerzels mit getrennten Zeitraeumen - das sind');
    console.log('   zwei Firmen. Eine Datei kann sie nicht beide fuehren; die Reihe waere');
    console.log('   eine Mischung. Von Hand klaeren, bevor diese Werte gemessen werden.');
    console.log('');
  }
  kandidaten = ed.liste;

  var ordner = M.ablage('tagesdaten');  var standDatei = path.join(M.ablage(), 'tagesdaten-stand.json');
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
  /* --erneuern: schon Geholtes NOCH EINMAL holen. Ohne diesen Schalter ueberspringt
   * der Lauf jeden Wert, den er hat, und meldet "Nichts zu tun" - dieselbe Stille,
   * an der das Kursarchiv zwei Tage stillstand.
   * Gebraucht wird er, seit am 27.08.2026 auffiel, dass allen 1.164 Reihen der
   * EROEFFNUNGSKURS fehlt, obwohl die Quelle ihn liefert. Ohne Erneuern waere der
   * Fehler zwar behoben, aber nur fuer kuenftige Werte - und das Quellfenster rollt
   * mit 730 Tagen, es sind rund 980 Symbol-Tage je Handelstag.
   * Die Reihenfolge ist die des Universums, also stabil: ein Pilot ueber die ersten
   * zwanzig ist wiederholbar und deckt dieselben Werte ab wie der Anfang des
   * Vollaufs. */
  var erneuern = process.argv.indexOf('--erneuern') !== -1;
  var offen = erneuern
    ? kandidaten.filter(function (t) { return stand.fertig[t.sym]; })
    : kandidaten.filter(function (t) { return !stand.fertig[t.sym] && !stand.ohneDaten[t.sym]; });
  if (erneuern) console.log('ERNEUERN: ' + offen.length + ' vorhandene Reihen werden neu geholt.');
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
  var gekuerzt = 0, fruehesteGeliefert = null, ausserhalbBehalten = 0;
  for (var i = 0; i < nimm.length; i++) {
    var t = nimm[i];
    var pfad = '/v2/aggs/ticker/' + encodeURIComponent(t.sym) + '/range/1/day/' + VON + '/' + BIS +
      '?adjusted=true&sort=asc&limit=50000';
    try {
      var j = await M.hole(pfad, key);
      /* DER EROEFFNUNGSKURS WURDE HIER WEGGEWORFEN - 305.908 von 305.908 Kerzen
       * ohne, obwohl die Quelle ihn liefert (Feldliste c h l n o t v vw; an AVB
       * belegt: o = 185,60). Gefunden vom Tueftler am 27.08.2026.
       *
       * WARUM DAS TEUER WAR: Jede Uebernacht-Frage braucht die Eroeffnung des
       * Folgetags, und ueber Nacht ist die Aufloesungswand ueberhaupt nur zu
       * unterbieten. Ohne diesen Kurs laesst sich fuer das Uebernachtfenster nicht
       * pruefen, ob die Ueberlebensluecke das Vorzeichen dreht - also genau der
       * Vorbehalt nicht ausraeumen, der in beiden Vorregistrierungen steht.
       * Und das Quellfenster rollt: rund 980 Symbol-Tage je Handelstag fallen
       * hinten heraus und sind dauerhaft weg.
       *
       * DIE EROEFFNUNG KOMMT HINTEN DRAN, die ersten fuenf Felder bleiben, wo sie
       * sind - genau wie im Kursarchiv. Ein stiller Wechsel der Feldreihenfolge
       * waere schlimmer als das fehlende Feld: jeder vorhandene Leser laese dann
       * lautlos falsch.
       * null statt Rueckfall auf den Schluss, wenn er fehlt: die Messmaschine warnt
       * eigens (C7), wenn eine Reihe keine Eroeffnungskurse fuehrt. Faellt der Wert
       * still auf den Schluss, kann diese Warnung nie mehr feuern. */
      var bars = (j.results || []).map(function (b) {
        var o = (typeof b.o === 'number' && isFinite(b.o) && b.o > 0) ? b.o : null;
        return [b.t, b.c, b.v || 0, b.h, b.l, o];
      });
      if (bars.length < 20) {
        stand.ohneDaten[t.sym] = { grund: bars.length + ' Kerzen', am: new Date().toISOString().slice(0, 10) };
        leer++;
        console.log('  ' + String(i + 1).padStart(3) + '/' + nimm.length + '  ' + t.sym.padEnd(8) + 'nur ' + bars.length + ' Kerzen - vermerkt, wird nicht erneut geholt');
      } else {
        /* WAS DIE QUELLE GELIEFERT HAT - festgehalten, BEVOR gemischt wird.
         * Die Kuerzungswarnung unten ist die einzige Stelle, an der dieses Werkzeug
         * ueberhaupt merkt, dass das Quellfenster rollt. Rechnete sie auf der
         * gemischten Reihe, meldete sie ab dem zweiten Lauf "der angefragte Zeitraum
         * kam vollstaendig an" - eine Entwarnung ausgerechnet ueber den Vorgang, der
         * die Daten frisst. */
        var rohVon = new Date(bars[0][0]).toISOString().slice(0, 10);
        var datei = path.join(ordner, t.sym + '.json');
        var vorhanden = null;
        if (fs.existsSync(datei)) {
          try { vorhanden = JSON.parse(fs.readFileSync(datei, 'utf8')).series || null; }
          catch (e) { vorhanden = null; /* unlesbar: die frische Reihe ersetzt sie */ }
        }
        var v = vereinigen(vorhanden, bars);
        var reihe = v.reihe;
        if (v.behalten > 0) ausserhalbBehalten += v.behalten;
        fs.writeFileSync(datei, JSON.stringify({
          sym: t.sym, name: t.name, boerse: t.boerse, delistet: t.bis,
          quelle: 'massive /v2/aggs 1/day, adjusted', stand: new Date().toISOString(),
          format: '[zeit, schluss, umsatz, hoch, tief, eroeffnung]',
          angefragtVon: VON, angefragtBis: BIS,
          /* Diese beiden Felder beschreiben die DATEI, nicht den Abruf: was der
           * Verbraucher hier vorfindet. quellfensterVon nennt daneben den Rand des
           * Abonnements bei diesem Lauf - daran ist spaeter ablesbar, welche Tage
           * nur noch deshalb existieren, weil sie einmal gesichert wurden. */
          geliefertVon: new Date(reihe[0][0]).toISOString().slice(0, 10),
          geliefertBis: new Date(reihe[reihe.length - 1][0]).toISOString().slice(0, 10),
          quellfensterVon: rohVon,
          series: reihe,
        }));
        /* Was DIESE Reihe wirklich abdeckt - nicht, was angefragt war. Ohne diese
         * beiden Felder muss jeder Verbraucher die Reihe selbst aufmachen, um zu
         * erfahren, ob sie den gewuenschten Zeitraum ueberhaupt enthaelt. */
        var abVon = new Date(reihe[0][0]).toISOString().slice(0, 10);
        var bisBis = new Date(reihe[reihe.length - 1][0]).toISOString().slice(0, 10);
        stand.fertig[t.sym] = { kerzen: reihe.length, bis: t.bis, von: abVon, letzte: bisBis };
        /* rohVon, nicht abVon: siehe oben. */
        if (rohVon > VON) gekuerzt++;
        if (!fruehesteGeliefert || rohVon < fruehesteGeliefert) fruehesteGeliefert = rohVon;
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
    if (ausserhalbBehalten) console.log("Aus dem Bestand behalten (ausserhalb des Fensters): " +
      ausserhalbBehalten + " Kerzen - sie waeren beim Ueberschreiben verloren gewesen.");
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
