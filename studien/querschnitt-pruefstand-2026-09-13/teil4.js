'use strict';
/* TEIL 4 - LAEUFER: "Gedrueckt, aber liefert" (VORREGISTRIERUNG-TEIL4.md).
 *
 * A = 12-Monats-Rendite >= 10 Pp hinter SPY (250 Panelzeilen), B = Fundamental-Momentum > 0 im juengsten Filing mit
 * filed < t (Leser der Fundamentaltafel, Sperrklinke). Test 1: A&B gegen A&nichtB, gepaart je Monat, 120 Tage.
 * Test 2: B-Quintil gegen den Pool mit Fundament (Eichung). 250 Tage, Sektoren, Jahre nachrichtlich.
 * Kontrollen: Placebo (B permutiert), Orakel (B = Vorzeichen der kuenftigen Rendite), Leck-Klinke des Pruefstands,
 * Leck-Klinke des Lesers. Vorpruefung des PM wird VOR Test 1/2 reproduziert (§T4.8).
 *
 * Aufruf:  node --max-old-space-size=6144 teil4.js --aus voll [--ziel voll/teil4] [--ergebnis teil4-ergebnis.json]
 *                                                  [--tafel <fundamentaltafel-ordner>]
 * Schreibt nach jedem Baustein <ziel>/teil4-lauf.json; am Ende die Ergebnisdatei (Repo).
 * Faellt eine Kontrolle oder die Vorpruefung: gemeldet und gekennzeichnet, nicht repariert.
 *
 * Die Kurs-Tafel wird NUR ueber den Pruefrahmen gelesen (universum, Sicht, halte, umschlagKosten), die
 * Fundamentaltafel NUR ueber fundamental-lesen.js. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var PR = require('./pruefstand.js');
var RF = require('./rangfunktionen.js');
var ST = require('./statistik.js');

function args(argv) {
  var a = { aus: null, ziel: null, tafel: null, ergebnis: path.join(K.HIER, 'teil4-ergebnis.json') };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--ziel') a.ziel = argv[++i];
    else if (x === '--tafel') a.tafel = argv[++i];
    else if (x === '--ergebnis') a.ergebnis = argv[++i];
  }
  return a;
}
function schreibe(pfad, obj) { fs.writeFileSync(pfad + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(pfad + '.tmp', pfad); }
function sag(s) { process.stdout.write(s + '\n'); }
function f4(x) { return x == null || !(x === x) ? '-' : x.toFixed(4); }
function f2(x) { return x == null || !(x === x) ? '-' : x.toFixed(2); }
function istEndlich(x) { return typeof x === 'number' && x === x && isFinite(x); }

/* =========================================================================================
 * Bausteine (auch fuer test-teil4.js)
 * ========================================================================================= */
/** Periodenende: der H-te Panel-Handelstag nach a (Tage mit Zeilen); null, wenn die Tafel nicht reicht (§T4.2). */
function periodenEnde(T, a, H) {
  var n = 0;
  for (var d = a + 1; d <= T.maxTag; d++) { if (T.tagVon[d] < 0) continue; n++; if (n === H) return d; }
  return null;
}
function monatsIndex(iso) { return +iso.slice(0, 4) * 12 + (+iso.slice(5, 7) - 1); }

/**
 * A/B-Auswahl an einem Signaltag - eine Rangfunktion im Sinne der Maschine (§T4.3): Kurs-Tafel NUR ueber sicht
 * (zeile mit Tag <= t, zurueck), Fundament NUR ueber F.fundamentalAm(kuerzel, ISO-Tag).
 * opt.leck: praeparierte Fassung, liest je Mitglied die Zeile an t+1 (verboten; die Klinke muss das zaehlen).
 * Liefert je Universumsmitglied: istA, b (1 = B, 0 = nicht B, null = ohne Fundament), fm, sektor.
 */
function auswahl(sicht, liste, T, F, opt) {
  opt = opt || {};
  var g = sicht.felder, t = sicht.tag, iso = T.kal.tage[t];
  var spy = T.symIdx['SPY'];
  if (spy === undefined) throw new Error('SPY fehlt in der Symboltabelle');
  var zS = sicht.zeile(spy, t);
  if (zS < 0) return { ok: false, grund: 'SPY ohne Zeile am Signaltag' };
  var zSB = sicht.zurueck(zS, K.TEIL4_A_ZEILEN);
  if (zSB < 0 || !(g.bSchluss[zSB] > 0)) return { ok: false, grund: 'SPY ohne ' + K.TEIL4_A_ZEILEN + '. Vorzeile' };
  var rS = 100 * (g.bSchluss[zS] / g.bSchluss[zSB] - 1);
  var aus = [], z = { ohneVorzeile: 0, ohneFundament: 0, b: 0, nichtB: 0 };
  for (var i = 0; i < liste.length; i++) {
    var e = liste[i], zl = e.zeile;
    if (opt.leck) { var zv = sicht.zeile(e.sym, t + 1); if (zv >= 0) zl = zv; }   /* absichtlich: Blick auf t+1 */
    var zB = sicht.zurueck(e.zeile, K.TEIL4_A_ZEILEN);
    var r = (zB >= 0 && g.bSchluss[zB] > 0 && g.bSchluss[zl] > 0) ? 100 * (g.bSchluss[zl] / g.bSchluss[zB] - 1) : NaN;
    if (!(r === r)) z.ohneVorzeile++;
    var istA = (r === r) && (r - rS <= K.TEIL4_A_SCHWELLE_PP);
    var fz = F.fundamentalAm(T.symName[e.sym], iso);
    var fm = (fz && fz.abgeleitet) ? fz.abgeleitet.fm : null;
    var b = istEndlich(fm) ? (fm > 0 ? 1 : 0) : null;
    if (b === null) z.ohneFundament++; else if (b === 1) z.b++; else z.nichtB++;
    var sektor = (b === null) ? null : (fz.sektor || F.sektorVonSic(fz.sic) || 'unbekannt');
    aus.push({ sym: e.sym, zeile: e.zeile, klasse: e.klasse, naechste: e.naechste, naechsterTag: e.naechsterTag,
      r: r, istA: istA, b: b, fm: b === null ? null : fm, sektor: sektor, filed: fz ? fz.filed : null });
  }
  return { ok: true, liste: aus, rSpy: rS, zaehler: z };
}

/** Halten eines gleichgewichteten Korbs Eroeffnung(a) -> Eroeffnung(aEnde) mit der Maschine; Kosten = ein Umlauf je
 *  Papier zur Huerde seiner Klasse am Signaltag = 2 x umschlagKosten aus dem Nichts (§T4.2). */
function korb(T, mitglieder, t, a, aEnde, totalverlust) {
  if (!mitglieder.length) return null;
  var zz = { tote: 0, toteTotalverlust: 0, luecken: 0 };
  var h = PR.halte(T, mitglieder, a, aEnde, totalverlust, zz);
  var w = {}; mitglieder.forEach(function (e) { w[e.sym] = 1 / mitglieder.length; });
  var kosten = 2 * PR.umschlagKosten(T, {}, w, t).kosten;
  return { n: mitglieder.length, brutto: h.periode, kosten: kosten, netto: h.periode - kosten,
    tote: zz.tote, toteTotalverlust: zz.toteTotalverlust, luecken: zz.luecken };
}
function klassenZaehler(liste) { var z = { 1: 0, 2: 0, 3: 0 }; liste.forEach(function (e) { if (z[e.klasse] !== undefined) z[e.klasse]++; }); return z; }
function mischen(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var x = arr[i]; arr[i] = arr[j]; arr[j] = x; } return arr; }
/** Placebo: die B-Marken der A-Mitglieder mit Fundament je Monat permutiert (Zahl der B bleibt), Saat je Ziehung und Tag. */
function placeboSeiten(A, saat) {
  var AF = A.filter(function (e) { return e.b !== null; });
  var marken = AF.map(function (e) { return e.b; });
  mischen(marken, ST.mulberry32(ST.fnv(saat)));
  var ab = [], anb = [];
  AF.forEach(function (e, i) { (marken[i] === 1 ? ab : anb).push(e); });
  return { ab: ab, anb: anb };
}
/** Orakel: A-Mitglieder nach dem Vorzeichen der kuenftigen Rendite Eroeffnung(a) -> Eroeffnung(aEnde), gelesen ueber
 *  eine Sicht MIT Schluessel; letzte Zeile bei vorzeitigem Ende (wie orakelPeriode der Maschine). */
function orakelSeiten(T, sichtO, A, a, aEnde) {
  var g = T.g, gew = [], ver = [], ohne = 0;
  A.forEach(function (e) {
    var z1 = sichtO.zeile(e.sym, a), z2 = sichtO.zeile(e.sym, aEnde);
    if (z2 < 0) { var letzte = T.letzteZeile(e.sym); if (letzte >= 0 && g.tag[letzte] > a && g.tag[letzte] < aEnde) z2 = letzte; }
    var rr = (z1 >= 0 && z2 >= 0 && g.bEroeffnung[z1] > 0 && g.bEroeffnung[z2] > 0) ? 100 * (g.bEroeffnung[z2] / g.bEroeffnung[z1] - 1) : NaN;
    if (!(rr === rr)) { ohne++; return; }
    (rr > 0 ? gew : ver).push(e);
  });
  return { ab: gew, anb: ver, ohne: ohne };
}

/** Kennzahlen einer Monatsreihe (§T4.5): HH bei Lag L auf dem Kalendermonat-Index, naiv daneben, MDE nach beiden
 *  Konventionen (2,8016 und 3,0830 x se). se = HH; faellt die HH-Varianz aus, Block-se der Maschine (hh0). */
function reihe(perioden, feld, L) {
  var pp = perioden.filter(function (p) { return istEndlich(p[feld]); }).map(function (p) { return { t: p.mIdx, x: p[feld] }; });
  var m = ST.momente(pp, L);
  var se = (m.n >= 2) ? m.se : null;
  return { n: m.n, mittel: m.mittel, sd: m.sd, seNaiv: m.seNaiv, seHH: m.seHH, se: se, hh0: !!m.hh0,
    t: (se > 0) ? m.mittel / se : null, tNaiv: (m.seNaiv > 0) ? m.mittel / m.seNaiv : null,
    mde: se == null ? null : K.MDE_FAKTOR * se, mdeBonf: se == null ? null : K.TEIL4_MDE_FAKTOR_BONF * se,
    mdeNaiv: m.seNaiv == null ? null : K.MDE_FAKTOR * m.seNaiv,
    faktorSe: (m.seHH > 0 && m.seNaiv > 0) ? m.seHH / m.seNaiv : null,
    marke: (m.seHH > 0 && m.seNaiv > 0 && (m.seHH / m.seNaiv > K.SE_ABWEICHUNG_MARKE || m.seNaiv / m.seHH > K.SE_ABWEICHUNG_MARKE)) ? 'se-Spreizung' : null,
    mittelDurchSd: (m.sd > 0) ? m.mittel / m.sd : null, duenn: m.n < K.TEIL4_MIN_PERIODEN, lag: L };
}
function schwach(F, name) { var r = F.meta && F.meta.reihen ? (F.meta.reihen[name] || F.meta.reihen[String(name).replace(/~2$/, '')]) : null; return !!(r && r.sicherheit === 'schwach'); }

/* =========================================================================================
 * Messung
 * ========================================================================================= */
function messung(a) {
  var ziel = a.ziel || path.join(a.aus, 'teil4');
  fs.mkdirSync(ziel, { recursive: true });
  var laufPfad = path.join(ziel, 'teil4-lauf.json');
  var t0 = Date.now(), KL = K.UNIVERSUM_KLASSEN_TEIL3, HZ = K.TEIL4_HORIZONTE, H0 = HZ.filter(function (h) { return h.haupt; })[0];
  var totalverlust = {}; K.EMPFINDLICHKEIT[0].totalverlust.forEach(function (gr) { totalverlust[gr] = true; });

  sag('Tafel laden aus ' + a.aus + ' ...');
  var T = PR.Tafel(a.aus);
  sag('Tafel: ' + T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, bis ' + T.kal.tage[T.maxTag] + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  var FL = require(K.FUNDAMENTAL_LESER);
  var F = FL.oeffne(a.tafel || undefined, { maxAlterTage: K.TEIL4_FUNDAMENT_MAX_ALTER_TAGE });
  sag('Fundamentaltafel: ' + F.kennung + ', ' + F.zeilen + ' Zeilen, ' + F.ciks + ' CIKs, ' + F.dateien.length + ' Dateien (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');

  var B = { kennung: K.KONFIG_KENNUNG_TEIL4, panel: T.stand.kennung, fundamental: { kennung: F.kennung, zeilen: F.zeilen, ciks: F.ciks, dateien: F.dateien.length, maxAlterTage: K.TEIL4_FUNDAMENT_MAX_ALTER_TAGE, ordner: F.ordner },
    stand: new Date().toISOString(), letzterTag: T.kal.tage[T.maxTag], zeilen: T.g.n, reihen: T.nSym, klassen: KL.slice(), freq: 'monat',
    horizonte: HZ, a: { zeilen: K.TEIL4_A_ZEILEN, schwellePp: K.TEIL4_A_SCHWELLE_PP }, minJeSeite: K.TEIL4_MIN_JE_SEITE, sektorMinJeSeite: K.TEIL4_SEKTOR_MIN_JE_SEITE,
    testzahl: K.TEIL4_TESTZAHL, zBonf: K.TEIL4_BONFERRONI_T, mdeFaktor: K.MDE_FAKTOR, mdeFaktorBonf: K.TEIL4_MDE_FAKTOR_BONF, befunde: [] };
  function sichern() { schreibe(laufPfad, B); }
  sichern();

  /* ---------- (0a) Leck-Klinke des Lesers: praepariertes Filing (§T4.7) ---------- */
  var probeTag = '2024-05-06', kl = { tag: probeTag, wirft: false, liefert: false };
  try { F.klinke('AAPL', probeTag, { filed: probeTag, adsh: 'probe-filed-gleich-tag' }); } catch (e) { kl.wirft = /Leck/.test(e.message); kl.meldung = e.message; }
  var r1 = F.klinke('AAPL', probeTag, { filed: '2024-05-03', adsh: 'probe-filed-vor-tag' });
  kl.liefert = !!r1 && r1.filed === '2024-05-03';
  var protokollStart = F.protokoll().length;                       /* die Probe-Eintraege zaehlen nicht zum Lauf */
  B.leser = { probe: kl, probeBestanden: kl.wirft && kl.liefert, protokollStart: protokollStart };
  sag('Leser-Klinke: filed = tag ' + (kl.wirft ? 'wirft' : 'WIRFT NICHT') + ', filed = tag-1 ' + (kl.liefert ? 'liefert' : 'LIEFERT NICHT'));

  /* ---------- (0b) Leck-Klinke der Maschine: Positivkontrolle und saubere Probe, monatlich, Klassen [1,2,3] ---------- */
  var lp = PR.lauf(T, RF.leckProbe, { freq: 'monat', empfindlichkeit: 'haupt', klassen: KL });
  var sp = PR.lauf(T, RF.sauberProbe, { freq: 'monat', empfindlichkeit: 'haupt', klassen: KL });
  B.leck = { verstoesseLeck: lp.verstoesse, verstoesseSauber: sp.verstoesse, ungueltigLeck: lp.ungueltig,
    bestanden: lp.verstoesse > 0 && lp.ungueltig === true && sp.verstoesse === 0 && sp.ungueltig === false };
  if (!B.leck.bestanden) B.befunde.push('LECK-PROBE DER MASCHINE GEFALLEN: ' + lp.verstoesse + ' / ' + sp.verstoesse);
  sag('Leck-Probe Maschine: ' + lp.verstoesse + ' (Leck) / ' + sp.verstoesse + ' (sauber) => ' + (B.leck.bestanden ? 'bestanden' : 'GEFALLEN'));
  sichern();

  /* ---------- (1) Auswahl je Signaltag: Universum, A, B, Sektor (§T4.3) ---------- */
  var tage = PR.signaltage(T, 'monat'), S = [], verstoesse = 0, beispiele = [], praep = null;
  var zA = { ohneSPY: 0, ohneVorzeile: 0 };
  for (var pi = 0; pi < tage.length; pi++) {
    var t = tage[pi];
    var U = PR.universum(T, t, { klassen: KL });
    if (!U.liste.length || U.aTag === null) continue;
    var sicht = PR.Sicht(T, t, {});
    var sel = auswahl(sicht, U.liste, T, F, {});
    verstoesse += sicht.verstoesse(); sicht.beispiele().forEach(function (b) { if (beispiele.length < 10) beispiele.push(b); });
    if (!sel.ok) { zA.ohneSPY++; continue; }
    zA.ohneVorzeile += sel.zaehler.ohneVorzeile;
    if (praep === null) {                                          /* Positivkontrolle der eigenen Auswahl, einmal */
      var s2 = PR.Sicht(T, t, {});
      auswahl(s2, U.liste, T, F, { leck: true });
      praep = { tag: T.kal.tage[t], verstoesse: s2.verstoesse(), ungueltig: s2.verstoesse() > 0, beispiele: s2.beispiele() };
    }
    var aIso = T.kal.tage[U.aTag];
    S.push({ t: t, iso: T.kal.tage[t], a: U.aTag, aIso: aIso, monat: aIso.slice(0, 7), mIdx: monatsIndex(aIso), jahr: +aIso.slice(0, 4),
      liste: sel.liste, rSpy: sel.rSpy, verworfen: U.verworfen });
  }
  B.klinkePruefstand = { verstoesseAuswahl: verstoesse, beispiele: beispiele, ungueltig: verstoesse > 0, praepariert: praep,
    bestanden: verstoesse === 0 && !!praep && praep.verstoesse > 0 && praep.ungueltig };
  if (!B.klinkePruefstand.bestanden) B.befunde.push('SPERRKLINKE DES PRUEFSTANDS (AUSWAHL) GEFALLEN: sauber ' + verstoesse + ', praepariert ' + (praep ? praep.verstoesse : 'null'));
  sag('Klinke Pruefstand (Auswahl): sauber ' + verstoesse + ' Verstoesse, praepariert ' + (praep ? praep.verstoesse : '-') + ' => ' + (B.klinkePruefstand.bestanden ? 'bestanden' : 'GEFALLEN'));
  /* Leser-Protokoll ueber alle Zugriffe des Laufs */
  var prot = F.protokoll(), lv = 0, lvBeispiele = [];
  for (var qi = protokollStart; qi < prot.length; qi++) { var pe = prot[qi]; if (pe.filed != null && !(pe.filed < pe.tag)) { lv++; if (lvBeispiele.length < 5) lvBeispiele.push(pe); } }
  B.leser.zugriffe = prot.length - protokollStart; B.leser.verstoesse = lv; B.leser.beispiele = lvBeispiele;
  B.leser.zaehler = JSON.parse(JSON.stringify(F.zaehler));
  B.leser.bestanden = B.leser.probeBestanden && lv === 0;
  if (!B.leser.bestanden) B.befunde.push('LECK-KLINKE DES LESERS GEFALLEN: Probe ' + JSON.stringify(kl) + ', Verstoesse im Protokoll ' + lv);
  sag('Leser-Klinke: ' + B.leser.zugriffe + ' Zugriffe, ' + lv + ' Verstoesse (filed >= tag), geliefert ' + F.zaehler.geliefert + ', ohne Filing ' + F.zaehler.null_ohneFiling + ', veraltet ' + F.zaehler.null_veraltet + ', ohne Reihe ' + F.zaehler.null_ohneReihe + ' => ' + (B.leser.bestanden ? 'bestanden' : 'GEFALLEN'));
  B.signaltage = { gesamt: tage.length, mitUniversum: S.length, ohneSPY: zA.ohneSPY, ohneVorzeile: zA.ohneVorzeile, erster: S.length ? S[0].iso : null, letzter: S.length ? S[S.length - 1].iso : null };
  sag('Signaltage: ' + S.length + ' mit Universum (' + B.signaltage.erster + ' .. ' + B.signaltage.letzter + '), ohne SPY ' + zA.ohneSPY + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  sichern();

  /* ---------- (2) Vorpruefung des PM reproduziert - VOR Test 1/2 (§T4.8) ---------- */
  var VP = K.TEIL4_VORPRUEFUNG, vp = { erwartet: VP, monate: S.length, aSumme: 0, uniSumme: 0, horizonte: {}, faktoren: {}, befunde: [] };
  var vpPaare = {}; HZ.forEach(function (H) { vpPaare[H.key] = []; });
  S.forEach(function (s) {
    var A = s.liste.filter(function (e) { return e.istA; });
    vp.aSumme += A.length; vp.uniSumme += s.liste.length;
    var perm = mischen(A.slice(), ST.mulberry32(ST.fnv(VP.saat + '|' + s.iso)));
    var h = perm.length >> 1, h1 = perm.slice(0, h), h2 = perm.slice(h);
    HZ.forEach(function (H) {
      var aE = periodenEnde(T, s.a, H.tage);
      if (aE === null || h1.length < 1 || h2.length < 1) return;
      var k1 = korb(T, h1, s.t, s.a, aE, totalverlust), k2 = korb(T, h2, s.t, s.a, aE, totalverlust);
      vpPaare[H.key].push({ mIdx: s.mIdx, brutto: k1.brutto - k2.brutto, netto: k1.netto - k2.netto });
    });
  });
  vp.aMittel = vp.aSumme / S.length; vp.uniMittel = vp.uniSumme / S.length; vp.aAnteil = vp.aMittel / vp.uniMittel;
  vp.faktoren.aAnteil = vp.aAnteil / (VP.aMittel / VP.uniMittel);
  HZ.forEach(function (H) {
    var r = reihe(vpPaare[H.key], 'brutto', H.lag);
    var mdeNaiv = (r.sd != null && r.n > 1) ? VP.mdeFaktorPM * r.sd / Math.sqrt(r.n) : null;
    vp.horizonte[H.key] = { n: r.n, paarSd: r.sd, paarMittel: r.mittel, seNaiv: r.seNaiv, seHH: r.seHH, mdePMNaiv: mdeNaiv,
      mdePMUeberlappt: mdeNaiv == null ? null : mdeNaiv * Math.sqrt(H.lag), mdePMHH: (r.seHH != null) ? VP.mdeFaktorPM * r.seHH : null,
      erwartetSd: VP.paarSd[H.key], erwartetMde: VP.mde[H.key] };
    vp.faktoren['paarSd_' + H.key] = (r.sd != null) ? r.sd / VP.paarSd[H.key] : null;
  });
  var vpOk = true;
  Object.keys(vp.faktoren).forEach(function (kf) { var fk = vp.faktoren[kf]; if (!(fk != null && fk <= VP.faktorGrenze && fk >= 1 / VP.faktorGrenze)) { vpOk = false; vp.befunde.push(kf + ' Faktor ' + (fk == null ? 'null' : fk.toFixed(3))); } });
  vp.bestanden = vpOk;
  B.vorpruefung = vp;
  if (!vpOk) B.befunde.push('VORPRUEFUNG GEFALLEN (Faktor > ' + VP.faktorGrenze + '): ' + vp.befunde.join(' | ') + ' - gemeldet, nicht repariert; Test 1/2 werden gekennzeichnet berichtet');
  sag('Vorpruefung: A ' + f2(vp.aMittel) + ' von ' + f2(vp.uniMittel) + ' je Monat (' + (100 * vp.aAnteil).toFixed(1) + ' %, erwartet ' + VP.aMittel + '/' + VP.uniMittel + ', Faktor ' + f2(vp.faktoren.aAnteil) + ')');
  HZ.forEach(function (H) { var v = vp.horizonte[H.key]; sag('  ' + H.name + ': Paar-sd ' + f2(v.paarSd) + ' Pp (erwartet ' + VP.paarSd[H.key] + ', Faktor ' + f2(vp.faktoren['paarSd_' + H.key]) + '), n ' + v.n + ', MDE(PM) naiv ' + f2(v.mdePMNaiv) + ' / ueberlappt ' + f2(v.mdePMUeberlappt) + ' / HH ' + f2(v.mdePMHH) + ' (erwartet ' + VP.mde[H.key].join(' / ') + ')'); });
  sag('Vorpruefung => ' + (vpOk ? 'bestanden' : 'GEFALLEN: ' + vp.befunde.join(' | ')));
  sichern();

  /* ---------- (3) Test 1 / Test 2 je Monat je Horizont, Sektoren (§T4.4) ---------- */
  B.monate = [];
  S.forEach(function (s, si) {
    var L = s.liste, A = L.filter(function (e) { return e.istA; });
    var AB = A.filter(function (e) { return e.b === 1; }), AnB = A.filter(function (e) { return e.b === 0; }), Aohne = A.filter(function (e) { return e.b === null; });
    var pool = L.filter(function (e) { return e.b !== null; }).sort(function (x, y) { return y.fm - x.fm || x.sym - y.sym; });
    var k = Math.floor(pool.length / K.TEIL4_QUINTIL), Q5 = pool.slice(0, k), Q1 = pool.slice(pool.length - k);
    var ohneUni = L.filter(function (e) { return e.b === null; });
    var m = { monat: s.monat, signaltag: s.iso, ausfuehrungstag: s.aIso, mIdx: s.mIdx, jahr: s.jahr, t: s.t, rSpy: s.rSpy,
      nUni: L.length, nA: A.length, nAB: AB.length, nAnB: AnB.length, nAohne: Aohne.length, nOhneFundamentUni: ohneUni.length, nPool: pool.length, k: k,
      schwachA: A.filter(function (e) { return schwach(F, T.symName[e.sym]); }).length,
      klassen: { uni: klassenZaehler(L), A: klassenZaehler(A), AB: klassenZaehler(AB), AnB: klassenZaehler(AnB), Aohne: klassenZaehler(Aohne), ohneUni: klassenZaehler(ohneUni) },
      sektorenA: {} };
    AB.concat(AnB).forEach(function (e) { var sk = m.sektorenA[e.sektor] || (m.sektorenA[e.sektor] = { ab: 0, anb: 0 }); if (e.b === 1) sk.ab++; else sk.anb++; });
    HZ.forEach(function (H) {
      var aE = periodenEnde(T, s.a, H.tage);
      var hm = { aEnde: aE == null ? null : T.kal.tage[aE], vollstaendig: aE != null, test1: null, test2: null, sektoren: {} };
      m[H.key] = hm;
      if (aE == null) return;
      if (AB.length >= K.TEIL4_MIN_JE_SEITE && AnB.length >= K.TEIL4_MIN_JE_SEITE) {
        var kAB = korb(T, AB, s.t, s.a, aE, totalverlust), kAnB = korb(T, AnB, s.t, s.a, aE, totalverlust);
        hm.test1 = { ab: kAB, anb: kAnB, dBrutto: kAB.brutto - kAnB.brutto, dNetto: kAB.netto - kAnB.netto };
      }
      if (pool.length >= K.MIN_UNIVERSUM && k >= 1) {
        var kQ5 = korb(T, Q5, s.t, s.a, aE, totalverlust), kQ1 = korb(T, Q1, s.t, s.a, aE, totalverlust), kP = korb(T, pool, s.t, s.a, aE, totalverlust);
        hm.test2 = { q5: kQ5, q1: kQ1, pool: kP, dQ5Brutto: kQ5.brutto - kP.brutto, dQ5Netto: kQ5.netto - kP.netto,
          dQ1Brutto: kQ1.brutto - kP.brutto, dQ1Netto: kQ1.netto - kP.netto,
          dQ5Q1Brutto: kQ5.brutto - kQ1.brutto, dQ5Q1Netto: kQ5.brutto - kQ1.brutto - kQ5.kosten - kQ1.kosten };
      }
      Object.keys(m.sektorenA).forEach(function (name) {
        var sAB = AB.filter(function (e) { return e.sektor === name; }), sAnB = AnB.filter(function (e) { return e.sektor === name; });
        if (sAB.length < K.TEIL4_SEKTOR_MIN_JE_SEITE || sAnB.length < K.TEIL4_SEKTOR_MIN_JE_SEITE) return;
        var c1 = korb(T, sAB, s.t, s.a, aE, totalverlust), c2 = korb(T, sAnB, s.t, s.a, aE, totalverlust);
        hm.sektoren[name] = { nAB: sAB.length, nAnB: sAnB.length, dBrutto: c1.brutto - c2.brutto, dNetto: c1.netto - c2.netto };
      });
    });
    B.monate.push(m);
    if (si % 12 === 11) { sichern(); sag('  Monate ' + (si + 1) + '/' + S.length + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)'); }
  });
  sichern();

  /* ---------- (4) Aggregation ---------- */
  function mittel(arr) { return arr.length ? arr.reduce(function (s2, v) { return s2 + v; }, 0) / arr.length : null; }
  function jahresscheiben(P, feld, L) {
    var jahre = {}; P.forEach(function (p) { (jahre[p.jahr] = jahre[p.jahr] || []).push(p); });
    return Object.keys(jahre).map(Number).sort(function (x, y) { return x - y; }).map(function (j) { var r = reihe(jahre[j], feld, L); r.jahr = j; r.summe = jahre[j].reduce(function (s2, p) { return s2 + p[feld]; }, 0); return r; });
  }
  var abTag = T.maxTag - K.AKTUELL_TAGE;
  B.test1 = {}; B.test2 = {};
  HZ.forEach(function (H) {
    var P = B.monate.filter(function (m) { return m[H.key].test1; }).map(function (m) { var x = m[H.key].test1; return { mIdx: m.mIdx, jahr: m.jahr, t: m.t, monat: m.monat, dBrutto: x.dBrutto, dNetto: x.dNetto, bruttoAB: x.ab.brutto, bruttoAnB: x.anb.brutto, kostenAB: x.ab.kosten, kostenAnB: x.anb.kosten, nAB: x.ab.n, nAnB: x.anb.n, toteAB: x.ab.tote, toteAnB: x.anb.tote }; });
    var sekNamen = {}; B.monate.forEach(function (m) { Object.keys(m[H.key].sektoren).forEach(function (n2) { sekNamen[n2] = true; }); });
    var sektoren = {};
    Object.keys(sekNamen).sort().forEach(function (name) {
      var Ps = B.monate.filter(function (m) { return m[H.key].sektoren[name]; }).map(function (m) { var x = m[H.key].sektoren[name]; return { mIdx: m.mIdx, jahr: m.jahr, t: m.t, dBrutto: x.dBrutto, dNetto: x.dNetto, nAB: x.nAB, nAnB: x.nAnB }; });
      sektoren[name] = { n: Ps.length, netto: reihe(Ps, 'dNetto', H.lag), brutto: reihe(Ps, 'dBrutto', H.lag), nABMittel: mittel(Ps.map(function (p) { return p.nAB; })), nAnBMittel: mittel(Ps.map(function (p) { return p.nAnB; })),
        monateOhne: B.monate.filter(function (m) { return m[H.key].vollstaendig && !m[H.key].sektoren[name]; }).length };
    });
    B.test1[H.key] = { horizont: H, n: P.length, netto: reihe(P, 'dNetto', H.lag), brutto: reihe(P, 'dBrutto', H.lag),
      jahre: jahresscheiben(P, 'dNetto', H.lag), aktuell: reihe(P.filter(function (p) { return p.t >= abTag; }), 'dNetto', H.lag), aktuellAb: T.kal.tage[Math.max(0, abTag)],
      unvollstaendig: B.monate.filter(function (m) { return !m[H.key].vollstaendig; }).length, zuKlein: B.monate.filter(function (m) { return m[H.key].vollstaendig && !m[H.key].test1; }).length,
      abBruttoMittel: mittel(P.map(function (p) { return p.bruttoAB; })), anbBruttoMittel: mittel(P.map(function (p) { return p.bruttoAnB; })),
      kostenABMittel: mittel(P.map(function (p) { return p.kostenAB; })), kostenAnBMittel: mittel(P.map(function (p) { return p.kostenAnB; })),
      nABMittel: mittel(P.map(function (p) { return p.nAB; })), nAnBMittel: mittel(P.map(function (p) { return p.nAnB; })),
      toteABMittel: mittel(P.map(function (p) { return p.toteAB; })), toteAnBMittel: mittel(P.map(function (p) { return p.toteAnB; })),
      sektoren: sektoren, monate: P };
    var P2 = B.monate.filter(function (m) { return m[H.key].test2; }).map(function (m) { var x = m[H.key].test2; return { mIdx: m.mIdx, jahr: m.jahr, t: m.t, monat: m.monat, dQ5Brutto: x.dQ5Brutto, dQ5Netto: x.dQ5Netto, dQ1Brutto: x.dQ1Brutto, dQ1Netto: x.dQ1Netto, dQ5Q1Brutto: x.dQ5Q1Brutto, dQ5Q1Netto: x.dQ5Q1Netto, poolBrutto: x.pool.brutto, q5Brutto: x.q5.brutto, kostenQ5: x.q5.kosten, kostenPool: x.pool.kosten, nPool: x.pool.n, k: x.q5.n }; });
    B.test2[H.key] = { horizont: H, n: P2.length, q5Netto: reihe(P2, 'dQ5Netto', H.lag), q5Brutto: reihe(P2, 'dQ5Brutto', H.lag),
      q1Netto: reihe(P2, 'dQ1Netto', H.lag), q1Brutto: reihe(P2, 'dQ1Brutto', H.lag), q5q1Netto: reihe(P2, 'dQ5Q1Netto', H.lag), q5q1Brutto: reihe(P2, 'dQ5Q1Brutto', H.lag),
      jahre: jahresscheiben(P2, 'dQ5Netto', H.lag), aktuell: reihe(P2.filter(function (p) { return p.t >= abTag; }), 'dQ5Netto', H.lag),
      poolMittel: mittel(P2.map(function (p) { return p.nPool; })), kMittel: mittel(P2.map(function (p) { return p.k; })), poolBruttoMittel: mittel(P2.map(function (p) { return p.poolBrutto; })), q5BruttoMittel: mittel(P2.map(function (p) { return p.q5Brutto; })),
      kostenQ5Mittel: mittel(P2.map(function (p) { return p.kostenQ5; })), kostenPoolMittel: mittel(P2.map(function (p) { return p.kostenPool; })), monate: P2 };
    var r1 = B.test1[H.key].netto, r2 = B.test2[H.key].q5Netto;
    sag('Test 1 ' + H.name + ': n ' + r1.n + ', Delta netto ' + f4(r1.mittel) + ' Pp (brutto ' + f4(B.test1[H.key].brutto.mittel) + '), se naiv ' + f4(r1.seNaiv) + ', se HH ' + f4(r1.se) + (r1.hh0 ? ' (Block)' : '') + ', t ' + f2(r1.t) + ', MDE80 ' + f4(r1.mde) + ' / Bonf ' + f4(r1.mdeBonf) + '; AB ' + f2(B.test1[H.key].nABMittel) + ' / AnB ' + f2(B.test1[H.key].nAnBMittel) + ' je Monat');
    sag('Test 2 ' + H.name + ': n ' + r2.n + ', Q5-Pool netto ' + f4(r2.mittel) + ' Pp (t ' + f2(r2.t) + ', MDE80 ' + f4(r2.mde) + '), Q1-Pool ' + f4(B.test2[H.key].q1Netto.mittel) + ', Q5-Q1 brutto ' + f4(B.test2[H.key].q5q1Brutto.mittel) + ' (t ' + f2(B.test2[H.key].q5q1Brutto.t) + '), Pool ' + f2(B.test2[H.key].poolMittel) + ', k ' + f2(B.test2[H.key].kMittel));
  });
  /* Klassenmix und "ohne Fundament" je Jahr und Klasse (§T4.4) */
  var jz = {};
  B.monate.forEach(function (m) {
    var e = jz[m.jahr] || (jz[m.jahr] = { jahr: m.jahr, monate: 0, uni: { 1: 0, 2: 0, 3: 0 }, ohneUni: { 1: 0, 2: 0, 3: 0 }, A: { 1: 0, 2: 0, 3: 0 }, Aohne: { 1: 0, 2: 0, 3: 0 }, AB: { 1: 0, 2: 0, 3: 0 }, AnB: { 1: 0, 2: 0, 3: 0 }, schwachA: 0, nA: 0 });
    e.monate++; e.schwachA += m.schwachA; e.nA += m.nA;
    [1, 2, 3].forEach(function (c) { e.uni[c] += m.klassen.uni[c]; e.ohneUni[c] += m.klassen.ohneUni[c]; e.A[c] += m.klassen.A[c]; e.Aohne[c] += m.klassen.Aohne[c]; e.AB[c] += m.klassen.AB[c]; e.AnB[c] += m.klassen.AnB[c]; });
  });
  B.ohneFundament = Object.keys(jz).map(Number).sort(function (x, y) { return x - y; }).map(function (j) {
    var e = jz[j], o = { jahr: j, monate: e.monate, anteilUni: {}, anteilA: {}, uniJeMonat: {}, abJeMonat: {}, anbJeMonat: {}, schwachAAnteil: e.nA ? e.schwachA / e.nA : null };
    [1, 2, 3].forEach(function (c) { o.anteilUni[c] = e.uni[c] ? e.ohneUni[c] / e.uni[c] : null; o.anteilA[c] = e.A[c] ? e.Aohne[c] / e.A[c] : null; o.uniJeMonat[c] = e.uni[c] / e.monate; o.abJeMonat[c] = e.AB[c] / e.monate; o.anbJeMonat[c] = e.AnB[c] / e.monate; });
    var uniS = e.uni[1] + e.uni[2] + e.uni[3], ohneS = e.ohneUni[1] + e.ohneUni[2] + e.ohneUni[3], aS = e.A[1] + e.A[2] + e.A[3], aoS = e.Aohne[1] + e.Aohne[2] + e.Aohne[3];
    o.anteilUni.gesamt = uniS ? ohneS / uniS : null; o.anteilA.gesamt = aS ? aoS / aS : null;
    return o;
  });
  B.klassenmix = { AB: { 1: mittel(B.monate.map(function (m) { return m.klassen.AB[1]; })), 2: mittel(B.monate.map(function (m) { return m.klassen.AB[2]; })), 3: mittel(B.monate.map(function (m) { return m.klassen.AB[3]; })) },
    AnB: { 1: mittel(B.monate.map(function (m) { return m.klassen.AnB[1]; })), 2: mittel(B.monate.map(function (m) { return m.klassen.AnB[2]; })), 3: mittel(B.monate.map(function (m) { return m.klassen.AnB[3]; })) },
    uni: { 1: mittel(B.monate.map(function (m) { return m.klassen.uni[1]; })), 2: mittel(B.monate.map(function (m) { return m.klassen.uni[2]; })), 3: mittel(B.monate.map(function (m) { return m.klassen.uni[3]; })) },
    nUniMittel: mittel(B.monate.map(function (m) { return m.nUni; })), nAMittel: mittel(B.monate.map(function (m) { return m.nA; })), nABMittel: mittel(B.monate.map(function (m) { return m.nAB; })), nAnBMittel: mittel(B.monate.map(function (m) { return m.nAnB; })), nAohneMittel: mittel(B.monate.map(function (m) { return m.nAohne; })),
    ohneFundamentUniAnteil: mittel(B.monate.map(function (m) { return m.nOhneFundamentUni / m.nUni; })), ohneFundamentAAnteil: mittel(B.monate.map(function (m) { return m.nA ? m.nAohne / m.nA : 0; })) };
  sichern();

  /* ---------- (5) Placebo, Hauptfenster (§T4.7) ---------- */
  var PL = K.TEIL4_PLACEBO, einzeln = [], mB = 0, mN = 0, fehler = 0;
  for (var zi = 0; zi < PL.ziehungen; zi++) {
    var Pz = [];
    S.forEach(function (s) {
      var aE = periodenEnde(T, s.a, H0.tage); if (aE === null) return;
      var A = s.liste.filter(function (e) { return e.istA; });
      var sides = placeboSeiten(A, PL.saat + '#' + zi + '|' + s.iso);
      if (sides.ab.length < K.TEIL4_MIN_JE_SEITE || sides.anb.length < K.TEIL4_MIN_JE_SEITE) return;
      var c1 = korb(T, sides.ab, s.t, s.a, aE, totalverlust), c2 = korb(T, sides.anb, s.t, s.a, aE, totalverlust);
      Pz.push({ mIdx: s.mIdx, dBrutto: c1.brutto - c2.brutto, dNetto: c1.netto - c2.netto });
    });
    var rz = reihe(Pz, 'dNetto', H0.lag), rzb = reihe(Pz, 'dBrutto', H0.lag);
    var tOk = !(rz.t != null && Math.abs(rz.t) >= PL.tEinzeln);
    if (!tOk) fehler++;
    einzeln.push({ ziehung: zi, n: rz.n, brutto: rzb.mittel, netto: rz.mittel, seHH: rz.se, seNaiv: rz.seNaiv, t: rz.t, tNaiv: rz.tNaiv, tOk: tOk });
    mB += rzb.mittel; mN += rz.mittel;
  }
  mB /= PL.ziehungen; mN /= PL.ziehungen;
  var seE = mittel(einzeln.map(function (x) { return x.seHH; }));
  var plOk = Math.abs(mB) < PL.schrankePp && Math.abs(mN) < PL.schrankePp && fehler <= PL.maxFehler;
  B.kontrollen = { placebo: { einzeln: einzeln, mittelBrutto: mB, mittelNetto: mN, schrankePp: PL.schrankePp, seEinzelnMittel: seE, seDesMittels: seE == null ? null : seE / Math.sqrt(PL.ziehungen),
    fehlerEinzelnT: fehler, maxFehler: PL.maxFehler, tEinzeln: PL.tEinzeln, bestanden: plOk } };
  if (!plOk) B.befunde.push('PLACEBO GEFALLEN: Mittel brutto ' + f4(mB) + ', netto ' + f4(mN) + ' Pp (Schranke ' + PL.schrankePp + '), |t|>=' + PL.tEinzeln + ' in ' + fehler);
  sag('Placebo (' + PL.ziehungen + '): Mittel brutto ' + f4(mB) + ' Pp, netto ' + f4(mN) + ' Pp (Schranke ' + PL.schrankePp + ', se des Mittels ' + f4(B.kontrollen.placebo.seDesMittels) + '), |t|>=3 in ' + fehler + ' => ' + (plOk ? 'bestanden' : 'GEFALLEN'));
  sichern();

  /* ---------- (6) Orakel, Hauptfenster (§T4.7) ---------- */
  var OR = K.TEIL4_ORAKEL, Po = [], oOhne = 0, oZuKlein = 0;
  S.forEach(function (s) {
    var aE = periodenEnde(T, s.a, H0.tage); if (aE === null) return;
    var sichtO = PR.Sicht(T, s.t, { orakel: true });
    var A = s.liste.filter(function (e) { return e.istA; });
    var sides = orakelSeiten(T, sichtO, A, s.a, aE); oOhne += sides.ohne;
    if (sides.ab.length < K.TEIL4_MIN_JE_SEITE || sides.anb.length < K.TEIL4_MIN_JE_SEITE) { oZuKlein++; return; }
    var c1 = korb(T, sides.ab, s.t, s.a, aE, totalverlust), c2 = korb(T, sides.anb, s.t, s.a, aE, totalverlust);
    Po.push({ mIdx: s.mIdx, dBrutto: c1.brutto - c2.brutto, dNetto: c1.netto - c2.netto, nGew: sides.ab.length, nVer: sides.anb.length });
  });
  var ro = reihe(Po, 'dBrutto', H0.lag), ron = reihe(Po, 'dNetto', H0.lag), tor = [];
  if (!(ro.mittel >= OR.minPp)) tor.push('brutto ' + f4(ro.mittel) + ' < ' + OR.minPp);
  if (!(ro.mittelDurchSd >= OR.minSd)) tor.push('Mittel/sd ' + f2(ro.mittelDurchSd) + ' < ' + OR.minSd);
  if (!(ro.t >= OR.tBoden)) tor.push('t ' + f2(ro.t) + ' < ' + OR.tBoden);
  B.kontrollen.orakel = { brutto: ro, netto: ron, n: Po.length, gewinnerMittel: mittel(Po.map(function (p) { return p.nGew; })), verliererMittel: mittel(Po.map(function (p) { return p.nVer; })), ohneRendite: oOhne, zuKlein: oZuKlein, schranken: OR, tor: tor, bestanden: tor.length === 0 };
  if (tor.length) B.befunde.push('ORAKEL GEFALLEN: ' + tor.join(' | '));
  sag('Orakel: Gewinner-Verlierer brutto ' + f4(ro.mittel) + ' Pp (sd ' + f2(ro.sd) + ', Mittel/sd ' + f2(ro.mittelDurchSd) + ', t ' + f2(ro.t) + '), netto ' + f4(ron.mittel) + ', n ' + Po.length + ' => ' + (tor.length ? 'GEFALLEN' : 'bestanden'));
  sichern();

  /* ---------- (7) Urteil (§T4.6) ---------- */
  var t1 = B.test1[H0.key].netto, akt = B.test1[H0.key].aktuell;
  var toreMaschine = B.leck.bestanden && B.klinkePruefstand.bestanden && B.leser.bestanden && B.kontrollen.placebo.bestanden && B.kontrollen.orakel.bestanden && B.vorpruefung.bestanden;
  var deltaGeMde = t1.mde != null && t1.mittel >= t1.mde, tGeZ = t1.t != null && t1.t >= K.TEIL4_BONFERRONI_T, aktOk = akt.n > 0 && akt.mittel >= 0;
  var belegt = toreMaschine && deltaGeMde && tGeZ && aktOk;
  B.urteil = { toreMaschine: toreMaschine, test1: { n: t1.n, deltaNetto: t1.mittel, deltaBrutto: B.test1[H0.key].brutto.mittel, se: t1.se, seNaiv: t1.seNaiv, t: t1.t, mde: t1.mde, mdeBonf: t1.mdeBonf, zBonf: K.TEIL4_BONFERRONI_T,
    vorhersagePp: K.TEIL4_VORHERSAGE_PP, vorhersageErreicht: t1.mittel >= K.TEIL4_VORHERSAGE_PP, deltaGeMde: deltaGeMde, tGeZBonf: tGeZ, aktuellN: akt.n, aktuellMittel: akt.mittel, aktuellNichtNegativ: aktOk, belegt: belegt },
    satz: belegt ? 'belegt: Delta ' + f2(t1.mittel) + ' Pp je 120 Tage >= MDE ' + f2(t1.mde) + ', t ' + f2(t1.t) + ' >= ' + K.TEIL4_BONFERRONI_T + ', letzte 250 Tage ' + f2(akt.mittel)
      : 'nicht belegt: nichts oberhalb von ' + f2(t1.mde) + ' Pp je 120 Tage (gemessen ' + f2(t1.mittel) + ' Pp, t ' + f2(t1.t) + (toreMaschine ? '' : '; Tore/Vorpruefung nicht alle bestanden') + ')',
    kandidatenGeschrieben: false };
  if (belegt) {
    var ordner = path.join(K.HIER, 'kandidaten-teil4'); fs.mkdirSync(ordner, { recursive: true }); var nK = 0;
    S.forEach(function (s) {
      var AB = s.liste.filter(function (e) { return e.istA && e.b === 1; }); if (!AB.length) return;
      schreibe(path.join(ordner, s.monat + '.json'), { monat: s.monat, signaltag: s.iso, ausfuehrungstag: s.aIso, n: AB.length, hinweis: 'Kandidatenliste des Querschnitts-Pruefstands Teil 4 (' + K.KONFIG_KENNUNG_TEIL4 + '), A&B. Liste, kein Portfolio, keine Anlageempfehlung.',
        kandidaten: AB.map(function (e) { return { kuerzel: T.symName[e.sym], klasse: K.KLASSEN[e.klasse].name, r12: e.r, rSpy12: s.rSpy, fm: e.fm, filed: e.filed, sektor: e.sektor }; }) });
      nK++;
    });
    B.urteil.kandidatenGeschrieben = true; B.urteil.kandidatenDateien = nK;
  }
  B.sekunden = (Date.now() - t0) / 1000;
  sichern();
  schreibe(a.ergebnis, B);
  sag('\nUrteil: Tore ' + (toreMaschine ? 'halten' : 'GEFALLEN') + '; Test 1: ' + B.urteil.satz + (belegt ? ' (Kandidaten ' + B.urteil.kandidatenDateien + ' Dateien)' : ''));
  sag(B.befunde.length ? 'BEFUNDE:\n- ' + B.befunde.join('\n- ') : 'keine Befunde im Laeufer');
  sag('Ergebnis: ' + a.ergebnis + ' (' + B.sekunden.toFixed(0) + ' s)');
}

if (require.main === module) {
  var a = args(process.argv.slice(2));
  if (!a.aus) { process.stderr.write('--aus <ordner> fehlt\n'); process.exit(2); }
  messung(a);
}
module.exports = { periodenEnde: periodenEnde, monatsIndex: monatsIndex, auswahl: auswahl, korb: korb, reihe: reihe,
  placeboSeiten: placeboSeiten, orakelSeiten: orakelSeiten, mischen: mischen, klassenZaehler: klassenZaehler };
