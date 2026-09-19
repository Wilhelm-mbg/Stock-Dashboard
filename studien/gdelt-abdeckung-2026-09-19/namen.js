'use strict';
/* GDELT-Abdeckungsprobe (Auftrag Nr. 44, 19.09.2026): EINE Normalisierung fuer beide Seiten.
 * Dieselbe Funktion laeuft ueber den Firmennamen der Karte UND ueber jeden Organisationstext aus GDELT -
 * nur so ist "exakt gleich" ein Vergleich derselben Groesse. Wer hier etwas aendert, aendert beide Seiten.
 * Simulation, keine Anlageberatung. */

/* Rechtsformen laut Auftrag §1 (nur am ENDE des Namens, wiederholt; mindestens ein Wort bleibt stehen).
 * "Northern Trust Corp" -> "northern trust" bliebe bei Streichung "am Ende" nicht stehen, weil "trust" selbst in der Liste
 * steht - die Untergrenze "ein Wort bleibt" faengt "Trust Co" -> "trust", aber nicht "Northern Trust" -> "northern".
 * Darum: ein Wort der Liste wird nur gestrichen, wenn danach noch >= 2 Woerter stehen ODER es das einzige Anhaengsel ist. */
var RECHTSFORMEN = ['inc', 'corp', 'corporation', 'co', 'ltd', 'plc', 'holdings', 'group', 'sa', 'nv', 'ag', 'se', 'lp', 'trust',
  'incorporated', 'company', 'limited', 'llc', 'holding', 'cos', 'companies'];
/* Anhaengsel aus EDGAR-Titeln, die kein Teil des Namens sind ("XYZ INC NEW", "CLASS A", "COMMON STOCK", "ADR") - werden wie
 * Rechtsformen nur am ENDE gestrichen, Wort fuer Wort. Ein Name, der echt auf "new" endet, verliert es auf beiden Seiten. */
var ANHANG = ['new', 'old', 'class', 'cl', 'a', 'b', 'c', 'common', 'stock', 'ordinary', 'shares', 'ads', 'adr', 'adrs'];
var RF = {}; RECHTSFORMEN.concat(ANHANG).forEach(function (w) { RF[w] = 1; });

/** Kleinschreibung, Satzzeichen weg, Rechtsformen am Ende weg, ein Leerzeichen zwischen Woertern. */
function normalisieren(s) {
  var t = String(s || '').toLowerCase();
  t = t.replace(/\/[^/]*\//g, ' ');              // EDGAR: "/DE/", "/NEW/"
  t = t.replace(/[^a-z0-9 ]+/g, ' ');            // Satzzeichen, "&", Bindestriche, Umlaute (GDELT ist ASCII)
  var w = t.split(/\s+/).filter(Boolean);
  if (w[0] === 'the') w.shift();
  while (w.length >= 2 && RF[w[w.length - 1]]) {
    /* "trust"/"group"/"holdings" als vorletztes Wort nur streichen, wenn das Wort davor kein Rechtsform-Wort ist
     * und >= 2 Woerter uebrig bleiben - sonst wird "Northern Trust" zu "northern". */
    if (w.length === 2 && (w[1] === 'trust' || w[1] === 'group' || w[1] === 'holdings' || w[1] === 'holding')) break;
    w.pop();
  }
  return w.join(' ');
}

/* Allerweltswoerter, die als Kurzform NICHT taugen (Auftrag §1: "american", "first", "united", "general" - Liste im Code). */
var ALLERWELT = ['american', 'first', 'united', 'general', 'national', 'international', 'global', 'federal', 'pacific',
  'southern', 'northern', 'western', 'eastern', 'central', 'standard', 'universal', 'digital', 'energy', 'capital',
  'financial', 'bancorp', 'community', 'citizens', 'peoples', 'security', 'liberty', 'freedom', 'heritage', 'pioneer',
  'summit', 'premier', 'advanced', 'applied', 'allied', 'associated', 'consolidated', 'continental', 'atlantic',
  'columbia', 'franklin', 'lincoln', 'washington', 'jefferson', 'hamilton', 'nations', 'regional', 'independent',
  'republic', 'royal', 'imperial', 'crown', 'eagle', 'phoenix', 'horizon', 'frontier', 'sterling', 'mercury',
  'atlas', 'apollo', 'titan', 'omega', 'alpha', 'delta', 'sigma', 'vector', 'matrix', 'quantum', 'fusion', 'vertex',
  'genesis', 'legacy', 'landmark', 'harbor', 'valley', 'river', 'mountain', 'ocean', 'island', 'coastal', 'prime',
  'select', 'smart', 'super', 'ultra', 'micro', 'hyper', 'mega', 'metro', 'urban', 'rural', 'health', 'medical',
  'therapeutics', 'pharmaceuticals', 'biosciences', 'technologies', 'systems', 'solutions', 'services', 'industries',
  'resources', 'partners', 'properties', 'realty', 'bancshares', 'banking', 'savings', 'mutual', 'insurance',
  'motors', 'airlines', 'foods', 'brands', 'stores', 'markets', 'networks', 'media', 'entertainment', 'sports',
  'green', 'clean', 'solar', 'water', 'power', 'electric', 'petroleum', 'natural', 'mining', 'gold', 'silver',
  'silicon', 'cyber', 'cloud', 'mobile', 'online', 'world', 'earth', 'planet', 'space', 'ocean', 'north', 'south',
  'east', 'west', 'great', 'grand', 'united', 'union', 'state', 'states', 'county', 'city', 'texas', 'california',
  'florida', 'georgia', 'virginia', 'carolina', 'jersey', 'york', 'boston', 'chicago', 'denver', 'dallas',
  'houston', 'atlanta', 'seattle', 'portland', 'orlando', 'canada', 'canadian', 'china', 'japan', 'india',
  'europe', 'european', 'america', 'americas', 'asia', 'africa', 'australia', 'brazil', 'mexico', 'israel',
  'british', 'french', 'german', 'swiss', 'dutch', 'spanish', 'italian', 'korea', 'korean', 'taiwan',
  'group', 'holdings', 'trust', 'company', 'corporation', 'limited', 'bank', 'banc', 'bancorporation',
  /* Nach dem Vorlauf 2025-06-02 ergaenzt (Handpruefung, pruefung-vorlauf.json): Personennamen ("Morgan" 10 von 10 falsch),
   * Zeitungen ("Express"), Gattungswoerter ("Gaming", "Martin Corporation") - und aus der Durchsicht ALLER 606 Kurzformen
   * der Karte alle Vor-/Nachnamen, Orte und Alltagswoerter. Die Vorlauf-Fehlerquote ist VOR dieser Ergaenzung gemessen. */
  'morgan', 'martin', 'express', 'gaming', 'academy', 'advance', 'alaska', 'arthur', 'aurora', 'automatic', 'baker', 'block',
  'bread', 'bristol', 'builders', 'cardinal', 'carrier', 'carters', 'chart', 'check', 'chemical', 'childrens', 'church', 'clear',
  'cooper', 'deutsche', 'discover', 'discovery', 'edison', 'edwards', 'enterprise', 'equity', 'exact', 'extra', 'fifth', 'floor',
  'fortune', 'gates', 'genuine', 'globe', 'harley', 'harris', 'hartford', 'hello', 'henry', 'huntington', 'illinois',
  'interactive', 'jackson', 'kansas', 'knight', 'legend', 'louisiana', 'magna', 'match', 'michael', 'monday', 'monster',
  'neighborhood', 'norfolk', 'oscar', 'packaging', 'parker', 'parsons', 'people', 'performance', 'permian', 'phillips',
  'plains', 'polaris', 'price', 'principal', 'quest', 'range', 'restaurant', 'revolution', 'robert', 'rocket', 'royalty',
  'service', 'shake', 'signet', 'simon', 'smith', 'southwest', 'stanley', 'steel', 'strategy', 'stride', 'toast', 'toronto',
  'trade', 'travel', 'trump', 'unity', 'uranium', 'victoria', 'viking', 'warner', 'wells', 'wendy', 'westinghouse',
  'whiting', 'willis', 'wheaton'];
var AW = {}; ALLERWELT.forEach(function (w) { AW[w] = 1; });

/** Kurzform: erstes Wort des normalisierten Namens, wenn >= 5 Buchstaben und kein Allerweltswort; sonst null. */
function kurzform(voll) {
  var w = String(voll || '').split(' ')[0] || '';
  if (!/^[a-z]{5,}$/.test(w) || AW[w]) return null;
  return w;
}

module.exports = { normalisieren: normalisieren, kurzform: kurzform, RECHTSFORMEN: RECHTSFORMEN, ALLERWELT: ALLERWELT };
