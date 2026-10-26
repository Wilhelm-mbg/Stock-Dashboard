'use strict';
/* Auftrag Nr. 126 (26.10.2026): Momentum-Buch auf Kostenregel, Massstab Nasdaq-100 nach Steuer und Regel K - die Tests.
 *   A  Kostenregel je Order: fuehreAus mit opts.kostenRegel ziffergleich zu fuehreAusK (pruefstrasse/adapter/korb-kosten.js),
 *      Handrechnung aus pruefstrasse/kosten.js (Klasse, Eroeffnung, Gebuehr, Mindestgebuehr), ohne Option bitgleich zum alten Ergebnis.
 *   B  steuer.js = Kopie Nr. 82 (zeichengleich, gleiche Zahlen); Massstab.nachSteuer trifft den Fonds der Pruefstrasse; qqqTage = qqq-bauen.js.
 *   C  Umstellung: Kostenregel/Massstab ohne Neustart (liquideSeit, korbVerlauf, Trades bleiben, regelnSeit neu); Kunst-Split und Ausschuettung.
 *   D  Lagebild: neue Felder, Referenz Fassung 4, Schema gruen.
 *   F  Paket: die neuen Module im Build (build.files), laden ohne studien/ und pruefstrasse/, index.html laedt sie.
 * TEST_ROOT=<Ordner> prueft einen anderen Stand (rot/gruen-Nachweis gegen den Basis-Commit). Nur lesen, kein Netz, kein Store.
 * Simulation mit virtuellem Kapital, keine Anlage- und keine Steuerberatung. */
var fs = require('fs');
var path = require('path');
var os = require('os');
var ROOT = process.env.TEST_ROOT || __dirname;
var fails = 0, gesamt = 0;
function ok(cond, name, extra) {
  gesamt++;
  console.log((cond ? '  ✅ ' : '  ❌ ') + name + (extra !== undefined ? '  [' + extra + ']' : ''));
  if (!cond) fails++;
}
/** Ein Abschnitt; wirft er (etwa weil ein Modul im geprueften Stand fehlt), ist das eine rote Pruefung, kein Abbruch. */
function teil(fn) { try { fn(); } catch (e) { ok(false, 'Ausnahme im Abschnitt: ' + String(e && e.message || e).slice(0, 120)); } }
function lade(rel) { try { return require(path.join(ROOT, rel)); } catch (e) { return null; } }
function kopie(x) { return JSON.parse(JSON.stringify(x)); }
var MH = lade('mfhandel.js'), KR = lade('kostenregel.js'), ST = lade('steuer.js'), MS = lade('massstab.js'), LB = lade('lagebild.js');
var KO = require(path.join(__dirname, 'pruefstrasse', 'kosten.js'));
var KK = require(path.join(__dirname, 'pruefstrasse', 'adapter', 'korb-kosten.js'));
var STO = require(path.join(__dirname, 'studien', 'nach-steuern-2026-10-04', 'steuer.js'));
ok(!!(MH && KR && ST && MS && LB), 'Module laden: mfhandel, kostenregel, steuer, massstab, lagebild');

/* Zufall mit festem Keim (Park-Miller) */
var keim = 20261026;
function zufall() { keim = keim * 16807 % 2147483647; return (keim - 1) / 2147483646; }
var SYMS = ['AAA', 'BBB', 'CCC', 'DDD', 'EEE', 'FFF', 'GGG', 'HHH'];
function fall(n) {
  var buch = { cash: 2000 + zufall() * 30000, positionen: [], trades: [] };
  SYMS.slice(0, 4).forEach(function (s) { buch.positionen.push({ sym: s, stueck: Math.round(zufall() * 300 * 10000) / 10000 + 0.0001, einstand: 20 + zufall() * 300, seit: 1 }); });
  var plan = { verkaufen: [], kaufen: [] };
  buch.positionen.slice(0, 2 + (n % 2)).forEach(function (p) { plan.verkaufen.push({ sym: p.sym, stueck: p.stueck, kurs: 15 + zufall() * 400 }); });
  SYMS.slice(4).forEach(function (s, i) {
    var kurs = 5 + zufall() * 600, budget = 500 + zufall() * 12000;
    plan.kaufen.push({ sym: s, kurs: kurs, budget: budget, stueck: i === 3 && n % 3 === 0 ? 0 : Math.round(budget / kurs * 10000) / 10000 });
  });
  return { buch: buch, plan: plan };
}
var KLASSE_JE = { AAA: 0, BBB: 1, CCC: 2, DDD: 3, EEE: 4, FFF: 0, GGG: 3, HHH: 4 };

/* ================= A. Kostenregel je Order ================= */
console.log('\nA) Kostenregel je Order (fuehreAus opts.kostenRegel)');
teil(function () {
  if (!MH || !KR) { ok(false, 'A: Module fehlen'); return; }
  /* A.1 kostenregel.js ist die Pruefstrassen-Regel: Zahlen und Funktionen gegen das Original */
  var zahlenGleich = KR.KLASSEN.every(function (k, i) {
    var o = KO.KLASSEN[i];
    return k.name === o.name && k.von === o.von && k.kassa === o.kassa && k.eroeffnung === o.eroeffnung && k.kurs === o.kurs && k.faktor === o.faktor;
  }) && KR.KLASSEN.length === KO.KLASSEN.length && JSON.stringify(KR.IBKR) === JSON.stringify(KO.IBKR) && KR.INDEX.eroeffnung === KO.INDEX.eroeffnung;
  ok(zahlenGleich, 'A.1 Klassen 1-5, Index und IBKR-Tarif in kostenregel.js = pruefstrasse/kosten.js (bitgleich)');
  var K = require(path.join(__dirname, 'pruefstrasse', 'konfig.js'));
  ok(KR.KLASSE5_UMSATZ === K.KLASSE5_UMSATZ && KR.UMSATZ_FENSTER === K.UMSATZ_FENSTER, 'A.1 Klasse-5-Grenze und Umsatzfenster = pruefstrasse/konfig.js', KR.KLASSE5_UMSATZ + ' / ' + KR.UMSATZ_FENSTER);
  var abw = 0, nPunkte = 0;
  [0, 1, 2, 3, 4, 'index'].forEach(function (kl) {
    ['kauf', 'verkauf'].forEach(function (seite) {
      ['eroeffnung', 'kassa'].forEach(function (lage) {
        [0, 50, 999.99, 1000, 1163.2, 5263.16, 25000, 250000].forEach(function (w) {
          [3.21, 35.67, 201.78, 704.59].forEach(function (kurs) {
            nPunkte++;
            var a = KR.anteilSeite(kl, lage, seite, w, kurs, 'fixed'), b = KK.anteilSeite(kl, lage, seite, w, kurs, 'fixed');
            var s = KR.seite(kl, lage, seite, w, kurs, 'fixed');
            if (a !== b || s.spanne + s.gebuehr !== b) abw++;
          });
        });
      });
    });
  });
  ok(abw === 0, 'A.1 anteilSeite und Spanne + Gebuehr ziffergleich zu korb-kosten.js anteilSeite (' + nPunkte + ' Punkte)', abw + ' Abweichungen');
  var kv = [1e6, 4.9e6, 5e6, 49e6, 50e6, 250e6, 999e6, 1e9, 3.79e9, 3.8e9, 9e9].every(function (u) { return KR.klasseVonUmsatz(u) === KK.klasseVonUmsatz(u); });
  ok(kv, 'A.1 Kostenklasse aus dem Median-Dollarumsatz = korb-kosten.js klasseVonUmsatz (klasseZurLaufzeit)');
  ok(KR.klasseVonUmsatz(4e6) === 0 && KR.klasseVonUmsatz(6e7) === 1 && KR.klasseVonUmsatz(3e8) === 2 && KR.klasseVonUmsatz(2e9) === 3 && KR.klasseVonUmsatz(4e9) === 4,
    'A.1 Grenzen: 4 Mio -> 5-50, 60 Mio -> 50-250, 300 Mio -> 250-1000, 2 Mrd -> ab1000, 4 Mrd -> Klasse 5');

  /* A.2 Handrechnung je Trade aus pruefstrasse/kosten.js: Klasse 1, 4, 5 bei 1.000 $ (Mindestgebuehr) und 5.263,16 $ */
  [[0, 1000, 35.67], [3, 1000, 170.87], [4, 1000, 201.78], [0, 100000 / 19, 35.67], [3, 100000 / 19, 170.87], [4, 100000 / 19, 201.78]].forEach(function (f) {
    var kl = f[0], pos = f[1], kurs = f[2], stueck = Math.round(pos / kurs * 10000) / 10000, wert = stueck * kurs;
    var buch = { cash: pos * 0.05, positionen: [{ sym: 'X', stueck: stueck, einstand: kurs, seit: 1 }], trades: [] };
    var regel = KR.regel(function () { return kl; });
    MH.fuehreAus(buch, { verkaufen: [{ sym: 'X', stueck: stueck, kurs: kurs }], kaufen: [{ sym: 'Y', kurs: kurs, budget: pos, stueck: stueck }] }, 1000, 20, { kostenRegel: regel });
    var tv = buch.trades[0], tk = buch.trades[1];
    var spanneSoll = wert * KO.klasseObj(kl).eroeffnung / 100 / 2;
    var gebV = KO.ibkrGebuehr('fixed', 'verkauf', wert / kurs, kurs), gebK = KO.ibkrGebuehr('fixed', 'kauf', wert / kurs, kurs);
    var umlaufPp = (tv.kostenSpanne + tv.kostenGebuehr + tk.kostenSpanne + tk.kostenGebuehr) / wert * 100;
    var sollPp = KO.huerdeUmlauf(kl, 'eroeffnung', wert, kurs, 'fixed').gesamtPp;
    ok(tv.klasse === kl && tk.klasse === kl && Math.abs(tv.kostenSpanne - Math.round(spanneSoll * 100) / 100) < 1e-9 && Math.abs(tk.kostenSpanne - Math.round(spanneSoll * 100) / 100) < 1e-9 &&
      Math.abs(tv.kostenGebuehr - Math.round(gebV * 100) / 100) < 1e-9 && Math.abs(tk.kostenGebuehr - Math.round(gebK * 100) / 100) < 1e-9 && Math.abs(umlaufPp - sollPp) < 0.0021,
      'A.2 Klasse ' + (kl + 1) + ', Position ' + pos.toFixed(2) + ' $: Spanne, Gebuehr und Klasse je Trade = pruefstrasse/kosten.js (Umlauf ' + umlaufPp.toFixed(4) + ' Pp, Soll ' + sollPp.toFixed(4) + ' Pp)',
      'Spanne ' + tv.kostenSpanne + ' Gebuehr V ' + tv.kostenGebuehr + ' K ' + tk.kostenGebuehr);
    if (pos === 1000) ok(tk.kostenGebuehr >= 1 && tk.kostenGebuehr < 1.01, 'A.2 bei 1.000 $ greift die Mindestgebuehr 1 $ je Order (Klasse ' + (kl + 1) + ')', tk.kostenGebuehr);
  });

  /* A.3 mit Option ziffergleich zu fuehreAusK (Kopie Nr. 122, die Nr. 125a durch das Original ersetzt) */
  var gleich = 0, n = 40, protokollOk = true;
  for (var i = 0; i < n; i++) {
    var F = fall(i), a = kopie(F), b = kopie(F), log = [], logA = [];
    var kfK = function (name, seite, stueck, kurs) { return KK.anteilSeite(KLASSE_JE[name], 'eroeffnung', seite, stueck * kurs, kurs, 'fixed'); };
    var regel = function (o) { var s = KR.seite(KLASSE_JE[o.sym], 'eroeffnung', o.seite, o.stueck * o.kurs, o.kurs, 'fixed'); return { spanne: s.spanne, gebuehr: s.gebuehr, klasse: KLASSE_JE[o.sym] }; };
    var nA = MH.fuehreAus(a.buch, a.plan, 5000, 20, { kostenRegel: regel, kleinstAnteil: i % 2 ? 0.05 : 0, protokoll: logA });
    var nB = KK.fuehreAusK(b.buch, b.plan, 5000, kfK, { kleinstAnteil: i % 2 ? 0.05 : 0 }, log);
    var tA = a.buch.trades.map(function (t) { var x = Object.assign({}, t); delete x.kostenSpanne; delete x.kostenGebuehr; delete x.klasse; return x; });
    if (nA === nB && a.buch.cash === b.buch.cash && JSON.stringify(a.buch.positionen) === JSON.stringify(b.buch.positionen) && JSON.stringify(tA) === JSON.stringify(b.buch.trades) &&
      JSON.stringify(a.plan) === JSON.stringify(b.plan)) gleich++;
    if (logA.length !== log.length || logA.some(function (x, j) { return x.k !== log[j].k || x.wert !== log[j].wert || x.art !== log[j].art; })) protokollOk = false;
  }
  ok(gleich === n, 'A.3 fuehreAus mit opts.kostenRegel = fuehreAusK der Pruefstrasse, bitgleich (Bargeld, Positionen, Trades, Plan) in ' + n + ' Kunstfaellen', gleich + ' von ' + n);
  ok(protokollOk, 'A.3 opts.protokoll fuehrt je Ausfuehrung art, wert und k wie das log von fuehreAusK');

  /* A.4 ohne Option bitgleich zum alten Stand (mfhandel.js aus dem Basis-Commit 6ceff4c, im Test-Ordner abgelegt) */
  var altPfad = path.join(__dirname, 'test-daten', 'mfhandel-basis-6ceff4c.js.txt'), ALT = null;
  if (fs.existsSync(altPfad)) {   /* als Modul im Wurzelordner uebersetzt - momentum.js und liquide.js loesen dort auf */
    var Mod = require('module'), mo = new Mod(path.join(__dirname, 'mfhandel-basis.js'), module);
    mo.filename = path.join(__dirname, 'mfhandel-basis.js'); mo.paths = Mod._nodeModulePaths(__dirname);
    mo._compile(fs.readFileSync(altPfad, 'utf8'), mo.filename); ALT = mo.exports;
  }
  ok(!!ALT, 'A.4 der alte Stand (test-daten/mfhandel-basis-6ceff4c.js.txt = git show 6ceff4c:mfhandel.js) liegt vor');
  if (ALT) {
    var bit = 0;
    for (var j = 0; j < n; j++) {
      var G = fall(j + 100), x = kopie(G), y = kopie(G), opt = j % 2 ? { kleinstAnteil: 0.05 } : undefined;
      var r1 = MH.fuehreAus(x.buch, x.plan, 7000, j % 3 ? 20 : undefined, opt), r2 = ALT.fuehreAus(y.buch, y.plan, 7000, j % 3 ? 20 : undefined, opt);
      if (r1 === r2 && JSON.stringify(x) === JSON.stringify(y)) bit++;
    }
    ok(bit === n, 'A.4 ohne Option: fuehreAus bitgleich zum Basis-Commit (20 Bp je Seite, mit und ohne Regel K) in ' + n + ' Kunstfaellen', bit + ' von ' + n);
    var src = function (M) { return M.fuehreAus.toString().split('\n').filter(function (z) { return z.indexOf('fuehreAusRegel(') < 0; }).join('\n'); };
    ok(src(MH) === src(ALT), 'A.4 der feste Zweig von fuehreAus ist zeichengleich zum Basis-Commit (nur die eine Weiche davor ist neu)');
    var planGleich = ALT.planeUmschichtung.toString() === MH.planeUmschichtung.toString() && ALT.momentumZiel.toString() === MH.momentumZiel.toString() &&
      ALT.bucheMassnahmen.toString() === MH.bucheMassnahmen.toString();
    ok(planGleich, 'A.4 planeUmschichtung, momentumZiel, bucheMassnahmen unveraendert (Studien-Rechner Nr. 82/96 rechnen bitgleich)');
  }
  /* A.5 die Klasse zur Laufzeit aus den Tagesreihen: Median der 20 Balken VOR dem Ausfuehrungstag */
  var reihe = [];
  for (var t = 0; t < 30; t++) reihe.push([t * 86400000, 100, t < 25 ? 1e5 : 1e9]);   // ab Balken 25 Riesenumsatz
  var grenze = 25 * 86400000;
  ok(KR.medianUmsatzVor(reihe, grenze) === 1e7 && KR.regelAusReihen({ Z: reihe }, grenze)({ sym: 'Z', seite: 'kauf', stueck: 10, kurs: 100 }).klasse === 0,
    'A.5 Klasse aus den 20 Balken vor dem Ausfuehrungstag: Balken ab dem Ausfuehrungstag zaehlen nicht (Median 10 Mio $ -> Klasse 5-50)');
});

/* ================= B. Steuer und Massstab Nasdaq-100 ================= */
console.log('\nB) Steuerrechner (Kopie Nr. 82) und Massstab Nasdaq-100 nach Steuer');
teil(function () {
  if (!ST || !MS || !MS.nachSteuer) { ok(false, 'B: steuer.js oder Massstab.nachSteuer fehlen'); return; }
  var zeichen = ST.KOPIERT.filter(function (k) { return k !== 'MODELL'; }).every(function (k) { return ST[k].toString() === STO[k].toString(); });
  ok(zeichen && JSON.stringify(ST.MODELL) === JSON.stringify(STO.MODELL), 'B.1 steuer.js: ' + (ST.KOPIERT.length - 1) + ' Funktionen und MODELL zeichengleich zum Original (studien/nach-steuern-2026-10-04/steuer.js)');
  ok(/Kopie aus Nr\. 82, bitgleich/i.test(fs.readFileSync(path.join(ROOT, 'steuer.js'), 'utf8').slice(0, 400)) && ST.START === 100000, 'B.1 Kopf nennt "Kopie aus Nr. 82, bitgleich" und die Quelle; START 100.000 $');
  /* Kunstfall: Topf ueber zwei Jahre, Fonds ueber einen Jahreswechsel - beide Module rechnen dieselben Zahlen */
  function topfLauf(S) {
    var t = S.topfNeu(S.MODELL.steuersatz), r = [];
    [[2026, [500, -800]], [2026, [1200]], [2027, [-300, 100]], [2027, [2000, -50]]].forEach(function (s) { S.topfJahr(t, s[0]); s[1].forEach(function (g) { S.topfBuche(t, g); }); r.push(S.topfAbrechnen(t)); });
    return JSON.stringify(r) + JSON.stringify(t.jahre);
  }
  ok(topfLauf(ST) === topfLauf(STO), 'B.1 Kunstfall Verlusttopf (Gewinne, Verluste, Vortrag ueber den Jahreswechsel): Kopie = Original');
  var reiheK = [];
  for (var i = 0; i < 300; i++) { var d = new Date(Date.UTC(2025, 9, 1) + i * 86400000).toISOString().slice(0, 10); reiheK.push({ datum: d, eroeffnung: 100 + i * 0.1, schluss: 100.05 + i * 0.1, aus: i % 90 === 45 ? [0.5] : [] }); }
  var fK = ST.fonds(reiheK, 100000, ST.mit(ST.MODELL, { kostenPa: 0 })), fO = STO.fonds(reiheK, 100000, STO.mit(STO.MODELL, { kostenPa: 0 }));
  ok(JSON.stringify(fK) === JSON.stringify(fO) && fK.jahre.length === 1, 'B.1 Kunstfall Fonds mit Vorabpauschale 2025 und Ausschuettungen: Kopie = Original', 'endB ' + fK.endB.toFixed(2));

  /* B.2 Massstab.nachSteuer: der Fonds-Teil trifft die Rechnung der Pruefstrasse (korb-kosten.js nachSteuer: fonds(rq, START, mit(MODELL, {kostenPa: ETF.ter - TER_QQQ})), pa) */
  var QQ = JSON.parse(fs.readFileSync(path.join(__dirname, 'pruefstrasse', 'daten', 'qqq-tage.json'), 'utf8'));
  var startMs = Date.UTC(2026, 7, 25, 14), endeMs = Date.UTC(2026, 9, 22, 14);
  var buch = { start: 100000, cash: 100000, positionen: [], trades: [], liquideSeit: startMs };
  var r = MS.nachSteuer({ buch: buch, preise: {}, startMs: startMs, endeMs: endeMs, qqq: QQ.tage });
  var rq = QQ.tage.filter(function (x) { return x.d >= '2026-08-25' && x.d <= '2026-10-22'; }).map(function (x) { return { datum: x.d, eroeffnung: x.o, schluss: x.c, aus: x.aus || [] }; });
  var jahre = (endeMs - startMs) / (365.25 * 86400000);
  var fq = STO.fonds(rq, 100000, STO.mit(STO.MODELL, { kostenPa: KK.ETF.ter - 0.0020 }));
  ok(r.ok && r.massstab.nachSteuerPa === STO.pa(fq.endB, jahre) && r.massstab.ertragPa === STO.pa(fq.endA, jahre) && r.massstab.etf === 'IE00BMFKG444',
    'B.2 Nasdaq-100 nach Steuer seit 25.08.2026 = Fonds-Modell Nr. 82 wie korb-kosten.js (QQQ-Tage der Pruefstrasse)', r.ok ? r.massstab.nachSteuerPa.toFixed(4) + ' % p. a. nach Steuer, ' + r.massstab.ertragPa.toFixed(4) + ' brutto' : r.grund);
  /* B.3 das Buch nach Steuer: Kunstbuch mit zwei Umschichtungen, Ausschuettung und Endverkauf - Handrechnung mit dem Original */
  var t1 = Date.UTC(2026, 8, 1, 14), t2 = Date.UTC(2026, 9, 1, 14);
  var b2 = { start: 100000, cash: 60000, positionen: [{ sym: 'A', stueck: 100, einstand: 200 }, { sym: 'B', stueck: 50, einstand: 300 }],
    trades: [{ t: t1, art: 'verkauf', sym: 'X', stueck: 10, kurs: 100, pnl: 3000, kostenSpanne: 1, kostenGebuehr: 1 }, { t: t1, art: 'verkauf', sym: 'Y', stueck: 10, kurs: 100, pnl: -1000, kostenSpanne: 1, kostenGebuehr: 1 },
      { t: t1, art: 'kauf', sym: 'A', stueck: 100, kurs: 199.6, kostenSpanne: 20, kostenGebuehr: 1 }, { t: t2, art: 'verkauf', sym: 'Z', stueck: 5, kurs: 100, pnl: -2500, kostenSpanne: 1, kostenGebuehr: 1 }],
    massnahmen: [{ art: 'div', t: t2, summe: 80 }], liquideSeit: startMs };
  var preise = { A: 220, B: 280 };
  var r2 = MS.nachSteuer({ buch: b2, preise: preise, startMs: startMs, endeMs: endeMs, qqq: QQ.tage });
  var T = STO.topfNeu(STO.MODELL.steuersatz);
  STO.topfJahr(T, 2026); STO.topfBuche(T, 3000); STO.topfBuche(T, -1000); STO.topfAbrechnen(T); STO.topfBuche(T, -2500); STO.topfAbrechnen(T);
  var wS = 0, kS = 0; b2.trades.forEach(function (t) { wS += t.stueck * t.kurs; kS += t.kostenSpanne + t.kostenGebuehr; });
  var kE = kS / wS, erl = 100 * 220 * (1 - kE) + 50 * 280 * (1 - kE), gew = 100 * 220 * (1 - kE) - 20000 + 50 * 280 * (1 - kE) - 15000;
  var soll = 60000 + erl - Math.max(0, STO.topfStand(T) + gew) * STO.MODELL.steuersatz - 80 * STO.MODELL.steuersatz;
  ok(r2.ok && Math.abs(r2.steuer.buchEnde - soll) < 1e-6 && Math.abs(r2.buchNachSteuerPa - STO.pa(soll, jahre)) < 1e-9,
    'B.3 Buch nach Steuer: Verlusttopf je Umschichtung, Ausschuettung netto, Endverkauf - Handrechnung mit dem Original Nr. 82', r2.ok ? r2.steuer.buchEnde.toFixed(2) + ' $ / Soll ' + soll.toFixed(2) : r2.grund);
  ok(r2.ok && Math.abs(r2.kostenJahrPp - kS / 100000 * 100 / jahre) < 1e-12, 'B.3 Kosten je Jahr in Pp = gezahlte Spanne + Gebuehr / Startkapital / Jahre', r2.ok ? r2.kostenJahrPp.toFixed(4) : '');
  var ohne = MS.nachSteuer({ buch: b2, preise: preise, startMs: startMs, endeMs: endeMs, qqq: [] });
  ok(!ohne.ok && /QQQ/.test(ohne.grund) && ohne.buchNachSteuerPa != null, 'B.3 ohne QQQ-Reihe: kein Vergleich, ein Grund statt einer Zahl (das Buch nach Steuer steht trotzdem)');
  /* B.4 qqqTage = qqq-bauen.js tageAus (Kunstkerzen: Eroeffnung 09:30, Schluss = Eroeffnung der 16:00-Kerze, Halbtag, Dedupe) */
  var QB = require(path.join(__dirname, 'pruefstrasse', 'daten', 'qqq-bauen.js'));
  var kal = { '2026-10-20': { open: '09:30', close: '16:00' }, '2026-11-27': { open: '09:30', close: '13:00' }, '2026-10-21': { open: '09:30', close: '16:00' } };
  var kerzen = [];
  [['2026-10-20', 4], ['2026-10-21', 4], ['2026-11-27', 5]].forEach(function (x) {
    var basis = Date.parse(x[0] + 'T00:00:00Z') + x[1] * 3600000;
    for (var m = 9 * 60; m <= 16 * 60 + 5; m += 1) { if (x[0] === '2026-10-21' && m === 16 * 60) continue; var p = 100 + m / 100; kerzen.push([basis + m * 60000, p + 0.01, 10, p + 0.02, p - 0.02, p]); }
  });
  var saetze = [{ _art: 'cash_dividends', ex_date: '2026-10-20', rate: 0.5 }, { _art: 'cash_dividends', ex_date: '2026-10-20', rate: 0.5 }, { _art: 'cash_dividends', ex_date: '2026-10-21', rate: 0.25 }];
  var A1 = MS.qqqAusschuettungen(saetze), A2 = QB.ausschuettungen(saetze, []);
  var mT = MS.qqqTage(kerzen, kal, A1.je), bT = QB.tageAus(kerzen, kal, A2.je).tage.map(function (x) { var y = Object.assign({}, x); delete y.cb; return y; });
  ok(JSON.stringify(mT) === JSON.stringify(bT) && JSON.stringify(A1.je) === JSON.stringify(A2.je) && A1.doppelt.length === 1 && mT.length === 3,
    'B.4 qqqTage + Ausschuettungen (Dedupe) = pruefstrasse/daten/qqq-bauen.js auf Kunstkerzen (Halbtag, fehlende 16:00-Kerze, doppelte Ausschuettung)', mT.map(function (x) { return x.d + ' ' + x.schlussArt; }).join(', '));
});

/* ================= C. Umstellung ohne Neustart, Splits und Ausschuettungen ================= */
console.log('\nC) Regel K, Kostenregel, Massstab: Umstellung ohne Neustart; Kunst-Split und Ausschuettung');
teil(function () {
  if (!MH) { ok(false, 'C: mfhandel fehlt'); return; }
  var q = fs.readFileSync(path.join(ROOT, 'mfdepot.js'), 'utf8'), a = q.indexOf('var KONFIG_FELDER'), b = q.indexOf('async function takt(');
  var U = null;
  try { U = new Function(q.slice(a, b) + '\nreturn { pruefen: umstellungPruefen, felder: KONFIG_FELDER, kein: typeof KEIN_NEUSTART !== "undefined" ? KEIN_NEUSTART : null, abschnitte: typeof vorwaertsAbschnitte !== "undefined" ? vorwaertsAbschnitte : null };')(); } catch (e) { U = null; }
  ok(!!U, 'C.1 die Umstellungs-Logik laesst sich aus mfdepot.js ohne Fenster laden');
  if (!U) return;
  var NEU = MH.buchKonfig();
  ok(NEU.kleinstAnteil === 0.05 && NEU.kostenRegel === 'eroeffnung+ibkr' && NEU.massstab === 'nasdaq100-steuer', 'C.1 buchKonfig: Regel K 0,05 an, Kostenregel eroeffnung+ibkr, Massstab nasdaq100-steuer');
  ok(!!U.kein && ['kleinstAnteil', 'kostenRegel', 'massstab', 'regelnSeit'].every(function (k) { return U.kein.indexOf(k) >= 0; }) && U.felder.indexOf('kostenRegel') >= 0 && U.felder.indexOf('massstab') >= 0,
    'C.1 Liste "Felder, die keinen Neustart ausloesen": kleinstAnteil, kostenRegel, massstab, regelnSeit', U.kein ? U.kein.join(',') : '-');
  /* das laufende Buch: Konfiguration von Nr. 87 (Regel K an, ohne Kostenregel/Massstab), Vorwaertstest seit 25.08.2026 */
  var ALT87 = Object.assign({}, NEU); delete ALT87.kostenRegel; delete ALT87.massstab;
  var LIQ = Date.UTC(2026, 7, 25, 14), JETZT = Date.UTC(2026, 9, 26, 15);
  var TRADES = [{ t: LIQ, sym: 'AAPL', art: 'kauf', stueck: 10, kurs: 200 }], VERL = [{ t: LIQ, zulaessig: 180, geprueft: 190, ziel: 18 }];
  var d = { mfBuch: { name: 'momentum', cash: 5, positionen: [{ sym: 'AAPL', stueck: 10, einstand: 200.4, seit: LIQ }], trades: kopie(TRADES), konfig: kopie(ALT87), konfigSeit: 1, liquideSeit: LIQ, korbVerlauf: kopie(VERL), kleinstSeit: 2 } };
  var r1 = U.pruefen(d, kopie(NEU), JETZT), z = (d.tuneLog || [])[0] || { applied: [''], txt: '' };
  ok(r1 === true && d.tuneLog.length === 1 && z.id === 'mfregeln-' + JETZT && /Regeln umgestellt \(Kostenregel, Maßstab\)/.test(z.applied[0]),
    'C.2 Umstellung auf Kostenregel und Massstab: genau eine Journalzeile', z.applied[0]);
  ok(d.mfBuch.liquideSeit === LIQ && JSON.stringify(d.mfBuch.korbVerlauf) === JSON.stringify(VERL) && JSON.stringify(d.mfBuch.trades) === JSON.stringify(TRADES) &&
    d.mfBuch.konfigSeit === 1 && d.mfBuch.kleinstSeit === 2 && d.mfBuch.positionen.length === 1,
    'C.2 liquideSeit, korbVerlauf, Trades, Positionen, konfigSeit bleiben - der Vorwaertstest seit 25.08.2026 wird NICHT neu begonnen');
  ok(d.mfBuch.regelnSeit === JETZT && d.mfBuch.regelnVorher && d.mfBuch.regelnVorher.bis === JETZT && d.mfBuch.regelnVorher.seit === LIQ && !d.mfBuch.regelnVorher.konfig.kostenRegel &&
    d.mfBuch.konfig.kostenRegel === 'eroeffnung+ibkr', 'C.2 nur regelnSeit ist neu; der Abschnitt davor behaelt seine Regeln (regelnVorher)');
  ok(/Regeln seit 26\.10\.2026: Kosten nach der Kostenregel/.test(z.txt) && /Regel K gegen Kleinstpositionen an/.test(z.txt) && /Nasdaq-100 nach deutscher Steuer/.test(z.txt) &&
    /vergangene Trades bleiben/.test(z.txt) && /Simulation mit virtuellem Kapital/.test(z.txt), 'C.2 der Text nennt "Regeln seit 26.10.2026: Kostenregel, Regel K, Massstab Nasdaq-100 nach Steuer"');
  ok(U.pruefen(d, kopie(NEU), JETZT + 1000) === false && d.tuneLog.length === 1, 'C.2 der zweite Takt schreibt nichts mehr');
  var ab = U.abschnitte ? U.abschnitte(d.mfBuch) : [];
  ok(ab.length === 2 && ab[0].von === LIQ && ab[0].bis === JETZT && /Kosten 20 Bp je Seite/.test(ab[0].regeln) && /S&P 500 brutto/.test(ab[0].regeln) && ab[1].von === JETZT && ab[1].bis === null && /Kostenregel/.test(ab[1].regeln),
    'C.2 zwei Abschnitte des Vorwaertstests mit ihren Regeln: 25.08.-26.10. (20 Bp, S&P 500) und seit 26.10. (Kostenregel, Nasdaq-100)');
  /* ein Buch von vor Nr. 87 (ohne Regel K): zwei Zeilen (Regeln, Regel K), nichts zurueckgesetzt */
  var ALT7 = Object.assign({}, ALT87); delete ALT7.kleinstAnteil;
  var d7 = { mfBuch: { name: 'momentum', cash: 5, positionen: [], trades: [], konfig: kopie(ALT7), konfigSeit: 1, liquideSeit: LIQ, korbVerlauf: kopie(VERL) } };
  var r7 = U.pruefen(d7, kopie(NEU), JETZT);
  ok(r7 === true && d7.tuneLog.length === 2 && /Regel K gegen Kleinstpositionen eingeschaltet/.test(d7.tuneLog[0].applied[0]) && /Regeln umgestellt/.test(d7.tuneLog[1].applied[0]) &&
    d7.mfBuch.liquideSeit === LIQ && d7.mfBuch.korbVerlauf.length === 1 && d7.mfBuch.konfig.kleinstAnteil === 0.05 && d7.mfBuch.konfig.kostenRegel === 'eroeffnung+ibkr',
    'C.2 Buch ohne Regel K: Regel K ein (0,05) + Kostenregel/Massstab - zwei Zeilen, liquideSeit bleibt', d7.tuneLog.map(function (x) { return x.id; }).join(','));
  /* eine echte Korb-Aenderung setzt weiter zurueck (und beginnt auch den Regel-Abschnitt neu) */
  var dk = { mfBuch: { name: 'momentum', cash: 5, positionen: [], trades: [], konfig: Object.assign(kopie(ALT87), { umsatzMin: 5e7 }), konfigSeit: 1, liquideSeit: LIQ, korbVerlauf: kopie(VERL) } };
  U.pruefen(dk, kopie(NEU), JETZT);
  ok(dk.mfBuch.liquideSeit === null && dk.mfBuch.korbVerlauf.length === 0 && dk.mfBuch.regelnSeit === JETZT && !dk.mfBuch.regelnVorher, 'C.2 eine Korb-Aenderung (Umsatzschwelle) setzt den Vorwaertstest weiter zurueck - wie bisher');

  /* C.3 Nr. 87 im Buch mit Kostenregel: Kunst-Split 4:1 und Ausschuettung nach dem Handel, kein Verlust, keine Verdopplung */
  var regel = KR ? KR.regel(function () { return 3; }) : null;
  var buch = { cash: 10000, positionen: [], trades: [] }, T0 = Date.UTC(2026, 10, 23, 14, 30);
  if (regel) MH.fuehreAus(buch, { verkaufen: [], kaufen: [{ sym: 'NVDA', kurs: 400, budget: 8000, stueck: 20 }] }, T0, 20, { kostenRegel: regel, kleinstAnteil: 0.05 });
  MH.stempleKursT(buch, { NVDA: T0 }, T0);
  var stueck0 = buch.positionen.length ? buch.positionen[0].stueck : 0, einst0 = buch.positionen.length ? buch.positionen[0].einstand : 0, wert0 = stueck0 * 400;
  var ex = T0 + 7 * 86400000, er = { NVDA: { split: [[ex, 4, 1]], div: [[ex + 86400000, 0.04]] } }, bar = { NVDA: ex + 2 * 86400000 };
  var cash0 = buch.cash, res = MH.bucheMassnahmen(buch, er, bar, ex + 2 * 86400000), p = buch.positionen[0] || {};
  ok(!!regel && stueck0 === 20 && p.stueck === 80 && Math.abs(p.einstand - einst0 / 4) < 1e-12 && Math.abs(p.stueck * 100 - wert0) < 1e-9 && buch.positionen.length === 1,
    'C.3 Kunst-Split 4:1 im Buch mit Kostenregel: 20 -> 80 Stueck, Einstand / 4, Wert zum geteilten Kurs unveraendert - nichts verloren, nichts verdoppelt', p.stueck + ' Stueck');
  ok(Math.abs(buch.cash - cash0 - 80 * 0.04) < 1e-9 && res.buchungen.length === 2, 'C.3 Ausschuettung nach dem Split auf 80 Stueck gutgeschrieben (3,20 $)', (buch.cash - cash0).toFixed(4));
  var res2 = MH.bucheMassnahmen(buch, er, bar, ex + 3 * 86400000);
  ok(res2.buchungen.length === 0 && buch.positionen[0].stueck === 80, 'C.3 ein zweiter Lauf bucht nichts doppelt');
  var mfdQ = fs.readFileSync(path.join(ROOT, 'mfdepot.js'), 'utf8');
  var iM = mfdQ.indexOf('if (massnahmenBuchen(MH, d, daten, now)) speichern();'), iH = mfdQ.indexOf('var nM = MH.fuehreAus(d.mfBuch, plan, now, 20, optsM);');
  ok(iM > 0 && iH > iM && /kostenRegel = window\.Kostenregel\.regelAusReihen\(roh, MH\.nyZeit\(tag, 0, 0\)\)/.test(mfdQ),
    'C.4 das App-Buch setzt die Kostenregel (Umsatzklasse aus den Reihen vor dem Ausfuehrungstag) fuer Umschichtung und Nachfassen');
});

/* ================= D. Lagebild ================= */
console.log('\nD) Lagebild (Vertrag v1, nur ergaenzt)');
teil(function () {
  if (!LB) { ok(false, 'D: lagebild fehlt'); return; }
  var ref = JSON.parse(fs.readFileSync(path.join(ROOT, 'test-daten', 'lagebild-beispiel.json'), 'utf8'));
  var NEUE = ['massstab', 'buchNachSteuerPa', 'abstandNachSteuerPa', 'kostenJahrPp', 'kostenRegel', 'regelK', 'regelnSeit', 'regelnText', 'vorwaertsAbschnitte', 'nachSteuerGrund', 'spyPa', 'bruttoPa'];
  ok(/Fassung 4/.test(ref.hinweis) && ref.buecher.every(function (b) { return NEUE.every(function (k) { return k in b; }); }) && 'kostenRegel' in ref.regeln,
    'D.1 Referenz test-daten/lagebild-beispiel.json Fassung 4: alle Buecher tragen die neuen Schluessel, regeln.kostenRegel');
  var m = ref.buecher[0];
  ok(m.massstab && m.massstab.name === 'Nasdaq-100 nach Steuer' && m.massstab.etf === 'IE00BMFKG444' && 'ertragPa' in m.massstab && 'nachSteuerPa' in m.massstab && m.kostenRegel === 'eroeffnung+ibkr' &&
    m.regelK === true && m.regelnSeit === '2026-10-26', 'D.1 Momentum-Buch der Referenz: massstab {name, etf, ertragPa, nachSteuerPa}, kostenRegel, regelK, regelnSeit');
  /* bau() mit einer Kunst-Quelle: die Felder kommen aus karteDaten (nachSteuer, regelnSeit, regelnText, abschnitte) */
  var ns = { ok: true, massstab: { name: 'Nasdaq-100 nach Steuer', etf: 'IE00BMFKG444', ertragPa: 14.234, nachSteuerPa: 12.9111 }, buchNachSteuerPa: 18.4, abstandNachSteuerPa: 5.4889, kostenJahrPp: 1.02137, spyPa: 16.3, bruttoPa: 24.123 };
  var buch = { konfig: Object.assign({}, MH.buchKonfig()), positionen: [], trades: [] };
  var MFD = { karteDaten: function (name) {
    return { an: true, buch: name === 'momentum' ? buch : { positionen: [] }, wert: 100, start: 100, massstab: null, regelnSeit: name === 'momentum' ? Date.UTC(2026, 9, 26, 15) : null,
      regelnText: name === 'momentum' ? 'Kosten nach der Kostenregel' : null, abschnitte: name === 'momentum' ? [{ von: Date.UTC(2026, 7, 25, 14), bis: Date.UTC(2026, 9, 26, 15), regeln: 'alt' }, { von: Date.UTC(2026, 9, 26, 15), bis: null, regeln: 'neu' }] : [],
      nachSteuer: name === 'momentum' ? ns : null };
  }, gegenMarktText: function () { return null; } };
  var L = LB.bau({ D: { mfBuch: buch, driftBuch: null, positions: [] }, MFDepot: MFD, Massstab: MS, Kostenregel: KR, jetzt: Date.UTC(2026, 9, 26, 16) });
  var bm = L.buecher && L.buecher[0];
  ok(!!bm && bm.massstab.nachSteuerPa === 12.91 && bm.buchNachSteuerPa === 18.4 && bm.abstandNachSteuerPa === 5.49 && bm.kostenJahrPp === 1.0214 && bm.kostenRegel === 'eroeffnung+ibkr' &&
    bm.regelK === true && bm.regelnSeit === '2026-10-26' && bm.vorwaertsAbschnitte.length === 2 && bm.vorwaertsAbschnitte[0].von === '2026-08-25' && bm.spyPa === 16.3 && bm.bruttoPa === 24.12 &&
    /^Regeln seit 26\.10\.2026: /.test(bm.regelnText), 'D.2 Lagebild.bau uebernimmt die Felder aus karteDaten (gerundet, nichts nachgerechnet)', bm ? JSON.stringify(bm.massstab) : 'kein Buch');
  ok(L.buecher[1].massstab === null && L.buecher[2].buchNachSteuerPa === null && L.buecher[2].vorwaertsAbschnitte.length === 0, 'D.2 Drift- und Intraday-Buch: die Schluessel stehen mit null / []');
  var sch = LB.pruefeSchema(L, ref);
  ok(sch.fremd.filter(function (x) { return /^buecher/.test(x) && !/\.buchSatz$/.test(x); }).length === 0 && sch.fehlend.filter(function (x) { return /^buecher\[\d\]\.(massstab|buchNach|abstand|kosten|regel|vorwaerts|spyPa|brutto|nachSteuer)/.test(x); }).length === 0,
    'D.3 Schema: keine fremden und keine fehlenden der neuen Schluessel im Abschnitt buecher', sch.fremd.concat(sch.fehlend).slice(0, 4).join(' | '));
  ok(L.regeln === null || 'kostenRegel' in L.regeln, 'D.3 Abschnitt regeln traegt kostenRegel (wenn gebaut)');
  ok(LB.pruefeSchema(ref, ref).ok, 'D.3 Referenz gegen sich selbst gruen');
  var orig = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'uebergabe', 'lagebild-beispiel.json');
  if (fs.existsSync(orig)) ok(fs.readFileSync(orig, 'utf8') === fs.readFileSync(path.join(ROOT, 'test-daten', 'lagebild-beispiel.json'), 'utf8'), 'D.3 uebergabe/lagebild-beispiel.json = test-daten/lagebild-beispiel.json (Fassung 4)');
});

/* ================= F. Paket ================= */
console.log('\nF) Die neuen Module im Paket');
teil(function () {
  var pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8')), muster = (pkg.build && pkg.build.files) || [];
  function imPaket(rel) {
    var drin = false;
    muster.forEach(function (p) {
      var neg = p.charAt(0) === '!', m = neg ? p.slice(1) : p, t;
      if (m.indexOf('**') >= 0) t = new RegExp('^' + m.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '@@').replace(/\*/g, '[^/]*').replace(/@@/g, '.*') + '$').test(rel);
      else if (m.indexOf('*') >= 0) t = new RegExp('^' + m.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '$').test(rel);
      else t = rel === m || rel.indexOf(m + '/') === 0;
      if (t) drin = !neg;
    });
    return drin;
  }
  ['kostenregel.js', 'steuer.js', 'massstab.js', 'mfhandel.js', 'mfdepot.js', 'lagebild.js'].forEach(function (f) { ok(imPaket(f), 'F.1 ' + f + ' liegt im Paket (build.files)'); });
  ok(!imPaket('test-momentum-umstellung.js') && !imPaket('pruefstrasse/kosten.js') && !imPaket('studien/nach-steuern-2026-10-04/steuer.js'),
    'F.1 der Test, pruefstrasse/ und der Studienordner liegen NICHT im Paket - deshalb die Kopien');
  /* nachgebautes Paket: nur Wurzel-Skripte, die build.files trifft; dort laden die Module ohne studien/ und pruefstrasse/ */
  var tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'paket126-'));
  try {
    fs.readdirSync(ROOT).filter(function (f) { return /\.js$/.test(f) && imPaket(f); }).forEach(function (f) { fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f)); });
    var geladen = ['kostenregel.js', 'steuer.js', 'massstab.js', 'mfhandel.js'].every(function (f) {
      try { var M = require(path.join(tmp, f)); return !!M && Object.keys(M).length > 3; } catch (e) { console.log('    ' + f + ': ' + e.message); return false; }
    });
    var M2 = geladen ? require(path.join(tmp, 'massstab.js')) : null;
    var r = M2 ? M2.nachSteuer({ buch: { start: 100000, cash: 100000, positionen: [], trades: [] }, preise: {}, startMs: Date.UTC(2026, 7, 25), endeMs: Date.UTC(2026, 8, 25), qqq: [{ d: '2026-08-25', o: 100, c: 101, aus: [] }, { d: '2026-09-25', o: 102, c: 103, aus: [] }] }) : null;
    ok(geladen && r && r.ok, 'F.2 im nachgebauten Paket laden kostenregel, steuer, massstab, mfhandel und rechnen nach Steuer (ohne studien/, pruefstrasse/)', r ? (r.ok ? 'ok' : r.grund) : '-');
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  var html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
  var iK = html.indexOf('<script src="kostenregel.js"></script>'), iS = html.indexOf('<script src="steuer.js"></script>'), iH = html.indexOf('<script src="mfhandel.js"></script>'),
    iM = html.indexOf('<script src="massstab.js"></script>'), iD = html.indexOf('<script src="mfdepot.js"></script>');
  ok(iK > 0 && iS > 0 && iK < iD && iS < iM && iH < iD, 'F.3 index.html laedt kostenregel.js und steuer.js vor massstab.js und mfdepot.js');
  var pre = fs.readFileSync(path.join(ROOT, 'preload.js'), 'utf8'), mn = fs.readFileSync(path.join(ROOT, 'main.js'), 'utf8');
  ok(/massstabQqq: \(vonJahr\) => ipcRenderer\.invoke\('massstab-qqq', vonJahr\)/.test(pre) && /ipcMain\.handle\('massstab-qqq'/.test(mn) && /Massstab\.qqqTage\(kerzen, kal, A\.je\)/.test(mn),
    'F.3 die QQQ-Tage kommen ueber die Auskunft massstab-qqq aus dem Alpaca-Minutenarchiv (main.js liest, massstab.js rechnet)');
});

console.log('\n' + (gesamt - fails) + ' von ' + gesamt + ' Pruefungen gruen' + (fails ? ', ' + fails + ' ROT' : ''));
process.exit(fails ? 1 : 0);
