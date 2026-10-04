'use strict';
/* Faktor-ETF-Realitaetsprobe 2026-10 - der Lader. Kennung faktor-etf-realitaet-2026-10/v1.
 *
 *   node laden.js --roh <ordner> --protokoll <pruefsummen-x.json> SYM1 SYM2 ...
 *   node laden.js --roh <ordner> --protokoll <...> --gruppe g1      (alle Yahoo-Symbole der Gruppe aus fonds.json)
 *   node laden.js --roh <ordner> --protokoll <...> --ezb            (EZB-Referenzkurse USD, GBP, CHF je EUR)
 *   --neu   vorhandene Rohdateien neu laden (sonst wird nur die Pruefsumme der vorhandenen Datei notiert)
 *
 * Quelle: oeffentliche Yahoo-Chart-Schnittstelle (v8/finance/chart, interval=1d, events=div,splits,
 * capitalGains). Die Rohantworten sind Daten Dritter und bleiben AUSSERHALB des Repos (--roh);
 * ins Repo kommt nur das Protokoll mit Pruefsumme (SHA-256 der Rohbytes), Zeilenzahl und Randdaten.
 * Eine Antwort ohne Kerzen gilt als Fehlschlag, auch bei HTTP 200 (Yahoo liefert das sporadisch). */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const R = require('./rechnen.js');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';
const WARTEN_MS = [2000, 5000, 10000, 20000];
const TAKT_MS = 1200;

function schlaf(ms) { return new Promise((r) => setTimeout(r, ms)); }

function yahooUrl(host, sym, art) {
  const jetzt = Math.floor(Date.now() / 1000);
  const basis = 'https://' + host + '/v8/finance/chart/' + encodeURIComponent(sym) + '?interval=1d&events=div%2Csplits%2CcapitalGains&includeAdjustedClose=true';
  return art === 'max' ? basis + '&range=max' : basis + '&period1=0&period2=' + jetzt;
}

async function holeText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json,text/csv,*/*' } });
  const text = await r.text();
  return { status: r.status, text };
}

async function ladeYahoo(sym) {
  const versuche = [];
  const wege = [['query1.finance.yahoo.com', 'period'], ['query2.finance.yahoo.com', 'period'], ['query1.finance.yahoo.com', 'max'], ['query2.finance.yahoo.com', 'max']];
  for (let v = 0; v < WARTEN_MS.length + 1; v++) {
    const [host, art] = wege[v % wege.length];
    const url = yahooUrl(host, sym, art);
    try {
      const { status, text } = await holeText(url);
      let ok = false; let grund = 'HTTP ' + status;
      if (status === 200) {
        try {
          const j = JSON.parse(text);
          const r = R.leseYahoo(j);
          ok = r.tage.length > 0; grund = ok ? 'ok' : 'leer';
        } catch (e) { grund = 'unbrauchbar: ' + String(e.message || e).slice(0, 120); }
      }
      versuche.push({ host, art, status, grund });
      if (ok) return { text, url, versuche };
      if (status === 404) break; /* Symbol gibt es nicht - nicht weiter haemmern */
    } catch (e) {
      versuche.push({ host, art, grund: 'Netz: ' + String(e.message || e).slice(0, 120) });
    }
    if (v < WARTEN_MS.length) await schlaf(WARTEN_MS[v]);
  }
  return { text: null, versuche };
}

function schreibeAtomar(datei, text) {
  const tmp = datei + '.tmp-' + process.pid;
  fs.writeFileSync(tmp, text);
  fs.renameSync(tmp, datei);
}
function sha256(text) { return crypto.createHash('sha256').update(text).digest('hex'); }

function eintragYahoo(sym, text, extra) {
  const r = R.leseYahoo(JSON.parse(text));
  return Object.assign({
    sha256: sha256(text), bytes: Buffer.byteLength(text), waehrung: r.waehrung, boerse: r.boerse, zeitzone: r.zeitzone,
    erster: r.tage[0].d, letzter: r.tage[r.tage.length - 1].d, tage: r.tage.length,
    dividenden: r.div.length, kapitalgewinne: r.cg.length, splits: r.splits.length, ohneSchluss: r.ohneSchluss
  }, extra || {});
}

async function main() {
  const a = { syms: [] };
  for (let i = 2; i < process.argv.length; i++) {
    const x = process.argv[i];
    if (x === '--roh' || x === '--protokoll' || x === '--gruppe' || x === '--fonds') a[x.slice(2)] = process.argv[++i];
    else if (x === '--ezb' || x === '--neu') a[x.slice(2)] = true;
    else a.syms.push(x);
  }
  if (!a.roh || !a.protokoll) { console.error('Aufruf: node laden.js --roh <ordner> --protokoll <datei.json> [--gruppe gX | --ezb | SYM ...] [--neu]'); process.exit(2); }
  fs.mkdirSync(a.roh, { recursive: true });
  if (a.gruppe) {
    const liste = JSON.parse(fs.readFileSync(a.fonds || path.join(__dirname, 'fonds.json'), 'utf8')).fonds;
    for (const f of liste) if (a.gruppe === 'alle' || f.lauf === a.gruppe) for (const s of f.yahoo) if (!a.syms.includes(s)) a.syms.push(s);
  }
  const prot = fs.existsSync(a.protokoll) ? JSON.parse(fs.readFileSync(a.protokoll, 'utf8')) : { kennung: R.KENNUNG, eintraege: {} };
  const speichern = () => schreibeAtomar(a.protokoll, JSON.stringify(prot, null, 1) + '\n');

  if (a.ezb) {
    for (const w of ['USD', 'GBP', 'CHF']) {
      const datei = path.join(a.roh, 'EZB-' + w + '.csv');
      const url = 'https://data-api.ecb.europa.eu/service/data/EXR/D.' + w + '.EUR.SP00.A?format=csvdata';
      if (a.neu || !fs.existsSync(datei)) {
        const { status, text } = await holeText(url);
        if (status !== 200) { console.error('EZB ' + w + ': HTTP ' + status); continue; }
        const k = R.leseEzb(text);
        if (k.length < 1000) { console.error('EZB ' + w + ': nur ' + k.length + ' Kurse'); continue; }
        schreibeAtomar(datei, text);
      }
      const text = fs.readFileSync(datei, 'utf8');
      const k = R.leseEzb(text);
      prot.eintraege['EZB-' + w] = { quelle: url, sha256: sha256(text), bytes: Buffer.byteLength(text), erster: k[0].d, letzter: k[k.length - 1].d, kurse: k.length, geladen: new Date().toISOString() };
      speichern();
      console.log('EZB-' + w + ' ' + k.length + ' Kurse ' + k[0].d + ' .. ' + k[k.length - 1].d);
    }
  }

  for (const sym of a.syms) {
    const datei = path.join(a.roh, R.dateiname(sym));
    let text = null; let extra = {};
    if (!a.neu && fs.existsSync(datei)) {
      text = fs.readFileSync(datei, 'utf8');
      extra = { geladen: fs.statSync(datei).mtime.toISOString(), vorhanden: true };
    } else {
      const g = await ladeYahoo(sym);
      if (!g.text) {
        prot.eintraege[sym] = { fehler: 'nicht ladbar', versuche: g.versuche, geladen: new Date().toISOString() };
        speichern();
        console.log(sym + ' FEHLER ' + JSON.stringify(g.versuche));
        await schlaf(TAKT_MS);
        continue;
      }
      text = g.text;
      schreibeAtomar(datei, text);
      extra = { geladen: new Date().toISOString(), quelle: g.url.replace(/period2=\d+/, 'period2=<jetzt>'), versuche: g.versuche.length };
      await schlaf(TAKT_MS);
    }
    const e = eintragYahoo(sym, text, extra);
    prot.eintraege[sym] = e;
    speichern();
    console.log(sym + ' ' + e.waehrung + ' ' + e.erster + ' .. ' + e.letzter + ' ' + e.tage + ' Tage, ' + e.dividenden + ' Div, ' + e.kapitalgewinne + ' KG, ' + e.splits + ' Splits');
  }
}

if (require.main === module) main().catch((e) => { console.error(e); process.exit(1); });
module.exports = { yahooUrl, sha256, eintragYahoo };
