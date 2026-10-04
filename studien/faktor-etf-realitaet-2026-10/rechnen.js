'use strict';
/* Faktor-ETF-Realitaetsprobe 2026-10 - der Rechner.
 * Kennung faktor-etf-realitaet-2026-10/v1. Regeln: REGEL.md (Siegel), hier nur umgesetzt.
 *
 * Bibliothek (require) und Kommandozeile:
 *   node rechnen.js --roh <ordner> --gruppe <g1|g2|g3|g4|g5|alle> --aus <datei.json>
 *
 * Liest die Rohantworten der Yahoo-Chart-Schnittstelle (laden.js), baut je Reihe den
 * Gesamtertrag (Schluss + Ausschuettungen, wieder angelegt zum Schluss des Ex-Tags),
 * und rechnet gegen SPY (und bei UCITS zusaetzlich gegen SXR8.DE):
 *   (a) Fenster A und B, (b) alle rollierenden 5-Jahres-Fenster mit Monatsstart,
 *   den groessten Rueckschlag gegen den Massstab, und das Urteil nach REGEL.md Paragraph 1.
 * Keine Anlageberatung - beschreibende Zahlen nach vorab festgelegter Regel. */

const fs = require('fs');
const path = require('path');

const KENNUNG = 'faktor-etf-realitaet-2026-10/v1';
const FENSTER = {
  A: { start: '2017-01-04', ende: '2021-09-15' },
  B: { start: '2021-09-16', ende: '2026-09-15' }
};
const DATENENDE = '2026-09-15';
const ROLL_MONATE = 60;
const SCHWELLE_ANTEIL = 0.8;
/* Ein Fensterrand gilt nur, wenn die Reihe dort wirklich lebt: der gefundene Handelstag darf
 * hoechstens so viele Kalendertage vor dem gesuchten Datum liegen (sonst Luecke/Reihenende). */
const RAND_TOLERANZ_TAGE = 10;
/* Sprungpaar (REGEL.md Paragraph 7): |r(t)| > 15 %, r(t+1) mit Gegenvorzeichen und |r(t+1)| > 10 %,
 * und (1+r(t))(1+r(t+1)) liegt in [0,97; 1,03] -> der Schluss am Tag t gilt als Fehlkurs. */
const SPRUNG = { erster: 0.15, zweiter: 0.10, band: 0.03 };

/* ---------- Datum ---------- */

const formatierer = new Map();
function lokalesDatum(sekunden, zeitzone) {
  const tz = zeitzone || 'UTC';
  let f = formatierer.get(tz);
  if (!f) {
    f = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' });
    formatierer.set(tz, f);
  }
  return f.format(new Date(sekunden * 1000));
}
function tageZwischen(d1, d2) {
  return Math.round((Date.parse(d2 + 'T00:00:00Z') - Date.parse(d1 + 'T00:00:00Z')) / 86400000);
}
function monatPlus(monat, n) {
  const j = Number(monat.slice(0, 4)); const m = Number(monat.slice(5, 7)) - 1 + n;
  const jj = j + Math.floor(m / 12); const mm = ((m % 12) + 12) % 12 + 1;
  return jj + '-' + String(mm).padStart(2, '0');
}
function letzterKalendertag(monat) {
  const j = Number(monat.slice(0, 4)); const m = Number(monat.slice(5, 7));
  const d = new Date(Date.UTC(j, m, 0));
  return d.toISOString().slice(0, 10);
}

/* ---------- Rohdaten lesen ---------- */

function leseYahoo(json) {
  const fehler = json && json.chart && json.chart.error;
  const r = json && json.chart && json.chart.result && json.chart.result[0];
  if (!r || !r.timestamp || !r.timestamp.length) {
    throw new Error('Yahoo-Antwort ohne Kerzen' + (fehler ? ': ' + JSON.stringify(fehler) : ''));
  }
  const meta = r.meta || {};
  const tz = meta.exchangeTimezoneName || 'UTC';
  const q = (r.indicators && r.indicators.quote && r.indicators.quote[0]) || {};
  const adj = r.indicators && r.indicators.adjclose && r.indicators.adjclose[0] ? r.indicators.adjclose[0].adjclose : null;
  const roh = [];
  let ohneSchluss = 0;
  for (let i = 0; i < r.timestamp.length; i++) {
    const c = q.close ? q.close[i] : null;
    if (c == null || !(c > 0)) { ohneSchluss++; continue; }
    roh.push({ d: lokalesDatum(r.timestamp[i], tz), t: r.timestamp[i], c, adj: adj && adj[i] > 0 ? adj[i] : null });
  }
  /* Gleiches Datum doppelt (laufende Kerze neben Tageskerze): die spaetere Zeile gilt. */
  const tage = [];
  let doppelt = 0;
  for (const z of roh) {
    if (tage.length && tage[tage.length - 1].d === z.d) { tage[tage.length - 1] = z; doppelt++; continue; }
    if (tage.length && tage[tage.length - 1].d > z.d) throw new Error('Datum nicht aufsteigend bei ' + z.d);
    tage.push(z);
  }
  const ev = r.events || {};
  const liste = (o) => Object.keys(o || {}).map((k) => o[k]);
  const div = liste(ev.dividends).map((e) => ({ d: lokalesDatum(e.date, tz), t: e.date, betrag: e.amount }))
    .sort((a, b) => a.t - b.t);
  const cg = liste(ev.capitalGains).map((e) => ({ d: lokalesDatum(e.date, tz), t: e.date, betrag: e.amount }))
    .sort((a, b) => a.t - b.t);
  const splits = liste(ev.splits).map((e) => ({ d: lokalesDatum(e.date, tz), t: e.date, zaehler: e.numerator, nenner: e.denominator }))
    .sort((a, b) => a.t - b.t);
  return {
    symbol: meta.symbol, name: meta.longName || meta.shortName || null, waehrung: meta.currency, boerse: meta.exchangeName, zeitzone: tz,
    ersterHandel: meta.firstTradeDate != null ? lokalesDatum(meta.firstTradeDate, tz) : null,
    tage, div, cg, splits, ohneSchluss, doppelt
  };
}

function leseRohdatei(ordner, symbol) {
  const datei = path.join(ordner, dateiname(symbol));
  return leseYahoo(JSON.parse(fs.readFileSync(datei, 'utf8')));
}
function dateiname(symbol) { return symbol.replace(/[^A-Za-z0-9._-]/g, '_') + '.json'; }

/* EZB-Referenzkurse (CSV aus data-api.ecb.europa.eu, format=csvdata): Einheiten Fremdwaehrung je 1 EUR. */
function leseEzb(text) {
  const zeilen = text.split(/\r?\n/).filter((z) => z.trim());
  const kopf = zeilen[0].split(',');
  const iD = kopf.indexOf('TIME_PERIOD'); const iW = kopf.indexOf('OBS_VALUE');
  if (iD < 0 || iW < 0) throw new Error('EZB-CSV ohne TIME_PERIOD/OBS_VALUE');
  const out = [];
  for (let i = 1; i < zeilen.length; i++) {
    const s = zeilen[i].split(',');
    const w = Number(s[iW]);
    if (s[iD] && w > 0) out.push({ d: s[iD], w });
  }
  out.sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  return out;
}

/* ---------- Pruefen ---------- */

function sprungpaare(tage) {
  const fehl = [];
  for (let i = 1; i + 1 < tage.length; i++) {
    const r1 = tage[i].c / tage[i - 1].c - 1;
    const r2 = tage[i + 1].c / tage[i].c - 1;
    if (Math.abs(r1) > SPRUNG.erster && Math.abs(r2) > SPRUNG.zweiter && Math.sign(r1) !== Math.sign(r2)) {
      const p = (1 + r1) * (1 + r2);
      if (p >= 1 - SPRUNG.band && p <= 1 + SPRUNG.band) fehl.push({ d: tage[i].d, r1, r2 });
    }
  }
  return fehl;
}
/* Marktrendite ueber dieselben Kalendertage (letzter Wert <= Tag) */
function marktRendite(markt, von, bis) {
  if (!markt) return null;
  const a = wertBis(markt, von); const b = wertBis(markt, bis);
  return a && b ? b.v / a.v - 1 : null;
}
function grosseBewegungen(tage, schwelle, markt) {
  const out = [];
  for (let i = 1; i < tage.length; i++) {
    const r = tage[i].c / tage[i - 1].c - 1;
    if (Math.abs(r) > schwelle) out.push({ d: tage[i].d, r, rMarkt: marktRendite(markt, tage[i - 1].d, tage[i].d) });
  }
  return out;
}

/* Korrektur K1 (nach dem Siegel, VOR dem Laden des ersten Fonds; gefunden an der Eichung von SXR8.DE: 2010-05-19 bis
 * 2010-10-29 eingefrorene Kurse 92,67/96,95, dann -24,6 % am 01.11.2010 bei SPY ~0 %). Bruch = Tagesbewegung > 10 %, die der
 * Markt nicht deckt (|r - r_Markt| > 8 Pp; Markt = SPY-Gesamtertrag ueber dieselben Kalendertage). Liegt ein Bruch in den
 * ersten 730 Kalendertagen der Reihe, beginnt die Reihe am Bruchtag (der Abschnitt davor wird verworfen, nichts erfunden).
 * Spaetere Brueche werden nur gelistet und von Hand geklaert. Gilt fuer jede Reihe gleich; siehe ERGEBNIS.md, Korrekturen. */
const BRUCH = { bewegung: 0.10, abstand: 0.08, anfangTage: 730 };
function brueche(tage, markt) {
  if (!markt) return [];
  return grosseBewegungen(tage, BRUCH.bewegung, markt)
    .filter((x) => x.rMarkt != null && Math.abs(x.r - x.rMarkt) > BRUCH.abstand);
}
/* eingefrorene Kurse: Laeufe gleicher Schlusskurse ueber mindestens 5 Handelstage */
function eingefroren(tage) {
  const laeufe = []; let a = 0;
  for (let i = 1; i <= tage.length; i++) {
    if (i < tage.length && tage[i].c === tage[a].c) continue;
    if (i - a >= 5) laeufe.push({ von: tage[a].d, bis: tage[i - 1].d, tage: i - a });
    a = i;
  }
  return laeufe;
}

/* Ausschuettungen den Handelstagen zuordnen: Ex-Tag = erster Handelstag mit Datum >= Ereignisdatum. */
function ordneZu(tage, ereignisse) {
  const map = new Map();
  let verschoben = 0; let ausserhalb = 0;
  let j = 0;
  const sortiert = ereignisse.slice().sort((a, b) => (a.d < b.d ? -1 : a.d > b.d ? 1 : 0));
  for (const e of sortiert) {
    while (j < tage.length && tage[j].d < e.d) j++;
    if (j >= tage.length) { ausserhalb++; continue; }
    if (j === 0 && tage[0].d > e.d) { ausserhalb++; continue; }
    if (tage[j].d !== e.d) verschoben++;
    map.set(tage[j].d, (map.get(tage[j].d) || 0) + e.betrag);
  }
  return { map, verschoben, ausserhalb };
}

/* Ausschuettungen aus Dividenden und Kapitalgewinnen; ein Kapitalgewinn, der mit gleichem Datum und
 * gleichem Betrag schon als Dividende gefuehrt wird, zaehlt nur einmal (REGEL.md Paragraph 4). */
function ausschuettungen(reihe) {
  const alle = reihe.div.slice();
  let doppelt = 0;
  for (const g of reihe.cg) {
    const gleich = reihe.div.some((x) => x.d === g.d && Math.abs(x.betrag - g.betrag) < 1e-9);
    if (gleich) { doppelt++; continue; }
    alle.push(g);
  }
  return { liste: alle, cgDoppelt: doppelt };
}

/* ---------- Gesamtertrag ---------- */

/* tage: [{d, c}] (Schluss, split-bereinigt), aussch: Map Datum -> Betrag (gleiche Einheit wie c).
 * TR(t) = TR(t-1) * (c(t) + D(t)) / c(t-1), TR(erster Tag) = 1. */
function gesamtertrag(tage, aussch) {
  const out = [];
  let tr = 1;
  for (let i = 0; i < tage.length; i++) {
    if (i > 0) {
      const D = aussch && aussch.get(tage[i].d) ? aussch.get(tage[i].d) : 0;
      tr = tr * (tage[i].c + D) / tage[i - 1].c;
    }
    out.push({ d: tage[i].d, v: tr });
  }
  return out;
}
function ausAdj(tage) {
  const basis = tage.find((z) => z.adj > 0);
  if (!basis) return null;
  return tage.filter((z) => z.adj > 0).map((z) => ({ d: z.d, v: z.adj / basis.adj }));
}

/* Umrechnung einer Reihe (Werte in Waehrung X) mit Kursen k(d) in Zielwaehrung: v * faktor(d). */
function umrechnen(reihe, faktorAm) {
  const out = [];
  for (const z of reihe) {
    const f = faktorAm(z.d);
    if (!(f > 0)) continue;
    out.push({ d: z.d, v: z.v * f });
  }
  return out;
}
/* Faktor "Zielwaehrung je Einheit Quellwaehrung" am Datum d aus EZB-Reihen (je 1 EUR):
 * EUR->USD: usd(d); GBP->USD: usd(d)/gbp(d); USD->EUR: 1/usd(d); GBp: /100 zusaetzlich. */
function wechselFaktor(von, nach, ezb) {
  const quelle = von === 'GBp' ? 'GBP' : von;
  const teiler = von === 'GBp' ? 100 : 1;
  if (quelle === nach) return () => 1 / teiler;
  const jeEur = (w) => {
    if (w === 'EUR') return () => 1;
    const r = ezb[w];
    if (!r) throw new Error('kein EZB-Kurs fuer ' + w);
    return (d) => { const z = wertBis(r, d); return z ? z.w : NaN; };
  };
  const q = jeEur(quelle); const z = jeEur(nach);
  /* Wert in quelle -> EUR: / q(d); EUR -> nach: * z(d). */
  return (d) => z(d) / q(d) / teiler;
}

/* ---------- Werte an Daten ---------- */

/* letzter Eintrag mit d <= datum (binaere Suche) */
function wertBis(reihe, datum) {
  let lo = 0; let hi = reihe.length - 1; let ok = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (reihe[m].d <= datum) { ok = m; lo = m + 1; } else hi = m - 1;
  }
  return ok >= 0 ? reihe[ok] : null;
}
function wertVor(reihe, datum) {
  let lo = 0; let hi = reihe.length - 1; let ok = -1;
  while (lo <= hi) {
    const m = (lo + hi) >> 1;
    if (reihe[m].d < datum) { ok = m; lo = m + 1; } else hi = m - 1;
  }
  return ok >= 0 ? reihe[ok] : null;
}
function vorTag(datum) {
  return new Date(Date.parse(datum + 'T00:00:00Z') - 86400000).toISOString().slice(0, 10);
}

/* Fenster [start, ende]: Wert am Schluss des letzten Handelstags vor start bis Schluss des letzten
 * Handelstags <= ende. Beide Raender muessen hoechstens RAND_TOLERANZ_TAGE vom Sollrand entfernt sein. */
function fensterRendite(reihe, start, ende) {
  const s = wertVor(reihe, start); const e = wertBis(reihe, ende);
  if (!s || !e) return null;
  if (tageZwischen(s.d, vorTag(start)) > RAND_TOLERANZ_TAGE) return null;
  if (tageZwischen(e.d, ende) > RAND_TOLERANZ_TAGE) return null;
  return { r: e.v / s.v - 1, von: s.d, bis: e.d };
}
function jahreNominal(start, ende) { return tageZwischen(vorTag(start), ende) / 365.25; }
function pa(r, jahre) { return Math.pow(1 + r, 1 / jahre) - 1; }

function fensterVergleich(fonds, mass, start, ende) {
  const f = fensterRendite(fonds, start, ende); const m = fensterRendite(mass, start, ende);
  if (!f || !m) return { berechenbar: false, start, ende };
  const j = jahreNominal(start, ende);
  const fpa = pa(f.r, j); const mpa = pa(m.r, j);
  return {
    berechenbar: true, start, ende, jahre: j,
    fonds: f.r, mass: m.r, fondsPa: fpa, massPa: mpa,
    abstandPa: fpa - mpa, vorn: f.r > m.r,
    raender: { fonds: [f.von, f.bis], mass: [m.von, m.bis] }
  };
}

/* ---------- rollierende 5-Jahres-Fenster ---------- */

function monatsEnden(reihe) {
  const m = new Map();
  for (const z of reihe) m.set(z.d.slice(0, 7), z);
  return m;
}
function rollierend(fonds, mass, datenende) {
  const ende = datenende || DATENENDE;
  const mf = monatsEnden(fonds); const mm = monatsEnden(mass);
  const erster = fonds[0].d > mass[0].d ? fonds[0].d : mass[0].d;
  let m0 = erster.slice(0, 7);
  const fenster = []; let fehlend = 0;
  for (; ; m0 = monatPlus(m0, 1)) {
    const m1 = monatPlus(m0, ROLL_MONATE);
    if (letzterKalendertag(m1) > ende) break;
    const fs0 = mf.get(m0); const fs1 = mf.get(m1); const ms0 = mm.get(m0); const ms1 = mm.get(m1);
    /* Monatsende muss in den letzten RAND_TOLERANZ_TAGE des Monats liegen (sonst Luecke) */
    const gut = (z, mon) => z && tageZwischen(z.d, letzterKalendertag(mon)) <= RAND_TOLERANZ_TAGE;
    if (!gut(fs0, m0) || !gut(fs1, m1) || !gut(ms0, m0) || !gut(ms1, m1)) { fehlend++; continue; }
    const rf = fs1.v / fs0.v - 1; const rm = ms1.v / ms0.v - 1;
    fenster.push({ start: m0, von: fs0.d, bis: fs1.d, fonds: rf, mass: rm, abstandPa: pa(rf, 5) - pa(rm, 5), vorn: rf > rm });
  }
  const n = fenster.length;
  if (!n) return { n: 0, fehlend };
  const ab = fenster.map((x) => x.abstandPa).slice().sort((a, b) => a - b);
  const median = n % 2 ? ab[(n - 1) / 2] : (ab[n / 2 - 1] + ab[n / 2]) / 2;
  const vorn = fenster.filter((x) => x.vorn).length;
  const schlecht = fenster.reduce((a, b) => (b.abstandPa < a.abstandPa ? b : a));
  const gut = fenster.reduce((a, b) => (b.abstandPa > a.abstandPa ? b : a));
  /* nicht ueberlappende Fenster ab dem ersten Start (Start, Start+60, ...) - nur zur Einordnung */
  const unabh = [];
  for (let k = 0; k < n; k += ROLL_MONATE) unabh.push({ start: fenster[k].start, vorn: fenster[k].vorn, abstandPa: fenster[k].abstandPa });
  return {
    n, vorn, anteil: vorn / n, median, schlechtester: schlecht.abstandPa, schlechtesterStart: schlecht.start,
    bester: gut.abstandPa, besterStart: gut.start, erstesFenster: fenster[0].start, letztesFenster: fenster[n - 1].start,
    fehlend, nichtUeberlappend: unabh, fenster
  };
}

/* ---------- Rueckschlaege ---------- */

function rueckschlag(reihe, bis) {
  let spitze = null; let tief = 0; let sp = null; let tal = null; let spT = null;
  for (const z of reihe) {
    if (bis && z.d > bis) break;
    if (!spitze || z.v > spitze.v) spitze = z;
    const dd = z.v / spitze.v - 1;
    if (dd < tief) { tief = dd; sp = spitze.d; tal = z.d; spT = spitze; }
  }
  return { tiefe: tief, spitze: sp, tal, _spitze: spT };
}
/* relative Reihe Fonds/Massstab auf den Handelstagen des Fonds (Massstab: letzter Wert <= Tag) */
function relativ(fonds, mass, bis) {
  const out = [];
  const start = fonds[0].d > mass[0].d ? fonds[0].d : mass[0].d;
  for (const z of fonds) {
    if (z.d < start) continue;
    if (bis && z.d > bis) break;
    const m = wertBis(mass, z.d);
    if (!m) continue;
    out.push({ d: z.d, v: z.v / m.v });
  }
  return out;
}
function rueckschlagRelativ(fonds, mass, bis) {
  const rel = relativ(fonds, mass, bis || DATENENDE);
  const r = rueckschlag(rel);
  return { tiefe: r.tiefe, spitze: r.spitze, tal: r.tal, von: rel.length ? rel[0].d : null, bis: rel.length ? rel[rel.length - 1].d : null };
}
function gesamtVergleich(fonds, mass, bis) {
  const ende = bis || DATENENDE;
  const start = fonds[0].d > mass[0].d ? fonds[0].d : mass[0].d;
  const f0 = wertBis(fonds, start); const m0 = wertBis(mass, start);
  const f1 = wertBis(fonds, ende); const m1 = wertBis(mass, ende);
  if (!f0 || !m0 || !f1 || !m1) return null;
  const j = tageZwischen(start, ende) / 365.25;
  if (j <= 0) return null;
  const rf = f1.v / f0.v - 1; const rm = m1.v / m0.v - 1;
  return { von: start, bis: ende, jahre: j, fonds: rf, mass: rm, abstandPa: pa(rf, j) - pa(rm, j) };
}

/* ---------- Factsheet-Stichprobe (REGEL.md Paragraph 8) ---------- */

/* Rendite p. a. ueber n Jahre bis Stichtag: Schluss am letzten Handelstag <= (Stichtag - n Jahre,
 * gleiches Kalenderdatum) bis Schluss am letzten Handelstag <= Stichtag. */
function jahreZurueck(datum, n) {
  const j = Number(datum.slice(0, 4)) - n;
  let d = j + datum.slice(4);
  /* 29.02. in einem Nicht-Schaltjahr -> 28.02. */
  if (d.slice(5) === '02-29' && !(j % 4 === 0 && (j % 100 !== 0 || j % 400 === 0))) d = j + '-02-28';
  return d;
}
function renditeBisStichtag(reihe, stichtag, n) {
  const s = wertBis(reihe, jahreZurueck(stichtag, n)); const e = wertBis(reihe, stichtag);
  if (!s || !e) return null;
  if (tageZwischen(s.d, jahreZurueck(stichtag, n)) > RAND_TOLERANZ_TAGE) return null;
  if (tageZwischen(e.d, stichtag) > RAND_TOLERANZ_TAGE) return null;
  const r = e.v / s.v - 1;
  return { von: s.d, bis: e.d, r, pa: n === 1 ? r : pa(r, n) };
}

/* ---------- Urteil (REGEL.md Paragraph 1) ---------- */

function urteil(A, B, roll) {
  if (!A.berechenbar || !B.berechenbar) return { satz: 'nicht beurteilbar (zu jung)', erfuellt: null };
  if (!roll || !roll.n) return { satz: 'nicht beurteilbar (keine 5-Jahres-Fenster)', erfuellt: null };
  const kA = A.vorn; const kB = B.vorn; const kR = roll.anteil >= SCHWELLE_ANTEIL;
  const ok = kA && kB && kR;
  const gruende = [];
  if (!kR) gruende.push('nur ' + (roll.anteil * 100).toFixed(1) + ' % der Fenster vorn');
  if (!kA) gruende.push('Fenster A hinten');
  if (!kB) gruende.push('Fenster B hinten');
  return { satz: ok ? 'verlässlich vorn' : 'nicht verlässlich vorn', erfuellt: ok, kriterien: { fensterA: kA, fensterB: kB, anteil80: kR }, gruende };
}

/* Alles fuer ein Paar Fonds/Massstab (beide als Gesamtertrag in gleicher Waehrung). */
function vergleiche(fonds, mass, datenende) {
  const ende = datenende || DATENENDE;
  const A = fensterVergleich(fonds, mass, FENSTER.A.start, FENSTER.A.ende);
  const B = fensterVergleich(fonds, mass, FENSTER.B.start, FENSTER.B.ende);
  const roll = rollierend(fonds, mass, ende);
  const rel = rueckschlagRelativ(fonds, mass, ende);
  const start = fonds[0].d > mass[0].d ? fonds[0].d : mass[0].d;
  const absF = rueckschlag(fonds.filter((z) => z.d >= start), ende);
  const absM = rueckschlag(mass.filter((z) => z.d >= start), ende);
  const ges = gesamtVergleich(fonds, mass, ende);
  const u = urteil(A, B, roll);
  const rollKurz = Object.assign({}, roll); delete rollKurz.fenster;
  return {
    A, B, rollierend: rollKurz, rueckschlagGegenMassstab: rel,
    rueckschlagAbsolut: { fonds: absF.tiefe, fondsSpitze: absF.spitze, fondsTal: absF.tal, mass: absM.tiefe, massSpitze: absM.spitze, massTal: absM.tal },
    gesamt: ges, urteil: u, _fenster: roll.fenster || []
  };
}

/* ---------- eine Reihe aufbereiten (Pruefungen + Gesamtertrag) ---------- */

function bereite(reihe, markt) {
  const fehl = sprungpaare(reihe.tage);
  const fehlSet = new Set(fehl.map((x) => x.d));
  const tage0 = reihe.tage.filter((z) => !fehlSet.has(z.d));
  /* K1: Bruch in den ersten 730 Tagen -> Reihe beginnt am (letzten solchen) Bruchtag */
  const br = brueche(tage0, markt);
  let schnitt = null;
  for (const b of br) if (tage0.length && tageZwischen(tage0[0].d, b.d) <= BRUCH.anfangTage) schnitt = b.d;
  const tage = schnitt ? tage0.filter((z) => z.d >= schnitt) : tage0;
  /* Rand eingefroren? (Schluss am Fensterrand gleich dem Vortag) - nur Hinweis */
  const randGleich = {};
  for (const k of ['A', 'B']) {
    for (const [name, d, vor] of [['start', FENSTER[k].start, true], ['ende', FENSTER[k].ende, false]]) {
      const idx = vor ? tage.findIndex((z) => z.d >= d) - 1 : (() => { let j = -1; for (let i = 0; i < tage.length && tage[i].d <= d; i++) j = i; return j; })();
      if (idx > 0) randGleich[k + '-' + name] = { d: tage[idx].d, gleichVortag: tage[idx].c === tage[idx - 1].c };
    }
  }
  const a = ausschuettungen(reihe);
  const z = ordneZu(tage, a.liste);
  const tr = gesamtertrag(tage, z.map);
  const adj = ausAdj(tage);
  /* Abgleich mit adjclose: Rendite A und B aus beiden Wegen */
  const abgleich = {};
  for (const k of ['A', 'B']) {
    const x = fensterRendite(tr, FENSTER[k].start, FENSTER[k].ende);
    const y = adj ? fensterRendite(adj, FENSTER[k].start, FENSTER[k].ende) : null;
    if (x && y) {
      const j = jahreNominal(FENSTER[k].start, FENSTER[k].ende);
      abgleich[k] = { schlussPlusAusschuettung: x.r, adjclose: y.r, differenzPa: pa(x.r, j) - pa(y.r, j) };
    }
  }
  return {
    tr, adj,
    pruefung: {
      tage: tage.length, erster: tage.length ? tage[0].d : null, letzter: tage.length ? tage[tage.length - 1].d : null,
      ohneSchluss: reihe.ohneSchluss, doppelteDaten: reihe.doppelt,
      sprungpaare: fehl, grosseBewegungen: grosseBewegungen(tage, 0.10, markt),
      brueche: br.map((b) => Object.assign({}, b, { verworfenBis: schnitt && b.d <= schnitt })), anfangVerworfenBis: schnitt,
      eingefroren: eingefroren(tage), randGleichVortag: randGleich,
      ausschuettungen: a.liste.length, kapitalgewinne: reihe.cg.length, kapitalgewinnDoppelt: a.cgDoppelt,
      ausschuettungVerschoben: z.verschoben, ausschuettungAusserhalb: z.ausserhalb,
      splits: reihe.splits, abgleichAdjclose: abgleich,
      luecken: luecken(tage)
    }
  };
}
/* Luecken > 7 Kalendertage zwischen zwei Handelstagen */
function luecken(tage) {
  const out = [];
  for (let i = 1; i < tage.length; i++) {
    const t = tageZwischen(tage[i - 1].d, tage[i].d);
    if (t > 7) out.push({ von: tage[i - 1].d, bis: tage[i].d, tage: t });
  }
  return out;
}

/* ---------- Symbolwahl fuer UCITS (REGEL.md Paragraph 6) ---------- */

function waehleSymbol(kandidaten, auflage) {
  /* kandidaten: [{symbol, erster}] in Listenreihenfolge (Xetra zuerst) */
  const mit = kandidaten.filter((k) => k.erster);
  if (!mit.length) return null;
  if (auflage) {
    const frueh = mit.find((k) => tageZwischen(auflage, k.erster) <= 92);
    if (frueh) return { symbol: frueh.symbol, grund: 'erstes Symbol mit Datenbeginn <= 92 Tage nach Auflage' };
  }
  const best = mit.reduce((a, b) => (b.erster < a.erster ? b : a));
  return { symbol: best.symbol, grund: 'kein Symbol innerhalb 92 Tagen nach Auflage - laengste Historie' };
}

/* ---------- Kommandozeile ---------- */

function argumente(argv) {
  const o = {};
  for (let i = 2; i < argv.length; i++) {
    if (argv[i].startsWith('--')) {
      const k = argv[i].slice(2);
      const v = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true;
      o[k] = v;
    }
  }
  return o;
}

/* REGEL.md C6 (Name): Symbole, deren Yahoo-Name nachweislich zu einem ANDEREN Fonds gehoert, stehen mit Grund in
 * symbol-sperre.json ({"SYM": "Grund"}) und gelten als nicht ladbar. Die Datei entsteht nur aus Befunden der Pruefung. */
function symbolSperre() {
  const p = path.join(__dirname, 'symbol-sperre.json');
  return fs.existsSync(p) ? JSON.parse(fs.readFileSync(p, 'utf8')) : {};
}

function rechneFonds(eintrag, ctx) {
  const ergebnis = { id: eintrag.id, name: eintrag.name, gruppe: eintrag.gruppe, art: eintrag.art, auftrag: eintrag.auftrag };
  const kandidaten = [];
  const sperre = ctx.sperre || {};
  for (const s of eintrag.yahoo) {
    if (sperre[s]) { kandidaten.push({ symbol: s, erster: null, fehler: 'gesperrt: ' + sperre[s] }); continue; }
    try {
      const r = leseRohdatei(ctx.roh, s);
      kandidaten.push({ symbol: s, erster: r.tage.length ? r.tage[0].d : null, reihe: r });
    } catch (e) {
      kandidaten.push({ symbol: s, erster: null, fehler: String(e.message || e) });
    }
  }
  ergebnis.kandidaten = kandidaten.map((k) => ({ symbol: k.symbol, erster: k.erster, yahooName: k.reihe ? k.reihe.name : null, waehrung: k.reihe ? k.reihe.waehrung : null, fehler: k.fehler }));
  const wahl = eintrag.yahoo.length === 1 ? (kandidaten[0].erster ? { symbol: kandidaten[0].symbol, grund: 'einziges Symbol' } : null)
    : waehleSymbol(kandidaten, eintrag.auflage);
  if (!wahl) { ergebnis.fehler = 'keine ladbare Reihe'; return ergebnis; }
  const k = kandidaten.find((x) => x.symbol === wahl.symbol);
  ergebnis.symbol = wahl.symbol; ergebnis.symbolGrund = wahl.grund;
  ergebnis.waehrung = k.reihe.waehrung; ergebnis.boerse = k.reihe.boerse;
  const b = bereite(k.reihe, ctx.spy);
  ergebnis.pruefung = b.pruefung;
  ergebnis.datenbeginn = b.pruefung.erster; ergebnis.datenende = b.pruefung.letzter;
  /* gegen SPY in USD */
  const nachUsd = ctx.waehrungUmrechnen(b.tr, k.reihe.waehrung, 'USD');
  const v = vergleiche(nachUsd, ctx.spy, ctx.datenende);
  ergebnis.gegenSPY = Object.assign({}, v); delete ergebnis.gegenSPY._fenster;
  ergebnis.fensterGegenSPY = v._fenster.map((x) => [x.start, Number((x.abstandPa * 100).toFixed(4)), x.vorn ? 1 : 0]);
  ergebnis.urteil = v.urteil.satz;
  if (eintrag.art === 'UCITS' && ctx.sxr8) {
    const nachEur = ctx.waehrungUmrechnen(b.tr, k.reihe.waehrung, 'EUR');
    const w = vergleiche(nachEur, ctx.sxr8, ctx.datenende);
    ergebnis.gegenSXR8 = Object.assign({}, w); delete ergebnis.gegenSXR8._fenster;
    const beide = v.urteil.erfuellt === true && w.urteil.erfuellt === true;
    if (v.urteil.erfuellt === null) ergebnis.urteil = v.urteil.satz;
    else ergebnis.urteil = beide ? 'verlässlich vorn' : 'nicht verlässlich vorn';
  }
  return ergebnis;
}

function kontext(rohOrdner, datenende) {
  const ezb = {};
  for (const w of ['USD', 'GBP', 'CHF']) {
    const f = path.join(rohOrdner, 'EZB-' + w + '.csv');
    if (fs.existsSync(f)) ezb[w] = leseEzb(fs.readFileSync(f, 'utf8'));
  }
  const spyRoh = leseRohdatei(rohOrdner, 'SPY');
  const spy = bereite(spyRoh);
  let sxr8 = null; let sxr8Pruefung = null;
  if (fs.existsSync(path.join(rohOrdner, dateiname('SXR8.DE')))) { const x = bereite(leseRohdatei(rohOrdner, 'SXR8.DE'), spy.tr); sxr8 = x.tr; sxr8Pruefung = x.pruefung; }
  return {
    roh: rohOrdner, datenende: datenende || DATENENDE, ezb, spy: spy.tr, spyPruefung: spy.pruefung, sxr8, sxr8Pruefung, sperre: symbolSperre(),
    waehrungUmrechnen: (reihe, von, nach) => (von === nach ? reihe : umrechnen(reihe, wechselFaktor(von, nach, ezb)))
  };
}

/* Factsheet-Modus: node rechnen.js --roh <ordner> --symbol <S> --stichtag JJJJ-MM-TT [--waehrung USD]
 * gibt die Rendite p. a. ueber 1, 3, 5, 10 Jahre bis zum Stichtag aus (Gesamtertrag dieses Rechners,
 * ohne Datenende-Schnitt), wahlweise in eine andere Waehrung umgerechnet (EZB). */
function factsheetModus(a) {
  const ctx = kontext(a.roh, a.stichtag);
  const roh = leseRohdatei(a.roh, a.symbol);
  const b = bereite(roh, roh.symbol === 'SPY' ? null : ctx.spy);
  const ziel = a.waehrung || roh.waehrung;
  const reihe = ctx.waehrungUmrechnen(b.tr, roh.waehrung, ziel);
  const out = { symbol: a.symbol, waehrungReihe: roh.waehrung, waehrungRechnung: ziel, stichtag: a.stichtag, letzterTag: b.pruefung.letzter };
  for (const n of [1, 3, 5, 10]) out['j' + n] = renditeBisStichtag(reihe, a.stichtag, n);
  console.log(JSON.stringify(out, null, 1));
  return out;
}

function main() {
  const a = argumente(process.argv);
  if (a.roh && a.symbol && a.stichtag) { factsheetModus(a); return; }
  if (!a.roh || !a.gruppe || !a.aus) {
    console.error('Aufruf: node rechnen.js --roh <ordner> --gruppe <g1|g2|g3|g4|g5|alle> --aus <datei.json> [--fonds fonds.json]');
    process.exit(2);
  }
  const liste = JSON.parse(fs.readFileSync(a.fonds || path.join(__dirname, 'fonds.json'), 'utf8')).fonds;
  const ctx = kontext(a.roh, a.datenende);
  const auswahl = liste.filter((f) => a.gruppe === 'alle' || f.lauf === a.gruppe);
  const out = { kennung: KENNUNG, gruppe: a.gruppe, datenende: ctx.datenende, fenster: FENSTER, spyPruefung: ctx.spyPruefung, sxr8Pruefung: ctx.sxr8Pruefung, fonds: [] };
  for (const f of auswahl) {
    let e;
    try { e = rechneFonds(f, ctx); } catch (err) { e = { id: f.id, fehler: String(err.stack || err) }; }
    out.fonds.push(e);
    const g = e.gegenSPY;
    console.log([f.id, e.symbol || '-', e.urteil || e.fehler,
      g && g.A.berechenbar ? 'A ' + (g.A.abstandPa * 100).toFixed(2) : 'A -',
      g && g.B.berechenbar ? 'B ' + (g.B.abstandPa * 100).toFixed(2) : 'B -',
      g && g.rollierend.n ? g.rollierend.vorn + '/' + g.rollierend.n : ''].join(' | '));
  }
  fs.writeFileSync(a.aus, JSON.stringify(out, null, 1));
  console.log('geschrieben: ' + a.aus);
}

module.exports = {
  KENNUNG, FENSTER, DATENENDE, ROLL_MONATE, SCHWELLE_ANTEIL, RAND_TOLERANZ_TAGE, SPRUNG,
  lokalesDatum, tageZwischen, monatPlus, letzterKalendertag, vorTag,
  leseYahoo, leseRohdatei, leseEzb, dateiname,
  sprungpaare, grosseBewegungen, marktRendite, brueche, eingefroren, BRUCH, ordneZu, ausschuettungen, gesamtertrag, ausAdj, umrechnen, wechselFaktor,
  wertBis, wertVor, fensterRendite, jahreNominal, pa, fensterVergleich,
  monatsEnden, rollierend, rueckschlag, relativ, rueckschlagRelativ, gesamtVergleich, urteil, vergleiche,
  bereite, luecken, waehleSymbol, rechneFonds, kontext, jahreZurueck, renditeBisStichtag, factsheetModus
};

if (require.main === module) main();
