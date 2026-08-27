'use strict';
/* ================= Messband: was die Messung zur laufenden Regel sagt =================
 *
 * WOZU. Der Belegstand einer Regel stand bisher nur im Reiter "Regeln" (#regelKopf) und
 * im Reiter "Messung". Wer im Depot auf seine Positionen sieht, sah nicht, worauf sie
 * eigentlich beruhen. Wilhelms Bitte am 25.08.2026: "damit ich es nachvollziehen kann".
 *
 * WARUM EIN EIGENES MODUL. depot.js und index.html werden gerade zerlegt (Struktur-Plan
 * Stufe E). Ein Band, das sich SELBST einhaengt, braucht dort keine Zeile - nur das
 * script-Tag. Weniger Fussabdruck in fremden Dateien heisst weniger Kollision.
 *
 * WAS ES ANZEIGT UND WAS NICHT. Es rechnet NICHTS (Regel D2): jede Zahl kommt aus einem
 * Protokoll der Messmaschine. Und es zeigt bewusst DREI Dinge, die man zusammen lesen
 * muss, weil jede einzeln in die Irre fuehrt:
 *   1. Das Urteil - gruen nur bei "bestaetigt", nie bei etwas, das damit nur anfaengt.
 *   2. Den Ueberschuss je Signal UND die Kostenhuerde daneben. Eine Kante unter der
 *      Huerde ist keine, auch wenn sie positiv ist.
 *   3. Die AUFLOESUNG (delta80): die kleinste wahre Kante, die dieser Lauf mit 80 %
 *      Wahrscheinlichkeit gefunden haette. Ohne sie liest sich "nicht entscheidbar" wie
 *      "kein Effekt" - und meistens heisst es "die Datenmenge kann die Frage nicht
 *      beantworten". Am 25.08. waren 34 von 38 Messungen fuer eine handelbare Kante
 *      strukturell blind, ohne dass es irgendwo stand.
 * Dazu die Selbstpruefung: ein Placebo ohne Kursbezug, dessen richtige Antwort null ist.
 * Schlaegt er aus, ist jede Zahl daneben um diesen Betrag verschoben.
 */
(function () {
  /* FESTE REFERENZ AUF DEN BASISWERT - noch nicht die Huerde des gehandelten
   * Produkts. Das Scoreboard benutzt seit 6c790c8 DepotAPI.kostenHuerde(); hier
   * steht die Zahl fest. In der Voreinstellung ergeben beide ZUFAELLIG 0,100 Pp,
   * deshalb faellt der Unterschied niemandem auf - mit umgestelltem Produkt driften
   * sie auseinander (Auditor 27.08.: 0,100 gegen 0,0665).
   * #105 ist Wilhelms Entscheidung: soll hier die LIVE-Huerde stehen oder eine
   * ausdrueckliche feste Referenz? Beides ist vertretbar, nur nicht zwei Zahlen
   * unter demselben Namen. Bis dahin bleibt es fest - aber ueber huerdePp(), damit
   * das Umschalten eine Zeile ist und nicht eine Suche. */
  var HUERDE_PP = 0.10;          // je Umlauf auf dem Basiswert, am Demo-Konto gemessen (0,104 %)
  function huerdePp() {
    return (window.U && window.U.dez) ? window.U.dez(HUERDE_PP, 2) : HUERDE_PP.toFixed(2);
  }
  var Z80 = 0.8416212;

  /* KEINE EIGENE ESC-KOPIE. Das Programm hat genau eine Escaping-Funktion (U.esc in
   * app-shell.js), und test-v6.js haelt das mit einer Sperrklinke fest. Der Grund steht
   * dort: vier Kopien hiessen vier Orte, an denen die naechste Korrektur nur zu einem
   * Viertel ankommt - eine davon hatte String(s) statt String(s == null ? '' : s) und
   * machte aus einem fehlenden Feld das sichtbare Wort "undefined".
   * Dies ist ein blosser Vorspann, kein zweiter Ort: faellt U weg, wird nicht still
   * ungeprueft ausgegeben, sondern gar nichts. */
  function esc(s) {
    return (window.U && window.U.esc) ? window.U.esc(s) : '';
  }
  /* Deutsche Schreibweise und ein echtes Minuszeichen (#108, Auditor 27.08.).
   * Vorher: "netto -0.079" - englischer Punkt und ein BINDESTRICH als Minus, direkt
   * neben "100.000,00 $" im selben Blickfeld. Dieselbe Substanz wie das reparierte
   * #94. U.dez ist die eine Stelle dafuer; das Vorzeichen kommt hier davor, weil
   * U.dez das Plus nicht kennt. */
  function urteilKlartext(u) {
    return (window.U && window.U.urteilText) ? window.U.urteilText(u) : String(u == null ? "?" : u);
  }
  function pp(x, d) {
    if (x == null || !isFinite(x)) return '–';
    var s = (window.U && window.U.dez) ? window.U.dez(Math.abs(x), d == null ? 3 : d)
      : Math.abs(x).toFixed(d == null ? 3 : d);
    /* Das echte Minuszeichen (U+2212), nicht der Bindestrich - und literal im
     * Quelltext statt als Escape, damit man beim Lesen sieht, was dasteht. */
    return (x < 0 ? '\u2212' : '+') + s;
  }

  /* Der laufende Auslöser - dieselbe Quelle, aus der der Handel ihn nimmt. */
  function modus() {
    var D = window.__D ? window.__D() : null;
    return (D && D.intraday && D.intraday.mode) || null;
  }

  /* Aus einem Protokoll die Variante mit dem staerksten Bestaetigungs-t - dieselbe Wahl
   * wie in depot.js, damit im Depot und in den Regeln nicht zwei Zahlen stehen. */
  function ausProtokoll(j) {
    if (!j || !j.strategie || !Array.isArray(j.ergebnisse)) return null;
    var beste = null, besterT = -Infinity, idx = 0;
    j.ergebnisse.forEach(function (e, i) {
      var u = e && e.bestaetigung && e.bestaetigung.ueberschuss;
      if (!u || u.jeSignal == null || !isFinite(u.jeSignal)) return;
      var tw = isFinite(u.t) ? u.t : -Infinity;
      if (tw > besterT) { besterT = tw; beste = u; idx = i; }
    });
    if (!beste) return null;
    var schwelle = j.schwelle || 2.5;
    return {
      key: j.strategie.key,
      datum: (j.gemessenAm || '').slice(0, 10),
      urteil: (j.urteile || [])[idx] || j.bestesUrteil || 'unbekannt',
      varianten: j.ergebnisse.length,
      jeSignalPp: beste.jeSignal * 100,
      tagesmittelPp: beste.tagesmittel * 100,
      t: beste.t,
      mdePp: beste.mde != null ? beste.mde * 100 : null,
      delta80Pp: beste.se != null ? (schwelle + Z80) * beste.se * 100 : null,
      tage: beste.tage, signale: beste.signale,
      einstieg: j.strategie.einstiegsZeitpunkt || 'schlusskerze',
      placebo: j.placebo || null
    };
  }

  async function laden() {
    if (!window.api || !window.api.readProtokolle) return null;
    var r = null;
    try { r = await window.api.readProtokolle(); } catch (e) { return null; }
    if (!r || !r.ok || !Array.isArray(r.protokolle)) return null;
    var m = modus(); if (!m) return null;
    /* Nur das juengste Protokoll dieser Kennung. */
    var treffer = r.protokolle
      .filter(function (p) { return p.protokoll && p.protokoll.strategie && p.protokoll.strategie.key === m; })
      .sort(function (a, b) { return (b.mtime || 0) - (a.mtime || 0); })[0];
    return treffer ? ausProtokoll(treffer.protokoll) : null;
  }

  function farbe(urteil) {
    /* Gruen gibt es nur fuer den Schluessel, der GENAU "bestaetigt" heisst. Alles, was
     * damit nur anfaengt, ist ein Urteil mit Vorbehalt - und ein Vorbehalt ist kein
     * gruenes Licht. Dieselbe Regel wie im Scoreboard. */
    if (urteil === 'bestaetigt') return 'var(--up)';
    if (urteil === 'widerlegt') return 'var(--down)';
    return 'var(--warn, var(--series2))';
  }

  function bau(k) {
    if (!k) {
      return '<div style="color:var(--muted); font-size:var(--fs-neben);">' +
        'Für den laufenden Auslöser liegt <b>keine Messung</b> vor. Was hier gehandelt wird, ' +
        'beruht damit auf keiner Zahl.</div>';
    }
    var netto = k.jeSignalPp - HUERDE_PP;
    var belegt = k.urteil === 'bestaetigt';

    /* Die Auflösung ist der Satz, der am haeufigsten fehlt. */
    var aufl = '';
    if (k.delta80Pp != null) {
      var blind = k.delta80Pp > HUERDE_PP;
      aufl = '<div style="margin-top:6px; font-size:var(--fs-neben); color:' +
        (blind ? 'var(--warn, var(--series2))' : 'var(--ink-2)') + ';">' +
        '<b>Auflösung:</b> Dieser Lauf hätte eine echte Kante erst ab <b>' + pp(k.delta80Pp) +
        ' Pp</b> mit 80 % Wahrscheinlichkeit gefunden. ' +
        (blind
          ? 'Das ist <b>mehr als die Kostenhürde</b> von ' + HUERDE_PP.toFixed(2) +
            ' Pp – eine handelbare Kante hätte er also gar nicht sehen können. „Nicht ' +
            'entscheidbar“ heißt hier: zu wenig Daten, nicht „kein Effekt“.'
          : 'Das liegt unter der Kostenhürde – eine handelbare Kante wäre sichtbar gewesen.') +
        '</div>';
    }

    /* Die Selbstpruefung. */
    var sp = '';
    if (k.placebo && k.placebo.tagesmittel != null && k.placebo.mde != null) {
      var ok = Math.abs(k.placebo.tagesmittel) <= k.placebo.mde;
      sp = '<div style="margin-top:4px; font-size:var(--fs-neben); color:' +
        (ok ? 'var(--muted)' : 'var(--down)') + ';"><b>Selbstprüfung:</b> ' +
        (ok ? 'bestanden' : 'FEHLGESCHLAGEN') + ' – ein Signal ohne jeden Kursbezug ergab ' +
        pp(k.placebo.tagesmittel * 100, 4) + ' Pp (richtige Antwort: null, Auflösung ' +
        (k.placebo.mde * 100).toFixed(4) + ').' +
        (ok ? '' : ' <b>Jede Zahl hier ist um diesen Betrag verschoben.</b>') + '</div>';
    } else {
      sp = '<div style="margin-top:4px; font-size:var(--fs-neben); color:var(--muted);">' +
        '<b>Selbstprüfung:</b> keine – diese Messung stammt aus der Zeit davor. Ihr Nullpunkt ist ungeprüft.</div>';
    }

    return '' +
      '<div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">' +
        /* Klartext statt rohem Schluessel (#106). urteilText liegt seit dem
         * 26.08. in app-shell.js; hier stand bis zum 27.08. der Schluessel. */
        '<b style="color:' + farbe(k.urteil) + '; font-size:var(--fs-text);">' + esc(urteilKlartext(k.urteil)) + '</b>' +
        '<span style="color:var(--muted); font-size:var(--fs-neben);">' + esc(k.key) +
          ' · gemessen ' + esc(k.datum) +
          (k.varianten > 1 ? ' · beste von ' + k.varianten + ' Varianten' : '') +
          ' · Einstieg ' + esc(k.einstieg) + '</span>' +
      '</div>' +
      '<div style="margin-top:6px; font-size:var(--fs-neben);">' +
        'Überschuss je Signal <b>' + pp(k.jeSignalPp) + ' Pp</b>, Kostenhürde ' +
        /* #105 wartet auf Wilhelms Entscheid: feste Referenz oder Live-Huerde des
         * gehandelten Produkts. Die Zahl steht deshalb weiter fest - aber sie geht
         * jetzt durch huerdePp(), damit ein Umschalten EINE Zeile ist. */
        huerdePp() + ' Pp → <b style="color:' +
        (belegt && netto > 0 ? 'var(--up)' : 'var(--warn, var(--series2))') + ';">netto ' +
        pp(netto) + ' Pp</b>' +
        ' · t = ' + (k.t == null ? '–' : k.t.toFixed(2)) +
        ' · ' + (k.tage || 0) + ' Tage / ' + (k.signale || 0) + ' Signale' +
      '</div>' +
      (belegt ? '' :
        '<div style="margin-top:4px; font-size:var(--fs-neben); color:var(--warn, var(--series2));">' +
        'Das Urteil lautet <b>' + esc(urteilKlartext(k.urteil)) + '</b>. Diese Zahl ist <b>kein belegter ' +
        'Vorsprung</b> – auch dann nicht, wenn sie positiv ist.</div>') +
      aufl + sp;
  }

  function huelle() {
    var vorhanden = document.getElementById('messband');
    if (vorhanden) return vorhanden;
    /* Einhaengen ohne index.html anzufassen: ueber den ersten Unterbereich des
     * Depot-Reiters. Fehlt er, passiert nichts - das Band ist Zusatz, kein Muss. */
    var ziel = document.getElementById('sub-depot');
    if (!ziel) return null;
    var d = document.createElement('div');
    d.id = 'messband';
    d.className = 'panel';
    d.style.cssText = 'margin-bottom:10px;';
    d.innerHTML = '<div style="color:var(--muted); font-size:var(--fs-neben);">Messung wird geladen …</div>';
    ziel.insertBefore(d, ziel.firstChild);
    return d;
  }

  async function zeichnen() {
    var el = huelle(); if (!el) return;
    var k = await laden();
    el.innerHTML =
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:6px;">' +
      'Was die Messmaschine zur laufenden Regel sagt · <b>reine Anzeige</b>, hier wird nichts gerechnet' +
      '</div>' + bau(k);
  }

  document.addEventListener('DOMContentLoaded', function () {
    zeichnen();
    /* Neu zeichnen, wenn der Auslöser wechselt - sonst steht im Depot die Messung einer
     * Regel, die gar nicht mehr läuft. */
    var letzter = null;
    setInterval(function () {
      var m = modus();
      if (m !== letzter) { letzter = m; zeichnen(); }
    }, 5000);
  });

  window.Messband = { zeichnen: zeichnen };
})();
