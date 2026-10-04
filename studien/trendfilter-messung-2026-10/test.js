'use strict';
/* Trendfilter-Messung: alle Pruefungen in einem Aufruf (aus der Repo-Wurzel):
 *   node studien/trendfilter-messung-2026-10/test.js
 * Teil 1  die Teiltests an Kunstdaten: test-kern.js (Buch, Kennzahlen, Placebo, Entscheidregel), test-R1.js, test-R2.js, test-R3.js
 *         (Signale, von Hand gerechnet, dazu je ein zweiter Signalweg auf echten Daten).
 * Teil 2  nur mit Rohdaten (daten/ fehlt im Repo - Daten Dritter; laden.js holt sie): Pruefsummen, Kalender, Starttage, erster
 *         Zusatz-Tag, Ausschuettungen von SPY je Fenster, kein Ziel fehlt in den Fenstern.
 * Teil 3  nur mit ergebnis.json und zweitrechner.json: der Lauf kam aus diesem Code (Pruefsummen), die Entscheidregel ist richtig
 *         angewandt, und der unabhaengige zweite Rechner trifft jeden Endwert auf den Cent (REGEL §9.1). Schreibt
 *         vergleich-zweitrechner.json (fuer bericht.js). */
var fs = require('fs');
var path = require('path');
var crypto = require('crypto');
var childProcess = require('child_process');
var K = require('./kern.js');
var L = require('./laden.js');

var ORDNER = __dirname;
var gut = 0, schlecht = 0;
function ok(name, b, info) { if (b) gut++; else { schlecht++; console.log('ROT  ' + name + (info ? '  ' + info : '')); } }
function nah(name, ist, soll, tol) { ok(name, Math.abs(ist - soll) <= tol, 'ist ' + ist + ' soll ' + soll); }

/* ---------- Teil 1 ---------- */
['test-kern.js', 'test-R1.js', 'test-R2.js', 'test-R3.js'].forEach(function (f) {
  var p = path.join(ORDNER, f);
  if (!fs.existsSync(p)) { ok(f + ' vorhanden', false); return; }
  var r = childProcess.spawnSync(process.execPath, [p], { encoding: 'utf8', cwd: path.resolve(ORDNER, '..', '..'), maxBuffer: 64 * 1024 * 1024 });
  var zeilen = (r.stdout || '').trim().split('\n');
  var letzte = zeilen[zeilen.length - 1] || '';
  console.log('  ' + f + ': ' + letzte);
  var m = /(\d+) gr(?:ü|ue)n, (\d+) rot/.exec(letzte);
  ok(f + ' grün', r.status === 0 && m && +m[1] > 0 && +m[2] === 0, r.stderr ? r.stderr.slice(0, 500) : '');
});

/* ---------- Teil 2 ---------- */
var DATEN = path.join(ORDNER, 'daten');
var D = null;
if (fs.existsSync(path.join(DATEN, 'SPY.json'))) {
  var soll = JSON.parse(fs.readFileSync(path.join(ORDNER, 'pruefsummen.json'), 'utf8'));
  L.KUERZEL.forEach(function (sym) {
    var b = L.beschreibe(sym, fs.readFileSync(path.join(DATEN, sym + '.json'), 'utf8'));
    ok('Prüfsumme kanonischer Auszug ' + sym, b.shaKanonisch === soll.reihen[sym].shaKanonisch);
  });
  D = K.ladeDaten(DATEN);
  ok('Kalender endet am 15.09.2026, der kein Monatsende ist', D.tage[D.n - 1] === '2026-09-15' && D.monatsende[D.n - 1] === 0);
  var stA = K.starttage(D, K.FENSTER.A), stB = K.starttage(D, K.FENSTER.B);
  ok('Fenster A: 22 Starttage 04.01.2017 bis 03.02.2017', stA.length === 22 && D.tage[stA[0]] === '2017-01-04' && D.tage[stA[21]] === '2017-02-03');
  ok('Fenster B: 22 Starttage 16.09.2021 bis 15.10.2021', stB.length === 22 && D.tage[stB[0]] === '2021-09-16' && D.tage[stB[21]] === '2021-10-15');
  ok('Endtage A und B', D.tage[K.endIndex(D, '2021-09-15')] === '2021-09-15' && D.tage[K.endIndex(D, '2026-09-15')] === '2026-09-15');
  function spyAusschuettungen(s, e) { var z = 0; for (var i = s + 1; i <= e; i++) if (D.reihen.SPY.d[i] > 0) z++; return z; }
  ok('SPY-Ausschüttungen nach dem ersten Tag: A 18, B 20', spyAusschuettungen(stA[0], K.endIndex(D, '2021-09-15')) === 18 && spyAusschuettungen(stB[0], K.endIndex(D, '2026-09-15')) === 20);
  ok('keine verschobenen Ex-Tage', D.zaehlung.exTagVerschoben.length === 0, JSON.stringify(D.zaehlung.exTagVerschoben));
  var defs = ['R1', 'R2', 'R3'].map(function (r) { return require('./regel-' + r + '.js'); });
  var zE = defs.map(function (d) { return d.signal(D, Object.assign({}, K.ERSATZ)); });
  var ez = K.ersterZusatzTag(D, zE);
  ok('erster Zusatz-Tag 01.10.2003', D.tage[ez] === '2003-10-01', D.tage[ez]);
  defs.forEach(function (d) {
    var zH = d.signal(D, Object.assign({}, K.HAUPT));
    var leer = 0;
    for (var i = stA[0]; i < D.n; i++) if (zH[i] == null) leer++;
    for (var j = ez; j < D.n; j++) if (zE[defs.indexOf(d)][j] == null) leer++;
    ok(d.name + ': kein Ziel fehlt ab Fenster A (Haupt) und ab dem Zusatz (Ersatz)', leer === 0);
    var reihen = {};
    zH.forEach(function (x) { if (x) reihen[x] = 1; });
    ok(d.name + ': nur zulässige Reihen', Object.keys(reihen).every(function (x) { return ['SPY', 'BIL', 'ACWX', 'AGG'].indexOf(x) >= 0; }), Object.keys(reihen).join(','));
  });
} else console.log('  (daten/ fehlt: Teil 2 und 3 übersprungen - erst laden.js laufen lassen)');

/* ---------- Teil 3 ---------- */
var ERG = path.join(ORDNER, 'ergebnis.json'), ZW = path.join(ORDNER, 'zweitrechner.json');
if (D && fs.existsSync(ERG)) {
  var E = JSON.parse(fs.readFileSync(ERG, 'utf8'));
  Object.keys(E.lauf.code).forEach(function (f) {
    var sha = crypto.createHash('sha256').update(fs.readFileSync(path.join(ORDNER, f))).digest('hex');
    ok('ergebnis.json kam aus dem heutigen ' + f, sha === E.lauf.code[f]);
  });
  ['R1', 'R2', 'R3'].forEach(function (r) {
    var m = E.regeln[r];
    var u = K.urteil(m.fenster);
    ok(r + ': Urteil aus den Zahlen nachgerechnet', u.satz === m.urteil.satz && JSON.stringify(u.bedingungen) === JSON.stringify(m.urteil.bedingungen));
    ['A', 'B'].forEach(function (f) {
      var x = m.fenster[f];
      ok(r + f + ': Placebo hat so viele Wechsel wie die Regel', x.placebo.wechselW === x.k0.wechsel && x.placebo.laeufe === 1000);
      ok(r + f + ': keine fehlenden Kurse beim Start am ersten Tag', x.k0.fehlendeKurse === 0);
      var med = K.median(x.starttage.liste.map(function (y) { return y.abstandPp; }));
      nah(r + f + ': Median der Starttage nachgerechnet', med, x.starttage.median, 1e-9);
    });
  });
  if (fs.existsSync(ZW)) {
    var Z = JSON.parse(fs.readFileSync(ZW, 'utf8'));
    var vergleich = [];
    ['R1', 'R2', 'R3'].forEach(function (r) {
      ['A', 'B'].forEach(function (f) {
        var a = E.regeln[r].fenster[f], z = Z.fenster[f].regeln[r];
        var k = a.k0, zk = z.k0;
        var gleichR = k.regel.endwertCent === zk.regel.endwertCent, gleichS = k.spy.endwertCent === zk.spy.endwertCent;
        ok(r + f + ' k=0: Endwert der Regel auf den Cent', gleichR, k.regel.endwertCent + ' / ' + zk.regel.endwertCent);
        ok(r + f + ' k=0: Endwert SPY auf den Cent', gleichS, k.spy.endwertCent + ' / ' + zk.spy.endwertCent);
        var wa = k.wechselListe.map(function (w) { return w.tag + ' ' + w.von + '>' + w.nach; }).join(',');
        var wz = zk.wechselListe.map(function (w) { return (w.tag || w.ausfuehrung) + ' ' + w.von + '>' + w.nach; }).join(',');
        ok(r + f + ' k=0: Wechsel gleich (Tag, von, nach)', wa === wz, wa + ' / ' + wz);
        nah(r + f + ' k=0: Abstand Pp', k.abstandPp, zk.abstandPp, 1e-9);
        nah(r + f + ' k=0: Kosten', k.kosten, zk.kosten.gesamt, 1e-6);
        nah(r + f + ' k=0: größter Rückschlag Regel', k.regel.maxRueckschlag, zk.regel.groessterRueckschlag.wert, 1e-12);
        nah(r + f + ' k=0: größter Rückschlag SPY', k.spy.maxRueckschlag, zk.spy.groessterRueckschlag.wert, 1e-12);
        ok(r + f + ' k=0: längste Zeit unter Wasser Regel', k.regel.unterWasser.tage === zk.regel.laengsteZeitUnterWasser.tage && k.regel.unterWasser.von === zk.regel.laengsteZeitUnterWasser.von &&
          k.regel.unterWasser.bis === zk.regel.laengsteZeitUnterWasser.bis && k.regel.unterWasser.erholt === zk.regel.laengsteZeitUnterWasser.erholt,
          JSON.stringify(k.regel.unterWasser) + ' / ' + JSON.stringify(zk.regel.laengsteZeitUnterWasser));
        ok(r + f + ' k=0: längste Zeit unter Wasser SPY', k.spy.unterWasser.tage === zk.spy.laengsteZeitUnterWasser.tage && k.spy.unterWasser.von === zk.spy.laengsteZeitUnterWasser.von,
          JSON.stringify(k.spy.unterWasser) + ' / ' + JSON.stringify(zk.spy.laengsteZeitUnterWasser));
        nah(r + f + ' k=0: Anteil Tage unter Wasser', k.regel.anteilTageUnterWasser, zk.regel.anteilHandelstageUnterWasser, 1e-12);
        ok(r + f + ' k=0: Kalenderjahre', k.kalenderjahre.every(function (j) { return Math.abs(j.regel - zk.regel.kalenderjahre[String(j.jahr)]) < 1e-12 && Math.abs(j.spy - zk.spy.kalenderjahre[String(j.jahr)]) < 1e-12; }));
        var st = a.starttage.liste, zst = z.starttage;
        var stGleich = st.length === zst.length && st.every(function (x, i) {
          return x.start === zst[i].start && K.cent(x.endwertRegel) === zst[i].regelEndwertCent && K.cent(x.endwertSpy) === zst[i].spyEndwertCent && x.vorn === zst[i].vorn;
        });
        ok(r + f + ': alle Starttage auf den Cent gleich', stGleich);
        nah(r + f + ': Median der Starttage gleich', a.starttage.median, z.zusammenfassung.medianAbstandPp, 1e-9);
        ok(r + f + ': Zahl vorn gleich', a.starttage.vorn === z.zusammenfassung.vorn);
        vergleich.push({ regel: r, fenster: f, regelLauf: k.regel.endwertCent, regelZweit: zk.regel.endwertCent, spyLauf: k.spy.endwertCent, spyZweit: zk.spy.endwertCent,
          wechselGleich: wa === wz, starttage: stGleich ? 'alle ' + st.length + ' auf den Cent' : 'ABWEICHUNG' });
      });
      ok(r + ': Urteil gleich', E.regeln[r].urteil.satz === Z.urteile[r].urteil);
    });
    fs.writeFileSync(path.join(ORDNER, 'vergleich-zweitrechner.json'), JSON.stringify({ erzeugtVon: 'test.js', vergleich: vergleich }, null, 1) + '\n');
  } else console.log('  (zweitrechner.json fehlt: Abgleich übersprungen)');
} else if (D) console.log('  (ergebnis.json fehlt: Teil 3 übersprungen)');

console.log(gut + ' grün, ' + schlecht + ' rot');
process.exitCode = schlecht ? 1 : 0;
