'use strict';
/* TEIL 4, Schritt 2 - EDGAR-Durchgang fuer ALLE nicht lebenden Aktienreihen (Auftrag Nr. 86). Fortsetzbar, alles gecacht.
 *
 * KOPIE von ../t2-edgar.js (Nr. 79), das selbst die Suchlogik aus verschwundene-gruende-2026-09-12/edgar-lauf.js und
 * edgar-nachlauf.js kopiert. Die Wahl des Emittenten (waehle), die Formularliste und die Fenstertage kommen weiter per
 * require aus dem Original vom 12.09. - ebenso die KENNUNG des Abrufs, die nirgends ausgegeben oder gespeichert wird.
 *
 * Was gegenueber der Kopie aus Nr. 79 anders ist - und warum:
 *  - R-a (FIRMA): fuehrt die Polygon-Liste fuer das Kuerzel einen Eintrag mit CIK hoechstens 45 Tage vom Anker
 *    (t4-universum.js -> polygonFirma), GILT diese CIK. Keine Volltextsuche, kein zweiter Durchgang. Nur ohne sie laeuft
 *    die Suche wie bisher (Durchgang 1: Volltext mit Zeitfenster; Durchgang 2: formulargefiltert, drei Kandidaten).
 *  - ZWEITER DURCHGANG: ein Kandidat gilt, wenn die EINSTUFUNG mit ihm einen Grund ergibt (stufeEin der Kopie mit R-b und
 *    R-c). Im Original genuegte "irgendein Abmelde-Signal im Fenster" - das waere jetzt weiter als die Einstufung selbst
 *    (ein Formular 25 einer Firma ohne Aussenanker oder ein 2.01 fern vom Anker ergeben keinen Grund mehr). Gezaehlt wird,
 *    wie oft das alte Kriterium einen Kandidaten genommen haette, den das neue ablehnt (fts2NurAltesKriterium).
 *  - TAKT: EINE Spur; mindestens 180 ms zwischen zwei Anfragen an data.sec.gov (5,6 je Sekunde - der Auftrag erlaubt
 *    hoechstens 6), mindestens 350 ms vor einer Volltextsuche (efts.sec.gov, wie in Nr. 79). Bei HTTP 429/403: zehn
 *    Minuten warten, danach doppelter Abstand (halber Takt), dieselbe Anfrage noch einmal; nach der dritten Sperre Abbruch.
 *  - CACHE in DIESEM Ordner (edgar/, nicht im Repo). Einreichungen je Firma: erst der eigene Auszug, dann der aus Nr. 79,
 *    dann der vom 12.09. - die beiden fremden nur, wo sie das Fenster NACHWEISLICH decken (Regel aus Nr. 79: Fensterende
 *    <= Abruftag UND (weniger als 1.000 Einreichungen ODER aeltester Eintrag <= Fensteranfang)). Volltextsuche: je
 *    Kuerzel UND Fenster; fremde Ablagen nur bei genau gleichem Fenster.
 *  - FORTSCHRITT in t4-edgar-fortschritt.json (alle 20 Reihen), Zuordnung in t4-edgar-zuordnung.json.
 *
 * Aufruf:  node t4-edgar.js [--max N] [--nur REIHE]
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var G = require('../gemeinsam.js');
var E = require('./t4-einstufen.js');
var L = require(path.join(G.GRUENDE, 'edgar-lauf.js'));   // waehle, FORMULARE, VOR_TAGE, NACH_TAGE, Kennung

var MIN_ABSTAND_MS = 180;                                 // data.sec.gov: 5,6 Anfragen je Sekunde (Auftrag: hoechstens 6)
var MIN_ABSTAND_SUCHE_MS = 350;                           // efts.sec.gov (Volltextsuche): wie in Nr. 79
var SPERRE_WARTEN_MS = 600000;                            // 429/403: zehn Minuten
var MAX_SPERREN = 3;
var taktFaktor = 1;                                       // verdoppelt sich nach jeder Sperre (halber Takt)
var CACHE = path.join(__dirname, 'edgar');
var TICK = path.join(CACHE, 'kuerzel'), TICK2 = path.join(CACHE, 'kuerzel2'), SUB = path.join(CACHE, 'cik');
var NR79 = path.join(G.HIER, 'edgar');                    // Cache des Trockenlaufs Nr. 79 (nur lesen)
var ALT = path.join(G.GRUENDE, 'edgar');                  // Cache vom 12.09.2026 (nur lesen)
var RECENT_GRENZE = 1000;
var ZUORD = path.join(__dirname, 't4-edgar-zuordnung.json');
var FORTSCHRITT = path.join(__dirname, 't4-edgar-fortschritt.json');

/* ---------- Takt: eine Spur ---------- */
var letzteAnfrage = 0, kette = Promise.resolve();
function warte(abstand) {
  kette = kette.then(function () {
    var w = Math.max(0, letzteAnfrage + abstand * taktFaktor - Date.now());
    return new Promise(function (ok) { setTimeout(ok, w); });
  }).then(function () { letzteAnfrage = Date.now(); });
  return kette;
}
var Z = { anfragen: 0, fehlversuche: 0, sperren: 0, polygonFirma: 0, polygonOhneEinreichungen: 0, ftsReihen: 0,
  ftsNr79Cache: 0, ftsAltCache: 0, ftsEigenCache: 0, ftsNeu: 0, fts2EigenCache: 0, fts2Nr79Cache: 0, fts2Neu: 0, fts2NurAltesKriterium: 0,
  cikEigenCache: 0, cikNr79Cache: 0, cikAltCache: 0, cikNeu: 0, cikNeuWeilFensterNachAbruf: 0, cikNeuWeilGrenze: 0, cikNeuWeilFehlt: 0,
  aeltereDateien: 0, minAbstandGemessenMs: null };
var letzterStart = 0, meldungen = [];
function melde(t) { var z = new Date().toISOString() + ' ' + t; meldungen.push(z); console.log(z); }
function hole(url) {
  var suche = url.indexOf('https://efts.sec.gov/') === 0;
  return warte(suche ? MIN_ABSTAND_SUCHE_MS : MIN_ABSTAND_MS).then(function () {
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
/** 404 = fehlt; 429/403 = Sperre: zehn Minuten warten, Takt halbieren, dieselbe Anfrage noch einmal (hoechstens
 *  MAX_SPERREN-mal im Lauf, dann Abbruch); sonst bis zu drei Versuche mit Pause; am Ende {fehler}. */
function holeJson(url, versuche) {
  versuche = versuche === undefined ? 3 : versuche;
  return hole(url).then(function (r) {
    if (r.code === 404) return { fehlt: true };
    if (r.code === 403 || r.code === 429) {
      Z.sperren++;
      if (Z.sperren > MAX_SPERREN) { var e = new Error('HTTP ' + r.code + ' - Sperre der Quelle zum ' + Z.sperren + '. Mal, Lauf bricht ab'); e.sperre = true; throw e; }
      taktFaktor *= 2;
      melde('SPERRE HTTP ' + r.code + ' (Nr. ' + Z.sperren + ') - zehn Minuten warten, danach Abstand x ' + taktFaktor);
      return new Promise(function (ok) { setTimeout(ok, SPERRE_WARTEN_MS); }).then(function () { return holeJson(url, versuche); });
    }
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
  var name = sicherName(sym) + '__' + von + '__' + bis + '.json', unter = zweiter ? 'kuerzel2' : 'kuerzel';
  var datei = path.join(zweiter ? TICK2 : TICK, name);
  var eigen = fs.existsSync(datei) ? lies(datei) : null;
  if (eigen) { if (zweiter) Z.fts2EigenCache++; else Z.ftsEigenCache++; return Promise.resolve(eigen); }
  /* Ablage aus Nr. 79: je Kuerzel UND Fenster - derselbe Dateiname heisst dasselbe Fenster */
  var n79 = lies(path.join(NR79, unter, name));
  if (n79 && n79.von === von && n79.bis === bis) { if (zweiter) Z.fts2Nr79Cache++; else Z.ftsNr79Cache++; return Promise.resolve(n79); }
  /* Ablage vom 12.09.: je Kuerzel - nur brauchbar, wenn sie genau dieses Fenster traegt */
  var alt = lies(path.join(ALT, unter, sicherName(sym) + '.json'));
  if (alt && alt.von === von && alt.bis === bis) { Z.ftsAltCache++; return Promise.resolve(alt); }
  var url = 'https://efts.sec.gov/LATEST/search-index?q=%22' + encodeURIComponent(sym) + '%22'
    + (zweiter ? '&forms=8-K,25-NSE,25,15-12G,15-12B' : '') + '&dateRange=custom&startdt=' + von + '&enddt=' + bis;
  return holeJson(url).then(function (j) {
    /* Eine gescheiterte Anfrage darf NICHT als "nichts gefunden" in den Cache. */
    if (j.fehler || j.fehlt || !j.aggregations) throw new Error((zweiter ? 'FTS2' : 'FTS') + ' ohne Aggregation: ' + (j.fehler || j.fehlt || 'Form'));
    var aus = { sym: sym, von: von, bis: bis, treffer: (j.hits && j.hits.total && j.hits.total.value) || 0, eimer: eimerAus(j, zweiter ? 5 : 8), geholt: new Date().toISOString() };
    fs.writeFileSync(datei, JSON.stringify(aus));
    if (zweiter) Z.fts2Neu++; else Z.ftsNeu++;
    return aus;
  });
}

/* ---------- Einreichungen je CIK ---------- */
/** Deckt ein FREMDER Auszug das Fenster [von, bis]? Rueckgabe { ok, grund }. (wortgleich mit Nr. 79) */
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
/** Der Auszug, der fuer dieses Fenster gilt - ohne Netz. { S, woher } oder { S: null, grund }.
 *  Der eigene Auszug gilt, wenn er bis vor den Fensteranfang reicht (das Fensterende darf hinter dem Abruftag liegen -
 *  frischer geht es nicht). Die fremden nur nach deckt(). t4-einstufen.js liest ueber dieselbe Funktion. */
function lokal(cik, von, bis) {
  var eigen = lies(path.join(SUB, cik + '.json'));
  if (eigen && (eigen.fehlt || eigen.gedecktAb <= von)) return { S: eigen, woher: 'eigen' };
  var n79 = lies(path.join(NR79, 'cik', cik + '.json'));
  if (deckt(n79, von, bis).ok) return { S: n79, woher: 'nr79' };
  var alt = lies(path.join(ALT, 'cik', cik + '.json')), d = deckt(alt, von, bis);
  if (d.ok) return { S: alt, woher: 'alt' };
  return { S: null, grund: d.grund };
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
  var da = lokal(cik, von, bis);
  if (da.S) { if (da.woher === 'eigen') Z.cikEigenCache++; else if (da.woher === 'nr79') Z.cikNr79Cache++; else Z.cikAltCache++; return Promise.resolve(da.S); }
  var eigenP = path.join(SUB, cik + '.json');
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
      if (da.grund === 'fensterNachAbruf') Z.cikNeuWeilFensterNachAbruf++; else if (da.grund === 'grenze') Z.cikNeuWeilGrenze++; else Z.cikNeuWeilFehlt++;
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
  var V = G.json(path.join(__dirname, 't4-verschwundene.json'));
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
    var o = { stand: new Date().toISOString(), fertig: !!schluss, minAbstandMs: MIN_ABSTAND_MS, minAbstandSucheMs: MIN_ABSTAND_SUCHE_MS, taktFaktor: taktFaktor,
      sekundenDieserLauf: Math.round((Date.now() - t0) / 1000), zaehler: Z, summe: s, fehler: fehler, zuordnung: zuord };
    fs.writeFileSync(ZUORD + '.tmp', JSON.stringify(o)); fs.renameSync(ZUORD + '.tmp', ZUORD);
    var f = { stand: o.stand, fertig: !!schluss, reihenGesamt: reihen.length, reihenFertigDieserLauf: fertig, uebersprungen: uebersprungen, zugeordnet: Object.keys(zuord).length,
      anfragen: Z.anfragen, fehlversuche: Z.fehlversuche, sperren: Z.sperren, taktFaktor: taktFaktor, offeneFehler: fehler.length, sekunden: o.sekundenDieserLauf,
      anfragenJeSekunde: Math.round(100 * Z.anfragen / Math.max(1, o.sekundenDieserLauf)) / 100, minAbstandGemessenMs: Z.minAbstandGemessenMs, meldungen: meldungen.slice(-20) };
    fs.writeFileSync(FORTSCHRITT + '.tmp', JSON.stringify(f, null, 1)); fs.renameSync(FORTSCHRITT + '.tmp', FORTSCHRITT);
  }
  function eine(R) {
    var sym = R.basis.replace(/-/g, '.');                  // EDGAR schreibt BRK.B, das Archiv BRK-B
    var von = G.tagPlus(R.letzterBalken, -L.VOR_TAGE), bis = G.tagPlus(R.letzterBalken, L.NACH_TAGE);
    var z;
    /* R-a: die Polygon-CIK gilt - keine Volltextsuche, kein zweiter Durchgang */
    if (R.polygonFirma && R.polygonFirma.cik) {
      z = { cik: R.polygonFirma.cik, name: R.polygonFirma.name, weg: 'polygon-cik', sicherheit: 'stark', polygonBis: R.polygonFirma.bis, polygonTage: R.polygonFirma.tage };
      Z.polygonFirma++;
      return einreichungen(z.cik, von, bis).then(function (S) {
        if (!S || S.fehlt) { z.ohneEinreichungen = 1; Z.polygonOhneEinreichungen++; }
        z.fertig = 1; z.anker = R.letzterBalken;
        zuord[R.reihe] = z;
        folgeFehler = 0;
      });
    }
    Z.ftsReihen++;
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
      /* Durchgang 2: formulargefilterte Suche; von den drei obersten Kandidaten gewinnt der erste, mit dem die
       * Einstufung (R-b, R-c) einen Grund ergibt. */
      return fts(sym, R.letzterBalken, true).then(function (f2) {
        var k = (f2.eimer || []).slice(0, 3), n = 0;
        function weiter() {
          if (n >= k.length) return null;
          var kand = k[n++];
          return einreichungen(kand.cik, von, bis).then(function (S2) {
            if (!S2 || S2.fehlt) return weiter();
            var zk = { cik: kand.cik, name: kand.name, weg: 'fts2-geprueft', sicherheit: 'stark', n: kand.n, platz: n };
            if (E.stufeEin(R, zk, S2, hatBalken, lebendAb, null).grund !== 'unbekannt') return zk;
            var fen = E.fenster(S2, R.letzterBalken);
            if (fen.endsignal || fen.i301 || fen.i103 || (fen.i201 && fen.fusionsbeleg)) Z.fts2NurAltesKriterium++;
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
      if (fertig % 20 === 0) sichern(false);
      if (fertig % 200 === 0) console.log(fertig + '/' + (reihen.length - uebersprungen) + '  Anfragen ' + Z.anfragen + '  Fehlversuche ' + Z.fehlversuche + '  ' + Math.round((Date.now() - t0) / 1000) + 's');
    }, function (e) {
      /* Nichts eintragen: ein Fehlschlag bleibt offen und wird beim naechsten Lauf erneut versucht. */
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

module.exports = { deckt: deckt, lokal: lokal, MIN_ABSTAND_MS: MIN_ABSTAND_MS, MIN_ABSTAND_SUCHE_MS: MIN_ABSTAND_SUCHE_MS, SPERRE_WARTEN_MS: SPERRE_WARTEN_MS };
if (require.main === module) main();
