'use strict';
/* NULLVERSUCH DURCH VERTAUSCHUNG - GEGENPROBE, NICHT HAUPTWEG.
 *
 * STAND 23.08.2026 NACH DER GEGENPRUEFUNG. Dieses Werkzeug hat den Fehlertyp A6
 * aufgedeckt (die Kontrolle enthielt Kerzen, die das Signal gelesen hatte). Die
 * Abhilfe dafuer ist inzwischen A7 - die Kontrolle laesst das Lesefenster aus, und
 * damit ist die Verzerrung nicht mehr gemessen, sondern unmoeglich. Der Nullversuch
 * bleibt als GEGENPROBE: Er zeigt, ob die Maschine auf Daten ohne Vorhersagbarkeit
 * tatsaechlich nichts findet.
 *
 * WAS ER KANN. Auf einem vertauschten Archiv fiel t3-stundendrift vor A7 mit
 * t = -8,07 als "widerlegt" durch; nach A7 sind es t = -0,66. Das ist der Nachweis,
 * dass A7 wirkt.
 *
 * WAS ER NICHT KANN - und das ist beim Lesen der Zahlen entscheidend:
 * Jedes Symbol wird EINZELN gewuerfelt. Damit ist der Gleichlauf der Werte
 * zerstoert: In Wirklichkeit bewegen sich an einem Markttag fast alle Werte
 * gemeinsam, im Nullarchiv nicht. Ein Tagesmittel ueber 190 Werte streut dort also
 * viel weniger als in echt. Gemessen: der Standardfehler bricht auf rund 45 % ein.
 * FOLGE: Auf einem Nullarchiv sind t-Werte systematisch zu gross. Genau das - und
 * NICHT eine Verzerrung - hat am 23.08.2026 das "t1 BESTAETIGT (t = 2,97)" erzeugt.
 * Der Punktschaetzer war dort +0,0946 Pp gegen +0,0933 Pp auf den echten Daten,
 * praktisch gleich; nur der Standardfehler fiel von 0,0707 auf 0,0319.
 * Ein Nullarchiv taugt daher zur Pruefung von VERZERRUNG, nie von SIGNIFIKANZ.
 *
 * WAS VERTAUSCHT WIRD. Nicht die Rendite allein, sondern die ganze Kerze als
 * Einheit: Rendite, Umsatz und die Form (Hoch und Tief relativ zum Schluss) reisen
 * gemeinsam. Alles andere zerstoert Kopplungen, die Strategien benutzen:
 *   - Blieb der Umsatz am alten Platz liegen, fiel die Kopplung zwischen |Rendite|
 *     und Umsatz von 0,40 auf 0,14, und t2-umsatzschock verlor 57 % seiner Signale.
 *     Der Nullversuch mass dann ein anderes, halb so haeufiges Signal.
 *   - Wurden Hoch und Tief proportional zum neuen Schluss skaliert, enthielt die
 *     Kerzenspanne den Vorschluss nur noch in 49,5 % statt 90,1 % der Faelle, und
 *     ein 1-%-Stop loeste in 16,7 % statt 10,5 % der Kerzen aus. Damit war der
 *     Nullversuch fuer jede Stop-Regel wertlos.
 *
 * DER WUERFEL. Vorher: s = (s*1103515245 + 12345) % 2147483648 in Gleitkomma. Ab
 * dem zweiten Schritt ueberschreitet das Produkt 2^53, die Rechnung verliert
 * Stellen, und der Generator faellt auf einen Ring der Laenge 10.466 - alle 30
 * benutzten Saaten landeten auf demselben. Ein einziges Archiv braucht 1,1 Mio
 * Ziehungen, also 106 Umlaeufe. Jetzt mulberry32 mit Math.imul, also exakter
 * 32-Bit-Arithmetik.
 *
 * Aufruf:  node nullversuch-permutation.js [zielordner] [saat]
 * Baustein: require(...).baue(quelle, ziel, saat)
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

/* mulberry32 - ganzzahlig ueber Math.imul, Periode 2^32, in dieser Anwendung
 * millionenfach ueber jedem Bedarf. */
function wuerfelAus(saat) {
  var a = saat >>> 0;
  return function () {
    a = (a + 0x6D2B79F5) >>> 0;
    var t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function baue(quelle, ziel, saat) {
  var wuerfel = wuerfelAus(saat);
  if (!fs.existsSync(ziel)) fs.mkdirSync(ziel, { recursive: true });
  var dateien = fs.readdirSync(quelle).filter(function (f) { return f.indexOf('bars_60m_') === 0; });
  var gebaut = 0, uebersprungen = 0;

  dateien.forEach(function (f) {
    var j;
    try { j = JSON.parse(fs.readFileSync(path.join(quelle, f), 'utf8')); } catch (e) { uebersprungen++; return; }
    var b = j.series;
    if (!Array.isArray(b) || b.length < 300) { uebersprungen++; return; }

    /* Der Schritt k -> k+1 gehoert zur Stunde von k. Gesammelt wird die ganze
     * Zielkerze als Einheit: Rendite, Umsatz, Form. */
    var koerbe = {};
    for (var k = 0; k < b.length - 1; k++) {
      var h = new Date(b[k][0]).getUTCHours();
      var p0 = b[k][1], p1 = b[k + 1][1];
      var z = b[k + 1];
      koerbe[h] = koerbe[h] || [];
      koerbe[h].push({
        r: (p0 > 0 && p1 > 0) ? p1 / p0 - 1 : 0,
        v: z[2] || 0,
        fH: (p1 > 0 && z[3] != null) ? z[3] / p1 : 1,
        fT: (p1 > 0 && z[4] != null) ? z[4] / p1 : 1,
      });
    }
    Object.keys(koerbe).forEach(function (h) {
      var a = koerbe[h];
      for (var q = a.length - 1; q > 0; q--) {
        var w = Math.floor(wuerfel() * (q + 1));
        var tmp = a[q]; a[q] = a[w]; a[w] = tmp;
      }
    });

    /* Reihe neu aufbauen: gleicher Anfangskurs, gleiche Zeitstempel. Alles andere
     * reist mit der Rendite mit. */
    var zeiger = {};
    var neu = [b[0].slice()];
    for (var i = 0; i < b.length - 1; i++) {
      var hh = new Date(b[i][0]).getUTCHours();
      zeiger[hh] = zeiger[hh] || 0;
      var e = koerbe[hh][zeiger[hh]++];
      var kurs = neu[i][1] * (1 + e.r);
      neu.push([b[i + 1][0], kurs, e.v, kurs * e.fH, kurs * e.fT]);
    }

    fs.writeFileSync(path.join(ziel, f), JSON.stringify({
      quelle: 'Nullversuch: Kerzen von ' + f + ', innerhalb jeder UTC-Stunde vertauscht (Saat ' + saat + '). ' +
              'Rendite, Umsatz und Kerzenform reisen gemeinsam.',
      hinweis: 'KEINE Marktdaten. Nur zur Pruefung des Messverfahrens. t-Werte sind hier systematisch ' +
               'zu gross, weil der Gleichlauf der Werte fehlt - nur fuer Verzerrung auswerten, nie fuer Signifikanz.',
      series: neu,
    }));
    gebaut++;
  });
  return { gebaut: gebaut, uebersprungen: uebersprungen, ziel: ziel, saat: saat };
}

module.exports = { baue: baue, wuerfelAus: wuerfelAus };

if (require.main === module) {
  var quelle = process.env.MD_STORE || path.join(process.env.APPDATA || '', 'Markt-Dashboard', 'store');
  var ziel = process.argv[2] || path.join(os.tmpdir(), 'md-nullversuch-store');
  var saat = parseInt(process.argv[3], 10) || 20260823;
  var r = baue(quelle, ziel, saat);
  console.log('Nullversuch-Archiv gebaut: ' + r.gebaut + ' Reihen (' + r.uebersprungen + ' uebersprungen), Saat ' + saat);
  console.log('Ablage: ' + r.ziel);
  console.log('\nNur fuer VERZERRUNG auswerten. t-Werte sind hier zu gross, weil jedes');
  console.log('Symbol einzeln gewuerfelt wird und der Gleichlauf der Werte fehlt.');
}
