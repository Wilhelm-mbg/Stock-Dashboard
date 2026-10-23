'use strict';
/* ADAPTER tag (FORM.md §3): eine Regel signal(sicht, i, params) auf der Tafel - Topf derselben Zelle, Kassa-Huerde je Umsatzklasse,
 * Hansen-Hodrick, Tor 1 / Tor 2 und die Pflicht-Gegenproben, nach dem Verfahren der Trendkanal-Studie
 * (studien/vorregistrierung-2026-09-08-trendkanal-tage/: messen.js topfUndListen/messeReihe, auswerten.js momente/statistik -
 * hier mit einer beliebigen Regel statt der vier Linien; festAusstieg/ertragLong/reiheAus kommen unveraendert aus kanaele.js).
 *
 * Zellen je Art x Konfiguration x Einstiegstag x Klasse x lebend: n, su (Summe dir*(rLong - Topf)), sr (Summe dir*r), sd (Dauer),
 * dn/ds je Abgangsgruppe. Arten: echt, spaet (Einstieg einen Tag spaeter, Ausstieg fest), versatz (Signal 20 Tage spaeter),
 * placebo (anderer Wert, gleicher Tag, gleiche Klasse, gleiche Richtung). Der Topf hat ein eigenes Feld (Dauer 1..61).
 *
 * Die Sicht: nur Zeilen <= i lesbar; jeder Zugriff dahinter zaehlt als Verstoss und liefert NaN (Messgeraet-Fehler). Dazu roh/markt (Nr. 113)
 * und datum(j) mit den Monatsfunktionen (Nr. 117; Kalender nur bis zur Schranke). Regelflags brauchtHochTief/brauchtRoh/brauchtMarkt/brauchtDatum.
 *
 * Bewertung (Nr. 118, kandidat.json `bewertung`, FORM.md §3): `topf` (Vorgabe, bitgleich zum Verfahren oben) oder `zeit` fuer Regeln, die an
 * einem Tag alle oder fast alle Reihen treffen (Kalender-, Terminregeln): dort IST die Signalmenge der Topf der Zelle, der Ueberschuss per Bau
 * null (Fehlerform "Tagestopf loescht marktweite Effekte"). Im Modus zeit ist der Topf eines Trades seit Nr. 121-1 der LOKALE Topf seines
 * Signals (lokalerTopf): Fenster der Haltedauer H der Konfiguration (Eroeffnung -> Eroeffnung wie der Trade) an zulaessigen Starttagen derselben
 * Reihe und desselben Zeitraums, Klasse in `klassen` der Konfiguration, ohne Fenster, die sich mit irgendeinem Signalfenster der Reihe
 * ueberschneiden; jeder Starttag gehoert genau EINEM Signal (dem naechstgelegenen Einstiegstag, Gleichstand -> der fruehere) und nur bis zum
 * Abstand R = topfRadius (Vorgabe 4 H). Mindestens TOPF_N_MIN Fenster, sonst topfFehlt. Die Toepfe benachbarter Signale sind disjunkt; die
 * Streuung des Topfs steckt im Ueberschuss jedes Trades und damit in der Tagesreihe (Hansen-Hodrick-Lag = H wie im Modus topf). Der globale
 * Topf von Nr. 118 bleibt als zeitTopfGlobal (nachrichtliche Zahl und Rot-vor-Gruen-Nachweis, opt.topfArt 'global'). Je Reihe laeuft die
 * Messung zweiphasig: erst alle Signale sammeln (die Einstiegstage bilden Ausschluss- und Zuordnungsmenge), dann buchen - im Modus topf mit
 * derselben Reihenfolge der Summanden je Zelle wie zuvor.
 * Placebo "anderer Wert gleicher Klasse" entfaellt im Modus zeit (traefe dieselbe Zelle) und wird so ausgewiesen; Placebo ist dort das
 * verschobene Signal (mit eigenem lokalem Topf). Verschobene Fenster, die ein Signalfenster derselben Reihe schneiden, werden in beiden Modi
 * nicht gewertet, aber gezaehlt (B-V5); die Sperrklinke auf das verschobene Signal ist zweiseitig (A3). Kennzahl fuer beide Modi:
 * Anteil der zulaessigen Reihen mit Signal am Signaltag (signalAnteil) mit Warnung (warnungen) im Grenzfall.
 * NUR LESEN. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var path = require('path');
var K = require('../konfig.js');
var C = require(path.join(K.TRENDKANAL_STUDIE, 'kanaele.js'));

/* Arten der Zellen: echt, spaet (Einstieg +1 T, Ausstieg +1 T), versatz, placebo; nur Modus zeit, nachrichtlich: global (Ueberschuss gegen den
 * globalen Topf der Reihe OHNE Ausschluss der Signalfenster, Audit A §3d "alle Fenster"), radiusKlein/radiusGross (lokaler Topf mit R = 2 H / 8 H). */
var ARTEN = ['echt', 'spaet', 'versatz', 'placebo', 'global', 'radiusKlein', 'radiusGross'];
/* Abgangsgruppen; "zensiert" (A7, Nr. 121-1) = Reihe, deren letzte Zeile der letzte Tag vor der Sperre ist (gesperrte Tafel): kein Abgang,
 * nur die Sperre schneidet ab. Nur die Abgangs-Zaehlung und -Spalte; Ertrag, S.lebend und der Zellenschluessel bleiben unveraendert. */
var GRUPPEN = ['uebernahme', 'insolvenz', 'sonstige', 'zensiert'];
var POT_MAX_DAUER = 61, N_K = 4;
var BEWERTUNGEN = ['topf', 'zeit'];
var VERSATZ_MIN = 5, VERSATZ_MAX = 60;
/** Rechenvorschrift des Modus in einem Satz (ergebnis.json bewertungDetail); versatz = Handelstage der Verschiebungs-Gegenprobe. */
function bewertungDetail(modus, versatz) {
  return modus === 'zeit'
    ? 'Ueberschuss = Rendite (Eroeffnung Einstieg -> Eroeffnung Ausstieg) minus LOKALER Topf des Signals (Nr. 121-1): Mittel der Fenster gleicher Haltedauer H (Konfiguration) derselben Reihe und desselben Zeitraums (Entdeckung | Pruefung) an zulaessigen Starttagen mit Klasse der Konfiguration, ohne Fenster, die sich mit einem Signalfenster der Reihe ueberschneiden (|Starttag - Einstiegstag| < H); jeder Starttag gehoert dem naechstgelegenen Signal der Reihe (Gleichstand: dem frueheren), hoechstens R = topfRadius Handelstage entfernt (Vorgabe 4 H), mindestens ' + K.TOPF_N_MIN + ' Fenster je Signal; Kassa-Huerde je Klasse wie bisher; se Hansen-Hodrick ueber die Tagesreihe (Lag H, die Topf-Streuung steckt im Ueberschuss je Trade); Placebo "anderer Wert gleicher Klasse" entfaellt (traefe dieselbe Zelle), Placebo ist das um ' + versatz + ' Handelstage verschobene Signal mit eigenem lokalem Topf.'
    : 'Ueberschuss = Rendite (Eroeffnung Einstieg -> Eroeffnung Ausstieg) minus Topf derselben Zelle (Einstiegstag, Dauer, Umsatzklasse, lebend) - das Verfahren der Trendkanal-Studie; Kassa-Huerde je Klasse; Placebo = anderer zulaessiger Wert gleicher Klasse am selben Tag, gleiche Richtung; Verschiebung um ' + versatz + ' Handelstage.';
}
/** Topfradius (Modus zeit, Nr. 121-1): kandidat.json topfRadius (ganze Zahl, Handelstage, 2 H .. 12 H fuer JEDE Konfiguration), Vorgabe 4 H. */
function topfRadiusVon(kand, H) {
  if (kand.topfRadius == null) return K.TOPF_RADIUS.vorgabe * H;
  var r = kand.topfRadius, lo = K.TOPF_RADIUS.min * H, hi = K.TOPF_RADIUS.max * H;
  if (!(Number.isInteger(r) && r >= lo && r <= hi)) throw new Error('kandidat.json: topfRadius muss eine ganze Zahl ' + lo + '..' + hi + ' sein (' + K.TOPF_RADIUS.min + ' H .. ' + K.TOPF_RADIUS.max + ' H, H = ' + H + '), nicht ' + JSON.stringify(r));
  return r;
}
/** Versatz der Verschiebungs-Gegenprobe (Nachlieferung Nr. 118): kandidat.json versatzTage (ganze Zahl 5..60), Vorgabe K.VERSATZ_TAGE. Bei
 *  Kalenderregeln darf die Verschiebung nicht auf das naechste Ereignisfenster fallen (Monatswende: +20 ~ naechstes Monatsende, +10 = Monatsmitte). */
function versatzVon(kand) {
  var v = kand.versatzTage == null ? K.VERSATZ_TAGE : kand.versatzTage;
  if (!(Number.isInteger(v) && v >= VERSATZ_MIN && v <= VERSATZ_MAX)) throw new Error('kandidat.json: versatzTage muss eine ganze Zahl ' + VERSATZ_MIN + '..' + VERSATZ_MAX + ' sein, nicht ' + JSON.stringify(kand.versatzTage));
  return v;
}

function fnv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function mulberry32(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

/* ---------- Die Sicht (eine je Reihe, Grenze `bis` wandert mit i) ---------- */
function Sicht(S, TF) {
  var bis = -1, verstoesse = 0, beispiele = [], spy = TF.spy || null, tage = TF.hatDatum ? (TF.tage || null) : null;
  function lese(arr, j) { if (j > bis || j < 0 || j >= S.n) { if (j > bis && j < S.n) { verstoesse++; if (beispiele.length < 5) beispiele.push(S.reihe + '@' + j + ' (erlaubt bis ' + bis + ')'); } return NaN; } return arr[j]; }
  /* Nr. 117: Kalenderdatum der Zeile j (JJJJ-MM-TT, TF.tage[S.tag[j]]) hinter derselben Schranke wie c(j). Die Monatsfunktionen lesen den
   * Kalender der Tafel NUR bis zur Schranke (Blick-nach-vorn-Regel, FORM.md §3): "letzter Handelstag im Monat" ist erst entschieden, wenn der
   * naechste Kalendertag der Tafel bekannt ist, also fuer j < bis; fuer j = bis null (unbekannt). "Erster Handelstag im Monat" braucht nur den
   * Vortag und ist fuer jedes j <= bis entschieden (am Kalenderanfang null). sicht.tage gibt es absichtlich nicht. */
  function monat(d) { return d.slice(0, 7); }
  function datum(j) { var t = lese(S.tag, j); if (t !== t || !tage) return NaN; var d = tage[t]; return d == null ? NaN : d; }
  function istLetzterHandelstagImMonat(j) {
    var t = lese(S.tag, j); if (t !== t || !tage || !(j < bis)) return null;
    var d = tage[t], n = tage[t + 1]; return (d == null || n == null) ? null : monat(n) !== monat(d);
  }
  function istErsterHandelstagImMonat(j) {
    var t = lese(S.tag, j); if (t !== t || !tage || t < 1) return null;
    var d = tage[t], v = tage[t - 1]; return (d == null || v == null) ? null : monat(v) !== monat(d);
  }
  return {
    n: S.n, reihe: S.reihe, lebend: S.lebend, quelle: TF.quelle, hochTief: TF.hochTief, hatRoh: !!TF.hatRoh, hatMarkt: !!TF.hatMarkt, hatDatum: !!tage,
    setzeBis: function (i) { bis = i; }, bis: function () { return bis; },
    datum: datum, istLetzterHandelstagImMonat: istLetzterHandelstagImMonat, istErsterHandelstagImMonat: istErsterHandelstagImMonat,
    tag: function (j) { return lese(S.tag, j); }, o: function (j) { return lese(S.o, j); }, h: function (j) { return lese(S.h, j); },
    l: function (j) { return lese(S.l, j); }, c: function (j) { return lese(S.c, j); }, v: function (j) { return lese(S.v, j); },
    /* Nr. 113: roher (unbereinigter) Schluss der Zeile j und bereinigter SPY-Schluss am KALENDERTAG der Zeile j - beide hinter derselben
     * Schranke (j > bis: NaN + Verstoss). Ohne Spalte NaN ohne Verstoss. SPY-Zeile zum Kalendertag ueber spy.nextPos (einmal je Tafel gebaut,
     * kanaele.js reiheAus); tag(j) <= tag(bis) fuer j <= bis, also kein Blick nach vorn. */
    roh: function (j) { var t = lese(S.tag, j); return (t === t && S.roh) ? S.roh[j] : NaN; },
    markt: function (j) { var t = lese(S.tag, j); if (t !== t || !spy || t >= spy.nextPos.length) return NaN; var p = spy.nextPos[t]; return (p >= 0 && spy.tag[p] === t) ? spy.c[p] : NaN; },
    klasse: function (j) { var k = lese(S.klasse, j); return k === k ? k : -1; },
    zulaessig: function (j) { if (j > bis || j < 0 || j >= S.n) { lese(S.klasse, j); return false; } return S.klasse[j] >= 0 && !S.mass[j]; },
    verstoesse: function () { return verstoesse; }, beispiele: function () { return beispiele; },
  };
}
/** Kunstkalender fuer Tests (Nr. 117): n Werktage (Mo-Fr, ohne Feiertage) ab 2020-01-02 als JJJJ-MM-TT. */
function kunstKalender(n) {
  var t = [], ms = Date.UTC(2020, 0, 2);
  while (t.length < n) { var d = new Date(ms), w = d.getUTCDay(); if (w !== 0 && w !== 6) t.push(d.toISOString().slice(0, 10)); ms += 86400000; }
  return t;
}
/** NUR FUER test.js der Kandidaten: Sicht auf Kunstspalten { tag, o, h, l, c, v, klasse?, mass?, roh? (Vorgabe = c), markt?, datum? } mit Grenze i.
 *  markt (Nr. 113) ist ein Array JE KALENDERINDEX (SPY-Schluss; null/NaN = kein SPY an dem Tag); ohne markt ist hatMarkt false und markt(j) NaN.
 *  datum (Nr. 117) ist ein Array JE KALENDERINDEX (JJJJ-MM-TT); ohne Angabe der Kunstkalender aus Werktagen ab 2020-01-02 (kunstKalender). */
function kunstSicht(spalten, i) {
  var markt = spalten.markt || null, datum = spalten.datum || null, nTage = Math.max.apply(null, spalten.tag) + 1;
  if (markt) nTage = Math.max(nTage, markt.length);
  if (datum) nTage = Math.max(nTage, datum.length);
  var tage = datum ? datum.slice() : kunstKalender(nTage);
  var S = C.reiheAus(spalten, nTage);
  S.reihe = spalten.reihe || 'KUNST'; S.klasse = Int8Array.from(spalten.klasse || new Array(S.n).fill(3)); S.mass = Uint8Array.from(spalten.mass || new Array(S.n).fill(0)); S.lebend = 1;
  S.roh = Float64Array.from(spalten.roh || spalten.c);
  var spy = null;
  if (markt) {
    var sp = { tag: [], o: [], h: [], l: [], c: [], v: [] };
    for (var t = 0; t < markt.length; t++) { var m = markt[t]; if (m == null || m !== m) continue; sp.tag.push(t); sp.o.push(m); sp.h.push(m); sp.l.push(m); sp.c.push(m); sp.v.push(0); }
    spy = C.reiheAus(sp, nTage); spy.reihe = 'SPY';
  }
  var s = Sicht(S, { quelle: 'kunst', hochTief: true, hatRoh: true, hatMarkt: !!spy, spy: spy, hatDatum: true, tage: tage }); s.setzeBis(i); return s;
}

/* ---------- Zellen ---------- */
function Zellen(nKonf, nTage) {
  var z = ARTEN.length * nKonf * nTage * N_K * 2;
  this.nKonf = nKonf; this.nTage = nTage;
  this.n = new Float64Array(z); this.su = new Float64Array(z); this.sr = new Float64Array(z); this.sd = new Float64Array(z);
  this.dn = GRUPPEN.map(function () { return new Float64Array(z); }); this.ds = GRUPPEN.map(function () { return new Float64Array(z); });
  this.tn = new Float64Array(nTage * POT_MAX_DAUER * N_K * 2); this.ts = new Float64Array(nTage * POT_MAX_DAUER * N_K * 2);
}
Zellen.prototype.idx = function (art, konf, tag, k, lebend) { return ((((art * this.nKonf + konf) * this.nTage + tag) * N_K) + k) * 2 + lebend; };
Zellen.prototype.topfIdx = function (tag, dauer, k, lebend) { return ((tag * POT_MAX_DAUER + (dauer - 1)) * N_K + k) * 2 + lebend; };
Zellen.prototype.add = function (i, dir, r, u, dauer, gruppe) {
  this.n[i]++; this.su[i] += u; this.sr[i] += dir * r; this.sd[i] += dauer;
  if (gruppe) { var g = GRUPPEN.indexOf(gruppe); if (g < 0) g = 2; this.dn[g][i]++; this.ds[g][i] += dir * r; }
};

/** Durchgang 1: Topf je (Tag, Dauer, Klasse, lebend) und zulaessige Reihen je Tag und Klasse (Trendkanal topfUndListen).
 *  mitTopf = false (Modus zeit): nur die Listen der zulaessigen Reihen je Tag (Zaehler unveraendert), die Topfsummen bleiben leer. */
function topf(TF, Z, zaehler, mitTopf) {
  var zulK = new Array(TF.nTage); for (var t = 0; t < TF.nTage; t++) zulK[t] = [[], [], [], []];
  TF.reihen.forEach(function (S, ri) {
    var mitKlasse = false;                                  /* A5 (Nr. 121-1): Reihen ohne jede Klasse und Zeilen je Klasse, nur gezaehlt */
    for (var p0 = 0; p0 < S.n; p0++) { var k0 = S.klasse[p0]; if (k0 >= 0) { mitKlasse = true; zaehler.zeilenJeKlasse[k0]++; } }
    if (!mitKlasse) zaehler.reihenOhneKlasse++;
    zaehler.reihen++;
    for (var p = 0; p < S.n; p++) {
      var k = S.klasse[p];
      if (k < 0) { zaehler.ohneKlasse++; continue; }
      if (S.mass[p]) { zaehler.massnahmen++; continue; }
      zaehler.zulaessig++; var tag = S.tag[p];
      if (tag > TF.maxTag) continue;
      zulK[tag][k].push(ri);
      if (mitTopf === false) continue;
      for (var d = 1; d <= POT_MAX_DAUER; d++) {
        var e = C.ertragLong(S, p, C.festAusstieg(S, p, d), S.lebend);
        if (!e) break;
        var idx = Z.topfIdx(tag, d, k, S.lebend); Z.tn[idx]++; Z.ts[idx] += e.r;
        if (e.delist) { for (var d2 = d + 1; d2 <= POT_MAX_DAUER; d2++) { var i2 = Z.topfIdx(tag, d2, k, S.lebend); Z.tn[i2]++; Z.ts[i2] += e.r; } break; }
      }
    }
  });
  return zulK;
}

/** GLOBALER zeitlicher Topf (Modus zeit von Nr. 118 bis Nr. 121-1; seitdem nur nachrichtlich und fuer den Rot-vor-Gruen-Nachweis): Mittel der
 *  Renditen (Eroeffnung -> Eroeffnung, ertragLong mit festAusstieg) aller Fenster der Dauer d derselben Reihe, deren Starttag zulaessig ist (Klasse
 *  da, kein Massnahmenfenster) und in [von, bis] liegt - OHNE Fenster, die sich mit einem Signalfenster der Reihe ueberschneiden: ES = aufsteigende
 *  Einstiegstage der Reihe, ausgeschlossen ist jeder Starttag t mit |t - e| < d fuer ein e aus ES (leeres ES: alle Fenster, die nachrichtliche Zahl
 *  "globaler Topf ohne Ausschluss"). Rechtszensierte und kurslose Fenster zaehlen nicht. Liefert { mittel (NaN ohne Fenster), n }.
 *  Fehler (Audit Nr. 120 A §3b/3c): bei unregelmaessigem Signalplan zeitlich verzerrt (fomc: Topf +0,90 gegen +0,30 aller Fenster), und seine
 *  Streuung fehlte im se - deshalb der lokale Topf. Funktion unveraendert. */
function zeitTopfGlobal(S, ES, d, von, bis) {
  var su = 0, n = 0, j = 0;
  for (var p = 0; p < S.n; p++) {
    var t = S.tag[p];
    if (t < von || t > bis) continue;
    if (S.klasse[p] < 0 || S.mass[p]) continue;
    while (j < ES.length && ES[j] <= t - d) j++;
    if (j < ES.length && ES[j] < t + d) continue;
    var e = C.ertragLong(S, p, C.festAusstieg(S, p, d), S.lebend);
    if (!e) continue;
    su += e.r; n++;
  }
  return { mittel: n > 0 ? su / n : NaN, n: n };
}
/** Ueberschneidet sich ein Fenster [t, t + d) mit einem Signalfenster [e, e + d) der Reihe (ES aufsteigend)? */
function ueberlappt(ES, t, d) {
  var lo = 0, hi = ES.length;
  while (lo < hi) { var m = (lo + hi) >> 1; if (ES[m] <= t - d) lo = m + 1; else hi = m; }
  return lo < ES.length && ES[lo] < t + d;
}

/** LOKALER Topf (Modus zeit, Nr. 121-1, FORM.md §3). Alle Indizes sind Tafelindizes (S.tag), nicht Zeilen der Reihe.
 *  Zulaessige Topf-Starttage t der Reihe S: t in [von, bis], Klasse da und (klassen gesetzt) in klassen, kein Massnahmentag, KEIN Fenster
 *  [t, t + H), das ein Signalfenster [e, e + H) schneidet (|t - e| < H fuer ein e aus ES, aufsteigend), Fenster nicht rechtszensiert/kurslos
 *  (ertragLong mit festAusstieg(S, t, H), Eroeffnung -> Eroeffnung wie der Trade; das Fenster darf ueber `bis` hinauslaufen wie der Trade).
 *  Jeder solche Starttag gehoert GENAU EINEM Zuordnungstag aus EP (aufsteigend, eindeutig): dem naechstgelegenen (kleinstes |t - e|,
 *  Gleichstand -> der fruehere), und nur bis zum Abstand radien[x]. Liefert je Radius ein Objekt { e -> [Summe, n] }; hist (Objekt, optional)
 *  zaehlt die Abstaende t - e der Fenster im ersten Radius. Die Toepfe zweier Zuordnungstage sind disjunkt. */
function lokalerTopf(S, ES, EP, H, radien, klassen, von, bis, hist) {
  var aus = radien.map(function () { return {}; }), rMax = Math.max.apply(null, radien), j = 0, q = -1;
  if (!EP.length) return aus;
  for (var p = 0; p < S.n; p++) {
    var t = S.tag[p];
    if (t < von) continue;
    if (t > bis) break;
    var k = S.klasse[p];
    if (k < 0 || S.mass[p]) continue;
    if (klassen && klassen.indexOf(k) === -1) continue;
    while (j < ES.length && ES[j] <= t - H) j++;
    if (j < ES.length && ES[j] < t + H) continue;
    while (q + 1 < EP.length && EP[q + 1] <= t) q++;
    var e, d;
    if (q < 0) { e = EP[0]; d = e - t; }
    else if (q + 1 < EP.length && EP[q + 1] - t < t - EP[q]) { e = EP[q + 1]; d = e - t; }
    else { e = EP[q]; d = t - e; }
    if (d > rMax) continue;
    var r = C.ertragLong(S, p, C.festAusstieg(S, p, H), S.lebend);
    if (!r) continue;
    for (var x = 0; x < radien.length; x++) if (d <= radien[x]) { var z = aus[x][e] || (aus[x][e] = [0, 0]); z[0] += r.r; z[1]++; }
    if (hist && d <= radien[0]) hist[t - e] = (hist[t - e] || 0) + 1;
  }
  return aus;
}
/** Mittel eines lokalen Topfs am Zuordnungstag e; NaN, wenn weniger als nMin (Vorgabe K.TOPF_N_MIN) Fenster (topfFehlt). */
function topfMittel(T, e, nMin) { var z = T[e]; return z && z[1] >= (nMin || K.TOPF_N_MIN) ? z[0] / z[1] : NaN; }
function eindeutig(arr) { var a = Int32Array.from(arr).sort(), o = []; for (var i = 0; i < a.length; i++) if (!o.length || o[o.length - 1] !== a[i]) o.push(a[i]); return o; }

/** Einen Trade buchen: Ertrag Long von ePos bis ausPos, gegen den Topf seiner Zelle - oder im Modus zeit gegen tpZeit: eine Zahl (lokaler
 *  Topf des Signals; NaN = topfFehlt) bzw. eine Funktion (dauer, tagE) (globaler Topf, Nr. 118, nur opt.topfArt 'global').
 *  Abgang einer Reihe, deren letzte Zeile der letzte Tag vor der Sperre ist (gesperrte Tafel): Gruppe "zensiert" (A7). */
function buche(TF, Z, art, kf, dir, S, ePos, ausPos, k, zaehler, tpZeit) {
  var e = C.ertragLong(S, ePos, ausPos, S.lebend);
  if (!e) { zaehler.ohneHorizont++; return null; }
  var dauer = Math.min(POT_MAX_DAUER, Math.max(1, e.dauer)), tagE = S.tag[ePos], tp;
  if (tagE > TF.maxTag) { zaehler.nachMaxTag++; return null; }
  if (typeof tpZeit === 'function') tp = tpZeit(dauer, tagE);
  else if (tpZeit != null) tp = tpZeit;
  else { var ti = Z.topfIdx(tagE, dauer, k, S.lebend); tp = Z.tn[ti] > 0 ? Z.ts[ti] / Z.tn[ti] : NaN; }
  if (tp !== tp) { zaehler.topfFehlt++; return null; }
  Z.add(Z.idx(art, kf, tagE, k, S.lebend), dir, e.r, dir * (e.r - tp), e.dauer, e.delist ? (zensiertAnSperre(TF, S) ? 'zensiert' : (S.gruppe || 'sonstige')) : null);
  return e;
}
/** A7: gesperrte Tafel und die letzte Zeile der Reihe ist der letzte Tag vor der Sperre -> die Reihe endet nur an der Sperre. */
function zensiertAnSperre(TF, S) { return !!TF.gesperrt && TF.sperrIdx != null && S.n > 0 && S.tag[S.n - 1] === TF.sperrIdx; }

function leererZaehler() {
  return { zulaessig: 0, ohneKlasse: 0, massnahmen: 0, signalAufrufe: 0, signale: 0, ohneBestaetigungstag: 0, abgelehnt: 0, cooldown: 0, ohneEinstieg: 0,
    einstiegMassnahmen: 0, richtungOhneKonfiguration: 0, gebucht: 0, ohneHorizont: 0, topfFehlt: 0, nachMaxTag: 0, placeboOhnePartner: 0, versatzOhneTag: 0, spaetOhneTag: 0,
    /* Nr. 121-1: cooldownDurchOhneKlasse (A13) = Signale, die der Cooldown eines Signals sperrte, dessen Klasse keine Konfiguration dieser Richtung
     * bucht; versatzUeberschneidung (B-V5) = verschobene Fenster, die ein Signalfenster der Reihe schneiden (nicht gewertet); reihen,
     * reihenOhneKlasse, zeilenJeKlasse (A5) */
    cooldownDurchOhneKlasse: 0, versatzUeberschneidung: 0, reihen: 0, reihenOhneKlasse: 0, zeilenJeKlasse: [0, 0, 0, 0] };
}

/** Phase 1 einer Reihe (Nr. 121-2a als Funktion herausgeloest, Schritte und Reihenfolge unveraendert): Sicht, Cooldown je Richtung, Bestaetigung,
 *  Einstiegstag. Liefert die Signale { dir, k, ePos, tagE }, ihre Einstiegstage und die Verstoesse - KEINE Rendite wird gelesen. */
function signaleSammeln(S, TF, regel, params, versatz, bucht, zaehler) {
  var sicht = Sicht(S, TF), letzt = { 1: null, '-1': null }, letztK = { 1: -1, '-1': -1 }, sigs = [], tagsE = [];
  for (var i = 0; i < S.n; i++) {
    var k = S.klasse[i];
    if (k < 0 || S.mass[i]) continue;
    if (i + 1 >= S.n) continue;
    sicht.setzeBis(i); zaehler.signalAufrufe++;
    var sig = regel.signal(sicht, i, params);
    if (!sig || !(sig.dir === 1 || sig.dir === -1)) continue;
    var dir = sig.dir, tagI = S.tag[i];
    if (letzt[dir] != null && tagI - letzt[dir] < K.COOLDOWN_TAGE) { zaehler.cooldown++; if (!bucht[dir][letztK[dir]]) zaehler.cooldownDurchOhneKlasse++; continue; }
    if (regel.bestaetigt) {
      if (i + 1 >= S.n) { zaehler.ohneBestaetigungstag++; continue; }
      sicht.setzeBis(i + 1);
      if (!regel.bestaetigt(sicht, i + 1, params, sig)) { zaehler.abgelehnt++; continue; }
    }
    var ePos = i + versatz;
    if (ePos >= S.n) { zaehler.ohneEinstieg++; continue; }
    if (S.mass[ePos]) { zaehler.einstiegMassnahmen++; continue; }
    letzt[dir] = tagI; letztK[dir] = k; zaehler.signale++;
    sigs.push({ dir: dir, k: k, ePos: ePos, tagE: S.tag[ePos] }); tagsE.push(S.tag[ePos]);
  }
  return { sigs: sigs, tagsE: tagsE, verstoesse: sicht.verstoesse(), beispiele: sicht.beispiele() };
}
/** bucht[dir][k]: bucht irgendeine Konfiguration dieser Richtung die Klasse k? */
function buchtTafel(konfs) {
  return { 1: [0, 1, 2, 3].map(function (k) { return konfs.some(function (c) { return c.richtung === 'long' && (!c.klassen || c.klassen.indexOf(k) !== -1); }); }),
    '-1': [0, 1, 2, 3].map(function (k) { return konfs.some(function (c) { return c.richtung === 'short' && (!c.klassen || c.klassen.indexOf(k) !== -1); }); }) };
}

/**
 * TROCKENZAEHLUNG OHNE RENDITEN (Nr. 121-2a, Machbarkeitstor A3 und Vorwaerts-Zaehlung C2): dieselbe Phase 1 wie messe (Sicht, Cooldown, Bestaetigung,
 * Einstiegstag), aber keine Buchung - kein Kurs nach dem Einstieg, keine Rendite, kein Topf. Je Konfiguration (Richtung, Klassen): Signaltage
 * n_T (verschiedene Einstiegstage in [von, bis]), Trades, Trades je Signaltag d, erster/letzter Signaltag; dazu der Anteil der zulaessigen Reihen
 * mit Signal am Signaltag und die Handelstage TE des Zeitraums. opt = { von (Index, Vorgabe 0), bis (Index, Vorgabe TF.maxTag), vollesFenster
 * (nur Einstiege mit tagE + H <= TF.maxTag: das Fenster liegt ganz in der Tafel - die Vorwaerts-Zaehlung), nurKeys }.
 */
function zaehle(TF, regel, kand, opt) {
  opt = opt || {};
  var t0 = Date.now(), konfs = kand.konfigurationen.filter(function (c) { return !opt.nurKeys || opt.nurKeys.indexOf(c.key) !== -1; }), params = kand.params || {};
  var von = opt.von || 0, bis = opt.bis != null ? Math.min(opt.bis, TF.maxTag) : TF.maxTag, zaehler = leererZaehler(), versatz = regel.bestaetigt ? 2 : 1, bucht = buchtTafel(kand.konfigurationen);
  var zulK = topf(TF, null, zaehler, false), sigTag = new Int32Array(TF.nTage), verstoesse = 0;
  var tageJe = konfs.map(function () { return {}; }), trades = konfs.map(function () { return 0; });
  TF.reihen.forEach(function (S) {
    var P1 = signaleSammeln(S, TF, regel, params, versatz, bucht, zaehler); verstoesse += P1.verstoesse;
    P1.sigs.forEach(function (sg) {
      if (sg.tagE < von || sg.tagE > bis) return;
      if (sg.tagE < sigTag.length && S.klasse[sg.ePos] >= 0) sigTag[sg.tagE]++;
      var richtung = sg.dir > 0 ? 'long' : 'short';
      konfs.forEach(function (c, kf) {
        if (c.richtung !== richtung || (c.klassen && c.klassen.indexOf(sg.k) === -1)) return;
        if (opt.vollesFenster && sg.tagE + c.haltedauer > TF.maxTag) return;
        tageJe[kf][sg.tagE] = (tageJe[kf][sg.tagE] || 0) + 1; trades[kf]++;
      });
    });
  });
  var su = 0, n = 0, ueber = 0, max = null;
  for (var t = von; t <= bis && t < TF.nTage; t++) {
    var zl = zulK[t][0].length + zulK[t][1].length + zulK[t][2].length + zulK[t][3].length;
    if (!(sigTag[t] > 0) || !(zl > 0)) continue;
    var a = sigTag[t] / zl; su += a; n++; if (max === null || a > max) max = a; if (a > 0.5) ueber++;
  }
  var ersteZeile = TF.nTage; TF.reihen.forEach(function (S) { if (S.n && S.tag[0] < ersteZeile) ersteZeile = S.tag[0]; });
  var TE = handelstage(TF, Math.max(von, ersteZeile), bis);
  return { konfigurationen: konfs.map(function (c, kf) {
    var tg = Object.keys(tageJe[kf]).map(Number).sort(function (x, y) { return x - y; }), nT = tg.length;
    return { key: c.key, H: c.haltedauer, richtung: c.richtung, nT: nT, nTr: trades[kf], d: nT ? trades[kf] / nT : null, ersterTag: nT ? TF.tage[tg[0]] : null, letzterTag: nT ? TF.tage[tg[nT - 1]] : null };
  }), signalAnteil: { tage: n, mittel: n ? su / n : null, max: max, tageUeber50: ueber }, TE: TE, von: TF.tage[von] || null, bis: TF.tage[bis] || null, letzterTag: TF.tage[TF.maxTag],
    reihen: TF.reihen.length, verstoesse: verstoesse, zaehler: zaehler, ms: Date.now() - t0, bewertung: kand.bewertung || 'topf', ohneRenditen: true };
}

/**
 * Messung. TF = Tafel (tafel.js), regel = { signal, bestaetigt? }, kand = kandidat.json (bewertung topf | zeit, Vorgabe topf),
 * opt = { schnitt (erster Tag nach der Entdeckung, Vorgabe K.EICHUNG.schnitt = Eichfenster) | iSchnitt (sein Kalenderindex) }.
 * Liefert { zellen, zaehler, verstoesse, beispiele, ms, konfs, bewertung, iSchnitt, sigTag, zulTag, ueberlappung } - alle Zahlen in Pp.
 * sigTag[t] = Reihen mit Einstieg am Kalendertag t, zulTag[t] = zulaessige Reihen an t (Kennzahl "Anteil der Reihen mit Signal am Signaltag");
 * ueberlappung je Konfiguration: verschobene Fenster (Entdeckung), die sich mit einem Signalfenster derselben Reihe ueberschneiden.
 */
function messe(TF, regel, kand, opt) {
  opt = opt || {};
  var konfs = kand.konfigurationen, params = kand.params || {}, nK = konfs.length, Z = new Zellen(nK, TF.nTage), zaehler = leererZaehler();
  var bewertung = kand.bewertung == null ? 'topf' : kand.bewertung;
  if (BEWERTUNGEN.indexOf(bewertung) === -1) throw new Error('kandidat.json: bewertung muss topf | zeit sein, nicht ' + JSON.stringify(kand.bewertung));
  var zeit = bewertung === 'zeit', iSchnitt = opt.iSchnitt != null ? opt.iSchnitt : indexAb(TF, opt.schnitt || K.EICHUNG.schnitt), versatzTage = versatzVon(kand);
  konfs.forEach(function (c) { if (!(c.haltedauer >= 1 && c.haltedauer <= 60)) throw new Error('Konfiguration ' + c.key + ': haltedauer 1..60 noetig'); if (c.richtung !== 'long' && c.richtung !== 'short') throw new Error('Konfiguration ' + c.key + ': richtung long|short'); });
  var t0 = Date.now(), zulK = topf(TF, Z, zaehler, !zeit), tTopf = Date.now() - t0;
  var sigTag = new Int32Array(TF.nTage), zulTag = new Int32Array(TF.nTage);
  for (var tz = 0; tz < TF.nTage; tz++) zulTag[tz] = zulK[tz][0].length + zulK[tz][1].length + zulK[tz][2].length + zulK[tz][3].length;
  var ueberlappung = { n: new Array(nK).fill(0), von: new Array(nK).fill(0) };
  if (zeit) zaehler.placeboEntfaellt = 0;
  var versatz = regel.bestaetigt ? 2 : 1, verstoesse = 0, beispiele = [];
  /* Modus zeit (Nr. 121-1): lokaler Topf je Signal; opt.topfArt 'global' = der globale Topf von Nr. 118 (nur Tests, Rot-vor-Gruen). Radien je
   * Konfiguration [R, 2 H, 8 H] (R = topfRadius, Vorgabe 4 H; 2 H / 8 H nachrichtlich als Sensitivitaet). zN zaehlt die nachrichtlichen Buchungen. */
  var topfArt = opt.topfArt || 'lokal', nMin = opt.topfNMin || K.TOPF_N_MIN;     /* topfNMin: nur Tests/Nachbau (Schwelle ist Setzung, konfig.js) */
  if (['lokal', 'global'].indexOf(topfArt) === -1) throw new Error('topfArt muss lokal | global sein');
  var bisEnt = Math.min(TF.maxTag, iSchnitt - 1), LEER = new Int32Array(0), zN = leererZaehler();
  var radien = konfs.map(function (c) { var H = c.haltedauer; return zeit ? [topfRadiusVon(kand, H), 2 * H, 8 * H] : null; });
  var detail = konfs.map(function (c, kf) { return { R: radien[kf] ? radien[kf][0] : null, nMin: nMin, topfN: {}, hist: {}, topfSumme: 0, topfTrades: 0, topfFehlt: 0 }; });
  /* bucht[dir][k]: bucht irgendeine Konfiguration dieser Richtung die Klasse k? (Zaehler cooldownDurchOhneKlasse, A13) */
  var bucht = buchtTafel(konfs);
  /** Lokale Toepfe einer Reihe je Konfiguration: Zuordnung je Zeitraum (Entdeckung: Einstiegstage <= bisEnt, Starttage 0..bisEnt; Pruefung: ab
   *  iSchnitt bis maxTag), Ausschluss ueber ALLE Einstiegstage ES der Reihe. Das verschobene Signal bekommt einen eigenen lokalen Topf derselben Bauart:
   *  Zuordnung zu den gewerteten verschobenen Einstiegstagen, Ausschluss ueber ES UND alle verschobenen Einstiegstage. */
  function zeitToepfe(S, sigs, ES) {
    var ESa = Array.prototype.slice.call(ES), EPe = eindeutig(ESa.filter(function (t) { return t <= bisEnt; })), EPp = eindeutig(ESa.filter(function (t) { return t >= iSchnitt && t <= TF.maxTag; }));
    return konfs.map(function (c, kf) {
      var H = c.haltedauer, kl = c.klassen || null, rad = radien[kf];
      var Te = lokalerTopf(S, ES, EPe, H, rad, kl, 0, bisEnt, detail[kf].hist), Tp = lokalerTopf(S, ES, EPp, H, rad, kl, iSchnitt, TF.maxTag, null);
      var EValle = [], EVok = [];
      sigs.forEach(function (sg) {
        if ((sg.dir > 0 ? 'long' : 'short') !== c.richtung || (kl && kl.indexOf(sg.k) === -1)) return;
        var pV = (sg.tagE + versatzTage < S.nextPos.length) ? S.nextPos[sg.tagE + versatzTage] : -1;
        if (pV < 0) return;
        var tV = S.tag[pV]; EValle.push(tV); if (!ueberlappt(ES, tV, H)) EVok.push(tV);
      });
      var ESV = Int32Array.from(ESa.concat(EValle)).sort();
      var Ve = lokalerTopf(S, ESV, eindeutig(EVok.filter(function (t) { return t <= bisEnt; })), H, [rad[0]], kl, 0, bisEnt, null)[0];
      var Vp = lokalerTopf(S, ESV, eindeutig(EVok.filter(function (t) { return t >= iSchnitt && t <= TF.maxTag; })), H, [rad[0]], kl, iSchnitt, TF.maxTag, null)[0];
      var G = {};
      return {
        topf: function (e, x) { return topfMittel((e < iSchnitt ? Te : Tp)[x || 0], e, nMin); },
        n: function (e) { var z = (e < iSchnitt ? Te : Tp)[0][e]; return z ? z[1] : 0; },
        topfV: function (t) { return topfMittel(t < iSchnitt ? Ve : Vp, t, nMin); },
        global: function (e) { var per = e < iSchnitt ? 0 : 1; if (G[per] === undefined) G[per] = zeitTopfGlobal(S, LEER, H, per ? iSchnitt : 0, per ? TF.maxTag : bisEnt).mittel; return G[per]; },
      };
    });
  }
  TF.reihen.forEach(function (S, ri) {
    /* Phase 1: Signale der Reihe sammeln (Sicht, Cooldown, Bestaetigung, Einstiegstag - unveraendert); die Einstiegstage ES sind im Modus zeit
     * die Ausschlussmenge des zeitlichen Topfs und in beiden Modi der Massstab fuer die Ueberlappung der verschobenen Fenster. */
    var P1 = signaleSammeln(S, TF, regel, params, versatz, bucht, zaehler), sigs = P1.sigs, tagsE = P1.tagsE;
    verstoesse += P1.verstoesse; P1.beispiele.forEach(function (b) { if (beispiele.length < 10) beispiele.push(b); });
    var ES = Int32Array.from(tagsE).sort(), TZ = null, zeitlichAlt = null;
    if (zeit && topfArt === 'global') {
      /* Nr. 118 (nur Rot-vor-Gruen, opt.topfArt 'global'): globaler zeitlicher Topf je Dauer und Zeitraum, einmal je Reihe gerechnet */
      var memo = {};
      zeitlichAlt = function (dauer, tagE) {
        var per = tagE < iSchnitt ? 0 : 1, key = dauer * 2 + per, m = memo[key];
        if (m === undefined) m = memo[key] = zeitTopfGlobal(S, ES, dauer, per ? iSchnitt : 0, per ? TF.maxTag : bisEnt);
        return m.mittel;
      };
    } else if (zeit) TZ = zeitToepfe(S, sigs, ES);
    /* Phase 2: buchen - je Signal dieselben Schritte wie zuvor (echt, spaet, versatz, placebo) */
    sigs.forEach(function (sg) {
      var dir = sg.dir, k = sg.k, ePos = sg.ePos, tagE = sg.tagE, richtung = dir > 0 ? 'long' : 'short', rng = mulberry32(fnv(kand.kennung + '|' + tagE + '|' + dir));
      if (tagE < sigTag.length && S.klasse[ePos] >= 0) sigTag[tagE]++;                 /* A14: nur zulaessige Einstiegszeilen (wie der Nenner zulTag) */
      var passend = 0;
      for (var kf = 0; kf < nK; kf++) {
        var c = konfs[kf];
        if (c.richtung !== richtung) continue;
        if (c.klassen && c.klassen.indexOf(k) === -1) continue;
        passend++;
        var T = TZ ? TZ[kf] : null, tpE = T ? T.topf(tagE, 0) : zeitlichAlt, vorTF = zaehler.topfFehlt;
        var ausPos = C.festAusstieg(S, ePos, c.haltedauer);
        var e = buche(TF, Z, 0, kf, dir, S, ePos, ausPos, k, zaehler, tpE);
        if (e) zaehler.gebucht++;
        if (T && tagE < iSchnitt) {
          var dt = detail[kf];
          if (zaehler.topfFehlt > vorTF) dt.topfFehlt++;
          if (e) {
            var nT = T.n(tagE); dt.topfN[nT] = (dt.topfN[nT] || 0) + 1; dt.topfSumme += tpE; dt.topfTrades++;
            /* nachrichtlich (Nr. 121-1): derselbe Trade gegen den globalen Topf ohne Ausschluss und gegen den lokalen Topf mit R = 2 H / 8 H */
            buche(TF, Z, 4, kf, dir, S, ePos, ausPos, k, zN, T.global(tagE));
            buche(TF, Z, 5, kf, dir, S, ePos, ausPos, k, zN, T.topf(tagE, 1));
            buche(TF, Z, 6, kf, dir, S, ePos, ausPos, k, zN, T.topf(tagE, 2));
          }
        }
        /* Gegenprobe 1 (A12, Nr. 121-1): Einstieg +1 T UND Ausstieg +1 T (gleiche Haltedauer) - beantwortet "sitzt der Effekt am ersten Tag?" auch
         * bei H1 (dort war "Einstieg +1 T bei festem Ausstieg" leer); Topf im Modus zeit = der lokale Topf des Signals */
        if (ePos + 1 < S.n) buche(TF, Z, 1, kf, dir, S, ePos + 1, C.festAusstieg(S, ePos + 1, c.haltedauer), k, zaehler, tpE); else zaehler.spaetOhneTag++;
        /* Gegenprobe 2: dasselbe Signal um versatzTage Handelstage verschoben (Vorgabe 20, kandidat.json versatzTage). B-V5 (Nr. 121-1, beide Modi):
         * ein verschobenes Fenster, das ein Signalfenster derselben Reihe schneidet (|t - e| < H), wird NICHT gewertet, aber gezaehlt - eine echte
         * Kante darf nicht als Messgeraet-Fehler gelesen werden, nur weil ihr Placebo in ihr eigenes naechstes Signal faellt. */
        var pV = (tagE + versatzTage < S.nextPos.length) ? S.nextPos[tagE + versatzTage] : -1;
        if (pV >= 0) {
          var tV = S.tag[pV], imEnt = tV < iSchnitt && tV <= TF.maxTag;
          if (imEnt) ueberlappung.von[kf]++;
          if (ueberlappt(ES, tV, c.haltedauer)) { zaehler.versatzUeberschneidung++; if (imEnt) ueberlappung.n[kf]++; }
          else buche(TF, Z, 2, kf, dir, S, pV, C.festAusstieg(S, pV, c.haltedauer), k, zaehler, T ? T.topfV(tV) : zeitlichAlt);
        } else zaehler.versatzOhneTag++;
        /* Gegenprobe 3: Placebo - anderer zulaessiger Wert, gleicher Tag, gleiche Klasse, gleiche Richtung; entfaellt im Modus zeit (dieselbe Zelle) */
        if (zeit) { zaehler.placeboEntfaellt++; continue; }
        var liste = tagE <= TF.maxTag ? zulK[tagE][k] : [];
        if (liste.length > 1) {
          var rP = ri; while (rP === ri) rP = liste[Math.floor(rng() * liste.length)];
          var P = TF.reihen[rP], pP = P.nextPos[tagE];
          if (pP >= 0 && P.tag[pP] === tagE) buche(TF, Z, 3, kf, dir, P, pP, C.festAusstieg(P, pP, c.haltedauer), P.klasse[pP] >= 0 ? P.klasse[pP] : k, zaehler);
        } else zaehler.placeboOhnePartner++;
      }
      if (!passend) zaehler.richtungOhneKonfiguration++;
    });
  });
  var tMessen = Date.now() - t0 - tTopf;
  return { zellen: Z, zaehler: zaehler, verstoesse: verstoesse, beispiele: beispiele, ms: { topf: tTopf, messen: tMessen }, konfs: konfs,
    bewertung: bewertung, versatzTage: versatzTage, iSchnitt: iSchnitt, sigTag: sigTag, zulTag: zulTag, ueberlappung: ueberlappung,
    topfArt: zeit ? topfArt : null, zeitDetail: zeit && topfArt !== 'global' ? detail : null };
}

/* ---------- Statistik (Trendkanal auswerten.js: tagesreihe, momente, statistik) ---------- */
/** Tagesreihe einer Zellenzeile; sicht 'alle' | 'lebend'. Je Tag: n, su, sr, sd, nh (Summe Huerden), nhF (Summe Eroeffnungshuerden, A17
 *  nachrichtlich: Huerde x Eroeffnungsfaktor je Klasse der Minutenstudie), dn/ds je Gruppe. */
function tagesreihe(Z, klassen, art, kf, sicht) {
  var aus = [], lVon = sicht === 'lebend' ? 1 : 0, nG = GRUPPEN.length;
  var hF = klassen.map(function (kl) { return kl.huerdeEroeffnung != null ? kl.huerdeEroeffnung : kl.huerde * (kl.eroeffnungFaktor || 1); });
  for (var t = 0; t < Z.nTage; t++) {
    var z = { t: t, n: 0, su: 0, sr: 0, sd: 0, nh: 0, nhF: 0, nK: [0, 0, 0, 0], dn: GRUPPEN.map(function () { return 0; }), ds: GRUPPEN.map(function () { return 0; }) };
    for (var k = 0; k < N_K; k++) for (var l = lVon; l <= 1; l++) {
      var i = Z.idx(art, kf, t, k, l), n = Z.n[i];
      if (!(n > 0)) continue;
      z.n += n; z.su += Z.su[i]; z.sr += Z.sr[i]; z.sd += Z.sd[i]; z.nK[k] += n; z.nh += n * klassen[k].huerde; z.nhF += n * hF[k];
      for (var g = 0; g < nG; g++) { z.dn[g] += Z.dn[g][i]; z.ds[g] += Z.ds[g][i]; }
    }
    if (!(z.n > 0)) continue;
    z.uBrutto = z.su / z.n; z.uNetto = (z.su - z.nh) / z.n; z.roh = z.sr / z.n; z.uNettoEroeffnung = (z.su - z.nhF) / z.n;
    aus.push(z);
  }
  return aus;
}
/** Momente einer Tagesreihe (x_t an Kalendertagen t): Mittel, naiv, Hansen-Hodrick (Rechteck bis Lag L-1), Block; se = HH, sonst Block. */
function momente(paare, L) {
  var n = paare.length, m = { n: n, mittel: null, sd: null, se: null, seNaiv: null, seHH: null, seBlock: null, nEff: null, hh0: false, t: null, obere: null, untere: null };
  if (!n) return m;
  var su = 0, i, j; for (i = 0; i < n; i++) su += paare[i].x;
  m.mittel = su / n;
  if (n < 2) return m;
  var x = new Float64Array(n), q = 0; for (i = 0; i < n; i++) { x[i] = paare[i].x - m.mittel; q += x[i] * x[i]; }
  m.sd = Math.sqrt(q / (n - 1)); if (m.sd <= 1e-12 * Math.max(1, Math.abs(m.mittel))) m.sd = 0;
  m.seNaiv = m.sd / Math.sqrt(n);
  L = Math.max(1, L || 1);
  var g0 = q / n, gamma = new Float64Array(L + 1);
  for (i = 0; i < n; i++) for (j = i + 1; j < n; j++) { var k = paare[j].t - paare[i].t; if (k > L) break; if (k >= 1) gamma[k] += x[i] * x[j]; }
  var lrv = g0; for (var k2 = 1; k2 <= L - 1; k2++) lrv += 2 * gamma[k2] / n;
  m.seHH = lrv > 0 ? Math.sqrt(lrv / n) : null;
  var bl = {}; for (i = 0; i < n; i++) { var b = Math.floor(paare[i].t / L), e = bl[b] || (bl[b] = { s: 0, n: 0 }); e.s += paare[i].x; e.n++; }
  var bm = Object.keys(bl).map(function (kk) { return bl[kk].s / bl[kk].n; });
  if (bm.length >= 2) { var mb = 0; bm.forEach(function (v) { mb += v; }); mb /= bm.length; var qb = 0; bm.forEach(function (v) { qb += (v - mb) * (v - mb); }); m.seBlock = Math.sqrt(qb / (bm.length - 1)) / Math.sqrt(bm.length); }
  m.nEff = n / L;
  if (m.seHH != null) m.se = m.seHH; else if (m.seBlock != null) { m.se = m.seBlock; m.hh0 = true; } else m.se = m.seNaiv;
  if (m.sd === 0) { m.se = 0; m.seHH = 0; m.seBlock = 0; }
  m.obere = m.mittel + 1.96 * m.se; m.untere = m.mittel - 1.96 * m.se;
  m.t = m.se > 0 ? m.mittel / m.se : (m.mittel === 0 ? 0 : null);
  return m;
}
function paare(zeilen, feld) { return zeilen.map(function (z) { return { t: z.t, x: z[feld] }; }); }
/** Kennzahlen einer Tagesmenge: Trades, Huerde je Trade, Abgaenge je Gruppe, uBrutto/uNetto/roh als Momente (Lag L). */
function statistik(zeilen, L) {
  var nG = GRUPPEN.length, N = 0, SU = 0, SR = 0, NH = 0, NHF = 0, SD = 0, nK = [0, 0, 0, 0], dn = GRUPPEN.map(function () { return 0; }), ds = GRUPPEN.map(function () { return 0; });
  zeilen.forEach(function (z) { N += z.n; SU += z.su; SR += z.sr; NH += z.nh; NHF += z.nhF || 0; SD += z.sd; for (var k = 0; k < N_K; k++) nK[k] += z.nK[k]; for (var g = 0; g < nG; g++) { dn[g] += z.dn[g]; ds[g] += z.ds[g]; } });
  var st = { nTage: zeilen.length, nTr: N, nK: nK, kKand: N > 0 ? NH / N : null, kKandEroeffnung: N > 0 ? NHF / N : null, dauerMittel: N > 0 ? SD / N : null,
    abgaenge: GRUPPEN.map(function (g, i) { return { gruppe: g, n: dn[i], mittel: dn[i] > 0 ? ds[i] / dn[i] : null }; }),
    uBrutto: momente(paare(zeilen, 'uBrutto'), L), uNetto: momente(paare(zeilen, 'uNetto'), L), roh: momente(paare(zeilen, 'roh'), L),
    uNettoEroeffnung: momente(paare(zeilen, 'uNettoEroeffnung'), L) };
  st.uNetto.jeTrade = N > 0 ? (SU - NH) / N : null; st.uBrutto.jeTrade = N > 0 ? SU / N : null; st.uNettoEroeffnung.jeTrade = N > 0 ? (SU - NHF) / N : null;
  return st;
}
function kurz(m) { return m ? { n: m.n, mittel: m.mittel, se: m.se, seNaiv: m.seNaiv, t: m.t, obere: m.obere, untere: m.untere, nEff: m.nEff, hh0: m.hh0, jeTrade: m.jeTrade } : null; }
function kurzSt(st) { return { nTage: st.nTage, nTr: st.nTr, nK: st.nK, kKand: st.kKand, kKandEroeffnung: st.kKandEroeffnung, dauerMittel: st.dauerMittel, abgaenge: st.abgaenge, uBrutto: kurz(st.uBrutto), uNetto: kurz(st.uNetto), roh: kurz(st.roh), uNettoEroeffnung: kurz(st.uNettoEroeffnung) }; }
/** Verteilungsfunktion der Student-t-Verteilung P(T <= t) mit df Freiheitsgraden (A16, Nr. 121-1): regularisierte unvollstaendige Beta-Funktion
 *  (Kettenbruch nach Numerical Recipes betacf), df > 0 auch nicht ganzzahlig. */
function tVerteilung(t, df) {
  if (!(df > 0) || t !== t) return NaN;
  var x = df / (df + t * t), ib = betaInc(x, df / 2, 0.5);           /* P(|T| > |t|) = I_x(df/2, 1/2) */
  return t >= 0 ? 1 - 0.5 * ib : 0.5 * ib;
}
function lnGamma(z) {
  var g = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  var x = z, y = z, tmp = x + 5.5; tmp -= (x + 0.5) * Math.log(tmp); var ser = 1.000000000190015;
  for (var j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log(2.5066282746310005 * ser / x);
}
function betaInc(x, a, b) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  var bt = Math.exp(lnGamma(a + b) - lnGamma(a) - lnGamma(b) + a * Math.log(x) + b * Math.log(1 - x));
  return x < (a + 1) / (a + b + 2) ? bt * betaCf(x, a, b) / a : 1 - bt * betaCf(1 - x, b, a) / b;
}
function betaCf(x, a, b) {
  var qab = a + b, qap = a + 1, qam = a - 1, c = 1, d = 1 - qab * x / qap; if (Math.abs(d) < 1e-300) d = 1e-300; d = 1 / d; var h = d;
  for (var m = 1; m <= 300; m++) {
    var m2 = 2 * m, aa = m * (b - m) * x / ((qam + m2) * (a + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d; h *= d * c;
    aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
    d = 1 + aa * d; if (Math.abs(d) < 1e-300) d = 1e-300; c = 1 + aa / c; if (Math.abs(c) < 1e-300) c = 1e-300; d = 1 / d;
    var del = d * c; h *= del; if (Math.abs(del - 1) < 3e-16) break;
  }
  return h;
}

/**
 * Auswertung (Entdeckung; mit opt.pruefung auch die Pruefzeit fuer die genannten Kandidaten).
 * M = messe(...); iSchnitt = erster Kalendertag der Pruefzeit. TE/TB = Handelstage je Zeitraum fuer die projizierte se_B (Nr. 109).
 */
function auswerte(M, TF, opt) {
  opt = opt || {};
  var Z = M.zellen, KL = TF.klassen, iSchnitt = opt.iSchnitt, TE = opt.TE, TB = opt.TB, aus = [], zeit = M.bewertung === 'zeit';
  var ent = function (z) { return z.t < iSchnitt; }, prf = function (z) { return z.t >= iSchnitt; };
  M.konfs.forEach(function (c, kf) {
    var L = c.haltedauer, echt = tagesreihe(Z, KL, 0, kf, 'alle'), lebend = tagesreihe(Z, KL, 0, kf, 'lebend');
    var e = statistik(echt.filter(ent), L), eL = statistik(lebend.filter(ent), L);
    var sp = statistik(tagesreihe(Z, KL, 1, kf, 'alle').filter(ent), L), vs = statistik(tagesreihe(Z, KL, 2, kf, 'alle').filter(ent), L);
    var pl = statistik(tagesreihe(Z, KL, 3, kf, 'alle').filter(ent), L);
    var seB = (e.uNetto.se != null && TE > 0 && TB > 0) ? e.uNetto.se * Math.sqrt(TE / TB) : null, mdeB = seB != null ? 2 * seB : null;
    var tor1 = e.uNetto.mittel != null && mdeB != null && e.uNetto.mittel > 0 && e.uNetto.mittel >= K.TOR1_FAKTOR * mdeB;
    /* Placebo "anderer Wert gleicher Klasse" gibt es nur im Modus topf; im Modus zeit entfaellt er (traefe dieselbe Zelle) und wird so ausgewiesen */
    var plV = !zeit && pl.uBrutto.mittel != null && pl.uBrutto.se != null && Math.abs(pl.uBrutto.mittel) > K.PLACEBO_T * pl.uBrutto.se && Math.abs(pl.uBrutto.mittel) > K.PLACEBO_ANTEIL_HUERDE * (e.kKand || KL[3].huerde);
    var ueb = M.ueberlappung ? { n: M.ueberlappung.n[kf], von: M.ueberlappung.von[kf], anteil: M.ueberlappung.von[kf] > 0 ? M.ueberlappung.n[kf] / M.ueberlappung.von[kf] : null } : null;
    var gruende = [];
    if (!(e.nTage >= K.MIN_TAGE)) gruende.push('< ' + K.MIN_TAGE + ' Signaltage');
    if (!(e.uNetto.mittel > 0)) gruende.push('netto <= 0');
    if (!(e.uNetto.t >= K.KANDIDAT_T)) gruende.push('t < ' + K.KANDIDAT_T);
    /* Nr. 121-2a A1: Tor 1 ist KEIN Kriterium mehr (tor1, tor1Schwelle bleiben nachrichtlich im Protokoll, zum Vergleich mit Messungen vor dem
     * 23.10.2026); vor dem Lauf steht das Machbarkeitstor (laeufer.js machbarkeitsPhase, tore.js). */
    if (plV) gruende.push('Placebo-Verstoss');
    var kandidat = gruende.length === 0;
    /* A3 (Nr. 121-1, beide Modi): Sperrklinke auf das verschobene Signal ZWEISEITIG, dieselbe Regel wie der Placebo "anderer Wert": |u brutto| > PLACEBO_T se
     * und > PLACEBO_ANTEIL_HUERDE x mittlere Huerde der Signaltrades -> Messgeraet-Fehler (laeufer.js urteile). Gewertet werden nur verschobene Fenster
     * ohne Ueberschneidung mit einem Signalfenster der Reihe (B-V5, messe). `wirkt` = `verstoss` (gleiche Bedeutung, Feld bleibt fuer alte Leser). */
    var vsSchranke = K.PLACEBO_ANTEIL_HUERDE * (e.kKand || KL[3].huerde);
    var vsV = vs.uBrutto.mittel != null && vs.uBrutto.se != null && Math.abs(vs.uBrutto.mittel) > K.PLACEBO_T * vs.uBrutto.se && Math.abs(vs.uBrutto.mittel) > vsSchranke;
    var urteil = kandidat ? 'Kandidat' : (e.uNetto.obere != null && e.uNetto.obere < 0 && e.nTage >= K.MIN_TAGE) ? 'nein' : 'nicht entscheidbar';
    var z1 = K.MDE_FAKTOR;
    var k = { key: c.key, richtung: c.richtung, haltedauer: c.haltedauer, klassen: c.klassen || null,
      entdeckung: kurzSt(e), lebend: { uNetto: kurz(eL.uNetto), nTr: eL.nTr, deltaAlleLebend: (e.uBrutto.mittel != null && eL.uBrutto.mittel != null) ? e.uBrutto.mittel - eL.uBrutto.mittel : null },
      spaet: { uNetto: kurz(sp.uNetto), nTr: sp.nTr, art: 'Einstieg +1 T, Ausstieg +1 T (gleiche Haltedauer)' },
      versatz: { uNetto: kurz(vs.uNetto), uBrutto: kurz(vs.uBrutto), nTr: vs.nTr, wirkt: vsV, verstoss: vsV, schranke: { t: K.PLACEBO_T, mindestPp: vsSchranke, zweiseitig: true }, ueberlappung: ueb },
      placebo: zeit ? { entfaellt: true, grund: 'entfaellt im Modus zeit: ein anderer Wert gleicher Klasse am selben Tag traefe dieselbe Zelle (den Markttag); Placebo ist das um ' + (M.versatzTage || K.VERSATZ_TAGE) + ' Handelstage verschobene Signal', uBrutto: null, nTr: 0, schranke: null, verstoss: false }
        : { uBrutto: kurz(pl.uBrutto), nTr: pl.nTr, schranke: { t: K.PLACEBO_T, mindestPp: K.PLACEBO_ANTEIL_HUERDE * (e.kKand || KL[3].huerde) }, verstoss: plV },
      TE: TE, TB: TB, seBproj: seB, mdeBproj: mdeB, tor1: tor1, tor1Schwelle: mdeB != null ? K.TOR1_FAKTOR * mdeB : null,
      /* A4 / B-V8: Tor 1 als t-Wert (Schwelle / se der Entdeckung, gesperrt 4 x 2 x Wurzel 2 = 11,31) neben MDE80 = 2,8016 se - zwei Zahlen, zwei Namen */
      tor1FaktorSe: (mdeB != null && e.uNetto.se > 0) ? K.TOR1_FAKTOR * mdeB / e.uNetto.se : null,
      mde80: e.uNetto.se != null ? z1 * e.uNetto.se : null, kandidat: kandidat, gruende: gruende, urteil: urteil };
    k.entdeckung.tradesJeTag = e.nTage > 0 ? e.nTr / e.nTage : null;      /* Nr. 118: die Aufloesung haengt an den Signaltagen (Cluster), nicht an den Trades */
    if (zeit) k.zeitTopf = zeitTopfBericht(M, Z, KL, kf, L, ent);
    if (opt.pruefung && opt.pruefung.indexOf(c.key) !== -1) {
      var b = statistik(echt.filter(prf), L);
      k.pruefung = kurzSt(b);
      k.pruefung.tradesJeTag = b.nTage > 0 ? b.nTr / b.nTage : null;
      k.pruefung.mde80 = b.uNetto.se != null ? z1 * b.uNetto.se : null;
      k.pruefung.gleicheRichtung = b.uNetto.mittel != null && e.uNetto.mittel != null && Math.sign(b.uNetto.mittel) === Math.sign(e.uNetto.mittel);
      /* A16 (Nr. 121-1): p einseitig aus der t-Verteilung mit df = n_eff - 1 (n_eff = Signaltage / H; mindestens 1) statt Phi; Phi nachrichtlich */
      var nEffB = b.uNetto.nEff, dfB = nEffB != null ? Math.max(1, nEffB - 1) : null;
      k.pruefung.nEff = nEffB; k.pruefung.df = dfB;
      k.pruefung.pEinseitig = (b.uNetto.t != null && dfB != null) ? 1 - tVerteilung(b.uNetto.t, dfB) : null;
      k.pruefung.pEinseitigNormal = b.uNetto.t != null ? 1 - phi(b.uNetto.t) : null;
    }
    aus.push(k);
  });
  return aus;
}
/** Bericht des lokalen Topfs einer Konfiguration (Modus zeit, Entdeckung, ergebnis.json `zeitTopf`): Topf-n je Trade (Median, Min, Max,
 *  Verteilung), Histogramm der Topf-Starttage relativ zum Signal (t - e, alle zugeordneten Fenster), Topf-Mittel je Trade, topfFehlt, HH-Lag,
 *  nachrichtlich der Ueberschuss gegen den globalen Topf ohne Ausschluss und die Sensitivitaet R = 2 H / 8 H (kein Urteil). */
function zeitTopfBericht(M, Z, KL, kf, L, ent) {
  if (!M.zeitDetail) return { art: M.topfArt || 'global' };
  var dt = M.zeitDetail[kf], ns = Object.keys(dt.topfN).map(Number).sort(function (a, b) { return a - b; }), tot = 0, med = null, lauf = 0;
  ns.forEach(function (n) { tot += dt.topfN[n]; });
  for (var i = 0; i < ns.length; i++) { lauf += dt.topfN[ns[i]]; if (med === null && lauf * 2 >= tot) med = ns[i]; }
  function zeile(art) { var s = statistik(tagesreihe(Z, KL, art, kf, 'alle').filter(ent), L); return { nTage: s.nTage, nTr: s.nTr, uBrutto: kurz(s.uBrutto), uNetto: kurz(s.uNetto) }; }
  var hist = Object.keys(dt.hist).map(Number).sort(function (a, b) { return a - b; }).map(function (o) { return [o, dt.hist[o]]; });
  return { art: 'lokal', R: dt.R, nMin: dt.nMin, hhLag: L, topfN: { trades: tot, median: med, min: ns.length ? ns[0] : null, max: ns.length ? ns[ns.length - 1] : null, anteilN1: tot ? (dt.topfN[1] || 0) / tot : null, verteilung: dt.topfN },
    topfFehlt: dt.topfFehlt, topfMittel: dt.topfTrades ? dt.topfSumme / dt.topfTrades : null, histogramm: hist,
    global: zeile(4), sensitivitaet: { R2H: Object.assign({ R: 2 * L }, zeile(5)), R8H: Object.assign({ R: 8 * L }, zeile(6)) }, zufallsplanRang: 'nicht gerechnet' };
}
/** Verteilungsfunktion der Standardnormalverteilung (erfc nach Numerical Recipes, Fehler < 1,2e-7). */
function phi(z) {
  var x = Math.abs(z) / Math.SQRT2, t = 1 / (1 + 0.5 * x);
  var r = t * Math.exp(-x * x - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277)))))))));
  var erfc = z >= 0 ? r : 2 - r;                      /* erfc(z / sqrt 2); Phi(z) = 1 - erfc(z / sqrt 2) / 2 */
  return 1 - 0.5 * erfc;
}
/** Handelstage mit mindestens einer zulaessigen Reihenzeile in [von, bis] (Kalenderindizes). */
function handelstage(TF, von, bis) {
  var da = new Uint8Array(TF.nTage);
  TF.reihen.forEach(function (S) { for (var p = 0; p < S.n; p++) if (S.klasse[p] >= 0 && !S.mass[p]) da[S.tag[p]] = 1; });
  var n = 0; for (var t = Math.max(0, von); t <= Math.min(bis, TF.nTage - 1); t++) if (da[t]) n++;
  return n;
}

/** Erster Kalenderindex >= datum. */
function indexAb(TF, datum) { for (var i = 0; i < TF.tage.length; i++) if (TF.tage[i] >= datum) return i; return TF.tage.length; }

/** Kennzahl (Nr. 118, Fehlerform "Tagestopf loescht marktweite Effekte"): Anteil der zulaessigen Reihen mit Einstieg am Signaltag, ueber die
 *  Signaltage der Entdeckung (t < iSchnitt, t <= maxTag): { tage, mittel, max, tageUeber50 }. Ohne Signaltag: tage 0, Rest null. */
function signalAnteil(M, TF) {
  var su = 0, n = 0, max = null, ueber = 0, bis = Math.min(TF.maxTag, M.iSchnitt - 1);
  for (var t = 0; t <= bis && t < M.sigTag.length; t++) {
    if (!(M.sigTag[t] > 0) || !(M.zulTag[t] > 0)) continue;
    var a = M.sigTag[t] / M.zulTag[t]; su += a; n++; if (max === null || a > max) max = a; if (a > 0.5) ueber++;
  }
  return { tage: n, mittel: n ? su / n : null, max: max, tageUeber50: ueber };
}
/** Warnungen fuer das Protokoll (FORM.md §3, Grenzfall): topf bei einer Regel, die im Mittel mehr als die Haelfte der Reihen am Signaltag
 *  trifft (der Tagestopf loescht den Effekt); zeit bei einer Regel, die das nicht tut (der Ueberschuss enthaelt den Markttag). */
function warnungen(bewertung, SA) {
  var w = [];
  if (!SA || !(SA.tage > 0)) return w;
  var pz = function (x) { return (100 * x).toFixed(0) + ' %'; };
  if (bewertung === 'topf' && SA.mittel > 0.5) w.push('Bewertung topf, aber die Regel trifft im Mittel ' + pz(SA.mittel) + ' der zulaessigen Reihen am Signaltag (' + SA.tageUeber50 + ' von ' + SA.tage + ' Signaltagen ueber 50 %): der Tagestopf loescht einen marktweiten Effekt, der Ueberschuss ist per Bau ~0 (Fehlerform "Tagestopf loescht marktweite Effekte") - Bewertung zeit erwaegen (FORM.md §3).');
  if (bewertung === 'zeit' && !(SA.mittel > 0.5)) w.push('Bewertung zeit, aber die Regel trifft im Mittel nur ' + pz(SA.mittel) + ' der zulaessigen Reihen am Signaltag (' + SA.tageUeber50 + ' von ' + SA.tage + ' Signaltagen ueber 50 %): der Ueberschuss gegen den zeitlichen Topf enthaelt den Markttag; eine Querschnittsregel gehoert in die Bewertung topf (FORM.md §3).');
  return w;
}

/**
 * Ein ganzer Lauf: Tafel oeffnen, messen, auswerten. opt: quelle, pruefzeit, siegelPfad, schnitt (Vorgabe K.EICHUNG.schnitt),
 * pruefung (Liste der Kandidaten-Keys), nurReihen, ohneSpeicherpruefung, tafel (fertige Tafel, nur Tests), topfArt (Modus zeit: lokal | global, nur Tests).
 */
function lauf(regel, kand, opt) {
  opt = opt || {};
  var TF = opt.tafel || require('../tafel.js').oeffne(opt);
  if (!TF.hochTief && regel.brauchtHochTief) throw new Error('MESSGERAET: die Regel braucht Hoch/Tief, die Quelle ' + TF.quelle + ' hat sie nicht');
  if (!TF.hatRoh && regel.brauchtRoh) throw new Error('MESSGERAET: die Regel braucht den rohen Schluss (roh), die Quelle ' + TF.quelle + ' hat ihn nicht');
  if (!TF.hatMarkt && regel.brauchtMarkt) throw new Error('MESSGERAET: die Regel braucht die Marktreihe (markt = SPY), die Quelle ' + TF.quelle + ' hat sie nicht');
  if (!TF.hatDatum && regel.brauchtDatum) throw new Error('MESSGERAET: die Regel braucht das Kalenderdatum (datum, Monatsfunktionen), die Quelle ' + TF.quelle + ' hat keinen Kalender');
  /* Nr. 121-2a C1: schnitt 'panelende' = Entdeckung bis zum letzten Tag der Tafel, keine Pruefzeit (die Bestaetigung ist vorwaerts) */
  var iSchnitt = opt.schnitt === 'panelende' ? TF.maxTag + 1 : indexAb(TF, opt.schnitt || K.EICHUNG.schnitt);
  var ersteZeile = TF.nTage; TF.reihen.forEach(function (S) { if (S.n && S.tag[0] < ersteZeile) ersteZeile = S.tag[0]; });
  /* TB nur noch fuer die nachrichtliche Tor-1-Schwelle: gesperrt oder ohne Pruefzeit (panelende) wie bisher TE / 2 (= 11,31 x se) */
  var TE = handelstage(TF, ersteZeile, iSchnitt - 1), TB = (TF.gesperrt || iSchnitt > TF.maxTag) ? Math.max(1, Math.round(TE * (opt.tbAnteil || 0.5))) : handelstage(TF, iSchnitt, TF.maxTag);
  if (TF.gesperrt && opt.tbHandelstage) TB = opt.tbHandelstage;
  var M = messe(TF, regel, kand, { iSchnitt: iSchnitt, topfArt: opt.topfArt, topfNMin: opt.topfNMin, einsaat: opt.einsaat });
  var konf = auswerte(M, TF, { iSchnitt: iSchnitt, TE: TE, TB: TB, pruefung: opt.pruefung || null, registerM: opt.registerM });
  var SA = signalAnteil(M, TF);
  return { quelle: TF.quelle, kennungTafel: TF.kennung, gesperrt: TF.gesperrt, siegel: TF.siegel, hatRoh: !!TF.hatRoh, hatMarkt: !!TF.hatMarkt, hatDatum: !!TF.hatDatum, reihen: TF.reihen.length, nTage: TF.nTage,
    letzterTag: TF.tage[TF.maxTag], schnitt: opt.schnitt === 'panelende' ? null : (TF.tage[iSchnitt] || null), entdeckungBis: TF.tage[Math.min(TF.maxTag, iSchnitt - 1)], registerM: opt.registerM == null ? null : opt.registerM, TE: TE, TB: TB, zaehler: M.zaehler, verstoesse: M.verstoesse, beispiele: M.beispiele, ms: M.ms,
    bewertung: M.bewertung, topfArt: M.topfArt, bewertungDetail: bewertungDetail(M.bewertung, M.versatzTage), versatzTage: M.versatzTage, signalAnteil: SA, warnungen: warnungen(M.bewertung, SA),
    konfigurationen: konf, klassen: TF.klassen.map(function (k) { return { name: k.name, huerde: k.huerde }; }) };
}

module.exports = { lauf: lauf, messe: messe, zaehle: zaehle, signaleSammeln: signaleSammeln, auswerte: auswerte, Sicht: Sicht, kunstSicht: kunstSicht, kunstKalender: kunstKalender, Zellen: Zellen, momente: momente, statistik: statistik,
  tagesreihe: tagesreihe, phi: phi, handelstage: handelstage, indexAb: indexAb, fnv: fnv, mulberry32: mulberry32, ARTEN: ARTEN, GRUPPEN: GRUPPEN, POT_MAX_DAUER: POT_MAX_DAUER,
  zeitTopfGlobal: zeitTopfGlobal, lokalerTopf: lokalerTopf, topfMittel: topfMittel, topfRadiusVon: topfRadiusVon, zensiertAnSperre: zensiertAnSperre, tVerteilung: tVerteilung, ueberlappt: ueberlappt, signalAnteil: signalAnteil, warnungen: warnungen, bewertungDetail: bewertungDetail, versatzVon: versatzVon,
  BEWERTUNGEN: BEWERTUNGEN, VERSATZ_MIN: VERSATZ_MIN, VERSATZ_MAX: VERSATZ_MAX };

/* Kalibrierung (FORM §3, Auftrag §3): node --max-old-space-size=6144 pruefstrasse/adapter/tag.js --kalibrierung [<ausgabe.json>]
 * Donchian-20-Ausbruch long, H5 auf den Tagesdateien der Trendkanal-Studie mit DEREN Schnitt (Bestaetigung ab 07.02.2023, Siegel
 * nicht noetig, weil nur die Tafel gelesen wird - die Trendkanal-Zahlen liegen offen in ERGEBNIS.md). */
if (require.main === module && process.argv.indexOf('--kalibrierung') !== -1) {
  var fs = require('fs');
  var ordner = path.join(K.WARTESCHLANGE, 'donchian20-ausbruch-long');
  var regel = require(path.join(ordner, 'regel.js')), kand = JSON.parse(fs.readFileSync(path.join(ordner, 'kandidat.json'), 'utf8'));
  var kal = JSON.parse(JSON.stringify(kand)); kal.konfigurationen = kand.konfigurationen.filter(function (c) { return c.key === 'H5' || c.key === 'H10'; });
  var TRENDKANAL_SCHNITT = '2023-02-07';
  /* Die Tafel wird zur Kalibrierung ganz gelesen (pruefzeit) - mit dem Siegel der FORM.md, denn gelesen wird nur fuer die Eichung
   * gegen veroeffentlichte Zahlen; der Laeufer selbst oeffnet die Pruefzeit nur mit Siegel 2 des Kandidaten. */
  var E = lauf(regel, kal, { quelle: 'trendkanal-tage', pruefzeit: true, siegelPfad: 'pruefstrasse/FORM.md', schnitt: TRENDKANAL_SCHNITT, pruefung: ['H5', 'H10'] });
  var out = process.argv[process.argv.indexOf('--kalibrierung') + 1];
  if (out && out[0] !== '-') fs.writeFileSync(out, JSON.stringify(E, null, 1));
  E.konfigurationen.forEach(function (k) {
    var e = k.entdeckung, b = k.pruefung;
    console.log(k.key + ' Ent nTage ' + e.nTage + ' nTr ' + e.nTr + ' u brutto ' + e.uBrutto.mittel.toFixed(4) + ' u netto ' + e.uNetto.mittel.toFixed(4) + ' t ' + e.uNetto.t.toFixed(2) +
      ' | Bes nTage ' + b.nTage + ' nTr ' + b.nTr + ' u brutto ' + b.uBrutto.mittel.toFixed(4) + ' u netto ' + b.uNetto.mittel.toFixed(4) + ' t ' + b.uNetto.t.toFixed(2) + ' seHH ' + b.uNetto.se.toFixed(4));
  });
  console.log('Zaehler ' + JSON.stringify(E.zaehler) + ' Verstoesse ' + E.verstoesse + ' ms ' + JSON.stringify(E.ms));
}
