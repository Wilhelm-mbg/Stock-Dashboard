'use strict';
/* ================= Markt-Ueberblick: die Rechnung, ohne Fenster =================
 *
 * Wozu es diese Datei gibt (Oberflaeche Stufe 5, 04.09.2026): Der Reiter "Markt"
 * zeigt Sektor-Balken, fuenf Hotlists, ein relatives Volumen und einen Sitzungs-
 * zustand. Jede dieser Zahlen ist eine RECHNUNG - und eine Rechnung, die nur im
 * Renderer steht, laesst sich nicht pruefen: die Oberflaechendateien sind in Node
 * nicht ladbar und werden von test-v6 nur als Text abgetastet. Genau daran ist im
 * Projekt schon einmal eine Zahl unbemerkt falsch geworden.
 *
 * Deshalb: hier steht die Rechnung, in marktui.js steht die Anzeige. Diese Datei
 *   - hat kein window, kein document, kein Netz, keinen Speicher,
 *   - schreibt nichts und loest nichts aus,
 *   - enthaelt keinen Handelscode: nichts hier waehlt einen Wert aus, den jemand
 *     kaufen soll. Es ist eine UEBERSICHT. An keiner Zahl in dieser Datei ist etwas
 *     gemessen, und keine geht in eine Strategie ein.
 *
 * UNBEKANNT IST UNBEKANNT. Jede Funktion gibt null zurueck, wenn ihre Eingangsdaten
 * nicht reichen - nie 0, nie 1, nie einen Platzhalter. Ein relatives Volumen von
 * "1,0" waere von "wir wissen es nicht" nicht zu unterscheiden, und genau diese
 * Verwechslung ist im Projekt als Fehlerform verzeichnet.
 *
 * Alles Simulation, keine Anlageberatung.
 */
(function (root) {

  /* Median wie in liquide.js: sortiert[n >> 1]. Bewusst dieselbe Wahl wie dort -
   * zwei Median-Begriffe im selben Programm waeren zwei Wahrheiten ueber dasselbe
   * Wort. Ohne Werte NaN, nicht 0. */
  function median(a) {
    var s = (a || []).slice().sort(function (x, y) { return x - y; });
    return s.length ? s[s.length >> 1] : NaN;
  }

  function zahl(v) { return typeof v === 'number' && isFinite(v); }

  /* ---------------------------------------------------------------------------
   * 1) Der Zustand der Sitzung
   *
   * Vier Zustaende, und sie sind NICHT dasselbe wie "Boerse offen/zu": wer
   * vorboerslich einen Kurs sieht, muss wissen, dass er aus duennem Handel stammt.
   * Die Grenzen sind dieselben wie in renderer.js boersenPhase(): 330 Minuten vor
   * der Eroeffnung (4:00 ET) und 240 Minuten nach dem Schluss (bis 20:00 ET).
   *
   * minuten = Minuten seit der Eroeffnung, negativ davor (Quant.minutenSeitOeffnung)
   * laenge  = Laenge der Sitzung in Minuten, 0 an Feiertagen (Boerse.sitzungsMinuten)
   *
   * Der Feiertag ist der Grund, warum die Laenge ein ARGUMENT ist und keine feste
   * 390: an Halbtagen endet die Sitzung frueher, und ohne diese Zahl stuende hier
   * drei Stunden lang "regulaerer Handel" ueber einem Markt, der zu ist. */
  var VOR_MIN = 330;
  var NACH_MIN = 240;
  /* DREI ORTE, EIN ZUSTAND (QS-Fund F2, 04.09.2026). Die Kopfzeile (#stamp), das
   * Cockpit (#ckMarkt) und der Reiter Markt (#marktSitzung) sagten dasselbe mit
   * zwei verschiedenen Begriffen: die ersten beiden ueber usMarketOpen() (offen/zu),
   * der dritte ueber diese Funktion (vier Zustaende). Auf einem Bildschirm stand
   * dann "US-Börse geschlossen" zwei Zeilen ueber "Vorbörslicher Handel". Beide
   * waren fuer sich richtig; der Leser sah einen Widerspruch.
   *
   * Seither liefert diese Funktion die Worte, und alle drei setzen sie ein:
   *   kurz     der Zustand in einem Halbsatz - das ist der WORTGLEICHE Teil
   *   hinweis  was man ueber ihn wissen muss (duenner Umsatz, kein Handelstag)
   *   text     beides zusammen, wie es der Reiter Markt seit Stufe 5 zeigt
   * usMarketOpen() bleibt unangetastet: daran haengen Glattstellung und
   * Einstiegssperre, und das ist HANDELSLOGIK, keine Anzeige. */
  function zustandBauen(zustand, kurz, hinweis) {
    return { zustand: zustand, kurz: kurz, hinweis: hinweis,
             text: kurz + (hinweis ? ' – ' + hinweis : '') };
  }
  var DUENN = 'dünner Umsatz, Kurse können springen';
  function sitzungszustand(minuten, laenge) {
    if (!zahl(minuten)) return null;
    if (!zahl(laenge) || laenge <= 0) {
      return zustandBauen('geschlossen', 'Börse geschlossen', 'kein Handelstag');
    }
    if (minuten >= 0 && minuten < laenge) {
      return zustandBauen('regulaer', 'Regulärer Handel', '');
    }
    if (minuten < 0 && minuten >= -VOR_MIN) {
      return zustandBauen('vorboerslich', 'Vorbörslicher Handel', DUENN);
    }
    if (minuten >= laenge && minuten < laenge + NACH_MIN) {
      return zustandBauen('nachboerslich', 'Nachbörslicher Handel', DUENN);
    }
    return zustandBauen('geschlossen', 'Börse geschlossen', '');
  }

  /* ---------------------------------------------------------------------------
   * 2) Relatives Volumen
   *
   * Heutiges Volumen geteilt durch den Median der letzten Handelstage. Der Median
   * und NICHT der Mittelwert: ein einziger Verfallstag oder eine Indexaufnahme hebt
   * ein Mittel ueber Wochen an, und die Liste zeigte danach lauter Werte "unter
   * normal".
   *
   * Yahoos averageVolume wird bewusst NICHT benutzt: die Zahl ist ein Mittel ueber
   * drei Monate, ihr Fenster ist nicht dokumentiert, und sie kommt aus derselben
   * Antwort wie das heutige Volumen - ein Quotient aus zwei Zahlen derselben Quelle
   * mit unbekanntem Bezug ist keine Messung. Der Median kommt deshalb aus dem
   * eigenen Tagesarchiv, dessen Kerzen das Projekt selbst gesammelt hat.
   *
   * tagesVolumen: die Volumina der ZURUECKLIEGENDEN Tage, juengster zuletzt, OHNE
   * den heutigen. Steht der laufende Tag mit im Nenner, vergleicht sich der Wert
   * teilweise mit sich selbst - der Effekt waere in der behaupteten Richtung
   * verzerrt (wiki/fehlerformen.md, geteilter Kurs).
   *
   * Unter `minTage` Tagen: null. Ein Median aus fuenf Tagen ist keiner. */
  function relativesVolumen(heute, tagesVolumen, opt) {
    opt = opt || {};
    var fenster = opt.fenster > 0 ? opt.fenster : 50;
    var minTage = opt.minTage > 0 ? opt.minTage : 20;
    if (!zahl(heute) || heute <= 0) return null;
    var reihe = (tagesVolumen || []).filter(function (v) { return zahl(v) && v > 0; });
    if (reihe.length < minTage) return null;
    var genutzt = reihe.slice(-fenster);
    var med = median(genutzt);
    if (!(med > 0)) return null;
    return { faktor: heute / med, median: med, tage: genutzt.length };
  }

  /* ---------------------------------------------------------------------------
   * 3) Tagesvolumen und Tagesveraenderung aus einer Tagesreihe
   *
   * reihe: [[zeitMs, schluss, umsatz], ...], aelteste zuerst - das Format des
   * Tagesarchivs (archiv1d), auf die ersten drei Felder gekuerzt.
   *
   * `tage` ist eine Zahl von HANDELSTAGEN, nicht von Kalendertagen: eine Woche sind
   * fuenf Balken, ein Monat 21. Wer hier Kalendertage naehme, bekaeme ueber
   * Feiertage still ein anderes Fenster. */
  function volumenReihe(reihe) {
    return (reihe || []).map(function (b) { return b && b.length >= 3 ? b[2] : null; })
      .filter(function (v) { return zahl(v) && v > 0; });
  }

  function spanne(reihe, tage) {
    if (!reihe || !(tage > 0) || reihe.length < tage + 1) return null;
    var frueh = reihe[reihe.length - 1 - tage], spaet = reihe[reihe.length - 1];
    if (!frueh || !spaet || !(frueh[1] > 0) || !(spaet[1] > 0)) return null;
    return (spaet[1] / frueh[1] - 1) * 100;
  }

  /* ---------------------------------------------------------------------------
   * 4) Die Sektor-Leiste
   *
   * KAPITALGEWICHTET, nicht als Mittel ueber die Werte. Der Unterschied ist keine
   * Feinheit: "Technologie" enthaelt Apple und dreihundert Kleinere. Ein
   * ungewichtetes Mittel behauptete, der Sektor sei gefallen, waehrend das darin
   * angelegte Geld gestiegen ist. Die Gewichtung ist die Marktkapitalisierung -
   * dieselbe Groesse, aus der die Marktkarte ihre Flaechen rechnet (Kurs x Stueck).
   *
   * werte: [{ sektor, kap, pct }] - pct in Prozent, kap in Dollar.
   * Ein Wert ohne pct oder ohne Groesse zaehlt gar nicht mit; er wird NICHT als
   * "0 %" mitgemittelt. Und ein Sektor unter `minWerte` Werten faellt heraus: ein
   * Balken aus zwei Firmen ist kein Sektor, sondern zwei Firmen. */
  function sektorLeiste(werte, opt) {
    opt = opt || {};
    var minWerte = opt.minWerte > 0 ? opt.minWerte : 3;
    var je = {};
    (werte || []).forEach(function (w) {
      if (!w || typeof w.sektor !== 'string' || !w.sektor) return;
      if (!zahl(w.pct) || !zahl(w.kap) || w.kap <= 0) return;
      var e = je[w.sektor] || (je[w.sektor] = { sektor: w.sektor, kap: 0, summe: 0, n: 0 });
      e.kap += w.kap;
      e.summe += w.kap * w.pct;
      e.n++;
    });
    return Object.keys(je).map(function (s) {
      var e = je[s];
      return { sektor: e.sektor, pct: e.summe / e.kap, n: e.n, kap: e.kap };
    }).filter(function (e) {
      return e.n >= minWerte;
    }).sort(function (a, b) {
      /* Nach Veraenderung, absteigend. Bei Gleichstand nach Namen - sonst tanzen
       * zwei gleich bewegte Sektoren bei jedem Aufbau umeinander herum. */
      if (b.pct !== a.pct) return b.pct - a.pct;
      return a.sektor < b.sektor ? -1 : (a.sektor > b.sektor ? 1 : 0);
    });
  }

  /* ---------------------------------------------------------------------------
   * 5) Die Hotlists
   *
   * Fuenf Listen aus derselben Menge. Sie sind ANZEIGE und kein Signal: die grosse
   * Signalstudie vom 23.08.2026 hat in 3.372 Tests keinen bestaetigten Vorteil der
   * Ausbruchsfamilie gefunden, und "heute stark gestiegen" ist genau das. Wer daraus
   * handeln will, misst es vorher.
   *
   * werte: [{ sym, name, kurs, pct, volumen, hoch52, relVol }]
   * Jede Liste filtert auf das, was SIE braucht, und laesst den Rest weg - eine
   * Zeile ohne die Zahl, um die es in der Spalte geht, ist keine Zeile.
   *
   * "meist gehandelt" ist der DOLLAR-Umsatz (Kurs x Stueck) und nicht die Stueckzahl:
   * nach Stueck stuenden dort dauerhaft die Pennystocks, und die Liste haette jeden
   * Tag denselben Inhalt. */
  function kopie(w, feld, wert) {
    var k = {};
    for (var f in w) if (Object.prototype.hasOwnProperty.call(w, f)) k[f] = w[f];
    k[feld] = wert;
    return k;
  }
  function hotlists(werte, opt) {
    opt = opt || {};
    var zeilen = opt.zeilen > 0 ? opt.zeilen : 6;
    /* Wie nah an das 52-Wochen-Hoch ein Wert heran sein muss, um als "Hoch" zu
     * gelten. Yahoos hoch52 schliesst den laufenden Tag ein; ein Wert, der heute
     * ein neues Hoch macht, steht deshalb bei genau 1,0. Der Spielraum nach unten
     * ist eine SETZUNG und keine Messung - er steht als Zahl in der Fusszeile. */
    var naheAm = opt.naheAm > 0 ? opt.naheAm : 0.995;
    var alle = (werte || []).filter(function (w) { return w && typeof w.sym === 'string' && w.sym; });

    function nimm(liste, sortierer) {
      return liste.slice().sort(sortierer).slice(0, zeilen);
    }
    var mitPct = alle.filter(function (w) { return zahl(w.pct); });
    var mitUmsatz = alle.filter(function (w) {
      return zahl(w.kurs) && w.kurs > 0 && zahl(w.volumen) && w.volumen > 0;
    }).map(function (w) { return kopie(w, 'umsatz', w.kurs * w.volumen); });
    var mitRel = alle.filter(function (w) { return zahl(w.relVol) && w.relVol > 0; });
    var amHoch = alle.filter(function (w) {
      return zahl(w.kurs) && w.kurs > 0 && zahl(w.hoch52) && w.hoch52 > 0 && w.kurs / w.hoch52 >= naheAm;
    }).map(function (w) { return kopie(w, 'naehe', w.kurs / w.hoch52); });

    return {
      gewinner: nimm(mitPct, function (a, b) { return b.pct - a.pct; }),
      verlierer: nimm(mitPct, function (a, b) { return a.pct - b.pct; }),
      umsatz: nimm(mitUmsatz, function (a, b) { return b.umsatz - a.umsatz; }),
      volumen: nimm(mitRel, function (a, b) { return b.relVol - a.relVol; }),
      hoch52: nimm(amHoch, function (a, b) { return b.naehe - a.naehe; }),
      grundgesamtheit: alle.length,
      naheAm: naheAm
    };
  }

  /* ---------------------------------------------------------------------------
   * 6) Der Schwanz einer Archivdatei
   *
   * Warum nicht die ganze Datei: bars_1d_AAPL.json traegt 10.081 Kerzen auf 1 MB.
   * Fuer den Volumen-Median braucht die Uebersicht die letzten fuenfzig. Sechshundert
   * Werte vollstaendig zu lesen kostete am 04.09.2026 gemessen rund zehn Sekunden im
   * Hauptprozess - das ist eine eingefrorene Oberflaeche, kein Ladevorgang. Aus den
   * letzten 96 KB dieselben Zahlen zu ziehen kostete 127 ms fuer 120 Dateien.
   *
   * Gelesen wird der SCHLUSS des Textes, also ein moeglicherweise mitten in einer
   * Kerze abgeschnittenes Stueck. Deshalb nimmt das Muster nur VOLLSTAENDIGE Tripel
   * (Zeit, Schluss, Umsatz) und der Aufrufer bekommt nur, was danach uebrigbleibt.
   * Die Zeitstempel muessen aufsteigen; tun sie das nicht, ist der Ausschnitt nicht
   * das, wofuer man ihn haelt, und die Funktion gibt eine leere Reihe zurueck statt
   * einer falschen.
   *
   * Die Gegenprobe dazu steht in test-v6: dieselbe Datei einmal ganz geparst, einmal
   * ueber den Schwanz gelesen - die letzten Kerzen muessen dieselben sein. Ohne diese
   * Probe waere das hier geraten. */
  var KERZE = /\[(\d{12,13}),(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?),(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?|null)/g;
  function tagesreiheAusText(text, n) {
    var t = String(text == null ? '' : text);
    var aus = [], m;
    KERZE.lastIndex = 0;
    while ((m = KERZE.exec(t))) {
      var zeit = Number(m[1]), schluss = Number(m[2]);
      var umsatz = m[3] === 'null' ? null : Number(m[3]);
      if (!isFinite(zeit) || !isFinite(schluss)) continue;
      aus.push([zeit, schluss, umsatz]);
    }
    for (var i = 1; i < aus.length; i++) {
      if (aus[i][0] <= aus[i - 1][0]) return [];   // kein geordneter Ausschnitt
    }
    return n > 0 ? aus.slice(-n) : aus;
  }

  var Uebersicht = {
    VOR_MIN: VOR_MIN, NACH_MIN: NACH_MIN,
    median: median,
    sitzungszustand: sitzungszustand,
    relativesVolumen: relativesVolumen,
    volumenReihe: volumenReihe,
    spanne: spanne,
    sektorLeiste: sektorLeiste,
    hotlists: hotlists,
    tagesreiheAusText: tagesreiheAusText
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Uebersicht; return; }
  root.MarktUebersicht = Uebersicht;
})(typeof window !== 'undefined' ? window : globalThis);
