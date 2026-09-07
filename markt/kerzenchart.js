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
    '1h': 3600000, '1T': 86400000, '1W': 604800000,
    /* 1M hat KEINE feste Dauer - Monate sind 28 bis 31 Tage lang. Wer hier eine
     * Zahl hinschreibt, bekommt sie in periodeVon() zurueck und legt die laufende
     * Monatskerze auf einen Tag, den es im Kalender nicht gibt. Monatskerzen
     * entstehen deshalb ausschliesslich ueber verdichten(). */
    '1M': null
  };
  /* Welcher Archivordner traegt diesen Zeitrahmen (kerzenquelle.js kennt die Pfade).
   * 1W und 1M fuehrt das Archiv NICHT - sie werden aus TAGESKERZEN gebildet
   * (verdichten()), nicht von einer eigenen Quelle geholt. Eine zweite Quelle fuer
   * dieselbe Woche waere eine zweite Wahrheit ueber denselben Kurs. */
  var ARCHIV_INTERVALL = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '60m', '1T': '1d', '1W': null, '1M': null };
  /* Wie derselbe Zeitrahmen bei Yahoo heisst. */
  var YAHOO_INTERVALL = { '1m': '1m', '5m': '5m', '15m': '15m', '1h': '60m', '1T': '1d', '1W': '1wk', '1M': '1mo' };
  /* Aus welchen Kerzen 1W und 1M gebildet werden. Was hier nicht steht, wird geholt. */
  var AUS_TAGESKERZEN = { '1W': true, '1M': true };
  var ZEITRAHMEN = ['1m', '5m', '15m', '1h', '1T', '1W', '1M'];

  /* ---------------------------------------------------------------------------
   * ZEITRAUM UND KERZENLAENGE SIND ZWEI FRAGEN (Viewer 8a, 05.09.2026)
   *
   * Bis hierher gab es EINE Reihe Knoepfe, und sie beantwortete beide zugleich:
   * "1W" hiess sowohl "eine Woche weit" als auch "Wochenkerzen". Wilhelms Befund vom
   * 05.09.: man kam nur bis zum Wochenchart, und die Zeitraeume waren falsch
   * beschriftet - genau das ist die Verwechslung.
   *
   * Deshalb zwei Listen: ZEITRAEUME sagt, wie weit zurueck; KERZEN sagt, wie fein.
   * VORGABE verbindet sie beim Klick auf einen Zeitraum, ueberschreibt die Kerze aber
   * nie danach - wer eine Kerze waehlt, behaelt sie. */
  var ZEITRAEUME = ['1T', '5T', '1M', '3M', '6M', '1J', '5J', 'Max'];
  var KERZEN = ['1m', '5m', '15m', '1h', '1T', '1W', '1M'];
  var VORGABE = { '1T': '5m', '5T': '15m', '1M': '1h', '3M': '1T', '6M': '1T', '1J': '1T', '5J': '1W', 'Max': '1M' };

  /* HANDELSTAGE, nicht Kalendertage: ein Jahr hat 252 Sitzungen, nicht 365. Wer mit
   * Kalendertagen rechnet, bekommt fuer jeden Zeitraum ein Drittel zu viele Kerzen
   * und graut Paare aus, die in Wahrheit passen. 'Max' ist keine Zahl, sondern
   * "so weit die Quelle reicht" - hier steht eine grosszuegige Obergrenze, damit die
   * Ausgrau-Regel ueberhaupt rechnen kann. */
  var HANDELSTAGE = { '1T': 1, '5T': 5, '1M': 21, '3M': 63, '6M': 126, '1J': 252, '5J': 1260, 'Max': 10000 };
  /* Wie viele Kerzen ein Handelstag traegt. 390 Minuten regulaere Sitzung; die
   * Vor- und Nachboerse zaehlt hier NICHT mit - sie ist im Viewer abschaltbar und
   * wuerde die Schaetzung von der Stellung eines Schalters abhaengig machen. */
  var KERZEN_JE_TAG = { '1m': 390, '5m': 78, '15m': 26, '1h': 7, '1T': 1, '1W': 1 / 5, '1M': 1 / 21 };
  /* Die Grenzen der Vernunft. Unten drei Kerzen: aus zwei Kerzen wird kein Chart,
   * und "1 Tag mit Wochenkerzen" ist keine Ansicht, sondern ein Missverstaendnis.
   * Oben 20.000: darueber ist jede Kerze schmaler als ein Bildpunkt. */
  var KERZEN_MIN = 3;
  var KERZEN_MAX = 20000;

  /** Wie viele Kerzen ergaebe dieses Paar ungefaehr? Reine Schaetzung aus zwei
   *  Tabellen - sie fragt keine Quelle und laedt nichts. */
  function kerzenZahl(zeitraum, kerze) {
    var t = HANDELSTAGE[zeitraum], j = KERZEN_JE_TAG[kerze];
    if (!(t > 0) || !(j > 0)) return null;
    return t * j;
  }
  /** Passt dieses Paar zusammen? Zurueck kommt IMMER ein Grund, wenn nicht - ein
   *  ausgegrauter Knopf ohne Begruendung ist eine Sackgasse mit Deckel. */
  function paarUrteil(zeitraum, kerze) {
    var n = kerzenZahl(zeitraum, kerze);
    if (n == null) return { ok: false, grund: 'Diese Kombination gibt es nicht.' };
    if (n < KERZEN_MIN) {
      return { ok: false, grund: zeitraum + ' ergibt mit ' + kerze + '-Kerzen weniger als drei Kerzen – dafür ist der Zeitraum zu kurz.' };
    }
    if (n > KERZEN_MAX) {
      return { ok: false, grund: zeitraum + ' mit ' + kerze + '-Kerzen wären rund ' + gerundet(n) + ' Kerzen – feiner, als ein Bildschirm zeigen kann.' };
    }
    return { ok: true, grund: '' };
  }
  function gerundet(n) {
    if (n >= 1e6) return Math.round(n / 1e5) / 10 + ' Mio.';
    if (n >= 1000) return Math.round(n / 1000) + '.000';
    return String(Math.round(n));
  }
  /** Die Kerze, die ein Zeitraum vorschlaegt - und die gewaehlte, falls sie noch
   *  passt. So bleibt eine bewusst gewaehlte Kerze beim Zeitraumwechsel stehen,
   *  solange sie sinnvoll ist, und rutscht sonst auf die Vorgabe. */
  function kerzeFuer(zeitraum, bisher) {
    if (bisher && paarUrteil(zeitraum, bisher).ok) return bisher;
    var v = VORGABE[zeitraum];
    if (v && paarUrteil(zeitraum, v).ok) return v;
    for (var i = 0; i < KERZEN.length; i++) {
      if (paarUrteil(zeitraum, KERZEN[i]).ok) return KERZEN[i];
    }
    return v || KERZEN[0];
  }

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
    /* SKALENMODUS (Einstellung aus 8b). 'log' setzt die Kurse auf ihren Logarithmus -
     * gleiche PROZENTUALE Schritte werden dann gleich hoch, und das ist bei einer
     * Reihe ueber fuenf Jahre der Unterschied zwischen einer lesbaren Kurve und
     * einer flachen Linie mit einem Haken am Ende.
     *
     * NUR wenn die ganze Spanne ueber null liegt: log(0) ist -unendlich, und eine
     * Skala mit einer Unendlichkeit darin zeichnet nichts Brauchbares. Faellt sie
     * nicht, wird STILL auf linear zurueckgeschaltet - aber sk.modus sagt es, damit
     * die Beschriftung nicht behauptet, sie sei logarithmisch.
     *
     * 'prozent' steht bewusst NICHT hier: prozentual ist eine monotone, lineare
     * Umrechnung derselben Kurse (v/basis - 1). Die Punkte lägen exakt gleich; nur
     * die BESCHRIFTUNG ist eine andere, und die macht charteinstellungen.js. Wer
     * dafuer hier eine zweite Rechnung einbaute, haette zwei Wege zu demselben
     * Bild - und irgendwann zwei verschiedene Bilder. */
    var modus = m.modus === 'log' && sp.tief > 0 ? 'log' : 'linear';
    var lHoch = modus === 'log' ? Math.log(sp.hoch) : 0;
    var lTief = modus === 'log' ? Math.log(sp.tief) : 0;
    if (modus === 'log' && !(lHoch > lTief)) { modus = 'linear'; }
    var sk = {
      n: n, dx: dx, kerzeBreite: breiteKerze,
      links: links, rechts: rechts, oben: oben, unten: unten,
      breite: breite, hoehe: hoehe,
      feldBreite: feldBreite, kursHoehe: kursHoehe, volHoehe: volHoehe,
      hoch: sp.hoch, tief: sp.tief, volMax: volMax, modus: modus,
      x: function (i) { return links + (i + 0.5) * dx; },
      index: function (px) {
        var i = Math.floor((px - links) / dx);
        return i < 0 ? 0 : (i >= n ? n - 1 : i);
      },
      y: function (v) {
        if (!zahl(v)) return oben;
        if (modus === 'log') {
          if (!(v > 0)) return oben + kursHoehe;
          return oben + (lHoch - Math.log(v)) / (lHoch - lTief) * kursHoehe;
        }
        return oben + (sp.hoch - v) / (sp.hoch - sp.tief) * kursHoehe;
      },
      kurs: function (py) {
        if (modus === 'log') return Math.exp(lHoch - (py - oben) / kursHoehe * (lHoch - lTief));
        return sp.hoch - (py - oben) / kursHoehe * (sp.hoch - sp.tief);
      },
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

  /** Dasselbe Fenster, aber am LINKEN Rand festgemacht. TradingView merkt sich die
   *  Position des linken Chartrands: wechselt man die Kerzenlaenge, bleibt der
   *  Anfang stehen und das Bild wird feiner, statt nach rechts wegzuspringen.
   *  Beides ist dieselbe Rechnung - nur der Anker ist ein anderer. */
  function fensterAbVon(gesamt, von, anzahl, mindest) {
    var min = mindest > 0 ? mindest : 20;
    if (!(gesamt > 0)) return { von: 0, bis: -1, anzahl: 0 };
    var n = Math.max(min, Math.min(gesamt, Math.round(anzahl) || gesamt));
    var v = Math.max(0, Math.min(gesamt - n, Math.round(von) || 0));
    return { von: v, bis: v + n - 1, anzahl: n };
  }

  /* ---------------------------------------------------------------------------
   * 5b) Rad-Zoom und Blaettern - als Rechnung, nicht als Ereignis
   *
   * Die alte Linien-Ansicht hatte den Rad-Zoom in ihrem wheel-Horcher stehen
   * (explorer.js, Tester-Wunsch #27). Dort war er nicht pruefbar, und mit der
   * Ansicht waere er verschwunden. Hier ist er eine Funktion: gleiche Eingabe,
   * gleiches Fenster, ohne Maus.
   *
   * DIE KERZE UNTER DEM ZEIGER BLEIBT STEHEN. `anteil` ist die Position des
   * Zeigers im Bild (0 = linker Rand, 1 = rechter). Genau die Kerze, die dort
   * liegt, liegt danach wieder dort - sonst zoomt man am Punkt vorbei, auf den man
   * zeigt. */
  var ZOOM_SCHRITT = 0.75;
  var ZOOM_MIN = 20;
  function radZoom(gesamt, von, anzahl, anteil, rein) {
    if (!(gesamt > 0)) return { von: 0, anzahl: 0 };
    var n = Math.max(1, Math.min(gesamt, Math.round(anzahl) || gesamt));
    var v = Math.max(0, Math.min(gesamt - n, Math.round(von) || 0));
    var a = zahl(anteil) ? Math.max(0, Math.min(1, anteil)) : 0.5;
    var anker = v + Math.round(a * (n - 1));
    var neuN = rein ? Math.round(n * ZOOM_SCHRITT) : Math.round(n / ZOOM_SCHRITT);
    neuN = Math.max(Math.min(ZOOM_MIN, gesamt), Math.min(gesamt, neuN));
    var neuVon = Math.max(0, Math.min(gesamt - neuN, anker - Math.round(a * (neuN - 1))));
    return { von: neuVon, anzahl: neuN };
  }
  /** Blaettern um `kerzen` Stellen. Positiv heisst nach rechts (juenger). */
  function blaettern(gesamt, von, anzahl, kerzen) {
    if (!(gesamt > 0)) return { von: 0, anzahl: 0 };
    var n = Math.max(1, Math.min(gesamt, Math.round(anzahl) || gesamt));
    return { von: Math.max(0, Math.min(gesamt - n, Math.round(von) + Math.round(kerzen))), anzahl: n };
  }

  /* ---------------------------------------------------------------------------
   * 5c) Wochen- und Monatskerzen aus TAGESKERZEN
   *
   * Warum gebildet und nicht geholt: Yahoo liefert '1wk' und '1mo' zwar, aber das
   * eigene Archiv fuehrt sie nicht. Wer die Woche holt und den Tag hat, hat zwei
   * Quellen fuer denselben Kurs - und an der Naht entscheidet dann der Zufall,
   * welche gewinnt. Gebildet ist sie ableitbar: dieselben Tage geben dieselbe Woche.
   *
   * WOCHEN NACH BOERSENKALENDER, nicht nach Millisekunden. 604800000 ms auf den
   * Stempel addiert verschiebt sich ueber die Sommerzeit hinweg und legt die
   * Wochengrenze irgendwann mitten in den Dienstag. Gebildet wird ueber den
   * KALENDERTAG in der Boersenzeitzone: alle Tage mit demselben Montag gehoeren in
   * dieselbe Kerze. Eine Feiertagswoche hat vier Tage und ergibt trotzdem GENAU
   * EINE Kerze - keine leere daneben.
   *
   * Der Stempel der gebildeten Kerze ist der ERSTE Handelstag des Abschnitts, nicht
   * der Montag: an einem Montagsfeiertag gaebe es sonst eine Kerze zu einem Tag, an
   * dem nicht gehandelt wurde. */
  function teileIn(ms, zone) {
    var d = new Date(ms);
    try {
      var s = d.toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: zone });
      return { jahr: Number(s.slice(0, 4)), monat: Number(s.slice(5, 7)), tag: Number(s.slice(8, 10)) };
    } catch (e) {
      return { jahr: d.getUTCFullYear(), monat: d.getUTCMonth() + 1, tag: d.getUTCDate() };
    }
  }
  /** Schluessel des Abschnitts, in den diese Kerze faellt. '1W' -> der Montag,
   *  '1M' -> der Kalendermonat. Rein: kein Zufall, keine Uhr. */
  function abschnittSchluessel(ms, art, zone) {
    var t = teileIn(ms, zone || 'America/New_York');
    if (art === '1M') return t.jahr + '-' + (t.monat < 10 ? '0' : '') + t.monat;
    var u = Date.UTC(t.jahr, t.monat - 1, t.tag);
    var wt = new Date(u).getUTCDay();              // 0 = Sonntag
    var zurueck = (wt + 6) % 7;                    // auf den Montag zurueck
    return new Date(u - zurueck * 86400000).toISOString().slice(0, 10);
  }
  /** Tageskerzen zu Wochen- oder Monatskerzen verdichten.
   *  Eroeffnung der ersten, Schluss der letzten, Hoch das hoechste, Tief das
   *  tiefste, Umsatz die Summe. Fehlt ueberall der Umsatz, bleibt er null - eine
   *  Null waere die Behauptung, es sei nichts gehandelt worden. */
  function verdichten(tageskerzen, art, zone) {
    if (art !== '1W' && art !== '1M') return (tageskerzen || []).slice();
    var ks = (tageskerzen || []).filter(kerzeOk);
    var aus = [], letzterS = null, akt = null;
    ks.forEach(function (k) {
      var s = abschnittSchluessel(k[0], art, zone);
      if (s !== letzterS) {
        if (akt) aus.push(fertig(akt));
        letzterS = s;
        akt = { zeit: k[0], auf: zahl(k[5]) ? k[5] : k[1], zu: k[1],
                hoch: zahl(k[3]) ? k[3] : k[1], tief: zahl(k[4]) ? k[4] : k[1],
                umsatz: zahl(k[2]) ? k[2] : null };
        return;
      }
      akt.zu = k[1];
      var h = zahl(k[3]) ? k[3] : k[1], t = zahl(k[4]) ? k[4] : k[1];
      if (h > akt.hoch) akt.hoch = h;
      if (t < akt.tief) akt.tief = t;
      if (zahl(k[2])) akt.umsatz = (akt.umsatz == null ? 0 : akt.umsatz) + k[2];
    });
    if (akt) aus.push(fertig(akt));
    return aus;
    function fertig(a) { return [a.zeit, a.zu, a.umsatz, a.hoch, a.tief, a.auf]; }
  }

  /* ---------------------------------------------------------------------------
   * MINUTENKERZEN ZU 5m / 15m / 1h VERDICHTEN (Live-Sammler, 06.09.2026)
   *
   * Der Live-Sammler haengt die fertigen Alpaca-Minuten waehrend der Sitzung an das
   * Archiv; das App-Archiv (Yahoo 5m/15m/60m) kommt erst nach Handelsschluss nach.
   * Damit der Viewer am Nachmittag nicht am Vortag endet, werden die groeberen
   * Kerzen aus den Minuten GEBILDET - dasselbe Muster wie 1W/1M aus Tageskerzen:
   * Eroeffnung der ersten, Schluss der letzten, Hoch das hoechste, Tief das tiefste,
   * Umsatz die Summe (bleibt null, wenn ueberall der Umsatz fehlt).
   *
   * DAS GITTER HAENGT AN DER SITZUNG, nicht an der vollen Stunde. Yahoos 60m-Kerzen
   * liegen auf 09:30, 10:30 ... 15:30 (kerzenquelle.js aufGitter: Minute 30 oder 0),
   * Vor- und Nachboerse auf 04:00, 05:00 ... bzw. 16:00, 17:00 ... Ein Gitter ab
   * Mitternacht traefe 09:00-10:00 und mischte Vorboerse und regulaere Sitzung in
   * einer Kerze. Deshalb: jede Kerze gehoert genau einer Sitzung, und die Perioden
   * beginnen am Anfang IHRER Sitzung - 04:00 fuer 'vor', 09:30 fuer 'regulaer',
   * 16:00 fuer 'nach' (13:00 an einem Halbtag, erkennbar an einer 'nach'-Kerze vor
   * 16:00). Eine Kerze ohne Sitzung ('ausserhalb', 'unbekannt') faellt auf das
   * Tagesgitter ab Mitternacht ET.
   *
   * UNVOLLSTAENDIGES WIRD NICHT GEZEIGT. Die letzte Periode ist nur dann eine Kerze,
   * wenn ihr Ende erreicht ist (Ende <= juengster Minutenstempel + 1 min); die erste
   * Periode nur, wenn sie nicht vor dem ersten gelieferten Stempel begonnen hat (der
   * Aufrufer liest den Schwanz einer Datei - die Periode davor ist angeschnitten).
   * Was fehlt, holt der Viewer als laufende Kerze bei Yahoo (die Naht, Abschnitt 3);
   * eine halbe Stunde als ganze Kerze zu zeichnen waere die Zacke, die es nie gab.
   *
   * Rein: keine Uhr, kein Zufall, kein Netz. Die Zeitzone kommt ueber Intl, gemerkt
   * je Stunde - ueber 100.000 Minuten sind das ein paar tausend Aufrufe, nicht
   * hunderttausend. */
  var MINUTEN_VERDICHTUNG = { '5m': 5, '15m': 15, '1h': 60 };
  var ET_TEILE = null;
  var etMerk = {};
  function etVersatzMin(ms) {
    var h = Math.floor(ms / 3600000);
    if (etMerk[h] !== undefined) return etMerk[h];
    try {
      if (!ET_TEILE) {
        ET_TEILE = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour12: false,
          year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
      }
      var t = {};
      ET_TEILE.formatToParts(new Date(h * 3600000)).forEach(function (p) { t[p.type] = p.value; });
      var wand = Date.UTC(+t.year, +t.month - 1, +t.day, (+t.hour) % 24, +t.minute);
      return (etMerk[h] = Math.round((wand - h * 3600000) / 60000));
    } catch (e) { return (etMerk[h] = 0); }
  }
  var SITZUNGS_ANKER = { vor: 4 * 60, regulaer: 9 * 60 + 30, nach: 16 * 60 };
  var HALBTAG_SCHLUSS = 13 * 60;
  /** Der Beginn der Periode (UTC ms), in die diese Minutenkerze faellt. */
  function periodeMinuten(tsMs, sitzung, ivMin) {
    var v = etVersatzMin(tsMs);
    var lokal = tsMs + v * 60000;
    var tagStart = Math.floor(lokal / 86400000) * 86400000;
    var minDesTages = Math.floor((lokal - tagStart) / 60000);
    var anker = SITZUNGS_ANKER[sitzung];
    if (sitzung === 'nach' && minDesTages < SITZUNGS_ANKER.nach) anker = HALBTAG_SCHLUSS;
    if (anker === undefined || minDesTages < anker) anker = 0;
    var p = anker + Math.floor((minDesTages - anker) / ivMin) * ivMin;
    return tagStart + p * 60000 - v * 60000;
  }
  /* DIE LETZTE PERIODE EINER SITZUNG (07.09.2026).
   * Eine Periode galt bisher nur als geschlossen, wenn ein Balken kam, der ihre volle
   * Laenge deckt: fuer die 15:30-Stundenkerze also einer um 16:30. Die 15:30-Periode ist
   * aber nur eine halbe Stunde lang - die Sitzung endet um 16:00 -, und so verschwand
   * sie zwischen Handelsschluss und dem ersten fertigen Nachboersen-Balken; bei Werten
   * ohne Nachboersenhandel bis zum naechtlichen Yahoo-Lauf. Dasselbe am Halbtag (12:30)
   * und in der Vorboerse (09:00).
   * Jetzt schliesst eine Periode auch, wenn der juengste Minutenstempel die LETZTE
   * MINUTE IHRER SITZUNG ist. Welche das ist, sagt der Aufrufer (opt.sitzungsEnde aus
   * dem Kalender der Quelle); ohne ihn gelten die Regelzeiten - Vorboerse bis 09:29,
   * regulaer bis 15:59 (Halbtag 12:59), nachboerslich bis 19:59 (Halbtag 16:59). */
  var SITZUNGS_ENDE = { vor: [9 * 60 + 29], regulaer: [15 * 60 + 59, 12 * 60 + 59], nach: [19 * 60 + 59, 16 * 60 + 59] };
  function minuteDesTages(tsMs) {
    var lokal = tsMs + etVersatzMin(tsMs) * 60000;
    return Math.floor((lokal - Math.floor(lokal / 86400000) * 86400000) / 60000);
  }
  function istSitzungsEnde(tsMs, sitzung, opt) {
    var m = minuteDesTages(tsMs);
    if (opt && typeof opt.sitzungsEnde === 'function') {
      var e = opt.sitzungsEnde(sitzung, tsMs);
      return zahl(e) && m === e;
    }
    var liste = SITZUNGS_ENDE[sitzung];
    return !!liste && liste.indexOf(m) >= 0;
  }
  /** Minutenkerzen -> Kerzen des Zeitrahmens, Sitzung je gebildeter Kerze mitgefuehrt.
   *  Rueckgabe { kerzen, sitzungen, unvollstaendig, angeschnitten }.
   *  opt.sitzungsEnde(sitzung, tsMs) -> Minute des ET-Tages, an der diese Sitzung endet. */
  function verdichtenMinuten(kerzen, art, sitzungJe, opt) {
    var ivMin = MINUTEN_VERDICHTUNG[art];
    var ks = (kerzen || []).filter(kerzeOk);
    if (!ivMin) return { kerzen: ks.slice(), sitzungen: (sitzungJe || []).slice(), unvollstaendig: 0, angeschnitten: 0 };
    var aus = [], sitz = [], akt = null, aktSitz = null, unvoll = 0, angeschnitten = 0;
    var erster = ks.length ? ks[0][0] : null, letzter = null;
    function abschliessen(vollstaendig) {
      if (!akt) return;
      if (akt.zeit < erster) angeschnitten++;
      else if (!vollstaendig) unvoll++;
      else { aus.push([akt.zeit, akt.zu, akt.umsatz, akt.hoch, akt.tief, akt.auf]); sitz.push(aktSitz); }
      akt = null;
    }
    for (var i = 0; i < ks.length; i++) {
      var k = ks[i];
      var s = (sitzungJe && sitzungJe[i]) || 'unbekannt';
      var p = periodeMinuten(k[0], s, ivMin);
      if (akt && (p !== akt.zeit || s !== aktSitz)) abschliessen(true);
      if (!akt) {
        akt = { zeit: p, auf: zahl(k[5]) ? k[5] : k[1], zu: k[1],
                hoch: zahl(k[3]) ? k[3] : k[1], tief: zahl(k[4]) ? k[4] : k[1],
                umsatz: zahl(k[2]) ? k[2] : null };
        aktSitz = s;
      } else {
        akt.zu = k[1];
        var h = zahl(k[3]) ? k[3] : k[1], t = zahl(k[4]) ? k[4] : k[1];
        if (h > akt.hoch) akt.hoch = h;
        if (t < akt.tief) akt.tief = t;
        if (zahl(k[2])) akt.umsatz = (akt.umsatz == null ? 0 : akt.umsatz) + k[2];
      }
      letzter = k[0];
    }
    if (akt) abschliessen(letzter != null && (akt.zeit + ivMin * 60000 <= letzter + 60000 ||
                                              istSitzungsEnde(letzter, aktSitz, opt)));
    return { kerzen: aus, sitzungen: sitz, unvollstaendig: unvoll, angeschnitten: angeschnitten };
  }
  /** Aus "Sitzung je Kerze" wieder Bereiche machen - fuer die Antwort der Leseauskunft,
   *  in derselben Form, wie die Alpaca-Dateien sie tragen. */
  function bereicheAus(kerzen, sitzungJe) {
    var aus = [];
    (kerzen || []).forEach(function (k, i) {
      var s = (sitzungJe || [])[i] || 'unbekannt', l = aus[aus.length - 1];
      if (l && l.sitzung === s) { l.bis = k[0]; return; }
      aus.push({ von: k[0], bis: k[0], sitzung: s });
    });
    return aus;
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
    /* Wer die Beschriftung anders schreiben will (Wochentag, anderes Datumsmuster,
     * 12-Stunden-Uhr - alles Einstellungen aus 8b), reicht seine eigene Funktion
     * herein. Die REGEL, WO eine Marke steht, bleibt hier: sie haengt an der Zahl
     * der Kerzen und am Tageswechsel, nicht am Format. Zwei Regeln fuer dieselbe
     * Frage waeren zwei Antworten. */
    var txt = typeof o.text === 'function' ? o.text : achsenText;
    var ziel = o.ziel > 0 ? o.ziel : 6;
    var schritt = Math.max(1, Math.floor(ks.length / ziel));
    /* Zwei Kerzen ist der kleinste Abstand, bei dem zwei Beschriftungen nicht
     * uebereinander liegen - ein Datum direkt neben einer Uhrzeit war genau das. */
    var abstand = Math.max(2, Math.floor(schritt / 2));
    var marken = [];
    var i, j;
    if (!((o.intervallMs || 86400000) < 86400000)) {
      for (i = 0; i < ks.length; i += schritt) {
        marken.push({ i: i, text: txt(ks[i][0], zone, 'tagJahr'), tag: true });
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
      marken.push({ i: w, text: txt(ks[w][0], zone, 'tagKurz'), tag: true });
    });
    /* Danach die Uhrzeiten - aber nur, wo kein Datum steht. */
    for (j = 0; j < ks.length; j += schritt) {
      var belegt = false;
      for (i = 0; i < marken.length; i++) {
        if (Math.abs(marken[i].i - j) < abstand) { belegt = true; break; }
      }
      if (!belegt) marken.push({ i: j, text: txt(ks[j][0], zone, 'uhr'), tag: false });
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
    /* Koerper, Rahmen und Docht je Richtung (Einstellungen aus 8b). Sie stehen NICHT
     * in FARBEN: FARBEN ist der Notnagel dieses Zeichners, die Vorgaben der
     * Einstellungen stehen an EINER anderen Stelle (markt/charteinstellungen.js).
     * Hier wird nur aufgefuellt, was der Aufrufer nicht mitbringt - und zwar aus
     * seiner eigenen Koerperfarbe, nicht aus einer zweiten Farbtabelle. */
    ['auf', 'ab'].forEach(function (r) {
      ['Koerper', 'Rahmen', 'Docht'].forEach(function (teil) {
        f[r + teil] = (o.farben && o.farben[r + teil]) || f[r];
      });
    });
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

    /* (b) Umsatzbalken unter den Kursen. Abschaltbar, weil der Umsatz im Viewer
     *     ein Schalter der Leiste "Einblenden" ist - die Skala behaelt ihren Platz
     *     trotzdem, sonst spraenge das Kursbild beim Umschalten in der Hoehe. */
    ctx.save();
    ctx.fillStyle = f.umsatz;
    var mitUmsatz = 0;
    kerzen.forEach(function (k, i) {
      if (o.umsatz === false) return;
      if (!zahl(k[2]) || k[2] <= 0) return;
      mitUmsatz++;
      var y = sk.volY(k[2]);
      var boden = sk.oben + sk.kursHoehe + sk.volHoehe;
      ctx.fillRect(sk.x(i) - sk.kerzeBreite / 2, y, sk.kerzeBreite, Math.max(1, boden - y));
    });
    ctx.restore();

    /* (c) Der Kursverlauf. VIER DARSTELLUNGEN (Einstellung aus 8b) - und sie sind
     *     nicht dasselbe Bild in anderer Farbe:
     *
     *       kerzen   Koerper, Rahmen, Docht - zeigt Eroeffnung UND Schluss.
     *       balken   OHLC-Balken: Senkrechte Hoch-Tief, Nase links (Eroeffnung),
     *                Nase rechts (Schluss). Bei engen Faechern lesbarer als Kerzen.
     *       linie    nur die Schlusskurse. Was innerhalb der Kerze geschah, wird
     *                dabei WEGGELASSEN - das ist eine Aussage, keine Verzierung.
     *       flaeche  dieselbe Linie mit Fuellung darunter.
     *
     *     DIE FARBE steht in drei Feldern je Richtung (Koerper, Rahmen, Docht), weil
     *     das Vorbild sie einzeln fuehrt. Fehlt eines, gilt die Koerperfarbe - so
     *     zeichnet ein Aufrufer aus Stufe 6, der nur `auf`/`ab` kennt, unveraendert
     *     weiter.
     *
     *     WOGEGEN gefaerbt wird, ist eine Einstellung: gegen die Eroeffnung
     *     DERSELBEN Kerze (Vorgabe) oder gegen den Schluss der VORIGEN
     *     (`nachVortag`). Das sind zwei verschiedene Aussagen: die erste sagt "im
     *     Verlauf dieser Kerze ging es hoch", die zweite "gegenueber dem letzten
     *     Stand ist es hoeher". Die erste Kerze hat keine Vorgaengerin - sie faellt
     *     dann auf die Eroeffnung zurueck, statt eine Vorgaengerin zu erfinden. */
    function farbeVon(k, i, teil) {
      var eroeff = zahl(k[5]) ? k[5] : k[1];
      var bezug = eroeff;
      if (o.nachVortag && i > 0 && kerzeOk(kerzen[i - 1])) bezug = kerzen[i - 1][1];
      var auf = k[1] >= bezug;
      return f[(auf ? 'auf' : 'ab') + teil];
    }
    var darstellung = o.darstellung || 'kerzen';
    var gezeichnet = 0;
    if (darstellung === 'linie' || darstellung === 'flaeche') {
      /* Eine Linie ueber die Schlusskurse. Die Farbe ist die des LETZTEN Schrittes:
       * eine Linie, die je Abschnitt die Farbe wechselte, waere ein Flickenteppich
       * und sagte nichts, was die Kurve nicht schon zeigt. */
      var pfad = [];
      kerzen.forEach(function (k, i) {
        if (!kerzeOk(k)) return;
        gezeichnet++;
        pfad.push({ x: sk.x(i), y: sk.y(k[1]) });
      });
      if (pfad.length) {
        var letzteFarbe = farbeVon(kerzen[kerzen.length - 1], kerzen.length - 1, 'Koerper');
        var boden = sk.oben + sk.kursHoehe;
        ctx.save();
        if (darstellung === 'flaeche') {
          ctx.beginPath();
          ctx.moveTo(pfad[0].x, boden);
          pfad.forEach(function (p) { ctx.lineTo(p.x, p.y); });
          ctx.lineTo(pfad[pfad.length - 1].x, boden);
          ctx.closePath();
          ctx.globalAlpha = 0.18;
          ctx.fillStyle = letzteFarbe;
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        ctx.strokeStyle = letzteFarbe;
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        pfad.forEach(function (p, i) { if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
        ctx.stroke();
        ctx.restore();
      }
    } else {
      kerzen.forEach(function (k, i) {
        if (!kerzeOk(k)) return;
        gezeichnet++;
        var o1 = zahl(k[5]) ? k[5] : k[1];
        var c = k[1];
        var h = zahl(k[3]) ? k[3] : Math.max(o1, c);
        var t = zahl(k[4]) ? k[4] : Math.min(o1, c);
        var x = sk.x(i);
        ctx.save();
        /* Die laufende Kerze gestrichelt: sie ist noch nicht fertig, und das darf
         * man ihr ansehen. */
        if (istLaufend(k)) { ctx.setLineDash([3, 3]); }
        ctx.strokeStyle = farbeVon(k, i, 'Docht');
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x, sk.y(h));
        ctx.lineTo(x, sk.y(t));
        ctx.stroke();
        var yo = sk.y(o1), yc = sk.y(c);
        if (darstellung === 'balken') {
          /* Nasen statt Koerper. Sie sind halb so breit wie ein Kerzenkoerper -
           * links und rechts zusammen ergeben sie dieselbe Breite. */
          var nase = Math.max(1, Math.round(sk.kerzeBreite / 2));
          ctx.strokeStyle = farbeVon(k, i, 'Rahmen');
          ctx.beginPath();
          ctx.moveTo(x - nase, yo); ctx.lineTo(x, yo);
          ctx.moveTo(x, yc); ctx.lineTo(x + nase, yc);
          ctx.stroke();
        } else {
          var oben = Math.min(yo, yc), hoehe = Math.max(1, Math.abs(yc - yo));
          if (istLaufend(k)) {
            ctx.strokeStyle = farbeVon(k, i, 'Rahmen');
            ctx.strokeRect(x - sk.kerzeBreite / 2, oben, sk.kerzeBreite, hoehe);
          } else {
            ctx.fillStyle = farbeVon(k, i, 'Koerper');
            ctx.fillRect(x - sk.kerzeBreite / 2, oben, sk.kerzeBreite, hoehe);
            /* Der Rahmen nur, wenn er sich vom Koerper unterscheidet - sonst
             * malt man dieselbe Farbe zweimal und macht den Koerper einen
             * Bildpunkt breiter, als er ist. */
            var rahmen = farbeVon(k, i, 'Rahmen');
            if (rahmen !== farbeVon(k, i, 'Koerper') && sk.kerzeBreite >= 3) {
              ctx.strokeStyle = rahmen;
              ctx.strokeRect(x - sk.kerzeBreite / 2, oben, sk.kerzeBreite, hoehe);
            }
          }
        }
        ctx.restore();
      });
    }

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

    /* (d2) Die Signal-Marken. Dreieck nach oben unter der Kerze (Kauf), nach unten
     *      darueber (Verkauf) - dieselbe Form wie in der alten Linien-Ansicht, damit
     *      niemand zwei Zeichensprachen lernen muss.
     *
     *      HIER WIRD NICHTS GERECHNET. Die Marken kommen fertig herein; welcher
     *      Detektor sie erzeugt hat und was sein Belegstand ist, entscheidet der
     *      Aufrufer. Ein Zeichner, der Signale selbst faende, waere eine zweite
     *      Rechnung neben der, auf die die Automatik hoert. */
    var marken = 0;
    (o.marken || []).forEach(function (mk) {
      if (!mk || !zahl(mk.index) || mk.index < 0 || mk.index >= kerzen.length) return;
      var kk = kerzen[mk.index];
      if (!kerzeOk(kk)) return;
      marken++;
      var mx = sk.x(mk.index);
      var hoch = zahl(kk[3]) ? kk[3] : kk[1];
      var tief = zahl(kk[4]) ? kk[4] : kk[1];
      var auf = mk.richtung !== 'put';
      var my = auf ? sk.y(tief) + 7 : sk.y(hoch) - 7;
      var s = mk.gewaehlt ? 8 : 6;
      ctx.save();
      ctx.fillStyle = mk.farbe || f.ma20;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx + s, my + (auf ? s + 3 : -s - 3));
      ctx.lineTo(mx - s, my + (auf ? s + 3 : -s - 3));
      ctx.closePath();
      ctx.fill();
      /* Die gewaehlte Marke bekommt eine Senkrechte durch das ganze Bild - auf einem
       * Jahreschart findet man sie sonst nicht wieder. */
      if (mk.gewaehlt) {
        ctx.strokeStyle = mk.farbe || f.ma20;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.moveTo(mx, sk.oben);
        ctx.lineTo(mx, sk.oben + sk.kursHoehe + sk.volHoehe);
        ctx.stroke();
      }
      ctx.restore();
    });

    /* (d3) Die waagerechten Linien: Kurslinie des Symbols, Vor-/Nachboersenkurs,
     *      Hoch und Tief des Zeitraums. Alle drei sind Schalter aus 8b, alle drei
     *      kommen als WERT herein - dieser Zeichner sucht sich keinen Kurs.
     *
     *      Der Vor-/Nachboersenkurs stammt aus den Quotes (Stufe 6), nicht aus den
     *      Kerzen: er liegt gerade ausserhalb der Sitzung und hat deshalb oft noch
     *      gar keine Kerze. Fehlt er, wird nichts gezeichnet - eine Linie auf dem
     *      letzten Schluss waere eine Behauptung ueber einen Handel, den es nicht
     *      gab. */
    var querlinien = 0;
    function quer(wert, farbe, muster, breit) {
      if (!zahl(wert)) return;
      var y = sk.y(wert);
      if (!zahl(y) || y < sk.oben - 1 || y > sk.oben + sk.kursHoehe + 1) return;
      querlinien++;
      ctx.save();
      ctx.strokeStyle = farbe;
      ctx.lineWidth = breit || 1;
      if (muster && muster.length) ctx.setLineDash(muster);
      ctx.beginPath();
      ctx.moveTo(sk.links, y);
      ctx.lineTo(sk.breite - sk.rechts, y);
      ctx.stroke();
      ctx.restore();
    }
    if (o.kurslinie && zahl(o.kurslinie.wert)) {
      quer(o.kurslinie.wert, o.kurslinie.farbe || f.kreuz, o.kurslinie.muster, 1.2);
    }
    if (o.ausserboerslichLinie && zahl(o.ausserboerslichLinie.wert)) {
      quer(o.ausserboerslichLinie.wert, o.ausserboerslichLinie.farbe || f.kreuz, [2, 4], 1);
    }
    if (o.hochTief) {
      quer(sk.hoch, f.kreuz, [1, 4], 1);
      quer(sk.tief, f.kreuz, [1, 4], 1);
    }

    /* (d4) Ereignis-Marken: Dividende, Split, Quartalszahlen, Nachricht.
     *
     *      Sie sitzen UNTER dem Kursbild am Rand der Umsatzflaeche, nicht auf den
     *      Kerzen: dort sitzen schon die Signal-Marken, und zwei Zeichensprachen
     *      auf demselben Platz sind keine. Auch hier wird nichts gerechnet - was
     *      eine Dividende ist und wann sie war, sagt die Massnahmen-Datei.
     *
     *      Der Buchstabe steht IM Kaestchen (D/S/E/N); der ganze Text haengt am
     *      Tooltip, den der Aufrufer aus derselben Liste baut. */
    var ereignisse = 0;
    (o.ereignisse || []).forEach(function (ev) {
      if (!ev || !zahl(ev.index) || ev.index < 0 || ev.index >= kerzen.length) return;
      ereignisse++;
      var ex = sk.x(ev.index);
      var ey = sk.oben + sk.kursHoehe + sk.volHoehe - 6;
      ctx.save();
      if (ev.linie) {
        ctx.strokeStyle = f.kreuz;
        ctx.setLineDash([2, 4]);
        ctx.beginPath();
        ctx.moveTo(ex, sk.oben);
        ctx.lineTo(ex, ey - 6);
        ctx.stroke();
        ctx.setLineDash([]);
      }
      ctx.fillStyle = ev.farbe || f.kreuz;
      ctx.beginPath();
      ctx.arc(ex, ey, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = f.text;
      ctx.font = '9px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(String(ev.kurz || '?').slice(0, 1), ex, ey + 3);
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
    return { kerzen: gezeichnet, baender: bs.length, linien: linien, mitUmsatz: mitUmsatz,
             marken: marken, darstellung: darstellung, querlinien: querlinien, ereignisse: ereignisse };
  }

  /* ---------------------------------------------------------------------------
   * 7) Die Indikator-Spur unter dem Chart
   *
   * RSI gehoert nicht in die Kursskala: er laeuft zwischen 0 und 100, der Kurs bei
   * 300 - in einem Bild waere eine der beiden Linien immer platt am Rand. Deshalb
   * eine eigene Flaeche mit eigener Skala, aber DERSELBEN x-Achse: sonst stehen
   * Kerze und Indikator nicht uebereinander, und genau darauf sieht man hin.
   *
   * Gerechnet wird der RSI hier nicht - er kommt als Reihe herein, aus window.Quant,
   * wie die gleitenden Durchschnitte auch. */
  function spurZeichnen(ctx, werte, masse, opt) {
    if (!ctx || !werte || !werte.length) return { punkte: 0 };
    var m = masse || {}, o = opt || {};
    var breite = m.breite > 0 ? m.breite : 900;
    var hoehe = m.hoehe > 0 ? m.hoehe : 90;
    var links = m.links >= 0 ? m.links : 8;
    var rechts = m.rechts >= 0 ? m.rechts : 64;
    var oben = m.oben >= 0 ? m.oben : 6;
    var unten = m.unten >= 0 ? m.unten : 6;
    var lo = zahl(o.tief) ? o.tief : 0;
    var hi = zahl(o.hoch) ? o.hoch : 100;
    var feldB = Math.max(1, breite - links - rechts);
    var feldH = Math.max(1, hoehe - oben - unten);
    var dx = feldB / werte.length;
    var f = o.farben || {};
    function X(i) { return links + (i + 0.5) * dx; }
    function Y(v) { return oben + (hi - v) / (hi - lo) * feldH; }
    ctx.clearRect(0, 0, breite, hoehe);
    /* Die Schwellen zuerst - sie sind der Massstab, an dem man die Linie liest. */
    ctx.save();
    ctx.strokeStyle = f.gitter || FARBEN.gitter;
    ctx.setLineDash([3, 3]);
    (o.schwellen || []).forEach(function (s) {
      if (!zahl(s)) return;
      ctx.beginPath();
      ctx.moveTo(links, Y(s));
      ctx.lineTo(breite - rechts, Y(s));
      ctx.stroke();
    });
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = o.farbe || f.ma20 || FARBEN.ma20;
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    var offen = false, punkte = 0;
    werte.forEach(function (v, i) {
      if (!zahl(v)) { offen = false; return; }
      punkte++;
      if (!offen) { ctx.moveTo(X(i), Y(v)); offen = true; }
      else ctx.lineTo(X(i), Y(v));
    });
    ctx.stroke();
    ctx.restore();
    /* Beschriftung an derselben Kante wie die Kursachse, damit die Augen eine
     * Spalte lesen und nicht zwei. */
    ctx.save();
    ctx.fillStyle = f.text || FARBEN.text;
    ctx.font = '10px system-ui, sans-serif';
    /* Die Zahlen an der Skala sind abschaltbar (Einstellung "Indikatorwerte an der
     * Skala", 8b). Die LINIEN bleiben: sie sind die Struktur des Indikators - eine
     * RSI-Spur ohne die 30er- und 70er-Marke waere eine andere Anzeige, keine
     * aufgeraeumte. Weg gehen nur die Zahlen daneben. Der NAME der Spur bleibt
     * ebenfalls stehen; eine unbeschriftete Kurve unter dem Chart ist ein Raetsel. */
    var beschriftet = 0;
    if (o.beschriftung !== false) {
      (o.schwellen || []).forEach(function (s) {
        if (!zahl(s)) return;
        beschriftet++;
        ctx.fillText(String(s), breite - rechts + 4, Y(s) + 3);
      });
    }
    if (o.name) ctx.fillText(String(o.name), links + 2, oben + 10);
    ctx.restore();
    return { punkte: punkte, schwellen: (o.schwellen || []).length, beschriftet: beschriftet };
  }

  var KerzenChart = {
    INTERVALL_MS: INTERVALL_MS,
    ARCHIV_INTERVALL: ARCHIV_INTERVALL,
    YAHOO_INTERVALL: YAHOO_INTERVALL,
    AUS_TAGESKERZEN: AUS_TAGESKERZEN,
    ZEITRAHMEN: ZEITRAHMEN,
    ZEITRAEUME: ZEITRAEUME,
    KERZEN: KERZEN,
    VORGABE: VORGABE,
    HANDELSTAGE: HANDELSTAGE,
    KERZEN_JE_TAG: KERZEN_JE_TAG,
    KERZEN_MIN: KERZEN_MIN,
    KERZEN_MAX: KERZEN_MAX,
    ZOOM_SCHRITT: ZOOM_SCHRITT,
    ZOOM_MIN: ZOOM_MIN,
    kerzenZahl: kerzenZahl,
    paarUrteil: paarUrteil,
    kerzeFuer: kerzeFuer,
    fensterAbVon: fensterAbVon,
    radZoom: radZoom,
    blaettern: blaettern,
    abschnittSchluessel: abschnittSchluessel,
    verdichten: verdichten,
    MINUTEN_VERDICHTUNG: MINUTEN_VERDICHTUNG,
    periodeMinuten: periodeMinuten,
    verdichtenMinuten: verdichtenMinuten,
    bereicheAus: bereicheAus,
    spurZeichnen: spurZeichnen,
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
