'use strict';
/* ================= Schein-Finder =================
 *
 * Filtert das Raster möglicher Optionsscheine zu einem Basiswert nach den üblichen
 * Kennzahlen und nach Risikostufe. Die Rechnung steht in quant.js (rein, getestet);
 * hier wird nur geladen, gefiltert und angezeigt.
 *
 * WAS DAS IST UND WAS NICHT: Gerechnet wird ein MODELL-Raster mit exakt dem Modell,
 * mit dem auch das Depot handelt (Black-Scholes plus das an echten Emittentenkursen
 * geeichte Cent-Spread-Modell). Ein Schein aus dem Finder verhält sich in der
 * Simulation genauso wie im Handel – das ist der Sinn: aussuchen, was man versteht,
 * und genau das handelt die App dann auch.
 * NEU (Tickets #9/#11/#17): Zu jeder Zeile lässt sich der ECHTE aufgelegte Schein
 * nachschlagen – WKN, ISIN, Emittent, gestellte Kurse, über wkn.js. Die Preise
 * bleiben Modellpreise; die echten Angaben stehen daneben, nicht an ihrer Stelle.
 */
(function () {
  var Q = window.Quant, U = window.U;
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

  function el(id) { return document.getElementById(id); }
  function stat(t) { var e = el('sfStatus'); if (e) e.textContent = t || ''; }

  function symbole() {
    var s = (window.Dash && window.Dash.STOCKS ? window.Dash.STOCKS.map(function (x) { return x.y; }) : []);
    try {
      var D = window.__D ? window.__D() : null;
      (D && D.watchlist || []).forEach(function (w) { if (s.indexOf(w.y) === -1) s.push(w.y); });
    } catch (e) { }
    return s;
  }

  async function lade() {
    var sym = el('sfSymbol').value;
    if (!sym) return;
    stat('Lade ' + sym + ' …');
    try {
      var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) + '?range=1y&interval=1d';
      var res = await window.api.fetchText(url);
      if (!res.ok) { stat('Keine Kursdaten bekommen – bitte Internetverbindung prüfen und noch einmal auf „Laden & rechnen“ klicken.'); return; }
      var r = JSON.parse(res.body).chart.result[0];
      var closes = (r.indicators.quote[0].close || []).filter(function (c) { return c != null; });
      if (closes.length < 60) { stat('Zu wenig Historie für eine Volatilitätsschätzung.'); return; }
      var spot = closes[closes.length - 1];
      // Dieselbe Vola-Schätzung wie im Handel: historische Vola × 1,1 als Näherung
      // der impliziten. Wer sie ändern will, nutzt das Feld daneben.
      var iv = Math.min(1.5, Math.max(0.15, Q.histVol(closes, 60) * 1.1));
      var ivEl = el('sfIv');
      if (ivEl && ivEl.value && parseFloat(ivEl.value) > 0) iv = Math.min(1.5, Math.max(0.05, parseFloat(ivEl.value) / 100));
      else if (ivEl) ivEl.placeholder = Math.round(iv * 100) + ' (geschätzt)';
      BASIS = { sym: sym, spot: spot, iv: iv, stand: Date.now() };
      RASTER = Q.scheinRaster(spot, iv, Date.now());
      WKN_TREFFER = {};   // neues Raster: alte Zuordnungen gelten nicht mehr
      BW_NAME = String(sym).split('.')[0].toUpperCase();
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
    return '<b>Echte Scheine dazu</b> <span style="color:var(--muted); font-size:11.5px;">– Klick auf die WKN oder den onvista-Namen kopiert den Eintrag</span>' +
      '<div style="overflow-x:auto; margin-top:4px;"><table class="tbl" style="font-size:11.5px;">' +
      '<tr><th>WKN</th><th>Emittent</th><th style="text-align:right;">Basis</th><th style="text-align:right;">fällig</th>' +
      '<th style="text-align:right;">BV</th><th style="text-align:right;">Geld/Brief</th><th style="text-align:right;">Stand</th>' +
      '<th style="text-align:right;">Spanne</th><th style="text-align:right;">impl. Vola</th><th>Abweichung</th><th>ISIN</th><th>onvista-Name</th></tr>' +
      zeilen + '</table></div>' +
      '<div style="color:var(--muted); font-size:11px; margin-top:6px; line-height:1.5;">' +
      'Emittentenkurse in Euro, das Modell rechnet in Dollar auf den Basiswert – <b>nicht ineinander umgerechnet</b>, ' +
      'die Euro-Kurse stehen als Orientierung da. „Spanne“ ist hier die volle Geld-Brief-Spanne; die Modellspalte nennt sie je Seite ' +
      '(diese Zeile: 2 × ' + k.spreadPct.toFixed(2) + ' % = ' + (2 * k.spreadPct).toFixed(2) + ' % je Umlauf). ' +
      'Die implizite Vola der echten Scheine ist der Marktpreis der Schwankung – das Modell rechnet hier mit ' +
      (BASIS ? Math.round(BASIS.iv * 100) : '?') + ' %; weicht das stark ab, ist die Modellzeile zu billig oder zu teuer gerechnet. ' +
      '„Stand“ ist die letzte Kursstellung des Emittenten (gestellt wird nur 8–22 Uhr an Handelstagen). ' +
      'Quelle: offene Produktsuche von onvista, ohne Gewähr. Verbindlich sind Basisprospekt und Basisinformationsblatt des Emittenten. ' +
      'Simulation – die App kauft nichts.</div>';
  }

  function filterWerte() {
    var g = function (id, std) { var e = el(id); var v = e ? parseFloat(e.value) : NaN; return isFinite(v) ? v : std; };
    return {
      typ: (el('sfTyp') || {}).value || 'alle',
      stufeMax: g('sfStufe', 5),
      hebelMin: g('sfHebelMin', 0),
      hebelMax: g('sfHebelMax', 999),
      lzMin: g('sfLzMin', 0),
      lzMax: g('sfLzMax', 9999),
      spreadMax: g('sfSpreadMax', 100),
      tvMax: g('sfTvMax', 100),
      // Basispreis-Band ums Geld (Tester-Wunsch #8): "Basis ist der aktuelle
      // Wert der Basis, den Spread kann man einstellen" - genau so gebaut.
      band: g('sfBand', 999),
      sort: (el('sfSort') || {}).value || 'stufe'
    };
  }

  function zeige() {
    var t = el('sfTabelle');
    if (!t || !RASTER) return;
    var f = filterWerte();
    var liste = RASTER.filter(function (k) {
      if (f.typ !== 'alle' && k.dir !== f.typ) return false;
      if (k.stufe > f.stufeMax) return false;
      if (k.omega < f.hebelMin || k.omega > f.hebelMax) return false;
      if (k.restTage < f.lzMin || k.restTage > f.lzMax) return false;
      if (k.spreadPct > f.spreadMax) return false;
      if (k.totalverlustP > f.tvMax) return false;
      if (BASIS && f.band < 999 && Math.abs(k.strike / BASIS.spot - 1) * 100 > f.band) return false;
      return true;
    });
    var s = f.sort;
    liste.sort(function (a, b) {
      if (s === 'stufe') return a.stufe - b.stufe || a.spanneHuerdePct - b.spanneHuerdePct;
      if (s === 'omega') return b.omega - a.omega;
      if (s === 'omegaAuf') return a.omega - b.omega;
      if (s === 'spread') return a.spreadPct - b.spreadPct;
      if (s === 'theta') return b.thetaWoche - a.thetaWoche;   // am wenigsten Verfall zuerst (theta ist negativ)
      if (s === 'huerde') return a.spanneHuerdePct - b.spanneHuerdePct;
      if (s === 'tv') return a.totalverlustP - b.totalverlustP;
      return a.stufe - b.stufe;
    });
    // Zweiter Klick auf denselben Kopf: Reihenfolge umdrehen (Tester-Wunsch #13) -
    // wer die teuersten Spannen oder die groesste Totalverlust-Gefahr sehen will,
    // soll dafuer nicht durch die ganze Liste scrollen muessen.
    if (sortUmgekehrt) liste.reverse();
    if (!liste.length) {
      t.innerHTML = '<div class="empty" style="padding:14px 4px;">Kein Schein erfüllt alle Filter gleichzeitig. ' +
        'Am häufigsten ist „max. Spanne“ oder „max. Totalverlust“ die strengste Hürde – Scheine nah am Geld mit kleinem ' +
        'Bezugsverhältnis sind billig, und der feste Cent-Spread wiegt dort relativ schwer. Einen Filter lockern hilft.</div>';
      return;
    }
    var STUFENFARBE = ['', 'var(--up)', '#7c9cf5', 'var(--warn)', '#f59c40', 'var(--down)'];
    var zeilen = liste.slice(0, 120).map(function (k, i) {
      var idx = RASTER.indexOf(k);
      return '<tr data-sfi="' + idx + '" style="cursor:pointer;">' +
        '<td class="sf-wkn" data-sfwkn="' + idx + '" style="white-space:nowrap; font-size:11px; cursor:pointer;" ' +
        'title="Echte WKN nachschlagen. Erster Klick sucht den passenden aufgelegten Schein, danach kopiert ein Klick die WKN.">' + wknZelle(idx) + '</td>' +
        '<td class="sf-kennung" style="white-space:nowrap; color:var(--muted); font-size:11px; cursor:copy;" title="Kennung in der Syntax der Produktsuche – Klick kopiert sie">' + kennung(k) + '</td>' +
        '<td><b style="color:' + STUFENFARBE[k.stufe] + ';">' + k.stufe + '</b></td>' +
        '<td>' + (k.dir === 'call' ? '▲ Call' : '▼ Put') + '</td>' +
        '<td style="text-align:right;">' + U.nf2.format(k.strike) + '</td>' +
        '<td style="text-align:right;">' + (k.otmPct >= 0 ? '+' : '') + k.otmPct.toFixed(1) + ' %</td>' +
        '<td style="text-align:right;">' + k.restTage + '</td>' +
        '<td style="text-align:right;">' + String(k.ratio).replace('.', ',') + '</td>' +
        '<td style="text-align:right;">' + U.nf2.format(k.brief) + '</td>' +
        '<td style="text-align:right;">' + k.omega.toFixed(1) + '×</td>' +
        '<td style="text-align:right;">' + k.spreadPct.toFixed(2) + ' %</td>' +
        '<td style="text-align:right;">' + k.thetaWoche.toFixed(1) + ' %</td>' +
        '<td style="text-align:right;">' + k.aufgeldPa.toFixed(0) + ' %</td>' +
        '<td style="text-align:right;">' + k.totalverlustP.toFixed(0) + ' %</td>' +
        '<td style="text-align:right;">' + (k.spanneHuerdePct != null ? k.spanneHuerdePct.toFixed(2) + ' %' : '–') + '</td></tr>';
    }).join('');
    /* Spaltenkoepfe sind zugleich die Sortierung (Tester-Wunsch #4): Die aktive
       Spalte traegt einen Pfeil, ein Klick sortiert nach ihr. Beim Hebel wechselt
       ein zweiter Klick die Richtung (groesster/kleinster) - bei allen anderen
       Kennzahlen gibt es genau eine sinnvolle Richtung ("am wenigsten Risiko/
       Kosten zuerst"), also kein Umschalten, das nur verwirren wuerde. */
    var SPALTEN = [
      { t: 'WKN', tip: 'Echter aufgelegter Schein zu dieser Modell-Zeile. Klick sucht ihn bei der offenen Produktsuche von onvista, ein weiterer Klick kopiert die WKN. „≈“ heißt: nur ähnlich – die Abweichung steht in der aufgeklappten Zeile.' },
      { t: 'Kennung', tip: 'Kennung in der Syntax der Produktsuche: Typ/Basiswert/Basispreis/Bezugsverhältnis/Fälligkeit – genau so heißen die Scheine bei onvista, so lässt sie sich dort suchen. Klick kopiert sie. Das Datum ist das Laufzeitende der GERECHNETEN Zeile; aufgelegt wird nur auf feste Termine – den echten Schein nennt die WKN-Spalte daneben.' },
      { t: 'Stufe', tip: 'Risikostufe 1 (defensiv) bis 5 (Lotterielos)', sort: 'stufe', pfeil: '↑' },
      { t: 'Typ' },
      { t: 'Basispreis', r: 1 },
      { t: 'OTM', tip: 'Abstand zum Basispreis. Positiv = aus dem Geld.', r: 1 },
      { t: 'Tage', tip: 'Restlaufzeit in Tagen', r: 1 },
      { t: 'BV', tip: 'Bezugsverhältnis – der Kostenhebel: BV 1,0 zahlt relativ die kleinste Spanne', r: 1 },
      { t: 'Brief', tip: 'Kaufkurs (Brief) laut Modell', r: 1 },
      { t: 'Hebel', tip: 'Effektiver Hebel (Omega). Klick sortiert, zweiter Klick dreht die Richtung.', sort: (s === 'omegaAuf' ? 'omegaAuf' : 'omega'), pfeil: (s === 'omegaAuf' ? '↑' : '↓'), wechsel: 1, r: 1 },
      { t: 'Spanne', tip: 'Geld-Brief-Spanne je Seite, aus dem an echten Kursen geeichten Cent-Modell', sort: 'spread', pfeil: '↑', r: 1 },
      { t: 'Θ/Woche', tip: 'Zeitwertverlust in einer Woche bei unverändertem Kurs', sort: 'theta', pfeil: '↑', r: 1 },
      { t: 'Aufgeld p.a.', tip: 'Aufgeld aufs Jahr gerechnet', r: 1 },
      { t: 'Totalverlust', tip: 'Modell-Wahrscheinlichkeit, dass der Schein wertlos verfällt', sort: 'tv', pfeil: '↑', r: 1 },
      { t: 'Hürde', tip: 'Wie weit der Basiswert laufen muss, um allein die Spanne zu bezahlen', sort: 'huerde', pfeil: '↑', r: 1 }
    ];
    var SORTNAME = { stufe: 'Risikostufe (defensiv zuerst)', huerde: 'kleinste Spannen-Hürde (ohne Zeitwert)', spread: 'kleinste Spanne', theta: 'wenigster Zeitwertverlust', tv: 'kleinste Totalverlust-Gefahr', omega: 'größter Hebel', omegaAuf: 'kleinster Hebel' };
    var koepfe = SPALTEN.map(function (c) {
      var aktiv = c.sort && (c.sort === s || (c.wechsel && (s === 'omega' || s === 'omegaAuf')));
      var stil = (c.r ? 'text-align:right;' : '') + (c.sort ? 'cursor:pointer; white-space:nowrap;' : '') + (aktiv ? 'color:var(--acc);' : '');
      var pf = c.pfeil;
      if (aktiv && sortUmgekehrt && !c.wechsel) pf = (pf === '↑' ? '↓' : '↑');
      return '<th' + (stil ? ' style="' + stil + '"' : '') +
        (c.tip ? ' title="' + c.tip + (c.sort && !c.wechsel ? ' Klick sortiert, zweiter Klick dreht die Reihenfolge.' : '') + '"'
               : (c.sort ? ' title="Klick sortiert nach dieser Spalte, zweiter Klick dreht die Reihenfolge"' : '')) +
        (c.sort ? ' data-sfsort="' + c.sort + '"' + (c.wechsel ? ' data-sfwechsel="1"' : '') : '') + '>' +
        c.t + (aktiv ? ' ' + pf : '') + '</th>';
    }).join('');
    t.innerHTML =
      '<div style="font-size:11.5px; color:var(--muted); margin-bottom:6px;">' + liste.length + ' von ' + RASTER.length +
      ' Scheinen nach Filter · sortiert nach: <b>' + (SORTNAME[s] || s) + (sortUmgekehrt ? ' – umgekehrt' : '') + '</b>' +
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
        tr.insertAdjacentHTML('afterend',
          '<tr class="sf-inline"><td colspan="15" style="background:var(--panel); padding:10px 12px; font-size:12.5px; line-height:1.6; cursor:default;">' +
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

  function bereit() {
    var sel = el('sfSymbol');
    if (sel && !sel.options.length) {
      symbole().forEach(function (s) {
        var o = document.createElement('option'); o.value = s; o.textContent = s; sel.appendChild(o);
      });
    }
    var b = el('sfLadenBtn');
    if (b) b.addEventListener('click', lade);
    ['sfTyp', 'sfStufe', 'sfHebelMin', 'sfHebelMax', 'sfLzMin', 'sfLzMax', 'sfSpreadMax', 'sfTvMax', 'sfBand'].forEach(function (id) {
      var e = el(id);
      if (e) e.addEventListener('change', zeige);
    });
    // Wahl im Auswahlfeld setzt die umgekehrte Reihenfolge zurueck - das Feld
    // benennt eine Richtung ("kleinste Spanne"), also soll genau die gelten.
    var so = el('sfSort');
    if (so) so.addEventListener('change', function () { sortUmgekehrt = false; zeige(); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();

  window.ScheinFinder = { lade: lade, zeige: zeige };
})();
