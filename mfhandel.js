'use strict';
/* ================= Mittelfrist-Depot: die Handelslogik =================
 *
 * Warum es dieses Modul gibt: Die zwei am besten belegten Effekte der App — Momentum
 * (+5,4 Pp p. a. außerhalb der Stichprobe) und Ergebnis-Drift (+10,4 % p. a.
 * marktneutral, t = 3,04) — waren bis zum 21.08.2026 reine Rechenblätter. Kein Depot
 * führte ihre Positionen; die Schalter im Strategien-Tab schalteten nichts. Das
 * Intraday-Segment mit der schwächsten Evidenz hatte die ganze Ausführungsmaschinerie,
 * die Mittelfrist mit der stärksten hatte keine.
 *
 * Hier steht die reine Logik: Rangfolge bilden, Umschichtung planen, Orders ausführen,
 * Buch bewerten. Alles ohne Fenster und ohne Netz, damit es in Node prüfbar ist —
 * untestete Inline-Logik war in diesem Projekt wiederholt die Fehlerquelle.
 * Die Verdrahtung (Laden, Zeitgeber, Anzeige) liegt in mfdepot.js.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {

  /* Konfiguration des Buchs: Fenster aus momentum.js (STANDARD), Korbregel aus
   * liquide.js (KORB). Beides sind Wurzelmodule, die das Buch WIRKLICH liest - und
   * test-v6.js Block 34 haelt genau diese Zahlen gegen die Rohdaten der Studie
   * (Live = Messung als Test-Invariante, wiki/messmethodik.md Punkt 11). */
  var Mo = (typeof module !== 'undefined' && module.exports) ? require('./momentum.js') : root.Momentum;
  var Li = (typeof module !== 'undefined' && module.exports) ? require('./liquide.js') : root.Liquide;

  /** Die Konfiguration, mit der das Buch rechnet - als Kopie, damit Anzeige und
   *  Journal dieselben Zahlen nennen wie die Rechnung. */
  function buchKonfig() {
    return { rueckblick: Mo.STANDARD.rueckblick, luecke: Mo.STANDARD.luecke, halten: Mo.STANDARD.halten,
      anteil: Mo.STANDARD.anteil, mindestWerte: Li.KORB.mindestWerte,
      umsatzMin: Li.KORB.umsatzMin, umsatzFenster: Li.KORB.fenster,
      /* Regel K gegen Kleinstpositionen (Auftrag Nr. 85, 04.10.2026): Anteil am Platzwert
       * (Depotwert / Zielzahl), unter dem ein Kauf nicht ausgefuehrt wird (K1) und ein Bestand
       * nicht als gehalten gilt (K2). EINGESCHALTET seit Auftrag Nr. 87 (04.10.2026) mit 0,05 -
       * die Nachrechnung (studien/momentum-korb-kleinst-2026-10-04/) ist abgenommen. 0 hiesse
       * AUS; so wurde bis Nr. 85 gemessen. mfdepot.js liest das Feld und reicht es als
       * { kleinstAnteil } an planeUmschichtung und fuehreAus - die Funktionen selbst behalten
       * ihre Vorgabe AUS (wer sie ohne opts ruft, rechnet wie vor Nr. 85). */
      kleinstAnteil: 0.05 };
  }

  /** 12-1-Momentum-Rangfolge auf ROHEN Serien — jede Serie mit ihren eigenen
   *  Handelstagen, bewusst ohne gemeinsame Zeitachse: Für ein Live-Ranking zählt der
   *  letzte Stand jedes Werts, nicht ein historischer Schnittpunkt.
   *  rohMap: {SYM: [[t, kurs, stueck], …]}   opts: {rueckblick, luecke, anteil, minWerte,
   *  umsatzMin, umsatzFenster, maxAlterMs, nowMs} - ohne opts gilt die gemessene Konfiguration.
   *  Korbfilter VOR der Rangbildung (Studie 02.09.2026, liquide Fassung): nur Werte mit
   *  Median-Tagesumsatz >= umsatzMin ueber umsatzFenster Balken bis zum Stichtag ranken mit.
   *  Rückgabe: {ziel: [sym…], rangfolge: [{sym, staerke, umsatz}], uebersprungen: [sym…],
   *             verworfen: [{sym, grund}],
   *             korb: {zulaessig, geprueft, ohneUmsatz, unterSchwelle, umsatzMin, fenster}} */
  function momentumZiel(rohMap, opts) {
    opts = opts || {};
    var K = buchKonfig();
    var rueck = opts.rueckblick || K.rueckblick, luecke = opts.luecke || K.luecke;
    var anteil = opts.anteil || K.anteil, minWerte = opts.minWerte || K.mindestWerte;
    var umsatzMin = opts.umsatzMin == null ? K.umsatzMin : opts.umsatzMin;
    var fenster = opts.umsatzFenster || K.umsatzFenster;
    var maxAlter = opts.maxAlterMs || 7 * 86400000;
    var nowMs = opts.nowMs || Date.now();
    var punkte = [], uebersprungen = [], verworfen = [];
    var korb = { zulaessig: 0, geprueft: 0, ohneUmsatz: 0, unterSchwelle: 0, umsatzMin: umsatzMin, fenster: fenster };
    /** Jeder Ausschluss wird mit Grund festgehalten, nicht nur gezählt — die Anzeige
     *  soll erklären können, warum ein Wert nicht mitrankt. */
    function raus(sym, grund) { uebersprungen.push(sym); verworfen.push({ sym: sym, grund: grund }); }
    Object.keys(rohMap).forEach(function (sym) {
      var r = rohMap[sym];
      korb.geprueft++;
      /* Mindestlaenge EXAKT wie periode() im Studienwerkzeug: von = i - (rueck + luecke)
       * muss >= 0 sein. Vorher stand hier eine Zugabe von 5 Tagen - eine Reihe mit 253
       * bis 256 Tagen rankte live nicht, in der Messung schon. */
      if (!r || r.length < rueck + luecke + 1) { raus(sym, 'zu kurze Kursreihe (' + ((r && r.length) || 0) + ' von ' + (rueck + luecke + 1) + ' Tagen)'); return; }
      // Veraltete Serien fliegen raus, statt mit einem alten Kurs mitzuranken —
      // ein eingefrorener Wert sähe im fallenden Markt fälschlich „stark“ aus.
      if (nowMs - r[r.length - 1][0] > maxAlter) {
        raus(sym, 'Kurse veraltet (' + Math.round((nowMs - r[r.length - 1][0]) / 86400000) + ' Tage alt)'); return;
      }
      var i = r.length - 1;
      /* Fenster EXAKT wie die validierte Staerke in momentum.js (von = bis - rueck):
       * rueck Tage, endend luecke Tage vor heute = 231 Tage. Vorher stand hier
       * r[i - rueck], also nur rueck - luecke = 210 Tage - das Live-Buch handelte ein
       * anderes Momentum als das belegte (Audit 22.08.2026). */
      var a = r[i - luecke - rueck][1], m2 = r[i - luecke][1], p0 = r[i][1];
      if (!(a > 0) || !(m2 > 0) || !(p0 > 0)) { raus(sym, 'Stärke nicht berechenbar (Kurslücke)'); return; }
      /* Liquiditaet VOR der Rangbildung - dieselbe Rechenregel wie die Studie
       * (liquide.js). Der Grund unterscheidet "unter der Schwelle" von "keine
       * Stueckzahlen": Letzteres ist eine Luecke der Daten, kein Befund ueber den Wert. */
      var z = Li.zulaessig(r, i, { umsatzMin: umsatzMin, fenster: fenster });
      if (!z.ok) {
        if (umsatzMin > 0 && !Li.hatUmsatz(r, i, fenster)) korb.ohneUmsatz++; else korb.unterSchwelle++;
        raus(sym, z.grund); return;
      }
      var st = m2 / a - 1;
      if (isFinite(st)) { korb.zulaessig++; punkte.push({ sym: sym, staerke: st, umsatz: z.umsatz }); }
      else raus(sym, 'Stärke nicht berechenbar (Kurslücke)');
    });
    if (punkte.length < minWerte) return { ziel: [], rangfolge: [], uebersprungen: uebersprungen, verworfen: verworfen, korb: korb, zuWenig: true };
    punkte.sort(function (a, b) { return b.staerke - a.staerke; });
    var n = Math.max(5, Math.round(punkte.length * anteil));
    return { ziel: punkte.slice(0, n).map(function (p) { return p.sym; }), rangfolge: punkte,
      uebersprungen: uebersprungen, verworfen: verworfen, korb: korb };
  }

  /** Umschichtung planen: Soll-Ist-Abgleich. Gleichgewichtung über die Zielliste.
   *  buch: {cash, positionen: [{sym, stueck, einstand}]}   preise: {sym: kurs}
   *  Rückgabe: {verkaufen: [{sym, stueck, kurs}], kaufen: [{sym, stueck, kurs, budget}],
   *             halten: [sym…], fehltKurs: [sym…]}
   *  opts.kleinstAnteil > 0 schaltet Regel K2 ein (Auftrag Nr. 85; Vorgabe AUS - ohne opts
   *  oder mit 0 rechnet die Funktion wie zuvor): eine gehaltene Position MIT Kurs, deren
   *  Wert unter kleinstAnteil × (Depotwert / Zielzahl) liegt, ist ein Kleinstbestand. Sie
   *  wird ganz verkauft; ist ihr Wert ein Ziel, wird er wie ein nicht gehaltenes Ziel neu
   *  geplant - an seiner Stelle der Zielliste. Der Depotwert zaehlt sie mit, wie bisher;
   *  eine Position ohne Kurs bleibt, wie sie ist. Die Rückgabe traegt dann zusaetzlich
   *  kleinst: [sym…]. Grund: fuehreAus verkleinert einen Kauf, wenn das Bargeld nicht
   *  reicht, bis auf 0,0001 Stück - und ein solcher Rest galt hier als volle Position, der
   *  Platz blieb leer, solange der Wert Ziel war (wiki/fehlerformen.md, 04.10.2026). */
  function planeUmschichtung(ziel, buch, preise, opts) {
    var kl = opts && opts.kleinstAnteil > 0 ? opts.kleinstAnteil : 0;
    var zielSet = {};
    ziel.forEach(function (s) { zielSet[s] = true; });
    var verkaufen = [], halten = [], fehltKurs = [], kleinst = [], istKleinst = {};
    var wert = buch.cash;
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (k > 0) wert += p.stueck * k;
    });
    // Gleichgewichtung: jedes Ziel bekommt wert/zielAnzahl. Bestehende Positionen werden
    // NICHT nachjustiert — jeder Trade kostet, und die Messung lief ohne Feinjustierung.
    var budget = ziel.length ? wert / ziel.length : 0;
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (!(k > 0)) { fehltKurs.push(p.sym); halten.push(p.sym); return; }   // ohne Kurs kein Handel
      if (kl > 0 && p.stueck * k < kl * budget) {                             // K2: Kleinstbestand
        kleinst.push(p.sym); istKleinst[p.sym] = true;
        verkaufen.push({ sym: p.sym, stueck: p.stueck, kurs: k });
        return;
      }
      if (zielSet[p.sym]) halten.push(p.sym);
      else verkaufen.push({ sym: p.sym, stueck: p.stueck, kurs: k });
    });
    var neuKaufen = ziel.filter(function (s) {
      return istKleinst[s] === true || !(buch.positionen || []).some(function (p) { return p.sym === s; });
    }).filter(function (s) { if (!(preise[s] > 0)) { fehltKurs.push(s); return false; } return true; });
    var kaufen = neuKaufen.map(function (s) {
      return { sym: s, kurs: preise[s], budget: budget, stueck: budget > 0 ? Math.round(budget / preise[s] * 10000) / 10000 : 0 };
    });
    var plan = { verkaufen: verkaufen, kaufen: kaufen, halten: halten, fehltKurs: fehltKurs, depotwert: wert };
    if (kl > 0) plan.kleinst = kleinst;
    return plan;
  }

  /** Orders ausführen — mutiert das Buch, schreibt Trades. kostenBp je Seite.
   *  Bruchstücke sind erlaubt (Simulation/CFD). Rückgabe: Anzahl der Ausführungen.
   *  opts.kleinstAnteil > 0 schaltet Regel K1 ein (Auftrag Nr. 85; Vorgabe AUS): liegt der
   *  Wert eines Kaufs NACH dem Verkleinern unter kleinstAnteil × o.budget, wird er nicht
   *  ausgeführt - keine Position, kein Trade, o.stueck = 0, das Bargeld bleibt. Ein Kauf
   *  ohne positives o.budget (ein anderer Aufrufer) läuft wie zuvor. */
  function fuehreAus(buch, plan, nowMs, kostenBp, opts) {
    var k = (kostenBp == null ? 20 : kostenBp) / 10000;
    var kl = opts && opts.kleinstAnteil > 0 ? opts.kleinstAnteil : 0;
    var n = 0;
    if (!buch.trades) buch.trades = [];
    plan.verkaufen.forEach(function (o) {
      var idx = buch.positionen.findIndex(function (p) { return p.sym === o.sym; });
      if (idx < 0) return;
      var p = buch.positionen[idx];
      var erloes = p.stueck * o.kurs * (1 - k);
      buch.cash += erloes;
      buch.trades.push({ t: nowMs, sym: o.sym, art: 'verkauf', stueck: p.stueck, kurs: o.kurs,
        pnl: Math.round((erloes - p.stueck * p.einstand) * 100) / 100 });
      buch.positionen.splice(idx, 1);
      n++;
    });
    plan.kaufen.forEach(function (o) {
      var kosten = o.stueck * o.kurs * (1 + k);
      if (!(o.stueck > 0) || kosten > buch.cash) {
        // Reicht das Bargeld nicht (Rundung, Kosten), wird die Order verkleinert statt
        // still verworfen — sonst hängt das Depot dauerhaft unter der Zielgewichtung.
        o.stueck = Math.max(0, Math.floor(buch.cash / (o.kurs * (1 + k)) * 10000) / 10000);
        kosten = o.stueck * o.kurs * (1 + k);
        if (!(o.stueck > 0)) return;
      }
      if (kl > 0 && o.budget > 0 && o.stueck * o.kurs < kl * o.budget) { o.stueck = 0; return; }   // K1: kein Kleinstkauf
      buch.cash -= kosten;
      buch.positionen.push({ sym: o.sym, stueck: o.stueck, einstand: o.kurs * (1 + k), seit: nowMs });
      buch.trades.push({ t: nowMs, sym: o.sym, art: 'kauf', stueck: o.stueck, kurs: o.kurs });
      n++;
    });
    if (buch.trades.length > 400) buch.trades = buch.trades.slice(-400);
    return n;
  }

  /** Buchwert zu aktuellen Kursen. Positionen ohne Kurs zählen zum Einstand —
   *  ehrlicher wäre null, aber ein Depotwert muss eine Zahl sein; das Feld
   *  ohneKurs macht die Unsicherheit sichtbar.
   *  Seit Auftrag Nr. 93 (A1/A2) ist "ohne Kurs" nur noch ein Wert OHNE JEDE Reihe im Bestand:
   *  der Lader behaelt die alte Reihe eines Werts, der keine Antwort bekam, und preise traegt
   *  dann ihren letzten Schluss (wie rueckblick.js: nie der Einstand, solange es eine Reihe gibt). */
  function bewerte(buch, preise) {
    var wert = buch.cash, ohneKurs = [];
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (k > 0) wert += p.stueck * k;
      else { wert += p.stueck * p.einstand; ohneKurs.push(p.sym); }
    });
    return { wert: Math.round(wert * 100) / 100, ohneKurs: ohneKurs };
  }

  /** Ist ein Rebalancing fällig? Gezählt wird in HANDELSTAGEN über die Marktreihe
   *  (SPY) — Kalendertage wären bei Feiertagen ungenau, und die Messung lief in
   *  Handelstagen (63 = ein Quartal).
   *  Seit Auftrag Nr. 93 (F6) zaehlt der TAG der letzten Umschichtung, nicht ihre Uhrzeit:
   *  letztes ist ein New-Yorker Datum 'JJJJ-MM-TT' oder ein Zeitstempel (dann sein Tag in
   *  New York); gezaehlt werden die Balken mit einem spaeteren New-Yorker Tag. Vorher zaehlte
   *  der Balken des Umschichtungstags mit, wenn die Umschichtung vor 13:30 UTC lag - um 10:00
   *  war die naechste nach 62 Balken faellig, um 15:00 nach 63. Der Takt rechnet mit
   *  faelligkeit() unten (mit Grund und Alter der Marktreihe); diese Fassung bleibt fuer
   *  Aufrufer, die nur ja/nein brauchen. */
  function rebalanceFaellig(marktReihe, letztesT, halten) {
    if (!letztesT) return true;
    var grenze = nyZeit(tagPlus(typeof letztesT === 'string' ? letztesT : nyTag(letztesT), 1), 0, 0);
    var tage = 0;
    for (var i = marktReihe.length - 1; i >= 0 && marktReihe[i][0] >= grenze; i--) tage++;
    return tage >= (halten || 63);
  }

  /* ================= Live gleich Messung (Auftrag Nr. 93, 04.10.2026) =================
   *
   * Eine unabhaengige Durchsicht (Zweig pruefung/live-gegen-messung) fand sieben Stellen, an
   * denen das Momentum-Buch anders handelte als der Rueckblick ueber fuenf Jahre
   * (studien/massstab-rueckblick-2026-10-04/rueckblick.js). Die reinen Teile der Antwort stehen
   * hier: die New-Yorker Uhr, die Faelligkeit nach Handelstagen, das Reihenende, die Schluesse
   * eines Tages. Kein Netz, kein Fenster - in Node pruefbar.
   *
   * DIE UHR: jedes Datum ist ein Tag in New York (Zeitzone America/New_York), nie in UTC. Ein
   * Handelstag ist ein Tag, fuer den SPY einen Tagesbalken hat - einen Kalender fuehrt die App
   * nicht. Werktag (Mo-Fr) wird nur dort benutzt, wo noch kein Balken da sein kann: beim Alter
   * der Marktreihe gegen die Uhr und bei der Frage, ob heute ein Abschluss zu erwarten ist. */
  var NY_FMT = null;
  /** Datum und Uhrzeit eines Zeitstempels in New York: { tag: 'JJJJ-MM-TT', stunde, minute }. */
  function nyTeile(ms) {
    if (!NY_FMT) {
      NY_FMT = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hourCycle: 'h23',
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    }
    var o = {};
    NY_FMT.formatToParts(new Date(ms)).forEach(function (p) { o[p.type] = p.value; });
    return { tag: o.year + '-' + o.month + '-' + o.day, stunde: Number(o.hour) % 24, minute: Number(o.minute) };
  }
  function nyTag(ms) { return nyTeile(ms).tag; }
  /** Der Tag d + n Kalendertage ('JJJJ-MM-TT'). */
  function tagPlus(tag, n) {
    var t = Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10)) + n * 86400000;
    return new Date(t).toISOString().slice(0, 10);
  }
  function istWerktag(tag) {
    var w = new Date(Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10))).getUTCDay();
    return w !== 0 && w !== 6;
  }
  function werktagVor(tag) { var t = tagPlus(tag, -1); while (!istWerktag(t)) t = tagPlus(t, -1); return t; }
  /** Der Zeitstempel (ms, UTC) der Uhrzeit hh:mm in New York am Tag 'JJJJ-MM-TT' - mit
   *  Sommer- und Winterzeit, ohne Tabelle: geschaetzt, nachgesehen, korrigiert. */
  function nyZeit(tag, hh, mm) {
    var ziel = Date.UTC(+tag.slice(0, 4), +tag.slice(5, 7) - 1, +tag.slice(8, 10), hh, mm);
    var t = ziel + 5 * 3600000;
    for (var k = 0; k < 3; k++) {
      var p = nyTeile(t);
      var ist = Date.UTC(+p.tag.slice(0, 4), +p.tag.slice(5, 7) - 1, +p.tag.slice(8, 10), p.stunde, p.minute);
      if (ist === ziel) break;
      t += ziel - ist;
    }
    return t;
  }
  /* Ein Tagesbalken gilt als abgeschlossen ab 16:15 New York (Schluss 16:00 plus eine
   * Viertelstunde fuer die Quelle); gehandelt wird ab 09:35 (Eroeffnung 09:30 plus fuenf Minuten,
   * dann traegt der Balken des Tages seine Eroeffnung). */
  var SCHLUSS_FERTIG = [16, 15], HANDEL_AB = [9, 35];
  /** Der juengste Werktag, dessen Schluss feststehen muss: heute ab 16:15 New York, sonst der
   *  Werktag davor (auch am Wochenende). */
  function letzterFertigerWerktag(nowMs) {
    var heute = nyTag(nowMs);
    if (istWerktag(heute) && nowMs >= nyZeit(heute, SCHLUSS_FERTIG[0], SCHLUSS_FERTIG[1])) return heute;
    return werktagVor(heute);
  }
  /** Ist ein Bestand mit Ladezeit at frisch gegen die Uhr? Ja, wenn er nach dem Schluss des
   *  juengsten Werktags geladen wurde, dessen Schluss feststehen muss. (A4: "Frische gegen die
   *  Uhr", nicht gegen den juengsten Balken desselben Bestands.) */
  function bestandFrisch(at, nowMs) {
    if (!(at > 0)) return false;
    var d = letzterFertigerWerktag(nowMs);
    return at >= nyZeit(d, SCHLUSS_FERTIG[0], SCHLUSS_FERTIG[1]);
  }
  /** Laufende Balken abschneiden: ein Balken des heutigen New-Yorker Tags vor 16:15 ist noch
   *  nicht abgeschlossen (sein Kurs ist der von jetzt, sein Umsatz ein Teil des Tages). Rein:
   *  gibt die Reihe ohne ihn zurueck (dieselbe, wenn nichts zu schneiden ist). */
  function ohneLaufendenBalken(reihe, nowMs) {
    if (!reihe || !reihe.length) return reihe;
    var heute = nyTag(nowMs);
    if (nowMs >= nyZeit(heute, SCHLUSS_FERTIG[0], SCHLUSS_FERTIG[1])) return reihe;
    var ab = nyZeit(heute, 0, 0), n = reihe.length;
    while (n > 0 && reihe[n - 1][0] >= ab) n--;
    return n === reihe.length ? reihe : reihe.slice(0, n);
  }
  /** Index des juengsten Balkens mit Zeitstempel < grenze (oder -1). Reihe aufsteigend. */
  function indexVor(reihe, grenze) {
    var lo = 0, hi = reihe.length - 1, j = -1;
    while (lo <= hi) { var mi = (lo + hi) >> 1; if (reihe[mi][0] < grenze) { j = mi; lo = mi + 1; } else hi = mi - 1; }
    return j;
  }
  /** Wie viele Balken der Reihe liegen an New-Yorker Tagen NACH tag (und vor bisTag, wenn
   *  angegeben)? Ueber Zeitgrenzen gezaehlt, nicht ueber Datum je Balken. */
  function balkenNach(reihe, tag, bisTag) {
    var a = indexVor(reihe, nyZeit(tagPlus(tag, 1), 0, 0));
    var b = bisTag ? indexVor(reihe, nyZeit(bisTag, 0, 0)) : reihe.length - 1;
    return Math.max(0, b - a);
  }

  /** A6 - Faelligkeit der Umschichtung, gezaehlt an der SPY-Reihe AUS DEMSELBEN BESTAND.
   *  Ausfuehrungstag = 0; faellig ist der halten-te Handelstag danach (rueckblick.js:
   *  naechste = Q.ptage[o + halten]). Der heutige Tag kann noch keinen abgeschlossenen Balken
   *  haben - er ist der (n+1)-te, wenn n Balken zwischen dem letzten Ausfuehrungstag und heute
   *  liegen; faellig heisst also n >= halten - 1 (und heute ist ein Handelstag: das sagt erst der
   *  Abruf am Ausfuehrungstag, A4).
   *  Ist die Reihe mehr als drei Werktage hinter der Uhr, gibt es KEIN "nicht faellig": faellig
   *  ist dann null und veraltet true (die Karte sagt es, der Takt laedt nach).
   *  Rueckgabe { faellig: true|false|null, tageSeit, noch, verspaetung, veraltet,
   *              letzterMarktTag, rueckstand, heute, erste } */
  function faelligkeit(spyReihe, letzteAusfuehrungTag, halten, nowMs) {
    halten = halten || 63;
    var heute = nyTag(nowMs);
    var r = { faellig: null, tageSeit: null, noch: null, verspaetung: 0, veraltet: true, letzterMarktTag: null, rueckstand: null, heute: heute, erste: !letzteAusfuehrungTag };
    if (!spyReihe || !spyReihe.length) return r;
    r.letzterMarktTag = nyTag(spyReihe[spyReihe.length - 1][0]);
    /* Rueckstand: Werktage nach dem letzten Balken bis zum juengsten Werktag, dessen Schluss
     * feststehen muss. Normal 0; ueber einen Feiertag 1. */
    var bis = letzterFertigerWerktag(nowMs), n = 0;
    for (var t = tagPlus(r.letzterMarktTag, 1); t <= bis && n < 400; t = tagPlus(t, 1)) if (istWerktag(t)) n++;
    r.rueckstand = n;
    r.veraltet = n > 3;
    if (r.veraltet) return r;
    if (!letzteAusfuehrungTag) { r.faellig = true; return r; }
    r.tageSeit = balkenNach(spyReihe, letzteAusfuehrungTag, heute);
    r.faellig = r.tageSeit >= halten - 1;
    r.noch = Math.max(0, halten - 1 - r.tageSeit);
    r.verspaetung = Math.max(0, r.tageSeit - (halten - 1));
    return r;
  }

  /** A4 - der Stichtag zum Ausfuehrungstag heute: der juengste SPY-Tag vor heute. Dazu, ob der
   *  Bestand fuer ihn reicht: geladen nach dem Schluss des Werktags vor heute, und fuer
   *  mindestens 95 % der Werte ein Balken genau vom Stichtag.
   *  Nicht gezaehlt (ausgelassen) wird eine Reihe, deren letzter Balken bis zum Stichtag mehr als
   *  7 x 86.400.000 ms vor stichtagT liegt: genau die wirft momentumZiel am Stichtag als veraltet
   *  hinaus (REGEL §1.2, gleicher Vergleich), sie kann das Ziel nicht aendern. Sonst sperrten
   *  dauerhaft verschwundene Werte (alte Reihe behalten, auf weg) ab 5 % jede Umschichtung
   *  (Generalprobe 23.11., Fund D-07). Bleibt keine Reihe uebrig, ist das Ergebnis nicht ok.
   *  Rueckgabe { stichtag, stichtagT, mit, gesamt, ausgelassen, ok, grund } */
  function stichtagPruefen(rohMap, spyReihe, at, heute) {
    var r = { stichtag: null, stichtagT: null, mit: 0, gesamt: 0, ausgelassen: 0, ok: false, grund: null };
    var j = spyReihe && spyReihe.length ? indexVor(spyReihe, nyZeit(heute, 0, 0)) : -1;
    if (j < 0) { r.grund = 'keine Marktreihe vor heute'; return r; }
    r.stichtagT = spyReihe[j][0]; r.stichtag = nyTag(r.stichtagT);
    var von = nyZeit(r.stichtag, 0, 0), bis = nyZeit(tagPlus(r.stichtag, 1), 0, 0);
    Object.keys(rohMap || {}).forEach(function (s) {
      var x = rohMap[s];
      var i = x && x.length ? indexVor(x, bis) : -1;
      if (i >= 0 && tagesMs(r.stichtagT) - tagesMs(x[i][0]) > 7 * 86400000) { r.ausgelassen++; return; }   // Runde 2 (M9): ganze Tage wie zielAmStichtag
      r.gesamt++;
      if (i >= 0 && x[i][0] >= von) r.mit++;
    });
    var geladenNach = at >= nyZeit(werktagVor(heute), SCHLUSS_FERTIG[0], SCHLUSS_FERTIG[1]);
    r.ok = geladenNach && r.gesamt > 0 && r.mit * 100 >= r.gesamt * 95;
    if (!geladenNach) r.grund = 'Tageskurse vor dem Schluss des ' + datumDe(werktagVor(heute)) + ' geladen';
    else if (!r.ok) r.grund = 'nur ' + r.mit + ' von ' + r.gesamt + ' Werten mit einem Kurs vom Stichtag ' + datumDe(r.stichtag) + ' (nötig 95 %' +
      (r.ausgelassen ? '; ' + r.ausgelassen + ' Reihen ohne Kurs seit über 7 Tagen nicht gezählt' : '') + ')';
    return r;
  }
  /** Jede Reihe bis einschliesslich tag (New York) - kein Balken vom Ausfuehrungstag oder spaeter
   *  geht in die Rangfolge ein. Neue Arrays nur, wo geschnitten wird. */
  function rohBis(rohMap, tag) {
    var grenze = nyZeit(tagPlus(tag, 1), 0, 0), aus = {};
    Object.keys(rohMap || {}).forEach(function (s) {
      var x = rohMap[s];
      if (!x || !x.length) { aus[s] = x; return; }
      var i = indexVor(x, grenze);
      aus[s] = i === x.length - 1 ? x : x.slice(0, i + 1);
    });
    return aus;
  }
  /** Mitternacht UTC des New-Yorker Tags von ms - der "Zeitstempel des Tages" der Messung (REGEL Teil C.2). */
  function tagesMs(ms) { var t = nyTag(ms); return Date.UTC(+t.slice(0, 4), +t.slice(5, 7) - 1, +t.slice(8, 10)); }
  /** Runde 2 (Nr. 108, M9): das Ziel am Stichtag WIE IN DER MESSUNG - momentumZiel (unveraendert) auf den Reihen bis
   *  einschliesslich stichtag (rohBis), jede Zeile mit dem Zeitstempel ihres Tages (Mitternacht UTC des New-Yorker
   *  Datums), nowMs = Mitternacht UTC des Stichtags (REGEL §1.2 und Teil C.2: "7 Kalendertage" sind ganze Tage).
   *  Bisher galten die Balkenstempel (09:30 New York: Sommer 13:30, Winter 14:30 UTC) - ueber den Herbstwechsel lag
   *  eine Reihe, die genau 7 Kalendertage alt ist, 169 Stunden zurueck und flog als veraltet hinaus. Gebraucht werden
   *  je Reihe nur die letzten rueckblick + luecke + 1 Zeilen (REGEL §1.2); eine kuerzere Reihe bleibt kurz. Rein. */
  function zielAmStichtag(rohMap, stichtag) {
    var K = buchKonfig(), n = K.rueckblick + K.luecke + 1, bis = rohBis(rohMap, stichtag), aus = {};
    Object.keys(bis).forEach(function (s) {
      var x = bis[s];
      if (!x || !x.length) { aus[s] = x; return; }
      aus[s] = x.slice(-n).map(function (b) { var z = b.slice(); z[0] = tagesMs(b[0]); return z; });
    });
    return momentumZiel(aus, { nowMs: Date.UTC(+stichtag.slice(0, 4), +stichtag.slice(5, 7) - 1, +stichtag.slice(8, 10)) });
  }
  /** A5 - die Schluesse des Tages tag: je Wert der Schluss (Spalte 1) des Balkens vom Tag, sonst
   *  der letzte davor (wie rueckblick.js Schritt 6: nie der Einstand). barT = Stempel dieses Balkens. */
  function schluesseAm(rohMap, tag) {
    var grenze = nyZeit(tagPlus(tag, 1), 0, 0), preise = {}, barT = {};
    Object.keys(rohMap || {}).forEach(function (s) {
      var x = rohMap[s], i = x && x.length ? indexVor(x, grenze) : -1;
      if (i >= 0 && x[i][1] > 0) { preise[s] = x[i][1]; barT[s] = x[i][0]; }
    });
    return { preise: preise, barT: barT };
  }
  /** A5 - der Tag des Verlaufspunkts: der juengste ABGESCHLOSSENE Handelstag X der SPY-Reihe
   *  des Bestands (X vor heute in New York, oder heute nach 16:15). null, wenn es keinen gibt. */
  function punktTag(spyReihe, nowMs) {
    if (!spyReihe || !spyReihe.length) return null;
    var heute = nyTag(nowMs), fertig = nowMs >= nyZeit(heute, SCHLUSS_FERTIG[0], SCHLUSS_FERTIG[1]);
    for (var i = spyReihe.length - 1; i >= 0; i--) {
      var b = spyReihe[i], tag = nyTag(b[0]);
      if (tag < heute || (tag === heute && fertig)) return b[1] > 0 ? { tag: tag, t: b[0], kurs: b[1] } : null;
    }
    return null;
  }
  /** A5 - Bargeld am Schluss des Tages mit Balkenstempel tX: Ausschuettungen, deren Ex-Tag
   *  danach liegt, sind schon im Bargeld (bucheMassnahmen bucht bis zum juengsten Balken) - sie
   *  gehoeren nicht in den Wert von X, dessen Schluss sie noch enthaelt. */
  function bargeldAm(buch, tX) {
    var c = buch.cash;
    (buch.massnahmen || []).forEach(function (b) { if (b.art === 'div' && b.t > tX && isFinite(b.summe)) c -= b.summe; });
    return c;
  }

  /** A2 - Reihenende (REGEL §1.4 des Rueckblicks): eine gehaltene Position, deren eigene Reihe
   *  seit mindestens fuenf Handelstagen (Balken der SPY-Reihe desselben Bestands) keinen neuen
   *  Balken hat, wird ausgebucht - zum letzten Schluss der Reihe, OHNE Verkaufskosten, Bargeld
   *  gutgeschrieben, Platz frei. Ein Leerverkauf (richtung < 0) wird entsprechend glattgestellt:
   *  Wert stueck × (2 × Einstand − Kurs), nie unter 0.
   *  BEWUSSTE ABWEICHUNG VON DER MESSUNG: rueckblick.js bucht am ERSTEN Handelstag ohne Zeile aus
   *  (Z. 157-171), die App erst nach FUENF - live kann ein fehlender Balken ein Aussetzer der
   *  Quelle sein; der Preis ist derselbe (der letzte Schluss). Die Messung bucht bei Insolvenz
   *  oder Zwangs-Delisting 0; den Grund kennt die App nicht - die Journalzeile sagt das.
   *  Der Aufrufer prueft vorher, dass die SPY-Reihe nicht veraltet ist (faelligkeit().veraltet):
   *  dann wird nicht gezaehlt und nichts ausgebucht. Eine Position ohne jede Reihe im Bestand
   *  bleibt (Bewertung zum Einstand, mit Warnung auf der Karte).
   *  Mutiert das Buch. Rueckgabe [{sym, letzterTag, kurs, stueck, richtung, gutschrift, tage}]. */
  var REIHENENDE_TAGE = 5;
  function reihenendeAusbuchen(buch, rohMap, spyReihe, nowMs) {
    var aus = [];
    if (!buch || !spyReihe || !spyReihe.length) return aus;
    if (!buch.trades) buch.trades = [];
    for (var i = (buch.positionen || []).length - 1; i >= 0; i--) {
      var p = buch.positionen[i], r = rohMap && rohMap[p.sym];
      if (!r || !r.length) continue;
      var letzter = r[r.length - 1], tag = nyTag(letzter[0]);
      var tage = balkenNach(spyReihe, tag);
      if (tage < REIHENENDE_TAGE || !(letzter[1] > 0)) continue;
      var kurs = letzter[1], kurz = p.richtung != null && p.richtung < 0;
      var gut = kurz ? Math.max(0, p.stueck * (2 * p.einstand - kurs)) : p.stueck * kurs;
      buch.cash += gut;
      buch.trades.push({ t: nowMs, sym: p.sym, art: 'reihenende', stueck: p.stueck, kurs: kurs,
        pnl: Math.round((gut - p.stueck * p.einstand) * 100) / 100 });
      buch.positionen.splice(i, 1);
      aus.push({ sym: p.sym, letzterTag: tag, kurs: kurs, stueck: p.stueck, richtung: kurz ? -1 : 1, gutschrift: gut, tage: tage });
    }
    if (buch.trades.length > 400) buch.trades = buch.trades.slice(-400);
    return aus;
  }
  function datumDe(tag) { return tag ? tag.slice(8, 10) + '.' + tag.slice(5, 7) + '.' + tag.slice(0, 4) : '?'; }
  /** Ein Geldbetrag in den Journalzeilen: Tausenderpunkt, zwei Stellen, Minuszeichen
   *  (Auftrag Nr. 95, C4 - wie die uebrige Oberflaeche: „1.200,00 $" statt „1200,00 $"). */
  function geldDe(x) {
    var s = Math.abs(x).toFixed(2).split('.');
    return (x < 0 ? '−' : '') + s[0].replace(/\B(?=(\d{3})+(?!\d))/g, function () { return '.'; }) + ',' + s[1] + ' $';
  }
  /** Die Journalzeile je ausgebuchter Position (A2) - rein. name 'momentum' | 'drift'.
   *  Seit Auftrag Nr. 95 (B2): beim Leerverkauf zeigt die Zeile die Rechnung der Gutschrift
   *  (Stück × (2 × Einstand − Kurs), wie reihenendeAusbuchen bucht) statt Kurs × Stück. Der
   *  Einstand steht nicht in x; er folgt aus der Gutschrift selbst. Ist sie 0 (Kurs beim
   *  Doppelten des Einstands oder darueber), sagt die Zeile das. */
  function reihenendeJournal(name, x) {
    var buchName = name === 'drift' ? 'Ergebnis-Drift-Buch' : 'Momentum-Buch';
    var stueck = String(Math.round(x.stueck * 10000) / 10000).replace('.', ',');
    var rechnung;
    if (!(x.richtung < 0)) rechnung = 'ausgebucht zu ' + geldDe(x.kurs) + ' × ' + stueck + ' Stück = ' + geldDe(x.gutschrift);
    else if (x.gutschrift > 0) {
      var einstand = x.einstand > 0 ? x.einstand : (x.gutschrift / x.stueck + x.kurs) / 2;
      rechnung = 'letzter Kurs ' + geldDe(x.kurs) + ' (Leerverkauf glattgestellt): Gutschrift ' + stueck + ' Stück × (2 × ' + geldDe(einstand) +
        ' Einstand − ' + geldDe(x.kurs) + ') = ' + geldDe(x.gutschrift);
    } else {
      rechnung = 'letzter Kurs ' + geldDe(x.kurs) + ' (Leerverkauf glattgestellt): Gutschrift ' + geldDe(0) +
        ' – der Kurs liegt beim Doppelten des Einstands oder darüber, Stück × (2 × Einstand − Kurs) wäre nicht positiv';
    }
    return { applied: [buchName + ': Reihenende ' + x.sym + ' ausgebucht'],
      txt: 'Reihenende: ' + x.sym + ', letzter Handelstag ' + datumDe(x.letzterTag) + ', ' + rechnung +
        ' ohne Verkaufskosten (seit ' + x.tage + ' Handelstagen kein neuer Kurs). ' +
        'Grund unbekannt — wäre es eine Insolvenz, hätte die Messung 0 gebucht. Simulation mit virtuellem Kapital, keine Anlageberatung.' };
  }

  /** Drift-Buch abgleichen: fällige Positionen schließen, neue Signale eröffnen.
   *  heute: Ergebnis von Drift.heute() — {offen: [{sym, richtung, seitTagen, …}], faellig}
   *  Eröffnet werden nur JUNGE Signale (seitTagen <= maxAlterTage): Ein 40 Tage altes
   *  Signal hat den Großteil seiner 60-Tage-Wirkung hinter sich — spät einsteigen
   *  hieße, die Messung nicht mehr abzubilden.
   *  Shorts sind linear (CFD-Stil): Gewinn = Einstand − Kurs.
   *  Jedes erkannte, aber NICHT gehandelte Signal landet mit Grund in getan.verworfen —
   *  vorher verschwanden diese Fälle spurlos, und im Fenster stand „12 Signale offen“
   *  neben drei Positionen, ohne dass die Lücke irgendwo erklärt war.
   *  opts.nurPruefen: nichts anfassen, nur berichten, was das Buch täte (Automatik aus). */
  function driftAbgleich(buch, heute, preise, nowMs, opts) {
    opts = opts || {};
    // Im Prüf-Modus wird auf einer Kopie gerechnet: Die Anzeige soll auch bei
    // ausgeschalteter Automatik ehrlich sagen können, was fällig wäre — ohne zu handeln.
    var nurPruefen = !!opts.nurPruefen;
    if (nurPruefen) buch = JSON.parse(JSON.stringify(buch || {}));
    var kostenBp = opts.kostenBp == null ? 10 : opts.kostenBp;
    var k = kostenBp / 10000;
    var maxAlter = opts.maxAlterTage == null ? 5 : opts.maxAlterTage;
    var haltenTage = opts.haltenTage || 60;
    var budgetAnteil = opts.budgetAnteil || 0.05;    // je Position 5 % des Buchwerts
    if (!buch.trades) buch.trades = [];
    var getan = { geschlossen: 0, eroeffnet: 0, uebersprungen: [], verworfen: [], nurGeprueft: nurPruefen };
    function verwirf(sym, richtung, grund) { getan.verworfen.push({ sym: sym, richtung: richtung, grund: grund }); }

    // 1. Fällige schließen: Haltedauer erreicht (nach eigener Buchführung — die
    //    heute.faellig-Liste hilft, aber die eigene Uhr ist die Wahrheit des Buchs)
    for (var i = (buch.positionen || []).length - 1; i >= 0; i--) {
      var p = buch.positionen[i];
      var alterTage = (nowMs - p.seit) / 86400000 * (252 / 365);   // grob in Handelstage
      if (alterTage < haltenTage) continue;
      var kurs = preise[p.sym];
      if (!(kurs > 0)) {
        getan.uebersprungen.push(p.sym + ' (kein Kurs)');
        verwirf(p.sym, p.richtung, 'fällig, aber kein frischer Kurs – bleibt offen');
        continue;
      }
      if (nurPruefen) verwirf(p.sym, p.richtung, 'wäre fällig zum Schließen – Automatik aus');
      var wert = p.richtung > 0 ? p.stueck * kurs : p.stueck * (2 * p.einstand - kurs);
      var erloes = Math.max(0, wert) * (1 - k);
      buch.cash += erloes;
      buch.trades.push({ t: nowMs, sym: p.sym, art: p.richtung > 0 ? 'verkauf' : 'rueckkauf',
        stueck: p.stueck, kurs: kurs, pnl: Math.round((erloes - p.stueck * p.einstand) * 100) / 100 });
      buch.positionen.splice(i, 1);
      getan.geschlossen++;
    }

    // 2. Neue Signale eröffnen — je Termin genau einmal (Schlüssel sym+Richtung offen)
    var wert2 = bewerteDrift(buch, preise).wert;
    (heute && heute.offen || []).forEach(function (o) {
      var ri = o.richtung === 'kaufen' ? 1 : -1;
      if (o.seitTagen > maxAlter) {
        verwirf(o.sym, ri, 'Signal ist ' + o.seitTagen + ' Handelstage alt (Grenze ' + maxAlter + ') – Wirkung größtenteils vorbei');
        return;
      }
      var schonDa = (buch.positionen || []).some(function (p) { return p.sym === o.sym; });
      if (schonDa) { verwirf(o.sym, ri, 'schon im Buch – wird nicht doppelt eröffnet'); return; }
      var kurs = preise[o.sym];
      if (!(kurs > 0)) {
        getan.uebersprungen.push(o.sym + ' (kein Kurs)');
        verwirf(o.sym, ri, 'kein frischer Kurs – ohne Kurs kein Handel');
        return;
      }
      var budget = wert2 * budgetAnteil;
      if (budget > buch.cash) budget = buch.cash;
      var stueck = Math.floor(budget / (kurs * (1 + k)) * 10000) / 10000;
      if (!(stueck > 0)) { verwirf(o.sym, ri, 'Bargeld reicht nicht für eine Position'); return; }
      if (nurPruefen) verwirf(o.sym, ri, 'würde eröffnet – Automatik aus');
      buch.cash -= stueck * kurs * (1 + k);
      buch.positionen.push({ sym: o.sym, stueck: stueck, einstand: kurs * (1 + k),
        richtung: o.richtung === 'kaufen' ? 1 : -1, seit: nowMs, ueberraschung: o.ueberraschung });
      buch.trades.push({ t: nowMs, sym: o.sym, art: o.richtung === 'kaufen' ? 'kauf' : 'leerverkauf', stueck: stueck, kurs: kurs });
      getan.eroeffnet++;
    });
    if (buch.trades.length > 400) buch.trades = buch.trades.slice(-400);
    return getan;
  }

  /** Drift-Buchwert: Longs linear, Shorts linear invers (2·Einstand − Kurs). */
  function bewerteDrift(buch, preise) {
    var wert = buch.cash, ohneKurs = [];
    (buch.positionen || []).forEach(function (p) {
      var k = preise[p.sym];
      if (!(k > 0)) { wert += p.stueck * p.einstand; ohneKurs.push(p.sym); return; }
      wert += p.richtung > 0 ? p.stueck * k : Math.max(0, p.stueck * (2 * p.einstand - k));
    });
    return { wert: Math.round(wert * 100) / 100, ohneKurs: ohneKurs };
  }

  /* ================= Kapitalmassnahmen: Splits und Ausschuettungen (Auftrag Nr. 87, 04.10.2026) =================
   *
   * Die Buecher kaufen und bewerten zum juengsten Kurs der Tagesreihe - das ist der wirklich
   * gehandelte Schluss. Zwei Dinge fehlten bis Nr. 87: (1) ein Split in einer gehaltenen
   * Position liess die Stueckzahl stehen, waehrend der Kurs im Verhaeltnis fiel - das Buch
   * zeigte einen Scheinverlust; (2) Ausschuettungen wurden nicht gutgeschrieben, waehrend der
   * Massstab (S&P 500) seit Nr. 81 mit Ausschuettungen rechnet.
   *
   * Die Ereignisse kommen aus demselben Tagesabruf wie die Kurse (kurse.js, Bestand
   * mf_ereignisse). Yahoo meldet die Ausschuettung in HEUTIGER Stueckelung und stempelt ein
   * Ereignis wie den Tagesbalken des Ex-Tags (beides am 04.10.2026 nachgesehen, kurse.js
   * ereignisseAus). Daraus folgen Reihenfolge und Grenzen unten. */
  var SPLIT_SPERRE_MS = 30 * 86400000;
  var ANSPRUCH_MS = 30 * 86400000;                                   // Generalprobe 23.11., Fund 5: Regel 7 unten

  /** Splits und Ausschuettungen eines Buchs buchen - mutiert das Buch (Stueck, Einstand,
   *  Bargeld, Merker je Position). Rein: kein Netz, kein Fenster.
   *    buch        {cash, positionen: [{sym, stueck, einstand, seit, kursT, gebucht, richtung}]}
   *    ereignisse  {SYM: {div: [[tMs, betragJeStueck], …], split: [[tMs, zaehler, nenner], …]}}
   *    barZeit     {SYM: Zeitstempel des juengsten GESPEICHERTEN Tagesbalkens des Werts}
   *  Die Regeln (fest, Auftrag Nr. 87 §2):
   *  1. Beginn je Position: p.kursT - der Zeitstempel des Balkens, zu dessen Kurs gekauft
   *     wurde; fehlt er (Positionen von vor Nr. 87), gilt p.seit.
   *  2. Gebucht wird jedes Ereignis des Werts mit t > Beginn UND t <= barZeit[sym] (der
   *     gespeicherte Kurs enthaelt den Ex-Tag dann schon), das nicht in p.gebucht steht
   *     (Kennungen 'split:' + t, 'div:' + t). Erst alle Splits in zeitlicher Folge, dann
   *     die Ausschuettungen. Jedes Buch bucht fuer sich.
   *  3. Split z : n -> stueck × z / n, einstand × n / z, ungerundet; Kauf und Leerverkauf gleich.
   *  4. Ausschuettung b je Stueck -> Bargeld + stueck × b (Kauf) bzw. - stueck × b
   *     (Leerverkauf, richtung < 0); stueck ist die Stueckzahl NACH den Splits aus 3, weil b
   *     in heutiger Stueckelung steht.
   *  5. Sperre: ein zweiter Split desselben Werts im Abstand von hoechstens 30 Kalendertagen
   *     zu einem gebuchten wird NICHT gebucht, sondern gemeldet (gesperrt; neu = true beim
   *     ersten Mal, die Position merkt es sich in p.gemeldet).
   *  6. Ohne Ereignisse oder ohne barZeit fuer den Wert geschieht nichts; ein zweiter Aufruf
   *     mit denselben Daten bucht nichts.
   *  7. (Generalprobe 23.11., Fund 5) Ansprueche verkaufter Positionen (buch.ansprueche, gemerkt von
   *     anspruecheVormerken): jede Ausschuettung mit beginn < t <= bisT (Ex-Tag spaetestens der Tag des
   *     Verkaufs zur Eroeffnung) und t <= barZeit[sym] wird einmal gebucht wie in 4 (Betrag × Stueck beim
   *     Verkauf, spaetere Splits eingerechnet). Erledigt ist ein Anspruch, sobald barZeit[sym] >= bisT
   *     (der Bestand traegt den Verkaufstag), spaetestens 30 Tage nach bisT.
   *  opts.nurSplits (Generalprobe 23.11., Fund 1): nur Regel 3 und 5, keine Ausschuettungen und kein
   *  Anspruch - fuer splitsAmAusfuehrungstag unten.
   *  Rueckgabe: {buchungen: [{sym, art: 'split'|'div', t, am, kaufT, …}], gesperrt: [{sym, art, t, …, neu}]}.
   *  Die Buchungen stehen NICHT in buch.trades (dort steht nur Handel), sondern in
   *  buch.massnahmen (hoechstens 400) - damit sich das Bargeld des Buchs auch ohne das
   *  Journal nachrechnen laesst. */
  function bucheMassnahmen(buch, ereignisse, barZeit, nowMs, opts) {
    var nurSplits = !!(opts && opts.nurSplits);
    var res = { buchungen: [], gesperrt: [] };
    if (!buch || !ereignisse || !barZeit) return res;
    function nachZeit(a, b) { return a[0] - b[0]; }
    (buch.positionen || []).forEach(function (p) {
      var e = ereignisse[p.sym], bis = barZeit[p.sym];
      if (!e || !(bis > 0)) return;
      var beginn = p.kursT > 0 ? p.kursT : p.seit;
      if (!(beginn > 0)) return;
      function faellig(art, t) {
        return t > beginn && t <= bis && !(p.gebucht && p.gebucht.indexOf(art + ':' + t) >= 0);
      }
      function merke(art, t) { if (!p.gebucht) p.gebucht = []; p.gebucht.push(art + ':' + t); }
      (e.split || []).slice().sort(nachZeit).forEach(function (s) {
        var t = s[0], z = s[1], n = s[2];
        if (!(z > 0) || !(n > 0) || !faellig('split', t)) return;
        var davor = (p.gebucht || []).filter(function (k) {
          return k.indexOf('split:') === 0 && Math.abs(t - Number(k.slice(6))) <= SPLIT_SPERRE_MS;
        })[0];
        if (davor) {                                                  // Regel 5: Sperre
          var schon = !!(p.gemeldet && p.gemeldet.indexOf('split:' + t) >= 0);
          if (!schon) { if (!p.gemeldet) p.gemeldet = []; p.gemeldet.push('split:' + t); }
          res.gesperrt.push({ sym: p.sym, art: 'split', t: t, zaehler: z, nenner: n, gebuchtT: Number(davor.slice(6)), neu: !schon });
          return;
        }
        var b = { sym: p.sym, art: 'split', t: t, am: nowMs, kaufT: beginn, zaehler: z, nenner: n,
          stueckAlt: p.stueck, einstandAlt: p.einstand };
        p.stueck = p.stueck * z / n;                                  // Regel 3
        p.einstand = p.einstand * n / z;
        b.stueckNeu = p.stueck; b.einstandNeu = p.einstand;
        merke('split', t);
        res.buchungen.push(b);
      });
      (nurSplits ? [] : e.div || []).slice().sort(nachZeit).forEach(function (a) {
        var t = a[0], betrag = a[1];
        if (!(betrag > 0) || !faellig('div', t)) return;
        var richtung = p.richtung < 0 ? -1 : 1;
        var summe = richtung * p.stueck * betrag;                     // Regel 4: Stueckzahl NACH den Splits
        buch.cash += summe;
        merke('div', t);
        res.buchungen.push({ sym: p.sym, art: 'div', t: t, am: nowMs, kaufT: beginn, betrag: betrag, stueck: p.stueck,
          richtung: richtung, summe: summe });
      });
    });
    if (!nurSplits && buch.ansprueche && buch.ansprueche.length) {             // Regel 7
      buch.ansprueche = buch.ansprueche.filter(function (a) {
        var e = ereignisse[a.sym], bis = barZeit[a.sym];
        if (e && bis > 0) (e.div || []).slice().sort(nachZeit).forEach(function (x) {
          var t = x[0], betrag = x[1];
          if (!(betrag > 0) || !(t > a.beginn) || t > a.bisT || t > bis || a.gebucht.indexOf('div:' + t) >= 0) return;
          var faktor = 1;                                               // Splits nach dem Verkauf: der Betrag steht in heutiger Stueckelung
          (e.split || []).forEach(function (s) { if (s[0] > a.bisT && s[1] > 0 && s[2] > 0) faktor *= s[1] / s[2]; });
          var stueck = a.stueck * faktor, summe = a.richtung * stueck * betrag;
          buch.cash += summe;
          a.gebucht.push('div:' + t);
          res.buchungen.push({ sym: a.sym, art: 'div', t: t, am: nowMs, kaufT: a.beginn, betrag: betrag, stueck: stueck,
            richtung: a.richtung, summe: summe, verkauftT: a.bisT });
        });
        return !(bis >= a.bisT) && nowMs - a.bisT <= ANSPRUCH_MS;
      });
      if (!buch.ansprueche.length) delete buch.ansprueche;
    }
    if (res.buchungen.length) {
      buch.massnahmen = (buch.massnahmen || []).concat(res.buchungen);
      if (buch.massnahmen.length > 400) buch.massnahmen = buch.massnahmen.slice(-400);
    }
    return res;
  }

  /** Neue Positionen (seit === nowMs) bekommen den Zeitstempel des Balkens, zu dessen Kurs
   *  gekauft wurde - den Beginn fuer bucheMassnahmen (Regel 1). Aufgerufen gleich nach
   *  fuehreAus bzw. driftAbgleich; auch ein nach Regel K2 neu gekaufter Bestand ist eine
   *  neue Position. Rueckgabe: Zahl der gestempelten Positionen. */
  function stempleKursT(buch, barZeit, nowMs) {
    var n = 0;
    ((buch && buch.positionen) || []).forEach(function (p) {
      if (p.seit === nowMs && !(p.kursT > 0) && barZeit && barZeit[p.sym] > 0) { p.kursT = barZeit[p.sym]; n++; }
    });
    return n;
  }

  /** Generalprobe 23.11., Fund 1 (M-02, D-02, H-c2): Splits mit Ex-Tag = Ausfuehrungstag VOR dem Handel buchen.
   *  Die Eroeffnung des Ausfuehrungstags (mfdepot.js eroeffnung, roher Kurs) steht schon in neuer Stueckelung, der
   *  Bestand kennt den Split erst nach dem Laden am Abend. ereignisse / barZeit kommen aus demselben Abruf der
   *  Eroeffnung ({SYM: {div, split}} ab Mitternacht New York, Stempel des Balkens von heute). Gebucht wird wie in
   *  bucheMassnahmen (Kennung 'split:' + t, Sperre 30 Tage) - der Abend bucht denselben Split dann nicht noch einmal.
   *  Ausschuettungen NICHT: sie werden nach dem Handel gutgeschrieben (REGEL Teil C.3). Mutiert das Buch;
   *  Rueckgabe wie bucheMassnahmen (fuer massnahmenJournal). */
  function splitsAmAusfuehrungstag(buch, ereignisse, barZeit, nowMs) {
    return bucheMassnahmen(buch, ereignisse, barZeit, nowMs, { nurSplits: true });
  }

  /** Generalprobe 23.11., Fund 5 (M-01, D-01, H-c1): Ansprueche der Positionen merken, die eben zur Eroeffnung verkauft
   *  wurden. REGEL Teil C.3: "ein Verkauf zur Eroeffnung des Ex-Tags zaehlt noch", gutgeschrieben nach dem Handel - dann
   *  steht die Position aber nicht mehr im Buch. vorher = buch.positionen.slice() VOR fuehreAus bzw. nachfassen (dieselben
   *  Objekte); jede, die danach fehlt, bekommt einen Eintrag in buch.ansprueche: { sym, stueck, richtung, beginn (kursT,
   *  sonst seit - wie bucheMassnahmen), bisT (Stempel des Balkens, zu dessen Eroeffnung verkauft wurde: barZeit), am,
   *  gebucht (Kopie der schon gebuchten Kennungen) }. Gebucht wird in bucheMassnahmen, Regel 7. Die gemessenen Funktionen
   *  bleiben unberuehrt. Mutiert das Buch; Rueckgabe: Zahl der neuen Ansprueche. */
  function anspruecheVormerken(buch, vorher, barZeit, nowMs) {
    var n = 0;
    (vorher || []).forEach(function (p) {
      if ((buch.positionen || []).indexOf(p) >= 0) return;            // noch im Buch
      var beginn = p.kursT > 0 ? p.kursT : p.seit, bisT = barZeit && barZeit[p.sym];
      if (!(beginn > 0) || !(bisT > beginn)) return;
      if (!buch.ansprueche) buch.ansprueche = [];
      buch.ansprueche.push({ sym: p.sym, stueck: p.stueck, richtung: p.richtung < 0 ? -1 : 1, beginn: beginn, bisT: bisT, am: nowMs,
        gebucht: (p.gebucht || []).slice() });
      n++;
    });
    return n;
  }

  /** Die EINE Journalzeile je Takt und Buch zu bucheMassnahmen - null, wenn nichts gebucht
   *  und nichts neu gesperrt wurde. name: 'momentum' | 'drift'. Rein (Text, keine Wirkung).
   *  Der Ex-Tag ist der Kalendertag des Zeitstempels in UTC (= Handelstag in New York). */
  function massnahmenJournal(name, res, nowMs) {
    var div = res.buchungen.filter(function (b) { return b.art === 'div'; });
    var split = res.buchungen.filter(function (b) { return b.art === 'split'; });
    var sperre = res.gesperrt.filter(function (g) { return g.neu; });
    if (!div.length && !split.length && !sperre.length) return null;
    var buchName = name === 'drift' ? 'Ergebnis-Drift-Buch' : 'Momentum-Buch';
    function tag(t) { var s = new Date(t).toISOString(); return s.slice(8, 10) + '.' + s.slice(5, 7) + '.' + s.slice(0, 4); }
    function zahl(x, stellen) { return String(Math.round(x * Math.pow(10, stellen)) / Math.pow(10, stellen)).replace('.', ','); }
    var geld = geldDe;                                                // Tausenderpunkt seit Nr. 95 (C4)
    var applied = [], saetze = [];
    if (div.length) {
      var summe = div.reduce(function (a, b) { return a + b.summe; }, 0);
      var mitLeer = div.some(function (b) { return b.richtung < 0; });
      var kopf = (mitLeer ? 'Ausschüttungen gebucht (Gutschrift bei Kauf, Belastung bei Leerverkauf): ' : 'Ausschüttungen gutgeschrieben: ') +
        div.length + (div.length === 1 ? ' Buchung' : ' Buchungen') + ', Summe ' + geld(summe);
      applied.push(buchName + ': ' + kopf);
      /* Nachtrag: der Ex-Tag liegt schon mehr als vier Tage zurueck - der erste Lauf nach dem
       * Update (oder nach einer Pause der App) holt nach, was seit dem Kauf angefallen ist. */
      var nach = div.filter(function (b) { return nowMs - b.t > 4 * 86400000; });
      var kaufTage = {};
      div.forEach(function (b) { kaufTage[tag(b.kaufT)] = true; });
      var mehrere = Object.keys(kaufTage).length > 1;                 // dann nennt jeder Posten seinen Kauftag
      saetze.push(kopf + ' – ins Bargeld des Buchs.' +
        (nach.length ? ' Nachtrag seit dem ' + (mehrere ? 'jeweiligen Kauf (je Posten genannt)' : 'Kauf am ' + tag(nach[0].kaufT)) +
          ': nachgeholt wird, was seit dem Kauf angefallen und noch nicht gebucht war.' : '') +
        ' Einzelposten (Wert, Ex-Tag, Betrag je Stück × Stück = Summe): ' +
        div.map(function (b) {
          return b.sym + ' ' + tag(b.t) + ' ' + zahl(b.betrag, 6) + ' $ × ' + zahl(b.stueck, 4) + ' = ' + geld(b.summe) +
            (b.richtung < 0 ? ' (Leerverkauf)' : '') + (mehrere ? ' (Kauf ' + tag(b.kaufT) + ')' : '') +
            (b.verkauftT ? ' (zur Eröffnung am ' + tag(b.verkauftT) + ' verkauft – über die Nacht vor dem Ex-Tag gehalten, der Anspruch bleibt)' : '');
        }).join('; ') + '.');
    }
    split.forEach(function (b) {
      var s = 'Split gebucht: ' + b.sym + ' ' + b.zaehler + ' : ' + b.nenner + ', Stück ' + zahl(b.stueckAlt, 4) + ' → ' + zahl(b.stueckNeu, 4) +
        ', Einstand ' + geld(b.einstandAlt) + ' → ' + geld(b.einstandNeu);
      applied.push(buchName + ': Split gebucht: ' + b.sym + ' ' + b.zaehler + ' : ' + b.nenner);
      saetze.push(s + ' (Ex-Tag ' + tag(b.t) + '; der Wert der Position bleibt gleich).');
    });
    sperre.forEach(function (g) {
      applied.push(buchName + ': Split NICHT gebucht (Sperre): ' + g.sym + ' ' + g.zaehler + ' : ' + g.nenner);
      saetze.push('Split NICHT gebucht: ' + g.sym + ' ' + g.zaehler + ' : ' + g.nenner + ' vom ' + tag(g.t) + ' liegt höchstens 30 Kalendertage neben dem gebuchten Split vom ' +
        tag(g.gebuchtT) + ' – zwei Splits so dicht beieinander sind fast immer eine doppelte Meldung der Quelle. Bitte prüfen; die Position bleibt, wie sie ist.');
    });
    return { applied: applied, txt: saetze.join(' ') + ' Simulation mit virtuellem Kapital, keine Anlageberatung.' };
  }

  /* ================= Eroeffnung am selben Tag nachfassen (Auftrag Nr. 94, 04.10.2026) =================
   *
   * Das Momentum-Buch schichtet zur Eroeffnung des Ausfuehrungstags um (Nr. 93) und holt die Eroeffnungen
   * ab 09:35 New York einmal. Traegt der Tagesbalken eines Werts dann noch keine Eroeffnung (spaeter
   * Handelsbeginn, die Quelle hinkt), merkt sich das Buch die offenen Auftraege des Tages in buch.offen:
   *   { tag: 'JJJJ-MM-TT' (New York), verkaeufe: [sym…], kaeufe: [{ sym, budget, rang }…] }
   * Jeder Takt am selben New-Yorker Tag bis 16:00 New York holt fuer sie die Eroeffnung DIESES Tages
   * (mfdepot.js eroeffnung) und fuehrt aus, was jetzt einen Kurs hat. Gehandelt wird immer zur Eroeffnung
   * des Tages - das ist der Kurs der Messung, nie ein spaeterer. Nach 16:00 New York oder an einem
   * spaeteren Tag wird offen geloescht; was dann noch offen war, bleibt wie in der Messung (Ziel ohne Kurs
   * nicht gekauft, gehaltene Position ohne Kurs gehalten). Nur das Momentum-Buch; der Knopf "jetzt
   * umschichten" aendert nichts an offen. Rein, in Node pruefbar. */
  var NACHFASSEN_BIS = [16, 0];
  /** Uhrzeit eines Zeitstempels in New York, 'HH:MM'. */
  function nyUhr(ms) { var p = nyTeile(ms); return (p.stunde < 10 ? '0' : '') + p.stunde + ':' + (p.minute < 10 ? '0' : '') + p.minute; }
  function kursDe(x) { return geldDe(x); }                             // Tausenderpunkt seit Nr. 95 (C4)
  function stueckDe(x) { return String(Math.round(x * 10000) / 10000).replace('.', ','); }
  function nachRang(a, b) { return a.rang - b.rang; }

  /** Regel 1: die offenen Auftraege einer Umschichtung - die geplanten Verkaeufe und Kaeufe, fuer die die
   *  Eroeffnung fehlte. ziel = die Zielliste (in der Rangfolge), plan = planeUmschichtung(ziel, Buch, Eroeffnungen)
   *  dieser Umschichtung, tag = Ausfuehrungstag. Ein Verkauf ist eine gehaltene Position ohne Kurs, die kein
   *  Ziel ist (der Plan haette sie verkauft); ein Kauf ein Ziel ohne Kurs, das nicht gehalten wird. budget ist
   *  der Platzwert, mit dem der Plan rechnete (depotwert / Zielzahl wie in planeUmschichtung), rang der Platz
   *  in der Zielliste (1 = der staerkste). Eine gehaltene Position ohne Kurs, die Ziel ist, ist kein Auftrag.
   *  Rueckgabe: das offen-Objekt oder null, wenn nichts offen ist. */
  function offeneAuftraege(ziel, plan, tag) {
    var rang = {}, gehalten = {};
    (ziel || []).forEach(function (s, i) { rang[s] = i + 1; });
    (plan.halten || []).forEach(function (s) { gehalten[s] = true; });
    var budget = ziel && ziel.length ? plan.depotwert / ziel.length : 0;
    var verkaeufe = [], kaeufe = [];
    (plan.fehltKurs || []).forEach(function (s) {
      if (gehalten[s]) { if (!rang[s]) verkaeufe.push(s); }
      else if (rang[s]) kaeufe.push({ sym: s, budget: budget, rang: rang[s] });
    });
    return verkaeufe.length || kaeufe.length ? { tag: tag, verkaeufe: verkaeufe, kaeufe: kaeufe.sort(nachRang) } : null;
  }

  /** Laeuft das Nachfassen noch? Nur am New-Yorker Tag des Auftrags und vor 16:00 New York. */
  function offenLaeuft(offen, nowMs) {
    return !!offen && nyTag(nowMs) === offen.tag && nowMs < nyZeit(offen.tag, NACHFASSEN_BIS[0], NACHFASSEN_BIS[1]);
  }

  /** Die Werte, fuer die der Takt eine Eroeffnung holt: erst die Verkaeufe, dann die Kaeufe nach rang. */
  function offenWerte(offen) {
    if (!offen) return [];
    return (offen.verkaeufe || []).concat((offen.kaeufe || []).slice().sort(nachRang).map(function (k) { return k.sym; }));
  }

  /** Generalprobe 23.11., Fund 2 (D-04, D-05, H-b2): auf welche gehaltenen Werte wartet die Umschichtung noch?
   *  Eine Position ohne Eroeffnung in preise, deren Reihe einen Balken vom Stichtag hat, handelt - ihre Eroeffnung
   *  kommt (die Messung hat sie; REGEL §1.3 "ohne Kurs" meint einen Wert, der an dem Tag nicht handelt). Ohne sie
   *  rechnete der Plan den Platzwert zu klein. Bis 16:00 New York (NACHFASSEN_BIS) wird gewartet und nichts gehandelt;
   *  danach ist die Liste leer und es gilt, was da ist. Rein. Rueckgabe [sym…] */
  function eroeffnungAbwarten(positionen, preise, rohMap, stichtag, nowMs) {
    if (nowMs >= nyZeit(nyTag(nowMs), NACHFASSEN_BIS[0], NACHFASSEN_BIS[1])) return [];
    var von = nyZeit(stichtag, 0, 0), bis = nyZeit(tagPlus(stichtag, 1), 0, 0), aus = [];
    (positionen || []).forEach(function (p) {
      var x = rohMap && rohMap[p.sym], i = !((preise || {})[p.sym] > 0) && x && x.length ? indexVor(x, bis) : -1;
      if (i >= 0 && x[i][0] >= von) aus.push(p.sym);
    });
    return aus;
  }

  /** Regel 2: ausfuehren, was jetzt eine Eroeffnung hat. preise / barZeit = die Eroeffnungen DIESES Tages und
   *  die Stempel ihrer Balken (mfdepot.js eroeffnung). Erst die Verkaeufe (Erloes ins Bargeld, Kosten wie
   *  bisher), dann die Kaeufe in der Reihenfolge rang, je hoechstens budget (Stueck = budget / Kurs, auf vier
   *  Stellen abgerundet) und hoechstens das vorhandene Bargeld - mit fuehreAus, opts wie bei der Umschichtung
   *  (Regel K). Ausgefuehrtes faellt aus offen heraus; ein Kauf mit Kurs, den das Bargeld (oder Regel K1)
   *  jetzt nicht zulaesst, bleibt offen. Ein Verkauf eines Werts, der nicht mehr im Buch ist, und ein Kauf
   *  eines Werts, der schon im Buch ist (etwa nach dem Knopf), entfallen - nie ein zweiter Kauf.
   *  Mutiert das Buch. Rueckgabe { tag, verkauft: [{sym, kurs}], gekauft: [{sym, kurs, stueck}],
   *  wartet: [sym], entfallen: [sym], rest: offen|null, geaendert, kostenBp } */
  function nachfassen(buch, preise, barZeit, nowMs, kostenBp, opts) {
    var o = buch && buch.offen;
    var res = { tag: o ? o.tag : null, verkauft: [], gekauft: [], wartet: [], entfallen: [], rest: null, geaendert: false,
      kostenBp: kostenBp == null ? 20 : kostenBp };
    if (!o) return res;
    preise = preise || {};
    var imBuch = {};
    (buch.positionen || []).forEach(function (p) { imBuch[p.sym] = p; });
    var plan = { verkaufen: [], kaufen: [] }, restV = [], restK = [];
    (o.verkaeufe || []).forEach(function (s) {
      if (!imBuch[s]) { res.entfallen.push(s); return; }
      if (preise[s] > 0) plan.verkaufen.push({ sym: s, stueck: imBuch[s].stueck, kurs: preise[s] });
      else restV.push(s);
    });
    (o.kaeufe || []).slice().sort(nachRang).forEach(function (k) {
      if (imBuch[k.sym]) { res.entfallen.push(k.sym); return; }
      var kurs = preise[k.sym];
      /* Generalprobe 23.11., Fund 2 (D-05): ohne Budget nie kaufen - fuehreAus naehme sonst das ganze Bargeld. Der Kauf
       * bleibt offen wie einer, fuer den das Bargeld nicht reicht. */
      if (kurs > 0 && !(k.budget > 0)) { res.wartet.push(k.sym); restK.push(k); return; }
      if (kurs > 0) plan.kaufen.push({ sym: k.sym, kurs: kurs, budget: k.budget, rang: k.rang,
        stueck: k.budget > 0 ? Math.floor(k.budget / kurs * 10000) / 10000 : 0 });
      else restK.push(k);
    });
    if (plan.verkaufen.length || plan.kaufen.length) {
      fuehreAus(buch, plan, nowMs, res.kostenBp, opts);        // erst die Verkaeufe, dann die Kaeufe in dieser Reihenfolge
      stempleKursT(buch, barZeit, nowMs);                       // neue Positionen: Balken des Tages, zu dessen Eroeffnung gekauft wurde
    }
    plan.verkaufen.forEach(function (v) { res.verkauft.push({ sym: v.sym, kurs: v.kurs }); });
    plan.kaufen.forEach(function (k) {
      if (k.stueck > 0) res.gekauft.push({ sym: k.sym, kurs: k.kurs, stueck: k.stueck });
      else { res.wartet.push(k.sym); restK.push({ sym: k.sym, budget: k.budget, rang: k.rang }); }
    });
    if (restV.length || restK.length) {
      buch.offen = { tag: o.tag, verkaeufe: restV, kaeufe: restK.sort(nachRang) };
      if (o.nachkauf) buch.offen.nachkauf = true;
    } else delete buch.offen;
    res.rest = buch.offen || null;
    res.geaendert = res.verkauft.length + res.gekauft.length + res.entfallen.length > 0;
    return res;
  }

  /** Regel 3: nach 16:00 New York oder an einem spaeteren Tag wird offen geloescht. Rueckgabe: das geloeschte
   *  offen (mit den liegen gebliebenen Auftraegen) - oder null, wenn keins da ist, es weiterlaeuft oder sein Tag
   *  noch kommt (ein Nachkauf, angesetzt fuer den naechsten Handelstag). */
  function offenBeenden(buch, nowMs) {
    if (!buch || !buch.offen || offenLaeuft(buch.offen, nowMs) || nyTag(nowMs) < buch.offen.tag) return null;
    var o = buch.offen;
    delete buch.offen;
    return o;
  }

  function auftraegeDe(verkaeufe, kaeufe) {
    var teile = [];
    if (verkaeufe.length) teile.push((verkaeufe.length === 1 ? 'Verkauf ' : 'Verkäufe ') + verkaeufe.join(', '));
    if (kaeufe.length) teile.push((kaeufe.length === 1 ? 'Kauf ' : 'Käufe ') + kaeufe.join(', '));
    return teile.join('; ');
  }

  /** Der Satz zu den offenen Auftraegen in der Journalzeile der Umschichtung ('' ohne offen). */
  function offenText(offen, nowMs) {
    if (!offen) return '';
    return ' Um ' + nyUhr(nowMs) + ' New York noch ohne Eröffnung, offen – die App fasst heute bis 16:00 New York zur Eröffnung dieses Tages nach: ' +
      auftraegeDe(offen.verkaeufe, offen.kaeufe.map(function (k) { return k.sym; })) + '.';
  }

  /** Die eigene Journalzeile eines Nachfassens (Wert, Eroeffnungskurs, Uhrzeit) - null, wenn nichts gehandelt
   *  wurde und nichts entfallen ist. Rein (Text, keine Wirkung). */
  function nachfassenJournal(res, nowMs) {
    if (!res || !res.geaendert) return null;
    var handel = res.verkauft.map(function (v) { return 'Verkauf ' + v.sym + ' zu ' + kursDe(v.kurs); })
      .concat(res.gekauft.map(function (k) { return 'Kauf ' + k.sym + ' zu ' + kursDe(k.kurs) + ' (' + stueckDe(k.stueck) + ' Stück)'; }));
    var applied = handel.length ? ['Momentum-Buch nachgefasst: ' + handel.join('; ')] : ['Momentum-Buch: offene Aufträge entfallen'];
    var txt = 'Momentum-Buch: Eröffnung vom ' + datumDe(res.tag) + ' nachgefasst um ' + nyUhr(nowMs) + ' New York' +
      (handel.length ? ', gehandelt zur Eröffnung dieses Tages – ' + handel.join('; ') + '. Kosten ' + res.kostenBp + ' Bp je Seite.' : '.') +
      (res.entfallen.length ? ' Entfallen (Wert schon im Buch bzw. nicht mehr gehalten): ' + res.entfallen.join(', ') + '.' : '') +
      (res.wartet.length ? ' Eröffnung da, aber das Bargeld reicht nicht – bleibt offen: ' + res.wartet.join(', ') + '.' : '') +
      (res.rest ? ' Noch offen bis 16:00 New York: ' + auftraegeDe(res.rest.verkaeufe, res.rest.kaeufe.map(function (k) { return k.sym; })) + '.'
        : ' Damit ist nichts mehr offen.') +
      ' Simulation mit virtuellem Kapital, keine Anlageberatung.';
    return { applied: applied, txt: txt };
  }

  /** Die Journalzeile zum Ende des Nachfassens mit den liegen gebliebenen Auftraegen. Rein.
   *  Seit Auftrag Nr. 95: die Kaeufe nach Grund getrennt (B4) - ohne Eroeffnung, oder mit
   *  Eroeffnung, aber ohne genug Bargeld (Merker bargeld am Auftrag, gesetzt in mfdepot.js
   *  offenNachfassen aus nachfassen().wartet); ein liegen gebliebener Verkauf bleibt bis zur
   *  naechsten Umschichtung ODER zum Reihenende gehalten; am Folgetag steht der Tag da (C6). */
  function offenEndeJournal(offen, nowMs) {
    var verkaeufe = offen.verkaeufe || [], ohne = [], geld = [];
    (offen.kaeufe || []).forEach(function (k) { (k.bargeld ? geld : ohne).push(k.sym); });
    var teile = [], folgen = [];
    if (verkaeufe.length || ohne.length) teile.push('ohne Eröffnung: ' + auftraegeDe(verkaeufe, ohne));
    if (geld.length) teile.push('mit Eröffnung, aber ohne genug Bargeld: ' + auftraegeDe([], geld));
    var liste = teile.join('; ');
    if (verkaeufe.length) folgen.push(verkaeufe.length === 1 ? 'die Position bleibt gehalten, bis zur nächsten Umschichtung oder zum Reihenende'
      : 'die Positionen bleiben gehalten, bis zur nächsten Umschichtung oder zum Reihenende');
    if (ohne.length) folgen.push((ohne.length === 1 ? 'das Ziel wird nicht gekauft, sein Platz bleibt' : 'die Ziele werden nicht gekauft, ihre Plätze bleiben') + ' bis zur nächsten Umschichtung Bargeld');
    var satz = folgen.join('; ');
    var heute = nyTag(nowMs);
    return {
      applied: ['Momentum-Buch: Nachfassen beendet, liegen geblieben ' + liste],
      txt: 'Momentum-Buch: ' + (offen.nachkauf ? 'Nachkauf zur Eröffnung vom ' : 'Nachfassen der Umschichtung vom ') + datumDe(offen.tag) + ' beendet ' +
        (heute === offen.tag ? '(16:00 New York vorbei)' : 'am ' + datumDe(heute) + ' (Auftragstag vorbei)') + ' – liegen geblieben ' + liste + '.' +
        (satz ? ' ' + satz.charAt(0).toUpperCase() + satz.slice(1) + ' – wie in der Messung (ohne Eröffnung kein Handel).' : '') +
        (geld.length ? ' Für ' + geld.join(', ') + ' reichte das Bargeld nicht – ' + (geld.length === 1 ? 'sein Platz bleibt' : 'ihre Plätze bleiben') +
          ' bis zur nächsten Umschichtung leer.' : '') +
        ' Simulation mit virtuellem Kapital, keine Anlageberatung.'
    };
  }

  /* ================= Nachkauf nach einem Reihenende (Entscheid Wilhelm, 09.10.2026; Kleinsttest 30) =================
   *
   * Endet die Reihe eines gehaltenen Werts in den fuenf Handelstagen vor einer Umschichtung, hat er am
   * Ausfuehrungstag keine Eroeffnung und wird erst nach REIHENENDE_TAGE ausgebucht (bewusste Regel aus Nr. 93 A2:
   * live sind Ende und Aussetzer der Quelle nicht zu unterscheiden). Der Plan rechnet ohne ihn, und Kaeufe fallen
   * mangels Bargeld aus. Die Messung bucht ihn am ersten Tag ohne Zeile aus und kauft mit dem Erloes. Die App
   * holt das nach: die Kaeufe, die bei der Umschichtung mangels Bargeld ausfielen, merkt sich das Buch
   * (buch.nachkauf); bucht danach ein Reihenende Bargeld ins Buch, setzt der Takt sie als offene Auftraege
   * (buch.offen mit nachkauf: true) zur Eroeffnung des naechsten Handelstags an - gekauft wird wie beim
   * Nachfassen (nachfassen, Platzwert der Umschichtung, hoechstens das Bargeld, Regel K). Die 5-Tage-Regel
   * bleibt. Bis zur naechsten Umschichtung; sie ersetzt buch.nachkauf. Rein, in Node pruefbar. */

  /** Die Kaeufe einer Umschichtung, die mangels Bargeld ausfielen (fuehreAus setzt ihr stueck auf 0).
   *  ziel = die Zielliste in der Rangfolge, plan = der ausgefuehrte Plan, tag = Ausfuehrungstag, nowMs = Zeit
   *  der Umschichtung. depotwert und zielZahl des Plans werden mitgemerkt (Platzwert beim Nachkauf, unten).
   *  Rueckgabe { t, tag, depotwert, zielZahl, kaeufe: [{ sym, budget, rang }] } oder null. */
  function nachkaufMerken(ziel, plan, tag, nowMs) {
    var rang = {};
    (ziel || []).forEach(function (s, i) { rang[s] = i + 1; });
    var kaeufe = ((plan && plan.kaufen) || []).filter(function (o) { return !(o.stueck > 0) && o.budget > 0 && rang[o.sym]; })
      .map(function (o) { return { sym: o.sym, budget: o.budget, rang: rang[o.sym] }; });
    return kaeufe.length ? { t: nowMs, tag: tag, depotwert: plan.depotwert, zielZahl: ziel.length, kaeufe: kaeufe.sort(nachRang) } : null;
  }

  /** Der naechste Werktag nach 'JJJJ-MM-TT'. */
  function werktagNach(tag) { var t = tagPlus(tag, 1); while (!istWerktag(t)) t = tagPlus(t, 1); return t; }

  /** Den Nachkauf ansetzen: nur wenn seit der Umschichtung ein Reihenende gebucht wurde, ein gemerkter Kauf noch
   *  fehlt und das Bargeld fuer den staerksten davon die Grenze von Regel K1 erreicht. Platzwert wie in der Messung:
   *  (Depotwert des Plans + Gutschriften der Reihenenden seit der Umschichtung) / Zielzahl - die Messung haette die
   *  ausgebuchte Position im Depotwert gehabt. Tag ist heute (Werktag, vor
   *  16:00 New York) oder der naechste Werktag. Laeuft schon ein offen fuer diesen Tag, kommen die Kaeufe dazu;
   *  eines fuer einen anderen Tag bleibt unberuehrt. Ist kein gemerkter Kauf mehr offen, entfaellt buch.nachkauf.
   *  Mutiert das Buch. Rueckgabe { tag, kaeufe: [sym…] } oder null. */
  function nachkaufAnlegen(buch, nowMs, opts) {
    var n = buch && buch.nachkauf;
    if (!n || !n.kaeufe) return null;
    var imBuch = {};
    (buch.positionen || []).forEach(function (p) { imBuch[p.sym] = true; });
    var rest = n.kaeufe.filter(function (k) { return !imBuch[k.sym]; }).map(function (k) { return { sym: k.sym, budget: k.budget, rang: k.rang }; }).sort(nachRang);
    if (!rest.length) { delete buch.nachkauf; return null; }
    var gutschrift = 0, ende = false;
    (buch.trades || []).forEach(function (t) {
      if (t.art === 'reihenende' && t.t > n.t) { ende = true; gutschrift += t.stueck * t.kurs; }
    });
    if (!ende) return null;
    var platz = n.depotwert > 0 && n.zielZahl > 0 ? (n.depotwert + gutschrift) / n.zielZahl : 0;
    rest.forEach(function (k) { if (platz > k.budget) k.budget = platz; });
    var kl = opts && opts.kleinstAnteil > 0 ? opts.kleinstAnteil : 0;
    if (!(buch.cash > 0) || buch.cash < kl * rest[0].budget) return null;
    var heute = nyTag(nowMs);
    var tag = istWerktag(heute) && nowMs < nyZeit(heute, NACHFASSEN_BIS[0], NACHFASSEN_BIS[1]) ? heute : werktagNach(heute);
    var neu = rest;
    if (buch.offen) {
      if (buch.offen.tag !== tag) return null;
      var schon = {};
      (buch.offen.kaeufe || []).forEach(function (k) { schon[k.sym] = true; });
      neu = neu.filter(function (k) { return !schon[k.sym]; });
      if (!neu.length) return null;
      buch.offen.kaeufe = (buch.offen.kaeufe || []).concat(neu).sort(nachRang);
    } else buch.offen = { tag: tag, verkaeufe: [], kaeufe: neu, nachkauf: true };
    return { tag: tag, kaeufe: neu.map(function (k) { return k.sym; }) };
  }

  /** Die Journalzeile zum angesetzten Nachkauf. Rein. */
  function nachkaufJournal(x, nowMs) {
    return {
      applied: ['Momentum-Buch: Nachkauf angesetzt – ' + x.kaeufe.join(', ')],
      txt: 'Momentum-Buch: Ein Reihenende hat Bargeld frei gemacht. ' + (x.kaeufe.length === 1 ? 'Der Kauf ' : 'Die Käufe ') + x.kaeufe.join(', ') +
        ', bei der letzten Umschichtung mangels Bargeld ausgefallen, ' + (x.kaeufe.length === 1 ? 'wird' : 'werden') + ' zur Eröffnung vom ' +
        datumDe(x.tag) + ' nachgeholt (angesetzt um ' + nyUhr(nowMs) + ' New York; Platzwert wie in der Messung, höchstens das Bargeld). ' +
        'Die Messung hätte ' + (x.kaeufe.length === 1 ? 'ihn' : 'sie') + ' schon am Ausführungstag gekauft. Simulation mit virtuellem Kapital, keine Anlageberatung.'
    };
  }

  var MFHandel = {
    buchKonfig: buchKonfig, momentumZiel: momentumZiel, planeUmschichtung: planeUmschichtung,
    fuehreAus: fuehreAus, bewerte: bewerte, rebalanceFaellig: rebalanceFaellig,
    driftAbgleich: driftAbgleich, bewerteDrift: bewerteDrift,
    bucheMassnahmen: bucheMassnahmen, stempleKursT: stempleKursT, massnahmenJournal: massnahmenJournal,
    splitsAmAusfuehrungstag: splitsAmAusfuehrungstag,                    /* Generalprobe 23.11., Fund 1 */
    anspruecheVormerken: anspruecheVormerken,                            /* Generalprobe 23.11., Fund 5 */
    /* Auftrag Nr. 93 */
    nyTag: nyTag, nyZeit: nyZeit, tagPlus: tagPlus, istWerktag: istWerktag, werktagVor: werktagVor,
    letzterFertigerWerktag: letzterFertigerWerktag, bestandFrisch: bestandFrisch, ohneLaufendenBalken: ohneLaufendenBalken,
    balkenNach: balkenNach, faelligkeit: faelligkeit, stichtagPruefen: stichtagPruefen, rohBis: rohBis, zielAmStichtag: zielAmStichtag, tagesMs: tagesMs,
    schluesseAm: schluesseAm, punktTag: punktTag, bargeldAm: bargeldAm, datumDe: datumDe,
    reihenendeAusbuchen: reihenendeAusbuchen, reihenendeJournal: reihenendeJournal, REIHENENDE_TAGE: REIHENENDE_TAGE,
    SCHLUSS_FERTIG: SCHLUSS_FERTIG, HANDEL_AB: HANDEL_AB,
    /* Auftrag Nr. 94 */
    nyUhr: nyUhr, offeneAuftraege: offeneAuftraege, offenLaeuft: offenLaeuft, offenWerte: offenWerte, nachfassen: nachfassen,
    nachkaufMerken: nachkaufMerken, nachkaufAnlegen: nachkaufAnlegen, nachkaufJournal: nachkaufJournal, werktagNach: werktagNach,   /* Test 30 */
    offenBeenden: offenBeenden, offenText: offenText, nachfassenJournal: nachfassenJournal, offenEndeJournal: offenEndeJournal,
    eroeffnungAbwarten: eroeffnungAbwarten,   // Generalprobe 23.11., Fund 2
    NACHFASSEN_BIS: NACHFASSEN_BIS
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = MFHandel; return; }
  root.MFHandel = MFHandel;
})(typeof window !== 'undefined' ? window : globalThis);
