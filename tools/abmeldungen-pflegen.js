'use strict';
/* DIE ABMELDELISTE PFLEGEN - damit der naechste Fall von selbst auffaellt.
 *
 * Der Anlass (27.08.2026): TWO hoerte am 24.08. auf zu handeln (Abschluss-Spike
 * 19,4 Mio Stueck, die Quelle liefert danach nichts mehr) - und fiel nur als
 * Nebenbefund einer fremden Zaehlung auf. Warum? Die einzige Abmeldeliste im
 * Haus (massive/verschwundene.json) ist ein SCHNAPPSCHUSS der Schnittstelle
 * vom 23.08.; wer sich nach dem Schnappschuss abmeldet, steht nicht drin.
 * Und ihr Datum ist das LISTENDATUM (delisted_utc), nicht das Handelsende:
 * AVB steht mit bis=18.08. drin, die letzte echte Kerze traegt den 14.08.;
 * LBRDA steht mit 21.08. drin und handelte zuletzt am 17.07. - die Kerze vom
 * 21.08. ist ein einzelner Stempel mit ANDEREM Kurs (35,99 statt 30,86,
 * mutmasslich die Abfindung). Das Listendatum taugt fuer keine Messung.
 *
 * WAS DIESES WERKZEUG TUT (Tagesarchiv, NUR LESEND; die eigene Ablage ist
 * die einzige Schreibstelle, und nur mit --schreiben):
 *   1. Handelsende je Reihe = letzte Kerze mit Umsatz > 0. Nachlaufende
 *      Stempelkerzen (eingefrorener Schluss, Umsatz 0 - die Bauform, die die
 *      QS am 26.08. beschrieben hat) zaehlen NICHT als Handel.
 *   2. Kalender = die Handelstage des liquidesten Zeugen (SPY). Eine Reihe
 *      ist AUFFAELLIG, wenn ihr Handelsende >= 2 Zeugen-Handelstage zurueckliegt.
 *      Das faengt beide Formen: den Stempel-Sammler (AVB) und den stillen
 *      Abbruch ohne Stempel (TWO).
 *   3. Jede auffaellige Reihe wird FRISCH gegen die Quelle geprueft: liefert
 *      sie nach dem Handelsende noch Kerzen mit Umsatz, ist es ein
 *      ABRUFFEHLER (Archiv haengt, nachladen); liefert sie nichts, ist die
 *      Abmeldung BESTAETIGT.
 *   4. Ergebnis wandert nach massive/abmeldungen.json - die GEPFLEGTE Liste
 *      mit Handelsende, getrennt vom Schnappschuss der Schnittstelle, den
 *      dieses Werkzeug nicht anfasst. Eine frueher abgemeldete Reihe, die
 *      wieder handelt, wird laut gemeldet (dann stimmt etwas nicht).
 *
 * Aufruf:  node tools/abmeldungen-pflegen.js             (zaehlen und anzeigen)
 *          node tools/abmeldungen-pflegen.js --schreiben (Ablage aktualisieren)
 * Ablage:  <Downloads>/Markt-Dashboard-Daten/massive/abmeldungen.json */
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');

var ARCHIV = 'E:/Markt-Dashboard-Archiv/archiv1d';
var ABLAGE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'abmeldungen.json');
var SCHNAPPSCHUSS = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive', 'verschwundene.json');
var SCHREIBEN = process.argv.indexOf('--schreiben') !== -1;
var RUECKSTAND_AB = 2;          // Zeugen-Handelstage, ab denen eine Reihe auffaellig ist
var QUELLE_HOECHSTENS = 40;     // Schutz: mehr Auffaellige deuten auf ein Archivproblem, nicht auf Abmeldungen

function dateien(ordner) {
  var out = [];
  fs.readdirSync(ordner, { withFileTypes: true }).forEach(function (e) {
    var p = path.join(ordner, e.name);
    if (e.isDirectory() && !/^backup/.test(e.name)) out = out.concat(dateien(p));
    else if (/^bars_1d_.*\.json$/.test(e.name)) out.push(p);
  });
  return out;
}

function tagVon(ms) { return new Date(ms).toISOString().slice(0, 10); }

/* Handelsende und Stempel-Schwanz einer Reihe. */
function befundVon(series) {
  var stempel = 0, ende = null;
  for (var i = series.length - 1; i >= 0; i--) {
    if ((series[i][2] || 0) > 0) { ende = series[i][0]; break; }
    stempel++;
  }
  return { handelsende: ende, stempelSchwanz: stempel, letzteKerze: series.length ? series[series.length - 1][0] : null };
}

function holeQuelle(sym) {
  return new Promise(function (resolve) {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
      '?range=1mo&interval=1d&includePrePost=false';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function (res) {
      var buf = '';
      res.on('data', function (d) { buf += d; });
      res.on('end', function () { resolve({ status: res.statusCode, body: buf }); });
    }).on('error', function (e) { resolve({ status: 0, body: String(e.message) }); });
  });
}
function schlaf(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

(async function () {
  /* 1. Archiv lesen: Handelsende je Reihe. */
  var alle = dateien(ARCHIV);
  if (!alle.length) { console.error('Kein Tagesarchiv unter ' + ARCHIV); process.exit(2); }
  var reihen = {};
  alle.forEach(function (f) {
    var j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { return; }
    if (!Array.isArray(j.series) || !j.series.length) return;
    var sym = path.basename(f).replace(/^bars_1d_/, '').replace(/\.json$/, '');
    reihen[sym] = befundVon(j.series);
    reihen[sym].istEtf = f.indexOf(path.sep + 'etf' + path.sep) !== -1 || f.indexOf('/etf/') !== -1;
  });
  var symbole = Object.keys(reihen);
  console.log('Tagesarchiv: ' + symbole.length + ' Reihen.');

  /* 2. Kalender vom Zeugen. SPY handelt jeden Handelstag; seine Tage SIND der
   *    Kalender - kein Feiertagswissen noetig, das veralten koennte. */
  var zeugeDatei = null;
  ['SPY', 'QQQ', 'AAPL'].some(function (z) {
    var kand = [path.join(ARCHIV, 'etf', 'bars_1d_' + z + '.json'), path.join(ARCHIV, 'bars_1d_' + z + '.json')];
    return kand.some(function (k) { if (fs.existsSync(k)) { zeugeDatei = k; return true; } return false; });
  });
  if (!zeugeDatei) { console.error('Kein Kalender-Zeuge (SPY/QQQ/AAPL) im Archiv.'); process.exit(2); }
  var zeugeTage = JSON.parse(fs.readFileSync(zeugeDatei, 'utf8')).series
    .filter(function (k) { return (k[2] || 0) > 0; })
    .map(function (k) { return tagVon(k[0]); });
  var juengster = zeugeTage[zeugeTage.length - 1];
  console.log('Kalender-Zeuge: ' + path.basename(zeugeDatei) + ', juengster Handelstag ' + juengster + '.');

  function rueckstand(handelsendeTag) {
    var n = 0;
    for (var i = zeugeTage.length - 1; i >= 0 && zeugeTage[i] > handelsendeTag; i--) n++;
    return n;
  }

  /* 3. Auffaellige einsammeln. */
  var auffaellig = [];
  symbole.forEach(function (sym) {
    var r = reihen[sym];
    if (r.handelsende == null) return;
    var tag = tagVon(r.handelsende);
    var rs = rueckstand(tag);
    if (rs >= RUECKSTAND_AB) auffaellig.push({ sym: sym, handelsende: tag, rueckstand: rs, stempelSchwanz: r.stempelSchwanz, istEtf: r.istEtf });
  });
  auffaellig.sort(function (a, b) { return a.handelsende < b.handelsende ? -1 : 1; });
  console.log('Auffaellig (Handelsende >= ' + RUECKSTAND_AB + ' Handelstage zurueck): ' + auffaellig.length + '\n');
  if (auffaellig.length > QUELLE_HOECHSTENS) {
    console.error('Das sind zu viele fuer Abmeldungen (' + auffaellig.length + ' > ' + QUELLE_HOECHSTENS + ') - ' +
      'so viele Reihen melden sich nicht gleichzeitig ab. Das sieht nach einem Archiv- oder ' +
      'Nachladeproblem aus; erst DAS klaeren, dann wiederkommen. Es wird nichts geschrieben.');
    process.exit(1);
  }

  /* Schnappschuss der Schnittstelle nur zum Abgleich lesen (nie schreiben). */
  var listeBis = {};
  try {
    (JSON.parse(fs.readFileSync(SCHNAPPSCHUSS, 'utf8')).eintraege || []).forEach(function (e) {
      if (e.sym && e.bis) listeBis[e.sym] = e.bis;
    });
  } catch (e) { /* ohne Schnappschuss geht es auch - dann bleibt die Spalte leer */ }

  /* 4. Jede auffaellige Reihe frisch gegen die Quelle. */
  for (var i = 0; i < auffaellig.length; i++) {
    var a = auffaellig[i];
    var q = await holeQuelle(a.sym);
    await schlaf(350);
    a.listeBis = listeBis[a.sym] || null;
    a.quelleGeprueftAm = juengster;
    if (q.status !== 200) { a.befund = 'quelle-leer'; a.quelleDetail = 'HTTP ' + q.status; continue; }
    var jj; try { jj = JSON.parse(q.body).chart.result[0]; } catch (e) { a.befund = 'quelle-leer'; a.quelleDetail = 'unlesbar'; continue; }
    var ts = (jj && jj.timestamp) || [], vol = (jj && jj.indicators.quote[0] && jj.indicators.quote[0].volume) || [];
    var frischer = null;
    for (var t = 0; t < ts.length; t++) {
      if ((vol[t] || 0) > 0 && tagVon(ts[t] * 1000) > a.handelsende) frischer = tagVon(ts[t] * 1000);
    }
    if (frischer) { a.befund = 'abruffehler'; a.quelleDetail = 'Quelle handelt bis ' + frischer + ' - das Archiv haengt, nachladen!'; }
    else { a.befund = 'abgemeldet-bestaetigt'; a.quelleDetail = 'Quelle liefert nach dem Handelsende keinen Umsatz mehr'; }
  }

  /* 5. Gegen die bisherige Ablage halten: was ist NEU, was hat sich gedreht? */
  var vorher = {};
  try { (JSON.parse(fs.readFileSync(ABLAGE, 'utf8')).eintraege || []).forEach(function (e) { vorher[e.sym] = e; }); }
  catch (e) { /* erste Fahrt */ }
  var neu = [], gedreht = [], wieder = [];
  auffaellig.forEach(function (a) {
    if (!vorher[a.sym]) neu.push(a.sym);
    else if (vorher[a.sym].befund !== a.befund) gedreht.push(a.sym + ' (' + vorher[a.sym].befund + ' -> ' + a.befund + ')');
  });
  Object.keys(vorher).forEach(function (sym) {
    var nochDa = auffaellig.some(function (a) { return a.sym === sym; });
    if (!nochDa && vorher[sym].befund === 'abgemeldet-bestaetigt') wieder.push(sym);
  });

  console.log('Sym     Handelsende  Rueckst.  Stempel  Liste-bis    Befund');
  auffaellig.forEach(function (a) {
    console.log(a.sym.padEnd(8) + a.handelsende + '   ' + String(a.rueckstand).padStart(4) + '     ' +
      String(a.stempelSchwanz).padStart(4) + '    ' + String(a.listeBis || '-').padEnd(11) + '  ' +
      a.befund + '  [' + a.quelleDetail + ']' + (neu.indexOf(a.sym) !== -1 ? '  << NEU' : ''));
  });
  if (neu.length) console.log('\nNEU seit der letzten Fahrt: ' + neu.join(', '));
  if (gedreht.length) console.log('BEFUND GEDREHT: ' + gedreht.join('; '));
  if (wieder.length) console.log('\n!!! FRUEHER ABGEMELDET, JETZT WIEDER UNAUFFAELLIG: ' + wieder.join(', ') +
    ' - eine Abmeldung kehrt nicht zurueck; das Archiv oder die fruehere Einstufung stimmt nicht.');

  /* 6. Ablage. */
  if (!SCHREIBEN) { console.log('\n(Nur gezaehlt. Schreiben mit --schreiben.)'); return; }
  var inhalt = {
    stand: new Date().toISOString(),
    hinweis: 'Handelsende = letzte Kerze mit Umsatz im Tagesarchiv, NIE das Listendatum der Schnittstelle. ' +
      'Gepflegt von tools/abmeldungen-pflegen.js; der Schnappschuss massive/verschwundene.json bleibt unberuehrt.',
    kalenderZeuge: path.basename(zeugeDatei),
    juengsterHandelstag: juengster,
    eintraege: auffaellig
  };
  fs.writeFileSync(ABLAGE, JSON.stringify(inhalt, null, 1));
  console.log('\nGeschrieben: ' + ABLAGE + ' (' + auffaellig.length + ' Eintraege).');
})();
