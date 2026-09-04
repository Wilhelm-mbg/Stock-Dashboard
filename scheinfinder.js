'use strict';
/* ================= Schein-Finder =================
 *
 * Filtert das Raster möglicher Optionsscheine zu einem Basiswert nach den üblichen
 * Kennzahlen und nach Risikostufe. Die Rechnung steht in quant.js (rein, getestet);
 * die Auswahllisten und die Voreinstellungen stehen in scheinwahl.js (rein,
 * getestet); hier wird nur geladen, gefiltert und angezeigt.
 *
 * WAS DAS IST UND WAS NICHT: Gerechnet wird ein MODELL-Raster mit exakt dem Modell,
 * mit dem auch das Depot handelt (Black-Scholes plus das an echten Emittentenkursen
 * geeichte Cent-Spread-Modell). Ein Schein aus dem Finder verhält sich in der
 * Simulation genauso wie im Handel – das ist der Sinn: aussuchen, was man versteht,
 * und genau das handelt die App dann auch.
 * NEU (Tickets #9/#11/#17): Zu jeder Zeile lässt sich der ECHTE aufgelegte Schein
 * nachschlagen – WKN, ISIN, Emittent, gestellte Kurse, über wkn.js. Die Preise
 * bleiben Modellpreise; die echten Angaben stehen daneben, nicht an ihrer Stelle.
 *
 * BEDIENUNG (Oberflaeche Stufe 7, 04.09.2026): Zwei Karten statt einer Wand aus
 * neun freien Zahlenfeldern. Karte 1 holt das Raster, Karte 2 waehlt daraus aus -
 * und zwar OHNE neu zu laden: das Raster liegt im Speicher, jede Aenderung an einer
 * Liste filtert sofort. Der Knopf "Laden & rechnen" ist der einzige Netzweg.
 */
(function () {
  var Q = window.Quant, U = window.U, W = window.ScheinWahl;
  var RASTER = null;        // aktuelles Raster
  var BASIS = null;         // {sym, spot, iv, stand}
  var sortUmgekehrt = false; // zweiter Klick auf denselben Spaltenkopf dreht die Reihenfolge
  /* Name des Basiswerts bei der Produktsuche ("APPLE") - er steckt in der Kennung
     (Tester-Wunsch #54). Bis er da ist, steht das Kuerzel drin. */
  var BW_NAME = null;
  /* Nachgeschlagene echte Scheine je Raster-Zeile (Tickets #9/#11/#17).
     Abgerufen wird erst auf Klick: Eine Suche je Zeile ist eine Anfrage, und
     niemand braucht die WKN zu 120 Zeilen, sondern zu der einen, die er nimmt. */
  var WKN_TREFFER = {};     // Raster-Index -> {status:'laedt'|'ok'|'leer', scheine, grund}
  /* Die gemerkten Einstellungen. Startwert ist "ausgewogen" - nicht weil das die
     sicherste Wahl waere, sondern weil es die bisherige Markup-Vorgabe fortschreibt
     (Stufe 3, Spanne 1 %, Totalverlust 50 %). */
  var WAHL = W.voreinstellung('ausgewogen');
  var ZULETZT = [];         // zuletzt im Finder geladene Basiswerte, juengster zuerst
  var STORE = 'scheinfinderEinstellungen';
  var GELESEN = false;      // erst nach dem Lesen darf geschrieben werden

  function el(id) { return document.getElementById(id); }
  function stat(t, art) { U.statuszeile('sfStatus', t, art); }

  function symbole() {
    /* Die Werte, die die App kennt. Reihenfolge ist Absicht: zuerst, was man
       zuletzt angesehen hat, dann die eigenen Papiere, dann das Universum. */
    var s = [];
    function dazu(y) { if (y && s.indexOf(y) === -1) s.push(y); }
    ZULETZT.forEach(dazu);
    try {
      var D = window.__D ? window.__D() : null;
      (D && D.watchlist || []).forEach(function (w) { dazu(w.y); });
    } catch (e) { }
    (window.Dash && window.Dash.STOCKS ? window.Dash.STOCKS : []).forEach(function (x) { dazu(x.y); });
    /* Die Marktkarte kennt die groessten Werte - dieselbe Grundmenge, die auch der
       Markt-Ueberblick benutzt, statt einer zweiten eigenen Liste. */
    try {
      var MW = window.Marktwerte;
      if (MW && typeof MW.auswahl === 'function') (MW.auswahl() || []).forEach(function (m) { dazu(m && (m.y || m.sym)); });
    } catch (e2) { }
    return s;
  }

  /* ================= Einstellungen merken =================
     Ein Schluessel, ein Objekt. Gelesen wird einmal beim Start, geschrieben nach
     jeder Aenderung - und NIE, bevor gelesen wurde: sonst ueberschriebe der
     Startzustand die gemerkte Wahl, bevor sie ankommt. */
  async function wahlLesen() {
    try {
      var g = window.api && window.api.storeGet ? await window.api.storeGet(STORE) : null;
      if (g && typeof g === 'object') {
        Object.keys(WAHL).forEach(function (k) { if (g[k] !== undefined) WAHL[k] = g[k]; });
        if (Array.isArray(g.zuletzt)) ZULETZT = g.zuletzt.slice(0, 8);
      }
    } catch (e) { /* ohne Store bleibt die Voreinstellung stehen */ }
    GELESEN = true;
  }
  function wahlSchreiben() {
    if (!GELESEN) return;
    try {
      var aus = {};
      Object.keys(WAHL).forEach(function (k) { aus[k] = WAHL[k]; });
      aus.zuletzt = ZULETZT.slice(0, 8);
      if (window.api && window.api.storeSet) window.api.storeSet(STORE, aus);
    } catch (e) { /* Merken ist Beiwerk, nicht die Aufgabe */ }
  }

  async function lade() {
    var sym = (el('sfSymbol') || {}).value;
    sym = sym ? String(sym).trim().toUpperCase() : '';
    if (!sym) { stat('Bitte oben einen Basiswert wählen.'); return; }
    stat('Lade ' + sym + ' …');
    try {
      // Roher Kurs: der Schein wird auf den TATSAECHLICH gehandelten Kurs geschrieben,
      // nicht auf einen split-bereinigten. Vola-Schaetzung und Raster haengen daran.
      var kd = await window.Kurse.hole(sym, { range: '1y', interval: '1d', bereinigt: false });
      if (!kd) { stat('Keine Kursdaten bekommen – bitte Internetverbindung prüfen und noch einmal auf „Laden & rechnen“ klicken.'); return; }
      var closes = kd.bars.map(function (bb) { return bb[1]; });
      if (closes.length < 60) { stat('Zu wenig Historie für eine Volatilitätsschätzung.'); return; }
      var spot = closes[closes.length - 1];
      // Dieselbe Vola-Schätzung wie im Handel: historische Vola × 1,1 als Näherung
      // der impliziten. Wer sie ändern will, nutzt das Feld daneben.
      var geschaetzt = Math.min(1.5, Math.max(0.15, Q.histVol(closes, 60) * 1.1));
      var iv = geschaetzt;
      var ivEl = el('sfIv');
      var selbst = ivEl && ivEl.value && parseFloat(ivEl.value) > 0;
      if (selbst) iv = Math.min(1.5, Math.max(0.05, parseFloat(ivEl.value) / 100));
      if (ivEl) ivEl.placeholder = Math.round(geschaetzt * 100);
      BASIS = { sym: sym, spot: spot, iv: iv, stand: Date.now() };
      RASTER = Q.scheinRaster(spot, iv, Date.now());
      WKN_TREFFER = {};   // neues Raster: alte Zuordnungen gelten nicht mehr
      BW_NAME = String(sym).split('.')[0].toUpperCase();
      /* Zuletzt geladen: der Finder fuehrt die Liste selbst. Die App merkt sich
         sonst nirgends, welche Werte jemand angesehen hat. */
      ZULETZT = [sym].concat(ZULETZT.filter(function (z) { return z !== sym; })).slice(0, 8);
      symbolListeFuellen();
      wahlSchreiben();
      volaZeigen(geschaetzt, selbst);
      stat(sym + ': Kurs ' + U.nf2.format(spot) + ' $, Vola ' + Math.round(iv * 100) + ' % → ' +
        RASTER.length + ' Scheine im Raster (Modell – echte WKN je Zeile nachschlagbar).');
      zeige();
      /* Den Namen holen, unter dem der Basiswert bei der Produktsuche steht - er
         steht in jeder Kennung (Tester-Wunsch #54). Die Abfrage ist gemerkt, also
         faellt sie je Symbol genau einmal an; ohne Netz bleibt das Kuerzel stehen.
         Erst NACH dem Zeichnen, damit die Tabelle nicht auf sie warten muss. */
      try {
        var bw = window.WKN ? await window.WKN.basiswertId(sym, nameZu(sym)) : null;
        if (bw && bw.name && BASIS && BASIS.sym === sym) { BW_NAME = String(bw.name).toUpperCase(); zeige(); }
      } catch (eB) { }
    } catch (e) { stat('Fehler: ' + (e.message || e)); }
  }

  /** Die Vola steht als Zahl da, nicht nur als Platzhalter im Eingabefeld - sonst
   *  sieht man erst nach dem Hineinklicken, womit gerechnet wurde. */
  function volaZeigen(geschaetzt, selbst) {
    var v = el('sfVola');
    if (!v) return;
    if (!BASIS) { v.textContent = ''; return; }
    v.textContent = selbst
      ? 'Vola ' + Math.round(BASIS.iv * 100) + ' % (selbst gesetzt, geschätzt wären ' + Math.round(geschaetzt * 100) + ' %)'
      : 'Vola ' + Math.round(geschaetzt * 100) + ' % (geschätzt aus einem Jahr Kursen)';
  }

  /* Kennung der MODELL-Zeile - in der Syntax der Produktsuche (Tester-Wunsch #54):
     "CALL/APPLE/294/0.1/18.09.26" ist ein Call auf Apple, Basispreis 294, BV 0,1,
     Laufzeitende 18.09.26. Genau so heissen die Scheine bei der Quelle, also laesst
     sich die Kennung dort suchen; die frueher gezeigte Hausform ("C294-27T*0,1")
     war kuerzer und nirgends sonst zu gebrauchen.
     EHRLICH BLEIBT: Das Datum ist das Laufzeitende der GERECHNETEN Zeile, nicht der
     Termin eines aufgelegten Scheins - Emittenten legen nur auf feste Tage auf.
     Welcher echte Schein am naechsten liegt, sagt die WKN-Spalte daneben. */
  function kennung(k) {
    var name = BW_NAME || (BASIS ? String(BASIS.sym).split('.')[0] : '?');
    if (window.WKN && window.WKN.kern && window.WKN.kern.onvistaKennung) {
      return window.WKN.kern.onvistaKennung({
        dir: k.dir, basiswert: name, strike: k.strike, ratio: k.ratio,
        faellig: (BASIS ? BASIS.stand : Date.now()) + k.restTage * 86400000
      });
    }
    // Notform, falls wkn.js fehlt - lieber eine schlichte Kennung als gar keine
    return (k.dir === 'call' ? 'CALL' : 'PUT') + '/' + name.toUpperCase() + '/' + k.strike +
      '/' + k.ratio + '/' + k.restTage + 'T';
  }

  /* ================= Echte WKN (Tickets #9/#11/#17) =================
     Klarname zum Kürzel: Die Kürzel-Suche der Quelle findet nicht jeden Wert
     ("MU" liefert Münchener Rück, nicht Micron), der Klarname schließt die Lücke. */
  function nameZu(sym) {
    var l = (window.Dash && window.Dash.STOCKS) || [];
    for (var i = 0; i < l.length; i++) if (l[i].y === sym) return l[i].name || null;
    try {
      var D = window.__D ? window.__D() : null;
      var w = (D && D.watchlist || []).filter(function (x) { return x.y === sym; })[0];
      if (w && w.name) return w.name;
    } catch (e) { }
    return null;
  }

  /** Zellinhalt der WKN-Spalte für eine Raster-Zeile. */
  function wknZelle(i) {
    var tf = WKN_TREFFER[i];
    if (!tf) return '<span style="color:var(--acc);">⌕ suchen</span>';
    if (tf.status === 'laedt') return '<span style="color:var(--muted);">sucht …</span>';
    if (tf.status === 'ok') {
      var s = tf.scheine[0];
      return '<b>' + U.esc(s.wkn) + '</b>' +
        (s.passt ? '' : ' <span style="color:var(--warn);" title="nur ähnlich – siehe Zeile aufklappen">≈</span>');
    }
    return '<span style="color:var(--muted);">–</span>';
  }

  /** Nachschlagen und beide Anzeigen (Zelle, aufgeklappte Zeile) nachziehen. */
  async function wknHolen(i) {
    var k = RASTER && RASTER[i];
    if (!k || !BASIS || !window.WKN) return;
    if (WKN_TREFFER[i] && WKN_TREFFER[i].status === 'laedt') return;
    WKN_TREFFER[i] = { status: 'laedt' };
    wknMalen(i);
    var erg = await window.WKN.echteScheine(BASIS.sym, nameZu(BASIS.sym),
      { dir: k.dir, strike: k.strike, restTage: k.restTage, ratio: k.ratio }, 3);
    WKN_TREFFER[i] = (erg && erg.ok)
      ? { status: 'ok', scheine: erg.scheine, basiswert: erg.basiswert }
      : { status: 'leer', grund: (erg && erg.grund) || 'Grund unbekannt' };
    wknMalen(i);
  }

  /** Nur die betroffenen Stellen neu zeichnen – ein volles zeige() würde die
      aufgeklappte Zeile zuklappen, während man sie liest. */
  function wknMalen(i) {
    var t = el('sfTabelle');
    if (!t) return;
    var td = t.querySelector('[data-sfwkn="' + i + '"]');
    if (td) td.innerHTML = wknZelle(i);
    var block = t.querySelector('[data-sfecht="' + i + '"]');
    if (block) block.innerHTML = echteBlock(i);
    wknVerkabeln(t);   // die eben erzeugten WKN-Zeilen brauchen ihre Klicks
  }

  /** Wie weit liegt der echte Schein von der Modell-Zeile weg – im Klartext. */
  function abweichungText(k, s) {
    var teile = [];
    if (Math.abs(s.strike - k.strike) > 0.005) teile.push('Basis ' + U.nf2.format(s.strike) + ' statt ' + U.nf2.format(k.strike));
    if (s.restTage !== k.restTage) teile.push(s.restTage + ' statt ' + k.restTage + ' Tage');
    if (s.ratio != null && Math.abs(s.ratio - k.ratio) > 1e-9) teile.push('BV ' + String(s.ratio).replace('.', ',') + ' statt ' + String(k.ratio).replace('.', ','));
    return teile.length ? teile.join(' · ') : 'genau diese Merkmale';
  }

  /** Inhalt des Kastens „Echte Scheine dazu“ in der aufgeklappten Zeile. */
  function echteBlock(i) {
    var k = RASTER && RASTER[i], tf = WKN_TREFFER[i];
    if (!k) return '';
    if (!tf) return '<span style="color:var(--acc); cursor:pointer;" data-sfsuche="' + i + '">⌕ echte Scheine mit WKN suchen</span>';
    if (tf.status === 'laedt') return '<span style="color:var(--muted);">sucht bei der Produktsuche …</span>';
    if (tf.status !== 'ok') {
      return '<span style="color:var(--muted);">Keine WKN: ' + U.esc(tf.grund) + '</span>';
    }
    var zeilen = tf.scheine.map(function (s) {
      var kurs = s.kursFraglich
        ? '<span style="color:var(--warn);" title="Einseitige oder sehr weite Stellung – als Preis nicht brauchbar">keine Stellung</span>'
        : U.nf2.format(s.geld) + ' / ' + U.nf2.format(s.brief) + ' ' + (s.waehrung || '');
      var stand = s.stand
        ? new Date(s.stand).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
        : '–';
      return '<tr' + (s.passt ? '' : ' style="opacity:.72;"') + '>' +
        '<td class="sf-wknkopie" style="cursor:copy; white-space:nowrap;" title="Klick kopiert die WKN"><b>' + U.esc(s.wkn) + '</b></td>' +
        '<td style="white-space:nowrap;">' + U.esc(s.emittent) + '</td>' +
        '<td style="text-align:right;">' + U.nf2.format(s.strike) + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' + new Date(s.faellig).toLocaleDateString('de-DE') +
        ' <span style="color:var(--muted);">(' + s.restTage + ' T)</span></td>' +
        '<td style="text-align:right;">' + (s.ratio != null ? String(s.ratio).replace('.', ',') : '–') + '</td>' +
        '<td style="text-align:right; white-space:nowrap;">' + kurs + '</td>' +
        '<td style="text-align:right; white-space:nowrap; color:var(--muted);">' + stand + '</td>' +
        '<td style="text-align:right;">' + (!s.kursFraglich && s.spanneGesamtPct != null ? s.spanneGesamtPct.toFixed(2) + ' %' : '–') + '</td>' +
        '<td style="text-align:right;">' + (s.iv != null ? s.iv.toFixed(1) + ' %' : '–') + '</td>' +
        '<td style="color:var(--muted);">' + U.esc(abweichungText(k, s)) + (s.passt ? '' : ' <b style="color:var(--warn);">(nur ähnlich)</b>') + '</td>' +
        '<td style="color:var(--muted); white-space:nowrap;">' + U.esc(s.isin || '') + '</td>' +
        '<td class="sf-wknkopie" style="color:var(--muted); white-space:nowrap; cursor:copy;" title="So heißt der Schein bei der Quelle – Klick kopiert den Namen">' + U.esc(s.name || '–') + '</td></tr>';
    }).join('');
    return '<b>Echte Scheine dazu</b> <span style="color:var(--muted); font-size:var(--fs-neben);">– Klick auf die WKN oder den onvista-Namen kopiert den Eintrag</span>' +
      '<div style="overflow-x:auto; margin-top:4px;"><table class="tbl" style="font-size:var(--fs-neben);">' +
      '<tr><th>WKN</th><th>Emittent</th><th style="text-align:right;">Basis</th><th style="text-align:right;">fällig</th>' +
      '<th style="text-align:right;">BV</th><th style="text-align:right;">Geld/Brief</th><th style="text-align:right;">Stand</th>' +
      '<th style="text-align:right;">Spanne</th><th style="text-align:right;">impl. Vola</th><th>Abweichung</th><th>ISIN</th><th>onvista-Name</th></tr>' +
      zeilen + '</table></div>' +
      '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:6px; line-height:1.5;">' +
      'Emittentenkurse in Euro, das Modell rechnet in Dollar auf den Basiswert – <b>nicht ineinander umgerechnet</b>, ' +
      'die Euro-Kurse stehen als Orientierung da. „Spanne“ ist hier die volle Geld-Brief-Spanne; die Modellspalte nennt sie je Seite ' +
      '(diese Zeile: 2 × ' + k.spreadPct.toFixed(2) + ' % = ' + (2 * k.spreadPct).toFixed(2) + ' % je Umlauf). ' +
      'Die implizite Vola der echten Scheine ist der Marktpreis der Schwankung – das Modell rechnet hier mit ' +
      (BASIS ? Math.round(BASIS.iv * 100) : '?') + ' %; weicht das stark ab, ist die Modellzeile zu billig oder zu teuer gerechnet. ' +
      '„Stand“ ist die letzte Kursstellung des Emittenten (gestellt wird nur 8–22 Uhr an Handelstagen). ' +
      'Quelle: offene Produktsuche von onvista, ohne Gewähr. Verbindlich sind Basisprospekt und Basisinformationsblatt des Emittenten. ' +
      'Simulation – die App kauft nichts.</div>';
  }

  /* ================= Die Wahl aus den Listen lesen =================
     filterWerte() heisst weiter so und liefert weiter dieselben Felder wie frueher -
     nur kommen sie jetzt aus Auswahllisten statt aus neun freien Zahlenfeldern. Die
     Umrechnung Bereich -> Felder steht in scheinwahl.js und ist dort gemessen. */
  function wahlLesenAusDOM() {
    var g = function (id) { var e = el(id); return e ? e.value : undefined; };
    var neu = {
      typ: g('sfTyp'), stufeMax: g('sfStufe'), hebel: g('sfHebel'), laufzeit: g('sfLaufzeit'),
      spanne: g('sfSpanne'), tv: g('sfTv'), band: g('sfBand'), sort: g('sfSort'),
      hebelVon: g('sfHebelVon'), hebelBis: g('sfHebelBis'),
      lzVon: g('sfLzVon'), lzBis: g('sfLzBis'),
      alleSpalten: !!(el('sfAlleSpalten') && el('sfAlleSpalten').checked)
    };
    Object.keys(neu).forEach(function (k) { if (neu[k] !== undefined) WAHL[k] = neu[k]; });
    return WAHL;
  }
  function filterWerte() { return W.felder(WAHL); }

  /* ================= Die Listen bauen =================
     Jede Vorgabe kommt aus scheinwahl.js. Im Markup steht keine einzige dieser
     Zahlen - sonst stuenden sie doppelt, hier und in der Voreinstellungs-Tabelle. */
  function listeBauen(id, tabelle, titel, tip) {
    var opt = tabelle.map(function (o) {
      return '<option value="' + U.esc(o.wert) + '">' + U.esc(o.text) + '</option>';
    }).join('');
    return '<label' + (tip ? ' title="' + U.esc(tip) + '"' : '') + '>' + U.esc(titel) +
      '<select id="' + id + '">' + opt + '</select></label>';
  }

  function listenAufbauen() {
    var box = el('sfListen');
    if (!box) return;
    box.innerHTML =
      listeBauen('sfTyp', W.TYP, 'Typ', 'Call gewinnt bei steigendem, Put bei fallendem Basiswert.') +
      listeBauen('sfStufe', W.STUFE, 'Risikostufe',
        'Die Stufe rechnet quant.js aus Hebel, Totalverlust-Wahrscheinlichkeit, Restlaufzeit und Spanne. Warum eine Zeile ihre Stufe hat, steht in der aufgeklappten Zeile.') +
      listeBauen('sfHebel', W.HEBEL, 'Hebel',
        'Effektiver Hebel (Omega): um wie viel Prozent sich der Schein bewegt, wenn der Basiswert sich um ein Prozent bewegt.') +
      '<span id="sfHebelEigen" hidden><label>von<input id="sfHebelVon" type="number" style="width:60px;"></label>' +
      '<label>bis<input id="sfHebelBis" type="number" style="width:60px;"></label></span>' +
      listeBauen('sfLaufzeit', W.LAUFZEIT, 'Laufzeit',
        'Restlaufzeit der Modell-Zeile. Unter 14 Tagen vergibt das Modell eine Risikostufe Aufschlag – deshalb beginnt der kürzeste Bereich dort.') +
      '<span id="sfLzEigen" hidden><label>von<input id="sfLzVon" type="number" style="width:60px;"> Tagen</label>' +
      '<label>bis<input id="sfLzBis" type="number" style="width:60px;"></label></span>' +
      listeBauen('sfSpanne', W.SPANNE, 'Spanne',
        'Geld-Brief-Spanne je Seite, aus dem an echten Emittentenkursen geeichten Cent-Modell. Je Umlauf zahlt man sie zweimal.') +
      listeBauen('sfTv', W.TOTALVERLUST, 'Totalverlust',
        'Modell-Wahrscheinlichkeit, dass der Schein wertlos verfällt.') +
      listeBauen('sfBand', W.BAND, 'Basispreis',
        'Filtert das Raster auf Basispreise in einem Band um den aktuellen Kurs des Basiswerts („ums Geld“).') +
      listeBauen('sfSort', W.SORT, 'Sortierung', 'Bestimmt die Reihenfolge der Tabelle. Die Spaltenköpfe sortieren ebenfalls.') +
      '<label title="Vorgabe sind sieben Spalten. Die übrigen acht erklären, warum eine Zeile ihre Stufe hat – sie stehen auch in der aufgeklappten Zeile.">' +
      '<input id="sfAlleSpalten" type="checkbox"> alle Kennzahlen</label>' +
      '<span id="sfTreffer" class="sf-treffer"></span>';
    inDieListen();
    /* Jede Aenderung filtert SOFORT. Kein Neuladen: das Raster liegt im Speicher,
       und der Netzweg ist allein der Knopf in Karte 1. */
    ['sfTyp', 'sfStufe', 'sfHebel', 'sfLaufzeit', 'sfSpanne', 'sfTv', 'sfBand',
     'sfHebelVon', 'sfHebelBis', 'sfLzVon', 'sfLzBis', 'sfAlleSpalten'].forEach(function (id) {
      var e = el(id);
      if (!e) return;
      e.addEventListener('change', function () { wahlLesenAusDOM(); eigeneFelder(); wahlSchreiben(); zeige(); });
      if (e.tagName === 'INPUT' && e.type === 'number') {
        e.addEventListener('input', function () { wahlLesenAusDOM(); wahlSchreiben(); zeige(); });
      }
    });
    // Wahl im Auswahlfeld setzt die umgekehrte Reihenfolge zurueck - das Feld
    // benennt eine Richtung ("kleinste Spanne"), also soll genau die gelten.
    var so = el('sfSort');
    if (so) so.addEventListener('change', function () { sortUmgekehrt = false; wahlLesenAusDOM(); wahlSchreiben(); zeige(); });
  }

  /** Die gemerkte Wahl in die Listen schreiben. */
  function inDieListen() {
    var s = function (id, v) { var e = el(id); if (e && v !== undefined && v !== null) e.value = v; };
    s('sfTyp', WAHL.typ); s('sfStufe', WAHL.stufeMax); s('sfHebel', WAHL.hebel);
    s('sfLaufzeit', WAHL.laufzeit); s('sfSpanne', WAHL.spanne); s('sfTv', WAHL.tv);
    s('sfBand', WAHL.band); s('sfSort', WAHL.sort);
    s('sfHebelVon', WAHL.hebelVon); s('sfHebelBis', WAHL.hebelBis);
    s('sfLzVon', WAHL.lzVon); s('sfLzBis', WAHL.lzBis);
    var a = el('sfAlleSpalten'); if (a) a.checked = !!WAHL.alleSpalten;
    eigeneFelder();
  }

  /** Die zwei Zahlenfelder erscheinen nur bei „eigener Bereich“. */
  function eigeneFelder() {
    var h = el('sfHebelEigen'), l = el('sfLzEigen');
    if (h) h.hidden = WAHL.hebel !== 'eigen';
    if (l) l.hidden = WAHL.laufzeit !== 'eigen';
  }

  /** Die drei Knöpfe setzen ALLE Listen auf einmal. */
  function voreinstellungSetzen(name) {
    var v = W.voreinstellung(name);
    if (!v) return;
    /* Die Spaltenwahl gehoert dem Nutzer, nicht der Voreinstellung: wer "alle
       Kennzahlen" angehakt hat, will das auch nach einem Knopfdruck sehen. */
    var spalten = WAHL.alleSpalten;
    WAHL = v;
    WAHL.alleSpalten = spalten;
    sortUmgekehrt = false;
    inDieListen();
    wahlSchreiben();
    zeige();
  }

  /* ================= Die Tabelle ================= */
  var STUFENTEXT = ['', 'defensiv', 'vorsichtig', 'mittel', 'offensiv', 'spekulativ'];

  /** Der Inhalt einer Zelle - je Spaltenschluessel genau eine Stelle. */
  function zelle(k, schl, idx) {
    if (schl === 'wkn') {
      return '<td class="sf-wkn" data-sfwkn="' + idx + '" style="white-space:nowrap; font-size:var(--fs-klein); cursor:pointer;" ' +
        'title="Echte WKN nachschlagen. Erster Klick sucht den passenden aufgelegten Schein, danach kopiert ein Klick die WKN.">' + wknZelle(idx) + '</td>';
    }
    if (schl === 'kennung') {
      return '<td class="sf-kennung" style="white-space:nowrap; color:var(--muted); font-size:var(--fs-klein); cursor:copy;" title="Kennung in der Syntax der Produktsuche – Klick kopiert sie">' + kennung(k) + '</td>';
    }
    if (schl === 'stufe') {
      return '<td><span class="sf-stufe sf-stufe' + k.stufe + '" title="Risikostufe ' + k.stufe + ' – ' +
        STUFENTEXT[k.stufe] + '">' + k.stufe + '</span></td>';
    }
    if (schl === 'typ') return '<td>' + (k.dir === 'call' ? '▲ Call' : '▼ Put') + '</td>';
    if (schl === 'strike') return '<td style="text-align:right;">' + U.nf2.format(k.strike) + '</td>';
    if (schl === 'otm') return '<td style="text-align:right;">' + (k.otmPct >= 0 ? '+' : '') + k.otmPct.toFixed(1) + ' %</td>';
    if (schl === 'tage') return '<td style="text-align:right;">' + k.restTage + '</td>';
    if (schl === 'bv') return '<td style="text-align:right;">' + String(k.ratio).replace('.', ',') + '</td>';
    if (schl === 'brief') return '<td style="text-align:right;">' + U.nf2.format(k.brief) + '</td>';
    if (schl === 'omega') return '<td style="text-align:right;">' + k.omega.toFixed(1) + '×</td>';
    if (schl === 'spread') return '<td style="text-align:right;">' + k.spreadPct.toFixed(2) + ' %</td>';
    if (schl === 'theta') return '<td style="text-align:right;">' + k.thetaWoche.toFixed(1) + ' %</td>';
    if (schl === 'aufgeld') return '<td style="text-align:right;">' + k.aufgeldPa.toFixed(0) + ' %</td>';
    if (schl === 'tv') return '<td style="text-align:right;">' + k.totalverlustP.toFixed(0) + ' %</td>';
    if (schl === 'huerde') return '<td style="text-align:right;">' + (k.spanneHuerdePct != null ? k.spanneHuerdePct.toFixed(2) + ' %' : '–') + '</td>';
    return '<td>–</td>';
  }

  var SPALTENTIP = {
    wkn: 'Echter aufgelegter Schein zu dieser Modell-Zeile. Klick sucht ihn bei der offenen Produktsuche von onvista, ein weiterer Klick kopiert die WKN. „≈“ heißt: nur ähnlich – die Abweichung steht in der aufgeklappten Zeile.',
    kennung: 'Kennung in der Syntax der Produktsuche: Typ/Basiswert/Basispreis/Bezugsverhältnis/Fälligkeit – genau so heißen die Scheine bei onvista, so lässt sie sich dort suchen. Klick kopiert sie. Das Datum ist das Laufzeitende der GERECHNETEN Zeile; aufgelegt wird nur auf feste Termine – den echten Schein nennt die WKN-Spalte daneben.',
    stufe: 'Risikostufe 1 (defensiv) bis 5 (spekulativ)',
    otm: 'Abstand zum Basispreis. Positiv = aus dem Geld.',
    tage: 'Restlaufzeit in Tagen',
    bv: 'Bezugsverhältnis – der Kostenhebel: BV 1,0 zahlt relativ die kleinste Spanne',
    brief: 'Kaufkurs (Brief) laut Modell',
    omega: 'Effektiver Hebel (Omega). Klick sortiert, zweiter Klick dreht die Richtung.',
    spread: 'Geld-Brief-Spanne je Seite, aus dem an echten Kursen geeichten Cent-Modell',
    theta: 'Zeitwertverlust in einer Woche bei unverändertem Kurs',
    aufgeld: 'Aufgeld aufs Jahr gerechnet',
    tv: 'Modell-Wahrscheinlichkeit, dass der Schein wertlos verfällt',
    huerde: 'Wie weit der Basiswert laufen muss, um allein die Spanne zu bezahlen'
  };
  var SORTNAME = { stufe: 'Risikostufe (defensiv zuerst)', huerde: 'kleinste Spannen-Hürde (ohne Zeitwert)', spread: 'kleinste Spanne', theta: 'wenigster Zeitwertverlust', tv: 'kleinste Totalverlust-Gefahr', omega: 'größter Hebel', omegaAuf: 'kleinster Hebel' };

  function zeige() {
    var t = el('sfTabelle');
    if (!t || !RASTER) return;
    var f = filterWerte();
    var s = f.sort;
    var liste = RASTER.filter(function (k) { return W.passt(k, f, BASIS ? BASIS.spot : 0); });
    liste.sort(W.vergleich(s));
    // Zweiter Klick auf denselben Kopf: Reihenfolge umdrehen (Tester-Wunsch #13) -
    // wer die teuersten Spannen oder die groesste Totalverlust-Gefahr sehen will,
    // soll dafuer nicht durch die ganze Liste scrollen muessen.
    if (sortUmgekehrt) liste.reverse();
    trefferZeigen(liste.length);
    if (!liste.length) {
      t.innerHTML = '<div class="empty" style="padding:14px 4px;">Kein Schein erfüllt alle Filter gleichzeitig. ' +
        'Am häufigsten ist „Spanne“ oder „Totalverlust“ die strengste Hürde – Scheine nah am Geld mit kleinem ' +
        'Bezugsverhältnis sind billig, und der feste Cent-Spread wiegt dort relativ schwer. Einen Filter lockern hilft.</div>';
      return;
    }
    var spalten = W.spalten(!!WAHL.alleSpalten);
    var zeilen = liste.slice(0, 120).map(function (k) {
      var idx = RASTER.indexOf(k);
      return '<tr data-sfi="' + idx + '" style="cursor:pointer;">' +
        spalten.map(function (c) { return zelle(k, c.schl, idx); }).join('') + '</tr>';
    }).join('');
    /* Spaltenkoepfe sind zugleich die Sortierung (Tester-Wunsch #4): Die aktive
       Spalte traegt einen Pfeil, ein Klick sortiert nach ihr. Beim Hebel wechselt
       ein zweiter Klick die Richtung (groesster/kleinster) - bei allen anderen
       Kennzahlen gibt es genau eine sinnvolle Richtung ("am wenigsten Risiko/
       Kosten zuerst"), also kein Umschalten, das nur verwirren wuerde. */
    var koepfe = spalten.map(function (c) {
      var aktiv = c.sort && (c.sort === s || (c.wechsel && (s === 'omega' || s === 'omegaAuf')));
      var stil = (c.r ? 'text-align:right;' : '') + (c.sort ? 'cursor:pointer; white-space:nowrap;' : '') + (aktiv ? 'color:var(--acc);' : '');
      var pf = c.pfeil;
      if (c.wechsel) pf = (s === 'omegaAuf' ? '↑' : '↓');
      if (aktiv && sortUmgekehrt && !c.wechsel) pf = (pf === '↑' ? '↓' : '↑');
      var tip = SPALTENTIP[c.schl];
      return '<th' + (stil ? ' style="' + stil + '"' : '') +
        (tip ? ' title="' + U.esc(tip + (c.sort && !c.wechsel ? ' Klick sortiert, zweiter Klick dreht die Reihenfolge.' : '')) + '"'
             : (c.sort ? ' title="Klick sortiert nach dieser Spalte, zweiter Klick dreht die Reihenfolge"' : '')) +
        (c.sort ? ' data-sfsort="' + c.sort + '"' + (c.wechsel ? ' data-sfwechsel="1"' : '') : '') + '>' +
        U.esc(c.t) + (aktiv ? ' ' + pf : '') + '</th>';
    }).join('');
    t.innerHTML =
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:6px;">Sortiert nach: <b>' +
      (SORTNAME[s] || s) + (sortUmgekehrt ? ' – umgekehrt' : '') + '</b>' +
      (liste.length > 120 ? ' · die 120 besten angezeigt' : '') + ' · Zeile anklicken für die Risiko-Begründung</div>' +
      '<div style="overflow-x:auto;"><table class="tbl"><thead><tr>' + koepfe +
      '</tr></thead><tbody>' + zeilen + '</tbody></table></div>';
    t.querySelectorAll('[data-sfsort]').forEach(function (th) {
      th.addEventListener('click', function () {
        var ziel = th.getAttribute('data-sfsort');
        if (th.getAttribute('data-sfwechsel') && (s === 'omega' || s === 'omegaAuf')) {
          // Der Hebel hat zwei eigene Sortierungen (groesster/kleinster) - zwischen ihnen wechseln
          ziel = (s === 'omega' ? 'omegaAuf' : 'omega');
          sortUmgekehrt = false;
        } else if (ziel === s) {
          sortUmgekehrt = !sortUmgekehrt;   // zweiter Klick: Reihenfolge umdrehen
        } else {
          sortUmgekehrt = false;
        }
        var sel = el('sfSort');
        if (sel) sel.value = ziel;   // Auswahlfeld bleibt synchron
        WAHL.sort = ziel;
        wahlSchreiben();
        zeige();
      });
    });
    /* Einzelheiten klappen DIREKT UNTER der angeklickten Zeile auf (Tester-Wunsch #13).
       Frueher stand die Info nur im Kasten ueber der Tabelle - wer weit unten
       klickte, musste hochscrollen und sah gar nicht, dass etwas passiert war. */
    // Klick auf die Kennung kopiert sie (Tester-Wunsch #17) - und klappt NICHT auf
    t.querySelectorAll('.sf-kennung').forEach(function (td) {
      td.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var txt = td.textContent;
        try { navigator.clipboard.writeText(txt); } catch (eC) { }
        var alt = td.textContent;
        td.textContent = 'kopiert ✓';
        setTimeout(function () { td.textContent = alt; }, 900);
      });
    });
    t.querySelectorAll('[data-sfi]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var k = RASTER[parseInt(tr.getAttribute('data-sfi'), 10)];
        if (!k) return;
        var warOffen = tr.nextElementSibling && tr.nextElementSibling.className === 'sf-inline';
        t.querySelectorAll('tr.sf-inline').forEach(function (x) { x.parentNode.removeChild(x); });
        var d = el('sfDetail');
        if (d) d.style.display = 'none';
        if (warOffen) return;   // zweiter Klick auf dieselbe Zeile klappt wieder zu
        var idx = parseInt(tr.getAttribute('data-sfi'), 10);
        /* Die aufgeklappte Zeile spannt ueber ALLE sichtbaren Spalten - gerechnet,
           nicht als feste Zahl: mit dem Schalter "alle Kennzahlen" sind es sieben
           oder fuenfzehn, und eine falsche Zahl bricht die Tabelle still. */
        tr.insertAdjacentHTML('afterend',
          '<tr class="sf-inline"><td colspan="' + spalten.length + '" style="background:var(--panel); padding:10px 12px; font-size:var(--fs-text); line-height:1.6; cursor:default;">' +
          '<b>' + kennung(k) + ' – ' + (k.dir === 'call' ? 'Call' : 'Put') + ' ' + U.nf2.format(k.strike) + ', ' + k.restTage +
          ' Tage, BV ' + String(k.ratio).replace('.', ',') + ' · Risikostufe ' + k.stufe + '</b><br>' +
          k.stufenGruende.map(function (g) { return '• ' + U.esc(g); }).join('<br>') +
          '<br><span style="color:var(--muted);">Break-even ' + U.nf2.format(k.breakEven) + ' $ · Delta ' + k.delta +
          ' · Zeitwertanteil ' + k.zeitwertAnteil + ' % · innerer Wert ' + U.nf2.format(k.innererWert) + ' $</span>' +
          '<div data-sfecht="' + idx + '" style="margin-top:8px; border-top:1px solid var(--line); padding-top:8px;">' +
          echteBlock(idx) + '</div>' +
          '</td></tr>');
        wknVerkabeln(t);
      });
    });
    wknVerkabeln(t);
  }

  /** „N von 544 Scheinen“ – lebt neben den Listen, nicht in der Tabelle: die Zahl
   *  soll dort stehen, wo gerade gedreht wird. */
  function trefferZeigen(n) {
    var e = el('sfTreffer');
    if (!e) return;
    e.textContent = RASTER ? n + ' von ' + RASTER.length + ' Scheinen' : '';
  }

  /* Klicks in der WKN-Spalte und im aufgeklappten Kasten. Wird nach jedem
     Neuzeichnen erneut aufgerufen; die Merker verhindern doppelte Handler. */
  function wknVerkabeln(t) {
    t.querySelectorAll('.sf-wkn').forEach(function (td) {
      if (td.getAttribute('data-verkabelt')) return;
      td.setAttribute('data-verkabelt', '1');
      td.addEventListener('click', function (ev) {
        ev.stopPropagation();   // nicht die Zeile auf- und zuklappen
        var i = parseInt(td.getAttribute('data-sfwkn'), 10);
        var tf = WKN_TREFFER[i];
        if (tf && tf.status === 'ok') {
          var txt = tf.scheine[0].wkn;
          try { navigator.clipboard.writeText(txt); } catch (eC) { }
          td.innerHTML = '<span style="color:var(--up);">kopiert ✓</span>';
          setTimeout(function () { td.innerHTML = wknZelle(i); }, 900);
          return;
        }
        // Kein Treffer: der Grund gehoert in die Statuszeile, nicht in ein Fenster,
        // das man wegklicken muss - und er steht ohnehin in der aufgeklappten Zeile.
        if (tf && tf.status === 'leer') { stat('Keine WKN zu dieser Zeile: ' + tf.grund); return; }
        wknHolen(i);
      });
    });
    t.querySelectorAll('[data-sfsuche]').forEach(function (a) {
      if (a.getAttribute('data-verkabelt')) return;
      a.setAttribute('data-verkabelt', '1');
      a.addEventListener('click', function (ev) {
        ev.stopPropagation();
        wknHolen(parseInt(a.getAttribute('data-sfsuche'), 10));
      });
    });
    t.querySelectorAll('.sf-wknkopie').forEach(function (td) {
      if (td.getAttribute('data-verkabelt')) return;
      td.setAttribute('data-verkabelt', '1');
      td.addEventListener('click', function (ev) {
        ev.stopPropagation();
        var alt = td.innerHTML;
        try { navigator.clipboard.writeText(td.textContent.trim()); } catch (eC) { }
        td.innerHTML = '<span style="color:var(--up);">kopiert ✓</span>';
        setTimeout(function () { td.innerHTML = alt; }, 900);
      });
    });
  }

  /** Die Basiswert-Liste füllen – ein <datalist>, damit man tippen UND aussuchen kann. */
  function symbolListeFuellen() {
    var dl = el('sfSymbolListe');
    if (!dl) return;
    dl.innerHTML = symbole().map(function (s) {
      return '<option value="' + U.esc(s) + '"></option>';
    }).join('');
  }

  async function bereit() {
    if (!W) return;   // ohne scheinwahl.js gibt es keine Listen zu bauen
    await wahlLesen();
    listenAufbauen();
    symbolListeFuellen();
    var sym = el('sfSymbol');
    if (sym && !sym.value && ZULETZT.length) sym.value = ZULETZT[0];
    var b = el('sfLadenBtn');
    if (b) b.addEventListener('click', lade);
    var v = el('sfVoreinstellungen');
    if (v) {
      v.querySelectorAll('[data-sfvor]').forEach(function (kn) {
        kn.addEventListener('click', function () { voreinstellungSetzen(kn.getAttribute('data-sfvor')); });
      });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();

  window.ScheinFinder = { lade: lade, zeige: zeige, filterWerte: filterWerte };
})();
