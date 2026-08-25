'use strict';
/* Kursarchiv: sammelt die Intraday-Bars, die die App ohnehin lädt, dauerhaft im Store.
   Warum: Yahoo liefert rückwirkend nur ~5 Handelstage (1m) bzw. ~41 Handelstage (5m/15m).
   Jede Messung auf diesen Fenstern bleibt für immer gleich dünn – egal wie oft sie läuft.
   Das Archiv führt jeden Abruf zusammen (dedupliziert nach Zeitstempel) und behält je
   Zeitrahmen so viel, wie die Quelle hergibt (siehe TAGE_MAX). Nach ein paar Wochen Betrieb
   hat die Messung ein Vielfaches der Yahoo-Historie – auch auf 1m, wo Yahoo fast nichts gibt.
   Reine Merge-Logik ist pur gehalten und in Node testbar (module.exports). */
(function (root) {

  /* Ein einziges 90-Tage-Fenster fuer ALLE Zeitrahmen war die teuerste Zeile der App:
    * Yahoo liefert Stundenkerzen 730 Handelstage rueckwirkend, das Archiv warf alles
    * jenseits von 90 KALENDERtagen (rund 61 Handelstage) weg. Die Messung lief damit auf
    * einem Zwoelftel der frei verfuegbaren Historie - und bei 42 Handelstagen und einer
    * 70/30-Teilung blieben ganze 13 ungesehene Tage, gegen die 540 Kombinationen antraten.
    * Auf so wenig Testdaten findet man mit 540 Versuchen fast immer etwas, das gut
    * AUSSIEHT. Jetzt bekommt jeder Zeitrahmen das Fenster, das seine Quelle hergibt.
    * Gemessen am 20.08.2026 gegen die Yahoo-Chart-API:
    *   1m  -> hoechstens 7 Tage abrufbar (darueber lehnt Yahoo ab) -> Rest kommt vom Sammeln
    *   5m  -> 60 Tage abrufbar
    *   15m -> 60 Tage abrufbar
    *   60m -> 730 Handelstage abrufbar (rund 1060 Kalendertage) */
  /* Das Fenster muss zur FRAGE passen, nicht zur Quelle allein. Bis 25.08.2026 stand
   * 1m auf 90 Kalendertagen = rund 62 Handelstage. Die Vorregistrierung zu Issue #33
   * nennt 77 Handelstage; das Archiv waere also bei 62 stehengeblieben und haette das
   * Ziel nie erreicht, auf das es jede Nacht zusammengetragen wird - lautlos, denn
   * die Sammlung selbst lief ja weiter. Ein Deckel unterhalb der Frage ist derselbe
   * Fehler wie gar nicht zu sammeln, nur teurer.
   *
   * Die Reserve ist kein Luxus: die Muehle verlangt Entdeckung und Bestaetigung an
   * GETRENNTEN Tagen. Ein Datensatz, der genau die noetige Laenge hat, laesst sich
   * nicht teilen.
   *
   * Platzbedarf gemessen (25.08.2026): 1m braucht 2,03 MB je Kalendertag ueber 199
   * Werte, 250 Tage also rund 507 MB. 5m und 15m kosten zusammen ein Zehntel davon. */
  var TAGE_MAX = {
    '1m':  250,    // Yahoo gibt 7 Tage; der Rest waechst durchs taegliche Sammeln (#33 braucht 77 Handelstage)
    '5m':  365,    // Yahoo gibt 60 Tage; Sammeln verlaengert darueber hinaus
    '15m': 365,
    '60m': 1100    // deckt die vollen 730 Handelstage ab, die Yahoo direkt liefert
  };
  var MAX_TAGE = 90;                 // Rueckfall fuer unbekannte Zeitrahmen
  function fensterFuer(iv) { return TAGE_MAX[iv] || MAX_TAGE; }
  var FLUSH_MIN = 10;                // Platte höchstens alle 10 Minuten je Symbol beschreiben

  /** Zwei Bar-Serien zusammenführen: dedupliziert nach Zeitstempel, neuere Daten gewinnen
   *  (der frischeste Abruf hat den fertigen Bar, ältere evtl. den noch laufenden). */
  function mischeBars(alt, neu) {
    var byT = {};
    (alt || []).forEach(function (b) { if (b && b.length >= 2) byT[b[0]] = b; });
    (neu || []).forEach(function (b) { if (b && b.length >= 2) byT[b[0]] = b; });
    return Object.keys(byT).map(Number).sort(function (a, b) { return a - b; })
      .map(function (t) { return byT[t]; });
  }

  /** Stempel-Kerzen entfernen. Yahoo haengt an jede Chart-Antwort einen Eintrag mit der
   *  AKTUELLEN Abrufzeit an: krumme Uhrzeit (15:28:38), Volumen 0, H=L=C. Diese
   *  Pseudo-Kerzen haben einmalige Zeitstempel - der Dedup nach Zeit ersetzt sie nie,
   *  sie lagern sich fuer immer in der Messbasis ab.
   *
   *  Drei Regeln, in dieser Reihenfolge:
   *   1. Krummer Zeitstempel (Sekunden != 0) ist NIE eine Kerze. Echte Kerzen jeder
   *      Quelle beginnen auf der vollen Minute - Yahoo wie Capital (deren
   *      snapshotTimeUTC lautet '2026-08-19T09:00:00'; nachgemessen am 22.08.2026:
   *      die 45 reinen CFD-Reihen im Archiv, z. B. ADP 5m mit 4836 Kerzen, liegen zu
   *      100 % auf dem Raster). Darum braucht 'cap' hier KEINE Ausnahme.
   *   2. Stossen zwei Eintraege dichter als 0,9 Kerzenlaengen aufeinander, gewinnt der
   *      auf dem RASTER der Serie - egal ob er frueher oder spaeter kam.
   *   3. Sind beide gleich gut (oder beide daneben), gewinnt der spaetere: er traegt
   *      den fertigen Stand derselben Kerze.
   *
   *  Regel 2 ist der Kern des Befundes vom 22.08.2026: Die alte Regel entschied nach
   *  Reihenfolge statt nach Rasterlage. Faellt ein Stempel zufaellig weit genug hinter
   *  die letzte echte Kerze (17:29:31 nach 17:25:00 sind 271 s, die Schwelle liegt bei
   *  270 s), wird er behalten - und die 29 s spaeter eintreffende ECHTE 17:30-Kerze
   *  gilt als sein Stempel und faellt. Die Kette laeuft weiter, bis eine Luecke sie
   *  bricht: NVDA 5m verlor am 19.08.2026 so den ganzen Nachmittag 17:30-19:50,
   *  insgesamt 961 Stempel in 45 Symbolen (5m), 85 (1m) und 198 (15m).
   *
   *  Das Raster wird aus der Serie GELERNT, nicht auf null gesetzt: Yahoos Stundenkerzen
   *  fuer US-Aktien beginnen 13:30 UTC. 579.675 der 719.575 Stundenkerzen im Archiv
   *  liegen auf Offset 30 min - ein fest verdrahtetes t % (barMin*60000) === 0 haette
   *  vier Fuenftel des Stundenarchivs geloescht.
   *
   *  Und die gelernte Phase entscheidet NUR den Konflikt, sie loescht nie fuer sich
   *  allein: An verkuerzten Handelstagen (Thanksgiving, 3. Juli, Heiligabend) schliesst
   *  die US-Boerse 18:00 UTC, und Yahoo liefert dort eine Stundenkerze auf Offset 0 mit
   *  echter Spanne. 114 der 122 Stundenreihen haben je sieben solcher Kerzen - als
   *  Loeschregel gelesen waere die Phase ueber 800 echte Kerzen losgeworden. */
  function rasterPhase(bars, step) {
    var z = {}, phase = 0, best = -1;
    for (var i = 0; i < (bars || []).length; i++) {
      var t = bars[i][0];
      if (t % 60000 !== 0) continue;                     // Stempel zaehlen beim Lernen nicht mit
      var o = ((t % step) + step) % step;
      z[o] = (z[o] || 0) + 1;
      if (z[o] > best) { best = z[o]; phase = o; }
    }
    return phase;
  }
  function ohneStempel(bars, barMin) {
    var step = (barMin || 1) * 60000, min = step * 0.9, out = [];
    var phase = rasterPhase(bars, step);
    function aufRaster(b) { return ((b[0] % step) + step) % step === phase; }
    function quoteStempel(b) {                            // Volumen 0 und H=L=C: reiner Kursabdruck
      return !b[2] && b[3] != null && b[3] === b[4] && b[4] === b[1];
    }
    for (var i = 0; i < (bars || []).length; i++) {
      var b = bars[i];
      if (b[0] % 60000 !== 0) continue;                   // Regel 1: krummer Zeitstempel
      /* Regel 1b: neben dem Raster UND reiner Kursabdruck (Volumen 0, H=L=C) - das ist
       * ein Stempel, auch wenn kein Nachbar nah genug steht, um ihn zu ueberstimmen.
       * Noetig, weil die 0,9-Schwelle bei langen Kerzen viel Platz laesst: ein
       * 60m-Stempel um 15:28 liegt 58 min hinter der 14:30-Kerze und 62 min vor der
       * 16:30-Kerze - beide Male ueber der Schwelle von 54 min, also ohne Konflikt.
       * Die Signatur muss dabei ZUSAMMEN mit der Rasterlage zutreffen: an verkuerzten
       * Handelstagen liefert Yahoo eine echte 18:00-Stundenkerze neben dem Raster, die
       * aber eine Spanne hat (H != L) und deshalb bleibt. */
      if (!aufRaster(b) && quoteStempel(b)) continue;
      if (!out.length) { out.push(b); continue; }
      var letzt = out[out.length - 1];
      if (b[0] - letzt[0] >= min) { out.push(b); continue; }   // weit genug: eigene Kerze
      // Konflikt: zwei Eintraege innerhalb einer Kerzenlaenge - nur einer kann echt sein.
      var bR = aufRaster(b), lR = aufRaster(letzt);
      if (bR !== lR) {                                    // Regel 2: Rasterlage schlaegt Reihenfolge
        if (bR) out[out.length - 1] = b;
        continue;
      }
      var bS = quoteStempel(b), lS = quoteStempel(letzt);
      if (bS !== lS) {                                    // gleiche Rasterlage: Signatur entscheidet
        if (lS) out[out.length - 1] = b;
        continue;
      }
      out[out.length - 1] = b;                            // Regel 3: der spaetere ist der fertige
    }
    return out;
  }

  /** Serie auf die letzten maxTage Kalendertage kappen. */
  function kappeTage(bars, maxTage, nowMs) {
    var cut = (nowMs || Date.now()) - (maxTage || MAX_TAGE) * 86400000;
    return (bars || []).filter(function (b) { return b[0] >= cut; });
  }

  /** Zahl der verschiedenen Handelstage (UTC) in einer Serie. */
  function abdeckungTage(bars) {
    var set = {};
    (bars || []).forEach(function (b) { set[new Date(b[0]).toISOString().slice(0, 10)] = 1; });
    return Object.keys(set).length;
  }

  /** Bars fürs Speichern verschlanken: Preise auf 7 SIGNIFIKANTE Stellen, Volumen
   *  ganzzahlig. Bei ~35.000 1-Minuten-Bars je Symbol spart das spürbar Platz.
   *
   *  Früher waren es 4 NACHKOMMAstellen. Das ist bei Aktien unauffällig (AAPL 231,4567),
   *  bei billigen Werten aber grob: DOGE steht bei 0,0797, vier Nachkommastellen sind
   *  dort nur drei signifikante Stellen und kosten 0,025 % Genauigkeit – bei einer
   *  typischen Kerzenbewegung von 0,47 % und Kostenhürden ab 0,02 % ist das dieselbe
   *  Größenordnung wie der gesuchte Vorsprung. Die Messbasis hätte das Signal
   *  verschluckt, das sie belegen soll.
   *
   *  Signifikante Stellen skalieren mit dem Kursniveau und lösen das für jeden Wert:
   *  72843,36 wird zu 72843,36, 0,0796800 bleibt 0,0796800. Der Fehler bleibt überall
   *  unter einem Millionstel. */
  function signifikant(v, stellen) {
    if (v == null || !isFinite(v) || v === 0) return v == null ? v : 0;
    var m = Math.pow(10, stellen - 1 - Math.floor(Math.log(Math.abs(v)) / Math.LN10));
    return Math.round(v * m) / m;
  }
  function schlank(bars) {
    return (bars || []).map(function (b) {
      var o = [b[0], signifikant(b[1], 7), Math.round(b[2] || 0)];
      if (b.length >= 5) { o.push(signifikant(b[3], 7), signifikant(b[4], 7)); }
      return o;
    });
  }

  /** Median der Geld-Brief-Spanne je Kalendertag, aus Kerzen, die sie als Element [5]
   *  tragen (capital.js/pricesRange). Ergebnis in genau der Form, die depot.js in
   *  D.spannen.tage fuehrt: { "YYYY-MM-DD": { n, med } }.
   *
   *  Rein und ohne Zustand, damit sie in Node geprueft werden kann - wie die uebrige
   *  Merge-Logik dieser Datei.
   *
   *  Kerzen ohne [5] werden UEBERGANGEN, nicht als 0 gezaehlt: eine fehlende Spanne
   *  ist unbekannt, nicht eng. Ein Median ueber Nullen waere die schoenste und
   *  falscheste Zahl, die diese Datei liefern koennte. */
  function spannenJeTag(bars) {
    var jeTag = {};
    (bars || []).forEach(function (b) {
      if (!b || b.length < 6) return;
      var sp = b[5];
      if (sp == null || typeof sp !== 'number' || !isFinite(sp) || sp < 0) return;
      var tag = new Date(b[0]).toISOString().slice(0, 10);
      (jeTag[tag] = jeTag[tag] || []).push(sp);
    });
    var aus = {};
    Object.keys(jeTag).forEach(function (tag) {
      var a = jeTag[tag].sort(function (x, y) { return x - y; });
      aus[tag] = { n: a.length, med: Math.round(a[Math.floor(a.length / 2)] * 1e6) / 1e6 };
    });
    return aus;
  }

  /** Mittlerer Dollar-Umsatz je Handelstag aus den letzten Tagen der Serie –
   *  Ersatz für Yahoos dollarVolDay, wenn die Daten aus dem Archiv kommen. */
  /** Liegt der Zeitpunkt in einem als CFD gekennzeichneten Bereich? */
  function ausCfd(ms, bereiche) {
    for (var i = 0; i < (bereiche || []).length; i++) {
      if (ms >= bereiche[i][0] && ms <= bereiche[i][1]) return true;
    }
    return false;
  }
  function dollarVolTag(bars, bereiche) {
    var sum = 0, tage = {};
    (bars || []).slice(-4000).forEach(function (b) {
      /* CFD-Kerzen ueberspringen: Capital.com-Volumen ist NICHT mit Boersenvolumen
       * vergleichbar (Faktor mehrere hundert). Ein daraus gerechneter Dollar-Umsatz
       * ist keine kleine Zahl, sondern eine falsche - und wuerde den Wert stumm aus
       * jedem Messlauf werfen. Bleibt nichts uebrig, ist die Antwort ehrlich null
       * ('unbekannt'), und der Aufrufer filtert dann bewusst nicht. */
      if (b[2] && !ausCfd(b[0], bereiche)) { sum += b[2] * b[1]; tage[new Date(b[0]).toISOString().slice(0, 10)] = 1; }
    });
    var n = Object.keys(tage).length;
    return n ? sum / n : null;
  }
  /** Zwei Bereichslisten vereinigen und angrenzende verschmelzen. */
  function bereicheMerge(alt, neu) {
    var alle = (alt || []).concat(neu || []).filter(function (b) { return b && b.length === 2; });
    alle.sort(function (x, y) { return x[0] - y[0]; });
    var out = [];
    alle.forEach(function (b) {
      var l = out[out.length - 1];
      if (l && b[0] <= l[1] + 86400000) { l[1] = Math.max(l[1], b[1]); }
      else out.push([b[0], b[1]]);
    });
    return out;
  }

  // ---- Renderer-Teil (braucht window.api für den Store) ----
  function baueArchiv(api) {
    var cache = {};        // key -> { series, dirty, geladen, letzterFlush }
    function key(iv, sym) { return 'bars_' + iv + '_' + String(sym).replace(/[^\w.^-]/g, '_'); }

    async function lade(iv, sym) {
      var k = key(iv, sym);
      // Single-Flight: rufen zwei Stellen gleichzeitig dasselbe Symbol ab (Scan + Backfill),
      // teilen sie sich EINE Ladung – sonst überschreibt die zweite die Merges der ersten.
      if (!cache[k]) {
        cache[k] = api.storeGet(k).then(function (st) {
          var e = { series: (st && st.series) || [], capBereiche: (st && st.capBereiche) || [],
                    dirty: false, letzterFlush: 0 };
          cache[k] = e;
          return e;
        });
      }
      return cache[k];
    }

    return {
      /** Frisch geladene Bars einpflegen (aus Live-Scan oder Backfill).
       *  ohneStempel raeumt dabei auch Altlasten im Bestand ab - die laufende
       *  Kerze bleibt bewusst drin (der naechste Abruf ersetzt sie fertig). */
      fuege: async function (iv, sym, bars, quelle) {
        if (!bars || bars.length < 2) return;
        var e = await lade(iv, sym);
        if (quelle === 'cap') {
          // Zeitbereich der eingespeisten CFD-Kerzen festhalten
          var von = bars[0][0], bis = bars[0][0];
          for (var q = 1; q < bars.length; q++) {
            if (bars[q][0] < von) von = bars[q][0];
            if (bars[q][0] > bis) bis = bars[q][0];
          }
          e.capBereiche = bereicheMerge(e.capBereiche, [[von, bis]]);
        }
        var vorher = e.series.length;
        var barMin = parseInt(iv, 10) || 1;
        e.series = kappeTage(ohneStempel(mischeBars(e.series, bars), barMin), fensterFuer(iv));
        if (e.series.length !== vorher || bars.length) e.dirty = true;
      },
      /** Zusammengeführte Serie (Archiv inkl. aller bisherigen Einspeisungen). */
      serie: async function (iv, sym) {
        var e = await lade(iv, sym);
        return e.series;
      },
      dollarVolTag: dollarVolTag, spannenJeTag: spannenJeTag,
      /** Gekennzeichnete CFD-Bereiche eines Symbols (fuer quellenbewusste Auswertung). */
      bereiche: async function (iv, sym) { var e = await lade(iv, sym); return e.capBereiche || []; },
      /** Nachtraegliches Kennzeichnen (einmalige Umstellung fuer schon geschriebene Daten). */
      markiere: async function (iv, sym, von, bis) {
        var e = await lade(iv, sym);
        e.capBereiche = bereicheMerge(e.capBereiche, [[von, bis]]);
        e.dirty = true;
      },
      /** Geänderte Serien auf die Platte schreiben – gedrosselt, außer force. */
      speichere: async function (force) {
        var now = Date.now();
        for (var k in cache) {
          var e = cache[k];
          if (!e.dirty) continue;
          if (!force && now - e.letzterFlush < FLUSH_MIN * 60000) continue;
          // capBereiche MUSS mitgeschrieben werden - sonst loescht der naechste Flush
          // die Kennzeichnung, weil storeSet den ganzen Datensatz ersetzt.
          await api.storeSet(k, { series: schlank(e.series), updatedAt: now,
            capBereiche: e.capBereiche && e.capBereiche.length ? e.capBereiche : undefined });
          e.dirty = false; e.letzterFlush = now;
        }
      },
      /** Abdeckung je Zeitrahmen über eine Symbolliste: {tageMin, tageMedian, symbole}. */
      abdeckung: async function (iv, syms) {
        var tage = [];
        for (var i = 0; i < syms.length; i++) {
          var e = await lade(iv, syms[i]);
          if (e.series.length > 50) tage.push(abdeckungTage(e.series));
        }
        tage.sort(function (a, b) { return a - b; });
        return {
          symbole: tage.length,
          tageMin: tage.length ? tage[0] : 0,
          tageMedian: tage.length ? tage[Math.floor(tage.length / 2)] : 0
        };
      }
    };
  }

  var Archiv = {
    MAX_TAGE: MAX_TAGE, TAGE_MAX: TAGE_MAX, fensterFuer: fensterFuer,
    mischeBars: mischeBars, kappeTage: kappeTage, ohneStempel: ohneStempel, rasterPhase: rasterPhase,
    abdeckungTage: abdeckungTage, schlank: schlank, dollarVolTag: dollarVolTag,
    spannenJeTag: spannenJeTag,
    baueArchiv: baueArchiv
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Archiv; return; }
  root.ArchivKern = Archiv;
  root.Archiv = baueArchiv(root.api ? root.api : { storeGet: async function () { return null; }, storeSet: async function () { return false; } });
})(typeof window !== 'undefined' ? window : globalThis);
