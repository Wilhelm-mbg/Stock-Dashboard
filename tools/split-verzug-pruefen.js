'use strict';
/* SPLIT-VERZUG PRUEFEN - hat der Nachladelauf die Skala nachgezogen?
 *
 * WARUM ES DIESES WERKZEUG GIBT UND NICHT NUR EINE NOTIZ. Am 27.08.2026 standen
 * zwei Reihen mit ungeglaettetem Aktiensplit im Tagesarchiv (WHLR ein Faktor 4,
 * am selben Tag ausgefuehrt; IESC ein 1:2 vom 24.08., also drei Naechte alt).
 * Die Verabredung lautete: NICHT von Hand reparieren, sondern nachsehen, ob der
 * Nachtlauf es von selbst richtet. Diese Pruefung war einer Sitzung zugeteilt -
 * und eine Pruefung, die an einer laufenden Sitzung haengt, faellt mit ihr aus.
 * Deshalb steht sie hier als Befehl, den jeder ausfuehren kann.
 *
 * WAS SIE BEANTWORTET, mit den drei Ausgaengen, die vorher verabredet waren:
 *   GEHEILT           - der Sprung ist weg, die Selbstheilung ueber das Nachladen
 *                       traegt. Nichts zu tun.
 *   QUELLEN-VERZUG    - der Sprung steht noch im Archiv, aber die QUELLE liefert
 *                       die Historie selbst unangepasst. Nicht unser Fehler: das
 *                       Zusammenfuehren loescht nie, also bleibt stehen, was da
 *                       ist, wenn nichts Neues kommt. Am 27.08. war IESC genau so.
 *   MISCH-FEHLER      - der schwere Fall: die Quelle liefert ANGEPASST, unser
 *                       Archiv bleibt trotzdem alt. Dann kommt Richtiges an und
 *                       wird nicht uebernommen - das betraefe jede Reihe, nicht
 *                       nur diese. Sofort melden.
 *
 * ZWEI DINGE, DIE SIE NICHT TUT: Sie repariert nichts (zaehlen vor aendern), und
 * sie laeuft nicht, waehrend das Archiv geschrieben wird - ein halb geschriebener
 * Stand sieht aus wie ein Befund. Liegt eine Sperre, bricht sie mit Code 2 ab.
 *
 * Aufruf:  node tools/split-verzug-pruefen.js [SYM ...]      (ohne Argumente: die bekannten Faelle)
 * Nur lesend auf dem Archiv; Netz nur fuer die frischen Abrufe. */
var fs = require('fs');
var path = require('path');
var https = require('https');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv1d';
var SPRUNG_AB = 0.30;          // Kursverhaeltnis, ab dem ein Sprung als Skalenbruch gilt
var LETZTE_KERZEN = 40;        // so weit zurueck wird gesucht

/* Der Stand vom 27.08.2026 abends, VOR dem Nachladelauf - selbst gemessen, damit
 * "vorher/nachher" belegbar ist und nicht aus der Erinnerung kommt. */
var VORHER = {
  IESC: { sprungBei: '2026-08-24', von: 685.04, auf: 325.01, faktor: 0.474, splitLautQuelle: '2:1 am 24.08.' },
  WHLR: { hinweis: 'Faktor 4 am aktuellen Rand, Split am 27.08. ausgefuehrt (Befund der Messseite, ba8d99d)' }
};
var BEKANNTE = ['IESC', 'WHLR', 'RGR', 'SITC', 'BYND'];

function datei(sym) {
  var kand = [path.join(ARCHIV, 'bars_1d_' + sym + '.json'), path.join(ARCHIV, 'etf', 'bars_1d_' + sym + '.json')];
  for (var i = 0; i < kand.length; i++) if (fs.existsSync(kand[i])) return kand[i];
  return null;
}
function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

/** Der groesste Kurssprung am Reihenende - der Skalenbruch, wenn es einen gibt. */
function groessterSprung(series) {
  var beste = null;
  var ab = Math.max(1, series.length - LETZTE_KERZEN);
  for (var i = ab; i < series.length; i++) {
    var v = series[i - 1][1], n = series[i][1];
    if (!v || !n) continue;
    var q = n / v;
    var abw = Math.abs(Math.log(q));
    if (abw < Math.log(1 + SPRUNG_AB)) continue;
    if (!beste || abw > beste.abw) beste = { abw: abw, quotient: q, tag: tagVon(series[i][0]), von: v, auf: n };
  }
  return beste;
}

function holeQuelle(sym) {
  return new Promise(function (resolve) {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
      '?range=3mo&interval=1d&includePrePost=false&events=splits';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function (res) {
      var buf = '';
      res.on('data', function (d) { buf += d; });
      res.on('end', function () { resolve({ status: res.statusCode, body: buf }); });
    }).on('error', function (e) { resolve({ status: 0, body: String(e.message) }); });
  });
}
function schlaf(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

(async function () {
  /* Nicht messen, waehrend geschrieben wird. */
  var sperre = path.join(ARCHIV, '_laeuft.json');
  if (fs.existsSync(sperre)) {
    var s = '';
    try { s = fs.readFileSync(sperre, 'utf8').replace(/\s+/g, ' '); } catch (e) { s = '(unlesbar)'; }
    console.error('Das Tagesarchiv wird gerade geschrieben - eine Messung darauf waere ein halb\n' +
      'geschriebener Stand und saehe aus wie ein Befund. Spaeter wiederkommen.\n  ' + s);
    process.exit(2);
  }

  var syms = process.argv.slice(2).filter(function (a) { return !/^--/.test(a); });
  if (!syms.length) syms = BEKANNTE;
  console.log('Split-Verzug, geprueft am ' + new Date().toISOString().slice(0, 16) + ' UTC\n');

  var urteile = {};
  for (var i = 0; i < syms.length; i++) {
    var sym = syms[i];
    var f = datei(sym);
    if (!f) { console.log(sym.padEnd(6) + 'keine Archivdatei'); urteile[sym] = 'fehlt'; continue; }
    var s = null;
    try { s = JSON.parse(fs.readFileSync(f, 'utf8')).series; } catch (e) { s = null; }
    if (!Array.isArray(s) || s.length < 3) { console.log(sym.padEnd(6) + 'Reihe unbrauchbar'); urteile[sym] = 'fehlt'; continue; }
    var archivSprung = groessterSprung(s);

    var q = await holeQuelle(sym);
    await schlaf(400);
    var quelleSprung = null, splits = {}, quelleOk = false;
    if (q.status === 200) {
      try {
        var j = JSON.parse(q.body).chart.result[0];
        var ts = j.timestamp || [], cl = (j.indicators.quote[0] || {}).close || [];
        var reihe = [];
        for (var t = 0; t < ts.length; t++) if (cl[t] != null) reihe.push([ts[t] * 1000, cl[t]]);
        if (reihe.length > 2) { quelleSprung = groessterSprung(reihe); quelleOk = true; }
        splits = (j.events && j.events.splits) || {};
      } catch (e) { quelleOk = false; }
    }

    /* "Kein Sprung" ist NICHT dasselbe wie "geheilt": lag im Pruef-Fenster nie
     * ein Split, gibt es auch nichts zu heilen. Geheilt heisst: die Quelle kennt
     * einen Split, und unser Archiv zeigt trotzdem keinen Bruch mehr. Ohne diese
     * Trennung meldete das Werkzeug Erfolg, wo nur nichts zu sehen war - dieselbe
     * Verwechslung wie "ruht, weil abgeschaltet" gegen "ruht, weil nichts faellig". */
    var splitBekannt = Object.keys(splits).length > 0;
    var urteil;
    if (!archivSprung) urteil = splitBekannt ? 'GEHEILT' : 'KEIN FALL IM FENSTER';
    else if (!quelleOk) urteil = 'QUELLE-UNKLAR';
    else if (quelleSprung) urteil = 'QUELLEN-VERZUG';
    else urteil = 'MISCH-FEHLER';
    urteile[sym] = urteil;

    console.log(sym.padEnd(6) + urteil);
    console.log('       Archiv:  ' + (archivSprung
      ? 'Sprung am ' + archivSprung.tag + ': ' + archivSprung.von.toFixed(2) + ' -> ' + archivSprung.auf.toFixed(2) +
        ' (Faktor ' + archivSprung.quotient.toFixed(3) + ')'
      : 'kein Sprung ueber ' + Math.round(SPRUNG_AB * 100) + ' % in den letzten ' + LETZTE_KERZEN + ' Kerzen'));
    console.log('       Quelle:  ' + (!quelleOk ? 'nicht lesbar (HTTP ' + q.status + ')'
      : quelleSprung ? 'fuehrt selbst noch einen Sprung am ' + quelleSprung.tag + ' (Faktor ' +
          quelleSprung.quotient.toFixed(3) + ') - unangepasst'
      : 'liefert die Historie angepasst (kein Sprung mehr)'));
    var splitTage = Object.keys(splits).map(function (k) {
      return tagVon(splits[k].date * 1000) + ' ' + (splits[k].splitRatio || '?');
    });
    console.log('       Splits laut Quelle: ' + (splitTage.length ? splitTage.join(', ') : 'keine im Fenster'));
    if (VORHER[sym]) {
      console.log('       Vorher (27.08. abends): ' + (VORHER[sym].sprungBei
        ? 'Sprung am ' + VORHER[sym].sprungBei + ', ' + VORHER[sym].von + ' -> ' + VORHER[sym].auf +
          ' (Faktor ' + VORHER[sym].faktor + ')'
        : VORHER[sym].hinweis));
    }
    console.log('');
  }

  console.log('LESART:');
  console.log('  GEHEILT        - die Quelle kennt einen Split, unser Archiv zeigt keinen Bruch mehr:');
  console.log('                   die Selbstheilung ueber das Nachladen traegt. Nichts zu tun.');
  console.log('  KEIN FALL IM FENSTER - kein Bruch UND kein bekannter Split. Das ist KEIN Beleg fuer');
  console.log('                   Heilung, sondern nur die Auskunft, dass hier nichts zu sehen ist.');
  console.log('  QUELLEN-VERZUG - die Quelle liefert selbst noch unangepasst. Nicht unser Fehler,');
  console.log('                   und mit Nachladen NICHT zu beheben - nur abwarten oder kennzeichnen.');
  console.log('  MISCH-FEHLER   - die Quelle ist angepasst, unser Archiv nicht: Richtiges kommt an und');
  console.log('                   wird nicht uebernommen. Das betraefe JEDE Reihe. Sofort melden.');
  console.log('  QUELLE-UNKLAR  - Abruf gescheitert; ohne zweite Auskunft kein Urteil.');
  var schwer = Object.keys(urteile).filter(function (k) { return urteile[k] === 'MISCH-FEHLER'; });
  if (schwer.length) { console.log('\nMISCH-FEHLER bei: ' + schwer.join(', ') + ' - das ist ein eigener Fund.'); process.exit(1); }
  process.exit(0);
})();
