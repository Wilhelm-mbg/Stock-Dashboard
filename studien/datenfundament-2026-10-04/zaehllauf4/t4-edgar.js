'use strict';
/* ZAEHLLAUF 4, Schritt 3 - KOPIE von ../zaehllauf3/t4-edgar.js (Auftrag Nr. 92). Neu gegenueber dem dritten Lauf:
 *  - E6: gibt es zum Kuerzel einen Polygon-Eintrag hoechstens 45 Tage am Anker (Z3.polygonAmAnker), muss auch eine ueber die
 *    Volltextsuche gefundene Firma die Namensprobe gegen den Polygon-Namen bestehen (EDGAR-Name, frueherer Name oder
 *    Kuerzel - Z3.namensprobe); sonst keine Firma. In Durchgang 1 und in Durchgang 2 (dort wird ein durchgefallener Kandidat
 *    uebergangen wie einer, der keinen Grund ergibt).
 *  - Neu gesucht werden NUR die von E6 betroffenen Reihen (Polygon-Eintrag am Anker und Firma aus der Suche im dritten
 *    Lauf); fuer alle anderen gilt die Zuordnung des dritten Laufs unveraendert (z3-edgar-zuordnung.json, nur gelesen).
 *  - Die Einstufung, die ueber Durchgang 2 entscheidet, ist die dieses Ordners OHNE V9 (die Firma haengt nicht am Zwilling).
 *  - Caches: eigener Ordner edgar/ (nicht im Repo); gelesen ausserdem ../zaehllauf3/edgar und die aelteren (nur lesen).
 *  - Obergrenze 500 Anfragen ueber alle Skripte dieses Ordners (edgar-anfragen.json), eine Spur, hoechstens 5 je Sekunde.
 *
 * ZAEHLLAUF 3, Schritt 2 - KOPIE von ../phase2/t4-edgar.js (Auftrag Nr. 90). Fortsetzbar, alles gecacht. Das Original bleibt.
 *
 * Die Wahl des Emittenten (waehle), die Formularliste und die Fenstertage kommen weiter per require aus dem Original vom
 * 12.09. - ebenso die KENNUNG des Abrufs, die nirgends ausgegeben oder gespeichert wird.
 *
 * Was gegenueber der Kopie aus Nr. 86 anders ist:
 *  - V1 (FIRMA MIT NAMENSPROBE, ersetzt R-a): die Polygon-CIK (neue Liste, Eintrag hoechstens 45 Tage am Anker) gilt nur,
 *    wenn der Name, den EDGAR unter ihr fuehrt, ein frueherer Name oder das Kuerzel zum Polygon-Eintrag passt
 *    (Z3.namensprobe). Bei "nichts passt": Volltextsuche wie vor R-a (Durchgang 1 und 2); die verworfene CIK wird nicht
 *    gelesen. ZWEITER REGISTRANT: traegt die Firma der alten Tafel den Polygon-Namen, hat aber eine andere CIK als die
 *    bestimmte Firma, werden beide Auszuege zusammen gelesen (z.zweit; die Vereinigung macht t4-einstufen.js). Findet die
 *    Suche keine Firma, die alte Tafel aber eine mit dem Polygon-Namen, gilt diese (Weg 'alte-tafel-polygon-name').
 *  - ZWEITER DURCHGANG: ein Kandidat gilt, wenn die Einstufung DIESES Ordners mit ihm einen Grund ergibt (ohne Meldungstext:
 *    die Regeln 11 und 13 ergeben auch ohne Text einen Grund, Regel 12 faellt ohne Text auf Regel 13).
 *  - TAKT: EINE Spur; mindestens 220 ms zwischen zwei Anfragen (4,5 je Sekunde - der Auftrag erlaubt hoechstens 5),
 *    mindestens 350 ms vor einer Volltextsuche. Bei HTTP 429/403 zehn Minuten warten, danach doppelter Abstand, dieselbe
 *    Anfrage noch einmal; nach der dritten Sperre Abbruch. OBERGRENZE: 3.000 Anfragen ueber ALLE Skripte dieses Ordners
 *    (edgar-anfragen.json); ist sie erreicht, bricht der Lauf ab.
 *  - hole(url, bisMarke): mit Marke endet das Lesen, sobald sie im Strom steht (texte.js liest so nur das Hauptdokument
 *    einer Einreichung - EINE Anfrage je Meldung statt zwei).
 *  - CACHE in DIESEM Ordner (edgar/, nicht im Repo). Gelesen werden ausserdem - nur lesend - die Caches aus Nr. 86
 *    (../phase2/edgar), Nr. 79 und vom 12.09.; die zwei aelteren nur, wo sie das Fenster nachweislich decken.
 *
 * Aufruf:  node t4-edgar.js [--max N] [--nur REIHE]
 */
var fs = require('fs');
var path = require('path');
var https = require('https');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var E = require('./t4-einstufen.js');
var L = require(path.join(G.GRUENDE, 'edgar-lauf.js'));   // waehle, FORMULARE, VOR_TAGE, NACH_TAGE, Kennung

var MIN_ABSTAND_MS = 220;                                 // 4,5 Anfragen je Sekunde (Auftrag: hoechstens 5)
var MIN_ABSTAND_SUCHE_MS = 350;                           // efts.sec.gov (Volltextsuche)
var SPERRE_WARTEN_MS = 600000;                            // 429/403: zehn Minuten
var MAX_SPERREN = 3;
var MAX_TEXT_BYTES = 6000000;                             // Schutz: ein Hauptdokument ueber 6 MB wird abgeschnitten
var taktFaktor = 1;
var CACHE = path.join(__dirname, 'edgar');
var TICK = path.join(CACHE, 'kuerzel'), TICK2 = path.join(CACHE, 'kuerzel2'), SUB = path.join(CACHE, 'cik');
var NR90 = path.join(Z3.Z3ORDNER, 'edgar');               // Cache des dritten Laufs (nur lesen)
var NR86 = path.join(Z3.P2, 'edgar');                     // Cache des zweiten Laufs (nur lesen)
var NR79 = path.join(G.HIER, 'edgar');                    // Cache des Trockenlaufs Nr. 79 (nur lesen)
var ALT = path.join(G.GRUENDE, 'edgar');                  // Cache vom 12.09.2026 (nur lesen)
var RECENT_GRENZE = 1000;
var ZUORD = path.join(__dirname, 'z4-edgar-zuordnung.json');
var FORTSCHRITT = path.join(__dirname, 'z4-edgar-fortschritt.json');
var ZUORD3 = path.join(Z3.Z3ORDNER, 'z3-edgar-zuordnung.json');   // dritter Lauf (nur lesen)
var OHNE_V9 = Object.assign({}, E.ALLE_AN, { V9: 0 });
/** E6: ist die Reihe betroffen? Polygon-Eintrag am Anker und eine Firma (oder ein erster Durchgang) aus der Volltextsuche. */
function betroffen(R, z3) {
  if (!z3 || !Z3.polygonAmAnker(R)) return false;
  if (z3.weg === 'polygon-cik' || z3.weg === 'alte-tafel-polygon-name') return false;
  return !!(z3.cik || z3.durchgang1);
}
/** E6: besteht der Auszug S die Namensprobe gegen den Polygon-Namen? { ok, probe } */
function e6Probe(S, pa, basis) { var p = Z3.namensprobe(S, pa.name, basis); return { ok: p !== 'nichts' && p !== 'ohne-auszug', probe: p }; }

/* ---------- Takt: eine Spur ---------- */
var letzteAnfrage = 0, kette = Promise.resolve();
function warte(abstand) {
  kette = kette.then(function () {
    var w = Math.max(0, letzteAnfrage + abstand * taktFaktor - Date.now());
    return new Promise(function (ok) { setTimeout(ok, w); });
  }).then(function () { letzteAnfrage = Date.now(); });
  return kette;
}
var Z = { anfragen: 0, fehlversuche: 0, sperren: 0, polygonFirma: 0, probe_passt: 0, probe_frueher: 0, probe_kuerzel: 0, probe_nichts: 0, 'probe_ohne-auszug': 0,
  zweitRegistrant: 0, alteTafelStattSuche: 0, ftsReihen: 0, ftsEigenCache: 0, ftsNr86Cache: 0, ftsNr79Cache: 0, ftsAltCache: 0, ftsNeu: 0,
  fts2EigenCache: 0, fts2Nr86Cache: 0, fts2Nr79Cache: 0, fts2Neu: 0, cikEigenCache: 0, cikNr86Cache: 0, cikNr79Cache: 0, cikAltCache: 0, cikNeu: 0, aeltereDateien: 0, minAbstandGemessenMs: null,
  ftsNr90Cache: 0, fts2Nr90Cache: 0, cikNr90Cache: 0, e6Reihen: 0, e6Probe1: 0, e6Verworfen1: 0, e6Probe2: 0, e6Verworfen2: 0, e6Durchgang2Neu: 0 };
var letzterStart = 0, meldungen = [], gebucht = 0;
var vorher = Z3.anfragenStand().gesamt;                    // Anfragen aller frueheren Laeufe dieses Ordners
function melde(t) { var z = new Date().toISOString() + ' ' + t; meldungen.push(z); console.log(z); }
function buche(skript) { var n = Z.anfragen - gebucht; gebucht = Z.anfragen; return Z3.anfragenBuchen(skript, n, { fehlversuche: Z.fehlversuche, sperren: Z.sperren, minAbstandGemessenMs: Z.minAbstandGemessenMs }); }
function hole(url, bisMarke) {
  var suche = url.indexOf('https://efts.sec.gov/') === 0;
  return warte(suche ? MIN_ABSTAND_SUCHE_MS : MIN_ABSTAND_MS).then(function () {
    return new Promise(function (ok, nein) {
      if (vorher + Z.anfragen >= Z3.MAX_ANFRAGEN) { var g = new Error('Obergrenze von ' + Z3.MAX_ANFRAGEN + ' EDGAR-Anfragen erreicht'); g.grenze = true; return nein(g); }
      var t = Date.now(), fertig = false;
      if (letzterStart) { var d = t - letzterStart; if (Z.minAbstandGemessenMs == null || d < Z.minAbstandGemessenMs) Z.minAbstandGemessenMs = d; }
      letzterStart = t;
      Z.anfragen++;
      var req = https.get(url, { headers: { 'User-Agent': L.UA, 'Accept-Encoding': 'gzip, deflate', 'Accept': bisMarke ? 'text/plain, */*' : 'application/json' } }, function (res) {
        if (res.statusCode === 301 || res.statusCode === 302) { res.resume(); return hole(res.headers.location, bisMarke).then(ok, nein); }
        var strom = res, enc = res.headers['content-encoding'];
        if (enc === 'gzip') strom = res.pipe(require('zlib').createGunzip());
        else if (enc === 'deflate') strom = res.pipe(require('zlib').createInflate());
        var teile = [], laenge = 0, schwanz = '';
        function schluss(gekappt) { if (fertig) return; fertig = true; ok({ code: res.statusCode, text: Buffer.concat(teile).toString('utf8'), gekappt: gekappt ? 1 : 0 }); }
        strom.on('data', function (dd) {
          if (fertig) return;
          teile.push(dd); laenge += dd.length;
          if (!bisMarke) return;
          var s = schwanz + dd.toString('latin1');
          if (s.indexOf(bisMarke) >= 0 || laenge > MAX_TEXT_BYTES) { schluss(laenge > MAX_TEXT_BYTES); req.destroy(); return; }
          schwanz = s.slice(-bisMarke.length);
        });
        strom.on('end', function () { schluss(false); });
        strom.on('error', function (e) { if (!fertig) { fertig = true; nein(e); } });
      });
      req.setTimeout(60000, function () { req.destroy(new Error('Zeit')); });
      req.on('error', function (e) { if (!fertig) { fertig = true; nein(e); } });
    });
  });
}
/** 404 = fehlt; 429/403 = Sperre: zehn Minuten warten, Takt halbieren, dieselbe Anfrage noch einmal (hoechstens
 *  MAX_SPERREN-mal im Lauf, dann Abbruch); sonst bis zu drei Versuche mit Pause; am Ende {fehler}. Liefert {code, text}. */
function holeRoh(url, versuche, bisMarke) {
  versuche = versuche === undefined ? 3 : versuche;
  return hole(url, bisMarke).then(function (r) {
    if (r.code === 404) return { fehlt: true };
    if (r.code === 403 || r.code === 429) {
      Z.sperren++;
      if (Z.sperren > MAX_SPERREN) { var e = new Error('HTTP ' + r.code + ' - Sperre der Quelle zum ' + Z.sperren + '. Mal, Lauf bricht ab'); e.sperre = true; throw e; }
      taktFaktor *= 2;
      melde('SPERRE HTTP ' + r.code + ' (Nr. ' + Z.sperren + ') - zehn Minuten warten, danach Abstand x ' + taktFaktor);
      return new Promise(function (ok) { setTimeout(ok, SPERRE_WARTEN_MS); }).then(function () { return holeRoh(url, versuche, bisMarke); });
    }
    if (r.code !== 200) throw new Error('HTTP ' + r.code);
    return r;
  }).catch(function (e) {
    if (e.sperre || e.grenze) throw e;
    Z.fehlversuche++;
    if (versuche <= 1) return { fehler: String(e.message || e) };
    return new Promise(function (ok) { setTimeout(ok, 2000 * (4 - versuche)); }).then(function () { return holeRoh(url, versuche - 1, bisMarke); });
  });
}
function holeJson(url) {
  return holeRoh(url).then(function (r) {
    if (r.fehlt || r.fehler) return r;
    try { return JSON.parse(r.text); } catch (e) { return { fehler: 'kein JSON' }; }
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
  var n90 = lies(path.join(NR90, unter, name));
  if (n90 && n90.von === von && n90.bis === bis) { if (zweiter) Z.fts2Nr90Cache++; else Z.ftsNr90Cache++; return Promise.resolve(n90); }
  var n86 = lies(path.join(NR86, unter, name));
  if (n86 && n86.von === von && n86.bis === bis) { if (zweiter) Z.fts2Nr86Cache++; else Z.ftsNr86Cache++; return Promise.resolve(n86); }
  var n79 = lies(path.join(NR79, unter, name));
  if (n79 && n79.von === von && n79.bis === bis) { if (zweiter) Z.fts2Nr79Cache++; else Z.ftsNr79Cache++; return Promise.resolve(n79); }
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
/** Deckt ein FREMDER Auszug das Fenster [von, bis]? Rueckgabe { ok, grund }. (wortgleich mit Nr. 79 / Nr. 86) */
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
/** Der Auszug, der fuer dieses Fenster gilt - ohne Netz. { S, woher } oder { S: null, grund }. Der eigene Auszug und der
 *  aus Nr. 86 (beide vom Oktober) gelten, wenn sie bis vor den Fensteranfang reichen; die zwei aelteren nur nach deckt(). */
function lokal(cik, von, bis) {
  var eigen = lies(path.join(SUB, cik + '.json'));
  if (eigen && (eigen.fehlt || eigen.gedecktAb <= von)) return { S: eigen, woher: 'eigen' };
  var n90 = lies(path.join(NR90, 'cik', cik + '.json'));
  if (n90 && (n90.fehlt || n90.gedecktAb <= von)) return { S: n90, woher: 'nr90' };
  var n86 = lies(path.join(NR86, 'cik', cik + '.json'));
  if (n86 && (n86.fehlt || n86.gedecktAb <= von)) return { S: n86, woher: 'nr86' };
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
  if (da.S) { if (da.woher === 'eigen') Z.cikEigenCache++; else if (da.woher === 'nr90') Z.cikNr90Cache++; else if (da.woher === 'nr86') Z.cikNr86Cache++; else if (da.woher === 'nr79') Z.cikNr79Cache++; else Z.cikAltCache++; return Promise.resolve(da.S); }
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
  var V = G.json(path.join(__dirname, 'z4-verschwundene.json'));
  var reihen = V.reihen;
  if (nur) reihen = reihen.filter(function (r) { return r.reihe === nur; });
  if (maxN < reihen.length) reihen = reihen.slice(0, maxN);
  var altZ = fs.existsSync(ZUORD) ? lies(ZUORD) : null;
  var zuord = (altZ && altZ.zuordnung) || null;
  if (!zuord) {                                            // erster Start: die Zuordnung des dritten Laufs fuer alle NICHT betroffenen Reihen
    var z3z = lies(ZUORD3).zuordnung; zuord = {};
    V.reihen.forEach(function (R) { var z3 = z3z[R.reihe]; if (z3 && !betroffen(R, z3)) zuord[R.reihe] = Object.assign({}, z3, { e6betroffen: 0 }); });
  }
  var lauf3 = lies(ZUORD3).zuordnung;
  var summe = (altZ && altZ.summe) || {};                  // Zaehler ueber alle Durchgaenge (der Lauf ist fortsetzbar)
  var karte = {};
  var tk = lies(path.join(ALT, '_company_tickers.json'));  // nur Bestaetigung, nie Quelle (wie im Original)
  if (tk) Object.keys(tk).forEach(function (i) { var e = tk[i]; if (e && e.ticker) karte[String(e.ticker).toUpperCase()] = { cik: String(e.cik_str).padStart(10, '0'), name: e.title }; });
  var tafelAlt = {}; G.json(path.join(G.GRUENDE, 'verschwundene-gruende.json')).reihen.forEach(function (x) { tafelAlt[x.reihe] = x; });   // V1: Firma der alten Tafel
  var hatBalken = E.hatBalkenKarte(), lebendAb = E.ms(V.lebendAb);
  var t0 = Date.now(), fertig = 0, uebersprungen = 0, fehler = [], folgeFehler = 0;

  function sichern(schluss) {
    var s = {}; Object.keys(Z).forEach(function (k) { s[k] = k === 'minAbstandGemessenMs' ? (summe[k] == null ? Z[k] : (Z[k] == null ? summe[k] : Math.min(summe[k], Z[k]))) : (summe[k] || 0) + Z[k]; });
    var o = { stand: new Date().toISOString(), fertig: !!schluss, minAbstandMs: MIN_ABSTAND_MS, minAbstandSucheMs: MIN_ABSTAND_SUCHE_MS, taktFaktor: taktFaktor,
      sekundenDieserLauf: Math.round((Date.now() - t0) / 1000), zaehler: Z, summe: s, fehler: fehler, zuordnung: zuord };
    fs.writeFileSync(ZUORD + '.tmp', JSON.stringify(o)); fs.renameSync(ZUORD + '.tmp', ZUORD);
    var gesamt = buche('t4-edgar.js');
    var f = { stand: o.stand, fertig: !!schluss, reihenGesamt: reihen.length, reihenFertigDieserLauf: fertig, uebersprungen: uebersprungen, zugeordnet: Object.keys(zuord).length,
      anfragen: Z.anfragen, anfragenAlleSkripte: gesamt, fehlversuche: Z.fehlversuche, sperren: Z.sperren, taktFaktor: taktFaktor, offeneFehler: fehler.length, sekunden: o.sekundenDieserLauf,
      minAbstandGemessenMs: Z.minAbstandGemessenMs, meldungen: meldungen.slice(-20) };
    fs.writeFileSync(FORTSCHRITT + '.tmp', JSON.stringify(f, null, 1)); fs.renameSync(FORTSCHRITT + '.tmp', FORTSCHRITT);
  }
  function eine(R) {
    var sym = R.basis.replace(/-/g, '.');                  // EDGAR schreibt BRK.B, das Archiv BRK-B
    var von = G.tagPlus(R.letzterBalken, -L.VOR_TAGE), bis = G.tagPlus(R.letzterBalken, L.NACH_TAGE);
    var pf = R.polygonFirma, a = tafelAlt[R.reihe] || null, z;
    var pa = Z3.polygonAmAnker(R), l3 = lauf3[R.reihe] || null, abgelehnt2 = [];   // E6
    Z.e6Reihen++;
    function ablegen() {
      z.fertig = 1; z.anker = R.letzterBalken; z.e6betroffen = 1; z.e6polygonName = pa ? pa.name : null;
      if (abgelehnt2.length) z.e6abgelehnt2 = abgelehnt2;
      z.lauf3 = l3 ? { cik: l3.cik || null, name: l3.name || null, weg: l3.weg || null } : null;
      zuord[R.reihe] = z; folgeFehler = 0;
    }
    /* V1, zweiter Registrant: die Firma der alten Tafel traegt den Polygon-Namen, hat aber eine andere CIK */
    function zweit() {
      if (!pf || !a || !a.cik || a.cik === z.cik || a.cik === pf.cik || !Z3.nameAehnlich(a.firma, pf.name)) return Promise.resolve();
      return einreichungen(a.cik, von, bis).then(function (S2) {
        if (!S2 || S2.fehlt) return;
        if (!z.cik) { z = { cik: a.cik, name: a.firma, weg: 'alte-tafel-polygon-name', sicherheit: 'stark', durchgang1: { cik: null, weg: z.weg }, namensprobe: z.namensprobe, polygonVerworfen: z.polygonVerworfen }; Z.alteTafelStattSuche++; return; }
        z.zweit = { cik: a.cik, name: a.firma, woher: 'alte-tafel' }; Z.zweitRegistrant++;
      });
    }
    var probe = Promise.resolve(null);
    if (pf && pf.cik) {
      Z.polygonFirma++;
      probe = einreichungen(pf.cik, von, bis).then(function (S) {
        var p = Z3.namensprobe(S, pf.name, R.basis);
        Z['probe_' + p]++;
        if (p === 'nichts' || p === 'ohne-auszug') return { probe: p, edgarName: (S && S.name) || null };
        z = { cik: pf.cik, name: pf.name, weg: 'polygon-cik', sicherheit: 'stark', polygonBis: pf.bis, polygonTage: pf.tage, namensprobe: p };
        return zweit().then(function () { ablegen(); return 'fertig'; });
      });
    }
    return probe.then(function (vp) {
      if (vp === 'fertig') return null;
      Z.ftsReihen++;
      return fts(sym, R.letzterBalken, false).then(function (f) {
        z = L.waehle(f, sym);
        z.ftsTreffer = f.treffer;
        var t = karte[sym] || karte[R.basis];
        z.tickerTabelle = t ? t.cik : null;
        z.tabelleStimmt = t ? (t.cik === z.cik ? 1 : 0) : null;
        return z.cik ? einreichungen(z.cik, von, bis) : null;
      }).then(function (S) {
        if (pa && z.cik) {                                                // E6, Durchgang 1
          var p6 = e6Probe(S, pa, R.basis); Z.e6Probe1++;
          z.e6 = { probe: p6.probe, polygonName: pa.name };
          if (!p6.ok) {
            Z.e6Verworfen1++;
            z = { cik: null, name: null, weg: 'e6-keine-firma', sicherheit: null, ftsTreffer: z.ftsTreffer, e6: { probe: p6.probe, polygonName: pa.name, verworfen: { cik: z.cik, name: (S && S.name) || z.name || null, weg: z.weg } } };
            S = null;
          }
        }
        var u = E.stufeEin(R, z, S, hatBalken, lebendAb, null, OHNE_V9);  // ohne Bigdata, ohne Meldungstext, ohne V9
        if (u.grund !== 'unbekannt') return null;
        if (!(l3 && l3.weg === 'fts2-geprueft') && !(l3 && l3.durchgang1)) Z.e6Durchgang2Neu++;
        /* Durchgang 2: formulargefilterte Suche; von den drei obersten Kandidaten gewinnt der erste, mit dem die
         * Einstufung einen Grund ergibt. */
        return fts(sym, R.letzterBalken, true).then(function (f2) {
          var k = (f2.eimer || []).slice(0, 3), n = 0;
          function weiter() {
            if (n >= k.length) return null;
            var kand = k[n++];
            return einreichungen(kand.cik, von, bis).then(function (S2) {
              if (!S2 || S2.fehlt) return weiter();
              if (pa) {                                                   // E6, Durchgang 2
                var p62 = e6Probe(S2, pa, R.basis); Z.e6Probe2++;
                if (!p62.ok) { Z.e6Verworfen2++; abgelehnt2.push({ cik: kand.cik, name: S2.name || kand.name, probe: p62.probe, platz: n }); return weiter(); }
              }
              var zk = { cik: kand.cik, name: kand.name, weg: 'fts2-geprueft', sicherheit: 'stark', n: kand.n, platz: n };
              if (E.stufeEin(R, zk, S2, hatBalken, lebendAb, null, OHNE_V9).grund !== 'unbekannt') return zk;
              return weiter();
            });
          }
          return weiter();
        });
      }).then(function (treffer) {
        if (treffer) { treffer.durchgang1 = { cik: z.cik || null, weg: z.weg }; if (z.e6) treffer.e6durchgang1 = z.e6; z = treffer; }
        if (vp) { z.namensprobe = vp.probe; z.polygonVerworfen = { cik: pf.cik, name: pf.name, edgarName: vp.edgarName }; }
        return zweit();
      }).then(ablegen);
    });
  }
  var i = 0;
  function naechste() {
    if (i >= reihen.length) return Promise.resolve();
    var R = reihen[i++];
    if (zuord[R.reihe] && zuord[R.reihe].fertig && zuord[R.reihe].anker === R.letzterBalken) { uebersprungen++; return naechste(); }
    return eine(R).then(function () {
      fertig++;
      if (fertig % 200 === 0) { sichern(false); console.log(fertig + '/' + (reihen.length - uebersprungen) + '  Anfragen ' + Z.anfragen + '  Fehlversuche ' + Z.fehlversuche + '  ' + Math.round((Date.now() - t0) / 1000) + 's'); }
    }, function (e) {
      /* Nichts eintragen: ein Fehlschlag bleibt offen und wird beim naechsten Lauf erneut versucht. */
      console.error('FEHLER ' + R.reihe + ': ' + e.message);
      fehler.push({ reihe: R.reihe, meldung: String(e.message).slice(0, 160) });
      if (e.sperre || e.grenze || ++folgeFehler >= 8) { var ab = new Error('Abbruch: ' + (e.sperre ? 'Sperre der Quelle' : e.grenze ? 'Obergrenze der Anfragen' : 'acht Fehler in Folge')); ab.abbruch = true; throw ab; }
    }).then(naechste);
  }
  naechste().then(function () {
    sichern(true);
    console.log('FERTIG  Reihen ' + fertig + ' (uebersprungen ' + uebersprungen + ')  Anfragen ' + Z.anfragen + '  Fehlversuche ' + Z.fehlversuche + '  offen ' + fehler.length + '  ' + Math.round((Date.now() - t0) / 1000) + 's');
    console.log(JSON.stringify(Z));
  }, function (e) { sichern(false); console.error('ABBRUCH', e.message); process.exit(1); });
}

module.exports = { betroffen: betroffen, e6Probe: e6Probe, deckt: deckt, lokal: lokal, holeRoh: holeRoh, buche: buche, zaehler: Z, MIN_ABSTAND_MS: MIN_ABSTAND_MS, MIN_ABSTAND_SUCHE_MS: MIN_ABSTAND_SUCHE_MS, SPERRE_WARTEN_MS: SPERRE_WARTEN_MS, MAX_SPERREN: MAX_SPERREN };
if (require.main === module) main();
