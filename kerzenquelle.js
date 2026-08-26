'use strict';
/* ================= KERZEN VON YAHOO - DIE EINE QUELLE =================
 *
 * WOZU DIESE DATEI. Ab dem 26.08.2026 schreiben ZWEI Stellen in dieselben Archive:
 * das Handwerkzeug `tools/yahoo-60m-holen.js` und die App selbst (Intraday-Sammler in
 * main.js). Zwei Schreiber mit zwei Vorstellungen davon, was eine Kerze ist, waeren
 * genau der Fehler, der hier schon einmal 66 Reihen unbrauchbar gemacht hat: CFD- und
 * Yahoo-Daten in derselben Reihe, Umsatz um Faktor 500 daneben.
 * Deshalb steht die Definition EINMAL hier, und beide holen sie sich. Nicht nachbauen.
 *
 * SIE LIEGT IN DER WURZEL, nicht unter tools/ - aus einem schlichten Grund: `tools/`
 * wird nicht mit ausgeliefert (package.json, build.files), Wurzeldateien schon. Ein
 * Modul, das die App braucht, muss im Paket sein.
 *
 * WAS EINE KERZE IST: [zeit, schluss, umsatz, hoch, tief, eroeffnung]
 * Die ersten fuenf sind das alte Format der App - jede vorhandene Auswertung liest
 * weiter richtig. Der Eroeffnungskurs ist das sechste Feld; fehlt er, steht dort null
 * und keine erfundene Zahl.
 */
var https = require('https');
var Kurse = require('./kurse.js');
var fs = require('fs');
var path = require('path');
var os = require('os');

/* Was Yahoo je Intervall hergibt - am 24.08.2026 an AAPL gemessen, nicht geraten.
 * INTRADAY IST EIN ROLLENDES FENSTER: was hier nicht geholt wird, ist danach FUER
 * IMMER weg. Bei Tageskursen kann man Jahre spaeter nachladen, bei Minutenkerzen
 * nicht. Das ist der ganze Grund, warum die App selbst sammelt. */
var INTERVALLE = {
  '1d':  { range: '40y',  ordner: 'archiv1d',  etwa: 10076, fensterTage: null },
  '60m': { range: '730d', ordner: 'archiv60m', etwa: 5087,  fensterTage: 730 },
  '15m': { range: '60d',  ordner: 'archiv15m', etwa: 1551,  fensterTage: 60 },
  '5m':  { range: '60d',  ordner: 'archiv5m',  etwa: 4651,  fensterTage: 60 },
  '1m':  { range: '7d',   ordner: 'archiv1m',  etwa: 2577,  fensterTage: 7 },
};

/* SCHONEND: Yahoo bekommt hoechstens alle 1,2 Sekunden eine Anfrage. Die Zahl steht
 * hier und nicht bei den Aufrufern, damit nicht der eine hoeflich ist und der andere
 * nicht - gedrosselt wird die QUELLE, nicht der Aufrufer. */
var ABSTAND_MS = 1200;

/* ---------- WO LIEGT DAS ARCHIV ----------
 * Drei Stufen, in dieser Reihenfolge: Umgebungsvariable, Zeigerdatei im Datenordner,
 * Unterordner des Datenordners. Diese Kette stand bisher in tools/archiv-wachhund.js -
 * die App kann sie von dort nicht holen, weil tools/ nicht mit ausgeliefert wird.
 * Zwei Ketten waeren zwei Orte, an denen dasselbe Archiv liegen kann. */
var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
/* Ein eigener Zeiger, wenn es einen gibt - sonst NEBEN dem 60m-Ordner.
 * Die zweite Haelfte ist die wichtige und war am 26.08.2026 fast ein Fehler: das
 * Abrufwerkzeug leitet seit je alle Intervalle vom 60m-Zeiger ab ("die anderen liegen
 * daneben"), waehrend archiv-wachhund.js je Intervall einen eigenen Zeiger suchte.
 * Fuer 60m und 1d gibt es welche, also fiel es nie auf. Fuer 1m/5m/15m gibt es keine -
 * das Werkzeug schrieb nach E:, ein zweiter Leser haette auf C: gesucht und ein leeres
 * Archiv gefunden. Zwei Antworten auf "wo liegt archiv1m" waeren genau der Fehler, den
 * dieses Modul verhindern soll.
 * Ein ausdruecklicher Zeiger gewinnt weiter - wer einen setzt, meint ihn auch. */
function zeigerFuer(name) {
  var env = 'MD_ARCHIV' + name.replace(/^archiv/, '').toUpperCase();
  if (process.env[env]) return process.env[env];
  try {
    var p = fs.readFileSync(path.join(DATEN, name + '-pfad.txt'), 'utf8').replace(/^\uFEFF/, '').trim();
    if (p) return p;
  } catch (e) { /* keine Zeigerdatei */ }
  return null;
}
function ordnerVon(intervallOderName) {
  var cfg = INTERVALLE[intervallOderName];
  var name = cfg ? cfg.ordner : intervallOderName;
  var eigen = zeigerFuer(name);
  if (eigen) return eigen;
  var basis = zeigerFuer('archiv60m') || path.join(DATEN, 'archiv60m');
  if (name === 'archiv60m') return basis;
  return path.join(path.dirname(basis), name);
}

/* ---------- SPERRE: hier wird gerade geschrieben ----------
 * Waehrend ein Lauf schreibt, ist das Archiv nicht kaputt, sondern GEMISCHT - ein
 * Teil neu, ein Teil alt -, und das sieht von aussen gesund aus. Wer darauf misst,
 * misst auf wanderndem Grund.
 * SIE MUSS EINEN ABSTURZ UEBERLEBEN KOENNEN: stirbt der Schreiber hart, bliebe sie
 * liegen und der Waechter sagte fuer immer "wird gerade geschrieben". Deshalb der
 * Zeitstempel und die Verwaisungsfrist. Am 26.08.2026 beim Erproben gemessen: ein mit
 * timeout abgebrochener Lauf fuehrt seinen Signal-Handler NICHT aus. Die Frist ist
 * also nicht der Notnagel, sondern die eigentliche Sicherung. */
var VERWAIST_STUNDEN = 6;
function sperrePfad(ordner) { return path.join(ordner, '_laeuft.json'); }
function sperreLesen(ordner, jetzt) {
  jetzt = jetzt || new Date();
  var p = sperrePfad(ordner);
  if (!fs.existsSync(p)) return { aktiv: false, verwaist: false };
  var j = null;
  try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { j = null; }
  var start = j && j.start ? Date.parse(j.start) : NaN;
  /* Unlesbar oder ohne Zeitstempel: als verwaist behandeln, nicht als aktiv. Eine
   * kaputte Datei darf die Messung nicht auf Dauer blockieren. */
  if (!isFinite(start)) return { aktiv: false, verwaist: true, alterStunden: null, roh: j };
  var alter = (jetzt.getTime() - start) / 3600000;
  return { aktiv: alter < VERWAIST_STUNDEN, verwaist: alter >= VERWAIST_STUNDEN,
    alterStunden: alter, start: j.start, was: j.was || null };
}
function sperreSetzen(ordner, was) {
  try {
    fs.mkdirSync(ordner, { recursive: true });
    fs.writeFileSync(sperrePfad(ordner), JSON.stringify(
      { start: new Date().toISOString(), was: was || null, pid: process.pid }, null, 1));
    return true;
  } catch (e) { return false; }   // ohne Sperre laeuft der Abruf trotzdem
}
function sperreLoesen(ordner) {
  try { if (fs.existsSync(sperrePfad(ordner))) fs.unlinkSync(sperrePfad(ordner)); return true; }
  catch (e) { return false; }
}

function yahooName(sym) { return sym.replace(/\./g, '-'); }
function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

/* Dieselbe Kurspruefung wie in der App: '== null' allein reicht nicht, eine 0 oder
 * ein NaN kaeme durch. Ein verworfener Balken zaehlt wie ein fehlender. */
function kursOk(x) { return typeof x === 'number' && isFinite(x) && x > 0; }

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
 * als das Intervall (19:30 bis 20:00 UTC) und waere faelschlich verworfen worden.
 * Das Intervall kommt als Parameter, weil diese Datei zwei Aufrufer hat - eine
 * modulweite Variable waere die erste Stelle, an der die beiden auseinanderlaufen. */
function fertigeKerze(tsMs, reg, jetzt, intervall) {
  if (new Date(tsMs).getUTCSeconds() !== 0) return false;
  if (intervall === '1d' && reg && tsMs === reg.start * 1000) return jetzt >= reg.end * 1000;
  return true;
}

/** Eine Reihe holen und in das Archivformat bringen.
 *  Gibt { serie, waehrung, boerse, abgeschnitten } oder { fehler } zurueck. */
async function reiheHolen(sym, intervall, opt) {
  opt = opt || {};
  var cfg = INTERVALLE[intervall];
  if (!cfg) return { fehler: 'unbekanntes Intervall ' + intervall };
  var mindest = opt.mindestKerzen != null ? opt.mindestKerzen : Math.max(50, Math.round(cfg.etwa * 0.04));
  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
    encodeURIComponent(yahooName(sym)) + '?range=' + cfg.range + '&interval=' + intervall;
  var r;
  try { r = await hole(url); } catch (e) { return { fehler: String(e && e.message || e) }; }
  if (r.status === 429) {
    /* Ratenbegrenzung: warten und EINMAL wiederholen. Wer sofort weiterhaemmert,
     * bekommt die naechste Sperre und lernt nichts. */
    await warte(opt.pauseBeiDrosselung || 8000);
    try { r = await hole(url); } catch (e2) { return { fehler: String(e2 && e2.message || e2) }; }
  }
  if (r.status !== 200) return { fehler: 'HTTP ' + r.status };
  /* ZERLEGT WIRD IN kurse.js. Das ist keine Bequemlichkeit: am 24.08.2026 standen
   * neun handgeschriebene Zerlegungen derselben Antwort in sechs Dateien, und sie
   * waren sich in nichts einig - beim Verwerfen kaputter Kurse, beim vertauschten
   * Hoch/Tief, beim Wiederholen nach 429. Genau eine Zerlegung zu haben ist der
   * Grund, warum es kurse.js gibt; eine zehnte hier waere der Rueckschritt.
   * bereinigt: false, weil das Archiv den GEHANDELTEN Kurs fuehrt - was ueber Jahre
   * rechnet, bereinigt spaeter selbst. offenRoh: true, siehe dort. */
  var z = Kurse.zerlege(r.body, { bereinigt: false, offenRoh: true });
  if (!z) return { fehler: 'keine Reihe' };
  var serie = z.bars;
  var res = { meta: z.meta };
  var reg = res.meta && res.meta.currentTradingPeriod && res.meta.currentTradingPeriod.regular;
  var jetzt = opt.jetzt || Date.now();
  var abgeschnitten = 0;
  while (serie.length && !fertigeKerze(serie[serie.length - 1][0], reg, jetzt, intervall)) {
    serie.pop(); abgeschnitten++;
  }
  if (serie.length < mindest) return { fehler: 'nur ' + serie.length + ' Kerzen' };
  return { serie: serie, waehrung: res.meta && res.meta.currency,
           boerse: res.meta && res.meta.exchangeName, abgeschnitten: abgeschnitten };
}

/** Alte und neue Reihe vereinigen.
 *  Was schon da ist, bleibt: Yahoo liefert nur ein Fenster, wer ueberschreibt verliert
 *  bei jedem Lauf den aeltesten Rand. Bei gleichem Zeitstempel gewinnt die NEUE Kerze -
 *  sie ist nachtraeglich bereinigt (Splits, Dividenden) und damit die richtigere.
 *  Das Vorhandene wird MITGEREINIGT: eine alte Teilkerze (16:57:27) hat einen anderen
 *  Stempel als die richtige Kerze derselben Stunde (16:30) und bliebe sonst ewig
 *  stehen, kuenftig mitten in der Reihe. */
function zusammenfuehren(alt, neu) {
  alt = Array.isArray(alt) ? alt : [];
  var vorGereinigt = alt.length;
  alt = alt.filter(function (k) { return new Date(k[0]).getUTCSeconds() === 0; });
  var gereinigt = vorGereinigt - alt.length;
  var karte = {};
  alt.forEach(function (k) { karte[k[0]] = k; });
  var vorher = alt.length;
  (neu || []).forEach(function (k) { karte[k[0]] = k; });
  var serie = Object.keys(karte).map(Number).sort(function (a, b) { return a - b; })
    .map(function (ms) { return karte[ms]; });
  return { serie: serie, dazu: serie.length - vorher, gereinigt: gereinigt };
}

/** Der Datensatz, wie er auf die Platte geht.
 *  quelle nennt den WIRKLICH abgefragten Bereich. Bis zum 26.08.2026 stand dort fest
 *  'range=730d interval=60m' - auch in jeder Datei des Tagesarchivs, das 40 Jahre
 *  Tageskerzen enthaelt. Das einzige Feld, das die Herkunft dokumentiert, log damit
 *  fuer jedes Archiv ausser 60m. */
function satz(sym, intervall, serie, meta) {
  var cfg = INTERVALLE[intervall] || {};
  meta = meta || {};
  return {
    sym: sym,
    quelle: 'yahoo v8 chart, range=' + cfg.range + ' interval=' + intervall,
    format: '[zeit, schluss, umsatz, hoch, tief, eroeffnung]',
    waehrung: meta.waehrung, boerse: meta.boerse,
    stand: new Date().toISOString(),
    series: serie,
  };
}

module.exports = {
  INTERVALLE: INTERVALLE, ABSTAND_MS: ABSTAND_MS,
  yahooName: yahooName, warte: warte, kursOk: kursOk, hole: hole,
  fertigeKerze: fertigeKerze, reiheHolen: reiheHolen,
  zusammenfuehren: zusammenfuehren, satz: satz,
  DATEN: DATEN, ordnerVon: ordnerVon,
  VERWAIST_STUNDEN: VERWAIST_STUNDEN, sperrePfad: sperrePfad,
  sperreLesen: sperreLesen, sperreSetzen: sperreSetzen, sperreLoesen: sperreLoesen,
};
