'use strict';
/* Vorher/Nachher der Fundamentaltafel v1 (16.09.2026, fundamentaltafel-v1/) gegen v1.1 (22.09.2026, fundamentaltafel/),
 * Auftrag Nr. 60 §4: je Zeile (adsh) vergleichen und JEDE Aenderung einer der vier Korrekturen zuordnen -
 * alles andere muss bitgleich sein (unerwartet geaenderte Zeilen = 0, sonst Befund).
 *
 *  - Zuordnung (2b): Zeilen, die fehlen, weil alle Reihen ihrer CIK verworfen wurden; Zeilen mit geaenderter sym-Liste.
 *  - Einheit (2c): Zeilen mit marken.einheit 'verdacht' (roh = null); dazu FOLGEAENDERUNGEN in spaeteren Zeilen
 *    derselben CIK, weil die Fakten des verdaechtigen adsh im Speicher fehlen (erste Veroeffentlichung rueckt nach).
 *  - Aktien-Skala (2a): roh.aktien anders, erklaert durch marken.aktienSkala (Regel A / B / verworfen).
 *  - D4 (2d): vermoegenVor, summe4q.*Vor, abgeleitet.roaVor/fm/umsatzWachstum anders, erklaert durch marken.d4.
 * Dazu die Deckungstafel "Aktien" (FUNDAMENTALTAFEL.md §2, Definition wie stand.js) je Klasse und Jahr, v1 gegen v1.1.
 *
 * Schreibt vergleich-v1-v11.json (ins Repo) und gibt die Deckungstafel als Markdown aus.
 * Aufruf: node --max-old-space-size=6144 vergleich-v1-v11.js
 */
var fs = require('fs');
var path = require('path');
var V1 = path.join(__dirname, 'fundamentaltafel-v1'), V11 = path.join(__dirname, 'fundamentaltafel');
var KLASSEN = ['ab1000', '250-1000', '50-250', '5-50', 'unter5', 'duenn'];
var NEUE_MARKEN = { aktienSkala: 1, einheit: 1, einheitFakt: 1, d4: 1 };
var VOR_FELDER = ['vermoegenVor', 'summe4q.umsatzVor', 'summe4q.nettoVor', 'summe4q.operativVor', 'abgeleitet.roaVor', 'abgeleitet.fm', 'abgeleitet.umsatzWachstum'];

function dateien(d) { return fs.readdirSync(d).filter(function (f) { return /^tafel-\d{4}\.jsonl$/.test(f); }).sort(); }
function holen(o, pfad) { var t = pfad.split('.'), v = o; for (var i = 0; i < t.length && v !== null && v !== undefined; i++) v = v[t[i]]; return v === undefined ? null : v; }
function gleichJson(a, b) { return JSON.stringify(a) === JSON.stringify(b); }
function ohneNeueMarken(m) { var o = {}; Object.keys(m || {}).forEach(function (k) { if (!NEUE_MARKEN[k]) o[k] = m[k]; }); return o; }
function pz(x) { return x === null ? '–' : String(x).replace('.', ',') + ' %'; }

function main() {
  var t0 = Date.now();
  var r1 = JSON.parse(fs.readFileSync(path.join(V1, '_reihen.json'), 'utf8')), r11 = JSON.parse(fs.readFileSync(path.join(V11, '_reihen.json'), 'utf8'));
  var b11 = JSON.parse(fs.readFileSync(path.join(V11, '_bau.json'), 'utf8')), b1 = JSON.parse(fs.readFileSync(path.join(V1, '_bau.json'), 'utf8'));
  if (r1.kennung !== 'fundamentaltafel-2026-09-16/v1' || r11.kennung !== 'fundamentaltafel-2026-09-16/v1.1') throw new Error('Kennungen: ' + r1.kennung + ' / ' + r11.kennung);
  var E = { kennung: 'fundamentaltafel-2026-09-16/vergleich-v1-v11', v1: { kennung: r1.kennung, zeilen: b1.zeilen.gesamt, ciks: b1.panelCiks }, v11: { kennung: r11.kennung, zeilen: b11.zeilen.gesamt, ciks: b11.panelCiks } };

  /* Reihen: Zuordnung */
  var reihen = { gesamt: 0, jePruefung: {}, cikGeaendert: 0, cikGeaendertNichtVerworfen: [], verworfen: [] };
  Object.keys(r1.reihen).forEach(function (s) {
    var a = r1.reihen[s], b = r11.reihen[s]; reihen.gesamt++;
    reihen.jePruefung[b.pruefung || 'null'] = (reihen.jePruefung[b.pruefung || 'null'] || 0) + 1;
    if (a.cik !== b.cik) { reihen.cikGeaendert++; if (b.pruefung === 'verworfen') reihen.verworfen.push({ reihe: s, cikVorher: a.cik, grund: b.grund }); else reihen.cikGeaendertNichtVerworfen.push(s); }
  });
  var verworfeneCik = {}; reihen.verworfen.forEach(function (v) { verworfeneCik[v.cikVorher] = 1; });
  var cikOhneReihe = {}; Object.keys(verworfeneCik).forEach(function (c) { if (!r11.ciks[c]) cikOhneReihe[c] = 1; });
  reihen.ciksOhneReiheDurchVerwerfen = Object.keys(cikOhneReihe).length;
  E.reihen = reihen;

  /* v1 komplett in den Speicher (adsh -> Zeile), dann v1.1 streamen */
  var v1 = new Map();
  dateien(V1).forEach(function (f) { fs.readFileSync(path.join(V1, f), 'utf8').split('\n').forEach(function (l) { if (!l) return; var i = l.indexOf('"adsh":"'), j = l.indexOf('"', i + 8); v1.set(l.slice(i + 8, j), l); }); });
  console.log('v1 geladen:', v1.size, 'Zeilen in', Math.round((Date.now() - t0) / 1000), 's');
  var zl = { v11: 0, gleich: 0, nurV11: [], einheitVerdacht: 0, einheitFolge: 0, einheitFolgeBeispiele: [], symGeaendert: 0, symUnerklaert: [],
    aktien: { geaendert: 0, faktorCik: 0, abweichler: 0, verworfen: 0, unerklaert: [] }, d4: { geaendert: 0, huelle: 0, unerklaert: [] }, unerwartet: 0, unerwartetBeispiele: [], vermoegenVorNullDurchHuelle: 0 };
  var verdachtJeCik = {};   // cik -> kleinstes filed eines verdaechtigen Filings (Folgeaenderungen nur danach)
  dateien(V11).forEach(function (f) { fs.readFileSync(path.join(V11, f), 'utf8').split('\n').forEach(function (l) { if (!l) return; var z = JSON.parse(l); if (z.marken.einheit === 'verdacht' && (!verdachtJeCik[z.cik] || z.filed < verdachtJeCik[z.cik])) verdachtJeCik[z.cik] = z.filed; }); });
  dateien(V11).forEach(function (f) {
    fs.readFileSync(path.join(V11, f), 'utf8').split('\n').forEach(function (l) {
      if (!l) return;
      var b = JSON.parse(l); zl.v11++;
      var la = v1.get(b.adsh); if (!la) { zl.nurV11.push(b.adsh); return; }
      v1.delete(b.adsh);
      if (la === l) { zl.gleich++; return; }
      var a = JSON.parse(la);
      /* Marken ohne Wertaenderung: Abweichler mit k = 0 (COP-Stueckwert bleibt) bzw. Huelle bei schon leerem Vorjahresfenster */
      if (b.marken.aktienSkala && gleichJson(a.roh.aktien, b.roh.aktien)) { var mk = b.marken.aktienSkala, art = mk.abweichlerUnklar ? 'abweichlerUnklar' : mk.faktorAbweichler === 1 ? 'abweichlerKNull' : mk.ohneAnker ? 'ohneAnker' : mk.skalaUnklar ? 'skalaUnklar' : 'sonst'; zl.aktienMarkeOhneWertaenderung = zl.aktienMarkeOhneWertaenderung || {}; zl.aktienMarkeOhneWertaenderung[art] = (zl.aktienMarkeOhneWertaenderung[art] || 0) + 1; }
      if (b.marken.d4 === 'huelle' && VOR_FELDER.every(function (p) { return gleichJson(holen(a, p), holen(b, p)); })) zl.d4MarkeOhneWertaenderung = (zl.d4MarkeOhneWertaenderung || 0) + 1;
      var meta = ['cik', 'sic', 'sektor', 'form', 'period', 'filed', 'accepted', 'fy', 'fp', 'q'].every(function (k) { return gleichJson(a[k], b[k]); });
      var abw = [];
      if (!meta) abw.push('meta');
      if (!gleichJson(a.sym, b.sym)) { var erkl = a.sym.filter(function (s) { return !(r11.reihen[s] && r11.reihen[s].pruefung === 'verworfen'); }); if (gleichJson(erkl, b.sym)) zl.symGeaendert++; else { zl.symUnerklaert.push(b.adsh); abw.push('sym'); } }
      /* Aktien: v1.1 = v1 x faktorCik x faktorAbweichler, oder null (Waechter) */
      var ak = b.marken.aktienSkala;
      if (!gleichJson(a.roh.aktien, b.roh.aktien) || !gleichJson(a.rohTags.aktien, b.rohTags.aktien) || !gleichJson(a.marken.aktienFallback, b.marken.aktienFallback)) {
        zl.aktien.geaendert++;
        /* angewandt wird bei Abweichlern faktorAbweichler allein (schon gegen die korrigierte Mehrheit gerechnet), sonst faktorCik */
        var faktor = ak ? (ak.faktorAbweichler ? ak.faktorAbweichler : (ak.faktorCik || 1)) : 1;
        if (ak && ak.verworfen && b.roh.aktien === null) zl.aktien.verworfen++;
        else if (ak && faktor !== 1 && b.roh.aktien !== null && Math.abs(b.roh.aktien - a.roh.aktien * faktor) <= 1e-6 * Math.abs(b.roh.aktien)) { if (ak.faktorAbweichler && ak.faktorAbweichler !== 1) zl.aktien.abweichler++; else zl.aktien.faktorCik++; }
        else { zl.aktien.unerklaert.push(b.adsh); abw.push('aktien'); }
      }
      /* Einheit: nur der ausloesende Fakt fehlt - die Zeile selbst wird als Ganzes der Korrektur zugeschrieben (Folgefelder: roh, roa, fm ...) */
      if (b.marken.einheit === 'verdacht') { zl.einheitVerdacht++; if (abw.length) { zl.unerwartet++; if (zl.unerwartetBeispiele.length < 20) zl.unerwartetBeispiele.push({ adsh: b.adsh, felder: abw }); } return; }
      /* D4 / Vorjahresfenster */
      var vorAnders = VOR_FELDER.filter(function (p) { return !gleichJson(holen(a, p), holen(b, p)); });
      /* Folgeaenderungen der Einheit: spaetere Zeilen der CIK (erste Veroeffentlichung rueckt nach) UND fruehere, die dieselbe
       * falsche Zahl schon als Vergleichswert trugen (bauen.js verdachtFakt) */
      var folge = verdachtJeCik[b.cik] !== undefined, folgeVor = folge && !(b.filed > verdachtJeCik[b.cik]);
      if (vorAnders.length) {
        zl.d4.geaendert++;
        if (b.marken.d4 === 'huelle') { zl.d4.huelle++; if (a.vermoegenVor !== null && b.vermoegenVor === null) zl.vermoegenVorNullDurchHuelle++; }
        else if (!folge) { zl.d4.unerklaert.push(b.adsh); abw.push('vor'); }
      }
      /* alles andere bitgleich */
      var rest = ['roh', 'rohTags', 'quartale', 'wege', 'quartalsTags', 'summe4q', 'marken'].filter(function (k) {
        var x = JSON.parse(JSON.stringify(a[k])), y = JSON.parse(JSON.stringify(b[k]));
        if (k === 'roh') { delete x.aktien; delete y.aktien; }
        if (k === 'rohTags') { delete x.aktien; delete y.aktien; }
        if (k === 'summe4q') { ['umsatzVor', 'nettoVor', 'operativVor'].forEach(function (g) { delete x[g]; delete y[g]; }); }
        if (k === 'marken') { x = ohneNeueMarken(x); y = ohneNeueMarken(y); delete x.aktienFallback; delete y.aktienFallback; }
        return !gleichJson(x, y);
      });
      if (!gleichJson(a.abgeleitet.roa, b.abgeleitet.roa)) rest.push('abgeleitet.roa');
      if (rest.length || (vorAnders.length && b.marken.d4 !== 'huelle' && folge)) {
        if (folge) { if (folgeVor) zl.einheitFruehere = (zl.einheitFruehere || 0) + 1; else zl.einheitFolge++; if (zl.einheitFolgeBeispiele.length < 10) zl.einheitFolgeBeispiele.push({ adsh: b.adsh, cik: b.cik, filed: b.filed, verdachtAb: verdachtJeCik[b.cik], vorher: folgeVor, felder: rest.concat(vorAnders.length ? ['vor'] : []) }); }
        else abw = abw.concat(rest);
      }
      if (abw.length) { zl.unerwartet++; if (zl.unerwartetBeispiele.length < 20) zl.unerwartetBeispiele.push({ adsh: b.adsh, cik: b.cik, felder: abw }); }
    });
  });
  /* Zeilen, die nur v1 hat */
  var weg = { durchZuordnung: 0, unerklaert: [] };
  v1.forEach(function (l, adsh) { var z = JSON.parse(l); if (cikOhneReihe[z.cik]) weg.durchZuordnung++; else weg.unerklaert.push({ adsh: adsh, cik: z.cik }); });
  zl.nurV1 = weg;
  E.zeilen = zl;
  E.zaehlerBau = b11.v11;

  /* Deckungstafel "Aktien" je Klasse und Jahr, v1 gegen v1.1 (Definition stand.js: Rohwert in mindestens einem Filing des Jahres) */
  var kl = JSON.parse(fs.readFileSync(path.join(__dirname, 'klassen-jahr.json'), 'utf8'));
  function hatAktien(ordner) { var hat = {}; dateien(ordner).forEach(function (f) { fs.readFileSync(path.join(ordner, f), 'utf8').split('\n').forEach(function (l) { if (!l) return; var z = JSON.parse(l); if (z.roh.aktien !== null) (hat[z.cik] = hat[z.cik] || {})[z.filed.slice(0, 4)] = 1; }); }); return hat; }
  var h1 = hatAktien(V1), h11 = hatAktien(V11), deck = {};
  kl.jahre.forEach(function (j) {
    deck[j] = {}; KLASSEN.concat(['gesamt']).forEach(function (k) { deck[j][k] = { aktiv: 0, mitCikV1: 0, mitCikV11: 0, aktienV1: 0, aktienV11: 0 }; });
    Object.keys(kl.reihen).forEach(function (sym) {
      var r = kl.reihen[sym], y = r.jahr[j]; if (!y || !y.aktiv) return;
      var k = y.klasse || 'duenn', verw = r11.reihen[sym] && r11.reihen[sym].pruefung === 'verworfen';
      [deck[j][k], deck[j].gesamt].forEach(function (z) {
        z.aktiv++; if (!r.cik) return;
        z.mitCikV1++; if (h1[+r.cik] && h1[+r.cik][j]) z.aktienV1++;
        if (verw) return;
        z.mitCikV11++; if (h11[+r.cik] && h11[+r.cik][j]) z.aktienV11++;
      });
    });
    KLASSEN.concat(['gesamt']).forEach(function (k) { var z = deck[j][k]; z.prozentV1 = z.aktiv ? Math.round(1000 * z.aktienV1 / z.aktiv) / 10 : null; z.prozentV11 = z.aktiv ? Math.round(1000 * z.aktienV11 / z.aktiv) / 10 : null; });
  });
  E.deckungAktien = deck;
  E.sekunden = Math.round((Date.now() - t0) / 1000);
  fs.writeFileSync(path.join(__dirname, 'vergleich-v1-v11.json'), JSON.stringify(E, null, 1));

  console.log(JSON.stringify({ reihen: { gesamt: reihen.gesamt, jePruefung: reihen.jePruefung, cikGeaendert: reihen.cikGeaendert, nichtVerworfen: reihen.cikGeaendertNichtVerworfen.length, ciksOhneReihe: reihen.ciksOhneReiheDurchVerwerfen },
    zeilen: { v11: zl.v11, gleich: zl.gleich, nurV11: zl.nurV11.length, nurV1DurchZuordnung: weg.durchZuordnung, nurV1Unerklaert: weg.unerklaert.length, einheitVerdacht: zl.einheitVerdacht, einheitFolge: zl.einheitFolge, einheitFruehere: zl.einheitFruehere || 0, symGeaendert: zl.symGeaendert, aktien: { geaendert: zl.aktien.geaendert, faktorCik: zl.aktien.faktorCik, abweichler: zl.aktien.abweichler, verworfen: zl.aktien.verworfen, markeOhneWert: zl.aktienMarkeOhneWertaenderung || {}, unerklaert: zl.aktien.unerklaert.length, unerklaertBeispiele: zl.aktien.unerklaert.slice(0, 9) }, d4: { geaendert: zl.d4.geaendert, huelle: zl.d4.huelle, markeOhneWert: zl.d4MarkeOhneWertaenderung || 0, unerklaert: zl.d4.unerklaert.length }, unerwartet: zl.unerwartet }, sekunden: E.sekunden }, null, 1));
  console.log('\n**Deckung „Aktien" je Klasse × Jahr, v1 gegen v1.1** (Prozent der aktiven Reihen der Klasse mit Aktienzahl in einem Filing des Jahres):\n');
  console.log('| Klasse | ' + kl.jahre.join(' | ') + ' |');
  console.log('| --- | ' + kl.jahre.map(function () { return '---:'; }).join(' | ') + ' |');
  KLASSEN.concat(['gesamt']).forEach(function (k) {
    console.log('| ' + k + ' v1 | ' + kl.jahre.map(function (j) { return pz(deck[j][k].prozentV1); }).join(' | ') + ' |');
    console.log('| ' + k + ' v1.1 | ' + kl.jahre.map(function (j) { return pz(deck[j][k].prozentV11); }).join(' | ') + ' |');
  });
}
main();
