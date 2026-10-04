'use strict';
/* Tests der Regel R2 (Antonacci GEM, REGEL.md §4.2, §4.4, §7.2 N2/N5; Siegel 6f9d06f).
 *
 *   node studien/trendfilter-messung-2026-10/test-R2.js        (aus der Repo-Wurzel; Ausgabe „N gruen, M rot", Rueckgabe 1 bei rot)
 *
 * Teil 1-8: Kunstdaten ueber K.baueDaten mit VON HAND gerechneten Sollwerten (Rechenweg in den Kommentaren).
 *   Kunstkalender = alle Werktage Mo-Fr (Feiertage spielen keine Rolle). Monatsende = letzter Werktag des Monats.
 *   „Stufenreihe": Schluss (= Eroeffnung) an jedem Tag eines Monats gleich der Stufe dieses Monats. Damit ist der
 *   Gesamtertragsindex an einem Monatsende ohne Ausschuettung = Stufe(M) / Stufe(erste Zeile), und
 *   r_X = Stufe_X(M) / Stufe_X(M-12) - 1.
 * Teil 9: kein Blick voraus (Stoerung aller Daten nach einem Monatsende, Abschneiden, Gegenprobe mit einer spaehenden Regel).
 * Teil 10: ECHTE Daten (daten/*.json), zweiter eigener Weg (eigener TR-Index direkt aus laden.lies, eigene Monatsenden,
 *   eigene Entscheidung) gegen regel-R2.js fuer jedes berechenbare Monatsende und jeden Kalendertag, Hauptlesart, Ersatz, N5.
 *   NUR Signal - keine Buchwerte, keine Ertraege auf echten Daten. */
var fs = require('fs');
var path = require('path');
var K = require('./kern.js');
var L = require('./laden.js');
var R2 = require('./regel-R2.js');

var gruen = 0, rot = 0;
function pruefe(name, ok, info) {
  if (ok) gruen++;
  else { rot++; console.log('ROT  ' + name + (info !== undefined ? '  ->  ' + (typeof info === 'string' ? info : JSON.stringify(info)) : '')); }
}
function nahe(a, b, tol) { return typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= (tol == null ? 1e-12 : tol); }

var HAUPT = Object.assign({}, K.HAUPT);
var N5 = Object.assign({}, K.HAUPT, { absolutAufGewinner: true });
var ERSATZ = Object.assign({}, K.ERSATZ);

/* ---------------- Kunstdaten-Werkzeuge ---------------- */
function werktage(von, bis, ohneMonate) {
  var aus = [];
  for (var t = K.utc(von); t <= K.utc(bis); t += 86400000) {
    var d = new Date(t);
    var wt = d.getUTCDay();
    if (wt === 0 || wt === 6) continue;
    var tag = d.toISOString().slice(0, 10);
    if (ohneMonate && ohneMonate.indexOf(tag.slice(0, 7)) >= 0) continue;
    aus.push(tag);
  }
  return aus;
}
/** Stufenreihe: Kurs je Monat aus stufen['JJJJ-MM'], sonst vorgabe; Zeilen erst ab dem Tag `ab` (Reihenbeginn). */
function stufenReihe(kal, stufen, vorgabe, ab, div) {
  var zeilen = [];
  kal.forEach(function (t) {
    if (ab && t < ab) return;
    var p = stufen[t.slice(0, 7)] != null ? stufen[t.slice(0, 7)] : vorgabe;
    zeilen.push({ tag: t, o: p, c: p });
  });
  return { zeilen: zeilen, div: div || [] };
}
function flach(kal, p) { return stufenReihe(kal, {}, p); }
/** Soll-Ziel-Feld aus Abschnitten [[abTag, ziel], ...]: ziel gilt ab abTag (einschliesslich) bis zum naechsten Abschnitt. */
function sollFeld(D, abschnitte) {
  var aus = new Array(D.n).fill(null);
  for (var i = 0; i < D.n; i++) {
    for (var a = 0; a < abschnitte.length; a++) if (D.tage[i] >= abschnitte[a][0]) aus[i] = abschnitte[a][1];
  }
  return aus;
}
function ersteAbweichung(ist, soll, D) {
  for (var i = 0; i < soll.length; i++) if (ist[i] !== soll[i]) return D.tage[i] + ': ist ' + ist[i] + ', soll ' + soll[i];
  return ist.length === soll.length ? null : 'Laenge ' + ist.length + ' statt ' + soll.length;
}
function det(D, opt, tag) {
  var l = R2.details(D, opt);
  for (var i = 0; i < l.length; i++) if (l[i].tag === tag) return l[i];
  return null;
}

/* =====================================================================================================================
 * Teil 1: die vier Ausgaenge (Datensatz A)
 * Kalender Werktage 01.01.2020-15.07.2021. Monatsenden 2021: Fr 29.01., Fr 26.02., Mi 31.03., Fr 30.04., Mo 31.05., Mi 30.06.
 * (15.07.2021 ist kein Monatsende, L5). M-12 dazu: Fr 31.01.2020, Fr 28.02.2020, Di 31.03.2020, Do 30.04.2020, Fr 29.05.2020,
 * Di 30.06.2020. Alle Reihen stehen 2020 auf 100, AGG immer auf 100. Stufen 2021 (SPY / BIL / ACWX):
 *   Jan 120 / 101 / 110  -> r = .20 / .01 / .10   r_SPY > r_Geld, r_SPY >= r_Intl            -> SPY    (N5: Gewinner SPY .20 > .01 -> SPY)
 *   Feb 110 / 101 / 125  -> r = .10 / .01 / .25   r_SPY > r_Geld, r_Intl > r_SPY             -> ACWX   (N5: Gewinner ACWX .25 > .01 -> ACWX)
 *   Mar  95 / 101 /  90  -> r = -.05 / .01 / -.10 r_SPY <= r_Geld, beide Aktien unter Geld  -> AGG    (N5: Gewinner SPY -.05 <= .01 -> AGG)
 *   Apr 100.5/101 / 130  -> r = .005 / .01 / .30  r_SPY <= r_Geld, Nicht-US vorn            -> AGG    (N5: Gewinner ACWX .30 > .01 -> ACWX)  <- Haupt/N5 verschieden
 *   Mai 104 / 101 / 102  -> r = .04 / .01 / .02                                              -> SPY    (N5 SPY)
 *   Jun 130 / 101 / 120  -> r = .30 / .01 / .20                                              -> SPY    (N5 SPY)
 *   Jul 130 / 101 / 120  (kein Monatsende mehr)
 * Monatsenden 2020: M-12 laege 2019 und fehlt im Kalender -> null. Ziel-Feld (Ausfuehrung am Tag NACH dem Monatsende):
 *   bis 29.01.2021 null; 01.02.-26.02. SPY; 01.03.-31.03. ACWX; 01.04.-30.04. AGG; 03.05.-31.05. AGG (N5: ACWX);
 *   01.06.-30.06. SPY; 01.07.-15.07. SPY.
 * ===================================================================================================================== */
var kalA = werktage('2020-01-01', '2021-07-15');
var rohA = {
  SPY: stufenReihe(kalA, { '2021-01': 120, '2021-02': 110, '2021-03': 95, '2021-04': 100.5, '2021-05': 104, '2021-06': 130, '2021-07': 130 }, 100),
  BIL: stufenReihe(kalA, { '2021-01': 101, '2021-02': 101, '2021-03': 101, '2021-04': 101, '2021-05': 101, '2021-06': 101, '2021-07': 101 }, 100),
  ACWX: stufenReihe(kalA, { '2021-01': 110, '2021-02': 125, '2021-03': 90, '2021-04': 130, '2021-05': 102, '2021-06': 120, '2021-07': 120 }, 100),
  AGG: flach(kalA, 100)
};
var DA = K.baueDaten(rohA, '2021-07-15');
(function teil1() {
  var soll = [
    ['2021-01-29', 0.20, 0.01, 0.10, 'SPY', 'SPY'],
    ['2021-02-26', 0.10, 0.01, 0.25, 'ACWX', 'ACWX'],
    ['2021-03-31', -0.05, 0.01, -0.10, 'AGG', 'AGG'],
    ['2021-04-30', 0.005, 0.01, 0.30, 'AGG', 'ACWX'],
    ['2021-05-31', 0.04, 0.01, 0.02, 'SPY', 'SPY'],
    ['2021-06-30', 0.30, 0.01, 0.20, 'SPY', 'SPY']
  ];
  soll.forEach(function (s) {
    var h = det(DA, HAUPT, s[0]), n = det(DA, N5, s[0]);
    pruefe('A ' + s[0] + ' Monatsende vorhanden', !!h && !!n);
    if (!h || !n) return;
    pruefe('A ' + s[0] + ' r_SPY = ' + s[1], nahe(h.rSpy, s[1]), h.rSpy);
    pruefe('A ' + s[0] + ' r_Geld = ' + s[2], nahe(h.rGeld, s[2]), h.rGeld);
    pruefe('A ' + s[0] + ' r_Intl = ' + s[3], nahe(h.rIntl, s[3]), h.rIntl);
    pruefe('A ' + s[0] + ' Haupt -> ' + s[4], h.ziel === s[4], h.ziel);
    pruefe('A ' + s[0] + ' N5 -> ' + s[5], n.ziel === s[5], n.ziel);
  });
  /* alle Monatsenden 2020: M-12 fehlt -> null, Renditen null */
  var d2020 = R2.details(DA, HAUPT).filter(function (x) { return x.tag < '2021-01-01'; });
  pruefe('A 2020: zwoelf Monatsenden, alle null', d2020.length === 12 && d2020.every(function (x) { return x.ziel === null && x.rSpy === null; }), d2020.length);
  pruefe('A details: ein Eintrag je Monatsende (12 + 6 = 18)', R2.details(DA, HAUPT).length === 18, R2.details(DA, HAUPT).length);
  var zH = R2.signal(DA, HAUPT), zN = R2.signal(DA, N5);
  pruefe('A Laenge des Ziel-Felds = D.n', zH.length === DA.n && zN.length === DA.n);
  var sollH = sollFeld(DA, [['2021-02-01', 'SPY'], ['2021-03-01', 'ACWX'], ['2021-04-01', 'AGG'], ['2021-05-03', 'AGG'], ['2021-06-01', 'SPY'], ['2021-07-01', 'SPY']]);
  var sollN = sollFeld(DA, [['2021-02-01', 'SPY'], ['2021-03-01', 'ACWX'], ['2021-04-01', 'AGG'], ['2021-05-03', 'ACWX'], ['2021-06-01', 'SPY'], ['2021-07-01', 'SPY']]);
  pruefe('A Ziel-Feld Haupt Tag fuer Tag', ersteAbweichung(zH, sollH, DA) === null, ersteAbweichung(zH, sollH, DA));
  pruefe('A Ziel-Feld N5 Tag fuer Tag', ersteAbweichung(zN, sollN, DA) === null, ersteAbweichung(zN, sollN, DA));
  /* Haupt und N5 unterscheiden sich NUR im Mai (Entscheid 30.04.: r_SPY <= r_Geld < r_Intl) */
  var verschieden = [];
  for (var i = 0; i < DA.n; i++) if (zH[i] !== zN[i]) verschieden.push(DA.tage[i]);
  pruefe('A Haupt/N5 nur 03.05.-31.05.2021 verschieden (21 Tage)', verschieden.length === 21 && verschieden[0] === '2021-05-03' && verschieden[20] === '2021-05-31', verschieden.length + ' ' + verschieden[0] + '..' + verschieden[verschieden.length - 1]);
  /* Optionen werden nicht veraendert; fehlende Optionen werfen */
  pruefe('A Optionen unveraendert', JSON.stringify(HAUPT) === JSON.stringify(K.HAUPT));
  var warf = false;
  try { R2.signal(DA, { geld: 'BIL' }); } catch (e) { warf = true; }
  pruefe('A unvollstaendige Optionen werfen', warf);
  pruefe('A Modulkopf name/titel/art', R2.name === 'R2' && R2.titel === 'Antonacci GEM' && R2.art === 'monatlich' && typeof R2.signal === 'function' && typeof R2.details === 'function');
})();

/* =====================================================================================================================
 * Teil 2: Ausfuehrung erst am Tag NACH dem Monatsende, Starttag mitten im Monat (§4.2, §4.4; Datensatz A, Hauptlesart)
 * Monatsende Fr 26.02.2021 entscheidet ACWX; am 26.02. selbst gilt noch der Januar-Entscheid SPY, ab Mo 01.03. ACWX.
 * Monatsende Mi 31.03.2021 entscheidet AGG; am 31.03. gilt ACWX, ab Do 01.04. AGG.
 * Buch auf Kunstdaten (erlaubt): Start Mi 17.03.2021 (mitten im Monat) -> es gilt das letzte Monatsende davor (26.02.) = ACWX.
 *   ACWX steht im Maerz auf 90: Stueck = 100.000 / (90 x 1,002) = 1.108,89332446218; Wert zum Schluss = Stueck x 90
 *   = 100.000 / 1,002 = 99.800,3992015968. Wechsel: Do 01.04. ACWX -> AGG, Di 01.06. AGG -> SPY (Mai bleibt AGG) = 2 Wechsel.
 * Start Fr 26.02.2021 (Monatsende selbst) -> Erstkauf SPY (Januar-Entscheid), erster Wechsel Mo 01.03. SPY -> ACWX.
 * Start Mo 01.03.2021 (erster Tag nach Monatsende) -> Erstkauf ACWX, kein Wechsel an diesem Tag.
 * ===================================================================================================================== */
(function teil2() {
  var z = R2.signal(DA, HAUPT);
  var m1 = DA.idx['2021-02-26'], m2 = DA.idx['2021-03-31'];
  pruefe('Ausfuehrung: am Monatsende 26.02. noch SPY', z[m1] === 'SPY', z[m1]);
  pruefe('Ausfuehrung: Folgetag ' + DA.tage[m1 + 1] + ' ACWX', DA.tage[m1 + 1] === '2021-03-01' && z[m1 + 1] === 'ACWX', z[m1 + 1]);
  pruefe('Ausfuehrung: am Monatsende 31.03. noch ACWX', z[m2] === 'ACWX', z[m2]);
  pruefe('Ausfuehrung: Folgetag 01.04. AGG', DA.tage[m2 + 1] === '2021-04-01' && z[m2 + 1] === 'AGG', z[m2 + 1]);
  pruefe('Ausfuehrung: erster Entscheid 29.01. gilt erst ab 01.02. (29.01. noch null)', z[DA.idx['2021-01-29']] === null && z[DA.idx['2021-02-01']] === 'SPY');

  var e = DA.n - 1;
  var s = DA.idx['2021-03-17'];
  pruefe('Starttag 17.03.: Ziel = Entscheid vom 26.02. (ACWX)', z[s] === 'ACWX', z[s]);
  var l = K.simuliere(DA, z, s, e, {});
  pruefe('Starttag 17.03.: Erstkauf ACWX am 17.03.', l.erstkauf && l.erstkauf.reihe === 'ACWX' && l.erstkauf.tag === '2021-03-17', l.erstkauf);
  pruefe('Starttag 17.03.: Wert zum Schluss = 100.000 / 1,002', nahe(l.werte[0], 100000 / 1.002, 1e-8) && nahe(l.werte[0], 99800.3992015968, 1e-8), l.werte[0]);
  var wl = l.wechsel.map(function (w) { return w.tag + ' ' + w.von + '>' + w.nach; }).join(', ');
  pruefe('Starttag 17.03.: Wechsel 01.04. ACWX>AGG, 01.06. AGG>SPY', wl === '2021-04-01 ACWX>AGG, 2021-06-01 AGG>SPY', wl);
  var zaehl = R2.wechselImFenster(DA, z, s, e);
  pruefe('Signalzaehlung im Fenster = Wechsel des Buchs (2)', zaehl.length === 2 && zaehl.length === l.wechsel.length, zaehl.length);

  var s2 = DA.idx['2021-02-26'];
  var l2 = K.simuliere(DA, z, s2, e, {});
  pruefe('Start am Monatsende 26.02.: Erstkauf SPY, erster Wechsel 01.03. SPY>ACWX',
    l2.erstkauf.reihe === 'SPY' && l2.wechsel[0].tag === '2021-03-01' && l2.wechsel[0].von === 'SPY' && l2.wechsel[0].nach === 'ACWX', [l2.erstkauf, l2.wechsel[0]]);
  var s3 = DA.idx['2021-03-01'];
  var l3 = K.simuliere(DA, z, s3, e, {});
  pruefe('Start 01.03. (Tag nach Monatsende): Erstkauf ACWX, kein Wechsel am 01.03.', l3.erstkauf.reihe === 'ACWX' && l3.wechsel[0].tag === '2021-04-01', [l3.erstkauf, l3.wechsel[0]]);
})();

/* =====================================================================================================================
 * Teil 3: Gleichstaende (Datensatz T). Kalender Werktage 01.01.2020-15.03.2021. Stufen so gewaehlt, dass die Quotienten im
 * Gleitkomma EXAKT sind (Bruch mit Zweierpotenz-Nenner):
 *   SPY 2020: 100, ab Jan 2021: 125         -> TR = 125/100 = 1,25 exakt;  r_SPY(Jan) = r_SPY(Feb) = 0,25 exakt
 *   BIL 2020: 80, Jan 2021: 100, Feb: 90    -> TR(Jan) = 100/80 = 1,25 exakt; r_Geld(Jan) = 0,25 = r_SPY  (Gleichstand)
 *                                              TR(Feb) = 1,25 x 90/100 = 1,125;  r_Geld(Feb) = 0,125
 *   ACWX 2020 und Jan 2021: 100, ab Feb: 125 -> r_Intl(Jan) = 0;  TR(Feb) = 125/100 = 1,25 exakt; r_Intl(Feb) = 0,25 = r_SPY
 * Jan (29.01.2021): r_SPY = r_Geld = 0,25 -> NICHT strikt groesser -> AGG.  N5: Gewinner SPY (0,25 >= 0), 0,25 > 0,25 nein -> AGG.
 * Feb (26.02.2021): r_SPY = r_Intl = 0,25 > r_Geld = 0,125 -> bei Gleichstand SPY (>=).  N5: Gewinner SPY, 0,25 > 0,125 -> SPY.
 * ===================================================================================================================== */
(function teil3() {
  var kal = werktage('2020-01-01', '2021-03-15');
  var roh = {
    SPY: stufenReihe(kal, { '2021-01': 125, '2021-02': 125, '2021-03': 125 }, 100),
    BIL: stufenReihe(kal, { '2021-01': 100, '2021-02': 90, '2021-03': 90 }, 80),
    ACWX: stufenReihe(kal, { '2021-02': 125, '2021-03': 125 }, 100),
    AGG: flach(kal, 100)
  };
  var D = K.baueDaten(roh, '2021-03-15');
  var j = det(D, HAUPT, '2021-01-29'), f = det(D, HAUPT, '2021-02-26');
  pruefe('Gleichstand Vorbedingung: r_SPY === r_Geld === 0,25 bitgleich (Jan)', j.rSpy === 0.25 && j.rGeld === 0.25, [j.rSpy, j.rGeld]);
  pruefe('Gleichstand r_SPY = r_Geld -> AGG (Haupt)', j.ziel === 'AGG', j.ziel);
  pruefe('Gleichstand r_SPY = r_Geld -> AGG (N5)', det(D, N5, '2021-01-29').ziel === 'AGG');
  pruefe('Gleichstand Vorbedingung: r_SPY === r_Intl === 0,25 bitgleich, r_Geld = 0,125 (Feb)', f.rSpy === 0.25 && f.rIntl === 0.25 && nahe(f.rGeld, 0.125), [f.rSpy, f.rIntl, f.rGeld]);
  pruefe('Gleichstand r_SPY = r_Intl -> SPY (Haupt)', f.ziel === 'SPY', f.ziel);
  pruefe('Gleichstand r_SPY = r_Intl -> SPY (N5)', det(D, N5, '2021-02-26').ziel === 'SPY');
})();

/* =====================================================================================================================
 * Teil 4: Ausschuettungen wirken ueber den Gesamtertrag (Datensatz Div). Kalender Werktage 01.01.2020-15.03.2021.
 *   SPY: Schluss 100 bis Fr 12.06.2020, ab Ex-Tag Mo 15.06.2020 Schluss 96, Ausschuettung 5 am 15.06.2020
 *        TR(15.06.) = 1 x (96 + 5) / 100 = 1,01; danach konstant.  r_SPY(29.01.2021) = 1,01 / 1 - 1 = 0,01
 *        (reiner Kurs: 96/100 - 1 = -0,04!).  Zweite Ausschuettung 20 am Mo 01.02.2021 (NACH dem Monatsende 29.01.):
 *        r_SPY(29.01.) bleibt 0,01; r_SPY(26.02.2021) = 1,01 x (96 + 20) / 96 - 1 = 1,01 x 116/96 - 1 = 0,220416666...
 *   BIL: Schluss immer 100, Ausschuettung 0,5 am Di 01.12.2020 -> TR = 100,5/100 = 1,005; r_Geld(Jan) = 0,005 (Kurs: 0).
 *   ACWX: Schluss immer 100, Ausschuettung 0,3 mit Ex-Tag Sa 15.08.2020 (kein Handelstag) -> gebucht Mo 17.08.2020 (§2.5);
 *        TR = 100,3/100 = 1,003; r_Intl(Jan) = 0,003.
 * Entscheid 29.01.2021: 0,01 > 0,005 und 0,01 >= 0,003 -> SPY.  Nur mit Kursen waere r_SPY = -0,04 < 0 = r_Geld -> AGG.
 * ===================================================================================================================== */
(function teil4() {
  var kal = werktage('2020-01-01', '2021-03-15');
  function bau(mitFeb) {
    var spy = kal.map(function (t) { var p = t < '2020-06-15' ? 100 : 96; return { tag: t, o: p, c: p }; });
    var spyDiv = [{ tag: '2020-06-15', betrag: 5 }];
    if (mitFeb) spyDiv.push({ tag: '2021-02-01', betrag: 20 });
    return {
      SPY: { zeilen: spy, div: spyDiv },
      BIL: stufenReihe(kal, {}, 100, null, [{ tag: '2020-12-01', betrag: 0.5 }]),
      ACWX: stufenReihe(kal, {}, 100, null, [{ tag: '2020-08-15', betrag: 0.3 }]),
      AGG: flach(kal, 100)
    };
  }
  var D = K.baueDaten(bau(true), '2021-03-15');
  var j = det(D, HAUPT, '2021-01-29'), f = det(D, HAUPT, '2021-02-26');
  pruefe('Ausschuettung: r_SPY(Jan) = 0,01 ueber TR (Kurs allein -0,04)', nahe(j.rSpy, 0.01), j.rSpy);
  pruefe('Ausschuettung: r_Geld(Jan) = 0,005 nur aus Ausschuettung', nahe(j.rGeld, 0.005), j.rGeld);
  pruefe('Ausschuettung: Ex-Tag Sa 15.08. auf Mo 17.08. gebucht', D.reihen.ACWX.d[D.idx['2020-08-17']] === 0.3 && D.zaehlung.exTagVerschoben.indexOf('ACWX 2020-08-15 -> 2020-08-17') >= 0, D.zaehlung.exTagVerschoben);
  pruefe('Ausschuettung: r_Intl(Jan) = 0,003', nahe(j.rIntl, 0.003), j.rIntl);
  pruefe('Ausschuettung: Entscheid Jan SPY (mit Kursen allein waere es AGG)', j.ziel === 'SPY', j.ziel);
  pruefe('Ausschuettung: r_SPY(Feb) = 1,01 x 116/96 - 1', nahe(f.rSpy, 1.01 * 116 / 96 - 1), f.rSpy);
  /* Ausschuettung nach dem Monatsende wirkt nicht zurueck: ohne die Februar-Ausschuettung ist der Januar bitgleich */
  var D2 = K.baueDaten(bau(false), '2021-03-15');
  var j2 = det(D2, HAUPT, '2021-01-29');
  pruefe('Ausschuettung nach dem Monatsende aendert den Januar nicht (bitgleich)', j2.rSpy === j.rSpy && j2.ziel === j.ziel, [j2.rSpy, j.rSpy]);
  /* Gegenprobe ohne jede Ausschuettung: dann AGG (r_SPY = -0,04 < r_Geld = 0) */
  var roh0 = bau(false);
  roh0.SPY.div = []; roh0.BIL.div = []; roh0.ACWX.div = [];
  var j0 = det(K.baueDaten(roh0, '2021-03-15'), HAUPT, '2021-01-29');
  pruefe('Gegenprobe ohne Ausschuettungen: r_SPY = -0,04, r_Geld = 0 -> AGG', nahe(j0.rSpy, -0.04) && j0.rGeld === 0 && j0.ziel === 'AGG', j0);
})();

/* =====================================================================================================================
 * Teil 5: zwoelf KALENDERmonate exakt, ueber den Jahreswechsel (Datensatz Z). Kalender Werktage 01.01.2019-13.08.2021, der
 * GANZE Juni 2020 fehlt (keine Zeile). SPY-Stufe im Monat k (k = 0 fuer Jan 2019) = 100 + k; BIL, ACWX, AGG flach 100.
 *   M = Fr 29.01.2021 (k = 24, Stufe 124). Zwoelf Kalendermonate zurueck: Fr 31.01.2020 (k = 12, Stufe 112):
 *     r_SPY = 124/112 - 1 = 0,107142857...   (falsch mit 11 Monaten: 124/113 - 1; mit 13: 124/111 - 1;
 *     zwoelf MONATSENDEN zurueckgezaehlt (Juni 2020 fehlt) laege man auf Dez 2019 = 124/111 - 1 -> muss verschieden sein)
 *   M = Do 31.12.2020 (k = 23) -> Di 31.12.2019 (k = 11): r = 123/111 - 1 = 0,108108...
 *   M = Mi 30.06.2021 -> Juni 2020 fehlt -> monatsendeVor = -1 -> null; Ziel 01.07.-30.07.2021 null.
 *   M = Fr 30.07.2021 (k = 30) -> Fr 31.07.2020 (k = 18): r = 130/118 - 1; ab Mo 02.08.2021 wieder SPY.
 *   M = Fr 29.05.2020 bleibt Monatsende (Folgetag Mi 01.07.2020); M-12 = Fr 31.05.2019 (k = 4): r = 116/104 - 1.
 *   Erstes berechenbares Monatsende: Fr 31.01.2020 (M-12 = Do 31.01.2019, k = 0): r = 112/100 - 1 = 0,12.
 * Alle berechenbaren Entscheide: r_SPY > 0 = r_Geld = r_Intl -> SPY.
 * ===================================================================================================================== */
(function teil5() {
  var kal = werktage('2019-01-01', '2021-08-13', ['2020-06']);
  var stufen = {};
  for (var k = 0; k < 32; k++) { var y = 2019 + Math.floor(k / 12), mo = k % 12 + 1; stufen[y + '-' + (mo < 10 ? '0' : '') + mo] = 100 + k; }
  var D = K.baueDaten({ SPY: stufenReihe(kal, stufen, 0), BIL: flach(kal, 100), ACWX: flach(kal, 100), AGG: flach(kal, 100) }, '2021-08-13');
  pruefe('12 Monate: Juni 2020 fehlt im Kunstkalender', D.monatsendeVonMonat['2020-06'] === undefined && D.idx['2020-06-30'] === undefined);
  var m = D.idx['2021-01-29'];
  pruefe('12 Monate: monatsendeVor(29.01.2021) = 31.01.2020', D.tage[K.monatsendeVor(D, m, 12)] === '2020-01-31', D.tage[K.monatsendeVor(D, m, 12)]);
  var j = det(D, HAUPT, '2021-01-29');
  pruefe('12 Monate: r(29.01.2021) = 124/112 - 1', nahe(j.rSpy, 124 / 112 - 1), j.rSpy);
  pruefe('12 Monate: nicht 11, nicht 13 Monate, nicht 12 Monatsenden', !nahe(j.rSpy, 124 / 113 - 1, 1e-6) && !nahe(j.rSpy, 124 / 111 - 1, 1e-6));
  pruefe('12 Monate: r(31.12.2020) = 123/111 - 1 (ueber Jahreswechsel)', nahe(det(D, HAUPT, '2020-12-31').rSpy, 123 / 111 - 1), det(D, HAUPT, '2020-12-31').rSpy);
  var juni = det(D, HAUPT, '2021-06-30');
  pruefe('12 Monate: 30.06.2021 -> Juni 2020 fehlt -> null', K.monatsendeVor(D, D.idx['2021-06-30'], 12) === -1 && juni.ziel === null && juni.rSpy === null, juni);
  pruefe('12 Monate: r(30.07.2021) = 130/118 - 1', nahe(det(D, HAUPT, '2021-07-30').rSpy, 130 / 118 - 1));
  pruefe('12 Monate: 29.05.2020 bleibt Monatsende, r = 116/104 - 1', D.monatsende[D.idx['2020-05-29']] === 1 && nahe(det(D, HAUPT, '2020-05-29').rSpy, 116 / 104 - 1));
  pruefe('12 Monate: erstes berechenbares Monatsende 31.01.2020, r = 0,12', nahe(det(D, HAUPT, '2020-01-31').rSpy, 0.12) && det(D, HAUPT, '2019-12-31').ziel === null);
  var z = R2.signal(D, HAUPT);
  var soll = sollFeld(D, [['2020-02-03', 'SPY'], ['2021-07-01', null], ['2021-08-02', 'SPY']]);
  pruefe('12 Monate: Ziel-Feld Tag fuer Tag (Luecke Juli 2021 null)', ersteAbweichung(z, soll, D) === null, ersteAbweichung(z, soll, D));
})();

/* =====================================================================================================================
 * Teil 6: null bei zu kurzer Reihe (Datensatz Kurz). Kalender Werktage 01.01.2020-15.04.2021.
 *   SPY ab 02.01.2020 (100; 2021: 110). BIL erste Zeile Fr 28.02.2020 (= M-12 fuer Feb 2021; 100, 2021: 100,5).
 *   ACWX erste Zeile Mo 02.03.2020 (Tag NACH dem Februar-Monatsende; 100, 2021: 105).
 *   29.01.2021: M-12 = 31.01.2020 -> TR_BIL und TR_ACWX NaN -> null (r_SPY = 0,1 wird gemeldet, r_Geld/r_Intl null)
 *   26.02.2021: M-12 = 28.02.2020 -> TR_BIL = 1 (erste Zeile genau dort, also berechenbar), TR_ACWX NaN -> null
 *   31.03.2021: M-12 = 31.03.2020 -> alle da: r = 0,1 / 0,005 / 0,05 -> SPY; Ziel ab Do 01.04.2021.
 * Monatsenden 2020: M-12 liegt 2019 -> -1 -> null.
 * ===================================================================================================================== */
(function teil6() {
  var kal = werktage('2020-01-01', '2021-04-15');
  var D = K.baueDaten({
    SPY: stufenReihe(kal, { '2021-01': 110, '2021-02': 110, '2021-03': 110, '2021-04': 110 }, 100),
    BIL: stufenReihe(kal, { '2021-01': 100.5, '2021-02': 100.5, '2021-03': 100.5, '2021-04': 100.5 }, 100, '2020-02-28'),
    ACWX: stufenReihe(kal, { '2021-01': 105, '2021-02': 105, '2021-03': 105, '2021-04': 105 }, 100, '2020-03-02'),
    AGG: flach(kal, 100)
  }, '2021-04-15');
  var jan = det(D, HAUPT, '2021-01-29'), feb = det(D, HAUPT, '2021-02-26'), mar = det(D, HAUPT, '2021-03-31');
  pruefe('kurze Reihe: Jan null (BIL und ACWX fehlen an M-12)', jan.ziel === null && nahe(jan.rSpy, 0.1) && jan.rGeld === null && jan.rIntl === null, jan);
  pruefe('kurze Reihe: Feb null (ACWX beginnt einen Tag nach M-12), BIL ab erster Zeile = M-12 berechenbar', feb.ziel === null && nahe(feb.rGeld, 0.005) && feb.rIntl === null, feb);
  pruefe('kurze Reihe: Maerz berechenbar, r = 0,1 / 0,005 / 0,05 -> SPY', mar.ziel === 'SPY' && nahe(mar.rSpy, 0.1) && nahe(mar.rGeld, 0.005) && nahe(mar.rIntl, 0.05), mar);
  pruefe('kurze Reihe: auch N5 null bis Feb, SPY im Maerz', det(D, N5, '2021-02-26').ziel === null && det(D, N5, '2021-03-31').ziel === 'SPY');
  var z = R2.signal(D, HAUPT);
  var soll = sollFeld(D, [['2021-04-01', 'SPY']]);
  pruefe('kurze Reihe: Ziel-Feld null bis 31.03.2021, SPY ab 01.04.', ersteAbweichung(z, soll, D) === null, ersteAbweichung(z, soll, D));
  var warf = false;
  try { R2.signal(D, ERSATZ); } catch (e) { warf = /SHY/.test(String(e.message)); }
  pruefe('fehlende Reihe in den Daten (SHY) wirft mit Namen', warf);
})();

/* =====================================================================================================================
 * Teil 7: Ersatzreihen (N2) waehlen die Reihen ueber die Optionen: dieselben Kurse unter SHY/EFA wie im Datensatz A unter
 * BIL/ACWX -> dieselben Entscheide, nur mit EFA statt ACWX.
 * ===================================================================================================================== */
(function teil7() {
  var roh = { SPY: rohA.SPY, SHY: rohA.BIL, EFA: rohA.ACWX, AGG: rohA.AGG, BIL: flach(kalA, 100), ACWX: flach(kalA, 100) };
  var D = K.baueDaten(roh, '2021-07-15');
  var zE = R2.signal(D, ERSATZ), zH = R2.signal(DA, HAUPT);
  var gleich = true;
  for (var i = 0; i < D.n; i++) if (zE[i] !== (zH[i] === 'ACWX' ? 'EFA' : zH[i])) gleich = false;
  pruefe('Ersatz: SHY/EFA mit denselben Kursen -> dieselben Ziele, EFA statt ACWX', gleich && zE.indexOf('EFA') >= 0);
})();

/* =====================================================================================================================
 * Teil 8: Haupt/N5 unterscheiden sich GENAU bei r_SPY <= r_Geld < r_Intl (Zufallsdatensatz, alle Monatsenden; Rechnung aus
 * den Renditen in details nachgeprueft) - als Satz: ist r_SPY > r_Geld, entscheiden beide gleich (Gewinner); ist
 * r_SPY >= r_Intl, ist der Gewinner SPY und beide pruefen r_SPY gegen r_Geld; bleibt r_Intl > r_SPY und r_SPY <= r_Geld:
 * Haupt -> AGG, N5 -> ACWX genau dann, wenn r_Intl > r_Geld.
 * Der Zufallsdatensatz dient auch Teil 9.
 * ===================================================================================================================== */
function zufallsRoh(saat, von, bis) {
  var rng = K.mulberry32(saat);
  var kal = werktage(von, bis);
  var spec = {
    SPY: { vol: 0.025, div: 0.004, alle: 63 }, ACWX: { vol: 0.025, div: 0.006, alle: 126 }, EFA: { vol: 0.025, div: 0.006, alle: 126 },
    BIL: { vol: 0.0003, drift: 0.00012, div: 0.0012, alle: 21 }, SHY: { vol: 0.001, drift: 0.0001, div: 0.0015, alle: 21 },
    AGG: { vol: 0.004, div: 0.0025, alle: 21 }
  };
  var roh = {};
  Object.keys(spec).forEach(function (sym) {
    var sp = spec[sym];
    var c = 100, drift = 0, zeilen = [], div = [];
    kal.forEach(function (t, i) {
      if (i % 63 === 0) drift = sp.drift != null ? sp.drift * (0.5 + rng()) : (rng() - 0.5) * 0.006;
      var o = c * (1 + (rng() - 0.5) * sp.vol * 0.3);
      var d = 0;
      if (i > 0 && i % sp.alle === Math.floor(sp.alle / 2)) { d = c * sp.div * (0.5 + rng()); div.push({ tag: t, betrag: d }); }
      c = Math.max(1, c * (1 + drift + (rng() - 0.5) * sp.vol) - d);
      zeilen.push({ tag: t, o: o, c: c });
    });
    roh[sym] = { zeilen: zeilen, div: div };
  });
  return roh;
}
/* Saat bewusst gewaehlt, damit alle drei Ziele vorkommen (47 berechenbare Monate: ACWX 20, AGG 14, SPY 13, 7 Haupt/N5-
 * Unterschiede); die zuerst probierte Saat '...|R2|test' lieferte kein einziges ACWX und haette Teil 8 zahnlos gemacht. */
var rohZ = zufallsRoh(K.fnv1a('trendfilter-2026-10|R2|R2-zufall'), '2017-01-02', '2021-12-31');
var DZ = K.baueDaten(rohZ, '2021-12-31');
(function teil8() {
  var dh = R2.details(DZ, HAUPT), dn = R2.details(DZ, N5);
  var falsch = 0, verschieden = 0, berechenbar = 0, ziele = {};
  dh.forEach(function (x, k) {
    var y = dn[k];
    if (x.ziel == null) { if (y.ziel != null) falsch++; return; }
    berechenbar++;
    ziele[x.ziel] = (ziele[x.ziel] || 0) + 1;
    var sollVerschieden = x.rSpy <= x.rGeld && x.rIntl > x.rSpy && x.rIntl > x.rGeld;
    if ((x.ziel !== y.ziel) !== sollVerschieden) falsch++;
    if (sollVerschieden && !(x.ziel === 'AGG' && y.ziel === 'ACWX')) falsch++;
    if (x.ziel !== y.ziel) verschieden++;
  });
  pruefe('Zufall: Haupt/N5 verschieden genau bei r_SPY <= r_Geld < r_Intl', falsch === 0, falsch);
  pruefe('Zufall: Datensatz hat alle drei Ziele und mindestens einen Haupt/N5-Unterschied',
    ziele.SPY > 0 && ziele.ACWX > 0 && ziele.AGG > 0 && verschieden > 0, { ziele: ziele, verschieden: verschieden, berechenbar: berechenbar });
})();

/* =====================================================================================================================
 * Teil 9: kein Blick voraus. Fuer JEDES Monatsende m des Zufallsdatensatzes (ab dem ersten berechenbaren):
 *   (a) Stoerung: alle Eroeffnungen und Schluesse NACH tage[m] (also ab dem Ausfuehrungstag m+1) mit Zufallsfaktoren 0,5..1,5
 *       multipliziert, alle spaeteren Ausschuettungen verdreifacht und an m+1 je Reihe eine neue Ausschuettung eingefuegt.
 *       Soll: ziel[0..m+1] und details bis m bitgleich (Haupt, N5, Ersatz).
 *   (b) Abschneiden der Daten nach tage[m+1]: ziel[0..m+1] bitgleich.
 *   (c) Gegenprobe: dieselbe Pruefung (a) faengt eine absichtlich SPAEHENDE Regel (TR einen Tag nach dem Monatsende), und die
 *       Stoerung veraendert spaetere Ziele ueberhaupt (sonst waere (a) ohne Zaehne).
 * ===================================================================================================================== */
function spaeherSignal(D, opt) {
  return K.monatlich(D, function (m) {
    var v = K.monatsendeVor(D, m, 12);
    if (v < 0 || m + 1 >= D.n) return null;
    function r(sym) { var t = D.reihen[sym].tr; return t[m + 1] / t[v + 1] - 1; }
    var rS = r('SPY'), rG = r(opt.geld), rI = r(opt.intl);
    if (isNaN(rS) || isNaN(rG) || isNaN(rI)) return null;
    return rS > rG ? (rS >= rI ? 'SPY' : opt.intl) : opt.anleihen;
  });
}
(function teil9() {
  var rng = K.mulberry32(K.fnv1a('trendfilter-2026-10|R2|stoerung'));
  var lesarten = { haupt: HAUPT, n5: N5, ersatz: ERSATZ };
  var voll = {}, vollDet = {};
  Object.keys(lesarten).forEach(function (k) { voll[k] = R2.signal(DZ, lesarten[k]); vollDet[k] = R2.details(DZ, lesarten[k]); });
  var spaeherVoll = spaeherSignal(DZ, HAUPT);
  var schnitte = 0, fehlerA = 0, fehlerB = 0, fehlerDet = 0, spaeterAnders = 0, spaeherErwischt = 0;
  for (var m = 0; m < DZ.n - 1; m++) {
    if (!DZ.monatsende[m] || voll.haupt[m + 1] == null) continue;
    schnitte++;
    var grenze = DZ.tage[m];
    var roh = {};
    Object.keys(rohZ).forEach(function (sym) {
      var r = rohZ[sym];
      var zeilen = r.zeilen.map(function (z) {
        if (z.tag <= grenze) return z;
        return { tag: z.tag, o: z.o * (0.5 + rng()), c: z.c * (0.5 + rng()) };
      });
      var div = r.div.map(function (d) { return d.tag <= grenze ? d : { tag: d.tag, betrag: d.betrag * 3 }; });
      div.push({ tag: DZ.tage[m + 1], betrag: 7 });
      roh[sym] = { zeilen: zeilen, div: div };
    });
    var Dg = K.baueDaten(roh, '2021-12-31');
    Object.keys(lesarten).forEach(function (k) {
      var zg = R2.signal(Dg, lesarten[k]);
      for (var i = 0; i <= m + 1; i++) if (zg[i] !== voll[k][i]) { fehlerA++; break; }
      for (var j = m + 2; j < DZ.n; j++) if (zg[j] !== voll[k][j]) { spaeterAnders++; break; }
      var dg = R2.details(Dg, lesarten[k]);
      dg.forEach(function (x, q) {
        if (x.tag > grenze) return;
        var y = vollDet[k][q];
        if (x.tag !== y.tag || x.rSpy !== y.rSpy || x.rGeld !== y.rGeld || x.rIntl !== y.rIntl || x.ziel !== y.ziel) fehlerDet++;
      });
    });
    var Ds = K.baueDaten(rohZ, DZ.tage[m + 1]);
    Object.keys(lesarten).forEach(function (k) {
      var zs = R2.signal(Ds, lesarten[k]);
      for (var i = 0; i <= m + 1; i++) if (zs[i] !== voll[k][i]) { fehlerB++; break; }
    });
    var sp = spaeherSignal(Dg, HAUPT);
    for (var i2 = 0; i2 <= m + 1; i2++) if (sp[i2] !== spaeherVoll[i2]) { spaeherErwischt++; break; }
  }
  pruefe('kein Blick voraus: mindestens 40 Schnitte geprueft', schnitte >= 40, schnitte);
  pruefe('kein Blick voraus (a): Ziel bis zum Ausfuehrungstag unveraendert bei gestoerter Zukunft', fehlerA === 0, fehlerA);
  pruefe('kein Blick voraus (a): details bis zum Monatsende bitgleich', fehlerDet === 0, fehlerDet);
  pruefe('kein Blick voraus (b): Abschneiden nach dem Ausfuehrungstag aendert nichts davor', fehlerB === 0, fehlerB);
  pruefe('Gegenprobe (c): die Stoerung aendert spaetere Ziele (Pruefung hat Zaehne)', spaeterAnders > 0, spaeterAnders);
  pruefe('Gegenprobe (c): die spaehende Regel wird erwischt', spaeherErwischt > 0, spaeherErwischt + ' von ' + schnitte);
  console.log('  kein Blick voraus: ' + schnitte + ' Schnitte x 3 Lesarten; spaehende Regel in ' + spaeherErwischt + ' Schnitten erwischt');
})();

/* =====================================================================================================================
 * Teil 10: ECHTE Daten, zweiter eigener Weg (nur Signal). Eigener Gesamtertragsindex je Reihe auf ihren EIGENEN Zeilen
 * (Schluss > 0, Tag <= 15.09.2026): TR = 1 an der ersten Zeile, TR(k) = TR(k-1) x (C(k) + D(k)) / C(k-1), Ausschuettung mit
 * Ex-Tag ohne Zeile auf die naechste Zeile, vor der ersten Zeile verworfen. TR an einem SPY-Tag = TR der letzten eigenen Zeile
 * bis zu diesem Tag (NaN, wenn keine). Eigene Monatsenden: letzter SPY-Tag jedes Kalendermonats ausser dem abgeschnittenen
 * September 2026. M-12 = Monatsende desselben Monats im Vorjahr (Zeichenkette). Eigene Entscheidung nach §4.2 / §7.2 N5.
 * ===================================================================================================================== */
(function teil10() {
  var ordner = path.join(__dirname, 'daten');
  var syms = ['SPY', 'BIL', 'SHY', 'ACWX', 'EFA', 'AGG'];
  if (!syms.every(function (s) { return fs.existsSync(path.join(ordner, s + '.json')); })) {
    console.log('  Teil 10 UEBERSPRUNGEN: keine Rohdaten in ' + ordner + ' (laden.js zuerst)');
    return;
  }
  var ENDE = '2026-09-15';
  var eigen = {};
  syms.forEach(function (sym) {
    var l = L.lies(fs.readFileSync(path.join(ordner, sym + '.json'), 'utf8'));
    var tags = [], cs = [];
    l.zeilen.forEach(function (z) { if (z.tag <= ENDE && typeof z.c === 'number' && z.c > 0) { tags.push(z.tag); cs.push(z.c); } });
    var ds = tags.map(function () { return 0; });
    l.div.forEach(function (dv) {
      if (dv.tag > ENDE || !(dv.betrag > 0)) return;
      var k = 0;
      while (k < tags.length && tags[k] < dv.tag) k++;
      if (k >= tags.length || (k === 0 && tags[0] > dv.tag)) return;
      ds[k] += dv.betrag;
    });
    var tr = [1];
    for (var k = 1; k < tags.length; k++) tr.push(tr[k - 1] * (cs[k] + ds[k]) / cs[k - 1]);
    eigen[sym] = { tags: tags, tr: tr };
  });
  function trAm(sym, tag) {
    var e = eigen[sym], a = 0, b = e.tags.length;
    while (a < b) { var mm = (a + b) >> 1; if (e.tags[mm] <= tag) a = mm + 1; else b = mm; }
    return a === 0 ? NaN : e.tr[a - 1];
  }
  var spyTage = eigen.SPY.tags;
  var meVon = {}, monate = [];
  for (var i = 0; i < spyTage.length - 1; i++) {
    var mon = spyTage[i].slice(0, 7);
    if (spyTage[i + 1].slice(0, 7) !== mon) { meVon[mon] = spyTage[i]; monate.push(mon); }
  }
  function entscheidEigen(mon, geld, intl, gewinnerRegel) {
    var vor = (+mon.slice(0, 4) - 1) + mon.slice(4);
    if (!meVon[vor]) return null;
    var t = meVon[mon], t12 = meVon[vor];
    var rS = trAm('SPY', t) / trAm('SPY', t12) - 1;
    var rG = trAm(geld, t) / trAm(geld, t12) - 1;
    var rI = trAm(intl, t) / trAm(intl, t12) - 1;
    if (isNaN(rS) || isNaN(rG) || isNaN(rI)) return null;
    var ziel;
    if (gewinnerRegel) {
      if (rS >= rI) ziel = rS > rG ? 'SPY' : 'AGG';
      else ziel = rI > rG ? intl : 'AGG';
    } else if (rS > rG) ziel = rS >= rI ? 'SPY' : intl;
    else ziel = 'AGG';
    return { tag: t, rS: rS, rG: rG, rI: rI, ziel: ziel };
  }
  var D = K.ladeDaten();
  pruefe('echt: Kalender beider Wege gleich (' + spyTage.length + ' Tage)', D.n === spyTage.length && D.tage.every(function (t, q) { return t === spyTage[q]; }));
  var lesarten = [
    { name: 'Haupt', opt: HAUPT, geld: 'BIL', intl: 'ACWX', gew: false, erstes: '2009-04-30' },
    { name: 'Ersatz', opt: ERSATZ, geld: 'SHY', intl: 'EFA', gew: false, erstes: '2003-07-31' },
    { name: 'N5', opt: N5, geld: 'BIL', intl: 'ACWX', gew: true, erstes: '2009-04-30' }
  ];
  lesarten.forEach(function (ls) {
    var ref = R2.details(D, ls.opt);
    var refVon = {};
    ref.forEach(function (x) { refVon[x.tag] = x; });
    var verglichen = 0, zielFehler = [], rFehler = 0, maxAbw = 0, knapp = [], erstes = null, mengeFehler = 0;
    monate.forEach(function (mon) {
      var e = entscheidEigen(mon, ls.geld, ls.intl, ls.gew);
      var x = refVon[meVon[mon]];
      if (!x) { mengeFehler++; return; }
      if (e == null) { if (x.ziel != null) mengeFehler++; return; }
      if (x.ziel == null) { mengeFehler++; return; }
      if (!erstes) erstes = e.tag;
      verglichen++;
      if (e.ziel !== x.ziel) zielFehler.push(e.tag + ' eigen ' + e.ziel + ' / Regel ' + x.ziel);
      [[e.rS, x.rSpy], [e.rG, x.rGeld], [e.rI, x.rIntl]].forEach(function (p) {
        var a = Math.abs(p[0] - p[1]);
        if (a > maxAbw) maxAbw = a;
        if (!(a <= 1e-12)) rFehler++;
      });
      if (Math.abs(e.rS - e.rG) < 1e-9 || Math.abs(e.rS - e.rI) < 1e-9 || Math.abs(e.rI - e.rG) < 1e-9) knapp.push(e.tag);
    });
    pruefe('echt ' + ls.name + ': Monatsenden-Menge beider Wege gleich (' + ref.length + ' Monatsenden)', mengeFehler === 0 && ref.length === monate.length, mengeFehler);
    pruefe('echt ' + ls.name + ': erstes berechenbares Monatsende ' + ls.erstes, erstes === ls.erstes, erstes);
    pruefe('echt ' + ls.name + ': gleiches Ziel in jedem der ' + verglichen + ' berechenbaren Monate', zielFehler.length === 0 && verglichen > 0, zielFehler.slice(0, 5));
    pruefe('echt ' + ls.name + ': Renditen beider Wege auf 1e-12 gleich', rFehler === 0, rFehler + ' Abweichungen, groesste ' + maxAbw);
    pruefe('echt ' + ls.name + ': kein Gleichstand naeher als 1e-9 (sonst Rundung entscheidend)', knapp.length === 0, knapp);
    /* Tag fuer Tag: eigenes Ziel-Feld (Entscheid des letzten Monatsendes VOR dem Tag) gegen R2.signal */
    var z = R2.signal(D, ls.opt);
    var eigenZiel = null, q = 0, tagFehler = 0, ersterFehler = null;
    var entscheide = {};
    monate.forEach(function (mon) { var e = entscheidEigen(mon, ls.geld, ls.intl, ls.gew); entscheide[meVon[mon]] = e ? e.ziel : null; });
    for (q = 0; q < spyTage.length; q++) {
      if (z[q] !== eigenZiel) { tagFehler++; if (!ersterFehler) ersterFehler = spyTage[q] + ': Regel ' + z[q] + ', eigen ' + eigenZiel; }
      if (Object.prototype.hasOwnProperty.call(entscheide, spyTage[q])) eigenZiel = entscheide[spyTage[q]];
    }
    pruefe('echt ' + ls.name + ': Ziel-Feld Tag fuer Tag gleich (' + spyTage.length + ' Tage)', tagFehler === 0, ersterFehler);
    console.log('  echt ' + ls.name + ': ' + verglichen + ' Monate verglichen, erstes ' + erstes + ', groesste Renditeabweichung ' + maxAbw.toExponential(2));
  });
})();

console.log(gruen + ' grün, ' + rot + ' rot');
process.exitCode = rot ? 1 : 0;
