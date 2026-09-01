'use strict';
/* KORPUS HOLEN - alle Schlagzeilen der 30 Universums-Werte ab 2017-04-10.
 *
 * SCHLUESSEL: steht im Authorization-HEADER, nie in einer URL. Jede Ausgabe laeuft
 * zusaetzlich durch sicher(). Auch next_url wird maskiert protokolliert.
 *
 * TEMPO: 13 s Abstand (5 Abrufe/Min auf Basic). Der Lauf dauert deshalb rund eine
 * Stunde. Ein 429 wuerde Luecken erzeugen, die spaeter wie "keine Nachricht"
 * aussaehen - und das waere ein stiller Messfehler, kein Abbruch.
 *
 * WIEDERAUFNAHME: Fertige Symbole werden uebersprungen. Ein Abbruch kostet nichts.
 * Ein Symbol gilt erst als fertig, wenn seine Blaetterkette ERSCHOEPFT ist - ein
 * halb geholtes Symbol wird nie als fertig abgelegt, sonst faende die Messung
 * spaeter eine Luecke und hielte sie fuer Nachrichtenlosigkeit.
 *
 * GESPEICHERT wird nur, was die Messung braucht: [zeit_ms, titel]. Keine URLs,
 * keine Texte, keine Verlage.
 */
var https = require('https');
var fs = require('fs');
var path = require('path');
var M = require('../../tools/massive.js');

var START = '2017-04-10';
var ORDNER = path.join(__dirname, 'korpus');
var KEY = M.schluessel();
function sicher(s) {
  s = String(s);
  s = s.split(KEY).join('<SCHLUESSEL>');
  if (KEY.length > 12) s = s.split(KEY.slice(0, 12)).join('<SCHLUESSEL>');
  return s;
}
function sage(x) { console.log(sicher(x)); }
function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

var letzter = 0, abrufe = 0;
async function abruf(url) {
  var seit = Date.now() - letzter;
  if (seit < M.ABSTAND_MS) await warte(M.ABSTAND_MS - seit);
  letzter = Date.now(); abrufe++;
  return new Promise(function (res) {
    var u = new URL(url.indexOf('http') === 0 ? url : 'https://' + M.HOST + url);
    https.get({ host: u.host, path: u.pathname + u.search,
      headers: { Authorization: 'Bearer ' + KEY, Accept: 'application/json', 'User-Agent': 'markt-dashboard' },
      timeout: 45000 }, function (r) {
      var b = '';
      r.on('data', function (d) { b += d; });
      r.on('end', function () {
        var j = null; try { j = JSON.parse(b); } catch (e) { /* Text */ }
        res({ status: r.statusCode, j: j,
              treffer: j && j.results ? j.results.length : null,
              weiter: (j && j.next_url) || null,
              fehler: (j && (j.error || j.message)) || null });
      });
    }).on('error', function (e) { res({ status: 0, fehler: String(e.message) }); })
      .on('timeout', function () { res({ status: 0, fehler: 'Zeitueberschreitung' }); });
  });
}

(async function () {
  if (!fs.existsSync(ORDNER)) fs.mkdirSync(ORDNER, { recursive: true });
  var uni = JSON.parse(fs.readFileSync(path.join(__dirname, 'universum.json'), 'utf8')).universum
    .map(function (u) { return u.sym; });
  sage('== Korpus holen ==  ' + uni.length + ' Werte ab ' + START + '  (13 s Abstand)');

  for (var i = 0; i < uni.length; i++) {
    var sym = uni[i];
    var ziel = path.join(ORDNER, sym + '.json');
    if (fs.existsSync(ziel)) {
      var alt = JSON.parse(fs.readFileSync(ziel, 'utf8'));
      if (alt.erschoepft) { sage('[' + (i + 1) + '/' + uni.length + '] ' + sym + ' schon fertig (' + alt.items.length + ')'); continue; }
    }
    var url = '/v2/reference/news?ticker=' + encodeURIComponent(sym) +
      '&published_utc.gte=' + START + '&limit=1000&order=asc&sort=published_utc';
    var items = [], seiten = 0, erschoepft = false, letzterFehler = null;
    while (url) {
      var r = await abruf(url);
      if (r.status !== 200) {
        letzterFehler = 'HTTP ' + r.status + ' ' + sicher(String(r.fehler)).slice(0, 100);
        sage('  ' + sym + ' Seite ' + (seiten + 1) + ': ' + letzterFehler);
        break;
      }
      (r.j.results || []).forEach(function (a) {
        var t = Date.parse(a.published_utc);
        if (isFinite(t) && a.title) items.push([t, String(a.title)]);
      });
      seiten++;
      url = r.weiter;
      if (!url) erschoepft = true;
    }
    /* Nur eine ERSCHOEPFTE Kette wird als fertig markiert. */
    fs.writeFileSync(ziel, JSON.stringify({
      sym: sym, start: START, seiten: seiten, erschoepft: erschoepft,
      fehler: letzterFehler, geholt: new Date().toISOString(), items: items
    }));
    var spanne = items.length ? (new Date(items[0][0]).toISOString().slice(0, 10) + '..' +
      new Date(items[items.length - 1][0]).toISOString().slice(0, 10)) : '-';
    sage('[' + (i + 1) + '/' + uni.length + '] ' + (sym + '      ').slice(0, 6) +
      String(items.length).padStart(6) + ' Meldungen, ' + String(seiten).padStart(2) + ' Seiten, ' +
      (erschoepft ? 'vollstaendig' : 'ABGEBROCHEN') + '   ' + spanne +
      '   [Abrufe gesamt ' + abrufe + ']');
  }
  sage('\nFertig. Abrufe: ' + abrufe);
})();
