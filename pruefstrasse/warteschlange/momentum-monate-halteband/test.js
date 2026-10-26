'use strict';
/* Tests des Kandidaten momentum-monate-halteband (FORM.md §4, Form korb): Kunstdaten je Regelzeile (Rang 12-1, Luecke, Universum, Band, Placebo),
 * Randfaelle, Gegenprobe "Zeilen nach nowMs veraendern das Ziel nicht", Live = Messung (Zahlen gegen mfhandel.js buchKonfig und konfig.js KORB) und
 * ein Lauf durch den echten Korb-Adapter auf der Kunsttafel (Korb 100, anzahl 20, Band 40, Kostenregel, Kapital 10.000).
 *   node pruefstrasse/warteschlange/momentum-monate-halteband/test.js   -> Rueckgabewert 0 = gruen
 * Keine Panel-Daten, keine Renditen. Simulation mit virtuellem Kapital, keine Anlageberatung. */
var path = require('path');
var fs = require('fs');
var R = require('./regel.js');
var KAND = JSON.parse(fs.readFileSync(path.join(__dirname, 'kandidat.json'), 'utf8'));
var REPO = path.join(__dirname, '..', '..', '..');
var MH = require(path.join(REPO, 'mfhandel.js'));
var fails = 0, n = 0;
function ok(c, name, extra) { n++; console.log((c ? '  ok   ' : '  ROT  ') + name + (extra !== undefined ? '  [' + extra + ']' : '')); if (!c) fails++; }
function probe(name, fn) { var r; try { r = fn(); } catch (e) { ok(false, name, 'Ausnahme: ' + String(e && e.message || e).slice(0, 240)); return; } ok(!!r[0], name, r[1]); }
function gleich(a, b) { return JSON.stringify(a) === JSON.stringify(b); }

/* ---------- Kunstdaten: N Zeilen je Wert (Tage in ms), Stichtag = letzte Zeile. Staerke 12-1 = Kurs(i-21) / Kurs(i-252) - 1 ---------- */
var TAG = 86400000, T0 = Date.UTC(2025, 0, 2), N = 300, I = N - 1, NOW = T0 + I * TAG;
var O = { nowMs: NOW, anzahl: 20, halteBand: 40 };
/** Reihe mit Staerke st: flach 100 bis zum Fensterstart (Zeile I-252), linear auf 100 (1 + st) bis Zeile I-21, danach "Rauschen" (zaehlt nicht). */
function reihe(st, opt) {
  opt = opt || {};
  var r = [], n0 = opt.n || N, off = N - n0, stueck = opt.stueck == null ? 4e6 : opt.stueck;
  for (var j = off; j < N; j++) {
    var p = j <= I - 252 ? 100 : j <= I - 21 ? 100 * (1 + st * (j - (I - 252)) / 231) : 100 * (1 + st) * (1 + 0.03 * Math.sin(j * 1.7));
    r.push([T0 + j * TAG, p, typeof stueck === 'function' ? stueck(j) : stueck]);
  }
  return r;
}
/** k Werte W0..W(k-1) mit Staerken aus einer festen Permutation (paarweise verschieden). */
function welt(k, extra) {
  var roh = {}, st = {};
  for (var w = 0; w < k; w++) { var s = ((w * 37) % k - k / 2) / k; st['W' + w] = s; roh['W' + w] = reihe(s); }
  if (extra) Object.keys(extra).forEach(function (s) { roh[s] = extra[s]; });
  return { roh: roh, st: st };
}
/** Umsatz je Zeile genau `d` Dollar (Stueck = d / Kurs) - fuer die Schwelle 100 Mio $. */
function dollar(r, d) { r.forEach(function (z) { z[2] = d / z[1]; }); return r; }
function erwarteteFolge(st, nur) { return Object.keys(st).filter(function (s) { return !nur || nur.indexOf(s) >= 0; }).sort(function (a, b) { return st[b] - st[a]; }); }

console.log('momentum-monate-halteband: Regel, Randfaelle, kein Blick nach vorn, Live = Messung, Lauf durch den Adapter');

/* 1. Regelzeile Rang (12-1): die Rangliste ist die Staerke absteigend, Laenge halteBand 40, Zielzahl 20 im Feld anzahl */
probe('1 Rang: 120 Werte -> Rangliste = die 40 staerksten nach Kurs(i-21)/Kurs(i-252) absteigend, anzahl 20; die Regel feuert', function () {
  var W = welt(120), r = R.zielfunktion(W.roh, O), soll = erwarteteFolge(W.st).slice(0, 40);
  return [!r.zuWenig && r.ziel.length === 40 && r.anzahl === 20 && gleich(r.ziel, soll) && r.korb.zulaessig === 120, 'erster ' + r.ziel[0] + ', Laenge ' + r.ziel.length + ', anzahl ' + r.anzahl];
});
/* 2. Luecke: der letzte Monat (Zeilen i-20..i) zaehlt nicht; Fensterende i-21 und Fensterstart i-252 zaehlen (Positivkontrolle), Zeile davor nicht */
probe('2 Luecke 21: Zeilen i-20..i veraendern -> Rangliste gleich; Zeile i-21 oder i-252 veraendern -> Rang aendert sich; Zeile i-253 -> gleich', function () {
  var W = welt(120), basis = R.zielfunktion(W.roh, O).ziel, schwach = basis[39];
  function mit(zeile, faktor) { var roh = JSON.parse(JSON.stringify(W.roh)); roh[schwach][zeile][1] *= faktor; return R.zielfunktion(roh, O).ziel; }
  var m1 = mit(I, 3), m20 = mit(I - 20, 3), e21 = mit(I - 21, 3), s252 = mit(I - 252, 0.3), v253 = mit(I - 253, 0.3);
  return [gleich(m1, basis) && gleich(m20, basis) && !gleich(e21, basis) && e21[0] === schwach && !gleich(s252, basis) && gleich(v253, basis), 'i-21 x3 -> Platz 1: ' + (e21[0] === schwach)];
});
/* 3. Universum-Filter (App-Regel): Mindestumsatz 100 Mio $ (Median 20 Balken), Mindestlaenge 253 Zeilen, Alter <= 7 Tage, Kurs am Fenster > 0 */
probe('3 Zulaessigkeit: Umsatz 99 Mio $ raus, 100 Mio $ drin; 252 Zeilen raus, 253 drin; letzte Zeile 8 Tage alt raus; Kurs 0 am Fensterstart raus', function () {
  var ex = { U99: dollar(reihe(0.9), 99e6), U100: dollar(reihe(0.85), 1.0000001e8), L252: reihe(0.95, { n: 252 }), L253: reihe(0.8, { n: 253 }),
    ALT: reihe(0.99).slice(0, N - 8), NULL: reihe(0.97) };
  ex.NULL[I - 252][1] = 0;
  var W = welt(110, ex), r = R.zielfunktion(W.roh, O), grund = {};
  r.verworfen.forEach(function (v) { grund[v.sym] = v.grund; });
  var drin = function (s) { return r.rangfolge.some(function (p) { return p.sym === s; }); };
  return [!drin('U99') && /unter 100 Mio/.test(grund.U99) && drin('U100') && !drin('L252') && /zu kurze Kursreihe/.test(grund.L252) && drin('L253') && !drin('ALT') && /veraltet/.test(grund.ALT) && !drin('NULL') && /nicht berechenbar/.test(grund.NULL),
    'verworfen: ' + Object.keys(grund).sort().join(', ')];
});
/* 4. Gegenprobe "kein Blick nach vorn" (FORM.md §4 korb): Zeilen nach nowMs veraendern das Ziel nicht - auch nicht ein Wert, der erst danach beginnt */
probe('4 kein Blick nach vorn: 40 Zeilen nach nowMs (Kurse x0,1..x10, Umsatz x1000) und ein Wert, der erst danach beginnt -> Ziel, Rangfolge, Korb unveraendert (Kandidat und Placebo); ohne Schnitt saehe momentumZiel die Zukunft', function () {
  var W = welt(120), basis = R.zielfunktion(W.roh, O), basisP = R.placeboZiel(W.roh, Object.assign({ placeboWort: 'vorn#1' }, O));
  var zuk = JSON.parse(JSON.stringify(W.roh));
  Object.keys(zuk).forEach(function (s, k) { var r = zuk[s], p = r[r.length - 1][1]; for (var j = 1; j <= 40; j++) r.push([NOW + j * TAG, p * (k % 2 ? 10 : 0.1), 2e9]); });
  zuk.NEU = []; for (var j = 1; j <= 300; j++) zuk.NEU.push([NOW + j * TAG, 50 + j, 9e9]);
  var mit = R.zielfunktion(zuk, O), mitP = R.placeboZiel(zuk, Object.assign({ placeboWort: 'vorn#1' }, O));
  var ohneSchnitt = MH.momentumZiel(zuk, R.zielOpts(O));
  return [gleich(mit, basis) && gleich(mitP, basisP) && !gleich(ohneSchnitt.ziel, basis.ziel), 'mit Schnitt gleich; ohne Schnitt anderes Ziel: ' + !gleich(ohneSchnitt.ziel, basis.ziel)];
});
/* 5. Halte-Band (Auswahl mit dem Bestand in der Huelle: mfhandel.js zielMitBand mit der Rangliste dieser Regel) */
probe('5 Band 40: gehalten auf Platz 35 bleibt, Platz 45 und ein Wert ausserhalb des Universums gehen, aufgefuellt in Rangfolge bis 20; Bestand auf Platz 21..40 bleibt ganz (0 Tausch), ohne Band 20 Tausch', function () {
  var W = welt(120), r = R.zielfunktion(W.roh, O), voll = erwarteteFolge(W.st), p35 = voll[34], p45 = voll[44];
  var z = MH.zielMitBand(r.ziel, { positionen: [{ sym: p35 }, { sym: p45 }, { sym: 'FREMD' }] }, { anzahl: 20, halteBand: 40 });
  var soll = [p35].concat(voll.slice(0, 19));
  var mitte = voll.slice(20, 40), zM = MH.zielMitBand(r.ziel, { positionen: mitte.map(function (s) { return { sym: s }; }) }, { anzahl: 20, halteBand: 40 });
  var ohne = r.ziel.slice(0, 20).filter(function (s) { return mitte.indexOf(s) === -1; }).length;
  return [gleich(z, soll) && z.indexOf(p45) === -1 && z.indexOf('FREMD') === -1 && gleich(zM.slice().sort(), mitte.slice().sort()) && ohne === 20, 'Platz 35 bleibt, 45 geht; Band-Tausch 0, ohne Band ' + ohne];
});
/* 6. Placebo: gleiches Universum (rangfolge/korb identisch), Zufallsrang deterministisch je Wort und Stichtag, staerkefrei, Laenge 40 */
probe('6 Placebo: gleiche rangfolge und korb wie der Kandidat, 40 Werte aus den zulaessigen, gleiches Wort = gleiche Liste, anderes Wort/anderer Stichtag = andere, unabhaengig von der Staerke', function () {
  var W = welt(120), k = R.zielfunktion(W.roh, O), a = R.placeboZiel(W.roh, Object.assign({ placeboWort: 'w#1' }, O)), a2 = R.placeboZiel(W.roh, Object.assign({ placeboWort: 'w#1' }, O));
  var b = R.placeboZiel(W.roh, Object.assign({ placeboWort: 'w#2' }, O));
  var frueher = {}; Object.keys(W.roh).forEach(function (s) { frueher[s] = W.roh[s].slice(0, N - 1); });
  var c = R.placeboZiel(frueher, Object.assign({ placeboWort: 'w#1' }, O, { nowMs: NOW - TAG }));
  var umgedreht = {}; Object.keys(W.roh).forEach(function (s) { umgedreht[s] = reihe(-W.st[s]); });
  var d = R.placeboZiel(umgedreht, Object.assign({ placeboWort: 'w#1' }, O));
  var zul = {}; k.rangfolge.forEach(function (p) { zul[p.sym] = true; });
  return [a.placebo === true && a.ziel.length === 40 && a.ziel.every(function (s) { return zul[s]; }) && gleich(a.rangfolge, k.rangfolge) && gleich(a.korb, k.korb) && gleich(a.ziel, a2.ziel) && !gleich(a.ziel, b.ziel) && !gleich(a.ziel, c.ziel) && gleich(d.ziel, a.ziel) && !gleich(a.ziel, k.ziel),
    'Ueberschneidung mit dem Kandidaten ' + a.ziel.filter(function (s) { return k.ziel.indexOf(s) >= 0; }).length + ' von 40'];
});
/* 7. Klinken: ohne Band/Zielzahl vom Adapter oder ohne Stichtag/Wort kein Lauf */
probe('7 Klinken: ohne halteBand, mit anzahl 10, ohne nowMs, Placebo ohne placeboWort -> lauter Abbruch', function () {
  var W = welt(120), f = 0;
  [function () { R.zielfunktion(W.roh, { nowMs: NOW, anzahl: 20 }); }, function () { R.zielfunktion(W.roh, { nowMs: NOW, anzahl: 10, halteBand: 40 }); },
    function () { R.zielfunktion(W.roh, { anzahl: 20, halteBand: 40 }); }, function () { R.placeboZiel(W.roh, O); },
    function () { R.placeboZiel(W.roh, { nowMs: NOW, placeboWort: 'x' }); }].forEach(function (g) { try { g(); } catch (e) { if (/KLINKE/.test(e.message)) f++; } });
  return [f === 5, f + ' von 5 Abbruechen'];
});
/* 8. Randfaelle: leere Eingabe, 99 / 100 zulaessige (mindestWerte 100 = korb 100), fehlende Stueckzahlen, leere Reihe */
probe('8 Randfaelle: leer -> zuWenig; 99 zulaessige -> zuWenig (kein Ziel); genau 100 -> 40 Plaetze; Reihe ohne Stueckzahlen und leere Reihe -> verworfen', function () {
  var leer = R.zielfunktion({}, O), w99 = R.zielfunktion(welt(99).roh, O), w100 = R.zielfunktion(welt(100).roh, O);
  var ohneSt = R.zielfunktion(welt(100, { OHNE: reihe(0.5, { stueck: function () { return undefined; } }), LEER: [] }).roh, O), g = {};
  ohneSt.verworfen.forEach(function (v) { g[v.sym] = v.grund; });
  return [leer.zuWenig === true && leer.ziel.length === 0 && w99.zuWenig === true && w99.ziel.length === 0 && !w100.zuWenig && w100.ziel.length === 40 && /keine St/.test(g.OHNE) && /zu kurze/.test(g.LEER),
    '99 -> zuWenig, 100 -> ' + w100.ziel.length];
});
/* 9. Live = Messung: die Zielfunktion ist momentumZiel der App mit denselben Zahlen; params = buchKonfig; Adapterwerte = konfig.js KORB */
probe('9 Live = Messung: Zielfunktion = mfhandel.js momentumZiel mit App-Vorgaben (zeichengleich); params = buchKonfig (231/21/100 Mio/20/100, minZeilen 253, Regel K 0,05); Adapter = konfig.js KORB (63, 63 Phasen, 2017-01-04, Kostenregel, 10.000, Nasdaq-100 nach Steuer)', function () {
  var W = welt(130), app = MH.momentumZiel(W.roh, { nowMs: NOW, anzahl: 20, halteBand: 40 }), wir = R.zielfunktion(W.roh, O), BK = MH.buchKonfig(), P = KAND.params, A = P.adapter;
  var K = require(path.join(REPO, 'pruefstrasse', 'konfig.js')), KB = K.KORB;
  var zahlen = P.rueckblick === BK.rueckblick && P.luecke === BK.luecke && P.umsatzMin === BK.umsatzMin && P.umsatzFenster === BK.umsatzFenster && P.mindestWerte === BK.mindestWerte &&
    P.minZeilen === BK.rueckblick + BK.luecke + 1 && A.kleinstAnteil === BK.kleinstAnteil && A.kleinstAnteil === KB.kleinstAnteil && A.taktHandelstage === KB.periodeTage && A.taktHandelstage === BK.halten &&
    A.startphasen === KB.phasen && A.entdeckungVon === KB.entdeckungVon && A.kostenRegel === KB.kostenRegel && A.kapitalUsd === KB.kapitalUsd && A.massstab === KB.massstab && A.massstab === BK.massstab;
  return [gleich(app, wir) && zahlen, 'zeichengleich ' + gleich(app, wir) + ', Zahlen ' + zahlen];
});
/* 10. Steckbrief: genau eine Konfiguration (korb), anzahl 20, korb 100, Band 40 = 2 x Zielzahl, Erwartung vollstaendig */
probe('10 kandidat.json: form korb, eine Konfiguration M12-1-H40-T63 (anzahl 20, korb 100), params.halteBand 40, erwartung groesse/richtung/nettoPp 1,2/bruttoPp 2,5', function () {
  var k = KAND.konfigurationen, e = KAND.erwartung;
  return [KAND.form === 'korb' && k.length === 1 && k[0].key === 'M12-1-H40-T63' && k[0].anzahl === 20 && k[0].korb === 100 && KAND.params.halteBand === 40 && KAND.params.halteBand === 2 * k[0].anzahl &&
    typeof e.groesse === 'string' && e.groesse.length > 20 && e.richtung === 'positiv' && e.nettoPp === 1.2 && e.bruttoPp === 2.5 && e.fensterWieQuelle === false, KAND.kennung];
});

/* 11. Lauf durch den echten Korb-Adapter (Kunsttafel 300 x 900): Korb 100 (Schritt d), Band 40 ueber mfhandel.js zielMitBand, Kostenregel, Kapital 10.000 */
var KA = null;
try { KA = require(path.join(REPO, 'pruefstrasse', 'adapter', 'korb.js')); } catch (e) { ok(false, '11 Adapter laden', String(e.message).slice(0, 200)); }
if (KA) {
  /* K0..K99 = die 100 umsatzstaerksten (Universum), K0..K9 mit Drift (staerkste), K150 mit groesster Drift, aber ausserhalb des Universums */
  var W = KA.kunstTafel({ reihen: 300, tage: 900, seed: 'kunst-125b', umsatz: function (r) { return r < 100 ? 5e9 - r * 1e6 : 2e8 + r * 1e3; },
    drift: function (r) { return r < 10 ? 0.003 : r === 150 ? 0.004 : 0; } });
  var V = KA.vorbereiten({ tafel: W.T }), F = KA.fenster(V.T, V.Q, V.T.kal.tage[260], V.T.kal.tage[V.T.maxTag]);
  var BAND = KA.KK.bandOpts(KAND), MHA = KA.MH;
  var mitOpts = function (f, extra) { return function (roh, o) { return f(roh, Object.assign({}, o, extra || {}, { anzahl: 20, halteBand: 40 })); }; };
  function lauf(ziel, band, spur) {
    var echt = MHA.zielMitBand;
    if (spur) MHA.zielMitBand = function (rl, buch, o) { spur.push({ n: rl.length, band: o.halteBand, anzahl: o.anzahl, rl: rl.slice(), danach: null }); return echt(rl, buch, o); };
    try { return KA.KK.mitBand(MHA, band, function () { return KA.KK.mitKosten(KA.KS, V, 'regel', function () { return KA.laufK0(V, F, ziel, 100, 'kunst-125b'); }, { kapitalUsd: 10000 }); }); }
    finally { MHA.zielMitBand = echt; }
  }
  probe('11a Adapter: jede Umschichtung geht durch das Band (Rangliste 40, anzahl 20, Band 40), nur Werte aus den 100 umsatzstaerksten, nie mehr als 20 Positionen; K150 (staerkste Drift, ausserhalb) nie gekauft', function () {
    var sp = [], L = lauf(mitOpts(R.zielfunktion), BAND, sp), uni = {};
    for (var r = 0; r < 100; r++) uni['K' + r] = true;
    var alleImUni = sp.every(function (x) { return x.rl.every(function (s) { return uni[s]; }); }), gekauftK150 = false;
    var pos = L.L.buch.positionen.map(function (p) { return p.sym; });
    sp.forEach(function (x) { if (x.rl.indexOf('K150') >= 0) gekauftK150 = true; });
    var drift = pos.filter(function (s) { return +s.slice(1) < 10; }).length;
    return [sp.length >= 8 && sp.length === L.L.zaehler.umschichtungen && sp.every(function (x) { return x.n === 40 && x.band === 40 && x.anzahl === 20; }) && alleImUni && !gekauftK150 && L.zaehler.positionenDanachMax <= 20 && pos.length <= 20 && drift >= 6,
      sp.length + ' Umschichtungen, Positionen max ' + L.zaehler.positionenDanachMax + ', Drift-Werte im Buch ' + drift + ' von 10'];
  });
  probe('11b Adapter: das Band senkt den Tausch (Verkaeufe mit Band 40 < ohne Band, gleiche Zielzahl 20); Placebo laeuft durch dasselbe Band', function () {
    var mit = lauf(mitOpts(R.zielfunktion), BAND, null).zaehler.verkaeufe;
    var ohne = lauf(function (roh, o) { return MHA.momentumZiel(R.schnitt(roh, o.nowMs), { nowMs: o.nowMs, anzahl: 20 }); }, null, null).zaehler.verkaeufe;
    var spP = [], LP = lauf(mitOpts(R.placeboZiel, { placeboWort: 'kunst-125b#1' }), BAND, spP);
    return [mit < ohne && spP.length >= 8 && spP.every(function (x) { return x.n === 40 && x.band === 40; }) && LP.zaehler.positionenDanachMax <= 20, 'Verkaeufe mit Band ' + mit + ', ohne Band ' + ohne + ', Placebo-Verkaeufe ' + LP.zaehler.verkaeufe];
  });
}

console.log(fails ? fails + ' von ' + n + ' Pruefungen ROT' : 'alle ' + n + ' Pruefungen gruen');
process.exit(fails ? 1 : 0);
