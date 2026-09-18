'use strict';
/* TEIL 3 - LAEUFER: Momentum 12-1 monatlich auf dem erweiterten Universum, vier Varianten, Kontrollen,
 * gepaarte Vergleiche, Krisentafel (VORREGISTRIERUNG-TEIL3.md).
 *
 * Aufruf (Messung):    node --max-old-space-size=6144 teil3.js --aus voll [--ziel voll/teil3]
 * Aufruf (Ausgabe):    node teil3.js --nur zielportfolio --aussen aussen-pruefstein-teil3.json
 *                      (nach dem Aussen-Pruefstein; liest teil3-ergebnis.json, schreibt zielportfolio/)
 *
 * Schreibt SOFORT nach jedem Teilergebnis auf die Platte (<ziel>/teil3-lauf.json), am Ende die Aggregate nach
 * teil3-ergebnis.json (Repo) und die Tagesreihen nach <ziel>/teil3-tage.json (nicht im Repo).
 * Faellt eine Kontrolle: wird gemeldet, nicht repariert.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. Nur Lesezugriff.
 */
var fs = require('fs');
var path = require('path');
var K = require('./konfig.js');
var PR = require('./pruefstand.js');
var RF = require('./rangfunktionen.js');
var KO = require('./kontrollen.js');
var VA = require('./varianten.js');

function args(argv) {
  var a = { aus: null, ziel: null, nur: null, aussen: null, ergebnis: path.join(K.HIER, 'teil3-ergebnis.json') };
  for (var i = 0; i < argv.length; i++) {
    var x = argv[i];
    if (x === '--aus') a.aus = argv[++i];
    else if (x === '--ziel') a.ziel = argv[++i];
    else if (x === '--nur') a.nur = String(argv[++i]).split(',');
    else if (x === '--aussen') a.aussen = argv[++i];
    else if (x === '--ergebnis') a.ergebnis = argv[++i];
  }
  return a;
}
function will(a, n) { return !a.nur || a.nur.indexOf(n) !== -1; }
function schreibe(pfad, obj) { fs.writeFileSync(pfad + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(pfad + '.tmp', pfad); }
function sag(s) { process.stdout.write(s + '\n'); }
function f4(x) { return x == null || !(x === x) ? '-' : x.toFixed(4); }
function f2(x) { return x == null || !(x === x) ? '-' : x.toFixed(2); }

/* ---------- Kennzahlen einer Reihe (§T3.4) ---------- */
function kennzahlen(T, Rv, UNI, SPY) {
  var P = Rv.perioden, lag = K.PAAR_LAG_TAGE;
  var netto = P.map(function (p) { return p.netto; }), brutto = P.map(function (p) { return p.brutto; });
  function gegen(B) {
    var idx = {}; B.perioden.forEach(function (p) { idx[p.monat] = p; });
    var dN = [], dB = [];
    P.forEach(function (p) { var b = idx[p.monat]; if (b) { dN.push(p.netto - b.netto); dB.push(p.brutto - b.brutto); } });
    return { netto: VA.monatsMomente(dN), brutto: VA.monatsMomente(dB),
      tageNetto: VA.tagesMomente(VA.differenzTage(Rv.tage, B.tage, 'netto'), lag),
      tageBrutto: VA.tagesMomente(VA.differenzTage(Rv.tage, B.tage, 'brutto'), lag) };
  }
  var jahre = {};
  P.forEach(function (p) { (jahre[p.jahr] = jahre[p.jahr] || []).push(p.netto); });
  var jahreListe = Object.keys(jahre).map(Number).sort(function (a, b) { return a - b; }).map(function (j) {
    var m = VA.monatsMomente(jahre[j]); m.jahr = j; m.duenn = m.n < K.JAHR_MIN_PERIODEN;
    m.summe = jahre[j].reduce(function (s, v) { return s + v; }, 0); return m;
  });
  var abTag = T.maxTag - K.AKTUELL_TAGE;
  var aktuell = VA.monatsMomente(P.filter(function (p) { return p.t >= abTag; }).map(function (p) { return p.netto; }));
  aktuell.abTag = T.kal.tage[Math.max(0, abTag)];
  var f12 = VA.schlechtestesFenster(netto, K.SCHLECHTESTES_FENSTER_MONATE);
  var mdd = VA.maxRueckgang(Rv.tage, 'netto'), mddB = VA.maxRueckgang(Rv.tage, 'brutto');
  var zim = VA.zeitImMarkt(Rv.tage);
  var krisen = K.KRISEN.map(function (kr) {
    var mon = P.filter(function (p) { return p.monat >= kr.von && p.monat <= kr.bis; });
    if (!mon.length) return { key: kr.key, n: 0 };
    var f = 1, fb = 1; mon.forEach(function (p) { f *= 1 + p.netto / 100; fb *= 1 + p.brutto / 100; });
    var tage = Rv.tage.filter(function (x) { return x.tag >= mon[0].a && x.tag <= mon[mon.length - 1].aEnde; });
    var z2 = VA.zeitImMarkt(tage);
    return { key: kr.key, n: mon.length, von: mon[0].monat, bis: mon[mon.length - 1].monat,
      rendite: 100 * (f - 1), renditeBrutto: 100 * (fb - 1), mdd: VA.maxRueckgang(tage, 'netto').mdd,
      zeitImMarkt: z2.mittel, anteilInvestiert: z2.anteilInvestiert, monatsMittel: VA.monatsMomente(mon.map(function (p) { return p.netto; })) };
  });
  var eBar = zim.mittel;
  var s = { n: P.length, brutto: VA.monatsMomente(brutto), netto: VA.monatsMomente(netto),
    tageNetto: VA.tagesMomente(Rv.tage.map(function (x) { return { t: x.tag, x: x.netto }; }), lag),
    umschlagMittel: P.reduce(function (s2, p) { return s2 + p.umschlagGesamt; }, 0) / P.length,
    umschlagSchaltMittel: P.reduce(function (s2, p) { return s2 + (p.umschlagSchalt || 0); }, 0) / P.length,
    kostenMittel: P.reduce(function (s2, p) { return s2 + p.kostenGesamt; }, 0) / P.length,
    kostenSchaltMittel: P.reduce(function (s2, p) { return s2 + (p.kostenSchalt || 0); }, 0) / P.length,
    schaltungen: (Rv.schaltungen || []).length, zeitImMarkt: zim,
    mdd: mdd, mddBrutto: mddB, fenster12: { wert: f12.wert, von: f12.von == null ? null : P[f12.von].monat, bis: f12.von == null ? null : P[Math.min(P.length - 1, f12.von + K.SCHLECHTESTES_FENSTER_MONATE - 1)].monat },
    sharpe: VA.sharpe(netto), jahre: jahreListe, aktuell: aktuell, krisen: krisen,
    einsatzMittelSignal: P.reduce(function (s2, p) { return s2 + p.einsatz; }, 0) / P.length,
    monateInKasse: P.filter(function (p) { return p.einsatz === 0; }).length,
    monateUnterEMA: P.filter(function (p) { return p.regimeSPY === 0; }).length, anlauf: Rv.anlauf || 0,
    dividende: { einsatzMittel: eBar,
      korrekturUni: eBar == null ? null : eBar * K.DIVIDENDE_LUECKE_DEZIL_UNI_PP,
      korrekturSPY: eBar == null ? null : { mitte: eBar * K.DIVIDENDE_DEZIL_JAHR / 12 - K.SPY_DIVIDENDE_JAHR.mitte / 12,
        min: eBar * K.DIVIDENDE_DEZIL_JAHR / 12 - K.SPY_DIVIDENDE_JAHR.max / 12, max: eBar * K.DIVIDENDE_DEZIL_JAHR / 12 - K.SPY_DIVIDENDE_JAHR.min / 12 } } };
  if (UNI) s.gegenUni = gegen(UNI);
  if (SPY) s.gegenSPY = gegen(SPY);
  return s;
}

/* ---------- Gepaarter Vergleich einer Variante gegen V0 (§T3.5) ---------- */
function paar(Rv, R0, kv, k0) {
  var idx = {}; R0.perioden.forEach(function (p) { idx[p.monat] = p; });
  var d = [], monate = [];
  Rv.perioden.forEach(function (p) { var b = idx[p.monat]; if (b) { d.push(p.netto - b.netto); monate.push(p.monat); } });
  var mon = VA.monatsMomente(d);
  var tg = VA.tagesMomente(VA.differenzTage(Rv.tage, R0.tage, 'netto'), K.PAAR_LAG_TAGE);
  var dMdd = kv.mdd.mdd - k0.mdd.mdd;
  var krisen = K.KRISEN.map(function (kr) {
    var w = []; monate.forEach(function (m, i) { if (m >= kr.von && m <= kr.bis) w.push(d[i]); });
    return { key: kr.key, n: w.length, differenz: VA.monatsMomente(w) };
  });
  var kleinerMdd = kv.mdd.mdd < k0.mdd.mdd;
  var nichtSchlechterNaiv = mon.t != null && mon.t >= K.PAAR_T_SCHLECHTER;
  var nichtSchlechterHH = tg && tg.t != null && tg.t >= K.PAAR_T_SCHLECHTER;
  return { n: mon.n, monatsdifferenz: mon, tagesdifferenz: tg, deltaMdd: dMdd, mddV: kv.mdd.mdd, mddV0: k0.mdd.mdd,
    fenster12V: kv.fenster12.wert, fenster12V0: k0.fenster12.wert, krisen: krisen,
    kleinerMdd: kleinerMdd, nichtSchlechterNaiv: nichtSchlechterNaiv, nichtSchlechterHH: nichtSchlechterHH,
    ungueltig: !!Rv.ungueltig,
    bestanden: kleinerMdd && nichtSchlechterNaiv && nichtSchlechterHH && !Rv.ungueltig };
}

function klassenZaehler(T, syms, tag) {
  var z = { 1: 0, 2: 0, 3: 0, andere: 0 };
  syms.forEach(function (s) { var zl = T.zeileVon(s, tag); var kl = zl >= 0 ? T.g.klasse[zl] : -1; if (z[kl] !== undefined) z[kl]++; else z.andere++; });
  return z;
}

/* =========================================================================================
 * Messung
 * ========================================================================================= */
function messung(a) {
  var ziel = a.ziel || path.join(a.aus, 'teil3');
  fs.mkdirSync(ziel, { recursive: true });
  var laufPfad = path.join(ziel, 'teil3-lauf.json');
  var t0 = Date.now(), KL = K.UNIVERSUM_KLASSEN_TEIL3;
  sag('Tafel laden aus ' + a.aus + ' ...');
  var T = PR.Tafel(a.aus);
  var regime = PR.spyRegime(T);
  sag('Tafel: ' + T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, bis ' + T.kal.tage[T.maxTag] + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');

  var B = { kennung: K.KONFIG_KENNUNG_TEIL3, panel: T.stand.kennung, kunst: !!T.stand.kunst, stand: new Date().toISOString(),
    letzterTag: T.kal.tage[T.maxTag], zeilen: T.g.n, reihen: T.nSym, klassen: KL.slice(), freq: 'monat', befunde: [] };
  function sichern() { schreibe(laufPfad, B); }
  sichern();

  /* ---------- (0) Leck-Sperrklinke der Maschine, monatlich, erweitertes Universum ---------- */
  var lp = PR.lauf(T, RF.leckProbe, { freq: 'monat', empfindlichkeit: 'haupt', klassen: KL });
  var sp = PR.lauf(T, RF.sauberProbe, { freq: 'monat', empfindlichkeit: 'haupt', klassen: KL });
  B.leck = { verstoesseLeck: lp.verstoesse, verstoesseSauber: sp.verstoesse, ungueltigLeck: lp.ungueltig,
    bestanden: lp.verstoesse > 0 && lp.ungueltig === true && sp.verstoesse === 0 && sp.ungueltig === false };
  if (!B.leck.bestanden) B.befunde.push('LECK-PROBE GEFALLEN: ' + lp.verstoesse + ' / ' + sp.verstoesse);
  sag('Leck-Probe: ' + lp.verstoesse + ' (Leck) / ' + sp.verstoesse + ' (sauber) => ' + (B.leck.bestanden ? 'bestanden' : 'GEFALLEN'));
  sichern();

  /* ---------- (1) V0 auf der Maschine ---------- */
  var L0 = PR.lauf(T, RF.momentum12_1, { freq: 'monat', empfindlichkeit: 'haupt', klassen: KL });
  var B0 = PR.bewerte(T, L0, { regime: regime });
  var A0 = KO.auswerten(T, B0); A0.rang = RF.momentum12_1.$name;
  if (L0.verstoesse > 0 || L0.ungueltig) B.befunde.push('LECK im V0-Lauf: ' + L0.verstoesse + ' Verstoesse - Lauf UNGUELTIG');
  B.maschineV0 = A0;
  delete B.maschineV0.perioden_reihe;
  var v0Pfad = path.join(K.HIER, 'teil3-v0-perioden.json');
  schreibe(v0Pfad, { kennung: K.KONFIG_KENNUNG_TEIL3, panel: T.stand.kennung, rang: A0.rang, freq: 'monat', universum: KL.slice(),
    stand: new Date().toISOString(), letzterTag: T.kal.tage[T.maxTag], n: A0.perioden, bruttoMittel: A0.brutto.mittel, nettoMittel: A0.netto.mittel,
    hinweis: 'Long-Short (lsBrutto) ist die in Teil 3 registrierte Groesse des Aussen-Pruefsteins (§T3.7).',
    perioden: KO.periodenreihe(T, B0) });
  sag('V0 Maschine: n ' + A0.perioden + ', Universum ' + A0.universumMittel.toFixed(0) + ', Dezil ' + A0.dezilMittel.toFixed(1)
    + ', Long-Uni brutto ' + f4(A0.brutto.mittel) + ' Pp (t ' + f2(A0.brutto.t) + '), netto ' + f4(A0.netto.mittel) + ' Pp (t ' + f2(A0.netto.t)
    + '), Umschlag ' + (100 * A0.umschlagMittel).toFixed(1) + ' %, Kosten ' + f4(A0.kostenMittel) + ' Pp, Tote ' + A0.zaehler.tote + ', Verstoesse ' + L0.verstoesse + ' -> ' + v0Pfad);
  sichern();

  /* Regressionsprobe (T3-P12): mit klassen [2,3] muss die Teil-2-Zahl wiederkommen. */
  var L23 = PR.lauf(T, RF.momentum12_1, { freq: 'monat', empfindlichkeit: 'haupt', klassen: [2, 3] });
  var B23 = PR.bewerte(T, L23, { regime: regime });
  var n23 = PR.kennzahlen(B23.haupt.perioden, null, 21, 'netto').mittel;
  /* Erwartung je Panel-Kennung (K.REGRESSION23_ERWARTET): die Teil-2-Zahl des Kontrollenlaufs DESSELBEN Panels. */
  var erw23 = K.REGRESSION23_ERWARTET[T.stand.kennung];
  B.regression23 = { netto: n23, erwartet: erw23 == null ? null : erw23, panel: T.stand.kennung, abweichung: erw23 == null ? null : Math.abs(n23 - erw23), bestanden: erw23 != null && Math.abs(n23 - erw23) <= 1e-9 };
  if (!B.regression23.bestanden) B.befunde.push('REGRESSION: klassen [2,3] liefert ' + n23 + ' statt ' + (erw23 == null ? 'UNBEKANNT (keine Erwartung fuer ' + T.stand.kennung + ')' : erw23));
  sag('Regression [2,3]: netto ' + f4(n23) + ' Pp (Teil 2 fuer ' + T.stand.kennung + ': ' + (erw23 == null ? '-' : f4(erw23)) + ') => ' + (B.regression23.bestanden ? 'identisch' : 'ABWEICHUNG'));
  sichern();

  /* Klassenmix und Mitglieder je Periode (§T3.2) */
  B.perioden = L0.perioden.map(function (p) {
    var uniZ = klassenZaehler(T, p.uni.mitglieder, p.t), dezZ = klassenZaehler(T, p.long.mitglieder, p.t);
    return { monat: T.kal.tage[p.a].slice(0, 7), signaltag: T.kal.tage[p.t], ausfuehrungstag: T.kal.tage[p.a], periodenende: T.kal.tage[p.aEnde],
      k: p.k, nUni: p.nUni, N: p.long.N, klassenUni: uniZ, klassenDezil: dezZ,
      mitglieder: p.long.mitglieder.map(function (s) { var zl = T.zeileVon(s, p.t); return { kuerzel: T.symName[s], klasse: zl >= 0 ? T.g.klasse[zl] : null }; }) };
  });
  var mix = { universum: { 1: 0, 2: 0, 3: 0, andere: 0 }, dezil: { 1: 0, 2: 0, 3: 0, andere: 0 }, n: B.perioden.length };
  B.perioden.forEach(function (p) { [1, 2, 3, 'andere'].forEach(function (k2) { mix.universum[k2] += p.klassenUni[k2] / B.perioden.length; mix.dezil[k2] += p.klassenDezil[k2] / B.perioden.length; }); });
  mix.universumMittel = A0.universumMittel; mix.dezilMittel = A0.dezilMittel;
  mix.spyImDezil = B.perioden.some(function (p) { return p.mitglieder.some(function (m) { return m.kuerzel === 'SPY'; }); });
  mix.fremdeKlasse = mix.universum.andere > 0 || mix.dezil.andere > 0;
  B.klassenmix = mix;
  sag('Klassenmix Universum 50-250/250-1000/ab1000: ' + mix.universum[1].toFixed(0) + '/' + mix.universum[2].toFixed(0) + '/' + mix.universum[3].toFixed(0)
    + ' | Dezil ' + mix.dezil[1].toFixed(1) + '/' + mix.dezil[2].toFixed(1) + '/' + mix.dezil[3].toFixed(1) + (mix.fremdeKlasse ? ' FREMDE KLASSE!' : ''));

  /* ---------- (2) Die vier Varianten als Ueberlagerung ---------- */
  var R = {};
  R.v0 = VA.fahre(T, L0, { variante: 'v0', regime: regime });
  /* Identitaet mit der Maschine (T3-P1) */
  var mt = B0.tagesreihen.long, mIdx = {}; mt.forEach(function (x) { mIdx[x.tag] = x; });
  var idn = { tage: mt.length, tageUeberlagerung: R.v0.tage.length, maxAbwBrutto: 0, maxAbwNetto: 0, maxAbwKosten: 0, maxAbwPeriodeBrutto: 0, maxAbwPeriodeKosten: 0, fehlendeTage: 0 };
  R.v0.tage.forEach(function (x) {
    var m = mIdx[x.tag]; if (!m) { idn.fehlendeTage++; return; }
    idn.maxAbwBrutto = Math.max(idn.maxAbwBrutto, Math.abs(x.brutto - m.brutto));
    idn.maxAbwNetto = Math.max(idn.maxAbwNetto, Math.abs(x.netto - m.netto));
    idn.maxAbwKosten = Math.max(idn.maxAbwKosten, Math.abs(x.kosten - m.kosten));
  });
  L0.perioden.forEach(function (p, j) {
    idn.maxAbwPeriodeBrutto = Math.max(idn.maxAbwPeriodeBrutto, Math.abs(p.long.periode - R.v0.perioden[j].brutto));
    idn.maxAbwPeriodeKosten = Math.max(idn.maxAbwPeriodeKosten, Math.abs(p.kosten.long.kosten - R.v0.perioden[j].kosten));
  });
  idn.bestanden = idn.tage === idn.tageUeberlagerung && idn.fehlendeTage === 0 && idn.maxAbwBrutto <= 1e-9 && idn.maxAbwNetto <= 1e-9 && idn.maxAbwKosten <= 1e-12 && idn.maxAbwPeriodeBrutto <= 1e-9 && idn.maxAbwPeriodeKosten <= 1e-12;
  B.identitaet = idn;
  if (!idn.bestanden) B.befunde.push('V0-UEBERLAGERUNG WEICHT VON DER MASCHINE AB: ' + JSON.stringify(idn));
  sag('V0 Ueberlagerung = Maschine: Tage ' + idn.tage + '/' + idn.tageUeberlagerung + ', max |Abw| brutto ' + idn.maxAbwBrutto.toExponential(1) + ', netto ' + idn.maxAbwNetto.toExponential(1) + ' => ' + (idn.bestanden ? 'identisch' : 'ABWEICHUNG'));

  R.v1 = VA.fahre(T, L0, { variante: 'v1', regime: regime });
  R.v2 = VA.fahre(T, L0, { variante: 'v2', regime: regime, v0Tage: R.v0.tage });
  R.v3 = VA.fahre(T, L0, { variante: 'v3', regime: regime, v0Tage: R.v0.tage });
  var P1 = VA.fahre(T, L0, { variante: 'v1', regime: regime, leckRegime: true });
  var P2 = VA.fahre(T, L0, { variante: 'v2', regime: regime, v0Tage: R.v0.tage, leckVol: true });
  B.leckUeberlagerung = { sauber: { v1: R.v1.verstoesse, v2: R.v2.verstoesse, v3: R.v3.verstoesse },
    v1praepariert: { verstoesse: P1.verstoesse, ungueltig: P1.ungueltig, beispiele: P1.beispiele },
    v2praepariert: { verstoesse: P2.verstoesse, ungueltig: P2.ungueltig, beispiele: P2.beispiele } };
  B.leckUeberlagerung.bestanden = R.v1.verstoesse === 0 && R.v2.verstoesse === 0 && R.v3.verstoesse === 0
    && P1.verstoesse > 0 && P1.ungueltig && P2.verstoesse > 0 && P2.ungueltig;
  if (!B.leckUeberlagerung.bestanden) B.befunde.push('SPERRKLINKE DER UEBERLAGERUNG GEFALLEN: ' + JSON.stringify(B.leckUeberlagerung.sauber) + ' / praepariert ' + P1.verstoesse + ', ' + P2.verstoesse);
  sag('Klinke Ueberlagerung: sauber ' + R.v1.verstoesse + '/' + R.v2.verstoesse + '/' + R.v3.verstoesse + ', praepariert V1 ' + P1.verstoesse + ', V2 ' + P2.verstoesse + ' => ' + (B.leckUeberlagerung.bestanden ? 'bestanden' : 'GEFALLEN'));
  sichern();

  var UNI = VA.reiheAusMaschine(T, L0, 'uni');
  var SPY = VA.spyReihe(T, L0);

  /* ---------- (3) Kennzahlen ---------- */
  var KZ = {};
  ['v0', 'v1', 'v2', 'v3'].forEach(function (v) { KZ[v] = kennzahlen(T, R[v], UNI, SPY); });
  var KZuni = kennzahlen(T, UNI, null, SPY), KZspy = kennzahlen(T, SPY, null, null);
  B.varianten = {};
  ['v0', 'v1', 'v2', 'v3'].forEach(function (v) {
    var Rv = R[v];
    B.varianten[v] = { name: Rv.name, kennzahlen: KZ[v], verstoesse: Rv.verstoesse, ungueltig: Rv.ungueltig, anlauf: Rv.anlauf, fehlwert: Rv.fehlwert,
      regimeFehlt: Rv.regimeFehlt, unteilbar: Rv.unteilbar, grenztagAbweichungMax: Rv.grenztagAbweichungMax,
      schaltungen: Rv.schaltungen.map(function (s) { return { monat: s.monat, entscheidTag: T.kal.tage[s.entscheidTag], wirkTag: T.kal.tage[s.wirkTag], von: s.von, nach: s.nach, regime: s.regime, umschlag: s.umschlag, kosten: s.kosten }; }),
      monate: Rv.perioden.map(function (p) { return { monat: p.monat, signaltag: T.kal.tage[p.t], ausfuehrungstag: T.kal.tage[p.a], brutto: p.brutto, netto: p.netto,
        kosten: p.kostenGesamt, umschlag: p.umschlagGesamt, einsatz: p.einsatz, einsatzEnde: p.einsatzEnde, regimeSPY: p.regimeSPY, sigma: p.sigma, bremseE: p.bremseE, anlauf: p.anlauf, schaltungen: p.schaltungen, zeitImMarkt: p.zeitImMarkt }; }) };
    sag(Rv.name + ': netto ' + f4(KZ[v].netto.mittel) + ' Pp/Monat, gegen Uni ' + f4(KZ[v].gegenUni.netto.mittel) + ' (t ' + f2(KZ[v].gegenUni.netto.t) + '), gegen SPY ' + f4(KZ[v].gegenSPY.netto.mittel) + ' (t ' + f2(KZ[v].gegenSPY.netto.t)
      + '), MDD ' + f2(KZ[v].mdd.mdd) + ' %, Zeit im Markt ' + f2(100 * KZ[v].zeitImMarkt.mittel) + ' %, Umschlag ' + f2(100 * KZ[v].umschlagMittel) + ' %, Kosten ' + f4(KZ[v].kostenMittel) + ', Schaltungen ' + Rv.schaltungen.length + ', Verstoesse ' + Rv.verstoesse);
  });
  B.benchmarks = { uni: { name: UNI.name, kennzahlen: KZuni, monate: UNI.perioden.map(function (p) { return { monat: p.monat, brutto: p.brutto, netto: p.netto, kosten: p.kostenGesamt, umschlag: p.umschlagGesamt }; }) },
    spy: { name: SPY.name, kennzahlen: KZspy, monate: SPY.perioden.map(function (p) { return { monat: p.monat, brutto: p.brutto, netto: p.netto }; }) } };
  sag('Universum: netto ' + f4(KZuni.netto.mittel) + ' Pp/Monat, MDD ' + f2(KZuni.mdd.mdd) + ' % | SPY: netto ' + f4(KZspy.netto.mittel) + ' Pp/Monat, MDD ' + f2(KZspy.mdd.mdd) + ' %');

  /* ---------- (4) Gepaarte Vergleiche ---------- */
  B.paare = {};
  ['v1', 'v2', 'v3'].forEach(function (v) {
    B.paare[v] = paar(R[v], R.v0, KZ[v], KZ.v0);
    var p = B.paare[v];
    sag('Paar ' + v + ' - v0: Delta ' + f4(p.monatsdifferenz.mittel) + ' Pp/Monat (se ' + f4(p.monatsdifferenz.se) + ', t ' + f2(p.monatsdifferenz.t) + ', HH t ' + f2(p.tagesdifferenz ? p.tagesdifferenz.t : null)
      + ', MDE80 ' + f4(p.monatsdifferenz.mde) + '), dMDD ' + f2(p.deltaMdd) + ' Pp => ' + (p.bestanden ? 'BESTANDEN' : 'nicht bestanden'));
  });
  sichern();

  /* ---------- (5) Kontrollen: Orakel und Zufall, monatlich, erweitertes Universum (§T3.6) ---------- */
  var oT = KO.fahre(T, RF.orakelTag, { freq: 'monat', orakel: true, empfindlichkeit: 'haupt', regime: regime, klassen: KL });
  var oP = KO.fahre(T, RF.orakelPeriode, { freq: 'monat', orakel: true, empfindlichkeit: 'haupt', regime: regime, klassen: KL });
  [oT, oP].forEach(function (r) { delete r.perioden_reihe; r.mittelDurchSd = r.brutto.sd > 0 ? r.brutto.mittel / r.brutto.sd : null; });
  var tor = [];
  if (!(oT.brutto.mittel >= K.ORAKEL_MIN_PP)) tor.push('orakelTag brutto ' + f4(oT.brutto.mittel) + ' < ' + K.ORAKEL_MIN_PP);
  if (!(oT.netto.mittel >= K.ORAKEL_MIN_PP)) tor.push('orakelTag netto ' + f4(oT.netto.mittel) + ' < ' + K.ORAKEL_MIN_PP);
  if (!(oP.brutto.mittel >= K.ORAKEL_PERIODE_MONAT_MIN_PP)) tor.push('orakelPeriode brutto ' + f4(oP.brutto.mittel) + ' < ' + K.ORAKEL_PERIODE_MONAT_MIN_PP);
  if (!(oP.mittelDurchSd >= K.ORAKEL_MIN_SD)) tor.push('orakelPeriode Mittel/sd ' + f2(oP.mittelDurchSd) + ' < ' + K.ORAKEL_MIN_SD);
  if (!(oP.brutto.t >= K.ORAKEL_T_BODEN)) tor.push('orakelPeriode t ' + f2(oP.brutto.t) + ' < ' + K.ORAKEL_T_BODEN);
  B.kontrollen = { orakel: { orakelTag: oT, orakelPeriode: oP, tor: tor, bestanden: tor.length === 0,
    nachrichtlich: { orakelTagMittelDurchSd: oT.mittelDurchSd, orakelTagT: oT.brutto.t } } };
  if (tor.length) B.befunde.push('ORAKEL GEFALLEN: ' + tor.join(' | '));
  sag('Orakel Tag: brutto ' + f4(oT.brutto.mittel) + ' (t ' + f2(oT.brutto.t) + ', Mittel/sd ' + f2(oT.mittelDurchSd) + ' nachrichtlich), netto ' + f4(oT.netto.mittel)
    + ' | Periode: brutto ' + f4(oP.brutto.mittel) + ' (t ' + f2(oP.brutto.t) + ', Mittel/sd ' + f2(oP.mittelDurchSd) + ') => ' + (tor.length ? 'GEFALLEN' : 'bestanden'));
  sichern();

  var einzeln = [], mB = 0, mN = 0, fehler = 0, schr = K.ZUFALL_SCHRANKE.monat;
  for (var z = 0; z < K.ZUFALL_ZIEHUNGEN; z++) {
    var rz = KO.fahre(T, RF.zufallFabrik(K.ZUFALL_SAAT + '#' + z), { freq: 'monat', empfindlichkeit: 'haupt', regime: regime, klassen: KL });
    var tOk = !(Math.abs(rz.brutto.t) >= K.ZUFALL_T_EINZELN);
    if (!tOk) fehler++;
    einzeln.push({ ziehung: z, n: rz.perioden, brutto: rz.brutto.mittel, se: rz.brutto.se, t: rz.brutto.t, netto: rz.netto.mittel, kosten: rz.kostenMittel, umschlag: rz.umschlagMittel, tOk: tOk, verstoesse: rz.verstoesse, universum: rz.universumMittel });
    mB += rz.brutto.mittel; mN += rz.netto.mittel + rz.kostenMittel;
  }
  mB /= K.ZUFALL_ZIEHUNGEN; mN /= K.ZUFALL_ZIEHUNGEN;
  var seE = einzeln.reduce(function (s2, x) { return s2 + x.se; }, 0) / einzeln.length;
  var zBest = Math.abs(mB) < schr && Math.abs(mN) < schr && fehler <= K.ZUFALL_MAX_FEHLER;
  B.kontrollen.zufall = { einzeln: einzeln, mittelBrutto: mB, mittelNettoPlusKosten: mN, schranke: schr, seEinzelnMittel: seE,
    seDesMittels: seE / Math.sqrt(K.ZUFALL_ZIEHUNGEN), schrankeInSeDesMittels: schr / (seE / Math.sqrt(K.ZUFALL_ZIEHUNGEN)), fehlerEinzelnT: fehler, maxFehler: K.ZUFALL_MAX_FEHLER, bestanden: zBest };
  if (!zBest) B.befunde.push('ZUFALL GEFALLEN: Mittel brutto ' + f4(mB) + ', netto+Kosten ' + f4(mN) + ', Schranke ' + schr + ', |t|>=3 in ' + fehler);
  sag('Zufall (12): Mittel brutto ' + f4(mB) + ' Pp, netto+Kosten ' + f4(mN) + ' Pp (Schranke ' + schr + ' = ' + f2(schr / (seE / Math.sqrt(12))) + ' se), |t|>=3 in ' + fehler + ' => ' + (zBest ? 'bestanden' : 'GEFALLEN'));
  sichern();

  /* ---------- (6) Vorpruefung gegen Messung, Urteil ---------- */
  B.vorpruefung = { erwartet: K.VORPRUEFUNG_TEIL3, gemessen: { umschlagV0: KZ.v0.umschlagMittel, kostenV0: KZ.v0.kostenMittel,
    seV0Uni: KZ.v0.gegenUni.netto.se, mdeV0Uni: KZ.v0.gegenUni.netto.mde, paarSe: { v1: B.paare.v1.monatsdifferenz.se, v2: B.paare.v2.monatsdifferenz.se, v3: B.paare.v3.monatsdifferenz.se } } };
  B.vorpruefung.seFaktor = { v1: B.paare.v1.monatsdifferenz.se / K.VORPRUEFUNG_TEIL3.paarSe.v1, v2: B.paare.v2.monatsdifferenz.se / K.VORPRUEFUNG_TEIL3.paarSe.v2, v3: B.paare.v3.monatsdifferenz.se / K.VORPRUEFUNG_TEIL3.paarSe.v3 };
  var toreMaschine = B.leck.bestanden && B.leckUeberlagerung.bestanden && B.kontrollen.orakel.bestanden && B.kontrollen.zufall.bestanden && B.identitaet.bestanden && B.regression23.bestanden && !R.v0.ungueltig;
  var bestandene = ['v1', 'v2', 'v3'].filter(function (v) { return B.paare[v].bestanden; });
  bestandene.sort(function (p, q) { return KZ[p].mdd.mdd - KZ[q].mdd.mdd; });
  B.urteil = { toreMaschine: toreMaschine, bestanden: { v1: B.paare.v1.bestanden, v2: B.paare.v2.bestanden, v3: B.paare.v3.bestanden },
    absicherungTraegt: bestandene.length > 0, gewaehlt: bestandene.length ? bestandene[0] : 'v0',
    grund: bestandene.length ? (bestandene.length + ' Variante(n) bestanden, kleinster MDD: ' + bestandene[0]) : 'keine Variante besteht den gepaarten Vergleich - V0 wird geschrieben, die Absicherung traegt nicht',
    aussen: null, zielportfolioGeschrieben: false };
  B.sekunden = (Date.now() - t0) / 1000;
  sichern();
  schreibe(a.ergebnis, B);
  schreibe(path.join(ziel, 'teil3-tage.json'), { kennung: K.KONFIG_KENNUNG_TEIL3, stand: B.stand,
    tage: { v0: R.v0.tage, v1: R.v1.tage, v2: R.v2.tage, v3: R.v3.tage, uni: UNI.tage, spy: SPY.tage },
    tagesdatum: T.kal.tage.slice(0, T.maxTag + 1) });
  sag('\nUrteil: Tore Maschine ' + (toreMaschine ? 'halten' : 'GEFALLEN') + '; bestanden ' + JSON.stringify(B.urteil.bestanden) + '; gewaehlt ' + B.urteil.gewaehlt);
  sag(B.befunde.length ? 'BEFUNDE:\n- ' + B.befunde.join('\n- ') : 'keine Befunde im Laeufer');
  sag('Ergebnis: ' + a.ergebnis + ' (' + B.sekunden.toFixed(0) + ' s); Tagesreihen: ' + path.join(ziel, 'teil3-tage.json'));
}

/* =========================================================================================
 * Ausgabe: Zielportfolio (§T3.10) - erst nach dem Aussen-Pruefstein
 * ========================================================================================= */
function zielportfolio(a) {
  var E = JSON.parse(fs.readFileSync(a.ergebnis, 'utf8'));
  if (!a.aussen || !fs.existsSync(a.aussen)) { sag('--aussen <aussen-pruefstein-teil3.json> fehlt'); process.exit(2); }
  var AU = JSON.parse(fs.readFileSync(a.aussen, 'utf8'));
  E.urteil.aussen = { rho: AU.haupt.rho, urteil: AU.urteil, feld: AU.unserFeld, n: AU.haupt.n, besterVersatz: AU.besterVersatz, befunde: AU.befunde };
  var aussenOk = AU.urteil !== 'GEFALLEN' && AU.urteil !== 'nicht rechenbar';
  if (AU.urteil === 'teilweise') E.befunde.push('AUSSEN-PRUEFSTEIN nur TEILWEISE (rho ' + AU.haupt.rho.toFixed(3) + ' < 0,5): das erweiterte Universum hat den Gleichlauf veraendert - gemeldet, nicht repariert');
  if (AU.urteil === 'GEFALLEN') E.befunde.push('AUSSEN-PRUEFSTEIN GEFALLEN (rho ' + AU.haupt.rho.toFixed(3) + ' < 0,2): kein Zielportfolio');
  var v = E.urteil.gewaehlt;
  if (!E.urteil.toreMaschine || !aussenOk) {
    E.urteil.zielportfolioGeschrieben = false;
    E.zielportfolio = { variante: null, grund: !E.urteil.toreMaschine ? 'Tore der Maschine gefallen' : 'Aussen-Pruefstein gefallen', dateien: 0 };
    schreibe(a.ergebnis, E);
    sag('KEIN Zielportfolio: ' + E.zielportfolio.grund);
    return;
  }
  var ordner = path.join(K.HIER, 'zielportfolio', 'momentum-' + v);
  fs.mkdirSync(ordner, { recursive: true });
  fs.readdirSync(ordner).forEach(function (f) { if (/\.json$/.test(f)) fs.unlinkSync(path.join(ordner, f)); });
  var V = E.varianten[v], n = 0;
  var hinweis = 'Simulationsausgabe des Querschnitts-Pruefstands Teil 3 (' + E.kennung + '), Variante ' + V.name + '. Keine Anlageempfehlung.';
  E.perioden.forEach(function (p, j) {
    var m = V.monate[j];
    if (!m || m.monat !== p.monat) throw new Error('Perioden und Variantenmonate laufen auseinander bei ' + p.monat);
    var e = m.einsatz;
    var datei = { variante: v, anlass: 'umschichtung', datum: p.ausfuehrungstag, signaltag: p.signaltag, monat: p.monat, einsatzquote: e,
      regime: m.regimeSPY == null ? null : (m.regimeSPY ? 'ueber' : 'unter'), volatilitaet60: m.sigma, bremseEinsatz: m.bremseE,
      n: p.N, universum: p.nUni, positionen: p.mitglieder.map(function (x) { return { kuerzel: x.kuerzel, gewicht: e / p.N, klasse: x.klasse == null ? null : K.KLASSEN[x.klasse].name }; }), hinweis: hinweis };
    schreibe(path.join(ordner, p.ausfuehrungstag + '.json'), datei); n++;
  });
  V.schaltungen.forEach(function (s) {
    var p = E.perioden.filter(function (q) { return q.monat === s.monat; })[0];
    if (!p) throw new Error('Schaltung ohne Periode ' + s.monat);
    var e = s.nach;
    var datei = { variante: v, anlass: 'regimewechsel', datum: s.wirkTag, signaltag: s.entscheidTag, monat: s.monat, einsatzquote: e,
      regime: s.regime ? 'ueber' : 'unter', volatilitaet60: null, n: p.N, universum: p.nUni,
      positionen: p.mitglieder.map(function (x) { return { kuerzel: x.kuerzel, gewicht: e / p.N, klasse: x.klasse == null ? null : K.KLASSEN[x.klasse].name }; }), hinweis: hinweis };
    schreibe(path.join(ordner, s.wirkTag + '.json'), datei); n++;
  });
  E.urteil.zielportfolioGeschrieben = true;
  E.zielportfolio = { variante: v, ordner: path.relative(K.HIER, ordner).replace(/\\/g, '/'), dateien: n, umschichtungen: E.perioden.length, regimewechsel: V.schaltungen.length };
  schreibe(a.ergebnis, E);
  sag('Zielportfolio ' + v + ': ' + n + ' Dateien nach ' + ordner + ' (Aussen ' + AU.urteil + ', rho ' + AU.haupt.rho.toFixed(3) + ')');
}

if (require.main === module) {
  var a = args(process.argv.slice(2));
  if (a.nur && a.nur.indexOf('zielportfolio') !== -1) zielportfolio(a);
  else { if (!a.aus) { process.stderr.write('--aus <ordner> fehlt\n'); process.exit(2); } messung(a); }
}
module.exports = { kennzahlen: kennzahlen, paar: paar, klassenZaehler: klassenZaehler };
