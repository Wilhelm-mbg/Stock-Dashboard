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
        'Einzelsignale sind durchgemessen und tragen NICHT: Trefferquoten 46–56 %, bester Vorsprung +0,09 Pp gegen eine Kostenhürde von 0,077 %.',
        'In KOMBINATION sieht es anders aus. Bestes Ergebnis: Umkehr im Abwärtskanal mit Volumenbestätigung, Put, Horizont 26 Stunden — Median +1,68 % relativ, 63 % Treffer, absolut +1,03 %, p < 0,000033 und damit auch unter der Bonferroni-Schranke bei 504 geprüften Kombinationen.',
        'Offen: nur 126 Signale auf 14 Werten über drei Jahre. Der Live-Scanner benutzt noch die alten Einzelsignale, nicht die Kombination.'
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
    return false;
  }
  function setzen(key, an) {
    var D = window.__D ? window.__D() : null;
    if (!D) return;
    if (key === 'kurz') D.intraday.enabled = an;
    if (key === 'mittel') D.momentumAn = an;
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
  document.addEventListener('DOMContentLoaded', function () { setTimeout(render, 1200); });
  if (typeof window !== 'undefined') window.__stratRender = render;
})();
