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
 * Ablageort: MD_ARCHIV60M, sonst <Datenordner>/archiv60m-pfad.txt, sonst
 * <Datenordner>/archiv60m.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');

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
var ZIEL = archivOrdner();
var STAND = path.join(ZIEL, 'stand.json');
var MASSIVE = path.join(DATEN, 'massive');
var ABSTAND_MS = 1200;

/* Die grossen Index- und Sektor-ETFs. SPY steht bewusst vorn: Das Regime-Tor im
 * Live-Handel prueft SPY gegen seine Stunden-EMA200, und weil SPY im App-Archiv
 * fehlt, musste die Kapitulations-Messung es ueber eine Tagesreihe naehern. */
var ETFS = ('SPY QQQ IWM DIA VOO IVV RSP TLT HYG LQD GLD SLV USO ' +
  'XLF XLK XLE XLV XLI XLP XLY XLU XLB XLRE XLC SMH SOXX EEM EFA FXI GDX VXX').split(' ');

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

async function reiheHolen(sym) {
  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
    encodeURIComponent(yahooName(sym)) + '?range=730d&interval=60m';
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
  if (serie.length < 200) return { fehler: 'nur ' + serie.length + ' Kerzen' };
  return { serie: serie, waehrung: res.meta && res.meta.currency, boerse: res.meta && res.meta.exchangeName };
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
  var liste = aktualisieren ? Object.keys(stand.fertig) : listeBauen(wahl);
  /* Beim Aktualisieren ist nichts "schon erledigt" - es geht ja gerade darum,
   * das Vorhandene fortzuschreiben. */
  var offen = aktualisieren ? liste
    : liste.filter(function (s) { return !stand.fertig[s] && !stand.ohne[s]; });
  var nimm = offen.slice(0, maxWerte);

  console.log('60m-Kerzen von Yahoo, eigenes Archiv (mit Eroeffnungskurs)');
  console.log('  ' + (aktualisieren ? 'FORTFUEHREN: ' + liste.length + ' vorhandene Werte werden nachgezogen'
                                     : 'Auswahl "' + wahl + '": ' + liste.length + ' Werte'));
  console.log('  schon geholt: ' + Object.keys(stand.fertig).length + ' | ohne Daten: ' + Object.keys(stand.ohne).length);
  console.log('  dieser Lauf: ' + nimm.length + ', geschaetzt ' + Math.ceil(nimm.length * ABSTAND_MS / 60000) + ' Minuten');
  console.log('  Ablage: ' + ZIEL);
  console.log('  Abbruch mit Strg+C ist gefahrlos.\n');
  if (!nimm.length) { console.log('Nichts zu tun.'); return; }

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
      var datei = path.join(ZIEL, 'bars_60m_' + sym + '.json');
      var dazu = 0;
      if (fs.existsSync(datei)) {
        try {
          var alt = JSON.parse(fs.readFileSync(datei, 'utf8')).series || [];
          var karte = {};
          alt.forEach(function (k) { karte[k[0]] = k; });
          var vorher = alt.length;
          r.serie.forEach(function (k) { karte[k[0]] = k; });
          r.serie = Object.keys(karte).map(Number).sort(function (a, b) { return a - b; })
            .map(function (ms) { return karte[ms]; });
          dazu = r.serie.length - vorher;
        } catch (e) { /* unlesbar: die frische Reihe ersetzt sie */ }
      }
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

  console.log('\n' + ok + ' Reihen geholt (' + kerzenGes.toLocaleString('de-DE') + ' Kerzen), ' + leer + ' ohne Daten.');
  if (kerzenGes) console.log('Ohne Eroeffnungskurs: ' + ohneEroeffnung + ' Kerzen (' +
    (100 * ohneEroeffnung / kerzenGes).toFixed(2) + ' %).');
  var rest = offen.length - nimm.length;
  if (rest > 0) console.log('Noch offen: ' + rest + ' - einfach erneut aufrufen.');
})();
