'use strict';
/* Schritt 2b: zweiter Durchgang, nur fuer die Reihen, die nach dem ersten
 * "unbekannt" geblieben sind.
 *
 * WARUM EIN ZWEITER DURCHGANG. Der erste sucht das Kuerzel im ganzen EDGAR-Bestand
 * des Zeitfensters. Bei kurzen Kuerzeln ertrinkt der Emittent im Rauschen: "REV"
 * kommt in Tausenden Fondsberichten vor, und obenauf lag JNL SERIES TRUST mit 676
 * Treffern vor PROSHARES TRUST mit 636 - Revlon war nicht einmal unter den ersten
 * fuenf. Schraenkt man die Suche auf die Formulare ein, in denen ein Unternehmen
 * SEIN EIGENES Kuerzel nennt (8-K, 25, 25-NSE, 15-12G, 15-12B), verschwindet das
 * Rauschen: REVLON INC /DE/ steht dann oben, PRTY holt Party City mit 30 von 31.
 *
 * Und die Auswahl wird nicht mehr geraten, sondern GEPRUEFT: von den drei obersten
 * Kandidaten wird der genommen, der im Fenster um den letzten Balken wirklich ein
 * Abmelde-Signal eingereicht hat (25/15/8-K 3.01/1.03/2.01). Wer keines hat, ist
 * nicht die gesuchte Firma. Findet keiner eines, bleibt die Reihe unbekannt.
 *
 * Aufruf: node edgar-nachlauf.js
 */
var fs = require('fs');
var path = require('path');
var L = require('./edgar-lauf.js');
var E = require('./einstufen.js');

var CACHE = path.join(__dirname, 'edgar');
var TICK2 = path.join(CACHE, 'kuerzel2');
if (!fs.existsSync(TICK2)) fs.mkdirSync(TICK2, { recursive: true });

function tagPlus(iso, t) { return new Date(Date.parse(iso + 'T00:00:00Z') + t * 86400000).toISOString().slice(0, 10); }

function main() {
  var V = JSON.parse(fs.readFileSync(path.join(__dirname, 'verschwundene.json'), 'utf8')).reihen;
  var T = JSON.parse(fs.readFileSync(path.join(__dirname, 'verschwundene-gruende.json'), 'utf8'));
  var Zp = path.join(__dirname, 'edgar-zuordnung.json');
  var Z = JSON.parse(fs.readFileSync(Zp, 'utf8'));
  var offen = {}; T.reihen.forEach(function (x) { if (x.grund === 'unbekannt') offen[x.reihe] = 1; });
  var liste = V.filter(function (r) { return offen[r.reihe]; });
  console.log('offen:', liste.length);

  var i = 0, fertig = 0, gefunden = 0, t0 = Date.now();
  function naechste() {
    if (i >= liste.length) return Promise.resolve();
    var R = liste[i++];
    var sym = R.basis.replace(/-/g, '.');
    var datei = path.join(TICK2, sym.replace(/[^A-Z0-9.~_-]/gi, '_') + '.json');
    var von = tagPlus(R.letzterBalken, -L.VOR_TAGE), bis = tagPlus(R.letzterBalken, L.NACH_TAGE);
    var laden;
    if (fs.existsSync(datei)) { try { laden = Promise.resolve(JSON.parse(fs.readFileSync(datei, 'utf8'))); } catch (e) { laden = null; } }
    if (!laden) {
      var url = 'https://efts.sec.gov/LATEST/search-index?q=%22' + encodeURIComponent(sym) + '%22'
        + '&forms=8-K,25-NSE,25,15-12G,15-12B&dateRange=custom&startdt=' + von + '&enddt=' + bis;
      laden = L.holeJson(url).then(function (j) {
        if (j.fehler || j.fehlt || !j.aggregations) throw new Error('FTS2 ohne Aggregation');
        var b = (j.aggregations.entity_filter || {}).buckets || [];
        var eimer = b.map(function (x) {
          var m = /^(.*?)(?:\s*\(([A-Z0-9.,\- ]*)\))?\s*\(CIK (\d{10})\)\s*$/.exec(x.key) || [];
          return { name: (m[1] || x.key).trim(), tickers: (m[2] || '').split(/,\s*/).filter(Boolean), cik: m[3] || null, n: x.doc_count };
        }).filter(function (x) { return x.cik; }).slice(0, 5);
        var aus = { sym: sym, von: von, bis: bis, treffer: j.hits.total.value, eimer: eimer };
        fs.writeFileSync(datei, JSON.stringify(aus));
        return aus;
      });
    }
    return laden.then(function (f) {
      /* Kandidaten der Reihe nach pruefen: wer im Fenster ein Abmelde-Signal hat, gewinnt. */
      var k = (f.eimer || []).slice(0, 3);
      var n = 0;
      function weiter() {
        if (n >= k.length) return null;
        var kand = k[n++];
        return L.einreichungen(kand.cik).then(function (S) {
          if (!S || S.fehlt) return weiter();
          var fen = E.fenster(S, R.letzterBalken);
          if (fen.endsignal || fen.i301 || fen.i103 || (fen.i201 && fen.fusionsbeleg)) {
            return { cik: kand.cik, name: kand.name, weg: 'fts2-geprueft', sicherheit: 'stark', n: kand.n, platz: n };
          }
          return weiter();
        });
      }
      return weiter();
    }).then(function (treffer) {
      if (treffer) { Z.zuordnung[R.reihe] = treffer; gefunden++; }
      fertig++;
      if (fertig % 100 === 0) {
        fs.writeFileSync(Zp, JSON.stringify(Z));
        console.log(fertig + '/' + liste.length + '  gefunden ' + gefunden + '  ' + Math.round((Date.now() - t0) / 1000) + 's');
      }
    }).then(naechste, function (e) { console.error('FEHLER ' + R.reihe + ': ' + e.message); fertig++; return naechste(); });
  }
  var spuren = []; for (var s = 0; s < 10; s++) spuren.push(naechste());
  Promise.all(spuren).then(function () {
    Z.nachlauf = { stand: new Date().toISOString(), offen: liste.length, gefunden: gefunden, sekunden: Math.round((Date.now() - t0) / 1000) };
    Z.anfragen = (Z.anfragen || 0) + L.anfragen();
    fs.writeFileSync(Zp, JSON.stringify(Z));
    console.log('FERTIG  ' + gefunden + ' von ' + liste.length + ' aufgeloest, ' + Math.round((Date.now() - t0) / 1000) + 's');
  }, function (e) { console.error('ABBRUCH', e); process.exit(1); });
}

if (require.main === module) main();
