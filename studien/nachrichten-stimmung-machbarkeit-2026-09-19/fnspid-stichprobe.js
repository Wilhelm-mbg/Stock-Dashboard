'use strict';
/* Machbarkeit Nachrichten-Stimmung (19.09.2026), §1.2: Stichprobe aus FNSPID-CSV-Teilstücken (HTTP-Range, ≤ 25 MB je Datei).
 * Eigener CSV-Leser (Anführungszeichen, doppelte Anführungszeichen, Zeilenumbrüche im Feld); der letzte, abgeschnittene Satz fällt weg.
 * Zählt Zeilen, Symbole, Publisher, Stempel-Auflösung; gibt bis 20 Zeilen je gesuchtem Symbol (Datum, Publisher, Titel gekürzt).
 * KEINE Bewertung einer Schlagzeile. Simulation, keine Anlageberatung.
 * Aufruf: node fnspid-stichprobe.js <teil.csv> [<teil.csv> ...] [--universum universum-je-jahr.json]  -> fnspid-stichprobe.json */
var fs = require('fs'), path = require('path');
var argv = process.argv.slice(2), uniPfad = null, dateien = [];
for (var i = 0; i < argv.length; i++) { if (argv[i] === '--universum') uniPfad = argv[++i]; else dateien.push(argv[i]); }
var SUCHE = ['AAPL', 'AAON', 'AAP', 'ACGL', 'ACHC'];
function csv(txt) {
  var saetze = [], feld = '', satz = [], q = false, i = 0, n = txt.length;
  while (i < n) {
    var c = txt[i];
    if (q) { if (c === '"') { if (txt[i + 1] === '"') { feld += '"'; i++; } else q = false; } else feld += c; }
    else if (c === '"') q = true;
    else if (c === ',') { satz.push(feld); feld = ''; }
    else if (c === '\n') { satz.push(feld); saetze.push(satz); satz = []; feld = ''; }
    else if (c !== '\r') feld += c;
    i++;
  }
  return saetze;                                              /* der letzte Satz ohne Zeilenende ist abgeschnitten und fällt weg */
}
var aus = { stand: new Date().toISOString(), dateien: [], suche: {} };
SUCHE.forEach(function (s) { aus.suche[s] = { zeilen: 0, beispiele: [] }; });
var U = uniPfad ? JSON.parse(fs.readFileSync(uniPfad, 'utf8')) : null;
dateien.forEach(function (f) {
  var txt = fs.readFileSync(f, 'utf8'), S = csv(txt), kopf = S[0], iD = kopf.indexOf('Date'), iT = kopf.indexOf('Article_title'), iS = kopf.indexOf('Stock_symbol'), iP = kopf.indexOf('Publisher');
  var d = { datei: path.basename(f), bytes: txt.length, kopf: kopf.slice(0, 12), saetze: S.length - 1, felderUngleich: 0, symbole: {}, publisher: {}, monate: {}, stempel: { mitUhrzeit: 0, mitternacht: 0, leer: 0 }, ohneSymbol: 0, min: null, max: null };
  for (var k = 1; k < S.length; k++) {
    var r = S[k]; if (r.length !== kopf.length) { d.felderUngleich++; continue; }
    var dt = r[iD] || '', sym = r[iS] || '', pub = r[iP] || '';
    if (!dt) d.stempel.leer++; else if (/ 00:00:00/.test(dt)) d.stempel.mitternacht++; else d.stempel.mitUhrzeit++;
    if (dt) { if (!d.min || dt < d.min) d.min = dt; if (!d.max || dt > d.max) d.max = dt; var mo = dt.slice(0, 7); d.monate[mo] = (d.monate[mo] || 0) + 1; }
    if (!sym) d.ohneSymbol++; else d.symbole[sym] = (d.symbole[sym] || 0) + 1;
    d.publisher[pub] = (d.publisher[pub] || 0) + 1;
    if (aus.suche[sym]) { aus.suche[sym].zeilen++; if (aus.suche[sym].beispiele.length < 20) aus.suche[sym].beispiele.push([dt, pub, (r[iT] || '').slice(0, 80)].join(' | ')); }
  }
  d.symboleAnzahl = Object.keys(d.symbole).length;
  d.publisherTop = Object.keys(d.publisher).sort(function (a, b) { return d.publisher[b] - d.publisher[a]; }).slice(0, 6).map(function (p) { return p + ':' + d.publisher[p]; });
  /* Abdeckung je Klasse für die Monate im Teilstück: Anteil der Panel-Symbole (Universum des Jahres) mit ≥ 1 Zeile im Monat.
   * Die Dateien sind nach Symbol sortiert; ein Teilstück enthält nur den alphabetischen Bereich [erstes, letztes Symbol].
   * Deshalb wird die Panel-Liste auf diesen Bereich beschränkt (das letzte Symbol ist angeschnitten und fällt weg). */
  if (U) {
    var syms = Object.keys(d.symbole).sort(), von = syms[0], bis = syms[syms.length - 1];
    d.abdeckungBereich = { von: von, bis: bis, symboleImTeilstueck: syms.length };
    d.abdeckung = {};
    Object.keys(d.monate).forEach(function (mo) {
      var jahr = mo.slice(0, 4), L = U.jahre[jahr]; if (!L) return;
      var symsImMonat = {};
      for (var k2 = 1; k2 < S.length; k2++) { var r2 = S[k2]; if (r2.length === kopf.length && (r2[iD] || '').slice(0, 7) === mo && r2[iS]) symsImMonat[r2[iS]] = 1; }
      d.abdeckung[mo] = {};
      [1, 2, 3].forEach(function (kl) {
        var lst = (L[kl] || []).filter(function (s) { return s >= von && s < bis; }), mit = lst.filter(function (s) { return symsImMonat[s]; }).length;
        d.abdeckung[mo][kl] = { panelImBereich: lst.length, mitZeile: mit, anteil: lst.length ? +(mit / lst.length).toFixed(3) : null };
      });
    });
    /* Je Jahr: mittlerer Anteil über die vollständigen Monate des Jahres. */
    d.abdeckungJeJahr = {};
    Object.keys(d.abdeckung).sort().forEach(function (mo) { var j = mo.slice(0, 4); var e = d.abdeckungJeJahr[j] = d.abdeckungJeJahr[j] || { monate: 0, 1: 0, 2: 0, 3: 0 }; e.monate++; [1, 2, 3].forEach(function (kl) { e[kl] += d.abdeckung[mo][kl].anteil || 0; }); });
    Object.keys(d.abdeckungJeJahr).forEach(function (j) { var e = d.abdeckungJeJahr[j]; [1, 2, 3].forEach(function (kl) { e[kl] = +(e[kl] / e.monate).toFixed(3); }); });
  }
  var symTop = Object.keys(d.symbole).sort(function (a, b) { return d.symbole[b] - d.symbole[a]; }).slice(0, 8).map(function (s) { return s + ':' + d.symbole[s]; });
  d.symboleTop = symTop; delete d.symbole; delete d.publisher;
  aus.dateien.push(d);
});
fs.writeFileSync(path.join(__dirname, 'fnspid-stichprobe.json'), JSON.stringify(aus, null, 1));
process.stdout.write(JSON.stringify(aus, null, 1) + '\n');
