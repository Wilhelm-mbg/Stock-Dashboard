'use strict';
/* Tests der Stufe 2b (Auftrag Nr. 121-2b), aufgerufen aus pruefstrasse/test.js (gleiche Zaehlung). Jede Pruefung laeuft in probe(): eine Ausnahme
 * ist ROT mit Meldung. Deterministisch, ohne Panel-Renditen; Pruefungen, die E: oder Markt-Dashboard-Daten brauchen, werden ohne sie uebersprungen.
 * Simulation mit virtuellem Kapital, keine Anlage- und keine Steuerberatung. */
var fs = require('fs');
var path = require('path');

module.exports = function (C) {
  var ok = C.ok, K = C.K, TF = C.TF, A = C.A;
  function probe(name, fn) { var r; try { r = fn(); } catch (e) { ok(false, name, 'Ausnahme: ' + String(e && e.message || e).slice(0, 200)); return; } ok(!!r[0], name, r[1]); }
  function lade(p) { try { return require(p); } catch (e) { return null; } }
  var KO = lade('./kosten.js');

  function laufWelt(v) { return module.exports.laufWelt(A, TF, v); }

  console.log('A) Kostenregel (Nr. 121-2b): eine Funktion, Pp je Umlauf, Klasse 1-5 + index, Einbau in die tag-Form');
  probe('A-1: huerdeUmlauf trifft die Kostentabelle der Nr. 122 (kosten.json, 100.000 $ / 19, 4 Klassen x Kassa/Eroeffnung x Fixed/Tiered) auf 1e-12', function () {
    var T = JSON.parse(fs.readFileSync(path.join(K.REPO, 'studien', 'momentum-wiedervorlage-2026-10-23', 'kosten.json'), 'utf8')), n = 0, max = 0;
    T.zeilen.filter(function (z) { return /^100\.000/.test(z.kapital); }).forEach(function (z) {
      var kl = ['5-50', '50-250', '250-1000', 'ab1000'].indexOf(z.klasse), h = KO.huerdeUmlauf(kl, z.lage, z.positionUsd, z.kurs, z.modell);
      max = Math.max(max, Math.abs(h.gesamtPp - z.rundlaufPp), Math.abs(h.spannePp - z.spannePp), Math.abs(h.gebuehrPp - z.gebuehrPp)); n++;
    });
    var j = KO.huerdeUmlauf(3, 'eroeffnung', K.POSITION_USD, 170.87);
    return [n === 16 && max < 1e-12 && Math.abs(K.POSITION_USD - 100000 / 19) < 1e-9 && Math.abs(KO.jeSeiteBp(j) - j.gesamtPp * 50) < 1e-12 && /quellen\.md/.test(j.quelle), n + ' Zeilen, max Abweichung ' + max.toExponential(1) + ', Klasse 4 Eroeffnung ' + j.gesamtPp.toFixed(4) + ' Pp = ' + KO.jeSeiteBp(j).toFixed(2) + ' Bp je Seite'];
  });
  probe('A-2: Klasse 5 gemessen (KLASSE5_UMSATZ 3.800 Mio $), Laufzeit-Verfeinerung nur aus Klasse 4, tafel.klassen() fuenf Eintraege, die ersten vier = Trendkanal-KLASSEN', function () {
    var kl = TF.klassen(), T = require(path.join(K.TRENDKANAL_STUDIE, 'konfig.js')).KLASSEN, gleich = T.every(function (k, i) { return kl[i].huerde === k.huerde && kl[i].eroeffnungFaktor === k.eroeffnungFaktor && KO.KLASSEN[i].kassa === k.huerde; });
    var lz = [KO.klasseZurLaufzeit(3, 4e9), KO.klasseZurLaufzeit(3, 3e9), KO.klasseZurLaufzeit(2, 5e9), KO.klasseZurLaufzeit(3, 5e9, null)];
    var h4 = KO.huerdeUmlauf(3, 'kassa', K.POSITION_USD, 200).spannePp, h5 = KO.huerdeUmlauf(4, 'kassa', K.POSITION_USD, 200).spannePp;
    return [K.KLASSE5_UMSATZ === 3.8e9 && kl.length === 5 && kl[4].nurKosten && gleich && lz.join() === '4,3,2,3' && h5 <= 0.7 * h4, 'Laufzeit ' + lz.join(',') + ', Kassa Klasse 4/5 ' + h4 + ' / ' + h5 + ', klassen ' + kl.length];
  });
  probe('A-3: index = eigene Klasse, Platzhalter Klasse-4-Spanne mit Marke "Index-Spanne nicht gemessen"; ausfuehrung "schluss" wird abgelehnt', function () {
    var h = KO.huerdeUmlauf('index', 'kassa', K.POSITION_USD, 400), wirft = false; try { KO.huerdeUmlauf(3, 'schluss', 1000, 50); } catch (e) { wirft = true; }
    return [h.marke === 'Index-Spanne nicht gemessen' && h.spannePp === KO.KLASSEN[3].kassa && h.name === 'index' && wirft, h.marke + ', Spanne ' + h.spannePp + ', gesamt ' + h.gesamtPp.toFixed(4)];
  });
  probe('A-4: tag-Form urteilt auf Eroeffnung + IBKR je Trade (Kurs = rohe Eroeffnung des Einstiegstags), Kassa nachrichtlich; netto = brutto - Huerde je Trade', function () {
    var e = laufWelt(function () { return 1e6; });
    var okTrade = Math.abs(e.uNetto.jeTrade - (e.uBrutto.jeTrade - e.kKand)) < 1e-12 && Math.abs(e.uNettoKassa.jeTrade - (e.uBrutto.jeTrade - e.kKandKassa)) < 1e-12;
    /* alle Trades Klasse 4, Kurs 20..140 $: Huerde zwischen Eroeffnung + Mindestgebuehr bei 140 $ und Eroeffnung + Stueckgebuehr bei 15 $ */
    var lo = KO.gesamtPp(3, 'eroeffnung', K.POSITION_USD, 400), hi = KO.gesamtPp(3, 'eroeffnung', K.POSITION_USD, 10);
    return [okTrade && Math.abs(e.kKandKassa - 0.0449) < 1e-12 && e.kKand > lo && e.kKand < hi && e.nKosten[4] === 0 && e.nKosten[3] === e.nTr, 'kKand ' + e.kKand.toFixed(4) + ' (Kassa ' + e.kKandKassa + '), Trades ' + e.nTr + ', netto ' + e.uNetto.mittel.toFixed(4) + ' / Kassa ' + e.uNettoKassa.mittel.toFixed(4)];
  });
  probe('A-5: Klasse 5 zur Laufzeit (Dollarumsatz c x v der 20 Vortage >= 3.800 Mio $): billiger, u brutto unveraendert (Topf-Zelle bleibt Klasse 4)', function () {
    var a = laufWelt(function () { return 1e6; }), b = laufWelt(function (r) { return r < 6 ? 1e6 : 2e8; });
    return [b.nKosten[4] > 0 && b.nKosten[4] < b.nTr && b.kKand < a.kKand && JSON.stringify(a.uBrutto) === JSON.stringify(b.uBrutto) && b.kKandKassa === a.kKandKassa, 'Klasse-5-Trades ' + b.nKosten[4] + ' von ' + b.nTr + ', kKand ' + a.kKand.toFixed(4) + ' -> ' + b.kKand.toFixed(4) + ', brutto gleich'];
  });
  probe('A-6: Kassa-Netto bitgleich zum Stand vor Nr. 121-2b (Fingerabdruck der Kunstwelt, alter Code 23.10.)', function () {
    var e = laufWelt(function () { return 1e6; });
    return [e.uBrutto.mittel === FINGER.brutto && e.uNettoKassa.mittel === FINGER.netto && e.uNettoKassa.se === FINGER.se && e.nTr === FINGER.nTr, 'brutto ' + e.uBrutto.mittel + ' / Kassa-netto ' + e.uNettoKassa.mittel + ' / se ' + e.uNettoKassa.se];
  });
  probe('A-7: FORM.md Kostenregel (Formel, Klassen 1-5 + index, Eroeffnung, Position, Spannen-Zeitraum) und "Minute: Kostenregel folgt mit Stufe 3"; Protokoll ohne "Urteil auf der Kassa-Huerde"', function () {
    var F = fs.readFileSync(path.join(K.HIER, 'FORM.md'), 'utf8'), L = fs.readFileSync(path.join(K.HIER, 'laeufer.js'), 'utf8');
    return [/Kostenregel/.test(F) && /Minute: Kostenregel folgt mit Stufe 3/.test(F) && /5\.263/.test(F) && /Index-Spanne nicht gemessen/.test(F) && /2016.2020 ungeprueft|2016–2020 ungeprüft/.test(F) && L.indexOf('Urteil auf der Kassa-Huerde') === -1, 'FORM.md / laeufer.js'];
  });
};
/* Eigene kleine Kunstwelt (eigener Zufall, unabhaengig von der Reihenfolge in test.js): 12 Reihen ueber 300 Werktage, Klasse 3 (ab 1.000 Mio $),
 * Umsatz je Reihe waehlbar (v), Signal jeder 9. Tag. */
function welt(A, vJeReihe) {
  var rng = A.mulberry32(A.fnv('stufe2b-welt')), tage = A.kunstKalender(300), reihen = [];
  function g() { var u = 1 - rng(), v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  for (var r = 0; r < 12; r++) {
    var sp = { reihe: 'W' + r, tag: [], o: [], h: [], l: [], c: [], v: [] }, p = 20 + 10 * r;
    for (var i = 0; i < tage.length; i++) { var o = p * (1 + 0.003 * g()), c = o * (1 + 0.01 * g()); sp.tag.push(i); sp.o.push(o); sp.c.push(c); sp.h.push(Math.max(o, c)); sp.l.push(Math.min(o, c)); sp.v.push(vJeReihe(r)); p = c; }
    reihen.push(sp);
  }
  return { reihen: reihen, tage: tage };
}
var REGEL = { signal: function (sicht, i) { return (fnv(sicht.reihe + '#' + i) % 9) === 0 ? { dir: 1 } : null; } };
function fnv(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
var KANDW = { kennung: 'stufe2b', form: 'tag', konfigurationen: [{ key: 'H3', richtung: 'long', haltedauer: 3 }], params: {} };

function laufWeltAussen(A, TF, vJeReihe) { var W = welt(A, vJeReihe), T = TF.kunstTafel(W.reihen, W.tage, { offen: true }); return A.lauf(REGEL, KANDW, { tafel: T, schnitt: 'panelende' }).konfigurationen[0].entdeckung; }
module.exports.laufWelt = laufWeltAussen;
/* Fingerabdruck A-6: mit dem Code von Basis 492e3f7 gerechnet (Kratzordner pruefstrasse-bau-121-2b/fingerabdruck.js), uNetto damals = Kassa-Netto. */
var FINGER = { brutto: 0.1294760554851873, netto: 0.08457605548518737, se: 0.08352147732445003, nTr: 344 };
