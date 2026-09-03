'use strict';
/* App-Shell: Tabs, Modals, Einstellungen, gemeinsame Helfer */
(function () {
  /* Die Ausgangsfarbe einer Statuszeile, beim ersten Anfassen gemerkt. Warum das noetig
   * ist: die meisten Statuszeilen tragen ihre Farbe als Inline-Stil aus dem Markup
   * (color:var(--muted)) oder aus einer Klasse (.hinweis, .auto-status). Wer beim
   * Fehlerfall el.style.color setzt, ueberschreibt genau diesen Inline-Stil - und ein
   * spaeteres Zuruecksetzen auf '' loescht ihn, statt ihn wiederherzustellen. Die Zeile
   * bliebe fuer den Rest der Sitzung falsch eingefaerbt. */
  var GRUNDFARBE = new WeakMap();

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
    /* URTEILE DER MESSMASCHINE LESBAR MACHEN (#102, 26.08.2026).
     * Die Maschine benennt ihre Urteile mit internen Schluesseln ('nicht-bestaetigt').
     * Die gehoeren nicht in die Anzeige - im Regelkopf stand woertlich
     * "Beleg nicht-bestaetigt", sobald er das Protokoll ueberhaupt zu sehen bekam.
     * EINE Uebersetzung fuer die ganze App: das Scoreboard hatte eine eigene Tabelle,
     * und zwei Tabellen an zwei Orten sind die naechste Stelle, an der eine veraltet.
     * Ein UNBEKANNTER Schluessel wird nicht verschluckt, sondern lesbar gemacht - die
     * Maschine darf neue Urteile erfinden, und ein stilles "?" waere schlimmer als ein
     * ungewohntes Wort. */
    urteilText: function (u) {
      var T = { 'bestaetigt': 'bestätigt', 'nicht-bestaetigt': 'nicht bestätigt',
        'nicht-entscheidbar': 'nicht entscheidbar', 'nicht-messbar': 'nicht messbar',
        'widerlegt': 'widerlegt',
        'bestaetigt-aber-nullpunkt-verschoben': 'bestätigt – aber Nullpunkt verschoben' };
      return T[u] || String(u == null ? '?' : u).replace(/-/g, ' ');
    },
    signTxt: function (v, unit) { return (v > 0 ? '+' : '') + U.nf2.format(v) + (unit || ''); },
    /* Prozent mit EINER Nachkommastelle (deutsches Komma); genau 0 wird zu '±0,0 %'.
     * Stand bis zum 03.09.2026 privat in depot.js. Beim Bau der Buecher-Karten
     * (Oberflaeche Stufe 2) brauchte mfdepot.js dieselbe Schreibweise - und zwei
     * Prozentformate nebeneinander sind genau die Sorte Doppelzahl, die hier schon
     * einmal zu verschiedenen Angaben derselben Groesse gefuehrt hat. Eine Definition,
     * alle Aufrufer: depot.js bindet sie unter ihrem alten Namen ein. */
    pz1: function (v) {
      if (!isFinite(v)) return '–';
      var r = Math.round(v * 10) / 10;
      return (r > 0 ? '+' : r < 0 ? '-' : '±') + Math.abs(r).toFixed(1).replace('.', ',') + ' %';
    },
    /* Statuszeile setzen. ziel = Element oder Kennung, text = TEXT (nie HTML),
     * art = undefined | 'ok' | 'fehler'.
     *
     * Warum als Hilfe: acht Module schrieben denselben Dreisatz von Hand - Element
     * suchen, Text setzen, im Zweifel einfaerben -, achtmal leicht anders. Warum TEXT
     * und nicht HTML: eine Statuszeile traegt regelmaessig Fremdinhalt (Fehlertexte
     * einer Schnittstelle, Kuerzel aus einer Eingabe). Wer sie ueber textContent setzt,
     * kann das Escapen nicht vergessen.
     * Was die Hilfe ausdruecklich NICHT tut: role/aria-live nachruesten. Nur drei der
     * 31 Statuszeilen melden sich heute, und aus "alle melden sich" wird schnell eine
     * Vorlesestimme, die bei jedem Zwischenstand dazwischenredet. Das ist eine eigene
     * Entscheidung je Zeile (Plan, Stufe F). */
    statuszeile: function (ziel, text, art) {
      var el = typeof ziel === 'string' ? document.getElementById(ziel) : ziel;
      if (!el) return null;
      if (!GRUNDFARBE.has(el)) GRUNDFARBE.set(el, el.style.color || '');
      el.textContent = text == null ? '' : String(text);
      el.style.color = art === 'fehler' ? 'var(--down)'
        : art === 'ok' ? 'var(--up)'
        : GRUNDFARBE.get(el);
      return el;
    },
    /* Eine Kachel fuer .depot-stats. name/wert/sub/delta sind FERTIGES HTML: die
     * Aufrufer setzen dort schmale Leerzeichen, <b> und ganze Chips ein - ein Escapen
     * in der Hilfe wuerde diese Zeichen sichtbar machen. Das Escapen bleibt also beim
     * Aufrufer, genau wie bisher.
     *
     * opt.cls  fertige Klasse ('pos'/'neg') - hat Vorrang, weil die Buecher bei genau
     *          0 $ 'pos' zeigen, U.signCls dagegen neutral; das ist eine Anzeige-
     *          entscheidung der Buecher und keine, die eine Hilfe umdrehen darf.
     * opt.sign Zahl, aus der die Klasse ueber U.signCls kommt.
     * opt.fs   Schriftgroesse des Werts. OHNE Vorgabe: die Kopfkacheln auf "Heute"
     *          tragen absichtlich keine, sie leben von .tile .val im CSS (--fs-titel).
     *          Wer hier einen Vorgabewert einbaut, verkleinert sie stillschweigend.
     * opt.sub  Zusatzzeile unter dem Wert (Klasse kachel-sub; NICHT sub - die Klasse
     *          gehoert den Reiter-Unterseiten und ist dort auf display:none gesetzt).
     * opt.delta / opt.deltaSign  die Veraenderungszeile der Depot-Kacheln.
     * opt.extra  fertiges HTML ganz am Ende der Kachel, ohne eigenen Kasten. Die
     *          sechs Marktueberblick-Kacheln haengen dort ihre Sparkline hin; sie
     *          steht im .tile, aber nicht in .val oder .kachel-sub. Ohne diesen
     *          Platz haetten sie weiter von Hand gebaut werden muessen. */
    kachel: function (name, wert, opt) {
      opt = opt || {};
      var cls = opt.cls != null ? opt.cls : (opt.sign != null ? U.signCls(opt.sign) : '');
      return '<div class="tile"><div class="name">' + name + '</div>' +
        '<div class="val' + (cls ? ' ' + cls : '') + '"' +
        (opt.fs ? ' style="font-size:' + opt.fs + ';"' : '') + '>' + wert + '</div>' +
        (opt.sub ? '<div class="kachel-sub">' + opt.sub + '</div>' : '') +
        (opt.delta ? '<div class="delta' + (opt.deltaSign ? ' ' + U.signCls(opt.deltaSign) : '') + '">' + opt.delta + '</div>' : '') +
        (opt.extra || '') +
        '</div>';
    },
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
  /* Dezimalzahl fuer sichtbaren deutschen Text: Komma statt Punkt. Bis zum
   * 25.08.2026 stand "Kostenhürde: 0.100 Pp" neben "100.000,00 $" - zwei
   * Schreibweisen im selben Blickfeld. NUR fuer die Oberflaeche: CSV-Export und
   * alles Maschinenlesbare bleiben beim Punkt. */
  U.dez = function (x, stellen) {
    if (x == null || !isFinite(x)) return '–';
    return x.toFixed(stellen == null ? 2 : stellen).replace('.', ',');
  };
  window.U = U;

  /* ---- Reiter ----
   * Die Leiste ist ein role="tablist". Dazu gehoert eine Tastaturbedienung, die sich
   * von der normalen Tab-Taste unterscheidet: Innerhalb der Leiste blaettern die
   * PFEILTASTEN, und nur der aktive Reiter ist selbst tabbierbar (roving tabindex).
   * Sonst muesste man sich durch alle fuenf Knoepfe tabben, um zum Inhalt zu kommen. */
  var tabs = [].slice.call(document.querySelectorAll('nav.tabs button'));

  /* ---- Wo man zuletzt war ----
   * Ohne das warf jeder Neustart auf "Heute" und die erste Pille zurueck, auch nach
   * einem Schliessen von zwei Minuten. Gemerkt wird ausschliesslich der ORT: welcher
   * Reiter, und je Reiter welche Pille. Bewusst NICHT gemerkt werden offene Dialoge
   * und die Detail-Ansicht des Explorers - ein Fenster, das ohne den Klick wiederkommt,
   * der es geoeffnet hat, verwirrt mehr, als das Wiederfinden spart. */
  var UI = { tab: null, sub: {} };
  var uiGeladen = false;   // vor dem Wiederherstellen nicht schreiben, sonst
                           // ueberschreibt der Aufbau den gemerkten Stand
  function uiMerken() {
    if (!uiGeladen) return;
    // Der Ort ist Beiwerk: schlaegt das Speichern fehl, darf trotzdem nie die
    // Bedienbarkeit daran haengen.
    try { window.api.storeSet('ui', UI); } catch (e) { /* Ort merken ist Beiwerk */ }
  }
  // Sofort lesen lassen, damit die Antwort da ist, sobald das DOM steht.
  var uiStand = window.api.storeGet('ui').catch(function () { return null; });

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
    UI.tab = b.getAttribute('data-tab');
    uiMerken();
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

  /* ---- Unter-Reiter (Pillen) ----
   * Navigation gehoert der Shell. Vorher stand der Umschalter in depot.js init(), also
   * hinter dem Laden des Depots: bis dahin sahen alle Pillen bedienbar aus und taten
   * nichts. Hier steht er VOR jedem Laden - er schaltet ab dem ersten Bild.
   * Was je Unterseite zusaetzlich gezeichnet werden muss, weiss nur das Fachmodul; die
   * Shell meldet deshalb nur, WAS umgeschaltet wurde ('sub-changed') - genauso, wie sie
   * es fuer die Reiter schon tut ('tab-changed').
   *
   * Allgemein statt auf #depotPills festgenagelt: Seit Stufe 4 gibt es eine zweite
   * Pillenleiste (Werkzeuge). Der Umschalter arbeitet in dem Reiter, in dem die
   * angeklickte Pille steht - so kostet jede weitere Leiste keinen neuen Code.
   *
   * Nur Pillen MIT data-sub sind Navigation. Ohne diese Einschraenkung fing der
   * Umschalter auch die sechs Protokoll-Filter, den CSV-Knopf und die beiden
   * Setup-Pillen ab: er blendete alle .sub-Bereiche aus, fand dann kein Ziel und
   * schaltete nichts zurueck - der Reiter blieb leer. */
  function pilleZeigen(b, wieder) {
    var reiter = b.closest('.tab');
    var meine = reiter ? reiter.querySelectorAll('.pills button[data-sub]') : [b];
    meine.forEach(function (x) { x.classList.remove('active'); });
    if (reiter) reiter.querySelectorAll('.sub').forEach(function (s) { s.classList.remove('active'); });
    b.classList.add('active');
    var sub = b.getAttribute('data-sub');
    var subZiel = document.getElementById('sub-' + sub);
    if (subZiel) subZiel.classList.add('active');
    var reiterName = reiter ? reiter.id.replace(/^tab-/, '') : null;
    if (reiterName) { UI.sub[reiterName] = sub; uiMerken(); }
    document.dispatchEvent(new CustomEvent('sub-changed',
      { detail: { tab: reiterName, sub: sub, wieder: !!wieder } }));
  }

  var pillen = document.querySelectorAll('.pills button[data-sub]');
  pillen.forEach(function (b) {
    b.addEventListener('click', function () { pilleZeigen(b); });
  });

  /* ---- Betrieb: die Klappen sind die Navigation des Maschinenraums ----
   * Stufe 1 des Umzugs (02.09.2026) hat Kursarchiv, Autopilot, Trendfinder, den
   * Signal-Monitor und die Messprotokolle aus eigenen Reitern und Pillen in
   * <details>-Klappen unter Werkzeuge -> Betrieb gelegt. Die Nachlade-Ausloeser der
   * Fachmodule hingen an 'sub-changed' und am Reiterwechsel - beides gibt es an
   * diesen Stellen nicht mehr. Statt in vier Modulen einen zweiten Weg zu bauen,
   * meldet die Shell das AUFklappen als dasselbe Ereignis: der Name in data-klappe
   * tritt an die Stelle des frueheren data-sub.
   * Zuklappen meldet nichts - Zuklappen bestellt nichts nach. Und 'wieder' ist hier
   * immer false: eine Klappe geht nur auf, wenn jemand sie aufmacht; der
   * wiederhergestellte Ort oeffnet keine (details ohne open-Attribut). Genau daran
   * haengt, dass der Trendfinder beim Programmstart keine 15 Kurse abruft. */
  document.querySelectorAll('#sub-betrieb details[data-klappe]').forEach(function (kl) {
    kl.addEventListener('toggle', function () {
      if (!kl.open) return;
      document.dispatchEvent(new CustomEvent('sub-changed',
        { detail: { tab: 'werkzeuge', sub: kl.getAttribute('data-klappe'), wieder: false } }));
    });
  });

  /* ---- Statuszeile im Titel jeder Betrieb-Klappe (Oberflaeche Stufe 2, 03.09.2026) ----
   *
   * Der Maschinenraum besteht aus elf geschlossenen Klappen. Wer wissen wollte, ob das
   * Kursarchiv laeuft oder wann zuletzt gemessen wurde, musste jede einzeln aufmachen -
   * und das Aufklappen IST der Nachlade-Ausloeser (siehe oben). Die Statuszeile
   * beantwortet die Frage, ohne etwas anzustossen.
   *
   * DREI REGELN, und sie sind der Grund, warum diese Tabelle so aussieht:
   *  1. GUENSTIGE QUELLEN. Gelesen wird nur, was ohnehin im Speicher steht - der
   *     Depot-Zustand ueber DepotAPI, die Status-Objekte der Fachmodule. Kein IPC,
   *     kein Netz, kein Zugriff auf die Platte. Sonst laedt eine Anzeige, die sagen
   *     soll was schon da ist, beim Programmstart genau das nach, was der Alltag
   *     nicht braucht.
   *  2. KEINE KONSTANTE. Jede Zeile hat eine benannte Quelle. Ist die Quelle nicht
   *     ohne Laden erreichbar, gibt der Eintrag null zurueck und der Span bleibt LEER
   *     (CSS blendet ihn dann ganz aus). Ein fester Text saehe aus wie ein Zustand
   *     und waere keiner - genau die Fehlerform, gegen die dieses Projekt seine
   *     Positivkontrollen hat.
   *  3. WERKZEUGE OHNE ZUSTAND tragen null: Strategie-Chart, Berichte und die
   *     Strategie-Eingabe rechnen auf Zuruf und haben nichts zu melden. Das ist keine
   *     Luecke, sondern die richtige Antwort.
   *
   * Aktualisiert wird ueber Ereignisse, die es schon gibt (quotes-updated,
   * kanten-geladen, sub-changed) - kein eigener Zeitgeber. Zwei Quellen fuellen sich
   * erst, wenn ihre Klappe einmal offen war (Kursarchiv, Strategieregister); sie
   * stehen mit dem naechsten dieser Ereignisse da. */
  var KLAPPEN_STAND = {
    /* archivkarte.js haelt den letzten Sammler-Stand - aus dem Fortschritts-Funk oder
     * vom letzten Laden. Liegt keiner vor, bleibt die Zeile leer: "nichts gefunden"
     * und "nichts durchsucht" sind von aussen nicht zu unterscheiden. */
    archiv: function () {
      var st = window.Archivkarte && window.Archivkarte.letzter && window.Archivkarte.letzter();
      if (!st || !st.zeilen || !st.zeilen.length) return null;
      var j = 0;
      st.zeilen.forEach(function (z) { if (z.juengsteMs && z.juengsteMs > j) j = z.juengsteMs; });
      return j ? 'jüngste Kerze ' + U.dt(j) : 'nichts da';
    },
    /* Autopilot, letzte Nachtmessung und Marktlage stehen als Kopien in
     * DepotAPI.antwort() - dieselbe Auskunft, aus der die Antwort-Seite liest. */
    auswertung: function () {
      var a = window.DepotAPI && window.DepotAPI.antwort && window.DepotAPI.antwort();
      if (!a) return null;
      return 'Autopilot ' + (a.pilotAn ? 'an' : 'aus') +
        ' · Nachtmessung ' + (a.pilotZuletzt ? U.d(a.pilotZuletzt) : 'noch keine') +
        (a.regime ? ' · Marktlage ' + (a.regime.pause ? 'Pause'
          : a.regime.ok ? U.d(a.regime.at) : 'zu wenig Kursdaten') : '');
    },
    /* Die gemessenen Runden liegen im Depot-Zustand; kosten.js laedt sein Nebenlager
     * beim Verkabeln, hier wird nur gezaehlt. Capital und Alpaca sind ZWEI Gefaesse
     * und werden getrennt gezaehlt - eine gemeinsame Zahl hat hier schon einmal
     * Krypto-Runden als Aktien gefuehrt. */
    kosten: function () {
      var r = window.Kosten && window.Kosten.kostenRunden && window.Kosten.kostenRunden();
      if (!r || !r.length) return null;
      var cap = 0, alp = 0, letzte = 0;
      r.forEach(function (x) {
        if (x && x.gefaess === 'alpaca') alp++; else cap++;
        if (x && x.at > letzte) letzte = x.at;
      });
      return 'Runden Capital ' + cap + ' · Alpaca ' + alp + (letzte ? ' · letzte ' + U.d(letzte) : '');
    },
    /* Der Zeitstempel des letzten Scans ist ein Sitzungswert aus HEALTH; DepotAPI
     * gibt ihn als Kopie heraus (letzterScan). Vor dem ersten Scan: leer. */
    monitor: function () {
      var a = window.DepotAPI && window.DepotAPI.antwort && window.DepotAPI.antwort();
      if (!a || !a.letzterScan) return null;
      return 'letzter Scan ' + U.dt(a.letzterScan);
    },
    /* Ein Werkzeug, das auf Zuruf rechnet - es hat keinen Zustand zu melden. */
    stratchart: null,
    /* Der aktive Ausloeser kommt aus der Einstellung, das Urteil aus dem Protokoll -
     * zwei Quellen, die nebeneinander stehen und nie vermischt werden. */
    regelbuch: function () {
      var A = window.DepotAPI;
      if (!A || !A.antwort || !A.regelStatus) return null;
      var a = A.antwort(), st = A.regelStatus();
      if (!a || !st) return null;
      var name = a.aktiverTrigger || a.modusName || st.modus;
      if (!name) return null;
      var k = st.modus && A.protokollKante ? A.protokollKante(st.modus) : null;
      return name + ' · ' + (k ? U.urteilText(k.urteil) : 'kein Protokoll');
    },
    berichte: null,
    /* Wie viele Kennungen ein Messprotokoll haben - aus derselben Sammlung, die
     * depot.js beim Start einmal gelesen hat (kantenAusProtokollen). */
    scoreboard: function () {
      var k = window.DepotAPI && window.DepotAPI.protokollKennungen && window.DepotAPI.protokollKennungen();
      if (!k || !k.length) return null;
      return k.length + ' Strategien mit Protokoll';
    },
    /* Das Register liest zwei Verzeichnisse ueber IPC. Die Zahl steht deshalb erst,
     * wenn die Klappe einmal offen war - vorher bleibt die Zeile leer. */
    strategieregister: function () {
      var n = window.Scoreboard && window.Scoreboard.registerStand ? window.Scoreboard.registerStand() : null;
      return n == null ? null : n + ' Strategien im Register';
    },
    strategieeingabe: null,
    /* Das Urteil zum Winkel-Detektor steht nicht in einem Messprotokoll, sondern in
     * studienurteile.js - der Ablage fuer Studien AUSSERHALB der Messmaschine. Dort
     * stehen ausschliesslich Verwerfungen (Regel D2), das Wort "widerlegt" haengt
     * also an der Existenz des Eintrags und nicht an einer Konstante hier. */
    wende: function () {
      var v = window.StudienUrteile && window.StudienUrteile.verworfen && window.StudienUrteile.verworfen('kanaltrend');
      if (!v || !v.datum) return null;
      return 'widerlegt · Studie ' + String(v.datum).split('-').reverse().join('.');
    }
  };
  /* /KLAPPEN_STAND */

  /** Jede Statuszeile einmal schreiben. Wirft eine Quelle, bleibt DIESE Zeile leer -
   *  eine kaputte Auskunft darf die zehn anderen nicht mitnehmen. */
  function klappenStandSetzen() {
    Object.keys(KLAPPEN_STAND).forEach(function (name) {
      var el = document.getElementById('kstand-' + name);
      if (!el) return;
      var fn = KLAPPEN_STAND[name], txt = null;
      try { txt = fn ? fn() : null; } catch (e) { txt = null; }
      el.textContent = txt == null ? '' : String(txt);
    });
  }
  ['quotes-updated', 'kanten-geladen', 'sub-changed', 'tab-changed'].forEach(function (ev) {
    document.addEventListener(ev, klappenStandSetzen);
  });
  document.addEventListener('DOMContentLoaded', klappenStandSetzen);
  klappenStandSetzen();

  /* Den gemerkten Ort erst herstellen, wenn das DOM steht UND die Warteschlange einmal
   * durchgelaufen ist: mehrere Zuhoerer von 'tab-changed' melden sich erst in ihrem
   * EIGENEN DOMContentLoaded an (marktkarteui.js, scoreboard.js), und app-shell.js
   * laeuft als zweites von 31 Skripten vor ihnen. Ohne den Umweg ueber setTimeout
   * ginge die Wiederherstellung an genau den Modulen vorbei, fuer die sie gedacht ist. */
  function uiHerstellen(st) {
    if (st && typeof st === 'object') {
      if (typeof st.tab === 'string') UI.tab = st.tab;
      if (st.sub && typeof st.sub === 'object') UI.sub = st.sub;
    }
    // Eine beschaedigte Store-Datei darf keinen Selektor sprengen. Alle echten
    // data-sub- und data-tab-Werte sind reine Kleinbuchstaben.
    var gueltig = /^[a-z]+$/;
    /* Erst die Pillen, dann der Reiter: so trifft 'tab-changed' einen Reiter, dessen
     * Unterseite schon steht - sonst zeichnet ein Zuhoerer in ein Panel, das gleich
     * darauf ausgeblendet wird. */
    Object.keys(UI.sub).forEach(function (t) {
      if (!gueltig.test(t) || !gueltig.test(String(UI.sub[t]))) return;
      var reiter = document.getElementById('tab-' + t);
      var p = reiter ? reiter.querySelector('.pills button[data-sub="' + UI.sub[t] + '"]') : null;
      if (p && !p.classList.contains('active')) pilleZeigen(p, true);
    });
    /* Nur wechseln, wenn es wirklich ein anderer Reiter ist: ein 'tab-changed' auf den
     * ohnehin offenen Reiter liesse Marktkarte und Scoreboard ein zweites Mal laden -
     * beide haben dafuer eigene Anlauf-Zeitgeber. */
    if (UI.tab && gueltig.test(UI.tab)) {
      var rb = document.querySelector('nav.tabs button[data-tab="' + UI.tab + '"]');
      if (rb && !rb.classList.contains('active')) reiterZeigen(rb, false);
      /* Der gemerkte Ort kann einen Reiter nennen, den es NICHT MEHR GIBT: nach
       * Stufe 1 des Umzugs (02.09.2026) steht in jedem gewachsenen Store noch
       * "depot" oder "messung". Ohne diese Zeilen bliebe der tote Name im Merker
       * stehen und wuerde bei jedem Speichern weitergereicht. Der Bildschirm ist
       * dabei nie leer - es wird schlicht nicht umgeschaltet, also bleibt der
       * Start-Reiter "Heute" stehen. */
      if (!rb) {
        var aktiv = document.querySelector('nav.tabs button[data-tab].active');
        UI.tab = aktiv ? aktiv.getAttribute('data-tab') : null;
      }
    }
    uiGeladen = true;
  }
  document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () { uiStand.then(uiHerstellen); }, 0);
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

    /* Punkte sind Messaussagen und laufen IMMER zuerst durch U.esc - Fremdes wird
     * nie zu Markup. Drei aeltere Registereintraege tragen aber selbst einfache
     * Auszeichnung (fett, kursiv, Code) und zeigten sie dem Leser woertlich als
     * spitze Klammern (Fund 25.08.2026, D6-Gegenprobe). Nach dem Escapen werden
     * deshalb genau die drei harmlosen Element-Namen b, i und code zurueckverwandelt -
     * eine Whitelist hinter dem Escapen, kein Aufweichen: jedes andere Element und
     * jedes Attribut bleibt sichtbarer Text. */
    function ausz(s) {
      return U.esc(s).replace(/&lt;(\/?)(b|i|code)&gt;/g, '<$1$2>');
    }

    function zeigen(knopf) {
      var e = REGISTER[knopf.getAttribute('data-info')], k = kasten();
      if (!e || !k) return;
      k.innerHTML =
        '<button type="button" class="ip-zu" aria-label="Erklärung schließen">×</button>' +
        '<h4>' + U.esc(e.titel) + '</h4>' +
        '<ul>' + (e.punkte || []).map(function (p) { return '<li>' + ausz(p) + '</li>'; }).join('') + '</ul>' +
        (e.fuss ? '<div class="ip-fuss">' + ausz(e.fuss) + '</div>' : '');
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
    /* Stufe 3 des Oberflaechen-Umbaus (03.09.2026), "Schnitt": Was hier steht, stand
     * bis dahin als Dauertext im Bestand-Kopf. Der Wortlaut ist WOERTLICH uebernommen,
     * nur der Ort hat sich geaendert. Sichtbar geblieben ist die Zusicherung
     * ("Simulation mit virtuellem Kapital - keine Anlageberatung") samt dem Instrument,
     * das das Depot gerade wirklich handelt: wer das nicht liest, entscheidet falsch. */
    'heute.simulation': {
      titel: 'Was hier simuliert wird',
      punkte: [
        /* Stufe 4 (03.09.2026): der Satz aus der Kopfzeile, WOERTLICH. Er stand dort
         * seit Stufe 3 in voller Laenge und drueckte die vier Knoepfe in eine zweite
         * Reihe; sichtbar geblieben ist die Marke "Simulation" mit dem Knopf, der
         * diesen Eintrag oeffnet. Er steht bewusst an erster Stelle - er ist die
         * Zusicherung, alles Weitere ist ihre Ausfuehrung. */
        'Alles hier ist Simulation. Es wird nichts gekauft und nichts verkauft.',
        'Optionsscheine werden synthetisch bepreist (Black-Scholes): Hebel, Zeitwertverfall, Volatilitäts-Smile und der Vola-Einbruch nach Ergebnisterminen sind abgebildet, echte Emittenten-Preise nicht.',
        'Läuft, solange die App geöffnet ist.',
        'Hier steht, was das Depot hält und was es getan hat. Wonach gehandelt wird – Strategien, Einstellungen und Werkzeuge – steht im Reiter <b>Regeln</b>.'
      ],
      fuss: 'Wie ein Schein im Einzelnen bepreist wird, steht beim Schein-Finder.'
    },
    'modell.schein': {
      titel: 'Wie ein Optionsschein hier bepreist wird',
      punkte: [
        /* Die vier Saetze der Schein-Finder-Einleitung, woertlich aus index.html
         * hierher gezogen (Stufe 3). Sichtbar blieb dort ein Satz plus dieser Knopf. */
        'Rechnet das volle Raster möglicher Scheine zu einem Basiswert durch – mit <b>demselben Modell, mit dem das Depot handelt</b> (Black-Scholes plus das an echten Emittentenkursen geeichte Spanne-Modell).',
        'Jeder Schein hier verhält sich exakt so wie in der Simulation. Zu jeder Zeile lässt sich der <b>echte Schein mit WKN</b> nachschlagen (Spalte „WKN“ oder Zeile anklicken) – Emittent, echte Geld-/Brief-Kurse und der Abstand zur Modell-Zeile stehen dabei, denn Emittenten legen nur auf feste Verfallstage auf.',
        'Die <b>Risikostufe</b> (1 defensiv … 5 Lotterielos) begrenzt auf Wunsch auch den Handel – Einstellung „maximale Risikostufe“ im Depot unter Risiko & Kosten.',
        'Black-Scholes mit der aus den Kursen geschätzten Volatilität – keine echten Emittenten-Preise. Die Spanne ist an echten Kursen geeicht (onvista), das Modell selbst nicht.',
        'Volatilitäts-Smile: Ein Schein abseits des Geldes bekommt nicht mehr dieselbe Vola wie einer am Geld. Puts sind auf der Seite teurer, Calls knapp über dem Kurs billiger – so herum, nicht anders. Bei den Abständen, die diese App handelt (0 bis 3 %), macht das zwischen 0,0 und 2,5 % Scheinpreis aus.',
        'Volatilität um einen Ergebnistermin: Sie steigt bis zu 25 % davor an und fällt danach unter das Normalniveau zurück („IV-Crush"). Gemessen am Beispiel: ein Schein am Geld mit 21 Tagen Restlaufzeit verliert über die Zahlen rund 29 % – bei UNVERÄNDERTEM Kurs.',
        'Vega steht in der Positionstabelle: wie viel ein einzelner Volatilitätspunkt diese Position wert ist. Bis 8.24.5 kam Vega in der Simulation überhaupt nicht vor – die Vola wurde beim Öffnen eingefroren.',
        'Der Zinssatz steht auf 2 % und ist eine Annahme, keine Messung. Bei diesen Laufzeiten ändert er den Preis um wenige Zehntelprozent.'
      ],
      fuss: 'Smile und Termin-Struktur sind Modellannahmen in der üblichen Größenordnung, NICHT an Emittentenkursen kalibriert – dafür fehlen der App echte Scheinpreise über mehrere Basispreise. Die Richtung ist belastbarer als die Höhe.'
    },
    'einstellungen.alpaca': {
      titel: 'Alpaca-Paper – das zweite Kosten-Gefäß',
      punkte: [
        'Capital.com-Demo misst CFD-Runden, Alpaca-Paper misst echte US-Aktien mit Papiergeld. Beide Reihen bleiben getrennt: die Aktienhürde (0,06 Prozentpunkte je Umlauf) wird nur an Alpaca-Runden geprüft, die CFD-Hürde (0,10 %) nur an Capital-Runden.',
        'Eine Runde kauft rund 200 $ zum Markt und verkauft sofort wieder; gemessen werden beide Ausführungen gegen die Mitte davor. Das Paper-Konto füllt am besten Geld-/Briefkurs – gemessen wird also die Spanne, die unbekannte Größe.',
        'Alpaca füllt im Paper rund jede zehnte Order absichtlich nur teilweise. Das ist ein Simulationsartefakt: der Rest wird storniert, die Position glattgestellt, die Runde verworfen und als „Teilfüllung“ protokolliert.',
        'Gemessen wird nach Umsatzklasse (5–50, 50–250, 250–1.000, ab 1.000 Mio $ Median-Tagesumsatz über 20 Balken, die Umsatzregel des Momentum-Buchs), Ziel zehn Runden je Klasse, Werte aus Momentum-Korb und Intraday-Signalliste. Dazu eine Übernacht-Runde: Kauf in der Schlussauktion, Verkauf zur Folgeeröffnung, beide Fills gegen den offiziellen Schluss und die offizielle Eröffnung gehalten.',
        'Der Schlüssel geht nur an paper-api.alpaca.markets und data.alpaca.markets, wird verschlüsselt gespeichert und erscheint in keiner Meldung. Ein Live-Handel ist aus dieser App nicht möglich.'
      ],
      fuss: 'Reine Simulation mit Papiergeld, keine Anlageberatung.'
    },
    'regeln.uebersicht': {
      titel: 'Die Strategien im Überblick',
      punkte: [
        'Sie handeln unterschiedlich, brauchen unterschiedliche Instrumente und sind unterschiedlich gut gemessen.',
        'Jede lässt sich einzeln ein- und ausschalten.',
        'Was auf jeder Karte hinter dem i steht, ist der ehrliche Belegstand – einschließlich der Punkte, die dagegen sprechen.'
      ],
      fuss: 'Den Belegstatus jeder Regel mit vollständigem Entscheidungsweg zeigen die Messprotokolle unter „Werkzeuge → Betrieb“.'
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
        'Die Ordnung eines Kanals („besser als X % des Zufalls“) ist beschreibend – die Regel fragt nur die Richtung ab, es gibt keine Schwelle, und kanalUeber liefert immer einen Kanal, nie „keiner“. Seit #80 wird sie als Perzentil gegen Rauschen gezeigt: die frühere Roh-Güte gab reinem Zufall im Median 75–94 von 100.',
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
        'Das ist eine <b>Übersicht, kein Signal</b>. An dieser Karte ist nichts gemessen. Sie sortiert nichts nach „bestem Sektor“ und hebt nichts hervor: Das sähe nach einem Befund aus und wäre keiner.',
        /* Stufe 3 (03.09.2026): diese zwei Legendensaetze standen woertlich so unter der
         * Karte (marktkarteui.js). Sichtbar geblieben sind dort die gezaehlten Werte und
         * der Farb-Deckel - beides kommt aus dem Lauf bzw. aus window.Marktkarte.DECKEL
         * und darf nicht als fester Text hier einfrieren. */
        '<b>Fläche</b> = Kurs × Aktienanzahl, bei jeder Aktualisierung neu gerechnet.',
        'Gruppiert nach Branche aus dem SIC-Code der SEC.'
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
        'Was die Regel sieht, endet bei der aktuellen Kerze. Die Bausteine halten sich streng daran; wer selbst schreibt, muss selbst darauf achten.',
        /* Stufe 3 (03.09.2026): woertlich aus dem Fussabsatz unter dem Ablegen-Knopf. */
        'Die Datei landet unter <code>Markt-Dashboard-Daten/strategien/</code>. Danach erscheint hier der Knopf <b>Jetzt messen</b>. Die Messmaschine läuft dabei in einem <b>eigenen Prozess</b> neben der App – das Urteil kommt weiterhin aus ihr und nicht aus dem Programm, das die Strategie anzeigt. Wer lieber von Hand misst oder ein anderes Archiv prüfen will, findet daneben den fertigen Befehl. Das Protokoll erscheint anschließend oben im Scoreboard.',
        /* Stufe 3: die zweite Haelfte des Denkanstosses unter dem Grund-Feld
         * (scoreboard.js grundHilfe). Die erste Haelfte ("Trägt: …") bleibt sichtbar -
         * sie wechselt mit dem gewaehlten Muster und ist dort der eigentliche Hinweis. */
        '<b>Trägt nicht:</b> „Der Kurs fällt montags oft“ oder „das sieht im Chart gut aus“. Das ist eine Beobachtung, keine These – und die Maschine verweigert die Messung dann nicht, sie zerlegt sie nur.'
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
      titel: 'Meine Papiere',
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
        'Ungemessen, reine Beobachtung: „Gap and Go“ gehört zur Ausbruchsfamilie, und die ist hier in 3.372 Tests widerlegt worden.',
        /* Stufe 3 (03.09.2026): woertlich aus der Fusszeile der Karte (renderer.js).
         * Sichtbar blieben dort die SCHWELLEN selbst - die stehen nicht hier, weil
         * sie aus window.Vormarkt kommen und sich mit der Quelle aendern duerfen. */
        'Eine Volumen-Schwelle steht bewusst nicht drin: Yahoo liefert vorbörslich kein Volumen (am 23.08.2026 an fünf liquiden Werten geprüft, jede Kerze 0). Gezählt wird deshalb, wie lange überhaupt gehandelt wurde.',
        'Durchsucht werden die Yahoo-Listen (Tagesgewinner, Nebenwerte, umsatzstärkste) und die 15 Werte dieses Reiters – nicht der ganze Markt: die Listen sortieren nach dem regulären Vortag, ein Wert, der erst heute Nacht springt, kann darin fehlen.'
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
    },
    /* Die Mittelfrist-Pille trug drei Absatz-Waende als Dauertext (Momentum-Intro,
     * "Was du dabei wissen musst", Drift-Intro samt Messblock). Der Wortlaut ist
     * UNVERAENDERT hierher uebernommen (Regeln-Ausduennung 31.08.2026); sichtbar
     * geblieben sind die entscheidungsrelevanten Zahlen in je einem Satz. */
    /* B11 (01.09.2026): stand als Dauer-Absatz ueber den Buch-Anzeigen; Wortlaut
     * unveraendert uebernommen, nur der Ort hat sich geaendert. */
    'vermoegen.buecher': {
      titel: 'Mittelfrist-Depot · die zwei Bücher',
      punkte: [
        'Zwei getrennte virtuelle Bücher à 100.000 $, die die beiden Strategien <b>tatsächlich führen</b> – beide halten über die volle Historie, aber nicht auf den zurückgehaltenen Jahren ab 2005 (Momentum t = 1,62; Ergebnis-Drift nach Zeitzonen-Korrektur 8,44 statt 14,07 % p.a.). Stand 23.08.2026, Details unter Werkzeuge → Betrieb, Messprotokolle.',
        'Bis hierher waren Momentum und Ergebnis-Drift Rechenblätter ohne Depot. Die Schalter im Reiter „Regeln“ entscheiden: <b>an</b> heißt selbsttätig handeln, <b>aus</b> heißt nur rechnen und erinnern („Rebalancing fällig“ mit Handlungsliste).'
      ],
      fuss: 'Alles Simulation, keine Anlageberatung.'
    },
    'regeln.antwort': {
      titel: 'Was die App gerade tut',
      punkte: [
        'Oben steht, was gerade gehandelt wird: jede laufende Strategie in einem Satz, daneben ihr Beleg-Etikett aus dem Messprotokoll (oder der dokumentierten Verwerfung) – die App liest dieses Urteil, sie behauptet es nicht.',
        '„Zuletzt getan“ ist die letzte echte Handlung: eine eröffnete oder geschlossene Position in einem der Bücher. Prüfläufe ohne Handlung zählen nicht als Tun – wann zuletzt geprüft wurde, steht in Klammern dahinter.',
        'Darunter der Rahmen: Autopilot (misst nachts, wendet nur doppelt Bestätigtes an), die stündlich gemessene Marktlage und die Risiko-Zeile mit offenen Positionen und Tagesverlust-Limit.',
        'Diese Seite stellt nichts ein. Schalter, Parameter und Werkzeuge liegen in den Pillen dahinter.'
      ],
      fuss: 'Alles hier ist Simulation mit virtuellem Kapital. Keine Anlageberatung.'
    },
    'regeln.autopilot': {
      titel: 'Was die Nacht misst',
      punkte: [
        'Das <b>Kursarchiv</b> sammelt jede geladene Kursreihe dauerhaft – die Messbasis wächst mit jedem Handelstag, statt an Yahoos kurzem Rückblick zu kleben.',
        'Was die Nacht misst, hängt von deiner Strategie ab: Fährst du eine der <b>gemessenen Strategien</b> (RSI2 im Seitwärtskanal / Kapitulations-Dip), arbeitet die Nacht als <b>Edge-Wächter</b> – sie prüft auf dem vollen Handels-Universum, ob der gemessene Vorsprung im frischen Fenster noch trägt (Überschuss gegen die Drift, t über Symbole), und vergleicht nur noch die wenigen gemessenen Stellschrauben (Haltedauer-Varianten).',
        'Das alte Setup-Rennen über die widerlegten Signale läuft dort bewusst nicht mehr – es hat Scheinsieger produziert.',
        'Fährst du ein anderes Setup, misst die Nacht wie bisher alle Kandidaten per Walk-Forward; übernommen wird nur, was sich in <b>zwei Nächten hintereinander</b> bestätigt, angewendet morgens vor Handelsbeginn. Von Hand gesetzte Felder bleiben unangetastet.',
        /* Stufe 3 (03.09.2026): stand woertlich als Absatz ueber dem Autopilot-Schalter. */
        'Die Nacht misst auf dem <b>Kursarchiv</b> – als Edge-Wächter auf den gemessenen Kanten, sonst per Walk-Forward über alle Kandidaten. Übernommen wird nur, was sich in <b>zwei Nächten hintereinander</b> bestätigt; von Hand gesetzte Felder bleiben unangetastet.'
      ]
    },
    /* --- Neu mit Stufe 3 (03.09.2026): die Erklaerabsaetze des Maschinenraums.
     * Jeder Wortlaut ist unveraendert aus index.html bzw. archivkarte.js uebernommen;
     * sichtbar geblieben ist je ein Satz und der i-Knopf. */
    'betrieb.kursarchiv': {
      titel: 'Wie das Kursarchiv entsteht',
      punkte: [
        'Die App holt die feinen Kerzen selbst und legt sie im Kursarchiv ab – dasselbe Format und dieselbe Ablage, die auch das Abrufwerkzeug schreibt.',
        '<b>Yahoo hält Intraday-Kerzen nur begrenzt vor</b> (1 Minute 7 Tage, 5 und 15 Minuten 60 Tage). Was in dieser Zeit nicht geholt wurde, ist nicht später nachzuholen, sondern fort.',
        'Warum nach Handelsschluss: Yahoo korrigiert fertige Kerzen noch rund 18 Minuten rückwirkend nach (am 26.08.2026 über sechs Runden gemessen). Wer mitten in der Sitzung sammelt, schreibt vorläufige Zahlen.',
        'Stunden- und Tageskerzen holt die App <b>nicht</b>: die umfassen das ganze Universum und gehören zu den nächtlichen Werkzeugen.'
      ]
    },
    'betrieb.backfill': {
      titel: 'Kursarchiv auffüllen (Capital.com)',
      punkte: [
        'Einige tausend Abrufe (rund 200 Werte × drei Zeitrahmen), <b>mit Absicht gedrosselt</b>, weil Capital.com zu schnelle Läufe sperrt.',
        'Rechne mit <b>30–90 Minuten</b> und einigen hundert MB im Datenordner; jederzeit anhaltbar, ein neuer Lauf setzt am letzten Stand an.'
      ]
    },
    'betrieb.backtest': {
      titel: 'Was der Backtest rechnet – und was nicht',
      punkte: [
        'Rechnet das eingestellte Setup auf synthetischen <b>Optionsscheinen</b>, in beide Richtungen und mit Glattstellung am Abend.',
        'Für die beiden gemessenen Kanten passt das nicht – sie handeln den Basiswert, nur Long und über Nacht –, deshalb verweigert der Backtest dort die Auskunft; sie misst der Autopilot nachts auf dem Kursarchiv.',
        'Historische Nachrichten gibt es nicht, getestet wird der technische Kern.',
        'Der Belegstand jeder Strategie steht auf der Pille <b>Strategien</b> – der Backtest ist ein Rechenwerkzeug, kein Urteil.'
      ]
    },
    /* Stufe 4 (03.09.2026): der Absatz stand als Dauertext im Fuss der
     * Intraday-Karte (#regimeHint, geschrieben von depot.js renderRegime). Wortlaut
     * unveraendert; sichtbar geblieben ist dort der Live-Stand, nicht die Erklaerung. */
    'regeln.intraday': {
      titel: 'Die Marktlage in der Intraday-Karte',
      punkte: [
        'Die Marktlage wird stündlich gemessen und hier angezeigt. Die Strategie stellt sie nicht um – das entscheidet der Autopilot nach der Nacht-Messung, oder du selbst. In erkennbar wirren Phasen setzt sie neue Einstiege für rund eine Stunde aus; offene Positionen laufen normal weiter.'
      ]
    },
    'regeln.watchlist': {
      titel: 'Was in jeder Runde geprüft wird',
      punkte: [
        'Die gemessenen 60-Minuten-Einstiege schauen zusätzlich in den gewählten Beobachtungs-Pool (Vorgabe: 99 Werte) – daraus rotieren zwölf je Runde, damit ein Scan nicht in Kursabrufe ausartet.'
      ]
    },
    'werkzeuge.explorer': {
      titel: 'Was der Aktien-Explorer zeigt',
      punkte: [
        'In der Detail-Ansicht: Chart von 1 Tag bis Max., Kennzahlen, News, „Analyse anfordern“ und „Zur Handels-Watchlist“ (dann handeln die Strategien den Wert mit).'
      ]
    },
    'regeln.mf.momentum': {
      titel: 'Momentum im Querschnitt',
      punkte: [
        'Diese Strategie vergleicht alle Werte des Universums <b>miteinander</b> und hält das stärkste Zehntel. Kein Chartmuster, kein Ein- und Ausstiegssignal – nur eine Rangfolge, die alle drei Monate neu gebildet wird.',
        'Seit 02.09.2026 handelt das Buch <b>exakt die gemessene liquide Konfiguration</b>: Rückblick 231 Handelstage, Lücke 21, Halten 63, stärkstes Zehntel, Korb nur Werte mit Median-Tagesumsatz ≥ 100 Mio $ (20 Balken bis zum Stichtag, vor der Rangbildung). Die Schwelle ist nominal und wird nicht angepasst – ihre Drift steht als Korbgröße je Umschichtung im Buch. Ab der ersten Umschichtung auf dem liquiden Korb ist jede weitere ein Out-of-Sample-Beleg.',
        'Gekauft werden <b>Aktien</b>; mit Hebelscheinen auf 21 Tage ist eine Haltedauer von drei Monaten nicht darstellbar, der Zeitwertverfall frisst sie auf.',
        '<b>Der größte Rückschlag lag bei 52 Prozent</b> (2008). Das ist kein ruhiges Investment. Wer bei so einem Einbruch aussteigt, hat den Effekt nicht – er entsteht gerade dadurch, dass man dabeibleibt.',
        '<b>In 8 von 22 Jahren war das Depot schlechter als der Markt.</b> 2024 lag es bei −0,1 % gegen +7,4 %. Momentum verliert typischerweise genau dann, wenn der Markt scharf dreht.',
        '<b>Das Universum enthält nur Firmen, die es heute noch gibt.</b> Pleiten und Übernahmen fehlen in den Daten. Der Vergleich läuft gegen den Durchschnitt derselben Werte, was das dämpft, aber nicht aufhebt. Der gemessene Vorsprung ist eher eine Obergrenze.',
        /* Stufe 3 (03.09.2026): der erste Satz von #mfErklaerung, woertlich. Sichtbar
         * geblieben ist dort der zweite - die Rueckschlag-Zahl ist eine Messaussage. */
        'Vergleicht alle Werte des Universums <b>miteinander</b> und hält das stärkste Zehntel – kein Chartmuster, nur eine Rangfolge alle drei Monate.'
      ],
      fuss: 'Alles hier ist Simulation. Es wird nichts gekauft und nichts verkauft.'
    },
    'regeln.mf.drift': {
      titel: 'Ergebnis-Drift',
      punkte: [
        'Nach einer Quartalsmeldung läuft der Kurs noch Wochen in Richtung der Überraschung weiter. Gekauft wird das <b>oberste Fünftel</b> der Überraschungen, verkauft das <b>unterste</b> – gleich viele, aus demselben Topf.',
        'Anders als das Momentum ist das <b>kein Chartsignal</b>: Die Information kommt aus den Zahlen, nicht aus dem Kursverlauf. Deshalb bleibt neben dem Momentum messbar etwas übrig (Korrelation der Monatserträge nur 0,41, Alpha +6,90 % p. a. bei t = 2,20).',
        '<b>Nicht mit Hebelscheinen handelbar.</b> Am 21.08.2026 durchgerechnet: Der Basiswert müsste 5,5 bis 11 % laufen, damit ein Schein nach Zeitwertverfall und Spanne bei null herauskommt – der Drift liefert rund 1,3 % je Position. Faktor 4 bis 8 zu wenig. Gerechnet wird deshalb im Basiswert.',
        '<b>Was gemessen ist.</b> 20.356 Ergebnistermine aus 197 Werten, 1993–2026. Marktneutral, 60 Handelstage, Rang nur gegen bereits veröffentlichte Zahlen: ab 2015 <b>+10,44 % p. a. bei t = 3,04</b> und 67 % positiven Monaten, positiv in allen sieben Teilzeiträumen. Zufällige Zuordnung ergibt −1,74 % (t = −0,88) – der Aufbau selbst erzeugt nichts.',
        '<b>Was offen bleibt.</b> Die Überlebensverzerrung ist nur teilweise ausgeräumt: In der über zehn Jahre schwachen Hälfte der Werte bleiben nur +1,72 % (t = 0,58), in der starken +8,61 %. Ein guter Teil sitzt weiter in den Gewinnern von heute. Und es braucht <b>beide Beine</b> – long allein ist überwiegend Marktbeta.'
      ],
      fuss: 'Alles hier ist Simulation. Es wird nichts gekauft und nichts verkauft.'
    },
    /* Die Experten-Einstellungen (#idParams) erklaerten sich bis 8.31 ausschliesslich
     * ueber 18 title-Tooltips - weder per Tastatur noch auf einem Tastbildschirm
     * erreichbar, und sieben Bedienelemente hatten gar keine Erklaerung. Die Tooltips
     * BLEIBEN als Zweitweg stehen; hier steht nicht ihre Nacherzaehlung, sondern der
     * Grund, warum es die Gruppe gibt und was ein Dreh daran kostet.
     * WICHTIG: kein Markup in den Punkten - Info.zeigen() escaped sie, ein b-Element
     * erschiene dem Nutzer woertlich. */
    'regeln.param.signal': {
      titel: 'Signal – wann überhaupt gekauft wird',
      punkte: [
        'Diese Gruppe ist keine Feineinstellung. Setup, Auslöser, Zeitrahmen und Ausstieg bilden zusammen die Regel, die gemessen wurde – wer eines davon verstellt, handelt eine andere Regel als die, für die es ein Protokoll gibt.',
        'Deshalb bringt die Auslöser-Wahl ihre gemessene Haltedauer gleich mit: 8 Handelsstunden bei RSI(2) im Seitwärtskanal, 26 beim Kapitulations-Dip. Wird sie danach von Hand geändert, steht das im Experiment-Journal und lässt sich dort einzeln zurücknehmen.',
        'Setup und Auslöser hängen zusammen: „Ausbruch“ handelt mit der Bewegung, „Umkehr“ gegen die Übertreibung. Die Auslöser-Liste wechselt deshalb mit dem Setup, und Felder, die im gewählten Modus nichts entscheiden, werden ausgeblendet statt wirkungslos dazustehen.',
        'Leitlinie und EMA-Periode wirken nur dort, wo der Modus sie abfragt: im Kapitulations-Modus ist die EMA20 der Bezug der Überdehnung, beim RSI(2)-Modus ist sie nur Orientierung und entscheidet nichts.',
        'Die Bestätigung ist ein Mindestabstand jenseits der Leitlinie und wirkt im Umkehr-Setup als z-Score-Schwelle (1,5 / 2,0 / 2,5). Sie entscheidet nicht über die Richtung, sondern darüber, wie weit der Kurs gelaufen sein muss, bevor die Regel überhaupt hinsieht.'
      ],
      fuss: 'Die Automatik stellt diese Felder normalerweise selbst ein. Was gerade läuft, steht im Klartext-Kasten über dieser Klappe.'
    },
    'regeln.param.risiko': {
      titel: 'Risiko & Kosten – was ein Trade kosten darf',
      punkte: [
        'Hier entscheidet sich, ob von einem gemessenen Vorsprung überhaupt etwas übrig bleibt. Die Produkthürde – was der Basiswert laufen muss, damit ein Umlauf aus Spanne, Gebühr und Aufgeld bei null herauskommt – ist in diesem Projekt der Grund, an dem die meisten Intraday-Kanten scheitern.',
        'Deshalb steht die Hürde bei den Hebel-Profilen in der Auswahl selbst: 0,07 Pp (Ruhig 60 T, BV 1,0), 0,09 Pp (Moderat, BV 1,0), 0,26 Pp (Moderat, BV 0,1), 0,61 Pp (Heiß, BV 0,1). Die Profile unterscheiden sich in der Hürde, nicht im Ergebnis.',
        'Der eigentliche Kostenhebel ist das Bezugsverhältnis, nicht der Hebel: Emittenten stellen die Spanne als festen Cent-Betrag. Ein BV-1,0-Schein kostet je Stück das Zehnfache, zahlt aber nur den doppelten Cent – also ein Fünftel des relativen Spreads bei gleichem Hebel.',
        'Instrument „Aktie 1×“ ist Vorgabe, nicht Vorsicht: Für eine Strategie, deren Vorsprung unter der Schein-Kostenhürde liegt, ist der Basiswert der einzige gangbare Weg. Bei RSI(2) im Seitwärtskanal war dieselbe Strategie mit Schein im Backtest bei −96 %.',
        'Positionsgröße und Not-Stop ändern nicht, wie oft die Regel recht hat, sondern was ein Irrtum kostet. „Risiko X %“ bemisst den Einsatz so, dass ein ausgelöster Stop immer ungefähr X % des Depots kostet – bei „fix“ schwankt genau das mit der Schwankungsbreite des Werts.',
        'Die maximale Risikostufe wirkt depotweit und gilt auch für Käufe von Hand, vom Autopiloten und aus einer Empfehlung. Sie ist die einzige Grenze dieser Gruppe, die im Einzelfall niemand übergeht.'
      ],
      fuss: 'Was die eingestellte Kombination gerade kostet, rechnet die Hürden-Zeile unter dieser Gruppe aus.'
    },
    'regeln.param.filter': {
      titel: 'Filter & Schutz – was einen Trade verhindert',
      punkte: [
        'Alles in dieser Gruppe verhindert Trades, nichts erzeugt welche. Ein Filter ist damit immer ein Tausch: weniger Signale gegen weniger Gelegenheiten, in denen die Regel außerhalb der Lage handelt, in der sie gemessen wurde.',
        'Liquidität und Zeitfenster sind deshalb keine Vorsicht, sondern Teil der Messbasis – und DAX-Werte sind ohnehin nur zwischen 15:30 und 17:30 handelbar; danach sperrt die Veraltet-Prüfung ihre Kurse automatisch.',
        'Der Event-Blackout sperrt die Kerzen um einen Quartalstermin herum. Dort reagiert der Kurs auf eine Nachricht und nicht auf das Muster, das die Regel erkennt – gemessen wurde ohne diese Kerzen.',
        '„Signale immer aufzeichnen“ ist der wichtigste Schalter der Gruppe und der einzige, der nichts kostet: Er lässt jedes Signal virtuell zu Ende laufen, auch bei ausgeschaltetem Handel. Ausschalten heißt: keine Beweisaufnahme mehr – und damit keine Grundlage, die Regel später zu bestätigen oder zu widerlegen.',
        'Zwei Schalter sammeln nur und handeln nichts: „Krypto-Messdaten sammeln“ füllt das Kursarchiv (24 Kerzen am Tag statt 6,5, keine Nachtlücken), der „Wellen-Screener“ rankt nach der Kennzahl des Wellental-Einstiegs – der hat keinen gemessenen Vorsprung.',
        '„Empfehlungen übernehmen“ darf beim Handels-Modus nur zwischen den beiden gemessenen Kanten wechseln, nie zu einem widerlegten Modus, und das Instrument nie. Jede Übernahme steht im Experiment-Journal und lässt sich dort einzeln zurücknehmen.'
      ]
    },
    'regeln.param.haltedauer': {
      titel: 'Haltedauer & Ausstieg – wann der Trade endet',
      punkte: [
        'Der Ausstieg ist Teil der Messung, nicht ihr Anhängsel: Dieselbe Regel misst sich völlig anders, je nachdem wann sie schließt. Streng bis Handelsschluss geschlossen ergab die Intraday-Kante −0,08 % je Trade, mit einer Nacht Haltezeit +0,23 %.',
        'Deshalb tragen zwei Haltedauern in der Liste den Zusatz „gemessen“: 8 Handelsstunden für RSI(2) im Seitwärtskanal, 26 für den Kapitulations-Dip. Die übrigen Werte sind wählbar, aber es gibt kein Protokoll zu ihnen.',
        'Ein Trailing-Stop verkürzt die Haltedauer unbemerkt – er schließt, sobald der Kurs X % unter seinem Hoch steht. Damit läuft eine andere Haltedauer als die, für die das Protokoll gilt.',
        'Die Gruppe blendet sich aus, sobald der eingestellte Modus keinen ihrer Werte abfragt. Sie steht dann nicht wirkungslos da: Fehlt sie, bestimmt der Modus seinen Ausstieg selbst.'
      ]
    },
    /* Trendfinder: die beiden Begruendungs-Absaetze standen bis 8.31 als Dauertext ueber
     * der Tabelle. Der Wortlaut ist UNVERAENDERT uebernommen - es sind Messaussagen;
     * weggefallen sind nur die Auszeichnungen, weil Info.zeigen() escaped. */
    'werkzeuge.trendfinder': {
      titel: 'Warum aus der Trend-Güte hier keine Order wird',
      punkte: [
        'Warum aus einer guten Trend-Güte hier keine Order wird (Wunsch #58): Genau das ist gemessen worden – und durchgefallen. Der Trendkanal als Handelsbedingung kostete −0,17 Prozentpunkte je Trade bei t = −4,1 (Abschnittskanal-Studie): Er ist nicht neutral, sondern schädlich. Deshalb steht die Güte hier als Beschreibung des Moments und nicht als Auslöser.',
        'Und warum „zu wenig Historie“ stehen bleibt: Das ist keine Bequemlichkeit, sondern die Fallzahl. Für ein Urteil über eine Regel braucht es rund 30 Fälle je Wert; auf 5.000 Kerzen findet der Detektor etwa sechs. Bei sechs Fällen kippt das Vorzeichen des Mittels schon, wenn man nur die Abtastdichte ändert. Eine Order, die trotzdem ausgelöst wird, ist deshalb nicht mutiger als eine gemessene – sie ist nur ungemessen.',
        /* Stufe 3 (03.09.2026): die Textwand ueber der Tabelle, woertlich. Sichtbar
         * geblieben ist die Zusicherung "Beobachtung, kein Handel" und das URTEIL -
         * das liest wendeui.js aus studienurteile.js, es steht nicht hier.
         * Wie bei den zwei Punkten darueber sind nur die AUSZEICHNUNGEN weggefallen
         * (kein Markup in diesem Eintrag - eine Zusicherung haelt das fest). */
        'Diese Seite zeigt zuerst den laufenden Trend und seine drei Eigenschaften – Richtung, Güte, Breite – genau die drei, die auch der Aktien-Explorer zu einem Kanal nennt, aus derselben Rechnung.',
        'Der Trendwechsel steht daneben als das, was er ist: ein Sonderfall des Trends, nämlich der Moment, in dem ein junger Abschnitt gegen den Vortrend dreht (Wunsch #58).',
        'Dieser Detektor (dein Winkel-Vorschlag aus #33) war der einzige Teilüberlebende der Trendwende-Studie – aber ein guter Teil seines Vorsprungs war Tageszeit-Effekt, und die 1-Minuten-Basis war mit 7 Tagen zu kurz für ein Urteil. Die App sammelt seit 8.23.25 jede Nacht 1-Minuten-Kurse; in 4–6 Wochen wird sauber nachgemessen. Bis dahin zeigt diese Seite live, was der Detektor sieht – zum Spielen und Beobachten, genau wie vorgeschlagen.',
        'Sekunden-Kerzen (1/5/10 s) sind mit der Kursquelle nicht möglich – Yahoo liefert feinstens 1 Minute, und nur 7 Tage zurück. Geprüft werden die 15 Standard-Werte plus deine Watchlist; der Winkel zur Horizontalen und die Drehung gegen den Vortrend entsprechen exakt der Studien-Rechnung.',
        /* Und die vier erklaerenden Absaetze der Legende unter der Tabelle
         * (wendeui.js). Sichtbar geblieben ist dort, was gemessen ist. */
        'Trendfinder: Zuerst steht der laufende Trend mit seinen drei Eigenschaften – Richtung, Güte, Breite –, dieselben drei, die auch der Aktien-Explorer zu einem Kanal nennt, aus derselben Rechnung. Der Trendwechsel ist der Sonderfall rechts daneben: der Moment, in dem der junge Abschnitt gegen den Vortrend dreht (Wunsch #58).',
        'Trend ohne Wendepunkt: Die Wechsel-Erkennung braucht zwei bestätigte Wendepunkte. Wo die fehlen, stand hier früher nur „zu wenig Historie“ – auch dann, wenn ein schnurgerader Trend lief. Jetzt steht dort der Kanal über die letzten 120 Kerzen, als „Fenster“ gekennzeichnet. Ein Wechsel-Urteil gibt es in solchen Zeilen weiterhin nicht – das wäre eine Zahl ohne Grundlage.',
        'Winkel = Steigung × Abschnittslänge ÷ Kanalbreite (wie steil relativ zum eigenen Rauschen; Vorzeichen = Richtung). „Wechsel“ = junger Abschnitt ist steiler als die Schwelle UND dreht gegen den Vortrend – die Studien-Bedingung. Zeile anklicken zeigt den Kursverlauf mit Wendepunkt und beiden Abschnitten (Wunsch #38). Simulation, keine Anlageberatung.',
        'Zum Ausstieg: Der Detektor hat keine eigene Ausstiegsregel – er erkennt eine Drehung und sagt nichts darüber, wann man wieder heraus soll. Die einzige Regel, die aus ihm selbst folgt, ist die symmetrische: halten, bis der Winkel zurückdreht. Genau so ist die Spalte „Bisher“ gerechnet – jede vergangene Drehung dieser Reihe bis zur Gegendrehung.'
      ]
    }
  });

  // ---- Einstellungen ----
  var SETTINGS = { tray: false, capKey: '', capId: '', capPass: '', capEnabled: false,
                   alpKey: '', alpSecret: '', alpEnabled: false, kiVeto: false, kiRules: '', updateRepo: '' };
  /* Die geheimen Felder beider Broker-Anbindungen - Capital.com-Demo und Alpaca-Paper.
   * EINE Liste: Laden, Dialog, Speichern und Sentinel-Abbau laufen alle darueber. */
  var GEHEIM = ['capKey', 'capId', 'capPass', 'alpKey', 'alpSecret'];
  var GEHEIM_FELD = { capKey: 'setCapKey', capId: 'setCapId', capPass: 'setCapPass', alpKey: 'setAlpKey', alpSecret: 'setAlpSecret' };
  window.getSettings = function () { return SETTINGS; };
  var settingsGeladen = false; // Schreiben vor dem Laden würde die gespeicherten Werte überschreiben
  var geheimBehalten = {};     // Felder, deren gespeicherter Wert nicht entschlüsselbar war:
                               // im Dialog leer anzeigen, beim Speichern aber UNANGETASTET lassen
  window.api.storeGet('settings').then(function (s) {
    if (s) {
      GEHEIM.forEach(function (k) {
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

  /* Die zweite Einstellungs-Pille in der Werkzeug-Leiste ist mit Stufe 1 des Umzugs
   * (02.09.2026) entfallen. Sie war eine AKTION in einer Navigationsleiste - das
   * letzte Muster-Bruchstueck dort - und tat exakt dasselbe wie #settingsBtn in der
   * Kopfzeile, der von jedem Reiter aus erreichbar ist. Zwei Wege hinein waren
   * einer zu viel; die Wahrheit darueber, was der Dialog tut, stand ohnehin nur
   * an einer Stelle. */

  document.getElementById('settingsBtn').addEventListener('click', function () {
    document.getElementById('setTray').checked = !!SETTINGS.tray;
    GEHEIM.forEach(function (feld) {
      var el3 = document.getElementById(GEHEIM_FELD[feld]);
      if (!el3) return;
      el3.value = SETTINGS[feld] || '';
      el3.placeholder = geheimBehalten[feld] ? 'gespeichert - leer lassen = unverändert' : '';
    });
    document.getElementById('setCapEnabled').checked = !!SETTINGS.capEnabled;
    var alpEn = document.getElementById('setAlpEnabled');
    if (alpEn) alpEn.checked = !!SETTINGS.alpEnabled;
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

  /* Alpaca-Paper-Verbindung testen: Konto UND Boersenuhr abfragen, ohne zu speichern.
   * Die Kennungen gehen nur an paper-api.alpaca.markets (Host-Liste in main.js). Kein
   * Rumpf und keine Kennung landet in der Anzeige - nur Status, Guthaben, Uhr. */
  var alpTestBtn = document.getElementById('alpTestBtn');
  if (alpTestBtn) alpTestBtn.addEventListener('click', async function () {
    var st = document.getElementById('alpTestStatus');
    var det = document.getElementById('alpTestDetail');
    var key = (document.getElementById('setAlpKey').value || '').trim();
    var secret = (document.getElementById('setAlpSecret').value || '').trim();
    if (!key && typeof SETTINGS.alpKey === 'string') key = SETTINGS.alpKey;
    if (!secret && typeof SETTINGS.alpSecret === 'string') secret = SETTINGS.alpSecret;
    det.style.display = 'none'; det.textContent = '';
    var fehlt = [];
    if (!key) fehlt.push('Schlüssel-ID');
    if (!secret) fehlt.push('Geheimnis');
    if (fehlt.length) { st.textContent = 'Es fehlt noch: ' + fehlt.join(', ') + '.'; return; }
    alpTestBtn.disabled = true;
    st.textContent = 'Frage das Paper-Konto ab …';
    try {
      var BASE = 'https://paper-api.alpaca.markets/v2';
      var kopf = { 'APCA-API-KEY-ID': key, 'APCA-API-SECRET-KEY': secret };
      var res = await window.api.alpFetch('GET', BASE + '/account', kopf, null);
      if (!res.ok) {
        st.textContent = 'Abfrage fehlgeschlagen (HTTP ' + res.status + ').';
        det.style.display = '';
        det.textContent = (res.status === 401 || res.status === 403)
          ? 'Der Schlüssel wird abgelehnt. Prüfe, ob er unter „Paper Trading“ erzeugt wurde – Live- und Paper-Schlüssel sind verschieden – und ob Schlüssel-ID und Geheimnis zusammengehören.'
          : (res.status === 0 ? 'Keine Verbindung: ' + String(res.body || '').slice(0, 120) : 'Der Server antwortet mit HTTP ' + res.status + '.');
        return;
      }
      var a0 = JSON.parse(res.body);
      var uhrTxt = '';
      try {
        var c0 = await window.api.alpFetch('GET', BASE + '/clock', kopf, null);
        if (c0.ok) { var cj = JSON.parse(c0.body); uhrTxt = cj.is_open ? ' · Börse offen' : ' · Börse zu'; }
      } catch (eC) { uhrTxt = ''; }
      st.textContent = '✓ Verbunden · Paper-Konto ' + String(a0.status || '').slice(0, 20) + ' · Guthaben ' +
        Math.round(Number(a0.equity) || 0) + ' ' + String(a0.currency || 'USD').slice(0, 5) + uhrTxt;
      det.style.display = '';
      det.textContent = 'Der Test hat nichts gespeichert. Zum dauerhaften Messen unten „Speichern" klicken und das Häkchen ' +
        '„Messung aktivieren" setzen – dann misst der Automat eine Aktien-Runde je US-Handelstag und eine Übernacht-Runde.';
    } catch (e) {
      st.textContent = 'Test fehlgeschlagen: ' + ((e && e.message) || e);
    } finally {
      alpTestBtn.disabled = false;
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
    GEHEIM.forEach(function (feld) {
      var el4 = document.getElementById(GEHEIM_FELD[feld]);
      if (!el4) return;
      var wert4 = el4.value;
      if (feld !== 'capPass') wert4 = wert4.trim();
      // Leeres Feld bei nicht entschlüsselbarem Bestand heißt "behalten", nicht "löschen"
      SETTINGS[feld] = (wert4 === '' && geheimBehalten[feld]) ? { __keep: true } : wert4;
      if (wert4 !== '') geheimBehalten[feld] = false;
    });
    SETTINGS.capEnabled = document.getElementById('setCapEnabled').checked;
    var alpEn4 = document.getElementById('setAlpEnabled');
    SETTINGS.alpEnabled = !!(alpEn4 && alpEn4.checked);
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
    GEHEIM.forEach(function (k9) {
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
