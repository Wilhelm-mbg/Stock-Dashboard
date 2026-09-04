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
    return u;
  }

  /** Die Antwort auseinandernehmen. Rein: kein Netz, kein window, kein Zustand.
   *
   *  o.bereinigt  true  -> adjclose, ersatzweise close (Split- und Dividenden-
   *                        bereinigt; fuer alles, was ueber Monate rechnet)
   *               false -> close (der tatsaechlich gehandelte Kurs)
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
    var bars = [], verworfen = 0;
    for (var i = 0; i < ts.length; i++) {
      var c = schluss[i];
      if (!kursOk(c)) { verworfen++; continue; }
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
    }
    return { bars: bars, meta: r.meta || {}, verworfen: verworfen, gesamt: ts.length,
      feld: feld, ausserhalbFenster: ausserhalbFenster };
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
    kursOk: kursOk, url: url, zerlege: zerlege, reihe: reihe, baueLader: baueLader
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
})(typeof window !== 'undefined' ? window : globalThis);
