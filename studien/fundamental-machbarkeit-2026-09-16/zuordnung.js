'use strict';
/* Zuordnungstabelle der Fundamentaltafel: welche XBRL-Tags eine Groesse liefern, in welcher Reihenfolge, mit welcher
 * Regel. Eine Stelle fuer auszug.js, bauen.js und test-fundamental.js - die Tafel und die Pruefungen lesen dieselbe Liste.
 *
 * Grundlage: Werte-Sicht aus der Machbarkeit (MACHBARKEIT.md §3.4): Top 3 der Umsatz-Tags decken 88-92 %, Top 5 97-99 %;
 * SalesRevenueNet ist seit 2018 tot, bleibt aber fuer 2016/2017 in der Liste. Zins-Tags (Interest...) sind NUR bei
 * Finanzwerten (SIC 6000-6799) Umsatz - sonst ginge "Zinsertrag, netto" eines Industriewerts als Umsatz durch.
 *
 * Bestand (qtrs 0) vs. Fluss (qtrs 1 Quartal, 4 Jahr): vermoegen, eigenkapital, aktienBestand sind Bestaende zum
 * Stichtag; umsatz, netto, operativ, umsatzkosten, fue sind Fluesse.
 */
var GRUPPEN = {
  umsatz: { art: 'fluss', tags: ['Revenues', 'RevenueFromContractWithCustomerExcludingAssessedTax', 'RevenueFromContractWithCustomerIncludingAssessedTax',
    'SalesRevenueNet', 'SalesRevenueGoodsNet', 'SalesRevenueServicesNet', 'RevenuesNetOfInterestExpense',
    'InterestAndDividendIncomeOperating', 'RegulatedAndUnregulatedOperatingRevenue', 'OperatingLeasesIncomeStatementLeaseRevenue',
    'RevenueMineralSales', 'OilAndGasRevenue', 'InterestIncomeExpenseNet', 'HealthCareOrganizationRevenue', 'RealEstateRevenueNet'], uom: 'USD' },
  netto: { art: 'fluss', tags: ['NetIncomeLoss', 'ProfitLoss', 'NetIncomeLossAvailableToCommonStockholdersBasic', 'IncomeLossFromContinuingOperations'], uom: 'USD' },
  operativ: { art: 'fluss', tags: ['OperatingIncomeLoss'], uom: 'USD' },
  umsatzkosten: { art: 'fluss', tags: ['CostOfRevenue', 'CostOfGoodsAndServicesSold', 'CostOfGoodsSold', 'CostOfServices', 'CostOfGoodsAndServiceExcludingDepreciationDepletionAndAmortization'], uom: 'USD' },
  fue: { art: 'fluss', tags: ['ResearchAndDevelopmentExpense', 'ResearchAndDevelopmentExpenseExcludingAcquiredInProcessCost', 'ResearchAndDevelopmentExpenseSoftwareExcludingAcquiredInProcessCost'], uom: 'USD' },
  vermoegen: { art: 'bestand', tags: ['Assets'], uom: 'USD' },
  eigenkapital: { art: 'bestand', tags: ['StockholdersEquity', 'StockholdersEquityIncludingPortionAttributableToNoncontrollingInterest', 'PartnersCapital', 'MembersEquity'], uom: 'USD' },
  /* Aktienzahl: Deckblatt (dei, steht fast nie in num.txt), Bilanzbestand, gewichtete Zahlen (Fluss), ausgegebene Aktien
   * (Bestand, enthaelt eigene Aktien - letzter Ausweg, als Fallback markiert). */
  aktien: { art: 'aktien', tags: ['EntityCommonStockSharesOutstanding', 'CommonStockSharesOutstanding', 'WeightedAverageNumberOfSharesOutstandingBasic',
    'WeightedAverageNumberOfDilutedSharesOutstanding', 'CommonStockSharesIssued'], uom: 'shares' },
};
var AKTIEN_BESTAND = { EntityCommonStockSharesOutstanding: 1, CommonStockSharesOutstanding: 1, CommonStockSharesIssued: 1 };
var NUR_FINANZ = { InterestAndDividendIncomeOperating: 1, InterestIncomeExpenseNet: 1 };

var TAG_GRUPPE = {}, TAG_PRIO = {};
Object.keys(GRUPPEN).forEach(function (g) { GRUPPEN[g].tags.forEach(function (t, i) { TAG_GRUPPE[t] = g; TAG_PRIO[t] = i; }); });

/* Formulare: die US-Standardberichte kommen in die Tafel; 20-F/40-F werden nur gezaehlt. 10-KT/10-QT sind
 * Uebergangsberichte derselben Familie (Wechsel des Geschaeftsjahrs) - selten, aufgenommen, als "T" markiert. */
var FORM_ART = { '10-K': 'K', '10-K/A': 'KA', '10-KT': 'KT', '10-KT/A': 'KTA', '10-K405': 'K',
  '10-Q': 'Q', '10-Q/A': 'QA', '10-QT': 'QT', '10-QT/A': 'QTA',
  '20-F': 'F', '20-F/A': 'FA', '40-F': 'F', '40-F/A': 'FA' };
var US_STANDARD = { K: 1, KA: 1, KT: 1, KTA: 1, Q: 1, QA: 1, QT: 1, QTA: 1 };
var JAHRESFORM = { K: 1, KA: 1, KT: 1, KTA: 1 };

function istFinanz(sic) { var n = parseInt(sic, 10); return n >= 6000 && n <= 6799; }

/* SIC-Bereiche als Sektorschluessel (GICS haben wir nicht): die zehn Divisionen der SIC-Systematik. */
var SIC_DIVISIONEN = [
  { von: 100, bis: 999, name: 'Landwirtschaft' }, { von: 1000, bis: 1499, name: 'Bergbau/Oel' }, { von: 1500, bis: 1799, name: 'Bau' },
  { von: 2000, bis: 3999, name: 'Verarbeitendes Gewerbe' }, { von: 4000, bis: 4999, name: 'Transport/Versorger/Kommunikation' },
  { von: 5000, bis: 5199, name: 'Grosshandel' }, { von: 5200, bis: 5999, name: 'Einzelhandel' }, { von: 6000, bis: 6799, name: 'Finanzen/Immobilien' },
  { von: 7000, bis: 8999, name: 'Dienstleistungen' }, { von: 9100, bis: 9999, name: 'Oeffentliche Verwaltung' }];
function sektorVonSic(sic) {
  var n = parseInt(sic, 10);
  if (!(n > 0)) return null;
  for (var i = 0; i < SIC_DIVISIONEN.length; i++) if (n >= SIC_DIVISIONEN[i].von && n <= SIC_DIVISIONEN[i].bis) return SIC_DIVISIONEN[i].name;
  return 'unbekannt';
}

module.exports = { GRUPPEN: GRUPPEN, TAG_GRUPPE: TAG_GRUPPE, TAG_PRIO: TAG_PRIO, AKTIEN_BESTAND: AKTIEN_BESTAND, NUR_FINANZ: NUR_FINANZ,
  FORM_ART: FORM_ART, US_STANDARD: US_STANDARD, JAHRESFORM: JAHRESFORM, istFinanz: istFinanz, SIC_DIVISIONEN: SIC_DIVISIONEN, sektorVonSic: sektorVonSic };
