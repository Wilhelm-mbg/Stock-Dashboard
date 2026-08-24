'use strict';
/* SONDIERUNG: Was gibt die Schnittstelle bei STUNDENDATEN her?
 *
 * Zweck: Vor einem Abruf ueber tausende Werte muss klar sein, was ein einzelner
 * Abruf liefert, wie weit er zurueckreicht und was die Antwortkoepfe ueber das
 * Tempolimit sagen. Drei Abrufe, mehr nicht - die Schnittstelle soll nicht
 * belastet werden, nur befragt.
 *
 * Der Schluessel wird wie ueberall aus MASSIVE_KEY oder massive.key gelesen und
 * NIE ausgegeben.
 *
 * Aufruf: node tools/massive-sondierung.js
 */
var https = require('https');
var M = require('./massive.js');

function roh(pfad, key) {
  return new Promise(function (res, rej) {
    var r = https.request({ host: M.HOST.replace(/^https?:\/\//, ''), path: pfad, method: 'GET',
      headers: { Authorization: 'Bearer ' + key, Accept: 'application/json', 'User-Agent': 'markt-dashboard' } },
      function (a) {
        var d = '';
        a.on('data', function (c) { d += c; });
        a.on('end', function () { res({ status: a.statusCode, kopf: a.headers, rumpf: d }); });
      });
    r.on('error', rej);
    r.end();
  });
}
function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

(async function () {
  var key;
  try { key = M.schluessel(); } catch (e) { console.error(e.message); process.exit(2); }

  var bis = new Date().toISOString().slice(0, 10);
  var vor3 = new Date(Date.now() - 3 * 365 * 86400000).toISOString().slice(0, 10);

  console.log('SONDIERUNG - drei Abrufe, sonst nichts.\n');

  /* 1) Wie weit reichen Stundendaten zurueck, und wie viele Kerzen sind es? */
  console.log('1) Stundenkerzen fuer AAPL, ' + vor3 + ' bis ' + bis);
  var a = await roh('/v2/aggs/ticker/AAPL/range/1/hour/' + vor3 + '/' + bis + '?adjusted=true&sort=asc&limit=50000', key);
  if (a.status !== 200) {
    console.log('   HTTP ' + a.status + ' - ' + a.rumpf.slice(0, 200));
  } else {
    var j = JSON.parse(a.rumpf);
    var r = j.results || [];
    console.log('   ' + r.length + ' Kerzen' + (j.next_url ? ' (weitere Seiten vorhanden)' : ' (eine Seite)'));
    if (r.length) {
      console.log('   von ' + new Date(r[0].t).toISOString() + ' bis ' + new Date(r[r.length - 1].t).toISOString());
      /* Stundenkerzen inklusive Vor- und Nachboerse? Das entscheidet die Vergleichbarkeit
       * mit dem bestehenden Archiv, das nur die regulaere Sitzung enthaelt. */
      var std = {};
      r.forEach(function (b) { var h = new Date(b.t).getUTCHours(); std[h] = (std[h] || 0) + 1; });
      var k = Object.keys(std).map(Number).sort(function (x, y) { return x - y; });
      console.log('   UTC-Stunden: ' + k.join(', '));
      console.log('   Kerzen je Handelstag (grob): ' + (r.length / (k.length ? Math.max(1, Math.round(r.length / k.length / 1)) : 1)).toFixed(0) + ' – Stundenzahl ' + k.length);
      console.log('   Felder einer Kerze: ' + Object.keys(r[0]).join(' '));
    }
  }
  var limitKopf = Object.keys(a.kopf).filter(function (h) { return /limit|ratelimit|retry/i.test(h); });
  console.log('   Tempolimit-Koepfe: ' + (limitKopf.length ? limitKopf.map(function (h) { return h + '=' + a.kopf[h]; }).join(' | ') : 'keine'));

  await warte(M.ABSTAND_MS);

  /* 2) Gibt es einen Sammelabruf ueber ALLE Werte eines Tages? Wenn ja, kostet
   *    ein ganzer Markttag EINEN Abruf statt tausende. */
  console.log('\n2) Sammelabruf aller Werte fuer einen Tag (grouped daily)');
  var g = await roh('/v2/aggs/grouped/locale/us/market/stocks/2026-08-20?adjusted=true', key);
  if (g.status !== 200) {
    console.log('   HTTP ' + g.status + ' - ' + g.rumpf.slice(0, 160));
    console.log('   -> nicht verfuegbar; jeder Wert braucht einen eigenen Abruf.');
  } else {
    var jg = JSON.parse(g.rumpf);
    console.log('   ' + (jg.resultsCount || (jg.results || []).length) + ' Werte in EINEM Abruf.');
    console.log('   -> Tagesdaten des ganzen Marktes sind billig. Fuer Stundenkerzen aber nicht anwendbar.');
  }

  await warte(M.ABSTAND_MS);

  /* 3) Wie viele Werte gibt es ueberhaupt, die heute handelbar sind? */
  console.log('\n3) Umfang des handelbaren Universums');
  var u = await roh('/v3/reference/tickers?market=stocks&active=true&limit=1&type=CS', key);
  if (u.status !== 200) {
    console.log('   HTTP ' + u.status + ' - ' + u.rumpf.slice(0, 160));
  } else {
    var ju = JSON.parse(u.rumpf);
    console.log('   Stammaktien aktiv: ' + (ju.count != null ? ju.count : 'Zahl nicht mitgeliefert') +
      (ju.next_url ? ' (blaetterbar)' : ''));
  }

  console.log('\nFertig. Drei Abrufe verbraucht.');
})();
