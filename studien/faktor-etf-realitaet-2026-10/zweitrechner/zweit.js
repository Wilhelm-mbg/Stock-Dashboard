'use strict';
/* Zweiter Rechner (REGEL.md Teil C10) der Studie faktor-etf-realitaet-2026-10/v1.
 *
 * Eigener Code, geschrieben nur aus REGEL.md (Teil A, C1-C7) und fonds.json; rechnen.js und die
 * Ergebnisse des Hauptrechners wurden nicht angesehen. Eigene Rohdaten in einem Ordner AUSSERHALB
 * des Repos (Standard: ../../../../rohdaten-zweit, ueberschreibbar mit --roh <ordner>).
 *
 * Aufruf:
 *   node zweit.js laden  [--roh <ordner>]                 Rohdaten von Yahoo und der EZB laden
 *   node zweit.js rechnen [--roh <ordner>] [--stand <t>]   rechnen, ergebnis-zweit.json schreiben
 *
 * Gerechnet: SPY (Fenster A und B), SPMO, SCHD und der erste UCITS-Fonds der Gruppe
 * Gleichgewicht aus fonds.json (C6: Symbolwahl nach Datenbeginn, Umrechnung EUR->USD mit dem
 * EZB-Referenzkurs, letzter Kurs <= Handelstag) jeweils gegen SPY.
 * Nur eingebaute Module, Node 24. Beschreibende Zahlen, keine Anlageberatung. */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const HIER = __dirname;
const STUDIE = path.resolve(HIER, '..');
const DATENENDE = '2026-09-15';
const LETZTER_ENDMONAT = '2026-08';
const FENSTER = {
  A: { S: '2017-01-04', E: '2021-09-15' },
  B: { S: '2021-09-16', E: '2026-09-15' }
};
const LUECKE_TAGE = 10;      // C3/C4: mehr als 10 Kalendertage vor dem Sollrand -> nicht berechenbar
const C6_TAGE = 92;          // C6: Datenbeginn hoechstens 92 Tage nach Auflage
const EICHUNG_SPY = { A: 1.1581, B: 0.812 }; // C7.6

function arg(name, vorgabe) {
  const i = process.argv.indexOf(name);
  return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : vorgabe;
}
const ROH2 = path.resolve(arg('--roh', path.resolve(HIER, '../../../../rohdaten-zweit')));

// ---------------------------------------------------------------- Datum
function tagNr(d) { // 'YYYY-MM-DD' -> Tage seit 1970-01-01
  return Math.round(Date.UTC(+d.slice(0, 4), +d.slice(5, 7) - 1, +d.slice(8, 10)) / 86400000);
}
function nrTag(n) { return new Date(n * 86400000).toISOString().slice(0, 10); }
function tage(a, b) { return tagNr(b) - tagNr(a); } // b - a in Kalendertagen
function monatsLetzter(ym) { // 'YYYY-MM' -> letzter Kalendertag
  const y = +ym.slice(0, 4); const m = +ym.slice(5, 7);
  return nrTag(Math.round(Date.UTC(y, m, 0) / 86400000));
}
function monatPlus(ym, k) {
  const y = +ym.slice(0, 4); const m = +ym.slice(5, 7) - 1 + k;
  const yy = y + Math.floor(m / 12); const mm = ((m % 12) + 12) % 12 + 1;
  return yy + '-' + String(mm).padStart(2, '0');
}
function datumInZone(ts, zone) {
  const f = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' });
  const t = {};
  for (const p of f.formatToParts(new Date(ts * 1000))) t[p.type] = p.value;
  return t.year + '-' + t.month + '-' + t.day;
}

// ---------------------------------------------------------------- Laden
function dateiName(sym) { return 'yahoo_' + sym.replace(/[^A-Za-z0-9._-]/g, '_') + '.json'; }
function warte(ms) { return new Promise(function (ok) { setTimeout(ok, ms); }); }

async function holeYahoo(sym) {
  const jetzt = Math.floor(Date.now() / 1000);
  const wirte = ['query1', 'query2'];
  let letzterFehler = '';
  for (let v = 0; v < 10; v++) {
    const wirt = wirte[v % 2];
    const url = 'https://' + wirt + '.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
      '?period1=0&period2=' + jetzt + '&interval=1d&events=div,splits,capitalGains&includeAdjustedClose=true';
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buf = Buffer.from(await r.arrayBuffer());
      if (r.status === 200) {
        let j = null;
        try { j = JSON.parse(buf.toString('utf8')); } catch (e) { j = null; }
        const res = j && j.chart && j.chart.result && j.chart.result[0];
        if (res && Array.isArray(res.timestamp) && res.timestamp.length > 0) {
          return { ok: true, buf: buf, url: url, status: r.status, versuche: v + 1 };
        }
        letzterFehler = 'HTTP 200 ohne Kerzen';
      } else if (r.status === 404) {
        letzterFehler = 'HTTP 404: ' + buf.toString('utf8').slice(0, 200);
        if (v >= 3) return { ok: false, fehler: letzterFehler, url: url };
      } else {
        letzterFehler = 'HTTP ' + r.status;
      }
    } catch (e) {
      letzterFehler = 'Netz: ' + e.message;
    }
    await warte(3000 + 2000 * v);
  }
  return { ok: false, fehler: letzterFehler };
}

async function holeEzb(waehrung) {
  const url = 'https://data-api.ecb.europa.eu/service/data/EXR/D.' + waehrung + '.EUR.SP00.A?format=csvdata';
  for (let v = 0; v < 6; v++) {
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
      const buf = Buffer.from(await r.arrayBuffer());
      if (r.status === 200 && buf.length > 1000) return { ok: true, buf: buf, url: url };
    } catch (e) { /* wiederholen */ }
    await warte(3000 + 2000 * v);
  }
  return { ok: false, url: url };
}

function ucitsFonds(fonds) {
  return fonds.fonds.find(function (f) { return f.art === 'UCITS' && f.gruppe === 'Gleichgewicht'; }) ||
    fonds.fonds.find(function (f) { return f.art === 'UCITS'; });
}

/* Nachtrag des Projektleiters (05.10.2026): zusaetzlich jeder Fonds, der nach dem vorlaeufigen Stand des Hauptrechners
 * „verlaesslich vorn" ist (REGEL C10), die UCITS davon auch gegen SXR8.DE in EUR. */
const ZUSATZ_US = ['QQQ', 'IVW', 'SCHG', 'MGK'];
const ZUSATZ_UCITS = ['SXRV', 'EXXT', 'EQQQ', 'LYMS', '6AQQ'];
const SXR8 = 'SXR8.DE';

function fondsNachId(fonds, id) {
  const f = fonds.fonds.find(function (x) { return x.id === id; });
  if (!f) throw new Error('Fonds ' + id + ' fehlt in fonds.json');
  return f;
}

async function laden() {
  fs.mkdirSync(ROH2, { recursive: true });
  const fonds = JSON.parse(fs.readFileSync(path.join(STUDIE, 'fonds.json'), 'utf8'));
  const zusatz = process.argv.indexOf('--zusatz') > 0;
  let symbole; let waehrungen;
  if (zusatz) {
    symbole = ZUSATZ_US.concat([SXR8]);
    for (const id of ZUSATZ_UCITS) symbole = symbole.concat(fondsNachId(fonds, id).yahoo);
    waehrungen = ['GBP', 'CHF'];
  } else {
    symbole = ['SPY', 'SPMO', 'SCHD', '^SP500TR'].concat(ucitsFonds(fonds).yahoo);
    waehrungen = ['USD'];
  }
  // vorhandene Rohdaten werden nie ueberschrieben; das Protokoll wird ergaenzt
  let protokoll = {};
  try { protokoll = JSON.parse(fs.readFileSync(path.join(ROH2, 'abrufprotokoll.json'), 'utf8')); } catch (e) { protokoll = {}; }
  for (const s of symbole) {
    if (fs.existsSync(path.join(ROH2, dateiName(s)))) { console.log(s, 'vorhanden, nicht neu geladen'); continue; }
    const r = await holeYahoo(s);
    if (r.ok) {
      fs.writeFileSync(path.join(ROH2, dateiName(s)), r.buf);
      protokoll[s] = { datei: dateiName(s), url: r.url, bytes: r.buf.length, versuche: r.versuche,
        sha256: crypto.createHash('sha256').update(r.buf).digest('hex'), abruf: new Date().toISOString() };
    } else {
      protokoll[s] = { fehler: r.fehler, url: r.url || null, abruf: new Date().toISOString() };
    }
    console.log(s, JSON.stringify(protokoll[s]));
    await warte(1500);
  }
  for (const w of waehrungen) {
    const name = 'ezb_' + w + '_EUR.csv';
    if (fs.existsSync(path.join(ROH2, name))) { console.log('EZB-' + w, 'vorhanden, nicht neu geladen'); continue; }
    const r = await holeEzb(w);
    if (r.ok) {
      fs.writeFileSync(path.join(ROH2, name), r.buf);
      protokoll['EZB-' + w] = { datei: name, url: r.url, bytes: r.buf.length,
        sha256: crypto.createHash('sha256').update(r.buf).digest('hex'), abruf: new Date().toISOString() };
    } else {
      protokoll['EZB-' + w] = { fehler: 'nicht ladbar', url: r.url };
    }
    console.log('EZB-' + w, JSON.stringify(protokoll['EZB-' + w]));
  }
  fs.writeFileSync(path.join(ROH2, 'abrufprotokoll.json'), JSON.stringify(protokoll, null, 1));
}

// ---------------------------------------------------------------- Lesen
function sha256(buf) { return crypto.createHash('sha256').update(buf).digest('hex'); }

function csvZeilen(text) { // einfacher CSV-Leser mit Anfuehrungszeichen
  const zeilen = []; let feld = ''; let zeile = []; let inQ = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQ) {
      if (ch === '"') { if (text[i + 1] === '"') { feld += '"'; i++; } else inQ = false; } else feld += ch;
    } else if (ch === '"') inQ = true;
    else if (ch === ',') { zeile.push(feld); feld = ''; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      zeile.push(feld); feld = '';
      if (zeile.length > 1 || zeile[0] !== '') zeilen.push(zeile);
      zeile = [];
    } else feld += ch;
  }
  if (feld !== '' || zeile.length) { zeile.push(feld); zeilen.push(zeile); }
  return zeilen;
}

function leseEzb(waehrung) {
  const datei = path.join(ROH2, 'ezb_' + waehrung + '_EUR.csv');
  const buf = fs.readFileSync(datei);
  const z = csvZeilen(buf.toString('utf8'));
  const kopf = z[0];
  const iT = kopf.indexOf('TIME_PERIOD'); const iV = kopf.indexOf('OBS_VALUE');
  if (iT < 0 || iV < 0) throw new Error('EZB-Kopf unbekannt: ' + kopf.join('|'));
  const reihe = []; let leer = 0; const doppelt = [];
  const gesehen = new Set();
  for (let k = 1; k < z.length; k++) {
    const d = z[k][iT]; const v = parseFloat(z[k][iV]);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(d || '')) continue;
    if (!(v > 0)) { leer++; continue; }
    if (gesehen.has(d)) { doppelt.push(d); continue; }
    gesehen.add(d);
    reihe.push({ d: d, v: v });
  }
  reihe.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  return { reihe: reihe, sha256: sha256(buf), leer: leer, doppelt: doppelt, bytes: buf.length };
}

/* Liest eine Yahoo-Rohantwort und baut die bereinigte Tagesreihe bis DATENENDE.
 * Rueckgabe: Zeilen {d, ts, c, adj}, Ausschuettungen (gebucht), Pruefprotokoll. */
function leseYahoo(sym) {
  const datei = path.join(ROH2, dateiName(sym));
  if (!fs.existsSync(datei)) return null;
  const buf = fs.readFileSync(datei);
  const j = JSON.parse(buf.toString('utf8'));
  const res = j.chart.result[0];
  const meta = res.meta;
  const zone = meta.exchangeTimezoneName;
  const q = res.indicators.quote[0];
  const adjA = res.indicators.adjclose && res.indicators.adjclose[0] ? res.indicators.adjclose[0].adjclose : [];
  const proto = { nullKurse: [], nullKurseAnzahl: 0, doppelteTage: [], sprungpaare: [], bewegungenUeber10: [],
    luecken7: [], verschobeneAusschuettungen: [], ausserhalb: [], kapitalgewinneDoppelt: [], splits: [],
    stillstand: 0, stillstandMonatsende: [] };
  // 1) Kerzen -> Zeilen, Kalenderdatum in der Zeitzone der Boerse
  const roh = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    const ts = res.timestamp[i];
    const c = q.close[i];
    const d = datumInZone(ts, zone);
    if (c === null || c === undefined || !(c > 0) || !isFinite(c)) {
      proto.nullKurseAnzahl++;
      if (proto.nullKurse.length < 40) proto.nullKurse.push(d);
      continue;
    }
    roh.push({ d: d, ts: ts, c: c, adj: (adjA && adjA[i] > 0) ? adjA[i] : null, vol: q.volume ? q.volume[i] : null });
  }
  roh.sort(function (a, b) { return a.ts - b.ts; });
  // 2) doppelte Kalendertage: die Kerze mit dem spaeteren Stempel bleibt
  const zeilenAlle = [];
  for (const z of roh) {
    const l = zeilenAlle[zeilenAlle.length - 1];
    if (l && l.d === z.d) { proto.doppelteTage.push({ d: z.d, alt: l.c, neu: z.c }); zeilenAlle[zeilenAlle.length - 1] = z; }
    else zeilenAlle.push(z);
  }
  const ersterRoh = zeilenAlle.length ? zeilenAlle[0].d : null;
  const letzterRoh = zeilenAlle.length ? zeilenAlle[zeilenAlle.length - 1].d : null;
  const tageRoh = zeilenAlle.length;
  // 3) Datenende
  let zeilen = zeilenAlle.filter(function (z) { return z.d <= DATENENDE; });
  // 3b) Lesart K1b (Nachtrag 05.10.2026): verdorbenen Reihenanfang verwerfen
  const k1 = k1b(zeilen);
  if (k1) zeilen = zeilen.slice(k1.verworfenTage);
  // 4) Sprungpaare C7.1 (wiederholt, bis keins mehr gefunden wird)
  let gefunden = true;
  while (gefunden) {
    gefunden = false;
    for (let i = 1; i + 1 < zeilen.length; i++) {
      const r1 = zeilen[i].c / zeilen[i - 1].c - 1;
      const r2 = zeilen[i + 1].c / zeilen[i].c - 1;
      const p = (1 + r1) * (1 + r2);
      if (Math.abs(r1) > 0.15 && Math.abs(r2) > 0.10 && Math.sign(r1) === -Math.sign(r2) && p >= 0.97 && p <= 1.03) {
        proto.sprungpaare.push({ d: zeilen[i].d, vortag: zeilen[i - 1].c, kurs: zeilen[i].c, folgetag: zeilen[i + 1].c, r1: r1, r2: r2 });
        zeilen.splice(i, 1);
        gefunden = true;
        break;
      }
    }
  }
  // 5) Ereignisse
  const ev = res.events || {};
  const divs = Object.values(ev.dividends || {}).map(function (e) { return { d: datumInZone(e.date, zone), betrag: e.amount, art: 'div' }; });
  const kg = Object.values(ev.capitalGains || {}).map(function (e) { return { d: datumInZone(e.date, zone), betrag: e.amount, art: 'kg' }; });
  for (const s of Object.values(ev.splits || {})) proto.splits.push({ d: datumInZone(s.date, zone), verhaeltnis: s.splitRatio || (s.numerator + ':' + s.denominator) });
  const ereignisse = divs.slice();
  for (const k of kg) {
    if (divs.some(function (x) { return x.d === k.d && Math.abs(x.betrag - k.betrag) < 1e-9; })) proto.kapitalgewinneDoppelt.push(k);
    else ereignisse.push(k);
  }
  ereignisse.sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : 0; });
  // 6) Buchung am ersten Handelstag mit Datum >= Ereignisdatum
  const D = new Array(zeilen.length).fill(0);
  const gebucht = [];
  const erster = zeilen.length ? zeilen[0].d : null;
  for (const e of ereignisse) {
    if (e.d > DATENENDE) { proto.ausserhalb.push(Object.assign({ grund: 'nach Datenende' }, e)); continue; }
    if (erster === null || e.d < erster) { proto.ausserhalb.push(Object.assign({ grund: 'vor Reihenbeginn' }, e)); continue; }
    const i = ersterAbIndex(zeilen, e.d);
    if (i < 0) { proto.ausserhalb.push(Object.assign({ grund: 'kein Handelstag >= Datum bis Datenende' }, e)); continue; }
    if (zeilen[i].d !== e.d) proto.verschobeneAusschuettungen.push({ ereignis: e.d, gebucht: zeilen[i].d, betrag: e.betrag, art: e.art });
    D[i] += e.betrag;
    const vortag = i > 0 ? zeilen[i - 1].c : null;
    gebucht.push({ d: zeilen[i].d, ereignis: e.d, betrag: e.betrag, art: e.art, quote: vortag ? e.betrag / vortag : null });
  }
  // 7) Gesamtertrag C2
  const TR = new Array(zeilen.length);
  for (let i = 0; i < zeilen.length; i++) {
    TR[i] = i === 0 ? 1 : TR[i - 1] * (zeilen[i].c + D[i]) / zeilen[i - 1].c;
    zeilen[i].tr = TR[i];
    zeilen[i].D = D[i];
  }
  // 8) Pruefungen C7.2/C7.3
  for (let i = 1; i < zeilen.length; i++) {
    const r = zeilen[i].c / zeilen[i - 1].c - 1;
    if (Math.abs(r) > 0.10) proto.bewegungenUeber10.push({ d: zeilen[i].d, r: r, vortag: zeilen[i - 1].d });
    const g = tage(zeilen[i - 1].d, zeilen[i].d);
    if (g > 7) proto.luecken7.push({ von: zeilen[i - 1].d, bis: zeilen[i].d, tage: g });
    if (zeilen[i].vol === 0 && zeilen[i].c === zeilen[i - 1].c) {
      proto.stillstand++;
      const monatsletzter = i + 1 === zeilen.length || zeilen[i + 1].d.slice(0, 7) !== zeilen[i].d.slice(0, 7);
      if (monatsletzter) proto.stillstandMonatsende.push(zeilen[i].d);
    }
  }
  const jeJahr = {};
  for (const g of gebucht) { const y = g.d.slice(0, 4); jeJahr[y] = (jeJahr[y] || 0) + 1; }
  const quoten = gebucht.map(function (g) { return g.quote; }).filter(function (x) { return x !== null; });
  return {
    sym: sym, meta: meta, zone: zone, waehrung: meta.currency,
    name: meta.longName || meta.shortName || null,
    sha256: sha256(buf), bytes: buf.length,
    ersterRoh: ersterRoh, letzterRoh: letzterRoh, tageRoh: tageRoh,
    divRoh: divs.length, kgRoh: kg.length,
    zeilen: zeilen, gebucht: gebucht, jeJahr: jeJahr,
    quoteMin: quoten.length ? Math.min.apply(null, quoten) : null,
    quoteMax: quoten.length ? Math.max.apply(null, quoten) : null,
    quotenAusserhalb: gebucht.filter(function (g) { return g.quote !== null && (g.quote < 0.0005 || g.quote > 0.03); }),
    proto: proto, k1b: k1
  };
}

/* SPY-Schlusskurse (Kursbewegung ohne Ausschuettung) als Marktmass fuer K1b; einmal gelesen. */
let SPY_KURSE = null;
function spyKurse() {
  if (SPY_KURSE) return SPY_KURSE;
  const res = JSON.parse(fs.readFileSync(path.join(ROH2, dateiName('SPY')), 'utf8')).chart.result[0];
  const zone = res.meta.exchangeTimezoneName; const q = res.indicators.quote[0];
  SPY_KURSE = [];
  for (let i = 0; i < res.timestamp.length; i++) {
    const c = q.close[i];
    if (c !== null && c > 0) SPY_KURSE.push({ d: datumInZone(res.timestamp[i], zone), c: c });
  }
  return SPY_KURSE;
}

/* Lesart K1b – Regel des Hauptrechners, vom Projektleiter am 05.10.2026 mitgeteilt und hier als BENANNTE Lesart
 * uebernommen (damit SXR8.DE vergleichbar ist): ein Reihenanfang wird nur verworfen, wenn in den ersten 730 Kalendertagen
 * ein ungedeckter Sprung > 10 % auf >= 5 gleiche Schlusskurse folgt (Beispiel des Projektleiters: SXR8.DE bis 01.11.2010).
 * Eigene Ausformung, ohne den Code des Hauptrechners zu kennen:
 *   - "gleiche": ununterbrochene Folge identischer Schlusskurse unmittelbar vor dem Sprungtag, mindestens 5;
 *   - "Sprung": |Schluss(t) / Schluss(t-1) - 1| > 10 %, Sprungtag innerhalb von 730 Tagen ab dem ersten Kurs;
 *   - "ungedeckt": |(1 + Sprung) / (1 + SPY-Kursbewegung vom ersten gleichen Tag bis zum Sprungtag) - 1| > 10 %;
 *   - verworfen wird alles VOR dem Sprungtag; der Sprungtag ist der erste Tag der Reihe; bei mehreren Treffern der letzte. */
function k1b(zeilen) {
  if (zeilen.length < 6) return null;
  const grenze = nrTag(tagNr(zeilen[0].d) + 730);
  const spy = spyKurse();
  let treffer = null;
  for (let i = 5; i < zeilen.length && zeilen[i].d <= grenze; i++) {
    const sprung = zeilen[i].c / zeilen[i - 1].c - 1;
    if (Math.abs(sprung) <= 0.10) continue;
    let k = i - 1;
    while (k > 0 && zeilen[k - 1].c === zeilen[i - 1].c) k--;
    const gleiche = i - k;
    if (gleiche < 5) continue;
    const s0 = letzterBisIndex(spy, zeilen[k].d); const s1 = letzterBisIndex(spy, zeilen[i].d);
    const markt = (s0 >= 0 && s1 >= 0) ? spy[s1].c / spy[s0].c - 1 : 0;
    if (Math.abs((1 + sprung) / (1 + markt) - 1) <= 0.10) continue;
    treffer = { sprungTag: zeilen[i].d, sprung: sprung, gleicheSchluesse: gleiche, gleichVon: zeilen[k].d, gleichBis: zeilen[i - 1].d,
      spyBewegung: markt, verworfenTage: i, verworfenVon: zeilen[0].d, verworfenBis: zeilen[i - 1].d, neuerBeginn: zeilen[i].d };
  }
  return treffer;
}

// ---------------------------------------------------------------- Suche in sortierten Reihen
function letzterBisIndex(reihe, d) { // letzter Index mit reihe[i].d <= d, sonst -1
  let lo = 0; let hi = reihe.length - 1; let a = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (reihe[m].d <= d) { a = m; lo = m + 1; } else hi = m - 1; }
  return a;
}
function letzterVorIndex(reihe, d) { // letzter Index mit reihe[i].d < d
  let lo = 0; let hi = reihe.length - 1; let a = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (reihe[m].d < d) { a = m; lo = m + 1; } else hi = m - 1; }
  return a;
}
function ersterAbIndex(reihe, d) { // erster Index mit reihe[i].d >= d
  let lo = 0; let hi = reihe.length - 1; let a = -1;
  while (lo <= hi) { const m = (lo + hi) >> 1; if (reihe[m].d >= d) { a = m; hi = m - 1; } else lo = m + 1; }
  return a;
}

/* Wertreihe in USD: {d, w} je Handelstag der Reihe. Fuer EUR-Reihen: Gesamtertrag x EZB-Kurs
 * (USD je EUR, letzter Kurs <= Handelstag). Tage ohne EZB-Kurs davor fallen weg. */
function wertreiheUsd(r, ezb) {
  if (r.waehrung === 'USD') return r.zeilen.map(function (z) { return { d: z.d, w: z.tr, adj: z.adj, c: z.c }; });
  if (r.waehrung !== 'EUR') throw new Error('Waehrung ' + r.waehrung + ' nicht vorgesehen (' + r.sym + ')');
  const aus = [];
  for (const z of r.zeilen) {
    const k = letzterBisIndex(ezb, z.d);
    if (k < 0) continue;
    aus.push({ d: z.d, w: z.tr * ezb[k].v, adj: z.adj === null ? null : z.adj * ezb[k].v, c: z.c * ezb[k].v, fx: ezb[k].v, fxTag: ezb[k].d });
  }
  return aus;
}

/* Nachtrag: Wertreihe in Zielwaehrung 'USD' oder 'EUR' fuer Reihen in EUR, USD, GBP, GBp (Pence) oder CHF.
 * ezb = {USD, GBP, CHF}: EZB-Referenzkurse Waehrung je EUR; je Handelstag der letzte Kurs <= Tag.
 * Fuer EUR->USD und USD->USD identisch mit wertreiheUsd. Tage ohne Kurs davor fallen weg. */
function wertreihe(r, ziel, ezb) {
  const aus = [];
  for (const z of r.zeilen) {
    let fEur = 1;
    if (r.waehrung !== 'EUR') {
      const code = r.waehrung === 'GBp' ? 'GBP' : r.waehrung;
      if (!ezb[code]) throw new Error('Waehrung ' + r.waehrung + ' nicht vorgesehen (' + r.sym + ')');
      const k = letzterBisIndex(ezb[code], z.d);
      if (k < 0) continue;
      fEur = 1 / ezb[code][k].v / (r.waehrung === 'GBp' ? 100 : 1);
    }
    let f;
    if (ziel === 'EUR') f = fEur;
    else if (r.waehrung === 'USD') f = 1;
    else {
      const u = letzterBisIndex(ezb.USD, z.d);
      if (u < 0) continue;
      f = fEur * ezb.USD[u].v;
    }
    aus.push({ d: z.d, w: z.tr * f, adj: z.adj === null ? null : z.adj * f, c: z.c * f });
  }
  return aus;
}

// ---------------------------------------------------------------- Fenster A/B (C3)
function fensterRendite(reihe, S, E, feld) {
  const f = feld || 'w';
  const i = letzterVorIndex(reihe, S);
  const k = letzterBisIndex(reihe, E);
  if (i < 0 || k < 0) return { berechenbar: false, grund: 'kein Handelstag vor Start oder bis Ende' };
  const lueckeStart = tage(reihe[i].d, S);   // Sollrand = S (Lesart)
  const lueckeEnde = tage(reihe[k].d, E);
  if (lueckeStart > LUECKE_TAGE || lueckeEnde > LUECKE_TAGE) {
    return { berechenbar: false, grund: 'Luecke am Rand', startTag: reihe[i].d, endTag: reihe[k].d };
  }
  if (reihe[i][f] === null || reihe[k][f] === null) return { berechenbar: false, grund: 'Wert fehlt' };
  return { berechenbar: true, r: reihe[k][f] / reihe[i][f] - 1, startTag: reihe[i].d, endTag: reihe[k].d,
    startWert: reihe[i][f], endWert: reihe[k][f] };
}
function nominalJahre(name) { // C3: Tage von "Schluss vor S" (= S - 1 Tag, nominal) bis E, / 365,25
  const f = FENSTER[name];
  return tage(nrTag(tagNr(f.S) - 1), f.E) / 365.25;
}
function pa(r, jahre) { return Math.pow(1 + r, 1 / jahre) - 1; }

// ---------------------------------------------------------------- Rollierende Fenster (C4)
function monatsendWert(reihe, ym) {
  const kal = monatsLetzter(ym);
  const k = letzterBisIndex(reihe, kal);
  if (k < 0) return { luecke: true, grund: 'kein Kurs' };
  const g = tage(reihe[k].d, kal);
  if (g > LUECKE_TAGE) return { luecke: true, grund: 'Monatsende ' + reihe[k].d + ' liegt ' + g + ' Tage vor ' + kal, d: reihe[k].d };
  return { luecke: false, d: reihe[k].d, w: reihe[k].w };
}
function median(a) {
  const s = a.slice().sort(function (x, y) { return x - y; });
  const n = s.length; if (!n) return null;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
function rollierend(fonds, spy) {
  const ersterStart = (fonds[0].d > spy[0].d ? fonds[0].d : spy[0].d).slice(0, 7);
  const letzterStart = monatPlus(LETZTER_ENDMONAT, -60);
  const liste = []; const fehlend = [];
  for (let m = ersterStart; m <= letzterStart; m = monatPlus(m, 1)) {
    const e = monatPlus(m, 60);
    const fs0 = monatsendWert(fonds, m); const fs1 = monatsendWert(fonds, e);
    const ss0 = monatsendWert(spy, m); const ss1 = monatsendWert(spy, e);
    const l = [fs0, fs1, ss0, ss1].find(function (x) { return x.luecke; });
    if (l) { fehlend.push({ start: m, grund: l.grund }); continue; }
    const rF = fs1.w / fs0.w - 1; const rS = ss1.w / ss0.w - 1;
    const ab = Math.pow(1 + rF, 1 / 5) - Math.pow(1 + rS, 1 / 5);
    liste.push({ start: m, ende: e, startTagFonds: fs0.d, endTagFonds: fs1.d, startTagSpy: ss0.d, endTagSpy: ss1.d,
      rFonds: rF, rSpy: rS, abstand: ab, vorn: rF > rS });
  }
  const n = liste.length;
  const vorn = liste.filter(function (x) { return x.vorn; }).length;
  let schl = null; let best = null;
  for (const x of liste) {
    if (schl === null || x.abstand < schl.abstand) schl = x;
    if (best === null || x.abstand > best.abstand) best = x;
  }
  const unabh = [];
  for (let i = 0; i < liste.length; i++) {
    if (monatPlus(ersterStart, 60 * unabh.length) === liste[i].start) unabh.push({ start: liste[i].start, abstand: liste[i].abstand, vorn: liste[i].vorn });
  }
  return {
    n: n, vorn: vorn, anteil: n ? vorn / n : null, median: median(liste.map(function (x) { return x.abstand; })),
    schlechtester: schl ? schl.abstand : null, schlechtesterStart: schl ? schl.start : null,
    bester: best ? best.abstand : null, besterStart: best ? best.start : null,
    erstesFenster: n ? liste[0].start : null, letztesFenster: n ? liste[n - 1].start : null,
    ersterSollStartmonat: ersterStart, letzterSollStartmonat: letzterStart,
    fehlend: fehlend.length, fehlendListe: fehlend,
    nichtUeberlappend: unabh, fenster: liste
  };
}

// ---------------------------------------------------------------- Rueckschlag (C5)
function tiefsterFall(reihe) { // reihe: [{d, v}]
  let spitze = null; let best = { tiefe: 0, spitze: null, tal: null };
  for (const p of reihe) {
    if (spitze === null || p.v > spitze.v) spitze = p;
    const dd = p.v / spitze.v - 1;
    if (dd < best.tiefe) best = { tiefe: dd, spitze: spitze.d, tal: p.d };
  }
  return best;
}
function rueckschlag(fonds, spy) {
  const rel = []; const eigen = [];
  let erster = null;
  for (const z of fonds) {
    if (z.d > DATENENDE) break;
    const k = letzterBisIndex(spy, z.d);
    if (k < 0) continue;
    if (erster === null) erster = z.d;
    rel.push({ d: z.d, v: z.w / spy[k].w });
    eigen.push({ d: z.d, v: z.w });
  }
  const spyEigen = spy.filter(function (z) { return z.d >= erster && z.d <= DATENENDE; }).map(function (z) { return { d: z.d, v: z.w }; });
  const r = tiefsterFall(rel);
  return { tiefe: r.tiefe, spitze: r.spitze, tal: r.tal, ersterGemeinsamerTag: erster, tage: rel.length,
    nachrichtlich: { fonds: tiefsterFall(eigen), spy: tiefsterFall(spyEigen) } };
}

// ---------------------------------------------------------------- Urteil (A1)
function urteil(A, B, roll) {
  if (!A.berechenbar || !B.berechenbar) return 'nicht beurteilbar (zu jung)';
  if (roll.n > 0 && roll.anteil >= 0.8 && A.vorn && B.vorn) return 'verlässlich vorn';
  return 'nicht verlässlich vorn';
}

// ---------------------------------------------------------------- Rechnen
function quelleKurz(r) {
  return { sha256: r.sha256, bytes: r.bytes, erster: r.ersterRoh, letzter: r.letzterRoh, tage: r.tageRoh,
    tageBisDatenende: r.zeilen.length, ausschuettungen: r.divRoh, kapitalgewinne: r.kgRoh,
    ausschuettungenGebucht: r.gebucht.length, splits: r.proto.splits, waehrung: r.waehrung, zeitzone: r.zone, name: r.name,
    boerse: r.meta.fullExchangeName || r.meta.exchangeName || null, ersterHandelstagMeta: r.meta.firstTradeDate ? datumInZone(r.meta.firstTradeDate, r.zone) : null };
}
function pruefKurz(r) {
  return { nullKurse: r.proto.nullKurseAnzahl, nullKurseBeispiele: r.proto.nullKurse, doppelteTage: r.proto.doppelteTage,
    sprungpaareEntfernt: r.proto.sprungpaare, bewegungenUeber10: r.proto.bewegungenUeber10, lueckenUeber7: r.proto.luecken7,
    ausschuettungenJeJahr: r.jeJahr, verschobeneAusschuettungen: r.proto.verschobeneAusschuettungen,
    ausserhalbDerReihe: r.proto.ausserhalb, kapitalgewinneAlsDoppelGezaehlt: r.proto.kapitalgewinneDoppelt,
    quoteMin: r.quoteMin, quoteMax: r.quoteMax, quotenAusserhalb005bis3Prozent: r.quotenAusserhalb,
    stillstandskurse: r.proto.stillstand, stillstandAmMonatsende: r.proto.stillstandMonatsende };
}

/* label: Name des Massstabs in der Ausgabe ('spy' fuer SPY in USD, 'sxr8' fuer SXR8.DE in EUR). */
function rechneFonds(id, r, reiheUsd, spyUsd, spyAB, zusatz, label) {
  const lb = label || 'spy';
  const out = { id: id, symbol: r.sym };
  for (const name of ['A', 'B']) {
    const f = FENSTER[name];
    const fr = fensterRendite(reiheUsd, f.S, f.E);
    const L = nominalJahre(name);
    if (!fr.berechenbar) { out[name] = { berechenbar: false, grund: fr.grund, [lb]: spyAB[name].r }; continue; }
    const pF = pa(fr.r, L); const pS = spyAB[name].pa;
    const frAdj = fensterRendite(reiheUsd, f.S, f.E, 'adj');
    out[name] = { berechenbar: true, fonds: fr.r, [lb]: spyAB[name].r, fondsPa: pF, [lb + 'Pa']: pS,
      abstandPa: pF - pS, abstandPaPp: (pF - pS) * 100, vorn: fr.r > spyAB[name].r,
      startTag: fr.startTag, endTag: fr.endTag, jahre: L,
      kontrolleAdjclose: frAdj.berechenbar ? { fonds: frAdj.r, fondsPa: pa(frAdj.r, L), differenzPp: (pa(frAdj.r, L) - pF) * 100 } : null };
  }
  const roll = rollierend(reiheUsd, spyUsd);
  out.rollierend = {
    n: roll.n, vorn: roll.vorn, anteil: roll.anteil, median: roll.median, schlechtester: roll.schlechtester,
    schlechtesterStart: roll.schlechtesterStart, bester: roll.bester, besterStart: roll.besterStart,
    erstesFenster: roll.erstesFenster, letztesFenster: roll.letztesFenster, fehlend: roll.fehlend,
    medianPp: roll.median * 100, schlechtesterPp: roll.schlechtester * 100, besterPp: roll.bester * 100,
    fehlendListe: roll.fehlendListe, nichtUeberlappend: roll.nichtUeberlappend
  };
  const rs = rueckschlag(reiheUsd, spyUsd);
  out.rueckschlag = { tiefe: rs.tiefe, spitze: rs.spitze, tal: rs.tal, ersterGemeinsamerTag: rs.ersterGemeinsamerTag,
    nachrichtlich: { fonds: rs.nachrichtlich.fonds, [lb]: rs.nachrichtlich.spy } };
  out.urteil = urteil(out.A, out.B, roll);
  if (zusatz) Object.assign(out, zusatz);
  out._fenster = roll.fenster;
  return out;
}

// ---------------------------------------------------------------- Nachtrag 05.10.2026 (Auftrag des Projektleiters)
/* C6-Namenspruefung je Fonds auf „longName | shortName" der Yahoo-Metadaten (Kuerzel koennen an verschiedenen Boersen
 * verschiedenen Fonds gehoeren). Zwei iShares- und zwei Amundi-Fonds auf den Nasdaq-100 werden ueber „(DE)" bzw. „Core"
 * auseinandergehalten. */
const NAMENSPRUEFUNG = {
  SXRV: function (n) { return /nasdaq/i.test(n) && /ishare|ishs/i.test(n) && !/\(DE\)|ETF DEI/i.test(n); },
  EXXT: function (n) { return /nasdaq/i.test(n) && /ishare/i.test(n) && /\(DE\)|ETF DEI/i.test(n); },
  EQQQ: function (n) { return /nasdaq/i.test(n) && /invesco|eqqq/i.test(n); },
  LYMS: function (n) { return /nasd/i.test(n) && /amundi|lyxor/i.test(n) && /core/i.test(n); },
  '6AQQ': function (n) { return /nasdaq/i.test(n) && /amundi|lyxor/i.test(n) && !/core/i.test(n); },
  SXR8: function (n) { return /s&p 500/i.test(n) && /core/i.test(n) && /ishare|ishs/i.test(n); }
};

function waehleC6(u, pruef, quellen) {
  const kandidaten = [];
  for (const s of u.yahoo) {
    const r = leseYahoo(s);
    if (!r) { kandidaten.push({ symbol: s, ladbar: false, grund: 'keine Rohdaten (Abruf fehlgeschlagen)' }); continue; }
    const name = (r.name || '') + ' | ' + (r.meta.shortName || '');
    const namePasst = pruef(name);
    quellen[s] = quelleKurz(r);
    kandidaten.push({ symbol: s, ladbar: namePasst, name: name, namePasst: namePasst, beginn: r.ersterRoh,
      tageNachAuflage: tage(u.auflage, r.ersterRoh), waehrung: r.waehrung, tage: r.tageRoh, r: r });
  }
  let gewaehlt = kandidaten.find(function (k) { return k.ladbar && k.tageNachAuflage <= C6_TAGE; }) || null;
  let regel = 'erstes Symbol mit Datenbeginn <= ' + C6_TAGE + ' Tage nach Auflage';
  if (!gewaehlt) {
    const ok = kandidaten.filter(function (k) { return k.ladbar; });
    ok.sort(function (a, b) { return a.beginn < b.beginn ? -1 : a.beginn > b.beginn ? 1 : 0; }); // stabil: Gleichstand -> fonds.json
    gewaehlt = ok[0] || null;
    regel = 'kein Symbol <= ' + C6_TAGE + ' Tage nach Auflage; laengste Historie (fruehester Datenbeginn, bei Gleichstand Reihenfolge in fonds.json)';
  }
  const liste = kandidaten.map(function (k) {
    return { symbol: k.symbol, ladbar: k.ladbar, name: k.name || null, namePasst: k.namePasst === undefined ? null : k.namePasst,
      beginn: k.beginn || null, tageNachAuflage: k.tageNachAuflage === undefined ? null : k.tageNachAuflage,
      waehrung: k.waehrung || null, tage: k.tage || null, grund: k.grund || null };
  });
  return { gewaehlt: gewaehlt, kandidaten: kandidaten, regel: regel, liste: liste };
}

function abSpalten(reihe, nameAB) { // Fenster A/B einer Massstabsreihe
  const aus = {};
  for (const name of ['A', 'B']) {
    const f = FENSTER[name]; const fr = fensterRendite(reihe, f.S, f.E); const L = nominalJahre(name);
    aus[name] = fr.berechenbar ? { r: fr.r, pa: pa(fr.r, L), startTag: fr.startTag, endTag: fr.endTag } : { berechenbar: false, grund: fr.grund };
  }
  if (nameAB) aus.name = nameAB;
  return aus;
}

function urteilGesamt(a, b) {
  if (a === 'verlässlich vorn' && b === 'verlässlich vorn') return 'verlässlich vorn';
  if (a.indexOf('nicht beurteilbar') === 0 || b.indexOf('nicht beurteilbar') === 0) return 'nicht beurteilbar (zu jung)';
  return 'nicht verlässlich vorn';
}

function rechneNachtrag(fonds, ezbAlle, spyUsd, spyAB, quellen, pruefungen) {
  const aus = { fonds: [], k1b: {}, sxr8: null };
  // K1b-Stand der Reihen des Erstlaufs (zur Kontrolle, dass sie unveraendert bleiben)
  for (const s of ['SPY', '^SP500TR', 'SPMO', 'SCHD'].concat(ucitsFonds(fonds).yahoo)) {
    const r = leseYahoo(s); if (r) aus.k1b[s] = r.k1b;
  }
  // US-Fonds gegen SPY
  for (const sym of ZUSATZ_US) {
    const r = leseYahoo(sym);
    if (!r) { aus.fonds.push({ id: sym, symbol: sym, fehler: 'keine Rohdaten', nachtrag: true }); continue; }
    quellen[sym] = quelleKurz(r); pruefungen[sym] = pruefKurz(r); aus.k1b[sym] = r.k1b;
    aus.fonds.push(Object.assign(rechneFonds(sym, r, wertreihe(r, 'USD', ezbAlle), spyUsd, spyAB, null), { nachtrag: true }));
  }
  // zweiter Massstab SXR8.DE in EUR
  const sx = leseYahoo(SXR8);
  const sxName = (sx.name || '') + ' | ' + (sx.meta.shortName || '');
  quellen[SXR8] = quelleKurz(sx); pruefungen[SXR8] = pruefKurz(sx); aus.k1b[SXR8] = sx.k1b;
  const sxEur = wertreihe(sx, 'EUR', ezbAlle);
  const sxAB = abSpalten(sxEur);
  const sxUsdAB = abSpalten(wertreihe(sx, 'USD', ezbAlle));
  aus.sxr8 = { symbol: SXR8, name: sxName, namePasst: NAMENSPRUEFUNG.SXR8(sxName), ersterTag: sxEur[0].d, waehrung: 'EUR',
    A: sxAB.A, B: sxAB.B,
    gegenSpyInUsd: { A: { sxr8Pa: sxUsdAB.A.pa, spyPa: spyAB.A.pa, abstandPaPp: (sxUsdAB.A.pa - spyAB.A.pa) * 100 },
      B: { sxr8Pa: sxUsdAB.B.pa, spyPa: spyAB.B.pa, abstandPaPp: (sxUsdAB.B.pa - spyAB.B.pa) * 100 } } };
  // UCITS gegen SPY (USD) und gegen SXR8 (EUR)
  for (const id of ZUSATZ_UCITS) {
    const u = fondsNachId(fonds, id);
    const w = waehleC6(u, NAMENSPRUEFUNG[id], quellen);
    for (const k of w.kandidaten) if (k.r) aus.k1b[k.symbol] = k.r.k1b;
    if (!w.gewaehlt) { aus.fonds.push({ id: id, fehler: 'kein ladbares Symbol', symbolwahl: { regel: w.regel, kandidaten: w.liste }, nachtrag: true }); continue; }
    const r = w.gewaehlt.r;
    pruefungen[r.sym] = pruefKurz(r);
    const eintrag = rechneFonds(id, r, wertreihe(r, 'USD', ezbAlle), spyUsd, spyAB, {
      isin: u.isin, auflage: u.auflage, waehrungReihe: r.waehrung,
      umrechnung: r.waehrung === 'USD' ? 'keine (Reihe in USD)' : 'EZB-Referenzkurse (' + (r.waehrung === 'EUR' ? 'USD je EUR' : r.waehrung + ' -> EUR -> USD') + '), letzter Kurs <= Handelstag',
      symbolwahl: { regel: w.regel, kandidaten: w.liste }, nachtrag: true
    });
    const g = rechneFonds(id, r, wertreihe(r, 'EUR', ezbAlle), sxEur, sxAB, null, 'sxr8');
    eintrag.gegenSXR8 = { massstab: SXR8, waehrung: 'EUR',
      umrechnung: r.waehrung === 'EUR' ? 'keine (Xetra/EUR gegen Xetra/EUR)' : 'Reihe in ' + r.waehrung + ' mit EZB-Referenzkurs (letzter Kurs <= Handelstag) in EUR',
      A: g.A, B: g.B, rollierend: g.rollierend, rueckschlag: g.rueckschlag, urteil: g.urteil };
    eintrag.urteilGesamt = urteilGesamt(eintrag.urteil, g.urteil);
    eintrag._fensterSxr8 = g._fenster;
    aus.fonds.push(eintrag);
  }
  return aus;
}

function rechnen() {
  const stand = arg('--stand', null);
  const fonds = JSON.parse(fs.readFileSync(path.join(STUDIE, 'fonds.json'), 'utf8'));
  const ezbR = leseEzb('USD');
  const ezb = ezbR.reihe;
  const quellen = {}; const pruefungen = {};

  // SPY
  const spyR = leseYahoo('SPY');
  quellen.SPY = quelleKurz(spyR); pruefungen.SPY = pruefKurz(spyR);
  const spyUsd = wertreiheUsd(spyR, ezb);
  const spyAB = {};
  for (const name of ['A', 'B']) {
    const f = FENSTER[name];
    const fr = fensterRendite(spyUsd, f.S, f.E);
    const L = nominalJahre(name);
    const frAdj = fensterRendite(spyUsd, f.S, f.E, 'adj');
    spyAB[name] = { r: fr.r, pa: pa(fr.r, L), startTag: fr.startTag, endTag: fr.endTag, jahre: L,
      tageNominal: tage(nrTag(tagNr(f.S) - 1), f.E),
      kontrolleAdjclose: { r: frAdj.r, pa: pa(frAdj.r, L), differenzPp: (pa(frAdj.r, L) - pa(fr.r, L)) * 100 },
      eichung: { soll: EICHUNG_SPY[name], abweichungPp: (fr.r - EICHUNG_SPY[name]) * 100, toleranzPp: name === 'A' ? 0.3 : 0.5 } };
  }
  // Pruefgroesse ^SP500TR (C7.6)
  const trR = leseYahoo('^SP500TR');
  if (trR) {
    quellen['^SP500TR'] = quelleKurz(trR);
    const trUsd = wertreiheUsd(trR, ezb);
    for (const name of ['A', 'B']) {
      const f = FENSTER[name]; const fr = fensterRendite(trUsd, f.S, f.E); const L = nominalJahre(name);
      spyAB[name].sp500tr = fr.berechenbar ? { r: fr.r, pa: pa(fr.r, L), rueckstandSpyPp: (pa(fr.r, L) - spyAB[name].pa) * 100 } : null;
    }
  }

  const ergebnisFonds = [];
  // SPMO, SCHD
  for (const sym of ['SPMO', 'SCHD']) {
    const r = leseYahoo(sym);
    quellen[sym] = quelleKurz(r); pruefungen[sym] = pruefKurz(r);
    ergebnisFonds.push(rechneFonds(sym, r, wertreiheUsd(r, ezb), spyUsd, spyAB, null));
  }

  // UCITS nach C6
  const u = ucitsFonds(fonds);
  const kandidaten = [];
  let gewaehlt = null;
  for (const s of u.yahoo) {
    const r = leseYahoo(s);
    if (!r) { kandidaten.push({ symbol: s, ladbar: false, grund: 'keine Rohdaten (Abruf fehlgeschlagen)' }); continue; }
    const name = (r.name || '') + ' | ' + (r.meta.shortName || '');
    const namePasst = /equal\s*weight/i.test(name) && /500/.test(name) && /xtrackers|x-?trackers|db x/i.test(name);
    const beginn = r.ersterRoh;
    const nachAuflage = tage(u.auflage, beginn);
    quellen[s] = quelleKurz(r);
    kandidaten.push({ symbol: s, ladbar: namePasst, name: name, namePasst: namePasst, beginn: beginn,
      tageNachAuflage: nachAuflage, waehrung: r.waehrung, tage: r.tageRoh, r: r });
  }
  for (const k of kandidaten) {
    if (k.ladbar && k.tageNachAuflage <= C6_TAGE) { gewaehlt = k; break; }
  }
  let wahlGrund = 'erstes Symbol mit Datenbeginn <= ' + C6_TAGE + ' Tage nach Auflage';
  if (!gewaehlt) {
    const ok = kandidaten.filter(function (k) { return k.ladbar; });
    ok.sort(function (a, b) { return a.beginn < b.beginn ? -1 : a.beginn > b.beginn ? 1 : 0; });
    gewaehlt = ok[0] || null;
    wahlGrund = 'kein Symbol <= ' + C6_TAGE + ' Tage nach Auflage; laengste Historie (fruehester Datenbeginn)';
  }
  if (gewaehlt) {
    const r = gewaehlt.r;
    pruefungen[r.sym] = pruefKurz(r);
    const usd = wertreiheUsd(r, ezb);
    ergebnisFonds.push(rechneFonds(u.id, r, usd, spyUsd, spyAB, {
      isin: u.isin, auflage: u.auflage, waehrungReihe: r.waehrung,
      umrechnung: r.waehrung === 'EUR' ? 'EZB-Referenzkurs USD je EUR, letzter Kurs <= Handelstag' : 'keine',
      symbolwahl: { regel: wahlGrund, kandidaten: kandidaten.map(function (k) {
        return { symbol: k.symbol, ladbar: k.ladbar, name: k.name || null, namePasst: k.namePasst === undefined ? null : k.namePasst,
          beginn: k.beginn || null, tageNachAuflage: k.tageNachAuflage === undefined ? null : k.tageNachAuflage,
          waehrung: k.waehrung || null, tage: k.tage || null, grund: k.grund || null };
      }) },
      hinweisSxr8: 'Vergleich gegen SXR8 (A1/C6) nicht Teil des Zweitrechner-Auftrags; ein „verlässlich vorn“ gegen SPY allein wäre nur vorläufig.'
    }));
  }

  quellen['EZB-USD'] = { sha256: ezbR.sha256, bytes: ezbR.bytes, erster: ezb[0].d, letzter: ezb[ezb.length - 1].d, tage: ezb.length,
    leereWerte: ezbR.leer, doppelteTage: ezbR.doppelt.length, ausschuettungen: null };

  // Nachtrag 05.10.2026 (nur wenn die Rohdaten dafuer geladen sind: node zweit.js laden --zusatz)
  let nachtrag = null;
  if (fs.existsSync(path.join(ROH2, 'ezb_GBP_EUR.csv')) && fs.existsSync(path.join(ROH2, dateiName(SXR8)))) {
    const ezbAlle = { USD: ezb };
    for (const w of ['GBP', 'CHF']) {
      const e = leseEzb(w);
      ezbAlle[w] = e.reihe;
      quellen['EZB-' + w] = { sha256: e.sha256, bytes: e.bytes, erster: e.reihe[0].d, letzter: e.reihe[e.reihe.length - 1].d, tage: e.reihe.length,
        leereWerte: e.leer, doppelteTage: e.doppelt.length, ausschuettungen: null };
    }
    nachtrag = rechneNachtrag(fonds, ezbAlle, spyUsd, spyAB, quellen, pruefungen);
  }
  let protokoll = null;
  try { protokoll = JSON.parse(fs.readFileSync(path.join(ROH2, 'abrufprotokoll.json'), 'utf8')); } catch (e) { protokoll = null; }
  if (protokoll) {
    for (const k of Object.keys(quellen)) if (protokoll[k] && protokoll[k].abruf) quellen[k].abruf = protokoll[k].abruf;
    if (protokoll['EZB-USD']) quellen['EZB-USD'].abruf = protokoll['EZB-USD'].abruf;
  }

  const lesarten = [
    'Tagesdatum = Kalenderdatum des Kerzenstempels in meta.exchangeTimezoneName (Intl); Ausschüttungs-/Kapitalgewinn-/Split-Datum ebenso aus dem Ereignisstempel.',
    'Kerzen mit Schluss null, 0 oder nicht endlich werden verworfen (kein Handelstag); eine Ausschüttung an so einem Tag wandert dadurch auf den nächsten Handelstag mit Kurs.',
    'Doppelte Kalendertage: die Kerze mit dem späteren Zeitstempel bleibt (gemeldet in pruefungen.*.doppelteTage).',
    'Datenende: nur Kerzen mit Datum <= 2026-09-15; Ausschüttungen nach dem Datenende und vor dem ersten Kurs der Reihe werden nicht gebucht (TR(erster Tag) = 1).',
    'Ausschüttung an einem Nicht-Handelstag: gebucht am ersten Handelstag mit Datum >= Ereignisdatum (C2), wieder angelegt zu dessen Schluss.',
    'Kapitalgewinn mit gleichem Datum und Betrag (|Diff| < 1e-9) wie eine Dividende zählt einmal; sonst werden beide addiert.',
    'Ausschüttungsbeträge aus Yahoo unverändert (Yahoo liefert sie split-bereinigt wie close); geprüft über Betrag / Vortagsschluss.',
    'Sprungpaare C7.1 auf dem Schluss (Kursrendite ohne Ausschüttung) vor der Ausschüttungsbuchung geprüft, wiederholt bis keins mehr vorliegt; Tag t entfernt.',
    'C3 Sollrand: Start-Lücke = S − gefundener Handelstag (S selbst als Sollrand), Ende-Lücke = E − gefundener Handelstag; > 10 Tage = nicht berechenbar.',
    'C3 nominale Länge: Tage von S − 1 Tag (= Datum des Schlusses vor S, hier 03.01.2017 bzw. 15.09.2021, beides Handelstage von SPY) bis E, / 365,25; A = 1716 Tage, B = 1826 Tage; für Fonds und SPY dieselbe.',
    '„Vorn“ in A/B und in den rollierenden Fenstern: Gesamtertrag Fonds strikt größer als SPY (Gleichstand = nicht vorn).',
    'C4: erster Startmonat = Monat des ersten Kurses der jüngeren Reihe (nach Bereinigung); Startwert = Schluss am letzten Handelstag dieses Monats; letzter Startmonat 2021-08 (Ende 2026-08). Lücke: letzter Handelstag des Monats liegt > 10 Tage vor dem Kalender-Monatsende (geprüft für Fonds und SPY an Start und Ende) → Fenster fehlt.',
    'C4 Median bei gerader Zahl: Mittel der beiden mittleren Werte; Abstand und Median als Dezimalbruch (0,01 = 1 Pp p. a.), zusätzlich *Pp-Felder.',
    'C5: relative Reihe auf den Handelstagen des Fonds, SPY = letzter Wert <= Tag (gleiches Kalenderdatum zählt, auch bei Xetra-Schluss vor dem US-Schluss); Tiefe als negativer Dezimalbruch.',
    'C6 Symbolwahl: Kandidaten in der Reihenfolge von fonds.json; Datenbeginn = erste Kerze mit gültigem Schluss in der Rohantwort; Name passt, wenn longName/shortName „Equal Weight“, „500“ und Xtrackers enthält; „längste Historie“ = frühester Datenbeginn.',
    'UCITS in USD: Gesamtertrag der EUR-Reihe × EZB-Referenzkurs USD je EUR (letzter Kurs <= Handelstag) – gleichwertig zur Umrechnung von Schluss und Ausschüttung am selben Tag.',
    'Kontrollweg adjclose nur nachrichtlich (kontrolleAdjclose); es entscheidet der Hauptweg Schluss + Ausschüttungen.',
    'Stillstandskurse (Volumen 0, Schluss wie Vortag) bleiben als Handelstag stehen – REGEL.md sieht dafür nichts vor.',
    'EZB-Zeilen ohne Zahlenwert werden übersprungen; es gilt der letzte gültige Kurs <= Handelstag.',
    'Keine Ergänzung fehlender Ausschüttungen: der Zweitrechner rechnet nur aus seinen eigenen Yahoo-Rohdaten; Verdachtsfälle stehen im BERICHT.',
    'UCITS-Fenster A/B: Start-/Endtag sind Xetra-Handelstage (letzter vor S, letzter <= E), umgerechnet mit dem EZB-Kurs dieses Tages; SPY behält seine eigenen Randtage.'
  ];

  const lesartenNachtrag = [
    'Nachtrag K1b (Lesart des Hauptrechners, vom Projektleiter am 05.10.2026 mitgeteilt, eigene Ausformung): Reihenanfang verworfen, wenn innerhalb der ersten 730 Kalendertage auf mindestens 5 unmittelbar aufeinanderfolgende gleiche Schlusskurse ein Sprung |r| > 10 % folgt, der „ungedeckt“ ist: |(1 + Sprung) / (1 + SPY-Kursbewegung vom ersten gleichen Tag bis zum Sprungtag) − 1| > 10 %. Verworfen wird alles vor dem Sprungtag, der Sprungtag ist der erste Tag der Reihe (bei mehreren Treffern der letzte). Angewandt vor den Sprungpaaren auf alle Reihen; Treffer in nachtrag.k1b.',
    'Nachtrag C6 Namensprüfung je Fonds auf „longName | shortName“: SXRV = Nasdaq + iShares ohne „(DE)“; EXXT = Nasdaq + iShares mit „(DE)“/„ETF DEI“; EQQQ = Nasdaq + Invesco/EQQQ; LYMS = Nasdaq + Amundi/Lyxor mit „Core“; 6AQQ = Nasdaq + Amundi/Lyxor ohne „Core“. Regionalbörsen-Symbole (.DU/.MU/.HM) liefern nur eine einzige aktuelle Kerze und haben deshalb keinen frühen Datenbeginn.',
    'Nachtrag C6 Gleichstand beim Datenbeginn (EQQQ.DE und EQQQ.MI, beide 02.01.2008): es entscheidet die Reihenfolge in fonds.json (Xetra zuerst).',
    'Nachtrag Währungen: Reihen in USD gegen SPY ohne Umrechnung, gegen SXR8 mit dem EZB-Kurs USD je EUR in EUR; EUR-Reihen gegen SPY × USD je EUR; GBp = Pence / 100, GBP und CHF über die EZB-Kurse GBP bzw. CHF je EUR; je Handelstag der letzte EZB-Kurs <= Tag.',
    'Nachtrag gegen SXR8: Fenster A/B, rollierende Fenster und relativer Rückschlag wie gegen SPY, beide Reihen in EUR; SXR8.DE mit K1b ab 01.11.2010, damit erster Startmonat der rollierenden Fenster 2010-11 (wenn der Fonds älter ist).',
    'Nachtrag Urteil UCITS: „urteil“ = gegen SPY (wie im Erstlauf), „gegenSXR8.urteil“ = gegen SXR8, „urteilGesamt“ = „verlässlich vorn“ nur wenn beide erfüllt (A1).'
  ];
  const fondsAlle = ergebnisFonds.concat(nachtrag ? nachtrag.fonds : []);
  const ergebnis = {
    kennung: 'faktor-etf-realitaet-2026-10/v1 – zweiter Rechner (C10)',
    stand: stand,
    datenende: DATENENDE,
    einheiten: 'Renditen, Abstände, Median, Rückschlag als Dezimalbrüche (0.1234 = 12,34 % bzw. 12,34 Pp); Felder *Pp in Prozentpunkten.',
    quellen: quellen,
    spy: { A: spyAB.A, B: spyAB.B },
    fonds: fondsAlle.map(function (f) { const k = Object.assign({}, f); delete k._fenster; delete k._fensterSxr8; return k; }),
    lesarten: nachtrag ? lesarten.concat(lesartenNachtrag) : lesarten,
    pruefungen: pruefungen
  };
  if (nachtrag) {
    const erstlaufOhneK1b = ['SPY', '^SP500TR', 'SPMO', 'SCHD'].concat(ucitsFonds(fonds).yahoo).every(function (s) { return nachtrag.k1b[s] === null || nachtrag.k1b[s] === undefined; });
    ergebnis.nachtrag = {
      stand: arg('--stand-nachtrag', null),
      auftrag: 'Projektleiter 05.10.2026: zusätzlich jeder Fonds, der nach dem vorläufigen Stand des Hauptrechners „verlässlich vorn“ ist (US: QQQ, IVW, SCHG, MGK gegen SPY; UCITS: SXRV, EXXT, EQQQ, LYMS, 6AQQ gegen SPY in USD und gegen SXR8.DE in EUR); Lesart K1b übernommen. Die Einträge stehen in „fonds“ hinter den drei Fonds des Erstlaufs (Feld nachtrag: true).',
      erstlaufUnveraendert: erstlaufOhneK1b ? 'K1b greift bei keiner Reihe des Erstlaufs (SPY, ^SP500TR, SPMO, SCHD, XDEW.*); dessen Einträge sind unverändert.' : 'ACHTUNG: K1b greift bei einer Reihe des Erstlaufs – siehe k1b.',
      k1b: nachtrag.k1b,
      sxr8: nachtrag.sxr8
    };
  }
  fs.writeFileSync(path.join(HIER, 'ergebnis-zweit.json'), JSON.stringify(ergebnis, null, 1) + '\n');
  // Fensterliste nur in den Rohdatenordner (Arbeitsstand, nicht ins Repo)
  const fensterAlle = {};
  for (const f of fondsAlle) {
    fensterAlle[f.id] = f._fenster;
    if (f._fensterSxr8) fensterAlle[f.id + '_gegenSXR8'] = f._fensterSxr8;
  }
  fs.writeFileSync(path.join(ROH2, 'fenster-zweit.json'), JSON.stringify(fensterAlle, null, 1));

  // Kurzausgabe
  const pp = function (x) { return (x * 100).toFixed(2); };
  console.log('SPY A ' + pp(spyAB.A.r) + ' % (' + pp(spyAB.A.pa) + ' p.a.)  B ' + pp(spyAB.B.r) + ' % (' + pp(spyAB.B.pa) + ' p.a.)');
  const zeile = function (kopf, f) {
    if (!f.A) { console.log(kopf + ' FEHLER ' + (f.fehler || '')); return; }
    const a = f.A.berechenbar ? pp(f.A.fonds) + '/' + pp(f.A.abstandPa) + 'Pp ' + (f.A.vorn ? 'vorn' : 'hinten') : 'n.b.';
    const b = f.B.berechenbar ? pp(f.B.fonds) + '/' + pp(f.B.abstandPa) + 'Pp ' + (f.B.vorn ? 'vorn' : 'hinten') : 'n.b.';
    const ro = f.rollierend;
    console.log(kopf + ' A ' + a + ' | B ' + b + ' | roll ' + ro.vorn + '/' + ro.n + ' Median ' + pp(ro.median) +
      ' schlecht ' + pp(ro.schlechtester) + ' (' + ro.schlechtesterStart + ') best ' + pp(ro.bester) + ' ' + ro.erstesFenster + '..' + ro.letztesFenster +
      ' fehlend ' + ro.fehlend + ' | Rueckschlag ' + pp(f.rueckschlag.tiefe) + ' ' + f.rueckschlag.spitze + '->' + f.rueckschlag.tal + ' | ' + f.urteil);
  };
  for (const f of ergebnis.fonds) {
    zeile(f.id + ' (' + f.symbol + ')', f);
    if (f.gegenSXR8) { zeile('   gegen SXR8 (EUR)', f.gegenSXR8); console.log('   Gesamturteil: ' + f.urteilGesamt); }
  }
  if (ergebnis.nachtrag) {
    const s = ergebnis.nachtrag.sxr8;
    console.log('SXR8.DE ab ' + s.ersterTag + ' A ' + pp(s.A.r) + ' % B ' + pp(s.B.r) + ' % (EUR); gegen SPY in USD A ' + s.gegenSpyInUsd.A.abstandPaPp.toFixed(3) +
      ' B ' + s.gegenSpyInUsd.B.abstandPaPp.toFixed(3) + ' Pp p.a.; K1b-Treffer: ' +
      Object.keys(ergebnis.nachtrag.k1b).filter(function (k) { return ergebnis.nachtrag.k1b[k]; }).map(function (k) { return k + ' ab ' + ergebnis.nachtrag.k1b[k].neuerBeginn; }).join(', '));
  }
}

if (require.main !== module) {
  // fuer Empfindlichkeitsproben aus einem anderen Skript (aendert nichts an den Ergebnisdateien)
  module.exports = { leseYahoo: leseYahoo, leseEzb: leseEzb, wertreihe: wertreihe, rechneFonds: rechneFonds, abSpalten: abSpalten,
    rollierend: rollierend, rueckschlag: rueckschlag, FENSTER: FENSTER };
} else if (process.argv[2] === 'laden') {
  laden().catch(function (e) { console.error(e); process.exitCode = 1; });
} else if (process.argv[2] === 'rechnen' || process.argv[2] === undefined) {
  rechnen();
} else {
  console.error('Aufruf: node zweit.js laden [--zusatz] | rechnen [--roh <ordner>] [--stand <zeit>] [--stand-nachtrag <zeit>]');
  process.exitCode = 2;
}
