'use strict';
/* TEST des Daytrader-Siebs (Nr. 107) - nur Kunstkerzen, kein Archiv, kein Netz.
 * Je Setup: Hand-Fall Signal, kein Signal, Rand am Sitzungsende; dazu "kein Blick nach i" (vergiftete
 * Kerzen), Ein-/Ausstieg, Placebo-Haltedauer, Zufallsweg ohne Kante, Statistik, Zahlen gegen REGEL.md.
 *   node studien/daytrader-sieb-2026-10/test.js
 * Alles Simulation mit virtuellem Kapital. Keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var S = require('./setups.js');
var G = require('./gemeinsam.js');

var gruen = 0, rot = 0;
function ok(b, was) { if (b) gruen++; else { rot++; console.log('ROT: ' + was); } }
function nah(a, b, eps) { return Math.abs(a - b) <= (eps || 1e-9); }

var AUF = Date.UTC(2024, 0, 3, 14, 30);
/** Tag aus einer Schlusskurs-Funktion f(min); Eroeffnung = voriger Schluss (erste Kerze: o0). */
function tag(f, o0, opt) {
  opt = opt || {};
  var k = [], prev = o0, n = opt.n || 390;
  for (var mi = 0; mi < n; mi++) {
    if (opt.ohne && opt.ohne.indexOf(mi) !== -1) { prev = f(mi); continue; }
    var c = f(mi), o = prev;
    var v = opt.vol ? opt.vol(mi) : 1000;
    k.push([AUF + mi * 60000, c, v, Math.max(o, c) + 0.01, Math.min(o, c) - 0.01, o]);
    prev = c;
  }
  return k;
}
function ctx(vortag, spy) { return { auf: AUF, soll: 390, vortag: vortag || { schluss: 100, hoch: 101, tief: 99 }, spy: spy || null }; }
function setup(key) { return S.SETUPS.filter(function (s) { return s.key === key; })[0]; }
function sig(key, k, c) { return S.erstesSignal(setup(key), k, c); }

/* ---------- Hand-Faelle je Setup ---------- */
(function () {
  // Lueckenschluss: Luecke +1 %, faellt bis Minute 60 auf 99,9 -> short ab 09:31, Ausstieg Eroeffnung nach der Beruehrung
  var k = tag(function (mi) { return mi < 60 ? 101 - mi * 0.02 : 99.9; }, 101), c = ctx();
  var s = sig('lueckenschluss', k, c);
  ok(s && s.i === 0 && s.dir === -1, 'lueckenschluss: Signal short in Kerze 0');
  var h = S.handel(setup('lueckenschluss'), k, s.i, s.dir, c);
  var beruehrt = -1; for (var q = 1; q < k.length; q++) if (k[q][4] <= 100) { beruehrt = q; break; }
  ok(h.ein === k[1][5] && h.aus === k[beruehrt + 1][5] && h.mAus === beruehrt + 1, 'lueckenschluss: Ein Kerze 1, Aus Eroeffnung nach Beruehrung');
  ok(!sig('lueckenschluss', tag(function () { return 100.2; }, 100.2), c), 'lueckenschluss: Luecke 0,2 % kein Signal');
  ok(!sig('lueckenschluss', tag(function () { return 104; }, 104), c), 'lueckenschluss: Luecke 4 % kein Signal');
  var nie = tag(function () { return 101; }, 101), hn = S.handel(setup('lueckenschluss'), nie, 0, -1, c);
  ok(hn.mAus === 390 && hn.aus === nie[389][1], 'lueckenschluss: ohne Beruehrung bis Schluss');
  ok(!sig('lueckenschluss', tag(function () { return 101; }, 101, { ohne: [0] }), c), 'lueckenschluss: ohne 09:30-Kerze kein Signal');
})();
(function () {
  var c = ctx();
  var k = tag(function (mi) { return 103 + mi * 0.01; }, 103);
  var s = sig('gapAndGo', k, c);
  ok(s && s.i === 4 && s.dir === 1, 'gapAndGo: long in Kerze 09:34');
  ok(S.handel(setup('gapAndGo'), k, s.i, s.dir, c).mAus === 390, 'gapAndGo: bis Schluss');
  ok(!sig('gapAndGo', tag(function (mi) { return 103 - mi * 0.01; }, 103), c), 'gapAndGo: Luecke hoch, faellt -> kein Signal');
  ok(!sig('gapAndGo', tag(function (mi) { return 103 + mi * 0.01; }, 103, { ohne: [4] }), c), 'gapAndGo: 09:34-Kerze fehlt -> kein Signal');
  ok(!sig('gapAndGo', tag(function (mi) { return 103 + mi * 0.01; }, 103, { n: 5 }), c), 'gapAndGo: Rand - keine Folgekerze');
})();
(function () {
  var c = ctx();
  var k = tag(function (mi) { return mi < 30 ? 100.5 : 99; }, 100.2);
  var s = sig('gao', k, c);
  ok(s && s.i === 359 && s.dir === 1, 'gao: long um 15:29 (10:00 ueber Vortagesschluss)');
  var h = S.handel(setup('gao'), k, s.i, s.dir, c);
  ok(h.mEin === 360 && h.mAus === 390, 'gao: 15:30 bis Schluss');
  ok(sig('gao', tag(function (mi) { return mi < 30 ? 99.5 : 101; }, 99.8), c).dir === -1, 'gao: short bei 10:00 unter Vortag');
  ok(!sig('gao', tag(function () { return 100; }, 100), c), 'gao: unveraendert -> kein Signal');
  ok(!sig('gao', tag(function () { return 100.5; }, 100.5, { n: 360 }), c), 'gao: Rand - Tag endet 15:30, keine Folgekerze');
})();
(function () {
  var c = ctx();
  var s = sig('baltussen', tag(function (mi) { return mi < 30 ? 101 : 99.5; }, 100.5), c);
  ok(s && s.i === 359 && s.dir === -1, 'baltussen: short, 15:30 unter Vortagesschluss (Morgen egal)');
  ok(!sig('baltussen', tag(function () { return 100; }, 100), c), 'baltussen: unveraendert -> kein Signal');
  ok(!sig('baltussen', tag(function () { return 99; }, 99, { n: 360 }), c), 'baltussen: Rand');
})();
(function () {
  var c = ctx();
  var k = tag(function (mi) { return mi < 50 ? 100 : 101.2; }, 100);
  var s = sig('vortagesbruch', k, c);
  ok(s && s.i === 50 && s.dir === 1, 'vortagesbruch: long beim ersten Schluss ueber dem Vortageshoch');
  ok(!sig('vortagesbruch', tag(function () { return 101.5; }, 101.5), c), 'vortagesbruch: Eroeffnung schon darueber -> kein Long');
  ok(!sig('vortagesbruch', tag(function (mi) { return mi < 340 ? 100 : 101.2; }, 100), c), 'vortagesbruch: Bruch nach 15:00 -> kein Signal');
  ok(sig('vortagesbruch', tag(function (mi) { return mi < 80 ? 100 : 98.8; }, 100), c).dir === -1, 'vortagesbruch: short unter dem Vortagestief');
})();
(function () {
  var c = ctx();
  var f = function (mi) { return mi === 100 ? 100.5 : mi > 100 ? 100.5 : 100; };
  var k = tag(f, 100, { vol: function (mi) { return mi === 100 ? 6000 : 1000; } });
  var s = sig('volumenspitze', k, c);
  ok(s && s.i === 100 && s.dir === 1, 'volumenspitze: long bei 6x Volumen und Schluss ueber dem 20-Minuten-Hoch');
  var h = S.handel(setup('volumenspitze'), k, s.i, s.dir, c);
  ok(h.mEin === 101 && h.mAus === 131, 'volumenspitze: 30 Minuten Haltedauer');
  ok(!sig('volumenspitze', tag(f, 100, { vol: function (mi) { return mi === 100 ? 4000 : 1000; } }), c), 'volumenspitze: 4x -> kein Signal');
  ok(!sig('volumenspitze', tag(function (mi) { return mi >= 340 ? 100.5 : 100; }, 100, { vol: function (mi) { return mi === 340 ? 9000 : 1000; } }), c), 'volumenspitze: nach 15:00 -> kein Signal');
})();
(function () {
  var c = ctx();
  var k = tag(function (mi) { return 100 + mi * 0.01; }, 100);
  var s = sig('mittagsumkehr', k, c);
  ok(s && s.i === 149 && s.dir === -1, 'mittagsumkehr: +1,49 % bis 12:00 -> short');
  var h = S.handel(setup('mittagsumkehr'), k, s.i, s.dir, c);
  ok(h.mEin === 150 && h.mAus === 270, 'mittagsumkehr: 120 Minuten');
  ok(!sig('mittagsumkehr', tag(function (mi) { return 100 + mi * 0.002; }, 100), c), 'mittagsumkehr: +0,3 % -> kein Signal');
  ok(!sig('mittagsumkehr', tag(function (mi) { return 100 + mi * 0.01; }, 100, { n: 150 }), c), 'mittagsumkehr: Rand');
})();
(function () {
  var spy = tag(function () { return 400; }, 400);
  var c = ctx(null, spy);
  var k = tag(function (mi) { return 100 + mi * 0.025; }, 100);
  var s = sig('spyStaerke', k, c);
  ok(s && s.i === 59 && s.dir === 1, 'spyStaerke: +1,5 Pp gegen SPY um 10:29 -> long');
  ok(!sig('spyStaerke', k, ctx(null, tag(function (mi) { return 400 + mi * 0.1; }, 400))), 'spyStaerke: SPY steigt mit -> kein Signal');
  ok(!sig('spyStaerke', k, ctx(null, null)), 'spyStaerke: ohne SPY kein Signal');
  ok(!sig('spyStaerke', tag(function (mi) { return 100 + mi * 0.025; }, 100, { n: 60 }), c), 'spyStaerke: Rand');
})();
(function () {
  var c = ctx();
  var k = tag(function (mi) { return 100 - mi * 0.04; }, 100);
  var s = sig('zehnUhrUmkehr', k, c);
  ok(s && s.i === 29 && s.dir === 1, 'zehnUhrUmkehr: -1,16 % bis 10:00 -> long');
  ok(S.handel(setup('zehnUhrUmkehr'), k, s.i, s.dir, c).mAus === 90, 'zehnUhrUmkehr: 60 Minuten');
  ok(!sig('zehnUhrUmkehr', tag(function (mi) { return 100 - mi * 0.01; }, 100), c), 'zehnUhrUmkehr: -0,29 % -> kein Signal');
  ok(!sig('zehnUhrUmkehr', tag(function (mi) { return 100 - mi * 0.04; }, 100, { n: 30 }), c), 'zehnUhrUmkehr: Rand');
})();
ok(S.SETUPS.length >= 8 && S.SETUPS.length <= 12, 'Setups: 8-12');

/* ---------- Kein Blick nach i: vergiftete Kerzen (Proxy wirft) und NaN-Zukunft fuer SPY ---------- */
function zufallsTag(z, o0) {
  var p = o0, ks = [];
  for (var mi = 0; mi < 390; mi++) {
    var o = p, c = o * (1 + (z() - 0.5) * 0.004);
    var v = z() < 0.01 ? 8000 : 800 + Math.floor(z() * 400);
    ks.push([AUF + mi * 60000, c, v, Math.max(o, c) * (1 + z() * 0.001), Math.min(o, c) * (1 - z() * 0.001), o]); p = c;
  }
  return ks;
}
(function () {
  var z = G.zufall(4711), fehler = 0, geprueft = 0;
  for (var d = 0; d < 40; d++) {
    var vort = { schluss: 100, hoch: 100.6, tief: 99.4 };
    var k = zufallsTag(z, 100 * (1 + (z() - 0.5) * 0.05)), spy = zufallsTag(z, 400);
    S.SETUPS.forEach(function (St) {
      for (var i = 0; i < k.length - 1; i++) {
        var voll = St.sig(k, i, { auf: AUF, soll: 390, vortag: vort, spy: spy });
        var gift = new Proxy(k, { get: function (t, p) { if (p === 'length') throw new Error('length'); var n = Number(p); if (String(n) === p && n > i) throw new Error('Blick nach i'); return t[p]; } });
        var spyGift = spy.map(function (c) { return c[0] > k[i][0] ? [c[0], NaN, NaN, NaN, NaN, NaN] : c; });
        var g;
        try { g = St.sig(gift, i, { auf: AUF, soll: 390, vortag: vort, spy: spyGift }); } catch (e) { g = 'WURF ' + e.message; }
        geprueft++;
        if (g !== voll) { fehler++; if (fehler < 4) console.log('  ' + St.key + ' i=' + i + ' voll=' + voll + ' gift=' + g); }
      }
    });
  }
  ok(fehler === 0, 'kein Blick nach i: ' + geprueft + ' Pruefungen, ' + fehler + ' Abweichungen');
  ok(geprueft > 100000, 'kein Blick nach i: genug Pruefungen');
})();

/* ---------- Ausstieg liest nur nach dem Einstieg; Placebo-Haltedauer ---------- */
(function () {
  var k = tag(function (mi) { return 100 + Math.sin(mi / 7); }, 100), c = ctx();
  var vor = S.handel(setup('mittagsumkehr'), k, 149, -1, c);
  var k2 = k.map(function (x, j) { return j <= 149 ? [x[0], x[1] * 3, x[2], x[3] * 3, x[4] * 3, x[5] * 3] : x; });
  var nach = S.handel(setup('mittagsumkehr'), k2, 149, -1, c);
  ok(nah(vor.r, nach.r), 'handel: Ertrag haengt nicht an Kerzen bis zur Signalkerze');
  // Placebo mit fester Zufallsfolge: Haltedauer H wird eingehalten
  var flat = tag(function (mi) { return 100 + mi * 0.01; }, 100);
  var seq = [0.5], zz = function () { return seq[0]; };
  var p = S.placebo(flat, 60, 1, c, zz, 1);
  var mz = 1 + Math.floor(0.5 * 330);
  ok(nah(p, (flat[mz + 60][5] - flat[mz][5]) / flat[mz][5] * 100), 'placebo: Einstieg Zufallsminute, Ausstieg nach H Minuten');
  var pS = S.placebo(flat, 389, 1, c, zz, 1);
  ok(nah(pS, (flat[389][1] - flat[1][5]) / flat[1][5] * 100), 'placebo: H bis Schluss -> Schlusskurs');
})();

/* ---------- Zufallsweg ohne Kante: Handel minus Placebo ~ 0 ---------- */
(function () {
  var z = G.zufall(99), jeS = {}, jeZ = {}, roh = {};
  for (var w = 0; w < 40; w++) {
    var tage = [];
    for (var d = 0; d < 20; d++) {
      tage.push({ k: zufallsTag(z, 100 * (1 + (z() - 0.5) * 0.05)), ctx: { auf: AUF, soll: 390, vortag: { schluss: 100, hoch: 100.6, tief: 99.4 }, spy: zufallsTag(z, 400) } });
    }
    tage.forEach(function (T, ti) {
      S.SETUPS.forEach(function (St) {
        var s = S.erstesSignal(St, T.k, T.ctx); if (!s) return;
        var h = S.handel(St, T.k, s.i, s.dir, T.ctx);
        var p = S.placeboUhrzeit(tage, ti, h.mEin, h.mAus, s.dir);
        var pz = S.placebo(T.k, h.mAus - h.mEin, s.dir, T.ctx, G.zufall(w * 1000 + ti), 50);
        (jeS[St.key] = jeS[St.key] || []).push(h.r - p);
        (jeZ[St.key] = jeZ[St.key] || []).push(h.r - pz);
        (roh[St.key] = roh[St.key] || []).push(h.r);
      });
    });
  }
  var T = require('./sieb.js').tStat, verzerrt = 0;
  Object.keys(jeS).forEach(function (key) {
    var t = T(jeS[key]), r = T(roh[key]);
    ok(t.n < 30 || Math.abs(t.t) < 4, 'Zufallsweg: ' + key + ' Handel-Placebo(Uhrzeit) t=' + (t.t == null ? '-' : t.t.toFixed(2)) + ' (n ' + t.n + ')');
    ok(r.n < 30 || Math.abs(r.t) < 4, 'Zufallsweg: ' + key + ' Handel brutto t=' + (r.t == null ? '-' : r.t.toFixed(2)));
    if (Math.abs(T(jeZ[key]).t) > 4) verzerrt++;
  });
  /* Gegenprobe: das Placebo des Auftragstexts (Zufallsminute ueber den ganzen Tag) ist auf demselben Zufallsweg
   * verzerrt - deshalb nur nachrichtlich. Wird diese Probe gruen-los, ist der Grund der Abweichung weg. */
  ok(verzerrt >= 2, 'Gegenprobe: Zufallsminuten-Placebo verzerrt bei ' + verzerrt + ' Setups (|t| > 4 ohne Kante)');
})();
(function () {
  // placeboUhrzeit: Mittel ueber die anderen Tage, gleiche Minuten
  var c = ctx();
  var a = tag(function (mi) { return 100 + mi * 0.01; }, 100), b = tag(function (mi) { return 100 - mi * 0.01; }, 100);
  var tage = [{ k: a, ctx: c }, { k: b, ctx: c }, { k: a, ctx: c }];
  var ra = S.fensterErtrag(a, c, 60, 120, 1), rb = S.fensterErtrag(b, c, 60, 120, 1);
  ok(nah(ra, (a[120][5] - a[60][5]) / a[60][5] * 100), 'fensterErtrag: Eroeffnung zu Eroeffnung');
  ok(nah(S.placeboUhrzeit(tage, 0, 60, 120, 1), (rb + ra) / 2), 'placeboUhrzeit: ohne den Signaltag');
  ok(nah(S.fensterErtrag(a, c, 360, 390, -1), -(a[389][1] - a[360][5]) / a[360][5] * 100), 'fensterErtrag: bis Schluss = Schlusskurs');
})();

/* ---------- Statistik, Zufall, Zahlen gegen REGEL.md ---------- */
(function () {
  var T = require('./sieb.js').tStat;
  var t = T([1, 2, 3, 4]);
  ok(nah(t.mittel, 2.5) && nah(t.se, Math.sqrt(1.6666666666666667 / 4)) && nah(t.t, 2.5 / Math.sqrt(1.6666666666666667 / 4)), 'tStat von Hand');
  ok(G.median([5, 1, 3, 2]) === 3, 'median = sortiert[n>>1] wie liquide.js');
  var a = G.ziehe([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, 1), b = G.ziehe([1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 4, 1);
  ok(JSON.stringify(a) === JSON.stringify(b) && a.length === 4, 'ziehe: geseedet wiederholbar');
  ok(G.sektor({ sic: 6798, sektor: 'Finanzen' }) === 'Immobilien' && G.sektor({ sic: 6021, sektor: 'Finanzen' }) === 'Finanzen' && G.sektor({ sektor: 'Sonstige' }) === null, 'Sektor: REIT-Abweichung');
  var regel = fs.readFileSync(path.join(__dirname, 'REGEL.md'), 'utf8');
  [String(G.SEED_SUCHE), String(G.SEED_BESTAETIGUNG), G.STICHTAG, '250 Mio', G.PLACEBO_ZUEGE + ' Zufallsminuten', 't ≥ ' + G.SIEB.tMin, G.SIEB.minTage + ' Signaltage']
    .forEach(function (s) { ok(regel.indexOf(s) !== -1, 'REGEL.md nennt ' + s); });
  S.SETUPS.forEach(function (St) { ok(regel.indexOf('`' + St.key + '`') !== -1, 'REGEL.md nennt Setup ' + St.key); });
})();

console.log(gruen + ' gruen, ' + rot + ' rot');
process.exit(rot ? 1 : 0);
