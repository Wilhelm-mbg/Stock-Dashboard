'use strict';
/* Machbarkeit Nachrichten-Stimmung (19.09.2026): Aufloesungsvorpruefung OHNE Stimmung.
 *
 * Frage (Auftrag §3): Welche Auflösung (MDE80 in Pp je Monat) hat eine monatliche Querschnittsmessung
 * "Dezil gegen Universum" auf dem Panel v2.1, Klassen 1-3 GETRENNT, Haltedauer 21 Handelstage?
 * Ohne die Stimmung zu kennen: die Paar-Standardabweichung eines ZUFALLS-Dezils gegen das Universum
 * (und daneben Zufalls-Dezil oben gegen unten sowie Zufallshälften, wie VORREGISTRIERUNG-TEIL4 §T4.8).
 * Dazu die App-Liste (17 Symbole aus dem Nachrichten-Archiv) als eigenes "Universum" für §1.4.
 *
 * NUR LESEN am Panel (Tafel('voll'), Kennung panel/v2). Kein Modell, keine Schlagzeile, keine Stimmung.
 * Alles Simulation mit virtuellem Kapital, keine Anlageberatung.
 *
 * Aufruf (aus der Repo-Wurzel, 4-GB-Heap-Grenze beachten):
 *   node --max-old-space-size=6144 studien/nachrichten-stimmung-machbarkeit-2026-09-19/mde-vorpruefung.js
 * Schreibt mde-vorpruefung.json und universum-je-jahr.json in den Studienordner.
 */
var fs = require('fs'), path = require('path');
var Q = path.join(__dirname, '..', 'querschnitt-pruefstand-2026-09-13');
var PR = require(path.join(Q, 'pruefstand.js')), K = require(path.join(Q, 'konfig.js')), ST = require(path.join(Q, 'statistik.js'));

var H = 21, ZIEHUNGEN = 5, SAAT = 'nachrichten-machbarkeit-2026-09-19', KL = [1, 2, 3], MIN_N = 20;
/* Die 17 Symbole des App-Archivs (Kopie vom 19.09.2026 09:32, newsarchiv_<SYM>.json). */
var APP_SYMS = ['AAPL', 'AMD', 'AMZN', 'ARM', 'ASML', 'AVGO', 'GOOG', 'GOOGL', 'INTC', 'META', 'MSFT', 'MU', 'NVDA', 'QCOM', 'TSLA', 'TSM', 'XOM'];
var APP_SET = {}; APP_SYMS.forEach(function (s) { APP_SET[s] = true; });

function sag(s) { process.stdout.write(s + '\n'); }
function periodenEnde(T, a, n) { var k = 0; for (var d = a + 1; d <= T.maxTag; d++) { if (T.tagVon[d] < 0) continue; k++; if (k === n) return d; } return null; }
function mischen(arr, rnd) { for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)); var x = arr[i]; arr[i] = arr[j]; arr[j] = x; } return arr; }
function monatsIndex(iso) { return +iso.slice(0, 4) * 12 + (+iso.slice(5, 7) - 1); }
function sd(xs) { var n = xs.length; if (n < 2) return null; var m = 0; xs.forEach(function (x) { m += x; }); m /= n; var q = 0; xs.forEach(function (x) { q += (x - m) * (x - m); }); return Math.sqrt(q / (n - 1)); }
function mittel(xs) { var m = 0; xs.forEach(function (x) { m += x; }); return xs.length ? m / xs.length : null; }

var t0 = Date.now();
var T = PR.Tafel(path.join(Q, 'voll'));   /* ladePanel löst gegen das Arbeitsverzeichnis auf */
sag('Tafel geladen: ' + T.g.n + ' Zeilen, ' + T.nSym + ' Reihen, Kennung ' + T.stand.kennung + ', ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
var totalverlust = {}; K.EMPFINDLICHKEIT[0].totalverlust.forEach(function (g) { totalverlust[g] = true; });
var S = PR.signaltage(T, 'monat');
sag('Monats-Signaltage: ' + S.length + ' (' + T.kal.tage[S[0]] + ' .. ' + T.kal.tage[S[S.length - 1]] + ')');

var reihen = { 1: [], 2: [], 3: [], app: [] }, uniJeJahr = {}, verworfenSumme = null;
var appImPanel = APP_SYMS.filter(function (s) { return T.symIdx[s] !== undefined; });
sag('App-Symbole im Panel: ' + appImPanel.length + ' von ' + APP_SYMS.length + (appImPanel.length < APP_SYMS.length ? ' (fehlen: ' + APP_SYMS.filter(function (s) { return T.symIdx[s] === undefined; }).join(' ') + ')' : ''));

S.forEach(function (t) {
  var u = PR.universum(T, t, { klassen: KL });
  if (!u.liste.length) return;
  var a = u.aTag, aE = periodenEnde(T, a, H), iso = T.kal.tage[t], mIdx = monatsIndex(iso);
  var byK = { 1: [], 2: [], 3: [] }; u.liste.forEach(function (e) { byK[e.klasse].push(e); });
  var jahr = iso.slice(0, 4);
  if (!uniJeJahr[jahr]) { uniJeJahr[jahr] = { tag: iso }; KL.forEach(function (k) { uniJeJahr[jahr][k] = byK[k].map(function (e) { return T.symName[e.sym]; }).sort(); }); }
  if (aE === null) return;                                   /* letzter Monat ohne volle 21 Tage */
  var appList = u.liste.filter(function (e) { return APP_SET[T.symName[e.sym]]; });
  function korb(L) { var z = { tote: 0, toteTotalverlust: 0, luecken: 0 }; return PR.halte(T, L, a, aE, totalverlust, z).periode; }
  ['1', '2', '3', 'app'].forEach(function (k) {
    var L = k === 'app' ? appList : byK[k];
    if (L.length < MIN_N && k !== 'app') { reihen[k].push({ iso: iso, mIdx: mIdx, n: L.length, duenn: true }); return; }
    if (k === 'app' && L.length < 4) { reihen[k].push({ iso: iso, mIdx: mIdx, n: L.length, duenn: true }); return; }
    var uni = korb(L), d = Math.max(2, Math.round(L.length / 10)), dez = [], ls = [], hal = [];
    for (var j = 0; j < ZIEHUNGEN; j++) {
      var perm = mischen(L.slice(), ST.mulberry32(ST.fnv(SAAT + '|' + k + '|' + iso + '|' + j)));
      var h = perm.length >> 1;
      var rTop = korb(perm.slice(0, d)), rBot = korb(perm.slice(perm.length - d));
      dez.push(rTop - uni); ls.push(rTop - rBot);
      hal.push(korb(perm.slice(0, h)) - korb(perm.slice(h)));
    }
    reihen[k].push({ iso: iso, mIdx: mIdx, n: L.length, d: d, uni: uni, dezil: dez, ls: ls, halbe: hal });
  });
});

/* ---------- Zusammenfassung: sd je Ziehung, Mittel über Ziehungen; MDE80 = 2,8016 · sd/√n je Fenster ---------- */
var FENSTER = [];
for (var y = 2017; y <= 2024; y++) FENSTER.push({ von: y, bis: 2023 }, { von: y, bis: 2026 });
function fasse(k, feld, von, bis) {
  var P = reihen[k].filter(function (p) { return !p.duenn && +p.iso.slice(0, 4) >= von && +p.iso.slice(0, 4) <= bis; });
  if (P.length < 6) return { n: P.length, duenn: true };
  var sds = [], mws = [], seHH = [];
  for (var j = 0; j < ZIEHUNGEN; j++) {
    var xs = P.map(function (p) { return p[feld][j]; });
    sds.push(sd(xs)); mws.push(mittel(xs));
    var m = ST.momente(P.map(function (p) { return { t: p.mIdx, x: p[feld][j] }; }), 1);
    seHH.push(m.se);
  }
  var sdM = mittel(sds), se = mittel(seHH);
  return { n: P.length, sd: sdM, sdMin: Math.min.apply(null, sds), sdMax: Math.max.apply(null, sds), mittel: mittel(mws),
    se: se, mde80: K.MDE_FAKTOR * se, mde80Formel: K.MDE_FAKTOR * sdM / Math.sqrt(P.length),
    monateFuer2Pp: Math.ceil(Math.pow(K.MDE_FAKTOR * sdM / 2, 2)), monateFuer1Pp: Math.ceil(Math.pow(K.MDE_FAKTOR * sdM / 1, 2)),
    nMittel: mittel(P.map(function (p) { return p.n; })), dMittel: mittel(P.map(function (p) { return p.d; })) };
}
var zusammenfassung = {};
['1', '2', '3', 'app'].forEach(function (k) {
  zusammenfassung[k] = { monate: reihen[k].length, duenn: reihen[k].filter(function (p) { return p.duenn; }).length, fenster: {} };
  FENSTER.forEach(function (F) {
    var key = F.von + '-' + F.bis;
    zusammenfassung[k].fenster[key] = { dezil: fasse(k, 'dezil', F.von, F.bis), ls: fasse(k, 'ls', F.von, F.bis), halbe: fasse(k, 'halbe', F.von, F.bis) };
  });
  var jeJahr = {};
  reihen[k].filter(function (p) { return !p.duenn; }).forEach(function (p) { var j = p.iso.slice(0, 4); (jeJahr[j] = jeJahr[j] || []).push(p); });
  zusammenfassung[k].jeJahr = {};
  Object.keys(jeJahr).forEach(function (j) { zusammenfassung[k].jeJahr[j] = { monate: jeJahr[j].length, nMittel: mittel(jeJahr[j].map(function (p) { return p.n; })), sdDezil: sd(jeJahr[j].map(function (p) { return p.dezil[0]; })) }; });
});

/* ---------- AAON-Prüfung: Klasse 1 am 03.08.2026 und alphabetische Nachbarn ---------- */
var tAaon = T.kal.tage.indexOf('2026-08-03'), aaon = null;
if (tAaon >= 0) {
  var u1 = PR.universum(T, tAaon, { klassen: [1] }), namen1 = u1.liste.map(function (e) { return T.symName[e.sym]; }).sort();
  var idx = namen1.indexOf('AAON');
  aaon = { tag: '2026-08-03', klasse1: namen1.length, aaonDrin: idx >= 0, naechste: namen1.filter(function (s) { return s >= 'AAON'; }).slice(0, 8) };
}

var aus = { kennung: 'nachrichten-stimmung-machbarkeit-2026-09-19/mde-vorpruefung/v1', panel: T.stand.kennung, panelStand: T.stand.stand,
  stand: new Date().toISOString(), haltedauer: H, ziehungen: ZIEHUNGEN, saat: SAAT, klassen: KL, mdeFaktor: K.MDE_FAKTOR, lagHH: 1,
  appSymbole: APP_SYMS, appImPanel: appImPanel, signaltage: S.length, aaon: aaon, zusammenfassung: zusammenfassung, reihen: reihen,
  dauerS: (Date.now() - t0) / 1000 };
fs.writeFileSync(path.join(__dirname, 'mde-vorpruefung.json'), JSON.stringify(aus, null, 1));
fs.writeFileSync(path.join(__dirname, 'universum-je-jahr.json'), JSON.stringify({ kennung: aus.kennung, panel: T.stand.kennung, hinweis: 'Universum (Klassen 1/2/3, Prüfstand-Filter) am ersten Monats-Signaltag je Jahr', jahre: uniJeJahr }));

function f2(x) { return x == null ? '-' : x.toFixed(2); }
sag('\nKlasse | Fenster | Monate | n/Monat | Dezil-sd | MDE80 Dezil | MDE80 L-S | MDE80 Hälften | Monate für 2 Pp (Dezil)');
['1', '2', '3', 'app'].forEach(function (k) {
  ['2017-2023', '2017-2026', '2020-2026', '2023-2026'].forEach(function (key) {
    var z = zusammenfassung[k].fenster[key]; if (!z || z.dezil.duenn) { sag(k + ' | ' + key + ' | dünn'); return; }
    sag(k + ' | ' + key + ' | ' + z.dezil.n + ' | ' + f2(z.dezil.nMittel) + ' | ' + f2(z.dezil.sd) + ' | ' + f2(z.dezil.mde80) + ' | ' + f2(z.ls.mde80) + ' | ' + f2(z.halbe.mde80) + ' | ' + z.dezil.monateFuer2Pp);
  });
});
sag('AAON: ' + JSON.stringify(aaon));
sag('Dauer ' + aus.dauerS.toFixed(0) + ' s');
