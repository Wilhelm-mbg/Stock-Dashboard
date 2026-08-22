/* MESSGESCHIRR der Signalstudie 2026-08 (siehe REGISTRIERUNG.md).
 *
 * Misst fuer jeden Detektor (reine Funktion signal(bars, i, params) -> {dir}|null) den
 * Ueberschuss gegen eine Kontrolle je Symbol x Tageszeit-Versatz (leave-one-day-out),
 * geclustert ueber Tage, getrennt nach Entdeckungs- und Bestaetigungstagen.
 *
 * Bewusst NICHT enthalten: Parameterraster, Optimierung, nachtraegliche Auswahl.
 * Was hier rauskommt, ist ein Ranking (Entdeckung) bzw. ein Test (Bestaetigung) -
 * die Auswahlregel steht in der Registrierung und wird in auswahl.js angewandt.
 *
 * Aufruf:  node messgeschirr.js <iv> <phase> [--det=a,b,c] [--max=N]
 *          iv = 1m|5m|15m|60m ; phase = entdeckung|bestaetigung|beide
 */
'use strict';
const fs = require('fs');
const path = require('path');
const Q = require('../../quant.js');

const STORE = (process.env.APPDATA || require('os').homedir() + '/AppData/Roaming') + '/markt-dashboard/store/';
const OUT = path.join(__dirname, 'ergebnisse');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

/* ---------- Registrierte Konstanten ---------- */
const KOSTEN_PP = 0.10;
const SPLIT = {
  A: { cutoff: '2026-07-23' },            // Tage < cutoff = Entdeckung, >= cutoff = Bestaetigung
  B: { anteil: 2 / 3 },                   // 60m: erste 2/3 der globalen Handelstage
};
const HORIZONTE = {
  '1m':  [[60, '1h'], [180, '3h'], ['TS', 'TS']],
  '5m':  [[12, '1h'], [36, '3h'], ['TS', 'TS']],
  '15m': [[4, '1h'], [12, '3h'], ['TS', 'TS']],
  '60m': [[7, '1T'], [21, '3T'], [35, '5T']],
};
const COOLDOWN = { '1m': 60, '5m': 12, '15m': 4, '60m': 7 };
const MIN_REST = { '1m': 30, '5m': 6, '15m': 2, '60m': 0 };   // Kerzen bis Tagesschluss, sonst kein Intraday-Signal
const MIN_CTRL = 5;                                            // Mindestzahl anderer Tage fuer die Kontrolle

/* ---------- Helfer ---------- */
const mean = a => { let s = 0; for (const x of a) s += x; return a.length ? s / a.length : 0; };
const sd = a => { if (a.length < 2) return 0; const m = mean(a); let s = 0; for (const x of a) s += (x - m) * (x - m); return Math.sqrt(s / (a.length - 1)); };
const r3 = x => Math.round(x * 1000) / 1000;
const tagVon = ms => new Date(ms).toISOString().slice(0, 10);

function usDst(ms) {
  const d = new Date(ms), y = d.getUTCFullYear();
  const so = (m, n) => { const d1 = new Date(Date.UTC(y, m, 1)); const off = (7 - d1.getUTCDay()) % 7; return Date.UTC(y, m, 1 + off + 7 * (n - 1)); };
  return ms >= so(2, 2) + 7 * 3600000 && ms < so(10, 1) + 6 * 3600000;
}
function istSitzung(ms) {
  const d = new Date(ms), tag = d.getUTCDay();
  if (tag === 0 || tag === 6) return false;
  const m = d.getUTCHours() * 60 + d.getUTCMinutes() - ((usDst(ms) ? 13 : 14) * 60 + 30);
  return m >= 0 && m < 390;
}
function daySegments(bars) {
  const segs = []; let s = 0;
  for (let i = 1; i <= bars.length; i++) {
    if (i === bars.length || tagVon(bars[i][0]) !== tagVon(bars[s][0])) { segs.push({ s, e: i - 1 }); s = i; }
  }
  return segs;
}

/* ---------- Universum ---------- */
function ladeUniversum(iv, max) {
  const dateien = fs.readdirSync(STORE).filter(f => f.startsWith('bars_' + iv + '_'));
  let syms = dateien.map(f => f.replace('bars_' + iv + '_', '').replace('.json', ''))
    .filter(s => !/-USD$/.test(s) && !/^_/.test(s));
  if (iv === '1m') {                       // nur die Werte mit tiefer Capital-Historie
    const epics = JSON.parse(fs.readFileSync(STORE + 'cap_epics.json', 'utf8'));
    syms = syms.filter(s => epics[s]);
  }
  const E = [];
  for (const sym of syms) {
    let raw; try { raw = JSON.parse(fs.readFileSync(STORE + 'bars_' + iv + '_' + sym + '.json', 'utf8')); } catch (e) { continue; }
    /* Stempel-Kerzen (Abrufzeit statt Raster, Volumen 0, H=L=C) fliegen raus. Befund 22.08.:
     * am 21.08. waren in allen 122 Stundenreihen 4 von 7 Kerzen Stempel. Die echten Kerzen
     * dieser Stunden sind im Archiv verloren - Tage mit unter 80 % der Sollkerzen werden
     * deshalb als unvollstaendig ganz verworfen, statt halbe Tage zu messen. */
    let a = (raw.series || []).filter(b => istSitzung(b[0]) && b[1] > 0 && b[0] % 60000 === 0);
    const soll = { '1m': 390, '5m': 78, '15m': 26, '60m': 7 }[iv];
    const proTag = {}; a.forEach(b => { const k = tagVon(b[0]); proTag[k] = (proTag[k] || 0) + 1; });
    const unvoll = new Set(Object.keys(proTag).filter(k => proTag[k] < soll * 0.8));
    if (unvoll.size) { a = a.filter(b => !unvoll.has(tagVon(b[0]))); (ladeUniversum.unvoll = ladeUniversum.unvoll || new Set()); unvoll.forEach(k => ladeUniversum.unvoll.add(k)); }
    if (a.length < (iv === '60m' ? 500 : 1500)) continue;
    const tage = (a[a.length - 1][0] - a[0][0]) / 86400000;
    if (iv !== '60m' && tage < 55) continue;
    E.push({ sym, bars: a, capBereiche: raw.capBereiche || [] });
    if (max && E.length >= max) break;
  }
  return E;
}

/* ---------- Vorbereitung je Symbol ---------- */
function bereite(E, iv) {
  const segs = daySegments(E.bars);
  const n = E.bars.length;
  E.segs = segs;
  E.dayStart = new Array(n); E.dayEnd = new Array(n); E.dayKey = new Array(n); E.dayIdx = new Array(n);
  segs.forEach((g, di) => { const k = tagVon(E.bars[g.s][0]); for (let x = g.s; x <= g.e; x++) { E.dayStart[x] = g.s; E.dayEnd[x] = g.e; E.dayKey[x] = k; E.dayIdx[x] = di; } });
  // Kontrolle je Horizont: Summe/Anzahl je Versatz ueber alle Tage (leave-one-day-out beim Abruf)
  E.ctrl = {};
  for (const [H] of HORIZONTE[iv]) {
    const sum = new Map(), cnt = new Map();
    if (H === 'TS') {
      for (const g of segs) {
        const ce = E.bars[g.e][1];
        for (let k = g.s; k <= g.e; k++) {
          const o = k - g.s, a = E.bars[k][1]; if (!(a > 0) || !(ce > 0)) continue;
          const r = (ce - a) / a; sum.set(o, (sum.get(o) || 0) + r); cnt.set(o, (cnt.get(o) || 0) + 1);
        }
      }
    } else {
      for (let k = 0; k + H < n; k++) {
        // Intraday: nur innerhalb des Tages. 60m: ueber Tage hinweg erlaubt.
        if (iv !== '60m' && E.dayEnd[k] < k + H) continue;
        const o = k - E.dayStart[k], a = E.bars[k][1], b = E.bars[k + H][1];
        if (!(a > 0) || !(b > 0)) continue;
        const r = (b - a) / a; sum.set(o, (sum.get(o) || 0) + r); cnt.set(o, (cnt.get(o) || 0) + 1);
      }
    }
    E.ctrl[H] = { sum, cnt };
  }
  // Vortagsrendite je Tag, realisierte Vola (20 Tage) je Tag, Liquiditaet (Median Tagesumsatz)
  E.tagRet = {}; E.tagVola = {}; const tagsSchluss = [];
  segs.forEach(g => { tagsSchluss.push([E.dayKey[g.s], E.bars[g.e][1]]); });
  for (let i = 1; i < tagsSchluss.length; i++) E.tagRet[tagsSchluss[i][0]] = tagsSchluss[i][1] / tagsSchluss[i - 1][1] - 1;
  for (let i = 0; i < tagsSchluss.length; i++) {
    const w = []; for (let j = Math.max(1, i - 19); j <= i; j++) w.push(Math.log(tagsSchluss[j][1] / tagsSchluss[j - 1][1]));
    E.tagVola[tagsSchluss[i][0]] = w.length >= 5 ? sd(w) : null;
  }
  /* Technik-Score ist auf der TAGESSERIE definiert (quant.js: pts = Tagesserie, Live auf
   * ~500 Tageskerzen). Auf Intraday-Kerzen gerechnet misst er etwas anderes und ist fast
   * konstant (Gegenpruefung 22.08.: Terzil-Uebereinstimmung 29 % auf 1m). Deshalb:
   * Tagesschluesse aus den Segmenten, Score je Tagesindex walk-forward. */
  E.tagPts = tagsSchluss.map(x => [Date.parse(x[0]), x[1]]);
  E.tagScore = {};
  for (let i = 55; i < E.tagPts.length; i++) {
    try { E.tagScore[tagsSchluss[i][0]] = Q.technical(E.tagPts, i).score; } catch (e) { }
  }
  const ums = segs.map(g => { let v = 0; for (let k = g.s; k <= g.e; k++) v += (E.bars[k][2] || 0) * E.bars[k][1]; return v; }).filter(v => v > 0).sort((a, b) => a - b);
  E.umsatz = ums.length ? ums[Math.floor(ums.length / 2)] : 0;
  // Ist eine Kerze aus CFD-Daten? (Volumen dort nicht vergleichbar)
  E.istCfd = ms => { for (const b of E.capBereiche) if (ms >= b[0] && ms <= b[1]) return true; return false; };
}

/* ---------- Bedingungsvariablen (global) ---------- */
function ladeIndex() {
  let gs; try { gs = JSON.parse(fs.readFileSync(STORE + 'hist__GSPC.json', 'utf8')); } catch (e) { return null; }
  const arr = (Array.isArray(gs) ? gs : (gs.series || gs.data || [])).slice().sort((a, b) => a[0] - b[0]);
  const closes = arr.map(b => b[1]);
  const ema = []; const k = 2 / 201; let e = null;
  closes.forEach((c, i) => { e = e == null ? c : c * k + e * (1 - k); ema.push(e); });
  const reg = {};
  arr.forEach((b, i) => { reg[tagVon(b[0])] = { ueberEma200: closes[i] > ema[i], ret: i ? closes[i] / closes[i - 1] - 1 : 0 }; });
  return reg;
}
function ladeTermine() {
  let d; try { d = JSON.parse(fs.readFileSync(STORE + 'drift_termine.json', 'utf8')); } catch (e) { return {}; }
  const out = {};
  for (const sym of Object.keys(d.sym || {})) out[sym] = (d.sym[sym] || []).map(t => tagVon(Date.parse(t[0]))).filter(Boolean);
  return out;
}
function terminNah(termine, sym, tagKey) {
  const L = termine[sym]; if (!L) return null;
  const t = Date.parse(tagKey);
  for (const d of L) { const dd = Math.abs(Date.parse(d) - t) / 86400000; if (dd <= 3) return true; }
  return false;
}

/* ---------- Bedingungen je Signal ---------- */
function bedingungen(E, i, iv, ctx) {
  const tag = E.dayKey[i], o = i - E.dayStart[i], len = E.dayEnd[i] - E.dayStart[i] + 1;
  const r = ctx.regime && ctx.regime[tag];
  const out = {};
  out.regime = r ? (r.ueberEma200 ? 'ueber' : 'unter') : 'na';
  const barMin = parseInt(iv, 10) || 60;
  const minSeit = o * barMin;
  out.tageszeit = minSeit < 60 ? 'eroeffnung' : (minSeit >= 330 ? 'schluss' : 'mitte');
  out.wochentag = ['so', 'mo', 'di', 'mi', 'do', 'fr', 'sa'][new Date(E.bars[i][0]).getUTCDay()];
  const v = E.tagVola[tag];
  out.vola = v == null ? 'na' : (v > ctx.volaMedian ? 'hoch' : 'niedrig');
  out.liquiditaet = E.umsatz >= ctx.umsatzMedian ? 'liquide' : 'duenn';
  const tn = terminNah(ctx.termine, E.sym, tag);
  out.termin = tn == null ? 'na' : (tn ? 'nah' : 'fern');
  /* VORTAG heisst Vortag: tagRet[tag] waere die Rendite des Signaltages selbst - die
   * enthaelt das Vorwaertsfenster (Zukunftsblick, fiel am 22.08. durch t~10 auf). */
  const diV = E.dayIdx[i];
  const vr = diV > 0 ? E.tagRet[E.dayKey[E.segs[diV - 1].s]] : null;
  out.vortag = vr == null ? 'na' : (vr > ctx.vortagTerz[1] ? 'hoch' : (vr < ctx.vortagTerz[0] ? 'tief' : 'mitte'));
  // Technik-Score (walk-forward via endI) und Kanal (bestChannel via endI) - beide teuer, nur je Signal
  {
    // Score des VORTAGES (am Signaltag ist der Tagesschluss noch nicht bekannt)
    const di = E.dayIdx[i];
    const vorKey = di > 0 ? E.dayKey[E.segs[di - 1].s] : null;
    const sc = vorKey != null ? E.tagScore[vorKey] : undefined;
    out.technik = sc == null ? 'na' : (sc > ctx.technikTerz[1] ? 'hoch' : (sc < ctx.technikTerz[0] ? 'tief' : 'mitte'));
  }
  try {
    const closes = E.bars.slice(Math.max(0, i - 120), i + 1).map(b => b[1]);
    const ch = Q.bestChannel(closes, closes.length - 1, {});
    out.kanal = (ch && Q.channelValid(ch, 0)) ? 'ja' : 'nein';
  } catch (e) { out.kanal = 'na'; }
  return out;
}

/* ---------- Auswertung ---------- */
function statistik(entries) {
  const n = entries.length; if (!n) return null;
  const byDay = new Map(), bySym = new Map();
  for (const e of entries) {
    if (!byDay.has(e.tag)) byDay.set(e.tag, []); byDay.get(e.tag).push(e.ex);
    if (!bySym.has(e.sym)) bySym.set(e.sym, []); bySym.get(e.sym).push(e.ex);
  }
  const dm = []; for (const [, v] of byDay) dm.push(mean(v));
  const sm = []; for (const [, v] of bySym) if (v.length >= 3) sm.push(mean(v));
  const dM = mean(dm), dS = sd(dm), nD = dm.length;
  const tDay = (nD >= 2 && dS > 0) ? dM / dS * Math.sqrt(nD) : 0;
  const brutto = mean(entries.map(e => e.ex)) * 100;
  return {
    n, nSym: bySym.size, nTage: nD,
    bruttoPp: r3(brutto), nettoPp: r3(brutto - KOSTEN_PP),
    tTag: r3(tDay), mdeTagPp: (nD >= 2 && dS > 0) ? r3(2 * dS / Math.sqrt(nD) * 100) : null,
    symPos: sm.length ? r3(sm.filter(x => x > 0).length / sm.length) : null,
  };
}

/* ---------- Aggregation (auch fuer Reparaturen fertiger Laeufe nutzbar) ---------- */
const BEDINGUNGEN = ['regime', 'tageszeit', 'wochentag', 'vola', 'liquiditaet', 'termin', 'vortag', 'technik', 'kanal'];
function aggregiere(ereignisse, hor) {
  const zeilen = [];
  for (const det of Object.keys(ereignisse)) {
    const ev = ereignisse[det];
    for (const dir of [1, -1]) for (const [, lab] of hor) {
      const basis = ev.filter(e => e.dir === dir && e.fwd[lab] != null).map(e => ({ sym: e.sym, tag: e.tag, ex: e.fwd[lab], bed: e.bed }));
      const st = statistik(basis);
      if (st) zeilen.push(Object.assign({ det, dir: dir > 0 ? 'long' : 'short', hor: lab, bedingung: '-', wert: '-' }, st));
      for (const b of BEDINGUNGEN) {
        const werte = [...new Set(basis.map(e => e.bed[b]))].filter(w => w !== 'na');
        for (const w of werte) {
          const sub = basis.filter(e => e.bed[b] === w);
          const s2 = statistik(sub);
          if (s2 && s2.nTage >= 10) zeilen.push(Object.assign({ det, dir: dir > 0 ? 'long' : 'short', hor: lab, bedingung: b, wert: w }, s2));
        }
      }
    }
  }
  return zeilen;
}

/* ---------- Hauptlauf ---------- */
function lauf(opts) {
  const { iv, phase, detektoren, max, log } = opts;
  const tier = iv === '60m' ? 'B' : 'A';
  const t0 = Date.now();
  const U = ladeUniversum(iv, max);
  U.forEach(E => { bereite(E, iv); E.bars.sym = E.sym; });
  (log || console.log)('Universum ' + iv + ': ' + U.length + ' Werte, ' + U.reduce((s, E) => s + E.bars.length, 0).toLocaleString('de-DE') + ' Sitzungskerzen' +
    (ladeUniversum.unvoll && ladeUniversum.unvoll.size ? ' · unvollstaendige Tage verworfen: ' + [...ladeUniversum.unvoll].sort().join(', ') : ''));

  // Globaler Kalender + Split
  const alleTage = [...new Set(U.flatMap(E => E.segs.map(g => E.dayKey[g.s])))].sort();
  let cutoff;
  if (tier === 'A') cutoff = SPLIT.A.cutoff;
  else cutoff = alleTage[Math.floor(alleTage.length * SPLIT.B.anteil)];
  const inPhase = tag => phase === 'beide' ? true : (phase === 'entdeckung' ? tag < cutoff : tag >= cutoff);
  const nEnt = alleTage.filter(t => t < cutoff).length, nBes = alleTage.length - nEnt;
  (log || console.log)('Kalender: ' + alleTage.length + ' Handelstage, Entdeckung ' + nEnt + ' (< ' + cutoff + '), Bestaetigung ' + nBes + '. Phase: ' + phase);

  // Kontext fuer Bedingungen
  const ctx = { regime: ladeIndex(), termine: ladeTermine() };
  /* Schnittpunkte der Bedingungen (Mediane, Terzile) NUR aus Entdeckungstagen - sonst
   * flossen Bestaetigungstage in die Definition ein (Synthese-Hinweis 22.08.). */
  const nurEnt = (E, obj) => Object.keys(obj).filter(k => k < cutoff).map(k => obj[k]);
  const volas = U.flatMap(E => nurEnt(E, E.tagVola).filter(v => v != null)).sort((a, b) => a - b);
  ctx.volaMedian = volas[Math.floor(volas.length / 2)] || 0;
  const ums = U.map(E => E.umsatz).sort((a, b) => a - b);
  ctx.umsatzMedian = ums[Math.floor(ums.length / 2)] || 0;
  const vr = U.flatMap(E => nurEnt(E, E.tagRet)).sort((a, b) => a - b);
  ctx.vortagTerz = [vr[Math.floor(vr.length / 3)] || 0, vr[Math.floor(vr.length * 2 / 3)] || 0];
  // Technik-Terzile aus einer Stichprobe
  const techProbe = U.flatMap(E => nurEnt(E, E.tagScore || {})).filter(v => typeof v === 'number');
  techProbe.sort((a, b) => a - b);
  ctx.technikTerz = [techProbe[Math.floor(techProbe.length / 3)] || 0, techProbe[Math.floor(techProbe.length * 2 / 3)] || 0];

  // Signale sammeln
  const ereignisse = {};          // det -> [{sym, i, tag, dir, bed, fwd:{H: ex}}]
  const hor = HORIZONTE[iv], cd = COOLDOWN[iv], rest = MIN_REST[iv];
  for (const D of detektoren) {
    if (D.zeitrahmen && D.zeitrahmen.indexOf(iv) === -1) continue;
    const ev = []; let aufrufe = 0, fehler = 0;
    const tDet = Date.now();
    for (const E of U) {
      let last = -1e9;
      for (let i = 50; i < E.bars.length; i++) {
        if (!inPhase(E.dayKey[i])) continue;
        if (i - last < cd) continue;
        if (iv !== '60m' && E.dayEnd[i] - i < rest) continue;
        let s = null; aufrufe++;
        try { s = D.signal(E.bars, i, D.params); } catch (e) { fehler++; continue; }
        if (!s || !s.dir) continue;
        last = i;
        const dir = s.dir > 0 ? 1 : -1, c0 = E.bars[i][1], o = i - E.dayStart[i];
        const fwd = {};
        for (const [H, lab] of hor) {
          let c1, key = H;
          if (H === 'TS') c1 = E.bars[E.dayEnd[i]][1];
          else { if (i + H >= E.bars.length) continue; if (iv !== '60m' && E.dayEnd[i] < i + H) continue; c1 = E.bars[i + H][1]; }
          if (!(c1 > 0)) continue;
          const roh = (c1 - c0) / c0;
          const C = E.ctrl[key], cn = C.cnt.get(o) || 0; if (cn < MIN_CTRL + 1) continue;
          const ctrl = (C.sum.get(o) - roh) / (cn - 1);
          fwd[lab] = (roh - ctrl) * dir;
        }
        if (!Object.keys(fwd).length) continue;
        ev.push({ sym: E.sym, i, tag: E.dayKey[i], t: E.bars[i][0], dir, fwd, bed: bedingungen(E, i, iv, ctx) });
      }
    }
    ereignisse[D.key] = ev;
    (log || console.log)('  ' + D.key.padEnd(22) + String(ev.length).padStart(6) + ' Signale  (' + aufrufe.toLocaleString('de-DE') + ' Aufrufe, ' + fehler + ' Fehler, ' + Math.round((Date.now() - tDet) / 1000) + ' s)');
  }

  const zeilen = aggregiere(ereignisse, hor);

  const out = { iv, phase, cutoff, universum: U.length, tage: { gesamt: alleTage.length, entdeckung: nEnt, bestaetigung: nBes }, tests: zeilen.length, zeilen,
    ereignisse: Object.fromEntries(Object.keys(ereignisse).map(k => [k, ereignisse[k].map(e => ({ sym: e.sym, t: e.t, tag: e.tag, dir: e.dir, fwd: e.fwd, bed: e.bed }))])),
    dauerMin: Math.round((Date.now() - t0) / 60000) };
  const datei = path.join(OUT, 'lauf-' + iv + '-' + phase + '.json');
  fs.writeFileSync(datei, JSON.stringify(out));
  (log || console.log)('Geschrieben: ' + datei + ' (' + zeilen.length + ' Testzeilen, ' + out.dauerMin + ' Min)');
  return out;
}

module.exports = { lauf, ladeUniversum, bereite, statistik, aggregiere, istSitzung, HORIZONTE, COOLDOWN, KOSTEN_PP };

if (require.main === module) {
  const iv = process.argv[2], phase = process.argv[3] || 'entdeckung';
  const detArg = (process.argv.find(a => a.startsWith('--det=')) || '').slice(6);
  const maxArg = parseInt((process.argv.find(a => a.startsWith('--max=')) || '').slice(6), 10) || 0;
  let tab;
  try { tab = require(process.env.DETEKTOR_TABELLE || path.join(__dirname, 'detektoren.js')); }
  catch (e) { console.error('Detektortabelle fehlt: ' + e.message); process.exit(1); }
  const dets = detArg ? tab.filter(d => detArg.split(',').indexOf(d.key) !== -1) : tab;
  lauf({ iv, phase, detektoren: dets, max: maxArg });
}
