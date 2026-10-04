'use strict';
/* Tests fuer das Signal der Regel R3 (regel-R3.js; REGEL.md §4.3, §7 N3; Siegel 6f9d06f).
 *
 *   node studien/trendfilter-messung-2026-10/test-R3.js        (aus der Repo-Wurzel)
 *
 * Ausgabe „N grün, M rot", Rueckgabewert 1 bei rot.
 * Teil 1: Kunstdaten ueber K.baueDaten, Sollwerte VON HAND gerechnet (Rechenweg je Fall im Kommentar).
 * Teil 2: echte Daten (daten/SPY.json): zweiter, eigener Weg (eigene SMA direkt aus laden.lies, andere Summationsrichtung,
 *         eigener Zustandsautomat) gegen regel-R3.js an JEDEM Tag; Gleitkomma-Grenzfaelle; kein Blick voraus.
 *         Auf echten Daten wird NUR das Signal gerechnet - kein Buch, kein Ertrag (K.simuliere nur auf Kunstdaten).
 * Teil 3: signale-R3.json gegen eine Neuberechnung. */
var fs = require('fs');
var path = require('path');
var K = require('./kern.js');
var L = require('./laden.js');
var R3 = require('./regel-R3.js');

var gruen = 0, rot = 0;
function pruefe(name, ok, info) {
  if (ok) gruen++;
  else { rot++; console.log('ROT  ' + name + (info ? '  ' + info : '')); }
}
function gleich(name, ist, soll) {
  var a = JSON.stringify(ist), b = JSON.stringify(soll);
  pruefe(name, a === b, a === b ? '' : 'ist ' + a + ' soll ' + b);
}
function nahe(name, ist, soll, tol) {
  pruefe(name, Math.abs(ist - soll) <= tol, 'ist ' + ist + ' soll ' + soll);
}
/** Fuehrt einen Abschnitt aus; eine Ausnahme zaehlt als rot (der Rest des Abschnitts entfaellt), die Tests laufen weiter. */
function abschnitt(name, fn) {
  try { return fn(); } catch (e) { pruefe('Abschnitt ' + name + ' ohne Ausnahme', false, String(e && e.message || e)); return null; }
}

/* ---------------- Kunstdaten ---------------- */
/** n Werktage ab Montag 2001-01-01 (Wochenenden ausgelassen; Feiertage spielen fuer das Signal keine Rolle). */
function werktage(n) {
  var aus = [], ms = Date.UTC(2001, 0, 1);
  while (aus.length < n) {
    var w = new Date(ms).getUTCDay();
    if (w !== 0 && w !== 6) aus.push(new Date(ms).toISOString().slice(0, 10));
    ms += 86400000;
  }
  return aus;
}
/** D aus Schlusskursen cs (Eroeffnung = Schluss), optional Ausschuettungen [{i, betrag}] und eine Geldreihe BIL/SHY zu 50. */
function baue(cs, div) {
  var t = werktage(cs.length);
  var roh = {
    SPY: { zeilen: cs.map(function (c, i) { return { tag: t[i], o: c, c: c }; }),
      div: (div || []).map(function (x) { return { tag: t[x.i], betrag: x.betrag }; }) },
    BIL: { zeilen: t.map(function (tg) { return { tag: tg, o: 50, c: 50 }; }), div: [] },
    SHY: { zeilen: t.map(function (tg) { return { tag: tg, o: 50, c: 50 }; }), div: [] }
  };
  return K.baueDaten(roh, '2099-12-31');
}
function reihe(n, wert) { return new Array(n).fill(wert); }
var HAUPT = K.HAUPT;
var N3 = Object.assign({}, K.HAUPT, { ohneBand: true });
var SHY = Object.assign({}, K.HAUPT, { geld: 'SHY' });
var N3SHY = Object.assign({}, K.HAUPT, { geld: 'SHY', ohneBand: true });
function ab(ziel, von) { return ziel.slice(von); }

/* Gleitkomma-Vorbedingungen der Bandfaelle: 0,99 x 100 und 1,01 x 100 sind in IEEE-754 genau 99 und 101
 * (0,99 = 0,98999999999999999112 -> x 100 = 98,999999999999999112, naechste Zahl 99; ulp bei 99 ist 1,4e-14). */
pruefe('Gleitkomma: 0.99 * 100 === 99', 0.99 * 100 === 99);
pruefe('Gleitkomma: 1.01 * 100 === 101', 1.01 * 100 === 101);

/* ---- Fall L: Laenge und erster Tag ----
 * 200 Kurse: es gibt keinen Tag 200, also ist ziel[0..199] = null. 201 Kurse: ziel[200] ist der Zustand nach Tag 199. */
abschnitt('L', function () {
  var z200 = R3.signal(baue(reihe(200, 100)), HAUPT);
  gleich('L1 Laenge = D.n (200)', z200.length, 200);
  pruefe('L1 bei 200 Kursen alles null', z200.every(function (x) { return x === null; }));
  var z201 = R3.signal(baue(reihe(201, 100)), HAUPT);
  pruefe('L2 bei 201 Kursen ziel[0..199] null', z201.slice(0, 200).every(function (x) { return x === null; }));
  pruefe('L2 bei 201 Kursen ziel[200] gesetzt', z201[200] !== null);
  gleich('L3 weniger als 200 Kurse: alles null, keine Wechsel', [R3.signal(baue(reihe(150, 100)), HAUPT).filter(function (x) { return x !== null; }).length,
    R3.details(baue(reihe(150, 100)), HAUPT).length], [0, 0]);
});

/* ---- Fall A: Anfangszustand am Index 199 (ohne Band: C > SMA200 -> investiert) ----
 * A1: c[0..198]=100, c[199]=100,5, c[200]=100,5, c[201]=100,5.
 *     Tag 199: Summe 199x100 + 100,5 = 20000,5 -> SMA 100,0025; 100,5 > 100,0025 -> investiert (obwohl unter 1,01 x SMA = 101,0025)
 *              -> ziel[200] = SPY.
 *     Tag 200: Fenster 1..200 = 198x100 + 2x100,5 = 20001 -> SMA 100,005; 0,99 x SMA = 99,00495; 100,5 > -> bleibt -> ziel[201] = SPY.
 *     (Ein Rechner, der „draussen" beginnt und das Band schon am Tag 199 anwendet, liefert BIL.)
 * A2: c[0..198]=100, c[199..201]=99,5.
 *     Tag 199: 19900 + 99,5 = 19999,5 -> SMA 99,9975; 99,5 > 99,9975? nein -> draussen (obwohl ueber 0,99 x SMA = 98,9975)
 *              -> ziel[200] = BIL.
 *     Tag 200: 198x100 + 2x99,5 = 19999 -> SMA 99,995; 1,01 x SMA = 100,99495; 99,5 < -> bleibt draussen -> ziel[201] = BIL.
 * A3: 201 x 100: Tag 199 C = SMA = 100, nicht > -> draussen -> ziel[200] = BIL (strikt groesser). */
abschnitt('A', function () {
  var a1 = reihe(199, 100).concat([100.5, 100.5, 100.5]);
  gleich('A1 Anfang investiert bei C knapp > SMA', ab(R3.signal(baue(a1), HAUPT), 199), [null, 'SPY', 'SPY']);
  var a2 = reihe(199, 100).concat([99.5, 99.5, 99.5]);
  gleich('A2 Anfang draussen bei C knapp < SMA', ab(R3.signal(baue(a2), HAUPT), 199), [null, 'BIL', 'BIL']);
  gleich('A3 Anfang draussen bei C = SMA', ab(R3.signal(baue(reihe(201, 100)), HAUPT), 200), ['BIL']);
  var an = R3.lauf(baue(a1), HAUPT).anfang;
  gleich('A1 Anfangszustand in lauf().anfang', [an.i, an.neu], [199, 'SPY']);
  nahe('A1 Verhaeltnis am Anfang 100,5/100,0025', an.verhaeltnis, 100.5 / 100.0025, 1e-12);
});

/* ---- Fall F: Fenster genau 200 Tage einschliesslich d ----
 * c[0]=50, c[1]=120, c[2..199]=100, c[200]=99, c[201]=100.
 *   Tag 199: Fenster 0..199 = 50 + 120 + 198x100 = 19970 -> SMA 99,85; C=100 > -> investiert -> ziel[200] = SPY.
 *            (Fenster 199 Tage 1..199: 19920/199 = 100,1005 -> C nicht > -> waere BIL.)
 *   Tag 200: Fenster 1..200 = 120 + 198x100 + 99 = 20019 -> SMA 100,095; 0,99 x SMA = 99,09405; 99 <= -> draussen -> ziel[201] = BIL.
 *     Gegenrechnung der falschen Fenster am Tag 200 (alle liefern SPY, d. h. kein Ausstieg):
 *       199 Tage 2..200: 19899/199 = 99,99497 -> x0,99 = 98,99503 < 99;
 *       201 Tage 0..200: 20069/201 = 99,84577 -> x0,99 = 98,84731 < 99;
 *       200 Tage OHNE d (0..199): 99,85 -> x0,99 = 98,8515 < 99. */
abschnitt('F', function () {
  var f = [50, 120].concat(reihe(198, 100)).concat([99, 100]);
  gleich('F Kunstreihe hat 202 Tage', f.length, 202);
  gleich('F Fenster genau 200 Tage (ziel[200], ziel[201])', ab(R3.signal(baue(f), HAUPT), 200), ['SPY', 'BIL']);
  var w = R3.details(baue(f), HAUPT);
  gleich('F ein Wechsel am Signaltag 200', w.map(function (x) { return [x.i, x.neu]; }), [[200, 'BIL']]);
  nahe('F Verhaeltnis 99/100,095', w[0].verhaeltnis, 99 / 100.095, 1e-12);
});

/* ---- Fall B: Bandgrenzen genau getroffen (Gleitkomma exakt) und knapp daneben ----
 * B1 Ausstieg: c[0]=50, c[1]=101, c[2..199]=100, c[200]=99, c[201]=100.
 *   Tag 199: 50 + 101 + 19800 = 19951 -> SMA 99,755; 100 > -> investiert -> ziel[200] = SPY.
 *   Tag 200: Fenster 1..200 = 101 + 19800 + 99 = 20000 -> SMA = 100 genau (ganze Zahlen, exakt summiert);
 *            0,99 x 100 = 99 genau; C = 99 <= 99 -> Ausstieg -> ziel[201] = BIL.
 * B1' knapp darueber: c[200] = 99,000001 -> SMA = 100,000000005; 0,99 x SMA = 99,00000000495 < 99,000001 -> bleibt -> SPY.
 * B2 Einstieg: c[0]=150, c[1]=99, c[2..199]=100, c[200]=101, c[201]=100.
 *   Tag 199: 150 + 99 + 19800 = 20049 -> SMA 100,245; C=100 nicht > -> draussen -> ziel[200] = BIL.
 *   Tag 200: Fenster 1..200 = 99 + 19800 + 101 = 20000 -> SMA = 100 genau; 1,01 x 100 = 101 genau; C = 101 >= 101 -> Einstieg
 *            -> ziel[201] = SPY.
 * B2' knapp darunter: c[200] = 100,999999 -> SMA = 99,999999995; 1,01 x SMA = 100,99999999495 > 100,999999 -> bleibt -> BIL. */
abschnitt('B', function () {
  var b1 = [50, 101].concat(reihe(198, 100)).concat([99, 100]);
  gleich('B1 Ausstieg genau bei C = 0,99 x SMA', ab(R3.signal(baue(b1), HAUPT), 200), ['SPY', 'BIL']);
  var b1x = [50, 101].concat(reihe(198, 100)).concat([99.000001, 100]);
  gleich("B1' knapp ueber 0,99 x SMA: kein Ausstieg", ab(R3.signal(baue(b1x), HAUPT), 200), ['SPY', 'SPY']);
  var b2 = [150, 99].concat(reihe(198, 100)).concat([101, 100]);
  gleich('B2 Einstieg genau bei C = 1,01 x SMA', ab(R3.signal(baue(b2), HAUPT), 200), ['BIL', 'SPY']);
  var b2x = [150, 99].concat(reihe(198, 100)).concat([100.999999, 100]);
  gleich("B2' knapp unter 1,01 x SMA: kein Einstieg", ab(R3.signal(baue(b2x), HAUPT), 200), ['BIL', 'BIL']);
  var w1 = R3.details(baue(b1), HAUPT), w2 = R3.details(baue(b2), HAUPT);
  gleich('B1/B2 Verhaeltnis genau 0,99 bzw. 1,01', [w1[0].verhaeltnis, w2[0].verhaeltnis], [0.99, 1.01]);
});

/* ---- Fall H: Ablauf mit Hysterese in beiden Zustaenden, Ausfuehrung am Folgetag, N3 ohne Gedaechtnis ----
 * c[0..199]=100, c[200]=100,9, c[201]=102, c[202]=99,5, c[203]=99,1, c[204]=98,9, c[205]=100,5, c[206]=100. (Bis Tag 205 faellt
 * nur ein 100er aus dem Fenster, daher Summe = (Zahl der 100er) x 100 + neue Kurse.)
 *   d    Fenster  Summe                       SMA        0,99xSMA    1,01xSMA     C      Haupt (Band)         N3 (C > SMA)
 *  199   0..199   200x100 = 20000             100        99          101          100    Anfang: nicht > -> draussen  draussen
 *  200   1..200   199x100+100,9 = 20000,9     100,0045   99,004455   101,004545   100,9  < 1,01xSMA: bleibt draussen  drin
 *  201   2..201   198x100+202,9 = 20002,9     100,0145   99,014355   101,014645   102    >= 1,01xSMA: EINSTIEG         drin
 *  202   3..202   197x100+302,4 = 20002,4     100,012    99,01188    101,01212    99,5   > 0,99xSMA: bleibt drin      draussen
 *  203   4..203   196x100+401,5 = 20001,5     100,0075   99,007425   101,007575   99,1   > 0,99xSMA: bleibt drin      draussen
 *  204   5..204   195x100+500,4 = 20000,4     100,002    99,00198    101,00202    98,9   <= 0,99xSMA: AUSSTIEG        draussen
 *  205   6..205   194x100+600,9 = 20000,9     100,0045   99,004455   101,004545   100,5  < 1,01xSMA: bleibt draussen  drin
 *  206   7..206   193x100+700,9 = 20000,9     100,0045   99,004455   101,004545   100    < 1,01xSMA: bleibt draussen  draussen
 * ziel[d+1] = Zustand nach d (Tag 206 ist der letzte Tag: sein Zustand hat kein ziel[207], steht aber in details mit ausfuehrung null):
 *   Haupt ziel[200..206] = BIL, BIL, SPY, SPY, SPY, BIL, BIL   (Wechsel: Signaltag 201 -> Ausfuehrung 202; Signaltag 204 -> 205)
 *   N3    ziel[200..206] = BIL, SPY, SPY, BIL, BIL, BIL, SPY   (Wechsel: Signaltage 200, 202, 205, 206 - der letzte ohne Ausfuehrung)
 * Hysterese draussen: Tage 200 und 205 (SMA < C < 1,01xSMA) aendern nichts; drin: Tage 202 und 203 (0,99xSMA < C < SMA). */
var H = reihe(200, 100).concat([100.9, 102, 99.5, 99.1, 98.9, 100.5, 100]);
var H_HAUPT = ['BIL', 'BIL', 'SPY', 'SPY', 'SPY', 'BIL', 'BIL'];
var H_N3 = ['BIL', 'SPY', 'SPY', 'BIL', 'BIL', 'BIL', 'SPY'];
abschnitt('H', function () {
  var D = baue(H);
  var z = R3.signal(D, HAUPT);
  gleich('H Haupt ziel[200..206]', ab(z, 200), H_HAUPT);
  pruefe('H Haupt ziel[0..199] null', z.slice(0, 200).every(function (x) { return x === null; }));
  gleich('H N3 ziel[200..206]', ab(R3.signal(D, N3), 200), H_N3);
  var w = R3.details(D, HAUPT);
  gleich('H Haupt Wechsel (Signaltag, Ausfuehrung, von, neu)', w.map(function (x) { return [x.i, x.tag === D.tage[x.i], x.ausfuehrung, x.von, x.neu]; }),
    [[201, true, D.tage[202], 'BIL', 'SPY'], [204, true, D.tage[205], 'SPY', 'BIL']]);
  nahe('H Verhaeltnis Einstieg 102/100,0145', w[0].verhaeltnis, 102 / 100.0145, 1e-12);
  nahe('H Verhaeltnis Ausstieg 98,9/100,002', w[1].verhaeltnis, 98.9 / 100.002, 1e-12);
  gleich('H N3 Wechsel (Signaltag, neu, Ausfuehrung)', R3.details(D, N3).map(function (x) { return [x.i, x.neu, x.ausfuehrung]; }),
    [[200, 'SPY', D.tage[201]], [202, 'BIL', D.tage[203]], [205, 'SPY', D.tage[206]], [206, 'BIL', null]]);
  /* opt.geld = 'SHY' wirkt: BIL -> SHY, SPY bleibt, null bleibt. */
  var shy = H_HAUPT.map(function (x) { return x === 'BIL' ? 'SHY' : x; });
  gleich('H opt.geld SHY (Haupt)', ab(R3.signal(D, SHY), 200), shy);
  gleich('H opt.geld SHY (N3)', ab(R3.signal(D, N3SHY), 200), H_N3.map(function (x) { return x === 'BIL' ? 'SHY' : x; }));
  pruefe('H opt.geld SHY: kein BIL mehr', R3.signal(D, SHY).indexOf('BIL') < 0);
  /* Ausfuehrung erst am Folgetag, durchgespielt im Buch von kern.js (Kunstdaten): Start 200, Erstkauf BIL, Wechsel zur
   * Eroeffnung von 202 (BIL -> SPY) und 205 (SPY -> BIL). */
  var l = K.simuliere(D, z, 200, 206, {});
  gleich('H Buch: Erstkauf am Tag 200 in BIL', [l.erstkauf.tag, l.erstkauf.reihe], [D.tage[200], 'BIL']);
  gleich('H Buch: Wechsel zur Eroeffnung von 202 und 205', l.wechsel.map(function (x) { return [x.tag, x.von, x.nach]; }),
    [[D.tage[202], 'BIL', 'SPY'], [D.tage[205], 'SPY', 'BIL']]);
  /* Kein Blick voraus: Kurse NACH d beliebig aendern -> ziel[0..d+1] bleibt. */
  for (var d = 199; d <= 205; d++) {
    var g = H.map(function (c, k) { return k > d ? (k % 2 ? c * 1.7 : c * 0.4) : c; });
    var zg = R3.signal(baue(g), HAUPT), ng = R3.signal(baue(g), N3);
    gleich('H kein Blick voraus, Kurse nach Tag ' + d + ' geaendert (Haupt)', zg.slice(0, d + 2), z.slice(0, d + 2));
    gleich('H kein Blick voraus, Kurse nach Tag ' + d + ' geaendert (N3)', ng.slice(0, d + 2), R3.signal(D, N3).slice(0, d + 2));
  }
  /* Eingabe bleibt unveraendert, Optionen werden nicht veraendert. */
  var opt = { geld: 'BIL' };
  R3.signal(D, opt);
  gleich('H opt bleibt unveraendert', opt, { geld: 'BIL' });
});

/* ---- Fall V: Ausschuettungen beeinflussen das Signal NICHT (Kurs, nicht Gesamtertrag) ----
 * Reihe H mit Ausschuettungen 5 am Tag 150, 3 am Tag 202, 2 am Tag 204. Das Signal muss gleich bleiben.
 * Empfindlichkeitsprobe: dieselbe Regel auf dem Gesamtertragsindex tr waere anders - Tag 199: tr = 1,05 (ab Tag 150, (100+5)/100),
 * Mittel = (150 x 1 + 50 x 1,05)/200 = 1,0125, also tr > SMA -> investiert statt draussen. */
abschnitt('V', function () {
  var Dv = baue(H, [{ i: 150, betrag: 5 }, { i: 202, betrag: 3 }, { i: 204, betrag: 2 }]);
  gleich('V Ausschuettungen gebucht (d[150], d[202], d[204])', [Dv.reihen.SPY.d[150], Dv.reihen.SPY.d[202], Dv.reihen.SPY.d[204]], [5, 3, 2]);
  gleich('V Haupt unveraendert mit Ausschuettungen', ab(R3.signal(Dv, HAUPT), 200), H_HAUPT);
  gleich('V N3 unveraendert mit Ausschuettungen', ab(R3.signal(Dv, N3), 200), H_N3);
  var tr = Dv.reihen.SPY.tr;
  nahe('V Empfindlichkeit: tr[199] = 1,05', tr[199], 1.05, 1e-12);
  var m = 0;
  for (var k = 0; k < 200; k++) m += tr[k];
  m /= 200;
  nahe('V Empfindlichkeit: Mittel tr[0..199] = 1,0125', m, 1.0125, 1e-12);
  pruefe('V Empfindlichkeit: auf tr waere der Anfang investiert (Test wuerde tr-Fehler sehen)', tr[199] > m && R3.signal(Dv, HAUPT)[200] === 'BIL');
});

/* ---- Fall E: Fehlbedienung ---- */
abschnitt('E', function () {
  var D = baue(reihe(201, 100));
  var geworfen = false;
  try { R3.signal(D, {}); } catch (e) { geworfen = true; }
  pruefe('E ohne opt.geld wird geworfen', geworfen);
  gleich('E Kopf der Regel', [R3.name, R3.titel, R3.art, typeof R3.signal, typeof R3.details], ['R3', '200 Tage (Siegel, 1-%-Band)', 'taeglich', 'function', 'function']);
});

/* ================= Teil 2: echte Daten ================= */
var ORDNER = path.join(__dirname, 'daten');
var DATEI = path.join(ORDNER, 'SPY.json');
var echt = null;
if (!fs.existsSync(DATEI)) console.log('  (Rohdaten daten/SPY.json fehlen: Teil 2 uebersprungen - erst laden.js laufen lassen)');
else {
  echt = abschnitt('echte Daten', function () {
    var D = K.ladeDaten(ORDNER);
    /* Zweiter Weg: eigene Reihe direkt aus laden.lies (Tag <= ENDE, Schlusskurs > 0), eigene SMA (Summe von d abwaerts nach d-199),
     * eigener Zustandsautomat, Ergebnis nach DATUM (nicht nach Index). */
    var roh = L.lies(fs.readFileSync(DATEI, 'utf8'));
    var zeilen = roh.zeilen.filter(function (z) { return z.tag <= L.ENDE && typeof z.c === 'number' && z.c > 0; });
    var steigend = true;
    for (var q = 1; q < zeilen.length; q++) if (!(zeilen[q].tag > zeilen[q - 1].tag)) steigend = false;
    pruefe('zweiter Weg: Tage streng steigend', steigend);
    gleich('zweiter Weg: gleicher Kalender wie kern.js', [zeilen.length, zeilen[0].tag, zeilen[zeilen.length - 1].tag],
      [D.n, D.tage[0], D.tage[D.n - 1]]);
    var kalGleich = zeilen.every(function (z, k) { return z.tag === D.tage[k]; });
    pruefe('zweiter Weg: Kalender Tag fuer Tag gleich', kalGleich);
    /* Der zweite Weg ruft regel-R3.js nicht auf. */
    function zweiterWeg(geld, ohneBand) {
      var nachDatum = {};
      var drin = null, verh = [];
      for (var d = 199; d < zeilen.length; d++) {
        var s = 0;
        for (var k = d; k >= d - 199; k--) s += zeilen[k].c;
        var m = s / 200, c = zeilen[d].c;
        if (ohneBand || drin === null) drin = c > m;
        else if (drin && c <= 0.99 * m) drin = false;
        else if (!drin && c >= 1.01 * m) drin = true;
        verh.push({ tag: zeilen[d].tag, v: c / m, m: m });
        if (d + 1 < zeilen.length) nachDatum[zeilen[d + 1].tag] = drin ? 'SPY' : geld;
      }
      return { nachDatum: nachDatum, verh: verh };
    }
    var wege = [['Haupt', HAUPT, 'BIL', false], ['Ersatz', K.ERSATZ, 'SHY', false], ['N3', N3, 'BIL', true], ['N3 Ersatz', N3SHY, 'SHY', true]];
    var zweitHaupt = null;
    wege.forEach(function (w) {
      var z1 = R3.signal(D, w[1]);
      var z2 = zweiterWeg(w[2], w[3]);
      if (w[0] === 'Haupt') zweitHaupt = z2;
      var abw = [], tage = 0;
      for (var i = 0; i < D.n; i++) {
        var soll = i < 200 ? null : z2.nachDatum[D.tage[i]];
        if (soll === undefined) soll = 'FEHLT';
        if (z1[i] !== soll) abw.push(D.tage[i] + ': ' + z1[i] + ' / ' + soll);
        if (i >= 200) tage++;
      }
      pruefe('echt ' + w[0] + ': beide Wege an jedem Tag gleich (' + tage + ' Tage mit Ziel, ' + D.tage[200] + ' .. ' + D.tage[D.n - 1] + ')',
        abw.length === 0, abw.slice(0, 5).join('; '));
      pruefe('echt ' + w[0] + ': Laenge D.n und nur erlaubte Werte', z1.length === D.n && z1.every(function (x, i) {
        return i < 200 ? x === null : (x === 'SPY' || x === w[2]);
      }));
    });
    /* SMA beider Wege: groesste relative Abweichung (nur Summationsrichtung verschieden). */
    var c = D.reihen.SPY.c, maxRel = 0;
    zweitHaupt.verh.forEach(function (x, k) {
      var d = k + 199, s = 0;
      for (var j = d - 199; j <= d; j++) s += c[j];
      var rel = Math.abs(s / 200 - x.m) / x.m;
      if (rel > maxRel) maxRel = rel;
    });
    pruefe('echt: SMA beider Summationsrichtungen relativ < 1e-12', maxRel < 1e-12, 'max ' + maxRel);
    /* Gleitkomma-Grenzfaelle: |C/SMA - 0,99| < 1e-9 oder |C/SMA - 1,01| < 1e-9; dazu der knappste Abstand zu jedem Band. */
    var grenz = [], naechstAus = { a: Infinity }, naechstEin = { a: Infinity };
    zweitHaupt.verh.forEach(function (x) {
      var aA = Math.abs(x.v - 0.99), aE = Math.abs(x.v - 1.01);
      if (aA < 1e-9 || aE < 1e-9) grenz.push(x.tag);
      if (aA < naechstAus.a) naechstAus = { a: aA, tag: x.tag };
      if (aE < naechstEin.a) naechstEin = { a: aE, tag: x.tag };
    });
    console.log('echt: ' + zweitHaupt.verh.length + ' Tage mit SMA200 (' + D.tage[199] + ' .. ' + D.tage[D.n - 1] + '), Grenzfaelle (1e-9): ' +
      grenz.length + (grenz.length ? ' ' + grenz.join(', ') : '') + '; knappster Abstand zu 0,99: ' + naechstAus.a.toExponential(2) + ' am ' +
      naechstAus.tag + ', zu 1,01: ' + naechstEin.a.toExponential(2) + ' am ' + naechstEin.tag + '; SMA-Abweichung max ' + maxRel.toExponential(2));
    /* details passt zum Ziel-Feld: jeder Wechsel am Signaltag i steht als ziel[i+1] !== ziel[i], und es gibt keine weiteren. */
    var zH = R3.signal(D, HAUPT), wH = R3.details(D, HAUPT);
    var ausZiel = [];
    for (var i = 201; i < D.n; i++) if (zH[i] !== zH[i - 1]) ausZiel.push(D.tage[i - 1] + '>' + zH[i]);
    var letzterTagWechsel = wH.length && wH[wH.length - 1].i === D.n - 1 ? 1 : 0;
    gleich('echt: details = Wechsel im Ziel-Feld', wH.slice(0, wH.length - letzterTagWechsel).map(function (w) { return w.tag + '>' + w.neu; }), ausZiel);
    /* Kein Blick voraus auf echten Daten: (a) abgeschnitten bei Tag k -> ziel[0..k] gleich; (b) Kurse nach k verfaelscht -> gleich. */
    var spyRoh = { SPY: roh };
    var schnitte = [], abwS = [], abwV = [], wirkt = 0;
    for (var kk = 150; kk < D.n - 1; kk += 97) schnitte.push(kk);
    ['2007-11-09', '2008-09-15', '2020-02-27', '2020-03-06', '2022-01-25', '2026-03-20'].forEach(function (t) { schnitte.push(D.idx[t]); });
    schnitte.forEach(function (k) {
      var Dk = K.baueDaten(spyRoh, D.tage[k]);
      [HAUPT, N3].forEach(function (o) {
        var zk = R3.signal(Dk, o), zf = R3.signal(D, o);
        if (JSON.stringify(zk) !== JSON.stringify(zf.slice(0, k + 1))) abwS.push(D.tage[k]);
      });
      /* Verfaelschung abwechselnd x3 / x0,25 nach Zeilennummer (nicht nach Zeitstempel: die Stempel sind fast alle gerade, das
       * waere eine gleichmaessige Skalierung, die das Signal nach 200 Tagen wieder unberuehrt laesst). */
      var verf = { SPY: { zeilen: roh.zeilen.map(function (z, q) {
        return z.tag > D.tage[k] && z.c > 0 ? { tag: z.tag, o: z.o, c: z.c * (q % 2 ? 3 : 0.25) } : z;
      }), div: roh.div } };
      var Dv = K.baueDaten(verf, L.ENDE);
      [HAUPT, N3].forEach(function (o) {
        var zv = R3.signal(Dv, o), zf = R3.signal(D, o);
        if (JSON.stringify(zv.slice(0, k + 2)) !== JSON.stringify(zf.slice(0, k + 2))) abwV.push(D.tage[k]);
        if (o === HAUPT && JSON.stringify(zv.slice(k + 2)) !== JSON.stringify(zf.slice(k + 2))) wirkt++;
      });
    });
    pruefe('echt: Verfaelschung wirkt nach dem Schnitt (Probe ist empfindlich)', wirkt === schnitte.length, wirkt + ' von ' + schnitte.length);
    pruefe('echt: kein Blick voraus, abgeschnitten an ' + schnitte.length + ' Tagen (Haupt, N3)', abwS.length === 0, abwS.join(', '));
    pruefe('echt: kein Blick voraus, Kurse nach ' + schnitte.length + ' Tagen verfaelscht -> ziel[0..d+1] gleich', abwV.length === 0, abwV.join(', '));
    return { D: D, grenz: grenz };
  });
}

/* ================= Teil 3: signale-R3.json gegen Neuberechnung ================= */
var JSONDATEI = path.join(__dirname, 'signale-R3.json');
if (!echt) console.log('  (signale-R3.json: ohne Rohdaten nicht pruefbar, uebersprungen)');
else if (!fs.existsSync(JSONDATEI)) pruefe('signale-R3.json vorhanden (node studien/trendfilter-messung-2026-10/regel-R3.js)', false);
else {
  abschnitt('signale-R3.json', function () {
    var D = echt.D;
    var j = JSON.parse(fs.readFileSync(JSONDATEI, 'utf8'));
    var wH = R3.details(D, HAUPT).filter(function (w) { return w.tag >= '2003-01-01'; });
    var wN = R3.details(D, N3).filter(function (w) { return w.tag >= '2016-01-01'; });
    gleich('JSON Haupt-Wechsel ab 2003 (Signaltag, Ausfuehrung, neu)', j.haupt.liste.map(function (w) { return [w.signaltag, w.ausfuehrung, w.neu]; }),
      wH.map(function (w) { return [w.tag, w.ausfuehrung, w.neu]; }));
    gleich('JSON N3-Wechsel ab 2016', j.n3.liste.map(function (w) { return [w.signaltag, w.ausfuehrung, w.neu]; }),
      wN.map(function (w) { return [w.tag, w.ausfuehrung, w.neu]; }));
    var maxV = 0;
    j.haupt.liste.forEach(function (w, k) { maxV = Math.max(maxV, Math.abs(w.verhaeltnis - wH[k].verhaeltnis)); });
    pruefe('JSON Verhaeltnisse auf 6 Stellen', maxV <= 5e-7, 'max ' + maxV);
    ['A', 'B'].forEach(function (fn) {
      var f = K.FENSTER[fn];
      var s = K.starttage(D, f)[0], e = K.endIndex(D, f.ende);
      gleich('Fenster ' + fn + ': Start/Ende', [D.tage[s], D.tage[e]], [j.fenster[fn].start, j.fenster[fn].ende]);
      [['haupt', HAUPT], ['n3', N3]].forEach(function (v) {
        var z = R3.signal(D, v[1]);
        var n = 0;
        for (var i = s + 1; i <= e; i++) if (z[i] !== z[i - 1]) n++;
        /* Gegenzaehlung aus details: Signaltage i mit s <= i <= e-1 (Ausfuehrung i+1 in (s, e]). */
        var nd = R3.details(D, v[1]).filter(function (w) { return w.i >= s && w.i <= e - 1; }).length;
        gleich('Fenster ' + fn + ' ' + v[0] + ': Wechsel aus Ziel-Feld = aus details = JSON', [n, nd], [j.fenster[fn][v[0]].wechsel, j.fenster[fn][v[0]].wechsel]);
      });
    });
    gleich('JSON Grenzfaelle', j.grenzfaelle1e9, echt.grenz.length);
    var text = fs.readFileSync(JSONDATEI, 'utf8');
    pruefe('JSON enthaelt keine Kursfelder (c, o, close, kurs, endwert, ertrag)', !/"(c|o|close|open|kurs|kurse|endwert|ertrag|wert)"\s*:/.test(text));
  });
}

console.log(gruen + ' grün, ' + rot + ' rot');
process.exitCode = rot ? 1 : 0;
