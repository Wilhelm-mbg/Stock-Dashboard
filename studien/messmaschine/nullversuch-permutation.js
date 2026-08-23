'use strict';
/* NULLVERSUCH DURCH VERTAUSCHUNG.
 *
 * Anlass: Am 23.08.2026 kam T3 (Stunden-Drift) als WIDERLEGT durch (t = -3,19) und
 * T1 (Zwangsglattstellung) als BESTAETIGT (t = 2,97) - beides auf Daten, in denen
 * der jeweilige Effekt nicht existieren KANN. Der Nullpunkt der Maschine liegt also
 * nicht bei null.
 *
 * WOHER DIE VERZERRUNG KOMMT. Die Kontrolle ist der Mittelwert des Symbols zu dieser
 * Stunde ueber die ganze Haelfte - ein ENDLICHER Topf von rund 366 Werten. Jedes
 * Signal, das seine Auswahl aus demselben Topf speist, verschiebt den Rest:
 *   - T3 waehlt Kerzen, deren vorige 60 Vorkommen HOCH lagen. Liegt die Summe des
 *     Topfes fest, muessen die uebrigen tiefer liegen - und aus denen wird gezogen.
 *     Sog nach unten.
 *   - T1 waehlt Tage nach einem starken Verlust. Der Tagesverlust enthaelt denselben
 *     Stundenschritt, aus dessen Topf spaeter das Ergebnis gezogen wird. Liegt ein
 *     Zug extrem tief, liegen die uebrigen leicht hoeher. Sog nach oben.
 * Beide Male ist die Ursache dieselbe endliche Ueberschneidung, nur das Vorzeichen
 * haengt an der Bauart des Signals. Man kann sie also nicht einmal ausrechnen und
 * abziehen - man muss sie je Strategie messen.
 *
 * WIE MAN DAS PRUEFT, OHNE KURSE ZU ERFINDEN. Wilhelm hat frueher zu Recht
 * eingewandt, dass ausgedachte Kurse nie so aussehen wie echte. Hier werden keine
 * erfunden: Es sind SEINE Renditen, jede einzelne, mit ihren echten Ausreissern und
 * ihrer echten Streuung. Vertauscht wird nur die REIHENFOLGE - und zwar innerhalb
 * jeder UTC-Stunde getrennt, damit der Stundenmittelwert und damit die Kontrolle
 * exakt erhalten bleibt (nachgeprueft: gleich bis auf die fuenfte Nachkommastelle).
 *
 * Damit ist die Wahrheit bekannt: In dieser Reihe KANN die Vergangenheit die Zukunft
 * nicht vorhersagen. Was die Maschine hier findet, stammt aus dem Verfahren.
 *
 * Aufruf:  node nullversuch-permutation.js [zielordner] [saat]
 * Als Baustein: require(...).baue(quelle, ziel, saat)
 */
var fs = require('fs');
var path = require('path');
var os = require('os');

function baue(quelle, ziel, saat) {
  /* Fester Startwert: derselbe Aufruf erzeugt dieselbe Vertauschung. */
  var s = saat >>> 0;
  function wuerfel() { s = (s * 1103515245 + 12345) % 2147483648; return s / 2147483648; }

  if (!fs.existsSync(ziel)) fs.mkdirSync(ziel, { recursive: true });
  var dateien = fs.readdirSync(quelle).filter(function (f) { return f.indexOf('bars_60m_') === 0; });
  var gebaut = 0, uebersprungen = 0;

  dateien.forEach(function (f) {
    var j;
    try { j = JSON.parse(fs.readFileSync(path.join(quelle, f), 'utf8')); } catch (e) { uebersprungen++; return; }
    var b = j.series;
    if (!Array.isArray(b) || b.length < 300) { uebersprungen++; return; }

    /* Jeder Schritt k -> k+1 gehoert zur Stunde von k. Nach Stunde getrennt sammeln. */
    var koerbe = {};
    for (var k = 0; k < b.length - 1; k++) {
      var h = new Date(b[k][0]).getUTCHours();
      var p0 = b[k][1], p1 = b[k + 1][1];
      (koerbe[h] = koerbe[h] || []).push((p0 > 0 && p1 > 0) ? p1 / p0 - 1 : 0);
    }
    Object.keys(koerbe).forEach(function (h) {
      var a = koerbe[h];
      for (var q = a.length - 1; q > 0; q--) { var w = Math.floor(wuerfel() * (q + 1)); var t = a[q]; a[q] = a[w]; a[w] = t; }
    });

    /* Reihe neu aufbauen: gleicher Anfangskurs, gleiche Zeitstempel, gleiche Umsaetze. */
    var zeiger = {};
    var neu = [b[0].slice()];
    for (var i = 0; i < b.length - 1; i++) {
      var hh = new Date(b[i][0]).getUTCHours();
      zeiger[hh] = zeiger[hh] || 0;
      var r = koerbe[hh][zeiger[hh]++];
      var kurs = neu[i][1] * (1 + r);
      var alt = b[i + 1];
      var fH = alt[1] > 0 && alt[3] != null ? alt[3] / alt[1] : 1;
      var fT = alt[1] > 0 && alt[4] != null ? alt[4] / alt[1] : 1;
      neu.push([alt[0], kurs, alt[2], kurs * fH, kurs * fT]);
    }

    fs.writeFileSync(path.join(ziel, f), JSON.stringify({
      quelle: 'Nullversuch: Renditen von ' + f + ', innerhalb jeder UTC-Stunde vertauscht (Saat ' + saat + ')',
      hinweis: 'KEINE Marktdaten. Nur fuer die Pruefung des Messverfahrens.',
      series: neu,
    }));
    gebaut++;
  });
  return { gebaut: gebaut, uebersprungen: uebersprungen, ziel: ziel, saat: saat };
}

module.exports = { baue: baue };

if (require.main === module) {
  var quelle = process.env.MD_STORE || path.join(process.env.APPDATA || '', 'Markt-Dashboard', 'store');
  var ziel = process.argv[2] || path.join(os.tmpdir(), 'md-nullversuch-store');
  var saat = parseInt(process.argv[3], 10) || 20260823;
  var r = baue(quelle, ziel, saat);
  console.log('Nullversuch-Archiv gebaut: ' + r.gebaut + ' Reihen (' + r.uebersprungen + ' uebersprungen), Saat ' + saat);
  console.log('Ablage: ' + r.ziel);
  console.log('\nIn dieser Reihe kann die Vergangenheit die Zukunft nicht vorhersagen.');
  console.log('Was die Maschine hier findet, stammt aus dem Verfahren.');
}
