'use strict';
/* KONTROLLEN - Orakel, Zufall, Momentum 12-1, Leck-Probe (VORREGISTRIERUNG §3, §2.8).
 *
 * Aufruf:  node --max-old-space-size=6144 kontrollen.js --aus <ordner> [--nur orakel,zufall,momentum,leck]
 *                                                       [--bericht <datei.json>] [--kunst]
 *
 * Schreibt SOFORT nach jedem Teilergebnis auf die Platte (--bericht, Vorgabe <aus>/kontrollen.json).
 * Schlaegt eine Schranke fehl, wird das GEMELDET und der Lauf als nicht bestanden markiert - nichts wird
 * repariert und weitergerechnet.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var PR = require('./pruefstand.js');
var RF = require('./rangfunktionen.js');

function args(argv) {
  var a = { aus: null, nur: null, bericht: null, kunst: false, empfindlichkeit: null };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--nur') a.nur = String(argv[++i]).split(',');
    else if (x === '--bericht') a.bericht = argv[++i];
    else if (x === '--kunst') a.kunst = true;
    else if (x === '--empfindlichkeit') a.empfindlichkeit = String(argv[++i]).split(',');
  }
  return a;
}
function will(a, name) { return !a.nur || a.nur.indexOf(name) !== -1; }

/* ---------- eine Bewertung zu einer Zeile verdichten ---------- */
function zeile(T, B, feld) {
  var h = PR.kennzahlen(B.haupt.perioden, B.haupt.tage, B.lag, feld);
  return { n: h.n, mittel: h.mittel, se: h.se, t: h.t, sd: h.sd,
    tagN: h.tagN, tagSeNaiv: h.tagSeNaiv, tagSeHH: h.tagSeHH, tagSeNW: h.tagSeNW, marke: h.marke };
}
function jahresscheiben(B, feld) {
  var aus = [];
  Object.keys(B.haupt.jahre).map(Number).sort(function (a, b) { return a - b; }).forEach(function (j) {
    var p = B.haupt.jahre[j];
    var k = PR.kennzahlen(p, null, B.lag, feld);
    aus.push({ jahr: j, n: k.n, mittel: k.mittel, se: k.se, t: k.t, duenn: k.n < K.JAHR_MIN_PERIODEN });
  });
  return aus;
}
function regimeschnitt(B, feld) {
  var aus = {};
  [0, 1].forEach(function (r) {
    var p = B.haupt.perioden.filter(function (x) { return x.regime === r; });
    var k = PR.kennzahlen(p, null, B.lag, feld);
    aus[r ? 'ueberEMA200' : 'unterEMA200'] = { n: k.n, mittel: k.mittel, se: k.se, t: k.t };
  });
  var ohne = B.haupt.perioden.filter(function (x) { return x.regime === undefined; }).length;
  aus.ohneRegime = ohne;
  return aus;
}
function aktuell(T, B, feld) {
  var abTag = T.maxTag - K.AKTUELL_TAGE;
  var p = B.haupt.perioden.filter(function (x) { return x.t >= abTag; });
  var k = PR.kennzahlen(p, null, B.lag, feld);
  return { abTag: T.kal.tage[Math.max(0, abTag)], n: k.n, mittel: k.mittel, se: k.se, t: k.t };
}

function auswerten(T, B) {
  var brutto = zeile(T, B, 'brutto'), netto = zeile(T, B, 'netto');
  return {
    freq: B.freq, empfindlichkeit: B.empfindlichkeit, lag: B.lag,
    verstoesse: B.verstoesse, beispiele: B.beispiele, ungueltig: B.ungueltig,
    perioden: B.haupt.perioden.length,
    universumMittel: B.haupt.perioden.length ? B.haupt.perioden.reduce(function (s, p) { return s + p.nUni; }, 0) / B.haupt.perioden.length : null,
    dezilMittel: B.haupt.perioden.length ? B.haupt.perioden.reduce(function (s, p) { return s + p.k; }, 0) / B.haupt.perioden.length : null,
    umschlagMittel: B.haupt.umschlagMittel, kostenMittel: B.haupt.kostenMittel,
    umschlagUniMittel: B.haupt.perioden.length ? B.haupt.perioden.reduce(function (s, p) { return s + 0; }, 0) : null,
    brutto: brutto, netto: netto,
    eigenBrutto: PR.kennzahlen(B.haupt.perioden, null, B.lag, 'eigenBrutto').mittel,
    eigenNetto: PR.kennzahlen(B.haupt.perioden, null, B.lag, 'eigenNetto').mittel,
    uniBrutto: PR.kennzahlen(B.haupt.perioden, null, B.lag, 'uniBrutto').mittel,
    uniNetto: PR.kennzahlen(B.haupt.perioden, null, B.lag, 'uniNetto').mittel,
    kurzBrutto: PR.kennzahlen(B.kurz.perioden, null, B.lag, 'brutto').mittel,
    longShortBrutto: PR.kennzahlen(B.longShort.perioden, null, B.lag, 'brutto'),
    longShortNetto: PR.kennzahlen(B.longShort.perioden, null, B.lag, 'netto'),
    jahre: { brutto: jahresscheiben(B, 'brutto'), netto: jahresscheiben(B, 'netto') },
    regime: regimeschnitt(B, 'netto'),
    aktuell: { brutto: aktuell(T, B, 'brutto'), netto: aktuell(T, B, 'netto') },
    zaehler: B.zaehler,
  };
}

function fahre(T, rangFn, opt) {
  var L = PR.lauf(T, rangFn, opt);
  var B = PR.bewerte(T, L, { regime: opt.regime });
  var a = auswerten(T, B);
  a.rang = rangFn.$name;
  return a;
}

function haupt() {
  var a = args(process.argv.slice(2));
  if (!a.aus) { process.stderr.write('--aus <ordner> fehlt\n'); process.exit(2); }
  var berichtPfad = a.bericht || path.join(a.aus, 'kontrollen.json');
  var t0 = Date.now();
  process.stdout.write('Tafel laden aus ' + a.aus + ' ...\n');
  var T = PR.Tafel(a.aus);
  var regime = PR.spyRegime(T);
  process.stdout.write('Tafel: ' + T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, bis ' + T.kal.tage[T.maxTag] + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)\n');

  var B = { kennung: K.KONFIG_KENNUNG, panel: T.stand.kennung, kunst: !!T.stand.kunst, stand: new Date().toISOString(),
    letzterTag: T.kal.tage[T.maxTag], zeilen: T.g.n, reihen: T.nSym, bestanden: null, befunde: [], laeufe: {} };
  function sichern() { fs.writeFileSync(berichtPfad + '.tmp', JSON.stringify(B, null, 1)); fs.renameSync(berichtPfad + '.tmp', berichtPfad); }
  function sag(s) { process.stdout.write(s + '\n'); }
  sichern();

  /* ---------- (0) Leck-Probe zuerst: ohne funktionierende Klinke ist alles andere wertlos ---------- */
  if (will(a, 'leck')) {
    var lp = PR.lauf(T, RF.leckProbe, { freq: 'woche', empfindlichkeit: 'haupt' });
    var sp = PR.lauf(T, RF.sauberProbe, { freq: 'woche', empfindlichkeit: 'haupt' });
    B.leck = { verstoesseLeck: lp.verstoesse, beispieleLeck: lp.beispiele.slice(0, 5), ungueltigLeck: lp.ungueltig,
      verstoesseSauber: sp.verstoesse, ungueltigSauber: sp.ungueltig,
      bestanden: lp.verstoesse > 0 && lp.ungueltig === true && sp.verstoesse === 0 && sp.ungueltig === false };
    if (!B.leck.bestanden) B.befunde.push('LECK-PROBE GEFALLEN: Klinke meldete ' + lp.verstoesse + ' Verstoesse (erwartet > 0) und die saubere Probe ' + sp.verstoesse + ' (erwartet 0)');
    sag('Leck-Probe: ' + lp.verstoesse + ' Verstoesse (Leck) / ' + sp.verstoesse + ' (sauber) => ' + (B.leck.bestanden ? 'bestanden' : 'GEFALLEN'));
    sichern();
  }

  /* ---------- (1) Orakel ---------- */
  if (will(a, 'orakel')) {
    B.laeufe.orakel = {};
    K.FREQUENZEN.forEach(function (F) {
      ['orakelTag', 'orakelPeriode'].forEach(function (fassung) {
        var fn = fassung === 'orakelTag' ? RF.orakelTag : RF.orakelPeriode;
        var r = fahre(T, fn, { freq: F.key, orakel: true, empfindlichkeit: 'haupt', regime: regime });
        B.laeufe.orakel[fassung + '/' + F.key] = r;
        sag('Orakel ' + fassung + ' ' + F.key + ': brutto ' + r.brutto.mittel.toFixed(3) + ' Pp (t ' + (r.brutto.t == null ? '-' : r.brutto.t.toFixed(1)) + '), netto ' + r.netto.mittel.toFixed(3) + ' Pp, n ' + r.perioden + ', Universum ' + r.universumMittel.toFixed(0) + ', Umschlag ' + (100 * r.umschlagMittel).toFixed(1) + ' %');
        sichern();
      });
    });
    /* Tor nach NACHTRAG 4: Pp-Schranke unveraendert, dazu skalenfrei |Mittel|/sd >= 1 mit t-Boden.
     * Das alte Kriterium t >= 20 wird MITGERECHNET und ausgewiesen, entscheidet aber nicht mehr. */
    var tor = [];
    K.FREQUENZEN.forEach(function (F) {
      var r = B.laeufe.orakel['orakelTag/' + F.key];
      var mSd = (r.brutto.sd > 0) ? r.brutto.mittel / r.brutto.sd : null;
      r.mittelDurchSd = mSd;
      r.altesKriteriumT20 = (r.brutto.t >= K.ORAKEL_MIN_T_ALT);
      if (!(r.brutto.mittel >= K.ORAKEL_MIN_PP)) tor.push('Orakel(Tag) ' + F.key + ' brutto ' + r.brutto.mittel.toFixed(3) + ' Pp < ' + K.ORAKEL_MIN_PP);
      if (!(r.netto.mittel >= K.ORAKEL_MIN_PP)) tor.push('Orakel(Tag) ' + F.key + ' netto ' + r.netto.mittel.toFixed(3) + ' Pp < ' + K.ORAKEL_MIN_PP);
      if (!(mSd >= K.ORAKEL_MIN_SD)) tor.push('Orakel(Tag) ' + F.key + ' Mittel/sd ' + (mSd == null ? 'null' : mSd.toFixed(2)) + ' < ' + K.ORAKEL_MIN_SD);
      if (!(r.brutto.t >= K.ORAKEL_T_BODEN)) tor.push('Orakel(Tag) ' + F.key + ' t ' + (r.brutto.t == null ? 'null' : r.brutto.t.toFixed(1)) + ' < Boden ' + K.ORAKEL_T_BODEN);
    });
    var rw = B.laeufe.orakel['orakelPeriode/woche'];
    if (!(rw.brutto.mittel >= K.ORAKEL_H_MIN_PP_WOCHE)) tor.push('Orakel(Periode) Woche brutto ' + rw.brutto.mittel.toFixed(3) + ' Pp < ' + K.ORAKEL_H_MIN_PP_WOCHE);
    B.orakelBestanden = tor.length === 0;
    if (tor.length) B.befunde.push('ORAKEL GEFALLEN: ' + tor.join(' | '));
    sag('Orakel-Tor: ' + (B.orakelBestanden ? 'bestanden' : 'GEFALLEN - ' + tor.join(' | ')));
    sichern();
  }

  /* ---------- (2) Zufall ---------- */
  if (will(a, 'zufall')) {
    B.laeufe.zufall = {};
    K.FREQUENZEN.forEach(function (F) {
      var einzeln = [], mittelB = 0, mittelN = 0, fehler = 0;
      for (var z = 0; z < K.ZUFALL_ZIEHUNGEN; z++) {
        var r = fahre(T, RF.zufallFabrik(K.ZUFALL_SAAT + '#' + z), { freq: F.key, empfindlichkeit: 'haupt', regime: regime });
        var schranke = K.ZUFALL_SCHRANKE[F.key];
        /* NACHTRAG 4: die EINZELNE Ziehung wird skalenfrei nach |t| < 3 beurteilt - die Pp-Schranke sitzt
         * monatlich bei 1,2 se und liesse einen sauberen Placebo in einem Drittel der Faelle durchfallen.
         * Die Pp-Schranke gilt fuer das MITTEL der Ziehungen (unten). Beides steht in der Zeile. */
        var tOk = !(Math.abs(r.brutto.t) >= K.ZUFALL_T_EINZELN);
        var bOk = Math.abs(r.brutto.mittel) < schranke;
        var nOk = Math.abs(r.netto.mittel + r.kostenMittel) < schranke;
        if (!tOk) fehler++;
        einzeln.push({ ziehung: z, n: r.perioden, brutto: r.brutto.mittel, se: r.brutto.se, t: r.brutto.t,
          netto: r.netto.mittel, kosten: r.kostenMittel, umschlag: r.umschlagMittel, tOk: tOk,
          ppAlt: { bOk: bOk, nOk: nOk }, verstoesse: r.verstoesse });
        mittelB += r.brutto.mittel; mittelN += r.netto.mittel + r.kostenMittel;
        if (z === 0) B.laeufe.zufall[F.key + '/voll0'] = r;
        sichern();
      }
      mittelB /= K.ZUFALL_ZIEHUNGEN; mittelN /= K.ZUFALL_ZIEHUNGEN;
      var schr = K.ZUFALL_SCHRANKE[F.key];
      var seEinzeln = einzeln.reduce(function (s, x) { return s + x.se; }, 0) / einzeln.length;
      var best = Math.abs(mittelB) < schr && Math.abs(mittelN) < schr && fehler <= K.ZUFALL_MAX_FEHLER;
      var ppAltFehler = einzeln.filter(function (x) { return !x.ppAlt.bOk || !x.ppAlt.nOk; }).length;
      B.laeufe.zufall[F.key] = { einzeln: einzeln, mittelBrutto: mittelB, mittelNettoPlusKosten: mittelN,
        schranke: schr, seEinzelnMittel: seEinzeln, seDesMittels: seEinzeln / Math.sqrt(K.ZUFALL_ZIEHUNGEN),
        schrankeInSeDesMittels: schr / (seEinzeln / Math.sqrt(K.ZUFALL_ZIEHUNGEN)),
        fehlerEinzelnT: fehler, maxFehler: K.ZUFALL_MAX_FEHLER,
        gefallenesKriteriumPpEinzeln: ppAltFehler, bestanden: best };
      if (!best) B.befunde.push('ZUFALL GEFALLEN (' + F.key + '): Mittel brutto ' + mittelB.toFixed(4) + ' Pp, netto+Kosten ' + mittelN.toFixed(4) + ' Pp, Schranke ' + schr + ', Ziehungen mit |t| >= 3: ' + fehler + '/' + K.ZUFALL_ZIEHUNGEN);
      sag('Zufall ' + F.key + ': Mittel brutto ' + mittelB.toFixed(4) + ' Pp, netto+Kosten ' + mittelN.toFixed(4) + ' Pp (Schranke ' + schr + ' = ' + (schr / (seEinzeln / Math.sqrt(K.ZUFALL_ZIEHUNGEN))).toFixed(1) + ' se des Mittels), |t|>=3 in ' + fehler + ' Ziehungen (altes Pp-Einzelkriterium haette ' + ppAltFehler + ' gefaellt) => ' + (best ? 'bestanden' : 'GEFALLEN'));
      sichern();
    });
    B.zufallBestanden = K.FREQUENZEN.every(function (F) { return B.laeufe.zufall[F.key].bestanden; });
  }

  /* ---------- (3) Momentum 12-1 (kein Tor) ---------- */
  if (will(a, 'momentum')) {
    B.laeufe.momentum = {};
    K.FREQUENZEN.forEach(function (F) {
      K.EMPFINDLICHKEIT.forEach(function (E) {
        if (F.key === 'woche' && E.key !== 'haupt') return;              /* Empfindlichkeit nur monatlich */
        var r = fahre(T, RF.momentum12_1, { freq: F.key, empfindlichkeit: E.key, regime: regime });
        B.laeufe.momentum[F.key + '/' + E.key] = r;
        sag('Momentum 12-1 ' + F.key + '/' + E.key + ': brutto ' + r.brutto.mittel.toFixed(4) + ' Pp (t ' + (r.brutto.t == null ? '-' : r.brutto.t.toFixed(2)) + '), netto ' + r.netto.mittel.toFixed(4) + ' Pp (t ' + (r.netto.t == null ? '-' : r.netto.t.toFixed(2)) + '), n ' + r.perioden + ', Umschlag ' + (100 * r.umschlagMittel).toFixed(1) + ' %, Tote ' + r.zaehler.tote);
        sichern();
      });
    });
    /* Empfindlichkeit Cent-Boden (registrierte Variante, §2.1) */
    var ohne = fahre(T, RF.momentum12_1, { freq: 'monat', empfindlichkeit: 'haupt', ohneCentBoden: true, regime: regime });
    B.laeufe.momentum['monat/ohneCentBoden'] = ohne;
    sag('Momentum 12-1 monat ohne Cent-Boden: brutto ' + ohne.brutto.mittel.toFixed(4) + ' Pp, Universum ' + ohne.universumMittel.toFixed(0));
    sichern();
  }

  B.sekunden = (Date.now() - t0) / 1000;
  B.bestanden = B.befunde.length === 0;
  sichern();
  sag('\n' + (B.bestanden ? 'ALLE KONTROLLEN BESTANDEN' : 'BEFUNDE:\n- ' + B.befunde.join('\n- ')));
  sag('Bericht: ' + berichtPfad + ' (' + B.sekunden.toFixed(0) + ' s)');
}

if (require.main === module) haupt();
module.exports = { auswerten: auswerten, fahre: fahre, jahresscheiben: jahresscheiben };
