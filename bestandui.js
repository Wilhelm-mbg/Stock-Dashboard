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

  /* ---- Jahresbasis fuer "seit Jahresbeginn" (#83) ----
   * Die Stundenkerzen des Depots reichen dafuer nicht - sie decken wenige Tage ab.
   * Also einmal je Papier eine Tagesreihe holen und den letzten Schluss des
   * VORJAHRES merken; nicht den ersten Kurs des neuen Jahres, denn der
   * Jahresauftakt gehoert schon zur Bewegung.
   * BEREINIGT, und das ist keine Formsache: ueber ein Jahr faellt sonst jeder
   * Aktiensplit als scheinbarer Absturz auf - ein 4:1-Split saehe aus wie -75 %.
   * Einmal je Papier und Tag, nicht bei jedem 60-Sekunden-Takt. Findet sich keine
   * Basis, bleibt die Zelle leer - eine erfundene Zahl waere schlimmer. */
  var JAHR = {};
  function heuteTag() { return new Date().toISOString().slice(0, 10); }
  async function jahresbasenLaden() {
    if (!B || !window.Kurse) return;
    var offen = B.liste().filter(function (w) {
      return !JAHR[w.sym] || JAHR[w.sym].tag !== heuteTag();
    });
    if (!offen.length) return;
    var jahr = new Date().getUTCFullYear();
    for (var i = 0; i < offen.length; i++) {
      var sym = offen[i].sym, basis = null;
      try {
        var kd = await window.Kurse.hole(sym, { range: '1y', interval: '1d', bereinigt: true });
        var bars = kd && kd.bars ? window.Kurse.reihe(kd.bars) : null;
        if (bars && bars.length) {
          for (var j = bars.length - 1; j >= 0; j--) {
            if (new Date(bars[j][0]).getUTCFullYear() < jahr) { basis = bars[j][1]; break; }
          }
        }
      } catch (e) { /* ohne Reihe bleibt das Papier ohne Zahl - nie geraten */ }
      JAHR[sym] = { basis: basis > 0 ? basis : null, tag: heuteTag() };
    }
    zeichnen();
  }

  /* ---------------------------------------------------------- Signalzeile -
   * Bis zum 26.08.2026 gab es hier ein Feld 'an' - es trug die Entscheidung, ob ein
   * Signal anliegt, fuer die Gruppierung der Heute-Liste. Die Liste ist mit #89
   * entfallen, die Gruppierung mit ihr; das Feld hat seither niemand mehr gelesen.
   * Ein Rueckgabewert ohne Leser ist ein toter Schalter, deshalb ist es weg. Was
   * bleibt, ist cls - es faerbt die beiden Signalspalten der Bestandstabelle. */
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

  /** Die Uebersicht unter "Vermoegen -> Meine Papiere" (Felix, #71). Schlanker als die
   *  Karte auf "Heute": dort geht es um den Signalstand, hier um den Bestand - und hier
   *  steht auch das Uebernahme-Formular. */
  function zeichnenTabelle() {
    var kasten = el('bestandTabelle');
    if (!kasten || !B) return;
    var werte = B.liste();
    if (!werte.length) {
      /* Kein Fernverweis: das Uebernahme-Formular steht direkt darunter. */
      kasten.innerHTML = '<div class="empty" style="padding:10px 0;"><span>Noch keine eigenen Papiere. ' +
        'Unten den Auszug der Depotbank einfügen – die ISIN genügt.</span></div>';
      return;
    }
    var sumWert = 0, sumHeute = 0, sumJahrJetzt = 0, sumJahrBasis = 0, alleKurse = true;
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
      if (wert == null) alleKurse = false; else sumWert += wert;
      /* Die Tagesveraenderung wird in GELD summiert, nicht in Prozent: Prozentzahlen
       * verschiedener Papiere lassen sich nicht addieren. */
      if (wert != null && kurs.pct != null) sumHeute += wert - wert / (1 + kurs.pct / 100);

      var jb = JAHR[w.sym] && JAHR[w.sym].basis;
      var jPct = (jb > 0 && kurs) ? (kurs.kurs / jb - 1) * 100 : null;
      if (jb > 0 && kurs && w.stueck != null) {
        sumJahrBasis += jb * w.stueck;
        sumJahrJetzt += kurs.kurs * w.stueck;
      }

      /* Der Signalstand zieht aus der entfallenen Heute-Liste hierher (#89). Dieselbe
       * Quelle wie dort - kurzText/mittelText, nicht eine zweite Lesart. */
      var st = B.standVon(w.sym);
      var k = kurzText(st.kurz), m = mittelText(st.mittel);

      return '<tr><td><button type="button" data-bsym="' + U.esc(w.sym) + '" data-bname="' + U.esc(w.name) + '" ' +
          'title="Im Aktien-Explorer öffnen" style="background:none; border:0; padding:0; font:inherit; ' +
          'font-weight:700; color:var(--series); cursor:pointer; text-decoration:underline dotted;">' +
          U.esc(w.sym) + '</button>' +
          '<div style="color:var(--muted); font-size:var(--fs-klein);">' + U.esc(w.name) + '</div></td>' +
        '<td>' + (w.stueck != null ? U.esc(w.stueck) : '–') + '</td>' +
        '<td>' + (kurs ? U.esc(kurs.kurs.toFixed(2)) + ' $' : '–') + '</td>' +
        '<td>' + (wert != null ? U.esc(Math.round(wert)) + ' $' : '–') + '</td>' +
        '<td class="' + (kurs && kurs.pct != null && kurs.pct >= 0 ? 'up' : 'muted') + '">' +
          (kurs && kurs.pct != null ? (kurs.pct >= 0 ? '+' : '') + U.esc(kurs.pct.toFixed(2)) + ' %' : '–') + '</td>' +
        '<td class="' + (jPct != null && jPct >= 0 ? 'up' : 'muted') + '">' +
          (jPct != null ? (jPct >= 0 ? '+' : '') + U.esc(jPct.toFixed(1)) + ' %' : '–') + '</td>' +
        '<td class="' + k.cls + '">' + U.esc(k.txt) + '</td>' +
        '<td class="' + m.cls + '">' + U.esc(m.txt) + '</td>' +
        '<td style="color:var(--muted); font-size:var(--fs-klein);">' + U.esc(w.isin || w.wkn || '') + '</td>' +
        '<td><button class="btn ghost" type="button" data-bweg="' + U.esc(w.sym) + '" ' +
          'style="padding:2px 8px; font-size:var(--fs-klein);">Entfernen</button></td></tr>';
    }).join('');

    /* Eine Summe nur, wenn sie ehrlich ist: fehlt zu einem Papier die Stueckzahl oder
     * der Kurs, waere der Gesamtwert stillschweigend zu klein. Lieber keine Zahl als
     * eine, die zu wenig zeigt. */
    var vollstaendig = werte.every(function (w) { return w.stueck != null; }) && alleKurse;
    var jPctSum = sumJahrBasis > 0 ? (sumJahrJetzt / sumJahrBasis - 1) * 100 : null;
    var summe = vollstaendig
      ? '<tr class="summe"><td>Zusammen</td><td></td><td></td>' +
          '<td>' + U.esc(Math.round(sumWert)) + ' $</td>' +
          '<td class="' + (sumHeute >= 0 ? 'up' : 'muted') + '">' +
            (sumHeute >= 0 ? '+' : '') + U.esc(Math.round(sumHeute)) + ' $</td>' +
          '<td class="' + (jPctSum != null && jPctSum >= 0 ? 'up' : 'muted') + '">' +
            (jPctSum != null ? (jPctSum >= 0 ? '+' : '') + U.esc(jPctSum.toFixed(1)) + ' %' : '–') + '</td>' +
          '<td></td><td></td><td></td><td></td></tr>'
      : '';

    kasten.innerHTML = '<table class="tbl"><tr><th>Wert</th><th>Stück</th><th>Kurs</th>' +
      '<th>Wert</th><th>Heute</th><th>seit Jahresbeginn</th>' +
      '<th>Kurzfrist</th><th>Mittelfrist</th><th>ISIN</th><th></th></tr>' + zeilen + summe + '</table>' +
      '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:6px;">' +
      (vollstaendig ? '' : 'Zu mindestens einem Papier fehlt die Stückzahl oder der Kurs – deshalb steht hier keine Summe. ') +
      'Diese Papiere werden nicht gehandelt und zählen nicht zum simulierten Depotwert.</div>';
  }

  /* Seit dem 26.08.2026 gibt es nur noch EINE Ansicht: die Tabelle unter
   * Vermoegen -> Meine Papiere. Die Signalliste unter "Heute" ist entfallen
   * (Wilhelms Entscheid zu #89, der #83 in diesem Punkt ueberschreibt); ihr Inhalt
   * steht jetzt als zwei Spalten in der Tabelle.
   * zeichnen() bleibt der oeffentliche Name - alle Aufrufer haengen daran. */
  function zeichnen() { zeichnenTabelle(); }

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
    jahresbasenLaden();
  }

  /* ----------------------------------------------------------------- Start */
  async function bereit() {
    B = window.Bestand;
    if (!B) return;
    await B.laden();
    zeichnen();
    jahresbasenLaden();

    var k = el('bestandLesen');
    if (k) k.addEventListener('click', einlesen);

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
        /* Absprung in den Aktien-Explorer (#83). Er hing bis zum 26.08. an der
         * Signalliste unter "Heute"; mit ihr waere er ersatzlos verschwunden. */
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
  window.BestandUI = { zeichnen: zeichnen, zeichnenTabelle: zeichnenTabelle };
})();
