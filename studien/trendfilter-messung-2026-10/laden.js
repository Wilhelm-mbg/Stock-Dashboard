'use strict';
/* Trendfilter-Messung (REGEL.md §2): Tageskurse der sechs ETFs von der oeffentlichen Yahoo-Chart-Schnittstelle.
 *
 *   node studien/trendfilter-messung-2026-10/laden.js [--daten <ordner>] [--pruefen]
 *
 * Ohne --pruefen: je Kuerzel EIN Abruf (query1, bei Fehler query2), die Rohantwort wird unveraendert als <ordner>/<KUERZEL>.json
 * abgelegt (Vorgabe: daten/ neben diesem Skript, steht in .gitignore - Rohkurse sind Daten Dritter und gehoeren nicht ins
 * oeffentliche Repo). Danach schreibt das Skript pruefsummen.json: SHA-256 der Rohantwort und eines kanonischen Auszugs bis
 * 15.09.2026 (Tag, Eroeffnung, Hoch, Tief, Schluss, Umsatz, Ausschuettungen, Splits - ohne adjclose, das Yahoo bei jeder neuen
 * Ausschuettung umrechnet).
 * Mit --pruefen: nichts wird geladen; die vorhandenen Dateien werden gegen pruefsummen.json gehalten (Rueckgabewert 1 bei Abweichung).
 *
 * lies(rohText) ist der gemeinsame Leser fuer kern.js und datenpruefung.js. Der zweite Rechner benutzt ihn bewusst NICHT. */
var fs = require('fs');
var path = require('path');
var https = require('https');
var crypto = require('crypto');

var KUERZEL = ['SPY', 'BIL', 'SHY', 'ACWX', 'EFA', 'AGG'];
var ENDE = '2026-09-15';
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
var PRUEFSUMMEN = path.join(__dirname, 'pruefsummen.json');

var NY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
/** Kalenderdatum eines Unix-Zeitstempels (Sekunden) in New York, 'JJJJ-MM-TT'. */
function nyTag(sek) { return NY.format(new Date(sek * 1000)); }
var NYZEIT = new Intl.DateTimeFormat('en-GB', { timeZone: 'America/New_York', hour: '2-digit', minute: '2-digit', hour12: false });
/** Uhrzeit eines Zeitstempels in New York, 'HH:MM' (nur fuer die Datenpruefung). */
function nyZeit(sek) { return NYZEIT.format(new Date(sek * 1000)); }

function sha256(text) { return crypto.createHash('sha256').update(text).digest('hex'); }

function zahl(x) { return (typeof x === 'number' && isFinite(x)) ? x : null; }

/** Liest eine Rohantwort. Liefert { sym, meta, zeilen: [{ ts, tag, o, h, l, c, v, adj }], div: [{ ts, tag, betrag }],
 *  splits: [{ ts, tag, zaehler, nenner }] } - alles nach Zeitstempel sortiert, nichts gefiltert, nichts geglaettet. */
function lies(rohText) {
  var j = JSON.parse(rohText);
  if (!j.chart || j.chart.error || !j.chart.result || !j.chart.result[0]) {
    throw new Error('Antwort ohne Ergebnis: ' + JSON.stringify(j.chart && j.chart.error));
  }
  var r = j.chart.result[0];
  var ts = r.timestamp || [];
  var q = (r.indicators && r.indicators.quote && r.indicators.quote[0]) || {};
  var adj = (r.indicators && r.indicators.adjclose && r.indicators.adjclose[0] && r.indicators.adjclose[0].adjclose) || [];
  var zeilen = [];
  for (var i = 0; i < ts.length; i++) {
    zeilen.push({ ts: ts[i], tag: nyTag(ts[i]), o: zahl(q.open && q.open[i]), h: zahl(q.high && q.high[i]), l: zahl(q.low && q.low[i]),
      c: zahl(q.close && q.close[i]), v: zahl(q.volume && q.volume[i]), adj: zahl(adj[i]) });
  }
  zeilen.sort(function (a, b) { return a.ts - b.ts; });
  var ev = r.events || {};
  var div = Object.keys(ev.dividends || {}).map(function (k) {
    var d = ev.dividends[k];
    return { ts: d.date, tag: nyTag(d.date), betrag: d.amount };
  }).sort(function (a, b) { return a.ts - b.ts; });
  var splits = Object.keys(ev.splits || {}).map(function (k) {
    var s = ev.splits[k];
    return { ts: s.date, tag: nyTag(s.date), zaehler: s.numerator, nenner: s.denominator };
  }).sort(function (a, b) { return a.ts - b.ts; });
  return { sym: r.meta && r.meta.symbol, meta: r.meta || {}, zeilen: zeilen, div: div, splits: splits };
}

/** Kanonischer Auszug bis ENDE (einschliesslich): stabil gegen spaetere Abrufe, solange Yahoo die Vergangenheit nicht aendert. */
function kanonisch(l) {
  return JSON.stringify({
    sym: l.sym,
    zeilen: l.zeilen.filter(function (z) { return z.tag <= ENDE; }).map(function (z) { return [z.tag, z.o, z.h, z.l, z.c, z.v]; }),
    div: l.div.filter(function (d) { return d.tag <= ENDE; }).map(function (d) { return [d.tag, d.betrag]; }),
    splits: l.splits.filter(function (s) { return s.tag <= ENDE; }).map(function (s) { return [s.tag, s.zaehler, s.nenner]; })
  });
}

function beschreibe(sym, roh) {
  var l = lies(roh);
  var bis = l.zeilen.filter(function (z) { return z.tag <= ENDE; });
  var mitSchluss = bis.filter(function (z) { return z.c != null; });
  return {
    sym: sym,
    symbolInAntwort: l.sym,
    shaRoh: sha256(roh),
    bytesRoh: Buffer.byteLength(roh),
    shaKanonisch: sha256(kanonisch(l)),
    zeilenGesamt: l.zeilen.length,
    zeilenBisEnde: bis.length,
    zeilenMitSchlussBisEnde: mitSchluss.length,
    ersterTag: mitSchluss.length ? mitSchluss[0].tag : null,
    letzterTagBisEnde: mitSchluss.length ? mitSchluss[mitSchluss.length - 1].tag : null,
    letzterTagGesamt: l.zeilen.length ? l.zeilen[l.zeilen.length - 1].tag : null,
    ausschuettungenBisEnde: l.div.filter(function (d) { return d.tag <= ENDE; }).length,
    splitsBisEnde: l.splits.filter(function (s) { return s.tag <= ENDE; }).map(function (s) { return s.tag + ' ' + s.zaehler + ':' + s.nenner; })
  };
}

function holen(url) {
  return new Promise(function (resolve) {
    var req = https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json,*/*' }, timeout: 30000 }, function (res) {
      var d = '';
      res.setEncoding('utf8');
      res.on('data', function (c) { d += c; });
      res.on('end', function () { resolve({ status: res.statusCode || 0, body: d }); });
    });
    req.on('timeout', function () { req.destroy(); resolve({ status: 0, body: 'Zeitueberschreitung' }); });
    req.on('error', function (e) { resolve({ status: 0, body: String(e.message || e) }); });
  });
}
function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function abrufen(sym, jetzt) {
  var pfad = '/v8/finance/chart/' + encodeURIComponent(sym) + '?period1=0&period2=' + jetzt + '&interval=1d&events=div%2Csplits&includeAdjustedClose=true';
  var versuche = [];
  var hosts = ['query1', 'query2'];
  for (var i = 0; i < hosts.length; i++) {
    var url = 'https://' + hosts[i] + '.finance.yahoo.com' + pfad;
    var res = await holen(url);
    if (res.status === 429) { await warte(5000); res = await holen(url); }
    var fehler = null;
    if (res.status !== 200) fehler = 'HTTP ' + res.status;
    else {
      try { lies(res.body); } catch (e) { fehler = String(e.message || e); }
    }
    versuche.push({ url: url, status: res.status, fehler: fehler });
    if (!fehler) return { roh: res.body, url: url, versuche: versuche };
  }
  throw new Error(sym + ': kein brauchbarer Abruf ' + JSON.stringify(versuche));
}

function argWert(name, vorgabe) {
  var i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : vorgabe;
}

async function hauptLaden(ordner) {
  fs.mkdirSync(ordner, { recursive: true });
  var jetzt = Math.floor(Date.now() / 1000);
  var aus = { kennung: 'trendfilter-messung-2026-10/v1', abgerufenUtc: new Date(jetzt * 1000).toISOString(), ende: ENDE, reihen: {} };
  for (var i = 0; i < KUERZEL.length; i++) {
    var sym = KUERZEL[i];
    var a = await abrufen(sym, jetzt);
    fs.writeFileSync(path.join(ordner, sym + '.json'), a.roh);
    var b = beschreibe(sym, a.roh);
    b.url = a.url;
    b.versuche = a.versuche;
    aus.reihen[sym] = b;
    console.log(sym + ': ' + b.zeilenMitSchlussBisEnde + ' Tage ' + b.ersterTag + ' .. ' + b.letzterTagBisEnde + ', ' + b.ausschuettungenBisEnde + ' Ausschuettungen, Splits ' + JSON.stringify(b.splitsBisEnde));
    await warte(800);
  }
  fs.writeFileSync(PRUEFSUMMEN, JSON.stringify(aus, null, 2) + '\n');
  console.log('pruefsummen.json geschrieben');
}

function hauptPruefen(ordner) {
  var soll = JSON.parse(fs.readFileSync(PRUEFSUMMEN, 'utf8'));
  var fehler = 0;
  KUERZEL.forEach(function (sym) {
    var roh = fs.readFileSync(path.join(ordner, sym + '.json'), 'utf8');
    var b = beschreibe(sym, roh);
    var s = soll.reihen[sym];
    var gleichRoh = b.shaRoh === s.shaRoh, gleichKan = b.shaKanonisch === s.shaKanonisch;
    if (!gleichRoh || !gleichKan) fehler++;
    console.log(sym + ': Rohantwort ' + (gleichRoh ? 'gleich' : 'ANDERS') + ', kanonischer Auszug ' + (gleichKan ? 'gleich' : 'ANDERS'));
  });
  process.exitCode = fehler ? 1 : 0;
}

if (require.main === module) {
  var ordner = path.resolve(argWert('--daten', path.join(__dirname, 'daten')));
  if (process.argv.indexOf('--pruefen') >= 0) hauptPruefen(ordner);
  else hauptLaden(ordner).catch(function (e) { console.error(e); process.exitCode = 1; });
}

module.exports = { lies: lies, kanonisch: kanonisch, beschreibe: beschreibe, nyTag: nyTag, nyZeit: nyZeit, sha256: sha256, KUERZEL: KUERZEL, ENDE: ENDE };
