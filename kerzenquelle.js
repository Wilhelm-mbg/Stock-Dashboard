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
  '1d':  { range: '40y',  ordner: 'archiv1d',  etwa: 10076, fensterTage: null, dauerMs: null },
  '60m': { range: '730d', ordner: 'archiv60m', etwa: 5087,  fensterTage: 730,  dauerMs: 3600000 },
  '15m': { range: '60d',  ordner: 'archiv15m', etwa: 1551,  fensterTage: 60,   dauerMs: 900000 },
  '5m':  { range: '60d',  ordner: 'archiv5m',  etwa: 4651,  fensterTage: 60,   dauerMs: 300000 },
  '1m':  { range: '7d',   ordner: 'archiv1m',  etwa: 2577,  fensterTage: 7,    dauerMs: 60000 },
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

/* LEBT DER SCHREIBER NOCH? Die Frist oben ist eine Uhr, und eine Uhr weiss nichts.
 * Am 26.08.2026 um 20:00 lagen drei Sperren (1d, 15m, 1m) von Laeufen, die laengst
 * tot waren - kein einziger node-Prozess lief mehr. Der Waechter haette bis 23:26
 * "wird gerade geschrieben" gesagt und kein Urteil abgegeben. Das ist dieselbe
 * Stille wie die, gegen die die Sperre gebaut wurde, nur mit umgekehrtem Vorzeichen.
 * signal 0 stellt keine Frage an den Prozess, es prueft nur, ob es ihn gibt.
 *   ESRCH  -> es gibt ihn nicht: die Sperre ist verwaist, egal wie jung sie ist
 *   EPERM  -> es gibt ihn, er gehoert nur jemand anderem: er lebt
 * ZWEI FAELLE, IN DENEN DIE PID NICHT GEFRAGT WIRD, und beide sind wichtiger als
 * die Bequemlichkeit: eine Sperre ohne pid (alte Fassung) und eine von einem
 * ANDEREN Rechner - ein Archiv kann auf einer Freigabe liegen, und dort ist eine
 * fremde Prozessnummer eine beliebige Zahl. Dann entscheidet weiter die Frist.
 * Die Frist bleibt ohnehin: eine wiederverwendete Prozessnummer koennte eine tote
 * Sperre lebendig aussehen lassen, und die Frist raeumt auch das weg. */
function prozessLebt(pid) {
  if (typeof pid !== 'number' || !isFinite(pid) || pid <= 0) return null;
  try { process.kill(pid, 0); return true; }
  catch (e) { return e && e.code === 'EPERM'; }
}
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
  /* Die Prozessnummer schlaegt die Uhr - aber nur, wenn sie ueberhaupt etwas ueber
   * diesen Rechner aussagt. Sonst bleibt es bei der Frist. */
  var vonHier = !j.rechner || j.rechner === os.hostname();
  var lebt = vonHier ? prozessLebt(j.pid) : null;
  if (lebt === false) {
    return { aktiv: false, verwaist: true, alterStunden: alter, start: j.start,
      was: j.was || null, grundVerwaist: 'Prozess ' + j.pid + ' laeuft nicht mehr' };
  }
  return { aktiv: alter < VERWAIST_STUNDEN, verwaist: alter >= VERWAIST_STUNDEN,
    alterStunden: alter, start: j.start, was: j.was || null,
    grundVerwaist: alter >= VERWAIST_STUNDEN ? 'aelter als ' + VERWAIST_STUNDEN + ' Stunden' : null };
}
function sperreSetzen(ordner, was) {
  try {
    fs.mkdirSync(ordner, { recursive: true });
    /* rechner dazu: ohne ihn wuerde eine Sperre von einer Netzfreigabe an der
     * hiesigen Prozesstabelle gemessen, wo ihre Nummer nichts bedeutet. */
    fs.writeFileSync(sperrePfad(ordner), JSON.stringify(
      { start: new Date().toISOString(), was: was || null, pid: process.pid,
        rechner: os.hostname() }, null, 1));
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
 *
 * ZWEITE SCHICHT, gemessen am 26.08.2026 um 18:51 UTC: die Quote-Kerze abzuschneiden
 * genuegt nicht. Darunter liegt der GERADE LAUFENDE Eimer, und der traegt einen
 * glatten Gitterstempel - die Sekundenregel sieht ihn nicht. XOM 15m endete nach
 * dem Abschneiden auf 18:45, also mitten im Eimer 18:45-19:00; zwei Abrufe drei
 * Minuten auseinander gaben fuer dieselbe Kerze verschiedene Werte (Umsatz 136.744
 * gegen 169.080). Betroffen war jedes Intraday-Intervall, 60m eingeschlossen.
 * Deshalb wird gefragt, wann der Eimer ZU ist: Stempel plus Dauer, gedeckelt auf
 * den Handelsschluss. Die Deckelung ist der Grund, warum eine reine
 * "Stempel + Dauer"-Regel falsch waere: die letzte Sitzungskerze ist kuerzer als
 * das Intervall (19:30 bis 20:00 UTC) und waere jeden Abend verworfen worden.
 * Das Intervall kommt als Parameter, weil diese Datei zwei Aufrufer hat - eine
 * modulweite Variable waere die erste Stelle, an der die beiden auseinanderlaufen. */
function fertigeKerze(tsMs, reg, jetzt, intervall) {
  if (new Date(tsMs).getUTCSeconds() !== 0) return false;
  if (intervall === '1d') {
    return reg && tsMs === reg.start * 1000 ? jetzt >= reg.end * 1000 : true;
  }
  var cfg = INTERVALLE[intervall];
  if (!cfg || !cfg.dauerMs) return true;
  /* Wann ist dieser Eimer zu? Normalerweise nach seiner Dauer - aber nie spaeter
   * als zum Handelsschluss. Genau daran haengt die kurze letzte Sitzungskerze:
   * 19:30 bis 20:00 UTC ist eine halbe Stunde im Stundengitter. Eine reine
   * "Stempel + Dauer"-Regel haette sie bis 20:30 fuer unfertig gehalten und
   * jeden Abend verworfen. Fuer Kerzen frueherer Tage aendert die Deckelung
   * nichts: deren Eimer ist laengst zu, bevor der heutige Schluss ueberhaupt
   * eine Rolle spielt. */
  var zu = tsMs + cfg.dauerMs;
  if (reg && reg.end) zu = Math.min(zu, reg.end * 1000);
  return jetzt >= zu;
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

/* ================= WELCHE WERTE, UND WOHIN ================= */

/* Die grossen Index- und Sektor-ETFs. SPY steht bewusst vorn: Das Regime-Tor im
 * Live-Handel prueft SPY gegen seine Stunden-EMA200, und weil SPY im App-Archiv
 * fehlte, musste die Kapitulations-Messung es ueber eine Tagesreihe naehern. */
var ETFS = ('SPY QQQ IWM DIA VOO IVV RSP TLT HYG LQD GLD SLV USO ' +
  'XLF XLK XLE XLV XLI XLP XLY XLU XLB XLRE XLC SMH SOXX EEM EFA FXI GDX VXX').split(' ');
var ETF_SATZ = {};
ETFS.forEach(function (s) { ETF_SATZ[s] = 1; });
function istEtfSym(s) { return !!ETF_SATZ[s]; }

/* ETFs kommen in einen eigenen Unterordner. Die Messmaschine waehlt "aktien" ueber
 * sym.indexOf('-USD') === -1 - das ist ein Filter gegen Krypto, nicht gegen
 * Indexfonds. Laegen SPY und QQQ zwischen den Aktien, wuerde eine Aktienstrategie
 * sie mitmessen; bei SPY waere es schlimmer, denn es ist zugleich der Anker des
 * Regime-Tors - Messobjekt und Massstab in einem. */
function ordnerFuer(sym, ziel) { return istEtfSym(sym) ? path.join(ziel, 'etf') : ziel; }
function dateiPraefix(intervall) { return 'bars_' + intervall + '_'; }
function dateiFuer(sym, intervall, ziel) {
  return path.join(ordnerFuer(sym, ziel), dateiPraefix(intervall) + sym + '.json');
}

function heuteTag() { return new Date().toISOString().slice(0, 10); }
function standPfad(ziel) { return path.join(ziel, 'stand.json'); }
function standLesen(ziel) {
  try { return JSON.parse(fs.readFileSync(standPfad(ziel), 'utf8')); }
  catch (e) { return { fertig: {}, ohne: {} }; }
}
function standSchreiben(ziel, stand) {
  try { fs.writeFileSync(standPfad(ziel), JSON.stringify(stand, null, 1)); return true; }
  catch (e) { return false; }
}

/* Das Punkt-in-Zeit-Universum, nach Umsatz sortiert. Gibt es keines, ist die
 * Antwort null und nicht eine leere Liste - eine leere Liste sieht aus wie
 * "nichts zu tun". */
function universumWerte() {
  var mv = path.join(DATEN, 'massive');
  var dat = [];
  try {
    dat = fs.readdirSync(mv).filter(function (f) { return f.indexOf('universum-') === 0; });
  } catch (e) { return null; }
  if (!dat.length) return null;
  try {
    var U = JSON.parse(fs.readFileSync(path.join(mv, dat[0]), 'utf8'));
    var w = (U.werte || []).slice().sort(function (a, b) { return b.umsatzMio - a.umsatzMio; });
    /* ETFs stehen vorn im Universum, gehoeren aber nicht in ein Aktien-Universum.
     * Sie kommen ueber die eigene Liste - dort weiss man, dass es welche sind. */
    return w.filter(function (x) { return !ETF_SATZ[x.sym]; });
  } catch (e) { return null; }
}

/* wahl: 'etf' | 'topN' | 'alle' | 'SYM,SYM,...'
 * Gibt { symbole, quelle, grund } zurueck, nie nur eine Liste: eine leere Liste
 * ohne Grund waere genau die Stille, gegen die hier ueberall gebaut wird. */
function listeBauen(wahl) {
  wahl = wahl || 'etf';
  if (wahl.indexOf(',') !== -1) {
    return {
      symbole: wahl.split(',').map(function (s) { return s.trim().toUpperCase(); }).filter(Boolean),
      quelle: 'eigene Liste',
    };
  }
  if (wahl === 'etf') return { symbole: ETFS.slice(), quelle: 'ETF-Liste' };
  var w = universumWerte();
  if (!w) {
    return {
      symbole: [], quelle: null,
      grund: 'Kein Punkt-in-Zeit-Universum im Datenordner (massive/universum-*.json).',
    };
  }
  var m = /^top(\d+)$/.exec(wahl);
  if (m) {
    var n = parseInt(m[1], 10);
    return {
      symbole: w.slice(0, n).map(function (x) { return x.sym; }),
      quelle: 'die ' + Math.min(n, w.length) + ' umsatzstaerksten von ' + w.length,
    };
  }
  if (wahl === 'alle') {
    return { symbole: w.map(function (x) { return x.sym; }), quelle: 'ganzes Universum (' + w.length + ')' };
  }
  return { symbole: [wahl.toUpperCase()], quelle: 'ein Wert' };
}

/* ================= WAS DAS ARCHIV GERADE HERGIBT ================= */

/* Der Zeitstempel der juengsten Kerze einer Datei. Die Rechnung darauf - Rueckstand
 * in Handelstagen, Nachzuegler - steht in tools/archiv-wachhund.js; hier steht nur
 * das Ablesen, weil die App den Waechter nicht laden kann (tools/ wird nicht
 * ausgeliefert) und zwei Arten, eine Reihe zu lesen, wieder zwei Wahrheiten waeren. */
function juengsteKerzeVon(datei) {
  try {
    var j = JSON.parse(fs.readFileSync(datei, 'utf8'));
    var s = j.series || j.bars || [];
    if (!s.length) return null;
    return s[s.length - 1][0];
  } catch (e) { return null; }
}

function archivDateien(ziel) {
  var aus = [];
  ['', 'etf'].forEach(function (unter) {
    var o = unter ? path.join(ziel, unter) : ziel;
    var f = [];
    try { f = fs.readdirSync(o); } catch (e) { return; }
    f.forEach(function (n) { if (/^bars_.*\.json$/.test(n)) aus.push(path.join(o, n)); });
  });
  return aus;
}

/* Ein Ueberblick ueber ein Archiv, guenstig genug fuer eine Anzeige.
 * DIE STICHPROBENGROESSE STEHT IM ERGEBNIS, sie wird nicht verschwiegen: "juengste
 * Kerze von heute" heisst etwas anderes, wenn dafuer 120 von 2.900 Reihen angesehen
 * wurden. Genau diese Verwechslung hat das Stundenarchiv zwei Tage stillstehen
 * lassen, ohne dass es auffiel. */
function archivUeberblick(ziel, opt) {
  opt = opt || {};
  var stichprobe = opt.stichprobe != null ? opt.stichprobe : 120;
  var erg = {
    ordner: ziel, dateien: 0, angesehen: 0, juengsteMs: null, juengsterTag: null,
    zuletztGesammelt: null, imStand: 0, ohneDaten: 0, sperre: null, grund: null,
  };
  var dateien = archivDateien(ziel);
  erg.dateien = dateien.length;
  if (!dateien.length) erg.grund = 'Noch nichts gesammelt';
  /* Gleichmaessig ueber den Bestand greifen, nicht die ersten N: die ersten sind
   * alphabetisch sortiert und damit kein Querschnitt. */
  var schritt = Math.max(1, Math.ceil(dateien.length / stichprobe));
  for (var i = 0; i < dateien.length; i += schritt) {
    var t = juengsteKerzeVon(dateien[i]);
    erg.angesehen++;
    if (t != null && (erg.juengsteMs == null || t > erg.juengsteMs)) erg.juengsteMs = t;
  }
  if (erg.juengsteMs != null) erg.juengsterTag = new Date(erg.juengsteMs).toISOString().slice(0, 10);
  var stand = standLesen(ziel);
  erg.imStand = Object.keys(stand.fertig || {}).length;
  erg.ohneDaten = Object.keys(stand.ohne || {}).length;
  Object.keys(stand.fertig || {}).forEach(function (s) {
    var am = stand.fertig[s].am;
    if (am && (!erg.zuletztGesammelt || am > erg.zuletztGesammelt)) erg.zuletztGesammelt = am;
  });
  var sp = sperreLesen(ziel);
  if (sp.aktiv) erg.sperre = { aktiv: true, seit: sp.start, was: sp.was };
  else if (sp.verwaist) erg.sperre = { aktiv: false, verwaist: true, seit: sp.start, warum: sp.grundVerwaist };
  return erg;
}

/* WAS UNWIEDERBRINGLICH WEG IST. Yahoo fuehrt je Intervall ein rollendes Fenster -
 * 1m sieben Tage, 5m und 15m sechzig. Was darin nicht geholt wurde, ist nicht
 * "spaeter nachzuholen", sondern fort. Die App laeuft nicht durch; war sie acht Tage
 * aus, fehlt eine Woche Minutenkerzen fuer immer. Das muss sie sagen und nicht
 * stillschweigend weitermachen. */
function fensterLuecke(intervall, juengsteMs, jetzt) {
  var cfg = INTERVALLE[intervall] || {};
  jetzt = jetzt || Date.now();
  if (!cfg.fensterTage) return { fensterTage: null, verloren: false, luecke: 0 };
  if (juengsteMs == null) return { fensterTage: cfg.fensterTage, verloren: false, luecke: 0, unbekannt: true };
  var tage = (jetzt - juengsteMs) / 86400000;
  var luecke = tage - cfg.fensterTage;
  return {
    fensterTage: cfg.fensterTage, tageAus: tage,
    verloren: luecke > 0, luecke: luecke > 0 ? luecke : 0,
  };
}

/* ================= SAMMELN ================= */

/* Der Lauf, den bis zum 26.08.2026 nur tools/yahoo-60m-holen.js hatte. Er steht
 * hier, weil die App dasselbe tut und ihn sonst nachbauen muesste - und ein Nachbau
 * waere die zweite Vorstellung davon, wie eine Reihe fortgeschrieben wird.
 *
 * SCHONEND UND NICHT BLOCKIEREND: zwischen zwei Werten wird gewartet, nicht
 * gerechnet. Nach JEDEM Wert steht der Fortschritt auf der Platte; ein Abbruch
 * kostet nichts.
 *
 * opt.melde bekommt nach jedem Wert eine Zeile, opt.weiter wird davor gefragt - so
 * kann ein Aufrufer anhalten, ohne dass hier ein Signal-Handler noetig waere. */
async function sammle(opt) {
  opt = opt || {};
  var intervall = opt.intervall;
  var cfg = INTERVALLE[intervall];
  if (!cfg) throw new Error('unbekanntes Intervall: ' + intervall);
  var ziel = opt.ziel || ordnerVon(intervall);
  var symbole = (opt.symbole || []).slice();
  var abstand = opt.abstandMs != null ? opt.abstandMs : ABSTAND_MS;
  var melde = typeof opt.melde === 'function' ? opt.melde : function () {};
  var weiter = typeof opt.weiter === 'function' ? opt.weiter : function () { return true; };
  var mindest = opt.mindestKerzen != null ? opt.mindestKerzen
    : Math.max(50, Math.round(cfg.etwa * 0.04));
  /* Acht Fehlschlaege HINTEREINANDER heissen nicht "acht kaputte Werte", sondern
   * "das Netz ist weg" oder "wir sind gesperrt". Im Abrufwerkzeug stand diese
   * Bremse auch - aber ihr Zaehler wurde nie hochgezaehlt, sie konnte nie
   * ausloesen. Unbeaufsichtigt in der App waere das teuer. */
  var bremse = opt.abbruchNachFehlern != null ? opt.abbruchNachFehlern : 8;

  fs.mkdirSync(ziel, { recursive: true });
  var stand = standLesen(ziel);
  var praefix = dateiPraefix(intervall);

  sperreSetzen(ziel, opt.was || (intervall + ', ' + symbole.length + ' Werte'));
  var erg = {
    intervall: intervall, ordner: ziel, geplant: symbole.length,
    verarbeitet: 0, ok: 0, leer: 0, kerzen: 0, dazu: 0, ohneEroeffnung: 0,
    abgeschnitten: 0, gereinigt: 0, abgebrochen: false, grund: null,
    begonnen: new Date().toISOString(), beendet: null,
  };
  try {
    /* Die Startmeldung steht INNERHALB des try. Sie stand einen Nachmittag lang
     * davor, und damit haette ein Aufrufer, dessen melde() wirft, die Sperre fuer
     * immer stehen lassen - genau der Fall, gegen den das finally unten steht. */
    melde({ art: 'start', intervall: intervall, geplant: symbole.length, ordner: ziel });
    var inFolge = 0;
    for (var i = 0; i < symbole.length; i++) {
      if (!weiter()) { erg.abgebrochen = true; erg.grund = 'angehalten'; break; }
      var sym = symbole[i];
      var r;
      try {
        r = await reiheHolen(sym, intervall, { mindestKerzen: mindest, jetzt: opt.jetzt });
      } catch (e) { r = { fehler: String((e && e.message) || e).slice(0, 60) }; }
      erg.verarbeitet++;
      if (r.fehler) {
        stand.ohne[sym] = { grund: r.fehler, am: heuteTag() };
        erg.leer++; inFolge++;
        melde({ art: 'wert', nr: i + 1, von: symbole.length, sym: sym, fehler: r.fehler });
      } else {
        inFolge = 0;
        var unter = ordnerFuer(sym, ziel);
        fs.mkdirSync(unter, { recursive: true });
        var datei = path.join(unter, praefix + sym + '.json');
        var dazu = 0;
        if (fs.existsSync(datei)) {
          try {
            var alt = JSON.parse(fs.readFileSync(datei, 'utf8')).series || [];
            var v = zusammenfuehren(alt, r.serie);
            r.serie = v.serie; dazu = v.dazu; erg.gereinigt += v.gereinigt;
          } catch (e2) { /* unlesbar: die frische Reihe ersetzt sie */ }
        }
        erg.abgeschnitten += r.abgeschnitten || 0;
        var ohneO = 0;
        r.serie.forEach(function (k) { if (k[5] == null) ohneO++; });
        erg.ohneEroeffnung += ohneO;
        fs.writeFileSync(datei, JSON.stringify(
          satz(sym, intervall, r.serie, { waehrung: r.waehrung, boerse: r.boerse })));
        stand.fertig[sym] = { kerzen: r.serie.length, ohneEroeffnung: ohneO, am: heuteTag() };
        erg.ok++; erg.kerzen += r.serie.length; erg.dazu += dazu;
        melde({
          art: 'wert', nr: i + 1, von: symbole.length, sym: sym,
          kerzen: r.serie.length, dazu: dazu, ohneEroeffnung: ohneO,
        });
      }
      standSchreiben(ziel, stand);
      if (bremse && inFolge >= bremse) {
        erg.abgebrochen = true;
        erg.grund = bremse + ' Fehlschlaege hintereinander - das ist keine Reihe kaputter Werte';
        break;
      }
      if (i < symbole.length - 1) await warte(abstand);
    }
  } finally {
    /* Die Sperre geht auch dann weg, wenn hier etwas fliegt. Sonst haelt ein
     * einziger Ausrutscher das Archiv stundenlang fuer "wird geschrieben". */
    sperreLoesen(ziel);
    erg.beendet = new Date().toISOString();
  }
  melde({ art: 'ende', ergebnis: erg });
  return erg;
}

module.exports = {
  INTERVALLE: INTERVALLE, ABSTAND_MS: ABSTAND_MS,
  yahooName: yahooName, warte: warte, kursOk: kursOk, hole: hole,
  fertigeKerze: fertigeKerze, reiheHolen: reiheHolen,
  zusammenfuehren: zusammenfuehren, satz: satz,
  DATEN: DATEN, ordnerVon: ordnerVon,
  VERWAIST_STUNDEN: VERWAIST_STUNDEN, sperrePfad: sperrePfad, prozessLebt: prozessLebt,
  ETFS: ETFS, istEtfSym: istEtfSym, ordnerFuer: ordnerFuer,
  dateiPraefix: dateiPraefix, dateiFuer: dateiFuer,
  standPfad: standPfad, standLesen: standLesen, standSchreiben: standSchreiben,
  universumWerte: universumWerte, listeBauen: listeBauen,
  juengsteKerzeVon: juengsteKerzeVon, archivDateien: archivDateien,
  archivUeberblick: archivUeberblick, fensterLuecke: fensterLuecke, sammle: sammle,
  sperreLesen: sperreLesen, sperreSetzen: sperreSetzen, sperreLoesen: sperreLoesen,
};
