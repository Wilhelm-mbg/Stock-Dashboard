'use strict';
/* DER UMLAUF DES LIVE-SAMMLERS - alle fuenf Minuten einmal.
 *
 * Die REGELN stehen in alpacalive.js, die PLATTE liegt im Hauptprozess
 * (main.js, 'alpaca-live-anhaengen'). Hier steht dazwischen die Reihenfolge: welche
 * Werte, welches Fenster, wie viele Anfragen - und was danach zu melden ist.
 *
 * WARUM DER UMLAUF IM RENDERER LAEUFT UND NICHT IM HAUPTPROZESS: die Alpaca-
 * Schluessel kommen ausschliesslich aus window.getSettings() (Kopf von alpaca.js).
 * Sie liegen im Store verschluesselt, und je weniger Wege sie kennen, desto weniger
 * Wege koennen sie verlieren. Der Renderer ruft ueber AlpAPI ab und reicht KERZEN
 * herueber, keine Schluessel.
 *
 * WAS DAS KOSTET, UND WARUM ES TROTZDEM RICHTIG IST: ein Renderer laeuft nur bei
 * offenem Fenster. Ist die App aus, sammelt der Live-Sammler nicht - dafuer gibt es
 * den naechtlichen Nachlauf (--nachholen, Auftrag Nr. 6), der Luecken schliesst.
 * Der Live-Sammler haelt das Archiv waehrend der Sitzung aktuell; er ersetzt den
 * Nachlauf nicht und behauptet das auch nirgends.
 *
 * ALLES HIER IST EINGEREICHT. runde() bekommt Werte, Abruf und Ablage als
 * Argumente - kein window, kein Netz, keine Platte. Der Test spielt damit einen
 * ganzen Handelstag durch, samt Sperre, Teilausfall und Nachpruefung.
 *
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung.
 */
(function (root) {

  var AL = (typeof module !== 'undefined' && module.exports) ? require('./alpacalive.js') : root.AlpacaLive;

  /* Der Zustand lebt hier und nicht in der Runde: er muss ueber die Umlaeufe hinweg
   * bestehen, und ein Modul, das ihn selbst haelt, waere zwischen zwei Proben nicht
   * mehr leer (dieselbe Ueberlegung wie STILLSTAND in main.js). */
  var Z = {
    an: false, laeuft: false, letzterLauf: 0, letzter: null,
    /* Die Nachpruefung ist eine Messung UEBER TAGE, nicht je Umlauf: "seit dem
     * 07.09. kein einziger nachtraeglich geaenderter Balken" ist ein Beleg fuer
     * append-only, eine einzelne 0 ist keiner. */
    summe: { umlaeufe: 0, neu: 0, nachgeprueft: 0, abweichend: 0 },
  };

  function zustand() { return Z; }
  function zuruecksetzen() {
    Z.an = false; Z.laeuft = false; Z.letzterLauf = 0; Z.letzter = null;
    Z.summe = { umlaeufe: 0, neu: 0, nachgeprueft: 0, abweichend: 0 };
  }

  /** Ein Umlauf.
   *
   *  opt.werte      {top500, watchlist, positionen, viewer} - Listen oder Kuerzel
   *  opt.stempel    (symbole) -> {ok, stempel:{SYM: ms|null}, wurzel}
   *  opt.balken     (symbole, von, bis, token) -> {ok, bars:{SYM:[...]}, token, grund}
   *  opt.anhaengen  (saetze) -> {ok, neu, gleich, abweichend, gesperrt, grund}
   *  opt.jetzt      Zeitpunkt (fuer den Test)
   *
   *  Rueckgabe: der Bericht, den die Panel-Zeile liest.
   */
  async function runde(opt) {
    opt = opt || {};
    var jetzt = opt.jetzt || Date.now();
    var bericht = { begonnen: jetzt, ende: jetzt, werte: 0, buendel: 0, abrufe: 0,
                    neu: 0, nachgeprueft: 0, abweichend: 0, zurueckgestellt: 0,
                    fehler: null, gesperrt: false };

    var werte = AL.werteliste(opt.werte || {});
    bericht.werte = werte.length;
    if (!werte.length) { bericht.fehler = 'Keine Werte'; return bericht; }

    /* (1) Wie weit ist jede Reihe? Ohne diese Antwort waere jedes Fenster geraten. */
    var st = await opt.stempel(werte);
    if (!st || !st.ok) {
      bericht.fehler = (st && st.grund) || 'Archivstand nicht lesbar';
      return bericht;
    }

    /* (2) Gruppen bilden - ein Fenster fuer alle waere das teuerste aller Fenster. */
    var g = AL.gruppieren(werte, st.stempel || {}, jetzt);
    bericht.zurueckgestellt = g.zurueckgestellt.length;

    var saetze = {};
    for (var gi = 0; gi < g.gruppen.length; gi++) {
      var gruppe = g.gruppen[gi];
      var buendel = AL.buendeln(gruppe.symbole);
      bericht.buendel += buendel.length;
      for (var bi = 0; bi < buendel.length; bi++) {
        var token = null, seiten = 0;
        do {
          var r = await opt.balken(buendel[bi], gruppe.von, gruppe.bis, token);
          bericht.abrufe++;
          seiten++;
          if (!r || !r.ok) {
            /* Ein Buendel, das faellt, nimmt nicht den ganzen Umlauf mit - die
             * anderen Werte haben mit seinem Fehler nichts zu tun. */
            bericht.fehler = (r && r.grund) || 'Abruf fehlgeschlagen';
            break;
          }
          var bars = r.bars || {};
          Object.keys(bars).forEach(function (sym) {
            var kerzen = (bars[sym] || []).map(AL.kerzeAus).filter(Boolean);
            /* Die iex-Falle, gegen SIP gerichtet: was ausserhalb des ANGEFRAGTEN
             * Fensters liegt, faellt heraus. Eine Schnittstelle, die lieber
             * irgendetwas antwortet als nichts, hat das Projekt schon einmal
             * 2020er Spannen als 2018er ablegen lassen (wiki/datenquellen.md). */
            var im = AL.imFenster(kerzen, gruppe.von, gruppe.bis);
            if (!im.drin.length) return;
            (saetze[sym] || (saetze[sym] = [])).push.apply(saetze[sym], im.drin);
          });
          token = r.token || null;
        } while (token && seiten < 50);
      }
    }

    var liste = Object.keys(saetze).map(function (sym) { return { sym: sym, kerzen: saetze[sym] }; });
    if (!liste.length) { bericht.ende = opt.jetzt ? jetzt : Date.now(); return bericht; }

    /* (3) Ablegen. Was schon dasteht, wird gezaehlt und nicht ersetzt. */
    var a = await opt.anhaengen(liste);
    if (!a || !a.ok) {
      bericht.gesperrt = !!(a && a.gesperrt);
      bericht.fehler = (a && a.grund) || 'Ablegen fehlgeschlagen';
      bericht.ende = opt.jetzt ? jetzt : Date.now();
      return bericht;
    }
    bericht.neu = a.neu || 0;
    bericht.nachgeprueft = (a.gleich || 0) + (a.abweichend || 0);
    bericht.abweichend = a.abweichend || 0;
    bericht.sitzungsherkunft = a.sitzungsherkunft || null;
    if (a.fehler) bericht.fehler = a.fehler;
    bericht.ende = opt.jetzt ? jetzt : Date.now();
    return bericht;
  }

  /** Ein Blick auf die Uhr: faellig? dann laufen. Nacheinander, nie verschraenkt -
   *  zwei Umlaeufe zugleich halbierten die Hoeflichkeit gegenueber der Quelle und
   *  schrieben ausserdem gegen dieselbe Sperre. */
  async function blick(opt) {
    opt = opt || {};
    var jetzt = opt.jetzt || Date.now();
    if (!Z.an || Z.laeuft) return null;
    if (!AL.faellig(Z.letzterLauf, jetzt)) return null;
    Z.laeuft = true;
    try {
      var b = await runde(opt);
      Z.letzterLauf = jetzt;
      Z.letzter = b;
      Z.summe.umlaeufe++;
      Z.summe.neu += b.neu;
      Z.summe.nachgeprueft += b.nachgeprueft;
      Z.summe.abweichend += b.abweichend;
      return b;
    } finally {
      Z.laeuft = false;
    }
  }

  /** Die Panel-Zeile - eine Frage an alpacalive.js, damit der Satz an einer Stelle
   *  steht und nicht in der Oberflaeche noch einmal gebaut wird. */
  function zeile(jetzt) {
    return AL.standZeile({ an: Z.an, laeuft: Z.laeuft, letzter: Z.letzter,
                           werte: Z.letzter ? Z.letzter.werte : 0,
                           buendel: Z.letzter ? Z.letzter.buendel : 0 }, jetzt || Date.now());
  }

  /** Die Dauermessung zur Frage "aendert die Quelle fertige SIP-Balken noch?".
   *  Sie steht in der Diagnose-Klappe und ist der einzige Grund, warum jeder Umlauf
   *  die letzte halbe Stunde noch einmal mitfragt. */
  function nachpruefung() {
    var s = Z.summe;
    if (!s.nachgeprueft) return 'Noch nichts nachgeprüft.';
    return s.nachgeprueft + ' fertige Balken erneut geholt, ' + s.abweichend + ' davon abweichend' +
      (s.abweichend === 0
        ? ' – bis hierher ändert die Quelle nach 15 Minuten nichts mehr.'
        : ' – „append-only ab 15 min“ trägt NICHT, die Abweichungen stehen in alpaca1m/laeufe.log.');
  }

  /* ---------------------------------------------------------------------------
   * Die Verdrahtung - das einzige Stueck, das window kennt
   *
   * Sie steht bewusst UNTEN und in einer eigenen Funktion: alles darueber laeuft in
   * Node, diese eine nicht. Wer sie aufruft, bekommt einen Umlauf alle fuenf Minuten;
   * wer sie nicht aufruft (der Test), bekommt ein Modul ohne Uhr.
   * ------------------------------------------------------------------------- */

  /** Die vier Quellen der Werteliste, jede mit Rueckfall auf leer. Fehlt eine, faellt
   *  sie weg - der Sammler laeuft mit den anderen weiter, statt sich an einem
   *  Modul aufzuhaengen, das gerade nicht geladen ist. */
  function quellenLesen() {
    function ruhig(f) { try { var v = f(); return v == null ? [] : v; } catch (e) { return []; } }
    return {
      positionen: ruhig(function () {
        var d = root.Dash && root.Dash.depot && root.Dash.depot();
        return (d && d.positionen || []).map(function (p) { return p.sym || p.y; });
      }),
      viewer: ruhig(function () { return root.Explorer && root.Explorer.aktuellerWert && root.Explorer.aktuellerWert(); }),
      watchlist: ruhig(function () {
        var d = root.Dash && root.Dash.depot && root.Dash.depot();
        return (d && d.watchlist || []).map(function (w) { return w.y || w.sym; });
      }),
      top500: ruhig(function () { return root.Marktwerte && root.Marktwerte.symbole && root.Marktwerte.symbole(); }),
    };
  }

  var UHR = null;
  function verdrahten() {
    if (UHR || typeof root.setInterval !== 'function') return false;
    var api = root.api || (root.window && root.window.api);
    if (!api || !api.alpacaLiveStempel || !api.alpacaLiveAnhaengen || !root.AlpAPI) return false;
    var opt = {
      stempel: function (s) { return api.alpacaLiveStempel(s); },
      anhaengen: function (s) { return api.alpacaLiveAnhaengen(s); },
      balken: function (syms, von, bis, token) { return root.AlpAPI.balken(syms, von, bis, token); },
    };
    /* Jede Minute auf die Uhr sehen, alle fuenf laufen. Der Takt haengt am letzten
     * LAUF (alpacalive.faellig), nicht an diesem Wecker - so holt ein Neustart um
     * 10:04:59 nicht zwei Umlaeufe in zwei Sekunden. */
    UHR = root.setInterval(function () {
      if (!Z.an) return;
      /* Ohne eingerichtete Verbindung wird nicht gefragt - ein 401 alle fuenf
       * Minuten waere Verkehr ohne Ertrag. */
      if (!root.AlpAPI.enabled()) return;
      opt.werte = quellenLesen();
      blick(opt).then(function (b) {
        if (!b) return;
        try { root.document.dispatchEvent(new root.CustomEvent('livesammler-stand', { detail: b })); }
        catch (e) { /* ohne Ereignis bleibt es bei der naechsten Zeichnung */ }
      }).catch(function () { /* ein gefallener Umlauf kommt in fuenf Minuten wieder */ });
    }, 60000);
    return true;
  }

  var AlpacaSammler = {
    zustand: zustand, zuruecksetzen: zuruecksetzen,
    runde: runde, blick: blick, zeile: zeile, nachpruefung: nachpruefung,
    quellenLesen: quellenLesen, verdrahten: verdrahten,
    anSetzen: function (an) { Z.an = !!an; },
  };

  if (typeof module !== 'undefined' && module.exports) { module.exports = AlpacaSammler; return; }
  root.AlpacaSammler = AlpacaSammler;
})(typeof window !== 'undefined' ? window : globalThis);
