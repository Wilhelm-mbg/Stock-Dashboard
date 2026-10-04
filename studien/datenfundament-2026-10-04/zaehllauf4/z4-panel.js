'use strict';
/* ZAEHLLAUF 4, Schritt 1 - Zwillinge (V9) und roher letzter Kurs (E7) am Tages-Panel v2.2 (Auftrag Nr. 92). NUR LESEN.
 *
 * Laedt das Panel GENAU EINMAL (ein Prozess, --max-old-space-size=6144) und legt alles, was der Lauf braucht, in
 * z4-panel.json ab; danach rechnet kein Schritt mehr am Panel.
 *
 * Je abgegangener Reihe (5.050 Reihen aus ../zaehllauf3/z3-verschwundene.json, nur lesen):
 *   - der Panel-Abschnitt der Reihe: unter den Abschnitten ihres Ordners (und dem Abschnitt gleichen Namens) der, dessen
 *     letzter Tag dem Anker (letzter Minutentag) am naechsten liegt (Lesart 3);
 *   - E7: roher Schluss (Feld rohSchluss) und bereinigter Schluss der letzten Panel-Zeile dieses Abschnitts;
 *   - Umsatz: Median der letzten 20 Zeilen (Feld umsatz, und umsatz x roher Schluss) - nur fuer die Reihenfolge der Leseliste;
 *   - V9: jede ANDERE Reihe, die am letzten Tag denselben rohen Schluss hat, wird nach zwilling.js geprueft (a, b, c);
 *     festgehalten werden alle, die (a) erfuellen, mit gleichen Tagen, Nachlauf und doppelten Zeilen.
 *
 * Aufruf:  node --max-old-space-size=6144 z4-panel.js
 * Schreibt: z4-panel.json (keine Tafel, kein Panel)
 */
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var ZW = require('./zwilling.js');
var PR = require(path.join(G.PRUEFSTAND, 'pruefstand.js'));

function median(l) { if (!l.length) return null; var s = l.slice().sort(function (a, b) { return a - b; }), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

function main() {
  var V = G.json(path.join(Z3.Z3ORDNER, 'z3-verschwundene.json'));
  var PK = G.json(path.join(Z3.P2, 't4-panelklasse.json'));
  var t0 = Date.now();
  var T = PR.Tafel(path.join(G.PRUEFSTAND, 'voll-v22'));
  var g = T.g, sym = T.stand.symbole;
  console.log('Panel geladen:', g.n, 'Zeilen,', sym.length, 'Reihen, Ende', T.kal.tage[T.maxTag], '(' + Math.round((Date.now() - t0) / 1000) + ' s)');

  function reihe(s) {
    var a = T.symStart[s], b = T.symStart[s + 1], n = b - a, aus = { tage: new Int32Array(n), roh: new Float64Array(n), verh: new Float64Array(n), zeilen: new Int32Array(n) };
    for (var q = 0; q < n; q++) { var z = T.symZeilen[a + q]; aus.zeilen[q] = z; aus.tage[q] = g.tag[z]; aus.roh[q] = g.rohSchluss[z]; aus.verh[q] = g.bEroeffnung[z] / g.bSchluss[z]; }
    return aus;
  }
  var jeOrdner = {};
  sym.forEach(function (s, i) { if (!s.referenz) (jeOrdner[s.ordner] = jeOrdner[s.ordner] || []).push(i); });
  var tagIdx = {}; T.kal.tage.forEach(function (t, i) { tagIdx[t] = i; });
  function tagNah(iso) { if (tagIdx[iso] !== undefined) return tagIdx[iso]; var best = -1; for (var i = 0; i < T.kal.tage.length; i++) if (T.kal.tage[i] <= iso) best = i; return best; }

  var Z = { reihen: V.reihen.length, ohnePanelReihe: 0, ohneZeilen: 0, zuKurzFuerA: 0, abschnittWieName: 0, abschnittAndersAlsName: 0, abschnittAndersAlsPanelklasse: 0,
    mitA: 0, mitAWeiter: 0, nurGleichesEnde: 0, mitAWeiterOhneB: 0, mitAWeiterOhneC: 0, mitABC: 0, kandidatenA: 0, verhNurMitToleranz: 0 };
  var je = {}, D = {}, schluessel = new Map(), markTag = new Uint8Array(T.nTage);
  V.reihen.forEach(function (R) {
    var l = (jeOrdner[R.ordner] || []).slice();
    if (T.symIdx[R.reihe] !== undefined && l.indexOf(T.symIdx[R.reihe]) === -1 && !sym[T.symIdx[R.reihe]].referenz) l.push(T.symIdx[R.reihe]);
    if (!l.length) { Z.ohnePanelReihe++; je[R.reihe] = { panelReihe: null }; return; }
    var anker = tagNah(R.letzterBalken), best = -1, bestD = Infinity, bestEnde = -1;
    l.forEach(function (s) {
      var n = T.symStart[s + 1] - T.symStart[s]; if (!n) return;
      var ende = g.tag[T.symZeilen[T.symStart[s + 1] - 1]], d = Math.abs(ende - anker);
      if (d < bestD || (d === bestD && ende > bestEnde)) { best = s; bestD = d; bestEnde = ende; }
    });
    if (best < 0) { Z.ohneZeilen++; je[R.reihe] = { panelReihe: sym[l[0]].reihe, zeilen: 0 }; return; }
    if (sym[best].reihe === R.reihe) Z.abschnittWieName++; else Z.abschnittAndersAlsName++;
    var pk = PK.je[R.reihe];
    if (pk && pk.panelReihe !== sym[best].reihe) Z.abschnittAndersAlsPanelklasse++;
    var r = reihe(best), n = r.tage.length, z = r.zeilen[n - 1], u = [], du = [];
    for (var q = Math.max(0, n - 20); q < n; q++) { var zz = r.zeilen[q]; u.push(g.umsatz[zz]); du.push(g.umsatz[zz] * g.rohSchluss[zz]); }
    je[R.reihe] = { panelReihe: sym[best].reihe, abschnitte: l.length, zeilen: n, ersterTag: T.kal.tage[r.tage[0]], bis: T.kal.tage[r.tage[n - 1]], rohLetzter: g.rohSchluss[z], bLetzter: g.bSchluss[z],
      umsatzMedian20: median(u), dollarUmsatzMedian20: median(du), ankerAbstandTage: bestD, kandidaten: [], zwilling: null };
    if (n < ZW.A_TAGE) { Z.zuKurzFuerA++; return; }
    D[R.reihe] = { s: best, r: r };
    var k = r.tage[n - 1] + '|' + r.roh[n - 1];
    if (!schluessel.has(k)) schluessel.set(k, []);
    schluessel.get(k).push(R.reihe);
    markTag[r.tage[n - 1]] = 1;
  });

  /* Kandidaten: jede Zeile des Panels mit gleichem Tag und gleichem rohem Schluss wie der letzte Tag einer abgegangenen Reihe */
  var paare = {};
  for (var i = 0; i < g.n; i++) {
    if (!markTag[g.tag[i]]) continue;
    var l2 = schluessel.get(g.tag[i] + '|' + g.rohSchluss[i]);
    if (!l2) continue;
    var s2 = g.sym[i];
    if (sym[s2].referenz) continue;
    l2.forEach(function (rn) { if (D[rn].s !== s2) (paare[rn] = paare[rn] || []).push(s2); });
  }
  var cache = {};
  Object.keys(paare).forEach(function (rn) {
    var d = D[rn], kand = [];
    paare[rn].forEach(function (s2) {
      var C = cache[s2] || (cache[s2] = reihe(s2)), p = ZW.pruefe(d.r, C);
      if (!p.a) return;
      Z.kandidatenA++; if (!p.aExakt) Z.verhNurMitToleranz++;
      kand.push({ name: sym[s2].reihe, p: p, doppelte: ZW.doppelte(d.r, C), cErster: T.kal.tage[C.tage[0]], cLetzter: T.kal.tage[C.tage[C.tage.length - 1]], cLebend: sym[s2].lebend });
    });
    if (Object.keys(cache).length > 400) cache = {};
    if (!kand.length) return;
    var w = ZW.waehle(kand), e = je[rn];
    e.kandidaten = kand.map(function (k) { return Object.assign({ name: k.name, doppelte: k.doppelte, cErster: k.cErster, cLetzter: k.cLetzter, cLebend: k.cLebend }, k.p); });
    e.zwilling = w ? w.name : null;
    Z.mitA++;
    var weiter = kand.filter(function (k) { return k.p.cTage >= 1; });
    if (!weiter.length) Z.nurGleichesEnde++;
    else {
      Z.mitAWeiter++;
      if (w) Z.mitABC++;
      else {
        if (!weiter.some(function (k) { return k.p.b; })) Z.mitAWeiterOhneB++;
        if (!weiter.some(function (k) { return k.p.c; })) Z.mitAWeiterOhneC++;
      }
    }
  });
  Z3.schreibe('z4-panel.json', { kennung: Z3.KENNUNG, stand: new Date().toISOString(), panel: T.stand.kennung, panelEnde: T.kal.tage[T.maxTag], panelZeilen: g.n,
    regel: { a: ZW.A_TAGE + ' letzte Tage: roher Schluss gleich, Verhaeltnis Eroeffnung/Schluss gleich (Toleranz ' + ZW.VERH_TOL + ' relativ)', b: ZW.B_MIN + ' von ' + ZW.B_FENSTER + ', kuerzer: ' + (ZW.B_ANTEIL * 100) + ' %', c: ZW.C_MIN + ' Panel-Zeilen nach dem letzten Tag' },
    zaehler: Z, je: je });
  console.log(JSON.stringify(Z));
  console.log('fertig in', Math.round((Date.now() - t0) / 1000), 's');
}

if (require.main === module) main();
