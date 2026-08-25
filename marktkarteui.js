'use strict';
/* Die Marktkarte, angeschlossen: Stammdaten aus der Datei, Kurse aus dem Netz.
 *
 * ARBEITSTEILUNG, und sie ist Absicht:
 *   LANGSAM  Branche und Aktienanzahl aendern sich im Jahresrhythmus. Sie kommen aus
 *            <Datenordner>/markt/stammdaten.json, die tools/stammdaten-holen.js
 *            neben der App fuellt. Die App fragt NIE selbst bei der SEC an.
 *   SCHNELL  Kurs und Tagesveraenderung kommen bei jeder Aktualisierung frisch ueber
 *            denselben Lader wie der Rest der App (kurse.js).
 *
 * Die Marktkapitalisierung wird deshalb NICHT gespeichert, sondern jedes Mal neu
 * gerechnet: Kurs mal Stueckzahl. Damit ist nicht nur die Farbe live, sondern auch
 * die Flaeche - eine Karte mit den Groessen von gestern waere eine Karte von gestern.
 *
 * WAS SIE NICHT IST: kein Signal, keine Rangliste, keine Empfehlung. Keine
 * Hervorhebung von Ausreissern, keine Sortierung nach "heissestem Sektor". Gemessen
 * ist an dieser Karte nichts - sie zeigt, was heute passiert ist, mehr nicht. */
(function () {
  var U = window.U || {};
  function esc(x) { return U.esc ? U.esc(x) : String(x); }

  /* Werte, deren Stueckzahl die SEC nicht hergibt. Nachgemessen am 25.08.2026:
   * Meta taggt gar keine Aktienanzahl in XBRL (mehrere Gattungen mit einer Achse,
   * die die Schnittstelle nicht aufloest). Ohne diese Zeile fehlt auf einer Karte
   * des US-Marktes ausgerechnet Meta - das faellt jedem sofort auf und macht die
   * ganze Karte unglaubwuerdig.
   * Handgepflegt, mit Datum, und bewusst kurz: was die Quelle liefert, kommt aus der
   * Quelle. Diese Liste ist der Rest, nicht der Regelfall. */
  var ERSATZ_AKTIEN = {
    META: { aktien: 2537000000, stand: '2026-07', sektor: 'Technologie', name: 'Meta Platforms' }
  };

  var stamm = null;          // Inhalt der Stammdatendatei
  var laeuft = false;
  var letzterLauf = 0;
  var taktung = null;

  function anzahlJetzt() {
    var s = document.getElementById('mkAnzahl');
    return s ? parseInt(s.value, 10) || 300 : 300;
  }

  async function stammLaden() {
    if (stamm) return stamm;
    if (!window.api || typeof window.api.marktStammdaten !== 'function') return null;
    var r = await window.api.marktStammdaten();
    if (!r || !r.ok) { stamm = { fehlt: true, grund: (r && r.grund) || 'unbekannt', pfad: r && r.pfad }; return stamm; }
    stamm = r.daten || {};
    return stamm;
  }

  /** Welche Werte kommen ueberhaupt in Frage, und in welcher Reihenfolge?
   *  Der Startkurs aus dem Archiv dient NUR der Vorauswahl - er wird gleich darauf
   *  durch den Live-Kurs ersetzt. Ohne ihn muesste die Karte erst zweitausend Werte
   *  abrufen, bevor sie das erste Kaestchen zeichnen koennte. */
  function auswahl(n) {
    var werte = (stamm && stamm.werte) || {};
    var raus = [], ohneGroesse = 0, adr = 0;
    Object.keys(werte).forEach(function (sym) {
      var e = werte[sym];
      if (!e || !e.sektor) return;
      /* Auslaendische Emittenten fliegen raus: Ihre Stueckzahl sind Stammaktien,
       * gehandelt wird ein ADR, das mehrere davon buendelt. Das Verhaeltnis steht
       * nirgends - mal ADR-Kurs gerechnet waere die Firma um ein Vielfaches zu gross.
       * Lieber nicht zeigen als falsch zeigen. */
      if (e.auslaender) { adr++; return; }
      var aktien = e.aktien > 0 ? e.aktien : (ERSATZ_AKTIEN[sym] && ERSATZ_AKTIEN[sym].aktien);
      if (!(aktien > 0)) { ohneGroesse++; return; }
      raus.push({
        sym: sym, name: e.name || sym, sektor: e.sektor, aktien: aktien,
        ersatz: !(e.aktien > 0),
        vorrang: (e.startKurs > 0 ? e.startKurs : 1) * aktien
      });
    });
    Object.keys(ERSATZ_AKTIEN).forEach(function (sym) {
      if (werte[sym]) return;
      var e = ERSATZ_AKTIEN[sym];
      raus.push({ sym: sym, name: e.name, sektor: e.sektor, aktien: e.aktien, ersatz: true, vorrang: e.aktien });
    });
    raus.sort(function (a, b) { return b.vorrang - a.vorrang; });
    return { liste: raus.slice(0, n), gesamt: raus.length, ohneGroesse: ohneGroesse, adr: adr };
  }

  /** Kurs und Tagesveraenderung. Ein Abruf je Wert liefert beides: Der Chart-Kopf
   *  traegt den aktuellen Kurs UND den Schluss des Vortages. */
  async function kurseHolen(liste, melde) {
    var fertig = 0, idx = 0;
    var K = window.Kurse;
    if (!K || typeof K.hole !== 'function') return 0;
    async function bahn() {
      while (idx < liste.length) {
        var w = liste[idx++];
        try {
          var r = await K.hole(w.sym, { range: '1d', interval: '1d', bereinigt: false, wiederholen: false });
          var m = r && r.meta;
          if (m && m.regularMarketPrice > 0) {
            w.kurs = m.regularMarketPrice;
            var vor = m.chartPreviousClose > 0 ? m.chartPreviousClose : m.previousClose;
            w.pct = vor > 0 ? (w.kurs / vor - 1) * 100 : null;
            w.groesse = w.kurs * w.aktien;
          }
        } catch (e) { /* ein Wert weniger, kein Grund die Karte abzubrechen */ }
        fertig++;
        if (melde && fertig % 25 === 0) melde(fertig, liste.length);
      }
    }
    /* Sechs Bahnen wie bei den Kacheln. Nachgemessen am 25.08.2026: 220 Werte in
     * knapp vier Sekunden, keine einzige Drosselung. Mehr Bahnen bringen wenig und
     * erhoehen nur das Risiko, dass Yahoo dichtmacht. */
    var bahnen = [];
    for (var i = 0; i < 6; i++) bahnen.push(bahn());
    await Promise.all(bahnen);
    return liste.filter(function (w) { return w.groesse > 0; }).length;
  }

  function zeichnen(werte, info) {
    var kasten = document.getElementById('mkKarte');
    if (!kasten) return;
    var b = kasten.clientWidth || 900;
    var h = kasten.clientHeight || 620;
    var karte = window.Marktkarte.baue(werte, b, h, { rand: 3, kopf: 15 });
    var teile = [];
    karte.forEach(function (s) {
      teile.push('<div style="position:absolute; left:' + s.x.toFixed(1) + 'px; top:' + s.y.toFixed(1) +
        'px; width:' + s.b.toFixed(1) + 'px; height:' + s.h.toFixed(1) + 'px; ' +
        'box-sizing:border-box; padding:1px 4px; font-size:var(--fs-klein); color:var(--muted); ' +
        'white-space:nowrap; overflow:hidden; pointer-events:none;">' + esc(s.sektor) + '</div>');
      s.kinder.forEach(function (k) {
        var d = k.daten;
        var f = window.Marktkarte.farbe(d.pct);
        var klein = k.b < 34 || k.h < 22;
        var titel = d.sym + ' · ' + d.name + ' · ' + (d.pct == null ? 'kein Kurs' :
          (d.pct >= 0 ? '+' : '') + d.pct.toFixed(2) + ' %') + (d.ersatz ? ' · Stückzahl handgepflegt' : '');
        teile.push('<div title="' + esc(titel) + '" style="position:absolute; left:' + k.x.toFixed(1) +
          'px; top:' + k.y.toFixed(1) + 'px; width:' + Math.max(0, k.b - 1).toFixed(1) +
          'px; height:' + Math.max(0, k.h - 1).toFixed(1) + 'px; background:rgb(' + f.rgb.join(',') + '); ' +
          'color:' + f.text + '; box-sizing:border-box; overflow:hidden; border-radius:var(--r-klein); ' +
          'display:flex; flex-direction:column; align-items:center; justify-content:center; ' +
          /* Zwei Stufen der Schriftleiter, keine eigenen Zahlen: Die Sperrklinke aus
           * Abschnitt 44 sieht nur nackte Pixelzahlen im Quelltext - eine per
           * Verkettung gebaute waere ihr entgangen. Genau so waechst die Zahl der
           * Groessen wieder nach, gegen die sie gebaut wurde. */
          'font-size:var(' + (k.b > 70 && k.h > 44 ? '--fs-neben' : '--fs-klein') + '); line-height:1.15;">' +
          (klein ? '' : '<b>' + esc(d.sym) + '</b>' +
            (k.h > 30 ? '<span>' + (d.pct == null ? '–' : (d.pct >= 0 ? '+' : '') + d.pct.toFixed(1) + ' %') + '</span>' : '')) +
          '</div>');
      });
    });
    kasten.innerHTML = teile.join('');

    var fuss = document.getElementById('mkFuss');
    if (fuss) {
      fuss.innerHTML =
        '<b>Fläche</b> = Kurs × Aktienanzahl, bei jeder Aktualisierung neu gerechnet. ' +
        '<b>Farbe</b> = Veränderung zum Vortagesschluss, gedeckelt bei ±' + window.Marktkarte.DECKEL + ' %. ' +
        'Gruppiert nach Branche aus dem SIC-Code der SEC.<br>' +
        'Gezeigt: ' + info.gezeichnet + ' von ' + info.gesamt + ' Werten mit Stammdaten. ' +
        (info.adr ? 'Nicht gezeigt: ' + info.adr + ' ausländische Emittenten – ihre Stückzahl sind Stammaktien, ' +
          'gehandelt wird ein ADR aus mehreren davon, und das Verhältnis steht in den Daten nicht. ' : '') +
        (info.ohneGroesse ? info.ohneGroesse + ' ohne Stückzahl in den SEC-Daten. ' : '') +
        '<br>Das ist eine <b>Übersicht</b>, kein Signal: An dieser Karte ist nichts gemessen. ' +
        'Sie sortiert nicht nach „bestem Sektor“ und hebt nichts hervor – das sähe nach einem Befund aus und wäre keiner.';
    }
  }

  /* ---------- Wenn die Stammdaten fehlen ----------
   * Frueher stand hier nur ein Befehl fuer die Kommandozeile. Das war eine Sackgasse
   * fuer jeden, der keine Entwicklungsumgebung hat - genau die, die schon beim Reiter
   * "Messung" eine war. Die Begruendung dafuer war ausserdem schief: Die Regel des
   * Projekts verbietet einen Netzwerkpfad zu KOSTENPFLICHTIGEN Schnittstellen. Die
   * SEC ist kostenlos und braucht keinen Schluessel.
   * Der Befehl bleibt daneben stehen - fuer den Massenlauf ueber das ganze Archiv ist
   * er weiterhin der bessere Weg. */
  function fehlenAnbieten(st) {
    var kasten = document.getElementById('mkKarte');
    var kann = window.api && typeof window.api.marktSecBasis === 'function';
    kasten.innerHTML = '<div style="padding:14px; font-size:var(--fs-neben); line-height:1.65; max-width:76ch;">' +
      '<b>Noch keine Stammdaten.</b> Die Karte braucht je Wert die Branche und die Anzahl ' +
      'ausstehender Aktien – beides kommt von der US-Börsenaufsicht und ändert sich im ' +
      'Jahresrhythmus.<br>' +
      (kann
        ? '<div style="margin:12px 0;"><button class="btn" type="button" id="mkHolen">Jetzt holen</button> ' +
          '<span id="mkHolStatus" role="status" aria-live="polite" style="font-size:var(--fs-neben); color:var(--muted); margin-left:8px;"></span></div>' +
          '<div style="color:var(--muted);">Das dauert einmalig ein bis zwei Minuten: erst drei Sammelabrufe, ' +
          'dann die Kurse für die Rangfolge, dann die Branche für die Werte, die die Karte zeigt. ' +
          'Danach nie wieder – die Datei bleibt liegen.</div>'
        : '<div style="color:var(--muted); margin:12px 0;">Diese Programmfassung kann es noch nicht selbst holen.</div>') +
      '<div style="color:var(--muted); margin-top:10px;">Für das ganze Archiv auf einmal ist das Werkzeug ' +
      'daneben der bessere Weg – es nimmt alle Werte des 60m-Archivs statt nur der gezeigten:<br>' +
      '<code>node tools/stammdaten-holen.js</code>   (ohne Archiv: <code>--alle</code>)</div>' +
      (st && st.grund ? '<div style="color:var(--muted); margin-top:8px; font-size:var(--fs-klein);">' + esc(st.grund) + '</div>' : '') +
      '</div>';
    var k = document.getElementById('mkHolen');
    if (k) k.addEventListener('click', holen);
  }

  /** Der Abruf aus der App. Die Arbeitsteilung ist dieselbe wie im Werkzeug, nur
   *  laeuft die Rangfolge hier ueber echte Kurse: Der Hauptprozess holt bei der SEC,
   *  der Renderer holt die Kurse, und erst danach steht fest, welche Werte ueberhaupt
   *  eine Branche brauchen. Das spart den teuren Teil fuer tausende Firmen, die auf
   *  der Karte ohnehin nie erscheinen. */
  async function holen() {
    var k = document.getElementById('mkHolen');
    var hs = document.getElementById('mkHolStatus');
    function sagH(t) { if (hs) hs.textContent = t; }
    if (k) k.disabled = true;
    try {
      sagH('Sammelabruf bei der SEC …');
      var b = await window.api.marktSecBasis();
      if (!b || !b.ok) { sagH('Fehlgeschlagen: ' + ((b && b.grund) || 'unbekannt')); if (k) k.disabled = false; return; }
      var kand = b.kandidaten || [];
      if (!kand.length) { sagH('Die SEC lieferte keine Stückzahlen.'); if (k) k.disabled = false; return; }

      sagH(kand.length + ' Firmen mit Stückzahl. Kurse für die Rangfolge …');
      var liste = kand.map(function (x) { return { sym: x.sym, aktien: x.aktien }; });
      await kurseHolen(liste, function (f, g) { sagH('Kurse: ' + f + ' von ' + g + ' …'); });
      var mitKurs = liste.filter(function (w) { return w.groesse > 0; })
        .sort(function (a, c) { return c.groesse - a.groesse; });
      var wieViele = Math.min(Math.max(anzahlJetzt(), 100) * 2, 900);
      var top = mitKurs.slice(0, wieViele).map(function (w) { return w.sym; });
      if (!top.length) { sagH('Keine Kurse bekommen – Netz?'); if (k) k.disabled = false; return; }

      sagH('Branche für ' + top.length + ' Werte …');
      var r = await window.api.marktSecBranchen(top);
      if (!r || !r.ok) { sagH('Fehlgeschlagen: ' + ((r && r.grund) || 'unbekannt')); if (k) k.disabled = false; return; }
      stamm = r.daten;
      sagH('Fertig: ' + r.mitGroesse + ' Werte mit Größe.');
      await laden();
    } catch (e) {
      sagH('Fehler: ' + (e && e.message || e));
      if (k) k.disabled = false;
    }
  }

  async function laden() {
    if (laeuft) return;
    laeuft = true;
    var stand = document.getElementById('mkStand');
    var kasten = document.getElementById('mkKarte');
    function sag(t) { if (stand) stand.textContent = t; }
    try {
      sag('Stammdaten lesen …');
      var st = await stammLaden();
      if (!st || st.fehlt) { fehlenAnbieten(st); sag(''); return; }
      var a = auswahl(anzahlJetzt());
      if (!a.liste.length) {
        kasten.innerHTML = '<div style="padding:14px;">Keine Werte mit Branche und Stückzahl gefunden.</div>';
        sag('');
        return;
      }
      sag('Kurse holen: 0 von ' + a.liste.length + ' …');
      var n = await kurseHolen(a.liste, function (f, g) { sag('Kurse holen: ' + f + ' von ' + g + ' …'); });
      var mitKurs = a.liste.filter(function (w) { return w.groesse > 0; });
      zeichnen(mitKurs, { gezeichnet: n, gesamt: a.gesamt, adr: a.adr, ohneGroesse: a.ohneGroesse });
      letzterLauf = Date.now();
      sag('Stand: ' + new Date(letzterLauf).toLocaleTimeString('de-DE'));
    } catch (e) {
      sag('Fehler: ' + (e && e.message || e));
    } finally { laeuft = false; }
  }

  function taktenAn() {
    if (taktung) return;
    /* Dieselbe Taktung wie die Kacheln: eine Minute waehrend des US-Handels, sonst
     * fuenf. Und nur solange der Reiter offen ist - im Hintergrund hunderte Kurse zu
     * ziehen waere Verschwendung und ein guter Weg, gedrosselt zu werden. */
    taktung = setInterval(function () {
      var t = document.getElementById('tab-marktkarte');
      if (!t || !t.classList.contains('active')) return;
      var offen = typeof window.__boersenPhaseOffen === 'function' ? window.__boersenPhaseOffen() : true;
      var abstand = offen ? 60000 : 300000;
      if (Date.now() - letzterLauf >= abstand) laden();
    }, 20000);
  }

  if (window.api && typeof window.api.onMarktSecFortschritt === 'function') {
    window.api.onMarktSecFortschritt(function (d) {
      var hs = document.getElementById('mkHolStatus');
      if (!hs || !d) return;
      hs.textContent = (d.art === 'branche' ? 'Branche' : 'Stückzahl nachholen') +
        ': ' + d.fertig + ' von ' + d.gesamt + ' …';
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    var neu = document.getElementById('mkNeu');
    if (neu) neu.addEventListener('click', laden);
    var anz = document.getElementById('mkAnzahl');
    if (anz) anz.addEventListener('change', laden);
    document.addEventListener('tab-changed', function (ev) {
      if (ev.detail !== 'marktkarte') return;
      taktenAn();
      if (!letzterLauf) laden();
    });
  });
  window.__marktkarteLaden = laden;
})();
