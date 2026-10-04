'use strict';
/* Gegenprobe (Zufallslauf, 3000 Buecher, feste Saat): Plan + fuehreAus + offeneAuftraege + zweimal nachfassen (mit Regel K) erzeugen nie zwei Positionen
 * desselben Werts, nie Stueck <= 0, nie negatives Bargeld; ein Kauf eines schon gehaltenen Werts entfaellt (nach dem Knopf). */
var path = require('path');
var MH = require(path.join(__dirname, '..', '..', '..', 'mfhandel.js'));
module.exports = {
  id: 'OK-04-nachfassen-kein-doppelkauf', klasse: 'ok', ort: 'mfhandel.js:777 nachfassen, :744 offeneAuftraege', titel: 'Nachfassen: kein zweiter Kauf, kein negatives Bargeld',
  ausloeser: 'Gegenprobe', erwartet: 'keine Verletzung der Invarianten',
  async lauf() {
    var seed = 7; function R() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
    var bad = [], syms = []; for (var i = 0; i < 30; i++) syms.push('S' + i);
    for (var it = 0; it < 3000 && bad.length < 5; it++) {
      var N = 8 + Math.floor(R() * 10), buch = { cash: R() * 500, positionen: [], trades: [] };
      for (i = 0; i < Math.floor(R() * N); i++) { var s = syms[Math.floor(R() * 30)]; if (!buch.positionen.some(function (p) { return p.sym === s; })) buch.positionen.push({ sym: s, stueck: R() < 0.15 ? 0.0001 + R() * 0.01 : 10 + R() * 100, einstand: 50, seit: 1 }); }
      var ziel = []; while (ziel.length < N) { var z = syms[Math.floor(R() * 30)]; if (ziel.indexOf(z) < 0) ziel.push(z); }
      var pr = {}, spaet = {}; syms.forEach(function (x) { var k = 10 + R() * 200; if (R() < 0.8) pr[x] = k; spaet[x] = k; });
      var o = { kleinstAnteil: 0.05 }, plan = MH.planeUmschichtung(ziel, buch, pr, o);
      MH.fuehreAus(buch, plan, 1000, 20, o);
      var offen = MH.offeneAuftraege(ziel, plan, '2026-11-23'); if (offen) buch.offen = offen;
      function chk(w) { var seen = {}; buch.positionen.forEach(function (p) { if (seen[p.sym] || !(p.stueck > 0)) bad.push(it + ' ' + w + ' ' + p.sym); seen[p.sym] = 1; }); if (buch.cash < -1e-6) bad.push(it + ' ' + w + ' cash ' + buch.cash); }
      chk('plan');
      if (buch.offen) { MH.nachfassen(buch, spaet, {}, 2000, 20, o); chk('n1'); MH.nachfassen(buch, spaet, {}, 2500, 20, o); chk('n2'); }
    }
    return { abweichung: bad.length > 0, text: bad.length ? 'beobachtet: ' + bad.slice(0, 3).join('; ') : '3000 Laeufe ohne Doppelposition, ohne Stueck <= 0, ohne negatives Bargeld' };
  }
};
