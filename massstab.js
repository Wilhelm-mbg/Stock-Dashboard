'use strict';
/* ================= Der Massstab: jedes Buch gegen den S&P 500 =================
 *
 * Wilhelms Regel seit dem 04.10.2026 (wiki/entscheide.md, "Richtung des Projekts"):
 * echtes Geld bekommt nur ein Buch, das NACH KOSTEN den S&P 500 schlaegt. Bis dahin
 * stand jedes Buch nur gegen sein eigenes Startkapital da - der Massstab fehlte.
 *
 * Hier steht die EINE Rechnung dafuer, ohne Fenster und ohne Netz, damit sie in Node
 * pruefbar ist. Kopf, Karten, Buecher-Verlauf und Benchmark lesen alle dieses Modul;
 * einen zweiten Rechenweg fuer den Prozentstand eines Buchs gibt es nicht (Klinke in
 * test-v6.js, Abschnitt 92).
 *
 * WAS DER MARKTSTAND IST (nachgelesen und an Yahoo gemessen, 04.10.2026):
 * Der Verlaufspunkt traegt im Feld spy den JUENGSTEN Balken der bereinigten SPY-Reihe
 * (Bestand drift_markt) vom Tag des Punkts. Der juengste Balken einer bereinigten
 * Reihe ist immer gleich dem unbereinigten Schluss - die Bereinigung schreibt nur die
 * Vergangenheit um. Zwei abgelegte Punkte aus verschiedenen Tagen ergeben deshalb den
 * KURSERTRAG des SPY, ohne Ausschuettungen.
 *
 * SEIT AUFTRAG NR. 81 (04.10.2026) - DER MARKT ALS GESAMTERTRAG: Wilhelms Massstab ist
 * der S&P 500, wie ihn ein Anleger im Indexfonds wirklich bekommt. Der Marktwert jedes
 * Punkts kommt deshalb aus der AKTUELL geladenen bereinigten Reihe (opts.markt):
 * juengster Balken, dessen Zeitstempel nicht nach dem Punkt liegt. Zwei Werte aus
 * DERSELBEN, in einem Abruf bereinigten Reihe ergeben den Gesamtertrag (an echten
 * Zahlen: 06.04. bis 02.10.2026 Kursertrag +16,80 %, Gesamtertrag +17,39 %). Fehlt die
 * Reihe, beginnt sie nach dem ersten Punkt oder ist sie zu alt, bleibt es beim
 * Kursertrag (abgelegte Staende, beim Intraday-Depot die Rohreihe) - und hinweis()
 * sagt das. NIE GEMISCHT: ein Vergleich nimmt alle Marktwerte aus einer Quelle.
 *
 * SEIT AUFTRAG NR. 91 (04.10.2026) - DER MARKT ZUM SELBEN ZEITPUNKT WIE DAS BUCH
 * (opts.punktKurs, nur die zwei Mittelfrist-Buecher): Der Tagesbalken traegt den Stempel
 * der Eroeffnung und den Kurs des Schlusses (wiki/fehlerformen.md). "Juengster Balken
 * nicht nach dem Punkt" gab einem Punkt mitten in der Sitzung deshalb einen Kurs aus
 * seiner Zukunft. Fuer die Buecher gilt jetzt: der im Punkt abgelegte Stand (spy - so
 * sah die App den Markt, als sie das Buch bewertete) ist der Marktwert; fuer den
 * Gesamtertrag kommt nur der Faktor der Ausschuettungen dazu:
 *     Marktwert(p) = p.spy * f(b),   f(b) = bereinigt(b) / roh(b)
 * aus den zwei jetzt geladenen Reihen desselben Abrufs (opts.markt, opts.marktRoh),
 * b = der Balken mit Stempel p.spyT (aus ihm stammt spy); fehlt spyT oder dieser
 * Balken, der juengste Balken mit Stempel <= p.t. Der Faktor eines Balkens ist ein
 * Verhaeltnis zweier Zahlen DESSELBEN Balkens - er haengt nicht davon ab, wann der
 * Schluss feststand. Ohne punktKurs rechnet vergleich() zeichengleich wie vorher
 * (Intraday-Depot).
 *
 * Die zwei Mittelfrist-Buecher buchen seit Auftrag Nr. 87 Splits und Ausschuettungen
 * (opts.buchAusschuettungen); das Intraday-Depot bucht keine. Das sagt hinweis(),
 * wortgleich an jeder Stelle.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {

  var TAG = 24 * 3600000;
  /* Aelter als fuenf Tage vor dem juengsten Punkt gilt die bereinigte Reihe als zu alt:
   * ueber ein langes Wochenende liegen bis zu vier Tage zwischen zwei Balken. */
  var MARKT_MAX_ALTER = 5 * TAG;

  function zahl(x) { return typeof x === 'number' && isFinite(x); }

  /** Der Index des juengsten Balkens von reihe [[t, kurs], …] (aufsteigend), dessen
   *  Zeitstempel nicht nach t liegt, oder -1, wenn die Reihe erst spaeter beginnt. */
  function indexAn(reihe, t) {
    var lo = 0, hi = reihe.length - 1, j = -1;
    while (lo <= hi) {
      var mi = (lo + hi) >> 1;
      if (reihe[mi][0] <= t) { j = mi; lo = mi + 1; } else hi = mi - 1;
    }
    return j;
  }

  /** Der juengste Balken von reihe [[t, kurs], …] (aufsteigend), dessen Zeitstempel
   *  nicht nach t liegt - sein Kurs, oder null, wenn die Reihe erst spaeter beginnt.
   *  DIE EINE Zuordnung von Marktwert zu Zeitpunkt (mitMarkt und vergleich lesen sie). */
  function marktAn(reihe, t) {
    var j = indexAn(reihe, t);
    return j >= 0 && zahl(reihe[j][1]) && reihe[j][1] > 0 ? reihe[j][1] : null;
  }

  /** Gehoeren bereinigte und unbereinigte Reihe zu DENSELBEN Balken? Gleich lang,
   *  gleiche Stempel, jeder rohe Schluss eine Zahl ueber null. Sonst gibt es keinen
   *  Faktor - und der Vergleich faellt mit Grund 'rohreihe-fehlt' zurueck. */
  function rohPasst(m, r) {
    if (!r || r.length !== m.length) return false;
    for (var i = 0; i < m.length; i++) {
      if (!r[i] || r[i][0] !== m[i][0] || !zahl(r[i][1]) || !(r[i][1] > 0)) return false;
    }
    return true;
  }

  /** Der Faktor der Ausschuettungen am Balken b: bereinigt(b) / roh(b), oder null. */
  function faktorAn(m, r, b) {
    return b >= 0 && zahl(m[b][1]) && m[b][1] > 0 ? m[b][1] / r[b][1] : null;
  }

  /** Der Balken, aus dem der Stand eines Punkts stammt: der mit Stempel p.spyT; fehlt
   *  spyT oder dieser Balken, der juengste mit Stempel <= p.t (Punkte von vor Nr. 91). */
  function balkenDesPunkts(m, p) {
    if (zahl(p.spyT)) {
      var j = indexAn(m, p.spyT);
      if (j >= 0 && m[j][0] === p.spyT) return j;
    }
    return indexAn(m, p.t);
  }

  /** Aus welcher Quelle kommen die Marktwerte EINES Vergleichs?
   *  art 'gesamt'  alle aus opts.markt, der aktuell geladenen BEREINIGTEN SPY-Reihe -
   *                mit opts.punktKurs: abgelegter Stand des Punkts mal Faktor f(b)
   *  art 'kurs'    Rueckfall: alle aus opts.marktKurs (unbereinigte Reihe), sonst aus
   *                dem im Punkt abgelegten spy (mit punktKurs IMMER aus spy); grund sagt,
   *                warum nicht 'gesamt': 'reihe-fehlt' | 'reihe-beginnt-spaeter' |
   *                'reihe-zu-alt' | 'rohreihe-fehlt' (nur mit punktKurs) */
  function marktWahl(tErst, tLetzt, opts) {
    var m = opts.markt, grund = null;
    if (!m || m.length < 2) grund = 'reihe-fehlt';
    else if (m[0][0] > tErst) grund = 'reihe-beginnt-spaeter';
    else if (tLetzt - m[m.length - 1][0] > MARKT_MAX_ALTER) grund = 'reihe-zu-alt';
    else if (opts.punktKurs && !rohPasst(m, opts.marktRoh)) grund = 'rohreihe-fehlt';
    var abgelegt = function (p) { return zahl(p.spy) && p.spy > 0 ? p.spy : null; };
    if (opts.punktKurs) {
      if (grund) return { art: 'kurs', grund: grund, wert: abgelegt };
      var r = opts.marktRoh;
      return { art: 'gesamt', grund: null, wert: function (p) {
        var s = abgelegt(p);
        if (s == null) return null;
        var f = faktorAn(m, r, balkenDesPunkts(m, p));
        return f == null ? null : s * f;
      } };
    }
    if (!grund) return { art: 'gesamt', grund: null, wert: function (p) { return marktAn(m, p.t); } };
    var k = opts.marktKurs;
    if (k && k.length) return { art: 'kurs', grund: grund, wert: function (p) { return marktAn(k, p.t); } };
    return { art: 'kurs', grund: grund, wert: abgelegt };
  }

  /** Der EINE Rechenweg fuer einen Prozentstand. null, wenn er sich nicht rechnen
   *  laesst - nie eine Null an der Stelle einer fehlenden Zahl. */
  function prozent(wert, basis) {
    if (!zahl(wert) || !zahl(basis) || !(basis > 0)) return null;
    return (wert / basis - 1) * 100;
  }

  function leer(grund) {
    return { ok: false, grund: grund, standPct: null, standT: null, buchPct: null, marktPct: null,
      abstandPp: null, seit: null, bis: null, abStart: false, anker: null, buchReihe: [], marktReihe: [],
      marktArt: null, marktGrund: null };
  }

  /** Buch gegen Markt ueber DENSELBEN Zeitraum.
   *
   *  verlauf   [{ t, <buchFeld>, <startFeld>, spy }], aufsteigend nach t
   *  opts.an        false -> Grund 'aus' (ein stehendes Buch wird nicht verglichen)
   *  opts.start     Startkapital des Buchs, falls der Punkt keines traegt - nie eine
   *                 feste Zahl aus dem Code
   *  opts.angelegt  Zeitpunkt, an dem das Buch angelegt wurde
   *  opts.markt     die aktuell geladene BEREINIGTE SPY-Reihe [[t, kurs], …] - traegt
   *                 sie den Zeitraum, ist der Markt der Gesamtertrag (marktArt 'gesamt')
   *  opts.marktKurs unbereinigte Reihe als Rueckfall (Intraday-Depot, Nasdaq); ohne
   *                 sie bleibt als Rueckfall der im Punkt abgelegte Stand (spy)
   *  opts.punktKurs true (nur die Mittelfrist-Buecher, Auftrag Nr. 91): Marktwert eines
   *                 Punkts = p.spy * bereinigt(b) / roh(b), b = Balken p.spyT (sonst der
   *                 juengste <= p.t); Rueckfall immer aus den abgelegten spy
   *  opts.marktRoh  die UNBEREINIGTE Reihe desselben Abrufs wie opts.markt (gleiche
   *                 Balken) - nur mit punktKurs gelesen
   *  opts.buchAusschuettungen  true: das Buch bucht Ausschuettungen (die zwei
   *                 Mittelfrist-Buecher seit Nr. 87) - steht im Ergebnis, hinweis() liest es
   *
   *  marktArt  'gesamt' | 'kurs' - aus welcher Quelle ALLE Marktwerte dieses Vergleichs
   *            stammen; marktGrund sagt bei 'kurs', warum es nicht der Gesamtertrag ist
   *  standPct  Stand des Buchs gegen sein Startkapital am juengsten Punkt
   *  buchPct, marktPct, abstandPp  ueber [seit, bis] - vom ersten Punkt, an dem Buch
   *            UND Markt einen Stand haben, bis zum juengsten solchen Punkt
   *  abStart   true: der Zeitraum beginnt am Tag, an dem das Buch angelegt wurde.
   *            Dann ist der Bezug des Buchs sein Startkapital (die Kosten des ersten
   *            Kaufs zaehlen mit), und buchPct ist derselbe Wert wie standPct.
   *            false: der Vergleich beginnt spaeter (fruehe Punkte ohne Marktstand,
   *            gekuerzter Verlauf). Dann ist der Bezug der Stand des Buchs an 'seit' -
   *            sonst stuenden zwei Zeitraeume nebeneinander.
   *  grund     'aus' | 'kein-stand' | 'kein-startkapital' | 'markt-kein-stand' |
   *            'erst-ein-punkt' | null */
  function vergleich(verlauf, buchFeld, startFeld, opts) {
    var r = rechne(verlauf, buchFeld, startFeld, opts || {});
    /* Nur mit dem Schalter: ohne ihn ist das Ergebnis zeichengleich wie vor Nr. 91. */
    if (opts && opts.buchAusschuettungen) r.buchAusschuettungen = true;
    return r;
  }
  function rechne(verlauf, buchFeld, startFeld, opts) {
    if (opts.an === false) return leer('aus');
    var pts = [], ohneStart = false;
    (verlauf || []).forEach(function (p) {
      if (!p || !zahl(p[buchFeld])) return;
      var st = zahl(p[startFeld]) && p[startFeld] > 0 ? p[startFeld] : (zahl(opts.start) && opts.start > 0 ? opts.start : null);
      if (!st) { ohneStart = true; return; }
      pts.push({ t: p.t, idx: p[buchFeld] / st, spy: p.spy, spyT: p.spyT });
    });
    if (!pts.length) return leer(ohneStart ? 'kein-startkapital' : 'kein-stand');
    var z = pts[pts.length - 1];
    /* Die Quelle des Markts wird EINMAL fuer den ganzen Vergleich gewaehlt - gemessen
     * am ersten und am juengsten Punkt des Buchs. */
    var wahl = marktWahl(pts[0].t, z.t, opts);
    pts.forEach(function (p) { p.spy = wahl.wert(p); });
    var r = leer(null);
    r.marktArt = wahl.art;
    r.marktGrund = wahl.grund;
    r.standPct = prozent(z.idx, 1);
    r.standT = z.t;
    r.buchReihe = pts.map(function (p) { return [p.t, prozent(p.idx, 1)]; });
    var gem = pts.filter(function (p) { return p.spy != null; });
    if (!gem.length) { r.grund = 'markt-kein-stand'; return r; }
    var a = gem[0], e = gem[gem.length - 1];
    if (!(e.t > a.t)) { r.grund = 'erst-ein-punkt'; return r; }
    r.abStart = a === pts[0] && zahl(opts.angelegt) && a.t >= opts.angelegt - 60000 && a.t - opts.angelegt < TAG;
    var basis = r.abStart ? 1 : a.idx;
    r.ok = true;
    r.buchPct = prozent(e.idx, basis);
    r.marktPct = prozent(e.spy, a.spy);
    /* Der Abstand aus den GERUNDETEN Staenden: neben "+1,2 %" und "+2,0 %" darf nicht
     * "-0,7 Pp" stehen, nur weil die dritte Nachkommastelle anders faellt. */
    r.abstandPp = (Math.round(r.buchPct * 10) - Math.round(r.marktPct * 10)) / 10;
    r.seit = a.t;
    r.bis = e.t;
    /* Die Marktlinie setzt dort an, wo das Buch am Beginn des Vergleichs steht: beim
     * Start auf dem Startkapital (0 %), sonst auf dem Stand des Buchs an 'seit'. */
    r.anker = prozent(basis, 1);
    r.marktReihe = gem.map(function (p) { return [p.t, prozent(basis * p.spy / a.spy, 1)]; });
    return r;
  }

  /** Aus einer Wertreihe [[t, wert], …] und einer Marktreihe [[t, kurs], …] einen
   *  Verlauf bauen, wie vergleich() ihn liest: jeder Punkt bekommt den juengsten
   *  Marktkurs, dessen Zeitstempel nicht nach ihm liegt. Fehlt die Marktreihe, bleibt
   *  spy null - der Vergleich meldet dann "Markt: noch kein Stand". */
  function mitMarkt(reihe, marktReihe, feld, startFeld, start) {
    var m = marktReihe || [];
    return (reihe || []).map(function (p) {
      var o = { t: p[0], spy: marktAn(m, p[0]) };
      o[feld] = p[1];
      o[startFeld] = start;
      return o;
    });
  }

  function datum(ms) {
    var d = new Date(ms);
    function zz(n) { return (n < 10 ? '0' : '') + n; }
    return zz(d.getDate()) + '.' + zz(d.getMonth() + 1) + '.' + d.getFullYear();
  }
  function pp(pz1, v) { return pz1(v).replace(' %', ' Pp'); }

  /* Was statt der Marktzahl dasteht, wenn es keine gibt - ein Grund, keine Null. */
  function marktLuecke(v) {
    if (v.grund === 'vor-liquide') return VOR_LIQUIDE + (v.voraussichtlich ? ', voraussichtlich am ' + v.voraussichtlich : '');
    return v.grund === 'erst-ein-punkt' ? 'Markt: Vergleich ab dem zweiten Stand' : 'Markt: noch kein Stand';
  }
  /* Runde 2 (Nr. 108, F9): das Momentum-Buch wird erst ab seiner ersten Umschichtung nach der gemessenen Regel
   * mit dem Markt verglichen (mfdepot.js vergleich). Bis dahin steht dieser Satz statt einer Zahl. */
  var VOR_LIQUIDE = 'Vergleich beginnt mit der ersten Umschichtung nach der gemessenen Regel';
  /** Ein Vergleich, der noch nicht beginnt: Stand des Buchs bleibt (standPct), Zeitraum und Markt fallen weg.
   *  voraussichtlich = Datum der naechsten Umschichtung als Text ('TT.MM.JJJJ') oder null. */
  function vorLiquide(r, voraussichtlich) {
    var aus = leer('vor-liquide');
    if (r) { aus.standPct = r.standPct; aus.standT = r.standT; aus.buchReihe = r.buchReihe; aus.buchAusschuettungen = r.buchAusschuettungen; }
    aus.voraussichtlich = voraussichtlich || null;
    return aus;
  }

  /** Die Buecher im Kopf, kurz: "Momentum +1,2 % · Drift -0,4 % · S&P 500 +2,0 %".
   *  Laufen die Vergleiche ueber denselben Zeitraum, steht der Markt EINMAL; sonst
   *  bekommt jedes Buch seinen Markt in Klammern - zwei Zeitraeume teilen sich nie
   *  eine Zahl. eintraege = [[label, vergleich], …], pz1 = das Prozentformat der App. */
  function kopfText(eintraege, pz1) {
    var teile = [], zusatz = [], schluessel = {};
    eintraege.forEach(function (e) {
      var label = e[0], v = e[1];
      if (!v || v.grund === 'aus') { teile.push(label + (v ? ' aus' : ' noch kein Stand')); zusatz.push(null); return; }
      if (v.standPct == null) { teile.push(label + ' noch kein Stand'); zusatz.push(null); return; }
      teile.push(label + ' ' + pz1(v.ok ? v.buchPct : v.standPct));
      var zs = v.ok ? 'S&P 500 ' + pz1(v.marktPct) : marktLuecke(v);
      zusatz.push(zs);
      schluessel[(v.ok ? v.seit + '|' + v.bis + '|' : '') + zs] = true;
    });
    var arten = Object.keys(schluessel);
    if (!arten.length) return teile.join(' · ');
    if (arten.length === 1) return teile.join(' · ') + ' · ' + zusatz.filter(Boolean)[0];
    return teile.map(function (t, i) { return zusatz[i] ? t + ' (' + zusatz[i] + ')' : t; }).join(' · ');
  }

  /** Ein Buch ausfuehrlich, mit Zeitraum:
   *  "Momentum +1,2 % · S&P 500 +2,0 % · Abstand -0,8 Pp (seit 02.09.2026, Stand 04.10.2026, nach Kosten)". */
  function langText(label, v, pz1) {
    if (!v || v.grund === 'aus') return label + (v ? ' aus – kein Vergleich' : ' noch kein Stand');
    if (v.standPct == null) return label + ' noch kein Stand';
    if (!v.ok) return label + ' ' + pz1(v.standPct) + ' · ' + marktLuecke(v);
    return label + ' ' + pz1(v.buchPct) + ' · S&P 500 ' + pz1(v.marktPct) + ' · Abstand ' + pp(pz1, v.abstandPp) +
      ' (seit ' + datum(v.seit) + (v.abStart ? '' : ' – ab dem ersten gemeinsamen Stand, nicht ab dem Start des Buchs') +
      ', Stand ' + datum(v.bis) + ', nach Kosten)';
  }

  /* ---- Die Beschriftung: wie der Vergleich gebaut ist - EINE Quelle, jede Stelle liest sie ----
   * Der Markt steht als Gesamtertrag da, sobald die bereinigte Reihe den Zeitraum
   * traegt. Das Intraday-Depot bucht keine Ausschuettung - der Vergleich ist dort um
   * die Ausschuettungen des Depots zu streng, und genau das steht da. Die zwei
   * Mittelfrist-Buecher buchen sie seit Auftrag Nr. 87 (v.buchAusschuettungen) - fuer sie
   * steht seit Nr. 91 "Buch und Markt mit". Im Rueckfall steht der Kursertrag da, mit
   * dem Grund. */
  var HINWEIS_GESAMT = 'S&P 500 als SPY-Gesamtertrag. Markt mit, Buch ohne Ausschüttungen – der Vergleich ist um die Ausschüttungen des Buchs zu streng.';
  var HINWEIS_KURS = 'S&P 500 als SPY-Tageskurs. Buch und Markt ohne Ausschüttungen';
  var HINWEIS_BUCH_GESAMT = 'S&P 500 als SPY-Gesamtertrag. Buch und Markt mit Ausschüttungen; Marktstand je Punkt so, wie die App ihn beim Bewerten des Buchs sah.';
  var HINWEIS_BUCH_KURS = 'S&P 500 als SPY-Tageskurs. Buch mit, Markt ohne Ausschüttungen';
  var GRUND_KURS = {
    'reihe-fehlt': 'die bereinigte SPY-Reihe ist noch nicht geladen',
    'reihe-beginnt-spaeter': 'die bereinigte SPY-Reihe beginnt nach dem ersten Stand',
    'reihe-zu-alt': 'die bereinigte SPY-Reihe ist zu alt',
    'rohreihe-fehlt': 'die unbereinigte SPY-Reihe fehlt oder passt nicht zur bereinigten'
  };
  /** Der Hinweis zu EINEM Vergleich. Leer, solange es keinen Markt-Zeitraum gibt. */
  function hinweis(v) {
    if (!v || !v.ok) return '';
    var mit = !!v.buchAusschuettungen;
    if (v.marktArt === 'gesamt') return mit ? HINWEIS_BUCH_GESAMT : HINWEIS_GESAMT;
    return (mit ? HINWEIS_BUCH_KURS : HINWEIS_KURS) +
      (GRUND_KURS[v.marktGrund] ? ' (' + GRUND_KURS[v.marktGrund] + ' – deshalb der Kursertrag)' : '') + '.';
  }
  /** Der Hinweis zu MEHREREN Vergleichen an einer Stelle (Kopf, Buecher-Verlauf):
   *  sind alle gleich gebaut, steht er einmal; sonst je Buch mit Namen davor.
   *  eintraege = [[label, vergleich], …] */
  function hinweise(eintraege) {
    var mit = (eintraege || []).filter(function (e) { return !!hinweis(e[1]); });
    if (!mit.length) return '';
    var erster = hinweis(mit[0][1]);
    if (mit.every(function (e) { return hinweis(e[1]) === erster; })) return erster;
    return mit.map(function (e) { return e[0] + ': ' + hinweis(e[1]); }).join(' ');
  }
  /** Kurz, fuer eine Legende oder eine Berichtszeile: welcher Ertrag des Markts dasteht. */
  function marktZusatz(v) { return (v && v.marktArt === 'gesamt' ? 'mit' : 'ohne') + ' Ausschüttungen'; }
  /** Der Name der Marktlinie in einer Legende. */
  function marktName(v) { return 'S&P 500 (SPY, ' + marktZusatz(v) + ')'; }

  /* ================= Massstab Nasdaq-100 nach deutscher Steuer (Auftrag Nr. 126, 26.10.2026) =================
   *
   * Wilhelms Massstab seit dem 23.10.2026: das Buch NACH STEUER gegen den Nasdaq-100 mit Ausschuettungen NACH STEUER (Fonds
   * thesaurierend, Vorabpauschale, Verkauf am Ende) - wie die Pruefstrasse (Nr. 121-2b, adapter/korb-kosten.js nachSteuer) und
   * Nr. 122. Handelbar waere der "Xtrackers Nasdaq 100 UCITS ETF 1C" (IE00BMFKG444) - nur genannt, seine Kurse braucht es nicht:
   * gerechnet wird mit der QQQ-Reihe (TER beider 0,20 % - Aufschlag 0, wie korb-kosten.js). S&P 500 und brutto nachrichtlich.
   * Das Steuermodell ist die Kopie aus Nr. 82 (steuer.js). Ein Rechenmodell, keine Steuerberatung.
   *
   * BUCH NACH STEUER - BEGRUENDETE ABWEICHUNG VON DER MESSUNG: Nr. 82 zieht die Steuer bei jeder Umschichtung aus dem Bargeld
   * (zwischen Verkaeufen und Kaeufen). Das App-Buch handelt BRUTTO weiter (sein Stand bleibt mit allen alten Zahlen vergleichbar);
   * die Steuer wird als Schatten gerechnet: realisierte Gewinne je Umschichtung (Trades art verkauf/reihenende, ein Zeitstempel =
   * ein Abrechnungsschritt) in den Aktien-Verlusttopf, Ausschuettungen netto, am Ende alles verkauft (Kosten je Seite = der mittlere
   * Kostensatz der Trades des Buchs) mit Endabrechnung. Nicht abgebildet: dass die gezahlte Steuer nicht mehr mitarbeitet (Zinseszins
   * der Steuerlast) - ueber Monate ein Bruchteil eines Pp.
   * Nachbesserung QS (F1/F2, 26.10.2026): gerechnet wird je VORWAERTSABSCHNITT ab dem Buchwert am Stichtag seines Beginns (abschnittBezug),
   * nie ab dem Startkapital; p. a. erst ab 20 Handelstagen; Anfang und Ende der QQQ-Reihe werden geprueft (Luecke > 3 Tage -> Grund).
   *
   * QQQ-TAGE aus dem Alpaca-Minutenarchiv (Kreuzprobe 26.10.2026: Yahoo-Tagesschluss weicht bis 0,023 Pp je Tag ab, > 0,01 Pp ->
   * Alpaca wie Nr. 122): qqqTage ist eine Kopie von pruefstrasse/daten/qqq-bauen.js tageAus + ausschuettungen (Eroeffnung = erste
   * Kerze ab 09:30, Schluss = Eroeffnung der 16:00-Kerze, Halbtag 13:00; Ausschuettungen aus alpaca-massnahmen, dedupliziert nach
   * Ex-Tag und Betrag). main.js liest die Dateien (Auskunft massstab-qqq), hier steht nur die Rechnung. */
  var ETF_NASDAQ = { name: 'Xtrackers Nasdaq 100 UCITS ETF 1C', isin: 'IE00BMFKG444', ter: 0.0020 };
  var TER_QQQ = 0.0020;
  var MASSSTAB_NAME = 'Nasdaq-100 nach Steuer';

  /** Kopie pruefstrasse/daten/qqq-bauen.js nyVersatzStunden / nyZeit / minuteVon (US-Sommerzeit ohne Tabelle). */
  function nyVersatzStunden(ms) {
    var d = new Date(ms), j = d.getUTCFullYear();
    function sonntag(monat, n) { var t = new Date(Date.UTC(j, monat, 1)); var wd = t.getUTCDay(); return 1 + ((7 - wd) % 7) + 7 * (n - 1); }
    var a = Date.UTC(j, 2, sonntag(2, 2), 7), e = Date.UTC(j, 10, sonntag(10, 1), 6);
    return ms >= a && ms < e ? -4 : -5;
  }
  function nyZeitQ(ms) { var lok = new Date(ms + nyVersatzStunden(ms) * 3600000); return { datum: lok.toISOString().slice(0, 10), min: lok.getUTCHours() * 60 + lok.getUTCMinutes() }; }
  function minuteVon(hhmm) { var p = String(hhmm).split(':'); return +p[0] * 60 + +p[1]; }
  /** Kopie qqq-bauen.js ausschuettungen: je Ex-Tag die Betraege (cash_dividends), dedupliziert nach (Ex-Tag, Betrag). */
  function qqqAusschuettungen(saetze) {
    var je = {}, gesehen = {}, doppelt = [];
    (saetze || []).forEach(function (x) {
      if (x._art !== 'cash_dividends' || !(Number(x.rate) > 0)) return;
      var key = x.ex_date + '|' + Number(x.rate);
      if (gesehen[key]) { doppelt.push({ exTag: x.ex_date, betrag: Number(x.rate) }); return; }
      gesehen[key] = true; (je[x.ex_date] = je[x.ex_date] || []).push(Number(x.rate));
    });
    return { je: je, doppelt: doppelt };
  }
  /** Kopie qqq-bauen.js tageAus (ohne cb): kerzen [[ms, schluss, umsatz, hoch, tief, eroeffnung], ...] sortiert,
   *  kal { 'JJJJ-MM-TT': { open, close } }, aus { Ex-Tag: [Betraege] } -> [{ d, o, c, aus, halb, schlussArt }]. */
  function qqqTage(kerzen, kal, aus) {
    var je = {};
    (kerzen || []).forEach(function (b) {
      var z = nyZeitQ(b[0]), k = kal[z.datum]; if (!k) return;
      var t = je[z.datum] || (je[z.datum] = { auf: NaN, aufMin: 9999, s: NaN, letzt: NaN, letztMin: -1, sMin: minuteVon(k.close), halb: k.close !== '16:00' });
      if (z.min >= 570 && z.min < t.sMin && z.min < t.aufMin) { t.aufMin = z.min; t.auf = b[5]; }
      if (z.min === t.sMin) t.s = b[5];
      if (z.min >= 570 && z.min < t.sMin && z.min > t.letztMin) { t.letztMin = z.min; t.letzt = b[1]; }
    });
    var tage = [];
    Object.keys(je).sort().forEach(function (d) {
      var t = je[d];
      if (!(t.auf > 0) || t.aufMin > 600) return;
      var c = t.s > 0 ? t.s : t.letzt, art = t.s > 0 ? 'eroeffnung-' + (t.halb ? '13:00' : '16:00') : 'schluss-letzte-vor-' + (t.halb ? '13:00' : '16:00');
      if (!(c > 0)) return;
      tage.push({ d: d, o: t.auf, c: c, aus: (aus || {})[d] || [], halb: t.halb || undefined, schlussArt: art });
    });
    return tage;
  }

  function steuerModul() {
    if (typeof module !== 'undefined' && module.exports) return require('./steuer.js');
    return root.Steuer || null;
  }
  function tagIso(ms) { return new Date(ms).toISOString().slice(0, 10); }

  /** Werktage (Mo-Fr) nach tagA bis einschliesslich tagB ('JJJJ-MM-TT'); ein Kalender fuehrt massstab.js nicht. */
  function werktageZwischen(tagA, tagB) {
    var n = 0, t = Date.parse(tagA + 'T00:00:00Z') + 86400000, ende = Date.parse(tagB + 'T00:00:00Z');
    for (; t <= ende && n < 4000; t += 86400000) { var w = new Date(t).getUTCDay(); if (w !== 0 && w !== 6) n++; }
    return n;
  }
  function tagDe(tag) { return tag ? tag.slice(8, 10) + '.' + tag.slice(5, 7) + '.' + tag.slice(0, 4) : '?'; }
  var MIN_TAGE_PA = 20, MAX_LUECKE_TAGE = 3;

  /** QS F1 (Nachbesserung Nr. 126): der BEZUG eines Vorwaertsabschnitts - der Buchwert am Schluss des Stichtags, an dem der Abschnitt
   *  beginnt (erste liquide Umschichtung bzw. Umstellung der Regeln), und je gehaltener Position ihr Wert zu diesem Schluss (fiktiver
   *  Einstand fuer den Steuertopf: nur, was IM Abschnitt verdient wird, wird versteuert) neben ihrem Einstand. preise = Schluesse des
   *  Stichtags (MFHandel.schluesseAm); ohne Kurs zaehlt der Einstand. start = Zeitpunkt des Abschnittsbeginns, tag = Stichtag. Rein. */
  function abschnittBezug(buch, preise, start, tag) {
    var wert = buch.cash, pos = {};
    (buch.positionen || []).forEach(function (p) {
      var k = (preise || {})[p.sym], w = p.stueck * (k > 0 ? k : p.einstand);
      wert += w;
      pos[p.sym] = { wertStart: w, einstandSumme: p.stueck * p.einstand };
    });
    return { start: start, tag: tag || null, wert: wert, positionen: pos };
  }

  /**
   * Das Buch nach Steuer gegen den Nasdaq-100 nach Steuer UEBER EINEN VORWAERTSABSCHNITT. e:
   *   buch        das Momentum-Buch (cash, positionen, trades, massnahmen)
   *   abschnitt   der Bezug des Abschnitts (abschnittBezug: start, tag, wert, positionen) - ohne ihn keine Zahl (Grund)
   *   preise      {SYM: Kurs} - die Kurse der Bewertung (wie MFHandel.bewerte); endeMs = Zeitpunkt dieser Kurse
   *   qqq         [{ d, o, c, aus }] - QQQ-Tage (qqqTage); Anfang und Ende werden geprueft (QS F2, wie korb-kosten.js)
   *   marktPct    nachrichtlich: S&P 500 in % aus vergleich() - nur, wenn marktAbStart (derselbe Beginn) gesetzt ist
   * Rendite = Wert jetzt / Buchwert am Stichtag des Abschnitts (QS F1: nicht das Startkapital). p. a. erst ab MIN_TAGE_PA Handelstagen
   * (QQQ-Tage des Abschnitts), sonst nur der Gesamtertrag (gesamt) mit paGrund "zu kurz fuer p. a.". Wirft nie.
   */
  function nachSteuer(e) {
    var aus = { ok: false, grund: null, von: null, bis: null, jahre: null, handelstage: null, einheit: null, paGrund: null, bruttoPa: null, buchNachSteuerPa: null,
      massstab: { name: MASSSTAB_NAME, etf: ETF_NASDAQ.isin, ertragPa: null, nachSteuerPa: null, qqqVon: null, qqqBis: null }, abstandNachSteuerPa: null, spyPa: null,
      kostenJahrPp: null, gesamt: null, bezug: null, steuer: null };
    try {
      var S = steuerModul(), b = e && e.buch, A = e && e.abschnitt;
      if (!S) { aus.grund = 'Steuerrechner (steuer.js) nicht geladen'; return aus; }
      if (!b) { aus.grund = 'kein Buch'; return aus; }
      if (!A || !(A.start > 0) || !(A.wert > 0)) { aus.grund = 'Bezug des Vorwärtsabschnitts fehlt (Buchwert am Stichtag)'; return aus; }
      var startMs = A.start, endeMs = e.endeMs;
      aus.bezug = { start: startMs, tag: A.tag, wert: A.wert };
      if (!(endeMs > startMs)) { aus.grund = 'der Vorwärtsabschnitt hat noch keinen Zeitraum'; return aus; }
      aus.von = tagIso(startMs); aus.bis = tagIso(endeMs);
      var satz = S.MODELL.steuersatz, W0 = A.wert;
      /* Buch brutto: Wert jetzt gegen den Buchwert am Stichtag */
      var wert = b.cash, kSumme = 0, wSumme = 0, kostenUsd = 0;
      (b.positionen || []).forEach(function (p) { var k = (e.preise || {})[p.sym]; wert += p.stueck * (k > 0 ? k : p.einstand); });
      var trades = (b.trades || []).filter(function (t) { return t.t >= startMs && (t.art === 'kauf' || t.art === 'verkauf'); });
      trades.forEach(function (t) {
        var w = t.stueck * t.kurs, k = t.kostenSpanne != null ? t.kostenSpanne + t.kostenGebuehr : w * 0.002;
        kostenUsd += k; kSumme += k; wSumme += w;
      });
      /* Aktien-Verlusttopf: je Zeitstempel ein Abrechnungsschritt; eine Position, die schon am Stichtag gehalten wurde, zaehlt nur ihren
       * Gewinn IM Abschnitt (Erloes - Wert am Stichtag statt Erloes - Einstand: pnl + Einstand - Wert am Stichtag) */
      var vorher = {};
      Object.keys(A.positionen || {}).forEach(function (s) { vorher[s] = A.positionen[s]; });
      var topf = S.topfNeu(satz), schritte = {};
      (b.trades || []).forEach(function (t) {
        if (t.t < startMs || (t.art !== 'verkauf' && t.art !== 'reihenende') || typeof t.pnl !== 'number') return;
        var g = t.pnl, v = vorher[t.sym];
        if (v) { g = t.pnl + v.einstandSumme - v.wertStart; delete vorher[t.sym]; }
        (schritte[t.t] = schritte[t.t] || []).push(g);
      });
      Object.keys(schritte).map(Number).sort(function (x, y) { return x - y; }).forEach(function (t) {
        S.topfJahr(topf, +tagIso(t).slice(0, 4));
        schritte[t].forEach(function (g) { S.topfBuche(topf, g); });
        S.topfAbrechnen(topf);
      });
      S.topfJahr(topf, +tagIso(endeMs).slice(0, 4));
      var divBrutto = 0;
      (b.massnahmen || []).forEach(function (m) { if (m.art === 'div' && m.t >= startMs && m.summe > 0) divBrutto += m.summe; });
      var divSteuer = divBrutto * satz;
      var kEnde = wSumme > 0 ? kSumme / wSumme : 0.002, erloes = 0, gewinn = 0;
      (b.positionen || []).forEach(function (p) {
        var k = (e.preise || {})[p.sym], kurs = k > 0 ? k : p.einstand, x = p.stueck * kurs * (1 - kEnde), v = vorher[p.sym];
        erloes += x; gewinn += x - (v ? v.wertStart : p.stueck * p.einstand);
      });
      var topfDanach = S.topfStand(topf) + gewinn, steuerEnde = Math.max(0, topfDanach) * satz - topf.gezahlt;
      var frueher = topf.jahre.slice(0, -1).reduce(function (a, j) { return a + j.aktiensteuer; }, 0);
      var aktienSteuer = frueher + topf.gezahlt + steuerEnde;
      var buchNach = b.cash + erloes - aktienSteuer - divSteuer;
      aus.steuer = { modell: S.QUELLE, satz: satz, aktienSteuer: aktienSteuer, ausschuettungSteuer: divSteuer, endverkaufKostenSatz: kEnde,
        verlustvortrag: topfDanach < 0 ? -topfDanach : 0, buchEnde: buchNach, buchWert: wert, bezugWert: W0 };
      /* Nasdaq-100: QQQ-Fonds ab dem ersten QQQ-Tag am oder nach dem Start; Anfang und Ende muessen passen (QS F2) */
      var q = (e.qqq || []).filter(function (x) { return x.d >= aus.von && x.d <= aus.bis; });
      if (!q.length) { aus.grund = 'QQQ-Reihe (Nasdaq-100) für den Abschnitt ab ' + tagDe(aus.von) + ' fehlt'; return aus; }
      var qVon = q[0].d, qBis = q[q.length - 1].d, luA = werktageZwischen(aus.von, qVon), luE = werktageZwischen(qBis, aus.bis);
      aus.massstab.qqqVon = qVon; aus.massstab.qqqBis = qBis;
      if (luE > MAX_LUECKE_TAGE) { aus.grund = 'Maßstab bis ' + tagDe(qBis) + ', Lücke ' + luE + ' Tage bis zum Bewertungstag ' + tagDe(aus.bis); return aus; }
      if (luA > MAX_LUECKE_TAGE) { aus.grund = 'Maßstab erst ab ' + tagDe(qVon) + ', Lücke ' + luA + ' Tage nach dem Beginn ' + tagDe(aus.von); return aus; }
      var reihe = q.map(function (x) { return { datum: x.d, eroeffnung: x.o, schluss: x.c, aus: x.aus || [] }; });
      var fo = S.fonds(reihe, S.START, S.mit(S.MODELL, { kostenPa: ETF_NASDAQ.ter - TER_QQQ }));
      var rB = wert / W0, rN = buchNach / W0, rQa = fo.endA / S.START, rQb = fo.endB / S.START;
      aus.handelstage = q.length;
      aus.gesamt = { bruttoPct: (rB - 1) * 100, buchNachSteuerPct: (rN - 1) * 100, massstabBruttoPct: (rQa - 1) * 100, massstabNachSteuerPct: (rQb - 1) * 100,
        abstandPp: (rN - rQb) * 100, kostenPp: kostenUsd / W0 * 100, spyPct: typeof e.marktPct === 'number' && isFinite(e.marktPct) && e.marktAbStart ? e.marktPct : null };
      if (q.length >= MIN_TAGE_PA) {
        var jahre = (Date.parse(aus.bis) - Date.parse(aus.von)) / (365.25 * 86400000), jahreQ = (Date.parse(qBis) - Date.parse(qVon)) / (365.25 * 86400000);
        aus.jahre = jahre; aus.einheit = 'pa';
        aus.bruttoPa = S.pa(rB * S.START, jahre);
        aus.buchNachSteuerPa = S.pa(rN * S.START, jahre);
        aus.massstab.ertragPa = S.pa(fo.endA, jahreQ);
        aus.massstab.nachSteuerPa = S.pa(fo.endB, jahreQ);
        aus.abstandNachSteuerPa = aus.buchNachSteuerPa - aus.massstab.nachSteuerPa;
        aus.kostenJahrPp = kostenUsd / W0 * 100 / jahre;
        if (aus.gesamt.spyPct != null) aus.spyPa = (Math.pow(1 + aus.gesamt.spyPct * 0.01, 1 / jahre) - 1) * 100;
      } else {
        aus.einheit = 'gesamt';
        aus.paGrund = 'zu kurz für p. a. (' + q.length + ' Handelstage, p. a. ab ' + MIN_TAGE_PA + ') – Gesamtertrag seit ' + tagDe(aus.von);
      }
      aus.ok = true;
      return aus;
    } catch (err) { aus.grund = 'Rechnung nach Steuer: ' + String((err && err.message) || err).slice(0, 120); return aus; }
  }


  var Massstab = {
    prozent: prozent, vergleich: vergleich, vorLiquide: vorLiquide, mitMarkt: mitMarkt, marktAn: marktAn,
    kopfText: kopfText, langText: langText, datum: datum,
    hinweis: hinweis, hinweise: hinweise, marktName: marktName, marktZusatz: marktZusatz,
    MARKT_MAX_ALTER: MARKT_MAX_ALTER,
    /* Auftrag Nr. 126 */
    nachSteuer: nachSteuer, abschnittBezug: abschnittBezug, MIN_TAGE_PA: MIN_TAGE_PA, qqqTage: qqqTage, qqqAusschuettungen: qqqAusschuettungen, ETF_NASDAQ: ETF_NASDAQ, MASSSTAB_NAME: MASSSTAB_NAME
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Massstab; return; }
  root.Massstab = Massstab;
})(typeof window !== 'undefined' ? window : globalThis);
