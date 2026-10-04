'use strict';
/* Trendfilter-Messung: Wirkung der vier belegten Yahoo-Fehler aus der Datenpruefung, NACHRICHTLICH (REGEL §2.6).
 *   node studien/trendfilter-messung-2026-10/wirkung-datenbefunde.js
 * Das Urteil bleibt auf den Yahoo-Daten. Hier wird derselbe Lauf (kern.messeRegel, alle drei Regeln, A, B, Zusatz) noch einmal
 * gerechnet, nachdem an genau den vier Stellen der Wert der zweiten Quelle eingesetzt ist (DATENPRUEFUNG.md Abschnitt 7, Stufe
 * „Vorbehalt"): drei veraltete SPY-Eroeffnungen (Yahoo = Vortagsschluss) und eine doppelt gebuchte AGG-Ausschuettung.
 * Die SPY-Eroeffnung der zweiten Quelle wird aus der dort berichteten relativen Abweichung d (in %, 4 Nachkommastellen)
 * zurueckgerechnet: O_zweite = O_yahoo / (1 + d/100); Genauigkeit rund 1e-6 relativ (wenige Cent auf 100.000 $).
 * Schreibt wirkung-datenbefunde.json. */
var fs = require('fs');
var path = require('path');
var K = require('./kern.js');
var L = require('./laden.js');

var BEFUNDE = [
  { reihe: 'SPY', tag: '2017-01-23', art: 'eroeffnung', abweichungProzent: 0.1723 },
  { reihe: 'SPY', tag: '2017-02-01', art: 'eroeffnung', abweichungProzent: -0.3154 },
  { reihe: 'SPY', tag: '2017-02-02', art: 'eroeffnung', abweichungProzent: 0.1849 },
  { reihe: 'AGG', tag: '2018-11-01', art: 'ausschuettung', zweiteQuelle: 0.25634 }
];

function ladeRoh(ordner) {
  var roh = {};
  L.KUERZEL.forEach(function (sym) { roh[sym] = L.lies(fs.readFileSync(path.join(ordner, sym + '.json'), 'utf8')); });
  return roh;
}

function patchen(roh) {
  var protokoll = [];
  BEFUNDE.forEach(function (b) {
    var r = roh[b.reihe];
    if (b.art === 'eroeffnung') {
      var z = r.zeilen.filter(function (x) { return x.tag === b.tag; });
      if (z.length !== 1) throw new Error('Zeile nicht eindeutig: ' + b.reihe + ' ' + b.tag);
      var alt = z[0].o;
      z[0].o = alt / (1 + b.abweichungProzent / 100);
      protokoll.push({ reihe: b.reihe, tag: b.tag, art: b.art, faktor: z[0].o / alt });
    } else {
      var d = r.div.filter(function (x) { return x.tag === b.tag; });
      if (d.length !== 1) throw new Error('Ausschuettung nicht eindeutig: ' + b.reihe + ' ' + b.tag);
      var altB = d[0].betrag;
      d[0].betrag = b.zweiteQuelle;
      protokoll.push({ reihe: b.reihe, tag: b.tag, art: b.art, verhaeltnisYahooZuZweiter: altB / b.zweiteQuelle });
    }
  });
  return protokoll;
}

function kern(m) {
  var aus = { urteil: m.urteil.satz, fenster: {} };
  ['A', 'B'].forEach(function (f) {
    var x = m.fenster[f];
    aus.fenster[f] = { k0EndwertRegel: x.k0.regel.endwert, k0EndwertSpy: x.k0.spy.endwert, k0AbstandPp: x.k0.abstandPp, vorn: x.starttage.vorn,
      median: x.starttage.median, minimum: x.starttage.minimum, maximum: x.starttage.maximum,
      n2AbstandPp: x.nachrichtlich.N2.k0.abstandPp, n2Median: x.nachrichtlich.N2.starttage.median,
      liste: x.starttage.liste.map(function (y) { return { start: y.start, regel: y.endwertRegel, spy: y.endwertSpy, abstand: y.abstandPp }; }) };
  });
  var z = m.zusatz.zusammen;
  aus.zusatz = { anteilVorn: z.anteilVorn, abstandMedian: z.abstandMedian, gesamtlaufAbstandPp: m.zusatz.gesamtlauf.abstandPp };
  return aus;
}

function haupt() {
  var ordner = path.join(__dirname, 'daten');
  var regeln = ['R1', 'R2', 'R3'].map(function (r) { return require('./regel-' + r + '.js'); });
  var Dy = K.baueDaten(ladeRoh(ordner));
  var roh2 = ladeRoh(ordner);
  var protokoll = patchen(roh2);
  var Dz = K.baueDaten(roh2);
  function messen(D) {
    var ez = K.ersterZusatzTag(D, regeln.map(function (d) { return d.signal(D, Object.assign({}, K.ERSATZ)); }));
    var aus = {};
    regeln.forEach(function (d) { aus[d.name] = kern(K.messeRegel(D, d, { zusatzErsterTag: ez, placeboLaeufe: 1 })); });
    return aus;
  }
  var vorher = messen(Dy), nachher = messen(Dz);
  var differenz = {};
  Object.keys(vorher).forEach(function (r) {
    differenz[r] = { urteilGleich: vorher[r].urteil === nachher[r].urteil, fenster: {} };
    ['A', 'B'].forEach(function (f) {
      var a = vorher[r].fenster[f], b = nachher[r].fenster[f];
      differenz[r].fenster[f] = { k0EndwertRegelDollar: b.k0EndwertRegel - a.k0EndwertRegel, k0EndwertSpyDollar: b.k0EndwertSpy - a.k0EndwertSpy,
        k0AbstandPp: b.k0AbstandPp - a.k0AbstandPp, vorn: b.vorn - a.vorn, medianPp: b.median - a.median, minimumPp: b.minimum - a.minimum,
        maximumPp: b.maximum - a.maximum, n2AbstandPp: b.n2AbstandPp - a.n2AbstandPp, n2MedianPp: b.n2Median - a.n2Median,
        starttageGeaendert: b.liste.map(function (y, i) { var x = a.liste[i]; return { start: y.start, regelDollar: y.regel - x.regel, spyDollar: y.spy - x.spy, abstandPp: y.abstand - x.abstand }; })
          .filter(function (y) { return Math.abs(y.regelDollar) > 0.005 || Math.abs(y.spyDollar) > 0.005; }) };
    });
    differenz[r].zusatz = { anteilVorn: nachher[r].zusatz.anteilVorn - vorher[r].zusatz.anteilVorn, abstandMedianPp: nachher[r].zusatz.abstandMedian - vorher[r].zusatz.abstandMedian,
      gesamtlaufAbstandPp: nachher[r].zusatz.gesamtlaufAbstandPp - vorher[r].zusatz.gesamtlaufAbstandPp };
  });
  var aus = { kennung: 'trendfilter-messung-2026-10/v1', zweck: 'REGEL §2.6: Wirkung der belegten Yahoo-Fehler, nachrichtlich; das Urteil bleibt auf den Yahoo-Daten.',
    befunde: BEFUNDE, eingesetzt: protokoll, vorher: vorher, nachher: nachher, differenz: differenz,
    hinweis: 'Placebo hier mit 1 Lauf (nicht ausgewertet); alle anderen Zahlen wie im Lauf.' };
  fs.writeFileSync(path.join(__dirname, 'wirkung-datenbefunde.json'), JSON.stringify(aus, null, 1) + '\n');
  Object.keys(differenz).forEach(function (r) {
    var d = differenz[r];
    console.log(r + ': Urteil gleich ' + d.urteilGleich + ' | A: k0 Abstand ' + d.fenster.A.k0AbstandPp.toFixed(4) + ' Pp, Median ' + d.fenster.A.medianPp.toFixed(4) +
      ', Endwert Regel ' + d.fenster.A.k0EndwertRegelDollar.toFixed(2) + ' $, SPY ' + d.fenster.A.k0EndwertSpyDollar.toFixed(2) + ' $, vorn ' + d.fenster.A.vorn +
      ' | B: k0 ' + d.fenster.B.k0AbstandPp.toFixed(4) + ', Median ' + d.fenster.B.medianPp.toFixed(4) + ' | Zusatz Median ' + d.zusatz.abstandMedianPp.toFixed(4) +
      ' Pp, vorn ' + (d.zusatz.anteilVorn * 100).toFixed(2) + ' | Starttage A geaendert: ' + d.fenster.A.starttageGeaendert.map(function (y) { return y.start + ' Regel ' + y.regelDollar.toFixed(2) + ' SPY ' + y.spyDollar.toFixed(2) + ' Abstand ' + y.abstandPp.toFixed(5); }).join('; ') + ' Pp, N2 A ' + d.fenster.A.n2AbstandPp.toFixed(4) + ' / B ' + d.fenster.B.n2AbstandPp.toFixed(4));
  });
}

if (require.main === module) haupt();
