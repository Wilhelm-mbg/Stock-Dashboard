'use strict';
/* ================= Der Stichprobenplan - deterministisch, vor dem Lauf zaehlbar =========
 *
 * Dieses Modul zieht KEINE Daten. Es rechnet aus dem Tagesarchiv aus, WELCHE Zeitpunkte
 * abgefragt werden - immer dieselben, weil die Saat fest ist. Damit ist der Plan vor dem
 * ersten Netzabruf zaehlbar (Aufrufe, Zellenbesetzung, was entfaellt) und nach dem Lauf
 * nachvollziehbar.
 *
 * REIHENFOLGE, die keine Willkuer zulaesst:
 *   1. Rahmen: eingefrorenes Universum 2024-09-02 (3.263 Werte), gefiltert auf CS/ADRC
 *      (wertpapierart.js - keine ETFs, keine Hebelprodukte).
 *   2. Klasse je (Symbol, Jahr) am JAHRESANKER = letzter Handelstag des Vorjahres.
 *      Median-Tagesumsatz ueber 20 Balken bis dahin, Regel woertlich aus liquide.js.
 *      Der Anker liegt VOR dem Jahr, aus dem gezogen wird - kein Blick nach vorn.
 *   3. Je Klasse und Jahr S Symbole gewuerfelt, je Symbol D Handelstage aus den Tagen,
 *      an denen dieses Symbol wirklich einen Balken hat, je Tag EIN Zeitpunkt aus jedem
 *      der drei Tagesfenster - Sekunde mitgewuerfelt, damit die Probe nicht auf runden
 *      Minuten sitzt (dort ist die Auftragslage anders als dazwischen).
 *
 * Die Klasse am Stichtag SELBST wird spaeter aus dem Archiv mitgeschrieben (messen.js),
 * damit auswerten.js die Tabellen gegenpruefen kann. Primaer bleibt der Jahresanker.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */

var fs = require('fs');
var path = require('path');
var os = require('os');
var Liquide = require(path.join(__dirname, '..', '..', 'liquide.js'));
var WP = require(path.join(__dirname, '..', 'messmaschine', 'strategien', 'wertpapierart.js'));

var ARCHIV = process.env.MD_ARCHIV1D || 'E:/Markt-Dashboard-Archiv/archiv1d';
var MASSIVE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var UNIVERSUM = path.join(MASSIVE, 'universum-2024-09-02.json');

/* ---------- Plan-Konstanten. Wer eine aendert, aendert die Studie. ---------- */
var PLAN = {
  saat: 20260902,
  jahre: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
  symboleJeZelle: 100,        /* S - je Klasse und Jahr; weniger, wenn die Klasse kleiner ist */
  tageJeSymbol: 5,            /* D - Handelstage je Symbol und Jahr */
  /* Die drei Tagesfenster in Minuten nach Mitternacht ET, [von, bis) */
  fenster: [
    { name: 'eroeffnung', von: 9 * 60 + 30, bis: 10 * 60 },
    { name: 'mitte', von: 10 * 60, bis: 15 * 60 + 30 },
    { name: 'schluss', von: 15 * 60 + 30, bis: 16 * 60 }
  ],
  /* Klassengrenzen in Mio $ Median-Tagesumsatz. Woertlich UMSATZ_KLASSEN aus kosten.js. */
  klassen: [
    { name: '5-50', von: 5e6, bis: 50e6 },
    { name: '50-250', von: 50e6, bis: 250e6 },
    { name: '250-1000', von: 250e6, bis: 1000e6 },
    { name: 'ab1000', von: 1000e6, bis: Infinity }
  ]
};

/* ~~Halbtage aus einer handgeschriebenen Liste~~ ERSETZT 02.09.2026 durch den Kalender der
 * Boerse (kalender.js, /v2/calendar). Die Liste war Vermutung: sie fuehrte 2016-12-23 und
 * 2026-07-02 als Halbtage, ohne Fundstelle. Und Probe 2, Frage E hat gezeigt, dass ein
 * falsch offengelassener Halbtag NICHT auffaellt - der Abruf um 15:55 ET liefert dort einen
 * nachboerslichen Quote mit HTTP 200 (AAPL 23.11.2018: 0,0523 Pp, fuenfmal die Mittagsspanne).
 * Ein Tag zaehlt nur, wenn die Boerse ihn um 16:00 schliesst. */
var Kalender = require('./kalender.js');

/* ---------- Wuerfel: mulberry32, reine Funktion der Saat ---------- */
function wuerfel(saat) {
  var a = saat >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Saat aus Text - damit jede (Klasse, Jahr, Symbol) ihren eigenen, aber festen Strom hat. */
function saatAus(text, basis) {
  var h = basis >>> 0;
  for (var i = 0; i < text.length; i++) { h = Math.imul(h ^ text.charCodeAt(i), 16777619) >>> 0; }
  return h >>> 0;
}
/** Fisher-Yates mit gegebenem Wuerfel. Aendert die Eingabe nicht. */
function mischen(liste, r) {
  var a = liste.slice();
  for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(r() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* ---------- Zeit: ET-Wanduhr -> UTC, mit echter Sommerzeit ---------- */
var NY = new Intl.DateTimeFormat('en-US', {
  timeZone: 'America/New_York', hour12: false,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit'
});
/** Versatz (ms) von UTC zur New Yorker Wanduhr fuer einen gegebenen Augenblick. */
function versatz(ms) {
  var p = {}; NY.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
  var alsUtc = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour % 24, +p.minute, +p.second);
  return alsUtc - ms;
}
/** ET-Wanduhr (Datum + Minute + Sekunde) -> UTC-Zeitstempel. Zwei Durchgaenge, weil der
 *  Versatz selbst vom Ergebnis abhaengt; der zweite ist ausserhalb der Umstellstunde exakt,
 *  und in ihr liegt kein Handelsfenster. */
function etZuUtc(datum, minute, sekunde) {
  var teil = datum.split('-');
  var roh = Date.UTC(+teil[0], +teil[1] - 1, +teil[2], 0, minute, sekunde || 0);
  var v = versatz(roh);
  var ms = roh - v;
  v = versatz(ms);
  return roh - v;
}

/* ---------- Archiv ---------- */
function reiheLesen(sym) {
  var p = path.join(ARCHIV, 'bars_1d_' + sym + '.json');
  var j; try { j = JSON.parse(fs.readFileSync(p, 'utf8')); } catch (e) { return null; }
  var s = j && (j.series || j.bars);
  if (!Array.isArray(s) || !s.length) return null;
  /* [zeit, schluss, stueck, hoch, tief, eroeffnung] - Tagesdatum in ET. Der gespeicherte
   * Zeitstempel ist die Eroeffnung 09:30 ET, also faellt das Kalenderdatum in New York
   * mit dem Handelstag zusammen. */
  var tage = [], reihen = [];
  for (var i = 0; i < s.length; i++) {
    var b = s[i];
    if (!b || !(b[1] > 0)) continue;
    var p2 = {}; NY.formatToParts(new Date(b[0])).forEach(function (x) { p2[x.type] = x.value; });
    tage.push(p2.year + '-' + p2.month + '-' + p2.day);
    reihen.push(b);
  }
  return { sym: sym, tage: tage, b: reihen };
}

/** Klasse eines Wertes am Index i. null, wenn nicht einzuordnen. */
function klasseAn(R, i) {
  if (i < 19) return null;
  if (!Liquide.hatUmsatz(R.b, i, 20)) return null;
  var u = Liquide.medianUmsatz(R.b, i, 20);
  if (!isFinite(u) || !(u > 0)) return null;
  for (var k = 0; k < PLAN.klassen.length; k++) {
    if (u >= PLAN.klassen[k].von && u < PLAN.klassen[k].bis) return { name: PLAN.klassen[k].name, umsatz: u };
  }
  return { name: null, umsatz: u };            /* unter 5 Mio $ - unterhalb des Universums */
}

/** Letzter Index mit Datum <= grenze. -1, wenn keiner. */
function indexBis(tage, grenze) {
  var lo = 0, hi = tage.length - 1, tr = -1;
  while (lo <= hi) { var m = (lo + hi) >> 1; if (tage[m] <= grenze) { tr = m; lo = m + 1; } else hi = m - 1; }
  return tr;
}

/* ---------- Der Plan ---------- */
/** Baut den vollstaendigen Stichprobenplan. Gibt {zeitpunkte, zaehl, zellen} zurueck.
 *  zeitpunkte: [{sym, jahr, klasse, umsatzAnker, tag, fenster, minuteEt, sekundeEt, utc}] */
function plan(opts) {
  opts = opts || {};
  var S = opts.symboleJeZelle || PLAN.symboleJeZelle;
  var D = opts.tageJeSymbol || PLAN.tageJeSymbol;
  var jahre = opts.jahre || PLAN.jahre;
  var nurSymbole = opts.nurSymbole || null;      /* fuer den Testlauf */

  /* Der Kalender ist Voraussetzung, kein Beiwerk: ohne ihn wuesste der Plan nicht, welche
   * Tage bis 16:00 handeln - und Halbtage faellt niemand auf (Probe 2, Frage E). */
  var kal = Kalender.lesen();
  if (!kal || !kal.tage) {
    throw new Error('Boersenkalender fehlt. Erst  node studien/.../kalender.js  laufen lassen.');
  }

  var uni = JSON.parse(fs.readFileSync(UNIVERSUM, 'utf8')).werte.map(function (w) { return w.sym; });
  var zaehl = { universum: uni.length, keineAktie: 0, ohneReihe: 0, gepruefteSymbole: 0,
                kalenderTage: Object.keys(kal.tage).length, halbtage: (kal.halbtage || []).length,
                tageOhneKalender: 0, tageHalbtag: 0,
                ohneAnker: {}, unter5Mio: {}, zuWenigTage: {} };

  var reihen = {};
  var aktien = [];
  for (var i = 0; i < uni.length; i++) {
    var sym = uni[i];
    if (!WP.istAktie(sym)) { zaehl.keineAktie++; continue; }
    if (nurSymbole && nurSymbole.indexOf(sym) < 0) continue;
    var R = reiheLesen(sym);
    if (!R) { zaehl.ohneReihe++; continue; }
    reihen[sym] = R; aktien.push(sym);
  }
  zaehl.gepruefteSymbole = aktien.length;

  /* Je Jahr: Klasse am Anker, dann Ziehung. */
  var zellen = {}, zeitpunkte = [];
  for (var y = 0; y < jahre.length; y++) {
    var jahr = jahre[y];
    var anker = (jahr - 1) + '-12-31';
    zaehl.ohneAnker[jahr] = 0; zaehl.unter5Mio[jahr] = 0; zaehl.zuWenigTage[jahr] = 0;
    var nachKlasse = {};
    PLAN.klassen.forEach(function (k) { nachKlasse[k.name] = []; });

    for (var a = 0; a < aktien.length; a++) {
      var R2 = reihen[aktien[a]];
      var iA = indexBis(R2.tage, anker);
      var kl = iA >= 0 ? klasseAn(R2, iA) : null;
      if (!kl) { zaehl.ohneAnker[jahr]++; continue; }
      if (!kl.name) { zaehl.unter5Mio[jahr]++; continue; }
      /* Handelstage dieses Symbols in diesem Jahr, ohne Halbtage. */
      var tage = [];
      for (var t = iA + 1; t < R2.tage.length; t++) {
        var d = R2.tage[t];
        if (d.slice(0, 4) > String(jahr)) break;
        if (d.slice(0, 4) !== String(jahr)) continue;
        var kt = kal.tage[d];
        /* Kein Kalendereintrag = die Boerse handelte an diesem Tag nicht. Dass das Archiv
         * dort einen Balken fuehrt, ist dann eine Archivfrage, keine Handelsfrage - der Tag
         * faellt aus der Ziehung und wird gezaehlt. */
        if (!kt) { zaehl.tageOhneKalender++; continue; }
        if (!kt.voll) { zaehl.tageHalbtag++; continue; }
        tage.push(d);
      }
      if (tage.length < D) { zaehl.zuWenigTage[jahr]++; continue; }
      nachKlasse[kl.name].push({ sym: R2.sym, umsatz: kl.umsatz, tage: tage });
    }

    for (var k2 = 0; k2 < PLAN.klassen.length; k2++) {
      var kn = PLAN.klassen[k2].name;
      var kandidaten = nachKlasse[kn];
      /* Feste Reihenfolge vor dem Mischen, damit die Ziehung nicht von der Dateireihenfolge
       * des Betriebssystems abhaengt. */
      kandidaten.sort(function (x, y2) { return x.sym < y2.sym ? -1 : x.sym > y2.sym ? 1 : 0; });
      var gewaehlt = mischen(kandidaten, wuerfel(saatAus(kn + '|' + jahr, PLAN.saat))).slice(0, S);
      zellen[kn + '|' + jahr] = { klasse: kn, jahr: jahr, verfuegbar: kandidaten.length, gezogen: gewaehlt.length };

      for (var g = 0; g < gewaehlt.length; g++) {
        var C = gewaehlt[g];
        var rTag = wuerfel(saatAus(C.sym + '|' + jahr + '|tag', PLAN.saat));
        var tageGezogen = mischen(C.tage, rTag).slice(0, D).sort();
        var Rc = reihen[C.sym];
        for (var d2 = 0; d2 < tageGezogen.length; d2++) {
          var tag = tageGezogen[d2];
          /* Klasse am Stichtag SELBST - Punkt-in-Zeit, 20 Balken bis einschliesslich diesem
           * Tag. Primaer bleibt der Jahresanker (Registrierung §4); diese Zuordnung ist die
           * Gegenprobe, und sie hier mitzurechnen erspart auswerten.js einen zweiten
           * Archivdurchgang. Sie geht in KEINE Ziehung ein - sonst waere der Blick nach
           * vorn wieder drin. */
          var iT = indexBis(Rc.tage, tag);
          var kT = iT >= 0 ? klasseAn(Rc, iT) : null;
          for (var f = 0; f < PLAN.fenster.length; f++) {
            var F = PLAN.fenster[f];
            var rZ = wuerfel(saatAus(C.sym + '|' + tag + '|' + F.name, PLAN.saat));
            var minute = F.von + Math.floor(rZ() * (F.bis - F.von));
            var sekunde = Math.floor(rZ() * 60);
            zeitpunkte.push({ sym: C.sym, jahr: jahr, klasse: kn, umsatzAnker: C.umsatz,
                              klasseTag: kT ? kT.name : null, umsatzTag: kT ? kT.umsatz : null,
                              tag: tag, fenster: F.name, minuteEt: minute, sekundeEt: sekunde,
                              utc: new Date(etZuUtc(tag, minute, sekunde)).toISOString() });
          }
        }
      }
    }
  }
  return { zeitpunkte: zeitpunkte, zaehl: zaehl, zellen: zellen, plan: { S: S, D: D, jahre: jahre, saat: PLAN.saat } };
}

module.exports = { PLAN: PLAN, plan: plan, reiheLesen: reiheLesen,
                   klasseAn: klasseAn, indexBis: indexBis, etZuUtc: etZuUtc, versatz: versatz,
                   wuerfel: wuerfel, saatAus: saatAus, mischen: mischen, ARCHIV: ARCHIV, MASSIVE: MASSIVE };

/* ---- Als Werkzeug aufgerufen: den Plan einmal rechnen und ablegen. Das Rechnen liest
 *      2.249 Tagesreihen und dauert zwei Minuten; der Lauf soll das nicht bei jedem
 *      Neustart wiederholen, und der abgelegte Plan ist ausserdem pruefbar. */
if (require.main === module) {
  var ZIEL = process.env.MD_SPANNEN || 'E:/Markt-Dashboard-Archiv/spannen';
  fs.mkdirSync(ZIEL, { recursive: true });
  var t0 = Date.now();
  var P = plan();
  var datei = path.join(ZIEL, 'plan.json');
  fs.writeFileSync(datei, JSON.stringify({ erstellt: new Date().toISOString(), plan: P.plan,
    zaehl: P.zaehl, zellen: P.zellen, n: P.zeitpunkte.length, zeitpunkte: P.zeitpunkte }));
  process.stdout.write('Plan abgelegt: ' + datei + '\n');
  process.stdout.write('  Zeitpunkte ' + P.zeitpunkte.length + '   Rechenzeit ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s\n');
}
