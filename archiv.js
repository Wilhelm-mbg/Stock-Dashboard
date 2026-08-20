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
  var TAGE_MAX = {
    '1m':  90,     // Yahoo gibt 7 Tage; alles darueber waechst nur durchs taegliche Sammeln
    '5m':  180,    // Yahoo gibt 60 Tage; Sammeln verlaengert darueber hinaus
    '15m': 180,
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

  /** Bars fürs Speichern verschlanken: Preise auf 4 Nachkommastellen, Volumen ganzzahlig.
   *  Bei ~35.000 1-Minuten-Bars je Symbol spart das spürbar Platz auf der Platte. */
  function schlank(bars) {
    return (bars || []).map(function (b) {
      var o = [b[0], Math.round(b[1] * 10000) / 10000, Math.round(b[2] || 0)];
      if (b.length >= 5) { o.push(Math.round(b[3] * 10000) / 10000, Math.round(b[4] * 10000) / 10000); }
      return o;
    });
  }

  /** Mittlerer Dollar-Umsatz je Handelstag aus den letzten Tagen der Serie –
   *  Ersatz für Yahoos dollarVolDay, wenn die Daten aus dem Archiv kommen. */
  function dollarVolTag(bars) {
    var sum = 0, tage = {};
    (bars || []).slice(-4000).forEach(function (b) {
      if (b[2]) { sum += b[2] * b[1]; tage[new Date(b[0]).toISOString().slice(0, 10)] = 1; }
    });
    var n = Object.keys(tage).length;
    return n ? sum / n : null;
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
          var e = { series: (st && st.series) || [], dirty: false, letzterFlush: 0 };
          cache[k] = e;
          return e;
        });
      }
      return cache[k];
    }

    return {
      /** Frisch geladene Bars einpflegen (aus Live-Scan oder Backfill). */
      fuege: async function (iv, sym, bars) {
        if (!bars || bars.length < 2) return;
        var e = await lade(iv, sym);
        var vorher = e.series.length;
        e.series = kappeTage(mischeBars(e.series, bars), fensterFuer(iv));
        if (e.series.length !== vorher || bars.length) e.dirty = true;
      },
      /** Zusammengeführte Serie (Archiv inkl. aller bisherigen Einspeisungen). */
      serie: async function (iv, sym) {
        var e = await lade(iv, sym);
        return e.series;
      },
      dollarVolTag: dollarVolTag,
      /** Geänderte Serien auf die Platte schreiben – gedrosselt, außer force. */
      speichere: async function (force) {
        var now = Date.now();
        for (var k in cache) {
          var e = cache[k];
          if (!e.dirty) continue;
          if (!force && now - e.letzterFlush < FLUSH_MIN * 60000) continue;
          await api.storeSet(k, { series: schlank(e.series), updatedAt: now });
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
    mischeBars: mischeBars, kappeTage: kappeTage,
    abdeckungTage: abdeckungTage, schlank: schlank, dollarVolTag: dollarVolTag,
    baueArchiv: baueArchiv
  };
  if (typeof module !== 'undefined' && module.exports) { module.exports = Archiv; return; }
  root.ArchivKern = Archiv;
  root.Archiv = baueArchiv(root.api ? root.api : { storeGet: async function () { return null; }, storeSet: async function () { return false; } });
})(typeof window !== 'undefined' ? window : globalThis);
