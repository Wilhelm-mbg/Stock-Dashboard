'use strict';
/* ================= Echte WKN zu einer Modell-Zeile =================
 *
 * Der Schein-Finder rechnet ein MODELL-Raster: Basispreis, Laufzeit und Bezugs-
 * verhaeltnis frei gewaehlt, Preis aus Black-Scholes. Zum Nachkaufen beim eigenen
 * Broker fehlte genau eine Angabe - die WKN (Tickets #9, #11, #17).
 *
 * Die bisherige Begruendung ("WKN-Listen gibt es nur ueber Bezahl-APIs") stimmt
 * fuer LIVE-Emittentendaten, aber nicht fuer die Produktliste: onvista stellt
 * seinen Derivate-Finder ueber eine offene Schnittstelle bereit - ohne Schluessel,
 * ohne Anmeldung, mit WKN, ISIN, Emittent, Basispreis, Faelligkeit, BV und den
 * gestellten Kursen. Es ist dieselbe Quelle, an der am 21.08.2026 das
 * Cent-Spread-Modell geeicht wurde (quant.js, Test 16).
 *
 * WAS DIESES MODUL TUT: zu einer Modell-Zeile die naechstliegenden ECHTEN Scheine
 * holen.
 * WAS ES NICHT TUT: Gleichheit behaupten. Emittenten legen ihre Scheine auf feste
 * Verfallstage (16.10., 18.12.) und runde Basispreise auf; das Raster rechnet mit
 * freien Tagen und Prozentabstaenden. Ein echter Schein mit 54 statt 30 Tagen ist
 * ein ANDERER Schein, auch wenn seine WKN danebensteht. Deshalb liefert jede
 * Zuordnung ihren Abstand mit, die Oberflaeche zeigt ihn, und was zu weit weg
 * liegt, wird als "kein vergleichbarer Schein" gemeldet statt schoengerechnet.
 *
 * WAEHRUNG: Das Modell rechnet in Dollar auf den US-Basiswert, die Emittenten
 * stellen in Euro. Die Kurse werden NICHT umgerechnet - der Euro-Kurs steht als
 * Orientierung daneben, verglichen werden darf nur Gleiches mit Gleichem.
 *
 * SPANNE: onvista meldet die volle Spanne (Brief minus Geld, bezogen auf Brief),
 * die App rechnet je Seite. Beim Vergleich wird der Modellwert deshalb verdoppelt.
 *
 * Die Zuordnungs- und URL-Logik ist rein gehalten und in Node testbar
 * (module.exports) - genau dort sitzt der gefaehrliche Teil.
 */
(function (root) {

  var HOST = 'https://api.onvista.de';

  /* ---------------- rein und testbar ---------------- */

  /** Aus der Trefferliste der Instrumentensuche den richtigen Basiswert waehlen.
   *  STRENG mit Absicht - eine falsche WKN ist schlimmer als gar keine: Die
   *  Ticker-Suche nach "MU" liefert Muenchener Rueck (MUV2) an erster Stelle,
   *  Micron kommt darin ueberhaupt nicht vor. Deshalb zaehlt ausschliesslich ein
   *  EXAKT passendes Heimatkuerzel; ist zusaetzlich ein Name bekannt, muss auch
   *  der passen. Bleibt nichts uebrig, ist null die richtige Antwort. */
  function basiswertWaehlen(liste, symbol, name) {
    var sym = String(symbol || '').split('.')[0].toUpperCase();
    if (!sym) return null;
    var c = (liste || []).filter(function (x) {
      return x && x.entityType === 'STOCK' && x.entityValue &&
        String(x.homeSymbol || '').toUpperCase() === sym;
    });
    if (name) {
      // Erstes Wort genuegt und ist robust: "TSMC (ADR)" -> "tsmc" findet
      // "TSMC Taiwan Semiconductor", "Meta Platforms" findet den Zusatz "(ehem. Facebook)".
      var wort = String(name).split(' ')[0].toLowerCase();
      var mitName = c.filter(function (x) { return String(x.name || '').toLowerCase().indexOf(wort) >= 0; });
      if (mitName.length) c = mitName;
    }
    if (!c.length) return null;
    // Zweitnotierungen ("(CDR)") nur, wenn nichts anderes da ist - Optionsscheine
    // liegen auf der Hauptnotierung. Ein Klammerzusatz ist das einzige Merkmal,
    // an dem sich das von aussen erkennen laesst.
    c.sort(function (a, b) {
      var ka = String(a.name || '').indexOf('(') >= 0 ? 1 : 0;
      var kb = String(b.name || '').indexOf('(') >= 0 ? 1 : 0;
      return ka - kb || String(a.name || '').length - String(b.name || '').length;
    });
    return { id: String(c[0].entityValue), name: c[0].name || sym, isin: c[0].isin || null };
  }

  function suchUrl(begriff) {
    return HOST + '/api/v1/instruments/query?searchValue=' + encodeURIComponent(begriff);
  }

  function isoTag(ms) { return new Date(ms).toISOString().slice(0, 10); }

  /** Suchfenster um eine Modell-Zeile. Bewusst nicht enger: Emittenten legen nur
   *  auf feste Termine auf, ein Fenster von +-2 Tagen faende bei kurzen Laufzeiten
   *  gar nichts. Lieber breit suchen und die Abweichung hinterher ehrlich zeigen. */
  function fenster(modell, jetztMs) {
    var tage = Math.max(1, modell.restTage || 1);
    var vonTage = Math.max(1, Math.floor(tage * 0.6) - 2);
    var bisTage = Math.ceil(tage * 1.8) + 7;
    return {
      strikeVon: Math.round(modell.strike * 0.97 * 100) / 100,
      strikeBis: Math.round(modell.strike * 1.03 * 100) / 100,
      vonISO: isoTag(jetztMs + vonTage * 86400000),
      bisISO: isoTag(jetztMs + bisTage * 86400000)
    };
  }

  /** Finder-Abfrage fuer eine Modell-Zeile. Sortiert nach Faelligkeit, damit die
   *  gelieferte Seite von den kurzen Laufzeiten her gefuellt wird - nach Spanne
   *  sortiert kaemen zuerst die langlaufenden, und der passende Schein waere
   *  womoeglich gar nicht dabei. Die Feinauswahl macht ohnehin `besteScheine`. */
  function scheinUrl(id, modell, jetztMs, proSeite) {
    var f = fenster(modell, jetztMs);
    var qp = 'entitySubType=WARRANT' +
      '&idExerciseRight=' + (modell.dir === 'call' ? '2' : '1') +
      '&strikeAbsRange=' + f.strikeVon + ';' + f.strikeBis +
      '&dateMaturityRange=' + f.vonISO + ';' + f.bisISO + '&';
    return HOST + '/api/v1/derivatives/finder/configuration_query' +
      '?application=WEBSITE&device=DESKTOP' +
      '&entityTypeUnderlying=STOCK&entityValueUnderlying=' + encodeURIComponent(id) +
      '&page=0&perPage=' + (proSeite || 50) +
      '&sortColumn=dateMaturity&sortOrder=ASC' +
      '&queryParameters=' + encodeURIComponent(qp);
  }

  /** Antwort der Quelle auf die Felder eindampfen, die hier gebraucht werden.
   *  Alles, was keine WKN, keinen Basispreis oder keine Faelligkeit hat, faellt
   *  raus - damit taucht kein halber Datensatz in der Oberflaeche auf. */
  function normalisiere(json, jetztMs) {
    var liste = (json && json.list) || [];
    var aus = [];
    liste.forEach(function (it) {
      if (!it) return;
      var inst = it.instrument || {}, q = it.quote || {};
      var faellig = it.dateMaturity ? Date.parse(it.dateMaturity) : NaN;
      var strike = typeof it.strikeAbs === 'number' ? it.strikeAbs : null;
      if (!inst.wkn || !(strike > 0) || !isFinite(faellig)) return;
      var geld = typeof q.bid === 'number' ? q.bid : null;
      var brief = typeof q.ask === 'number' ? q.ask : null;
      var spanne = typeof it.spreadAskPct === 'number' ? Math.round(it.spreadAskPct * 100) / 100 : null;
      /* Die Quelle liefert die implizite Vola in PROZENT (37,9 = 37,9 %). Bei
       * Scheinen ohne laufende Kursstellung steht dort ein Platzhalter wie 1,0 -
       * eine einprozentige Vola gibt es nicht, also lieber nichts anzeigen. */
      var iv = typeof it.impliedVolatilityAsk === 'number' ? Math.round(it.impliedVolatilityAsk * 10) / 10 : null;
      if (iv != null && (iv <= 1 || iv > 500)) iv = null;
      /* Wann wurde zuletzt gestellt? Emittenten stellen nur 8-22 Uhr; am Wochenende
       * ist der juengste Kurs von Freitagabend. Ohne diese Angabe sieht ein alter
       * Kurs aus wie ein aktueller. */
      var stand = Math.max(Date.parse(q.datetimeAsk || 0) || 0, Date.parse(q.datetimeBid || 0) || 0) || null;
      aus.push({
        wkn: inst.wkn,
        isin: inst.isin || null,
        emittent: (it.issuer && it.issuer.name) || '–',
        dir: it.codeExerciseRight === 'C' ? 'call' : (it.codeExerciseRight === 'P' ? 'put' : null),
        strike: strike,
        ratio: typeof it.coverRatio === 'number' ? it.coverRatio : null,
        faellig: faellig,
        restTage: Math.round((faellig - jetztMs) / 86400000),
        hebel: typeof it.leverage === 'number' ? Math.round(it.leverage * 10) / 10 : null,
        // onvista: volle Spanne bezogen auf den Briefkurs. Die App rechnet je Seite.
        spanneGesamtPct: spanne,
        iv: iv,
        geld: geld,
        brief: brief,
        waehrung: q.isoCurrency || null,
        stand: stand,
        /* Einseitige oder absurd weite Stellungen kommen vor (Schein ausverkauft,
         * Emittent hat die Kursstellung eingestellt, Nachtzeit). Sie sind kein
         * Fehler der Quelle, aber als Preis unbrauchbar - und muessen als solche
         * gekennzeichnet werden, statt eine Spanne von 70 % zu behaupten. */
        kursFraglich: geld == null || brief == null || (spanne != null && spanne > 20),
        quanto: !!it.quanto,
        amerikanisch: it.codeExerciseStyle === 'A'
      });
    });
    return aus;
  }

  /* Ab diesem Abstand gilt ein Schein als NICHT vergleichbar. 0,45 entspricht
   * grob: 3 % danebenliegender Basispreis UND ein Drittel mehr Restlaufzeit.
   * Wer knapp darueber liegt, wird weiter angezeigt - aber als "nur aehnlich"
   * gekennzeichnet, nicht als Treffer. */
  var MAX_ABSTAND = 0.45;

  /** Abstand einer echten Zeile zur Modell-Zeile; klein ist besser, Infinity heisst
   *  "kommt nicht in Frage". Basispreis zaehlt relativ zum Basispreis, Laufzeit
   *  relativ zur Laufzeit - sonst erschlaegt ein 200-Dollar-Basispreis jede
   *  Laufzeitabweichung. Der Basispreis wiegt doppelt, weil er das Auszahlungs-
   *  profil bestimmt; ein abweichendes BV kostet einen festen Zuschlag, denn bei
   *  gleichem Hebel zahlt es ein Vielfaches der relativen Spanne (Kostenmodell in
   *  quant.js). */
  function abstand(modell, s) {
    if (!modell || !s || !s.dir || s.dir !== modell.dir) return Infinity;
    if (!(s.strike > 0) || s.restTage == null) return Infinity;
    var dStrike = Math.abs(s.strike - modell.strike) / Math.max(1e-9, modell.strike);
    var dTage = Math.abs(s.restTage - (modell.restTage || 0)) / Math.max(1, modell.restTage || 1);
    var dBV = (s.ratio != null && modell.ratio != null && Math.abs(s.ratio - modell.ratio) > 1e-9) ? 0.15 : 0;
    return dStrike * 2 + dTage + dBV;
  }

  /** Die n naechstliegenden echten Scheine, jeder mit seinem Abstand und dem
   *  Merker `passt`. Sortiert wird nach Abstand, bei Gleichstand nach der
   *  kleineren Spanne - unter zwei gleich passenden nimmt man den billigeren. */
  function besteScheine(modell, liste, n) {
    var bewertet = [];
    (liste || []).forEach(function (s) {
      var a = abstand(modell, s);
      if (!isFinite(a)) return;
      var kopie = {};
      for (var k in s) if (Object.prototype.hasOwnProperty.call(s, k)) kopie[k] = s[k];
      kopie.abstand = Math.round(a * 1000) / 1000;
      kopie.passt = a <= MAX_ABSTAND;
      bewertet.push(kopie);
    });
    bewertet.sort(function (a, b) {
      return a.abstand - b.abstand ||
        ((a.spanneGesamtPct == null ? 1e9 : a.spanneGesamtPct) - (b.spanneGesamtPct == null ? 1e9 : b.spanneGesamtPct));
    });
    return bewertet.slice(0, n || 3);
  }

  var Kern = {
    HOST: HOST, MAX_ABSTAND: MAX_ABSTAND,
    basiswertWaehlen: basiswertWaehlen, suchUrl: suchUrl, scheinUrl: scheinUrl,
    fenster: fenster, normalisiere: normalisiere, abstand: abstand, besteScheine: besteScheine
  };

  /* ---------------- ab hier Browser-Verdrahtung ---------------- */
  if (typeof module !== 'undefined' && module.exports) { module.exports = Kern; return; }

  var idCache = {};      // Symbol -> {id, name, isin} | null (auch das Nein wird gemerkt)
  var listenCache = {};  // URL -> {stand, liste}
  var CACHE_MS = 5 * 60000;   // Kurse veralten; die Produktliste selbst kaum

  async function holeJson(url) {
    var r = await root.api.fetchText(url);
    if (!r || !r.ok) throw new Error(r && r.body ? String(r.body).slice(0, 120) : 'kein Netz');
    return JSON.parse(r.body);
  }

  /** Basiswert-Kennung bei der Quelle, mit zwei Anlaeufen: erst das Kuerzel, dann
   *  der Klarname aus der Aktienliste. Der zweite Anlauf ist kein Luxus - fuer
   *  "MU" findet die Kuerzel-Suche Micron ueberhaupt nicht. */
  async function basiswertId(symbol, name) {
    var key = String(symbol || '').toUpperCase();
    if (Object.prototype.hasOwnProperty.call(idCache, key)) return idCache[key];
    var treffer = null;
    try {
      treffer = basiswertWaehlen((await holeJson(suchUrl(symbol.split('.')[0]))).list, symbol, name);
      if (!treffer && name) {
        var klar = String(name).split(' (')[0];
        treffer = basiswertWaehlen((await holeJson(suchUrl(klar))).list, symbol, name);
      }
    } catch (e) { return null; }   // kein Netz: nichts merken, beim naechsten Mal neu versuchen
    idCache[key] = treffer;
    return treffer;
  }

  /** Die echten Scheine zu einer Modell-Zeile.
   *  Rueckgabe: {ok, scheine, basiswert, grund} - `grund` steht nur bei ok:false
   *  und ist bereits als Satz fuer die Oberflaeche formuliert. */
  async function echteScheine(symbol, name, modell, anzahl) {
    if (!root.api || !root.api.fetchText) return { ok: false, grund: 'Abruf steht in dieser Umgebung nicht zur Verfügung.' };
    var bw = await basiswertId(symbol, name);
    if (!bw) return { ok: false, grund: 'Der Basiswert ' + symbol + ' ließ sich bei der Quelle nicht zweifelsfrei zuordnen – lieber keine WKN als eine falsche.' };
    var url = scheinUrl(bw.id, modell, Date.now(), 50);
    var zwischen = listenCache[url];
    var liste;
    if (zwischen && Date.now() - zwischen.stand < CACHE_MS) {
      liste = zwischen.liste;
    } else {
      try {
        liste = normalisiere(await holeJson(url), Date.now());
      } catch (e) {
        return { ok: false, basiswert: bw, grund: 'Die Produktsuche war nicht erreichbar (' + (e.message || e) + ').' };
      }
      listenCache[url] = { stand: Date.now(), liste: liste };
    }
    var beste = besteScheine(modell, liste, anzahl || 3);
    if (!beste.length) return { ok: false, basiswert: bw, grund: 'Zu dieser Kombination aus Basispreis und Laufzeit gibt es derzeit keinen aufgelegten Schein.' };
    return { ok: true, basiswert: bw, scheine: beste };
  }

  root.WKN = {
    kern: Kern,
    basiswertId: basiswertId,
    echteScheine: echteScheine
  };
})(typeof window !== 'undefined' ? window : globalThis);
