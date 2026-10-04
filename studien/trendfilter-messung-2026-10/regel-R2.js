'use strict';
/* Trendfilter-Messung — Regel R2: Antonacci „Global Equities Momentum" (GEM). Regel: REGEL.md §4.2, Siegel 6f9d06f.
 *
 * An jedem Monatsende M (letzter SPY-Handelstag eines Kalendermonats, kern.js L5) fuer X in {SPY, Geld, Nicht-US}:
 *   r_X = TR_X(M) / TR_X(M-12) - 1,   M-12 = Monatsende zwoelf KALENDERmonate vor M (K.monatsendeVor),
 *   TR = Gesamtertragsindex aus kern.js (§2.5; NaN vor der ersten Zeile der Reihe).
 * Hauptregel (§4.2, Buch S. 98 „absolutes Momentum zuerst, am S&P 500"):
 *   r_SPY > r_Geld (strikt)  ->  'SPY', falls r_SPY >= r_NichtUS, sonst Nicht-US (opt.intl);
 *   sonst                    ->  Anleihen (opt.anleihen).
 * N5 (§7.2, opt.absolutAufGewinner, Buch S. 101 „relatives Momentum zuerst"):
 *   Gewinner G = 'SPY', falls r_SPY >= r_NichtUS, sonst opt.intl;  r_G > r_Geld (strikt) -> G, sonst opt.anleihen.
 * Nicht berechenbar (Ziel null): M-12 fehlt im Kalender (-1) oder einer der sechs TR-Werte (drei Reihen an M und M-12) ist NaN.
 * Ob die Ziel-Reihe (opt.anleihen, opt.intl) an M schon handelt, prueft die Regel NICHT; das ist Sache des Buchs bzw. des
 * ersten moeglichen Tags (§7.1, K.ersterZusatzTag).
 * Ausfuehrung: K.monatlich setzt ziel[i] = Entscheid am letzten Monatsende VOR i, also gilt der Entscheid von M ab der
 * Eroeffnung des ersten Handelstags nach M (§4.2) und am Starttag s das letzte Monatsende vor s (§4.4).
 *
 *   node studien/trendfilter-messung-2026-10/regel-R2.js --signale
 * schreibt signale-R2.json: NUR das Signal auf den echten Daten (12-Monats-Renditen an Monatsenden, Ziele, Wechselzahl aus dem
 * Ziel-Feld). Keine Buchwerte, keine Ertraege der Regel - der eine Lauf (§9.2) kommt vom Auftraggeber. */
var K = require('./kern.js');

var SIEGEL = '6f9d06f';

function pruefeOpt(opt) {
  if (!opt || typeof opt.geld !== 'string' || typeof opt.intl !== 'string' || typeof opt.anleihen !== 'string') {
    throw new Error('R2: Optionen brauchen geld, intl, anleihen (z. B. K.HAUPT), erhalten: ' + JSON.stringify(opt));
  }
}

/** 12-Monats-Gesamtertrag der Reihe sym von Monatsende v bis Monatsende m; NaN, wenn einer der beiden TR-Werte fehlt. */
function rendite(D, sym, m, v) {
  var r = D.reihen[sym];
  if (!r) throw new Error('R2: Reihe fehlt in den Daten: ' + sym);
  var a = r.tr[m], b = r.tr[v];
  if (!(a > 0) || !(b > 0)) return NaN;
  return a / b - 1;
}

/** Entscheid am Monatsende m: { tag, rSpy, rGeld, rIntl, ziel } (Renditen null, wo nicht berechenbar; ziel null, wenn eine fehlt). */
function entscheide(D, m, opt) {
  var aus = { tag: D.tage[m], rSpy: null, rGeld: null, rIntl: null, ziel: null };
  var v = K.monatsendeVor(D, m, 12);
  if (v < 0) return aus;
  var rS = rendite(D, 'SPY', m, v), rG = rendite(D, opt.geld, m, v), rI = rendite(D, opt.intl, m, v);
  if (!isNaN(rS)) aus.rSpy = rS;
  if (!isNaN(rG)) aus.rGeld = rG;
  if (!isNaN(rI)) aus.rIntl = rI;
  if (isNaN(rS) || isNaN(rG) || isNaN(rI)) return aus;
  var gewinner = rS >= rI ? 'SPY' : opt.intl;
  if (opt.absolutAufGewinner) {
    var rGewinner = rS >= rI ? rS : rI;
    aus.ziel = rGewinner > rG ? gewinner : opt.anleihen;
  } else {
    aus.ziel = rS > rG ? gewinner : opt.anleihen;
  }
  return aus;
}

/** Ziel-Feld der Laenge D.n: ziel[i] in {'SPY', opt.intl, opt.anleihen} oder null (nicht berechenbar). */
function signal(D, opt) {
  pruefeOpt(opt);
  return K.monatlich(D, function (m) { return entscheide(D, m, opt).ziel; });
}

/** Je Monatsende des Kalenders (aufsteigend): { tag, rSpy, rGeld, rIntl, ziel }. */
function details(D, opt) {
  pruefeOpt(opt);
  var aus = [];
  for (var i = 0; i < D.n; i++) if (D.monatsende[i]) aus.push(entscheide(D, i, opt));
  return aus;
}

/* ---------------- signale-R2.json (nur Signal, echte Daten) ---------------- */

/** Wechsel im Ziel-Feld ueber (s, e]: Ausfuehrungstag i mit ziel[i] !== ziel[i-1]; der Erstkauf am Starttag zaehlt nicht (§3.3). */
function wechselImFenster(D, ziel, s, e) {
  var liste = [];
  for (var i = s + 1; i <= e; i++) {
    if (ziel[i] !== ziel[i - 1]) liste.push({ ausfuehrung: D.tage[i], monatsende: D.tage[i - 1], von: ziel[i - 1], nach: ziel[i] });
  }
  return liste;
}

/** Monatsenden, an denen sich der Entscheid gegenueber dem vorigen berechenbaren Monatsende aendert. */
function wechselMonatsenden(D, det) {
  var aus = [], vorher = null;
  det.forEach(function (x) {
    if (x.ziel == null) return;
    if (vorher != null && x.ziel !== vorher) {
      aus.push({ monatsende: x.tag, ausfuehrung: D.tage[D.idx[x.tag] + 1], von: vorher, nach: x.ziel, rSpy: x.rSpy, rGeld: x.rGeld, rIntl: x.rIntl });
    }
    vorher = x.ziel;
  });
  return aus;
}

/** Knappe Entscheide: Abstand der entscheidenden Vergleiche unter `grenze` (absolut, Renditen als Bruch). */
function knappe(det, opt, grenze, ab) {
  return det.filter(function (x) {
    if (x.ziel == null || x.tag < ab) return false;
    var absolut = opt.absolutAufGewinner ? Math.max(x.rSpy, x.rIntl) - x.rGeld : x.rSpy - x.rGeld;
    return Math.abs(absolut) < grenze || Math.abs(x.rSpy - x.rIntl) < grenze;
  }).map(function (x) { return { monatsende: x.tag, ziel: x.ziel, rSpy: x.rSpy, rGeld: x.rGeld, rIntl: x.rIntl }; });
}

function lesart(D, opt, titel) {
  var det = details(D, opt);
  var ziel = signal(D, opt);
  var berechenbar = det.filter(function (x) { return x.ziel != null; });
  var fenster = {};
  ['A', 'B'].forEach(function (fn) {
    var f = K.FENSTER[fn];
    var s = K.abIndex(D.tage, f.start), e = K.endIndex(D, f.ende);
    var l = wechselImFenster(D, ziel, s, e);
    fenster[fn] = { starttag: D.tage[s], endtag: D.tage[e], zielAmStarttag: ziel[s], wechsel: l.length, liste: l };
  });
  var alle = wechselMonatsenden(D, det);
  return {
    titel: titel,
    optionen: opt,
    erstesBerechenbaresMonatsende: berechenbar.length ? berechenbar[0].tag : null,
    ersterTagMitZiel: berechenbar.length ? D.tage[D.idx[berechenbar[0].tag] + 1] : null,
    erstesZiel: berechenbar.length ? berechenbar[0].ziel : null,
    letztesMonatsende: berechenbar.length ? berechenbar[berechenbar.length - 1].tag : null,
    zielNachLetztemMonatsende: berechenbar.length ? berechenbar[berechenbar.length - 1].ziel : null,
    berechenbareMonatsenden: berechenbar.length,
    nichtBerechenbarAbErstem: det.filter(function (x) { return x.tag >= (berechenbar[0] || {}).tag && x.ziel == null; }).map(function (x) { return x.tag; }),
    monateJeZiel: berechenbar.reduce(function (a, x) { a[x.ziel] = (a[x.ziel] || 0) + 1; return a; }, {}),
    wechselMonatsendenGesamt: alle.length,
    fensterSignalzaehlung: fenster,
    wechselAb2016: alle.filter(function (x) { return x.monatsende >= '2016-01-01'; }),
    wechselVor2016: alle.filter(function (x) { return x.monatsende < '2016-01-01'; }),
    knappeEntscheideAb2016: knappe(det, opt, 0.005, '2016-01-01')
  };
}

function schreibeSignale() {
  var fs = require('fs');
  var path = require('path');
  var D = K.ladeDaten();
  var pruef = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefsummen.json'), 'utf8'));
  var shas = {};
  Object.keys(pruef.reihen).forEach(function (s) { shas[s] = pruef.reihen[s].shaKanonisch; });
  var haupt = Object.assign({}, K.HAUPT);
  var n5 = Object.assign({}, K.HAUPT, K.VARIANTEN.N5.sig);
  var ersatz = Object.assign({}, K.ERSATZ);
  var aus = {
    kennung: 'trendfilter-messung-2026-10/v1',
    regel: 'R2', titel: 'Antonacci GEM', siegel: SIEGEL,
    inhalt: 'NUR Signal: 12-Monats-Gesamtertrag (TR aus kern.js) von SPY, Geld und Nicht-US an Monatsenden und das Ziel. Keine Kurse, keine Buchwerte, keine Ertraege der Regel.',
    erzeugtMit: 'node studien/trendfilter-messung-2026-10/regel-R2.js --signale',
    datenShaKanonisch: shas,
    kalender: { erster: D.tage[0], letzter: D.tage[D.n - 1], handelstage: D.n, letztesMonatsende: D.tage[D.monatsendeVonMonat[Object.keys(D.monatsendeVonMonat).sort().pop()]] },
    renditenAls: 'Bruch (0,1 = +10 %), ungerundet',
    wechselBegriff: 'Monatsende M, dessen Entscheid vom vorigen berechenbaren Monatsende abweicht; Ausfuehrung zur Eroeffnung des naechsten SPY-Handelstags. Fensterzaehlung: Tage i in (Starttag, Endtag] mit ziel[i] !== ziel[i-1] (Erstkauf zaehlt nicht).',
    lesarten: {
      haupt: lesart(D, haupt, 'Hauptlesart (entscheidet): Geld BIL, Nicht-US ACWX, Anleihen AGG, absolutes Momentum am S&P 500'),
      n5: lesart(D, n5, 'N5 (nachrichtlich): absolutes Momentum auf den Gewinner, BIL/ACWX/AGG'),
      ersatz: lesart(D, ersatz, 'Ersatzreihen = N2 und Zusatz 2003-2026 (nachrichtlich): Geld SHY, Nicht-US EFA, Anleihen AGG')
    }
  };
  var ziel = path.join(__dirname, 'signale-R2.json');
  fs.writeFileSync(ziel, JSON.stringify(aus, null, 1) + '\n');
  console.log('geschrieben: ' + ziel);
  ['haupt', 'n5', 'ersatz'].forEach(function (k) {
    var l = aus.lesarten[k];
    console.log(k + ': erstes Monatsende ' + l.erstesBerechenbaresMonatsende + ', Wechsel A ' + l.fensterSignalzaehlung.A.wechsel + ', B ' + l.fensterSignalzaehlung.B.wechsel);
  });
}

module.exports = {
  name: 'R2',
  titel: 'Antonacci GEM',
  art: 'monatlich',
  signal: signal,
  details: details,
  /* fuer Tests und signale-R2.json */
  entscheide: entscheide,
  wechselImFenster: wechselImFenster
};

if (require.main === module) {
  if (process.argv.indexOf('--signale') >= 0) schreibeSignale();
  else console.log('Aufruf: node studien/trendfilter-messung-2026-10/regel-R2.js --signale   (schreibt signale-R2.json, nur Signal)');
}
