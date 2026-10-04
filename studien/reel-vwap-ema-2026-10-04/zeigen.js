'use strict';
/* Liest ergebnis.json und zeigt eine knappe Uebersicht aller 36 Laeufe (nur Anzeige, rechnet nichts neu). */
var path = require('path');
var E = require(path.join(__dirname, 'ergebnis.json'));
function p(x) { return (x * 100).toFixed(1); }
console.log('Regel Wert Fenster F | p.a. c=0 / Papier / 0,25 / 1,0 | t0 t025 | c* | Trades/Tag Treffer(c=0) BruttoBp/Trade Umsatz | MDD(c=0) Sharpe(c=0) | KH p.a.');
E.laeufe.forEach(function (l) {
  var k = l.kosten;
  console.log([l.regel, l.wert, l.fenster, l.fassung, '|', p(k['0'].pa), p(k.Papier.pa), p(k['0,25'].pa), p(k['1,0'].pa), '|', k['0'].t.toFixed(2), k['0,25'].t.toFixed(2), '|',
    l.cStern.toFixed(3), '|', k['0'].tradesJeTag.toFixed(1), p(k['0'].trefferquote), k['0'].bruttoJeTradeBp.toFixed(3), k['0'].tagesumsatz.toFixed(1), '|',
    p(k['0'].rueckschlag), k['0'].sharpe.toFixed(2), '|', p(l.kaufenHalten.pa)].join(' '));
});
var h = E.laeufe.filter(function (l) { return l.regel === 'R1' && l.wert === 'QQQ' && l.fassung === 'N' && l.fenster === 'W-Nach'; })[0];
['0', '0,25', '1,0'].forEach(function (c) {
  var k = h.kosten[c];
  console.log('Hauptlauf c=' + c + ': gesamt ' + p(k.gesamt) + ' pa ' + p(k.pa) + ' vol ' + p(k.vol) + ' sharpe ' + k.sharpe.toFixed(2) + ' mdd ' + p(k.rueckschlag) + ' treffer ' + p(k.trefferquote) +
    ' mittelTagBp ' + k.mittelTagBp.toFixed(2) + ' se ' + k.seTagBp.toFixed(2) + ' t ' + k.t.toFixed(2) + ' Jahre ' + Object.keys(k.jahre).map(function (j) { return j + ':' + p(k.jahre[j]); }).join(' ') +
    ' Anteile(log) ' + [k.logErtrag.ersteStunde, k.logErtrag.mitte, k.logErtrag.letzteStunde].map(function (x) { return x.toFixed(3); }).join('/'));
});
console.log('Daten: ' + JSON.stringify(E.daten));
console.log('Ereignisse W-Papier und W-Vor (Regel Wert Fenster H n Mittel t):');
E.ereignisse.filter(function (x) { return x.fenster !== 'W-Nach'; }).forEach(function (x) {
  console.log([x.regel, x.wert, x.fenster, 'H' + x.H, x.n, x.mittelBp.toFixed(2), x.t.toFixed(1)].join(' '));
});
