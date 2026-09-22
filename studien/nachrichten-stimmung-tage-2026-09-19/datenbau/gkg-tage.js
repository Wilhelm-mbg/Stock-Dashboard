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
 * Schlanker Rohauszug (Nachtrag 3, 22.09.): je Quelldatei alle Zeilen mit 27 Feldern und nichtleerer Spalte 15 (dieselbe Auswahl
 * wie zaehler.mitOrganisation), davon die Spalten 1, 2, 4, 5, 15, 16 BYTEGLEICH (auf dem Buffer geschnitten), gzip je Datei ein
 * Glied. Abgelegt je UTC-DATEITAG roh/<U>.tsv.gz (+ Beleg roh/<U>.json): ein UTC-Tag U besteht aus den fruehen Stunden des ET-Tags
 * U-1 und dem Rest des ET-Tags U - zwei Teile, die verschiedene Prozesse liefern. Jeder ET-Tag legt nach VOLLSTAENDIGER Zaehlung
 * seine zwei Stuecke atomar nach roh/_teile/ (vor der Tagesdatei); wer das zweite Stueck eines UTC-Tags liefert, vereint beide unter
 * einer Sperre (mkdir) und benennt erst dann um. Ein halber UTC-Tag liegt also nie als roh/<U>.tsv.gz vor. Randtage des Laufs
 * (UTC 2017-01-01, 2026-09-01) bleiben Stuecke. Aufraeumen nach Abbruch: --rohNachlauf (vollauf.sh start, vor den Teilen).
 * Fortsetzbar je Tag: <aus>/tage/<YYYY-MM-DD>.json (atomar) + <aus>/_fortschritt-<k>.json; Log <aus>/log-<k>.txt.
 * Aufruf:  node gkg-tage.js --von 2017-01-01 --bis 2026-08-31 --teil 3/12 --aus /pfad
 *          node gkg-tage.js --tag 2025-06-02 --aus /pfad                (ein ET-Tag)
 *          node gkg-tage.js --utcTag 2025-06-02 --aus /pfad             (Kontrolle: die 96 Dateien des UTC-Tags, alle
 *                                                                        ET-Tage getrennt -> <aus>/kontrolle-utc-<tag>.json)
 *          node gkg-tage.js --rohNachlauf --aus /pfad                   (Rohauszug aufraeumen, nur ohne laufende Teile)
 *          --ohneRoh schaltet den Rohauszug ab (Kontrollen, Vergleiche).
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
var ROH_KENNUNG = 'nachrichten-stimmung-tage-2026-09-19/gdelt-roh/v1';
var ROH_SPALTEN = [SP_ID, SP_DATUM, SP_QUELLE, SP_DOK, SP_ORG, SP_TON];   // 0-basiert = GKG-Spalten 1, 2, 4, 5, 15, 16

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

/* ---------- Schlanker Rohauszug (Nachtrag 3) ---------- */
var TAB_B = Buffer.from('\t'), NL_B = Buffer.from('\n');
/** Auszug einer entpackten GKG-Datei (Buffer): Zeilen mit genau 27 Feldern und nichtleerer Spalte 15; Spalten 1, 2, 4, 5, 15, 16
 * bytegleich, tab-getrennt, '\n'. Die Spaltenpaare 1-2, 4-5, 15-16 liegen in der Quelle nebeneinander und werden samt ihrem Tab
 * als ein Stueck uebernommen. Ein CR am Zeilenende gehoert zur letzten Spalte (27) und liegt nie im Auszug. */
function rohAuszug(buf) {
  var teile = [], zeilen = 0, pos = 0, len = buf.length, t = new Array(SPALTEN - 1);
  while (pos < len) {
    var ende = buf.indexOf(10, pos); if (ende < 0) ende = len;
    var e = ende; if (e > pos && buf[e - 1] === 13) e--;
    var k = 0, p = pos, q;
    while (k < SPALTEN && (q = buf.indexOf(9, p)) >= 0 && q < e) { t[k++] = q; p = q + 1; }
    if (k === SPALTEN - 1 && t[SP_ORG] > t[SP_ORG - 1] + 1) {
      teile.push(buf.subarray(pos, t[SP_DATUM]), TAB_B, buf.subarray(t[SP_QUELLE - 1] + 1, t[SP_DOK]), TAB_B, buf.subarray(t[SP_ORG - 1] + 1, t[SP_TON]), NL_B);
      zeilen++;
    }
    pos = ende + 1;
  }
  return { buf: Buffer.concat(teile), zeilen: zeilen };
}
function utcTagVon(stempel) { return stempel.slice(0, 4) + '-' + stempel.slice(4, 6) + '-' + stempel.slice(6, 8); }
function tagDavor(tag) { return new Date(Date.parse(tag + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10); }
function rohNeu() { return { tage: {} }; }
function rohEimer(roh, st) {
  var u = utcTagVon(st);
  return roh.tage[u] || (roh.tage[u] = { soll: 0, dateien: 0, fehlend: [], fehler: [], von: st, bis: st, zeilen: 0, bytesRoh: 0, bytesGz: 0, ms: 0, gz: [] });
}
/** Eine gezaehlte Datei in den Auszug; `sollZeilen` = mitOrganisation-Zuwachs dieser Datei (Roh-Klinke: muss gleich sein). */
function rohFuegeAn(roh, st, csv, sollZeilen) {
  var t0 = process.hrtime.bigint(), a = rohAuszug(csv);
  if (a.zeilen !== sollZeilen) throw new Error('Roh-Klinke: ' + st + ' Auszug ' + a.zeilen + ' Zeilen, Zaehler mitOrganisation ' + sollZeilen);
  var e = rohEimer(roh, st), gz = a.zeilen ? zlib.gzipSync(a.buf) : null;
  if (gz) e.gz.push(gz);
  e.dateien++; e.zeilen += a.zeilen; e.bytesRoh += a.buf.length; e.bytesGz += gz ? gz.length : 0;
  e.ms += Number(process.hrtime.bigint() - t0) / 1e6;
}
function rohOrdner(aus) { return { d: path.join(aus, 'roh'), T: path.join(aus, 'roh', '_teile') }; }
function schreibeBufAtomar(p, buf) { fs.writeFileSync(p + '.tmp', buf); fs.renameSync(p + '.tmp', p); }
/** Nach VOLLSTAENDIGER Zaehlung des ET-Tags: seine Stuecke (je UTC-Tag eines) atomar nach roh/_teile/, dann vereinen, wo moeglich.
 * Ist roh/<U>.tsv.gz schon da (Tag nach Abbruch wiederholt), wird nichts neu gelegt - der Inhalt ist deterministisch derselbe. */
function rohAblegen(aus, etTag, roh) {
  var o = rohOrdner(aus), erg = {};
  fs.mkdirSync(o.T, { recursive: true });
  Object.keys(roh.tage).sort().forEach(function (u) {
    var e = roh.tage[u], stueck = path.join(o.T, u + '_' + etTag);
    if (fs.existsSync(path.join(o.d, u + '.tsv.gz'))) { erg[u] = 'schon'; return; }
    schreibeBufAtomar(stueck + '.tsv.gz', Buffer.concat(e.gz));
    schreibeAtomar(stueck + '.json', { kennung: ROH_KENNUNG, utcTag: u, etTag: etTag, soll: e.soll, dateien: e.dateien, fehlend: e.fehlend, fehler: e.fehler,
      von: e.von, bis: e.bis, zeilen: e.zeilen, bytesRoh: e.bytesRoh, bytesGz: e.bytesGz, msRoh: Math.round(e.ms) });   // .json zuletzt = Stueck fertig
    erg[u] = rohVereine(aus, u);
  });
  return erg;
}
/** UTC-Tag U = Stueck des ET-Tags U-1 (fruehe Stunden) + Stueck des ET-Tags U (Rest), in dieser Reihenfolge (Dateien chronologisch). */
function rohVereine(aus, u) {
  var o = rohOrdner(aus), ziel = path.join(o.d, u + '.tsv.gz');
  var st = [tagDavor(u), u].map(function (et) { var b = path.join(o.T, u + '_' + et); return fs.existsSync(b + '.json') ? { b: b, meta: JSON.parse(fs.readFileSync(b + '.json', 'utf8')) } : null; });
  if (fs.existsSync(ziel)) return 'schon';
  if (!st[0] || !st[1]) return 'wartet';
  if (st[0].meta.soll + st[1].meta.soll !== 96) throw new Error('Roh-Klinke: UTC-Tag ' + u + ' aus ' + (st[0].meta.soll + st[1].meta.soll) + ' Dateistempeln statt 96');
  var sperre = path.join(o.T, u + '.sperre');
  try { fs.mkdirSync(sperre); } catch (err) { if (err.code === 'EEXIST') return 'gesperrt'; throw err; }
  try {
    if (fs.existsSync(ziel)) return 'schon';
    var gz = Buffer.concat(st.map(function (s) { return fs.readFileSync(s.b + '.tsv.gz'); }));
    if (!gz.length) gz = zlib.gzipSync(Buffer.alloc(0));
    var m = st.map(function (s) { return s.meta; });
    schreibeAtomar(path.join(o.d, u + '.json'), { kennung: ROH_KENNUNG, utcTag: u, soll: 96, dateien: m[0].dateien + m[1].dateien, fehlend: m[0].fehlend.concat(m[1].fehlend),
      fehler: m[0].fehler.concat(m[1].fehler), zeilen: m[0].zeilen + m[1].zeilen, bytesRoh: m[0].bytesRoh + m[1].bytesRoh, bytesGz: gz.length, stuecke: m });
    schreibeBufAtomar(ziel, gz);                                                 // die .tsv.gz zuletzt = UTC-Tag fertig
    st.forEach(function (s) { ['.tsv.gz', '.json'].forEach(function (x) { try { fs.unlinkSync(s.b + x); } catch (err) { /* schon weg */ } }); });
    return 'vereint';
  } finally { fs.rmdirSync(sperre); }
}
/** Aufraeumen nach Abbruch (nur ohne laufende Teile): Sperren und .tmp weg, fertige Paare vereinen, Reste fertiger Tage loeschen. */
function rohNachlauf(aus) {
  var o = rohOrdner(aus), n = { sperren: 0, tmp: 0, vereint: 0, wartet: [] };
  fs.mkdirSync(o.T, { recursive: true });
  [o.d, o.T].forEach(function (d) { fs.readdirSync(d).forEach(function (f) {
    if (/\.sperre$/.test(f)) { fs.rmdirSync(path.join(d, f)); n.sperren++; } else if (/\.tmp$/.test(f)) { fs.unlinkSync(path.join(d, f)); n.tmp++; }
  }); });
  var tage = {}; fs.readdirSync(o.T).forEach(function (f) { var m = /^(\d{4}-\d\d-\d\d)_\d{4}-\d\d-\d\d\.json$/.exec(f); if (m) tage[m[1]] = 1; });
  Object.keys(tage).sort().forEach(function (u) {
    var r = rohVereine(aus, u);
    if (r === 'vereint') n.vereint++;
    else if (r === 'schon') fs.readdirSync(o.T).forEach(function (f) { if (f.indexOf(u + '_') === 0) fs.unlinkSync(path.join(o.T, f)); });
    else n.wartet.push(u);
  });
  return n;
}
function rohSchema(aus) {
  var p = path.join(aus, 'roh', '_schema.json');
  if (fs.existsSync(p)) return;
  schreibeAtomar(p, { kennung: ROH_KENNUNG, werkzeug: 'studien/nachrichten-stimmung-tage-2026-09-19/datenbau/gkg-tage.js (' + KENNUNG + ')', erstellt: new Date().toISOString(),
    herkunft: 'GDELT GKG 2.1, http://data.gdeltproject.org/gdeltv2/<YYYYMMDDHHMMSS>.gkg.csv.zip (15-min-Dateien)',
    spalten: [{ gkg: 1, name: 'GKGRECORDID' }, { gkg: 2, name: 'V2.1DATE (UTC, YYYYMMDDHHMMSS)' }, { gkg: 4, name: 'V2SOURCECOMMONNAME' }, { gkg: 5, name: 'V2DOCUMENTIDENTIFIER' },
      { gkg: 15, name: 'V2ENHANCEDORGANIZATIONS (Name,Offset;...)' }, { gkg: 16, name: 'V1.5TONE (Ton,Pos,Neg,Polaritaet,Aktiv,SelbstGruppe,Woerter)' }],
    auswahl: 'jede Zeile mit genau 27 Feldern und nichtleerer Spalte 15 (= Zaehler mitOrganisation); keine Namensfilter, kein Normalisieren',
    inhalt: 'Feldbytes unveraendert aus der Quelle, Trenner Tab, Zeilenende LF, Zeilen in Datei- und Quellreihenfolge',
    datei: 'roh/<UTC-Tag>.tsv.gz = die 96 Dateien des UTC-Dateitags (Tag aus dem Dateinamen, nicht aus V2.1DATE); gzip mit einem Glied je Quelldatei (mehrgliedrig, zcat/gunzip lesen es als eins)',
    beleg: 'roh/<UTC-Tag>.json: soll, dateien, fehlend (404), fehler, zeilen, Bytes, Stuecke (ET-Tag U-1 fruehe Stunden, ET-Tag U Rest)',
    vorregistrierung: 'VORREGISTRIERUNG.md Nachtrag 3 (22.09.2026)' });
}

function warte(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }
function neueZaehler(soll) {
  return { soll: soll, gefunden: 0, fehlend: 0, fehler: [], fehlendStempel: [], bytesZip: 0, bytesCsv: 0, zeilen: 0, falscheFeldzahl: 0, mitOrganisation: 0, ohneTon: 0,
    stempelAusDatei: 0, stempelUngleichDatei: 0, treffer: 0, trefferSpaet: 0, trefferUebersetzt: 0, fremderTag: 0 };
}

/** Holt und zaehlt eine Liste von Dateistempeln; Rueckgabe { B, zaehler }. `roh` (optional) sammelt den schlanken Auszug. */
async function zaehleDateien(stempel, karte, opt, log, roh) {
  var B = {}, zaehler = neueZaehler(stempel.length);
  for (var i = 0; i < stempel.length; i++) {
    var st = stempel[i], url = 'http://data.gdeltproject.org/gdeltv2/' + st + '.gkg.csv.zip';
    var t1 = Date.now(), eimer = roh ? rohEimer(roh, st) : null;
    if (eimer) { eimer.soll++; if (st < eimer.von) eimer.von = st; if (st > eimer.bis) eimer.bis = st; }
    var r = await (opt.hole || hole)(url, 2);
    if (r.status === 404) { zaehler.fehlend++; zaehler.fehlendStempel.push(st); if (eimer) eimer.fehlend.push(st); }
    else if (r.status !== 200) { zaehler.fehler.push(st + ':' + r.status); if (eimer) eimer.fehler.push(st); }
    else {
      zaehler.gefunden++; zaehler.bytesZip += r.buf.length;
      var csv = null, vorOrg = zaehler.mitOrganisation;
      try {
        csv = entpacke(r.buf); zaehler.bytesCsv += csv.length;
        zaehleText(csv.toString('utf8'), karte, st, B, zaehler, opt.reservoir);
      } catch (e) { csv = null; zaehler.fehler.push(st + ':' + e.message); if (eimer) eimer.fehler.push(st); }
      if (csv && roh) rohFuegeAn(roh, st, csv, zaehler.mitOrganisation - vorOrg);   // wirft bei Abweichung (Roh-Klinke)
      csv = null; r.buf = null;
    }
    opt.dateienGesamt++;
    if (opt.dateienGesamt % 100 === 0) log('  fortschritt ' + opt.dateienGesamt + ' dateien, zuletzt ' + st + ', ' + ((Date.now() - opt.start) / 1000).toFixed(0) + ' s');
    var rest = (opt.abstand != null ? opt.abstand : ABSTAND_MS) - (Date.now() - t1); if (rest > 0) await warte(rest);
  }
  return { B: B, zaehler: zaehler };
}

/** Ein ET-Tag: Datei-Menge des ET-Tags, Ablage nur des Eimers D; Artikel fremder ET-Tage werden gezaehlt, nicht abgelegt. */
async function zaehleETTag(tag, karte, opt, log, roh) {
  var t0 = Date.now();
  var r = await zaehleDateien(stempelDesETTages(tag), karte, opt, log, roh), z = r.zaehler;
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

/** Ein ET-Tag vollstaendig: zaehlen, bei vollstaendiger Datei-Menge den Rohauszug ablegen (VOR der Tagesdatei - so kann ein
 * Abbruch nie einen erledigten Tag ohne Auszug hinterlassen), dann die Tagesdatei atomar schreiben. */
async function verarbeiteTag(tag, karte, opt, aus, log) {
  var roh = opt.ohneRoh ? null : rohNeu();
  var erg = await zaehleETTag(tag, karte, opt, log, roh), z = erg.zaehler;
  var vollstaendig = z.gefunden + z.fehlend === z.soll;                            // unvollstaendig = Tag wird wiederholt, kein Stueck
  var ausgabe = roh && vollstaendig ? rohAblegen(aus, tag, roh) : null;
  var rohZeilen = roh ? Object.keys(roh.tage).reduce(function (a, u) { return a + roh.tage[u].zeilen; }, 0) : 0;
  schreibeAtomar(path.join(aus, 'tage', tag + '.json'), erg);                      // Tagesdatei zuletzt: erledigt heisst "Auszug liegt"
  return { erg: erg, roh: ausgabe, rohZeilen: rohZeilen };
}

async function haupt() {
  var a = argumente(process.argv.slice(2));
  if (!a.aus) throw new Error('--aus <Ordner> fehlt');
  var aus = path.resolve(a.aus);
  if (a.rohNachlauf) {
    var nl = rohNachlauf(aus);
    process.stdout.write('ROH-NACHLAUF sperren=' + nl.sperren + ' tmp=' + nl.tmp + ' vereint=' + nl.vereint + ' wartet=' + nl.wartet.length + (nl.wartet.length ? ' (' + nl.wartet.slice(0, 8).join(' ') + ')' : '') + '\n');
    return;
  }
  var karte = ladeKarte(a.karte ? path.resolve(a.karte) : null);
  var opt = { reservoir: parseInt(a.reservoir, 10) || RESERVOIR, dateienGesamt: 0, start: Date.now(), ohneRoh: !!a.ohneRoh };
  fs.mkdirSync(path.join(aus, 'tage'), { recursive: true });
  if (!opt.ohneRoh) { fs.mkdirSync(path.join(aus, 'roh', '_teile'), { recursive: true }); rohSchema(aus); }

  if (a.utcTag) {
    opt.ohneRoh = true;
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
    var v = await verarbeiteTag(tag, karte, opt, aus, log);
    var erg = v.erg, z = erg.zaehler;
    /* ERLEDIGT nur, wenn jede Datei gezaehlt oder als 404 bestaetigt ist; Netz-/HTTP-Fehler bleiben offen (Neustart wiederholt). */
    if (z.gefunden + z.fehlend === z.soll) { fort.erledigtTage[tag] = { dateien: z.gefunden, fehlend: z.fehlend, soll: z.soll }; if (fort.offeneTage) delete fort.offeneTage[tag]; }
    else { fort.offeneTage = fort.offeneTage || {}; fort.offeneTage[tag] = { dateien: z.gefunden, fehlend: z.fehlend, fehler: z.fehler.length }; }
    fort.stand = new Date().toISOString();
    schreibeAtomar(fortP, fort);
    log(tag + ' dateien=' + z.gefunden + '/' + z.soll + ' fehlend=' + z.fehlend + (z.fehlend ? '(' + z.fehlendStempel.slice(0, 8).map(function (s) { return s.slice(8, 12); }).join(' ') + ')' : '') + ' fehler=' + z.fehler.length + (z.fehler.length ? '(' + z.fehler.slice(0, 3).join(' ') + ')' : '') + ' zeilen=' + z.zeilen + ' treffer=' + z.treffer + ' spaet=' + z.trefferSpaet + ' fremd=' + z.fremderTag + ' symbole=' + Object.keys(erg.symbole).length + ' zip=' + (z.bytesZip / 1048576).toFixed(0) + 'MB dauer=' + erg.dauerS + 's'
      + (v.roh ? ' roh=' + v.rohZeilen + 'z/' + Object.keys(v.roh).map(function (u) { return u.slice(5) + ':' + v.roh[u]; }).join(',') : ''));
  }
  log('ENDE teil ' + k + '/' + n + ' tage=' + tage.length + ' dateien=' + opt.dateienGesamt + ' ' + ((Date.now() - opt.start) / 1000).toFixed(0) + ' s');
}

module.exports = { KENNUNG: KENNUNG, entpacke: entpacke, zaehleText: zaehleText, karteAus: karteAus, ladeKarte: ladeKarte, symboleAblage: symboleAblage, pruefeTag: pruefeTag,
  stempelDesETTages: stempelDesETTages, stempelDesUTCTages: stempelDesUTCTages, tageVonBis: tageVonBis, neueZaehler: neueZaehler, fnvU: fnvU,
  rohAuszug: rohAuszug, rohNeu: rohNeu, rohFuegeAn: rohFuegeAn, rohAblegen: rohAblegen, rohVereine: rohVereine, rohNachlauf: rohNachlauf, rohSchema: rohSchema,
  utcTagVon: utcTagVon, tagDavor: tagDavor, verarbeiteTag: verarbeiteTag, zaehleETTag: zaehleETTag,
  SPALTEN: SPALTEN, SP_ID: SP_ID, SP_DATUM: SP_DATUM, SP_QUELLE: SP_QUELLE, SP_DOK: SP_DOK, SP_ORG: SP_ORG, SP_TON: SP_TON, SCHNITT: SCHNITT, ROH_KENNUNG: ROH_KENNUNG, ROH_SPALTEN: ROH_SPALTEN };
if (require.main === module) haupt().catch(function (e) { process.stderr.write('ABBRUCH ' + (e.stack || e) + '\n'); process.exit(/Leck|Klinke/.test(String(e && e.message)) ? 3 : 1); });   // 3 = Klinke: systemd startet nicht neu
