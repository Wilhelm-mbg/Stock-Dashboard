'use strict';
/* ================= DER RANDZAEHLER: Live gegen Messung am jungen Ende =================
 *
 * WOFUER. Live und Messung lesen dieselbe Quelle, aber auf zwei Wegen:
 *   depot.js -> kurse.js       prueft die Sekunde NICHT  (0 Vorkommen)
 *   Archiv   -> kerzenquelle.js prueft sie                (2 Vorkommen)
 * Yahoo haengt an jede Antwort eine Kerze aus dem aktuellen Quote. Waehrend der
 * Sitzung traegt sie eine krumme Sekunde (gemessen: 18:51:44) und faellt bei
 * kerzenquelle heraus, bei kurse nicht. Der Live-Pfad rechnet dann auf einer Reihe,
 * die um EINE Kerze laenger ist - am jungen Ende. Fuer alles, was rueckwaerts zaehlt
 * (RSI-Perioden, Rueckblickfenster, Haltedauern), verschiebt das JEDEN Index um eins,
 * durchgehend und nicht nur ueber einen Tag.
 *
 * NACH HANDELSSCHLUSS VERSCHWINDET DER EFFEKT: der Quote friert auf dem Schlusskurs
 * ein, wird auf 20:00:00 gerundet, hat Sekunde 0 und passiert BEIDE Wege.
 *
 * DARAUS FOLGT DIE WICHTIGSTE EIGENSCHAFT DIESES WERKZEUGS: Wer nach Schluss misst,
 * misst die Bedingung, in der der Effekt nicht auftreten kann - und bekommt null.
 * Das saehe aus wie eine Entwarnung. Deshalb ist der Nachtlauf hier nicht der
 * Messlauf, sondern die KONTROLLE mit Sollwert null; und ein Lauf waehrend der
 * Sitzung, der null meldet, ist ein Hinweis auf eine kaputte Sonde und nicht auf
 * eine heile Welt.
 *
 * DIESES WERKZEUG MISST NUR (Zaehler A, Exposition). Es fasst die Handelslogik
 * nicht an und ruft keinen Detektor auf - Zaehler B (Wirkung) braucht einen reinen
 * Einstiegspunkt in die Detektoren und wartet auf die Klaerung.
 *
 * Aufruf aus der Repo-Wurzel:
 *     node tools/randzaehler.js [intervall] [anzahl]
 *     node tools/randzaehler.js 60m 40
 * Ablage: <Datenordner>/randzaehler.jsonl, angehaengt, nie ueberschrieben.
 */
var fs = require('fs');
var path = require('path');
var Q = require('../kerzenquelle.js');
var K = require('../kurse.js');
var P = require('../sammelplan.js');

var IV = process.argv[2] || '60m';
var ANZAHL = parseInt(process.argv[3], 10) || 40;
if (!Q.INTERVALLE[IV]) { console.error('Unbekanntes Intervall: ' + IV); process.exit(2); }

/* Die Mess-Basis wird NICHT nachgebaut, sondern aus kerzenquelle.js geholt. Eine
 * zweite Fassung derselben Regel waere die dritte Sicht auf dieselbe Reihe - und
 * genau daran ist hier schon zu viel gescheitert. */
function messBasis(bars, reg, jetzt) {
  var aus = bars.slice();
  while (aus.length && !Q.fertigeKerze(aus[aus.length - 1][0], reg, jetzt, IV)) aus.pop();
  return aus;
}

(async function () {
  var jetzt = Date.now();
  var offen = P.marktOffen(jetzt);
  var b = P.symboleFuer(P.einstellungen(null));
  if (b.grund) { console.error(b.grund); process.exit(3); }
  var nimm = b.symbole.slice(0, ANZAHL);

  console.log('Randzaehler ' + IV + ', ' + nimm.length + ' Werte');
  console.log('  ' + new Date(jetzt).toISOString() + '   Markt ' + (offen ? 'OFFEN - Messlauf' : 'zu - KONTROLLLAUF, Sollwert 0'));
  console.log('');

  var betroffen = 0, geprueft = 0, fehler = 0;
  var lGes = 0, mGes = 0;
  var beispiele = [];
  for (var i = 0; i < nimm.length; i++) {
    var sym = nimm[i];
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' +
      encodeURIComponent(Q.yahooName(sym)) + '?range=' + Q.INTERVALLE[IV].range + '&interval=' + IV;
    var r;
    try { r = await Q.hole(url); } catch (e) { fehler++; continue; }
    if (r.status !== 200) { fehler++; await Q.warte(Q.ABSTAND_MS); continue; }
    var res;
    try { res = JSON.parse(r.body).chart.result[0]; } catch (e2) { fehler++; await Q.warte(Q.ABSTAND_MS); continue; }
    var live = K.zerlege(r.body, { bereinigt: false, offenRoh: true });
    if (!live || !live.bars.length) { fehler++; await Q.warte(Q.ABSTAND_MS); continue; }
    var reg = res.meta && res.meta.currentTradingPeriod && res.meta.currentTradingPeriod.regular;
    var mess = messBasis(live.bars, reg, jetzt);
    geprueft++;
    /* BEIDE ZAHLEN AUSWEISEN, nicht nur ihre Differenz: 262 gegen 261 ist eine andere
     * Lage als 262 gegen 255, und die Differenz allein sagt es nicht. */
    lGes += live.bars.length; mGes += mess.length;
    var d = live.bars.length - mess.length;
    if (d > 0) {
      betroffen++;
      if (beispiele.length < 5) {
        var k = live.bars[live.bars.length - 1];
        beispiele.push(sym + '  L=' + live.bars.length + ' M=' + mess.length +
          '  Endkerze ' + new Date(k[0]).toISOString() + '  v=' + k[2]);
      }
    }
    if (i < nimm.length - 1) await Q.warte(Q.ABSTAND_MS);
  }

  var anteil = geprueft ? betroffen / geprueft : 0;
  console.log('Reihen geprueft        : ' + geprueft + '   (Fehlschlaege ' + fehler + ')');
  console.log('davon betroffen        : ' + betroffen + '   (' + (100 * anteil).toFixed(1) + ' %)');
  console.log('Kerzen Live gesamt     : ' + lGes.toLocaleString('de-DE'));
  console.log('Kerzen Messung gesamt  : ' + mGes.toLocaleString('de-DE'));
  console.log('Differenz              : ' + (lGes - mGes));
  if (beispiele.length) { console.log('\nBeispiele:'); beispiele.forEach(function (z) { console.log('   ' + z); }); }

  /* Die Kontrolle steht IM Werkzeug, nicht im Kopf des Lesers. */
  var urteil;
  if (!offen) {
    urteil = betroffen === 0 ? 'KONTROLLE BESTANDEN (Markt zu, keine Abweichung - erwartet)'
      : 'KONTROLLE GESCHEITERT: bei zu Markt darf es KEINE Abweichung geben';
  } else {
    urteil = betroffen === 0 ? 'VERDACHT AUF DEFEKTE SONDE: bei offenem Markt sollte fast jede Reihe betroffen sein'
      : 'Messlauf gueltig';
  }
  console.log('\n' + urteil);

  var zeile = JSON.stringify({
    zeit: new Date(jetzt).toISOString(), intervall: IV, marktOffen: offen,
    geprueft: geprueft, betroffen: betroffen, anteil: anteil,
    kerzenLive: lGes, kerzenMessung: mGes, fehlschlaege: fehler, urteil: urteil,
  });
  var datei = path.join(Q.datenOrdner(), 'randzaehler.jsonl');
  try { fs.appendFileSync(datei, zeile + '\n'); console.log('angehaengt an ' + datei); }
  catch (e) { console.log('konnte nicht schreiben: ' + (e && e.message)); }

  /* Rueckgabe 1 nur bei kaputter Sonde - eine gemessene Abweichung ist ein Befund,
   * kein Fehlschlag des Werkzeugs. */
  process.exit(/GESCHEITERT|DEFEKTE/.test(urteil) ? 1 : 0);
})();
