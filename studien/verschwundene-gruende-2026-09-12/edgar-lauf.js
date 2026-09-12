'use strict';
/* Schritt 2: EDGAR-Durchgang. Fortsetzbar, alles gecacht, nichts doppelt.
 *
 * WIE DAS KUERZEL ZUR CIK WIRD - und warum nicht ueber die Ticker-Tabelle:
 * `company_tickers.json` fuehrt nur LEBENDE Registranten. Genau unsere Reihen stehen
 * dort nicht mehr - und schlimmer: ihr Kuerzel steht dort oft schon bei einem ANDEREN
 * Unternehmen (Probe 12.09.: AAC -> "Ares Acquisition Corp III", waehrend unsere Reihe
 * AAC am 07.11.2023 bar uebernommen wurde). Eine Zuordnung ueber die Tabelle waere
 * still falsch. Die Volltextsuche mit ZEITFENSTER um den letzten Balken loest das:
 * ihre `aggregations.entity_filter.buckets` zaehlen, in wessen Einreichungen das
 * Kuerzel in diesem Fenster vorkommt - der Emittent steht oben, mit Abstand.
 * Probe: AAIC 2022-11..2024-05 -> Arlington Asset 83 Treffer vor Ellington 19;
 * ACCD -> Accolade 105; AAGR -> African Agriculture 20. Die Tabelle dient nur noch
 * als Bestaetigung, nie als Quelle.
 *
 * Gecacht wird nicht die ganze Antwort (Gigabytes), sondern der Auszug, den die
 * Einstufung braucht: Name, fruehere Namen, und die Einreichungen der Formulare
 * unten mit Datum, Akzession und 8-K-Items.
 *
 * Rate: harte Obergrenze 8 Anfragen je Sekunde (Auftrag), hier 6/s gefahren.
 * Aufruf:  node edgar-lauf.js [--max N]
 */
var fs = require('fs');
var path = require('path');
var https = require('https');

var UA = 'Markt-Dashboard Studie (wilhelm.gms@gmail.com)';
var RATE_MAX = 8;                 // Auftrag: hoechstens 8/s
var RATE = 6;                     // gefahren
var CACHE = path.join(__dirname, 'edgar');
var TICK = path.join(CACHE, 'kuerzel');
var SUB = path.join(CACHE, 'cik');
var FORMULARE = /^(25|25-NSE|15|15-12B|15-12G|15-15D|8-K|8-K\/A|DEFM14A|DEFA14A|PREM14A|S-4|SC 13E3|SC 14D9|POS AM|25\/A)$/;
var VOR_TAGE = 550;               // Fensteranfang vor dem letzten Balken
var NACH_TAGE = 300;              // Fensterende danach

[CACHE, TICK, SUB].forEach(function (d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });

/* ---------- Takt ---------- */
var fenster = [];
function warte() {
  return new Promise(function (ok) {
    (function versuch() {
      var t = Date.now();
      fenster = fenster.filter(function (x) { return t - x < 1000; });
      if (fenster.length < RATE) { fenster.push(t); return ok(); }
      setTimeout(versuch, Math.ceil(1000 / RATE_MAX));
    })();
  });
}

var ANFRAGEN = 0, FEHLER = 0;
function hole(url) {
  return warte().then(function () {
    return new Promise(function (ok, nein) {
      ANFRAGEN++;
      var req = https.get(url, { headers: { 'User-Agent': UA, 'Accept-Encoding': 'gzip, deflate', 'Accept': 'application/json' } }, function (res) {
        if (res.statusCode === 301 || res.statusCode === 302) { res.resume(); return hole(res.headers.location).then(ok, nein); }
        var strom = res, enc = res.headers['content-encoding'];
        if (enc === 'gzip') strom = res.pipe(require('zlib').createGunzip());
        else if (enc === 'deflate') strom = res.pipe(require('zlib').createInflate());
        var teile = [];
        strom.on('data', function (d) { teile.push(d); });
        strom.on('end', function () { ok({ code: res.statusCode, text: Buffer.concat(teile).toString('utf8') }); });
        strom.on('error', nein);
      });
      req.setTimeout(60000, function () { req.destroy(new Error('Zeit')); });
      req.on('error', nein);
    });
  });
}
function holeJson(url, versuche) {
  versuche = versuche === undefined ? 3 : versuche;
  return hole(url).then(function (r) {
    if (r.code === 404) return { fehlt: true };
    if (r.code !== 200) throw new Error('HTTP ' + r.code);
    return JSON.parse(r.text);
  }).catch(function (e) {
    FEHLER++;
    if (versuche <= 1) return { fehler: String(e.message || e) };
    return new Promise(function (ok) { setTimeout(ok, 2000 * (4 - versuche)); }).then(function () { return holeJson(url, versuche - 1); });
  });
}

/* ---------- Ticker-Tabelle: nur Bestaetigung ---------- */
function tickerKarte() {
  var p = path.join(CACHE, '_company_tickers.json');
  var lade = fs.existsSync(p) ? Promise.resolve(JSON.parse(fs.readFileSync(p, 'utf8')))
    : holeJson('https://www.sec.gov/files/company_tickers.json').then(function (j) { fs.writeFileSync(p, JSON.stringify(j)); return j; });
  return lade.then(function (j) {
    var k = {};
    Object.keys(j).forEach(function (i) { var e = j[i]; if (e && e.ticker) k[String(e.ticker).toUpperCase()] = { cik: String(e.cik_str).padStart(10, '0'), name: e.title }; });
    return k;
  });
}

function tagPlus(iso, tage) { return new Date(Date.parse(iso + 'T00:00:00Z') + tage * 86400000).toISOString().slice(0, 10); }

/* ---------- Volltextsuche mit Zeitfenster -> Emittent ---------- */
function ftsKuerzel(sym, letzterBalken) {
  var datei = path.join(TICK, sym.replace(/[^A-Z0-9.~_-]/gi, '_') + '.json');
  if (fs.existsSync(datei)) { try { return Promise.resolve(JSON.parse(fs.readFileSync(datei, 'utf8'))); } catch (e) { /* neu holen */ } }
  var von = tagPlus(letzterBalken, -VOR_TAGE), bis = tagPlus(letzterBalken, NACH_TAGE);
  var url = 'https://efts.sec.gov/LATEST/search-index?q=%22' + encodeURIComponent(sym) + '%22'
    + '&dateRange=custom&startdt=' + von + '&enddt=' + bis;
  return holeJson(url).then(function (j) {
    /* Eine gescheiterte Anfrage darf NICHT als "nichts gefunden" in den Cache. Sonst
     * friert ein Netzfehler die Reihe dauerhaft auf "unbekannt" ein und der Wiederanlauf,
     * der genau dagegen gebaut ist, ueberspringt sie. Also: hochwerfen statt speichern. */
    if (j.fehler || j.fehlt || !j.aggregations) throw new Error('FTS ohne Aggregation: ' + (j.fehler || j.fehlt || 'Form'));
    var b = ((j.aggregations || {}).entity_filter || {}).buckets || [];
    var eimer = b.map(function (x) {
      var m = /^(.*?)(?:\s*\(([A-Z0-9.,\- ]*)\))?\s*\(CIK (\d{10})\)\s*$/.exec(x.key) || [];
      return { name: (m[1] || x.key).trim(), tickers: (m[2] || '').split(/,\s*/).filter(Boolean), cik: m[3] || null, n: x.doc_count };
    }).filter(function (x) { return x.cik; });
    var aus = { sym: sym, von: von, bis: bis, treffer: (j.hits && j.hits.total && j.hits.total.value) || 0, eimer: eimer.slice(0, 8), geholt: new Date().toISOString() };
    fs.writeFileSync(datei, JSON.stringify(aus));
    return aus;
  });
}

/* Wahl aus den Eimern: das Kuerzel im Namen schlaegt alles; sonst der oberste,
 * wenn er mindestens 3 Treffer hat UND doppelt so viele wie der zweite. */
function waehle(f, sym) {
  var e = f.eimer || [];
  if (!e.length) return { cik: null, weg: 'fts-leer' };
  var mitTicker = e.filter(function (x) { return x.tickers.indexOf(sym) !== -1 || x.tickers.indexOf(sym.replace(/\./g, '-')) !== -1; });
  if (mitTicker.length) return { cik: mitTicker[0].cik, name: mitTicker[0].name, weg: 'fts-ticker', sicherheit: 'stark', n: mitTicker[0].n };
  var o = e[0], zwei = e[1] ? e[1].n : 0;
  if (o.n >= 3 && o.n >= 2 * zwei) return { cik: o.cik, name: o.name, weg: 'fts-mehrheit', sicherheit: 'mittel', n: o.n, zweiter: zwei };
  if (o.n >= 2) return { cik: o.cik, name: o.name, weg: 'fts-knapp', sicherheit: 'schwach', n: o.n, zweiter: zwei };
  return { cik: null, weg: 'fts-unklar', n: o.n };
}

/* ---------- Einreichungen je CIK, auf das Noetige eingedampft ---------- */
function einreichungen(cik) {
  var p = path.join(SUB, cik + '.json');
  if (fs.existsSync(p)) { try { return Promise.resolve(JSON.parse(fs.readFileSync(p, 'utf8'))); } catch (e) { /* neu */ } }
  return holeJson('https://data.sec.gov/submissions/CIK' + cik + '.json').then(function (j) {
    if (j.fehlt || j.fehler) { var l = { cik: cik, fehlt: true, grund: j.fehler || '404' }; fs.writeFileSync(p, JSON.stringify(l)); return l; }
    var r = (j.filings && j.filings.recent) || {}, n = (r.form || []).length, e = [];
    for (var i = 0; i < n; i++) {
      if (!FORMULARE.test(r.form[i])) continue;
      e.push({ f: r.form[i], d: r.filingDate[i], a: r.accessionNumber[i], it: r.items[i] || '' });
    }
    var aus = { cik: cik, name: j.name, tickers: j.tickers || [], exchanges: j.exchanges || [], sic: j.sic || null,
      sicText: j.sicDescription || null, frueher: (j.formerNames || []).map(function (x) { return x.name; }),
      letzteEinreichung: n ? r.filingDate[0] : null, n: n, einreichungen: e, geholt: new Date().toISOString() };
    fs.writeFileSync(p, JSON.stringify(aus));
    return aus;
  });
}

/* ---------- Lauf ---------- */
function main() {
  var arg = process.argv.slice(2);
  var maxN = arg.indexOf('--max') >= 0 ? Number(arg[arg.indexOf('--max') + 1]) : Infinity;
  var reihen = JSON.parse(fs.readFileSync(path.join(__dirname, 'verschwundene.json'), 'utf8')).reihen;
  if (maxN < reihen.length) reihen = reihen.slice(0, maxN);
  var t0 = Date.now(), zuord = {}, statPfad = path.join(__dirname, 'edgar-zuordnung.json');
  if (fs.existsSync(statPfad)) { try { zuord = JSON.parse(fs.readFileSync(statPfad, 'utf8')).zuordnung || {}; } catch (e) { zuord = {}; } }

  tickerKarte().then(function (karte) {
    var i = 0, fertig = 0;
    function sichern(schluss) {
      fs.writeFileSync(statPfad, JSON.stringify({ stand: new Date().toISOString(), anfragen: ANFRAGEN, fehler: FEHLER,
        fertig: !!schluss, sekunden: Math.round((Date.now() - t0) / 1000), rate: RATE, rateMax: RATE_MAX, zuordnung: zuord }));
    }
    function naechste() {
      if (i >= reihen.length) return Promise.resolve();
      var R = reihen[i++];
      var sym = R.basis.replace(/-/g, '.');       // EDGAR schreibt BRK.B, das Archiv BRK-B
      if (zuord[R.reihe] && (zuord[R.reihe].cik || zuord[R.reihe].weg)) { fertig++; return naechste(); }
      return ftsKuerzel(sym, R.letzterBalken).then(function (f) {
        var z = waehle(f, sym);
        z.ftsTreffer = f.treffer;
        var t = karte[sym] || karte[R.basis];
        z.tickerTabelle = t ? t.cik : null;
        z.tabelleStimmt = t ? (t.cik === z.cik ? 1 : 0) : null;
        zuord[R.reihe] = z;
        if (!z.cik) return null;
        return einreichungen(z.cik);
      }).then(function () {
        fertig++;
        if (fertig % 200 === 0) { sichern(false); console.log(fertig + '/' + reihen.length + '  Anfragen ' + ANFRAGEN + '  Fehler ' + FEHLER + '  ' + Math.round((Date.now() - t0) / 1000) + 's'); }
      }).then(naechste, function (e) {
        /* Nichts eintragen: ein Fehlschlag bleibt offen und wird beim naechsten Lauf
         * erneut versucht. Ein Eintrag "fehler" waere ein Ergebnis, und der
         * Wiederanlauf wuerde ihn ueberspringen. */
        console.error('FEHLER ' + R.reihe + ': ' + e.message); delete zuord[R.reihe]; fertig++; return naechste();
      });
    }
    /* Spuren nur, damit die Leitung nicht leer laeuft; die Bremse ist und bleibt der Takt oben. */
    var spuren = []; for (var s = 0; s < 10; s++) spuren.push(naechste());
    return Promise.all(spuren).then(function () { sichern(true); console.log('FERTIG  Anfragen ' + ANFRAGEN + '  Fehler ' + FEHLER + '  ' + Math.round((Date.now() - t0) / 1000) + 's'); });
  }).catch(function (e) { console.error('ABBRUCH', e); process.exit(1); });
}

module.exports = { RATE: RATE, RATE_MAX: RATE_MAX, UA: UA, FORMULARE: FORMULARE, waehle: waehle, VOR_TAGE: VOR_TAGE, NACH_TAGE: NACH_TAGE,
  holeJson: holeJson, einreichungen: einreichungen, anfragen: function () { return ANFRAGEN; } };
if (require.main === module) main();
