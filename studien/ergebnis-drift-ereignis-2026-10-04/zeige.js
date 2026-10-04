'use strict';
/* Kurzansicht der Ergebnisdateien (nur Zaehlungen und Streuungen) - fuer den Bericht.   node zeige.js [m1|z|m6] */
var fs = require('fs');
var path = require('path');
function lies(n) { return JSON.parse(fs.readFileSync(path.join(__dirname, n), 'utf8')); }
function f(x, n) { return (typeof x === 'number' && isFinite(x)) ? x.toFixed(n === undefined ? 2 : n) : String(x); }
var was = process.argv[2] || 'z';
if (was === 'm1') {
  var a = lies('zaehlung-m1.json');
  var jahre = a.jeJahr; delete a.jeJahr;
  console.log(JSON.stringify(a));
  Object.keys(jahre).sort().forEach(function (j) { console.log(j, JSON.stringify(jahre[j])); });
}
if (was === 'z') {
  var z = lies('zaehlungen.json');
  console.log('reihen', JSON.stringify(z.reihen), '| lesart', z.lesart, '| letzter Panel-Tag', z.letzterPanelTag);
  console.log('M2', JSON.stringify({ alle: z.M2.alle, ohneZeit: z.M2.ohneZeit, knapp: z.M2.knappVorBeginn0900bis0930, ausserhalb: z.M2.einstiegAusserhalbKalender }));
  Object.keys(z.M2.jeJahr).sort().forEach(function (j) { console.log('  M2', j, JSON.stringify(z.M2.jeJahr[j])); });
  console.log('M3', JSON.stringify(z.M3));
  var j4 = z.M4.jeJahr; delete z.M4.jeJahr;
  console.log('M4', JSON.stringify(z.M4));
  Object.keys(j4).sort().forEach(function (j) { console.log('  M4', j, JSON.stringify(j4[j])); });
  var m5 = z.M5, jk = m5.jeJahrKlasse, jt = m5.jeJahrTageszeit; delete m5.jeJahrKlasse; delete m5.jeJahrTageszeit;
  console.log('M5', JSON.stringify(m5));
  Object.keys(jk).sort().forEach(function (j) { console.log('  M5', j, JSON.stringify(jk[j]), JSON.stringify(jt[j])); });
}
if (was === 'm6') {
  var m = lies('aufloesung.json');
  console.log('endetVorHorizont', JSON.stringify(m.endetVorHorizont), '| Sekunden', m.sekunden);
  console.log('Teilmenge | H | n | Tage | sd | naivAbst | seAbstTag | seAbstPool | MDE AbstTag | MDE AbstPool | seObenZufall | seObenReihe(NW) | MDE ObenZufall | MDE ObenReihe | MDE ObenPool');
  m.zeilen.forEach(function (r) {
    console.log([r.teilmenge, r.H, r.n, r.einstiegstage, f(r.sd), f(r.naivAbstand, 3), f(r.seAbstandTag, 3), f(r.seAbstandPool, 3), f(r.mdeAbstandTag) + ' (Reihe ' + f(r.mdeAbstandTagReihe) + ')', f(r.mdeAbstandPool),
      f(r.seObenTag, 3), f(r.nwObenTag, 3), f(r.mdeObenTagZufall), f(r.mdeObenTagReihe), f(r.mdeObenPool)].join(' | '));
    if (r.gleicherTag) console.log('    gleicherTag rho ' + f(r.gleicherTag.rho, 4) + ', je Tag ' + f(r.gleicherTag.jeTagMittel, 1) + ' (gewichtet ' + f(r.gleicherTag.jeTagGewichtet, 1) + '), Faktor volle Ballung ' + f(r.gleicherTag.faktorVolleBallung) +
      ' | Zuteilung je Tag: MDE Abstand ' + f(r.zuteilungJeTag.mdeAbstandTag) + ', MDE oben ' + f(r.zuteilungJeTag.mdeObenTag) +
      ' | gestutzt 1 %: sd ' + f(r.gestutzt1Prozent.sd) + ', MDE Abstand ' + f(r.gestutzt1Prozent.mdeAbstandTag) + ', MDE oben (Reihe) ' + f(r.gestutzt1Prozent.mdeObenTagReihe) +
      ' | Kunstfall: Abstand ' + f(r.kunstfall.eingepflanzterAbstand) + ' -> t>=2 in ' + f(100 * r.kunstfall.anteilTAbstandUeber2, 0) + ' %' +
      ' | Tage oben ' + f(r.tageObenMittel, 0) + ', Ereignisse oben ' + f(r.ereignisseOben, 0));
    if (r.kostenUmlaufMitte !== undefined) console.log('    Kosten je Umlauf: Mitte ' + f(r.kostenUmlaufMitte, 3) + ', Eroeffnung ' + f(r.kostenUmlaufEroeffnung, 3));
  });
}
