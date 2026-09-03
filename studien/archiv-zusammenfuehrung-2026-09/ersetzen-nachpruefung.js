'use strict';
/* NACHPRUEFUNG der Skalenreparatur - unabhaengig vom Werkzeug, das geschrieben hat.
 *
 *   node studien/archiv-zusammenfuehrung-2026-09/ersetzen-nachpruefung.js
 *
 * Das Werkzeug prueft sich selbst mit derselben Rechnung, mit der es geschrieben hat
 * (Quellengrenzen). Diese Datei rechnet anders: sie haelt die sechs Dateien gegen die
 * SICHERUNG vom selben Tag und fragt vier Dinge, die nichts mit Grenzpaaren zu tun haben:
 *   1. Sind es genau dieselben Stempel wie vorher? (kein Verlust, kein Zuwachs)
 *   2. Sind die Yahoo-Kerzen Feld fuer Feld unveraendert?
 *   3. Wurden die Alpaca-Kerzen mit EINEM Faktor je Tag geteilt - und mit welchem?
 *      Die Faktoren werden aus dem Vergleich alt/neu ABGELESEN, nicht vorgegeben; die
 *      Erwartung (MNST 2 bis 10.08., SPGI 1,057 bis 30.06., sonst 1) steht darunter.
 *   4. Blieb der Umsatz unangetastet?
 * Dazu ein Stichtag gegen das TAGESARCHIV als dritte Quelle - nur an einem Tag, an dem
 * das Tagesarchiv selbst sauber ist (es hat denselben Fehler, MNST 07.08. steht dort auf
 * der alten Skala).
 *
 * Liest nur. Kein Netz, kein Zugang.
 */
var fs = require('fs');
var path = require('path');
var KQ = require('../../kerzenquelle.js');

var WURZEL = process.env.MD_ARCHIV_WURZEL || 'E:/Markt-Dashboard-Archiv';
var SICHERUNG = process.env.MD_SICHERUNG || path.join(WURZEL, 'sicherung-vor-ersetzen-2026-09-03');
var SYMBOLE = ['MNST', 'SPGI'];
var IVS = ['1m', '5m', '15m'];
var ERWARTET = {                      /* Kursfaktor alt/neu, den die Reparatur haben MUSS */
  MNST: function (tag) { return tag <= '2026-08-10' ? 2 : 1; },
  SPGI: function (tag) { return tag <= '2026-06-30' ? 1.057 : 1; },
};

function etTag(ms) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(ms));
}
function median(a) { if (!a.length) return null; var s = a.slice().sort(function (x, y) { return x - y; }); var m = Math.floor(s.length / 2); return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; }

var fehler = [], zeilen = [];
function sag(t) { console.log(t); zeilen.push(t); }
function pruefe(bed, was, ist) {
  if (!bed) fehler.push(was);
  sag((bed ? '  ok   ' : '  FEHL ') + was + (ist !== undefined ? '   ->  ' + JSON.stringify(ist) : ''));
}

sag('Nachpruefung der Skalenreparatur (' + new Date().toISOString() + ')');
sag('Archiv:    ' + WURZEL);
sag('Sicherung: ' + SICHERUNG + '\n');

SYMBOLE.forEach(function (sym) {
  IVS.forEach(function (iv) {
    var name = 'bars_' + iv + '_' + sym + '.json';
    var neu = KQ.huelleLesen(path.join(WURZEL, 'archiv' + iv, name));
    var alt = KQ.huelleLesen(path.join(SICHERUNG, name));
    if (!neu || !alt) { pruefe(false, name + ': Datei oder Sicherung fehlt'); return; }
    var jkNeu = KQ.quelleJeKerze(neu.series, neu.quellen);
    var jkAlt = KQ.quelleJeKerze(alt.series, alt.quellen);
    var altNach = {}, altQuelle = {};
    alt.series.forEach(function (k, i) { altNach[k[0]] = k; altQuelle[k[0]] = jkAlt[i] ? jkAlt[i].quelle : null; });

    /* 1. dieselben Stempel */
    var fehlt = 0, dazu = 0;
    neu.series.forEach(function (k) { if (!altNach[k[0]]) dazu++; });
    var neuNach = {}; neu.series.forEach(function (k) { neuNach[k[0]] = k; });
    alt.series.forEach(function (k) { if (!neuNach[k[0]]) fehlt++; });
    pruefe(fehlt === 0 && dazu === 0 && neu.series.length === alt.series.length,
      name + ': genau dieselben Stempel wie vorher', { vorher: alt.series.length, nachher: neu.series.length, fehlt: fehlt, dazu: dazu });

    /* 2. Yahoo unangetastet, und die Quellenmarken sind dieselben geblieben */
    var yGleich = 0, yUngleich = 0, quelleGewandert = 0;
    neu.series.forEach(function (k, i) {
      var q = jkNeu[i] ? jkNeu[i].quelle : null, a = altNach[k[0]];
      if (!a) return;
      if (q !== altQuelle[k[0]]) quelleGewandert++;
      if (q !== 'yahoo') return;
      if (JSON.stringify(k) === JSON.stringify(a)) yGleich++; else yUngleich++;
    });
    pruefe(yUngleich === 0 && quelleGewandert === 0,
      name + ': ' + yGleich + ' Yahoo-Kerzen Feld fuer Feld unveraendert, keine Kerze hat die Quelle gewechselt',
      { ungleich: yUngleich, quelleGewandert: quelleGewandert });

    /* 3. Kursfaktor je Tag, ABGELESEN aus alt/neu */
    var jeTag = {}, umsatzAbw = 0, aN = 0;
    neu.series.forEach(function (k, i) {
      if (!jkNeu[i] || jkNeu[i].quelle !== 'alpaca') return;
      var a = altNach[k[0]];
      if (!a || !(k[1] > 0)) return;
      aN++;
      var tag = etTag(k[0]);
      (jeTag[tag] || (jeTag[tag] = [])).push(a[1] / k[1]);
      if (a[2] !== k[2]) umsatzAbw++;
    });
    var schief = [];
    Object.keys(jeTag).sort().forEach(function (t) {
      var m = median(jeTag[t]), soll = ERWARTET[sym](t);
      if (Math.abs(m / soll - 1) > 0.0005) schief.push(t + ' gemessen ' + m.toFixed(5) + ' statt ' + soll);
    });
    var stufen = {};
    Object.keys(jeTag).forEach(function (t) { var m = median(jeTag[t]).toFixed(4); (stufen[m] || (stufen[m] = [])).push(t); });
    pruefe(schief.length === 0 && aN > 0,
      name + ': alle ' + aN + ' Alpaca-Kerzen auf ' + Object.keys(stufen).length + ' Tagesfaktor(en) - ' +
      Object.keys(stufen).sort().map(function (f) { var t = stufen[f].sort(); return f + ' an ' + t.length + ' Tagen (' + t[0] + '..' + t[t.length - 1] + ')'; }).join(', '),
      schief.length ? schief.slice(0, 5) : undefined);

    /* 4. Umsatz unangetastet */
    pruefe(umsatzAbw === 0, name + ': kein Umsatz veraendert (Yahoo bereinigt Intraday die Kurse, nicht die Stueckzahl)', umsatzAbw);
  });
});

/* 5. Dritte Quelle: das Tagesarchiv, an einem Tag, an dem es selbst sauber ist. */
sag('');
[['MNST', '2026-08-06'], ['SPGI', '2026-06-25']].forEach(function (x) {
  var sym = x[0], tag = x[1];
  var d = KQ.huelleLesen(path.join(WURZEL, 'archiv1d', 'bars_1d_' + sym + '.json'));
  var tages = d && d.series.filter(function (k) { return new Date(k[0]).toISOString().slice(0, 10) === tag; })[0];
  if (!tages) { pruefe(false, sym + ' ' + tag + ': keine Tageskerze'); return; }
  var h = KQ.huelleLesen(path.join(WURZEL, 'archiv5m', 'bars_5m_' + sym + '.json'));
  var jk = KQ.quelleJeKerze(h.series, h.quellen);
  var alp = [], yah = [];
  h.series.forEach(function (k, i) {
    if (etTag(k[0]) !== tag || !(k[2] > 0)) return;
    (jk[i] && jk[i].quelle === 'alpaca' ? alp : yah).push(k[1]);
  });
  var spanne = [tages[4] * 0.999, tages[3] * 1.001];
  var drin = alp.filter(function (c) { return c >= spanne[0] && c <= spanne[1]; }).length;
  pruefe(alp.length > 0 && drin === alp.length,
    sym + ' ' + tag + ': alle ' + alp.length + ' Alpaca-Schlusskurse liegen in der Tagesspanne des TAGESARCHIVS (' + tages[4].toFixed(2) + '–' + tages[3].toFixed(2) + ') - dritte Quelle, unabhaengig von Grenzpaaren',
    { drin: drin, von: alp.length, alpacaSpanne: alp.length ? [Math.min.apply(null, alp).toFixed(2), Math.max.apply(null, alp).toFixed(2)] : null,
      yahooSpanne: yah.length ? [Math.min.apply(null, yah).toFixed(2), Math.max.apply(null, yah).toFixed(2)] : null });
});

sag('\n' + (fehler.length ? 'NACHPRUEFUNG NICHT BESTANDEN: ' + fehler.length + ' Punkt(e)' : 'Nachpruefung bestanden.'));
if (process.env.MD_NACHPRUEFUNG_LOG) fs.writeFileSync(process.env.MD_NACHPRUEFUNG_LOG, zeilen.join('\n') + '\n');
process.exit(fehler.length ? 1 : 0);
