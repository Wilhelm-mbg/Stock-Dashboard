'use strict';
/* Messung Sektor-Momentum (ZUSATZ.md §1): laedt die Tageskurse der elf SPDR-Sektor-Fonds und von SPY ueber die oeffentliche
 * Yahoo-Chart-Schnittstelle und speichert die Antworten UNVERAENDERT ausserhalb des Repos (Daten Dritter).
 * Ins Repo kommt nur pruefsummen.json (SHA-256, Groesse, Zeilen, erster/letzter Tag, Ausschuettungen, Splits, Adresse).
 *   node studien/sektor-momentum-messung-2026-10/laden.js            (Ablage: $SEKTOR_DATEN, Vorgabe unten)
 * Gibt keine Kurse aus. Keine Abhaengigkeiten ausser Node. */
var fs = require('fs');
var path = require('path');
var https = require('https');
var crypto = require('crypto');

var KENNUNG = 'sektor-momentum-messung-2026-10/v1';
var KUERZEL = ['XLB', 'XLC', 'XLE', 'XLF', 'XLI', 'XLK', 'XLP', 'XLRE', 'XLU', 'XLV', 'XLY', 'SPY'];
var PERIOD1 = 912470400;            /* 01.12.1998 00:00 UTC */
var PERIOD2 = 1789516800;           /* 16.09.2026 00:00 UTC -> letzter Balken 15.09.2026 */
var LETZTER_TAG = '2026-09-15';
var HOSTS = ['query1.finance.yahoo.com', 'query2.finance.yahoo.com'];
var VERSUCHE = 3;
var ORDNER = process.env.SEKTOR_DATEN || 'C:/Users/Wilhe/Downloads/sektor-messung/daten';
var UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

if (Date.UTC(1998, 11, 1) / 1000 !== PERIOD1 || Date.UTC(2026, 8, 16) / 1000 !== PERIOD2) throw new Error('KLINKE: period1/period2 falsch');

var nyTag = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
function tagNY(sek) { return nyTag.format(new Date(sek * 1000)); }

function adresse(host, sym) {
  return 'https://' + host + '/v8/finance/chart/' + sym + '?interval=1d&events=div,splits&period1=' + PERIOD1 + '&period2=' + PERIOD2;
}

function holen(url) {
  return new Promise(function (ok) {
    var req = https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json' } }, function (res) {
      var teile = [];
      res.on('data', function (c) { teile.push(c); });
      res.on('end', function () { ok({ status: res.statusCode, body: Buffer.concat(teile) }); });
    });
    req.on('error', function (e) { ok({ status: 0, body: Buffer.alloc(0), fehler: String(e && e.message) }); });
    req.setTimeout(60000, function () { req.destroy(new Error('Zeitueberschreitung')); });
  });
}

/** Abnahme einer Antwort (ZUSATZ §1.4). Liefert { ok, grund, info }. */
function pruefen(sym, status, body) {
  if (status !== 200) return { ok: false, grund: 'HTTP ' + status };
  var j;
  try { j = JSON.parse(body.toString('utf8')); } catch (e) { return { ok: false, grund: 'kein JSON' }; }
  var c = j && j.chart;
  if (!c) return { ok: false, grund: 'kein Feld chart' };
  if (c.error) return { ok: false, grund: 'chart.error ' + JSON.stringify(c.error).slice(0, 200) };
  var r = c.result && c.result[0];
  if (!r) return { ok: false, grund: 'kein result' };
  if (!r.meta || r.meta.symbol !== sym) return { ok: false, grund: 'meta.symbol ' + (r.meta && r.meta.symbol) };
  var ts = r.timestamp || [];
  if (!ts.length) return { ok: false, grund: 'timestamp leer (Antwort 200 ohne Daten)' };
  var q = r.indicators && r.indicators.quote && r.indicators.quote[0];
  var adj = r.indicators && r.indicators.adjclose && r.indicators.adjclose[0] && r.indicators.adjclose[0].adjclose;
  if (!q) return { ok: false, grund: 'kein quote' };
  if (!adj) return { ok: false, grund: 'kein adjclose' };
  var felder = ['open', 'close', 'volume'];
  for (var i = 0; i < felder.length; i++) if (!q[felder[i]] || q[felder[i]].length !== ts.length) return { ok: false, grund: 'Feld ' + felder[i] + ' fehlt oder Laenge falsch' };
  if (adj.length !== ts.length) return { ok: false, grund: 'adjclose Laenge falsch' };
  var erster = tagNY(ts[0]), letzter = tagNY(ts[ts.length - 1]);
  if (letzter !== LETZTER_TAG) return { ok: false, grund: 'letzter Tag ' + letzter + ' statt ' + LETZTER_TAG };
  var ev = r.events || {};
  return { ok: true, info: { zeilen: ts.length, ersterTag: erster, letzterTag: letzter,
    ausschuettungen: Object.keys(ev.dividends || {}).length, splits: Object.keys(ev.splits || {}).length,
    waehrung: r.meta.currency || null, boerse: r.meta.exchangeName || null, zeitzone: r.meta.exchangeTimezoneName || null } };
}

function warte(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

async function main() {
  fs.mkdirSync(ORDNER, { recursive: true });
  var aus = { kennung: KENNUNG, geladen: new Date().toISOString(), period1: PERIOD1, period2: PERIOD2, letzterTag: LETZTER_TAG,
    ablage: 'ausserhalb des Repos (SEKTOR_DATEN), Dateien <KUERZEL>.json unveraendert', dateien: {}, verworfen: [] };
  for (var s = 0; s < KUERZEL.length; s++) {
    var sym = KUERZEL[s], fertig = false;
    for (var v = 0; v < VERSUCHE && !fertig; v++) {
      var host = HOSTS[v % HOSTS.length], url = adresse(host, sym);
      var r = await holen(url);
      var p = pruefen(sym, r.status, r.body);
      if (!p.ok) {
        aus.verworfen.push({ sym: sym, versuch: v + 1, host: host, grund: p.grund || r.fehler || 'unbekannt' });
        console.log(sym + ': Versuch ' + (v + 1) + ' verworfen (' + (p.grund || r.fehler) + ')');
        await warte(3000);
        continue;
      }
      var datei = path.join(ORDNER, sym + '.json');
      fs.writeFileSync(datei, r.body);
      var zurueck = fs.readFileSync(datei);
      var sha = crypto.createHash('sha256').update(zurueck).digest('hex');
      if (crypto.createHash('sha256').update(r.body).digest('hex') !== sha) throw new Error('KLINKE: Datei ' + sym + ' nicht unveraendert geschrieben');
      aus.dateien[sym] = { url: url, versuch: v + 1, httpStatus: r.status, sha256: sha, bytes: zurueck.length, zeilen: p.info.zeilen,
        ersterTag: p.info.ersterTag, letzterTag: p.info.letzterTag, ausschuettungen: p.info.ausschuettungen, splits: p.info.splits,
        waehrung: p.info.waehrung, boerse: p.info.boerse, zeitzone: p.info.zeitzone };
      console.log(sym + ': ' + p.info.zeilen + ' Zeilen ' + p.info.ersterTag + ' bis ' + p.info.letzterTag + ', Ausschuettungen ' + p.info.ausschuettungen +
        ', Splits ' + p.info.splits + ', sha256 ' + sha.slice(0, 16));
      fertig = true;
    }
    if (!fertig) throw new Error('Laden fehlgeschlagen fuer ' + sym + ' nach ' + VERSUCHE + ' Versuchen - kein Lauf (ZUSATZ §1.4)');
    await warte(1000);
  }
  fs.writeFileSync(path.join(__dirname, 'pruefsummen.json'), JSON.stringify(aus, null, 1) + '\n');
  console.log('pruefsummen.json geschrieben, ' + Object.keys(aus.dateien).length + ' Dateien, verworfen ' + aus.verworfen.length);
}

module.exports = { KUERZEL: KUERZEL, PERIOD1: PERIOD1, PERIOD2: PERIOD2, LETZTER_TAG: LETZTER_TAG, ORDNER: ORDNER, tagNY: tagNY, pruefen: pruefen, adresse: adresse };

if (require.main === module) main().catch(function (e) { console.error(e && e.stack || e); process.exit(1); });
