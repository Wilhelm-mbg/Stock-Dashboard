'use strict';
/* Fund H-c1-div-verkaufte-position (Klasse A, klein; zugleich ein Zweifel an REGEL.md vs. echtem Verhalten):
 * Ausschuettung mit Ex-Tag = Ausfuehrungstag auf einem Wert, der zur Eroeffnung dieses Tages VERKAUFT wird.
 * REGEL.md Teil C.3: "ein Verkauf zur Eroeffnung des Ex-Tags zaehlt noch" - Anspruch hat, wer die Nacht davor hielt; so ist es auch
 * im echten Depot (T+1: Stichtag = Ex-Tag, der Verkauf vom Ex-Tag wird erst am Folgetag abgerechnet, die Dividende bleibt beim Verkaeufer).
 * Die App (mfdepot.js takt -> massnahmenBuchen) bucht Ausschuettungen erst nach dem Laden am Abend (Montag 16:20); da ist die Position
 * schon aus dem Buch (fuehreAus), bucheMassnahmen iteriert nur ueber buch.positionen (mfhandel.js:611) - die Ausschuettung geht verloren.
 * Gegenprobe im selben Lauf: derselbe Betrag auf einem BLEIBENDEN Wert wird gutgeschrieben. */
var H = require('../harness.js');
module.exports = {
  id: 'H-c1-div-verkaufte-position', klasse: 'A', ort: 'mfhandel.js:611 (bucheMassnahmen: nur gehaltene Positionen), mfdepot.js:384/418-439',
  titel: 'Ausschuettung mit Ex-Tag am Ausfuehrungstag geht verloren, wenn der Wert zur Eroeffnung verkauft wird (REGEL C.3: zaehlt noch)',
  ausloeser: 'gehaltener Wert, der am Mo 23.11. verkauft wird, hat am Mo 23.11. Ex-Tag einer Ausschuettung von 0,50 $ je Stueck',
  erwartet: 'Gutschrift Stueck x 0,50 $ im Bargeld (REGEL C.3), gebucht am Ex-Tag nach dem Handel',
  async lauf() {
    var ctx = await H.lauf({ kurz: true, bereitT: H.nz('2026-11-20', 16, 20), takte: [H.nz('2026-11-23', 9, 35), H.nz('2026-11-23', 16, 20), H.nz('2026-11-23', 16, 25)],
      ereignisFn: function (r) { var e = {}; e[r.sold[1]] = { divs: [{ tag: '2026-11-23', betrag: 0.5 }] }; e[r.kept[1]] = { divs: [{ tag: '2026-11-23', betrag: 0.5 }] }; return e; } });
    var sold = ctx.rollen.sold[1], kept = ctx.rollen.kept[1];
    var pS = ctx.buch0.positionen.filter(function (p) { return p.sym === sold; })[0], pK = ctx.buch0.positionen.filter(function (p) { return p.sym === kept; })[0];
    var m = ctx.d.mfBuch.massnahmen || [];
    var gebS = m.filter(function (x) { return x.art === 'div' && x.sym === sold; }), gebK = m.filter(function (x) { return x.art === 'div' && x.sym === kept; });
    var sollS = pS.stueck * 0.5, sollK = pK.stueck * 0.5;
    var aw = gebS.length === 0;
    return { abweichung: aw, text: 'beobachtet: verkaufter Wert ' + sold + ' (' + pS.stueck + ' Stueck): ' + (gebS.length ? 'gebucht ' + gebS[0].summe : 'KEINE Ausschuettung gebucht') +
      '; bleibender Wert ' + kept + ' (' + pK.stueck + ' Stueck): ' + (gebK.length ? 'gebucht ' + Math.round(gebK[0].summe * 100) / 100 : 'nicht gebucht') +
      '; erwartet: ' + Math.round(sollS * 100) / 100 + ' $ fuer ' + sold + ' und ' + Math.round(sollK * 100) / 100 + ' $ fuer ' + kept };
  }
};
