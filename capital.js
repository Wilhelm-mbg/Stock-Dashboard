'use strict';
/* Capital.com-Demo-Anbindung – Paper-Trading mit echten Marktpreisen.
   Bewusst NUR das Demo-Konto: der Live-Host ist in der App nicht freigeschaltet. */
(function () {
  var BASE = 'https://demo-api-capital.backend-capital.com/api/v1';
  var tokens = null, tokenTime = 0, lastError = '';

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

    /** Markt (Epic) zum Symbol finden – mit Cache */
    epicFor: async function (sym) {
      var cache = (await window.api.storeGet('cap_epics')) || {};
      if (cache[sym]) return cache[sym];
      var res = await call('GET', '/markets?searchTerm=' + encodeURIComponent(sym));
      if (!res.ok) return null;
      try {
        var mkts = JSON.parse(res.body).markets || [];
        // exakte Epic-Übereinstimmung bevorzugen, sonst erster Aktien-Treffer
        var hit = mkts.filter(function (m) { return m.epic === sym; })[0] || mkts.filter(function (m) { return (m.instrumentType || '').indexOf('SHARES') !== -1; })[0] || mkts[0];
        if (hit) { cache[sym] = hit.epic; await window.api.storeSet('cap_epics', cache); return hit.epic; }
      } catch (e) { /* ignorieren */ }
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
        // Bestätigung abholen → dealId
        var conf = await call('GET', '/confirms/' + ref);
        if (conf.ok) {
          var cj = JSON.parse(conf.body);
          if (cj.dealStatus === 'ACCEPTED') {
            var dealId = (cj.affectedDeals && cj.affectedDeals[0] && cj.affectedDeals[0].dealId) || cj.dealId;
            return { ok: true, dealId: dealId, epic: epic };
          }
          return { ok: false, msg: cj.rejectReason || cj.dealStatus };
        }
        return { ok: true, dealId: null, epic: epic, msg: 'ohne Bestätigung' };
      } catch (e) { return { ok: false, msg: 'Antwort unlesbar' }; }
    },

    /** Kursdaten (Kerzen) von der Demo-API – als Reserve, wenn Yahoo ausfällt.
     *  Rückgabe: {series: [[t, mid, vol]], dollarVolDay: null} oder null. */
    // (siehe zeitUtc oben: Capital liefert "2026-08-19T09:00:00" OHNE Zeitzonen-Kennung)
    prices: async function (sym, interval, max) {
      var RES = { '1m': 'MINUTE', '5m': 'MINUTE_5', '15m': 'MINUTE_15', '60m': 'HOUR' };
      var epic = await this.epicFor(sym);
      if (!epic) return null;
      var res = await call('GET', '/prices/' + encodeURIComponent(epic) + '?resolution=' + (RES[interval] || 'MINUTE_5') + '&max=' + (max || 500));
      if (!res.ok) return null;
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
        return series.length > 30 ? { series: series, dollarVolDay: null, source: 'capital' } : null;
      } catch (e) { return null; }
    },

    /** Kerzen für einen ZEITBEREICH – fürs Archiv-Backfill: Capital reicht deutlich
     *  weiter zurück als Yahoos Intraday-Fenster. Rückgabe: [[t, mid, vol, high, low]]
     *  (aufsteigend) oder null bei Fehler; [] wenn der Bereich leer ist. */
    pricesRange: async function (sym, interval, fromMs, toMs, max) {
      var RES = { '1m': 'MINUTE', '5m': 'MINUTE_5', '15m': 'MINUTE_15', '60m': 'HOUR' };
      var epic = await this.epicFor(sym);
      if (!epic) return null;
      function iso(ms) { return new Date(ms).toISOString().slice(0, 19); }   // UTC ohne Z – Capitals Format
      var res = await call('GET', '/prices/' + encodeURIComponent(epic) + '?resolution=' + (RES[interval] || 'MINUTE_5') +
        '&from=' + iso(fromMs) + '&to=' + iso(toMs) + '&max=' + (max || 1000));
      if (!res.ok) return null;
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
      } catch (e) { return null; }
    },

    closePosition: async function (dealId) {
      if (!dealId) return { ok: false, msg: 'keine dealId' };
      var res = await call('DELETE', '/positions/' + encodeURIComponent(dealId));
      return { ok: res.ok, msg: res.ok ? 'geschlossen' : 'HTTP ' + res.status };
    }
  };
})();
