'use strict';
/* ================= Kerzenchart: die Rechnung, ohne Fenster =================
 *
 * Wozu es diese Datei gibt (Oberflaeche Stufe 6, 04.09.2026): Der Aktien-Viewer
 * zeichnet Kerzen mit Docht, Umsatzbalken, Fadenkreuz und drei gleitenden
 * Durchschnitten - und er setzt dabei zwei Quellen aneinander (eigenes Archiv,
 * Yahoo live). Jede dieser Zahlen ist eine RECHNUNG, und eine Rechnung, die nur im
 * Renderer steht, laesst sich nicht pruefen: Oberflaechendateien sind in Node nicht
 * ladbar und werden von test-v6 nur als Text abgetastet.
 *
 * Deshalb: hier steht die Rechnung, in explorer.js steht die Bedienung. Diese Datei
 *   - hat kein window, kein document, kein Netz, keinen Speicher,
 *   - schreibt nichts und loest nichts aus,
 *   - zeichnet nur in einen Zeichenkontext, den der AUFRUFER hereingibt: `zeichnen`
 *     bekommt Kerzen und Masse herein und ruft darauf nur Canvas-Verben auf. In Node
 *     laesst sich dafuer eine Attrappe einsetzen, die die Aufrufe zaehlt.
 *   - rechnet KEINE Indikatoren selbst: die gleitenden Durchschnitte kommen aus
 *     window.Quant (sma), das der Aufrufer als Funktion hereingibt. Eine zweite
 *     SMA im Programm waere eine zweite Wahrheit ueber dasselbe Wort.
 *
 * DIE KERZE hat dieselbe Form wie im Archiv: [zeit, schluss, umsatz, hoch, tief,
 * eroeffnung] - sechs Felder, Zeit in ms. Nichts hier legt eine siebte Stelle an.
 *
 * UNBEKANNT IST UNBEKANNT. Reicht die Eingabe nicht, kommt null zurueck - nie 0,
 * nie ein Platzhalter.
 *
 * WAS SIE NICHT IST: kein Signal, keine Auswahl, kein Handelscode. Der Viewer
 * handelt nichts; alles Simulation, keine Anlageberatung.
 */
(function (root) {

  /* Wie lang eine Kerze des Zeitrahmens dauert. 1W steht bewusst NICHT als feste
   * Woche in der Naht-Rechnung: Wochenkerzen liegen auf dem Wochenanfang, und wer
   * sie mit 7*86400000 aneinanderlegt, verschiebt sie ueber die Sommerzeit hinweg.
   * Fuer die Naht zaehlt nur der Stempel, nicht die Dauer. */
  var INTERVALL_MS = {
    '1m': 60000, '5m': 300000, '15m': 900000,
    '1h': 3600000, '1T': 86400000, '1W': 604800000
  };
  /* Welcher Archivordner traegt diesen Zeitrahmen (kerzenquelle.js kennt die Pfade).
   * 1W fuehrt das Archiv NICHT - dort ist der Rueckfall auf Yahoo kein Notbehelf,
   * sondern die einzige Quelle, und die Fusszeile sagt es. */
  var ARCHIV_INTERVALL = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '60m', '1T': '1d', '1W': null };
  /* Wie derselbe Zeitrahmen bei Yahoo heisst. */
  var YAHOO_INTERVALL = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '60m', '1T': '1d', '1W': '1wk' };
  var ZEITRAHMEN = ['1m', '5m', '15m', '1h', '1T', '1W'];

  function zahl(v) { return typeof v === 'number' && isFinite(v); }
  function kerzeOk(k) { return Array.isArray(k) && k.length >= 2 && zahl(k[0]) && zahl(k[1]); }

  /* ---------------------------------------------------------------------------
   * 1) Kerzen aus dem SCHWANZ einer Archivdatei
   *
   * Warum nicht die ganze Datei: alpaca1m/AAPL/2026.json traegt 133.770 Minuten-
   * kerzen auf 6,7 MB. Der Viewer zeigt ein paar hundert. Vollstaendig lesen und
   * zerlegen kostet im Hauptprozess Zeit, in der die Oberflaeche steht - und zwar
   * bei JEDEM Zeitrahmen-Wechsel. Gelesen wird deshalb der Schluss des Textes.
   *
   * Der Ausschnitt beginnt mitten in einer Kerze; das Muster nimmt darum nur
   * VOLLSTAENDIGE Sechsergruppen. Die Stempel muessen aufsteigen - tun sie es
   * nicht, ist der Ausschnitt nicht das, wofuer man ihn haelt, und es kommt eine
   * leere Reihe zurueck statt einer falschen (dieselbe Regel wie in
   * markt/uebersicht.js tagesreiheAusText).
   *
   * Hoch, Tief und Eroeffnung duerfen `null` sein - das Archiv fuellt Luecken
   * nicht auf, und eine Kerze ohne Docht ist eine Kerze ohne Docht, kein Fehler. */
  var KERZE_RE = new RegExp(
    '\\[(\\d{12,13}),' +                       // Zeit
    '(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?),' + // Schluss
    '(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|null),' + // Umsatz
    '(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|null),' + // Hoch
    '(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|null),' + // Tief
    '(-?\\d+(?:\\.\\d+)?(?:[eE][+-]?\\d+)?|null)\\]', 'g');
  function zahlOderNull(s) { return s === 'null' ? null : Number(s); }
  function kerzenAusText(text, n) {
    var t = String(text == null ? '' : text);
    var aus = [], m;
    KERZE_RE.lastIndex = 0;
    while ((m = KERZE_RE.exec(t))) {
      var zeit = Number(m[1]), schluss = Number(m[2]);
      if (!isFinite(zeit) || !isFinite(schluss)) continue;
      aus.push([zeit, schluss, zahlOderNull(m[3]), zahlOderNull(m[4]), zahlOderNull(m[5]), zahlOderNull(m[6])]);
    }
    for (var i = 1; i < aus.length; i++) {
      if (aus[i][0] <= aus[i - 1][0]) return [];   // kein geordneter Ausschnitt
    }
    return n > 0 ? aus.slice(-n) : aus;
  }

  /* Die QUELLENBEREICHE stehen im KOPF derselben Datei (Format 2, meta.quellen) und
   * sagen, woher jede Kerze stammt. Sie werden hier zerlegt und nicht im
   * Hauptprozess: dort ist das Ergebnis nicht pruefbar, hier schon. */
  var QUELLE_RE = /\{"von":(\d{12,13}),"bis":(\d{12,13}),"quelle":"([a-z]+)"/g;
  function quellenAusText(text) {
    var t = String(text == null ? '' : text), aus = [], m;
    QUELLE_RE.lastIndex = 0;
    while ((m = QUELLE_RE.exec(t))) aus.push({ von: Number(m[1]), bis: Number(m[2]), quelle: m[3] });
    return aus;
  }
  /** Welche Quellen decken den gezeigten Ausschnitt ab? Was kein Bereich deckt,
   *  heisst 'unbekannt' - nicht 'yahoo'. Ein Archiv, das seine Herkunft raet, ist
   *  genau der Zustand, aus dem Format 2 herausfuehren soll. */
  function quellenIm(bereiche, vonMs, bisMs) {
    var satz = {}, gedeckt = false;
    (bereiche || []).forEach(function (b) {
      if (b.bis < vonMs || b.von > bisMs) return;
      satz[b.quelle] = 1; gedeckt = true;
    });
    if (!gedeckt) satz.unbekannt = 1;
    return Object.keys(satz);
  }
  /* Die Sitzungsbereiche derselben Datei. Die Vollsammlung schreibt sie hinter die
   * Reihe (`sitzungen: [{von, bis, sitzung}]`, verdichtet), sie stehen also im
   * Schwanz mit drin. Ein angeschnittener erster Bereich faellt durch das Muster;
   * das ist richtig so - er gehoert zu Kerzen, die der Ausschnitt gar nicht hat. */
  var SITZUNG_RE = /\{"von":(\d{12,13}),"bis":(\d{12,13}),"sitzung":"([a-z]+)"\}/g;
  function sitzungenAusText(text) {
    var t = String(text == null ? '' : text), aus = [], m;
    SITZUNG_RE.lastIndex = 0;
    while ((m = SITZUNG_RE.exec(t))) {
      aus.push({ von: Number(m[1]), bis: Number(m[2]), sitzung: m[3] });
    }
    return aus;
  }

  /* ---------------------------------------------------------------------------
   * 2) Welche Sitzung ist das?
   *
   * ZWEI WEGE, und der bessere gewinnt:
   *   (a) Die Alpaca-Dateien tragen ihre Sitzungen MIT - aus dem Kalender der
   *       Quelle, also samt Halbtagen. Liegt ein Bereich vor, gilt er.
   *   (b) Fuer Yahoo-Kerzen gibt es das nicht; dort entscheidet die Uhr. Die
   *       Minuten seit Eroeffnung rechnet der AUFRUFER (window.Quant.
   *       minutenSeitOeffnung) und gibt sie herein - diese Datei baut keine
   *       zweite Zeitzonenrechnung. Die Sitzungslaenge kommt aus boerse.js und ist
   *       an Halbtagen 210 statt 390.
   *
   * Die Grenzen sind DIESELBEN wie in markt/uebersicht.js (330 Minuten vor der
   * Eroeffnung, 240 danach) - zwei Begriffe von "vorboerslich" waeren zwei
   * Wahrheiten ueber denselben Kurs. */
  var VOR_MIN = 330;
  var NACH_MIN = 240;
  function sitzungAusMinuten(minuten, laenge) {
    if (!zahl(minuten)) return null;
    if (!zahl(laenge) || laenge <= 0) return 'ausserhalb';
    if (minuten >= 0 && minuten < laenge) return 'regulaer';
    if (minuten < 0 && minuten >= -VOR_MIN) return 'vor';
    if (minuten >= laenge && minuten < laenge + NACH_MIN) return 'nach';
    return 'ausserhalb';
  }

  /** Sitzung je Kerze. `bereiche` sind die verdichteten Bereiche aus der Datei
   *  (darf leer sein), `ausZeit(tsMs)` der Rueckfall ueber die Uhr. Was weder
   *  Bereich noch Uhr beantworten, heisst 'unbekannt' - nicht 'regulaer'. Eine
   *  Kerze faelschlich regulaer zu nennen, waere eine Behauptung ueber eine
   *  Sitzung, die es vielleicht nicht gab. */
  function sitzungJeKerze(kerzen, bereiche, ausZeit) {
    var b = Array.isArray(bereiche) ? bereiche.slice().sort(function (x, y) { return x.von - y.von; }) : [];
    var zeiger = 0;
    return (kerzen || []).map(function (k) {
      var t = k && k[0];
      while (zeiger < b.length && b[zeiger].bis < t) zeiger++;
      if (zeiger < b.length && t >= b[zeiger].von && t <= b[zeiger].bis) return b[zeiger].sitzung;
      var aus = typeof ausZeit === 'function' ? ausZeit(t) : null;
      return aus || 'unbekannt';
    });
  }

  /** Zusammenhaengende Baender gleicher Sitzung - fuer den grauen Hintergrund.
   *  Zurueck kommen nur die AUSSERBOERSLICHEN Baender: das regulaere Fenster ist
   *  der Normalfall und bekommt keine Farbe, sonst waere das ganze Bild grau. */
  function baender(sitzungJe) {
    var aus = [], j = sitzungJe || [];
    for (var i = 0; i < j.length; i++) {
      var s = j[i];
      if (s !== 'vor' && s !== 'nach') continue;
      var l = aus[aus.length - 1];
      if (l && l.art === s && l.bis === i - 1) { l.bis = i; continue; }
      aus.push({ von: i, bis: i, art: s });
    }
    return aus;
  }
  var BAND_TEXT = { vor: 'vorbörslich', nach: 'nachbörslich' };
  function bandText(art) { return BAND_TEXT[art] || ''; }

  /** Nur die regulaere Sitzung behalten. Gibt Kerzen UND Sitzungen zurueck, weil
   *  beide Reihen zusammengehoeren - wer nur die Kerzen filtert, verschiebt danach
   *  jedes Band um die weggefallenen Stellen. */
  function nurRegulaer(kerzen, sitzungJe) {
    var kk = [], ss = [];
    (kerzen || []).forEach(function (k, i) {
      var s = (sitzungJe || [])[i];
      if (s === 'vor' || s === 'nach') return;
      kk.push(k); ss.push(s);
    });
    return { kerzen: kk, sitzungen: ss };
  }

  /* ---------------------------------------------------------------------------
   * 3) Die Naht zwischen Archiv und Live
   *
   * AN DER NAHT GEWINNT DAS ARCHIV (wiki/archiv-zusammenfuehrung.md Paragraph 6).
   * Der Grund ist nicht Hoeflichkeit: die Live-Antwort traegt die LAUFENDE Kerze
   * mit, das Archiv nur abgeschlossene. Gewaenne das Live, ersetzte eine halbe
   * Kerze eine ganze - und zwar genau die juengste, an der man hinsieht.
   *
   * KEINE KERZE DOPPELT: verglichen wird der Stempel, nicht die Position. Zwei
   * Quellen liefern dieselbe Minute mit unterschiedlichen Nachkommastellen; wer
   * anhaengt statt zu vereinigen, bekommt eine Reihe mit Ruecksprung, und der
   * Zeichner malt daraus eine Zacke, die es nie gab. */
  function zusammenfuehren(archiv, live) {
    var a = (archiv || []).filter(kerzeOk);
    var l = (live || []).filter(kerzeOk);
    var da = {}, aus = [];
    a.forEach(function (k) { da[k[0]] = 1; aus.push(k); });
    var verworfen = 0;
    l.forEach(function (k) {
      if (da[k[0]]) { verworfen++; return; }   // das Archiv hat sie schon
      da[k[0]] = 1;
      aus.push(k);
    });
    aus.sort(function (x, y) { return x[0] - y[0]; });
    var naht = a.length ? a[a.length - 1][0] : null;
    return { kerzen: aus, naht: naht, ausArchiv: a.length, ausLive: aus.length - a.length, doppelt: verworfen };
  }

  /* ---------------------------------------------------------------------------
   * 4) Die laufende Kerze
   *
   * Waehrend der Sitzung ist die juengste Kerze noch nicht fertig. Sie aus den
   * Quotes fortzuschreiben ist der Unterschied zwischen einem Chart, der stimmt,
   * und einem, der eine Minute alt aussieht.
   *
   * SIE WIRD NIE INS ARCHIV GESCHRIEBEN. Deshalb traegt sie eine Marke: das
   * siebte Feld `true`. `archivFaehig()` wirft alles mit dieser Marke weg, und der
   * Viewer ruft ueberhaupt keine schreibende Auskunft auf - die Marke ist der
   * Guertel, die fehlende Schreibauskunft der Hosentraeger. Genau diese Fehlerform
   * hat das Projekt schon einmal Kerzen gekostet (Stempel-Kerzen der Quelle,
   * ab 8.23.13).
   *
   * `letzte` ist die juengste ABGESCHLOSSENE Kerze. Faellt der Quote-Stempel in
   * dieselbe Periode, wird sie fortgeschrieben; faellt er in die naechste, entsteht
   * eine neue. Ohne Kurs kommt null zurueck. */
  function periodeVon(tsMs, intervallMs) {
    if (!zahl(tsMs) || !(intervallMs > 0)) return null;
    return Math.floor(tsMs / intervallMs) * intervallMs;
  }
  function laufendeKerze(letzte, kurs, jetztMs, intervallMs) {
    if (!zahl(kurs) || kurs <= 0) return null;
    var p = periodeVon(jetztMs, intervallMs);
    if (p == null) return null;
    var lp = (letzte && zahl(letzte[0])) ? periodeVon(letzte[0], intervallMs) : null;
    if (lp != null && p < lp) return null;         // Quote aelter als das Archiv - nichts fortschreiben
    if (lp != null && p === lp) {
      /* Dieselbe Periode: Hoch und Tief wachsen, die Eroeffnung bleibt stehen. */
      var h = zahl(letzte[3]) ? Math.max(letzte[3], kurs) : kurs;
      var ti = zahl(letzte[4]) ? Math.min(letzte[4], kurs) : kurs;
      var o = zahl(letzte[5]) ? letzte[5] : letzte[1];
      return [letzte[0], kurs, letzte[2], h, ti, o, true];
    }
    /* Neue Periode: sie beginnt beim letzten bekannten Schluss. */
    var start = (letzte && zahl(letzte[1])) ? letzte[1] : kurs;
    return [p, kurs, null, Math.max(start, kurs), Math.min(start, kurs), start, true];
  }
  function istLaufend(k) { return !!(Array.isArray(k) && k[6] === true); }
  /** Was ins Archiv duerfte. Der Viewer benutzt sie nur, um es zu BELEGEN - er
   *  schreibt nichts; die Auskunft `archiv-kerzen` liest ausschliesslich. */
  function archivFaehig(kerzen) { return (kerzen || []).filter(function (k) { return !istLaufend(k); }); }

  /* ---------------------------------------------------------------------------
   * 5) Die Skala
   *
   * Zwei Bereiche uebereinander: oben die Kurse, unten die Umsaetze. Der Umsatz
   * bekommt einen festen Anteil der Hoehe - eine gemeinsame Skala waere entweder
   * eine Kurslinie am oberen Rand oder Umsatzbalken, die man nicht sieht.
   *
   * Die Kursspanne kommt aus HOCH und TIEF, nicht aus den Schlusskursen: sonst
   * ragten genau die Dochte aus dem Bild, wegen derer man Kerzen zeichnet. Ohne
   * Docht gilt der Schluss. Eine flache Reihe (alles derselbe Kurs) bekommt einen
   * kuenstlichen Rand, sonst waere die Hoehe null und jede Division daneben. */
  function spanneVon(kerzen) {
    var hi = -Infinity, lo = Infinity;
    (kerzen || []).forEach(function (k) {
      if (!kerzeOk(k)) return;
      var h = zahl(k[3]) ? k[3] : k[1];
      var t = zahl(k[4]) ? k[4] : k[1];
      if (h > hi) hi = h;
      if (t < lo) lo = t;
    });
    if (!isFinite(hi) || !isFinite(lo)) return null;
    if (hi === lo) { hi = hi + Math.abs(hi) * 0.01 + 0.01; lo = lo - Math.abs(lo) * 0.01 - 0.01; }
    return { hoch: hi, tief: lo };
  }
  function skala(kerzen, masse) {
    var m = masse || {};
    var breite = m.breite > 0 ? m.breite : 900;
    var hoehe = m.hoehe > 0 ? m.hoehe : 420;
    var links = m.links >= 0 ? m.links : 8;
    var rechts = m.rechts >= 0 ? m.rechts : 64;     // Platz fuer die Kursachse
    var oben = m.oben >= 0 ? m.oben : 10;
    var unten = m.unten >= 0 ? m.unten : 22;        // Platz fuer die Zeitachse
    var anteil = m.umsatzAnteil > 0 && m.umsatzAnteil < 0.9 ? m.umsatzAnteil : 0.22;
    var n = (kerzen || []).length;
    if (!n) return null;
    var sp = spanneVon(kerzen);
    if (!sp) return null;
    var feldBreite = Math.max(1, breite - links - rechts);
    var feldHoehe = Math.max(1, hoehe - oben - unten);
    var volHoehe = feldHoehe * anteil;
    var kursHoehe = feldHoehe - volHoehe;
    var dx = feldBreite / n;
    /* Kerzenkoerper: 70 % des Faches, mindestens ein Punkt. Bei 2.000 Kerzen auf
     * 900 Punkten ist das weniger als ein Punkt - dann wird nur der Docht gemalt,
     * und das ist ehrlicher als ein Koerper, der breiter ist als sein Fach. */
    var breiteKerze = Math.max(1, Math.floor(dx * 0.7));
    var volMax = 0;
    (kerzen || []).forEach(function (k) { if (zahl(k[2]) && k[2] > volMax) volMax = k[2]; });
    var sk = {
      n: n, dx: dx, kerzeBreite: breiteKerze,
      links: links, rechts: rechts, oben: oben, unten: unten,
      breite: breite, hoehe: hoehe,
      feldBreite: feldBreite, kursHoehe: kursHoehe, volHoehe: volHoehe,
      hoch: sp.hoch, tief: sp.tief, volMax: volMax,
      x: function (i) { return links + (i + 0.5) * dx; },
      index: function (px) {
        var i = Math.floor((px - links) / dx);
        return i < 0 ? 0 : (i >= n ? n - 1 : i);
      },
      y: function (v) { return oben + (sp.hoch - v) / (sp.hoch - sp.tief) * kursHoehe; },
      kurs: function (py) { return sp.hoch - (py - oben) / kursHoehe * (sp.hoch - sp.tief); },
      /* Umsatzbalken wachsen von der Unterkante nach oben. */
      volY: function (v) {
        if (!(volMax > 0) || !zahl(v)) return oben + kursHoehe + volHoehe;
        return oben + kursHoehe + volHoehe - (v / volMax) * volHoehe;
      }
    };
    return sk;
  }

  /* Gleitender Durchschnitt als REIHE, aber gerechnet wird er draussen: `sma` ist
   * window.Quant.sma und bekommt jeweils das Fenster. Vor der n-ten Kerze steht
   * null - eine Linie, die frueher beginnt, waere aus weniger Kerzen gemacht, als
   * ihr Name sagt (das Projekt hat diese Fehlerform als "heimlich verkuerzt"
   * verzeichnet und im Explorer schon einmal beseitigt). */
  function maReihe(kerzen, n, sma) {
    var aus = [];
    if (!(n > 0) || typeof sma !== 'function') return aus;
    var closes = (kerzen || []).map(function (k) { return k && k[1]; });
    for (var i = 0; i < closes.length; i++) {
      if (i + 1 < n) { aus.push(null); continue; }
      var w = sma(closes.slice(0, i + 1), n);
      aus.push(zahl(w) ? w : null);
    }
    return aus;
  }

  /** Ausschnitt der Reihe: `anzahl` Kerzen, endend bei `bis` (Index, einschliesslich).
   *  Blaettern und Zoomen sind dieselbe Rechnung mit anderen Zahlen; sie steht
   *  deshalb einmal hier und nicht zweimal an den Tasten. */
  function fenster(gesamt, bis, anzahl, mindest) {
    var min = mindest > 0 ? mindest : 20;
    var n = Math.max(min, Math.min(gesamt, Math.round(anzahl) || gesamt));
    var e = Math.min(gesamt - 1, Math.max(n - 1, Math.round(bis)));
    if (!(gesamt > 0)) return { von: 0, bis: -1, anzahl: 0 };
    return { von: Math.max(0, e - n + 1), bis: e, anzahl: n };
  }

  /* ---------------------------------------------------------------------------
   * 6) Zeichnen
   *
   * `ctx` ist ein Canvas-Zeichenkontext - oder in der Pruefung eine Attrappe, die
   * dieselben Verben annimmt und mitschreibt. Diese Funktion fragt NICHTS ab: sie
   * misst keine Breite am Fenster, liest keine Farbe aus einem Element und holt
   * keine Daten. Alles, was sie braucht, steht in `kerzen`, `sk` und `opt`.
   *
   * `opt.farben` traegt die Farbwerte herein (der Aufrufer holt sie aus den
   * CSS-Variablen des Themas) - eine feste Farbe hier waere im hellen Thema
   * unsichtbar. */
  /* ---------------------------------------------------------------------------
   * Die Beschriftung der Zeitachse
   *
   * PM-Fund am Viewer-Foto (04.09.2026): bei 1h ueber mehrere Tage stand an jedem
   * Halt nur "10:30" - sechsmal dieselbe Uhrzeit, weil jeder US-Handelstag um
   * dieselbe Zeit beginnt und die Halte gleichmaessig verteilt sind. Die Achse sagte
   * damit nichts ueber die Zeitspanne, die sie zeigt.
   *
   * Die Regel:
   *   - Grobes Intervall (>= 1 Tag): jeder Halt traegt sein Datum, wie bisher.
   *   - Feines Intervall: die Halte tragen Uhrzeiten - AUSSER am Tageswechsel, dort
   *     steht das Datum. Ein Tageswechsel ist eine Kerze, deren Kalendertag in der
   *     BOERSENZEITZONE von dem der vorigen abweicht; die erste Kerze gilt immer als
   *     Tagesanfang. Die Zeitzone ist nicht die des Rechners: eine 60m-Kerze von
   *     16:00 ET liegt in Berlin schon am naechsten Tag, und der Tageswechsel saesse
   *     dann mitten in der Sitzung.
   *
   * DUENNUNG NACH PLATZ, NICHT NACH INHALT. Ueber sechzig Handelstage gibt es
   * sechzig Tageswechsel und Platz fuer eine Handvoll Beschriftungen. Ein Datum wird
   * deshalb nur gesetzt, wenn es mindestens 'abstand' Kerzen vom zuletzt gesetzten
   * entfernt ist, eine Uhrzeit nur, wenn sie denselben Abstand zu jedem Datum haelt.
   * Der Abstand haengt allein an der Zahl der Kerzen - nie an ihren Kursen.
   *
   * Rein: keine Uhr, kein DOM, kein Zufall. Dieselben Kerzen geben dieselbe Liste. */
  function tagSchluessel(ms, zone) {
    try {
      return new Date(ms).toLocaleDateString('de-DE',
        { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: zone });
    } catch (e) { return String(Math.floor(ms / 86400000)); }
  }
  function achsenText(ms, zone, art) {
    var d = new Date(ms);
    try {
      if (art === 'uhr') return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: zone });
      if (art === 'tagKurz') return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: zone });
      return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: zone });
    } catch (e) { return ''; }
  }
  function achsenBeschriftung(kerzen, opt) {
    var ks = kerzen || [];
    if (!ks.length) return [];
    var o = opt || {};
    var zone = o.zone || 'America/New_York';
    var ziel = o.ziel > 0 ? o.ziel : 6;
    var schritt = Math.max(1, Math.floor(ks.length / ziel));
    /* Zwei Kerzen ist der kleinste Abstand, bei dem zwei Beschriftungen nicht
     * uebereinander liegen - ein Datum direkt neben einer Uhrzeit war genau das. */
    var abstand = Math.max(2, Math.floor(schritt / 2));
    var marken = [];
    var i, j;
    if (!((o.intervallMs || 86400000) < 86400000)) {
      for (i = 0; i < ks.length; i += schritt) {
        marken.push({ i: i, text: achsenText(ks[i][0], zone, 'tagJahr'), tag: true });
      }
      return marken;
    }
    /* Erst die Tageswechsel - sie haben Vorrang vor den gleichmaessigen Halten,
     * denn sie sind die Information, die vorher fehlte. */
    var vorher = tagSchluessel(ks[0][0], zone);
    var wechsel = [0];
    for (i = 1; i < ks.length; i++) {
      var t = tagSchluessel(ks[i][0], zone);
      if (t !== vorher) { wechsel.push(i); vorher = t; }
    }
    wechsel.forEach(function (w) {
      if (marken.length && w - marken[marken.length - 1].i < abstand) return;
      marken.push({ i: w, text: achsenText(ks[w][0], zone, 'tagKurz'), tag: true });
    });
    /* Danach die Uhrzeiten - aber nur, wo kein Datum steht. */
    for (j = 0; j < ks.length; j += schritt) {
      var belegt = false;
      for (i = 0; i < marken.length; i++) {
        if (Math.abs(marken[i].i - j) < abstand) { belegt = true; break; }
      }
      if (!belegt) marken.push({ i: j, text: achsenText(ks[j][0], zone, 'uhr'), tag: false });
    }
    marken.sort(function (a, b) { return a.i - b.i; });
    return marken;
  }

  var FARBEN = {
    auf: '#16a34a', ab: '#dc2626', docht: '#94a3b8',
    band: 'rgba(148,163,184,0.13)', gitter: 'rgba(148,163,184,0.22)',
    umsatz: 'rgba(148,163,184,0.55)', text: '#64748b',
    ma20: '#2563eb', ma50: '#f59e0b', ma200: '#a855f7', kreuz: '#94a3b8'
  };
  function zeichnen(ctx, kerzen, sk, opt) {
    if (!ctx || !sk || !kerzen || !kerzen.length) return { kerzen: 0, baender: 0, linien: 0 };
    var o = opt || {};
    var f = {};
    Object.keys(FARBEN).forEach(function (k) { f[k] = (o.farben && o.farben[k]) || FARBEN[k]; });
    ctx.clearRect(0, 0, sk.breite, sk.hoehe);

    /* (a) Die Baender der ausserboerslichen Sitzungen ZUERST - sie liegen hinter
     *     allem anderen. Wer sie zuletzt malt, deckt die Kerzen zu. */
    var bs = o.baender || [];
    ctx.save();
    ctx.fillStyle = f.band;
    bs.forEach(function (b) {
      var x0 = sk.links + b.von * sk.dx;
      var x1 = sk.links + (b.bis + 1) * sk.dx;
      ctx.fillRect(x0, sk.oben, Math.max(1, x1 - x0), sk.kursHoehe + sk.volHoehe);
    });
    ctx.restore();

    /* (b) Umsatzbalken unter den Kursen. */
    ctx.save();
    ctx.fillStyle = f.umsatz;
    var mitUmsatz = 0;
    kerzen.forEach(function (k, i) {
      if (!zahl(k[2]) || k[2] <= 0) return;
      mitUmsatz++;
      var y = sk.volY(k[2]);
      var boden = sk.oben + sk.kursHoehe + sk.volHoehe;
      ctx.fillRect(sk.x(i) - sk.kerzeBreite / 2, y, sk.kerzeBreite, Math.max(1, boden - y));
    });
    ctx.restore();

    /* (c) Die Kerzen. Docht als Linie, Koerper als Rechteck; eine Kerze ohne
     *     Bewegung bekommt einen Strich, kein Rechteck der Hoehe null. */
    var gezeichnet = 0;
    kerzen.forEach(function (k, i) {
      if (!kerzeOk(k)) return;
      gezeichnet++;
      var o1 = zahl(k[5]) ? k[5] : k[1];
      var c = k[1];
      var h = zahl(k[3]) ? k[3] : Math.max(o1, c);
      var t = zahl(k[4]) ? k[4] : Math.min(o1, c);
      var farbe = c >= o1 ? f.auf : f.ab;
      var x = sk.x(i);
      ctx.save();
      /* Die laufende Kerze gestrichelt: sie ist noch nicht fertig, und das darf
       * man ihr ansehen. */
      if (istLaufend(k)) { ctx.setLineDash([3, 3]); }
      ctx.strokeStyle = farbe;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, sk.y(h));
      ctx.lineTo(x, sk.y(t));
      ctx.stroke();
      var yo = sk.y(o1), yc = sk.y(c);
      var oben = Math.min(yo, yc), hoehe = Math.max(1, Math.abs(yc - yo));
      if (istLaufend(k)) {
        ctx.strokeRect(x - sk.kerzeBreite / 2, oben, sk.kerzeBreite, hoehe);
      } else {
        ctx.fillStyle = farbe;
        ctx.fillRect(x - sk.kerzeBreite / 2, oben, sk.kerzeBreite, hoehe);
      }
      ctx.restore();
    });

    /* (d) Die gleitenden Durchschnitte. Jede Reihe eine Linie, Luecken (null)
     *     unterbrechen sie - eine durchgezogene Linie ueber eine Luecke waere eine
     *     Behauptung ueber Kerzen, die es nicht gibt. */
    var linien = 0;
    (o.linien || []).forEach(function (L) {
      if (!L || !L.werte || !L.werte.length) return;
      linien++;
      ctx.save();
      ctx.strokeStyle = L.farbe || f.ma20;
      ctx.lineWidth = L.breite || 1.4;
      ctx.beginPath();
      var offen = false;
      L.werte.forEach(function (v, i) {
        if (!zahl(v)) { offen = false; return; }
        if (!offen) { ctx.moveTo(sk.x(i), sk.y(v)); offen = true; }
        else ctx.lineTo(sk.x(i), sk.y(v));
      });
      ctx.stroke();
      ctx.restore();
    });

    /* (e) Das Fadenkreuz - nur wenn eines gesetzt ist. */
    if (o.kreuz && zahl(o.kreuz.index)) {
      var xk = sk.x(o.kreuz.index);
      ctx.save();
      ctx.strokeStyle = f.kreuz;
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(xk, sk.oben); ctx.lineTo(xk, sk.oben + sk.kursHoehe + sk.volHoehe);
      if (zahl(o.kreuz.y)) { ctx.moveTo(sk.links, o.kreuz.y); ctx.lineTo(sk.breite - sk.rechts, o.kreuz.y); }
      ctx.stroke();
      ctx.restore();
    }
    return { kerzen: gezeichnet, baender: bs.length, linien: linien, mitUmsatz: mitUmsatz };
  }

  var KerzenChart = {
    INTERVALL_MS: INTERVALL_MS,
    ARCHIV_INTERVALL: ARCHIV_INTERVALL,
    YAHOO_INTERVALL: YAHOO_INTERVALL,
    ZEITRAHMEN: ZEITRAHMEN,
    VOR_MIN: VOR_MIN, NACH_MIN: NACH_MIN,
    FARBEN: FARBEN,
    kerzenAusText: kerzenAusText,
    sitzungenAusText: sitzungenAusText,
    quellenAusText: quellenAusText,
    quellenIm: quellenIm,
    sitzungAusMinuten: sitzungAusMinuten,
    sitzungJeKerze: sitzungJeKerze,
    baender: baender,
    bandText: bandText,
    nurRegulaer: nurRegulaer,
    zusammenfuehren: zusammenfuehren,
    periodeVon: periodeVon,
    laufendeKerze: laufendeKerze,
    istLaufend: istLaufend,
    archivFaehig: archivFaehig,
    spanneVon: spanneVon,
    skala: skala,
    maReihe: maReihe,
    fenster: fenster,
    achsenBeschriftung: achsenBeschriftung,
    zeichnen: zeichnen
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = KerzenChart; return; }
  root.KerzenChart = KerzenChart;
})(typeof window !== 'undefined' ? window : globalThis);
