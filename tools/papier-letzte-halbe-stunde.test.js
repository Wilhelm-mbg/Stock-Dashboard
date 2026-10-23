'use strict';
/* Test der Papier-Mitschrift "letzte halbe Stunde" (Nr. 121-2b C.2) auf Kunsttagen, ohne E: - Rendite, Halbtag, Luecken, Zeitzone Maerz/November,
 * Vollstaendigkeit, Idempotenz/Anhaengen. Aufruf: node tools/papier-letzte-halbe-stunde.test.js (Rueckgabe 1 bei einem Fehler). */
var fs = require('fs'), path = require('path'), os = require('os');
var n = 0, rot = 0;
function ok(c, name, extra) { n++; if (!c) rot++; console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); }
function probe(name, fn) { var r; try { r = fn(); } catch (e) { ok(false, name, 'Ausnahme: ' + String(e && e.message || e).slice(0, 200)); return; } ok(!!r[0], name, r[1]); }
var P = null; try { P = require('./papier-letzte-halbe-stunde.js'); } catch (e) { P = null; }

/* Kerze [ms, schluss, umsatz, hoch, tief, eroeffnung] zur New-Yorker Zeit hh:mm mit Versatz ny (-4 Sommer, -5 Winter) */
function kz(d, min, ny, o, c) { return [Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10), Math.floor(min / 60) - ny, min % 60), c, 1, 0, 0, o]; }
function tag(d, ny, o1530, o1600, opt) {
  opt = opt || {}; var k = [], von = 15 * 60 + 30, bis = opt.bis || 16 * 60;
  for (var m = von; m < bis; m++) if (!(opt.ohne && opt.ohne.indexOf(m) !== -1)) k.push(kz(d, m, ny, m === von ? o1530 : 100, opt.letzt && m === bis - 1 ? opt.letzt : 100));
  if (o1600 != null) k.push(kz(d, 16 * 60, ny, o1600, o1600));
  return k;
}
var KAL = { '2026-03-06': { close: '16:00' }, '2026-03-09': { close: '16:00' }, '2026-10-30': { close: '16:00' }, '2026-11-02': { close: '16:00' }, '2026-11-27': { close: '13:00' },
  '2026-11-30': { close: '16:00' }, '2026-12-01': { close: '16:00' }, '2026-12-02': { close: '16:00' } };
function kerzen() {
  return [].concat(
    tag('2026-03-06', -5, 100, 101),                                   /* Winterzeit: +1 % */
    tag('2026-03-09', -4, 200, 198),                                   /* nach der Umstellung 8.3.: −1 % */
    tag('2026-10-30', -4, 50, 50.5),                                   /* Sommerzeit bis 1.11. */
    tag('2026-11-02', -5, 80, null, { letzt: 80.8 }),                  /* ohne 16:00-Kerze, letzte 15:59 -> ok-1558, +1 % */
    tag('2026-11-27', -5, 70, 71),                                     /* Halbtag -> ausgeschlossen */
    tag('2026-11-30', -5, 90, null, { bis: 15 * 60 + 50 }),            /* letzte Kerze 15:49 -> Luecke */
    tag('2026-12-01', -5, 60, 61, { ohne: [15 * 60 + 40, 15 * 60 + 41, 15 * 60 + 42] }),   /* 27 Kerzen -> unvollstaendig */
    tag('2026-12-02', -5, 40, 40.4, { ohne: [15 * 60 + 30] }));         /* ohne 15:30-Kerze -> Luecke */
}
probe('Rendite 15:30-Eroeffnung -> 16:00-Eroeffnung, Zeitzone Maerz/November, Ersatz ab 15:58, Halbtag/Luecke/unvollstaendig ausgewiesen', function () {
  var T = P.tageAus(kerzen(), KAL), d = {}; T.forEach(function (x) { d[x.datum] = x; });
  var r = function (k) { return d[k] && d[k].rendite; };
  return [Math.abs(r('2026-03-06') - 1) < 1e-9 && Math.abs(r('2026-03-09') + 1) < 1e-9 && Math.abs(r('2026-10-30') - 1) < 1e-9 && d['2026-11-02'].status === 'ok-1558' && Math.abs(r('2026-11-02') - 1) < 1e-9 &&
    d['2026-11-27'].status === 'halbtag' && d['2026-11-27'].rendite === null && d['2026-11-30'].status === 'luecke-1600' && d['2026-12-01'].status === 'unvollstaendig' && d['2026-12-01'].kerzen === 27 &&
    d['2026-12-02'].status === 'luecke-1530' && d['2026-03-06'].kerzen === 30, JSON.stringify(T.map(function (x) { return [x.datum, x.status, x.rendite && +x.rendite.toFixed(4), x.kerzen]; }))];
});
probe('Kennzahlen: nur gezaehlte Tage, se Lag 1, t, MDE80, Jahre', function () {
  var K = P.kennzahlen(P.tageAus(kerzen(), KAL), 0.085);
  return [K.tage === 4 && Math.abs(K.mittel - 0.5) < 1e-9 && Math.abs(K.summe - 2) < 1e-9 && Math.abs(K.se - Math.sqrt(3 / 16)) < 1e-9 && Math.abs(K.mde80 - 2.8016 * K.se) < 1e-12 && K.jahre.length === 1 && K.jahre[0].ausgeschlossen === 4,
    'Tage ' + K.tage + ' Mittel ' + K.mittel + ' se ' + K.se];
});
probe('Idempotent und anhaengend: zweiter Lauf aendert nichts, ein neuer Tag wird ergaenzt, ein vorhandener Tag bleibt (auch wenn die Quelle sich aendert)', function () {
  var aus = fs.mkdtempSync(path.join(os.tmpdir(), 'papier-test-')), k = kerzen();
  var E1 = P.lauf({ aus: aus, kerzen: k.filter(function (b) { return b[0] < Date.UTC(2026, 10, 1); }), kalender: KAL, stand: 'x' });
  var j1 = fs.readFileSync(path.join(aus, 'letzte-halbe-stunde.json'), 'utf8');
  P.lauf({ aus: aus, kerzen: k.filter(function (b) { return b[0] < Date.UTC(2026, 10, 1); }), kalender: KAL, stand: 'y' });
  var j2 = fs.readFileSync(path.join(aus, 'letzte-halbe-stunde.json'), 'utf8');
  var k3 = k.map(function (b) { return b[0] < Date.UTC(2026, 2, 7) ? [b[0], b[1], b[2], b[3], b[4], b[5] * 2] : b; });   /* Quelle aendert den 06.03. */
  var E3 = P.lauf({ aus: aus, kerzen: k3, kalender: KAL, stand: 'z' }), d = {}; E3.tage.forEach(function (x) { d[x.datum] = x; });
  var md = fs.readFileSync(path.join(aus, 'letzte-halbe-stunde.md'), 'utf8');
  fs.rmSync(aus, { recursive: true, force: true });
  return [E1.tage.length === 3 && j1 === j2 && E3.tage.length === 8 && E3.neuDiesmal === 5 && Math.abs(d['2026-03-06'].rendite - 1) < 1e-9 && md.indexOf(P.KOPF) !== -1 && /Endet am letzten Archivtag 2026-12-02/.test(md),
    'Tage ' + E1.tage.length + ' -> ' + E3.tage.length + ', neu ' + E3.neuDiesmal + ', zweiter Lauf gleich ' + (j1 === j2)];
});
console.log('\n' + n + ' Pruefungen, ' + (rot ? rot + ' ROT' : 'ALLE TESTS GRUEN'));
process.exit(rot ? 1 : 0);
