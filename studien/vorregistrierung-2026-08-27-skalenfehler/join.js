'use strict';
/* §2-JOIN v2: Sprunglisten x Ereignis-Zeuge x Quote-Diagnose -> Urteil je SEGMENT.
 * Rein lokal (Archive + ereignisse/-Dateien des Analytikers); KEIN Abruf, KEIN
 * Schreiben ausserhalb dieses Ordners. Tabelle nach VORREGISTRIERUNG §2 in der
 * Fassung von Nachtrag 4 + 5 (Sprung AM Split-Datum = Anpassungsfehler; Urteil je
 * Segment mit Konventions-Angabe, nie je Reihe).
 *
 * Klassen je Sprung (Einzelsprung wie Pendel-Leg):
 *   F       Datum trifft Split +-1 Handelstag UND |q/faktor-1|<=0,10 (auch invers)
 *           -> 1d dort unangepasst (roh-Rest): Anpassungsfehler der 1d-Seite
 *   F?      Datum trifft, Faktor weicht >10 % ab -> teilweise angepasst (beziffert)
 *   F-ECHO  Datum trifft nicht, Faktor ~ ein gefuehrter Split-Faktor
 *           -> Skalen-Mischung verschieden angepasster Abrufe (BYND-Mechanik)
 *   U       kein Ereignis-Bezug -> unentscheidbar mit diesen zwei Endpunkten
 * Rand: VERZUG, wenn ein Split nach dem letzten Balken der einen Seite liegt und
 * die Rand-Quote ~ Faktor (aeltere Seite konsistent-roh, keine Reparatur-Aussage).
 * Nullwert lokal (provisorisch): E = nSpruenge*nSplitTage*3/nHandelstage.
 */
var fs = require('fs'), path = require('path');
var HIER = __dirname;
var ARCHIV1D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var ARCHIV60M = 'E:/Markt-Dashboard-Archiv/archiv60m';
var FAKTOR_MIN = 2, TOL = 0.10;

function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }
function ladeReihe(p) {
  var j = JSON.parse(fs.readFileSync(p, 'utf8'));
  return (j.bars || j.series || []).map(function (z) { return { t: z[0], c: z[1] }; });
}
var laeufe = fs.readdirSync(HIER).filter(function (f) { return f.indexOf('lauf-') === 0; }).sort();
var LAUF = JSON.parse(fs.readFileSync(path.join(HIER, laeufe[laeufe.length - 1]), 'utf8'));
console.log('Join auf ' + laeufe[laeufe.length - 1] + '  (Erkenner unveraendert, nur Klassifizierung)\n');

function ereignisseVon(sym) {
  var p = path.join(HIER, 'ereignisse', sym + '.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : null;
}
function faktorPasst(q, f) {
  return Math.abs(q / f - 1) <= TOL || Math.abs((1 / q) / f - 1) <= TOL;
}

var kandidaten = {};
(LAUF.M1 || []).forEach(function (x) { kandidaten[x.sym] = 1; });
(LAUF.I2 || []).forEach(function (x) { kandidaten[x.sym] = 1; });

var tabelle = [];
Object.keys(kandidaten).sort().forEach(function (sym) {
  var ev = ereignisseVon(sym);
  var i2 = (LAUF.I2 || []).filter(function (x) { return x.sym === sym; })[0] || {};
  var r1d;
  try { r1d = ladeReihe(path.join(ARCHIV1D, 'bars_1d_' + sym + '.json')); } catch (e) { r1d = null; }
  if (!r1d || !r1d.length) { tabelle.push({ sym: sym, urteil: 'ohne 1d-Reihe' }); return; }
  var r60letzter = null;
  try { var r60 = ladeReihe(path.join(ARCHIV60M, 'bars_60m_' + sym + '.json')); r60letzter = tag(r60[r60.length - 1].t); } catch (e) {}

  var tage = r1d.map(function (z) { return tag(z.t); });
  var splits = (ev && ev.ereignisse || []).filter(function (e) { return e.art === 'split'; });
  /* Split-Datum -> Index im Tagesraster (naechster Handelstag >= Datum) */
  splits.forEach(function (s) {
    s.idx = -1;
    for (var k = 0; k < tage.length; k++) if (tage[k] >= s.datum) { s.idx = k; break; }
    /* Split jenseits des Rasters (heute ausgefuehrt, rueckwirkend eingebacken):
       virtueller Index = letzter Balken + 1, Toleranz 5 Kalendertage */
    if (s.idx < 0 && (new Date(s.datum) - new Date(tage[tage.length - 1])) <= 5 * 86400000) s.idx = tage.length;
  });

  /* alle Spruenge klassifizieren */
  var spruenge = [];
  for (var i = 1; i < r1d.length; i++) {
    var a = r1d[i - 1].c, b = r1d[i].c;
    if (!(a > 0) || !(b > 0)) continue;
    var q = b / a;
    if (q < FAKTOR_MIN && q > 1 / FAKTOR_MIN) continue;
    var klasse = 'U', bezug = '';
    for (var s = 0; s < splits.length; s++) {
      if (splits[s].idx >= 0 && Math.abs(splits[s].idx - i) <= 1) {
        klasse = faktorPasst(q, splits[s].faktor) ? 'F' : 'F?';
        bezug = splits[s].datum + ' x' + splits[s].faktor; break;
      }
    }
    if (klasse === 'U') for (var s2 = 0; s2 < splits.length; s2++) {
      if (faktorPasst(q, splits[s2].faktor)) { klasse = 'F-ECHO'; bezug = 'x' + splits[s2].faktor + ' (Split ' + splits[s2].datum + ')'; break; }
    }
    spruenge.push({ datum: tage[i], q: +q.toFixed(3), klasse: klasse, bezug: bezug, tick: a < 1 ? 'Kurs<1$' : '' });
  }

  /* Rand-Diagnose: Splits nach dem letzten 60m-Balken, Rand-Quote aus I2 */
  var rand = null;
  var segs = i2.segmente || [];
  var randQuote = segs.length ? segs[segs.length - 1].quoteMedian : null;
  var letzter1d = tage[tage.length - 1];
  if (r60letzter) {
    var grenze = new Date(new Date(letzter1d).getTime() + 5 * 86400000).toISOString().slice(0, 10);
    var nachher = splits.filter(function (s) { return s.datum > r60letzter && s.datum <= grenze; });
    if (nachher.length && randQuote !== null) {
      var prod = 1; nachher.forEach(function (s) { prod *= s.faktor; });
      if (faktorPasst(randQuote, prod)) rand = { klasse: 'VERZUG', text: '60m konsistent-roh bis ' + r60letzter + ', 1d rueckangepasst um x' + prod + ' (Split(s) ' + nachher.map(function (s) { return s.datum; }).join(',') + ') — Verzug, keine kaputte Seite' };
      else rand = { klasse: 'RAND-OFFEN', text: 'Split(s) nach 60m-Ende, aber Rand-Quote ' + randQuote + ' passt nicht zu x' + prod };
    }
  }

  var nF = 0, nFq = 0, nEcho = 0, nU = 0;
  spruenge.forEach(function (s) { if (s.klasse === 'F') nF++; else if (s.klasse === 'F?') nFq++; else if (s.klasse === 'F-ECHO') nEcho++; else nU++; });
  var nullwert = +(spruenge.length * splits.length * 3 / r1d.length).toFixed(3);
  var gegenlaeufig = (nF + nEcho) > 0 && rand && rand.klasse === 'VERZUG';

  var diag = i2.diagnose || 'ohne I2';
  var urteil =
    /TRENNFALL/.test(diag) ? 'TRENNFALL (teilen, nicht reparieren)' :
    /SKALEN-VERSATZ/.test(diag) ? ((nF + nEcho) ? 'VERSATZ, ereignis-belegt: 1d-Seite traegt Anpassungsfehler/Skalen-Mischung' :
      (rand && rand.klasse === 'VERZUG' ? 'VERSATZ = Anpassungs-Verzug am Rand (keine kaputte Seite)' : 'VERSATZ ohne Ereignis-Beleg -> unentscheidbar mit diesen zwei Endpunkten')) :
    /konsistent/.test(diag) ? (nF ? 'Quote am Rand konsistent, aber F-Sprung im Altbestand: 1d-Altfall' :
      (nU ? 'unentscheidbar mit diesen zwei Endpunkten (nur U-Spruenge)' : 'konsistent')) :
    ((nF + nEcho) ? 'F-Spruenge vorhanden, Quote unentschieden' : 'unentschieden');

  tabelle.push({ sym: sym, urteilReihenZusammenfassung: urteil, gegenlaeufig: !!gegenlaeufig,
    i2: diag, segmente: segs, rand: rand,
    spruenge: { F: nF, 'F?': nFq, 'F_ECHO': nEcho, U: nU }, nullwertLokal: nullwert,
    splitsGefuehrt: splits.length, letzterBalken: { d1: letzter1d, m60: r60letzter },
    detail: spruenge.filter(function (s) { return s.klasse !== 'U'; }).concat(spruenge.filter(function (s) { return s.klasse === 'U'; }).slice(0, 6)) });

  console.log(sym.padEnd(5) + (gegenlaeufig ? ' [GEGENLAEUFIG] ' : ' ') + urteil);
  console.log('      F/F?/Echo/U=' + nF + '/' + nFq + '/' + nEcho + '/' + nU + '  Null~' + nullwert + '  Splits gefuehrt: ' + splits.length + '  [' + diag + ']');
  spruenge.filter(function (s) { return s.klasse !== 'U'; }).forEach(function (s) {
    console.log('      ' + s.klasse.padEnd(7) + s.datum + '  q=' + s.q + '  ' + s.bezug + (s.tick ? '  ' + s.tick : ''));
  });
  if (rand) console.log('      RAND: ' + rand.text);
});

fs.writeFileSync(path.join(HIER, 'join-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'),
  JSON.stringify({ gemessenAm: new Date().toISOString(), basisLauf: laeufe[laeufe.length - 1], tabelle: tabelle }, null, 1));

/* Eichfall-Pruefung (Erwartungen aus Nachtrag 5 Punkt 7) */
function zeile(sym) { return tabelle.filter(function (z) { return z.sym === sym; })[0] || {}; }
var eich = [];
var w = zeile('WHLR');
eich.push(['WHLR F-Altfall 2017-04-03', ((w.detail || []).some(function (s) { return s.klasse === 'F' && s.datum >= '2017-03-31' && s.datum <= '2017-04-05'; }))]);
eich.push(['WHLR Rand VERZUG x4', !!(w.rand && w.rand.klasse === 'VERZUG')]);
eich.push(['WHLR gegenlaeufig-Flag', !!w.gegenlaeufig]);
var by = zeile('BYND');
eich.push(['BYND F/Echo ~30 + Versatz', (by.spruenge && (by.spruenge.F + by.spruenge.F_ECHO) > 0 && /VERSATZ/.test(by.urteilReihenZusammenfassung || ''))]);
eich.push(['RGR unentscheidbar (0 Splits)', /unentscheidbar/.test((zeile('RGR').urteilReihenZusammenfassung) || '')]);
eich.push(['SITC unentscheidbar oder F 2024', /unentscheidbar|F-Spruenge|ereignis-belegt/.test((zeile('SITC').urteilReihenZusammenfassung) || '')]);
eich.push(['B TRENNFALL', /TRENNFALL/.test((zeile('B').urteilReihenZusammenfassung) || '')]);
eich.push(['QXO TRENNFALL', /TRENNFALL/.test((zeile('QXO').urteilReihenZusammenfassung) || '')]);
eich.push(['ARWR/BYRN/ASTH bleiben U', ['ARWR', 'BYRN', 'ASTH'].every(function (s) { var z = zeile(s); return z.spruenge && z.spruenge.F === 0 && z.spruenge.F_ECHO === 0; })]);
console.log('\n-- EICHUNG --');
var ok = 0; eich.forEach(function (e) { console.log((e[1] ? ' BESTANDEN ' : ' FEHLSCHLAG') + '  ' + e[0]); if (e[1]) ok++; });
console.log(ok + '/' + eich.length + (ok === eich.length ? '  -> Geruest geeicht, Tabelle gilt.' : '  -> EICHUNG NICHT BESTANDEN: Tabelle NICHT verwenden, Ursache messen.'));
console.log('\nNICHTS am Archiv geaendert. Nullwert lokal/provisorisch bis Analytiker-Grundrate.');
