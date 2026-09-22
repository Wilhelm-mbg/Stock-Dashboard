'use strict';
/* Namenskarte v2 (Auftrag Nr. 47, Baustein 2) fuer den GDELT-Datenbau der Stimmungsstudie (§2 der Vorregistrierung).
 * Symbole: VEREINIGUNG der Universen `universum(T, t, {klassen:[2,3]})` des Panels v2.1 am ERSTEN HANDELSTAG jedes Monats
 * 2017-01 … 2026-08 (116 Stichtage). Heraus fallen:
 *   - die 25 Kuerzel der Handliste MEDIEN (studien/gdelt-abdeckung-2026-09-19/auswerten.js) - §2: aus dem Universum, nicht nur
 *     aus der Zaehlung;
 *   - wiederverwendete Kuerzel (Entscheid PM 22.09.): jede Reihe, deren Basiskuerzel im Panel mehr als eine Reihe hat
 *     (Trennung S / S~2 am Wechseltag) oder deren Ende-Grund 'kuerzel-neu-vergeben' ist - der Name ueber EDGAR/Stammdaten ist
 *     dort der HEUTIGE Besitzer und fuer die Vergangenheit falsch.
 * Namen wie Nr. 44 (namenskarte.js dort, hier kopiert): Stammdaten + EDGAR company_tickers, sonst Nachfolger ueber
 * Kuerzelwechsel, sonst EDGAR-Volltext-Mehrheit; Normalisierung aus namen.js (eine Funktion fuer beide Seiten).
 * Nur Stufe "voll" (voll, voll2). Aufruf am PC (Panel liegt nur dort): node namenskarte-v2.js -> namenskarte-v2.json
 * NUR LESEN auf Panel, Stammdaten, EDGAR-Cache. Simulation, keine Anlageberatung. */
var fs = require('fs');
var path = require('path');

var HIER = __dirname;
var REPO = path.resolve(HIER, '..', '..', '..');
var NR44 = path.join(REPO, 'studien', 'gdelt-abdeckung-2026-09-19');
var N = require(path.join(NR44, 'namen.js'));
var QS = path.join(REPO, 'studien', 'querschnitt-pruefstand-2026-09-13');
var K = require(path.join(QS, 'konfig.js'));
var PS = require(path.join(QS, 'pruefstand.js'));
var STAMM = path.join(process.env.USERPROFILE || 'C:/Users/Wilhe', 'Downloads', 'Markt-Dashboard-Daten', 'markt', 'stammdaten.json');
var TICKERS = path.join(NR44, 'voll', 'company_tickers.json');
var KLASSEN = [2, 3];
var VON = '2017-01', BIS = '2026-08';

/* Die Handliste steht in auswerten.js (Nr. 44) als Literal; gelesen, nicht abgeschrieben - eine Stelle. */
var MEDIEN = JSON.parse(/var MEDIEN = (\[[^\]]*\]);/.exec(fs.readFileSync(path.join(NR44, 'auswerten.js'), 'utf8'))[1].replace(/'/g, '"'));

function basisKuerzel(reihe) { return String(reihe).replace(/~\d+$/, ''); }

/* ---------- 1. Stichtage und Vereinigung ---------- */
var T = PS.Tafel(path.join(QS, 'voll'));
var kal = K.kalender();
var stichtage = {}, jeMonat = {};
kal.tage.forEach(function (t, i) { var m = t.slice(0, 7); if (m >= VON && m <= BIS && !(m in jeMonat) && T.tagVon[i] >= 0) jeMonat[m] = i; });
var reihenJeBasis = {}; T.stand.symbole.forEach(function (r) { var b = basisKuerzel(r.reihe); reihenJeBasis[b] = (reihenJeBasis[b] || 0) + 1; });
var ENDE = {}; T.stand.symbole.forEach(function (r) { ENDE[r.reihe] = r; });
function wiederverwendet(reihe) { return reihenJeBasis[basisKuerzel(reihe)] > 1 || (ENDE[reihe] && ENDE[reihe].ende_grund === 'kuerzel-neu-vergeben'); }

var roh = {}, medienRaus = {}, wiederRaus = {};
Object.keys(jeMonat).sort().forEach(function (m) {
  var ti = jeMonat[m], u = PS.universum(T, ti, { klassen: KLASSEN }), z = { 2: 0, 3: 0 }, zm = 0, zw = 0;
  u.liste.forEach(function (e) {
    var r = T.symName[e.sym];
    if (MEDIEN.indexOf(basisKuerzel(r)) >= 0) { medienRaus[r] = (medienRaus[r] || 0) + 1; zm++; return; }
    if (wiederverwendet(r)) { wiederRaus[r] = (wiederRaus[r] || 0) + 1; zw++; return; }
    var k = roh[r] || (roh[r] = { 2: 0, 3: 0, erster: kal.tage[ti], letzter: null });
    k[e.klasse]++; k.letzter = kal.tage[ti]; z[e.klasse]++;
  });
  stichtage[kal.tage[ti]] = { universum: u.liste.length, inKarte: z[2] + z[3], jeKlasse: z, medien: zm, wiederverwendet: zw };
});

/* ---------- 2. Namen (Regeln unveraendert aus Nr. 44) ---------- */
var edgar = {};
var tj = JSON.parse(fs.readFileSync(TICKERS, 'utf8'));
Object.keys(tj).forEach(function (k) { var e = tj[k]; if (e && e.ticker && !edgar[e.ticker]) edgar[e.ticker] = e.title; });
var stamm = JSON.parse(fs.readFileSync(STAMM, 'utf8')).werte || {};
function edgarName(reihe) { var b = basisKuerzel(reihe); return edgar[b] || edgar[b.replace(/\./g, '-')] || edgar[b.replace(/-/g, '.')] || null; }
function stammName(reihe) { var b = basisKuerzel(reihe), e = stamm[b] || stamm[b.replace(/\./g, '-')] || stamm[b.replace(/-/g, '.')]; return e && e.name ? e.name : null; }
var FTS = path.join(REPO, 'studien', 'verschwundene-gruende-2026-09-12', 'edgar', 'kuerzel');
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
    if ((e.tickers || []).indexOf(b) >= 0) summe[nn].eigen = true;
  });
  var l = reihenfolge.map(function (nn) { return summe[nn]; });
  var eigen = l.filter(function (x) { return x.eigen; }).sort(function (a, c) { return c.n - a.n; });
  if (eigen.length) return eigen[0].name;
  l = l.filter(function (x) { return !ZITIERER.test(x.name); }).sort(function (a, c) { return c.n - a.n; });
  if (!l.length || l[0].n < 3 || (l[1] && l[0].n < 2 * l[1].n)) return null;
  return l[0].name;
}
var WECHSEL = {};
JSON.parse(fs.readFileSync(path.join(QS, 'kuerzelwechsel-kandidaten.json'), 'utf8')).kandidaten.forEach(function (k) {
  (k.wechsel || []).forEach(function (w) { if (w.regel === 'A' && w.new_symbol && w.new_symbol !== k.basis) (WECHSEL[k.basis] = WECHSEL[k.basis] || []).push(w); });
});
function naechsterWechsel(basis, abDatum) {
  var l = (WECHSEL[basis] || []).filter(function (w) { return w.datum >= abDatum; }).sort(function (a, b) { return a.datum < b.datum ? -1 : 1; });
  return l[0] || null;
}
function nachfolgerName(reihe) {
  var r = ENDE[reihe];
  if (!r || !r.ende_datum || (r.ende_grund !== 'umbenennung-ticker' && r.ende_grund !== 'kuerzel-neu-vergeben')) return null;
  var ab = new Date(Date.parse(r.ende_datum) - 10 * 86400000).toISOString().slice(0, 10), sym = basisKuerzel(reihe), kette = [];
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

var karte = {}, zaehl = { symbole: 0, jeKlasse: { 2: 0, 3: 0 }, beide: 0, nurStammdaten: 0, nurEdgar: 0, nachfolger: 0, edgarFts: 0, ohneNamen: 0, ohneNamenJeKlasse: { 2: 0, 3: 0 }, vollVerschieden: 0 };
var ohne = [];
Object.keys(roh).sort().forEach(function (r) {
  var q = roh[r], kl = q[3] > q[2] ? 3 : 2;
  var k = karte[r] = { voll: null, voll2: null, quelle: null, klasse: kl, monate: { 2: q[2], 3: q[3] }, erster: q.erster, letzter: q.letzter };
  var s = stammName(r), e = edgarName(r), f = null, nf = null, ns = s ? N.normalisieren(s) : '', ne = e ? N.normalisieren(e) : '';
  zaehl.symbole++; zaehl.jeKlasse[kl]++;
  if (ns && ne) { zaehl.beide++; k.quelle = 'beide'; k.voll = ns; if (ne !== ns) { k.voll2 = ne; zaehl.vollVerschieden++; } }
  else if (ns) { zaehl.nurStammdaten++; k.quelle = 'stammdaten'; k.voll = ns; }
  else if (ne) { zaehl.nurEdgar++; k.quelle = 'edgar'; k.voll = ne; }
  else if ((nf = nachfolgerName(r))) { zaehl.nachfolger++; k.quelle = 'nachfolger:' + nf.neu; k.voll = N.normalisieren(nf.name); }
  else if ((f = ftsName(r))) { zaehl.edgarFts++; k.quelle = 'edgar-fts'; k.voll = N.normalisieren(f); }
  else { zaehl.ohneNamen++; zaehl.ohneNamenJeKlasse[kl]++; ohne.push(r); }
  k.roh = { stammdaten: s, edgar: e, nachfolger: nf ? nf.name : null, fts: f };
});
var vollZu = {};
Object.keys(karte).forEach(function (r) { [karte[r].voll, karte[r].voll2].forEach(function (v) { if (v) (vollZu[v] = vollZu[v] || []).push(r); }); });
var vollDoppelt = Object.keys(vollZu).filter(function (v) { return vollZu[v].length > 1; }).map(function (v) { return v + ' -> ' + vollZu[v].join(','); });

/* Vergleich mit Karte v1 (Nr. 44): welche v1-Symbole der Klassen 2-3 fehlen, welche Namen weichen ab. */
var v1 = JSON.parse(fs.readFileSync(path.join(NR44, 'namenskarte.json'), 'utf8')).karte, vgl = { inBeiden: 0, nameGleich: 0, nameAnders: [], v1Kl23NichtInV2: [] };
Object.keys(v1).forEach(function (s) {
  if (karte[s]) { vgl.inBeiden++; if (karte[s].voll === v1[s].voll && karte[s].voll2 === v1[s].voll2) vgl.nameGleich++; else vgl.nameAnders.push(s); }
  else if ((v1[s].klasse2025 === 2 || v1[s].klasse2025 === 3 || v1[s].klasse2018 === 2 || v1[s].klasse2018 === 3)) vgl.v1Kl23NichtInV2.push(s);
});

var aus = { kennung: 'nachrichten-stimmung-tage-2026-09-19/namenskarte/v2', stand: new Date().toISOString(), panel: T.stand.kennung,
  regel: 'Vereinigung universum(klassen [2,3]) am ersten Handelstag je Monat ' + VON + '..' + BIS + ', ohne MEDIEN, ohne wiederverwendete Kuerzel; klasse = haeufigste Klasse ueber die Stichtage (Gleichstand 2)',
  zaehler: zaehl,
  medienAusgeschlossen: { liste: MEDIEN, imUniversum: Object.keys(medienRaus).sort(), stichtagEintraege: Object.keys(medienRaus).reduce(function (a, r) { return a + medienRaus[r]; }, 0) },
  wiederverwendetAusgeschlossen: { liste: Object.keys(wiederRaus).sort(), zahl: Object.keys(wiederRaus).length, stichtagEintraege: Object.keys(wiederRaus).reduce(function (a, r) { return a + wiederRaus[r]; }, 0) },
  ohneNamen: ohne, vollDoppelt: vollDoppelt, vergleichV1: vgl, stichtage: stichtage, karte: karte };
fs.writeFileSync(path.join(HIER, 'namenskarte-v2.json'), JSON.stringify(aus, null, 1));
process.stdout.write(JSON.stringify({ stichtage: Object.keys(stichtage).length, zaehler: zaehl, medienImUniversum: aus.medienAusgeschlossen.imUniversum, wiederverwendet: aus.wiederverwendetAusgeschlossen.zahl,
  vollDoppelt: vollDoppelt.length, v1: { inBeiden: vgl.inBeiden, nameGleich: vgl.nameGleich, nameAnders: vgl.nameAnders.length, v1Kl23NichtInV2: vgl.v1Kl23NichtInV2.length } }, null, 1) + '\n');
