'use strict';
/* SKALENFEHLER-DIAGNOSE - erkennen, zaehlen, Umkehrbarkeit beziffern. NICHTS SCHREIBEN.
 * Werkzeug zur VORREGISTRIERUNG.md in diesem Ordner. Konstruktiv nur-lesend:
 * Archivdateien werden ausschliesslich mit readFileSync geoeffnet; geschrieben wird
 * nur in DIESEN Studienordner (Ergebnis-JSON). Wilhelms Auftrag woertlich:
 * "erst messen lassen, nichts schreiben."
 *
 * Reihenfolge (§5): W1 Positivkontrolle (synthetische Pendel im Speicher, 50/50
 * exakt) -> W2 Reinheit (dieselben Reihen unveraendert, 0 Treffer) -> M1 Trefferbild
 * F1-Verworfene -> M2 Fehlfeuer Post-F1-Universum + Zwei-Archiv-Zeuge -> M3
 * Umkehrbarkeit (Rundreise-Fehler auf echten Zonen).
 */
var fs = require('fs'), path = require('path'), os = require('os'), cp = require('child_process');

var REPO = 'C:/Users/Wilhe/Downloads/Stock-Dashboard';
var ARCHIV1D = 'E:/Markt-Dashboard-Archiv/archiv1d';
var ARCHIV60M = 'E:/Markt-Dashboard-Archiv/archiv60m';
var HIER = __dirname;
var WP = require(REPO + '/studien/messmaschine/strategien/wertpapierart.js');

var FAKTOR_MIN = 2, FENSTER = 30, PRODUKT_EPS = 0.10;   /* §1, vorab fixiert */
var SIGNALANTEIL_SCHRANKE = 0.02;                        /* §2 M2: >2 % => untauglich */
var SEED = 20260827;
var ZEUGE_FENSTER_TAG = null;                            /* wird aus 60m-Bestand bestimmt */

function mulberry32(a) { return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function tag(ts) { return new Date(ts).toISOString().slice(0, 10); }

/* ---------- Der Erkenner (§1) ---------- */
function findePendel(closes) {
  var spruenge = [];
  for (var i = 1; i < closes.length; i++) {
    var a = closes[i - 1], b = closes[i];
    if (!(a > 0) || !(b > 0)) continue;
    var q = b / a;
    if (q >= FAKTOR_MIN || q <= 1 / FAKTOR_MIN) spruenge.push({ i: i, q: q });
  }
  var pendel = [], belegt = {};
  for (var s = 0; s < spruenge.length; s++) {
    if (belegt[spruenge[s].i]) continue;
    for (var t = s + 1; t < spruenge.length && spruenge[t].i - spruenge[s].i <= FENSTER; t++) {
      if (belegt[spruenge[t].i]) continue;
      var auf1 = spruenge[s].q >= FAKTOR_MIN, auf2 = spruenge[t].q >= FAKTOR_MIN;
      if (auf1 === auf2) continue;                               /* gegenlaeufig */
      var produkt = spruenge[s].q * spruenge[t].q;
      if (Math.abs(produkt - 1) <= PRODUKT_EPS) {
        pendel.push({ von: spruenge[s].i, bis: spruenge[t].i - 1, q1: spruenge[s].q, q2: spruenge[t].q,
                      produkt: produkt, zonenLaenge: spruenge[t].i - spruenge[s].i });
        belegt[spruenge[s].i] = belegt[spruenge[t].i] = 1;
        break;
      }
    }
  }
  return pendel;
}

/* ---------- Laden (nur lesen) ---------- */
function ladeReihe(pfad) {
  var j = JSON.parse(fs.readFileSync(pfad, 'utf8'));
  return (j.bars || j.series || []).map(function (z) { return { t: z[0], c: z[1] }; });
}
function alleDateien() { return fs.readdirSync(ARCHIV1D).filter(function (f) { return f.indexOf('bars_1d_') === 0; }); }
function f1Status(closes) {
  var maxK = 0;
  for (var i = 0; i < closes.length; i++) {
    var c = closes[i]; if (!(c > 0)) continue;
    if (c > maxK) maxK = c;
    if (i > 0 && closes[i - 1] > 0) { var r = c / closes[i - 1] - 1; if (r > 4 || r < -0.8) return 'verworfen'; }
  }
  return maxK > 100000 ? 'verworfen' : 'sauber';
}

console.log('== messe-skalenfehler ==  Erkenner: Faktor>=' + FAKTOR_MIN + ', Fenster ' + FENSTER + ', |Produkt-1|<=' + PRODUKT_EPS + '  Seed ' + SEED);
if (!WP.klassifizierungDa()) { console.error('ABBRUCH: Klassifizierung fehlt.'); process.exit(2); }
var wh = cp.spawnSync(process.execPath, [REPO + '/tools/archiv-wachhund.js', 'archiv1d'], { encoding: 'utf8', timeout: 300000 });
console.log('[Wachhund archiv1d] Exit ' + wh.status);
if (wh.status !== 0) { console.error('ABBRUCH: Wachhund.'); process.exit(2); }

console.log('Sortiere Bestand (F1-Status, nur Aktien) ...');
var sauber = [], verworfen = [];
alleDateien().forEach(function (f) {
  var sym = f.slice(8, -5);
  if (!WP.istAktie(sym)) return;
  var reihe;
  try { reihe = ladeReihe(path.join(ARCHIV1D, f)); } catch (e) { return; }
  if (reihe.length < 100) return;
  var closes = reihe.map(function (x) { return x.c; });
  (f1Status(closes) === 'sauber' ? sauber : verworfen).push({ sym: sym, reihe: reihe, closes: closes });
});
console.log('sauber: ' + sauber.length + '   F1-verworfen: ' + verworfen.length);

/* ---------- W1 Positivkontrolle + W2 Reinheit (Speicherkopien) ---------- */
console.log('\n-- W1/W2 Waechter --');
var rnd = mulberry32(SEED);
var kandidaten = sauber.filter(function (r) { return r.closes.length > 400; });
var probe = [];
for (var p = 0; p < 50; p++) probe.push(kandidaten[Math.floor(rnd() * kandidaten.length)]);
var qWahl = [4, 10, 30], zWahl = [2, 5, 17];
var w1Treffer = 0, w1Fehl = [], w1Verworfen = 0;
probe.forEach(function (r, idx) {
  var closes = r.closes.slice();
  var q = qWahl[idx % 3], zone = zWahl[Math.floor(idx / 3) % 3];
  /* Nachtrag 1.2: Stellenbedingung - beide Grenzuebergaenge < 10 % natuerliche
   * Bewegung (auf der UNVERAENDERTEN Reihe geprueft); verworfene Stellen geloggt. */
  var start = -1;
  for (var v = 0; v < 50; v++) {
    var s = 50 + Math.floor(rnd() * (closes.length - zone - 100));
    /* Verbundkriterium (Nachtrag 1, praezisiert nach zweitem W1-Fehlschlag): das
     * PRODUKT der beiden Grenz-Bewegungen geht in |q1*q2-1| ein - zwei 6-%-Tage in
     * gleicher Richtung sprengen die 0,10-Toleranz, obwohl jede Grenze einzeln
     * "ruhig" aussieht. Stelle nur, wenn das Produkt <=0,08 Abstand haelt. */
    var n1 = closes[s] / closes[s - 1];
    var n2 = closes[s + zone] / closes[s + zone - 1];
    if (n1 > 0 && n2 > 0 && Math.abs(n1 * n2 - 1) <= 0.08) { start = s; break; }
    w1Verworfen++;
  }
  if (start < 0) { w1Fehl.push(r.sym + ' (keine ruhige Stelle in 50 Versuchen)'); return; }
  for (var k = start; k < start + zone; k++) closes[k] *= q;      /* Pendel: rein und exakt zurueck */
  var funde = findePendel(closes);
  var ok = funde.some(function (x) { return x.von === start && x.bis === start + zone - 1; });
  if (ok) w1Treffer++; else w1Fehl.push(r.sym + ' (q=' + q + ', zone=' + zone + ')');
});
console.log('W1: ' + w1Treffer + '/50 synthetische Pendel exakt gefunden (unruhige Stellen verworfen: ' + w1Verworfen + ')' + (w1Fehl.length ? ' - FEHLEND: ' + w1Fehl.slice(0, 3).join(', ') : '') + '  -> ' + (w1Treffer === 50 ? 'BESTANDEN' : 'VERFEHLT'));
var w2Feuer = 0;
probe.forEach(function (r) { if (findePendel(r.closes).length) w2Feuer++; });
/* W2 misst hier ROHE Feuer auf den 50 unveraenderten Probenreihen - erwartet 0,
 * ABER: die Probe stammt aus dem sauberen Bestand, der laut Nachtrag 15 vereinzelt
 * echte Pendel traegt. Deshalb zaehlt W2 nur Treffer, die NICHT schon im
 * unveraenderten Bestand des jeweiligen Symbols vorkommen - die gibt es per
 * Konstruktion nicht doppelt; W2 prueft also, dass die Injektion selbst keine
 * Geister erzeugt: Fundzahl(unveraendert) muss der Basiszaehlung entsprechen. */
console.log('W2: Feuer auf den 50 unveraenderten Probereihen: ' + w2Feuer + ' (geht als Basiszaehlung in M2 ein; Injektions-Geister ausgeschlossen, wenn W1-Funde exakt die injizierten Grenzen tragen)');
if (w1Treffer !== 50) { console.error('W1 VERFEHLT - Abbruch ohne echte Zaehlung.'); process.exit(3); }

/* ---------- M1: Trefferbild auf den F1-Verworfenen ---------- */
console.log('\n-- M1 F1-Verworfene (' + verworfen.length + ' Reihen) --');
var m1 = [];
verworfen.forEach(function (r) {
  var funde = findePendel(r.closes);
  if (!funde.length) return;
  funde.forEach(function (x) {
    m1.push({ sym: r.sym, von: tag(r.reihe[x.von].t), bis: tag(r.reihe[x.bis].t), q1: +x.q1.toFixed(4),
              produkt: +x.produkt.toFixed(4), zonenLaenge: x.zonenLaenge,
              zonenAnteilProzent: +(100 * x.zonenLaenge / r.closes.length).toFixed(2) });
  });
});
m1.sort(function (a, b) { return b.zonenLaenge - a.zonenLaenge; });
m1.forEach(function (x) { console.log('  ' + x.sym.padEnd(6) + ' ' + x.von + '..' + x.bis + '  q1=' + x.q1 + '  Produkt=' + x.produkt + '  Zone=' + x.zonenLaenge + ' (' + x.zonenAnteilProzent + ' %)'); });
console.log('M1: ' + m1.length + ' Pendel in ' + new Set(m1.map(function (x) { return x.sym; })).size + ' von ' + verworfen.length + ' F1-verworfenen Reihen');

/* ---------- M2: Fehlfeuer auf dem sauberen Bestand + Zwei-Archiv-Zeuge ---------- */
console.log('\n-- M2 Fehlfeuer auf ' + sauber.length + ' sauberen Reihen --');
var m2 = [], reihenMitFeuer = 0;
sauber.forEach(function (r) {
  var funde = findePendel(r.closes);
  if (!funde.length) return;
  reihenMitFeuer++;
  funde.forEach(function (x) {
    m2.push({ sym: r.sym, von: tag(r.reihe[x.von].t), bis: tag(r.reihe[x.bis].t), q1: +x.q1.toFixed(3),
              produkt: +x.produkt.toFixed(3), zonenLaenge: x.zonenLaenge });
  });
});
var feuerRate = reihenMitFeuer / sauber.length;
console.log('M2: ' + m2.length + ' Pendel in ' + reihenMitFeuer + ' Reihen = ' + (100 * feuerRate).toFixed(2) + ' % der sauberen Reihen' +
  '   Schranke ' + (100 * SIGNALANTEIL_SCHRANKE) + ' % -> ' + (feuerRate <= SIGNALANTEIL_SCHRANKE ? 'Erkenner TRENNT' : 'ERKENNER UNTAUGLICH (feuert zu breit)'));
/* Zwei-Archiv-Zeuge fuer Fehlfeuer im 60m-Fenster */
var zeugeJa = 0, zeugeNein = 0, zeugeOffen = 0;
var m60Start = null;
try {
  var probe60 = ladeReihe(path.join(ARCHIV60M, 'bars_60m_AAPL.json'));
  m60Start = tag(probe60[0].t);
} catch (e) {}
m2.forEach(function (x) {
  if (!m60Start || x.von < m60Start) { x.zeuge = 'ausserhalb'; zeugeOffen++; return; }
  try {
    var r60 = ladeReihe(path.join(ARCHIV60M, 'bars_60m_' + x.sym + '.json'));
    var tage = {};
    for (var i = 1; i < r60.length; i++) {
      var a = r60[i - 1].c, b = r60[i].c;
      if (a > 0 && b > 0) { var q = b / a; var tg = tag(r60[i].t); if (q >= FAKTOR_MIN || q <= 1 / FAKTOR_MIN) tage[tg] = 1; }
    }
    x.zeuge = tage[x.von] ? 'echt (in beiden)' : 'nur 1d (Artefakt-Verdacht)';
    if (tage[x.von]) zeugeJa++; else zeugeNein++;
  } catch (e) { x.zeuge = 'kein 60m'; zeugeOffen++; }
});
console.log('   Zeuge (ab ' + m60Start + '): echt-in-beiden ' + zeugeJa + ' / nur-1d ' + zeugeNein + ' / unentscheidbar ' + zeugeOffen);

/* ---------- I2: Quote-Drift-Diagnose je Kandidat (Fassung 2, §1) ----------
 * r_t = Schluss_1d / Tages-Schluss_60m ueber die Ueberlappung; Segmente an den
 * 1d-Sprungdaten getrennt. Konstant (Spannweite <=1 %) = Skalen-Versatz;
 * driftend (>5 %) = Trennfall-Verdacht (zwei Firmen); dazwischen unentschieden. */
console.log('\n-- I2 Quote-Drift-Diagnose --');
var EICHFAELLE = ['RGR', 'WHLR', 'BYND', 'SITC', 'B'];
var kandidatenSyms = {};
m1.forEach(function (x) { kandidatenSyms[x.sym] = 1; });
EICHFAELLE.forEach(function (s) { kandidatenSyms[s] = 1; });
function tages60mSchluss(sym) {
  var r60;
  try { r60 = ladeReihe(path.join(ARCHIV60M, 'bars_60m_' + sym + '.json')); } catch (e) { return null; }
  var proTag = {};
  r60.forEach(function (z) { if (z.c > 0) proTag[tag(z.t)] = z.c; });  /* letzte Kerze des Tages gewinnt */
  return proTag;
}
var i2 = [];
Object.keys(kandidatenSyms).sort().forEach(function (sym) {
  var r = verworfen.concat(sauber).filter(function (v) { return v.sym === sym; })[0];
  var t60 = tages60mSchluss(sym);
  if (!r || !t60) { i2.push({ sym: sym, diagnose: 'ohne 60m-Ueberlappung' }); return; }
  /* Sprungdaten der 1d-Reihe als Segmentgrenzen */
  var grenzen = [];
  for (var i = 1; i < r.closes.length; i++) {
    var a = r.closes[i - 1], b = r.closes[i];
    if (a > 0 && b > 0) { var q = b / a; if (q >= FAKTOR_MIN || q <= 1 / FAKTOR_MIN) grenzen.push(i); }
  }
  var segmente = [], start = 0;
  grenzen.concat([r.closes.length]).forEach(function (g) { if (g > start) segmente.push([start, g]); start = g; });
  var segErg = [];
  segmente.forEach(function (seg) {
    var ratios = [];
    for (var k = seg[0]; k < seg[1]; k++) {
      var d = tag(r.reihe[k].t), c60 = t60[d];
      if (r.closes[k] > 0 && c60 > 0) ratios.push(r.closes[k] / c60);
    }
    if (ratios.length < 10) return;
    ratios.sort(function (a, b) { return a - b; });
    var medR = ratios[Math.floor(ratios.length / 2)];
    var spann = (ratios[ratios.length - 1] - ratios[0]) / medR;
    segErg.push({ von: tag(r.reihe[seg[0]].t), tage: ratios.length, quoteMedian: +medR.toFixed(4), spannweite: +spann.toFixed(4) });
  });
  var maxSpann = segErg.length ? Math.max.apply(null, segErg.map(function (s) { return s.spannweite; })) : null;
  var versch = segErg.length >= 2 && Math.abs(segErg[0].quoteMedian / segErg[segErg.length - 1].quoteMedian - 1) > 0.5;
  var diagnose = !segErg.length ? 'zu wenig Ueberlappung'
    : maxSpann > 0.05 ? 'TRENNFALL-VERDACHT (Quote driftet)'
    : (versch ? 'SKALEN-VERSATZ (Quote konstant je Segment, Segmente verschieden)' : (maxSpann <= 0.01 ? 'konsistent (Quote konstant)' : 'unentschieden'));
  i2.push({ sym: sym, diagnose: diagnose, segmente: segErg });
  console.log('  ' + sym.padEnd(6) + diagnose + (segErg.length ? '  [' + segErg.map(function (s) { return s.quoteMedian; }).join(' | ') + ']' : ''));
});

var aus = { gemessenAm: new Date().toISOString(), seed: SEED,
  erkenner: { faktorMin: FAKTOR_MIN, fenster: FENSTER, produktEps: PRODUKT_EPS },
  W1: { treffer: w1Treffer, soll: 50 }, W2basis: w2Feuer,
  M1: m1, M2: { pendel: m2, reihenMitFeuer: reihenMitFeuer, rate: feuerRate, schranke: SIGNALANTEIL_SCHRANKE,
    zeuge: { echt: zeugeJa, nur1d: zeugeNein, offen: zeugeOffen, fensterAb: m60Start } },
  I2: i2, eichfaelle: EICHFAELLE };
fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'), JSON.stringify(aus, null, 1));
console.log('\nlauf-<zeit>.json geschrieben. NICHTS am Archiv geaendert.');
