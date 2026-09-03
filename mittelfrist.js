'use strict';
/* Oberfläche für die mittelfristige Querschnitts-Strategie.
 * Die Rechnung selbst steht in momentum.js (rein, in Node testbar) – hier wird nur
 * geholt, angezeigt und bedient. */
(function () {
  var M = window.Momentum, U = window.U;
  var DATEN = null;              // {syms, zeiten, map}
  var UNIVERSUM = (
    'AAPL MSFT AMZN GOOGL META NVDA TSLA AVGO ORCL CRM ADBE AMD INTC CSCO QCOM TXN IBM NOW INTU MU ' +
    'JPM BAC WFC GS MS C SCHW BLK AXP USB PNC COF BK SPGI CME ICE MMC AON ' +
    'JNJ UNH PFE ABBV MRK LLY TMO ABT DHR BMY AMGN GILD CVS CI ELV ISRG SYK BSX MDT ZTS ' +
    'XOM CVX COP SLB EOG PSX MPC VLO OXY WMB KMI HAL DVN HES ' +
    'PG KO PEP WMT COST MCD NKE SBUX TGT LOW HD DIS CMCSA VZ T TMUS CL KMB GIS ' +
    'CAT DE BA HON GE LMT RTX UNP UPS FDX MMM EMR ETN ITW PH CSX NSC WM ' +
    'LIN APD SHW ECL NEM FCX DOW DD PPG NEE DUK SO D AEP EXC SRE XEL ED PEG ' +
    'AMT PLD CCI EQIX SPG O PSA WELL AVB EQR ADP FI FIS GPN PAYX CTAS ROP FTV AME ' +
    'EBAY BKNG ABNB UBER DASH PYPL SHOP SNAP PINS SPOT NFLX ROKU F GM APTV BWA ' +
    'MAR HLT RCL CCL LVS WYNN MGM DAL UAL LUV ' +
    'PANW CRWD ZS OKTA NET DDOG SNOW MDB TEAM WDAY VEEV ADSK CDNS SNPS KLAC LRCX AMAT ASML TSM ARM'
  ).split(/\s+/).filter(Boolean);

  function stat(t, art) { U.statuszeile('mfStatus', t, art); }
  function opts() {
    var g = function (id) { return document.getElementById(id); };
    return {
      rueckblick: parseInt(g('mfRueck').value, 10),
      luecke: parseInt(g('mfLuecke').value, 10),
      halten: parseInt(g('mfHalten').value, 10),
      anteil: parseFloat(g('mfAnteil').value),
      kostenBp: parseInt(g('mfKosten').value, 10)
    };
  }

  /* Tageskerzen über den vollen verfügbaren Zeitraum. period1=0 statt range=max –
   * letzteres liefert bei Tageskerzen nur rund 170 Monatswerte. */
  async function holeTage(sym) {
    try {
      /* BEREINIGT: Momentum rangiert Werte ueber Monate gegeneinander. Ein
       * unbereinigter Split waere dort ein Kurssturz von 50 % - und der Wert
       * flaege aus dem staerksten Zehntel, obwohl gar nichts passiert ist. */
      var kd = await window.Kurse.hole(sym, { von: 0, bis: Date.now(), interval: '1d', bereinigt: true });
      if (!kd) return null;
      /* Zeit, Schluss UND Stueckzahl: Das Momentum-Buch filtert seinen Korb seit dem
       * 02.09.2026 nach Median-Tagesumsatz (Schluss x Stueck, liquide.js) - ohne die
       * dritte Spalte kann es die gemessene Regel nicht rechnen. Wer nur [0] und [1]
       * liest (Rangfolge, Drift, Depot), merkt von der Spalte nichts. */
      var reihe = kd.bars.map(function (b) { return [b[0], b[1], b[2]]; });
      return reihe.length > 500 ? reihe : null;
    } catch (e) { return null; }
  }

  /* ---- Tagesdaten-Speicher in Teilen ----
   * Frueher lag das komplette Archiv (38,5 MB) unter EINEM Schluessel: Jedes
   * Speichern schrieb den ganzen Klumpen neu, und ein Absturz mitten im
   * Schreiben haette das gesamte Archiv beschaedigt statt eines Teils. Jetzt:
   * Symbole alphabetisch in Teile zu je 25, dazu ein kleiner Index mit Stand
   * und Teilzahl. Der Index wird ZULETZT geschrieben - wer liest, sieht nur
   * vollstaendige Staende; fehlt ein Teil, greift der alte Schluessel. */
  var TEIL_GROESSE = 25;
  async function tagesdatenSchreiben(roh, weg, at) {
    var syms = Object.keys(roh).sort();
    var teile = Math.max(1, Math.ceil(syms.length / TEIL_GROESSE));
    for (var t = 0; t < teile; t++) {
      var stueck = {};
      syms.slice(t * TEIL_GROESSE, (t + 1) * TEIL_GROESSE).forEach(function (s) { stueck[s] = roh[s]; });
      await window.api.storeSet('mf_tagesdaten_teil_' + t, { roh: stueck });
    }
    await window.api.storeSet('mf_tagesdaten_index', { at: at || Date.now(), weg: weg || [], teile: teile });
    // Der alte Riesen-Schluessel wird zu einem kleinen Verweis - die 38 MB sind damit weg
    try { await window.api.storeSet('mf_tagesdaten', { ersetztDurch: 'mf_tagesdaten_index', at: at || Date.now() }); } catch (eM) { }
  }
  async function tagesdatenLesen() {
    var idx = await window.api.storeGet('mf_tagesdaten_index');
    if (idx && idx.teile) {
      var roh = {}, ok = true;
      for (var t = 0; t < idx.teile && ok; t++) {
        var teil = await window.api.storeGet('mf_tagesdaten_teil_' + t);
        if (!teil || !teil.roh) ok = false;
        else Object.keys(teil.roh).forEach(function (s) { roh[s] = teil.roh[s]; });
      }
      if (ok) return { at: idx.at, roh: roh, weg: idx.weg || [], quelle: 'teile' };
    }
    var g = await window.api.storeGet('mf_tagesdaten');
    return (g && g.roh) ? { at: g.at, roh: g.roh, weg: g.weg || [], quelle: 'alt' } : null;
  }

  /** Tragen die gespeicherten Reihen Stueckzahlen (dritte Spalte)? Geprueft ueber
   *  liquide.js, damit hier dieselbe Definition gilt wie im Korbfilter des Buchs. */
  function hatStueck(roh) {
    var L = window.Liquide;
    if (!L || !roh) return false;
    return Object.keys(roh).some(function (s) { return L.hatUmsatz(roh[s]); });
  }

  /** Alle Werte holen und auf eine gemeinsame Zeitachse bringen.
   *  Ohne gemeinsame Achse vergleicht man Werte zu verschiedenen Zeitpunkten. */
  async function ladeUniversum() {
    var roh = {}, fertig = 0;
    var gespeichert = await tagesdatenLesen();
    /* Gespeicherte Tagesdaten aus der Zeit vor dem Korbfilter tragen keine Stueckzahl.
     * Sie gelten nicht als frisch, sondern werden einmalig neu geladen - sonst staende
     * das Momentum-Buch mit "keine Stueckzahlen" still, bis der Bestand von allein
     * veraltet (20 Stunden), und niemand saehe, warum. */
    var frisch = gespeichert && (Date.now() - (gespeichert.at || 0) < 20 * 3600000) && hatStueck(gespeichert.roh);
    if (gespeichert && !frisch && gespeichert.roh && !hatStueck(gespeichert.roh)) {
      stat('Gespeicherte Tageskurse ohne Stückzahlen – lade neu, damit der Momentum-Korb nach Umsatz gefiltert werden kann …');
    }
    if (frisch) {
      roh = gespeichert.roh;
      stat('Gespeicherte Daten von ' + new Date(gespeichert.at).toLocaleString('de-DE') + ' verwendet.');
      // Einmalige Wanderung: Liegt der Bestand noch im alten Klumpen-Format,
      // wird er beim ersten Lesen in Teile umgeschrieben.
      if (gespeichert.quelle === 'alt') await tagesdatenSchreiben(roh, gespeichert.weg, gespeichert.at);
    } else {
      var weg = [];
      for (var i = 0; i < UNIVERSUM.length; i++) {
        var r = await holeTage(UNIVERSUM[i]);
        if (r) roh[UNIVERSUM[i]] = r; else weg.push(UNIVERSUM[i]);
        fertig++;
        if (fertig % 10 === 0) stat('Lade Tageskurse … ' + fertig + '/' + UNIVERSUM.length);
        await new Promise(function (w) { setTimeout(w, 90); });   // Quelle nicht überrennen
      }
      await tagesdatenSchreiben(roh, weg, Date.now());
      /* Ausgefallene Werte SICHTBAR machen, nicht still übergehen.
       *
       * Am 21.08.2026 lieferte Yahoo für BK, MMC, HES und FI nichts mehr – HES etwa ist
       * nach der Übernahme durch Chevron von der Börse. Bisher fielen solche Werte
       * wortlos aus der Liste, und das Universum bestand still aus lauter Überlebenden.
       * Genau diese Verzerrung frisst hier seit Monaten Messergebnisse: In der schwachen
       * Hälfte der Werte bleibt vom Ergebnis-Drift kaum etwas übrig, in der starken das
       * meiste. Wer nicht sieht, dass Werte verschwinden, hält sein Universum für
       * vollständig. */
      stat(Object.keys(roh).length + ' von ' + UNIVERSUM.length + ' Werten geladen.' +
        (weg.length ? '  Nicht mehr abrufbar: ' + weg.join(', ') +
          ' – vermutlich übernommen oder umbenannt. Das Universum besteht damit aus Überlebenden, ' +
          'was gemessene Vorsprünge nach oben verzerrt.' : ''));
    }
    var syms = Object.keys(roh);
    if (syms.length < 30) return null;
    var zaehler = {};
    syms.forEach(function (s) { roh[s].forEach(function (b) { zaehler[b[0]] = (zaehler[b[0]] || 0) + 1; }); });
    var zeiten = Object.keys(zaehler).map(Number).filter(function (t) { return zaehler[t] >= 30; }).sort(function (a, b) { return a - b; });
    var idx = {}; zeiten.forEach(function (t, i) { idx[t] = i; });
    var map = {};
    syms.forEach(function (s) {
      var a = new Array(zeiten.length).fill(null);
      roh[s].forEach(function (b) { var i = idx[b[0]]; if (i !== undefined) a[i] = b[1]; });
      map[s] = a;
    });
    return { syms: syms, zeiten: zeiten, map: map };
  }

  function zeigeRang() {
    var el = document.getElementById('mfRang');
    if (!DATEN) { el.innerHTML = '<div class="empty">Noch keine Daten.</div>'; return; }
    var o = opts();
    var i = DATEN.zeiten.length - 1;
    var aus = M.auswahl(DATEN.map, i, o);
    var rang = M.rangfolge(DATEN.map, i, o);
    if (!aus || !rang) { el.innerHTML = '<div class="empty">Zu wenige Werte für eine Rangfolge.</div>'; return; }
    var stand = new Date(DATEN.zeiten[i]).toLocaleDateString('de-DE');
    el.innerHTML = '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:8px;">Stand ' + stand +
      ' · stärkste ' + Math.round(o.anteil * 100) + ' % von ' + rang.length + ' Werten · Rückblick ' +
      o.rueckblick + ' Tage ohne die letzten ' + o.luecke + '</div>' +
      '<table class="tbl"><thead><tr><th>#</th><th>Wert</th><th style="text-align:right;">Stärke</th></tr></thead><tbody>' +
      aus.map(function (x, k) {
        return '<tr><td>' + (k + 1) + '</td><td><b>' + U.esc(x.sym) + '</b></td><td style="text-align:right;" class="' +
          U.signCls(x.staerke) + '">' + U.signTxt(x.staerke * 100, ' %') + '</td></tr>';
      }).join('') + '</tbody></table>' +
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:8px;">Die Schwächsten zum Vergleich: ' +
      rang.slice(-5).map(function (x) { return U.esc(x.sym) + ' ' + Math.round(x.staerke * 100) + ' %'; }).join(', ') + '</div>';
  }

  /* Der PRUEFZEITRAUM ist die einzige ehrliche Zahl.
   * Die Parameter (Rueckblick 231, Luecke 21, Halten 63, staerkste 10 %) wurden auf
   * 1970-2004 ausgesucht. Wer sie danach auf demselben Zeitraum misst, misst sich
   * selbst - das Ergebnis ueber die ganze Historie sieht deshalb viel besser aus, als
   * es ist. Angezeigt wird deshalb zuerst 2005-2026, wo nichts mehr angepasst wurde;
   * die Gesamthistorie steht darunter, ausdruecklich als das gekennzeichnet, was sie
   * ist. */
  var PRUEFJAHR = 2005;
  function zeigeErgebnis() {
    var el = document.getElementById('mfErgebnis');
    if (!DATEN) { el.innerHTML = '<div class="empty">Noch keine Daten.</div>'; return; }
    var o = opts();
    var jahrVon = function (i) { return new Date(DATEN.zeiten[Math.min(i, DATEN.zeiten.length - 1)]).getFullYear(); };
    var startPruef = DATEN.zeiten.findIndex(function (t) { return new Date(t).getFullYear() >= PRUEFJAHR; });
    var d = M.durchlauf(DATEN.map, Object.assign({}, o, { start: Math.max(startPruef, o.rueckblick + o.luecke + 10), jahrVon: jahrVon }));
    var dAll = M.durchlauf(DATEN.map, Object.assign({}, o, { start: o.rueckblick + o.luecke + 10, jahrVon: jahrVon }));
    if (!d) { el.innerHTML = '<div class="empty">Zu wenige Daten für einen Durchlauf.</div>'; return; }
    var vorsprung = d.proJahr - d.marktProJahr;
    var jahre = Object.keys(d.jahre).map(Number).sort(function (a, b) { return a - b; });
    var besser = 0, vk = 1, vm = 1;
    var zeilen = jahre.map(function (j) {
      var rk = (d.jahre[j].depot / vk - 1) * 100, rm = (d.jahre[j].markt / vm - 1) * 100;
      vk = d.jahre[j].depot; vm = d.jahre[j].markt;
      if (rk > rm) besser++;
      return '<tr><td>' + j + '</td><td style="text-align:right;" class="' + U.signCls(rk) + '">' + U.signTxt(rk, ' %') +
        '</td><td style="text-align:right;" class="' + U.signCls(rm) + '">' + U.signTxt(rm, ' %') + '</td></tr>';
    });
    el.innerHTML =
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:6px;">Prüfzeitraum ab ' + PRUEFJAHR +
        ' – die Parameter wurden auf den Jahren <b>davor</b> ausgesucht und hier nicht mehr angepasst.</div>' +
      '<dl class="kv">' +
      '<dt>Depot</dt><dd><b>' + d.kapital.toFixed(1) + '×</b> (' + U.signTxt(d.proJahr, ' % p. a.') + ')</dd>' +
      '<dt>Marktdurchschnitt</dt><dd>' + d.markt.toFixed(1) + '× (' + U.signTxt(d.marktProJahr, ' % p. a.') + ')</dd>' +
      '<dt>Vorsprung</dt><dd class="' + U.signCls(vorsprung) + '"><b>' + U.signTxt(vorsprung, ' Prozentpunkte im Jahr') + '</b></dd>' +
      '<dt>Größter Rückschlag</dt><dd>' + d.rueckschlag.toFixed(0) + ' %</dd>' +
      '<dt>Umschichtungen</dt><dd>' + d.schritte + ' · je ' + Math.round(d.umschlag * 100) + ' % des Depots getauscht</dd>' +
      '<dt>Bessere Jahre</dt><dd>' + besser + ' von ' + jahre.length + '</dd>' +
      '</dl>' +
      (dAll ? '<div style="font-size:var(--fs-neben); color:var(--muted); border-top:1px solid var(--grid); padding-top:8px; margin-top:4px;">' +
        'Über die <b>gesamte</b> Historie ab ' + new Date(DATEN.zeiten[0]).getFullYear() + ': ' + dAll.kapital.toFixed(0) + '× (' +
        U.signTxt(dAll.proJahr, ' % p. a.') + ') gegen ' + dAll.markt.toFixed(0) + '× (' + U.signTxt(dAll.marktProJahr, ' % p. a.') + '). ' +
        'Diese Zahl enthält den Zeitraum, auf dem die Parameter ausgesucht wurden – sie ist deshalb zu schön und taugt nicht als Beleg.</div>' : '') +
      '<div style="max-height:240px; overflow:auto; margin-top:8px;">' +
      '<table class="tbl"><thead><tr><th>Jahr</th><th style="text-align:right;">Depot</th><th style="text-align:right;">Markt</th></tr></thead><tbody>' +
      zeilen.join('') + '</tbody></table></div>';
  }

  async function rechnen() {
    var btn = document.getElementById('mfLadenBtn');
    btn.disabled = true;
    try {
      if (!DATEN) {
        stat('Lade Tageskurse …');
        DATEN = await ladeUniversum();
        if (!DATEN) { stat('Zu wenige Werte geladen – Quelle nicht erreichbar?'); return; }
      }
      stat(DATEN.syms.length + ' Werte · ' + DATEN.zeiten.length + ' Handelstage · rechne …');
      zeigeRang();
      zeigeErgebnis();
      stat(DATEN.syms.length + ' Werte · ' + DATEN.zeiten.length + ' Handelstage · ' +
        new Date(DATEN.zeiten[0]).getFullYear() + ' bis ' + new Date(DATEN.zeiten[DATEN.zeiten.length - 1]).getFullYear());
    } catch (e) {
      stat('Fehler: ' + (e && e.message ? e.message : e));
    } finally { btn.disabled = false; }
  }

  /* ---- Live = Messung (Oberflaeche Stufe 3, 03.09.2026) ----
   * Die vier Fenster-Felder waren frei waehlbar. Wer eines verstellte, rechnete eine
   * ANDERE Konfiguration als die, die das Momentum-Buch wirklich handelt - und sah das
   * Ergebnis unter derselben Ueberschrift. Die Felder bleiben im DOM (opts() liest sie
   * weiter, und die Kennungen sind Schnittstelle), sind aber gesperrt und werden hier
   * aus der Konfiguration des Buchs gefuellt: erst das, was im Buch steht
   * (D.mfBuch.konfig), sonst die gemessene Fassung aus MFHandel.buchKonfig(). Aus dem
   * Markup kommt keine dieser Zahlen.
   * AUSNAHME und bewusst so: die Kosten je Seite (#mfKosten). Sie stehen nicht in der
   * gemerkten Konfiguration, sondern als Zahl im Aufruf von MFHandel.fuehreAus in
   * mfdepot.js takt() - Handelscode, der in dieser Stufe nicht angefasst wird. Das Feld
   * behaelt deshalb seinen Markup-Wert; eine Sperrklinke in test-v6.js haelt ihn gegen
   * genau diese Zahl, damit die Anzeige nicht still von der Ausfuehrung abdriftet. */
  function konfigZeigen() {
    var k = null;
    var d = window.__D ? window.__D() : null;
    if (d && d.mfBuch && d.mfBuch.konfig) k = d.mfBuch.konfig;
    else if (window.MFHandel && window.MFHandel.buchKonfig) k = window.MFHandel.buchKonfig();
    if (!k) return;
    setzen('mfRueck', k.rueckblick);
    setzen('mfLuecke', k.luecke);
    setzen('mfHalten', k.halten);
    setzen('mfAnteil', k.anteil);
  }
  /* Ein Wert, den die Auswahlliste gar nicht kennt, wird NICHT stillschweigend
   * verschluckt: dann bekaeme das Feld den ersten Eintrag und zeigte etwas anderes,
   * als das Buch rechnet. Er wird als Eintrag ergaenzt und ausgewaehlt.
   * Verglichen wird als ZAHL, nicht als Text: das Feld schreibt "0.10", die
   * Konfiguration liefert 0.1 - als Text waeren das zwei verschiedene Werte, und die
   * Liste bekaeme einen zweiten Eintrag fuer dasselbe Zehntel. */
  function setzen(id, wert) {
    var e = document.getElementById(id);
    if (!e || wert == null) return;
    var treffer = Array.prototype.filter.call(e.options, function (o) {
      return o.value === String(wert) || (o.value !== '' && Number(o.value) === Number(wert));
    })[0];
    if (treffer) { e.value = treffer.value; return; }
    var o2 = document.createElement('option');
    o2.value = String(wert); o2.textContent = String(wert) + ' (aus der Konfiguration des Buchs)';
    e.appendChild(o2);
    e.value = o2.value;
  }

  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('mfLadenBtn');
    if (btn) btn.addEventListener('click', rechnen);
    konfigZeigen();
    ['mfRueck', 'mfLuecke', 'mfHalten', 'mfAnteil', 'mfKosten'].forEach(function (id) {
      var e = document.getElementById(id);
      // Nach dem ersten Laden reicht Neurechnen - die Kurse sind schon da
      if (e) e.addEventListener('change', function () { if (DATEN) { zeigeRang(); zeigeErgebnis(); } });
    });
  });
  /* Beim Start ist das Depot noch nicht geladen; der Buch-Stand kommt erst danach.
   * Dasselbe Ereignis, das die Bestand-Karten zeichnet, holt die Felder nach. */
  document.addEventListener('tab-changed', konfigZeigen);
  /* Oberflaeche Stufe 4b (03.09.2026): Der Block wohnt jetzt als Klappe unter
   * Werkzeuge -> Betrieb. Die Shell meldet das AUFklappen als 'sub-changed' mit dem
   * Namen aus data-klappe (Muster aus Stufe 1) - dasselbe Ereignis, das frueher der
   * Pillenwechsel schickte. Der Reiterwechsel allein traegt nicht: wer schon auf
   * Werkzeuge steht und erst danach das Depot laedt, saehe sonst die Felder von vor
   * dem Laden. Geholt wird nichts, gelesen wird nur der Buch-Zustand. */
  document.addEventListener('sub-changed', function (ev) {
    if (ev.detail && ev.detail.sub === 'mittelfrist') konfigZeigen();
  });
  if (typeof window !== 'undefined') window.__mfRechnen = rechnen;
  // Nach aussen: das Mittelfrist-Depot (mfdepot.js) stoesst hierueber den taeglichen
  // Kursabruf an, statt den Lader zu duplizieren - zwei Lader hiessen zwei Wahrheiten.
  window.MF = { ladeUniversum: ladeUniversum, tagesdatenLesen: tagesdatenLesen };
})();
