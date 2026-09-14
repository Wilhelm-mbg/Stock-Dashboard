'use strict';
/* TEIL 2 - DER AUSSEN-PRUEFSTEIN (VORREGISTRIERUNG-TEIL2.md §T2.2).
 *
 * Vergleicht unsere monatliche Momentum-Ueberschussreihe (Long-Dezil minus gleichgewichtetes Universum)
 * mit Kenneth Frenchs veroeffentlichtem Momentum-Faktor `Mom`. Geprueft wird der GLEICHLAUF (Pearson-rho),
 * NICHT die Hoehe: Mom ist ein wertgewichteter Long-Short-Faktor ueber alle US-Aktien, unsere Reihe ist
 * Top-Dezil gegen ein gleichgewichtetes Universum von ~220 liquiden Werten.
 *
 * Aufruf:  node aussen.js --referenz <F-F_Momentum_Factor.csv> --perioden <momentum-perioden.json>
 *                        [--bericht <datei.json>]
 *
 * Die Referenzdatei liegt AUSSERHALB des Repos (das Repo ist oeffentlich) und wird NUR GELESEN. In den
 * Bericht kommen ausschliesslich ABGELEITETE Groessen (Korrelationen, Steigung, Vorzeichen) - nie die
 * Werte der Referenzreihe selbst. Deshalb steht der Pfad auch nicht im Code, sondern im Aufruf.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');

/* ---------- Leser der Referenzdatei (§T2.2.1) ---------- */
/** Liefert { monate: {YYYY-MM: Wert}, jahre: {YYYY: Wert}, nMonate, nJahre, verworfen }.
 *  Monatszeilen tragen einen SECHSstelligen Schluessel, Jahreszeilen einen vierstelligen; der
 *  Jahresblock wird getrennt gehalten und geht NIE in die Korrelation ein. Fehlwerte -99.99 / -999
 *  werden verworfen. */
function leseMom(datei) {
  var roh = fs.readFileSync(datei, 'utf8').split(/\r?\n/);
  var monate = {}, jahre = {}, verworfen = 0, sonstige = 0;
  roh.forEach(function (z) {
    var m = /^\s*(\d{4,6})\s*,\s*(-?\d+(?:\.\d+)?)\s*$/.exec(z);
    if (!m) { if (z.trim()) sonstige++; return; }
    var s = m[1], v = parseFloat(m[2]);
    if (v <= -99.99) { verworfen++; return; }
    if (s.length === 6) monate[s.slice(0, 4) + '-' + s.slice(4)] = v;
    else if (s.length === 4) jahre[s] = v;
  });
  return { monate: monate, jahre: jahre, nMonate: Object.keys(monate).length,
    nJahre: Object.keys(jahre).length, verworfen: verworfen, sonstigeZeilen: sonstige };
}

/* ---------- Statistik ---------- */
function pearson(x, y) {
  var n = x.length; if (n < 3) return null;
  var mx = 0, my = 0, i;
  for (i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n; my /= n;
  var sxy = 0, sxx = 0, syy = 0;
  for (i = 0; i < n; i++) { var a = x[i] - mx, b = y[i] - my; sxy += a * b; sxx += a * a; syy += b * b; }
  if (!(sxx > 0) || !(syy > 0)) return null;
  return sxy / Math.sqrt(sxx * syy);
}
function raenge(v) {
  var idx = v.map(function (x, i) { return { x: x, i: i }; }).sort(function (a, b) { return a.x - b.x; });
  var r = new Array(v.length), i = 0;
  while (i < idx.length) {
    var j = i; while (j + 1 < idx.length && idx[j + 1].x === idx[i].x) j++;
    var mittel = (i + j) / 2 + 1;
    for (var k = i; k <= j; k++) r[idx[k].i] = mittel;
    i = j + 1;
  }
  return r;
}
function spearman(x, y) { return pearson(raenge(x), raenge(y)); }
/** Steigung und Achsenabschnitt von y = alpha + beta*x, dazu se(beta) und t. */
function regression(x, y) {
  var n = x.length; if (n < 3) return null;
  var mx = 0, my = 0, i;
  for (i = 0; i < n; i++) { mx += x[i]; my += y[i]; }
  mx /= n; my /= n;
  var sxy = 0, sxx = 0;
  for (i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) * (x[i] - mx); }
  if (!(sxx > 0)) return null;
  var beta = sxy / sxx, alpha = my - beta * mx, q = 0;
  for (i = 0; i < n; i++) { var e = y[i] - alpha - beta * x[i]; q += e * e; }
  var s2 = q / (n - 2), seB = Math.sqrt(s2 / sxx);
  return { alpha: alpha, beta: beta, seBeta: seB, tBeta: seB > 0 ? beta / seB : null, n: n, r2: null };
}
/** Monatsschluessel um k Monate verschieben. */
function schiebe(monat, k) {
  var p = monat.split('-'), j = +p[0], m = +p[1] - 1 + k;
  j += Math.floor(m / 12); m = ((m % 12) + 12) % 12;
  return j + '-' + String(m + 1).padStart(2, '0');
}

function args(argv) {
  var a = { referenz: null, perioden: null, bericht: null, feld: 'brutto' };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--referenz') a.referenz = argv[++i];
    else if (x === '--perioden') a.perioden = argv[++i];
    else if (x === '--bericht') a.bericht = argv[++i];
    else if (x === '--feld') a.feld = argv[++i];
  }
  return a;
}

function haupt() {
  var a = args(process.argv.slice(2));
  if (!a.referenz || !a.perioden) { process.stderr.write('--referenz <csv> --perioden <json> noetig\n'); process.exit(2); }
  var berichtPfad = a.bericht || path.join(K.HIER, 'aussen-pruefstein.json');
  var sag = function (s) { process.stdout.write(s + '\n'); };

  var mom = leseMom(a.referenz);
  var unser = JSON.parse(fs.readFileSync(a.perioden, 'utf8'));
  sag('Referenz: ' + mom.nMonate + ' Monatswerte, ' + mom.nJahre + ' Jahreswerte (verworfen ' + mom.verworfen + ')');
  sag('Unsere Reihe: ' + unser.perioden.length + ' Monatsperioden, ' + unser.perioden[0].monat + ' .. ' + unser.perioden[unser.perioden.length - 1].monat);

  var R = { kennung: K.KONFIG_KENNUNG_TEIL2, stand: new Date().toISOString(),
    referenzDatei: path.basename(a.referenz), referenzMonate: mom.nMonate,
    unsereQuelle: path.basename(a.perioden), unsereReihe: unser.rang, unserFeld: a.feld,
    hinweis: 'Es werden nur ABGELEITETE Groessen berichtet; die Werte der Referenzreihe stehen nicht in dieser Datei.',
    befunde: [] };
  function sichern() { fs.writeFileSync(berichtPfad + '.tmp', JSON.stringify(R, null, 1)); fs.renameSync(berichtPfad + '.tmp', berichtPfad); }
  sichern();

  /* ---------- Paarung nach §T2.2.3 ---------- */
  function paare(versatz) {
    var x = [], y = [], monate = [];
    unser.perioden.forEach(function (p) {
      var schl = schiebe(p.monat, versatz);
      var v = mom.monate[schl];
      if (v === undefined) return;
      x.push(v); y.push(p[a.feld]); monate.push(p.monat);
    });
    return { x: x, y: y, monate: monate };
  }

  var versaetze = {};
  [-1, 0, 1].forEach(function (v) {
    var P = paare(v);
    versaetze[String(v)] = { n: P.x.length, rho: P.x.length >= 3 ? pearson(P.x, P.y) : null };
  });
  R.versatz = versaetze;
  var beste = Object.keys(versaetze).filter(function (k2) { return versaetze[k2].rho != null; })
    .sort(function (p, q) { return Math.abs(versaetze[q].rho) - Math.abs(versaetze[p].rho); })[0];
  R.besterVersatz = beste === undefined ? null : +beste;
  if (R.besterVersatz !== 0) R.befunde.push('ZUORDNUNG: die staerkste Korrelation liegt bei Versatz ' + R.besterVersatz + ', nicht bei 0 - das ist ein Befund ueber die Monatszuordnung, kein Ergebnis');

  /* ---------- Hauptzahl: Versatz 0 ---------- */
  var P0 = paare(0);
  var rho = pearson(P0.x, P0.y);
  var reg = regression(P0.x, P0.y);
  R.haupt = { n: P0.x.length, von: P0.monate[0], bis: P0.monate[P0.monate.length - 1],
    rho: rho, rhoSpearman: spearman(P0.x, P0.y),
    beta: reg ? reg.beta : null, seBeta: reg ? reg.seBeta : null, tBeta: reg ? reg.tBeta : null,
    alpha: reg ? reg.alpha : null,
    /* Verteilungsfreie Begleitzahl: in wie vielen Monaten stimmt das Vorzeichen ueberein? */
    vorzeichenGleich: P0.x.reduce(function (s, v, i) { return s + ((v > 0) === (P0.y[i] > 0) ? 1 : 0); }, 0) };
  R.haupt.vorzeichenAnteil = R.haupt.n ? R.haupt.vorzeichenGleich / R.haupt.n : null;

  R.schranken = { stark: K.AUSSEN_RHO_STARK, schwach: K.AUSSEN_RHO_SCHWACH };
  R.urteil = rho == null ? 'nicht rechenbar'
    : rho >= K.AUSSEN_RHO_STARK ? 'bestanden'
    : rho >= K.AUSSEN_RHO_SCHWACH ? 'teilweise' : 'GEFALLEN';
  if (R.urteil === 'GEFALLEN') R.befunde.push('AUSSEN-PRUEFSTEIN GEFALLEN: rho ' + rho.toFixed(3) + ' < ' + K.AUSSEN_RHO_SCHWACH + ' - unsere Momentum-Zahl misst etwas anderes als der Faktor; die +1,622 Pp aus Teil 1 sind bis zur Klaerung nicht verwendbar. MELDEN, NICHT REPARIEREN.');
  sichern();

  /* ---------- Je Kalenderjahr ---------- */
  var jahre = {};
  P0.monate.forEach(function (m, i) { var j = m.slice(0, 4); (jahre[j] = jahre[j] || { x: [], y: [] }); jahre[j].x.push(P0.x[i]); jahre[j].y.push(P0.y[i]); });
  R.jahre = Object.keys(jahre).sort().map(function (j) {
    var e = jahre[j];
    return { jahr: +j, n: e.x.length, rho: e.x.length >= 3 ? pearson(e.x, e.y) : null,
      unsereSumme: e.y.reduce(function (s, v) { return s + v; }, 0),
      duenn: e.x.length < K.AUSSEN_JAHR_MIN_MONATE };
  });

  /* ---------- Der Momentum-Einbruch: Vorzeichen Monat fuer Monat ----------
   * Von der Referenzreihe wird hier NUR das Vorzeichen uebernommen, nicht der Wert. */
  var fenster = [];
  for (var jj = 2020; jj <= 2021; jj++) for (var mm = 1; mm <= 12; mm++) fenster.push(jj + '-' + String(mm).padStart(2, '0'));
  var idx = {}; unser.perioden.forEach(function (p) { idx[p.monat] = p; });
  R.einbruch2021 = fenster.map(function (m) {
    var v = mom.monate[m], u = idx[m];
    return { monat: m, momVorzeichen: v === undefined ? null : (v > 0 ? '+' : v < 0 ? '-' : '0'),
      unser: u ? u[a.feld] : null, gleich: (v === undefined || !u) ? null : ((v > 0) === (u[a.feld] > 0)) };
  }).filter(function (e) { return e.momVorzeichen !== null || e.unser !== null; });
  var imFenster = R.einbruch2021.filter(function (e) { return e.gleich !== null; });
  R.einbruch2021Zusammenfassung = { monate: imFenster.length,
    vorzeichenGleich: imFenster.filter(function (e) { return e.gleich; }).length,
    unsereSumme2021: R.einbruch2021.filter(function (e) { return e.monat.slice(0, 4) === '2021' && e.unser != null; })
      .reduce(function (s, e) { return s + e.unser; }, 0),
    momJahr2021Vorzeichen: mom.jahre['2021'] === undefined ? null : (mom.jahre['2021'] > 0 ? '+' : '-') };

  /* ---------- DIAGNOSEN (nachrichtlich, NACH dem Urteil, ausdruecklich nicht vorregistriert) ----------
   * Sie aendern das Urteil aus §T2.2.4 nicht - das steht oben und bleibt stehen. Sie beantworten die
   * Anschlussfrage "WO weicht es ab", die der Auftrag fuer den Fall "teilweise" ausdruecklich stellt. */
  R.diagnoseHinweis = 'Alles unter "diagnose" wurde NACH dem Urteil gerechnet und ist nicht vorregistriert.';
  var d = { felder: {}, jahrWeggelassen: [] };
  /* (1) dieselbe Korrelation fuer die Diagnosegroessen des Laufs: Long-Short und Short-Universum.
   *     Mom IST ein Long-Short-Faktor; unsere registrierte Groesse ist es nicht. */
  ['brutto', 'lsBrutto', 'kurzBrutto'].forEach(function (f) {
    var x = [], y = [];
    unser.perioden.forEach(function (p) { var v = mom.monate[p.monat]; if (v === undefined || p[f] == null) return; x.push(v); y.push(p[f]); });
    var rg = regression(x, y);
    d.felder[f] = { n: x.length, rho: x.length >= 3 ? pearson(x, y) : null, beta: rg ? rg.beta : null, seBeta: rg ? rg.seBeta : null };
  });
  /* (2) Jahres-Auslassprobe: welches Kalenderjahr traegt oder schaedigt das Gesamt-rho? */
  R.jahre.forEach(function (J) {
    var x = [], y = [];
    P0.monate.forEach(function (m, i) { if (+m.slice(0, 4) === J.jahr) return; x.push(P0.x[i]); y.push(P0.y[i]); });
    d.jahrWeggelassen.push({ ohneJahr: J.jahr, n: x.length, rho: x.length >= 3 ? pearson(x, y) : null });
  });
  R.diagnose = d;

  sichern();
  sag('Diagnose rho: Long-Universum ' + (d.felder.brutto.rho == null ? '-' : d.felder.brutto.rho.toFixed(3))
    + ' | Long-Short ' + (d.felder.lsBrutto.rho == null ? '-' : d.felder.lsBrutto.rho.toFixed(3))
    + ' (beta ' + (d.felder.lsBrutto.beta == null ? '-' : d.felder.lsBrutto.beta.toFixed(2)) + ')'
    + ' | Short-Universum ' + (d.felder.kurzBrutto.rho == null ? '-' : d.felder.kurzBrutto.rho.toFixed(3)));
  sag('ohne Jahr: ' + d.jahrWeggelassen.map(function (e) { return e.ohneJahr + ' ' + (e.rho == null ? '-' : e.rho.toFixed(3)); }).join(', '));
  sag('rho (Versatz 0, n ' + R.haupt.n + ', ' + R.haupt.von + '..' + R.haupt.bis + ') = ' + (rho == null ? '-' : rho.toFixed(4))
    + '  [Spearman ' + (R.haupt.rhoSpearman == null ? '-' : R.haupt.rhoSpearman.toFixed(4)) + ']  => ' + R.urteil.toUpperCase());
  sag('Versatz -1 / 0 / +1: ' + [-1, 0, 1].map(function (v) { var e = versaetze[String(v)]; return (e.rho == null ? '-' : e.rho.toFixed(3)) + ' (n ' + e.n + ')'; }).join('  |  '));
  sag('beta ' + (R.haupt.beta == null ? '-' : R.haupt.beta.toFixed(3)) + ' (se ' + (R.haupt.seBeta == null ? '-' : R.haupt.seBeta.toFixed(3)) + '), Vorzeichen gleich in ' + R.haupt.vorzeichenGleich + '/' + R.haupt.n + ' Monaten');
  sag('Einbruch 2020/21: Vorzeichen gleich in ' + R.einbruch2021Zusammenfassung.vorzeichenGleich + '/' + R.einbruch2021Zusammenfassung.monate + ' Monaten; unsere Summe 2021 ' + R.einbruch2021Zusammenfassung.unsereSumme2021.toFixed(2) + ' Pp, Mom-Jahr 2021 Vorzeichen ' + R.einbruch2021Zusammenfassung.momJahr2021Vorzeichen);
  sag('Jahre: ' + R.jahre.map(function (j) { return j.jahr + ' ' + (j.rho == null ? '-' : j.rho.toFixed(2)) + (j.duenn ? '*' : ''); }).join(', '));
  if (R.befunde.length) sag('\nBEFUNDE:\n- ' + R.befunde.join('\n- '));
  sag('Bericht: ' + berichtPfad);
}

if (require.main === module) haupt();
module.exports = { leseMom: leseMom, pearson: pearson, spearman: spearman, regression: regression, schiebe: schiebe };
