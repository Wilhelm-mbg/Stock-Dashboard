'use strict';
/* Capital.com-Demo-Anbindung – Paper-Trading mit echten Marktpreisen.
   Bewusst NUR das Demo-Konto: der Live-Host ist in der App nicht freigeschaltet. */
(function () {
  var BASE = 'https://demo-api-capital.backend-capital.com/api/v1';
  var tokens = null, tokenTime = 0, lastError = '', letzterKursFehler = '', letzterGrundArt = '';

  /** Capital liefert snapshotTimeUTC als "2026-08-19T09:00:00" – OHNE Zeitzonen-Kennung.
   *  JavaScript liest so etwas als LOKALE Zeit; in Berlin wären alle Kerzen damit um 1–2
   *  Stunden verschoben und jede Uhrzeit-Logik (Handelsfenster, VWAP-Tagesreset, ORB)
   *  liefe auf falschen Zeitstempeln. Fehlt die Kennung, wird sie ergänzt. */
  function zeitUtc(s) {
    var t = String(s || '').trim().replace(' ', 'T');
    if (t && !/(Z|[+-]\d{2}:?\d{2})$/.test(t)) t += 'Z';
    var ms = new Date(t).getTime();
    return isNaN(ms) ? new Date(s).getTime() : ms;
  }

  function cfg() {
    var s = window.getSettings();
    return {
      key: s.capKey || '', id: s.capId || '', pass: s.capPass || '',
      on: !!(s.capEnabled && s.capKey && s.capId && s.capPass)
    };
  }

  async function loginRoh() {
    var c = cfg();
    var res = await window.api.capFetch('POST', BASE + '/session', { 'X-CAP-API-KEY': c.key }, { identifier: c.id, password: c.pass });
    if (res.ok && res.headers && res.headers.cst) {
      tokens = { cst: res.headers.cst, sec: res.headers['x-security-token'] };
      tokenTime = Date.now();
      lastError = '';
      return true;
    }
    tokens = null;
    try { lastError = JSON.parse(res.body).errorCode || ('HTTP ' + res.status); } catch (e) { lastError = 'HTTP ' + res.status; }
    return false;
  }
  // Läuft der Token ab, während mehrere Aufrufe gleichzeitig unterwegs sind, feuerten bisher
  // alle zusammen POST /session. Capital.com drosselt die Session-Erstellung hart (bis hin zur
  // zeitweiligen Sperre). Ein laufender Login wird deshalb geteilt statt vervielfacht.
  var loginLaeuft = null;
  function login() {
    if (loginLaeuft) return loginLaeuft;
    loginLaeuft = loginRoh().then(function (ok) { loginLaeuft = null; return ok; },
      function (e) { loginLaeuft = null; tokens = null; lastError = String((e && e.message) || e); return false; });
    return loginLaeuft;
  }

  async function call(method, path, body) {
    if (!cfg().on) return { ok: false, status: 0, body: 'Capital.com nicht konfiguriert' };
    if (!tokens || Date.now() - tokenTime > 8 * 60000) {
      if (!(await login())) return { ok: false, status: 401, body: 'Login fehlgeschlagen: ' + lastError };
    }
    var res = await window.api.capFetch(method, BASE + path, {
      'X-CAP-API-KEY': cfg().key, 'CST': tokens.cst, 'X-SECURITY-TOKEN': tokens.sec
    }, body);
    if (res.status === 401) {
      // Session serverseitig abgelaufen: einmal neu einloggen und den Aufruf wiederholen –
      // vorher schlug genau dieser eine Aufruf fehl und erst der nächste kam wieder durch.
      tokens = null;
      if (await login()) {
        res = await window.api.capFetch(method, BASE + path, {
          'X-CAP-API-KEY': cfg().key, 'CST': tokens.cst, 'X-SECURITY-TOKEN': tokens.sec
        }, body);
        if (res.ok) tokenTime = Date.now();
      }
    }
    else if (res.ok) { tokenTime = Date.now(); }
    return res;
  }

  /** Schreibweisen desselben Kuerzels. Capital laesst den Anteilsklassen-Trenner weg:
   *  BRK-B heisst dort BRKB. Das ist eine bekannte Notationsdifferenz, keine Rateerei -
   *  deshalb bleibt der Vergleich exakt, nur auf beiden Schreibweisen.
   *  Boersensuffixe wie SAP.DE bleiben unberuehrt: dort steht ein Laendercode aus zwei
   *  Buchstaben, kein einzelner Klassenbuchstabe. */
  function tickerVarianten(sym) {
    var out = [sym];
    var m = /^([A-Za-z0-9]+)[-.]([A-Za-z])$/.exec(sym);
    if (m) out.push(m[1] + m[2]);
    return out;
  }

  window.CapAPI = {
    enabled: function () { return cfg().on; },
    lastError: function () { return lastError; },

    /** Verbindungstest + Kontostand */
    status: async function () {
      var res = await call('GET', '/accounts');
      if (!res.ok) return { ok: false, msg: 'Nicht verbunden (' + (lastError || 'HTTP ' + res.status) + ')' };
      try {
        var acc = JSON.parse(res.body).accounts[0];
        return { ok: true, msg: 'Demo verbunden · ' + acc.accountName + ' · Guthaben ' + acc.balance.balance + ' ' + acc.currency, balance: acc.balance.balance };
      } catch (e) { return { ok: false, msg: 'Antwort unlesbar' }; }
    },

    /** Roher GET fuer die Diagnose: liefert Status UND Rumpf unveraendert zurueck.
     *  Jede andere Methode hier verschluckt den Grund - fuer die Fehlersuche ist
     *  aber genau der Rumpf die Antwort (errorCode von Capital.com). */
    roh: async function (pfad) { return await call('GET', pfad); },

    /** Warum ist der letzte Kursabruf gescheitert? Vorher endeten drei voellig
     *  verschiedene Ursachen in einem stummen null (kein Markt / HTTP-Fehler /
     *  unlesbare Antwort) - damit war ein Fehlschlag nicht diagnostizierbar. */
    lastPriceError: function () { return letzterKursFehler; },
    /** Fehlerart als CODE, nicht als Text: 'kein-markt' | 'http' | 'unlesbar' | ''.
     *  Aufrufer duerfen sich nie auf den Wortlaut einer Meldung verlassen - genau das
     *  brach am 23.08.2026, als aus 'Kein Markt' ein 'Kein gesicherter Markt' wurde. */
    lastErrorKind: function () { return letzterGrundArt; },

    /** Markt (Epic) zum Symbol finden – mit Cache.
     *
     *  Frueher nahm diese Funktion bei fehlender Epic-Uebereinstimmung den ERSTEN
     *  SHARES-Treffer der Suche, notfalls sogar den ersten Treffer ueberhaupt - ohne
     *  zu pruefen, ob das dieselbe Gesellschaft ist. Was das anrichtet, stand am
     *  22.08.2026 im Kursarchiv: 'WBD' war zu 'WBDIT' geworden (2,22 statt 28,50 und
     *  europaeische Handelszeit - vom US-Sitzungsfilter blieben 16 statt 78 Kerzen
     *  am Tag uebrig), 'EA' zu 'EAT' (Brinker International; US-notiert und deshalb
     *  voellig unauffaellig: 78 Kerzen am Tag, nur eben die falsche Firma).
     *  Einen Tag spaeter standen sechs solcher Zuordnungen im Cache, darunter
     *  'NET' -> 'NFLX' - Cloudflare auf Netflix, und NFLX handelt die App selbst.
     *
     *  Das Epic landet nicht nur im Archiv: openPosition spiegelt Signale darueber
     *  auf das Demo-Konto. Eine falsche Zuordnung heisst, dass ein NET-Signal eine
     *  Netflix-Position eroeffnet. Kein CFD-Kurs ist besser als der eines fremden
     *  Wertes, also wird nur noch angenommen, was belegbar ist: das Epic heisst wie
     *  das Symbol, oder Capital nennt das Symbol selbst (Feld 'symbol' der Suche).
     *
     *  Auch der Cache wird daran gemessen. Ein gespeicherter Eintrag, dessen Epic
     *  ANDERS heisst als das Symbol, gilt nicht mehr ungeprueft - sonst haetten die
     *  sechs Fehlgriffe ewig weitergewirkt, denn der Cache lief vor der Pruefung.
     *  Die 152 von 158 Eintraegen mit Epic = Symbol kosten dabei keine einzige
     *  zusaetzliche Anfrage. */
    epicFor: async function (sym) {
      var cache = (await window.api.storeGet('cap_epics')) || {};
      if (cache[sym] === sym) return cache[sym];         // belegt: das Epic heisst wie das Symbol
      var res = await call('GET', '/markets?searchTerm=' + encodeURIComponent(sym));
      if (!res.ok) {
        /* Bewusst kein Rueckfall auf den gespeicherten Eintrag: hier landen nur noch
         * die ungesicherten Zuordnungen, und die sollen einen Netzfehler nicht
         * ueberleben. Ein Symbol ohne Kurs faellt auf; ein falscher Kurs nicht. */
        letzterGrundArt = 'http';
        letzterKursFehler = 'Marktsuche für ' + sym + ' fehlgeschlagen: HTTP ' + res.status +
          (res.body ? ' – ' + String(res.body).slice(0, 160) : '');
        return null;
      }
      try {
        var mkts = JSON.parse(res.body).markets || [];
        var vari = tickerVarianten(sym);
        var hit = mkts.filter(function (m) { return vari.indexOf(m.epic) !== -1; })[0] ||
                  mkts.filter(function (m) { return vari.indexOf(m.symbol) !== -1; })[0];
        if (hit) { cache[sym] = hit.epic; await window.api.storeSet('cap_epics', cache); return hit.epic; }
        // Nichts Belegbares dabei - eine frueher geratene Zuordnung fliegt hier raus.
        var verworfen = mkts.slice(0, 3).map(function (m) {
          return m.epic + (m.instrumentName ? ' (' + m.instrumentName + ')' : '');
        }).join(', ');
        if (cache[sym]) { delete cache[sym]; await window.api.storeSet('cap_epics', cache); }
        letzterGrundArt = 'kein-markt';
        letzterKursFehler = 'Kein gesicherter Markt für ' + sym + ': die Suche lieferte ' + mkts.length +
          ' Treffer, aber keinen, dessen Epic oder Symbol ' + sym + ' heißt' +
          (verworfen ? ' – verworfen: ' + verworfen : '') +
          '. Capital.com führt nicht jeden US-Wert als CFD.';
      } catch (e) { letzterGrundArt = 'unlesbar'; letzterKursFehler = 'Marktsuche für ' + sym + ': Antwort unlesbar'; }
      return null;
    },

    /** Position auf dem DEMO-Konto eröffnen (mit Stop/Ziel auf Basiswert-Niveau) */
    openPosition: async function (sym, dir, size, stopLevel, profitLevel) {
      var epic = await this.epicFor(sym);
      if (!epic) return { ok: false, msg: 'Kein Markt für ' + sym + ' gefunden' };
      var body = { epic: epic, direction: dir === 'call' ? 'BUY' : 'SELL', size: size, guaranteedStop: false };
      if (stopLevel) body.stopLevel = Math.round(stopLevel * 100) / 100;
      if (profitLevel) body.profitLevel = Math.round(profitLevel * 100) / 100;
      var res = await call('POST', '/positions', body);
      if (!res.ok) {
        var msg; try { msg = JSON.parse(res.body).errorCode; } catch (e) { msg = 'HTTP ' + res.status; }
        return { ok: false, msg: msg };
      }
      try {
        var ref = JSON.parse(res.body).dealReference;
        // Bestätigung abholen → dealId UND den tatsaechlichen Ausfuehrungskurs
        var conf = await call('GET', '/confirms/' + ref);
        if (conf.ok) {
          var cj = JSON.parse(conf.body);
          if (cj.dealStatus === 'ACCEPTED') {
            var dealId = (cj.affectedDeals && cj.affectedDeals[0] && cj.affectedDeals[0].dealId) || cj.dealId;
            /* level = der Kurs, zu dem WIRKLICH ausgefuehrt wurde. Der wurde bisher
             * weggeworfen - damit war die einzige Stelle des Projekts mit echten
             * Ausfuehrungen blind fuer ihre eigene Kernfrage: was kostet ein Trade
             * tatsaechlich? (Inventur 22.08.2026) */
            return { ok: true, dealId: dealId, epic: epic,
              fill: cj.level != null ? cj.level : null, fillT: Date.now() };
          }
          return { ok: false, msg: cj.rejectReason || cj.dealStatus };
        }
        return { ok: true, dealId: null, epic: epic, msg: 'ohne Bestätigung' };
      } catch (e) { return { ok: false, msg: 'Antwort unlesbar' }; }
    },

    /** Aktuelle Geld-/Briefkurse eines Marktes - fuer die Spannen-Messung.
     *  Rueckgabe: {bid, ask, mid, spreadPct} oder null. */
    quote: async function (sym) {
      letzterKursFehler = '';
      var epic = await this.epicFor(sym);
      if (!epic) return null;
      var res = await call('GET', '/markets/' + encodeURIComponent(epic));
      if (!res.ok) {
        letzterKursFehler = 'Spanne ' + sym + ': HTTP ' + res.status +
          (res.body ? ' – ' + String(res.body).slice(0, 160) : '');
        return null;
      }
      try {
        var s = JSON.parse(res.body).snapshot || {};
        if (s.bid == null || s.offer == null) {
          letzterKursFehler = 'Spanne ' + sym + ': Antwort enthält keine Geld-/Briefkurse ' +
            '(Markt geschlossen oder nicht handelbar).';
          return null;
        }
        var mid = (s.bid + s.offer) / 2;
        return { bid: s.bid, ask: s.offer, mid: mid, spreadPct: mid > 0 ? (s.offer - s.bid) / mid : null };
      } catch (e) {
        letzterKursFehler = 'Spanne ' + sym + ': Antwort unlesbar';
        return null;
      }
    },

    /** Kursdaten (Kerzen) von der Demo-API – als Reserve, wenn Yahoo ausfällt.
     *  Rückgabe: {series: [[t, mid, vol]], dollarVolDay: null} oder null. */
    // (siehe zeitUtc oben: Capital liefert "2026-08-19T09:00:00" OHNE Zeitzonen-Kennung)
    prices: async function (sym, interval, max) {
      var RES = { '1m': 'MINUTE', '5m': 'MINUTE_5', '15m': 'MINUTE_15', '60m': 'HOUR' };
      var epic = await this.epicFor(sym);
      if (!epic) return null;
      var res = await call('GET', '/prices/' + encodeURIComponent(epic) + '?resolution=' + (RES[interval] || 'MINUTE_5') + '&max=' + (max || 500));
      if (!res.ok) {
        letzterKursFehler = 'Kursabruf ' + sym + ' (' + interval + '): HTTP ' + res.status +
          (res.body ? ' – ' + String(res.body).slice(0, 160) : '');
        return null;
      }
      try {
        var ps = JSON.parse(res.body).prices || [];
        var series = [];
        for (var i = 0; i < ps.length; i++) {
          var c = ps[i].closePrice;
          if (!c || c.bid == null) continue;
          var mid = c.ask != null ? (c.bid + c.ask) / 2 : c.bid;
          series.push([zeitUtc(ps[i].snapshotTimeUTC || ps[i].snapshotTime), mid, ps[i].lastTradedVolume || 0]);
        }
        // dollarVolDay: Capital-Volumen ist nicht mit Yahoo vergleichbar → unbekannt (null)
        if (series.length <= 30) {
          letzterKursFehler = 'Kursabruf ' + sym + ' (' + interval + '): nur ' + series.length +
            ' verwertbare Kerzen – zu wenig für eine Auswertung.';
          return null;
        }
        return { series: series, dollarVolDay: null, source: 'capital' };
      } catch (e) {
        letzterKursFehler = 'Kursabruf ' + sym + ' (' + interval + '): Antwort unlesbar';
        return null;
      }
    },

    /** Kerzen für einen ZEITBEREICH – fürs Archiv-Backfill: Capital reicht deutlich
     *  weiter zurück als Yahoos Intraday-Fenster. Rückgabe: [[t, mid, vol, high, low]]
     *  (aufsteigend) oder null bei Fehler; [] wenn der Bereich leer ist. */
    pricesRange: async function (sym, interval, fromMs, toMs, max) {
      var RES = { '1m': 'MINUTE', '5m': 'MINUTE_5', '15m': 'MINUTE_15', '60m': 'HOUR' };
      letzterKursFehler = ''; letzterGrundArt = '';
      var epic = await this.epicFor(sym);
      if (!epic) return null;
      function iso(ms) { return new Date(ms).toISOString().slice(0, 19); }   // UTC ohne Z – Capitals Format
      var res = await call('GET', '/prices/' + encodeURIComponent(epic) + '?resolution=' + (RES[interval] || 'MINUTE_5') +
        '&from=' + iso(fromMs) + '&to=' + iso(toMs) + '&max=' + (max || 1000));
      if (!res.ok) {
        /* Capital.com meldet einen Zeitraum OHNE Kurse als 404 'prices.not-found' -
         * nicht als leere Liste. Das ist kein Fehler, sondern eine Handelspause
         * (Feiertag, Wochenende, Halbtag). Als Fehler gezaehlt kostete es je Vorkommen
         * Sekunden Rueckzug und liess den Wert nach dreimal fallen. Belegt am 22.08.2026:
         * ZS 15m ueber Memorial Day (25.05.2026).
         * Leeres Array = 'dieser Bereich ist leer' - der Aufrufer springt dann ueber die Pause. */
        if (res.status === 404 && String(res.body || '').indexOf('prices.not-found') !== -1) return [];
        letzterGrundArt = 'http';
        letzterKursFehler = 'Kursabruf ' + sym + ' (' + interval + ', ' + iso(fromMs) + ' bis ' + iso(toMs) + '): HTTP ' + res.status +
          (res.body ? ' – ' + String(res.body).slice(0, 200) : '');
        return null;
      }
      try {
        var ps = JSON.parse(res.body).prices || [];
        var series = [];
        for (var i = 0; i < ps.length; i++) {
          var c = ps[i].closePrice;
          if (!c || c.bid == null) continue;
          function mid(p) { return p && p.bid != null ? (p.ask != null ? (p.bid + p.ask) / 2 : p.bid) : null; }
          var m = mid(c);
          var hi = mid(ps[i].highPrice), lo = mid(ps[i].lowPrice);
          series.push([zeitUtc(ps[i].snapshotTimeUTC || ps[i].snapshotTime), m, ps[i].lastTradedVolume || 0,
            hi != null ? hi : m, lo != null ? lo : m]);
        }
        series.sort(function (a, b) { return a[0] - b[0]; });
        return series;
      } catch (e) {
        // Auch dieser Ausgang muss seinen Grund nennen - sonst bleibt lastPriceError()
        // leer und der Aufrufer meldet den ALTEN Grund weiter (Falschdiagnose).
        letzterKursFehler = 'Kursabruf ' + sym + ' (' + interval + '): Antwort unlesbar – ' +
          String(res.body || '').replace(/\s+/g, ' ').slice(0, 160);
        return null;
      }
    },

    closePosition: async function (dealId) {
      if (!dealId) return { ok: false, msg: 'keine dealId' };
      var res = await call('DELETE', '/positions/' + encodeURIComponent(dealId));
      if (!res.ok) return { ok: false, msg: 'HTTP ' + res.status };
      // Auch beim Schliessen den echten Ausfuehrungskurs zurueckholen - erst beide
      // Seiten zusammen ergeben die tatsaechlichen Kosten einer Runde.
      var fill = null;
      try {
        var ref = JSON.parse(res.body).dealReference;
        if (ref) {
          var conf = await call('GET', '/confirms/' + ref);
          if (conf.ok) {
            var cj = JSON.parse(conf.body);
            if (cj.level != null) fill = cj.level;
          }
        }
      } catch (e) { /* ohne Fill-Kurs schliessen wir trotzdem */ }
      return { ok: true, msg: 'geschlossen', fill: fill, fillT: Date.now() };
    }
  };
})();
