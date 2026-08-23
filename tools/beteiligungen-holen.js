'use strict';
/* Beteiligungs-Meldungen aus SEC-Einreichungen (Schedule 13D)
 * ===========================================================
 * Wer mehr als 5 Prozent an einer US-notierten Firma haelt UND etwas damit vorhat -
 * auf den Vorstand einwirken, einen Verkauf betreiben, Sitze im Board fordern - muss
 * binnen zehn Tagen ein Schedule 13D einreichen. Das ist die Meldung selbst, nicht
 * ein Bericht darueber: kein Ranking-Zufall, keine Paywall, vollstaendig.
 *
 * Aufruf:  node tools/beteiligungen-holen.js [--tage N] [--min-umsatz MIO]
 * Ausgabe: JSON auf der Standardausgabe. Das Skript schreibt KEINE Datei - die
 *          Radar-Aufgabe liest die Ausgabe, bewertet sie redaktionell und nimmt sie
 *          in spekulationen.json auf. So bleibt es bei einem Schreiber je Datei.
 *
 * WAS DAS BRINGT, EHRLICH: An einem gewoehnlichen Tag gibt es rund vier echte 13D
 * (Aenderungsmeldungen "/A" sind meist Routine und bleiben aussen vor), und die
 * betreffen fast immer sehr kleine Werte. Nach dem Liquiditaetsfilter bleibt an den
 * meisten Tagen nichts uebrig. Das ist kein Fehler, sondern der Punkt: der Kanal ist
 * eine Versicherung gegen das Verpassen des seltenen Falls - Aktivist steigt bei
 * einem handelbaren Wert ein - und keine Fundgrube. Er kostet einen Abruf.
 */
var E = require('./edgar.js');

var args = process.argv.slice(2);
function argZahl(name, ersatz) {
  var i = args.indexOf(name);
  if (i < 0) return ersatz;
  var v = parseFloat(args[i + 1]);
  return isFinite(v) ? v : ersatz;
}
var TAGE = Math.max(1, Math.min(10, argZahl('--tage', 4)));
var MIN_UMSATZ = argZahl('--min-umsatz', 10) * 1e6;   // Dollar Tagesumsatz

/* Der SEC-Kopf einer Einreichung ist strukturiert - anders als der Fliesstext des
 * eigentlichen Dokuments, aus dem sich Prozentsatz und Absicht nicht verlaesslich
 * herausziehen lassen. Wer meldet, steht hier zuverlaessig. */
function kopfFeld(txt, block, feld) {
  var b = txt.split(new RegExp(block + ':', 'i'))[1];
  if (!b) return '';
  var m = b.slice(0, 1200).match(new RegExp(feld + ':\\s*([^\\n\\r]+)', 'i'));
  return m ? E.entities(m[1]).trim() : '';
}

/* Der Prozentsatz steht auf dem Deckblatt, aber in wechselnder Schreibweise und oft
 * in einer HTML-Tabelle. Mehrere Muster versuchen, und wenn keins greift, bleibt das
 * Feld eben leer - lieber keine Zahl als eine geratene. */
function prozentLesen(txt) {
  var flach = txt.replace(/<[^>]+>/g, ' ').replace(/&nbsp;?/gi, ' ').replace(/\s+/g, ' ');
  var muster = [
    /PERCENT\s+OF\s+CLASS\s+REPRESENTED\s+BY\s+AMOUNT\s+IN\s+ROW[^%]{0,120}?(\d{1,2}(?:[.,]\d{1,2})?)\s*%/i,
    /PERCENT\s+OF\s+CLASS[^%]{0,120}?(\d{1,2}(?:[.,]\d{1,2})?)\s*%/i,
    /approximately\s+(\d{1,2}(?:[.,]\d{1,2})?)\s*%\s+of\s+the\s+(?:issued\s+and\s+)?outstanding/i
  ];
  for (var i = 0; i < muster.length; i++) {
    var m = flach.match(muster[i]);
    if (m) {
      var p = parseFloat(String(m[1]).replace(',', '.'));
      if (isFinite(p) && p >= 5 && p <= 100) return p;   // unter 5 % gaebe es kein 13D
    }
  }
  return null;
}

(async function () {
  var karte = await E.tickerKarte();
  await E.warte(E.PAUSE);
  var filings = await E.tagesFilings(karte, TAGE, 'SCHEDULE 13D');
  var accs = Object.keys(filings);

  var funde = [];
  for (var i = 0; i < accs.length; i++) {
    var acc = accs[i];
    var f = filings[acc];
    var txt = await E.hole('https://www.sec.gov/Archives/' + f.weg);
    await E.warte(E.PAUSE);
    if (!txt) continue;
    var melder = kopfFeld(txt, 'FILED BY', 'COMPANY CONFORMED NAME') ||
      kopfFeld(txt, 'FILED BY', 'FILED BY');
    var ziel = kopfFeld(txt, 'SUBJECT COMPANY', 'COMPANY CONFORMED NAME') || f.firma;
    funde.push({
      sym: f.sym,
      name: ziel,
      melder: melder || 'nicht lesbar',
      prozent: prozentLesen(txt),
      datum: f.datum,
      url: 'https://www.sec.gov/Archives/edgar/data/' + f.cik + '/' + acc.replace(/-/g, '') + '/' + acc + '-index.htm'
    });
  }

  // Liquiditaetstest je Kuerzel. Ohne Kursdaten bleibt der Eintrag drin - ein stiller
  // Filter, der Werte verschwinden laesst, waere hier genau das falsche Verhalten.
  var behalten = [], weggelassen = [];
  for (var k = 0; k < funde.length; k++) {
    var u = await E.tagesumsatz(funde[k].sym);
    if (u && u.umsatz < MIN_UMSATZ) {
      weggelassen.push(funde[k].sym + ' (' + Math.round(u.umsatz / 1e6) + ' Mio $/Tag)');
      continue;
    }
    if (u) funde[k].umsatzMio = Math.round(u.umsatz / 1e6);
    behalten.push(funde[k]);
  }

  process.stdout.write(JSON.stringify({
    stand: new Date().toISOString(),
    geprueft: accs.length,
    weggelassen: weggelassen,
    hinweis: 'Schedule-13D-Originale (ohne Änderungsmeldungen) der letzten ' + TAGE + ' Tage, gefiltert auf mindestens ' +
      Math.round(MIN_UMSATZ / 1e6) + ' Mio $ Tagesumsatz. Eine leere Liste ist der Normalfall.',
    eintraege: behalten
  }, null, 2) + '\n');
})();
