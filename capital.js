'use strict';
/* Capital.com-Demo-Anbindung – Paper-Trading mit echten Marktpreisen.
   Bewusst NUR das Demo-Konto: der Live-Host ist in der App nicht freigeschaltet. */
(function () {
  var BASE = 'https://demo-api-capital.backend-capital.com/api/v1';
  var tokens = null, tokenTime = 0, lastError = '';

  function cfg() {
    var s = window.getSettings();
    return {
      key: s.capKey || '', id: s.capId || '', pass: s.capPass || '',
      on: !!(s.capEnabled && s.capKey && s.capId && s.capPass)
    };
  }

  async function login() {
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

  async function call(method, path, body) {
    if (!cfg().on) return { ok: false, status: 0, body: 'Capital.com nicht konfiguriert' };
    if (!tokens || Date.now() - tokenTime > 8 * 60000) {
      if (!(await login())) return { ok: false, status: 401, body: 'Login fehlgeschlagen: ' + lastError };
    }
    var res = await window.api.capFetch(method, BASE + path, {
      'X-CAP-API-KEY': cfg().key, 'CST': tokens.cst, 'X-SECURITY-TOKEN': tokens.sec
    }, body);
    if (res.status === 401) { tokens = null; }
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
          series.push([new Date(ps[i].snapshotTimeUTC || ps[i].snapshotTime).getTime(), mid, ps[i].lastTradedVolume || 0]);
        }
        // dollarVolDay: Capital-Volumen ist nicht mit Yahoo vergleichbar → unbekannt (null)
        return series.length > 30 ? { series: series, dollarVolDay: null, source: 'capital' } : null;
      } catch (e) { return null; }
    },

    closePosition: async function (dealId) {
      if (!dealId) return { ok: false, msg: 'keine dealId' };
      var res = await call('DELETE', '/positions/' + encodeURIComponent(dealId));
      return { ok: res.ok, msg: res.ok ? 'geschlossen' : 'HTTP ' + res.status };
    }
  };
})();
