'use strict';
/* Diagnose NACH dem Lauf (Auftrag Nr. 85) - aendert keine Zahl des Ergebnisses und nichts am Laufskript.
 * Anlass: die eigene Zaehlung OHNE Regel trifft die Tabelle des PM (Nachtrag Nr. 78 im Belegstand) in fuenf von sechs Spalten auf das
 * Stueck (Umschichtungen, voll, verkleinert, Kleinstkauf, ausgefallen); nur "davon mit zu wenig Bargeld" weicht ab
 * (A-187 1.135 statt 1.070, A-breit 1.141 statt 1.137, B-187 1.186 statt 1.123). Hier wird nachgezaehlt, welche Lesart die Zahl des PM ergibt:
 *   a  mindestens ein Kauf nicht mit der geplanten Stueckzahl ausgefuehrt (die Lesart aus REGEL.md C.7 - die Zahl in ergebnis.json)
 *   b  mindestens ein Kauf unter 95 % des Platzwerts (verkleinert, Kleinstkauf oder ausgefallen)
 *   c  mindestens ein Kleinstkauf oder ausgefallener Kauf
 *   d  mindestens ein ausgefallener Kauf
 * Gerechnet wird nur OHNE Regel, die 63 Startphasen der vier Laeufe, durch dieselbe Huelle.
 *   node --max-old-space-size=6144 studien/momentum-korb-kleinst-2026-10-04/diagnose.js */
var fs = require('fs');
var path = require('path');
var KS = require('./kleinst.js');

var Z2 = null, innen = KS.MH.fuehreAus;                    /* innen = die Huelle aus kleinst.js */
KS.MH.fuehreAus = function (buch, plan, nowMs, kostenBp) {
  var Z = KS.H.zaehler, vor = Z ? [Z.verkleinert, Z.kleinstkauf, Z.ausgefallen] : null;
  var geplant = plan.kaufen.map(function (o) { return o.stueck; });
  var n = innen(buch, plan, nowMs, kostenBp);
  if (Z && Z2) {
    var dV = Z.verkleinert - vor[0], dK = Z.kleinstkauf - vor[1], dA = Z.ausgefallen - vor[2];
    if (plan.kaufen.some(function (o, i) { return o.stueck !== geplant[i]; })) Z2.a++;
    if (dV + dK + dA > 0) Z2.b++;
    if (dK + dA > 0) Z2.c++;
    if (dA > 0) Z2.d++;
  }
  return n;
};

var V = KS.vorbereitung();
var E = JSON.parse(fs.readFileSync(path.join(__dirname, 'ergebnis.json'), 'utf8')), aus = { erzeugt: new Date().toISOString(), kennung: E.kennung, laeufe: {} };
KS.LAEUFE.forEach(function (def) {
  var F = V.F[def.fenster], Z = KS.neuerZaehler(), SP;
  Z2 = { a: 0, b: 0, c: 0, d: 0 };
  KS.H.opts = { kleinstAnteil: 0 }; KS.H.zaehler = Z;
  try { SP = KS.S.startphasen(V.T, V.Q, V.M, F.von, F.bis, 63, { totalverlust: V.haupt, korb: def.korb, mechanik: 'app' }); }
  finally { KS.H.opts = null; KS.H.zaehler = null; }
  var alt = E.laeufe[def.name].ohne;
  if (SP.median !== alt.startphasen.median || Z.kleinstkauf !== alt.zaehler63.kleinstkauf || Z.mitZuWenigBargeld !== alt.zaehler63.mitZuWenigBargeld || Z2.a !== Z.mitZuWenigBargeld) {
    throw new Error('KLINKE: die Diagnose rechnet nicht denselben Lauf wie ergebnis.json (' + def.name + ')');
  }
  var pm = KS.PM_TABELLE[def.name] ? KS.PM_TABELLE[def.name].mitZuWenigBargeld : null;
  aus.laeufe[def.name] = { umschichtungen: Z.umschichtungen, lesartA: Z2.a, lesartB: Z2.b, lesartC: Z2.c, lesartD: Z2.d, tabellePm: pm,
    trifft: pm === null ? null : ['a', 'b', 'c', 'd'].filter(function (k) { return Z2[k] === pm; }) };
  console.log(def.name + ': Umschichtungen ' + Z.umschichtungen + ' | a ' + Z2.a + ' | b ' + Z2.b + ' | c ' + Z2.c + ' | d ' + Z2.d + ' | Tabelle des PM ' + pm);
});
fs.writeFileSync(path.join(__dirname, 'diagnose.json'), JSON.stringify(aus, null, 1));
