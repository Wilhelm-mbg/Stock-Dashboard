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

  function el(id) { return document.getElementById(id); }

  /* ---------------------------------------------------------- Signalzeile -
   * 'an' sagt, ob ueberhaupt ein Signal anliegt. Es steht hier und nicht in der
   * Anzeige, weil hier schon entschieden wird, was ein Signal IST - die Gruppierung
   * soll dieselbe Antwort benutzen wie der Text daneben und nicht eine zweite.
   * Die Alternative (k.cls === 'up' abfragen) haette einen CSS-Klassennamen zur
   * Fachbedeutung gemacht: eine Umbenennung im Stylesheet haette dann still die
   * Gruppierung verschoben. */
  function kurzText(k) {
    if (!k) return { txt: 'noch nicht geprüft', cls: 'muted', an: false };
    if (k.ok) return { txt: 'Regel gibt ein Signal', cls: 'up', an: true };
    return { txt: k.grund || 'kein Signal', cls: 'muted', an: false };
  }
  function mittelText(m) {
    if (!m) return { txt: 'noch nicht geprüft', cls: 'muted', an: false };
    var teile = [];
    if (m.momentum) teile.push('Momentum hält' + (m.momentum.richtung < 0 ? ' (short)' : ''));
    if (m.drift) teile.push('Ergebnis-Drift hält' + (m.drift.richtung < 0 ? ' (short)' : ''));
    if (!teile.length) return { txt: 'in keinem Buch', cls: 'muted', an: false };
    return { txt: teile.join(' · '), cls: 'up', an: true };
  }

  /** Die Uebersicht unter "Vermoegen -> Meine Papiere" (Felix, #71). Schlanker als die
   *  Karte auf "Heute": dort geht es um den Signalstand, hier um den Bestand - und hier
   *  steht auch das Uebernahme-Formular. */
  function zeichnenTabelle() {
    var kasten = el('bestandTabelle');
    if (!kasten || !B) return;
    var werte = B.liste();
    if (!werte.length) {
      /* Kein Fernverweis mehr: das Uebernahme-Formular steht seit C2 direkt darunter
       * auf derselben Pille. Ein "geh nach X", waehrend man in X steht, ist genau der
       * Selbstverweis aus Befund P4. */
      kasten.innerHTML = '<div class="empty" style="padding:10px 0;">Noch keine eigenen Papiere. ' +
        'Unten den Auszug der Depotbank einfügen – die ISIN genügt.</div>';
      return;
    }
    var zeilen = werte.map(function (w) {
      var kurs = null;
      if (window.DepotAPI && window.DepotAPI.letzterKurs) {
        var d = window.DepotAPI.letzterKurs(w.sym);
        if (d && d.kurs > 0) kurs = d;
      }
      if (!kurs && window.Dash && window.Dash.quote) {
        var q = window.Dash.quote(w.sym);
        if (q && q.price != null) kurs = { kurs: q.price, pct: q.pct };
      }
      var wert = kurs && w.stueck ? kurs.kurs * w.stueck : null;
      return '<tr><td><b>' + U.esc(w.sym) + '</b><div style="color:var(--muted); font-size:var(--fs-klein);">' +
        U.esc(w.name) + '</div></td>' +
        '<td>' + (w.stueck != null ? U.esc(w.stueck) : '–') + '</td>' +
        '<td>' + (kurs ? U.esc(kurs.kurs.toFixed(2)) + ' $' : '–') + '</td>' +
        '<td>' + (wert != null ? U.esc(Math.round(wert)) + ' $' : '–') + '</td>' +
        '<td>' + (kurs && kurs.pct != null ? (kurs.pct >= 0 ? '+' : '') + U.esc(kurs.pct.toFixed(2)) + ' %' : '–') + '</td>' +
        '<td style="color:var(--muted); font-size:var(--fs-klein);">' + U.esc(w.isin || w.wkn || '') + '</td>' +
        '<td><button class="btn ghost" type="button" data-bweg="' + U.esc(w.sym) + '" ' +
          'style="padding:2px 8px; font-size:var(--fs-klein);">Entfernen</button></td></tr>';
    }).join('');
    /* Eine Summe nur, wenn sie ehrlich ist: fehlt zu einem Papier der Kurs oder die
     * Stueckzahl, waere der Gesamtwert stillschweigend zu klein. */
    var vollstaendig = werte.every(function (w) { return w.stueck != null; });
    kasten.innerHTML = '<table class="tbl"><tr><th>Wert</th><th>Stück</th><th>Kurs</th>' +
      '<th>Wert</th><th>Heute</th><th>ISIN</th><th></th></tr>' + zeilen + '</table>' +
      '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:6px;">' +
      (vollstaendig ? '' : 'Zu mindestens einem Papier fehlt die Stückzahl – deshalb steht hier keine Summe. ') +
      'Diese Papiere werden nicht gehandelt und zählen nicht zum simulierten Depotwert.</div>';
  }

  function zeichnen() {
    var kasten = el('bestandListe');
    zeichnenTabelle();
    if (!kasten || !B) return;
    var werte = B.liste();
    if (!werte.length) {
      kasten.innerHTML = '<div class="empty" style="padding:10px 0;">Noch keine eigenen Papiere eingetragen. ' +
        'Eintragen im Reiter <b>Vermögen → Meine Papiere</b> – der Auszug der Depotbank genügt.</div>';
      return;
    }
    /* Untergliedert nach Signalstand (Felix, #71). Drei Gruppen in EINER Tabelle -
     * nicht drei Tabellen, sonst springen die Spaltenbreiten gegeneinander.
     * Jeder Wert steht in GENAU EINER Gruppe: das Kurzfrist-Signal geht vor, weil es
     * das eilige ist. Dass ein Wert zusaetzlich in einem Buch liegt, steht weiterhin
     * in seiner Mittelfrist-Spalte - es geht also nichts verloren.
     * Sortiert wird nur die ANZEIGE. Es wird nichts gerechnet, nichts gehandelt und
     * keine Reihenfolge als Rangfolge behauptet.
     * data-bsym/-bname/-bweg bleiben unangetastet: der Listener sitzt delegierend auf
     * #bestandListe und ueberlebt jeden innerHTML-Neuaufbau - aber nur so lange. */
    function zeile(w, k, m) {
      return '<tr>' +
        '<td><button type="button" data-bsym="' + U.esc(w.sym) + '" data-bname="' + U.esc(w.name) + '" ' +
          'title="Im Aktien-Explorer öffnen" style="background:none; border:0; padding:0; font:inherit; ' +
          'font-weight:700; color:var(--series); cursor:pointer; text-decoration:underline dotted;">' +
          U.esc(w.sym) + '</button>' +
          '<div style="color:var(--muted); font-size:var(--fs-klein);">' + U.esc(w.name) + '</div></td>' +
        '<td style="white-space:nowrap;">' + (w.stueck != null ? U.esc(w.stueck) : '–') + '</td>' +
        '<td class="' + k.cls + '">' + U.esc(k.txt) + '</td>' +
        '<td class="' + m.cls + '">' + U.esc(m.txt) + '</td>' +
        '<td><button class="btn ghost" type="button" data-bweg="' + U.esc(w.sym) + '" ' +
          'style="padding:2px 8px; font-size:var(--fs-klein);">Entfernen</button></td>' +
        '</tr>';
    }
    var gKurz = [], gMittel = [], gRest = [];
    werte.forEach(function (w) {
      var s2 = B.standVon(w.sym);
      var k = kurzText(s2.kurz), m = mittelText(s2.mittel);
      var z = zeile(w, k, m);
      if (k.an) gKurz.push(z);
      else if (m.an) gMittel.push(z);
      else gRest.push(z);
    });
    /* Leere Gruppen fallen weg: bei drei Papieren waeren sonst zwei Drittel der
     * Anzeige Ueberschriften. */
    function gruppe(titel, zs) {
      if (!zs.length) return '';
      return '<tr><td colspan="5" class="bgrp">' + U.esc(titel) + ' (' + zs.length + ')</td></tr>' + zs.join('');
    }
    kasten.innerHTML = '<table class="tbl"><tr><th>Wert</th><th>Stück</th>' +
      '<th>Kurzfrist</th><th>Mittelfrist</th><th></th></tr>' +
      gruppe('Kurzfrist – die Regel gibt ein Signal', gKurz) +
      gruppe('Mittelfrist – ein Buch hält den Wert', gMittel) +
      gruppe('Ohne Signal', gRest) +
      '</table>';
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
    st.innerHTML = U.esc(neu + ' neu, ' + schon + ' schon vorhanden') +
      (fehl.length ? '<br><span style="color:var(--series2);">Nicht aufgelöst: ' + U.esc(fehl.join(', ')) +
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
    /* Dieselbe Delegation wie fuer die Liste, nur am zweiten Container: Entfernen soll
     * dort gehen, wo die Papiere wohnen, nicht nur auf "Heute". Am Container und nicht
     * am Knopf, weil zeichnenTabelle() den Inhalt bei jedem Takt neu setzt.
     * B.entfernen() sichert selbst und zeichnen() zeichnet beide Ansichten neu - die
     * Loeschung schlaegt also sofort auf "Heute" durch. */
    var tab = el('bestandTabelle');
    if (tab) {
      tab.addEventListener('click', async function (ev) {
        var t = ev.target;
        if (!t || !t.closest) return;
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
  window.BestandUI = { zeichnen: zeichnen, zeichnenTabelle: zeichnenTabelle };
})();
