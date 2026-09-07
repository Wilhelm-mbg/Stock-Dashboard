'use strict';
/* LIVE-SAMMLER: die fertigen SIP-Minutenbalken waehrend der Sitzung ins Archiv.
 *
 * Die Vollsammlung (tools/alpaca-vollsammlung.js) hat 2016 bis heute geholt und ist
 * fertig. Was sie NICHT kann: waehrend des Handelstages weiterlaufen. Jeder Tag, der
 * seitdem vergeht, fehlt dem Minutenarchiv, bis jemand von Hand einen Nachlauf
 * startet. Dieses Modul schliesst genau diese Luecke - alle fuenf Minuten ein Umlauf,
 * der anhaengt, was inzwischen fertig geworden ist.
 *
 * WARUM ES EIN EIGENES MODUL IST UND NICHT IM WERKZEUG STEHT: tools/ wird nicht
 * mitgeliefert (package.json, "files" nennt nur *.js und markt/*.js). Ein main.js,
 * das tools/alpaca-vollsammlung.js verlangt, laeuft in der Entwicklung und stirbt im
 * Installer. Die Regeln stehen deshalb hier, in der Wurzel - und hier haengen sie an
 * nichts: kein Electron, kein Netz, keine Platte. Der Test spielt einen ganzen
 * Handelstag in Millisekunden durch.
 *
 * ============================ DIE VIER REGELN ============================
 *
 * (1) NUR SIP, UND NUR WAS FERTIG IST. Gemessen am 04.09.2026 (wiki/datenquellen.md):
 *     der Gratis-Tarif liefert SIP-Balken mit exakt 15 Minuten Abstand und weist eine
 *     Anfrage, die naeher herankommt, KOMPLETT ab - HTTP 403 "subscription does not
 *     permit querying recent SIP data", nicht etwa "die letzten Balken fehlen". Ein
 *     zu junges `end` macht den ganzen Umlauf wertlos. Der Abstand steht deshalb auf
 *     16 Minuten: die gemessenen 15,03-15,13 plus eine Minute Luft fuer eine Uhr, die
 *     nachgeht.
 *
 *     IEX waere eine Minute alt und ist trotzdem verboten. Derselbe Messtag: 35 bis 52
 *     von 75 moeglichen Balken, und der Umsatz ist der des IEX allein. Ins Archiv kaeme
 *     eine Reihe, die aussieht wie die der Vollsammlung und es nicht ist - der
 *     schlimmste Fall, weil ihn danach niemand mehr sieht. IEX taugt fuer die laufende
 *     Anzeige im Viewer, nie fuer die Platte.
 *
 * (2) ANHAENGEN, NICHT UEBERSCHREIBEN - und die Abweichungen ZAEHLEN. Ob Alpaca einen
 *     SIP-Balken nach 15 Minuten noch nachtraeglich aendert (spaete Meldungen), ist
 *     NICHT gemessen (wiki/datenquellen.md, ausdruecklich). Solange das offen ist,
 *     darf ein zweiter Abruf keine Kerze auf der Platte ersetzen: eine Reihe, die
 *     sich unter der Messung aendert, ist wandernder Grund.
 *
 *     Also fragt jeder Umlauf die letzten NACHPRUEF_MS (30 Minuten) MIT ab - Balken,
 *     die laengst in der Datei stehen -, vergleicht sie Feld fuer Feld und ZAEHLT,
 *     was abweicht. Geschrieben wird nur, was neu ist. Nach ein paar Handelstagen
 *     sagt der Zaehler, ob "append-only ab 15 min" traegt. Steht er auf 0, ist die
 *     Regel belegt statt angenommen; steht er nicht auf 0, weiss man es, BEVOR eine
 *     Studie darauf gerechnet hat.
 *
 * (3) DIE SPERRE IST GETEILT. Das Archiv alpaca1m/ hat mit dem taeglichen Nachlauf
 *     (--nachholen, Auftrag Nr. 6) einen zweiten Schreiber. Zwei Schreiber auf
 *     derselben Jahresdatei heisst: einer liest, der andere schreibt, der erste
 *     schreibt seinen alten Stand zurueck - und die Datei sieht danach gesund aus.
 *     Beide nehmen deshalb dieselbe Sperre, die von kerzenquelle.js (_laeuft.json im
 *     Archivordner, mit Prozessnummer und Verwaisungsfrist).
 *
 * (4) DER DECKEL GILT DEM GANZEN ZUGANG. Alpaca laesst 200 Anfragen je Minute zu, und
 *     zwar fuer den Schluessel, nicht fuer das Werkzeug: kosten.js misst Spannen,
 *     der Nachlauf laeuft mit 170. Der Live-Sammler nimmt 150 und buendelt Werte -
 *     /v2/stocks/bars nimmt viele Kuerzel in EINER Anfrage. 500 Werte kosten damit
 *     fuenf Anfragen je Umlauf, nicht 500.
 *
 * WAS HIER NICHT PASSIERT: es wird nicht gehandelt, nicht gemessen und nichts
 * entschieden, was eine Strategie sieht. Die Strategien bleiben auf Yahoo (Entscheid
 * Z2, wiki/archiv-zusammenfuehrung.md) - dieses Modul fuellt ein Archiv, sonst nichts.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {

  /* ---------------------------------------------------------------------------
   * 1) Die Zahlen, und woher jede kommt
   * ------------------------------------------------------------------------- */

  /** Abstand zweier Umlaeufe. Fuenf Minuten, weil ein Umlauf rund 5 Balken je Wert
   *  holt und die Quelle bis 10.000 Balken je Seite liefert - haeufiger waere mehr
   *  Verkehr fuer dieselbe Ware. */
  var TAKT_MS = 5 * 60000;

  /** Wie weit der Abruf hinter der Uhr bleibt. 15 Minuten sind die Sperre der Quelle
   *  (gemessen 04.09.2026: 15,03 / 15,07 / 15,10 / 15,13 min), die 16. Minute ist die
   *  Luft. Wer hier 15 hinschreibt, faengt sich an einer um Sekunden nachgehenden Uhr
   *  ein HTTP 403 auf den GANZEN Umlauf. */
  var SIP_VERZUG_MS = 16 * 60000;

  /** Wie weit jeder Umlauf ZURUECK mitfragt, um Nachkorrekturen zu sehen (Regel 2). */
  var NACHPRUEF_MS = 30 * 60000;

  /** Anfragen je Minute, die dieser Sammler hoechstens stellt. 200 laesst die Quelle
   *  zu - fuer den ganzen Zugang. 150 laesst kosten.js und dem Nachlauf Luft. */
  var DECKEL_JE_MIN = 150;

  /** Kuerzel je Anfrage. /v2/stocks/bars nimmt viele; `limit` gilt je AUFRUF, nicht
   *  je Symbol (wiki/datenquellen.md) - 100 Werte a ~35 Minutenbalken sind 3.500
   *  Balken und damit weit unter der Seitengrenze von 10.000. */
  var BUENDEL_GROESSE = 100;

  /** Ein Wert, der noch keine Jahresdatei hat, bekommt nicht die ganze Historie
   *  nachgeholt - das ist die Aufgabe der Vollsammlung und des Nachlaufs. Der
   *  Live-Sammler steigt hoechstens diese Spanne zurueck ein: eine Sitzung. */
  var ERSTFENSTER_MS = 6 * 3600000;

  /** Wie weit ein einzelner Umlauf hoechstens zurueckgreift. Der Live-Sammler ist
   *  fuer LIVE da; eine Reihe, die seit Tagen still steht, ist eine Luecke und
   *  gehoert dem naechtlichen Nachlauf (--nachholen, Auftrag Nr. 6). Ohne diesen
   *  Deckel risse ein einziger seit Wochen unbelieferter Wert das Fenster fuer das
   *  ganze Buendel auf - und aus fuenf Anfragen wuerden fuenfhundert. */
  var RUNDE_MAX_MS = 6 * 3600000;

  /** Wie viele Werte mit einer echten Luecke ein Umlauf mitnimmt. Der Rest wartet
   *  fuenf Minuten. So kostet ein Tag, an dem die App lange aus war, viele billige
   *  Umlaeufe statt eines sehr teuren - und der laufende Handel bleibt vorn. */
  var LUECKE_JE_RUNDE = 25;

  /** Wie viele Werte ein Umlauf hoechstens anfasst. Der Deckel ist nicht der
   *  Engpass (500 Werte = 5 Anfragen), sondern die Schreibarbeit: jeder Wert ist
   *  eine Jahresdatei, die gelesen und zurueckgeschrieben wird. */
  var WERTE_DECKEL = 600;

  /* ---------------------------------------------------------------------------
   * 2) Zeit
   * ------------------------------------------------------------------------- */

  var NY = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/New_York',
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  });
  function nyTeile(ms) {
    var t = {};
    NY.formatToParts(new Date(ms)).forEach(function (p) { t[p.type] = p.value; });
    return { j: +t.year, m: +t.month, d: +t.day, h: (+t.hour) % 24, min: +t.minute };
  }
  /** Der ET-Kalendertag eines Stempels als 'JJJJ-MM-TT'. */
  function etTag(ms) {
    var p = nyTeile(ms);
    return p.j + '-' + String(p.m).padStart(2, '0') + '-' + String(p.d).padStart(2, '0');
  }
  /** UTC-Millisekunden zu einer Wanduhrzeit in New York. Zwei Durchgaenge, weil der
   *  erste Schaetzwert an einem Sommerzeitwechsel eine Stunde daneben liegen kann.
   *  Dieselbe Rechnung wie tools/archiv-migration.js nyNachUtc() - sie steht hier
   *  ein zweites Mal, weil tools/ nicht mitgeliefert wird (siehe Kopf). */
  function nyNachUtc(j, m, d, h, min) {
    var soll = Date.UTC(j, m - 1, d, h, min);
    var guess = soll;
    for (var i = 0; i < 2; i++) {
      var p = nyTeile(guess);
      var wand = Date.UTC(p.j, p.m - 1, p.d, p.h, p.min);
      if (wand === soll) return guess;
      guess += soll - wand;
    }
    return guess;
  }

  /** Auf die volle Minute abrunden. Balkenstempel liegen auf der Minute; ein Fenster,
   *  das mitten in einer Minute endet, fragt eine halbe Kerze an. */
  function minuteAb(ms) { return Math.floor(ms / 60000) * 60000; }

  /* ---------------------------------------------------------------------------
   * 3) Das Fenster eines Umlaufs
   * ------------------------------------------------------------------------- */

  /** Was dieser Umlauf anfragt.
   *
   *  `bis`  ist immer jetzt minus SIP_VERZUG_MS, auf die Minute abgerundet - naeher
   *         heran weist die Quelle die GANZE Anfrage ab (Regel 1).
   *  `von`  ist der Stempel nach der juengsten Kerze, die schon in der Datei steht -
   *         aber hoechstens NACHPRUEF_MS vor `bis`, damit jeder Umlauf die halbe
   *         Stunde davor noch einmal sieht (Regel 2). Ohne Datei: ERSTFENSTER_MS.
   *
   *  `leer` sagt, dass es nichts zu holen gibt (die Datei ist schon so weit) - dann
   *         wird nicht abgefragt. Ohne dieses Feld stellte ein Sammler an einem
   *         Feiertag alle fuenf Minuten dieselbe leere Frage.
   */
  function fenster(letzterStempel, jetzt, opt) {
    opt = opt || {};
    var verzug = opt.verzug != null ? opt.verzug : SIP_VERZUG_MS;
    var nachpruef = opt.nachpruef != null ? opt.nachpruef : NACHPRUEF_MS;
    var bis = minuteAb((jetzt || 0) - verzug);
    var hat = typeof letzterStempel === 'number' && isFinite(letzterStempel) && letzterStempel > 0;
    var ab = hat ? letzterStempel + 60000 : bis - (opt.erstfenster != null ? opt.erstfenster : ERSTFENSTER_MS);
    /* Die Nachpruefung zieht den Anfang zurueck, nie nach vorn: bei einer Reihe, die
     * seit Tagen still steht, bleibt der weit zurueckliegende Anfang stehen. */
    var von = Math.min(ab, bis - nachpruef);
    if (!hat) von = ab;
    /* LEER HEISST "KEINE NEUE MINUTE", NICHT "KEIN FENSTER".
     *
     * Hier stand zuerst `bis < von` - und das konnte NIE eintreten: von wird durch
     * die Nachpruefung immer auf bis-30min zurueckgezogen, liegt also stets vor bis.
     * Ein Merker, der nie anschlaegt, ist keine Sicherung, sondern eine Behauptung;
     * die Zusicherung 83.6 hat ihn gefunden, bevor er in Betrieb ging.
     *
     * Gemeint war: die Reihe hat schon alles, was fertig ist. Dann bringt ein Abruf
     * keinen einzigen neuen Balken - nur die Nachpruefung, und die lohnt sich nicht
     * alle fuenf Minuten fuer eine Reihe, an der sich nichts mehr bewegt. Solange
     * neue Minuten kommen (also waehrend des Handels), laeuft sie ohnehin mit. */
    return { von: von, bis: bis, leer: hat && letzterStempel >= bis,
             nachgeprueft: hat && ab > von };
  }

  /** Ist ein Umlauf faellig? Der Takt haengt am letzten LAUF, nicht an der vollen
   *  Minute - sonst holte ein Neustart um 10:04:59 zwei Umlaeufe in zwei Sekunden. */
  function faellig(letzterLauf, jetzt, takt) {
    takt = takt != null ? takt : TAKT_MS;
    if (!(typeof letzterLauf === 'number' && isFinite(letzterLauf) && letzterLauf > 0)) return true;
    return (jetzt - letzterLauf) >= takt;
  }

  /* ---------------------------------------------------------------------------
   * 4) Welche Werte
   * ------------------------------------------------------------------------- */

  /** Die Werte eines Umlaufs, in der Reihenfolge ihrer Dringlichkeit.
   *
   *  Die Reihenfolge ist der Deckel: was hinten steht, faellt zuerst weg. Positionen
   *  zuerst, weil dort Geld liegt; dann der Wert, den Wilhelm gerade IM VIEWER offen
   *  hat (er sieht sofort, ob etwas fehlt); dann die Merkliste; zuletzt top500.
   *
   *  Doppelte fallen heraus, und zwar unter Beibehaltung des ERSTEN Vorkommens - ein
   *  Wert, der zugleich Position und in top500 ist, zaehlt als Position.
   */
  function werteliste(quellen, deckel) {
    quellen = quellen || {};
    deckel = deckel != null ? deckel : WERTE_DECKEL;
    var reihen = [quellen.positionen, quellen.viewer, quellen.watchlist, quellen.top500];
    var gesehen = {}, aus = [];
    reihen.forEach(function (r) {
      (Array.isArray(r) ? r : (r ? [r] : [])).forEach(function (s) {
        var sym = String(s == null ? '' : s).toUpperCase().trim();
        if (!sym || gesehen[sym]) return;
        /* Krypto fuehrt dieses Archiv nicht (die Vollsammlung sammelt "ohne Krypto"),
         * und ein Kuerzel mit Zeichen, die kein US-Papier traegt, ist ein Tippfehler
         * und keine Anfrage wert. */
        if (!/^[A-Z][A-Z0-9.]{0,11}$/.test(sym)) return;
        gesehen[sym] = 1;
        aus.push(sym);
      });
    });
    return aus.slice(0, deckel);
  }

  /** Die Werte eines Umlaufs nach ihrem Fenster in Gruppen legen.
   *
   *  WARUM NICHT EIN FENSTER FUER ALLE: /v2/stocks/bars nimmt viele Kuerzel, aber nur
   *  EINEN Zeitraum. Nimmt man den weitesten, den irgendein Wert braucht, zahlen ihn
   *  alle - ein seit drei Wochen stiller Wert machte aus dem 30-Minuten-Fenster ein
   *  Drei-Wochen-Fenster fuer fuenfhundert Werte. Das ist der Kopf der Schlange, der
   *  nie fertig wird (wiki/fehlerformen.md), nur andersherum: nicht einer blockiert
   *  alle, sondern einer verteuert alle.
   *
   *  Es gibt darum genau zwei Gruppen und einen Rest:
   *    frisch  - die Reihe ist auf dem Stand. Fenster: die letzten NACHPRUEF_MS.
   *              Das ist der Normalfall und kostet ein Buendel je 100 Werte.
   *    luecke  - die Reihe hat eine echte Luecke, aber hoechstens RUNDE_MAX_MS.
   *              Fenster: vom aeltesten Bedarf dieser Gruppe bis `bis`. Hoechstens
   *              LUECKE_JE_RUNDE Werte, die aeltesten zuerst.
   *    zurueckgestellt - alles darueber. Der naechtliche Nachlauf holt es; hier
   *              wird es GENANNT und nicht stillschweigend uebergangen.
   */
  function gruppieren(symbole, stempel, jetzt, opt) {
    opt = opt || {};
    stempel = stempel || {};
    var nachpruef = opt.nachpruef != null ? opt.nachpruef : NACHPRUEF_MS;
    var rundeMax = opt.rundeMax != null ? opt.rundeMax : RUNDE_MAX_MS;
    var jeRunde = opt.jeRunde != null ? opt.jeRunde : LUECKE_JE_RUNDE;
    var bis = minuteAb(jetzt - (opt.verzug != null ? opt.verzug : SIP_VERZUG_MS));
    var frisch = [], luecke = [], zurueck = [], leer = [];
    (symbole || []).forEach(function (sym) {
      var f = fenster(stempel[sym], jetzt, opt);
      if (f.leer) { leer.push(sym); return; }
      if (f.von >= bis - nachpruef) frisch.push(sym);
      else if (f.von >= bis - rundeMax) luecke.push({ sym: sym, von: f.von });
      else zurueck.push(sym);
    });
    luecke.sort(function (a, b) { return a.von - b.von; });
    var nehmen = luecke.slice(0, jeRunde);
    luecke.slice(jeRunde).forEach(function (x) { zurueck.push(x.sym); });
    var gruppen = [];
    if (frisch.length) gruppen.push({ art: 'frisch', von: bis - nachpruef, bis: bis, symbole: frisch });
    if (nehmen.length) {
      gruppen.push({ art: 'luecke', von: nehmen[0].von, bis: bis,
                     symbole: nehmen.map(function (x) { return x.sym; }) });
    }
    return { gruppen: gruppen, zurueckgestellt: zurueck, leer: leer, bis: bis };
  }

  /** Kuerzel zu Anfragen buendeln. */
  function buendeln(symbole, groesse) {
    groesse = Math.max(1, groesse || BUENDEL_GROESSE);
    var aus = [];
    for (var i = 0; i < symbole.length; i += groesse) aus.push(symbole.slice(i, i + groesse));
    return aus;
  }

  /** Der Plan eines Umlaufs - und ob er unter dem Deckel bleibt.
   *
   *  `seiten` ist die ANNAHME, wie viele Folgeseiten ein Buendel kosten kann; sie geht
   *  in die Rechnung ein, damit der Deckel nicht erst dann faellt, wenn die Quelle
   *  blaettert. Die Zahl ist grosszuegig: bei 100 Werten und einem 46-Minuten-Fenster
   *  stehen rund 4.600 Balken gegen eine Seitengrenze von 10.000. */
  function planen(werte, opt) {
    opt = opt || {};
    var b = buendeln(werte, opt.buendel || BUENDEL_GROESSE);
    var seiten = opt.seiten != null ? opt.seiten : 2;
    var abrufe = b.length * seiten;
    var deckel = opt.deckel != null ? opt.deckel : DECKEL_JE_MIN;
    return {
      buendel: b, werte: werte.length, abrufe: abrufe, deckel: deckel,
      /* Ein Umlauf verteilt sich ueber TAKT_MS - die Anfragen fallen aber alle am
       * Anfang an. Gerechnet wird deshalb gegen die MINUTE, nicht gegen den Takt. */
      passt: abrufe <= deckel,
    };
  }

  /* ---------------------------------------------------------------------------
   * 5) Balken annehmen
   * ------------------------------------------------------------------------- */

  function kursOk(x) { return typeof x === 'number' && isFinite(x) && x > 0; }

  /** Alpaca-Balken -> Archivkerze [zeit, schluss, umsatz, hoch, tief, eroeffnung].
   *  Dieselbe Form und dieselbe Pruefung wie in der Vollsammlung; ein Stempel, der
   *  nicht auf der vollen Minute liegt, ist keine Minutenkerze. */
  function kerzeAus(b) {
    var t = Date.parse(b && b.t);
    if (!isFinite(t) || new Date(t).getUTCSeconds() !== 0 || new Date(t).getUTCMilliseconds() !== 0) return null;
    if (!kursOk(b.c) || !kursOk(b.h) || !kursOk(b.l) || !kursOk(b.o)) return null;
    var v = typeof b.v === 'number' && isFinite(b.v) && b.v >= 0 ? b.v : 0;
    return [t, b.c, v, b.h, b.l, b.o];
  }

  /** Die iex-Falle, hier gegen SIP gerichtet: eine Schnittstelle, die lieber
   *  irgendetwas antwortet als nichts (wiki/datenquellen.md). Was ausserhalb des
   *  ANGEFRAGTEN Fensters liegt, faellt heraus und wird gezaehlt - nicht behalten. */
  function imFenster(kerzen, von, bis) {
    var drin = [], draussen = 0;
    (kerzen || []).forEach(function (k) {
      if (k[0] >= von && k[0] <= bis) drin.push(k); else draussen++;
    });
    return { drin: drin, draussen: draussen };
  }

  /* ---------------------------------------------------------------------------
   * 6) Einordnen: was ist neu, was hat sich geaendert
   * ------------------------------------------------------------------------- */

  /** Welche Felder zweier Kerzen desselben Stempels auseinandergehen.
   *  Verglichen wird EXAKT. Beide Zahlen kommen aus derselben Quelle durch dieselbe
   *  JSON-Zerlegung; eine Toleranz wuerde genau das verschweigen, was gemessen werden
   *  soll. Der Stempel [0] ist der Schluessel und steht nicht zur Debatte. */
  var FELDNAME = ['zeit', 'schluss', 'umsatz', 'hoch', 'tief', 'eroeffnung'];
  function unterschied(a, b) {
    var aus = [];
    for (var i = 1; i < 6; i++) if (a[i] !== b[i]) aus.push(FELDNAME[i]);
    return aus;
  }

  /** Frische Balken gegen den Bestand halten.
   *
   *  DAS ERGEBNIS IST DREIGETEILT, und die Dreiteilung ist der ganze Zweck:
   *    dazu       - Stempel, die es noch nicht gibt. NUR die werden geschrieben.
   *    gleich     - Stempel, die es gibt und die Feld fuer Feld uebereinstimmen.
   *    abweichend - Stempel, die es gibt und die sich geaendert haben. Sie werden
   *                 GEZAEHLT und NICHT angewandt (Regel 2 im Kopf).
   *
   *  Ein Sammler, der einfach ueberschreibt, haette dieselbe Datei und keine Antwort
   *  auf die Frage, ob die Quelle nachtraeglich korrigiert. */
  function einordnen(alt, neu) {
    var karte = {};
    (alt || []).forEach(function (k) { karte[k[0]] = k; });
    var dazu = [], gleich = 0, abweichend = [];
    (neu || []).forEach(function (k) {
      var a = karte[k[0]];
      if (!a) { dazu.push(k); return; }
      var f = unterschied(a, k);
      if (f.length) abweichend.push({ zeit: k[0], felder: f, alt: a, neu: k });
      else gleich++;
    });
    dazu.sort(function (x, y) { return x[0] - y[0]; });
    return { dazu: dazu, gleich: gleich, abweichend: abweichend };
  }

  /** Bestand und Neue zu einer Reihe - aufsteigend, ohne Doppelte.
   *  Der Bestand gewinnt bei gemeinsamem Stempel; das ist die andere Seite von
   *  einordnen(): was dort als `abweichend` gezaehlt wurde, aendert die Datei nicht. */
  function anhaengen(alt, dazu) {
    var karte = {};
    (dazu || []).forEach(function (k) { karte[k[0]] = k; });
    (alt || []).forEach(function (k) { karte[k[0]] = k; });
    return Object.keys(karte).map(Number).sort(function (a, b) { return a - b; })
      .map(function (ms) { return karte[ms]; });
  }

  /* ---------------------------------------------------------------------------
   * 7) Sitzungen
   * ------------------------------------------------------------------------- */

  /** Sitzungsgrenzen aus dem Kalender der QUELLE (alpaca1m/_kalender.json, von der
   *  Vollsammlung geschrieben). Er kennt Halbtage mit ihrem eigenen `close` und auch
   *  eine ungeplante Schliessung, von der ein gerechneter Kalender nichts weiss. */
  function grenzenAusKalender(kal) {
    var merk = {};
    return function (tagEt) {
      if (merk[tagEt] !== undefined) return merk[tagEt];
      var e = kal && kal[tagEt];
      if (!e || !e.open || !e.close) return (merk[tagEt] = null);
      var p = tagEt.split('-').map(Number), o = e.open.split(':').map(Number), c = e.close.split(':').map(Number);
      return (merk[tagEt] = { auf: nyNachUtc(p[0], p[1], p[2], o[0], o[1]),
                              zu: nyNachUtc(p[0], p[1], p[2], c[0], c[1]) });
    };
  }

  /** Ersatzweise aus boerse.js. Das ist der RUECKFALL, nicht die erste Wahl: er
   *  rechnet Feiertage und Halbtage aus Regeln, und eine ungeplante Schliessung steht
   *  in keiner Regel. Welcher von beiden gegriffen hat, steht im Ergebnis des Umlaufs -
   *  sonst waere hinterher nicht zu sagen, worauf eine Sitzungsmarke beruht. */
  function grenzenAusBoerse(Boerse) {
    var merk = {};
    return function (tagEt) {
      if (merk[tagEt] !== undefined) return merk[tagEt];
      var p = tagEt.split('-').map(Number);
      var tag = Date.UTC(p[0], p[1] - 1, p[2]);
      if (!Boerse || !Boerse.istHandelstag(tag)) return (merk[tagEt] = null);
      var halb = !!(Boerse.halbtagAn && Boerse.halbtagAn(tag));
      return (merk[tagEt] = { auf: nyNachUtc(p[0], p[1], p[2], 9, 30),
                              zu: nyNachUtc(p[0], p[1], p[2], halb ? 13 : 16, 0) });
    };
  }

  /** Sitzung je Kerze. `grenzenFuer` ist eine der beiden Auskuenfte oben.
   *  'ausserhalb' ist eine BENANNTE Abweichung, keine Notluege: ein Balken an einem
   *  Tag, den der Kalender nicht als Handelstag fuehrt, wird behalten und benannt -
   *  ihn 'regulaer' zu nennen waere eine Behauptung ueber eine Sitzung, die es nicht
   *  gab. Dieselbe Regel wie in der Vollsammlung. */
  function sitzungJeKerze(kerzen, grenzenFuer) {
    return (kerzen || []).map(function (k) {
      var g = grenzenFuer(etTag(k[0]));
      if (!g) return 'ausserhalb';
      if (k[0] < g.auf) return 'vor';
      if (k[0] >= g.zu) return 'nach';
      return 'regulaer';
    });
  }

  /** Aus "jede Kerze hat eine Sitzung" wieder Bereiche machen. */
  function sitzungenVerdichten(serie, jeKerze) {
    var aus = [];
    for (var i = 0; i < (serie || []).length; i++) {
      var s = jeKerze[i], l = aus[aus.length - 1];
      if (l && l.sitzung === s) { l.bis = serie[i][0]; continue; }
      aus.push({ von: serie[i][0], bis: serie[i][0], sitzung: s });
    }
    return aus;
  }

  /** Die Sitzungsbereiche einer Datei um die neu angehaengten fortschreiben.
   *
   *  Das Naheliegende waere, die Bereiche ueber die GANZE Reihe neu zu rechnen. Das
   *  ginge nicht: der Kalender reicht nur so weit zurueck, wie ihn die Vollsammlung
   *  geholt hat, und eine Kerze von 2016 bekaeme dann 'ausserhalb' - eine stille
   *  Verschlechterung von Daten, die schon richtig markiert sind. Fortgeschrieben
   *  wird deshalb nur der Schwanz, und der letzte alte Bereich waechst mit, wenn er
   *  dieselbe Sitzung traegt. */
  function sitzungenFortschreiben(alteBereiche, neueBereiche) {
    var aus = (alteBereiche || []).map(function (b) { return { von: b.von, bis: b.bis, sitzung: b.sitzung }; });
    (neueBereiche || []).forEach(function (n) {
      var l = aus[aus.length - 1];
      if (l && l.sitzung === n.sitzung && n.von > l.bis) { l.bis = n.bis; return; }
      aus.push({ von: n.von, bis: n.bis, sitzung: n.sitzung });
    });
    return aus;
  }

  /* ---------------------------------------------------------------------------
   * 8) Der Stand, wie ihn die Oberflaeche zeigt
   * ------------------------------------------------------------------------- */

  /** Die Panel-Zeile. Ein Satz, der sagt, woran man ist - und der die 15 Minuten
   *  BENENNT, statt sie zu verschweigen: ein Archiv, das der Boerse eine Viertelstunde
   *  hinterherlaeuft, ist kein Fehler, aber wer es nicht weiss, sucht einen. */
  function standZeile(st, jetzt) {
    st = st || {};
    if (!st.an) return 'Live-Sammler aus. Das Minutenarchiv wächst nur über den nächtlichen Nachlauf.';
    if (st.laeuft) {
      return 'Live-Sammler läuft – ' + (st.werte || 0) + ' Werte, ' + (st.buendel || 0) + ' Abrufe.';
    }
    if (!st.letzter) return 'Live-Sammler an. Noch kein Umlauf gefahren.';
    var l = st.letzter;
    var teile = [];
    teile.push(alterText(jetzt, l.ende) + ': ' + zahl(l.neu) + ' ' + (l.neu === 1 ? 'Kerze' : 'Kerzen') +
      ' zu ' + zahl(l.werte) + ' ' + (l.werte === 1 ? 'Wert' : 'Werten'));
    /* Die Nachpruefung gehoert in die Zeile, auch wenn sie 0 ergibt - gerade dann.
     * Eine 0, die niemand sieht, belegt nichts. */
    teile.push(zahl(l.nachgeprueft) + ' nachgeprüft, ' + zahl(l.abweichend) + ' abweichend');
    if (l.fehler) teile.push('Fehler: ' + l.fehler);
    return teile.join(' · ') + '. Das Archiv läuft der Börse 15 Minuten hinterher (Sperre der Gratisstufe).';
  }
  function zahl(n) { return String(typeof n === 'number' && isFinite(n) ? n : 0); }
  function alterText(jetzt, ende) {
    if (!(jetzt > 0 && ende > 0)) return 'Letzter Umlauf';
    var min = Math.round((jetzt - ende) / 60000);
    if (min <= 0) return 'Gerade eben';
    if (min === 1) return 'Vor 1 Minute';
    if (min < 60) return 'Vor ' + min + ' Minuten';
    var std = Math.round(min / 60);
    return 'Vor ' + std + (std === 1 ? ' Stunde' : ' Stunden');
  }

  var AlpacaLive = {
    TAKT_MS: TAKT_MS, SIP_VERZUG_MS: SIP_VERZUG_MS, NACHPRUEF_MS: NACHPRUEF_MS,
    DECKEL_JE_MIN: DECKEL_JE_MIN, BUENDEL_GROESSE: BUENDEL_GROESSE,
    ERSTFENSTER_MS: ERSTFENSTER_MS, WERTE_DECKEL: WERTE_DECKEL,
    RUNDE_MAX_MS: RUNDE_MAX_MS, LUECKE_JE_RUNDE: LUECKE_JE_RUNDE,
    etTag: etTag, nyNachUtc: nyNachUtc, minuteAb: minuteAb,
    fenster: fenster, faellig: faellig,
    werteliste: werteliste, gruppieren: gruppieren, buendeln: buendeln, planen: planen,
    kerzeAus: kerzeAus, imFenster: imFenster,
    unterschied: unterschied, einordnen: einordnen, anhaengen: anhaengen,
    grenzenAusKalender: grenzenAusKalender, grenzenAusBoerse: grenzenAusBoerse,
    sitzungJeKerze: sitzungJeKerze, sitzungenVerdichten: sitzungenVerdichten,
    sitzungenFortschreiben: sitzungenFortschreiben,
    standZeile: standZeile,
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = AlpacaLive; return; }
  root.AlpacaLive = AlpacaLive;
})(typeof window !== 'undefined' ? window : globalThis);
