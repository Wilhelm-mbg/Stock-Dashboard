'use strict';
/* ================= Ergebnis-Drift (Post-Earnings Drift) =================
 *
 * Was sie tut: Nach einer Quartalsmeldung läuft der Kurs noch Wochen in Richtung der
 * Überraschung weiter. Wer deutlich besser abgeliefert hat als erwartet, steigt weiter;
 * wer deutlich schlechter war, fällt weiter. Gekauft wird das oberste Fünftel der
 * Überraschungen, verkauft das unterste — beide gleich groß, aus demselben Topf.
 *
 * Warum das etwas anderes ist als der Intraday-Teil und als das Momentum:
 * Es ist kein Chartsignal. Die Information kommt aus den Zahlen selbst, nicht aus dem
 * Kursverlauf. Gegenüber dem Momentum, das auf demselben Zeithorizont läuft, bleibt
 * messbar etwas übrig: Korrelation der Monatserträge nur 0,41, und in der Regression
 * auf das Momentum ein Achsenabschnitt von +6,90 % p. a. (t = 2,20).
 *
 * GEMESSEN am 21.08.2026 auf 20.356 Ergebnisterminen aus 197 Werten, 1993–2026:
 *   marktneutral, 60 Handelstage Haltedauer, Rang nur gegen die letzten 120 Handelstage
 *     ab 2015:   +10,44 % p. a.   t = 3,04   67 % positive Monate
 *     ab 2020:   +11,20 % p. a.   t = 1,94   64 % positive Monate
 *     positiv in allen sieben Teilzeiträumen 1994–2026
 *   Gegenprobe mit zufälliger Zuordnung: −1,74 % p. a., t = −0,88 — der Aufbau selbst
 *     erzeugt nichts.
 *   Nach 20 Basispunkten Kosten je Seite: +8,76 % p. a.
 *
 * EHRLICHE GRENZEN, die man kennen muss:
 *  - Überlebensverzerrung ist nur teilweise ausgeräumt. In der über zehn Jahre schwachen
 *    Hälfte der Werte bleiben nur +1,72 % (t = 0,58), in der starken +8,61 % (t = 2,50).
 *    Ein guter Teil des Effekts sitzt weiterhin in den Gewinnern von heute.
 *  - Nur 60 Handelstage funktionieren. Auf 20 Tagen ist der Effekt seit 2015 tot
 *    (t = 0,77). Wer früher aussteigt, hat nichts.
 *  - Es braucht BEIDE Beine. Long allein ist überwiegend Marktbeta.
 *  - NICHT mit Hebelscheinen handelbar. Am 21.08.2026 durchgerechnet: Der Basiswert
 *    müsste 5,5 bis 11 % laufen, damit ein Schein nach Zeitwertverfall und Spanne bei
 *    null herauskommt. Der Drift liefert rund 1,3 % je Position — Faktor 4 bis 8 zu
 *    wenig. Deshalb rechnet dieses Modul ausschließlich im Basiswert.
 *  - Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {
  var STANDARD = {
    fenster: 120,      // Handelstage, gegen die eine Überraschung eingeordnet wird
    anteil: 0.20,      // oberstes/unterstes Fünftel
    halten: 60,        // Handelstage Haltedauer
    minVergleich: 40,  // so viele frühere Termine müssen im Fenster liegen
    kostenBp: 10       // Basispunkte je Seite
  };

  /** Reaktionstag zu einem Termin: der erste Handelstag, dessen SCHLUSS nach der
   *  Meldung liegt. Meldungen nach Börsenschluss (ab 20:00 UTC = 16:00 New Yorker Zeit)
   *  wirken sich erst am Folgetag aus — wer das übersieht, handelt den Sprung mit,
   *  an den man nie herangekommen wäre. */
  function reaktionstag(termin, datumIndex) {
    var ms = typeof termin === 'number' ? termin : Date.parse(termin);
    if (!ms) return null;
    var d = new Date(ms).toISOString().slice(0, 10);
    var r = datumIndex[d];
    if (r == null) {
      for (var k = 1; k <= 6 && r == null; k++) {
        r = datumIndex[new Date(Date.parse(d) + k * 86400000).toISOString().slice(0, 10)];
      }
    }
    if (r == null) return null;
    if (new Date(ms).getUTCHours() >= 20) r += 1;
    return r;
  }

  /** Datum → Index für eine Kursreihe [[t, kurs, …], …] */
  function datumIndex(reihe) {
    var m = {};
    for (var i = 0; i < reihe.length; i++) m[new Date(reihe[i][0]).toISOString().slice(0, 10)] = i;
    return m;
  }

  /**
   * Ereignisse aufbereiten und auf die gemeinsame Zeitachse des Marktes legen.
   * kursMap:    {SYM: [[t, kurs], …]}, markt: dieselbe Form (SPY o. ä.)
   * termineMap: {SYM: [[Zeit, Schätzung, Ist, Überraschung%], …]}
   */
  function ereignisse(kursMap, termineMap, markt, opts) {
    var O = Object.assign({}, STANDARD, opts || {});
    var mIdx = datumIndex(markt), idx = {}, raus = [];
    Object.keys(kursMap).forEach(function (sy) { idx[sy] = datumIndex(kursMap[sy]); });
    Object.keys(termineMap).forEach(function (sy) {
      var b = kursMap[sy];
      if (!b || b.length < 100) return;
      (termineMap[sy] || []).forEach(function (t) {
        if (!t || t[3] == null) return;
        var r = reaktionstag(t[0], idx[sy]);
        /* Meldung NACH Schluss am letzten Kurstag: der Reaktionstag liegt noch in der
         * Zukunft (r == b.length). Vorher griff b[r] ins Leere und der ganze Takt des
         * Buchs brach ab - genau an dem Morgen, an dem ein Universumswert abends
         * berichtet hatte (Audit 22.08.2026). Das Ereignis wird am naechsten Tag gewertet. */
        if (r == null || r < 1 || r >= b.length) return;
        var md = new Date(b[r][0]).toISOString().slice(0, 10);
        var mr = mIdx[md];
        if (mr == null) return;
        /* Für den Rückblick muss die volle Haltedauer in den Daten liegen — sonst
           misst man abgeschnittene Trades. Für die Frage "was ist HEUTE offen?" ist
           genau das falsch: Dort sind die jüngsten Ereignisse die interessanten, und
           die haben ihre 60 Tage naturgemäß noch vor sich. */
        if (O.zukunftNoetig !== false &&
            (r + O.halten + 1 >= b.length || mr + O.halten + 1 >= markt.length)) return;
        raus.push({ sym: sy, i: r, mi: mr, ueb: t[3], t: b[r][0] });
      });
    });
    raus.sort(function (a, b2) { return a.mi - b2.mi; });
    return raus;
  }

  /**
   * Richtung je Ereignis — OHNE Blick in die Zukunft.
   * Jede Überraschung wird gegen die der letzten `fenster` Handelstage eingeordnet.
   * Ein früherer Anlauf sortierte ganze Kalenderquartale gemeinsam; damit wurde ein
   * Termin vom 5. Januar gegen einen vom 20. März gerankt, den es noch nicht gab. Das
   * kostete 1,6 Prozentpunkte Scheinertrag.
   */
  function zuordnen(evs, opts) {
    var O = Object.assign({}, STANDARD, opts || {});
    var raus = [], von = 0;
    for (var k = 0; k < evs.length; k++) {
      var e = evs[k];
      while (von < k && evs[von].mi < e.mi - O.fenster) von++;
      if (k - von < O.minVergleich) continue;
      var kleiner = 0, n = 0;
      for (var j = von; j < k; j++) { n++; if (evs[j].ueb < e.ueb) kleiner++; }
      var p = n ? kleiner / n : 0.5;
      if (p >= 1 - O.anteil) raus.push({ e: e, richtung: 1, rang: Math.round(p * 100) });
      else if (p <= O.anteil) raus.push({ e: e, richtung: -1, rang: Math.round(p * 100) });
    }
    return raus;
  }

  /**
   * Depotsimulation. Beide Beine werden GETRENNT gemittelt und dann voneinander
   * abgezogen — so ist das Ergebnis exakt marktneutral, auch wenn zufällig mehr
   * Positionen auf einer Seite offen sind. Ohne diese Trennung schleicht sich die
   * Eigendrift des Überlebenden-Universums als Scheinertrag ein.
   *
   * Rückgabe: {monate, jeMonat, proJahr, positiveMonate, tWert, positionen, offenSchnitt}
   */
  function durchlauf(kursMap, termineMap, markt, opts) {
    var O = Object.assign({}, STANDARD, opts || {});
    var pos = zuordnen(ereignisse(kursMap, termineMap, markt, O), O);
    if (pos.length < 20) return null;
    var start = {}, offen = [], monat = {}, offenSumme = 0, offenTage = 0;
    pos.forEach(function (p) { (start[p.e.mi] = start[p.e.mi] || []).push(p); });
    var kosten = (O.kostenBp || 0) / 10000;
    for (var s = 0; s < markt.length - 1; s++) {
      (start[s] || []).forEach(function (p) {
        offen.push({ p: p, bis: s + O.halten, versatz: p.e.i - p.e.mi, neu: true });
      });
      for (var k = offen.length - 1; k >= 0; k--) if (offen[k].bis <= s) offen.splice(k, 1);
      if (!offen.length) continue;
      var sl = 0, nl = 0, ss = 0, ns = 0, reibungL = 0, reibungS = 0;
      for (var q = 0; q < offen.length; q++) {
        var o = offen[q], b = kursMap[o.p.e.sym], j = s + o.versatz;
        if (!b || j < 0 || j + 1 >= b.length) continue;
        var r = b[j + 1][1] / b[j][1] - 1;
        if (o.p.richtung > 0) { sl += r; nl++; } else { ss += r; ns++; }
        /* Kosten GETRENNT je Bein sammeln, nicht in r hineinrechnen. Ein früherer
           Anlauf zog sie direkt von r ab — auf der Short-Seite wurde daraus durch das
           Minuszeichen ein Gewinn, und die Kosten hoben sich zwischen den Beinen exakt
           auf. Der Test war eindeutig: 10 Basispunkte änderten das Ergebnis um +0,01
           Prozentpunkte statt es zu senken. */
        if (o.neu) { if (o.p.richtung > 0) reibungL += kosten; else reibungS += kosten; o.neu = false; }
        if (o.bis === s + 1) { if (o.p.richtung > 0) reibungL += kosten; else reibungS += kosten; }
      }
      if (!nl || !ns) continue;
      offenSumme += nl + ns; offenTage++;
      var mk = new Date(markt[s + 1][0]).toISOString().slice(0, 7);
      /* Spanne zwischen den Beinen, jedes in seiner Handelsrichtung und nach Reibung.
         Das entspricht einem Buch mit je 100 % auf beiden Seiten. Wer nur die Hälfte
         Kapital je Seite einsetzt, halbiert Ertrag und Schwankung gleichermaßen. */
      var beinL = sl / nl - reibungL / nl;
      var beinS = -ss / ns - reibungS / ns;
      monat[mk] = (monat[mk] || 0) + (beinL + beinS) * 100;
    }
    var keys = Object.keys(monat).sort();
    var werte = keys.map(function (k2) { return monat[k2]; });
    if (werte.length < 6) return null;
    var mittel = werte.reduce(function (a, b2) { return a + b2; }, 0) / werte.length;
    var varianz = werte.reduce(function (a, b2) { return a + (b2 - mittel) * (b2 - mittel); }, 0) / Math.max(1, werte.length - 1);
    return {
      monate: keys,
      verlauf: werte,
      jeMonat: Math.round(mittel * 1000) / 1000,
      proJahr: Math.round(mittel * 12 * 100) / 100,
      positiveMonate: Math.round(100 * werte.filter(function (v) { return v > 0; }).length / werte.length),
      tWert: Math.round(mittel / Math.sqrt(varianz / werte.length) * 100) / 100,
      positionen: pos.length,
      offenSchnitt: offenTage ? Math.round(offenSumme / offenTage) : 0
    };
  }

  /**
   * Den jüngsten Termin aus zwei Yahoo-Antworten zusammensetzen.
   *
   * Der tiefe Kalender-Endpunkt ist nicht frisch: Am 21.08.2026 endete er bei Terminen
   * aus dem Juni 2025, während die Kurse bis August 2026 liefen. Die aktuellen Zahlen
   * stehen in zwei Bruchstücken — `earningsHistory` kennt Ist-Wert und Überraschung der
   * letzten vier Quartale (aber nur das Quartals-ENDE), `calendarEvents` nennt mit
   * `earningsCallDate` den letzten tatsächlichen Meldetermin.
   *
   * Gepaart wird nur das NEUESTE Quartal, und nur wenn der Termin danach liegt und
   * höchstens `maxAbstand` Tage später. Ein um Wochen falsch datierter Reaktionstag
   * macht aus dem Drift Rauschen — dann lieber gar kein Ereignis melden.
   *
   * historie: [{quartalsEndeMs, ueberraschung, ist, schaetzung}, …]
   * terminMs: Zeitstempel des Meldetermins (0/null, wenn unbekannt)
   */
  function paareAktuell(historie, terminMs, maxAbstand, nowMs) {
    maxAbstand = maxAbstand || 120;
    if (!historie || !historie.length || !terminMs) return null;
    /* Ein Termin in der ZUKUNFT hat noch keine Zahlen. Vorher wurde die Ueberraschung des
     * Vorquartals an den naechsten Meldetermin gehaengt: Juli-Signale fehlten, und im
     * Oktober haette ein falsches Signal mit drei Monate alten Zahlen gefeuert (Audit 22.08.). */
    if (terminMs > (nowMs || Date.now())) return null;
    var neu = null;
    for (var i = 0; i < historie.length; i++) {
      var q = historie[i];
      if (!q || !q.quartalsEndeMs) continue;
      if (!neu || q.quartalsEndeMs > neu.quartalsEndeMs) neu = q;
    }
    if (!neu || neu.ueberraschung == null) return null;
    var abstand = (terminMs - neu.quartalsEndeMs) / 86400000;
    if (!(abstand > 0 && abstand <= maxAbstand)) return null;
    return {
      termin: new Date(terminMs).toISOString(),
      terminMs: terminMs,
      quartalsende: new Date(neu.quartalsEndeMs).toISOString().slice(0, 10),
      abstandTage: Math.round(abstand),
      ist: neu.ist, schaetzung: neu.schaetzung,
      ueberraschung: Math.round(neu.ueberraschung * 100) / 100
    };
  }

  /**
   * Was wäre HEUTE zu tun? Liefert die Positionen, die aktuell offen sein müssten,
   * plus die, die gerade fällig werden. Ohne diese Liste bleibt die Strategie eine
   * Messung und wird nie eine Handlung.
   */
  function heute(kursMap, termineMap, markt, opts) {
    // zukunftNoetig: false — hier zählen gerade die jüngsten Termine, deren Haltedauer
    // noch läuft. Mit der Rückblick-Regel wären genau sie herausgefallen.
    var O = Object.assign({}, STANDARD, opts || {}, { zukunftNoetig: false });
    var pos = zuordnen(ereignisse(kursMap, termineMap, markt, O), O);
    var letzter = markt.length - 1;
    var soll = [], faellig = [];
    pos.forEach(function (p) {
      var alter = letzter - p.e.mi;
      if (alter < 0) return;
      if (alter < O.halten) {
        var b = kursMap[p.e.sym], j = p.e.i;
        var jetzt = j + alter < b.length ? b[j + alter][1] : null;
        soll.push({
          sym: p.e.sym, richtung: p.richtung > 0 ? 'kaufen' : 'verkaufen',
          ueberraschung: p.e.ueb, rang: p.rang, seitTagen: alter,
          nochTage: O.halten - alter, einstieg: b[j][1],
          jetzt: jetzt,
          standPct: jetzt != null ? Math.round(p.richtung * (jetzt / b[j][1] - 1) * 10000) / 100 : null
        });
      } else if (alter === O.halten) {
        faellig.push({ sym: p.e.sym, richtung: p.richtung > 0 ? 'verkaufen' : 'zurückkaufen' });
      }
    });
    soll.sort(function (a, b2) { return a.nochTage - b2.nochTage; });
    return { offen: soll, faellig: faellig, halten: O.halten };
  }

  var Drift = { STANDARD: STANDARD, reaktionstag: reaktionstag, datumIndex: datumIndex,
    ereignisse: ereignisse, zuordnen: zuordnen, durchlauf: durchlauf, heute: heute,
    paareAktuell: paareAktuell };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Drift; return; }
  root.Drift = Drift;
})(typeof window !== 'undefined' ? window : globalThis);
