'use strict';
/* ZELLE - die gemeinsame Maschine der Mehrfaktor-Studie (Auftrag Nr. 48, 22.09.2026; wiki/mehrfaktor-felder.md §3, §4).
 *
 * Duenne Schicht ueber dem Querschnitts-Pruefstand (studien/querschnitt-pruefstand-2026-09-13). BENUTZT werden: Panel v2.1
 * (Tafel), universum (punkt-in-Zeit), Sicht (Leck-Sperrklinke), halte (Haltefunktion), umschlagKosten (Kassa-Huerde je Klasse
 * x Umschlag), bewerte/kennzahlen (Perioden naiv = Hansen-Hodrick bei Lag 1, Tagesreihe mit HH-Lag 21), orakelPeriode und
 * zufallFabrik (Kontrollen), momente/fnv/mulberry32 (Statistik, Zufall), fundamental-lesen.js (Bilanz mit Klinke).
 * NEU sind nur: Signaltage (erster Handelstag je Kalendermonat), Rang mit Gleichstandsmittel und Auffuellung fehlender Werte,
 * Dezile ueber den Rangwert, die Nullpunkt-Kontrollen je Feld (Orakel, Placebo Versatz, Placebo Symbole, Zufall, Klinke),
 * das Zellenformat, der Bericht und die Kombination.
 *
 * Haltefenster: Eroeffnung des Ausfuehrungstags a (naechster Handelstag nach dem Signaltag t) bis Eroeffnung des Ausfuehrungstags
 * des naechsten Signaltags - das ist die Konvention der Haltefunktion `halte` und der Universumsregel (Punkt 6: Eroeffnungskurs
 * am Ausfuehrungstag). Der Auftrag nennt "Einstieg zum Schluss des Signaltags"; `halte` kann Schluss->Schluss nicht, und eine
 * zweite Haltefunktion waere eine zweite Maschine. Das Orakel (orakelPeriode) und die Kosten (umschlagKosten) meinen genau
 * dieses Fenster. Offen fuer die Vorregistrierung, siehe Uebergabe.
 *
 * Rang (Auftrag §1a.1): je Signaltag ueber das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang (scipy
 * rankdata average). Fehlende Werte (null) bekommen exakt den mittleren Rang (n+1)/2; die m vorhandenen Werte werden von der
 * Skala 1..m auf 1..n gestreckt: R = (r - 1/2) * n/m + 1/2 (bei voller Abdeckung identisch mit r; Rangsumme n(n+1)/2 bleibt).
 * Dezil oben = Rang > 0,9 n, Dezil unten = Rang <= 0,1 n - ueber den Rangwert, nicht die Position. Ein konstantes Feld hat
 * lauter mittlere Raenge und leere Dezile.
 *
 * Beispielaufruf (Feld-Agent; die Werte-Funktion liest NUR ueber `sicht`):
 *
 *   var Z = require('./zelle.js');
 *   var r = Z.zelleBauen('momentum', function (sym, tag, sicht) {
 *     var z = sicht.zeileAm(sym); if (z < 0) return null;                 // Panelzeile des Symbols am Signaltag
 *     var g = sicht.felder, zA = sicht.zurueck(z, 21), zB = sicht.zurueck(z, 252);
 *     return (zA >= 0 && zB >= 0 && g.bSchluss[zB] > 0) ? 100 * (g.bSchluss[zA] / g.bSchluss[zB] - 1) : null;
 *   }, { definition: 'Schluss(21 Zeilen vor t) / Schluss(252 Zeilen vor t) - 1 in Pp', quellen: ['Panel v2.1'] });
 *   // r = { zelle, bericht, nullpunkt, verstoesse, dateien }; Dateien unter zellen/<feld>.json, -nullpunkt.json, -bericht.md
 *   // Bilanz: sicht.fundamentalAm(sym, tag) -> Tafelzeile (roh, quartale, summe4q, abgeleitet) oder null, nie ohne Klinke.
 *   // Wirft Error('Leck: ...'), sobald die Klinke einen Zugriff nach dem Signaltag zaehlt (Kurs oder Bilanz).
 *
 * NUR LESEN. Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
var fs = require('fs');
var path = require('path');
var PS = path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13');
var K = require(path.join(PS, 'konfig.js'));
var PR = require(path.join(PS, 'pruefstand.js'));
var RF = require(path.join(PS, 'rangfunktionen.js'));
var ST = require(path.join(PS, 'statistik.js'));
var KO = require(path.join(PS, 'kontrollen.js'));

var MONAT = K.FREQUENZEN.filter(function (f) { return f.key === 'monat'; })[0];
/* Alles, was diese Studie als Zahl festlegt, steht hier genau einmal; Schranken kommen aus konfig.js des Pruefstands. */
var KONST = {
  KENNUNG: 'mehrfaktor-2026-09-22/zelle/v1',
  KENNUNG_NULLPUNKT: 'mehrfaktor-2026-09-22/nullpunkt/v1',
  KENNUNG_KOMBINATION: 'mehrfaktor-2026-09-22/kombination/v1',
  KENNUNG_REGRESSION: 'mehrfaktor-2026-09-22/regression/v1',
  PANEL: path.join(PS, 'voll'),                              // das echte Panel v2.1 (liegt auf C:)
  ZELLEN: path.join(__dirname, 'zellen'),
  SIGNAL_VON: '2017-01-01', SIGNAL_BIS: '2026-08-31',        // Signaltage 2017-01 .. 2026-08 (Auftrag §1.1)
  RUECKHALTE_AB: '2024-09-01',                               // ohne opt.rueckhalte === true kein Signaltag ab hier (§1a.6)
  KLASSEN: K.UNIVERSUM_KLASSEN_TEIL3.slice(),                // [1, 2, 3] = 50-250 / 250-1000 / ab1000
  MIN_VORTAGE: K.MIN_VORTAGE,                                // 250, wie der Pruefstand (universum)
  MIN_UNIVERSUM: K.MIN_UNIVERSUM,                            // 100: kleinere Signaltage zaehlen nicht
  LAG: MONAT.lag,                                            // 21: HH-Lag der Tagesreihe (K.FREQUENZEN monat)
  PLACEBO_VERSATZ_TAGE: 21,                                  // Placebo 1: Werte von t + 21 Handelstagen (§1.4, §1a.3)
  DEZIL: K.DEZIL,                                            // 10: Dezil oben = Rang > (1 - 1/10) n, unten = Rang <= n/10
  EMPFINDLICHKEIT: 'haupt',                                  // Tote: Insolvenz + Zwangs-Delisting = Totalverlust (§3.6 Teil 1)
  MDE_FAKTOR: K.MDE_FAKTOR,                                  // 2,8016 x se
  AKTUELL_TAGE: K.AKTUELL_TAGE,                              // letzte 250 Tage, gerechnet ab dem letzten geladenen Signaltag
  FUNDAMENT_MAX_ALTER_TAGE: K.TEIL4_FUNDAMENT_MAX_ALTER_TAGE, // 456: Aktualitaets-Tor des Lesers
  ZUFALL: { saat: 'mehrfaktor-2026-09-22', ziehungen: K.ZUFALL_ZIEHUNGEN, schrankePp: K.ZUFALL_SCHRANKE.monat,
    tEinzeln: K.ZUFALL_T_EINZELN, maxFehler: K.ZUFALL_MAX_FEHLER },
  /* Orakel-Schranke, alles aus konfig.js des Pruefstands (Auftrag §1a.2: wiederverwenden, nicht neu setzen):
   * - Dezil oben minus Universum >= K.ORAKEL_PERIODE_MONAT_MIN_PP (5 Pp): die horizontgleiche Schranke des Pruefstands fuer
   *   orakelPeriode/monat (Teil 3 §T3.6); Mittel/sd >= K.ORAKEL_MIN_SD (1), t >= K.ORAKEL_T_BODEN (8) - identisch mit Teil 4.
   * - Long minus Short >= K.TEIL4_ORAKEL.minPp (20 Pp): die Teil-4-Schranke ist ein ZWEISEITIGES Delta (Gewinner minus
   *   Verlierer); ihr Gegenstueck hier ist Long-Short, nicht Dezil-Universum.
   * Gemessen am ersten Kunstfeld-Lauf (22.09.): Dezil-Universum 18,6 Pp, t 29, Mittel/sd 3,05 - die 20 Pp EINSEITIG auf
   * einen Monat uebertragen faellt bei einwandfreier Maschine (Fehlerform "Absolute Schranke aus einer anderen Skala
   * uebernommen", 09.09.). Der einseitige Teil-4-Wert wird nachrichtlich ausgewiesen; Entscheid des PM siehe Uebergabe. */
  ORAKEL: { minPp: K.ORAKEL_PERIODE_MONAT_MIN_PP, minSd: K.ORAKEL_MIN_SD, tBoden: K.ORAKEL_T_BODEN,
    longShortMinPp: K.TEIL4_ORAKEL.minPp, teil4EinseitigPp: K.TEIL4_ORAKEL.minPp },
  PLACEBO: { tEinzeln: K.ZUFALL_T_EINZELN, schrankePp: K.ZUFALL_SCHRANKE.monat },
  FELDNAME: /^[a-z0-9][a-z0-9-]*$/,
};
var TOTALVERLUST = {}; K.EMPFINDLICHKEIT.filter(function (e) { return e.key === KONST.EMPFINDLICHKEIT; })[0].totalverlust.forEach(function (g) { TOTALVERLUST[g] = true; });

function sag(o, s) { if (!(o && o.leise)) process.stdout.write(s + '\n'); }
function f4(x) { return x == null || !(x === x) ? '-' : x.toFixed(4); }
function f2(x) { return x == null || !(x === x) ? '-' : x.toFixed(2); }
function f1(x) { return x == null || !(x === x) ? '-' : x.toFixed(1); }
function pz(x) { return x == null || !(x === x) ? '-' : (100 * x).toFixed(1) + ' %'; }
function mittel(arr) { var s = 0, n = 0; arr.forEach(function (v) { if (v != null && v === v) { s += v; n++; } }); return n ? s / n : null; }
function schreibe(pfad, obj) { fs.writeFileSync(pfad + '.tmp', JSON.stringify(obj, null, 1)); fs.renameSync(pfad + '.tmp', pfad); }
function jetzt() { return new Date().toISOString(); }

/* =========================================================================================
 * 1. Tafel und Leser - je Prozess einmal
 * ========================================================================================= */
var TAFELN = {};
/** Die Kurs-Tafel des Pruefstands, mit SPY-Regime und einem Zwischenspeicher fuer Universum und Universumskorb je Signaltag. */
function tafel(aus) {
  aus = path.resolve(aus || KONST.PANEL);
  if (!TAFELN[aus]) {
    var t0 = Date.now(), T = PR.Tafel(aus);
    T.$aus = aus; T.$regime = PR.spyRegime(T); T.$cache = {}; T.$ladeSekunden = (Date.now() - t0) / 1000;
    TAFELN[aus] = T;
  }
  return TAFELN[aus];
}
var LESER = null;
/** Der Leser der Fundamentaltafel (mit Sperrklinke), je Prozess einmal geoeffnet; opt.leser ersetzt ihn (Pruefungen). */
function leser(opt) {
  if (opt && opt.leser) return opt.leser;
  if (!LESER) LESER = require(K.FUNDAMENTAL_LESER).oeffne(undefined, { maxAlterTage: KONST.FUNDAMENT_MAX_ALTER_TAGE });
  return LESER;
}

/* =========================================================================================
 * 2. Signaltage: erster Handelstag jedes Kalendermonats, Haltefenster bis zum naechsten
 * ========================================================================================= */
function naechsterPanelTag(T, t) { for (var tt = t + 1; tt <= T.maxTag; tt++) if (T.tagVon[tt] >= 0) return tt; return null; }
/** Der k-te Panel-Handelstag nach t; null, wenn die Tafel nicht reicht. */
function panelTagNach(T, t, k) { var tt = t; for (var c = 0; c < k; c++) { tt = naechsterPanelTag(T, tt); if (tt === null) return null; } return tt; }
/** Alle ersten Panel-Handelstage je Kalendermonat, aufsteigend (Kalenderindizes). */
function monatsanfaenge(T) {
  var aus = [], letzter = null;
  for (var t = 0; t <= T.maxTag; t++) {
    if (T.tagVon[t] < 0) continue;
    var m = T.kal.tage[t].slice(0, 7);
    if (m !== letzter) { aus.push(t); letzter = m; }
  }
  return aus;
}
/** Signaltage mit Haltefenster: t (Signaltag), tNext (naechster Monatsanfang), aEnde (Ausfuehrungstag danach = Periodenende).
 *  Ohne opt.rueckhalte === true endet die Liste vor RUECKHALTE_AB (Klinke, §1a.6). */
function signaltage(T, opt) {
  opt = opt || {};
  var von = opt.von || KONST.SIGNAL_VON, bis = opt.bis || KONST.SIGNAL_BIS, rueckhalte = opt.rueckhalte === true;
  var alle = monatsanfaenge(T), aus = [], unvollstaendig = 0, zurueckgehalten = 0;
  for (var i = 0; i < alle.length; i++) {
    var t = alle[i], iso = T.kal.tage[t];
    if (iso < von || iso > bis) continue;
    if (!rueckhalte && iso >= KONST.RUECKHALTE_AB) { zurueckgehalten++; continue; }
    var tN = alle[i + 1], aEnde = (tN === undefined) ? null : naechsterPanelTag(T, tN);
    if (aEnde === null) { unvollstaendig++; continue; }
    aus.push({ t: t, iso: iso, monat: iso.slice(0, 7), jahr: +iso.slice(0, 4), tNext: tN, aEnde: aEnde });
  }
  aus.unvollstaendig = unvollstaendig; aus.zurueckgehalten = zurueckgehalten; aus.rueckhalte = rueckhalte; aus.von = von; aus.bis = bis;
  return aus;
}
/** Universum und Universumskorb (halte ueber alle Mitglieder) je Signaltag - beides haengt nicht vom Feld ab, deshalb je Tafel
 *  zwischengespeichert (16 Messungen je Feld teilen sie sich). */
function universumAm(T, s, klassen) {
  var key = klassen.join(',') + '|' + s.t + '|' + s.aEnde, e = T.$cache[key];
  if (!e) {
    var U = PR.universum(T, s.t, { klassen: klassen });
    e = T.$cache[key] = { U: U, uni: halteKorb(T, U.liste, U.aTag, s.aEnde) };
  }
  return e;
}

/* =========================================================================================
 * 3. Die Sicht des Feldes: Pruefstand-Sicht plus Kuerzel-Helfer und der Bilanz-Leser mit eigener Klinke
 * ========================================================================================= */
/** o.schluessel: Orakelschluessel (nur Kontrollen und Kunstfelder); o.zeilenTag: Tag, an dem gelesen wird (Placebo Versatz). */
function sichtFuer(T, s, o) {
  o = o || {};
  var zt = (o.zeilenTag != null) ? o.zeilenTag : s.t;
  var sicht = PR.Sicht(T, zt, { orakel: !!o.schluessel });
  var fundVerstoesse = 0, fundZugriffe = 0, fundBeispiele = [];
  sicht.iso = T.kal.tage[zt];
  sicht.periode = { t: s.t, iso: s.iso, a: s.a, aEnde: s.aEnde };
  sicht.symIdx = function (name) { var i = T.symIdx[name]; return i === undefined ? -1 : i; };
  sicht.name = function (i) { return T.symName[i]; };
  sicht.zeileAm = function (name) { var i = T.symIdx[name]; return i === undefined ? -1 : sicht.zeile(i, zt); };
  /* Bilanz: juengstes Filing mit filed < tag (Leser wirft bei filed >= tag). Ein Tag NACH dem Signaltag der Sicht ist ein
   * Zukunftszugriff, den der Leser nicht sehen kann - die Maschine zaehlt ihn hier und liefert nichts. */
  sicht.fundamentalAm = function (name, tag) {
    tag = tag || sicht.iso;
    fundZugriffe++;
    if (tag > sicht.iso && !o.schluessel) { fundVerstoesse++; if (fundBeispiele.length < 5) fundBeispiele.push(name + ': fundamentalAm(' + tag + ') nach ' + sicht.iso); return null; }
    return leser(o).fundamentalAm(name, tag);
  };
  sicht.fundVerstoesse = function () { return fundVerstoesse; };
  sicht.fundZugriffe = function () { return fundZugriffe; };
  sicht.fundBeispiele = function () { return fundBeispiele; };
  return sicht;
}
/** Werte eines Feldes fuer alle Universumsmitglieder eines Signaltags; NaN = null. Prueft Typ und Klinke. */
function werteAm(T, s, fn, o) {
  o = o || {};
  var sicht = sichtFuer(T, s, o), U = s.U, aus = new Float64Array(U.liste.length), nNull = 0;
  for (var i = 0; i < U.liste.length; i++) {
    var name = T.symName[U.liste[i].sym], w = fn(name, sicht.iso, sicht);
    if (w === null) { aus[i] = NaN; nNull++; continue; }
    if (typeof w !== 'number' || !(w === w) || !isFinite(w)) throw new Error('Feld liefert fuer ' + name + ' am ' + sicht.iso + ' weder eine endliche Zahl noch null: ' + String(w));
    aus[i] = w;
  }
  var v = sicht.verstoesse() + sicht.fundVerstoesse();
  if (v > 0 && !o.schluessel) throw new Error('Leck: ' + v + ' Zukunftszugriff(e) am Signaltag ' + s.iso + ' - ' + sicht.beispiele().concat(sicht.fundBeispiele()).slice(0, 3).join('; '));
  return { werte: aus, nNull: nNull, zugriffe: sicht.fundZugriffe(), verstoesse: v };
}

/* =========================================================================================
 * 4. Rang, Dezile, Halten
 * ========================================================================================= */
/** Raenge ueber das Universum (Kopf der Datei). werte: Zahlen, NaN = fehlt. */
function raenge(werte) {
  var n = werte.length, idx = [], i;
  for (i = 0; i < n; i++) if (werte[i] === werte[i]) idx.push(i);
  var m = idx.length, rang = new Float64Array(n), fehlt = new Uint8Array(n), mitte = (n + 1) / 2;
  idx.sort(function (a, b) { return werte[a] - werte[b] || a - b; });
  var i0 = 0;
  while (i0 < m) {
    var i1 = i0; while (i1 + 1 < m && werte[idx[i1 + 1]] === werte[idx[i0]]) i1++;
    var r = (i0 + i1) / 2 + 1;                                              /* mittlerer Rang des Gleichstands, 1..m */
    for (var q = i0; q <= i1; q++) rang[idx[q]] = (r - 0.5) * n / m + 0.5; /* auf 1..n gestreckt; bei m = n exakt r */
    i0 = i1 + 1;
  }
  for (i = 0; i < n; i++) if (!(werte[i] === werte[i])) { rang[i] = mitte; fehlt[i] = 1; }
  return { rang: rang, fehlt: fehlt, n: n, mit: m };
}
/** Dezil oben: Rang > (D-1)/D n; unten: Rang <= n/D - ganzzahlig verglichen, damit die Grenze nicht am Gleitkomma haengt. */
function dezile(R) {
  var oben = [], unten = [], D = KONST.DEZIL, n = R.n;
  for (var i = 0; i < n; i++) { var x = D * R.rang[i]; if (x > (D - 1) * n) oben.push(i); else if (x <= n) unten.push(i); }
  return { oben: oben, unten: unten };
}
/** Korb halten mit der Haltefunktion des Pruefstands; ein leerer Korb ist leer, kein Absturz. */
function halteKorb(T, mitglieder, a, aEnde) {
  var zz = { tote: 0, toteTotalverlust: 0, luecken: 0 };
  if (!mitglieder.length) return { tage: [], N: 0, mitglieder: [], endGewichte: {}, periode: NaN, zaehler: zz };
  var h = PR.halte(T, mitglieder, a, aEnde, TOTALVERLUST, zz); h.zaehler = zz; return h;
}
function gewichte(mitglieder) { var w = {}; mitglieder.forEach(function (e) { w[e.sym] = 1 / mitglieder.length; }); return w; }

/* =========================================================================================
 * 5. Ein Lauf: Werte je Signaltag -> Raenge -> Dezile -> Perioden (Form des Pruefstand-Laufs) -> Bewertung
 * ========================================================================================= */
/** werteJeTag[i]: Float64Array ueber tage[i].U.liste (NaN = fehlt). Liefert das, was PR.bewerte erwartet.
 *  aufJeTag[i] (nur Kombination): je Mitglied die Zahl der aufgefuellten Felder - der Kombinationswert selbst hat keine Luecke
 *  mehr, die Auffuellung steckt in seinen Bestandteilen und wird von dort je Dezil gezaehlt. */
function lauf(T, tage, werteJeTag, aufJeTag) {
  var perioden = [], vorher = { long: {}, kurz: {}, uni: {} };
  var z = { perioden: 0, zuKlein: 0, tote: 0, toteTotalverlust: 0, luecken: 0, universumSumme: 0, mitWertSumme: 0,
    aufgefuellt: { oben: 0, unten: 0 }, verworfen: { klasse: 0, quelle: 0, cent: 0, vortage: 0, qualitaet: 0, ausfuehrung: 0 } };
  for (var i = 0; i < tage.length; i++) {
    var s = tage[i], U = s.U, n = U.liste.length;
    Object.keys(z.verworfen).forEach(function (k2) { z.verworfen[k2] += U.verworfen[k2] || 0; });
    if (n < KONST.MIN_UNIVERSUM) { z.zuKlein++; continue; }
    var R = raenge(werteJeTag[i]), D = dezile(R);
    var lang = D.oben.map(function (q) { return U.liste[q]; }), kurz = D.unten.map(function (q) { return U.liste[q]; });
    var pf = { long: halteKorb(T, lang, U.aTag, s.aEnde), kurz: halteKorb(T, kurz, U.aTag, s.aEnde), uni: s.uni };
    var kosten = {};
    ['long', 'kurz', 'uni'].forEach(function (key) {
      var mg = key === 'long' ? lang : key === 'kurz' ? kurz : U.liste;
      kosten[key] = PR.umschlagKosten(T, vorher[key], gewichte(mg), s.t);
      vorher[key] = pf[key].endGewichte;
    });
    var aufO = 0, aufU = 0, fehlt = aufJeTag ? aufJeTag[i] : R.fehlt;
    D.oben.forEach(function (q) { if (fehlt[q]) aufO++; }); D.unten.forEach(function (q) { if (fehlt[q]) aufU++; });
    perioden.push({ t: s.t, a: U.aTag, aEnde: s.aEnde, jahr: s.jahr, monat: s.monat, nUni: n, k: lang.length, kKurz: kurz.length,
      mitWert: R.mit, aufgefuellt: { oben: aufO, unten: aufU }, long: pf.long, kurz: pf.kurz, uni: pf.uni, kosten: kosten });
    z.perioden++; z.universumSumme += n; z.mitWertSumme += R.mit; z.aufgefuellt.oben += aufO; z.aufgefuellt.unten += aufU;
    z.tote += pf.long.zaehler.tote; z.toteTotalverlust += pf.long.zaehler.toteTotalverlust; z.luecken += pf.long.zaehler.luecken;
  }
  return { perioden: perioden, zaehler: z, freq: 'monat', empfindlichkeit: KONST.EMPFINDLICHKEIT, lag: KONST.LAG,
    verstoesse: 0, beispiele: [], ungueltig: false };
}
/** Bewertung mit dem Pruefstand (bewerte + auswerten aus kontrollen.js), dazu MDE80, "letzte 250 Tage" ab dem letzten
 *  geladenen Signaltag, Dezilgroessen und Auffuellungen. Hauptgroesse: Long-Dezil minus Universum je Monat. */
function auswertung(T, L, tage) {
  var B = PR.bewerte(T, L, { regime: T.$regime });
  var a = KO.auswerten(T, B);
  function mde(k) { k.mde80 = (k.se != null && k.se === k.se) ? KONST.MDE_FAKTOR * k.se : null; return k; }
  ['brutto', 'netto'].forEach(function (f) {
    mde(a[f]); a[f].tHH = a[f].tagT; a[f].seHH = a[f].se;                  /* Perioden ueberlappen nicht: HH bei Lag 1 = naiv */
    a.jahre[f].forEach(mde);
  });
  mde(a.longShortBrutto); mde(a.longShortNetto);
  var letzter = tage.length ? tage[tage.length - 1].t : 0, abTag = letzter - KONST.AKTUELL_TAGE;
  a.aktuell = {};
  ['brutto', 'netto'].forEach(function (f) {
    var p = B.haupt.perioden.filter(function (x) { return x.t >= abTag; }), k = PR.kennzahlen(p, null, KONST.LAG, f);
    a.aktuell[f] = mde({ abTag: T.kal.tage[Math.max(0, abTag)], n: k.n, mittel: k.mittel, se: k.se, t: k.t });
  });
  a.dezilUntenBrutto = PR.kennzahlen(B.kurz.perioden, null, KONST.LAG, 'brutto').mittel;
  a.dezilUntenNetto = PR.kennzahlen(B.kurz.perioden, null, KONST.LAG, 'netto').mittel;
  a.dezilUntenMittel = mittel(L.perioden.map(function (p) { return p.kKurz; }));
  a.mitWertMittel = mittel(L.perioden.map(function (p) { return p.mitWert; }));
  a.umschlagUniMittel = mittel(L.perioden.map(function (p) { return p.kosten.uni.umschlag; }));
  a.kostenUniMittel = mittel(L.perioden.map(function (p) { return p.kosten.uni.kosten; }));
  a.aufgefuellt = L.zaehler.aufgefuellt;
  a.perioden_reihe.forEach(function (e, i) { e.mitWert = L.perioden[i].mitWert; e.kKurz = L.perioden[i].kKurz; e.aufgefuellt = L.perioden[i].aufgefuellt; });
  return a;
}
/** Kurzform einer Messung fuer Zelle und Bericht (die volle liegt in der Nullpunkt-Datei bzw. einzelmessung). */
function kurz(a) {
  function k(x) { return { n: x.n, mittel: x.mittel, se: x.se, t: x.t, sd: x.sd, tHH: x.tagT, seHHTag: x.tagSeHH, mde80: x.mde80, marke: x.marke }; }
  return { perioden: a.perioden, universumMittel: a.universumMittel, dezilMittel: a.dezilMittel, mitWertMittel: a.mitWertMittel,
    dezilUni: { brutto: k(a.brutto), netto: k(a.netto) },
    longShort: { brutto: k(a.longShortBrutto), netto: k(a.longShortNetto) },
    dezilUnten: { brutto: a.dezilUntenBrutto, netto: a.dezilUntenNetto, dezilMittel: a.dezilUntenMittel },
    umschlag: { dezil: a.umschlagMittel, universum: a.umschlagUniMittel }, kosten: { dezil: a.kostenMittel, universum: a.kostenUniMittel },
    jahre: a.jahre, aktuell: a.aktuell, regime: a.regime, aufgefuellt: a.aufgefuellt, zaehler: a.zaehler };
}

/* =========================================================================================
 * 6. zelleBauen - Hauptlauf, Nullpunkt, Zelle, Bericht
 * ========================================================================================= */
/**
 * zelleBauen(feld, werte, opt) -> { zelle, bericht, nullpunkt, verstoesse, dateien }
 *   feld:  Dateiname der Zelle (a-z, 0-9, Bindestrich)
 *   werte: (sym, tag, sicht) => Zahl | null - liest NUR ueber sicht (Kurse) und sicht.fundamentalAm (Bilanz)
 *   opt:   { klassen?, von?, bis?, rueckhalte?: false, definition?, quellen?, ziel?, aus?, schreiben?: true, leise?,
 *            kunst?: 'zufall'|'orakel'|..., schluessel?: false (Orakelschluessel - NUR fuer Kunstfelder), leser? }
 * Wirft Error('Leck: ...') beim ersten Zukunftszugriff.
 */
function zelleBauen(feld, werte, opt) {
  opt = opt || {};
  if (typeof feld !== 'string' || !KONST.FELDNAME.test(feld)) throw new Error('Feldname ungueltig: ' + feld);
  if (typeof werte !== 'function') throw new Error('werte muss eine Funktion (sym, tag, sicht) sein');
  var t0 = Date.now(), T = tafel(opt.aus), klassen = (opt.klassen || KONST.KLASSEN).slice();
  var tage = signaltage(T, opt);
  if (!tage.length) throw new Error('keine Signaltage im Fenster ' + tage.von + ' .. ' + tage.bis);
  var lauefer = { schluessel: !!opt.schluessel, leser: opt.leser };
  sag(opt, 'Zelle ' + feld + ': ' + tage.length + ' Signaltage ' + tage[0].iso + ' .. ' + tage[tage.length - 1].iso + (tage.rueckhalte ? ' (Rueckhaltefenster geoeffnet)' : ' (Rueckhaltefenster ab ' + KONST.RUECKHALTE_AB + ' versiegelt)') + ', Klassen ' + klassen.join('/'));

  /* (a) Universum, Universumskorb, Werte je Signaltag - die Klinke zaehlt bei jedem Tag */
  var roh = [], zugriffe = 0, nNull = 0, abd = {};
  var protokollStart = (LESER && !opt.leser) ? LESER.protokoll().length : 0;   /* Protokoll des Lesers nur ab diesem Lauf */
  tage.forEach(function (s) { var e = universumAm(T, s, klassen); s.U = e.U; s.uni = e.uni; s.a = e.U.aTag; });
  tage.forEach(function (s, i) {
    var w = werteAm(T, s, werte, lauefer);
    roh.push(w.werte); zugriffe += w.zugriffe; nNull += w.nNull;
    var jz = abd[s.jahr] || (abd[s.jahr] = {});
    for (var q = 0; q < s.U.liste.length; q++) { var kl = s.U.liste[q].klasse, e = jz[kl] || (jz[kl] = { n: 0, mit: 0 }); e.n++; if (w.werte[q] === w.werte[q]) e.mit++; }
    if (i % 24 === 23) sag(opt, '  Werte ' + (i + 1) + '/' + tage.length + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');
  });
  /* Abdeckung je Klasse und Jahr */
  var abdeckung = { jahre: {}, gesamt: {} }, gk = {};
  Object.keys(abd).sort().forEach(function (j) {
    var o = { gesamt: { n: 0, mit: 0 } };
    Object.keys(abd[j]).forEach(function (kl) { var e = abd[j][kl]; o[K.KLASSEN[kl].name] = { n: e.n, mit: e.mit, anteil: e.n ? e.mit / e.n : null }; o.gesamt.n += e.n; o.gesamt.mit += e.mit; var g = gk[kl] || (gk[kl] = { n: 0, mit: 0 }); g.n += e.n; g.mit += e.mit; });
    o.gesamt.anteil = o.gesamt.n ? o.gesamt.mit / o.gesamt.n : null; abdeckung.jahre[j] = o;
  });
  var gs = { n: 0, mit: 0 }; Object.keys(gk).forEach(function (kl) { abdeckung.gesamt[K.KLASSEN[kl].name] = { n: gk[kl].n, mit: gk[kl].mit, anteil: gk[kl].n ? gk[kl].mit / gk[kl].n : null }; gs.n += gk[kl].n; gs.mit += gk[kl].mit; });
  abdeckung.gesamt.gesamt = { n: gs.n, mit: gs.mit, anteil: gs.n ? gs.mit / gs.n : null };

  /* (b) Sperrklinke: Positivkontrolle am ersten Signaltag (ein praeparierter Blick auf t+1 muss gezaehlt werden) */
  var s0 = tage[0], sp = PR.Sicht(T, s0.t, {}), spF = sichtFuer(T, s0, {});
  sp.zeile(s0.U.liste[0].sym, s0.t + 1); spF.fundamentalAm(T.symName[s0.U.liste[0].sym], T.kal.tage[s0.t + 1]);
  var klinke = { verstoesseHauptlauf: 0, positivkontrolle: { kurs: sp.verstoesse(), bilanz: spF.fundVerstoesse(), tag: s0.iso },
    bestanden: sp.verstoesse() === 1 && spF.fundVerstoesse() === 1 };
  /* Leser-Protokoll: kein Zugriff mit filed >= tag (der Leser wirft ohnehin; hier die Gegenprobe ueber das Protokoll) */
  var leserBefund = { geoeffnet: false, zugriffe: zugriffe, verstoesse: 0 };
  if (LESER && !opt.leser) {
    leserBefund.geoeffnet = true; leserBefund.kennung = LESER.kennung;
    var prot = LESER.protokoll(); leserBefund.protokoll = prot.length - protokollStart;
    for (var pi = protokollStart; pi < prot.length; pi++) { var pe = prot[pi]; if (pe.filed != null && !(pe.filed < pe.tag)) leserBefund.verstoesse++; }
    leserBefund.zaehler = JSON.parse(JSON.stringify(LESER.zaehler));
  }
  sag(opt, '  Klinke: Positivkontrolle Kurs ' + klinke.positivkontrolle.kurs + ' / Bilanz ' + klinke.positivkontrolle.bilanz + ' Verstoesse (Soll je 1); Hauptlauf 0; Leser ' + (leserBefund.geoeffnet ? leserBefund.zugriffe + ' Zugriffe, ' + leserBefund.verstoesse + ' Verstoesse' : 'nicht benutzt'));

  /* (c) Einzelmessung */
  var haupt = auswertung(T, lauf(T, tage, roh), tage);
  sag(opt, '  Einzelmessung: Dezil-Universum brutto ' + f4(haupt.brutto.mittel) + ' Pp (t ' + f2(haupt.brutto.t) + '), netto ' + f4(haupt.netto.mittel) + ' Pp (t ' + f2(haupt.netto.t) + ', MDE80 ' + f4(haupt.netto.mde80) + '), n ' + haupt.perioden + ', Universum ' + f1(haupt.universumMittel) + ', Dezil ' + f1(haupt.dezilMittel) + ', mit Wert ' + f1(haupt.mitWertMittel) + ', Umschlag ' + pz(haupt.umschlagMittel) + ' (' + ((Date.now() - t0) / 1000).toFixed(0) + ' s)');

  /* (d) Nullpunkt: Orakel (Positivkontrolle), Placebo Versatz, Placebo Symbole, Zufall x 12 */
  var O = KONST.ORAKEL, orW = tage.map(function (s) {
    var so = PR.Sicht(T, s.t, { orakel: true }), w = RF.orakelPeriode(so, s.U.liste, T, { t: s.t, a: s.U.aTag, aEnde: s.aEnde });
    return w;
  });
  var orakelM = auswertung(T, lauf(T, tage, orW), tage), ob = orakelM.brutto, ols = orakelM.longShortBrutto, mSd = ob.sd > 0 ? ob.mittel / ob.sd : null, tor = [];
  if (!(ob.mittel >= O.minPp)) tor.push('Dezil-Universum brutto ' + f4(ob.mittel) + ' < ' + O.minPp + ' Pp');
  if (!(mSd >= O.minSd)) tor.push('Mittel/sd ' + f2(mSd) + ' < ' + O.minSd);
  if (!(ob.t >= O.tBoden)) tor.push('t ' + f2(ob.t) + ' < ' + O.tBoden);
  if (!(ols.mittel >= O.longShortMinPp)) tor.push('Long-Short brutto ' + f4(ols.mittel) + ' < ' + O.longShortMinPp + ' Pp');
  var orakel = { bestanden: tor.length === 0, tor: tor, brutto: ob.mittel, netto: orakelM.netto.mittel, t: ob.t, sd: ob.sd, mittelDurchSd: mSd, n: ob.n,
    longShort: { brutto: ols.mittel, t: ols.t, netto: orakelM.longShortNetto.mittel }, schranke: O,
    teil4Einseitig: { minPp: O.teil4EinseitigPp, erreicht: ob.mittel >= O.teil4EinseitigPp, hinweis: 'nachrichtlich: die 20 Pp aus Teil 4 (120 Tage, zweiseitig) auf Dezil-Universum je Monat uebertragen' },
    bau: 'Rang nach realisierter Rendite Eroeffnung(a) -> Eroeffnung(aEnde) je Universumsmitglied (orakelPeriode des Pruefstands, Sicht mit Schluessel); Dezil oben gegen Universum und Long-Short' };
  sag(opt, '  Orakel: Dezil-Universum brutto ' + f4(ob.mittel) + ' Pp (sd ' + f2(ob.sd) + ', Mittel/sd ' + f2(mSd) + ', t ' + f2(ob.t) + '), Long-Short ' + f4(ols.mittel) + ' Pp => ' + (orakel.bestanden ? 'bestanden' : 'GEFALLEN: ' + tor.join(' | ')) + ' (Teil-4-Wert 20 Pp einseitig: ' + (orakel.teil4Einseitig.erreicht ? 'erreicht' : 'verfehlt') + ', nachrichtlich)');

  var PLb = KONST.PLACEBO, versatzOhne = 0, versatzW = tage.map(function (s) {
    var t21 = panelTagNach(T, s.t, KONST.PLACEBO_VERSATZ_TAGE);
    if (t21 === null) { versatzOhne++; var leer = new Float64Array(s.U.liste.length); leer.fill(NaN); return leer; }
    return werteAm(T, s, werte, { schluessel: true, zeilenTag: t21, leser: opt.leser }).werte;
  });
  var versatzM = auswertung(T, lauf(T, tage, versatzW), tage);
  var placeboVersatz = { bestanden: !(Math.abs(versatzM.brutto.t) >= PLb.tEinzeln), brutto: versatzM.brutto.mittel, netto: versatzM.netto.mittel, t: versatzM.brutto.t, se: versatzM.brutto.se, n: versatzM.perioden,
    ppInSchranke: Math.abs(versatzM.brutto.mittel) < PLb.schrankePp, schranke: { tEinzeln: PLb.tEinzeln, schrankePp: PLb.schrankePp }, signaltageOhneVersatz: versatzOhne,
    bau: 'Werte des Feldes vom ' + KONST.PLACEBO_VERSATZ_TAGE + '. Panel-Handelstag nach dem Signaltag, gelesen mit Orakelschluessel, Signaltage und Universum unveraendert; Urteil |t| < ' + PLb.tEinzeln,
    hinweis: 'Bei einem traegen Feld ist der Versatzwert fast der Wert am Signaltag (Placebo ~ Einzelmessung), bei einem Feld aus Vormonatsrenditen enthaelt er die Halteperiode (Placebo ~ Orakel); die Erwartung ~0 gilt nur fuer ein Feld ohne Zeitstruktur.' };
  sag(opt, '  Placebo Versatz +' + KONST.PLACEBO_VERSATZ_TAGE + ': brutto ' + f4(versatzM.brutto.mittel) + ' Pp (t ' + f2(versatzM.brutto.t) + ') => ' + (placeboVersatz.bestanden ? 'bestanden' : 'GEFALLEN'));

  var symW = tage.map(function (s, i) {
    var w = Float64Array.from(roh[i]), rnd = ST.mulberry32(ST.fnv(KONST.ZUFALL.saat + '|placebo-symbole|' + s.iso));
    for (var i = w.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var x = w[i]; w[i] = w[j]; w[j] = x; }
    return w;
  });
  var symM = auswertung(T, lauf(T, tage, symW), tage);
  var placeboSymbole = { bestanden: !(Math.abs(symM.brutto.t) >= PLb.tEinzeln), brutto: symM.brutto.mittel, netto: symM.netto.mittel, t: symM.brutto.t, se: symM.brutto.se, n: symM.perioden,
    ppInSchranke: Math.abs(symM.brutto.mittel) < PLb.schrankePp, schranke: { tEinzeln: PLb.tEinzeln, schrankePp: PLb.schrankePp }, saat: KONST.ZUFALL.saat + '|placebo-symbole|<Signaltag>',
    bau: 'Werte des Feldes je Signaltag unter den Universumsmitgliedern permutiert (fester Generator); Urteil |t| < ' + PLb.tEinzeln };
  sag(opt, '  Placebo Symbole: brutto ' + f4(symM.brutto.mittel) + ' Pp (t ' + f2(symM.brutto.t) + ') => ' + (placeboSymbole.bestanden ? 'bestanden' : 'GEFALLEN'));

  var ZU = KONST.ZUFALL, einzeln = [], mB = 0, mN = 0, fehler = 0;
  for (var zi = 0; zi < ZU.ziehungen; zi++) {
    var fab = RF.zufallFabrik(ZU.saat + '#' + zi), zw = tage.map(function (s) { return fab({ tag: s.t }, s.U.liste, T); });
    var zm = auswertung(T, lauf(T, tage, zw), tage), tOk = !(Math.abs(zm.brutto.t) >= ZU.tEinzeln);
    if (!tOk) fehler++;
    einzeln.push({ ziehung: zi, n: zm.perioden, brutto: zm.brutto.mittel, netto: zm.netto.mittel, kosten: zm.kostenMittel, umschlag: zm.umschlagMittel, se: zm.brutto.se, t: zm.brutto.t, tOk: tOk });
    mB += zm.brutto.mittel; mN += zm.netto.mittel + zm.kostenMittel;
  }
  mB /= ZU.ziehungen; mN /= ZU.ziehungen;
  var seE = mittel(einzeln.map(function (x) { return x.se; }));
  var zufall = { bestanden: Math.abs(mB) < ZU.schrankePp && Math.abs(mN) < ZU.schrankePp && fehler <= ZU.maxFehler, ziehungen: ZU.ziehungen, mittelBrutto: mB, mittelNettoPlusKosten: mN,
    fehlerEinzelnT: fehler, seEinzelnMittel: seE, seDesMittels: seE == null ? null : seE / Math.sqrt(ZU.ziehungen), mdeBoden: seE == null ? null : KONST.MDE_FAKTOR * seE,
    umschlagMittel: mittel(einzeln.map(function (x) { return x.umschlag; })), schranke: ZU, einzeln: einzeln,
    bau: ZU.ziehungen + ' Zufallsfelder (zufallFabrik des Pruefstands, Saat ' + ZU.saat + '#k) auf denselben Signaltagen; Mittel der Ziehungen brutto und netto+Kosten unter ' + ZU.schrankePp + ' Pp, hoechstens ' + ZU.maxFehler + ' Ziehungen mit |t| >= ' + ZU.tEinzeln + '; MDE-Boden = ' + KONST.MDE_FAKTOR + ' x mittlere se einer Ziehung' };
  sag(opt, '  Zufall x ' + ZU.ziehungen + ': Mittel brutto ' + f4(mB) + ', netto+Kosten ' + f4(mN) + ' Pp, |t|>=' + ZU.tEinzeln + ' in ' + fehler + ', se je Ziehung ' + f4(seE) + ' (MDE-Boden ' + f4(zufall.mdeBoden) + ' Pp) => ' + (zufall.bestanden ? 'bestanden' : 'GEFALLEN'));

  var leck = { klinke: klinke, leser: leserBefund, bestanden: klinke.bestanden && leserBefund.verstoesse === 0 };
  var nullpunkt = { orakel: orakel, placebo: { versatz: placeboVersatz, symbole: placeboSymbole, zufall: zufall }, leck: leck,
    bestanden: orakel.bestanden && placeboVersatz.bestanden && placeboSymbole.bestanden && zufall.bestanden && leck.bestanden };

  /* (e) Zelle im Format von mehrfaktor-felder.md §3 */
  var sekunden = (Date.now() - t0) / 1000, rss = process.resourceUsage().maxRSS / 1024;
  var zelle = { kennung: KONST.KENNUNG, feld: feld, stand: jetzt(), definition: opt.definition || null, quellen: opt.quellen || null,
    kunst: opt.kunst || null, schluessel: !!opt.schluessel,
    panel: { kennung: T.stand.kennung, letzterTag: T.kal.tage[T.maxTag], zeilen: T.g.n, reihen: T.nSym, ordner: T.$aus },
    klassen: klassen, signalregel: 'erster Panel-Handelstag je Kalendermonat; Ausfuehrung Eroeffnung des naechsten Handelstags; Halten bis zum Ausfuehrungstag des naechsten Signaltags',
    von: tage.von, bis: tage.bis, rueckhalte: tage.rueckhalte, rueckhalteAb: KONST.RUECKHALTE_AB,
    signaltageZahl: tage.length, signaltageZurueckgehalten: tage.zurueckgehalten, signaltageUnvollstaendig: tage.unvollstaendig,
    signaltage: tage.map(function (s, i) { var m = {}; for (var q = 0; q < s.U.liste.length; q++) { var v = roh[i][q]; m[T.symName[s.U.liste[q].sym]] = (v === v) ? v : null; } return { tag: s.iso, ausfuehrung: T.kal.tage[s.U.aTag], ende: T.kal.tage[s.aEnde], werte: m }; }),
    abdeckung: abdeckung, nullpunkt: nullpunkt, einzelmessung: kurz(haupt),
    lauf: { sekunden: sekunden, maxRssMB: rss, tafelLadeSekunden: T.$ladeSekunden, werteNull: nNull, bilanzZugriffe: zugriffe, node: process.version } };
  var np = { kennung: KONST.KENNUNG_NULLPUNKT, feld: feld, stand: zelle.stand, zelleKennung: KONST.KENNUNG, panel: zelle.panel, rueckhalte: tage.rueckhalte,
    hinweis: 'Kontrollen der Maschine, KEINE Feldwerte: Orakel (Zukunft mit Schluessel), Placebo Versatz (Zukunft mit Schluessel, als Placebo deklariert), Placebo Symbole (permutiert), Zufall. Nichts hiervon ist ein Signal.',
    orakel: { urteil: orakel, messung: kurz(orakelM), perioden: orakelM.perioden_reihe },
    placeboVersatz: { urteil: placeboVersatz, messung: kurz(versatzM), perioden: versatzM.perioden_reihe,
      signaltage: tage.map(function (s, i) { var m = {}; for (var q = 0; q < s.U.liste.length; q++) { var v = versatzW[i][q]; m[T.symName[s.U.liste[q].sym]] = (v === v) ? v : null; } return { tag: s.iso, werteVom: (function () { var t21 = panelTagNach(T, s.t, KONST.PLACEBO_VERSATZ_TAGE); return t21 === null ? null : T.kal.tage[t21]; })(), werte: m }; }) },
    placeboSymbole: { urteil: placeboSymbole, messung: kurz(symM), perioden: symM.perioden_reihe },
    zufall: zufall, einzelmessungPerioden: haupt.perioden_reihe };
  var md = bericht(zelle, np);
  var dateien = null;
  if (opt.schreiben !== false) {
    var ziel = opt.ziel || KONST.ZELLEN; fs.mkdirSync(ziel, { recursive: true });
    dateien = { zelle: path.join(ziel, feld + '.json'), nullpunkt: path.join(ziel, feld + '-nullpunkt.json'), bericht: path.join(ziel, feld + '-bericht.md') };
    schreibe(dateien.zelle, zelle); schreibe(dateien.nullpunkt, np); fs.writeFileSync(dateien.bericht, md);
  }
  sag(opt, '  Nullpunkt ' + (nullpunkt.bestanden ? 'bestanden' : 'NICHT bestanden') + '; ' + sekunden.toFixed(1) + ' s, RSS max ' + rss.toFixed(0) + ' MB' + (dateien ? '; geschrieben: ' + dateien.zelle : ''));
  return { zelle: zelle, bericht: md, nullpunkt: np, verstoesse: 0, dateien: dateien };
}

/* =========================================================================================
 * 7. Bericht (Markdown) aus Zelle und Nullpunkt
 * ========================================================================================= */
function bericht(z, np) {
  var e = z.einzelmessung, n = z.nullpunkt, L = [];
  function zeile(x) { L.push(x); }
  function kz(k) { return f4(k.mittel) + ' | ' + f4(k.se) + ' | ' + f2(k.t) + ' | ' + f2(k.tHH) + ' | ' + f4(k.mde80) + ' | ' + k.n; }
  zeile('# Faktorzelle `' + z.feld + '`' + (z.kunst ? ' — KUNSTFELD (' + z.kunst + '), kein Feld der Studie' : ''));
  zeile('');
  zeile('Erzeugt ' + z.stand + ' von `zelle.js` (' + z.kennung + '). Panel `' + z.panel.kennung + '` (' + z.panel.zeilen + ' Zeilen, ' + z.panel.reihen + ' Reihen, bis ' + z.panel.letzterTag + '). Klassen ' + z.klassen.map(function (c) { return K.KLASSEN[c].name; }).join(' / ') + '. Signaltage ' + z.signaltageZahl + ' (' + z.signaltage[0].tag + ' … ' + z.signaltage[z.signaltage.length - 1].tag + '), ' + z.signalregel + '. **Rückhaltefenster ab ' + z.rueckhalteAb + ': ' + (z.rueckhalte ? 'GEÖFFNET' : 'versiegelt (' + z.signaltageZurueckgehalten + ' Signaltage zurückgehalten)') + '.** Lauf ' + z.lauf.sekunden.toFixed(1) + ' s, RSS max ' + z.lauf.maxRssMB.toFixed(0) + ' MB. Alle Renditen sind Kursrenditen ohne Ausschüttungen. Simulation mit virtuellem Kapital, keine Anlageberatung.');
  zeile('');
  zeile('**Definition:** ' + (z.definition || '—') + '  ');
  zeile('**Quellen:** ' + (z.quellen ? [].concat(z.quellen).join('; ') : '—'));
  zeile('');
  zeile('## 1. Einzelmessung (Diagnose, kein Urteil)');
  zeile('');
  zeile('Dezil oben gegen Universum, Pp je Monat; se = Hansen-Hodrick bei Lag 1 auf den nicht überlappenden Monatsperioden (= naiv), t_HH = Tagesreihe mit HH-Lag ' + KONST.LAG + '; MDE₈₀ = ' + KONST.MDE_FAKTOR + ' × se.');
  zeile('');
  zeile('| Reihe | Mittel Pp | se | t | t_HH (Tage) | MDE₈₀ | n |');
  zeile('|---|---|---|---|---|---|---|');
  zeile('| Dezil oben − Universum, brutto | ' + kz(e.dezilUni.brutto) + ' |');
  zeile('| Dezil oben − Universum, **netto** | ' + kz(e.dezilUni.netto) + ' |');
  zeile('| Long − Short, brutto (Diagnose, verlangt Leihe) | ' + kz(e.longShort.brutto) + ' |');
  zeile('| Long − Short, netto | ' + kz(e.longShort.netto) + ' |');
  zeile('');
  zeile('| Größe | Wert |');
  zeile('|---|---|');
  zeile('| Universum je Signaltag (Mittel) | ' + f1(e.universumMittel) + ' |');
  zeile('| davon mit Wert (Mittel) | ' + f1(e.mitWertMittel) + ' |');
  zeile('| Dezil oben / unten (Mittel) | ' + f1(e.dezilMittel) + ' / ' + f1(e.dezilUnten.dezilMittel) + ' |');
  zeile('| Dezil unten − Universum brutto / netto | ' + f4(e.dezilUnten.brutto) + ' / ' + f4(e.dezilUnten.netto) + ' Pp |');
  zeile('| Umschlag Dezil / Universum je Monat | ' + pz(e.umschlag.dezil) + ' / ' + pz(e.umschlag.universum) + ' |');
  zeile('| Kosten Dezil / Universum je Monat (Kassa-Hürde je Klasse × Umschlag) | ' + f4(e.kosten.dezil) + ' / ' + f4(e.kosten.universum) + ' Pp |');
  zeile('| Auffüllungen (fehlender Wert = mittlerer Rang) im Dezil oben / unten, Summe über alle Signaltage | ' + e.aufgefuellt.oben + ' / ' + e.aufgefuellt.unten + ' |');
  zeile('| Tote im Dezil oben (Totalverlust) / Lücken | ' + e.zaehler.tote + ' (' + e.zaehler.toteTotalverlust + ') / ' + e.zaehler.luecken + ' |');
  zeile('| Signaltage unter ' + KONST.MIN_UNIVERSUM + ' Mitgliedern (übersprungen) | ' + e.zaehler.zuKlein + ' |');
  zeile('| Regime (SPY über / unter EMA200), netto | ' + f4(e.regime.ueberEMA200.mittel) + ' (n ' + e.regime.ueberEMA200.n + ') / ' + f4(e.regime.unterEMA200.mittel) + ' (n ' + e.regime.unterEMA200.n + ') Pp |');
  zeile('');
  zeile('### Jahresscheiben (netto, Dezil oben − Universum)');
  zeile('');
  zeile('| Jahr | n | brutto | netto | se | t | MDE₈₀ | |');
  zeile('|---|---|---|---|---|---|---|---|');
  e.jahre.netto.forEach(function (j, i) { var b = e.jahre.brutto[i]; zeile('| ' + j.jahr + ' | ' + j.n + ' | ' + f4(b.mittel) + ' | ' + f4(j.mittel) + ' | ' + f4(j.se) + ' | ' + f2(j.t) + ' | ' + f4(j.mde80) + ' | ' + (j.duenn ? 'dünn' : '') + ' |'); });
  zeile('');
  zeile('**Letzte ' + KONST.AKTUELL_TAGE + ' Tage** (Signaltag ≥ ' + e.aktuell.netto.abTag + '): netto ' + f4(e.aktuell.netto.mittel) + ' Pp (se ' + f4(e.aktuell.netto.se) + ', t ' + f2(e.aktuell.netto.t) + ', MDE₈₀ ' + f4(e.aktuell.netto.mde80) + ', n ' + e.aktuell.netto.n + '), brutto ' + f4(e.aktuell.brutto.mittel) + ' Pp.');
  zeile('');
  zeile('## 2. Abdeckung (Anteil des Universums mit Wert)');
  zeile('');
  var kn = z.klassen.map(function (c) { return K.KLASSEN[c].name; });
  zeile('| Jahr | ' + kn.join(' | ') + ' | gesamt |');
  zeile('|---|' + kn.map(function () { return '---|'; }).join('') + '---|');
  Object.keys(z.abdeckung.jahre).forEach(function (j) { var o = z.abdeckung.jahre[j]; zeile('| ' + j + ' | ' + kn.map(function (nm) { return o[nm] ? pz(o[nm].anteil) + ' (' + o[nm].mit + '/' + o[nm].n + ')' : '—'; }).join(' | ') + ' | ' + pz(o.gesamt.anteil) + ' (' + o.gesamt.mit + '/' + o.gesamt.n + ') |'); });
  var g = z.abdeckung.gesamt; zeile('| **alle** | ' + kn.map(function (nm) { return g[nm] ? pz(g[nm].anteil) : '—'; }).join(' | ') + ' | ' + pz(g.gesamt.anteil) + ' |');
  zeile('');
  zeile('## 3. Nullpunkt (Kontrollen der Maschine, Schranken aus konfig.js des Prüfstands)');
  zeile('');
  zeile('| Kontrolle | Ergebnis | Schranke | Urteil |');
  zeile('|---|---|---|---|');
  var o = n.orakel;
  zeile('| Orakel (Rang nach künftiger Rendite, Schlüssel) | Dezil − Universum brutto ' + f4(o.brutto) + ' Pp, sd ' + f2(o.sd) + ', Mittel/sd ' + f2(o.mittelDurchSd) + ', t ' + f2(o.t) + ', n ' + o.n + '; Long − Short ' + f4(o.longShort.brutto) + ' Pp | Dezil − Universum ≥ ' + o.schranke.minPp + ' Pp (horizontgleich, Teil 3), Mittel/sd ≥ ' + o.schranke.minSd + ', t ≥ ' + o.schranke.tBoden + '; Long − Short ≥ ' + o.schranke.longShortMinPp + ' Pp (Δ Teil 4); nachrichtlich einseitig ' + o.teil4Einseitig.minPp + ' Pp: ' + (o.teil4Einseitig.erreicht ? 'erreicht' : 'verfehlt') + ' | **' + (o.bestanden ? 'bestanden' : 'GEFALLEN: ' + o.tor.join('; ')) + '** |');
  var pv = n.placebo.versatz;
  zeile('| Placebo 1 — Werte +' + KONST.PLACEBO_VERSATZ_TAGE + ' Handelstage (Zukunft, Schlüssel, als Placebo deklariert) | brutto ' + f4(pv.brutto) + ' Pp, t ' + f2(pv.t) + ', n ' + pv.n + (pv.signaltageOhneVersatz ? ', ' + pv.signaltageOhneVersatz + ' Signaltage ohne Versatzwerte' : '') + ' | \\|t\\| < ' + pv.schranke.tEinzeln + ' (\\|Mittel\\| < ' + pv.schranke.schrankePp + ' Pp: ' + (pv.ppInSchranke ? 'ja' : 'nein') + ', nachrichtlich) | **' + (pv.bestanden ? 'bestanden' : 'GEFALLEN') + '** |');
  var ps = n.placebo.symbole;
  zeile('| Placebo 2 — Symbole je Signaltag permutiert | brutto ' + f4(ps.brutto) + ' Pp, t ' + f2(ps.t) + ', n ' + ps.n + ' | \\|t\\| < ' + ps.schranke.tEinzeln + ' (\\|Mittel\\| < ' + ps.schranke.schrankePp + ' Pp: ' + (ps.ppInSchranke ? 'ja' : 'nein') + ', nachrichtlich) | **' + (ps.bestanden ? 'bestanden' : 'GEFALLEN') + '** |');
  var zu = n.placebo.zufall;
  zeile('| Zufall × ' + zu.ziehungen + ' | Mittel brutto ' + f4(zu.mittelBrutto) + ', netto+Kosten ' + f4(zu.mittelNettoPlusKosten) + ' Pp; \\|t\\| ≥ ' + zu.schranke.tEinzeln + ' in ' + zu.fehlerEinzelnT + '; se je Ziehung ' + f4(zu.seEinzelnMittel) + ' Pp | \\|Mittel\\| < ' + zu.schranke.schrankePp + ' Pp, ≤ ' + zu.schranke.maxFehler + ' Ziehungen | **' + (zu.bestanden ? 'bestanden' : 'GEFALLEN') + '** |');
  var lk = n.leck;
  zeile('| Leck-Klinke (Kurs und Bilanz) | Hauptlauf 0 Verstöße (sonst Abbruch); Positivkontrolle am ' + lk.klinke.positivkontrolle.tag + ': Kurs ' + lk.klinke.positivkontrolle.kurs + ', Bilanz ' + lk.klinke.positivkontrolle.bilanz + '; Leser ' + (lk.leser.geoeffnet ? lk.leser.zugriffe + ' Zugriffe, ' + lk.leser.verstoesse + ' mit filed ≥ tag' : 'nicht benutzt') + ' | Positivkontrolle je 1, Leser 0 | **' + (lk.bestanden ? 'bestanden' : 'GEFALLEN') + '** |');
  zeile('');
  zeile('**MDE-Boden aus den Zufallsdezilen:** ' + f4(zu.mdeBoden) + ' Pp je Monat (' + KONST.MDE_FAKTOR + ' × mittlere se einer Ziehung; ein echtes Dezil streut stärker — Faktor 2–4, Momentum 4,45 nach `MACHBARKEIT.md` §7 der Stimmungsstudie). Umschlag eines Zufallsdezils ' + pz(zu.umschlagMittel) + '.');
  zeile('');
  zeile('Placebo 1 misst bei einem trägen Feld die Persistenz (≈ Einzelmessung) und bei einem Feld aus Vormonatsrenditen die Halteperiode selbst (≈ Orakel); die Erwartung ≈ 0 trägt nur für ein Feld ohne Zeitstruktur (Zufall). Ein Fall unter dieser Zeile ist deshalb erst ein Befund, wenn die Einzelmessung selbst unter der Schranke liegt.');
  zeile('');
  zeile('**Nullpunkt gesamt: ' + (n.bestanden ? 'bestanden' : 'NICHT bestanden') + '.** Details, Placebo-Werte und Periodenreihen: `' + z.feld + '-nullpunkt.json`.');
  zeile('');
  zeile('## 4. Rang- und Dezilregel');
  zeile('');
  zeile('Rang je Signaltag über das Universum, aufsteigend nach Rohwert, Gleichstand = mittlerer Rang; fehlende Werte = mittlerer Rang (n+1)/2, vorhandene Ränge von 1..m auf 1..n gestreckt (R = (r − ½)·n/m + ½, bei voller Abdeckung identisch). Dezil oben = Rang > 0,9 n, unten = Rang ≤ 0,1 n. Werte in `' + z.feld + '.json` sind Rohgrößen, kein Rang; `null` bleibt `null`.');
  zeile('');
  return L.join('\n') + '\n';
}

/* =========================================================================================
 * 8. Kombination: gleichgewichtete Raenge je Signaltag, Kontrollgroessen nur berichtet
 * ========================================================================================= */
/**
 * kombiniere(zellen, felder, gewichte, opt) -> { kennung, felder, gewichte, kontrollen, signaltage: [{tag, werte, aufgefuellt, kontrollen}], zaehler }
 *   zellen:   { feldname: Zelle (aus zellen/<feld>.json) }
 *   felder:   gewichtete Felder (Signale); gewichte: { feld: w } (fehlend = 1); opt.kontrollen: nur berichtete Felder
 * Je Signaltag Rang je Feld im Universum (Gleichstand = mittlerer Rang), fehlender Wert = mittlerer Rang (n+1)/2 und Zaehler +1.
 * Kombinationswert = Summe w_f R_f / Summe w_f (Rangmittel bei gleichen Gewichten). Universen und Signaltage muessen identisch sein.
 */
function kombiniere(zellen, felder, gewichteIn, opt) {
  opt = opt || {};
  var kontrollen = (opt.kontrollen || []).slice();
  if (!Array.isArray(felder) || !felder.length) throw new Error('kombiniere: keine gewichteten Felder');
  var G = {}, summeG = 0;
  felder.forEach(function (f) { var w = (gewichteIn && gewichteIn[f] != null) ? gewichteIn[f] : 1; if (!(w > 0)) throw new Error('kombiniere: Gewicht von ' + f + ' muss > 0 sein'); G[f] = w; summeG += w; });
  var alle = felder.concat(kontrollen);
  alle.forEach(function (f) { if (!zellen[f] || !Array.isArray(zellen[f].signaltage)) throw new Error('kombiniere: Zelle ' + f + ' fehlt oder hat keine Signaltage'); });
  kontrollen.forEach(function (f) { if (G[f] != null) throw new Error('kombiniere: Kontrollgroesse ' + f + ' ist zugleich gewichtet'); });
  var ref = zellen[felder[0]];
  alle.forEach(function (f) {
    var z = zellen[f];
    if (z.rueckhalte !== ref.rueckhalte) throw new Error('kombiniere: Rueckhalte-Flagge von ' + f + ' weicht ab');
    if (z.signaltage.length !== ref.signaltage.length) throw new Error('kombiniere: ' + f + ' hat ' + z.signaltage.length + ' Signaltage, ' + felder[0] + ' ' + ref.signaltage.length);
    z.signaltage.forEach(function (s, i) {
      var r = ref.signaltage[i];
      if (s.tag !== r.tag) throw new Error('kombiniere: Signaltag ' + i + ' ist ' + s.tag + ' in ' + f + ', ' + r.tag + ' in ' + felder[0]);
      var a = Object.keys(s.werte), b = Object.keys(r.werte);
      if (a.length !== b.length) throw new Error('kombiniere: Universum am ' + s.tag + ' hat ' + a.length + ' Symbole in ' + f + ', ' + b.length + ' in ' + felder[0]);
      for (var q = 0; q < b.length; q++) if (!(b[q] in s.werte)) throw new Error('kombiniere: ' + b[q] + ' fehlt am ' + s.tag + ' in ' + f);
    });
  });
  var zaehler = { auffuellungen: {}, gesamt: 0, symbolTage: 0 }; felder.forEach(function (f) { zaehler.auffuellungen[f] = 0; });
  var signaltage = ref.signaltage.map(function (s, i) {
    var namen = Object.keys(s.werte).sort(), n = namen.length, score = new Float64Array(n), auf = new Uint8Array(n), kon = {};
    function reihe(f) { return raenge(namen.map(function (nm) { var v = zellen[f].signaltage[i].werte[nm]; return (v === null || v === undefined) ? NaN : v; })); }
    felder.forEach(function (f) {
      var R = reihe(f);
      for (var q = 0; q < n; q++) { score[q] += G[f] * R.rang[q] / summeG; if (R.fehlt[q]) { auf[q]++; zaehler.auffuellungen[f]++; zaehler.gesamt++; } }
    });
    kontrollen.forEach(function (f) { var R = reihe(f), m = {}; namen.forEach(function (nm, q) { m[nm] = R.fehlt[q] ? null : R.rang[q]; }); kon[f] = m; });
    var werte = {}, aufM = {}; namen.forEach(function (nm, q) { werte[nm] = score[q]; aufM[nm] = auf[q]; });
    zaehler.symbolTage += n;
    return { tag: s.tag, werte: werte, aufgefuellt: aufM, kontrollen: kon };
  });
  return { kennung: KONST.KENNUNG_KOMBINATION, stand: jetzt(), felder: felder.slice(), gewichte: G, kontrollen: kontrollen, rueckhalte: ref.rueckhalte,
    quellen: alle.map(function (f) { return { feld: f, kennung: zellen[f].kennung, stand: zellen[f].stand, kunst: zellen[f].kunst || null }; }),
    signaltage: signaltage, zaehler: zaehler };
}
/** Eine Zelle oder Kombination (signaltage: [{tag, werte}]) mit derselben Maschine messen. Liefert die Auswertung (wie
 *  einzelmessung, voll). Symbole ausserhalb des Universums am Tag werden gezaehlt und ignoriert, fehlende als null gefuehrt. */
function messeZelle(T, z, opt) {
  opt = opt || {};
  var klassen = (opt.klassen || z.klassen || KONST.KLASSEN).slice(), tage = signaltage(T, { von: z.von, bis: z.bis, rueckhalte: z.rueckhalte });
  var jeTag = {}; z.signaltage.forEach(function (s) { jeTag[s.tag] = s.werte; });
  var aufJeTag = {}; z.signaltage.forEach(function (s) { if (s.aufgefuellt) aufJeTag[s.tag] = s.aufgefuellt; });
  var fremd = 0, fehlt = 0, ohneTag = 0, auf = [];
  tage = tage.filter(function (s) { if (!jeTag[s.iso]) { ohneTag++; return false; } return true; });
  var werte = tage.map(function (s) {
    var e = universumAm(T, s, klassen); s.U = e.U; s.uni = e.uni; s.a = e.U.aTag;
    var m = jeTag[s.iso], am = aufJeTag[s.iso], aus = new Float64Array(s.U.liste.length), au = new Uint8Array(s.U.liste.length), da = 0;
    for (var q = 0; q < s.U.liste.length; q++) {
      var nm = T.symName[s.U.liste[q].sym], v = m[nm];
      if (v === undefined) { fehlt++; aus[q] = NaN; } else { da++; aus[q] = (v === null) ? NaN : v; }
      if (am && am[nm]) au[q] = am[nm];
    }
    fremd += Object.keys(m).length - da; auf.push(au);
    return aus;
  });
  var a = auswertung(T, lauf(T, tage, werte, Object.keys(aufJeTag).length ? auf : null), tage);
  a.abgleich = { signaltage: tage.length, ohneTagInZelle: ohneTag, symboleFremd: fremd, symboleFehlend: fehlt };
  return a;
}

/* =========================================================================================
 * 9. Regressionsklinke (§1a.7): Momentum 12-1 des Pruefstands, Klassen [2,3], gegen die Teil-2-Zahl - kein Feld
 * ========================================================================================= */
function regression(T) {
  T = T || tafel();
  var L = PR.lauf(T, RF.momentum12_1, { freq: 'monat', empfindlichkeit: 'haupt', klassen: [2, 3] });
  var B = PR.bewerte(T, L, { regime: T.$regime });
  var gemessen = PR.kennzahlen(B.haupt.perioden, null, MONAT.lag, 'netto').mittel;
  var erwartet = K.REGRESSION23_ERWARTET[T.stand.kennung];
  return { kennung: KONST.KENNUNG_REGRESSION, stand: jetzt(), panel: T.stand.kennung, letzterTag: T.kal.tage[T.maxTag],
    lauf: 'PR.lauf(momentum12_1, monat, haupt, klassen [2,3]) -> bewerte -> kennzahlen(haupt.perioden, netto).mittel (wie T3-P12)',
    erwartet: erwartet == null ? null : erwartet, gemessen: gemessen, differenz: erwartet == null ? null : gemessen - erwartet,
    gleich: erwartet != null && Math.abs(gemessen - erwartet) <= 1e-9,
    hinweis: 'Maschinenpruefung mit echten Daten, kein Feld: nur die Gleichheit mit K.REGRESSION23_ERWARTET zaehlt; keine weitere Kennzahl dieses Laufs wird berichtet.' };
}

module.exports = { KONST: KONST, K: K, PR: PR, RF: RF, ST: ST, tafel: tafel, leser: leser, signaltage: signaltage, monatsanfaenge: monatsanfaenge,
  panelTagNach: panelTagNach, universumAm: universumAm, sichtFuer: sichtFuer, werteAm: werteAm, raenge: raenge, dezile: dezile,
  halteKorb: halteKorb, lauf: lauf, auswertung: auswertung, zelleBauen: zelleBauen, bericht: bericht, kombiniere: kombiniere,
  messeZelle: messeZelle, regression: regression };
