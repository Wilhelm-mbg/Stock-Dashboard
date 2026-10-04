'use strict';
/* Auftrag Nr. 82 (04.10.2026): Nach Steuern - derselbe Rueckblick fuer ein deutsches Privatdepot. Ein RECHENMODELL mit vorher
 * festgelegten Annahmen (REGEL.md), keine Steuerberatung, kein Urteil.
 * Aufgebaut auf dem Rechner aus Nr. 78 (studien/momentum-korb-2026-10-04/korb.js) und dem amtlichen Rechner aus Nr. 74
 * (studien/massstab-rueckblick-2026-10-04/rueckblick.js) - beide nur gerufen, nie geaendert: Zielliste und Korb (zielAm), Massnahmen mit
 * der SPY-Ergaenzung, Fenster, SPY-Klinken, Median. Hier stehen: die eigene Kopie des Nachlaufs mit der Steuerschicht (Aktien-Verlusttopf,
 * Ausschuettungen netto, Endverkauf), der Indexfonds mit Vorabpauschale und die vier Laeufe.
 * Planung und Ausfuehrung der App (planeUmschichtung, fuehreAus) werden an genau EINER Stelle gerufen: handel() (Auftrag §5.3).
 *   node --max-old-space-size=6144 studien/nach-steuern-2026-10-04/steuer.js --selbstpruefung   (nur die Selbstpruefung, §2)
 *   node --max-old-space-size=6144 studien/nach-steuern-2026-10-04/steuer.js                    (Selbstpruefung, dann die vier Laeufe) */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var REPO = path.resolve(__dirname, '..', '..');
var MH = require(path.join(REPO, 'mfhandel.js'));
var NR74 = path.join('studien', 'massstab-rueckblick-2026-10-04');
var NR78 = path.join('studien', 'momentum-korb-2026-10-04');
var R = require(path.join(REPO, NR74, 'rueckblick.js'));
var S = require(path.join(REPO, NR78, 'korb.js'));
var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));

var KENNUNG = 'nach-steuern-2026-10-04/v1';
var START = R.START, KOSTEN_BP = R.KOSTEN_BP, PHASEN = R.PHASEN;
/* §1 des Auftrags: das Modell. Nichts davon wird nach dem Siegel geaendert. */
var MODELL = {
  steuersatz: 0.26375,            /* 25 % plus 5,5 % Solidaritaetszuschlag, keine Kirchensteuer; Sparer-Pauschbetrag 0 */
  teilfreistellung: 0.30,         /* Aktienfonds: 30 % der Vorabpauschale und des Verkaufsgewinns bleiben steuerfrei */
  basisertragAnteil: 0.7,         /* Basisertrag = Wert am Jahresanfang x Basiszins x 0,7 */
  wiederanlage: 0.85,             /* SPY-Ausschuettung zu 85 % wieder angelegt (15 % Quellensteuer im Fonds) */
  kostenPa: 0.0007,               /* laufende Kosten 0,07 % im Jahr */
  handelstageJeJahr: 252,         /* je Handelstag Faktor (1 - 0,0007)^(1/252) */
  kleinstkaufGrenze: 0.05,        /* Zaehler "unter 5 % des Budgets" */
  /* Basiszins (amtlich, vom PM am 04.10.2026 nachgeschlagen). 2017: ANNAHME DES PM, NICHT NACHGESCHLAGEN (die Regelung gab es noch nicht). */
  basiszins: { 2017: 0.0059, 2018: 0.0087, 2019: 0.0052, 2020: 0.0007, 2021: -0.0045, 2022: -0.0005, 2023: 0.0255, 2024: 0.0229, 2025: 0.0253, 2026: 0.0320 },
};
/* §1.4: genau diese vier, keine weiteren. Die Mechanik "gleich" bleibt als Schalter im Rechner, ist aber kein Lauf dieses Auftrags. */
var LAEUFE = [
  { name: 'A-187', fenster: 'A', korb: S.KORB_N, mechanik: 'app', rolle: 'Hauptzahl' },
  { name: 'B-187', fenster: 'B', korb: S.KORB_N, mechanik: 'app', rolle: 'Hauptzahl' },
  { name: 'A-breit', fenster: 'A', korb: null, mechanik: 'app', rolle: 'nachrichtlich' },
  { name: 'B-breit', fenster: 'B', korb: null, mechanik: 'app', rolle: 'nachrichtlich (der amtliche Rückblick Nr. 74)' },
];
/* §2: breiter Korb im Fenster B, Endwerte in $ (aus dem Auftrag; dieselben Zahlen stehen in Nr. 78 unter selbstpruefung) */
var SOLL_B_BREIT = { buchEnde: 165209.66, spyEnde: 181193.87 };
/* Nachrichtlich (aendert keine Zahl): Zaehlung des PM ueber alle 63 Startphasen, vor Steuern - voll / verkleinert / unter 5 % / ausgefallen
 * (wiki/belegstand.md, Fund "Kleinstpositionen" bei der Abnahme von Nr. 78). Dient nur dem Vergleich mit dem Zaehler dieses Rechners. */
var PM_ZAEHLUNG = { 'A-187': [10106, 983, 318, 1064], 'A-breit': [24170, 1021, 705, 6554], 'B-187': [10051, 1043, 466, 1993] };
var KORREKTUREN = [];                 /* §1.6: jeder behobene Fehler nach dem Siegel wird hier vermerkt */

function round4(x) { return Math.round(x * 10000) / 10000; }
function mit(basis, extra) { var o = {}; Object.keys(basis).forEach(function (k) { o[k] = basis[k]; }); Object.keys(extra).forEach(function (k) { o[k] = extra[k]; }); return o; }
function jahrVon(T, d) { return +String(T.kal.tage[d]).slice(0, 4); }

/* ---------- Aktien-Verlusttopf (§1.2) ----------
 * Topf = Verlustvortrag (<= 0) + Gewinne - Verluste des Jahres bisher. Nach jedem Abrechnungsschritt ist die Jahressteuer
 * max(0, Topf) x Steuersatz; die Differenz zur bisher im Jahr gezahlten Steuer wird belastet (> 0) oder erstattet (< 0) - eine Erstattung
 * ist damit nie groesser als die im selben Jahr gezahlte Steuer. Am Jahreswechsel wird ein negativer Topf vorgetragen; ueber die
 * Jahresgrenze wird nichts erstattet. Ausschuettungen laufen NICHT ueber den Topf. */
function topfNeu(satz) { return { satz: satz, jahr: null, vortrag: 0, saldo: 0, gezahlt: 0, akt: null, jahre: [] }; }
function topfStand(t) { return t.vortrag + t.saldo; }
function topfJahr(t, jahr) {
  if (t.jahr === jahr) return;
  if (t.jahr !== null) {
    var stand = topfStand(t);
    t.akt.topfEnde = stand; t.akt.vortragEnde = stand < 0 ? stand : 0;
    t.vortrag = t.akt.vortragEnde;
  }
  t.jahr = jahr; t.saldo = 0; t.gezahlt = 0;
  t.akt = { jahr: jahr, vortragAnfang: t.vortrag, gewinne: 0, verluste: 0, belastet: 0, erstattet: 0, aktiensteuer: 0, ausschuettungBrutto: 0,
    ausschuettungSteuer: 0, topfEnde: t.vortrag, vortragEnde: t.vortrag };
  t.jahre.push(t.akt);
}
function topfBuche(t, gewinn) {
  t.saldo += gewinn;
  if (gewinn >= 0) t.akt.gewinne += gewinn; else t.akt.verluste -= gewinn;
  t.akt.topfEnde = topfStand(t); t.akt.vortragEnde = t.akt.topfEnde < 0 ? t.akt.topfEnde : 0;
}
/** Ein Abrechnungsschritt. Rueckgabe: Belastung (> 0) oder Erstattung (< 0) - vom Bargeld abzuziehen. */
function topfAbrechnen(t) {
  var soll = Math.max(0, topfStand(t)) * t.satz, diff = soll - t.gezahlt;
  t.gezahlt = soll; t.akt.aktiensteuer = soll;
  if (diff > 0) t.akt.belastet += diff; else t.akt.erstattet -= diff;
  return diff;
}

/* ---------- Zaehler der geplanten Kaeufe (§1.5): voll / verkleinert / unter 5 % des Budgets / ausgefallen (vier getrennte Faecher) ---------- */
function zaehlerNeu() { return { geplant: 0, voll: 0, verkleinert: 0, unter5: 0, ausgefallen: 0 }; }
function zaehle(z, geplant, ausgefuehrt, kurs, budget) {
  z.geplant++;
  if (!(ausgefuehrt > 0)) z.ausgefallen++;
  else if (ausgefuehrt >= geplant) z.voll++;
  else if (ausgefuehrt * kurs < MODELL.kleinstkaufGrenze * budget) z.unter5++;
  else z.verkleinert++;
}
function zaehlerPlus(a, b) { Object.keys(b).forEach(function (k) { a[k] += b[k]; }); return a; }

/* ---------- Die EINE Stelle, an der Planung und Ausfuehrung gerufen werden (§1.2, §5.3) ----------
 * Einmal planen; die Verkaeufe des Plans ausfuehren; zwischen(gewinne) rechnet die Steuer ab (Bargeld sinkt oder steigt) und gibt den
 * Betrag zurueck; dann die Kaeufe des Plans in Rangfolge - reicht das Bargeld nicht, verkleinert fuehreAus wie immer.
 * Gewinn eines Verkaufs = Erloes nach Kosten - Stueck x einstand (derselbe Ausdruck wie pnl in fuehreAus; Klinke auf den Cent).
 * Mit Steuersatz 0 ist das woertlich der Ablauf aus Nr. 78 (ein Plan, alle Verkaeufe, dann alle Kaeufe). */
function handel(buch, ziel, preise, nowMs, mech, zwischen) {
  if (mech === 'gleich') return handelGleich(buch, ziel, preise, nowMs, zwischen);
  var k = KOSTEN_BP / 10000, z = zaehlerNeu();
  var plan = MH.planeUmschichtung(ziel, buch, preise);
  var gewinne = plan.verkaufen.map(function (o) {
    var p = buch.positionen.filter(function (x) { return x.sym === o.sym; })[0];
    var erloes = p.stueck * o.kurs * (1 - k);
    return erloes - p.stueck * p.einstand;
  });
  var geplant = plan.kaufen.map(function (o) { return o.stueck; });
  buch.trades = [];
  var n = MH.fuehreAus(buch, { verkaufen: plan.verkaufen, kaufen: [] }, nowMs, KOSTEN_BP);
  if (n !== gewinne.length || buch.trades.some(function (t, i) { return t.art !== 'verkauf' || t.pnl !== Math.round(gewinne[i] * 100) / 100; })) {
    throw new Error('KLINKE: Verkaufsgewinn weicht vom Ergebnis der App (pnl) ab');
  }
  var steuer = zwischen(gewinne);
  buch.trades = [];
  n += MH.fuehreAus(buch, { verkaufen: [], kaufen: plan.kaufen }, nowMs, KOSTEN_BP);
  buch.trades = [];
  plan.kaufen.forEach(function (o, i) {
    var p = buch.positionen.filter(function (x) { return x.sym === o.sym; })[0];
    zaehle(z, geplant[i], p ? p.stueck : 0, o.kurs, o.budget);
  });
  return { verkauft: plan.verkaufen.map(function (x) { return x.sym; }), neuErwartet: n - plan.verkaufen.length, ohneKurs: plan.fehltKurs.length,
    gehalten: plan.halten.length, teilverkaeufe: 0, aufstockungen: 0, steuer: steuer, kaeufe: z, volumen: null };
}
/** Mechanik "Gleichgewicht" aus Nr. 78 (korb.js gleichgewicht, dieselben Ausdruecke in derselben Reihenfolge), geteilt in Verkaeufe und
 *  Kaeufe mit der Steuer dazwischen. Kein Lauf dieses Auftrags - der Schalter bleibt, damit ein spaeterer Lauf kein Umbau ist. */
function handelGleich(buch, ziel, preise, nowMs, zwischen) {
  var k = KOSTEN_BP / 10000, zielSet = {}, wert = buch.cash, bleiben = [], gewinne = [], z = zaehlerNeu();
  var aus = { verkauft: [], teilverkauft: 0, aufgestockt: 0, gekauft: 0, fehltKurs: 0, volumen: 0 };
  ziel.forEach(function (s) { zielSet[s] = true; });
  buch.positionen.forEach(function (p) { var kurs = preise[p.sym]; if (kurs > 0) wert += p.stueck * kurs; else aus.fehltKurs++; });
  var budget = ziel.length ? wert / ziel.length : 0;
  buch.positionen.forEach(function (p) {
    var kurs = preise[p.sym];
    if (!(kurs > 0)) { bleiben.push(p); return; }
    if (!zielSet[p.sym]) {
      buch.cash += p.stueck * kurs * (1 - k); gewinne.push(p.stueck * kurs * (1 - k) - p.stueck * p.einstand);
      aus.volumen += p.stueck * kurs; aus.verkauft.push(p.sym); return;
    }
    var st = round4((p.stueck * kurs - budget) / kurs);
    if (st > 0) {
      if (st > p.stueck) st = p.stueck;
      buch.cash += st * kurs * (1 - k); gewinne.push(st * kurs * (1 - k) - st * p.einstand); aus.volumen += st * kurs;
      p.stueck = round4(p.stueck - st); aus.teilverkauft++;
    }
    bleiben.push(p);
  });
  buch.positionen = bleiben;
  var steuer = zwischen(gewinne);
  ziel.forEach(function (s) {
    var kurs = preise[s], p = null;
    buch.positionen.forEach(function (x) { if (x.sym === s) p = x; });
    if (!(kurs > 0)) { if (!p) aus.fehltKurs++; return; }
    var st = round4((budget - (p ? p.stueck * kurs : 0)) / kurs), geplant = st;
    if (!(st > 0)) return;
    var kosten = st * kurs * (1 + k);
    if (kosten > buch.cash) {
      st = Math.max(0, Math.floor(buch.cash / (kurs * (1 + k)) * 10000) / 10000);
      kosten = st * kurs * (1 + k);
      if (!(st > 0)) { zaehle(z, geplant, 0, kurs, budget); return; }
    }
    zaehle(z, geplant, st, kurs, budget);
    buch.cash -= kosten; aus.volumen += st * kurs;
    if (p) { p.einstand = (p.stueck * p.einstand + kosten) / (p.stueck + st); p.stueck = round4(p.stueck + st); aus.aufgestockt++; }
    else { buch.positionen.push({ sym: s, stueck: st, einstand: kurs * (1 + k), seit: nowMs }); aus.gekauft++; }
  });
  return { verkauft: aus.verkauft, neuErwartet: aus.gekauft, ohneKurs: aus.fehltKurs, gehalten: buch.positionen.length - aus.gekauft,
    teilverkaeufe: aus.teilverkauft, aufstockungen: aus.aufgestockt, steuer: steuer, kaeufe: z, volumen: aus.volumen };
}

function offenWert(buch, preise) {
  var w = buch.cash;
  buch.positionen.forEach(function (p) { if (preise[p.sym] > 0) w += p.stueck * preise[p.sym]; });
  return w;
}

/* ---------- Der Nachlauf eines Buchs mit der Steuerschicht ----------
 * Eigene Kopie von simuliere() aus Nr. 78 (dieselben sechs Schritte in derselben Reihenfolge, dieselben Ausdruecke). Neu sind nur:
 * opt.steuersatz (leer = 26,375 %), der Aktien-Verlusttopf (Reihenende und Verkaeufe), die Steuer zwischen Verkaeufen und Kaeufen,
 * die Ausschuettung netto, der Zaehler der geplanten Kaeufe und der zweite Endwert "alles verkauft". */
function simuliere(T, Q, M, opt) {
  var g = T.g, startTag = opt.startTag, endTag = opt.endTag, mitA = opt.ausschuettungen !== false;
  var korbN = opt.korb || null, mech = opt.mechanik || 'app', satz = opt.steuersatz == null ? MODELL.steuersatz : opt.steuersatz;
  if (mech !== 'app' && mech !== 'gleich') throw new Error('unbekannte Mechanik: ' + mech);
  if (!(satz >= 0 && satz < 1)) throw new Error('Steuersatz ausserhalb von [0, 1): ' + satz);
  var tv = {}; (opt.totalverlust || []).forEach(function (x) { tv[x] = true; });
  var halten = MH.buchKonfig().halten, spy = T.symIdx[R.MASSSTAB], kB = KOSTEN_BP / 10000;
  var o0 = Q.ord[startTag], oEnd = Q.ord[endTag];
  if (!(o0 >= 1) || !(oEnd >= o0)) throw new Error('Start/Ende ist kein Panel-Handelstag oder hat keinen Vortag');
  var zSpy0 = T.zeileVon(spy, startTag);
  if (zSpy0 < 0) throw new Error('Massstab ohne Zeile am Starttag');
  var buch = { cash: START, positionen: [], trades: [] }, meta = {}, topf = topfNeu(satz);
  var zs = { umschichtungen: 0, zuWenigTage: 0, kosten: 0, kaeufe: 0, verkaeufe: 0, teilverkaeufe: 0, aufstockungen: 0, positionen: 0, ausschuettungen: 0,
    ausschuettungSumme: 0, ausschuettungNetto: 0, lueckentage: 0, spyAusschuettungen: 0, spyAusschuettungSumme: 0 };
  var kaeufe = zaehlerNeu(), reihenenden = [], umschichtungen = [], tage = [];
  var spyStueck = START / g.bEroeffnung[zSpy0], spySchluss = NaN;
  var buchWert = START, spyWert = START;                       /* Werte zum Schluss des Vortags */
  var naechste = startTag;
  function abrechnen() {
    var diff = topfAbrechnen(topf);
    buch.cash -= diff;
    if (buch.cash < -1e-6) throw new Error('KLINKE: Bargeld negativ nach der Steuer am ' + T.kal.tage[Q.ptage[o]]);
    return diff;
  }
  function steuerSchritt(gewinne) { gewinne.forEach(function (x) { topfBuche(topf, x); }); return abrechnen(); }

  for (var o = o0; o <= oEnd; o++) {
    var d = Q.ptage[o];
    topfJahr(topf, jahrVon(T, d));
    /* 1. Reihenende: erster Panel-Handelstag nach der letzten Zeile -> ausbuchen; Gewinn oder Verlust wie ein Verkauf in den Topf,
     *    abgerechnet am selben Tag (alle Reihenenden des Tages zusammen, vor allem anderen) */
    var enden = 0;
    for (var i = buch.positionen.length - 1; i >= 0; i--) {
      var p = buch.positionen[i], m = meta[p.sym];
      if (T.zeileVon(m.sym, d) >= 0) continue;
      var lz = T.letzteZeile(m.sym);
      if (g.tag[lz] < d) {
        var grund = T.endeGrund[m.sym] || null, total = !!(grund && tv[grund]);
        var gut = total ? 0 : p.stueck * g.bSchluss[lz], gewinnEnde = gut - p.stueck * p.einstand;
        buch.cash += gut;
        topfBuche(topf, gewinnEnde); enden++;
        buch.positionen.splice(i, 1);
        reihenenden.push({ reihe: p.sym, tag: String(T.kal.tage[d]), letzteZeile: String(T.kal.tage[g.tag[lz]]), grund: grund, totalverlust: total,
          gutschrift: gut, gewinn: gewinnEnde });
        delete meta[p.sym];
      } else zs.lueckentage++;
    }
    if (enden) abrechnen();
    /* 2. Ausschuettungen mit Ex-Tag d: Anspruch hat, wer die Position ueber die Nacht hielt (Stueckzahl VOR dem Handel des Tages) */
    var bar = 0;
    if (mitA) buch.positionen.forEach(function (p2) {
      var m2 = meta[p2.sym];
      if (!(m2.seitTag < d)) return;
      R.ausschuettungenAm(T, Q, M, m2.sym, d).forEach(function (a) { bar += p2.stueck * a.basis * a.satz; zs.ausschuettungen++; });
    });
    /* 3. Umschichtung zur Eroeffnung des Ausfuehrungstags; Stichtag = Panel-Handelstag davor */
    if (d === naechste) {
      var s = Q.ptage[o - 1], zl = S.zielAm(T, Q, s, korbN);
      if (zl.zuWenig) { zs.zuWenigTage++; naechste = o + 1 <= oEnd ? Q.ptage[o + 1] : -1; }
      else {
        var preise = {};
        var kurs = function (name) { var z = T.zeileVon(T.symIdx[name], d); if (z >= 0 && g.bEroeffnung[z] > 0) preise[name] = g.bEroeffnung[z]; };
        zl.ziel.forEach(kurs); buch.positionen.forEach(function (p3) { kurs(p3.sym); });
        var vor = offenWert(buch, preise);
        var H = handel(buch, zl.ziel, preise, Q.ms[d], mech, steuerSchritt);
        var kosten = vor - offenWert(buch, preise) - H.steuer;
        if (mech === 'gleich' && Math.abs(kosten - H.volumen * kB) > 1e-6) throw new Error('KLINKE: Kosten sind nicht ' + KOSTEN_BP + ' Bp auf das gehandelte Volumen');
        H.verkauft.forEach(function (name) { delete meta[name]; });
        var neu = 0;
        buch.positionen.forEach(function (p4) {
          if (meta[p4.sym]) return;
          meta[p4.sym] = { sym: T.symIdx[p4.sym], seitTag: d, schluss: NaN };
          neu++; zs.positionen++;
        });
        if (neu !== H.neuErwartet) throw new Error('KLINKE: Zahl der Ausfuehrungen passt nicht zum Buch');
        zs.umschichtungen++; zs.kosten += kosten; zs.kaeufe += neu; zs.verkaeufe += H.verkauft.length; zs.teilverkaeufe += H.teilverkaeufe; zs.aufstockungen += H.aufstockungen;
        zaehlerPlus(kaeufe, H.kaeufe);
        umschichtungen.push({ ausfuehrungstag: String(T.kal.tage[d]), stichtag: String(T.kal.tage[s]), zielzahl: zl.ziel.length, verkaeufe: H.verkauft.length, kaeufe: neu,
          gehalten: H.gehalten, ohneKurs: H.ohneKurs, kosten: kosten, steuer: H.steuer, geplanteKaeufe: H.kaeufe, positionenDanach: buch.positionen.length });
        naechste = o + halten <= oEnd ? Q.ptage[o + halten] : -1;
      }
    }
    /* 4. Ausschuettungen gutschreiben - nach dem Handel des Tages, netto (1 - Steuersatz); keine Verrechnung mit dem Aktien-Verlusttopf */
    var netto = bar * (1 - satz);
    buch.cash += netto; zs.ausschuettungSumme += bar; zs.ausschuettungNetto += netto;
    topf.akt.ausschuettungBrutto += bar; topf.akt.ausschuettungSteuer += bar - netto;
    /* 5. Massstab wie in Nr. 78 (SPY, Ausschuettung am Ex-Tag zum Schlusskurs voll wieder angelegt) - der Fonds "vor Steuern" */
    var zS = T.zeileVon(spy, d);
    if (zS >= 0) {
      if (mitA && d > startTag) R.ausschuettungenAm(T, Q, M, spy, d).forEach(function (a) {
        var betrag = spyStueck * a.basis * a.satz;
        spyStueck += betrag / g.bSchluss[zS];
        zs.spyAusschuettungen++; zs.spyAusschuettungSumme += betrag;
      });
      spySchluss = g.bSchluss[zS];
    }
    spyWert = spyStueck * spySchluss;
    /* 6. Bewertung zum Schluss; fehlt die Zeile, gilt der letzte Schlusskurs (nie der Einstand) */
    var schluss = {};
    buch.positionen.forEach(function (p5) {
      var m5 = meta[p5.sym], z5 = T.zeileVon(m5.sym, d);
      if (z5 >= 0) m5.schluss = g.bSchluss[z5];
      schluss[p5.sym] = m5.schluss;
    });
    var bw = MH.bewerte(buch, schluss);
    if (bw.ohneKurs.length) throw new Error('KLINKE: Position ohne Schlusskurs: ' + bw.ohneKurs.join(','));
    buchWert = bw.wert;
    tage.push({ tag: d, buch: buchWert, spy: spyWert, bar: buch.cash });
  }
  /* Endwert (b) "alles verkauft": am letzten Tag zum Schlusskurs (fehlt die Zeile: letzter Schlusskurs, wie die Bewertung), 20 Bp Kosten,
   * Gewinne und Verluste in den Topf des letzten Jahres, ein Abrechnungsschritt; ein dann verbleibender Verlusttopf verfaellt.
   * Das Buch selbst bleibt unveraendert (Endwert (a) ist der Buchwert zum Schluss). */
  var ev = { erloes: 0, kosten: 0, gewinn: 0, positionen: buch.positionen.length };
  buch.positionen.forEach(function (p6) {
    var ks = meta[p6.sym].schluss, erloes = p6.stueck * ks * (1 - kB);
    ev.erloes += erloes; ev.kosten += p6.stueck * ks * kB; ev.gewinn += erloes - p6.stueck * p6.einstand;
  });
  ev.topfDanach = topfStand(topf) + ev.gewinn;
  ev.steuer = Math.max(0, ev.topfDanach) * satz - topf.gezahlt;
  ev.verfallen = ev.topfDanach < 0 ? -ev.topfDanach : 0;
  var laufend = topf.jahre.reduce(function (a, j) { return a + j.aktiensteuer + j.ausschuettungSteuer; }, 0);
  return { startTag: startTag, endTag: endTag, endBuch: buchWert, endBuchVerkauft: buch.cash + ev.erloes - ev.steuer, endSpy: spyWert, tage: tage,
    umschichtungen: umschichtungen, reihenenden: reihenenden, zaehler: zs, kaeufe: kaeufe, positionenAmEnde: buch.positionen.length, buch: buch,
    steuer: { satz: satz, jahre: topf.jahre, laufend: laufend, endverkauf: ev, gesamtA: laufend, gesamtB: laufend + ev.steuer } };
}

/* ---------- Der Indexfonds (§1.3, §5.1) ---------- */
/** Vorabpauschale eines Kalenderjahres. Basisertrag = Wert am Jahresanfang x Basiszins x 0,7 (im Kaufjahr x zwoelftel); ist der Basiszins
 *  nicht positiv, gibt es keine. Vorabpauschale = min(Basisertrag, Wertzuwachs), mindestens 0. Steuerbar 70 % (Teilfreistellung 30 %). */
function vorabpauschale(wertAnfang, basiszins, wertzuwachs, zwoelftel, par) {
  par = par || MODELL;
  var basisertrag = basiszins > 0 ? wertAnfang * basiszins * par.basisertragAnteil * (zwoelftel == null ? 1 : zwoelftel) : 0;
  var vp = Math.max(0, Math.min(basisertrag, wertzuwachs)), steuerbar = vp * (1 - par.teilfreistellung);
  return { basisertrag: basisertrag, vorabpauschale: vp, steuerbar: steuerbar, steuer: steuerbar * par.steuersatz };
}
/** Der Fonds ueber eine Reihe von Handelstagen: reihe[i] = { datum: 'JJJJ-MM-TT', eroeffnung, schluss, aus: [Betrag je Stueck, ...] }.
 *  reihe[0] ist der Kauftag (Kauf zur Eroeffnung, ohne Kaufkosten; eine Ausschuettung mit Ex-Tag am Kauftag zaehlt nicht, wie beim Massstab).
 *  Anteilswert = Kurs x f; f waechst am Ex-Tag um die zu 85 % zum Schluss wieder angelegte Ausschuettung und sinkt je Handelstag um die
 *  laufenden Kosten. Am ersten Handelstag eines neuen Jahres: Vorabpauschale des abgelaufenen Jahres, Steuer durch Verkauf von Anteilen
 *  zur Eroeffnung; danach ist der Wert der verbliebenen Anteile zur Eroeffnung der Jahresanfangswert des neuen Jahres. Fuer das letzte
 *  Jahr der Reihe gibt es keine Vorabpauschale (Faelligkeit nach dem Fensterende; im Verkaufsjahr keine). */
function fonds(reihe, start, par) {
  par = par || MODELL;
  var cTag = Math.pow(1 - par.kostenPa, 1 / par.handelstageJeJahr);
  var f = 1, kaufNav = reihe[0].eroeffnung, anteile = start / kaufNav, anteileKauf = anteile;
  var jahr = +reihe[0].datum.slice(0, 4), zwoelftel = (13 - (+reihe[0].datum.slice(5, 7))) / 12;
  var wertAnfang = start, navSchluss = NaN, vpJeAnteil = 0, jahre = [], vorabSteuer = 0;
  reihe.forEach(function (x, i) {
    var j = +x.datum.slice(0, 4);
    if (j !== jahr) {
      if (j !== jahr + 1) throw new Error('KLINKE: Fonds - Kalenderjahr uebersprungen vor ' + x.datum);
      var zins = par.basiszins[jahr];
      if (zins == null) throw new Error('KLINKE: kein Basiszins fuer ' + jahr);
      var wertEnde = anteile * navSchluss, v = vorabpauschale(wertAnfang, zins, wertEnde - wertAnfang, zwoelftel, par);
      var navAuf = x.eroeffnung * f, verkauft = v.steuer / navAuf;
      jahre.push({ jahr: jahr, basiszins: zins, zwoelftel: zwoelftel, wertAnfang: wertAnfang, wertEnde: wertEnde, wertzuwachs: wertEnde - wertAnfang, basisertrag: v.basisertrag,
        vorabpauschale: v.vorabpauschale, steuerbar: v.steuerbar, steuer: v.steuer, faellig: x.datum, anteileVorher: anteile, anteileVerkauft: verkauft });
      vpJeAnteil += v.vorabpauschale / anteile;
      anteile -= verkauft; vorabSteuer += v.steuer;
      jahr = j; zwoelftel = 1; wertAnfang = anteile * navAuf;
    }
    if (i > 0) (x.aus || []).forEach(function (a) { f *= 1 + par.wiederanlage * a / x.schluss; });
    f *= cTag;
    navSchluss = x.schluss * f;
  });
  var endA = anteile * navSchluss, kaufwert = anteile * kaufNav, vpAnteilig = vpJeAnteil * anteile, gewinn = endA - kaufwert - vpAnteilig;
  var steuerbar = Math.max(0, gewinn) * (1 - par.teilfreistellung), steuerEnde = steuerbar * par.steuersatz;
  return { endA: endA, endB: endA - steuerEnde, anteileKauf: anteileKauf, anteile: anteile, faktor: f, jahre: jahre, letztesJahrOhneVorabpauschale: jahr, vorabSteuer: vorabSteuer,
    endverkauf: { endwert: endA, kaufwert: kaufwert, vorabpauschalenAnteilig: vpAnteilig, gewinn: gewinn, steuerbar: steuerbar, steuer: steuerEnde }, gesamtB: vorabSteuer + steuerEnde };
}
/** Die SPY-Reihe des Panels fuer den Fonds: Kurse und Ausschuettungen aus derselben Funktion wie der Massstab in Nr. 78 (mit der Ergaenzung). */
function spyReihe(T, Q, M, startTag, endTag) {
  var g = T.g, spy = T.symIdx[R.MASSSTAB], aus = [];
  for (var o = Q.ord[startTag]; o <= Q.ord[endTag]; o++) {
    var d = Q.ptage[o], z = T.zeileVon(spy, d);
    if (z < 0) throw new Error('KLINKE: Massstab ohne Zeile am ' + T.kal.tage[d]);
    aus.push({ datum: String(T.kal.tage[d]), eroeffnung: g.bEroeffnung[z], schluss: g.bSchluss[z],
      aus: R.ausschuettungenAm(T, Q, M, spy, d).map(function (a) { return a.basis * a.satz; }) });
  }
  return aus;
}

/* ---------- Kennzahlen: p. a. wie R.kennzahlen (Kalenderzeit vom ersten Ausfuehrungstag bis zum letzten Tag) ---------- */
function jahreVon(Q, startTag, endTag) { return (Q.ms[endTag] - Q.ms[startTag]) / (365.25 * 86400000); }
function pa(ende, jahre) { return (Math.pow(ende / START, 1 / jahre) - 1) * 100; }
function lesart(buchEnde, fondsEnde, jahre) {
  var b = pa(buchEnde, jahre), f = pa(fondsEnde, jahre);
  return { buchEnde: buchEnde, fondsEnde: fondsEnde, buchPa: b, fondsPa: f, abstandPa: b - f, vorn: buchEnde > fondsEnde };
}
/** Eine Startphase in allen drei Lesarten: vor Steuern (Steuersatz 0, Fonds = SPY wie in Nr. 78), nach Steuern (a) und (b). */
function einePhase(T, Q, M, def, startTag, endTag, totalverlust, reihe) {
  var basis = { startTag: startTag, endTag: endTag, totalverlust: totalverlust, korb: def.korb, mechanik: def.mechanik };
  var L0 = simuliere(T, Q, M, mit(basis, { steuersatz: 0 })), L1 = simuliere(T, Q, M, mit(basis, { steuersatz: MODELL.steuersatz }));
  var Fo = fonds(reihe, START, MODELL), jahre = jahreVon(Q, startTag, endTag);
  return { L0: L0, L1: L1, Fo: Fo, jahre: jahre, vor: lesart(L0.endBuch, L0.endSpy, jahre), a: lesart(L1.endBuch, Fo.endA, jahre), b: lesart(L1.endBuchVerkauft, Fo.endB, jahre) };
}
function gleichCent(a, b) { return Math.round(a * 100) === Math.round(b * 100); }
function zusammen(phasen, key) {
  var ab = phasen.map(function (p) { return p[key].abstandPa; });
  return { vorn: phasen.filter(function (p) { return p[key].vorn; }).length, anzahl: phasen.length, minimum: Math.min.apply(null, ab), median: R.median(ab), maximum: Math.max.apply(null, ab) };
}
function pick(z) { return { voll: z.voll, verkleinert: z.verkleinert, unter5: z.unter5, ausgefallen: z.ausgefallen }; }

/* ---------- Ein Lauf der vier: k = 0 und die 63 Startphasen in drei Lesarten ----------
 * soll (oder null): { buchEnde, spyEnde, phasen } aus Nr. 78 / Nr. 74 - jede Phase "vor Steuern" wird damit verglichen (Selbstpruefung). */
function einLauf(T, Q, M, def, F, totalverlust, soll, nPhasen) {
  var erster = F.von, endTag = F.bis, reihe = spyReihe(T, Q, M, erster, endTag), phasen = [], P0 = null;
  var sp = { k0AufCent: null, phasenAufCent: 0, phasenBitgleich: 0, abweichend: [] }, alle = { vor: zaehlerNeu(), nach: zaehlerNeu() };
  for (var k = 0; k < (nPhasen || PHASEN); k++) {
    var st = Q.ptage[Q.ord[erster] + k], P = einePhase(T, Q, M, def, st, endTag, totalverlust, reihe.slice(k)), start = String(T.kal.tage[st]);
    if (soll) {
      var sollP = soll.phasen[k], bg = (P.L0.endBuch / START - 1) * 100, sg = (P.L0.endSpy / START - 1) * 100;
      if (sollP.k !== k || sollP.start !== start) throw new Error('KLINKE: Soll-Phase ' + k + ' passt nicht (' + sollP.start + ' statt ' + start + ')');
      var cent = gleichCent(P.L0.endBuch, START * (1 + sollP.buchGesamt / 100)) && gleichCent(P.L0.endSpy, START * (1 + sollP.spyGesamt / 100));
      if (cent) sp.phasenAufCent++; else sp.abweichend.push(k);
      if (sollP.buchGesamt === bg && sollP.spyGesamt === sg) sp.phasenBitgleich++;
      if (k === 0) sp.k0AufCent = gleichCent(P.L0.endBuch, soll.buchEnde) && gleichCent(P.L0.endSpy, soll.spyEnde);
    }
    if (k === 0) P0 = P;
    zaehlerPlus(alle.vor, P.L0.kaeufe); zaehlerPlus(alle.nach, P.L1.kaeufe);
    phasen.push({ k: k, start: start, jahre: P.jahre, vor: P.vor, a: P.a, b: P.b,
      steuerBuch: { laufend: P.L1.steuer.laufend, endverkauf: P.L1.steuer.endverkauf.steuer, gesamt: P.L1.steuer.gesamtB },
      steuerFonds: { vorab: P.Fo.vorabSteuer, endverkauf: P.Fo.endverkauf.steuer, gesamt: P.Fo.gesamtB },
      kaeufe: { vor: pick(P.L0.kaeufe), nach: pick(P.L1.kaeufe) } });
  }
  if (soll && (!sp.k0AufCent || sp.abweichend.length)) throw new Error('SELBSTPRUEFUNG nicht bestanden im Lauf ' + def.name + ': k = 0 ' + sp.k0AufCent + ', abweichende Phasen ' + sp.abweichend.join(','));
  var L0 = P0.L0, L1 = P0.L1, Fo = P0.Fo, fOhne = fonds(reihe, START, mit(MODELL, { steuersatz: 0 }));
  var pm = PM_ZAEHLUNG[def.name] || null, av = alle.vor;
  return {
    name: def.name, rolle: def.rolle, fensterName: def.fenster, korb: def.korb || 'alle zulaessigen', mechanik: def.mechanik === 'gleich' ? 'Gleichgewicht' : 'wie die App',
    fenster: { von: String(T.kal.tage[erster]), bis: String(T.kal.tage[endTag]), handelstage: L0.tage.length, jahre: P0.jahre },
    k0: { vor: P0.vor, a: P0.a, b: P0.b,
      bremse: { buchPp: P0.vor.buchPa - P0.b.buchPa, fondsPp: P0.vor.fondsPa - P0.b.fondsPa, buchPpBleibtStehen: P0.vor.buchPa - P0.a.buchPa, fondsPpBleibtStehen: P0.vor.fondsPa - P0.a.fondsPa },
      steuerBuch: { laufend: L1.steuer.laufend, endverkauf: L1.steuer.endverkauf, gesamtA: L1.steuer.gesamtA, gesamtB: L1.steuer.gesamtB, jahre: L1.steuer.jahre },
      steuerFonds: { vorab: Fo.vorabSteuer, endverkauf: Fo.endverkauf, gesamtB: Fo.gesamtB, jahre: Fo.jahre, letztesJahrOhneVorabpauschale: Fo.letztesJahrOhneVorabpauschale,
        anteileKauf: Fo.anteileKauf, anteileEnde: Fo.anteile },
      kaeufe: { vor: pick(L0.kaeufe), nach: pick(L1.kaeufe) },
      buch: { umschichtungen: L1.zaehler.umschichtungen, zuWenigTage: L1.zaehler.zuWenigTage, reihenenden: L1.reihenenden, kostenVor: L0.zaehler.kosten, kostenNach: L1.zaehler.kosten,
        ausschuettungBrutto: L1.zaehler.ausschuettungSumme, ausschuettungNetto: L1.zaehler.ausschuettungNetto, positionenAmEnde: L1.positionenAmEnde, umschichtungenListe: L1.umschichtungen },
      /* nachrichtlich, keine weiteren Laeufe: was in der "Bremse" steckt, das keine deutsche Steuer ist */
      nachrichtlich: { buchVorSteuernVerkauft: L0.endBuchVerkauft, buchVerkaufskostenPp: P0.vor.buchPa - pa(L0.endBuchVerkauft, P0.jahre),
        fondsOhneDeutscheSteuer: fOhne.endA, fondsQuellensteuerUndKostenPp: P0.vor.fondsPa - pa(fOhne.endA, P0.jahre) } },
    phasen: phasen,
    zusammenfassung: { vor: zusammen(phasen, 'vor'), a: zusammen(phasen, 'a'), b: zusammen(phasen, 'b') },
    kaeufeAllePhasen: { vor: pick(alle.vor), nach: pick(alle.nach), zaehlungPM: pm,
      gleichDerZaehlungPM: pm ? (av.voll === pm[0] && av.verkleinert === pm[1] && av.unter5 === pm[2] && av.ausgefallen === pm[3]) : null },
    selbstpruefung: soll ? { quelle: soll.quelle, sollBuch: soll.buchEnde, sollSpy: soll.spyEnde, buchEnde: L0.endBuch, spyEnde: L0.endSpy, k0AufCent: sp.k0AufCent,
      phasenAufCent: sp.phasenAufCent, phasenBitgleich: sp.phasenBitgleich, anzahl: phasen.length } : null,
  };
}

/* ---------- Die Sollwerte der Selbstpruefung (§2, §5.2): nur lesen ---------- */
function sollLesen() {
  var E78 = JSON.parse(fs.readFileSync(path.join(REPO, NR78, 'ergebnis.json'), 'utf8'));
  var E74 = JSON.parse(fs.readFileSync(path.join(REPO, NR74, 'ergebnis.json'), 'utf8'));
  var aus = {};
  ['A-187', 'B-187', 'A-breit', 'A-187-gleich', 'B-187-gleich'].forEach(function (n) {
    var l = E78.laeufe[n];
    aus[n] = { buchEnde: l.haupt.buchEnde, spyEnde: l.haupt.spyEnde, phasen: l.zufallsbereich.startphasen.phasen, quelle: 'Nr. 78 ergebnis.json laeufe["' + n + '"]' };
  });
  aus['B-breit'] = { buchEnde: E78.selbstpruefung.buchEnde, spyEnde: E78.selbstpruefung.spyEnde, phasen: E74.zufallsbereich.startphasen.phasen,
    quelle: 'Nr. 78 ergebnis.json selbstpruefung (k = 0), Nr. 74 ergebnis.json zufallsbereich.startphasen (Phasen)' };
  if (!gleichCent(aus['B-breit'].buchEnde, SOLL_B_BREIT.buchEnde) || !gleichCent(aus['B-breit'].spyEnde, SOLL_B_BREIT.spyEnde)) throw new Error('KLINKE: Soll fuer B-breit ist nicht 165.209,66 / 181.193,87');
  Object.keys(aus).forEach(function (n) { if (aus[n].phasen.length !== PHASEN) throw new Error('KLINKE: Soll ' + n + ' hat nicht ' + PHASEN + ' Phasen'); });
  return aus;
}

/* ---------- Bericht ---------- */
function de(x, n) { return x.toFixed(n == null ? 2 : n).replace('.', ','); }
function vz(x, n) { return (x >= 0 ? '+' : '−') + de(Math.abs(x), n); }
function datumDe(d) { var p = String(d).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }
function dollar(x) { return (x < 0 ? '−' : '') + de(Math.abs(x), 0).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function sha(datei) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, datei))).digest('hex').slice(0, 16); }
function vier(z) { return z.voll + ' / ' + z.verkleinert + ' / ' + z.unter5 + ' / ' + z.ausgefallen; }

/** Der vorher festgelegte Satz (§1.5) fuer einen Lauf. */
function satz(l) {
  var Z = l.zusammenfassung;
  return 'Nach Steuern, alles verkauft: Buch ' + vz(l.k0.b.buchPa) + ' % p. a. gegen Indexfonds ' + vz(l.k0.b.fondsPa) + ' % p. a., Abstand ' + vz(l.k0.b.abstandPa) + ' Pp p. a. (vor Steuern ' +
    vz(l.k0.vor.abstandPa) + ' Pp p. a.); in ' + Z.b.vorn + ' von ' + Z.b.anzahl + ' Startphasen liegt das Buch vorn (Median des Abstands ' + vz(Z.b.median) + ' Pp p. a., vor Steuern ' + vz(Z.vor.median) + ').';
}
function ergebnisText(E) {
  var namen = LAEUFE.map(function (l) { return l.name; }), Z = [];
  Z.push('# Nach Steuern — der Rückblick für ein deutsches Privatdepot (Auftrag Nr. 82)');
  Z.push('');
  Z.push('**Rechenmodell mit Annahmen, keine Steuerberatung.** Beschreibende Zahlen nach der Regel in `REGEL.md` (vor dem Lauf festgelegt), kein Urteil; es entscheidet Wilhelm. ' +
    'Kennung `' + E.kennung + '`, Panel `' + E.panelKennung + '`. Alles Simulation.');
  Z.push('');
  namen.forEach(function (n) {
    var l = E.laeufe[n], k = l.k0, q = l.kaeufeAllePhasen;
    Z.push('**' + n + '** (' + datumDe(l.fenster.von) + ' bis ' + datumDe(l.fenster.bis) + ', ' + (l.korb === S.KORB_N ? 'Korb der 187 umsatzstärksten' : 'alle zulässigen Werte') + ', ' + l.rolle + '). ' + l.satz +
      ' Gezahlte Steuer des Buchs ' + dollar(k.steuerBuch.gesamtB) + ' $ (laufend ' + dollar(k.steuerBuch.laufend) + ' $, Endverkauf ' + dollar(k.steuerBuch.endverkauf.steuer) + ' $) — ' + de(k.bremse.buchPp) +
      ' Pp p. a. weniger als vor Steuern; des Fonds ' + dollar(k.steuerFonds.gesamtB) + ' $ (Vorabpauschalen ' + dollar(k.steuerFonds.vorab) + ' $, Endverkauf ' + dollar(k.steuerFonds.endverkauf.steuer) + ' $) — ' +
      de(k.bremse.fondsPp) + ' Pp p. a. weniger als vor Steuern (davon ' + de(k.nachrichtlich.fondsQuellensteuerUndKostenPp) + ' Pp aus Quellensteuer im Fonds und laufenden Kosten; beim Buch ' +
      de(k.nachrichtlich.buchVerkaufskostenPp) + ' Pp aus den Kosten des Endverkaufs). Geplante Käufe voll / verkleinert / unter 5 % des Budgets / ausgefallen: vor Steuern ' + vier(k.kaeufe.vor) +
      ', nach Steuern ' + vier(k.kaeufe.nach) + ' (k = 0); über alle 63 Startphasen vor Steuern ' + vier(q.vor) + ', nach Steuern ' + vier(q.nach) + '.');
    Z.push('');
  });
  Z.push('| Lauf | Lesart | Buch p. a. | Indexfonds p. a. | Abstand p. a. | Startphasen vorn | Median des Abstands |');
  Z.push('|---|---|---|---|---|---|---|');
  namen.forEach(function (n) {
    var l = E.laeufe[n];
    [['vor', 'vor Steuern (wie Nr. 78 / Nr. 74)'], ['a', 'nach Steuern (a) bleibt stehen'], ['b', '**nach Steuern (b) alles verkauft**']].forEach(function (x, i) {
      var w = l.k0[x[0]], zf = l.zusammenfassung[x[0]];
      Z.push('| ' + (i === 0 ? '**' + n + '**' : '') + ' | ' + x[1] + ' | ' + vz(w.buchPa) + ' % | ' + vz(w.fondsPa) + ' % | ' + vz(w.abstandPa) + ' Pp | ' + zf.vorn + ' von ' + zf.anzahl + ' | ' + vz(zf.median) + ' Pp |');
    });
  });
  Z.push('');
  Z.push('Buch und Indexfonds je für den ersten Ausführungstag des Fensters (k = 0), Startkapital 100.000; „vorn“ heißt Endwert Buch größer als Endwert Fonds. Steuern je Jahr, alle 63 Phasen und die Zähler stehen in `ergebnis.json`.');
  Z.push('');
  Z.push('**Annahmen (vom PM festgelegt, `REGEL.md` Teil A).**');
  Z.push('- Steuersatz 26,375 % (25 % plus Solidaritätszuschlag, keine Kirchensteuer), Sparer-Pauschbetrag 0, heutiges Steuerrecht für alle Jahre; Dollar wie Euro gerechnet (kein Wechselkurs).');
  Z.push('- Buch: Mechanik der App wie in Nr. 78 (20 Basispunkte je Seite, Kleinstpositionen eingeschlossen); die Steuer wird zwischen Verkäufen und Käufen abgerechnet; Aktien-Verlusttopf mit laufender Abrechnung im Kalenderjahr, Vortrag ohne Erstattung; Reihenende wie ein Verkauf; Ausschüttungen netto 73,625 %.');
  Z.push('- Indexfonds: ein Modell, kein bestimmtes Produkt — thesaurierend, Kurs des SPY, Ausschüttungen zu 85 % wieder angelegt, 0,07 % laufende Kosten im Jahr, Kauf und Verkauf ohne Kosten; Vorabpauschale mit den amtlichen Basiszinsen (2017: 0,59 % ist eine Annahme des PM, nicht nachgeschlagen; Wirkung unter 0,1 % des Werts), Teilfreistellung 30 %, bezahlt durch Verkauf von Anteilen am ersten Handelstag des Folgejahres.');
  Z.push('- (a) „bleibt stehen“: Wert am letzten Tag, offene Gewinne unversteuert. (b) „alles verkauft“: Buch mit 20 Basispunkten Kosten, ein verbleibender Verlusttopf verfällt; Fonds mit Abzug der schon versteuerten Vorabpauschalen, 70 % steuerbar.');
  Z.push('- „Vor Steuern“ sind die Zahlen aus Nr. 78 und Nr. 74 (Fonds = SPY mit voller Wiederanlage, ohne Kosten). Der Abstand zu (b) enthält deshalb beim Fonds auch Quellensteuer und Kosten, beim Buch die Kosten des Endverkaufs.');
  Z.push('');
  var S0 = E.selbstpruefung;
  Z.push('**Geprüft.** Selbstprüfung mit Steuersatz 0 gegen Nr. 78 und Nr. 74: ' + namen.map(function (n) {
    var s = E.laeufe[n].selbstpruefung;
    return n + ' ' + dollar(S0[n].buchEnde) + ' $ / ' + dollar(S0[n].spyEnde) + ' $ ' + (S0[n].bestanden ? 'getroffen' : 'NICHT getroffen') + (s ? ', ' + s.phasenAufCent + ' von ' + s.anzahl + ' Phasen auf den Cent' : '');
  }).join('; ') + '. Korrekturen nach dem Siegel: ' + (E.korrekturen.length ? E.korrekturen.length : 'keine') + '. Ein Fenster je Lauf, die 63 Startphasen teilen sich dieselben Jahre; der Korb ist nicht die Liste der App.');
  return Z.join('\n') + '\n';
}

/* ---------- Der eine Lauf: Selbstpruefung, dann die vier Laeufe ---------- */
function lauf(nurSelbstpruefung) {
  var t0 = Date.now();
  var PR = require(path.join(R.PRUEFSTAND, 'pruefstand.js'));
  var T = PR.Tafel(R.PANEL_ORDNER), Q = R.vorbereiten(T), protokoll = { ergaenzt: 0, schonInDerDatei: 0 };
  Q.korbVorab = [S.KORB_N];
  var M = S.Massnahmen(T, Q, S.dateiLeser(null), S.ERGAENZUNGEN, protokoll);
  var e0 = K.EMPFINDLICHKEIT;
  if (e0[0].key !== 'haupt') throw new Error('KLINKE: K.EMPFINDLICHKEIT hat eine andere Ordnung');
  var haupt = e0[0].totalverlust;
  if (T.stand.symbole[T.symIdx[R.MASSSTAB]].ordner !== 'SPY') throw new Error('KLINKE: der Massstab liegt nicht im Ordner SPY');
  var F = S.fensterTage(T, Q), spy = S.spyKlinken(T, Q, M, F), soll = sollLesen();
  if (protokoll.ergaenzt + protokoll.schonInDerDatei !== 1) throw new Error('KLINKE: die SPY-Ergaenzung wurde nicht genau einmal behandelt');

  /* Selbstpruefung (§2): mit Steuersatz 0 fuer k = 0 genau die Endwerte aus Nr. 78 und Nr. 74 - sonst kein Lauf */
  var SP = {}, alleGut = true;
  LAEUFE.forEach(function (def) {
    var L0 = simuliere(T, Q, M, { startTag: F[def.fenster].von, endTag: F[def.fenster].bis, totalverlust: haupt, korb: def.korb, mechanik: def.mechanik, steuersatz: 0 });
    var s = soll[def.name], gut = gleichCent(L0.endBuch, s.buchEnde) && gleichCent(L0.endSpy, s.spyEnde);
    SP[def.name] = { buchEnde: L0.endBuch, spyEnde: L0.endSpy, sollBuch: s.buchEnde, sollSpy: s.spyEnde, bestanden: gut };
    if (!gut) alleGut = false;
    console.log('Selbstpruefung ' + def.name + ': Buch ' + L0.endBuch.toFixed(2) + ' (Soll ' + s.buchEnde.toFixed(2) + '), SPY ' + L0.endSpy.toFixed(2) + ' (Soll ' + s.spyEnde.toFixed(2) + ') -> ' + (gut ? 'bestanden' : 'NICHT bestanden'));
  });
  if (!alleGut) throw new Error('SELBSTPRUEFUNG nicht bestanden - kein Lauf (§2)');
  if (nurSelbstpruefung) return;

  var git = '';
  try { git = require('child_process').execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch (e) { git = 'unbekannt'; }
  var E = {
    kennung: KENNUNG, vollstaendig: false, erzeugt: new Date().toISOString(), panelKennung: T.stand.kennung, panelStand: T.stand.stand, gitHead: git,
    hinweis: 'Rechenmodell mit Annahmen, keine Steuerberatung',
    quellen: { 'mfhandel.js': sha('mfhandel.js'), 'korb.js': sha(path.join(NR78, 'korb.js')), 'rueckblick.js': sha(path.join(NR74, 'rueckblick.js')),
      'Nr. 78 ergebnis.json': sha(path.join(NR78, 'ergebnis.json')), 'Nr. 74 ergebnis.json': sha(path.join(NR74, 'ergebnis.json')) },
    modell: MODELL, regel: { kostenBpJeSeite: KOSTEN_BP, startkapital: START, startphasen: PHASEN, fenster: S.FENSTER, korbN: S.KORB_N, spyErgaenzung: S.ERGAENZUNGEN.SPY,
      basiszins2017: 'Annahme des PM, nicht nachgeschlagen' },
    selbstpruefung: SP, spy: { jeFenster: spy.jeFenster, ergaenzt: protokoll.ergaenzt, schonInDerDatei: protokoll.schonInDerDatei },
    laeufe: {}, korrekturen: KORREKTUREN, laufzeitSekunden: 0,
  };
  var datei = path.join(__dirname, 'ergebnis.json');
  LAEUFE.forEach(function (def) {
    var t1 = Date.now(), l = einLauf(T, Q, M, def, F[def.fenster], haupt, soll[def.name]);
    if (l.fenster.handelstage !== S.FENSTER[def.fenster].handelstage) throw new Error('KLINKE: Lauf ' + def.name + ' hat ' + l.fenster.handelstage + ' Handelstage');
    l.satz = satz(l);
    l.laufzeitSekunden = Math.round((Date.now() - t1) / 100) / 10;
    E.laeufe[def.name] = l;
    E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
    fs.writeFileSync(datei, JSON.stringify(E, null, 1));                    /* Zwischenstand auf die Platte */
    console.log(def.name + ' (' + l.laufzeitSekunden + ' s): ' + l.satz);
  });
  E.vollstaendig = true;
  E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
  fs.writeFileSync(datei, JSON.stringify(E, null, 1));
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), ergebnisText(E));
  console.log('Laufzeit s', E.laufzeitSekunden);
}

module.exports = { KENNUNG: KENNUNG, MODELL: MODELL, LAEUFE: LAEUFE, SOLL_B_BREIT: SOLL_B_BREIT, PM_ZAEHLUNG: PM_ZAEHLUNG, topfNeu: topfNeu, topfStand: topfStand, topfJahr: topfJahr,
  topfBuche: topfBuche, topfAbrechnen: topfAbrechnen, zaehlerNeu: zaehlerNeu, zaehle: zaehle, handel: handel, handelGleich: handelGleich, simuliere: simuliere,
  vorabpauschale: vorabpauschale, fonds: fonds, spyReihe: spyReihe, jahreVon: jahreVon, pa: pa, lesart: lesart, einePhase: einePhase, einLauf: einLauf, zusammen: zusammen,
  sollLesen: sollLesen, gleichCent: gleichCent, satz: satz, ergebnisText: ergebnisText, mit: mit };

if (require.main === module) lauf(process.argv.indexOf('--selbstpruefung') >= 0);
