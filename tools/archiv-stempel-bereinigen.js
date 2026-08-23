'use strict';
/* Einmalige Bereinigung des Kursarchivs nach dem Stempel-Befund vom 22.08.2026.
 *
 * Was war: archiv.js ohneStempel entschied bei zwei nahen Eintraegen nach REIHENFOLGE
 * statt nach Rasterlage. Ein Yahoo-Quote-Stempel (krumme Uhrzeit, Volumen 0, H=L=C),
 * der zufaellig weiter als 0,9 Kerzenlaengen hinter der letzten echten Kerze eintraf
 * (17:29:31 nach 17:25:00 = 271 s, Schwelle 270 s), wurde behalten - und die 29 s
 * spaeter folgende ECHTE 17:30-Kerze galt als sein Stempel und fiel. Die Kette lief
 * weiter, bis eine Luecke sie brach. NVDA 5m verlor am 19.08.2026 so 17:30-19:50.
 *
 * archiv.js ist repariert und raeumt den Bestand beim naechsten Scan selbst auf - die
 * FEHLENDEN Kerzen holt es aber nicht zurueck. Dieses Werkzeug macht beides in einem
 * Zug: Stempel raus, Luecken per Yahoo-Abruf (dieselben btMode-Fenster wie die App)
 * wieder auffuellen.
 *
 * Aufruf (aus dem Projektordner):
 *   node tools/archiv-stempel-bereinigen.js                  Trockenlauf, aendert nichts
 *   node tools/archiv-stempel-bereinigen.js --schreiben      bereinigt den Bestand
 *   node tools/archiv-stempel-bereinigen.js --schreiben --nachladen   und fuellt die Luecken
 *   ... --auch-60m                                          nimmt die Stundenreihen dazu
 *
 * 60m steht bewusst hinter einem eigenen Schalter: Dort liegt das Raster NICHT auf der
 * vollen Stunde (Yahoos US-Kerzen beginnen 13:30 UTC), und die Reihen tragen 730
 * Handelstage Historie - ein Fehlgriff kostet dort am meisten. Der Abruf holt mit
 * range=730d entsprechend viel.
 *
 * Die App sollte dabei beendet sein: Sie haelt die Serien im Speicher und schreibt sie
 * alle 10 Minuten zurueck - ein Flush waehrend des Laufs macht die Bereinigung wieder
 * zunichte. Das Werkzeug prueft darum vor jedem Schreiben, ob die Datei sich seit dem
 * Einlesen veraendert hat, und ueberspringt sie in dem Fall (Meldung am Ende). */

const fs = require('fs');
const path = require('path');
const https = require('https');
const A = require('../archiv.js');

const STORE = process.env.MD_STORE ||
  path.join(process.env.APPDATA || path.join(process.env.HOME || '', 'AppData', 'Roaming'), 'markt-dashboard', 'store');
const SCHREIBEN = process.argv.indexOf('--schreiben') !== -1;
const NACHLADEN = process.argv.indexOf('--nachladen') !== -1;
const AUCH60 = process.argv.indexOf('--auch-60m') !== -1;

/* Fenster wie INTERVAL_CFG.btRange in depot.js: das ist bewusst das MESS-Fenster,
 * nicht das Live-Fenster - nur so reicht der Abruf bis zum 19.08. zurueck.
 * 1m gibt Yahoo hoechstens 7 Tage; fuer den 19.08. ist das am 22.08. knapp, aber drin. */
const IV = {
  '1m':  { barMin: 1,  range: '7d'  },
  '5m':  { barMin: 5,  range: '60d' },
  '15m': { barMin: 15, range: '60d' }
};
if (AUCH60) IV['60m'] = { barMin: 60, range: '730d' };
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36';

function warte(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

function holen(url) {
  return new Promise(function (resolve) {
    const req = https.get(url, { headers: { 'User-Agent': UA, 'Accept': 'application/json,*/*' }, timeout: 20000 }, function (res) {
      let d = '';
      res.setEncoding('utf8');
      res.on('data', function (c) { d += c; });
      res.on('end', function () { resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode || 0, body: d }); });
    });
    req.on('timeout', function () { req.destroy(); resolve({ ok: false, status: 0, body: 'Timeout' }); });
    req.on('error', function (e) { resolve({ ok: false, status: 0, body: String(e.message || e) }); });
  });
}

/* Kerzen von Yahoo - Feldbelegung identisch zu depot.js fetchIntradayYahoo:
 * [t, close, volumen, hoch, tief]. */
async function yahoo(sym, iv) {
  const url = 'https://query1.finance.yahoo.com/v8/finance/chart/' + encodeURIComponent(sym) +
    '?range=' + IV[iv].range + '&interval=' + iv;
  let res = await holen(url);
  if (!res.ok && res.status === 429) { await warte(5000); res = await holen(url); }
  if (!res.ok) return { fehler: 'HTTP ' + res.status };
  try {
    const r = JSON.parse(res.body).chart.result[0];
    const q = r.indicators.quote[0];
    const ts = r.timestamp || [], cl = q.close || [], vo = q.volume || [], hi = q.high || [], lo = q.low || [];
    const out = [];
    for (let i = 0; i < ts.length; i++) {
      if (cl[i] == null) continue;
      out.push([ts[i] * 1000, cl[i], vo[i] || 0, hi[i] == null ? cl[i] : hi[i], lo[i] == null ? cl[i] : lo[i]]);
    }
    return { series: out };
  } catch (e) { return { fehler: 'Antwort unlesbar' }; }
}

const BACKUP_DIR = path.join(STORE, '..', 'backup-stempel-' + new Date().toISOString().slice(0, 10));

function sichere(datei) {
  if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });
  const ziel = path.join(BACKUP_DIR, path.basename(datei));
  if (!fs.existsSync(ziel)) fs.copyFileSync(datei, ziel);   // nie eine Sicherung ueberschreiben
}

/* Fehlende Rasterkerzen zwischen erster und letzter Kerze eines Tages - das Mass
 * dafuer, was die Stempelkette gekostet hat (und was das Nachladen zurueckholt). */
function luecken(bars, step, tage) {
  const proTag = {};
  bars.forEach(function (b) {
    const d = new Date(b[0]).toISOString().slice(0, 10);
    if (tage && !tage[d]) return;
    (proTag[d] = proTag[d] || []).push(b[0]);
  });
  let fehlt = 0;
  Object.keys(proTag).forEach(function (d) {
    const ts = proTag[d];
    const von = Math.min.apply(null, ts), bis = Math.max.apply(null, ts);
    fehlt += Math.max(0, Math.floor((bis - von) / step) + 1 - ts.length);
  });
  return fehlt;
}

async function main() {
  if (!fs.existsSync(STORE)) { console.error('Store nicht gefunden: ' + STORE); process.exit(1); }
  console.log('Store:  ' + STORE);
  console.log('Modus:  ' + (SCHREIBEN ? 'SCHREIBEN' : 'Trockenlauf (nichts wird geaendert)') + (NACHLADEN ? ' + NACHLADEN' : ''));
  if (SCHREIBEN) console.log('Sicherung: ' + BACKUP_DIR);
  console.log('');

  const bilanz = { geprueft: 0, betroffen: 0, entfernt: 0, ergaenzt: 0, geschrieben: 0,
                   luecke_vor: 0, luecke_nach: 0, kollision: [], fehler: [] };

  for (const iv of Object.keys(IV)) {
    const step = IV[iv].barMin * 60000;
    const dateien = fs.readdirSync(STORE).filter(function (f) { return f.indexOf('bars_' + iv + '_') === 0 && /\.json$/.test(f); });
    console.log('=== ' + iv + ' (' + dateien.length + ' Reihen, Nachlade-Fenster range=' + IV[iv].range + ') ===');

    for (const datei of dateien) {
      const voll = path.join(STORE, datei);
      const sym = datei.slice(('bars_' + iv + '_').length, -5);
      bilanz.geprueft++;
      let st, mtime;
      try { mtime = fs.statSync(voll).mtimeMs; st = JSON.parse(fs.readFileSync(voll, 'utf8')); }
      catch (e) { bilanz.fehler.push(datei + ': unlesbar'); continue; }
      const alt = (st && st.series) || [];
      if (!alt.length) continue;

      const behalten = new Set(A.ohneStempel(alt, IV[iv].barMin));
      const stempel = alt.filter(function (b) { return !behalten.has(b); });
      if (!stempel.length) continue;                          // diese Reihe ist sauber

      // Die Tage, an denen Stempel standen - nur dort kann die Kette Kerzen gekostet haben.
      const tage = {};
      stempel.forEach(function (b) { tage[new Date(b[0]).toISOString().slice(0, 10)] = 1; });
      const sauber = alt.filter(function (b) { return behalten.has(b); });
      const vorLuecke = luecken(sauber, step, tage);

      let neu = sauber, dazu = 0, hinweis = '';
      if (NACHLADEN) {
        const r = await yahoo(sym, iv);
        await warte(250);                                     // rund 3 Anfragen/s, wie der Messlauf
        if (r.fehler) { hinweis = ' - Nachladen fehlgeschlagen: ' + r.fehler; bilanz.fehler.push(datei + ' ' + iv + ': ' + r.fehler); }
        else {
          neu = A.kappeTage(A.ohneStempel(A.mischeBars(sauber, r.series), IV[iv].barMin), A.fensterFuer(iv));
          dazu = neu.length - sauber.length;
        }
      }
      const nachLuecke = luecken(neu, step, tage);
      bilanz.betroffen++;
      bilanz.entfernt += stempel.length;
      bilanz.ergaenzt += Math.max(0, dazu);
      bilanz.luecke_vor += vorLuecke;
      bilanz.luecke_nach += nachLuecke;

      console.log('  ' + sym.padEnd(9) + String(alt.length).padStart(7) + ' Bars   -' + String(stempel.length).padStart(3) + ' Stempel   ' +
        (NACHLADEN ? (dazu >= 0 ? '+' : '') + String(dazu).padStart(4) + ' Kerzen   ' : '') +
        'Luecke ' + vorLuecke + (NACHLADEN ? ' -> ' + nachLuecke : '') +
        '   [' + Object.keys(tage).join(' ') + ']' + hinweis);

      if (SCHREIBEN) {
        // Race mit der laufenden App: hat sie die Datei zwischenzeitlich geflusht,
        // waere unsere Fassung veraltet - dann lieber ueberspringen.
        let jetztM;
        try { jetztM = fs.statSync(voll).mtimeMs; } catch (e) { jetztM = mtime; }
        if (jetztM !== mtime) { bilanz.kollision.push(datei); continue; }
        sichere(voll);
        const wert = { series: A.schlank(neu), updatedAt: Date.now() };
        if (st.capBereiche && st.capBereiche.length) wert.capBereiche = st.capBereiche;   // Kennzeichnung erhalten
        const tmp = voll + '.tmp';
        fs.writeFileSync(tmp, JSON.stringify(wert));
        fs.renameSync(tmp, voll);
        bilanz.geschrieben++;
      }
    }
    console.log('');
  }

  console.log('---------------------------------------------------------------');
  console.log('Reihen geprueft:      ' + bilanz.geprueft);
  console.log('Reihen betroffen:     ' + bilanz.betroffen);
  console.log('Stempel entfernt:     ' + bilanz.entfernt);
  console.log('Kerzen nachgeladen:   ' + bilanz.ergaenzt);
  console.log('Fehlende Kerzen an den betroffenen Tagen: ' + bilanz.luecke_vor + ' -> ' + bilanz.luecke_nach);
  console.log('Dateien geschrieben:  ' + bilanz.geschrieben + (SCHREIBEN ? '' : '  (Trockenlauf)'));
  if (bilanz.kollision.length) {
    console.log('Uebersprungen, weil die App waehrenddessen geschrieben hat: ' + bilanz.kollision.length);
    console.log('   ' + bilanz.kollision.join(', '));
    console.log('   -> App beenden und den Lauf wiederholen.');
  }
  if (bilanz.fehler.length) {
    console.log('Fehler: ' + bilanz.fehler.length);
    bilanz.fehler.slice(0, 25).forEach(function (f) { console.log('   ' + f); });
  }
}

main();
