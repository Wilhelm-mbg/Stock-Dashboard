'use strict';
/* ADAPTER korb (FORM.md §3): eine Zielfunktion in der Form von momentumZiel durch den Rechner von Nr. 78/85/96
 * (kleinst.js Huelle mit Regel K -> korb.js simuliere/startphasen -> mfhandel.js planeUmschichtung/fuehreAus; Ausschuettungen und
 * Kennzahlen aus rueckblick.js). Rueckblick gegen SPY, 20 Bp je Seite, 63 Starttage, Placebo = 200 Zufallsbuecher (Nr. 100).
 * Panel: die sperrbare Tafel (paneltafel.js) - ohne Siegel 2 nur bis 30.12.2022. Datenorte: pruefstrasse/konfig.json; der
 * Massnahmen-Ordner geht per PRUEFSTRASSE_MASSNAHMEN an korb.js/rueckblick.js (additive Option, Nr. 110) und wird vorher gezaehlt.
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var path = require('path');
var K = require('../konfig.js');

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

/** Tafel, Q, Massnahmen - wie kleinst.vorbereitung(), nur mit der sperrbaren Tafel und ohne die Fenster von Nr. 78. */
function vorbereiten(opt) {
  var T = PT.oeffne(opt), Q = R.vorbereiten(T), info = {}, protokoll = { ergaenzt: 0, schonInDerDatei: 0 };
  var M = S.Massnahmen(T, Q, S.dateiLeser(info), S.ERGAENZUNGEN, protokoll);
  if (KP.EMPFINDLICHKEIT[0].key !== 'haupt') throw new Error('KLINKE: K.EMPFINDLICHKEIT hat eine andere Ordnung');
  if (T.stand.symbole[T.symIdx[R.MASSSTAB]].ordner !== 'SPY') throw new Error('KLINKE: der Massstab liegt nicht im Ordner SPY');
  return { T: T, Q: Q, M: M, haupt: KP.EMPFINDLICHKEIT[0].totalverlust, info: info, protokoll: protokoll };
}

/** Ein Fenster mit einer Zielfunktion: k = 0 mit Regel K und die 63 Startphasen (KS.variante), Rueckgabe die Kennzahlen. */
function rueckblick(V, F, zielfunktion, korb, name) {
  V.Q.zielfunktion = zielfunktion; V.Q.korbCache = {}; V.Q.zielCache = {};
  V.F = {}; V.F[name] = F;
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
  V.Q.zielfunktion = zielfunktion; V.Q.korbCache = {}; V.Q.zielCache = {};
  V.F = {}; V.F[name] = F;
  var e = KS.k0(V, { name: name, fenster: name, korb: korb || null }, K.KORB.kleinstAnteil).kz;
  return { buchEnde: e.buchEnde, spyEnde: e.spyEnde, abstandPa: e.abstandPa, schlaegt: e.schlaegt };
}
/** Abgaenge im Buch je Gruppe (Reihenenden aus dem Lauf k = 0): nachrichtlich, aus KS.k0 (L.reihenenden). */
function abgaenge(V, F, zielfunktion, korb, name) {
  V.Q.zielfunktion = zielfunktion; V.Q.korbCache = {}; V.Q.zielCache = {};
  V.F = {}; V.F[name] = F;
  var L = KS.k0(V, { name: name, fenster: name, korb: korb || null }, K.KORB.kleinstAnteil).L, je = {};
  (L.reihenenden || []).forEach(function (r) { var g = String(r.grund); je[g] = (je[g] || 0) + 1; });
  return je;
}

/** Urteil eines Fensters: Kandidat / nein / nicht entscheidbar (FORM §5, Rang gegen die Zufallsbuecher wie Nr. 100). */
function urteil(buch, buecher) {
  var besser = buecher.filter(function (b) { return b.abstandPa > buch.abstandPa; }).length, rang = besser + 1, n = buecher.length + 1;
  var rangMax = Math.floor((1 - K.KORB.rangMin) * n);
  var med = buch.startphasen.median, kandidat = med > 0 && buch.abstandPa > 0 && rang <= rangMax;
  var gruende = [];
  if (!(med > 0)) gruende.push('Median der Startphasen <= 0');
  if (!(buch.abstandPa > 0)) gruende.push('Start am ersten Tag nicht vorn');
  if (!(rang <= rangMax)) gruende.push('Rang ' + rang + ' von ' + n + ' gegen die Zufallsbuecher (noetig <= ' + rangMax + ')');
  var ab = buecher.map(function (b) { return b.abstandPa; }).sort(function (a, b) { return a - b; });
  var q = function (p) { return ab.length ? ab[Math.min(ab.length - 1, Math.floor(p * ab.length))] : null; };
  return { kandidat: kandidat, gruende: gruende, rang: rang, von: n, rangMax: rangMax, pEinseitig: rang / n,
    urteil: kandidat ? 'Kandidat' : (med != null && med <= 0 && buch.startphasen.vorDemMarkt <= buch.startphasen.anzahl / 2) ? 'nein' : 'nicht entscheidbar',
    zufall: { buecher: ab.length, median: q(0.5), p5: q(0.05), p95: q(0.95), vorSpy: buecher.filter(function (b) { return b.schlaegt; }).length } };
}

/** Effektiver Kostensatz je Seite des Laufs k = 0 (gezahlte Kosten / gehandeltes Volumen, Bp) - der Steuerrechner kennt nur EINEN Satz (Nr. 122). */
function bpEffektiv(V, F, zielfunktion, korb, name, kostenArt) {
  if (!kostenArt) return K.KORB.kostenBp;
  return KK.mitKosten(KS, V, kostenArt, function () {
    V.Q.zielfunktion = zielfunktion; V.Q.korbCache = {}; V.Q.zielCache = {}; V.F = {}; V.F[name] = F;
    var e = KS.k0(V, { name: name, fenster: name, korb: korb || null }, K.KORB.kleinstAnteil);
    return e.zaehler.volumen > 0 ? e.L.zaehler.kosten / e.zaehler.volumen * 10000 : 0;
  });
}
/** Ein Fenster nach Steuer gegen den Nasdaq-ETF (63 Startphasen, korb-kosten.js nachSteuer). */
function nachSteuerFenster(V, F, zielfunktion, korb, name, kostenArt, QQQ, nPhasen) {
  var bp = bpEffektiv(V, F, zielfunktion, korb, name, kostenArt);
  V.Q.zielfunktion = zielfunktion; V.Q.korbCache = {}; V.Q.zielCache = {};
  return KK.nachSteuer(KS, V, F, korb, bp, QQQ, nPhasen == null ? K.KORB.phasen : nPhasen);
}
/** Urteil nach Steuer: Median der Abstaende zum Nasdaq-ETF und Start am ersten Tag nach Steuer; Rang (vor Steuern) unveraendert. */
function urteilNachSteuer(u, ns) {
  var med = ns.median.abstandNasdaqB, ab0 = ns.k0.buchB - ns.k0.nasdaqB, kandidat = med > 0 && ab0 > 0 && u.rang <= u.rangMax, gruende = [];
  if (!(med > 0)) gruende.push('Median der Startphasen nach Steuer gegen den Nasdaq-ETF <= 0');
  if (!(ab0 > 0)) gruende.push('Start am ersten Tag nach Steuer nicht vor dem Nasdaq-ETF');
  if (!(u.rang <= u.rangMax)) gruende.push('Rang ' + u.rang + ' von ' + u.von + ' gegen die Zufallsbuecher (noetig <= ' + u.rangMax + ')');
  return Object.assign({}, u, { kandidat: kandidat, gruende: gruende, urteil: kandidat ? 'Kandidat' : (med <= 0 && ns.vornGegenNasdaqB <= ns.phasen / 2) ? 'nein' : 'nicht entscheidbar',
    massstab: 'Nasdaq-100 nach Steuer', abstandNachSteuer: ab0, medianNachSteuer: med });
}

/**
 * Ein ganzer Lauf. regel = { zielfunktion, placeboZiel }, kand = kandidat.json (form korb; konfigurationen[0].korb optional),
 * opt = { pruefzeit, siegelPfad, repo, entdeckung: {von, bis}, pruefung: {von, bis}, placeboBuecher (Vorgabe 200), kalibrierung,
 *         kostenBpJeSeite (Nr. 121-2b: null = 20 Bp je Seite wie bisher | 'regel' = Kostenregel je Handel), massstab ('SPY' wie bisher | 'nasdaq100-steuer') }.
 * Mit massstab 'nasdaq100-steuer' urteilt das Fenster nach Steuer (Modell Nr. 82) gegen den Nasdaq-ETF: Median der 63 Abstaende und Start am ersten Tag
 * nach Steuer; der Rang gegen die Zufallsbuecher bleibt vor Steuern (er vergleicht Buecher im selben Fenster, der Massstab faellt heraus). SPY nachrichtlich.
 */
function lauf(regel, kand, opt) {
  opt = opt || {};
  var kostenArt = opt.kostenBpJeSeite === undefined ? KK.VORGABE.kostenBpJeSeite : opt.kostenBpJeSeite, massstab = opt.massstab || KK.VORGABE.massstab;
  if (KK.MASSSTAEBE.indexOf(massstab) === -1) throw new Error('korb: massstab muss ' + KK.MASSSTAEBE.join(' | ') + ' sein, nicht ' + JSON.stringify(massstab));
  var V = vorbereiten(opt), T = V.T, Q = V.Q, QQQ = massstab === 'nasdaq100-steuer' ? require('../daten/qqq.js').lade() : null;
  var konf = kand.konfigurationen[0] || {}, korb = konf.korb || null, nB = opt.placeboBuecher == null ? K.KORB.placeboBuecher : opt.placeboBuecher;
  var ziel = function (roh, o) { return regel.zielfunktion(roh, Object.assign({}, o, konf.anzahl ? { anzahl: konf.anzahl } : {})); };
  var fensterE = fenster(T, Q, (opt.entdeckung && opt.entdeckung.von) || '2017-01-04', (opt.entdeckung && opt.entdeckung.bis) || K.EICHUNG.bis);   /* Nr. 121-2a: Korb bleibt im Eichfenster (Vorwaerts fuer Korb nicht gebaut) */
  var aus = { quelle: 'panel', kennungTafel: T.stand.kennung, gesperrt: T.gesperrt, siegel: T.siegel, letzterTag: String(T.kal.tage[T.maxTag]), korb: korb,
    kostenBp: kostenArt ? null : K.KORB.kostenBp, kosten: kostenArt ? 'Kostenregel Nr. 121-2b (Eroeffnung + IBKR ' + K.KOSTEN.modell + ', Klasse 1-5, echter Handelswert)' : K.KORB.kostenBp + ' Bp je Seite',
    massstab: massstab === 'SPY' ? 'SPY (S&P 500, Gesamtertrag, vor Steuern)' : 'Nasdaq-100 nach Steuer (QQQ mit Ausschuettungen, Modell Nr. 82; seit 23.10.2026, vorher S&P 500); SPY nachrichtlich', kleinstAnteil: K.KORB.kleinstAnteil, phasen: K.KORB.phasen, massnahmen: { ordner: K.MASSNAHMEN.ordner, ergaenzt: V.protokoll.ergaenzt }, konfigurationen: [],
    placeboBuecher: nB, pBoden: 1 / (nB + 1), registerM: opt.registerM == null ? null : opt.registerM };     /* A10 (Nr. 121-1): B und p-Boden im Protokoll */
  function messeFenster(F, art) {
    var buch = KK.mitKosten(KS, V, kostenArt, function () { return rueckblick(V, F, ziel, korb, art); });
    buch.abgaenge = KK.mitKosten(KS, V, kostenArt, function () { return abgaenge(V, F, ziel, korb, art); });
    var ns = QQQ ? nachSteuerFenster(V, F, ziel, korb, art, kostenArt, QQQ) : null;
    var buecher = [];
    for (var b = 0; b < nB; b++) {
      var wort = kand.kennung + '#' + b;
      buecher.push(KK.mitKosten(KS, V, kostenArt, function () { return k0(V, F, function (roh, o) { return regel.placeboZiel(roh, Object.assign({}, o, { placeboWort: wort }, konf.anzahl ? { anzahl: konf.anzahl } : {})); }, korb, art + '-placebo'); }));
    }
    var u = urteil(buch, buecher);
    if (ns) u = urteilNachSteuer(u, ns);
    return { fenster: { von: F.vonText, bis: F.bisText }, buch: buch, nachSteuer: ns, zufall: u.zufall, rang: u.rang, von: u.von, rangMax: u.rangMax, pEinseitig: u.pEinseitig, kandidat: u.kandidat, gruende: u.gruende, urteil: u.urteil };
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

module.exports = { lauf: lauf, kalibrierung: kalibrierung, kalibrierungRegel: kalibrierungRegel, bpEffektiv: bpEffektiv, nachSteuerFenster: nachSteuerFenster, urteilNachSteuer: urteilNachSteuer, vorbereiten: vorbereiten, fenster: fenster, urteil: urteil, rueckblick: rueckblick, k0: k0, KS: KS, S: S, R: R, MH: MH };

/* Nr. 121-2b: Gegenprobe Kostenregel / Nasdaq-100 nach Steuer (k = 0 und 63 Startphasen, ~2 min): node pruefstrasse/adapter/korb.js --kalibrierung-regel */
if (require.main === module && process.argv.indexOf('--kalibrierung-regel') !== -1) {
  var t1 = Date.now(), ER = kalibrierungRegel({ siegelPfad: 'pruefstrasse/FORM.md' }), kurzR = {};
  Object.keys(ER).forEach(function (n) { var e = ER[n]; kurzR[n] = { bpJeSeite: e.bpJeSeite, buchEnde: e.vorSteuern.buchEnde, buchB: e.nachSteuer.k0.buchB, nasdaqB: e.nachSteuer.k0.nasdaqB, spyB: e.nachSteuer.k0.spyB, medianAbstand: e.nachSteuer.median.abstandNasdaqB, vorn: e.nachSteuer.vornGegenNasdaqB }; });
  console.log(JSON.stringify(kurzR) + ' ms ' + (Date.now() - t1));
} else if (require.main === module && process.argv.indexOf('--kalibrierung') !== -1) {
  var t0 = Date.now(), E = kalibrierung({ siegelPfad: 'pruefstrasse/FORM.md' });
  console.log(JSON.stringify(E) + ' ms ' + (Date.now() - t0));
}
