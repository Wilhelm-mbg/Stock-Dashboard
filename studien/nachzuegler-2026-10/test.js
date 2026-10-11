'use strict';
/* PRUEFUNGEN der Nachzuegler-Studie (Nr. 109). Kunstdaten je Regelzeile, Sperre mit Gegenprobe, Wortlaut der Regel.
 *
 *   node studien/nachzuegler-2026-10/test.js
 *
 * Liest kein echtes Panel. Schreibt nur in einen Wegwerf-Ordner unter dem Temp-Verzeichnis. Simulation, keine Anlageberatung.
 */
var fs = require('fs');
var os = require('os');
var path = require('path');
var cp = require('child_process');
var KN = require('./konfig.js');
var LS = require('./lesen.js');

var gut = 0, schlecht = 0, abschnitt = '';
function ok(b, name) { if (b) gut++; else { schlecht++; console.log('ROT [' + abschnitt + '] ' + name); } }
function nah(a, b, tol) { return Math.abs(a - b) <= (tol || 1e-9); }
function wirft(f, muster) { try { f(); return false; } catch (e) { return muster ? muster.test(String(e.message)) : true; } }
function teil(name) { abschnitt = name; }
var TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'nachzuegler-test-'));

/* ---------- Kunstkalender und Kunstpanel ---------- */
function kunstKalender(von, bis) {
  var tage = [], d = Date.UTC(+von.slice(0, 4), +von.slice(5, 7) - 1, +von.slice(8, 10)), e = Date.UTC(+bis.slice(0, 4), +bis.slice(5, 7) - 1, +bis.slice(8, 10));
  for (; d <= e; d += 86400000) { var w = new Date(d).getUTCDay(); if (w !== 0 && w !== 6) tage.push(new Date(d).toISOString().slice(0, 10)); }
  return tage;
}
var MARKE_GUT = 1 | 4;                                     /* QUELLE_REIN | DICHTE_OK */
/** reihen: [{ name, preise: Float64Array je Kalendertag (NaN = keine Zeile), klasse, referenz, ende_grund }] */
function kunstPanel(ordner, tage, reihen, letzterVoll) {
  var zeilen = [];
  for (var t = 0; t < tage.length; t++) {
    reihen.forEach(function (r, s) {
      var c = r.schluss[t]; if (!(c > 0)) return;
      var o = r.eroeffnung ? r.eroeffnung[t] : c;
      var vor = -1; for (var u = t - 1; u >= 0; u--) if (r.schluss[u] > 0) { vor = u; break; }
      zeilen.push({ sym: s, tag: t, marken: MARKE_GUT, klasse: r.klasse == null ? 2 : r.klasse, kerzen: 390,
        rohSchluss: c, rohEroeffnung: o, faktor: 1, rendite: vor >= 0 ? 100 * (c / r.schluss[vor] - 1) : NaN, renditeOC: 100 * (c / o - 1),
        umsatzReg: 1e8, umsatzAuktion: 0 });
    });
  }
  LS.schreibeKunstpanel(ordner, { kennung: 'kunst/nachzuegler', tage: tage, letzterVollTagIdx: letzterVoll == null ? tage.length - 1 : letzterVoll,
    symbole: reihen.map(function (r) { return { reihe: r.name, ordner: r.name, lebend: r.ende_grund ? 0 : 1, art: 'CS', referenz: !!r.referenz, ende_grund: r.ende_grund || null, ende_datum: null }; }),
    zeilen: zeilen });
}
function zufall(saat) { var a = saat >>> 0; return function () { a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function irrfahrt(n, saat, sd) { var r = zufall(saat), p = new Float64Array(n), x = 50; for (var i = 0; i < n; i++) { var u = r() + r() + r() - 1.5; x *= 1 + (sd || 0.02) * u * 2; p[i] = x; } return p; }

/* =========================================================================================
 * 1. Wortlaut: REGEL.md traegt den Eintrag aus wiki/entscheide.md (Stand faf6adb) zeichengleich
 * ========================================================================================= */
teil('Wortlaut');
(function () {
  var text = cp.execFileSync('git', ['show', 'faf6adb:wiki/entscheide.md'], { cwd: KN.REPO, encoding: 'utf8' }).split('\n');
  var i0 = text.findIndex(function (z) { return z.indexOf('- **Nachzügler-Studie (Nr. 109)') === 0; });
  ok(i0 >= 0, 'Eintrag in entscheide.md gefunden');
  var block = text.slice(i0).filter(function (z) { return z !== ''; });
  ok(block.length === 13, 'Eintrag hat 13 Zeilen (Kopf, 11 Punkte, Nachtrag 1): ' + block.length);
  var regel = fs.readFileSync(path.join(KN.HIER, 'REGEL.md'), 'utf8');
  ok(regel.indexOf(block.join('\n')) !== -1, 'REGEL.md enthaelt den Eintrag zeichengleich');
  var heute = fs.readFileSync(path.join(KN.REPO, 'wiki', 'entscheide.md'), 'utf8');
  ok(heute.indexOf(block.join('\n')) !== -1, 'der Eintrag steht unveraendert im heutigen entscheide.md');
  ok(KN.KONFIGURATIONEN === 384 && 3 * 2 * 2 * 2 * 4 * 4 === 384, 'Konfigurationszahl 384');
  ok(regel.indexOf('0,221 / 0,102 / 0,074 / 0,055') !== -1 && KN.HUERDE.join('/') === '0.221/0.102/0.074/0.055', 'Huerden nach Nachtrag 1 (1)');
  ok(KN.HUERDE_KASSA.join('/') === '0.157/0.085/0.065/0.045', 'Kassa-Huerde als Vergleichszeile');
  var alle = {}; for (var i = 0; i < 384; i++) { var k = KN.konfAus(i); alle[k.name] = 1; if (KN.konfIndex(k.a, k.r, k.v, k.hy, k.hi, k.c) !== i) ok(false, 'konfIndex ' + i); }
  ok(Object.keys(alle).length === 384, 'konfIndex ist umkehrbar und eindeutig');
})();

/* =========================================================================================
 * 2. Sperre: Siegel an einem Wegwerf-Repo - fehlt, nicht committet, geaendert, gueltig (Z22)
 * ========================================================================================= */
teil('Siegel');
var REPO_T = path.join(TMP, 'repo');
function gitT(args) { return cp.execFileSync('git', ['-c', 'core.autocrlf=false', '-c', 'user.name=test', '-c', 'user.email=test@example.invalid'].concat(args), { cwd: REPO_T, encoding: 'utf8', windowsHide: true }); }
(function () {
  fs.mkdirSync(path.join(REPO_T, 'studie'), { recursive: true });
  gitT(['init', '-q']);
  fs.writeFileSync(path.join(REPO_T, 'studie', 'anderes.txt'), 'x');
  gitT(['add', 'studie/anderes.txt']); gitT(['commit', '-q', '-m', 'start']);
  var o = { repo: REPO_T, pfad: 'studie/KANDIDATEN.json' };
  ok(wirft(function () { LS.pruefeSiegel(o); }, /SPERRE: .*fehlt/), 'Datei fehlt -> Sperre');
  fs.writeFileSync(path.join(REPO_T, 'studie', 'KANDIDATEN.json'), '{"kandidaten":[]}\n');
  ok(wirft(function () { LS.pruefeSiegel(o); }, /SPERRE: .*keinem Commit/), 'nicht committet -> Sperre');
  gitT(['add', 'studie/KANDIDATEN.json']);
  ok(wirft(function () { LS.pruefeSiegel(o); }, /SPERRE/), 'nur vorgemerkt, nicht committet -> Sperre');
  gitT(['commit', '-q', '-m', 'Siegel 2']);
  var s = null; try { s = LS.pruefeSiegel(o); } catch (e) { s = null; }
  ok(s && /^[0-9a-f]{40}$/.test(s.commit), 'committet und unveraendert -> gueltig');
  fs.writeFileSync(path.join(REPO_T, 'studie', 'KANDIDATEN.json'), '{"kandidaten":["E1/auf/V1/H1/h5/ab1000"]}\n');
  ok(wirft(function () { LS.pruefeSiegel(o); }, /SPERRE: .*veraendert/), 'nach dem Commit geaendert -> Sperre');
  gitT(['add', 'studie/KANDIDATEN.json']);
  ok(wirft(function () { LS.pruefeSiegel(o); }, /SPERRE/), 'Aenderung vorgemerkt -> Sperre');
  gitT(['commit', '-q', '-m', 'neu']);
  ok(!wirft(function () { LS.pruefeSiegel(o); }), 'neuer Commit -> wieder gueltig (Hash des letzten Commits)');
  fs.writeFileSync(path.join(REPO_T, 'studie', 'KANDIDATEN.json'), '{"kandidaten":["E1/auf/V1/H1/h5/ab1000"]} \n');
  ok(wirft(function () { LS.pruefeSiegel(o); }, /SPERRE/), 'ein Leerzeichen mehr -> Sperre');
  gitT(['commit', '-q', '-am', 'Leerzeichen']);
})();

/* =========================================================================================
 * 3. Sperre im Lesen: ohne Siegel keine Zeile ab 2023, mit geaendertem Siegel Abbruch VOR dem Lesen
 * ========================================================================================= */
teil('Lesen');
var TAGE = kunstKalender('2016-01-04', '2026-12-31');
var P_ORDNER = path.join(TMP, 'panel-a');
(function () {
  var reihen = [{ name: 'SPY', schluss: irrfahrt(TAGE.length, 1, 0.01), referenz: true, klasse: 3 }];
  for (var s = 0; s < 6; s++) reihen.push({ name: 'K' + s, schluss: irrfahrt(TAGE.length, 10 + s), klasse: s % 4 });
  reihen[3].schluss.fill(NaN, 1800);                        /* eine Reihe endet 2022 */
  reihen[3].ende_grund = 'uebernahme';
  kunstPanel(P_ORDNER, TAGE, reihen, TAGE.length - 10);
  var i23 = TAGE.findIndex(function (t) { return t >= '2023-01-01'; });
  var T = LS.oeffne({ aus: P_ORDNER, kennung: 'kunst/nachzuegler', schluss: null });
  var max = 0; for (var i = 0; i < T.g.n; i++) if (T.g.tag[i] > max) max = T.g.tag[i];
  ok(T.gesperrt && max < i23 && T.maxTag === i23 - 1, 'gesperrt: letzter Tag ' + TAGE[max] + ', maxTag vor 2023');
  ok(T.jahreGelesen.every(function (j) { return j < 2023; }) && T.jahreGelesen.length === 7, 'gesperrt: nur die Bloecke 2016-2022 gelesen');
  var v = LS.gegenPruefstand(P_ORDNER, 'kunst/nachzuegler', T);
  ok(v.abweichungen === 0 && v.zeilen < v.zeilenPruefstand, 'gesperrte Tafel = Pruefstand-Tafel bis 2022 (' + v.zeilen + ' von ' + v.zeilenPruefstand + ' Zeilen)');
  var oG = { repo: REPO_T, pfad: 'studie/KANDIDATEN.json' };
  fs.writeFileSync(path.join(REPO_T, 'studie', 'KANDIDATEN.json'), '{"kandidaten":[]}\n');   /* geaendert gegen den letzten Commit */
  ok(wirft(function () { LS.oeffne({ aus: P_ORDNER, kennung: 'kunst/nachzuegler', pruefzeit: true, siegel: oG, schluss: null }); }, /SPERRE/), 'Pruefzeit mit geaendertem Siegel -> Abbruch');
  ok(wirft(function () { LS.oeffne({ aus: path.join(TMP, 'gibt-es-nicht'), kennung: 'x', pruefzeit: true, siegel: oG }); }, /SPERRE/), 'das Siegel wird VOR dem ersten Lesen geprueft');
  ok(wirft(function () { LS.oeffne({ aus: P_ORDNER, kennung: 'kunst/nachzuegler', pruefzeit: true, siegel: { repo: REPO_T, pfad: 'studie/FEHLT.json' }, schluss: null }); }, /SPERRE/), 'Pruefzeit ohne Siegel -> Abbruch');
  gitT(['commit', '-q', '-am', 'Siegel neu']);
  var T2 = LS.oeffne({ aus: P_ORDNER, kennung: 'kunst/nachzuegler', pruefzeit: true, siegel: oG, schluss: null });
  var max2 = 0; for (var i2 = 0; i2 < T2.g.n; i2++) if (T2.g.tag[i2] > max2) max2 = T2.g.tag[i2];
  ok(!T2.gesperrt && max2 >= i23 && T2.maxTag === TAGE.length - 10 && T2.siegel && T2.siegel.commit.length === 40, 'gueltiges Siegel -> Pruefzeit offen');
  var v2 = LS.gegenPruefstand(P_ORDNER, 'kunst/nachzuegler', T2);
  ok(v2.abweichungen === 0 && v2.zeilen === v2.zeilenPruefstand, 'offene Tafel = Pruefstand-Tafel, Feld fuer Feld');
  ok(LS.universum(T, 400, { klassen: [0, 1, 2, 3] }).liste.length > 0, 'Universumsfilter laeuft auf der eigenen Tafel');
})();

/* =========================================================================================
 * 4. Kein anderer Panel-Zugriff im Studienordner (Nachtrag 1 (7))
 * ========================================================================================= */
teil('Zugriff');
(function () {
  /* Muster aus Teilen gebaut, damit diese Datei sich nicht selbst meldet */
  var muster = ['panel' + 'daten', 'pruef' + 'stand.js', 'lese' + 'Block', 'lade' + 'Panel', 'voll-' + 'v2', '.b' + 'in\'', 'Tafel' + '(',
    'schreibe' + 'Block', '_st' + 'and.json', 'kunst' + 'panel.js'];
  var dateien = fs.readdirSync(KN.HIER).filter(function (f) { return /\.js$/.test(f) && f !== 'lesen.js'; });
  ok(dateien.indexOf('test.js') !== -1 && dateien.length >= 2, 'Dateien gefunden: ' + dateien.join(', '));
  dateien.forEach(function (f) {
    var s = fs.readFileSync(path.join(KN.HIER, f), 'utf8');
    muster.forEach(function (m) { ok(s.indexOf(m) === -1, f + ' enthaelt keinen Panel-Zugriff "' + m + '"'); });
  });
  var lesen = fs.readFileSync(path.join(KN.HIER, 'lesen.js'), 'utf8');
  ok(lesen.indexOf('lese' + 'Block') !== -1, 'Gegenprobe: das Muster findet den Zugriff in lesen.js');
})();

/* ---------- weitere Abschnitte (Regelzeilen) haengen sich hier an ---------- */
var weitere = path.join(KN.HIER, 'test-regel.js');
if (fs.existsSync(weitere)) require(weitere).lauf({ ok: ok, nah: nah, wirft: wirft, teil: teil, TMP: TMP, kunstKalender: kunstKalender, kunstPanel: kunstPanel, irrfahrt: irrfahrt, zufall: zufall, gitT: gitT, REPO_T: REPO_T });
ende();
function ende() {
  try { fs.rmSync(TMP, { recursive: true, force: true }); } catch (e) { /* Wegwerf-Ordner */ }
  console.log('Nachzuegler-Pruefungen: ' + gut + ' gruen, ' + schlecht + ' rot');
  process.exitCode = schlecht ? 1 : 0;
}
