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
 * Die Buecher bewerten zum juengsten Kurs und buchen keine Ausschuettung - das sagt
 * hinweis() ebenfalls, wortgleich an jeder Stelle.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {

  var TAG = 24 * 3600000;
  /* Aelter als fuenf Tage vor dem juengsten Punkt gilt die bereinigte Reihe als zu alt:
   * ueber ein langes Wochenende liegen bis zu vier Tage zwischen zwei Balken. */
  var MARKT_MAX_ALTER = 5 * TAG;

  function zahl(x) { return typeof x === 'number' && isFinite(x); }

  /** Der juengste Balken von reihe [[t, kurs], …] (aufsteigend), dessen Zeitstempel
   *  nicht nach t liegt - sein Kurs, oder null, wenn die Reihe erst spaeter beginnt.
   *  DIE EINE Zuordnung von Marktwert zu Zeitpunkt (mitMarkt und vergleich lesen sie). */
  function marktAn(reihe, t) {
    var lo = 0, hi = reihe.length - 1, j = -1;
    while (lo <= hi) {
      var mi = (lo + hi) >> 1;
      if (reihe[mi][0] <= t) { j = mi; lo = mi + 1; } else hi = mi - 1;
    }
    return j >= 0 && zahl(reihe[j][1]) && reihe[j][1] > 0 ? reihe[j][1] : null;
  }

  /** Aus welcher Quelle kommen die Marktwerte EINES Vergleichs?
   *  art 'gesamt'  alle aus opts.markt, der aktuell geladenen BEREINIGTEN SPY-Reihe
   *  art 'kurs'    Rueckfall: alle aus opts.marktKurs (unbereinigte Reihe), sonst aus
   *                dem im Punkt abgelegten spy; grund sagt, warum nicht 'gesamt':
   *                'reihe-fehlt' | 'reihe-beginnt-spaeter' | 'reihe-zu-alt' */
  function marktWahl(tErst, tLetzt, opts) {
    var m = opts.markt, grund = null;
    if (!m || m.length < 2) grund = 'reihe-fehlt';
    else if (m[0][0] > tErst) grund = 'reihe-beginnt-spaeter';
    else if (tLetzt - m[m.length - 1][0] > MARKT_MAX_ALTER) grund = 'reihe-zu-alt';
    if (!grund) return { art: 'gesamt', grund: null, wert: function (p) { return marktAn(m, p.t); } };
    var k = opts.marktKurs;
    if (k && k.length) return { art: 'kurs', grund: grund, wert: function (p) { return marktAn(k, p.t); } };
    return { art: 'kurs', grund: grund, wert: function (p) { return zahl(p.spy) && p.spy > 0 ? p.spy : null; } };
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
    opts = opts || {};
    if (opts.an === false) return leer('aus');
    var pts = [], ohneStart = false;
    (verlauf || []).forEach(function (p) {
      if (!p || !zahl(p[buchFeld])) return;
      var st = zahl(p[startFeld]) && p[startFeld] > 0 ? p[startFeld] : (zahl(opts.start) && opts.start > 0 ? opts.start : null);
      if (!st) { ohneStart = true; return; }
      pts.push({ t: p.t, idx: p[buchFeld] / st, spy: p.spy });
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
    return v.grund === 'erst-ein-punkt' ? 'Markt: Vergleich ab dem zweiten Stand' : 'Markt: noch kein Stand';
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
   * traegt. Die Buecher buchen keine Ausschuettung (Stand Auftrag Nr. 81: der Weg ist
   * an echten Zahlen geklaert, gebaut ist er nicht) - der Vergleich ist damit um die
   * Ausschuettungen des Buchs zu streng, und genau das steht da. Im Rueckfall steht der
   * Kursertrag da, mit dem Grund. */
  var HINWEIS_GESAMT = 'S&P 500 als SPY-Gesamtertrag. Markt mit, Buch ohne Ausschüttungen – der Vergleich ist um die Ausschüttungen des Buchs zu streng.';
  var HINWEIS_KURS = 'S&P 500 als SPY-Tageskurs. Buch und Markt ohne Ausschüttungen';
  var GRUND_KURS = {
    'reihe-fehlt': 'die bereinigte SPY-Reihe ist noch nicht geladen',
    'reihe-beginnt-spaeter': 'die bereinigte SPY-Reihe beginnt nach dem ersten Stand',
    'reihe-zu-alt': 'die bereinigte SPY-Reihe ist zu alt'
  };
  /** Der Hinweis zu EINEM Vergleich. Leer, solange es keinen Markt-Zeitraum gibt. */
  function hinweis(v) {
    if (!v || !v.ok) return '';
    if (v.marktArt === 'gesamt') return HINWEIS_GESAMT;
    return HINWEIS_KURS + (GRUND_KURS[v.marktGrund] ? ' (' + GRUND_KURS[v.marktGrund] + ' – deshalb der Kursertrag)' : '') + '.';
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

  var Massstab = {
    prozent: prozent, vergleich: vergleich, mitMarkt: mitMarkt, marktAn: marktAn,
    kopfText: kopfText, langText: langText, datum: datum,
    hinweis: hinweis, hinweise: hinweise, marktName: marktName, marktZusatz: marktZusatz,
    MARKT_MAX_ALTER: MARKT_MAX_ALTER
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Massstab; return; }
  root.Massstab = Massstab;
})(typeof window !== 'undefined' ? window : globalThis);
