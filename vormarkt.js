'use strict';
/* Vorbörsen-Lücken (Tester-Wunsch #55): welche Werte stehen vor der US-Eröffnung
   deutlich anders als beim gestrigen Schluss?

   REINE BEOBACHTUNG, ausdrücklich keine gemessene Kante. Die Idee "Gap and Go"
   gehört zur Ausbruchsfamilie, und die ist hier bereits widerlegt: die grosse
   Signalstudie vom 23.08.2026 hat über 15 Detektoren und 4 Zeitrahmen (3.372
   Tests) keinen einzigen bestätigten Ausbruchs-Vorteil gefunden, und die
   Produkthürde beim Standard-Schein (0,23 Pp je 3 h) frisst ohnehin mehr, als
   solche Effekte roh hergeben. Diese Liste zeigt also nur, was los ist -
   gehandelt wird hiervon nichts. Keine Anlageberatung.

   Reine Funktionen - läuft im Renderer (window.Vormarkt) und in Node (Tests). */
(function (root) {

  /* Die Schwellen sind die aus dem Ticket, unverändert übernommen. */
  var MIN_LUECKE = 5;        // Prozent gegen den letzten regulären Schluss
  var MIN_KURS = 3;          // Dollar - darunter sind Spread und Spielgeld ein Thema
  var MIN_VOL = 50000;       // Stück vorbörslich - siehe MIN_KERZEN, greift nur wenn Yahoo liefert
  var MIN_KERZEN = 12;       // Ersatzmass für Liquidität: eine Stunde Vorbörse mit Handel
  var MAX_LISTE = 10;        // so viele Zeilen zeigt die Karte
  var MAX_CHART = 40;        // so viele Einzelabrufe kostet ein Durchlauf höchstens

  /* Warum MIN_KERZEN statt der Volumen-Schwelle aus dem Ticket:
   * Yahoo liefert im vorbörslichen Fenster KEIN Volumen. Am 23.08.2026 an fünf
   * Werten nachgesehen (TSLA, NVDA, AAPL, HOOD, SLS): 43 bis 66 Vorbörsen-Kerzen
   * mit Kurs, Volumen jedes Mal exakt 0, während dieselben Werte in der Sitzung
   * 14 bis 82 Millionen Stück drehten. Eine Schwelle "über 50.000 Stück" würde
   * also IMMER alles wegwerfen - die Karte wäre dauerhaft leer und sähe aus, als
   * gäbe es nie eine Lücke. Was sich stattdessen wirklich messen lässt: in wie
   * vielen der 5-Minuten-Kerzen überhaupt ein Kurs zustande kam. Ein Wert, der
   * vorbörslich einmal druckt, hat wenige Kerzen; ein Wert, der durchgehandelt
   * wird, hat sie fast alle. Die Volumen-Schwelle bleibt trotzdem stehen - sie
   * greift, sobald Yahoo dort echte Stückzahlen liefert. */

  /* ---- Kandidaten aus einem Yahoo-Screener ---------------------------------
   * Der Screener (day_gainers / small_cap_gainers / most_actives) ist derselbe
   * Topf, aus dem auch die Gewinner-Seite von Yahoo gespeist wird - nur als
   * JSON, über den Host, den die App ohnehin schon benutzt. Kein Scraping,
   * kein zusätzlicher Anbieter, keine Anmeldung.
   *
   * Ausserhalb der Vorbörse stehen in der Antwort keine preMarket-Felder; dann
   * bleibt vorPct null und die Vorauswahl fällt auf den regulären Tag zurück. */
  function kandidatenAus(text) {
    var j;
    try { j = JSON.parse(text); } catch (e) { return []; }
    var res = j && j.finance && j.finance.result && j.finance.result[0];
    var q = (res && res.quotes) || [];
    var aus = [];
    for (var i = 0; i < q.length; i++) {
      var z = q[i];
      if (!z || typeof z.symbol !== 'string') continue;
      if (z.quoteType && z.quoteType !== 'EQUITY') continue;
      aus.push({
        sym: z.symbol.toUpperCase().slice(0, 12),
        name: typeof z.shortName === 'string' ? z.shortName.slice(0, 40) : '',
        kurs: isFinite(z.regularMarketPrice) ? z.regularMarketPrice : null,
        vorPct: isFinite(z.preMarketChangePercent) ? z.preMarketChangePercent : null,
        regPct: isFinite(z.regularMarketChangePercent) ? z.regularMarketChangePercent : null
      });
    }
    return aus;
  }

  /* ---- Vorauswahl -----------------------------------------------------------
   * Ein Durchlauf soll den Rechner nicht mit hundert Chart-Abrufen belasten und
   * Yahoo nicht in die Bremse (429) laufen lassen. Deshalb erst grob sieben:
   *   - Liefert Yahoo vorbörsliche Prozente, wird danach gesiebt. Die Schwelle
   *     liegt bewusst 1 Punkt unter der endgültigen, weil der Screener-Wert und
   *     die Kerzenrechnung minutenweit auseinanderliegen können.
   *   - Fehlen die Felder, bleibt nur die Ordnung des Vortags als Reihenfolge.
   * Doppelte Kürzel fallen raus, der Rest wird gekappt.
   *
   * Kandidaten mit immer=true überspringen die Siebung. Das sind die Werte des
   * Dashboards: die Screener von Yahoo sortieren nach dem REGULÄREN Vortag, ein
   * Wert, der gestern still lag und heute Nacht auf Zahlen springt, steht dort
   * also nicht drin. Für die eigenen 15 Werte wird deshalb immer nachgesehen. */
  function vorauswahl(kandidaten, maxN) {
    if (!isFinite(maxN) || maxN <= 0) maxN = MAX_CHART;
    var gesehen = {}, pflicht = [], rest = [];
    // Erst die Pflicht-Werte einsammeln. Andersherum würde ein eigener Wert, der
    // zufällig auch in einer Yahoo-Liste steht, als Doppelter verschluckt und
    // danach von der Vorauswahl weggesiebt - genau der Fall, den immer=true
    // verhindern soll.
    var durchgang, i, k;
    for (durchgang = 0; durchgang < 2; durchgang++) {
      for (i = 0; i < kandidaten.length; i++) {
        k = kandidaten[i];
        if (!k || !k.sym || gesehen[k.sym]) continue;
        if (durchgang === 0 ? !k.immer : !!k.immer) continue;
        gesehen[k.sym] = true;
        (k.immer ? pflicht : rest).push(k);
      }
    }
    var mitVor = rest.filter(function (k) { return k.vorPct !== null && k.vorPct !== undefined; });
    var liste;
    if (mitVor.length) {
      liste = mitVor.filter(function (k) { return k.vorPct > MIN_LUECKE - 1; });
      liste.sort(function (a, b) { return b.vorPct - a.vorPct; });
    } else {
      liste = rest.slice();
      liste.sort(function (a, b) { return (b.regPct || 0) - (a.regPct || 0); });
    }
    return pflicht.concat(liste).slice(0, maxN);
  }

  /* ---- Lücke und Vorbörsen-Volumen aus einem 5-Minuten-Chart ----------------
   * Gezählt werden ausschliesslich Kerzen im vorbörslichen Fenster, das Yahoo
   * selbst in meta.currentTradingPeriod.pre ausweist. Ohne diese Grenze würden
   * bei range=1d auch Kerzen des Vortages mitgezählt - die stehen ebenfalls vor
   * dem heutigen regulären Start. Fehlt das Fenster, wird es aus dem regulären
   * Start zurückgerechnet (Vorbörse ab 4:00 ET, also 5,5 Stunden davor).
   *
   * Verglichen wird gegen chartPreviousClose, den letzten regulären Schluss -
   * nicht gegen einen Quote-Stempel. Yahoos Quote-Stempel hatten hier schon
   * einmal die Messbasis verseucht; seit 8.23.13 kommen Kurse aus Kerzen. */
  function vormarktAusChart(text) {
    var r;
    try { r = JSON.parse(text).chart.result[0]; } catch (e) { return null; }
    if (!r || !r.meta || !r.timestamp) return null;
    var meta = r.meta;
    var ts = r.timestamp || [];
    var quote = (r.indicators && r.indicators.quote && r.indicators.quote[0]) || {};
    var closes = quote.close || [];
    var vols = quote.volume || [];
    var per = meta.currentTradingPeriod || {};
    var regStart = per.regular && isFinite(per.regular.start) ? per.regular.start : null;
    if (regStart === null) return null;
    var vonZeit = (per.pre && isFinite(per.pre.start)) ? per.pre.start : regStart - 19800;
    var bisZeit = (per.pre && isFinite(per.pre.end)) ? per.pre.end : regStart;
    var basis = isFinite(meta.chartPreviousClose) ? meta.chartPreviousClose
      : (isFinite(meta.previousClose) ? meta.previousClose : null);
    if (!basis || basis <= 0) return null;
    var kurs = null, vol = 0, kerzen = 0;
    for (var i = 0; i < ts.length; i++) {
      if (ts[i] < vonZeit || ts[i] >= bisZeit) continue;
      if (closes[i] !== null && closes[i] !== undefined && isFinite(closes[i])) { kurs = closes[i]; kerzen++; }
      if (isFinite(vols[i])) vol += vols[i];
    }
    if (kurs === null || !kerzen) return null;
    return { kurs: kurs, basis: basis, luecke: (kurs / basis - 1) * 100, vol: vol, kerzen: kerzen };
  }

  /* ---- Die Siebung aus dem Ticket ------------------------------------------
   * Lücke über 5 %, Kurs über 3 $, vorbörslich wirklich gehandelt (siehe
   * MIN_KERZEN), absteigend nach Lücke, höchstens zehn Zeilen. */
  function sieben(zeilen, max) {
    if (!isFinite(max) || max <= 0) max = MAX_LISTE;
    var aus = (zeilen || []).filter(function (z) {
      if (!z || !isFinite(z.luecke) || !isFinite(z.kurs) || !isFinite(z.kerzen)) return false;
      if (z.luecke <= MIN_LUECKE || z.kurs <= MIN_KURS) return false;
      if (z.kerzen < MIN_KERZEN) return false;
      // Volumen nur prüfen, wenn Yahoo überhaupt welches liefert
      return !(isFinite(z.vol) && z.vol > 0 && z.vol <= MIN_VOL);
    });
    aus.sort(function (a, b) { return b.luecke - a.luecke; });
    return aus.slice(0, max);
  }

  var Vormarkt = {
    MIN_LUECKE: MIN_LUECKE, MIN_KURS: MIN_KURS, MIN_VOL: MIN_VOL, MIN_KERZEN: MIN_KERZEN,
    MAX_LISTE: MAX_LISTE, MAX_CHART: MAX_CHART,
    kandidatenAus: kandidatenAus, vorauswahl: vorauswahl,
    vormarktAusChart: vormarktAusChart, sieben: sieben
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = Vormarkt;
  else root.Vormarkt = Vormarkt;
})(typeof window !== 'undefined' ? window : globalThis);
