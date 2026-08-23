'use strict';
/* SCOREBOARD - zeigt die Protokolle der Messmaschine an. Rechnet nichts selbst.
 *
 * Warum eine eigene Datei: renderer.js ist fuer die Karten auf "Heute" da; das
 * Scoreboard hat einen eigenen Reiter, eigene Daten (Protokolle aus dem Datenordner)
 * und einen eigenen Grundsatz - jede Zahl hier hat eine Datei mit Entscheidungsweg
 * dahinter, und der ist aufklappbar. Nichts wird zusammengefasst, was sich nicht aus
 * dem Protokoll selbst ergibt.
 *
 * Sortierung nach BELEGSTATUS, nicht nach Rendite. Eine Strategie mit +3 % und t=0,8
 * steht unter einer mit +0,5 % und t=2,4 - sonst gewinnt immer das Rauschen. */
(function () {
  /* Bei einer Ausstiegsregel ist die vorgegebene Haltedauer nur eine Obergrenze.
   * Die tatsaechliche steht im Protokoll und gehoert daneben - sonst vergleicht man
   * eine Messung ueber 8 Kerzen mit einer ueber 2,4. Reine Anzeige, nichts gerechnet. */
  function ausstiegText(p) {
    var a = (p.ergebnisse && p.ergebnisse[0] && p.ergebnisse[0].ausstieg) || null;
    if (!a || a.art !== 'Regel') return '';
    var k = p.ergebnisse.map(function (e) { return (e.ausstieg && e.ausstieg.mittlereKerzen) || 0; });
    var lo = Math.min.apply(null, k), hi = Math.max.apply(null, k);
    return ' · Ausstieg <b>per Regel</b>, tatsächlich ' +
      (lo.toFixed(1) === hi.toFixed(1) ? lo.toFixed(1) : lo.toFixed(1) + '–' + hi.toFixed(1)) + ' Kerzen';
  }

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function pp(x, d) { return x == null || !isFinite(x) ? '–' : ((x >= 0 ? '+' : '') + (x * 100).toFixed(d == null ? 3 : d)); }
  function t2(x) { return x == null || !isFinite(x) ? '–' : (x >= 0 ? '+' : '') + x.toFixed(2); }

  /* Reihenfolge = Belegwert. Die Ziffer steht nur fuers Sortieren. */
  var RANG = { 'bestaetigt': 0, 'nicht-bestaetigt': 1, 'nicht-entscheidbar': 2, 'nicht-messbar': 3, 'widerlegt': 4 };
  var LABEL = { 'bestaetigt': 'bestätigt', 'nicht-bestaetigt': 'nicht bestätigt', 'nicht-entscheidbar': 'nicht entscheidbar', 'nicht-messbar': 'nicht messbar', 'widerlegt': 'widerlegt' };
  var FARBE = { 'bestaetigt': 'var(--up)', 'nicht-bestaetigt': 'var(--series2)', 'nicht-entscheidbar': 'var(--muted)', 'nicht-messbar': 'var(--muted)', 'widerlegt': 'var(--down)' };

  var STAND = [];
  async function laden() {
    var el = document.getElementById('scoreboard');
    if (!el || !window.api || !window.api.readProtokolle) return;
    var r = null;
    try { r = await window.api.readProtokolle(); } catch (e) { r = { ok: false, grund: String(e && e.message || e) }; }
    if (!r || !r.ok) { el.innerHTML = '<div style="color:var(--muted); font-size:12px;">Protokolle nicht lesbar' + (r && r.grund ? ': ' + esc(r.grund) : '') + '.</div>'; return; }
    if (!r.protokolle.length) {
      el.innerHTML = '<div style="color:var(--muted); font-size:12px;">Noch kein Protokoll. Eine Strategie messen mit <code>node studien/messmaschine/messen.js &lt;datei&gt;</code>; das Protokoll gehört nach <code>' + esc(r.ordner) + '</code>.</div>';
      return;
    }
    // Je Kennung nur das juengste Protokoll - aeltere bleiben aufklappbar
    var jeKey = {};
    r.protokolle.forEach(function (p) {
      var k = p.protokoll.strategie.key;
      (jeKey[k] = jeKey[k] || []).push(p);
    });
    STAND = Object.keys(jeKey).map(function (k) {
      var liste = jeKey[k].sort(function (a, b) { return b.mtime - a.mtime; });
      return { key: k, aktuell: liste[0], aeltere: liste.slice(1) };
    }).sort(function (a, b) {
      var ua = a.aktuell.protokoll.bestesUrteil, ub = b.aktuell.protokoll.bestesUrteil;
      if (RANG[ua] !== RANG[ub]) return RANG[ua] - RANG[ub];
      // innerhalb gleichen Status: groesserer Bestaetigungs-t zuerst
      var ta = besterT(a.aktuell.protokoll), tb = besterT(b.aktuell.protokoll);
      return (tb || -99) - (ta || -99);
    });
    zeichnen();
  }
  function besterT(p) {
    var t = null;
    (p.ergebnisse || []).forEach(function (e) { var x = e.bestaetigung && e.bestaetigung.ueberschuss && e.bestaetigung.ueberschuss.t; if (x != null && (t == null || x > t)) t = x; });
    return t;
  }
  function bestesErgebnis(p) {
    // die Variante, die das beste Urteil traegt
    var idx = 0, best = 99;
    (p.urteile || []).forEach(function (u, i) { if (RANG[u] < best) { best = RANG[u]; idx = i; } });
    return p.ergebnisse[idx] || p.ergebnisse[0];
  }

  function zeichnen() {
    var el = document.getElementById('scoreboard');
    var rows = STAND.map(function (z, i) {
      var p = z.aktuell.protokoll, e = bestesErgebnis(p), b = e.bestaetigung.ueberschuss;
      var u = p.bestesUrteil;
      var warn = (p.warnungen || []).length;
      return '<tr class="sbRow" data-i="' + i + '" style="cursor:pointer;">' +
        '<td><b style="color:' + FARBE[u] + ';">' + esc(LABEL[u] || u) + '</b></td>' +
        '<td><b>' + esc(z.key) + '</b>' + (p.tests > 1 ? ' <span style="color:var(--muted);">(' + p.tests + ' Varianten)</span>' : '') + '</td>' +
        '<td class="num">' + pp(b.tagesmittel) + '</td>' +
        '<td class="num">' + pp(b.jeSignal) + '</td>' +
        '<td class="num">' + t2(b.t) + '</td>' +
        '<td class="num">' + pp(b.mde) + '</td>' +
        '<td class="num">' + (b.tage || 0) + ' / ' + (b.signale || 0) + '</td>' +
        '<td style="color:var(--muted);">' + esc(p.gemessenAm.slice(0, 10)) + (warn ? ' <span title="' + warn + ' Warnung(en) – aufklappen" style="color:var(--series2);">⚠' + warn + '</span>' : '') + '</td>' +
        '</tr>';
    }).join('');
    el.innerHTML = '<div style="overflow:auto;"><table class="tbl" style="width:100%;">' +
      '<tr><th>Urteil</th><th>Strategie</th><th style="text-align:right;">Überschuss<br><span style="font-weight:400; color:var(--muted);">Tagesmittel</span></th>' +
      '<th style="text-align:right;">Überschuss<br><span style="font-weight:400; color:var(--muted);">je Signal</span></th>' +
      '<th style="text-align:right;">t</th><th style="text-align:right;">MDE</th><th style="text-align:right;">Tage / Signale</th><th>gemessen</th></tr>' +
      rows + '</table></div>' +
      '<div id="sbDetail" style="margin-top:10px;"></div>' +
      '<div style="font-size:11.5px; color:var(--muted); margin-top:6px;">Alle Werte aus der <b>Bestätigungshälfte</b> (zurückgehaltene Tage) in Prozentpunkten. „Tagesmittel" ist die Teststatistik, „je Signal" die handelbare Zahl – beide können verschiedene Vorzeichen haben, dann steht eine Warnung dabei. Zeile anklicken für den vollständigen Entscheidungsweg.</div>';
    el.querySelectorAll('tr.sbRow').forEach(function (tr) {
      tr.addEventListener('click', function () { detail(parseInt(tr.getAttribute('data-i'), 10)); });
    });
  }

  function detail(i) {
    var z = STAND[i]; if (!z) return;
    var p = z.aktuell.protokoll, d = document.getElementById('sbDetail');
    var h = '<div class="panel" style="background:var(--surface-2, var(--grid));">' +
      '<div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:8px;">' +
      '<h3 style="margin:0;">' + esc(z.key) + ' – Entscheidungsweg</h3>' +
      '<span style="font-size:11.5px; color:var(--muted);">Verfahren ' + esc(p.verfahren.version) + ' · ' + esc(z.aktuell.datei) + '</span></div>' +
      '<div style="font-size:12px; color:var(--ink-2); margin:6px 0 10px;"><b>Grund:</b> ' + esc(p.strategie.grund) + '</div>' +
      '<div style="font-size:12px; margin-bottom:10px;">Universum: <b>' + p.universum.werte + '</b> Werte, <b>' + p.universum.handelstage + '</b> Handelstage (' + esc(p.universum.von) + ' bis ' + esc(p.universum.bis) + '), Schnitt am <b>' + esc(p.universum.schnittTag) + '</b> · Haltedauer <b>' + p.strategie.haltedauerKerzen + '</b> Kerzen · Richtung <b>' + esc(p.strategie.richtung) + '</b> · ' + p.tests + ' Test(s)' + ausstiegText(p) + '</div>';
    // Jede Entscheidung, nummeriert - das ist die 100-%-Einsicht
    h += '<table class="tbl" style="width:100%; font-size:12px;"><tr><th>#</th><th>Regel</th><th>Eingabe</th><th>Ergebnis</th><th>Begründung</th></tr>';
    (p.entscheidungen || []).forEach(function (e) {
      h += '<tr><td>' + e.nr + '</td><td><b>' + esc(e.regel) + '</b></td>' +
        '<td style="font-family:var(--mono, monospace); font-size:11px; white-space:pre-wrap; max-width:220px;">' + esc(kurz(e.eingabe)) + '</td>' +
        '<td style="font-family:var(--mono, monospace); font-size:11px; white-space:pre-wrap; max-width:220px;">' + esc(kurz(e.ergebnis)) + '</td>' +
        '<td style="color:var(--ink-2);">' + esc(e.begruendung) + '</td></tr>';
    });
    h += '</table>';
    if ((p.warnungen || []).length) {
      h += '<div style="margin-top:10px; padding:8px 10px; border-left:3px solid var(--series2); font-size:12px;"><b>Warnungen</b>' +
        p.warnungen.map(function (w) { return '<div style="margin-top:4px;">[' + esc(w.kennung) + '] ' + esc(w.text) + '</div>'; }).join('') + '</div>';
    }
    // Alle Varianten mit Entdeckung UND Bestaetigung - nichts wird versteckt
    h += '<h4 style="margin:12px 0 6px;">Alle Varianten</h4><div style="overflow:auto;"><table class="tbl" style="font-size:12px;">' +
      '<tr><th>#</th><th>Parameter</th><th>Signale</th><th colspan="2" style="text-align:center;">Entdeckung</th><th colspan="3" style="text-align:center;">Bestätigung</th><th>Urteil</th></tr>' +
      '<tr><th></th><th></th><th></th><th style="text-align:right;">roh</th><th style="text-align:right;">Überschuss (t)</th><th style="text-align:right;">roh</th><th style="text-align:right;">Überschuss (t)</th><th style="text-align:right;">je Signal</th><th></th></tr>';
    (p.ergebnisse || []).forEach(function (e, vi) {
      h += '<tr><td>' + vi + '</td><td style="font-family:var(--mono, monospace); font-size:11px;">' + esc(JSON.stringify(e.params)).slice(0, 80) + '</td><td class="num">' + e.signale + '</td>' +
        '<td class="num">' + pp(e.entdeckung.roh.tagesmittel) + '</td><td class="num">' + pp(e.entdeckung.ueberschuss.tagesmittel) + ' (' + t2(e.entdeckung.ueberschuss.t) + ')</td>' +
        '<td class="num">' + pp(e.bestaetigung.roh.tagesmittel) + '</td><td class="num">' + pp(e.bestaetigung.ueberschuss.tagesmittel) + ' (' + t2(e.bestaetigung.ueberschuss.t) + ')</td>' +
        '<td class="num">' + pp(e.bestaetigung.ueberschuss.jeSignal) + '</td>' +
        '<td style="color:' + FARBE[p.urteile[vi]] + ';">' + esc(LABEL[p.urteile[vi]] || p.urteile[vi]) + '</td></tr>';
    });
    h += '</table></div>';
    if (z.aeltere.length) h += '<div style="font-size:11.5px; color:var(--muted); margin-top:8px;">Ältere Protokolle dieser Kennung: ' + z.aeltere.map(function (a) { return esc(a.datei); }).join(', ') + '</div>';
    if (p.strategie.quelle) h += '<details style="margin-top:10px;"><summary style="font-size:12px; cursor:pointer;">Quelltext der gemessenen Strategie</summary><pre style="font-size:11px; overflow:auto; max-height:300px;">' + esc(p.strategie.quelle) + '</pre></details>';
    h += '</div>';
    d.innerHTML = h;
  }
  function kurz(o) { var s = typeof o === 'string' ? o : JSON.stringify(o, null, 0); return s.length > 300 ? s.slice(0, 300) + '…' : s; }

  /* ---------- Eingabe: neue Strategie ablegen ---------- */
  function eingabe() {
    var btn = document.getElementById('stAblegen');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      var st = document.getElementById('stStatus');
      var key = (document.getElementById('stKey').value || '').trim().toLowerCase();
      var grund = (document.getElementById('stGrund').value || '').trim();
      var sig = (document.getElementById('stSignal').value || '').trim();
      var halten = parseInt(document.getElementById('stHalten').value, 10);
      var richtung = document.getElementById('stRichtung').value;
      var spanne = parseFloat(document.getElementById('stSpanne').value);
      var varTxt = (document.getElementById('stVarianten').value || '').trim();
      var stop = (document.getElementById('stStop').value || '').trim();
      if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(key)) { st.textContent = 'Kennung: nur Kleinbuchstaben, Ziffern, Bindestrich.'; return; }
      if (grund.length < 20) { st.textContent = 'Der Grund braucht mindestens 20 Zeichen – ohne Grund misst die Maschine nicht.'; return; }
      if (!/function\s+signal\s*\(/.test(sig)) { st.textContent = 'Die Signalfunktion muss „function signal(bars, i, params)" heißen.'; return; }
      /* Ohne Namen kann die Maschine die Regel nicht anbinden. Der Rest der Pruefung
       * passiert dort, wo sie hingehoert - in der Maschine, nicht in der Oberflaeche. */
      if (stop && stop.indexOf('function stopNiveau') === -1) {
        st.textContent = 'Die Ausstiegsregel muss „function stopNiveau(abgeschlossen, einKurs, params)“ heißen – oder das Feld bleibt leer.'; return; }
      if (!(halten >= 1 && halten <= 130)) { st.textContent = 'Haltedauer: 1 bis 130 Kerzen.'; return; }
      var varianten = null;
      if (varTxt) { try { varianten = JSON.parse(varTxt); if (!Array.isArray(varianten)) throw new Error(); } catch (e) { st.textContent = 'Varianten: JSON-Liste erwartet, z. B. [{"a":1},{"a":2}].'; return; } }
      /* Die Datei, die die Messmaschine versteht. Der Quelltext der Signalfunktion wird
       * unveraendert uebernommen - was gemessen wird, ist genau das, was hier steht. */
      var quelle = "'use strict';\n" +
        '/* Abgelegt aus der App am ' + new Date().toISOString().slice(0, 16).replace('T', ' ') + '. Gemessen wird mit:\n' +
        ' *   node studien/messmaschine/messen.js <diese Datei>\n */\n' +
        "var Q = require(require('path').join(process.env.STOCK_DASHBOARD_QUELLE || '.', 'quant.js'));\n" +
        sig + '\n' +
        (stop ? stop + "\n" : '') +
        'module.exports = {\n' +
        '  key: ' + JSON.stringify(key) + ',\n' +
        '  grund: ' + JSON.stringify(grund) + ',\n' +
        "  zeitrahmen: '60m',\n" +
        '  haltedauerKerzen: ' + halten + ',\n' +
        '  richtung: ' + JSON.stringify(richtung) + ',\n' +
        "  universum: 'aktien',\n" +
        '  kosten: { spanneBp: ' + (isFinite(spanne) ? spanne : 5) + ' },\n' +
        (varianten ? '  varianten: ' + JSON.stringify(varianten) + ',\n' : '') +
        '  signal: signal,\n' +
        (stop ? "  stopNiveau: stopNiveau,\n" : '') +
        '};\n';
      btn.disabled = true; st.textContent = 'Lege ab …';
      try {
        var r = await window.api.writeStrategie(key, quelle);
        st.textContent = r && r.ok
          ? 'Abgelegt: ' + r.pfad + ' – jetzt messen mit node studien/messmaschine/messen.js "' + r.pfad + '"'
          : 'Nicht abgelegt: ' + (r && r.grund || 'unbekannter Fehler');
      } catch (e) { st.textContent = 'Fehler: ' + (e && e.message || e); }
      btn.disabled = false;
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    eingabe();
    document.addEventListener('tab-changed', function (ev) { if (ev.detail === 'messung') laden(); });
    setTimeout(laden, 4000);
  });
  window.Scoreboard = { laden: laden };
})();
