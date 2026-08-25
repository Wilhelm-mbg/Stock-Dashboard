'use strict';
/* ================= Parallel-Helfer und Backtest-Worker-Pool =================
 *
 * Stufe E des Struktur-Plans, Block 3a: WOERTLICH aus depot.js umgezogen. Der Pool
 * verteilt Backtests auf echte Worker-Threads (bt-worker.js) und stellt pmap als
 * allgemeinen Parallel-Helfer bereit. Er handelt nichts.
 *
 * depot.js behaelt nach dem Umzug schlanke Aliase (var pmap = window.BTPool.pmap, ...)
 * - die rund zwanzig Aufrufstellen im Handelsmodul bleiben dadurch unveraendert.
 * Hereingereicht wird nur handelBrauchtRechenzeit: die Frage, ob der Handel die
 * Kerne gerade selbst braucht, gehoert dem Handelsmodul. HEALTH ist dort geblieben;
 * der Ausfallzaehler wird als Zaehlfunktion hereingereicht. */
(function () {
  var Q = window.Quant;
  /* Von depot.js hereingereicht (verkabeln) - mit sicheren Vorgaben, damit der Pool
   * auch ohne Verkabelung rechnet (dann konservativ). */
  var handelBrauchtRechenzeit = function () { return true; };
  var workerAusfall = function () { };

  /* ================= Parallel-Helfer & Backtest-Worker-Pool ================= */
  /** Parallel über Items laufen (max. conc gleichzeitig), Reihenfolge bleibt erhalten. */
  async function pmap(items, worker, conc) {
    var out = new Array(items.length), idx = 0;
    async function lane() {
      while (idx < items.length) {
        var i = idx++;
        try { out[i] = await worker(items[i], i); } catch (e) { out[i] = null; }
      }
    }
    var lanes = [];
    for (var l = 0; l < Math.max(1, Math.min(conc || 5, items.length)); l++) lanes.push(lane());
    await Promise.all(lanes);
    return out;
  }

  /** Worker-Pool: Backtests laufen in eigenen Threads (nutzt mehrere CPU-Kerne, UI bleibt flüssig). */
  var BTPool = (function () {
    /* Wie viele Worker duerfen laufen? Der alte feste Deckel von 8 schnitt die Formel ab:
     * auf einem 16-Thread-Rechner wollte sie 12 und bekam 8 - die halbe Maschine lag brach,
     * ausgerechnet bei der Nacht-Messung, wo niemand die Oberflaeche braucht.
     * Jetzt nach Lage: Boerse zu -> 75 % (Messung/Tiefensuche duerfen liefern),
     * Boerse offen -> 50 % (Luft fuer Oberflaeche, Kursabrufe und den Live-Scanner). */
    function poolGroesse() {
      var kerne = (typeof navigator !== 'undefined' && navigator.hardwareConcurrency) || 4;
      var zu = true;
      try { zu = !(window.Dash && window.Dash.marketOpen && window.Dash.marketOpen()); } catch (e) { zu = true; }
      // Boerse zu UND Handel pausiert: die Maschine hat nichts Besseres zu tun.
      // Zwei Threads bleiben dem Betriebssystem und der Oberflaeche.
      if (zu && !handelBrauchtRechenzeit()) return Math.max(2, Math.min(15, kerne - 2));
      return zu ? Math.max(2, Math.min(12, Math.floor(kerne * 0.75)))
                : Math.max(2, Math.min(8, Math.floor(kerne * 0.5)));
    }
    var workers = [], queue = [], nextId = 1, pending = {}, ok = typeof Worker !== 'undefined';
    // Kurskarten bekommen eine Kennung; jeder Worker cached die letzten 3 Karten und
    // erhält Folgeauftraege nur noch mit der Kennung statt mit dem kompletten Datensatz.
    var MAP_IDS = (typeof WeakMap !== 'undefined') ? new WeakMap() : null;
    var mapIdZaehler = 0;
    function mapIdVon(m) {
      if (!MAP_IDS || !m || typeof m !== 'object') return 0;
      if (!MAP_IDS.has(m)) MAP_IDS.set(m, ++mapIdZaehler);
      return MAP_IDS.get(m);
    }
    var fehler = 0;
    function fertig(id, res) {
      var job = pending[id];
      if (!job) return;
      delete pending[id];
      if (job.timer) clearTimeout(job.timer);
      job.cb(res);
    }
    /** Rechnet im Hauptthread weiter – langsamer, aber es bleibt nie etwas hängen. */
    function selbstRechnen(job) {
      try {
        // Notpfad ohne Worker - muss dieselben Auftragsarten kennen, sonst faellt
        // ein Buendel-Auftrag beim Ausfall des Hintergrund-Rechnens lautlos auf die Nase.
        if (job.fn === 'daily') job.cb(Q.backtest(job.histMap, job.opts));
        else if (job.fn === 'intradayMulti') job.cb(Q.backtestIntradayMulti(job.histMap, job.opts.basis, job.opts.varianten));
        else job.cb(Q.backtestIntraday(job.histMap, job.opts));
      } catch (e) { job.cb({ error: String(e && e.message ? e.message : e) }); }
    }
    function spawn() {
      var w;
      try { w = new Worker('bt-worker.js'); } catch (e) { ok = false; return null; }
      w.busy = false; w.jobId = 0;
      // Erstkontakt-Wächter: Antwortet ein frisch gestarteter Worker nicht (z. B. weil das
      // Hintergrund-Rechnen in dieser Umgebung gesperrt ist), wird endgültig auf den
      // Hauptthread umgeschaltet, statt ewig zu warten.
      w.probe = setTimeout(function () { if (!w.hatGeantwortet) w.onerror(); }, 8000);
      try { w.postMessage({ ping: 1 }); } catch (ePing) { /* faellt in onerror */ }
      w.onmessage = function (e2) {
        w.hatGeantwortet = true;
        if (w.probe) { clearTimeout(w.probe); w.probe = null; }
        if (e2.data && e2.data.pong) return;      // reines Lebenszeichen, kein Auftrag
        w.busy = false; w.jobId = 0;
        fertig(e2.data.id, e2.data.ok ? e2.data.res : { error: e2.data.msg || 'Worker-Fehler' });
        pump();
      };
      // Stirbt ein Worker, darf der Auftrag NICHT verloren gehen – sonst wartet die Analyse ewig.
      w.onerror = function () {
        var id = w.jobId;
        if (w.probe) { clearTimeout(w.probe); w.probe = null; }
        w.busy = false; w.jobId = 0;
        fehler++;
        var idx = workers.indexOf(w);
        if (idx !== -1) workers.splice(idx, 1);
        try { w.terminate(); } catch (e3) { /* egal */ }
        /* Der Ausfallzaehler wohnt beim Gesundheitsblock in depot.js - hereingereicht,
         * damit er hier nicht still zum Leerlauf wird (der alte typeof-Guard haette
         * in dieser Datei nie gezaehlt). */
        workerAusfall();
        // Erst mehrere Ausfaelle sind ein Umgebungsproblem. Ein einzelner Ausfall ist ein
        // einzelner Ausfall - frueher legte er den Pool fuer die ganze Sitzung still.
        if (fehler >= 3) ok = false;   // Hintergrund-Rechnen klappt hier nicht → Hauptthread
        var job = pending[id];
        if (job) { delete pending[id]; if (job.timer) clearTimeout(job.timer); selbstRechnen(job); }
        // wartende Aufträge ebenfalls retten
        if (!ok) {
          workers.slice().forEach(function (ww) { try { ww.terminate(); } catch (e4) { /* egal */ } });
          workers.length = 0;
          Object.keys(pending).forEach(function (pid) {
            var pj = pending[pid]; delete pending[pid];
            if (pj.timer) clearTimeout(pj.timer);
            selbstRechnen(pj);
          });
          var q = queue.splice(0, queue.length);
          q.forEach(selbstRechnen);
        } else pump();
      };
      workers.push(w);
      return w;
    }
    function pump() {
      // Ist das Hintergrund-Rechnen ausgefallen, dürfen wartende Aufträge nicht liegenbleiben.
      if (!ok) { var rest = queue.splice(0, queue.length); rest.forEach(selbstRechnen); return; }
      while (queue.length) {
        var free = null;
        for (var i = 0; i < workers.length; i++) if (!workers[i].busy) { free = workers[i]; break; }
        if (!free && workers.length < poolGroesse()) free = spawn();
        if (!free) {
          // Kein Worker verfügbar: entweder alle beschäftigt (warten) oder gar keiner möglich (selbst rechnen)
          if (!ok) { var rest2 = queue.splice(0, queue.length); rest2.forEach(selbstRechnen); }
          return;
        }
        var job = queue.shift();
        free.busy = true; free.jobId = job.id;
        pending[job.id] = job;
        // Karte nur mitschicken, wenn dieser Worker sie noch nicht hat
        if (!free.hatMaps) free.hatMaps = {};
        var mitDaten = !job.mapId || !free.hatMaps[job.mapId];
        if (mitDaten && job.mapId) {
          free.hatMaps[job.mapId] = Date.now();
          var kIds = Object.keys(free.hatMaps);
          if (kIds.length > 3) {
            kIds.sort(function (a2, b2) { return free.hatMaps[a2] - free.hatMaps[b2]; });
            delete free.hatMaps[kIds[0]];
            try { free.postMessage({ evict: parseInt(kIds[0], 10) }); } catch (eEv) { /* egal */ }
          }
        } else if (job.mapId) {
          free.hatMaps[job.mapId] = Date.now();   // zuletzt benutzt aktualisieren
        }
        // Sicherheitsnetz: Ein Auftrag, der nach 3 Minuten nicht zurück ist, gilt als verloren.
        // Der Worker wird dabei beendet und ersetzt – er rechnete sonst weiter und alle
        // Folgejobs stauten sich bei ihm und liefen kaskadierend in denselben Timeout.
        job.timer = setTimeout((function (jid, wk) {
          return function () {
            var j = pending[jid];
            if (!j) return;
            delete pending[jid];
            try { wk.terminate(); } catch (e0) {}
            var wi = workers.indexOf(wk);
            if (wi >= 0) workers.splice(wi, 1);
            j.cb({ error: 'Zeitüberschreitung im Hintergrund-Rechner' });
            pump();
          };
        })(job.id, free), 180000);
        free.postMessage({ id: job.id, fn: job.fn, mapId: job.mapId, map: mitDaten ? job.histMap : null, opts: job.opts });
      }
    }
    function run(fn, histMap, opts) {
      if (!ok) {
        return new Promise(function (resolve) {
          // Hauptthread nicht blockieren: Aufträge nacheinander im Leerlauf abarbeiten
          setTimeout(function () { selbstRechnen({ fn: fn, histMap: histMap, opts: opts, cb: resolve }); }, 0);
        });
      }
      return new Promise(function (resolve) {
        queue.push({ id: nextId++, fn: fn, histMap: histMap, mapId: mapIdVon(histMap), opts: opts, cb: resolve });
        pump();
      });
    }
    return { run: run };
  })();
  function btIntraday(map, opts) { return BTPool.run('intraday', map, opts); }

  /* Was haette gleichgewichtetes Halten desselben Universums ueber diese Scheibe
   * gebracht? In Prozent - dieselbe Einheit, in der foldRets rechnen.
   * Der Massstab, der dem Autopiloten bis zum 24.08.2026 fehlte. */
  function haltenUeberScheibe(map, von, bis) {
    var rr = [];
    Object.keys(map || {}).forEach(function (sym) {
      var b = map[sym];
      if (!Array.isArray(b) || b.length < 2) return;
      var ein = null, aus = null;
      for (var i = 0; i < b.length; i++) {
        var ms = b[i][0];
        if (ms < von || ms > bis) continue;
        if (!(b[i][1] > 0)) continue;
        if (ein == null) ein = b[i][1];
        aus = b[i][1];
      }
      if (ein != null && aus != null && ein > 0) rr.push(aus / ein - 1);
    });
    if (!rr.length) return null;
    /* Median statt Mittel: Ein einzelner Verdreifacher soll den Massstab nicht
     * verschieben. Wer den Median schlaegt, schlaegt den typischen Wert. */
    rr.sort(function (a, b) { return a - b; });
    return rr[rr.length >> 1] * 100;
  }
  /** Mehrere Varianten in einem Auftrag - der Worker berechnet die Einstiegssignale
   *  einmal und teilt sie. Rueckgabe: Array der Einzelergebnisse. */
  function btIntradayMulti(map, basis, varianten) {
    return BTPool.run('intradayMulti', map, { basis: basis, varianten: varianten });
  }
  function btDaily(map, opts) { return BTPool.run('daily', map, opts); }


  window.BTPool = {
    verkabeln: function (deps) {
      if (deps.handelBrauchtRechenzeit) handelBrauchtRechenzeit = deps.handelBrauchtRechenzeit;
      if (deps.workerAusfall) workerAusfall = deps.workerAusfall;
    },
    run: function (art, map, opts) { return BTPool.run(art, map, opts); },
    pmap: pmap,
    btIntraday: btIntraday,
    btDaily: btDaily,
    btIntradayMulti: btIntradayMulti,
    haltenUeberScheibe: haltenUeberScheibe
  };
})();
