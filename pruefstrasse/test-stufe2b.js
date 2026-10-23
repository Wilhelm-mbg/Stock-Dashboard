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

  console.log('B) Massstab Nasdaq-100 (Nr. 121-2b): QQQ-Tagesreihe aus Minuten, Sicht markt = QQQ, Korb-Parameter, Lagebild ueber die Kopfzeile');
  var QB = lade('./daten/qqq-bauen.js'), DT = lade('./daten/qqq.js');
  function ms(d, hhmm, ny) { var p = hhmm.split(':'); return Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), +p[0] - ny, +p[1]); }
  probe('B-1: qqq-bauen tageAus - Eroeffnung 09:30, Schluss = Eroeffnung der 16:00-Kerze (Halbtag 13:00), sonst letzte Kerze davor; Zeitzone Maerz/November; Sekunden-Zeitstempel brechen ab; Doppelsatz entfernt; cb mit Ausschuettung', function () {
    var kal = { '2026-03-06': { open: '09:30', close: '16:00' }, '2026-03-09': { open: '09:30', close: '16:00' }, '2026-11-27': { open: '09:30', close: '13:00' }, '2026-11-02': { open: '09:30', close: '16:00' } };
    var k = [
      [ms('2026-03-06', '09:30', -5), 100.5, 1, 0, 0, 100], [ms('2026-03-06', '15:59', -5), 101, 1, 0, 0, 100.9], [ms('2026-03-06', '16:00', -5), 101.3, 1, 0, 0, 101.2],
      [ms('2026-03-09', '09:30', -4), 99, 1, 0, 0, 99.5], [ms('2026-03-09', '15:59', -4), 102, 1, 0, 0, 101.5],                          /* nach der Umstellung (8.3.), ohne 16:00-Kerze */
      [ms('2026-11-02', '09:30', -5), 50, 1, 0, 0, 50], [ms('2026-11-02', '16:00', -5), 51, 1, 0, 0, 51.5],                                /* nach der Rueckstellung (1.11.) */
      [ms('2026-11-27', '09:30', -5), 60, 1, 0, 0, 60], [ms('2026-11-27', '13:00', -5), 61, 1, 0, 0, 60.7], [ms('2026-11-27', '15:00', -5), 99, 1, 0, 0, 99]];
    var A2 = QB.ausschuettungen([{ _art: 'cash_dividends', ex_date: '2026-03-09', rate: 1, process_date: 'a' }, { _art: 'cash_dividends', ex_date: '2026-03-09', rate: 1, process_date: 'b' }], []);
    var T = QB.tageAus(k, kal, A2.je).tage, d = {}; T.forEach(function (x) { d[x.d] = x; });
    var wirft = false; try { QB.zeitPruefen([[1772800000, 1], [1772800060, 1]], 'kunst'); } catch (e) { wirft = /ZEITSTEMPEL/.test(e.message); }
    var cbOk = Math.abs(d['2026-03-09'].cb - 101.2 * (102 + 1) / 101.2) < 1e-9;
    return [d['2026-03-06'].o === 100 && d['2026-03-06'].c === 101.2 && d['2026-03-09'].o === 99.5 && d['2026-03-09'].c === 102 && /letzte/.test(d['2026-03-09'].schlussArt) && d['2026-11-02'].c === 51.5 &&
      d['2026-11-27'].halb === true && d['2026-11-27'].c === 60.7 && wirft && A2.doppelt.length === 1 && A2.je['2026-03-09'].length === 1 && cbOk, JSON.stringify(T.map(function (x) { return [x.d, x.o, x.c, x.halb || false]; }))];
  });
  probe('B-2: pruefstrasse/daten/qqq-tage.json - Kennung, Quelle, Erzeugungsdatum, Zeitstempel-Format, Doppelsatz 2022-09-19 entdoppelt, Halbtage; Pruefung warnt ab 60 Tagen Alter', function () {
    var Q = DT.lade(), p = DT.pruefe(Q, Date.parse(Q.erzeugt) + 10 * 86400000), alt = DT.pruefe(Q, Date.parse(Q.erzeugt) + 61 * 86400000), falsch = DT.pruefe(Object.assign({}, Q, { kennung: 'x' }), Date.parse(Q.erzeugt));
    return [Q.kennung === DT.KENNUNG && Q.sym === 'QQQ' && /Millisekunden/.test(Q.zeitstempel.format) && Q.doppelt.length === 1 && Q.doppelt[0].exTag === '2022-09-19' && Q.halbtage.length >= 20 && Q.n > 2600 &&
      !p.fehler.length && !p.warnungen.length && alt.warnungen.length === 1 && falsch.fehler.length === 1, Q.n + ' Tage ' + Q.von + '..' + Q.bis + ', erzeugt ' + Q.erzeugt + ', Warnung nach 61 Tagen: ' + alt.warnungen[0]];
  });
  probe('B-3: Sicht - markt(j) = QQQ-Kurs am Kalendertag von Zeile j, marktGesamt(j) mit Ausschuettungen, marktSpy(j) = Panel-SPY nachrichtlich; hinter der Schranke NaN + Verstoss; Protokoll nennt die Marktreihe', function () {
    var W = welt(A, function () { return 1e6; }), tage = W.tage, spy = { reihe: 'SPY', tag: [], o: [], h: [], l: [], c: [], v: [] };
    for (var i = 0; i < tage.length; i++) { spy.tag.push(i); spy.o.push(400 + i); spy.h.push(400 + i); spy.l.push(400 + i); spy.c.push(400 + i); spy.v.push(1); }
    var mr = { c: new Float64Array(tage.length).fill(NaN), cb: new Float64Array(tage.length).fill(NaN), name: 'QQQ (Kunst)' };
    for (var j = 0; j < tage.length; j++) if (j !== 7) { mr.c[j] = 300 + j; mr.cb[j] = 310 + j; }
    var T = TF.kunstTafel(W.reihen.concat([spy]), tage, { offen: true, marktReihe: mr }), S = T.reihen[0], sicht = A.Sicht(S, T);
    sicht.setzeBis(10);
    var a = [sicht.markt(5), sicht.marktGesamt(5), sicht.marktSpy(5), sicht.markt(7), sicht.markt(11)], v = sicht.verstoesse();
    var E = A.lauf(REGEL, KANDW, { tafel: T, schnitt: 'panelende' });
    return [a[0] === 305 && a[1] === 315 && a[2] === 405 && a[3] !== a[3] && a[4] !== a[4] && v === 1 && E.marktreihe === 'QQQ (Kunst)' && E.hatMarkt === true, JSON.stringify(a) + ' Verstoesse ' + v + ', Marktreihe ' + E.marktreihe];
  });
  probe('B-4: Korb-Adapter - Parameter kostenBpJeSeite und massstab mit Vorgabe = heute (20 Bp je Seite, SPY); die Kostenregel je Seite = huerdeUmlauf / 2 mit echtem Handelswert', function () {
    var KB = lade('./adapter/korb-kosten.js'), v = KB.VORGABE, f20 = KB.kostenFunktion(null), fr = KB.kostenFunktion('regel');
    var h = KO.huerdeUmlauf(3, 'eroeffnung', 5000, 170.87), seiteKauf = KB.anteilSeite(3, 'eroeffnung', 'kauf', 5000, 170.87);
    var geb = KO.ibkrGebuehr('fixed', 'kauf', 5000 / 170.87, 170.87) / 5000;
    return [v.kostenBpJeSeite === null && v.massstab === 'SPY' && f20() === 20 / 10000 && typeof fr === 'function' && Math.abs(seiteKauf - (h.spannePp / 200 + geb)) < 1e-15 && KB.MASSSTAEBE.indexOf('nasdaq100-steuer') >= 0,
      'Vorgabe ' + JSON.stringify(v) + ', Kauf Klasse 4 ' + (seiteKauf * 10000).toFixed(3) + ' Bp'];
  });
  probe('B-5: Lagebild liest t ueber die Kopfzeile (eine neue Spalte vor t bricht es nicht mehr)', function () {
    var LB = require(path.join(K.REPO, 'tools', 'pruefstrasse-lagebild.js'));
    var md1 = '| Konf | a | b | c | d | e | t | x |\n|---|---|---|---|---|---|---|---|\n| H1 | 1 | 1 | 1 | 1 | 1 | 2,5 | 0 |\n| H2 | 1 | 1 | 1 | 1 | 1 | −1,0 | 0 |\n';
    var md2 = '| Konf | neu | a | b | c | d | e | t | x |\n|---|---|---|---|---|---|---|---|---|\n| H1 | 9 | 1 | 1 | 1 | 1 | 1 | −1,0 | 0 |\n| H2 | 9 | 1 | 1 | 1 | 1 | 1 | 3,5 | 0 |\n';
    var z1 = LB.besteZeile(md1), z2 = LB.besteZeile(md2);
    return [/^\| H1 /.test(z1) && /^\| H2 /.test(z2), z1 + ' / ' + z2];
  });

  console.log('C) Papier-Mitschrift letzte halbe Stunde (Nr. 121-2b): Kunsttest ohne E:');
  probe('C-1: tools/papier-letzte-halbe-stunde.test.js gruen (Rendite, Halbtag, Luecke, Zeitzone Maerz/November, Idempotenz)', function () {
    var r = C.cp.spawnSync(process.execPath, [path.join(K.REPO, 'tools', 'papier-letzte-halbe-stunde.test.js')], { cwd: K.REPO, encoding: 'utf8', timeout: 120000 });
    return [r.status === 0, String(r.stdout || '').trim().split('\n').pop()];
  });

  console.log('D) Huerde im Protokoll, Rueckwirkung (Nr. 121-2b)');
  probe('D-1: Huerde je Trade zerlegt in Spanne zur Eroeffnung + IBKR-Gebuehr (Summe = Huerde), Belegstand-Absatz nennt Huerde und Bestandteile', function () {
    var e = laufWelt(function () { return 1e6; }), L = fs.readFileSync(path.join(K.HIER, 'laeufer.js'), 'utf8');
    return [Math.abs(e.kKandSpanne + e.kKandGebuehr - e.kKand) < 1e-12 && Math.abs(e.kKandSpanne - KO.KLASSEN[3].eroeffnung) < 1e-12 && e.kKandGebuehr > 0.03 && /Spanne zur Eroeffnung ' \+ de\(beste\.entdeckung\.kKandSpanne/.test(L) && /Nasdaq-100 nach Steuer \(seit 23\.10\.2026; vorher S&P 500\)/.test(L),
      'Huerde ' + e.kKand.toFixed(4) + ' = Spanne ' + e.kKandSpanne.toFixed(4) + ' + Gebuehr ' + e.kKandGebuehr.toFixed(4)];
  });
  probe('D-2: rueckwirkung-2b.js rechnet die 13 Konfigurationen offline (keine Renditen), nach den 2a-Regeln 13 von 13 nicht messbar', function () {
    var aus = path.join(C.SCRATCH, 'rw2b.json'), r = C.cp.spawnSync(process.execPath, [path.join(K.HIER, 'rueckwirkung-2b.js'), aus], { cwd: K.REPO, encoding: 'utf8', timeout: 120000 });
    var J = r.status === 0 ? JSON.parse(fs.readFileSync(aus, 'utf8')) : { zeilen: [] };
    return [r.status === 0 && J.zeilen.length === 13 && J.zeilen.every(function (z) { return !z.messbarNeu && z.nettoNeu < z.nettoAlt; }), String(r.stdout || r.stderr).trim().split('\n').pop().slice(0, 200)];
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
