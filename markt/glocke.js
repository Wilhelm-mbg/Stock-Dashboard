'use strict';
/* ================= DIE BOERSENGLOCKE: DER PLAN, OHNE TON =================
 *
 * Wilhelm, 05.09.2026: Der bisherige Ton (drei abklingende Sinus-Teiltoene, 1,2 s,
 * EIN Anschlag) ist eine Kirchenglocke. Gemeint war die Glocke der New Yorker Boerse:
 * eine elektrische Klingel, die rund zehn Sekunden lang schnell und metallisch
 * durchklingelt - zum Handelsschluss gefolgt von den Hammerschlaegen des Gavels.
 *
 * NICHTS DAVON IST AUFGENOMMEN. Die bekannten Aufnahmen der Opening/Closing Bell
 * gehoeren nicht uns; sie waren das Klangbild, nicht die Quelle. Der Klang wird
 * erzeugt, es liegt keine Audiodatei im Paket.
 *
 * WARUM DIESE DATEI: In renderer.js liesse sich ein Klang nicht pruefen - die
 * Oberflaechendateien sind in Node nicht ladbar, ein AudioContext erst recht nicht,
 * und test-v6 koennte nur Text abtasten. Also steht hier die RECHNUNG: aus
 * (Ereignis, Dauer, Lautstaerke, Zufallsquelle) wird ein PLAN - eine Liste von
 * Anschlaegen mit Zeitpunkt, Frequenzen, Pegeln und Abklingzeiten, dazu der
 * Nachhall der Schale und die Hammerschlaege. renderer.js setzt diesen Plan nur noch
 * in Web-Audio-Knoten um und rechnet selbst nichts. Damit sind Zahl der Anschlaege,
 * Dauer, Frequenzgrenzen, Streuung und der Spitzenpegel in Node messbar.
 *
 * DIESE DATEI: kein window, kein document, kein AudioContext, kein Netz, kein
 * Speicher. Sie erzeugt keinen Ton, sie beschreibt einen.
 *
 * WORAUS EINE KLINGEL BESTEHT (und warum es nicht wie ein Summer klingt):
 *   - Eine kleine Metallschale wird schnell hintereinander angeschlagen, hier
 *     neunmal je Sekunde. Bei genau gleichem Abstand, gleicher Tonhoehe und gleicher
 *     Staerke hoert das Ohr keine Folge von Anschlaegen mehr, sondern EINEN Ton von
 *     9 Hz Modulation - einen Summer. Deshalb streuen Zeitpunkt, Tonhoehe und Staerke
 *     leicht (und deterministisch, siehe Zufallsquelle).
 *   - Eine Schale klingt INHARMONISCH: ihre Teiltoene sind keine ganzzahligen
 *     Vielfachen des Grundtons. Ganzzahlige Vielfache waeren eine Saite oder eine
 *     Pfeife - warm statt metallisch. Die Verhaeltnisse hier (1 / 1,83 / 2,71 / 3,42)
 *     sind bewusst krumm.
 *   - Jeder Anschlag verklingt in 40-80 ms, die hohen Teiltoene schneller als der
 *     Grundton: so entsteht das "Ping" am Anfang und der dunklere Rest danach.
 *   - Darunter liegt ein leiser Nachhall der Schale ueber die ganze Dauer - ohne ihn
 *     klaenge es wie einzelne Klicks, mit ihm wie ein Koerper, der schwingt.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. */
(function (root) {

  /* ---------------- Die Zahlen des Klangs ----------------
   * Sie stehen hier als Daten, nicht verstreut im Ablauf - test-v6 haelt den Plan
   * gegen genau diese Grenzen. */
  var DAUER = { oeffnung: 8, schluss: 10 };   /* Sekunden Klingeln, Vorgabe */
  var SCHLAEGE_JE_S = 9;                      /* zwischen 8 und 10, gefordert */
  var GRUND = 3000;                           /* Grundton der Schale in Hz */
  var GRUND_MIN = 2500, GRUND_MAX = 3500;     /* die Grenzen des Auftrags */
  var TON_STREUUNG = 0.06;                    /* +/- 6 % Tonhoehe je Anschlag */
  var TAKT_STREUUNG = 0.25;                   /* +/- 25 % des Abstands im Zeitpunkt */
  var STAERKE_STREUUNG = 0.30;                /* +/- 30 % Anschlagstaerke */
  var VERHAELTNIS = [1, 1.83, 2.71, 3.42];    /* inharmonisch: keine ganze Zahl dabei */
  var TEIL_PEGEL = [1, 0.55, 0.32, 0.18];     /* der Grundton traegt, die hohen blitzen */
  var TEIL_ABKLING = [1, 0.72, 0.52, 0.38];   /* hohe Teiltoene verklingen schneller */
  var ABKLING_MS = { min: 40, max: 80 };      /* Abklingzeit eines Anschlags */
  var ANSCHLAG_PEGEL = 0.22;                  /* Grundamplitude eines Anschlags */
  var NACHHALL = { verhaeltnis: [1, 1.83], pegel: 0.045, abkling: 0.55 };
  var HUELLE = { ein: 0.12, aus: 0.45 };      /* Ein- und Ausblenden in Sekunden */
  var HAMMER = { anzahl: 3, abstand: 0.12, vorlauf: 0.35, pegel: 0.5, dauer: 0.16,
                 tiefpass: 520, koerper: 96, koerperPegel: 0.38, koerperAbkling: 0.085 };
  var LAUTSTAERKE = { leise: 0.35, mittel: 0.62, laut: 1 };
  var ZIEL_SPITZE = 0.75;                     /* Kopfraum: der Auftrag verlangt < 0,8 */
  var VORGABE_LAUT = 'mittel';

  function zahl(v) { return typeof v === 'number' && isFinite(v); }
  function klemmen(v, min, max) { return v < min ? min : (v > max ? max : v); }

  /** Eine Zufallsquelle mit Saat - fuer Proben und fuer alles, was zweimal dasselbe
   *  ergeben muss. Ein linearer Kongruenzgenerator reicht: gebraucht wird Streuung,
   *  nicht Kryptographie. */
  function saatZufall(saat) {
    var s = (zahl(saat) ? Math.floor(saat) : 1) >>> 0;
    if (!s) s = 1;
    return function () {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }
  /** Aus [0,1) ein Wert in [-1, 1) - so streut es in beide Richtungen. */
  function umMitte(z) { return z() * 2 - 1; }

  /* ---------------- Der Plan ----------------
   *
   *  ereignis  'oeffnung' | 'schluss'   (nur 'schluss' bekommt die Hammerschlaege)
   *  opt       { dauer, lautstaerke: 'leise'|'mittel'|'laut', zufall: () -> [0,1) }
   *
   *  Rueckgabe:
   *    { ereignis, dauer, gesamt, schlaegeJeSekunde, lautstaerke, meister, spitze,
   *      huelle: { ein, aus },
   *      anschlaege: [ { t, staerke, a, abkling, teile: [ { f, a, abkling } ] } ],
   *      nachhall:   { teile: [ { f, a } ], abkling, dauer },
   *      hammer:     [ { t, a, dauer, tiefpass, koerper: { f, a, abkling } } ] }
   *
   *  `t` ist immer in Sekunden ab dem Beginn des Klangs; `a` ist die Amplitude VOR
   *  dem Meister-Gain. Der Renderer multipliziert nichts dazu - er haengt nur alles
   *  an einen Gain-Knoten mit `meister` und blendet nach `huelle` ein und aus. */
  function plan(ereignis, opt) {
    opt = opt || {};
    var ev = ereignis === 'schluss' ? 'schluss' : 'oeffnung';
    var dauer = zahl(opt.dauer) && opt.dauer > 0 ? opt.dauer : DAUER[ev];
    var laut = LAUTSTAERKE[opt.lautstaerke] !== undefined ? opt.lautstaerke : VORGABE_LAUT;
    var z = typeof opt.zufall === 'function' ? opt.zufall : Math.random;
    var takt = 1 / SCHLAEGE_JE_S;
    var anzahl = Math.round(dauer * SCHLAEGE_JE_S);

    /* Die Anschlaege liegen auf einem festen Raster (damit die Zahl je Sekunde
     * stimmt) und wackeln darin (damit es nicht wie ein Summer klingt). */
    var anschlaege = [];
    for (var i = 0; i < anzahl; i++) {
      var t = klemmen(i * takt + umMitte(z) * takt * TAKT_STREUUNG, 0, dauer);
      var grund = klemmen(GRUND * (1 + umMitte(z) * TON_STREUUNG), GRUND_MIN, GRUND_MAX);
      var staerke = klemmen(1 + umMitte(z) * STAERKE_STREUUNG, 0.3, 1.6);
      var abkling = (ABKLING_MS.min + (ABKLING_MS.max - ABKLING_MS.min) * z()) / 1000;
      var teile = [], summe = 0;
      for (var j = 0; j < VERHAELTNIS.length; j++) {
        var a = ANSCHLAG_PEGEL * staerke * TEIL_PEGEL[j];
        teile.push({ f: grund * VERHAELTNIS[j], a: a, abkling: abkling * TEIL_ABKLING[j] });
        summe += a;
      }
      anschlaege.push({ t: t, staerke: staerke, a: summe, abkling: abkling, teile: teile });
    }
    anschlaege.sort(function (a, b) { return a.t - b.t; });

    /* Der Nachhall: die Schale selbst, leise, ueber die ganze Dauer - ein Koerper,
     * der schwingt, kein zweiter Anschlag. Er steht auf `a` (nach dem Einblenden),
     * solange geklingelt wird, und verklingt danach mit `abkling`; `dauer` sagt, wie
     * lange er insgesamt laeuft. Wer den Plan abspielt, macht genau das - hier steht
     * keine zweite Huellkurve, damit Renderer und WAV-Rechnung dieselbe spielen. */
    var nachhall = { teile: NACHHALL.verhaeltnis.map(function (v, k) {
      return { f: GRUND * v, a: NACHHALL.pegel / (k + 1) };
    }), abkling: NACHHALL.abkling, dauer: dauer + HUELLE.aus };
    var nachhallPegel = nachhall.teile.reduce(function (s, x) { return s + x.a; }, 0);

    /* Die Hammerschlaege: nur zum Schluss, nach dem Klingeln. Kurze, dumpfe
     * Holz-Impulse - gefiltertes Rauschen mit tiefem Koerper. */
    var hammer = [];
    if (ev === 'schluss') {
      for (var h = 0; h < HAMMER.anzahl; h++) {
        hammer.push({ t: dauer + HAMMER.vorlauf + h * HAMMER.abstand, a: HAMMER.pegel,
          dauer: HAMMER.dauer, tiefpass: HAMMER.tiefpass,
          koerper: { f: HAMMER.koerper, a: HAMMER.koerperPegel, abkling: HAMMER.koerperAbkling } });
      }
    }

    /* Der Spitzenpegel: die Amplituden, die zu EINEM Zeitpunkt zusammenkommen -
     * gerechnet an den Anschlagzeitpunkten, denn dort ist jede Huellkurve am
     * groessten. Angesetzt wird die Summe der Teilamplituden, also der Fall, in dem
     * alle Teiltoene gleichzeitig im Scheitel stehen: eine obere Schranke, keine
     * Schaetzung. Danach wird der Meister-Gain so gewaehlt, dass Spitze mal Meister
     * unter dem Kopfraum bleibt - der Klang wird leiser gemacht, nie beschnitten. */
    var spitze = nachhallPegel;
    for (var s = 0; s < anschlaege.length; s++) {
      var summeHier = nachhallPegel;
      for (var v2 = Math.max(0, s - 8); v2 <= s; v2++) {
        var d = anschlaege[s].t - anschlaege[v2].t;
        summeHier += anschlaege[v2].a * Math.exp(-d / anschlaege[v2].abkling);
      }
      if (summeHier > spitze) spitze = summeHier;
    }
    for (var hh = 0; hh < hammer.length; hh++) {
      var hSumme = hammer[hh].a + hammer[hh].koerper.a;
      if (hh > 0) hSumme += (hammer[hh - 1].a + hammer[hh - 1].koerper.a) * Math.exp(-HAMMER.abstand / HAMMER.koerperAbkling);
      if (hSumme > spitze) spitze = hSumme;
    }
    var meister = (ZIEL_SPITZE / spitze) * LAUTSTAERKE[laut];

    return { ereignis: ev, dauer: dauer,
      gesamt: (hammer.length ? hammer[hammer.length - 1].t + hammer[hammer.length - 1].dauer : dauer) + HUELLE.aus,
      schlaegeJeSekunde: anschlaege.length / dauer, lautstaerke: laut,
      meister: meister, spitze: spitze, huelle: { ein: HUELLE.ein, aus: HUELLE.aus },
      anschlaege: anschlaege, nachhall: nachhall, hammer: hammer };
  }

  var Glocke = {
    DAUER: DAUER, SCHLAEGE_JE_S: SCHLAEGE_JE_S, GRUND: GRUND, GRUND_MIN: GRUND_MIN, GRUND_MAX: GRUND_MAX,
    VERHAELTNIS: VERHAELTNIS, ABKLING_MS: ABKLING_MS, HAMMER: HAMMER, HUELLE: HUELLE,
    LAUTSTAERKE: LAUTSTAERKE, ZIEL_SPITZE: ZIEL_SPITZE, VORGABE_LAUT: VORGABE_LAUT,
    TON_STREUUNG: TON_STREUUNG, TAKT_STREUUNG: TAKT_STREUUNG, STAERKE_STREUUNG: STAERKE_STREUUNG,
    saatZufall: saatZufall, plan: plan,
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Glocke; return; }
  root.Glocke = Glocke;
})(typeof window !== 'undefined' ? window : globalThis);
