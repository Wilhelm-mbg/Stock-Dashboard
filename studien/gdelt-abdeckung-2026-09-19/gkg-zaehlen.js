'use strict';
/* Baustein 2 (Auftrag Nr. 44): GDELT-GKG-2.1-Dateien im FLUSS zaehlen - laden, entpacken, zaehlen, vergessen.
 *
 * Je 15-Minuten-Datei (http://data.gdeltproject.org/gdeltv2/YYYYMMDDHHMMSS.gkg.csv.zip): Zeilen tab-getrennt, 27 Spalten
 * (lesenotizen-codebook.md §1). Spalte 15 V2ENHANCEDORGANIZATIONS ("Name,Offset;Name,Offset"), Spalte 16 V1.5TONE
 * ("Ton,Positiv,Negativ,Polaritaet,ARD,SGRD,Wortzahl"), Spalte 4 SourceCommonName, Spalte 5 DocumentIdentifier,
 * Spalte 1 GKGRECORDID (-T = maschinell uebersetzt). Warum Spalte 15 und nicht 14 (V1ORGANIZATIONS): dieselben Namen, aber
 * mit Zeichen-Offset je Nennung - der Offset ist das Pruefmerkmal der Spaltenprobe (test.js) und spaeter der Ort der
 * ersten Nennung; Spalte 14 ist die dedupliziert Liste ohne Offset.
 *
 * Zwei Strenge-Stufen, getrennt gezaehlt: "voll" (normalisierter Organisationstext == normalisierter Firmenname der Karte,
 * voll oder voll2) und "kurz" (== Kurzform der Karte). Ein Artikel zaehlt je Symbol und Stufe hoechstens einmal.
 * Zaehler je Symbol x Tag x Stufe: Artikel, Summe Ton, Quadratsumme Ton, Anzahl Ton < 0, davon uebersetzt.
 * Stichprobe je Tag und Stufe: bis 34 Treffer per Prioritaets-Reservoir (jeder Treffer zieht u ~ U(0,1), die 34 kleinsten
 * bleiben) - die Vereinigung ueber Tage/Teile mit denselben 34 kleinsten u ist wieder eine gleichverteilte Stichprobe
 * des Monats (auswerten.js). Kein Modell bewertet Text.
 *
 * Fortsetzbar je Tag: voll/tage/<YYYY-MM-DD>.json (klein) + voll/_fortschritt-<k>.json (atomar). Log je Teil
 * voll/log-<k>.txt: eine Zeile je Tag (Dateien gefunden/fehlend, fehlende Uhrzeiten, Treffer), Fortschritt alle 100 Dateien.
 * Fehler (HTTP != 200, fehlende Dateien) werden gezaehlt, nie abgebrochen. Hoeflich: >= 200 ms zwischen Dateien.
 *
 * Aufruf:  node gkg-zaehlen.js --von 2025-01-01 --bis 2025-12-31 --teil 1/4 [--aus voll] [--ohneKurz 12] [--probe]
 *          --tag 2025-06-02 (ein Tag, Vorlauf)   --ohneKurz: Klassen (Ziffern ohne Komma - cmd trennt am Komma), fuer die
 *          die Stufe "kurz" nicht gezaehlt wird.   --probe: legt zusaetzlich die erste Datei unter voll/probe.gkg.csv.zip ab.
 * Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var http = require('http');
var https = require('https');
var zlib = require('zlib');
var N = require('./namen.js');

var HIER = __dirname;
var KENNUNG = 'gdelt-abdeckung-2026-09-19/zaehlen/v1';
var UA = 'Markt-Dashboard Studie (wilhelm.gms@gmail.com)';
var ABSTAND_MS = 200;
var MAX_BYTES = 200 * 1024 * 1024;
var RESERVOIR = 34;
var SPALTEN = 27, SP_ID = 0, SP_QUELLE = 3, SP_DOK = 4, SP_ORG = 14, SP_TON = 15;

/* ---------- Argumente ---------- */
function argumente(a) {
  var o = {};
  for (var i = 0; i < a.length; i++) { if (a[i].slice(0, 2) === '--') { var k = a[i].slice(2); if (i + 1 < a.length && a[i + 1].slice(0, 2) !== '--') { o[k] = a[++i]; } else o[k] = true; } }
  return o;
}

/* ---------- Karte laden: normalisierter Name -> Symbole ---------- */
function ladeKarte(ohneKurz) {
  var j = JSON.parse(fs.readFileSync(path.join(HIER, 'namenskarte.json'), 'utf8'));
  var voll = {}, kurz = {}, klasse = {};
  Object.keys(j.karte).forEach(function (s) {
    var k = j.karte[s];
    klasse[s] = { k2025: k.klasse2025, k2018: k.klasse2018 };
    [k.voll, k.voll2].forEach(function (v) { if (v) (voll[v] = voll[v] || []).push(s); });
    var kl = k.klasse2025 || k.klasse2018;
    if (k.kurz && ohneKurz.indexOf(String(kl)) < 0) (kurz[k.kurz] = kurz[k.kurz] || []).push(s);
  });
  return { kennung: j.kennung, voll: voll, kurz: kurz, klasse: klasse, symbole: Object.keys(j.karte).length };
}

/* ---------- Zip: eine Datei im Archiv, Deflate oder gespeichert ---------- */
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

/* ---------- Abruf ---------- */
/* http:// antwortet 301 auf https:// (Probe 19.09.2026) - Weiterleitungen werden bis 3 Stufen gefolgt, nur auf data.gdeltproject.org. */
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

/* ---------- Zaehlen einer Datei ---------- */
function zaehleText(txt, karte, tag, Z, stich, zaehler) {
  var zeilen = txt.split('\n');
  for (var i = 0; i < zeilen.length; i++) {
    var z = zeilen[i]; if (!z) continue;
    if (z.charCodeAt(z.length - 1) === 13) z = z.slice(0, -1);
    var c = z.split('\t');
    zaehler.zeilen++;
    if (c.length !== SPALTEN) { zaehler.falscheFeldzahl++; continue; }
    var org = c[SP_ORG]; if (!org) continue;
    zaehler.mitOrganisation++;
    var uebersetzt = /-T\d+$/.test(c[SP_ID]);
    var ton = parseFloat(c[SP_TON].split(',')[0]); if (ton !== ton) { zaehler.ohneTon++; continue; }
    var e = org.split(';'), gesehen = {}, treffer = null;
    for (var j = 0; j < e.length; j++) {
      var s = e[j], p = s.lastIndexOf(',');
      var nm = N.normalisieren(p >= 0 ? s.slice(0, p) : s);
      if (!nm || gesehen[nm]) continue;
      gesehen[nm] = 1;
      var lv = karte.voll[nm], lk = karte.kurz[nm];
      if (lv) { treffer = treffer || {}; for (var a = 0; a < lv.length; a++) treffer[lv[a] + '\tvoll'] = s; }
      if (lk) { treffer = treffer || {}; for (var b = 0; b < lk.length; b++) treffer[lk[b] + '\tkurz'] = s; }
    }
    if (!treffer) continue;
    Object.keys(treffer).forEach(function (key) {
      var t = key.split('\t'), sym = t[0], stufe = t[1];
      var sz = Z[sym] || (Z[sym] = { voll: [0, 0, 0, 0, 0], kurz: [0, 0, 0, 0, 0] });
      var q = sz[stufe]; q[0]++; q[1] += ton; q[2] += ton * ton; if (ton < 0) q[3]++; if (uebersetzt) q[4]++;
      zaehler.treffer[stufe]++;
      /* Prioritaets-Reservoir je Stufe UND Klasse (2025, sonst 2018): u ~ U(0,1), die `groesse` kleinsten bleiben. */
      var kl = karte.klasse[sym] ? (karte.klasse[sym].k2025 || karte.klasse[sym].k2018) : 0;
      var u = Math.random(), r = stich[stufe][kl] || (stich[stufe][kl] = []), groesse = stich.groesse || RESERVOIR;
      if (r.length < groesse || u < r[r.length - 1].u) {
        r.push({ u: u, sym: sym, klasse: kl, tag: tag, stufe: stufe, org: treffer[key], quelle: c[SP_QUELLE], dok: c[SP_DOK], ton: +ton.toFixed(3), uebersetzt: uebersetzt });
        r.sort(function (x, y) { return x.u - y.u; });
        if (r.length > groesse) r.length = groesse;
      }
    });
  }
}

/* ---------- Ein Tag ---------- */
function stempelDesTages(tag) {
  var d = tag.replace(/-/g, ''), l = [];
  for (var h = 0; h < 24; h++) for (var m = 0; m < 60; m += 15) l.push(d + (h < 10 ? '0' : '') + h + (m < 10 ? '0' : '') + m + '00');
  return l;
}
function warte(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

async function zaehleTag(tag, karte, opt, log) {
  var t0 = Date.now();
  var Z = {}, stich = { voll: {}, kurz: {}, groesse: opt.reservoir || RESERVOIR };
  var zaehler = { dateien: 96, gefunden: 0, fehlend: 0, fehler: [], fehlendUhrzeiten: [], bytesZip: 0, bytesCsv: 0, zeilen: 0, falscheFeldzahl: 0, mitOrganisation: 0, ohneTon: 0, treffer: { voll: 0, kurz: 0 } };
  var stempel = stempelDesTages(tag);
  for (var i = 0; i < stempel.length; i++) {
    var st = stempel[i], url = 'http://data.gdeltproject.org/gdeltv2/' + st + '.gkg.csv.zip';
    var t1 = Date.now();
    var r = await hole(url, 2);
    if (r.status === 404) { zaehler.fehlend++; zaehler.fehlendUhrzeiten.push(st.slice(8, 12)); }
    else if (r.status !== 200) { zaehler.fehler.push(st.slice(8, 12) + ':' + r.status); }
    else {
      zaehler.gefunden++; zaehler.bytesZip += r.buf.length;
      try {
        if (opt.probe && !fs.existsSync(path.join(opt.aus, 'probe.gkg.csv.zip'))) fs.writeFileSync(path.join(opt.aus, 'probe.gkg.csv.zip'), r.buf);
        var csv = entpacke(r.buf); zaehler.bytesCsv += csv.length;
        zaehleText(csv.toString('utf8'), karte, tag, Z, stich, zaehler);
        csv = null;
      } catch (e) { zaehler.fehler.push(st.slice(8, 12) + ':' + e.message); }
      r.buf = null;
    }
    opt.dateienGesamt++;
    if (opt.dateienGesamt % 100 === 0) log('  fortschritt ' + opt.dateienGesamt + ' dateien, zuletzt ' + st + ', ' + (Date.now() - opt.start) / 1000 + ' s');
    var rest = ABSTAND_MS - (Date.now() - t1); if (rest > 0) await warte(rest);
  }
  var aus = { kennung: KENNUNG, karte: karte.kennung, tag: tag, dauerS: +((Date.now() - t0) / 1000).toFixed(1), zaehler: zaehler, symbole: Z, stichprobe: stich };
  return aus;
}

/* ---------- Tage und Teile ---------- */
function tageVonBis(von, bis) {
  var l = [], d = new Date(von + 'T00:00:00Z'), e = new Date(bis + 'T00:00:00Z');
  for (; d <= e; d = new Date(d.getTime() + 86400000)) l.push(d.toISOString().slice(0, 10));
  return l;
}
function schreibeAtomar(p, obj) { fs.writeFileSync(p + '.tmp', JSON.stringify(obj)); fs.renameSync(p + '.tmp', p); }

async function haupt() {
  var a = argumente(process.argv.slice(2));
  var aus = path.resolve(HIER, a.aus || 'voll');
  var tage = a.tag ? [a.tag] : tageVonBis(a.von, a.bis);
  var teil = String(a.teil || '1/1').split('/'), k = parseInt(teil[0], 10), n = parseInt(teil[1], 10);
  if (!(k >= 1 && n >= 1 && k <= n)) throw new Error('--teil k/n');
  tage = tage.filter(function (t, i) { return i % n === k - 1; });
  var ohneKurz = String(a.ohneKurz || '').split('');
  var karte = ladeKarte(ohneKurz);
  fs.mkdirSync(path.join(aus, 'tage'), { recursive: true });
  var kenn = a.tag ? 'vorlauf' : (a.von + '_' + a.bis).replace(/-/g, '');
  var fortP = path.join(aus, '_fortschritt-' + kenn + '-' + k + '.json');
  var fort = fs.existsSync(fortP) ? JSON.parse(fs.readFileSync(fortP, 'utf8')) : { kennung: KENNUNG, karte: karte.kennung, teil: k + '/' + n, von: tage[0], bis: tage[tage.length - 1], ohneKurz: ohneKurz.join(''), start: new Date().toISOString(), erledigtTage: {} };
  var logP = path.join(aus, 'log-' + kenn + '-' + k + '.txt');
  function log(s) { var z = new Date().toISOString().slice(11, 19) + ' ' + s + '\n'; fs.appendFileSync(logP, z); process.stdout.write(z); }
  var opt = { aus: aus, probe: !!a.probe, reservoir: parseInt(a.reservoir, 10) || RESERVOIR, dateienGesamt: 0, start: Date.now() };
  log('START teil ' + k + '/' + n + ' tage=' + tage.length + ' erledigt=' + Object.keys(fort.erledigtTage).length + ' symbole=' + karte.symbole + ' vollNamen=' + Object.keys(karte.voll).length + ' kurzNamen=' + Object.keys(karte.kurz).length + ' ohneKurz=' + (ohneKurz.join('') || '-') + ' karte=' + karte.kennung);
  for (var i = 0; i < tage.length; i++) {
    var tag = tage[i], tagP = path.join(aus, 'tage', tag + '.json');
    if (fort.erledigtTage[tag] && fs.existsSync(tagP)) continue;
    var erg = await zaehleTag(tag, karte, opt, log);
    schreibeAtomar(tagP, erg);
    var z = erg.zaehler;
    /* Ein Tag ist nur ERLEDIGT, wenn jede Datei entweder gezaehlt oder als 404 (GDELT-Luecke) bestaetigt ist. Tage mit
     * Netz-/HTTP-Fehlern bleiben offen und werden beim Neustart wiederholt (der erste Vorlauf lief 96 x 301 und haette sonst
     * als "erledigt, 0 Treffer" gegolten). */
    if (z.gefunden + z.fehlend === z.dateien) { fort.erledigtTage[tag] = { dateien: z.gefunden, fehlend: z.fehlend, fehler: 0 }; }
    else { fort.offeneTage = fort.offeneTage || {}; fort.offeneTage[tag] = { dateien: z.gefunden, fehlend: z.fehlend, fehler: z.fehler.length }; }
    fort.stand = new Date().toISOString();
    schreibeAtomar(fortP, fort);
    log(tag + ' dateien=' + z.gefunden + '/' + z.dateien + ' fehlend=' + z.fehlend + (z.fehlendUhrzeiten.length ? '(' + z.fehlendUhrzeiten.join(' ') + ')' : '') + ' fehler=' + z.fehler.length + (z.fehler.length ? '(' + z.fehler.slice(0, 5).join(' ') + ')' : '') + ' zeilen=' + z.zeilen + ' falscheFeldzahl=' + z.falscheFeldzahl + ' treffer voll=' + z.treffer.voll + ' kurz=' + z.treffer.kurz + ' zip=' + (z.bytesZip / 1048576).toFixed(0) + 'MB dauer=' + erg.dauerS + 's');
  }
  log('ENDE teil ' + k + '/' + n + ' tage=' + tage.length + ' dateien=' + opt.dateienGesamt + ' ' + ((Date.now() - opt.start) / 1000).toFixed(0) + ' s');
}

module.exports = { entpacke: entpacke, zaehleText: zaehleText, ladeKarte: ladeKarte, stempelDesTages: stempelDesTages, tageVonBis: tageVonBis, SPALTEN: SPALTEN, SP_ORG: SP_ORG, SP_TON: SP_TON, RESERVOIR: RESERVOIR };
if (require.main === module) haupt().catch(function (e) { process.stderr.write('ABBRUCH ' + (e.stack || e) + '\n'); process.exit(1); });
