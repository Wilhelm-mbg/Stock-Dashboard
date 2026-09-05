'use strict';
/* ================= Chart-Einstellungen: die Vorgaben und ihre Ableitung =========
 *
 * Wozu es diese Datei gibt (Aktien-Viewer 8b, 05.09.2026): Der Chart bekommt einen
 * Einstellungen-Dialog nach TradingView-Muster - Farben, Darstellung, Skala,
 * Zeitachse, Ereignisse. Damit stehen ploetzlich vier Dutzend Vorgaben im Programm,
 * und jede von ihnen koennte an DREI Stellen stehen: im Markup als value="...", im
 * Renderer als Literal und im Speicher als gemerkter Wert.
 *
 * Genau das ist im Schein-Finder schon einmal passiert (sechs Zahlen im Markup, die
 * die Voreinstellungs-Tabelle ein zweites Mal wiederholen musste). Deshalb:
 *   - Die Vorgaben stehen HIER, an einer Stelle (VORGABE).
 *   - Das Markup traegt keine einzige Zahl und keine einzige Farbe.
 *   - Der Renderer traegt keine Farbe und kein Format: er reicht optionen() an
 *     KerzenChart.zeichnen() weiter.
 *
 * Diese Datei hat kein window, kein document, kein Netz, keinen Speicher. Sie
 * entscheidet nichts ueber Daten und bewertet nichts - sie sagt nur, WIE gezeichnet
 * wird. Alles Simulation, keine Anlageberatung.
 *
 * ZWEI THEMEN, ZWEI FARBSAETZE - und das ist keine Bequemlichkeit, sondern Rechnung.
 * Eine einzige Farbe kann auf hellem UND dunklem Grund nicht 4,5:1 halten: gegen
 * --panel (hell, Leuchte 0,878) braucht sie eine Leuchte unter 0,156, gegen --panel
 * (dunkel, Leuchte 0,016) eine ueber 0,247. Die beiden Bedingungen schliessen
 * einander aus. Deshalb liegen die Farben unter `farben.hell` und `farben.dunkel`,
 * und die Vorgaben sind die Semantikfarben der App (--up/--down des jeweiligen
 * Themas) - eine Klinke haelt sie gegen index.html, damit sie nicht auseinander
 * laufen.
 *
 * UNBEKANNT IST UNBEKANNT: gueltig() sagt bei jedem Fehler, WELCHES Feld und WARUM.
 * Ein Einstellungsobjekt, das nicht durchkommt, wird nicht halb uebernommen.
 */
(function (root) {

  /* ---------------------------------------------------------------------------
   * 1) Die Woerter, aus denen die Auswahllisten gebaut werden
   *
   * Auch sie stehen nur hier: der Dialog baut seine <select> daraus, test-v6
   * prueft dagegen, und ein Wert, den diese Tabellen nicht kennen, kommt durch
   * gueltig() nicht hindurch. */

  /* Zeitzonen. Der Schluessel steht im Speicher, die IANA-Zone geht an Intl, der
   * Text in den Dialog. New York ist die Vorgabe, weil die App US-Werte fuehrt. */
  var ZEITZONEN = [
    { wert: 'boerse', zone: 'America/New_York', text: 'Börse New York' },
    { wert: 'berlin', zone: 'Europe/Berlin', text: 'Berlin' },
    { wert: 'utc', zone: 'UTC', text: 'UTC' }
  ];
  var DARSTELLUNGEN = [
    { wert: 'kerzen', text: 'Kerzen' },
    { wert: 'balken', text: 'Balken' },
    { wert: 'linie', text: 'Linie' },
    { wert: 'flaeche', text: 'Fläche' }
  ];
  var TITELARTEN = [
    { wert: 'name', text: 'Name' },
    { wert: 'kuerzel', text: 'Kürzel' },
    { wert: 'beides', text: 'Beides' }
  ];
  var SKALENMODI = [
    { wert: 'linear', text: 'Linear' },
    { wert: 'log', text: 'Logarithmisch' },
    { wert: 'prozent', text: 'Prozentual' }
  ];
  var PLATZIERUNGEN = [
    { wert: 'rechts', text: 'Rechts' },
    { wert: 'links', text: 'Links' },
    { wert: 'beide', text: 'Beide Seiten' }
  ];
  var LINIENARTEN = [
    { wert: 'voll', text: 'Durchgezogen', muster: [] },
    { wert: 'gestrichelt', text: 'Gestrichelt', muster: [6, 4] },
    { wert: 'gepunktet', text: 'Gepunktet', muster: [2, 3] }
  ];
  /* Drei Muster, mehr nicht - jedes weitere waere eine Wahl ohne Frage dahinter. */
  var DATUMSFORMATE = [
    { wert: 'tt.mm.jj', text: '05.09.26' },
    { wert: 'tt.mm.jjjj', text: '05.09.2026' },
    { wert: 'jjjj-mm-tt', text: '2026-09-05' }
  ];
  /* 'auto' heisst: so viele Stellen, wie die Kurse brauchen - gezaehlt ueber die
   * sichtbaren Werte, mit einem Boden (Cent bzw. vier Stellen unter einem Dollar).
   * Die genaue Regel steht bei stellenAusKurs(). Die Zahlen daneben sind die feste
   * Wahl; mehr als sechs Stellen zeigt kein Kurs. */
  var PRAEZISIONEN = ['auto', 0, 1, 2, 3, 4, 5, 6];
  var PRAEZISION_MAX = 6;
  /* So viele Nachrichten-Marken hoechstens - eine Nachrichtenwand am Chart waere
   * keine Information mehr. Dieselbe Zahl, die der Viewer ohnehin holt. */
  var NACHRICHTEN_MAX = 8;
  /* So lang darf der Name einer eigenen Vorlage sein. Die Zahl steht hier und
   * NICHT als maxlength im Markup - sonst gaebe es sie zweimal. */
  var VORLAGE_NAME_MAX = 40;

  /* Die Semantikfarben der App, je Thema. Sie stehen hier als Zahl, weil ein reines
   * Modul kein Stylesheet lesen kann - und eine Klinke haelt sie gegen die Token
   * --up/--down in index.html, damit aus zwei Orten nicht zwei Wahrheiten werden. */
  var FARBEN_HELL = {
    aufKoerper: '#006300', aufRahmen: '#006300', aufDocht: '#006300',
    abKoerper: '#c42b2b', abRahmen: '#c42b2b', abDocht: '#c42b2b',
    kurslinie: '#52514e', ausserboerslich: '#6b6963'
  };
  var FARBEN_DUNKEL = {
    aufKoerper: '#0ea50e', aufRahmen: '#0ea50e', aufDocht: '#0ea50e',
    abKoerper: '#e05e5e', abRahmen: '#e05e5e', abDocht: '#e05e5e',
    kurslinie: '#c3c2b7', ausserboerslich: '#918f89'
  };
  var FARBFELDER = Object.keys(FARBEN_HELL);
  var THEMEN = ['hell', 'dunkel'];

  /* ---------------------------------------------------------------------------
   * 2) DIE VORGABEN - die eine Stelle
   *
   * Wer hier etwas aendert, aendert es ueberall: im Dialog, im Chart, im
   * Zuruecksetzen und in der Vorlage "Standard". */
  var VORGABE = {
    fassung: 1,
    symbol: {
      darstellung: 'kerzen',
      nachVortag: false,        // faerbt gegen den Vortagesschluss statt gegen die Eroeffnung
      praezision: 'auto',
      zeitzone: 'boerse'
    },
    farben: { hell: FARBEN_HELL, dunkel: FARBEN_DUNKEL },
    statuszeile: {
      titel: 'beides',
      ohlc: true,
      aenderung: true,
      volumen: true,
      indikatorTitel: true,
      indikatorWerte: true,
      hintergrund: true,
      deckkraft: 0.75,
      letzteSitzung: false
    },
    skala: {
      einheit: true,            // Waehrung/Einheit an der Preisskala
      modus: 'linear',
      platzierung: 'rechts',
      keineUeberlappung: true,
      countdown: true,          // Countdown zur naechsten Kerze an der Kurslinie
      kurslinie: true,
      kurslinieArt: 'gestrichelt',
      ausserboerslich: true,    // Vor-/Nachboersen-Linie
      hochTief: false,          // Hoch/Tief des Zeitraums
      indikatorWerte: true,
      bidAsk: false
    },
    zeit: {
      wochentag: false,
      datumsformat: 'tt.mm.jj',
      stunden12: false,
      linkenRandBehalten: true  // der Schalter zu dem Verhalten aus 8a
    },
    ereignisse: {
      dividenden: true,
      splits: true,
      earnings: true,
      earningsLinie: false,
      nachrichten: false
    }
  };

  /* ---------------------------------------------------------------------------
   * 2b) DIE FELDTABELLE - woraus der Dialog gebaut wird
   *
   * Der Dialog baut jeden Schalter, jede Liste und jedes Farbfeld aus dieser
   * Tabelle; er kennt keinen einzigen Feldnamen selbst. Damit kann er nicht von
   * den Einstellungen abdriften - und genau das ist im UI-Audit schon einmal
   * passiert (sechs Schalter ohne Wirkung, weil sie im Markup standen und im
   * Programm niemand mehr nach ihnen sah).
   *
   * Eine Klinke haelt beide Richtungen: jedes Feld hier zeigt auf eine Vorgabe,
   * die es gibt, UND jede Vorgabe wird von genau einem Feld bedient. Ein
   * vergessener Schalter faellt damit ebenso auf wie ein toter.
   *
   * `art` sagt, welches Bedienelement gebaut wird:
   *   schalter    Haken            pfad -> Wahrheitswert
   *   liste       Auswahlliste     pfad -> Wert aus `liste`
   *   farbe       Farbfeld         feld -> farben.<Thema>.<feld>
   *   deckkraft   Regler 0..1      pfad -> Zahl
   *   praezision  Auswahlliste     pfad -> 'auto' oder 0..6
   */
  var REITER = [
    { wert: 'symbol', text: 'Symbol' },
    { wert: 'statuszeile', text: 'Statuszeile' },
    { wert: 'skala', text: 'Skala und Linien' },
    { wert: 'ereignisse', text: 'Ereignisse' }
  ];

  var FELDER = [
    /* --- Symbol --- */
    { reiter: 'symbol', art: 'liste', pfad: 'symbol.darstellung', liste: 'DARSTELLUNGEN', text: 'Darstellung' },
    { reiter: 'symbol', art: 'farbe', feld: 'aufKoerper', text: 'Steigend: Körper' },
    { reiter: 'symbol', art: 'farbe', feld: 'aufRahmen', text: 'Steigend: Rahmen' },
    { reiter: 'symbol', art: 'farbe', feld: 'aufDocht', text: 'Steigend: Docht' },
    { reiter: 'symbol', art: 'farbe', feld: 'abKoerper', text: 'Fallend: Körper' },
    { reiter: 'symbol', art: 'farbe', feld: 'abRahmen', text: 'Fallend: Rahmen' },
    { reiter: 'symbol', art: 'farbe', feld: 'abDocht', text: 'Fallend: Docht' },
    { reiter: 'symbol', art: 'schalter', pfad: 'symbol.nachVortag', text: 'Balken nach Vortagesschluss färben',
      hilfe: 'Sonst entscheidet die Eröffnung derselben Kerze über die Farbe.' },
    { reiter: 'symbol', art: 'praezision', pfad: 'symbol.praezision', text: 'Präzision' },
    { reiter: 'symbol', art: 'liste', pfad: 'symbol.zeitzone', liste: 'ZEITZONEN', text: 'Zeitzone' },

    /* --- Statuszeile --- */
    { reiter: 'statuszeile', art: 'liste', pfad: 'statuszeile.titel', liste: 'TITELARTEN', text: 'Titel' },
    { reiter: 'statuszeile', art: 'schalter', pfad: 'statuszeile.ohlc', text: 'OHLC-Werte' },
    { reiter: 'statuszeile', art: 'schalter', pfad: 'statuszeile.aenderung', text: 'Änderung je Kerze' },
    { reiter: 'statuszeile', art: 'schalter', pfad: 'statuszeile.volumen', text: 'Volumen' },
    { reiter: 'statuszeile', art: 'schalter', pfad: 'statuszeile.indikatorTitel', text: 'Indikator-Titel' },
    { reiter: 'statuszeile', art: 'schalter', pfad: 'statuszeile.indikatorWerte', text: 'Indikator-Werte' },
    { reiter: 'statuszeile', art: 'schalter', pfad: 'statuszeile.hintergrund', text: 'Hintergrund der Zeile' },
    { reiter: 'statuszeile', art: 'deckkraft', pfad: 'statuszeile.deckkraft', text: 'Deckkraft des Hintergrunds' },
    { reiter: 'statuszeile', art: 'schalter', pfad: 'statuszeile.letzteSitzung', text: 'Werte der letzten Sitzung',
      hilfe: 'Schluss, Änderung und Spanne der zuletzt abgeschlossenen Sitzung.' },

    /* --- Skala und Linien --- */
    { reiter: 'skala', art: 'schalter', pfad: 'skala.einheit', text: 'Währung/Einheit an der Preisskala' },
    { reiter: 'skala', art: 'liste', pfad: 'skala.modus', liste: 'SKALENMODI', text: 'Skalenmodus' },
    { reiter: 'skala', art: 'liste', pfad: 'skala.platzierung', liste: 'PLATZIERUNGEN', text: 'Platzierung' },
    { reiter: 'skala', art: 'schalter', pfad: 'skala.keineUeberlappung', text: 'Keine überlappenden Beschriftungen' },
    { reiter: 'skala', art: 'schalter', pfad: 'skala.countdown', text: 'Countdown zur nächsten Kerze',
      hilfe: 'Nur während der Sitzung; gerechnet aus Kerzenlänge und Uhr.' },
    { reiter: 'skala', art: 'schalter', pfad: 'skala.kurslinie', text: 'Kurslinie des Symbols' },
    { reiter: 'skala', art: 'farbe', feld: 'kurslinie', text: 'Farbe der Kurslinie' },
    { reiter: 'skala', art: 'liste', pfad: 'skala.kurslinieArt', liste: 'LINIENARTEN', text: 'Linienart der Kurslinie' },
    { reiter: 'skala', art: 'schalter', pfad: 'skala.ausserboerslich', text: 'Vor-/Nachbörsen-Linie' },
    { reiter: 'skala', art: 'farbe', feld: 'ausserboerslich', text: 'Farbe der Vor-/Nachbörsen-Linie' },
    { reiter: 'skala', art: 'schalter', pfad: 'skala.hochTief', text: 'Hoch/Tief des Zeitraums' },
    { reiter: 'skala', art: 'schalter', pfad: 'skala.indikatorWerte', text: 'Indikatorwerte an der Skala' },
    { reiter: 'skala', art: 'schalter', pfad: 'skala.bidAsk', text: 'Geld-/Briefkurs' },
    { reiter: 'skala', art: 'schalter', pfad: 'zeit.wochentag', text: 'Wochentag in der Beschriftung' },
    { reiter: 'skala', art: 'liste', pfad: 'zeit.datumsformat', liste: 'DATUMSFORMATE', text: 'Datumsformat' },
    { reiter: 'skala', art: 'schalter', pfad: 'zeit.stunden12', text: '12-Stunden-Uhr' },
    { reiter: 'skala', art: 'schalter', pfad: 'zeit.linkenRandBehalten', text: 'Linken Rand beim Kerzenwechsel behalten' },

    /* --- Ereignisse --- */
    { reiter: 'ereignisse', art: 'schalter', pfad: 'ereignisse.dividenden', text: 'Dividenden' },
    { reiter: 'ereignisse', art: 'schalter', pfad: 'ereignisse.splits', text: 'Splits' },
    { reiter: 'ereignisse', art: 'schalter', pfad: 'ereignisse.earnings', text: 'Quartalszahlen' },
    { reiter: 'ereignisse', art: 'schalter', pfad: 'ereignisse.earningsLinie', text: 'Quartalszahlen als vertikale Linie' },
    { reiter: 'ereignisse', art: 'schalter', pfad: 'ereignisse.nachrichten', text: 'Letzte Nachrichten' }
  ];

  /** Einen Wert aus dem Einstellungsobjekt holen bzw. setzen - der Dialog kennt
   *  nur den Pfad aus der Tabelle, nie die Struktur. */
  function lies(e, pfad) {
    var t = String(pfad).split('.'), o = e;
    for (var i = 0; i < t.length; i++) {
      if (!o || typeof o !== 'object') return undefined;
      o = o[t[i]];
    }
    return o;
  }
  function schreib(e, pfad, wert) {
    var t = String(pfad).split('.'), o = e;
    for (var i = 0; i < t.length - 1; i++) {
      if (!o || typeof o !== 'object') return false;
      o = o[t[i]];
    }
    if (!o || typeof o !== 'object') return false;
    o[t[t.length - 1]] = wert;
    return true;
  }

  /* ---------------------------------------------------------------------------
   * 3) Kopieren, Auffuellen, Pruefen */

  function tiefKopie(o) {
    if (Array.isArray(o)) return o.map(tiefKopie);
    if (o && typeof o === 'object') {
      var n = {};
      Object.keys(o).forEach(function (k) { n[k] = tiefKopie(o[k]); });
      return n;
    }
    return o;
  }
  function vorgabe() { return tiefKopie(VORGABE); }

  function werte(liste) { return liste.map(function (x) { return x.wert; }); }
  function eintrag(liste, wert) {
    for (var i = 0; i < liste.length; i++) if (liste[i].wert === wert) return liste[i];
    return null;
  }

  /** Fehlende Felder aus der Vorgabe auffuellen - fremde Felder fallen weg.
   *  Ein gespeichertes Objekt aus einer aelteren Fassung darf nicht dazu fuehren,
   *  dass ein neuer Schalter undefiniert ist; und ein Feld, das die Vorgabe nicht
   *  kennt, wird nicht mitgeschleppt. */
  function auffuellen(e) {
    var v = vorgabe();
    if (!e || typeof e !== 'object') return v;
    Object.keys(v).forEach(function (gruppe) {
      if (typeof v[gruppe] !== 'object' || v[gruppe] === null) {
        if (Object.prototype.hasOwnProperty.call(e, gruppe)) v[gruppe] = e[gruppe];
        return;
      }
      var q = e[gruppe];
      if (!q || typeof q !== 'object') return;
      Object.keys(v[gruppe]).forEach(function (feld) {
        if (!Object.prototype.hasOwnProperty.call(q, feld)) return;
        if (gruppe === 'farben') {
          /* Farben liegen eine Ebene tiefer (je Thema). */
          var qf = q[feld];
          if (!qf || typeof qf !== 'object') return;
          FARBFELDER.forEach(function (f) {
            if (Object.prototype.hasOwnProperty.call(qf, f)) v[gruppe][feld][f] = qf[f];
          });
          return;
        }
        v[gruppe][feld] = q[feld];
      });
    });
    return v;
  }

  var HEX = /^#[0-9a-fA-F]{6}$/;
  function istHex(s) { return typeof s === 'string' && HEX.test(s); }

  /** Prueft ein VOLLSTAENDIGES Einstellungsobjekt. Rueckgabe {ok:true} oder
   *  {ok:false, feld, grund}. Kein halbes Ja: wer hier durchfaellt, wird nicht
   *  teilweise uebernommen, sondern durch die Vorgabe ersetzt. */
  function gueltig(e) {
    function nein(feld, grund) { return { ok: false, feld: feld, grund: grund }; }
    if (!e || typeof e !== 'object' || Array.isArray(e)) return nein('', 'kein Einstellungsobjekt');

    var s = e.symbol;
    if (!s || typeof s !== 'object') return nein('symbol', 'Abschnitt fehlt');
    if (werte(DARSTELLUNGEN).indexOf(s.darstellung) < 0) {
      return nein('symbol.darstellung', 'unbekannte Darstellung: ' + String(s.darstellung));
    }
    if (typeof s.nachVortag !== 'boolean') return nein('symbol.nachVortag', 'kein Schalter');
    if (s.praezision !== 'auto') {
      if (typeof s.praezision !== 'number' || !isFinite(s.praezision) ||
          s.praezision % 1 !== 0 || s.praezision < 0 || s.praezision > PRAEZISION_MAX) {
        return nein('symbol.praezision', 'Präzision außerhalb 0–' + PRAEZISION_MAX + ': ' + String(s.praezision));
      }
    }
    if (werte(ZEITZONEN).indexOf(s.zeitzone) < 0) {
      return nein('symbol.zeitzone', 'unbekannte Zeitzone: ' + String(s.zeitzone));
    }

    if (!e.farben || typeof e.farben !== 'object') return nein('farben', 'Abschnitt fehlt');
    for (var ti = 0; ti < THEMEN.length; ti++) {
      var thema = THEMEN[ti], satz = e.farben[thema];
      if (!satz || typeof satz !== 'object') return nein('farben.' + thema, 'Farbsatz fehlt');
      for (var fi = 0; fi < FARBFELDER.length; fi++) {
        var f = FARBFELDER[fi];
        if (!istHex(satz[f])) {
          return nein('farben.' + thema + '.' + f, 'keine Hex-Farbe: ' + String(satz[f]));
        }
      }
    }

    var z = e.statuszeile;
    if (!z || typeof z !== 'object') return nein('statuszeile', 'Abschnitt fehlt');
    if (werte(TITELARTEN).indexOf(z.titel) < 0) return nein('statuszeile.titel', 'unbekannte Titelart: ' + String(z.titel));
    if (typeof z.deckkraft !== 'number' || !isFinite(z.deckkraft) || z.deckkraft < 0 || z.deckkraft > 1) {
      return nein('statuszeile.deckkraft', 'Deckkraft außerhalb 0–1: ' + String(z.deckkraft));
    }
    var zSchalter = ['ohlc', 'aenderung', 'volumen', 'indikatorTitel', 'indikatorWerte', 'hintergrund', 'letzteSitzung'];
    for (var zi = 0; zi < zSchalter.length; zi++) {
      if (typeof z[zSchalter[zi]] !== 'boolean') return nein('statuszeile.' + zSchalter[zi], 'kein Schalter');
    }

    var k = e.skala;
    if (!k || typeof k !== 'object') return nein('skala', 'Abschnitt fehlt');
    if (werte(SKALENMODI).indexOf(k.modus) < 0) return nein('skala.modus', 'unbekannter Skalenmodus: ' + String(k.modus));
    if (werte(PLATZIERUNGEN).indexOf(k.platzierung) < 0) return nein('skala.platzierung', 'unbekannte Platzierung: ' + String(k.platzierung));
    if (werte(LINIENARTEN).indexOf(k.kurslinieArt) < 0) return nein('skala.kurslinieArt', 'unbekannte Linienart: ' + String(k.kurslinieArt));
    var kSchalter = ['einheit', 'keineUeberlappung', 'countdown', 'kurslinie', 'ausserboerslich', 'hochTief', 'indikatorWerte', 'bidAsk'];
    for (var ki = 0; ki < kSchalter.length; ki++) {
      if (typeof k[kSchalter[ki]] !== 'boolean') return nein('skala.' + kSchalter[ki], 'kein Schalter');
    }

    var t = e.zeit;
    if (!t || typeof t !== 'object') return nein('zeit', 'Abschnitt fehlt');
    if (werte(DATUMSFORMATE).indexOf(t.datumsformat) < 0) {
      return nein('zeit.datumsformat', 'unbekanntes Datumsformat: ' + String(t.datumsformat));
    }
    var tSchalter = ['wochentag', 'stunden12', 'linkenRandBehalten'];
    for (var tzi = 0; tzi < tSchalter.length; tzi++) {
      if (typeof t[tSchalter[tzi]] !== 'boolean') return nein('zeit.' + tSchalter[tzi], 'kein Schalter');
    }

    var g = e.ereignisse;
    if (!g || typeof g !== 'object') return nein('ereignisse', 'Abschnitt fehlt');
    var gSchalter = ['dividenden', 'splits', 'earnings', 'earningsLinie', 'nachrichten'];
    for (var gi = 0; gi < gSchalter.length; gi++) {
      if (typeof g[gSchalter[gi]] !== 'boolean') return nein('ereignisse.' + gSchalter[gi], 'kein Schalter');
    }
    return { ok: true };
  }

  /** Aus irgendetwas ein brauchbares Objekt machen: auffuellen, pruefen, im
   *  Zweifel die Vorgabe. Der Grund wird MITGEGEBEN, nicht verschluckt - sonst
   *  faellt ein Nutzer stumm auf die Vorgabe zurueck und weiss nicht, warum. */
  function uebernehmen(e) {
    var voll = auffuellen(e);
    var p = gueltig(voll);
    if (p.ok) return { einstellungen: voll, ok: true, grund: '' };
    return { einstellungen: vorgabe(), ok: false, grund: p.feld + ': ' + p.grund };
  }

  /* ---------------------------------------------------------------------------
   * 4) Zeit: Zone, Achsentext, Countdown
   *
   * KEINE ZWEITE ZEITZONENRECHNUNG. Die Sitzungsgrenzen kommen weiter aus
   * boerse.js/Quant.minutenSeitOeffnung; hier wird nur BESCHRIFTET, und dafuer
   * fragt Intl mit der IANA-Zone. Der Wochentag wird NICHT aus der Locale
   * uebernommen (die schreibt je nach Fassung "Fr" oder "Fr."), sondern aus dem
   * Datum in der Zielzone gerechnet - so steht dieselbe Kerze auf jedem Rechner
   * unter demselben Wort. */
  var WOCHENTAGE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  function zone(e) {
    var t = eintrag(ZEITZONEN, e && e.symbol && e.symbol.zeitzone);
    return (t || ZEITZONEN[0]).zone;
  }

  /** Die Bestandteile eines Zeitpunkts in der Zielzone. Gibt null, wenn Intl die
   *  Zone nicht kennt - geraten wird nichts. */
  function zeitTeile(ms, ianaZone) {
    if (typeof ms !== 'number' || !isFinite(ms)) return null;
    try {
      var f = new Intl.DateTimeFormat('en-US', {
        timeZone: ianaZone, hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
      });
      var p = {};
      f.formatToParts(new Date(ms)).forEach(function (x) { p[x.type] = x.value; });
      var jahr = Number(p.year), monat = Number(p.month), tag = Number(p.day);
      var stunde = Number(p.hour) % 24, minute = Number(p.minute);
      if (!isFinite(jahr) || !isFinite(monat) || !isFinite(tag)) return null;
      return {
        jahr: jahr, monat: monat, tag: tag, stunde: stunde, minute: minute,
        wochentag: new Date(Date.UTC(jahr, monat - 1, tag)).getUTCDay()
      };
    } catch (err) { return null; }
  }

  function zwei(n) { return (n < 10 ? '0' : '') + n; }

  function datumText(teile, format) {
    var jj = zwei(teile.jahr % 100), jjjj = String(teile.jahr);
    var mm = zwei(teile.monat), tt = zwei(teile.tag);
    if (format === 'jjjj-mm-tt') return jjjj + '-' + mm + '-' + tt;
    if (format === 'tt.mm.jjjj') return tt + '.' + mm + '.' + jjjj;
    return tt + '.' + mm + '.' + jj;
  }
  function uhrText(teile, stunden12) {
    if (!stunden12) return zwei(teile.stunde) + ':' + zwei(teile.minute);
    var h = teile.stunde % 12; if (h === 0) h = 12;
    return h + ':' + zwei(teile.minute) + ' ' + (teile.stunde < 12 ? 'AM' : 'PM');
  }

  /** Die Beschriftungsfunktion, die KerzenChart.achsenBeschriftung hereinbekommt.
   *  Signatur wie achsenText(ms, zone, art) - die Zone steckt schon in den
   *  Einstellungen, das dritte Argument sagt, welche Art Marke gebraucht wird. */
  function achsenText(e) {
    var voll = auffuellen(e);
    var z = zone(voll);
    var fmt = voll.zeit.datumsformat, wt = voll.zeit.wochentag, h12 = voll.zeit.stunden12;
    return function (ms, _zoneEgal, art) {
      var t = zeitTeile(ms, z);
      if (!t) return '';
      if (art === 'uhr') return uhrText(t, h12);
      var kurz = art === 'tagKurz';
      var d = kurz ? (zwei(t.tag) + '.' + zwei(t.monat) + '.') : datumText(t, fmt);
      return wt ? (WOCHENTAGE[t.wochentag] + ' ' + d) : d;
    };
  }

  /** Countdown zur naechsten Kerze, in Millisekunden. Rein: Uhr kommt herein.
   *  Ausserhalb der Sitzung gibt es keinen Countdown - eine Kerze, die nicht
   *  laeuft, laeuft auch nicht ab. Dann kommt null, nicht 0. */
  function countdown(jetztMs, intervallMs, sitzungOffen) {
    if (sitzungOffen === false) return null;
    if (typeof jetztMs !== 'number' || !isFinite(jetztMs)) return null;
    if (typeof intervallMs !== 'number' || !isFinite(intervallMs) || intervallMs <= 0) return null;
    var rest = intervallMs - (((jetztMs % intervallMs) + intervallMs) % intervallMs);
    return rest === 0 ? intervallMs : rest;
  }
  /** Derselbe Countdown als Text: "43 min", "2:05 h", "38 s". */
  function countdownText(restMs) {
    if (typeof restMs !== 'number' || !isFinite(restMs) || restMs < 0) return '';
    var s = Math.floor(restMs / 1000);
    if (s < 60) return s + ' s';
    var m = Math.floor(s / 60);
    if (m < 60) return m + ' min';
    return Math.floor(m / 60) + ':' + zwei(m % 60) + ' h';
  }

  /* ---------------------------------------------------------------------------
   * 5) Praezision */

  /** "Aus dem Kurs": wie viele Nachkommastellen braucht dieser Wert?
   *
   *  Nicht einfach die Stellen der EINEN Zahl. 171.4 hat eine Nachkommastelle,
   *  gemeint sind aber 171,40 - US-Aktien werden in Cent notiert, und eine
   *  Skala, die zwischen "171,4" und "171,45" die Stellenzahl wechselt, flackert
   *  bei jeder Kerze. Deshalb:
   *    - gezaehlt wird ueber ALLE gegebenen Werte (der Aufrufer reicht die
   *      sichtbaren Kurse herein), nicht ueber einen,
   *    - ab 1 gibt es einen Boden von zwei Stellen (Cent),
   *    - darunter von vier (Pennystocks und Devisen brauchen mehr),
   *    - gedeckelt bei sechs; was darueber liegt, ist Gleitkomma-Rauschen. */
  var STELLEN_BODEN_GROSS = 2;
  var STELLEN_BODEN_KLEIN = 4;
  function stellenEiner(v) {
    var s = String(v);
    if (s.indexOf('e') >= 0 || s.indexOf('E') >= 0) return PRAEZISION_MAX;
    var p = s.indexOf('.');
    return p < 0 ? 0 : Math.min(PRAEZISION_MAX, s.length - p - 1);
  }
  function stellenAusKurs(werte) {
    var liste = (Array.isArray(werte) ? werte : [werte]).filter(function (v) {
      return typeof v === 'number' && isFinite(v);
    });
    if (!liste.length) return STELLEN_BODEN_GROSS;
    var dez = 0, gross = 0;
    liste.forEach(function (v) {
      var d = stellenEiner(v);
      if (d > dez) dez = d;
      if (Math.abs(v) > gross) gross = Math.abs(v);
    });
    var boden = gross >= 1 ? STELLEN_BODEN_GROSS : STELLEN_BODEN_KLEIN;
    return Math.min(PRAEZISION_MAX, Math.max(boden, dez));
  }
  function praezision(e, kurs) {
    var voll = auffuellen(e);
    if (voll.symbol.praezision === 'auto') return stellenAusKurs(kurs);
    return voll.symbol.praezision;
  }

  /* ---------------------------------------------------------------------------
   * 5b) Zahlen als Text - Preisskala und Statuszeile
   *
   * Beides koennte im Renderer stehen. Dann waere es nicht pruefbar: eine
   * Formatierung, die nur in explorer.js lebt, tastet test-v6 als Text ab und
   * kann nicht sagen, WAS sie ausgibt. Hier ist sie durchspielbar.
   *
   * UNBEKANNT IST UNBEKANNT: fehlt ein Wert, steht ein Gedankenstrich da - nie 0
   * und nie eine leere Stelle, die aussieht, als waere der Wert null. */
  var OHNE = '–';

  function zahlText(v, stellen) {
    if (typeof v !== 'number' || !isFinite(v)) return OHNE;
    return v.toFixed(stellen).replace('.', ',');
  }

  /** Ein Kurs an der Preisskala. Im Prozentmodus wird gegen `basis` gerechnet -
   *  die Skala zeigt dann, was seit dem linken Rand passiert ist, und die Einheit
   *  ist das Prozentzeichen, nicht die Waehrung. */
  function preisText(wert, e, lage) {
    var voll = auffuellen(e), L = lage || {};
    if (voll.skala.modus === 'prozent') {
      if (typeof wert !== 'number' || !isFinite(wert) ||
          typeof L.basis !== 'number' || !isFinite(L.basis) || L.basis === 0) return OHNE;
      var p = (wert / L.basis - 1) * 100;
      return (p > 0 ? '+' : '') + p.toFixed(2).replace('.', ',') + ' %';
    }
    /* Die Stellenzahl kommt aus DEN KURSEN, die der Aufrufer hereinreicht - nicht
     * aus dem einen Wert, der gerade beschriftet wird. Genau das war ein Fehler in
     * der ersten Fassung: `typeof L.kurs === 'number'` liess eine LISTE durchfallen,
     * und jede Achsenmarke bekam ihre eigene Stellenzahl. Auf der Aufnahme stand
     * "121,71" ueber "116,335" - dieselbe Skala, drei verschiedene Genauigkeiten. */
    var stellen = praezision(voll, L.kurs != null ? L.kurs : wert);
    var t = zahlText(wert, stellen);
    if (t === OHNE) return t;
    return voll.skala.einheit && L.einheit ? (t + ' ' + L.einheit) : t;
  }

  /** Die Statuszeile (die Fadenkreuz-Anzeige aus 8a) als Liste von Teilen.
   *  Jeder Schalter der Einstellungen laesst genau einen Teil weg oder stehen -
   *  ein Schalter ohne Wirkung waere genau der Fund aus dem UI-Audit.
   *
   *  `daten` = { name, kuerzel, zeit, o, h, l, c, vorher, volumen,
   *              indikatoren: [{name, wert}], sitzung: {schluss, aenderung, spanne} }
   *  Zurueck: [{art, text}] - der Aufrufer setzt sie zusammen. */
  function statuszeile(daten, e, lage) {
    var voll = auffuellen(e), z = voll.statuszeile, d = daten || {}, L = lage || {};
    var teile = [];
    var stellen = praezision(voll, typeof d.c === 'number' ? d.c : L.kurs);
    var einheit = voll.skala.einheit && L.einheit ? ' ' + L.einheit : '';

    var name = String(d.name == null ? '' : d.name);
    var kuerzel = String(d.kuerzel == null ? '' : d.kuerzel);
    var titel = '';
    if (z.titel === 'name') titel = name || kuerzel;
    else if (z.titel === 'kuerzel') titel = kuerzel || name;
    else titel = [kuerzel, name].filter(function (t) { return t; }).join(' · ');
    if (titel) teile.push({ art: 'titel', text: titel });

    if (d.zeit) teile.push({ art: 'zeit', text: String(d.zeit) });

    if (z.ohlc) {
      teile.push({ art: 'ohlc', text:
        'O ' + zahlText(d.o, stellen) + '  H ' + zahlText(d.h, stellen) +
        '  L ' + zahlText(d.l, stellen) + '  C ' + zahlText(d.c, stellen) + einheit });
    }
    if (z.aenderung) {
      var a = (typeof d.c === 'number' && typeof d.vorher === 'number' && isFinite(d.c) &&
               isFinite(d.vorher) && d.vorher !== 0) ? (d.c / d.vorher - 1) * 100 : null;
      teile.push({ art: 'aenderung', text: a == null ? OHNE
        : (a > 0 ? '+' : '') + a.toFixed(2).replace('.', ',') + ' %' });
    }
    if (z.volumen) {
      teile.push({ art: 'volumen', text: 'Vol ' +
        (typeof d.volumen === 'number' && isFinite(d.volumen)
          ? Math.round(d.volumen).toLocaleString('de-DE') : OHNE) });
    }
    (d.indikatoren || []).forEach(function (ind) {
      if (!z.indikatorTitel && !z.indikatorWerte) return;
      var t = '';
      if (z.indikatorTitel) t += String(ind.name || '');
      if (z.indikatorWerte) t += (t ? ' ' : '') + zahlText(ind.wert, stellen);
      if (t) teile.push({ art: 'indikator', text: t });
    });
    if (z.letzteSitzung && d.sitzung) {
      teile.push({ art: 'sitzung', text: 'Letzte Sitzung: Schluss ' + zahlText(d.sitzung.schluss, stellen) +
        ' · Änderung ' + (typeof d.sitzung.aenderung === 'number' && isFinite(d.sitzung.aenderung)
          ? (d.sitzung.aenderung > 0 ? '+' : '') + d.sitzung.aenderung.toFixed(2).replace('.', ',') + ' %' : OHNE) +
        ' · Spanne ' + zahlText(d.sitzung.spanne, stellen) });
    }
    return teile;
  }

  /** Der Hintergrund der Statuszeile als Farbe mit Deckkraft - aus dem Grund, den
   *  der Aufrufer misst. Ist die Zeile ohne Hintergrund gewaehlt, kommt null. */
  function statuszeileGrund(e, grundHex) {
    var voll = auffuellen(e);
    if (!voll.statuszeile.hintergrund || !istHex(grundHex)) return null;
    var r = parseInt(grundHex.substr(1, 2), 16);
    var g = parseInt(grundHex.substr(3, 2), 16);
    var b = parseInt(grundHex.substr(5, 2), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + voll.statuszeile.deckkraft + ')';
  }

  /* ---------------------------------------------------------------------------
   * 6) Ereignis-Marken
   *
   * Aus DEN Daten, die ohnehin da sind: die Massnahmen-Datei der Vollsammlung
   * (alpaca-massnahmen/<SYM>.json, Saetze mit _art und ex_date), der
   * Earnings-Termin des Viewers und die Meldungen, die der Viewer schon holt.
   * Keine neue Quelle, kein neuer Abruf.
   *
   * KEINE DATEN IST NICHT KEINE MARKE: fehlt die Datei, sagt stand() 'keine Daten'
   * - der Nutzer soll den Unterschied zwischen "es gab keine Dividende" und "wir
   * wissen es nicht" sehen. */
  function datumAus(satz) {
    return (satz && (satz.ex_date || satz.effective_date || satz.process_date)) || null;
  }
  /** Der Tagesbeginn in UTC. Die Marke sitzt auf dem Tag, nicht auf einer Minute -
   *  eine Dividende hat keine Uhrzeit. */
  function tagMs(datum) {
    var p = String(datum == null ? '' : datum).split('-').map(Number);
    if (p.length !== 3 || !isFinite(p[0]) || !isFinite(p[1]) || !isFinite(p[2])) return null;
    return Date.UTC(p[0], p[1] - 1, p[2]);
  }

  /* Eine Zahl aus der Massnahmen-Datei, so wie sie dasteht - NICHT gerundet und
   * nicht mit der Kurs-Praezision formatiert: eine Dividende von 0,245 ist 0,245.
   * Der Name ist bewusst ein anderer als zahlText() weiter oben; zwei Funktionen
   * gleichen Namens in derselben Datei sind eine stille Ueberschreibung. */
  function satzZahl(v) {
    var n = Number(v);
    return isFinite(n) ? String(n) : '?';
  }

  /** Marken aus den Rohdaten. quellen = {
   *    massnahmen: <Inhalt der Datei oder null>,
   *    earnings:   [ms, ...] oder [],
   *    nachrichten:[{t, title}, ...]
   *  }
   *  Rueckgabe: [{art, zeitMs, kurz, tooltip, linie}] - aufsteigend, gedeckelt. */
  function marken(quellen, e) {
    var voll = auffuellen(e), g = voll.ereignisse, aus = [];
    var q = quellen || {};
    var saetze = (q.massnahmen && Array.isArray(q.massnahmen.saetze)) ? q.massnahmen.saetze : null;

    if (saetze) {
      saetze.forEach(function (s) {
        var art = String(s && s._art || '');
        var ms = tagMs(datumAus(s));
        if (ms == null) return;
        if (g.dividenden && /dividend/.test(art)) {
          var betrag = s.rate != null ? satzZahl(s.rate) : null;
          aus.push({ art: 'dividende', zeitMs: ms, kurz: 'D',
            tooltip: 'Dividende' + (betrag ? ' ' + betrag : '') + ' · ex ' + datumAus(s), linie: false });
        }
        if (g.splits && /split/.test(art)) {
          var alt = Number(s.old_rate), neu = Number(s.new_rate);
          var v = (isFinite(alt) && isFinite(neu) && alt > 0 && neu > 0) ? (neu + ':' + alt) : '?';
          aus.push({ art: 'split', zeitMs: ms, kurz: 'S',
            tooltip: 'Split ' + v + ' · ' + datumAus(s), linie: false });
        }
      });
    }

    if (g.earnings && Array.isArray(q.earnings)) {
      q.earnings.forEach(function (ms) {
        if (typeof ms !== 'number' || !isFinite(ms)) return;
        aus.push({ art: 'earnings', zeitMs: ms, kurz: 'E', tooltip: 'Quartalszahlen', linie: !!g.earningsLinie });
      });
    }

    if (g.nachrichten && Array.isArray(q.nachrichten)) {
      q.nachrichten.slice(0, NACHRICHTEN_MAX).forEach(function (n) {
        var ms = n && n.t;
        if (typeof ms !== 'number' || !isFinite(ms) || ms <= 0) return;
        aus.push({ art: 'nachricht', zeitMs: ms, kurz: 'N',
          tooltip: String((n.title || '')).slice(0, 140), linie: false });
      });
    }

    aus.sort(function (a, b) { return a.zeitMs - b.zeitMs; });
    return aus;
  }

  /** Was steht je Ereignisart? 'aus' | 'keine Daten' | Zahl der Marken.
   *  Damit der Dialog nicht schweigt, wo nichts kommt. */
  function markenStand(quellen, e) {
    var voll = auffuellen(e), g = voll.ereignisse, q = quellen || {};
    var hatDatei = !!(q.massnahmen && Array.isArray(q.massnahmen.saetze));
    var alle = marken(q, voll);
    function zaehle(art) { return alle.filter(function (m) { return m.art === art; }).length; }
    function stand(an, vorhanden, art) {
      if (!an) return 'aus';
      if (!vorhanden) return 'keine Daten';
      return String(zaehle(art));
    }
    return {
      dividenden: stand(g.dividenden, hatDatei, 'dividende'),
      splits: stand(g.splits, hatDatei, 'split'),
      earnings: stand(g.earnings, Array.isArray(q.earnings), 'earnings'),
      nachrichten: stand(g.nachrichten, Array.isArray(q.nachrichten), 'nachricht')
    };
  }

  /* ---------------------------------------------------------------------------
   * 7) optionen(e, lage) - was KerzenChart.zeichnen() bekommt
   *
   * DETERMINISTISCH: dieselben Einstellungen und dieselbe Lage geben dasselbe
   * Objekt. Keine Uhr, kein Zufall, kein Zugriff auf ein Fenster.
   *
   * `lage` traegt, was nicht in den Einstellungen steht: das Thema (hell/dunkel),
   * die Baender, die Linien, das Fadenkreuz, der letzte Kurs. */
  function optionen(e, lage) {
    var voll = auffuellen(e);
    var L = lage || {};
    var thema = L.thema === 'dunkel' ? 'dunkel' : 'hell';
    var f = voll.farben[thema];
    var linienart = eintrag(LINIENARTEN, voll.skala.kurslinieArt) || LINIENARTEN[0];

    return {
      thema: thema,
      darstellung: voll.symbol.darstellung,
      nachVortag: voll.symbol.nachVortag,
      /* Die Farben in der Form, die zeichnen() kennt - plus die neuen Felder.
       * `auf`/`ab` bleiben die Koerperfarben, damit die Fassung aus Stufe 6
       * weiter zeichnet, wenn jemand nur diese beiden setzt. */
      farben: {
        auf: f.aufKoerper, ab: f.abKoerper,
        aufKoerper: f.aufKoerper, aufRahmen: f.aufRahmen, aufDocht: f.aufDocht,
        abKoerper: f.abKoerper, abRahmen: f.abRahmen, abDocht: f.abDocht,
        kurslinie: f.kurslinie, ausserboerslich: f.ausserboerslich
      },
      skala: {
        modus: voll.skala.modus,
        platzierung: voll.skala.platzierung,
        einheit: voll.skala.einheit,
        keineUeberlappung: voll.skala.keineUeberlappung,
        hochTief: voll.skala.hochTief,
        indikatorWerte: voll.skala.indikatorWerte
      },
      kurslinie: voll.skala.kurslinie
        ? { farbe: f.kurslinie, muster: linienart.muster.slice(), art: linienart.wert }
        : null,
      ausserboerslichLinie: voll.skala.ausserboerslich ? { farbe: f.ausserboerslich } : null,
      achse: {
        zone: zone(voll),
        text: achsenText(voll),
        wochentag: voll.zeit.wochentag,
        datumsformat: voll.zeit.datumsformat,
        stunden12: voll.zeit.stunden12
      },
      marken: Array.isArray(L.marken) ? L.marken : [],
      baender: Array.isArray(L.baender) ? L.baender : [],
      linien: Array.isArray(L.linien) ? L.linien : [],
      kreuz: L.kreuz || null,
      intervallMs: L.intervallMs || null
    };
  }

  /* ---------------------------------------------------------------------------
   * 7b) Kontrast - die Warnung, die der Nutzer sonst nicht bekaeme
   *
   * Die VORGABEN halten in beiden Themen 4,5:1 (eine Klinke rechnet es nach). Aber
   * wer selbst eine Farbe waehlt - oder die Vorlage "Hell" im dunklen Thema
   * benutzt - kann darunter fallen. Ein Chart, dessen Kerzen man nicht sieht, ist
   * kein Geschmacksfall, und still ist er am schlimmsten.
   *
   * Der GRUND kommt herein: ein reines Modul kann kein Stylesheet lesen. Der
   * Dialog misst die Hintergrundfarbe am Element und reicht sie her. Ist sie
   * unbrauchbar, wird nicht geraten - dann kommt eine leere Liste, und die
   * Warnung bleibt aus (eine erfundene Warnung ist so schlecht wie eine fehlende).
   *
   * Dieselbe Formel wie in tools/a11y-probe.js und in test-v6 (WCAG 2.1). */
  var KONTRAST_MIN = 4.5;
  function leuchte(hex) {
    var c = [1, 3, 5].map(function (i) {
      var v = parseInt(hex.substr(i, 2), 16) / 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }
  function kontrast(a, b) {
    if (!istHex(a) || !istHex(b)) return null;
    var l1 = leuchte(a), l2 = leuchte(b);
    return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  /** Welche Farben des Themas halten den Grund nicht aus?
   *  [{feld, farbe, wert}] - leer, wenn alles reicht ODER der Grund unbrauchbar
   *  ist. */
  function schwacheFarben(e, thema, grundHex) {
    if (!istHex(grundHex)) return [];
    var voll = auffuellen(e);
    var satz = voll.farben[thema === 'dunkel' ? 'dunkel' : 'hell'];
    var aus = [];
    FARBFELDER.forEach(function (f) {
      var k = kontrast(satz[f], grundHex);
      if (k != null && k < KONTRAST_MIN) aus.push({ feld: f, farbe: satz[f], wert: k });
    });
    return aus;
  }
  /** Ein Satz daraus - oder ''. Der Dialog schreibt ihn in die Fusszeile. */
  function kontrastWarnung(e, thema, grundHex) {
    var s = schwacheFarben(e, thema, grundHex);
    if (!s.length) return '';
    var schlimmste = s.reduce(function (a, b) { return b.wert < a.wert ? b : a; });
    return s.length + (s.length === 1 ? ' Farbe hebt sich' : ' Farben heben sich') +
      ' kaum vom Hintergrund ab (schlechteste: ' + schlimmste.feld + ', ' +
      schlimmste.wert.toFixed(1).replace('.', ',') + ':1, nötig ' +
      String(KONTRAST_MIN).replace('.', ',') + ':1).';
  }

  /* ---------------------------------------------------------------------------
   * 8) Vorlagen
   *
   * Vier eingebaute, alle aus VORGABE abgeleitet - eine Vorlage, die ihre Werte
   * selbst noch einmal hinschreibt, waere die zweite Stelle, die es hier nicht
   * geben soll. Eigene Vorlagen liegen im Speicher, nicht hier. */
  function mitAenderung(aend) {
    var v = vorgabe();
    aend(v);
    return v;
  }
  var VORLAGEN = [
    { wert: 'standard', text: 'Standard', bauen: function () { return vorgabe(); } },
    { wert: 'hell', text: 'Hell', bauen: function () {
      return mitAenderung(function (v) { v.farben.dunkel = tiefKopie(FARBEN_HELL); });
    } },
    { wert: 'dunkel', text: 'Dunkel', bauen: function () {
      return mitAenderung(function (v) { v.farben.hell = tiefKopie(FARBEN_DUNKEL); });
    } },
    { wert: 'nuechtern', text: 'Nüchtern (nur Linie)', bauen: function () {
      return mitAenderung(function (v) {
        v.symbol.darstellung = 'linie';
        v.statuszeile.volumen = false;
        v.statuszeile.indikatorTitel = false;
        v.statuszeile.indikatorWerte = false;
        v.statuszeile.hintergrund = false;
        v.skala.hochTief = false;
        v.skala.indikatorWerte = false;
        v.ereignisse.dividenden = false;
        v.ereignisse.splits = false;
        v.ereignisse.earnings = false;
        v.ereignisse.nachrichten = false;
      });
    } }
  ];
  function vorlage(name) {
    var v = eintrag(VORLAGEN, name);
    return v ? v.bauen() : null;
  }

  /* ---------------------------------------------------------------------------
   * 9) Bid/Ask - die ehrliche Beschriftung
   *
   * Der Auftrag verlangt eine Zeile, die sagt, WAS da steht, und sie nur dann,
   * wenn die Kostenmessung ohnehin einen Alpaca-Zugang hat. Der Text haengt am
   * FEED, nicht an einer Vermutung: alpaca.js fragt den Gratis-Feed 'iex' ab, und
   * der ist nicht 15 Minuten verzoegert, sondern unvollstaendig (nur die IEX-Boerse
   * statt des Gesamtmarkts). Waere der Feed auf 'sip' gestellt, waere die
   * Verzoegerung die richtige Aussage. Beide Texte stehen hier, damit die
   * Beschriftung nicht stehen bleibt, wenn der Feed wechselt. */
  var FEED_TEXT = {
    iex: 'Alpaca IEX (Gratis-Feed: nur die IEX-Börse, nicht der Gesamtmarkt)',
    sip: 'Alpaca SIP, 15 Min verzögert'
  };
  function bidAskBeschriftung(feed) {
    return FEED_TEXT[String(feed || '').toLowerCase()] || 'Alpaca (Feed unbekannt)';
  }
  /** Darf die Zeile ueberhaupt an? {an, grund} - der Grund steht im Dialog neben
   *  dem ausgegrauten Schalter. Ohne Zugang wird nichts abgerufen. */
  function bidAskMoeglich(zugang) {
    if (!zugang) return { an: false, grund: 'Kein Alpaca-Zugang eingerichtet – die Zeile bliebe leer.' };
    return { an: true, grund: '' };
  }

  var ChartEinstellungen = {
    VORGABE: VORGABE,
    ZEITZONEN: ZEITZONEN,
    DARSTELLUNGEN: DARSTELLUNGEN,
    TITELARTEN: TITELARTEN,
    SKALENMODI: SKALENMODI,
    PLATZIERUNGEN: PLATZIERUNGEN,
    LINIENARTEN: LINIENARTEN,
    DATUMSFORMATE: DATUMSFORMATE,
    PRAEZISIONEN: PRAEZISIONEN,
    PRAEZISION_MAX: PRAEZISION_MAX,
    NACHRICHTEN_MAX: NACHRICHTEN_MAX,
    VORLAGE_NAME_MAX: VORLAGE_NAME_MAX,
    REITER: REITER,
    FELDER: FELDER,
    lies: lies,
    schreib: schreib,
    FARBFELDER: FARBFELDER,
    THEMEN: THEMEN,
    VORLAGEN: VORLAGEN,
    WOCHENTAGE: WOCHENTAGE,
    vorgabe: vorgabe,
    auffuellen: auffuellen,
    gueltig: gueltig,
    uebernehmen: uebernehmen,
    zone: zone,
    zeitTeile: zeitTeile,
    datumText: datumText,
    uhrText: uhrText,
    achsenText: achsenText,
    countdown: countdown,
    countdownText: countdownText,
    stellenAusKurs: stellenAusKurs,
    praezision: praezision,
    OHNE: OHNE,
    preisText: preisText,
    statuszeile: statuszeile,
    statuszeileGrund: statuszeileGrund,
    KONTRAST_MIN: KONTRAST_MIN,
    kontrast: kontrast,
    schwacheFarben: schwacheFarben,
    kontrastWarnung: kontrastWarnung,
    marken: marken,
    markenStand: markenStand,
    optionen: optionen,
    vorlage: vorlage,
    bidAskBeschriftung: bidAskBeschriftung,
    bidAskMoeglich: bidAskMoeglich
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = ChartEinstellungen; return; }
  root.ChartEinstellungen = ChartEinstellungen;
})(typeof window !== 'undefined' ? window : globalThis);
