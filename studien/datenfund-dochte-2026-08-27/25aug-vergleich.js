'use strict';
/* ============ Datenfund 2: stimmt der 25.08. im NEU geschriebenen Archiv? ============
 *
 * ZAEHLEN, NICHT REPARIEREN (PM-Auftrag 27.08. vormittags). Der Befund von
 * gestern: die 19:30- und 20:00-Kerzen des 25.08. waren unfertig eingefroren
 * (AAPL 19:30 archiviert v 2.851.594 / c 309,8999 gegen live 2.846.819 /
 * 309,8299). Der Nachtlauf (00:20-03:34) hat das 60m-Archiv per range=730d
 * NEU geschrieben - moeglicherweise ist der Tag damit schon geheilt. Diese
 * Zaehlung stellt fest, OB: frischer Quellabruf des 25.08. gegen den neuen
 * Archivstand, Kerze fuer Kerze, ~20 liquide Symbole.
 *
 * QS-Vorgaben uebernommen: (1) Positivkontrolle, die anschlagen MUSS - der
 * 20.08. (Normaltag, vom Nachtlauf ebenfalls frisch geschrieben) laeuft mit;
 * ist ER nicht identisch, taugt kein Ergebnis. (2) Kerzenzahl je Tag VOR dem
 * Feldvergleich. (3) Giftkerzen strukturell ausgeschlossen: verglichen wird
 * nur, was im TAGESFENSTER liegt (die heutige Stempelkerze faellt heraus).
 * (4) Splits seit dem 25.08. wuerden die ganze Reihe verschieben - events =
 * splits wird mitgeholt und ausgewiesen.
 *
 * NUR LESEND auf dem Archiv; Netz nur fuer die frischen Abrufe. */
var fs = require('fs'), path = require('path');
var https = require('https');
var D = 'E:/Markt-Dashboard-Archiv/archiv60m';
var SYMS = ['AAPL', 'MSFT', 'KO', 'XOM', 'A', 'SPY', 'NVDA', 'TSLA', 'AMZN', 'META',
            'GOOGL', 'AMD', 'INTC', 'BAC', 'F', 'T', 'NKE', 'PLTR', 'CSCO', 'JPM'];
var TAG = '2026-08-25';
var POSITIV = '2026-08-20';

function hole(sym, tag) {
  return new Promise(function (resolve) {
    var p1 = Math.floor(Date.parse(tag + 'T00:00:00Z') / 1000), p2 = p1 + 86400;
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
      '?period1=' + p1 + '&period2=' + p2 + '&interval=60m&includePrePost=false&events=splits';
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, function (res) {
      var buf = '';
      res.on('data', function (d) { buf += d; });
      res.on('end', function () { resolve({ status: res.statusCode, body: buf }); });
    }).on('error', function (e) { resolve({ status: 0, body: String(e.message) }); });
  });
}
function schlaf(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function archivDatei(sym) {
  var kand = [path.join(D, 'bars_60m_' + sym + '.json'), path.join(D, 'etf', 'bars_60m_' + sym + '.json')];
  for (var i = 0; i < kand.length; i++) if (fs.existsSync(kand[i])) return kand[i];
  return null;
}

(async function () {
  var zeilen = [], posOk = 0, posGesamt = 0, splitWarn = [];
  for (var si = 0; si < SYMS.length; si++) {
    var sym = SYMS[si];
    var af = archivDatei(sym);
    if (!af) { zeilen.push(sym + ': keine Archivdatei'); continue; }
    var arch = JSON.parse(fs.readFileSync(af, 'utf8')).series || [];
    var archMap = {};
    arch.forEach(function (k) { archMap[k[0]] = k; });
    for (var ti = 0; ti < 2; ti++) {
      var tag = ti === 0 ? TAG : POSITIV;
      var r = await hole(sym, tag);
      await schlaf(350);
      if (r.status !== 200) { zeilen.push(sym + ' ' + tag + ': HTTP ' + r.status); continue; }
      var j; try { j = JSON.parse(r.body).chart.result[0]; } catch (e) { zeilen.push(sym + ' ' + tag + ': unlesbar'); continue; }
      if (j.events && j.events.splits && Object.keys(j.events.splits).length) splitWarn.push(sym);
      var ts = j.timestamp || [], q = j.indicators.quote[0] || {};
      var fenster0 = Date.parse(tag + 'T00:00:00Z'), fenster1 = fenster0 + 86400000;
      var quelle = 0, imArchiv = 0, identisch = 0, abw = [];
      for (var i = 0; i < ts.length; i++) {
        if (q.close[i] == null) continue;
        var ms = ts[i] * 1000;
        if (ms < fenster0 || ms >= fenster1) continue;      // Giftkerzen-Filter: nur das Tagesfenster
        quelle++;
        var a = archMap[ms];
        if (!a) continue;
        imArchiv++;
        var gleich = Math.abs(a[1] - q.close[i]) < 1e-6 && Math.abs(a[3] - q.high[i]) < 1e-6 &&
                     Math.abs(a[4] - q.low[i]) < 1e-6 && (a[2] || 0) === (q.volume[i] || 0);
        if (gleich) identisch++;
        else abw.push(new Date(ms).toISOString().slice(11, 16) + ' arch c/v ' + a[1] + '/' + (a[2] || 0) +
                      ' quelle ' + q.close[i] + '/' + (q.volume[i] || 0));
      }
      if (tag === POSITIV) { posGesamt++; if (quelle > 0 && identisch === imArchiv && imArchiv === quelle) posOk++; }
      zeilen.push(sym.padEnd(6) + tag + '  Quelle ' + quelle + ' | im Archiv ' + imArchiv +
        ' | identisch ' + identisch + (abw.length ? ' | ABWEICHEND ' + abw.length + ': ' + abw.slice(0, 2).join(' ; ') : ''));
    }
  }
  console.log(zeilen.join('\n'));
  console.log('\nPOSITIVKONTROLLE (' + POSITIV + '): ' + posOk + ' von ' + posGesamt + ' Symbole vollstaendig identisch' +
    (posOk === posGesamt ? ' - der Vergleichsweg traegt.' : ' - VORSICHT: der Vergleichsweg selbst ist fraglich, 25.08.-Aussagen nicht verwenden.'));
  if (splitWarn.length) console.log('SPLIT-VORBEHALT (seit dem Tag): ' + splitWarn.join(', '));
  console.log('\nLesart: 25.08. ueberall identisch => der Nachtlauf hat den Tag geheilt, Datenfund 2 ist erledigt.');
  console.log('Abweichungen => bezifferte Liste fuer Wilhelms Entscheid (nachbessern vs. neu holen).');
})();
