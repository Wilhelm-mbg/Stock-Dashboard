'use strict';
/* Ein Lader mit Vertrag - statt neun handgeschriebener Zerlegungen derselben Antwort.
 *
 * Bestandsaufnahme vom 24.08.2026: Neun Stellen in sechs Dateien haben die Yahoo-
 * Chart-Antwort selbst auseinandergenommen. Sie waren sich in nichts einig:
 *
 *   Stelle                     Feld            verworfen wurde        429   Hoch/Tief
 *   renderer loadSymbol        close           null/undefined         ja    -
 *   renderer loadPrePost       close           != null                nein  -
 *   depot   getDailySeries     close           kursOk (>0, endlich)   nein  -
 *   depot   fetchIntradayYahoo close           kursOk                 ja    ja, mit Tausch
 *   mittelfrist holeTage       adjclose|close  != null                nein  -
 *   driftui ladeMarkt          adjclose|close  != null                nein  -
 *   scheinfinder               close           != null                nein  -
 *   explorer fetchRange        close           == null                nein  ja, ohne Tausch
 *
 * Drei Sorten Unterschied stecken darin, und sie sind NICHT gleich zu behandeln:
 *
 * 1. ROH ODER BEREINIGT ist eine echte fachliche Entscheidung, keine Schlamperei.
 *    Momentum und Ergebnis-Drift rechnen ueber Jahre - ohne adjclose macht ein
 *    Aktiensplit aus einer Kursverdopplung eine Halbierung. Der Intraday-Handel
 *    braucht dagegen den ROHEN Kurs, weil genau der gehandelt wird. Beides ist
 *    richtig. Falsch war nur, dass es nirgends DASTAND: man musste raten, ob
 *    'adj.adjclose || q.close' Absicht oder Zufall war. Deshalb ist 'bereinigt'
 *    hier ein Pflichtfeld ohne Vorgabewert - wer laedt, muss sich entscheiden.
 *
 * 2. DAS VERWERFEN war schlicht auseinandergelaufen. 'closes[i] != null' laesst
 *    eine 0, eine negative Zahl und NaN durch (0 == null ist falsch). Genau daran
 *    ist die App schon einmal haengengeblieben: ein einziger kaputter Kurs der
 *    inoffiziellen Schnittstelle konnte offene Positionen zum Mindestwert
 *    liquidieren. Zwei Stellen haben daraufhin kursOk bekommen, die anderen sechs
 *    nicht - obwohl dort dieselbe 0 in Vola-Schaetzung, Kachelkurs und
 *    Signalrechnung laeuft. Hier gilt kursOk fuer alle, und was verworfen wurde,
 *    wird MITGEZAEHLT statt still zu verschwinden.
 *
 * 3. DIE WIEDERHOLUNG BEI 429 hatten zwei von neun. Yahoo drosselt bei etwa 200
 *    Anfragen in Folge; die anderen sieben haben das Symbol dann einfach
 *    fallengelassen. Jetzt bekommt es jeder Aufrufer.
 *
 * Der Zerlegeteil ist rein und exportiert (module.exports), laeuft also in Node -
 * anders als die neun Fassungen, die alle in window-IIFEs steckten und nur ueber
 * Textsuche pruefbar waren.
 *
 * NICHT hier eingemeindet: vormarkt.js/vormarktAusChart. Das ist kein Lader,
 * sondern ein Sonderfall-Auswerter (er schneidet das vorboersliche Fenster aus den
 * currentTradingPeriod-Grenzen heraus), er ist bereits exportiert und hat eigene
 * Tests. Ihn hierher zu ziehen haette einen geprueften Vertrag aufgebrochen, um
 * eine Zeile JSON.parse zu sparen. */
(function (root) {

  var BASIS = 'https://query1.finance.yahoo.com/v8/finance/chart/';

  /** Ein brauchbarer Kurs? Wortgleich zu depot.js/kursOk - die Regel, die nach dem
   *  Zwischenfall mit dem Nullkurs eingezogen wurde. '!= null' allein reicht NICHT:
   *  0, negative Werte und NaN kommen sonst durch. */
  function kursOk(v) { return typeof v === 'number' && isFinite(v) && v > 0; }

  /* ---- Tagesbalken: ein Balken je Handelstag (Pruefbericht Lader-Stoerungen, KU-2/5/6/9/14) ----
   * Bei interval '1d' kann die Antwort Kerzen tragen, die kein Handelstag sind: die flache
   * Quote-Stempel-Kerze (Eroeffnung = Hoch = Tief = Schluss, Umsatz 0) hinter dem Balken desselben
   * Tags oder allein am Ende (Feiertag, abgemeldete Reihe), dazu unsortierte oder doppelte Stempel.
   * Die Leser zaehlen Balken als Handelstage und suchen binaer (mfhandel.js) - REGEL §1.3: je
   * Handelstag eine Zeile. Gezaehlt wird, was fortfaellt. */
  var NY_TAG = null;
  function nyTag(ms) {
    if (!NY_TAG) NY_TAG = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
    return NY_TAG.format(new Date(ms));
  }
  function stempelKerze(b) { return b[2] === 0 && b[3] === b[1] && b[4] === b[1] && (b[5] == null || b[5] === b[1]); }
  /** bars (und roh, gleich lang und gleich geordnet) sortieren, je Stempel den letzten behalten, je
   *  New-Yorker Tag die flachen Umsatz-0-Kerzen neben einem anderen Balken streichen und eine flache
   *  Umsatz-0-Kerze am Ende streichen. Rein. Rueckgabe { bars, roh, umsortiert, doppelt, stempelKerzen }. */
  function nurHandelstage(bars, roh) {
    var z = { umsortiert: 0, doppelt: 0, stempelKerzen: 0 };
    var idx = bars.map(function (b, i) { return i; });
    for (var i = 1; i < bars.length; i++) if (bars[i][0] < bars[i - 1][0]) z.umsortiert++;
    idx.sort(function (a, b) { return bars[a][0] - bars[b][0] || a - b; });
    var eins = [];
    idx.forEach(function (i) {
      if (eins.length && bars[eins[eins.length - 1]][0] === bars[i][0]) { z.doppelt++; eins[eins.length - 1] = i; } else eins.push(i);
    });
    var tage = {}, behalten = [];
    function tagAn(k) { return k in tage ? tage[k] : (tage[k] = nyTag(bars[eins[k]][0])); }   // nur fuer flache Kerzen und ihre Nachbarn
    eins.forEach(function (i, k) {
      if (stempelKerze(bars[i])) {
        /* am Ende (nicht, wenn schon der Balken davor flach ist - Reihen ohne Umsatz wie Fonds bleiben), oder ein
         * frueherer Balken desselben Tags, oder (Schleife) ein spaeterer echter Balken desselben Tags */
        var weg = (k === eins.length - 1 && !(k > 0 && stempelKerze(bars[eins[k - 1]]))) || (k > 0 && tagAn(k - 1) === tagAn(k));
        for (var n = k + 1; !weg && n < eins.length && tagAn(n) === tagAn(k); n++) if (!stempelKerze(bars[eins[n]])) weg = true;
        if (weg) { z.stempelKerzen++; return; }
      }
      behalten.push(i);
    });
    z.bars = behalten.map(function (i) { return bars[i]; });
    z.roh = roh ? behalten.map(function (i) { return roh[i]; }) : null;
    return z;
  }
  /** Gehoert die Antwort zum angefragten Kuerzel? meta.symbol gegen sym, gross und mit '-' statt '.'
   *  (BRK.B / BRK-B). Ohne meta.symbol gilt sie als passend. (Pruefbericht Lader-Stoerungen, KU-13) */
  function fremdesSymbol(meta, sym) {
    function norm(s) { return String(s).toUpperCase().replace(/\./g, '-'); }
    return !!(meta && typeof meta.symbol === 'string' && meta.symbol && norm(meta.symbol) !== norm(sym));
  }

  /** Die URL bauen. Entweder benannter Zeitraum ODER freie Grenzen - nie beides.
   *  von/bis in Millisekunden, wie ueberall sonst in dieser App. */
  function url(sym, o) {
    var u = BASIS + encodeURIComponent(sym);
    if (o.von != null && o.bis != null) {
      u += '?period1=' + Math.floor(o.von / 1000) + '&period2=' + Math.floor(o.bis / 1000);
    } else {
      u += '?range=' + o.range;
    }
    u += '&interval=' + o.interval;
    if (o.prePost) u += '&includePrePost=true';
    /* Kapitalmassnahmen im SELBEN Abruf (Auftrag Nr. 87): Ausschuettungen und Splits kommen
     * als Feld events der Antwort mit - kein zweiter Abruf je Wert. */
    if (o.ereignisse) u += '&events=div%2Csplits';
    return u;
  }

  /** Die Kapitalmassnahmen einer Antwort (Feld chart.result[0].events). Rein.
   *  Rueckgabe { div: [[tMs, betragJeStueck], ...], split: [[tMs, zaehler, nenner], ...] },
   *  beide nach Zeit aufsteigend; fehlt das Feld, sind beide Listen leer.
   *
   *  Am 04.10.2026 an NVDA und WMT nachgesehen (ein Abruf je Wert, period1=0):
   *  - der Betrag steht in HEUTIGER Stueckelung - NVDA zahlte vor dem Split 10:1 vom
   *    10.06.2024 je Quartal 0,04 $, gemeldet werden 0,004; WMT zahlte vor dem Split 3:1
   *    vom 26.02.2024 0,57 $, gemeldet werden 0,19;
   *  - der Zeitstempel (Feld date, gleich dem Schluessel) ist der des Tagesbalkens des
   *    Ex-Tags - bei 265 von 265 Ausschuettungen und 15 von 16 Splits; die Ausnahme ist
   *    der NVDA-Split vom 12.09.2001, einem Tag ohne Handel und ohne Balken.
   *  Ein "Split" z : n mit z = n aendert nichts und ist kein Ereignis. */
  function ereignisseAus(ev, o) {
    var div = [], split = [];
    var d = (ev && ev.dividends) || {}, s = (ev && ev.splits) || {};
    function zeit(x, k) { return (typeof x.date === 'number' ? x.date : Number(k)) * 1000; }
    Object.keys(d).forEach(function (k) {
      var x = d[k] || {}, t = zeit(x, k);
      if (kursOk(t) && kursOk(x.amount)) div.push([t, x.amount]);
    });
    Object.keys(s).forEach(function (k) {
      var x = s[k] || {}, t = zeit(x, k);
      if (kursOk(t) && kursOk(x.numerator) && kursOk(x.denominator) && x.numerator !== x.denominator) split.push([t, x.numerator, x.denominator]);
    });
    function imFenster(e) { return !(o && o.von != null && o.bis != null) || (e[0] >= o.von && e[0] <= o.bis); }
    function nachZeit(a, b) { return a[0] - b[0]; }
    return { div: div.filter(imFenster).sort(nachZeit), split: split.filter(imFenster).sort(nachZeit) };
  }

  /** Nur die Ereignisse ab einem Zeitpunkt (einschliesslich) - fuer die Ablage: gespeichert
   *  werden die letzten 400 Tage, nicht die Geschichte seit 1972. Rein, neue Listen. */
  function ereignisseAb(e, abMs) {
    function ab(x) { return x[0] >= abMs; }
    return { div: ((e && e.div) || []).filter(ab), split: ((e && e.split) || []).filter(ab) };
  }

  /** Die Antwort auseinandernehmen. Rein: kein Netz, kein window, kein Zustand.
   *
   *  o.bereinigt  true  -> adjclose, ersatzweise close (Split- und Dividenden-
   *                        bereinigt; fuer alles, was ueber Monate rechnet)
   *               false -> close (der tatsaechlich gehandelte Kurs)
   *
   *  o.mitRoh     true  -> zusaetzlich roh: [[t, schluss], ...] - der UNBEREINIGTE Schluss
   *                        derselben Balken, dieselben Zeitstempel wie bars (Auftrag
   *                        Nr. 91: aus bereinigt / roh entsteht der Faktor der
   *                        Ausschuettungen je Balken). Ein fehlender roher Schluss steht
   *                        als null da, der Balken bleibt. Ohne den Schalter traegt die
   *                        Rueckgabe das Feld NICHT - sie ist zeichengleich wie zuvor.
   *
   *  Rueckgabe: null bei unbrauchbarer Antwort, sonst
   *    { bars: [[t, schluss, volumen, hoch, tief, eroeffnung], ...],
   *      meta, verworfen, gesamt, feld }
   *  Der Zeitstempel ist IMMER in Millisekunden. Hoch, Tief und Eroeffnung fallen
   *  auf den Schlusskurs zurueck, wenn sie fehlen - so hat jede Zeile dieselbe
   *  Form, und kein Aufrufer muss noch einmal auf Luecken pruefen. */
  function zerlege(text, o) {
    o = o || {};
    var j;
    try { j = JSON.parse(text); } catch (e) { return null; }
    var r = j && j.chart && j.chart.result && j.chart.result[0];
    if (!r) return null;
    if (o.kuerzel && fremdesSymbol(r.meta, o.kuerzel)) return null;   // KU-13, gesetzt von hole()
    var ind = r.indicators || {};
    var q = (ind.quote && ind.quote[0]) || {};
    var ts = r.timestamp || [];
    var roh = q.close || [];
    var feld = 'close';
    var schluss = roh;
    if (o.bereinigt) {
      var adj = (ind.adjclose && ind.adjclose[0]) || {};
      if (adj.adjclose && adj.adjclose.length) { schluss = adj.adjclose; feld = 'adjclose'; }
    }
    var his = q.high || [], los = q.low || [], vols = q.volume || [], ops = q.open || [];
    var bars = [], verworfen = 0, rohSchluss = o.mitRoh ? [] : null;
    for (var i = 0; i < ts.length; i++) {
      var c = schluss[i];
      if (!kursOk(c)) { verworfen++; continue; }
      if (rohSchluss) rohSchluss.push([ts[i] * 1000, kursOk(roh[i]) ? roh[i] : null]);
      var hi = kursOk(his[i]) ? his[i] : c;
      var lo = kursOk(los[i]) ? los[i] : c;
      /* Vertauscht geliefert: kommt bei der inoffiziellen Schnittstelle vor. Nur
       * depot.js hat das bisher abgefangen; wer die Kanten eines Kanals daran
       * ausrichtet, bekam anderswo ein Hoch unter dem Tief. */
      if (lo > hi) { var tausch = hi; hi = lo; lo = tausch; }
      /* o.offenRoh: fehlt der Eroeffnungskurs, bleibt er LEER statt auf den Schluss
       * zu fallen. Nur das Kursarchiv will das, und es will es aus einem Grund: die
       * Messmaschine warnt eigens (C7), wenn eine Reihe keine Eroeffnungskurse fuehrt,
       * und rechnet dann sichtbar mit dem Vorkerzen-Schluss weiter. Faellt der Wert
       * schon beim Zerlegen still auf den Schluss, kann diese Warnung nie mehr feuern -
       * aus einer offengelegten Naeherung waere eine verschwiegene geworden.
       * Fuer die Anzeige gilt weiter das Gegenteil: dort ist eine Luecke laestiger als
       * eine Naeherung, und jede Zeile soll dieselbe Form haben. */
      var op = kursOk(ops[i]) ? ops[i] : (o.offenRoh ? null : c);
      var vo = (typeof vols[i] === 'number' && isFinite(vols[i])) ? vols[i] : 0;
      bars.push([ts[i] * 1000, c, vo, hi, lo, op]);
    }
    /* KERZEN AUSSERHALB DES ANGEFRAGTEN FENSTERS FLIEGEN RAUS.
     * Am 27.08.2026 live gemessen: ein Abruf fuer den 30.06. bis 07.07.2025 liefert
     * als letzte Kerze
     *     2026-08-26T20:00   c = 313,45   v = 0
     * also den HEUTIGEN Kurs mit heutigem Stempel, angehaengt an einen dreizehn
     * Monate alten Zeitraum - plus 47 % gegen den Kursstand jener Woche. Yahoo haengt
     * an jede Anfrage eine Abschlusskerze aus dem aktuellen Quote. Bei einer Anfrage
     * mit range= faellt das nicht auf, weil das Fenster bis jetzt reicht und die
     * Kerze dort hingehoert. Bei einem HISTORISCHEN Fenster ist sie Gift, und zwar
     * die gefaehrlichste Sorte: der Zeitstempel ist plausibel, nur der Kurs verraet es.
     * (Anders als zunaechst vermutet liegt es NICHT an includePrePost - mit prePost
     * war die Kerze in derselben Messung gar nicht da.)
     *
     * Die Sperre braucht keine Kursheuristik: was ausserhalb des angefragten
     * Fensters liegt, wurde nicht angefragt. Damit kann sie die echte Schlusskerze
     * nicht treffen - die liegt immer innerhalb. */
    var ausserhalbFenster = 0;
    if (o.von != null && o.bis != null) {
      var vorFilter = bars.length;
      bars = bars.filter(function (b) { return b[0] >= o.von && b[0] <= o.bis; });
      ausserhalbFenster = vorFilter - bars.length;
      /* Dieselbe Sperre fuer die Rohreihe - sie hat dieselben Zeitstempel wie bars. */
      if (rohSchluss) rohSchluss = rohSchluss.filter(function (b) { return b[0] >= o.von && b[0] <= o.bis; });
    }
    var ergebnis = { bars: bars, meta: r.meta || {}, verworfen: verworfen, gesamt: ts.length,
      feld: feld, ausserhalbFenster: ausserhalbFenster };
    if (rohSchluss) ergebnis.roh = rohSchluss;
    /* Tagesbalken: sortiert, je Stempel einmal, keine Stempel-Kerze als Handelstag (oben, nurHandelstage) -
     * bars und roh gemeinsam. Nur bei interval '1d'; die Zaehler stehen nur da, wenn etwas fortfiel. */
    if (o.interval === '1d') {
      var tg = nurHandelstage(ergebnis.bars, ergebnis.roh);
      ergebnis.bars = tg.bars;
      if (ergebnis.roh) ergebnis.roh = tg.roh;
      ['umsortiert', 'doppelt', 'stempelKerzen'].forEach(function (k) { if (tg[k]) ergebnis[k] = tg[k]; });
    }
    /* o.ereignisse: die Kapitalmassnahmen derselben Antwort dazu (Auftrag Nr. 87). Ohne den
     * Schalter traegt die Rueckgabe das Feld NICHT - sie ist zeichengleich wie zuvor. */
    if (o.ereignisse) ergebnis.ereignisse = ereignisseAus(r.events, o);
    return ergebnis;
  }

  /** Nur Zeit und Schlusskurs - die Form, die die meisten Aufrufer wollen. */
  function reihe(bars) { return (bars || []).map(function (b) { return [b[0], b[1]]; }); }

  // ---- Netz-Teil (braucht window.api) ----
  function baueLader(api, warte) {
    /* Tempolimit: bewusst NICHT als fester Abstand vor jeder Anfrage. Ein pauschales
     * Limit haette den Intraday-Scan und die Vormarkt-Suche spuerbar verlangsamt -
     * eine Verschlechterung fuer einen Fall, der meistens gar nicht eintritt. Statt
     * dessen adaptiv: erst WENN Yahoo mit 429 drosselt, gilt fuer alle Aufrufer eine
     * Sperrminute. Danach laeuft es wieder mit voller Geschwindigkeit.
     * Der Zaehler ist absichtlich modulweit - 429 gilt der Adresse, nicht dem Symbol. */
    var sperreBis = 0;
    var drosselungen = 0;

    /* Die Wartezeit ist ABSICHTLICH je Aufrufer einstellbar und nicht vereinheitlicht.
     * Vor der Zusammenlegung wartete die Kachelliste 20 Sekunden, der Intraday-Scan 5.
     * Das ist kein Versehen: Die Kacheln sind sechs Werte, die einmal pro Minute
     * nachgezogen werden - da lohnt Geduld. Der Scan geht ueber Hunderte Symbole,
     * dort haelt eine 20-Sekunden-Sperre den ganzen Durchlauf auf. Eine gemeinsame
     * Zahl haette eine der beiden Seiten verschlechtert. */
    var WARTE_VORGABE = 5000;

    async function mitWiederholung(u, o) {
      var res = await einmal(u);
      if (res && !res.ok && res.status === 429 && o.wiederholen !== false) {
        await warte(o.warteMs > 0 ? o.warteMs : WARTE_VORGABE);
        res = await einmal(u);
      }
      return res;
    }

    async function einmal(u) {
      var jetzt = Date.now();
      if (sperreBis > jetzt) await warte(sperreBis - jetzt);
      var res = await api.fetchText(u);
      if (res && res.status === 429) {
        drosselungen++;
        sperreBis = Date.now() + 5000;
      }
      return res;
    }

    return {
      /** Laden und zerlegen. opt wie bei zerlege(), dazu range/von/bis/interval/prePost.
       *  wiederholen: bei 429 einmal erneut versuchen (Vorgabe: ja). */
      hole: async function (sym, opt) {
        var o = opt || {};
        if (typeof o.bereinigt !== 'boolean') {
          /* Kein stiller Vorgabewert. Genau diese Entscheidung ist neun Mal
           * unausgesprochen getroffen worden; ein Vorgabewert wuerde das fortsetzen. */
          throw new Error('Kurse.hole: "bereinigt" muss true oder false sein (' + sym + ')');
        }
        var res = await mitWiederholung(url(sym, o), o);
        if (!res || !res.ok) return null;
        /* Eine Antwort fuer ein anderes Kuerzel (meta.symbol) gilt wie keine Antwort - der Aufrufer
         * behaelt seinen Bestand (zerlege prueft o.kuerzel; Pruefbericht Lader-Stoerungen, KU-13). */
        o = Object.assign({}, o, { kuerzel: sym });
        return zerlege(res.body, o);
      },
      /** Nur den Rohtext holen - fuer den einen Auswerter, der die Antwort anders
       *  schneidet als alle anderen (vormarkt.js schneidet das vorboersliche Fenster
       *  aus den currentTradingPeriod-Grenzen). Er bekommt so denselben URL-Bau und
       *  dieselbe 429-Behandlung wie alle, ohne dass sein geprüfter Vertrag aufbricht. */
      /** VIELE Kurse auf einmal - eine Anfrage je 400 Kuerzel statt einer je Wert.
       *  Fuer Uebersichten ueber hunderte Werte ist das der Unterschied zwischen
       *  "geht nicht" und "kostet eine Sekunde": 600 Werte sind zwei Anfragen.
       *
       *  Rueckgabe wie beim Hauptprozess: { ok, kurse: { SYM: { kurs, pct, vorher } },
       *  angefragt, geholt, bloecke }. Bewusst das GANZE Ergebnis und nicht nur die
       *  Kurse: sonst liesse sich "Abruf gescheitert" nicht von "nichts gefunden"
       *  unterscheiden, und der Aufrufer meldete stillschweigend eine leere Karte.
       *
       *  Kein "bereinigt"-Vertrag wie bei hole(): das hier sind LEBENDE Kurse, kein
       *  Zeitreihenabruf. Splits gibt es im Jetzt nicht. */
      holeViele: async function (syms) {
        if (!api || typeof api.yahooQuotes !== 'function') {
          return { ok: false, grund: 'Sammelabruf in dieser Fassung nicht vorhanden', kurse: {} };
        }
        try {
          var r = await api.yahooQuotes(syms || []);
          if (!r || !r.ok) return { ok: false, grund: (r && r.grund) || 'unbekannt', kurse: {} };
          /* gedrosselt und leereBloecke gehen mit durch. Ohne sie saehe eine
           * Drosselung der Quelle wie ein duenner Markt aus - die Anzeige haette
           * weniger Werte und keinen Grund dafuer. */
          return { ok: true, kurse: r.kurse || {}, angefragt: r.angefragt || 0,
                   geholt: r.geholt || 0, bloecke: r.bloecke || 0,
                   gedrosselt: r.gedrosselt || 0, leereBloecke: r.leereBloecke || 0 };
        } catch (e) { return { ok: false, grund: String((e && e.message) || e), kurse: {} }; }
      },
      holeRoh: async function (sym, opt) {
        var res = await mitWiederholung(url(sym, opt || {}), opt || {});
        return (res && res.ok) ? res.body : null;
      },
      /** Wie oft hat Yahoo in dieser Sitzung gedrosselt? Fuer die Diagnose. */
      drosselungen: function () { return drosselungen; },
      url: url
    };
  }

  var Kurse = {
    kursOk: kursOk, url: url, zerlege: zerlege, reihe: reihe, baueLader: baueLader,
    ereignisseAus: ereignisseAus, ereignisseAb: ereignisseAb
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Kurse; return; }
  root.KurseKern = Kurse;
  root.Kurse = baueLader(
    root.api || { fetchText: async function () { return { ok: false, status: 0, body: '' }; } },
    function (ms) { return new Promise(function (f) { setTimeout(f, ms); }); }
  );
  root.Kurse.zerlege = zerlege;
  root.Kurse.reihe = reihe;
  root.Kurse.kursOk = kursOk;
  root.Kurse.ereignisseAb = ereignisseAb;
})(typeof window !== 'undefined' ? window : globalThis);
