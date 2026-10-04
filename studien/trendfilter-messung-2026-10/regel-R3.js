'use strict';
/* Trendfilter-Messung — Signal der Regel R3 „200 Tage nach Siegel, 1-%-Band" (REGEL.md §1, §4.3, §4.4, §7 N3; Siegel 6f9d06f).
 *
 * Nur das Signal; Buch, Kosten, Ausschuettungen und Kennzahlen stehen in kern.js.
 *
 *   SMA200(d) = Mittel der SPY-SCHLUSSKURSE D.reihen.SPY.c der 200 Kalendertage d-199 .. d (einschliesslich d). Kurs, nicht
 *               Gesamtertrag (Original: Kursindex Dow Jones); Ausschuettungen wirken auf das Signal NICHT. Jedes Mittel wird neu
 *               aus seinen 200 Werten summiert (aufsteigend d-199 .. d, dann / 200) - keine laufende Summe, also kein Fehler, der
 *               sich ueber Jahrzehnte aufaddiert.
 *   Anfang:     am ersten Tag mit 200 Schlusskursen (Index 199) „investiert", wenn C > SMA200, sonst „draussen".
 *   Danach:     investiert -> draussen, wenn C(d) <= 0,99 x SMA200(d); draussen -> investiert, wenn C(d) >= 1,01 x SMA200(d).
 *               Zwischen den Baendern bleibt der Zustand (Hysterese). Vergleich genau in der Form der REGEL: C <= 0.99 * sma.
 *   Ausfuehrung: ziel[i] = Zustand nach dem Schluss von i-1, gehalten ab der Eroeffnung von i (§4.3 „Ausfuehrung zur
 *               Eroeffnung von d+1"). ziel[0..199] = null; ziel[200] = Zustand nach Tag 199.
 *   N3 (opt.ohneBand): ohne Gedaechtnis, ziel[i+1] = C(i) > SMA200(i) ? 'SPY' : opt.geld.
 *
 * Der Zustand haengt nur an der Geschichte, nicht am Starttag (§4.3); §4.4 (Starttag s haelt ziel[s]) erledigt kern.js.
 * opt = { geld: 'BIL'|'SHY', ohneBand: true|undefined } (K.HAUPT / K.ERSATZ, weitere Felder werden nicht gelesen).
 * Das Ziel ist auch dann opt.geld, wenn die Geldreihe an dem Tag noch keinen Kurs hat (BIL erst ab 2007); das Signal haengt
 * nur an SPY. In den Fenstern A, B und im Zusatz (ab 2003-10, SHY) spielt das keine Rolle.
 *
 * Aufruf als Skript:  node studien/trendfilter-messung-2026-10/regel-R3.js
 * schreibt signale-R3.json (nur Signal: Wechseltage und C/SMA200, keine Kurse, keine Ertraege). */

var FENSTER = 200;
var BAND_AUS = 0.99;
var BAND_EIN = 1.01;

/** Mittel der Schlusskurse c[d-199 .. d], neu summiert (aufsteigend). */
function sma200(c, d) {
  var s = 0;
  for (var k = d - FENSTER + 1; k <= d; k++) s += c[k];
  return s / FENSTER;
}

/** Gemeinsamer Lauf fuer signal und details: Ziel-Feld, Zustandswechsel und Anfangszustand. */
function lauf(D, opt) {
  if (!D || !D.reihen || !D.reihen.SPY) throw new Error('R3: SPY fehlt');
  if (!opt || typeof opt.geld !== 'string' || !opt.geld) throw new Error('R3: opt.geld fehlt');
  var geld = opt.geld;
  var ohneBand = !!opt.ohneBand;
  var c = D.reihen.SPY.c;
  var n = D.n;
  var ziel = new Array(n).fill(null);
  var wechsel = [];
  var anfang = null;
  if (n < FENSTER) return { ziel: ziel, wechsel: wechsel, anfang: anfang };
  for (var k = 0; k < n; k++) {
    if (!(c[k] > 0) || !isFinite(c[k])) throw new Error('R3: SPY ohne Schlusskurs am Kalendertag ' + D.tage[k]);
  }
  var drin = false;
  for (var d = FENSTER - 1; d < n; d++) {
    var sma = sma200(c, d);
    var cd = c[d];
    var neu;
    if (ohneBand || d === FENSTER - 1) neu = cd > sma;
    else if (drin) neu = !(cd <= BAND_AUS * sma);
    else neu = cd >= BAND_EIN * sma;
    var reihe = neu ? 'SPY' : geld;
    if (d === FENSTER - 1) {
      anfang = { tag: D.tage[d], i: d, verhaeltnis: cd / sma, neu: reihe };
    } else if (neu !== drin) {
      wechsel.push({ tag: D.tage[d], i: d, ausfuehrung: d + 1 < n ? D.tage[d + 1] : null, verhaeltnis: cd / sma,
        von: drin ? 'SPY' : geld, neu: reihe });
    }
    drin = neu;
    if (d + 1 < n) ziel[d + 1] = reihe;
  }
  return { ziel: ziel, wechsel: wechsel, anfang: anfang };
}

function signal(D, opt) { return lauf(D, opt).ziel; }

/** Zustandswechsel [{ tag (Signaltag), i, ausfuehrung (naechster Kalendertag oder null), verhaeltnis C/SMA200, von, neu }];
 *  der Anfangszustand ist kein Wechsel und steht nicht in der Liste (lauf(...).anfang). */
function details(D, opt) { return lauf(D, opt).wechsel; }

/* ---------------- signale-R3.json (nur Signal) ---------------- */
function gerundet(x) { return Math.round(x * 1e6) / 1e6; }
function kurz(w) { return { signaltag: w.tag, ausfuehrung: w.ausfuehrung, neu: w.neu, verhaeltnis: gerundet(w.verhaeltnis) }; }

/** Wechsel im Fenster beim Start am ersten Tag s: Ausfuehrungstage i mit s < i <= e und ziel[i] !== ziel[i-1] (der Erstkauf
 *  zur Eroeffnung von s ist kein Wechsel, §3.3). Gezaehlt aus dem Ziel-Feld. */
function fensterWechsel(D, ziel, s, e) {
  var tage = [];
  for (var i = s + 1; i <= e; i++) if (ziel[i] !== ziel[i - 1]) tage.push({ ausfuehrung: D.tage[i], signaltag: D.tage[i - 1], neu: ziel[i] });
  return tage;
}

/** Laengen der Phasen (Signaltage) zwischen aufeinanderfolgenden Wechseln, ab einem Signaltag. */
function phasen(wechsel, ab, D) {
  var aus = [];
  for (var j = 0; j < wechsel.length; j++) {
    if (wechsel[j].tag < ab) continue;
    var bis = j + 1 < wechsel.length ? wechsel[j + 1].i : null;
    aus.push({ zustand: wechsel[j].neu, ab: wechsel[j].tag, bisSignaltag: bis == null ? null : D.tage[bis],
      handelstage: bis == null ? null : bis - wechsel[j].i, offen: bis == null });
  }
  return aus;
}

function schreibeSignale() {
  var fs = require('fs');
  var path = require('path');
  var K = require('./kern.js');
  var D = K.ladeDaten();
  var haupt = lauf(D, K.HAUPT);
  var ersatz = lauf(D, K.ERSATZ);
  var n3 = lauf(D, Object.assign({}, K.HAUPT, { ohneBand: true }));
  /* Haupt und Ersatz: dieselben Wechseltage, nur der Name der Geldreihe unterscheidet sich (Probe hier, nicht nur im Test). */
  for (var i = 0; i < D.n; i++) {
    var h = haupt.ziel[i], e = ersatz.ziel[i];
    var gleich = (h === null && e === null) || (h === 'SPY' && e === 'SPY') || (h === 'BIL' && e === 'SHY');
    if (!gleich) throw new Error('Haupt und Ersatz weichen ab am ' + D.tage[i]);
  }
  var fenster = {};
  ['A', 'B'].forEach(function (fn) {
    var f = K.FENSTER[fn];
    var s = K.starttage(D, f)[0], e = K.endIndex(D, f.ende);
    var wh = fensterWechsel(D, haupt.ziel, s, e), wn = fensterWechsel(D, n3.ziel, s, e);
    fenster[fn] = {
      start: D.tage[s], ende: D.tage[e], handelstage: e - s + 1,
      haupt: { amStart: haupt.ziel[s], wechsel: wh.length, liste: wh },
      n3: { amStart: n3.ziel[s], wechsel: wn.length, liste: wn }
    };
  });
  var grenz = 0;
  for (var d = FENSTER - 1; d < D.n; d++) {
    var v = D.reihen.SPY.c[d] / sma200(D.reihen.SPY.c, d);
    if (Math.abs(v - BAND_AUS) < 1e-9 || Math.abs(v - BAND_EIN) < 1e-9) grenz++;
  }
  var ab2003 = haupt.wechsel.filter(function (w) { return w.tag >= '2003-01-01'; });
  var ab2016n3 = n3.wechsel.filter(function (w) { return w.tag >= '2016-01-01'; });
  var aus = {
    kennung: 'trendfilter-messung-2026-10/v1 R3 Signal',
    regel: 'REGEL.md §4.3 (Siegel 6f9d06f); N3 = §7.2',
    hinweis: 'Nur das Signal: Signaltag = Schluss, an dem der Zustand wechselt; Ausfuehrung = Eroeffnung des naechsten SPY-Handelstags. ' +
      'verhaeltnis = C/SMA200 am Signaltag (auf 6 Stellen gerundet). Keine Kurse, keine Ertraege, keine Buchwerte. ' +
      'Simulation, keine Anlageberatung.',
    daten: { kalender: 'SPY-Handelstage mit Schlusskurs', erster: D.tage[0], letzter: D.tage[D.n - 1], tage: D.n },
    sma200: { fenster: FENSTER, ersterTag: D.tage[FENSTER - 1], anfangszustand: haupt.anfang && kurz(haupt.anfang) },
    hauptUndErsatzGleich: 'ja: Wechseltage identisch, Geld BIL (Haupt) bzw. SHY (Ersatz)',
    haupt: { band: '1 % (Ausstieg C <= 0,99 x SMA200, Einstieg C >= 1,01 x SMA200)', wechselGesamtSeit1993: haupt.wechsel.length,
      wechselAb2003: ab2003.length, liste: ab2003.map(kurz) },
    n3: { band: 'ohne (C > SMA200 -> SPY, sonst Geld)', wechselGesamtSeit1993: n3.wechsel.length, wechselAb2016: ab2016n3.length,
      liste: ab2016n3.map(kurz) },
    fenster: fenster,
    phasenHauptAb2003: phasen(haupt.wechsel, '2003-01-01', D),
    zustandNachLetztemSchluss: { signaltag: D.tage[D.n - 1], haupt: haupt.wechsel.length ? haupt.wechsel[haupt.wechsel.length - 1].neu : haupt.anfang.neu },
    grenzfaelle1e9: grenz
  };
  var ziel = path.join(__dirname, 'signale-R3.json');
  fs.writeFileSync(ziel, JSON.stringify(aus, null, 1) + '\n');
  console.log('signale-R3.json geschrieben: ' + ab2003.length + ' Wechsel ab 2003 (Haupt), ' + ab2016n3.length + ' ab 2016 (N3); ' +
    'A ' + fenster.A.haupt.wechsel + '/' + fenster.A.n3.wechsel + ', B ' + fenster.B.haupt.wechsel + '/' + fenster.B.n3.wechsel +
    ' (Haupt/N3); Grenzfaelle ' + grenz);
}

module.exports = {
  name: 'R3',
  titel: '200 Tage (Siegel, 1-%-Band)',
  art: 'taeglich',
  signal: signal,
  details: details,
  /* fuer test-R3.js und signale-R3.json */
  lauf: lauf,
  fensterWechsel: fensterWechsel,
  FENSTER: FENSTER, BAND_AUS: BAND_AUS, BAND_EIN: BAND_EIN
};

if (require.main === module) schreibeSignale();
