'use strict';
/* ================= Strategie-Schalter =================
 *
 * Drei Zeithorizonte, drei getrennte Strategien, drei getrennte Schalter. Sie handeln
 * unterschiedlich, sie brauchen unterschiedliche Instrumente, und sie sind
 * unterschiedlich gut belegt. Genau das soll man hier auf einen Blick sehen können –
 * inklusive der unangenehmen Teile.
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
      instrument: 'Optionsscheine (Hebel)',
      was: 'Sucht im laufenden Handel nach Signalen und kauft gehebelt. Ausstieg über Stop, Ziel, Trailing oder Tagesschluss.',
      stand: 'in Erprobung',
      farbe: 'warn',
      beleg: [
        'UNBEDINGT trägt kein Einzelsignal: Trefferquoten 46–56 %, bester Vorsprung +0,09 Pp. BEDINGT sieht es anders aus — die Bedingungsstudie vom 21.08.2026 (162 Werte, Stundenkerzen, jedes Signal gekreuzt mit Kanalzustand, EMA100, Volumen) fand: RSI(2)-Dip NUR im Seitwärtskanal mit Volumen = +0,147 Pp auf 8 h, t = 4,1 über die Symbole, beide Zeithälften positiv, 99 von 162 Werten im Plus.',
        'Der Kanal gibt nicht die Richtung, sondern die ERLAUBNIS: Dasselbe Signal ist im Trend ein Münzwurf und im Seitwärtsband messbar. Genau das war die These hinter dem handgezeichneten AMD-Chart.',
        'Das Instrument entscheidet: Der Vorsprung liegt ÜBER der Basiswert-Hürde (0,10 %) und UNTER der Scheinhürde (0,21 %). Im Backtest: Basiswert PF 1,23 (+0,23 % je Trade, volatiles Drittel), Schein −96 %. Und er zahlt über Nacht aus — streng intraday −0,08 % je Trade, mit einer Nacht Haltezeit +0,23 %.',
        'Nur die Call-Seite trägt (+0,075 %); das Put-Bein kämpft gegen die Marktdrift (−0,099 %) — dieselbe Lektion wie beim Ergebnis-Drift.',
        'Als Modus „RSI(2) im Seitwärtskanal“ (Umkehr-Auslöser) eingebaut: nur Long, Zeit-Ausstieg 8 Handelsstunden, darf eine Nacht überleben. Monatssignifikanz steht noch aus (36 Monate, t ≈ 0,5) — der Modus gehört in den Vorwärtstest, nicht auf großes Budget.',
        'Auf diesen Daten OHNE tragfähige Zelle: Donchian, Squeeze, Pullback — in keiner Marktlage überzufällig.'
      ],
      schalter: 'intraday'
    },
    {
      key: 'mittel',
      name: 'Mittelfristig · Momentum im Querschnitt',
      horizont: 'rund drei Monate je Umschichtung',
      instrument: 'Aktien, kein Hebel',
      was: 'Vergleicht alle Werte miteinander und hält das stärkste Zehntel. Keine Chartmuster, nur eine Rangfolge, die alle 63 Handelstage neu gebildet wird.',
      stand: 'belegt',
      farbe: 'up',
      beleg: [
        'Parameter auf 1970–2004 gewählt, auf 2005–2026 ohne Anpassung geprüft: +20,3 % p. a. gegen +14,9 % des Marktdurchschnitts, Vorsprung +5,4 Pp.',
        'Schlug den Markt in 14 von 22 Jahren; 93 von 96 Parameterkombinationen schlugen ihn ebenfalls.',
        'Unangenehm: 48 % größter Rückschlag, in 8 von 22 Jahren schlechter als der Markt, und das Universum enthält nur Firmen, die es heute noch gibt.'
      ],
      schalter: 'momentum'
    },
    {
      key: 'drift',
      name: 'Mittelfristig · Ergebnis-Drift',
      horizont: '60 Handelstage je Position',
      instrument: 'Aktien, kein Hebel',
      was: 'Kauft nach einer Quartalsmeldung das oberste Fünftel der Überraschungen und verkauft das unterste – gleich viele, aus demselben Topf. Kein Chartsignal: Die Information kommt aus den Zahlen, nicht aus dem Kursverlauf.',
      stand: 'belegt',
      farbe: 'up',
      beleg: [
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
      schalter: null
    }
  ];

  function anZustand(key) {
    var D = window.__D ? window.__D() : null;
    if (!D) return false;
    if (key === 'kurz') return !!(D.intraday && D.intraday.enabled);
    if (key === 'mittel') return !!D.momentumAn;
    if (key === 'drift') return !!D.driftAn;
    return false;
  }
  function setzen(key, an) {
    var D = window.__D ? window.__D() : null;
    if (!D) return;
    if (key === 'kurz') D.intraday.enabled = an;
    if (key === 'mittel') D.momentumAn = an;
    if (key === 'drift') D.driftAn = an;
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
   *  'breakout' auf Scheinen (Muenzwurf), waehrend die belegten Strategien aus waren.
   *  Neue Installationen starten schon richtig; Bestandsnutzer entscheiden selbst. */
  function empfohleneEinstellungen() {
    var D = window.__D ? window.__D() : null;
    if (!D) return;
    D.intraday.mode = 'rsi2seit';
    D.intraday.instrument = 'basis';
    D.intraday.interval = '60m';
    D.intraday.scalpHold = 480;
    D.intraday.cooldownMin = 120;
    D.intraday.schattenImmer = true;
    D.momentumAn = true;
    D.driftAn = true;
    D.maxRisikostufe = 3;
    var extras = ['Belegte Voreinstellungen übernommen'];
    // Zweites belegtes Standbein gleich mit an - feuert in der anderen Marktphase
    if (!D.intraday.kapiZusatz) { D.intraday.kapiZusatz = true; extras.push('Kapitulations-Dip zusätzlich an'); }
    // Der Knopf ist eine bewusste Hand-Entscheidung - er darf auch die Sicherung
    // wieder scharf stellen, die eine fruehere Hand-Entscheidung abgeschaltet hat.
    if (D.intraday.blackout === 'off') { D.intraday.blackout = 'block'; extras.push('Event-Blackout wieder an'); }
    if (!D.tuneLog) D.tuneLog = [];
    D.tuneLog.unshift({ id: 'empfohlen-' + Date.now(), at: Date.now(), quelle: 'hand',
      applied: extras,
      txt: 'Auf die gemessenen Einstellungen umgestellt: Intraday-Modus RSI(2) im Seitwärtskanal ' +
        '(Basiswert, 8 h Zeit-Ausstieg, nur Long). Der Ein/Aus-Schalter des Intraday-Handels bleibt ' +
        'unangetastet; das Schattenbuch zeichnet immer auf. Momentum- und Drift-Buch handeln virtuell. ' +
        'Maximale Risikostufe 3. Jedes Feld lässt sich einzeln zurückstellen.' });
    if (window.__save) window.__save();
    [['idMode', 'rsi2seit'], ['idInstrument', 'basis'], ['idInterval', '60m'], ['idHold', '480'], ['idMaxStufe', '3']].forEach(function (kv) {
      var e = document.getElementById(kv[0]);
      if (e) e.value = kv[1];
    });
    if (window.__syncSetupUI) window.__syncSetupUI();
    var st = document.getElementById('stratEmpfohlenStatus');
    if (st) st.textContent = 'Übernommen – Einzelheiten im Protokoll.';
    render();
  }

  function render() {
    var el = document.getElementById('stratListe');
    if (!el) return;
    el.innerHTML = STRATEGIEN.map(function (s) {
      var an = anZustand(s.key);
      var schaltbar = !!s.schalter;
      return '<div class="panel" style="margin-bottom:12px;">' +
        '<div style="display:flex; align-items:baseline; gap:10px; flex-wrap:wrap;">' +
          '<span style="font-size:15px; font-weight:700;">' + U.esc(s.name) + '</span>' +
          '<span style="font-size:11px; padding:2px 7px; border-radius:10px; border:1px solid var(--' + s.farbe + '); color:var(--' + s.farbe + ');">' +
            U.esc(s.stand) + '</span>' +
          '<span style="margin-left:auto;">' +
            (schaltbar
              ? '<button class="btn' + (an ? '' : ' ghost') + '" data-strat="' + s.key + '">' + (an ? 'läuft – ausschalten' : 'einschalten') + '</button>'
              : '<span style="color:var(--muted); font-size:12px;">nicht verfügbar</span>') +
          '</span>' +
        '</div>' +
        '<div style="font-size:12.5px; color:var(--ink-2); margin-top:6px;">' + U.esc(s.was) + '</div>' +
        '<div style="font-size:11.5px; color:var(--muted); margin-top:4px;">Horizont: ' + U.esc(s.horizont) +
          ' · Instrument: ' + U.esc(s.instrument) + '</div>' +
        '<ul style="font-size:12px; color:var(--ink-2); margin:8px 0 0; padding-left:18px; line-height:1.5;">' +
          s.beleg.map(function (b) { return '<li>' + U.esc(b) + '</li>'; }).join('') +
        '</ul>' +
      '</div>';
    }).join('');
    el.querySelectorAll('[data-strat]').forEach(function (b) {
      b.addEventListener('click', function () {
        var k = b.getAttribute('data-strat');
        setzen(k, !anZustand(k));
      });
    });
  }

  document.addEventListener('tab-changed', function (e) { if (e.detail === 'strategien') render(); });
  document.addEventListener('DOMContentLoaded', function () { setTimeout(render, 1200);
    var bE = document.getElementById('stratEmpfohlenBtn');
    if (bE) bE.addEventListener('click', empfohleneEinstellungen);
  });
  if (typeof window !== 'undefined') window.__stratRender = render;
})();
