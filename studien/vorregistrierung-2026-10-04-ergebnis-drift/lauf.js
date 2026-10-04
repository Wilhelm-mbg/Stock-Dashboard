'use strict';
/* Ergebnis-Drift tagesgenau - der EINE Lauf (Auftrag Nr. 88): Stufe 1 (die Groessen der Muehle) und Stufe 2 (das Buch gegen SPY).
 *
 *   node --max-old-space-size=6144 lauf.js --blind [--probe-aus <datei>]
 *        VOR dem Siegel. Die Ueberraschung wird NICHT geladen. Rechnet Pruefsummen, Zaehlungen, die 200 Zufallslaeufe (Zufallszahl an
 *        Stelle der Ueberraschung), daraus MDE und Tor-Wahrscheinlichkeiten des Messfensters, die Pruefungen am echten Panel
 *        (Massstab, Buch ohne Signal, Wiederholbarkeit, punkt-in-zeit) und eine Generalprobe des ganzen Berichts mit einer weiteren
 *        Zufallszahl als "Signal". Schreibt blind.json.
 *   node --max-old-space-size=6144 lauf.js
 *        Der eine Lauf. Startet nur nach dem Siegel (siegel.js). Schreibt ergebnis.json und ERGEBNIS.md.
 *
 * Nur lesen ausser diesen Dateien im eigenen Ordner. Simulation mit virtuellem Kapital, keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var KF = require('./konfig.js');
var ME = require('./messung.js');
var GR = require('./groessen.js');
var ZE = require('./zehntel.js');
var SI = require('./siegel.js');

var KORREKTUREN = [];               /* jeder nach dem Siegel behobene Fehler im Code wird hier vermerkt (sonst leer) */
var PROBE_LAUF = 999;               /* Startwert-Versatz der Generalprobe (kein Teil der 200 Zufallslaeufe) */

function de(x, n) { return x.toFixed(n === undefined ? 2 : n).replace('.', ',').replace('-', '−'); }
function vz(x, n) { return (x >= 0 ? '+' : '−') + Math.abs(x).toFixed(n === undefined ? 2 : n).replace('.', ','); }
function ganz(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function datumDe(d) { var p = String(d).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }

/* ---------- Zaehlungen der Ereignismenge (ohne Ertrag, ohne Signalwert) ---------- */
function zaehlungen(L, C) {
  var grenzen = {}, zt = ME.zuteilung(C, ME.zufallswerte(C.n, 0), grenzen), tage = Object.keys(grenzen).map(Number);
  var groessen = tage.map(function (t) { return grenzen[t].n; }), ohne = 0, verletzt = 0, jeKlasse = {}, firmen = {}, i;
  tage.forEach(function (t) { var x = grenzen[t]; if (x.n && (x.bisTag >= t || x.vonTag < t - KF.VERGLEICH_TAGE)) verletzt++; });
  for (i = 0; i < C.n; i++) {
    if (zt[i] === ZE.KEIN_SIGNAL) ohne++;
    if (C.tag[i] >= C.von) { var k = L.PK.KLASSEN[C.ereignisse[i].klasse].name; jeKlasse[k] = (jeKlasse[k] || 0) + 1; firmen[C.ereignisse[i].cik] = 1; }
  }
  var gueltig = {}, streuung = {}, jeJahr = {}, jeMonatLetztesJahr = {}, letzter = -1, nur63 = 0;
  KF.HORIZONTE.forEach(function (h) {
    var w = []; for (i = 0; i < C.n; i++) if (zt[i] >= -1 && isFinite(C.H[h].ev.x[i])) w.push(C.H[h].ev.x[i]);
    gueltig['H' + h] = w.length; streuung['H' + h] = GR.sd(w);          /* Streuung ueber ALLE Ereignisse - blind, kein Mittel */
  });
  for (i = 0; i < C.n; i++) {
    if (C.tag[i] < C.von) { if (C.tag[i] >= C.von - KF.VERGLEICH_TAGE) nur63++; continue; }
    var dat = String(L.T.kal.tage[C.tag[i]]);
    jeJahr[dat.slice(0, 4)] = (jeJahr[dat.slice(0, 4)] || 0) + 1;
    if (dat.slice(0, 4) === KF.FENSTER_BIS.slice(0, 4)) jeMonatLetztesJahr[dat.slice(0, 7)] = (jeMonatLetztesJahr[dat.slice(0, 7)] || 0) + 1;
    if (C.tag[i] > letzter) letzter = C.tag[i];
  }
  return { ereignisseHauptklassen: C.n, ereignisseAlleKlassen: L.alleKlassen, erwartet: KF.EREIGNISSE_ERWARTET, abweichung: C.n / KF.EREIGNISSE_ERWARTET - 1,
    imMessfenster: C.imFenster, vorDemFenster: C.vorFenster, nurVergleich63TageVorDemFenster: nur63, jeJahrImFenster: jeJahr, jeMonatImLetztenJahr: jeMonatLetztesJahr,
    letzterEinstiegstag: String(L.T.kal.tage[letzter]), streuungBereinigterErtrag: streuung,
    einstiegstageImFenster: tage.length, firmenImFenster: Object.keys(firmen).length, jeKlasseImFenster: jeKlasse,
    vergleichsmenge: { kleinste: Math.min.apply(null, groessen), mitte: ME.quantil(groessen, 0.5), groesste: Math.max.apply(null, groessen),
      tageUnterMindestens: groessen.filter(function (x) { return x < KF.VERGLEICH_MINDESTENS; }).length, ereignisseOhneSignal: ohne, verletzungenPunktInZeit: verletzt },
    mitSignalUndAbgeschlossenemFenster: gueltig, zaehlerBau: L.zaehler };
}

/* ---------- BLIND: MDE und Tor aus den Zufallslaeufen (kein Mittel eines Ertrags verlaesst diese Funktion) ---------- */
function blindZahlen(Z, h) {
  var laeufe = Z.g[h], zf = GR.zufallsFehler(laeufe), m = GR.mde(zf, KF.MDE_FAKTOR), kosten = GR.mittel(laeufe.map(function (g) { return g.kostenOben; }));
  var aus = { H: h, laeufe: laeufe.length, nObenMittel: GR.mittel(laeufe.map(function (g) { return g.nOben; })), nAlle: laeufe[0].nAlle,
    tageObenMittel: GR.mittel(laeufe.map(function (g) { return g.tageOben; })), kostenObenMittel: kosten, fehler: m,
    positivkontrolle: ME.positivkontrolle(laeufe, zf) };
  if (h === KF.H_HAUPT) {
    aus.tor = [['Nullfall', 0, 0], ['Kaufseite 2 Pp, Abstand 4 Pp', 4, 2], ['Kaufseite 2 Pp allein (Abstand 2 Pp)', 2, 2], ['Kaufseite 1 Pp, Abstand 2 Pp', 2, 1],
      ['Kaufseite 1 Pp allein (Abstand 1 Pp)', 1, 1]].map(function (s) {
      var sim = GR.torAnteil(laeufe, zf, s[1], s[2], KF.TOR_T);
      return { fall: s[0], A: s[1], B: s[2], anteilLaeufe: sim,
        normal: { A: ME.AU.macht(s[1], m.A.fehler, KF.TOR_T), Bnetto: ME.AU.macht(s[2] - kosten, m.Bnetto.fehler, KF.TOR_T) } };
    });
  }
  return aus;
}

/* ---------- Stufe 1 fuer eine Zuteilung ---------- */
function stufe1Bericht(C, zt, Z, h) {
  var G = ME.stufe1(C, zt, h), zf = GR.zufallsFehler(Z.g[h]), F = GR.mitFehler(G, zf), m = GR.mde(zf, KF.MDE_FAKTOR);
  var ztP = ME.placeboZuteilung(C, zt), GP = ME.stufe1(C, ztP, h), FP = GR.mitFehler(GP, zf);
  return { H: h, nOben: G.nOben, nUnten: G.nUnten, nAlle: G.nAlle, tageOben: G.tageOben, A: G.A, B: G.B, Bnetto: G.Bnetto, M: G.M, BM: G.BM, kostenOben: G.kostenOben,
    fehler: F.fehler, fehlerQuelle: F.quelle, t: F.t, fehlerZufall: zf.zufall, fehlerTagesreihe: G.nw,
    obereSchrankeBnetto: G.Bnetto + KF.SCHRANKE_Z * F.fehler.Bnetto, mdeA: m.A.mde, mdeB: m.B.mde,
    placebo: { nOben: GP.nOben, nUnten: GP.nUnten, A: GP.A, BM: GP.BM, fehlerA: FP.fehler.A, fehlerBM: FP.fehler.BM, tA: FP.t.A, tBM: FP.t.BM },
    positivkontrolle: ME.positivkontrolle(Z.g[h], zf) };
}

/* ---------- Stufe 2 fuer eine Zuteilung ---------- */
function stufe2Bericht(C, zt, wert, Z, MS) {
  var T = C.T, b = ME.buch(C, zt, wert, true), zz = b.zaehler;
  var jahre = (C.Q.ms[C.bis] - C.Q.ms[C.von]) / (365.25 * 86400000);
  if (Math.abs(b.massstabEnde - MS.endwert) > 1e-6 * MS.endwert) throw new Error('KLINKE: Massstab aus der Zerlegung ungleich Massstab');
  if (Math.abs(b.beitragSumme - b.abstand) > 1e-6 * MS.endwert) throw new Error('KLINKE: Beitraege summieren sich nicht zum Abstand');
  var tage = b.tage.map(function (x, i) { if (MS.tage[i].tag !== x.tag) throw new Error('KLINKE: Tagesreihen laufen auseinander'); return { tag: x.tag, buch: x.buch, spy: MS.tage[i].spy }; });
  var ges = Z.buecher.map(function (x) { return (x.endwert / KF.START - 1) * 100; });
  var ueber = Z.buecher.filter(function (x) { return x.endwert > b.endwert; }).length, ja = b.endwert > MS.endwert;
  var pos = b.positionen.slice().sort(function (x, y) { return y.beitrag - x.beitrag; });
  var top = pos.slice(0, 10).map(function (p) {
    return { reihe: p.name, einstieg: String(T.kal.tage[p.seitTag]), ausstieg: p.offen ? null : String(T.kal.tage[p.ausTag]), art: p.offen ? 'offen' : p.ausArt,
      einstand: p.einstand, beitrag: p.beitrag };
  });
  var zTop = Z.buecher.map(function (x) { return x.top10Summe; });
  return {
    schlaegt: ja, buchEnde: b.endwert, spyEnde: MS.endwert, buchGesamt: (b.endwert / KF.START - 1) * 100, spyGesamt: (MS.endwert / KF.START - 1) * 100,
    buchPa: ME.proJahr(b.endwert, jahre), spyPa: ME.proJahr(MS.endwert, jahre), abstandPa: ME.proJahr(b.endwert, jahre) - ME.proJahr(MS.endwert, jahre), jahre: jahre,
    zufall: { buecher: Z.buecher.length, ueberDemBuch: ueber, mitteGesamt: ME.quantil(ges, 0.5), p5Gesamt: ME.quantil(ges, 0.05), p95Gesamt: ME.quantil(ges, 0.95),
      ueberDemMassstab: Z.buecher.filter(function (x) { return x.endwert > MS.endwert; }).length,
      gekauftMitte: ME.quantil(Z.buecher.map(function (x) { return x.gekauft; }), 0.5), plaetzeMitte: ME.quantil(Z.buecher.map(function (x) { return x.plaetzeMittel; }), 0.5) },
    vorwaertstestAngezeigt: ja && ueber <= KF.VORWAERTSTEST_HOECHSTENS,
    meldungenObersteZehntel: zz.meldungen, gekauft: zz.gekauft, teilkauf: zz.teilkauf, verfallenPlaetzeVoll: zz.verfallenPlaetzeVoll, verfallenKeinSpy: zz.verfallenKeinSpy,
    ohneEroeffnung: zz.ohneEroeffnung, schonGehalten: zz.schonGehalten, verkauft: zz.verkauft, verkaufVerschoben: zz.verkaufVerschoben, reihenenden: zz.reihenenden,
    totalverluste: zz.totalverluste, offeneAmEnde: b.offeneAmEnde, lueckentage: zz.lueckentage, plaetzeMittel: b.plaetzeMittel, plaetzeMax: zz.maxPlaetze,
    aktienAnteilMittel: b.aktienAnteilMittel * 100, kostenAktien: zz.kostenAktien, kostenSpy: zz.kostenSpy, kostenGesamt: zz.kostenAktien + zz.kostenSpy, volumenAktien: zz.volumenAktien,
    ausschuettungenAktien: zz.ausschuettungen, ausschuettungSummeAktien: zz.ausschuettungSumme, ausschuettungenSpy: zz.spyAusschuettungen,
    rueckschlagBuch: C.RB.maxRueckschlag(tage.map(function (x) { return x.buch; })), rueckschlagSpy: C.RB.maxRueckschlag(tage.map(function (x) { return x.spy; })),
    kalenderjahre: C.RB.kalenderjahre(T, { tage: tage }),
    abstandDollar: b.abstand, top10: top, top10Summe: b.top10Summe, endeOhneTop10: b.endwert - b.top10Summe,
    abstandPaOhneTop10: ME.proJahr(b.endwert - b.top10Summe, jahre) - ME.proJahr(MS.endwert, jahre),
    zufallTop10: { mitte: ME.quantil(zTop, 0.5), p5: ME.quantil(zTop, 0.05), p95: ME.quantil(zTop, 0.95), groesserAlsImBuch: zTop.filter(function (x) { return x > b.top10Summe; }).length },
  };
}

/* ---------- Bericht (eine Seite) ---------- */
function satzStufe2(S2) {
  return 'Im Rückblick über fünf Jahre (' + datumDe(KF.FENSTER_VON) + ' bis ' + datumDe(KF.FENSTER_BIS) + ') schlägt das Ergebnis-Drift-Buch den S&P 500 nach Kosten: **' +
    (S2.schlaegt ? 'ja' : 'nein') + '** — Buch ' + vz(S2.buchGesamt, 1) + ' % (' + de(S2.buchPa) + ' % p. a.), S&P 500 ' + vz(S2.spyGesamt, 1) + ' % (' + de(S2.spyPa) +
    ' % p. a.), Abstand ' + vz(S2.abstandPa) + ' Pp p. a.; von ' + S2.zufall.buecher + ' Zufallsbüchern liegen ' + S2.zufall.ueberDemBuch + ' über dem Buch (Mitte ' +
    vz(S2.zufall.mitteGesamt, 1) + ' %, 5 %–95 %: ' + vz(S2.zufall.p5Gesamt, 1) + ' bis ' + vz(S2.zufall.p95Gesamt, 1) + ' %). ' +
    (S2.vorwaertstestAngezeigt ? '**Vorwärtstest angezeigt.**' : '**Kein Vorwärtstest angezeigt.**');
}
function satzStufe1(U, a, b) {
  function eine(x) {
    return 'A ' + vz(x.A) + ' Pp (t ' + de(x.t.A) + '), B ' + vz(x.B) + ' Pp (t ' + de(x.t.B) + '), B netto ' + vz(x.Bnetto) + ' Pp (t ' + de(x.t.Bnetto) + ', obere 95-%-Schranke ' +
      vz(x.obereSchrankeBnetto) + ' Pp), M ' + vz(x.M) + ' Pp, B − M ' + vz(x.BM) + ' Pp (t ' + de(x.t.BM) + ')';
  }
  return 'Urteil der Stufe 1 (Abstand zum Klassen-Tagesmittel, Ereignis-Mittel, Tor t ≥ 2,5 bei H = 60 für A und B netto): **' + U.urteil + '** — H = 60: ' + eine(a) +
    '; daneben H = 20: ' + eine(b) + '. (' + U.grund + '.)';
}
function bericht(E) {
  var S2 = E.stufe2, a = E.stufe1.H60, b = E.stufe1.H20, Z = [];
  Z.push(satzStufe2(S2));
  Z.push('');
  Z.push(satzStufe1(E.urteil, a, b));
  Z.push('');
  Z.push('*Auftrag Nr. 88, Kennung `' + E.kennung + '`, Regel in `VORREGISTRIERUNG.md` (Siegel-Commit `' + String(E.siegel.commit).slice(0, 7) + '`, vor dem Lauf). Einstiegstage ' +
    datumDe(KF.VERSCHLOSSEN_VON) + ' bis ' + datumDe(KF.VERSCHLOSSEN_BIS) + ' bleiben verschlossen. Simulation mit virtuellem Kapital, keine Anlageberatung.*');
  Z.push('');
  Z.push('| Stufe 1 | n oben / unten / alle | A | B | B netto | M | B − M | Fehler A / B netto | t A / B netto | obere Schranke B netto | MDE A / B (blind) |');
  Z.push('|---|---|---|---|---|---|---|---|---|---|---|');
  [a, b].forEach(function (x) {
    Z.push('| H = ' + x.H + ' | ' + x.nOben + ' / ' + x.nUnten + ' / ' + x.nAlle + ' | ' + vz(x.A) + ' | ' + vz(x.B) + ' | ' + vz(x.Bnetto) + ' | ' + vz(x.M) + ' | ' + vz(x.BM) + ' | ' +
      de(x.fehler.A) + ' / ' + de(x.fehler.Bnetto) + ' | ' + de(x.t.A) + ' / ' + de(x.t.Bnetto) + ' | ' + vz(x.obereSchrankeBnetto) + ' | ' + de(x.mdeA) + ' / ' + de(x.mdeB) + ' |');
  });
  Z.push('');
  Z.push('Alle Größen in Pp über die Haltedauer; Kosten des obersten Zehntels im Mittel ' + de(a.kostenOben, 3) + ' Pp je Umlauf. Fehler = der größere aus 200 Zufalls-Zuteilungen und der Tagesreihe (Newey-West, Lag H − 1).');
  Z.push('');
  Z.push('**Placebo und Positivkontrolle (H = 60).** Placebo (letzte Ziffer der Akzessionsnummer): A ' + vz(a.placebo.A) + ' Pp (' + vz(a.placebo.tA) + ' eigene Fehler), B − M ' + vz(a.placebo.BM) +
    ' Pp (' + vz(a.placebo.tBM) + ' eigene Fehler) — Soll innerhalb ±2: ' + (E.urteil.placeboBestanden ? 'eingehalten' : 'NICHT eingehalten') + '. Positivkontrolle: ein eingepflanzter Abstand von ' +
    de(a.positivkontrolle.eingepflanzt) + ' Pp (MDE) erreicht t ≥ 2 in ' + de(a.positivkontrolle.anteil * 100, 1) + ' % der Zufallsläufe (mindestens 65 %): ' + (a.positivkontrolle.bestanden ? 'bestanden' : 'NICHT bestanden') +
    '. H = 20: Placebo A ' + vz(b.placebo.tA) + ' / B − M ' + vz(b.placebo.tBM) + ' eigene Fehler, Positivkontrolle ' + de(b.positivkontrolle.anteil * 100, 1) + ' %.');
  Z.push('');
  Z.push('| Stufe 2 | Buch | S&P 500 (SPY) | Abstand |');
  Z.push('|---|---|---|---|');
  Z.push('| Endwert aus 100.000 $ | ' + ganz(S2.buchEnde) + ' $ | ' + ganz(S2.spyEnde) + ' $ | ' + (S2.abstandDollar >= 0 ? '+' : '−') + ganz(Math.abs(S2.abstandDollar)) + ' $ |');
  Z.push('| p. a. (' + de(S2.jahre, 3) + ' Jahre) | ' + vz(S2.buchPa) + ' % | ' + vz(S2.spyPa) + ' % | ' + vz(S2.abstandPa) + ' Pp |');
  S2.kalenderjahre.forEach(function (j) { Z.push('| ' + j.jahr + ' | ' + vz(j.buch) + ' % | ' + vz(j.spy) + ' % | ' + vz(j.abstand) + ' Pp |'); });
  Z.push('| größter Rückschlag (Tagesschlüsse) | ' + vz(S2.rueckschlagBuch) + ' % | ' + vz(S2.rueckschlagSpy) + ' % | |');
  Z.push('');
  Z.push('**Das Buch.** ' + S2.meldungenObersteZehntel + ' Meldungen des obersten Zehntels: ' + S2.gekauft + ' gekauft (davon ' + S2.teilkauf + ' mit dem Rest des SPY-Bestands), ' +
    S2.verfallenPlaetzeVoll + ' verfallen (alle Plätze besetzt), ' + S2.verfallenKeinSpy + ' verfallen (kein SPY-Bestand), ' + S2.schonGehalten + ' Firma schon gehalten, ' + S2.ohneEroeffnung +
    ' ohne Eröffnungskurs. ' + S2.verkauft + ' Verkäufe am 60. Handelstag (' + S2.verkaufVerschoben + ' verschoben mangels Eröffnungskurs), ' + S2.reihenenden + ' Reihenenden (davon ' + S2.totalverluste +
    ' Totalverlust), ' + S2.offeneAmEnde + ' offen am Ende. Im Mittel ' + de(S2.plaetzeMittel, 1) + ' von ' + KF.PLAETZE + ' Plätzen besetzt (höchstens ' + S2.plaetzeMax + '), ' + de(S2.aktienAnteilMittel, 1) +
    ' % des Kapitals in Aktien. Gezahlte Kosten ' + ganz(S2.kostenGesamt) + ' $ (Aktien ' + ganz(S2.kostenAktien) + ' $, SPY-Handel ' + ganz(S2.kostenSpy) + ' $). Zufallsbücher: ' + S2.zufall.ueberDemMassstab + ' von ' +
    S2.zufall.buecher + ' über dem S&P 500.');
  Z.push('');
  Z.push('**Die zehn Positionen mit dem größten Beitrag** tragen zusammen ' + ganz(S2.top10Summe) + ' $ zum Abstand von ' + (S2.abstandDollar >= 0 ? '+' : '−') + ganz(Math.abs(S2.abstandDollar)) +
    ' $; ohne sie stünde das Buch bei ' + ganz(S2.endeOhneTop10) + ' $ (' + vz(S2.abstandPaOhneTop10) + ' Pp p. a. gegen den S&P 500). In den Zufallsbüchern beträgt dieselbe Summe in der Mitte ' +
    ganz(S2.zufallTop10.mitte) + ' $ (5 %–95 %: ' + ganz(S2.zufallTop10.p5) + ' bis ' + ganz(S2.zufallTop10.p95) + ' $), in ' + S2.zufallTop10.groesserAlsImBuch + ' von ' + S2.zufall.buecher + ' ist sie größer als im Buch. ' +
    S2.top10.map(function (p) { return p.reihe + ' ' + p.einstieg.slice(0, 7) + ' ' + (p.beitrag >= 0 ? '+' : '−') + ganz(Math.abs(p.beitrag)); }).join(' · ') + '.');
  Z.push('');
  Z.push('**Grenzen.** Ein Fenster, eine Regel, ein Lauf. Zeitreihen-Überraschung aus dem später eingereichten Bericht, kein Analysten-Konsens; Annahmezeit der SEC statt Uhrzeit der Mitteilung; ' +
    '2016, die ausländischen Werte ohne 8-K und 203 Firmen mit Kennungswechsel fehlen; SPY-Handelskosten 0,5 Basispunkte sind eine Annahme. Stufe 1 misst gegen das Klassen-Tagesmittel, Stufe 2 gegen den Index mit Kapitalbindung. ' +
    'Ereignisse: ' + E.zaehlungen.imMessfenster + ' im Messfenster (' + E.zaehlungen.ereignisseHauptklassen + ' seit 2017, erwartet ' + KF.EREIGNISSE_ERWARTET + '). Korrekturen nach dem Siegel: ' +
    (E.korrekturen.length ? E.korrekturen.length : 'keine') + '. Alle Zahlen in `ergebnis.json`.');
  return Z.join('\n') + '\n';
}

/* ---------- Pruefungen am echten Panel (nur im Blind-Modus; ohne Ueberraschung) ---------- */
function panelPruefungen(C, MS) {
  var leer = new Int8Array(C.n), w0 = ME.zufallswerte(C.n, 0);
  var ohne = ME.buch(C, leer, w0, false), zt0 = ME.zuteilung(C, w0), b1 = ME.buch(C, zt0, w0, true), b2 = ME.buch(C, ME.zuteilung(C, ME.zufallswerte(C.n, 0)), ME.zufallswerte(C.n, 0), false);
  var spaet = b1.handel.filter(function (h) { return h.art === 'verkauf'; }).length;
  /* Handprobe der Machbarkeit (30 Meldungen, vom PM abgenommen): dieselbe Reihe und derselbe Einstiegstag je Akzessionsnummer */
  var hp = JSON.parse(fs.readFileSync(path.join(KF.MACHBARKEIT, 'handprobe-auswahl.json'), 'utf8')), jeAkz = {}, hpGleich = 0;
  C.ereignisse.forEach(function (e) { jeAkz[e.a + '|' + e.cik] = e; });
  hp.forEach(function (x) { var e = jeAkz[x.akzession + '|' + x.cik]; if (e && C.T.symName[e.sym] === x.reihe && String(C.T.kal.tage[e.E]) === x.einstiegstag && e.t === x.annahme) hpGleich++; });
  return {
    handprobeMachbarkeit: hp.length, handprobeGleich: hpGleich,
    massstabEnde: MS.endwert, massstabSoll: KF.MASSSTAB_SOLL, massstabTrifft: Math.abs(MS.endwert - KF.MASSSTAB_SOLL) < 0.005,
    buchOhneSignal: ohne.endwert, buchOhneSignalGleichMassstab: ohne.endwert === MS.endwert && ohne.zaehler.gekauft === 0,
    zufallsbuchZweimalGleich: b1.endwert === b2.endwert && b1.zaehler.gekauft === b2.zaehler.gekauft,
    zerlegungStimmt: Math.abs(b1.beitragSumme - b1.abstand) < 1e-6 * MS.endwert && Math.abs(b1.massstabEnde - MS.endwert) < 1e-6 * MS.endwert,
    plaetzeNieUeber: b1.zaehler.maxPlaetze <= KF.PLAETZE, verkaeufeImZufallsbuch0: spaet,
    spyNieNegativ: b1.spyStueckEnde >= 0,
  };
}

function main() {
  var blind = process.argv.indexOf('--blind') !== -1, t0 = Date.now(), siegel = null, B = null;
  if (!blind) {
    siegel = SI.pruefe();                                        /* wirft ohne Siegel */
    B = JSON.parse(fs.readFileSync(path.join(__dirname, 'blind.json'), 'utf8'));
    ME.sag('Siegel ' + siegel.commit.slice(0, 7) + ' (' + siegel.betreff + ')');
  }
  var summen = ME.pruefsummen();
  if (B && (summen.auszug !== B.pruefsummen.auszug || summen.tafel.gesamt !== B.pruefsummen.tafel.gesamt || summen.panel.gesamt !== B.pruefsummen.panel.gesamt)) {
    throw new Error('ABBRUCH (Regel 5): Auszug, Tafel oder Panel tragen eine andere Pruefsumme als bei der Registrierung');
  }
  var L = ME.lade({ mitUeberraschung: !blind }), C = ME.kontext(L);
  C.RB = L.RB;
  var mitU = L.ereignisse.filter(function (e) { return 'u' in e; }).length;
  if (blind && mitU) throw new Error('BLINDHEIT: im Blind-Modus traegt ein Ereignis die Ueberraschung');
  if (!blind && mitU !== C.n) throw new Error('Ereignis ohne Ueberraschung im Lauf');
  var zl = zaehlungen(L, C);
  if (Math.abs(zl.abweichung) > KF.EREIGNISSE_TOLERANZ) throw new Error('ABBRUCH (Regel 3): Ereigniszahl ' + C.n + ' weicht um mehr als 1 % von ' + KF.EREIGNISSE_ERWARTET + ' ab');
  if (zl.vergleichsmenge.verletzungenPunktInZeit) throw new Error('KLINKE: Vergleichsmenge nicht punkt-in-zeit');
  var MS = ME.massstab(C);
  if (Math.abs(MS.endwert - KF.MASSSTAB_SOLL) >= 0.005) throw new Error('KLINKE: Massstab ' + MS.endwert + ' trifft ' + KF.MASSSTAB_SOLL + ' nicht');
  ME.sag('Massstab ' + MS.endwert.toFixed(2) + ' $; Zufallslaeufe ...');
  var Z = ME.zufallslaeufe(C, { buecher: true, melde: true });

  /* das Signal: im Lauf die Ueberraschung, im Blind-Modus eine weitere Zufallszahl (Generalprobe) */
  var wert = blind ? ME.zufallswerte(C.n, PROBE_LAUF) : Float64Array.from(L.ereignisse.map(function (e) { return e.u; }));
  var zt = ME.zuteilung(C, wert);
  var s60 = stufe1Bericht(C, zt, Z, KF.H_HAUPT), s20 = stufe1Bericht(C, zt, Z, KF.H_ZWEIT);
  var U = ME.urteil({ tA: s60.t.A, tBnetto: s60.t.Bnetto, Bnetto: s60.Bnetto, fehlerBnetto: s60.fehler.Bnetto, BM: s60.BM, placeboTA: s60.placebo.tA, placeboTBM: s60.placebo.tBM,
    positivAnteil: s60.positivkontrolle.anteil });
  var S2 = stufe2Bericht(C, zt, wert, Z, MS);
  var E = { kennung: KF.KENNUNG, erzeugt: new Date().toISOString(), siegel: siegel || { commit: 'GENERALPROBE', betreff: 'blind' }, panel: L.T.stand.kennung, tafel: L.tafelKennung,
    pruefsummen: { auszug: summen.auszug, tafel: summen.tafel.gesamt, panel: summen.panel.gesamt }, zaehlungen: zl,
    urteil: U, stufe1: { H60: s60, H20: s20 }, stufe2: S2, zufallsbuecherEndwerte: Z.buecher.map(function (x) { return x.endwert; }),
    korrekturen: KORREKTUREN, laufzeitSekunden: 0 };

  if (blind) {
    var probeText = bericht(E);                                  /* Generalprobe des Berichts; der Text wird nur auf Wunsch geschrieben */
    var BL = { kennung: KF.KENNUNG, erzeugt: new Date().toISOString(), hinweis: 'VOR dem Siegel, OHNE Ueberraschung gerechnet: Zufallszahl an Stelle der Ueberraschung.',
      pruefsummen: summen, zaehlungen: zl, blind: { H60: blindZahlen(Z, KF.H_HAUPT), H20: blindZahlen(Z, KF.H_ZWEIT) },
      pruefungenAmPanel: panelPruefungen(C, MS),
      zufallsbuecher: { endwerte: E.zufallsbuecherEndwerte, mitteGesamt: S2.zufall.mitteGesamt, p5Gesamt: S2.zufall.p5Gesamt, p95Gesamt: S2.zufall.p95Gesamt,
        ueberDemMassstab: S2.zufall.ueberDemMassstab, gekauftMitte: S2.zufall.gekauftMitte, plaetzeMitte: S2.zufall.plaetzeMitte },
      generalprobe: { hinweis: 'Signal = Zufallszahl mit Startwert-Versatz ' + PROBE_LAUF + '; prueft nur, dass der Bericht durchlaeuft', urteil: U.urteil, schlaegt: S2.schlaegt,
        gekauft: S2.gekauft, ueberDemBuch: S2.zufall.ueberDemBuch, berichtZeichen: probeText.length },
      laufzeitSekunden: Math.round((Date.now() - t0) / 1000) };
    fs.writeFileSync(path.join(__dirname, 'blind.json'), JSON.stringify(BL, null, 1));
    var pa = process.argv.indexOf('--probe-aus');
    if (pa !== -1) fs.writeFileSync(process.argv[pa + 1], probeText);
    ME.sag('BLIND fertig in ' + BL.laufzeitSekunden + ' s; Pruefungen am Panel: ' + JSON.stringify(BL.pruefungenAmPanel));
    return;
  }
  /* Die Zufallslaeufe muessen die der Registrierung sein (derselbe Startwert, derselbe Code, dieselben Daten) */
  var abw = 0;
  B.zufallsbuecher.endwerte.forEach(function (x, i) { abw = Math.max(abw, Math.abs(x - E.zufallsbuecherEndwerte[i])); });
  if (abw > 1e-6 || Math.abs(B.blind.H60.fehler.A.zufall - s60.fehlerZufall.A) > 1e-9) throw new Error('KLINKE: die Zufallslaeufe weichen von blind.json ab (' + abw + ')');
  E.laufzeitSekunden = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(__dirname, 'ergebnis.json'), JSON.stringify(E, null, 1));
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), bericht(E));
  ME.sag('FERTIG in ' + E.laufzeitSekunden + ' s');
  process.stdout.write(satzStufe2(S2) + '\n' + satzStufe1(U, s60, s20) + '\n');
}

module.exports = { bericht: bericht, satzStufe1: satzStufe1, satzStufe2: satzStufe2, blindZahlen: blindZahlen, stufe1Bericht: stufe1Bericht, KORREKTUREN: KORREKTUREN };
if (require.main === module) main();
