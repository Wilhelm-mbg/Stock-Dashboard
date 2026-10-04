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
 * Vergangenheit um. Zwei Punkte aus verschiedenen Tagen ergeben deshalb den
 * KURSERTRAG des SPY, ohne Ausschuettungen. Die Buecher sind genauso gebaut: sie
 * bewerten zum juengsten Kurs und buchen nie eine Ausschuettung. Beide Seiten stehen
 * also gleich da - und beide ohne Ausschuettungen. Das sagt HINWEIS, wortgleich an
 * jeder Stelle.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {

  var TAG = 24 * 3600000;
  var HINWEIS = 'S&P 500 als SPY-Tageskurs. Buch und Markt ohne Ausschüttungen.';

  function zahl(x) { return typeof x === 'number' && isFinite(x); }

  /** Der EINE Rechenweg fuer einen Prozentstand. null, wenn er sich nicht rechnen
   *  laesst - nie eine Null an der Stelle einer fehlenden Zahl. */
  function prozent(wert, basis) {
    if (!zahl(wert) || !zahl(basis) || !(basis > 0)) return null;
    return (wert / basis - 1) * 100;
  }

  function leer(grund) {
    return { ok: false, grund: grund, standPct: null, standT: null, buchPct: null, marktPct: null,
      abstandPp: null, seit: null, bis: null, abStart: false, anker: null, buchReihe: [], marktReihe: [] };
  }

  /** Buch gegen Markt ueber DENSELBEN Zeitraum.
   *
   *  verlauf   [{ t, <buchFeld>, <startFeld>, spy }], aufsteigend nach t
   *  opts.an        false -> Grund 'aus' (ein stehendes Buch wird nicht verglichen)
   *  opts.start     Startkapital des Buchs, falls der Punkt keines traegt - nie eine
   *                 feste Zahl aus dem Code
   *  opts.angelegt  Zeitpunkt, an dem das Buch angelegt wurde
   *
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
      pts.push({ t: p.t, idx: p[buchFeld] / st, spy: zahl(p.spy) && p.spy > 0 ? p.spy : null });
    });
    if (!pts.length) return leer(ohneStart ? 'kein-startkapital' : 'kein-stand');
    var z = pts[pts.length - 1];
    var r = leer(null);
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
    var m = marktReihe || [], j = -1;
    return (reihe || []).map(function (p) {
      while (j + 1 < m.length && m[j + 1][0] <= p[0]) j++;
      var o = { t: p[0], spy: j >= 0 ? m[j][1] : null };
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

  var Massstab = {
    HINWEIS: HINWEIS, prozent: prozent, vergleich: vergleich, mitMarkt: mitMarkt,
    kopfText: kopfText, langText: langText, datum: datum
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Massstab; return; }
  root.Massstab = Massstab;
})(typeof window !== 'undefined' ? window : globalThis);
