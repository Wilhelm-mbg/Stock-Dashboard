'use strict';
/* IST DAS UEBERHAUPT EINE AKTIE?
 *
 * Der Universumsfilter der Maschine lautete sym.indexOf('-USD') === -1 - "kein
 * Krypto". Das ist kein Aktienfilter. Am 24.08.2026 zeigte die Klassifizierung
 * ueber die Schnittstelle, was im 2.885er-Archiv wirklich lag:
 *
 *     CS    (Stammaktien)          2.064
 *     ETF                            622
 *     ADRC  (Hinterlegungsscheine)   144
 *     ETV   (Rohstoff-Treuhaender)    29
 *     FUND                            16
 *     ETN                              6
 *     ETS                              3
 *
 * Also 821 von 2.885 Reihen - 28 % - waren keine Unternehmensaktien. Darunter
 * ZVZZT, das TESTSYMBOL der NASDAQ (41 % seiner Stundenkerzen springen ueber 8 %),
 * und ein Dutzend gehebelter oder inverser Produkte (SOXL, SOXS, UVIX, TSLL,
 * GDXU, GDXD, CONL). Die bewegen sich nicht wie Unternehmen, sondern wie ihr
 * Basiswert mal zwei oder drei - und besetzen damit genau die Plaetze im rechten
 * und linken Schwanz, an denen ein Schaetzer haengt, der von wenigen Trades lebt.
 *
 * WAS ALS AKTIE GILT: CS und ADRC. Ein Hinterlegungsschein ist der Zugang zu einem
 * echten Unternehmen (ASML, ARM, ABEV) und gehoert dazu. Ein Indexfonds, ein
 * Rohstoff-Treuhaender oder ein gehebeltes Zertifikat nicht.
 *
 * KEINE NAMENSLISTE. Eine Liste waere eine Setzung, die still veraltet; die
 * Wertpapierart ist eine Tatsache und kommt aus tools/wertpapierarten-holen.js.
 * Fehlt die Datei, laesst der Filter ALLES durch und sagt es - lieber eine
 * sichtbare Luecke als ein stiller Filter.
 *
 * EINE AUSNAHME VON "KEINE NAMENSLISTE", und warum sie keine ist (Tafel-Entscheid
 * 27.08.2026): die Nasdaq-Testkuerzel. Synthetische Kurse mit echtem Umsatzfeld
 * schlagen in jedem Detektor an; bis heute waren sie nur draussen, weil die
 * Referenzliste sie NICHT KANNTE - "draussen, weil unbekannt" sieht aus wie
 * "draussen, weil ausgeschlossen", bis ein Referenz-Refresh sie als CS aufnimmt
 * (die Boerse fuehrt sie formal so). Und im Ohne-Karte-Rueckfall unten kaemen sie
 * sogar heute durch. Die vier Kuerzel sind eine geschlossene Menge der Boerse,
 * kein pflegebeduerftiger Bestand - genau deshalb duerfen sie als Namen stehen. */
var fs = require('fs');
var path = require('path');
var os = require('os');

var AKTIENARTEN = { CS: 1, ADRC: 1 };
var TESTKUERZEL = { ZVZZT: 1, ZWZZT: 1, ZXZZT: 1, ZJZZT: 1 };
var KARTE = null;
var GERUFEN = {};

/* Ein Ruf je Grund und Prozess, auf dem Fehlerkanal. Je Aufruf waere die Meldung
 * bei grossen Universen dreissigtausendfach da - und damit genauso unsichtbar
 * wie gar keine. stdout gehoert den Ergebnissen der Werkzeuge; eine Meldung
 * dort wuerde jede weiterverarbeitete Ausgabe verunreinigen. (27.08.2026: die
 * Sichtbarkeits-Funktion unten wurde von keinem der ~24 Abnehmer aufgerufen -
 * die Vorsorge lag an einer Stelle, die niemanden erreichte. Dieser Ruf traegt
 * sie dorthin, wo ohnehin jeder hinsieht: ins Log des laufenden Werkzeugs.) */
function warneEinmal(grund, text) {
  if (GERUFEN[grund]) return;
  GERUFEN[grund] = true;
  process.stderr.write('\n!!! WERTPAPIERART: ' + text + '\n\n');
}

function laden() {
  if (KARTE !== null) return KARTE;
  KARTE = false;
  try {
    var p = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'wertpapierarten.json');
    var j = JSON.parse(fs.readFileSync(p, 'utf8'));
    if (j && j.arten && Object.keys(j.arten).length > 1000) KARTE = j.arten;
  } catch (e) { KARTE = false; }
  return KARTE;
}

/** true, wenn das Symbol eine Unternehmensaktie ist. Ohne Klassifizierung: true,
 *  damit eine fehlende Datei nicht stillschweigend das Universum leert. */
function istAktie(sym) {
  if (sym.indexOf('-USD') !== -1) return false;      // Krypto
  if (TESTKUERZEL[sym]) return false;                // vor der Karte UND vor dem Rueckfall
  var k = laden();
  if (!k) {
    warneEinmal('karteFehlt', 'Referenzkarte fehlt, ist unlesbar oder zu klein - ' +
      'JEDES Symbol gilt jetzt als Aktie, das Universum laeuft UNGEFILTERT ' +
      '(ETFs, Hebelprodukte und Fonds eingeschlossen). ' +
      'Abhilfe: node tools/wertpapierarten-holen.js');
    return true;
  }
  /* Yahoo schreibt Aktienklassen mit Bindestrich (BRK-B), die Schnittstelle mit
   * Punkt (BRK.B). Beide Schreibweisen nachschlagen. */
  var a = k[sym] || k[sym.replace(/-/g, '.')];
  if (!a) {
    warneEinmal('eintragFehlt', 'Referenzkarte vorhanden, aber ohne Eintrag fuer ' + sym +
      ' (erster Fall dieses Laufs; weitere werden nicht gemeldet) - ' +
      'solche Symbole fallen STILL aus dem Universum heraus.');
    return false;                                     // unbekannt = nicht belegt = raus
  }
  return !!AKTIENARTEN[a];
}

/** Fuer das Protokoll: liegt eine Klassifizierung vor? */
function klassifizierungDa() { return !!laden(); }

module.exports = { istAktie: istAktie, klassifizierungDa: klassifizierungDa, AKTIENARTEN: AKTIENARTEN, TESTKUERZEL: TESTKUERZEL };
