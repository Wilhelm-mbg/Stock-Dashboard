'use strict';
/* Mutationstest der Geld-Buecher (Momentum-Buch), 04.10.2026 - die neuen Kleinsttests.
 * Zweig pruefung/mutation-buecher, Bericht: pruefberichte/2026-10-mutation-buecher.md.
 * Jeder Block nennt im Kommentar die Mutanten-Kennungen (A-, B-, C-, D-nn), die er toetet; die Mutantenlisten
 * liegen in pruefberichte/mutation-buecher/*-mutanten.json, das Harness daneben (harness.js).
 * Gelaufen gegen 61dca2c: alle gruen. Reines Node, kein Netz, keine Schluessel. Nicht in `npm test` eingehaengt.
 * Aufruf aus der Repo-Wurzel:  node pruefberichte/mutation-buecher.test.js
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var WURZEL = process.env.PRUEF_WURZEL ? require('path').resolve(process.env.PRUEF_WURZEL) : require('path').join(__dirname, '..');

/* ================= Teil A ================= */
(function () {
  /* Mutationstest Gruppe A: mfhandel.js momentumZiel/rebalanceFaellig, liquide.js, momentum.js.
   * Reines Node, feste Uhr, keine Daten. Alles Simulation, keine Anlageberatung. */
  var MH = require(WURZEL + '/mfhandel.js');
  var Li = require(WURZEL + '/liquide.js');
  var Mo = require(WURZEL + '/momentum.js');
  var TAG = 86400000;
  function pruefe(name, ok, detail) {
    if (ok) console.log('OK ' + name);
    else { console.log('ROT ' + name + (detail !== undefined ? ': ' + detail : '')); process.exitCode = 1; }
  }
  var NOW = Date.UTC(2026, 10, 24, 20, 0);   // feste Uhr: Di 24.11.2026 20:00 UTC

  /* n Balken [t, close, stueck], Zeitabstand 1 Tag, letzter Balken bei lastT.
   * close_i = 100 * (1 + s * i / 1000): bei steigendem s steigt die Staerke. stueck: Zahl, null = Zeile nur [t, kurs]. */
  function reihe(n, lastT, s, stueck) {
    var r = [];
    for (var i = 0; i < n; i++) {
      var t = lastT - (n - 1 - i) * TAG, k = 100 * (1 + s * i / 1000);
      r.push(stueck == null ? [t, k] : [t, k, stueck]);
    }
    return r;
  }
  function grundVon(erg, sym) { var g = null; erg.verworfen.forEach(function (v) { if (v.sym === sym) g = v.grund; }); return g; }
  var O = { nowMs: NOW, minWerte: 1 };   // minWerte 1: ein einzelner Wert genuegt, damit der Filter sichtbar wird
  var GROSS = 2000000;                   // 100 $ x 2 Mio Stueck = 200 Mio $ Tagesumsatz >= 100 Mio

  // ---- A-10: Mindestlaenge 253 (252 Balken duerfen NICHT abstuerzen, sondern werden verworfen) ----
  // 252 Balken: i = 251, i - luecke - rueck = -1 -> ohne Laengenpruefung TypeError.
  (function () {
    var m = {}; m.X = reihe(252, NOW, 1, GROSS);
    var erg = null, fehler = null;
    try { erg = MH.momentumZiel(m, O); } catch (e) { fehler = e.message; }
    pruefe('A-10 252 Balken: kein Absturz, verworfen mit Grund "252 von 253"', erg && !fehler && (grundVon(erg, 'X') || '').indexOf('zu kurze Kursreihe (252 von 253 Tagen)') === 0, fehler || (erg && grundVon(erg, 'X')));
    var m2 = { X: reihe(253, NOW, 1, GROSS) };
    var e2 = MH.momentumZiel(m2, O);
    pruefe('A-10 253 Balken: rankt mit', e2.rangfolge.length === 1 && e2.ziel[0] === 'X', JSON.stringify(e2.uebersprungen));
  })();

  // ---- A-12, A-13, A-14: Altersgrenze 7 Tage, scharf (Alter > 7 Tage fliegt, genau 7 Tage bleibt) ----
  (function () {
    var genau = MH.momentumZiel({ X: reihe(253, NOW - 7 * TAG, 1, GROSS) }, O);
    pruefe('A-13/A-14 Alter genau 7 Tage: bleibt im Rang', genau.rangfolge.length === 1, JSON.stringify(genau.verworfen));
    var drueber = MH.momentumZiel({ X: reihe(253, NOW - 7 * TAG - 3600000, 1, GROSS) }, O);
    pruefe('A-12 Alter 7 Tage + 1 Stunde: veraltet', drueber.rangfolge.length === 0 && /^Kurse veraltet/.test(grundVon(drueber, 'X') || ''), JSON.stringify(drueber.verworfen));
    var frisch = MH.momentumZiel({ X: reihe(253, NOW - 6 * TAG - 12 * 3600000, 1, GROSS) }, O);
    pruefe('A-13 Alter 6,5 Tage: bleibt', frisch.rangfolge.length === 1, JSON.stringify(frisch.verworfen));
  })();

  // ---- A-20: Zielzahl mindestens 5 (20 Werte: round(20 * 0,1) = 2 -> 5) und die staerksten 5 ----
  (function () {
    var m = {};
    for (var k = 0; k < 20; k++) m['S' + (k < 10 ? '0' : '') + k] = reihe(253, NOW, k + 1, GROSS);   // Staerke steigt mit k
    var erg = MH.momentumZiel(m, { nowMs: NOW, minWerte: 3 });
    pruefe('A-20 Zielzahl max(5, round(2)) = 5, die staerksten fuenf', erg.ziel.join(',') === 'S19,S18,S17,S16,S15', erg.ziel.join(','));
  })();

  // ---- A-25: Korbzaehler ohneUmsatz (Zeile nur [t, kurs]) und unterSchwelle (Umsatz 100 $) getrennt ----
  (function () {
    var m = { A: reihe(253, NOW, 1, null), A2: reihe(253, NOW, 4, null), B: reihe(253, NOW, 2, 1), C: reihe(253, NOW, 3, GROSS) };
    var erg = MH.momentumZiel(m, O);
    var k = erg.korb;
    pruefe('A-25 Korbzaehler: 4 geprueft, 2 ohneUmsatz, 1 unterSchwelle, 1 zulaessig', k.geprueft === 4 && k.ohneUmsatz === 2 && k.unterSchwelle === 1 && k.zulaessig === 1, JSON.stringify(k));
    pruefe('A-25 Grund ohne Stueckzahlen vs. unter Schwelle', /keine Stückzahlen/.test(grundVon(erg, 'A') || '') && /unter 100 Mio/.test(grundVon(erg, 'B') || ''), grundVon(erg, 'A') + ' | ' + grundVon(erg, 'B'));
  })();

  // ---- A-29: letzter Kurs 0 (Kurslücke) -> Stärke nicht berechenbar, nicht im Rang ----
  // Median-Umsatz bleibt gross (ein Balken mit Umsatz 0 aendert den Median ueber 20 Balken nicht).
  (function () {
    var x = reihe(253, NOW, 1, GROSS); x[252][1] = 0;
    var m = { X: x, Y: reihe(253, NOW, 2, GROSS) };
    var erg = MH.momentumZiel(m, O);
    pruefe('A-29 Schlusskurs 0 am Stichtag: verworfen', grundVon(erg, 'X') === 'Stärke nicht berechenbar (Kurslücke)' && erg.rangfolge.length === 1 && erg.rangfolge[0].sym === 'Y', JSON.stringify(erg.verworfen) + ' ' + JSON.stringify(erg.rangfolge.map(function (p) { return p.sym; })));
  })();

  // ---- rebalanceFaellig: Balken an New-Yorker Tagen NACH dem Tag der letzten Umschichtung ----
  // Balken liegen taeglich um 15:00 UTC (10:00/11:00 New York, derselbe Tag), ab 2026-01-05.
  function markt(ersterTag, n) {   // n Balken ab Kalendertag ersterTag (UTC-Datum = NY-Datum um 15:00)
    var r = [];
    for (var k = 0; k < n; k++) r.push([Date.UTC(2026, 0, ersterTag + k, 15, 0), 100 + k]);
    return r;
  }
  (function () {
    // letzte Umschichtung am 05.01.2026 (Tag 5). Balken am 05.01. selbst zaehlt nicht; die danach (6.,7.,...) zaehlen.
    var tag0 = '2026-01-05';
    var r62 = markt(5, 63);    // Balken 5.1. + 62 spaeter  -> 62 gezaehlte
    var r63 = markt(5, 64);    // Balken 5.1. + 63 spaeter  -> 63 gezaehlte
    pruefe('A-31/A-35/A-39 62 Balken nach dem Tag (ohne den Umschichtungstag): noch nicht faellig', MH.rebalanceFaellig(r62, tag0) === false);
    pruefe('A-32/A-34/A-36/A-39 63 Balken nach dem Tag: faellig', MH.rebalanceFaellig(r63, tag0) === true);
    pruefe('A-31 der Balken des Umschichtungstags zaehlt nicht mit (4 nach + 1 am Tag, halten 5)', MH.rebalanceFaellig(markt(5, 5), tag0, 5) === false);
    pruefe('A-32/A-34 halten 5: 5 Balken danach = faellig', MH.rebalanceFaellig(markt(5, 6), tag0, 5) === true);
    pruefe('A-34 halten 5: 4 Balken danach = noch nicht', MH.rebalanceFaellig(markt(5, 5).slice(0), tag0, 5) === false);
    pruefe('A-37 ohne letzte Umschichtung: faellig', MH.rebalanceFaellig(r62, null) === true);
    // Zeitstempel: 06.01.2026 02:00 UTC = 05.01.2026 21:00 New York -> Tag 05.01.
    var t = Date.UTC(2026, 0, 6, 2, 0);
    var r = markt(6, 63);       // 63 Balken ab 06.01. (6. Jan 15:00 UTC liegt NACH dem NY-Tag 05.01.)
    pruefe('A-38 Zeitstempel zaehlt als New-Yorker Tag (05.01.), nicht als UTC-Tag (06.01.): 63 Balken -> faellig', MH.rebalanceFaellig(r, t) === true);
    pruefe('A-38 gleiche Reihe mit 62 Balken -> nicht faellig', MH.rebalanceFaellig(markt(6, 62), t) === false);
  })();

  // ---- A-46: medianUmsatz mit Index == Laenge liefert NaN statt abzustuerzen ----
  (function () {
    var b = reihe(25, NOW, 1, GROSS), v = null, fehler = null;
    try { v = Li.medianUmsatz(b, b.length, 20); } catch (e) { fehler = e.message; }
    pruefe('A-46 medianUmsatz(i = Laenge) = NaN ohne Absturz', !fehler && v !== null && isNaN(v), fehler || String(v));
  })();

  // ---- A-52, A-53: Schwelle 0 schaltet den Korbfilter ab (auch ohne Stueckzahlen, auch bei kleinem Umsatz) ----
  (function () {
    var ohne = reihe(30, NOW, 1, null), klein = reihe(30, NOW, 1, 1);
    pruefe('A-52 umsatzMin 0, Reihe ohne Stueckzahlen: zulaessig', Li.zulaessig(ohne, 29, { umsatzMin: 0 }).ok === true);
    pruefe('A-53 umsatzMin 0, Umsatz 100 $: zulaessig (0 wird nicht durch 100 Mio ersetzt)', Li.zulaessig(klein, 29, { umsatzMin: 0 }).ok === true);
    var erg = MH.momentumZiel({ X: reihe(253, NOW, 1, 1) }, { nowMs: NOW, minWerte: 1, umsatzMin: 0 });
    pruefe('A-53 momentumZiel mit umsatzMin 0 rankt auch Umsatz 100 $', erg.rangfolge.length === 1 && erg.korb.umsatzMin === 0, JSON.stringify(erg.korb));
  })();

  // ---- A-54, A-55: hatUmsatz ----
  (function () {
    var nan = reihe(30, NOW, 1, NaN), inf = reihe(30, NOW, 1, Infinity);
    pruefe('A-54 Stueckzahl NaN/Infinity zaehlt nicht als vorhanden', Li.hatUmsatz(nan, 29, 20) === false && Li.hatUmsatz(inf, 29, 20) === false);
    var b = reihe(30, NOW, 1, null); b[29] = [b[29][0], b[29][1], 5];
    pruefe('A-55 nur der Stichtagsbalken traegt Stueckzahl: hatUmsatz true', Li.hatUmsatz(b, 29, 20) === true);
  })();

  // ---- A-60: STANDARD.minWerte 25 in momentum.js (Rangfolge der Studienwerkzeuge) ----
  (function () {
    function viele(n) { var m = {}; for (var k = 0; k < n; k++) { var a = []; for (var i = 0; i < 300; i++) a.push(100 + k + i * 0.1); m['W' + k] = a; } return m; }
    pruefe('A-60 STANDARD.minWerte = 25: 24 Werte -> keine Rangfolge, 25 -> Rangfolge', Mo.rangfolge(viele(24), 299) === null && Mo.rangfolge(viele(25), 299) !== null && Mo.STANDARD.minWerte === 25);
  })();
})();

/* ================= Teil B ================= */
(function () {
  'use strict';
  /* Kleinsttests Gruppe B: Momentum-Buch, mfhandel.js (planeUmschichtung, fuehreAus, bewerte,
   * faelligkeit/rebalanceFaellig, New-Yorker Uhr, offene Auftraege/nachfassen). Feste Uhr, von Hand
   * gerechnete Sollwerte. Je Test steht die Kennung der Mutanten (B-nn), die er toetet. */
  var MH = require(WURZEL + '/mfhandel.js');
  function pruefe(name, ok, detail) {
    if (ok) console.log('OK ' + name);
    else { console.log('ROT ' + name + ': ' + (detail === undefined ? '' : detail)); process.exitCode = 1; }
  }
  function nah(a, b, eps) { return Math.abs(a - b) < (eps || 1e-9); }
  function J(x) { return JSON.stringify(x); }
  function kopie(x) { return JSON.parse(JSON.stringify(x)); }
  var NYW = function (j, m, t, h, min) { return Date.UTC(j, m - 1, t, h + 5, min || 0); };   // Winterzeit UTC-5

  /* ---------- planeUmschichtung ---------- */
  /* cash 1000; A 10 x 50 = 500; B 1 x 100; C 2 x 10 = 20; F 3 Stueck OHNE Kurs; Ziel [A, D, E], E ohne Kurs.
   * Depotwert = 1000 + 500 + 100 + 20 = 1620 (F zaehlt nicht), Platzwert = 1620 / 3 = 540.
   * D kostet 7: 540 / 7 = 77,142857... -> auf vier Stellen gerundet 77,1429 (abgerundet waere 77,1428,
   * auf drei Stellen 77,143). Verkauf B und C; halten [F, A]? Reihenfolge der Positionen: A, B, C, F
   * -> halten = [A, F]; fehltKurs = [F, E] (Positionen zuerst, dann die Ziele).
   * Toetet B-02 (Platzwert), B-03 (ohne Bargeld), B-04 (F nicht in halten), B-08/B-09 (Rundung),
   * B-11 (E nicht in fehltKurs), B-14 (depotwert), B-15 (nie verkaufen), B-16 (Einstand als Kurs). */
  var buch1 = { cash: 1000, positionen: [
    { sym: 'A', stueck: 10, einstand: 40 }, { sym: 'B', stueck: 1, einstand: 90 },
    { sym: 'C', stueck: 2, einstand: 12 }, { sym: 'F', stueck: 3, einstand: 5 }] };
  var pr1 = { A: 50, B: 100, C: 10, D: 7 };
  var p1 = MH.planeUmschichtung(['A', 'D', 'E'], buch1, pr1);
  pruefe('B plan: Depotwert und Platzwert', p1.depotwert === 1620 && p1.kaufen.length === 1 && p1.kaufen[0].budget === 540, J(p1));
  pruefe('B plan: Neukauf-Stueck auf vier Stellen gerundet', p1.kaufen[0].sym === 'D' && p1.kaufen[0].stueck === 77.1429, J(p1.kaufen));
  pruefe('B plan: Verkaeufe B und C mit Bestand und Kurs', J(p1.verkaufen) === J([{ sym: 'B', stueck: 1, kurs: 100 }, { sym: 'C', stueck: 2, kurs: 10 }]), J(p1.verkaufen));
  pruefe('B plan: halten (A, F ohne Kurs) und fehltKurs (F, E)', J(p1.halten) === J(['A', 'F']) && J(p1.fehltKurs) === J(['F', 'E']), J(p1.halten) + ' ' + J(p1.fehltKurs));
  pruefe('B plan: ohne opts kein kleinst-Feld', p1.kleinst === undefined, J(p1.kleinst));

  /* Regel K (opts.kleinstAnteil). cash 1000, A 10 x 50 = 500, H 1 x 30, G 1 x 1; Ziel [A, H, G, Z], Z Kurs 20.
   * Depotwert 1531, Platzwert 382,75; Schwelle 0,05 x 382,75 = 19,1375. G (1) liegt darunter -> kleinst,
   * wird verkauft und neu geplant; H (30) liegt darueber -> halten. (Schwelle gegen den Depotwert
   * waere 76,55 und machte H zum Kleinstbestand.) Ohne opts gilt G als gehalten.
   * Toetet B-05, B-06, B-07, B-12, B-13. */
  var buch2 = { cash: 1000, positionen: [{ sym: 'A', stueck: 10, einstand: 50 }, { sym: 'H', stueck: 1, einstand: 30 }, { sym: 'G', stueck: 1, einstand: 1 }] };
  var pr2 = { A: 50, H: 30, G: 1, Z: 20 };
  var p2 = MH.planeUmschichtung(['A', 'H', 'G', 'Z'], buch2, pr2, { kleinstAnteil: 0.05 });
  pruefe('B plan K2: G Kleinstbestand, H nicht', J(p2.kleinst) === J(['G']) && J(p2.halten) === J(['A', 'H']) && J(p2.verkaufen.map(function (v) { return v.sym; })) === J(['G']), J(p2));
  pruefe('B plan K2: G wird neu geplant, Z neu gekauft', J(p2.kaufen.map(function (k) { return k.sym; })) === J(['G', 'Z']), J(p2.kaufen));
  var p2o = MH.planeUmschichtung(['A', 'H', 'G', 'Z'], buch2, pr2);
  pruefe('B plan ohne opts: Regel K aus', J(p2o.halten) === J(['A', 'H', 'G']) && p2o.verkaufen.length === 0 && J(p2o.kaufen.map(function (k) { return k.sym; })) === J(['Z']) && p2o.kleinst === undefined, J(p2o));
  /* Gleichstand: cash 500, A 10 x 50, H 1 x 200, Ziel [A, H, Z]; Depotwert 1200, Platzwert 400,
   * kleinstAnteil 0,5 -> Schwelle 200 = Wert von H -> NICHT kleinst (strikt kleiner). Toetet B-01. */
  var p3 = MH.planeUmschichtung(['A', 'H', 'Z'], { cash: 500, positionen: [{ sym: 'A', stueck: 10, einstand: 50 }, { sym: 'H', stueck: 1, einstand: 200 }] }, { A: 50, H: 200, Z: 10 }, { kleinstAnteil: 0.5 });
  pruefe('B plan K2: Wert gleich Schwelle ist kein Kleinstbestand', J(p3.kleinst) === J([]) && J(p3.halten) === J(['A', 'H']), J(p3));

  /* ---------- fuehreAus ---------- */
  /* Verkauf A 10 x 50, Einstand 40,1234, 10 Bp: Erloes 500 x 0,999 = 499,5; pnl = 499,5 - 401,234 = 98,266 -> 98,27.
   * Toetet B-19 (Kosten addiert), B-20/B-21 (Rundung), B-22 (ohne Verkaufskosten), B-39 (Position bleibt), B-37 (Zaehler). */
  var b4 = { cash: 1000, positionen: [{ sym: 'A', stueck: 10, einstand: 40.1234, seit: 1 }] };
  var n4 = MH.fuehreAus(b4, { verkaufen: [{ sym: 'A', stueck: 10, kurs: 50 }], kaufen: [] }, 777, 10);
  pruefe('B fuehreAus: Verkauf Bargeld, pnl gerundet, Position weg, Zaehler',
    n4 === 1 && nah(b4.cash, 1499.5) && b4.trades[0].pnl === 98.27 && b4.positionen.length === 0 && b4.trades[0].t === 777 && b4.trades[0].art === 'verkauf', J(b4) + ' n=' + n4);
  /* Vorgabe-Kosten (kostenBp fehlt): 20 Bp -> 499,0. Mit 10 Bp 499,5 (nicht 1 %: 495). Toetet B-17 (10 statt 20), B-18 (Teiler 1000). */
  var b5 = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 40 }] };
  MH.fuehreAus(b5, { verkaufen: [{ sym: 'A', stueck: 10, kurs: 50 }], kaufen: [] }, 1);
  pruefe('B fuehreAus: ohne Kostenangabe 20 Bp', nah(b5.cash, 499), String(b5.cash));
  /* Kauf 10 x 20 bei 10 Bp: Kosten 200,2, Einstand 20,02, seit = Zeitstempel; Rueckgabe 2 mit dem Verkauf davor.
   * Reihenfolge: Bargeld 0, erst der Verkauf von A (10 x 50 -> 499,5) macht den Kauf von 10 x 49 (490,49) moeglich;
   * Kaeufe zuerst waeren auf 0 verkleinert. Toetet B-31 (Bargeld), B-37/B-36 (Zaehler), B-40 (Reihenfolge). */
  var b6 = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 40 }] };
  var n6 = MH.fuehreAus(b6, { verkaufen: [{ sym: 'A', stueck: 10, kurs: 50 }], kaufen: [{ sym: 'D', kurs: 49, budget: 490, stueck: 10 }] }, 555, 10);
  pruefe('B fuehreAus: Verkaeufe vor Kaeufen, Zaehler 2', n6 === 2 && b6.positionen.length === 1 && b6.positionen[0].sym === 'D' && b6.positionen[0].stueck === 10 && nah(b6.cash, 499.5 - 490.49) && b6.trades[0].art === 'verkauf' && b6.trades[1].art === 'kauf', J(b6) + ' n=' + n6);
  var b7 = { cash: 1000, positionen: [] };
  var n7 = MH.fuehreAus(b7, { verkaufen: [], kaufen: [{ sym: 'D', kurs: 20, budget: 200, stueck: 10 }] }, 555, 10);
  pruefe('B fuehreAus: Kauf mit Kosten, Einstand, seit', n7 === 1 && nah(b7.cash, 1000 - 200.2) && nah(b7.positionen[0].einstand, 20.02) && b7.positionen[0].seit === 555, J(b7));
  /* Verkleinerung: Bargeld 100, Kurs 17, gewollt 5,9 (Kosten 100,4 > 100) -> floor(100 / 17,017 x 10000) / 10000 = 5,8764
   * (round 5,8765; ohne Kostenfaktor 5,8823); Bargeld bleibt >= 0. Toetet B-24 (Spielraum +1), B-25 (round), B-26 (ohne Kostenfaktor). */
  var b8 = { cash: 100, positionen: [] };
  MH.fuehreAus(b8, { verkaufen: [], kaufen: [{ sym: 'D', kurs: 17, budget: 100, stueck: 5.9 }] }, 1, 10);
  pruefe('B fuehreAus: Verkleinerung auf 5,8764, Bargeld nicht negativ', b8.positionen.length === 1 && b8.positionen[0].stueck === 5.8764 && b8.cash >= 0 && b8.cash < 0.05, J(b8));
  /* Bargeld 0: Kauf wird nicht gebucht (keine Position mit 0 Stueck, kein Trade, Rueckgabe 0). Toetet B-27 (< 0 statt !(> 0)). */
  var b9 = { cash: 0, positionen: [] };
  var n9 = MH.fuehreAus(b9, { verkaufen: [], kaufen: [{ sym: 'D', kurs: 30, budget: 100, stueck: 3 }] }, 1, 10);
  pruefe('B fuehreAus: ohne Bargeld keine Position', n9 === 0 && b9.positionen.length === 0 && b9.trades.length === 0, J(b9));
  /* Regel K1 (kleinstAnteil 0,5, budget 200 -> Schwelle 100, 10 Bp): Wert 100 = Schwelle -> ausgefuehrt (nicht <=);
   * 9,995 x 10 = 99,95 < 100 -> NICHT ausgefuehrt (mit Kosten 100,05 waere es durchgegangen). Toetet B-28 (<=), B-30 (inkl. Kosten). */
  var b10 = { cash: 1000, positionen: [] };
  MH.fuehreAus(b10, { verkaufen: [], kaufen: [{ sym: 'D', kurs: 10, budget: 200, stueck: 10 }, { sym: 'E', kurs: 10, budget: 200, stueck: 9.995 }] }, 1, 10, { kleinstAnteil: 0.5 });
  pruefe('B fuehreAus K1: Gleichstand gekauft, darunter nicht (auch nicht mit Kosten)', b10.positionen.length === 1 && b10.positionen[0].sym === 'D' && nah(b10.cash, 1000 - 100.1), J(b10));
  /* Tradeprotokoll: 400 Eintraege + 1 Verkauf -> 400, der aelteste faellt heraus. Toetet B-34 (399), B-35 (> 401). */
  var tr = []; for (var i = 0; i < 400; i++) tr.push({ t: i, sym: 'X' + i });
  var b11 = { cash: 0, trades: tr, positionen: [{ sym: 'A', stueck: 1, einstand: 1 }] };
  MH.fuehreAus(b11, { verkaufen: [{ sym: 'A', stueck: 1, kurs: 2 }], kaufen: [] }, 9, 0);
  pruefe('B fuehreAus: Tradeprotokoll auf 400 gekappt', b11.trades.length === 400 && b11.trades[0].sym === 'X1' && b11.trades[399].art === 'verkauf', b11.trades.length + ' ' + b11.trades[0].sym);

  /* Kauf, dessen Kosten das Bargeld GENAU aufbrauchen (kosten == cash): 1,4875 x 700,03 bei 20 Bp, Bargeld = Kosten.
   * Gekauft werden muessen die vollen 1,4875 Stueck, Bargeld danach 0 (mit >= wuerde auf 1,4874 verkleinert und
   * 0,07 im Bargeld liegen gelassen). Gegenprobe mit Zufallseingaben: 40233 von 200000 Faellen wichen ab. Toetet B-23. */
  var st23 = 1.4875, kurs23 = 700.03, cash23 = st23 * kurs23 * (1 + 20 / 10000);
  var b23 = { cash: cash23, positionen: [] };
  MH.fuehreAus(b23, { verkaufen: [], kaufen: [{ sym: 'D', kurs: kurs23, budget: cash23, stueck: st23 }] }, 1, 20);
  pruefe('B fuehreAus: Kosten gleich Bargeld -> volle Stueckzahl', b23.positionen.length === 1 && b23.positionen[0].stueck === 1.4875 && b23.cash === 0, J(b23));

  /* ---------- bewerte ---------- */
  /* 100 + 3 x 10,123 (30,369) + 2 x 7,5 ohne Kurs (15) = 145,369 -> 145,37. Toetet B-41, B-42, B-43, B-44, B-45. */
  var bw = MH.bewerte({ cash: 100, positionen: [{ sym: 'A', stueck: 3, einstand: 1 }, { sym: 'B', stueck: 2, einstand: 7.5 }] }, { A: 10.123 });
  pruefe('B bewerte: Rundung, Einstand ohne Kurs, ohneKurs', bw.wert === 145.37 && J(bw.ohneKurs) === J(['B']), J(bw));

  /* ---------- Faelligkeit ---------- */
  function werktage(von, n) {            // n Werktage ab (inkl.) von, Stempel 13:30 UTC
    var a = [], t = Date.parse(von + 'T13:30:00Z');
    while (a.length < n) { var w = new Date(t).getUTCDay(); if (w !== 0 && w !== 6) a.push([t, 100, 1e6]); t += 86400000; }
    return a;
  }
  /* Ausfuehrungstag Mo 2027-01-04; danach k Balken, dazu der Balken von heute (laufend). Jetzt = Werktag nach dem k-ten, 12:00 New York. */
  function fall(k, halten) {
    var reihe = werktage('2027-01-04', k + 1);                       // Ausfuehrungstag + k Balken
    var heute = MH.tagPlus(MH.nyTag(reihe[reihe.length - 1][0]), 1); while (!MH.istWerktag(heute)) heute = MH.tagPlus(heute, 1);
    var jetzt = MH.nyZeit(heute, 12, 0);
    var mitHeute = reihe.concat([[Date.parse(heute + 'T13:30:00Z'), 100, 1]]);   // laufender Balken von heute
    return { r: MH.faelligkeit(mitHeute, '2027-01-04', halten, jetzt), reihe: mitHeute, jetzt: jetzt, heute: heute };
  }
  var f62 = fall(62, 63), f61 = fall(61, 63), f63 = fall(63, 63);
  /* 62 Balken zwischen Ausfuehrungstag und heute: faellig (>= 62), noch 0, keine Verspaetung. Toetet B-46, B-47, B-48, B-49, B-56 (laufender Balken von heute zaehlt nicht), B-57. */
  pruefe('B faelligkeit: 62 Balken -> faellig, noch 0, Verspaetung 0', f62.r.faellig === true && f62.r.tageSeit === 62 && f62.r.noch === 0 && f62.r.verspaetung === 0, J(f62.r));
  pruefe('B faelligkeit: 61 Balken -> noch nicht faellig, noch 1', f61.r.faellig === false && f61.r.tageSeit === 61 && f61.r.noch === 1, J(f61.r));
  pruefe('B faelligkeit: 63 Balken -> Verspaetung 1', f63.r.faellig === true && f63.r.verspaetung === 1 && f63.r.noch === 0, J(f63.r));
  /* ohne halten gilt 63: bei 61 Balken nicht, bei 62 faellig. Toetet B-52. */
  pruefe('B faelligkeit: Vorgabe halten 63', fall(61, undefined).r.faellig === false && fall(62, undefined).r.faellig === true, J(fall(61, undefined).r));
  /* Erste Umschichtung ist faellig. Toetet B-53. */
  var fe = MH.faelligkeit(f62.reihe, null, 63, f62.jetzt);
  pruefe('B faelligkeit: ohne letzten Ausfuehrungstag faellig, erste', fe.faellig === true && fe.erste === true, J(fe));
  /* Rueckstand: letzter Balken Mo 04.01.; Do 07.01. 12:00 -> juengster fertiger Werktag Mi... (Di, Mi, Do = 3 Werktage? Do ist noch nicht fertig) */
  var rv = werktage('2026-12-01', 25);                              // bis Mo 2027-01-04
  var r3 = MH.faelligkeit(rv, '2026-12-01', 63, NYW(2027, 1, 7, 17));   // Do 17:00 NY: fertig = Do -> Di, Mi, Do = 3
  var r4 = MH.faelligkeit(rv, '2026-12-01', 63, NYW(2027, 1, 8, 17));   // Fr 17:00 NY: 4 Werktage
  var r2 = MH.faelligkeit(rv, '2026-12-01', 63, NYW(2027, 1, 7, 12));   // Do 12:00 NY: fertig = Mi -> Di, Mi = 2
  pruefe('B faelligkeit: Rueckstand 3 noch nicht veraltet, 4 veraltet', r3.rueckstand === 3 && r3.veraltet === false && r4.rueckstand === 4 && r4.veraltet === true && r4.faellig === null && r2.rueckstand === 2, J([r2.rueckstand, r3.rueckstand, r3.veraltet, r4.rueckstand, r4.veraltet]));
  /* heute ist der New-Yorker Tag: 2027-01-05 23:00 NY = 2027-01-06 04:00 UTC. Toetet B-54, B-63. */
  pruefe('B faelligkeit: heute in New York, nicht UTC', MH.faelligkeit(rv, null, 63, Date.UTC(2027, 0, 6, 4, 0)).heute === '2027-01-05' && MH.nyTag(Date.UTC(2027, 0, 6, 4, 0)) === '2027-01-05', '');
  /* balkenNach: nie negativ, Balken genau um Mitternacht NY zaehlt als nach dem Tag. Toetet B-58, B-77. */
  pruefe('B balkenNach: nie negativ', MH.balkenNach(rv, '2027-01-04', '2026-12-10') === 0, String(MH.balkenNach(rv, '2027-01-04', '2026-12-10')));
  var mn = [[MH.nyZeit('2027-01-04', 12, 0), 1, 1], [MH.nyZeit('2027-01-05', 0, 0), 1, 1]];
  pruefe('B balkenNach: Balken um 00:00 des Folgetags zaehlt', MH.balkenNach(mn, '2027-01-04') === 1, String(MH.balkenNach(mn, '2027-01-04')));

  /* ---------- rebalanceFaellig ---------- */
  /* Umschichtung 04.01.; danach k Balken (nur Balken nach dem Tag zaehlen; der Balken des Tages nicht). Toetet B-59, B-60, B-61, B-62. */
  function rb(k, halten, letztes) { var r = werktage('2027-01-04', k + 1); return MH.rebalanceFaellig(r, letztes === undefined ? '2027-01-04' : letztes, halten); }
  pruefe('B rebalanceFaellig: 63 Balken faellig (>=), 62 nicht, Vorgabe 63', rb(63, 63) === true && rb(62, 63) === false && rb(62, undefined) === false && rb(63, undefined) === true, [rb(63, 63), rb(62, 63), rb(62), rb(63)].join());
  pruefe('B rebalanceFaellig: ohne letztes immer faellig', MH.rebalanceFaellig(werktage('2027-01-04', 3), null, 63) === true && MH.rebalanceFaellig([], 0, 63) === true, '');

  /* ---------- New-Yorker Uhr ---------- */
  /* Toetet B-63 (UTC). */
  pruefe('B Uhr: nyTag/nyUhr in New York', MH.nyTag(Date.UTC(2027, 0, 5, 3, 0)) === '2027-01-04' && MH.nyUhr(Date.UTC(2027, 0, 5, 5, 0)) === '00:00' && MH.nyUhr(Date.UTC(2027, 6, 5, 13, 30)) === '09:30', MH.nyUhr(Date.UTC(2027, 0, 5, 5, 0)));
  /* nyZeit mit Sommer-/Winterzeit; Umstellung 14.03.2027 (EST bis 02:00). Kein Mutant (B-68/B-69 aequivalent), Absicherung. */
  pruefe('B Uhr: nyZeit Winter, Sommer, Umstellungstag', MH.nyZeit('2027-01-05', 9, 30) === Date.UTC(2027, 0, 5, 14, 30) && MH.nyZeit('2026-07-06', 9, 30) === Date.UTC(2026, 6, 6, 13, 30) && MH.nyZeit('2027-03-14', 12, 0) === Date.UTC(2027, 2, 14, 16, 0) && MH.nyZeit('2027-03-14', 1, 30) === Date.UTC(2027, 2, 14, 6, 30) && MH.nyZeit('2026-11-01', 12, 0) === Date.UTC(2026, 10, 1, 17, 0), '');
  /* Konstanten: Schluss fertig 16:15, Handel ab 09:35 (mfdepot.js liest HANDEL_AB), Nachfassen bis 16:00. Toetet B-65, B-66, B-67, B-81 (16:30). */
  pruefe('B Uhr: Zeitkonstanten', J(MH.SCHLUSS_FERTIG) === '[16,15]' && J(MH.HANDEL_AB) === '[9,35]' && J(MH.NACHFASSEN_BIS) === '[16,0]', J([MH.SCHLUSS_FERTIG, MH.HANDEL_AB, MH.NACHFASSEN_BIS]));
  /* Werktage: Sa/So keine Werktage. Toetet B-70, B-71. */
  pruefe('B Uhr: istWerktag', MH.istWerktag('2027-01-01') === true && MH.istWerktag('2027-01-02') === false && MH.istWerktag('2027-01-03') === false && MH.istWerktag('2027-01-04') === true, '');
  pruefe('B Uhr: werktagVor', MH.werktagVor('2027-01-06') === '2027-01-05' && MH.werktagVor('2027-01-04') === '2027-01-01' && MH.werktagVor('2027-01-03') === '2027-01-01', MH.werktagVor('2027-01-06'));
  /* letzterFertigerWerktag: Mi 16:14 -> Di; 16:15 -> Mi; Sa -> Fr. Toetet B-65 (16:00), B-72 (>), B-55. */
  pruefe('B Uhr: letzterFertigerWerktag Schluss 16:15', MH.letzterFertigerWerktag(NYW(2027, 1, 6, 16, 14)) === '2027-01-05' && MH.letzterFertigerWerktag(NYW(2027, 1, 6, 16, 15)) === '2027-01-06' && MH.letzterFertigerWerktag(NYW(2027, 1, 6, 16, 5)) === '2027-01-05' && MH.letzterFertigerWerktag(NYW(2027, 1, 2, 18, 0)) === '2027-01-01' && MH.letzterFertigerWerktag(NYW(2027, 1, 3, 18, 0)) === '2027-01-01', '');
  /* bestandFrisch: genau 16:15 des fertigen Werktags ist frisch (>=), eine Millisekunde davor nicht. Toetet B-73. */
  var jetzt = NYW(2027, 1, 6, 10, 0), schl = NYW(2027, 1, 5, 16, 15);
  pruefe('B Uhr: bestandFrisch Grenze', MH.bestandFrisch(schl, jetzt) === true && MH.bestandFrisch(schl - 1, jetzt) === false && MH.bestandFrisch(0, jetzt) === false, '');
  /* ohneLaufendenBalken: Mi 12:00 NY schneidet Balken von Mi (auch um 00:00 und 09:00) ab; ab 16:15 nicht. Toetet B-75, B-76, B-78. */
  var tag0 = NYW(2027, 1, 5, 12, 0), mi0 = NYW(2027, 1, 6, 0, 0), mi9 = NYW(2027, 1, 6, 9, 0), mi930 = NYW(2027, 1, 6, 9, 30);
  var rr = [[tag0, 1, 1], [mi0, 2, 1], [mi9, 3, 1], [mi930, 4, 1]];
  pruefe('B Uhr: ohneLaufendenBalken schneidet den Tag ab', J(MH.ohneLaufendenBalken(rr, NYW(2027, 1, 6, 12, 0)).map(function (b) { return b[0]; })) === J([tag0]) && MH.ohneLaufendenBalken(rr, NYW(2027, 1, 6, 16, 15)) === rr && MH.ohneLaufendenBalken(rr, NYW(2027, 1, 6, 16, 14)).length === 1, '');
  pruefe('B Uhr: ohneLaufendenBalken genau ab 16:15 unveraendert', MH.ohneLaufendenBalken(rr, NYW(2027, 1, 6, 16, 15)) === rr, '');

  /* ---------- offene Auftraege ---------- */
  var of1 = { tag: '2027-01-05', verkaeufe: [], kaeufe: [] };
  /* Toetet B-80 (<=), B-81 (16:30), B-82 (Tagespruefung). */
  pruefe('B offenLaeuft: bis 16:00 New York am Tag des Auftrags', MH.offenLaeuft(of1, NYW(2027, 1, 5, 15, 59)) === true && MH.offenLaeuft(of1, NYW(2027, 1, 5, 16, 0)) === false && MH.offenLaeuft(of1, NYW(2027, 1, 5, 16, 10)) === false && MH.offenLaeuft(of1, NYW(2027, 1, 4, 10, 0)) === false && MH.offenLaeuft(of1, NYW(2027, 1, 6, 10, 0)) === false && MH.offenLaeuft(null, NYW(2027, 1, 5, 10, 0)) === false, '');
  /* Ziel [A,B,C,D], Depotwert 1000 -> Budget 250. A gehalten ohne Kurs und Ziel: kein Auftrag. F gehalten ohne Kurs, kein Ziel: Verkauf.
   * B, C Ziele ohne Kurs, nicht gehalten: Kaeufe nach Rang (B = 2, C = 3), obwohl fehltKurs [C, F, A, B] unsortiert ist. Toetet B-83 (Verkauf nur bei Ziel), B-84 (Budget), B-85 (Reihenfolge), B-86 (Rang ab 0). */
  var oa = MH.offeneAuftraege(['A', 'B', 'C', 'D'], { depotwert: 1000, halten: ['A', 'F'], fehltKurs: ['C', 'F', 'A', 'B'] }, '2027-01-05');
  pruefe('B offeneAuftraege: Verkauf, Kaeufe nach Rang, Budget', J(oa) === J({ tag: '2027-01-05', verkaeufe: ['F'], kaeufe: [{ sym: 'B', budget: 250, rang: 2 }, { sym: 'C', budget: 250, rang: 3 }] }), J(oa));
  pruefe('B offeneAuftraege: nichts offen -> null', MH.offeneAuftraege(['A'], { depotwert: 10, halten: ['A'], fehltKurs: ['A'] }, 't') === null, '');
  /* Toetet B-87 (unsortiert), B-88 (Rang umgekehrt). */
  pruefe('B offenWerte: Verkaeufe, dann Kaeufe nach Rang', J(MH.offenWerte({ verkaeufe: ['X'], kaeufe: [{ sym: 'C', rang: 3 }, { sym: 'B', rang: 2 }] })) === J(['X', 'B', 'C']) && J(MH.offenWerte(null)) === '[]', '');

  /* nachfassen: Buch X 10, V 1, Y 1; Bargeld 1000; offen: Verkaeufe X, W (nicht im Buch), V (ohne Kurs);
   * Kaeufe K1 (Rang 2, 100, Kurs 6), K2 (Rang 1, 100, Kurs 10), Y (schon im Buch), K3 (ohne Kurs).
   * Verkauf X 10 x 20 bei 10 Bp = 199,8 -> Bargeld 1199,8. K2 zuerst: 10 Stueck (100,1); K1: floor(100/6 x 10000)/10000 = 16,6666
   * (round 16,6667). Ergebnis: verkauft [X], gekauft [K2, K1], entfallen [W, Y], Rest V und K3, kursT gestempelt.
   * Toetet B-89 (floor), B-91/B-92 (entfallen), B-94 (geaendert), B-96 (Stempel), B-90 (kostenBp 20), B-101 (erster Verkauf), B-85/B-87/B-88 (Rang). */
  var bn = { cash: 1000, positionen: [{ sym: 'X', stueck: 10, einstand: 5 }, { sym: 'V', stueck: 1, einstand: 5 }, { sym: 'Y', stueck: 1, einstand: 5 }],
    offen: { tag: '2027-01-05', verkaeufe: ['X', 'W', 'V'], kaeufe: [{ sym: 'K1', budget: 100, rang: 2 }, { sym: 'K2', budget: 100, rang: 1 }, { sym: 'Y', budget: 100, rang: 3 }, { sym: 'K3', budget: 100, rang: 4 }] } };
  var now = NYW(2027, 1, 5, 10, 0);
  var rn = MH.nachfassen(bn, { X: 20, K1: 6, K2: 10 }, { K1: 111, K2: 222 }, now, 10);
  var k1 = bn.positionen.filter(function (p) { return p.sym === 'K1'; })[0], k2 = bn.positionen.filter(function (p) { return p.sym === 'K2'; })[0];
  pruefe('B nachfassen: verkauft, gekauft nach Rang, entfallen', J(rn.verkauft) === J([{ sym: 'X', kurs: 20 }]) && J(rn.gekauft) === J([{ sym: 'K2', kurs: 10, stueck: 10 }, { sym: 'K1', kurs: 6, stueck: 16.6666 }]) && J(rn.entfallen) === J(['W', 'Y']) && rn.geaendert === true, J(rn));
  pruefe('B nachfassen: Bargeld und Rest', nah(bn.cash, 1000 + 199.8 - 100.1 - 16.6666 * 6 * 1.001) && J(rn.rest) === J({ tag: '2027-01-05', verkaeufe: ['V'], kaeufe: [{ sym: 'K3', budget: 100, rang: 4 }] }) && J(bn.offen) === J(rn.rest), J(bn.cash) + ' ' + J(rn.rest));
  pruefe('B nachfassen: Kurs-Stempel der neuen Positionen', k1 && k2 && k1.kursT === 111 && k2.kursT === 222 && k1.seit === now, J(bn.positionen));
  /* Vorgabekosten 20 Bp im Ergebnis. Toetet B-90. */
  var rk = MH.nachfassen({ cash: 0, positionen: [{ sym: 'X', stueck: 1, einstand: 1 }], offen: { tag: 't', verkaeufe: ['X'], kaeufe: [] } }, { X: 100 }, {}, now);
  pruefe('B nachfassen: ohne kostenBp 20', rk.kostenBp === 20, J(rk));
  /* Nur ein entfallener Verkauf: geaendert, offen weg. Toetet B-93, B-94. */
  var be = { cash: 0, positionen: [], offen: { tag: 't', verkaeufe: ['W'], kaeufe: [] } };
  var re = MH.nachfassen(be, {}, {}, now, 10);
  pruefe('B nachfassen: nur entfallen -> geaendert, offen geloescht', re.geaendert === true && re.rest === null && !('offen' in be) && J(re.entfallen) === J(['W']), J(re) + J(be));
  /* Regel K durchgereicht: Bargeld 10, Kurs 1000, Budget 100: Verkleinerung 0,0099 (Wert 9,9) < 0,5 x 100 -> nicht gekauft, bleibt offen. Toetet B-95. */
  var bk = { cash: 10, positionen: [], offen: { tag: 't', verkaeufe: [], kaeufe: [{ sym: 'S', budget: 100, rang: 1 }] } };
  var rkk = MH.nachfassen(bk, { S: 1000 }, {}, now, 10, { kleinstAnteil: 0.5 });
  pruefe('B nachfassen: Regel K1 wird durchgereicht', bk.positionen.length === 0 && bk.cash === 10 && J(rkk.wartet) === J(['S']) && rkk.gekauft.length === 0 && J(bk.offen.kaeufe.map(function (k) { return k.sym; })) === J(['S']), J(rkk) + J(bk));
  /* offenBeenden: laeuft -> null und offen bleibt; nach 16:00 -> geloescht und zurueckgegeben. Toetet B-99, B-100. */
  var bb = { offen: { tag: '2027-01-05', verkaeufe: ['X'], kaeufe: [] } };
  var e1 = MH.offenBeenden(bb, NYW(2027, 1, 5, 12, 0));
  var e2 = MH.offenBeenden(bb, NYW(2027, 1, 5, 16, 0));
  pruefe('B offenBeenden: laeuft weiter / nach 16:00 geloescht', e1 === null && e2 && e2.verkaeufe[0] === 'X' && !('offen' in bb) && MH.offenBeenden(bb, now) === null, '');
  /* stempleKursT ueberschreibt kein vorhandenes kursT. Toetet B-102. */
  var bs = { positionen: [{ sym: 'A', seit: 5, kursT: 77 }, { sym: 'B', seit: 5 }] };
  var ns = MH.stempleKursT(bs, { A: 9, B: 8 }, 5);
  pruefe('B stempleKursT: vorhandenes kursT bleibt', ns === 1 && bs.positionen[0].kursT === 77 && bs.positionen[1].kursT === 8, J(bs));
})();

/* ================= Teil C ================= */
/* Teil C des Mutationstests (04.10.2026): Kapitalmassnahmen, Zeit-Hilfen, Reihenende, Stichtag.
 * Alles gegen mfhandel.js, feste Uhr (Winter: Dienstag 24.11.2026; Sommer: Mittwoch 15.07.2026),
 * keine Date.now(). Jeder Test nennt die Mutanten-Kennungen aus C-mutanten.json, die er toetet.
 * Simulation mit virtuellem Kapital, keine Anlageberatung. */
(function () {
  var MH = require(WURZEL + '/mfhandel.js');
  var TAG = 86400000;
  function pruefe(name, ok, detail) {
    if (ok) console.log('OK ' + name);
    else { console.log('ROT ' + name + ': ' + (detail === undefined ? '' : detail)); process.exitCode = 1; }
  }
  function gl(a, b) { return Math.abs(a - b) < 1e-9; }
  function js(x) { return JSON.stringify(x); }
  var ny = MH.nyZeit;

  /* ---- Kapitalmassnahmen: Ex-Tag-Grenze, Merker ---- */
  (function () {
    var T0 = ny('2026-11-10', 9, 30), T1 = ny('2026-11-12', 9, 30);
    function buch() { return { cash: 1000, positionen: [{ sym: 'A', stueck: 10, einstand: 100, seit: T0, kursT: T0, richtung: 1 }] }; }
    // Ereignis genau am Kaufbalken (T0): nicht gebucht (t > Beginn). Ereignis genau am letzten Balken (T1): gebucht (t <= bis).
    // Rechnung: 10 Stueck x 0,5 $ = 5 $ -> Bargeld 1005; nur ein Posten.
    var b = buch(), ev = { A: { div: [[T0, 0.7], [T1, 0.5]], split: [] } };
    var r = MH.bucheMassnahmen(b, ev, { A: T1 }, T1 + 1000);
    pruefe('C Ex-Tag: Kaufbalken nicht, letzter Balken ja (C-01 C-02)', r.buchungen.length === 1 && r.buchungen[0].t === T1 && gl(b.cash, 1005), js(r.buchungen) + ' cash ' + b.cash);
    // Zweiter Aufruf mit denselben Daten bucht nichts (Merker; C-07 C-20)
    var r2 = MH.bucheMassnahmen(b, ev, { A: T1 }, T1 + 2000);
    pruefe('C Ausschuettung nur einmal (C-07 C-20)', r2.buchungen.length === 0 && gl(b.cash, 1005), js(r2.buchungen) + ' cash ' + b.cash);
    // Split: 2:1 am letzten Balken; zweiter Aufruf bucht nicht noch einmal
    var b3 = buch(), ev3 = { A: { div: [], split: [[T1, 2, 1]] } };
    MH.bucheMassnahmen(b3, ev3, { A: T1 }, T1 + 1000);
    var r3 = MH.bucheMassnahmen(b3, ev3, { A: T1 }, T1 + 2000);
    pruefe('C Split nur einmal (C-08 C-20)', b3.positionen[0].stueck === 20 && r3.buchungen.length === 0 && r3.gesperrt.length === 0, js(b3.positionen[0]) + js(r3));
  })();

  /* ---- Split-Faktor z/n und Einstand n/z ---- */
  (function () {
    var T0 = ny('2026-11-10', 9, 30), T1 = ny('2026-11-12', 9, 30);
    function lauf(z, n) {
      var b = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 100, seit: T0, kursT: T0 }] };
      MH.bucheMassnahmen(b, { A: { split: [[T1, z, n]] } }, { A: T1 }, T1);
      return b.positionen[0];
    }
    // 3:1 -> 30 Stueck, Einstand 100/3; 1:4 (Zusammenlegung) -> 2,5 Stueck, Einstand 400
    var p = lauf(3, 1), q = lauf(1, 4);
    pruefe('C Split 3:1 (C-03 C-04)', gl(p.stueck, 30) && gl(p.einstand, 100 / 3), js(p));
    pruefe('C Split 1:4 (C-03 C-04)', gl(q.stueck, 2.5) && gl(q.einstand, 400), js(q));
  })();

  /* ---- Vorzeichen der Ausschuettung, Leerverkauf, Stueckzahl nach Split ---- */
  (function () {
    var T0 = ny('2026-11-10', 9, 30), T1 = ny('2026-11-12', 9, 30);
    function lauf(richtung, mitSplit) {
      var p = { sym: 'A', stueck: 10, einstand: 100, seit: T0, kursT: T0 };
      if (richtung !== undefined) p.richtung = richtung;
      var b = { cash: 1000, positionen: [p] };
      MH.bucheMassnahmen(b, { A: { div: [[T1, 0.5]], split: mitSplit ? [[T1 - 1000, 2, 1]] : [] } }, { A: T1 }, T1 + 5);
      return b.cash;
    }
    // Kauf (richtung 1): +10 x 0,5 = 1005; ohne richtung dasselbe; Leerverkauf: -5 = 995
    pruefe('C Ausschuettung Kauf richtung=1 (C-06)', gl(lauf(1, false), 1005), lauf(1, false));
    pruefe('C Ausschuettung ohne richtung', gl(lauf(undefined, false), 1005), lauf(undefined, false));
    pruefe('C Ausschuettung Leerverkauf belastet (C-05 C-06)', gl(lauf(-1, false), 995), lauf(-1, false));
    // Split 2:1 kurz vor dem Ex-Tag der Ausschuettung: 20 Stueck x 0,5 = 10 -> 1010 (Stueckzahl NACH dem Split)
    pruefe('C Ausschuettung mit Stueckzahl nach Split', gl(lauf(1, true), 1010), lauf(1, true));
  })();

  /* ---- Betrag 0 und Nenner 0 werden nicht gebucht ---- */
  (function () {
    var T0 = ny('2026-11-10', 9, 30), T1 = ny('2026-11-12', 9, 30);
    var b = { cash: 1000, positionen: [{ sym: 'A', stueck: 10, einstand: 100, seit: T0, kursT: T0 }] };
    var r = MH.bucheMassnahmen(b, { A: { div: [[T1, 0]], split: [[T1, 2, 0]] } }, { A: T1 }, T1);
    pruefe('C Betrag 0 und Nenner 0 ohne Buchung (C-12 C-13)', r.buchungen.length === 0 && b.positionen[0].stueck === 10 && b.cash === 1000 && !b.massnahmen, js(r) + js(b));
  })();

  /* ---- Beginn: kursT vor seit, Rueckfall auf seit ---- */
  (function () {
    var K = ny('2026-11-10', 16, 0), S = ny('2026-11-11', 9, 35), T1 = ny('2026-11-13', 9, 30);
    // kursT (Schluss des 10.) liegt vor seit (Kauf am 11.): ein Ereignis am 11. um 09:30 gehoert dem Kaeufer
    var b = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 1, seit: S, kursT: K }] };
    var r = MH.bucheMassnahmen(b, { A: { div: [[ny('2026-11-11', 9, 30), 1]] } }, { A: T1 }, T1);
    pruefe('C Beginn = kursT, nicht seit (C-14)', r.buchungen.length === 1 && gl(b.cash, 10), js(r) + b.cash);
    // ohne kursT gilt seit: ein Ereignis VOR seit wird nicht gebucht
    var b2 = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 1, seit: S }] };
    var r2 = MH.bucheMassnahmen(b2, { A: { div: [[ny('2026-11-10', 9, 30), 1], [ny('2026-11-12', 9, 30), 2]] } }, { A: T1 }, T1);
    pruefe('C Beginn ohne kursT = seit (C-15)', r2.buchungen.length === 1 && gl(b2.cash, 20) && r2.buchungen[0].kaufT === S, js(r2) + b2.cash);
  })();

  /* ---- Kappe 400 ---- */
  (function () {
    var T0 = ny('2026-01-05', 9, 30), T1 = T0 + 500 * TAG, d = [];
    for (var i = 1; i <= 401; i++) d.push([T0 + i * TAG, 1]);
    var b = { cash: 0, positionen: [{ sym: 'A', stueck: 1, einstand: 1, seit: T0, kursT: T0 }] };
    MH.bucheMassnahmen(b, { A: { div: d } }, { A: T1 }, T1);
    pruefe('C massnahmen auf 400 gekappt (C-16)', b.massnahmen.length === 400 && b.massnahmen[0].t === T0 + 2 * TAG && b.massnahmen[399].t === T0 + 401 * TAG, b.massnahmen.length + ' ' + (b.massnahmen[0] || {}).t);
  })();

  /* ---- Splitsperre ---- */
  (function () {
    var T0 = ny('2026-01-05', 9, 30), A = T0 + 10 * TAG, bis = T0 + 200 * TAG;
    function pos() { return { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 100, seit: T0, kursT: T0 }] }; }
    // genau 30 Tage Abstand: gesperrt (<=); 31 Tage: gebucht
    var b = pos(), r = MH.bucheMassnahmen(b, { A: { split: [[A, 2, 1], [A + 30 * TAG, 2, 1]] } }, { A: bis }, bis);
    pruefe('C Sperre bei genau 30 Tagen (C-09)', r.buchungen.length === 1 && r.gesperrt.length === 1 && b.positionen[0].stueck === 20, js(r));
    var b2 = pos(), r2 = MH.bucheMassnahmen(b2, { A: { split: [[A, 2, 1], [A + 31 * TAG, 2, 1]] } }, { A: bis }, bis);
    pruefe('C kein Sperre bei 31 Tagen', r2.buchungen.length === 2 && r2.gesperrt.length === 0 && b2.positionen[0].stueck === 40, js(r2));
    // 10 Tage Abstand: gesperrt (C-10)
    var b3 = pos(), r3 = MH.bucheMassnahmen(b3, { A: { split: [[A, 2, 1], [A + 10 * TAG, 2, 1]] } }, { A: bis }, bis);
    pruefe('C Sperre bei 10 Tagen (C-10)', r3.gesperrt.length === 1 && r3.gesperrt[0].t === A + 10 * TAG && b3.positionen[0].stueck === 20, js(r3));
    // unsortiert angeliefert: der fruehere wird gebucht, der spaetere gesperrt
    var b4 = pos(), r4 = MH.bucheMassnahmen(b4, { A: { split: [[A + 10 * TAG, 3, 1], [A, 2, 1]] } }, { A: bis }, bis);
    pruefe('C Splits zeitlich sortiert (C-11)', r4.buchungen.length === 1 && r4.buchungen[0].t === A && r4.gesperrt[0].t === A + 10 * TAG && b4.positionen[0].stueck === 20, js(r4));
    // neu: erster Aufruf true, zweiter false
    var ev = { A: { split: [[A, 2, 1], [A + 10 * TAG, 2, 1]] } };
    var b5 = pos(), s1 = MH.bucheMassnahmen(b5, ev, { A: bis }, bis), s2 = MH.bucheMassnahmen(b5, ev, { A: bis }, bis + 1);
    pruefe('C Sperrmeldung neu nur beim ersten Mal (C-17 C-18)', s1.gesperrt[0].neu === true && s2.gesperrt.length === 1 && s2.gesperrt[0].neu === false, js(s1.gesperrt) + js(s2.gesperrt));
    // Abstand ohne Betrag: ein schon gebuchter SPAETERER Split sperrt keinen 60 Tage frueheren
    var b6 = pos(); b6.positionen[0].gebucht = ['split:' + (A + 60 * TAG)];
    var r6 = MH.bucheMassnahmen(b6, { A: { split: [[A, 2, 1]] } }, { A: bis }, bis);
    pruefe('C Sperre mit Betrag des Abstands (C-19)', r6.buchungen.length === 1 && r6.gesperrt.length === 0, js(r6));
  })();

  /* ---- fehlende Ereignisse / Zeiten ---- */
  (function () {
    var T0 = ny('2026-11-10', 9, 30), T1 = ny('2026-11-12', 9, 30), ok = true, fehler = '';
    var b = { cash: 5, positionen: [{ sym: 'A', stueck: 1, einstand: 1, seit: T0, kursT: T0 }] };
    try { var r = MH.bucheMassnahmen(b, { B: { div: [[T1, 1]] } }, { A: T1 }, T1); ok = r.buchungen.length === 0 && b.cash === 5; } catch (e) { ok = false; fehler = String(e); }
    pruefe('C Wert ohne Ereignisse: nichts, kein Fehler (C-21)', ok, fehler);
  })();

  /* ---- stempleKursT ---- */
  (function () {
    var now = ny('2026-11-24', 9, 40), bar = ny('2026-11-24', 9, 30);
    var b = { positionen: [
      { sym: 'A', seit: now },                       // neu: gestempelt
      { sym: 'B', seit: now - 1000 },                // aelter: nicht
      { sym: 'C', seit: now, kursT: 123 },           // hat schon: bleibt
      { sym: 'D', seit: now }                        // kein Balken: bleibt ohne
    ] };
    var n = MH.stempleKursT(b, { A: bar, B: bar, C: bar }, now);
    var p = b.positionen;
    pruefe('C stempleKursT: nur neue Position, Zaehler (C-22 C-23 C-24 C-25)',
      n === 1 && p[0].kursT === bar && p[1].kursT === undefined && p[2].kursT === 123 && p[3].kursT === undefined, n + js(p));
  })();

  /* ---- Reihen fuer balkenNach / rohBis / schluesseAm ---- */
  function werktage(von, bis) {   // 'JJJJ-MM-TT' einschliesslich, nur Mo-Fr
    var o = [];
    for (var t = von; t <= bis; t = MH.tagPlus(t, 1)) if (MH.istWerktag(t)) o.push(t);
    return o;
  }
  function reihe(von, bis) {
    return werktage(von, bis).map(function (t, i) { return [ny(t, 9, 30), 100 + i, 0, 0, 0, 1000]; });
  }

  /* ---- balkenNach ---- */
  (function () {
    var r = reihe('2026-11-09', '2026-11-20');   // 9. Mo .. 20. Fr = 10 Balken
    // nach dem 9.: 10.,11.,12.,13.,16.,17.,18.,19.,20. = 9 (der Tag selbst zaehlt nicht; C-26 C-29)
    pruefe('C balkenNach ohne bisTag (C-26 C-29)', MH.balkenNach(r, '2026-11-09') === 9, MH.balkenNach(r, '2026-11-09'));
    // nach dem 9. und vor dem 13.: 10.,11.,12. = 3 (bisTag zaehlt nicht; C-28)
    pruefe('C balkenNach mit bisTag (C-28)', MH.balkenNach(r, '2026-11-09', '2026-11-13') === 3, MH.balkenNach(r, '2026-11-09', '2026-11-13'));
    // Tag ohne Balken (Samstag 14.): 16..20 = 5
    pruefe('C balkenNach ab Wochenende', MH.balkenNach(r, '2026-11-14') === 5, MH.balkenNach(r, '2026-11-14'));
    // bisTag vor tag: nie negativ
    pruefe('C balkenNach nie negativ (C-27)', MH.balkenNach(r, '2026-11-18', '2026-11-12') === 0, MH.balkenNach(r, '2026-11-18', '2026-11-12'));
  })();

  /* ---- rohBis ---- */
  (function () {
    var x = reihe('2026-11-09', '2026-11-20'), y = reihe('2026-11-09', '2026-11-12');
    var m = { A: x, B: y, C: [] };
    var o = MH.rohBis(m, '2026-11-12');
    // A: bis einschliesslich 12. = 4 Balken (9.,10.,11.,12.); B unveraendert (selbe Reihe)
    pruefe('C rohBis schneidet bis einschliesslich Tag (C-30 C-31 C-32)',
      o.A.length === 4 && o.A[3][0] === ny('2026-11-12', 9, 30) && o.B === y && o.C === m.C, o.A.length);
  })();

  /* ---- schluesseAm ---- */
  (function () {
    var x = reihe('2026-11-09', '2026-11-13');     // Schluesse 100..104 (9.=100 ... 13.=104)
    var z = reihe('2026-11-09', '2026-11-13'); z[3][1] = 0;   // 12.: Schluss 0
    var s = MH.schluesseAm({ A: x, B: z }, '2026-11-12');
    // A am 12. = 103 mit Stempel des 12.; B: Balken vom 12. hat Schluss 0 -> kein Eintrag (nicht der vom 11.)
    pruefe('C schluesseAm Schluss und Stempel (C-33 C-35 C-36)', s.preise.A === 103 && s.barT.A === ny('2026-11-12', 9, 30), js(s));
    pruefe('C schluesseAm Schluss 0 ausgeschlossen (C-34)', !('B' in s.preise) && !('B' in s.barT), js(s));
    // Samstag 14.: der letzte davor (Freitag 13. = 104)
    var s2 = MH.schluesseAm({ A: x }, '2026-11-14');
    pruefe('C schluesseAm Wochenende = letzter davor', s2.preise.A === 104 && s2.barT.A === ny('2026-11-13', 9, 30), js(s2));
  })();

  /* ---- ohneLaufendenBalken ---- */
  (function () {
    var vor = ny('2026-11-23', 9, 30), heute9 = ny('2026-11-24', 9, 0), lauf = ny('2026-11-24', 9, 30);
    var r = [[vor, 1], [lauf, 2]];
    var s = ny('2026-11-24', 15, 0);
    var o = MH.ohneLaufendenBalken(r, s);
    pruefe('C laufender Balken abgeschnitten (C-41)', o.length === 1 && o[0][0] === vor, js(o));
    // genau 16:15: nichts schneiden, dieselbe Reihe
    pruefe('C 16:15 genau: Reihe unveraendert (C-37)', MH.ohneLaufendenBalken(r, ny('2026-11-24', 16, 15)) === r, '');
    pruefe('C 16:14: geschnitten', MH.ohneLaufendenBalken(r, ny('2026-11-24', 16, 14)).length === 1, '');
    // Balken vor 09:30 heute (09:00) und genau 00:00 heute gehoeren auch zu heute
    var r2 = [[vor, 1], [heute9, 2]];
    pruefe('C Balken 09:00 heute geschnitten (C-39)', MH.ohneLaufendenBalken(r2, s).length === 1, '');
    var r3 = [[vor, 1], [ny('2026-11-24', 0, 0), 2]];
    pruefe('C Balken 00:00 heute geschnitten (C-38)', MH.ohneLaufendenBalken(r3, s).length === 1, '');
    // Balken von gestern bleibt: nichts zu schneiden = dieselbe Reihe
    var r4 = [[vor, 1]];
    pruefe('C Balken von gestern bleibt (C-40)', MH.ohneLaufendenBalken(r4, s) === r4, '');
  })();

  /* ---- indexVor (nicht exportiert; ueber schluesseAm erreicht): C-42 C-43 C-44 ---- */
  (function () {
    var t = ny('2026-11-12', 9, 30), grenze = ny('2026-11-13', 0, 0);
    // eine einzige Zeile: gefunden (Schleife darf bei lo == hi nicht abbrechen)
    var s1 = MH.schluesseAm({ A: [[t, 7]] }, '2026-11-12');
    pruefe('C indexVor Reihe mit einem Balken (C-43 C-44)', s1.preise.A === 7 && s1.barT.A === t, js(s1));
    // ein Balken genau auf der Grenze (00:00 des Folgetags) gehoert nicht mehr zum Tag (strenges <)
    var s2 = MH.schluesseAm({ A: [[t, 7], [grenze, 9]] }, '2026-11-12');
    pruefe('C indexVor streng kleiner als die Grenze (C-42)', s2.preise.A === 7 && s2.barT.A === t, js(s2));
    // drei Balken, Treffer in der Mitte
    var s3 = MH.schluesseAm({ A: [[t - 2 * TAG, 1], [t, 2], [t + 2 * TAG, 3]] }, '2026-11-12');
    pruefe('C indexVor Treffer in der Mitte (C-44)', s3.preise.A === 2, js(s3));
  })();

  /* ---- Zeit-Hilfen ---- */
  (function () {
    // nyTeile / nyTag: Winter, Sommer, Mitternacht, Tagesgrenze UTC <> NY
    var w = MH.nyTag(Date.UTC(2026, 10, 24, 2, 30));     // 24.11. 02:30 UTC = 23.11. 21:30 EST
    pruefe('C nyTag Winter UTC-Nacht (C-75)', w === '2026-11-23', w);
    pruefe('C nyTag Sommer 13:30 UTC', MH.nyTag(Date.UTC(2026, 6, 15, 13, 30)) === '2026-07-15', '');
    pruefe('C nyTag Format Tag/Monat (C-77)', MH.nyTag(Date.UTC(2026, 0, 5, 15, 0)) === '2026-01-05', MH.nyTag(Date.UTC(2026, 0, 5, 15, 0)));
    pruefe('C nyTag 23:59 NY Sommer = Vortag in UTC-Sicht', MH.nyTag(Date.UTC(2026, 6, 16, 3, 59)) === '2026-07-15', MH.nyTag(Date.UTC(2026, 6, 16, 3, 59)));
  })();
  (function () {
    // tagPlus
    pruefe('C tagPlus -1 ueber Monatsgrenze (C-78 C-79)', MH.tagPlus('2026-03-01', -1) === '2026-02-28', MH.tagPlus('2026-03-01', -1));
    pruefe('C tagPlus +1 ueber Jahresgrenze', MH.tagPlus('2026-12-31', 1) === '2027-01-01', '');
    pruefe('C tagPlus +2 ueber Zeitumstellung', MH.tagPlus('2026-03-07', 2) === '2026-03-09', '');
    pruefe('C tagPlus -3', MH.tagPlus('2026-11-24', -3) === '2026-11-21', '');
    // Werktage: 20.11.2026 = Freitag
    pruefe('C istWerktag Fr/Sa/So/Mo (C-80 C-81)', MH.istWerktag('2026-11-20') && !MH.istWerktag('2026-11-21') && !MH.istWerktag('2026-11-22') && MH.istWerktag('2026-11-23'), '');
    pruefe('C werktagVor (C-82)', MH.werktagVor('2026-11-23') === '2026-11-20' && MH.werktagVor('2026-11-21') === '2026-11-20' && MH.werktagVor('2026-11-22') === '2026-11-20' && MH.werktagVor('2026-11-24') === '2026-11-23', '');
  })();
  (function () {
    // nyZeit: Winter 09:30 = 14:30 UTC, Sommer 09:30 = 13:30 UTC, Umstellungstage (08.03. vorwaerts, 01.11. rueckwaerts)
    pruefe('C nyZeit Winter 09:30 (C-83 C-84 C-85)', MH.nyZeit('2026-11-24', 9, 30) === Date.UTC(2026, 10, 24, 14, 30), '');
    pruefe('C nyZeit Sommer 09:30', MH.nyZeit('2026-07-15', 9, 30) === Date.UTC(2026, 6, 15, 13, 30), '');
    pruefe('C nyZeit 16:15 am Tag der Umstellung auf Sommerzeit', MH.nyZeit('2026-03-08', 16, 15) === Date.UTC(2026, 2, 8, 20, 15), '');
    pruefe('C nyZeit 16:15 am Tag der Rueckstellung', MH.nyZeit('2026-11-01', 16, 15) === Date.UTC(2026, 10, 1, 21, 15), '');
    pruefe('C nyZeit 00:00 am Tag der Rueckstellung (noch Sommerzeit)', MH.nyZeit('2026-11-01', 0, 0) === Date.UTC(2026, 10, 1, 4, 0), '');
    pruefe('C nyZeit Rundreise mit nyTeile', (function () { var t = MH.nyZeit('2026-07-15', 0, 0); return MH.nyTag(t) === '2026-07-15' && MH.nyTag(t - 1) === '2026-07-14'; })(), '');
  })();
  (function () {
    // feste Zeiten: Schluss fertig 16:15, Handel ab 09:35
    pruefe('C Konstanten SCHLUSS_FERTIG 16:15 und HANDEL_AB 09:35 (C-86 C-87 C-88 C-89)',
      js(MH.SCHLUSS_FERTIG) === '[16,15]' && js(MH.HANDEL_AB) === '[9,35]', js(MH.SCHLUSS_FERTIG) + js(MH.HANDEL_AB));
    // letzterFertigerWerktag: Dienstag 24.11.2026
    var f = MH.letzterFertigerWerktag;
    pruefe('C letzterFertigerWerktag 16:14 -> Montag (C-92)', f(ny('2026-11-24', 16, 14)) === '2026-11-23', f(ny('2026-11-24', 16, 14)));
    pruefe('C letzterFertigerWerktag 16:15 -> heute (C-90)', f(ny('2026-11-24', 16, 15)) === '2026-11-24', f(ny('2026-11-24', 16, 15)));
    pruefe('C letzterFertigerWerktag 16:00 -> noch Montag (C-86)', f(ny('2026-11-24', 16, 0)) === '2026-11-23', f(ny('2026-11-24', 16, 0)));
    pruefe('C letzterFertigerWerktag Samstagabend -> Freitag (C-91)', f(ny('2026-11-21', 18, 0)) === '2026-11-20' && f(ny('2026-11-22', 12, 0)) === '2026-11-20', f(ny('2026-11-21', 18, 0)));
    pruefe('C letzterFertigerWerktag Montag morgens -> Freitag', f(ny('2026-11-23', 8, 0)) === '2026-11-20', '');
  })();
  (function () {
    var bf = MH.bestandFrisch;
    var abend = ny('2026-11-24', 17, 0), morgen = ny('2026-11-24', 10, 0);
    pruefe('C bestandFrisch ab 16:15 genau (C-94)', bf(ny('2026-11-24', 16, 15), abend) === true && bf(ny('2026-11-24', 16, 15) - 1000, abend) === false, '');
    pruefe('C bestandFrisch 16:00 reicht nicht (C-95)', bf(ny('2026-11-24', 16, 0), abend) === false, '');
    pruefe('C bestandFrisch ohne Ladezeit', bf(0, abend) === false && bf(undefined, abend) === false, '');
    // morgens gilt der Schluss des Vortags
    pruefe('C bestandFrisch morgens gegen Vortag (C-96)', bf(ny('2026-11-23', 16, 15), morgen) === true && bf(ny('2026-11-23', 16, 14), morgen) === false, '');
  })();

  /* ---- stichtagPruefen ---- */
  (function () {
    var heute = '2026-11-25';                                   // Mittwoch; Stichtag = Dienstag 24.
    var spy = reihe('2026-11-20', '2026-11-25');                // enthaelt auch den Balken von heute
    var vorTag = ny('2026-11-23', 9, 30), stichT = ny('2026-11-24', 9, 30), vonT = ny('2026-11-24', 0, 0);
    var at = ny('2026-11-24', 16, 15);                          // genau Schluss des Vorwerktags + 15 min
    function karte(mitStich, zusaetzlichAmTagBeginn) {
      var m = {};
      for (var i = 0; i < 20; i++) {
        var t = (i < mitStich) ? stichT : vorTag;
        if (zusaetzlichAmTagBeginn && i === 0) t = vonT;
        m['S' + i] = [[ny('2026-11-20', 9, 30), 1], [t, 1]];
        m['S' + i].sort(function (a, b) { return a[0] - b[0]; });
      }
      return m;
    }
    var r19 = MH.stichtagPruefen(karte(19), spy, at, heute);
    pruefe('C Stichtag = letzter Tag vor heute (C-51)', r19.stichtag === '2026-11-24', js(r19));
    pruefe('C 19 von 20 = 95 % reicht (C-45)', r19.mit === 19 && r19.ok === true, js(r19));
    var r18 = MH.stichtagPruefen(karte(18), spy, at, heute);
    pruefe('C 18 von 20 = 90 % reicht nicht (C-46 C-52)', r18.mit === 18 && r18.ok === false, js(r18));
    // Balken genau um 00:00 New York des Stichtags zaehlt (>= von; C-47)
    var rv = MH.stichtagPruefen(karte(19, true), spy, at, heute);
    pruefe('C Balken genau 00:00 des Stichtags zaehlt (C-47)', rv.mit === 19 && rv.ok === true, js(rv));
    // geladen: genau 16:15 des Vorwerktags ok; eine Sekunde davor nicht
    var rg = MH.stichtagPruefen(karte(20), spy, at - 1000, heute);
    pruefe('C geladen eine Sekunde vor 16:15: nicht ok (C-49)', rg.ok === false && /geladen/.test(rg.grund || ''), js(rg));
    var rh = MH.stichtagPruefen(karte(20), spy, ny('2026-11-25', 10, 0), heute);
    pruefe('C geladen heute 10:00 (nach Vorwerktag-Schluss): ok (C-48)', rh.ok === true, js(rh));
    var rl = MH.stichtagPruefen({}, spy, at, heute);
    pruefe('C leere Wertemenge nie ok (C-50)', rl.ok === false && rl.gesamt === 0, js(rl));
    var rk = MH.stichtagPruefen(karte(20), [], at, heute);
    pruefe('C ohne Marktreihe kein Stichtag', rk.ok === false && rk.stichtag === null, js(rk));
  })();

  /* ---- punktTag ---- */
  (function () {
    var spy = reihe('2026-11-20', '2026-11-24'), p = MH.punktTag;   // letzter Balken: Dienstag 24. mit Schluss 102
    var a = p(spy, ny('2026-11-24', 15, 0));
    pruefe('C punktTag vor 16:15: Vortag (C-53)', a && a.tag === '2026-11-23' && a.kurs === 101, js(a));
    var b = p(spy, ny('2026-11-24', 16, 15));
    pruefe('C punktTag ab 16:15 genau: heute (C-54)', b && b.tag === '2026-11-24' && b.kurs === 102 && b.t === ny('2026-11-24', 9, 30), js(b));
    pruefe('C punktTag Kurs ist Schluss, nicht Zeit (C-55)', b && b.kurs < 1e6, js(b));
    var s0 = reihe('2026-11-20', '2026-11-24'); s0[2][1] = 0;
    pruefe('C punktTag Schluss 0: null (C-56)', p(s0, ny('2026-11-24', 17, 0)) === null, js(p(s0, ny('2026-11-24', 17, 0))));
    pruefe('C punktTag leere Reihe', p([], 1) === null, '');
  })();

  /* ---- bargeldAm ---- */
  (function () {
    var tX = ny('2026-11-10', 9, 30), t2 = ny('2026-11-12', 9, 30);
    var buch = { cash: 1000, massnahmen: [
      { art: 'div', t: tX, summe: 5 },           // Ex-Tag = tX: bleibt im Wert von X
      { art: 'div', t: t2, summe: 7 },           // danach: abziehen
      { art: 'div', t: t2, summe: undefined },   // ohne Summe: ignorieren
      { art: 'split', t: t2, summe: 100 }        // Split: nie abziehen
    ] };
    pruefe('C bargeldAm: nur spaetere Ausschuettungen abziehen (C-58 C-59 C-60 C-61)', gl(MH.bargeldAm(buch, tX), 993), MH.bargeldAm(buch, tX));
    pruefe('C bargeldAm ohne Massnahmen', MH.bargeldAm({ cash: 5 }, tX) === 5, '');
  })();

  /* ---- reihenendeAusbuchen ---- */
  (function () {
    var spy = reihe('2026-11-09', '2026-11-19');        // 9 Balken: 9.,10.,11.,12.,13.,16.,17.,18.,19.
    var now = ny('2026-11-20', 9, 40);
    function lauf(buch, rohMap, s) { return MH.reihenendeAusbuchen(buch, rohMap, s || spy, now); }
    function ser(letzterTag, kurs) { return [[ny('2026-11-09', 9, 30), 1], [ny(letzterTag, 9, 30), kurs]]; }
    // Lang: letzter Balken 12.; danach 13.,16.,17.,18.,19. = 5 Balken -> ausgebucht zu 50 x 10 = 500, ohne Kosten
    var b = { cash: 1000.123456, positionen: [{ sym: 'A', stueck: 10, einstand: 40, richtung: 1 }] };
    var a = lauf(b, { A: ser('2026-11-12', 50) });
    pruefe('C Reihenende nach 5 Balken, Lang (C-62 C-63 C-66 C-67 C-69 C-70 C-71)',
      a.length === 1 && a[0].tage === 5 && a[0].gutschrift === 500 && a[0].letzterTag === '2026-11-12' && b.positionen.length === 0 && b.cash === 1000.123456 + 500 && b.trades.length === 1 && b.trades[0].pnl === 100,
      js(a) + ' cash ' + b.cash + js(b.trades));
    // nur 4 Balken seit dem letzten (Reihe der Position endet am 13.): bleibt
    var b2 = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 40, richtung: 1 }] };
    var a2 = lauf(b2, { A: ser('2026-11-13', 50) });
    pruefe('C Reihenende nach 4 Balken noch nicht (C-62 C-63 C-69)', a2.length === 0 && b2.positionen.length === 1, js(a2));
    // Leerverkauf: 10 x (2 x 100 - 80) = 1200; negativer Wert -> 0
    var b3 = { cash: 0, positionen: [{ sym: 'A', stueck: 10, einstand: 100, richtung: -1 }, { sym: 'B', stueck: 10, einstand: 100, richtung: -1 }] };
    var a3 = lauf(b3, { A: ser('2026-11-12', 80), B: ser('2026-11-12', 250) });
    var ga = a3.filter(function (x) { return x.sym === 'A'; })[0], gb = a3.filter(function (x) { return x.sym === 'B'; })[0];
    pruefe('C Reihenende Leerverkauf 2 x Einstand - Kurs (C-64 C-68)', ga && ga.gutschrift === 1200 && ga.richtung === -1, js(a3));
    pruefe('C Reihenende Leerverkauf nie unter 0 (C-65)', gb && gb.gutschrift === 0 && b3.cash === 1200, js(a3) + b3.cash);
    // Lang mit richtung 1: nicht als Leerverkauf behandeln, Position ohne richtung auch Lang
    var b4 = { cash: 0, positionen: [{ sym: 'A', stueck: 2, einstand: 10, richtung: 1 }, { sym: 'B', stueck: 2, einstand: 10 }] };
    var a4 = lauf(b4, { A: ser('2026-11-12', 30), B: ser('2026-11-12', 30) });
    pruefe('C Reihenende Lang richtung=1 und ohne richtung (C-68)', b4.cash === 120 && a4.every(function (x) { return x.richtung === 1; }), js(a4) + b4.cash);
    // Rundung der pnl auf Cent: 3 x 33,333 - 3 x 40,1234 = 99,999 - 120,3702 = -20,3712 -> -20,37
    var b5 = { cash: 0, positionen: [{ sym: 'A', stueck: 3, einstand: 40.1234, richtung: 1 }] };
    lauf(b5, { A: ser('2026-11-12', 33.333) });
    pruefe('C Reihenende pnl auf Cent gerundet (C-71)', b5.trades[0].pnl === -20.37, js(b5.trades));
    // Schluss 0: nicht ausbuchen
    var b6 = { cash: 0, positionen: [{ sym: 'A', stueck: 3, einstand: 4, richtung: 1 }] };
    var a6 = lauf(b6, { A: ser('2026-11-12', 0) });
    pruefe('C Reihenende Schluss 0: bleibt (C-73)', a6.length === 0 && b6.positionen.length === 1, js(a6));
    // Stempel eines Balkens abends in New York ist in UTC schon der Folgetag
    var abend = [[ny('2026-11-09', 9, 30), 1], [ny('2026-11-12', 20, 0), 50]];
    var b7 = { cash: 0, positionen: [{ sym: 'A', stueck: 1, einstand: 1, richtung: 1 }] };
    var a7 = lauf(b7, { A: abend });
    pruefe('C Reihenende Tag in New York, nicht UTC (C-72)', a7.length === 1 && a7[0].letzterTag === '2026-11-12' && a7[0].tage === 5, js(a7));
    // Kappe der trades auf 400
    var alt = []; for (var i = 0; i < 400; i++) alt.push({ t: i });
    var b8 = { cash: 0, trades: alt, positionen: [{ sym: 'A', stueck: 1, einstand: 1, richtung: 1 }] };
    lauf(b8, { A: ser('2026-11-12', 5) });
    pruefe('C Reihenende trades auf 400 gekappt (C-74)', b8.trades.length === 400 && b8.trades[399].art === 'reihenende' && b8.trades[0].t === 1, b8.trades.length);
    // Position ohne Reihe bleibt, leere SPY-Reihe: nichts
    var b9 = { cash: 0, positionen: [{ sym: 'Z', stueck: 1, einstand: 1, richtung: 1 }] };
    pruefe('C Reihenende ohne Reihe: bleibt', lauf(b9, {}).length === 0 && b9.positionen.length === 1 && lauf(b9, { Z: ser('2026-11-12', 5) }, []).length === 0, '');
  })();

  /* ---- bewerteDrift (C-97 C-98; betrifft das Drift-Buch, nicht das Momentum-Buch) ---- */
  (function () {
    var b = { cash: 100.123, positionen: [{ sym: 'A', stueck: 1.5, einstand: 3, richtung: 1 }] };
    var w = MH.bewerteDrift(b, { A: 3.333 });            // 100,123 + 4,9995 = 105,1225 -> 105,12
    pruefe('C bewerteDrift auf Cent gerundet (C-97)', w.wert === 105.12, js(w));
    var c = { cash: 50, positionen: [{ sym: 'S', stueck: 10, einstand: 100, richtung: -1 }] };
    pruefe('C bewerteDrift Short nie unter 0 (C-98)', MH.bewerteDrift(c, { S: 250 }).wert === 50 && MH.bewerteDrift(c, { S: 80 }).wert === 1250, js(MH.bewerteDrift(c, { S: 250 })));
  })();
})();

/* ================= Teil D ================= */
/* Kleinsttests Gruppe D (Mutationstest Buecher, 04.10.2026): Ablauf der Umschichtung in mfdepot.js
 * (ausfuehrungVorbereiten, eroeffnung, offenNachfassen, tagespunkt, massnahmenBuchen, reihenendeBuchen,
 * buchInit, umstellungPruefen/feldGleich/kleinstWert, takt-Zweig) und Zerlegen der Tagesreihe in kurse.js
 * (zerlege, ereignisseAus, ereignisseAb, reihe, kursOk).
 *
 * Aufruf aus der Repo-Wurzel:  node pruefberichte/mutation-buecher/teil-D.test.js
 * Jeder Test nennt im Kommentar die Mutanten-Kennungen (D-nn, siehe D-mutanten.json), die er toetet.
 * mfdepot.js ist ein Browser-IIFE: es laeuft in einer vm-Sandbox mit Attrappen (Muster wie in
 * pruefberichte/live-gegen-messung-momentum.test.js). Damit die inneren Funktionen einzeln aufrufbar
 * sind, haengt die Sandbox VOR dem Export window.MFDepot ein window.__INT an (nur im Test, die Datei
 * bleibt unveraendert). Feste Uhr (Mittwoch 25.11.2026, New York = UTC-5), Kursdaten Kunstdaten.
 * Reines Node, kein Netz. Alles Simulation mit virtuellem Kapital, keine Anlageberatung. */
(function () {
  var fs = require('fs');
  var vm = require('vm');
  var MH = require(WURZEL + '/mfhandel.js');
  var KK = require(WURZEL + '/kurse.js');
  var Ms = require(WURZEL + '/massstab.js');

  function pruefe(name, ok, detail) {
    if (ok) console.log('OK ' + name);
    else { console.log('ROT ' + name + ': ' + (detail === undefined ? '' : detail)); process.exitCode = 1; }
  }
  function js(x) { return JSON.stringify(x); }
  function nahe(a, b, eps) { return typeof a === 'number' && Math.abs(a - b) <= (eps || 1e-6); }

  var TAG = 86400000;
  /** Uhrzeit hh:mm New York als UTC-Zeitstempel - im November (Winterzeit) UTC-5. */
  function ny(j, m, t, h, min) { return Date.UTC(j, m - 1, t, h + 5, min || 0); }
  var JETZT = ny(2026, 11, 25, 10, 30);                 // Mittwoch 25.11.2026 10:30 New York
  var HEUTE = '2026-11-25', STICHTAG = '2026-11-24';
  var DI_BAR = ny(2026, 11, 24, 9, 30), MI_BAR = ny(2026, 11, 25, 9, 30);   // Tagesbalken wie bei Yahoo: 09:30 New York
  var STAND_OK = ny(2026, 11, 24, 17, 0);               // geladen am Dienstag nach 16:15 -> frisch

  /** n Werktagsstempel (09:30 New York), der letzte ist endeT. */
  function werktage(endeT, n) {
    var aus = [], t = endeT;
    while (aus.length < n) { var w = new Date(t).getUTCDay(); if (w !== 0 && w !== 6) aus.unshift(t); t -= TAG; }
    return aus;
  }

  /* ---------------- Sandbox fuer mfdepot.js ---------------- */
  var U_ATT = { statuszeile: function () { return null; }, esc: String, d: String, dt: String, money: String, signTxt: String,
    pz1: String, nf2: { format: String } };
  function uhr(jetzt) {
    var Uh = function (x) { return arguments.length ? new Date(x) : new Date(Uh.jetzt); };
    Uh.now = function () { return Uh.jetzt; }; Uh.jetzt = jetzt; Uh.UTC = Date.UTC; Uh.parse = Date.parse;
    return Uh;
  }
  function ladeDepot(win, jetzt) {
    var doc = { readyState: 'complete', addEventListener: function () { }, getElementById: function (id) { return (win.__el && win.__el[id]) || null; } };
    var ctx = { window: win, document: doc, console: console, __Uhr: uhr(jetzt),
      setTimeout: function (f, ms) { (win.__timer = win.__timer || []).push(ms); if (ms >= 1000) return 0; setImmediate(f); return 0; }, setInterval: function () { return 0; } };
    win.document = doc;
    vm.createContext(ctx);
    var src = fs.readFileSync(WURZEL + '/mfdepot.js', 'utf8');
    var marke = 'window.MFDepot = { takt: takt,';
    if (src.indexOf(marke) < 0) throw new Error('Exportmarke in mfdepot.js nicht gefunden');
    var zusatz = 'window.__INT = { buchInit: buchInit, kleinstWert: kleinstWert, feldGleich: feldGleich, konfigGleich: konfigGleich, ' +
      'umstellungPruefen: umstellungPruefen, massnahmenBuchen: massnahmenBuchen, reihenendeBuchen: reihenendeBuchen, ' +
      'tagespunkt: tagespunkt, eroeffnung: eroeffnung, ausfuehrungVorbereiten: ausfuehrungVorbereiten, ' +
      'offenNachfassen: offenNachfassen, ladeKurse: ladeKurse, nachladen: nachladen, kurseFrischHalten: kurseFrischHalten }; ';
    src = src.split(marke).join(zusatz + marke);
    vm.runInContext('(function (Date) {' + src + '\n})(__Uhr);', ctx, { filename: 'mfdepot.js' });
    win.__uhr = ctx.__Uhr;
    return win;
  }
  /** Kurs-Lader-Attrappe auf der ECHTEN Zerlegung: tabelle[sym] = [{t, o, c}] (o null = Eroeffnung fehlt). */
  function kurseAttrappe(tabelle, log) {
    return {
      hole: async function (sym, opt) {
        if (log) log.push({ sym: sym, opt: opt });
        var b = tabelle[sym];
        if (!b) return null;
        var j = { chart: { result: [{ timestamp: b.map(function (x) { return x.t / 1000; }),
          indicators: { quote: [{ close: b.map(function (x) { return x.c; }), open: b.map(function (x) { return x.o; }),
            high: b.map(function (x) { return x.c; }), low: b.map(function (x) { return x.c; }), volume: b.map(function () { return 1e6; }) }] } }] } };
        return KK.zerlege(js(j), opt);
      },
      ereignisseAb: KK.ereignisseAb
    };
  }
  /** MFHandel mit Aufzeichnung: jede Funktion in namen ruft die ECHTE auf (oder ueber[name]) und merkt sich die Argumente. */
  function mhMit(rec, ueber) {
    var m = Object.assign({}, MH);
    ['fuehreAus', 'planeUmschichtung', 'nachfassen', 'faelligkeit', 'stichtagPruefen', 'momentumZiel', 'bucheMassnahmen',
      'reihenendeAusbuchen', 'offeneAuftraege', 'stempleKursT', 'rohBis'].forEach(function (n) {
      var f = (ueber && ueber[n]) || MH[n];
      m[n] = function () {
        var r = f.apply(this, arguments);
        (rec[n] = rec[n] || []).push({ args: Array.prototype.slice.call(arguments), res: r });
        return r;
      };
    });
    return m;
  }
  function kopie(v) { return v == null ? null : JSON.parse(JSON.stringify(v)); }

  /** Eine vollstaendige Welt: Bestand, Buch, Sandbox. o: now, stand, buch, drift, momentumAn, opens, ziel, extraRoh, ... */
  function welt(o) {
    o = o || {};
    var now = o.now || JETZT;
    var n = 300, tage = werktage(DI_BAR, n), spyTage = o.spyEnde ? werktage(o.spyEnde, n) : tage;
    var spy = spyTage.map(function (t, j) { return [t, 400 + j * 0.1, 8e7, 400 + j * 0.1]; });
    var syms = o.syms || ['S0', 'T1', 'T2', 'T3', 'T4', 'T5', 'X1', 'KL'];
    var roh = {};
    syms.forEach(function (s) { roh[s] = tage.map(function (t, j) { return [t, 150, 3e6, 150]; }); });
    if (o.wedBar) roh.S0.push([MI_BAR, 151, 3e6, 151]);
    if (o.rohAendern) o.rohAendern(roh, tage);
    var speicher = { mf_ereignisse: { at: STAND_OK, sym: o.ereignisse || {} }, drift_markt: { reihe: spy.map(function (b) { return [b[0], b[3]]; }), roh: spy.map(function (b) { return [b[0], b[1]]; }) } };
    var rec = {}, logHole = [];
    var anstoesse = { n: 0 }, saves = { n: 0 }, fehler = [];
    var Uw = Object.assign({}, U_ATT, { statuszeile: function (ziel, text, art) { if (art === 'fehler') fehler.push(text); return null; } });
    var ziel = o.ziel || ['T1', 'T2', 'T3', 'T4', 'T5'];
    var kanned = function (r, opts) {
      var z = (r.S0 && r.S0.length === n + 1 && o.zielTakt) ? o.zielTakt : ziel;
      return o.zielAntwort ? o.zielAntwort(r, opts) : { ziel: z.slice(), rangfolge: [], uebersprungen: [], verworfen: [],
        korb: { zulaessig: syms.length, geprueft: syms.length + 2, ohneUmsatz: 0, umsatzMin: 1e8, fenster: 20 } };
    };
    var MHx = mhMit(rec, { momentumZiel: o.echtesZiel ? null : kanned });
    var opens = o.opens || {};
    var tabelle = {};
    Object.keys(opens).forEach(function (s) { tabelle[s] = [{ t: MI_BAR, o: opens[s], c: opens[s] * 1.01 }]; });
    if (o.tabelle) Object.keys(o.tabelle).forEach(function (s) { tabelle[s] = o.tabelle[s]; });
    var d = { momentumAn: o.momentumAn !== false, mfBuch: o.buch === undefined ? { name: 'momentum', start: 100000, cash: 0, positionen: [], trades: [],
      angelegt: now - 100 * TAG, letztesRebalanceT: 0, konfig: MH.buchKonfig(), konfigSeit: 1, liquideSeit: 1, korbVerlauf: [] } : o.buch,
      driftBuch: o.drift || undefined, mfVerlauf: o.verlauf || [] };
    var karte = { innerHTML: '' }, klappe = { innerHTML: '' };
    var win = {
      U: Uw, Massstab: Ms, MFHandel: MHx,
      api: { storeGet: async function (k) { return kopie(speicher[k]); }, storeSet: async function () { return { ok: true }; } },
      MF: {
        tagesdatenLesen: async function () { return { roh: kopie(roh), at: o.stand === undefined ? STAND_OK : o.stand, bezug: o.ohneBezug ? null : { reihe: spy } }; },
        ladeUniversum: function () { anstoesse.n++; return Promise.resolve(null); }
      },
      Kurse: kurseAttrappe(tabelle, logHole),
      __D: function () { return d; }, __save: function () { saves.n++; return Promise.resolve({ ok: true }); },
      __el: { buchMomentumKopf: karte, mfdMomentum: klappe }
    };
    ladeDepot(win, now);
    return { win: win, d: d, rec: rec, log: logHole, fehler: fehler, anstoesse: anstoesse, saves: saves, roh: roh, spy: spy, tage: tage, karte: karte, klappe: klappe, MHx: MHx, syms: syms, now: now };
  }
  /** Die letzte Tuneloeg-Zeile mit Kennung id (Anfang). */
  function zeileMit(d, pre) { return (d.tuneLog || []).filter(function (z) { return z.id.indexOf(pre) === 0; })[0]; }
  function posVon(buch, sym) { return (buch.positionen || []).filter(function (p) { return p.sym === sym; })[0]; }

  /* =====================================================================
   * Teil 1: kurse.js (rein)
   * ===================================================================== */
  function teilKurse() {
    /* kursOk: D-144 (0), D-145 (isFinite), D-146 (typeof) */
    pruefe('kursOk: 0, negativ, NaN, Infinity, Text sind kein Kurs; 1,5 und 0,0001 sind einer (D-144,145,146)',
      !KK.kursOk(0) && !KK.kursOk(-1) && !KK.kursOk(NaN) && !KK.kursOk(Infinity) && !KK.kursOk('5') && !KK.kursOk(null) && !KK.kursOk(undefined) &&
      KK.kursOk(1.5) && KK.kursOk(0.0001),
      [0, -1, NaN, Infinity, '5', null].map(KK.kursOk).join(','));

    /* ereignisseAus: D-147..D-159 */
    var ev = {
      dividends: {
        '1700000000': { amount: 0.5, date: 1700000100 },       // date gewinnt gegen den Schluessel
        '1600000000': { amount: 0.25 },                           // ohne date: der Schluessel
        '1650000000': { amount: 0 },                              // Betrag 0: kein Ereignis
        '1660000000': { date: 1660000000 },                       // ohne Betrag: kein Ereignis
        '1800000000': { amount: 0.1, date: 1800000000 }
      },
      splits: {
        '1750000000': { date: 1750000000, numerator: 4, denominator: 1 },
        '1500000000': { date: 1500000000, numerator: 3, denominator: 2 },
        '1550000000': { date: 1550000000, numerator: 2, denominator: 2 },     // z = n: kein Ereignis
        '1560000000': { date: 1560000000, numerator: 0, denominator: 1 },     // Zaehler 0
        '1570000000': { date: 1570000000, numerator: 1, denominator: 0 }      // Nenner 0
      }
    };
    var e = KK.ereignisseAus(ev, null);
    /* Hand: Dividenden: 1600000000 -> 1.6e12 ms (0,25), 1700000100 -> 1.7000001e12 (0,5), 1800000000 -> 1.8e12 (0,1), aufsteigend.
     * Splits: 1500000000 (3:2), 1750000000 (4:1) aufsteigend; 2:2, 0:1, 1:0 entfallen. */
    pruefe('ereignisseAus: Zeit in ms, date vor Schluessel, aufsteigend, ohne Betrag/z=n/0 (D-147,148,149,150,151,152,156)',
      js(e.div) === js([[1600000000000, 0.25], [1700000100000, 0.5], [1800000000000, 0.1]]) &&
      js(e.split) === js([[1500000000000, 3, 2], [1750000000000, 4, 1]]), js(e));

    /* Fenster: Grenzen einschliesslich, beide Listen; nur eine Grenze = kein Filter. D-153,154,155,159 */
    var f = KK.ereignisseAus(ev, { von: 1600000000000, bis: 1750000000000 });
    pruefe('ereignisseAus: Fenster schliesst von und bis ein, wirkt auch auf Splits (D-153,154,159)',
      js(f.div) === js([[1600000000000, 0.25], [1700000100000, 0.5]]) && js(f.split) === js([[1500000000000, 3, 2]].slice(1).concat([[1750000000000, 4, 1]])), js(f));
    var f2 = KK.ereignisseAus(ev, { von: 1600000000001, bis: 1749999999999 });
    pruefe('ereignisseAus: eine Millisekunde ausserhalb faellt heraus (D-153,154)', js(f2.div) === js([[1700000100000, 0.5]]) && f2.split.length === 0, js(f2));
    var f3 = KK.ereignisseAus(ev, { von: 1700000000000 });
    var f4 = KK.ereignisseAus(ev, { bis: 1700000000000 });
    pruefe('ereignisseAus: mit nur einer Grenze wird nicht gefiltert (D-155)', f3.div.length === 3 && f3.split.length === 2 && f4.div.length === 3 && f4.split.length === 2, js([f3, f4]));
    /* Schluessel und date weichen ab: die Reihenfolge der Schluessel ist dann nicht die der Zeit - es wird nach Zeit sortiert. */
    var evU = { dividends: { '100': { amount: 1, date: 900 }, '200': { amount: 2, date: 300 } }, splits: { '100': { date: 900, numerator: 2, denominator: 1 }, '200': { date: 300, numerator: 3, denominator: 1 } } };
    var eU = KK.ereignisseAus(evU, null);
    pruefe('ereignisseAus: Dividenden und Splits werden nach Zeit sortiert, auch wenn die Schluessel anders laufen (D-156,157,158)',
      js(eU.div) === js([[300000, 2], [900000, 1]]) && js(eU.split) === js([[300000, 3, 1], [900000, 2, 1]]), js(eU));
    var e0 = KK.ereignisseAus(undefined, null);
    pruefe('ereignisseAus: ohne Feld events zwei leere Listen', js(e0) === js({ div: [], split: [] }), js(e0));

    /* ereignisseAb: D-160 (Grenze einschliesslich), D-161 (beide Listen) */
    var ab = KK.ereignisseAb({ div: [[100, 1], [200, 2], [300, 3]], split: [[100, 2, 1], [200, 3, 1]] }, 200);
    pruefe('ereignisseAb: ab einschliesslich, Dividenden und Splits (D-160,161)', js(ab) === js({ div: [[200, 2], [300, 3]], split: [[200, 3, 1]] }), js(ab));
    pruefe('ereignisseAb: ohne Eingabe leere Listen', js(KK.ereignisseAb(null, 5)) === js({ div: [], split: [] }));

    /* zerlege */
    var T0 = 1700000000;                                          // Sekunden
    function antwort(feld) {
      var q = { close: [10, 0, 12, 13], open: [9, 9, null, 12.5], high: [11, 11, 13, 14], low: [8, 8, 11, 12], volume: [100, 200, null, 400] };
      var r = { timestamp: [T0, T0 + 86400, T0 + 2 * 86400, T0 + 3 * 86400], indicators: { quote: [q] }, meta: { symbol: 'X' } };
      if (feld) r.indicators.adjclose = [{ adjclose: [5, 6, 7, 8] }];
      return js({ chart: { result: [r] } });
    }
    var z = KK.zerlege(antwort(false), { bereinigt: false });
    /* Hand: Balken 2 (close 0) verworfen; Zeit * 1000; Eroeffnung fehlt -> Schluss (12); Volumen null -> 0; Hoch/Tief wie geliefert. */
    pruefe('zerlege: Zeit in ms, kaputter Kurs verworfen und gezaehlt, Luecken mit Schluss/0 gefuellt (D-166,170,171,174,175,182)',
      js(z.bars) === js([[T0 * 1000, 10, 100, 11, 8, 9], [(T0 + 2 * 86400) * 1000, 12, 0, 13, 11, 12], [(T0 + 3 * 86400) * 1000, 13, 400, 14, 12, 12.5]]) &&
      z.verworfen === 1 && z.gesamt === 4 && z.feld === 'close' && z.ausserhalbFenster === 0 && z.roh === undefined && z.ereignisse === undefined,
      js(z));
    var zb = KK.zerlege(antwort(true), { bereinigt: true });
    pruefe('zerlege: bereinigt nimmt adjclose (Feld adjclose), ohne Schalter close (D-162,163)',
      zb.feld === 'adjclose' && js(zb.bars.map(function (b) { return b[1]; })) === js([5, 6, 7, 8]) && z.feld === 'close', js(zb));
    var zb2 = KK.zerlege(antwort(false), { bereinigt: true });
    pruefe('zerlege: bereinigt ohne adjclose faellt auf close', zb2.feld === 'close' && zb2.bars[0][1] === 10, js(zb2));
    var leerAdj = JSON.parse(antwort(true)); leerAdj.chart.result[0].indicators.adjclose = [{ adjclose: [] }];
    var zl = KK.zerlege(js(leerAdj), { bereinigt: true });
    pruefe('zerlege: leere adjclose-Liste gilt nicht (D-187)', zl.feld === 'close' && zl.bars[0][1] === 10, js(zl));
    /* kaputter Kurs 0 / NaN / negativ im adjclose: wird verworfen, nicht nur null (D-145) */
    var neg = JSON.parse(antwort(false)); neg.chart.result[0].indicators.quote[0].close = [10, -3, 0, 13];
    var zn = KK.zerlege(js(neg), { bereinigt: false });
    pruefe('zerlege: negativer und 0-Schluss werden verworfen (D-175)', zn.bars.length === 2 && zn.verworfen === 2, js(zn));

    /* mitRoh: roher Schluss je Balken, fehlender als null; Zeit in ms (D-164,165,185) */
    var rr = JSON.parse(antwort(true)); rr.chart.result[0].indicators.quote[0].close = [10, 0, 12, null];
    rr.chart.result[0].indicators.adjclose = [{ adjclose: [5, 6, 7, 8] }];
    var zr = KK.zerlege(js(rr), { bereinigt: true, mitRoh: true });
    /* Hand: adjclose 5,6,7,8 alle brauchbar; roh: 10, 0->null, 12, null->null; Zeit in ms. */
    pruefe('zerlege: mitRoh liefert den unbereinigten Schluss, kaputter roher Schluss steht als null, Zeit in ms (D-164,165,185)',
      js(zr.roh) === js([[T0 * 1000, 10], [(T0 + 86400) * 1000, null], [(T0 + 2 * 86400) * 1000, 12], [(T0 + 3 * 86400) * 1000, null]]) && zr.bars.length === 4, js(zr));
    pruefe('zerlege: ohne mitRoh kein Feld roh (D-185)', zb.roh === undefined && z.roh === undefined);

    /* offenRoh: fehlende Eroeffnung bleibt null, sonst Schluss (D-169,170) */
    var zo = KK.zerlege(antwort(false), { bereinigt: false, offenRoh: true });
    pruefe('zerlege: offenRoh laesst fehlende Eroeffnung leer, ohne offenRoh faellt sie auf den Schluss (D-169,170)',
      zo.bars[1][5] === null && z.bars[1][5] === 12, js([zo.bars[1], z.bars[1]]));

    /* Hoch/Tief fehlen oder vertauscht (D-167,168,172,173) */
    var ht = JSON.parse(antwort(false)); var q2 = ht.chart.result[0].indicators.quote[0];
    q2.close = [10, 10, 12, 13]; q2.high = [8, null, 13, 14]; q2.low = [11, 8, null, 12];
    var zh = KK.zerlege(js(ht), { bereinigt: false });
    /* Hand: Balken 1: Hoch 8 < Tief 11 -> vertauscht: hi 11, lo 8. Balken 2: high null -> Schluss 10, low 8. Balken 3: low null -> Schluss 12 (nicht Hoch 13). */
    pruefe('zerlege: vertauschtes Hoch/Tief wird getauscht, fehlendes Hoch/Tief faellt auf den Schluss (D-167,168,172,173)',
      js(zh.bars.map(function (b) { return [b[3], b[4]]; })) === js([[11, 8], [10, 8], [13, 12], [14, 12]]), js(zh.bars));
    /* Volumen: Zahl bleibt, Text und Infinity werden 0 (D-171) */
    var vo = JSON.parse(antwort(false)); vo.chart.result[0].indicators.quote[0].volume = [100, 'x', Infinity, 7.5];
    var zv = KK.zerlege(js(vo), { bereinigt: false });
    pruefe('zerlege: Volumen nur als endliche Zahl, sonst 0', js(zv.bars.map(function (b) { return b[2]; })) === js([100, 0, 7.5]), js(zv.bars));

    /* Fenster: Grenzen einschliesslich, beide Reihen (D-176..D-179, D-181) */
    var T = [T0, T0 + 86400, T0 + 2 * 86400, T0 + 3 * 86400];
    var zf = KK.zerlege(antwort(true), { bereinigt: false, mitRoh: true, von: (T0 + 2 * 86400) * 1000, bis: (T0 + 3 * 86400) * 1000 });
    /* Balken 2 (close 0) ist verworfen; Fenster [T2, T3] einschliesslich -> Balken T2 und T3 bleiben (je genau auf einer Grenze), T0 faellt heraus (1 ausserhalb). */
    pruefe('zerlege: Fenster einschliesslich beider Grenzen, Balken und Rohreihe gleich gefiltert, ausserhalbFenster gezaehlt (D-176,177,178,179,181)',
      js(zf.bars.map(function (b) { return b[0] / 1000; })) === js([T[2], T[3]]) && js(zf.roh.map(function (b) { return b[0] / 1000; })) === js([T[2], T[3]]) &&
      zf.ausserhalbFenster === 1, js(zf));
    var zg = KK.zerlege(antwort(true), { bereinigt: false, mitRoh: true, von: (T0 + 1) * 1000, bis: (T0 + 3 * 86400 - 1) * 1000 });
    pruefe('zerlege: eine Millisekunde ausserhalb faellt heraus, auch aus der Rohreihe (D-176,177,178,179)',
      js(zg.bars.map(function (b) { return b[0] / 1000; })) === js([T[2]]) && js(zg.roh.map(function (b) { return b[0] / 1000; })) === js([T[2]]) && zg.ausserhalbFenster === 2, js(zg));
    var zh1 = KK.zerlege(antwort(false), { bereinigt: false, von: (T0 + 3 * 86400) * 1000 });
    pruefe('zerlege: nur eine Fenstergrenze filtert nicht (D-180)', zh1.bars.length === 3 && zh1.ausserhalbFenster === 0, js(zh1));

    /* ereignisse im Ergebnis (D-183, D-186) */
    var mitEv = JSON.parse(antwort(false)); mitEv.chart.result[0].events = { dividends: { '1700000000': { amount: 0.5, date: T0 } } };
    var ze = KK.zerlege(js(mitEv), { bereinigt: false, ereignisse: true, von: (T0 - 10) * 1000, bis: (T0 + 5) * 1000 });
    pruefe('zerlege: o.ereignisse traegt Ereignisse, mit Fenster gefiltert (D-183,186)', js(ze.ereignisse) === js({ div: [[T0 * 1000, 0.5]], split: [] }), js(ze.ereignisse));
    var ze2 = KK.zerlege(js(mitEv), { bereinigt: false, ereignisse: true, von: (T0 + 10) * 1000, bis: (T0 + 20) * 1000 });
    pruefe('zerlege: Ereignisse ausserhalb des Fensters fallen heraus (D-186)', ze2.ereignisse.div.length === 0, js(ze2.ereignisse));

    /* reihe: Zeit und Schluss (D-188) */
    pruefe('reihe: nur Zeit und Schluss, null/leer ergibt []', js(KK.reihe([[1, 2, 3, 4], [5, 6, 7, 8]])) === js([[1, 2], [5, 6]]) && js(KK.reihe(null)) === '[]');
    /* url: floor der Sekunden, events (D-189,190) */
    var u = KK.url('AB', { von: 1700000000999, bis: 1700000100999, interval: '1d', ereignisse: true });
    pruefe('url: Sekunden abgerundet, events div+splits (D-189,190)', u.indexOf('period1=1700000000&period2=1700000100') > 0 && u.indexOf('&events=div%2Csplits') > 0, u);
  }

  /* =====================================================================
   * Teil 2: mfdepot.js - Buch, Konfiguration, Umstellung
   * ===================================================================== */
  async function teilBuchKonfig() {
    var w = welt({}), I = w.win.__INT, K = MH.buchKonfig();
    function mit(ueber) { return Object.assign({}, K, ueber); }

    /* buchInit: D-01..D-06 */
    var b = I.buchInit('momentum');
    pruefe('buchInit momentum: 100.000 $ Bargeld und Start, angelegt = jetzt, gemessene Konfiguration, liquideSeit leer',
      b.cash === 100000 && b.start === 100000 && b.letztesRebalanceT === 0 && b.angelegt === JETZT && js(b.konfig) === js(K) &&
      b.konfigSeit === JETZT && b.liquideSeit === null && js(b.korbVerlauf) === '[]' && js(b.positionen) === '[]' && js(b.trades) === '[]',
      js(b));
    var bd = I.buchInit('drift');
    pruefe('buchInit drift: gleiches Startkapital, keine Konfiguration', bd.cash === 100000 && bd.start === 100000 && bd.konfig === undefined &&
      bd.letztesRebalanceT === 0 && bd.liquideSeit === undefined, js(bd));

    /* kleinstWert, feldGleich, konfigGleich: D-07..D-15 */
    pruefe('kleinstWert: fehlend, null, 0 und negativ sind 0 (aus), 0,05 bleibt',
      I.kleinstWert({}) === 0 && I.kleinstWert(null) === 0 && I.kleinstWert({ kleinstAnteil: 0 }) === 0 && I.kleinstWert({ kleinstAnteil: -1 }) === 0 &&
      I.kleinstWert({ kleinstAnteil: 0.05 }) === 0.05, [I.kleinstWert({}), I.kleinstWert({ kleinstAnteil: -1 })].join(','));
    pruefe('feldGleich: kleinstAnteil fehlend gleich 0; sonst genau gleich (nicht <=)',
      I.feldGleich({}, { kleinstAnteil: 0 }, 'kleinstAnteil') === true && I.feldGleich({ kleinstAnteil: 0.05 }, { kleinstAnteil: 0 }, 'kleinstAnteil') === false &&
      I.feldGleich({ halten: 63 }, { halten: 63 }, 'halten') === true && I.feldGleich({ halten: 60 }, { halten: 63 }, 'halten') === false &&
      I.feldGleich({ halten: 63 }, { halten: 60 }, 'halten') === false);
    pruefe('konfigGleich: gleich = true; ohne eine Seite = false; JEDES der acht Felder einzeln zaehlt',
      I.konfigGleich(K, mit({})) === true && I.konfigGleich(null, K) === false && I.konfigGleich(K, null) === false && I.konfigGleich(null, null) === false,
      '');
    var feldErg = [];
    Object.keys(K).forEach(function (f) {
      var x = mit({}); x[f] = f === 'kleinstAnteil' ? 0.1 : K[f] + 1;
      feldErg.push(f + ':' + I.konfigGleich(K, x));
    });
    pruefe('konfigGleich: Abweichung in einem einzigen Feld ergibt false (alle acht)', feldErg.every(function (x) { return /false$/.test(x); }) && feldErg.length === 8, feldErg.join(' '));

    /* umstellungPruefen */
    function buchMitKonfig(k) { return { konfig: k, konfigSeit: 111, liquideSeit: 222, korbVerlauf: [{ t: 1 }] }; }
    /* U1 nur Regel K: aus -> 7,5 %. Hand: Math.round(0,075*1000)/10 = 7,5 -> "7,5". D-16,18,19,20,21,22 */
    var d1 = { mfBuch: buchMitKonfig(mit({ kleinstAnteil: 0 })) }, K1 = mit({ kleinstAnteil: 0.075 });
    var r1 = I.umstellungPruefen(d1, K1, 5000), z1 = (d1.tuneLog || [])[0] || {};
    pruefe('umstellungPruefen nur Regel K: eigene Zeile mit der Stufe in Worten, Konfiguration und kleinstSeit neu, Vorwaertstest bleibt (D-16,18,19,20,21,22)',
      r1 === true && d1.tuneLog.length === 1 && z1.id === 'mfkonfig-5000' && z1.at === 5000 && z1.quelle === 'umstellung' &&
      z1.applied[0] === 'Momentum-Buch: Regel K gegen Kleinstpositionen eingeschaltet (aus → 7,5 % des Platzwerts)' &&
      z1.txt.indexOf('alt aus → neu 7,5 % des Platzwerts') > 0 && z1.txt.indexOf('unter 7,5 % des Platzwerts (Depotwert') > 0 &&
      d1.mfBuch.konfig === K1 && d1.mfBuch.kleinstSeit === 5000 && d1.mfBuch.konfigSeit === 111 && d1.mfBuch.liquideSeit === 222 && d1.mfBuch.korbVerlauf.length === 1,
      js([r1, z1, d1.mfBuch]));
    /* U2 ausschalten */
    var d2 = { mfBuch: buchMitKonfig(mit({ kleinstAnteil: 0.05 })) }, K2 = mit({ kleinstAnteil: 0 });
    var r2 = I.umstellungPruefen(d2, K2, 6000), z2 = (d2.tuneLog || [])[0] || {};
    pruefe('umstellungPruefen Regel K aus: Zeile "ausgeschaltet (5 % des Platzwerts → aus)"',
      r2 === true && z2.applied[0] === 'Momentum-Buch: Regel K gegen Kleinstpositionen ausgeschaltet (5 % des Platzwerts → aus)' &&
      z2.txt.indexOf('Ohne die Regel werden Käufe wieder bis auf 0,0001 Stück verkleinert') > 0 && d2.mfBuch.kleinstSeit === 6000, js(z2));
    /* U3 fehlendes Feld gegen 0 = gleich: nichts tun. D-07, D-10 */
    var alt3 = mit({}); delete alt3.kleinstAnteil;
    var d3 = { mfBuch: buchMitKonfig(alt3) }, r3 = I.umstellungPruefen(d3, mit({ kleinstAnteil: 0 }), 7000);
    pruefe('umstellungPruefen: Konfiguration ohne Feld kleinstAnteil gegen kleinstAnteil 0 ist keine Umstellung (D-07,D-10)',
      r3 === false && d3.tuneLog === undefined && d3.mfBuch.konfig === alt3, js([r3, d3.tuneLog]));
    var d3b = { mfBuch: buchMitKonfig(alt3) }, r3b = I.umstellungPruefen(d3b, mit({ kleinstAnteil: 0.05 }), 7100);
    pruefe('umstellungPruefen: Feld fehlt, neu 5 %: Regel K eingeschaltet, "alt aus" (D-07)', r3b === true && d3b.tuneLog[0].txt.indexOf('alt aus → neu 5 % des Platzwerts') > 0, js(d3b.tuneLog));
    /* U4 gleich */
    var d4 = { mfBuch: buchMitKonfig(mit({})) }, r4 = I.umstellungPruefen(d4, mit({}), 8000);
    pruefe('umstellungPruefen: gleiche Konfiguration -> false, nichts geschrieben', r4 === false && d4.tuneLog === undefined && d4.mfBuch.konfigSeit === 111);
    /* U5 anderes Feld: volle Umstellung. D-23..D-26, D-28, D-29, D-30 */
    var d5 = { mfBuch: buchMitKonfig(mit({ halten: 60, kleinstAnteil: 0 })) }, K5 = mit({ kleinstAnteil: 0.075 });
    var r5 = I.umstellungPruefen(d5, K5, 9000), z5 = (d5.tuneLog || [])[0] || {};
    /* Hand: anteil 0,1 -> "stärkste 10 %"; umsatzMin 1e8 -> "100 Mio $"; Fenster 20; mindestWerte 100. */
    pruefe('umstellungPruefen anderes Feld: Konfiguration, Seit-Stempel neu, liquideSeit und korbVerlauf zurueckgesetzt, kein kleinstSeit (D-23,24,25,26)',
      r5 === true && z5.applied[0] === 'Momentum-Buch: Konfiguration → gemessene liquide Fassung (Studie 02.09.2026)' &&
      d5.mfBuch.konfig === K5 && d5.mfBuch.konfigSeit === 9000 && d5.mfBuch.liquideSeit === null && js(d5.mfBuch.korbVerlauf) === '[]' && d5.mfBuch.kleinstSeit === undefined,
      js([r5, d5.mfBuch]));
    pruefe('umstellungPruefen: Text mit alter und neuer Konfiguration in Zahlen (D-28,29,30)',
      z5.txt.indexOf('Alt: Rückblick 231, Lücke 21, Halten 60 Handelstage, stärkste 10 %, mindestens 100 zulässige Werte, Korb nur Median-Tagesumsatz ≥ 100 Mio $ ' +
        '(Schluss × Stück über 20 Balken bis zum Stichtag, Punkt-in-Zeit, vor der Rangbildung), Regel K gegen Kleinstpositionen aus. Neu: Rückblick 231, Lücke 21, Halten 63 Handelstage') === 0 &&
      z5.txt.indexOf('Regel K gegen Kleinstpositionen an (unter 7,5 % des Platzwerts kein Kauf, kein gehaltener Bestand)') > 0, z5.txt);
    /* U6 Buch ganz ohne gemerkte Konfiguration: voller Zweig mit Altwert-Text. D-17, D-27 */
    var d6 = { mfBuch: { konfig: undefined, konfigSeit: 1, liquideSeit: 5, korbVerlauf: [{}] } }, r6 = I.umstellungPruefen(d6, mit({}), 9500), z6 = (d6.tuneLog || [])[0] || {};
    pruefe('umstellungPruefen ohne gemerkte Konfiguration: voller Zweig, Altwert "Rückblick 231, Lücke 21, Halten 63 ... KEIN Umsatzfilter" (D-17,27)',
      r6 === true && z6.applied[0] === 'Momentum-Buch: Konfiguration → gemessene liquide Fassung (Studie 02.09.2026)' &&
      z6.txt.indexOf('Alt: Rückblick 231, Lücke 21, Halten 63 Handelstage, stärkste 10 %, mindestens 25 Werte, KEIN Umsatzfilter (breiter Korb, alle geladenen Werte). Neu: ') === 0 &&
      d6.mfBuch.liquideSeit === null && d6.mfBuch.kleinstSeit === undefined, z6.txt);

    /* takt: Umstellung fuehrt zum Speichern. D-31 */
    function ruhig(o) {
      /* Ein Buch, bei dem ausser der Umstellung nichts zu speichern ist: Verlaufspunkt von gestern steht, nicht faellig. */
      var w2 = welt(Object.assign({ momentumAn: true, verlauf: [{ t: DI_BAR, tag: STICHTAG, momentum: 1, drift: null, spy: 1, spyT: DI_BAR, buchT: DI_BAR, startM: 100000, startD: null }] }, o));
      return w2;
    }
    var wr = ruhig({}); wr.d.mfBuch.letzteAusfuehrungTag = STICHTAG;
    await wr.win.MFDepot.takt();
    var wu = ruhig({}); wu.d.mfBuch.letzteAusfuehrungTag = STICHTAG; wu.d.mfBuch.konfig = mit({ halten: 60 });
    await wu.win.MFDepot.takt();
    pruefe('takt: eine Umstellung der Konfiguration wird gespeichert, ein ruhiger Takt speichert nichts (D-31)',
      wr.saves.n === 0 && wu.saves.n === 1 && !!zeileMit(wu.d, 'mfkonfig-') && wu.d.mfBuch.konfig.halten === 63, js([wr.saves.n, wu.saves.n]));
  }

  /* =====================================================================
   * Teil 3: Kapitalmassnahmen, Reihenende, Tagespunkt
   * ===================================================================== */
  async function teilBuchungen() {
    var w = welt({}), I = w.win.__INT;
    /* massnahmenBuchen: D-32..D-38 */
    var T0 = ny(2026, 11, 2, 9, 30), T1 = ny(2026, 11, 10, 9, 30), T2 = ny(2026, 11, 20, 9, 30);
    function bucher() {
      return { mfBuch: { cash: 100, positionen: [{ sym: 'AAA', stueck: 10, einstand: 50, seit: T0, kursT: T0 }], trades: [] },
        driftBuch: { cash: 200, positionen: [{ sym: 'BBB', stueck: 20, einstand: 30, seit: T0, kursT: T0, richtung: 1 }], trades: [] } };
    }
    var daten = { ereignisse: { AAA: { div: [[T1, 0.5]], split: [] }, BBB: { div: [[T1, 0.25]], split: [] } }, barZeit: { AAA: T2, BBB: T2 } };
    var d = bucher(), r = I.massnahmenBuchen(MH, d, daten, JETZT);
    /* Hand: AAA 10 Stueck x 0,50 = 5 -> Momentum 105; BBB 20 x 0,25 = 5 -> Drift 205. unshift: Drift-Zeile steht vorn. */
    var zm = (d.tuneLog || []).filter(function (z) { return z.id === 'mfmass-momentum-' + JETZT; })[0] || {};
    var zd = (d.tuneLog || []).filter(function (z) { return z.id === 'mfmass-drift-' + JETZT; })[0] || {};
    pruefe('massnahmenBuchen: beide Buecher buchen ihre Ausschuettung, je Buch eine Zeile mit eigener Kennung, true (D-32,33,34,35,37)',
      r === true && d.mfBuch.cash === 105 && d.driftBuch.cash === 205 && d.tuneLog.length === 2 && d.tuneLog[0].id === 'mfmass-drift-' + JETZT &&
      zm.txt && zm.txt.indexOf('AAA') > 0 && zm.txt.indexOf('BBB') < 0 && zd.txt && zd.txt.indexOf('BBB') > 0 && zd.txt.indexOf('AAA') < 0 &&
      zm.quelle === 'automatik' && zm.at === JETZT, js([r, d.mfBuch.cash, d.driftBuch.cash, d.tuneLog]));
    pruefe('massnahmenBuchen: applied traegt Buchname und Kopf, txt beginnt mit dem Kopf (D-38)',
      zm.applied[0] === 'Momentum-Buch: Ausschüttungen gutgeschrieben: 1 Buchung, Summe 5,00 $' && zm.txt.indexOf('Ausschüttungen gutgeschrieben: 1 Buchung, Summe 5,00 $ – ins Bargeld des Buchs.') === 0 &&
      zd.applied[0] === 'Ergebnis-Drift-Buch: Ausschüttungen gutgeschrieben: 1 Buchung, Summe 5,00 $', js([zm.applied, zd.applied]));
    pruefe('massnahmenBuchen: Buchungszeit ist die Uhr des Takts (D-36)', d.mfBuch.massnahmen[0].am === JETZT && d.driftBuch.massnahmen[0].am === JETZT, js(d.mfBuch.massnahmen));
    var r2 = I.massnahmenBuchen(MH, d, daten, JETZT + 1000);
    pruefe('massnahmenBuchen: ein zweiter Aufruf mit denselben Daten bucht nichts und meldet false',
      r2 === false && d.mfBuch.cash === 105 && d.driftBuch.cash === 205 && d.tuneLog.length === 2);
    var dN = { mfBuch: bucher().mfBuch };
    pruefe('massnahmenBuchen: ohne Drift-Buch kein Fehler, nur Momentum', I.massnahmenBuchen(MH, dN, daten, JETZT) === true && dN.mfBuch.cash === 105 && dN.tuneLog.length === 1);

    /* reihenendeBuchen: D-39..D-43 */
    var tage = werktage(DI_BAR, 40), spy = tage.map(function (t, j) { return [t, 400 + j, 8e7, 400 + j]; });
    var tE = tage[tage.length - 1 - 6];                      // letzter Balken von EEE und FFF: sechs SPY-Balken davor
    var rohE = { EEE: [[tE, 120, 3e6, 120]], FFF: [[tE, 80, 3e6, 80]] };
    var dr = { mfBuch: { cash: 50, positionen: [{ sym: 'EEE', stueck: 10, einstand: 100 }], trades: [] },
      driftBuch: { cash: 7, positionen: [{ sym: 'FFF', stueck: 5, einstand: 70, richtung: 1 }], trades: [] } };
    var ok1 = I.reihenendeBuchen(MH, dr, { roh: rohE, bezug: spy }, JETZT);
    /* Hand: Momentum 50 + 10 x 120 = 1250; Drift 7 + 5 x 80 = 407; je Buch eine Zeile. */
    var zE = (dr.tuneLog || []).filter(function (z) { return z.id === 'mfende-momentum-EEE-' + JETZT; })[0] || {};
    var zF = (dr.tuneLog || []).filter(function (z) { return z.id === 'mfende-drift-FFF-' + JETZT; })[0] || {};
    pruefe('reihenendeBuchen: beide Buecher buchen die Position zum letzten Schluss aus, Zeile je Position mit Buchname, true (D-39,40,42,43)',
      ok1 === true && dr.mfBuch.cash === 1250 && dr.driftBuch.cash === 407 && dr.mfBuch.positionen.length === 0 && dr.driftBuch.positionen.length === 0 &&
      zE.applied && zE.applied[0] === 'Momentum-Buch: Reihenende EEE ausgebucht' && zF.applied && zF.applied[0] === 'Ergebnis-Drift-Buch: Reihenende FFF ausgebucht' &&
      zE.txt.indexOf('Reihenende: EEE') === 0 && zF.txt.indexOf('Reihenende: FFF') === 0, js([ok1, dr.mfBuch.cash, dr.driftBuch.cash, dr.tuneLog]));
    pruefe('reihenendeBuchen: Handelszeit ist die Uhr des Takts (D-41)', dr.mfBuch.trades[0].t === JETZT && dr.driftBuch.trades[0].t === JETZT, js(dr.mfBuch.trades));
    pruefe('reihenendeBuchen: zweiter Aufruf bucht nichts und meldet false', I.reihenendeBuchen(MH, dr, { roh: rohE, bezug: spy }, JETZT) === false && dr.tuneLog.length === 2);
    /* Takt: bei veralteter Marktreihe wird nicht ausgebucht. D-44 */
    var wv = welt({ spyEnde: ny(2026, 11, 18, 9, 30), buch: { name: 'momentum', start: 100000, cash: 0, positionen: [{ sym: 'EEE', stueck: 10, einstand: 100, seit: ny(2026, 9, 1, 9, 30) }],
      trades: [], angelegt: 1, letztesRebalanceT: 0, letzteAusfuehrungTag: '2026-10-01', konfig: MH.buchKonfig(), konfigSeit: 1, liquideSeit: 1, korbVerlauf: [] },
      rohAendern: function (roh, tageW) { roh.EEE = tageW.slice(0, tageW.length - 20).map(function (t) { return [t, 120, 3e6, 120]; }); } });
    await wv.win.MFDepot.takt();
    pruefe('takt: bei veralteter Marktreihe (mehr als drei Werktage hinter der Uhr) wird kein Reihenende gebucht (D-44)',
      wv.d.mfBuch.positionen.length === 1 && wv.d.mfBuch.cash === 0 && wv.fehler.length === 0, js([wv.d.mfBuch, wv.fehler]));
    var wg = welt({ buch: { name: 'momentum', start: 100000, cash: 0, positionen: [{ sym: 'EEE', stueck: 10, einstand: 100, seit: ny(2026, 9, 1, 9, 30) }],
      trades: [], angelegt: 1, letztesRebalanceT: 0, letzteAusfuehrungTag: '2026-11-20', konfig: MH.buchKonfig(), konfigSeit: 1, liquideSeit: 1, korbVerlauf: [] },
      rohAendern: function (roh, tageW) { roh.EEE = tageW.slice(0, tageW.length - 20).map(function (t) { return [t, 120, 3e6, 120]; }); } });
    await wg.win.MFDepot.takt();
    pruefe('takt: bei frischer Marktreihe wird das Reihenende (20 Handelstage ohne Balken) gebucht, Gegenprobe zu D-44',
      wg.d.mfBuch.positionen.length === 0 && wg.d.mfBuch.cash === 1200 && !!zeileMit(wg.d, 'mfende-momentum-EEE-'), js([wg.d.mfBuch, wg.fehler]));

    /* tagespunkt: D-45..D-60 */
    var Mo = DI_BAR - TAG, bezug = [[Mo, 400, 8e7, 400], [DI_BAR, 401, 8e7, 401]];
    function punktD(ueber) {
      var dd = { mfBuch: { start: 100000, cash: 1000, positionen: [{ sym: 'AAA', stueck: 10, einstand: 90 }], massnahmen: [{ art: 'div', t: DI_BAR + 1000, summe: 50 }] },
        driftBuch: { start: 90000, cash: 500, positionen: [{ sym: 'AAA', stueck: 5, einstand: 100, richtung: 1 }], massnahmen: [{ art: 'div', t: DI_BAR + 1000, summe: 20 }] },
        mfVerlauf: [] };
      return Object.assign(dd, ueber || {});
    }
    var dat = { roh: { AAA: [[Mo, 100, 1e6, 100], [DI_BAR, 110, 1e6, 110], [MI_BAR, 150, 1e6, 150]] }, bezug: bezug, preise: { AAA: 150, SPY: 999 } };
    var dp = punktD(), p = I.tagespunkt(MH, dp, dat, JETZT);
    /* Hand (Punkt fuer Dienstag 24.11., Schluss AAA 110, SPY 401):
     *  Momentum: Bargeld 1000 - 50 (Ausschuettung mit Ex-Tag nach X) = 950, plus 10 x 110 = 1100 -> 2050.
     *  Drift: 500 - 20 = 480, plus 5 x 110 = 550 -> 1030. */
    pruefe('tagespunkt: Buecher zu den Schluessen des Punkt-Tags, Bargeld an X, Marktstand und Stempel aus dem SPY-Balken von X (D-49,50,51,52,53,54,60)',
      p && p.tag === STICHTAG && p.t === DI_BAR && p.momentum === 2050 && p.drift === 1030 && p.spy === 401 && p.spyT === DI_BAR && p.buchT === DI_BAR &&
      p.startM === 100000 && p.startD === 90000 && dp.mfVerlauf.length === 1, js(p));
    pruefe('tagespunkt: am selben Tag kein zweiter Punkt (D-45)', I.tagespunkt(MH, dp, dat, JETZT) === null && dp.mfVerlauf.length === 1);
    /* alter Punkt ohne tag: gilt fuer seinen New-Yorker Schreibtag (Dienstag) -> kein neuer Punkt. D-46 */
    var dq = punktD({ mfVerlauf: [{ t: DI_BAR + 3600000 }] });
    var dq2 = punktD({ mfVerlauf: [{ t: DI_BAR - TAG + 3600000 }] });      // Schreibtag Montag: Dienstag ist neu
    pruefe('tagespunkt: ein alter Punkt ohne tag gilt fuer den New-Yorker Tag seines Stempels - Dienstag ist dann nicht neu, nach einem Montagspunkt schon (D-46)',
      I.tagespunkt(MH, dq, dat, JETZT) === null && dq.mfVerlauf.length === 1 && !!I.tagespunkt(MH, dq2, dat, JETZT) && dq2.mfVerlauf.length === 2);
    var dq3 = punktD({ mfVerlauf: [{ t: ny(2026, 11, 23, 20, 0) }] });     // Montag 20:00 New York = Dienstag 01:00 UTC
    pruefe('tagespunkt: der Schreibtag eines alten Punkts ist der New-Yorker, nicht der UTC-Tag (D-192)', !!I.tagespunkt(MH, dq3, dat, JETZT) && dq3.mfVerlauf.length === 2);
    /* Sperre nach Umschichtung: D-47, D-48 */
    var d47a = punktD(); d47a.mfBuch.letzteAusfuehrungTag = HEUTE;
    var d47b = punktD(); d47b.mfBuch.letzteAusfuehrungTag = STICHTAG;
    var d47c = punktD(); d47c.mfBuch.letzteAusfuehrungTag = '2026-11-20';
    pruefe('tagespunkt: nach einer Umschichtung NACH X kein Punkt; am Tag X selbst und davor schon (D-47,48)',
      I.tagespunkt(MH, d47a, dat, JETZT) === null && !!I.tagespunkt(MH, d47b, dat, JETZT) && !!I.tagespunkt(MH, d47c, dat, JETZT));
    /* ohne Buecher: D-55, D-56, D-57 */
    var dn = { mfVerlauf: [] }, pn = I.tagespunkt(MH, dn, dat, JETZT);
    pruefe('tagespunkt ohne Buecher: momentum und drift null, startM 100000, startD null (D-55,56,57)',
      pn && pn.momentum === null && pn.drift === null && pn.startM === 100000 && pn.startD === null, js(pn));
    /* Kappung auf 750: D-58, D-59 */
    var alt = []; for (var i = 0; i < 750; i++) alt.push({ t: 1000 + i, tag: '2020-01-01', i: i });
    var dk = punktD({ mfVerlauf: alt });
    I.tagespunkt(MH, dk, dat, JETZT);
    pruefe('tagespunkt: der Verlauf haelt hoechstens 750 Punkte, der aelteste faellt heraus (D-58,59)',
      dk.mfVerlauf.length === 750 && dk.mfVerlauf[0].i === 1 && dk.mfVerlauf[749].tag === STICHTAG, js([dk.mfVerlauf.length, dk.mfVerlauf[0]]));
  }

  /* =====================================================================
   * Teil 4: eroeffnung, ausfuehrungVorbereiten, offenNachfassen
   * ===================================================================== */
  async function teilEroeffnung() {
    var MI_SPAET = ny(2026, 11, 25, 12, 0);                  // Mittwoch 12:00, nach JETZT (10:30)
    var w = welt({ tabelle: {
      A1: [{ t: DI_BAR, o: 90, c: 91 }, { t: MI_BAR, o: 100, c: 101 }, { t: MI_BAR + 60000, o: 200, c: 201 }],
      A2: [{ t: MI_SPAET, o: 300, c: 301 }],
      A3: [{ t: MI_BAR, o: 100, c: 101 }],
      A4: [{ t: DI_BAR, o: 90, c: 91 }],
      A5: [{ t: MI_BAR, o: null, c: 101 }]
    } }), I = w.win.__INT;
    /* D-64,66,67 */
    var e1 = await I.eroeffnung(MH, 'A1', HEUTE, JETZT);
    pruefe('eroeffnung: Eroeffnung des fruehesten Balkens vom Ausfuehrungstag, nicht Schluss, nicht gestern, Stempel = Balken (D-62,64,66,67)',
      e1 && e1.kurs === 100 && e1.t === MI_BAR, js(e1));
    /* Abrufparameter: D-68,69,70,71 */
    var o1 = w.log[0].opt;
    pruefe('eroeffnung: Abruf unbereinigt mit offenRoh, Tagesbalken, von = Mitternacht New York, bis = jetzt (D-68,69,70,71)',
      o1.bereinigt === false && o1.offenRoh === true && o1.interval === '1d' && o1.von === MH.nyZeit(HEUTE, 0, 0) && o1.bis === JETZT, js(o1));
    var e2 = await I.eroeffnung(MH, 'A2', HEUTE, JETZT);
    pruefe('eroeffnung: ein Balken nach der Uhr des Takts zaehlt nicht (D-70)', e2 === null, js(e2));
    /* D-61: Fensterende (direkter Aufruf mit Ausfuehrungstag Dienstag und Uhr Mittwoch) */
    var e3 = await I.eroeffnung(MH, 'A3', STICHTAG, JETZT);
    pruefe('eroeffnung: der Balken von MORGEN (nach Mitternacht New York) gehoert nicht zum Ausfuehrungstag (D-61)', e3 === null, js(e3));
    var e4 = await I.eroeffnung(MH, 'A4', HEUTE, JETZT);
    pruefe('eroeffnung: der Balken von GESTERN liefert keine Eroeffnung fuer heute (D-62)', e4 === null, js(e4));
    var e5 = await I.eroeffnung(MH, 'A5', HEUTE, JETZT);
    pruefe('eroeffnung: fehlt die Eroeffnung im Balken, ist das Ergebnis null - nie Schluss, nie ein Kurs null (D-63,65,69)', e5 === null, js(e5));
    pruefe('eroeffnung: unbekannter Wert (Abruf null) ergibt null', (await I.eroeffnung(MH, 'ZZZ', HEUTE, JETZT)) === null);
    w.win.Kurse.hole = async function () { throw new Error('Netz weg'); };
    var eT = 'nicht null';
    try { eT = await I.eroeffnung(MH, 'A1', HEUTE, JETZT); } catch (x) { eT = 'Ausnahme: ' + x.message; }
    pruefe('eroeffnung: scheitert der Abruf mit einer Ausnahme, ist das Ergebnis null - ein Wert bricht nicht die ganze Umschichtung ab (D-194)', eT === null, String(eT));
  }

  /* Welt fuer die Ausfuehrung: Dienstag-Bestand, Mittwoch-Eroeffnungen. */
  var OPENS = { T1: 100, T2: 100, T3: 100, T4: 100, T5: 100, X1: 100, SPY: 400 };
  function buchX1(extra) {
    return Object.assign({ name: 'momentum', start: 100000, cash: 0, positionen: [{ sym: 'X1', stueck: 1000, einstand: 90, seit: ny(2026, 8, 25, 9, 30) }], trades: [],
      angelegt: ny(2026, 8, 25, 9, 30), letztesRebalanceT: ny(2026, 8, 25, 9, 30), konfig: MH.buchKonfig(), konfigSeit: 1, liquideSeit: 12345, korbVerlauf: [] }, extra || {});
  }
  function schlussAendern(roh) { ['T1', 'T2', 'T3', 'T4', 'T5'].forEach(function (s) { roh[s].forEach(function (b) { b[1] = 200; b[3] = 200; }); }); roh.X1.forEach(function (b) { b[1] = 150; b[3] = 150; }); }
  async function datenVon(w, now) { return await w.win.__INT.ladeKurse(); }

  async function teilAusfuehrung() {
    var w = welt({ wedBar: true, opens: OPENS, buch: buchX1({ letzteAusfuehrungTag: '2026-08-25' }), rohAendern: schlussAendern, stand: STAND_OK }), I = w.win.__INT;
    var daten = await I.ladeKurse();
    var fl = MH.faelligkeit(daten.bezug, '2026-08-25', 63, JETZT);
    var a = await I.ausfuehrungVorbereiten(w.MHx, w.d, daten, fl, JETZT);
    pruefe('ausfuehrungVorbereiten: Handelstag, frischer Bestand -> ok mit Stichtag Dienstag und Ausfuehrungstag Mittwoch (D-86,87)',
      a.ok === true && a.stichtag === STICHTAG && a.heute === HEUTE, js([a.ok, a.hinweis, a.stichtag, a.heute]));
    pruefe('ausfuehrungVorbereiten: Eroeffnungen des Ausfuehrungstags fuer Ziel UND gehaltene Werte, Stempel = Balken (D-82,83,84,85)',
      a.ok && js(Object.keys(a.preise).sort()) === js(['T1', 'T2', 'T3', 'T4', 'T5', 'X1']) && Object.keys(a.preise).every(function (s) { return a.preise[s] === 100 && a.barZeit[s] === MI_BAR; }),
      js([a.preise, a.barZeit]));
    var pausen = (w.win.__timer || []).filter(function (ms) { return ms === 90; }).length;
    pruefe('ausfuehrungVorbereiten: nach jedem Abruf eines Werts eine Pause von 90 ms (Tempo wie der Lader; Yahoo drosselt) - sechs Werte, sechs Pausen (D-202)', pausen === 6, String(pausen));
    var sp = w.rec.stichtagPruefen[0].args;
    pruefe('ausfuehrungVorbereiten: Frische gegen den Ladestand des Bestands, am Ausfuehrungstag (D-75,76)', sp[2] === STAND_OK && sp[3] === HEUTE, js([sp[2], sp[3]]));
    var mz = w.rec.momentumZiel[w.rec.momentumZiel.length - 1];
    /* Hand: S0 hat einen Mittwochsbalken (301 Balken); die Rangfolge darf nur bis Dienstag rechnen (300) und mit der Uhr des Stichtags. */
    pruefe('ausfuehrungVorbereiten: Rangfolge auf den Schluessen bis zum Stichtag (ohne Balken von heute) und mit der Uhr des Stichtags (D-77,78)',
      mz.args[0].S0.length === 300 && mz.args[0].S0[299][0] === DI_BAR && mz.args[1].nowMs === DI_BAR, js([mz.args[0].S0.length, mz.args[1]]));
    /* kein SPY-Balken heute: kein Handelstag. D-80, D-81 */
    var w2 = welt({ wedBar: true, opens: { T1: 100, X1: 100 }, buch: buchX1(), stand: STAND_OK });
    var d2 = await w2.win.__INT.ladeKurse();
    var a2 = await w2.win.__INT.ausfuehrungVorbereiten(w2.MHx, w2.d, d2, MH.faelligkeit(d2.bezug, '2026-08-25', 63, JETZT), JETZT);
    pruefe('ausfuehrungVorbereiten: ohne SPY-Tagesbalken von heute kein Handel, Hinweis nennt den Tag (D-80,81)',
      a2.ok === false && a2.hinweis.indexOf('für SPY gibt es keinen Tagesbalken vom 25.11.2026') > 0, js(a2));
    /* Uhrzeit: D-72,73,74 */
    var spaet = [[ny(2026, 11, 25, 9, 20), false], [ny(2026, 11, 25, 9, 32), false], [ny(2026, 11, 25, 9, 34), false], [ny(2026, 11, 25, 9, 35), true]];
    var erg = [];
    for (var i = 0; i < spaet.length; i++) {
      var wt = welt({ wedBar: true, opens: OPENS, buch: buchX1(), now: spaet[i][0] }), dt = await wt.win.__INT.ladeKurse();
      var at = await wt.win.__INT.ausfuehrungVorbereiten(wt.MHx, wt.d, dt, MH.faelligkeit(dt.bezug, '2026-08-25', 63, spaet[i][0]), spaet[i][0]);
      erg.push(at.ok + (at.ok ? '' : ':' + at.hinweis));
    }
    pruefe('ausfuehrungVorbereiten: gehandelt wird erst ab 09:35 New York (09:20, 09:32, 09:34 nicht; 09:35 ja) (D-72,73,74)',
      erg[0] === 'false:Umschichtung heute nach Börsenöffnung' && erg[1] === 'false:Umschichtung heute nach Börsenöffnung' && erg[2] === 'false:Umschichtung heute nach Börsenöffnung' && erg[3] === 'true', erg.join(' | '));
    /* Abends in New York ist in UTC schon morgen: der Ausfuehrungstag bleibt der New-Yorker. D-191 */
    var AB = ny(2026, 11, 25, 21, 0);
    var wb = welt({ wedBar: true, opens: OPENS, buch: buchX1(), now: AB }), db = await wb.win.__INT.ladeKurse();
    var ab2 = await wb.win.__INT.ausfuehrungVorbereiten(wb.MHx, wb.d, db, MH.faelligkeit(db.bezug, '2026-08-25', 63, AB), AB);
    pruefe('ausfuehrungVorbereiten: um 21:00 New York (UTC schon morgen) ist der Ausfuehrungstag der New-Yorker (D-191)', ab2.ok === true && ab2.heute === HEUTE && ab2.stichtag === STICHTAG, js([ab2.ok, ab2.hinweis, ab2.heute]));
    /* Wochenende: D-89 */
    var NA = ny(2026, 11, 28, 10, 0);
    var wa = welt({ wedBar: true, opens: OPENS, buch: buchX1(), now: NA }), da = await wa.win.__INT.ladeKurse();
    var aa = await wa.win.__INT.ausfuehrungVorbereiten(wa.MHx, wa.d, da, MH.faelligkeit(da.bezug, '2026-08-25', 63, NA), NA);
    pruefe('ausfuehrungVorbereiten: am Samstag kein Handel, Hinweis "am naechsten Handelstag" (D-89)',
      aa.ok === false && aa.hinweis === 'Umschichtung fällig – am nächsten Handelstag nach Börsenöffnung (heute kein Handelstag).', js(aa));
    /* veraltet / ohne SPY: D-88 */
    var av = await I.ausfuehrungVorbereiten(w.MHx, w.d, daten, { veraltet: true, letzterMarktTag: '2026-11-18' }, JETZT);
    pruefe('ausfuehrungVorbereiten: veraltete Marktreihe -> kein Handel, Hinweis mit Datum (D-88)',
      av.ok === false && av.hinweis === 'Marktreihe veraltet seit 18.11.2026 – Nachladen angestoßen; nicht umgeschichtet.', js(av));
    var an0 = w.anstoesse.n;
    var ab = await I.ausfuehrungVorbereiten(w.MHx, w.d, Object.assign({}, daten, { bezug: null }), fl, JETZT);
    pruefe('ausfuehrungVorbereiten: ohne Marktreihe (SPY) kein Handel', ab.ok === false && ab.hinweis.indexOf('Marktreihe (SPY) fehlt im Bestand') === 0, js(ab));
    /* nicht frisch: D-75, D-135 */
    var ws = welt({ wedBar: true, opens: OPENS, buch: buchX1(), stand: ny(2026, 11, 23, 12, 0) }), ds = await ws.win.__INT.ladeKurse();
    var flS = MH.faelligkeit(ds.bezug, '2026-08-25', 63, JETZT);
    var as1 = await ws.win.__INT.ausfuehrungVorbereiten(ws.MHx, ws.d, ds, flS, JETZT);
    pruefe('ausfuehrungVorbereiten: Bestand vor dem Schluss geladen -> nicht frisch genug, Nachladen angestossen (D-75)',
      as1.ok === false && as1.hinweis.indexOf('Tageskurse nicht frisch genug') > 0 && ws.anstoesse.n === 1, js([as1, ws.anstoesse.n]));
    ws.win.__uhr.jetzt = JETZT + 30 * 60000;
    await ws.win.__INT.ausfuehrungVorbereiten(ws.MHx, ws.d, ds, flS, JETZT + 30 * 60000);
    var nach30 = ws.anstoesse.n;
    ws.win.__uhr.jetzt = JETZT + 61 * 60000;
    await ws.win.__INT.ausfuehrungVorbereiten(ws.MHx, ws.d, ds, flS, JETZT + 61 * 60000);
    pruefe('Nachladen wird hoechstens einmal je Stunde angestossen (D-135)', nach30 === 1 && ws.anstoesse.n === 2, nach30 + ' / ' + ws.anstoesse.n);
    /* zu wenig Werte: D-79 */
    var wz = welt({ wedBar: true, opens: OPENS, buch: buchX1(), zielAntwort: function () { return { zuWenig: true, ziel: [], korb: { zulaessig: 3, geprueft: 8, umsatzMin: 1e8, fenster: 20 }, uebersprungen: [] }; } });
    var dz = await wz.win.__INT.ladeKurse();
    var az = await wz.win.__INT.ausfuehrungVorbereiten(wz.MHx, wz.d, dz, MH.faelligkeit(dz.bezug, '2026-08-25', 63, JETZT), JETZT);
    pruefe('ausfuehrungVorbereiten: zu wenig zulaessige Werte -> Hinweis mit der Mindestzahl der Konfiguration (D-79)',
      az.ok === false && az.hinweis === 'Umschichtung fällig, aber am Stichtag 24.11.2026 unter 100 zulässigen Werten – kein Korb; neuer Versuch beim nächsten Takt.', js(az));
    void an0; void datenVon;
  }

  async function teilNachfassen() {
    var T = { V1: [{ t: MI_BAR, o: 50, c: 51 }], K1: [{ t: MI_BAR, o: 100, c: 101 }], K2: [{ t: MI_BAR, o: 100, c: 101 }] };
    function offBuch(cash, kaeufe, verk) {
      return { name: 'momentum', start: 100000, cash: cash, positionen: verk ? [{ sym: 'V1', stueck: 10, einstand: 40, seit: ny(2026, 8, 25, 9, 30) }] : [], trades: [],
        offen: { tag: HEUTE, verkaeufe: verk ? ['V1'] : [], kaeufe: kaeufe } };
    }
    var KA = [{ sym: 'K1', budget: 1000, rang: 1 }, { sym: 'K2', budget: 1000, rang: 2 }];
    /* N1: Verkauf V1 und beide Kaeufe. Hand (20 Bp):
     *  Verkauf 10 x 50 x 0,998 = 499 -> Bargeld 1500 + 499 = 1999.
     *  K1: 1000/100 = 10 Stueck, Kosten 10 x 100 x 1,002 = 1002 -> 997.
     *  K2: 10 Stueck kosten 1002 > 997 -> verkleinert auf floor(997 / 100,2 x 10000)/10000 = floor(99500,998)/10000 = 9,95 (Kosten 9,95 x 100,2 = 996,99) -> Rest 0,01. */
    var w = welt({ tabelle: T, buch: offBuch(1500, KA, true) }), I = w.win.__INT, b = w.d.mfBuch;
    var r = await I.offenNachfassen(w.MHx, w.d, JETZT, 0);
    pruefe('offenNachfassen: erst Verkauf, dann Kaeufe nach Rang zur Eroeffnung des Tages, Kosten 20 Bp, Rest wie von Hand (D-92,93,94)',
      r === true && nahe(b.cash, 0.01, 1e-6) && !posVon(b, 'V1') && posVon(b, 'K1') && posVon(b, 'K1').stueck === 10 && posVon(b, 'K2') && posVon(b, 'K2').stueck === 9.95 &&
      nahe(posVon(b, 'K1').einstand, 100.2, 1e-9) && b.offen === undefined && w.fehler.length === 0, js([r, b.cash, b.positionen, b.offen]));
    pruefe('offenNachfassen: Kaeufe tragen den Stempel des Balkens, zu dessen Eroeffnung gekauft wurde (D-96)', posVon(b, 'K1').kursT === MI_BAR && posVon(b, 'K2').kursT === MI_BAR, js(b.positionen));
    pruefe('offenNachfassen: eigene Journalzeile mfnach-<jetzt> (D-101)', !!zeileMit(w.d, 'mfnach-' + JETZT) && /Verkauf V1 zu 50,00 \$; Kauf K1 zu 100,00 \$ \(10 Stück\)/.test(zeileMit(w.d, 'mfnach-' + JETZT).txt), js(w.d.tuneLog));
    /* N2: Buch aus -> nichts, kein Abruf (D-91) */
    var w2 = welt({ tabelle: T, buch: offBuch(1500, KA, true), momentumAn: false });
    var r2 = await w2.win.__INT.offenNachfassen(w2.MHx, w2.d, JETZT, 0);
    pruefe('offenNachfassen: bei ausgeschaltetem Buch wird nichts nachgefasst und nichts abgerufen (D-91)',
      r2 === false && w2.d.mfBuch.cash === 1500 && w2.d.mfBuch.positionen.length === 1 && w2.log.length === 0 && !!w2.d.mfBuch.offen, js([r2, w2.log.length]));
    /* N3: nach 16:00 -> beenden, true (D-90) */
    var spaet = ny(2026, 11, 25, 16, 30);
    var w3 = welt({ tabelle: T, buch: offBuch(1500, KA, true), now: spaet });
    var r3 = await w3.win.__INT.offenNachfassen(w3.MHx, w3.d, spaet, 0);
    pruefe('offenNachfassen: nach 16:00 New York wird offen geloescht, die Zeile nennt die liegen gebliebenen, Rueckgabe true (D-90)',
      r3 === true && w3.d.mfBuch.offen === undefined && !!zeileMit(w3.d, 'mfoffen-ende-' + spaet) && w3.d.mfBuch.cash === 1500 && w3.log.length === 0, js([r3, w3.d.tuneLog]));
    /* N4: Regel K im Nachfassen: 99,9 % -> K2 (9,95 x 100 = 995 < 999) bleibt offen mit Merker bargeld. D-95, 97, 98, 100 */
    var w4 = welt({ tabelle: T, buch: offBuch(1500, KA, true) });
    var r4 = await w4.win.__INT.offenNachfassen(w4.MHx, w4.d, JETZT, 0.999);
    var o4 = w4.d.mfBuch.offen;
    pruefe('offenNachfassen: Regel K wird durchgereicht - der zu kleine Kauf K2 bleibt offen, mit Merker "bargeld" (D-95,97,98,100)',
      r4 === true && !posVon(w4.d.mfBuch, 'K2') && !!posVon(w4.d.mfBuch, 'K1') && o4 && o4.kaeufe.length === 1 && o4.kaeufe[0].sym === 'K2' && o4.kaeufe[0].bargeld === true, js([r4, o4]));
    /* N5: nur der Merker aendert sich -> trotzdem true (D-99) */
    var w5 = welt({ tabelle: T, buch: offBuch(100, [{ sym: 'K2', budget: 1000, rang: 1 }], false) });
    var r5 = await w5.win.__INT.offenNachfassen(w5.MHx, w5.d, JETZT, 0.5);
    pruefe('offenNachfassen: aendert sich nur der Merker (Eroeffnung da, Bargeld fehlt), wird trotzdem gespeichert: true (D-99)',
      r5 === true && w5.d.mfBuch.cash === 100 && w5.d.mfBuch.offen.kaeufe[0].bargeld === true && w5.d.tuneLog.length === 0, js([r5, w5.d.mfBuch.offen]));
    /* N6: ohne offen -> false */
    var w6 = welt({ tabelle: T, buch: { name: 'momentum', cash: 5, positionen: [], trades: [] } });
    pruefe('offenNachfassen: ohne offene Auftraege false', (await w6.win.__INT.offenNachfassen(w6.MHx, w6.d, JETZT, 0)) === false);
  }

  /* =====================================================================
   * Teil 5: der Umschichtungszweig in takt
   * ===================================================================== */
  function kPos(buch, tageW, k) {   // letzteAusfuehrungTag so, dass k Balken zwischen ihm und heute liegen
    buch.letzteAusfuehrungTag = MH.nyTag(tageW[tageW.length - 1 - k]);
    return buch;
  }
  async function teilTakt() {
    /* R1: Hauptfall. T1 wird schon gehalten (100 Stueck, Eroeffnung 100); X1 (1000 Stueck) ist kein Ziel.
     * Hand (20 Bp je Seite, Eroeffnungen alle 100):
     *  Wert zum Plan = 1000 x 100 + 100 x 100 = 110.000; Platzwert = 110.000 / 5 = 22.000; je Kauf 220 Stueck.
     *  Verkauf X1: 1000 x 100 x 0,998 = 99.800. Vier Kaeufe (T2..T5): je 220 x 100 x 1,002 = 22.044 -> 88.176.
     *  Rest: 99.800 - 88.176 = 11.624. */
    var w0 = welt({}), tageW = w0.tage;
    var buch = kPos(buchX1({ cash: 0, positionen: [{ sym: 'X1', stueck: 1000, einstand: 90, seit: ny(2026, 8, 25, 9, 30) }, { sym: 'T1', stueck: 100, einstand: 90, seit: ny(2026, 8, 25, 9, 30) }],
      korbVerlauf: (function () { var a = []; for (var i = 0; i < 120; i++) a.push({ t: i, zulaessig: 1, geprueft: 1, ziel: 1 }); return a; })() }), tageW, 62);
    var w = welt({ wedBar: true, opens: OPENS, buch: buch, rohAendern: schlussAendern, zielTakt: ['Z1', 'Z2', 'Z3', 'Z4', 'Z5'] });
    await w.win.MFDepot.takt();
    var b = w.d.mfBuch, rec = w.rec;
    pruefe('takt Umschichtung: laeuft ohne Fehler und wird gebucht (Grundlage)', w.fehler.length === 0 && !!zeileMit(w.d, 'mfrebal-'), js([w.fehler, w.d.tuneLog]));
    pruefe('takt Umschichtung: Kosten 20 Bp je Seite - Rest-Bargeld 11.624 $ (D-103,104)', nahe(b.cash, 11624, 1e-6), String(b.cash));
    pruefe('takt Umschichtung: Ziel sind die fuenf Werte des Stichtags, T1 gehalten, vier Kaeufe zu je 220 Stueck, X1 verkauft (D-109)',
      !posVon(b, 'X1') && posVon(b, 'T1').stueck === 100 && ['T2', 'T3', 'T4', 'T5'].every(function (s) { return posVon(b, s) && posVon(b, s).stueck === 220 && nahe(posVon(b, s).einstand, 100.2, 1e-9); }) &&
      b.positionen.length === 5, js(b.positionen));
    var pl = rec.planeUmschichtung, fa = rec.fuehreAus;
    pruefe('takt Umschichtung: geplant wird auf den Eroeffnungen des Ausfuehrungstags (nicht den Schlusskursen) und dem Ziel des Stichtags (D-108,109)',
      pl.length >= 2 && pl[1].args[2].T1 === 100 && pl[1].args[2].X1 === 100 && js(pl[1].args[0]) === js(['T1', 'T2', 'T3', 'T4', 'T5']) && pl[0].args[2].T1 === 200, js(pl.map(function (c) { return [c.args[0], c.args[2]]; })));
    pruefe('takt Umschichtung: Regel K (5 %) geht an beide Plaene und an die Ausfuehrung, Kosten 20 an fuehreAus (D-103,104,105,106,107)',
      pl.every(function (c) { return c.args[3] && c.args[3].kleinstAnteil === 0.05; }) && fa.length === 1 && fa[0].args[3] === 20 && fa[0].args[4] && fa[0].args[4].kleinstAnteil === 0.05,
      js([pl.map(function (c) { return c.args[3]; }), fa.map(function (c) { return [c.args[3], c.args[4]]; })]));
    var mz = rec.momentumZiel[0];
    pruefe('takt: die Anzeige-Rangfolge rechnet mit der Uhr des juengsten Balkens des Bestands (D-131)', mz.args[1].nowMs === MI_BAR, js(mz.args[1]));
    pruefe('takt Umschichtung: neue Positionen tragen den Stempel des Eroeffnungs-Balkens vom Ausfuehrungstag (D-111)',
      ['T2', 'T3', 'T4', 'T5'].every(function (s) { return posVon(b, s).kursT === MI_BAR; }), js(b.positionen.map(function (p) { return p.kursT; })));
    pruefe('takt Umschichtung: letztesRebalanceT = Uhr, Ausfuehrungstag = heute in New York (D-118,119,120)', b.letztesRebalanceT === JETZT && b.letzteAusfuehrungTag === HEUTE, js([b.letztesRebalanceT, b.letzteAusfuehrungTag]));
    pruefe('takt Umschichtung: der Beginn des Vorwaertstests bleibt, wenn er schon gesetzt ist (D-125)', b.liquideSeit === 12345, String(b.liquideSeit));
    var kv = b.korbVerlauf, lk = kv[kv.length - 1];
    /* Hand: kanned-Korb: zulaessig = 8 Werte, geprueft = 10; Ziel 5; 120 Eintraege + 1 -> 120. */
    pruefe('takt Umschichtung: Korbverlauf mit Zulaessig/Geprueft/Ziel, hoechstens 120 Eintraege (D-126,127,128)',
      lk.t === JETZT && lk.zulaessig === 8 && lk.geprueft === 10 && lk.ziel === 5 && kv.length === 120 && kv[0].t === 1, js([lk, kv.length, kv[0]]));
    pruefe('takt Umschichtung: Faelligkeit wird nach der Umschichtung neu gezaehlt (D-123)', rec.faelligkeit.length === 2 && rec.faelligkeit[1].args[1] === HEUTE && rec.faelligkeit[1].args[2] === 63, js(rec.faelligkeit.map(function (c) { return c.args.slice(1, 3); })));
    pruefe('takt Umschichtung: nach der Umschichtung steht die Karte nicht mehr auf "Rebalancing faellig" (D-124)', w.klappe.innerHTML.indexOf('Rebalancing fällig') < 0 && w.klappe.innerHTML.indexOf('Korb:') >= 0, w.klappe.innerHTML.slice(0, 200));
    var tx = zeileMit(w.d, 'mfrebal-').txt;
    pruefe('takt Umschichtung: Journal - 1 Verkauf, 4 Kaeufe, 5 Werte, Tage, Kosten 20 Bp (D-133,134)',
      tx.indexOf('Momentum-Depot umgeschichtet: 1 Verkäufe, 4 Käufe auf das stärkste Zehntel (5 Werte). Ausführungstag 25.11.2026, Rangfolge auf den Schlusskursen des Stichtags 24.11.2026, gehandelt zur Eröffnung. Kosten 20 Bp je Seite.') === 0 &&
      zeileMit(w.d, 'mfrebal-').applied[0] === 'Momentum-Rebalancing: 5 Orders' && zeileMit(w.d, 'mfrebal-').quelle === 'automatik', tx);

    /* Faelligkeitsrand: D-121, D-122. 62 Balken seit der letzten Ausfuehrung -> faellig; 61 -> noch nicht. */
    async function rand(k) {
      var wr = welt({ wedBar: true, opens: OPENS, buch: kPos(buchX1({}), tageW, k), rohAendern: schlussAendern });
      await wr.win.MFDepot.takt();
      return { gehandelt: !!zeileMit(wr.d, 'mfrebal-'), fehler: wr.fehler };
    }
    var r62 = await rand(62), r61 = await rand(61);
    pruefe('takt: faellig ist die Umschichtung bei 62 Balken seit der letzten Ausfuehrung (halten 63 - 1), bei 61 noch nicht (D-121,122)', r62.gehandelt === true && r61.gehandelt === false && r62.fehler.length === 0, js([r62, r61]));

    /* Regel K / ausgefallener Kauf: R2. Hand (20 Bp, Eroeffnungen T1..T4 100, T5 1e9, X1 100, KL 100):
     *  Wert = 1000 x 100 + 5 x 100 = 100.500; Platzwert 20.100; KL (500 $) < 5 % des Platzwerts (1.005) -> Kleinstbestand.
     *  Verkaeufe: 2; T1..T4: 201 Stueck; T5: Stueck = round(20.100 / 1e9 x 1e4)/1e4 = 0 -> ausgefallen. */
    var buch2 = kPos(buchX1({ positionen: [{ sym: 'X1', stueck: 1000, einstand: 90, seit: 1 }, { sym: 'KL', stueck: 5, einstand: 90, seit: 1 }] }), tageW, 62);
    var w2 = welt({ wedBar: true, opens: Object.assign({}, OPENS, { T5: 1e9, KL: 100 }), buch: buch2, rohAendern: schlussAendern });
    await w2.win.MFDepot.takt();
    var t2 = (zeileMit(w2.d, 'mfrebal-') || {}).txt || '';
    pruefe('takt Umschichtung: 2 Verkaeufe, 4 Kaeufe; 1 Kauf mangels Bargeld nicht ausgefuehrt; 1 Kleinstbestand aufgeloest (D-115,116)',
      t2.indexOf('2 Verkäufe, 4 Käufe auf') > 0 && t2.indexOf(' 1 Kauf mangels Bargeld nicht ausgeführt.') > 0 && t2.indexOf(' 1 Kleinstbestand aufgelöst.') > 0 && !posVon(w2.d.mfBuch, 'T5'), t2);

    /* R3: Knopf, T5 ohne Eroeffnung, Buch 70 Balken seit der letzten Ausfuehrung (verspaetet). D-112,113,114,117 */
    var opens3 = Object.assign({}, OPENS); delete opens3.T5;
    var wm = welt({ wedBar: true, opens: opens3, momentumAn: false, buch: kPos(buchX1({}), tageW, 70), rohAendern: schlussAendern });
    await wm.win.MFDepot.takt('momentum');
    var tm = (zeileMit(wm.d, 'mfrebal-') || {}).txt || '';
    pruefe('takt Knopf: handelt auch bei ausgeschaltetem Buch, ohne Verspaetungssatz, Ziel ohne Eroeffnung als "nicht handelbar" und OHNE offene Auftraege (D-112,117,114)',
      tm.length > 0 && tm.indexOf('verspätet') < 0 && tm.indexOf('Ohne Eröffnungskurs nicht handelbar (Ziel nicht gekauft, Position bis zur nächsten Umschichtung gehalten): T5') > 0 &&
      wm.d.mfBuch.offen === undefined && wm.fehler.length === 0, tm + ' | ' + js(wm.d.mfBuch.offen));
    var wa = welt({ wedBar: true, opens: opens3, buch: kPos(buchX1({}), tageW, 70), rohAendern: schlussAendern });
    await wa.win.MFDepot.takt();
    var ta = (zeileMit(wa.d, 'mfrebal-') || {}).txt || '';
    pruefe('takt Automatik: 8 Handelstage verspaetet im Text, T5 ohne Eroeffnung bleibt als offener Auftrag (kein Eintrag "nicht handelbar"), Auftrag gemerkt (D-113,114,117)',
      ta.indexOf(' – 8 Handelstage verspätet (die App lief am fälligen Tag nicht nach Börsenöffnung)') > 0 && ta.indexOf('Ohne Eröffnungskurs nicht handelbar') < 0 && ta.indexOf('noch ohne Eröffnung, offen') > 0 &&
      wa.d.mfBuch.offen && wa.d.mfBuch.offen.tag === HEUTE && wa.d.mfBuch.offen.kaeufe.length === 1 && wa.d.mfBuch.offen.kaeufe[0].sym === 'T5', ta + ' | ' + js(wa.d.mfBuch.offen));

    /* R4: Automatik aus, faellig: nichts. D-102 */
    var wo = welt({ wedBar: true, opens: OPENS, momentumAn: false, buch: kPos(buchX1({}), tageW, 62), rohAendern: schlussAendern });
    await wo.win.MFDepot.takt();
    pruefe('takt: bei ausgeschaltetem Buch wird auch eine faellige Umschichtung nicht gehandelt (D-102)', !zeileMit(wo.d, 'mfrebal-') && wo.d.mfBuch.cash === 0 && wo.d.mfBuch.positionen.length === 1 && wo.fehler.length === 0, js(wo.d.mfBuch.positionen));

    /* R5: offene Auftraege im Takt nachfassen: Kosten 20, Regel K 5 % (D-110) */
    var buch5 = kPos(buchX1({ cash: 50000, positionen: [], offen: { tag: HEUTE, verkaeufe: [], kaeufe: [{ sym: 'T1', budget: 1000, rang: 1 }] } }), tageW, 5);
    var w5 = welt({ wedBar: true, opens: OPENS, buch: buch5, rohAendern: schlussAendern });
    await w5.win.MFDepot.takt();
    var nf = w5.rec.nachfassen;
    pruefe('takt: das Nachfassen offener Auftraege rechnet 20 Bp und gibt Regel K (5 %) weiter (D-110)', nf && nf.length === 1 && nf[0].args[4] === 20 && nf[0].args[5] && nf[0].args[5].kleinstAnteil === 0.05 && !!posVon(w5.d.mfBuch, 'T1'), js(nf && nf[0].args.slice(4)));

    /* R0: Buch von vor Nr. 93 ohne Ausfuehrungstag: er folgt aus letztesRebalanceT (New York); ein vorhandener bleibt (D-129,130) */
    var tLetzt = ny(2026, 11, 17, 20, 0);          // 20:00 New York = 01:00 UTC am Folgetag
    var wAlt = welt({ momentumAn: false, buch: buchX1({ letztesRebalanceT: tLetzt }), verlauf: [{ t: DI_BAR, tag: STICHTAG }] });
    await wAlt.win.MFDepot.takt();
    var wNeu = welt({ momentumAn: false, buch: buchX1({ letztesRebalanceT: tLetzt, letzteAusfuehrungTag: '2026-11-20' }), verlauf: [{ t: DI_BAR, tag: STICHTAG }] });
    await wNeu.win.MFDepot.takt();
    pruefe('takt: fehlt der Ausfuehrungstag, wird er aus letztesRebalanceT gebildet (New York) und der Zeitstempel bleibt; ein vorhandener Tag bleibt unberuehrt (D-129,130,193)',
      wAlt.d.mfBuch.letzteAusfuehrungTag === '2026-11-17' && wAlt.d.mfBuch.letztesRebalanceT === tLetzt && wNeu.d.mfBuch.letzteAusfuehrungTag === '2026-11-20', wAlt.d.mfBuch.letzteAusfuehrungTag + ' / ' + wNeu.d.mfBuch.letzteAusfuehrungTag);

    /* R6: Nachladen bei Umsatz-Stuecken: genau die Haelfte ohne Stueckzahlen genuegt (D-132) */
    function korbAntwort(oU, gp) { return function () { return { ziel: ['T1'], korb: { zulaessig: 1, geprueft: gp, ohneUmsatz: oU, umsatzMin: 1e8, fenster: 20 }, uebersprungen: [], verworfen: [], rangfolge: [] }; }; }
    var w6a = welt({ buch: kPos(buchX1({}), tageW, 5), zielAntwort: korbAntwort(1, 2), verlauf: [{ t: DI_BAR, tag: STICHTAG }] });
    await w6a.win.MFDepot.takt();
    var w6b = welt({ buch: kPos(buchX1({}), tageW, 5), zielAntwort: korbAntwort(1, 3), verlauf: [{ t: DI_BAR, tag: STICHTAG }] });
    await w6b.win.MFDepot.takt();
    pruefe('takt: sind mindestens die Haelfte der Werte ohne Stueckzahlen (1 von 2), wird nachgeladen; bei 1 von 3 nicht (D-132,137)', w6a.anstoesse.n === 1 && w6b.anstoesse.n === 0, w6a.anstoesse.n + '/' + w6b.anstoesse.n);

    /* R7: Frische (D-136,137) */
    var w7 = welt({ buch: kPos(buchX1({}), tageW, 5), stand: ny(2026, 11, 23, 12, 0), verlauf: [{ t: DI_BAR, tag: STICHTAG }] });
    await w7.win.MFDepot.takt();
    pruefe('takt: ein vor dem letzten Schluss geladener Bestand stoesst das Nachladen an, ein frischer nicht (D-136,137)', w7.anstoesse.n === 1 && w6b.anstoesse.n === 0, w7.anstoesse.n + '/' + w6b.anstoesse.n);
  }

  async function teilLaden() {
    /* ladeKurse: D-138..D-143. S0 hat einen Mittwochsbalken (Schluss 222), Dienstag 111. */
    var w = welt({ wedBar: true, stand: 0, rohAendern: function (roh) { roh.S0[roh.S0.length - 1][1] = 222; roh.S0[roh.S0.length - 2][1] = 111; } }), I = w.win.__INT;
    var g = await I.ladeKurse();
    pruefe('ladeKurse: Kurs und Stempel sind die des LETZTEN Balkens, juengster = groesster Stempel (D-138,139,140)',
      g.preise.S0 === 222 && g.barZeit.S0 === MI_BAR && g.preise.T1 === 150 && g.barZeit.T1 === DI_BAR && g.juengster === MI_BAR, js([g.preise.S0, g.barZeit.S0, g.juengster]));
    pruefe('ladeKurse: ohne Ladezeit im Bestand steht stand auf 0 (D-143)', g.stand === 0, String(g.stand));
    pruefe('ladeKurse: vierte Spalte vorhanden -> spalte4 wahr, Bezugsreihe aus demselben Bestand', g.spalte4 === true && g.bezug && g.bezug.length === 300, js([g.spalte4, g.bezug && g.bezug.length]));
    var w2 = welt({ stand: STAND_OK, rohAendern: function (roh) { Object.keys(roh).forEach(function (s) { roh[s] = roh[s].map(function (b) { return [b[0], b[1], b[2]]; }); }); } });
    var g2 = await w2.win.__INT.ladeKurse();
    pruefe('ladeKurse: Bestand mit nur drei Spalten (von vor Nr. 93) ist spalte4 = false (D-141)', g2.spalte4 === false, String(g2.spalte4));
    w2.win.MF.tagesdatenLesen = async function () { return { roh: { A: [[1, 2, 3, 4]] }, at: 5, bezug: { reihe: [] } }; };
    var g3 = await w2.win.__INT.ladeKurse();
    pruefe('ladeKurse: eine leere Bezugsreihe ist keine Bezugsreihe (null) (D-142)', g3.bezug === null && g3.stand === 5, js(g3.bezug));
  }

  teilKurse();
  teilBuchKonfig().then(teilBuchungen).then(teilEroeffnung).then(teilAusfuehrung).then(teilNachfassen).then(teilTakt).then(teilLaden)
    .catch(function (e) { pruefe('Testlauf ohne Ausnahme', false, (e && e.stack) || e); });
})();
