'use strict';
/* ADAPTER korb (FORM.md §3): eine Zielfunktion in der Form von momentumZiel durch den Rechner von Nr. 78/85/96
 * (kleinst.js Huelle mit Regel K -> korb.js simuliere/startphasen -> mfhandel.js planeUmschichtung/fuehreAus; Ausschuettungen und
 * Kennzahlen aus rueckblick.js). Rueckblick gegen SPY, 20 Bp je Seite, 63 Starttage, Placebo = 200 Zufallsbuecher (Nr. 100).
 * Panel: die sperrbare Tafel (paneltafel.js) - ohne Siegel 2 und ohne bisPanelende nur bis 30.12.2022. Datenorte: pruefstrasse/konfig.json; der
 * Massnahmen-Ordner geht per PRUEFSTRASSE_MASSNAHMEN an korb.js/rueckblick.js (additive Option, Nr. 110) und wird vorher gezaehlt.
 * Nr. 125a (26.10.2026, FORM.md §5 Korb): Zaehlung ohne Renditen fuer das Machbarkeitstor (zaehle), Register-Korrektur im Urteil (Rang-p <= 0,05/m),
 * Perioden-Abstaende des Einzelpfads (nicht ueberlappende 63-Tage-Perioden) fuer nBedarf, Vorwaertsmessung ab dem Stichtag (vorwaertsMessung: ein Start,
 * Kostenregel, App-Steuer, Zufallsbuecher ueber denselben Zeitraum), Parameterabgleich Live = Messung, Kunsttafel fuer Tests, Eichlauf (eichLauf).
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var path = require('path');
var K = require('../konfig.js');
var TO = require('../tore.js');

/* Die Datenorte werden VOR dem Laden der Rechner gesetzt und geprueft - ohne Massnahmen-Ordner rechnete korb.js still ohne Ausschuettungen. */
K.ordnerPruefen(K.MASSNAHMEN.ordner, K.MASSNAHMEN.mindestDateien, 'Massnahmen-Archiv (Ausschuettungen)');
process.env.PRUEFSTRASSE_MASSNAHMEN = K.MASSNAHMEN.ordner;
if (!process.env.RUECKBLICK_PANEL) process.env.RUECKBLICK_PANEL = 'v2.3';
var KS = require(path.join(K.REPO, 'studien', 'momentum-korb-kleinst-2026-10-04', 'kleinst.js'));
var S = KS.S, R = KS.R, MH = KS.MH;
var KP = require(path.join(K.PRUEFSTAND, 'konfig.js'));
var PT = require('../paneltafel.js');
var KK = require('./korb-kosten.js');      /* Nr. 121-2b: Kostenregel je Handel und Massstab Nasdaq-100 nach Steuer als Parameter (Vorgabe = heute) */
if (S.MASSNAHMEN_ORDNER !== K.MASSNAHMEN.ordner || R.MASSNAHMEN_ORDNER !== K.MASSNAHMEN.ordner) throw new Error('KLINKE: korb.js/rueckblick.js lesen nicht den Massnahmen-Ordner der Pruefstrasse');

/** Fenster [von, bis] als Panel-Handelstage; wirft, wenn ein Datum ausserhalb der (gesperrten) Tafel liegt. */
function fenster(T, Q, von, bis) {
  var a = R.tagAb(T, Q, von), b = -1;
  for (var o = Q.ptage.length - 1; o >= 0; o--) if (String(T.kal.tage[Q.ptage[o]]) <= bis) { b = Q.ptage[o]; break; }
  if (a < 0 || b < 0 || b < a) throw new Error('Fenster ' + von + '..' + bis + ' liegt nicht in der Tafel (bis ' + T.kal.tage[T.maxTag] + ')');
  return { von: a, bis: b, vonText: String(T.kal.tage[a]), bisText: String(T.kal.tage[b]) };
}

/** Tafel, Q, Massnahmen - wie kleinst.vorbereitung(), nur mit der sperrbaren Tafel und ohne die Fenster von Nr. 78.
 *  Nr. 125a: opt.tafel = Kunsttafel (Tests, kunstTafel) mit opt.massnahmenLeser (Vorgabe: keine Ausschuettungen); opt.bisPanelende wie tafel.js. */
function vorbereiten(opt) {
  opt = opt || {};
  var T = opt.tafel || PT.oeffne(opt), Q = R.vorbereiten(T), info = {}, protokoll = { ergaenzt: 0, schonInDerDatei: 0 };
  var M = opt.tafel && !opt.echteMassnahmen ? R.Massnahmen(T, Q, opt.massnahmenLeser || function () { return []; }) : S.Massnahmen(T, Q, S.dateiLeser(info), S.ERGAENZUNGEN, protokoll);   /* echteMassnahmen: eingesaete Kopie der echten Tafel (Eichung) */
  if (KP.EMPFINDLICHKEIT[0].key !== 'haupt') throw new Error('KLINKE: K.EMPFINDLICHKEIT hat eine andere Ordnung');
  if (T.stand.symbole[T.symIdx[R.MASSSTAB]].ordner !== 'SPY') throw new Error('KLINKE: der Massstab liegt nicht im Ordner SPY');
  return { T: T, Q: Q, M: M, haupt: KP.EMPFINDLICHKEIT[0].totalverlust, info: info, protokoll: protokoll };
}
/** Caches fuer einen neuen Lauf mit dieser Zielfunktion leeren (Zweitleser 8: korbCache/zielCache gehoeren zur Zielfunktion und zum Fenster). */
function frisch(V, F, zielfunktion, name) { V.Q.zielfunktion = zielfunktion; V.Q.korbCache = {}; V.Q.zielCache = {}; V.F = {}; V.F[name] = F; }

/** Ein Fenster mit einer Zielfunktion: k = 0 mit Regel K und die 63 Startphasen (KS.variante), Rueckgabe die Kennzahlen. */
function rueckblick(V, F, zielfunktion, korb, name) {
  frisch(V, F, zielfunktion, name);
  var r = KS.variante(V, { name: name, fenster: name, korb: korb || null }, K.KORB.kleinstAnteil);
  var e = r.k0;
  return { buchEnde: e.buchEnde, spyEnde: e.spyEnde, buchGesamt: e.buchGesamt, spyGesamt: e.spyGesamt, buchPa: e.buchPa, spyPa: e.spyPa, abstandPa: e.abstandPa,
    schlaegt: e.schlaegt, rueckschlagBuch: e.rueckschlagBuch, rueckschlagSpy: e.rueckschlagSpy, umschichtungen: e.umschichtungen, kostenGezahlt: e.kostenGezahlt,
    reihenenden: e.reihenenden, positionenAmEnde: e.positionenAmEnde, zuWenigTage: e.zuWenigTage,
    startphasen: { anzahl: r.startphasen.anzahl, median: r.startphasen.median, minimum: r.startphasen.minimum, maximum: r.startphasen.maximum,
      vorDemMarkt: r.startphasen.vorDemMarkt, abstaende: r.startphasen.abstaende } };
}
/** Nur k = 0 mit Regel K (fuer die Zufallsbuecher). */
function k0(V, F, zielfunktion, korb, name) {
  frisch(V, F, zielfunktion, name);
  var e = KS.k0(V, { name: name, fenster: name, korb: korb || null }, K.KORB.kleinstAnteil).kz;
  return { buchEnde: e.buchEnde, spyEnde: e.spyEnde, abstandPa: e.abstandPa, schlaegt: e.schlaegt };
}
/** Nr. 125a: k = 0 mit dem ganzen Lauf L (Perioden, Reihenenden, Buch) - fuer Perioden-Abstaende und die Vorwaertsmessung. */
function laufK0(V, F, zielfunktion, korb, name) {
  frisch(V, F, zielfunktion, name);
  var e = KS.k0(V, { name: name, fenster: name, korb: korb || null }, K.KORB.kleinstAnteil);
  return { L: e.L, kz: e.kz, zaehler: e.zaehler };
}
/** Abgaenge im Buch je Gruppe (Reihenenden aus dem Lauf k = 0): nachrichtlich, aus KS.k0 (L.reihenenden). */
function abgaenge(V, F, zielfunktion, korb, name) {
  frisch(V, F, zielfunktion, name);
  var L = KS.k0(V, { name: name, fenster: name, korb: korb || null }, K.KORB.kleinstAnteil).L, je = {};
  (L.reihenenden || []).forEach(function (r) { var g = String(r.grund); je[g] = (je[g] || 0) + 1; });
  return je;
}

/** Nr. 125a A: die vollstaendigen, nicht ueberlappenden Perioden eines Laufs (korb.js perioden, angebrochene nicht) mit dem Abstand gegen SPY (Gesamtertrag,
 *  korb.js) und gegen QQQ (Gesamtertrag cb aus qqq-tage.json) ueber DIESELBEN Grenzen: Schluss des Tags vor der Umschichtung, die erste Periode ab der
 *  Eroeffnung des Starttags (wie das Buch). Pp je Periode. Ohne qqq nur SPY. */
function perioden(L, qqq) {
  var qi = null;
  if (qqq) { if (!qqq._index) { qqq._index = {}; qqq.tage.forEach(function (x, i) { qqq._index[x.d] = i; }); } qi = qqq._index; }
  var tr = function (i, eroeffnung) { var x = qqq.tage; return eroeffnung ? (i > 0 ? x[i - 1].cb / x[i - 1].c * x[i].o : x[i].o) : x[i].cb; };
  var aus = [];
  L.perioden.forEach(function (P, k) {
    if (P.angebrochen) return;
    var bis = L.perioden[k + 1].ausfuehrungstag, z = { von: P.ausfuehrungstag, bis: bis, buch: P.buch, spy: P.spy, abSpy: P.abstand, qqq: null, abQqq: null };
    if (qi) {
      var i0 = qi[P.ausfuehrungstag], i1 = qi[bis];
      if (i0 == null || i1 == null || i1 < 1) throw new Error('KLINKE: QQQ-Reihe ohne Tag ' + P.ausfuehrungstag + ' / ' + bis + ' (Periodenabstand)');
      z.qqq = (tr(i1 - 1, false) / (k === 0 ? tr(i0, true) : tr(i0 - 1, false)) - 1) * 100; z.abQqq = P.buch - z.qqq;
    }
    aus.push(z);
  });
  return aus;
}
/** Kennzahlen der Perioden-Abstaende (nBedarf, Tor rueckwirkend): sd gegen den Massstab (QQQ, sonst SPY) und der t-Test (nachrichtlich in der Entdeckung). */
function periodenKennzahlen(per) {
  var q = per.length && per[0].abQqq != null, x = per.map(function (p) { return q ? p.abQqq : p.abSpy; });
  return { n: per.length, massstab: q ? 'QQQ (Gesamtertrag, vor Steuern)' : 'SPY (Gesamtertrag)', abstaende: x, tTest: TO.korbTTest(x), sdSpy: TO.korbTTest(per.map(function (p) { return p.abSpy; })).sd };
}

/** Urteil eines Fensters: Kandidat / nein / nicht entscheidbar (FORM §5, Rang gegen die Zufallsbuecher wie Nr. 100).
 *  Nr. 125a B.1: Register-Korrektur - der Rang-p = Rang / (B + 1) muss <= min(p(Rang 0,95), 0,05 / m) sein (m = registerM, B waechst mit m: konfig korbBuecher). */
function urteil(buch, buecher, registerM) {
  var besser = buecher.filter(function (b) { return b.abstandPa > buch.abstandPa; }).length, rang = besser + 1, n = buecher.length + 1;
  var rangMax = Math.floor((1 - K.KORB.rangMin) * n), m = registerM > 0 ? registerM : 1, pRang = rang / n, pSchwelle = Math.min(rangMax / n, K.REGISTER_ALPHA / m);
  var med = buch.startphasen.median, kandidat = med > 0 && buch.abstandPa > 0 && rang <= rangMax && pRang <= pSchwelle;
  var gruende = [];
  if (!(med > 0)) gruende.push('Median der Startphasen <= 0');
  if (!(buch.abstandPa > 0)) gruende.push('Start am ersten Tag nicht vorn');
  if (!(rang <= rangMax)) gruende.push('Rang ' + rang + ' von ' + n + ' gegen die Zufallsbuecher (noetig <= ' + rangMax + ')');
  else if (!(pRang <= pSchwelle)) gruende.push('Rang-p ' + pRang.toFixed(4) + ' ueber der Register-Schwelle min(p(Rang 0,95), 0,05/' + m + ') = ' + pSchwelle.toFixed(4));
  var ab = buecher.map(function (b) { return b.abstandPa; }).sort(function (a, b) { return a - b; });
  var q = function (p) { return ab.length ? ab[Math.min(ab.length - 1, Math.floor(p * ab.length))] : null; };
  return { kandidat: kandidat, gruende: gruende, rang: rang, von: n, rangMax: rangMax, pEinseitig: pRang, pSchwelle: pSchwelle, registerM: m, B: buecher.length,
    urteil: kandidat ? 'Kandidat' : (med != null && med <= 0 && buch.startphasen.vorDemMarkt <= buch.startphasen.anzahl / 2) ? 'nein' : 'nicht entscheidbar',
    zufall: { buecher: ab.length, median: q(0.5), p5: q(0.05), p95: q(0.95), vorSpy: buecher.filter(function (b) { return b.schlaegt; }).length } };
}

/** Effektiver Kostensatz je Seite des Laufs k = 0 (gezahlte Kosten / gehandeltes Volumen, Bp) - der Steuerrechner kennt nur EINEN Satz (Nr. 122). */
function bpEffektiv(V, F, zielfunktion, korb, name, kostenArt, kapitalUsd) {
  if (!kostenArt) return K.KORB.kostenBp;
  return KK.mitKosten(KS, V, kostenArt, function () {
    frisch(V, F, zielfunktion, name);
    var e = KS.k0(V, { name: name, fenster: name, korb: korb || null }, K.KORB.kleinstAnteil);
    return e.zaehler.volumen > 0 ? e.L.zaehler.kosten / e.zaehler.volumen * 10000 : 0;
  }, { kapitalUsd: kapitalUsd });
}
/** Ein Fenster nach Steuer gegen den Nasdaq-ETF (63 Startphasen, korb-kosten.js nachSteuer). */
function nachSteuerFenster(V, F, zielfunktion, korb, name, kostenArt, QQQ, nPhasen, kapitalUsd) {
  var bp = bpEffektiv(V, F, zielfunktion, korb, name, kostenArt, kapitalUsd);
  V.Q.zielfunktion = zielfunktion; V.Q.korbCache = {}; V.Q.zielCache = {};
  return KK.nachSteuer(KS, V, F, korb, bp, QQQ, nPhasen == null ? K.KORB.phasen : nPhasen);
}
/** Urteil nach Steuer: Median der Abstaende zum Nasdaq-ETF und Start am ersten Tag nach Steuer; Rang (vor Steuern) mit Register-Korrektur unveraendert. */
function urteilNachSteuer(u, ns) {
  var med = ns.median.abstandNasdaqB, ab0 = ns.k0.buchB - ns.k0.nasdaqB, kandidat = med > 0 && ab0 > 0 && u.rang <= u.rangMax && !(u.pEinseitig > u.pSchwelle), gruende = [];
  if (!(med > 0)) gruende.push('Median der Startphasen nach Steuer gegen den Nasdaq-ETF <= 0');
  if (!(ab0 > 0)) gruende.push('Start am ersten Tag nach Steuer nicht vor dem Nasdaq-ETF');
  if (!(u.rang <= u.rangMax)) gruende.push('Rang ' + u.rang + ' von ' + u.von + ' gegen die Zufallsbuecher (noetig <= ' + u.rangMax + ')');
  else if (u.pEinseitig > u.pSchwelle) gruende.push('Rang-p ' + u.pEinseitig.toFixed(4) + ' ueber der Register-Schwelle ' + u.pSchwelle.toFixed(4) + ' (m = ' + u.registerM + ')');
  return Object.assign({}, u, { kandidat: kandidat, gruende: gruende, urteil: kandidat ? 'Kandidat' : (med <= 0 && ns.vornGegenNasdaqB <= ns.phasen / 2) ? 'nein' : 'nicht entscheidbar',
    massstab: 'Nasdaq-100 nach Steuer', abstandNachSteuer: ab0, medianNachSteuer: med });
}
/** Zielfunktion des Kandidaten mit anzahl (konfigurationen[0].anzahl) in den opts. */
/** Nr. 125a B2: mit params.halteBand bekommt die Zielfunktion auch opts.halteBand (sie liefert dann die Rangliste bis zum Band; die Auswahl mit dem Bestand trifft
 *  mfhandel.js zielMitBand in der Huelle, korb-kosten.js mitBand). Ohne halteBand genau der alte Aufruf. */
function zielMitAnzahl(f, konf, extra, band) { return function (roh, o) { return f(roh, Object.assign({}, o, extra || {}, konf.anzahl ? { anzahl: konf.anzahl } : {}, band ? { halteBand: band.halteBand } : {})); }; }

/**
 * Ein ganzer Lauf. regel = { zielfunktion, placeboZiel }, kand = kandidat.json (form korb; konfigurationen[0].korb optional),
 * opt = { pruefzeit, siegelPfad, repo, bisPanelende (Nr. 125a: Entdeckung bis zum Panel-Ende), entdeckung: {von, bis}, pruefung: {von, bis} (nur noch fuer
 *         alte Aufrufe; der Laeufer misst Korb seit Nr. 125a vorwaerts), placeboBuecher (Vorgabe 200), registerM, kapitalUsd (Nr. 125a, Vorgabe R.START),
 *         kostenBpJeSeite (Nr. 121-2b: null = 20 Bp je Seite wie bisher | 'regel' = Kostenregel je Handel), massstab ('SPY' wie bisher | 'nasdaq100-steuer'),
 *         tafel/massnahmenLeser/qqq (Tests: Kunsttafel) }.
 * Mit massstab 'nasdaq100-steuer' urteilt das Fenster nach Steuer (Modell Nr. 82) gegen den Nasdaq-ETF: Median der 63 Abstaende und Start am ersten Tag
 * nach Steuer; der Rang gegen die Zufallsbuecher bleibt vor Steuern (er vergleicht Buecher im selben Fenster, der Massstab faellt heraus). SPY nachrichtlich.
 */
function lauf(regel, kand, opt) {
  opt = opt || {};
  var kostenArt = opt.kostenBpJeSeite === undefined ? KK.VORGABE.kostenBpJeSeite : opt.kostenBpJeSeite, massstab = opt.massstab || KK.VORGABE.massstab;
  if (KK.MASSSTAEBE.indexOf(massstab) === -1) throw new Error('korb: massstab muss ' + KK.MASSSTAEBE.join(' | ') + ' sein, nicht ' + JSON.stringify(massstab));
  var V = vorbereiten(opt), T = V.T, Q = V.Q, QQQ = massstab === 'nasdaq100-steuer' ? (opt.qqq || require('../daten/qqq.js').lade()) : (opt.qqq || null);
  var konf = kand.konfigurationen[0] || {}, korb = konf.korb || null, nB = opt.placeboBuecher == null ? K.KORB.placeboBuecher : opt.placeboBuecher, kap = opt.kapitalUsd || null;
  var band = KK.bandOpts(kand), ziel = zielMitAnzahl(regel.zielfunktion, konf, null, band);
  var bisE = (opt.entdeckung && opt.entdeckung.bis) || (opt.bisPanelende ? String(T.kal.tage[T.maxTag]) : K.EICHUNG.bis);
  var fensterE = fenster(T, Q, (opt.entdeckung && opt.entdeckung.von) || K.KORB.entdeckungVon, bisE);   /* Nr. 125a: Entdeckung bis zum Panel-Ende (bisPanelende), Bestaetigung nur vorwaerts */
  var aus = { quelle: 'panel', kennungTafel: T.stand.kennung, gesperrt: T.gesperrt, siegel: T.siegel, letzterTag: String(T.kal.tage[T.maxTag]), korb: korb,
    kostenBp: kostenArt ? null : K.KORB.kostenBp, kosten: kostenArt ? 'Kostenregel Nr. 121-2b (Eroeffnung + IBKR ' + K.KOSTEN.modell + ', Klasse 1-5, echter Handelswert' + (kap ? ', Kapital ' + kap + ' (Gebuehr skaliert)' : '') + '; Handel ueber mfhandel.js fuehreAus opts.kostenRegel, Nr. 125a)' : K.KORB.kostenBp + ' Bp je Seite',
    massstab: massstab === 'SPY' ? 'SPY (S&P 500, Gesamtertrag, vor Steuern)' : 'Nasdaq-100 nach Steuer (QQQ mit Ausschuettungen, Modell Nr. 82; seit 23.10.2026, vorher S&P 500); SPY nachrichtlich', kleinstAnteil: K.KORB.kleinstAnteil, phasen: K.KORB.phasen, massnahmen: { ordner: K.MASSNAHMEN.ordner, ergaenzt: V.protokoll.ergaenzt }, konfigurationen: [],
    placeboBuecher: nB, pBoden: 1 / (nB + 1), registerM: opt.registerM == null ? null : opt.registerM, kapitalUsd: kap || R.START, halteBand: band, entdeckungBis: fensterE.bisText };     /* A10 (Nr. 121-1): B und p-Boden im Protokoll */
  function mk(fn) { return KK.mitBand(MH, band, function () { return KK.mitKosten(KS, V, kostenArt, fn, { kapitalUsd: kap }); }); }
  function messeFenster(F, art) {
    var buch = mk(function () { return rueckblick(V, F, ziel, korb, art); });
    buch.abgaenge = mk(function () { return abgaenge(V, F, ziel, korb, art); });
    var per = mk(function () { return perioden(laufK0(V, F, ziel, korb, art).L, QQQ); });
    var ns = massstab === 'nasdaq100-steuer' ? KK.mitBand(MH, band, function () { return nachSteuerFenster(V, F, ziel, korb, art, kostenArt, QQQ, null, kap); }) : null;
    var buecher = [];
    for (var b = 0; b < nB; b++) {
      var wort = kand.kennung + '#' + b;
      buecher.push(mk(function () { return k0(V, F, zielMitAnzahl(regel.placeboZiel, konf, { placeboWort: wort }, band), korb, art + '-placebo'); }));
    }
    var u = urteil(buch, buecher, opt.registerM);
    if (ns) u = urteilNachSteuer(u, ns);
    return { fenster: { von: F.vonText, bis: F.bisText }, buch: buch, nachSteuer: ns, perioden: periodenKennzahlen(per), zufall: u.zufall, rang: u.rang, von: u.von, rangMax: u.rangMax, pEinseitig: u.pEinseitig,
      pSchwelle: u.pSchwelle, registerM: u.registerM, B: u.B, kandidat: u.kandidat, gruende: u.gruende, urteil: u.urteil };
  }
  var e = messeFenster(fensterE, 'entdeckung');
  var k = { key: konf.key || 'korb', entdeckung: e, kandidat: e.kandidat, gruende: e.gruende, urteil: e.urteil, tor1: null, mde80: null };
  if (!T.gesperrt && opt.pruefung) {
    var fensterP = fenster(T, Q, opt.pruefung.von || '2023-01-03', opt.pruefung.bis || String(T.kal.tage[T.maxTag]));
    var p = messeFenster(fensterP, 'pruefung');
    p.gleicheRichtung = p.buch.startphasen.median != null && e.buch.startphasen.median != null && Math.sign(p.buch.startphasen.median) === Math.sign(e.buch.startphasen.median);
    k.pruefung = p;
  }
  aus.konfigurationen.push(k);
  return aus;
}

/* ---------- Nr. 125a: Zaehlung ohne Renditen, Vorwaertsmessung, Parameterabgleich ---------- */
/** Machbarkeitstor (A): Panel-Handelstage der Entdeckung (entdeckungVon bis Panel-Ende) und vollstaendige Perioden - nur der Kalender (_stand.json), keine Rendite. */
function zaehle(kand, opt) {
  opt = opt || {};
  var kal = opt.kalender || PT.kalender({ bisPanelende: true }), von = (opt.entdeckung && opt.entdeckung.von) || K.KORB.entdeckungVon;
  var tage = kal.tage.filter(function (t) { return t >= von; }), TE = tage.length;
  return { form: 'korb', ohneRenditen: true, von: tage[0] || null, letzterTag: tage[TE - 1] || null, TE: TE, perioden: TO.korbPerioden(TE), periodeTage: K.KORB.periodeTage,
    periodenJeJahr: K.KORB.periodenJeJahr, quelle: 'panel', kennungTafel: kal.kennung, bauTafel: kal.bau || null, konfigurationen: (kand.konfigurationen || []).map(function (c) { return { key: c.key, nT: TO.korbPerioden(TE) }; }) };
}
/** Index des ersten Tages nach dem Datum (Stichtag), -1 ohne (wie laeufer.js stichtagNach). */
function stichtagNach(tage, datum) { for (var t = 0; t < tage.length; t++) if (tage[t] > datum) return t; return -1; }
/** --vorwaerts ohne Renditen: Stichtag = erster Panel-Handelstag nach siegel2Datum, nStand = vollstaendige Perioden ab dem Stichtag bis zum Panel-Ende. */
function zaehleVorwaerts(tage, siegel2Datum) {
  var iS = stichtagNach(tage, siegel2Datum), n = iS >= 0 ? tage.length - iS : 0;
  return { stichtag: iS >= 0 ? tage[iS] : null, handelstage: n, nStand: TO.korbPerioden(n), panelEnde: tage[tage.length - 1] || null, ohneRenditen: true };
}

/** Live = Messung (Nr. 125a B.3): Messgeraet-Parameter der Pruefstrasse gegen das App-Buch (nach Nr. 126) - die REGEL des Kandidaten (Rangmass, Zielzahl, Korb)
 *  ist nicht Teil des Abgleichs, das Geraet schon. Jede Abweichung ausser den begruendeten Ausnahmen ist ein Messgeraet-Fehler (Abbruch VOR jeder Rendite). */
var AUSNAHMEN = {
  kapitalUsd: 'Entscheid PM 26.10. (Zweitleser 19): Kandidatenlaeufe mit 10.000 EUR (Modell Dollar wie Euro); das App-Buch rechnet mit 100.000 $ (Nr. 126 offener Punkt 4, Entscheid Wilhelm offen)',
  reihenende: 'begruendete Ausnahme Nr. 126 E (Nr. 93 A2): Messung bucht am ersten Tag ohne Zeile aus, das App-Buch nach 5 Handelstagen ohne Balken',
  steuerBuch: 'begruendete Ausnahme Nr. 126 E nur fuer die Entdeckung (Nr. 82 simuliere); die Vorwaertsmessung rechnet mit Massstab.nachSteuer wie das App-Buch',
};
function parameterMessung() {
  var KO = require('../kosten.js'), SA = require(KK.STEUER_APP);
  return { kleinstAnteil: K.KORB.kleinstAnteil, kostenRegel: K.KORB.kostenRegel === 'regel' ? 'eroeffnung+ibkr' : '20bp', ausfuehrung: K.KOSTEN.ausfuehrungTag, gebuehrModell: K.KOSTEN.modell,
    massstab: K.KORB.massstab, takt: MH.buchKonfig().halten, klasse5Umsatz: K.KLASSE5_UMSATZ, umsatzFenster: K.UMSATZ_FENSTER, ibkr: JSON.stringify(KO.IBKR),
    klassen: JSON.stringify(KO.KLASSEN.map(function (k) { return [k.kassa, k.eroeffnung]; })), steuersatz: SA.MODELL.steuersatz, gutschrift: 'nach dem Handel, Anspruch = Bestand vor dem Handel',
    kapitalUsd: K.KORB.kapitalUsd, reihenende: 'erster Tag ohne Zeile', steuerBuch: 'Massstab.nachSteuer (Vorwaerts)' };
}
function parameterApp() {
  var A = require(path.join(K.REPO, 'mfhandel.js')), KR = require(path.join(K.REPO, 'kostenregel.js')), SA = require(KK.STEUER_APP), kb = A.buchKonfig();
  return { kleinstAnteil: kb.kleinstAnteil, kostenRegel: kb.kostenRegel, ausfuehrung: 'eroeffnung', gebuehrModell: 'fixed', massstab: kb.massstab, takt: kb.halten,
    klasse5Umsatz: KR.KLASSE5_UMSATZ, umsatzFenster: KR.UMSATZ_FENSTER, ibkr: JSON.stringify(KR.IBKR), klassen: JSON.stringify(KR.KLASSEN.slice(0, 4).map(function (k) { return [k.kassa, k.eroeffnung]; }).concat([[KR.KLASSEN[4].kassa, KR.KLASSEN[4].eroeffnung]])),
    steuersatz: SA.MODELL.steuersatz, gutschrift: 'nach dem Handel, Anspruch = Bestand vor dem Handel', kapitalUsd: 100000, reihenende: '5 Handelstage ohne Balken', steuerBuch: 'Massstab.nachSteuer (Vorwaerts)' };
}
/** mess/app: Parameterlisten (Vorgabe parameterMessung / parameterApp). Rueckgabe { gleich, abweichungen: [{ feld, messung, app }], ausnahmen: [{ feld, grund }], liste }. */
function parameterAbgleich(mess, app) {
  mess = mess || parameterMessung(); app = app || parameterApp();
  var abw = [], aus = [], liste = [];
  Object.keys(app).forEach(function (f) {
    var g = mess[f] === app[f];
    liste.push({ feld: f, messung: mess[f], app: app[f], gleich: g, ausnahme: !g && AUSNAHMEN[f] ? AUSNAHMEN[f] : null });
    if (g) return;
    if (AUSNAHMEN[f]) aus.push({ feld: f, grund: AUSNAHMEN[f] }); else abw.push({ feld: f, messung: mess[f], app: app[f] });
  });
  return { gleich: !abw.length, abweichungen: abw, ausnahmen: aus, liste: liste };
}

/**
 * Vorwaertsmessung (B.3, EIN Blick): das Buch startet AM STICHTAG mit dem Startkapital (eine Startphase, kein Rueckblick) und laeuft bis zum Panel-Ende - mit
 * exakt kleinst.js/korb.js/mfhandel.js (Regel K, Kostenregel ueber fuehreAus opts.kostenRegel, Gutschrift wie korb.js); nach Steuer ueber App-Massstab.nachSteuer;
 * B Zufallsbuecher (placeboWort = wortBasis#b, festgeschrieben bei der Vormerkung) ueber DENSELBEN Zeitraum. opt = { siegel2Datum, B, wortBasis, kapitalUsd,
 * V (Tests: vorbereitete Kunsttafel), qqq, parameter: { mess, app } (Tests) }. Vor jeder Rendite: Parameterabgleich (Abweichung -> MESSGERAET-Abbruch).
 */
function vorwaertsMessung(regel, kand, opt) {
  opt = opt || {};
  var PA = parameterAbgleich(opt.parameter && opt.parameter.mess, opt.parameter && opt.parameter.app);
  if (!PA.gleich) throw new Error('MESSGERAET: Live = Messung verletzt - ' + PA.abweichungen.map(function (a) { return a.feld + ' Messung ' + a.messung + ' / App ' + a.app; }).join('; '));
  var V = opt.V || vorbereiten({ bisPanelende: true }), T = V.T, Q = V.Q, QQQ = opt.qqq || require('../daten/qqq.js').lade();
  var tage = Q.ptage.map(function (d) { return String(T.kal.tage[d]); }), iS = stichtagNach(tage, opt.siegel2Datum);
  if (iS < 0 || iS >= tage.length - 1) return { leer: true, stichtag: iS >= 0 ? tage[iS] : null, panelEnde: tage[tage.length - 1], parameter: PA };
  var F = { von: Q.ptage[iS], bis: Q.ptage[Q.ptage.length - 1], vonText: tage[iS], bisText: tage[tage.length - 1] };
  var konf = kand.konfigurationen[0] || {}, korb = konf.korb || null, band = KK.bandOpts(kand), kap = opt.kapitalUsd || K.KORB.kapitalUsd, B = opt.B, sammler = { trades: [], einstand: {} };
  if (!(B >= 1) || !opt.wortBasis) throw new Error('VORWAERTS: B und wortBasis muessen aus dem Register kommen (Vormerkung), nicht neu gesetzt werden');
  var lauf = KK.mitBand(MH, band, function () { return KK.mitKosten(KS, V, 'regel', function () { return laufK0(V, F, zielMitAnzahl(regel.zielfunktion, konf, null, band), korb, 'vorwaerts'); }, { kapitalUsd: kap, sammler: sammler }); });
  if (lauf.L.startTag !== F.von) throw new Error('KLINKE: Vorwaertsbuch startet nicht am Stichtag');
  var per = perioden(lauf.L, QQQ), pk = periodenKennzahlen(per);
  var ns = KK.nachSteuerVorwaerts(KS, V, F, lauf.L, sammler, QQQ);
  var buecher = [];
  for (var b = 0; b < B; b++) {
    var wort = opt.wortBasis + '#' + b;
    buecher.push(KK.mitBand(MH, band, function () { return KK.mitKosten(KS, V, 'regel', function () { return k0(V, F, zielMitAnzahl(regel.placeboZiel, konf, { placeboWort: wort }, band), korb, 'vorwaerts-placebo'); }, { kapitalUsd: kap }); }));
  }
  var besser = buecher.filter(function (x) { return x.abstandPa > lauf.kz.abstandPa; }).length;
  return { leer: false, stichtag: F.vonText, panelEnde: F.bisText, erstePeriode: per.length ? per[0].von : null, n: per.length, perioden: per, abstaende: pk.abstaende, tTest: pk.tTest, massstabPerioden: pk.massstab,
    nachSteuer: { buchNachSteuerPa: ns.buchNachSteuerPa, nasdaqNachSteuerPa: ns.massstab.nachSteuerPa, abstandNachSteuerPa: ns.abstandNachSteuerPa, bruttoPa: ns.bruttoPa, kostenJahrPp: ns.kostenJahrPp, grund: ns.grund, rechnung: ns.rechnung },
    buch: { buchEnde: lauf.kz.buchEnde, spyEnde: lauf.kz.spyEnde, abstandPa: lauf.kz.abstandPa, umschichtungen: lauf.L.zaehler.umschichtungen, reihenenden: lauf.L.reihenenden.length, trades: sammler.trades.length,
      ersterTradeMs: sammler.trades.length ? Math.min.apply(null, sammler.trades.map(function (x) { return x.t; })) : null, stichtagMs: Q.ms[F.von] },
    rang: { besser: besser, B: B, pRang: besser / B, rang: besser + 1, hinweis: 'nachrichtlich (Zweitleser 20): ein Pfad, B stark korrelierte Buecher - fast keine Trennschaerfe; p = Anteil der Zufallsbuecher, die besser sind' },
    kapitalUsd: kap, halteBand: band, parameter: PA };
}

/* ---------- Kunsttafel (Tests, FORM.md §5 Korb): Reihen x Tage in der Form der Paneltafel, ohne Panel ---------- */
/** opt = { reihen (300), tage (600), start ('2021-01-04'), seed, drift(r, i) (Zusatzrendite je Tag), umsatz(r) ($ je Tag), ende: { r: i } (Reihenende nach Tag i),
 *  aendere(r, i, zeile) (Test: Kurse nachtraeglich veraendern) }. SPY = Referenz (Massstab), Reihen K0..K(n-1). Rueckgabe { T, qqq } - qqq aus SPY x 1,1 mit cb = c. */
function kunstTafel(opt) {
  opt = opt || {};
  var nR = opt.reihen || 300, nT = opt.tage || 600, h = 2166136261, seed = String(opt.seed || 'kunst-korb');
  function fnv(s) { var x = h; for (var i = 0; i < s.length; i++) { x ^= s.charCodeAt(i); x = Math.imul(x, 16777619) >>> 0; } return x; }
  function rnd(s) { var t = fnv(seed + '|' + s) + 0x6D2B79F5; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }
  function gauss(s) { var u = 1 - rnd(s + '|u'), v = rnd(s + '|v'); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  var tage = [], d = new Date((opt.start || '2021-01-04') + 'T00:00:00Z');
  while (tage.length < nT) { var w = d.getUTCDay(); if (w !== 0 && w !== 6) tage.push(d.toISOString().slice(0, 10)); d = new Date(d.getTime() + 86400000); }
  var namen = ['SPY']; for (var r = 0; r < nR; r++) namen.push('K' + r);
  var symbole = namen.map(function (nm) { return { reihe: nm, ordner: nm, lebend: true, referenz: nm === 'SPY', ende_grund: null }; });
  var kurse = namen.map(function (nm, s) {
    var p = nm === 'SPY' ? 300 : 20 + 80 * rnd('p0|' + nm), o = [], c = [];
    for (var i = 0; i < nT; i++) {
      var dr = s === 0 ? 0.0003 + 0.009 * gauss('m|' + i) : 0.0002 + 0.6 * (0.009 * gauss('m|' + i)) + 0.016 * gauss('e|' + nm + '|' + i) + (opt.drift ? opt.drift(s - 1, i) : 0);
      var oo = p * (1 + 0.003 * gauss('o|' + nm + '|' + i)), cc = oo * (1 + dr); o.push(oo); c.push(cc); p = cc;
    }
    return { o: o, c: c };
  });
  var zeilen = [];
  for (var i = 0; i < nT; i++) for (var s = 0; s < namen.length; s++) {
    var rr = s - 1, ende = opt.ende && rr >= 0 && opt.ende[rr] != null ? opt.ende[rr] : null;
    if (ende != null && i > ende) continue;
    var z = { tag: i, sym: s, roh: kurse[s].c[i], b: kurse[s].c[i], bo: kurse[s].o[i], umsatz: s === 0 ? 3e10 : (opt.umsatz ? opt.umsatz(rr) : 2e8 + 6e9 * rnd('u|' + namen[s])) };
    if (opt.aendere) opt.aendere(rr, i, z);
    zeilen.push(z);
  }
  if (opt.ende) Object.keys(opt.ende).forEach(function (rr) { symbole[+rr + 1].lebend = false; symbole[+rr + 1].ende_grund = 'uebernahme'; });
  var n = zeilen.length, g = { n: n, tag: new Int32Array(n), sym: new Uint16Array(n), marken: new Uint8Array(n), klasse: new Int8Array(n), rohSchluss: new Float64Array(n), bSchluss: new Float64Array(n),
    bEroeffnung: new Float64Array(n), rendite: new Float32Array(n), renditeOC: new Float32Array(n), umsatz: new Float64Array(n) };
  zeilen.forEach(function (z, q) { g.tag[q] = z.tag; g.sym[q] = z.sym; g.klasse[q] = 3; g.rohSchluss[q] = z.roh; g.bSchluss[q] = z.b; g.bEroeffnung[q] = z.bo; g.umsatz[q] = z.umsatz; });
  var nSym = namen.length, tagVon = new Int32Array(nT).fill(-1), tagBis = new Int32Array(nT).fill(-1);
  for (var q1 = 0; q1 < n; q1++) { var t1 = g.tag[q1]; if (tagVon[t1] < 0) tagVon[t1] = q1; tagBis[t1] = q1 + 1; }
  var zaehl = new Int32Array(nSym + 1); for (var q2 = 0; q2 < n; q2++) zaehl[g.sym[q2] + 1]++;
  for (var s2 = 0; s2 < nSym; s2++) zaehl[s2 + 1] += zaehl[s2];
  var symStart = Int32Array.from(zaehl), symZeilen = new Int32Array(n), fuell = Int32Array.from(zaehl);
  for (var q3 = 0; q3 < n; q3++) symZeilen[fuell[g.sym[q3]]++] = q3;
  var posInReihe = new Int32Array(n);
  for (var s3 = 0; s3 < nSym; s3++) for (var q4 = symStart[s3]; q4 < symStart[s3 + 1]; q4++) posInReihe[symZeilen[q4]] = q4 - symStart[s3];
  function zeileVon(sym, tag) {
    if (tag < 0 || tag >= nT) return -1;
    var a = tagVon[tag], b = tagBis[tag]; if (a < 0) return -1;
    while (a < b) { var m = (a + b) >> 1; if (g.sym[m] < sym) a = m + 1; else b = m; }
    return (a < tagBis[tag] && g.sym[a] === sym) ? a : -1;
  }
  var idx = {}, symIdx = {}; tage.forEach(function (t, k) { idx[t] = k; }); namen.forEach(function (nm, k) { symIdx[nm] = k; });
  var T = { g: g, stand: { kennung: 'kunst-korb/' + seed, bau: 'kunst', symbole: symbole, tage: tage, letzterVollTagIdx: nT - 1 }, kal: { tage: tage, idx: idx, close: null }, maxTag: nT - 1, nTage: nT, nSym: nSym,
    tagVon: tagVon, tagBis: tagBis, symStart: symStart, symZeilen: symZeilen, posInReihe: posInReihe, zeileVon: zeileVon, endeGrund: symbole.map(function (x) { return x.ende_grund; }),
    symName: namen, symIdx: symIdx, zurueck: function (z, k) { var sy = g.sym[z], p = posInReihe[z] - k; return p < 0 ? -1 : symZeilen[symStart[sy] + p]; },
    letzteZeile: function (sym) { return symStart[sym + 1] > symStart[sym] ? symZeilen[symStart[sym + 1] - 1] : -1; }, gesperrt: false, sperrIdx: nT - 1, siegel: null, jahreGelesen: [] };
  var qqq = { kennung: 'kunst-qqq', bis: tage[nT - 1], tage: tage.map(function (t, k) { return { d: t, o: kurse[0].o[k] * 1.1, c: kurse[0].c[k] * 1.1, cb: kurse[0].c[k] * 1.1, aus: [] }; }) };
  return { T: T, qqq: qqq };
}

/* ---------- Eichung der Korb-Form (C): ein Lauf je Seed, Einsaat im Speicher ---------- */
/** Kurse aller Aktienreihen (nicht der Referenz) ab dem Fensterstart mit +einsaatPp p. a. (Kalenderzeit, 365,25 Tage) - eine KOPIE von bSchluss/bEroeffnung,
 *  die Tafel selbst bleibt unveraendert. Rangfolge (Verhaeltnisse im Querschnitt) und Umsatz bleiben gleich; die Ausschuettung waechst mit dem Kurs mit. */
function eingesaeteTafel(T, Q, vonTag, einsaatPp) {
  var g = T.g, b = new Float64Array(g.bSchluss), bo = new Float64Array(g.bEroeffnung), ms0 = Q.ms[vonTag], f = 1 + einsaatPp / 100, ref = {};
  T.stand.symbole.forEach(function (x, s) { if (x.referenz) ref[s] = true; });
  for (var q = 0; q < g.n; q++) { if (ref[g.sym[q]] || g.tag[q] < vonTag) continue; var j = Math.pow(f, (Q.ms[g.tag[q]] - ms0) / (365.25 * 86400000)); b[q] *= j; bo[q] *= j; }
  var g2 = Object.assign({}, g, { bSchluss: b, bEroeffnung: bo });
  return Object.assign({}, T, { g: g2 });
}
/** Zufallsziel der Eichung: dieselbe Zielzahl wie momentumZiel (App-Konfiguration), Auswahl deterministisch aus den zulaessigen per Wort. */
function zufallsZiel(roh, opts, wort, memo) {
  /* memo (Eichung): momentumZiel je Stichtag und Reihenzahl einmal je Tafel - dieselbe rohMap ergibt dieselbe Rangfolge; die Auswahl per Wort bleibt je Buch */
  var schl = memo ? opts.nowMs + '|' + Object.keys(roh).length : null, r = memo && memo.has(schl) ? memo.get(schl) : MH.momentumZiel(roh, opts);
  if (memo && !memo.has(schl)) memo.set(schl, r);
  if (r.zuWenig) return r;
  var h = function (s) { return require('crypto').createHash('sha256').update(wort + '|' + opts.nowMs + '|' + s).digest('hex'); };
  var z = r.rangfolge.map(function (p) { return { sym: p.sym, h: h(p.sym) }; }).sort(function (a, b) { return a.h < b.h ? -1 : a.h > b.h ? 1 : 0; }).slice(0, r.ziel.length).map(function (x) { return x.sym; });
  return Object.assign({}, r, { ziel: z });
}
/** Ein Eichlauf (k = 0, Kostenregel, Korb 187 wie die Kalibrierung): Zufallsbuch mit Wort, optional auf der eingesaeten Tafel. Rueckgabe abstandPa (vor Steuern gegen SPY:
 *  der Massstab faellt in beiden Kriterien heraus - Einsaat gepaart gegen denselben Seed ohne Einsaat, Null gegen das Mittel der Referenzbuecher derselben Tafel). */
function eichLauf(V, F, wort, korb) {
  var memo = V.eichMemo || (V.eichMemo = new Map());
  return KK.mitKosten(KS, V, 'regel', function () { return k0(V, F, function (roh, o) { return zufallsZiel(roh, o, wort, memo); }, korb, 'eichung'); }, { kapitalUsd: K.KORB.kapitalUsd });
}

/** Kalibrierung (Auftrag §3): A-187 und B-187 mit Regel K auf Panel v2.3 = Nr. 96 (259.238,74 / 250.123,14 $). */
function kalibrierung(opt) {
  var V = vorbereiten(Object.assign({ pruefzeit: true }, opt || {})), T = V.T, Q = V.Q;
  var A = fenster(T, Q, '2017-01-04', '2021-09-15'), B = fenster(T, Q, '2021-09-16', '2026-09-15');
  var a = k0(V, A, MH.momentumZiel, S.KORB_N, 'A-187'), b = k0(V, B, MH.momentumZiel, S.KORB_N, 'B-187');
  return { 'A-187': a, 'B-187': b, soll: { 'A-187': 259238.74, 'B-187': 250123.14, spyA: 215535.73, spyB: 181193.87 } };
}

/** Nr. 121-2b B.3 Gegenprobe (nicht in der Vorgabe-Kalibrierung): A-187 / B-187 mit Kostenregel und Nasdaq-100 nach Steuer, k = 0 und 63 Startphasen;
 *  dazu die Positivkontrolle mit dem effektiven Satz der Nr. 122 (bpNr122: { 'A-187': x, 'B-187': y }) - dann muss buchB die Nr.-122-Zahl treffen. */
function kalibrierungRegel(opt) {
  opt = opt || {};
  var V = vorbereiten(Object.assign({ pruefzeit: true }, opt)), T = V.T, Q = V.Q, QQQ = require('../daten/qqq.js').lade(), aus = {};
  var F = { 'A-187': fenster(T, Q, '2017-01-04', '2021-09-15'), 'B-187': fenster(T, Q, '2021-09-16', '2026-09-15') };
  (opt.laeufe || ['A-187', 'B-187']).forEach(function (n) {
    var bp = bpEffektiv(V, F[n], MH.momentumZiel, S.KORB_N, n, 'regel');
    var vor = KK.mitKosten(KS, V, 'regel', function () { return k0(V, F[n], MH.momentumZiel, S.KORB_N, n); });
    V.Q.zielfunktion = MH.momentumZiel; V.Q.korbCache = {}; V.Q.zielCache = {};
    var ns = KK.nachSteuer(KS, V, F[n], S.KORB_N, bp, QQQ, opt.phasen == null ? K.KORB.phasen : opt.phasen), kontrolle = null;
    if (opt.bpNr122 && opt.bpNr122[n] != null) { V.Q.zielfunktion = MH.momentumZiel; V.Q.korbCache = {}; V.Q.zielCache = {}; kontrolle = KK.nachSteuer(KS, V, F[n], S.KORB_N, opt.bpNr122[n], QQQ, 1).k0; }
    aus[n] = { bpJeSeite: bp, vorSteuern: vor, nachSteuer: ns, kontrolleNr122Satz: kontrolle, statistik: KK.KF.statistik };
  });
  return aus;
}

module.exports = { lauf: lauf, kalibrierung: kalibrierung, kalibrierungRegel: kalibrierungRegel, bpEffektiv: bpEffektiv, nachSteuerFenster: nachSteuerFenster, urteilNachSteuer: urteilNachSteuer, vorbereiten: vorbereiten, fenster: fenster, urteil: urteil, rueckblick: rueckblick, k0: k0,
  laufK0: laufK0, perioden: perioden, periodenKennzahlen: periodenKennzahlen, zaehle: zaehle, zaehleVorwaerts: zaehleVorwaerts, stichtagNach: stichtagNach, vorwaertsMessung: vorwaertsMessung,
  parameterMessung: parameterMessung, parameterApp: parameterApp, parameterAbgleich: parameterAbgleich, AUSNAHMEN: AUSNAHMEN, kunstTafel: kunstTafel, eingesaeteTafel: eingesaeteTafel, zufallsZiel: zufallsZiel, eichLauf: eichLauf,
  KS: KS, S: S, R: R, MH: MH, KK: KK };

/* Nr. 121-2b: Gegenprobe Kostenregel / Nasdaq-100 nach Steuer (k = 0 und 63 Startphasen, ~2 min): node pruefstrasse/adapter/korb.js --kalibrierung-regel */
if (require.main === module && process.argv.indexOf('--kalibrierung-regel') !== -1) {
  var t1 = Date.now(), ER = kalibrierungRegel({ siegelPfad: 'pruefstrasse/FORM.md' }), kurzR = {};
  Object.keys(ER).forEach(function (n) { var e = ER[n]; kurzR[n] = { bpJeSeite: e.bpJeSeite, buchEnde: e.vorSteuern.buchEnde, buchB: e.nachSteuer.k0.buchB, nasdaqB: e.nachSteuer.k0.nasdaqB, spyB: e.nachSteuer.k0.spyB, medianAbstand: e.nachSteuer.median.abstandNasdaqB, vorn: e.nachSteuer.vornGegenNasdaqB }; });
  console.log(JSON.stringify(kurzR) + ' ms ' + (Date.now() - t1));
} else if (require.main === module && process.argv.indexOf('--kalibrierung') !== -1) {
  var t0 = Date.now(), E = kalibrierung({ siegelPfad: 'pruefstrasse/FORM.md' });
  console.log(JSON.stringify(E) + ' ms ' + (Date.now() - t0));
}
