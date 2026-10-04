'use strict';
/* TEIL 4, Hilfsschritt - Klasse 1-3 in den letzten 250 Panel-Zeilen je nicht lebender Reihe (nur lesen, Panel v2.2).
 *
 * Wie ../t3-panel.js (Nr. 79): je Ordner der LETZTE Abschnitt des Panels, darin die letzten 250 Zeilen; k123 = Zeilen in
 * Klasse 1-3, k23 = Zeilen in Klasse 2-3. Dazu die Totalverlust-Listen des Pruefstands (K.EMPFINDLICHKEIT).
 *
 * Aufruf:  node --max-old-space-size=6144 t4-panelklasse.js      (ein Prozess, laedt das Panel einmal)
 * Schreibt: t4-panelklasse.json (klein) - t4-auswerten.js liest nur diese Datei, nicht das Panel.
 */
var path = require('path');
var G = require('../gemeinsam.js');
var P = require('./p2.js');
var PR = require(path.join(G.PRUEFSTAND, 'pruefstand.js'));
var K = require(path.join(G.PRUEFSTAND, 'konfig.js'));

var LETZTE_ZEILEN = 250;

function main() {
  var V = G.json(path.join(P.HIER, 't4-verschwundene.json'));
  var t0 = Date.now();
  var T = PR.Tafel(path.join(G.PRUEFSTAND, 'voll-v22'));
  var g = T.g, sym = T.stand.symbole;
  console.log('Panel geladen:', g.n, 'Zeilen,', sym.length, 'Reihen, Ende', T.kal.tage[T.maxTag], '(' + Math.round((Date.now() - t0) / 1000) + ' s)');
  var jeOrdner = {};
  sym.forEach(function (s, i) {
    if (s.referenz) return;
    var a = T.symStart[i], b = T.symStart[i + 1], n = b - a;
    var o = { panelReihe: s.reihe, zeilen: n, bis: null, bisTag: -1, k123: 0, k23: 0, maxKlasse: -1, lebendPanel: s.lebend, endeGrundPanel: s.ende_grund || null };
    if (n) {
      o.bisTag = g.tag[T.symZeilen[b - 1]]; o.bis = T.kal.tage[o.bisTag];
      for (var q = Math.max(a, b - LETZTE_ZEILEN); q < b; q++) {
        var kl = g.klasse[T.symZeilen[q]];
        if (kl >= 1 && kl <= 3) o.k123++;
        if (kl >= 2 && kl <= 3) o.k23++;
        if (kl > o.maxKlasse) o.maxKlasse = kl;
      }
    }
    (jeOrdner[s.ordner] = jeOrdner[s.ordner] || []).push(o);
  });
  var aus = {}, ohnePanel = 0, mitK123 = 0;
  V.reihen.forEach(function (R) {
    var l = jeOrdner[R.ordner];
    if (!l) { ohnePanel++; return; }
    var mit = l.filter(function (o) { return o.zeilen > 0; });
    var letzter = (mit.length ? mit : l).slice().sort(function (p, q) { return q.bisTag - p.bisTag; })[0];
    aus[R.reihe] = { panelReihe: letzter.panelReihe, abschnitte: l.length, zeilen: letzter.zeilen, bis: letzter.bis, k123: letzter.k123, k23: letzter.k23, maxKlasse: letzter.maxKlasse,
      lebendPanel: letzter.lebendPanel, endeGrundPanel: letzter.endeGrundPanel };
    if (letzter.k123 > 0) mitK123++;
  });
  var haupt = K.EMPFINDLICHKEIT.filter(function (e) { return e.key === 'haupt'; })[0].totalverlust;
  var streng = K.EMPFINDLICHKEIT.filter(function (e) { return e.key === 'streng'; })[0].totalverlust;
  P.schreibe('t4-panelklasse.json', { stand: new Date().toISOString(), panel: T.stand.kennung, panelEnde: T.kal.tage[T.maxTag], letzteZeilen: LETZTE_ZEILEN,
    hinweis: 'je nicht lebender Leser-Reihe der LETZTE Panel-Abschnitt ihres Ordners; k123/k23 = Zeilen in Klasse 1-3 bzw. 2-3 unter seinen letzten 250.',
    listen: { haupt: haupt, streng: streng }, reihen: V.reihen.length, ohnePanelReihe: ohnePanel, mitKlasse123: mitK123, je: aus });
  console.log(JSON.stringify({ reihen: V.reihen.length, ohnePanelReihe: ohnePanel, mitKlasse123: mitK123, haupt: haupt, streng: streng }));
}

if (require.main === module) main();
