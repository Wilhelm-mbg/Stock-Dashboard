'use strict';
var fs = require('fs'), path = require('path'), os = require('os');

/* Universum: exakt die Population der Entdeckungshaelfte (CS = Stammaktie,
 * ADRC = Hinterlegungsschein). Fest verdrahtet, damit Live = Messung gilt. */
var ARTEN = (function () {
  var p = process.env.MD_ARTEN || path.join(os.homedir(), 'Downloads',
    'Markt-Dashboard-Daten', 'massive', 'wertpapierarten.json');
  try { return (JSON.parse(fs.readFileSync(p, 'utf8')) || {}).arten || {}; }
  catch (e) { return {}; }
})();

/* Kalenderarithmetik. Die Lage des Monatsendes ist Jahre im Voraus bekannt;
 * es wird KEINE spaetere Kerze und ueberhaupt kein Kurs gelesen.
 * 1 = letzter Kalendertag des Monats. */
function restKalendertage(ms) {
  var d = new Date(ms);
  var letzter = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  return letzter - d.getUTCDate() + 1;
}

module.exports = {
  key: 'monatswende-breit',
  grund: 'Zum Monatswechsel treffen Zufluesse mit Termin ein, die niemand frei legen kann: '
       + 'Gehalts- und Sparplanraten zum Monatsersten, Bewertungsstichtag der Fonds und '
       + 'Pensionskassen mit Herstellung der Sollquote, Zins- und Ausschuettungszufluesse zum '
       + 'Monatsende, und Verwalter, die nach Monatsergebnis bezahlt werden und zum Stichtag '
       + 'investiert sein wollen statt in Bargeld. Jeder dieser Kaeufe folgt einem Kalender, '
       + 'keinem Preisurteil. Das Signal liest zu seiner Bildung keinen einzigen Kurs.',
  zeitrahmen: '1d',
  haltedauerKerzen: 5,
  richtung: 'long',
  leseFensterKerzen: 21,
  kosten: { spanneBp: 5 },
  testfamilie: { name: 'vorregistrierung-2026-08-25', testsGesamt: 4,
                 begruendung: 'zwei Kandidaten mit je zwei Varianten, gemeinsam vorregistriert' },
  universum: function (sym) { var a = ARTEN[sym]; return a === 'CS' || a === 'ADRC'; },
  varianten: [ { fenster: 5 }, { fenster: 4 } ],
  signal: function (bars, i, params) {
    if (i < 21) return null;
    if (restKalendertage(bars[i][0]) > params.fenster) return null;
    /* nur die ERSTE Kerze im Stichtagsfenster - genau ein Einstieg je Symbol und Monat */
    var d = new Date(bars[i][0]), v = new Date(bars[i - 1][0]);
    if (d.getUTCMonth() === v.getUTCMonth() &&
        restKalendertage(bars[i - 1][0]) <= params.fenster) return null;
    return { dir: 1 };
  },
};
