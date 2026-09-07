'use strict';
/* MANIFEST, LUECKENLISTE UND ZUSAMMENFASSUNG DES ALPACA-MINUTENARCHIVS (06.09.2026)
 *
 * Ein einziger Durchlauf je Datei, als Strom, ohne die Reihe zu zerlegen: SHA-256,
 * Bytes, Zahl der Kerzen, erster/letzter Stempel, die ET-Tage mit Balken und die
 * Sitzung je Kerze (aus dem Kalender der Quelle). 136 GB lassen sich so in einer
 * halben Stunde abtasten; JSON.parse ueber alles braucht Stunden (die Vollpruefung
 * vom 06.09. lief 4 h 23 min).
 *
 * Drei Ergebnisse aus einem Durchlauf:
 *   <wurzel>/_manifest.json   je Datei: Pfad, Bytes, SHA-256, Kerzen, erster/letzter
 *                             Stempel, Quelle, Lebenszeitfenster, Sitzungszaehler
 *   alpaca1m/_luecken.json    je Wert: Soll-Tage (Kalender x Lebenszeit aus den
 *                             TAGESbalken), Ist-Tage (Minutentage), fehlende Tage, Anteil
 *   alpaca1m/_lebenszeit.json bekommt je Wert ersterMinutentag/letzterMinutentag/
 *                             minutentage dazu (Tagesbalken != Minutenbalken)
 *   alpaca1m/_zusammenfassung.json  die Zahlen fuer das Wiki
 *
 * Aufgerufen von tools/alpaca-vollsammlung.js --manifest. Kein Netz, kein Schluessel.
 * Geschrieben wird nur in die Meta-Dateien; keine Jahresdatei wird angefasst. */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var A = require('../alpacaarchiv.js');

var STAMPEL_RE = /\[(\d{13}),/g;
var CHUNK = 4 * 1024 * 1024;

/* ET-Tag und Sitzung je Stempel - je Stunde bzw. je Tag gemerkt, sonst kostet Intl
 * bei drei Milliarden Kerzen Stunden. */
var versatzJeStunde = {};
function versatzMin(ms) {
  var h = Math.floor(ms / 3600000);
  if (versatzJeStunde[h] !== undefined) return versatzJeStunde[h];
  var p = A.nyTeile(h * 3600000);
  var wand = Date.UTC(p.j, p.m - 1, p.d, p.h, p.min);
  return (versatzJeStunde[h] = Math.round((wand - h * 3600000) / 60000));
}
function etTagSchnell(ms) {
  var lokal = ms + versatzMin(ms) * 60000;
  var tag = Math.floor(lokal / 86400000);
  return tag;   /* Tagesnummer (ET); als Text: tagText() */
}
function tagText(tagNr) { return new Date(tagNr * 86400000).toISOString().slice(0, 10); }
function tagNr(text) { return Math.floor(Date.parse(text + 'T00:00:00Z') / 86400000); }
var grenzenJeTag = {};
function grenzen(kal, tag) {
  if (grenzenJeTag[tag] !== undefined) return grenzenJeTag[tag];
  var e = kal[tagText(tag)];
  if (!e || !e.open || !e.close) return (grenzenJeTag[tag] = null);
  var p = tagText(tag).split('-').map(Number), o = e.open.split(':').map(Number), c = e.close.split(':').map(Number);
  return (grenzenJeTag[tag] = { auf: A.nyNachUtc(p[0], p[1], p[2], o[0], o[1]), zu: A.nyNachUtc(p[0], p[1], p[2], c[0], c[1]) });
}

/** Eine Datei abtasten. Rueckgabe: { bytes, sha256, kerzen, erster, letzter, tage (Set als
 *  Objekt Tagesnummer->1), sitzungen {regulaer, vor, nach, ausserhalb}, quelle }. */
function abtasten(pfad, kal) {
  var fd = fs.openSync(pfad, 'r');
  var hash = crypto.createHash('sha256');
  var buf = Buffer.alloc(CHUNK), rest = '', bytes = 0;
  var kerzen = 0, erster = null, letzter = null, tage = {}, z = { regulaer: 0, vor: 0, nach: 0, ausserhalb: 0 };
  var kopf = null;
  try {
    for (;;) {
      var n = fs.readSync(fd, buf, 0, CHUNK, bytes);
      if (!n) break;
      var teil = buf.slice(0, n);
      hash.update(teil);
      bytes += n;
      var text = rest + teil.toString('latin1');
      if (kopf === null) {
        var q = /"quellen":\[(.*?)\]/.exec(text);
        kopf = q ? q[1] : '';
      }
      /* Bis zur letzten vollstaendigen Kerzenmarke verarbeiten, den Rest mitnehmen. */
      var schnitt = Math.max(0, text.length - 32);
      var m;
      STAMPEL_RE.lastIndex = 0;
      while ((m = STAMPEL_RE.exec(text))) {
        if (m.index >= schnitt && n === CHUNK) break;
        var t = Number(m[1]);
        kerzen++;
        if (erster === null) erster = t;
        letzter = t;
        var tag = etTagSchnell(t);
        tage[tag] = 1;
        var g = grenzen(kal, tag);
        if (!g) z.ausserhalb++;
        else if (t < g.auf) z.vor++;
        else if (t >= g.zu) z.nach++;
        else z.regulaer++;
      }
      rest = n === CHUNK ? text.slice(schnitt) : '';
    }
  } finally { fs.closeSync(fd); }
  var quelle = /"quelle":"([a-z]+)"/.exec(kopf || '');
  return { bytes: bytes, sha256: hash.digest('hex'), kerzen: kerzen, erster: erster, letzter: letzter,
           tage: tage, sitzungen: z, quelle: quelle ? quelle[1] : null };
}

function jahresdateien(wurzel) {
  var aus = [];
  fs.readdirSync(wurzel).forEach(function (ord) {
    if (ord.charAt(0) === '_') return;
    var voll = path.join(wurzel, ord);
    var st = fs.statSync(voll);
    if (!st.isDirectory()) return;
    fs.readdirSync(voll).forEach(function (n) {
      if (/^\d{4}\.json$/.test(n)) aus.push({ ordner: ord, jahr: Number(n.slice(0, 4)), pfad: voll + path.sep + n, rel: ord + '/' + n });
    });
  });
  aus.sort(function (a, b) { return a.rel < b.rel ? -1 : a.rel > b.rel ? 1 : 0; });
  return aus;
}

/** Das Manifest einer Wurzel (alpaca1m/ oder alpaca1m-bereinigt/) schreiben.
 *  opt.kal          Kalender der Quelle (tage)
 *  opt.lebenszeit   werte aus _lebenszeit.json (fuer das Lebenszeitfenster je Datei)
 *  opt.ordnerZuSym  Ordnername -> Kuerzel
 *  opt.nur          Liste von Ordnern (Probe)
 *  opt.ausgabe      anderer Zielpfad (Sicherungsliste)
 *  opt.sag          Ausgabe
 *  Rueckgabe { pfad, dateien, kerzen, bytes, jeDatei } - jeDatei traegt die Tagesmengen
 *  fuer die Lueckenliste. */
function manifestSchreiben(wurzel, opt) {
  opt = opt || {};
  var sag = opt.sag || function () {};
  var kal = opt.kal || {};
  var LZ = opt.lebenszeit || {};
  var ordnerZuSym = opt.ordnerZuSym || {};
  var liste = jahresdateien(wurzel);
  if (opt.nur) liste = liste.filter(function (d) { return opt.nur.indexOf(d.ordner) >= 0; });
  var eintraege = {}, jeDatei = [], kerzen = 0, bytes = 0, begonnen = Date.now();
  liste.forEach(function (d, i) {
    var a = abtasten(d.pfad, kal);
    var sym = ordnerZuSym[d.ordner] || d.ordner;
    var lz = LZ[sym] || null;
    eintraege[d.rel] = {
      sym: sym, jahr: d.jahr, bytes: a.bytes, sha256: a.sha256, kerzen: a.kerzen,
      erster: a.erster, letzter: a.letzter, quelle: a.quelle, sitzungen: a.sitzungen, tage: Object.keys(a.tage).length,
      lebenszeit: lz && lz.erster && lz.letzter ? { von: A.etTag(lz.erster), bis: A.etTag(lz.wiederverwendet ? lz.wiederverwendet.schnitt : lz.letzter) } : null,
    };
    jeDatei.push({ sym: sym, ordner: d.ordner, jahr: d.jahr, tage: a.tage, kerzen: a.kerzen, sitzungen: a.sitzungen, bytes: a.bytes });
    kerzen += a.kerzen; bytes += a.bytes;
    if ((i + 1) % 500 === 0 || i + 1 === liste.length) {
      var min = (Date.now() - begonnen) / 60000;
      sag('  ' + (i + 1) + '/' + liste.length + ' Dateien, ' + (bytes / 1e9).toFixed(1) + ' GB, ' + min.toFixed(1) + ' min, Rest ' +
        ((liste.length - i - 1) / Math.max(1, i + 1) * min).toFixed(0) + ' min');
    }
  });
  var manifest = { stand: new Date().toISOString(), wurzel: path.basename(wurzel), dateien: liste.length, kerzen: kerzen, bytes: bytes,
                   hash: 'sha256', eintraege: eintraege };
  var ziel = opt.ausgabe || path.join(wurzel, '_manifest.json');
  A.atomarSchreiben(ziel, JSON.stringify(manifest));
  return { pfad: ziel, dateien: liste.length, kerzen: kerzen, bytes: bytes, jeDatei: jeDatei };
}

/** Manifest gegen die Platte halten: fehlende, veraenderte (Bytes; mit opt.hash auch
 *  SHA-256), neue Dateien. Jede Datei ein Eintrag, jeder Eintrag eine Datei. */
/** Der `stand` aus dem Kopf einer Jahresdatei, ohne sie ganz zu lesen. */
function standAus(pfad) {
  var fd;
  try { fd = fs.openSync(pfad, 'r'); } catch (e) { return null; }
  try {
    var buf = Buffer.alloc(4096);
    var n = fs.readSync(fd, buf, 0, 4096, 0);
    var m = /"stand"\s*:\s*"([^"]{10,40})"/.exec(buf.slice(0, n).toString('utf8'));
    return m ? m[1] : null;
  } catch (e) { return null; } finally { fs.closeSync(fd); }
}
/* SEIT DEM LIVE-SAMMLER IST "VERAENDERT" NICHT MEHR "VERDAECHTIG" (07.09.2026).
 * Die App haengt waehrend der Sitzung alle fuenf Minuten an - jede live gepflegte Datei
 * ist danach groesser als im Manifest, und `--pruefen` meldete sie bis zum naechsten
 * Manifestlauf von Hand als abweichend. Ein Dauer-Fehlalarm macht die Pruefung wertlos.
 * Traegt die Datei einen JUENGEREN `stand` als das Manifest, ist sie fortgeschrieben,
 * nicht veraendert - sie kommt in `nachgewachsen`. Wer alt oder gleich alt ist und
 * trotzdem abweicht, bleibt ein Befund. */
function manifestPruefen(wurzel, opt) {
  opt = opt || {};
  var mp = path.join(wurzel, '_manifest.json');
  if (!fs.existsSync(mp)) return { vorhanden: false };
  var man = JSON.parse(fs.readFileSync(mp, 'utf8'));
  var liste = jahresdateien(wurzel);
  var da = {};
  liste.forEach(function (d) { da[d.rel] = d; });
  var fehlende = [], veraenderte = [], nachgewachsen = [], neue = [], gleich = 0;
  var manStand = Date.parse(man.stand || '');
  function einordnen(rel, pfad, satz) {
    var s = Date.parse(standAus(pfad) || '');
    if (isFinite(s) && isFinite(manStand) && s > manStand) { satz.stand = new Date(s).toISOString(); nachgewachsen.push(satz); return; }
    veraenderte.push(satz);
  }
  Object.keys(man.eintraege).forEach(function (rel) {
    var d = da[rel];
    if (!d) { fehlende.push(rel); return; }
    var e = man.eintraege[rel];
    var groesse = fs.statSync(d.pfad).size;
    if (groesse !== e.bytes) { einordnen(rel, d.pfad, { datei: rel, bytesVorher: e.bytes, bytesJetzt: groesse }); return; }
    if (opt.hash) {
      var h = crypto.createHash('sha256').update(fs.readFileSync(d.pfad)).digest('hex');
      if (h !== e.sha256) { einordnen(rel, d.pfad, { datei: rel, bytesVorher: e.bytes, bytesJetzt: groesse, hash: 'abweichend' }); return; }
    }
    gleich++;
  });
  liste.forEach(function (d) { if (!man.eintraege[d.rel]) neue.push(d.rel); });
  return { vorhanden: true, stand: man.stand, eintraege: Object.keys(man.eintraege).length, dateien: liste.length,
           gleich: gleich, fehlende: fehlende, veraenderte: veraenderte, nachgewachsen: nachgewachsen, neue: neue, hashGeprueft: !!opt.hash };
}

/** Einzelne Eintraege nachfuehren (Nachlauf: nur die beruehrten Dateien). */
function manifestNachfuehren(wurzel, rels, opt) {
  opt = opt || {};
  var mp = path.join(wurzel, '_manifest.json');
  if (!fs.existsSync(mp)) return { vorhanden: false };
  var man = JSON.parse(fs.readFileSync(mp, 'utf8'));
  var n = 0;
  rels.forEach(function (rel) {
    var pfad = path.join(wurzel, rel);
    if (!fs.existsSync(pfad)) { delete man.eintraege[rel]; return; }
    var a = abtasten(pfad, opt.kal || {});
    var alt = man.eintraege[rel] || {};
    var ord = rel.split('/')[0];
    man.eintraege[rel] = { sym: alt.sym || (opt.ordnerZuSym || {})[ord] || ord, jahr: Number(rel.slice(-9, -5)), bytes: a.bytes, sha256: a.sha256,
      kerzen: a.kerzen, erster: a.erster, letzter: a.letzter, quelle: a.quelle, sitzungen: a.sitzungen, tage: Object.keys(a.tage).length,
      lebenszeit: alt.lebenszeit || null };
    n++;
  });
  man.stand = new Date().toISOString();
  man.dateien = Object.keys(man.eintraege).length;
  man.kerzen = 0; man.bytes = 0;
  Object.keys(man.eintraege).forEach(function (r) { man.kerzen += man.eintraege[r].kerzen; man.bytes += man.eintraege[r].bytes; });
  A.atomarSchreiben(mp, JSON.stringify(man));
  return { vorhanden: true, nachgefuehrt: n };
}

/** Lueckenliste je Wert aus Kalender x Lebenszeit gegen die Minutentage, und die
 *  Minuten-Lebenszeit. `jeDatei` kommt aus manifestSchreiben (alpaca1m). */
function lueckenRechnen(jeDatei, kal, LZ, gruppe) {
  var kalTage = Object.keys(kal).filter(function (t) { return kal[t] && kal[t].open; }).map(tagNr).sort(function (a, b) { return a - b; });
  var jeSym = {};
  jeDatei.forEach(function (d) {
    var e = jeSym[d.sym] || (jeSym[d.sym] = { tage: {}, kerzen: 0, jahre: [] });
    Object.keys(d.tage).forEach(function (t) { e.tage[t] = 1; });
    e.kerzen += d.kerzen; e.jahre.push(d.jahr);
  });
  var werte = {}, zs = { werte: 0, sollTage: 0, istTage: 0, fehlendeTage: 0, ohneMinuten: [], verschwunden: { werte: 0, mitMinuten: 0, ohneMinuten: 0, sollTage: 0, istTage: 0, fehlendeTage: 0 } };
  var minuten = {};
  Object.keys(LZ).forEach(function (sym) {
    var lz = LZ[sym];
    if (!lz || lz.fehler || !lz.erster || !lz.letzter) return;
    var von = tagNr(A.etTag(lz.erster)), bis = tagNr(A.etTag(lz.wiederverwendet ? lz.wiederverwendet.schnitt : lz.letzter));
    if (lz.zweiteReihe && lz.zweiteReihe.abMs) von = Math.max(von, tagNr(A.etTag(lz.zweiteReihe.abMs)));
    var soll = kalTage.filter(function (t) { return t >= von && t <= bis; });
    var e = jeSym[sym] || { tage: {}, kerzen: 0 };
    var fehlend = soll.filter(function (t) { return !e.tage[t]; });
    var istTage = Object.keys(e.tage).map(Number).sort(function (a, b) { return a - b; });
    werte[sym] = { soll: soll.length, ist: istTage.length, fehlend: fehlend.map(tagText), anteil: soll.length ? Number((fehlend.length / soll.length).toFixed(4)) : null,
      ersterMinutentag: istTage.length ? tagText(istTage[0]) : null, letzterMinutentag: istTage.length ? tagText(istTage[istTage.length - 1]) : null };
    minuten[sym] = { ersterMinutentag: werte[sym].ersterMinutentag, letzterMinutentag: werte[sym].letzterMinutentag, minutentage: istTage.length };
    zs.werte++; zs.sollTage += soll.length; zs.istTage += istTage.length; zs.fehlendeTage += fehlend.length;
    if (!istTage.length) zs.ohneMinuten.push(sym);
    var g = gruppe && gruppe[sym.replace(/~2$/, '')];
    if (g === 'verschwunden') {
      zs.verschwunden.werte++; zs.verschwunden.sollTage += soll.length; zs.verschwunden.istTage += istTage.length; zs.verschwunden.fehlendeTage += fehlend.length;
      if (istTage.length) zs.verschwunden.mitMinuten++; else zs.verschwunden.ohneMinuten++;
    }
  });
  zs.anteilFehlend = zs.sollTage ? Number((zs.fehlendeTage / zs.sollTage).toFixed(4)) : null;
  zs.verschwunden.anteilFehlend = zs.verschwunden.sollTage ? Number((zs.verschwunden.fehlendeTage / zs.verschwunden.sollTage).toFixed(4)) : null;
  zs.ohneMinutenZahl = zs.ohneMinuten.length;
  return { werte: werte, zusammenfassung: zs, minuten: minuten };
}

/** Die Zahlen fuer das Wiki. */
function zusammenfassung(jeDatei, LZ, gruppe, F) {
  var werte = {}, jahre = {}, sitz = { regulaer: 0, vor: 0, nach: 0, ausserhalb: 0 }, kerzen = 0, bytes = 0;
  var erstesJahrVerschwundene = {};
  jeDatei.forEach(function (d) {
    werte[d.sym] = 1; kerzen += d.kerzen; bytes += d.bytes;
    var j = jahre[d.jahr] || (jahre[d.jahr] = { werte: 0, kerzen: 0 });
    j.werte++; j.kerzen += d.kerzen;
    Object.keys(sitz).forEach(function (k) { sitz[k] += d.sitzungen[k] || 0; });
  });
  var ersteJahre = {};
  jeDatei.forEach(function (d) { if (ersteJahre[d.sym] === undefined || d.jahr < ersteJahre[d.sym]) ersteJahre[d.sym] = d.jahr; });
  Object.keys(ersteJahre).forEach(function (sym) {
    if (gruppe && gruppe[sym.replace(/~2$/, '')] === 'verschwunden') erstesJahrVerschwundene[ersteJahre[sym]] = (erstesJahrVerschwundene[ersteJahre[sym]] || 0) + 1;
  });
  var fehlerEintraege = F && F.erledigt ? Object.keys(F.erledigt).filter(function (k) { return F.erledigt[k].fehler; }).length : null;
  return {
    stand: new Date().toISOString(),
    werte: Object.keys(werte).length, symbolJahre: jeDatei.length, kerzen: kerzen, bytes: bytes,
    jeJahr: jahre,
    sitzungen: sitz,
    anteile: kerzen ? { regulaer: Number((sitz.regulaer / kerzen).toFixed(4)), vor: Number((sitz.vor / kerzen).toFixed(4)), nach: Number((sitz.nach / kerzen).toFixed(4)), ausserhalb: Number((sitz.ausserhalb / kerzen).toFixed(4)) } : null,
    erstesJahrVerschwundene: erstesJahrVerschwundene,
    fortschritt: F ? { begonnen: F.begonnen, zuletzt: F.zuletzt, erledigt: Object.keys(F.erledigt || {}).length, leer: Object.keys(F.erledigt || {}).filter(function (k) { return F.erledigt[k].leer; }).length,
      fehlerEintraege: fehlerEintraege, fehlerZaehler: F.fehler || {}, abrufe: F.abrufe, wiederholt: F.wiederholt } : null,
    gruppen: gruppe ? Object.keys(gruppe).reduce(function (a, s) { a[gruppe[s]] = (a[gruppe[s]] || 0) + 1; return a; }, {}) : null,
  };
}

module.exports = { abtasten: abtasten, jahresdateien: jahresdateien, manifestSchreiben: manifestSchreiben, manifestPruefen: manifestPruefen,
  manifestNachfuehren: manifestNachfuehren, lueckenRechnen: lueckenRechnen, zusammenfassung: zusammenfassung, tagText: tagText, tagNr: tagNr };
