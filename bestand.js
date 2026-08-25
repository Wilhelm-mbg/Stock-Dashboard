'use strict';
/* BESTANDSDEPOT - die echten Papiere neben die gemessenen Regeln stellen (Felix, #71).
 *
 * "Die Übernahme des Bestandsdepots. Am elegantesten wäre, einen Exportfile aus der
 *  Depotbank zu ziehen und zu übermitteln. Alternativ können weitere WKN hinzugefügt
 *  werden. Die Übernommenen Wertpapiere sollen dann in einer eigenen Routine auf
 *  Handlungsempfehlungen auf der Basis von Signalen dargestellt werden."
 *
 * WAS HIER STEHT UND WAS NICHT. Gezeigt wird der SIGNALZUSTAND - was die beiden
 * gemessenen Kurzfrist-Regeln und die beiden Mittelfrist-Buecher zu einem Wert gerade
 * sagen. Das ist eine Beobachtung, keine Empfehlung. Die App ist eine Simulation und
 * gibt keine Anlageberatung; daran aendert auch ein echtes Depot nichts. Deshalb steht
 * hier nirgends "kaufen" oder "verkaufen", sondern "die Regel haette hier ein Signal"
 * bzw. "das Buch haelt diesen Wert".
 *
 * WKN ODER ISIN? Gemessen am 25.08.2026 an der Yahoo-Suche:
 *     ISIN US0378331005 -> AAPL      ISIN DE0007164600 -> SAP.DE
 *     ISIN US5949181045 -> MSFT      WKN  846900       -> 0 Treffer
 * Die ISIN traegt, die WKN nicht. Jeder deutsche Bankauszug enthaelt die ISIN - der
 * elegante Weg funktioniert also, nur ueber die ISIN statt ueber die WKN. Eine WKN
 * wird angenommen und mitgefuehrt, aber sie loest kein Papier auf; dann muss das
 * Kuerzel von Hand dazu.
 */
(function () {
  var BESTAND = [];          // [{sym, name, stueck, isin, wkn, seit}]
  var geladen = false;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }

  /* ---------------------------------------------------------------- Ablage */
  async function laden() {
    if (geladen) return BESTAND;
    try {
      var r = await window.api.storeGet('bestand');
      BESTAND = (r && r.werte) || [];
    } catch (e) { BESTAND = []; }
    geladen = true;
    return BESTAND;
  }
  async function sichern() {
    try { await window.api.storeSet('bestand', { stand: Date.now(), werte: BESTAND }); }
    catch (e) { /* die Anzeige darf daran nicht scheitern */ }
  }

  /* ------------------------------------------------------------- Einlesen -
   * Bankauszuege sind Tabellen in tausend Schreibweisen. Statt ein Format zu
   * erraten, wird jede Zeile fuer sich gelesen: eine ISIN traegt sich selbst,
   * die Stueckzahl ist die Zahl daneben. Was nicht eindeutig ist, wird NICHT
   * geraten, sondern zur Bestaetigung vorgelegt. */
  var ISIN = /\b([A-Z]{2}[A-Z0-9]{9}[0-9])\b/;
  var WKN = /\b([A-Z0-9]{6})\b/;

  /** Die Stueckzahl einer Zeile. Deutsche Schreibweise (1.234,5) wird verstanden.
   *  Kurse und Betraege sehen aehnlich aus - deshalb zaehlt die Zahl, die am
   *  ehesten eine STUECKZAHL ist: die kleinste ganze Zahl der Zeile, und
   *  ausdruecklich die neben "Stück"/"St." wenn es sie gibt. */
  function stueckAus(zeile) {
    var mS = /([\d.]+(?:,\d+)?)\s*(?:St(?:ü|ue)ck|St\.?|Stk\.?)\b/i.exec(zeile);
    if (mS) return zahl(mS[1]);
    var zahlen = (zeile.match(/\b\d[\d.]*(?:,\d+)?\b/g) || []).map(zahl)
      .filter(function (n) { return n > 0 && n < 1e7; });
    if (!zahlen.length) return null;
    var ganze = zahlen.filter(function (n) { return n === Math.floor(n); });
    return ganze.length ? Math.min.apply(null, ganze) : null;
  }
  function zahl(s) {
    var t = String(s).replace(/\./g, '').replace(',', '.');
    var n = parseFloat(t);
    return isFinite(n) ? n : null;
  }

  /** Aus eingefuegtem Text Zeilen machen, die sich aufloesen lassen. */
  function ausText(text) {
    var raus = [];
    String(text || '').split(/\r?\n/).forEach(function (z) {
      if (!z.trim()) return;
      var mI = ISIN.exec(z);
      var isin = mI ? mI[1] : null;
      /* Ein Kuerzel steht meist als kurzes Grosswort da. Nur nehmen, wenn keine
       * ISIN da ist - sonst gewinnt gern ein Waehrungskuerzel wie EUR. */
      var sym = null;
      if (!isin) {
        var mT = /\b([A-Z]{1,5}(?:\.[A-Z]{1,3})?)\b/.exec(z.replace(/\b(EUR|USD|CHF|GBP|STK|ISIN|WKN|NR)\b/g, ''));
        if (mT) sym = mT[1];
      }
      var mW = !isin ? WKN.exec(z) : null;
      if (!isin && !sym) return;
      raus.push({
        roh: z.trim().slice(0, 120),
        isin: isin, wkn: mW ? mW[1] : null, sym: sym,
        stueck: stueckAus(z), name: null, status: isin ? 'offen' : 'kuerzel'
      });
    });
    return raus;
  }

  /** Eine ISIN in ein Kuerzel aufloesen - ueber dieselbe Suche wie der Explorer. */
  async function aufloesen(isin) {
    var url = 'https://query1.finance.yahoo.com/v1/finance/search?q=' +
      encodeURIComponent(isin) + '&quotesCount=5&newsCount=0&listsCount=0';
    var res;
    try { res = await window.api.fetchText(url); } catch (e) { return { fehler: String(e && e.message || e) }; }
    if (!res || !res.ok) return { fehler: res && res.status ? 'Status ' + res.status : 'keine Antwort' };
    try {
      var q = (JSON.parse(res.body).quotes || []).filter(function (x) { return x.symbol; });
      if (!q.length) return { fehler: 'kein Papier zu dieser ISIN' };
      return { sym: q[0].symbol, name: q[0].longname || q[0].shortname || q[0].symbol };
    } catch (e) { return { fehler: 'Antwort unlesbar' }; }
  }

  /* ------------------------------------------------------------- Bestand -- */
  function liste() { return BESTAND.slice(); }
  async function hinzu(sym, name, stueck, isin, wkn) {
    if (!sym) return false;
    var da = BESTAND.filter(function (b) { return b.sym === sym; })[0];
    if (da) { da.stueck = stueck || da.stueck; return 'schon'; }
    BESTAND.push({ sym: sym, name: name || sym, stueck: stueck || null,
                   isin: isin || null, wkn: wkn || null, seit: Date.now() });
    await sichern();
    return true;
  }
  async function entfernen(sym) {
    BESTAND = BESTAND.filter(function (b) { return b.sym !== sym; });
    await sichern();
  }

  /* ---------------------------------------------------------- Signalstand -
   * Kurzfrist: was die gemessenen Intraday-Regeln zuletzt zu dem Wert sagten.
   * Mittelfrist: ob eines der beiden Buecher ihn gerade haelt.
   * Beides sind BEOBACHTUNGEN. Wer daraus eine Empfehlung macht, tut das selbst. */
  function standVon(sym) {
    var kurz = window.DepotAPI && window.DepotAPI.signal ? window.DepotAPI.signal(sym) : null;
    var mittel = window.DepotAPI && window.DepotAPI.mittelfrist ? window.DepotAPI.mittelfrist(sym) : null;
    return { kurz: kurz, mittel: mittel };
  }

  window.Bestand = {
    laden: laden, liste: liste, hinzu: hinzu, entfernen: entfernen,
    ausText: ausText, aufloesen: aufloesen, standVon: standVon,
    /* fuer die Tests: reine Funktionen ohne Oberflaeche */
    _stueckAus: stueckAus, _esc: esc
  };
})();
