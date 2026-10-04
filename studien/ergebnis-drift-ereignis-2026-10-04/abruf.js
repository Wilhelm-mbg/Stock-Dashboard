'use strict';
/* M1 - Einreichungslisten der SEC je Firma holen und auf die 8-K-Zeilen ab 2016 eindampfen (Auftrag §1 M1, §5.1).
 *
 *   node abruf.js --probe          20 Firmen (10 lebende, 10 verschwundene), rohe Antworten als Beleg, Feldpruefung
 *   node abruf.js --alle [--max N] alle CIKs der Bilanz-Tafel v1.1 (meta.ciks), fortsetzbar
 *
 * Abruf: NUR `holeJson` aus dem vorhandenen Lader (Drosselung und Kennung stecken darin, §5.1) - der Lader wird per require
 * geholt, sein Hauptlauf startet dabei nicht, sein Ordner wird nicht beschrieben. Davor ein eigener Takt: mindestens
 * K.TAKT_MS zwischen zwei Anfragen, EINE Spur (strikt nacheinander). Bei 429/403: zehn Minuten warten, dann halber Takt.
 * Cache: E:/Markt-Dashboard-Archiv/edgar-submissions/cik/<CIK zehnstellig>.json = Auszug (alle 8-K-Formen ab 2016 mit
 * Annahmezeit, dazu Name, Kuerzel, Zaehler). Eine gescheiterte Anfrage wird NIE als "nichts gefunden" abgelegt: die Firma
 * bleibt offen und kommt beim naechsten Lauf wieder dran. 404 der SEC ist eine Antwort ("keine Liste") und wird abgelegt.
 * Ausgabe: nur Zaehlungen und einzelne Felder, nie die Antwort selbst.
 */
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var K = require('./konfig.js');
var ALT = require(K.ALTER_LADER);

var FELDER = ['accessionNumber', 'filingDate', 'reportDate', 'acceptanceDateTime', 'form', 'items', 'primaryDocument'];
var FORM_8K = /^8-K/;                          /* 8-K, 8-K/A, 8-K12B, 8-K12G3, 8-K15D5 ... */
var PROBE_LEBEND = ['A', 'AAPL', 'MSFT', 'JPM', 'DRI', 'ABT', 'AIR', 'KO', 'NVDA', 'XOM'];
/* verschwunden; JONE, CAPA, BBBY, AAC: Kuerzel spaeter von einer anderen Firma wiederverwendet */
var PROBE_VERSCHWUNDEN = ['JONE', 'CAPA', 'BBBY', 'AAC', 'AABA', 'HARP', 'TWTR', 'ATVI', 'CELG', 'XLNX', 'TIF', 'ARCH'];

var taktMs = K.TAKT_MS, letzte = 0;
var Z = { anfragen: 0, fehler: 0, sperren: 0, fehlt: 0 };

function schlaf(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
function takt() {
  var rest = letzte + taktMs - Date.now();
  return (rest > 0 ? schlaf(rest) : Promise.resolve()).then(function () { letzte = Date.now(); });
}

/** Eine Anfrage, eine Spur. Liefert das JSON, {fehlt:true} bei 404 oder wirft nach erschoepften Versuchen. */
async function anfrage(url) {
  var versuch = 0, sperren = 0;
  for (;;) {
    await takt();
    Z.anfragen++;
    var j = await ALT.holeJson(url, 1);
    if (!j || !j.fehler) return j;
    Z.fehler++;
    if (/HTTP (429|403)/.test(j.fehler)) {
      Z.sperren++; sperren++;
      if (sperren > 3) throw new Error('SEC sperrt wiederholt (' + j.fehler + ') - Lauf beendet, Rest bleibt offen');
      taktMs = Math.max(taktMs, 2 * K.TAKT_MS);
      sag('SPERRE ' + j.fehler + ' - warte zehn Minuten, danach Takt ' + taktMs + ' ms');
      await schlaf(K.SPERRE_WARTEN_MS);
      continue;
    }
    versuch++;
    if (versuch >= 3) throw new Error(j.fehler);
    await schlaf(versuch === 1 ? 5000 : 20000);
  }
}

function sag(s) { process.stdout.write(new Date().toISOString() + ' ' + s + '\n'); }
function cik10(c) { return String(c).padStart(10, '0'); }
function schreibeSicher(p, text) { fs.writeFileSync(p + '.teil', text); fs.renameSync(p + '.teil', p); }

/** Spaltenobjekt der SEC ({form: [...], filingDate: [...], ...}) -> 8-K-Zeilen ab K.VON; zaehlt mit. */
function zeilenAus(sp, z) {
  var n = (sp && sp.form && sp.form.length) || 0, aus = [];
  FELDER.forEach(function (f) { if (!sp || !Array.isArray(sp[f]) || sp[f].length !== n) z.feldFehlt[f] = (z.feldFehlt[f] || 0) + 1; });
  for (var i = 0; i < n; i++) {
    var d = sp.filingDate ? sp.filingDate[i] : null;
    z.gesehen++;
    if (d && (!z.aelteste || d < z.aelteste)) z.aelteste = d;
    if (d && (!z.juengste || d > z.juengste)) z.juengste = d;
    if (!FORM_8K.test(sp.form[i]) || !d || d < K.VON || d > K.BIS) continue;
    aus.push({ a: sp.accessionNumber ? sp.accessionNumber[i] : null, t: sp.acceptanceDateTime ? sp.acceptanceDateTime[i] : null,
      d: d, r: sp.reportDate ? sp.reportDate[i] : null, f: sp.form[i], i: sp.items ? (sp.items[i] || '') : null,
      p: sp.primaryDocument ? sp.primaryDocument[i] : null });
  }
  return aus;
}

/** Eine Firma: Hauptliste + die Zusatzdateien, die ins Fenster reichen. Liefert den Auszug (und schreibt ihn in den Cache). */
async function holeCik(cik, probe) {
  var ziel = path.join(K.CACHE_CIK, cik10(cik) + '.json');
  if (fs.existsSync(ziel)) { try { return JSON.parse(fs.readFileSync(ziel, 'utf8')); } catch (e) { /* zerrissen: neu holen */ } }
  var j = await anfrage('https://data.sec.gov/submissions/CIK' + cik10(cik) + '.json');
  if (j.fehlt) {
    Z.fehlt++;
    var leer = { cik: +cik, fehlt: true, geholt: new Date().toISOString() };
    schreibeSicher(ziel, JSON.stringify(leer));
    return leer;
  }
  if (probe) fs.writeFileSync(path.join(K.CACHE_PROBE, 'CIK' + cik10(cik) + '.json.gz'), zlib.gzipSync(JSON.stringify(j)));
  var z = { gesehen: 0, aelteste: null, juengste: null, feldFehlt: {} };
  var recent = j.filings && j.filings.recent;
  var k8 = zeilenAus(recent, z);
  var schluessel = recent ? Object.keys(recent) : [];
  var dateien = [];
  var liste = (j.filings && j.filings.files) || [];
  for (var i = 0; i < liste.length; i++) {
    var f = liste[i], eintrag = { name: f.name, von: f.filingFrom || null, bis: f.filingTo || null, n: f.filingCount || null, geholt: false };
    dateien.push(eintrag);
    if (f.filingTo && f.filingTo < K.VON) continue;            /* reicht nicht ins Fenster */
    var e = await anfrage('https://data.sec.gov/submissions/' + f.name);
    if (e.fehlt) throw new Error('Zusatzdatei fehlt (404): ' + f.name);
    if (probe) fs.writeFileSync(path.join(K.CACHE_PROBE, f.name + '.gz'), zlib.gzipSync(JSON.stringify(e)));
    k8 = k8.concat(zeilenAus(e, z));
    eintrag.geholt = true;
  }
  /* doppelte Akzessionen (Hauptliste und Zusatzdatei ueberlappen nicht, aber sicher ist sicher) */
  var gesehen = {}, eindeutig = [];
  k8.forEach(function (r) { if (r.a && gesehen[r.a]) return; if (r.a) gesehen[r.a] = 1; eindeutig.push(r); });
  eindeutig.sort(function (x, y) { return x.d < y.d ? -1 : x.d > y.d ? 1 : (x.t || '') < (y.t || '') ? -1 : 1; });
  var aus = { cik: +cik, name: j.name || null, tickers: j.tickers || [], exchanges: j.exchanges || [], sic: j.sic || null,
    frueher: (j.formerNames || []).map(function (x) { return { name: x.name, von: x.from || null, bis: x.to || null }; }),
    schluessel: schluessel, nRecent: (recent && recent.form && recent.form.length) || 0, dateien: dateien,
    nGesehen: z.gesehen, aelteste: z.aelteste, juengste: z.juengste, feldFehlt: z.feldFehlt, doppelt: k8.length - eindeutig.length,
    k8: eindeutig, geholt: new Date().toISOString() };
  schreibeSicher(ziel, JSON.stringify(aus));
  return aus;
}

function hat202(items) { return String(items || '').split(',').indexOf('2.02') !== -1; }

function meta() { return JSON.parse(fs.readFileSync(path.join(K.TAFEL, '_reihen.json'), 'utf8')); }

async function probe() {
  var M = meta(), Zt = require('./zeit.js');
  var liste = [];
  PROBE_LEBEND.forEach(function (s) { var r = M.reihen[s]; if (r && r.cik && r.lebend) liste.push({ sym: s, cik: r.cik, lebend: 1 }); else sag('Probe: ' + s + ' nicht als lebende Reihe mit CIK in der Tafel'); });
  var v = 0;
  PROBE_VERSCHWUNDEN.forEach(function (s) {
    var r = M.reihen[s];
    if (r && r.cik && !r.lebend && v < 10) { liste.push({ sym: s, cik: r.cik, lebend: 0, letzter: r.letzter }); v++; } else if (v < 10) sag('Probe: ' + s + ' nicht als verschwundene Reihe mit CIK in der Tafel');
  });
  var ergebnis = [];
  for (var i = 0; i < liste.length; i++) {
    var L = liste[i], e = await holeCik(L.cik, true);
    var k = (e.k8 || []), z202 = k.filter(function (r) { return hat202(r.i); });
    var mitZeit = z202.filter(function (r) { return Zt.FORM.test(r.t || ''); }).length;
    var zeile = { sym: L.sym, cik: L.cik, lebend: L.lebend, letzterBalken: L.letzter || null, fehlt: !!e.fehlt, name: e.name || null,
      tickersHeute: (e.tickers || []).join('/'), nRecent: e.nRecent, zusatzdateien: (e.dateien || []).length,
      zusatzGeholt: (e.dateien || []).filter(function (d) { return d.geholt; }).length, nGesehen: e.nGesehen, aelteste: e.aelteste, juengste: e.juengste,
      feldFehlt: Object.keys(e.feldFehlt || {}).join(',') || '-', felderDa: FELDER.every(function (f) { return (e.schluessel || []).indexOf(f) !== -1; }),
      n8k: k.length, n202: z202.length, mitAnnahmezeit: mitZeit, erste202: z202.length ? z202[0].d : null, letzte202: z202.length ? z202[z202.length - 1].d : null,
      beispielZeit: z202.length ? z202[z202.length - 1].t : null, beispielItems: z202.length ? z202[z202.length - 1].i : null };
    ergebnis.push(zeile);
    sag(JSON.stringify(zeile));
  }
  var p = path.join(__dirname, 'probe-20.json');
  fs.writeFileSync(p, JSON.stringify({ stand: new Date().toISOString(), anfragen: Z.anfragen, fehler: Z.fehler, sperren: Z.sperren, firmen: ergebnis }, null, 1));
  sag('PROBE FERTIG: ' + ergebnis.length + ' Firmen, Anfragen ' + Z.anfragen + ', Fehler ' + Z.fehler + ', Sperren ' + Z.sperren + ' -> ' + path.basename(p));
}

async function alle(maxN) {
  var M = meta();
  var ciks = Object.keys(M.ciks).map(Number).sort(function (a, b) { return a - b; });
  if (maxN && maxN < ciks.length) ciks = ciks.slice(0, maxN);
  var t0 = Date.now(), fertig = 0, neu = 0, offen = [], pf = path.join(K.CACHE, '_fortschritt.json');
  function sichern(schluss) {
    schreibeSicher(pf, JSON.stringify({ stand: new Date().toISOString(), gesamt: ciks.length, fertig: fertig, neuGeholt: neu, offen: offen.length, offenBeispiele: offen.slice(0, 20),
      anfragen: Z.anfragen, fehler: Z.fehler, sperren: Z.sperren, ohneListe404: Z.fehlt, taktMs: taktMs, sekunden: Math.round((Date.now() - t0) / 1000), schluss: !!schluss }));
  }
  for (var i = 0; i < ciks.length; i++) {
    var da = fs.existsSync(path.join(K.CACHE_CIK, cik10(ciks[i]) + '.json'));
    try {
      await holeCik(ciks[i], false);
      if (!da) neu++;
    } catch (e) {
      offen.push({ cik: ciks[i], grund: String(e.message || e) });
      if (/sperrt wiederholt/.test(String(e.message))) { sichern(true); sag('ABBRUCH: ' + e.message); process.exit(3); }
    }
    fertig++;
    if (fertig % 25 === 0) sichern(false);
    if (fertig % 250 === 0) sag(fertig + '/' + ciks.length + ' neu ' + neu + ' offen ' + offen.length + ' Anfragen ' + Z.anfragen + ' Fehler ' + Z.fehler + ' Sperren ' + Z.sperren + ' ' + Math.round((Date.now() - t0) / 1000) + 's');
  }
  sichern(true);
  sag('FERTIG: ' + fertig + ' Firmen, neu geholt ' + neu + ', offen ' + offen.length + ', Anfragen ' + Z.anfragen + ', Fehler ' + Z.fehler + ', Sperren ' + Z.sperren + ', ' + Math.round((Date.now() - t0) / 1000) + ' s');
}

module.exports = { zeilenAus: zeilenAus, hat202: hat202, cik10: cik10, FELDER: FELDER, FORM_8K: FORM_8K };

if (require.main === module) {
  var arg = process.argv.slice(2);
  [K.CACHE, K.CACHE_CIK, K.CACHE_PROBE, K.CACHE_KOPF].forEach(function (d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
  var lauf = arg.indexOf('--probe') >= 0 ? probe() : arg.indexOf('--alle') >= 0 ? alle(arg.indexOf('--max') >= 0 ? Number(arg[arg.indexOf('--max') + 1]) : 0) : Promise.reject(new Error('--probe oder --alle'));
  lauf.catch(function (e) { sag('ABBRUCH ' + (e && e.message || e)); process.exit(1); });
}
