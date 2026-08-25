'use strict';
/* Das Bestandsdepot auf der Seite "Heute" (Felix, Issue #71).
 *
 * Eine Liste der eigenen Papiere mit dem, was die gemessenen Regeln zu ihnen sagen -
 * getrennt nach Kurzfrist und Mittelfrist, wie Felix es wollte.
 *
 * DIE GRENZE, die hier nicht verschoben wird: Gezeigt wird der SIGNALZUSTAND, keine
 * Empfehlung. "Die Regel hätte hier ein Signal" ist eine Beobachtung; "kaufen" wäre
 * Anlageberatung, und die gibt diese App nicht - auch nicht, wenn echte Papiere
 * daneben liegen. Felix' Wort "Handlungsempfehlungen" ist deshalb bewusst nicht
 * uebernommen.
 */
(function () {
  var B = null;

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function el(id) { return document.getElementById(id); }

  /* ---------------------------------------------------------- Signalzeile - */
  function kurzText(k) {
    if (!k) return { txt: 'noch nicht geprüft', cls: 'muted' };
    if (k.ok) return { txt: 'Regel gibt ein Signal', cls: 'up' };
    return { txt: k.grund || 'kein Signal', cls: 'muted' };
  }
  function mittelText(m) {
    if (!m) return { txt: 'noch nicht geprüft', cls: 'muted' };
    var teile = [];
    if (m.momentum) teile.push('Momentum hält' + (m.momentum.richtung < 0 ? ' (short)' : ''));
    if (m.drift) teile.push('Ergebnis-Drift hält' + (m.drift.richtung < 0 ? ' (short)' : ''));
    if (!teile.length) return { txt: 'in keinem Buch', cls: 'muted' };
    return { txt: teile.join(' · '), cls: 'up' };
  }

  function zeichnen() {
    var kasten = el('bestandListe');
    if (!kasten || !B) return;
    var werte = B.liste();
    if (!werte.length) {
      kasten.innerHTML = '<div class="empty" style="padding:10px 0;">Noch keine eigenen Papiere eingetragen. ' +
        'Unten den Auszug der Depotbank einfügen – die ISIN genügt.</div>';
      return;
    }
    var zeilen = werte.map(function (w) {
      var s = B.standVon(w.sym);
      var k = kurzText(s.kurz), m = mittelText(s.mittel);
      return '<tr>' +
        '<td><button type="button" data-bsym="' + esc(w.sym) + '" data-bname="' + esc(w.name) + '" ' +
          'title="Im Aktien-Explorer öffnen" style="background:none; border:0; padding:0; font:inherit; ' +
          'font-weight:700; color:var(--series); cursor:pointer; text-decoration:underline dotted;">' +
          esc(w.sym) + '</button>' +
          '<div style="color:var(--muted); font-size:var(--fs-klein);">' + esc(w.name) + '</div></td>' +
        '<td style="white-space:nowrap;">' + (w.stueck != null ? esc(w.stueck) : '–') + '</td>' +
        '<td class="' + k.cls + '">' + esc(k.txt) + '</td>' +
        '<td class="' + m.cls + '">' + esc(m.txt) + '</td>' +
        '<td><button class="btn ghost" type="button" data-bweg="' + esc(w.sym) + '" ' +
          'style="padding:2px 8px; font-size:var(--fs-klein);">Entfernen</button></td>' +
        '</tr>';
    }).join('');
    kasten.innerHTML = '<table class="tbl"><tr><th>Wert</th><th>Stück</th>' +
      '<th>Kurzfrist</th><th>Mittelfrist</th><th></th></tr>' + zeilen + '</table>';
  }

  /* ------------------------------------------------------------- Einlesen - */
  async function einlesen() {
    var feld = el('bestandText'), st = el('bestandStatus');
    if (!feld || !B) return;
    var zeilen = B.ausText(feld.value);
    if (!zeilen.length) {
      st.textContent = 'In dem Text stand nichts, was nach einem Wertpapier aussieht.';
      return;
    }
    st.textContent = zeilen.length + ' Zeile(n) gefunden, löse auf …';
    var neu = 0, schon = 0, fehl = [];
    for (var i = 0; i < zeilen.length; i++) {
      var z = zeilen[i];
      var sym = z.sym, name = null;
      if (!sym && z.isin) {
        var r = await B.aufloesen(z.isin);
        if (r.fehler) { fehl.push(z.isin + ' (' + r.fehler + ')'); continue; }
        sym = r.sym; name = r.name;
      }
      if (!sym) { fehl.push(z.roh.slice(0, 40)); continue; }
      var e = await B.hinzu(sym, name || sym, z.stueck, z.isin, z.wkn);
      if (e === 'schon') schon++; else if (e) neu++;
      st.textContent = 'Aufgelöst: ' + (neu + schon) + ' von ' + zeilen.length + ' …';
    }
    st.innerHTML = esc(neu + ' neu, ' + schon + ' schon vorhanden') +
      (fehl.length ? '<br><span style="color:var(--series2);">Nicht aufgelöst: ' + esc(fehl.join(', ')) +
        '. Eine WKN allein reicht nicht – die ISIN oder das Börsenkürzel dazuschreiben.</span>' : '');
    zeichnen();
  }

  /* ----------------------------------------------------------------- Start */
  async function bereit() {
    B = window.Bestand;
    if (!B) return;
    await B.laden();
    zeichnen();

    var k = el('bestandLesen');
    if (k) k.addEventListener('click', einlesen);

    var liste = el('bestandListe');
    if (liste) {
      liste.addEventListener('click', async function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
        var auf = t.closest('[data-bsym]');
        if (auf && window.Explorer && window.Explorer.oeffne) {
          window.Explorer.oeffne(auf.getAttribute('data-bsym'), auf.getAttribute('data-bname'));
          return;
        }
        var weg = t.closest('[data-bweg]');
        if (weg) { await B.entfernen(weg.getAttribute('data-bweg')); zeichnen(); }
      });
    }
    /* Der Signalstand aendert sich mit jedem Scan - eine Minute reicht voellig,
     * gerechnet wird dabei nichts, es wird nur abgelesen. */
    setInterval(zeichnen, 60000);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bereit);
  else bereit();
  window.BestandUI = { zeichnen: zeichnen };
})();
