'use strict';
/* Auftrag Nr. 78 (04.10.2026): Momentum-Buch absichern - Gegenprobe 2017 bis 2021 (A-187), zweiter unabhaengiger Lauf (B-187),
 * eine Variante gegen die Klumpung (Gleichgewicht). Die Regel steht in REGEL.md (vor jeder Zahl festgelegt).
 * Aufgebaut auf dem amtlichen Rechner studien/massstab-rueckblick-2026-10-04/rueckblick.js (nur gerufen, nie geaendert):
 * rohMap, Ausschuettungs-Funktion und Kennzahlen kommen von dort; Zielliste, Plan, Ausfuehrung und Bewertung aus mfhandel.js
 * der App (nur gerufen). Hier stehen: die Korbauswahl (die N umsatzstaerksten), der Nachlauf mit waehlbarem Korb und waehlbarer
 * Mechanik, die Mechanik "Gleichgewicht", die SPY-Ergaenzung, die Saetze aus §1.7 und die fuenf Laeufe.
 * Das Skript pm-korb148.js des PM ist NICHT gelesen und NICHT benutzt (die beiden Rechner sollen unabhaengig bleiben).
 *   node --max-old-space-size=6144 studien/momentum-korb-2026-10-04/korb.js --selbstpruefung   (nur die Selbstpruefung, §1.8)
 *   node --max-old-space-size=6144 studien/momentum-korb-2026-10-04/korb.js                    (Selbstpruefung, dann die fuenf Laeufe) */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var REPO = path.resolve(__dirname, '..', '..');
var MH = require(path.join(REPO, 'mfhandel.js'));
var AMTLICH = path.join('studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js');
var R = require(path.join(REPO, AMTLICH));
var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));

var KENNUNG = 'momentum-korb-2026-10-04/v1';
var MASSNAHMEN_ORDNER = 'E:/Markt-Dashboard-Archiv/alpaca-massnahmen';   /* nur lesen */
var KORB_N = 187;                     /* §1.2: Zahl der Werte, die die App fuehrt (vom PM am Bestand gezaehlt) */
var START = R.START, KOSTEN_BP = R.KOSTEN_BP, PHASEN = R.PHASEN;
var FENSTER = {
  A: { von: '2017-01-04', bis: '2021-09-15', stichtag: '2017-01-03', handelstage: 1183, spyAusschuettungen: 18 },
  B: { von: '2021-09-16', bis: '2026-09-15', stichtag: '2021-09-15', handelstage: 1254, spyAusschuettungen: 20 },
};
/* §1.4: genau diese fuenf, keine weiteren */
var LAEUFE = [
  { name: 'A-187', fenster: 'A', korb: KORB_N, mechanik: 'app', rolle: 'die Gegenprobe - Hauptzahl dieses Auftrags' },
  { name: 'A-breit', fenster: 'A', korb: null, mechanik: 'app', rolle: 'nachrichtlich (das Gegenstueck zum amtlichen Rueckblick)' },
  { name: 'B-187', fenster: 'B', korb: KORB_N, mechanik: 'app', rolle: 'zweiter, unabhaengiger Lauf zur Vorab-Rechnung des PM' },
  { name: 'A-187-gleich', fenster: 'A', korb: KORB_N, mechanik: 'gleich', rolle: 'Variante' },
  { name: 'B-187-gleich', fenster: 'B', korb: KORB_N, mechanik: 'gleich', rolle: 'Variante' },
];
/* §1.8: breiter Korb, Fenster B, Mechanik der App = die amtliche Zahl (Endwerte in $) - sonst kein Lauf */
var SELBSTPRUEFUNG = { buchEnde: 165209.66, spyEnde: 181193.87 };
/* §1.7: die Vorab-Rechnung des PM (pm-korb148/ERGEBNIS-KORB.md) - nur diese Zahlen, nicht sein Skript */
var VORAB = { buchGesamt: 154.9, spyGesamt: 81.2, abstandPa: 7.96, medianAbstandPa: 8.25, toleranzPp: 2.0 };
/* §1.6 / §1a.3 SPY-Ausschuettungen vollstaendig machen. Im Massnahmen-Archiv (alpaca-massnahmen/SPY.json) fehlt die Ausschuettung
 * mit Ex-Tag 15.06.2018 (2018 stehen drei Saetze, in allen anderen Jahren 2017 bis 2025 vier; vom PM gefunden). Sie wird HIER im
 * Leser ergaenzt, nicht in der Datei. Gegenprobe des PM: von Schluss 03.01.2017 bis Schluss 15.09.2021 ergibt Panel plus
 * Ausschuettungen mit der Ergaenzung +115,95 %, die bereinigte Yahoo-Reihe +115,81 %, ohne Ergaenzung +114,98 %.
 * Schluessel ist der Ordner der Reihe im Massnahmen-Archiv. Steht der Satz eines Tages doch in der Datei, zaehlt er nicht doppelt. */
var ERGAENZUNGEN = { SPY: [{ ex_date: '2018-06-15', rate: 1.2456 }] };
var GROSSER_SATZ = 0.15;              /* Saetze ueber 15 % des Vortageskurses werden einzeln gelistet (nicht gefiltert) */
var KORREKTUREN = [];                 /* §1.9: jeder behobene Fehler nach dem Siegel wird hier vermerkt */

function round4(x) { return Math.round(x * 10000) / 10000; }

/* ---------- Ausschuettungen: Leser der Massnahmen-Dateien mit der benannten Ergaenzung ---------- */
function dateiLeser(info) {
  return function (name) {
    var f = path.join(MASSNAHMEN_ORDNER, name + '.json');
    if (!fs.existsSync(f)) return null;
    var j = JSON.parse(fs.readFileSync(f, 'utf8'));
    if (info) info[name] = { von: j.von || null, bis: j.bis || null };
    return j.saetze || [];
  };
}
/** Haengt die Ergaenzungen an - je Ex-Tag hoechstens einen Satz, und nur, wenn die Datei fuer diesen Ex-Tag keinen fuehrt. */
function mitErgaenzung(leser, ergaenzungen, protokoll) {
  return function (name) {
    var saetze = leser(name), erg = ergaenzungen[name];
    if (!erg) return saetze;
    var aus = (saetze || []).slice(), tage = {};
    erg.forEach(function (x) {
      if (tage[x.ex_date]) throw new Error('KLINKE: zwei Ergaenzungen am selben Ex-Tag: ' + name + ' ' + x.ex_date);
      tage[x.ex_date] = true;
      var da = aus.some(function (y) { return y._art === 'cash_dividends' && String(y.ex_date) === x.ex_date; });
      if (da) { if (protokoll) protokoll.schonInDerDatei++; return; }
      aus.push({ _art: 'cash_dividends', ex_date: x.ex_date, rate: x.rate, ergaenzt: true });
      if (protokoll) protokoll.ergaenzt++;
    });
    return aus;
  };
}
function Massnahmen(T, Q, leser, ergaenzungen, protokoll) {
  return R.Massnahmen(T, Q, mitErgaenzung(leser || dateiLeser(null), ergaenzungen || ERGAENZUNGEN, protokoll || null));
}

/* ---------- Korbauswahl (§1.2, §1a.1) ---------- */
/** Schritt (c): Rangfolge nach umsatz absteigend, bei gleichem Umsatz nach sym aufsteigend; die ersten n. */
function korbWaehlen(rangfolge, n) {
  var l = rangfolge.slice().sort(function (a, b) { return b.umsatz - a.umsatz || (a.sym < b.sym ? -1 : a.sym > b.sym ? 1 : 0); });
  return l.slice(0, n);
}
/** Schritte (c) und (d) auf dem Ergebnis r von momentumZiel ueber die volle rohMap roh. */
function korbZiel(T, Q, s, roh, r, n) {
  if (r.zuWenig) return { ziel: [], zuWenig: true, zulaessig: r.korb.zulaessig, geprueft: r.korb.geprueft, zulaessigBreit: r.korb.zulaessig, korb: [], korbUmsatz: [] };
  var wahl = korbWaehlen(r.rangfolge, n), imKorb = {}, roh2 = {};
  if (wahl.length !== n) throw new Error('KLINKE: Korb nicht voll am ' + T.kal.tage[s] + ': ' + wahl.length + ' von ' + n + ' (zulaessig ' + r.korb.zulaessig + ')');
  wahl.forEach(function (p) { imKorb[p.sym] = true; });
  Object.keys(roh).forEach(function (name) { if (imKorb[name]) roh2[name] = roh[name]; });      /* Reihenfolge des Panels bleibt */
  var r2 = MH.momentumZiel(roh2, { nowMs: Q.ms[s] });
  if (r2.zuWenig || r2.korb.zulaessig !== n || r2.korb.geprueft !== n) {
    throw new Error('KLINKE: Schritt (d) meldet nicht genau ' + n + ' zulaessige Werte am ' + T.kal.tage[s] + ': ' + r2.korb.zulaessig + ' von ' + r2.korb.geprueft + (r2.zuWenig ? ' (zuWenig)' : ''));
  }
  R.klinkeReferenz(T, Q, r2.ziel);
  return { ziel: r2.ziel, zuWenig: false, zulaessig: r2.korb.zulaessig, geprueft: r2.korb.geprueft, zulaessigBreit: r.korb.zulaessig,
    korb: wahl.map(function (p) { return p.sym; }), korbUmsatz: wahl.map(function (p) { return p.umsatz; }) };
}
/** Zielliste des Stichtags s: n leer = alle zulaessigen (wie der amtliche Rueckblick), sonst der Korb der n umsatzstaerksten.
 *  Schritte (a) und (b) laufen je Stichtag einmal; Q.korbVorab nennt die Korbgroessen, die dabei gleich mitgerechnet werden. */
function zielAm(T, Q, s, n) {
  var c = Q.korbCache || (Q.korbCache = {}), e = c[s], roh = null, r = null;
  function rechne() { if (!roh) { roh = R.rohMapAm(T, Q, s); r = MH.momentumZiel(roh, { nowMs: Q.ms[s] }); } }
  function korb(n2) { try { return korbZiel(T, Q, s, roh, r, n2); } catch (f) { return { fehler: f }; } }
  if (!e) {
    rechne();
    R.klinkeReferenz(T, Q, r.ziel);
    e = c[s] = { breit: { ziel: r.ziel, zuWenig: !!r.zuWenig, zulaessig: r.korb.zulaessig, geprueft: r.korb.geprueft }, koerbe: {} };
    (Q.korbVorab || []).forEach(function (n2) { e.koerbe[n2] = korb(n2); });
  }
  if (!n) return e.breit;
  if (!e.koerbe[n]) { rechne(); e.koerbe[n] = korb(n); }
  if (e.koerbe[n].fehler) throw e.koerbe[n].fehler;
  return e.koerbe[n];
}

/* ---------- Mechanik "Gleichgewicht" (§1.5): alle Zielwerte auf Depotwert / Zielzahl ----------
 * Depotwert zu Eroeffnungskursen wie planeUmschichtung (Bargeld + Positionen MIT Kurs). Verkaeufe vor Kaeufen: Nicht-mehr-Ziele ganz,
 * Uebergewichtete auf das Budget herunter. Dann in der Reihenfolge der Zielliste: jedes Ziel unter dem Budget wird gekauft oder
 * aufgestockt; reicht das Bargeld nicht, wird die Order verkleinert (wie fuehreAus). Stueckzahlen auf vier Nachkommastellen wie die App.
 * kostenBp auf jedes gehandelte Volumen. Ein Ziel oder eine Position ohne Eroeffnungskurs wird nicht gehandelt. Mutiert das Buch. */
function gleichgewicht(buch, ziel, preise, nowMs, kostenBp) {
  var k = (kostenBp == null ? 20 : kostenBp) / 10000, zielSet = {}, wert = buch.cash, bleiben = [];
  var aus = { verkauft: [], teilverkauft: [], aufgestockt: [], gekauft: [], fehltKurs: [], volumen: 0, depotwert: 0, budget: 0 };
  ziel.forEach(function (s) { zielSet[s] = true; });
  buch.positionen.forEach(function (p) { var kurs = preise[p.sym]; if (kurs > 0) wert += p.stueck * kurs; else aus.fehltKurs.push(p.sym); });
  var budget = ziel.length ? wert / ziel.length : 0;
  aus.depotwert = wert; aus.budget = budget;
  buch.positionen.forEach(function (p) {
    var kurs = preise[p.sym];
    if (!(kurs > 0)) { bleiben.push(p); return; }                                   /* ohne Kurs kein Handel */
    if (!zielSet[p.sym]) { buch.cash += p.stueck * kurs * (1 - k); aus.volumen += p.stueck * kurs; aus.verkauft.push(p.sym); return; }
    var st = round4((p.stueck * kurs - budget) / kurs);
    if (st > 0) {
      if (st > p.stueck) st = p.stueck;
      buch.cash += st * kurs * (1 - k); aus.volumen += st * kurs;
      p.stueck = round4(p.stueck - st); aus.teilverkauft.push(p.sym);
    }
    bleiben.push(p);
  });
  buch.positionen = bleiben;
  ziel.forEach(function (s) {
    var kurs = preise[s], p = null;
    buch.positionen.forEach(function (x) { if (x.sym === s) p = x; });
    if (!(kurs > 0)) { if (!p) aus.fehltKurs.push(s); return; }                     /* Ziel ohne Kurs: sein Anteil bleibt Bargeld */
    var st = round4((budget - (p ? p.stueck * kurs : 0)) / kurs);
    if (!(st > 0)) return;
    var kosten = st * kurs * (1 + k);
    if (kosten > buch.cash) {
      st = Math.max(0, Math.floor(buch.cash / (kurs * (1 + k)) * 10000) / 10000);
      kosten = st * kurs * (1 + k);
      if (!(st > 0)) return;
    }
    buch.cash -= kosten; aus.volumen += st * kurs;
    if (p) { p.einstand = (p.stueck * p.einstand + kosten) / (p.stueck + st); p.stueck = round4(p.stueck + st); aus.aufgestockt.push(s); }
    else { buch.positionen.push({ sym: s, stueck: st, einstand: kurs * (1 + k), seit: nowMs }); aus.gekauft.push(s); }
  });
  return aus;
}

function offenWert(buch, preise) {
  var w = buch.cash;
  buch.positionen.forEach(function (p) { if (preise[p.sym] > 0) w += p.stueck * preise[p.sym]; });
  return w;
}

/* ---------- Der Nachlauf eines Buchs von startTag (erster Ausfuehrungstag) bis endTag ----------
 * Schritte 1 bis 6 wie simuliere() des amtlichen Rechners (dieselbe Reihenfolge, dieselben Ausdruecke); neu sind nur
 * opt.korb (Korbgroesse, leer = alle zulaessigen), opt.mechanik ('app' = planeUmschichtung/fuehreAus der App, 'gleich' = Gleichgewicht),
 * das groesste Gewicht einer Position, die Haltezeiten und die Liste der grossen Ausschuettungssaetze. */
function simuliere(T, Q, M, opt) {
  var g = T.g, startTag = opt.startTag, endTag = opt.endTag, mitA = opt.ausschuettungen !== false;
  var korbN = opt.korb || null, mech = opt.mechanik || 'app';
  if (mech !== 'app' && mech !== 'gleich') throw new Error('unbekannte Mechanik: ' + mech);
  var tv = {}; (opt.totalverlust || []).forEach(function (x) { tv[x] = true; });
  var halten = MH.buchKonfig().halten, spy = T.symIdx[R.MASSSTAB];
  var o0 = Q.ord[startTag], oEnd = Q.ord[endTag];
  if (!(o0 >= 1) || !(oEnd >= o0)) throw new Error('Start/Ende ist kein Panel-Handelstag oder hat keinen Vortag');
  var zSpy0 = T.zeileVon(spy, startTag);
  if (zSpy0 < 0) throw new Error('Massstab ohne Zeile am Starttag');
  var buch = { cash: START, positionen: [], trades: [] }, meta = {};
  var zs = { umschichtungen: 0, zuWenigTage: 0, kosten: 0, kaeufe: 0, verkaeufe: 0, teilverkaeufe: 0, aufstockungen: 0, positionen: 0, positionenMitDatei: 0,
    positionenOhneDatei: 0, ausschuettungen: 0, ausschuettungSumme: 0, mehrfachAmExTag: 0, maxSatz: 0, lueckentage: 0, spyAusschuettungen: 0,
    spyAusschuettungSumme: 0, spyRateSumme: 0 };
  var reihenenden = [], umschichtungen = [], tage = [], perioden = [], offen = null, haltezeiten = [], grosseSaetze = [];
  var maxGewicht = { anteil: 0, reihe: null, tag: null };
  var spyStueck = START / g.bEroeffnung[zSpy0], spySchluss = NaN;
  var buchWert = START, spyWert = START;                       /* Werte zum Schluss des Vortags */
  var naechste = startTag;

  for (var o = o0; o <= oEnd; o++) {
    var d = Q.ptage[o];
    /* 1. Reihenende: erster Panel-Handelstag nach der letzten Zeile -> ausbuchen (Hauptregel des Pruefstands ueber opt.totalverlust) */
    for (var i = buch.positionen.length - 1; i >= 0; i--) {
      var p = buch.positionen[i], m = meta[p.sym];
      if (T.zeileVon(m.sym, d) >= 0) continue;
      var lz = T.letzteZeile(m.sym);
      if (g.tag[lz] < d) {
        var grund = T.endeGrund[m.sym] || null, total = !!(grund && tv[grund]);
        var gut = total ? 0 : p.stueck * g.bSchluss[lz];
        buch.cash += gut;
        buch.positionen.splice(i, 1);
        reihenenden.push({ reihe: p.sym, tag: String(T.kal.tage[d]), letzteZeile: String(T.kal.tage[g.tag[lz]]), grund: grund,
          totalverlust: total, gutschrift: gut, wertZumLetztenKurs: p.stueck * g.bSchluss[lz], lebendGefuehrt: !!T.stand.symbole[m.sym].lebend });
        haltezeiten.push({ reihe: p.sym, von: m.seitTag, bis: d, ende: 'reihenende' });
        delete meta[p.sym];
      } else zs.lueckentage++;
    }
    /* 2. Ausschuettungen mit Ex-Tag d: Anspruch hat, wer die Position ueber die Nacht hielt (Stueckzahl VOR dem Handel des Tages) */
    var bar = 0;
    if (mitA) buch.positionen.forEach(function (p2) {
      var m2 = meta[p2.sym];
      if (!(m2.seitTag < d)) return;
      var l = R.ausschuettungenAm(T, Q, M, m2.sym, d);
      if (l.length > 1) zs.mehrfachAmExTag++;
      l.forEach(function (a) {
        bar += p2.stueck * a.basis * a.satz; zs.ausschuettungen++; if (a.satz > zs.maxSatz) zs.maxSatz = a.satz;
        if (a.satz > GROSSER_SATZ) grosseSaetze.push({ reihe: p2.sym, tag: String(T.kal.tage[d]), rate: a.rate, satzProzent: a.satz * 100, betrag: p2.stueck * a.basis * a.satz });
      });
    });
    /* 3. Umschichtung zur Eroeffnung des Ausfuehrungstags; Stichtag = Panel-Handelstag davor */
    if (d === naechste) {
      var s = Q.ptage[o - 1], zl = zielAm(T, Q, s, korbN);
      if (zl.zuWenig) { zs.zuWenigTage++; naechste = o + 1 <= oEnd ? Q.ptage[o + 1] : -1; }
      else {
        var preise = {};
        var kurs = function (name) { var z = T.zeileVon(T.symIdx[name], d); if (z >= 0 && g.bEroeffnung[z] > 0) preise[name] = g.bEroeffnung[z]; };
        zl.ziel.forEach(kurs); buch.positionen.forEach(function (p3) { kurs(p3.sym); });
        var vor = offenWert(buch, preise), verkauft, gehaltenZahl, ohneKurs, teilV = 0, aufG = 0;
        if (mech === 'gleich') {
          var erg = gleichgewicht(buch, zl.ziel, preise, Q.ms[d], KOSTEN_BP);
          verkauft = erg.verkauft; ohneKurs = erg.fehltKurs.length; teilV = erg.teilverkauft.length; aufG = erg.aufgestockt.length;
          gehaltenZahl = buch.positionen.length - erg.gekauft.length;
          if (Math.abs(vor - offenWert(buch, preise) - erg.volumen * KOSTEN_BP / 10000) > 1e-6) throw new Error('KLINKE: Kosten sind nicht ' + KOSTEN_BP + ' Bp auf das gehandelte Volumen');
        } else {
          var plan = MH.planeUmschichtung(zl.ziel, buch, preise);
          buch.trades = [];
          var n = MH.fuehreAus(buch, plan, Q.ms[d], KOSTEN_BP);
          buch.trades = [];
          verkauft = plan.verkaufen.map(function (x) { return x.sym; }); ohneKurs = plan.fehltKurs.length; gehaltenZahl = plan.halten.length;
        }
        var kosten = vor - offenWert(buch, preise);
        verkauft.forEach(function (name) { haltezeiten.push({ reihe: name, von: meta[name].seitTag, bis: d, ende: 'verkauf' }); delete meta[name]; });
        var neu = 0;
        buch.positionen.forEach(function (p4) {
          if (meta[p4.sym]) return;
          meta[p4.sym] = { sym: T.symIdx[p4.sym], seitTag: d, schluss: NaN };
          neu++; zs.positionen++;
          if (mitA) { if (M(meta[p4.sym].sym).datei) zs.positionenMitDatei++; else zs.positionenOhneDatei++; }
        });
        if (mech === 'gleich' ? neu !== erg.gekauft.length : neu + verkauft.length !== n) throw new Error('KLINKE: Zahl der Ausfuehrungen passt nicht zum Buch');
        zs.umschichtungen++; zs.kosten += kosten; zs.kaeufe += neu; zs.verkaeufe += verkauft.length; zs.teilverkaeufe += teilV; zs.aufstockungen += aufG;
        umschichtungen.push({ ausfuehrungstag: String(T.kal.tage[d]), stichtag: String(T.kal.tage[s]), zulaessig: zl.zulaessig, geprueft: zl.geprueft,
          zulaessigBreit: zl.zulaessigBreit == null ? zl.zulaessig : zl.zulaessigBreit, zielzahl: zl.ziel.length, verkaeufe: verkauft.length, kaeufe: neu,
          gehalten: gehaltenZahl, teilverkaeufe: teilV, aufstockungen: aufG, ohneKurs: ohneKurs, kosten: kosten, positionenDanach: buch.positionen.length });
        if (offen) { offen.buchEnde = buchWert; offen.spyEnde = spyWert; perioden.push(offen); }
        offen = { ausfuehrungstag: String(T.kal.tage[d]), zulaessig: zl.zulaessig, zielzahl: zl.ziel.length, buchStart: buchWert, spyStart: spyWert };
        naechste = o + halten <= oEnd ? Q.ptage[o + halten] : -1;
      }
    }
    /* 4. Ausschuettungen gutschreiben - nach dem Handel des Tages (Lesart L3 des amtlichen Rueckblicks) */
    buch.cash += bar; zs.ausschuettungSumme += bar;
    /* 5. Massstab: Ausschuettung am Ex-Tag zum Schlusskurs wieder anlegen */
    var zS = T.zeileVon(spy, d);
    if (zS >= 0) {
      if (mitA && d > startTag) R.ausschuettungenAm(T, Q, M, spy, d).forEach(function (a) {
        var betrag = spyStueck * a.basis * a.satz;
        spyStueck += betrag / g.bSchluss[zS];
        zs.spyAusschuettungen++; zs.spyAusschuettungSumme += betrag; zs.spyRateSumme += a.rate;
      });
      spySchluss = g.bSchluss[zS];
    }
    spyWert = spyStueck * spySchluss;
    /* 6. Bewertung zum Schluss; fehlt die Zeile, gilt der letzte Schlusskurs (nie der Einstand) */
    var schluss = {}, groesste = 0, groessteReihe = null;
    buch.positionen.forEach(function (p5) {
      var m5 = meta[p5.sym], z5 = T.zeileVon(m5.sym, d);
      if (z5 >= 0) m5.schluss = g.bSchluss[z5];
      schluss[p5.sym] = m5.schluss;
      if (p5.stueck * m5.schluss > groesste) { groesste = p5.stueck * m5.schluss; groessteReihe = p5.sym; }
    });
    var bw = MH.bewerte(buch, schluss);
    if (bw.ohneKurs.length) throw new Error('KLINKE: Position ohne Schlusskurs: ' + bw.ohneKurs.join(','));
    buchWert = bw.wert;
    if (groesste / buchWert > maxGewicht.anteil) maxGewicht = { anteil: groesste / buchWert, reihe: groessteReihe, tag: String(T.kal.tage[d]) };
    tage.push({ tag: d, buch: buchWert, spy: spyWert, bar: buch.cash });
  }
  if (offen) { offen.buchEnde = buchWert; offen.spyEnde = spyWert; offen.angebrochen = true; perioden.push(offen); }
  perioden.forEach(function (P) {
    P.buch = (P.buchEnde / P.buchStart - 1) * 100; P.spy = (P.spyEnde / P.spyStart - 1) * 100; P.abstand = P.buch - P.spy;
  });
  buch.positionen.forEach(function (p6) { haltezeiten.push({ reihe: p6.sym, von: meta[p6.sym].seitTag, bis: endTag, ende: 'offen' }); });
  return { startTag: startTag, endTag: endTag, endBuch: buchWert, endSpy: spyWert, tage: tage, perioden: perioden, umschichtungen: umschichtungen,
    reihenenden: reihenenden, zaehler: zs, positionenAmEnde: buch.positionen.length, buch: buch, maxGewicht: maxGewicht, haltezeiten: haltezeiten,
    grosseSaetze: grosseSaetze };
}

/** Startphasen: erster Ausfuehrungstag k Panel-Handelstage nach dem ersten Fenstertag, k = 0 .. nPhasen-1, Ende fuer alle gleich. */
function startphasen(T, Q, M, erster, endTag, nPhasen, opt) {
  var aus = [];
  for (var k = 0; k < nPhasen; k++) {
    var o = { startTag: Q.ptage[Q.ord[erster] + k], endTag: endTag, totalverlust: opt.totalverlust, korb: opt.korb, mechanik: opt.mechanik };
    var L = simuliere(T, Q, M, o), kz = R.kennzahlen(Q, L);
    aus.push({ k: k, start: String(T.kal.tage[L.startTag]), buchGesamt: kz.buchGesamt, spyGesamt: kz.spyGesamt, buchPa: kz.buchPa, spyPa: kz.spyPa,
      abstandPa: kz.abstandPa, schlaegt: kz.schlaegt, rueckschlagBuch: R.maxRueckschlag(L.tage.map(function (x) { return x.buch; })),
      maxGewicht: L.maxGewicht.anteil * 100, umschichtungen: L.zaehler.umschichtungen, zuWenigTage: L.zaehler.zuWenigTage, reihenenden: L.reihenenden.length });
  }
  var ab = aus.map(function (a) { return a.abstandPa; }), rs = aus.map(function (a) { return a.rueckschlagBuch; });
  return { phasen: aus, abstaende: ab, minimum: Math.min.apply(null, ab), median: R.median(ab), maximum: Math.max.apply(null, ab),
    vorDemMarkt: aus.filter(function (a) { return a.schlaegt; }).length, anzahl: nPhasen,
    rueckschlagSpanne: [Math.max.apply(null, rs), Math.min.apply(null, rs)] };
}

/* ---------- Die Saetze aus §1.7 (vorher festgelegt; "vorn" heisst strikt Buch > SPY, §1a.2) ---------- */
function satzGegenprobe(buchEnde, spyEnde, phasenVorn, nPhasen) {
  if (nPhasen !== 63) throw new Error('Satz zur Gegenprobe: 63 Startphasen erwartet, nicht ' + nPhasen);
  var vorn = buchEnde > spyEnde;
  if (vorn && phasenVorn > 31) return 'hält';
  if (!vorn && phasenVorn < 32) return 'hält nicht';
  return 'gemischt';
}
function satzZweiterLauf(buchEnde, spyEnde, medianAbstandPa) {
  var vorn = buchEnde > spyEnde, diff = medianAbstandPa - VORAB.medianAbstandPa;
  return { urteil: vorn && Math.abs(diff) <= VORAB.toleranzPp ? 'bestätigt die Vorab-Rechnung' : 'weicht ab', k0Vorn: vorn, differenzMedianPp: diff };
}

/* ---------- Nachrichtliche Diagnose (aendert keine Zahl): moegliche fehlende Quartalszahlungen gehaltener Reihen ----------
 * Nur regelmaessige Quartalszahler (mindestens 8 Ex-Tage im Panel, Median-Abstand 80 bis 100 Kalendertage): gemeldet wird ein
 * Abstand ueber 150 Tage zwischen zwei Ex-Tagen, wenn er eine Haltezeit schneidet. Heuristik - ein Treffer ist ein Hinweis. */
function ausschuettungsLuecken(T, Q, M, haltezeiten, minAnzahl) {
  var jeReihe = {}, aus = [];
  haltezeiten.forEach(function (h) { (jeReihe[h.reihe] = jeReihe[h.reihe] || []).push(h); });
  Object.keys(jeReihe).forEach(function (reihe) {
    var ex = Object.keys(M(T.symIdx[reihe]).nachTag).map(Number).sort(function (a, b) { return a - b; }), abst = [];
    if (ex.length < (minAnzahl || 8)) return;
    for (var i = 1; i < ex.length; i++) abst.push((Q.ms[ex[i]] - Q.ms[ex[i - 1]]) / 86400000);
    var med = R.median(abst);
    if (!(med >= 80 && med <= 100)) return;
    abst.forEach(function (a, j) {
      if (!(a > 150)) return;
      jeReihe[reihe].forEach(function (h) {
        if (h.von < ex[j + 1] && h.bis > ex[j]) aus.push({ reihe: reihe, exVorher: String(T.kal.tage[ex[j]]), exNachher: String(T.kal.tage[ex[j + 1]]), tage: a,
          gehaltenVon: String(T.kal.tage[h.von]), gehaltenBis: String(T.kal.tage[h.bis]) });
      });
    });
  });
  return aus;
}

/* ---------- Ein Lauf der fuenf: k = 0, die 63 Startphasen, Periodenstreuung, Kalenderjahre, nachrichtliche Lesarten ---------- */
function minMax(a) { return a.length ? [Math.min.apply(null, a), Math.max.apply(null, a)] : [null, null]; }
function einLauf(T, Q, M, def, erster, endTag, regeln, info) {
  var basis = { startTag: erster, endTag: endTag, totalverlust: regeln.haupt, korb: def.korb, mechanik: def.mechanik };
  var mit = function (extra) { var o = {}; Object.keys(basis).forEach(function (k) { o[k] = basis[k]; }); Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; };
  var L = simuliere(T, Q, M, basis), kz = R.kennzahlen(Q, L);
  var kzK = R.kennzahlen(Q, simuliere(T, Q, M, mit({ ausschuettungen: false })));
  var kzS = R.kennzahlen(Q, simuliere(T, Q, M, mit({ totalverlust: regeln.streng })));
  var kzM = R.kennzahlen(Q, simuliere(T, Q, M, mit({ totalverlust: regeln.milde })));
  var SP = startphasen(T, Q, M, erster, endTag, PHASEN, basis);
  if (Math.abs(SP.phasen[0].abstandPa - kz.abstandPa) > 1e-9) throw new Error('KLINKE: Startphase k = 0 ist nicht die Hauptzahl (' + def.name + ')');
  var PS = R.periodenstreuung(L.perioden), KJ = R.kalenderjahre(T, L);
  var barAnteil = L.tage.reduce(function (a, x) { return a + x.bar / x.buch; }, 0) / L.tage.length * 100;
  var endeArten = {};
  L.reihenenden.forEach(function (r) { var k2 = String(r.grund); endeArten[k2] = (endeArten[k2] || 0) + 1; });
  var u = L.umschichtungen;
  if (def.korb) u.forEach(function (x) {
    if (x.zulaessig !== def.korb || x.zielzahl !== Math.max(5, Math.round(def.korb * MH.buchKonfig().anteil))) throw new Error('KLINKE: Korb oder Zielzahl falsch am ' + x.stichtag + ' (' + def.name + ')');
  });
  var dateiSpaeter = [];
  L.haltezeiten.forEach(function (h) {
    var i = info && info[T.stand.symbole[T.symIdx[h.reihe]].ordner];
    if (i && i.von && String(i.von) > String(T.kal.tage[h.von])) dateiSpaeter.push({ reihe: h.reihe, gekauft: String(T.kal.tage[h.von]), dateiVon: i.von });
  });
  return {
    name: def.name, rolle: def.rolle, fensterName: def.fenster, korb: def.korb || 'alle zulaessigen', mechanik: def.mechanik === 'gleich' ? 'Gleichgewicht' : 'wie die App',
    fenster: { von: String(T.kal.tage[erster]), bis: String(T.kal.tage[endTag]), handelstage: L.tage.length, jahre: kz.jahre },
    haupt: { schlaegt: kz.schlaegt, buchGesamt: kz.buchGesamt, spyGesamt: kz.spyGesamt, buchPa: kz.buchPa, spyPa: kz.spyPa, abstandPa: kz.abstandPa,
      buchEnde: kz.buchEnde, spyEnde: kz.spyEnde, rueckschlagBuch: R.maxRueckschlag(L.tage.map(function (x) { return x.buch; })),
      rueckschlagSpy: R.maxRueckschlag(L.tage.map(function (x) { return x.spy; })), umschichtungen: L.zaehler.umschichtungen, zuWenigTage: L.zaehler.zuWenigTage,
      kaeufe: L.zaehler.kaeufe, verkaeufe: L.zaehler.verkaeufe, teilverkaeufe: L.zaehler.teilverkaeufe, aufstockungen: L.zaehler.aufstockungen,
      kostenGezahlt: L.zaehler.kosten, bargeldanteilMittel: barAnteil, positionenAmEnde: L.positionenAmEnde, lueckentage: L.zaehler.lueckentage,
      groesstesGewicht: { prozent: L.maxGewicht.anteil * 100, reihe: L.maxGewicht.reihe, tag: L.maxGewicht.tag },
      gehalteneWerte: minMax(u.map(function (x) { return x.positionenDanach; })), zulaessig: minMax(u.map(function (x) { return x.zulaessig; })),
      zulaessigBreit: minMax(u.map(function (x) { return x.zulaessigBreit; })), zielzahl: minMax(u.map(function (x) { return x.zielzahl; })),
      ohneKursBeiUmschichtung: u.reduce(function (a, x) { return a + x.ohneKurs; }, 0) },
    zufallsbereich: { startphasen: SP, periodenstreuung: PS, groesstesGewichtSpanne: minMax(SP.phasen.map(function (x) { return x.maxGewicht; })) },
    kalenderjahre: KJ, perioden: L.perioden, umschichtungen: u,
    reihenenden: { anzahl: L.reihenenden.length, nachGrund: endeArten, totalverluste: L.reihenenden.filter(function (r) { return r.totalverlust; }).length,
      lebendGefuehrtOhneGrund: L.reihenenden.filter(function (r) { return r.lebendGefuehrt && !r.grund; }).length, liste: L.reihenenden },
    ausschuettungen: { positionen: L.zaehler.positionen, positionenMitDatei: L.zaehler.positionenMitDatei, positionenOhneDatei: L.zaehler.positionenOhneDatei,
      gebucht: L.zaehler.ausschuettungen, summeBuch: L.zaehler.ausschuettungSumme, mehrfachAmExTag: L.zaehler.mehrfachAmExTag, groessterSatzProzent: L.zaehler.maxSatz * 100,
      grosseSaetze: L.grosseSaetze, ertragPaBuch: kz.buchPa - kzK.buchPa, spyGebucht: L.zaehler.spyAusschuettungen, spyRateSumme: L.zaehler.spyRateSumme,
      summeSpy: L.zaehler.spyAusschuettungSumme, ertragPaSpy: kz.spyPa - kzK.spyPa,
      moeglicheLuecken: ausschuettungsLuecken(T, Q, M, L.haltezeiten), dateiBeginntNachKauf: dateiSpaeter },
    nachrichtlich: {
      kursertrag: { schlaegt: kzK.schlaegt, buchGesamt: kzK.buchGesamt, spyGesamt: kzK.spyGesamt, buchPa: kzK.buchPa, spyPa: kzK.spyPa, abstandPa: kzK.abstandPa },
      streng: { schlaegt: kzS.schlaegt, buchGesamt: kzS.buchGesamt, buchPa: kzS.buchPa, abstandPa: kzS.abstandPa },
      milde: { schlaegt: kzM.schlaegt, buchGesamt: kzM.buchGesamt, buchPa: kzM.buchPa, abstandPa: kzM.abstandPa } },
  };
}

/* ---------- Fenster und Klinken am echten Panel ---------- */
function fensterTage(T, Q) {
  var aus = {};
  ['A', 'B'].forEach(function (f) {
    var von = R.tagAb(T, Q, FENSTER[f].von), bis = R.tagAb(T, Q, FENSTER[f].bis);
    if (von < 0 || bis < 0 || String(T.kal.tage[von]) !== FENSTER[f].von || String(T.kal.tage[bis]) !== FENSTER[f].bis) throw new Error('KLINKE: Fenster ' + f + ' beginnt oder endet nicht an einem Panel-Handelstag');
    if (String(T.kal.tage[Q.ptage[Q.ord[von] - 1]]) !== FENSTER[f].stichtag) throw new Error('KLINKE: Stichtag vor Fenster ' + f + ' ist nicht der ' + FENSTER[f].stichtag);
    if (Q.ord[bis] - Q.ord[von] + 1 !== FENSTER[f].handelstage) throw new Error('KLINKE: Fenster ' + f + ' hat nicht ' + FENSTER[f].handelstage + ' Handelstage');
    aus[f] = { von: von, bis: bis };
  });
  if (Q.ord[aus.A.von] !== 253) throw new Error('KLINKE: der Stichtag 03.01.2017 ist nicht der 253. Panel-Tag');
  if (Q.ord[aus.A.bis] + 1 !== Q.ord[aus.B.von]) throw new Error('KLINKE: Fenster A endet nicht am Handelstag vor Fenster B');
  if (aus.B.bis !== T.maxTag) throw new Error('KLINKE: Fenster B endet nicht am letzten Panel-Tag');
  return aus;
}
/** SPY-Ausschuettungen: Ex-Tage nach dem ersten Fenstertag bis zum letzten (wie der Massstab sie bucht) und je Kalenderjahr. */
function spyZaehlung(T, Q, M, F) {
  var e = M(T.symIdx[R.MASSSTAB]).nachTag, jeJahr = {}, jeFenster = { A: 0, B: 0 }, mehrfach = 0;
  Object.keys(e).forEach(function (t) {
    t = Number(t);
    var j = String(T.kal.tage[t]).slice(0, 4);
    jeJahr[j] = (jeJahr[j] || 0) + e[t].length;
    if (e[t].length > 1) mehrfach++;
    ['A', 'B'].forEach(function (f) { if (t > F[f].von && t <= F[f].bis) jeFenster[f] += e[t].length; });
  });
  return { jeJahr: jeJahr, jeFenster: jeFenster, mehrfachAmExTag: mehrfach };
}
function spyKlinken(T, Q, M, F) {
  var z = spyZaehlung(T, Q, M, F);
  ['A', 'B'].forEach(function (f) {
    if (z.jeFenster[f] !== FENSTER[f].spyAusschuettungen) throw new Error('KLINKE: SPY hat im Fenster ' + f + ' ' + z.jeFenster[f] + ' Ausschuettungen statt ' + FENSTER[f].spyAusschuettungen);
  });
  for (var j = 2017; j <= 2025; j++) if (z.jeJahr[j] !== 4) throw new Error('KLINKE: SPY hat ' + j + ' nicht vier Ausschuettungen, sondern ' + z.jeJahr[j]);
  if (z.mehrfachAmExTag) throw new Error('KLINKE: SPY mit mehreren Saetzen an einem Ex-Tag');
  return z;
}

/* ---------- Der eine Lauf: Selbstpruefung, dann die fuenf Laeufe ---------- */
function de(x, n) { return x.toFixed(n == null ? 2 : n).replace('.', ','); }
function vz(x, n) { return (x >= 0 ? '+' : '−') + de(Math.abs(x), n); }
function datumDe(d) { var p = String(d).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
function sha(datei) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, datei))).digest('hex').slice(0, 16); }
function dollar(x) { return de(x, 2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }

function ergebnisText(E) {
  var A = E.laeufe['A-187'], B = E.laeufe['B-187'], namen = LAEUFE.map(function (l) { return l.name; }), Z = [];
  var SPa = A.zufallsbereich.startphasen, SPb = B.zufallsbereich.startphasen;
  Z.push('Gegenprobe A-187 (Korb der 187 umsatzstärksten Aktien, Mechanik der App, ' + datumDe(A.fenster.von) + ' bis ' + datumDe(A.fenster.bis) + '): der Vorsprung **' +
    E.saetze.gegenprobe.urteil + '** — Buch ' + vz(A.haupt.buchGesamt, 1) + ' % (' + vz(A.haupt.buchPa, 2) + ' % p. a.) gegen S&P 500 ' + vz(A.haupt.spyGesamt, 1) + ' % (' + vz(A.haupt.spyPa, 2) +
    ' % p. a.), Abstand ' + vz(A.haupt.abstandPa, 2) + ' Pp p. a. bei k = 0; ' + SPa.vorDemMarkt + ' von ' + SPa.anzahl + ' Startphasen vorn (Minimum ' + vz(SPa.minimum, 2) + ' / Median ' + vz(SPa.median, 2) +
    ' / Maximum ' + vz(SPa.maximum, 2) + ' Pp p. a.); größter Rückschlag ' + vz(A.haupt.rueckschlagBuch, 1) + ' % gegen ' + vz(A.haupt.rueckschlagSpy, 1) + ' % beim S&P 500.');
  Z.push('');
  Z.push('Zweiter Lauf B-187 (' + datumDe(B.fenster.von) + ' bis ' + datumDe(B.fenster.bis) + ', unabhängig geschriebener Rechner): **' + E.saetze.zweiterLauf.urteil + '**' +
    (E.saetze.zweiterLauf.urteil === 'weicht ab' ? ' (Median um ' + vz(E.saetze.zweiterLauf.differenzMedianPp, 2) + ' Pp p. a.' + (E.saetze.zweiterLauf.k0Vorn ? '' : '; bei k = 0 liegt das Buch nicht vorn') + ')' : '') +
    ' — Buch ' + vz(B.haupt.buchGesamt, 1) + ' % gegen S&P 500 ' + vz(B.haupt.spyGesamt, 1) + ' %, Abstand ' + vz(B.haupt.abstandPa, 2) + ' Pp p. a. bei k = 0 (Vorab-Rechnung: ' + vz(VORAB.buchGesamt, 1) + ' % / ' +
    vz(VORAB.spyGesamt, 1) + ' % / ' + vz(VORAB.abstandPa, 2) + '); Median der 63 Abstände ' + vz(SPb.median, 2) + ' gegen ' + vz(VORAB.medianAbstandPa, 2) + ' Pp p. a. (Unterschied ' +
    vz(E.saetze.zweiterLauf.differenzMedianPp, 2) + ', erlaubt ±' + de(VORAB.toleranzPp, 1) + '); ' + SPb.vorDemMarkt + ' von ' + SPb.anzahl + ' Startphasen vorn; größter Rückschlag ' + vz(B.haupt.rueckschlagBuch, 1) + ' %.');
  Z.push('');
  var zeile = function (titel, f) { Z.push('| ' + titel + ' | ' + namen.map(function (n) { return f(E.laeufe[n]); }).join(' | ') + ' |'); };
  Z.push('| | ' + namen.map(function (n) { return '**' + n + '**'; }).join(' | ') + ' |');
  Z.push('|---|' + namen.map(function () { return '---'; }).join('|') + '|');
  zeile('Fenster', function (l) { return datumDe(l.fenster.von) + '–' + datumDe(l.fenster.bis); });
  zeile('Korb / Mechanik', function (l) { return (l.korb === KORB_N ? '187 umsatzstärkste' : 'alle zulässigen') + ' / ' + l.mechanik; });
  var spanne = function (a) { return a[0] + (a[1] !== a[0] ? '–' + a[1] : ''); };
  zeile('zulässig / Zielzahl / gehalten', function (l) { var h = l.haupt; return spanne(h.zulaessig) + ' / ' + spanne(h.zielzahl) + ' / ' + spanne(h.gehalteneWerte); });
  zeile('Buch gesamt (p. a.), k = 0', function (l) { return vz(l.haupt.buchGesamt, 1) + ' % (' + vz(l.haupt.buchPa, 2) + ' %)'; });
  zeile('S&P 500 gesamt (p. a.)', function (l) { return vz(l.haupt.spyGesamt, 1) + ' % (' + vz(l.haupt.spyPa, 2) + ' %)'; });
  zeile('**Abstand p. a., k = 0**', function (l) { return '**' + vz(l.haupt.abstandPa, 2) + ' Pp**'; });
  zeile('Startphasen vorn', function (l) { var s = l.zufallsbereich.startphasen; return s.vorDemMarkt + ' von ' + s.anzahl; });
  zeile('Abstand über die Phasen (Min / Median / Max)', function (l) { var s = l.zufallsbereich.startphasen; return vz(s.minimum, 2) + ' / ' + vz(s.median, 2) + ' / ' + vz(s.maximum, 2); });
  zeile('Abstand je Periode: Mittel ± Standardfehler (95-%-Band, t)', function (l) { var p = l.zufallsbereich.periodenstreuung; return vz(p.mittel, 2) + ' ± ' + de(p.standardfehler, 2) + ' (' + vz(p.band95[0], 2) + ' bis ' + vz(p.band95[1], 2) + '; t = ' + de(p.tWert, 3) + ')'; });
  zeile('Perioden vorn', function (l) { var p = l.zufallsbereich.periodenstreuung; return p.periodenVorn + ' von ' + p.n; });
  zeile('größter Rückschlag Buch, k = 0 (Spanne der Phasen)', function (l) { var s = l.zufallsbereich.startphasen.rueckschlagSpanne; return vz(l.haupt.rueckschlagBuch, 1) + ' % (' + vz(s[0], 1) + ' bis ' + vz(s[1], 1) + ')'; });
  zeile('größter Rückschlag S&P 500', function (l) { return vz(l.haupt.rueckschlagSpy, 1) + ' %'; });
  zeile('größtes Gewicht einer Position, k = 0 (Spanne der Phasen)', function (l) { var s = l.zufallsbereich.groesstesGewichtSpanne; return de(l.haupt.groesstesGewicht.prozent, 1) + ' % (' + de(s[0], 1) + ' bis ' + de(s[1], 1) + ')'; });
  zeile('gezahlte Kosten (Umschichtungen)', function (l) { return dollar(l.haupt.kostenGezahlt).replace(/,\d\d$/, '') + ' $ (' + l.haupt.umschichtungen + ')'; });
  var jahre = {};
  namen.forEach(function (n) { E.laeufe[n].kalenderjahre.forEach(function (j) { jahre[j.jahr] = true; }); });
  Object.keys(jahre).sort().forEach(function (j) {
    zeile(j + ': Buch / S&P 500', function (l) { var x = l.kalenderjahre.filter(function (y) { return y.jahr === j; })[0]; return x ? vz(x.buch, 1) + ' % / ' + vz(x.spy, 1) + ' %' : '–'; });
  });
  Z.push('');
  Z.push('2021 ist geteilt: Fenster A bis 15.09., Fenster B ab 16.09.; 2026 bis 15.09. **Variante:** kein Urteilssatz — die Spalten „-gleich“ stehen neben den Spalten der App-Mechanik.');
  Z.push('');
  Z.push('*Auftrag Nr. 78, Kennung `' + E.kennung + '`, Panel `' + E.panelKennung + '`. Beschreibende Zahlen nach der Regel in `REGEL.md` (vor dem Lauf festgelegt), kein Urteil über eine Kante; „' +
    'bestätigt die Vorab-Rechnung“ meint nur den Rechner. Alles Simulation, keine Anlageberatung.*');
  Z.push('');
  var S = E.selbstpruefung;
  Z.push('**Geprüft vor dem Lauf.** Selbstprüfung (breiter Korb, Fenster B, Mechanik der App): ' + dollar(S.buchEnde) + ' $ gegen ' + dollar(S.spyEnde) + ' $ — Soll ' + dollar(S.sollBuch) + ' $ / ' + dollar(S.sollSpy) +
    ' $: ' + (S.bestanden ? 'getroffen' : 'NICHT getroffen') + '. SPY-Ausschüttungen: ' + E.spy.jeFenster.A + ' im Fenster A, ' + E.spy.jeFenster.B + ' im Fenster B, je volles Kalenderjahr vier; der Satz vom 15.06.2018 (1,2456 $) ist im Code ergänzt (' +
    E.spy.ergaenzt + ' ergänzt, ' + E.spy.schonInDerDatei + ' schon in der Datei). Korrekturen nach dem Siegel: ' + (E.korrekturen.length ? E.korrekturen.length : 'keine') + '.');
  Z.push('');
  var auff = namen.map(function (n) {
    var l = E.laeufe[n], a = l.ausschuettungen;
    return n + ': ' + l.reihenenden.anzahl + ' Reihenenden (' + (Object.keys(l.reihenenden.nachGrund).map(function (k) { return k + ' ' + l.reihenenden.nachGrund[k]; }).join(', ') || 'keine') + '), ' + l.haupt.ohneKursBeiUmschichtung +
      ' ohne Kurs, ' + a.positionenOhneDatei + ' ohne Datei, ' + a.grosseSaetze.length + ' Sätze über 15 %, ' + a.moeglicheLuecken.length + ' mögliche Lücken';
  });
  Z.push('**Auffälligkeiten (k = 0).** ' + auff.join('; ') + '. Einzelheiten, alle 63 Abstände je Lauf, Perioden und Umschichtungen in `ergebnis.json`.');
  Z.push('');
  Z.push('**Grenzen.** Fenster A ist eine Gegenprobe auf ungesehenen Jahren, aber ein Fenster, ein Parametersatz, ' + A.zufallsbereich.periodenstreuung.n + ' Perioden; die 63 Startphasen teilen sich dieselben Jahre und sind kein zweiter Nachweis. ' +
    'Der Korb ist nicht die Liste der App, sondern je Stichtag die 187 umsatzstärksten Aktien des Panels. Bekannte Mängel des Panels (Nr. 72) sind nicht behoben.');
  return Z.join('\n') + '\n';
}

/** Die beiden Saetze aus §1.7 aus den Laeufen A-187 und B-187 bilden (die Variante bekommt keinen Urteilssatz). */
function saetzeBilden(E) {
  var A = E.laeufe['A-187'], B = E.laeufe['B-187'], SPa = A.zufallsbereich.startphasen, SPb = B.zufallsbereich.startphasen;
  E.saetze.gegenprobe = { lauf: 'A-187', urteil: satzGegenprobe(A.haupt.buchEnde, A.haupt.spyEnde, SPa.vorDemMarkt, SPa.anzahl), k0Vorn: A.haupt.buchEnde > A.haupt.spyEnde,
    phasenVorn: SPa.vorDemMarkt, abstandPaK0: A.haupt.abstandPa, abstandMinimum: SPa.minimum, abstandMedian: SPa.median, abstandMaximum: SPa.maximum, rueckschlagBuch: A.haupt.rueckschlagBuch,
    regel: 'haelt: k = 0 Buch > SPY und mehr als 31 von 63 Phasen vorn; haelt nicht: k = 0 Buch nicht vorn und weniger als 32 Phasen vorn; sonst gemischt' };
  var zw = satzZweiterLauf(B.haupt.buchEnde, B.haupt.spyEnde, SPb.median);
  E.saetze.zweiterLauf = { lauf: 'B-187', urteil: zw.urteil, k0Vorn: zw.k0Vorn, medianAbstandPa: SPb.median, medianVorab: VORAB.medianAbstandPa, differenzMedianPp: zw.differenzMedianPp,
    toleranzPp: VORAB.toleranzPp, abstandPaK0: B.haupt.abstandPa, abstandPaK0Vorab: VORAB.abstandPa,
    regel: 'bestaetigt die Vorab-Rechnung: k = 0 Buch > SPY und Median der 63 Abstaende hoechstens 2,0 Pp p. a. vom Median der Vorab-Rechnung (+8,25) entfernt; sonst weicht ab' };
  return E.saetze;
}

function lauf(nurSelbstpruefung) {
  var t0 = Date.now();
  var PR = require(path.join(R.PRUEFSTAND, 'pruefstand.js'));
  var T = PR.Tafel(R.PANEL_ORDNER), Q = R.vorbereiten(T), info = {}, protokoll = { ergaenzt: 0, schonInDerDatei: 0 };
  Q.korbVorab = [KORB_N];
  var M = Massnahmen(T, Q, dateiLeser(info), ERGAENZUNGEN, protokoll);
  var e0 = K.EMPFINDLICHKEIT;
  if (e0[0].key !== 'haupt' || e0[1].key !== 'streng' || e0[2].key !== 'milde') throw new Error('KLINKE: K.EMPFINDLICHKEIT hat eine andere Ordnung');
  var regeln = { haupt: e0[0].totalverlust, streng: e0[1].totalverlust, milde: e0[2].totalverlust };
  if (T.stand.symbole[T.symIdx[R.MASSSTAB]].ordner !== 'SPY') throw new Error('KLINKE: der Massstab liegt nicht im Ordner SPY');
  var F = fensterTage(T, Q), spy = spyKlinken(T, Q, M, F);
  if (protokoll.ergaenzt + protokoll.schonInDerDatei !== 1) throw new Error('KLINKE: die SPY-Ergaenzung wurde nicht genau einmal behandelt');

  /* Selbstpruefung (§1.8) - breiter Korb, Fenster B, Mechanik der App; keine sechste Variante */
  var L0 = simuliere(T, Q, M, { startTag: F.B.von, endTag: F.B.bis, totalverlust: regeln.haupt });
  var S = { buchEnde: L0.endBuch, spyEnde: L0.endSpy, sollBuch: SELBSTPRUEFUNG.buchEnde, sollSpy: SELBSTPRUEFUNG.spyEnde,
    bestanden: Math.round(L0.endBuch * 100) === Math.round(SELBSTPRUEFUNG.buchEnde * 100) && Math.round(L0.endSpy * 100) === Math.round(SELBSTPRUEFUNG.spyEnde * 100) };
  console.log('Selbstpruefung: Buch ' + L0.endBuch.toFixed(2) + ' (Soll ' + S.sollBuch.toFixed(2) + '), SPY ' + L0.endSpy.toFixed(2) + ' (Soll ' + S.sollSpy.toFixed(2) + ') -> ' + (S.bestanden ? 'bestanden' : 'NICHT bestanden'));
  if (!S.bestanden) throw new Error('SELBSTPRUEFUNG nicht bestanden - kein Lauf (§1.8)');
  if (nurSelbstpruefung) return;

  var git = '';
  try { git = require('child_process').execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch (e) { git = 'unbekannt'; }
  var E = {
    kennung: KENNUNG, vollstaendig: false, erzeugt: new Date().toISOString(), panelKennung: T.stand.kennung, panelStand: T.stand.stand, gitHead: git,
    quellen: { 'mfhandel.js': sha('mfhandel.js'), 'momentum.js': sha('momentum.js'), 'liquide.js': sha('liquide.js'), 'rueckblick.js': sha(AMTLICH) },
    regel: { korbN: KORB_N, kostenBpJeSeite: KOSTEN_BP, startkapital: START, startphasen: PHASEN, fenster: FENSTER, konfigBuch: MH.buchKonfig(), massstab: R.MASSSTAB,
      spyErgaenzung: ERGAENZUNGEN.SPY, vorabRechnung: VORAB },
    selbstpruefung: S,
    spy: { jeJahr: spy.jeJahr, jeFenster: spy.jeFenster, ergaenzt: protokoll.ergaenzt, schonInDerDatei: protokoll.schonInDerDatei },
    saetze: {}, laeufe: {}, korrekturen: KORREKTUREN, laufzeitSekunden: 0,
  };
  var datei = path.join(__dirname, 'ergebnis.json');
  LAEUFE.forEach(function (def) {
    var t1 = Date.now();
    var l = einLauf(T, Q, M, def, F[def.fenster].von, F[def.fenster].bis, regeln, info);
    if (l.ausschuettungen.spyGebucht !== FENSTER[def.fenster].spyAusschuettungen) throw new Error('KLINKE: der Massstab hat im Lauf ' + def.name + ' ' + l.ausschuettungen.spyGebucht + ' Ausschuettungen gebucht statt ' + FENSTER[def.fenster].spyAusschuettungen);
    if (l.fenster.handelstage !== FENSTER[def.fenster].handelstage) throw new Error('KLINKE: Lauf ' + def.name + ' hat ' + l.fenster.handelstage + ' Handelstage');
    l.laufzeitSekunden = Math.round((Date.now() - t1) / 100) / 10;
    E.laeufe[def.name] = l;
    E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
    fs.writeFileSync(datei, JSON.stringify(E, null, 1));                    /* Zwischenstand auf die Platte */
    console.log('Lauf ' + def.name + ' fertig nach ' + l.laufzeitSekunden + ' s');
  });
  saetzeBilden(E);
  E.vollstaendig = true;
  E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
  fs.writeFileSync(datei, JSON.stringify(E, null, 1));
  var text = ergebnisText(E);
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), text);
  console.log(text.split('\n')[0]);
  console.log(text.split('\n')[2]);
  console.log('Laufzeit s', E.laufzeitSekunden);
}

module.exports = { KENNUNG: KENNUNG, KORB_N: KORB_N, FENSTER: FENSTER, LAEUFE: LAEUFE, SELBSTPRUEFUNG: SELBSTPRUEFUNG, VORAB: VORAB, ERGAENZUNGEN: ERGAENZUNGEN,
  dateiLeser: dateiLeser, mitErgaenzung: mitErgaenzung, Massnahmen: Massnahmen, korbWaehlen: korbWaehlen, zielAm: zielAm, gleichgewicht: gleichgewicht,
  simuliere: simuliere, startphasen: startphasen, satzGegenprobe: satzGegenprobe, satzZweiterLauf: satzZweiterLauf, ausschuettungsLuecken: ausschuettungsLuecken,
  einLauf: einLauf, fensterTage: fensterTage, spyZaehlung: spyZaehlung, spyKlinken: spyKlinken, saetzeBilden: saetzeBilden, ergebnisText: ergebnisText };

if (require.main === module) lauf(process.argv.indexOf('--selbstpruefung') >= 0);
