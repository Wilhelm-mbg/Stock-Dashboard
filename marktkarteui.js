'use strict';
/* Die Marktkarte, angeschlossen: Stammdaten aus der Datei, Kurse aus dem Netz.
 *
 * ARBEITSTEILUNG, und sie ist Absicht:
 *   LANGSAM  Branche und Aktienanzahl aendern sich im Jahresrhythmus. Sie kommen aus
 *            <Datenordner>/markt/stammdaten.json, die tools/stammdaten-holen.js
 *            neben der App fuellt. Die App fragt NIE selbst bei der SEC an.
 *   SCHNELL  Kurs und Tagesveraenderung kommen bei jeder Aktualisierung frisch ueber
 *            denselben Lader wie der Rest der App (kurse.js).
 *
 * Die Marktkapitalisierung wird deshalb NICHT gespeichert, sondern jedes Mal neu
 * gerechnet: Kurs mal Stueckzahl. Damit ist nicht nur die Farbe live, sondern auch
 * die Flaeche - eine Karte mit den Groessen von gestern waere eine Karte von gestern.
 *
 * WAS SIE NICHT IST: kein Signal, keine Rangliste, keine Empfehlung. Keine
 * Hervorhebung von Ausreissern, keine Sortierung nach "heissestem Sektor". Gemessen
 * ist an dieser Karte nichts - sie zeigt, was heute passiert ist, mehr nicht. */
(function () {
  var U = window.U || {};
  function esc(x) { return U.esc ? U.esc(x) : String(x); }

  /* Werte, deren Stueckzahl die SEC nicht hergibt. Nachgemessen am 25.08.2026:
   * Meta taggt gar keine Aktienanzahl in XBRL (mehrere Gattungen mit einer Achse,
   * die die Schnittstelle nicht aufloest). Ohne diese Zeile fehlt auf einer Karte
   * des US-Marktes ausgerechnet Meta - das faellt jedem sofort auf und macht die
   * ganze Karte unglaubwuerdig.
   * Handgepflegt, mit Datum, und bewusst kurz: was die Quelle liefert, kommt aus der
   * Quelle. Diese Liste ist der Rest, nicht der Regelfall. */
  var ERSATZ_AKTIEN = {
    META: { aktien: 2537000000, stand: '2026-07', sektor: 'Technologie', name: 'Meta Platforms' }
  };

  var stamm = null;          // Inhalt der Stammdatendatei
  /* KURS-ZWISCHENSPEICHER je Kuerzel (Fehler #79). Ohne ihn holte JEDE Filteraenderung
   * dieselben Kurse noch einmal: mkAnzahl und mkBranche hingen direkt an laden(), also
   * am vollen Netzabruf. Kurse haengen aber am Kuerzel, nicht am Filter - wer die
   * Branche wechselt, sieht dieselben Werte in anderer Auswahl. Bei 300 Werten waren
   * das hunderte Abrufe fuer nichts, und die Bedienung war entsprechend traege.
   * Fuenf Minuten Frische: die Karte ist eine Uebersicht, kein Handelssignal. */
  var KURSE = {};
  var KURS_FRISCH_MS = 5 * 60000;
  function kursFrisch(sym) {
    var c = KURSE[sym];
    return !!(c && c.kurs > 0 && Date.now() - c.at <= KURS_FRISCH_MS);
  }
  var laeuft = false;
  var letzterLauf = 0;
  var taktung = null;

  function brancheJetzt() {
    var s = document.getElementById('mkBranche');
    return s ? s.value : '';
  }

  /** Die Auswahlliste aus den Daten fuellen - eine Branche, die es nicht gibt,
   *  soll gar nicht erst waehlbar sein. Die Auswahl des Nutzers bleibt erhalten. */
  function branchenAnbieten(werte) {
    var s = document.getElementById('mkBranche');
    if (!s) return;
    var da = {};
    werte.forEach(function (w) { if (w.sektor) da[w.sektor] = (da[w.sektor] || 0) + 1; });
    var namen = Object.keys(da).sort();
    if (s.__stand === namen.join('|')) return;      // nichts Neues, Auswahl nicht anfassen
    s.__stand = namen.join('|');
    var war = s.value;
    s.innerHTML = '<option value="">alle Branchen</option>' + namen.map(function (n) {
      return '<option value="' + esc(n) + '">' + esc(n) + ' (' + da[n] + ')</option>';
    }).join('');
    if (namen.indexOf(war) !== -1) s.value = war;
  }

  var ARTEN = null;

  var ARTEN_FEHLER = '';            // sym -> Wertpapierart, einmal geholt
  var AKTIE = { CS: 1, ADRC: 1 };   // Unternehmensaktie und Hinterlegungsschein

  /** Die Wertpapierart eines Kuerzels - in DREI Schreibweisen nachgeschlagen.
   *  Das Archiv schreibt BAC-PL, die Klassifizierung BACpL; ohne diese eine
   *  Normalisierung galt jede Vorzugsaktie als unbekannt und rutschte durch. */
  function artVon(sym) {
    if (!ARTEN) return null;
    if (ARTEN[sym]) return ARTEN[sym];
    var p = sym.replace('-P', 'p');
    if (ARTEN[p]) return ARTEN[p];
    var q = sym.replace('-', '.');
    if (ARTEN[q]) return ARTEN[q];
    return null;
  }

  async function artenLaden() {
    if (ARTEN) return ARTEN;
    /* Ohne ARTEN umgeht auswahl() den Wertpapierart-Filter komplett: Vorzugsserien,
     * Indexfonds und Zertifikate erben dann wieder die Stueckzahl ihres Emittenten.
     * Die Karte zeigt Flaechen, die nichts bedeuten - und sagte es nicht. */
    if (!window.api || typeof window.api.marktWertpapierarten !== 'function') {
      ARTEN_FEHLER = 'Schnittstelle fehlt'; return null;
    }
    var r = await window.api.marktWertpapierarten();
    if (r && r.ok) { ARTEN = r.arten; ARTEN_FEHLER = ''; }
    else ARTEN_FEHLER = (r && r.msg) || 'Abruf fehlgeschlagen';
    return ARTEN;
  }

  function anzahlJetzt() {
    var s = document.getElementById('mkAnzahl');
    return s ? parseInt(s.value, 10) || 300 : 300;
  }

  /** Stammdaten lesen.
   *
   *  EIN FEHLSCHLAG WIRD NICHT ZWISCHENGESPEICHERT. Vorher stand auch das Fehlen im
   *  Speicher: startete die App, bevor stammdaten.json existierte, lieferte jeder
   *  weitere Versuch den gespeicherten Fehlschlag zurueck, ohne die Datei anzusehen -
   *  bis zum Neustart. Am 25.08.2026 kam die Datei um 12:08, und die Karte behauptete
   *  weiter "Noch keine Stammdaten"; kein Druecken half.
   *  Erfolg darf man sich merken (die Daten aendern sich selten). Ein Fehlen nicht -
   *  das kann sich jede Sekunde aendern. */
  async function stammLaden() {
    if (stamm && !stamm.fehlt) return stamm;
    if (!window.api || typeof window.api.marktStammdaten !== 'function') return null;
    var r = await window.api.marktStammdaten();
    if (!r || !r.ok) {
      stamm = null;                       // NICHT merken - beim naechsten Mal neu nachsehen
      return { fehlt: true, grund: (r && r.grund) || 'unbekannt', pfad: r && r.pfad };
    }
    stamm = r.daten || {};
    return stamm;
  }

  /** Welche Werte kommen ueberhaupt in Frage, und in welcher Reihenfolge?
   *  Der Startkurs aus dem Archiv dient NUR der Vorauswahl - er wird gleich darauf
   *  durch den Live-Kurs ersetzt. Ohne ihn muesste die Karte erst zweitausend Werte
   *  abrufen, bevor sie das erste Kaestchen zeichnen koennte. */
  function auswahl(n) {
    var werte = (stamm && stamm.werte) || {};
    var raus = [], ohneGroesse = 0, adr = 0;
    Object.keys(werte).forEach(function (sym) {
      var e = werte[sym];
      if (!e || !e.sektor) return;
      /* Auslaendische Emittenten fliegen raus: Ihre Stueckzahl sind Stammaktien,
       * gehandelt wird ein ADR, das mehrere davon buendelt. Das Verhaeltnis steht
       * nirgends - mal ADR-Kurs gerechnet waere die Firma um ein Vielfaches zu gross.
       * Lieber nicht zeigen als falsch zeigen. */
      if (e.auslaender) { adr++; return; }
      var aktien = e.aktien > 0 ? e.aktien : (ERSATZ_AKTIEN[sym] && ERSATZ_AKTIEN[sym].aktien);
      if (!(aktien > 0)) { ohneGroesse++; return; }
      raus.push({
        sym: sym, name: e.name || sym, sektor: e.sektor, aktien: aktien, cik: e.cik || null,
        ersatz: !(e.aktien > 0),
        vorrang: (e.startKurs > 0 ? e.startKurs : 1) * aktien
      });
    });
    Object.keys(ERSATZ_AKTIEN).forEach(function (sym) {
      if (werte[sym]) return;
      var e = ERSATZ_AKTIEN[sym];
      raus.push({ sym: sym, name: e.name, sektor: e.sektor, aktien: e.aktien, ersatz: true, vorrang: e.aktien });
    });
    /* NUR UNTERNEHMENSAKTIEN. Ohne diesen Filter bekam jede Vorzugsserie die
     * Stammaktien-Anzahl ihres Unternehmens - FNMFO (Vorzug von Fannie Mae) wurde so
     * zur groessten Kachel der ganzen Karte. Unklassifizierte werden hier bewusst
     * NICHT durchgelassen: auf einer Flaechenkarte behauptet ein unbekanntes Papier
     * mit geerbter Stueckzahl etwas Falsches, und zwar gross. */
    var keineAktie = 0;
    if (ARTEN) {
      raus = raus.filter(function (w) {
        var a = artVon(w.sym);
        if (a && AKTIE[a]) return true;
        keineAktie++;
        return false;
      });
    }

    /* EIN UNTERNEHMEN, EINE KACHEL. Die SEC fuehrt die Aktienanzahl je CIK, also je
     * Unternehmen - die Karte hing sie an jedes Kuerzel. Bank of America stand mit
     * 17 Kuerzeln da, jedes mit den vollen 6,99 Milliarden Aktien; Alphabet viermal.
     * Bei zwei Gattungen desselben Unternehmens (GOOGL/GOOG, UA/UAA) ist die
     * Stueckzahl ohnehin die GEMEINSAME - also gehoert sie genau einmal gezaehlt. */
    var doppelt = 0, jeCik = {};
    raus = raus.filter(function (w) {
      if (!w.cik) return true;
      if (!jeCik[w.cik]) { jeCik[w.cik] = w; return true; }
      doppelt++;
      /* Behalten wird das kuerzere Kuerzel - bei GOOGL/GOOG und UA/UAA ist das die
       * gebraeuchlichere Gattung. Eine Setzung, keine Messung; sie steht in der
       * Fusszeile. */
      if (w.sym.length < jeCik[w.cik].sym.length) {
        var alt = jeCik[w.cik];
        alt.verdraengt = true;
        jeCik[w.cik] = w;
        return true;
      }
      return false;
    }).filter(function (w) { return !w.verdraengt; });

    raus.sort(function (a, b) { return b.vorrang - a.vorrang; });
    return { liste: raus.slice(0, n), gesamt: raus.length, ohneGroesse: ohneGroesse,
             adr: adr, keineAktie: keineAktie, doppelt: doppelt };
  }

  /** Kurs und Tagesveraenderung. Ein Abruf je Wert liefert beides: Der Chart-Kopf
   *  traegt den aktuellen Kurs UND den Schluss des Vortages. */
  async function kurseHolen(liste, melde) {
    /* Erst abschoepfen, was die App schon weiss. Bei 300 Werten sind das die rund
     * hundert, die Kachelreihe und Intraday-Scanner ohnehin fuehren - hundert Abrufe
     * weniger, und die Zahlen sind so frisch wie der Rest der Oberflaeche. */
    var jetzt = Date.now();
    /* ERST der Zwischenspeicher. Das ist die eigentliche Abhilfe zu #79: nach einer
     * Filteraenderung sind praktisch alle Kuerzel schon bekannt, und die Karte zeichnet
     * ohne einen einzigen Abruf neu. */
    var ausSpeicher = 0;
    liste.forEach(function (w) {
      if (!kursFrisch(w.sym)) return;
      var c = KURSE[w.sym];
      w.kurs = c.kurs; w.pct = c.pct;
      w.groesse = c.kurs * w.aktien;
      w.ausSpeicher = true;
      ausSpeicher++;
    });
    var ausDerApp = 0;
    liste.forEach(function (w) {
      if (w.ausSpeicher) return;
      var k = kursAusDerApp(w.sym);
      if (!k) return;
      w.kurs = k.kurs; w.pct = k.pct;
      w.groesse = k.kurs * w.aktien;
      w.ausApp = true;
      KURSE[w.sym] = { kurs: k.kurs, pct: k.pct, at: jetzt };
      ausDerApp++;
    });
    var fertig = ausSpeicher + ausDerApp;
    if (fertig && melde) melde(fertig, liste.length);
    var K = window.Kurse;
    /* Frueher stand hier `return 0` - das haette den Zwischenspeicher unterschlagen
     * und die Karte als leer gemeldet, obwohl sie voll ist. */
    if (!K || typeof K.holeViele !== 'function') return liste.filter(function (w) { return w.groesse > 0; }).length;

    /* SAMMELABRUF statt Einzelabrufen (25.08.2026). Hier lief eine Schleife ueber sechs
     * Bahnen mit EINEM Netzabruf JE WERT. Bei der Vorgabe von 600 Werten waren das
     * sechshundert Anfragen fuer ein Bild - der Grund, warum die Karte traege war und
     * nicht im Hintergrund laufen durfte.
     *
     * /v7/finance/quote nimmt viele Kuerzel auf einmal; der Hauptprozess blockt bei 400.
     * Nachgemessen am 25.08.2026: 800 Kuerzel in EINER Anfrage, 3,4 s. 600 Werte kosten
     * damit zwei Anfragen statt sechshundert. */
    var offen = liste.filter(function (w) { return !w.ausSpeicher && !w.ausApp; });
    if (!offen.length) return liste.filter(function (w) { return w.groesse > 0; }).length;
    var r = await K.holeViele(offen.map(function (w) { return w.sym; }));
    if (!r || !r.ok) {
      /* Ein gescheiterter Sammelabruf darf nicht wie eine leere Karte aussehen. Was aus
       * Zwischenspeicher und App kam, bleibt stehen; der Grund wandert nach oben, statt
       * in einer stillen Null zu verschwinden. */
      kurseHolen.letzterGrund = (r && r.grund) || 'unbekannt';
      return liste.filter(function (w) { return w.groesse > 0; }).length;
    }
    kurseHolen.letzterGrund = '';
    var nun = Date.now();
    offen.forEach(function (w) {
      var q = r.kurse[w.sym];
      if (!q || !(q.kurs > 0)) return;
      w.kurs = q.kurs;
      /* Yahoo liefert die Prozentzahl mit; nur wenn sie fehlt, wird sie aus dem
       * Vortagesschluss gerechnet. Fehlt auch der, bleibt sie null - eine unbekannte
       * Veraenderung ist unbekannt, nicht null Prozent. */
      w.pct = q.pct != null ? q.pct : (q.vorher > 0 ? (q.kurs / q.vorher - 1) * 100 : null);
      w.groesse = q.kurs * w.aktien;
      KURSE[w.sym] = { kurs: w.kurs, pct: w.pct, at: nun };
    });
    if (melde) melde(liste.length, liste.length);
    return liste.filter(function (w) { return w.groesse > 0; }).length;
  }

  /** Der Kurs, den die App OHNEHIN schon hat - erst danach wird das Netz bemueht.
   *  Die Kachelreihe fuehrt die Dashboard-Werte live nach, der Intraday-Scanner
   *  seine ganze Handelsliste. Beides ist frischer als ein eigener Abruf und kostet
   *  nichts. (Wilhelm: "Koennen wir uns die live daten nicht aus der datenquelle der
   *  intraday strategie ziehen?") */
  function kursAusDerApp(sym) {
    var q = window.Dash && window.Dash.quote ? window.Dash.quote(sym) : null;
    if (q && q.price != null && q.pct != null) return { kurs: q.price, pct: q.pct };
    var d = window.DepotAPI && window.DepotAPI.letzterKurs ? window.DepotAPI.letzterKurs(sym) : null;
    if (d && d.kurs > 0) return d;
    return null;
  }

  function zeichnen(werte, info) {
    var kasten = document.getElementById('mkKarte');
    if (!kasten) return;
    var b = kasten.clientWidth || 900;
    var h = kasten.clientHeight || 620;
    var karte = window.Marktkarte.baue(werte, b, h, { rand: 3, kopf: 15 });
    var teile = [];
    karte.forEach(function (s) {
      teile.push('<div style="position:absolute; left:' + s.x.toFixed(1) + 'px; top:' + s.y.toFixed(1) +
        'px; width:' + s.b.toFixed(1) + 'px; height:' + s.h.toFixed(1) + 'px; ' +
        'box-sizing:border-box; padding:1px 4px; font-size:var(--fs-klein); color:var(--muted); ' +
        'white-space:nowrap; overflow:hidden; pointer-events:none;">' + esc(s.sektor) + '</div>');
      s.kinder.forEach(function (k) {
        var d = k.daten;
        var f = window.Marktkarte.farbe(d.pct);
        var klein = k.b < 34 || k.h < 22;
        var titel = d.sym + ' · ' + d.name + ' · ' + (d.pct == null ? 'kein Kurs' :
          (d.pct >= 0 ? '+' : '') + d.pct.toFixed(2) + ' %') + (d.ersatz ? ' · Stückzahl handgepflegt' : '');
        /* Anklickbar (Wilhelm, 25.08.2026). Ein echter Knopf statt eines div mit
         * Klick-Behandlung: so kommt man auch mit der Tastatur hin, und der Browser
         * kennt den Zustand "gedrueckt" von selbst. */
        teile.push('<button type="button" data-mksym="' + esc(d.sym) + '" data-mkname="' + esc(d.name || d.sym) +
          '" title="' + esc(titel + ' · Klick öffnet den Aktien-Explorer') + '" style="position:absolute; left:' + k.x.toFixed(1) +
          'px; top:' + k.y.toFixed(1) + 'px; width:' + Math.max(0, k.b - 1).toFixed(1) +
          'px; height:' + Math.max(0, k.h - 1).toFixed(1) + 'px; background:rgb(' + f.rgb.join(',') + '); ' +
          'color:' + f.text + '; box-sizing:border-box; overflow:hidden; border-radius:var(--r-klein); ' +
          'display:flex; flex-direction:column; align-items:center; justify-content:center; ' +
          /* Zwei Stufen der Schriftleiter, keine eigenen Zahlen: Die Sperrklinke aus
           * Abschnitt 44 sieht nur nackte Pixelzahlen im Quelltext - eine per
           * Verkettung gebaute waere ihr entgangen. Genau so waechst die Zahl der
           * Groessen wieder nach, gegen die sie gebaut wurde. */
          'font-size:var(' + (k.b > 70 && k.h > 44 ? '--fs-neben' : '--fs-klein') + '); line-height:1.15; ' +
          'border:0; padding:0; font-family:inherit; cursor:pointer;">' +
          (klein ? '' : '<b>' + esc(d.sym) + '</b>' +
            (k.h > 30 ? '<span>' + (d.pct == null ? '–' : (d.pct >= 0 ? '+' : '') + d.pct.toFixed(1) + ' %') + '</span>' : '')) +
          '</button>');
      });
    });
    kasten.innerHTML = teile.join('');
    /* Ein einziger Zuhoerer am Kasten statt hunderter an den Kaestchen - bei 600
     * Werten ist das der Unterschied zwischen fluessig und zaeh. */
    if (!kasten.__klickBereit) {
      kasten.__klickBereit = true;
      kasten.addEventListener('click', function (ev) {
        var b = ev.target && ev.target.closest ? ev.target.closest('[data-mksym]') : null;
        if (!b) return;
        if (window.Explorer && window.Explorer.oeffne) {
          window.Explorer.oeffne(b.getAttribute('data-mksym'), b.getAttribute('data-mkname'));
        }
      });
    }

    var fuss = document.getElementById('mkFuss');
    var artenHinweis = (!ARTEN && ARTEN_FEHLER)
      ? '<b>Ohne Klassifizierung der Wertpapierarten</b> (' + esc(ARTEN_FEHLER) + '): Vorzugsserien, Fonds und Zertifikate sind NICHT herausgefiltert und erben die Größe ihres Emittenten. '
      : '';
    if (fuss) {
      fuss.innerHTML =
        artenHinweis +
        '<b>Fläche</b> = Kurs × Aktienanzahl, bei jeder Aktualisierung neu gerechnet. ' +
        '<b>Farbe</b> = Veränderung zum Vortagesschluss, gedeckelt bei ±' + window.Marktkarte.DECKEL + ' %. ' +
        'Gruppiert nach Branche aus dem SIC-Code der SEC.<br>' +
        'Gezeigt: ' + info.gezeichnet + ' von ' + info.gesamt + ' Werten mit Stammdaten' +
        (info.ausApp ? ' (' + info.ausApp + ' davon aus laufenden Kursen der App, ohne eigenen Abruf' +
          (info.ausSpeicher ? ', ' + info.ausSpeicher + ' aus dem Zwischenspeicher' : '') + ')'
          : (info.ausSpeicher ? ' (' + info.ausSpeicher + ' davon aus dem Zwischenspeicher, ohne Abruf)' : '')) + '. ' +
        (info.adr ? 'Nicht gezeigt: ' + info.adr + ' ausländische Emittenten – ihre Stückzahl sind Stammaktien, ' +
          'gehandelt wird ein ADR aus mehreren davon, und das Verhältnis steht in den Daten nicht. ' : '') +
        (info.ohneGroesse ? info.ohneGroesse + ' ohne Stückzahl in den SEC-Daten. ' : '') +
        (info.keineAktie ? 'Nicht gezeigt: ' + info.keineAktie + ' Papiere, die keine Unternehmensaktien sind ' +
          '(Vorzüge, Indexfonds, Zertifikate) – sie tragen die Stückzahl ihres Emittenten und wären sonst ' +
          'riesige Kacheln. ' : '') +
        (info.doppelt ? info.doppelt + ' weitere Gattungen desselben Unternehmens zusammengefasst – die ' +
          'Aktienanzahl der SEC gilt je Unternehmen, nicht je Kürzel. ' : '') +
        '<br>Das ist eine <b>Übersicht</b>, kein Signal: An dieser Karte ist nichts gemessen. ' +
        'Sie sortiert nicht nach „bestem Sektor“ und hebt nichts hervor – das sähe nach einem Befund aus und wäre keiner.';
    }
  }

  /* ---------- Wenn die Stammdaten fehlen ----------
   * Frueher stand hier nur ein Befehl fuer die Kommandozeile. Das war eine Sackgasse
   * fuer jeden, der keine Entwicklungsumgebung hat - genau die, die schon beim Reiter
   * "Messung" eine war. Die Begruendung dafuer war ausserdem schief: Die Regel des
   * Projekts verbietet einen Netzwerkpfad zu KOSTENPFLICHTIGEN Schnittstellen. Die
   * SEC ist kostenlos und braucht keinen Schluessel.
   * Der Befehl bleibt daneben stehen - fuer den Massenlauf ueber das ganze Archiv ist
   * er weiterhin der bessere Weg. */
  function fehlenAnbieten(st) {
    var kasten = document.getElementById('mkKarte');
    var kann = window.api && typeof window.api.marktSecBasis === 'function';
    kasten.innerHTML = '<div style="padding:14px; font-size:var(--fs-neben); line-height:1.65; max-width:76ch;">' +
      '<b>Noch keine Stammdaten.</b> Die Karte braucht je Wert die Branche und die Anzahl ' +
      'ausstehender Aktien – beides kommt von der US-Börsenaufsicht und ändert sich im ' +
      'Jahresrhythmus.<br>' +
      (kann
        ? '<div style="margin:12px 0;"><button class="btn" type="button" id="mkHolen">Jetzt holen</button> ' +
          '<span id="mkHolStatus" role="status" aria-live="polite" style="font-size:var(--fs-neben); color:var(--muted); margin-left:8px;"></span></div>' +
          '<div style="color:var(--muted);">Das dauert einmalig ein bis zwei Minuten: erst drei Sammelabrufe, ' +
          'dann die Kurse für die Rangfolge, dann die Branche für die Werte, die die Karte zeigt. ' +
          'Danach nie wieder – die Datei bleibt liegen.</div>'
        : '<div style="color:var(--muted); margin:12px 0;">Diese Programmfassung kann es noch nicht selbst holen.</div>') +
      '<div style="color:var(--muted); margin-top:10px;">Für das ganze Archiv auf einmal ist das Werkzeug ' +
      'daneben der bessere Weg – es nimmt alle Werte des 60m-Archivs statt nur der gezeigten:<br>' +
      '<code>node tools/stammdaten-holen.js</code>   (ohne Archiv: <code>--alle</code>)</div>' +
      (st && st.grund ? '<div style="color:var(--muted); margin-top:8px; font-size:var(--fs-klein);">' + esc(st.grund) + '</div>' : '') +
      '</div>';
    var k = document.getElementById('mkHolen');
    if (k) k.addEventListener('click', holen);
  }

  /** Der Abruf aus der App. Die Arbeitsteilung ist dieselbe wie im Werkzeug, nur
   *  laeuft die Rangfolge hier ueber echte Kurse: Der Hauptprozess holt bei der SEC,
   *  der Renderer holt die Kurse, und erst danach steht fest, welche Werte ueberhaupt
   *  eine Branche brauchen. Das spart den teuren Teil fuer tausende Firmen, die auf
   *  der Karte ohnehin nie erscheinen. */
  async function holen() {
    var k = document.getElementById('mkHolen');
    var hs = document.getElementById('mkHolStatus');
    function sagH(t) { if (hs) hs.textContent = t; }
    if (k) k.disabled = true;
    try {
      sagH('Sammelabruf bei der SEC …');
      var b = await window.api.marktSecBasis();
      if (!b || !b.ok) { sagH('Fehlgeschlagen: ' + ((b && b.grund) || 'unbekannt')); if (k) k.disabled = false; return; }
      var kand = b.kandidaten || [];
      if (!kand.length) { sagH('Die SEC lieferte keine Stückzahlen.'); if (k) k.disabled = false; return; }

      sagH(kand.length + ' Firmen mit Stückzahl. Kurse für die Rangfolge …');
      var liste = kand.map(function (x) { return { sym: x.sym, aktien: x.aktien }; });
      await kurseHolen(liste, function (f, g) { sagH('Kurse: ' + f + ' von ' + g + ' …'); });
      var mitKurs = liste.filter(function (w) { return w.groesse > 0; })
        .sort(function (a, c) { return c.groesse - a.groesse; });
      /* Der Deckel folgt der Auswahl. Vorher stand hier fest 900, und weil der
       * Abruf mit "die 100 groessten" lief, standen dauerhaft nur 200 Werte in der
       * Datei - auch fuer jede spaetere, groessere Auswahl. Die 4.000 sind die
       * Groessenordnung dessen, was die SEC ueberhaupt mit Stueckzahl fuehrt. */
      var wieViele = Math.min(Math.max(anzahlJetzt(), 100) * 2, 4000);
      var top = mitKurs.slice(0, wieViele).map(function (w) { return w.sym; });
      if (!top.length) { sagH('Keine Kurse bekommen – Netz?'); if (k) k.disabled = false; return; }

      sagH('Branche für ' + top.length + ' Werte …');
      var r = await window.api.marktSecBranchen(top);
      if (!r || !r.ok) { sagH('Fehlgeschlagen: ' + ((r && r.grund) || 'unbekannt')); if (k) k.disabled = false; return; }
      stamm = r.daten;
      sagH('Fertig: ' + r.mitGroesse + ' Werte mit Größe.');
      await laden();
    } catch (e) {
      sagH('Fehler: ' + (e && e.message || e));
      if (k) k.disabled = false;
    }
  }

  async function laden() {
    if (laeuft) return;
    laeuft = true;
    var stand = document.getElementById('mkStand');
    var kasten = document.getElementById('mkKarte');
    function sag(t) { if (stand) stand.textContent = t; }
    try {
      sag('Stammdaten lesen …');
      await artenLaden();
      var st = await stammLaden();
      if (!st || st.fehlt) { fehlenAnbieten(st); sag(''); return; }
      var a = auswahl(anzahlJetzt());
      /* Die Auswahlliste wird aus der VOLLEN Menge gefuellt, nicht aus der gefilterten -
       * sonst verschwaende die eigene Branche aus der Liste, sobald man sie waehlt. */
      branchenAnbieten(a.liste);
      var nurBranche = brancheJetzt();
      if (nurBranche) a.liste = a.liste.filter(function (w) { return w.sektor === nurBranche; });
      if (!a.liste.length) {
        kasten.innerHTML = '<div style="padding:14px;">Keine Werte mit Branche und Stückzahl gefunden.</div>';
        sag('');
        return;
      }
      /* Das Flackern von "Kurse holen: 0 von 300" bei jeder Filteraenderung war Teil
       * des traegen Eindrucks - auch dann, wenn gar nichts geholt werden musste. */
      var offen = a.liste.filter(function (w) { return !kursFrisch(w.sym); }).length;
      if (offen) sag('Kurse holen: 0 von ' + offen + ' …');
      var n = await kurseHolen(a.liste, function (f, g) {
        if (offen) sag('Kurse holen: ' + f + ' von ' + g + ' …');
      });
      var mitKurs = a.liste.filter(function (w) { return w.groesse > 0; });
      var ausApp = a.liste.filter(function (w) { return w.ausApp; }).length;
      var ausSpeicher = a.liste.filter(function (w) { return w.ausSpeicher; }).length;
      /* keineAktie und doppelt fehlten hier - die beiden Fusszeilen-Saetze, die den
       * Filter belegen wuerden, waren damit dauerhaft unerreichbar (info.keineAktie
       * war immer undefined). Der Filter arbeitete, konnte es aber nicht zeigen. */
      zeichnen(mitKurs, { gezeichnet: n, gesamt: a.gesamt, adr: a.adr, ohneGroesse: a.ohneGroesse,
        ausApp: ausApp, ausSpeicher: ausSpeicher, keineAktie: a.keineAktie, doppelt: a.doppelt });
      letzterLauf = Date.now();
      sag('Stand: ' + new Date(letzterLauf).toLocaleTimeString('de-DE') +
        (kurseHolen.letzterGrund ? ' · Kursabruf gescheitert: ' + kurseHolen.letzterGrund : ''));
    } catch (e) {
      sag('Fehler: ' + (e && e.message || e));
    } finally { laeuft = false; }
  }

  function taktenAn() {
    if (taktung) return;
    /* FUENF MINUTEN, auch waehrend des Handels (Wunsch aus Fehler #79: "alle 5 min
     * im hintergrund laden und aktualisieren"). Vorher war es eine Minute waehrend
     * der US-Sitzung; zusammen mit dem Zwischenspeicher, der ebenfalls fuenf Minuten
     * haelt, waere das nur doppelte Arbeit gewesen. Die Karte ist eine Uebersicht,
     * kein Handelssignal - fuenf Minuten Alter sind hier ohne Belang.
     *
     * UND JETZT AUCH IM HINTERGRUND (Wunsch aus #79). Das ging vorher nicht, weil 600
     * EINZELabrufe je Runde eine Drosselung riskiert haetten - die haette den
     * Intraday-Scanner mitgetroffen, der dieselbe Quelle benutzt. Mit dem Sammelabruf
     * sind es zwei Anfragen je Runde: weniger als eine einzige Kachelreihe.
     * Ausgesetzt wird nur, wenn das Fenster gar nicht sichtbar ist - dann sieht
     * ohnehin niemand hin, und der Zwischenspeicher haelt den Stand bis zum Aufwachen. */
    taktung = setInterval(function () {
      if (document.hidden) return;
      if (Date.now() - letzterLauf >= KURS_FRISCH_MS) laden();
    }, 20000);
  }

  if (window.api && typeof window.api.onMarktSecFortschritt === 'function') {
    window.api.onMarktSecFortschritt(function (d) {
      var hs = document.getElementById('mkHolStatus');
      if (!hs || !d) return;
      hs.textContent = (d.art === 'branche' ? 'Branche' : 'Stückzahl nachholen') +
        ': ' + d.fertig + ' von ' + d.gesamt + ' …';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var anz = document.getElementById('mkAnzahl');
    if (anz) anz.addEventListener('change', laden);
    var br = document.getElementById('mkBranche');
    if (br) br.addEventListener('change', laden);
    document.addEventListener('tab-changed', function (ev) {
      if (ev.detail !== 'marktkarte') return;
      taktenAn();
      if (!letzterLauf) laden();
    });
    /* BEIM START laden, nicht erst beim ersten Reiterwechsel (Wilhelm: "er soll es
     * beim app start laden und dann live weiter führen"). Die 12 Sekunden Vorlauf
     * sind kein Zieren: davor holt die Kachelreihe ihre Kurse, und genau die schoepft
     * die Karte ab. Wer frueher startet, holt dieselben Kurse ein zweites Mal.
     * Getaktet wird danach ohnehin - eine Minute waehrend des Handels, sonst fuenf. */
    setTimeout(function () { if (!letzterLauf) laden(); }, 12000);
    taktenAn();
  });
  window.__marktkarteLaden = laden;
})();
