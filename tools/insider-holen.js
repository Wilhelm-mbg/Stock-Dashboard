'use strict';
/* Insider-Kaeufe aus SEC-Meldungen holen (Form 4)
 * ===============================================
 * Fuehrungskraefte und Grossaktionaere US-notierter Firmen muessen jeden eigenen
 * Handel mit Aktien ihrer Firma binnen zwei Werktagen bei der SEC melden - Form 4.
 * Das ist die LEGALE, meldepflichtige Sorte: oeffentlich, vollstaendig, kostenlos.
 * Dieses Skript holt sie, siebt das Rauschen weg und schreibt insider.json in den
 * Daten-Ordner. Die App ZEIGT das nur an - gehandelt wird davon nichts.
 *
 * Aufruf:  node tools/insider-holen.js [--tage N] [--trocken]
 *
 * Warum ueberhaupt sieben: Ueber 90 Prozent der Form-4-Meldungen sind mechanisch -
 * Aktienzuteilungen ans Management (Code A), Optionsausuebungen (M), Verkaeufe nach
 * vorab terminiertem Plan (S). Nichts davon sagt etwas ueber eine Einschaetzung aus.
 * Uebrig bleibt Code P: ein Kauf ueber die Boerse, vom eigenen Geld, freiwillig.
 *
 * WICHTIG - das hier ist eine ANZEIGE, keine gemessene Kante. Der Insider-Kauf-Effekt
 * ist in der Literatur ein langsamer Halte-Effekt ueber Monate, keine Intraday-Kante.
 * Gegen die im Projekt gemessene Produkthuerde (0,23 Pp je 3h beim Standard-Schein)
 * traegt so etwas nicht. Erst messen, dann handeln - nicht umgekehrt.
 */
var fs = require('fs');
var path = require('path');
var os = require('os');
var E = require('./edgar.js');

var DATEN = path.join(os.homedir(), 'Downloads', 'Markt-Dashboard-Daten');
var ZIEL = path.join(DATEN, 'insider.json');
var GESEHEN = path.join(DATEN, 'insider-gesehen.json');
var MIN_KURS = 5;         // Dollar je Aktie: darunter ist es ein Pennystock
var MIN_WERT = 100000;    // Dollar Kaufvolumen: darunter ist es eine Geste
var MIN_UMSATZ = 10e6;    // Dollar Tagesumsatz: darunter kommt man nicht sauber rein und raus
var HALTBAR_TAGE = 14;    // so lange bleibt ein Kauf in der Anzeige
var MAX_EINTRAEGE = 25;

var args = process.argv.slice(2);
var TAGE = Math.max(1, Math.min(10, parseInt((args[args.indexOf('--tage') + 1] || '4'), 10) || 4));
var TROCKEN = args.indexOf('--trocken') !== -1;

/* Das liquide Universum der App - dieselbe Liste wie in mittelfrist.js. Werte von
 * dort bekommen einen Vermerk, weil sie zu dem passen, was die App ohnehin verfolgt.
 * Der Filter selbst haengt NICHT daran, sonst saehe man fast nie etwas: echte
 * Insider-Kaeufe sind gerade bei den ganz Grossen selten. */
var UNIVERSUM = (
  'AAPL MSFT AMZN GOOGL META NVDA TSLA AVGO ORCL CRM ADBE AMD INTC CSCO QCOM TXN IBM NOW INTU MU ' +
  'JPM BAC WFC GS MS C SCHW BLK AXP USB PNC COF BK SPGI CME ICE MMC AON ' +
  'JNJ UNH PFE ABBV MRK LLY TMO ABT DHR BMY AMGN GILD CVS CI ELV ISRG SYK BSX MDT ZTS ' +
  'XOM CVX COP SLB EOG PSX MPC VLO OXY WMB KMI HAL DVN HES ' +
  'PG KO PEP WMT COST MCD NKE SBUX TGT LOW HD DIS CMCSA VZ T TMUS CL KMB GIS ' +
  'CAT DE BA HON GE LMT RTX UNP UPS FDX MMM EMR ETN ITW PH CSX NSC WM ' +
  'LIN APD SHW ECL NEM FCX DOW DD PPG NEE DUK SO D AEP EXC SRE XEL ED PEG ' +
  'AMT PLD CCI EQIX SPG O PSA WELL AVB EQR ADP FI FIS GPN PAYX CTAS ROP FTV AME ' +
  'EBAY BKNG ABNB UBER DASH PYPL SHOP SNAP PINS SPOT NFLX ROKU F GM APTV BWA ' +
  'MAR HLT RCL CCL LVS WYNN MGM DAL UAL LUV ' +
  'PANW CRWD ZS OKTA NET DDOG SNOW MDB TEAM WDAY VEEV ADSK CDNS SNPS KLAC LRCX AMAT ASML TSM ARM'
).split(/\s+/).filter(Boolean);
var IM_UNIVERSUM = {};
UNIVERSUM.forEach(function (s) { IM_UNIVERSUM[s] = true; });

/* --- Eine Meldung im Detail lesen ------------------------------------------ */
function feld(xml, name) {
  var m = xml.match(new RegExp('<' + name + '>\\s*(?:<value>)?\\s*([^<]*)', 'i'));
  return m ? E.entities(m[1]).trim() : '';
}

function rolleLesen(xml) {
  var titel = feld(xml, 'officerTitle');
  var istDir = /<isDirector>\s*(?:1|true)/i.test(xml);
  var istOff = /<isOfficer>\s*(?:1|true)/i.test(xml);
  var istZehn = /<isTenPercentOwner>\s*(?:1|true)/i.test(xml);
  var rang = 0, text = '';
  if (istOff && titel) {
    text = titel;
    var gross = titel.toUpperCase();
    if (/CHIEF EXECUTIVE|\bCEO\b/.test(gross)) rang = 3;
    else if (/CHIEF FINANCIAL|\bCFO\b/.test(gross)) rang = 3;
    else rang = 2;
  } else if (istOff) { text = 'Vorstand'; rang = 2; }
  else if (istDir) { text = 'Aufsichtsrat'; rang = 1; }
  else if (istZehn) { text = '10-%-Aktionär'; rang = 0; }
  /* Nur Vorstand und Aufsichtsrat zaehlen. Ein reiner 10-%-Aktionaer ist meist eine
   * Struktur, kein Mensch mit Einblick: eine Muttergesellschaft, die die eigene
   * Tochter aufstockt, oder ein Kreditfonds, der eine Position aufbaut. Beides ist
   * kein "jemand kennt sein Unternehmen und kauft davon". Genau diese Faelle standen
   * im ersten Probelauf in der Liste (Donegal Mutual, GoldenTree) - sie sind raus. */
  return { text: text, rang: rang, intern: istOff || istDir };
}

/* Alle nicht-derivativen Kauf-Buchungen (Code P) einer Meldung zusammenrechnen.
 * Derivate bleiben bewusst aussen vor: eine Optionsausuebung ist kein Kaufentschluss. */
function kaeufeLesen(xml) {
  var teil = xml.split(/<nonDerivativeTable>/i)[1];
  if (!teil) return null;
  teil = teil.split(/<\/nonDerivativeTable>/i)[0];
  var stueck = 0, wert = 0, datum = '';
  var bloecke = teil.split(/<nonDerivativeTransaction>/i).slice(1);
  for (var i = 0; i < bloecke.length; i++) {
    var b = bloecke[i];
    if (feld(b, 'transactionCode') !== 'P') continue;      // nur offener Marktkauf
    if (feld(b, 'transactionAcquiredDisposedCode') !== 'A') continue;
    var n = parseFloat(feld(b, 'transactionShares').replace(/,/g, ''));
    var p = parseFloat(feld(b, 'transactionPricePerShare').replace(/,/g, ''));
    if (!isFinite(n) || !isFinite(p) || n <= 0 || p <= 0) continue;
    stueck += n; wert += n * p;
    if (!datum) datum = feld(b, 'transactionDate');
  }
  if (!stueck) return null;
  return { stueck: stueck, wert: wert, kurs: wert / stueck, datum: datum };
}

async function meldungLesen(cik, acc, weg) {
  // Der Index nennt die vollstaendige Einreichung als .txt - darin steckt das
  // Form-4-XML bereits drin. Ein Abruf je Meldung genuegt, kein Umweg ueber das
  // Verzeichnis: halbiert die Last auf den Servern der SEC.
  var ganz = await E.hole('https://www.sec.gov/Archives/' + weg);
  await E.warte(E.PAUSE);
  if (!ganz || !/<ownershipDocument/i.test(ganz)) return null;
  // Nur den Form-4-Teil betrachten: die Einreichung kann Anhaenge enthalten
  var xml = ganz.split(/<ownershipDocument>/i)[1];
  if (!xml) return null;
  xml = xml.split(/<\/ownershipDocument>/i)[0];
  var kauf = kaeufeLesen(xml);
  if (!kauf) return null;
  return {
    sym: feld(xml, 'issuerTradingSymbol').toUpperCase(),
    firma: feld(xml, 'issuerName'),
    person: feld(xml, 'rptOwnerName'),
    rolle: rolleLesen(xml),
    kauf: kauf,
    url: 'https://www.sec.gov/Archives/edgar/data/' + cik + '/' + acc.replace(/-/g, '') + '/' + acc + '-index.htm'
  };
}

/* Geschlossene Fonds und Verbriefungen melden ebenfalls Form 4, sind aber keine
 * operativen Firmen - dort kauft ein Verwalter Anteile, kein Mensch mit Einblick in
 * ein Geschaeft. Im ersten Probelauf waren das PCF und EOS. */
function istFonds(name) {
  return /\b(fund|trust ii|closed[- ]end|income trust|municipal|bond|etf|acquisition corp)\b/i.test(String(name || ''));
}

/* --- Aufbereiten ----------------------------------------------------------- */
function firmaKurz(s) {
  return String(s || '').replace(/[\s,]+(Inc\.?|Corp\.?|Corporation|Co\.|Ltd\.?|L\.?P\.?|plc|PLC|N\.V\.|S\.A\.|Holdings?|Group)$/i, '').slice(0, 40);
}

/* EDGAR fuehrt Personen als "Nachname Vorname Mittelname", mal in Grossbuchstaben,
 * mal gemischt. Umdrehen waere geraten - bei "Milton C Iii Ault" ist maschinell nicht
 * zu entscheiden, wo der Nachname aufhoert. Also bleibt die Reihenfolge wie geliefert
 * und nur die Schreibweise wird vereinheitlicht: einheitlich falsch herum ist besser
 * lesbar als mal so, mal so. */
function personKurz(s) {
  var t = String(s || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.replace(/([A-ZÄÖÜ])([A-ZÄÖÜ]+)/g, function (_, a, b) { return a + b.toLowerCase(); }).slice(0, 40);
}

/* Ein Kauf allein ist ein Datenpunkt; mehrere Insider derselben Firma binnen weniger
 * Tage sind der in der Literatur staerkste Fall. Genau das wird hier ausgewiesen -
 * als Beschreibung dessen, was gemeldet wurde, nicht als Bewertung der Aussicht. */
function verdichten(funde) {
  var jeSym = {};
  funde.forEach(function (f) {
    if (!jeSym[f.sym]) jeSym[f.sym] = [];
    jeSym[f.sym].push(f);
  });
  var out = [];
  Object.keys(jeSym).forEach(function (sym) {
    var g = jeSym[sym];
    g.sort(function (a, b) { return b.kauf.wert - a.kauf.wert; });
    var wert = g.reduce(function (s, f) { return s + f.kauf.wert; }, 0);
    var koepfe = {};
    g.forEach(function (f) { koepfe[f.person] = true; });
    var anzahl = Object.keys(koepfe).length;
    var rang = g.reduce(function (m, f) { return Math.max(m, f.rolle.rang); }, 0);
    var datum = g.map(function (f) { return f.kauf.datum; }).sort().pop() || '';
    out.push({
      id: (datum.replace(/-/g, '') || '') + '-' + sym + '-insider',
      sym: sym,
      name: firmaKurz(g[0].firma),
      anzahl: anzahl,
      wert: Math.round(wert),
      stueck: Math.round(g.reduce(function (s, f) { return s + f.kauf.stueck; }, 0)),
      kurs: Math.round((wert / g.reduce(function (s, f) { return s + f.kauf.stueck; }, 0)) * 100) / 100,
      rang: rang,
      imUniversum: !!IM_UNIVERSUM[sym],
      wer: g.slice(0, 4).map(function (f) {
        return { person: personKurz(f.person), rolle: f.rolle.text, wert: Math.round(f.kauf.wert) };
      }),
      quellen: g.slice(0, 3).map(function (f, i) {
        return { titel: 'SEC Form 4' + (g.length > 1 ? ' (' + (i + 1) + ')' : ''), url: f.url };
      }),
      zeit: datum ? new Date(datum + 'T20:00:00Z').toISOString() : new Date().toISOString()
    });
  });
  // Cluster zuerst, dann Rang der hoechsten Rolle, dann Volumen
  out.sort(function (a, b) {
    return (b.anzahl - a.anzahl) || (b.wert - a.wert) || (b.rang - a.rang);
  });
  return out;
}

function schreibAtomar(ziel, text) {
  var tmp = ziel + '.tmp';
  fs.writeFileSync(tmp, text, 'utf8');
  fs.renameSync(tmp, ziel);
}

/* --- Hauptlauf ------------------------------------------------------------- */
async function hauptlauf() {
  if (!fs.existsSync(DATEN)) { console.error('Daten-Ordner fehlt: ' + DATEN); process.exit(1); }

  var gesehen = {};
  try { gesehen = JSON.parse(fs.readFileSync(GESEHEN, 'utf8')) || {}; } catch (e) { }

  console.log('Ticker-Liste der SEC laden …');
  var karte = await E.tickerKarte();
  await E.warte(E.PAUSE);
  console.log('  ' + Object.keys(karte).length + ' Emittenten mit Kuerzel.');

  console.log('Tagesindex der letzten ' + TAGE + ' Tage lesen …');
  var filings = await E.tagesFilings(karte, TAGE, '4');
  var accs = Object.keys(filings);
  console.log('  ' + accs.length + ' Form-4-Meldungen boersennotierter Emittenten.');

  var neu = accs.filter(function (a) { return !gesehen[a]; });
  console.log('  davon ' + neu.length + ' noch nicht gelesen.');

  var funde = [];
  for (var i = 0; i < neu.length; i++) {
    var acc = neu[i];
    var f = filings[acc];
    if ((i + 1) % 25 === 0) console.log('  … ' + (i + 1) + '/' + neu.length + ' (' + funde.length + ' Kaeufe)');
    var d = null;
    try { d = await meldungLesen(f.cik, acc, f.weg); } catch (e) { }
    gesehen[acc] = Date.now();
    if (!d || !d.kauf) continue;
    if (!d.rolle.intern) continue;                     // kein Vorstand, kein Aufsichtsrat
    if (d.kauf.kurs < MIN_KURS) continue;              // Pennystock
    if (d.kauf.wert < MIN_WERT) continue;              // zu klein, um etwas zu heissen
    if (istFonds(d.firma || f.firma)) continue;        // Fonds statt operativer Firma
    var sym = d.sym || f.sym;
    if (!sym || sym.length > 5 || !/^[A-Z.]+$/.test(sym)) continue;
    funde.push({
      acc: acc, sym: sym, firma: d.firma || f.firma, person: d.person,
      rolle: d.rolle, kauf: d.kauf, url: d.url
    });
  }
  console.log('  ' + funde.length + ' Kaeufe ueber der Schwelle.');

  /* Liquiditaetstest, ein Abruf je Kuerzel (nicht je Meldung). Ein Insider-Kauf bei
   * einem Wert, aus dem man nicht wieder herauskommt, ist fuer dieses Projekt keine
   * Beobachtung, sondern Ablenkung - Wilhelms Regel fuer das Radar gilt hier genauso.
   * Wer nicht beurteilt werden kann, weil Yahoo nichts liefert, bleibt drin: lieber
   * eine Zeile zu viel als ein stiller Filter, der Werte verschwinden laesst. */
  var symbole = {};
  funde.forEach(function (f) { symbole[f.sym] = true; });
  var symListe = Object.keys(symbole);
  console.log('Liquiditaet pruefen (' + symListe.length + ' Werte) …');
  var liquide = {}, unklar = [];
  for (var s = 0; s < symListe.length; s++) {
    var u = await E.tagesumsatz(symListe[s]);
    if (!u) { liquide[symListe[s]] = true; unklar.push(symListe[s]); continue; }
    liquide[symListe[s]] = u.umsatz >= MIN_UMSATZ;
  }
  var raus = funde.filter(function (f) { return !liquide[f.sym]; });
  funde = funde.filter(function (f) { return liquide[f.sym]; });
  if (raus.length) {
    var rSym = {}; raus.forEach(function (f) { rSym[f.sym] = true; });
    console.log('  zu eng gehandelt, weggelassen: ' + Object.keys(rSym).join(', '));
  }
  if (unklar.length) console.log('  ohne Kursdaten, drin gelassen: ' + unklar.join(', '));

  var eintraege = verdichten(funde);

  if (TROCKEN) {
    eintraege.forEach(function (e) {
      console.log('  ' + e.sym.padEnd(6) + (e.imUniversum ? '*' : ' ') +
        (Math.round(e.wert / 1000) + 'k$').padStart(9) + '  ' +
        (e.anzahl > 1 ? e.anzahl + ' Insider' : '1 Insider').padEnd(11) +
        (e.wer[0] ? e.wer[0].rolle.slice(0, 30) + ' – ' + e.wer[0].person : ''));
    });
    console.log('\n(trocken – nichts geschrieben, Zustand nicht fortgeschrieben)');
    return;
  }

  /* Bestehende Datei einlesen und fortschreiben: Kaeufe bleiben HALTBAR_TAGE lang
   * stehen, damit die Karte nicht bei jedem Lauf leer ist. Meldungen kommen bis zu
   * zwei Werktage nach dem Handel, und an einem ruhigen Tag gibt es schlicht keine. */
  var alt = [];
  try { alt = (JSON.parse(fs.readFileSync(ZIEL, 'utf8')) || {}).eintraege || []; } catch (e) { }
  var haben = {};
  eintraege.forEach(function (e) { haben[e.id] = true; });
  var grenze = Date.now() - HALTBAR_TAGE * 86400000;
  alt.forEach(function (e) {
    if (!e || haben[e.id]) return;
    var t = Date.parse(e.zeit || '');
    if (isFinite(t) && t >= grenze) eintraege.push(e);
  });
  eintraege.sort(function (a, b) {
    return (b.anzahl - a.anzahl) || (b.wert - a.wert) || (b.rang - a.rang);
  });
  eintraege = eintraege.slice(0, MAX_EINTRAEGE);

  schreibAtomar(ZIEL, JSON.stringify({
    stand: new Date().toISOString(),
    hinweis: 'Meldepflichtige Eigengeschäfte von Insidern (SEC Form 4, nur offene Marktkäufe). Ungemessen, keine Handelsempfehlung, keine Anlageberatung.',
    eintraege: eintraege
  }, null, 2));

  // Zustand aufraeumen: was aelter als 30 Tage ist, taucht in keinem Index mehr auf
  var alteGrenze = Date.now() - 30 * 86400000;
  Object.keys(gesehen).forEach(function (k) { if (gesehen[k] < alteGrenze) delete gesehen[k]; });
  schreibAtomar(GESEHEN, JSON.stringify(gesehen));

  console.log('Geschrieben: ' + eintraege.length + ' Einträge nach ' + ZIEL);
}

/* Nur laufen, wenn direkt aufgerufen. Beim require aus den Tests bleiben die
 * Bausteine still - sonst wuerde ein Testlauf die SEC abfragen und die Datei
 * ueberschreiben. Genau daran haengt, dass die Siebung ueberhaupt pruefbar ist:
 * ob nur Code P zaehlt und ob ein reiner 10-%-Aktionaer draussen bleibt, laesst
 * sich sonst nur am Quelltext ablesen statt an der Rechnung. */
if (require.main === module) hauptlauf();

module.exports = {
  kaeufeLesen: kaeufeLesen, rolleLesen: rolleLesen, verdichten: verdichten,
  istFonds: istFonds, personKurz: personKurz, firmaKurz: firmaKurz,
  MIN_KURS: MIN_KURS, MIN_WERT: MIN_WERT, MIN_UMSATZ: MIN_UMSATZ
};
