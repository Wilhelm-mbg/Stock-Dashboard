'use strict';
/* Zeigt aus daten-zaehlung.json die unvollstaendigen Tage (ohne die verkuerzten mit genau 210 Kerzen)
 * und den Kopf der Massnahmen-Dateien (nur Stand und Zeitraum). Liest keine Kurse. */
var path = require('path');
var D = require('./daten');
var z = require(path.join(__dirname, 'daten-zaehlung.json'));
D.WERTE.forEach(function (sym) {
  var w = z.werte[sym];
  var rest = w.tageUnter380Liste.filter(function (t) { return t.kerzen !== 210; });
  console.log(sym + ' unvollstaendig: ' + rest.map(function (t) { return t.datum + ':' + t.kerzen + '(' + t.erste + '-' + t.letzte + ')'; }).join(' '));
  console.log(sym + ' letzte Kerze anders: ' + JSON.stringify(w.letzteKerzeAndersListe));
  var m = D.ladeMassnahmen(sym);
  console.log(sym + ' Massnahmen stand=' + m.stand + ' von=' + m.von + ' bis=' + m.bis + ' saetze=' + (Array.isArray(m.saetze) ? m.saetze.length : typeof m.saetze) +
    ' anwendbar=' + (Array.isArray(m.anwendbar) ? m.anwendbar.length : typeof m.anwendbar) + ' ohneFaktor=' + (Array.isArray(m.ohneFaktor) ? m.ohneFaktor.length : typeof m.ohneFaktor));
});
var v = z.werte.QQQ.tageUnter380Liste.filter(function (t) { return t.kerzen === 210; }).map(function (t) { return t.datum; });
console.log('verkuerzte Tage (QQQ, 210 Kerzen): ' + v.join(' '));
