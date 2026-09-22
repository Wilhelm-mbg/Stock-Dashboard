'use strict';
/* Datenbau (Auftrag Nr. 47) zur registrierten Stimmungsstudie `nachrichten-stimmung-tage-2026-09-19/v1`, §2/§3/§9.
 * Kopie von studien/gdelt-abdeckung-2026-09-19/gkg-zaehlen.js (Nr. 44, dort unveraendert), erweitert um:
 *  - Zuordnung nach dem ET-KALENDERTAG (nicht nach dem UTC-Datum des Dateinamens). Die Umrechnung UTC -> ET kommt aus
 *    EINER Stelle: signal.js -> stempelET (dieselbe Definition wie in der Messung; hier nicht neu geschrieben).
 *  - Stempel je Artikel aus der Spalte V2.1DATE (Index 1, YYYYMMDDHHMMSS UTC); nur wenn sie kein 14-stelliger Stempel ist
 *    (Codebook: 0 fuer unbekannte Quellen), gilt der Dateistempel - gezaehlt als `stempelAusDatei`.
 *  - je Symbol und ET-Tag D: `n` / `ton` (Artikel mit ET-Uhrzeit <= SCHNITT_ET = 16:00:00), `nSpaet`, `tonAlle`,
 *    `letzterStempel` (spaetester UTC-Stempel unter den `n` Artikeln, null bei n = 0 - der Beleg fuer die Leck-Pruefung);
 *    je Tag `soll` (92/96/100 Viertelstunden, Umstelltage!), `dateien` (gefunden), `fehlend` (UTC-Stempel der 404-Dateien).
 *  - nur Stufe "voll" (Stufe "kurz" ist untauglich, ABDECKUNG.md §f).
 *  - Stichprobe fuer die Handpruefung (§9 Risiko 2): Prioritaets-Reservoir je Tag und Klasse, u aus fnv1a(GKGRECORDID|Symbol)
 *    statt Math.random - der Lauf ist damit deterministisch (bytegleich wiederholbar).
 * Der Datenbau entscheidet NICHTS ueber Signale (keine 3-Artikel-Schwelle, kein Ausfalltag) - das tut signal.js in der Messung.
 * Er prueft aber je Tag seine eigene Invariante (pruefeTag): jeder `letzterStempel` liegt am ET-Tag D und <= 16:00:00 ET;
 * sonst wirft er und der Teil steht (Klinke).
 *
 * Datei-Menge des ET-Tags D: alle 15-min-Stempel (UTC), deren ET-Kalendertag D ist - 96, am Maerz-Umstelltag 92, im
 * November 100. Ein Artikel, dessen DATE-Stempel an einem ANDEREN ET-Tag liegt, wird in D nicht gezaehlt (`fremderTag`).
 *
 * Fortsetzbar je Tag: <aus>/tage/<YYYY-MM-DD>.json (atomar) + <aus>/_fortschritt-<k>.json; Log <aus>/log-<k>.txt.
 * Aufruf:  node gkg-tage.js --von 2017-01-01 --bis 2026-08-31 --teil 3/12 --aus /pfad
 *          node gkg-tage.js --tag 2025-06-02 --aus /pfad                (ein ET-Tag)
 *          node gkg-tage.js --utcTag 2025-06-02 --aus /pfad             (Kontrolle: die 96 Dateien des UTC-Tags, alle
 *                                                                        ET-Tage getrennt -> <aus>/kontrolle-utc-<tag>.json)
 * Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var zlib = require('zlib');
var N = require(path.join(__dirname, '..', '..', 'gdelt-abdeckung-2026-09-19', 'namen.js'));
var S = require(path.join(__dirname, '..', 'signal.js'));
var KONST = require(path.join(__dirname, '..', 'konstanten.js'));

var HIER = __dirname;
var KENNUNG = 'nachrichten-stimmung-tage-2026-09-19/gdelt/v1';
var KARTE_DATEI = path.join(HIER, 'namenskarte-v2.json');
var UA = 'Markt-Dashboard Studie (wilhelm.gms@gmail.com)';
var ABSTAND_MS = 200;
var MAX_BYTES = 200 * 1024 * 1024;
var RESERVOIR = 10;
var SCHNITT = KONST.SCHNITT_ET;
var SPALTEN = 27, SP_ID = 0, SP_DATUM = 1, SP_QUELLE = 3, SP_DOK = 4, SP_ORG = 14, SP_TON = 15;

function argumente(a) {
  var o = {};
  for (var i = 0; i < a.length; i++) { if (a[i].slice(0, 2) === '--') { var k = a[i].slice(2); if (i + 1 < a.length && a[i + 1].slice(0, 2) !== '--') { o[k] = a[++i]; } else o[k] = true; } }
  return o;
}

/* ---------- Karte v2: normalisierter Name -> Symbole (nur "voll") ---------- */
function ladeKarte(datei) {
  var j = JSON.parse(fs.readFileSync(datei || KARTE_DATEI, 'utf8'));
  return karteAus(j);
}
function karteAus(j) {
  var voll = {}, klasse = {};
  Object.keys(j.karte).forEach(function (s) {
    var k = j.karte[s];
    klasse[s] = k.klasse || 0;
    [k.voll, k.voll2].forEach(function (v) { if (v && (voll[v] = voll[v] || []).indexOf(s) < 0) voll[v].push(s); });
  });
  return { kennung: j.kennung, voll: voll, klasse: klasse, symbole: Object.keys(j.karte).length };
}

/* ---------- Zip (unveraendert aus Nr. 44) ---------- */
function entpacke(buf) {
  var e = -1;
  for (var i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { e = i; break; }
  if (e < 0) throw new Error('kein Zip-Endverzeichnis');
  var cd = buf.readUInt32LE(e + 16);
  if (buf.readUInt32LE(cd) !== 0x02014b50) throw new Error('kein Zentralverzeichnis');
  var methode = buf.readUInt16LE(cd + 10), csize = buf.readUInt32LE(cd + 20), lokal = buf.readUInt32LE(cd + 42);
  if (buf.readUInt32LE(lokal) !== 0x04034b50) throw new Error('kein lokaler Kopf');
  var start = lokal + 30 + buf.readUInt16LE(lokal + 26) + buf.readUInt16LE(lokal + 28);
  var roh = buf.subarray(start, start + csize);
  if (methode === 8) return zlib.inflateRawSync(roh);
  if (methode === 0) return roh;
  throw new Error('Zip-Methode ' + methode);
}

/* ---------- Abruf (unveraendert aus Nr. 44) ---------- */
function hole(url, versuche, sprung) {
  sprung = sprung || 0;
  return new Promise(function (ok, nein) {
    var req = (url.slice(0, 5) === 'https' ? https : http).get(url, { headers: { 'User-Agent': UA } }, function (res) {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && sprung < 3 && /^https?:\/\/data\.gdeltproject\.org(:\d+)?\//.test(res.headers.location)) {
        res.resume(); return ok(hole(res.headers.location, versuche, sprung + 1));
      }
      if (res.statusCode !== 200) { res.resume(); return ok({ status: res.statusCode, buf: null }); }
      var len = parseInt(res.headers['content-length'] || '0', 10);
      if (len > MAX_BYTES) { res.destroy(); return ok({ status: 'zu gross ' + len, buf: null }); }
      var teile = [], n = 0;
      res.on('data', function (d) { n += d.length; if (n > MAX_BYTES) { res.destroy(new Error('zu gross')); return; } teile.push(d); });
      res.on('end', function () { ok({ status: 200, buf: Buffer.concat(teile) }); });
      res.on('error', nein);
    });
    req.setTimeout(120000, function () { req.destroy(new Error('Zeit')); });
    req.on('error', nein);
  }).catch(function (err) {
    if (versuche > 0) return new Promise(function (ok) { setTimeout(ok, 3000); }).then(function () { return hole(url, versuche - 1); });
    return { status: 'fehler ' + err.message, buf: null };
  });
}

/* ---------- Zeit ---------- */
function utcStempel(ms) { return new Date(ms).toISOString().replace(/[-:T]/g, '').slice(0, 14); }
/** Die 15-min-Dateistempel (UTC), deren ET-Kalendertag `tag` ist: 96, am Maerz-Umstelltag 92, im November 100. */
function stempelDesETTages(tag) {
  var t0 = Date.parse(tag + 'T00:00:00Z'), l = [];
  for (var q = 0; q < 2 * 96; q++) { var s = utcStempel(t0 + q * 900000); if (S.stempelET(s).iso === tag) l.push(s); }
  return l;
}
/** Die 96 Dateistempel des UTC-Tags (Datei-Menge von Nr. 44; nur fuer die Kontrolle). */
function stempelDesUTCTages(tag) {
  var t0 = Date.parse(tag + 'T00:00:00Z'), l = [];
  for (var q = 0; q < 96; q++) l.push(utcStempel(t0 + q * 900000));
  return l;
}
var ET_CACHE = {};
function et(stempel) { var e = ET_CACHE[stempel]; if (!e) { if (Object.keys(ET_CACHE).length > 5000) ET_CACHE = {}; e = ET_CACHE[stempel] = S.stempelET(stempel); } return e; }

/* fnv1a 32 Bit -> u in [0,1): deterministische Prioritaet fuer das Reservoir. */
function fnvU(s) { var h = 0x811c9dc5; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; } return h / 4294967296; }

/* ---------- Zaehlen einer Datei ----------
 * B: { <ET-Tag>: { symbole: { SYM: { n, s, nSpaet, sAlle, letzter } }, stich: { <klasse>: [..] } } }
 * Jeder Artikel landet GENAU in seinem ET-Tag; innerhalb des Tages je Symbol hoechstens einmal. */
function zaehleText(txt, karte, dateiStempel, B, zaehler, groesse) {
  groesse = groesse || RESERVOIR;
  var zeilen = txt.split('\n');
  for (var i = 0; i < zeilen.length; i++) {
    var z = zeilen[i]; if (!z) continue;
    if (z.charCodeAt(z.length - 1) === 13) z = z.slice(0, -1);
    var c = z.split('\t');
    zaehler.zeilen++;
    if (c.length !== SPALTEN) { zaehler.falscheFeldzahl++; continue; }
    var org = c[SP_ORG]; if (!org) continue;
    zaehler.mitOrganisation++;
    var ton = parseFloat(c[SP_TON].split(',')[0]); if (ton !== ton) { zaehler.ohneTon++; continue; }
    var e = org.split(';'), gesehen = {}, treffer = null;
    for (var j = 0; j < e.length; j++) {
      var s = e[j], p = s.lastIndexOf(',');
      var nm = N.normalisieren(p >= 0 ? s.slice(0, p) : s);
      if (!nm || gesehen[nm]) continue;
      gesehen[nm] = 1;
      var lv = karte.voll[nm];
      if (lv) { treffer = treffer || {}; for (var a = 0; a < lv.length; a++) if (!treffer[lv[a]]) treffer[lv[a]] = s; }
    }
    if (!treffer) continue;
    var st = c[SP_DATUM];
    if (!/^\d{14}$/.test(st)) { st = dateiStempel; zaehler.stempelAusDatei++; }
    else if (st !== dateiStempel) zaehler.stempelUngleichDatei++;
    var e2 = et(st), spaet = e2.uhr > SCHNITT;
    var tagB = B[e2.iso] || (B[e2.iso] = { symbole: {}, stich: {} });
    var uebersetzt = /-T\d+$/.test(c[SP_ID]);
    Object.keys(treffer).forEach(function (sym) {
      var q = tagB.symbole[sym] || (tagB.symbole[sym] = { n: 0, s: 0, nSpaet: 0, sAlle: 0, letzter: null });
      q.sAlle += ton;
      if (spaet) q.nSpaet++;
      else { q.n++; q.s += ton; if (q.letzter === null || st > q.letzter) q.letzter = st; }
      zaehler.treffer++; if (spaet) zaehler.trefferSpaet++; if (uebersetzt) zaehler.trefferUebersetzt++;
      var kl = karte.klasse[sym] || 0, u = fnvU(c[SP_ID] + '|' + sym), r = tagB.stich[kl] || (tagB.stich[kl] = []);
      if (r.length < groesse || u < r[r.length - 1].u) {
        r.push({ u: u, sym: sym, stempel: st, spaet: spaet, org: treffer[sym], quelle: c[SP_QUELLE], dok: c[SP_DOK], ton: +ton.toFixed(3), id: c[SP_ID] });
        r.sort(function (x, y) { return x.u - y.u || (x.id < y.id ? -1 : x.id > y.id ? 1 : 0); });
        if (r.length > groesse) r.length = groesse;
      }
    });
  }
}

/** Ablageform eines Tages-Eimers: je Symbol ton, n, nSpaet, tonAlle, letzterStempel (Symbole sortiert). */
function symboleAblage(eimer) {
  var aus = {};
  Object.keys(eimer.symbole).sort().forEach(function (sym) {
    var q = eimer.symbole[sym], ges = q.n + q.nSpaet;
    aus[sym] = { ton: q.n ? q.s / q.n : null, n: q.n, nSpaet: q.nSpaet, tonAlle: ges ? q.sAlle / ges : null, letzterStempel: q.letzter };
  });
  return aus;
}

/** Invariante je Tag (Klinke des Datenbaus): jeder letzterStempel liegt am ET-Tag und <= 16:00:00 ET; n = 0 <=> null. */
function pruefeTag(erg) {
  Object.keys(erg.symbole).forEach(function (sym) {
    var q = erg.symbole[sym];
    if (!(q.n >= 0 && q.nSpaet >= 0 && q.n + q.nSpaet > 0)) throw new Error('Datenbau-Klinke: ' + sym + ' ohne Artikel am ' + erg.tag);
    if (q.n === 0) { if (q.letzterStempel !== null || q.ton !== null) throw new Error('Datenbau-Klinke: ' + sym + ' n=0 mit Stempel/Ton am ' + erg.tag); return; }
    var e = S.stempelET(q.letzterStempel);
    if (e.iso !== erg.tag || e.uhr > SCHNITT) throw new Error('Leck im Datenbau: ' + sym + ' letzterStempel ' + q.letzterStempel + ' (ET ' + e.iso + ' ' + e.uhr + ') gehoert nicht vor ' + SCHNITT + ' ET am ' + erg.tag);
  });
  return true;
}

function warte(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
function neueZaehler(soll) {
  return { soll: soll, gefunden: 0, fehlend: 0, fehler: [], fehlendStempel: [], bytesZip: 0, bytesCsv: 0, zeilen: 0, falscheFeldzahl: 0, mitOrganisation: 0, ohneTon: 0,
    stempelAusDatei: 0, stempelUngleichDatei: 0, treffer: 0, trefferSpaet: 0, trefferUebersetzt: 0, fremderTag: 0 };
}

/** Holt und zaehlt eine Liste von Dateistempeln; Rueckgabe { B, zaehler }. */
async function zaehleDateien(stempel, karte, opt, log) {
  var B = {}, zaehler = neueZaehler(stempel.length);
  for (var i = 0; i < stempel.length; i++) {
    var st = stempel[i], url = 'http://data.gdeltproject.org/gdeltv2/' + st + '.gkg.csv.zip';
    var t1 = Date.now();
    var r = await hole(url, 2);
    if (r.status === 404) { zaehler.fehlend++; zaehler.fehlendStempel.push(st); }
    else if (r.status !== 200) { zaehler.fehler.push(st + ':' + r.status); }
    else {
      zaehler.gefunden++; zaehler.bytesZip += r.buf.length;
      try {
        var csv = entpacke(r.buf); zaehler.bytesCsv += csv.length;
        zaehleText(csv.toString('utf8'), karte, st, B, zaehler, opt.reservoir);
        csv = null;
      } catch (e) { zaehler.fehler.push(st + ':' + e.message); }
      r.buf = null;
    }
    opt.dateienGesamt++;
    if (opt.dateienGesamt % 100 === 0) log('  fortschritt ' + opt.dateienGesamt + ' dateien, zuletzt ' + st + ', ' + ((Date.now() - opt.start) / 1000).toFixed(0) + ' s');
    var rest = ABSTAND_MS - (Date.now() - t1); if (rest > 0) await warte(rest);
  }
  return { B: B, zaehler: zaehler };
}

/** Ein ET-Tag: Datei-Menge des ET-Tags, Ablage nur des Eimers D; Artikel fremder ET-Tage werden gezaehlt, nicht abgelegt. */
async function zaehleETTag(tag, karte, opt, log) {
  var t0 = Date.now();
  var r = await zaehleDateien(stempelDesETTages(tag), karte, opt, log), z = r.zaehler;
  Object.keys(r.B).forEach(function (d) { if (d !== tag) Object.keys(r.B[d].symbole).forEach(function (sym) { var q = r.B[d].symbole[sym]; z.fremderTag += q.n + q.nSpaet; }); });
  var eimer = r.B[tag] || { symbole: {}, stich: {} };
  var erg = { kennung: KENNUNG, karte: karte.kennung, tag: tag, soll: z.soll, dateien: z.gefunden, fehlend: z.fehlendStempel,
    dauerS: +((Date.now() - t0) / 1000).toFixed(1), zaehler: z, symbole: symboleAblage(eimer), stichprobe: eimer.stich };
  pruefeTag(erg);
  return erg;
}

function tageVonBis(von, bis) {
  var l = [], d = new Date(von + 'T00:00:00Z'), e = new Date(bis + 'T00:00:00Z');
  for (; d <= e; d = new Date(d.getTime() + 86400000)) l.push(d.toISOString().slice(0, 10));
  return l;
}
function schreibeAtomar(p, obj) { fs.writeFileSync(p + '.tmp', JSON.stringify(obj)); fs.renameSync(p + '.tmp', p); }

async function haupt() {
  var a = argumente(process.argv.slice(2));
  if (!a.aus) throw new Error('--aus <Ordner> fehlt');
  var aus = path.resolve(a.aus);
  var karte = ladeKarte(a.karte ? path.resolve(a.karte) : null);
  var opt = { reservoir: parseInt(a.reservoir, 10) || RESERVOIR, dateienGesamt: 0, start: Date.now() };
  fs.mkdirSync(path.join(aus, 'tage'), { recursive: true });

  if (a.utcTag) {
    var logK = function (s) { process.stdout.write(new Date().toISOString().slice(11, 19) + ' ' + s + '\n'); };
    var r = await zaehleDateien(stempelDesUTCTages(a.utcTag), karte, opt, logK);
    var eimer = {}; Object.keys(r.B).sort().forEach(function (d) { eimer[d] = symboleAblage(r.B[d]); });
    schreibeAtomar(path.join(aus, 'kontrolle-utc-' + a.utcTag + '.json'), { kennung: KENNUNG, karte: karte.kennung, utcTag: a.utcTag, dauerS: +((Date.now() - opt.start) / 1000).toFixed(1), zaehler: r.zaehler, eimer: eimer });
    logK('KONTROLLE utc ' + a.utcTag + ' dateien=' + r.zaehler.gefunden + ' treffer=' + r.zaehler.treffer + ' et-tage=' + Object.keys(eimer).join(',') + ' ' + ((Date.now() - opt.start) / 1000).toFixed(1) + ' s');
    return;
  }

  var tage = a.tag ? [a.tag] : tageVonBis(a.von, a.bis);
  var teil = String(a.teil || '1/1').split('/'), k = parseInt(teil[0], 10), n = parseInt(teil[1], 10);
  if (!(k >= 1 && n >= 1 && k <= n)) throw new Error('--teil k/n');
  tage = tage.filter(function (t, i) { return i % n === k - 1; });
  /* Fortschritt je Teilung n und Teil k: wird die Parallelitaet geaendert (alle Teile anhalten, mit neuem n starten), gilt
   * ein Tag als erledigt, wenn seine Tagesdatei vollstaendig ist (gefunden + fehlend = soll) - gleich, welcher Teil sie schrieb. */
  var fortP = path.join(aus, '_fortschritt-' + n + '-' + k + '.json');
  var fort = fs.existsSync(fortP) ? JSON.parse(fs.readFileSync(fortP, 'utf8')) : { kennung: KENNUNG, karte: karte.kennung, teil: k + '/' + n, von: tage[0], bis: tage[tage.length - 1], start: new Date().toISOString(), erledigtTage: {} };
  if (fort.teil !== k + '/' + n || fort.karte !== karte.kennung) throw new Error('Fortschritt passt nicht: ' + fort.teil + ' ' + fort.karte);
  var logP = path.join(aus, 'log-' + k + '.txt');
  function log(s) { var zl = new Date().toISOString().slice(0, 19) + ' ' + s + '\n'; fs.appendFileSync(logP, zl); process.stdout.write(zl); }
  log('START ' + KENNUNG + ' teil ' + k + '/' + n + ' tage=' + tage.length + ' erledigt=' + Object.keys(fort.erledigtTage).length + ' symbole=' + karte.symbole + ' vollNamen=' + Object.keys(karte.voll).length + ' karte=' + karte.kennung + ' node=' + process.version);
  for (var i = 0; i < tage.length; i++) {
    var tag = tage[i], tagP = path.join(aus, 'tage', tag + '.json');
    if (fort.erledigtTage[tag] && fs.existsSync(tagP)) continue;
    if (fs.existsSync(tagP)) {
      var alt = JSON.parse(fs.readFileSync(tagP, 'utf8')).zaehler;
      if (alt.gefunden + alt.fehlend === alt.soll) { fort.erledigtTage[tag] = { dateien: alt.gefunden, fehlend: alt.fehlend, soll: alt.soll, vorher: true }; schreibeAtomar(fortP, fort); continue; }
    }
    var erg = await zaehleETTag(tag, karte, opt, log);
    schreibeAtomar(tagP, erg);
    var z = erg.zaehler;
    /* ERLEDIGT nur, wenn jede Datei gezaehlt oder als 404 bestaetigt ist; Netz-/HTTP-Fehler bleiben offen (Neustart wiederholt). */
    if (z.gefunden + z.fehlend === z.soll) { fort.erledigtTage[tag] = { dateien: z.gefunden, fehlend: z.fehlend, soll: z.soll }; if (fort.offeneTage) delete fort.offeneTage[tag]; }
    else { fort.offeneTage = fort.offeneTage || {}; fort.offeneTage[tag] = { dateien: z.gefunden, fehlend: z.fehlend, fehler: z.fehler.length }; }
    fort.stand = new Date().toISOString();
    schreibeAtomar(fortP, fort);
    log(tag + ' dateien=' + z.gefunden + '/' + z.soll + ' fehlend=' + z.fehlend + (z.fehlend ? '(' + z.fehlendStempel.slice(0, 8).map(function (s) { return s.slice(8, 12); }).join(' ') + ')' : '') + ' fehler=' + z.fehler.length + (z.fehler.length ? '(' + z.fehler.slice(0, 3).join(' ') + ')' : '') + ' zeilen=' + z.zeilen + ' treffer=' + z.treffer + ' spaet=' + z.trefferSpaet + ' fremd=' + z.fremderTag + ' symbole=' + Object.keys(erg.symbole).length + ' zip=' + (z.bytesZip / 1048576).toFixed(0) + 'MB dauer=' + erg.dauerS + 's');
  }
  log('ENDE teil ' + k + '/' + n + ' tage=' + tage.length + ' dateien=' + opt.dateienGesamt + ' ' + ((Date.now() - opt.start) / 1000).toFixed(0) + ' s');
}

module.exports = { KENNUNG: KENNUNG, entpacke: entpacke, zaehleText: zaehleText, karteAus: karteAus, ladeKarte: ladeKarte, symboleAblage: symboleAblage, pruefeTag: pruefeTag,
  stempelDesETTages: stempelDesETTages, stempelDesUTCTages: stempelDesUTCTages, tageVonBis: tageVonBis, neueZaehler: neueZaehler, fnvU: fnvU,
  SPALTEN: SPALTEN, SP_DATUM: SP_DATUM, SP_ORG: SP_ORG, SP_TON: SP_TON, SCHNITT: SCHNITT };
if (require.main === module) haupt().catch(function (e) { process.stderr.write('ABBRUCH ' + (e.stack || e) + '\n'); process.exit(/Leck|Klinke/.test(String(e && e.message)) ? 3 : 1); });   // 3 = Klinke: systemd startet nicht neu
