'use strict';
/* T2, Schritt 2 - EDGAR-Durchgang fuer die Reihen des Trockenlaufs (Auftrag Nr. 79). Fortsetzbar, alles gecacht.
 *
 * KOPIE der Suchlogik aus verschwundene-gruende-2026-09-12/edgar-lauf.js (Durchgang 1: Volltextsuche mit Zeitfenster
 * -> Emittent -> Einreichungen) und edgar-nachlauf.js (Durchgang 2: formulargefilterte Suche, Kandidaten geprueft).
 * Die Wahl des Emittenten (waehle), die Formularliste und die Fenstertage kommen per require aus dem Original.
 *
 * Was anders ist - und warum:
 *  - TAKT (Nachtrag 4.1): EINE Spur, mindestens 350 ms zwischen zwei Anfragen (unter 3 je Sekunde), weil Auftrag Nr. 80
 *    gleichzeitig bei der SEC laedt. Auch Wiederholungen und Weiterleitungen laufen durch dieselbe Bremse.
 *  - KENNUNG: kommt per require aus edgar-lauf.js (der Hauptlauf startet beim Laden nicht) und wird nirgends ausgegeben
 *    oder gespeichert.
 *  - CACHE in DIESEM Ordner (edgar/, ueber die .gitignore dieses Ordners nicht im Repo). Die Volltextsuche wird je
 *    Kuerzel UND Fenster abgelegt (Nachtrag 4.2): der alte Cache liegt je Kuerzel, gesucht wurde um den ALTEN Anker.
 *    Er wird nur benutzt, wenn sein Fenster (von/bis) genau das neue ist.
 *  - EINREICHUNGEN je Firma: der alte Auszug ist nicht nach Fenster gefiltert, aber (a) ein Stand vom 12.09.2026 und
 *    (b) auf `filings.recent` begrenzt (die letzten ~1.000 Einreichungen). Er wird nur benutzt, wenn er das neue Fenster
 *    nachweislich deckt (Fensterende <= Abruftag UND (weniger als 1.000 Einreichungen ODER aeltester Auszug-Eintrag
 *    <= Fensteranfang)). Sonst neu holen - samt der aelteren Dateien (`filings.files`), die das Fenster beruehren.
 *
 * Aufruf:  node t2-edgar.js [--max N] [--nur REIHE]
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var G = require('./gemeinsam.js');
var E = require('./t2-einstufen.js');
var L = require(path.join(G.GRUENDE, 'edgar-lauf.js'));   // waehle, FORMULARE, VOR_TAGE, NACH_TAGE, Kennung

var MIN_ABSTAND_MS = 350;                                 // Nachtrag 4.1
var CACHE = path.join(__dirname, 'edgar');
var TICK = path.join(CACHE, 'kuerzel'), TICK2 = path.join(CACHE, 'kuerzel2'), SUB = path.join(CACHE, 'cik');
var ALT = path.join(G.GRUENDE, 'edgar');
var RECENT_GRENZE = 1000;
var ZUORD = path.join(__dirname, 't2-edgar-zuordnung.json');

/* ---------- Takt: eine Spur ---------- */
var letzteAnfrage = 0, kette = Promise.resolve();
function warte() {
  kette = kette.then(function () {
    var w = Math.max(0, letzteAnfrage + MIN_ABSTAND_MS - Date.now());
    return new Promise(function (ok) { setTimeout(ok, w); });
  }).then(function () { letzteAnfrage = Date.now(); });
  return kette;
}
var Z = { anfragen: 0, fehlversuche: 0, ftsAltCache: 0, ftsEigenCache: 0, ftsNeu: 0, fts2EigenCache: 0, fts2Neu: 0,
  cikAltCache: 0, cikEigenCache: 0, cikNeu: 0, cikNeuWeilFensterNachAbruf: 0, cikNeuWeilGrenze: 0, cikNeuWeilFehlt: 0, aeltereDateien: 0, minAbstandGemessenMs: null };
var letzterStart = 0;
function hole(url) {
  return warte().then(function () {
    return new Promise(function (ok, nein) {
      var t = Date.now();
      if (letzterStart) { var d = t - letzterStart; if (Z.minAbstandGemessenMs == null || d < Z.minAbstandGemessenMs) Z.minAbstandGemessenMs = d; }
      letzterStart = t;
      Z.anfragen++;
      var req = https.get(url, { headers: { 'User-Agent': L.UA, 'Accept-Encoding': 'gzip, deflate', 'Accept': 'application/json' } }, function (res) {
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
/** Wie im Original: 404 = fehlt; sonst bis zu drei Versuche mit Pause; am Ende {fehler}. 403/429 bricht den Lauf ab -
 *  dann sperrt die Behoerde, und weiterfragen waere das Falsche. */
function holeJson(url, versuche) {
  versuche = versuche === undefined ? 3 : versuche;
  return hole(url).then(function (r) {
    if (r.code === 404) return { fehlt: true };
    if (r.code === 403 || r.code === 429) { var e = new Error('HTTP ' + r.code + ' - Sperre der Quelle, Lauf bricht ab'); e.sperre = true; throw e; }
    if (r.code !== 200) throw new Error('HTTP ' + r.code);
    return JSON.parse(r.text);
  }).catch(function (e) {
    if (e.sperre) throw e;
    Z.fehlversuche++;
    if (versuche <= 1) return { fehler: String(e.message || e) };
    return new Promise(function (ok) { setTimeout(ok, 2000 * (4 - versuche)); }).then(function () { return holeJson(url, versuche - 1); });
  });
}

function sicherName(s) { return s.replace(/[^A-Z0-9.~_-]/gi, '_'); }
function lies(p) { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; } }
function eimerAus(j, n) {
  var b = ((j.aggregations || {}).entity_filter || {}).buckets || [];
  return b.map(function (x) {
    var m = /^(.*?)(?:\s*\(([A-Z0-9.,\- ]*)\))?\s*\(CIK (\d{10})\)\s*$/.exec(x.key) || [];
    return { name: (m[1] || x.key).trim(), tickers: (m[2] || '').split(/,\s*/).filter(Boolean), cik: m[3] || null, n: x.doc_count };
  }).filter(function (x) { return x.cik; }).slice(0, n);
}

/* ---------- Volltextsuche mit Zeitfenster (Durchgang 1) bzw. mit Formularfilter (Durchgang 2) ---------- */
function fts(sym, anker, zweiter) {
  var von = G.tagPlus(anker, -L.VOR_TAGE), bis = G.tagPlus(anker, L.NACH_TAGE);
  var datei = path.join(zweiter ? TICK2 : TICK, sicherName(sym) + '__' + von + '__' + bis + '.json');
  var eigen = fs.existsSync(datei) ? lies(datei) : null;
  if (eigen) { if (zweiter) Z.fts2EigenCache++; else Z.ftsEigenCache++; return Promise.resolve(eigen); }
  /* alter Cache: je Kuerzel abgelegt - nur brauchbar, wenn er genau dieses Fenster traegt */
  var altP = path.join(ALT, zweiter ? 'kuerzel2' : 'kuerzel', sicherName(sym) + '.json'), alt = fs.existsSync(altP) ? lies(altP) : null;
  if (alt && alt.von === von && alt.bis === bis) { Z.ftsAltCache++; return Promise.resolve(alt); }
  var url = 'https://efts.sec.gov/LATEST/search-index?q=%22' + encodeURIComponent(sym) + '%22'
    + (zweiter ? '&forms=8-K,25-NSE,25,15-12G,15-12B' : '') + '&dateRange=custom&startdt=' + von + '&enddt=' + bis;
  return holeJson(url).then(function (j) {
    /* Eine gescheiterte Anfrage darf NICHT als "nichts gefunden" in den Cache (Original, Zeile 107). */
    if (j.fehler || j.fehlt || !j.aggregations) throw new Error((zweiter ? 'FTS2' : 'FTS') + ' ohne Aggregation: ' + (j.fehler || j.fehlt || 'Form'));
    var aus = { sym: sym, von: von, bis: bis, treffer: (j.hits && j.hits.total && j.hits.total.value) || 0, eimer: eimerAus(j, zweiter ? 5 : 8), geholt: new Date().toISOString() };
    fs.writeFileSync(datei, JSON.stringify(aus));
    if (zweiter) Z.fts2Neu++; else Z.ftsNeu++;
    return aus;
  });
}

/* ---------- Einreichungen je CIK ---------- */
/** Deckt ein Auszug das Fenster [von, bis]? Rueckgabe { ok, grund }. */
function deckt(S, von, bis) {
  if (!S) return { ok: false, grund: 'fehlt' };
  if (S.fehlt) return { ok: !!S.geholt && S.geholt.slice(0, 10) >= bis, grund: 'fehlt' };
  var geholt = String(S.geholt || '').slice(0, 10);
  if (bis > geholt) return { ok: false, grund: 'fensterNachAbruf' };
  if (S.gedecktAb !== undefined) return { ok: S.gedecktAb <= von, grund: 'grenze' };
  if (S.n < RECENT_GRENZE) return { ok: true };
  var e = S.einreichungen || [], aelt = e.length ? e[e.length - 1].d : null;
  e.forEach(function (x) { if (!aelt || x.d < aelt) aelt = x.d; });
  return { ok: !!(aelt && aelt <= von), grund: 'grenze' };
}
function auszug(r, e) {
  var n = (r.form || []).length;
  for (var i = 0; i < n; i++) {
    if (!L.FORMULARE.test(r.form[i])) continue;
    e.push({ f: r.form[i], d: r.filingDate[i], a: r.accessionNumber[i], it: (r.items && r.items[i]) || '' });
  }
  return n;
}
function einreichungen(cik, von, bis) {
  var eigenP = path.join(SUB, cik + '.json');
  var eigen = fs.existsSync(eigenP) ? lies(eigenP) : null;
  /* der eigene Auszug gilt, wenn er das Fenster deckt - das Fensterende darf dabei hinter dem Abruftag liegen
   * (frischer geht es nicht), solange er heute geholt ist */
  if (eigen && (eigen.fehlt || eigen.gedecktAb <= von)) { Z.cikEigenCache++; return Promise.resolve(eigen); }
  var altP = path.join(ALT, 'cik', cik + '.json'), alt = fs.existsSync(altP) ? lies(altP) : null;
  var d = deckt(alt, von, bis);
  if (d.ok) { Z.cikAltCache++; return Promise.resolve(alt); }
  return holeJson('https://data.sec.gov/submissions/CIK' + cik + '.json').then(function (j) {
    if (j.fehler) throw new Error('Einreichungen ' + cik + ': ' + j.fehler);
    if (j.fehlt) { var l = { cik: cik, fehlt: true, grund: '404', geholt: new Date().toISOString() }; fs.writeFileSync(eigenP, JSON.stringify(l)); Z.cikNeu++; return l; }
    var r = (j.filings && j.filings.recent) || {}, e = [], n = auszug(r, e);
    var aeltester = n ? r.filingDate[n - 1] : null;
    for (var q = 0; q < n; q++) if (r.filingDate[q] < aeltester) aeltester = r.filingDate[q];
    var dateien = ((j.filings && j.filings.files) || []).slice();
    var noetig = (aeltester && aeltester > von) ? dateien.filter(function (f) { return f.filingTo >= von; }) : [];
    var gedecktAb = dateien.length ? aeltester : '0000-00-00';   // ohne aeltere Dateien ist `recent` die ganze Geschichte
    var geholtDateien = [];
    function weiter(k) {
      if (k >= noetig.length) return Promise.resolve();
      return holeJson('https://data.sec.gov/submissions/' + noetig[k].name).then(function (a) {
        if (a.fehler || a.fehlt) throw new Error('aeltere Einreichungen ' + noetig[k].name + ': ' + (a.fehler || '404'));
        auszug(a, e); Z.aeltereDateien++; geholtDateien.push(noetig[k].name);
        if (noetig[k].filingFrom < gedecktAb) gedecktAb = noetig[k].filingFrom;
        return weiter(k + 1);
      });
    }
    return weiter(0).then(function () {
      if (noetig.length === dateien.length && dateien.length) gedecktAb = '0000-00-00';   // alle aelteren Dateien geholt
      e.sort(function (a, b) { return a.d < b.d ? 1 : a.d > b.d ? -1 : 0; });
      var aus = { cik: cik, name: j.name, tickers: j.tickers || [], exchanges: j.exchanges || [], sic: j.sic || null,
        sicText: j.sicDescription || null, frueher: (j.formerNames || []).map(function (x) { return x.name; }),
        letzteEinreichung: n ? r.filingDate[0] : null, n: n, aeltereDateien: dateien.length, aeltereGeholt: geholtDateien, gedecktAb: gedecktAb,
        einreichungen: e, geholt: new Date().toISOString() };
      fs.writeFileSync(eigenP, JSON.stringify(aus));
      Z.cikNeu++;
      if (d.grund === 'fensterNachAbruf') Z.cikNeuWeilFensterNachAbruf++; else if (d.grund === 'grenze') Z.cikNeuWeilGrenze++; else Z.cikNeuWeilFehlt++;
      return aus;
    });
  });
}

/* ---------- Lauf ---------- */
function main() {
  var arg = process.argv.slice(2);
  var maxN = arg.indexOf('--max') >= 0 ? Number(arg[arg.indexOf('--max') + 1]) : Infinity;
  var nur = arg.indexOf('--nur') >= 0 ? arg[arg.indexOf('--nur') + 1] : null;
  [CACHE, TICK, TICK2, SUB].forEach(function (d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); });
  var V = G.json(path.join(__dirname, 't2-verschwundene.json'));
  var reihen = V.reihen;
  if (nur) reihen = reihen.filter(function (r) { return r.reihe === nur; });
  if (maxN < reihen.length) reihen = reihen.slice(0, maxN);
  var alt = fs.existsSync(ZUORD) ? lies(ZUORD) : null;
  var zuord = (alt && alt.zuordnung) || {};
  var summe = (alt && alt.summe) || {};                    // Zaehler ueber alle Durchgaenge (der Lauf ist fortsetzbar)
  var karte = {};
  var tk = lies(path.join(ALT, '_company_tickers.json'));  // nur Bestaetigung, nie Quelle (wie im Original); alter Stand, nur gelesen
  if (tk) Object.keys(tk).forEach(function (i) { var e = tk[i]; if (e && e.ticker) karte[String(e.ticker).toUpperCase()] = { cik: String(e.cik_str).padStart(10, '0'), name: e.title }; });
  var hatBalken = E.hatBalkenKarte(), lebendAb = E.ms(V.lebendAb);
  var t0 = Date.now(), fertig = 0, uebersprungen = 0, fehler = [], folgeFehler = 0;

  function sichern(schluss) {
    var s = {}; Object.keys(Z).forEach(function (k) { s[k] = k === 'minAbstandGemessenMs' ? (summe[k] == null ? Z[k] : (Z[k] == null ? summe[k] : Math.min(summe[k], Z[k]))) : (summe[k] || 0) + Z[k]; });
    var o = { stand: new Date().toISOString(), fertig: !!schluss, minAbstandMs: MIN_ABSTAND_MS, sekundenDieserLauf: Math.round((Date.now() - t0) / 1000),
      zaehler: Z, summe: s, fehler: fehler, zuordnung: zuord };
    fs.writeFileSync(ZUORD + '.tmp', JSON.stringify(o)); fs.renameSync(ZUORD + '.tmp', ZUORD);
  }
  function eine(R) {
    var sym = R.basis.replace(/-/g, '.');                  // EDGAR schreibt BRK.B, das Archiv BRK-B
    var von = G.tagPlus(R.letzterBalken, -L.VOR_TAGE), bis = G.tagPlus(R.letzterBalken, L.NACH_TAGE);
    var z;
    return fts(sym, R.letzterBalken, false).then(function (f) {
      z = L.waehle(f, sym);
      z.ftsTreffer = f.treffer;
      var t = karte[sym] || karte[R.basis];
      z.tickerTabelle = t ? t.cik : null;
      z.tabelleStimmt = t ? (t.cik === z.cik ? 1 : 0) : null;
      return z.cik ? einreichungen(z.cik, von, bis) : null;
    }).then(function (S) {
      var u = E.stufeEin(R, z, S, hatBalken, lebendAb, null);          // ohne Bigdata - wie der Stand vor dem Nachlauf
      if (u.grund !== 'unbekannt') return null;
      /* Durchgang 2 (edgar-nachlauf.js): formulargefilterte Suche; von den drei obersten Kandidaten gewinnt, wer im
       * Fenster ein Abmelde-Signal eingereicht hat. */
      return fts(sym, R.letzterBalken, true).then(function (f2) {
        var k = (f2.eimer || []).slice(0, 3), n = 0;
        function weiter() {
          if (n >= k.length) return null;
          var kand = k[n++];
          return einreichungen(kand.cik, von, bis).then(function (S2) {
            if (!S2 || S2.fehlt) return weiter();
            var fen = E.fenster(S2, R.letzterBalken);
            if (fen.endsignal || fen.i301 || fen.i103 || (fen.i201 && fen.fusionsbeleg)) {
              return { cik: kand.cik, name: kand.name, weg: 'fts2-geprueft', sicherheit: 'stark', n: kand.n, platz: n };
            }
            return weiter();
          });
        }
        return weiter();
      });
    }).then(function (treffer) {
      if (treffer) { treffer.durchgang1 = { cik: z.cik || null, weg: z.weg }; z = treffer; }
      z.fertig = 1; z.anker = R.letzterBalken;
      zuord[R.reihe] = z;
      folgeFehler = 0;
    });
  }
  var i = 0;
  function naechste() {
    if (i >= reihen.length) return Promise.resolve();
    var R = reihen[i++];
    if (zuord[R.reihe] && zuord[R.reihe].fertig && zuord[R.reihe].anker === R.letzterBalken) { uebersprungen++; return naechste(); }
    return eine(R).then(function () {
      fertig++;
      if (fertig % 20 === 0) { sichern(false); console.log(fertig + '/' + (reihen.length - uebersprungen) + '  Anfragen ' + Z.anfragen + '  Fehlversuche ' + Z.fehlversuche + '  ' + Math.round((Date.now() - t0) / 1000) + 's'); }
    }, function (e) {
      /* Nichts eintragen: ein Fehlschlag bleibt offen und wird beim naechsten Lauf erneut versucht (Original, Zeile 187). */
      console.error('FEHLER ' + R.reihe + ': ' + e.message);
      fehler.push({ reihe: R.reihe, meldung: String(e.message).slice(0, 160) });
      if (e.sperre || ++folgeFehler >= 8) { var a = new Error('Abbruch: ' + (e.sperre ? 'Sperre der Quelle' : 'acht Fehler in Folge')); a.abbruch = true; throw a; }
    }).then(naechste);
  }
  naechste().then(function () {
    sichern(true);
    console.log('FERTIG  Reihen ' + fertig + ' (uebersprungen ' + uebersprungen + ')  Anfragen ' + Z.anfragen + '  Fehlversuche ' + Z.fehlversuche + '  offen ' + fehler.length + '  ' + Math.round((Date.now() - t0) / 1000) + 's');
    console.log(JSON.stringify(Z));
  }, function (e) { sichern(false); console.error('ABBRUCH', e.message); process.exit(1); });
}

module.exports = { deckt: deckt, MIN_ABSTAND_MS: MIN_ABSTAND_MS };
if (require.main === module) main();
