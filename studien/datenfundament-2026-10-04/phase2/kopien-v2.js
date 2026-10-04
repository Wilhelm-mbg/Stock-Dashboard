'use strict';
/* TEIL 2 - bereinigte Kopien v2 (Auftrag Nr. 86, Nachtrag 5.2). ERST ZAEHLEN, DANN SCHREIBEN.
 *
 * Neuer Ordner E:/Markt-Dashboard-Archiv/alpaca1m-bereinigt-v2/, Aufbau wie alpaca1m-bereinigt/ (<ordner>/<jahr>.json),
 * NUR fuer zwei Gruppen:
 *   (a) die Jahresdateien der Reihen mit einem vom Panelbau ABGELEHNTEN Split-Satz, der in der alten Kopie angewandt ist
 *       (../t5-saetze.json -> kopienBisExJahrListe): Saetze ohne Sprung in der Rohdatei werden NICHT angewandt; zeigt die
 *       Rohdatei den Sprung einen Handelstag NACH dem Tag im Satz, wird der Satz mit dem Ex-Tag auf dem Tag des Sprungs
 *       angewandt; alles andere (MFH: Faktor 0,9, Sprung nur am Tag davor) wird nicht angewandt. Massstab ist die
 *       Split-Sperre des Panels (K.SPLIT_SPERRE_*), keine neue Regel. Der Befund je Satz wird hier NACHGEZAEHLT.
 *   (b) die veralteten Kopien des Jahres 2026 (Rohdatei laeuft weiter, Kopie nicht): neu aus der Rohdatei bis zu ihrem
 *       heutigen Ende, mit den bekannten Massnahmen. Vorher: zeigt die Rohdatei NACH dem Ende der alten Kopie einen Sprung
 *       von Schluss zu naechster Eroeffnung um mehr als 40 % (regulaere Sitzung), bekommt die Reihe KEINE v2-Kopie.
 *
 * Die Ableitung (faktorAus, faktorenAus, ableiten, wirkungMs) ist eine KOPIE aus tools/alpaca-vollsammlung.js bzw.
 * tools/archiv-migration.js - das Werkzeug selbst wird weder geaendert noch geladen (es zieht Schluessel-Module nach).
 * Dass die Kopie gleich rechnet, zeigt der Zaehllauf: jede Kerze, die sich nicht aendern soll, ist bitgleich mit der
 * alten Kopie.
 *
 * Aufruf:  node --max-old-space-size=4096 kopien-v2.js --zaehlen      nur lesen; schreibt teil2-zaehllauf.json (dieser Ordner)
 *          node --max-old-space-size=4096 kopien-v2.js --schreiben    schreibt die v2-Dateien, _manifest.json, _regel.json
 *          node --max-old-space-size=4096 kopien-v2.js --pruefen      liest die GESCHRIEBENEN Dateien zurueck; teil2-pruefung.json
 */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var G = require('../gemeinsam.js');
var P = require('./p2.js');

var SPRUNG_SCHWELLE = 0.4;                                  // Gruppe (b): Schluss -> naechste Eroeffnung um mehr als 40 %

/* ---------- Zeit: erster Moment eines New Yorker Tages in UTC (Kopie von tools/archiv-migration.js nyNachUtc) ---------- */
var NYF = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
function nyTeile(ms) { var p = {}; NYF.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = Number(x.value); }); return { j: p.year, m: p.month, d: p.day, h: p.hour, min: p.minute }; }
function nyNachUtc(j, m, d, h, min) {
  var guess = Date.UTC(j, m - 1, d, h, min);
  for (var i = 0; i < 2; i++) {
    var p = nyTeile(guess);
    var wand = Date.UTC(p.j, p.m - 1, p.d, p.h, p.min);
    var soll = Date.UTC(j, m - 1, d, h, min);
    if (wand === soll) return guess;
    guess += soll - wand;
  }
  return guess;
}
function wirkungMs(datum) {
  var p = String(datum).split('-').map(Number);
  if (p.length !== 3 || !isFinite(p[0])) return null;
  return nyNachUtc(p[0], p[1], p[2], 0, 0);
}

/* ---------- Ableitung (Kopie aus tools/alpaca-vollsammlung.js, Zeilen 304-371) ---------- */
function faktorAus(e) {
  if (!e || !/split/.test(String(e._art))) return null;
  var alt = Number(e.old_rate), neu = Number(e.new_rate);
  if (isFinite(alt) && isFinite(neu) && alt > 0 && neu > 0) return neu / alt;
  return null;
}
function datumAus(e) { return (e && (e.ex_date || e.effective_date || e.process_date)) || null; }
function faktorenAus(saetze, gemessen) {
  var an = [], ohne = [], gm = {};
  (gemessen || []).forEach(function (g) {
    if (!g || !g.datum || !(Number(g.kursfaktor) > 0)) return;
    gm[String(g.art) + '|' + String(g.datum)] = g;
  });
  (saetze || []).forEach(function (e) {
    var d = datumAus(e), ms = d ? wirkungMs(d) : null;
    var art = String(e._art || '');
    if (/split/.test(art)) {
      var fk = faktorAus(e);
      if (fk === null || !ms || Math.abs(fk - 1) < 1e-9) { if (fk === null || !ms) ohne.push({ art: art, datum: d, grund: 'kein Faktor oder kein Datum' }); return; }
      an.push({ art: art, datum: d, ms: ms, faktor: fk, herkunft: 'quelle new_rate/old_rate' });
    } else if (/spin/.test(art)) {
      var g = gm[art + '|' + String(d)];
      if (g && ms) {
        var fg = Number(g.kursfaktor);
        if (Math.abs(fg - 1) >= 1e-9) an.push({ art: art, datum: d, ms: ms, faktor: fg, herkunft: g.herkunft || 'gemessen' });
        return;
      }
      ohne.push({ art: art, datum: d, grund: 'Abspaltung: Quelle liefert nur ein Stueckverhaeltnis, keinen Kursfaktor' });
    }
  });
  an.sort(function (a, b) { return a.ms - b.ms; });
  return { anwendbar: an, ohneFaktor: ohne };
}
function ableiten(serie, faktoren) {
  if (!faktoren || !faktoren.length) return serie.map(function (k) { return k.slice(); });
  var sortiert = faktoren.slice().sort(function (a, b) { return a.ms - b.ms; });
  return serie.map(function (k) {
    var f = 1;
    for (var i = 0; i < sortiert.length; i++) if (k[0] < sortiert[i].ms) f *= sortiert[i].faktor;
    if (f === 1) return k.slice();
    return [k[0], k[1] / f, k[2] * f, k[3] / f, k[4] / f, k[5] / f];
  });
}

/* ---------- v2-Regel: welche Saetze einer Reihe gelten ---------- */
/** faktoren: Ergebnis von faktorenAus().anwendbar; befunde: abgelehnte Saetze DIESER Reihe [{ex, art, faktor, sprungAmNachbartag}].
 *  Rueckgabe { anwendbar (mit ggf. verschobenem Ex-Tag), verworfen }. Reine Funktion. */
function v2Faktoren(faktoren, befunde) {
  var an = [], weg = [];
  faktoren.forEach(function (x) {
    var b = (befunde || []).filter(function (q) { return q.ex === x.datum && q.art === x.art; })[0] || null;
    var e = P.satzEntscheid(x, b);
    if (!e.anwenden) { weg.push({ art: x.art, datum: x.datum, faktor: x.faktor, herkunft: x.herkunft || null, grund: e.grund }); return; }
    if (e.verschoben) an.push({ art: x.art, datum: e.datum, ms: wirkungMs(e.datum), faktor: x.faktor, herkunft: x.herkunft || null, datumQuelle: x.datum, verschoben: 1, grund: e.grund });
    else an.push(x);
  });
  an.sort(function (a, b) { return a.ms - b.ms; });
  return { anwendbar: an, verworfen: weg };
}

/* ---------- Tagesschluesse der regulaeren Sitzung ---------- */
function tageRegulaer(h) {
  var aus = {}, s = h.series || [], reg = (h.sitzungen || []).filter(function (b) { return b.sitzung === 'regulaer'; }), bi = 0;
  for (var i = 0; i < s.length; i++) {
    var k = s[i], t = k[0];
    while (bi < reg.length && reg[bi].bis < t) bi++;
    if (bi >= reg.length || t < reg[bi].von) continue;
    if (!(k[1] > 0) || !(k[5] > 0)) continue;
    var tag = G.etTag(t), e = aus[tag] || (aus[tag] = { o: k[5], c: null, n: 0 });
    e.c = k[1]; e.n++;
  }
  return aus;
}
/** Erster Sprung Schluss -> naechste Eroeffnung ueber der Schwelle, dessen zweiter Tag NACH `nachTag` liegt. */
function sprungNach(tage, nachTag, schwelle) {
  var t = Object.keys(tage).sort();
  for (var i = 1; i < t.length; i++) {
    if (!(t[i] > nachTag)) continue;
    if (P.grosserSprung(tage[t[i - 1]].c, tage[t[i]].o, schwelle)) return { tagVor: t[i - 1], schluss: tage[t[i - 1]].c, tagAb: t[i], eroeffnung: tage[t[i]].o, verhaeltnis: Math.round(1e4 * tage[t[i]].o / tage[t[i - 1]].c) / 1e4 };
  }
  return null;
}

/* ---------- Dateien ---------- */
var rohMerk = {};
function rohLesen(ordner, jahr) {
  var p = G.ROH + '/' + ordner + '/' + jahr + '.json';
  if (rohMerk.p === p) return rohMerk.h;
  var h = fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
  rohMerk = { p: p, h: h };
  return h;
}
function massnahmenDatei(ordner) {
  var mp = G.MASSN + '/' + ordner + '.json';
  if (!fs.existsSync(mp) && /~2$/.test(ordner)) mp = G.MASSN + '/' + ordner.replace(/~2$/, '') + '.json';
  if (!fs.existsSync(mp)) return { saetze: [], gemesseneFaktoren: [], fehlt: true };
  return JSON.parse(fs.readFileSync(mp, 'utf8'));
}

/** Der eigene Befund zu einem abgelehnten Satz: zeigt die Rohdatei den Sprung am Ex-Tag, an einem Nachbartag (+-3)? */
function befundZaehlen(ordner, satz, kal) {
  var iAb = kal.idx[satz.ex]; if (iAb === undefined) iAb = kal.hIdx(satz.ex);
  var cache = {};
  function schluss(tag) {
    if (!tag) return null;
    var j = tag.slice(0, 4);
    if (cache[j] === undefined) { var p = G.ROH + '/' + ordner + '/' + j + '.json'; cache[j] = fs.existsSync(p) ? tageRegulaer(JSON.parse(fs.readFileSync(p, 'utf8'))) : null; }
    return cache[j] && cache[j][tag] ? cache[j][tag].c : null;
  }
  function nimm(i, schritt) { for (var q = 0; q < 5; q++) { var t = kal.tage[i + q * schritt]; if (!t) break; var c = schluss(t); if (c != null) return { tag: t, c: c }; } return null; }
  var rv = nimm(iAb - 1, -1), ra = nimm(iAb, 1);
  var amExTag = rv && ra ? P.zeigtSprung(ra.c / rv.c, satz.faktor) : null, nachbar = null;
  for (var d = -3; d <= 3; d++) {
    if (d === 0) continue;
    var a = schluss(kal.tage[iAb - 1 + d]), b = schluss(kal.tage[iAb + d]);
    if (a != null && b != null && P.zeigtSprung(b / a, satz.faktor)) nachbar = { tagVor: kal.tage[iAb - 1 + d], tagAb: kal.tage[iAb + d], verhaeltnis: Math.round(1e4 * b / a) / 1e4, versatzHandelstage: d };
  }
  return { ex: satz.ex, art: satz.art, faktor: satz.faktor, rohVerhaeltnis: rv && ra ? Math.round(1e4 * ra.c / rv.c) / 1e4 : null, rohZeigtSprung: amExTag, sprungAmNachbartag: nachbar };
}

/** Die Ziele beider Gruppen: [{ schluessel, ordner, jahr, gruppe }] und je Ordner die Befunde der abgelehnten Saetze. */
function ziele() {
  var s5 = G.json(path.join(G.HIER, 't5-saetze.json')), sy = G.symbole().ordner || {}, kal = G.kalender();
  var bm = G.json(G.BER + '/_manifest.json'), rm = G.json(G.ROH + '/_manifest.json');
  var liste = {}, befunde = {}, nachzaehlung = { saetze: 0, angewandtInAlterKopie: 0, ohneKopie: [], befundWieTrockenlauf: 0, befundAnders: [], ohneSprung: 0, sprungEinenTagDanach: [], sprungSonstAmNachbartag: [], amExTag: 0 };
  s5.saetze.forEach(function (s) {
    nachzaehlung.saetze++;
    if (s.angewandt !== 1) { nachzaehlung.ohneKopie.push(s.reihe + ' ' + s.ex); return; }
    nachzaehlung.angewandtInAlterKopie++;
    var ordner = sy[s.reihe] || s.reihe;
    var b = befundZaehlen(ordner, s, kal);
    var gleich = b.rohZeigtSprung === s.rohZeigtSprung && JSON.stringify(b.sprungAmNachbartag) === JSON.stringify(s.sprungAmNachbartag);
    if (gleich) nachzaehlung.befundWieTrockenlauf++; else nachzaehlung.befundAnders.push({ reihe: s.reihe, ex: s.ex, eigen: b, trockenlauf: { rohZeigtSprung: s.rohZeigtSprung, sprungAmNachbartag: s.sprungAmNachbartag } });
    if (b.rohZeigtSprung) nachzaehlung.amExTag++;
    else if (!b.sprungAmNachbartag) nachzaehlung.ohneSprung++;
    else if (b.sprungAmNachbartag.versatzHandelstage === 1) nachzaehlung.sprungEinenTagDanach.push(s.reihe + ' ' + s.ex + ' -> ' + b.sprungAmNachbartag.tagAb);
    else nachzaehlung.sprungSonstAmNachbartag.push(s.reihe + ' ' + s.ex + ' (Versatz ' + b.sprungAmNachbartag.versatzHandelstage + ', Faktor ' + s.faktor + ')');
    (befunde[ordner] = befunde[ordner] || []).push(b);
    /* jede vorhandene alte Kopie der Reihe bis zum Ex-Jahr */
    Object.keys(bm.eintraege).forEach(function (k) { if (k.indexOf(ordner + '/') === 0 && Number(k.split('/')[1].slice(0, 4)) <= Number(s.ex.slice(0, 4))) liste[k] = { schluessel: k, ordner: ordner, jahr: Number(k.split('/')[1].slice(0, 4)), gruppe: 'a', reihe: s.reihe }; });
    var soll = s.kopienBisExJahrListe.slice().sort().join(','), ist = Object.keys(liste).filter(function (k) { return liste[k].ordner === ordner; }).sort().join(',');
    if (soll !== ist) nachzaehlung.befundAnders.push({ reihe: s.reihe, ex: s.ex, dateilisteAnders: { soll: soll, ist: ist } });
  });
  var nA = Object.keys(liste).length;
  Object.keys(bm.eintraege).forEach(function (k) {
    if (!/\/2026\.json$/.test(k) || !rm.eintraege[k] || !(rm.eintraege[k].letzter > bm.eintraege[k].letzter)) return;
    if (liste[k]) liste[k].gruppe = 'a+b'; else liste[k] = { schluessel: k, ordner: k.split('/')[0], jahr: 2026, gruppe: 'b' };
  });
  var alle = Object.keys(liste).sort().map(function (k) { return liste[k]; });
  return { ziele: alle, befunde: befunde, nachzaehlung: nachzaehlung, dateienA: nA, dateienB: alle.filter(function (z) { return z.gruppe !== 'a'; }).length,
    bm: bm, rm: rm, reihenA: Object.keys(befunde).length };
}

/** Eine v2-Datei bauen (ohne zu schreiben) und mit der alten Kopie vergleichen. */
function baue(z, Zl, standLauf) {
  var h = rohLesen(z.ordner, z.jahr);
  if (!h) return { fehler: 'Rohdatei fehlt' };
  var m = massnahmenDatei(z.ordner), fq = faktorenAus(m.saetze, m.gemesseneFaktoren);
  if (fq.ohneFaktor.length) return { fehler: 'Massnahme ohne Kursfaktor (' + fq.ohneFaktor[0].art + ' ' + fq.ohneFaktor[0].datum + ') - die alte Regel laesst die Reihe aus der Kopie' };
  var v = v2Faktoren(fq.anwendbar, Zl.befunde[z.ordner] || []);
  var roh = h.series, rm = Zl.rm.eintraege[z.schluessel], bmE = Zl.bm.eintraege[z.schluessel];
  var ber = { schluessel: z.schluessel, gruppe: z.gruppe, kerzenRoh: roh.length, rohLetzterTag: roh.length ? G.etTag(roh[roh.length - 1][0]) : null,
    altLetzterTag: bmE ? G.etTag(bmE.letzter) : null, kerzenAlt: bmE ? bmE.kerzen : null };
  if (rm && (rm.kerzen !== roh.length || rm.letzter !== roh[roh.length - 1][0])) ber.rohWeichtVomManifestAb = { manifestKerzen: rm.kerzen, dateiKerzen: roh.length };
  /* Gruppe (b): Sprung nach dem Ende der alten Kopie? */
  if (z.gruppe !== 'a') {
    var sp = sprungNach(tageRegulaer(h), ber.altLetzterTag, SPRUNG_SCHWELLE);
    if (sp) { ber.ausgenommen = sp; return { bericht: ber }; }
  }
  var neu = ableiten(roh, v.anwendbar);
  var angewandt = v.anwendbar.filter(function (x) { return roh.length && roh[0][0] < x.ms; });
  var verworfenHier = v.verworfen.filter(function (x) { return roh.length && roh[0][0] < wirkungMs(x.datum); });
  ber.angewandt = angewandt.map(function (x) { return x.art + ' ' + x.datum + ' x' + x.faktor + (x.verschoben ? ' (Satz: ' + x.datumQuelle + ')' : ''); });
  ber.verworfen = verworfenHier.map(function (x) { return x.art + ' ' + x.datum + ' x' + x.faktor; });
  var hb = {
    sym: h.sym,
    quelle: 'abgeleitet aus alpaca1m/' + z.schluessel + ' + alpaca-massnahmen/' + z.ordner.replace(/~2$/, '') + '.json (v2: Split-Sperre des Panels, Auftrag Nr. 86)',
    format: h.format, felder: h.felder,
    quellen: [{ von: neu[0][0], bis: neu[neu.length - 1][0], quelle: 'alpaca', abgeleitet: 'bereinigt' }],
    waehrung: h.waehrung || 'USD',
    stand: standLauf,
    series: neu,
    abgeleitet: 'bereinigt',
    jahr: h.jahr,
    sitzungen: h.sitzungen,
    massnahmen: angewandt.map(function (x) {
      var o = { art: x.art, datum: x.datum, faktor: x.faktor, herkunft: x.herkunft || null };
      if (x.verschoben) { o.datumQuelle = x.datumQuelle; o.verschoben = 1; o.grund = x.grund; }
      return o;
    }),
    v2: { kennung: P.KENNUNG_KOPIEN, gruppe: z.gruppe,
      rohStand: { datei: 'alpaca1m/' + z.schluessel, stand: h.stand || null, kerzen: roh.length, letzter: roh[roh.length - 1][0], letzterTag: ber.rohLetzterTag, sha256Manifest: rm ? rm.sha256 : null, manifestStand: Zl.rm.stand },
      verworfen: verworfenHier,
      alteKopie: bmE ? { datei: 'alpaca1m-bereinigt/' + z.schluessel, kerzen: bmE.kerzen, letzterTag: ber.altLetzterTag, sha256Manifest: bmE.sha256 } : null,
      regel: 'Split-Saetze, die die Split-Sperre des Panels ablehnt (kein Sprung in der Rohdatei), werden nicht angewandt; zeigt die Rohdatei den Sprung einen Handelstag nach dem Tag im Satz, gilt der Tag des Sprungs.' }
  };
  /* ---- Vergleich mit der alten Kopie, Kerze fuer Kerze (ueber den Stempel) ---- */
  var altP = G.BER + '/' + z.schluessel, alt = fs.existsSync(altP) ? JSON.parse(fs.readFileSync(altP, 'utf8')).series : null;
  if (alt) {
    var c = vergleiche(neu, alt, v, z.gruppe);
    Object.keys(c).forEach(function (k) { ber[k] = c[k]; });
  }
  return { huelle: hb, bericht: ber };
}

/** Kerze fuer Kerze: v2 gegen alt. Erwartete Aenderung je Kerze = Produkt der Faktoren, die alt anwandte und v2 nicht
 *  (verworfen: Ex-Tag nach der Kerze), bzw. 1/Faktor zwischen altem und verschobenem Ex-Tag. */
function vergleiche(neu, alt, v, gruppe) {
  var c = { kerzenV2: neu.length, gleich: 0, geaendert: 0, geaendertWieErwartet: 0, geaendertUnerwartet: 0, nurInAlt: 0, nurInV2: 0, groessteAenderungPct: 0,
    ersterGeaenderterTag: null, letzterGeaenderterTag: null, geaendertNachExTag: 0 };
  var regeln = [];                                             // [{vonMs, bisMs, v2DurchAlt}]
  v.verworfen.forEach(function (x) { regeln.push({ vonMs: -Infinity, bisMs: wirkungMs(x.datum), f: x.faktor }); });
  v.anwendbar.forEach(function (x) { if (x.verschoben) regeln.push({ vonMs: wirkungMs(x.datumQuelle), bisMs: x.ms, f: 1 / x.faktor }); });
  var grenze = regeln.reduce(function (m, r) { return Math.max(m, r.bisMs); }, -Infinity);
  var i = 0, j = 0;
  while (i < neu.length || j < alt.length) {
    if (j >= alt.length || (i < neu.length && neu[i][0] < alt[j][0])) { c.nurInV2++; i++; continue; }
    if (i >= neu.length || alt[j][0] < neu[i][0]) { c.nurInAlt++; j++; continue; }
    var a = alt[j], n = neu[i], t = n[0];
    if (a[1] === n[1] && a[2] === n[2] && a[3] === n[3] && a[4] === n[4] && a[5] === n[5]) c.gleich++;
    else {
      c.geaendert++;
      var soll = 1; for (var q = 0; q < regeln.length; q++) if (t >= regeln[q].vonMs && t < regeln[q].bisMs) soll *= regeln[q].f;
      var ok = soll !== 1;
      for (var s = 1; s <= 5 && ok; s++) { if (s === 2) { if (Math.abs(n[2] * soll / a[2] - 1) > 1e-9 && !(a[2] === 0 && n[2] === 0)) ok = false; } else if (Math.abs(n[s] / (a[s] * soll) - 1) > 1e-9) ok = false; }
      if (ok) c.geaendertWieErwartet++; else c.geaendertUnerwartet++;
      var pct = Math.abs(n[1] / a[1] - 1) * 100; if (pct > c.groessteAenderungPct) c.groessteAenderungPct = pct;
      var tag = G.etTag(t); if (!c.ersterGeaenderterTag) c.ersterGeaenderterTag = tag; c.letzterGeaenderterTag = tag;
      if (t >= grenze) c.geaendertNachExTag++;
    }
    i++; j++;
  }
  c.groessteAenderungPct = Math.round(c.groessteAenderungPct * 100) / 100;
  if (gruppe !== 'a') c.bisEndeAlterKopieGleich = c.geaendert === 0 && c.nurInAlt === 0;
  return c;
}

function sha(t) { return crypto.createHash('sha256').update(t).digest('hex'); }

function main() {
  var arg = process.argv.slice(2), schreiben = arg.indexOf('--schreiben') !== -1, pruefen = arg.indexOf('--pruefen') !== -1;
  if (pruefen) return pruefe();
  var Zl = ziele(), standLauf = new Date().toISOString(), zeilen = [], manifest = {};
  var S = { stand: standLauf, modus: schreiben ? 'schreiben' : 'zaehlen (nichts geschrieben)', ziel: P.BER2, dateienGesamt: Zl.ziele.length, dateienA: Zl.dateienA, reihenA: Zl.reihenA, dateienB: Zl.dateienB,
    nachzaehlung: Zl.nachzaehlung, gebaut: 0, geschrieben: 0, ausgenommen: [], fehler: [], kerzenV2: 0, kerzenGeaendert: 0, kerzenGeaendertUnerwartet: 0, kerzenNeu: 0, kerzenNurInAlt: 0, bytes: 0,
    a: { dateien: 0, dateienMitAenderung: 0, dateienOhneAenderung: 0, kerzenGeaendert: 0, geaendertNachExTag: 0, ohneAngewandteMassnahme: 0 },
    b: { dateien: 0, kerzenBisAltGleich: 0, kerzenGeaendert: 0, kerzenNeu: 0, alleBisEndeAlterKopieGleich: true } };
  if (schreiben && !fs.existsSync(P.BER2)) fs.mkdirSync(P.nurNeu(P.BER2 + '/').replace(/\/$/, ''));
  Zl.ziele.forEach(function (z, n) {
    var r;
    try { r = baue(z, Zl, standLauf); } catch (e) { r = { fehler: String(e.message).slice(0, 200) }; }
    if (r.fehler) { S.fehler.push({ schluessel: z.schluessel, fehler: r.fehler }); return; }
    var b = r.bericht; zeilen.push(b);
    if (b.ausgenommen) { S.ausgenommen.push({ schluessel: z.schluessel, sprung: b.ausgenommen }); return; }
    S.gebaut++; S.kerzenV2 += b.kerzenV2 || 0; S.kerzenGeaendert += b.geaendert || 0; S.kerzenGeaendertUnerwartet += b.geaendertUnerwartet || 0; S.kerzenNeu += b.nurInV2 || 0; S.kerzenNurInAlt += b.nurInAlt || 0;
    if (z.gruppe === 'a') { S.a.dateien++; if (b.geaendert) S.a.dateienMitAenderung++; else S.a.dateienOhneAenderung++; S.a.kerzenGeaendert += b.geaendert; S.a.geaendertNachExTag += b.geaendertNachExTag; if (!r.huelle.massnahmen.length) S.a.ohneAngewandteMassnahme++; }
    else { S.b.dateien++; S.b.kerzenBisAltGleich += b.gleich; S.b.kerzenGeaendert += b.geaendert; S.b.kerzenNeu += b.nurInV2; if (!b.bisEndeAlterKopieGleich) S.b.alleBisEndeAlterKopieGleich = false; }
    var text = JSON.stringify(r.huelle);
    b.bytes = Buffer.byteLength(text); S.bytes += b.bytes;
    if (schreiben) {
      var ziel = P.nurNeu(P.BER2 + '/' + z.schluessel), dir = path.dirname(ziel);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      P.atomar(ziel, text);
      S.geschrieben++;
      manifest[z.schluessel] = { sym: r.huelle.sym, jahr: z.jahr, gruppe: z.gruppe, bytes: b.bytes, sha256: sha(text), kerzen: r.huelle.series.length, erster: r.huelle.series[0][0], letzter: r.huelle.series[r.huelle.series.length - 1][0],
        rohLetzter: r.huelle.v2.rohStand.letzter, rohSha256: r.huelle.v2.rohStand.sha256Manifest, angewandt: r.huelle.massnahmen.length, verworfen: r.huelle.v2.verworfen.length };
    }
    if ((n + 1) % 40 === 0) console.log((n + 1) + '/' + Zl.ziele.length + ' ...');
  });
  S.groessteAenderungJeDatei = zeilen.filter(function (b) { return b.geaendert; }).map(function (b) { return { schluessel: b.schluessel, pct: b.groessteAenderungPct, kerzen: b.geaendert }; }).sort(function (x, y) { return y.pct - x.pct; }).slice(0, 12);
  if (schreiben) {
    P.atomar(P.nurNeu(P.BER2 + '/_manifest.json'), JSON.stringify({ kennung: P.KENNUNG_KOPIEN, stand: standLauf, wurzel: 'alpaca1m-bereinigt-v2', rohManifestStand: Zl.rm.stand, dateien: Object.keys(manifest).length,
      kerzen: S.kerzenV2, bytes: S.bytes, hash: 'sha256', ausgenommen: S.ausgenommen, eintraege: manifest }));
    P.atomar(P.nurNeu(P.BER2 + '/_regel.json'), JSON.stringify({ kennung: P.KENNUNG_KOPIEN, stand: standLauf,
      leseregel: 'Bereinigte Kurse = die Datei HIER, falls vorhanden UND so lang wie die Rohdatei (rohLetzter im Manifest gegen alpaca1m/_manifest.json); sonst die gleichnamige unter alpaca1m-bereinigt/, wenn sie so weit reicht wie die Rohdatei; sonst - gibt es keine Kopie - die Rohdatei. Eine Kopie, die kuerzer ist als die Rohdatei, wird NICHT still gelesen (leser2.js bricht ab).',
      inhalt: 'NUR zwei Gruppen: (a) Jahresdateien der Reihen mit einem vom Panelbau abgelehnten Split-Satz (Satz nicht angewandt bzw. Ex-Tag auf den Tag des Sprungs gesetzt), (b) die am ' + standLauf.slice(0, 10) + ' veralteten Kopien des Jahres 2026, neu bis zum Ende der Rohdatei.',
      fortschreibung: 'Die Kopien des laufenden Jahres veralten mit jedem Nachlauf der Rohdateien. Neu bilden: node kopien-v2.js --schreiben (studien/datenfundament-2026-10-04/phase2/). Das Massnahmen-Archiv endet am 03.09.2026 - ein Split danach ist hier NICHT bereinigt.',
      ausgenommen: S.ausgenommen, verworfeneSaetze: Zl.nachzaehlung, bau: 'studien/datenfundament-2026-10-04/phase2/kopien-v2.js' }, null, 1));
  }
  P.schreibe(schreiben ? 'teil2-schreiblauf.json' : 'teil2-zaehllauf.json', { zahlen: S, dateien: zeilen });
  console.log(JSON.stringify(S, null, 1));
}

/** Liest die GESCHRIEBENEN v2-Dateien zurueck und prueft sie gegen die alte Kopie und die Rohdatei. */
function pruefe() {
  var Zl = ziele(), man = G.json(P.BER2 + '/_manifest.json');
  var Pz = { stand: new Date().toISOString(), dateienImManifest: Object.keys(man.eintraege).length, dateienGeprueft: 0, sha256Stimmt: 0, kopfVollstaendig: 0,
    a: { dateien: 0, reihen: {}, kerzenNachExTagAnders: 0, kerzenDavorWieErwartet: 0, kerzenUnerwartet: 0, stichprobeKerzen: 0, stichprobeOk: 0, dateienOhneAenderung: 0 },
    b: { dateien: 0, kerzenBisAltVerglichen: 0, kerzenBisAltAnders: 0, nurInAlt: 0, reichtBisRohEnde: 0, aktienreihen: 0 }, ausgenommen: man.ausgenommen, fehler: [] };
  var aktie = {}; G.reihen().reihen.forEach(function (r) { aktie[r.ordner] = 1; });
  Zl.ziele.forEach(function (z) {
    var e = man.eintraege[z.schluessel];
    if (!e) { if (!man.ausgenommen.some(function (x) { return x.schluessel === z.schluessel; })) Pz.fehler.push(z.schluessel + ': fehlt im v2-Manifest und ist nicht ausgenommen'); return; }
    var text = fs.readFileSync(P.BER2 + '/' + z.schluessel, 'utf8'), j = JSON.parse(text);
    Pz.dateienGeprueft++;
    if (sha(text) === e.sha256) Pz.sha256Stimmt++;
    if (j.quelle && j.v2 && j.v2.rohStand && j.v2.rohStand.letzter && Array.isArray(j.massnahmen) && Array.isArray(j.v2.verworfen) && j.abgeleitet === 'bereinigt' && j.jahr === z.jahr) Pz.kopfVollstaendig++;
    var alt = JSON.parse(fs.readFileSync(G.BER + '/' + z.schluessel, 'utf8')).series, roh = rohLesen(z.ordner, z.jahr).series;
    var m = massnahmenDatei(z.ordner), v = v2Faktoren(faktorenAus(m.saetze, m.gemesseneFaktoren).anwendbar, Zl.befunde[z.ordner] || []);
    var c = vergleiche(j.series, alt, v, z.gruppe);
    if (z.gruppe === 'a') {
      Pz.a.dateien++; Pz.a.reihen[z.ordner] = 1; Pz.a.kerzenNachExTagAnders += c.geaendertNachExTag; Pz.a.kerzenDavorWieErwartet += c.geaendertWieErwartet; Pz.a.kerzenUnerwartet += c.geaendertUnerwartet + c.nurInAlt + c.nurInV2;
      if (!c.geaendert) Pz.a.dateienOhneAenderung++;
      /* Stichprobe des Auftrags: erste, mittlere, letzte Kerze - gegen die ROHDATEI nachgerechnet (unabhaengig von vergleiche()) */
      [0, Math.floor(j.series.length / 2), j.series.length - 1].forEach(function (i) {
        var k = j.series[i], r = roh[i], f = 1;
        v.anwendbar.forEach(function (x) { if (k[0] < x.ms) f *= x.faktor; });
        Pz.a.stichprobeKerzen++;
        if (r && r[0] === k[0] && Math.abs(k[1] * f / r[1] - 1) < 1e-12 && Math.abs(k[5] * f / r[5] - 1) < 1e-12) Pz.a.stichprobeOk++;
      });
    } else {
      Pz.b.dateien++; if (aktie[z.ordner]) Pz.b.aktienreihen++;
      Pz.b.kerzenBisAltVerglichen += c.gleich + c.geaendert; Pz.b.kerzenBisAltAnders += c.geaendert; Pz.b.nurInAlt += c.nurInAlt;
      if (j.series[j.series.length - 1][0] === roh[roh.length - 1][0] && j.series.length === roh.length) Pz.b.reichtBisRohEnde++;
    }
  });
  Pz.a.reihen = Object.keys(Pz.a.reihen).length;
  Pz.bestanden = !Pz.fehler.length && Pz.sha256Stimmt === Pz.dateienGeprueft && Pz.kopfVollstaendig === Pz.dateienGeprueft && Pz.a.kerzenNachExTagAnders === 0 && Pz.a.kerzenUnerwartet === 0
    && Pz.a.stichprobeOk === Pz.a.stichprobeKerzen && Pz.b.kerzenBisAltAnders === 0 && Pz.b.nurInAlt === 0 && Pz.b.reichtBisRohEnde === Pz.b.dateien;
  P.schreibe('teil2-pruefung.json', Pz);
  console.log(JSON.stringify(Pz, null, 1));
}

module.exports = { wirkungMs: wirkungMs, faktorenAus: faktorenAus, ableiten: ableiten, v2Faktoren: v2Faktoren, tageRegulaer: tageRegulaer, sprungNach: sprungNach, vergleiche: vergleiche, SPRUNG_SCHWELLE: SPRUNG_SCHWELLE };
if (require.main === module) main();
