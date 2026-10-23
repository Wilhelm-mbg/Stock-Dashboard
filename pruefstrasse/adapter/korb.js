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

/**
 * Ein ganzer Lauf. regel = { zielfunktion, placeboZiel }, kand = kandidat.json (form korb; konfigurationen[0].korb optional),
 * opt = { pruefzeit, siegelPfad, repo, entdeckung: {von, bis}, pruefung: {von, bis}, placeboBuecher (Vorgabe 200), kalibrierung }.
 */
function lauf(regel, kand, opt) {
  opt = opt || {};
  var V = vorbereiten(opt), T = V.T, Q = V.Q;
  var konf = kand.konfigurationen[0] || {}, korb = konf.korb || null, nB = opt.placeboBuecher == null ? K.KORB.placeboBuecher : opt.placeboBuecher;
  var ziel = function (roh, o) { return regel.zielfunktion(roh, Object.assign({}, o, konf.anzahl ? { anzahl: konf.anzahl } : {})); };
  var fensterE = fenster(T, Q, (opt.entdeckung && opt.entdeckung.von) || '2017-01-04', (opt.entdeckung && opt.entdeckung.bis) || K.EICHUNG.bis);   /* Nr. 121-2a: Korb bleibt im Eichfenster (Vorwaerts fuer Korb nicht gebaut) */
  var aus = { quelle: 'panel', kennungTafel: T.stand.kennung, gesperrt: T.gesperrt, siegel: T.siegel, letzterTag: String(T.kal.tage[T.maxTag]), korb: korb,
    kostenBp: K.KORB.kostenBp, kleinstAnteil: K.KORB.kleinstAnteil, phasen: K.KORB.phasen, massnahmen: { ordner: K.MASSNAHMEN.ordner, ergaenzt: V.protokoll.ergaenzt }, konfigurationen: [],
    placeboBuecher: nB, pBoden: 1 / (nB + 1), registerM: opt.registerM == null ? null : opt.registerM };     /* A10 (Nr. 121-1): B und p-Boden im Protokoll */
  function messeFenster(F, art) {
    var buch = rueckblick(V, F, ziel, korb, art);
    buch.abgaenge = abgaenge(V, F, ziel, korb, art);
    var buecher = [];
    for (var b = 0; b < nB; b++) {
      var wort = kand.kennung + '#' + b;
      buecher.push(k0(V, F, function (roh, o) { return regel.placeboZiel(roh, Object.assign({}, o, { placeboWort: wort }, konf.anzahl ? { anzahl: konf.anzahl } : {})); }, korb, art + '-placebo'));
    }
    var u = urteil(buch, buecher);
    return { fenster: { von: F.vonText, bis: F.bisText }, buch: buch, zufall: u.zufall, rang: u.rang, von: u.von, rangMax: u.rangMax, pEinseitig: u.pEinseitig, kandidat: u.kandidat, gruende: u.gruende, urteil: u.urteil };
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

module.exports = { lauf: lauf, kalibrierung: kalibrierung, vorbereiten: vorbereiten, fenster: fenster, urteil: urteil, rueckblick: rueckblick, k0: k0, KS: KS, S: S, R: R, MH: MH };

if (require.main === module && process.argv.indexOf('--kalibrierung') !== -1) {
  var t0 = Date.now(), E = kalibrierung({ siegelPfad: 'pruefstrasse/FORM.md' });
  console.log(JSON.stringify(E) + ' ms ' + (Date.now() - t0));
}
