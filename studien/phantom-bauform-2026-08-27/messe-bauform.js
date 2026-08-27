'use strict';
/* BAUFORM-SWEEP (Auftrag PM 27.08. abends, vom Analytiker uebernommen):
 * MELDET Yahoo ein Split-Ereignis im events-Feld, OHNE es in die gelieferte
 * Kurshistorie einzurechnen?
 *
 * Das ist eine andere Frage als "gibt es Phantome" (die hat der Analytiker
 * beantwortet: genau 1 belegtes, RGR). Hier geht es um die BAUFORM der Antwort:
 * Yahoo liefert in EINER Antwort beide Dinge - events.splits und die Kurse.
 * Stimmen sie ueberein?
 *
 * Erwartung bei sauberer Anpassung: am Split-Datum KEIN Sprung in der Historie
 * (die Anpassung glaettet ihn weg - gemessen am 27.08. an AAPL/NVDA/TSLA: 12
 * Splits, 0 Spruenge). Zeigt die Historie den Sprung TROTZ gemeldetem Ereignis,
 * hat Yahoo das Ereignis nicht eingerechnet.
 *
 * GEGENKONTROLLE (PM-Auflage): AAPL/NVDA muessen ein events-Feld HABEN. Haetten
 * sie keines, misst der Sweep die Anwesenheit des Feldes statt der Bauform -
 * dann waere jede Aussage ueber die Streitreihen bedeutungslos.
 * ZAEHLEN VOR AENDERN: nichts wird repariert, das events-Feld waere allenfalls
 * ein Weg zu KENNZEICHNEN.
 * Nur lesend, schreibt nur in diesen Ordner. */
var fs = require('fs'), path = require('path'), https = require('https');
var HIER = __dirname;
var TOL = 0.10;              /* relative Faktor-Toleranz, wie im grossen Join */
var SPRUNG_MIN = 0.08;       /* ab 8 % Tagesbewegung gilt ein Sprung als auffaellig */

var STREIT = ['RGR', 'SITC', 'B', 'BYND'];
var KONTROLLE = ['AAPL', 'NVDA'];

function hole(url) {
  return new Promise(function (fertig, fehler) {
    var req = https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }, function (res) {
      var d = '';
      res.on('data', function (c) { d += c; });
      res.on('end', function () { fertig({ status: res.statusCode, text: d }); });
    });
    req.on('error', fehler);
    req.setTimeout(30000, function () { req.destroy(new Error('Zeitueberschreitung')); });
  });
}
function warte(ms) { return new Promise(function (f) { setTimeout(f, ms); }); }
function tag(sek) { return new Date(sek * 1000).toISOString().slice(0, 10); }

/* Fenster-Abruf um EIN Datum: liefert echte Tageskerzen.
 * WARUM NICHT range=max: Yahoo schaltet dort still auf MONATSraster um (NVDA:
 * 332 Kerzen fuer 27 Jahre). Der erste Lauf dieses Werkzeugs hat deshalb
 * Monatsbewegungen mit Split-Faktoren verglichen und 25 von 26 Ereignissen als
 * "Sprung da, Faktor passt nicht" gemeldet - ein Artefakt, das wie ein
 * dramatischer Befund aussah. Verraten hat es die Kerzenzahl in der Ausgabe. */
async function fensterUm(sym, datumSek) {
  var von = datumSek - 12 * 86400, bis = datumSek + 12 * 86400;
  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
    '?period1=' + von + '&period2=' + bis + '&interval=1d';
  var r = await hole(url);
  if (r.status === 429) { await warte(8000); r = await hole(url); }
  if (r.status !== 200) return null;
  var j; try { j = JSON.parse(r.text); } catch (e) { return null; }
  var res = j && j.chart && j.chart.result && j.chart.result[0];
  if (!res || !res.timestamp) return null;
  var q = res.indicators && res.indicators.quote && res.indicators.quote[0];
  return { tage: res.timestamp.map(tag), schluss: (q && q.close) || [] };
}

async function eineReihe(sym) {
  /* range=max nur fuer die EREIGNISLISTE - fuer die Kurse siehe fensterUm(). */
  var url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
    '?range=max&interval=1d&events=div%2Csplit';
  var r = await hole(url);
  if (r.status === 429) { await warte(8000); r = await hole(url); }
  if (r.status !== 200) return { sym: sym, fehler: 'HTTP ' + r.status };
  var j;
  try { j = JSON.parse(r.text); } catch (e) { return { sym: sym, fehler: 'unlesbar' }; }
  var res = j && j.chart && j.chart.result && j.chart.result[0];
  if (!res) return { sym: sym, fehler: 'keine Daten' };

  var hatEventsFeld = !!res.events;                       /* Gegenkontroll-Frage */
  var splits = (res.events && res.events.splits) || {};
  var zeit = res.timestamp || [];
  var quote = res.indicators && res.indicators.quote && res.indicators.quote[0];
  var schluss = (quote && quote.close) || [];
  /* Tagesraster aufbauen */
  var tage = zeit.map(tag);
  var idxVon = {};
  tage.forEach(function (t, i) { if (idxVon[t] === undefined) idxVon[t] = i; });

  var faelle = [];
  var schluessel = Object.keys(splits);
  for (var si = 0; si < schluessel.length; si++) {
    var s = splits[schluessel[si]];
    var datum = tag(s.date);
    var num = Number(s.numerator), den = Number(s.denominator);
    if (!(num > 0) || !(den > 0)) continue;
    /* Kursfaktor am Ausfuehrungstag: bei 1:4 (Forward) faellt der Kurs auf 1/4 */
    var kursfaktor = den / num;
    /* TAGESkerzen um das Datum holen - nicht aus der Monatsreihe oben lesen. */
    var f = await fensterUm(sym, s.date);
    await warte(1200);
    var gefunden = null, kerzen = f ? f.schluss.length : 0;
    if (f) {
      var i = -1;
      for (var k2 = 0; k2 < f.tage.length; k2++) if (f.tage[k2] >= datum) { i = k2; break; }
      if (i >= 0) {
        for (var d = Math.max(1, i - 1); d <= Math.min(f.schluss.length - 1, i + 1); d++) {
          var a = f.schluss[d - 1], c = f.schluss[d];
          if (!(a > 0) || !(c > 0)) continue;
          var q = c / a;
          if (Math.abs(q - 1) >= SPRUNG_MIN) {
            if (!gefunden || Math.abs(q - kursfaktor) < Math.abs(gefunden.q - kursfaktor)) {
              gefunden = { datum: f.tage[d], q: +q.toFixed(4) };
            }
          }
        }
      }
    }
    var passt = gefunden && (Math.abs(gefunden.q / kursfaktor - 1) <= TOL);
    faelle.push({
      datum: datum, verhaeltnis: num + ':' + den, kursfaktor: +kursfaktor.toFixed(4),
      tageskerzenImFenster: kerzen, sprungGefunden: gefunden, faktorPasst: !!passt,
      urteil: !f || kerzen < 5 ? 'nicht pruefbar (kein Tagesfenster - Reihe reicht nicht so weit zurueck)'
        : !gefunden ? 'eingerechnet (kein Sprung - die gesunde Signatur)'
        : passt ? 'NICHT eingerechnet (Sprung in Ereignisgroesse steht in der Historie)'
        : 'Sprung vorhanden, Faktor passt nicht (' + gefunden.q + ' gegen ' + kursfaktor.toFixed(4) + ')'
    });
  }
  return { sym: sym, hatEventsFeld: hatEventsFeld, splitsGemeldet: Object.keys(splits).length,
    kerzen: schluss.length, von: tage[0], bis: tage[tage.length - 1], faelle: faelle };
}

(async function () {
  console.log('== Bauform-Sweep ==  Meldet Yahoo ein Split-Ereignis, ohne es einzurechnen?');
  console.log('Streitreihen: ' + STREIT.join(', ') + '   Gegenkontrolle: ' + KONTROLLE.join(', ') + '\n');
  var alle = [];
  var liste = KONTROLLE.concat(STREIT);          /* Kontrolle ZUERST - sie entscheidet, ob der Rest zaehlt */
  for (var i = 0; i < liste.length; i++) {
    var e = await eineReihe(liste[i]);
    alle.push(e);
    if (e.fehler) { console.log(e.sym.padEnd(6) + 'FEHLER: ' + e.fehler); }
    else {
      console.log(e.sym.padEnd(6) + 'events-Feld: ' + (e.hatEventsFeld ? 'ja ' : 'NEIN') +
        '   gemeldete Splits: ' + String(e.splitsGemeldet).padStart(2) +
        '   Historie ' + e.von + '..' + e.bis + ' (' + e.kerzen + ' Kerzen)');
      e.faelle.forEach(function (f) {
        console.log('        ' + f.datum + '  ' + f.verhaeltnis.padEnd(8) + ' Kursfaktor ' + String(f.kursfaktor).padEnd(8) + f.urteil);
      });
    }
    if (i < liste.length - 1) await warte(1500);
  }

  /* --- Gegenkontrolle zuerst auswerten: traegt der Sweep ueberhaupt? --- */
  var kontrolleOk = KONTROLLE.every(function (s) {
    var e = alle.filter(function (x) { return x.sym === s; })[0];
    return e && !e.fehler && e.hatEventsFeld && e.splitsGemeldet > 0;
  });
  console.log('\n-- Gegenkontrolle (PM-Auflage) --');
  KONTROLLE.forEach(function (s) {
    var e = alle.filter(function (x) { return x.sym === s; })[0] || {};
    console.log('  ' + s + ': events-Feld ' + (e.hatEventsFeld ? 'vorhanden' : 'FEHLT') +
      ', ' + (e.splitsGemeldet || 0) + ' Splits gemeldet');
  });
  if (!kontrolleOk) {
    console.log('  -> GEGENKONTROLLE GERISSEN: ohne events-Feld bei den Kontrollen misst der Sweep');
    console.log('     die ANWESENHEIT des Feldes, nicht die Bauform. Kein Urteil ueber die Streitreihen.');
  } else {
    console.log('  -> bestanden: das Feld existiert und wird gefuellt, der Sweep misst die Bauform.');
  }

  /* --- Grundmenge zaehlen (PM-Auflage: die Quote ist das Ergebnis) --- */
  var ges = 0, nichtEingerechnet = 0, eingerechnet = 0, unklar = 0, nichtPruefbar = 0;
  alle.forEach(function (e) {
    (e.faelle || []).forEach(function (f) {
      ges++;
      if (/^NICHT eingerechnet/.test(f.urteil)) nichtEingerechnet++;
      else if (/^eingerechnet/.test(f.urteil)) eingerechnet++;
      else if (/^nicht pruefbar/.test(f.urteil)) nichtPruefbar++;
      else unklar++;
    });
  });
  var beurteilt = ges - nichtPruefbar;
  console.log('\n-- Grundmenge --');
  console.log('  gemeldete Split-Ereignisse gesamt: ' + ges + '   davon nicht pruefbar: ' + nichtPruefbar +
    '  -> beurteilt: ' + beurteilt);
  function pz(x) { return beurteilt ? '  = ' + (100 * x / beurteilt).toFixed(1) + ' % der beurteilten' : ''; }
  console.log('  eingerechnet (gesund):             ' + eingerechnet + pz(eingerechnet));
  console.log('  NICHT eingerechnet:                ' + nichtEingerechnet + pz(nichtEingerechnet));
  console.log('  Sprung da, Faktor passt nicht:     ' + unklar + pz(unklar));
  fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'),
    JSON.stringify({ gemessenAm: new Date().toISOString(), kontrolleOk: kontrolleOk, reihen: alle }, null, 1));
  console.log('\nlauf-<zeit>.json geschrieben. NICHTS geaendert - Zaehlen vor Aendern.');
})();
