'use strict';
/* ================= Kursarchiv auffuellen (Massen-Backfill + Datenquellen-Diagnose) =================
 *
 * Stufe E des Struktur-Plans, Block 4: WOERTLICH aus depot.js umgezogen. Das Modul
 * fuellt das Kursarchiv ueber die Capital.com-Demo-API auf und prueft die Datenquelle
 * Schritt fuer Schritt - es handelt nichts und schreibt den Depot-Zustand nie.
 *
 * Abhaengigkeiten kommen ueber Backfill.verkabeln() aus depot.js: das Universum, der
 * Yahoo-Abruf, die Pool-Listen, der Depot-Getter (nur fuer die Pool-Wahl gelesen)
 * und spannenAusKerzen - Letzteres wohnt beim Kosten-Bestand in depot.js, weil auch
 * capBackfill dort es nutzt; zwei Fassungen derselben Spannen-Erfassung darf es
 * nicht geben. istSitzung wird exportiert: capBackfill (depot.js) filtert damit.
 * Q, U, Archiv, CapAPI und Boerse sind global. */
(function () {
  var Q = window.Quant;
  /* Von depot.js hereingereicht (verkabeln) - vorher laufen die Knoepfe ins Leere. */
  var universe = null, fetchIntraday = null, spannenAusKerzen = null,
      POOLS_60M = null, holeDepot = null;
  var D = null;

  /* ================= Massen-Backfill (22.08.2026) =================
   * Der naechtliche Backfill oben laeuft mit 250 Anfragen - das fuellt das Archiv
   * ueber Wochen. Fuer die offenen Studien fehlt aber vor allem 1-Minuten-Historie:
   * Yahoo gibt nur 7 Tage, und Felix' Winkel-Detektor (#33) sowie die Dichte-Studie
   * (#36) brauchen 60+ Tage. Capital.com kann das liefern - in einem Rutsch.
   *
   * Bewusst NICHT "die API heiss laufen lassen": Ein zu schneller Lauf wird
   * gedrosselt oder sperrt den Zugang zeitweise, und dann steht alles. Deshalb
   * feste Pause je Anfrage, Abbruch nach mehreren Fehlern in Folge, und ein
   * Fortschritt, der jederzeit anhaltbar ist und beim naechsten Start weiterlaeuft
   * (der Zeiger ist der fruehste Archiv-Stempel je Symbol - er merkt sich alles). */
  var massenLaeuft = false, massenStop = false;
  function massenAbbrechen() { massenStop = true; }
  /** Liegt der Zeitpunkt in einer regulaeren US-Sitzung? Q.minutenSeitOeffnung prueft
   *  nur die UHRZEIT - ein Samstag 14:00 UTC gilt dort als Sitzung. Bei Yahoo-Daten war
   *  das folgenlos (keine Wochenendkerzen), CFD-Daten brauchen den Wochentag dazu. */
  function istSitzung(ms) {
    /* Feiertage und Halbtage kommen aus boerse.js. Nachgezaehlt ueber ein Jahr
     * Stundenkerzen (24.08.2026): Von den Kerzen, die die alte Regel als Sitzung
     * zaehlte, sind 3,85 % Feiertage und 0,38 % liegen nach dem Halbtags-Schluss -
     * zusammen 4,23 %. Bei Yahoo-Daten faellt das kaum auf (dort gibt es an
     * Feiertagen ohnehin keine Kerzen), bei CFD-Daten sehr wohl: Capital.com
     * liefert durch, und genau darum steht dieser Filter hier. */
    var tag = new Date(ms).getUTCDay();
    if (tag === 0 || tag === 6) return false;
    var laenge = (typeof window !== 'undefined' && window.Boerse) ? window.Boerse.sitzungsMinuten(ms) : 390;
    if (!laenge) return false;
    var m = Q.minutenSeitOeffnung(ms);
    return m >= 0 && m < laenge;
  }
  /** Letzter Sitzungsschluss VOR ms. Zieht den Zeiger in einem Schritt ueber Nacht,
   *  Wochenende oder Feiertag - sonst liefe der Backfill diese Pausen bei kleinem
   *  Fenster in dutzenden Leeranfragen ab. */
  function vorherigerSitzungsschluss(ms) {
    var z = ms;
    for (var i = 0; i < 12; i++) {
      var d = new Date(z), tag = d.getUTCDay(), m = Q.minutenSeitOeffnung(z);
      /* Der Kommentar darueber verspricht, ueber Feiertage zu springen - konnte es
       * aber gar nicht: geprueft wurde nur der Wochentag. An einem Feiertag lieferte
       * die Schleife einen "Schluss", den es nie gab, und der Backfill lief die
       * Pause doch in Leeranfragen ab. Jetzt haelt die Zeile, was sie ankuendigt. */
      var laenge = (typeof window !== 'undefined' && window.Boerse) ? window.Boerse.sitzungsMinuten(z) : 390;
      if (tag >= 1 && tag <= 5 && laenge && m >= laenge) return z - (m - laenge) * 60000;
      d.setUTCDate(d.getUTCDate() - 1);
      d.setUTCHours(23, 59, 0, 0);
      z = d.getTime();
    }
    return ms - 86400000;
  }

  /** Einmalige Umstellung: schon geschriebene Capital-Kerzen nachtraeglich kennzeichnen.
   *  Ohne sie rechnete dollarVolTag ihr CFD-Volumen als Boersenvolumen - belegt am
   *  22.08.2026 fuer 63 von 63 Dateien, die dadurch samt und sonders unter die
   *  50-Mio-Schwelle des Liquiditaetsfilters fielen. Immer dieselben Werte, also
   *  eine echte Auswahlverzerrung. */
  async function quellenMigration() {
    if (!window.Archiv || !window.api) return;
    try {
      if (await window.api.storeGet('capQuellenMigriert')) return;
      var epics = (await window.api.storeGet('cap_epics')) || {};
      var syms = Object.keys(epics);
      if (!syms.length) return;                 // nichts von Capital geholt: nichts zu tun
      var tagVon = function (ms) { return new Date(ms).toISOString().slice(0, 10); };
      function tagesVol(bars) {
        var t = {};
        (bars || []).forEach(function (b) { var k = tagVon(b[0]); t[k] = (t[k] || 0) + (b[2] || 0); });
        return t;
      }
      function median(x) { var s = x.slice().sort(function (a, b) { return a - b; }); return s.length ? s[Math.floor(s.length / 2)] : null; }
      var markiert = 0, dateien = 0;
      for (var i = 0; i < syms.length; i++) {
        var sym = syms[i];
        var ref = null;
        try {
          var s60 = await window.Archiv.serie('60m', sym);
          var v60 = Object.keys(tagesVol(s60)).map(function (k) { return tagesVol(s60)[k]; }).filter(function (v) { return v > 0; });
          ref = median(v60);
        } catch (e60) { ref = null; }
        var ivs = ['1m', '5m', '15m'];
        for (var j = 0; j < ivs.length; j++) {
          var iv = ivs[j], serie;
          try { serie = await window.Archiv.serie(iv, sym); } catch (eS) { continue; }
          if (!serie || serie.length < 2) continue;
          var vorhanden = await window.Archiv.bereiche(iv, sym);
          if (vorhanden && vorhanden.length) continue;      // schon gekennzeichnet
          dateien++;
          if (ref == null) {
            // Kein Boersen-Vergleichswert: der Wert kam erst durch den Backfill ins Archiv.
            await window.Archiv.markiere(iv, sym, serie[0][0], serie[serie.length - 1][0]);
            markiert++;
            continue;
          }
          var tv = tagesVol(serie), cfdTage = [];
          Object.keys(tv).forEach(function (k) { if (tv[k] > 0 && tv[k] < ref / 20) cfdTage.push(k); });
          if (!cfdTage.length) continue;
          cfdTage.sort();
          // Die Backfills schreiben ausschliesslich nach hinten (aelter), der CFD-Teil
          // liegt daher zusammenhaengend am Anfang. Ein Bereich genuegt.
          var von = null, bis = null;
          for (var q = 0; q < serie.length; q++) {
            if (cfdTage.indexOf(tagVon(serie[q][0])) !== -1) { if (von == null) von = serie[q][0]; bis = serie[q][0]; }
          }
          if (von != null) { await window.Archiv.markiere(iv, sym, von, bis); markiert++; }
        }
      }
      await window.Archiv.speichere(true);
      await window.api.storeSet('capQuellenMigriert', { am: Date.now(), dateien: dateien, markiert: markiert });
      if (markiert) console.log('Quellen-Umstellung: ' + markiert + ' von ' + dateien + ' Reihen als CFD gekennzeichnet.');
    } catch (e) { /* Umstellung darf den Start nie blockieren */ }
  }
  if (typeof window !== 'undefined') { window.__quellenMigration = quellenMigration; }

  async function massenBackfill(opts) {
    opts = opts || {};
    var el = document.getElementById('massenStatus');
    function melde(t) { if (el) el.textContent = t; }
    if (!(window.CapAPI && window.CapAPI.enabled())) { melde('Capital.com ist nicht verbunden – Zugangsdaten in den App-Einstellungen eintragen und „Verbindung aktivieren“ setzen.'); return null; }
    if (!window.Archiv) { melde('Kursarchiv nicht bereit.'); return null; }
    if (massenLaeuft) { melde('Läuft bereits.'); return null; }
    massenLaeuft = true; massenStop = false;
    var tage = opts.tage || 90;
    /* Reihenfolge bewusst vom billigsten zum teuersten Zeitrahmen: 15m und 5m haben
     * breite Abruffenster und sind schnell durch. 1m braucht ein Vielfaches an Anfragen
     * und ist zugleich der Zeitrahmen, um den es geht - er bekommt so den ganzen Rest
     * des Budgets, statt nur ein Drittel. */
    var ivs = opts.ivs || [{ iv: '15m', barMin: 15 }, { iv: '5m', barMin: 5 }, { iv: '1m', barMin: 1 }];
    /* Universum: Handels-Universum + Nasdaq-100 + aktiver Pool, dedupliziert.
     * Mehr Werte auf denselben Tagen = mehr Out-of-Sample-Trades je Messung. */
    var syms = universe().slice();
    /* ndx100 UND sp100: die Messung vom 23.08.2026 zeigt, dass der Ueberschuss in
     * weniger liquiden Werten nicht schlechter wird - die Verbreiterung braucht nur
     * vorher Daten. Ohne Archiv gehandelt waeren es nie gemessene Werte. */
    ['ndx100', 'sp100'].forEach(function (p) {
      (POOLS_60M[p] || []).forEach(function (s) { if (syms.indexOf(s) === -1) syms.push(s); });
    });
    (POOLS_60M[D.intraday.pool] || []).forEach(function (s) { if (syms.indexOf(s) === -1) syms.push(s); });
    var ziel = Date.now() - tage * 86400000;
    /* Capital begrenzt die Zeitspanne je Anfrage je nach Aufloesung - undokumentiert.
     * Die einmal gefundene Breite wird gespeichert, damit spaetere Laeufe nicht wieder
     * gegen die Wand laufen muessen. */
    var gemerkt = (await window.api.storeGet('cap_fenster')) || {};
    /* Anfragebudget: wird das Fenster klein, steigt die noetige Anfragezahl steil an.
     * Ohne Deckel liefe der Lauf im Extremfall Tage. Der Fortschritt ist gespeichert,
     * ein neuer Lauf setzt dort an - lieber mehrere kurze Laeufe als einer ohne Ende. */
    var budget = opts.maxAnfragen || 15000;
    var stat = { requests: 0, bars: 0, symbole: 0, fehler: 0, start: Date.now(), grund: '' };
    var ohneErfolg = 0;   // Werte in Folge, die keine einzige Kerze lieferten
    /* Capital.com erlaubt 10 Anfragen/Sekunde. Mit 200 ms Pause plus Antwortzeit
     * liegt der Lauf bei rund 2-3/s - genug Abstand, auch wenn nebenher der
     * Intraday-Scan oder die Spannen-Messung eine Anfrage stellt.
     * Groesseres Abruffenster wurde geprueft und VERWORFEN: eine Handelssitzung ist
     * 390 Minuten lang, jedes Fenster ab 390 Kerzen deckt sie bereits ganz ab. Der
     * 1m-Lauf kostet so oder so eine Anfrage je Handelstag. */
    var pause = opts.pauseMs || 200;
    melde('Starte … ' + syms.length + ' Werte × ' + ivs.length + ' Zeitrahmen, Ziel ' + tage + ' Tage.');
    try {
      /* STUFE 0: 60-Minuten-Historie. Die kommt NICHT von Capital, sondern von Yahoo
       * (730 Tage per btRange) - und genau auf ihr rechnet die gemessene Kante rsi2seit.
       * Nur Werte, deren Archiv duenner als 400 Kerzen ist; die anderen sind versorgt. */
      if (opts.mit60m !== false) {
        var fehl60 = [];
        for (var f0 = 0; f0 < syms.length; f0++) {
          var s60 = await window.Archiv.serie('60m', syms[f0]);
          if (!s60 || s60.length < 400) fehl60.push(syms[f0]);
        }
        if (fehl60.length) {
          melde('Stufe 0: 60-Minuten-Historie für ' + fehl60.length + ' Werte ohne Archiv (Yahoo, 730 Tage) …');
          var ok60 = 0, fehler60 = 0;
          for (var g0 = 0; g0 < fehl60.length && !massenStop; g0++) {
            var fd60 = null;
            try { fd60 = await fetchIntraday(fehl60[g0], '60m', true); } catch (e60) { fd60 = null; }
            if (fd60 && fd60.series && fd60.series.length > 100) {
              await window.Archiv.fuege('60m', fehl60[g0], fd60.series);
              ok60++;
            } else { fehler60++; }
            if (g0 % 10 === 9) { await window.Archiv.speichere(true); }
            melde('Stufe 0: ' + (g0 + 1) + '/' + fehl60.length + ' · ' + ok60 + ' angelegt · ' +
              fehler60 + ' ohne Daten · ' + fehl60[g0]);
            // Yahoo drosselt bei rund 200 Anfragen in Folge - bewusst langsam
            await new Promise(function (r) { setTimeout(r, 700); });
          }
          await window.Archiv.speichere(true);
          melde('Stufe 0 fertig: ' + ok60 + ' von ' + fehl60.length + ' Werten haben jetzt 60-Minuten-Historie' +
            (fehler60 ? ' (' + fehler60 + ' ohne Daten – bei Yahoo nicht geführt)' : '') + '.');
        }
      }
      for (var vi = 0; vi < ivs.length && !massenStop; vi++) {
        var iv = ivs[vi].iv, barMin = ivs[vi].barMin;
        var fensterMs = gemerkt[iv] || 1000 * barMin * 60000;
        for (var si = 0; si < syms.length && !massenStop; si++) {
          var sym = syms[si];
          if (stat.requests >= budget) {
            melde('Anfragebudget erreicht (' + budget + ' Anfragen, ' +
              Math.round((Date.now() - stat.start) / 60000) + ' Min) – zuletzt bei ' + iv + ' / ' + sym + '.\n' +
              Math.round(stat.bars / 1000) + 'k Kerzen gesichert. Der Fortschritt ist gespeichert:\n' +
              'einfach erneut „jetzt auffüllen" drücken, der Lauf macht genau hier weiter.');
            try { await window.Archiv.speichere(true); } catch (e4) { }
            return stat;
          }
          var serie = await window.Archiv.serie(iv, sym);
          var frueh = serie.length ? serie[0][0] : Date.now();
          if (frueh <= ziel) continue;
          /* Handelspausen werden gesprungen (vorherigerSitzungsschluss), nicht abgelaufen.
           * Leere Fenster bedeuten deshalb: innerhalb einer Sitzung liegt nichts mehr vor.
           * Die Grenze deckt rund eine volle Sitzung ab, ist aber gedeckelt, damit ein
           * kleines Fenster nicht das Anfragebudget aufbraucht. */
          var leerGrenze = Math.max(4, Math.min(24, Math.ceil(8 * 3600000 / fensterMs)));
          var leer = 0, geholt = false, fehlSerie = 0, ohneSitzung = 0, symGrund = '', symArt = '';
          while (frueh > ziel && !massenStop && leer < leerGrenze && fehlSerie < 3 && ohneSitzung < 3) {
            var von = Math.max(ziel, frueh - fensterMs);
            var bars = null;
            var wurf = '';
            try { bars = await window.CapAPI.pricesRange(sym, iv, von, frueh - 1, 1000); }
            catch (eB) { bars = null; wurf = 'Ausnahme: ' + ((eB && eB.message) || eB); }
            stat.requests++;
            if (!bars) {
              var gRoh = wurf || (window.CapAPI.lastPriceError && window.CapAPI.lastPriceError()) || '';
              /* Capital lehnt die Zeitspanne ab. Das ist KEIN Fehlschlag, sondern eine
               * Auskunft ueber die Grenze: Fenster halbieren, merken, gleiche Stelle erneut. */
              if (gRoh.indexOf('invalid.max.daterange') !== -1 && fensterMs > 20 * 60000) {
                fensterMs = Math.floor(fensterMs / 2);
                leerGrenze = Math.max(2, Math.ceil(96 * 3600000 / fensterMs) + 1);
                gemerkt[iv] = fensterMs;
                try { await window.api.storeSet('cap_fenster', gemerkt); } catch (eS) { }
                melde(iv + ': Capital.com lehnt diese Zeitspanne ab – Fenster auf ' +
                  Math.round(fensterMs / 60000) + ' Min verkleinert und gemerkt. Läuft weiter …');
                continue;
              }
              fehlSerie++; stat.fehler++;
              // Den Grund festhalten: vorher gab es nur einen Zaehler, und „3 Fehler"
              // sagt nicht, ob der Markt fehlt, die Sitzung abläuft oder gedrosselt wird.
              symGrund = gRoh || symGrund;
              stat.grund = gRoh || stat.grund;
              // Fehlerart als CODE merken - der Meldungstext ist Anzeige, kein Protokoll.
              symArt = (window.CapAPI.lastErrorKind && window.CapAPI.lastErrorKind()) || symArt;
              // Bei Fehlern langsamer werden statt weiterzuhaemmern - das ist genau
              // die Situation, in der eine Drosselung greift.
              await new Promise(function (r) { setTimeout(r, 1500 * fehlSerie); });
              continue;
            }
            fehlSerie = 0;
            if (!bars.length) {
              leer++;
              frueh = istSitzung(von) ? von : Math.min(von, vorherigerSitzungsschluss(von));
              continue;
            }
            leer = 0;
            var sess = bars.filter(function (b) { return istSitzung(b[0]); });
            if (sess.length) {
              spannenAusKerzen(sym, sess);      // Spanne auswerten, BEVOR das Archiv sie abschneidet
              await window.Archiv.fuege(iv, sym, sess, 'cap'); stat.bars += sess.length; geholt = true; ohneSitzung = 0;
            }
            else {
              /* Kerzen kamen an, aber KEINE lag in der US-Sitzung. Ohne diese Bremse
               * liefe der Wert stumm bis ans Ziel zurueck und stellte hunderte
               * Anfragen, ohne je etwas zu sichern - und ohne einen Fehler zu melden. */
              ohneSitzung++;
              if (ohneSitzung >= 3) {
                stat.grund = sym + ' (' + iv + '): API liefert Kerzen, aber keine innerhalb der US-Handelszeit – ' +
                  'vermutlich ein rund um die Uhr gehandelter Markt (Index/Devisen) statt der Aktie.';
              }
            }
            frueh = Math.min(von, bars[0][0]);
            // Steht der Zeiger jetzt in einer Handelspause, in einem Schritt darueber hinweg.
            if (!istSitzung(frueh)) frueh = Math.min(frueh, vorherigerSitzungsschluss(frueh));
            await new Promise(function (r) { setTimeout(r, pause); });
          }
          /* Ein Wert ohne Kerzen zaehlt als Fehlschlag - egal ob durch Fehler, leere
           * Fenster oder Kerzen ausserhalb der Sitzung. NICHT gezaehlt wird 'kein Markt
           * gefunden': Capital fuehrt nicht jeden Wert als CFD (im DAX-Pool haengen 41
           * .DE-Symbole hintereinander), das ist eine Einzel- und keine Verbindungsstoerung. */
          if (geholt) { stat.symbole++; ohneErfolg = 0; }
          /* Leere Fenster zaehlen bewusst NICHT mit: sie bedeuten meist schlicht
           * 'weiter zurueck gibt die API nichts her'. Beim zweiten Lauf ist das der
           * Normalfall bei JEDEM Wert - mitgezaehlt haette der Lauf sich dann selbst
           * mit der Meldung 'Verbindung gestoert' abgebrochen. */
          else if ((fehlSerie >= 3 || ohneSitzung >= 3) && symArt !== 'kein-markt') { ohneErfolg++; }
          // stat.bars === 0 fasst den Fall 'es lief nie'. Bricht die Verbindung erst
          // mitten im Lauf weg, greift die zweite Schwelle.
          if (ohneErfolg >= 3 && (stat.bars === 0 || ohneErfolg >= 10)) {
            melde('Abgebrochen: ' + ohneErfolg + ' Werte in Folge lieferten keine einzige Kerze' +
              (stat.bars === 0 ? ' und bisher wurde gar nichts gesichert' : '') + '.\n' +
              'Das sieht nach einer gemeinsamen Ursache aus, nicht nach Einzelfällen.\n\nGrund der API: ' +
              (stat.grund || 'kein Fehler gemeldet – die Abrufe kamen leer zurück') +
              '\n\nBitte zuerst „Datenquelle testen" laufen lassen – das zeigt,\n' +
              'an welcher Stelle es klemmt.');
            try { await window.Archiv.speichere(true); } catch (e3) { }
            return stat;
          }
          var minLauf = Math.round((Date.now() - stat.start) / 60000);
          melde(iv + ': Wert ' + (si + 1) + '/' + syms.length + ' (' + sym + ') · ' +
            stat.requests + ' Anfragen · ' + Math.round(stat.bars / 1000) + 'k Kerzen · ' +
            stat.fehler + ' Fehler · ' + minLauf + ' Min' + (massenStop ? ' · wird angehalten …' : '') +
            (stat.grund ? '\nLetzter Fehler: ' + stat.grund : '') +
        (stat.bars === 0 && stat.requests > 0 && !stat.grund
          ? '\n\nEs kam keine einzige Kerze an, ohne dass ein Fehler gemeldet wurde. Entweder ist das\n' +
            'Archiv bereits so tief wie die API reicht – oder das Konto bekommt keine Historie.\n' +
            '„Datenquelle testen" unterscheidet die beiden Fälle.'
          : '') +
        (fensterTxt ? '\nGemessene Zeitspanne je Anfrage: ' + fensterTxt + ' (wird für künftige Läufe behalten).' : ''));
          if (si % 10 === 9) await window.Archiv.speichere(true);   // Zwischenstand sichern
        }
      }
      await window.Archiv.speichere(true);
      var dauer = Math.round((Date.now() - stat.start) / 60000);
      var fensterTxt = Object.keys(gemerkt).map(function (k) {
        return k + ' ' + Math.round(gemerkt[k] / 60000) + ' Min';
      }).join(' · ');
      melde((massenStop ? 'Angehalten' : 'Fertig') + ' nach ' + dauer + ' Min · ' + stat.symbole +
        ' Werte ergänzt · ' + Math.round(stat.bars / 1000) + 'k Kerzen · ' + stat.requests +
        ' Anfragen · ' + stat.fehler + ' Fehler. Der Fortschritt ist gespeichert – ein neuer Lauf setzt dort an.' +
        (stat.grund ? '\nLetzter Fehler: ' + stat.grund : ''));
      return stat;
    } catch (eM) {
      melde('Abgebrochen: ' + ((eM && eM.message) || eM) + ' · Zwischenstand ist gespeichert.');
      try { await window.Archiv.speichere(true); } catch (e2) { }
      return stat;
    } finally {
      massenLaeuft = false;
    }
  }
  if (typeof window !== 'undefined') { window.__massenBackfill = massenBackfill; window.__massenAbbrechen = massenAbbrechen; }

  /** Gestufte Diagnose der Capital.com-Datenquelle.
   *  Grund: massenBackfill konnte bisher nur ZAEHLEN, dass etwas scheitert - jede
   *  Ursache (kein Markt / Sitzung / HTTP / Drosselung) endete im selben stummen null.
   *  Diese Pruefung beantwortet der Reihe nach, WO es klemmt, und misst am Ende
   *  empirisch, wie weit die API je Zeitrahmen ueberhaupt zurueckreicht - die Zahl,
   *  an der haengt, ob Felix' 1m-Studien (#33) machbar sind. */
  async function datenquelleTest(sym) {
    sym = (sym || 'AAPL').toUpperCase();
    var el = document.getElementById('massenStatus');
    var z = [];
    function melde(s) { if (s != null) z.push(s); if (el) el.textContent = z.join('\n'); }

    melde('Prüfe Datenquelle für ' + sym + ' …');

    // 1) Ist die Anbindung überhaupt eingeschaltet?
    if (!(window.CapAPI && window.CapAPI.enabled())) {
      melde('✗ Schritt 1: Capital.com ist in dieser App NICHT aktiv.');
      melde('  → App-Einstellungen: Schlüssel, Kennung und Passwort eintragen UND den Haken');
      melde('    „Verbindung aktivieren" setzen. Ohne den Haken wird keine Anfrage gestellt.');
      return;
    }
    melde('✓ Schritt 1: Anbindung ist eingeschaltet (Demo-Host).');

    // 2) Meldet die Sitzung an?
    var st = await window.CapAPI.status();
    if (!st.ok) {
      melde('✗ Schritt 2: Anmeldung fehlgeschlagen – ' + st.msg);
      melde('  → Häufigste Ursachen: Schlüssel gehört zum LIVE- statt zum Demo-Konto,');
      melde('    das API-Passwort ist nicht das Konto-Passwort, oder der Schlüssel ist abgelaufen.');
      return;
    }
    melde('✓ Schritt 2: ' + st.msg);

    // 3) Wird der Markt gefunden?
    var epic = await window.CapAPI.epicFor(sym);
    if (!epic) {
      melde('✗ Schritt 3: ' + (window.CapAPI.lastPriceError() || 'kein Markt gefunden'));
      return;
    }
    /* epicFor faellt notfalls auf den ersten Suchtreffer zurueck. Bindet es einen Index
     * oder ein Devisenpaar statt der Aktie, laufen dessen Kerzen rund um die Uhr und
     * passen nie zur US-Sitzung - im Auffuell-Lauf genau der stille Leerlauf-Fall. */
    var iName = '', iTyp = '';
    var mres = await window.CapAPI.roh('/markets/' + encodeURIComponent(epic));
    if (mres.ok) {
      try { var mj = JSON.parse(mres.body).instrument || {}; iName = mj.name || ''; iTyp = mj.type || ''; } catch (e) { }
    }
    melde('✓ Schritt 3: Markt gefunden – Epic „' + epic + '"' +
      (iName ? ' = ' + iName : '') + (iTyp ? ' · Typ ' + iTyp : '') + '.');
    if (iTyp && iTyp.indexOf('SHARES') === -1) {
      melde('  ⚠ Das ist KEIN Aktienmarkt. Seine Kerzen laufen rund um die Uhr und fallen');
      melde('    nicht in die US-Sitzung – der Auffüll-Lauf würde für ' + sym + ' nichts sichern.');
    }

    // 4) Was antwortet der Kurs-Endpunkt roh? Hier zählt der Rumpf, nicht nur der Status.
    var roh = await window.CapAPI.roh('/prices/' + encodeURIComponent(epic) + '?resolution=MINUTE&max=5');
    melde('· Schritt 4: HTTP ' + roh.status + ' auf /prices – Antwort: ' +
      String(roh.body || '').replace(/\s+/g, ' ').slice(0, 300));
    if (!roh.ok) {
      melde('✗ Der Kurs-Endpunkt selbst lehnt ab. Der Fehlercode oben ist die Antwort –');
      melde('  bei „limit exceeded" ist es eine Drosselung, sonst fehlt dem Konto das Recht.');
      return;
    }

    // 5) Wie weit reicht die Historie je Zeitrahmen WIRKLICH zurück?
    //    Wochenenden werden übersprungen: eine Stichprobe auf einem Samstag liefert
    //    zu Recht nichts und würde sonst als „Grenze erreicht" fehlgedeutet.
    melde('· Schritt 5: messe die tatsächliche Reichweite je Zeitrahmen …');
    var stufen = [{ iv: '1m', r: 'MINUTE' }, { iv: '5m', r: 'MINUTE_5' }, { iv: '15m', r: 'MINUTE_15' }];
    var proben = [2, 7, 14, 30, 60, 90, 180, 365];
    function werktag(ms) {
      var d = new Date(ms);
      while (d.getUTCDay() === 0 || d.getUTCDay() === 6) d.setUTCDate(d.getUTCDate() - 1);
      return d.getTime();
    }
    function iso(ms) { return new Date(ms).toISOString().slice(0, 19); }
    var ergebnis = {};
    for (var si = 0; si < stufen.length; si++) {
      var s = stufen[si], tiefe = 0, leerFolge = 0, httpFehler = 0, gestoert = false;
      for (var pi = 0; pi < proben.length; pi++) {
        var tag = werktag(Date.now() - proben[pi] * 86400000);
        // 14–18 UTC: im Sommer (Sitzung 13:30–20:00 UTC) ganz innerhalb, im Winter
        // (14:30–21:00 UTC) mit 3,5 h Überlappung – in beiden Fällen genug für ein Urteil.
        var von = new Date(tag); von.setUTCHours(14, 0, 0, 0);
        var bis = new Date(tag); bis.setUTCHours(18, 0, 0, 0);
        var r = await window.CapAPI.roh('/prices/' + encodeURIComponent(epic) +
          '?resolution=' + s.r + '&from=' + iso(von.getTime()) + '&to=' + iso(bis.getTime()) + '&max=1000');
        /* Ein HTTP-Fehler ist KEIN Messergebnis. Wuerde er wie „keine Daten" zaehlen,
         * wiese ausgerechnet dieses Werkzeug eine Drosselung als Historiengrenze aus. */
        if (!r.ok) {
          httpFehler++;
          melde('    ' + s.iv + ' bei ' + proben[pi] + ' Tagen: HTTP ' + r.status +
            ' – ' + String(r.body || '').replace(/\s+/g, ' ').slice(0, 140));
          await new Promise(function (res) { setTimeout(res, 1500 * httpFehler); });
          if (httpFehler >= 2) { gestoert = true; break; }
          continue;
        }
        var n = -1;
        try { n = (JSON.parse(r.body).prices || []).length; } catch (e) { n = -1; }
        if (n > 0) { tiefe = proben[pi]; leerFolge = 0; httpFehler = 0; }
        else if (++leerFolge >= 2) break;   // zweimal nichts hintereinander = Grenze erreicht
        await new Promise(function (res) { setTimeout(res, 250); });
      }
      ergebnis[s.iv] = gestoert ? null : tiefe;
      melde('    ' + s.iv + ': ' + (gestoert
        ? 'Messung abgebrochen (die API lehnte zweimal ab) – Tiefe UNBEKANNT, nicht „kurz".'
        : 'Historie reicht ' + (tiefe ? 'mindestens ' + tiefe + ' Tage zurück' : 'NICHT einmal 2 Tage zurück')));
    }

    melde('');
    function tg(v) { return v == null ? 'unbekannt' : v + ' T'; }
    melde('Ergebnis: 1m ' + tg(ergebnis['1m']) + ' · 5m ' + tg(ergebnis['5m']) + ' · 15m ' + tg(ergebnis['15m']) + '.');
    if (ergebnis['1m'] == null) melde('→ Für #33 keine Aussage möglich – die Messung wurde gestört. Später erneut prüfen.');
    else if (ergebnis['1m'] >= 60) melde('→ Reicht für Felix\' Winkel-Detektor (#33, braucht 60+ Tage 1m).');
    else if (ergebnis['1m'] > 0) melde('→ Für #33 (60+ Tage 1m) zu kurz; 1m bleibt beim laufenden Sammeln.');
    else melde('→ Die API gibt für ' + sym + ' gar keine 1-Minuten-Historie her; #33 bleibt beim laufenden Sammeln.');
    melde('Der Auffüll-Lauf sollte nur bis zu diesen Tiefen anfragen – alles darüber sind sichere Fehlschläge.');
    return ergebnis;
  }
  if (typeof window !== 'undefined') { window.__datenquelleTest = datenquelleTest; }



  /** Frischt den D-Verweis am oeffentlichen Einstieg auf (Depot-Reset weist D neu zu). */
  function mitFrischemD(fn) {
    return function () {
      if (holeDepot) D = holeDepot();
      return fn.apply(this, arguments);
    };
  }

  /** Von depot.js init() gerufen: reicht die Helfer herein und verkabelt die vier
   *  Knoepfe der Autopilot-Seite - die Handler sind WOERTLICH aus init() umgezogen,
   *  samt dem gegenseitigen Sperren von Pruefung und Auffuellen. */
  function verkabeln(deps) {
    universe = deps.universe;
    fetchIntraday = deps.fetchIntraday;
    spannenAusKerzen = deps.spannenAusKerzen;
    POOLS_60M = deps.POOLS_60M;
    holeDepot = deps.depot;
    // Datenquellen-Diagnose (klaert die Voraussetzung fuers Auffuellen)
    var qBtn = document.getElementById('quelleTestBtn');
    if (qBtn) qBtn.addEventListener('click', mitFrischemD(function () {
      // Beide schreiben in dieselbe Statusfläche und fragen dieselbe API - gleichzeitig
      // wuerden sie sich ueberschreiben und die Drosselgefahr genau waehrend der Messung erhoehen.
      var andere = document.getElementById('massenBtn');
      qBtn.disabled = true; if (andere) andere.disabled = true;
      datenquelleTest(universe()[0] || 'AAPL').catch(function (e) {
        var el = document.getElementById('massenStatus');
        if (el) el.textContent = 'Prüfung abgebrochen: ' + ((e && e.message) || e);
      }).then(function () { qBtn.disabled = false; if (andere) andere.disabled = false; });
    }));
    // Massen-Backfill (Kursarchiv in einem Rutsch vertiefen)
    var mBtn = document.getElementById('massenBtn');
    if (mBtn) mBtn.addEventListener('click', mitFrischemD(function () {
      if (qBtn) qBtn.disabled = true;
      massenBackfill({ tage: 90 }).catch(function () { }).then(function () { if (qBtn) qBtn.disabled = false; });
    }));
    var m1 = document.getElementById('massen1mBtn');
    if (m1) m1.addEventListener('click', mitFrischemD(function () {
      if (qBtn) qBtn.disabled = true;
      // Nur 1m: der einzige Zeitrahmen mit echter Luecke. 15m/5m stehen bereits bei ~85 Tagen.
      massenBackfill({ tage: 90, ivs: [{ iv: '1m', barMin: 1 }] })
        .catch(function () { }).then(function () { if (qBtn) qBtn.disabled = false; });
    }));
    var mStop = document.getElementById('massenStopBtn');
    if (mStop) mStop.addEventListener('click', function () { massenAbbrechen(); });
  }

  window.Backfill = {
    verkabeln: verkabeln,
    quellenMigration: mitFrischemD(quellenMigration),
    istSitzung: istSitzung
  };
})();
