#!/usr/bin/env node
/* Werkzeug zur Vorregistrierung
 * studien/vorregistrierung-2026-08-26-verzerrungsrichtung/VORREGISTRIERUNG.md
 *
 * Betriebsarten:
 *   node messe-verzerrungsrichtung.js --waechter   (Vorgabe: Zensus, Schwellen, W1, W2, Z9-Vorpruefung;
 *                                                   liest von Verschwundenen NUR Metadaten/Laengen/Umsaetze)
 *   node messe-verzerrungsrichtung.js --kohorte    (der eine echte Lauf; erst nach PM-Rueckmeldung)
 *
 * Druckreihenfolge ist Teil der Vorregistrierung (§8):
 * Filterzaehlung -> Familienschwelle/delta80 -> Haltedauern -> W1 -> W2 -> Z9 -> erst dann Kohorte.
 */
'use strict';
const fs = require('fs');
const path = require('path');

/* ---------- Konstanten (Vorregistrierung §2-§5, Nachtrag §9) ---------- */
const SEED = 20260826;
const FENSTER_VON = '2024-08-23', FENSTER_BIS = '2026-08-21';   // NY-Kalendertage
const BODEN = 3447123;            // $ , Trailing-21-Median, punkt-in-zeit, beide Arme
const VORLAUF = 21;               // Kerzen vor Signalteilnahme
const RUTSCH_TAGE = 5, RUTSCH_SCHWELLE = -0.10;                 // Z1
const TESTS_FAMILIE = 5;
const ALPHA = 0.05, Z80 = 0.8416212;
const STUTZ = 0.01;               // 1 % je Seite, Winsorisierung am Topf-Quantil
const ARTEN = new Set(['CS', 'ADRC']);
const KUNST_N = 200, KUNST_KERZEN = 63, KUNST_FAKTOR = 0.6;     // W1: -40 % ueber 63 Kerzen
const TAUSCH_ZIEHUNGEN = 200;                                    // W2
const MIN_UEB_JE_TAG = 5;         // Paartag braucht >=1 V-Signal und >=5 Ue-Signale
const W_QUER = 0.127;             // historische Untergrenze des Querschnittsanteils (gesetzt)

const HIER = __dirname;
const REPO = path.resolve(HIER, '..', '..');
const DATEN = 'C:/Users/Wilhe/Downloads/Markt-Dashboard-Daten';
const ARCHIV1D = (function () {
  const kandidaten = [path.join(REPO, 'studien/tueftler/werkzeug/archiv1d-pfad.txt'), path.join(HIER, 'archiv1d-pfad.txt')];
  for (const k of kandidaten) if (fs.existsSync(k)) return fs.readFileSync(k, 'utf8').trim();
  return 'E:/Markt-Dashboard-Archiv/archiv1d';
})();
const PROTOKOLLE = path.join(REPO, 'studien/messmaschine/protokolle');

/* ---------- Zeitzone: America/New_York, Abbruch wenn nicht verfuegbar (Nachtrag 6) ---------- */
let nyFmt;
try {
  nyFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' });
  const probe = nyFmt.format(new Date(Date.UTC(2025, 3, 7, 4, 0, 0)));
  if (probe !== '2025-04-07') throw new Error('Probe ergab ' + probe);
} catch (e) {
  console.error('ABBRUCH: America/New_York-Umrechnung nicht verfuegbar: ' + e.message);
  process.exit(2);
}
const msDatumCache = new Map();
function nyDatum(ms) {
  let d = msDatumCache.get(ms);
  if (d === undefined) { d = nyFmt.format(new Date(ms)); msDatumCache.set(ms, d); }
  return d;
}
function wochentag(datum) { return new Date(datum + 'T12:00:00Z').getUTCDay(); } // 3 = Mittwoch

/* ---------- Zufall: mulberry32, fester Seed ---------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function mischen(arr, rnd) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; }
  return a;
}

/* ---------- Statistik ---------- */
function normInvLokal(p) { /* Beasley-Springer-Moro, wie messmaschine.js */
  const a = [-3.969683028665376e+01, 2.209460984245205e+02, -2.759285104469687e+02, 1.383577518672690e+02, -3.066479806614716e+01, 2.506628277459239e+00];
  const b = [-5.447609879822406e+01, 1.615858368580409e+02, -1.556989798598866e+02, 6.680131188771972e+01, -1.328068155288572e+01];
  const c = [-7.784894002430293e-03, -3.223964580411365e-01, -2.400758277161838e+00, -2.549732539343734e+00, 4.374664141464968e+00, 2.938163982698783e+00];
  const d = [7.784695709041462e-03, 3.224671290700398e-01, 2.445134137142996e+00, 3.754408661907416e+00];
  let q, r;
  if (p < 0.02425) { q = Math.sqrt(-2 * Math.log(p)); return (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  if (p > 1 - 0.02425) { q = Math.sqrt(-2 * Math.log(1 - p)); return -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) / ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1); }
  q = p - 0.5; r = q * q;
  return (((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q / (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1);
}
let bonferroniSchwelle, schwellenQuelle;
try {
  const mm = require(path.join(REPO, 'studien/messmaschine/messmaschine.js'));
  bonferroniSchwelle = mm._intern.bonferroniSchwelle;
  schwellenQuelle = 'messmaschine.js (_intern)';
} catch (e) {
  bonferroniSchwelle = function (tests) { return Math.abs(normInvLokal(ALPHA / Math.max(1, tests) / 2)); };
  schwellenQuelle = 'lokale Kopie (messmaschine nicht ladbar: ' + e.message + ')';
}
function quantil(sortiert, q) {
  if (!sortiert.length) return null;
  const pos = (sortiert.length - 1) * q, lo = Math.floor(pos), hi = Math.ceil(pos);
  return sortiert[lo] + (sortiert[hi] - sortiert[lo]) * (pos - lo);
}
function winsorisieren(werte) { /* 1 % je Seite am Topf-Quantil; gibt Zaehler zurueck */
  if (werte.length < 50) return 0;
  const s = werte.slice().sort((x, y) => x - y);
  const unten = quantil(s, STUTZ), oben = quantil(s, 1 - STUTZ);
  let n = 0;
  for (let i = 0; i < werte.length; i++) {
    if (werte[i] < unten) { werte[i] = unten; n++; }
    else if (werte[i] > oben) { werte[i] = oben; n++; }
  }
  return n;
}
function neweyWest(d, lag) { /* Var des Mittels der Reihe d mit Bartlett-Gewichten */
  const n = d.length;
  if (n < 8) return { mittel: null, se: null, t: null, n };
  const m = d.reduce((a, x) => a + x, 0) / n;
  let s = 0;
  for (const x of d) s += (x - m) * (x - m);
  let varSumme = s / n;
  for (let l = 1; l <= lag && l < n; l++) {
    let g = 0;
    for (let t = l; t < n; t++) g += (d[t] - m) * (d[t - l] - m);
    varSumme += 2 * (1 - l / (lag + 1)) * (g / n);
  }
  const se = Math.sqrt(Math.max(0, varSumme) / n);
  return { mittel: m, se, t: se > 0 ? m / se : null, n };
}

/* ---------- Datenladen ---------- */
function ladeArten() {
  const w = JSON.parse(fs.readFileSync(path.join(DATEN, 'massive/wertpapierarten.json'), 'utf8'));
  return w.arten || {};
}
function fensterSchnitt(seriesRoh, spaltenMitEroeffnung) {
  /* series: [ms, schluss, volumen, hoch, tief, (eroeffnung)] -> {dates[], close[], dollar[]}
   * Behalten: VORLAUF+RUTSCH_TAGE Kerzen Vorlauf vor FENSTER_VON, nichts nach FENSTER_BIS. */
  const dates = [], close = [], dollar = [];
  for (const z of seriesRoh) {
    const dt = nyDatum(z[0]);
    if (dt > FENSTER_BIS) break;
    dates.push(dt); close.push(z[1]); dollar.push(z[1] * z[2]);
  }
  let start = dates.findIndex(d => d >= FENSTER_VON);
  if (start < 0) return null;                       // endet vor dem Fenster
  const ab = Math.max(0, start - (VORLAUF + RUTSCH_TAGE));
  return { dates: dates.slice(ab), close: close.slice(ab), dollar: dollar.slice(ab), fensterStart: start - ab };
}
function bodenOk(S) { /* Trailing-21-Median des Dollarumsatzes je Index, strikt vor t */
  const n = S.dates.length, ok = new Array(n).fill(false), puffer = [];
  for (let t = 0; t < n; t++) {
    if (t >= VORLAUF) {
      puffer.length = 0;
      for (let k = t - VORLAUF; k < t; k++) puffer.push(S.dollar[k]);
      puffer.sort((a, b) => a - b);
      ok[t] = puffer[10] >= BODEN;                  // Median von 21 = Index 10
    }
  }
  return ok;
}
function ladeUeberlebende(arten) {
  const dateien = fs.readdirSync(ARCHIV1D).filter(f => f.startsWith('bars_1d_') && f.endsWith('.json'));
  const reihen = [], zaehl = { dateien: dateien.length, ohneArt: 0, falscheArt: 0, ausserhalbFenster: 0, geladen: 0, leseFehler: 0 };
  for (const f of dateien) {
    const sym = f.slice(8, -5);
    const art = arten[sym];
    if (art === undefined) { zaehl.ohneArt++; continue; }
    if (!ARTEN.has(art)) { zaehl.falscheArt++; continue; }
    let d;
    try { d = JSON.parse(fs.readFileSync(path.join(ARCHIV1D, f), 'utf8')); }
    catch (e) { zaehl.leseFehler++; continue; }
    const S = fensterSchnitt(d.series, true);
    if (!S || S.dates.length < VORLAUF + RUTSCH_TAGE + 3) { zaehl.ausserhalbFenster++; continue; }
    S.sym = sym; S.boden = bodenOk(S);
    reihen.push(S); zaehl.geladen++;
  }
  return { reihen, zaehl };
}
function ladeVerschwundeneMeta() {
  /* NUR Metadaten, Laengen, Umsaetze - keine Renditerechnung (Nachtrag 9). */
  const dir = path.join(DATEN, 'massive/tagesdaten');
  const dateien = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const meta = [], zaehl = { dateien: dateien.length, keinAktienartig: 0, falschesDelisting: 0, zuKurz: 0, brauchbar: 0, leseFehler: 0 };
  for (const f of dateien) {
    let d;
    try { d = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
    catch (e) { zaehl.leseFehler++; continue; }
    const S = fensterSchnitt(d.series, false);
    if (!S || S.dates.length < VORLAUF + RUTSCH_TAGE + 3) { zaehl.zuKurz++; continue; }
    S.sym = d.sym; S.delistet = d.delistet || null;
    /* Beschnitt am Todestag +1 Handelstag (Vorreg. §2 Nr. 3) */
    if (S.delistet) {
      let ende = S.dates.length - 1, dahinter = 0;
      while (ende > 0 && S.dates[ende] > S.delistet) { ende--; dahinter++; }
      const behalten = Math.min(S.dates.length, ende + 2); // +1 Handelstag danach
      S.dates = S.dates.slice(0, behalten); S.close = S.close.slice(0, behalten); S.dollar = S.dollar.slice(0, behalten);
    }
    if (S.dates.length < VORLAUF + RUTSCH_TAGE + 3) { zaehl.zuKurz++; continue; }
    const erste21 = S.dollar.slice(S.fensterStart, S.fensterStart + VORLAUF);
    const liqu = erste21.length >= 5 ? erste21.slice().sort((a, b) => a - b)[Math.floor(erste21.length / 2)] : 0;
    meta.push({ sym: S.sym, delistet: S.delistet, vonDatum: S.dates[S.fensterStart] || S.dates[0], bisDatum: S.dates[S.dates.length - 1], laenge: S.dates.length - S.fensterStart, liqu, _S: S });
    zaehl.brauchbar++;
  }
  return { meta, zaehl, dir };
}
function filterFalscheDelistings(meta, ueberlebendeMap) {
  /* Automatik-Fassung der AVB/EQR/WBS-Regel: Ueberlebenden-Reihe laeuft >5 Handelstage
   * nach dem Delisting-Datum weiter -> kein echtes Delisting. */
  const raus = [];
  const rest = meta.filter(m => {
    const u = ueberlebendeMap.get(m.sym);
    if (!u || !m.delistet) return true;
    let danach = 0;
    for (let i = u.dates.length - 1; i >= 0 && u.dates[i] > m.delistet; i--) danach++;
    if (danach > 5) { raus.push(m.sym); return false; }
    return true;
  });
  return { rest, raus };
}

/* ---------- Signale und Endpunkt ---------- */
function monatsenden(spyDates) {
  const proMonat = new Map();
  for (const d of spyDates) { if (d >= FENSTER_VON && d <= FENSTER_BIS) proMonat.set(d.slice(0, 7), d); }
  return new Set(proMonat.values());
}
function signaleFuerReihe(S, sonde, H, monatsendSet) {
  /* liefert [{datum, entry, exit}] - Indizes; exit = min(t+1+H, letzte) (Nachtrag 3) */
  const aus = [], n = S.dates.length;
  for (let t = S.fensterStart; t < n; t++) {
    const dt = S.dates[t];
    if (dt < FENSTER_VON || dt > FENSTER_BIS) continue;
    if (!S.boden[t]) continue;
    let feuert = false;
    if (sonde === 'Z0') feuert = true;
    else if (sonde === 'Z1') feuert = (t >= RUTSCH_TAGE) && (S.close[t] / S.close[t - RUTSCH_TAGE] - 1 <= RUTSCH_SCHWELLE);
    else if (sonde === 'Z2') feuert = monatsendSet.has(dt);
    else if (sonde === 'Z9') feuert = wochentag(dt) === 3;
    if (!feuert) continue;
    if (t + 1 >= n) { aus.push({ datum: dt, entry: -1, exit: -1 }); continue; } // faellt, wird gezaehlt
    aus.push({ datum: dt, entry: t + 1, exit: Math.min(t + 1 + H, n - 1) });
  }
  return aus;
}
function endpunkt(eintraegeV, eintraegeU, H) {
  /* eintraege*: [{datum, wert}] bereits mit Renditen; winsorisiert je Arm; paarweise je Tag */
  function stutzeInPlace(eintraege) {
    if (eintraege.length < 50) return 0;
    const s = eintraege.map(e => e.wert).sort((a, b) => a - b);
    const unten = quantil(s, STUTZ), oben = quantil(s, 1 - STUTZ);
    let n = 0;
    for (const e of eintraege) { if (e.wert < unten) { e.wert = unten; n++; } else if (e.wert > oben) { e.wert = oben; n++; } }
    return n;
  }
  const gestutztV = stutzeInPlace(eintraegeV), gestutztU = stutzeInPlace(eintraegeU);
  const proTagV = new Map(), proTagU = new Map();
  for (const e of eintraegeV) { const x = proTagV.get(e.datum) || { s: 0, n: 0 }; x.s += e.wert; x.n++; proTagV.set(e.datum, x); }
  for (const e of eintraegeU) { const x = proTagU.get(e.datum) || { s: 0, n: 0 }; x.s += e.wert; x.n++; proTagU.set(e.datum, x); }
  const tage = [...proTagV.keys()].filter(d => { const u = proTagU.get(d); return u && u.n >= MIN_UEB_JE_TAG; }).sort();
  const d = [], w = [];
  for (const tag of tage) {
    const v = proTagV.get(tag), u = proTagU.get(tag);
    d.push(v.s / v.n - u.s / u.n);
    w.push(v.n / (v.n + u.n));
  }
  const nw = neweyWest(d, H + 5);
  return { nw, tage: tage.length, wMittel: w.length ? w.reduce((a, x) => a + x, 0) / w.length : null,
           nV: eintraegeV.length, nU: eintraegeU.length, gestutzt: gestutztV + gestutztU };
}
function renditen(S, sigs, faktor) {
  /* faktor: optionale Injektionsfaktoren (W1) fuer den SOLLWERT-Anteil; hier nur echte Renditen */
  const aus = []; let gefallen = 0;
  for (const s of sigs) {
    if (s.entry < 0) { gefallen++; continue; }
    aus.push({ datum: s.datum, wert: S.close[s.exit] / S.close[s.entry] - 1 });
  }
  return { aus, gefallen };
}

/* ---------- Protokolle: Haltedauern und Bezugsgroessen ---------- */
function protokollBezuege(name) {
  const p = JSON.parse(fs.readFileSync(path.join(PROTOKOLLE, name + '-2026-08-26.json'), 'utf8'));
  let idx = p.urteile ? p.urteile.findIndex(u => u === p.bestesUrteil) : 0;
  if (idx < 0) idx = 0;
  const e = p.ergebnisse[idx];
  const kerzen = (e.ausstieg && e.ausstieg.mittlereKerzen) || 7;
  const H = Math.max(1, Math.round(kerzen / 6.5));
  const a7 = e.querschnitt && e.querschnitt.bestaetigung && e.querschnitt.bestaetigung.a7;
  const schwelleProt = bonferroniSchwelle(p.tests || 1);
  const delta80Prot = a7 && a7.se > 0 ? (schwelleProt + Z80) * a7.se : null;
  return { name, variante: idx, bestesUrteil: p.bestesUrteil, tests: p.tests, kerzen, H,
           se: a7 ? a7.se : null, t: a7 ? a7.t : null, delta80Prot, schwelleProt };
}

/* ================================================================ */
const modus = process.argv.includes('--kohorte') ? 'kohorte' : 'waechter';
const t0 = Date.now();
console.log('== messe-verzerrungsrichtung ==  Modus: ' + modus + '  Seed: ' + SEED);
console.log('archiv1d: ' + ARCHIV1D + '   Daten: ' + DATEN);
console.log('Schwellenquelle: ' + schwellenQuelle);

/* 1. Zensus */
const arten = ladeArten();
const U = ladeUeberlebende(arten);
const uMap = new Map(U.reihen.map(r => [r.sym, r]));
const V = ladeVerschwundeneMeta();
const gefiltert = filterFalscheDelistings(V.meta, uMap);
console.log('\n-- Filterzaehlung --');
console.log('Ueberlebende: ' + JSON.stringify(U.zaehl));
console.log('Verschwundene: ' + JSON.stringify(V.zaehl) + '  falsche Delistings raus: ' + JSON.stringify(gefiltert.raus));
console.log('Verschwundene nach Filter: ' + gefiltert.rest.length);

/* 2. Schwellen und Haltedauern */
const schwelleFamilie = bonferroniSchwelle(TESTS_FAMILIE);
console.log('\n-- Familie --  tests=' + TESTS_FAMILIE + '  Schwelle |t|=' + schwelleFamilie.toFixed(3) + '  (delta80 je Sonde = (Schwelle+z80)*se des Laufs)');
const bezuege = { kapitulation: protokollBezuege('kapitulation'), 'monatsende-kauf': protokollBezuege('monatsende-kauf'), 'rsi2seit-mcp': protokollBezuege('rsi2seit-mcp') };
for (const b of Object.values(bezuege))
  console.log(b.name + ': Variante ' + b.variante + ' (' + b.bestesUrteil + '), mittlereKerzen ' + b.kerzen + ' -> H=' + b.H +
    '  se=' + (b.se != null ? (b.se * 100).toFixed(4) + ' Pp' : '?') + '  delta80Prot=' + (b.delta80Prot != null ? (b.delta80Prot * 100).toFixed(4) + ' Pp' : '?') +
    ' (Schwelle ' + b.schwelleProt.toFixed(3) + ' bei ' + b.tests + ' Tests)');
const H_Z1 = bezuege.kapitulation.H, H_Z2 = bezuege['monatsende-kauf'].H;

/* Kalender aus der Vereinigungsmenge (Nachtrag 10): Tage mit >=500 Ueberlebenden-Kerzen */
const tagBreite = new Map();
for (const S of U.reihen) for (let t = S.fensterStart; t < S.dates.length; t++) {
  const d = S.dates[t];
  if (d >= FENSTER_VON && d <= FENSTER_BIS) tagBreite.set(d, (tagBreite.get(d) || 0) + 1);
}
const kalender = [...tagBreite.entries()].filter(([, n]) => n >= 500).map(([d]) => d).sort();
const monatsendSet = monatsenden(kalender);
console.log('Kalender: ' + kalender.length + ' Handelstage (>=500 Reihen), Monatsenden im Fenster: ' + monatsendSet.size);

/* Vorberechnung: Signale + Renditen je Ueberlebendem je Sonde */
function baueUeberlebendenPots(reihen) {
  const pots = { Z0: [], Z1: [], Z2: [], Z9: [] }, proReihe = new Map();
  for (const S of reihen) {
    const r = {};
    for (const [sonde, H] of [['Z0', H_Z1], ['Z1', H_Z1], ['Z2', H_Z2], ['Z9', H_Z1]]) {
      const sigs = signaleFuerReihe(S, sonde, H, monatsendSet);
      r[sonde] = sigs;
      const rr = renditen(S, sigs);
      for (const e of rr.aus) pots[sonde].push({ datum: e.datum, wert: e.wert, sym: S.sym });
    }
    proReihe.set(S.sym, r);
  }
  return { pots, proReihe };
}
console.log('\nBaue Ueberlebenden-Signale (' + U.reihen.length + ' Reihen) ...');
const UP = baueUeberlebendenPots(U.reihen);
console.log('Signale je Sonde (Ueberlebende): Z0=' + UP.pots.Z0.length + ' Z1=' + UP.pots.Z1.length + ' Z2=' + UP.pots.Z2.length + ' Z9=' + UP.pots.Z9.length);

/* ---------- W1: Kunstarchiv ---------- */
console.log('\n-- W1 Kunstarchiv (Kalibrierung) --');
(function W1() {
  const rnd = mulberry32(SEED);
  const pool = U.reihen.filter(S => S.dates.length - S.fensterStart >= KUNST_KERZEN + VORLAUF + 10);
  const todespool = gefiltert.rest.map(m => m.bisDatum).filter(d => d >= FENSTER_VON && d <= FENSTER_BIS);
  if (pool.length < KUNST_N + 500 || !todespool.length) { console.log('W1 NICHT PRUEFBAR: Pool zu klein'); process.exitCode = 3; return; }
  const markiert = mischen(pool, rnd).slice(0, KUNST_N);
  const markiertSyms = new Set(markiert.map(S => S.sym));
  const kunst = [];
  for (const S of markiert) {
    const tod = todespool[Math.floor(rnd() * todespool.length)];
    let ende = S.dates.length - 1;
    while (ende > S.fensterStart + VORLAUF + 5 && S.dates[ende] > tod) ende--;
    if (ende - S.fensterStart < KUNST_KERZEN + 10) continue;
    const n = ende + 1;
    const close = S.close.slice(0, n), dollar = S.dollar.slice(0, n);
    const F = new Array(n).fill(1);
    for (let k = 1; k <= KUNST_KERZEN; k++) {
      const i = n - KUNST_KERZEN - 1 + k;
      F[i] = Math.pow(KUNST_FAKTOR, k / KUNST_KERZEN);
    }
    for (let i = 0; i < n; i++) { close[i] *= F[i]; dollar[i] *= F[i]; }
    const K = { sym: S.sym, dates: S.dates.slice(0, n), close, dollar, fensterStart: S.fensterStart, F };
    K.boden = bodenOk(K);
    kunst.push(K);
  }
  const eintraegeV = [], sollTeile = [];
  let gefallen = 0;
  for (const K of kunst) {
    const sigs = signaleFuerReihe(K, 'Z1', H_Z1, monatsendSet);
    const rr = renditen(K, sigs); gefallen += rr.gefallen;
    for (const e of rr.aus) eintraegeV.push({ datum: e.datum, wert: e.wert });
    for (const s of sigs) if (s.entry >= 0) sollTeile.push(K.F[s.exit] / K.F[s.entry] - 1);
  }
  const eintraegeU = UP.pots.Z1.filter(e => !markiertSyms.has(e.sym)).map(e => ({ datum: e.datum, wert: e.wert }));
  const E = endpunkt(eintraegeV.map(e => ({ ...e })), eintraegeU.map(e => ({ ...e })), H_Z1);
  const soll = sollTeile.length ? sollTeile.reduce((a, x) => a + x, 0) / sollTeile.length : null;
  const c = E.nw.mittel;
  console.log('Kunstreihen: ' + kunst.length + '  markierte Z1-Signale: ' + sollTeile.length + ' (gefallen: ' + gefallen + ')  Paartage: ' + E.tage);
  console.log('Sollwert (aus Injektion): ' + (soll != null ? (soll * 100).toFixed(3) + ' Pp' : '?') +
    '   gemessen c_kunst: ' + (c != null ? (c * 100).toFixed(3) + ' Pp' : '?') + ' (t=' + (E.nw.t != null ? E.nw.t.toFixed(2) : '?') + ')');
  const bestanden = soll != null && c != null && soll < 0 && c < 0 && c / soll >= 0.7 && c / soll <= 1.3;
  console.log('W1 ' + (bestanden ? 'BESTANDEN' : 'VERFEHLT') + ' (Regel: gleiches Vorzeichen, c/soll in [0,7 .. 1,3]; ist: ' + (soll ? (c / soll).toFixed(3) : '?') + ')');
  globalThis.__W1 = { bestanden, soll, c, t: E.nw.t, tage: E.tage };
})();

/* ---------- Dezil-Vorbereitung (fuer W2b und W2) ---------- */
function baueDezile() {
  const uLiq = U.reihen.map(S => {
    const erste = S.dollar.slice(S.fensterStart, S.fensterStart + VORLAUF);
    const liqu = erste.length >= 5 ? erste.slice().sort((a, b) => a - b)[Math.floor(erste.length / 2)] : 0;
    return { sym: S.sym, liqu };
  }).sort((a, b) => a.liqu - b.liqu);
  const uProDezil = [];
  for (let d = 0; d < 10; d++) uProDezil.push([]);
  uLiq.forEach((x, i) => uProDezil[Math.min(9, Math.floor(i / (uLiq.length / 10)))].push(x.sym));
  const liquSortiert = uLiq.map(x => x.liqu);
  const dezilGrenzen = []; for (let k = 1; k <= 9; k++) dezilGrenzen.push(quantil(liquSortiert, k / 10));
  const vDezil = m => { let d = 0; for (let k = 0; k < 9; k++) if (m.liqu >= dezilGrenzen[k]) d = k + 1; return d; };
  return { uProDezil, vMitDezil: gefiltert.rest.map(m => ({ ...m, dezil: vDezil(m) })) };
}
const DEZ = baueDezile();
function pseudoRenditen(symbol, sonde, von, bis) {
  /* Renditen eines Ueberlebenden innerhalb einer aufgezwungenen Kalender-Spanne,
   * Ausstieg an der Spanne beschnitten (identische Konstruktion fuer alle Pseudo-Arme). */
  const S = uMap.get(symbol), sigs = UP.proReihe.get(symbol)[sonde], aus = [];
  for (const s of sigs) {
    if (s.datum < von || s.datum > bis || s.entry < 0) continue;
    let exit = s.exit;
    while (exit > s.entry && S.dates[exit] > bis) exit--;
    aus.push({ datum: s.datum, wert: S.close[exit] / S.close[s.entry] - 1 });
  }
  return aus;
}

/* ---------- W2b: reiner Maschinen-Null (Nachtrag 10b) - GUELTIGKEITS-TOR ---------- */
console.log('\n-- W2b Maschinen-Null (' + TAUSCH_ZIEHUNGEN + ' Ziehungen, zwei identische Pseudo-Arme) --');
(function W2b() {
  const rnd = mulberry32(SEED + 3);
  const cJeZiehung = { Z1: [], Z2: [] };
  for (let z = 0; z < TAUSCH_ZIEHUNGEN; z++) {
    const belegt = new Set(), paare = [];
    for (const v of DEZ.vMitDezil) {
      const kandidaten = DEZ.uProDezil[v.dezil];
      let a = null, b = null;
      for (let versuch = 0; versuch < 40 && (a === null || b === null); versuch++) {
        const k = kandidaten[Math.floor(rnd() * kandidaten.length)];
        if (belegt.has(k)) continue;
        belegt.add(k);
        if (a === null) a = k; else b = k;
      }
      if (a !== null && b !== null) paare.push({ a, b, von: v.vonDatum, bis: v.bisDatum });
      else { if (a !== null) belegt.delete(a); }
    }
    for (const sonde of ['Z1', 'Z2']) {
      const H = sonde === 'Z1' ? H_Z1 : H_Z2;
      const armA = [], armB = [];
      for (const p of paare) {
        for (const e of pseudoRenditen(p.a, sonde, p.von, p.bis)) armA.push(e);
        for (const e of pseudoRenditen(p.b, sonde, p.von, p.bis)) armB.push(e);
      }
      const E = endpunkt(armA, armB, H);
      if (E.nw.mittel != null) cJeZiehung[sonde].push(E.nw.mittel);
    }
    if ((z + 1) % 50 === 0) console.log('  Ziehung ' + (z + 1) + '/' + TAUSCH_ZIEHUNGEN);
  }
  globalThis.__W2b = {};
  for (const sonde of ['Z1', 'Z2']) {
    const cs = cJeZiehung[sonde];
    const mitte = cs.reduce((a, x) => a + x, 0) / cs.length;
    const sd = Math.sqrt(cs.reduce((a, x) => a + (x - mitte) * (x - mitte), 0) / Math.max(1, cs.length - 1));
    const grenze = (schwelleFamilie + Z80) * sd / 4;
    const bestanden = Math.abs(mitte) < grenze;
    const sortiert = cs.slice().sort((x, y) => x - y);
    console.log(sonde + ': Ziehungen=' + cs.length + '  Mittel=' + (mitte * 100).toFixed(4) + ' Pp  sd=' + (sd * 100).toFixed(4) +
      '  Grenze=' + (grenze * 100).toFixed(4) + '  Band10/90=[' + (quantil(sortiert, 0.10) * 100).toFixed(4) + ' .. ' + (quantil(sortiert, 0.90) * 100).toFixed(4) + ']' +
      '  -> ' + (bestanden ? 'BESTANDEN' : 'VERFEHLT'));
    globalThis.__W2b[sonde] = { mitte, sd, grenze, bestanden, band: Math.max(Math.abs(quantil(sortiert, 0.10)), Math.abs(quantil(sortiert, 0.90))) };
  }
})();

/* ---------- W2: Etikettentausch -> Zusammensetzungs-Sockel k (Nachtrag 10a, KEIN Tor) ---------- */
console.log('\n-- W2 Zusammensetzungs-Sockel (' + TAUSCH_ZIEHUNGEN + ' Ziehungen) --');
(function W2() {
  const rnd = mulberry32(SEED + 1);
  const cJeZiehung = { Z1: [], Z2: [] };
  for (let z = 0; z < TAUSCH_ZIEHUNGEN; z++) {
    const belegt = new Set(), pseudo = [];
    for (const v of DEZ.vMitDezil) {
      const kandidaten = DEZ.uProDezil[v.dezil];
      let sym = null;
      for (let versuch = 0; versuch < 30; versuch++) {
        const k = kandidaten[Math.floor(rnd() * kandidaten.length)];
        if (!belegt.has(k)) { sym = k; break; }
      }
      if (!sym) continue;
      belegt.add(sym);
      pseudo.push({ sym, von: v.vonDatum, bis: v.bisDatum });
    }
    for (const sonde of ['Z1', 'Z2']) {
      const H = sonde === 'Z1' ? H_Z1 : H_Z2;
      const eintraegeV = [], eintraegeU = [];
      for (const p of pseudo) for (const e of pseudoRenditen(p.sym, sonde, p.von, p.bis)) eintraegeV.push(e);
      for (const e of UP.pots[sonde]) if (!belegt.has(e.sym)) eintraegeU.push({ datum: e.datum, wert: e.wert });
      const E = endpunkt(eintraegeV, eintraegeU, H);
      if (E.nw.mittel != null) cJeZiehung[sonde].push(E.nw.mittel);
    }
    if ((z + 1) % 50 === 0) console.log('  Ziehung ' + (z + 1) + '/' + TAUSCH_ZIEHUNGEN);
  }
  globalThis.__W2 = {};
  for (const sonde of ['Z1', 'Z2']) {
    const cs = cJeZiehung[sonde].slice().sort((a, b) => a - b);
    const mitte = cs.reduce((a, x) => a + x, 0) / cs.length;
    const sd = Math.sqrt(cs.reduce((a, x) => a + (x - mitte) * (x - mitte), 0) / Math.max(1, cs.length - 1));
    const q10 = quantil(cs, 0.10), q90 = quantil(cs, 0.90);
    console.log(sonde + ': Sockel k=' + (mitte * 100).toFixed(4) + ' Pp  sd=' + (sd * 100).toFixed(4) +
      '  Band10/90=[' + (q10 * 100).toFixed(4) + ' .. ' + (q90 * 100).toFixed(4) + ']  (Messwert, kein Tor - Nachtrag 10a)');
    globalThis.__W2[sonde] = { sockel: mitte, sd, q10, q90 };
  }
})();

/* ---------- Z9-Vorpruefung (nur Ueberlebende, Zwei-Teilung) ---------- */
console.log('\n-- Z9-Vorpruefung (Zwei-Teilung der Ueberlebenden) --');
(function Z9vor() {
  const rnd = mulberry32(SEED + 2);
  const syms = mischen(U.reihen.map(S => S.sym), rnd);
  const armA = new Set(syms.slice(0, Math.floor(syms.length / 2)));
  globalThis.__Z9 = {};
  for (const sonde of ['Z9', 'Z0']) {
    const eintraegeV = [], eintraegeU = [];
    for (const e of UP.pots[sonde]) (armA.has(e.sym) ? eintraegeV : eintraegeU).push({ datum: e.datum, wert: e.wert });
    const E = endpunkt(eintraegeV, eintraegeU, H_Z1);
    const band = globalThis.__W2b && globalThis.__W2b.Z1 ? globalThis.__W2b.Z1.band : null;
    const ok = E.nw.mittel != null && band != null && Math.abs(E.nw.mittel) <= band;
    console.log(sonde + '(pseudo): c=' + (E.nw.mittel != null ? (E.nw.mittel * 100).toFixed(4) : '?') + ' Pp  Tage=' + E.tage +
      '  Band(W2b-Z1)=' + (band != null ? (band * 100).toFixed(4) : '?') + '  -> ' + (ok ? 'BESTANDEN' : 'VERFEHLT'));
    globalThis.__Z9[sonde] = { c: E.nw.mittel, ok };
  }
})();

const waechterErgebnis = {
  gemessenAm: new Date().toISOString(), modus, seed: SEED, schwelleFamilie, schwellenQuelle,
  filter: { ueberlebende: U.zaehl, verschwundene: V.zaehl, falscheDelistings: gefiltert.raus, verschwundeneNachFilter: gefiltert.rest.length },
  haltedauern: { H_Z1, H_Z2 }, bezuege,
  W1: globalThis.__W1 || null, W2b: globalThis.__W2b || null, W2sockel: globalThis.__W2 || null, Z9vor: globalThis.__Z9 || null
};
fs.writeFileSync(path.join(HIER, 'waechter-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'), JSON.stringify(waechterErgebnis, null, 1));
console.log('\nWaechter-Ergebnis gespeichert. Dauer: ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');

const alleWaechterOk = waechterErgebnis.W1 && waechterErgebnis.W1.bestanden &&
  waechterErgebnis.W2b && waechterErgebnis.W2b.Z1.bestanden && waechterErgebnis.W2b.Z2.bestanden &&
  waechterErgebnis.Z9vor && waechterErgebnis.Z9vor.Z9.ok && waechterErgebnis.Z9vor.Z0.ok;
console.log('Waechter gesamt: ' + (alleWaechterOk ? 'ALLE BESTANDEN' : 'MINDESTENS EINER VERFEHLT'));

if (modus !== 'kohorte') {
  console.log('\nEnde (Waechter-Modus). Der Kohortenlauf (--kohorte) startet erst nach PM-Rueckmeldung.');
  process.exit(alleWaechterOk ? 0 : 3);
}

/* ================== KOHORTE (ein Lauf, R0-R6) ================== */
if (!alleWaechterOk) { console.log('\nR0: Waechter verfehlt -> Messung ungueltig, keine Kohortenrechnung.'); process.exit(3); }
console.log('\n== KOHORTE ==');
const ergebnisse = {};
for (const [sonde, H] of [['Z0', H_Z1], ['Z9', H_Z1], ['Z1', H_Z1], ['Z2', H_Z2]]) {
  const eintraegeV = []; let gefallen = 0;
  for (const m of gefiltert.rest) {
    const S = m._S; S.boden = S.boden || bodenOk(S);
    const sigs = signaleFuerReihe(S, sonde, H, monatsendSet);
    const rr = renditen(S, sigs); gefallen += rr.gefallen;
    for (const e of rr.aus) eintraegeV.push({ datum: e.datum, wert: e.wert });
  }
  const eintraegeU = UP.pots[sonde].map(e => ({ datum: e.datum, wert: e.wert }));
  const E = endpunkt(eintraegeV, eintraegeU, H);
  const delta80 = E.nw.se != null ? (schwelleFamilie + Z80) * E.nw.se : null;
  ergebnisse[sonde] = { ...E, delta80, gefallen };
  console.log(sonde + ': c=' + (E.nw.mittel != null ? (E.nw.mittel * 100).toFixed(4) : '?') + ' Pp  se=' + (E.nw.se != null ? (E.nw.se * 100).toFixed(4) : '?') +
    '  t=' + (E.nw.t != null ? E.nw.t.toFixed(2) : '?') + '  Paartage=' + E.tage + '  wMittel=' + (E.wMittel != null ? (E.wMittel * 100).toFixed(2) + ' %' : '?') +
    '  nV=' + E.nV + ' (gefallen ' + gefallen + ')  gestutzt=' + E.gestutzt);
}
/* Zusammensetzungs-Sockel nachrichtlich (Nachtrag 10a) */
for (const sonde of ['Z1', 'Z2']) {
  const k = globalThis.__W2 && globalThis.__W2[sonde] ? globalThis.__W2[sonde].sockel : null;
  const c = ergebnisse[sonde].nw.mittel;
  if (k != null && c != null)
    console.log(sonde + ': Sockel k=' + (k * 100).toFixed(4) + ' Pp  ->  c_jenseits = c_total - k = ' + ((c - k) * 100).toFixed(4) + ' Pp (nachrichtlich, kein Urteil)');
}
/* Z9-Kohortenpruefung: |c_Z9 - c_Z0| < delta80(Z0) */
const z9diff = Math.abs((ergebnisse.Z9.nw.mittel || 0) - (ergebnisse.Z0.nw.mittel || 0));
const z9ok = ergebnisse.Z0.delta80 != null && z9diff < ergebnisse.Z0.delta80;
console.log('Z9-Kohortenpruefung: |c_Z9 - c_Z0| = ' + (z9diff * 100).toFixed(4) + ' Pp  < delta80(Z0)=' + ((ergebnisse.Z0.delta80 || 0) * 100).toFixed(4) + ' ? ' + (z9ok ? 'ja' : 'NEIN -> ungueltig'));
if (!z9ok) { console.log('R0b: Messung ungueltig.'); process.exit(3); }

/* Urteile */
function richtungsUrteil(E) {
  if (E.nw.t == null) return 'nicht entscheidbar mit diesen Daten';
  if (Math.abs(E.nw.t) >= schwelleFamilie) return E.nw.mittel < 0 ? 'Richtung belegt: NEGATIV (Archiv beschoenigt)' : 'Richtung belegt: POSITIV (Archiv untertreibt)';
  const lo = E.nw.mittel - 1.645 * E.nw.se, hi = E.nw.mittel + 1.645 * E.nw.se;
  if (E.delta80 != null && lo > -E.delta80 && hi < E.delta80) return 'im Fenster ohne messbare Richtung';
  return 'nicht entscheidbar mit diesen Daten';
}
function materialitaet(E, bez) {
  if (E.nw.mittel == null || bez.delta80Prot == null) return 'nicht entscheidbar';
  const dbLo = W_QUER * (E.nw.mittel - 1.645 * E.nw.se), dbHi = W_QUER * (E.nw.mittel + 1.645 * E.nw.se);
  const dbAbsMax = Math.max(Math.abs(dbLo), Math.abs(dbHi)), dbPunkt = W_QUER * E.nw.mittel;
  const richtungBelegt = Math.abs(E.nw.t) >= schwelleFamilie;
  if (Math.abs(dbPunkt) >= bez.delta80Prot && richtungBelegt) return 'Verzerrung materiell (dB_Quer=' + (dbPunkt * 100).toFixed(4) + ' Pp >= delta80Prot)';
  if (dbAbsMax < bez.delta80Prot / 2) return 'im Fenster unerheblich (obere Grenze ' + (dbAbsMax * 100).toFixed(4) + ' Pp < delta80Prot/2; E-F1-Vorbehalt gilt)';
  return 'nicht entscheidbar';
}
console.log('\n-- Urteile (R1-R6) --');
const urteile = {
  'Richtung Z1': richtungsUrteil(ergebnisse.Z1),
  'Richtung Z2': richtungsUrteil(ergebnisse.Z2),
  'Materialitaet kapitulation': materialitaet(ergebnisse.Z1, bezuege.kapitulation),
  'Materialitaet rsi2seit-mcp': materialitaet(ergebnisse.Z1, bezuege['rsi2seit-mcp']),
  'Materialitaet monatsende-kauf': materialitaet(ergebnisse.Z2, bezuege['monatsende-kauf'])
};
for (const [k, v] of Object.entries(urteile)) console.log(k + ': ' + v);
console.log('\nSperrliste (Vorreg. §5) gilt woertlich: kein Kanten-Urteil, kein E1-Leiserstellen, momentum nur Einschraenkung, 60m nur mit Ue1-Vorbehalt.');
const lauf = { gemessenAm: new Date().toISOString(), seed: SEED, schwelleFamilie, bezuege, waechter: waechterErgebnis, ergebnisse, z9diff, urteile, wQuer: W_QUER };
fs.writeFileSync(path.join(HIER, 'lauf-' + new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-') + '.json'), JSON.stringify(lauf, null, 1));
console.log('Lauf gespeichert. Gesamtdauer: ' + ((Date.now() - t0) / 1000).toFixed(0) + ' s');
