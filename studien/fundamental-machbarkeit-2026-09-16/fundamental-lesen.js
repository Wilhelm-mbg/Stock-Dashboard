'use strict';
/* Leser der Fundamentaltafel mit Sperrklinke gegen den Blick in die Zukunft.
 *
 *   var F = require('./fundamental-lesen.js');
 *   var t = F.oeffne();                       // Standardordner fundamentaltafel/ neben dieser Datei
 *   t.fundamentalAm('AAPL', '2024-05-06')     // juengstes 10-K/10-Q mit filed STRIKT VOR dem Tag, sonst null
 *
 * Regeln:
 *  - `tag` ist ein Handelstag als ISO-Datum 'JJJJ-MM-TT'. Geliefert wird das juengste Filing mit filed < tag; ein
 *    Filing vom selben Tag ist NICHT nutzbar (Einreichungen nach 17:30 ET tragen ohnehin den Folgetag als filed).
 *  - Sperrklinke: jeder Zugriff wird als {sym, tag, filed} protokolliert (protokoll()); liefert die Suche ein Filing
 *    mit filed >= tag, wirft der Leser - das darf nie eintreten und wird in test-fundamental.js mit konstruierten
 *    Filings (filed = tag muss werfen, filed = tag - 1 muss liefern) und 1.000 Zufallszugriffen geprueft.
 *  - Aktualitaets-Tor (MACHBARKEIT.md §4): ist das juengste Filing aelter als `maxAlterTage` (Vorgabe 456 = 15 Monate),
 *    kommt null - sonst zaehlen tote Jahresabschluesse verschwundener Reihen ewig weiter. Abschaltbar mit
 *    {maxAlterTage: null}.
 *  - Kuerzel -> CIK ueber _reihen.json (Panel der Machbarkeit: lebende ueber die SEC-Tickertabelle, verschwundene ueber
 *    die zeitgefensterte Volltextsuche der Studie verschwundene-gruende-2026-09-12). Mehrere Kuerzel je CIK sind
 *    moeglich (Umfirmierung); das Kuerzel mit ~2 (Wiederverwendung) wird zuerst exakt gesucht, dann die Basis.
 *
 * Zeilenformat: siehe bauen.js (roh, quartale, wege, summe4q, abgeleitet {roa, roaVor, fm, umsatzWachstum}, marken).
 */
var fs = require('fs');
var path = require('path');
var Z = require('./zuordnung.js');

var ISO = /^\d{4}-\d{2}-\d{2}$/;
function tageZwischen(a, b) { return Math.round((Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000); }

function oeffne(ordner, optionen) {
  ordner = ordner || path.join(__dirname, 'fundamentaltafel');
  var opt = Object.assign({ maxAlterTage: 456 }, optionen || {});
  var meta = JSON.parse(fs.readFileSync(path.join(ordner, '_reihen.json'), 'utf8'));
  var jeCik = new Map(), nZeilen = 0, dateien = [];
  fs.readdirSync(ordner).filter(function (f) { return /^tafel-\d{4}\.jsonl$/.test(f); }).sort().forEach(function (f) {
    dateien.push(f);
    var txt = fs.readFileSync(path.join(ordner, f), 'utf8'), a = txt.split('\n');
    for (var i = 0; i < a.length; i++) {
      if (!a[i]) continue;
      var z = JSON.parse(a[i]); nZeilen++;
      var l = jeCik.get(z.cik); if (!l) { l = []; jeCik.set(z.cik, l); }
      l.push(z);
    }
  });
  /* Reihenfolge je CIK: nach filed, dann accepted, dann adsh - dieselbe Ordnung wie der Bau (Rang) */
  jeCik.forEach(function (l) { l.sort(function (a, b) { return a.filed < b.filed ? -1 : a.filed > b.filed ? 1 : a.accepted < b.accepted ? -1 : a.accepted > b.accepted ? 1 : a.adsh < b.adsh ? -1 : 1; }); });

  var protokoll = [], zaehler = { zugriffe: 0, geliefert: 0, null_ohneReihe: 0, null_ohneFiling: 0, null_veraltet: 0 };
  function cikVon(sym) {
    var r = meta.reihen[sym] || meta.reihen[String(sym).replace(/~2$/, '')];
    return r && r.cik ? r.cik : null;
  }
  /* Suche: letzte Zeile mit filed < tag (binaer, filed ist ISO-Text und damit lexikografisch sortierbar) */
  function sucheRoh(cik, tag) {
    var l = jeCik.get(cik); if (!l) return null;
    var lo = 0, hi = l.length;
    while (lo < hi) { var m = (lo + hi) >> 1; if (l[m].filed < tag) lo = m + 1; else hi = m; }
    return lo > 0 ? l[lo - 1] : null;
  }
  /* Sperrklinke: protokolliert und wirft bei filed >= tag */
  function klinke(sym, tag, zeile) {
    protokoll.push({ sym: sym, tag: tag, filed: zeile ? zeile.filed : null });
    if (zeile && !(zeile.filed < tag)) throw new Error('Leck: Filing ' + zeile.adsh + ' filed ' + zeile.filed + ' fuer Tag ' + tag + ' (' + sym + ')');
    return zeile;
  }
  function fundamentalAm(sym, tag, o) {
    if (tag instanceof Date) tag = tag.toISOString().slice(0, 10);
    if (typeof tag === 'number') tag = new Date(tag).toISOString().slice(0, 10);
    if (!ISO.test(tag)) throw new Error('tag muss ISO-Datum sein: ' + tag);
    zaehler.zugriffe++;
    var cik = cikVon(sym);
    if (!cik) { zaehler.null_ohneReihe++; klinke(sym, tag, null); return null; }
    var z = klinke(sym, tag, sucheRoh(cik, tag));
    if (!z) { zaehler.null_ohneFiling++; return null; }
    var max = (o && o.maxAlterTage !== undefined) ? o.maxAlterTage : opt.maxAlterTage;
    if (max !== null && max !== undefined && tageZwischen(z.filed, tag) > max) { zaehler.null_veraltet++; return null; }
    zaehler.geliefert++;
    return z;
  }
  /** Alle Filings einer Reihe in Rangordnung (fuer Pruefungen; KEINE Sperrklinke - nicht im Ranking verwenden). */
  function alleFilings(sym) { var cik = cikVon(sym); return cik ? (jeCik.get(cik) || []) : []; }
  return { fundamentalAm: fundamentalAm, cikVon: cikVon, alleFilings: alleFilings, klinke: klinke, sucheRoh: sucheRoh,
    protokoll: function () { return protokoll; }, zaehler: zaehler, meta: meta, kennung: meta.kennung, zeilen: nZeilen, dateien: dateien, ciks: jeCik.size,
    sektorVonSic: Z.sektorVonSic, ordner: ordner };
}

var standard = null;
function fundamentalAm(sym, tag, o) { if (!standard) standard = oeffne(); return standard.fundamentalAm(sym, tag, o); }

module.exports = { oeffne: oeffne, fundamentalAm: fundamentalAm, sektorVonSic: Z.sektorVonSic, tageZwischen: tageZwischen };
