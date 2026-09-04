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

  /* Sichtbare Zahlen mit Komma (U.dez) - das Scoreboard ist deutsche Oberflaeche,
   * kein Export (Struktur-Audit Punkt 6). */
  function pp(x, d) { return x == null || !isFinite(x) ? '–' : ((x >= 0 ? '+' : '') + window.U.dez(x * 100, d == null ? 3 : d)); }
  function t2(x) { return x == null || !isFinite(x) ? '–' : (x >= 0 ? '+' : '') + window.U.dez(x, 2); }

  /* EINE Zeile je Urteil: Rang, Beschriftung, Farbe. Die Ziffer steht nur fuers
   * Sortieren, die Reihenfolge ist der Belegwert.
   *
   * Warum eine Tabelle statt drei nebeneinander und einer vierten weiter unten: Bis zum
   * 25.08.2026 fuehrte diese Datei fuer dieselben Schluessel eine zweite
   * Beschriftungstabelle - und die kannte das Urteil mit dem verschobenen Nullpunkt
   * nicht. Dieselbe Messung hiess im Scoreboard "bestätigt – aber Nullpunkt verschoben"
   * und in der Strategien-Liste darunter roh, als Schluessel. Zwei Wahrheiten fuer ein
   * Urteil laufen auseinander, ohne dass etwas bricht; wer ein neues Urteil eintraegt,
   * muss es an genau einer Stelle tun. */
  var URTEIL = {
    'bestaetigt':                           { rang: 0, farbe: 'var(--up)' },
    'nicht-bestaetigt':                     { rang: 1, farbe: 'var(--series2)' },
    'nicht-entscheidbar':                   { rang: 2, farbe: 'var(--muted)' },
    'bestaetigt-aber-nullpunkt-verschoben': { rang: 3, farbe: 'var(--down)' },
    'nicht-messbar':                        { rang: 4, farbe: 'var(--muted)' },
    'widerlegt':                            { rang: 5, farbe: 'var(--down)' }
  };

  /* RUECKFALL FUER UNBEKANNTE URTEILE. Die Maschine darf neue Urteile erfinden - das
   * ist gerade passiert. Ein Zugriff per Tabelle liefert dann undefined, und undefined
   * ist in JEDEM der drei Fälle still: NaN beim Sortieren, false beim Vergleich, und
   * "color:undefined" wirft der Browser weg. Deshalb Funktionen statt Tabellen, mit
   * einem Rueckfall, der im Zweifel gegen die Strategie ausschlaegt. */
  function rang(u) { return URTEIL[u] ? URTEIL[u].rang : 90; }
  /* Die Uebersetzung wohnt seit dem 26.08.2026 in app-shell (#102) - dieselbe, die der
   * Regelkopf benutzt. Die Tabelle hier behaelt Rang und Farbe; der Text kam zweimal
   * vor und stand damit vor dem Auseinanderlaufen. */
  function label(u) { return U.urteilText(u); }
  function farbe(u) {
    if (URTEIL[u]) return URTEIL[u].farbe;
    /* Gruen gibt es nur fuer den einen Schluessel, der genau 'bestaetigt' heisst.
     * Alles, was mit "bestaetigt" nur ANFAENGT, ist ein Urteil mit Vorbehalt - und
     * ein Vorbehalt ist kein gruenes Licht. */
    return 'var(--warn, var(--series2))';
  }

  /* SELBSTPRUEFUNG (SP). Der Placebo-Lauf ist das Einzige in einem Protokoll, dessen
   * richtige Antwort vorher feststeht: null. Ein Signal ohne jeden Kursbezug, auf
   * denselben Sitzungspositionen wie das echte. Weicht er staerker ab als die eigene
   * Aufloesung, misst die Maschine etwas, wo nichts ist - dann ist jede andere Zahl
   * im Protokoll um diesen Betrag verschoben. Genau so ist am 25.08.2026 aufgefallen,
   * dass nicht bereinigte Zusammenlegungen im Kontrolltopf sassen.
   * Hier wird nichts gerechnet: zwei gemessene Zahlen werden verglichen. */
  function placeboOk(p) {
    var pl = p && p.placebo;
    if (!pl || pl.tagesmittel == null || pl.mde == null) return null;   // ungeprueft
    return Math.abs(pl.tagesmittel) <= pl.mde;
  }
  /* Wurde dieses Protokoll mit der Maschine gemessen, die jetzt hier liegt?
   * true = ja, false = nein, null = laesst sich nicht sagen.
   * Der dritte Fall ist der haeufige und darf nicht als "nein" durchgehen: bis zum
   * 26.08.2026 trug kein Protokoll eine Kennung der Maschine, es waren 26 Stueck.
   * Die stehen unter "unbekannt", nicht unter "veraltet" - das eine ist eine Luecke,
   * das andere eine Aussage. */
  function maschineAktuell(p) {
    var st = p && p.verfahren && p.verfahren.codeStand;
    if (!MASCHINE || typeof st !== 'string') return null;
    return st === MASCHINE;
  }
  function standText(p) {
    var v = p && p.verfahren;
    if (!v) return '';
    return 'Verfahren ' + U.esc(v.version || '?') + (v.codeStand ? ' · Stand ' + U.esc(v.codeStand) : ' · Stand unbekannt');
  }
  function placeboBand(p) {
    var pl = p && p.placebo, ok = placeboOk(p);
    if (ok === null) {
      return '<div style="margin:6px 0 10px; padding:8px 10px; border-left:3px solid var(--muted); font-size:var(--fs-neben); color:var(--ink-2);">' +
        '<b>Selbstprüfung: keine.</b> Diese Messung stammt aus der Zeit vor dem Placebo-Lauf, oder er kam ' +
        'nicht zustande. Ihr Nullpunkt ist ungeprüft – die Zahlen unten können um einen unbekannten Betrag verschoben sein.</div>';
    }
    return '<div style="margin:6px 0 10px; padding:8px 10px; border-left:3px solid ' +
      (ok ? 'var(--up)' : 'var(--down)') + '; font-size:var(--fs-neben);">' +
      '<b>Selbstprüfung ' + (ok ? 'bestanden' : 'FEHLGESCHLAGEN') + '.</b> ' +
      'Ein Signal <b>ohne jeden Kursbezug</b> – die richtige Antwort ist null – ergab ' +
      '<b>' + pp(pl.tagesmittel, 4) + ' Pp</b> bei einer Auflösung von ' +
      (pl.mde * 100).toFixed(4) + ' Pp (' + (pl.signale || 0).toLocaleString('de-DE') + ' Fälle, ' + (pl.tage || 0) + ' Tage). ' +
      (ok ? 'Der Nullpunkt der Maschine liegt im Rahmen; die Zahlen unten stehen auf geprüftem Grund.'
          : 'Die Maschine misst etwas, wo nichts ist. <b>Jede Zahl unten ist um diesen Betrag verschoben</b> und darf ' +
            'nicht für bare Münze genommen werden.') + '</div>';
  }

  var STAND = [];
  /* Wie viele Strategien im Register stehen. Gefuellt von strategienLaden(), also
   * erst, wenn die Klappe einmal offen war - vorher ist die Zahl schlicht nicht da,
   * und die Statuszeile im Klappentitel bleibt dann LEER statt zu raten. Das Register
   * liest zwei Verzeichnisse ueber IPC; es von einer Statuszeile aus anzustossen
   * hiesse, beim Programmstart zu laden, was der Alltag nicht braucht. */
  var REGISTER_N = null;
  /* Der Codestand der Messmaschine, die gerade hier liegt (26.08.2026). Solange er
   * null ist - alte App, fehlende Datei -, kennzeichnet die Tafel GAR NICHTS. Eine
   * Warnung, die immer leuchtet, liest nach einer Woche niemand mehr. */
  var MASCHINE = null;
  async function laden() {
    var el = document.getElementById('scoreboard');
    if (!el || !window.api || !window.api.readProtokolle) return;
    var r = null;
    try { r = await window.api.readProtokolle(); } catch (e) { r = { ok: false, grund: String(e && e.message || e) }; }
    MASCHINE = (r && typeof r.maschinenStand === 'string') ? r.maschinenStand : null;
    if (!r || !r.ok) { el.innerHTML = '<div style="color:var(--muted); font-size:var(--fs-neben);">Protokolle nicht lesbar' + (r && r.grund ? ': ' + U.esc(r.grund) : '') + '.</div>'; return; }
    if (!r.protokolle.length) {
      /* Der volle Windows-Pfad und der node-Befehl standen hier im Endnutzer-Satz. Wer
       * die App installiert hat, hat weder node noch den Quellordner - fuer ihn war das
       * eine Sackgasse mit Wegbeschreibung. Vorn steht jetzt der Weg ueber den Knopf,
       * der Ordner in der Sprache der App; der echte Pfad bleibt vollstaendig, aber in
       * der Klappe. Gekuerzt wird nichts - nur einsortiert. */
      el.innerHTML = '<div style="color:var(--muted); font-size:var(--fs-neben);">Noch kein Protokoll. ' +
        'Unten eine Strategie ablegen und auf <b>Jetzt messen</b> drücken. Die fertigen Protokolle liest ' +
        'die App aus <code>Datenordner → protokolle</code>.' +
        '<details class="how archiv" style="margin-top:8px;"><summary>Für Entwickler</summary>' +
        '<div style="margin-top:6px;">Von Hand messen: <code>node studien/messmaschine/messen.js &lt;datei&gt;</code> ' +
        '– der Befehl läuft im Projektordner, also dort, wo die Quellen liegen. ' +
        'Der Protokollordner ist <code>' + U.esc(r.ordner) + '</code>.</div>' +
        '</details></div>';
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
      if (rang(ua) !== rang(ub)) return rang(ua) - rang(ub);
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
    (p.urteile || []).forEach(function (u, i) { if (rang(u) < best) { best = rang(u); idx = i; } });
    return p.ergebnisse[idx] || p.ergebnisse[0];
  }

  /* ================= Aufloesungswand (1b, Wilhelm 26.08.2026) =================
   * Die Aussicht (aussicht.tage80) steht im Protokoll in den Entscheidungs-
   * Eintraegen "Urteil Variante N" - dieselbe Stelle, aus der die Nachrechnung
   * des Analytikers liest. Planungsrelevant ist die KLEINSTE Zahl ueber alle
   * Varianten. null heisst: keine Variante hat einen positiven Punktschaetzer,
   * mehr Daten allein wuerden die Frage nicht entscheiden.
   * WICHTIG fuer den Ton: "nicht entscheidbar" heisst "wir wissen es nicht",
   * nicht "schlecht". Die Trennung unten ist ein Hinweis auf das Messgeraet,
   * keine Abwertung der Strategie - und sie greift in nichts ein. */
  var WAND_TAGE = 2500;
  /* BAUSTOPP-Korrektur (PM 26.08. 20:40, nach dem ersten Wurf):
   * 1. Die Einheit von tage80 sind SIGNALTAGE, nicht Handelstage (A-Fund 21:05) -
   *    bei monatsende-kauf liegen 21,5 Handelstage zwischen zwei Signaltagen, die
   *    erste Beschriftung untertrieb also bis Faktor 20. Signaltage <= Handelstage,
   *    die 2.500er-Trennung bleibt damit als Untergrenze gueltig.
   * 2. Eine Variante mit Urteil "nicht-messbar" traegt ihre Aussicht aus einer
   *    bekannten Maschinenluecke (Schranke tage > 0 statt >= 30, messmaschine.js).
   *    Diese Zahl wird NICHT angezeigt, bis die Maschine repariert ist - sonst
   *    truege die Oberflaeche einen Maschinenfehler nach aussen. */
  function aussichtVariante(p, vi) {
    if (p.urteile && p.urteile[vi] === 'nicht-messbar') return null;
    var e = (p.entscheidungen || []).filter(function (en) { return en.regel === 'Urteil Variante ' + vi; })[0];
    var a = e && e.ergebnis && e.ergebnis.aussicht;
    return a && isFinite(a.tage80) ? a.tage80 : null;
  }
  /* DELTA80 - der kleinste WAHRE Effekt, den ein Lauf mit 80 % Wahrscheinlichkeit
   * ueber die Schwelle gebracht haette. Wilhelms Entscheid vom 26.08. 20:30:
   * entschieden wird kuenftig an DIESER Zahl, nicht an Handelstagen - denn tage80
   * skaliert mit 1/Effekt(hoch 2) und schwankt ueber die eigene Messhistorie, waehrend
   * delta80 eine Effektgroesse gegen eine Effektgroesse stellt, ohne Schaetzer im
   * Nenner.
   *
   * ZWEI EINHEITEN-FALLEN, und beide sind an einem Tag schon zugeschnappt:
   *   1. delta80 steht im Protokoll als BRUCH (0,0117), nicht in Prozentpunkten.
   *      Mal 100 sind es Pp. aussicht.delta80Pp schreibt die Maschine erst seit
   *      Kurzem und ist in NULL von 69 vorhandenen Varianten gesetzt - wer sich
   *      darauf verlaesst, zeigt einen leeren Strich statt einer Zahl.
   *   2. delta80 sind PROZENTPUNKTE, tage80 sind SIGNALTAGE. Am 26.08. 17:50 wurde
   *      genau das einmal verwechselt. Deshalb steht die Einheit an jeder Zahl.
   *
   * Die KLEINSTE ueber alle Varianten ist die planungsrelevante: sie sagt, wie fein
   * das Messgeraet im besten Fall war. Ist schon die feinste Variante groeber als die
   * Kostenhuerde, war der Lauf fuer jede handelbare Kante blind. */
  function delta80Variante(p, vi) {
    if (p.urteile && p.urteile[vi] === 'nicht-messbar') return null;
    var e = (p.entscheidungen || []).filter(function (en) { return en.regel === 'Urteil Variante ' + vi; })[0];
    var d = e && e.ergebnis && e.ergebnis.delta80;
    return isFinite(d) && d > 0 ? d * 100 : null;
  }
  function minDelta80(p) {
    var min = null;
    (p.ergebnisse || []).forEach(function (e, vi) {
      var d = delta80Variante(p, vi);
      if (d != null && (min == null || d < min)) min = d;
    });
    return min;
  }
  function minAussicht(p) {
    var min = null;
    (p.ergebnisse || []).forEach(function (e, vi) {
      var t = aussichtVariante(p, vi);
      if (t != null && (min == null || t < min)) min = t;
    });
    return min;
  }
  /* Dritter Abschnitt (QS-Vorschlag, vom PM uebernommen): Strategien OHNE jede
   * Aussicht, deren Ueberschuss in allen Varianten negativ ist, sind kein
   * Datenmangel - sie zeigen in die Gegenrichtung. Das ist etwas anderes als
   * "zu wenig Daten", und es in denselben Abschnitt zu stellen waere die
   * naechste Verwechslung von "wir wissen es nicht" und "gemessen". */
  function gegenRichtung(p) {
    if (minAussicht(p) != null) return false;
    var maxT = -Infinity;
    (p.ergebnisse || []).forEach(function (e) {
      var u = e && e.bestaetigung && e.bestaetigung.ueberschuss;
      if (u && isFinite(u.tagesmittel) && u.tagesmittel > maxT) maxT = u.tagesmittel;
    });
    return maxT !== -Infinity && maxT <= 0;
  }
  /* DIE KOSTENHUERDE DER LAUFENDEN EINSTELLUNG. Wilhelms Entscheid vom 27.08.:
   * die Wand trennt daran, nicht an einer festen Tabelle - und ausdruecklich gegen
   * die Empfehlung, die groesste statische Huerde zu nehmen.
   * Sie kommt aus depot.js (DepotAPI.kostenHuerde), damit es bei EINER Rechnung
   * bleibt. Ist das Depot noch nicht hochgefahren, gibt es keine Huerde - dann
   * faellt die Trennung auf die alte Signaltage-Regel zurueck UND sagt das. Eine
   * Wand, die stillschweigend etwas anderes misst als angeschrieben, waere genau
   * der Fehler, gegen den diese ganze Anzeige gebaut ist. */
  function liveHuerde() {
    try {
      var h = window.DepotAPI && window.DepotAPI.kostenHuerde ? window.DepotAPI.kostenHuerde() : null;
      return h && isFinite(h.pp) && h.pp > 0 ? h : null;
    } catch (e) { return null; }
  }
  function hinterWand(p, h) {
    if (gegenRichtung(p)) return false;
    if (p.bestesUrteil !== 'nicht-entscheidbar') return false;
    if (!h) {
      /* Rueckfall: keine Einstellung gelesen, also die alte Regel. */
      var min = minAussicht(p);
      return min == null || min > WAND_TAGE;
    }
    var d = minDelta80(p);
    /* OHNE delta80 KEINE BEHAUPTUNG. Die alte Regel schob Protokolle ohne Zahl
     * hinter die Wand; das hiess "das Geraet war zu grob", obwohl niemand es
     * wusste. 16 der 38 vorliegenden Protokolle stammen aus der Zeit vor dieser
     * Kennzahl. Sie stehen jetzt oben und tragen einen Strich in der Spalte -
     * das ist "wir wissen es nicht", und genau so sieht es aus. */
    if (d == null) return false;
    return d > h.pp;
  }
  function aussichtZelle(p) {
    var min = minAussicht(p);
    if (min == null) {
      var grund = (p.urteile || []).indexOf('nicht-messbar') !== -1
        ? 'Der Lauf kam nicht zustande (Urteil „nicht messbar"). Die im Protokoll mitgeschriebene Aussicht stammt aus einer bekannten Maschinenlücke (Mindesttage-Schranke) und wird nicht angezeigt, bis die Maschine repariert ist.'
        : 'Keine Variante hat einen positiven Punktschätzer – mehr Daten allein würden die Frage nicht entscheiden.';
      return '<td class="num"><span title="' + grund + '" style="color:var(--muted);">–</span></td>';
    }
    return '<td class="num">' + U.nf0.format(min) + '</td>';
  }

  /* Die Zahl, an der Wilhelm entscheiden will - bisher stand sie nirgends in der
   * Oberflaeche. Ohne sie kann man sie nicht einmal ansehen, geschweige denn
   * danach entscheiden. Die Einheit steht als Kopfzeile ueber der Spalte und im
   * Titel jeder Zelle - eine Prozentpunkt-Zahl neben einer Tage-Zahl ohne Ansage
   * ist genau die Verwechslung, die es schon einmal gab. */
  function delta80Zelle(p) {
    var d = minDelta80(p);
    if (d == null) {
      return '<td class="num"><span title="Keine Variante dieses Laufs weist einen delta80 aus – entweder ist der Punktschätzer nicht positiv, oder die Messung stammt aus der Zeit vor dieser Kennzahl." style="color:var(--muted);">–</span></td>';
    }
    return '<td class="num"><span title="Der kleinste wahre Effekt, den dieser Lauf mit 80 % Wahrscheinlichkeit über die Schwelle gebracht hätte – in Prozentpunkten des Basiswerts. Kleiner ist feiner. Liegt die Zahl über der Kostenhürde des gehandelten Produkts, war der Lauf für jede handelbare Kante von vornherein blind.">' +
      U.dez(d, 3) + '</span></td>';
  }

  function zeichnen() {
    var el = document.getElementById('scoreboard');
    var zeile = function (i) {
      var z = STAND[i];
      var p = z.aktuell.protokoll, e = bestesErgebnis(p), b = e.bestaetigung.ueberschuss;
      var u = p.bestesUrteil;
      var warn = (p.warnungen || []).length;
      /* Ein gescheiterter Selbsttest entwertet die ganze Zeile. Er darf nicht erst
       * sichtbar werden, wenn man aufklappt. */
      var spOk = placeboOk(p);
      return '<tr class="sbRow" data-i="' + i + '" style="cursor:pointer;">' +
        '<td><b style="color:' + farbe(u) + ';">' + U.esc(label(u)) + '</b></td>' +
        '<td><b>' + U.esc(z.key) + '</b>' + (p.tests > 1 ? ' <span style="color:var(--muted);">(' + p.tests + ' Varianten)</span>' : '') + '</td>' +
        '<td class="num">' + pp(b.tagesmittel) + '</td>' +
        '<td class="num">' + pp(b.jeSignal) + '</td>' +
        '<td class="num">' + t2(b.t) + '</td>' +
        '<td class="num">' + pp(b.mde) + '</td>' +
        '<td class="num">' + (b.tage || 0) + ' / ' + (b.signale || 0) + '</td>' +
        delta80Zelle(p) +
        aussichtZelle(p) +
        '<td style="color:var(--muted);">' + U.esc(p.gemessenAm.slice(0, 10)) +
          (spOk === false ? ' <span title="Selbstprüfung fehlgeschlagen – der Nullpunkt dieser Messung liegt nicht bei null" style="color:var(--down); font-weight:600;">✖ Nullpunkt</span>'
           : spOk === null ? ' <span title="Ohne Selbstprüfung gemessen – Nullpunkt ungeprüft" style="color:var(--muted);">○</span>' : '') +
          (warn ? ' <span title="' + warn + ' Warnung(en) – aufklappen" style="color:var(--series2);">⚠' + warn + '</span>' : '') +
          /* Mit welcher Fassung der Messmaschine? Zwei Zeilen mit verschiedenem Stand
           * sind nicht ohne Weiteres vergleichbar - genau das war der Anlass. */
          (maschineAktuell(p) === false ? ' <span title="Mit einer anderen Fassung der Messmaschine gemessen als der, die jetzt hier liegt (' + U.esc(String((p.verfahren && p.verfahren.codeStand) || '?')) + ' statt ' + U.esc(String(MASCHINE)) + '). Diese Zeile ist mit den anderen nicht ohne Weiteres vergleichbar – neu messen." style="color:var(--series2); font-weight:600;">⟳ alte Maschine</span>' : '') + '</td>' +
        '</tr>';
    };
    /* Dreiteilung (1b, Baustopp-Fassung): was jenseits der Wand liegt und was in
     * die Gegenrichtung zeigt, steht in eigenen Abschnitten DERSELBEN Tabelle -
     * gleiche Spalten, gleiche Klickbarkeit, nichts wird ausgeblendet oder
     * abgeschaltet. Die Reihenfolge innerhalb der Abschnitte bleibt die
     * bestehende Sortierung aus laden(). */
    var oben = [], wand = [], gegen = [];
    /* EINMAL holen, nicht je Zeile: sonst koennte sich die Huerde mitten in der
     * Tabelle aendern und zwei Zeilen waeren gegen verschiedene Massstaebe geprueft. */
    var HL = liveHuerde();
    STAND.forEach(function (z, i) {
      var p9 = z.aktuell.protokoll;
      (gegenRichtung(p9) ? gegen : hinterWand(p9, HL) ? wand : oben).push(i);
    });
    /* WILHELMS AUFLAGE, woertlich: die Anzeige muss dazusagen, mit welchem Produkt
     * und welcher Haltedauer gerechnet wurde. Ohne das wandert die Wand unerklaert
     * mit jeder Einstellung - und dieselbe Strategie stuende morgen woanders, ohne
     * dass sich an ihr etwas geaendert haette. Das ist die Fehlerfamilie vom
     * 23.08.2026 (Produkt-Vorgabe an drei Stellen, zwei davon falsch). */
    var wandSatz = function (h) {
      if (!h) {
        return 'Diese Strategien sind nicht am Markt gescheitert, sondern am Messgerät: Eine ' +
          'Entscheidung bräuchte mehr als ' + U.nf0.format(WAND_TAGE) + ' weitere ' +
          'Bestätigungs-Signaltage. <b>Gemessen wird hier noch an den Signaltagen</b> – die ' +
          'Kostenhürde Ihrer Einstellung ließ sich nicht lesen (das Depot ist noch nicht ' +
          'geladen). Sie bleiben wählbar und vollständig einsehbar – die App behauptet nur ' +
          'nichts über sie, weder gut noch schlecht.';
      }
      var std = h.haltenMin >= 60 ? U.dez(h.haltenMin / 60, 1) + ' h' : h.haltenMin + ' Min';
      return 'Diese Strategien sind nicht am Markt gescheitert, sondern am Messgerät: Selbst ' +
        'im günstigsten Fall hätte die Messung nur Effekte ab <b>' + U.dez(minDelta80Anzeige(), 3) + ' Pp</b> ' +
        'erkannt – mehr, als nach Kosten übrig bliebe. <b>Verglichen wird mit Ihrer aktuellen ' +
        'Einstellung:</b> ' + U.esc(h.produkt) + ', Haltedauer ' + std +
        (h.angenommen ? ' (angenommen – dieser Modus hat keinen Zeitausstieg)' : '') +
        ', Einsatz ' + Math.round(h.einsatz) + ' $ → Kostenhürde <b>' + U.dez(h.pp, 3) + ' Pp je Umlauf</b>. ' +
        'Ändern Sie das Produkt oder die Haltedauer, verschiebt sich diese Grenze. ' +
        'Sie bleiben wählbar und vollständig einsehbar – die App behauptet nur nichts über sie, ' +
        'weder gut noch schlecht.';
    };
    /* Nur fuer den Satz oben: die feinste Zahl unter den Zeilen hinter der Wand. */
    var minDelta80Anzeige = function () {
      var m = null;
      wand.forEach(function (i) {
        var d = minDelta80(STAND[i].aktuell.protokoll);
        if (d != null && (m == null || d < m)) m = d;
      });
      return m == null ? 0 : m;
    };
    var trennzeile = function (titel, satz) {
      return '<tr><td colspan="10" style="padding:16px 8px 6px; border-top:2px solid var(--grid);">' +
        '<b>' + titel + '</b><br>' +
        '<span style="font-weight:400; color:var(--muted); font-size:var(--fs-neben);">' + satz + '</span></td></tr>';
    };
    var rows = oben.map(zeile).join('') +
      (wand.length
        ? trennzeile('Nicht entscheidbar mit diesen Daten', wandSatz(HL))
        : '') +
      wand.map(zeile).join('') +
      (gegen.length
        ? trennzeile('Gemessen – zeigt in die Gegenrichtung',
          'Für diese Strategien gibt es keine Zahl an weiteren Tagen: Ihr gemessener Überschuss ist in allen Varianten negativ. ' +
          'Das ist etwas anderes als „zu wenig Daten" – sie brauchen keine weiteren Daten, sie zeigen in die falsche Richtung. ' +
          'Auch sie bleiben wählbar und vollständig einsehbar.')
        : '') +
      gegen.map(zeile).join('');
    el.innerHTML = '<div style="overflow:auto;"><table class="tbl" style="width:100%;">' +
      '<tr><th>Urteil</th><th>Strategie</th><th style="text-align:right;">Überschuss<br><span style="font-weight:400; color:var(--muted);">Tagesmittel</span></th>' +
      '<th style="text-align:right;">Überschuss<br><span style="font-weight:400; color:var(--muted);">je Signal</span></th>' +
      '<th style="text-align:right;">t</th><th style="text-align:right;">MDE</th><th style="text-align:right;">Tage / Signale</th>' +
      '<th style="text-align:right;">Feinheit<br><span style="font-weight:400; color:var(--muted);">delta80 in Prozentpunkten</span></th>' +
      '<th style="text-align:right;">Aussicht<br><span style="font-weight:400; color:var(--muted);">Signaltage bis entscheidbar</span></th>' +
      '<th>gemessen</th></tr>' +
      rows + '</table></div>' +
      '<div id="sbDetail" style="margin-top:10px;"></div>' +
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:6px;"><b>Feinheit (delta80)</b> ist der kleinste wahre Effekt, den ein Lauf mit 80 % Wahrscheinlichkeit über die Schwelle gebracht hätte – <b>in Prozentpunkten</b>, kleiner ist feiner. Sie ist mit der Kostenhürde des gehandelten Produkts zu vergleichen (gemessen an 15 US-Großwerten 2026: Aktie 0,04 · Schein am Geld 0,05 · CFD 0,10 · Standard-Schein 0,23 Pp je Umlauf). <b>Achtung, zwei Einheiten:</b> die Feinheit zählt Prozentpunkte, die Aussicht daneben zählt Signaltage. <b>Die Signaltage sind zwischen Strategien nicht vergleichbar:</b> wer selten feuert, braucht wenige Signaltage, aber sehr viele Handelstage dafür – gemessen reicht dieser Faktor von 1,0 bis 21,5. Die Feinheit hat dieses Problem nicht, sie ist eine Effektgröße und keine Zählung. <b>Die Trennung unten misst an der Feinheit</b> gegen die Kostenhürde Ihrer aktuellen Einstellung – Produkt und Haltedauer stehen dort dabei. Strategien ohne ausgewiesene Feinheit werden nicht einsortiert: ohne Zahl keine Behauptung.<br>Alle Werte aus der <b>Bestätigungshälfte</b> (zurückgehaltene Tage) in Prozentpunkten. „Tagesmittel" ist die Teststatistik, „je Signal" die handelbare Zahl – beide können verschiedene Vorzeichen haben, dann steht eine Warnung dabei. Zeile anklicken für den vollständigen Entscheidungsweg. ' +
      'Ein <b style="color:var(--down);">✖ Nullpunkt</b> heißt: Die Messung hat ihre eigene Selbstprüfung nicht bestanden – ' +
      'ein Signal ohne jeden Kursbezug hätte null ergeben müssen und tat es nicht. Dann stimmt keine Zahl dieser Zeile. ' +
      'Ein <b style="color:var(--series2);">⟳ alte Maschine</b> heißt: Die Zeile wurde mit einer anderen Fassung der Messmaschine gerechnet als der, die jetzt hier liegt – ' +
      'sie steht zum Vergleich, aber nicht auf gleicher Grundlage. Steht bei keiner Zeile eine Marke, tragen die Protokolle keine Kennung der Maschine (alle vor dem 26.08.2026) oder die Maschine fehlt. ' +
      '<b>„Aussicht"</b> ist die kleinste Zahl weiterer Bestätigungs-<b>Signaltage</b> über alle Varianten, nach der das Urteil entscheidbar würde – ' +
      'unter der Annahme des Protokolls, dass Effekt und Signaldichte konstant bleiben. Signaltage sind Tage, an denen die Strategie auch feuert: ' +
      'je seltener sie feuert, desto mehr Handelstage stecken in einem Signaltag – die Zahl ist also eine Untergrenze in Handelstagen. ' +
      'Sie ist zudem eine Ableitung aus dem geschätzten Effekt (im Nenner, quadriert) und schwankt entsprechend stark mit ihm – ' +
      'Überschuss, MDE und Tage daneben gehören immer mitgelesen. ' +
      'Ein „–" trägt seinen Grund als Hinweis beim Zeigen mit der Maus.</div>';
    el.querySelectorAll('tr.sbRow').forEach(function (tr) {
      tr.addEventListener('click', function () { detail(parseInt(tr.getAttribute('data-i'), 10)); });
    });
  }

  function detail(i) {
    var z = STAND[i]; if (!z) return;
    var p = z.aktuell.protokoll, d = document.getElementById('sbDetail');
    var h = '<div class="panel" style="background:var(--surface-2, var(--grid));">' +
      '<div style="display:flex; justify-content:space-between; align-items:baseline; flex-wrap:wrap; gap:8px;">' +
      '<h3 style="margin:0;">' + U.esc(z.key) + ' – Entscheidungsweg</h3>' +
      '<span style="font-size:var(--fs-neben); color:var(--muted);">' + standText(p) + ' · ' + U.esc(z.aktuell.datei) +
        (maschineAktuell(p) === false ? ' · <b style="color:var(--series2);">⟳ alte Maschine</b>' : '') + '</span></div>' +
      '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin:6px 0 10px;"><b>Grund:</b> ' + U.esc(p.strategie.grund) + '</div>' +
      '<div style="font-size:var(--fs-neben); margin-bottom:10px;">Universum: <b>' + p.universum.werte + '</b> Werte, <b>' + p.universum.handelstage + '</b> Handelstage (' + U.esc(p.universum.von) + ' bis ' + U.esc(p.universum.bis) + '), Schnitt am <b>' + U.esc(p.universum.schnittTag) + '</b> · Haltedauer <b>' + p.strategie.haltedauerKerzen + '</b> Kerzen · Richtung <b>' + U.esc(p.strategie.richtung) + '</b> · ' + p.tests + ' Test(s)' + ausstiegText(p) + '</div>';
    h += placeboBand(p);
    // Jede Entscheidung, nummeriert - das ist die 100-%-Einsicht
    h += '<table class="tbl" style="width:100%; font-size:var(--fs-neben);"><tr><th>#</th><th>Regel</th><th>Eingabe</th><th>Ergebnis</th><th>Begründung</th></tr>';
    (p.entscheidungen || []).forEach(function (e) {
      h += '<tr><td>' + e.nr + '</td><td><b>' + U.esc(e.regel) + '</b></td>' +
        '<td style="font-family:var(--mono, monospace); font-size:var(--fs-klein); white-space:pre-wrap; max-width:220px;">' + U.esc(kurz(e.eingabe)) + '</td>' +
        '<td style="font-family:var(--mono, monospace); font-size:var(--fs-klein); white-space:pre-wrap; max-width:220px;">' + U.esc(kurz(e.ergebnis)) + '</td>' +
        '<td style="color:var(--ink-2);">' + U.esc(e.begruendung) + '</td></tr>';
    });
    h += '</table>';
    if ((p.warnungen || []).length) {
      h += '<div style="margin-top:10px; padding:8px 10px; border-left:3px solid var(--series2); font-size:var(--fs-neben);"><b>Warnungen</b>' +
        p.warnungen.map(function (w) { return '<div style="margin-top:4px;">[' + U.esc(w.kennung) + '] ' + U.esc(w.text) + '</div>'; }).join('') + '</div>';
    }
    // Alle Varianten mit Entdeckung UND Bestaetigung - nichts wird versteckt
    h += '<h4 style="margin:12px 0 6px;">Alle Varianten</h4><div style="overflow:auto;"><table class="tbl" style="font-size:var(--fs-neben);">' +
      '<tr><th>#</th><th>Parameter</th><th>Signale</th><th colspan="2" style="text-align:center;">Entdeckung</th><th colspan="3" style="text-align:center;">Bestätigung</th><th style="text-align:right;">Aussicht</th><th>Urteil</th></tr>' +
      '<tr><th></th><th></th><th></th><th style="text-align:right;">roh</th><th style="text-align:right;">Überschuss (t)</th><th style="text-align:right;">roh</th><th style="text-align:right;">Überschuss (t)</th><th style="text-align:right;">je Signal</th><th></th><th></th></tr>';
    (p.ergebnisse || []).forEach(function (e, vi) {
      var av = aussichtVariante(p, vi);
      h += '<tr><td>' + vi + '</td><td style="font-family:var(--mono, monospace); font-size:var(--fs-klein);">' + U.esc(JSON.stringify(e.params)).slice(0, 80) + '</td><td class="num">' + e.signale + '</td>' +
        '<td class="num">' + pp(e.entdeckung.roh.tagesmittel) + '</td><td class="num">' + pp(e.entdeckung.ueberschuss.tagesmittel) + ' (' + t2(e.entdeckung.ueberschuss.t) + ')</td>' +
        '<td class="num">' + pp(e.bestaetigung.roh.tagesmittel) + '</td><td class="num">' + pp(e.bestaetigung.ueberschuss.tagesmittel) + ' (' + t2(e.bestaetigung.ueberschuss.t) + ')</td>' +
        '<td class="num">' + pp(e.bestaetigung.ueberschuss.jeSignal) + '</td>' +
        '<td class="num">' + (av == null ? '<span style="color:var(--muted);">–</span>' : U.nf0.format(av)) + '</td>' +
        '<td style="color:' + farbe(p.urteile[vi]) + ';">' + U.esc(label(p.urteile[vi])) + '</td></tr>';
    });
    h += '</table></div>';
    if (z.aeltere.length) h += '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:8px;">Ältere Protokolle dieser Kennung: ' + z.aeltere.map(function (a) { return U.esc(a.datei); }).join(', ') + '</div>';
    if (p.strategie.quelle) h += '<details style="margin-top:10px;"><summary style="font-size:var(--fs-neben); cursor:pointer;">Quelltext der gemessenen Strategie</summary><pre style="font-size:var(--fs-klein); overflow:auto; max-height:300px;">' + U.esc(p.strategie.quelle) + '</pre></details>';
    h += '</div>';
    d.innerHTML = h;
  }
  function kurz(o) { var s = typeof o === 'string' ? o : JSON.stringify(o, null, 0); return s.length > 300 ? s.slice(0, 300) + '…' : s; }

  /* Bisher endete der Reiter hier in einer Sackgasse: eine Statuszeile nannte einen
   * Node-Befehl - klein, in einem <span>, nicht markierbar, ohne ein Wort dazu, WO er
   * laufen soll, und fuer einen Ordner, den der Installer gar nicht mitbrachte. Wer
   * keine Entwicklungsumgebung hat, kam nie zu einem Urteil.
   * Jetzt gibt es beides: den Knopf (die Maschine wird mitgeliefert, siehe unten) und
   * darueber weiterhin den fertigen Befehl zum Kopieren - fuer ein anderes Archiv, ein
   * anderes Protokollverzeichnis oder einfach, um zu sehen, was da eigentlich laeuft. */
  function naechsterSchritt(pfad) {
    var box = document.getElementById('stNaechster');
    if (!box) return;
    if (!pfad) { box.innerHTML = ''; box.hidden = true; return; }
    var befehl = 'node studien/messmaschine/messen.js "' + pfad + '"';
    box.hidden = false;
    box.innerHTML = '<div style="font-size:var(--fs-neben); margin-bottom:6px;"><b>Abgelegt.</b> Die Datei liegt unter ' +
      '<code>' + U.esc(pfad) + '</code>.</div>' +
      '<div style="font-size:var(--fs-neben); margin-bottom:6px;">Messen lässt sie sich mit dem Knopf unten – ' +
      'die Maschine läuft dabei in einem <b>eigenen Prozess</b>, nicht in der App. Wer lieber von Hand misst ' +
      'oder ein anderes Archiv prüfen will, nimmt den Befehl daneben – der läuft im <b>Projektordner</b>, ' +
      'also dort, wo die Quellen liegen.</div>' +
      '<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">' +
      '<code id="stBefehl" style="flex:1 1 320px; padding:6px 8px; background:var(--panel-2); ' +
      'border:1px solid var(--kante); border-radius:var(--r-normal); font-size:var(--fs-neben); overflow-x:auto; white-space:pre;">' +
      U.esc(befehl) + '</code>' +
      '<button class="btn ghost" type="button" id="stKopieren" style="padding:4px 10px; font-size:var(--fs-neben);">Befehl kopieren</button>' +
      '<span id="stKopiert" role="status" aria-live="polite" style="font-size:var(--fs-neben); color:var(--muted);"></span></div>' +
      '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:6px;">Das Protokoll erscheint danach oben im ' +
      'Scoreboard – die App liest den Ordner <code>Markt-Dashboard-Daten/protokolle</code>, egal wo gemessen wurde.</div>';
    var kb = document.getElementById('stKopieren');
    if (kb) kb.addEventListener('click', function () { kopiere(befehl); });
    var key = String(pfad).split(/[\\/]/).pop().replace(/\.js$/, '');
    messKnopfBauen(box, key);
  }

  /* ---------- Die Messung aus der App starten ----------
   * Der Reiter endete bis 8.26.0 in einer Sackgasse: ein Node-Befehl fuer einen Ordner,
   * den der Installer gar nicht mitbrachte. Wer keine Entwicklungsumgebung hat, kam nie
   * zu einem Urteil. Der Ordner wird jetzt mitgeliefert und die Maschine laeuft in einem
   * eigenen Prozess - sie kann das Fenster also nicht einfrieren, und ein Absturz dort
   * ist ein Fehlschlag der Messung, kein Absturz der App.
   *
   * Was sich NICHT aendert: Das Urteil kommt weiter aus der Maschine, nicht aus der App.
   * Sie rechnet dieselbe Rechnung wie am Terminal, schreibt dasselbe Protokoll und
   * verweigert genauso. Bequemer geworden ist der Weg dorthin, nicht das Urteil. */
  var messLaeuft = false;
  function messKnopfBauen(box, key) {
    if (!window.api || typeof window.api.messLauf !== 'function') return;
    var zeile = document.createElement('div');
    zeile.style.cssText = 'margin-top:10px; padding-top:10px; border-top:1px solid var(--kante);';
    zeile.innerHTML =
      '<div style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">' +
      '<button class="btn" type="button" id="stMessen">Jetzt messen</button>' +
      '<button class="btn ghost" type="button" id="stMessStop" hidden style="padding:4px 10px;">Abbrechen</button>' +
      '<span id="stMessStatus" role="status" aria-live="polite" style="font-size:var(--fs-neben); color:var(--muted);"></span></div>' +
      '<pre id="stMessLog" hidden style="margin-top:8px; max-height:260px; overflow:auto; padding:8px 10px; ' +
      'background:var(--panel-2); border:1px solid var(--kante); border-radius:var(--r-normal); ' +
      'font-size:var(--fs-klein); white-space:pre-wrap; line-height:1.45;"></pre>';
    box.appendChild(zeile);
    document.getElementById('stMessen').addEventListener('click', function () { messStarten(key); });
    document.getElementById('stMessStop').addEventListener('click', function () {
      if (window.api.messAbbrechen) window.api.messAbbrechen();
    });
  }

  async function messStarten(key) {
    if (messLaeuft) return;
    var knopf = document.getElementById('stMessen');
    var stop = document.getElementById('stMessStop');
    var st = document.getElementById('stMessStatus');
    var log = document.getElementById('stMessLog');
    messLaeuft = true;
    knopf.disabled = true; stop.hidden = false;
    log.hidden = false; log.textContent = '';
    st.textContent = 'Die Messung läuft – das dauert je nach Archiv einige Minuten.';
    var t0 = Date.now();
    var r = null;
    try { r = await window.api.messLauf(key); }
    catch (e) { r = { ok: false, grund: String(e && e.message || e) }; }
    messLaeuft = false;
    knopf.disabled = false; stop.hidden = true;
    var dauer = Math.round((Date.now() - t0) / 1000);
    if (!r) { st.textContent = 'Keine Antwort von der Messmaschine.'; return; }
    if (r.abgebrochen) {
      /* Selbst ausgeloest ist kein Fehlschlag. Ohne diesen Fall stand hier
       * "Die Messung ist nicht durchgelaufen (Rueckgabewert null)" - der Prozess wird
       * per Signal beendet, einen Rueckgabewert gibt es dann gar nicht. */
      st.textContent = 'Abgebrochen. Es wurde kein Protokoll geschrieben.';
      return;
    }
    if (r.verweigert) {
      /* VERWEIGERT ist ein URTEIL, kein Fehler - die Maschine lehnt eine Strategie ab,
       * die ihre Bedingungen nicht erfuellt. Das muss anders aussehen als ein Absturz,
       * sonst sucht man den Fehler im Programm statt in der These. */
      st.innerHTML = '<b style="color:var(--muted);">Die Maschine hat die Messung verweigert</b> – das ist ein Urteil, ' +
        'kein Fehler. Der Grund steht unten.';
      return;
    }
    if (!r.ok) {
      st.innerHTML = '<b class="neg">Die Messung ist nicht durchgelaufen</b>' +
        (r.grund ? ' – ' + U.esc(r.grund) : ' (Rückgabewert ' + r.code + ')');
      if (r.ausgabe && !log.textContent) log.textContent = r.ausgabe;
      return;
    }
    st.innerHTML = '<b class="pos">Fertig</b> nach ' + dauer + ' s. Das Protokoll steht jetzt oben im Scoreboard.';
    try { await laden(); } catch (e) { /* die Liste kommt beim naechsten Oeffnen */ }
  }

  if (window.api && typeof window.api.onMessFortschritt === 'function') {
    window.api.onMessFortschritt(function (d) {
      var log = document.getElementById('stMessLog');
      if (!log) return;
      log.textContent += d.text;
      log.scrollTop = log.scrollHeight;   // mitlaufen, sonst sieht man nur den Anfang
    });
  }
  /* file:// ist kein sicherer Kontext, navigator.clipboard kann also fehlen.
   * Deshalb zuerst der moderne Weg, dann der alte - und wenn beides nicht geht,
   * wird der Befehl wenigstens markiert, statt still nichts zu tun. */
  function kopiere(text) {
    var hin = document.getElementById('stKopiert');
    function sag(t) { if (hin) { hin.textContent = t; setTimeout(function () { if (hin) hin.textContent = ''; }, 4000); } }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { sag('kopiert'); }, function () { altWeg(text, sag); });
      return;
    }
    altWeg(text, sag);
  }
  function altWeg(text, sag) {
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', '');
      ta.style.position = 'fixed'; ta.style.left = '-9999px';
      document.body.appendChild(ta); ta.select();
      var ok2 = document.execCommand('copy');
      document.body.removeChild(ta);
      sag(ok2 ? 'kopiert' : 'nicht kopiert – bitte von Hand markieren');
    } catch (e) {
      var c = document.getElementById('stBefehl');
      if (c && window.getSelection) {
        var rg = document.createRange(); rg.selectNodeContents(c);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(rg);
      }
      sag('nicht kopiert – der Befehl ist markiert');
    }
  }

  /* ---------- Baukasten und Expertenmodus ----------
   * Das Formular verlangte JavaScript. Wer nicht programmiert, kam nicht bis zu einer
   * Messung - das Feld war nicht schwer zu bedienen, es war schlicht unbedienbar.
   *
   * Eine beliebige Handelsidee laesst sich aber nicht anklicken. Deshalb zwei Wege,
   * nicht einer: Der Baukasten deckt die haeufigen Muster ab und schreibt den Code
   * selbst; der Expertenmodus ist das alte Formular, unveraendert. Nichts faellt weg.
   *
   * Der erzeugte Code steht immer sichtbar daneben und laesst sich uebernehmen - so
   * ist der Baukasten auch ein Lehrmittel und keine Sackgasse.
   *
   * Was er NICHT ausfuellt, ist der Grund. Der ist die Vorregistrierung; wuerde die App
   * ihn schreiben, waere die Huerde weg, die diese ganze Maschine traegt. */
  var modus = 'bau';
  function modusLesen() {
    try { return window.localStorage.getItem('stModus') === 'experte' ? 'experte' : 'bau'; }
    catch (e) { return 'bau'; }   // file:// ohne Speicher, privates Fenster: dann eben Baukasten
  }
  function modusSchreiben(m) {
    try { window.localStorage.setItem('stModus', m); } catch (e) { /* nicht schlimm */ }
  }

  function modusSetzen(m) {
    modus = m;
    var bau = document.getElementById('stBaukasten');
    var exp = document.getElementById('stExperte');
    var kb = document.getElementById('stModusBau');
    var ke = document.getElementById('stModusExperte');
    var txt = document.getElementById('stModusText');
    if (!bau || !exp) return;
    bau.hidden = m !== 'bau';
    exp.hidden = m !== 'experte';
    kb.className = m === 'bau' ? 'btn' : 'btn ghost';
    ke.className = m === 'experte' ? 'btn' : 'btn ghost';
    kb.setAttribute('aria-checked', m === 'bau' ? 'true' : 'false');
    ke.setAttribute('aria-checked', m === 'experte' ? 'true' : 'false');
    txt.textContent = m === 'bau'
      ? 'Zusammenklicken – die App schreibt den Code.'
      : 'Eigener Code: volle Freiheit, auch für Regeln, die der Baukasten nicht kennt.';
    modusSchreiben(m);
  }

  /** Die Felder des gewaehlten Musters zeichnen. */
  function felderZeichnen() {
    var B = window.Baukasten;
    var wo = document.getElementById('stFelder');
    var sel = document.getElementById('stMuster');
    if (!B || !wo || !sel) return;
    var m = B.musterVon(sel.value);
    var kurz = document.getElementById('stMusterKurz');
    if (kurz) kurz.textContent = m ? m.kurz : '';
    wo.innerHTML = '';
    if (!m) return;
    m.felder.forEach(function (f) {
      var l = document.createElement('label');
      l.style.cssText = 'font-size:var(--fs-neben);';
      l.innerHTML = U.esc(f.frage) +
        '<input class="stFeld" data-feld="' + U.esc(f.name) + '" value="' + U.esc(f.vorgabe) + '" style="width:100%;">' +
        '<span style="display:block; font-size:var(--fs-klein); color:var(--muted);">' + U.esc(f.hilfe) +
        ' Mehrere Werte zum Durchprobieren mit Komma trennen (z. B. <code>4, 6, 8</code>) – ' +
        'jeder ist dann eine eigene Messung.</span>';
      wo.appendChild(l);
    });
    wo.querySelectorAll('.stFeld').forEach(function (el) {
      el.addEventListener('input', vorschau);
    });
    var key = document.getElementById('stKey');
    /* Den Kurznamen vorschlagen, aber nur solange niemand selbst getippt hat. Er ist
     * eine Kennung, keine These - ihn vorzuschlagen nimmt niemandem das Nachdenken ab. */
    if (key && !key.dataset.selbst) key.value = m.kennung + (richtungJetzt() === -1 ? '-verkauf' : '-kauf');
    vorschau();
  }

  function richtungJetzt() {
    var r = document.getElementById('stRichtung');
    return (r && r.value === 'short') ? -1 : 1;
  }

  /** Was ist gerade eingestellt? Fuer Vorschau und Ablegen dieselbe Quelle. */
  function baukastenWahl() {
    var werte = {};
    document.querySelectorAll('#stFelder .stFeld').forEach(function (el) {
      werte[el.dataset.feld] = el.value;
    });
    var sel = document.getElementById('stMuster');
    var r = document.getElementById('stRichtung');
    return { muster: sel ? sel.value : '', richtung: r ? r.value : 'long', werte: werte };
  }

  /** Satz, Testzahl und Code nachziehen - bei jeder Aenderung. */
  function vorschau() {
    var B = window.Baukasten;
    var satzEl = document.getElementById('stSatz');
    var codeEl = document.getElementById('stCodeVorschau');
    if (!B || !satzEl) return;
    var r = B.baue(baukastenWahl());
    if (!r.ok) {
      satzEl.innerHTML = '<b class="neg">' + U.esc(r.fehler) + '</b>';
      if (codeEl) codeEl.textContent = '';
      return;
    }
    var halten = parseInt((document.getElementById('stHalten') || {}).value, 10) || 8;
    /* h4 statt <b>: "Gemessen wird" WAR schon die Ueberschrift dieses Kastens, nur
     * als Fettschrift geschrieben. Als Ueberschrift ausgezeichnet, gehoert der Satz
     * zu seinem eigenen Abschnitt statt zum Dauertext des Formulars (U5, 04.09.2026).
     * Der Wortlaut aendert sich nicht - das hier ist eine Vorregistrierung. */
    satzEl.innerHTML = '<h4 style="margin:0 0 4px; font-size:var(--fs-neben);">Gemessen wird</h4>' + U.esc(r.satz) +
      ' Danach ' + halten + ' Stunde(n) halten, dann verkaufen.' +
      (r.tests > 1
        ? '<br><span class="neg">' + r.tests + ' Varianten = ' + r.tests + ' Messungen.</span> ' +
          'Die Hürde steigt mit jeder: Wer oft genug würfelt, würfelt irgendwann eine Sechs, und ' +
          'die Maschine rechnet das heraus.'
        : '');
    if (codeEl) codeEl.textContent = r.signal;
    grundHilfe(r.warum);
  }

  /** Der Denkanstoss zum Grund - je Muster einer, der die SORTE Begruendung nennt. */
  function grundHilfe(warum) {
    var el = document.getElementById('stGrundHilfe');
    if (!el) return;
    /* Stufe 3 (03.09.2026): Die zweite Haelfte ("Trägt nicht: ...") war auf jedem Muster
     * derselbe Satz - Dauertext neben einem Feld. Sie steht woertlich im Register unter
     * messung.eingabe, erreichbar ueber den i-Knopf der Ueberschrift. Sichtbar bleibt
     * die erste Haelfte: sie WECHSELT mit dem gewaehlten Muster und ist der Anstoss,
     * um den es hier geht. */
    /* h4 statt <b>, aus demselben Grund wie oben bei #stSatz: der Anstoss ist ein
     * eigener Abschnitt, kein Absatz im Formular (U5, 04.09.2026). */
    el.innerHTML =
      '<h4 style="margin:0 0 3px; font-size:var(--fs-klein); color:var(--ink-2);">Trägt</h4>' +
      U.esc(warum || 'Jemand muss handeln – aus Vorschrift, Termin oder Zwang – und das ist vorher bekannt.');
  }

  /** Klartext unter den gemeinsamen Feldern. Kerzen, Basispunkte und „Long“ sind Fachsprache. */
  function klartext() {
    var h = parseInt((document.getElementById('stHalten') || {}).value, 10);
    var ht = document.getElementById('stHaltenText');
    if (ht) {
      ht.textContent = (h >= 1)
        ? h + ' Stundenkerze(n) – rund ' + (h / 7).toFixed(1).replace('.', ',') + ' Handelstage.'
        : 'Zwischen 1 und 130 Kerzen.';
    }
    var s = parseFloat((document.getElementById('stSpanne') || {}).value);
    var sp = document.getElementById('stSpanneText');
    if (sp) {
      sp.textContent = isFinite(s)
        ? s + ' Basispunkte = ' + (s / 100).toFixed(2).replace('.', ',') + ' % je Kauf und je Verkauf.'
        : 'In Basispunkten; 5 sind 0,05 %.';
    }
    var r = document.getElementById('stRichtung');
    var rt = document.getElementById('stRichtungText');
    if (r && rt) {
      rt.textContent = r.value === 'short' ? 'Steigende Kurse schaden, fallende nützen.'
        : r.value === 'beide' ? 'Beide Richtungen – der Baukasten erzeugt trotzdem ein Kaufsignal.'
        : 'Sie erwarten steigende Kurse.';
    }
    var g = document.getElementById('stGrund');
    var gz = document.getElementById('stGrundZaehler');
    if (g && gz) {
      var n = g.value.trim().length;
      gz.textContent = n >= 20 ? '(' + n + ' Zeichen)' : '(' + n + ' von mindestens 20 Zeichen)';
      gz.className = n >= 20 ? '' : 'neg';
    }
  }

  function baukastenAufbauen() {
    var B = window.Baukasten;
    var sel = document.getElementById('stMuster');
    /* Der Waechter stand VOR der Verdrahtung der beiden Modus-Knoepfe. Fehlte der
     * Baukasten, war damit auch der AUSWEG tot: "Expertenmodus" reagierte auf keinen
     * Klick mehr, und der ganze Weg "Strategie ablegen und messen" war ohne eine
     * einzige Meldung unerreichbar. Ein Waechter darf den Notausgang nicht mit
     * verriegeln - die Knoepfe kommen deshalb zuerst. */
    var kBau = document.getElementById('stModusBau'), kExp = document.getElementById('stModusExperte');
    if (kBau) kBau.addEventListener('click', function () { modusSetzen('bau'); });
    if (kExp) kExp.addEventListener('click', function () { modusSetzen('experte'); });
    if (!B || !sel) {
      var stat0 = document.getElementById('stStatus');
      if (stat0) stat0.textContent = 'Der Baukasten ist nicht geladen – nur der Expertenmodus steht zur Verfügung.';
      return;
    }
    sel.innerHTML = B.MUSTER.map(function (m) {
      return '<option value="' + U.esc(m.id) + '">' + U.esc(m.name) + '</option>';
    }).join('');
    sel.addEventListener('change', felderZeichnen);
    var key = document.getElementById('stKey');
    if (key) key.addEventListener('input', function () { key.dataset.selbst = '1'; });
    ['stHalten', 'stSpanne', 'stRichtung', 'stGrund'].forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.addEventListener('input', function () { klartext(); vorschau(); });
      if (el && el.tagName === 'SELECT') el.addEventListener('change', function () { klartext(); felderZeichnen(); });
    });
    var ueb = document.getElementById('stUebernehmen');
    if (ueb) {
      ueb.addEventListener('click', function () {
        var r = B.baue(baukastenWahl());
        if (!r.ok) return;
        document.getElementById('stSignal').value = r.signal;
        document.getElementById('stVarianten').value = r.varianten ? JSON.stringify(r.varianten) : '';
        modusSetzen('experte');
      });
    }
    modusSetzen(modusLesen());
    felderZeichnen();
    klartext();
  }

  /* ---------- Eingabe: neue Strategie ablegen ---------- */
  function eingabe() {
    var btn = document.getElementById('stAblegen');
    if (!btn) return;
    btn.addEventListener('click', async function () {
      var st = document.getElementById('stStatus');
      var key = (document.getElementById('stKey').value || '').trim().toLowerCase();
      var grund = (document.getElementById('stGrund').value || '').trim();
      var sig = (document.getElementById('stSignal').value || '').trim();
      var ausBaukasten = null;
      var halten = parseInt(document.getElementById('stHalten').value, 10);
      var richtung = document.getElementById('stRichtung').value;
      var spanne = parseFloat(document.getElementById('stSpanne').value);
      var varTxt = (document.getElementById('stVarianten').value || '').trim();
      var stop = (document.getElementById('stStop').value || '').trim();
      /* Im Baukasten kommt die Regel nicht aus den Textfeldern, sondern aus der
       * Auswahl. Alles danach - Pruefung, Dateiaufbau, Ablegen - ist fuer beide Wege
       * dasselbe: Was die Maschine bekommt, unterscheidet sich nicht danach, wie es
       * entstanden ist. */
      if (modus === 'bau') {
        ausBaukasten = window.Baukasten ? window.Baukasten.baue(baukastenWahl()) : null;
        if (!ausBaukasten) { st.textContent = 'Der Baukasten ist nicht geladen. Bitte den Expertenmodus benutzen.'; return; }
        if (!ausBaukasten.ok) { st.textContent = ausBaukasten.fehler; return; }
        sig = ausBaukasten.signal;
        stop = '';
        varTxt = ausBaukasten.varianten ? JSON.stringify(ausBaukasten.varianten) : '';
      }
      if (!/^[a-z0-9][a-z0-9-]{1,40}$/.test(key)) { st.textContent = 'Kurzname: nur Kleinbuchstaben, Ziffern, Bindestrich.'; return; }
      if (grund.length < 20) {
        st.textContent = 'Es fehlt der Grund (' + grund.length + ' von mindestens 20 Zeichen). ' +
          'Ohne ihn verweigert die Maschine die Messung – das ist Absicht, nicht Schikane.'; return;
      }
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
        if (r && r.ok) { st.textContent = ''; naechsterSchritt(r.pfad); }
        else { naechsterSchritt(null); st.textContent = 'Nicht abgelegt: ' + (r && r.grund || 'unbekannter Fehler'); }
      } catch (e) { st.textContent = 'Fehler: ' + (e && e.message || e); }
      btn.disabled = false;
    });
  }


  /* ================= Strategien: eine Liste statt zwei Ordner =================
   *
   * Bis zum 25.08.2026 gab es diese Liste nicht. Strategien entstehen an zwei Orten -
   * der Baukasten schreibt in den Datenordner, die Messmaschine misst das
   * Projektverzeichnis -, und die App las nur den ersten. Im Reiter Messung stand
   * damit EINE Strategie, waehrend zwoelf gemessene existierten. Die Bruecke
   * messStrategien war gebaut, aber niemand rief sie auf: ein Kanal ohne Verbraucher.
   *
   * Der Beleg, dass das schon geschadet hat: monatsende-kauf hat ein committetes
   * Protokoll mit Urteil, seine Datei liegt aber nur im Datenordner. Das Ergebnis ist
   * versioniert, der Code dahinter nicht - die Messung ist aus dem Projekt allein
   * nicht nachzurechnen. Genau dieser Fall bekommt hier eine eigene Zeile.
   *
   * Die Karte rechnet nichts. Sie liest zwei Ordner und die Protokolle. */
  /* Fuer das Urteil gibt es keine eigene Tabelle mehr - die Liste liest dieselbe
   * Beschriftung wie das Scoreboard darueber (label()). HERKUNFT_TEXT bleibt: der Ort
   * einer Strategie ist keine Messaussage, sondern eine Eigenschaft dieser Liste. */
  var HERKUNFT_TEXT = { lokal: 'nur lokal', quelle: 'Projekt', beides: 'beides' };

  function tagKurz(ms) {
    if (!ms) return '–';
    return new Date(ms).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
  }
  function keyListe(a) { return a.map(function (z) { return U.esc(z.key); }).join(', '); }

  async function strategienLaden() {
    var el = document.getElementById('strategienListe');
    var fuss = document.getElementById('strategienFuss');
    if (!el) return;
    if (!window.api || !window.api.messStrategien || !window.api.readProtokolle) {
      el.innerHTML = '<div style="color:var(--muted); font-size:var(--fs-neben);">Diese Fassung kennt die Strategieliste noch nicht.</div>';
      return;
    }
    var s = null, p = null;
    try { s = await window.api.messStrategien(); } catch (e) { s = { ok: false, grund: String(e && e.message || e) }; }
    try { p = await window.api.readProtokolle(); } catch (e) { p = null; }
    if (!s || !s.ok) {
      el.innerHTML = '<div style="color:var(--muted); font-size:var(--fs-neben);">Strategien nicht lesbar' +
        (s && s.grund ? ': ' + U.esc(s.grund) : '') + '.</div>';
      return;
    }

    /* Protokolle je Kennung, juengstes zuerst - dieselbe Gruppierung wie im Scoreboard,
     * hier nur fuer Zahl, Datum und Urteil. */
    var jeKey = {};
    ((p && p.ok && p.protokolle) || []).forEach(function (x) {
      var k = x.protokoll && x.protokoll.strategie && x.protokoll.strategie.key;
      if (!k) return;
      (jeKey[k] = jeKey[k] || []).push(x);
    });
    Object.keys(jeKey).forEach(function (k) {
      jeKey[k].sort(function (a, b) { return b.mtime - a.mtime; });
    });

    var zeilen = (s.liste || []).map(function (st) {
      var pr = jeKey[st.key] || [];
      /* B10 (01.09.2026): neben der rohen Kennung eine lesbare Kurzbeschreibung -
       * der erste grund-Halbsatz aus dem Protokoll (bevorzugt) oder der Datei.
       * Kein neues Namensregister: der grund IST der Vertragstext der Strategie. */
      var grund = (pr.length && pr[0].protokoll.strategie && pr[0].protokoll.strategie.grund) || st.grundKurz || null;
      return { key: st.key, herkunft: st.herkunft || 'lokal', laeufe: pr.length,
        zuletzt: pr.length ? pr[0].mtime : 0, grund: grund,
        urteil: pr.length ? pr[0].protokoll.bestesUrteil : null, hatDatei: true };
    });
    /* Ein Protokoll ohne auffindbare Datei ist der unangenehme Fall: das Ergebnis steht,
     * die Regel dahinter ist weg. Es bekommt eine Zeile, statt einfach zu fehlen. */
    Object.keys(jeKey).forEach(function (k) {
      if (zeilen.some(function (z) { return z.key === k; })) return;
      var pr = jeKey[k];
      zeilen.push({ key: k, herkunft: null, laeufe: pr.length, zuletzt: pr[0].mtime,
        urteil: pr[0].protokoll.bestesUrteil, hatDatei: false });
    });

    if (!zeilen.length) {
      el.innerHTML = '<div style="color:var(--muted); font-size:var(--fs-neben);">Noch keine Strategie – unten eine anlegen.</div>';
      if (fuss) fuss.innerHTML = '';
      return;
    }

    /* Gemessene zuerst, nie gemessene danach, verwaiste Protokolle ganz unten:
     * sie sind die Ausnahme, nicht der Bestand. */
    zeilen.sort(function (a, b) {
      if (a.hatDatei !== b.hatDatei) return a.hatDatei ? -1 : 1;
      if (!!a.laeufe !== !!b.laeufe) return a.laeufe ? -1 : 1;
      return (b.zuletzt || 0) - (a.zuletzt || 0);
    });

    /* Die Spalte "Ort" trug in allen zwölf Zeilen denselben Wert. Eine Spalte ohne
     * Unterschied trägt keine Information, kostet aber Breite und lässt die Tabelle
     * voller aussehen, als sie ist. Sie erscheint deshalb nur, wenn es wirklich mehr
     * als einen Ort gibt; der eine Ort geht nicht verloren, er wandert aus der
     * Wiederholung in einen Satz darunter.
     * "Datei fehlt" ist dabei keine Ortsangabe, sondern eine Warnung - sie darf auch
     * dann nicht verschwinden, wenn sie in jeder Zeile stünde. */
    var orte = [];
    zeilen.forEach(function (z) {
      z.ort = z.hatDatei ? (HERKUNFT_TEXT[z.herkunft] || z.herkunft || '?') : 'Datei fehlt';
      if (orte.indexOf(z.ort) === -1) orte.push(z.ort);
    });
    var ortSpalte = orte.length > 1 || zeilen.some(function (z) { return !z.hatDatei; });

    /* ---- Struktur-Audit Punkt 4: was die App aus einer Regel gerade MACHT ----
     * Der Lebenszyklus einer Regel (gemessen -> handelt / zeichnet auf / Buch laeuft)
     * war bisher nirgends verbunden: das Scoreboard wusste nicht, dass eine Kennung
     * im Betrieb ist. Die Quelle ist der Depot-Zustand (DepotAPI.regelStatus) - eine
     * Zustandsauskunft, KEIN Urteil; sie steht deshalb als eigene Spalte neben dem
     * Urteil und faerbt nichts davon um. Die Spalte erscheint nur, wenn mindestens
     * eine Kennung im Betrieb ist - das Muster der Ort-Spalte. */
    var rs = (window.DepotAPI && window.DepotAPI.regelStatus) ? window.DepotAPI.regelStatus() : null;
    function betriebVon(key) {
      if (!rs) return null;
      var t = [];
      if (rs.modus === key) {
        t.push(rs.intradayAn ? 'handelt (Intraday)'
          : (rs.schatten ? 'eingestellt – Handel aus, Schattenbuch zeichnet auf' : 'eingestellt – Handel aus'));
      }
      if (key === 'kapitulation' && rs.kapiZusatz && rs.modus !== 'kapitulation') {
        t.push(rs.intradayAn ? 'handelt als Zusatz-Standbein' : 'als Zusatz eingestellt – Handel aus');
      }
      if (key === 'momentum' && rs.momentumAn) t.push('Momentum-Buch handelt virtuell');
      if ((key === 'drift' || key === 'ergebnis-drift') && rs.driftAn) t.push('Drift-Buch handelt virtuell');
      (rs.messRegeln || []).forEach(function (r) {
        if (r.modus === key) t.push('läuft als Mess-Regel „' + r.name + '“');
      });
      return t.length ? t.join(' · ') : null;
    }
    REGISTER_N = zeilen.length;
    zeilen.forEach(function (z) { z.betrieb = betriebVon(z.key); });
    var betriebSpalte = zeilen.some(function (z) { return !!z.betrieb; });

    /* B10 (01.09.2026): Vor der ersten Messung wiederholten Laeufe/Zuletzt in jeder
     * Zeile nur Striche - dasselbe Muster wie die Ort-Spalte: eine Spalte ohne einen
     * einzigen Wert erscheint nicht, ein Satz darunter sagt warum. */
    var laufSpalte = zeilen.some(function (z) { return z.laeufe > 0; });
    var html = '<table style="width:100%; border-collapse:collapse; font-size:var(--fs-neben);">' +
      '<thead><tr style="text-align:left; color:var(--muted);">' +
      '<th scope="col" style="padding:4px 8px 4px 0;">Strategie</th>' +
      (ortSpalte ? '<th scope="col" style="padding:4px 8px;">Ort</th>' : '') +
      (laufSpalte ? '<th scope="col" style="padding:4px 8px; text-align:right;">Läufe</th>' +
        '<th scope="col" style="padding:4px 8px;">Zuletzt</th>' : '') +
      '<th scope="col" style="padding:4px 0;">Urteil</th>' +
      (betriebSpalte ? '<th scope="col" style="padding:4px 0 4px 8px;">Im Betrieb</th>' : '') +
      '</tr></thead><tbody>';
    zeilen.forEach(function (z) {
      var ort = z.hatDatei ? U.esc(z.ort) : '<b>Datei fehlt</b>';
      /* Kein eigener Rueckfall mehr auf den rohen Schluessel: label() hat einen, und
       * er ist der bessere - er macht aus dem Nullpunkt-Urteil dieselbe Beschriftung
       * wie oben im Scoreboard. Nur der Fall "gemessen, aber ohne Urteil im Protokoll"
       * gehoert hierher, den kennt label() nicht. */
      var urteil = !z.laeufe ? '<span style="color:var(--muted);">nie gemessen</span>'
        : U.esc(z.urteil ? label(z.urteil) : 'ohne Urteil');
      /* Stufe 3 (03.09.2026): Bis hierher schnitt die Zeile den Grund nach 110 Zeichen
       * ab - mitten im Satz ("... auf und werden ueber"). Das ist der VERTRAGSTEXT der
       * Strategie, also eine Vorregistrierung; ein halber Satz davon sagt nichts und
       * sieht aus wie ein Anzeigefehler. Gezeigt wird jetzt der erste ABSATZ der Quelle,
       * ungekuerzt. Getrennt wird an einer Leerzeile - hat der Text keine (das ist
       * heute bei allen 27 Protokollen so), steht er ganz da.
       * KEINE Umlaut-Ersetzung: die Quellen sind ASCII geschrieben ("Boersenschluss"),
       * und ein automatisches ue->ue-Zurueckdrehen traefe auch "Steuer" und "Neuer".
       * Der Text bleibt so, wie die Strategie ihn abgelegt hat. */
      var grundKurz = z.grund ? String(z.grund).split(/\n\s*\n/)[0].trim() : '';
      html += '<tr style="border-top:1px solid var(--grid);">' +
        '<td style="padding:5px 8px 5px 0; max-width:340px;"><code>' + U.esc(z.key) + '</code>' +
        (grundKurz ? '<div style="color:var(--muted); font-size:var(--fs-klein); font-family:inherit; line-height:1.4;">' + U.esc(grundKurz) + '</div>' : '') +
        '</td>' +
        (ortSpalte ? '<td style="padding:5px 8px;">' + ort + '</td>' : '') +
        (laufSpalte ? '<td style="padding:5px 8px; text-align:right;">' + (z.laeufe || '–') + '</td>' +
          '<td style="padding:5px 8px;">' + tagKurz(z.zuletzt) + '</td>' : '') +
        '<td style="padding:5px 0;">' + urteil + '</td>' +
        (betriebSpalte ? '<td style="padding:5px 0 5px 8px;">' +
          (z.betrieb ? U.esc(z.betrieb) : '<span style="color:var(--muted);">–</span>') + '</td>' : '') +
        '</tr>';
    });
    el.innerHTML = html + '</tbody></table>' +
      (laufSpalte ? '' : '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:6px;">' +
        'Noch kein Messprotokoll – die Spalten Läufe und Zuletzt erscheinen nach der ersten Messung.</div>') +
      ((s.hilfen && s.hilfen.length) ? '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:6px;">' +
        'Nicht gelistet: ' + s.hilfen.length + ' Hilfsdatei(en) der Maschine (' +
        s.hilfen.map(function (h) { return U.esc(h.key); }).join(', ') +
        ') – sie exportieren keinen Messkandidaten.</div>' : '') +
      (ortSpalte ? '' : '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:6px;">' +
        'Ort aller ' + zeilen.length + ' Strategien: ' + U.esc(orte[0] || '?') + '.</div>') +
      (betriebSpalte ? '<div style="color:var(--muted); font-size:var(--fs-klein); margin-top:6px;">' +
        '„Im Betrieb“ sagt, was die App aus einer Regel gerade macht (Reiter Regeln) – ' +
        'das ist Depot-Zustand, kein Urteil.</div>' : '');

    /* Was FEHLT, gehoert ausdruecklich hierhin. Eine Liste, die stillschweigend die
     * Haelfte weglaesst, ist schlimmer als gar keine. */
    var nurLokal = zeilen.filter(function (z) { return z.hatDatei && z.herkunft === 'lokal'; });
    var ohneDatei = zeilen.filter(function (z) { return !z.hatDatei; });
    var nieGemessen = zeilen.filter(function (z) { return z.hatDatei && !z.laeufe; });
    var t = [];
    if (!s.quelle) {
      t.push('<b>Das Projektverzeichnis ist nicht auffindbar</b> – gezeigt sind nur die Strategien aus dem ' +
        'Datenordner. In der installierten Fassung ist es nicht mitverpackt; ein Zettel ' +
        '<code>quelle-pfad.txt</code> im Datenordner darf darauf zeigen.');
    }
    if (ohneDatei.length) {
      t.push('<b>' + ohneDatei.length + ' Protokoll(e) ohne Datei</b> (' + keyListe(ohneDatei) +
        '): Das Ergebnis liegt vor, die Regel dahinter ist nicht auffindbar – es lässt sich nicht nachrechnen.');
    }
    if (nurLokal.length) {
      t.push(nurLokal.length + ' Strategie(n) liegen <b>nur im Datenordner</b> (' + keyListe(nurLokal) +
        ') – nicht versioniert. Geht der Ordner verloren, ist die Regel weg.');
    }
    if (nieGemessen.length) {
      t.push(nieGemessen.length + ' <b>nie gemessen</b> (' + keyListe(nieGemessen) +
        ') – es gibt die Regel, aber kein Ergebnis. Das ist etwas anderes als ein schlechtes Ergebnis.');
    }
    if (fuss) {
      fuss.innerHTML = t.length ? t.join(' ')
        : 'Alle Strategien liegen im Projektverzeichnis und haben ein Protokoll.';
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    eingabe();
    baukastenAufbauen();
    /* Bis Stufe 1 des Umzugs (02.09.2026) hing das Nachladen am Reiter "Messung".
     * Den gibt es nicht mehr: Scoreboard, Strategieregister und Eingabe sind drei
     * Klappen unter Werkzeuge -> Betrieb. Die Shell meldet jedes Aufklappen als
     * 'sub-changed' mit dem Klappennamen - jede Klappe laedt genau das, was sie
     * zeigt, statt beim Oeffnen einer beliebigen anderen mitzulaufen. */
    document.addEventListener('sub-changed', function (ev) {
      var sub = ev && ev.detail && ev.detail.sub;
      if (sub === 'scoreboard') laden();
      if (sub === 'strategieregister') strategienLaden();
    });
    setTimeout(function () { laden(); strategienLaden(); }, 4000);
  });
  /* registerStand() ist eine reine Leseauskunft: null heisst "noch nicht geladen",
   * eine Zahl heisst "so viele Strategien standen beim letzten Laden im Register".
   * Die Statuszeile im Klappentitel unterscheidet beides - "0" und "noch nichts
   * gelesen" sind von aussen sonst nicht zu trennen (wiki/fehlerformen.md). */
  window.Scoreboard = { laden: laden, strategien: strategienLaden,
    registerStand: function () { return REGISTER_N; } };
})();
