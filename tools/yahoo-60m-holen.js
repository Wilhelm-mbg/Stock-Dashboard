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
var https = require('https');
var Wachhund = require('./archiv-wachhund.js');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');

/* Was Yahoo je Intervall hergibt - am 24.08.2026 an AAPL gemessen, nicht geraten.
 * range=max ignoriert das Intervall und liefert Monatskerzen; deshalb je Intervall
 * die groesste Spanne, die noch die gewuenschte Aufloesung liefert. */
var INTERVALLE = {
  '1d':  { range: '40y',  ordner: 'archiv1d',  etwa: 10076 },
  '60m': { range: '730d', ordner: 'archiv60m', etwa: 5087 },
  '15m': { range: '60d',  ordner: 'archiv15m', etwa: 1551 },
  '5m':  { range: '60d',  ordner: 'archiv5m',  etwa: 4651 },
  '1m':  { range: '7d',   ordner: 'archiv1m',  etwa: 2577 },
};
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
function archivOrdner() {
  if (process.env.MD_ARCHIV60M) return process.env.MD_ARCHIV60M;
  var zeiger = path.join(DATEN, 'archiv60m-pfad.txt');
  try {
    var p = fs.readFileSync(zeiger, 'utf8').replace(/^\uFEFF/, '').trim();
    if (p) return p;
  } catch (e) { /* keine Zeigerdatei: Rueckfall */ }
  return path.join(DATEN, 'archiv60m');
}
/* Der Zeiger nennt den 60m-Ordner; die anderen Intervalle liegen daneben. */
function zielFuerIntervall() {
  var basis = archivOrdner();
  if (IV === '60m') return basis;
  return path.join(path.dirname(basis), CFG.ordner);
}
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
var STAND = path.join(ZIEL, 'stand.json');
var DATEI_PRAEFIX = 'bars_' + IV + '_';
var MASSIVE = path.join(DATEN, 'massive');
var ABSTAND_MS = 1200;

/* Die grossen Index- und Sektor-ETFs. SPY steht bewusst vorn: Das Regime-Tor im
 * Live-Handel prueft SPY gegen seine Stunden-EMA200, und weil SPY im App-Archiv
 * fehlt, musste die Kapitulations-Messung es ueber eine Tagesreihe naehern. */
var ETFS = ('SPY QQQ IWM DIA VOO IVV RSP TLT HYG LQD GLD SLV USO ' +
  'XLF XLK XLE XLV XLI XLP XLY XLU XLB XLRE XLC SMH SOXX EEM EFA FXI GDX VXX').split(' ');

/* ETFs kommen in einen eigenen Unterordner. Die Messmaschine waehlt "aktien" ueber
 * sym.indexOf('-USD') === -1 - das ist ein Filter gegen Krypto, nicht gegen
 * Indexfonds. Laegen SPY und QQQ zwischen den Aktien, wuerde eine Aktienstrategie
 * sie mitmessen; bei SPY waere es schlimmer, denn es ist zugleich der Anker des
 * Regime-Tors - Messobjekt und Massstab in einem. */
var ETF_SATZ = {};
ETFS.forEach(function (s) { ETF_SATZ[s] = 1; });
function istEtfSym(s) { return !!ETF_SATZ[s]; }
function ordnerFuer(sym) { return istEtfSym(sym) ? path.join(ZIEL, 'etf') : ZIEL; }

/* Massive schreibt Aktienklassen mit Punkt (BRK.B), Yahoo mit Bindestrich (BRK-B). */
function yahooName(sym) { return sym.replace(/\./g, '-'); }

function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function hole(url) {
  return new Promise(function (res, rej) {
    var r = https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36',
        'Accept': 'application/json',
        'Origin': 'https://finance.yahoo.com',
        'Referer': 'https://finance.yahoo.com/',
      },
    }, function (a) {
      var d = '';
      a.on('data', function (c) { d += c; });
      a.on('end', function () { res({ status: a.statusCode, body: d }); });
    });
    r.on('error', rej);
    r.setTimeout(30000, function () { r.destroy(new Error('Zeitueberschreitung')); });
  });
}

/* Dieselbe Kurspruefung wie in der App: '== null' allein reicht nicht, eine 0
 * oder ein NaN kaeme durch. Ein verworfener Balken zaehlt wie ein fehlender. */
function kursOk(x) { return typeof x === 'number' && isFinite(x) && x > 0; }

/* Ist diese Kerze FERTIG? Eine unfertige gehoert nicht ins Archiv: sie ist eine
 * Momentaufnahme mitten in der Sitzung und wandert mit jedem Abruf weiter.
 * Gemessen am 26.08.2026 (Issue 85):
 *   archiv60m  400 von 400 Reihen endeten mit Sekunde != 0, mitten in der Reihe 0.
 *              Yahoo stempelt die laufende Kerze mit der Quote-Uhrzeit (16:57:27
 *              statt 16:30); eine Gitterkerze traegt immer Sekunde 0.
 *   archiv1d   0 von 400 am Stempel erkennbar - eine Tageskerze traegt den
 *              Sitzungsbeginn und sieht auch als Teiltag normal aus. Sie ist fertig,
 *              sobald die Sitzung zu ist.
 * Bewusst NICHT "Stempel + Intervall <= jetzt": die letzte Sitzungskerze ist kuerzer
 * als das Intervall (19:30 bis 20:00 UTC) und waere faelschlich verworfen worden. */
function fertigeKerze(tsMs, reg, jetzt) {
  if (new Date(tsMs).getUTCSeconds() !== 0) return false;
  if (IV === '1d' && reg && tsMs === reg.start * 1000) return jetzt >= reg.end * 1000;
  return true;
}

async function reiheHolen(sym) {
  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
    encodeURIComponent(yahooName(sym)) + '?range=' + CFG.range + '&interval=' + IV;
  var r = await hole(url);
  if (r.status === 429) {
    await warte(8000);
    r = await hole(url);
  }
  if (r.status !== 200) return { fehler: 'HTTP ' + r.status };
  var j;
  try { j = JSON.parse(r.body); } catch (e) { return { fehler: 'unlesbare Antwort' }; }
  var res = j.chart && j.chart.result && j.chart.result[0];
  if (!res) return { fehler: (j.chart && j.chart.error && j.chart.error.description) || 'keine Reihe' };
  var q = res.indicators && res.indicators.quote && res.indicators.quote[0];
  if (!q) return { fehler: 'keine Kursspalten' };
  var ts = res.timestamp || [], cl = q.close || [], vo = q.volume || [],
      hi = q.high || [], lo = q.low || [], op = q.open || [];
  var serie = [];
  for (var i = 0; i < ts.length; i++) {
    if (!kursOk(cl[i])) continue;
    var h = kursOk(hi[i]) ? hi[i] : cl[i];
    var l = kursOk(lo[i]) ? lo[i] : cl[i];
    if (l > h) { var w = h; h = l; l = w; }
    /* Der Eroeffnungskurs ist das Neue. Fehlt er, bleibt das Feld null - eine
     * erfundene Zahl waere schlimmer als eine fehlende. */
    var o = kursOk(op[i]) ? op[i] : null;
    serie.push([ts[i] * 1000, cl[i], vo[i] || 0, h, l, o]);
  }
  /* Was am Ende nicht fertig ist, kommt gar nicht erst ins Archiv. */
  var reg = res.meta && res.meta.currentTradingPeriod && res.meta.currentTradingPeriod.regular;
  var jetzt = Date.now();
  var abgeschnitten = 0;
  while (serie.length && !fertigeKerze(serie[serie.length - 1][0], reg, jetzt)) {
    serie.pop(); abgeschnitten++;
  }
  if (serie.length < MIN_KERZEN) return { fehler: 'nur ' + serie.length + ' Kerzen' };
  return { serie: serie, waehrung: res.meta && res.meta.currency,
           boerse: res.meta && res.meta.exchangeName, abgeschnitten: abgeschnitten };
}

function listeBauen(wahl) {
  if (wahl && wahl.indexOf(',') !== -1) return wahl.split(',').map(function (s) { return s.trim().toUpperCase(); });
  if (!wahl || wahl === 'etf') return ETFS.slice();
  var dat = fs.existsSync(MASSIVE) ? fs.readdirSync(MASSIVE).filter(function (f) { return f.indexOf('universum-') === 0; }) : [];
  if (!dat.length) { console.error('Kein Punkt-in-Zeit-Universum. Erst: node tools/universum-punkt-in-zeit.js'); process.exit(2); }
  var U = JSON.parse(fs.readFileSync(path.join(MASSIVE, dat[0]), 'utf8'));
  var w = (U.werte || []).slice().sort(function (a, b) { return b.umsatzMio - a.umsatzMio; });
  /* ETFs stehen vorn im Universum, gehoeren aber nicht in ein Aktien-Universum.
   * Sie kommen ueber die eigene Liste - dort weiss man, dass es welche sind. */
  var istEtf = {}; ETFS.forEach(function (s) { istEtf[s] = 1; });
  w = w.filter(function (x) { return !istEtf[x.sym]; });
  if (wahl === 'top500') return w.slice(0, 500).map(function (x) { return x.sym; });
  return w.map(function (x) { return x.sym; });
}

(async function () {
  var wahl = process.argv[2] || 'etf';
  var maxWerte = parseInt(process.argv[3], 10) || Infinity;

  if (!fs.existsSync(ZIEL)) fs.mkdirSync(ZIEL, { recursive: true });
  var stand = fs.existsSync(STAND) ? JSON.parse(fs.readFileSync(STAND, 'utf8')) : { fertig: {}, ohne: {} };

  var aktualisieren = process.argv.indexOf('--aktualisieren') !== -1;
  var altgereinigt = 0, neuAbgeschnitten = 0;
  var liste = aktualisieren ? Object.keys(stand.fertig) : listeBauen(wahl);
  /* Beim Aktualisieren ist nichts "schon erledigt" - es geht ja gerade darum,
   * das Vorhandene fortzuschreiben. */
  var offen = aktualisieren ? liste
    : liste.filter(function (s) { return !stand.fertig[s] && !stand.ohne[s]; });
  var nimm = offen.slice(0, maxWerte);

  console.log(IV + '-Kerzen von Yahoo (range=' + CFG.range + '), eigenes Archiv mit Eroeffnungskurs');
  console.log('  ' + (aktualisieren ? 'FORTFUEHREN: ' + liste.length + ' vorhandene Werte werden nachgezogen'
                                     : 'Auswahl "' + wahl + '": ' + liste.length + ' Werte'));
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

  /* SPERRE SETZEN. Der Lauf dauert rund 97 Minuten; solange ist das Archiv GEMISCHT -
   * ein Teil neu, ein Teil alt. Wer in dieser Zeit darauf misst, misst auf wanderndem
   * Grund, und das Ergebnis sieht dabei gesund aus. Die Sperre sagt es statt einer
   * Uhrzeit, auf die man hoffen muesste.
   * Sie wird auch bei Strg+C geloest - und traegt einen Zeitstempel, damit ein harter
   * Absturz sie nicht auf Dauer stehenlaesst (siehe archiv-wachhund.js). */
  Wachhund.sperreSetzen(ZIEL, IV + ' ' + (aktualisieren ? 'aktualisieren' : 'neu holen') + ', ' + nimm.length + ' Werte');
  var sperreWeg = false;
  function sperreRaeumen() { if (!sperreWeg) { sperreWeg = true; Wachhund.sperreLoesen(ZIEL); } }
  process.on('SIGINT', function () { sperreRaeumen(); process.exit(130); });
  process.on('SIGTERM', function () { sperreRaeumen(); process.exit(143); });

  var ok = 0, leer = 0, fehler = 0, kerzenGes = 0, ohneEroeffnung = 0;
  for (var i = 0; i < nimm.length; i++) {
    var sym = nimm[i];
    var r;
    try { r = await reiheHolen(sym); } catch (e) { r = { fehler: e.message.slice(0, 50) }; }
    if (r.fehler) {
      stand.ohne[sym] = { grund: r.fehler, am: new Date().toISOString().slice(0, 10) };
      leer++;
      console.log('  ' + String(i + 1).padStart(4) + '/' + nimm.length + '  ' + sym.padEnd(8) + r.fehler);
    } else {
      /* FORTFUEHREN: Was schon da ist, bleibt. Yahoo liefert nur die letzten 730
       * Tage - wer ueberschreibt, verliert bei jedem Lauf den aeltesten Rand. Wer
       * zusammenfuehrt, dessen Archiv waechst ueber Yahoos Grenze hinaus.
       * Bei gleichem Zeitstempel gewinnt die NEUE Kerze: sie ist nachtraeglich
       * bereinigt (Splits, Dividenden) und damit die richtigere. */
      var unterOrdner = ordnerFuer(sym);
      if (!fs.existsSync(unterOrdner)) fs.mkdirSync(unterOrdner, { recursive: true });
      var datei = path.join(unterOrdner, DATEI_PRAEFIX + sym + '.json');
      var dazu = 0;
      if (fs.existsSync(datei)) {
        try {
          var alt = JSON.parse(fs.readFileSync(datei, 'utf8')).series || [];
          /* Auch das Vorhandene reinigen. Die Vereinigung laeuft ueber den
           * Zeitstempel, und eine alte Teilkerze (16:57:27) hat einen anderen
           * Stempel als die richtige Kerze derselben Stunde (16:30) - sie wuerde
           * sonst ewig stehenbleiben, kuenftig mitten in der Reihe. Hier ist die
           * Sitzung von damals laengst zu, deshalb reicht die Stempelregel. */
          var altVor = alt.length;
          alt = alt.filter(function (k) { return new Date(k[0]).getUTCSeconds() === 0; });
          altgereinigt += altVor - alt.length;
          var karte = {};
          alt.forEach(function (k) { karte[k[0]] = k; });
          var vorher = alt.length;
          r.serie.forEach(function (k) { karte[k[0]] = k; });
          r.serie = Object.keys(karte).map(Number).sort(function (a, b) { return a - b; })
            .map(function (ms) { return karte[ms]; });
          dazu = r.serie.length - vorher;
        } catch (e) { /* unlesbar: die frische Reihe ersetzt sie */ }
      }
      neuAbgeschnitten += r.abgeschnitten || 0;
      var ohneO = r.serie.filter(function (k) { return k[5] == null; }).length;
      ohneEroeffnung += ohneO;
      fs.writeFileSync(datei, JSON.stringify({
        sym: sym, quelle: 'yahoo v8 chart, range=730d interval=60m',
        format: '[zeit, schluss, umsatz, hoch, tief, eroeffnung]',
        waehrung: r.waehrung, boerse: r.boerse, stand: new Date().toISOString(),
        series: r.serie,
      }));
      stand.fertig[sym] = { kerzen: r.serie.length, ohneEroeffnung: ohneO, am: new Date().toISOString().slice(0, 10) };
      ok++; kerzenGes += r.serie.length;
      console.log('  ' + String(i + 1).padStart(4) + '/' + nimm.length + '  ' + sym.padEnd(8) +
        String(r.serie.length).padStart(5) + ' Kerzen' + (dazu > 0 ? '  (+' + dazu + ' neu)' : '') +
        (ohneO ? '  (' + ohneO + ' ohne Eroeffnung)' : ''));
    }
    fs.writeFileSync(STAND, JSON.stringify(stand, null, 1));
    if (fehler >= 8) { console.log('\nAcht Fehler in Folge - Abbruch.'); break; }
    if (i < nimm.length - 1) await warte(ABSTAND_MS);
  }

  /* Erst die Sperre loesen, dann melden - sonst prueft standMelden() sein eigenes
   * Archiv als "wird gerade geschrieben" und sagt gar nichts ueber den Stand. */
  sperreRaeumen();
  console.log('\n' + ok + ' Reihen geholt (' + kerzenGes.toLocaleString('de-DE') + ' Kerzen), ' + leer + ' ohne Daten.');
  if (kerzenGes) console.log('Ohne Eroeffnungskurs: ' + ohneEroeffnung + ' Kerzen (' +
    (100 * ohneEroeffnung / kerzenGes).toFixed(2) + ' %).');
  var rest = offen.length - nimm.length;
  if (rest > 0) console.log('Noch offen: ' + rest + ' - einfach erneut aufrufen.');
  standMelden(aktualisieren);
})();
