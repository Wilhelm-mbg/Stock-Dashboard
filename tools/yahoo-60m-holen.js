'use strict';
/* 60-MINUTEN-KERZEN FUER EIN GROSSES UNIVERSUM - in ein EIGENES Archiv.
 *
 * WARUM YAHOO UND NICHT MASSIVE. Beide liefern zwei Jahre Stundenkerzen. Aber:
 *   Yahoo   1 Abruf je Wert (range=730d), Sitzungsstunden 13-20 UTC, Umsatz-
 *           konvention IDENTISCH zum bestehenden Archiv
 *   Massive 8 Abrufe je Wert (blaettert nach ~100 Kalendertagen), enthaelt
 *           Vor- und Nachboerse (0, 8-23 UTC), andere Konvention
 * Fuer eine Messung, die zum Live-Handel passen soll, gewinnt Yahoo: Die App holt
 * ihre Kurse selbst von dort. Massive bleibt fuer die VERSCHWUNDENEN Werte, die
 * Yahoo nicht mehr kennt - aber in einem getrennten Archiv, nie gemischt. Der
 * dokumentierte Schaden (CFD und Yahoo in derselben Reihe, Umsatz um Faktor ~500
 * daneben) kam genau aus dem Mischen, und der Kapitulations-Ausloeser haengt am
 * Umsatz.
 *
 * NEU GEGENUEBER DEM APP-ARCHIV: der EROEFFNUNGSKURS als sechstes Element.
 *     [Zeit, Schluss, Umsatz, Hoch, Tief, Eroeffnung]
 * Die ersten fuenf bleiben unveraendert - jede vorhandene Auswertung liest weiter
 * richtig. Yahoo liefert den Eroeffnungskurs; die App verwirft ihn. Gemessen:
 * 14,3 % aller Kerzen folgen auf eine Uebernachtluecke, 40,6 % dieser Luecken
 * springen ueber 1 %. Ohne Eroeffnungskurs muss jede Ausstiegsregel den Schluss
 * der Vorkerze als ersten handelbaren Kurs nehmen - genau dort ist das falsch.
 *
 * SCHONEND: 1,2 s Abstand, Wiederholung mit wachsender Pause bei HTTP 429,
 * Fortschritt nach JEDEM Wert auf der Platte. Ein Abbruch kostet nichts.
 *
 * Aufruf:  node tools/yahoo-60m-holen.js [liste] [maxWerte]
 *   liste     'etf'      SPY und die grossen Index-ETFs (Vorgabe, klein)
 *             'top500'   die 500 umsatzstaerksten des Punkt-in-Zeit-Universums
 *             'alle'     alles im Punkt-in-Zeit-Universum
 *             SYM,SYM    eigene Liste
 *   maxWerte  Obergrenze je Lauf (Vorgabe: alles)
 *   --aktualisieren   alles Vorhandene neu holen und ZUSAMMENFUEHREN. So waechst
 *                     das Archiv ueber Yahoos 730-Tage-Grenze hinaus.
 *
 * Intervall ueber MD_INTERVALL (Vorgabe 60m). Gemessen am 24.08.2026, was Yahoo
 * hergibt - je Intervall die groesste Spanne mit voller Aufloesung:
 *     1d   40 Jahre   ~10.076 Kerzen     60m  2 Jahre   ~5.087
 *     5m   60 Tage     ~4.651            15m  60 Tage   ~1.551
 *     1m    7 Tage     ~2.577
 * (range=max ignoriert das Intervall und liefert Monatskerzen.)
 *
 * Ablageort: MD_ARCHIV60M zeigt auf den 60m-Ordner, sonst
 * <Datenordner>/archiv60m-pfad.txt, sonst <Datenordner>/archiv60m. Die anderen
 * Intervalle liegen als Geschwisterordner daneben (archiv1d, archiv5m, ...).
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var Wachhund = require('./archiv-wachhund.js');
/* DIE DEFINITION EINER KERZE STEHT SEIT DEM 26.08.2026 AN EINER STELLE.
 * Seit die App selbst Intraday sammelt, schreiben zwei Programme in dieselben
 * Archive. Zwei Vorstellungen davon, was eine Kerze ist, waeren der Fehler, der hier
 * schon 66 Reihen unbrauchbar gemacht hat. Also holt sich dieses Werkzeug die
 * Definition, statt sie zu haben. */
var Q = require('../kerzenquelle.js');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');

/* Was Yahoo je Intervall hergibt - am 24.08.2026 an AAPL gemessen, nicht geraten.
 * range=max ignoriert das Intervall und liefert Monatskerzen; deshalb je Intervall
 * die groesste Spanne, die noch die gewuenschte Aufloesung liefert. */
var INTERVALLE = Q.INTERVALLE;
var IV = process.env.MD_INTERVALL || '60m';
if (!INTERVALLE[IV]) { console.error('Unbekanntes Intervall: ' + IV + ' (bekannt: ' + Object.keys(INTERVALLE).join(' ') + ')'); process.exit(2); }
var CFG = INTERVALLE[IV];
/* Die Mindestzahl an Kerzen richtet sich nach dem Intervall - bei 1m sind 200
 * Kerzen ein halber Handelstag, bei 1d fast ein Jahr. */
var MIN_KERZEN = Math.max(50, Math.round(CFG.etwa * 0.04));

/* ABLAGEORT. Das Archiv wird gross - rund 470 KB je Wert, bei 3.263 Werten also
 * etwa 1,5 GB. Auf der Systemplatte hat das nichts verloren. Reihenfolge:
 *   1. Umgebungsvariable MD_ARCHIV60M
 *   2. Zeigerdatei <Datenordner>/archiv60m-pfad.txt  (eine Zeile, der Pfad)
 *   3. Rueckfall: <Datenordner>/archiv60m
 * Die Zeigerdatei ist der bequeme Weg: einmal setzen, und jedes Studienskript
 * findet das Archiv, ohne dass irgendwo ein Pfad fest verdrahtet steht. */
/* Wo das Archiv liegt, entscheidet kerzenquelle.js - dieselbe Kette, die auch die App
 * und der Wachhund benutzen. Bis zum 26.08.2026 stand sie hier ein zweites Mal, und
 * die beiden Fassungen gaben fuer 1m/5m/15m verschiedene Antworten. */
function zielFuerIntervall() { return Q.ordnerVon(IV); }
var ZIEL = zielFuerIntervall();

/* Wie alt ist das Archiv WIRKLICH? Nicht "wann wurde geschrieben" - am 26.08.2026
 * wurden alle 2.887 Dateien neu geschrieben (von der Teilkerzen-Bereinigung) und
 * trugen trotzdem nur Daten bis zum 24.08. Gefragt ist die juengste KERZE.
 * Die Rechnung dazu steht in archiv-wachhund.js und wird von dort geholt. */
function standMelden(nachgezogen) {
  try {
    var b = Wachhund.pruefe(ZIEL, { stichprobe: 400 });
    console.log('\n' + Wachhund.textZu(b));
    if (!b.grund && b.rueckstandHandelstage >= 1 && !nachgezogen) {
      console.log('  Zum Nachziehen:  node tools/yahoo-60m-holen.js alle --aktualisieren');
    }
  } catch (e) { console.log('\n(Stand nicht pruefbar: ' + (e && e.message || e) + ')'); }
}
/* Welche Werte, wohin sie kommen, wie eine Reihe fortgeschrieben wird und wie oft
 * Yahoo gefragt werden darf: alles in kerzenquelle.js. Bis zum 26.08.2026 stand
 * es hier, und die App haette es nachbauen muessen - ein Nachbau waere die zweite
 * Vorstellung davon, was ins Archiv gehoert. */
var ABSTAND_MS = Q.ABSTAND_MS;
var ETFS = Q.ETFS;
var listeBauen = Q.listeBauen;

(async function () {
  var wahl = process.argv[2] || 'etf';
  var maxWerte = parseInt(process.argv[3], 10) || Infinity;
  var aktualisieren = process.argv.indexOf('--aktualisieren') !== -1;

  if (!fs.existsSync(ZIEL)) fs.mkdirSync(ZIEL, { recursive: true });
  var stand = Q.standLesen(ZIEL);

  /* Beim Aktualisieren ist nichts "schon erledigt" - es geht ja gerade darum,
   * das Vorhandene fortzuschreiben. */
  var liste, quelle;
  if (aktualisieren) {
    liste = Object.keys(stand.fertig);
    quelle = 'FORTFUEHREN: ' + liste.length + ' vorhandene Werte werden nachgezogen';
  } else {
    var b = listeBauen(wahl);
    if (b.grund) { console.error(b.grund); process.exit(2); }
    liste = b.symbole;
    quelle = 'Auswahl "' + wahl + '": ' + liste.length + ' Werte (' + b.quelle + ')';
  }
  var offen = aktualisieren ? liste
    : liste.filter(function (s) { return !stand.fertig[s] && !stand.ohne[s]; });
  var nimm = offen.slice(0, maxWerte);

  console.log(IV + '-Kerzen von Yahoo (range=' + CFG.range + '), eigenes Archiv mit Eroeffnungskurs');
  console.log('  ' + quelle);
  console.log('  schon geholt: ' + Object.keys(stand.fertig).length + ' | ohne Daten: ' + Object.keys(stand.ohne).length);
  console.log('  dieser Lauf: ' + nimm.length + ', geschaetzt ' + Math.ceil(nimm.length * ABSTAND_MS / 60000) + ' Minuten');
  console.log('  Ablage: ' + ZIEL);
  console.log('  Abbruch mit Strg+C ist gefahrlos.\n');
  /* HIER LAG DER FEHLER (26.08.2026). Ohne --aktualisieren ueberspringt der Lauf
   * jeden Wert, den er schon hat, meldet "Nichts zu tun" und geht mit Erfolg aus.
   * Genau so stand das Stundenarchiv zwei Tage still, ohne dass es jemand merkte:
   * ein Lauf, der nichts dazulernt, sah von aussen aus wie ein gesunder Lauf.
   * Er sagt jetzt, wie alt das Archiv wirklich ist - und was zu tun waere. */
  if (!nimm.length) {
    console.log('Nichts zu tun: alle gewaehlten Werte liegen schon im Archiv.');
    standMelden(aktualisieren);
    return;
  }

  /* Strg+C loest die Sperre. Der Lauf selbst raeumt sie ohnehin auf, auch wenn
   * etwas fliegt - aber ein hartes Abwuergen kommt dort nie an. Gemessen am
   * 26.08.2026: ein mit timeout beendeter Lauf fuehrt seinen Handler NICHT aus,
   * deshalb fragt die Sperre inzwischen selbst nach, ob ihr Schreiber noch lebt. */
  var anhalten = false;
  process.on('SIGINT', function () { anhalten = true; });

  var erg = await Q.sammle({
    intervall: IV,
    ziel: ZIEL,
    symbole: nimm,
    was: IV + ' ' + (aktualisieren ? 'aktualisieren' : 'neu holen') + ', ' + nimm.length + ' Werte',
    weiter: function () { return !anhalten; },
    melde: function (m) {
      if (m.art !== 'wert') return;
      console.log('  ' + String(m.nr).padStart(4) + '/' + m.von + '  ' + m.sym.padEnd(8) +
        (m.fehler ? m.fehler
          : String(m.kerzen).padStart(5) + ' Kerzen' + (m.dazu > 0 ? '  (+' + m.dazu + ' neu)' : '') +
            (m.ohneEroeffnung ? '  (' + m.ohneEroeffnung + ' ohne Eroeffnung)' : '')));
    },
  });

  console.log('\n' + erg.ok + ' Reihen geholt (' + erg.kerzen.toLocaleString('de-DE') + ' Kerzen), ' + erg.leer + ' ohne Daten.');
  if (erg.kerzen) console.log('Ohne Eroeffnungskurs: ' + erg.ohneEroeffnung + ' Kerzen (' +
    (100 * erg.ohneEroeffnung / erg.kerzen).toFixed(2) + ' %).');
  if (erg.abgebrochen) console.log('ABGEBROCHEN: ' + erg.grund);
  var rest = offen.length - erg.verarbeitet;
  if (rest > 0) console.log('Noch offen: ' + rest + ' - einfach erneut aufrufen.');
  /* Erst ist die Sperre weg (das erledigt sammle), dann wird gemeldet - sonst
   * prueft standMelden sein eigenes Archiv als "wird gerade geschrieben". */
  standMelden(aktualisieren);
})();
