'use strict';
/* Auftrag Nr. 78 - Diagnose NACH dem Lauf (keine neue Messung, aendert keine Zahl): spielt k = 0 der fuenf Laeufe noch einmal nach,
 * prueft, dass die Endwerte die aus ergebnis.json sind, und nennt die Namen zu den gezaehlten Auffaelligkeiten:
 * Ziele und Positionen ohne Eroeffnungskurs am Ausfuehrungstag, Tage ohne Zeile einer gehaltenen Reihe, die am laengsten gehaltenen Werte.
 *   node --max-old-space-size=6144 studien/momentum-korb-2026-10-04/diagnose.js */
var fs = require('fs');
var path = require('path');
var S = require('./korb.js');
var REPO = path.resolve(__dirname, '..', '..');
var R = require(path.join(REPO, 'studien', 'massstab-rueckblick-2026-10-04', 'rueckblick.js'));
var K = require(path.join(R.PRUEFSTAND, 'konfig.js'));
var PR = require(path.join(R.PRUEFSTAND, 'pruefstand.js'));

var E = JSON.parse(fs.readFileSync(path.join(__dirname, 'ergebnis.json'), 'utf8'));
var T = PR.Tafel(R.PANEL_ORDNER), Q = R.vorbereiten(T), M = S.Massnahmen(T, Q), F = S.fensterTage(T, Q), g = T.g;
function tag(t) { return String(T.kal.tage[t]); }

S.LAEUFE.forEach(function (def) {
  var L = S.simuliere(T, Q, M, { startTag: F[def.fenster].von, endTag: F[def.fenster].bis, totalverlust: K.EMPFINDLICHKEIT[0].totalverlust, korb: def.korb, mechanik: def.mechanik });
  var soll = E.laeufe[def.name].haupt;
  console.log('\n=== ' + def.name + ': Endwert ' + L.endBuch.toFixed(2) + ' / ' + L.endSpy.toFixed(2) + (L.endBuch === soll.buchEnde && L.endSpy === soll.spyEnde ? ' = ergebnis.json' : ' WEICHT AB von ergebnis.json'));
  /* ohne Eroeffnungskurs am Ausfuehrungstag: Ziele und vorher gehaltene Positionen */
  L.umschichtungen.forEach(function (u) {
    if (!u.ohneKurs) return;
    var d = R.tagAb(T, Q, u.ausfuehrungstag), s = R.tagAb(T, Q, u.stichtag), ziel = S.zielAm(T, Q, s, def.korb).ziel, namen = {};
    ziel.forEach(function (n) { namen[n] = 'Ziel'; });
    L.haltezeiten.forEach(function (h) { if (h.von < d && h.bis >= d) namen[h.reihe] = (namen[h.reihe] ? 'Ziel und ' : '') + 'gehalten'; });
    var ohne = Object.keys(namen).filter(function (n) { var z = T.zeileVon(T.symIdx[n], d); return !(z >= 0 && g.bEroeffnung[z] > 0); });
    console.log('  ohne Kurs am ' + u.ausfuehrungstag + ' (' + u.ohneKurs + '): ' + ohne.map(function (n) {
      var i = T.symIdx[n], z = T.zeileVon(i, d);
      return n + ' [' + namen[n] + (z >= 0 ? ', Zeile da, Eroeffnung ' + g.bEroeffnung[z] : ', keine Zeile; letzte Zeile ' + tag(g.tag[T.letzteZeile(i)]) + ', Ende-Grund ' + (T.endeGrund[i] || 'keiner')) + ']';
    }).join('; '));
  });
  /* Tage ohne Zeile waehrend des Haltens (Luecke, kein Ende) */
  var luecken = [];
  L.haltezeiten.forEach(function (h) {
    var i = T.symIdx[h.reihe];
    for (var o = Q.ord[h.von]; o <= Q.ord[h.bis]; o++) {
      var d = Q.ptage[o];
      if (T.zeileVon(i, d) < 0 && g.tag[T.letzteZeile(i)] > d) luecken.push(h.reihe + ' ' + tag(d));
    }
  });
  console.log('  Tage ohne Zeile waehrend des Haltens: ' + (luecken.join('; ') || 'keine'));
  /* am laengsten gehalten (Handelstage ueber alle Haltezeiten der Reihe) */
  var dauer = {};
  L.haltezeiten.forEach(function (h) { dauer[h.reihe] = (dauer[h.reihe] || 0) + (Q.ord[h.bis] - Q.ord[h.von]); });
  var top = Object.keys(dauer).sort(function (a, b) { return dauer[b] - dauer[a]; }).slice(0, 12);
  console.log('  am laengsten gehalten (Handelstage): ' + top.map(function (n) { return n + ' ' + dauer[n]; }).join(', ') + ' | verschiedene Werte: ' + Object.keys(dauer).length);
  console.log('  Reihenenden: ' + (L.reihenenden.map(function (r) { return r.reihe + ' ' + r.tag + ' ' + r.grund + (r.lebendGefuehrt ? ' (als lebend gefuehrt)' : ''); }).join('; ') || 'keine'));
});
