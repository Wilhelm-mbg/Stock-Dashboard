'use strict';
/* App-Shell: Tabs, Modals, Einstellungen, gemeinsame Helfer */
(function () {
  var U = {
    esc: function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); },
    // Nur echte Web-Links ins DOM lassen: Feed-URLs kommen von außen. javascript:-Links
    // blockiert zwar schon die CSP, aber ein Link, der nichts tut, ist besser als einer,
    // der sich allein auf die CSP verlässt.
    safeUrl: function (u) {
      try { var x = new URL(String(u)); return (x.protocol === 'https:' || x.protocol === 'http:') ? x.href : '#'; }
      catch (e) { return '#'; }
    },
    nf2: new Intl.NumberFormat('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    nf0: new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }),
    money: function (v) { return U.nf2.format(v) + ' $'; },
    dt: function (ms) { return new Date(ms).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) + ' Uhr'; },
    d: function (ms) { return new Date(ms).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' }); },
    signCls: function (v) { return v > 0 ? 'pos' : (v < 0 ? 'neg' : ''); },
    signTxt: function (v, unit) { return (v > 0 ? '+' : '') + U.nf2.format(v) + (unit || ''); },
    // Mini-Markdown (Überschriften, Listen, fett) für die Analyse-Ausgabe
    md: function (txt) {
      var lines = String(txt).split(/\r?\n/), out = [], inList = false;
      function fmtInline(s) {
        return U.esc(s).replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>').replace(/\*([^*]+)\*/g, '<i>$1</i>');
      }
      for (var i = 0; i < lines.length; i++) {
        var l = lines[i];
        if (/^\s*[-*•]\s+/.test(l)) {
          if (!inList) { out.push('<ul>'); inList = true; }
          out.push('<li>' + fmtInline(l.replace(/^\s*[-*•]\s+/, '')) + '</li>');
          continue;
        }
        if (inList) { out.push('</ul>'); inList = false; }
        if (/^\s*#{1,4}\s+/.test(l)) out.push('<h4>' + fmtInline(l.replace(/^\s*#{1,4}\s+/, '')) + '</h4>');
        else if (l.trim() === '') out.push('');
        else out.push('<p>' + fmtInline(l) + '</p>');
      }
      if (inList) out.push('</ul>');
      return out.join('\n');
    },

    /* ---- Wiederholungs-Waende buendeln (Audit 25.08.2026, Befund B2) ----
     * Listen mit einem Status je Zeile laufen zu Waenden auf: dreissig Zeilen
     * "Kursreihe zu kurz (148 < 261 Kerzen)" sagen dasselbe wie eine Zeile mit einem
     * Zaehler. Gebuendelt wird deshalb am STATUS, nicht am Text - dieselbe Begruendung
     * mit anderen Zahlen ist derselbe Status.
     * Der Wortlaut bleibt dabei unangetastet: die Einzelzeilen stehen woertlich in der
     * Klappe, und die Sammelzeile setzt die Ellipse nur dort, wo sich die Zahlen
     * zwischen den Zeilen wirklich unterscheiden - eine gemessene Konstante wie
     * "261 Kerzen" bleibt damit sichtbar. Gruende sind Messaussagen (Leitplanke 1);
     * gezaehlt wird, nicht umformuliert. */
    ZAHL: /(-?\d+(?:[.,]\d+)?)/,
    AGG_AB: 5,
    /* Schluessel einer Gruppe: derselbe Satz mit anderen Zahlen ergibt denselben Wert.
     * Trennzeichen ist U+0001 und nicht die Ellipse, damit ein Text, der selbst eine
     * Ellipse traegt, keine fremde Gruppe trifft. Nur intern - nie angezeigt. */
    statusKern: function (s) {
      return String(s == null ? '' : s).split(U.ZAHL)
        .filter(function (_, i) { return i % 2 === 0; }).join('\u0001');
    },
    /* Titel der Sammelzeile, gebildet aus den Einzeltexten selbst: fester Text bleibt
     * woertlich, und nur die Zahlen, die sich zwischen den Zeilen unterscheiden, werden
     * zur Ellipse. Nichts wird umformuliert und nichts gekuerzt. */
    statusTitel: function (texte) {
      var teile = texte.map(function (t) { return String(t == null ? '' : t).split(U.ZAHL); });
      return teile[0].map(function (stueck, i) {
        if (i % 2 === 0) return stueck;
        return teile.every(function (t) { return t[i] === stueck; }) ? stueck : '…';
      }).join('');
    },
    /* posten: [{ status, html }] - html ist eine fertige <tr>-Zeile, status ihr Grund.
     * status null/'' heisst: diese Zeile wird NIE gebuendelt (etwa ein eroeffneter
     * Trade). opt: { spalten, kopf, was, grenze }.
     * Eine Gruppe steht an der Stelle ihres ERSTEN Mitglieds - die Sortierung der
     * aufrufenden Liste bleibt damit unangetastet. */
    wandBuendeln: function (posten, opt) {
      opt = opt || {};
      var grenze = opt.grenze != null ? opt.grenze : U.AGG_AB;
      var spalten = opt.spalten || 1, was = opt.was || 'Zeilen', kopf = opt.kopf || '';
      var schluessel = posten.map(function (p) { return p.status ? U.statusKern(p.status) : null; });
      /* Object.create(null): die Gruende kommen aus Daten - "__proto__" darf kein
       * Sonderfall werden. */
      var gruppen = Object.create(null);
      schluessel.forEach(function (k, i) {
        if (!k) return;
        if (!gruppen[k]) gruppen[k] = [];
        gruppen[k].push(i);
      });
      var raus = '', gezeigt = Object.create(null);
      schluessel.forEach(function (k, i) {
        if (!k || gruppen[k].length <= grenze) { raus += posten[i].html; return; }
        if (gezeigt[k]) return;
        gezeigt[k] = 1;
        var mit = gruppen[k];
        var titel = U.statusTitel(mit.map(function (j) { return posten[j].status; }));
        raus += '<tr class="agg"><td colspan="' + spalten + '">' +
          '<details class="how"><summary>' + mit.length + ' ' + U.esc(was) + ': ' + U.esc(titel) + '</summary>' +
          '<table class="tbl">' + kopf +
          mit.map(function (j) { return posten[j].html; }).join('') +
          '</table></details></td></tr>';
      });
      return raus;
    }
  };
  window.U = U;

  /* ---- Reiter ----
   * Die Leiste ist ein role="tablist". Dazu gehoert eine Tastaturbedienung, die sich
   * von der normalen Tab-Taste unterscheidet: Innerhalb der Leiste blaettern die
   * PFEILTASTEN, und nur der aktive Reiter ist selbst tabbierbar (roving tabindex).
   * Sonst muesste man sich durch alle fuenf Knoepfe tabben, um zum Inhalt zu kommen. */
  var tabs = [].slice.call(document.querySelectorAll('nav.tabs button'));

  function reiterZeigen(b, fokus) {
    tabs.forEach(function (x) {
      var an = (x === b);
      x.classList.toggle('active', an);
      x.setAttribute('aria-selected', an ? 'true' : 'false');
      x.tabIndex = an ? 0 : -1;
    });
    document.querySelectorAll('.tab').forEach(function (t) { t.classList.remove('active'); });
    var ziel = document.getElementById('tab-' + b.getAttribute('data-tab'));
    if (ziel) ziel.classList.add('active');
    if (fokus) b.focus();
    document.dispatchEvent(new CustomEvent('tab-changed', { detail: b.getAttribute('data-tab') }));
  }

  tabs.forEach(function (b, i) {
    b.addEventListener('click', function () { reiterZeigen(b, false); });
    b.addEventListener('keydown', function (ev) {
      var ziel = null;
      if (ev.key === 'ArrowRight' || ev.key === 'ArrowDown') ziel = tabs[(i + 1) % tabs.length];
      else if (ev.key === 'ArrowLeft' || ev.key === 'ArrowUp') ziel = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (ev.key === 'Home') ziel = tabs[0];
      else if (ev.key === 'End') ziel = tabs[tabs.length - 1];
      if (!ziel) return;
      ev.preventDefault();
      reiterZeigen(ziel, true);
    });
  });

  /* ---- Dialoge ----
   * Vorher liessen sich die drei Dialoge nur mit der Maus schliessen: kein Escape,
   * keine Fokusfalle, und der Hintergrund blieb durchtabbierbar - man konnte also
   * blind in die Oberflaeche dahinter tabben, waehrend der Dialog offen war.
   * Jetzt: Escape schliesst, die Tab-Taste laeuft im Dialog im Kreis, und der Fokus
   * kehrt zu dem Element zurueck, das den Dialog geoeffnet hat. */
  var modalHer = null;   // wohin der Fokus zurueckgeht

  function fokussierbare(el) {
    return [].slice.call(el.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(function (e) { return e.offsetWidth || e.offsetHeight || e.getClientRects().length; });
  }
  function offenerDialog() { return document.querySelector('.modal-bg.open'); }

  function modalSchliessen(bg) {
    if (!bg) return;
    bg.classList.remove('open');
    if (modalHer) { try { modalHer.focus(); } catch (e) { /* Ausloeser ist weg */ } modalHer = null; }
  }

  document.querySelectorAll('[data-close]').forEach(function (b) {
    b.addEventListener('click', function () { modalSchliessen(document.getElementById(b.getAttribute('data-close'))); });
  });
  document.querySelectorAll('.modal-bg').forEach(function (bg) {
    bg.addEventListener('click', function (e) { if (e.target === bg) modalSchliessen(bg); });
  });

  document.addEventListener('keydown', function (ev) {
    var bg = offenerDialog();
    if (!bg) return;
    if (ev.key === 'Escape') {
      // Ist ein Erklaerfenster offen, gehoert das erste Escape ihm - sonst schliessen
      // beide auf einen Schlag und man verliert den Dialog, den man noch brauchte.
      var ip = document.getElementById('infoPop');
      if (ip && ip.style.display === 'block') return;
      ev.preventDefault(); modalSchliessen(bg); return;
    }
    if (ev.key !== 'Tab') return;
    // Fokusfalle: am Ende wieder an den Anfang und umgekehrt.
    var f = fokussierbare(bg);
    if (!f.length) return;
    var erst = f[0], letzt = f[f.length - 1];
    if (ev.shiftKey && (document.activeElement === erst || !bg.contains(document.activeElement))) {
      ev.preventDefault(); letzt.focus();
    } else if (!ev.shiftKey && (document.activeElement === letzt || !bg.contains(document.activeElement))) {
      ev.preventDefault(); erst.focus();
    }
  });

  window.openModal = function (id) {
    var bg = document.getElementById(id);
    if (!bg) return;
    modalHer = document.activeElement;
    bg.classList.add('open');
    var f = fokussierbare(bg);
    if (f.length) { try { f[0].focus(); } catch (e) { /* nicht fokussierbar */ } }
  };

  /* ---- Erklaerungen: ein Register, ein Fenster, ein Knopf ----
   *
   * Warum es das gibt: Die Oberflaeche trug 19.449 Zeichen dauerhaft sichtbaren Text
   * ueber fuenf Reiter, davon 91 % Fliesstext - der Reiter "Regeln" allein 12.630 auf
   * 3.739 px, ohne einen einzigen zugeklappten Block. Der Reiter "Vermoegen" macht es
   * mit <details> laengst richtig und ist deshalb 584 px hoch statt 3.700.
   *
   * Drei Stufen, und jede hat eine Grenze:
   *   1. Zeile      - ein Satz, bleibt sichtbar. Was tut das?
   *   2. i-Knopf    - dieses Fenster. Warum, und wie gut belegt? Vier bis sechs Punkte.
   *   3. Beleg      - Reiter "Messung". Vollstaendig, unbegrenzt, aber selten gebraucht.
   *
   * Der Text steht NICHT im Markup, sondern im Register: so laesst er sich an einer
   * Stelle pflegen, und ein per innerHTML neu gezeichneter Bereich verliert ihn nicht.
   * Der Zuhoerer haengt am Dokument, nicht am Knopf - aus demselben Grund.
   *
   * Nicht alles gehoert hierher. Faustregel: Wer es nicht liest, entscheidet falsch
   * -> bleibt sichtbar (Simulationshinweis, Belegstatus, Warnungen an Schaltern).
   * Wer es nicht liest, versteht nur weniger -> hierher.
   */
  var Info = (function () {
    var REGISTER = {};
    var offen = null;
    function kasten() { return document.getElementById('infoPop'); }

    function schliessen(zurueck) {
      var k = kasten();
      if (!offen || !k) return;
      offen.setAttribute('aria-expanded', 'false');
      k.style.display = 'none';
      var war = offen;
      offen = null;
      if (zurueck && war) { try { war.focus(); } catch (e) { /* Knopf schon weg */ } }
    }

    function zeigen(knopf) {
      var e = REGISTER[knopf.getAttribute('data-info')], k = kasten();
      if (!e || !k) return;
      k.innerHTML =
        '<button type="button" class="ip-zu" aria-label="Erklärung schließen">×</button>' +
        '<h4>' + U.esc(e.titel) + '</h4>' +
        '<ul>' + (e.punkte || []).map(function (p) { return '<li>' + U.esc(p) + '</li>'; }).join('') + '</ul>' +
        (e.fuss ? '<div class="ip-fuss">' + U.esc(e.fuss) + '</div>' : '');
      k.style.display = 'block';
      // Erst einblenden, dann messen: vorher ist die Breite 0.
      var r = knopf.getBoundingClientRect(), kb = k.getBoundingClientRect();
      /* Am Knopf LINKS anlegen - das ist die Leserichtung. Nur wenn das Fenster dann
       * rechts hinausliefe, an seiner rechten Kante ausrichten; passt auch das nicht,
       * bleibt es am Rand kleben. Nach unten dieselbe Regel, sonst nach oben klappen. */
      var links = r.left;
      if (links + kb.width > window.innerWidth - 8) links = r.right - kb.width;
      links = Math.max(8, Math.min(links, window.innerWidth - kb.width - 8));
      var oben = r.bottom + 8;
      if (oben + kb.height > window.innerHeight - 8) oben = Math.max(8, r.top - kb.height - 8);
      k.style.left = Math.max(8, links) + 'px';
      k.style.top = oben + 'px';
      knopf.setAttribute('aria-expanded', 'true');
      offen = knopf;
    }

    document.addEventListener('click', function (ev) {
      // '[data-info]' statt 'button.info': Der Glossar-Knopf in der Kopfzeile ist
      // beschriftet, kein rundes i - er soll trotzdem denselben Weg gehen.
      var k = ev.target.closest ? ev.target.closest('button[data-info]') : null;
      if (k) {
        ev.preventDefault();
        var warOffen = (offen === k);
        schliessen(false);
        if (!warOffen) zeigen(k);
        return;
      }
      if (ev.target.closest && ev.target.closest('.ip-zu')) { schliessen(true); return; }
      if (offen && !(ev.target.closest && ev.target.closest('#infoPop'))) schliessen(false);
    });
    document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape') schliessen(true); });
    // Reiterwechsel und Scrollen: das Fenster wuerde sonst neben nichts stehen bleiben.
    document.addEventListener('tab-changed', function () { schliessen(false); });
    window.addEventListener('resize', function () { schliessen(false); });
    window.addEventListener('scroll', function () { schliessen(false); }, true);

    return {
      /** Erklaerungen anmelden: { schluessel: { titel, punkte: [], fuss } } */
      eintragen: function (obj) { Object.assign(REGISTER, obj); },
      /** Fertiges Knopf-Markup. 'was' wird nur fuer die Vorlesehilfe gebraucht. */
      knopf: function (schluessel, was) {
        return '<button class="info" type="button" data-info="' + U.esc(schluessel) +
               '" aria-expanded="false" aria-label="Erklärung: ' + U.esc(was || schluessel) + '">i</button>';
      },
      /** Nur fuer Tests und die Selbstpruefung: welche Schluessel sind angemeldet? */
      schluessel: function () { return Object.keys(REGISTER); }
    };
  })();
  window.Info = Info;

  /* Die Erklaerungen der festen Abschnitte aus index.html. Sie standen dort bis 8.24.2
   * als Dauer-Absaetze; der Wortlaut ist unveraendert uebernommen, nur der Ort hat
   * sich geaendert. Module, die ihre Karten selbst zeichnen (strategien.js), melden
   * ihre Texte im eigenen render() an. */
  /* Ein Glossar der Hausbegriffe. Die App rechnet in Pp, Bp, t-Werten, MDE und
   * "Kante" - 81-mal allein "Pp" - und erklaerte keinen davon an einer Stelle, an der
   * man ihn beim Lesen sucht. Erreichbar aus der Kopfzeile, also von jedem Reiter aus.
   * Bewusst knapp: eine Zeile je Begriff, dafuer mit der Zahl, die im Programm steht. */
  Info.eintragen({
    'glossar.begriffe': {
      titel: 'Begriffe dieser App',
      punkte: [
        'Pp – Prozentpunkt. Der Unterschied zwischen zwei Prozentzahlen. Von 3 % auf 5 % sind 2 Pp (und 67 % mehr). Renditevorsprünge stehen hier in Pp, damit sie nicht mit Prozent vom Kapital verwechselt werden.',
        'Bp – Basispunkt, ein Hundertstel Prozentpunkt. 20 Bp = 0,20 Pp. Handelskosten stehen in Bp, weil sie klein und dennoch entscheidend sind.',
        'Kante – der gemessene Vorsprung einer Regel gegenüber dem bloßen Halten, nach Kosten. Keine Kante heißt: Die Regel bringt nichts, was Nichtstun nicht auch bringt.',
        'MDE – Mindest-Effektgröße. Der kleinste Vorsprung, den eine Messung mit ihrer Datenmenge überhaupt von Zufall unterscheiden könnte. Liegt der gemessene Wert darunter, ist das Ergebnis „nicht entscheidbar“ – nicht „kein Effekt“.',
        't-Wert – wie viele Standardfehler der gemessene Vorsprung von null entfernt liegt. Grob: unter 2 ist alles gut mit Zufall vereinbar. Ein hoher t-Wert bei wenigen Trades sagt trotzdem wenig.',
        'PF – Profitfaktor: alle Gewinne geteilt durch alle Verluste. Über 1 heißt profitabel, unter 1 nicht. Sagt nichts über die Häufigkeit.',
        'Walk-Forward – auf alten Daten einstellen, auf den darauffolgenden, nie gesehenen Daten prüfen, dann weiterrücken. Der einzige Test, den eine überangepasste Regel nicht bestehen kann.',
        'Schattenbuch – ein Mitschrieb aller Signale, auch der nicht gehandelten. Es kostet nichts und ist die einzige Messbasis, die auch dann weiterläuft, wenn eine Regel abgeschaltet ist.',
        'Regime – die Marktphase, in der eine Regel gelten soll (hier: SPY im Aufwärts- oder Abwärtstrend). Jede Kante wurde in genau einem Regime gemessen und wird nur dort eingesetzt.',
        'Aufgeld – der Betrag, den ein Optionsschein über seinem inneren Wert kostet. Er schmilzt bis zur Fälligkeit auf null; deshalb schlägt er bei kurzen Haltedauern durch.',
        'Omega – wie viel Prozent der Schein macht, wenn der Basiswert ein Prozent macht. Der Hebel, den man tatsächlich bekommt.',
        'Delta – wie viel Kurs der Schein macht, wenn der Basiswert einen Euro macht. Zwischen 0 und 1 (Call) bzw. −1 und 0 (Put).',
        'Kostenhürde – wie viel der Basiswert laufen muss, damit ein Trade nach Spanne, Gebühr und Aufgeld bei null herauskommt. Steht dem gemessenen Vorsprung direkt gegenüber.',
        'Virtuelles Buch – ein Depot, das die App vollständig führt, aber ohne echtes Geld. Momentum- und Drift-Buch sind solche Bücher; sie zeigen, was die Regel getan hätte.'
      ],
      fuss: 'Alle Zahlen der App sind Simulation und keine Anlageberatung.'
    },
    'modell.schein': {
      titel: 'Wie ein Optionsschein hier bepreist wird',
      punkte: [
        'Black-Scholes mit der aus den Kursen geschätzten Volatilität – keine echten Emittenten-Preise. Die Spanne ist an echten Kursen geeicht (onvista), das Modell selbst nicht.',
        'Volatilitäts-Smile: Ein Schein abseits des Geldes bekommt nicht mehr dieselbe Vola wie einer am Geld. Puts sind auf der Seite teurer, Calls knapp über dem Kurs billiger – so herum, nicht anders. Bei den Abständen, die diese App handelt (0 bis 3 %), macht das zwischen 0,0 und 2,5 % Scheinpreis aus.',
        'Volatilität um einen Ergebnistermin: Sie steigt bis zu 25 % davor an und fällt danach unter das Normalniveau zurück („IV-Crush"). Gemessen am Beispiel: ein Schein am Geld mit 21 Tagen Restlaufzeit verliert über die Zahlen rund 29 % – bei UNVERÄNDERTEM Kurs.',
        'Vega steht in der Positionstabelle: wie viel ein einzelner Volatilitätspunkt diese Position wert ist. Bis 8.24.5 kam Vega in der Simulation überhaupt nicht vor – die Vola wurde beim Öffnen eingefroren.',
        'Der Zinssatz steht auf 2 % und ist eine Annahme, keine Messung. Bei diesen Laufzeiten ändert er den Preis um wenige Zehntelprozent.'
      ],
      fuss: 'Smile und Termin-Struktur sind Modellannahmen in der üblichen Größenordnung, NICHT an Emittentenkursen kalibriert – dafür fehlen der App echte Scheinpreise über mehrere Basispreise. Die Richtung ist belastbarer als die Höhe.'
    },
    'regeln.uebersicht': {
      titel: 'Drei Zeithorizonte, drei getrennte Strategien',
      punkte: [
        'Sie handeln unterschiedlich, brauchen unterschiedliche Instrumente und sind unterschiedlich gut gemessen.',
        'Jede lässt sich einzeln ein- und ausschalten.',
        'Was auf jeder Karte hinter dem i steht, ist der ehrliche Belegstand – einschließlich der Punkte, die dagegen sprechen.'
      ],
      fuss: 'Den Belegstatus jeder Regel mit vollständigem Entscheidungsweg zeigt der Reiter „Messung“.'
    },
    'regeln.chart': {
      titel: 'Strategie-Chart',
      punkte: [
        'Rechnet die gemessene Regel auf den Kerzen eines Werts nach – mit exakt derselben Funktion, die auch Studie, Backtest und Live-Scan benutzen (einstiegSignal).',
        'Jede Markierung ist ein Einstieg, den die Regel dort gegeben hätte.',
        'Jedes Signal in der Liste unter dem Chart lässt sich anklicken und zeigt dann, welche Bedingung genau in jener Kerze erfüllt war und welche nicht.',
        'Momentum und Ergebnis-Drift sind Rangfolgen über alle Werte, keine Chartsignale – dafür gibt es hier nichts zu zeichnen.'
      ],
      fuss: 'Simulation, keine Anlageberatung. Der Chart zeigt, was die Regel gesehen hätte – nicht, was sie verdient hätte.'
    },
    'regeln.legende': {
      titel: 'Die Zeichen im Chart',
      punkte: [
        'Entscheidungskanal: die 200 Kerzen, die der Regel die Erlaubnis geben (Regression, 92-%-Kanten) – verankert an der Kerze, die gerade geprüft wird.',
        'Derselbe Kanal heute wird nur gezeigt, wenn ein historisches Signal ausgewählt ist.',
        'Überdehnungsband um die Leitlinie: nur im Kapitulations-Modus – dort ist die Unterkante der Auslöser.',
        'Die Güte eines Kanals ist beschreibend – die Regel fragt nur die Richtung ab, es gibt keine Güte-Schwelle, und kanalUeber liefert immer einen Kanal, nie „keiner“.',
        'Die Leitlinie EMA20 gehört zum Kapitulations-Modus; beim RSI(2)-Modus ist sie nur Orientierung und entscheidet dort nichts.'
      ]
    },
    'regeln.handelt': {
      titel: 'Die Regel, die handelt',
      punkte: [
        'Eine Regel ist hier ein Ding mit Namen, Parametern, Chart, Bedingungen und Bilanz.',
        'Im Chart siehst du, was sie sieht; in der Bilanz, was dabei herauskam.',
        'Die drei Ergebnis-Ansichten, die früher unter „Vermögen“ verstreut lagen, gehören zu dieser Regel und stehen deshalb hier.'
      ]
    },
    'messung.scoreboard': {
      titel: 'Wie das Scoreboard entsteht',
      punkte: [
        'Jede Zeile lässt sich aufklappen und zeigt dann den vollständigen Entscheidungsweg – jede Regel, jede Eingabe, jede Begründung.',
        'Die Messmaschine kann nur auf eine Art rechnen: gepaarte Kontrolle, Tagesclusterung, Entdeckung und Bestätigung getrennt, Mindest-Effektgröße vor dem Urteil, Testzähler. Es gibt keine Schalter dafür.',
        'Bestätigt = auf zurückgehaltenen Tagen über Mindest-Effektgröße und über der Bonferroni-Schwelle.',
        'Nicht entscheidbar = unter der Mindest-Effektgröße; das heißt nicht „kein Effekt“, sondern „diese Datenmenge kann die Frage nicht beantworten“.',
        'Widerlegt = auf zurückgehaltenen Tagen signifikant negativ.'
      ],
      fuss: 'Alle Zahlen in Prozentpunkten des Basiswerts, Überschuss gegen die Erwartung aller Kerzen desselben Werts zur selben Stunde.'
    },
    'marktkarte': {
      titel: 'Wie die Karte zu lesen ist',
      punkte: [
        'Jedes Kästchen ist ein Unternehmen. Die <b>Fläche</b> ist Kurs mal Aktienanzahl – sie wird bei jeder Aktualisierung neu gerechnet, nicht gespeichert.',
        'Die <b>Farbe</b> ist die Veränderung zum Vortagesschluss, gedeckelt bei ±3 %. Darüber wäre nichts mehr unterscheidbar, und ein einzelner Ausreißer würde die ganze Karte blass machen.',
        'Gruppiert wird nach dem SIC-Code der SEC. Der ist von 1987 und kennt kein „Technologie“ – die Zuordnung zu Sektoren ist eine Entscheidung des Projekts und steht offen in tools/stammdaten-holen.js.',
        'Ausländische Emittenten fehlen: Ihre gemeldete Stückzahl sind Stammaktien, gehandelt wird ein ADR aus mehreren davon. Das Verhältnis steht in den Daten nicht – lieber nicht zeigen als falsch zeigen.',
        'Das ist eine <b>Übersicht, kein Signal</b>. An dieser Karte ist nichts gemessen. Sie sortiert nichts nach „bestem Sektor“ und hebt nichts hervor: Das sähe nach einem Befund aus und wäre keiner.'
      ]
    },
    'messung.strategien': {
      titel: 'Warum diese Liste zwei Orte nennt',
      punkte: [
        'Strategien entstehen an zwei Stellen: der <b>Baukasten</b> in dieser App schreibt sie in den Datenordner, die <b>Messmaschine</b> misst die Dateien im Projektverzeichnis. Die App darf nur in den Datenordner schreiben – diese Trennung ist Absicht und bleibt.',
        '<b>Projekt</b> heißt: die Datei liegt im Projektverzeichnis und ist damit versioniert und gesichert. <b>Nur lokal</b> heißt: sie liegt allein im Datenordner – geht der verloren, ist die Regel weg.',
        'Das Urteil kommt aus dem jüngsten Protokoll derselben Kennung. Steht dort <b>nie gemessen</b>, gibt es die Regel, aber kein Ergebnis – das ist etwas anderes als ein schlechtes Ergebnis.',
        'Ein <b>Protokoll ohne Datei</b> ist der unangenehme Fall: Das Ergebnis ist da, die Regel, die es erzeugt hat, nicht mehr auffindbar. Es lässt sich dann nicht nachrechnen.',
        'Findet die App das Projektverzeichnis nicht – in der installierten Fassung ist es nicht mitverpackt –, sagt sie das hier ausdrücklich, statt die Hälfte wegzulassen. Ein Zettel <code>quelle-pfad.txt</code> im Datenordner darf darauf zeigen.'
      ],
      fuss: 'Diese Karte rechnet nichts. Sie liest zwei Ordner und die Protokolle.'
    },
    'messung.eingabe': {
      titel: 'Drei Dinge braucht eine Strategie',
      punkte: [
        'Ein Grund: warum sollte der Effekt existieren – nicht „der RSI war unter 10“, sondern „Indexfonds müssen am Quartalsende kaufen“. Den schreibt kein Baukasten; er ist die Vorregistrierung.',
        'Eine Regel, wann gekauft wird. Im <b>Baukasten</b> wird sie zusammengeklickt und die App schreibt den Code; im <b>Expertenmodus</b> schreibt man ihn selbst.',
        'Der Baukasten deckt die häufigen Muster ab, nicht alles – eine beliebige Idee lässt sich nicht anklicken. Der erzeugte Code steht immer daneben und lässt sich in den Expertenmodus übernehmen.',
        'Eine Vorregistrierung: Haltedauer, Richtung, und welche Varianten geprüft werden. Jede Variante zählt als eigener Test und hebt die Schwelle – die Maschine verhindert das nicht, sie weist es aus.',
        'Was die Regel sieht, endet bei der aktuellen Kerze. Die Bausteine halten sich streng daran; wer selbst schreibt, muss selbst darauf achten.'
      ]
    },
    /* Die drei Beobachtungskarten auf "Heute". Der Satz "Ungemessen, reine Beobachtung
     * ... Keine Anlageberatung" stand dreimal fast woertlich in der Ueberschrift; er
     * steht jetzt einmal je Karte hier. Sichtbar BLEIBT "Gehandelt wird hiervon nichts" -
     * das ist eine Zusicherung, keine Erklaerung, und gehoert nicht hinter einen Klick. */
    'heute.radar': {
      titel: 'Spekulations-Radar',
      punkte: [
        'Gerüchte und Spekulationen aus öffentlichen Quellen, dreimal täglich vor US-Eröffnung gesammelt.',
        'Ungemessen, reine Beobachtung: Gerüchte sind oft falsch.'
      ],
      fuss: 'Gehandelt wird hiervon nichts. Keine Anlageberatung.'
    },
    'heute.insider': {
      titel: 'Insider-Käufe',
      punkte: [
        'Meldepflichtige Eigengeschäfte von Vorstand und Aufsichtsrat US-notierter Firmen (SEC Form 4), nur offene Marktkäufe.',
        'Ungemessen, reine Beobachtung: der Effekt ist in der Literatur ein langsamer Halte-Effekt über Monate, keine Intraday-Kante.'
      ],
      fuss: 'Gehandelt wird hiervon nichts. Keine Anlageberatung.'
    },
    'heute.bestand': {
      titel: 'Mein Depot',
      punkte: [
        'Die eigenen Papiere - eingetragen aus dem Auszug der Depotbank oder von Hand. Sie werden NICHT gehandelt: die App bleibt eine Simulation mit virtuellem Kapital.',
        'Kurzfrist zeigt, was die gemessenen Intraday-Regeln beim letzten Scan zu dem Wert gesagt haben. Mittelfrist zeigt, ob eines der beiden Buecher (Momentum, Ergebnis-Drift) den Wert gerade haelt.',
        'Beides ist eine BEOBACHTUNG, keine Empfehlung. „Die Regel haette hier ein Signal“ heisst nicht „kaufen“ - was daraus folgt, entscheidest du.',
        'Uebernommen wird ueber die ISIN. Eine WKN allein reicht nicht: sie laesst sich bei keiner freien Quelle in ein Boersenkuerzel uebersetzen (am 25.08.2026 nachgemessen - ISIN US0378331005 findet AAPL, WKN 846900 findet nichts).'
      ],
      fuss: 'Simulation. Keine Anlageberatung.'
    },
    'heute.vorboerse': {
      titel: 'Vorbörsen-Lücken',
      punkte: [
        'Werte, die vor der US-Eröffnung deutlich anders stehen als beim gestrigen Schluss: Lücke über 5 %, Kurs über 3 $, vorbörslich durchgehend gehandelt.',
        'Ungemessen, reine Beobachtung: „Gap and Go“ gehört zur Ausbruchsfamilie, und die ist hier in 3.372 Tests widerlegt worden.'
      ],
      fuss: 'Gehandelt wird hiervon nichts. Keine Anlageberatung.'
    },
    'regeln.messen': {
      titel: 'Regeln, die nur messen',
      punkte: [
        'Sie wird bei jedem Scan auf denselben Kerzen geprüft wie die gehandelte Regel und führt eine eigene Bilanz.',
        'Der Sinn ist nicht, sie später zu handeln, sondern dass die Regel VOR der Messung feststeht und man hinterher nicht mehr an ihr drehen kann.',
        'Genau daran sind in diesem Projekt schon mehrere gute Ideen gescheitert – nicht am Markt, sondern daran, dass die Regel erst nach dem Ergebnis endgültig war.',
        'Bewusst ohne Handelsknopf: Eine Regel, in die man mittendrin eingreifen kann, misst nichts – und die Versuchung dazu ist am größten, wenn es gerade gut läuft.'
      ],
      fuss: 'Der Wechsel auf „handelt“ ist eine Entscheidung in den Einstellungen, kein Knopf hier.'
    }
  });

  // ---- Einstellungen ----
  var SETTINGS = { tray: false, capKey: '', capId: '', capPass: '', capEnabled: false, kiVeto: false, kiRules: '', updateRepo: '' };
  window.getSettings = function () { return SETTINGS; };
  var settingsGeladen = false; // Schreiben vor dem Laden würde die gespeicherten Werte überschreiben
  var geheimBehalten = {};     // Felder, deren gespeicherter Wert nicht entschlüsselbar war:
                               // im Dialog leer anzeigen, beim Speichern aber UNANGETASTET lassen
  window.api.storeGet('settings').then(function (s) {
    if (s) {
      ['capKey', 'capId', 'capPass'].forEach(function (k) {
        if (s[k] && typeof s[k] !== 'string') { geheimBehalten[k] = true; s[k] = ''; }
      });
      SETTINGS = Object.assign(SETTINGS, s);
    }
    settingsGeladen = true;
    // Kostenpflichtige API abgeschafft: einen evtl. noch gespeicherten Key einmalig
    // von der Platte löschen – einen KI-Pfad gibt es nicht mehr.
    if (SETTINGS.apiKey || SETTINGS.model) {
      delete SETTINGS.apiKey; delete SETTINGS.model;
      window.api.storeSet('settings', SETTINGS);
    }
    if (window.api.setTrayMode) window.api.setTrayMode(!!SETTINGS.tray);
  }).catch(function (e) {
    // Ein Ladefehler darf das Speichern nicht fuer immer blockieren - dann lieber mit
    // Standardwerten arbeiten und den Fehler sichtbar machen.
    settingsGeladen = true;
    var st0 = document.getElementById('setStatus');
    if (st0) st0.textContent = 'Einstellungen konnten nicht geladen werden (' + (e && e.message ? e.message : e) + ') - es gelten Standardwerte.';
  });

  // Lernschleife: neue Regeln an die KI-Prüfregeln anhängen (Duplikate überspringen)
  window.appendKiRules = function (lines) {
    var existing = (SETTINGS.kiRules || '').split(/\r?\n/).map(function (l) { return l.replace(/^[-•]\s*/, '').trim(); }).filter(Boolean);
    var added = 0;
    (lines || []).forEach(function (l) {
      var clean = String(l).trim();
      if (!clean || existing.indexOf(clean) !== -1) return;
      SETTINGS.kiRules = ((SETTINGS.kiRules || '').trim() + '\n- ' + clean).trim().slice(0, 1200);
      existing.push(clean);
      added++;
    });
    if (added && settingsGeladen) window.api.storeSet('settings', SETTINGS);
    // vor dem Laden nur im Speicher anhängen – der nächste reguläre Save persistiert es
    return added;
  };

  /* Felix, Issue #68: die Einstellungen sollten bei den Werkzeugen erreichbar sein.
   * Die Pille dort loest denselben Knopf aus, statt den Dialog ein zweites Mal zu
   * bauen - zwei Wege hinein, aber nur eine Wahrheit darueber, was er tut. */
  var wzE = document.getElementById('wzEinstellungen');
  if (wzE) wzE.addEventListener('click', function () { document.getElementById('settingsBtn').click(); });

  document.getElementById('settingsBtn').addEventListener('click', function () {
    document.getElementById('setTray').checked = !!SETTINGS.tray;
    ['setCapKey', 'setCapId', 'setCapPass'].forEach(function (id, i3) {
      var feld = ['capKey', 'capId', 'capPass'][i3];
      var el3 = document.getElementById(id);
      el3.value = SETTINGS[feld] || '';
      el3.placeholder = geheimBehalten[feld] ? 'gespeichert - leer lassen = unverändert' : '';
    });
    document.getElementById('setCapEnabled').checked = !!SETTINGS.capEnabled;
    document.getElementById('setUpdateRepo').value = SETTINGS.updateRepo || 'Wilhelm-mbg/Stock-Dashboard';
    if (window.api.getAutostart) window.api.getAutostart().then(function (r) { document.getElementById('setAutostart').checked = !!(r && r.on); });
    document.getElementById('setUpdateStatus').textContent = '';
    var auEl = document.getElementById('setAutoUpdate');
    if (auEl) {
      auEl.checked = SETTINGS.autoUpdate !== false;
      if (window.api.updateState) window.api.updateState().then(updRender);
    }
    document.getElementById('setStatus').textContent = '';
    window.openModal('setModalBg');
  });

  /* Capital.com-Verbindung testen (Issue #41). Prueft der Reihe nach, damit man
   * SIEHT, woran es haengt - "geht nicht" ist keine brauchbare Fehlermeldung.
   * Nimmt die Werte aus den Feldern, ohne sie zu speichern: erst testen, dann
   * bewusst sichern. Die Zugangsdaten verlassen dabei nur den Weg zum Demo-Host. */
  var capTestBtn = document.getElementById('capTestBtn');
  if (capTestBtn) capTestBtn.addEventListener('click', async function () {
    var st = document.getElementById('capTestStatus');
    var det = document.getElementById('capTestDetail');
    var key = (document.getElementById('setCapKey').value || '').trim();
    var id = (document.getElementById('setCapId').value || '').trim();
    var pass = (document.getElementById('setCapPass').value || '').trim();
    // Leere Felder koennen "gespeichert, unveraendert" bedeuten - dann die abgelegten nehmen
    if (!key && SETTINGS.capKey) key = SETTINGS.capKey;
    if (!id && SETTINGS.capId) id = SETTINGS.capId;
    if (!pass && SETTINGS.capPass) pass = SETTINGS.capPass;
    det.style.display = 'none'; det.textContent = '';
    var fehlt = [];
    if (!key) fehlt.push('API-Schlüssel');
    if (!id) fehlt.push('Konto-Kennung');
    if (!pass) fehlt.push('API-Passwort');
    if (fehlt.length) { st.textContent = 'Es fehlt noch: ' + fehlt.join(', ') + '.'; return; }
    capTestBtn.disabled = true;
    st.textContent = 'Melde mich beim Demo-Server an …';
    try {
      var BASE = 'https://demo-api-capital.backend-capital.com/api/v1';
      var res = await window.api.capFetch('POST', BASE + '/session', { 'X-CAP-API-KEY': key }, { identifier: id, password: pass });
      if (!(res.ok && res.headers && res.headers.cst)) {
        var code = '';
        try { code = JSON.parse(res.body).errorCode || ''; } catch (e) { }
        st.textContent = 'Anmeldung fehlgeschlagen (HTTP ' + res.status + (code ? ', ' + code : '') + ').';
        det.style.display = '';
        det.textContent = code.indexOf('api-key') !== -1 || res.status === 403
          ? 'Der API-Schlüssel wird abgelehnt. Prüfe, ob er für das DEMO-Konto erstellt wurde – Live- und Demo-Schlüssel sind verschieden.'
          : code.indexOf('credentials') !== -1 || res.status === 401
            ? 'Kennung oder API-Passwort passen nicht. Das API-Passwort ist das, das du beim Erstellen des Schlüssels vergeben hast – nicht dein Konto-Passwort.'
            : 'Antwort des Servers: ' + String(res.body || '').slice(0, 200);
        return;
      }
      st.textContent = 'Angemeldet · frage Konto ab …';
      var acc = await window.api.capFetch('GET', BASE + '/accounts',
        { 'X-CAP-API-KEY': key, 'CST': res.headers.cst, 'X-SECURITY-TOKEN': res.headers['x-security-token'] }, null);
      if (!acc.ok) { st.textContent = 'Angemeldet, aber Kontoabfrage fehlgeschlagen (HTTP ' + acc.status + ').'; return; }
      var a0 = JSON.parse(acc.body).accounts[0];
      st.textContent = '✓ Verbunden · ' + a0.accountName + ' · Guthaben ' + a0.balance.balance + ' ' + a0.currency;
      det.style.display = '';
      det.textContent = 'Der Test hat nichts gespeichert. Zum dauerhaften Verbinden unten „Speichern" klicken und das Häkchen ' +
        '„Intraday-Signale zusätzlich auf dem Demo-Konto ausführen" setzen – dann misst die App an jedem gespiegelten Trade die echten Handelskosten.';
    } catch (e) {
      st.textContent = 'Test fehlgeschlagen: ' + ((e && e.message) || e);
    } finally {
      capTestBtn.disabled = false;
    }
  });

  /* ================= Automatische Updates ================= */
  function updRender(st) {
    var el = document.getElementById('setUpdAutoStatus');
    var ib = document.getElementById('setUpdInstallBtn');
    if (!el || !st) return;
    if (st.packaged === false) {
      el.textContent = 'Läuft aus dem Quellcode – automatische Updates gibt es nur in der installierten Version.';
      if (ib) ib.style.display = 'none';
      return;
    }
    var txt = {
      idle: 'Noch nicht geprüft.',
      checking: 'Suche nach Updates …',
      current: '' + (st.msg || 'Aktuell'),
      available: '' + (st.msg || 'Update gefunden'),
      downloading: '' + (st.msg || 'Lade …'),
      ready: '' + (st.msg || 'Update bereit'),
      error: '' + (st.msg || 'Fehler')
    }[st.state] || (st.msg || '');
    el.textContent = txt;
    if (ib) ib.style.display = st.state === 'ready' ? '' : 'none';
  }
  if (window.api.onUpdate) window.api.onUpdate(updRender);
  (function () {
    var nowBtn = document.getElementById('setUpdNowBtn');
    var insBtn = document.getElementById('setUpdInstallBtn');
    var chk = document.getElementById('setAutoUpdate');
    if (!nowBtn) return;
    nowBtn.addEventListener('click', async function () {
      document.getElementById('setUpdAutoStatus').textContent = 'Suche nach Updates …';
      var r = await window.api.updateCheck();
      if (r && !r.ok) document.getElementById('setUpdAutoStatus').textContent = '' + (r.msg || 'Update-Prüfung fehlgeschlagen');
    });
    insBtn.addEventListener('click', async function () {
      var r = await window.api.updateInstall();
      if (r && !r.ok) document.getElementById('setUpdAutoStatus').textContent = '' + (r.msg || 'Installation nicht möglich');
    });
    chk.addEventListener('change', function () {
      SETTINGS.autoUpdate = chk.checked;
      window.api.storeSet('settings', SETTINGS);
      if (window.api.updateSetAuto) window.api.updateSetAuto(chk.checked);
    });
  })();

  // Update-Check über GitHub-Releases
  function cmpVer(a, b) {
    // parseInt statt Number: "7.19.0-beta" ergab als Zahl NaN, die Differenz war NaN und
    // damit falsy – eine neuere Vorabversion galt dadurch als "gleich" und wurde nie gemeldet.
    function teile(v) {
      return String(v).split('.').map(function (t) { var n = parseInt(t, 10); return isNaN(n) ? 0 : n; });
    }
    var x = teile(a), y = teile(b);
    for (var i = 0; i < 3; i++) { var d = (x[i] || 0) - (y[i] || 0); if (d) return d; }
    return 0;
  }
  document.getElementById('setUpdateBtn').addEventListener('click', async function () {
    var st = document.getElementById('setUpdateStatus');
    var repo = document.getElementById('setUpdateRepo').value.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\/+$/, '');
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) { st.textContent = 'Bitte im Format nutzer/repo angeben (z. B. wilhelm/markt-dashboard).'; return; }
    SETTINGS.updateRepo = repo;
    window.api.storeSet('settings', SETTINGS);
    st.textContent = 'Prüfe …';
    var cur = await window.api.appVersion();
    var res = await window.api.fetchText('https://api.github.com/repos/' + repo + '/releases/latest');
    if (!res.ok) { st.textContent = 'Nicht erreichbar (HTTP ' + res.status + ') – existiert das Repo und hat es ein veröffentlichtes Release?'; return; }
    try {
      var j = JSON.parse(res.body);
      var tag = String(j.tag_name || '').replace(/^v/i, '');
      if (!tag) { st.textContent = 'Kein Release gefunden.'; return; }
      if (cmpVer(tag, cur) > 0) {
        var asset = (j.assets || []).filter(function (a) { return /\.exe$/i.test(a.name || ''); })[0];
        st.innerHTML = 'Version ' + U.esc(tag) + ' verfügbar (installiert: ' + U.esc(cur) + ').' + (asset ? ' <a href="#" id="updDl">Download im Browser öffnen</a>' : ' (kein .exe-Anhang im Release)');
        var dl = document.getElementById('updDl');
        if (dl) dl.addEventListener('click', function (e) { e.preventDefault(); window.api.openExternal(asset.browser_download_url); });
      } else st.textContent = 'Aktuell (installiert: ' + cur + ', neueste: ' + tag + ').';
    } catch (e) { st.textContent = 'Antwort unlesbar.'; }
  });

  document.getElementById('setSaveBtn').addEventListener('click', function () {
    try {
    // Speichern, bevor der Store geladen ist, würde die gespeicherten Werte mit leeren
    // Formularfeldern überschreiben. Der Wächter existierte schon, galt aber nur für die
    // KI-Regeln – hier fehlte er.
    if (!settingsGeladen) {
      document.getElementById('setStatus').textContent = 'Einstellungen werden noch geladen – bitte einen Moment und erneut speichern.';
      return;
    }
    SETTINGS.tray = document.getElementById('setTray').checked;
    if (window.api.setTrayMode) window.api.setTrayMode(SETTINGS.tray);
    ['capKey', 'capId', 'capPass'].forEach(function (feld, i4) {
      var wert4 = document.getElementById(['setCapKey', 'setCapId', 'setCapPass'][i4]).value;
      if (feld !== 'capPass') wert4 = wert4.trim();
      // Leeres Feld bei nicht entschlüsselbarem Bestand heißt "behalten", nicht "löschen"
      SETTINGS[feld] = (wert4 === '' && geheimBehalten[feld]) ? { __keep: true } : wert4;
      if (wert4 !== '') geheimBehalten[feld] = false;
    });
    SETTINGS.capEnabled = document.getElementById('setCapEnabled').checked;
    // Gleiche Formatprüfung wie beim Prüf-Knopf – vorher landete hier auch Unsinn im Store.
    var repoNeu = document.getElementById('setUpdateRepo').value.trim().replace(/^https:\/\/github\.com\//i, '').replace(/\/+$/, '');
    if (repoNeu && !/^[\w.-]+\/[\w.-]+$/.test(repoNeu)) {
      document.getElementById('setStatus').textContent = 'Update-Repo bitte als nutzer/repo angeben – nicht gespeichert.';
      return;
    }
    SETTINGS.updateRepo = repoNeu;
    SETTINGS.autoUpdate = document.getElementById('setAutoUpdate').checked;
    if (window.api.updateSetAuto) window.api.updateSetAuto(SETTINGS.autoUpdate);
    var au = document.getElementById('setAutostart').checked;
    /* Autostart ist die einzige Einstellung, die NICHT im Store liegt, sondern in der
       Windows-Registry. Sie kann fehlschlagen, ohne dass eine Ausnahme fliegt – etwa
       wenn eine Gruppenrichtlinie sie verbietet. Vorher lief das ins Leere: gemeldet
       wurde "Gespeichert.", der Haken sprang beim nächsten Öffnen wieder heraus, und
       niemand erfuhr warum. Jetzt wird das Ergebnis geprüft und der Haken auf den
       tatsächlichen Zustand zurückgesetzt. */
    if (window.api.setAutostart) {
      window.api.setAutostart(au).then(function (r) {
        if (r && r.ok) return;
        var box = document.getElementById('setAutostart');
        if (box) box.checked = !!(r && r.on);
        var st = document.getElementById('setStatus');
        if (st) st.textContent = 'Autostart nicht gesetzt: ' + ((r && r.msg) || 'unbekannter Fehler') +
          ' Alle übrigen Einstellungen wurden gespeichert.';
      });
    }
    if (au && window.api.setTrayMode) { SETTINGS.tray = true; document.getElementById('setTray').checked = true; window.api.setTrayMode(true); }
    /* Das Sentinel {__keep:true} muss MIT gespeichert werden, darf aber nicht im
     * Arbeitsspeicher stehenbleiben: Ein Objekt ist wahrheitswertig, und capital.js
     * schliesst aus einem gesetzten capKey/capId/capPass auf eine eingerichtete
     * Verbindung. Nach dem Schreiben steht hier deshalb derselbe Zustand wie nach
     * einem Neustart - Feld leer, Merkung in geheimBehalten (vgl. Ladepfad oben). */
    var schreiben = window.api.storeSet('settings', SETTINGS);
    ['capKey', 'capId', 'capPass'].forEach(function (k9) {
      if (SETTINGS[k9] && typeof SETTINGS[k9] !== 'string') { geheimBehalten[k9] = true; SETTINGS[k9] = ''; }
    });
    schreiben.then(function (res) {
      // Nie wieder "Gespeichert." anzeigen, wenn nichts geschrieben wurde: das Ergebnis
      // des Schreibvorgangs entscheidet ueber die Meldung.
      var ok = res === true || (res && res.ok);
      document.getElementById('setStatus').textContent = ok
        ? 'Gespeichert.'
        : 'FEHLER beim Speichern: ' + ((res && res.msg) || 'unbekannt') + ' - Einstellungen wurden NICHT gesichert.';
      if (ok) document.dispatchEvent(new CustomEvent('settings-saved'));
    }, function (e) {
      document.getElementById('setStatus').textContent = 'FEHLER beim Speichern: ' + (e && e.message ? e.message : e);
    });
    } catch (eSave) {
      // Eine Ausnahme im Handler starb frueher STILL - der Nutzer sah einfach nichts.
      document.getElementById('setStatus').textContent = 'FEHLER beim Speichern: ' + (eSave && eSave.message ? eSave.message : eSave);
    }
  });
})();
