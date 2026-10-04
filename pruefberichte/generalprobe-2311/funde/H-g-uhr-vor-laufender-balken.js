'use strict';
/* Fund H-g-uhr-vor-laufender-balken (Klasse B): Die Systemuhr springt vor (+2 h mitten am Montag).
 * "Der Balken ist fertig" entscheidet die App allein an der Systemuhr (>= 16:15 New York: mfhandel.js ohneLaufendenBalken Z. 297-303,
 * letzterFertigerWerktag, bestandFrisch). Zeigt die Uhr 16:20, waehrend die Boerse noch 14:50 hat, laedt der Takt den Bestand nach, laesst den
 * LAUFENDEN Balken (Kurs = Kurs von jetzt) als Schluss drin und stempelt den Bestand als frisch; der Tagespunkt fuer den Montag steht dann
 * zum Kurs von 14:50 - und "bestehende Punkte bleiben" (mfdepot.js tagespunkt), auch der Dienstag bleibt falsch, wenn die Uhr falsch bleibt.
 * Der Handel selbst bleibt richtig (Eroeffnung des Tages, nicht der laufende Kurs). Kein Fehler der Rechnung - die Uhr muss stimmen -, aber die
 * App haette die Antwort der Quelle selbst fragen koennen (Yahoo meldet in meta.currentTradingPeriod / regularMarketTime, ob die Sitzung vorbei ist). */
var H = require('../harness.js');
module.exports = {
  id: 'H-g-uhr-vor-laufender-balken', klasse: 'B', ort: 'mfhandel.js:297-303 (ohneLaufendenBalken), mittelfrist.js:81, mfdepot.js:236-258 (tagespunkt)',
  titel: 'Uhr springt +90 min vor: laufender Balken wird als Schluss gespeichert, falscher Tagespunkt Montag 23.11.',
  ausloeser: 'Systemuhr springt um 13:00 NY um +2 h vor: ab 14:15 NY zeigt die Uhr 16:15 und mehr, die Boerse laeuft bis 16:00',
  erwartet: 'Tagespunkt Mo 23.11. = Buch zu den Schlusskursen des Montags (16:00)',
  async lauf() {
    var k = await H.kurzLauf({ uhrSprung: [{ ab: H.nz('2026-11-23', 13, 0), offset: H.minuten(120) }],
      takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 12, 55), H.nz('2026-11-23', 14, 50), H.nz('2026-11-23', 14, 55)] });
    var p = k.ctx.d.mfVerlauf.filter(function (x) { return x.tag === '2026-11-23'; })[0];
    if (!p) return { abweichung: true, text: 'beobachtet: kein Tagespunkt fuer Mo 23.11. (erwartet nach Schluss)' };
    var nach = {}; k.ctx.d.mfBuch.positionen.forEach(function (q) { nach[q.sym] = q.stueck; });
    var wert = k.ctx.d.mfBuch.cash; Object.keys(nach).forEach(function (s) { wert += nach[s] * k.ctx.welt.bar(s, '2026-11-23').c; });
    var dif = p.momentum - wert;
    return { abweichung: Math.abs(dif) > 1, text: 'beobachtet: Tagespunkt Mo 23.11. ' + p.momentum + ' (geschrieben bei Weltzeit 14:55, Uhr 16:55), Buch zu den echten Schlusskursen ' + Math.round(wert * 100) / 100 + ', Differenz ' + Math.round(dif * 100) / 100 + ' $' };
  }
};
