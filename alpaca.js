'use strict';
/* Alpaca-PAPER-Anbindung - echte US-Aktien mit Papiergeld, das zweite Kosten-Gefaess
 * neben dem Capital.com-Demo (CFD). Wilhelms Entscheid 02.09.2026 (wiki/entscheide.md).
 *
 * Zweck: die Aktien-Kostenannahme 0,06 Pp je Umlauf durch eine Messung ersetzen. Das
 * Paper-Konto fuellt am NBBO - gemessen wird also die SPANNE, die unbekannte Groesse.
 * Bekannte Grenzen: kein Marktimpact, keine Warteschlange, und ~10 % der Orders werden
 * absichtlich zufaellig nur teilweise gefuellt (Simulationsartefakt, keine Marktinformation).
 *
 * Bewusst NUR der Paper-Endpunkt. Der Hauptprozess (main.js/alpFetch) laesst keinen
 * anderen Host durch; ein Live-Handel ist aus dieser App heraus nicht moeglich.
 *
 * Gleicher Vertrag wie capital.js: enabled(), status(), quote(sym) -> {bid, ask, mid,
 * spreadPct}, openPosition(sym, 'call', stueck) -> {ok, dealId, fill}, closePosition(id)
 * -> {ok, fill}. Dazu die Auktionsorders (cls/opg) fuer die Uebernacht-Runde.
 *
 * SCHLUESSEL: kommen ausschliesslich aus window.getSettings() (alpKey, alpSecret,
 * alpEnabled), nur Text zaehlt (Sentinel-Falle wie bei capital.js). Sie werden in
 * KEINE Meldung, kein Protokoll und keine Adresse geschrieben - jeder Text, der dieses
 * Modul verlaesst, geht durch ohneGeheimnis(). test-v6.js haelt das fest. */
(function () {
  var HANDEL = 'https://paper-api.alpaca.markets/v2';
  var DATEN = 'https://data.alpaca.markets/v2';
  var FEED = 'iex';                       // der Gratis-Feed; SIP kostet und braucht ein Abo
  var lastError = '', letzterKursFehler = '', letzterGrundArt = '';
  /* Offene Positionen dieses Laufs: dealId (= Order-Kennung) -> {sym, stueck}. Nur fuer
   * closePosition(dealId) nach openPosition() in derselben Sitzung; die Uebernacht-Runde
   * merkt sich Symbol und Stueckzahl selbst (kosten.js), weil dazwischen ein Neustart
   * liegen kann. */
  var offene = {};

  function cfg() {
    function txt(v) { return typeof v === 'string' ? v : ''; }
    var s = window.getSettings();
    /* Nur Text zaehlt. Ein Sentinel-Objekt aus dem Einstellungsdialog ({__keep:true})
     * ist wahrheitswertig und liesse die Verbindung als eingerichtet gelten. */
    return {
      key: txt(s.alpKey), secret: txt(s.alpSecret),
      on: !!(s.alpEnabled && txt(s.alpKey) && txt(s.alpSecret))
    };
  }

  /** Jeder Text, der dieses Modul verlaesst, laeuft hier durch: sollte ein Server-Rumpf
   *  oder eine Fehlermeldung eine Kennung zurueckspiegeln, kommt sie nicht bis in eine
   *  Statuszeile, ein Protokoll oder eine Fehlermeldung. */
  function ohneGeheimnis(text) {
    var t = String(text == null ? '' : text);
    var c = cfg();
    if (c.key && c.key.length >= 4) t = t.split(c.key).join('[Schlüssel]');
    if (c.secret && c.secret.length >= 4) t = t.split(c.secret).join('[Geheimnis]');
    return t;
  }
  function kurz(body, n) { return ohneGeheimnis(String(body || '').replace(/\s+/g, ' ').slice(0, n || 160)); }
  function fehlerText(res) {
    var msg = '';
    try { msg = JSON.parse(res.body).message || ''; } catch (e) { msg = ''; }
    return 'HTTP ' + res.status + (msg ? ' – ' + kurz(msg, 200) : (res.body ? ' – ' + kurz(res.body, 120) : ''));
  }
  function pause(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
  function zahl(v) { var n = Number(v); return isFinite(n) ? n : null; }

  async function call(method, url, body) {
    var c = cfg();
    if (!c.on) return { ok: false, status: 0, body: 'Alpaca-Paper nicht konfiguriert' };
    var res = await window.api.alpFetch(method, url, {
      'APCA-API-KEY-ID': c.key, 'APCA-API-SECRET-KEY': c.secret
    }, body);
    if (!res) res = { ok: false, status: 0, body: 'keine Antwort' };
    if (!res.ok) lastError = fehlerText(res);
    return res;
  }
  function handel(method, pfad, body) { return call(method, HANDEL + pfad, body); }

  /** Eine Order bis zum Ende begleiten: filled, oder ein Endzustand, oder Zeitlimit.
   *  Alpaca fuellt im Paper ~10 % der Orders absichtlich nur teilweise - der Rest wird
   *  dann storniert und die Runde vom Aufrufer VERWORFEN (keine Marktinformation). */
  async function orderWarten(id, timeoutMs) {
    var start = Date.now(), letzte = null;
    while (Date.now() - start < timeoutMs) {
      var r = await handel('GET', '/orders/' + encodeURIComponent(id));
      if (r.ok) { try { letzte = JSON.parse(r.body); } catch (e) { /* naechster Versuch */ } }
      if (letzte && letzte.status === 'filled') return { status: 'filled', order: letzte };
      if (letzte && /^(canceled|expired|rejected|replaced|stopped|suspended)$/.test(letzte.status)) {
        return { status: letzte.status, order: letzte };
      }
      await pause(1000);
    }
    return { status: 'timeout', order: letzte };
  }
  async function orderLesen(id) {
    var r = await handel('GET', '/orders/' + encodeURIComponent(id));
    if (!r.ok) return null;
    try { return JSON.parse(r.body); } catch (e) { return null; }
  }
  async function stornieren(id) {
    var r = await handel('DELETE', '/orders/' + encodeURIComponent(id));
    /* 204 = storniert; 422 = schon in einem Endzustand (dann ist nichts mehr offen). */
    if (!(r.ok || r.status === 422)) return false;
    await pause(800);
    return true;
  }
  /** Position eines Wertes vollstaendig zum Markt schliessen (DELETE /positions/{sym}):
   *  der Weg nach einer Teilfuellung, damit nichts auf dem Konto liegen bleibt. */
  async function glattstellen(sym) {
    var r = await handel('DELETE', '/positions/' + encodeURIComponent(sym));
    if (r.status === 404) return { ok: true, leer: true, fill: null, stueck: 0 };
    if (!r.ok) return { ok: false, msg: 'Glattstellen ' + sym + ': ' + fehlerText(r) };
    var o = null;
    try { o = JSON.parse(r.body); } catch (e) { o = null; }
    if (!(o && o.id)) return { ok: true, fill: null, stueck: null, msg: 'ohne Order-Kennung' };
    var w = await orderWarten(o.id, 20000);
    var ord = w.order || o;
    return { ok: w.status === 'filled', status: w.status,
      fill: zahl(ord.filled_avg_price), stueck: zahl(ord.filled_qty), fillT: Date.now(),
      msg: w.status === 'filled' ? 'glattgestellt' : 'Glattstellen ' + sym + ' endete als ' + w.status };
  }

  /** Marktorder absetzen und auf die Fuellung warten (Zeitlimit 20 s). Ergebnis:
   *  {ok, dealId, fill, stueck, fillT} oder {ok:false, msg, teilfuellung, gefuellt, glatt}.
   *  Bei Teilfuellung oder Zeitlimit: Rest stornieren und - sofern etwas gefuellt wurde -
   *  die Position sofort glattstellen. Die Runde ist dann verworfen. */
  async function marktOrder(sym, side, stueck, glattBeiTeil) {
    var body = { symbol: sym, qty: String(stueck), side: side, type: 'market', time_in_force: 'day' };
    var res = await handel('POST', '/orders', body);
    if (!res.ok) return { ok: false, msg: fehlerText(res) };
    var o = null;
    try { o = JSON.parse(res.body); } catch (e) { return { ok: false, msg: 'Antwort unlesbar' }; }
    if (!(o && o.id)) return { ok: false, msg: 'Antwort ohne Order-Kennung' };
    var w = await orderWarten(o.id, 20000);
    if (w.status === 'filled') {
      var ord = w.order;
      return { ok: true, dealId: ord.id, fill: zahl(ord.filled_avg_price), stueck: zahl(ord.filled_qty), fillT: Date.now() };
    }
    /* Nicht (ganz) gefuellt: Rest weg, dann nachsehen, was tatsaechlich haengt. */
    await stornieren(o.id);
    var nach = (await orderLesen(o.id)) || w.order || o;
    var gefuellt = zahl(nach.filled_qty) || 0;
    var teil = gefuellt > 0;
    var out = { ok: false, teilfuellung: teil, gefuellt: gefuellt, status: nach.status || w.status,
      msg: teil ? 'Teilfüllung (' + gefuellt + ' von ' + stueck + ')' : 'Order nicht gefüllt (' + (nach.status || w.status) + ')' };
    if (teil && glattBeiTeil) out.glatt = await glattstellen(sym);
    return out;
  }

  window.AlpAPI = {
    enabled: function () { return cfg().on; },
    lastError: function () { return lastError; },
    lastPriceError: function () { return letzterKursFehler; },
    lastErrorKind: function () { return letzterGrundArt; },
    ohneGeheimnis: ohneGeheimnis,

    /** Verbindungstest + Kontostand. Die Kontonummer wird nicht ausgegeben. */
    status: async function () {
      var res = await handel('GET', '/account');
      if (!res.ok) return { ok: false, msg: 'Nicht verbunden (' + (lastError || 'HTTP ' + res.status) + ')' };
      try {
        var a = JSON.parse(res.body);
        var uhr = null;
        try { var c = await handel('GET', '/clock'); if (c.ok) uhr = JSON.parse(c.body); } catch (e) { uhr = null; }
        return { ok: true,
          msg: 'Alpaca-Paper verbunden · Status ' + kurz(a.status, 20) + ' · Guthaben ' +
            (zahl(a.equity) != null ? Math.round(zahl(a.equity)) : '?') + ' ' + kurz(a.currency || 'USD', 5) +
            (uhr ? (uhr.is_open ? ' · Börse offen' : ' · Börse zu') : ''),
          equity: zahl(a.equity), status: a.status, boerseOffen: uhr ? !!uhr.is_open : null };
      } catch (e) { return { ok: false, msg: 'Antwort unlesbar' }; }
    },

    /** Roher GET fuer die Diagnose - Rumpf durch ohneGeheimnis(). */
    roh: async function (pfad) {
      var r = await handel('GET', pfad);
      return { ok: r.ok, status: r.status, body: ohneGeheimnis(r.body) };
    },

    /** Letzte Geld-/Briefkurse (NBBO des Gratis-Feeds) - fuer die Spannen-Messung.
     *  Rueckgabe: {bid, ask, mid, spreadPct, t} oder null. */
    quote: async function (sym) {
      letzterKursFehler = ''; letzterGrundArt = '';
      var res = await call('GET', DATEN + '/stocks/' + encodeURIComponent(sym) + '/quotes/latest?feed=' + FEED);
      if (!res.ok) {
        letzterGrundArt = res.status === 404 ? 'kein-markt' : 'http';
        letzterKursFehler = 'Spanne ' + sym + ': ' + fehlerText(res);
        return null;
      }
      try {
        var q = (JSON.parse(res.body) || {}).quote || {};
        var bid = zahl(q.bp), ask = zahl(q.ap);
        if (!(bid > 0) || !(ask > 0) || ask < bid) {
          letzterGrundArt = 'kein-markt';
          letzterKursFehler = 'Spanne ' + sym + ': keine brauchbaren Geld-/Briefkurse im ' + FEED + '-Feed ' +
            '(Markt geschlossen oder Wert dort nicht notiert).';
          return null;
        }
        var mid = (bid + ask) / 2;
        return { bid: bid, ask: ask, mid: mid, spreadPct: mid > 0 ? (ask - bid) / mid : null,
          t: q.t ? new Date(q.t).getTime() : null };
      } catch (e) {
        letzterGrundArt = 'unlesbar';
        letzterKursFehler = 'Spanne ' + sym + ': Antwort unlesbar';
        return null;
      }
    },

    /** Kauf zum Markt (Paper). stueck ganzzahlig; dir bleibt des Vertrags wegen dabei,
     *  Leerverkaeufe setzt diese App nicht ab. */
    openPosition: async function (sym, dir, stueck) {
      if (dir !== 'call') return { ok: false, msg: 'Nur Kauf (call) wird abgesetzt' };
      var n = Math.max(1, Math.floor(Number(stueck) || 0));
      var r = await marktOrder(sym, 'buy', n, true);
      if (r.ok) offene[r.dealId] = { sym: sym, stueck: r.stueck || n };
      return r;
    },

    /** Gegenorder zum Markt. dealId aus openPosition() dieser Sitzung - oder opts
     *  {sym, stueck}, wenn die Position aus einer frueheren Sitzung stammt. */
    closePosition: async function (dealId, opts) {
      var p = (dealId && offene[dealId]) || (opts && opts.sym ? { sym: opts.sym, stueck: opts.stueck } : null);
      if (!p || !(p.stueck > 0)) return { ok: false, msg: 'keine offene Position zu dieser Kennung' };
      var r = await marktOrder(p.sym, 'sell', Math.floor(p.stueck), true);
      if (r.ok || (r.glatt && r.glatt.ok)) delete offene[dealId];
      if (r.ok) r.msg = 'geschlossen';
      return r;
    },

    /** Auktionsorder (Schlussauktion 'cls' / Eroeffnungsauktion 'opg') absetzen, OHNE
     *  auf die Fuellung zu warten - die kommt erst mit der Auktion. Rueckgabe
     *  {ok, orderId, status} oder {ok:false, msg, tifAbgelehnt}. */
    auktionsOrder: async function (sym, side, stueck, tif) {
      var body = { symbol: sym, qty: String(Math.max(1, Math.floor(Number(stueck) || 0))),
        side: side === 'sell' ? 'sell' : 'buy', type: 'market', time_in_force: tif === 'opg' ? 'opg' : 'cls' };
      var res = await handel('POST', '/orders', body);
      if (!res.ok) {
        var text = fehlerText(res);
        /* Lehnt der Endpunkt die Auktions-Gueltigkeit ab, sagt der Aufrufer es weiter
         * und faellt auf eine Marktorder kurz vor Schluss bzw. nach Eroeffnung zurueck. */
        var tifAb = res.status === 422 && /time_in_force|tif|opg|cls|auction/i.test(text);
        return { ok: false, msg: text, tifAbgelehnt: tifAb };
      }
      try {
        var o = JSON.parse(res.body);
        if (!(o && o.id)) return { ok: false, msg: 'Antwort ohne Order-Kennung' };
        return { ok: true, orderId: o.id, status: o.status };
      } catch (e) { return { ok: false, msg: 'Antwort unlesbar' }; }
    },

    /** Stand einer Order: {ok, status, gefuellt, fill, endgueltig}. */
    orderStand: async function (id) {
      var o = await orderLesen(id);
      if (!o) return { ok: false, msg: lastError || 'Order nicht lesbar' };
      return { ok: true, status: o.status, gefuellt: zahl(o.filled_qty) || 0, fill: zahl(o.filled_avg_price),
        fillT: o.filled_at ? new Date(o.filled_at).getTime() : null,
        endgueltig: /^(filled|canceled|expired|rejected|replaced|stopped|suspended)$/.test(String(o.status)) };
    },
    stornieren: stornieren,
    glattstellen: glattstellen,

    /** Liegt eine Position im Wert? {ok, stueck, einstand} - stueck 0, wenn keine. */
    position: async function (sym) {
      var r = await handel('GET', '/positions/' + encodeURIComponent(sym));
      if (r.status === 404) return { ok: true, stueck: 0 };
      if (!r.ok) return { ok: false, msg: fehlerText(r) };
      try { var p = JSON.parse(r.body); return { ok: true, stueck: zahl(p.qty) || 0, einstand: zahl(p.avg_entry_price) }; }
      catch (e) { return { ok: false, msg: 'Antwort unlesbar' }; }
    },

    /** Boersenuhr des Brokers: {ok, offen, naechsteOeffnung, naechsterSchluss}. */
    clock: async function () {
      var r = await handel('GET', '/clock');
      if (!r.ok) return { ok: false, msg: fehlerText(r) };
      try {
        var c = JSON.parse(r.body);
        return { ok: true, offen: !!c.is_open, naechsteOeffnung: c.next_open ? new Date(c.next_open).getTime() : null,
          naechsterSchluss: c.next_close ? new Date(c.next_close).getTime() : null };
      } catch (e) { return { ok: false, msg: 'Antwort unlesbar' }; }
    }
  };
})();
