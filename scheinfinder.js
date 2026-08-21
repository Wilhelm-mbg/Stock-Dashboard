'use strict';
/* ================= Schein-Finder =================
 *
 * Filtert das Raster möglicher Optionsscheine zu einem Basiswert nach den üblichen
 * Kennzahlen und nach Risikostufe. Die Rechnung steht in quant.js (rein, getestet);
 * hier wird nur geladen, gefiltert und angezeigt.
 *
 * WAS DAS IST UND WAS NICHT: Es gibt keine echten WKN-Listen – Emittenten-Daten
 * liefern nur Bezahl-APIs, und die sind bewusst draußen. Der Finder rechnet
 * stattdessen mit exakt dem Modell, mit dem auch das Depot handelt: Black-Scholes
 * plus das an echten Emittentenkursen geeichte Cent-Spread-Modell. Ein Schein aus
 * dem Finder verhält sich in der Simulation genauso wie im Handel – das ist der
 * Sinn: aussuchen, was man versteht, und genau das handelt die App dann auch.
 */
(function () {
  var Q = window.Quant, U = window.U;
  var RASTER = null;        // aktuelles Raster
  var BASIS = null;         // {sym, spot, iv, stand}
  var sortUmgekehrt = false; // zweiter Klick auf denselben Spaltenkopf dreht die Reihenfolge

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
      stat(sym + ': Kurs ' + U.nf2.format(spot) + ' $, Vola ' + Math.round(iv * 100) + ' % → ' +
        RASTER.length + ' Scheine im Raster (Modell, keine echten WKNs).');
      zeige();
    } catch (e) { stat('Fehler: ' + (e.message || e)); }
  }

  /* Modell-Kennung statt WKN (Tester-Wunsch #9/#11): Echte WKNs gibt es nur aus
     Bezahl-APIs der Emittenten, die bewusst draussen sind. Die Kennung baut sich
     aus den Merkmalen selbst - "C112,5-45T·0,1" ist Call, Basispreis 112,50,
     45 Tage Restlaufzeit, BV 0,1. Damit laesst sich ein Schein benennen,
     wiederfinden und beim Emittenten das echte Gegenstueck suchen. */
  function kennung(k) {
    var strike = k.strike % 1 ? String(k.strike.toFixed(1)).replace('.', ',') : String(Math.round(k.strike));
    return (k.dir === 'call' ? 'C' : 'P') + strike + '-' + k.restTage + 'T·' + String(k.ratio).replace('.', ',');
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
    var STUFENFARBE = ['', 'var(--up)', '#7c9cf5', 'var(--warn)', '#f59c40', 'var(--down)'];
    var zeilen = liste.slice(0, 120).map(function (k, i) {
      return '<tr data-sfi="' + RASTER.indexOf(k) + '" style="cursor:pointer;">' +
        '<td style="white-space:nowrap; color:var(--muted); font-size:11px;">' + kennung(k) + '</td>' +
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
      { t: 'Kennung', tip: 'Modell-Kennung statt WKN: Echte WKN-Listen liefern nur Bezahl-APIs der Emittenten, und die sind bewusst draußen. Die Kennung fasst Typ, Basispreis, Restlaufzeit und BV zusammen – damit findest du bei jedem Emittenten den vergleichbaren echten Schein.' },
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
    var SORTNAME = { stufe: 'Risikostufe (defensiv zuerst)', huerde: 'kleinste Kostenhürde', spread: 'kleinste Spanne', theta: 'wenigster Zeitwertverlust', tv: 'kleinste Totalverlust-Gefahr', omega: 'größter Hebel', omegaAuf: 'kleinster Hebel' };
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
    t.querySelectorAll('[data-sfi]').forEach(function (tr) {
      tr.addEventListener('click', function () {
        var k = RASTER[parseInt(tr.getAttribute('data-sfi'), 10)];
        if (!k) return;
        var warOffen = tr.nextElementSibling && tr.nextElementSibling.className === 'sf-inline';
        t.querySelectorAll('tr.sf-inline').forEach(function (x) { x.parentNode.removeChild(x); });
        var d = el('sfDetail');
        if (d) d.style.display = 'none';
        if (warOffen) return;   // zweiter Klick auf dieselbe Zeile klappt wieder zu
        tr.insertAdjacentHTML('afterend',
          '<tr class="sf-inline"><td colspan="14" style="background:var(--panel); padding:10px 12px; font-size:12.5px; line-height:1.6; cursor:default;">' +
          '<b>' + kennung(k) + ' – ' + (k.dir === 'call' ? 'Call' : 'Put') + ' ' + U.nf2.format(k.strike) + ', ' + k.restTage +
          ' Tage, BV ' + String(k.ratio).replace('.', ',') + ' · Risikostufe ' + k.stufe + '</b><br>' +
          '<span style="color:var(--muted); font-size:11.5px;">Modell-Kennung statt WKN – echte WKN-Listen gibt es nur aus Bezahl-Quellen. Mit Typ, Basispreis, Laufzeit und BV findest du bei jedem Emittenten den vergleichbaren echten Schein.</span><br>' +
          k.stufenGruende.map(function (g) { return '• ' + U.esc(g); }).join('<br>') +
          '<br><span style="color:var(--muted);">Break-even ' + U.nf2.format(k.breakEven) + ' $ · Delta ' + k.delta +
          ' · Zeitwertanteil ' + k.zeitwertAnteil + ' % · innerer Wert ' + U.nf2.format(k.innererWert) + ' $</span>' +
          '</td></tr>');
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
    ['sfTyp', 'sfStufe', 'sfHebelMin', 'sfHebelMax', 'sfLzMin', 'sfLzMax', 'sfSpreadMax', 'sfTvMax'].forEach(function (id) {
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
