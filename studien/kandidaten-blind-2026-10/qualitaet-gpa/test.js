'use strict';
/* Pruefungen zu qualitaet-gpa (ziel.js). Aufruf aus der Repo-Wurzel:
 *   node studien/kandidaten-blind-2026-10/qualitaet-gpa/test.js
 * Kunstdaten, Sollwerte von Hand gerechnet (Rechenweg im Kommentar). Jede Pruefung haengt an EINER Regelzeile und prueft den GRUND
 * (Eintrag in verworfen / korb-Zaehler / Rang), nicht nur das Ergebnis; Gegenproben stehen neben den Proben.
 * Keine Kursdaten, nichts wird geschrieben. Exit-Code 1 bei jedem Fehler. */
var path = require('path');
var Z = require('./ziel.js');
var Li = require(path.join(__dirname, '..', '..', '..', 'liquide.js'));

var gut = 0, schlecht = 0;
function ok(name, b) { if (b) gut++; else { schlecht++; console.log('FEHLER  ' + name); } }
function nah(name, ist, soll) { var b = Math.abs(ist - soll) <= 1e-12; if (!b) console.log('   ist ' + ist + ' soll ' + soll); ok(name, b); }
function gleich(name, ist, soll) { var a = JSON.stringify(ist), b = JSON.stringify(soll); if (a !== b) console.log('   ist ' + a + '\n   soll ' + b); ok(name, a === b); }

var TAG = 86400000;
var NOW = Date.UTC(2021, 2, 15);                 /* Stichtag 15.03.2021 */
var ISO = function (ms) { return new Date(ms).toISOString().slice(0, 10); };

/** Kursreihe: n Tageszeilen, letzte bei endMs; Kurs und Stueck konstant (Umsatz = Kurs x Stueck). */
function reihe(n, kurs, stueck, endMs) {
  var r = [];
  for (var k = n - 1; k >= 0; k--) r.push(stueck === undefined ? [endMs - k * TAG, kurs] : [endMs - k * TAG, kurs, stueck]);
  return r;
}
function liquide(endMs) { return reihe(30, 100, 2000000, endMs == null ? NOW : endMs); }     /* 200 Mio $ je Tag >= 100 Mio */
function fy(filed, ende, werte) { return { filed: filed, periodEnde: ende, form: '10-K', quartale: 4, werte: werte }; }
function qu(filed, ende, q, werte) { return { filed: filed, periodEnde: ende, form: '10-Q', quartale: q, werte: werte }; }
function gpa(gp, assets) { return { GrossProfit: gp, Assets: assets || 1000 }; }

/** Welt aus Vorgaben {sym, sic, eintraege}: Standard SIC 3571, ein Jahreseintrag aus gp. */
function welt(specs) {
  var roh = {}, fund = {}, sic = {};
  specs.forEach(function (s) {
    roh[s.sym] = s.reihe || liquide();
    sic[s.sym] = s.sic === undefined ? 3571 : s.sic;
    if (s.eintraege !== undefined) fund[s.sym] = s.eintraege;
    else fund[s.sym] = [fy('2021-02-20', '2020-12-31', gpa(s.gp))];
  });
  return { roh: roh, fund: fund, sic: sic };
}
function lauf(w, extra, f) {
  var o = { nowMs: NOW, fundamental: w.fund, sic: w.sic, minWerte: 5 };
  Object.keys(extra || {}).forEach(function (k) { o[k] = extra[k]; });
  return (f || Z.zielfunktion)(w.roh, o);
}
function grundVon(e, sym) { var v = e.verworfen.filter(function (x) { return x.sym === sym; }); return v.length ? v[0].grund : null; }
function rang(e, sym) { return e.rangfolge.filter(function (p) { return p.sym === sym; })[0]; }

/* ---------- Grundfall: neun Werte, GP/A 0,50 ... 0,00 ---------- */
var GP9 = [500, 400, 300, 250, 200, 150, 100, 50, 0];                /* Assets 1000 -> GP/A = gp / 1000 */
function basis() { return welt(GP9.map(function (g, i) { return { sym: 'S0' + (i + 1), gp: g }; })); }
(function () {
  var e = lauf(basis());
  /* Rang: S01 0,50 > S02 0,40 > S03 0,30 > ... > S09 0,00. n = 9 -> oberes Terzil ceil(9/3) = 3 -> Zielzahl min(30, 3) = 3. */
  gleich('Grund: Rangfolge absteigend nach GP/A', e.rangfolge.map(function (p) { return p.sym; }), ['S01', 'S02', 'S03', 'S04', 'S05', 'S06', 'S07', 'S08', 'S09']);
  nah('Grund: GP/A = Bruttogewinn / Bilanzsumme (S01 500/1000)', rang(e, 'S01').staerke, 0.5);
  nah('Grund: GP/A S04 = 250/1000', rang(e, 'S04').staerke, 0.25);
  gleich('Grund: Ziel = oberes Terzil (3 von 9), nach GP/A', e.ziel, ['S01', 'S02', 'S03']);
  ok('Grund: Terzil/Zielzahl im Korb (3/3)', e.korb.terzil === 3 && e.korb.zielzahl === 3);
  ok('Rueckgabeform: zuWenig false, korb.zulaessig = Laenge rangfolge = 9, geprueft = 9',
    e.zuWenig === false && e.korb.zulaessig === 9 && e.rangfolge.length === 9 && e.korb.geprueft === 9);
  ok('Rueckgabeform: Felder uebersprungen/verworfen/korb vorhanden', Array.isArray(e.uebersprungen) && Array.isArray(e.verworfen) &&
    e.korb.umsatzMin === 100000000 && e.korb.fenster === 20);
  /* Terzil rundet auf: 10 Werte -> ceil(3,33) = 4, 11 -> 4, 12 -> 4, 13 -> 5. */
  var w10 = welt([0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(function (i) { return { sym: 'T' + i, gp: 900 - 10 * i }; }));
  gleich('Grund: Terzil rundet auf (10 Werte -> 4)', lauf(w10).ziel.length, 4);
  /* Obergrenze: maxZiel 2 beschneidet das Terzil (3) auf die 2 mit hoechster GP/A. */
  gleich('Grund: Obergrenze greift vor dem Terzil (maxZiel 2)', lauf(basis(), { maxZiel: 2 }).ziel, ['S01', 'S02']);
  /* Eingabereihenfolge ist egal. */
  var w = basis(), roh2 = {};
  Object.keys(w.roh).reverse().forEach(function (k) { roh2[k] = w.roh[k]; });
  gleich('Eingabereihenfolge aendert nichts', Z.zielfunktion(roh2, { nowMs: NOW, fundamental: w.fund, sic: w.sic, minWerte: 5 }).ziel, e.ziel);
})();

/* ---------- Konstanten (Fundstellen siehe ziel.js / REGEL.md Teil B) ---------- */
(function () {
  var K = Z.KONFIG;
  ok('KONFIG: Korb = liquide.js (100 Mio $, 20 Balken, 100 Werte)', K.UMSATZ_MIN === Li.KORB.umsatzMin && K.UMSATZ_MIN === 100000000 &&
    K.UMSATZ_FENSTER === 20 && K.MIN_WERTE === 100);
  ok('KONFIG: Terzil 3, Obergrenze 30, Karenz 3 Tage, TTM-Alter 548 Tage, veraltet 7 Tage', K.TERZIL === 3 && K.MAX_ZIEL === 30 &&
    K.KARENZ_TAGE === 3 && K.MAX_TTM_ALTER_TAGE === 548 && K.MAX_ALTER_MS === 7 * TAG);
  ok('KONFIG: Finanz-SIC 6000..6999, Nenner Assets', K.FINANZ_SIC_VON === 6000 && K.FINANZ_SIC_BIS === 6999 && K.TAGS.bilanzsumme === 'Assets');
  ok('KONFIG: Rueckfallkette hat sieben Regeln, erste = GrossProfit', K.GP_REGELN.length === 7 && K.GP_REGELN[0].gp === 'GrossProfit');
})();

/* ---------- Finanzwerte (Novy-Marx: SIC 6xxx raus) ---------- */
(function () {
  var s = GP9.map(function (g, i) { return { sym: 'S0' + (i + 1), gp: g }; });
  s.push({ sym: 'F01', gp: 900, sic: 6021 });          /* Bank, GP/A 0,9 waere vorn */
  var e = lauf(welt(s));
  ok('Finanz: Bank (SIC 6021) nicht im Ziel, trotz hoechster GP/A', e.ziel.indexOf('F01') < 0 && !rang(e, 'F01'));
  ok('Finanz: Grund "Finanzwert" und Zaehler 1', /Finanzwert \(SIC 6021\)/.test(grundVon(e, 'F01') || '') && e.korb.finanz === 1);
  /* Grenzen: 5999 und 7000 zaehlen mit, 6000 und 6999 nicht. */
  var g = GP9.map(function (x, i) { return { sym: 'S0' + (i + 1), gp: x }; });
  g.push({ sym: 'G59', gp: 900, sic: 5999 }, { sym: 'G70', gp: 800, sic: 7000 }, { sym: 'G60', gp: 700, sic: 6000 }, { sym: 'G69', gp: 600, sic: 6999 });
  var e2 = lauf(welt(g));
  ok('Finanz: SIC 5999 und 7000 sind keine Finanzwerte (rangieren)', !!rang(e2, 'G59') && !!rang(e2, 'G70'));
  ok('Finanz: SIC 6000 und 6999 sind Finanzwerte (raus)', !rang(e2, 'G60') && !rang(e2, 'G69') && e2.korb.finanz === 2);
  /* SIC als Zeichenkette ist gleich gueltig. */
  var e3 = lauf(welt(g.concat([{ sym: 'G61', gp: 950, sic: '6199' }])));
  ok('Finanz: SIC als String "6199" wird ausgeschlossen', !rang(e3, 'G61') && e3.korb.finanz === 3);
  /* SIC unbekannt: Fail-closed. */
  var e4 = lauf(welt(s.concat([{ sym: 'U01', gp: 950, sic: null }])));
  ok('SIC unbekannt: nicht zulaessig, Grund und Zaehler', !rang(e4, 'U01') && /SIC-Code unbekannt/.test(grundVon(e4, 'U01') || '') && e4.korb.ohneSic === 1);
})();

/* ---------- Bilanzdaten fehlen / unbrauchbar ---------- */
(function () {
  var s = GP9.map(function (g, i) { return { sym: 'S0' + (i + 1), gp: g }; });
  var e;
  var w = welt(s.concat([{ sym: 'N01', gp: 0, eintraege: [] }, { sym: 'N02', gp: 0, eintraege: [fy('2021-02-20', '2020-12-31', { GrossProfit: 500 })] },
    { sym: 'N03', gp: 0, eintraege: [fy('2021-02-20', '2020-12-31', { GrossProfit: 500, Assets: 0 })] },
    { sym: 'N04', gp: 0, eintraege: [fy('2021-02-20', '2020-12-31', { GrossProfit: 500, Assets: -5 })] },
    { sym: 'N05', gp: 0, eintraege: [fy('2021-02-20', '2020-12-31', { Assets: 1000 })] },
    { sym: 'N06', gp: 0, eintraege: [fy('2021-02-20', '2020-12-31', { GrossProfit: 'viel', Assets: 1000 })] },
    { sym: 'N07', gp: 0, eintraege: [fy('2021-02-20', '2020-12-31', { GrossProfit: NaN, Assets: 1000 })] }]));
  delete w.fund.N08;
  w.roh.N08 = liquide(); w.sic.N08 = 3571;
  e = lauf(w);
  ok('Bilanz: leere Liste -> ohneBilanz', !rang(e, 'N01') && /keine Bilanzdaten/.test(grundVon(e, 'N01') || ''));
  ok('Bilanz: Assets fehlt -> ohneBilanz', !rang(e, 'N02') && /Bilanzsumme/.test(grundVon(e, 'N02') || ''));
  ok('Bilanz: Assets 0 und negativ -> nicht rangiert (Grund Bilanzsumme nicht positiv)', !rang(e, 'N03') && !rang(e, 'N04') && /nicht positiv/.test(grundVon(e, 'N03') || ''));
  ok('Bilanz: kein Bruttogewinn-Tag -> ohneBruttogewinn', !rang(e, 'N05') && /Bruttogewinn nicht rechenbar/.test(grundVon(e, 'N05') || ''));
  ok('Bilanz: Text und NaN als Wert zaehlen als fehlend', !rang(e, 'N06') && !rang(e, 'N07'));
  ok('Bilanz: Emittent ganz ohne Eintrag in opts.fundamental -> ohneBilanz', !rang(e, 'N08') && /keine Bilanzdaten/.test(grundVon(e, 'N08') || ''));
  ok('Bilanz: Zaehler (ohneBilanz 4: N01,N02,N03/N04 -> 5 mit N08)', e.korb.ohneBilanz === 5 && e.korb.ohneBruttogewinn === 3);
  var ohne = Z.zielfunktion(basis().roh, { nowMs: NOW, minWerte: 5, sic: basis().sic });
  ok('Bilanz: ganz ohne opts.fundamental -> nichts zulaessig, zuWenig', ohne.zuWenig === true && ohne.ziel.length === 0 && ohne.korb.ohneBilanz === 9);
  /* Eintrag mit ungueltigem Datum / Formular / quartale wird ignoriert. */
  var ig = welt(s.concat([{ sym: 'I01', gp: 0, eintraege: [
    { filed: '2021-02-30', periodEnde: '2020-12-31', form: '10-K', quartale: 4, werte: gpa(900) },
    { filed: '2021-02-20', periodEnde: '2020-13-31', form: '10-K', quartale: 4, werte: gpa(900) },
    { filed: '2021-02-20', periodEnde: '2020-12-31', form: '10-K/A', quartale: 4, werte: gpa(900) },
    { filed: '2021-02-20', periodEnde: '2020-12-31', form: '8-K', quartale: 4, werte: gpa(900) },
    { filed: '2021-02-20', periodEnde: '2020-12-31', form: '10-K', quartale: 5, werte: gpa(900) }] }]));
  var ei = lauf(ig);
  ok('Bilanz: ungueltiges Datum, 10-K/A, 8-K, quartale 5 werden ignoriert', !rang(ei, 'I01') && ei.korb.ohneBilanz === 1);
})();

/* ---------- Kein Blick voraus: filed + Karenz <= nowMs ---------- */
(function () {
  var alt = fy('2020-03-01', '2019-12-31', gpa(10));                       /* GP/A 0,01 */
  var s = GP9.map(function (g, i) { return { sym: 'S0' + (i + 1), gp: g }; });
  /* L01: neuer Jahresabschluss (GP/A 0,9) eingereicht 13.03.2021; Stichtag 15.03.: 13.03. + 3 Tage = 16.03. > 15.03. -> unsichtbar. */
  var w = welt(s.concat([{ sym: 'L01', gp: 0, eintraege: [alt, fy('2021-03-13', '2020-12-31', gpa(900))] }]));
  var e = lauf(w);
  nah('Look-ahead: Einreichung am 13.03. (+3 Tage = 16.03.) noch unsichtbar, es zaehlt der alte Abschluss (GP/A 0,01)', rang(e, 'L01').staerke, 0.01);
  ok('Look-ahead: Gegenprobe-Zustand: L01 nicht im Ziel', e.ziel.indexOf('L01') < 0);
  /* Gegenprobe: Stichtag 16.03. -> sichtbar -> GP/A 0,9 -> Rang 1. */
  var e2 = lauf(w, { nowMs: NOW + TAG });
  nah('Look-ahead Gegenprobe: einen Tag spaeter sichtbar (GP/A 0,9)', rang(e2, 'L01').staerke, 0.9);
  gleich('Look-ahead Gegenprobe: L01 fuehrt dann die Rangfolge', e2.rangfolge[0].sym, 'L01');
  /* Grenze: filed 12.03. + 3 = 15.03. <= 15.03. -> sichtbar. */
  var w3 = welt(s.concat([{ sym: 'L01', gp: 0, eintraege: [alt, fy('2021-03-12', '2020-12-31', gpa(900))] }]));
  nah('Look-ahead Grenze: filed + Karenz = Stichtag ist sichtbar', rang(lauf(w3), 'L01').staerke, 0.9);
  /* Karenz 0 (nur Test-Option): 13.03. ist dann sichtbar -> die Karenz ist es, die versteckt. */
  nah('Look-ahead: ohne Karenz (karenzTage 0) waere der 13.03. sichtbar', rang(lauf(w, { karenzTage: 0 }), 'L01').staerke, 0.9);
  /* Nur ein Eintrag, und der kommt zu spaet: nicht rangiert, Grund ohne Bilanz. */
  var w4 = welt(s.concat([{ sym: 'L02', gp: 0, eintraege: [fy('2021-03-14', '2020-12-31', gpa(900))] }]));
  var e4 = lauf(w4);
  ok('Look-ahead: einziger Abschluss nach Stichtag eingereicht -> nicht rangiert (keine Bilanzdaten)', !rang(e4, 'L02') && /keine Bilanzdaten/.test(grundVon(e4, 'L02') || ''));
  /* Das Periodenende ist NICHT das Mass: Periode 2020-12-31 liegt vor dem Stichtag, eingereicht aber erst am 14.03. */
  ok('Look-ahead: massgeblich ist filed, nicht periodEnde', !rang(e4, 'L02'));
  /* Korrektur: aelteres filed GP 100 (0,1), juengeres <= Stichtag GP 400 (0,4), noch juengeres nach Stichtag GP 900 (0,9). */
  var w5 = welt(s.concat([{ sym: 'K01', gp: 0, eintraege: [fy('2021-02-10', '2020-12-31', gpa(100)), fy('2021-03-01', '2020-12-31', gpa(400)),
    fy('2021-03-14', '2020-12-31', gpa(900))] }]));
  nah('Korrektur: juengste Einreichung <= Stichtag gilt (400, nicht 100 und nicht 900)', rang(lauf(w5), 'K01').staerke, 0.4);
  /* Reihenfolge im Array egal: spaeter eingereichte steht vorn. */
  var w6 = welt(s.concat([{ sym: 'K01', gp: 0, eintraege: [fy('2021-03-01', '2020-12-31', gpa(400)), fy('2021-02-10', '2020-12-31', gpa(100))] }]));
  nah('Korrektur: Array-Reihenfolge egal, filed entscheidet', rang(lauf(w6), 'K01').staerke, 0.4);
  /* Kursreihe: Zeilen nach nowMs zaehlen nicht (Umsatzfenster). 12 Zukunftszeilen ohne Stueck: bliebe die Zeile im Fenster, wuerde der Median 0. */
  var fut = liquide().concat(reihe(12, 100, 0, NOW + 12 * TAG));
  var w7 = welt(s.concat([{ sym: 'P01', gp: 700, reihe: fut }]));
  var e7 = lauf(w7);
  ok('Kein Blick voraus (Kurse): 12 Zeilen nach nowMs mit Umsatz 0 aendern die Zulaessigkeit nicht', !!rang(e7, 'P01'));
  var nurZukunft = welt(s.concat([{ sym: 'P02', gp: 700, reihe: reihe(25, 100, 2000000, NOW + 30 * TAG) }]));
  var e8 = lauf(nurZukunft);
  ok('Kein Blick voraus (Kurse): Reihe nur aus Zukunftszeilen -> zu kurz', !rang(e8, 'P02') && /zu kurze Kursreihe \(0 von 20/.test(grundVon(e8, 'P02') || ''));
  /* Stichtag mitten in der Reihe: nur die Zeilen bis dahin zaehlen (die letzten 6 haben Umsatz 0, davor 200 Mio: Stichtag NOW-6 -> ok). */
  var mix = reihe(25, 100, 2000000, NOW - 6 * TAG).concat(reihe(6, 100, 0, NOW));
  var e9 = lauf(welt(s.concat([{ sym: 'P03', gp: 700, reihe: mix }])), { nowMs: NOW - 6 * TAG });
  ok('Kein Blick voraus (Kurse): Stichtag NOW-6 sieht nur die Zeilen bis dahin', !!rang(e9, 'P03'));
  var e10 = lauf(welt(s.concat([{ sym: 'P03', gp: 700, reihe: mix }])), { nowMs: NOW });
  ok('Kein Blick voraus (Gegenprobe): am Stichtag NOW mit 6 Nullumsatz-Zeilen zaehlt der Median trotzdem (14 von 20 Tagen 200 Mio)', !!rang(e10, 'P03'));
})();

/* ---------- TTM aus Quartalen: Jahr + laufendes Kumulat - Vorjahreskumulat ---------- */
(function () {
  var s = GP9.map(function (g, i) { return { sym: 'S0' + (i + 1), gp: g }; });
  /* Q1: FY2019 800 + Q1 2020 250 - Q1 2019 150 = 900; Assets des Q1-Eintrags 1000 (FY-Assets 500 duerfen nicht gelten) -> 0,9. */
  var q1 = [fy('2020-03-01', '2019-12-31', { GrossProfit: 800, Assets: 500 }),
    qu('2020-05-05', '2020-03-31', 1, { GrossProfit: 250, Assets: 1000 }), qu('2020-05-05', '2019-03-31', 1, { GrossProfit: 150 })];
  /* ... und weitere Meldung fuer 2020: H1: FY2019 800 + H1 2020 500 - H1 2019 380 = 920 (Assets 1000). */
  var h1 = [fy('2020-03-01', '2019-12-31', { GrossProfit: 800, Assets: 500 }),
    qu('2020-08-05', '2020-06-30', 2, { GrossProfit: 500, Assets: 1000 }), qu('2020-08-05', '2019-06-30', 2, { GrossProfit: 380 })];
  /* 9M: 800 + 700 - 520 = 980 */
  var m9 = [fy('2020-03-01', '2019-12-31', { GrossProfit: 800, Assets: 500 }),
    qu('2020-11-05', '2020-09-30', 3, { GrossProfit: 700, Assets: 1000 }), qu('2020-11-05', '2019-09-30', 3, { GrossProfit: 520 })];
  /* Q1 des Folgejahres nach dem Jahresabschluss: FY2020 850 (Assets 1000) wird gebraucht, wenn spaeter als Q... hier: Jahr 2020 komplett -> GP/A 0,85. */
  var jahr = [fy('2021-02-20', '2020-12-31', { GrossProfit: 850, Assets: 1000 }), qu('2020-11-05', '2020-09-30', 3, { GrossProfit: 700, Assets: 1000 })];
  var w = welt(s.concat([{ sym: 'Q01', gp: 0, eintraege: q1 }, { sym: 'Q02', gp: 0, eintraege: h1 }, { sym: 'Q03', gp: 0, eintraege: m9 },
    { sym: 'Q04', gp: 0, eintraege: jahr }]), {});
  /* Stichtag 15.03.2021: die Q1/H1/9M-2020-Meldungen sind alt (Periode 2020-03-31: 349 Tage, 2020-09-30: 166 Tage). */
  var e = lauf(w);
  nah('TTM: Q1 = 800 + 250 - 150 = 900, Assets des Q1-Eintrags (1000) -> 0,9', rang(e, 'Q01').staerke, 0.9);
  nah('TTM: Halbjahr = 800 + 500 - 380 = 920 -> 0,92', rang(e, 'Q02').staerke, 0.92);
  nah('TTM: 9 Monate = 800 + 700 - 520 = 980 -> 0,98', rang(e, 'Q03').staerke, 0.98);
  ok('TTM: ttmEnde = Ende der laufenden Periode', rang(e, 'Q01').ttmEnde === '2020-03-31' && rang(e, 'Q03').ttmEnde === '2020-09-30');
  /* Jahresabschluss (31.12.2020) ist juenger als das 9M-Kumulat -> gilt der Jahreswert 850/1000, nicht die 9M-Rechnung. */
  nah('TTM: juengste Periode zuerst (Jahr 2020-12-31 vor 9M 2020-09-30): 850/1000', rang(e, 'Q04').staerke, 0.85);
  ok('TTM: Rangfolge enthaelt Q03 (0,98) vor Q02 (0,92) vor Q01 (0,9)', e.rangfolge.map(function (p) { return p.sym; }).join(',').indexOf('Q03,Q02,Q01') >= 0 || (
    e.rangfolge.map(function (p) { return p.sym; }).indexOf('Q03') < e.rangfolge.map(function (p) { return p.sym; }).indexOf('Q02') &&
    e.rangfolge.map(function (p) { return p.sym; }).indexOf('Q02') < e.rangfolge.map(function (p) { return p.sym; }).indexOf('Q01')));
  /* Vorjahresvergleichszahl fehlt -> die TTM dieser Periode ist nicht rechenbar; Rueckfall auf den aelteren Jahreswert (FY2019 800/500 = 1,6). */
  var ohneVj = [fy('2020-03-01', '2019-12-31', { GrossProfit: 800, Assets: 500 }), qu('2020-05-05', '2020-03-31', 1, { GrossProfit: 250, Assets: 1000 })];
  var e2 = lauf(welt(s.concat([{ sym: 'Q05', gp: 0, eintraege: ohneVj }])));
  nah('TTM: Vorjahresvergleich fehlt -> Rueckfall auf den aelteren Jahreswert (800/500)', rang(e2, 'Q05').staerke, 1.6);
  ok('TTM: Rueckfall nennt das aeltere Periodenende (2019-12-31)', rang(e2, 'Q05').ttmEnde === '2019-12-31');
  /* Jahreswert fehlt (kein 10-K, nur Q1 + Q1-Vorjahr): nicht rechenbar. */
  var ohneFy = [qu('2020-05-05', '2020-03-31', 1, { GrossProfit: 250, Assets: 1000 }), qu('2020-05-05', '2019-03-31', 1, { GrossProfit: 150 })];
  var e3 = lauf(welt(s.concat([{ sym: 'Q06', gp: 0, eintraege: ohneFy }])));
  ok('TTM: Jahreswert fehlt -> nicht rangiert (ohneBruttogewinn)', !rang(e3, 'Q06') && /Bruttogewinn nicht rechenbar/.test(grundVon(e3, 'Q06') || ''));
  /* Zuordnung des Vorjahresquartals mit Toleranz (52/53-Wochen-Jahr): FY-Ende 2019-12-28, Q1 2020-03-28, Q1 2019-03-30 (Abweichung 2 Tage). */
  var wo = [fy('2020-03-01', '2019-12-28', { GrossProfit: 800, Assets: 500 }), qu('2020-05-05', '2020-03-28', 1, { GrossProfit: 250, Assets: 1000 }),
    qu('2020-05-05', '2019-03-30', 1, { GrossProfit: 150 })];
  nah('TTM: Perioden-Toleranz (52/53 Wochen): 800 + 250 - 150 = 900 -> 0,9', rang(lauf(welt(s.concat([{ sym: 'Q07', gp: 0, eintraege: wo }]))), 'Q07').staerke, 0.9);
  /* Ausserhalb der Toleranz: FY-Ende 2019-11-30 (31 Tage neben 31.12.) -> nicht zuordenbar, Rueckfall auf FY allein (800/500 = 1,6). */
  var weit = [fy('2020-03-01', '2019-11-30', { GrossProfit: 800, Assets: 500 }), qu('2020-05-05', '2020-03-31', 1, { GrossProfit: 250, Assets: 1000 }),
    qu('2020-05-05', '2019-03-31', 1, { GrossProfit: 150 })];
  var e4 = lauf(welt(s.concat([{ sym: 'Q08', gp: 0, eintraege: weit }])));
  ok('TTM: Jahresende 31 Tage daneben -> nicht zugeordnet, Rueckfall auf FY allein', rang(e4, 'Q08') && rang(e4, 'Q08').ttmEnde === '2019-11-30');
  /* Karenz wirkt auch auf die Teile: das Vorjahresquartal einer SPAETEREN Meldung existiert nicht. */
  var spaet = [fy('2020-03-01', '2019-12-31', { GrossProfit: 800, Assets: 500 }), qu('2020-05-05', '2020-03-31', 1, { GrossProfit: 250, Assets: 1000 }),
    qu('2021-03-14', '2019-03-31', 1, { GrossProfit: 150 })];
  var e5 = lauf(welt(s.concat([{ sym: 'Q09', gp: 0, eintraege: spaet }])));
  ok('TTM+Look-ahead: Vorjahresquartal erst am 14.03.2021 eingereicht -> Q1-TTM nicht rechenbar, Rueckfall auf FY (1,6)', rang(e5, 'Q09') && rang(e5, 'Q09').ttmEnde === '2019-12-31');
  /* Monatsende-Verschiebung: 31.12. - 3 Monate = 30.09.; 31.05. + 9 Monate = 28.02. (Schaltjahr 29.02.). */
  var I = Z._intern;
  ok('schiebeMonate: Monatsende bleibt Monatsende (31.12. -3 = 30.09.; 31.05.2019 -3 = 28.02.2019; 30.06.2020 -12 = 30.06.2019)',
    ISO(I.schiebeMonate(Date.UTC(2020, 11, 31), -3)) === '2020-09-30' && ISO(I.schiebeMonate(Date.UTC(2019, 4, 31), -3)) === '2019-02-28' &&
    ISO(I.schiebeMonate(Date.UTC(2020, 5, 30), -12)) === '2019-06-30');
})();

/* ---------- Rueckfallkette Bruttogewinn: jede Stufe, nie gemischt ---------- */
(function () {
  var s = GP9.map(function (g, i) { return { sym: 'S0' + (i + 1), gp: g }; });
  function w1(sym, werte) { return { sym: sym, gp: 0, eintraege: [fy('2021-02-20', '2020-12-31', werte)] }; }
  var w = welt(s.concat([
    w1('R01', { GrossProfit: 400, Revenues: 1000, CostOfRevenue: 100, Assets: 1000 }),                                      /* Regel 1: 400 (nicht 900) */
    w1('R02', { Revenues: 1000, CostOfRevenue: 600, Assets: 1000 }),                                                        /* Regel 2: 400 */
    w1('R03', { Revenues: 1000, CostOfGoodsAndServicesSold: 650, Assets: 1000 }),                                           /* Regel 3: 350 */
    w1('R04', { RevenueFromContractWithCustomerExcludingAssessedTax: 1000, CostOfRevenue: 700, Assets: 1000 }),             /* Regel 4: 300 */
    w1('R05', { RevenueFromContractWithCustomerExcludingAssessedTax: 1000, CostOfGoodsAndServicesSold: 750, Assets: 1000 }),/* Regel 5: 250 */
    w1('R06', { SalesRevenueNet: 1000, CostOfRevenue: 800, Assets: 1000 }),                                                 /* Regel 6: 200 */
    w1('R07', { SalesRevenueNet: 1000, CostOfGoodsSold: 850, Assets: 1000 }),                                               /* Regel 7: 150 */
    w1('R08', { Revenues: 1000, Assets: 1000 }),                                                                            /* kein Kostentag */
    w1('R09', { CostOfRevenue: 600, Assets: 1000 }),                                                                        /* kein Erloestag */
    w1('R10', { GrossProfit: 300, Revenues: 1000, CostOfRevenue: 100, Assets: 1000 })                                       /* wie R01 */
  ]));
  var e = lauf(w);
  var soll = { R01: [0.4, 1], R02: [0.4, 2], R03: [0.35, 3], R04: [0.3, 4], R05: [0.25, 5], R06: [0.2, 6], R07: [0.15, 7] };
  Object.keys(soll).forEach(function (k) {
    nah('Kette: ' + k + ' GP/A ' + soll[k][0], rang(e, k).staerke, soll[k][0]);
    ok('Kette: ' + k + ' rechnet nach Regel ' + soll[k][1], rang(e, k).regel === soll[k][1]);
  });
  ok('Kette: GrossProfit hat Vorrang vor Erloes - Kosten (R01 = 0,4, nicht 0,9)', Math.abs(rang(e, 'R01').staerke - 0.4) < 1e-12);
  ok('Kette: Erloes ohne Kosten bzw. Kosten ohne Erloes -> nicht rechenbar', !rang(e, 'R08') && !rang(e, 'R09') && e.korb.ohneBruttogewinn === 2);
  nah('Kette: GP-Wert 300 -> 0,3', rang(e, 'R10').staerke, 0.3);
  /* Nie gemischt: Jahr hat GrossProfit, das Quartal nur Revenues/CostOfRevenue -> Regel 1 scheitert fuer die Menge, Regel 2 muss in ALLEN Teilen stehen.
   * FY: GP 800 (Revenues 2000, CostOfRevenue 1100 -> 900), Q1: Revenues 500, CostOfRevenue 250 -> 250, Q1 Vorjahr: 400/260 -> 140. Regel 2: 900 + 250 - 140 = 1010 -> 1,01 */
  var gem = [fy('2020-03-01', '2019-12-31', { GrossProfit: 800, Revenues: 2000, CostOfRevenue: 1100, Assets: 500 }),
    qu('2020-05-05', '2020-03-31', 1, { Revenues: 500, CostOfRevenue: 250, Assets: 1000 }), qu('2020-05-05', '2019-03-31', 1, { Revenues: 400, CostOfRevenue: 260 })];
  var e2 = lauf(welt(s.concat([{ sym: 'M01', gp: 0, eintraege: gem }])));
  nah('Kette: nie gemischt - Regel 2 in allen Teilen: 900 + 250 - 140 = 1010 -> 1,01', rang(e2, 'M01').staerke, 1.01);
  ok('Kette: gemischter Fall nennt Regel 2', rang(e2, 'M01').regel === 2);
})();

/* ---------- Alter der Bilanz ---------- */
(function () {
  var s = GP9.map(function (g, i) { return { sym: 'S0' + (i + 1), gp: g }; });
  /* Stichtag 15.03.2021: Periodenende 30.09.2019 ist 532 Tage alt (<= 548: ok); 30.06.2019 ist 624 Tage alt (> 548: veraltet). */
  var w = welt(s.concat([{ sym: 'A01', gp: 0, eintraege: [fy('2019-11-20', '2019-09-30', gpa(700))] },
    { sym: 'A02', gp: 0, eintraege: [fy('2019-08-20', '2019-06-30', gpa(700))] }]));
  var e = lauf(w);
  ok('Alter: 532 Tage alte Bilanz zaehlt', !!rang(e, 'A01'));
  ok('Alter: 624 Tage alte Bilanz ist veraltet (Grund und Zaehler)', !rang(e, 'A02') && /aelter als 548 Tage/.test(grundVon(e, 'A02') || '') && e.korb.veraltet === 1);
  var e2 = lauf(w, { maxTtmAlterTage: 700 });
  ok('Alter: Gegenprobe - mit hoeherem Hoechstalter rangiert A02', !!rang(e2, 'A02'));
})();

/* ---------- Kursreihe: Laenge, Luecken, veraltet, Kurs <= 0, Umsatz ---------- */
(function () {
  var s = GP9.map(function (g, i) { return { sym: 'S0' + (i + 1), gp: g }; });
  var w = welt(s.concat([
    { sym: 'K19', gp: 700, reihe: reihe(19, 100, 2000000, NOW) },                      /* 19 Zeilen < 20 */
    { sym: 'K20', gp: 700, reihe: reihe(20, 100, 2000000, NOW) },                      /* genau 20 */
    { sym: 'V07', gp: 700, reihe: liquide(NOW - 7 * TAG) },                            /* 7 Tage alt: noch ok (> 7 fliegt raus) */
    { sym: 'V08', gp: 700, reihe: liquide(NOW - 8 * TAG) },                            /* 8 Tage alt: raus */
    { sym: 'KN0', gp: 700, reihe: liquide().slice(0, 24).concat([[NOW, 0, 2000000]]) },/* letzter Kurs 0 */
    { sym: 'KNE', gp: 700, reihe: liquide().slice(0, 24).concat([[NOW, -5, 2000000]]) },/* letzter Kurs negativ */
    { sym: 'LUE', gp: 700, reihe: reihe(40, 100, 2000000, NOW).filter(function (z, i) { return i % 4 !== 1; }) }, /* Luecken in der Reihe (jede vierte Zeile fehlt, 30 von 40 da) */
    { sym: 'U99', gp: 700, reihe: reihe(25, 100, 999999, NOW) },                       /* 99,9999 Mio $ */
    { sym: 'U00', gp: 700, reihe: reihe(25, 100, 1000000, NOW) },                      /* genau 100 Mio $ */
    { sym: 'OUM', gp: 700, reihe: reihe(25, 100, undefined, NOW) },                    /* keine Stueckzahlen */
    { sym: 'LEE', gp: 700, reihe: [] }
  ]));
  var e = lauf(w);
  ok('Reihe: 19 Zeilen zu kurz (Grund), 20 genuegen', !rang(e, 'K19') && /zu kurze Kursreihe \(19 von 20/.test(grundVon(e, 'K19') || '') && !!rang(e, 'K20'));
  ok('Reihe: leere Reihe -> zu kurz (0 von 20)', !rang(e, 'LEE') && /\(0 von 20/.test(grundVon(e, 'LEE') || ''));
  ok('Reihe: 7 Tage alt zaehlt, 8 Tage alt fliegt raus (Grund veraltet)', !!rang(e, 'V07') && !rang(e, 'V08') && /Kurse veraltet \(8 Tage alt\)/.test(grundVon(e, 'V08') || ''));
  ok('Reihe: Kurs 0 und Kurs < 0 am Stichtag -> raus (Grund Kurs nicht positiv)', !rang(e, 'KN0') && !rang(e, 'KNE') && /Kurs nicht positiv/.test(grundVon(e, 'KN0') || '') && /Kurs nicht positiv/.test(grundVon(e, 'KNE') || ''));
  ok('Reihe: Luecken in den Zeilen (30 von 40 Tagen da, 20+ Zeilen) stoeren nicht', !!rang(e, 'LUE'));
  ok('Reihe: 99,9999 Mio $ unter der Schwelle (Grund), genau 100 Mio $ zaehlt', !rang(e, 'U99') && /unter 100 Mio/.test(grundVon(e, 'U99') || '') && !!rang(e, 'U00'));
  ok('Reihe: ohne Stueckzahlen -> Zaehler ohneUmsatz (Datenluecke, kein Befund), unterSchwelle zaehlt U99', !rang(e, 'OUM') && e.korb.ohneUmsatz === 1 && e.korb.unterSchwelle === 1);
  ok('Reihe: geprueft zaehlt alle Eingaben (9 + 11 = 20)', e.korb.geprueft === 20);
  /* Median = oberer der beiden mittleren (liquide.js): 20 Balken, 9 mit 50 Mio und 11 mit 200 Mio -> sortiert[10] = 200 Mio -> zulaessig; 11 mit 50, 9 mit 200 -> sortiert[10] = 50 -> raus. */
  function gemischt(nSchwach) { var r = reihe(25, 100, 2000000, NOW); for (var k = 0; k < nSchwach; k++) r[24 - k][2] = 500000; return r; }
  var ew = lauf(welt(s.concat([{ sym: 'MD9', gp: 700, reihe: gemischt(9) }, { sym: 'MD11', gp: 700, reihe: gemischt(11) }])));
  ok('Median-Umsatz wie liquide.js (sortiert[n>>1]): 9 schwache Tage ok, 11 schwache Tage raus', !!rang(ew, 'MD9') && !rang(ew, 'MD11'));
  /* Schwelle ueber opts: umsatzMin 0 laesst auch U99 und OUM zu (kein Filter). */
  var e0 = lauf(w, { umsatzMin: 0 });
  ok('Schwelle: Gegenprobe umsatzMin 0 -> U99 und OUM zaehlen', !!rang(e0, 'U99') && !!rang(e0, 'OUM'));
})();

/* ---------- Gleichstand, deterministisch ---------- */
(function () {
  /* S03, S04 und S05 haben GP/A 0,30; Zielzahl 3 aus 9 Werten: S01 0,5, S02 0,4, dann der Gleichstand nach Kuerzel -> S03. */
  var gp = [500, 400, 300, 300, 300, 150, 100, 50, 0];
  var namen = ['S01', 'S02', 'S05', 'S03', 'S04', 'S06', 'S07', 'S08', 'S09'];      /* Eingabe bewusst durcheinander */
  var w = welt(namen.map(function (n) { return { sym: n, gp: gp[+n.slice(1) - 1] }; }));
  var e = lauf(w);
  gleich('Gleichstand: Rang nach Kuerzel aufsteigend (S03,S04,S05)', e.rangfolge.slice(2, 5).map(function (p) { return p.sym; }), ['S03', 'S04', 'S05']);
  gleich('Gleichstand: der Platz 3 geht an das kleinste Kuerzel', e.ziel, ['S01', 'S02', 'S03']);
  var w2 = welt(namen.slice().reverse().map(function (n) { return { sym: n, gp: gp[+n.slice(1) - 1] }; }));
  gleich('Gleichstand: unabhaengig von der Eingabereihenfolge', lauf(w2).ziel, e.ziel);
})();

/* ---------- Mindestzahl, Zielzahl, Obergrenze 30 (Standardkonfiguration: 100 Werte) ---------- */
function gross(n, extra) {
  var specs = [];
  for (var i = 0; i < n; i++) {
    var sym = 'Z' + ('000' + i).slice(-3);
    specs.push({ sym: sym, gp: 1000 - 5 * i });            /* GP/A = 1,000 - 0,005 i: Z000 vorn */
  }
  return welt(specs.concat(extra || []));
}
(function () {
  var w99 = gross(99), e99 = lauf(w99, { minWerte: undefined });
  ok('Mindestzahl: 99 rangierbare Werte -> zuWenig, ziel und rangfolge leer', e99.zuWenig === true && e99.ziel.length === 0 && e99.rangfolge.length === 0 && e99.korb.zulaessig === 99);
  var w100 = gross(100), e100 = lauf(w100, { minWerte: undefined });
  ok('Mindestzahl: 100 rangierbare Werte -> kein zuWenig', e100.zuWenig === false && e100.korb.zulaessig === 100);
  /* Terzil: ceil(100/3) = 34; Zielzahl min(30, 34) = 30; es sind die 30 mit hoechster GP/A: Z000..Z029. */
  ok('Zielzahl: 100 Werte -> Terzil 34, Ziel 30', e100.korb.terzil === 34 && e100.korb.zielzahl === 30 && e100.ziel.length === 30);
  gleich('Zielzahl: die 30 mit hoechster GP/A (Z000..Z029)', e100.ziel, e100.rangfolge.slice(0, 30).map(function (p) { return p.sym; }));
  ok('Zielzahl: erster Z000, letzter Z029', e100.ziel[0] === 'Z000' && e100.ziel[29] === 'Z029');
  var e300 = lauf(gross(300), { minWerte: undefined });
  ok('Obergrenze: 300 Werte -> Terzil 100, Ziel trotzdem 30', e300.korb.terzil === 100 && e300.ziel.length === 30);
  /* mit Finanzwerten im Panel zaehlen diese nicht fuer die Mindestzahl: 99 + 5 Banken -> 99 zulaessig -> zuWenig. */
  var banken = []; for (var b = 0; b < 5; b++) banken.push({ sym: 'B0' + b, gp: 990, sic: 6022 });
  var eB = lauf(gross(99, banken), { minWerte: undefined });
  ok('Mindestzahl: Finanzwerte zaehlen nicht mit (99 + 5 Banken -> zuWenig)', eB.zuWenig === true && eB.korb.finanz === 5 && eB.korb.zulaessig === 99);
  var eK = lauf(gross(99, [{ sym: 'KZZ', gp: 900, reihe: reihe(25, 100, 100, NOW) }]), { minWerte: undefined });
  ok('Mindestzahl: umsatzschwache Werte zaehlen nicht mit (99 + 1 -> zuWenig)', eK.zuWenig === true && eK.korb.unterSchwelle === 1);
  /* Der Standard-Default wirkt auch ohne opts.minWerte-Angabe. */
  var eD = Z.zielfunktion(w99.roh, { nowMs: NOW, fundamental: w99.fund, sic: w99.sic });
  ok('Mindestzahl: Standard ohne opts.minWerte ist 100', eD.zuWenig === true);
})();

/* ---------- Placebo ---------- */
(function () {
  var w = gross(120), o = { nowMs: NOW, fundamental: w.fund, sic: w.sic };
  var p1 = Z.placeboZiel(w.roh, o), p2 = Z.placeboZiel(w.roh, o);
  gleich('Placebo: deterministisch (zwei Aufrufe gleich)', p1.ziel, p2.ziel);
  ok('Placebo: Zielzahl wie die Regel (30), keine Doppelten', p1.ziel.length === 30 && new Set(p1.ziel).size === 30 && p1.korb.zielzahl === 30);
  var sig = Z.zielfunktion(w.roh, o);
  var sigSet = {}; sig.rangfolge.forEach(function (p) { sigSet[p.sym] = true; });
  ok('Placebo: wahlt nur aus dem Universum der Regel (alle in der Rangfolge)', p1.ziel.every(function (s) { return sigSet[s]; }));
  gleich('Placebo: gleiche Rangfolge/Universum wie die Regel', p1.rangfolge.map(function (p) { return p.sym; }), sig.rangfolge.map(function (p) { return p.sym; }));
  ok('Placebo: nicht dieselbe Auswahl wie GP/A (zufaellig, nicht Top 30)', JSON.stringify(p1.ziel.slice().sort()) !== JSON.stringify(sig.ziel.slice().sort()));
  /* Eingabereihenfolge egal. */
  var roh2 = {}; Object.keys(w.roh).reverse().forEach(function (k) { roh2[k] = w.roh[k]; });
  gleich('Placebo: unabhaengig von der Eingabereihenfolge', Z.placeboZiel(roh2, o).ziel, p1.ziel);
  /* Unabhaengig vom Signal: dreht man ALLE GP/A um, bleibt die Placebo-Auswahl gleich, die Regel aendert sich. */
  var wr = gross(120), fr = {};
  Object.keys(wr.fund).forEach(function (k, i) { fr[k] = [fy('2021-02-20', '2020-12-31', gpa(1000 - 5 * (119 - i)))]; });
  var pr = Z.placeboZiel(wr.roh, { nowMs: NOW, fundamental: fr, sic: wr.sic });
  gleich('Placebo: GP/A umgekehrt aendert die Auswahl nicht (Kontrolle ohne Signalbezug)', pr.ziel, p1.ziel);
  ok('Placebo: Gegenprobe - die Regel selbst aendert sich bei umgekehrter GP/A', JSON.stringify(Z.zielfunktion(wr.roh, { nowMs: NOW, fundamental: fr, sic: wr.sic }).ziel) !== JSON.stringify(sig.ziel));
  /* Seed haengt am Stichtag. */
  var rollen = {}, verschieden = 0, last = null;
  var w2 = gross(120);
  for (var d2 = 0; d2 < 300; d2++) {
    var nm = NOW + d2 * TAG, wd = {};
    Object.keys(w2.roh).forEach(function (k) { wd[k] = liquide(nm); });
    var pz2 = Z.placeboZiel(wd, { nowMs: nm, fundamental: w2.fund, sic: w2.sic, maxTtmAlterTage: 5000 });
    pz2.ziel.forEach(function (s) { rollen[s] = (rollen[s] || 0) + 1; });
    var key = pz2.ziel.slice().sort().join(',');
    if (last !== null && key !== last) verschieden++;
    last = key;
  }
  ok('Placebo: der Seed haengt am Stichtag (an 299 Folgetagen 299 verschiedene Ziehungen)', verschieden === 299);
  var minH = 1, maxH = 0; Object.keys(rollen).forEach(function (k) { var h = rollen[k] / 300; if (h < minH) minH = h; if (h > maxH) maxH = h; });
  ok('Placebo: Gleichverteilung - 120 Werte, jeder in 300 Ziehungen mit Haeufigkeit 0,12..0,40 (Soll 0,25)', Object.keys(rollen).length === 120 && minH > 0.12 && maxH < 0.40);
  /* Das feste Wort geht in den Seed ein: anderes Wort -> andere Ziehung (am selben Tag). */
  var altWort = Z.KONFIG.PLACEBO_WORT; Z.KONFIG.PLACEBO_WORT = 'anderes-wort';
  var pw = Z.placeboZiel(w.roh, o); Z.KONFIG.PLACEBO_WORT = altWort;
  ok('Placebo: das feste Wort geht in den Seed ein', JSON.stringify(pw.ziel) !== JSON.stringify(p1.ziel));
  ok('Placebo: Wort ist "qualitaet-gpa-placebo"', altWort === 'qualitaet-gpa-placebo');
  var pw2 = Z.placeboZiel(w.roh, { nowMs: NOW, fundamental: w.fund, sic: w.sic, placeboWort: 'anderes-wort' });
  gleich('Placebo: opts.placeboWort wirkt wie das Wort in KONFIG (gleicher Seed)', pw2.ziel, pw.ziel);
  var fam = {}; for (var fi = 1; fi <= 20; fi++) fam[Z.placeboZiel(w.roh, { nowMs: NOW, fundamental: w.fund, sic: w.sic, placeboWort: Z.KONFIG.PLACEBO_WORT + '-' + ('0' + fi).slice(-2) }).ziel.slice().sort().join(',')] = 1;
  ok('Placebo-Familie: 20 Woerter -> 20 verschiedene Ziehungen', Object.keys(fam).length === 20);
  /* Hilfsfunktionen: FNV-1a("a") = 0xe40c292c (bekannter Wert), PRNG in [0,1) und deterministisch. */
  ok('fnv1a("a") = 0xe40c292c (FNV-1a 32 bit)', Z._intern.fnv1a('a') === 0xe40c292c);
  var r1 = Z._intern.mulberry32(42), r2 = Z._intern.mulberry32(42), alleIn = true, gleichAb = true;
  for (var i = 0; i < 1000; i++) { var a = r1(), b2 = r2(); if (!(a >= 0 && a < 1)) alleIn = false; if (a !== b2) gleichAb = false; }
  ok('PRNG: Werte in [0,1), gleicher Seed gleiche Folge', alleIn && gleichAb);
  /* Placebo uebernimmt alle Ausschluesse: Banken, ohne Bilanz, umsatzschwach nie im Placebo-Ziel; zuWenig wie die Regel. */
  var ex = gross(120, [{ sym: 'BNK', gp: 900, sic: 6021 }, { sym: 'OHN', gp: 0, eintraege: [] }, { sym: 'SCH', gp: 900, reihe: reihe(25, 100, 100, NOW) }]);
  var pe = Z.placeboZiel(ex.roh, { nowMs: NOW, fundamental: ex.fund, sic: ex.sic });
  ok('Placebo: Bank, Wert ohne Bilanz und umsatzschwacher Wert werden nie gezogen', pe.korb.zulaessig === 120 && pe.ziel.indexOf('BNK') < 0 && pe.ziel.indexOf('OHN') < 0 && pe.ziel.indexOf('SCH') < 0);
  ok('Placebo: Ausschlussgruende wie bei der Regel (finanz 1, ohneBilanz 1, unterSchwelle 1)', pe.korb.finanz === 1 && pe.korb.ohneBilanz === 1 && pe.korb.unterSchwelle === 1);
  var pz = Z.placeboZiel(gross(99).roh, { nowMs: NOW, fundamental: gross(99).fund, sic: gross(99).sic });
  ok('Placebo: unter 100 rangierbaren Werten zuWenig, nicht handeln', pz.zuWenig === true && pz.ziel.length === 0);
  /* Kleines Universum: Zielzahl = Terzil (3 von 9), Placebo zieht 3 aus 9. */
  var pk = lauf(basis(), {}, Z.placeboZiel);
  ok('Placebo: Zielzahl folgt dem Terzil bei kleinem Universum (3 aus 9)', pk.ziel.length === 3 && pk.ziel.every(function (s) { return /^S0[1-9]$/.test(s); }));
})();

/* ---------- Ende ---------- */
console.log('\n' + (gut + schlecht) + ' Pruefungen, ' + gut + ' gut, ' + schlecht + ' schlecht');
if (schlecht) process.exit(1);
