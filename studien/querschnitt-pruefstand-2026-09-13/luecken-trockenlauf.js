'use strict';
/* LUECKEN-TROCKENLAUF - Panel v2.2, Phase 1 (Auftrag Nr. 64, 03.10.2026): verklebte Reihen FINDEN und EINORDNEN.
 *
 * BEFUND (Mehrfaktor-Vorregistrierung §11 Nachtrag 2): das Panel v2.1 fuehrt je Kuerzel eine Reihe und trennt nur dort,
 * wo die Massnahmendatei einen name_changes-Satz kennt (~2-Reihen). Liegt zwischen zwei Panelzeilen derselben Reihe
 * mehr als ein Vierteljahr, sind das meist zwei Papiere (SN: Sanchez Energy bis 2019, SharkNinja ab 2023).
 *
 * DIESES SKRIPT LIEST NUR (Panel voll/, Archiv E:, massive/verschwundene.json) und schreibt zwei Dateien neben sich:
 * luecken-kandidaten.json und LUECKEN-TROCKENLAUF.md. Es aendert nichts am Panel und entscheidet nichts - die
 * Einordnung Fall I-IV ist ein VORSCHLAG mit Beleg je Luecke; die Regel legt der PM fest (Phase 2 ist ein eigener Auftrag).
 * Deterministisch: kein Zeitstempel, feste Saat fuer die Zufallsauswahl.
 *
 * Einheiten: Lueckenlaenge = KALENDERTAGE zwischen den ISO-Daten zweier aufeinanderfolgender Panelzeilen einer Reihe;
 * "Zeilen" = Panelzeilen der Reihe (Handelstage mit Daten).
 *
 * Aufruf (aus diesem Ordner oder der Repo-Wurzel):  node luecken-trockenlauf.js
 */
var fs = require('fs'), path = require('path'), crypto = require('crypto');
var K = require('./konfig.js');
var PR = require('./pruefstand.js');

var P = { schwelleTage: 90, kurzVon: 30, fensterTage: 60, anschluss: [0.5, 2.0], polygonVorlaufTage: 10,
  minVortage: K.MIN_VORTAGE, fensterZeilen: 252, umsatzZeilen: 20, klassen: [1, 2, 3], jahrVon: 2017, jahrBis: 2026,
  saat: 'luecken-2026-10-03', laengste: 30, zufall: 20,
  /* fuenf bekannte Faelle fuer die Probe des Kursanschlusses (§1a.3); der fuenfte ist die Reihe eigener Wahl */
  fuenf: [['SN', 'I'], ['MBLY', 'II'], ['CHK', 'II'], ['DOW', 'II'], ['EBR', 'III']],
  yahooNachlaufTage: 10, abPunktVorlaufTage: 10,
  pmZaehlung: { 90: 140, 180: 121, 365: 101 } };
var TAG = 86400000;
var POLYGON = path.join(__dirname, '..', '..', '..', 'Markt-Dashboard-Daten', 'massive', 'verschwundene.json');
var AUS_JSON = path.join(__dirname, 'luecken-kandidaten.json'), AUS_MD = path.join(__dirname, 'LUECKEN-TROCKENLAUF.md');

function ms(iso) { return Date.parse(iso + 'T00:00:00Z'); }
function plus(iso, t) { return new Date(ms(iso) + t * TAG).toISOString().slice(0, 10); }
function tage(a, b) { return Math.round((ms(b) - ms(a)) / TAG); }
function lies(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }
function rund(x, n) { var f = Math.pow(10, n); return Math.round(x * f) / f; }

/* ---------- Panel: Zeilen je Reihe (Zeilen liegen in der Ordnung Tag, Symbol) ---------- */
var T = PR.Tafel(path.join(__dirname, 'voll')), g = T.g, N = g.n, nSym = T.nSym, iso = T.kal.tage;
var start = new Int32Array(nSym + 1), r, s;
for (r = 0; r < N; r++) start[g.sym[r] + 1]++;
for (s = 0; s < nSym; s++) start[s + 1] += start[s];
var zeilen = new Int32Array(N), stelle = start.slice(0, nSym);
for (r = 0; r < N; r++) zeilen[stelle[g.sym[r]]++] = r;
var tagMs = iso.map(ms);
function abstand(r1, r2) { return Math.round((tagMs[g.tag[r2]] - tagMs[g.tag[r1]]) / TAG); }

/* ---------- Quellen ---------- */
var polyRoh = lies(POLYGON), poly = {}, polyZ = { eintraege: polyRoh.eintraege.length, mitBis: 0, mitVon: 0, doppelt: 0, doppeltVerschieden: 0 };
polyRoh.eintraege.forEach(function (e) {
  if (e.bis) polyZ.mitBis++; if (e.von) polyZ.mitVon++;
  var L = poly[e.sym] = poly[e.sym] || [];
  if (L.length) { polyZ.doppelt++; if (!L.some(function (x) { return x.name === e.name && x.cik === e.cik; })) polyZ.doppeltVerschieden++; }
  if (!L.some(function (x) { return x.name === e.name && x.cik === e.cik; })) L.push({ name: e.name, bis: e.bis || null, cik: e.cik || null, boerse: e.boerse, art: e.art });
});
polyZ.kuerzel = Object.keys(poly).length; polyZ.schluessel = Object.keys(polyRoh.eintraege[0]);
var LEB = lies(path.join(K.ORTE.roh(), '_lebenszeit.json')).werte;
var ORDNER = lies(path.join(K.ORTE.roh(), '_symbole.json')).ordner || {};
var KW = lies(path.join(__dirname, 'kuerzelwechsel-kandidaten.json')), v21 = {};
KW.trennungen.forEach(function (t) { v21[t.basis] = t; });
var mCache = {};
function massnahmen(basis) {
  if (mCache[basis] !== undefined) return mCache[basis];
  var p = path.join(K.ORTE.massnahmen(), (ORDNER[basis] || basis) + '.json');
  return (mCache[basis] = fs.existsSync(p) ? lies(p) : null);
}
/* Verzeichnis ALLER Massnahmendateien je beteiligtem Kuerzel: ein Satz steht oft nur in der Datei der Gegenseite (die
 * Abspaltung DWDP -> DOW in DWDP.json). `_eigen` haelt fest, ob die Datei des Kuerzels selbst ihn fuehrt - nur das sieht v2.1. */
var SYMFELDER = ['symbol', 'old_symbol', 'new_symbol', 'acquiree_symbol', 'acquirer_symbol', 'source_symbol'], verz = {}, verzGesehen = {}, dateienGelesen = 0;
fs.readdirSync(K.ORTE.massnahmen()).sort().forEach(function (f) {
  if (!/\.json$/.test(f) || f[0] === '_') return;
  var j; try { j = lies(path.join(K.ORTE.massnahmen(), f)); } catch (e) { return; }
  dateienGelesen++;
  (j.saetze || []).forEach(function (x) {
    if (x._art === 'cash_dividends') { if (x.symbol === j.sym) (verz[j.sym] = verz[j.sym] || []).push(Object.assign({ _eigen: true }, x)); return; }
    SYMFELDER.forEach(function (fe) {
      var sy = x[fe]; if (!sy) return;
      var kk = sy + '|' + (x.id || JSON.stringify(x));
      if (verzGesehen[kk]) { if (sy === j.sym) verzGesehen[kk]._eigen = true; return; }
      var kopie = Object.assign({ _eigen: sy === j.sym }, x); verzGesehen[kk] = kopie; (verz[sy] = verz[sy] || []).push(kopie);
    });
  });
});
/** Erster Balken des Yahoo-Tagesarchivs (archiv1d): Yahoo fuehrt nur die Historie des HEUTIGEN Inhabers eines Kuerzels. */
function yahooErster(basis) {
  var p = path.join(path.dirname(K.ORTE.roh()), 'archiv1d', 'bars_1d_' + basis + '.json');
  if (!fs.existsSync(p)) return null;
  var j = lies(p); if (!j.series || !j.series.length) return null;
  /* nur der ERSTE Balken: letzter Balken und Balkenzahl aendern sich taeglich und machten die Ausgabe undeterministisch */
  return { erster: new Date(j.series[0][0]).toISOString().slice(0, 10), quelle: j.quelle || null };
}

/** Aus der Massnahmendatei: name_changes nach Regel A/B (wie kuerzelwechsel.js), Ende- und Anfangssaetze, CUSIP-Punkte.
 *  CUSIP-Punkt {d, c, typ}: 'am' = gilt am Datum, 'bis' = galt VOR dem Datum, 'ab' = gilt AB dem Datum. */
function punkte(j, S) {
  var cus = [], ende = [], anfang = [], nc = [];
  function c(d, x, typ, art) { if (d && x) cus.push({ d: d, c: String(x), typ: typ, art: art }); }
  ((j && j.saetze) || []).forEach(function (x) {
    var a = x._art, d;
    if (a === 'name_changes') {
      d = x.process_date || x.ex_date || x.effective_date || null; if (!d) return;
      var alt = String(x.old_symbol || ''), neu = String(x.new_symbol || '');
      var satz = { datum: d, old_symbol: alt, new_symbol: neu, old_cusip: x.old_cusip || null, new_cusip: x.new_cusip || null, id: x.id || null, eigeneDatei: !!x._eigen };
      if (alt === S && neu !== S) { satz.regel = 'A'; nc.push(satz); c(d, x.old_cusip, 'bis', a); }
      else if (neu === S && alt !== S) { satz.regel = 'B'; nc.push(satz); c(d, x.new_cusip, 'ab', a); }
      else if (alt === S && neu === S) { c(d, x.old_cusip, 'bis', a); c(d, x.new_cusip, 'ab', a); }
    } else if (a === 'cash_dividends' || a === 'stock_dividends' || a === 'forward_splits' || a === 'redemptions') {
      if (x.symbol === S) c(x.ex_date || x.process_date, x.cusip, 'am', a);
    } else if (a === 'worthless_removals') {
      if (x.symbol === S) { ende.push({ art: a, datum: x.process_date, partner: null }); c(x.process_date, x.cusip, 'bis', a); }
    } else if (a === 'reverse_splits') {
      if (x.symbol === S) { d = x.ex_date || x.process_date; c(d, x.old_cusip, 'bis', a); c(d, x.new_cusip, 'ab', a); }
    } else if (/_mergers$/.test(a)) {
      d = x.effective_date || x.process_date;
      if (x.acquiree_symbol === S) { ende.push({ art: a, datum: d, partner: x.acquirer_symbol || null }); c(d, x.acquiree_cusip, 'bis', a); }
      if (x.acquirer_symbol === S) c(d, x.acquirer_cusip, 'am', a);
    } else if (a === 'spin_offs') {
      d = x.ex_date || x.process_date;
      if (x.new_symbol === S) { anfang.push({ art: a, datum: d, partner: x.source_symbol || null }); c(d, x.new_cusip, 'ab', a); }
      if (x.source_symbol === S) c(d, x.source_cusip, 'am', a);
    } else if (a === 'unit_splits') {
      /* nur als Kennung: ein unit_split mit fremdem old_symbol ist der Umtausch eines fremden Papiers (CYBR -> PANW) */
      d = x.effective_date || x.process_date;
      if (x.old_symbol === S) c(d, x.old_cusip, 'bis', a);
      if (x.new_symbol === S) c(d, x.new_cusip, 'ab', a);
    }
  });
  return { cus: cus, ende: ende, anfang: anfang, nc: nc };
}
/** Juengste Kennung VOR der Luecke und frueheste DANACH, je innerhalb des eigenen Abschnitts (+-Fenster). */
function cusipSeiten(cus, a, b, segVon, segBis) {
  var lo = plus(segVon, -P.fensterTage), hi = plus(segBis, P.fensterTage), vor = null, nach = null;
  var rangV = { ab: 2, am: 1, bis: 0 }, rangN = { bis: 2, am: 1, ab: 0 };
  cus.forEach(function (x) {
    /* ein 'ab'-Punkt mitten in der Luecke gehoert zum ALTEN Papier (Umtausch am Uebernahmetag: FGMC, HYAC); zum neuen
     * erst ab [erster Tag danach - 10 Kalendertage] */
    var abGrenze = plus(b, -P.abPunktVorlaufTage);
    var istVor = x.typ === 'bis' ? x.d < b : (x.typ === 'ab' ? x.d < abGrenze : x.d <= a);
    var istNach = x.typ === 'ab' ? x.d >= abGrenze : (x.typ === 'am' ? x.d >= b : x.d > b);
    if (istVor && x.d >= lo && (!vor || x.d > vor.d || (x.d === vor.d && rangV[x.typ] > rangV[vor.typ]))) vor = x;
    if (istNach && x.d <= hi && (!nach || x.d < nach.d || (x.d === nach.d && rangN[x.typ] > rangN[nach.typ]))) nach = x;
  });
  return { vor: vor, nach: nach };
}
function mittelUmsatz(R, von, bis) { var su = 0, n = 0; for (var i = von; i < bis; i++) { var u = g.umsatz[R[i]]; if (u === u) { su += u; n++; } } return n ? su / n : null; }

/* ---------- Durchlauf: Luecken je Reihe ---------- */
var kand = [], kurz = [], maxLuecke = new Int32Array(nSym), jeReihe = {};
for (s = 0; s < nSym; s++) {
  var R = zeilen.subarray(start[s], start[s + 1]), n = R.length, lu = [], i;
  for (i = 1; i < n; i++) {
    var d = abstand(R[i - 1], R[i]);
    if (d <= 0) throw new Error('Reihe ' + T.symName[s] + ': Tage nicht aufsteigend bei Zeile ' + i);
    if (d > maxLuecke[s]) maxLuecke[s] = d;
    if (d > P.schwelleTage) lu.push(i); else if (d >= P.kurzVon) kurz.push({ reihe: T.symName[s], tage: d });
  }
  if (!lu.length) continue;
  var name = T.symName[s], basis = name.replace(/~\d+$/, ''), M = punkte({ saetze: verz[basis] || [] }, basis), leb = LEB[basis] || null, yh = yahooErster(basis);
  jeReihe[name] = { s: s, n: n, luecken: lu };
  lu.forEach(function (gi, q) {
    var vorI = q ? lu[q - 1] : 0, nachI = q + 1 < lu.length ? lu[q + 1] : n;
    var rV = R[gi - 1], rN = R[gi], a = iso[g.tag[rV]], b = iso[g.tag[rN]];
    var k = { id: name + '@' + b, reihe: name, basis: basis, letzterVor: a, ersterNach: b, tage: abstand(rV, rN),
      zeilenVor: gi, zeilenNach: n - gi, abschnittVor: gi - vorI, abschnittNach: nachI - gi, lueckeNrDerReihe: q + 1, lueckenDerReihe: lu.length,
      reiheVon: iso[g.tag[R[0]]], reiheBis: iso[g.tag[R[n - 1]]],
      rohVor: rund(g.rohSchluss[rV], 4), rohNach: rund(g.rohSchluss[rN], 4), verhaeltnisRoh: rund(g.rohSchluss[rN] / g.rohSchluss[rV], 4),
      verhaeltnisBereinigt: rund(g.bSchluss[rN] / g.bSchluss[rV], 4),
      umsatzVor: mittelUmsatz(R, Math.max(vorI, gi - P.umsatzZeilen), gi), umsatzNach: mittelUmsatz(R, gi, Math.min(nachI, gi + P.umsatzZeilen)),
      klasseVor: g.klasse[rV], klasseNach: g.klasse[rN], klasseNach60: gi + 60 < nachI ? g.klasse[R[gi + 60]] : null };
    if (k.umsatzVor != null) k.umsatzVor = Math.round(k.umsatzVor); if (k.umsatzNach != null) k.umsatzNach = Math.round(k.umsatzNach);
    k.anschluss = k.verhaeltnisRoh >= P.anschluss[0] && k.verhaeltnisRoh <= P.anschluss[1];
    /* ~2: was v2.1 schon getrennt hat (Auskunft, kein Kriterium) */
    var hat = [2, 3, 4].map(function (z) { return basis + '~' + z; }).filter(function (x) { return x !== name && T.symIdx[x] !== undefined; });
    k.tilde = { ist: name !== basis, hat: hat, v21Trennung: v21[basis] ? { tag: v21[basis].tag, letzterVor: v21[basis].letzterVor, regel: v21[basis].regel, satz: v21[basis].old_symbol + '->' + v21[basis].new_symbol + ' ' + v21[basis].datum } : null };
    /* Saetze der Massnahmendatei im Fenster +-60 Kalendertage um die Luecke */
    var fVon = plus(a, -P.fensterTage), fBis = plus(b, P.fensterTage);
    k.massnahmendatei = massnahmen(basis) ? 'vorhanden' : 'fehlt';
    k.nameChanges = M.nc.filter(function (x) { return x.datum >= fVon && x.datum <= fBis; }).map(function (x) {
      return Object.assign({}, x, { greift: x.regel === 'A' ? x.datum < b : x.datum > a }); });
    k.nameChangesAusserhalb = M.nc.length - k.nameChanges.length;
    k.endeSaetze = M.ende.filter(function (x) { return x.datum >= fVon && x.datum < b; });
    k.anfangSaetze = M.anfang.filter(function (x) { return x.datum > a && x.datum <= fBis; });
    var cu = cusipSeiten(M.cus, a, b, iso[g.tag[R[vorI]]], iso[g.tag[R[nachI - 1]]]);
    k.cusip = { vor: cu.vor && { cusip: cu.vor.c, datum: cu.vor.d, satz: cu.vor.art }, nach: cu.nach && { cusip: cu.nach.c, datum: cu.nach.d, satz: cu.nach.art },
      emittentGleich: cu.vor && cu.nach ? cu.vor.c.slice(0, 6) === cu.nach.c.slice(0, 6) : null, papierGleich: cu.vor && cu.nach ? cu.vor.c === cu.nach.c : null };
    k.polygon = (poly[basis] || []).map(function (e) {
      return Object.assign({}, e, { lage: !e.bis ? 'ohne-datum' : e.bis < plus(a, -P.polygonVorlaufTage) ? 'vor' : e.bis < b ? 'in' : 'nach', tageNachLetztem: e.bis ? tage(a, e.bis) : null }); });
    k.lebenszeit = leb && { ersterMinutentag: leb.ersterMinutentag || null, letzterMinutentag: leb.letzterMinutentag || null, minutentage: leb.minutentage || null,
      ankerHerkunft: leb.ankerHerkunft || null, wiederverwendet: leb.wiederverwendet || null, zweiteReihe: (LEB[basis + '~2'] && LEB[basis + '~2'].zweiteReihe) || null };
    k.yahoo = yh && Object.assign({}, yh, { lage: yh.erster <= a ? 'reicht-vor-luecke' : yh.erster <= plus(b, P.yahooNachlaufTage) ? 'beginnt-nach-luecke' : 'beginnt-spaeter' });
    einordnen(k);
    k.zeilenIndex = gi;
    kand.push(k);
  });
}

/** VORSCHLAG Fall I-IV. Jede Regel nennt Schwelle und Zielbereich im selben Satz (REGELN unten); Kursanschluss nie allein. */
function einordnen(k) {
  var b = [];
  if (k.anfangSaetze.some(function (x) { return x.art === 'spin_offs'; })) b.push('abspaltung-auf-kuerzel');
  if (k.cusip.emittentGleich === false) b.push('cusip6-verschieden');
  if (k.polygon.some(function (e) { return e.lage === 'in'; })) b.push('polygon-delisting-in-luecke');
  if (k.nameChanges.some(function (x) { return x.regel === 'A' && x.greift; })) b.push('namechange-A');
  if (k.nameChanges.some(function (x) { return x.regel === 'B' && x.greift; })) b.push('namechange-B');
  if (k.endeSaetze.length) b.push('uebernahme-wertlos');
  if (k.yahoo && k.yahoo.lage === 'beginnt-nach-luecke') b.push('yahoo-beginnt-nach-luecke');
  if (k.cusip.emittentGleich === true && !k.cusip.papierGleich) b.push('cusip-neues-papier');
  k.trennBelege = b.slice();
  var gl = [];
  if (k.cusip.papierGleich === true) gl.push('cusip9-gleich');
  if (k.yahoo && k.yahoo.lage === 'reicht-vor-luecke') gl.push('yahoo-reicht-vor-luecke');
  k.gleichBelege = gl;
  k.belege = b.concat(gl);
  /* Der Kursanschluss geht NICHT in die Einordnung ein: er traegt an den fuenf bekannten Faellen nicht (Bericht §3). */
  var tr = k.trennBelege, hat = function (x) { return tr.indexOf(x) >= 0; };
  if (tr.length && gl.length) k.fall = 'IV';
  else if (hat('abspaltung-auf-kuerzel') || (hat('cusip-neues-papier') && !hat('cusip6-verschieden'))) k.fall = 'II';
  else if (tr.length) k.fall = 'I';
  else if (gl.length) k.fall = 'III';
  else k.fall = 'IV';
  k.fallGrund = tr.length && gl.length ? 'Belege widersprechen sich: ' + k.belege.join(' + ') : k.belege.length ? k.belege.join(' + ') : 'kein Beleg in den lokalen Quellen';
}
var REGELN = [
  ['cusip6-verschieden', 'I', 'CUSIP-Emittentennummer (erste 6 Stellen) des jüngsten Satzes der Maßnahmendatei vor der Lücke ≠ des frühesten danach (Sätze je im eigenen Abschnitt ±60 Kalendertage)'],
  ['polygon-delisting-in-luecke', 'I', 'Polygon-`bis` (verschwundene.json) liegt in [letzter Tag vor der Lücke − 10 Kalendertage; erster Tag danach)'],
  ['namechange-A', 'I', '`name_changes` Regel A (old_symbol = Kürzel ≠ new_symbol) mit `process_date` in [letzter Tag − 60 Kalendertage; erster Tag danach)'],
  ['namechange-B', 'I', '`name_changes` Regel B (new_symbol = Kürzel ≠ old_symbol) mit `process_date` in (letzter Tag vor; erster Tag danach + 60 Kalendertage]'],
  ['uebernahme-wertlos', 'I', 'Übernahme- (`*_mergers`, acquiree_symbol = Kürzel) oder Wertlos-Satz (`worthless_removals`) mit Datum in [letzter Tag − 60 Kalendertage; erster Tag danach)'],
  ['abspaltung-auf-kuerzel', 'II', '`spin_offs` mit new_symbol = Kürzel und Ex-Tag in (letzter Tag vor; erster Tag danach + 60 Kalendertage]'],
  ['yahoo-beginnt-nach-luecke', 'I', 'erster Balken des Yahoo-Tagesarchivs (`archiv1d/bars_1d_<SYM>.json`) liegt in (letzter Tag vor der Lücke; erster Tag danach + 10 Kalendertage]'],
  ['cusip-neues-papier', 'II', 'CUSIP-Emittentennummer (6 Stellen) vor = nach der Lücke, volle CUSIP (9 Stellen) verschieden'],
  ['cusip9-gleich', 'III', 'volle CUSIP (9 Stellen) des jüngsten Satzes vor der Lücke = des frühesten danach'],
  ['yahoo-reicht-vor-luecke', 'III', 'erster Balken des Yahoo-Tagesarchivs liegt am oder vor dem letzten Tag vor der Lücke (in (−∞; letzter Tag vor])']];

/* ---------- Zaehler ---------- */
kand.sort(function (x, y) { return y.tage - x.tage || (x.id < y.id ? -1 : 1); });
function reihenUeber(t) { var c = 0; for (var q = 0; q < nSym; q++) if (maxLuecke[q] > t) c++; return c; }
/* Gegenprobe auf zweitem Weg: ein Durchlauf in Panelordnung mit dem letzten Tag je Reihe (ohne die Zeilenlisten) */
var letzter = new Int32Array(nSym).fill(-1), max2 = new Int32Array(nSym);
for (r = 0; r < N; r++) { var sy = g.sym[r], t = g.tag[r]; if (letzter[sy] >= 0) { var dd = Math.round((tagMs[t] - tagMs[letzter[sy]]) / TAG); if (dd > max2[sy]) max2[sy] = dd; } letzter[sy] = t; }
function reihenUeber2(t) { var c = 0; for (var q = 0; q < nSym; q++) if (max2[q] > t) c++; return c; }
var gegenprobe = [90, 180, 365].map(function (t) {
  return { schwelle: t, pm: P.pmZaehlung[t], reihen: reihenUeber(t), zweiterWeg: reihenUeber2(t), luecken: kand.filter(function (k) { return k.tage > t; }).length,
    basisKuerzel: Object.keys(kand.filter(function (k) { return k.tage > t; }).reduce(function (o, k) { o[k.basis] = 1; return o; }, {})).length }; });
var faelle = { I: 0, II: 0, III: 0, IV: 0 }; kand.forEach(function (k) { faelle[k.fall]++; });
var regelZaehler = REGELN.map(function (x) {
  var trifft = kand.filter(function (k) { return k.belege.indexOf(x[0]) >= 0; });
  return { regel: x[0], fall: x[1], text: x[2], trifft: trifft.length, allein: trifft.filter(function (k) { return k.belege.length === 1; }).length,
    beispiele: trifft.slice(0, 6).map(function (k) { return k.reihe; }) }; });
var kombi = {}; kand.forEach(function (k) { var kk = k.fall + ' | ' + k.belege.join(' + '); kombi[kk] = (kombi[kk] || 0) + 1; });

/* ---------- Wirkungszaehlung (zaehlt Zeilen, deutet keine Renditen) ---------- */
function imUniversum(R, i) { var kl = g.klasse[R[i]]; return i >= P.minVortage && P.klassen.indexOf(kl) >= 0; }
var wirkJahr = {}, wirkSym = {}, y;
for (y = P.jahrVon; y <= P.jahrBis; y++) wirkJahr[y] = { reihenTage: 0, reihen: {} };
Object.keys(jeReihe).forEach(function (name) {
  var J = jeReihe[name], R = zeilen.subarray(start[J.s], start[J.s + 1]), bis = -1;
  J.luecken.forEach(function (gi) {
    /* die Luecke liegt zwischen zwei der letzten 252 Zeilen (Zeile selbst mitgezaehlt): gi <= i <= gi + 250 */
    for (var i = Math.max(gi, bis + 1); i < J.n && i <= gi + P.fensterZeilen - 2; i++) {
      bis = i; if (!imUniversum(R, i)) continue;
      var jahr = +iso[g.tag[R[i]]].slice(0, 4); if (!wirkJahr[jahr]) continue;
      wirkJahr[jahr].reihenTage++; wirkJahr[jahr].reihen[name] = 1; wirkSym[name] = (wirkSym[name] || 0) + 1;
    }
  });
});
var wirkung = { jeJahr: Object.keys(wirkJahr).map(function (j) { return { jahr: +j, reihenTage: wirkJahr[j].reihenTage, reihen: Object.keys(wirkJahr[j].reihen).length }; }),
  symbole: Object.keys(wirkSym).map(function (x) { return { reihe: x, tage: wirkSym[x] }; }).sort(function (x, y2) { return y2.tage - x.tage || (x.reihe < y2.reihe ? -1 : 1); }) };
wirkung.summe = wirkung.jeJahr.reduce(function (a, x) { return a + x.reihenTage; }, 0);
/* Nenner: alle Reihen-Tage des Universums (Klassen 1-3, >= 250 Zeilen Vorlauf) je Jahr */
var uniJahr = {};
for (s = 0; s < nSym; s++) { var RR = zeilen.subarray(start[s], start[s + 1]); for (var ii = P.minVortage; ii < RR.length; ii++) if (imUniversum(RR, ii)) { var jj = iso[g.tag[RR[ii]]].slice(0, 4); uniJahr[jj] = (uniJahr[jj] || 0) + 1; } }
wirkung.jeJahr.forEach(function (x) { x.universumReihenTage = uniJahr[x.jahr] || 0; });
wirkung.universumSumme = wirkung.jeJahr.reduce(function (a, x) { return a + x.universumReihenTage; }, 0);
/** Trennung an den gewaehlten Luecken: Zeilen, die die Reihe wechseln, und wie viele davon zunaechst unreif waeren. */
function trennung(wahl) {
  var z = { luecken: 0, reihen: 0, zeilenWechseln: 0, unreif: 0, unreifBisherReif: 0, unreifBisherUniversum: 0, reihenMitMehreren: 0 };
  Object.keys(jeReihe).forEach(function (name) {
    var J = jeReihe[name], R = zeilen.subarray(start[J.s], start[J.s + 1]);
    var L = J.luecken.filter(function (gi) { return wahl(kandIdx[name + '@' + iso[g.tag[R[gi]]]]); });
    if (!L.length) return;
    z.reihen++; z.luecken += L.length; if (L.length > 1) z.reihenMitMehreren++; z.zeilenWechseln += J.n - L[0];
    L.forEach(function (gi, q) {
      var ende = Math.min(q + 1 < L.length ? L[q + 1] : J.n, gi + P.minVortage);
      for (var i = gi; i < ende; i++) { z.unreif++; if (i >= P.minVortage) { z.unreifBisherReif++; if (imUniversum(R, i)) z.unreifBisherUniversum++; } }
    });
  });
  return z;
}
var kandIdx = {}; kand.forEach(function (k) { kandIdx[k.id] = k; });
wirkung.trennung = { fallIundII: trennung(function (k) { return k.fall === 'I' || k.fall === 'II'; }),
  fallIbisIV_ohneIII: trennung(function (k) { return k.fall !== 'III'; }), alleUeber90: trennung(function () { return true; }),
  alleUeber365: trennung(function (k) { return k.tage > 365; }) };

/* ---------- Kurzluecken 30-90 Kalendertage: nur zaehlen ---------- */
var kurzReihen = {}, kurzVert = { '30-45': 0, '46-60': 0, '61-75': 0, '76-90': 0 };
kurz.forEach(function (x) { kurzReihen[x.reihe] = (kurzReihen[x.reihe] || 0) + 1; kurzVert[x.tage <= 45 ? '30-45' : x.tage <= 60 ? '46-60' : x.tage <= 75 ? '61-75' : '76-90']++; });
var kurzJe = {}; Object.keys(kurzReihen).forEach(function (x) { var c = kurzReihen[x] >= 5 ? '5+' : String(kurzReihen[x]); kurzJe[c] = (kurzJe[c] || 0) + 1; });
var kurzluecken = { luecken: kurz.length, reihen: Object.keys(kurzReihen).length, verteilungTage: kurzVert, lueckenJeReihe: kurzJe,
  reihenAuchUeber90: Object.keys(kurzReihen).filter(function (x) { return jeReihe[x]; }).length };

/* ---------- Auswahl: 30 laengste, 20 zufaellige der uebrigen (Saat), fuenf bekannte ---------- */
var laengste = kand.slice(0, P.laengste).map(function (k) { return k.id; });
var zufall = kand.slice(P.laengste).map(function (k) { return { id: k.id, h: crypto.createHash('sha256').update(P.saat + '|' + k.id).digest('hex') }; })
  .sort(function (x, y2) { return x.h < y2.h ? -1 : 1; }).slice(0, P.zufall).map(function (x) { return x.id; });
var fuenf = P.fuenf.map(function (f) {
  var L = kand.filter(function (k) { return k.reihe === f[0]; });
  return { reihe: f[0], erwartet: f[1], luecken: L.map(function (k) { return k.id; }) }; });

var aus = { kennung: 'querschnitt-pruefstand-2026-09-13/luecken-trockenlauf/v1', auftrag: 'Nr. 64 (03.10.2026), Phase 1: nur zaehlen und einordnen',
  panel: { ordner: 'voll', zeilen: N, reihen: nSym, ersterTag: iso[g.tag[0]], letzterTag: iso[g.tag[N - 1]] }, parameter: P,
  formate: { polygon: polyZ, polygonKopf: Object.keys(polyRoh).filter(function (x) { return x !== 'eintraege'; }), polygonGesamt: polyRoh.gesamt, polygonQuelle: polyRoh.quelle,
    nameChangesBeispiele: ['HCP', 'BBBY', 'OVV'].map(function (x) { var j = massnahmen(x); return { datei: x + '.json', kopf: Object.keys(j), saetze: j.saetze.filter(function (q) { return q._art === 'name_changes'; }) }; }) },
  gegenprobe: gegenprobe, zaehler: { luecken: kand.length, reihen: Object.keys(jeReihe).length, faelle: faelle, regeln: regelZaehler, kombinationen: kombi,
    tildeIst: kand.filter(function (k) { return k.tilde.ist; }).length, tildeHat: kand.filter(function (k) { return k.tilde.hat.length; }).length,
    nameChangeImFenster: kand.filter(function (k) { return k.nameChanges.length; }).length, massnahmendateiFehlt: kand.filter(function (k) { return k.massnahmendatei === 'fehlt'; }).length,
    polygonEintrag: kand.filter(function (k) { return k.polygon.length; }).length, cusipBeidseitig: kand.filter(function (k) { return k.cusip.emittentGleich !== null; }).length,
    anschluss: kand.filter(function (k) { return k.anschluss; }).length, yahooDatei: kand.filter(function (k) { return k.yahoo; }).length,
    massnahmendateienGelesen: dateienGelesen,
    nameChangeGreift: kand.filter(function (k) { return k.nameChanges.some(function (x) { return x.greift; }); }).length,
    nameChangeGreiftNurFremdeDatei: kand.filter(function (k) { return k.nameChanges.some(function (x) { return x.greift; }) && !k.nameChanges.some(function (x) { return x.greift && x.eigeneDatei; }); }).length },
  wirkung: wirkung, kurzluecken: kurzluecken, auswahl: { laengste: laengste, zufall: zufall, fuenf: fuenf }, kandidaten: kand };
fs.writeFileSync(AUS_JSON, JSON.stringify(aus, null, 1));
schreibeBericht(aus);
process.stdout.write('Luecken > ' + P.schwelleTage + ' Tage: ' + kand.length + ' in ' + Object.keys(jeReihe).length + ' Reihen; Faelle ' + JSON.stringify(faelle) + '\n');
process.stdout.write('Gegenprobe: ' + JSON.stringify(gegenprobe) + '\n-> ' + AUS_JSON + '\n-> ' + AUS_MD + '\n');

/* ---------- Bericht: alle Tabellen und Zahlen aus `aus` (nichts abgetippt) ---------- */
function schreibeBericht(A) {
  function Z(x, n) { return x == null || x !== x ? '–' : Number(x).toLocaleString('de-DE', { maximumFractionDigits: n || 0, minimumFractionDigits: n || 0 }); }
  function tab(kopf, zl) { return '| ' + kopf.join(' | ') + ' |\n|' + kopf.map(function () { return '---'; }).join('|') + '|\n' + zl.map(function (x) { return '| ' + x.join(' | ') + ' |'; }).join('\n') + '\n'; }
  var z = A.zaehler, W = A.wirkung, F = A.formate.polygon, ix = {}; A.kandidaten.forEach(function (k) { ix[k.id] = k; });
  var KOPF = ['Reihe', 'Lücke (Kal.-Tage)', 'letzter Tag vor → erster nach', 'Zeilen vor / nach', 'rohSchluss vor → nach', 'Umsatz 20 Z. vor / nach (Mio $)', 'Klasse vor / nach', '~2', '`name_changes` ±60 T.', 'Polygon (Name, `bis`, Lage zur Lücke)', 'Yahoo ab', 'Fall', 'Beleg'];
  function kz(k) {
    var nc = k.nameChanges.map(function (x) { return 'Regel ' + x.regel + ': ' + x.old_symbol + '→' + x.new_symbol + ' ' + x.datum + (x.greift ? '' : ' (außerhalb des Regelfensters)'); }).join('; ') || 'nein';
    var po = k.polygon.map(function (e) { return String(e.name).slice(0, 40) + ', ' + (e.bis || 'ohne Datum') + ' (' + e.lage + ')'; }).join('; ') || 'kein Eintrag';
    return [k.reihe, Z(k.tage), k.letzterVor + ' → ' + k.ersterNach, Z(k.zeilenVor) + ' / ' + Z(k.zeilenNach), Z(k.rohVor, 2) + ' → ' + Z(k.rohNach, 2) + ' (×' + Z(k.verhaeltnisRoh, 2) + ')',
      Z(k.umsatzVor / 1e6, 2) + ' / ' + Z(k.umsatzNach / 1e6, 2), k.klasseVor + ' / ' + k.klasseNach, k.tilde.ist ? 'ist ~2-Reihe' : k.tilde.hat.length ? 'hat ' + k.tilde.hat.join(', ') : '–',
      nc, po, k.yahoo ? k.yahoo.erster : '–', '**' + k.fall + '**', k.fallGrund];
  }
  var fuenfZeilen = [], traegt = 0;
  A.auswahl.fuenf.forEach(function (f) { f.luecken.forEach(function (id) {
    var k = ix[id], soll = f.erwartet === 'III', ok = k.anschluss === soll; if (ok) traegt++;
    fuenfZeilen.push([k.reihe, Z(k.tage), Z(k.rohVor, 2) + ' → ' + Z(k.rohNach, 2), '×' + Z(k.verhaeltnisRoh, 2), k.anschluss ? 'schließt an' : 'schließt nicht an', f.erwartet, ok ? 'ja' : '**nein**', k.fall + ' (' + k.fallGrund + ')']); }); });
  var belegt = A.kandidaten.filter(function (k) { return k.fall !== 'IV'; }), trenn = belegt.filter(function (k) { return k.fall !== 'III'; }), drei = belegt.filter(function (k) { return k.fall === 'III'; });
  var trennAn = trenn.filter(function (k) { return k.anschluss; }), dreiNicht = drei.filter(function (k) { return !k.anschluss; });
  var vier = A.kandidaten.filter(function (k) { return k.fall === 'IV'; }), vierSpac = vier.filter(function (k) { return k.polygon.some(function (e) { return /acquisition/i.test(e.name); }); });
  var vierPolyNach = vier.filter(function (k) { return k.polygon.some(function (e) { return e.lage === 'nach'; }); }), vierU365 = vier.filter(function (k) { return k.tage <= 365; });
  var polyLage = {}; A.kandidaten.forEach(function (k) { k.polygon.forEach(function (e) { polyLage[e.lage] = (polyLage[e.lage] || 0) + 1; }); });
  var bSpaet = A.kandidaten.filter(function (k) { return k.belege.indexOf('namechange-B') >= 0; }).map(function (k) { var x = k.nameChanges.filter(function (q) { return q.regel === 'B' && q.greift; })[0]; return k.reihe + ' ' + tage(k.ersterNach, x.datum); });
  var jeBasis = {}; A.kandidaten.forEach(function (k) { var o = jeBasis[k.basis] = jeBasis[k.basis] || { schnitte: 0, tilde: k.tilde.ist || k.tilde.hat.length ? 1 : 0 }; o.schnitte++; });
  var dritte = Object.keys(jeBasis).filter(function (b) { return jeBasis[b].schnitte + jeBasis[b].tilde > 1; }).sort();
  var G = A.gegenprobe, T3 = W.trennung, alle = T3.alleUeber90, ohne3 = T3.fallIbisIV_ohneIII, m = [];
  function regelTrifft(name) { return z.regeln.filter(function (x) { return x.regel === name; })[0].trifft; }
  var klGleich = A.kandidaten.filter(function (k) { return k.klasseVor === k.klasseNach; }).length;
  var lebTrifft = A.kandidaten.filter(function (k) { var w = k.lebenszeit && k.lebenszeit.wiederverwendet; return w && w.schnitt >= ms(k.letzterVor) && w.schnitt <= ms(k.ersterNach) + TAG; }).length;
  m.push('# Lücken-Trockenlauf: verklebte Reihen im Panel v2.1 (Auftrag Nr. 64, Phase 1)\n');
  m.push('*Erzeugt von `luecken-trockenlauf.js` aus `luecken-kandidaten.json` — jede Zahl und jede Tabelle stammt aus dem Lauf. Nur gelesen, nichts am Panel geändert, nichts entschieden.*\n');
  m.push('**Kurz:** Panel `' + A.panel.ordner + '/` (' + Z(A.panel.zeilen) + ' Zeilen, ' + Z(A.panel.reihen) + ' Reihen, bis ' + A.panel.letzterTag + ') hat **' + Z(z.luecken) + ' Lücken > ' + P.schwelleTage + ' Kalendertage in ' + Z(z.reihen) + ' Reihen**. ' +
    'Maschinell belegt sind ' + Z(belegt.length) + ' (Fall I ' + z.faelle.I + ', II ' + z.faelle.II + ', III ' + z.faelle.III + '); **' + z.faelle.IV + ' bleiben Fall IV**, weil die lokalen Quellen den Emittenten vor der Lücke nicht kennen. ' +
    'Die Regel „Polygon-Delisting in der Lücke" trifft **' + z.regeln.filter(function (x) { return x.regel === 'polygon-delisting-in-luecke'; })[0].trifft + '** Fälle, und der Kursanschluss trägt an den fünf bekannten Fällen nicht (' + traegt + ' von ' + fuenfZeilen.length + ').\n');
  m.push('## 1. Dateiformate (selbst festgestellt)\n');
  m.push('**`massive/verschwundene.json`** (Quelle `' + A.formate.polygonQuelle + '`): Kopf `' + A.formate.polygonKopf.join('`, `') + '` plus `eintraege` (Liste, ' + Z(F.eintraege) + ' von ' + Z(A.formate.polygonGesamt) + ' gemeldeten, nur aktienartige). ' +
    'Je Eintrag `' + F.schluessel.join('`, `') + '`. Das Delisting-Datum ist `bis` (gesetzt bei ' + Z(F.mitBis) + '); **`von` ist bei allen leer** (gesetzt bei ' + F.mitVon + '). ' + Z(F.kuerzel) + ' verschiedene Kürzel; ' + F.doppelt +
    ' Kürzel stehen zweimal, davon ' + F.doppeltVerschieden + ' mit anderem Namen oder anderer `cik` — es sind Seitendubletten (`bis` gleich oder um einen Tag versetzt), kein zweiter Emittent. ' +
    '**Folge:** die Datei führt je Kürzel genau einen Emittenten, den letzten nicht mehr aktiven Inhaber. „Mehrere Einträge je Kürzel = mehrere Emittenten" kommt nicht vor; ohne `von` ist „Name davor ≠ Name danach" aus dieser Datei nicht prüfbar; ist das Kürzel heute aktiv (SN, MBLY, DOW, CART), gibt es keinen Eintrag.\n');
  m.push('**`alpaca-massnahmen/<SYM>.json`**: Kopf `' + A.formate.nameChangesBeispiele[0].kopf.join('`, `') + '` (BBBY zusätzlich `gemesseneFaktoren`). Ein `name_changes`-Satz trägt `_art`, `id`, `old_symbol`, `new_symbol`, `old_cusip`, `new_cusip`, `process_date` — `process_date` ist das einzige Datumsfeld. Belege aus drei Dateien:\n');
  m.push(A.formate.nameChangesBeispiele.map(function (b) { return b.saetze.map(function (q) { return '- `' + b.datei + '`: `' + JSON.stringify(q) + '`'; }).join('\n'); }).join('\n') + '\n');
  m.push('Zusätzlich gelesen, weil Polygon und `name_changes` allein fast nichts tragen (§4): die CUSIP-Felder aller Satzarten (`cusip`, `old_cusip`/`new_cusip`, `acquiree_cusip`, `source_cusip`), Übernahme- und Wertlos-Sätze (`*_mergers` mit `acquiree_symbol`/`effective_date`, `worthless_removals`), `spin_offs` (`new_symbol`, `ex_date`) — über **alle** ' + Z(z.massnahmendateienGelesen) +
    ' Maßnahmendateien, damit auch Sätze in der Datei der Gegenseite zählen — und das Yahoo-Tagesarchiv `archiv1d/bars_1d_<SYM>.json` (`series[0][0]` = erster Balken; Yahoo führt nur die Historie des heutigen Inhabers eines Kürzels). `_lebenszeit.json` (`werte[SYM]`: `ersterMinutentag`, `letzterMinutentag`, `minutentage`, `wiederverwendet`, `zweiteReihe`) kennt nur die drei Archiv-Fälle AAC, CAPA, JONE; sein Schnitt fällt in ' + lebTrifft + ' der ' + z.luecken + ' Lücken. Der Eintrag steht je Lücke in der JSON.\n');
  m.push('## 2. Gegenprobe der Zählung\n');
  m.push(tab(['Schwelle (Kal.-Tage)', 'PM-Zählung 22.09.', 'Reihen (Zeilenlisten)', 'Reihen (zweiter Weg: ein Durchlauf in Panelordnung)', 'Lücken', 'Basis-Kürzel'], G.map(function (x) { return ['> ' + x.schwelle, Z(x.pm), Z(x.reihen), Z(x.zweiterWeg), Z(x.luecken), Z(x.basisKuerzel)]; })));
  m.push('Die drei Zahlen stimmen. Es sind ' + z.luecken + ' Lücken in ' + z.reihen + ' Reihen, weil eine Reihe zwei Lücken hat; ' + z.tildeIst + ' Lücken liegen in bestehenden `~2`-Reihen, ' + z.tildeHat + ' in Reihen, die schon eine `~2`-Reihe haben (Auskunft, kein Kriterium).\n');
  m.push('## 3. Kursanschluss an fünf bekannten Fällen — trägt nicht, wird nicht verwendet\n');
  m.push('Kriterium: `rohSchluss` nach / vor der Lücke in [' + Z(P.anschluss[0], 1) + '; ' + Z(P.anschluss[1], 1) + '] = „schließt an" (spräche für III), außerhalb = „schließt nicht an" (spräche für I/II). Fünfter Fall eigener Wahl: EBR (Eletrobras-ADR; die Lücke 17.05.–13.10.2016 ist nach meiner Kenntnis die NYSE-Aussetzung wegen des verspäteten Jahresberichts — **ohne Netz nicht nachgeprüft**).\n');
  m.push(tab(['Reihe', 'Lücke', 'rohSchluss vor → nach', 'Verhältnis', 'Kriterium sagt', 'erwartet', 'trägt', 'maschineller Fall (Beleg)'], fuenfZeilen));
  function vh(reihe) { var k = A.kandidaten.filter(function (q) { return q.reihe === reihe; })[0]; return k ? Z(k.verhaeltnisRoh, 2) : '–'; }
  m.push('**' + traegt + ' von ' + fuenfZeilen.length + '.** DOW (×' + vh('DOW') + ') liegt im Anschlussbereich, obwohl es ein neues Papier ist; EBR (×' + vh('EBR') + ') liegt außerhalb, obwohl es dieselbe Notierung sein soll; MBLY (×' + vh('MBLY') + ') liegt nur knapp außerhalb. Gegenprobe an den ' + belegt.length + ' maschinell belegten Lücken: von ' + trenn.length +
    ' Trennfällen (I/II) schließen **' + trennAn.length + '** an (' + trennAn.map(function (k) { return k.reihe; }).join(', ') + '), von ' + drei.length + ' III-Fällen schließt ' + dreiNicht.length + ' nicht an (' + (dreiNicht.map(function (k) { return k.reihe; }).join(', ') || '–') + '). ' +
    'Grund: Mantelgesellschaften notieren um 10 $, Vorzugs- und Anleihepapiere um 25 $ — ein neuer Emittent „schließt" dort von selbst an. **Das Kriterium geht deshalb in keine Einordnung ein**; das Verhältnis steht nur als Spalte in den Tabellen.\n');
  m.push('## 4. Einordnung Fall I–IV: Regeln und Zähler\n');
  m.push('Fall **I** = anderer Emittent oder neues Papier, Trennung belegt (ob es dieselbe Firma ist, bleibt unbelegt); **II** = derselbe Emittent belegt, neues Papier; **III** = dasselbe Papier belegt; **IV** = kein Beleg oder Belege widersprechen sich. Reihenfolge: Trenn- und Gleich-Beleg zugleich → IV; Abspaltung oder „CUSIP neues Papier" → II; sonst irgendein Trenn-Beleg → I; sonst Gleich-Beleg → III; sonst IV.\n');
  m.push(tab(['Fall', 'Lücken'], ['I', 'II', 'III', 'IV'].map(function (f) { return [f, Z(z.faelle[f])]; })));
  m.push(tab(['Regel', 'spricht für', 'Schwelle und Zielbereich', 'trifft', 'davon allein (einziger Beleg)', 'Beispiele'], z.regeln.map(function (x) { return ['`' + x.regel + '`', x.fall, x.text, Z(x.trifft), Z(x.allein), x.beispiele.join(', ') || '–']; })));
  m.push('- **Polygon-Delisting in der Lücke: 0 Treffer.** Lage der Polygon-Einträge zur Lücke: ' + Object.keys(polyLage).sort().map(function (x) { return x + ' ' + polyLage[x]; }).join(', ') + '; ' + (z.luecken - z.polygonEintrag) + ' Lücken ohne Eintrag. Der Eintrag beschreibt den Inhaber **nach** der Lücke (JMG = JM Group, delistet 2026), nie den davor.');
  m.push('- **`name_changes`:** im Fenster ±60 Tage bei ' + z.nameChangeImFenster + ' Lücken, Regel A oder B greift bei ' + z.nameChangeGreift + ' (davon ' + z.nameChangeGreiftNurFremdeDatei + ' nur in der Datei der Gegenseite; der Rest steht in der eigenen Datei und ist für v2.1 sichtbar). v2.1 hat die ' + bSpaet.length + ' Regel-B-Fälle trotzdem nicht getrennt, weil `process_date` **nach** dem ersten Balken des neuen Papiers liegt (Kalendertage: ' + bSpaet.join(', ') + ') und die Lücke „vor dem ersten Tag ab Datum" dann 0 ist.');
  m.push('- **CUSIP** beidseits der Lücke bekannt bei ' + z.cusipBeidseitig + ' Lücken; **Yahoo-Datei** vorhanden bei ' + z.yahooDatei + ' (nur heute aktive Kürzel). Abspaltungs-Sätze auf das Kürzel im Regelfenster: ' + regelTrifft('abspaltung-auf-kuerzel') + ' — über alle Dateien gesucht, auch für DOW (aus DWDP).');
  m.push('- **Klasse nach der Lücke:** bei ' + klGleich + ' von ' + z.luecken + ' Lücken trägt die erste Zeile danach dieselbe Klasse wie die letzte davor — das Umsatzfenster läuft über die Zeilen der Reihe und damit über die Lücke.');
  m.push('- **Fall IV (' + vier.length + '):** ' + vierPolyNach.length + ' haben einen Polygon-Eintrag mit `bis` nach der Lücke (Inhaber danach bekannt, davor nicht), ' + vierSpac.length + ' davon tragen „Acquisition" im Namen (Mantelgesellschaft — Hinweis, kein Beleg); ' + vierU365.length + ' der IV-Lücken sind ≤ 365 Tage lang. Kein Widerspruch zwischen Trenn- und Gleich-Beleg kam vor.\n');
  m.push('**Die ' + drei.length + ' belegten III-Fälle** (eine Trennung wäre hier falsch oder zumindest Geschmackssache):\n');
  m.push(tab(KOPF, drei.map(kz)));
  m.push('## 5. Die ' + A.auswahl.laengste.length + ' längsten Lücken\n');
  m.push(tab(KOPF, A.auswahl.laengste.map(function (id) { return kz(ix[id]); })));
  m.push('## 6. ' + A.auswahl.zufall.length + ' zufällige Lücken der übrigen ' + (z.luecken - A.auswahl.laengste.length) + ' (Saat `' + P.saat + '`, Reihenfolge nach SHA-256 von Saat|Kennung)\n');
  m.push(tab(KOPF, A.auswahl.zufall.map(function (id) { return kz(ix[id]); })));
  m.push('## 7. Wirkungszählung (zählt Zeilen, deutet keine Renditen)\n');
  m.push('Reihen-Tage, an denen ein Universumsmitglied (Klasse ' + P.klassen.join('/') + ' aus `T.g.klasse`, ≥ ' + P.minVortage + ' Zeilen Vorlauf) eine Lücke > ' + P.schwelleTage + ' Kalendertage zwischen zwei seiner letzten ' + P.fensterZeilen + ' Zeilen hat (Zeile selbst mitgezählt):\n');
  m.push(tab(['Jahr', 'betroffene Reihen-Tage', 'Reihen', 'Reihen-Tage des Universums', 'Anteil'], W.jeJahr.map(function (x) { return [x.jahr, Z(x.reihenTage), Z(x.reihen), Z(x.universumReihenTage), Z(100 * x.reihenTage / x.universumReihenTage, 3) + ' %']; })
    .concat([['**Summe**', '**' + Z(W.summe) + '**', Z(W.symbole.length), Z(W.universumSumme), Z(100 * W.summe / W.universumSumme, 3) + ' %']])));
  m.push('Betroffene Reihen mit Tagen: ' + W.symbole.map(function (x) { return x.reihe + ' ' + x.tage; }).join(', ') + '.\n');
  m.push('Was eine Trennung bewegt (Zeilen nach der Lücke wechseln in eine Nachfolge-Reihe; „unreif" = weniger als ' + P.minVortage + ' Zeilen seit der Lücke):\n');
  m.push(tab(['Trennung an', 'Lücken', 'Reihen', 'Zeilen wechseln die Reihe', 'davon zunächst unreif', 'davon heute als reif gezählt', 'davon heute im Universum (Klasse 1–3)'],
    [['Fall I + II (belegt)', T3.fallIundII], ['Fall I, II, IV (alle außer belegtem III)', ohne3], ['jeder Lücke > 90 Tage', alle], ['jeder Lücke > 365 Tage', T3.alleUeber365]].map(function (x) {
      return [x[0], Z(x[1].luecken), Z(x[1].reihen), Z(x[1].zeilenWechseln), Z(x[1].unreif), Z(x[1].unreifBisherReif), Z(x[1].unreifBisherUniversum)]; })));
  m.push('## 8. Kurzlücken ' + P.kurzVon + '–' + P.schwelleTage + ' Kalendertage (nur gezählt)\n');
  m.push(Z(A.kurzluecken.luecken) + ' Lücken in ' + Z(A.kurzluecken.reihen) + ' Reihen; ' + A.kurzluecken.reihenAuchUeber90 + ' dieser Reihen haben auch eine Lücke > ' + P.schwelleTage + '. Nach Länge: ' + Object.keys(A.kurzluecken.verteilungTage).map(function (x) { return x + ' Tage: ' + A.kurzluecken.verteilungTage[x]; }).join(', ') +
    '. Lücken je Reihe: ' + Object.keys(A.kurzluecken.lueckenJeReihe).sort().map(function (x) { return x + ' Lücke(n): ' + A.kurzluecken.lueckenJeReihe[x] + ' Reihen'; }).join(', ') + '.\n');
  m.push('## 9. Vorschlag für Phase 2 (nur Text, entscheidet der PM)\n');
  m.push('1. **Regel:** jede Lücke > ' + P.schwelleTage + ' Kalendertage zwischen zwei aufeinanderfolgenden Panelzeilen trennt die Reihe — ohne Beleg-Bedingung. Begründung aus den Zahlen: ein Beleg-Kriterium ließe ' + z.faelle.IV + ' von ' + z.luecken + ' Lücken ungetrennt (darunter aus der Wirkungsliste in §7: ' + W.symbole.filter(function (x) { return vier.some(function (k) { return k.reihe === x.reihe; }); }).map(function (x) { return x.reihe; }).join(', ') + '), ' +
    'während die Gegenrichtung nur ' + drei.length + ' belegte III-Fälle kostet; eine fälschlich getrennte Aussetzung verliert ' + P.minVortage + ' Zeilen Reife und die erste Rendite, eine fälschlich verklebte Reihe rechnet eine Rendite über zwei Papiere. Ob die ' + drei.length + ' III-Fälle (' + drei.map(function (k) { return k.reihe; }).join(', ') + ') als Ausnahmeliste ungetrennt bleiben, ist die erste PM-Entscheidung.');
  m.push('2. **Erwartete neue Reihen:** ' + alle.luecken + ' (jede Lücke > 90) bzw. ' + ohne3.luecken + ' (ohne belegtes III), zusätzlich zu den ' + KW.trennungen.length + ' Trennungen aus v2.1. Bei ' + dritte.length + ' Basis-Kürzeln reicht `~2` nicht (schon eine `~2`-Reihe oder zwei Lücken): ' + dritte.join(', ') + ' — dort braucht es `~3` (bei ' + (dritte.filter(function (b) { return jeBasis[b].schnitte + jeBasis[b].tilde > 2; }).join(', ') || 'keinem') + ' auch `~4`), und der PM muss festlegen, ob chronologisch neu nummeriert wird (bestehende `~2` hieße dann `~3`) oder die neue Reihe die nächste freie Nummer bekommt.');
  m.push('3. **Änderungen:** `kuerzelwechsel.js` — Trennungen nicht mehr nur aus `name_changes`-Kandidaten, sondern aus den Lücken des vorhandenen Panels (dieses Skript liefert Reihe, letzter Tag vor, erster Tag nach); `entscheiden()` lässt heute je Reihe nur die früheste Trennung zu, nötig sind mehrere. `paneldaten.js` — `symbole()` hält je Reihe ein einzelnes `base.trennung` und vergibt `~2`, ersatzweise `~3`; `zeilenAus()` schaltet `symIdx` einmal um; beides muss eine Liste tragen. Die Muster `/~2$/` in `kuerzelwechsel.js` und `paneldaten.js` müssen `~3` kennen. `K.WECHSEL_MIN_LUECKE_TAGE` (60 **Handels**tage ab `process_date`) bekäme eine zweite Konstante in **Kalender**tagen — zwei Einheiten, zwei Namen.');
  m.push('4. **Regressionspins, die sich bewegen müssen:** `K.REGRESSION23_ERWARTET` braucht einen Eintrag für die neue Panel-Kennung (Teil-2-Zahl aus einem frischen Kontrollenlauf, wie bei v2.1); `K.PANEL_KENNUNG` selbst; die Teil-3- und Teil-4-Ergebnisdateien und `vergleich`-Zahlen; `test.js` Abschnitt 16 (prüft am echten Panel) und die Reihenzahl ' + Z(A.panel.reihen) + ' → ' + Z(A.panel.reihen + alle.luecken) + '. Erwartete Größe der Bewegung: ' + Z(W.summe) + ' von ' + Z(W.universumSumme) + ' Reihen-Tagen des Universums (' + Z(100 * W.summe / W.universumSumme, 3) + ' %).');
  m.push('5. **Laufzeit:** laut v2.1-Übergabe (`panel-rueckwaerts-splits-2026-09-18.md`) Vollbau v2.0 02:05–04:07 in sechs Teilen, danach Vereinen, Kernprüfung, vier Suiten und das Nachrechnen von Teil 1, 3, 4 — „mehrere Stunden" trifft es. Ein Teilbau über `--reihen` genügt nicht allein, weil neue Reihen die sortierte Symboltabelle (Index je Reihe) für alle Blöcke verschieben.\n');
  m.push('## 10. Was sich nicht umsetzen ließ (Befunde, keine Abwandlungen)\n');
  m.push('- „Polygon-Name davor ≠ Name danach": nicht prüfbar, die Datei führt je Kürzel einen Namen und kein `von`.\n- „Delisting-Datum liegt in der Lücke": umsetzbar, trifft 0 von ' + z.luecken + '.\n- Kursanschluss [0,5; 2,0]: trägt an ' + traegt + ' von ' + fuenfZeilen.length + ' bekannten Fällen, nicht verwendet.\n' +
    '- Fall I gegen II (derselbe Emittent, neu zugelassen): nur über die CUSIP-Emittentennummer entscheidbar, und die ist bei ' + z.cusipBeidseitig + ' von ' + z.luecken + ' Lücken beidseits bekannt. MBLY und DOW (erwartet II) landen deshalb in I; für die Trennung ist der Unterschied folgenlos.\n' +
    '- Die Klasse direkt nach der Lücke stammt aus dem Umsatzfenster des **alten** Papiers (Spalte „Klasse vor / nach" ist fast überall gleich) — eine weitere Folge der Verklebung, die mit der Trennung verschwindet.\n' +
    '- Über die ' + z.luecken + ' Lücken hinaus nicht untersucht: Emittentenwechsel **ohne** Lücke (vom Lückenkriterium grundsätzlich nicht erfasst), weitere unbelegte Aussetzungen unter Fall IV (EBR und EBR.B wären von der Regel in §9 mitbetroffen) und die ' + Z(A.kurzluecken.luecken) + ' Kurzlücken.\n');
  fs.writeFileSync(AUS_MD, m.join('\n'));
}
