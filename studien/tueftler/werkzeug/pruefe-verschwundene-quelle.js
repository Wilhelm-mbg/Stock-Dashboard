'use strict';
/* MACHBARKEITSPROBE (kein Messwerkzeug): Liefert Yahoo Kurse fuer Werte, die
 * nicht mehr gehandelt werden?
 *
 * Hintergrund: das grosse Kursarchiv enthaelt ausschliesslich Ueberlebende. Ob sich
 * das ueberhaupt beheben laesst, haengt an einer Frage, die bisher niemand gemessen
 * hat - fuehrt eine kostenlose Quelle die Verschwundenen weiter?
 *
 * DIE FALLE, DIE DIESE PROBE ERST BRAUCHBAR MACHT. "Yahoo antwortet mit Kursen"
 * heisst NICHT "Yahoo hat den Wert". Beim ersten Lauf am 26.08. lieferten 8 von 46
 * Kuerzeln Kerzen - bei sieben davon war es ein Fonds auf der Pseudo-Boerse YHD
 * mit Waehrung null, nicht das delistete Unternehmen. Wer nur auf "kam etwas
 * zurueck" prueft, schreibt Fremdinstrumente ins Aktienarchiv. Deshalb wird der
 * Instrumententyp mitgelesen und das Urteil danach gefaellt, nicht nach der
 * Kerzenzahl.
 *
 * Es wird NICHTS gerechnet. Abgelegt wird nur das Probenergebnis.
 * Aufruf: node studien/tueftler/werkzeug/pruefe-verschwundene-quelle.js [n]
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var https = require('https');

var MASSIVE = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten', 'massive');
var n = parseInt(process.argv[2], 10) || 46;

var V = JSON.parse(fs.readFileSync(path.join(MASSIVE, 'verschwundene.json'), 'utf8'));
var mitBis = V.eintraege.filter(function (t) { return t.bis; });

/* Nach Delisting-Jahrgang schichten: die Frage ist nicht nur OB, sondern wie weit
 * zurueck. Ein Ticker, der 2025 verschwand, sagt nichts ueber einen von 2009. */
var eimer = {};
mitBis.forEach(function (t) { (eimer[t.bis.slice(0, 4)] = eimer[t.bis.slice(0, 4)] || []).push(t); });
var jahre = Object.keys(eimer).sort();
var proJahr = Math.max(1, Math.floor(n / jahre.length));
var probe = [];
jahre.forEach(function (j) {
  var e = eimer[j];
  var schritt = Math.max(1, Math.floor(e.length / proJahr));
  var genommen = 0;
  for (var i = 0; i < e.length && genommen < proJahr; i += schritt) { probe.push(e[i]); genommen++; }
});

function hole(sym) {
  return new Promise(function (fertig) {
    var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
      '?range=max&interval=1d';
    var req = https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }, timeout: 15000
    }, function (res) {
      var buf = '';
      res.on('data', function (c) { buf += c; });
      res.on('end', function () {
        if (res.statusCode !== 200) return fertig({ status: res.statusCode, kerzen: 0 });
        var d;
        try { d = JSON.parse(buf); } catch (e) { return fertig({ status: 'unlesbar', kerzen: 0 }); }
        var r = d.chart && d.chart.result && d.chart.result[0];
        if (!r || !r.timestamp || !r.timestamp.length) return fertig({ status: 200, kerzen: 0 });
        var m = r.meta || {};
        var ts = r.timestamp;
        fertig({
          status: 200, kerzen: ts.length,
          von: new Date(ts[0] * 1000).toISOString().slice(0, 10),
          bis: new Date(ts[ts.length - 1] * 1000).toISOString().slice(0, 10),
          name: m.longName || m.shortName || null,
          art: m.instrumentType || null,
          boerse: m.fullExchangeName || m.exchangeName || null,
          waehrung: m.currency || null
        });
      });
    });
    req.on('timeout', function () { req.destroy(); fertig({ status: 'zeit', kerzen: 0 }); });
    req.on('error', function (e) { fertig({ status: String(e.code || e.message), kerzen: 0 }); });
  });
}

/* Das Urteil. Reihenfolge ist Absicht: der Instrumententyp schlaegt die Kerzenzahl. */
function urteile(t, r) {
  if (!r.kerzen) return 'leer';
  if (r.art && r.art !== 'EQUITY') return 'FREMD (' + r.art + '/' + (r.boerse || '?') + ')';
  if (r.waehrung === null) return 'FREMD (Waehrung fehlt)';
  var tageDanach = Math.round((new Date(r.bis) - new Date(t.bis)) / 86400000);
  if (tageDanach > 90) return 'WEITER (+' + tageDanach + ' T, Segmentwechsel oder neu vergeben)';
  return 'ja';
}

(async function () {
  console.log('Probe: ' + probe.length + ' verschwundene Werte, geschichtet nach Delisting-Jahrgang.\n');
  console.log('Sym      delistet    | Yahoo        | Typ/Boerse            | Urteil');
  var ergebnis = [];
  for (var i = 0; i < probe.length; i++) {
    var t = probe[i];
    var r = await hole(t.sym);
    var u = urteile(t, r);
    ergebnis.push({
      sym: t.sym, listeName: t.name, delistet: t.bis, kerzen: r.kerzen,
      yName: r.name || null, yArt: r.art || null, yBoerse: r.boerse || null,
      yWaehrung: r.waehrung || null, yVon: r.von || null, yBis: r.bis || null,
      status: r.status, urteil: u
    });
    console.log(String(t.sym).padEnd(8) + ' ' + t.bis + '  | ' +
      String(r.kerzen ? r.kerzen + ' Kerzen' : 'HTTP ' + r.status).padEnd(12) + ' | ' +
      String((r.art || '-') + '/' + (r.boerse || '-')).slice(0, 21).padEnd(21) + ' | ' + u);
    await new Promise(function (f) { setTimeout(f, 400); });
  }

  function zaehl(p) { return ergebnis.filter(p).length; }
  console.log('\n== ERGEBNIS ==');
  console.log('  brauchbar:                    ' + zaehl(function (e) { return e.urteil === 'ja'; }) +
    ' / ' + ergebnis.length);
  console.log('  leer (Quelle fuehrt nichts):  ' + zaehl(function (e) { return e.urteil === 'leer'; }));
  console.log('  FREMDES Instrument unter demselben Kuerzel: ' +
    zaehl(function (e) { return e.urteil.indexOf('FREMD') === 0; }) + '  <- die stille Falle');
  console.log('  laeuft nach dem Delisting weiter: ' +
    zaehl(function (e) { return e.urteil.indexOf('WEITER') === 0; }));

  console.log('\n== BRAUCHBAR NACH DELISTING-JAHRGANG ==');
  var jj = {};
  ergebnis.forEach(function (e) {
    var j = e.delistet.slice(0, 4);
    jj[j] = jj[j] || { n: 0, ja: 0 };
    jj[j].n++; if (e.urteil === 'ja') jj[j].ja++;
  });
  console.log('  ' + Object.keys(jj).sort().map(function (j) { return j + ': ' + jj[j].ja + '/' + jj[j].n; }).join('   '));

  fs.writeFileSync(path.join(__dirname, '..', 'daten', 'probe-verschwundene-quelle-2026-08-26.json'),
    JSON.stringify({
      stand: new Date().toISOString(), quelle: 'yahoo v8 chart range=max interval=1d',
      frage: 'Fuehrt Yahoo Kurse fuer nicht mehr gehandelte Werte?',
      urteilsregel: 'Instrumententyp schlaegt Kerzenzahl: alles ausser EQUITY ist ein Fremdinstrument, auch wenn Kerzen kommen.',
      probe: ergebnis
    }, null, 1));
  console.log('\nAbgelegt: studien/tueftler/daten/probe-verschwundene-quelle-2026-08-26.json');
})();
