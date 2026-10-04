'use strict';
/* PANEL JAHRESWEISE - die Zwillingsprobe am Tages-Panel, ohne das Panel ganz zu laden (Auftrag Nr. 92, Schritt 2).
 *
 * Warum: der Rechner hatte am 04.10.2026 abends ueber eine Stunde lang nur 1,1 bis 2,3 GB freien Speicher (Vorgabe: unter
 * 3,5 GB kein Panel laden). PR.Tafel() haelt das ganze Panel (rund 1,5 GB); diese Probe liest die Jahresdateien EINZELN
 * (P.leseBlock, je Datei rund 50 MB) und behaelt nur, was sie braucht. Der Kalender kommt aus _stand.json (`tage`) - NICHT
 * aus K.kalender() (das liest E:/Markt-Dashboard-Archiv/alpaca1m/_kalender.json).
 *
 * Gerechnet wird wie PR.Tafel + ../zaehllauf4/z4-panel.js: Zeilen je Reihe in Dateireihenfolge (tag, sym), Verhaeltnis
 * Eroeffnung/Schluss = (rohEroeffnung / faktor) / (rohSchluss / faktor) - dieselben Rechenschritte in derselben Reihenfolge,
 * also dieselben Bits wie g.bEroeffnung / g.bSchluss der Tafel.
 *
 * Drei Durchgaenge ueber die Jahresdateien:
 *   1. je Reihe Zahl der Zeilen, erster/letzter Tag, die drei letzten Zeilen (Tag, roh, Verhaeltnis);
 *   2. Kandidaten: jede Zeile einer anderen (nicht Referenz-)Reihe mit gleichem Tag und gleichem rohem Schluss wie der letzte
 *      Tag eines gepruefen Abschnitts D;
 *   3. die ganzen Reihen der beteiligten Abschnitte (D mit Kandidaten und die Kandidaten) - dann zwilling-v2.pruefe je Paar.
 */
var fs = require('fs');
var path = require('path');
var G = require('../gemeinsam.js');
var P = require(path.join(G.PRUEFSTAND, 'paneldaten.js'));
var ZV = require('./zwilling-v2.js');
var ZW = ZV.ZW;

var SPITZE = 0;   // groesster Arbeitsspeicher (rss) nach einer Jahresdatei, fuer den Bericht
function spitzeMB() { return Math.round(Math.max(SPITZE, process.memoryUsage().rss) / 1e6); }
function stand(ordner) { return JSON.parse(fs.readFileSync(path.join(ordner, 'panel', '_stand.json'), 'utf8')); }
/** fn(block, jahr) fuer jede Jahresdatei, eine nach der anderen. */
function jahresweise(ordner, kennung, st, fn) {
  st.jahre.forEach(function (j) { var b = P.leseBlock(path.join(ordner, 'panel', j.jahr + '.bin'), kennung); fn(b, j.jahr); SPITZE = Math.max(SPITZE, process.memoryUsage().rss); });
}
function verh(b, i) { var bE = b.rohEroeffnung[i] / b.faktor[i], bS = b.rohSchluss[i] / b.faktor[i]; return bE / bS; }

/** Durchgang 1: je Reihe { n, erster, letzter, l3: [[tag, roh, verh] x <= 3] }. */
function uebersicht(ordner, kennung, st) {
  var nSym = st.symbole.length, info = [];
  for (var s = 0; s < nSym; s++) info.push({ n: 0, erster: -1, letzter: -1, l3: [] });
  jahresweise(ordner, kennung, st, function (b) {
    for (var i = 0; i < b.n; i++) {
      var x = info[b.sym[i]];
      if (x.n && b.tag[i] <= x.letzter) throw new Error('Tage der Reihe ' + st.symbole[b.sym[i]].reihe + ' nicht aufsteigend');
      if (!x.n) x.erster = b.tag[i];
      x.n++; x.letzter = b.tag[i];
      x.l3.push([b.tag[i], b.rohSchluss[i], verh(b, i)]); if (x.l3.length > 3) x.l3.shift();
    }
  });
  return info;
}

/** Zwillingsprobe fuer die Abschnitte dIdx (Symbolindizes). Rueckgabe: { st, info, kand: { d: [{ s, name, p, doppelte, cLetzter }] }, n } */
function probe(ordner, kennung, dIdx, info, st) {
  st = st || stand(ordner);
  info = info || uebersicht(ordner, kennung, st);
  var ref = st.symbole.map(function (r) { return !!r.referenz; });
  var schluessel = new Map(), markTag = {};
  dIdx.forEach(function (d) {
    var x = info[d];
    if (x.n < ZW.A_TAGE) return;
    var l = x.l3[x.l3.length - 1], k = l[0] + '|' + l[1];
    if (!schluessel.has(k)) schluessel.set(k, []);
    schluessel.get(k).push(d);
    markTag[l[0]] = 1;
  });
  /* Durchgang 2: Kandidaten */
  var paare = {};
  jahresweise(ordner, kennung, st, function (b) {
    for (var i = 0; i < b.n; i++) {
      if (!markTag[b.tag[i]]) continue;
      var l = schluessel.get(b.tag[i] + '|' + b.rohSchluss[i]);
      if (!l) continue;
      var s2 = b.sym[i];
      if (ref[s2]) continue;
      l.forEach(function (d) { if (d !== s2) (paare[d] = paare[d] || []).push(s2); });
    }
  });
  /* Durchgang 3: die ganzen Reihen der Beteiligten */
  var brauche = {};
  Object.keys(paare).forEach(function (d) { brauche[d] = 1; paare[d].forEach(function (c) { brauche[c] = 1; }); });
  var roh = {};
  Object.keys(brauche).forEach(function (s) { var n = info[s].n; roh[s] = { tage: new Int32Array(n), roh: new Float64Array(n), verh: new Float64Array(n), q: 0 }; });
  jahresweise(ordner, kennung, st, function (b) {
    for (var i = 0; i < b.n; i++) {
      var r = roh[b.sym[i]];
      if (!r) continue;
      r.tage[r.q] = b.tag[i]; r.roh[r.q] = b.rohSchluss[i]; r.verh[r.q] = verh(b, i); r.q++;
    }
  });
  var kand = {};
  Object.keys(paare).map(Number).sort(function (x, y) { return x - y; }).forEach(function (d) {
    var D = roh[d], l = [];
    paare[d].forEach(function (c) {
      var C = roh[c], p = ZV.pruefe(D, C);
      if (!p.a) return;
      l.push({ s: c, name: st.symbole[c].reihe, p: p, doppelte: ZW.doppelte(D, C), cLetzter: st.tage[C.tage[C.tage.length - 1]] });
    });
    if (l.length) kand[d] = l;
  });
  return { st: st, info: info, kand: kand, reihe: function (s) { return roh[s] || null; } };
}

module.exports = { spitzeMB: spitzeMB, stand: stand, jahresweise: jahresweise, uebersicht: uebersicht, probe: probe, verh: verh };
