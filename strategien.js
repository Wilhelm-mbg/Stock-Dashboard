'use strict';
/* ================= Strategie-Schalter =================
 *
 * Getrennte Zeithorizonte, getrennte Strategien, getrennte Schalter. Sie handeln
 * unterschiedlich, sie brauchen unterschiedliche Instrumente, und sie sind
 * unterschiedlich gut belegt. Genau das soll man hier auf einen Blick sehen können –
 * inklusive der unangenehmen Teile und der widerlegten Ansätze, die nur noch
 * dokumentiert werden.
 *
 * Warum getrennt und nicht ein gemeinsamer Automat: Ein Signal, das auf vier
 * Handelstage zielt, hat mit einem Momentum-Depot, das drei Monate hält, nichts
 * gemeinsam – weder in der Auswahl noch im Ausstieg noch im Instrument. Sie zu
 * vermischen war der Fehler der bisherigen Fassung.
 */
(function () {
  var U = window.U;

  /* Der Belegstand ist bewusst hier hinterlegt und nicht in der Oberfläche verstreut:
   * so steht die ehrliche Einschätzung an genau EINER Stelle und kann nicht auseinander-
   * laufen. Jede Zahl stammt aus einer Messung, die im Verlauf dokumentiert ist. */
  var STRATEGIEN = [
    {
      key: 'kurz',
      name: 'Kurzfristig · Intraday',
      horizont: 'Stunden bis wenige Tage',
      instrument: 'Aktie 1× (Voreinstellung) – mit Schein stirbt die Kante (−96 %)',
      was: 'Kauft im laufenden Handel den RSI(2)-Rücklauf im Seitwärtskanal. Zuschaltbar: der Kapitulations-Dip als zweites Standbein und die Regime-Zuteilung. Ausstieg über die Zeit, darunter nur ein Not-Stop – kein Gewinnziel, kein Trailing; die Position darf über Nacht laufen.',
      stand: 'gemessen – gegen Kontrolle nicht entscheidbar',
      farbe: 'warn',
      /* Struktur-Audit Punkt 3: unter welchen Kennungen die Messmaschine diese
       * Strategie fuehrt. Liegt ein Protokoll vor, zeigt die Karte dessen Urteil als
       * eigene Zeile - aus derselben Quelle wie Regelkopf und Kostenhuerde. */
      messKeys: ['rsi2seit', 'kapitulation'],
      beleg: [
        'KONTROLLMESSUNG 23.08.2026 (Messmaschine, Protokoll im Reiter Messung): Gegen die Erwartung aller Kerzen desselben Werts zur selben Stunde bleibt auf den zurückgehaltenen Tagen ein Überschuss von +0,024 Pp bei einer Mindest-Effektgröße von 0,182 Pp – nicht entscheidbar. Je Signal gerechnet sind es −0,045 Pp. Rund 62 % des früher gemessenen Rohvorteils waren schlichtes Halten. Mit keinem Produkt netto positiv. Die Zahlen darunter sind die Messungen VOR dieser Kontrolle; sie bleiben als Verlauf stehen.',
        'UNBEDINGT trägt kein Einzelsignal: Trefferquoten 46–56 %, bester Vorsprung +0,09 Pp. BEDINGT sieht es anders aus — die Bedingungsstudie vom 21.08.2026 (162 Werte, Stundenkerzen, jedes Signal gekreuzt mit Kanalzustand, EMA100, Volumen) fand: RSI(2)-Dip NUR im Seitwärtskanal mit Volumen = +0,147 Pp auf 8 h, t = 4,1 über die Symbole, beide Zeithälften positiv, 99 von 162 Werten im Plus.',
        'Der Kanal gibt nicht die Richtung, sondern die ERLAUBNIS: Dasselbe Signal ist im Trend ein Münzwurf und im Seitwärtsband messbar. Genau das war die These hinter dem handgezeichneten AMD-Chart.',
        'Das Instrument entscheidet: Der Vorsprung liegt ÜBER der Basiswert-Hürde (0,10 %) und UNTER der Scheinhürde (0,21 %). Im Backtest: Basiswert PF 1,23 (+0,23 % je Trade, volatiles Drittel), Schein −96 %. Und er zahlt über Nacht aus — streng intraday −0,08 % je Trade, mit einer Nacht Haltezeit +0,23 %.',
        'Nur die Call-Seite trägt (+0,075 %); das Put-Bein kämpft gegen die Marktdrift (−0,099 %) — dieselbe Lektion wie beim Ergebnis-Drift.',
        'Als Modus „RSI(2) im Seitwärtskanal“ (Umkehr-Auslöser) eingebaut: nur Long, Zeit-Ausstieg 8 Handelsstunden, darf eine Nacht überleben. Monatssignifikanz steht noch aus (36 Monate, t ≈ 0,5) — der Modus gehört in den Vorwärtstest, nicht auf großes Budget.',
        'Zuschaltbar als zweites Standbein: der Kapitulations-Dip. Gemessen Median +0,44 % je Trade, t = 4,6 — er kauft den Ausverkauf im Abwärtskanal, nur Long, Zeit-Ausstieg nach 26 Handelsstunden, kein Gewinndeckel.',
        'Zuschaltbar seit Version 8.23.26: die Regime-Zuteilung. Gemessen trägt rsi2seit nur über der SPY-EMA200 (+0,148 Pp; darunter −0,169 Pp), der Kapitulations-Dip nur darunter (+0,94 Pp, t = 3,1). Die Zuteilung schlug die statische Basis im Mittelwert (t = 3,21) und im Gesamtertrag (+45 Pp), Permutationstest p = 0,013.',
        'Auf diesen Daten OHNE tragfähige Zelle: Donchian, Squeeze, Pullback — in keiner Marktlage überzufällig.'
      ],
      schalter: 'intraday'
    },
    {
      key: 'stunden',
      name: 'Kurzfristig · Stunden-Strategie',
      horizont: 'stündliche Prüfung, rund 20 Handelstage je Signal',
      instrument: 'Optionsscheine: Call oder Put 5 % aus dem Geld, 60 Tage Laufzeit',
      was: 'Verrechnete jede Stunde Technik-Score und Nachrichtenlage zu einem Gesamtscore und kaufte ab ±0,35 einen Call oder Put. Seit Version 8.23.24 per Sicherung abgeschaltet — von Hand lässt sie sich wieder einschalten, dieser Hand-Entscheid wird bewusst respektiert.',
      stand: 'widerlegt – abgeschaltet',
      farbe: 'down',
      beleg: [
        'Gemessen, nicht vermutet: Der Technik-Score ist ein Kontraindikator. −0,74 Prozentpunkte auf 20 Handelstage, t = −11,6 aus 24.727 Signalen über 189 Werte und 8 Jahre.',
        'Kein Randfall, sondern die Regel: nur 32 von 189 Werten positiv, beide Zeithälften negativ. Das News-Sentiment, das ein gutes Drittel des Gesamtscores stellte, war nie messbar — es gab keine Auswertung, die es hätte belegen können.',
        'Empfehlung: aus lassen. Seit Version 8.23.24 hält eine Sicherung sie abgeschaltet; wer sie hier von Hand einschaltet, handelt gegen die Messung — die Karte bleibt sichtbar, damit das nicht unbemerkt passiert.'
      ],
      schalter: 'hourly'
    },
    {
      key: 'mittel',
      name: 'Mittelfristig · Momentum im Querschnitt',
      horizont: 'rund drei Monate je Umschichtung',
      instrument: 'Aktien, kein Hebel',
      was: 'Vergleicht alle Werte miteinander und hält das stärkste Zehntel. Keine Chartmuster, nur eine Rangfolge, die alle 63 Handelstage neu gebildet wird.',
      stand: 'gemessen – hält die volle Historie, nicht die zurückgehaltenen Jahre',
      farbe: 'warn',
      messKeys: ['momentum'],
      beleg: [
        'KONTROLLMESSUNG 23.08.2026: Der eingebaute Marktvergleich ist bereits die richtige Kontrolle (Erwartung einer Zufallsauswahl gleicher Größe, per 500-fach-Simulation bestätigt). Über die volle Historie +2,42 Pp je Umschichtung (t = 3,84) – aber ab 2005 allein +1,51 Pp bei Mindest-Effektgröße 1,86 (t = 1,62): nicht entscheidbar. Rund die Hälfte des Vorsprungs hängt an 30 von 189 Werten, deren Namen man erst 2026 kennt (Überlebensverzerrung). 64,8 % des Ertrags je Schritt sind schlichtes Halten.',
        'Parameter auf 1970–2004 gewählt, auf 2005–2026 ohne Anpassung geprüft: +20,3 % p. a. gegen +14,9 % des Marktdurchschnitts, Vorsprung +5,4 Pp.',
        'Schlug den Markt in 14 von 22 Jahren; 93 von 96 Parameterkombinationen schlugen ihn ebenfalls.',
        'Unangenehm: 52 % größter Rückschlag im geprüften Zeitraum 2005–2026 (Referenzlauf, gemessen 2008), in 8 von 22 Jahren schlechter als der Markt, und das Universum enthält nur Firmen, die es heute noch gibt.'
      ],
      schalter: 'momentum'
    },
    {
      key: 'drift',
      name: 'Mittelfristig · Ergebnis-Drift',
      horizont: '60 Handelstage je Position',
      instrument: 'Aktien, kein Hebel',
      was: 'Kauft nach einer Quartalsmeldung das oberste Fünftel der Überraschungen und verkauft das unterste – gleich viele, aus demselben Topf. Kein Chartsignal: Die Information kommt aus den Zahlen, nicht aus dem Kursverlauf.',
      stand: 'gemessen – Zeitzonen-Fehler gefunden, Neumessung offen',
      farbe: 'warn',
      messKeys: ['drift', 'ergebnis-drift'],
      beleg: [
        'KONTROLLMESSUNG 23.08.2026: drift.js behandelte 59,8 % aller Termine (Datum ohne Uhrzeit) als „vor Börsenschluss gemeldet" und verbuchte dadurch einen Meldesprung von 1,97 % am ersten Tag als Strategieertrag. Korrigiert fällt der Rohlauf von 14,07 auf 8,44 % p. a. Gegen eine zukunftsfreie Kontrolle bleiben über die volle Historie 12 Pp p. a. (t = 5,5); im zurückgehaltenen Zeitraum 5–7 Pp bei Mindest-Effektgröße 5,6–6,7 (t = 1,7–2,0): nicht entscheidbar. Die Zahlen darunter sind VOR der Zeitzonen-Korrektur.',
        '20.356 Ergebnistermine aus 197 Werten, 1993–2026. Marktneutral, Rang nur gegen bereits veröffentlichte Zahlen: ab 2015 +10,44 % p. a. bei t = 3,04, 67 % positive Monate, positiv in allen sieben Teilzeiträumen.',
        'Neben dem Momentum bleibt messbar etwas übrig: Korrelation der Monatserträge nur 0,41, Alpha +6,90 % p. a. (t = 2,20). Die Mischung liefert denselben Ertrag bei 10,2 statt 13,1 % Schwankung.',
        'Zufällige Zuordnung ergibt −1,74 % (t = −0,88) – der Aufbau selbst erzeugt nichts.',
        'Unangenehm: In der über zehn Jahre schwachen Hälfte der Werte bleiben nur +1,72 % (t = 0,58) – ein guter Teil sitzt in den Gewinnern von heute. Auf 20 Tagen Haltedauer ist der Effekt seit 2015 tot.',
        'NICHT mit Scheinen handelbar: Der Basiswert müsste 5,5–11 % laufen, damit ein Schein nach Zeitwertverfall und Spanne bei null herauskommt – der Drift liefert rund 1,3 % je Position.'
      ],
      schalter: 'drift'
    },
    {
      key: 'lang',
      name: 'Langfristig · Nachrichten und Ausblick',
      horizont: 'Monate bis Jahre',
      instrument: 'Aktien',
      was: 'Noch nicht gebaut. Gedacht als Bewertung nach Geschäftszahlen, Nachrichtenlage und Ausblick statt nach Kursverlauf.',
      stand: 'nicht gebaut',
      farbe: 'muted',
      beleg: ['Nichts gemessen, nichts implementiert. Der Schalter bleibt aus, bis es etwas zu schalten gibt.'],
      schalter: null,
      /* Keine volle Karte: Ein nicht gebauter Ansatz soll neben vier gemessenen
       * Strategien nicht so aussehen, als stünde er gleichrangig daneben. Er bleibt
       * als Fußnote stehen, damit die Lücke nicht stillschweigend verschwindet. */
      fussnote: true
    }
  ];

  function anZustand(key) {
    var D = window.__D ? window.__D() : null;
    if (!D) return false;
    if (key === 'kurz') return !!(D.intraday && D.intraday.enabled);
    if (key === 'mittel') return !!D.momentumAn;
    if (key === 'drift') return !!D.driftAn;
    // Die Stunden-Strategie laeuft historisch, solange sie nicht ausdruecklich aus ist
    if (key === 'stunden') return D.hourlyEnabled !== false;
    return false;
  }
  function setzen(key, an) {
    var D = window.__D ? window.__D() : null;
    if (!D) return;
    if (key === 'kurz') D.intraday.enabled = an;
    if (key === 'mittel') D.momentumAn = an;
    if (key === 'drift') D.driftAn = an;
    if (key === 'stunden') D.hourlyEnabled = an;
    /* Dieselben Schalter stehen ein zweites Mal im Setup-Reiter. Ohne Nachziehen
     * zeigt der Kippschalter dort AN, waehrend das Abzeichen hier 'aus' sagt -
     * und der Nutzer glaubt der falschen Haelfte. */
    var hb = document.getElementById('hourlyEnabled');
    if (hb) hb.checked = D.hourlyEnabled !== false;
    var ib = document.getElementById('idEnabled');
    if (ib) ib.checked = !!(D.intraday && D.intraday.enabled);
    // Abzeichen und Klartext-Karte dort ebenfalls nachziehen - sonst steht das
    // Abzeichen auf 'aus', bis der andere Reiter das naechste Mal neu zeichnet.
    if (window.__syncStrategyUI) window.__syncStrategyUI();
    if (!D.tuneLog) D.tuneLog = [];
    var s = STRATEGIEN.filter(function (x) { return x.key === key; })[0];
    D.tuneLog.unshift({
      id: 'strat-' + Date.now(), at: Date.now(), quelle: 'hand',
      applied: [s.name + ' → ' + (an ? 'an' : 'aus')],
      txt: s.name + ' wurde von Hand ' + (an ? 'eingeschaltet' : 'ausgeschaltet') + '.'
    });
    if (window.__save) window.__save();
    render();
  }

  /** Bestehende Installationen auf die gemessenen Einstellungen umstellen - per Knopf,
   *  nie still: Die erste externe Diagnose zeigte einen Tester im alten Standard
   *  'breakout' auf Scheinen (Muenzwurf), waehrend die gemessenen Strategien aus waren.
   *  Neue Installationen starten schon richtig; Bestandsnutzer entscheiden selbst. */
  /* Jedes Feld EINZELN mitschreiben, bevor es ueberschrieben wird. Der Knopf versprach
   * von Anfang an, jede Aenderung lasse sich einzeln zurueckstellen - eingeloest hat er
   * es nie: sein Protokolleintrag trug gar kein konfigVorher, und der Rueckgaengig-Knopf
   * in "Was hat gewirkt?" erscheint nur, wenn eines da ist. Es gab also nicht einmal ein
   * Zurueck fuer alles, geschweige denn fuer einzelne Felder.
   * Bewusst NICHT ueber einen Rundumschlag (tiefe Kopie von D.intraday) geloest: dann
   * wuerde ein Zurueck auch Felder anfassen, die dieser Knopf nie angeruehrt hat - z. B.
   * den Ein/Aus-Schalter des Handels. Zurueckgestellt wird nur, was hier gesetzt wurde. */
  function empfohleneEinstellungen() {
    var D = window.__D ? window.__D() : null;
    if (!D) return;
    var felder = [];
    /** Setzt ein Feld und merkt sich den alten Wert - aber nur, wenn er sich unterscheidet.
     *  wo: 'intraday' (D.intraday[k]) oder 'depot' (D[k]). */
    function setz(wo, k, wert, txt) {
      var ziel = wo === 'intraday' ? D.intraday : D;
      if (ziel[k] === wert) return false;
      felder.push({ wo: wo, k: k, alt: ziel[k] === undefined ? null : ziel[k], neu: wert, txt: txt });
      ziel[k] = wert;
      return true;
    }
    setz('intraday', 'mode', 'rsi2seit', 'Modus RSI(2) im Seitwärtskanal');
    setz('intraday', 'instrument', 'basis', 'Instrument Basiswert');
    setz('intraday', 'interval', '60m', 'Zeitrahmen 60 Minuten');
    setz('intraday', 'scalpHold', 480, 'Zeit-Ausstieg 8 Stunden');
    setz('intraday', 'cooldownMin', 120, 'Wartezeit 120 Minuten');
    setz('intraday', 'schattenImmer', true, 'Schattenbuch zeichnet immer auf');
    setz('depot', 'momentumAn', true, 'Momentum-Buch an');
    setz('depot', 'driftAn', true, 'Drift-Buch an');
    setz('depot', 'maxRisikostufe', 3, 'Maximale Risikostufe 3');
    var extras = ['Gemessene Voreinstellungen übernommen'];
    // Zweite gemessene Kante gleich mit an - feuert in der anderen Marktphase
    if (!D.intraday.kapiZusatz && setz('intraday', 'kapiZusatz', true, 'Kapitulations-Dip zusätzlich an')) extras.push('Kapitulations-Dip zusätzlich an');
    // Die widerlegte Stunden-Strategie gehoert nicht in die belegte Konfiguration
    if (D.hourlyEnabled !== false && setz('depot', 'hourlyEnabled', false, 'Stunden-Strategie aus')) extras.push('Stunden-Strategie aus (widerlegt)');
    // Regime-Zuteilung (Studie 21.08.): jede Kante nur in ihrem gemessenen Regime
    if (!D.intraday.regimeZuteilung && setz('intraday', 'regimeZuteilung', true, 'Regime-Zuteilung (SPY-Trend) an')) extras.push('Regime-Zuteilung (SPY-Trend) an');
    // Der Knopf ist eine bewusste Hand-Entscheidung - er darf auch die Sicherung
    // wieder scharf stellen, die eine fruehere Hand-Entscheidung abgeschaltet hat.
    if (D.intraday.blackout === 'off' && setz('intraday', 'blackout', 'block', 'Event-Blackout wieder an')) extras.push('Event-Blackout wieder an');
    if (!D.tuneLog) D.tuneLog = [];
    D.tuneLog.unshift({ id: 'empfohlen-' + Date.now(), at: Date.now(), quelle: 'hand',
      applied: extras, felder: felder,
      txt: 'Auf die gemessenen Einstellungen umgestellt: Intraday-Modus RSI(2) im Seitwärtskanal ' +
        '(Basiswert, 8 h Zeit-Ausstieg, nur Long). Der Ein/Aus-Schalter des Intraday-Handels bleibt ' +
        'unangetastet; das Schattenbuch zeichnet immer auf. Momentum- und Drift-Buch handeln virtuell. ' +
        'Maximale Risikostufe 3. Jedes Feld lässt sich unten unter „Was hat gewirkt?“ einzeln zurückstellen.' });
    if (window.__save) window.__save();
    [['idMode', 'rsi2seit'], ['idInstrument', 'basis'], ['idInterval', '60m'], ['idHold', '480'], ['idMaxStufe', '3']].forEach(function (kv) {
      var e = document.getElementById(kv[0]);
      if (e) e.value = kv[1];
    });
    if (window.__syncSetupUI) window.__syncSetupUI();
    // Die Tabelle "Was hat gewirkt?" steht direkt darunter - sie muss den eigenen
    // Eintrag sofort zeigen, sonst ist die Einzel-Ruecknahme unauffindbar.
    if (window.__renderAnalytics) window.__renderAnalytics();
    var st = document.getElementById('stratEmpfohlenStatus');
    if (st) st.textContent = felder.length
      ? 'Übernommen – ' + felder.length + ' Feld(er) geändert, unten unter „Was hat gewirkt?“ einzeln zurückstellbar.'
      : 'Nichts zu tun – alle Felder standen bereits so.';
    render();
  }

  /* Die Belege wandern ins Erklaerregister, statt dauerhaft auf dem Reiter zu stehen.
   * Der Reiter "Regeln" trug so 12.630 Zeichen auf 3.739 px, ohne einen zugeklappten
   * Block - und das ausgerechnet dort, wo man eine Entscheidung trifft. Gekuerzt wird
   * dabei NICHTS: es sind Messaussagen mit Zahlen, das Fenster rollt lieber. */
  function belegeAnmelden() {
    if (!window.Info) return;
    var eintraege = {};
    /* Nur die Karten bekommen einen Knopf (render() filtert .fussnote heraus) - ein
     * Eintrag fuer 'lang' waere ein Text, den kein Knopf je aufruft. Die bestehende
     * Zusicherung konnte das nicht sehen: sie haelt app-shell.js gegen index.html
     * und kennt die zur Laufzeit angemeldeten Eintraege nicht. */
    STRATEGIEN.filter(function (s) { return !s.fussnote; }).forEach(function (s) {
      eintraege['strategie.' + s.key] = {
        titel: 'Belegstand · ' + s.name,
        punkte: s.beleg || [],
        fuss: 'Vollständiges Protokoll mit Entscheidungsweg: Reiter „Messung“ → Scoreboard.'
      };
    });
    window.Info.eintragen(eintraege);
  }

  /** Struktur-Audit Punkt 3: das Messurteil aus dem Protokoll als eigene Zeile -
   *  dieselbe Quelle wie Regelkopf und Kostenhuerde (DepotAPI.protokollKante), damit
   *  der kuratierte Stand-Chip und die Messmaschine nie stumm auseinanderlaufen.
   *  Ohne Protokoll sagt die Zeile genau das - der Chip oben steht fest im Code. */
  function protokollZeile(s) {
    if (!s.messKeys || !s.messKeys.length) return '';
    var api = window.DepotAPI;
    if (!api || !api.protokollKante) return '';
    var treffer = s.messKeys.map(function (k) {
      var pk = api.protokollKante(k);
      return pk ? { key: k, pk: pk } : null;
    }).filter(Boolean);
    if (!treffer.length) {
      return '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:3px;">' +
        'Kein Messprotokoll im Datenordner – der Stand oben steht fest im Code und kann veralten.</div>';
    }
    return '<div style="font-size:var(--fs-neben); color:var(--ink-2); margin-top:3px;">' +
      treffer.map(function (t) {
        var pk = t.pk;
        return 'Messprotokoll <code>' + U.esc(t.key) + '</code> vom ' + U.esc(pk.datum) + ': <b>' + U.esc(pk.urteil) +
          '</b>, Überschuss je Signal ' + (pk.jeSignalPp >= 0 ? '+' : '') + U.dez(pk.jeSignalPp, 3) + ' Pp' +
          (pk.varianten > 1 ? ' (beste von ' + pk.varianten + ' Varianten)' : '');
      }).join(' · ') +
      ' <span style="color:var(--muted);">– die App liest dieses Urteil, sie rechnet es nicht.</span></div>';
  }

  function render() {
    var el = document.getElementById('stratListe');
    if (!el) return;
    belegeAnmelden();
    var karten = STRATEGIEN.filter(function (s) { return !s.fussnote; });
    /* Die Fussnote MUSS hier mitgebaut werden: el.innerHTML ersetzt bei jedem
     * Reiterwechsel den gesamten Inhalt, ein separat angehaengtes Element waere
     * beim naechsten render() weg. */
    var noten = STRATEGIEN.filter(function (s) { return !!s.fussnote; });
    el.innerHTML = karten.map(function (s) {
      var an = anZustand(s.key);
      var schaltbar = !!s.schalter;
      return '<div class="panel" style="margin-bottom:12px;">' +
        '<div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">' +
          '<span style="font-size:var(--fs-gross); font-weight:700;">' + U.esc(s.name) + '</span>' +
          '<span style="font-size:var(--fs-klein); padding:2px 7px; border-radius:var(--r-gross); border:1px solid var(--' + s.farbe + '); color:var(--' + s.farbe + ');">' +
            U.esc(s.stand) + '</span>' +
          '<span style="margin-left:auto; display:inline-flex; align-items:center; gap:8px;">' +
            (schaltbar
              ? '<button class="btn' + (an ? '' : ' ghost') + '" data-strat="' + s.key + '">' + (an ? 'läuft – ausschalten' : 'einschalten') + '</button>'
              : '<span style="color:var(--muted); font-size:var(--fs-neben);">nicht verfügbar</span>') +
            (window.Info ? window.Info.knopf('strategie.' + s.key, s.name) : '') +
          '</span>' +
        '</div>' +
        '<div style="font-size:var(--fs-text); color:var(--ink-2); margin-top:6px; max-width:68ch;">' + U.esc(s.was) + '</div>' +
        '<div style="font-size:var(--fs-neben); color:var(--muted); margin-top:4px;">Horizont: ' + U.esc(s.horizont) +
          ' · Instrument: ' + U.esc(s.instrument) +
          ' · <span style="opacity:.85;">' + s.beleg.length + ' ' + (s.beleg.length === 1 ? 'Beleg' : 'Belege') +
          ' hinter dem i</span></div>' +
        protokollZeile(s) +
      '</div>';
    }).join('') +
    (noten.length
      ? '<div style="font-size:var(--fs-neben); color:var(--muted); margin:2px 2px 10px; line-height:1.6;">' +
          noten.map(function (s) {
            return U.esc(s.name) + ' (' + U.esc(s.stand) + '): ' + U.esc(s.was) +
              (s.beleg && s.beleg.length ? ' ' + U.esc(s.beleg[0]) : '');
          }).join('<br>') +
        '</div>'
      : '');
    el.querySelectorAll('[data-strat]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-strat');
        setzen(k, !anZustand(k));
      });
    });
  }

  document.addEventListener('tab-changed', function (e) { if (e.detail === 'strategien') render(); });
  /* Die Kanten kommen asynchron aus dem Datenordner - sind sie da, zieht die Liste nach. */
  document.addEventListener('kanten-geladen', function () { render(); });
  document.addEventListener('DOMContentLoaded', function () { setTimeout(render, 1200);
    var bE = document.getElementById('stratEmpfohlenBtn');
    if (bE) bE.addEventListener('click', empfohleneEinstellungen);
  });
  if (typeof window !== 'undefined') window.__stratRender = render;
})();
