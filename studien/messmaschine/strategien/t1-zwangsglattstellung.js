'use strict';
/* T1 aus der Vorregistrierung 2026-08-23 ("Eigenbau"), 3 von 7 Tests.
 *
 * These: Uebernacht-Praemie nach Zwangsglattstellung.
 *
 * Einstieg zum Schluss der letzten Sitzungskerze, Ausstieg zum Schluss der ersten
 * Kerze des Folgetages. Der Auktionspreis wird bewusst NICHT benutzt - an der
 * Schlussauktion kann man nicht zum Ausdruck handeln.
 *
 * Bedingt formuliert, und das ist kein Detail: Die Kontrolle der Maschine ist die
 * Erwartung desselben Symbols zur selben UTC-Stunde. Ein Signal, das jeden Abend
 * feuert, wird gegen genau diesen Mittelwert gemessen - der Ueberschuss waere per
 * Konstruktion null. Gemessen wird also nicht "zahlt die Nacht", sondern "zahlt die
 * Nacht nach einem Abverkauf MEHR als eine gewoehnliche Nacht".
 */
var T = require('./tageshilfen.js');

module.exports = {
  key: 't1-zwangsglattstellung',
  testfamilie: {
    name: 'eigenbau-2026-08-23',
    testsGesamt: 7,
    begruendung: 'Drei Thesen mit Zwangsgeschichte, vorregistriert in ' +
                 'VORREGISTRIERUNG-2026-08-23-eigenbau.md vor der ersten Messung.',
  },
  grund: 'Wer mit Hebel innerhalb des Tages handelt, MUSS vor Boersenschluss glattstellen - ' +
         'Uebernachtfinanzierung, Margin, interne Risikolimits. An Tagen mit starkem Verlust ist ' +
         'dieser Zwang am groessten: Nachschussforderungen und Stop-Kaskaden treffen zusammen, und ' +
         'beide fragen nicht nach dem Preis. Das Angebot in der Schlussstunde ist dann zu einem ' +
         'erheblichen Teil erzwungen und nicht informationsgetrieben. Wer ueber Nacht die Gegenseite ' +
         'nimmt, stellt Kapital genau dann bereit, wenn es sonst niemand stellt.',
  zeitrahmen: '60m',
  haltedauerKerzen: 1,
  richtung: 'long',
  universum: 'aktien',
  kosten: { spanneBp: 5 },
  varianten: [{ k: 1.5 }, { k: 2.0 }, { k: 2.5 }],
  signal: function (bars, i, params) {
    var c = T.X(bars);
    if (!c.ende[i]) return null;                      // nur die letzte Kerze der Sitzung
    var j = c.tagNr[i];
    var heute = c.tagRet[j];
    if (!isFinite(heute)) return null;
    var sd = T.tagesSd(c, j, 60);                     // Streuung der 60 VORIGEN Tage
    if (!(sd > 0)) return null;
    return heute <= -params.k * sd ? { dir: 1 } : null;
  },
};
