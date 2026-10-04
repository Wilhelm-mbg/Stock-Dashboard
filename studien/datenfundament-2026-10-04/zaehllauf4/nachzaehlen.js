'use strict';
/* ZAEHLLAUF 4, Schritt 6 - Nachzaehlung der Zahlen des PM (Auftrag Nr. 92 und wiki/datenquellen.md, Abschnitt "Dritter
 * Zaehllauf ... (Nr. 90)", E1 bis E8 und V9). Nur zaehlen. Wird von t4-auswerten.js gerufen (die Daten sind dort schon geladen).
 * Schreibt: z4-nachzaehlung.json - je Zahl: soll (PM), ist (hier gezaehlt), stimmt (ja/nein), wie gezaehlt.
 */
var path = require('path');
var G = require('../gemeinsam.js');
var Z3 = require('./z3.js');
var E = require('./t4-einstufen.js');

var HAUPT = ['insolvenz', 'zwangs-delisting'], STRENG = HAUPT.concat(['unbekannt', 'freiwillig', 'abgemeldet-anlass-offen', 'ausgesetzt']);
function tvIn(g, l) { return !!(g && l.indexOf(g) !== -1); }

function main(N, L3, V, PN, Z) {
  var PK = G.json(path.join(Z3.P2, 't4-panelklasse.json'));
  var u4 = {}, u3 = {}, Rje = {};
  N.reihen.forEach(function (u) { u4[u.reihe] = u; });
  L3.reihen.forEach(function (u) { u3[u.reihe] = u; });
  V.reihen.forEach(function (R) { Rje[R.reihe] = R; });
  function k(r) { var p = PK.je[r]; return !!(p && p.k123 > 0); }
  var aus = [];
  function zahl(nr, was, soll, ist, wie) { aus.push({ nr: nr, was: was, soll: soll, ist: ist, stimmt: JSON.stringify(soll) === JSON.stringify(ist) ? 'ja' : 'nein', wie: wie }); }

  /* ---- V9 ---- */
  var mitAWeiter = Object.keys(PN.je).filter(function (r) { return (PN.je[r].kandidaten || []).some(function (c) { return c.cTage >= 1; }); });
  zahl('V9', 'Reihen mit Zwilling nur nach Bedingung (a) (Zwilling laeuft mindestens einen Tag weiter)', 310, mitAWeiter.length, 'z4-panel.json: Kandidat mit a und Nachlauf >= 1');
  zahl('V9', '... davon mit Klasse 1-3', 37, mitAWeiter.filter(k).length, 'phase2/t4-panelklasse.json k123 > 0');
  var dopA = 0; mitAWeiter.forEach(function (r) { var b = PN.je[r].kandidaten.filter(function (c) { return c.cTage >= 1; }).sort(function (x, y) { return y.doppelte - x.doppelte; })[0]; dopA += b.doppelte; });
  var zeilenA = 0; mitAWeiter.forEach(function (r) { zeilenA += PN.je[r].zeilen; });
  zahl('V9', 'doppelte Panel-Zeilen (nur a)', 193581, dopA, 'Tage der Reihe, an denen der Zwilling denselben rohen Schluss hat; Zeilen der Reihen insgesamt: ' + zeilenA);
  zahl('V9', 'Reihen mit Zwilling nach a, b und c', 308, Z.zwillinge.anzahl, 'Regel Z der Einstufung');
  var dtc = (PN.je.DTC && PN.je.DTC.kandidaten || []).map(function (c) { return c.name + ' ' + c.bGleich + '/' + c.bTage + ' Nachlauf ' + c.cTage; });
  var acpw = (PN.je.ACPW && PN.je.ACPW.kandidaten || []).map(function (c) { return c.name + ' ' + c.bGleich + '/' + c.bTage + ' Nachlauf ' + c.cTage; });
  zahl('V9', 'DTC -> SBDS scheitert an (b) mit 4 von 60', 'SBDS 4/60', dtc.join('; '), 'Kandidaten von DTC');
  zahl('V9', 'ACPW -> PIOI: Zwilling laeuft nur einen Tag weiter', 'PIOI Nachlauf 1', acpw.join('; '), 'Kandidaten von ACPW');
  var echt60 = N.reihen.filter(function (u) { return u.zwilling_info && u.zwilling_info.bTage === 60; }).map(function (u) { return u.zwilling_info.bGleich; }).sort(function (a, b) { return a - b; });
  zahl('V9', 'die schwaechsten echten Paare haben 46 bis 53 von 60', '46-53', echt60.slice(0, 5).join(','), 'gleiche Tage der fuenf schwaechsten Paare mit 60 Tagen');
  var zw = N.reihen.filter(function (u) { return u.beleg === 'zwilling-im-archiv'; });
  var setA = mitAWeiter.map(function (r) { return u4[r]; }).filter(Boolean);
  zahl('V9', 'davon tragen einen anderen Grund als Umbenennung (dritter Lauf)', 109, setA.filter(function (u) { return u.lauf3 && u.lauf3.grund !== 'umbenennung-ticker'; }).length, 'Menge nur (a); mit a, b, c: ' + zw.filter(function (u) { return u.lauf3 && u.lauf3.grund !== 'umbenennung-ticker'; }).length);
  zahl('V9', 'standen im dritten Lauf als Totalverlust (Hauptlesart)', 14, setA.filter(function (u) { return u.lauf3 && tvIn(u.lauf3.grund, HAUPT); }).length, 'Menge nur (a); mit a, b, c: ' + zw.filter(function (u) { return u.lauf3 && tvIn(u.lauf3.grund, HAUPT); }).length);
  var altTV = setA.filter(function (u) { return u.alt && tvIn(u.alt.grund, HAUPT); });
  zahl('V9', 'in der alten Tafel als Totalverlust (Hauptlesart)', 32, altTV.length, 'Menge nur (a); mit Klasse 1-3: ' + altTV.filter(function (u) { return k(u.reihe); }).map(function (u) { return u.reihe; }).join(' '));
  zahl('V9', 'in der alten Tafel weitere nur in der strengen Lesart', 29, setA.filter(function (u) { return u.alt && tvIn(u.alt.grund, STRENG) && !tvIn(u.alt.grund, HAUPT); }).length, 'Menge nur (a)');
  zahl('V9', 'SLW und SYMC mit Klasse 1-3 unter den alten Totalverlusten', ['SLW', 'SYMC'], altTV.filter(function (u) { return k(u.reihe) && (u.reihe === 'SLW' || u.reihe === 'SYMC'); }).map(function (u) { return u.reihe; }).sort(), '');

  /* ---- E1 ---- */
  var r0 = L3.reihen.filter(function (u) { return u.regel === 0; });
  var ohne103 = r0.filter(function (u) { return u.beleg === 'q-kuerzel'; }), mit103 = r0.filter(function (u) { return u.beleg === 'q-kuerzel+edgar-8K-1.03'; });
  function e1(u) { return E.qKuerzel(u.nachfolger, Rje[u.reihe].basis, { E1: 1 }); }
  zahl('E1', 'Zeilen der Regel 0 ohne Insolvenz-Meldung', 22, ohne103.length, 'dritter Lauf, Beleg q-kuerzel');
  zahl('E1', 'davon fallen aus Regel 0 (Umbenennungen)', ['ARQ', 'ARQQ', 'CCAQ', 'ELIQ', 'INFQ', 'IONQ', 'NHIQ', 'TAIQ'], ohne103.filter(function (u) { return !e1(u); }).map(function (u) { return String(u.nachfolger); }).sort(), 'neues Kuerzel nach E1 geprueft');
  zahl('E1', 'alle Zeilen mit Insolvenz-Meldung erfuellen E1', 109 + ' von ' + 109, mit103.filter(e1).length + ' von ' + mit103.length, 'dritter Lauf, Beleg q-kuerzel+edgar-8K-1.03');
  var fall = ohne103.filter(function (u) { return !e1(u); }).map(function (u) { return u.reihe + ': ' + (u4[u.reihe] ? u4[u.reihe].grund + ' / Regel ' + u4[u.reihe].regel : '-'); });
  zahl('E1', 'die acht gehen an Regel 1', 'Regel 1', fall.join('; '), 'Grund und Regel im vierten Lauf');

  /* ---- E2 ---- */
  var e2 = N.reihen.filter(function (u) { return u.lauf3 && u.lauf3.grund === 'zwangs-delisting' && u.grund === 'spac-ende' && /^name-/.test(u.mantel_merkmal || ''); });
  zahl('E2', 'Zwangs-Delistings, die Maentel mit anderer Kennziffer sind', 21, e2.length, 'dritter Lauf zwangs-delisting -> vierter Lauf spac-ende ueber den Mantel-Namen; Namen: ' + e2.map(function (u) { return u.reihe; }).join(' '));

  /* ---- E3 ---- */
  var ruegeFern = L3.reihen.filter(function (u) { return u.beleg === 'edgar-8K-3.01-ruege' && u.signale && u.signale.i301v3_tage != null && u.signale.i301v3_tage < -30; });
  zahl('E3', 'Ruege 31 bis 180 Tage vor dem Anker (dritter Lauf, Regel 11)', 50, ruegeFern.length, 'Beleg edgar-8K-3.01-ruege, i301v3_tage < -30');
  zahl('E3', '... davon ohne Formular 25-NSE am Anker', 42, ruegeFern.filter(function (u) { return !u.signale.f25nse; }).length, 'signale.f25nse leer');

  /* ---- E4 ---- */
  zahl('E4', 'Zeilen mit unklarem Wortlaut (Regel 11, Zeile 5)', 30, L3.reihen.filter(function (u) { return u.beleg === 'edgar-8K-3.01'; }).length, 'dritter Lauf, Beleg edgar-8K-3.01');

  /* ---- E5 ---- */
  var abg = L3.reihen.filter(function (u) { return u.grund === 'abgemeldet-anlass-offen'; });
  zahl('E5', 'abgemeldet, Anlass offen (dritter Lauf)', 370, abg.length, '');
  zahl('E5', '... davon Formular 25 mehr als 30 Tage vom Anker', 61, abg.filter(function (u) { return u.datum && Math.abs(G.tageZwischen(u.letzter_balken, u.datum)) > 30; }).length, 'Datum der Zeile = Tag des Formulars 25');

  /* ---- E6 ---- */
  var s4 = u4.SYMC, s3 = u3.SYMC;
  zahl('E6', 'SYMC: Suchfirma Broadcom im dritten Lauf', 'Broadcom Inc.', s3 ? s3.firma : null, 'dritter Lauf');
  zahl('E6', 'SYMC im vierten Lauf', 'nicht Broadcom', s4 ? (s4.firma || '(keine Firma)') + ' / ' + s4.grund + ' / ' + s4.beleg : null, 'vierter Lauf');

  /* ---- E7 ---- */
  var mitBeiden = V.reihen.filter(function (R) { return R.kursFaktor; }), ueber = mitBeiden.filter(function (R) { return R.kursFaktor > 1.5; });
  function teil(f) { var a = mitBeiden.filter(f); return a.filter(function (R) { return R.kursFaktor > 1.5; }).length + ' von ' + a.length; }
  zahl('E7', 'letzter Kurs weicht um mehr als das 1,5-Fache vom rohen ab', '63 von 958', ueber.length + ' von ' + mitBeiden.length,
    'alle Reihen mit beiden Kursen; Teilmengen: Totalverlust streng Lauf 3 ' + teil(function (R) { return u3[R.reihe] && tvIn(u3[R.reihe].grund, STRENG); }) + ', Hauptlesart Lauf 3 ' + teil(function (R) { return u3[R.reihe] && tvIn(u3[R.reihe].grund, HAUPT); })
    + ', Klasse 1-3 ' + teil(function (R) { return k(R.reihe); }) + ', Kurs unter 1 $ roh ' + teil(function (R) { return R.letzterKursRoh < 1; }));
  ['RNVA', 'LFLY', 'CFNB'].forEach(function (r, i) { var R = Rje[r]; zahl('E7', 'roher letzter Kurs ' + r, [0.589, 0.567, 13.3][i], R ? R.letzterKursRoh : null, R ? R.letzterKursRohQuelle + '; bereinigt ' + R.letzterKursArchiv : ''); });
  zahl('E7', 'Reihen ohne Panel-Zeile (ohnePanelReihe in phase2/t4-panelklasse.json)', 'Zahl nennen', PK.ohnePanelReihe + ' (Panelklasse); hier ohne Panel-Reihe ' + PN.zaehler.ohnePanelReihe + ', ohne Zeilen ' + PN.zaehler.ohneZeilen, '');

  /* ---- E8 ---- */
  var unb3 = L3.reihen.filter(function (u) { return u.grund === 'unbekannt' && k(u.reihe); }), unb4 = N.reihen.filter(function (u) { return u.grund === 'unbekannt' && k(u.reihe); });
  zahl('E8', 'Klasse 1-3 mit Grund unbekannt im dritten Lauf', 18, unb3.length, '');
  zahl('E8', 'nach V9 bleiben (Namen)', ['DISCA', 'DISCK', 'DWDP', 'FRC', 'LGF', 'MHFI', 'QVCA', 'SBNY', 'YHOO'], unb4.map(function (u) { return u.reihe; }).sort(), 'vierter Lauf, alle Regeln');
  Z3.schreibe('z4-nachzaehlung.json', { stand: new Date().toISOString(), stimmen: aus.filter(function (x) { return x.stimmt === 'ja'; }).length, von: aus.length, zahlen: aus });
  console.log('Nachzaehlung:', aus.filter(function (x) { return x.stimmt === 'ja'; }).length, 'von', aus.length, 'stimmen');
}

module.exports = { main: main };
