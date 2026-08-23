'use strict';
/* Gemeinsame Bausteine fuer die SEC-Abrufe
 * ========================================
 * Zwei Werkzeuge lesen bei der SEC: insider-holen.js (Form 4, Eigengeschaefte von
 * Vorstand und Aufsichtsrat) und beteiligungen-holen.js (Schedule 13D, Einstieg
 * eines aktivistischen Grossaktionaers). Beide brauchen dasselbe: abrufen, CIK auf
 * Boersenkuerzel abbilden, den Tagesindex lesen, und pruefen ob ein Wert ueberhaupt
 * handelbar ist. Das steht hier einmal statt zweimal.
 *
 * Kein App-Code: der Build packt nur die Dateien im Hauptverzeichnis ein (siehe
 * package.json, "files"). Das hier sind Werkzeuge, die neben der App laufen.
 */
var https = require('https');
var zlib = require('zlib');

// Die SEC verlangt einen Absender mit Kontakt und deckelt auf 10 Abrufe je Sekunde.
var KOPF_SEC = { 'User-Agent': 'Markt-Dashboard (wilhelm.gms@gmail.com)', 'Accept-Encoding': 'gzip, deflate' };
var PAUSE = 130;   // ms zwischen Abrufen - bleibt klar unter dem Limit

function warte(ms) { return new Promise(function (w) { setTimeout(w, ms); }); }

function hole(url, kopf) {
  return new Promise(function (fertig) {
    var req = https.get(url, { headers: kopf || KOPF_SEC, timeout: 25000 }, function (res) {
      if (res.statusCode !== 200) { res.resume(); return fertig(null); }
      var teile = [];
      var strom = res;
      var enc = String(res.headers['content-encoding'] || '').toLowerCase();
      if (enc === 'gzip') strom = res.pipe(zlib.createGunzip());
      else if (enc === 'deflate') strom = res.pipe(zlib.createInflate());
      strom.on('data', function (c) { teile.push(c); });
      strom.on('end', function () { fertig(Buffer.concat(teile).toString('utf8')); });
      strom.on('error', function () { fertig(null); });
    });
    req.on('timeout', function () { req.destroy(); fertig(null); });
    req.on('error', function () { fertig(null); });
  });
}

/* Im XML stehen Sonderzeichen als Entitaet ("Chairman &amp; CEO"). Wer das stehen
 * laesst, bekommt in der Karte "&amp;amp;" zu sehen - die Anzeige escaped ja noch
 * einmal. Also einmal sauber aufloesen. */
function entities(s) {
  return String(s || '')
    .replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, function (_, n) { return String.fromCharCode(parseInt(n, 10)); })
    .replace(/&amp;/g, '&');
}

/* --- CIK auf Boersenkuerzel abbilden -------------------------------------- */
async function tickerKarte() {
  var txt = await hole('https://www.sec.gov/files/company_tickers.json');
  if (!txt) throw new Error('Ticker-Liste der SEC nicht abrufbar');
  var roh = JSON.parse(txt);
  var karte = {};
  Object.keys(roh).forEach(function (k) {
    var e = roh[k];
    if (e && e.cik_str && e.ticker) karte[String(e.cik_str)] = String(e.ticker).toUpperCase();
  });
  return karte;
}

/* --- Tagesindex ------------------------------------------------------------ */
function indexUrl(d) {
  var j = d.getUTCFullYear(), m = d.getUTCMonth() + 1, t = d.getUTCDate();
  var q = 'QTR' + (Math.floor(d.getUTCMonth() / 3) + 1);
  var zz = function (n) { return (n < 10 ? '0' : '') + n; };
  return 'https://www.sec.gov/Archives/edgar/daily-index/' + j + '/' + q + '/form.' + j + zz(m) + zz(t) + '.idx';
}

/* Eine Indexzeile zerlegen. NICHT ueber feste Spaltenbreiten: die Kopfzeile der
 * Datei behauptet, der Formtyp sei 12 Zeichen breit, tatsaechlich beginnt der
 * Firmenname bei "SCHEDULE 13D" erst in Spalte 18. Verlaesslich ist nur das Ende
 * der Zeile - CIK, Datum und Pfad haben ein festes Format. Alles davor ist
 * "Formtyp, zwei oder mehr Leerzeichen, Firmenname". */
function zeileLesen(zeile) {
  var m = zeile.match(/^(.+?)\s{2,}(\d{1,10})\s+(\d{8})\s+(edgar\/\S+?)\s*$/);
  if (!m) return null;
  var kopf = m[1];
  var trenn = kopf.search(/\s{2,}/);
  if (trenn < 0) return null;
  return {
    typ: kopf.slice(0, trenn).trim(),
    firma: kopf.slice(trenn).trim(),
    cik: String(parseInt(m[2], 10)),
    datum: m[3],
    weg: m[4]
  };
}

/* Alle Einreichungen eines Formtyps der letzten Tage. `typ` wird exakt verglichen,
 * damit Aenderungsmeldungen ("SCHEDULE 13D/A") nicht als Originale durchgehen. */
async function tagesFilings(karte, tage, typ) {
  var treffer = {};
  var heute = new Date();
  for (var i = 0; i < tage; i++) {
    var d = new Date(heute.getTime() - i * 86400000);
    var wt = d.getUTCDay();
    if (wt === 0 || wt === 6) continue;                 // Wochenende: kein Index
    var txt = await hole(indexUrl(d));
    await warte(PAUSE);
    if (!txt) continue;                                  // Feiertag oder noch nicht da
    var zeilen = txt.split('\n');
    for (var z = 10; z < zeilen.length; z++) {
      if (zeilen[z].indexOf(typ) !== 0) continue;        // billiger Vorfilter
      var e = zeileLesen(zeilen[z]);
      if (!e || e.typ !== typ) continue;
      var sym = karte[e.cik];
      if (!sym) continue;                                 // kein Kuerzel = Meldeperson, nicht der Emittent
      var acc = (e.weg.match(/(\d{10}-\d{2}-\d{6})\.txt$/) || [])[1];
      if (!acc) continue;
      treffer[acc] = { cik: e.cik, sym: sym, firma: e.firma, datum: e.datum, weg: e.weg };
    }
  }
  return treffer;
}

/* --- Ist der Wert ueberhaupt handelbar? ------------------------------------
 * Marktkapitalisierung waere die uebliche Antwort, aber gefragt ist Liquiditaet:
 * ob man da mit vertretbarem Spread rein und raus kommt. Das ist der taegliche
 * Dollar-Umsatz, und den liefert derselbe Yahoo-Endpunkt, den die App ohnehin
 * benutzt. Kein zusaetzlicher Dienst, kein Schluessel. */
var KOPF_YAHOO = { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' };
async function tagesumsatz(sym) {
  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
    encodeURIComponent(sym) + '?range=1mo&interval=1d';
  var txt = await hole(url, KOPF_YAHOO);
  await warte(PAUSE);
  if (!txt) return null;
  try {
    var res = JSON.parse(txt).chart.result[0];
    var q = res.indicators.quote[0];
    var c = q.close, v = q.volume, n = 0, summe = 0;
    for (var i = 0; i < c.length; i++) {
      if (c[i] && v[i]) { summe += c[i] * v[i]; n++; }
    }
    if (n < 5) return null;                              // zu wenig Historie fuer ein Urteil
    return { umsatz: summe / n, kurs: res.meta && res.meta.regularMarketPrice, tage: n };
  } catch (e) { return null; }
}

module.exports = {
  KOPF_SEC: KOPF_SEC, PAUSE: PAUSE,
  warte: warte, hole: hole, entities: entities,
  tickerKarte: tickerKarte, indexUrl: indexUrl, zeileLesen: zeileLesen,
  tagesFilings: tagesFilings, tagesumsatz: tagesumsatz
};
