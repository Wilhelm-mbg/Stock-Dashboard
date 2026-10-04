'use strict';
/* Gegenprobe H-c1-split-freitag (Klasse A, KEINE Abweichung erwartet): Split am Freitag */
var H = require('../harness.js');
module.exports = {
  id: 'H-c1-split-freitag', klasse: 'A', ort: 'mfhandel.js:607-656 (bucheMassnahmen), mfdepot.js:384',
  titel: 'Gegenprobe c1: Split 2:1 mit Ex-Tag Freitag in einem bleibenden Wert wird am Freitag nach dem Laden gebucht, Montag stimmt',
  ausloeser: 'Split am Fr 20.11. in einem gehaltenen, im Ziel bleibenden Wert; Takte Fr 16:20, 16:25, Mo 09:35',
  erwartet: 'Stueckzahl verdoppelt (Wert gleich), Montag gleich dem Soll, genau eine Umschichtung',
  async lauf() {
    var k = await H.kurzLauf({ ereignisFn: function (r) { var e = {}; e[r.keptN[0]] = { splits: [{ tag: '2026-11-20', z: 2, n: 1 }] }; return e; },
      takte: [H.nz('2026-11-20', 16, 20), H.nz('2026-11-20', 16, 25), H.nz('2026-11-23', 9, 35)] });
    var m = (k.ctx.d.mfBuch.massnahmen || []).filter(function (x) { return x.art === 'split'; });
    var aw = k.abw.length > 0 || m.length !== 1 || Math.abs(m[0].stueckNeu / m[0].stueckAlt - 2) > 1e-9;
    return { abweichung: aw, text: 'beobachtet: Splitbuchungen ' + m.length + (m[0] ? ' (' + m[0].sym + ' ' + m[0].stueckAlt + ' -> ' + m[0].stueckNeu + ')' : '') + ', Abweichungen gegen das Soll: ' + (k.abwText.join(' | ') || 'keine') + '; erwartet: eine Buchung 2:1, keine Abweichung' };
  }
};
