'use strict';
/* ============ Quellabruf-Probe: liefert Yahoo die Halbtags-Dochte HEUTE noch? ============
 *
 * QS-Arbeitsteilung (27.08. ~02:1x): diese Sitzung erhebt, die QS prueft gegen.
 * Die Probe kann ein damaliges EINLESE-Problem ausschliessen - mehr nicht:
 * "Quelle liefert heute identisch" heisst konsistente Lieferung, nicht korrekter
 * Kurs (QS-Warnung, wortgleich uebernommen).
 *
 * ZWEI PHASEN:
 *   node quellabruf-halbtage.js --abrufen    JETZT moeglich (nur Netz; schreibt
 *                                            Rohantworten als Schnappschuesse in
 *                                            ./quellabrufe/, KEIN Archivzugriff)
 *   node quellabruf-halbtage.js --vergleich  ERST NACH SPERRFALL (~03:40) - liest
 *                                            archiv60m und vergleicht Kerze fuer
 *                                            Kerze gegen die Schnappschuesse.
 *
 * DIE VIER QS-VORGABEN, eingebaut:
 *   1. Positivkontrolle, die anschlagen MUSS: ein juengster Normaltag (POSITIV_TAG)
 *      wird mit abgerufen; stimmt DER nicht ueberein, taugt kein "identisch".
 *   2. Kerzenzahl je Tag Archiv vs. Abruf wird VOR jedem Feldvergleich geprueft.
 *   3. Jeder Tag wird MIT und OHNE includePrePost abgerufen - die Differenz der
 *      beiden IST die Nachhandels-Menge.
 *   4. Splits/Rueckanpassung: der Abruf holt events=splits mit und weist jeden
 *      Split zwischen Halbtag und heute aus (ein Split saehe wie ein flaechiger
 *      Docht-Fehler aus).
 * Dazu die QS-Raster-Frage: die 12:30-ET-Kerze spannt ueber den 13:00-ET-
 * Halbtagsschluss - ihr Docht kann legitimer Nachhandelsanteil DIESER Kerze
 * sein. Der Vergleich weist sie separat aus. */
var fs = require('fs'), path = require('path');
var https = require('https');
var ABLAGE = path.join(__dirname, 'quellabrufe');
var SYMS = ['AAPL', 'MSFT', 'KO', 'XOM', 'A', 'SPY'];   // SPY liegt im Archiv unter etf/
var HALBTAGE = ['2024-11-29', '2024-12-24', '2025-07-03', '2025-11-28', '2025-12-24']; // die 5 in 730d-Reichweite
var POSITIV_TAG = '2026-08-20';                          // juengster Normaltag: MUSS uebereinstimmen

function hole(sym, tag, prePost) {
  return new Promise(function (resolve) {
    var p1 = Math.floor(Date.parse(tag + 'T00:00:00Z') / 1000);
    var p2 = p1 + 86400;
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
      '?period1=' + p1 + '&period2=' + p2 + '&interval=60m&includePrePost=' + (prePost ? 'true' : 'false') +
      '&events=splits';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function (res) {
      var buf = '';
      res.on('data', function (d) { buf += d; });
      res.on('end', function () { resolve({ sym: sym, tag: tag, prePost: prePost, status: res.statusCode, body: buf }); });
    }).on('error', function (e) { resolve({ sym: sym, tag: tag, prePost: prePost, status: 0, body: String(e.message) }); });
  });
}
function schlaf(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

if (process.argv.indexOf('--abrufen') !== -1) {
  (async function () {
    fs.mkdirSync(ABLAGE, { recursive: true });
    var tage = HALBTAGE.concat([POSITIV_TAG]);
    var ok = 0, fehl = 0;
    for (var si = 0; si < SYMS.length; si++) {
      for (var ti = 0; ti < tage.length; ti++) {
        for (var pi = 0; pi < 2; pi++) {
          var r = await hole(SYMS[si], tage[ti], pi === 1);
          var name = SYMS[si] + '_' + tage[ti] + '_' + (pi === 1 ? 'pp' : 'nopp') + '.json';
          fs.writeFileSync(path.join(ABLAGE, name), r.body);
          if (r.status === 200) ok++; else { fehl++; console.log('  FEHL ' + name + ' status=' + r.status); }
          await schlaf(400);
        }
      }
    }
    console.log('Abrufe: ' + ok + ' ok, ' + fehl + ' fehlgeschlagen. Schnappschuesse unter ' + ABLAGE);
    console.log('Vergleich erst nach Sperrfall: node quellabruf-halbtage.js --vergleich');
  })();
} else if (process.argv.indexOf('--vergleich') !== -1) {
  var D = 'E:/Markt-Dashboard-Archiv/archiv60m';
  var sperrD = path.join(D, '_laeuft.json');
  if (fs.existsSync(sperrD)) {
    var sj = null; try { sj = JSON.parse(fs.readFileSync(sperrD, 'utf8')); } catch (e) { sj = null; }
    var lebt = false;
    if (sj && sj.pid) { try { process.kill(sj.pid, 0); lebt = true; } catch (e) { lebt = false; } }
    if (lebt) { console.error('ABBRUCH: archiv60m wird geschrieben. Erst nach Sperrfall.'); process.exit(2); }
  }
  function archivDatei(sym) {
    var kand = [path.join(D, 'bars_60m_' + sym + '.json'), path.join(D, 'etf', 'bars_60m_' + sym + '.json')];
    for (var i = 0; i < kand.length; i++) if (fs.existsSync(kand[i])) return kand[i];
    return null;
  }
  var Boerse = require(path.join(__dirname, '..', '..', 'boerse.js'));
  SYMS.forEach(function (sym) {
    var af = archivDatei(sym);
    if (!af) { console.log(sym + ': keine Archivdatei gefunden'); return; }
    var arch = JSON.parse(fs.readFileSync(af, 'utf8')).series || [];
    var archMap = {};
    arch.forEach(function (k) { archMap[k[0]] = k; });
    HALBTAGE.concat([POSITIV_TAG]).forEach(function (tag) {
      ['nopp', 'pp'].forEach(function (modus) {
        var f = path.join(ABLAGE, sym + '_' + tag + '_' + modus + '.json');
        if (!fs.existsSync(f)) return;
        var j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')).chart.result[0]; } catch (e) { console.log(sym + ' ' + tag + ' ' + modus + ': Antwort unlesbar'); return; }
        var ts = j.timestamp || [], q = j.indicators.quote[0] || {};
        var splits = j.events && j.events.splits ? Object.keys(j.events.splits).length : 0;
        var archTag = arch.filter(function (k) { return new Date(k[0]).toISOString().slice(0, 10) === tag; });
        var quelle = 0, identisch = 0, abweichend = 0, nurQuelle = 0, abwBsp = [];
        for (var i = 0; i < ts.length; i++) {
          if (q.close[i] == null) continue;
          quelle++;
          var ms = ts[i] * 1000, a = archMap[ms];
          if (!a) { nurQuelle++; continue; }
          var gleich = Math.abs(a[1] - q.close[i]) < 1e-6 && Math.abs(a[3] - q.high[i]) < 1e-6 &&
                       Math.abs(a[4] - q.low[i]) < 1e-6 && (a[2] || 0) === (q.volume[i] || 0);
          if (gleich) identisch++; else { abweichend++; if (abwBsp.length < 2) abwBsp.push(new Date(ms).toISOString().slice(11, 16) + ' arch h/l/c ' + a[3] + '/' + a[4] + '/' + a[1] + ' vs quelle ' + q.high[i] + '/' + q.low[i] + '/' + q.close[i]); }
        }
        /* QS-Rasterfrage: die Kerze, die den 13:00-ET-Schluss ueberspannt (Beginn
         * 30 Min vor Schluss) - nur an Halbtagen interessant. */
        var raster = '';
        if (Boerse.halbtagAn(Date.parse(tag + 'T15:00:00Z'))) raster = ' [Halbtag]';
        console.log(sym + ' ' + tag + ' ' + modus + raster + ': Quelle ' + quelle + ' Kerzen, Archiv am Tag ' + archTag.length +
          ' | identisch ' + identisch + ', abweichend ' + abweichend + ', nur-Quelle ' + nurQuelle +
          (splits ? ' | SPLITS seither: ' + splits : '') +
          (abwBsp.length ? ' | z.B. ' + abwBsp.join(' ; ') : ''));
      });
    });
  });
  console.log('\nLesart: Positivkontrolle (' + POSITIV_TAG + ') MUSS identisch sein, sonst taugt kein Ergebnis.');
  console.log('pp-minus-nopp je Tag = die Nachhandels-Menge. Splits > 0 = Rueckanpassungs-Vorbehalt fuer die ganze Reihe.');
} else {
  console.log('Aufruf: node quellabruf-halbtage.js --abrufen | --vergleich');
}
