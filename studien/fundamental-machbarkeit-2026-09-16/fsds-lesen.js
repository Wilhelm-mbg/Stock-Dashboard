'use strict';
/* Leser fuer die SEC "Financial Statement Data Sets" (FSDS)
 * ========================================================
 * Quelle: https://www.sec.gov/dera/data/financial-statement-data-sets - je Kalenderquartal ein ZIP mit vier
 * Tab-getrennten Tabellen (Kopfzeile, dann eine Zeile je Satz). Rohdaten liegen NUR unter
 * E:/Markt-Dashboard-Archiv/edgar-fsds/<quartal>/ (sub.txt, num.txt, tag.txt, pre.txt, readme.htm).
 *
 * Die vier Tabellen (Felder, die hier zaehlen):
 *   sub.txt  eine Zeile je EINREICHUNG.  adsh = Akzessionsnummer (Schluessel, "0000320193-24-000069"),
 *            cik = Registrant, name, sic, form (10-K, 10-Q, 20-F, ...), period = BILANZSTICHTAG (yyyymmdd),
 *            fy/fp = Geschaeftsjahr/-abschnitt, filed = EINREICHUNGSDATUM (yyyymmdd; erst ab da ist die Zahl
 *            oeffentlich), accepted = Annahme-Zeitstempel der SEC, prevrpt = 1 wenn spaeter eine Aenderung
 *            eingereicht wurde, afs = Filer-Status (1-LAF, 2-ACC, 3-SRA, 4-NON, 5-SML), instance = XBRL-Datei.
 *   num.txt  eine Zeile je ZAHL.  adsh, tag, version (us-gaap/2023, ifrs/2023, dei/..., oder = adsh fuer
 *            firmeneigene Tags), ddate = Ende der Berichtsperiode der Zahl (yyyymmdd; bei Vergleichszahlen
 *            aelter als sub.period), qtrs = 0 Bestandsgroesse, 1 Quartal, 4 Jahr (Dauer in Quartalen),
 *            uom = Einheit (USD, shares, ...), segments = leer fuer den Konzernwert (sonst Segmentdaten),
 *            coreg = leer fuer den Registranten selbst, value.
 *   tag.txt  Beschreibung je (tag, version): custom = 1 firmeneigen, datatype, iord (I Bestand / D Dauer), crdr.
 *   pre.txt  Darstellung je Einreichung: report/line/stmt (BS, IS, CF, EQ, CI, ...), tag, plabel (der Text, den die
 *            Firma an die Zeile schreibt) - zeigt, welchen Tag eine Firma als "Umsatz" zeigt.
 *
 * Punkt-in-Zeit: verwendbar ab sub.filed, NIE ab ddate/period. Erste Veroeffentlichung gilt; spaetere Filings
 * (10-K/A, naechstes 10-Q mit Vergleichszahl) koennen denselben (cik, tag, ddate, qtrs) mit anderem Wert tragen.
 *
 * Aufruf als Werkzeug:  node fsds-lesen.js <quartal> --cik <cik> [--tags Tag1,Tag2]   zeigt Einreichungen + Werte.
 * Als Modul: tabelle(), ladeSub(), ZIEL_TAGS.
 */
var fs = require('fs');
var path = require('path');
var readline = require('readline');

var WURZEL = process.env.FSDS_WURZEL || 'E:/Markt-Dashboard-Archiv/edgar-fsds';

/* Die Groessen des Auftrags. Umsatz hat mehrere Namen (ASC 606 ab 2018 brachte RevenueFromContractWithCustomer...);
 * die Familie steht hier, die Messung der Anteile macht tags.js. */
var ZIEL_TAGS = {
  umsatz: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'RevenueFromContractWithCustomerIncludingAssessedTax',
    'SalesRevenueNet', 'SalesRevenueGoodsNet', 'SalesRevenueServicesNet', 'RevenuesNetOfInterestExpense',
    'InterestAndDividendIncomeOperating', 'RegulatedAndUnregulatedOperatingRevenue', 'OperatingLeasesIncomeStatementLeaseRevenue',
    'RevenueMineralSales', 'OilAndGasRevenue', 'InterestIncomeExpenseNet', 'HealthCareOrganizationRevenue', 'RealEstateRevenueNet'],
  umsatzkosten: ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold', 'CostOfServices', 'CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization'],
  vermoegen: ['Assets'],
  fue: ['ResearchAndDevelopmentExpense', 'ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost', 'ResearchAndDevelopmentExpenseSoftwareExcludingAcquiredInProcessCost'],
  aktien: ['EntityCommonStockSharesOutstanding', 'CommonStockSharesOutstanding', 'WeightedAverageNumberOfSharesOutstandingBasic', 'WeightedAverageNumberOfDilutedSharesOutstanding'],
};
var TAG_GRUPPE = {};
Object.keys(ZIEL_TAGS).forEach(function (g) { ZIEL_TAGS[g].forEach(function (t) { TAG_GRUPPE[t] = g; }); });

function pfad(quartal, name) { return path.join(WURZEL, quartal, name + '.txt'); }

function quartale() {
  return fs.readdirSync(WURZEL).filter(function (d) { return /^\d{4}q[1-4]$/.test(d) && fs.existsSync(pfad(d, 'sub')); }).sort();
}

/* Eine Tabelle zeilenweise lesen. jeZeile(objekt) bekommt ein Objekt mit den Kopfzeilen-Feldern; gibt es false
 * zurueck, wird nichts weiter getan (kein Abbruch - die Datei wird immer ganz gelesen). Loest mit der Zeilenzahl auf.
 * Streaming, weil num.txt bis 0,5 GB je Quartal hat und als Ganzes den Heap sprengt. */
function tabelle(quartal, name, jeZeile) {
  return new Promise(function (ok, nein) {
    var p = pfad(quartal, name);
    if (!fs.existsSync(p)) return nein(new Error('fehlt: ' + p));
    var rl = readline.createInterface({ input: fs.createReadStream(p, { encoding: 'utf8' }), crlfDelay: Infinity });
    var kopf = null, n = 0;
    rl.on('line', function (z) {
      if (!kopf) { kopf = z.split('\t'); return; }
      if (!z) return;
      var f = z.split('\t'), o = {};
      for (var i = 0; i < kopf.length; i++) o[kopf[i]] = f[i] === undefined ? '' : f[i];
      n++;
      jeZeile(o, n);
    });
    rl.on('close', function () { ok(n); });
    rl.on('error', nein);
  });
}

/** Alle Einreichungen eines Quartals (sub.txt ist klein, 2 MB), optional gefiltert. */
function ladeSub(quartal, filter) {
  var aus = [];
  return tabelle(quartal, 'sub', function (s) { if (!filter || filter(s)) aus.push(s); }).then(function () { return aus; });
}

/** yyyymmdd -> Date (UTC-Mittag, damit Tagesdifferenzen ganzzahlig sind). */
function datum(yyyymmdd) {
  var s = String(yyyymmdd);
  return new Date(Date.UTC(+s.slice(0, 4), +s.slice(4, 6) - 1, +s.slice(6, 8), 12));
}
function tageZwischen(a, b) { return Math.round((datum(b) - datum(a)) / 86400000); }
function iso(yyyymmdd) { var s = String(yyyymmdd); return s.slice(0, 4) + '-' + s.slice(4, 6) + '-' + s.slice(6, 8); }

/* ---------- Werkzeug-Aufruf ---------- */
async function main() {
  var a = process.argv.slice(2);
  var quartal = a[0];
  var ciks = {}, tags = null;
  for (var i = 1; i < a.length; i++) {
    if (a[i] === '--cik') ciks[String(parseInt(a[++i], 10))] = 1;
    else if (a[i] === '--tags') tags = a[++i].split(',');
  }
  if (!quartal || !Object.keys(ciks).length) {
    console.log('Aufruf: node fsds-lesen.js <quartal> --cik <cik> [--tags A,B]   Quartale: ' + quartale().join(' '));
    return;
  }
  var subs = await ladeSub(quartal, function (s) { return ciks[String(parseInt(s.cik, 10))]; });
  var adsh = {};
  subs.forEach(function (s) {
    adsh[s.adsh] = s;
    console.log([s.adsh, s.cik, s.name, s.form, 'period ' + iso(s.period), 'filed ' + iso(s.filed), 'fy' + s.fy + s.fp, 'afs ' + s.afs, 'prevrpt ' + s.prevrpt].join(' | '));
  });
  var will = {};
  (tags || Object.keys(TAG_GRUPPE)).forEach(function (t) { will[t] = 1; });
  var zeilen = [];
  await tabelle(quartal, 'num', function (n) {
    if (!adsh[n.adsh] || !will[n.tag] || n.segments || n.coreg) return;
    zeilen.push([n.adsh, n.tag, n.version, iso(n.ddate), 'qtrs ' + n.qtrs, n.uom, n.value].join(' | '));
  });
  zeilen.sort().forEach(function (z) { console.log(z); });
}

module.exports = { WURZEL: WURZEL, ZIEL_TAGS: ZIEL_TAGS, TAG_GRUPPE: TAG_GRUPPE, quartale: quartale, tabelle: tabelle,
  ladeSub: ladeSub, datum: datum, tageZwischen: tageZwischen, iso: iso, pfad: pfad };

if (require.main === module) main().catch(function (e) { console.error(e); process.exit(1); });
