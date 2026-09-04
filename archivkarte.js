'use strict';
/* DIE KURSARCHIV-KARTE - zeigt, ob die App wirklich sammelt.
 *
 * Wilhelms Auftrag hatte einen eigenen Punkt dafuer: "Sichtbar machen, dass
 * gesammelt wird - und ob es klappt." Der Grund steht in der Geschichte dieses
 * Projekts. Das Stundenarchiv stand zwei Tage still, ohne dass es jemand merkte,
 * weil der Lauf "Nichts zu tun" meldete und mit Erfolg ausging. Am Abend des
 * 26.08.2026 starben drei Abrufe und liessen halbfertige Archive zurueck; von
 * aussen sah alles gesund aus. Eine Anzeige, die nur "laeuft" sagt, waere die
 * naechste Verkleidung derselben Stille.
 *
 * SEIT STUFE 4 DES OBERFLAECHEN-UMBAUS (03.09.2026) ist es EINE GRAFIK statt einer
 * Tabelle. Wilhelms Vorgabe vom 02.09.: Backtest und Kursarchiv "wenig bis gar
 * nicht" sichtbar - hoechstens eine Grafik, wie das Archiv aussieht und wie
 * vollstaendig es ist. Die sechs Spalten waren fuer die taegliche Nutzung zu viel;
 * geblieben ist je Aufloesung ein Balken ueber die letzten 60 Handelstage.
 *
 * Der Balken ist kein Fuellstand, sondern eine KARTE: eine Zelle je Handelstag,
 * links der aelteste, rechts der zuletzt abgeschlossene. Voll heisst gesammelt,
 * halb heisst lueckenhaft, leer heisst nichts da - eine Kerbe mittendrin ist damit
 * sichtbar, und genau die verschwindet in jeder Prozentzahl. Die Zahlen kommen aus
 * archiv-abdeckung (main.js) und sammler-stand; keine einzige steht im Markup.
 *
 * Geschoent wird weiter nichts: wie viele Werte im Archiv liegen, wie viele davon
 * angesehen wurden, wie alt die juengste Kerze ist - und, wenn es soweit ist, der
 * Satz, den niemand hoeren will: wie viele Tage unwiederbringlich weg sind.
 *
 * Diese Datei zeigt und stoesst an. Sie misst nichts und handelt nicht.
 */
(function (root) {
  var U = root.U || { esc: function (s) { return String(s == null ? '' : s); } };
  var api = root.api;

  var LETZTER = null;
  /* Die Abdeckung kommt aus einem EIGENEN Aufruf und wird gemerkt: waehrend eines
   * Laufs funkt main.js alle zehn Werte einen Stand ans Fenster, und ein Dateilesen
   * in diesem Takt waere eine Anzeige, die das Sammeln ausbremst. */
  var LETZTE_ABDECKUNG = null;
  var laeuftAnfrage = false;

  function el(id) { return document.getElementById(id); }

  function tagText(tag) {
    if (!tag) return 'noch nie';
    var heute = new Date().toISOString().slice(0, 10);
    if (tag === heute) return 'heute';
    var d = Math.round((Date.parse(heute + 'T00:00:00Z') - Date.parse(tag + 'T00:00:00Z')) / 86400000);
    if (d === 1) return 'gestern';
    return 'vor ' + d + ' Tagen (' + tag + ')';
  }

  /* F11 der UI-QS (04.09.2026): Hier stand in JEDER der fuenf Zeilen "juengste Kerze
   * vor 1 Minuten" - die haeufigste Anzeige ueberhaupt, denn eine frische Kerze ist
   * unter einer Minute alt und Math.max(1, ...) macht daraus die 1. Deutsch braucht
   * fuer 1 den Singular; und eine Nachkommastelle wird hier mit Komma geschrieben,
   * nicht mit Punkt (1.5 Stunden war englische Schreibweise in deutschem Text). */
  function menge(zahl, einzahl, mehrzahl) {
    return String(zahl).replace('.', ',') + ' ' + (zahl === 1 ? einzahl : mehrzahl);
  }
  function mengeText(zahl, einzahl, mehrzahl) { return 'vor ' + menge(zahl, einzahl, mehrzahl); }

  function alterText(ms) {
    if (ms == null) return '–';
    var std = (Date.now() - ms) / 3600000;
    if (std < 1) return mengeText(Math.max(1, Math.round(std * 60)), 'Minute', 'Minuten');
    if (std < 48) return mengeText(Number(std.toFixed(1)), 'Stunde', 'Stunden');
    return mengeText(Number((std / 24).toFixed(1)), 'Tag', 'Tagen');
  }

  /* 60m und 1d kamen am 27.08. dazu: die App holt sie seither selbst, nachdem die
   * naechtlichen Werkzeuge geloescht wurden. Ohne Eintrag stuende hier die rohe
   * Kennung ("60m") - lesbar, aber nicht Deutsch. */
  var NAME = { '1m': '1 Minute', '5m': '5 Minuten', '15m': '15 Minuten',
               '60m': '1 Stunde', '1d': '1 Tag' };

  /* ================= DIE GRAFIK =================
   * Eine Zeile je Aufloesung: Name, Balken, Zahl. Reines SVG - dieselbe Bauart wie
   * die Kacheln, kein neuer Zeichner. drawLines() aus chart.js kann es nicht: es
   * zeichnet Zeitreihen mit Achsen, hier geht es um sechzig Kaestchen.
   *
   * preserveAspectRatio="none" mit fester viewBox: der Balken zieht sich in die
   * Breite, ohne dass die Zellen ihre Hoehe aendern. */
  var VB_BREITE = 600, VB_HOEHE = 13;

  function zellenFarbe(anteil, vollAb) {
    if (anteil >= vollAb) return 'var(--up)';       // gesammelt
    if (anteil > 0) return 'var(--warn)';           // lueckenhaft: nur ein Teil der Reihen
    return 'var(--grid)';                           // nichts da - die Kerbe
  }

  /* Derselbe Satz fuer Auge und Vorlesehilfe. Zwei getrennte Formulierungen waeren
   * zwei Wahrheiten - und die vorgelesene wuerde als erste falsch. */
  function balkenText(r, ab) {
    var name = NAME[r.intervall] || r.intervall;
    if (r.grund) return name + ': ' + r.grund;
    if (!r.angesehen) return name + ': keine Reihe angesehen';
    return name + ': ' + r.vollTage + ' von ' + ab.tage.length + ' Handelstagen gesammelt, ' +
      r.teilTage + ' lueckenhaft, ' + (ab.tage.length - r.vollTage - r.teilTage) + ' leer';
  }

  function balkenSvg(r, ab) {
    var n = ab.tage.length || 1;
    var breite = VB_BREITE / n;
    var s = '<svg class="arch-balken" viewBox="0 0 ' + VB_BREITE + ' ' + VB_HOEHE + '"' +
      ' preserveAspectRatio="none" role="img" aria-label="' + U.esc(balkenText(r, ab)) + '">';
    /* Der Untergrund zuerst: ohne ihn saehe ein leeres Archiv aus wie gar keine
     * Grafik - und "nichts gesammelt" ist eine Aussage, kein Fehlen. */
    s += '<rect x="0" y="0" width="' + VB_BREITE + '" height="' + VB_HOEHE + '" fill="var(--grid)"></rect>';
    (r.anteile || []).forEach(function (anteil, i) {
      if (!anteil) return;
      s += '<rect x="' + (i * breite).toFixed(2) + '" y="0" width="' + Math.max(1, breite - 0.8).toFixed(2) +
        '" height="' + VB_HOEHE + '" fill="' + zellenFarbe(anteil, ab.vollAb) + '"></rect>';
    });
    return s + '</svg>';
  }

  /* Was in dieser Zeile schiefsteht - und nichts sonst. Eine Anzeige, die in jedem
   * Zustand gleich viel Text macht, verliert genau den Fall, fuer den sie gebaut ist. */
  function alarmHtml(z, st) {
    if (st.laeuft && st.laufIntervall === z.intervall) {
      return ' · <span style="color:var(--series);">sammelt gerade</span>';
    }
    /* STILLSTAND STEHT VOR ALLEM ANDEREN AUSSER DEM LAUFENDEN LAUF. Er ist der
     * Zustand, den man dieser Zeile bis zum 04.09.2026 nicht ansehen konnte:
     * dieselbe Wertemenge, Lauf um Lauf, ohne dass eine Reihe weiterrueckt. */
    var stst = (st.stillstand || []).filter(function (s) { return s.intervall === z.intervall; })[0];
    if (stst) {
      return ' · <span style="color:var(--down);">steht still: ' + stst.werte + ' Werte, ' +
        stst.male + '-mal ohne Fortschritt</span>';
    }
    if (z.hindernis) return ' · <span style="color:var(--down);">geht nicht: ' + U.esc(z.hindernis) + '</span>';
    if (z.verloren) return ' · <span style="color:var(--down);">' + z.verloreneTage.toFixed(1) + ' Tage unwiederbringlich weg</span>';
    if (z.sperre && z.sperre.verwaist) {
      return ' · <span style="color:var(--down);">liegengebliebene Sperre: ' + U.esc(z.sperre.warum || 'unbekannt') + '</span>';
    }
    if (!z.abstandTage) return ' · <span style="color:var(--muted);">nicht vorgesehen</span>';
    return '';
  }

  function grafikHtml(st, ab) {
    if (!ab || !ab.tage || !ab.tage.length) {
      return '<div class="loading" id="archivGrafik">Sehe nach, welche Handelstage im Archiv liegen …</div>';
    }
    if (ab.fehler) {
      return '<div class="loading" id="archivGrafik">Die Tageszählung ist nicht lesbar: ' + U.esc(ab.fehler) + '</div>';
    }
    var jeIv = {};
    (ab.zeilen || []).forEach(function (r) { jeIv[r.intervall] = r; });
    var h = '<div id="archivGrafik" class="arch-grafik">';
    (st.zeilen || []).forEach(function (z) {
      var r = jeIv[z.intervall] || { intervall: z.intervall, anteile: [], vollTage: 0,
                                     teilTage: 0, angesehen: 0, grund: 'Keine Auskunft' };
      h += '<div class="arch-zeile">' +
        '<span class="arch-name">' + U.esc(NAME[z.intervall] || z.intervall) + '</span>' +
        balkenSvg(r, ab) +
        '<span class="arch-zahl">' + r.vollTage + ' / ' + ab.tage.length + '</span>' +
        '</div>';
      h += '<div class="arch-fuss">' +
        z.werte.toLocaleString('de-DE') + ' Werte' +
        (r.angesehen ? ' (' + r.angesehen + ' angesehen)' : '') +
        ' · jüngste Kerze ' + U.esc(z.juengsterTag ? alterText(z.juengsteMs) : 'nichts da') +
        /* "AUF STAND" IST NICHT "LEER VERSUCHT". Eine Reihe, für die die Quelle
         * nichts mehr liefert, zählt hier weder als offen noch als gesund - sie
         * bekommt ihr eigenes Wort. Ohne dieses Wort sah der Zustand, der drei Tage
         * lang das ganze Sammeln aufhielt, aus wie ein gepflegtes Archiv. */
        (z.leerVersucht
          ? ' · <span style="color:var(--muted);">' + z.leerVersucht.toLocaleString('de-DE') +
            ' leer versucht</span>'
          : '') +
        alarmHtml(z, st) +
        '</div>';
    });
    h += '</div>';
    /* Die Legende sagt, was die Farben heissen UND wie gross die Stichprobe war.
     * Eine Grafik ohne ihre Stichprobe ist die schoenere Form derselben Stille. */
    function legendenTeil(farbe, wort) {
      return '<span class="arch-teil"><span class="arch-punkt" style="background:' + farbe +
        ';"></span> ' + wort + '</span>';
    }
    h += '<div class="arch-legende">' +
      'Ein Kästchen je Handelstag, links der älteste der letzten ' + ab.tage.length +
      ', rechts ' + U.esc(ab.bisTag) + '. ' +
      legendenTeil('var(--up)', 'gesammelt') + ' · ' +
      legendenTeil('var(--warn)', 'lückenhaft') + ' · ' +
      legendenTeil('var(--grid)', 'nichts da') + '. ' +
      'Gelesen aus höchstens ' + ab.probe + ' Reihen je Auflösung.' +
      '</div>';
    return h;
  }

  /* Die fuenf Knoepfe stehen seit Stufe 4 UNTER der Grafik statt in jeder
   * Tabellenzeile - einer je Aufloesung, mit der Aufloesung im zugaenglichen Namen
   * (#110): fuenf Knoepfe, die dasselbe Wort sagen, aber fuenf verschiedene Abrufe
   * starten, kann die Tastatur sonst nicht unterscheiden. */
  function knoepfeHtml(st) {
    var h = '<div class="arch-knoepfe"><span class="arch-knoepfe-was">Jetzt holen:</span>';
    (st.zeilen || []).forEach(function (z) {
      var name = NAME[z.intervall] || z.intervall;
      h += '<button class="btn ghost arch-hol" type="button" data-iv="' + U.esc(z.intervall) + '"' +
        ' aria-label="Jetzt holen: ' + U.esc(name) + '"' + (st.laeuft ? ' disabled' : '') + '>' +
        U.esc(name) + '</button>';
    });
    return h + '</div>';
  }

  function zeichne(st, ab) {
    var k = el('archivKarte');
    if (!k) return;
    LETZTER = st;
    if (ab) LETZTE_ABDECKUNG = ab;
    /* U3 (QS 04.09.2026): Die Statuszeile der Klappe fragt Archivkarte.letzter().
     * 'sub-changed' feuert SYNCHRON beim Aufklappen - also bevor laden() sein
     * Versprechen aufgeloest hat -, und danach loeste nichts mehr aus: wer nur das
     * Kursarchiv ansah, sah die Zeile nie. Statt in app-shell.js auf ein Versprechen
     * zu warten, das dort niemand kennt, sagt die Quelle jetzt Bescheid, sobald sie
     * eine Antwort HAT - einmal je Zeichnen, auch beim Fortschritts-Funk. */
    try { document.dispatchEvent(new CustomEvent('archiv-stand')); } catch (e) { /* ohne Ereignis bleibt es beim naechsten Takt */ }
    if (st.fehler) {
      k.innerHTML = '<div class="loading">Das Archiv ist nicht lesbar: ' + U.esc(st.fehler) + '</div>';
      return;
    }
    var e = st.einstellungen || {};
    var h = '';

    /* Stufe 3 (03.09.2026): Die drei Erklaersaetze stehen woertlich im Register unter
     * betrieb.kursarchiv, der i-Knopf dazu in der Ueberschrift dieser Klappe. Sichtbar
     * bleibt der Satz, der eine Entscheidung aendert: Was jetzt nicht geholt wird, ist
     * fort. */
    h += '<div style="font-size:var(--fs-neben); color:var(--ink-2); line-height:1.5; margin-bottom:10px; max-width:72ch;">' +
      'Was in dieser Zeit nicht geholt wurde, ist nicht später nachzuholen, sondern fort.' +
      '</div>';

    if (st.laeuft) {
      var f = st.fortschritt || {};
      var anteil = f.von ? Math.round(100 * f.nr / f.von) : 0;
      h += '<div class="panel" style="padding:8px 10px; margin-bottom:10px;">' +
        '<b>Sammelt ' + U.esc(NAME[st.laufIntervall] || st.laufIntervall) + '</b> – ' +
        f.nr + ' von ' + f.von + ' (' + anteil + ' %), zuletzt ' + U.esc(f.sym || '…') +
        ' · ' + f.ok + ' geholt, ' + f.leer + ' ohne Daten' +
        (f.vonHand ? ' · von Hand gestartet' : ' · planmäßig') +
        ' <button class="btn ghost" type="button" id="archStop" style="padding:3px 9px; font-size:var(--fs-klein); margin-left:8px;">Anhalten</button>' +
        '</div>';
    } else if (st.letzter) {
      var L = st.letzter;
      h += '<div style="font-size:var(--fs-neben); color:var(--muted); margin-bottom:10px;">' +
        'Letzter Lauf: ' + U.esc(NAME[L.intervall] || L.intervall) + ' – ' +
        L.ok + ' Reihen, ' + L.kerzen.toLocaleString('de-DE') + ' Kerzen' +
        (L.dazu ? ' (' + L.dazu.toLocaleString('de-DE') + ' neu)' : '') +
        (L.leer ? ', ' + L.leer + ' ohne Daten' : '') +
        (L.abgebrochen ? ' · <span style="color:var(--down);">abgebrochen: ' + U.esc(L.grund || '') + '</span>' : '') +
        '</div>';
    }
    if (st.letzterFehler) {
      h += '<div class="panel" style="padding:8px 10px; margin-bottom:10px; color:var(--down);">' +
        'Letzter Versuch schlug fehl: ' + U.esc(st.letzterFehler) + '</div>';
    }

    /* EINE Grafik statt der Tabelle (Stufe 4). Die fünf Knoepfe stehen darunter -
     * sie bleiben verdrahtet, nur ihr Ort hat sich geändert. */
    h += grafikHtml(st, LETZTE_ABDECKUNG);
    h += knoepfeHtml(st);

    /* DIE ZAHLEN OFFEN HINLEGEN. Wilhelm soll sie drehen koennen, ohne dass jemand
     * ihm erklaeren muss, wo sie stehen. */
    h += '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:10px; line-height:1.6;">' +
      '<b>So ist es eingestellt:</b> Universum <code>' + U.esc(e.universum || '?') + '</code>' +
      ' · 1 Minute alle ' + menge(e.intervalle['1m'], 'Tag', 'Tage') +
      /* U4 der UI-QS (04.09.2026): hier stand "5 Minuten alle 7 · 15 Minuten alle 7"
       * - zwei nackte Zahlen neben einer dritten, die ihre Einheit bekam. Alle drei
       * sind Tage (sammelplan.js: abstandTage) und gehen jetzt durch dieselbe
       * Funktion, damit auch die Einzahl stimmt. */
      ' · 5 Minuten alle ' + menge(e.intervalle['5m'], 'Tag', 'Tage') +
      ' · 15 Minuten alle ' + menge(e.intervalle['15m'], 'Tag', 'Tage') +
      ' · ' + U.dez(e.abstandMs / 1000, 1) + ' s Abstand je Anfrage' +
      /* Die Zahl ist einstellbar (0-720, sammelplan.js) - bei 1 stand hier bis
       * 8.40.1 "1 Minuten". Dieselbe Einzahl/Mehrzahl-Regel wie oben. */
      ' · frühestens ' + menge(e.nachSchlussMinuten, 'Minute', 'Minuten') + ' nach Handelsschluss.' +
      /* Die zwei Begruendungs-Saetze (Warum nach Handelsschluss, keine Stunden-/
       * Tageskerzen) stehen seit Stufe 3 woertlich im Register (betrieb.kursarchiv).
       * Die Zeile "So ist es eingestellt" bleibt: sie nennt die tatsaechlichen Werte
       * aus den Einstellungen, keine Erklaerung. Der Markt-offen-Zusatz bleibt auch -
       * er sagt, warum GERADE nichts passiert. */
      (st.marktOffen ? ' <b>Der Markt ist gerade offen</b> – planmäßig wird deshalb nicht gesammelt.' : '') +
      '</div>';

    k.innerHTML = h;

    var stop = el('archStop');
    if (stop) stop.onclick = function () { if (api && api.sammlerStop) api.sammlerStop().then(laden); };
    Array.prototype.forEach.call(k.querySelectorAll('.arch-hol'), function (b) {
      b.onclick = function () {
        if (!api || !api.sammlerStart) return;
        b.disabled = true;
        api.sammlerStart(b.getAttribute('data-iv')).then(function (r) {
          if (r && !r.ok) root.alert('Sammeln nicht möglich: ' + (r.grund || 'unbekannt'));
          laden();
        }).catch(function () { laden(); });
      };
    });
  }

  function laden() {
    if (!api || !api.sammlerStand || laeuftAnfrage) return;
    laeuftAnfrage = true;
    /* Zwei Auskuenfte, ein Zeichnen. Die Tageszaehlung liest Dateien und ist die
     * teurere von beiden; sie darf die Karte nicht aufhalten, wenn sie ausbleibt -
     * ein Balken ohne Zahlen ist besser als eine Karte, die gar nicht kommt.
     * Deshalb wird ihr Fehlschlag zu null und nicht zu einer Ausnahme. */
    var abP = (api.archivAbdeckung ? api.archivAbdeckung() : Promise.resolve(null))
      .catch(function (e) { return { fehler: String((e && e.message) || e) }; });
    Promise.all([api.sammlerStand(), abP]).then(function (r) {
      laeuftAnfrage = false;
      if (r[0]) zeichne(r[0], r[1]);
    }).catch(function (e) {
      laeuftAnfrage = false;
      var k = el('archivKarte');
      if (k) k.innerHTML = '<div class="loading">Der Sammler antwortet nicht: ' + U.esc(String(e && e.message || e)) + '</div>';
    });
  }

  if (api && api.onSammler) api.onSammler(function (st) { if (st) zeichne(st); });

  /* Geladen wird, wenn die Unterseite aufgeht - nicht beim Start der App. Der Stand
   * liest das Archiv von der Platte (bis zu 60 Dateien je Aufloesung); das gehoert
   * nicht in den Startvorgang, den Wilhelm jeden Morgen abwartet.
   * Der Fortschritt kommt ohnehin von selbst ueber onSammler. */
  /* Seit Stufe 1 des Umzugs (02.09.2026) ist das Kursarchiv keine eigene Pille mehr,
   * sondern die erste Klappe unter Werkzeuge -> Betrieb. Die Shell meldet das
   * Aufklappen mit demselben Ereignis und demselben Namen 'archiv' - der Ausloeser
   * hier bleibt deshalb Wort fuer Wort stehen. */
  document.addEventListener('sub-changed', function (ev) {
    if (ev && ev.detail && ev.detail.sub === 'archiv') laden();
  });
  /* Und wenn die Klappe beim Start schon offen ist: dann kommt kein Ereignis mehr,
   * das diese Datei hoert. Vor dem Umzug war das der gemerkte Pillen-Ort, heute
   * waere es ein <details open> - beides wird hier gleich behandelt. */
  document.addEventListener('DOMContentLoaded', function () {
    var s = document.getElementById('sub-archiv');
    if (!s) return;
    var kl = s.closest ? s.closest('details[data-klappe]') : null;
    if ((kl && kl.open) || s.classList.contains('active')) laden();
  });

  root.Archivkarte = { laden: laden, zeichne: zeichne, letzter: function () { return LETZTER; } };
})(typeof window !== 'undefined' ? window : globalThis);
