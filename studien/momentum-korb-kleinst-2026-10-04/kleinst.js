'use strict';
/* Auftrag Nr. 85, Schritt 2 (04.10.2026): die Rueckblicke mit Regel K gegen Kleinstpositionen nachrechnen.
 * Die Regel steht in REGEL.md (vor jeder Zahl festgelegt). Gerechnet wird mit dem Rechner aus Nr. 78
 * (studien/momentum-korb-2026-10-04/korb.js - nur geladen, nie geaendert) und dem Handelscode der App (mfhandel.js, Stand Nr. 85
 * Schritt 1). Dieses Skript haengt sich VOR dem Laden von korb.js an mfhandel.planeUmschichtung und mfhandel.fuehreAus: eine Huelle,
 * die nur das Argument opts ergaenzt ({ kleinstAnteil: 0 } = ohne Regel, { kleinstAnteil: 0.05 } = mit Regel) und mitzaehlt. Die
 * Funktionen selbst sind die der App.
 *   node --max-old-space-size=6144 studien/momentum-korb-kleinst-2026-10-04/kleinst.js --selbstpruefung   (nur die Selbstpruefung)
 *   node --max-old-space-size=6144 studien/momentum-korb-kleinst-2026-10-04/kleinst.js                    (Selbstpruefung, dann die vier Laeufe) */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var REPO = path.resolve(__dirname, '..', '..');
var MH = require(path.join(REPO, 'mfhandel.js'));

var KENNUNG = 'momentum-korb-kleinst-2026-10-04/v1';
var ANTEIL = 0.05;                    /* §1: das Mass der Regel K - kein anderer Wert */
var MARKE_PP = 2.0;                   /* §3: Pruefmarke fuer das Einschalten, Pp p. a. am Median der 63 Abstaende */
var VOLL_AB = 0.95;                   /* Zaehler: "voll" heisst mindestens 95 % des Platzwerts, "verkleinert" 5 bis unter 95 % */
var KORREKTUREN = [];                 /* §3: jeder behobene Fehler nach dem Siegel wird hier vermerkt */

/* ---------- Die Huelle (muss stehen, bevor korb.js geladen wird) ---------- */
var ECHT = { planeUmschichtung: MH.planeUmschichtung, fuehreAus: MH.fuehreAus };
var H = { opts: null, zaehler: null, offen: null, aufrufe: { plane: 0, fuehre: 0 } };

function neuerZaehler() {
  return { umschichtungen: 0, mitZuWenigBargeld: 0, kaeufeGeplant: 0, voll: 0, verkleinert: 0, kleinstkauf: 0, ausgefallen: 0, ausgefallenBargeld: 0, ausgefallenK1: 0,
    verkaeufe: 0, kleinstbestaende: 0, kleinstbestaendeZiel: 0, kleinstbestaendeNichtZiel: 0, kleinstVerkauft: 0, kleinstNeuGekauft: 0, kleinstKaufAusgefallen: 0,
    positionenDanachMin: null, positionenDanachMax: null, zielplaetze: 0, plaetzeBesetzt: 0, plaetzeLeer: 0, volumen: 0, kosten: 0, beispiele: [] };
}

/** Huelle um planeUmschichtung: reicht den Schalter durch und zaehlt die Kleinstbestaende selbst nach (Platzwert = Depotwert / Zielzahl). */
function planeHuelle(ziel, buch, preise) {
  if (!H.opts) throw new Error('KLINKE: Huelle ohne Schalter gerufen (H.opts fehlt)');
  H.aufrufe.plane++;
  var plan = ECHT.planeUmschichtung(ziel, buch, preise, H.opts);
  var an = H.opts.kleinstAnteil > 0;
  if (an !== Array.isArray(plan.kleinst)) throw new Error('KLINKE: das Feld kleinst passt nicht zum Schalter (Schalter ' + (an ? 'an' : 'aus') + ')');
  var budget = ziel.length ? plan.depotwert / ziel.length : 0, eigen = [], zielSet = {};
  ziel.forEach(function (s) { zielSet[s] = true; });
  (buch.positionen || []).forEach(function (p) { var k = preise[p.sym]; if (k > 0 && p.stueck * k < ANTEIL * budget) eigen.push(p.sym); });
  if (an && eigen.join('|') !== plan.kleinst.join('|')) throw new Error('KLINKE: eigene Zaehlung der Kleinstbestaende weicht vom Feld kleinst ab: ' + eigen.join(',') + ' / ' + plan.kleinst.join(','));
  H.offen = { plan: plan, ziel: ziel, zielSet: zielSet, preise: preise, budget: budget, kleinst: eigen };
  return plan;
}

/** Huelle um fuehreAus: reicht den Schalter durch, rechnet das Bargeld Schritt fuer Schritt mit (Klinke: auf das Bit gleich dem Buch)
 *  und ordnet jeden geplanten Kauf ein: voll / verkleinert / Kleinstkauf / ausgefallen (mangels Bargeld oder nach K1). */
function fuehreHuelle(buch, plan, nowMs, kostenBp) {
  if (!H.opts) throw new Error('KLINKE: Huelle ohne Schalter gerufen (H.opts fehlt)');
  var o = H.offen;
  if (!o || o.plan !== plan) throw new Error('KLINKE: Ausfuehrung ohne den Plan aus der Huelle');
  H.offen = null; H.aufrufe.fuehre++;
  var k = (kostenBp == null ? 20 : kostenBp) / 10000, an = H.opts.kleinstAnteil > 0;
  var bar = buch.cash, volV = 0, nV = 0;
  plan.verkaufen.forEach(function (v) {
    var p = null;
    buch.positionen.forEach(function (x) { if (!p && x.sym === v.sym) p = x; });
    if (!p) return;
    bar += p.stueck * v.kurs * (1 - k); volV += p.stueck * v.kurs; nV++;
  });
  var geplant = plan.kaufen.map(function (x) { return x.stueck; });
  var n = ECHT.fuehreAus(buch, plan, nowMs, kostenBp, H.opts);
  var volK = 0, gekauft = 0, abweichung = false, arten = [];
  plan.kaufen.forEach(function (x, i) {
    var art;
    if (x.stueck > 0) {
      var w = x.stueck * x.kurs;
      art = w < ANTEIL * x.budget ? 'kleinstkauf' : w < VOLL_AB * x.budget ? 'verkleinert' : 'voll';
      bar -= x.stueck * x.kurs * (1 + k); volK += w; gekauft++;
    } else {
      art = Math.max(0, Math.floor(bar / (x.kurs * (1 + k)) * 10000) / 10000) > 0 ? 'ausgefallenK1' : 'ausgefallenBargeld';
    }
    if (x.stueck !== geplant[i]) abweichung = true;
    arten.push(art);
  });
  if (bar !== buch.cash) throw new Error('KLINKE: das mitgerechnete Bargeld weicht vom Buch ab (' + bar + ' / ' + buch.cash + ')');
  if (n !== nV + gekauft) throw new Error('KLINKE: Zahl der Ausfuehrungen passt nicht zu Verkaeufen und Kaeufen');
  if (an && arten.indexOf('kleinstkauf') >= 0) throw new Error('KLINKE: mit Regel K ist ein Kauf unter ' + (ANTEIL * 100) + ' % des Platzwerts entstanden');
  if (!an && arten.indexOf('ausgefallenK1') >= 0) throw new Error('KLINKE: ohne Regel K ist ein bezahlbarer Kauf ausgefallen');
  var Z = H.zaehler;
  if (Z) {
    Z.umschichtungen++; Z.kaeufeGeplant += plan.kaufen.length; Z.verkaeufe += nV;
    if (abweichung) Z.mitZuWenigBargeld++;
    arten.forEach(function (art, i) {
      Z[art]++;
      if (art === 'ausgefallenK1' || art === 'ausgefallenBargeld') Z.ausgefallen++;
      if (art === 'kleinstkauf' && Z.beispiele.length < 5) Z.beispiele.push({ reihe: plan.kaufen[i].sym, stueck: plan.kaufen[i].stueck, kurs: plan.kaufen[i].kurs, platzwert: plan.kaufen[i].budget });
    });
    o.kleinst.forEach(function (s) {
      Z.kleinstbestaende++;
      if (o.zielSet[s]) Z.kleinstbestaendeZiel++; else Z.kleinstbestaendeNichtZiel++;
      if (!an) return;
      Z.kleinstVerkauft++;
      var kauf = plan.kaufen.filter(function (x) { return x.sym === s; })[0];
      if (kauf) { if (kauf.stueck > 0) Z.kleinstNeuGekauft++; else Z.kleinstKaufAusgefallen++; }
    });
    var np = buch.positionen.length, besetzt = 0;
    if (Z.positionenDanachMin === null || np < Z.positionenDanachMin) Z.positionenDanachMin = np;
    if (Z.positionenDanachMax === null || np > Z.positionenDanachMax) Z.positionenDanachMax = np;
    o.ziel.forEach(function (s) {
      var p = null;
      buch.positionen.forEach(function (x) { if (!p && x.sym === s) p = x; });
      if (p && (!(o.preise[s] > 0) || !(p.stueck * o.preise[s] < ANTEIL * o.budget))) besetzt++;
    });
    Z.zielplaetze += o.ziel.length; Z.plaetzeBesetzt += besetzt; Z.plaetzeLeer += o.ziel.length - besetzt;
    Z.volumen += volV + volK; Z.kosten += (volV + volK) * k;
  }
  return n;
}
MH.planeUmschichtung = planeHuelle;
MH.fuehreAus = fuehreHuelle;

/* ---------- Erst jetzt der Rechner aus Nr. 78 und der amtliche Rechner (beide rufen MH.* zur Laufzeit ueber dasselbe Modulobjekt) ---------- */
var NR78 = path.join('studien', 'momentum-korb-2026-10-04');
var AMTLICH = path.join('studien', 'massstab-rueckblick-2026-10-04');
var S = require(path.join(REPO, NR78, 'korb.js'));
var R = require(path.join(REPO, AMTLICH, 'rueckblick.js'));

var PHASEN = R.PHASEN;
/* §3: genau diese vier (alle Mechanik der App) */
var LAEUFE = [
  { name: 'A-187', fenster: 'A', korb: S.KORB_N },
  { name: 'A-breit', fenster: 'A', korb: null },
  { name: 'B-187', fenster: 'B', korb: S.KORB_N },
  { name: 'B-breit', fenster: 'B', korb: null },
];
/* Nachtrag Nr. 78 im Belegstand (wiki/belegstand.md, "Fund des PM bei dieser Abnahme"): die Zaehlung des PM ohne Regel, ueber alle 63 Phasen.
 * Nur zum Vergleich mit der eigenen Zaehlung "ohne Regel" - keine Klinke. */
var PM_TABELLE = {
  'A-187': { umschichtungen: 1183, mitZuWenigBargeld: 1070, voll: 10106, verkleinert: 983, kleinstkauf: 318, ausgefallen: 1064 },
  'A-breit': { umschichtungen: 1183, mitZuWenigBargeld: 1137, voll: 24170, verkleinert: 1021, kleinstkauf: 705, ausgefallen: 6554 },
  'B-187': { umschichtungen: 1254, mitZuWenigBargeld: 1123, voll: 10051, verkleinert: 1043, kleinstkauf: 466, ausgefallen: 1993 },
};

/* ---------- Eine Variante (ohne / mit Regel) eines Laufs: k = 0, dann die 63 Startphasen ---------- */
function minMax(a) { return a.length ? [Math.min.apply(null, a), Math.max.apply(null, a)] : [null, null]; }

/** k = 0 durch die Huelle. V: { T, Q, M, F, haupt }, def: ein Eintrag aus LAEUFE, anteil: 0 oder ANTEIL. */
function k0(V, def, anteil) {
  var F = V.F[def.fenster], vor = { plane: H.aufrufe.plane, fuehre: H.aufrufe.fuehre };
  var L, Z = neuerZaehler();
  H.opts = { kleinstAnteil: anteil }; H.zaehler = Z;
  try { L = S.simuliere(V.T, V.Q, V.M, { startTag: F.von, endTag: F.bis, totalverlust: V.haupt, korb: def.korb, mechanik: 'app' }); }
  finally { H.zaehler = null; H.opts = null; }
  var auf = { plane: H.aufrufe.plane - vor.plane, fuehre: H.aufrufe.fuehre - vor.fuehre };
  if (auf.plane !== L.zaehler.umschichtungen || auf.fuehre !== L.zaehler.umschichtungen || Z.umschichtungen !== L.zaehler.umschichtungen) {
    throw new Error('KLINKE: die Huelle wurde nicht genau einmal je Umschichtung gerufen (' + def.name + ': ' + auf.plane + ' / ' + auf.fuehre + ' / ' + L.zaehler.umschichtungen + ')');
  }
  if (Math.abs(Z.kosten - L.zaehler.kosten) > 1e-6) throw new Error('KLINKE: die mitgezaehlten Kosten weichen von denen des Rechners ab (' + def.name + ')');
  return { L: L, kz: R.kennzahlen(V.Q, L), zaehler: Z, aufrufe: auf };
}

function variante(V, def, anteil) {
  var F = V.F[def.fenster], e = k0(V, def, anteil), L = e.L, kz = e.kz;
  var vor = H.aufrufe.plane, SP, Z = neuerZaehler();
  H.opts = { kleinstAnteil: anteil }; H.zaehler = Z;
  try { SP = S.startphasen(V.T, V.Q, V.M, F.von, F.bis, PHASEN, { totalverlust: V.haupt, korb: def.korb, mechanik: 'app' }); }
  finally { H.zaehler = null; H.opts = null; }
  var umsch = SP.phasen.reduce(function (a, p) { return a + p.umschichtungen; }, 0);
  if (Z.umschichtungen !== umsch || H.aufrufe.plane - vor !== umsch) throw new Error('KLINKE: Aufrufe der Huelle ungleich der Zahl der Umschichtungen ueber die Phasen (' + def.name + ')');
  if (Math.abs(SP.phasen[0].abstandPa - kz.abstandPa) > 1e-9) throw new Error('KLINKE: Startphase k = 0 ist nicht die Zahl fuer k = 0 (' + def.name + ')');
  if (anteil > 0 && (Z.kleinstkauf !== 0 || e.zaehler.kleinstkauf !== 0)) throw new Error('KLINKE: Kleinstkauf trotz Regel K (' + def.name + ')');
  SP.groesstesGewichtSpanne = minMax(SP.phasen.map(function (x) { return x.maxGewicht; }));
  return {
    k0: { schlaegt: kz.schlaegt, buchEnde: kz.buchEnde, spyEnde: kz.spyEnde, buchGesamt: kz.buchGesamt, spyGesamt: kz.spyGesamt, buchPa: kz.buchPa, spyPa: kz.spyPa, abstandPa: kz.abstandPa,
      rueckschlagBuch: R.maxRueckschlag(L.tage.map(function (x) { return x.buch; })), rueckschlagSpy: R.maxRueckschlag(L.tage.map(function (x) { return x.spy; })),
      umschichtungen: L.zaehler.umschichtungen, zuWenigTage: L.zaehler.zuWenigTage, kaeufe: L.zaehler.kaeufe, verkaeufe: L.zaehler.verkaeufe, kostenGezahlt: L.zaehler.kosten,
      positionenAmEnde: L.positionenAmEnde, reihenenden: L.reihenenden.length,
      groesstesGewicht: { prozent: L.maxGewicht.anteil * 100, reihe: L.maxGewicht.reihe, tag: L.maxGewicht.tag },
      gehalteneWerte: minMax(L.umschichtungen.map(function (x) { return x.positionenDanach; })), zaehler: e.zaehler },
    startphasen: SP, zaehler63: Z,
  };
}

function einLauf(V, def) {
  var F = V.F[def.fenster];
  var ohne = variante(V, def, 0), mit = variante(V, def, ANTEIL);
  return { name: def.name, fensterName: def.fenster, korb: def.korb || 'alle zulaessigen', mechanik: 'wie die App',
    fenster: { von: String(V.T.kal.tage[F.von]), bis: String(V.T.kal.tage[F.bis]), handelstage: V.Q.ord[F.bis] - V.Q.ord[F.von] + 1 },
    ohne: ohne, mit: mit };
}

/* ---------- Die Saetze aus §3 (vorher festgelegt) ---------- */
function de(x, n) { return x.toFixed(n == null ? 2 : n).replace('.', ','); }
function vz(x, n) { return (x >= 0 ? '+' : '−') + de(Math.abs(x), n); }
function tsd(x) { return String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function dollar(x) { return de(x, 2).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function datumDe(d) { var p = String(d).split('-'); return p[2] + '.' + p[1] + '.' + p[0]; }

/** Der festgelegte Satz eines Laufs. "Vorn" heisst strikt Buch > S&P 500 (Endwerte); Kleinstkaeufe und ausgefallene Kaeufe ueber alle 63 Phasen. */
function satz(l) {
  var o = l.ohne, m = l.mit;
  return 'Mit Regel K: Abstand p. a. bei k = 0 ' + vz(m.k0.abstandPa, 2) + ' Pp (ohne: ' + vz(o.k0.abstandPa, 2) + '), ' + m.startphasen.vorDemMarkt + ' von ' + m.startphasen.anzahl +
    ' Startphasen vorn (ohne: ' + o.startphasen.vorDemMarkt + '), Median ' + vz(m.startphasen.median, 2) + ' Pp p. a. (ohne: ' + vz(o.startphasen.median, 2) + '), größter Rückschlag ' +
    vz(m.k0.rueckschlagBuch, 1) + ' % (ohne: ' + vz(o.k0.rueckschlagBuch, 1) + '); Kleinstkäufe ' + tsd(m.zaehler63.kleinstkauf) + ' (ohne: ' + tsd(o.zaehler63.kleinstkauf) +
    '), ausgefallene Käufe ' + tsd(m.zaehler63.ausgefallen) + ' (ohne: ' + tsd(o.zaehler63.ausgefallen) + ').';
}

/** Die Pruefmarke: liegt in KEINEM Lauf der Median mit Regel um MEHR als 2,0 Pp p. a. unter dem Median ohne Regel, kann Regel K in die App.
 *  mediane: [{ name, ohne, mit }] - gerechnet wird auf den ungerundeten Werten; genau 2,0 Pp darunter ist noch "kann". */
function pruefmarke(mediane) {
  var je = mediane.map(function (x) { return { lauf: x.name, medianOhne: x.ohne, medianMit: x.mit, unterschiedPp: x.mit - x.ohne, ueberschritten: x.ohne - x.mit > MARKE_PP }; });
  var schlecht = je.filter(function (x) { return x.ueberschritten; });
  return { markePp: MARKE_PP, jeLauf: je, ueberschritten: schlecht.map(function (x) { return x.lauf; }),
    schlusssatz: schlecht.length ? 'Regel K verschlechtert den Rückblick — der PM fragt Wilhelm' : 'Regel K kann in die App' };
}

function ergebnisText(E) {
  var namen = LAEUFE.map(function (l) { return l.name; }), Z = [];
  var beide = function (f, trenner) { return function (l) { return f(l.ohne, l) + (trenner || ' / ') + f(l.mit, l); }; };
  var zeile = function (titel, f) { Z.push('| ' + titel + ' | ' + namen.map(function (n) { return f(E.laeufe[n]); }).join(' | ') + ' |'); };
  Z.push('**' + E.pruefmarke.schlusssatz + '.** Prüfmarke: in keinem der vier Läufe darf der Median der 63 Abstände mit Regel K um mehr als ' + de(MARKE_PP, 1) +
    ' Pp p. a. unter dem Median ohne Regel liegen — Unterschied mit minus ohne: ' +
    E.pruefmarke.jeLauf.map(function (x) { return x.lauf + ' ' + vz(x.unterschiedPp, 2); }).join(', ') + ' Pp p. a.');
  Z.push('');
  namen.forEach(function (n) { Z.push('- **' + n + '.** ' + E.saetze[n]); });
  Z.push('');
  Z.push('| je Zelle: ohne / mit Regel K | ' + namen.map(function (n) { return '**' + n + '**'; }).join(' | ') + ' |');
  Z.push('|---|' + namen.map(function () { return '---'; }).join('|') + '|');
  zeile('Fenster, Korb', function (l) { return datumDe(l.fenster.von) + '–' + datumDe(l.fenster.bis) + ', ' + (l.korb === S.KORB_N ? '187 umsatzstärkste' : 'alle zulässigen'); });
  zeile('Buch gesamt, k = 0', beide(function (v) { return vz(v.k0.buchGesamt, 1) + ' %'; }));
  zeile('S&P 500 gesamt', function (l) { return vz(l.ohne.k0.spyGesamt, 1) + ' %'; });
  zeile('**Abstand p. a., k = 0**', beide(function (v) { return vz(v.k0.abstandPa, 2); }));
  zeile('Startphasen vorn (von 63)', beide(function (v) { return String(v.startphasen.vorDemMarkt); }));
  zeile('**Median der 63 Abstände**', function (l) { return vz(l.ohne.startphasen.median, 2) + ' / ' + vz(l.mit.startphasen.median, 2) + ' (' + vz(l.mit.startphasen.median - l.ohne.startphasen.median, 2) + ')'; });
  zeile('Minimum der Abstände', beide(function (v) { return vz(v.startphasen.minimum, 2); }));
  zeile('Maximum der Abstände', beide(function (v) { return vz(v.startphasen.maximum, 2); }));
  zeile('größter Rückschlag, k = 0', beide(function (v) { return vz(v.k0.rueckschlagBuch, 1) + ' %'; }));
  zeile('größter Rückschlag, Spanne der Phasen', beide(function (v) { return vz(v.startphasen.rueckschlagSpanne[0], 1) + ' bis ' + vz(v.startphasen.rueckschlagSpanne[1], 1); }, ' / '));
  zeile('größtes Gewicht einer Position, k = 0', beide(function (v) { return de(v.k0.groesstesGewicht.prozent, 1) + ' %'; }));
  zeile('Umschichtungen der 63 Phasen (davon mit zu wenig Bargeld)', beide(function (v) { return tsd(v.zaehler63.umschichtungen) + ' (' + tsd(v.zaehler63.mitZuWenigBargeld) + ')'; }));
  zeile('geplante Käufe: voll', beide(function (v) { return tsd(v.zaehler63.voll); }));
  zeile('… verkleinert (5 bis 95 % des Platzwerts)', beide(function (v) { return tsd(v.zaehler63.verkleinert); }));
  zeile('… **Kleinstkauf (unter 5 %)**', beide(function (v) { return tsd(v.zaehler63.kleinstkauf); }));
  zeile('… **ausgefallen** (davon nach K1)', beide(function (v) { return tsd(v.zaehler63.ausgefallen) + ' (' + tsd(v.zaehler63.ausgefallenK1) + ')'; }));
  zeile('Kleinstbestände (Position unter 5 % des Platzwerts) bei der Planung',
    function (l) { return tsd(l.ohne.zaehler63.kleinstbestaende) + ' gezählt, ' + tsd(l.ohne.zaehler63.kleinstbestaendeZiel) + ' als gehalten geführt / ' +
      tsd(l.mit.zaehler63.kleinstVerkauft) + ' verkauft, ' + tsd(l.mit.zaehler63.kleinstNeuGekauft) + ' neu gekauft'; });
  zeile('Positionen im Buch nach der Umschichtung (von–bis)', beide(function (v) { return v.zaehler63.positionenDanachMin + '–' + v.zaehler63.positionenDanachMax; }));
  zeile('leere Plätze je Umschichtung (Mittel; Platz = Ziel ohne Position ab 5 % des Platzwerts)', beide(function (v) { return de(v.zaehler63.plaetzeLeer / v.zaehler63.umschichtungen, 2); }));
  zeile('gezahlte Kosten, k = 0', beide(function (v) { return tsd(v.k0.kostenGezahlt) + ' $'; }));
  zeile('gezahlte Kosten, Mittel der 63 Phasen', beide(function (v) { return tsd(v.zaehler63.kosten / PHASEN) + ' $'; }));
  Z.push('');
  var sp = E.selbstpruefung;
  Z.push('*Auftrag Nr. 85, Kennung `' + E.kennung + '`, Panel `' + E.panelKennung + '`. Regel K = kein Kauf unter 5 % des Platzwerts (Depotwert / Zielzahl), und ein Bestand unter 5 % gilt nicht als gehalten; ' +
    'sonst die Mechanik der App, Gewinner werden nicht gestutzt. Beschreibende Zahlen nach der Regel in `REGEL.md` (vor dem Lauf festgelegt), kein Urteil über das Buch. ' +
    '„Vorn“ heißt Endwert Buch über Endwert S&P 500; Zähler über alle 63 Startphasen. Alles Simulation, keine Anlageberatung.*');
  Z.push('');
  Z.push('**Geprüft vor dem Lauf.** Selbstprüfung mit ausgeschalteter Regel durch dieselbe Hülle, k = 0, auf den Cent: ' + namen.map(function (n) {
    return n + ' ' + dollar(sp.laeufe[n].buchEnde) + ' $ gegen ' + dollar(sp.laeufe[n].spyEnde) + ' $ (' + (sp.laeufe[n].bestanden ? 'getroffen' : 'NICHT getroffen') + ')';
  }).join('; ') + '. Hülle je Umschichtung genau einmal gerufen (planen und ausführen). Korrekturen nach dem Siegel: ' + (E.korrekturen.length ? E.korrekturen.length : 'keine') + '.');
  Z.push('');
  var v78 = E.vergleich.abstaendeOhne, pm = E.vergleich.zaehlungPm;
  Z.push('**Ohne Regel = wie gemessen.** Die 63 Abstände ohne Regel gegen die alten Ergebnisdateien: ' + namen.map(function (n) {
    return n + ' ' + v78[n].gleich + ' von ' + v78[n].anzahl + ' gleich (größte Abweichung ' + de(v78[n].maxAbweichung, 4) + ' Pp)';
  }).join('; ') + '. Zählung ohne Regel gegen die Tabelle des PM (Nachtrag Nr. 78): ' + Object.keys(pm).map(function (n) { return n + ' ' + (pm[n].gleich ? 'gleich' : 'weicht ab'); }).join(', ') +
    '. Einzelheiten und alle 63 Abstände je Lauf in `ergebnis.json`.');
  return Z.join('\n') + '\n';
}

/* ---------- Vorbereitung am echten Panel (wie lauf() in korb.js) ---------- */
function vorbereitung() {
  var K = require(path.join(R.PRUEFSTAND, 'konfig.js')), PR = require(path.join(R.PRUEFSTAND, 'pruefstand.js'));
  /* Nr. 96: R.PANEL_OPTIONEN ist ohne RUECKBLICK_PANEL undefined - dann genau PR.Tafel(R.PANEL_ORDNER) wie in Nr. 85 */
  var T = PR.Tafel(R.PANEL_ORDNER, R.PANEL_OPTIONEN), Q = R.vorbereiten(T), info = {}, protokoll = { ergaenzt: 0, schonInDerDatei: 0 };
  Q.korbVorab = [S.KORB_N];
  var M = S.Massnahmen(T, Q, S.dateiLeser(info), S.ERGAENZUNGEN, protokoll);
  var e0 = K.EMPFINDLICHKEIT;
  if (e0[0].key !== 'haupt') throw new Error('KLINKE: K.EMPFINDLICHKEIT hat eine andere Ordnung');
  if (T.stand.symbole[T.symIdx[R.MASSSTAB]].ordner !== 'SPY') throw new Error('KLINKE: der Massstab liegt nicht im Ordner SPY');
  var F = S.fensterTage(T, Q), spy = S.spyKlinken(T, Q, M, F);
  if (protokoll.ergaenzt + protokoll.schonInDerDatei !== 1) throw new Error('KLINKE: die SPY-Ergaenzung wurde nicht genau einmal behandelt');
  return { T: T, Q: Q, M: M, F: F, haupt: e0[0].totalverlust, spy: spy, protokoll: protokoll };
}

function cent(x) { return Math.round(x * 100); }
function liesJson(datei) { return JSON.parse(fs.readFileSync(path.join(REPO, datei), 'utf8')); }

/** Sollwerte der Selbstpruefung (§3, §6.2): A-187, A-breit, B-187 aus laeufe[<Name>].haupt, B-breit aus selbstpruefung - alles aus ergebnis.json von Nr. 78. */
function sollwerte() {
  var E78 = liesJson(path.join(NR78, 'ergebnis.json')), aus = {};
  ['A-187', 'A-breit', 'B-187'].forEach(function (n) { aus[n] = { buchEnde: E78.laeufe[n].haupt.buchEnde, spyEnde: E78.laeufe[n].haupt.spyEnde }; });
  aus['B-breit'] = { buchEnde: E78.selbstpruefung.buchEnde, spyEnde: E78.selbstpruefung.spyEnde };
  if (cent(aus['B-breit'].buchEnde) !== 16520966 || cent(aus['B-breit'].spyEnde) !== 18119387) throw new Error('KLINKE: die Sollwerte fuer B-breit sind nicht 165.209,66 $ gegen 181.193,87 $');
  return aus;
}

/** Selbstpruefung (Pflicht): mit kleinstAnteil 0 trifft dieselbe Huelle fuer k = 0 die alten Endwerte auf den Cent - alle vier, sonst kein Lauf. */
function selbstpruefung(V) {
  var soll = sollwerte(), aus = { laeufe: {}, bestanden: true };
  LAEUFE.forEach(function (def) {
    var e = k0(V, def, 0), s = soll[def.name];
    var gut = cent(e.kz.buchEnde) === cent(s.buchEnde) && cent(e.kz.spyEnde) === cent(s.spyEnde);
    aus.laeufe[def.name] = { buchEnde: e.kz.buchEnde, spyEnde: e.kz.spyEnde, sollBuch: s.buchEnde, sollSpy: s.spyEnde, bestanden: gut, umschichtungen: e.L.zaehler.umschichtungen,
      aufrufePlanen: e.aufrufe.plane, aufrufeAusfuehren: e.aufrufe.fuehre };
    if (!gut) aus.bestanden = false;
    console.log('Selbstpruefung ' + def.name + ': Buch ' + e.kz.buchEnde.toFixed(2) + ' (Soll ' + s.buchEnde.toFixed(2) + '), SPY ' + e.kz.spyEnde.toFixed(2) + ' (Soll ' + s.spyEnde.toFixed(2) + ') -> ' +
      (gut ? 'getroffen' : 'NICHT getroffen'));
  });
  return aus;
}

/** Nachrichtlich: die 63 Abstaende ohne Regel gegen die alten Ergebnisdateien (Nr. 78; B-breit gegen den amtlichen Rueckblick Nr. 74). */
function vergleichAbstaende(laeufe) {
  var E78 = liesJson(path.join(NR78, 'ergebnis.json')), E74 = liesJson(path.join(AMTLICH, 'ergebnis.json')), aus = {};
  LAEUFE.forEach(function (def) {
    var alt = def.name === 'B-breit' ? E74.zufallsbereich.startphasen.abstaende : E78.laeufe[def.name].zufallsbereich.startphasen.abstaende;
    var neu = laeufe[def.name].ohne.startphasen.abstaende, gleich = 0, max = 0;
    neu.forEach(function (x, i) { var d = Math.abs(x - alt[i]); if (d === 0) gleich++; if (d > max) max = d; });
    aus[def.name] = { anzahl: neu.length, gleich: gleich, maxAbweichung: max, quelle: def.name === 'B-breit' ? path.join(AMTLICH, 'ergebnis.json') : path.join(NR78, 'ergebnis.json') };
  });
  return aus;
}
/** Nachrichtlich: die eigene Zaehlung ohne Regel gegen die Tabelle des PM. */
function vergleichPm(laeufe) {
  var aus = {};
  Object.keys(PM_TABELLE).forEach(function (n) {
    var pm = PM_TABELLE[n], z = laeufe[n].ohne.zaehler63, eigen = {}, gleich = true;
    Object.keys(pm).forEach(function (f) { eigen[f] = z[f]; if (z[f] !== pm[f]) gleich = false; });
    aus[n] = { pm: pm, eigen: eigen, gleich: gleich };
  });
  return aus;
}

function sha(datei) { return crypto.createHash('sha256').update(fs.readFileSync(path.join(REPO, datei))).digest('hex').slice(0, 16); }

/** Aus den vier gerechneten Laeufen die Saetze, die Pruefmarke und die Vergleiche bilden. */
function abschluss(E) {
  LAEUFE.forEach(function (def) { E.saetze[def.name] = satz(E.laeufe[def.name]); });
  E.pruefmarke = pruefmarke(LAEUFE.map(function (def) { var l = E.laeufe[def.name]; return { name: def.name, ohne: l.ohne.startphasen.median, mit: l.mit.startphasen.median }; }));
  E.schlusssatz = E.pruefmarke.schlusssatz;
  E.vergleich = { abstaendeOhne: vergleichAbstaende(E.laeufe), zaehlungPm: vergleichPm(E.laeufe) };
  return E;
}

function lauf(nurSelbstpruefung) {
  /* Nr. 96: dieser Lauf schreibt die Ergebnisdatei von Nr. 85 (Panel v2.2) - auf v2.3 nur ueber studien/momentum-korb-v23-2026-10-04/lauf.js */
  if (R.PANEL_OPTIONEN) throw new Error('KLINKE: kleinst.js laeuft nur auf voll-v22; v2.3 ueber studien/momentum-korb-v23-2026-10-04/lauf.js');
  var t0 = Date.now(), V = vorbereitung();
  var SP = selbstpruefung(V);
  if (!SP.bestanden) throw new Error('SELBSTPRUEFUNG nicht bestanden - kein Lauf (§3)');
  if (nurSelbstpruefung) return;
  var git = '';
  try { git = require('child_process').execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch (e) { git = 'unbekannt'; }
  var E = {
    kennung: KENNUNG, vollstaendig: false, erzeugt: new Date().toISOString(), panelKennung: V.T.stand.kennung, panelStand: V.T.stand.stand, gitHead: git,
    quellen: { 'mfhandel.js': sha('mfhandel.js'), 'momentum.js': sha('momentum.js'), 'liquide.js': sha('liquide.js'), 'korb.js': sha(path.join(NR78, 'korb.js')),
      'rueckblick.js': sha(path.join(AMTLICH, 'rueckblick.js')), 'kleinst.js': sha(path.join('studien', 'momentum-korb-kleinst-2026-10-04', 'kleinst.js')) },
    regel: { kleinstAnteil: ANTEIL, pruefmarkePp: MARKE_PP, vollAb: VOLL_AB, korbN: S.KORB_N, kostenBpJeSeite: R.KOSTEN_BP, startkapital: R.START, startphasen: PHASEN, fenster: S.FENSTER,
      konfigBuch: MH.buchKonfig(), massstab: R.MASSSTAB },
    selbstpruefung: SP, schlusssatz: null, pruefmarke: null, saetze: {}, laeufe: {}, vergleich: null, korrekturen: KORREKTUREN, laufzeitSekunden: 0,
  };
  var datei = path.join(__dirname, 'ergebnis.json');
  LAEUFE.forEach(function (def) {
    var t1 = Date.now();
    var l = einLauf(V, def);
    l.laufzeitSekunden = Math.round((Date.now() - t1) / 100) / 10;
    E.laeufe[def.name] = l;
    E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
    fs.writeFileSync(datei, JSON.stringify(E, null, 1));                    /* Zwischenstand auf die Platte */
    console.log('Lauf ' + def.name + ' fertig nach ' + l.laufzeitSekunden + ' s');
  });
  abschluss(E);
  E.vollstaendig = true;
  E.laufzeitSekunden = Math.round((Date.now() - t0) / 100) / 10;
  fs.writeFileSync(datei, JSON.stringify(E, null, 1));
  var text = ergebnisText(E);
  fs.writeFileSync(path.join(__dirname, 'ERGEBNIS.md'), text);
  console.log(E.schlusssatz);
  LAEUFE.forEach(function (def) { console.log(def.name + ': ' + E.saetze[def.name]); });
  console.log('Laufzeit s', E.laufzeitSekunden);
}

module.exports = { KENNUNG: KENNUNG, ANTEIL: ANTEIL, MARKE_PP: MARKE_PP, VOLL_AB: VOLL_AB, LAEUFE: LAEUFE, PM_TABELLE: PM_TABELLE, H: H, ECHT: ECHT, MH: MH, S: S, R: R,
  neuerZaehler: neuerZaehler, planeHuelle: planeHuelle, fuehreHuelle: fuehreHuelle, k0: k0, variante: variante, einLauf: einLauf, satz: satz, pruefmarke: pruefmarke,
  ergebnisText: ergebnisText, vorbereitung: vorbereitung, sollwerte: sollwerte, selbstpruefung: selbstpruefung, vergleichAbstaende: vergleichAbstaende, vergleichPm: vergleichPm,
  abschluss: abschluss, cent: cent };

if (require.main === module) lauf(process.argv.indexOf('--selbstpruefung') >= 0);
