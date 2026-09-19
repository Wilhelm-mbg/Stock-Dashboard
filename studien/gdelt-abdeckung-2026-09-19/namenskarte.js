'use strict';
/* Baustein 1 (Auftrag Nr. 44): Namenskarte fuer die Panel-Klassen 1-3 (Panel v2.1, Stichtage 2025-01-02 und 2018-01-02).
 * Firmenname je Symbol aus ZWEI Quellen: EDGAR company_tickers.json (title; Vorsicht: heutiger Besitzer des Kuerzels,
 * wiki/datenquellen.md) und die Stammdaten der App (Markt-Dashboard-Daten/markt/stammdaten.json, name). Beide werden
 * mit namen.js normalisiert; unterscheiden sie sich danach, traegt die Karte beide (voll, voll2) - GDELT trifft "voll",
 * wenn EINE Form exakt gleich ist. Quelle: 'stammdaten' | 'edgar' | 'beide' | null.
 * Aufruf (aus dem Studienordner): node namenskarte.js  -> namenskarte.json, Zusammenfassung auf stdout.
 * NUR LESEN auf Panel und Stammdaten. Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');
var N = require('./namen.js');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..');
var QS = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
var K = require(path.join(QS, 'konfig.js'));
var PS = require(path.join(QS, 'pruefstand.js'));
var STAMM = path.join(process.env.USERPROFILE || 'C:/Users/Wilhe', 'Downloads', 'Markt-Dashboard-Daten', 'markt', 'stammdaten.json');
var TICKERS = path.join(HIER, 'voll', 'company_tickers.json');
var STICHTAGE = ['2025-01-02', '2018-01-02'];
var KLASSEN = [1, 2, 3];

function basisKuerzel(reihe) { return String(reihe).replace(/~\d+$/, ''); }

/* ---------- 1. Symbole je Stichtag aus dem Panel ---------- */
var T = PS.Tafel(path.join(QS, 'voll'));
var kal = K.kalender();
var karte = {}, jeStichtag = {};
STICHTAGE.forEach(function (tag) {
  var ti = kal.idx[tag];
  if (ti == null) throw new Error('Stichtag nicht im Kalender: ' + tag);
  var u = PS.universum(T, ti, { klassen: KLASSEN });
  var jahr = tag.slice(0, 4), z = { 1: 0, 2: 0, 3: 0 };
  u.liste.forEach(function (e) {
    var r = T.symName[e.sym];
    if (!karte[r]) karte[r] = { voll: null, voll2: null, kurz: null, quelle: null, klasse2025: null, klasse2018: null };
    karte[r]['klasse' + jahr] = e.klasse;
    z[e.klasse]++;
  });
  jeStichtag[tag] = { symbole: u.liste.length, jeKlasse: z, verworfen: u.verworfen };
});

/* ---------- 2. Namen aus beiden Quellen ---------- */
var edgar = {};
var tj = JSON.parse(fs.readFileSync(TICKERS, 'utf8'));
Object.keys(tj).forEach(function (k) { var e = tj[k]; if (e && e.ticker && !edgar[e.ticker]) edgar[e.ticker] = e.title; });
var stamm = {};
try { stamm = JSON.parse(fs.readFileSync(STAMM, 'utf8')).werte || {}; } catch (e) { process.stderr.write('Stammdaten nicht lesbar: ' + e.message + '\n'); }

function edgarName(reihe) {
  var b = basisKuerzel(reihe);
  return edgar[b] || edgar[b.replace(/\./g, '-')] || edgar[b.replace(/-/g, '.')] || null;
}
/* Dritte Quelle NUR fuer Symbole, die in beiden ersten fehlen (erloschene Reihen von 2018): der zeitgefensterte
 * EDGAR-Volltext-Cache der Gruende-Studie (studien/verschwundene-gruende-2026-09-12/edgar/kuerzel/<SYM>.json,
 * `eimer` = Registranten, in deren Einreichungen das Kuerzel im Fenster um den letzten Balken vorkommt). Regel wie dort
 * (edgar-lauf.js, 'fts-mehrheit'): Eimer gleichen normalisierten Namens zusammenlegen, oberster mit n >= 3 und >= 2 x
 * dem zweiten; Fonds/Trusts/Serien als Treffer verworfen (sie ZITIEREN Kuerzel, sind nicht der Emittent). */
var FTS = path.join(REPO, 'studien', 'verschwundene-gruende-2026-09-12', 'edgar', 'kuerzel');
/* Strukturierte-Produkte-Emittenten und Fondsgesellschaften ZITIEREN Kuerzel in tausenden Einreichungen (Probe: BK -> FMR LLC
 * 1.796, X -> HSBC USA 11.107, EA -> Citigroup Global Markets 15.907). Sie sind nie der gesuchte Emittent. */
var ZITIERER = /\b(trust|funds?|series|etf|portfolio|advisors|asset management|capital markets|markets holdings|financial co|finance llc|finance corp|international finance|global markets|index funds|fmr|dfa investment|valic|profunds|federal national mortgage|federal home loan|gs finance|bofa finance|hsbc|morgan stanley|citigroup|jpmorgan|ubs|blackrock|barclays|goldman sachs|vanguard|invesco|state street|wells fargo|bank of america|credit suisse|deutsche bank|nomura|mizuho|societe generale|bnp paribas|royal bank of canada|toronto dominion|bank of montreal|scotia)\b/i;
function ftsName(reihe) {
  var b = basisKuerzel(reihe), p = path.join(FTS, b + '.json');
  if (!fs.existsSync(p)) return null;
  var k = JSON.parse(fs.readFileSync(p, 'utf8')), summe = {}, reihenfolge = [];
  (k.eimer || []).forEach(function (e) {
    if (!e.name) return;
    var nn = N.normalisieren(e.name);
    if (!summe[nn]) { summe[nn] = { name: e.name, n: 0, eigen: false }; reihenfolge.push(nn); }
    summe[nn].n += e.n || 0;
    /* Traegt der Registrant das Kuerzel selbst, ist er der Emittent (HES -> HESS CORP[HES]). Fremde Kuerzel sind KEIN
     * Ausschluss: der Emittent kann inzwischen umbenannt sein (DISCA -> Discovery, Inc.[WBD]). */
    if ((e.tickers || []).indexOf(b) >= 0) summe[nn].eigen = true;
  });
  var l = reihenfolge.map(function (nn) { return summe[nn]; });
  var eigen = l.filter(function (x) { return x.eigen; }).sort(function (a, b) { return b.n - a.n; });
  if (eigen.length) return eigen[0].name;
  l = l.filter(function (x) { return !ZITIERER.test(x.name); }).sort(function (a, b) { return b.n - a.n; });
  if (!l.length || l[0].n < 3 || (l[1] && l[0].n < 2 * l[1].n)) return null;
  return l[0].name;
}
/* Umbenannte Kuerzel (ende_grund 'umbenennung-ticker', BK -> BNY, GPS -> GAP, SQ -> XYZ): der Nachfolger steht in den
 * name_changes der Quelle (kuerzelwechsel-kandidaten.json des Pruefstands, Regel A: old_symbol == S). Name dann ueber
 * den Nachfolger aus Stammdaten/EDGAR - dieselbe Firma, nur ein neues Kuerzel. */
var WECHSEL = {};
try {
  JSON.parse(fs.readFileSync(path.join(QS, 'kuerzelwechsel-kandidaten.json'), 'utf8')).kandidaten.forEach(function (k) {
    (k.wechsel || []).forEach(function (w) { if (w.regel === 'A' && w.new_symbol && w.new_symbol !== k.basis) (WECHSEL[k.basis] = WECHSEL[k.basis] || []).push(w); });
  });
} catch (e) { process.stderr.write('kuerzelwechsel-kandidaten.json nicht lesbar: ' + e.message + '\n'); }
var ENDE = {}; T.stand.symbole.forEach(function (r) { ENDE[r.reihe] = r; });
/* Der Wechsel, der ZUM Reihenende gehoert: der erste mit Datum ab (Ende - 10 Tage) - nicht der letzte je Kuerzel, sonst
 * landet PX (Praxair, 2018) beim Wechsel eines spaeteren PX (P10 Inc, 2026). Kette bis 3 Stufen (HCP -> PEAK -> DOC). */
function naechsterWechsel(basis, abDatum) {
  var l = (WECHSEL[basis] || []).filter(function (w) { return w.datum >= abDatum; }).sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
  return l[0] || null;
}
function nachfolgerName(reihe) {
  var r = ENDE[reihe];
  if (!r || !r.ende_datum || (r.ende_grund !== 'umbenennung-ticker' && r.ende_grund !== 'kuerzel-neu-vergeben')) return null;
  var ab = new Date(Date.parse(r.ende_datum) - 10 * 86400000).toISOString().slice(0, 10), sym = basisKuerzel(reihe), kette = [];
  /* Der ERSTE Wechsel muss binnen 40 Tagen nach dem Reihenende liegen - sonst gehoert er einem spaeteren Besitzer des
   * Kuerzels (BBBY 2023 insolvent, BBBY -> NXH 2026 ist Beyond Inc.). Spaetere Glieder der Kette duerfen Jahre spaeter liegen. */
  var spaetestens = new Date(Date.parse(r.ende_datum) + 40 * 86400000).toISOString().slice(0, 10);
  for (var i = 0; i < 3; i++) {
    var w = naechsterWechsel(sym, ab);
    if (!w || (i === 0 && w.datum > spaetestens)) break;
    kette.push(w.new_symbol); sym = w.new_symbol; ab = w.datum;
    var n = stammName(sym) || edgarName(sym);
    if (n) return { name: n, neu: kette.join('>') };
  }
  return null;
}
function stammName(reihe) {
  var b = basisKuerzel(reihe), e = stamm[b] || stamm[b.replace(/\./g, '-')] || stamm[b.replace(/-/g, '.')];
  return e && e.name ? e.name : null;
}

var zaehl = { symbole: 0, beide: 0, nurStammdaten: 0, nurEdgar: 0, nachfolger: 0, edgarFts: 0, ohneNamen: 0, vollVerschieden: 0, mitKurz: 0, kuerzelWiederverwendet: 0 };
var ohne = [], verschieden = [], fts = [], nachf = [];
Object.keys(karte).sort().forEach(function (r) {
  var k = karte[r], s = stammName(r), e = edgarName(r), f = null, nf = null;
  var ns = s ? N.normalisieren(s) : '', ne = e ? N.normalisieren(e) : '';
  zaehl.symbole++;
  if (/~\d+$/.test(r)) zaehl.kuerzelWiederverwendet++;
  if (ns && ne) { zaehl.beide++; k.quelle = 'beide'; k.voll = ns; if (ne !== ns) { k.voll2 = ne; zaehl.vollVerschieden++; verschieden.push(r + ': ' + ns + ' | ' + ne); } }
  else if (ns) { zaehl.nurStammdaten++; k.quelle = 'stammdaten'; k.voll = ns; }
  else if (ne) { zaehl.nurEdgar++; k.quelle = 'edgar'; k.voll = ne; }
  else if ((nf = nachfolgerName(r))) { zaehl.nachfolger++; k.quelle = 'nachfolger:' + nf.neu; k.voll = N.normalisieren(nf.name); nachf.push(r + '->' + nf.neu + '=' + nf.name); }
  else if ((f = ftsName(r))) { zaehl.edgarFts++; k.quelle = 'edgar-fts'; k.voll = N.normalisieren(f); fts.push(r + '=' + f); }
  else { zaehl.ohneNamen++; ohne.push(r); }
  k.roh = { stammdaten: s, edgar: e, nachfolger: nf ? nf.name : null, fts: f };
  if (k.voll) { k.kurz = N.kurzform(k.voll); if (k.kurz) zaehl.mitKurz++; }
});

/* Kurzformen, die mehrere Symbole teilen, sind nicht eindeutig -> keine Kurzform (sonst zaehlt ein Artikel fuer zwei). */
var kurzZu = {};
Object.keys(karte).forEach(function (r) { var q = karte[r].kurz; if (q) (kurzZu[q] = kurzZu[q] || []).push(r); });
var kurzDoppelt = Object.keys(kurzZu).filter(function (q) { return kurzZu[q].length > 1; });
kurzDoppelt.forEach(function (q) { kurzZu[q].forEach(function (r) { karte[r].kurz = null; zaehl.mitKurz--; }); });
/* Dasselbe fuer "voll": zwei Symbole mit gleichem normalisiertem Namen (z. B. zwei Aktienklassen) bleiben BEIDE in der
 * Karte - der Artikel gehoert zu beiden; gezaehlt und ausgewiesen. */
var vollZu = {};
Object.keys(karte).forEach(function (r) { [karte[r].voll, karte[r].voll2].forEach(function (v) { if (v) (vollZu[v] = vollZu[v] || []).push(r); }); });
var vollDoppelt = Object.keys(vollZu).filter(function (v) { return vollZu[v].length > 1; }).map(function (v) { return v + ' -> ' + vollZu[v].join(','); });

var aus = { kennung: 'gdelt-abdeckung-2026-09-19/namenskarte/v1', stand: new Date().toISOString(), panel: T.stand.kennung,
  stichtage: jeStichtag, zaehler: zaehl, ohneNamen: ohne, vollVerschieden: verschieden, nachfolger: nachf, edgarFts: fts,
  kurzDoppelt: kurzDoppelt.map(function (q) { return q + ' -> ' + kurzZu[q].join(','); }), vollDoppelt: vollDoppelt,
  karte: karte };
fs.writeFileSync(path.join(HIER, 'namenskarte.json'), JSON.stringify(aus, null, 1));
process.stdout.write(JSON.stringify({ stichtage: jeStichtag, zaehler: zaehl, ohneNamen: ohne.length, kurzDoppelt: aus.kurzDoppelt.length, vollDoppelt: vollDoppelt.length }, null, 1) + '\n');
process.stdout.write('Beispiele: ' + ['AAPL', 'AAON', 'BRK.B', 'GOOGL', 'JPM', 'NTRS'].map(function (r) { return karte[r] ? r + '=' + karte[r].voll + (karte[r].voll2 ? '|' + karte[r].voll2 : '') + '/' + karte[r].kurz : r + '=-'; }).join('  ') + '\n');
